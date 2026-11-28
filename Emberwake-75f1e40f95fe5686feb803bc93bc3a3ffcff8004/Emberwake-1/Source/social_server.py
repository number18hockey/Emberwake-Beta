#!/usr/bin/env python3
"""Small same-origin social service for Emberwake."""
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import threading
import time
from contextlib import contextmanager
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


SOURCE = Path(__file__).resolve().parent
STATIC_ROOT = SOURCE.parent
DB_PATH = Path(os.environ.get(
    "EMBERWAKE_SOCIAL_DB",
    Path.home() / ".emberwake-social" / "social.sqlite3",
))
HOST = os.environ.get("EMBERWAKE_SOCIAL_HOST", "127.0.0.1")
PORT = int(os.environ.get("EMBERWAKE_SOCIAL_PORT", "8765"))
STARTER_COINS = max(0, min(100_000, int(os.environ.get("EMBERWAKE_STARTER_COINS", "100"))))
SESSION_SECONDS = 30 * 24 * 60 * 60
USERNAME_RE = re.compile(r"^[A-Za-z0-9_-]{3,18}$")
REQUEST_KEY_RE = re.compile(r"^[A-Za-z0-9_-]{8,80}$")
RATE_LOCK = threading.Lock()
RATE_BUCKETS = {}


def connect_db(path):
    db = sqlite3.connect(path, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db


@contextmanager
def database(path):
    db = connect_db(path)
    try:
        with db:
            yield db
    finally:
        db.close()


def init_db(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with database(path) as db:
        db.executescript("""
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL,
                username_key TEXT NOT NULL UNIQUE,
                salt BLOB NOT NULL,
                password_hash BLOB NOT NULL,
                created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash BLOB PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS friend_requests (
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at INTEGER NOT NULL,
                PRIMARY KEY (sender_id, receiver_id)
            );
            CREATE TABLE IF NOT EXISTS friendships (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at INTEGER NOT NULL,
                PRIMARY KEY (user_id, friend_id),
                CHECK (user_id != friend_id)
            );
            CREATE TABLE IF NOT EXISTS presence (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                activity TEXT NOT NULL DEFAULT '',
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS wallets (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0)
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY,
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                body TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS messages_pair_idx
                ON messages(sender_id, receiver_id, id);
            CREATE TABLE IF NOT EXISTS coin_transfers (
                id INTEGER PRIMARY KEY,
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                request_key TEXT NOT NULL,
                amount INTEGER NOT NULL CHECK (amount > 0),
                created_at INTEGER NOT NULL,
                UNIQUE(sender_id, request_key)
            );
        """)
        db.execute("DELETE FROM sessions WHERE expires_at<=?", (int(time.time()),))


def hash_token(token):
    return hashlib.sha256(token.encode("ascii")).digest()


def hash_password(password, salt):
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)


def public_user(row):
    return {"username": row["username"]}


class SocialHandler(SimpleHTTPRequestHandler):
    server_version = "EmberwakeSocial/1"

    def log_message(self, fmt, *args):
        if os.environ.get("EMBERWAKE_SOCIAL_ACCESS_LOG") == "1":
            super().log_message(fmt, *args)

    @property
    def db_path(self):
        return getattr(self.server, "social_db", DB_PATH)

    def send_json(self, status, value):
        body = json.dumps(value, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ValueError("Invalid request body.")
        if length < 1 or length > 16_384:
            raise ValueError("Request body must be between 1 and 16384 bytes.")
        try:
            value = json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise ValueError("Request body must be valid JSON.")
        if not isinstance(value, dict):
            raise ValueError("Request body must be a JSON object.")
        return value

    def rate_limit(self, key, limit, seconds):
        now = time.time()
        bucket_key = (self.client_address[0], key)
        with RATE_LOCK:
            marks = [t for t in RATE_BUCKETS.get(bucket_key, []) if now - t < seconds]
            if len(marks) >= limit:
                RATE_BUCKETS[bucket_key] = marks
                return False
            marks.append(now)
            RATE_BUCKETS[bucket_key] = marks
            if len(RATE_BUCKETS) > 10_000:
                for old_key in list(RATE_BUCKETS):
                    if not RATE_BUCKETS[old_key] or now - RATE_BUCKETS[old_key][-1] > 3600:
                        RATE_BUCKETS.pop(old_key, None)
            return True

    def require_auth(self, db):
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer ") or len(auth) > 180:
            raise PermissionError("Sign in to use the social board.")
        token = auth[7:]
        if not re.fullmatch(r"[A-Za-z0-9_-]{20,128}", token):
            raise PermissionError("Sign in to use the social board.")
        row = db.execute(
            "SELECT u.id, u.username FROM sessions s JOIN users u ON u.id=s.user_id "
            "WHERE s.token_hash=? AND s.expires_at>?",
            (hash_token(token), int(time.time())),
        ).fetchone()
        if not row:
            raise PermissionError("Your online session expired. Sign in again.")
        return row

    def route(self):
        path = urlsplit(self.path)
        if not path.path.startswith("/api/"):
            return False
        method, route = self.command, path.path
        try:
            with database(self.db_path) as db:
                if method == "POST" and route in ("/api/register", "/api/login"):
                    return self.auth_route(db, route)
                user = self.require_auth(db)
                uid = user["id"]
                if method == "POST" and route == "/api/logout":
                    db.execute("DELETE FROM sessions WHERE token_hash=?", (hash_token(self.headers["Authorization"][7:]),))
                    db.execute("DELETE FROM presence WHERE user_id=?", (uid,))
                    db.commit()
                    return self.send_json(200, {"ok": True})
                if method == "GET" and route == "/api/social":
                    return self.social_state(db, user)
                if method == "POST" and route == "/api/friends/request":
                    return self.friend_request(db, user)
                if method == "POST" and route == "/api/friends/respond":
                    return self.friend_respond(db, user)
                if method == "POST" and route == "/api/friends/remove":
                    return self.friend_remove(db, user)
                if method == "POST" and route == "/api/messages":
                    return self.message_send(db, user)
                if method == "GET" and route == "/api/messages":
                    return self.message_list(db, user, path.query)
                if method == "POST" and route == "/api/presence":
                    return self.presence_update(db, user)
                if method == "POST" and route == "/api/coins/send":
                    return self.coins_send(db, user)
            self.send_json(404, {"error": "That social feature was not found."})
        except PermissionError as exc:
            self.send_json(401, {"error": str(exc)})
        except ValueError as exc:
            self.send_json(400, {"error": str(exc)})
        except sqlite3.IntegrityError:
            self.send_json(409, {"error": "That action conflicts with the current social state."})
        return True

    def auth_route(self, db, route):
        if not self.rate_limit("auth", 12, 300):
            return self.send_json(429, {"error": "Too many sign-in attempts. Try again in a few minutes."})
        data = self.read_json()
        username = data.get("username")
        password = data.get("password")
        if not isinstance(username, str) or not USERNAME_RE.fullmatch(username):
            raise ValueError("Username must be 3-18 letters, numbers, underscores, or hyphens.")
        if not isinstance(password, str) or not 8 <= len(password) <= 128:
            raise ValueError("Password must be 8-128 characters.")
        key = username.casefold()
        if route == "/api/register":
            salt = secrets.token_bytes(16)
            try:
                with db:
                    cur = db.execute(
                        "INSERT INTO users(username,username_key,salt,password_hash,created_at) VALUES(?,?,?,?,?)",
                        (username, key, salt, hash_password(password, salt), int(time.time())),
                    )
                    uid = cur.lastrowid
                    db.execute("INSERT INTO wallets(user_id,coins) VALUES(?,?)", (uid, STARTER_COINS))
            except sqlite3.IntegrityError:
                return self.send_json(409, {"error": "That online username is already taken."})
            row = db.execute("SELECT id,username FROM users WHERE id=?", (uid,)).fetchone()
        else:
            row = db.execute(
                "SELECT id,username,salt,password_hash FROM users WHERE username_key=?", (key,)
            ).fetchone()
            candidate = hash_password(password, row["salt"] if row else bytes(16))
            if not row or not hmac.compare_digest(candidate, row["password_hash"]):
                return self.send_json(401, {"error": "That username or password is not correct."})
            uid = row["id"]
        token = secrets.token_urlsafe(32)
        expires = int(time.time()) + SESSION_SECONDS
        db.execute(
            "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",
            (hash_token(token), uid, expires),
        )
        db.commit()
        return self.send_json(200, {
            "token": token,
            "user": public_user(row),
            "expiresAt": expires,
        })

    def social_state(self, db, user):
        uid = user["id"]
        friends = db.execute(
            "SELECT u.username, COALESCE(p.activity,'') activity, COALESCE(p.updated_at,0) updated_at "
            "FROM friendships f JOIN users u ON u.id=f.friend_id "
            "LEFT JOIN presence p ON p.user_id=u.id "
            "WHERE f.user_id=? ORDER BY u.username_key",
            (uid,),
        ).fetchall()
        requests = db.execute(
            "SELECT u.username FROM friend_requests r JOIN users u ON u.id=r.sender_id "
            "WHERE r.receiver_id=? ORDER BY r.created_at",
            (uid,),
        ).fetchall()
        outgoing = db.execute(
            "SELECT u.username FROM friend_requests r JOIN users u ON u.id=r.receiver_id "
            "WHERE r.sender_id=? ORDER BY r.created_at",
            (uid,),
        ).fetchall()
        wallet = db.execute("SELECT coins FROM wallets WHERE user_id=?", (uid,)).fetchone()
        now = int(time.time())
        return self.send_json(200, {
            "user": public_user(user),
            "coins": wallet["coins"],
            "friends": [{
                "username": r["username"],
                "online": now - r["updated_at"] <= 90,
                "activity": r["activity"] if now - r["updated_at"] <= 90 else "",
            } for r in friends],
            "incoming": [r["username"] for r in requests],
            "outgoing": [r["username"] for r in outgoing],
        })

    @staticmethod
    def username_field(data, key="username"):
        value = data.get(key)
        if not isinstance(value, str) or not USERNAME_RE.fullmatch(value):
            raise ValueError("Enter a valid online username.")
        return value.casefold()

    def friend_request(self, db, user):
        if not self.rate_limit("friend-request", 20, 3600):
            return self.send_json(429, {"error": "Too many friend requests. Try again later."})
        target_key = self.username_field(self.read_json())
        target = db.execute("SELECT id FROM users WHERE username_key=?", (target_key,)).fetchone()
        if not target:
            raise ValueError("No online account has that username.")
        if target["id"] == user["id"]:
            raise ValueError("You cannot add yourself.")
        if db.execute("SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?", (user["id"], target["id"])).fetchone():
            return self.send_json(409, {"error": "You are already friends."})
        if db.execute("SELECT 1 FROM friend_requests WHERE sender_id=? AND receiver_id=?", (target["id"], user["id"])).fetchone():
            return self.send_json(409, {"error": "They already sent you a request. Accept it in your incoming requests."})
        db.execute(
            "INSERT INTO friend_requests(sender_id,receiver_id,created_at) VALUES(?,?,?)",
            (user["id"], target["id"], int(time.time())),
        )
        db.commit()
        return self.send_json(200, {"ok": True})

    def friend_respond(self, db, user):
        data = self.read_json()
        target_key = self.username_field(data)
        accept = data.get("accept")
        if not isinstance(accept, bool):
            raise ValueError("Choose whether to accept the request.")
        target = db.execute("SELECT id FROM users WHERE username_key=?", (target_key,)).fetchone()
        if not target or not db.execute(
            "SELECT 1 FROM friend_requests WHERE sender_id=? AND receiver_id=?",
            (target["id"], user["id"]),
        ).fetchone():
            raise ValueError("That friend request is no longer waiting.")
        with db:
            db.execute("DELETE FROM friend_requests WHERE sender_id=? AND receiver_id=?", (target["id"], user["id"]))
            if accept:
                now = int(time.time())
                db.execute("INSERT INTO friendships(user_id,friend_id,created_at) VALUES(?,?,?)", (user["id"], target["id"], now))
                db.execute("INSERT INTO friendships(user_id,friend_id,created_at) VALUES(?,?,?)", (target["id"], user["id"], now))
        db.commit()
        return self.send_json(200, {"ok": True})

    def friend_remove(self, db, user):
        target_key = self.username_field(self.read_json())
        target = db.execute("SELECT id FROM users WHERE username_key=?", (target_key,)).fetchone()
        if not target:
            raise ValueError("That friend was not found.")
        if not db.execute("SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?", (user["id"], target["id"])).fetchone():
            raise ValueError("That user is not in your friends list.")
        with db:
            db.execute("DELETE FROM friendships WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)",
                       (user["id"], target["id"], target["id"], user["id"]))
        db.commit()
        return self.send_json(200, {"ok": True})

    def message_send(self, db, user):
        if not self.rate_limit("message", 60, 60):
            return self.send_json(429, {"error": "You are sending messages too quickly."})
        data = self.read_json()
        target_key = self.username_field(data, "to")
        body = data.get("text")
        if not isinstance(body, str):
            raise ValueError("Message text is required.")
        body = body.strip()
        if not body or len(body) > 500:
            raise ValueError("Messages must be 1-500 characters.")
        target = db.execute("SELECT id FROM users WHERE username_key=?", (target_key,)).fetchone()
        if not target or not db.execute(
            "SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?",
            (user["id"], target["id"]),
        ).fetchone():
            raise ValueError("You can only message an accepted friend.")
        if not self.rate_limit("message-target-" + str(target["id"]), 20, 60):
            return self.send_json(429, {"error": "Too many messages to that friend. Try again shortly."})
        cur = db.execute(
            "INSERT INTO messages(sender_id,receiver_id,body,created_at) VALUES(?,?,?,?)",
            (user["id"], target["id"], body, int(time.time())),
        )
        db.commit()
        return self.send_json(200, {"id": cur.lastrowid})

    def message_list(self, db, user, query):
        args = parse_qs(query)
        target_key = args.get("with", [""])[0]
        if not USERNAME_RE.fullmatch(target_key):
            raise ValueError("Choose a valid friend to open the chat.")
        try:
            after = max(0, int(args.get("after", ["0"])[0]))
        except ValueError:
            raise ValueError("Invalid message cursor.")
        target = db.execute("SELECT id,username FROM users WHERE username_key=?", (target_key.casefold(),)).fetchone()
        if not target or not db.execute(
            "SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?",
            (user["id"], target["id"]),
        ).fetchone():
            raise ValueError("You can only open a chat with an accepted friend.")
        ordering = "DESC" if after == 0 else "ASC"
        rows = db.execute(
            "SELECT m.id,m.sender_id,s.username sender,m.body,m.created_at FROM messages m "
            "JOIN users s ON s.id=m.sender_id WHERE m.id>? AND "
            "((m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?)) "
            f"ORDER BY m.id {ordering} LIMIT 100",
            (after, user["id"], target["id"], target["id"], user["id"]),
        ).fetchall()
        if after == 0:
            rows = list(reversed(rows))
        return self.send_json(200, {"messages": [{
            "id": r["id"], "from": r["sender"], "text": r["body"], "time": r["created_at"],
        } for r in rows]})

    def presence_update(self, db, user):
        if not self.rate_limit("presence", 6, 60):
            return self.send_json(429, {"error": "Presence updates are arriving too quickly."})
        data = self.read_json()
        activity = data.get("activity", "")
        if not isinstance(activity, str):
            raise ValueError("Activity must be text.")
        activity = re.sub(r"[\x00-\x1f\x7f]", "", activity).strip()[:80]
        db.execute(
            "INSERT INTO presence(user_id,activity,updated_at) VALUES(?,?,?) "
            "ON CONFLICT(user_id) DO UPDATE SET activity=excluded.activity,updated_at=excluded.updated_at",
            (user["id"], activity, int(time.time())),
        )
        db.commit()
        return self.send_json(200, {"ok": True})

    def coins_send(self, db, user):
        if not self.rate_limit("coins", 30, 3600):
            return self.send_json(429, {"error": "Too many coin transfers. Try again later."})
        data = self.read_json()
        target_key = self.username_field(data, "to")
        amount = data.get("amount")
        request_key = data.get("requestKey")
        if isinstance(amount, bool) or not isinstance(amount, int) or not 1 <= amount <= 10_000:
            raise ValueError("Choose a whole number from 1 to 10000 coins.")
        if not isinstance(request_key, str) or not REQUEST_KEY_RE.fullmatch(request_key):
            raise ValueError("Refresh the board and try the transfer again.")
        target = db.execute("SELECT id FROM users WHERE username_key=?", (target_key,)).fetchone()
        if not target or not db.execute(
            "SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?",
            (user["id"], target["id"]),
        ).fetchone():
            raise ValueError("You can only send coins to an accepted friend.")
        if target["id"] == user["id"]:
            raise ValueError("You cannot send coins to yourself.")
        with db:
            prior = db.execute(
                "SELECT receiver_id,amount FROM coin_transfers WHERE sender_id=? AND request_key=?",
                (user["id"], request_key),
            ).fetchone()
            if prior:
                if prior["receiver_id"] != target["id"] or prior["amount"] != amount:
                    return self.send_json(409, {"error": "That coin transfer key was already used."})
                return self.send_json(200, {"ok": True, "coins": db.execute(
                    "SELECT coins FROM wallets WHERE user_id=?", (user["id"],)
                ).fetchone()["coins"]})
            debit = db.execute(
                "UPDATE wallets SET coins=coins-? WHERE user_id=? AND coins>=?",
                (amount, user["id"], amount),
            )
            if debit.rowcount != 1:
                return self.send_json(409, {"error": "You do not have enough online Ember coins."})
            db.execute("UPDATE wallets SET coins=coins+? WHERE user_id=?", (amount, target["id"]))
            db.execute(
                "INSERT INTO coin_transfers(sender_id,receiver_id,request_key,amount,created_at) VALUES(?,?,?,?,?)",
                (user["id"], target["id"], request_key, amount, int(time.time())),
            )
            db.execute(
                "INSERT INTO messages(sender_id,receiver_id,body,created_at) VALUES(?,?,?,?)",
                (user["id"], target["id"], f"Sent {amount} Ember coin{'s' if amount != 1 else ''}.", int(time.time())),
            )
        db.commit()
        balance = db.execute("SELECT coins FROM wallets WHERE user_id=?", (user["id"],)).fetchone()["coins"]
        return self.send_json(200, {"ok": True, "coins": balance})

    def do_GET(self):
        if self.route() is False:
            super().do_GET()

    def do_POST(self):
        if self.route() is False:
            self.send_json(404, {"error": "That page was not found."})


def main():
    init_db(DB_PATH)
    handler = partial(SocialHandler, directory=str(STATIC_ROOT))
    server = ThreadingHTTPServer((HOST, PORT), handler)
    server.social_db = DB_PATH
    print(f"Emberwake social service listening at http://{HOST}:{PORT}")
    if HOST not in ("127.0.0.1", "localhost", "::1"):
        print("Public deployments must terminate HTTPS at a trusted reverse proxy.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
