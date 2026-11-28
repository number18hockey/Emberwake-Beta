// ============================================================
//  The Wilds on screen: the menu, the lobby, chests and parcels,
//  the storm, the match HUD, the map, and the end of a match.
// ============================================================
function drawBrBanner(c, x, y, w, h, compact = false) {
  const sky = c.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, '#33223f'); sky.addColorStop(.62, '#a74638'); sky.addColorStop(1, '#e58a4b');
  c.fillStyle = sky; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(255,211,90,.16)'; c.fillRect(x, y + h - 5, w, 5);
  c.fillStyle = '#211b32'; c.beginPath(); c.moveTo(x, y + h - 4); c.lineTo(x + w * .12, y + h * .52); c.lineTo(x + w * .28, y + h - 5); c.lineTo(x + w * .46, y + h * .37); c.lineTo(x + w * .68, y + h - 4); c.lineTo(x + w * .84, y + h * .58); c.lineTo(x + w, y + h - 5); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.fill();
  c.fillStyle = '#d05b3d'; c.fillRect(x + w * .08, y + h - 5, w * .2, 2); c.fillRect(x + w * .54, y + h - 5, w * .18, 2);
  const sx = x + w - (compact ? 17 : 30), sy = y + h * .42, r = compact ? 7 : min(15, h * .42);
  c.strokeStyle = 'rgba(255,211,90,.78)'; c.lineWidth = compact ? 1 : 2; c.beginPath(); c.arc(sx, sy, r, -.65, 1.65); c.stroke();
  c.fillStyle = '#ffd35a'; c.beginPath(); c.arc(sx, sy, compact ? 2 : 3, 0, TAU); c.fill();
  c.fillStyle = '#fff1a8'; c.fillRect(x + 8, y + 5, compact ? 20 : 37, 1);
  drawText(c, compact ? 'THE WILDS' : 'THE WILDS OF THE ASHFALL', x + 8, y + 9, '#fff1a8');
  if (!compact) drawText(c, 'LAST WAKER STANDING', x + 8, y + h - 12, '#ffe2b8');
}
// three pages, the queue, the soul wheel and the shop, built with the menu kit (helpers in 26-arena-menus.js). The banner
// is a band in the card on a wide screen and the hero over the card on a phone held upright.
function wDrawBrForm(c) {
  if (KIT.enter.view !== 'wilds') AM.wal = null; menuBackdrop(c, 'wilds'); kview('wilds');
  const S = KIT.sizes, p = brProfile(), mode = menuMode(), narrow = mode === 'narrow', tab = BR.menuTab === 'queue' || BR.menuTab === 'wheel' ? BR.menuTab : 'style';
  if (tab !== 'wheel') AM.turn = false;
  const band = mode === 'wide' && VS.uh >= 350 ? 34 : 0, headH = band + S.tab + 4 + 4 + 22 + 10, want = 29 + headH + wBodyH(tab, (narrow ? 228 : 460) - 16) + 6 + S.bh + 10;
  // (on a tall phone the card leaves room above it for the banner, and its body scrolls or pages instead)
  const room = floor(VS.uh - 24) - 6, F = menuFrame('wilds', 460, narrow && room >= 430 ? min(want, room - 100) : want);
  if (F.hero && F.hero.h >= 60) { const H = F.hero, bh = min(72, H.h - 20), bw = min(H.w - 24, 300); drawBrBanner(c, round(H.x + (H.w - bw) / 2), round(H.y + (H.h - bh) / 2), bw, bh, false); }
  const K = kcard(c, F.x, F.y, F.w, F.h, 'wilds', narrow ? 'THE WILDS' : 'THE WILDS : BATTLE ROYALE', { foot: true, i: 0, art: tab === 'wheel' ? 'soulwheel' : 'chute' }), cx = K.x + 8, cw = K.w - 16;
  let yy = K.by + 1;
  if (band) { drawBrBanner(c, cx, yy, cw, 30, true); yy += band; }
  const tabs = [['queue', 'QUEUE'], ['wheel', 'SOUL WHEEL'], ['style', 'SHOP']];
  yy += ktabs(c, cx, yy, cw, tabs.map(t => t[1]), tabs.find(t => t[0] === tab)[1], nm => wTab(tabs.find(t => t[1] === nm)[0])) + 4;
  yy += wWalletDraw(c, cx, yy, cw, p) + 4;
  wBody(c, tab, cx, yy, cw, K.footY - 4, p);
  const bk = KIT.T ? 64 : 54;
  kbutton(c, K.x + K.w - 8 - bk, K.footY + 5, bk, 'BACK', menuBack, { hint: 'Back to the Ashfall Trials.' });
  if (tab === 'wheel') wTurn(c, cx, K.footY + 5, cw - bk - S.gap, p);

}
// the Wilds' lobby: the Trials' lobby in violet (arenaLobby, 26-arena-menus.js)
function wDrawBrLobby(c) { arenaLobby(c, true); }

// ---------------- in the world ----------------
function wBrWorld(w, al, cx, cy) {
  if (!wBrOn()) return; const q = STN_SPR[CHEST], vx0 = cx - 20, vx1 = cx + VS.vw + 20;
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
function wBrGlider(ctx, f, al) {
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
function wBrActors(ctx, al) {
  if (!wBrOn()) return; const x0 = G.rcx - 40, x1 = G.rcx + VS.vw + 40;
  for (const f of G.fighters) if (f.glide && !f.dead && f.x > x0 && f.x < x1) wBrGlider(ctx, f, al);
  // the Marked One
  const b = BR.bounty; if (b && !b.dead && b !== G.p && b.x > x0 && b.x < x1) { const X = round(lerp(b.px, b.x, al)) + 3, Y = round(lerp(b.py, b.y, al)) - 22 + round(sin(G.time * .1)); ctx.fillStyle = INK; ctx.fillRect(X - 3, Y - 1, 7, 5); ctx.fillStyle = '#ff3b2a'; ctx.fillRect(X - 2, Y, 5, 1); ctx.fillRect(X - 1, Y + 1, 3, 1); ctx.fillRect(X, Y + 2, 1, 1); }
}
// unlit, in the world: the storm curtains, prompts, wards over heads, the breath of the deep
function wBrOverlay(ctx, al, cx, cy) {
  if (!wBrOn() || !BR.storm) return; const z = BR.storm, vh = VS.vh, top = cy - 4, x0 = cx - 4, x1 = cx + VS.vw + 4;
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
    const g = brNearGift(p), ch = !g && wBrNearChest(p, 22), tip = (s, X, Y, col) => textO(ctx, s, round(X - textW(s) / 2), Y, col);
    if (g) tip('[F] OPEN THE PARCEL', g.x, g.y - 20, '#c9d8e8'); else if (ch) tip('[F] OPEN', ch.x * T + 4, ch.y * T - 10, ch.feast || ch.crown ? '#8ff5e6' : ch.rare ? '#ffd35a' : '#fff');
    else { const s = brNearStation(p, 4); if (s) tip('[F] ' + TP[s.id].name.toUpperCase(), s.x * T + 4, s.y * T - 12, '#d8d4e6'); else if (!BR.teammate) { let o = null, bd = 40; for (const f of G.fighters) if (f !== p && f.brIn && !f.dead && !f.noHit && f.team !== p.team && !(f.lastHitBy === p && f.takenT > 0)) { const d = hypot(f.x - p.x, f.y - p.y); if (d < bd) { bd = d; o = f; } } if (o && p.takenT <= 0) tip('[P] OFFER A PACT', o.x + 3, o.y - 30, '#8ff5e6'); } }
  }
  for (const f of G.fighters) { if (f === p || f.dead || !f.brIn || (f.ward || 0) <= 0 || f.x < x0 || f.x > x1) continue; const X = round(lerp(f.px, f.x, al)) - 3, Y = round(lerp(f.py, f.y, al)) - 4; ctx.fillStyle = INK; ctx.fillRect(X - 1, Y - 1, 14, 3); ctx.fillStyle = '#5aa8ff'; ctx.fillRect(X, Y, round(12 * f.ward / 100), 1); }
}
function wBrScreen(ctx, W, H) {
  if (!wBrOn()) return;
  if (BR.inStorm) { ctx.fillStyle = `rgba(120,40,150,${.14 + .06 * sin(G.time * .1)})`; ctx.fillRect(0, 0, W, H); }
  const deep = clamp(((G.cam.y + VS.vh * .6) / T - (BR_HOT - 14)) / 30, 0, 1); if (deep > .01) { ctx.fillStyle = `rgba(255,80,20,${.16 * deep * (.85 + .15 * sin(G.time * .07))})`; ctx.fillRect(0, 0, W, H); }
}

// ---------------- the HUD ----------------
function wBrStrip(c, x, y, w, h) {
  const m = BR.mapCv; c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = 'rgba(40,50,80,.85)'; c.fillRect(x, y, w, h);
  if (m) { c.globalAlpha = .9; c.drawImage(m, 0, round(m.height * .19), m.width, round(m.height * .28), x, y, w, h); c.globalAlpha = 1; }
  const k = w / (WBRW * T), z = BR.storm;
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
function wBrHud(c) {
  const p = G.p, uw = VS.uw, uh = VS.uh, z = BR.storm, alive = BR.lastAlive;
  if ((p.ward || 0) > 0) { bar(c, 15, 26, 72, 3, p.ward / 100, '#8fd0ff', '#2a62c0'); textO(c, round(p.ward), 91, 24, '#8fd0ff'); }
  // the strip, and what the border is waiting for
  // (on a phone held upright it goes under your health, right across, and everything hangs from it)
  const narrow = uw < 300, sw = narrow ? uw - 8 : clamp(uw - 280, 140, 260), sx = round((uw - sw) / 2), sy = narrow ? 37 : 4; wBrStrip(c, sx, sy, sw, 9);
  let msg = '', col = '#fff';
  if (BR.phase === 'drop' && BR.t < BR_HOLD) { msg = 'THE GAMES BEGIN IN ' + ceil((BR_HOLD - BR.t) / 60); col = '#ffd35a'; }
  else if (BR.phase === 'drop') { msg = p.glide ? 'A / D steer   S dive' : 'find something sharp'; col = '#d8d4e6'; }
  else if (z && z.moving) { msg = 'THE ASHFALL CLOSES IN'; col = '#ff9adf'; }
  else if (z && z.warn) { msg = 'THE ASHFALL WILL MOVE IN ' + ceil(z.left / 60) + 's'; col = '#ffb0e8'; }
  else if (z && !z.done) { msg = 'the ashfall waits until ' + z.next + ' are left'; col = '#e8d8ff'; }
  else msg = 'the ashfall has closed';
  textC(c, msg, uw / 2, sy + 13, col, 1, textO);
  if (BR.phase === 'drop' && BR.t < BR_HOLD) textC(c, String(ceil((BR_HOLD - BR.t) / 60)), uw / 2, round(uh * .34), '#ffd35a', 3, textO);
  if (BR.feast === 1) textC(c, 'the feast in ' + max(0, ceil((BR.feastAt - BR.t) / 60)) + 's', uw / 2, sy + 23, '#8ff5e6', 1, textO);
  // who is left
  const a = brAlly(), bw = 104, bx = uw - bw - 4, by = narrow ? sy + 34 : 4, bh = a ? 34 : 22; c.fillStyle = 'rgba(18,13,31,.66)'; c.fillRect(bx, by, bw, bh); c.fillStyle = '#ff8a3d'; c.fillRect(bx, by, 2, bh);
  textO(c, alive + ' LEFT', bx + 7, by + 3, '#fff1a8', 1); drawText(c, p.kills + ' taken down', bx + 7, by + 12, '#d8d4e6');
  if (a) { drawText(c, 'PACT : ' + a.name.slice(0, 10), bx + 7, by + 21, '#8ff5e6'); bar(c, bx + 7, by + 30, bw - 14, 1, a.hp / a.maxhp, '#4fd8c8', '#2a8a80'); }
  if (BR.inStorm && (G.time >> 4) & 1) textC(c, 'YOU ARE IN THE ASHFALL', uw / 2, round(uh * .3), '#ff9adf', 1, textO);
  const depth = floor((p.y + p.h) / T) - heights[clamp(floor((p.x + 3) / T), 0, WBRW - 1)]; if (!p.dead && depth > 14) { const row = floor((p.y + p.h) / T), hot = row > BR_HOT - 20; textC(c, depth + ' deep' + (hot ? '   ·   lava ' + max(0, BR_LAVA - row) + ' below' : ''), uw / 2, sy + 23 + (BR.feast === 1 ? 10 : 0), hot ? ((G.time >> 4) & 1 ? '#ff7a2a' : '#ffd35a') : '#b9bdd0', 1, textO); }
  if (BR.noteT > 0) { c.globalAlpha = min(1, BR.noteT / 30); textC(c, BR.note, uw / 2, round(uh * .66), BR.leaveT > 0 ? '#ffb0b0' : '#fff', 1, textO); c.globalAlpha = 1; }
  if (p.brUse) { const u = p.brUse, it = IT[u.id], hb = hotbarLayout(), w2 = 110, x2 = round((uw - w2) / 2), y2 = hb.y - 24; textC(c, (it.ward ? 'MENDING YOUR WARD' : 'APPLYING ' + it.name.toUpperCase()), uw / 2, y2 - 9, it.ward ? '#8fd0ff' : '#7ddc6f', 1, textO); bar(c, x2, y2, w2, 4, u.t / u.dur, it.ward ? '#8fd0ff' : '#7ddc6f', '#2b2740'); }
  if (BR.show) brSky(c);
  if (keys.Tab && !UI.open) wBrScore(c);
  if (BR.mapOpen && !UI.open) wBrMap(c);
  if (p.dead && BR.phase !== 'over') wBrDeadPanel(c);
  if (BR.phase === 'over' && BR.overT > 80) wBrResults(c);
}
// the fallen: their faces hang in the sky a while
function brSky(c) {
  const S = BR.show, uw = VS.uw, a = clamp(min(S.t / 50, (420 - S.t) / 60), 0, 1), L = S.list.slice(-10), w = 46, per = max(1, min(L.length, floor((uw - 40) / w))), y0 = 62;
  c.globalAlpha = a; textC(c, 'THE FALLEN', uw / 2, y0, '#c9e8ff', 1, textO);
  L.forEach((f, i) => { const row = floor(i / per), n = min(per, L.length - row * per), x = round(uw / 2 - n * w / 2 + (i % per) * w + w / 2), y = y0 + 12 + row * 34, hd = (SK[f.skin] || SK[0]).head; c.globalAlpha = a * .3; c.fillStyle = '#8fd0ff'; c.fillRect(x - 10, y - 1, 20, 20); c.globalAlpha = a * .92; c.drawImage(hd, x - 8, y, 16, 16); textC(c, f.name, x, y + 21, '#dcefff', 1, textO); });
  if (S.list.length > L.length) textC(c, 'and ' + (S.list.length - L.length) + ' more', uw / 2, y0 + 12 + ceil(L.length / per) * 34, '#b9bdd0', 1, textO); c.globalAlpha = 1;
}
function wBrScore(c) {
  const list = G.fighters.filter(f => f.brIn).sort((a, b) => (a.dead - b.dead) || b.kills - a.kills);
  amScore(c, 'THE WILDS : ' + BR.lastAlive + ' OF ' + list.length + ' LEFT', '#c77dff', list, f => f !== G.p && f.team === G.p.team ? { mark: '+ ', col: '#8ff5e6' } : {});
}
function wBrMap(c) {
  const m = BR.mapCv; if (!m) return; const uw = VS.uw, uh = VS.uh, w = min(uw - 30, 560), k = w / m.width, sy0 = 8, sh = m.height - sy0, top = (KIT.T ? 46 : 44) + 68, h = min(round(sh * k * 2.1), hotbarLayout().y - 14 - top), x = round((uw - w) / 2), y = amClearY(x - 8, max(top, round((uh - h) / 2) + 10) - 68, w + 16, h + 76) + 68, ky = h / sh;
  amMapCard(c, x - 8, y - 68, w + 16, h + 76, ''); c.fillStyle = '#2a3150'; c.fillRect(x, y, w, h); c.drawImage(m, 0, sy0, m.width, sh, x, y, w, h);
  const s = w / (WBRW * T), sy = ky / (2 * T), oy = sy0 * ky, z = BR.storm, Y0 = v => round(v * sy - oy);
  if (z) { c.fillStyle = 'rgba(150,60,170,.45)'; c.fillRect(x, y, round(z.L * s), h); c.fillRect(x + round(z.R * s), y, w - round(z.R * s), h); if (z.warn || z.moving) { c.fillStyle = '#ffffff'; c.fillRect(x + round(z.nL * s), y, 1, h); c.fillRect(x + round(z.nR * s), y, 1, h); } }
  const hz = BR.hazard; if (hz && BR.t > hz.at - 600) { c.fillStyle = hz.kind === 'fire' ? 'rgba(255,110,40,.4)' : 'rgba(130,230,90,.35)'; c.fillRect(x + round(hz.L * s), y, round((hz.R - hz.L) * s), h); }
  // names stand in rows above the picture, each with a line down to its place
  const ends = [-999, -999, -999, -999]; for (const q of BR.pois.slice().sort((a, b) => a.x - b.x)) { if (w < 300 && !q.crown) continue; const X = x + round(q.x * T * s), tw = textW(q.name), X0 = clamp(round(X - tw / 2), x, x + w - tw); let row = ends.findIndex(e => X0 > e + 4); if (row < 0) row = ends.indexOf(min(...ends)); ends[row] = X0 + tw; const Y = y - 10 - row * 10; c.fillStyle = q.crown ? 'rgba(255,211,90,.6)' : 'rgba(255,241,168,.28)'; c.fillRect(X, Y + 8, 1, max(1, y + Y0(heights[q.x] * T) - Y - 8)); drawText(c, q.name, X0, Y, q.crown ? '#ffd35a' : '#fff1a8'); }
  const p = G.p; for (const q of BR.caves) { if (abs(q.x * T - p.x) > 900 && !q.seen) continue; q.seen = true; c.fillStyle = '#8fd0ff'; c.fillRect(x + round(q.x * T * s) - 1, y + Y0(q.y * T) - 1, 2, 2); }
  for (const ch of BR.chests) if (!ch.open && !ch.hid && (ch.feast || ch.crown && !ch.cave)) { c.fillStyle = '#8ff5e6'; c.fillRect(x + round(ch.x * T * s) - 1, y + Y0(ch.y * T) - 1, 3, 3); }
  for (const g of BR.gifts) { c.fillStyle = '#ffffff'; c.fillRect(x + round(g.x * s) - 1, y + Y0(g.y) - 1, 3, 3); }
  const a = brAlly(); if (a && !a.dead) { c.fillStyle = '#8ff5e6'; c.fillRect(x + round((a.x + 3) * s) - 2, y + Y0(a.y + 10) - 2, 4, 4); } const b = BR.bounty; if (b && !b.dead && b !== p) { c.fillStyle = '#ff3b2a'; c.fillRect(x + round((b.x + 3) * s) - 2, y + Y0(b.y + 10) - 2, 4, 4); }
  const my = clamp(Y0(p.y + 10), 2, h - 2); c.fillStyle = '#ffd35a'; c.fillRect(x + round((p.x + 3) * s) - 2, y + my - 2, 5, 5); c.fillStyle = INK; c.fillRect(x + round((p.x + 3) * s), y + my, 1, 1);
}
function wBrDeadPanel(c) {
  const p = G.p, by = p.lastHitBy; if (p.deadT < 20) return;
  const lines = [['#' + BR.place + ' of ' + BR.total, '#fff']]; if (p.cause) lines.push(['You ' + p.cause.replace(/^was /, 'were ') + '.', '#ff9a8a']); else if (by && by.fighter && !by.gone && p.takenT > 0) lines.push([by.name + ' got you.', '#ff9a8a']);
  const btn = p.deadT <= 60 ? [] : [BR.via !== 'solo' ? ['BACK TO LOBBY', () => wBrBackToLobby(), 'Back to the lobby for the next match.'] : ['PLAY AGAIN', () => brAgain(), 'Another match against echoes.'], ['LEAVE', () => wBrLeave(), 'Back to the home page.']];
  amEndCard(c, { title: 'TAKEN DOWN', col: '#e2483b', art: 'fallen', ms: (p.deadT - 20) * 16.7, lines, spec: BR.spec, specNext: wBrSpecNext, buttons: btn });
}
// the island takes a moment to raise: say so instead of freezing on the last frame
function brAgain() { brPayLeaving(); G.state = 'loading'; G.loadMsg = 'Raising the island...'; setTimeout(wBrSolo, 40); }
function wBrResults(c) {
  const win = BR.winMe, lines = [[win ? 'You are the last ember burning.' : BR.winner ? BR.winner + ' is the last ember.' : 'Nobody walked out of the ashfall.', win ? '#ffd35a' : '#fff'], ['You placed #' + (BR.place || 1) + ' of ' + BR.total + '   :   ' + G.p.kills + ' taken down', '#d8d4e6']];
  if (BR.rewardText) lines.push([BR.rewardText, '#8ff5e6']); lines.push([brTitle(brPassLevel()) + ' : pass level ' + brPassLevel(), '#ffd35a']);
  if (BR.via !== 'solo') lines.push(['back to the lobby in ' + max(0, ceil((60 * 14 - BR.overT) / 60)) + 's', '#8b8fa3']);
  amEndCard(c, { title: win ? 'VICTORY' : 'THE ASHFALL SETTLES', col: win ? '#ffd35a' : '#c77dff', art: win ? 'crown' : 'chute', ms: (BR.overT - 80) * 16.7, lines,
    buttons: [BR.via !== 'solo' ? ['BACK TO LOBBY', () => wBrBackToLobby(), 'Back to the lobby for the next match.'] : ['PLAY AGAIN', () => brAgain(), 'Another match against echoes.'], ['LEAVE', () => wBrLeave(), 'Back to the home page.']] });
}
// rarity: a coloured edge on a stack in the hotbar, and a glow under drops
const wBrTierOf = id => { const k = wBrTier(id); return k; };
function wBrDropGlow(w, d, x, y) { const k = wBrTier(d.id); if (k < 1) return; w.globalAlpha = .35 + .15 * sin(G.time * .1 + d.x); w.fillStyle = WBR_TCOL[k]; w.fillRect(round(x) - 4, round(y) + 3, 9, 2); w.fillRect(round(x) - 1, round(y) - 6, 2, 9); w.globalAlpha = 1; }
