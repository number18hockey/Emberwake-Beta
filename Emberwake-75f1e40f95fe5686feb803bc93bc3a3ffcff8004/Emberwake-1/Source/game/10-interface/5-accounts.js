// ============================================================
//  THE HEARTH: the sign-in board, built with the menu kit.
//  The first place of the game. THE LEDGER lists the accounts kept
//  in this browser; the door beside it signs one in (or sets the
//  password of an account from before passwords, or shows who is
//  signed in). A NEW WAKER makes an account; THE LOOK changes it.
//  How accounts and passwords are kept is 13-saving/1-saving.js.
// ============================================================
Object.assign(MENU_ART, {
  // a hanging lantern; a wrong password dims it for a moment
  lantern(c, x, y) {
    const now = performance.now(), f = (now / 110) | 0, dim = now - (ACCOUNT.dimT || -1e9) < 300;
    c.fillStyle = '#365058'; c.fillRect(x + 7, y, 2, 2); c.fillRect(x + 4, y + 2, 8, 2); c.fillRect(x + 3, y + 4, 1, 9); c.fillRect(x + 12, y + 4, 1, 9); c.fillRect(x + 4, y + 13, 8, 2);
    c.fillStyle = dim ? '#3a2a30' : '#b8672a'; c.fillRect(x + 4, y + 4, 8, 9);
    c.fillStyle = dim ? '#5a3a22' : '#ffb347'; c.fillRect(x + 5 + (f % 3 === 0 ? 1 : 0), y + 6 + (f & 1), 5, 7 - (f & 1));
    c.fillStyle = dim ? '#7a4a2a' : '#fff1a8'; c.fillRect(x + 7, y + 9 + (f & 1), 2, 3 - (f & 1));
    c.fillStyle = '#4b6d78'; c.fillRect(x + 5, y + 15, 6, 1);
  },
  // the ledger: a bound book of names, its ribbon stirring
  ledger(c, x, y) {
    const f = (performance.now() / 110) | 0;
    c.fillStyle = '#6b4a2f'; c.fillRect(x + 2, y + 2, 12, 13); c.fillStyle = '#e3d8c2'; c.fillRect(x + 4, y + 3, 9, 11); c.fillStyle = '#4a3220'; c.fillRect(x + 2, y + 2, 2, 13);
    c.fillStyle = '#8b8fa3'; c.fillRect(x + 6, y + 5, 5, 1); c.fillRect(x + 6, y + 8, 6, 1); c.fillRect(x + 6, y + 11, 4, 1);
    c.fillStyle = '#c94a4e'; c.fillRect(x + 10, y + 13, 2, 3 + ((f >> 2) & 1));
  },
  // a key, a glint running along it
  key(c, x, y) {
    const f = (performance.now() / 110) | 0;
    c.fillStyle = '#ffd35a'; c.fillRect(x + 1, y + 4, 7, 7); c.fillRect(x + 8, y + 6, 7, 2); c.fillRect(x + 12, y + 8, 1, 3); c.fillRect(x + 14, y + 8, 1, 2);
    c.fillStyle = INK; c.fillRect(x + 3, y + 6, 3, 3);
    c.fillStyle = '#b8862a'; c.fillRect(x + 1, y + 10, 7, 1);
    c.fillStyle = '#fff1a8'; c.fillRect(x + 1 + (f % 14), y + 6, 1, 1);
  },
  // a hand mirror with a light passing over the glass
  mirror(c, x, y) {
    const f = (performance.now() / 110) | 0;
    c.fillStyle = '#b9bdd0'; c.fillRect(x + 4, y + 1, 8, 11); c.fillRect(x + 3, y + 2, 10, 9);
    c.fillStyle = '#3a6f76'; c.fillRect(x + 5, y + 2, 6, 9); c.fillRect(x + 4, y + 3, 8, 7);
    c.fillStyle = '#dcf7f5'; c.fillRect(x + 5 + (f % 6), y + 3 + (f % 6), 2, 1);
    c.fillStyle = '#6b4a2f'; c.fillRect(x + 7, y + 12, 2, 4);
  }
});
const accountsLogoSc = () => VS.uw > 520 ? 5 : VS.uw > 380 ? 4 : 3;   // (the size drawLogo picks)
const accountsLogo = () => VS.uh >= 300 && !kitTyping();
const accountChosen = () => ACCOUNT.profiles.find(v => v.id === ACCOUNT.loginId) || null;
const ACCOUNT_TXT = {
  notYou: 'Not you? Choose your name in the ledger.',
  legacy: 'This account is from before passwords. Choose one to keep it yours.',
  who: 'Choose your name in the ledger, or make a new account.',
  welcome: 'No Wakers here yet.'
};
Object.assign(MENUS, {
  accounts: {
    col: '#ffb347', art: 'lantern', motes: 'lanterns', place: 'THE HEARTH', sound: 'fire', hero: false, glow: { x: .5, y: .92 },
    idle: () => menuMode() === 'narrow' ? 'Every account has a password.' : 'Every account has a password. Accounts live in this browser.',
    // under the logo when it shows (the board runs straight on from the home page), else from the top
    top: () => accountsLogo() ? round(VS.uh * .06) + accountsLogoSc() * 8 + 24 : 8,
    // the hearth itself, at the bottom of the screen
    diorama(x, W, H) { const hx = round(W / 2) - 16, hy = H - 56; x.fillStyle = '#2b2740'; x.fillRect(hx - 14, hy + 28, 60, 2); x.drawImage(PROP.hearth, hx, hy, 32, 28); },
    live(c, uw, uh, now) {
      const f = (now / 110) | 0, hx = round(ceil(uw) / 2) - 16, hy = ceil(uh) - 56;
      c.globalAlpha = .22 + .04 * sin(now / 1000 * TAU * .7); c.drawImage(kitGlow(44, '#ff8a3d', 1), hx - 28, hy - 26); c.globalAlpha = 1;
      c.fillStyle = '#e2542b'; c.fillRect(hx + 11, hy + 13 + (f & 1), 10, 8 - (f & 1));
      c.fillStyle = '#ffd35a'; c.fillRect(hx + 13, hy + 15 + (f % 3 === 0 ? 1 : 0), 6, 5);
      c.fillStyle = '#fff1a8'; c.fillRect(hx + 15, hy + 18, 2, 2);
      c.fillStyle = '#ff8a3d'; c.fillRect(hx + 13 + (f % 3) * 2, hy + 9 + (f & 1), 1, 2);
    },
    keys: accountsKeys, back: accountsBack, enter: accountsEnter,
    leave() { accountWipe(); ACCOUNT.err = {}; },
    typed(key) { ACCOUNT.msg = null; delete ACCOUNT.err[key]; }
  }
});

// ---------------- what the board does ----------------
// open the board from the home page (the A key) or from the worlds board's name chip
function accountsOpen() {
  const A = ACCOUNT; G.state = 'accounts'; A.form = 'list'; A.loginId = A.active ? A.active.id : null; A.msg = null; A.err = {}; UI.focus = null; UI.scroll = 0; sfx('ui');
}
function accountsEnter() {
  const A = ACCOUNT; A.worlds = {};
  for (const p of A.profiles) { try { const L = JSON.parse(LS.get(profilePath(p.id, 'index')) || '[]'); A.worlds[p.id] = Array.isArray(L) ? L.length : 0; } catch (e) { A.worlds[p.id] = 0; } }
}
function accountChoose(id) {
  const A = ACCOUNT, p = A.profiles.find(v => v.id === id); if (!p) return;
  if (A.loginId !== id) { accountWipe(); A.err = {}; KIT.err = {}; }
  A.loginId = id; A.msg = null;
  UI.focus = A.active && A.active.id === id ? null : 'accountPassword'; KIT.focus = UI.focus ? 'field:' + UI.focus : null; sfx('ui');
}
function accountChooseAnother() { const A = ACCOUNT; A.loginId = null; accountWipe(); A.msg = null; A.err = {}; UI.focus = null; sfx('ui'); }
function accountMake() {
  const A = ACCOUNT; A.loginId = null; A.form = 'create'; A.msg = null; A.err = {}; accountWipe();
  FORM.accountName = ''; FORM.skin = 0; FORM.hat = 0; UI.focus = 'accountName'; KIT.sy.create = 0; sfx('ui');
}
function accountLookOpen() { const A = ACCOUNT; A.form = 'look'; A.msg = null; FORM.skin = G.skin; FORM.hat = G.hat; UI.focus = null; sfx('ui'); }
function accountLoginSubmit() { const p = accountChosen(); if (!p || ACCOUNT.busy) return; UI.focus = null; sfx('ui'); accountLogin(p, FORM.accountPassword); }
function accountSetSubmit() {
  const A = ACCOUNT, p = accountChosen(); if (!p || A.busy) return; A.err = {};
  if (FORM.accountPassword.length < 8) { A.err.accountPassword = 'Use at least 8 characters.'; kerr('accountPassword'); UI.focus = 'accountPassword'; sfx('deny'); return; }
  if (FORM.accountPassword !== FORM.accountConfirm) { A.err.accountConfirm = 'The two passwords are not the same.'; kerr('accountConfirm'); UI.focus = 'accountConfirm'; sfx('deny'); return; }
  UI.focus = null; sfx('quest', 0); accountSetPassword(p, FORM.accountPassword, FORM.accountConfirm);
}
// Escape and BACK: put the keyboard down, then go back to the ledger, then clear the choice, then the home page if
// someone is signed in; signed out there is nowhere further back, and the board says so
function accountsBack() {
  const A = ACCOUNT;
  if (A.form !== 'list') { if (A.active) { FORM.skin = G.skin; FORM.hat = G.hat; } A.form = 'list'; accountWipe(); A.err = {}; A.msg = null; sfx('ui'); return; }
  // (the signed-in card's own BACK goes home: so does Escape there)
  if (A.loginId && !(A.active && A.loginId === A.active.id)) { accountChooseAnother(); return; }
  if (A.active) { G.state = 'title'; sfx('ui'); return; }
  A.msg = { text: 'Choose your name or make an account to go on.', kind: 'warn' }; sfx('deny');
}
// Up and Down walk the ledger (the password box ready); a letter jumps to the next name starting with it
function accountsKeys(e) {
  const A = ACCOUNT, k = e.code, L = A.profiles, n = L.length;
  if (A.form !== 'list' || !n) return false;
  let j = -1; const i = L.findIndex(p => p.id === A.loginId);
  if (k === 'ArrowUp' || k === 'ArrowDown') j = i < 0 ? (k === 'ArrowUp' ? n - 1 : 0) : clamp(i + (k === 'ArrowUp' ? -1 : 1), 0, n - 1);
  else if (!UI.focus && /^Key[A-Z]$/.test(k)) { const ch = k[3].toLowerCase(), p = [...L.slice(i + 1), ...L.slice(0, i + 1)].find(p => p.name.toLowerCase().startsWith(ch)); j = p ? L.indexOf(p) : -1; }
  if (j < 0) return false;
  if (L[j].id !== A.loginId) accountChoose(L[j].id); else UI.focus = A.active && A.active.id === L[j].id ? null : 'accountPassword';
  const vis = A.vis || 1; if (j < UI.scroll) UI.scroll = j; else if (j >= UI.scroll + vis) UI.scroll = j - vis + 1;
  return true;
}
// the live lines under the fields
function accountNameCheck() {
  const e = ACCOUNT.err.accountName; if (e) return { text: e, kind: 'err' };
  const raw = FORM.accountName, n = cleanAccountName(raw);
  if (!n || n !== raw.trim()) return { text: 'letters, numbers, space _ -' };
  return accountNameTaken(n) ? { text: 'taken here', kind: 'err' } : { text: 'free', kind: 'ok' };
}
function accountPwCheck() {
  const e = ACCOUNT.err.accountPassword; if (e) return { text: e, kind: 'err' };
  const n = FORM.accountPassword.length; return n >= 8 ? { pips: [8, 8], text: 'long enough', kind: 'ok' } : { pips: [n, 8] };
}
function accountAgainCheck() {
  const e = ACCOUNT.err.accountConfirm; if (e) return { text: e, kind: 'err' };
  const a = FORM.accountConfirm; return !a ? null : a === FORM.accountPassword ? { text: 'matches', kind: 'ok' } : { text: 'not the same yet', kind: 'warn' };
}
const accountSecret = () => ({ secret: true, show: ACCOUNT.show, toggle: () => { ACCOUNT.show = !ACCOUNT.show; } });

// ---------------- drawing ----------------
function drawAccounts(c) {
  const A = ACCOUNT, uh = VS.uh;
  if (A.form === 'look' && !A.active) A.form = 'list';
  menuBackdrop(c, 'accounts');
  if (accountsLogo()) { const ly = round(uh * .06); c.drawImage(kitGlow(150, '#ff8c3c', .26), 0, 94, 300, 120, round(VS.uw / 2) - 150, ly - 40, 300, 120); drawLogo(c, ly, 'SIGN IN AT THE HEARTH'); }
  kview(A.form);
  if (A.form === 'create') drawAccountCreate(c);
  else if (A.form === 'look') drawAccountLook(c);
  else if (!A.profiles.length) drawAccountWelcome(c);
  else if (menuMode() === 'narrow') drawAccountColumn(c);
  else {
    // the ledger and the door side by side (480x270: 220 and 226 wide, from the top; larger: under the logo, as tall as
    // they need, so the hearth shows between them and the hint line)
    const wide = menuMode() === 'wide', F = menuFrame('accounts', 530, 250), lw = wide ? min(280, F.w - 236) : 220, S = KIT.sizes, foot = S.bh + 10;
    if (wide) { const need = max(29 + A.profiles.length * S.row + 4 + foot, 29 + accountDoorH(accountDoorState(accountChosen()), F.w - lw - 26) + 6 + foot); F.y = F.top; const cap = floor(VS.uh - 58) - F.top; F.h = need <= cap ? max(need, 120) : min(need, F.bot - F.top); }   // (taller than that: down to uh-24, the hearth behind)
    accountLedger(c, F.x, F.y, lw, F.h, 0);
    accountDoor(c, F.x + lw + 10, F.y, F.w - lw - 10, F.h, 1);
  }
}
// a phone held upright: the ledger alone, or folded to the chosen row with the door opened under it
function drawAccountColumn(c) {
  const A = ACCOUNT, S = KIT.sizes, p = accountChosen(), n = A.profiles.length, foot = S.bh + 10;
  if (!p) { const F = menuFrame('accounts', 228, 29 + n * S.row + 6 + foot); accountLedger(c, F.x, F.y, F.w, F.h, 0, !!A.active); return; }
  const lh = 29 + S.row + 4 + foot, st = accountDoorState(p), dh = 29 + accountDoorH(st, 228 - 16, p) + 6 + foot;
  const F = menuFrame('accounts', 228, lh + 8 + dh);
  const K = kcard(c, F.x, F.y, F.w, lh, 'accounts', 'THE LEDGER', { art: 'ledger', foot: true, i: 0 });
  accountRow(c, A.profiles.indexOf(p), K.x + 6, K.by, K.w - 12, S.row - 2);
  kbutton(c, K.x + 6, K.footY + 5, K.w - 12, 'CHOOSE ANOTHER', accountChooseAnother, { hint: 'Back to every name in the ledger.' });
  accountDoor(c, F.x, F.y + lh + 8, F.w, F.h - lh - 8, 1);
}
// (back: the ledger alone on an upright phone, someone signed in: a BACK home beside + CREATE ACCOUNT)
function accountLedger(c, x, y, w, h, i, back) {
  const A = ACCOUNT, S = KIT.sizes, n = A.profiles.length, bw = back ? (KIT.T ? 64 : 60) : 0, mw = K => K.w - 12 - (back ? bw + S.gap : 0);
  const K = kcard(c, x, y, w, h, 'accounts', 'THE LEDGER', { art: 'ledger', right: n + (n === 1 ? ' WAKER' : ' WAKERS'), foot: true, i });
  A.vis = klist(c, { x: K.x + 6, y: K.by, w: K.w - 12, h: K.footY - 4 - K.by }, n, S.row, accountRow).vis;
  kbutton(c, K.x + 6, K.footY + 5, mw(K), '+ CREATE ACCOUNT', accountMake, { short: '+ CREATE', hint: 'A new Waker: a name, a password and a look.' });
  if (back) accountHome(c, K.x + K.w - 6 - bw, K.footY + 5, bw);
}
const accountHome = (c, x, y, w, main) => kbutton(c, x, y, w, 'BACK', () => { G.state = 'title'; sfx('ui'); }, { main, hint: 'Back to the home page.' });
function accountRow(c, i, x, y, w, h) {
  const A = ACCOUNT, p = A.profiles[i], me = !!A.active && A.active.id === p.id, legacy = !p.salt || !p.hash, sel = A.loginId === p.id;
  krow(c, x, y, w, h, () => accountChoose(p.id), { sel, tag: 'row:account:' + p.name, hint: me ? 'You are signed in as ' + p.name + '.' : legacy ? 'An older account: choose a password for it.' : kb('Sign in as ', 'Tap to sign in as ') + p.name + '.' });
  // the head with its hat (the hat is cut at the row's top edge rather than spill over the row above)
  c.save(); c.beginPath(); c.rect(x, y + 1, w, h - 1); c.clip(); khead(c, p.skin, p.hat, x + 6, y + h - 15, 2); c.restore();
  const tag = me ? ['SIGNED IN', '#7ddc6f'] : legacy ? ['NEEDS A PASSWORD', '#ffb347'] : ['>', sel ? KIT.col : '#8b8fa3'], tw = textW(tag[0]);
  drawText(c, tag[0], x + w - 6 - tw, y + round((h - 8) / 2), tag[1]);
  const nx = x + 26, room = x + w - 12 - tw - nx, nw = A.worlds[p.id] | 0, ty = y + round(h / 2) - 9;
  drawText(c, fitText(p.name, room), nx, ty, me ? '#ffd35a' : '#fff');
  drawText(c, nw === 1 ? '1 world' : nw + ' worlds', nx, ty + 10, '#8b8fa3');
}
const accountDoorState = p => !p ? 'who' : ACCOUNT.active && ACCOUNT.active.id === p.id ? 'in' : !p.salt || !p.hash ? 'legacy' : 'sign';
const accountInText = me => 'Signed in as ' + me.name + '. Your worlds are saved ' + (SAVE.db ? 'to your Claude account.' : 'in this browser.');
// how tall the door's body is in each state (so a short door can scroll it)
function accountDoorH(st, cw, p) {
  const S = KIT.sizes, fh = KIT.T ? 34 : 28, L = s => wrapC(s, cw).length * 9;
  if (st === 'sign') return 52 + fh + 2 + S.bh + 8 + L(ACCOUNT_TXT.notYou);
  if (st === 'legacy') return L(ACCOUNT_TXT.legacy) + 4 + (fh + 12) * 2 + S.bh + 2;
  if (st === 'in') return 52 + L(accountInText(ACCOUNT.active)) + 6 + S.bh * 2 + S.gap + 2;
  return L(ACCOUNT_TXT.who) + 60;
}
// the Waker the door is for: the head at 3x and the name large
function accountPortrait(c, p, x, y, w) {
  c.drawImage(kitGlow(22, KIT.col, .25), x - 10, y + 2);
  khead(c, p.skin, p.hat, x + 2, y + 24, 3);
  const nm = p.name, big = textW(nm, 2) <= w - 32, nw = ACCOUNT.worlds[p.id] | 0;
  if (big) textS(c, nm, x + 32, y + 20, '#fff1a8', 2); else textS(c, fitText(nm, w - 32), x + 32, y + 24, '#fff1a8');
  drawText(c, nw === 1 ? '1 world' : nw + ' worlds', x + 32, y + 38, '#8b8fa3');
}
function accountDoor(c, x, y, w, h, i) {
  const A = ACCOUNT, S = KIT.sizes, p = accountChosen(), st = accountDoorState(p);
  const title = { who: 'WHO WAKES?', in: 'SIGNED IN', legacy: 'SET A PASSWORD', sign: 'SIGN IN' }[st];
  const K = kcard(c, x, y, w, h, 'accounts', title, { art: st === 'legacy' ? 'key' : 'lantern', foot: true, i });
  const cx = K.x + 8, cw = K.w - 16, B = { x: K.x + 1, y: K.by - 3, w: K.w - 2, h: K.footY - 2 - (K.by - 3) }, need = accountDoorH(st, cw, p) + 3;
  const scroll = need > B.h; let yy = K.by + 1 + (scroll ? kscroll(c, B, need, 'door') : 0);
  if (st === 'sign') {
    accountPortrait(c, p, cx, yy, cw); yy += 52;
    yy += kfield(c, cx, yy, cw, 'accountPassword', 'PASSWORD', 'your password', Object.assign(accountSecret(), { hint: 'The password of ' + p.name + '.' })) + 2;
    kbutton(c, cx, yy, cw, A.busy ? 'CHECKING...' : 'LOG IN', accountLoginSubmit, { main: true, off: A.busy, hint: A.busy ? 'Checking the password...' : 'Sign in as ' + p.name + '.' }); yy += S.bh + 8;
    for (const l of wrapC(ACCOUNT_TXT.notYou, cw)) { drawText(c, l, cx, yy, '#8b8fa3'); yy += 9; }
  } else if (st === 'legacy') {
    for (const l of wrapC(ACCOUNT_TXT.legacy, cw)) { drawText(c, l, cx, yy, '#d8d4e6'); yy += 9; } yy += 4;
    yy += kfield(c, cx, yy, cw, 'accountPassword', 'NEW PASSWORD', '8 or more characters', Object.assign(accountSecret(), { check: accountPwCheck, hint: 'At least 8 characters. It is kept only as a salted hash.' }));
    yy += kfield(c, cx, yy, cw, 'accountConfirm', 'AGAIN', 'the same again', Object.assign(accountSecret(), { check: accountAgainCheck, hint: 'The same password once more.' }));
    kbutton(c, cx, yy, cw, A.busy ? 'SAVING...' : 'SAVE + LOG IN', accountSetSubmit, { main: true, off: A.busy, hint: A.busy ? 'Saving the password...' : 'Keep this password and sign in.' });
  } else if (st === 'in') {
    const me = A.active; accountPortrait(c, me, cx, yy, cw); yy += 52;
    for (const l of wrapC(accountInText(me), cw)) { drawText(c, l, cx, yy, '#d8d4e6'); yy += 9; } yy += 6;
    const hw = floor((cw - S.gap) / 2);
    kbutton(c, cx, yy, hw, 'CHANGE LOOK', accountLookOpen, { short: 'LOOK', hint: 'A new face or hat for ' + me.name + '.' });
    kbutton(c, cx + hw + S.gap, yy, cw - hw - S.gap, 'SIGN OUT', () => { accountLogout(); sfx('ui'); }, { hint: 'Your worlds are saved first.' }); yy += S.bh + S.gap;
    accountHome(c, cx, yy, cw, true);
  } else {
    for (const l of wrapC(ACCOUNT_TXT.who, cw)) { drawText(c, l, cx, yy, '#d8d4e6'); yy += 9; }
    c.save(); c.translate(K.x + round(K.w / 2) - 24, yy + 8); c.scale(3, 3); MENU_ART.lantern(c, 0, 0); c.restore();
  }
  if (scroll) kscrollEnd(c);
  // nobody chosen while someone is signed in: the way home is in the foot
  if (st === 'who' && A.active && !A.msg) accountHome(c, cx, K.footY + 5, cw, true);
  kmsg(c, cx, K.footY + 5, cw, A.msg);
}
function drawAccountWelcome(c) {
  const A = ACCOUNT, S = KIT.sizes, cw = min(300, VS.uw - (menuMode() === 'narrow' ? 12 : 24)) - 16, L = wrapC(ACCOUNT_TXT.welcome, cw), mh = A.msg ? wrapC(A.msg.text, cw - 8).length * 9 + 6 : 0;
  const F = menuFrame('accounts', 300, 29 + L.length * 9 + 10 + S.bh + 8 + mh);
  const K = kcard(c, F.x, F.y, F.w, F.h, 'accounts', 'WELCOME', { art: 'lantern', i: 0 }); let yy = K.by + 1;
  L.forEach(l => { drawText(c, l, K.x + 8, yy, '#d8d4e6'); yy += 9; }); yy += 8;
  kbutton(c, K.x + 8, yy, K.w - 16, '+ CREATE ACCOUNT', accountMake, { main: true, hint: 'A name, a password and a look: that is all.' }); yy += S.bh + 6;
  kmsg(c, K.x + 8, yy, K.w - 16, A.msg);
}
function accountCreateFields(c, x, y, w) {
  let yy = y;
  yy += kfield(c, x, yy, w, 'accountName', 'NAME', 'name your Waker', { check: accountNameCheck, hint: 'What other Wakers see. Letters, numbers, space _ -' });
  yy += kfield(c, x, yy, w, 'accountPassword', 'PASSWORD', '8 or more characters', Object.assign(accountSecret(), { check: accountPwCheck, hint: 'Kept only as a salted hash, in this browser.' }));
  yy += kfield(c, x, yy, w, 'accountConfirm', 'AGAIN', 'the same again', Object.assign(accountSecret(), { check: accountAgainCheck, hint: 'Type the password once more.' }));
  return yy - y;
}
function accountFoot(c, K, label, fn, o) {
  const S = KIT.sizes, bw = KIT.T ? 64 : 60, mw = min(180, K.w - 16 - bw - S.gap);
  kbutton(c, K.x + 8, K.footY + 5, mw, label, fn, Object.assign({ main: true }, o));
  kbutton(c, K.x + K.w - 8 - bw, K.footY + 5, bw, 'BACK', menuBack, { hint: 'Back to the ledger.' });
}
function drawAccountCreate(c) {
  const A = ACCOUNT, S = KIT.sizes, fh = KIT.T ? 34 : 28, fieldsH = (fh + 12) * 3, lookH = 56 + S.tileH + S.gap + 2 + S.ah + 4, foot = S.bh + 10, narrow = menuMode() === 'narrow';
  const mh = A.msg ? 22 : 0, F = menuFrame('accounts', 520, 29 + (narrow ? fieldsH + 6 + lookH : max(fieldsH, lookH)) + 6 + mh + foot);
  const K = kcard(c, F.x, F.y, F.w, F.h, 'accounts', 'A NEW WAKER', { art: 'key', foot: true, i: 0 });
  if (narrow) {
    const B = { x: K.x + 1, y: K.by - 3, w: K.w - 2, h: K.footY - 2 - mh - (K.by - 3) }, need = fieldsH + 6 + lookH + 4;
    const dy = need > B.h ? kscroll(c, B, need, 'create') : 0; let yy = K.by + 1 + dy;
    yy += accountCreateFields(c, K.x + 8, yy, K.w - 16) + 6;
    klook(c, K.x + 8, yy, K.w - 16, { preview: true });
    if (need > B.h) kscrollEnd(c);
  } else {
    const lw = floor((K.w - 28) * .56), lx = K.x + 8, rx = lx + lw + 12, rw = K.x + K.w - 8 - rx;
    accountCreateFields(c, lx, K.by + 1, lw);
    c.fillStyle = '#2b2740'; c.fillRect(rx - 6, K.by, 1, K.footY - K.by - 6);
    klook(c, rx, K.by + 1, rw, { preview: true });
  }
  kmsg(c, K.x + 8, K.footY - mh, K.w - 16, A.msg);
  accountFoot(c, K, A.busy ? 'CREATING...' : 'CREATE ACCOUNT', () => accountCreateSubmit(), { off: A.busy, hint: A.busy ? 'Making the account...' : 'Make the account and sign in.' });
}
function drawAccountLook(c) {
  const A = ACCOUNT, me = A.active, S = KIT.sizes, lookH = 56 + S.tileH + S.gap + 2 + S.ah + 4, foot = S.bh + 10;
  const F = menuFrame('accounts', 300, 29 + lookH + 6 + foot);
  const K = kcard(c, F.x, F.y, F.w, F.h, 'accounts', 'THE LOOK OF ' + me.name, { art: 'mirror', foot: true, i: 0 });
  klook(c, K.x + 8, K.by + 1, K.w - 16, { preview: true });
  accountFoot(c, K, 'WEAR THIS', () => { G.skin = FORM.skin; G.hat = FORM.hat; accountSaveProfile(); A.form = 'list'; kitToast('Look saved.'); sfx('quest', 0); }, { hint: 'Keep this look for ' + me.name + '.' });
}
// the worlds board's name chip (top right): the name opens the ledger, SIGN OUT signs out
function accountTag(c, right) {
  const a = ACCOUNT.active; if (!a) return; const nw = textW(a.name) + 10;
  button(c, right - 60, 2, 60, 12, 'SIGN OUT', () => { accountLogout(); sfx('ui'); });
  button(c, right - 64 - nw, 2, nw, 12, a.name, accountsOpen);
}
