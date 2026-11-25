// ============================================================
//  The Ashfall on screen: the menu, the lobby, chests and parcels,
//  the storm, the match HUD, the map, and the end of a match.
// ============================================================
function drawBrForm(c) {
  const uw = VS.uw, uh = VS.uh, w = min(350, uw - 16), h = 300, x = round((uw - w) / 2), y = max(8, round((uh - h) / 2));
  c.fillStyle = 'rgba(18,13,31,.55)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'THE ASHFALL : BATTLE ROYALE');
  const fx = x + 10, fw = w - 20;
  drawText(c, 'NAME', fx, y + 22, '#b9bdd0'); field(c, fx + 46, y + 18, fw - 46, 'nick', 'WAKER');
  skinPicker(c, fx, y + 38);
  drawText(c, 'MATCH', fx, y + 70, '#b9bdd0'); field(c, fx + 46, y + 66, fw - 46, 'brcode', 'open  (or a private code)');
  const ranked = !!FORM.brRanked, p = brProfile();
  button(c, fx + 46, y + 84, (fw - 46) / 2 - 2, 15, 'UNRANKED', () => { FORM.brRanked = false; }, { on: !ranked });
  button(c, fx + 46 + (fw - 46) / 2 + 2, y + 84, (fw - 46) / 2 - 2, 15, 'RANKED', () => { FORM.brRanked = true; }, { on: ranked });
  drawText(c, `${brTitle(brPassLevel())}  ·  PASS ${brPassLevel()}  ·  ${p.xp % 1000}/1000 XP  ·  ELO ${p.elo}  ·  ${p.wins} WINS`, fx, y + 106, '#8ff5e6');
  const L = ['32 Wakers fall from the sky with empty hands. Last one wins.', 'Gather, dig and make your weapons: chests hold little.', 'The ashfall moves when Wakers fall. Beasts hunt by night.', 'Dig too deep and the lava takes you. [P] offers a pact.'];
  L.forEach((l, i) => drawText(c, l, fx, y + 120 + i * 10, '#d8d4e6'));
  const go = (fn) => { UI.focus = null; const nick = cleanName(FORM.nick) || 'WAKER'; FORM.nick = nick; G.nick = nick; G.skin = FORM.skin | 0; BR.matchType = FORM.brRanked ? 'ranked' : 'unranked'; accountSaveProfile(); G.state = 'loading'; G.loadMsg = 'Raising the island...'; setTimeout(fn, 30); };
  let by = y + 182;
  if (NET.room) { button(c, fx, by, fw, 17, 'PLAY ONLINE', () => go(() => brLobbyEnter('room', cleanCode(FORM.brcode) || 'open'))); drawText(c, 'Queue is separate for ranked and unranked matches.', fx, by + 20, '#8b8fa3'); by += 34; }
  else { drawText(c, 'Online lobby: open this page on claude.ai to find others.', fx, by + 4, '#ffb347'); by += 16; }
  if (netOK()) { button(c, fx, by, fw, 17, 'HOST A MATCH FOR FRIENDS', () => go(() => { COOP.br = true; brLobbyEnter('rtc', 'friends'); })); drawText(c, 'Invite up to 7 friends with codes; they pick JOIN A FRIEND.', fx, by + 20, '#8b8fa3'); by += 34; }
  button(c, fx, by, fw, 17, 'PLAY WITH ECHOES', () => go(() => brSolo())); by += 22;
  button(c, x + w - 70, y + h - 22, 60, 15, 'BACK', () => { G.state = 'title'; UI.focus = null; sfx('ui'); });
}
function drawBrLobby(c) {
  const uw = VS.uw, uh = VS.uh, host = BR.via === 'rtc' && netHost(), w = min(384, uw - 16), h = host ? 250 : 196, x = round((uw - w) / 2), y = max(8, round((uh - h) / 2)), fx = x + 10, fw = w - 20;
  c.fillStyle = 'rgba(18,13,31,.5)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'THE ASHFALL : LOBBY' + (BR.via === 'room' ? '  (' + BR.code.toUpperCase() + ')' : ''));
  const me = brMe(), list = [{ id: me, n: G.nick, me: true }]; for (const [id, q] of BR.people) list.push({ id, n: q.n, ph: q.ph });
  list.sort((a, b) => (a.ph === 'M') - (b.ph === 'M') || (a.id < b.id ? -1 : 1));
  let ty = y + 18;
  drawText(c, 'WAKERS HERE', fx, ty, '#b9bdd0'); ty += 11;
  drawText(c, `${list.length} / ${BR_MAX}  ·  ${BR.matchType.toUpperCase()}`, fx + 100, ty, '#8ff5e6');
  list.slice(0, 8).forEach((e, i) => { const lead = e.id === BR.leaderId && e.ph !== 'M'; drawText(c, (e.me ? '> ' : '  ') + e.n + (e.me ? ' (you)' : ''), fx + (i >= 4 ? fw / 2 : 0), ty + (i % 4) * 10, e.ph === 'M' ? '#8b8fa3' : e.me ? '#ffd35a' : '#8ff5e6'); if (lead) drawText(c, 'LEADS', fx + (i >= 4 ? fw / 2 : 0) + 110, ty + (i % 4) * 10, '#7ddc6f'); if (e.ph === 'M') drawText(c, 'IN A MATCH', fx + (i >= 4 ? fw / 2 : 0) + 110, ty + (i % 4) * 10, '#8b8fa3'); });
  ty += 44;
  const now = performance.now(), cd = BR.lead ? (BR.cdEnd ? max(0, ceil((BR.cdEnd - now) / 1000)) : -1) : BR.lastCd > 0 ? BR.lastCd : -1;
  let st;
  if (BR.via === 'room' && NET.status === 'offline') st = ['The live room cannot be reached from here.', '#ffb347'];
  else if (BR.via === 'room' && !NET.me) st = ['Joining the lobby...', '#ffd35a'];
  else if (BR.via === 'rtc' && BR.lead) st = [BR.lobbyN > 1 ? 'Everyone here? Press START NOW. Echoes fill the empty places.' : 'Give your friends the game code below, then press START NOW.', '#7ddc6f'];
  else if (BR.busy && cd < 0) st = ['A match is running. The next one starts when it ends (or start now).', '#ffd35a'];
  else if (cd >= 0) st = ['The sky opens in ' + cd + 's' + (BR.lobbyN < 2 ? '  (echoes fill the empty places)' : ''), '#7ddc6f'];
  else st = ['Waiting for the leader...', '#d8d4e6'];
  wrapDraw(c, st[0], fx, ty, fw, st[1]); ty += 22;
  if (BR.via === 'room' && NET.status === 'offline') button(c, fx, ty, 150, 15, 'PLAY WITH ECHOES', () => { brLeave(); brSolo(); });
  else if (BR.lead) button(c, fx, ty, 150, 15, 'START NOW', () => { BR.startNow = true; sfx('ui'); });
  else if (BR.via === 'rtc') drawText(c, 'Your host starts the match.', fx, ty + 4, '#8b8fa3');
  ty += 22;
  if (host) {
    if (!netOK()) drawText(c, 'This window cannot connect to other computers.', fx, ty, '#ffb347');
    else {
      sigHost('br'); drawText(c, 'GAME CODE: friends pick JOIN A FRIEND and type it', fx, ty, '#d8d4e6'); ty += 11;
      c.fillStyle = '#16121f'; c.fillRect(fx, ty, fw, 26); textC(c, sigSpaced(COOP.gcode || '......'), fx + (fw - 64) / 2, ty + 5, '#ffd35a', 2, textO);
      button(c, fx + fw - 60, ty + 7, 56, 12, copyLabel(), () => copyText(COOP.gcode, 'gcopy')); ty += 31;
      const s2 = COOP.err || COOP.note || (sigReady() ? 'Ready: up to 7 friends can join this lobby.' : performance.now() - SIG.startT > 7000 ? "Can't reach the internet, so friends can't find this match." : 'Getting ready...');
      if (COOP.copied > 0 && COOP.copyFail) copyHint(c, fx, ty); else wrapDraw(c, s2, fx, ty, fw, COOP.err ? '#ff9a8a' : sigReady() ? '#7ddc6f' : '#ffd35a');
    }
  }
  drawText(c, BR.via === 'room' ? 'Friends need this page: share it from claude.ai.' : BR.via === 'rtc' ? 'Up to 8 Wakers; echoes fill the 32-player match.' : '', fx, y + h - 16, '#8b8fa3');
  button(c, x + w - 70, y + h - 20, 60, 14, 'LEAVE', () => { brLeave(); sfx('ui'); });
}

// ---------------- in the world ----------------
function brWorld(w, al, cx, cy) {
  if (!brOn()) return; const q = STN_SPR[CHEST], vx0 = cx - 20, vx1 = cx + VS.vw + 20;
  for (const ch of BR.chests) {
    if (ch.hid) continue; const px = ch.x * T, py = ch.y * T; if (px < vx0 || px > vx1 || py < cy - 20 || py > cy + VS.vh + 20) continue;
    if (ch.open) { w.globalAlpha = .55; w.drawImage(q.img, px + q.ox, py + q.oy + 1); w.globalAlpha = 1; w.fillStyle = '#2a1e16'; w.fillRect(px + q.ox + 1, py + q.oy + 1, q.img.width - 2, 2); }
    else { w.drawImage(q.img, px + q.ox, py + q.oy); if (ch.rare || ch.crown || ch.feast) { w.fillStyle = ch.feast || ch.crown ? '#8ff5e6' : '#ffd35a'; w.fillRect(px + q.ox + 1, py + q.oy, q.img.width - 2, 1); } if (ch.feast) { w.globalAlpha = .22 + .16 * sin(G.time * .08); w.fillStyle = '#8ff5e6'; w.fillRect(px - 2, py - 2, 13, 11); w.globalAlpha = 1; } }
  }
  for (const g of BR.gifts) {
    const X = round(lerp(g.px, g.x, al)), Y = round(lerp(g.py, g.y, al)); if (X < vx0 || X > vx1) continue;
    if (!g.land) { w.fillStyle = INK; w.fillRect(X - 9, Y - 22, 18, 6); w.fillStyle = '#c9d8e8'; w.fillRect(X - 8, Y - 21, 16, 4); w.fillStyle = '#ffffff'; w.fillRect(X - 6, Y - 22, 12, 2); w.fillStyle = '#8fa0b4'; w.fillRect(X - 8, Y - 17, 16, 1); w.fillStyle = '#d8d4e6'; w.fillRect(X - 6, Y - 16, 1, 9); w.fillRect(X + 5, Y - 16, 1, 9); w.fillRect(X, Y - 16, 1, 8); }
    w.fillStyle = INK; w.fillRect(X - 5, Y - 8, 10, 8); w.fillStyle = '#aab8c8'; w.fillRect(X - 4, Y - 7, 8, 6); w.fillStyle = '#ffd35a'; w.fillRect(X - 1, Y - 7, 2, 6); w.fillRect(X - 4, Y - 5, 8, 1);
  }
}
// a canopy over whoever is coming down, in their own colours: it leans the way they steer, and closes in a dive
const BR_CHUTE = [['#ff7a3d', '#ffd35a'], ['#5aa8ff', '#dcf0ff'], ['#e2483b', '#ffd0c0'], ['#7ddc6f', '#e8ffd8'], ['#c77dff', '#f0dcff'], ['#8ff5e6', '#ffffff']];
function brGlider(ctx, f, al) {
  const x = round(lerp(f.px, f.x, al)) + 3, y = round(lerp(f.py, f.y, al)) + 5, k = f.chute = approach(f.chute === undefined ? 1 : f.chute, f.vy > 2.2 ? .5 : 1, .05), C = BR_CHUTE[abs(f.skin | 0) % BR_CHUTE.length];
  const w = 18 * k, h = round(12 / (.4 + .6 * k)), top = y - 22 - h, lean = clamp(f.vx * 1.7, -6, 6) + sin(G.time * .045 + (f.slotX || 0)) * 1.5;
  ctx.fillStyle = 'rgba(232,228,244,.75)'; for (const s of [-1, -.36, .36, 1]) for (let q = 0; q <= 1; q += .09) ctx.fillRect(round(lerp(x + lean * .6 + s * w * .94, x + sign(s) * 2, q)), round(lerp(top + h, y, q)), 1, 1);
  for (let r = 0; r < h; r++) {
    const u = (r + 1) / h, half = max(2, round(w * sqrt(1 - (1 - u) * (1 - u)))), X = round(x + lean * (1 - u * .4)), Y = top + r, low = r === h - 1;
    if (!low) { ctx.fillStyle = INK; ctx.fillRect(X - half - 1, Y, half * 2 + 2, 1); }
    for (let n = 0; n < 5; n++) { const a = round(X - half + n * half * .4), b = round(X - half + (n + 1) * half * .4), cut = low ? 1 : 0; if (b - a - cut * 2 < 1) continue; ctx.fillStyle = C[n & 1]; ctx.fillRect(a + cut, Y, b - a - cut * 2, 1); if (n > 2) { ctx.fillStyle = 'rgba(18,13,31,.22)'; ctx.fillRect(a + cut, Y, b - a - cut * 2, 1); } }
  }
  ctx.fillStyle = INK; ctx.fillRect(round(x + lean) - round(w * .4), top - 1, max(2, round(w * .8)), 1);
}
function brActors(ctx, al) {
  if (!brOn()) return; const x0 = G.rcx - 40, x1 = G.rcx + VS.vw + 40;
  for (const f of G.fighters) if (f.glide && !f.dead && f.x > x0 && f.x < x1) brGlider(ctx, f, al);
  // the Marked One
  const b = BR.bounty; if (b && !b.dead && b !== G.p && b.x > x0 && b.x < x1) { const X = round(lerp(b.px, b.x, al)) + 3, Y = round(lerp(b.py, b.y, al)) - 22 + round(sin(G.time * .1)); ctx.fillStyle = INK; ctx.fillRect(X - 3, Y - 1, 7, 5); ctx.fillStyle = '#ff3b2a'; ctx.fillRect(X - 2, Y, 5, 1); ctx.fillRect(X - 1, Y + 1, 3, 1); ctx.fillRect(X, Y + 2, 1, 1); }
}
// unlit, in the world: the storm curtains, prompts, wards over heads, the breath of the deep
function brOverlay(ctx, al, cx, cy) {
  if (!brOn() || !BR.storm) return; const z = BR.storm, vh = VS.vh, top = cy - 4, x0 = cx - 4, x1 = cx + VS.vw + 4;
  if (z.dps > 0 || z.moving) {
    const pulse = .26 + .05 * sin(G.time * .05);
    for (const [a, b] of [[x0, min(x1, z.L)], [max(x0, z.R), x1]]) {
      if (b <= a) continue; ctx.fillStyle = `rgba(110,40,130,${pulse})`; ctx.fillRect(a, top, b - a, vh + 8);
      for (let k = 0; k < 40; k++) { const fx = a + ((hh(k, 3, 9) * 997 + G.time * (.3 + hh(k, 4, 9))) % max(1, b - a)), fy = top + ((hh(k, 5, 9) * 613 + G.time * (.6 + hh(k, 6, 9) * .8)) % (vh + 8)); ctx.fillStyle = k % 3 ? 'rgba(255,140,80,.55)' : 'rgba(220,200,255,.5)'; ctx.fillRect(round(fx), round(fy), 1, 2); }
    }
    for (const e of [z.L, z.R]) if (e > x0 - 4 && e < x1 + 4) { const g = .55 + .25 * sin(G.time * .2 + e); ctx.fillStyle = `rgba(255,120,200,${g})`; ctx.fillRect(round(e) - 1, top, 2, vh + 8); ctx.fillStyle = 'rgba(255,220,240,.5)'; ctx.fillRect(round(e), top, 1, vh + 8); }
  }
  // a burning or a choking stretch
  const h = BR.hazard; if (h && BR.t > h.at - 600 && h.R > x0 && h.L < x1) { const on = BR.t >= h.at, col = h.kind === 'fire' ? '255,90,30' : '120,220,90', a = on ? .13 + .04 * sin(G.time * .08) : .05; ctx.fillStyle = `rgba(${col},${a})`; ctx.fillRect(max(x0, h.L), top, min(x1, h.R) - max(x0, h.L), vh + 8); for (const e of [h.L, h.R]) if (e > x0 && e < x1) { ctx.fillStyle = `rgba(${col},${on ? .55 : .25})`; ctx.fillRect(round(e), top, 1, vh + 8); } if (on && h.kind === 'gas') for (let k = 0; k < 26; k++) { const fx = max(x0, h.L) + ((hh(k, 3, 8) * 997 + G.time * .4) % max(1, min(x1, h.R) - max(x0, h.L))), fy = top + hh(k, 4, 8) * vh + sin(G.time * .03 + k) * 10; ctx.fillStyle = 'rgba(150,230,110,.16)'; ctx.fillRect(round(fx) - 9, round(fy) - 4, 18, 8); } }
  // heat shimmering off the deep
  if (cy + vh > (BR_HOT - 8) * T) { const n = 26; for (let k = 0; k < n; k++) { const fx = cx + ((hh(k, 1, 4) * 900 + G.time * (hh(k, 2, 4) - .5) * .6) % VS.vw + VS.vw) % VS.vw, fy = cy + vh - ((hh(k, 3, 4) * 700 + G.time * (.35 + hh(k, 4, 4) * .8)) % (vh + 20)); if (fy < (BR_HOT - 10) * T) continue; ctx.globalAlpha = clamp((fy - (BR_HOT - 10) * T) / 120, 0, .8); ctx.fillStyle = k % 3 ? '#ff7a2a' : '#ffd35a'; ctx.fillRect(round(fx), round(fy), 1, 1); } ctx.globalAlpha = 1; }
  const p = G.p;
  if (!p.dead && !p.glide && !UI.open) {
    const g = brNearGift(p), ch = !g && brNearChest(p, 22), tip = (s, X, Y, col) => textO(ctx, s, round(X - textW(s) / 2), Y, col);
    if (g) tip('[F] OPEN THE PARCEL', g.x, g.y - 20, '#c9d8e8'); else if (ch) tip('[F] OPEN', ch.x * T + 4, ch.y * T - 10, ch.feast || ch.crown ? '#8ff5e6' : ch.rare ? '#ffd35a' : '#fff');
    else { const s = brNearStation(p, 4); if (s) tip('[F] ' + TP[s.id].name.toUpperCase(), s.x * T + 4, s.y * T - 12, '#d8d4e6'); else if (!BR.teammate) { let o = null, bd = 40; for (const f of G.fighters) if (f !== p && f.brIn && !f.dead && !f.noHit && f.team !== p.team && !(f.lastHitBy === p && f.takenT > 0)) { const d = hypot(f.x - p.x, f.y - p.y); if (d < bd) { bd = d; o = f; } } if (o && p.takenT <= 0) tip('[P] OFFER A PACT', o.x + 3, o.y - 30, '#8ff5e6'); } }
  }
  for (const f of G.fighters) { if (f === p || f.dead || !f.brIn || (f.ward || 0) <= 0 || f.x < x0 || f.x > x1) continue; const X = round(lerp(f.px, f.x, al)) - 3, Y = round(lerp(f.py, f.y, al)) - 4; ctx.fillStyle = INK; ctx.fillRect(X - 1, Y - 1, 14, 3); ctx.fillStyle = '#5aa8ff'; ctx.fillRect(X, Y, round(12 * f.ward / 100), 1); }
}
function brScreen(ctx, W, H) {
  if (!brOn()) return;
  if (BR.inStorm) { ctx.fillStyle = `rgba(120,40,150,${.14 + .06 * sin(G.time * .1)})`; ctx.fillRect(0, 0, W, H); }
  const deep = clamp(((G.cam.y + VS.vh * .6) / T - (BR_HOT - 14)) / 30, 0, 1); if (deep > .01) { ctx.fillStyle = `rgba(255,80,20,${.16 * deep * (.85 + .15 * sin(G.time * .07))})`; ctx.fillRect(0, 0, W, H); }
}

// ---------------- the HUD ----------------
function brStrip(c, x, y, w, h) {
  const m = BR.mapCv; c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = 'rgba(40,50,80,.85)'; c.fillRect(x, y, w, h);
  if (m) { c.globalAlpha = .9; c.drawImage(m, 0, round(m.height * .19), m.width, round(m.height * .28), x, y, w, h); c.globalAlpha = 1; }
  const k = w / (BRW * T), z = BR.storm;
  if (z) {
    c.fillStyle = 'rgba(150,60,170,.55)'; c.fillRect(x, y, max(0, round(z.L * k)), h); c.fillRect(x + round(z.R * k), y, max(0, w - round(z.R * k)), h);
    if (z.warn || z.moving) { c.fillStyle = '#ffffff'; c.fillRect(x + round(z.nL * k), y + h, max(1, round((z.nR - z.nL) * k)), 1); c.fillRect(x + round(z.nL * k), y - 1, 1, h + 2); c.fillRect(x + round(z.nR * k), y - 1, 1, h + 2); }
  }
  const hz = BR.hazard; if (hz && BR.t > hz.at - 600) { c.fillStyle = hz.kind === 'fire' ? (G.time >> 4) & 1 ? 'rgba(255,110,40,.8)' : 'rgba(255,150,60,.5)' : (G.time >> 4) & 1 ? 'rgba(130,230,90,.75)' : 'rgba(130,230,90,.4)'; c.fillRect(x + round(hz.L * k), y, max(2, round((hz.R - hz.L) * k)), h); }
  for (const q of BR.pois) { c.fillStyle = q.crown ? '#ffd35a' : 'rgba(255,255,255,.35)'; c.fillRect(x + round(q.x * T * k), y + h - (q.crown ? 4 : 2), q.crown ? 2 : 1, q.crown ? 4 : 2); }
  const a = brAlly(); if (a && !a.dead) { c.fillStyle = '#8ff5e6'; c.fillRect(x + round((a.x + 3) * k) - 1, y - 1, 2, h + 2); }
  const b = BR.bounty; if (b && !b.dead && b !== G.p) { c.fillStyle = '#ff3b2a'; c.fillRect(x + round((b.x + 3) * k) - 1, y - 2, 2, h + 3); }
  const p = G.p; c.fillStyle = '#ffd35a'; c.fillRect(x + round((p.x + 3) * k) - 1, y - 2, 3, h + 4);
}
function brHud(c) {
  const p = G.p, uw = VS.uw, uh = VS.uh, z = BR.storm, alive = BR.lastAlive;
  if ((p.ward || 0) > 0) { bar(c, 15, 26, 72, 3, p.ward / 100, '#8fd0ff', '#2a62c0'); textO(c, round(p.ward), 91, 24, '#8fd0ff'); }
  // the strip, and what the border is waiting for
  const sw = clamp(uw - 280, 140, 260), sx = round((uw - sw) / 2); brStrip(c, sx, 4, sw, 9);
  let msg = '', col = '#fff';
  if (BR.phase === 'drop' && BR.t < BR_HOLD) { msg = 'THE GAMES BEGIN IN ' + ceil((BR_HOLD - BR.t) / 60); col = '#ffd35a'; }
  else if (BR.phase === 'drop') { msg = p.glide ? 'A / D steer   S dive' : 'find something sharp'; col = '#d8d4e6'; }
  else if (z && z.moving) { msg = 'THE ASHFALL CLOSES IN'; col = '#ff9adf'; }
  else if (z && z.warn) { msg = 'THE ASHFALL WILL MOVE IN ' + ceil(z.left / 60) + 's'; col = '#ffb0e8'; }
  else if (z && !z.done) { msg = 'the ashfall waits until ' + z.next + ' are left'; col = '#e8d8ff'; }
  else msg = 'the ashfall has closed';
  textC(c, msg, uw / 2, 17, col, 1, textO);
  if (BR.phase === 'drop' && BR.t < BR_HOLD) textC(c, String(ceil((BR_HOLD - BR.t) / 60)), uw / 2, round(uh * .34), '#ffd35a', 3, textO);
  if (BR.feast === 1) textC(c, 'the feast in ' + max(0, ceil((BR.feastAt - BR.t) / 60)) + 's', uw / 2, 27, '#8ff5e6', 1, textO);
  // who is left
  const a = brAlly(), bw = 104, bx = uw - bw - 4, bh = a ? 34 : 22; c.fillStyle = 'rgba(18,13,31,.66)'; c.fillRect(bx, 4, bw, bh); c.fillStyle = '#ff8a3d'; c.fillRect(bx, 4, 2, bh);
  textO(c, alive + ' LEFT', bx + 7, 7, '#fff1a8', 1); drawText(c, p.kills + ' taken down', bx + 7, 16, '#d8d4e6');
  if (a) { drawText(c, 'PACT : ' + a.name.slice(0, 10), bx + 7, 25, '#8ff5e6'); bar(c, bx + 7, 34, bw - 14, 1, a.hp / a.maxhp, '#4fd8c8', '#2a8a80'); }
  if (BR.inStorm && (G.time >> 4) & 1) textC(c, 'YOU ARE IN THE ASHFALL', uw / 2, round(uh * .3), '#ff9adf', 1, textO);
  const depth = floor((p.y + p.h) / T) - heights[clamp(floor((p.x + 3) / T), 0, BRW - 1)]; if (!p.dead && depth > 14) { const row = floor((p.y + p.h) / T), hot = row > BR_HOT - 20; textC(c, depth + ' deep' + (hot ? '   ·   lava ' + max(0, BR_LAVA - row) + ' below' : ''), uw / 2, 27 + (BR.feast === 1 ? 10 : 0), hot ? ((G.time >> 4) & 1 ? '#ff7a2a' : '#ffd35a') : '#b9bdd0', 1, textO); }
  if (BR.noteT > 0) { c.globalAlpha = min(1, BR.noteT / 30); textC(c, BR.note, uw / 2, round(uh * .66), BR.leaveT > 0 ? '#ffb0b0' : '#fff', 1, textO); c.globalAlpha = 1; }
  if (p.brUse) { const u = p.brUse, it = IT[u.id], hb = hotbarLayout(), w2 = 110, x2 = round((uw - w2) / 2), y2 = hb.y - 24; textC(c, (it.ward ? 'MENDING YOUR WARD' : 'APPLYING ' + it.name.toUpperCase()), uw / 2, y2 - 9, it.ward ? '#8fd0ff' : '#7ddc6f', 1, textO); bar(c, x2, y2, w2, 4, u.t / u.dur, it.ward ? '#8fd0ff' : '#7ddc6f', '#2b2740'); }
  if (BR.show) brSky(c);
  if (keys.Tab && !UI.open) brScore(c);
  if (BR.mapOpen && !UI.open) brMap(c);
  if (p.dead && BR.phase !== 'over') brDeadPanel(c);
  if (BR.phase === 'over' && BR.overT > 80) brResults(c);
}
// the fallen: their faces hang in the sky a while
function brSky(c) {
  const S = BR.show, uw = VS.uw, a = clamp(min(S.t / 50, (420 - S.t) / 60), 0, 1), L = S.list.slice(-10), w = 46, per = max(1, min(L.length, floor((uw - 40) / w))), y0 = 62;
  c.globalAlpha = a; textC(c, 'THE FALLEN', uw / 2, y0, '#c9e8ff', 1, textO);
  L.forEach((f, i) => { const row = floor(i / per), n = min(per, L.length - row * per), x = round(uw / 2 - n * w / 2 + (i % per) * w + w / 2), y = y0 + 12 + row * 34, hd = (SK[f.skin] || SK[0]).head; c.globalAlpha = a * .3; c.fillStyle = '#8fd0ff'; c.fillRect(x - 10, y - 1, 20, 20); c.globalAlpha = a * .92; c.drawImage(hd, x - 8, y, 16, 16); textC(c, f.name, x, y + 21, '#dcefff', 1, textO); });
  if (S.list.length > L.length) textC(c, 'and ' + (S.list.length - L.length) + ' more', uw / 2, y0 + 12 + ceil(L.length / per) * 34, '#b9bdd0', 1, textO); c.globalAlpha = 1;
}
function brScore(c) {
  const list = G.fighters.filter(f => f.brIn).sort((a, b) => (a.dead - b.dead) || b.kills - a.kills), uw = VS.uw, two = list.length > 16, w = two ? 380 : 200, rows = two ? 16 : list.length, h = 22 + rows * 10, x = round((uw - w) / 2), y = 40;
  panel(c, x, y, w, h, 'THE ASHFALL : ' + BR.lastAlive + ' OF ' + list.length + ' LEFT');
  list.slice(0, 32).forEach((f, i) => { const xx = x + (two && i >= 16 ? 190 : 0), yy = y + 16 + (i % 16) * 10, ally = f !== G.p && f.team === G.p.team; drawText(c, (f === G.p ? '> ' : ally ? '+ ' : '') + f.name + (f.brBot || f.ghostBot ? '  (echo)' : ''), xx + 8, yy, f.dead ? '#6a6485' : f === G.p ? '#ffd35a' : ally ? '#8ff5e6' : f.brBot || f.ghostBot ? '#d8d4e6' : '#8ff5e6'); drawText(c, f.dead ? 'down' : String(f.kills), xx + 160, yy, f.dead ? '#6a6485' : '#fff'); });
}
function brMap(c) {
  const m = BR.mapCv; if (!m) return; const uw = VS.uw, uh = VS.uh, w = min(uw - 30, 560), k = w / m.width, sy0 = 8, sh = m.height - sy0, h = round(sh * k * 2.1), x = round((uw - w) / 2), y = max(76, round((uh - h) / 2) + 10), ky = h / sh;
  panel(c, x - 6, y - 60, w + 12, h + 68, 'THE ISLAND  [M] close'); c.fillStyle = '#2a3150'; c.fillRect(x, y, w, h); c.drawImage(m, 0, sy0, m.width, sh, x, y, w, h);
  const s = w / (BRW * T), sy = ky / (2 * T), oy = sy0 * ky, z = BR.storm, Y0 = v => round(v * sy - oy);
  if (z) { c.fillStyle = 'rgba(150,60,170,.45)'; c.fillRect(x, y, round(z.L * s), h); c.fillRect(x + round(z.R * s), y, w - round(z.R * s), h); if (z.warn || z.moving) { c.fillStyle = '#ffffff'; c.fillRect(x + round(z.nL * s), y, 1, h); c.fillRect(x + round(z.nR * s), y, 1, h); } }
  const hz = BR.hazard; if (hz && BR.t > hz.at - 600) { c.fillStyle = hz.kind === 'fire' ? 'rgba(255,110,40,.4)' : 'rgba(130,230,90,.35)'; c.fillRect(x + round(hz.L * s), y, round((hz.R - hz.L) * s), h); }
  // names stand in rows above the picture, each with a line down to its place
  const ends = [-999, -999, -999, -999]; for (const q of BR.pois.slice().sort((a, b) => a.x - b.x)) { const X = x + round(q.x * T * s), tw = textW(q.name), X0 = clamp(round(X - tw / 2), x, x + w - tw); let row = ends.findIndex(e => X0 > e + 4); if (row < 0) row = ends.indexOf(min(...ends)); ends[row] = X0 + tw; const Y = y - 10 - row * 10; c.fillStyle = q.crown ? 'rgba(255,211,90,.6)' : 'rgba(255,241,168,.28)'; c.fillRect(X, Y + 8, 1, max(1, y + Y0(heights[q.x] * T) - Y - 8)); drawText(c, q.name, X0, Y, q.crown ? '#ffd35a' : '#fff1a8'); }
  const p = G.p; for (const q of BR.caves) { if (abs(q.x * T - p.x) > 900 && !q.seen) continue; q.seen = true; c.fillStyle = '#8fd0ff'; c.fillRect(x + round(q.x * T * s) - 1, y + Y0(q.y * T) - 1, 2, 2); }
  for (const ch of BR.chests) if (!ch.open && !ch.hid && (ch.feast || ch.crown && !ch.cave)) { c.fillStyle = '#8ff5e6'; c.fillRect(x + round(ch.x * T * s) - 1, y + Y0(ch.y * T) - 1, 3, 3); }
  for (const g of BR.gifts) { c.fillStyle = '#ffffff'; c.fillRect(x + round(g.x * s) - 1, y + Y0(g.y) - 1, 3, 3); }
  const a = brAlly(); if (a && !a.dead) { c.fillStyle = '#8ff5e6'; c.fillRect(x + round((a.x + 3) * s) - 2, y + Y0(a.y + 10) - 2, 4, 4); } const b = BR.bounty; if (b && !b.dead && b !== p) { c.fillStyle = '#ff3b2a'; c.fillRect(x + round((b.x + 3) * s) - 2, y + Y0(b.y + 10) - 2, 4, 4); }
  const my = clamp(Y0(p.y + 10), 2, h - 2); c.fillStyle = '#ffd35a'; c.fillRect(x + round((p.x + 3) * s) - 2, y + my - 2, 5, 5); c.fillStyle = INK; c.fillRect(x + round((p.x + 3) * s), y + my, 1, 1);
}
function brDeadPanel(c) {
  const p = G.p, uw = VS.uw, uh = VS.uh, a = min(1, p.deadT / 50), by = p.lastHitBy;
  c.globalAlpha = a; textC(c, 'TAKEN DOWN', uw / 2, round(uh * .3), '#e2483b', 2, textO);
  textC(c, '#' + BR.place + ' of ' + BR.total + (p.cause ? '  :  you ' + p.cause.replace(/^was /, 'were ') : by && by.fighter && !by.gone && p.takenT > 0 ? '  :  ' + by.name + ' got you' : ''), uw / 2, round(uh * .3) + 22, '#fff', 1, textO);
  const s = BR.spec; if (s) textC(c, 'watching ' + s.name + '   [A] [D] switch', uw / 2, uh - 46, '#8ff5e6', 1, textO);
  c.globalAlpha = 1;
  if (p.deadT > 60) { const bw = 110, x = round(uw / 2 - bw - 4); if (BR.via !== 'solo') button(c, x, uh - 34, bw, 14, 'BACK TO LOBBY', () => brBackToLobby()); else button(c, x, uh - 34, bw, 14, 'PLAY AGAIN', () => brAgain()); button(c, round(uw / 2 + 4), uh - 34, bw, 14, 'LEAVE', () => brLeave()); }
}
// the island takes a moment to raise: say so instead of freezing on the last frame
function brAgain() { G.state = 'loading'; G.loadMsg = 'Raising the island...'; setTimeout(brSolo, 40); }
function brResults(c) {
  const uw = VS.uw, uh = VS.uh, w = min(280, uw - 16), h = 108, x = round((uw - w) / 2), y = round(uh * .52);
  panel(c, x, y, w, h, BR.winMe ? 'VICTORY' : 'THE ASHFALL SETTLES');
  textC(c, BR.winMe ? 'You are the last ember burning.' : BR.winner ? BR.winner + ' is the last ember.' : 'Nobody walked out of the ashfall.', uw / 2, y + 18, BR.winMe ? '#ffd35a' : '#fff', 1, textO);
  textC(c, 'You placed #' + (BR.place || 1) + ' of ' + BR.total + '   :   ' + G.p.kills + ' taken down', uw / 2, y + 32, '#d8d4e6', 1, drawText);
  textC(c, BR.rewardText || '', uw / 2, y + 45, '#8ff5e6', 1, drawText); textC(c, brTitle(brPassLevel()) + ' : pass level ' + brPassLevel(), uw / 2, y + 56, '#ffd35a', 1, drawText);
  if (BR.via !== 'solo') textC(c, 'back to the lobby in ' + max(0, ceil((60 * 14 - BR.overT) / 60)) + 's', uw / 2, y + 68, '#8b8fa3', 1, drawText);
  const bw = 110; if (BR.via !== 'solo') button(c, x + 10, y + h - 24, bw, 15, 'BACK TO LOBBY', () => brBackToLobby()); else button(c, x + 10, y + h - 24, bw, 15, 'PLAY AGAIN', () => brAgain());
  button(c, x + w - bw - 10, y + h - 24, bw, 15, 'LEAVE', () => brLeave());
}
// rarity: a coloured edge on a stack in the hotbar, and a glow under drops
const brTierOf = id => { const k = brTier(id); return k; };
function brDropGlow(w, d, x, y) { const k = brTier(d.id); if (k < 1) return; w.globalAlpha = .35 + .15 * sin(G.time * .1 + d.x); w.fillStyle = BR_TCOL[k]; w.fillRect(round(x) - 4, round(y) + 3, 9, 2); w.fillRect(round(x) - 1, round(y) - 6, 2, 9); w.globalAlpha = 1; }
