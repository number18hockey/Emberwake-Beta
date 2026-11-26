// ============================================================
//  PARTIES: you and your friends, against other people.
//
//  A party is a lobby you made with a game code: whoever joins it
//  with that code is in your party, and a party is always put on
//  one team (as far as the team size allows).
//
//  To meet other people from the file or the app:
//    - OPEN your lobby: it is listed on a public board, and other
//      players and parties can walk in; or
//    - FIND AN OPEN MATCH: the board lists every open lobby. The
//      party leader picks one and the whole party goes there together.
//  A lobby holds six people; echoes fill the other places.
//
//  On claude.ai everyone already meets in PLAY ONLINE: there, friends
//  who type the same PARTY word are put on one team.
//
//  The board is one more topic on the same public message boards the
//  game codes use. What is posted there is public on purpose: a name,
//  a game code, and how many are in the lobby. Nothing else.
// ============================================================
const OPENB = { on: false, conns: [], list: new Map(), sayT: 0, goneSaid: true, retryT: 0 };
const BR_HUMANS = 6;
const openTopic = () => 'emberwake/v3/trials-open/' + NETV;
const brMaxG = () => COOP.br && !COOP.ring ? (BR.wild ? WBR_PARTY : BR_HUMANS) - 1 : MAXG;
const openUsable = () => !(NET.room && !window.EW_BROKERS) && netOK();
function openStart() {
  if (OPENB.on || !openUsable()) return; OPENB.on = true; OPENB.list.clear();
  OPENB.conns = sigBrokers().slice(0, 4).map((B, i) => mqttOpen(B, i, { topics: [openTopic()], on: openIn }));
}
function openStop() { for (const C of OPENB.conns) C.close(); OPENB.conns = []; OPENB.on = false; OPENB.list.clear(); }
function openIn(topic, text) {
  let m = null; try { m = JSON.parse(text); } catch (e) { return; } if (!m || typeof m !== 'object' || (m.v | 0) !== NETV) return;
  const c = sigClean(m.c); if (c.length !== 6 || c === COOP.gcode) return;
  if (m.x) { OPENB.list.delete(c); return; }
  OPENB.list.set(c, { c, n: cleanName(m.n) || 'WAKER', k: clamp(m.k | 0, 1, BR_HUMANS), m: BR_HUMANS, tm: clamp(m.tm | 0, 1, 3) || 1, ar: clamp(m.ar | 0, 0, 2), at: performance.now() });
}
function openSay(gone) {
  if (!COOP.gcode) return; const k = 1 + [...COOP.peers.values()].filter(P => P.ok).length;
  const s = JSON.stringify(gone ? { v: NETV, c: COOP.gcode, x: 1 } : { v: NETV, c: COOP.gcode, n: G.nick, k, tm: clamp(BR.sizeWant | 0, 1, 3) || 1, ar: BR.arenaWant === undefined ? 2 : BR.arenaWant | 0 });
  for (const C of OPENB.conns) if (C.ok) C.pubTo(openTopic(), s);
}
// every frame while the Trials' menus are up
function openTick() {
  const want = !BR.wild && (BR.on || G.state === 'brform' || G.state === 'bropen'); if (!want) { if (OPENB.on) { if (!OPENB.goneSaid) { openSay(true); OPENB.goneSaid = true; } openStop(); } return; }
  if (!OPENB.on) { if (G.state === 'brlobby' || G.state === 'bropen' || G.state === 'brform') openStart(); return; }
  const now = performance.now(); for (const C of OPENB.conns) if (C.tick) C.tick(now);
  if (now - OPENB.retryT > 6000) { OPENB.retryT = now; const L = sigBrokers().slice(0, 4); OPENB.conns.forEach((C, i) => { if (C.closed) OPENB.conns[i] = mqttOpen(L[i], i, { topics: [openTopic()], on: openIn }); }); }
  for (const [c, e] of OPENB.list) if (now - e.at > 9000) OPENB.list.delete(c);
  // an open lobby says so every couple of seconds; when it starts or closes it says that once
  const mine = BR.open && BR.via === 'rtc' && netHost() && G.state === 'brlobby' && BR.phase === 'lobby' && !!COOP.gcode;
  if (mine) { if (now - OPENB.sayT > 2200) { OPENB.sayT = now; openSay(false); OPENB.goneSaid = false; } }
  else if (!OPENB.goneSaid) { openSay(true); OPENB.goneSaid = true; }
}
const openReady = () => OPENB.conns.some(C => C.ok);
const openList = () => [...OPENB.list.values()].sort((a, b) => b.k - a.k || (a.c < b.c ? -1 : 1));
// how many of us would walk in together
const partySize = () => BR.via === 'rtc' && netHost() && BR.on ? 1 + [...COOP.peers.values()].filter(P => P.ok).length : 1;

// ---------------- the party tag, and going somewhere together ----------------
function partyTick() {
  if (BR.via === 'rtc' && netHost() && COOP.gcode && !BR.party) BR.party = COOP.gcode;
  if (BR.via === 'room') BR.party = cleanCode(FORM.brparty || '').toUpperCase().slice(0, 8);
}
// leave where we are and walk into another lobby, keeping the party we came with
function trFollow(code) {
  const pt = BR.party; BR.following = true; try { if (BR.on) brLeave(); } finally { BR.following = false; }
  BR.party = pt; BR.joinOpen = true; BR.showOpen = false; FORM.gcode = code; G.state = 'join'; COOP.long = false; UI.focus = null; sigJoin(code);
}
function openJoin(e) {
  if (BR.on && BR.via === 'rtc' && netHost()) { sendAll({ t: 'bfollow', code: e.c }); openSay(true); OPENB.goneSaid = true; BR.open = false; setTimeout(() => trFollow(e.c), 450); }
  else { if (!BR.on) BR.party = ''; trFollow(e.c); }
  sfx('quest', 0);
}
// teams: parties first (each kept whole where a team has the room), then wishes, then everyone else
function trPartyTeams(ids, nb, size, wish, party) {
  const n = ids.length + nb, nt = max(1, ceil(n / size)), cnt = new Array(nt).fill(0), out = new Array(n).fill(-1);
  if (size > 1 && party) {
    const groups = new Map(); ids.forEach((id, i) => { const p = party[id]; if (p) { if (!groups.has(p)) groups.set(p, []); groups.get(p).push(i); } });
    for (const g of [...groups.values()].filter(g => g.length > 1).sort((a, b) => b.length - a.length)) {
      let rest = g.slice();
      while (rest.length) { let t = cnt.findIndex(c => c === 0); if (t < 0) t = cnt.findIndex(c => c + min(rest.length, size) <= size); if (t < 0) break; const take = rest.splice(0, size - cnt[t]); for (const i of take) { out[i] = t; cnt[t]++; } }
    }
  }
  ids.forEach((id, i) => { if (out[i] >= 0) return; const w = (wish && wish[id]) | 0; if (size > 1 && w >= 1 && w <= nt && cnt[w - 1] < size) { out[i] = w - 1; cnt[w - 1]++; } });
  for (let i = 0; i < n; i++) if (out[i] < 0) { let t = 0; while (t < nt - 1 && cnt[t] >= size) t++; out[i] = t; cnt[t]++; }
  return out;
}

// ---------------- the list of open lobbies ----------------
function drawOpenList(c, x, y, w, h) {
  const L = openList(), mine = partySize(), lead = !BR.on || (BR.via === 'rtc' && netHost()), now = performance.now();
  panel(c, x, y, w, h, 'OPEN MATCHES'); hit(x, y, w, h, () => { });
  if (!openUsable()) wrapDraw(c, NET.room ? 'On claude.ai, PLAY ONLINE is where everyone meets. Type the same PARTY word as your friends to share a team.' : 'This window cannot reach the internet.', x + 8, y + 20, w - 16, '#ffb347');
  else if (!L.length) wrapDraw(c, openReady() ? 'No lobby is open right now. Open your own (HOST A MATCH, then OPEN TO OTHERS), and anyone looking will see it here.' : 'Looking at the board...', x + 8, y + 20, w - 16, '#d8d4e6');
  L.slice(0, 7).forEach((e, i) => {
    const ry = y + 18 + i * 20, room = e.m - e.k, okJoin = lead && room >= mine;
    c.fillStyle = inR(x + 4, ry, w - 8, 18) ? '#2b2740' : '#221e30'; c.fillRect(x + 4, ry, w - 8, 18);
    drawText(c, e.n + '\'S LOBBY', x + 9, ry + 2, '#fff'); drawText(c, TR_SIZE_N[e.tm] + '   ' + TR_ARENA_PICK[e.ar] + '   ' + e.k + ' of ' + e.m + ' here', x + 9, ry + 10, '#8b8fa3');
    button(c, x + w - 74, ry + 2, 66, 14, mine > 1 ? 'JOIN (' + mine + ')' : 'JOIN', () => openJoin(e), { off: !okJoin });
  });
  if (!lead) drawText(c, 'your party leader chooses the match', x + 8, y + h - 16, '#8b8fa3');
  else if (mine > 1) drawText(c, 'your whole party (' + mine + ') goes together', x + 8, y + h - 16, '#7ddc6f');
}
function drawBrOpen(c) {
  const uw = VS.uw, uh = VS.uh, w = min(360, uw - 16), h = 200, x = round((uw - w) / 2), y = max(6, round((uh - h) / 2));
  c.fillStyle = 'rgba(18,13,31,.55)'; c.fillRect(0, 0, uw, uh); drawOpenList(c, x, y, w, h);
  button(c, x + w - 70, y + h - 20, 60, 14, 'BACK', () => { G.state = 'brform'; sfx('ui'); });
}
