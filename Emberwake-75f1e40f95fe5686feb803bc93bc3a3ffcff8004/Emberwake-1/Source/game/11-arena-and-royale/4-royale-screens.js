// ============================================================
//  The Ashfall on screen: the menu, the lobby, the barge, chests,
//  the storm, the match HUD, the map, and the end of a match.
// ============================================================
// ---------------- THE ASHFALL TRIALS' FORM: FALLING ASH (built with the menu kit; helpers in 26-arena-menus.js) ----------------
// Wide: three cards, YOU, THE MATCH and GO. A short screen: YOU and THE MATCH share a scrolling card beside GO.
// A phone held upright: one scrolling card, with PLAY WITH ECHOES and BACK pinned at its foot.

function trGo(fn) { UI.focus = null; const nick = cleanName(FORM.nick) || 'WAKER'; FORM.nick = nick; G.nick = nick; G.skin = FORM.skin | 0; G.state = 'loading'; G.loadMsg = 'Raising the island...'; setTimeout(fn, 30); sfx('quest', 0); }
function trWilds() { BR.wild = true; BR.menuTab = 'queue'; BR.menuScroll = 0; BR.menuMsg = ''; FORM.skin = G.skin | 0; FORM.hat = G.hat | 0; UI.focus = null; AM.walT = performance.now(); sfx('ui'); }
const trRecord = () => { const C = trCareer(); return C.n ? 'Your record: ' + C.n + ' trials, ' + C.w + ' won, ' + C.k + ' taken down.' : ''; };
// YOU: name, look and the match code
const trYouH = () => (KIT.T ? 34 : 28) * 2 + 2 + KIT.sizes.tileH + KIT.sizes.gap + 4;
function trYou(c, x, y, w) {
  let yy = y; yy += kfield(c, x, yy, w, 'nick', 'NAME', 'WAKER', { hint: 'The name over your head on the island.' }) + 2;
  yy += klook(c, x, yy, w, { hat: false }) + 2;
  kfield(c, x, yy, w, 'brcode', 'MATCH', 'open  (or a private code)');
}
// THE MATCH: teams and arena as segments with their own little pictures, and your record
const trMatchH = w => { const sg = KIT.sizes.sm + 4, r = trRecord(); return 10 + sg + 6 + 10 + sg * 2 + 4 + (r ? amParaH(r, w) : 0); };
function trMatch(c, x, y, w) {
  let yy = y;
  drawText(c, 'TEAMS', x, yy, '#b9bdd0'); yy += 10;
  yy += ksegment(c, x, yy, w, ['SOLO', 'DUOS', 'TRIOS'], TR_SIZE_N[FORM.brsize], op => { FORM.brsize = BR.sizeWant = TR_SIZE_N.indexOf(op); }, { icons: [1, 2, 3].map(n => (c, ix, iy) => amHeads(c, ix, iy, n)) }) + 6;
  drawText(c, 'ARENA', x, yy, '#b9bdd0'); yy += 10;
  const cur = TR_ARENA_PICK[BR.arenaWant], set = op => { if (op === 'WILDS') trWilds(); else BR.arenaWant = TR_ARENA_PICK.indexOf(op); };
  yy += ksegment(c, x, yy, w, ['ASHEN ISLE', 'EMBER PEAK'], cur, set, { icons: [amIsleIcon, amPeakIcon] });
  yy += ksegment(c, x, yy, w, ['EITHER', 'WILDS'], cur, set, { icons: [amEitherIcon, amChuteIcon] }) + 4;
  const r = trRecord(); if (r) amPara(c, r, x, yy, w, '#8b8fa3');
}
// GO: the ways in (a line under one says only why it is off)
function trGoList() {
  const L = [], n = OPENB.list.size;
  L.push({ label: 'PLAY ONLINE', fn: () => trGo(() => { BR.sizeWant = FORM.brsize; brLobbyEnter('room', cleanCode(FORM.brcode) || 'open'); }), off: !NET.room, sub: 'only on claude.ai', hint: NET.room ? '' : 'Online lobbies are only on claude.ai: open this page there to find others.' });
  if (netOK()) {
    L.push({ label: 'MAKE A PARTY  (HOST A LOBBY)', short: 'MAKE A PARTY', fn: () => trGo(() => { COOP.br = true; BR.sizeWant = FORM.brsize; brLobbyEnter('rtc', 'friends'); }) });
    if (openUsable()) L.push({ label: 'OPEN MATCHES  (' + n + ' open now)', short: 'OPEN MATCHES (' + n + ')', fn: () => { G.state = 'bropen'; sfx('ui'); } });
  }
  L.push({ label: 'PLAY WITH ECHOES' + (FORM.brsize > 1 ? '  (' + TR_SIZE_N[FORM.brsize] + ')' : ''), short: 'PLAY WITH ECHOES', fn: () => trGo(() => brSolo(FORM.brsize)), echoes: true });
  return L;
}
const trGoStep = b => KIT.sizes.bh + (b.off ? 3 + 9 + 6 : 6);
const trGoH = L => L.reduce((s, b) => s + trGoStep(b), 0);
function trGoDraw(c, x, y, w, L) {
  let yy = y; const main = NET.room ? 'PLAY ONLINE' : 'PLAY WITH';
  for (const b of L) { kbutton(c, x, yy, w, b.label, b.fn, { main: !b.off && b.label.startsWith(main), off: b.off, short: b.short, sub: b.sub ? fitText(b.sub, w) : '', hint: b.hint }); yy += trGoStep(b); }
}
function drawBrForm(c) { if (BR.wild) return wDrawBrForm(c);
  menuBackdrop(c, 'brform'); kview('brform');
  if (!FORM.brsize) FORM.brsize = 1; if (BR.arenaWant === undefined) BR.arenaWant = 2;
  const S = KIT.sizes, mode = menuMode(), L = trGoList(), bk = KIT.T ? 64 : 54, heads = (c, rx, ry) => amTwelve(c, rx, ry);
  if (mode === 'narrow') {
    // one card: everything scrolls but PLAY WITH ECHOES and BACK
    const cw0 = 228 - 16, top = L.filter(b => !b.echoes), need = trYouH() + 8 + trMatchH(cw0) + 10 + trGoH(top) + 4;
    const F = menuFrame('brform', 228, 29 + need + 8 + S.bh + 10); menuHero(c, 'brform', F);
    const K = kcard(c, F.x, F.y, F.w, F.h, 'brform', 'THE TRIALS', { foot: true, i: 0, right: heads }), cx = K.x + 8, cw = K.w - 16;
    const B = { x: K.x + 1, y: K.by - 2, w: K.w - 2, h: K.footY - 2 - K.by }, dy = need > B.h ? kscroll(c, B, need, 'trform') : 0; let yy = K.by + dy;
    trYou(c, cx, yy, cw - 4); yy += trYouH() + 8; trMatch(c, cx, yy, cw - 4); yy += trMatchH(cw0) + 10; trGoDraw(c, cx, yy, cw - 4, top);
    if (need > B.h) kscrollEnd(c);
    const e = L.find(b => b.echoes); kbutton(c, cx, K.footY + 5, cw - bk - S.gap, e.label, e.fn, { main: !NET.room, short: e.short, hint: e.hint });
    kbutton(c, K.x + K.w - 8 - bk, K.footY + 5, bk, 'BACK', menuBack, { hint: 'Back to the home page.' });
    return;
  }
  const F0 = menuFrame('brform', 640, 400), gw = mode === 'short' ? 168 : min(KIT.T ? 186 : 176, floor(F0.w * .29)), goH = 29 + trGoH(L) + 4 + S.bh + 10;
  if (mode === 'short') {
    // YOU and THE MATCH share a scrolling card beside GO
    const lw = F0.w - gw - 8, cw = lw - 16, need = trYouH() + 10 + trMatchH(cw - 4) + 4, F = menuFrame('brform', 640, max(goH, 29 + need));
    const K = kcard(c, F.x, F.y, lw, F.h, 'brform', 'THE ASHFALL TRIALS', { i: 0, right: heads }), B = { x: K.x + 1, y: K.by - 2, w: K.w - 2, h: K.y + K.h - 3 - K.by + 2 }, dy = need > B.h ? kscroll(c, B, need, 'trform') : 0; let yy = K.by + dy;
    trYou(c, K.x + 8, yy, cw - 4); yy += trYouH() + 10; trMatch(c, K.x + 8, yy, cw - 4);
    if (need > B.h) kscrollEnd(c);
    const G2 = kcard(c, F.x + lw + 8, F.y, gw, F.h, 'brform', 'GO', { foot: true, i: 1 }); trGoDraw(c, G2.x + 8, G2.by + 1, gw - 16, L);
    kbutton(c, G2.x + G2.w - 8 - bk, G2.footY + 5, bk, 'BACK', menuBack, { hint: 'Back to the home page.' });
    return;
  }
  // wide: YOU | THE MATCH | GO
  const yw = min(KIT.T ? 196 : 184, floor(F0.w * .3)), mw = F0.w - yw - gw - 16, youH = trYouH() + 8, F = menuFrame('brform', 640, max(goH, 29 + youH + 4, 29 + trMatchH(mw - 16) + 4));
  const Y = kcard(c, F.x, F.y, yw, F.h, 'brform', 'YOU', { i: 0 }); trYou(c, Y.x + 8, Y.by + 1, yw - 16);
  const M = kcard(c, F.x + yw + 8, F.y, mw, F.h, 'brform', 'THE MATCH', { i: 1, right: heads }); trMatch(c, M.x + 8, M.by + 1, mw - 16);
  const G2 = kcard(c, F.x + yw + mw + 16, F.y, gw, F.h, 'brform', 'GO', { foot: true, i: 2 }); trGoDraw(c, G2.x + 8, G2.by + 1, gw - 16, L);
  kbutton(c, G2.x + G2.w - 8 - bk, G2.footY + 5, bk, 'BACK', menuBack, { hint: 'Back to the home page.' });
}
// the lobby (THE PLINTHS), built with the menu kit: arenaLobby, 26-arena-menus.js (the Wilds' lobby is the same, in violet)
function drawBrLobby(c) { if (BR.wild) return wDrawBrLobby(c); arenaLobby(c, false); }

// ---------------- in the world ----------------
function brDrawBarge(w, b, al) {
  const X = round(b.x), Y = round(b.y), d = b.dir, t = G.time;
  w.fillStyle = INK; w.fillRect(X - 30, Y + 6, 60, 10); w.fillRect(X - 24, Y + 16, 48, 3);
  w.fillStyle = '#7a4a2a'; w.fillRect(X - 29, Y + 7, 58, 8); w.fillStyle = '#a06a3a'; w.fillRect(X - 29, Y + 7, 58, 2); w.fillStyle = '#5a3420'; for (let k = -24; k < 28; k += 8) w.fillRect(X + k, Y + 9, 1, 6);
  w.fillStyle = '#ffd35a'; for (let k = -20; k < 24; k += 10) w.fillRect(X + k, Y + 10, 3, 2);
  w.fillStyle = '#3a2a20'; w.fillRect(X - 1, Y - 22, 2, 29); w.fillRect(X - 20, Y - 16, 1, 23); w.fillRect(X + 19, Y - 16, 1, 23);
  w.fillStyle = INK; w.beginPath(); w.ellipse(X, Y - 26, 34, 13, 0, 0, TAU); w.fill();
  w.fillStyle = '#c94a2e'; w.beginPath(); w.ellipse(X, Y - 26, 33, 12, 0, 0, TAU); w.fill(); w.fillStyle = '#ff7a3d'; w.beginPath(); w.ellipse(X - 3, Y - 29, 28, 7, 0, 0, TAU); w.fill(); w.fillStyle = '#ffb36a'; w.fillRect(X - 18, Y - 34, 22, 2);
  w.fillStyle = '#8f2a1e'; for (let k = -24; k <= 24; k += 12) w.fillRect(X + k, Y - 37, 1, 22);
  const fl = 4 + ((t >> 2) & 3); w.fillStyle = '#ffd35a'; w.fillRect(X - d * 32 - (d > 0 ? fl : 0), Y + 9, fl, 3); w.fillStyle = '#ff7a2a'; w.fillRect(X - d * 32 - (d > 0 ? fl + 2 : -fl), Y + 10, 2, 2);
}
function brWorld(w, al, cx, cy) { if (BR.wild) return wBrWorld(w, al, cx, cy);
  if (!brOn()) return; const q = STN_SPR[CHEST], vx0 = cx - 20, vx1 = cx + VS.vw + 20;
  for (const ch of BR.chests) {
    const px = ch.x * T, py = ch.y * T; if (px < vx0 || px > vx1 || py < cy - 20 || py > cy + VS.vh + 20) continue;
    if (ch.kind === 'bush') { trBush(w, px, py, ch.open); continue; } if (!trLive(ch)) continue;
    if (ch.open) { w.globalAlpha = .55; w.drawImage(q.img, px + q.ox, py + q.oy + 1); w.globalAlpha = 1; w.fillStyle = '#2a1e16'; w.fillRect(px + q.ox + 1, py + q.oy + 1, q.img.width - 2, 2); }
    else { w.drawImage(q.img, px + q.ox, py + q.oy); if (ch.rare) { w.fillStyle = trSealed(ch) ? '#c77dff' : '#ffd35a'; w.fillRect(px + q.ox + 1, py + q.oy, q.img.width - 2, 1); } if (trSealed(ch)) { w.fillStyle = '#c77dff'; w.fillRect(px + q.ox + (q.img.width >> 1) - 1, py + q.oy + 2, 2, 4); } else if (ch.feast && (G.time >> 3) & 1) { w.fillStyle = '#fff1a8'; w.fillRect(px + 3 + ((G.time >> 4) % 3) * 2, py + q.oy - 3, 1, 2); } }
  }
  trWorld(w, al, cx, cy);
}
function brGlider(ctx, f, al) {
  const x = round(lerp(f.px, f.x, al)) + 3, y = round(lerp(f.py, f.y, al)) - 9, k = (G.time >> 3) & 1;
  ctx.fillStyle = INK; ctx.fillRect(x - 10, y - 1, 20, 4); ctx.fillStyle = '#ff7a3d'; ctx.fillRect(x - 9, y, 18, 2); ctx.fillStyle = '#ffd35a'; ctx.fillRect(x - 9, y, 6, 1); ctx.fillRect(x + 3, y, 6, 1);
  ctx.fillStyle = '#c94a2e'; ctx.fillRect(x - 10, y + 2 + k, 2, 1); ctx.fillRect(x + 8, y + 2 + k, 2, 1); ctx.fillStyle = '#d8d4e6'; ctx.fillRect(x - 6, y + 2, 1, 8); ctx.fillRect(x + 5, y + 2, 1, 8);
}
function brActors(ctx, al) { if (BR.wild) return wBrActors(ctx, al); if (!brOn()) return; for (const f of G.fighters) if (f.glide && !f.dead && !f.onBarge && (f !== G.p || !G.p.dead)) brGlider(ctx, f, al); }
// unlit, in the world: the storm curtains, chest prompts, wards over heads
function brOverlay(ctx, al, cx, cy) { if (BR.wild) return wBrOverlay(ctx, al, cx, cy);
  if (!brOn() || !BR.storm) return; const z = BR.storm, vh = VS.vh, top = cy - 4, x0 = cx - 4, x1 = cx + VS.vw + 4;
  if (BR.arena === 1) trSlagDraw(ctx, cx, cy);
  else if (z.dps > 0 || z.moving) {
    const pulse = .26 + .05 * sin(G.time * .05);
    for (const [a, b] of [[x0, min(x1, z.L)], [max(x0, z.R), x1]]) {
      if (b <= a) continue; ctx.fillStyle = `rgba(110,40,130,${pulse})`; ctx.fillRect(a, top, b - a, vh + 8);
      for (let k = 0; k < 40; k++) { const fx = a + ((hh(k, 3, 9) * 997 + G.time * (.3 + hh(k, 4, 9))) % max(1, b - a)), fy = top + ((hh(k, 5, 9) * 613 + G.time * (.6 + hh(k, 6, 9) * .8)) % (vh + 8)); ctx.fillStyle = k % 3 ? 'rgba(255,140,80,.55)' : 'rgba(220,200,255,.5)'; ctx.fillRect(round(fx), round(fy), 1, 2); }
    }
    for (const e of [z.L, z.R]) if (e > x0 - 4 && e < x1 + 4) { const g = .55 + .25 * sin(G.time * .2 + e); ctx.fillStyle = `rgba(255,120,200,${g})`; ctx.fillRect(round(e) - 1, top, 2, vh + 8); ctx.fillStyle = 'rgba(255,220,240,.5)'; ctx.fillRect(round(e), top, 1, vh + 8); }
  }
  const p = G.p; trOverlay(ctx, al, cx, cy);
  for (const f of G.fighters) { if (f === p || f.dead || f.onBarge || !f.brIn || (f.ward || 0) <= 0 || f.x < x0 || f.x > x1) continue; const X = round(lerp(f.px, f.x, al)) - 3, Y = round(lerp(f.py, f.y, al)) - 4; ctx.fillStyle = INK; ctx.fillRect(X - 1, Y - 1, 14, 3); ctx.fillStyle = '#5aa8ff'; ctx.fillRect(X, Y, round(12 * f.ward / 100), 1); }
}
function brScreen(ctx, W, H) { if (BR.wild) return wBrScreen(ctx, W, H);
  if (!brOn()) return;
  if (BR.inStorm) { ctx.fillStyle = BR.arena === 1 ? `rgba(255,90,30,${.16 + .06 * sin(G.time * .1)})` : `rgba(120,40,150,${.14 + .06 * sin(G.time * .1)})`; ctx.fillRect(0, 0, W, H); }
}

// ---------------- the HUD ----------------
function brStrip(c, x, y, w, h) {
  const m = BR.mapCv; c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = 'rgba(40,50,80,.85)'; c.fillRect(x, y, w, h);
  if (m) { c.globalAlpha = .9; c.drawImage(m, 0, round(m.height * .3), m.width, round(m.height * .45), x, y, w, h); c.globalAlpha = 1; }
  const k = w / (BRW * T), z = BR.storm;
  if (z) {
    c.fillStyle = BR.arena === 1 ? 'rgba(255,110,40,.55)' : 'rgba(150,60,170,.55)'; c.fillRect(x, y, max(0, round(z.L * k)), h); c.fillRect(x + round(z.R * k), y, max(0, w - round(z.R * k)), h);
    c.fillStyle = '#ffffff'; c.fillRect(x + round(z.nL * k), y + h, max(1, round((z.nR - z.nL) * k)), 1); c.fillRect(x + round(z.nL * k), y - 1, 1, h + 2); c.fillRect(x + round(z.nR * k), y - 1, 1, h + 2);
  }
  for (const q of BR.pois) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + round(q.x * T * k), y + h - 2, 1, 2); }
  for (const d of BR.drops || []) { const ch = BR.chests[d.i]; if (ch && !ch.open && BR.t >= d.at - TR_WARN * 60) { c.fillStyle = (G.time >> 3) & 1 ? '#ffd35a' : '#ff8a3d'; c.fillRect(x + round(d.x * T * k) - 1, y - 1, 2, h + 2); } }
  if (BR.hearth && BR.t >= trTickAt(TR_FEAST) - 60 * 60 && BR.chests.some(ch => ch.feast && !ch.open)) { c.fillStyle = '#c77dff'; c.fillRect(x + round(BR.hearth * T * k) - 1, y - 1, 2, h + 2); }
  const p = G.p; for (const f of G.fighters) if (trMate(f) && !f.dead && !f.gone) { c.fillStyle = '#7ddc6f'; c.fillRect(x + round((f.x + 3) * k), y - 1, 1, h + 2); }
  c.fillStyle = '#ffd35a'; c.fillRect(x + round((p.x + 3) * k) - 1, y - 2, 3, h + 4);
}
function brHud(c) { if (BR.wild) return wBrHud(c);
  const p = G.p, uw = VS.uw, uh = VS.uh, z = BR.storm, alive = BR.lastAlive;
  if ((p.ward || 0) > 0) { bar(c, 15, 20, 72, 3, p.ward / 100, '#8fd0ff', '#2a62c0'); textO(c, round(p.ward), 91, 17, '#8fd0ff'); }
  // the storm strip and its clock
  const sw = clamp(uw - 280, 140, 260), sx = round((uw - sw) / 2); brStrip(c, sx, 4, sw, 9);
  let msg = '', col = '#fff';
  if (BR.phase === 'drop') { msg = 'stand ready: the horn sounds in ' + max(0, ceil((BR_DROP - BR.t) / 60)) + 's'; col = '#ffd35a'; }
  else if (z && z.moving) { msg = (BR.arena === 1 ? 'THE SLAG RISES  ' : 'THE ASHFALL CLOSES IN  ') + ceil(z.left / 60) + 's'; col = BR.arena === 1 ? '#ffb347' : '#ff9adf'; }
  else if (z && z.i < STORM.length) { msg = (BR.arena === 1 ? 'the slag rises in ' : 'the ashfall moves in ') + ceil(z.left / 60) + 's'; col = BR.arena === 1 ? '#ffd8a8' : '#e8d8ff'; }
  else msg = BR.arena === 1 ? 'the slag is over the summit' : 'the ashfall has closed';
  textC(c, msg, uw / 2, 17, col, 1, textO);
  // who is left
  const bw = 96, bx = uw - bw - 4; c.fillStyle = 'rgba(18,13,31,.66)'; c.fillRect(bx, 4, bw, 22); c.fillStyle = '#ff8a3d'; c.fillRect(bx, 4, 2, 22);
  textO(c, BR.size > 1 ? trTeamsAlive().size + ' TEAMS  ' + alive + ' LEFT' : alive + ' LEFT', bx + 7, 7, '#fff1a8', 1); drawText(c, p.kills + ' taken down', bx + 7, 16, '#d8d4e6'); trHud(c);
  if (BR.inStorm && (G.time >> 4) & 1) textC(c, 'YOU ARE IN THE ' + trHazN(), uw / 2, round(uh * .3), BR.arena === 1 ? '#ffb347' : '#ff9adf', 1, textO);
  if (BR.noteT > 0) { c.globalAlpha = min(1, BR.noteT / 30); textC(c, BR.note, uw / 2, round(uh * .66), '#fff', 1, textO); c.globalAlpha = 1; }
  if (p.brUse) { const u = p.brUse, it = IT[u.id], hb = hotbarLayout(), w2 = 110, x2 = round((uw - w2) / 2), y2 = hb.y - 24; textC(c, (it.ward ? 'MENDING YOUR WARD' : 'APPLYING ' + it.name.toUpperCase()), uw / 2, y2 - 9, it.ward ? '#8fd0ff' : '#7ddc6f', 1, textO); bar(c, x2, y2, w2, 4, u.t / u.dur, it.ward ? '#8fd0ff' : '#7ddc6f', '#2b2740'); }
  if (keys.Tab && !UI.open) brScore(c);
  if (BR.mapOpen && !UI.open) brMap(c);
  if (p.dead && BR.phase !== 'over') brDeadPanel(c);
  if (BR.phase === 'over' && BR.overT > 80) brResults(c);
}
function brScore(c) {
  const list = G.fighters.filter(f => f.brIn).sort((a, b) => (a.dead - b.dead) || b.kills - a.kills);
  if (BR.size > 1) list.sort((a, b) => a.team < b.team ? -1 : a.team > b.team ? 1 : 0);
  amScore(c, 'THE ASHFALL : ' + BR.lastAlive + ' OF ' + list.length + ' LEFT', '#ff8a3d', list, f => ({ bar: BR.size > 1 ? TR_TEAMCOL[(+String(f.team).slice(1) | 0) % TR_TEAMCOL.length] : null }));
}
function brMap(c) {
  const m = BR.mapCv; if (!m) return; const uw = VS.uw, uh = VS.uh, w = min(uw - 30, 520), k = w / m.width, sy0 = 8, sh = 48, h = round(sh * k), x = round((uw - w) / 2), y = amClearY(x - 8, max((KIT.T ? 42 : 30) + 30, round((uh - h) / 2) - 10) - 30, w + 16, h + 46) + 30;
  amMapCard(c, x - 8, y - 30, w + 16, h + 46, 'gold: chests   red: berries   grey: anvils   green: your team'); c.fillStyle = '#2a3150'; c.fillRect(x, y, w, h); c.drawImage(m, 0, sy0, m.width, sh, x, y, w, h);
  const s = w / (BRW * T), oy = sy0 * 2 * T * s, z = BR.storm;
  if (z) { c.fillStyle = BR.arena === 1 ? 'rgba(255,110,40,.45)' : 'rgba(150,60,170,.45)'; c.fillRect(x, y, round(z.L * s), h); c.fillRect(x + round(z.R * s), y, w - round(z.R * s), h); c.fillStyle = '#ffffff'; c.fillRect(x + round(z.nL * s), y, 1, h); c.fillRect(x + round(z.nR * s), y, 1, h); }
  for (const q of BR.pois) { if (q.camp) continue; const X = x + round(q.x * T * s), Y = y + round(heights[q.x] * T * s - oy) - 14; textC(c, q.name, X, max(y + 2, Y), '#fff1a8', 1, textO); }
  for (const ch of BR.chests) if (!ch.open && !ch.cave && trLive(ch)) { c.fillStyle = ch.kind === 'bush' ? '#e2483b' : ch.feast ? '#c77dff' : ch.rare ? '#ffd35a' : 'rgba(255,200,120,.7)'; c.fillRect(x + round(ch.x * T * s), y + round(ch.y * T * s - oy), ch.kind === 'drop' ? 3 : 1, ch.kind === 'drop' ? 3 : 1); }
  for (const d of BR.drops || []) if (BR.t < d.at && BR.t >= d.at - TR_WARN * 60) textC(c, 'SUPPLIES', x + round(d.x * T * s), y + round(d.y * T * s - oy) - 10, '#ffd35a', 1, textO);
  for (const a of BR.anvils || []) { c.fillStyle = '#b9bdd0'; c.fillRect(x + round(a.x * T * s), y + round(a.y * T * s - oy) - 1, 2, 2); }
  for (const f of G.fighters) if (trMate(f) && !f.dead && !f.gone) { c.fillStyle = '#7ddc6f'; c.fillRect(x + round((f.x + 3) * s) - 1, y + clamp(round((f.y + 10) * s - oy), 2, h - 2) - 1, 3, 3); }
  const p = G.p, me = p, my = clamp(round((me.y + 10) * s - oy), 2, h - 2); c.fillStyle = '#ffd35a'; c.fillRect(x + round((me.x + 3) * s) - 2, y + my - 2, 5, 5); c.fillStyle = INK; c.fillRect(x + round((me.x + 3) * s), y + my, 1, 1);
}
// the dead and results cards (amEndCard, 26-arena-menus.js): above the hotbar, the buttons inside them
function brDeadPanel(c) {
  const p = G.p, by = p.lastHitBy; if (p.deadT < 20) return;
  const lines = [[(BR.place ? '#' + BR.place + ' of ' + (BR.size > 1 ? BR.nteams + ' teams' : BR.total) : 'Your team fights on.'), '#fff']]; if (by && !by.gone) lines.push([by.name + ' got you.', '#ff9a8a']);
  const btn = p.deadT <= 60 || trCanRise(p) ? [] : [BR.via !== 'solo' ? ['BACK TO LOBBY', () => brBackToLobby(), 'Back to the lobby for the next match.'] : ['PLAY AGAIN', () => brSolo(), 'Another match against echoes.'], ['LEAVE', () => brLeave(), 'Back to the home page.']];
  amEndCard(c, { title: 'TAKEN DOWN', col: '#e2483b', art: 'fallen', ms: (p.deadT - 20) * 16.7, lines, spec: BR.spec, specNext: brSpecNext, buttons: btn, footNote: trCanRise(p) ? 'A teammate can still rekindle you.' : '' });
}
function brResults(c) {
  const [tt, ts] = trTitle(), S0 = BR.st, C = trCareer(), win = BR.winMe;
  const s1 = win ? (BR.size > 1 ? 'Your team outlasted every other.' : 'You are the last ember burning.') : BR.winner ? BR.winner + (BR.size > 1 ? ' outlasted everyone.' : ' is the last ember.') : 'Nobody walked out of the ashfall.';
  const lines = [[s1, win ? '#ffd35a' : '#fff'], ['You placed #' + (BR.place || 1) + ' of ' + (BR.size > 1 ? BR.nteams + ' teams' : BR.total) + '  :  ' + G.p.kills + ' taken down  :  day ' + trClock().day, '#d8d4e6'], ['you were ' + tt, '#8ff5e6'], [ts, '#b9bdd0'],
    [(S0.crisp | 0) + ' crisp  :  ' + (S0.clean | 0) + ' clean  :  ' + (S0.clash | 0) + ' clashes  :  ' + (S0.dealt | 0) + ' damage', '#d8d4e6'], ['your record: ' + C.n + ' trials, ' + C.w + ' won, ' + C.k + ' taken down', '#8b8fa3']];
  if (BR.via !== 'solo') lines.push(['back to the lobby in ' + max(0, ceil((60 * 14 - BR.overT) / 60)) + 's', '#8b8fa3']);
  amEndCard(c, { title: win ? 'VICTORY' : BR.arena === 1 ? 'THE SLAG COOLS' : 'THE ASHFALL SETTLES', col: win ? '#ffd35a' : '#c77dff', art: win ? 'crown' : 'ashring', ms: (BR.overT - 80) * 16.7, lines,
    buttons: [BR.via !== 'solo' ? ['BACK TO LOBBY', () => brBackToLobby(), 'Back to the lobby for the next match.'] : ['PLAY AGAIN', () => brSolo(), 'Another match against echoes.'], ['LEAVE', () => brLeave(), 'Back to the home page.']] });
}
// rarity: a coloured edge on a stack in the hotbar, and a glow under drops
const brTierOf = id => { const k = brTier(id); return k; };
function brDropGlow(w, d, x, y) { const k = brTier(d.id); if (k < 1) return; w.globalAlpha = .35 + .15 * sin(G.time * .1 + d.x); w.fillStyle = BR_TCOL[k]; w.fillRect(round(x) - 4, round(y) + 3, 9, 2); w.fillRect(round(x) - 1, round(y) - 6, 2, 9); w.globalAlpha = 1; }
