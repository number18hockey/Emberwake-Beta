import json
import tempfile
import threading
import unittest
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
import sys
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import social_server


class SocialApiTests(unittest.TestCase):
    def setUp(self):
        with social_server.RATE_LOCK:
            social_server.RATE_BUCKETS.clear()
        self.temp = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp.name) / "social.sqlite3"
        social_server.init_db(self.db_path)
        handler = partial(social_server.SocialHandler, directory=str(social_server.STATIC_ROOT))
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        self.server.social_db = self.db_path
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"
        self.alice = self.call("POST", "/api/register", {"username": "Alice", "password": "password-one"})
        self.bob = self.call("POST", "/api/register", {"username": "Bob", "password": "password-two"})
        self.eve = self.call("POST", "/api/register", {"username": "Eve", "password": "password-three"})

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temp.cleanup()

    def call(self, method, path, body=None, token=None, expected=200):
        data = None if body is None else json.dumps(body).encode()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        request = Request(self.base + path, data=data, headers=headers, method=method)
        try:
            with urlopen(request, timeout=3) as response:
                status, raw = response.status, response.read()
        except HTTPError as error:
            status, raw = error.code, error.read()
            error.close()
        self.assertEqual(status, expected, raw.decode())
        return json.loads(raw)

    def add_friends(self):
        self.call("POST", "/api/friends/request", {"username": "Bob"}, self.alice["token"])
        self.call("POST", "/api/friends/respond", {"username": "Alice", "accept": True}, self.bob["token"])

    def test_accounts_have_hashed_credentials_and_separate_wallets(self):
        self.assertEqual(self.call("GET", "/api/social", token=self.alice["token"])["coins"], social_server.STARTER_COINS)
        with social_server.database(self.db_path) as db:
            row = db.execute("SELECT salt,password_hash FROM users WHERE username_key='alice'").fetchone()
            self.assertNotEqual(row["password_hash"], b"password-one")
            self.assertEqual(len(row["salt"]), 16)
        self.call("POST", "/api/register", {"username": "aLiCe", "password": "password-four"}, expected=409)

    def test_service_serves_game_with_social_entrypoint(self):
        with urlopen(self.base + "/Emberwake.html", timeout=5) as response:
            page = response.read().decode("utf-8")
        self.assertIn("socialOpen", page)
        self.assertIn("SOCIAL", page)

    def test_friend_requests_gate_private_messages(self):
        self.call("POST", "/api/messages", {"to": "Bob", "text": "hello"}, self.alice["token"], expected=400)
        self.add_friends()
        sent = self.call("POST", "/api/messages", {"to": "Bob", "text": "hello"}, self.alice["token"])
        self.assertGreater(sent["id"], 0)
        messages = self.call("GET", "/api/messages?with=alice&after=0", token=self.bob["token"])
        self.assertEqual(messages["messages"][0]["text"], "hello")
        self.call("GET", "/api/messages?with=alice&after=0", token=self.eve["token"], expected=400)

    def test_activity_is_only_returned_to_accepted_friends(self):
        self.call("POST", "/api/presence", {"activity": "Exploring <the woods>"}, self.alice["token"])
        self.assertFalse(self.call("GET", "/api/social", token=self.bob["token"])["friends"])
        self.add_friends()
        friend = self.call("GET", "/api/social", token=self.bob["token"])["friends"][0]
        self.assertTrue(friend["online"])
        self.assertEqual(friend["activity"], "Exploring <the woods>")
        self.call("POST", "/api/logout", {}, self.alice["token"])
        friend = self.call("GET", "/api/social", token=self.bob["token"])["friends"][0]
        self.assertFalse(friend["online"])

    def test_coin_transfer_is_atomic_idempotent_and_friend_only(self):
        self.add_friends()
        transfer = {"to": "Bob", "amount": 25, "requestKey": "request-0001"}
        result = self.call("POST", "/api/coins/send", transfer, self.alice["token"])
        again = self.call("POST", "/api/coins/send", transfer, self.alice["token"])
        self.assertEqual(result["coins"], again["coins"])
        self.assertEqual(result["coins"], max(0, social_server.STARTER_COINS - 25))
        bob = self.call("GET", "/api/social", token=self.bob["token"])
        self.assertEqual(bob["coins"], social_server.STARTER_COINS + 25)
        messages = self.call("GET", "/api/messages?with=alice&after=0", token=self.bob["token"])["messages"]
        self.assertIn("Sent 25 Ember coins.", [message["text"] for message in messages])
        conflict = dict(transfer, amount=20)
        self.call("POST", "/api/coins/send", conflict, self.alice["token"], expected=409)
        self.call("POST", "/api/coins/send", {"to": "Eve", "amount": 1, "requestKey": "request-0002"}, self.alice["token"], expected=400)

    def test_authentication_required_and_message_size_bounded(self):
        self.call("GET", "/api/social", expected=401)
        self.add_friends()
        self.call("POST", "/api/messages", {"to": "Bob", "text": "x" * 501}, self.alice["token"], expected=400)


if __name__ == "__main__":
    unittest.main()
