// ============================================================
//  THE ARENAS' MENUS (part B of the menu redesign), built with the
//  menu kit (10-interface/4-menu-kit.js). Each is a place of its own:
//    ring     SAND AND BANNERS    the FFA arcade, the arenas' hub (drawFFAMenu, 8-ffa.js): ten modes, records, private matches
//    shop     THE TAILOR'S STALL  the cosmetic shop (drawCosmeticShop, below)
//    brform   FALLING ASH         the Ashfall Trials' form (drawBrForm, 4-royale-screens.js)
//    wilds    THE WILDS           the Wilds' form (wDrawBrForm, 22-wilds-screens.js): queue, soul wheel, shop
//    bropen   THE OPEN BOARD      open matches (drawBrOpen, drawOpenList, 7-parties.js)
//    brlobby  THE PLINTHS         the Trials' lobby; wlobby, the Wilds' lobby (violet): both drawn by arenaLobby below
//  and, in a match, over the HUD: perks (drawOffer), the dead and results cards, the score (Tab) and the map (M).
//  (G.state is 'brform' for both forms and 'brlobby' for both lobbies: MENUS.brform and MENUS.brlobby answer for the
//   kit's hint line and Escape; the cards and backdrops use 'wilds' and 'wlobby' when BR.wild.)
// ============================================================
// (the Cinder Ring became the FFA Arcade: its form is drawFFAMenu, in 8-ffa.js)
function drawRingForm(c) {
  drawFFAMenu(c);
}

// ---------------- emblems (16x16) ----------------
Object.assign(MENU_ART, {
  // a ring of sand with a flame running round it (a step every 90 ms)
  ring(c, x, y) {
    const k = ((performance.now() / 90) | 0) % 16, P = [[7, 1], [10, 2], [12, 4], [13, 7], [12, 10], [10, 12], [7, 13], [4, 12], [2, 10], [1, 7], [2, 4], [4, 2], [7, 1], [10, 2], [12, 4], [13, 7]][k];
    c.fillStyle = '#b89a6a'; c.fillRect(x + 4, y + 1, 8, 2); c.fillRect(x + 4, y + 13, 8, 2); c.fillRect(x + 1, y + 4, 2, 8); c.fillRect(x + 13, y + 4, 2, 8);
    c.fillStyle = '#8a6a48'; c.fillRect(x + 2, y + 2, 2, 2); c.fillRect(x + 12, y + 2, 2, 2); c.fillRect(x + 2, y + 12, 2, 2); c.fillRect(x + 12, y + 12, 2, 2);
    c.fillStyle = '#ff6b6b'; c.fillRect(x + 6, y + 9, 4, 2); c.fillStyle = '#ffd35a'; c.fillRect(x + 7, y + 7, 2, 2);
    c.fillStyle = '#fff1a8'; c.fillRect(x + P[0], y + P[1], 2, 2);
  },
  // an island inside a red ring of ash that shrinks every 300 ms, then opens again
  ashring(c, x, y) {
    const r = 7 - (((performance.now() / 300) | 0) % 4), a = 8 - r, b = 2 * r;
    c.fillStyle = '#c94a4e'; c.fillRect(x + a, y + a - 1, b, 1); c.fillRect(x + a, y + 8 + r, b, 1); c.fillRect(x + a - 1, y + a, 1, b); c.fillRect(x + 8 + r, y + a, 1, b);
    c.fillStyle = '#e0d2b4'; c.fillRect(x + 5, y + 9, 6, 2); c.fillStyle = '#58a868'; c.fillRect(x + 6, y + 8, 4, 1);
    c.fillStyle = '#6b4a2f'; c.fillRect(x + 7, y + 5, 1, 3); c.fillStyle = '#7ddc6f'; c.fillRect(x + 6, y + 4, 3, 2);
  },
  // a banner on a pole, waving
  banner(c, x, y) {
    const f = ((performance.now() / 160) | 0) % 4, w = [0, 1, 0, -1][f];
    c.fillStyle = '#4b6d78'; c.fillRect(x + 3, y + 1, 1, 15); c.fillStyle = '#ffd35a'; c.fillRect(x + 2, y, 3, 1);
    c.fillStyle = '#ffb36a'; c.fillRect(x + 4, y + 2, 9, 3); c.fillRect(x + 4, y + 5 + (w > 0 ? 1 : 0), 10 + w, 3); c.fillRect(x + 4, y + 8, 8 - w, 2);
    c.fillStyle = '#c94a2e'; c.fillRect(x + 6, y + 4, 4, 1); c.fillRect(x + 6, y + 7, 5, 1);
  },
  // three plinths round a hearth; the middle one holds a Waker
  plinth(c, x, y) {
    const on = ((performance.now() / 110) | 0) % 6 < 3;
    c.fillStyle = '#726d7d'; c.fillRect(x, y + 11, 4, 4); c.fillRect(x + 6, y + 10, 4, 5); c.fillRect(x + 12, y + 11, 4, 4);
    c.fillStyle = '#b9bdd0'; c.fillRect(x, y + 11, 4, 1); c.fillRect(x + 6, y + 10, 4, 1); c.fillRect(x + 12, y + 11, 4, 1);
    c.fillStyle = '#e0d2b4'; c.fillRect(x + 6, y + 4, 4, 4); c.fillStyle = '#3f6076'; c.fillRect(x + 6, y + 3, 4, 2); c.fillRect(x + 7, y + 8, 2, 2);
    c.fillStyle = on ? '#ffd35a' : '#ff8a3d'; c.fillRect(x + 7, y + 1, 2, 1);
  },
  // a parachute, swaying
  chute(c, x, y) {
    const s = round(sin(performance.now() / 420) * 1.4);
    c.fillStyle = '#c77dff'; c.fillRect(x + 3 + s, y + 1, 10, 2); c.fillRect(x + 1 + s, y + 3, 14, 2); c.fillStyle = '#f0dcff'; c.fillRect(x + 5 + s, y + 1, 2, 4); c.fillRect(x + 10 + s, y + 1, 2, 4);
    c.fillStyle = '#d8d4e6'; c.fillRect(x + 3 + s, y + 5, 1, 4); c.fillRect(x + 12 + s, y + 5, 1, 4);
    c.fillStyle = '#e0d2b4'; c.fillRect(x + 6, y + 9, 4, 3); c.fillStyle = '#3f6076'; c.fillRect(x + 6, y + 12, 4, 3);
  },
  // the soul wheel: its spokes turn only while TURN THE WHEEL is under the mouse
  soulwheel(c, x, y) {
    const k = AM.turn ? ((performance.now() / 110) | 0) % 2 : 0;
    c.fillStyle = '#5a4a72'; c.fillRect(x + 4, y + 1, 8, 2); c.fillRect(x + 4, y + 13, 8, 2); c.fillRect(x + 1, y + 4, 2, 8); c.fillRect(x + 13, y + 4, 2, 8);
    c.fillStyle = '#c77dff'; if (k) { c.fillRect(x + 4, y + 4, 2, 2); c.fillRect(x + 10, y + 4, 2, 2); c.fillRect(x + 4, y + 10, 2, 2); c.fillRect(x + 10, y + 10, 2, 2); } else { c.fillRect(x + 7, y + 3, 2, 10); c.fillRect(x + 3, y + 7, 10, 2); }
    c.fillStyle = '#fff1a8'; c.fillRect(x + 7, y + 7, 2, 2); c.fillStyle = '#ffd35a'; c.fillRect(x + 7, y, 2, 2);
  },
  // a hanger with a coat whose colour changes every 600 ms
  stall(c, x, y) {
    const k = ((performance.now() / 600) | 0) % 4, col = SKINS[k][0], hi = SKINS[k][4];
    c.fillStyle = '#b9bdd0'; c.fillRect(x + 7, y, 2, 2); c.fillRect(x + 3, y + 2, 10, 1); c.fillRect(x + 2, y + 3, 2, 1); c.fillRect(x + 12, y + 3, 2, 1);
    c.fillStyle = col; c.fillRect(x + 3, y + 4, 10, 9); c.fillRect(x + 1, y + 4, 2, 6); c.fillRect(x + 13, y + 4, 2, 6);
    c.fillStyle = hi; c.fillRect(x + 7, y + 4, 2, 9); c.fillStyle = '#ff9ec7'; c.fillRect(x + 4, y + 14, 8, 1);
  },
  // an ember gem that pulses
  perk(c, x, y) {
    const on = ((performance.now() / 110) | 0) % 6 < 3;
    c.fillStyle = '#a93a42'; c.fillRect(x + 6, y + 2, 4, 1); c.fillRect(x + 4, y + 3, 8, 3); c.fillRect(x + 3, y + 6, 10, 3); c.fillRect(x + 5, y + 9, 6, 3); c.fillRect(x + 7, y + 12, 2, 2);
    c.fillStyle = on ? '#ffd35a' : '#ff8a3d'; c.fillRect(x + 5, y + 4, 6, 4); c.fillRect(x + 6, y + 8, 4, 2);
    c.fillStyle = '#fff1a8'; c.fillRect(x + 6, y + 4, 2, 2);
  },
  // a guttering ember: taken down
  fallen(c, x, y) {
    const on = ((performance.now() / 220) | 0) % 4 === 0;
    c.fillStyle = '#3f3a4c'; c.fillRect(x + 2, y + 12, 12, 3); c.fillStyle = '#726d7d'; c.fillRect(x + 4, y + 11, 8, 1);
    c.fillStyle = '#e2483b'; c.fillRect(x + 5, y + 7, 6, 4); c.fillRect(x + 7, y + 4, 2, 3);
    c.fillStyle = on ? '#ffd35a' : '#a93a42'; c.fillRect(x + 7, y + 8, 2, 2);
    c.fillStyle = '#8b8fa3'; c.fillRect(x + 9, y + 1, 1, 2); c.fillRect(x + 10, y, 1, 1);
  },
  // a crown that glints
  crown(c, x, y) {
    const g = ((performance.now() / 110) | 0) % 12;
    c.fillStyle = '#b8862a'; c.fillRect(x + 2, y + 11, 12, 3); c.fillStyle = '#ffd35a'; c.fillRect(x + 2, y + 6, 12, 5); c.fillRect(x + 2, y + 3, 2, 3); c.fillRect(x + 7, y + 2, 2, 4); c.fillRect(x + 12, y + 3, 2, 3);
    c.fillStyle = '#e2483b'; c.fillRect(x + 7, y + 8, 2, 2); c.fillStyle = '#8ff5e6'; c.fillRect(x + 4, y + 8, 1, 1); c.fillRect(x + 11, y + 8, 1, 1);
    if (g < 4) { c.fillStyle = '#fff1a8'; c.fillRect(x + 3 + g * 3, y + 6, 1, 1); }
  },
  // tally marks: who is left
  tally(c, x, y) {
    c.fillStyle = '#d8d4e6'; for (let i = 0; i < 4; i++) c.fillRect(x + 2 + i * 3, y + 3, 1, 10);
    c.fillStyle = '#ff8a3d'; c.fillRect(x + 1, y + 9, 13, 1); c.fillRect(x + 3, y + 7, 9, 1);
  },
  // a rolled-out map of the island
  islemap(c, x, y) {
    c.fillStyle = '#a8845a'; c.fillRect(x, y + 3, 16, 10); c.fillStyle = '#e3d8c2'; c.fillRect(x + 1, y + 4, 14, 8);
    c.fillStyle = '#6fb9c9'; c.fillRect(x + 1, y + 9, 14, 3); c.fillStyle = '#58a868'; c.fillRect(x + 3, y + 7, 9, 2); c.fillRect(x + 6, y + 5, 3, 2);
    c.fillStyle = ((performance.now() / 300) | 0) % 2 ? '#ffd35a' : '#ff8a3d'; c.fillRect(x + 7, y + 6, 2, 2);
  }
});

// ---------------- shared helpers ----------------
const AM = { turn: false, wal: null, walT: 0, walKey: '', deadAt: 0, endAt: 0 };
// a card drawn in play (over the HUD) fades in over 160 ms from `ms` ago: the kit's stagger index that does it
const amFade = ms => (performance.now() - KIT.enter.t0 - max(0, ms)) / 40;
// a list over its own scroll state (st[key]): rows of rowH in box B, with a counter and arrows when it overflows.
// o.pager: the arrows are < and > and page a whole screen (the Wilds' wheel and shop keep their < >)
function amList(c, B, n, rowH, st, key, drawRow, o = {}) {
  const S = KIT.sizes, over = n * rowH > B.h, ch = over ? S.sm + 4 : 0, vis = max(1, floor((B.h - ch) / rowH));
  st[key] = clamp(st[key] | 0, 0, max(0, n - vis)); const first = st[key];
  for (let i = 0; i < vis && first + i < n; i++) drawRow(c, first + i, B.x, B.y + i * rowH, B.w, rowH - 2);
  const by = d => { st[key] = clamp((st[key] | 0) + d, 0, max(0, n - vis)); };
  if (over) {
    const yy = B.y + B.h - S.sm, aw = KIT.T ? 30 : 20;
    drawText(c, `${first + 1}-${min(n, first + vis)} of ${n}`, B.x + 2, yy + round((S.sm - 8) / 2), '#8b8fa3');
    if (o.pager) {
      karrow(c, B.x + B.w - aw * 2 - S.gap, yy, aw, S.sm, -1, false, () => { by(-vis); sfx('ui'); }, 'btn:<', first <= 0);
      karrow(c, B.x + B.w - aw, yy, aw, S.sm, 1, false, () => { by(vis); sfx('ui'); }, 'btn:>', first + vis >= n);
    } else {
      karrow(c, B.x + B.w - aw * 2 - S.gap, yy, aw, S.sm, -1, true, () => { by(-1); sfx('ui'); }, 'btn:LIST UP', first <= 0);
      karrow(c, B.x + B.w - aw, yy, aw, S.sm, 1, true, () => { by(1); sfx('ui'); }, 'btn:LIST DOWN', first + vis >= n);
    }
  }
  KIT.scrollers.push({ x: B.x, y: B.y, w: B.w, h: B.h, by });
  return { vis, first };
}
// a small chip: a label in grey over a value in colour
function amStat(c, x, y, w, label, val, col) {
  c.fillStyle = '#1d1a29'; c.fillRect(x, y, w, 21); c.fillStyle = '#2b2740'; c.fillRect(x, y + 20, w, 1);
  drawText(c, fitText(label, w - 6), x + 3, y + 2, '#8b8fa3'); drawText(c, fitText(String(val), w - 6), x + 3, y + 11, col);
}
// wrapped lines of text; returns the height used
function amPara(c, s, x, y, w, col, lh = 9) { const L = wrapC(s, w); L.forEach((l, i) => drawText(c, l, x, y + i * lh, col)); return L.length * lh; }
const amParaH = (s, w, lh = 9) => wrapC(s, w).length * lh;
// a head (with its hat) on a little lit plinth; crowned in gold when it leads
function amHead(c, skin, hat, x, y, o = {}) {
  c.fillStyle = '#2b2740'; c.fillRect(x - 2, y + 15, 18, 3); c.fillStyle = '#4a4460'; c.fillRect(x - 1, y + 14, 16, 1);
  const ga = c.globalAlpha; if (o.dim) c.globalAlpha = ga * .45; khead(c, skin, hat, x, y, 2); c.globalAlpha = ga;
  // the leader's crown: on a bare head, or beside a hat (never painted over it; above a hat is the card's title)
  if (o.crown) { if (hat) { x += 14; y += 6; } c.fillStyle = '#ffd35a'; c.fillRect(x + 3, y - 4, 8, 2); c.fillRect(x + 3, y - 6, 1, 2); c.fillRect(x + 6, y - 7, 2, 3); c.fillRect(x + 10, y - 6, 1, 2); }
}

// ---------------- THE FFA ARCADE: SAND AND BANNERS ----------------
// each mode's glyph, 8x8, in its own colour
const FFA_ICON = {
  crystal(c, x, y) { c.fillRect(x + 3, y, 2, 1); c.fillRect(x + 2, y + 1, 4, 2); c.fillRect(x + 1, y + 3, 6, 2); c.fillRect(x + 2, y + 5, 4, 2); c.fillRect(x + 3, y + 7, 2, 1); },
  sword(c, x, y) { c.fillRect(x + 3, y, 2, 5); c.fillRect(x + 1, y + 5, 6, 1); c.fillRect(x + 3, y + 6, 2, 2); },
  mace(c, x, y) { c.fillRect(x + 2, y, 4, 4); c.fillRect(x + 1, y + 1, 6, 2); c.fillRect(x + 3, y + 4, 2, 4); },
  spear(c, x, y) { c.fillRect(x + 3, y, 2, 1); c.fillRect(x + 2, y + 1, 4, 2); c.fillRect(x + 3, y + 3, 2, 5); },
  grapple(c, x, y) { c.fillRect(x + 4, y, 1, 4); c.fillRect(x + 2, y + 4, 1, 3); c.fillRect(x + 3, y + 7, 3, 1); c.fillRect(x + 6, y + 4, 1, 3); c.fillRect(x + 3, y + 3, 3, 1); },
  bow(c, x, y) { c.fillRect(x + 2, y, 2, 1); c.fillRect(x + 1, y + 1, 1, 6); c.fillRect(x + 2, y + 7, 2, 1); c.fillRect(x + 5, y, 1, 8); c.fillRect(x + 1, y + 4, 7, 1); },
  axe(c, x, y) { c.fillRect(x + 4, y, 1, 8); c.fillRect(x + 1, y + 1, 3, 4); c.fillRect(x, y + 2, 1, 2); },
  shield(c, x, y) { c.fillRect(x + 1, y, 6, 5); c.fillRect(x + 2, y + 5, 4, 2); c.fillRect(x + 3, y + 7, 2, 1); },
  knockback(c, x, y) { c.fillRect(x, y + 3, 8, 2); c.fillRect(x + 1, y + 2, 1, 4); c.fillRect(x + 6, y + 2, 1, 4); c.fillRect(x + 3, y, 2, 2); c.fillRect(x + 3, y + 6, 2, 2); },
  random(c, x, y) { c.fillRect(x + 1, y + 1, 6, 6); c.fillStyle = INK; c.fillRect(x + 2, y + 2, 1, 1); c.fillRect(x + 5, y + 2, 1, 1); c.fillRect(x + 3, y + 4, 2, 1); c.fillRect(x + 2, y + 5, 1, 1); c.fillRect(x + 5, y + 5, 1, 1); }
};
function ffaIcon(c, id, x, y, col, sc = 1) {
  c.fillStyle = col; const f = FFA_ICON[id] || FFA_ICON.sword;
  if (sc === 1) { f(c, x, y); return; }
  c.save(); c.translate(x, y); c.scale(sc, sc); c.fillStyle = col; f(c, 0, 0); c.restore();
}
// the chosen mode's own glyph, as the emblem of the card that shows its record
MENU_ART.ffamode = (c, x, y) => { const m = ffaMode(FFA.selected); c.fillStyle = mix('#1d1a29', m.color, .25); c.fillRect(x, y, 16, 16); ffaIcon(c, m.id, x, y, m.color, 2); };
function ffaPick(i) { const n = FFA_MODES.length, m = FFA_MODES[(i % n + n) % n]; if (m.id === FFA.selected) return; FFA.selected = m.id; AM.ffaT = performance.now(); KIT.sy.ffarec = 0; sfx('ui'); }
const ffaIdx = () => max(0, FFA_MODES.findIndex(m => m.id === FFA.selected));
// one mode: its glyph, name and words in its own colour; the chosen one glows
function ffaTile(c, m, x, y, w, h, i) {
  const sel = m.id === FFA.selected, kc = KIT.col; KIT.col = m.color;
  krow(c, x, y, w, h, () => ffaPick(i), { sel, tag: 'row:mode:' + m.id, hint: m.name + ': ' + m.desc + ' ' + kb('Enter plays it.', 'PLAY starts it.') });
  KIT.col = kc;
  if (sel) { c.fillStyle = rgbaHex(m.color, .14); c.fillRect(x + 2, y, w - 2, h); c.fillStyle = m.color; c.fillRect(x, y + h - 1, w, 1); }
  const ix = x + 6, iy = y + round((h - 12) / 2); c.fillStyle = sel ? m.color : '#2b2740'; c.fillRect(ix, iy, 12, 12); c.fillStyle = '#16121f'; c.fillRect(ix + 1, iy + 1, 10, 10); ffaIcon(c, m.id, ix + 2, iy + 2, m.color);
  const tx = ix + 17, bots = '3 BOTS', bw = textW(bots), room = w - (tx - x) - 4, showB = room - textW(m.name) >= bw + 8, two = false;
  drawText(c, fitText(m.name, room - (showB ? bw + 6 : 0)), tx, y + (two ? round(h / 2) - 9 : round((h - 8) / 2)), sel ? '#fff1a8' : '#fff');
  if (showB) drawText(c, bots, x + w - bw - 5, y + (two ? round(h / 2) - 9 : round((h - 8) / 2)), '#7ddc6f');
}
const FFA_FRIENDS = 'Friends pick JOIN A FRIEND on the home page and type your code.', FFA_OFFLINE = 'Private matches need WebRTC. Practice is ready offline with 3 bots.';
const ffaMiles = s => [['FIRST WIN', s.wins >= 1], ['10 KILLS', s.kills >= 10], ['10 MATCHES', s.matches >= 10]];
function ffaMileRows(cw) { let r = 1, x = 0; for (const [n] of ffaMiles({})) { const w = textW(n) + 14; if (x && x + w > cw) { r++; x = 0; } x += w; } return r; }
const ffaRecH = cw => amParaH(ffaMode(FFA.selected).desc, cw) + 6 + 42 + 4 + 6 + 10 + 6 + 10 + ffaMileRows(cw) * 11 + 6 + (netOK() ? 0 : amParaH(FFA_OFFLINE, cw)) + 4;
// the best of the ten modes by ELO (worked out again only when the saved records change)
function ffaBest() { const k = String(LS.get(ffaStatsKey(accountId()))), B = AM.ffaBest; if (B && B.k === k) return B.v; const v = FFA_MODES.map(q => ({ q, elo: ffaModeStats(q.id).elo })).sort((a, b) => b.elo - a.elo)[0]; AM.ffaBest = { k, v }; return v; }
// a private match of the chosen mode, by game code (never inside a scrolling box: the only way to host one)
function ffaHostBtn(c, x, y, w) {
  const m = ffaMode(FFA.selected), kc = KIT.col; KIT.col = m.color;
  kbutton(c, x, y, w, 'HOST PRIVATE MATCH  ·  CODE', () => ffaEnter(m.id, true), { small: true, short: 'HOST A PRIVATE MATCH', hint: 'A private ' + m.name + ' with a game code. ' + FFA_FRIENDS });
  KIT.col = kc;
}
// the chosen mode's record: its words, six numbers, a bar against the best mode, milestones, and how friends join
function ffaRecBody(c, cx, y, cw) {
  const S = KIT.sizes, m = ffaMode(FFA.selected), st = ffaModeStats(m.id), ratio = st.deaths ? (st.kills / st.deaths).toFixed(2) : st.kills.toFixed(2); let yy = y;
  yy += amPara(c, m.desc, cx, yy, cw, '#d8d4e6') + 6;
  const sw = floor((cw - 8) / 3), vals = [['KILLS', st.kills], ['DEATHS', st.deaths], ['WINS', st.wins], ['PLAYED', st.matches], ['K/D', ratio], ['ELO', st.elo]];
  vals.forEach(([l, v], k) => amStat(c, cx + (k % 3) * (sw + 4), yy + floor(k / 3) * 21, sw, l, v, k === 5 ? m.color : '#fff'));
  yy += 42 + 4;
  const best = ffaBest(), top = max(1, best.elo);
  c.fillStyle = '#2b2740'; c.fillRect(cx, yy, cw, 3); c.fillStyle = m.color; c.fillRect(cx, yy, max(1, round(cw * st.elo / top)), 3); yy += 6;
  drawText(c, fitText('BEST: ' + best.q.name + ' ' + best.elo + ' ELO', cw), cx, yy, best.q.id === m.id ? '#ffd35a' : '#b9bdd0'); yy += 10 + 6;
  drawText(c, 'MILESTONES', cx, yy, '#8b8fa3'); yy += 10;
  let mx = 0; for (const [n, got] of ffaMiles(st)) { const mw = textW(n) + 14; if (mx && mx + mw > cw) { mx = 0; yy += 11; } c.fillStyle = got ? '#ffd35a' : '#2b2740'; c.fillRect(cx + mx, yy + 1, 6, 6); if (got) { c.fillStyle = '#16121f'; c.fillRect(cx + mx + 2, yy + 3, 2, 2); } drawText(c, n, cx + mx + 9, yy, got ? '#ffd35a' : '#6a6485'); mx += mw; }
  yy += 11 + 6;
  if (!netOK()) yy += amPara(c, FFA_OFFLINE, cx, yy, cw, '#8b8fa3');
  return yy + 4 - y;
}
// the record as a card of its own, in the mode's colour, with the mode's glyph as its emblem
function ffaRecCard(c, x, y, w, h, i) {
  const m = ffaMode(FFA.selected), net = netOK(), K = kcard(c, x, y, w, h, 'ring', m.name, { col: m.color, art: 'ffamode', i, foot: net, right: (c, rx, ry) => ffaDot(c, rx, ry) });
  if (net) ffaHostBtn(c, K.x + 8, K.footY + 5, K.w - 16);
  const B = { x: K.x + 1, y: K.by, w: K.w - 2, h: (net ? K.footY - 2 : K.y + K.h - 3) - K.by }, need = ffaRecH(K.w - 16) + 3, dy = need > B.h ? kscroll(c, B, need, 'ffarec') : 0;
  ffaRecBody(c, K.x + 8, K.by + 3 + dy, K.w - 16);
  if (need > B.h) kscrollEnd(c);
}
// the live status: a dot that pulses green when private matches can be made, grey when not
function ffaDot(c, rx, ry) {
  const on = netOK(), p = .5 + .5 * sin(performance.now() / 300), s = on ? 'LIVE' : 'OFFLINE', w = textW(s);
  drawText(c, s, rx - w, ry + 5, on ? '#7ddc6f' : '#6a6485');
  const ga = c.globalAlpha; if (on) { c.globalAlpha = ga * (.4 + .6 * p); } c.fillStyle = on ? '#7ddc6f' : '#4a4460'; c.fillRect(rx - w - 8, ry + 6, 5, 5); c.globalAlpha = ga;
}
// YOU: the name and look you take into the arena
const ffaYouH = () => 29 + (KIT.T ? 34 : 28) + 2 + KIT.sizes.tileH + 6;
function ffaYou(c, x, y, w, h, i) {
  const K = kcard(c, x, y, w, h, 'ring', 'YOU', { i }); let yy = K.by + 1;
  yy += kfield(c, K.x + 8, yy, K.w - 16, 'nick', 'NAME', 'WAKER', { hint: 'The name over your head in the arena.' }) + 2;
  klook(c, K.x + 8, yy, K.w - 16, { hat: false });
}
// the modes, two columns of five (one column on a phone held upright, where they scroll)
function ffaModes(c, x, y, w, h, i, narrow) {
  const S = KIT.sizes, mode = ffaMode(FFA.selected);
  const K = kcard(c, x, y, w, h, 'ring', 'THE FFA ARCADE', { foot: true, i, right: (c, rx, ry) => { const s = narrow ? '10 MODES' : '10 MODES  ·  3 BOTS EACH'; drawText(c, s, rx - textW(s), ry + 5, '#8b8fa3'); } });
  const cx = K.x + 8, cw = K.w - 16, top = K.by + 2, bot = K.footY - 5;
  if (narrow) {
    const th = KIT.T ? 34 : 28, gap = S.gap, net = netOK(), need = S.bh + gap + 2 + (net ? S.sm + gap + 2 : 0) + FFA_MODES.length * (th + gap) + 4 + 16 + ffaRecH(cw - 4), B = { x: K.x + 1, y: top - 2, w: K.w - 2, h: bot - top + 4 }, dy = need > B.h ? kscroll(c, B, need, 'ffamodes') : 0;
    let yy = top + dy;
    kbutton(c, cx, yy, cw - 4, 'QUICK PLAY  ·  RANDOM MODE', ffaQuickPlay, { short: 'QUICK PLAY', hint: 'A random mode of the ten (R).' }); yy += S.bh + gap + 2;
    if (net) { ffaHostBtn(c, cx, yy, cw - 4); yy += S.sm + gap + 2; }
    FFA_MODES.forEach((m, k) => { ffaTile(c, m, cx, yy, cw - 4, th, k); yy += th + gap; });
    // the chosen mode's record under the list, behind a bar of its colour
    yy += 4; c.fillStyle = mode.color; c.fillRect(cx, yy, cw - 4, 2); ffaIcon(c, mode.id, cx, yy + 4, mode.color); drawText(c, mode.name, cx + 12, yy + 4, mode.color); ffaDot(c, cx + cw - 4, yy - 1); yy += 16;
    ffaRecBody(c, cx, yy, cw - 4);
    if (need > B.h) kscrollEnd(c);
  } else {
    const gap = S.gap, colW = floor((cw - gap) / 2), pitch = floor((bot - top + gap) / 5), th = min(KIT.T ? 34 : 30, pitch - gap);
    FFA_MODES.forEach((m, k) => ffaTile(c, m, cx + floor(k / 5) * (colW + gap), top + (k % 5) * pitch, colW, th, k));
  }
  // the foot: PLAY in the mode's own colour, QUICK PLAY, BACK
  const fy = K.footY + 5, bk = KIT.T ? 64 : 54, qw = narrow ? 0 : min(KIT.T ? 130 : 112, floor(cw * .3)), pw = cw - bk - S.gap - (qw ? qw + S.gap : 0), kc = KIT.col;
  KIT.col = mode.color;
  kbutton(c, cx, fy, pw, 'PLAY ' + mode.name, () => ffaEnter(mode.id), { main: true, short: 'PLAY', hint: 'Into the ' + mode.name + ' arena, with 3 bots.' });
  KIT.col = kc;
  if (qw) kbutton(c, cx + pw + S.gap, fy, qw, 'QUICK PLAY  ·  RANDOM MODE', ffaQuickPlay, { short: 'QUICK PLAY', hint: 'A random mode of the ten (R).' });
  kbutton(c, K.x + K.w - 8 - bk, fy, bk, 'BACK', menuBack, { hint: 'Back to the home page.' });
}
// the whole arcade: wide, YOU over the record beside the modes; on a phone held upright, YOU over the modes over the record
function ffaArcade(c) {
  const S = KIT.sizes, mode = menuMode(), narrow = mode === 'narrow', yh = ffaYouH();
  if (narrow) {
    const F = menuFrame('ring', 228, 2000); menuHero(c, 'ring', F);
    ffaYou(c, F.x, F.y, F.w, yh, 0); ffaModes(c, F.x, F.y + yh + 8, F.w, F.h - yh - 8, 1, true);
    return;
  }
  const F0 = menuFrame('ring', 620, 400), lw = min(KIT.T ? 216 : 196, floor(F0.w * .36)), rw = F0.w - lw - 8;
  const modesH = 29 + 5 * ((KIT.T ? 34 : 28) + S.gap) + 4 + S.bh + 10, F = menuFrame('ring', 620, max(modesH, yh + 8 + 29 + ffaRecH(lw - 16) + 6));
  ffaYou(c, F.x, F.y, lw, yh, 0); ffaRecCard(c, F.x, F.y + yh + 8, lw, F.h - yh - 8, 2); ffaModes(c, F.x + lw + 8, F.y, rw, F.h, 1, false);
}
function ffaKeys(e) {
  const k = e.code, i = ffaIdx();
  if (k === 'ArrowUp' || k === 'ArrowDown') { if (KIT.kbd && !/^row:mode/.test(KIT.focus || '')) return false; ffaPick(i + (k === 'ArrowUp' ? -1 : 1)); return true; }
  if (k === 'ArrowLeft' || k === 'ArrowRight') { ffaPick(i + 5); return true; }
  if (/^Digit[0-9]$/.test(k)) { ffaPick((+k[5] + 9) % 10); return true; }
  if (k === 'KeyR') { ffaQuickPlay(); return true; }
  return false;
}

// ---------------- the places ----------------
Object.assign(MENUS, {
  ring: {
    col: '#ff6b6b', art: 'ring', motes: 'cinders', place: 'SAND AND BANNERS', sound: 'chime', glow: { x: .5, y: .6 },
    idle: () => kb('Choose a mode (1-0, arrows), then Enter. R picks one for you.', 'Choose a mode, then PLAY.'),
    diorama(x, W, H) {
      // the sand of the ring and its faint circle, with banner poles at its edges
      const cx = W / 2, cy = H * .62, r = H * .45;
      x.fillStyle = 'rgba(186,160,120,.16)'; x.fillRect(0, H - 16, W, 16); x.fillStyle = 'rgba(186,160,120,.1)'; x.fillRect(0, H - 22, W, 6);
      x.strokeStyle = 'rgba(255,107,107,.14)'; x.lineWidth = 2; x.beginPath(); x.ellipse(cx, cy, r * 1.6, r, 0, 0, TAU); x.stroke();
      x.strokeStyle = 'rgba(255,211,90,.07)'; x.lineWidth = 1; x.beginPath(); x.ellipse(cx, cy, r * 1.6 - 6, r - 4, 0, 0, TAU); x.stroke();
      x.fillStyle = '#365058'; for (const px of [round(W * .05), round(W * .95)]) { x.fillRect(px, H - 74, 2, 58); x.fillRect(px - 2, H - 76, 6, 2); }
    },
    live(c, uw, uh, now) {
      // the banners sway on their poles
      const H = ceil(uh), W = ceil(uw); [round(W * .05), round(W * .95)].forEach((px, k) => { const s = round(sin(now / 700 + k * 2) * 1.5); c.drawImage(PROP.banners[k ? 2 : 0], px + 2 + s, H - 72, 14, 26); });
    },
    keys: ffaKeys,
    back() { UI.focus = null; G.state = 'title'; sfx('ui'); }
  }
});

// ---------------- THE COSMETIC SHOP: THE TAILOR'S STALL ----------------
// (moved here from 10-interface/1-menus-and-hud.js; COSMETIC_SHOP, its state, stays there)
// Three racks (SKINS, TRAILS, HATS) beside a plinth where the look you hold up turns in the light of its rarity.
const SHOP_RCOL = { COMMON: '#c8c4d4', UNCOMMON: '#7ddc6f', RARE: '#5aa8ff', EPIC: '#c77dff', LEGENDARY: '#ffd35a' };
const SHOP_TABS = [['skin', 'SKINS'], ['trail', 'TRAILS'], ['hat', 'HATS']];
const shopItems = () => BR_SHOP_ITEMS.filter(k => k.kind === COSMETIC_SHOP.tab);
const shopName = k => k.kind === 'trail' && k.id === 0 ? 'NO TRAIL' : k.name;
const shopPrice = k => k.cost ? k.cost + ' ' + (k.currency === 'souls' ? 'SOULS' : 'COINS') : 'FREE';
const shopWearing = k => k.kind === 'skin' ? G.skin === k.id : k.kind === 'hat' ? G.hat === k.id : (G.trail | 0) === k.id;
function shopTab(t) { if (COSMETIC_SHOP.tab === t) return; COSMETIC_SHOP.tab = t; COSMETIC_SHOP.scroll = 0; BR.menuMsg = ''; }
function shopAct(k) { if (shopWearing(k)) brUnequipCosmetic(k.kind); else brShopCosmetic(k.kind, k.id); }
// the wallet in the card's head: coins in gold, souls in violet
function shopWallet(c, rx, ry, p) {
  const a = p.coins + ' COINS', b = p.souls + ' SOULS', w = textW(a) + 10 + textW(b);
  drawText(c, a, rx - w, ry + 5, '#ffd35a'); c.fillStyle = '#4a4460'; c.fillRect(rx - textW(b) - 6, ry + 7, 2, 2); drawText(c, b, rx - textW(b), ry + 5, '#c77dff');
}
// the plinth: the look held up, turning every 1.6 s, its trail streaming behind it, lit in its rarity's colour
function shopPlinth(c, cx, y, k) {
  const now = performance.now(), col = SHOP_RCOL[k.rarity] || '#c8c4d4', skin = k.kind === 'skin' ? k.id : G.skin | 0, hat = k.kind === 'hat' ? k.id : G.hat | 0, trail = k.kind === 'trail' ? k.id : G.trail | 0, flip = ((now / 1600) | 0) % 2 ? -1 : 1, ga = c.globalAlpha;
  c.globalAlpha = ga * (.75 + .25 * sin(now / 500)); c.drawImage(kitGlow(30, col, .35), cx - 30, y + 4); c.globalAlpha = ga;
  c.fillStyle = '#2b2740'; c.fillRect(cx - 20, y + 40, 40, 4); c.fillStyle = col; c.fillRect(cx - 18, y + 39, 36, 1); c.fillStyle = '#1d1a29'; c.fillRect(cx - 16, y + 44, 32, 3);
  const T = BR_TRAILS[clamp(trail, 0, BR_TRAILS.length - 1)] || BR_TRAILS[0];
  if (trail) { c.fillStyle = T.color; for (let i = 0; i < 6; i++) { const u = ((now / 90 + i * 1.7) % 6) / 6; c.globalAlpha = ga * (1 - u) * .8; c.fillRect(cx - flip * (14 + round(u * 22)), y + 22 + ((i * 5) % 9), 2 + (i & 1), 2); } c.globalAlpha = ga; }
  c.save(); c.translate(cx, 0); c.scale(flip, 1); khead(c, skin, hat, -10, y + 15, 3); c.restore();
}
function drawCosmeticShop(c) {
  menuBackdrop(c, 'shop'); kview('shop');
  const S = KIT.sizes, p = brProfile(), mode = menuMode(), narrow = mode === 'narrow', rowH = KIT.T ? 32 : 22, all = shopItems();
  if (!all.some(k => k.id === COSMETIC_SHOP.selected) && all.length) COSMETIC_SHOP.selected = all[0].id;
  const k = all.find(q => q.id === COSMETIC_SHOP.selected) || all[0], tabsH = S.tab + 4, prevH = narrow ? 112 : 150;
  const want = 29 + tabsH + 6 + (narrow ? prevH + 6 + 6 * rowH : max(6 * rowH, prevH)) + 8 + S.bh + 10;
  const F = menuFrame('shop', 460, want); menuHero(c, 'shop', F);
  const K = kcard(c, F.x, F.y, F.w, F.h, 'shop', narrow ? 'THE SHOP' : 'THE COSMETIC SHOP', { foot: true, i: 0, right: (c, rx, ry) => shopWallet(c, rx, ry, p) });
  const cx = K.x + 8, cw = K.w - 16; let yy = K.by + 1;
  yy += ktabs(c, cx, yy, cw, SHOP_TABS.map(t => t[1]), (SHOP_TABS.find(t => t[0] === COSMETIC_SHOP.tab) || SHOP_TABS[0])[1], nm => shopTab(SHOP_TABS.find(t => t[1] === nm)[0])) + 4;
  const bot = K.footY - 4, lw = narrow ? cw : floor(cw * .56), px = narrow ? cx : cx + lw + 8, pw = narrow ? cw : cw - lw - 8, py = narrow ? yy : yy, ph = narrow ? prevH : bot - yy;
  // the look held up
  if (k) {
    const own = brOwns(p, k), wearing = shopWearing(k), col = SHOP_RCOL[k.rarity] || '#c8c4d4', pcx = narrow ? px + 34 : px + round(pw / 2);
    c.fillStyle = '#191622'; c.fillRect(px, py, pw, ph); c.fillStyle = col; c.fillRect(px, py, pw, 1);
    shopPlinth(c, pcx, py + (narrow ? 4 : 2), k);
    const tx = narrow ? px + 74 : px + 6, tw = narrow ? pw - 80 : pw - 12; let ty = narrow ? py + 8 : py + 54;
    const say = (s, col2) => { if (narrow) drawText(c, fitText(s, tw), tx, ty, col2); else textC(c, fitText(s, tw), px + pw / 2, ty, col2, 1, drawText); ty += 10; };
    say(shopName(k), '#fff1a8'); say(k.rarity, col); say(own ? (wearing ? 'WEARING' : 'OWNED') : shopPrice(k), own ? '#7ddc6f' : k.currency === 'souls' ? '#c77dff' : '#ffd35a');
    ty += 2;
    const label = wearing ? k.id === 0 ? 'WEARING' : 'UNEQUIP' : own ? 'EQUIP' : `BUY ${k.cost} ${k.currency.toUpperCase()}`, poor = !own && p[k.currency] < k.cost, off = (wearing && k.id === 0) || poor;
    const by = py + ph - S.bh - 4 - (BR.menuMsg && !narrow ? 20 : 0), bx = narrow ? tx : px + 6, bw = narrow ? tw : pw - 12;
    kbutton(c, bx, by, bw, label, () => shopAct(k), { main: !off, off, on: wearing && !off, hint: off ? (poor ? 'You need ' + k.cost + ' ' + k.currency + ' for that. Matches pay coins; kills pay souls.' : 'This is what you wear when you wear nothing.') : wearing ? 'Take it off.' : own ? 'Wear it.' : 'Buy it for ' + shopPrice(k).toLowerCase() + ', and wear it.' });
    if (BR.menuMsg && !narrow) kmsg(c, px + 6, by + S.bh + 4, pw - 12, { text: BR.menuMsg, kind: /need|not|could/i.test(BR.menuMsg) ? 'err' : 'ok' });
  } else textC(c, 'No cosmetics available.', px + pw / 2, py + 30, '#8b8fa3', 1, drawText);
  // the rack: one row per look, a gem in its rarity's colour, its price or OWNED
  const ly = narrow ? py + ph + 6 + (BR.menuMsg ? 12 : 0) : yy, B = { x: cx, y: ly, w: lw, h: bot - ly };
  if (narrow && BR.menuMsg) drawText(c, fitText(BR.menuMsg, cw), cx, py + ph + 3, /need|not|could/i.test(BR.menuMsg) ? '#ff9a8a' : '#7ddc6f');
  const L = amList(c, B, all.length, rowH, COSMETIC_SHOP, 'scroll', (c, i, x, y, w, h) => {
    const q = all[i], own = brOwns(p, q), sel = q.id === COSMETIC_SHOP.selected, rc = SHOP_RCOL[q.rarity] || '#c8c4d4', kc = KIT.col; KIT.col = rc;
    krow(c, x, y, w, h, () => { COSMETIC_SHOP.selected = q.id; BR.menuMsg = ''; sfx('ui'); }, { sel, tag: 'row:look:' + q.kind + ':' + q.id, hint: shopName(q) + ', ' + q.rarity.toLowerCase() + (own ? ': yours.' : ': ' + shopPrice(q).toLowerCase() + '.') });
    KIT.col = kc;
    const my = y + round((h - 8) / 2); c.fillStyle = rc; c.fillRect(x + 6, my + 2, 4, 4);
    const right = own ? (shopWearing(q) ? 'WEARING' : 'OWNED') : shopPrice(q), rw = textW(right);
    drawText(c, fitText(shopName(q), w - rw - 26), x + 14, my, own ? '#fff' : '#d8d4e6'); drawText(c, right, x + w - rw - 6, my, own ? '#7ddc6f' : q.currency === 'souls' ? '#c77dff' : '#ffd35a');
  });
  COSMETIC_SHOP.rows = L.vis;
  const bk = KIT.T ? 64 : 54;

  kbutton(c, K.x + K.w - 8 - bk, K.footY + 5, bk, 'BACK', menuBack, { hint: 'Back to the home page.' });
}
function shopKeys(e) {
  const k = e.code, all = shopItems(), i = all.findIndex(q => q.id === COSMETIC_SHOP.selected);
  if (k === 'ArrowUp' || k === 'ArrowDown') {
    if (KIT.kbd && KIT.focus && !/^row:look/.test(KIT.focus)) return false;
    const j = clamp(i + (k === 'ArrowUp' ? -1 : 1), 0, all.length - 1); if (all[j]) { COSMETIC_SHOP.selected = all[j].id; BR.menuMsg = ''; if (j < COSMETIC_SHOP.scroll) COSMETIC_SHOP.scroll = j; else if (j >= COSMETIC_SHOP.scroll + COSMETIC_SHOP.rows) COSMETIC_SHOP.scroll = j - COSMETIC_SHOP.rows + 1; sfx('ui'); } return true;
  }
  if (k === 'ArrowLeft' || k === 'ArrowRight' || /^Digit[1-3]$/.test(k)) { const t = /^Digit/.test(k) ? +k[5] - 1 : (SHOP_TABS.findIndex(q => q[0] === COSMETIC_SHOP.tab) + (k === 'ArrowLeft' ? 2 : 1)) % 3; shopTab(SHOP_TABS[t][0]); sfx('ui'); return true; }
  return false;
}
Object.assign(MENUS, {
  shop: {
    col: '#ff9ec7', art: 'stall', motes: 'stars', place: 'THE TAILOR\'S STALL', sound: 'ting', glow: { x: .5, y: .25 },
    idle: () => kb('Choose a look and hold it up. Looks never change your strength.', 'Looks never change your strength.'),
    diorama(x, W, H) {
      // a striped awning along the top, scalloped, and a rail of coats in the Wakers' colours
      const sw = 16; for (let i = 0; i * sw < W; i++) { x.fillStyle = i % 2 ? 'rgba(232,201,138,.32)' : 'rgba(255,158,199,.3)'; x.fillRect(i * sw, 0, sw, 12); x.fillRect(i * sw + 2, 12, sw - 4, 2); x.fillRect(i * sw + 5, 14, sw - 10, 1); }
      x.fillStyle = 'rgba(18,13,31,.5)'; x.fillRect(0, 15, W, 1);
      const rx = round(W * .04), ry = H - 74; x.fillStyle = '#4b6d78'; x.fillRect(rx, ry, 2, 56); x.fillRect(rx + 58, ry, 2, 56); x.fillRect(rx, ry, 60, 2);
    },
    live(c, uw, uh, now) {
      const rx = round(ceil(uw) * .04), ry = ceil(uh) - 72;
      for (let i = 0; i < 4; i++) { const s = round(sin(now / 800 + i * 1.3)), cx = rx + 6 + i * 13; c.fillStyle = SKINS[i][0]; c.fillRect(cx + s, ry + 3, 10, 18); c.fillStyle = SKINS[i][4]; c.fillRect(cx + 4 + s, ry + 3, 2, 18); }
    },
    keys: shopKeys,
    back() { G.state = 'title'; BR.menuMsg = ''; sfx('ui'); }
  }
});

// ---------------- THE ASHFALL TRIALS: FALLING ASH (drawBrForm is 4-royale-screens.js) ----------------
// little 8x8 pictures for the segments: heads for the team sizes, the two arenas, either, the Wilds' parachute
function amHeads(c, x, y, n) { const w = n === 1 ? 4 : n === 2 ? 3 : 2; for (let i = 0; i < n; i++) { const hx = x + (n === 1 ? 2 : i * (w + 1) + (n === 2 ? 1 : 0)); c.fillStyle = SKINS[i][0]; c.fillRect(hx, y + 2, w, w); c.fillStyle = '#e0d2b4'; c.fillRect(hx, y + 2 + w, w, 1); c.fillStyle = SKINS[i][4]; c.fillRect(hx, y + 3 + w, w, 2); } }
function amIsleIcon(c, x, y) { c.fillStyle = '#3a6f76'; c.fillRect(x, y + 6, 8, 2); c.fillStyle = '#58a868'; c.fillRect(x + 1, y + 4, 6, 2); c.fillRect(x + 3, y + 2, 3, 2); }
function amPeakIcon(c, x, y) { c.fillStyle = '#726d7d'; c.fillRect(x + 3, y + 1, 2, 2); c.fillRect(x + 2, y + 3, 4, 2); c.fillRect(x + 1, y + 5, 6, 2); c.fillStyle = '#ff8a3d'; c.fillRect(x, y + 7, 8, 1); c.fillStyle = '#ffd35a'; c.fillRect(x + 3, y, 2, 1); }
function amEitherIcon(c, x, y) { c.fillStyle = '#58a868'; c.fillRect(x, y + 4, 4, 3); c.fillStyle = '#726d7d'; c.fillRect(x + 5, y + 2, 2, 5); c.fillRect(x + 4, y + 4, 4, 3); c.fillStyle = '#e0d2b4'; c.fillRect(x + 4, y, 1, 8); }
function amChuteIcon(c, x, y) { c.fillStyle = '#c77dff'; c.fillRect(x + 1, y, 6, 2); c.fillRect(x, y + 1, 8, 1); c.fillStyle = '#d8d4e6'; c.fillRect(x + 1, y + 2, 1, 3); c.fillRect(x + 6, y + 2, 1, 3); c.fillStyle = '#e0d2b4'; c.fillRect(x + 3, y + 5, 2, 3); }
// the form's signature: twelve tiny Wakers in its head; one fades every 2 s, then all come back
function amTwelve(c, rx, ry) {
  const now = performance.now(), k = floor(now / 2000) % 13, u = (now % 2000) / 2000, ga = c.globalAlpha, x0 = rx - 12 * 7;
  for (let i = 0; i < 12; i++) { c.globalAlpha = ga * (i < k ? .14 : i === k && k < 12 ? 1 - .86 * min(1, u * 2) : 1); khead(c, i % 4, 0, x0 + i * 7, ry + 3, 1); }
  c.globalAlpha = ga;
}
Object.assign(MENUS, {
  brform: {
    col: '#e0d2b4', art: 'ashring', motes: 'ashfall', place: 'FALLING ASH', sound: 'tele', glow: { x: .78, y: .7 },
    idle: () => BR.wild ? wIdle() : kb('Choose your team and arena, then a way in. Escape goes back.', 'Choose your team and arena, then a way in.'),
    diorama(x, W, H) {
      // ash haze in bands, and an island on the far sea with a fire on it
      for (let i = 0; i < 5; i++) { x.fillStyle = `rgba(185,176,160,${.05 + i * .012})`; x.fillRect(0, round(H * (.18 + i * .14)), W, round(H * .05)); }
      const ix = round(W * .78), iy = H - 30; x.fillStyle = 'rgba(18,13,31,.75)'; x.fillRect(ix - 70, iy, 140, 6); x.fillRect(ix - 50, iy - 6, 100, 6); x.fillRect(ix - 30, iy - 12, 60, 6); x.fillRect(ix - 12, iy - 18, 24, 6);
      x.fillStyle = 'rgba(58,111,118,.35)'; x.fillRect(0, iy + 6, W, 24);
    },
    live(c, uw, uh, now) {
      const ix = round(ceil(uw) * .78), iy = ceil(uh) - 48, f = (now / 110) | 0;
      c.globalAlpha = .25 + .1 * sin(now / 260); c.drawImage(kitGlow(22, '#ff8a3d', 1), ix - 22, iy - 18); c.globalAlpha = 1;
      c.fillStyle = '#ff8a3d'; c.fillRect(ix - 2, iy - 2 + (f & 1), 4, 4 - (f & 1)); c.fillStyle = '#ffd35a'; c.fillRect(ix - 1 + (f % 3 === 0 ? 1 : 0), iy - 1, 1, 2);
    },
    keys(e) { return BR.wild ? wKeys(e) : false; },
    back() { UI.focus = null; if (BR.wild) { BR.wild = false; BR.menuMsg = ''; sfx('ui'); return; } G.state = 'title'; sfx('ui'); }
  }
});

// ---------------- THE WILDS (wDrawBrForm is 22-wilds-screens.js) ----------------
function wTab(t) { if (BR.menuTab === t) return; BR.menuTab = t; BR.menuScroll = 0; BR.menuMsg = ''; KIT.sy.wq = 0; }
const wSays = p => { const lv = brPassLevel(); return [[`${brTitle(lv)}  ·  PASS ${lv}  ·  ${p.xp % 1000}/1000 XP  ·  ${p.wins} WINS`, '#8ff5e6']]; };
const wRowH = () => KIT.T ? 30 : 18;
// the body's height for each page (wide enough at w): what the card asks menuFrame for
function wBodyH(tab, w) {
  const S = KIT.sizes, fh = KIT.T ? 34 : 28;
  if (tab === 'queue') return fh * 2 + 4 + S.sm + 6 + wSays(brProfile()).reduce((s, [t]) => s + amParaH(t, w - 4) + 4, 0) + 6 + S.bh + 12;
  if (tab === 'wheel') return 20 + BR_LOOKS.length * wRowH() + 6;
  return BR_SHOP_ITEMS.length * wRowH() + 6;
}
// ELO, COINS and SOULS as chips that count up over 400 ms, then the rank and its bar; returns the height
function wWalletDraw(c, x, y, w, p) {
  const now = performance.now(), key = p.elo + '|' + p.coins + '|' + p.souls, to = [p.elo, p.coins, p.souls];
  const shown = () => { const u = clamp((now - AM.walT) / 400, 0, 1), e = 1 - (1 - u) ** 3; return AM.wal.to.map((v, i) => round(AM.wal.from[i] + (v - AM.wal.from[i]) * e)); };
  if (!AM.wal) { AM.wal = { from: [0, 0, 0], to }; AM.walKey = key; AM.walT = now; } else if (key !== AM.walKey) { AM.wal = { from: shown(), to }; AM.walKey = key; AM.walT = now; }
  const v = shown(), cols = ['#8ff5e6', '#ffd35a', '#c77dff'], names = ['ELO', 'COINS', 'SOULS'], gw = floor((w - 8) / 3);
  for (let i = 0; i < 3; i++) { const bx = x + i * (gw + 4); c.fillStyle = '#1d1a29'; c.fillRect(bx, y, gw, 12); c.fillStyle = cols[i]; c.fillRect(bx, y, 2, 12); drawText(c, names[i], bx + 5, y + 2, '#8b8fa3'); const s = String(v[i]); drawText(c, s, bx + gw - textW(s) - 4, y + 2, cols[i]); }
  const rank = ['ASH', 'EMBER', 'CINDER', 'FLAME', 'CROWN'][min(4, floor(p.elo / 2000))], prog = (p.elo % 2000) / 2000, pct = round(prog * 100) + '%';
  drawText(c, rank, x, y + 15, '#ffd35a'); drawText(c, pct, x + w - textW(pct), y + 15, '#d8d4e6');
  const bx = x + textW(rank) + 6, bw = w - textW(rank) - textW(pct) - 12; c.fillStyle = '#2b2740'; c.fillRect(bx, y + 17, bw, 4); c.fillStyle = '#ff8a3d'; c.fillRect(bx, y + 17, round(bw * prog), 4);
  return 22 + 6;
}
const wGo = fn => { UI.focus = null; FORM.nick = cleanName(FORM.nick) || 'WAKER'; G.nick = FORM.nick; G.skin = FORM.skin | 0; G.hat = FORM.hat | 0; BR.matchType = FORM.brRanked ? 'ranked' : 'unranked'; accountSaveProfile(); G.state = 'loading'; G.loadMsg = 'Raising the island...'; setTimeout(fn, 30); sfx('quest', 0); };
function wBody(c, tab, x, y, w, bot, p) {
  const S = KIT.sizes;
  if (tab === 'queue') {
    // the three ways in sit pinned at the bottom; the name, the room, ranked or not and the words scroll above them
    const gy = bot - S.bh - 12, need = wBodyH('queue', w) - S.bh - 12 - 6, B = { x: x - 7, y: y - 2, w: w + 14, h: gy - 6 - y + 2 }, dy = need > B.h ? kscroll(c, B, need, 'wq') : 0; let yy = y + dy;
    yy += kfield(c, x, yy, w - 4, 'nick', 'NAME', 'WAKER', { hint: 'The name over your head as you fall.' }) + 2;
    yy += kfield(c, x, yy, w - 4, 'brcode', 'ROOM', 'open / private code', { hint: 'Leave it open to meet anyone online, or type a word your friends type too.' }) + 2;
    yy += ksegment(c, x, yy, w - 4, ['UNRANKED', 'RANKED'], FORM.brRanked ? 'RANKED' : 'UNRANKED', op => { FORM.brRanked = op === 'RANKED'; }, { hints: ['Play for souls and coins; your ELO stays put.', 'Your ELO rises and falls with your place.'] }) + 2;
    for (const [t, col] of wSays(p)) yy += amPara(c, t, x, yy, w - 4, col) + 4;
    if (need > B.h) kscrollEnd(c);
    const tw = floor((w - S.gap * 2) / 3);
    kbutton(c, x, gy, tw, 'ONLINE', () => wGo(() => wBrLobbyEnter('room', cleanCode(FORM.brcode) || 'open')), { off: !NET.room, main: !!NET.room, sub: tw < 90 ? 'on claude.ai' : 'only on claude.ai', hint: NET.room ? '' : 'Online matches are only on claude.ai: open this page there to find others.' });
    kbutton(c, x + tw + S.gap, gy, tw, 'HOST', () => wGo(() => { COOP.br = true; wBrLobbyEnter('rtc', 'friends'); }), { off: !netOK(), sub: 'not here', hint: netOK() ? '' : 'This window cannot connect to other computers.' });
    kbutton(c, x + (tw + S.gap) * 2, gy, w - (tw + S.gap) * 2, 'SOLO', () => wGo(() => wBrSolo()), { main: !NET.room });
    return;
  }
  const wheel = tab === 'wheel', items = wheel ? BR_LOOKS : BR_SHOP_ITEMS, rowH = wRowH(); let yy = y;
  if (wheel) {
    const t = w < 220 ? `A soul for every kill. ${BR_SPIN} souls a spin.` : `Every kill is a soul. ${BR_SPIN} souls turn the wheel, and it gives you a look you don't own.`;
    wrapC(t, w).slice(0, 2).forEach((l, i) => drawText(c, l, x, yy + i * 9, '#d8d4e6')); yy += 20;
  }
  const msg = BR.menuMsg ? wrapC(BR.menuMsg, w - 8).length * 9 + 3 : 0, B = { x, y: yy, w, h: bot - yy - msg };
  const L = amList(c, B, items.length, rowH, BR, 'menuScroll', (c, i, rx, ry, rw, rh) => {
    const k = items[i], own = brOwns(p, k), on = k.kind === 'skin' ? G.skin === k.id : k.kind === 'hat' ? G.hat === k.id : G.trail === k.id, name = `${k.kind.toUpperCase()}: ${k.name}`, ty = ry + round((rh - 8) / 2);
    c.fillStyle = (i % 2) ? '#211e2c' : '#1b1826'; c.fillRect(rx, ry, rw, rh);
    if (wheel) { const tag = own ? 'OWNED' : k.cost ? 'ON THE WHEEL' : 'FREE IN THE SHOP', tc = own ? '#7ddc6f' : k.cost ? '#ffd35a' : '#8b8fa3'; drawText(c, fitText(name, rw - textW(tag) - 14), rx + 4, ty, own ? '#fff' : '#8b8fa3'); drawText(c, tag, rx + rw - textW(tag) - 5, ty, tc); }
    else {
      const label = on ? 'ON' : own ? 'USE' : `BUY ${k.cost}`, bw = max(KIT.T ? 56 : 44, textW(label) + 12), poor = !own && p[k.currency] < k.cost;
      drawText(c, fitText(name, rw - bw - 12), rx + 4, ty, on ? '#fff1a8' : '#d8d4e6');
      kbutton(c, rx + rw - bw, ry + round((rh - S.sm) / 2), bw, label, () => brShopCosmetic(k.kind, k.id), { small: true, on, off: poor, hint: on ? 'You wear it now.' : own ? 'Wear it.' : poor ? 'You need ' + k.cost + ' ' + k.currency + ' for that.' : 'Buy it for ' + k.cost + ' ' + k.currency + ', and wear it.' });
    }
  }, { pager: true });
  BR.menuRows = L.vis;
  if (msg) kmsg(c, x, bot - msg + 3, w, { text: BR.menuMsg, kind: /need|not|could|earn/i.test(BR.menuMsg) ? 'err' : 'ok' });
}
// TURN THE WHEEL in the foot: its emblem turns while it is under the mouse
function wTurn(c, x, y, w, p) {
  const pool = brWheelPool(p), t = !pool.length ? 'ALL LOOKS OWNED' : `TURN THE WHEEL  ·  ${BR_SPIN} SOULS`, off = !pool.length || p.souls < BR_SPIN;
  AM.turn = inR(x, y, w, KIT.bh);
  kbutton(c, x, y, w, t, () => brSpinSoulWheel(), { main: !off, off, short: pool.length ? 'TURN THE WHEEL' : 'ALL OWNED', hint: !pool.length ? 'You already own every look.' : off ? (BR_SPIN - p.souls) + ' more souls needed: a soul for every kill.' : 'Spend ' + BR_SPIN + ' souls for a look you do not own.' });
}
function wIdle() { const t = BR.menuTab; return t === 'wheel' ? 'A soul for every kill. ' + BR_SPIN + ' souls turn the wheel.' : t === 'queue' ? kb('SOLO plays now. Tabs: 1-3 or Left and Right.', 'SOLO plays now, against echoes.') : 'Coins from matches buy looks. Looks never change your strength.'; }
function wKeys(e) {
  const k = e.code, T = ['queue', 'wheel', 'style'], i = max(0, T.indexOf(BR.menuTab));
  if (/^Digit[1-3]$/.test(k) && !UI.focus) { wTab(T[+k[5] - 1]); sfx('ui'); return true; }
  if ((k === 'ArrowLeft' || k === 'ArrowRight') && !KIT.kbd) { wTab(T[(i + (k === 'ArrowLeft' ? 2 : 1)) % 3]); sfx('ui'); return true; }
  return false;
}
Object.assign(MENUS, {
  wilds: {
    col: '#c77dff', art: 'chute', motes: 'souls', place: 'THE WILDS', glow: { x: .5, y: .2 },
    diorama(x, W, H) {
      // far peaks in the dusk, violet on violet
      x.fillStyle = 'rgba(58,40,82,.55)'; for (let i = 0; i < 7; i++) { const px = round(W * (i / 6)), ph = 30 + hh(i, 3, 5) * 50; for (let k = 0; k < 6; k++) x.fillRect(px - 40 + k * 7, H - ph + k * (ph / 6), 80 - k * 14, ph / 6 + 1); }
      x.fillStyle = 'rgba(199,125,255,.08)'; x.fillRect(0, H - 34, W, 34);
    },
    live(c, uw, uh, now) {
      // one parachute drifting down across the sky, over and over
      const W = ceil(uw), H = ceil(uh), u = (now / 26000) % 1, x = round(W * (.15 + .7 * u) + sin(now / 900) * 8), y = round(H * (.08 + .5 * u)), s = round(sin(now / 700));
      c.globalAlpha = .55; c.fillStyle = '#c77dff'; c.fillRect(x - 6 + s, y, 12, 2); c.fillRect(x - 7 + s, y + 2, 14, 1); c.fillStyle = '#d8d4e6'; c.fillRect(x - 5 + s, y + 3, 1, 4); c.fillRect(x + 4 + s, y + 3, 1, 4); c.fillStyle = '#e0d2b4'; c.fillRect(x - 1, y + 7, 2, 3); c.globalAlpha = 1;
    }
  }
});

// ---------------- THE LOBBIES: THE PLINTHS (the Trials) and the Wilds' (violet) ----------------
// drawBrLobby (4-royale-screens.js) and wDrawBrLobby (22-wilds-screens.js) both come here. Cards: WAKERS HERE (heads on
// plinths, the leader crowned), THE MATCH (the status on its own row, the settings, START NOW for the leader) and
// INVITE (the party word, the game code, OPEN TO OTHERS, FIND AN OPEN MATCH). LEAVE is in the foot.
function lobInfo(wild) {
  const me = wild ? wBrMe() : brMe(), host = BR.via === 'rtc' && netHost(), list = [{ id: me, n: G.nick, me: true, sk: G.skin | 0, pt: BR.party || '', tw: BR.wish | 0 }];
  for (const [id, q] of BR.people) list.push({ id, n: q.n || 'WAKER', ph: q.ph, ht: q.ht | 0, sk: q.sk === undefined ? [...String(id)].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 4 : q.sk, pt: q.pt || '', tw: q.tw | 0 });
  list.sort((a, b) => (a.ph === 'M') - (b.ph === 'M') || (a.id < b.id ? -1 : 1));
  const sz = clamp(BR.sizeWant | 0, 1, 3) || 1, parties = wild ? [] : [...new Set(list.map(e => e.pt).filter(p => p && list.filter(q => q.pt === p).length > 1))];
  const now = performance.now(), cd = BR.lead ? (BR.cdEnd ? max(0, ceil((BR.cdEnd - now) / 1000)) : -1) : BR.lastCd > 0 ? BR.lastCd : -1, off = BR.via === 'room' && NET.status === 'offline';
  let st;
  if (off) st = ['The live room cannot be reached from here.', 'warn'];
  else if (BR.via === 'room' && !NET.me) st = ['Joining the lobby...', 'info'];
  // (a guest who came back first leads the lobby while the host plays on: it has no game code to give)
  else if (BR.via === 'rtc' && BR.lead && !host) st = [(COOP.hostName || 'The host') + ' is in a match. START NOW starts the next one here.', 'ok'];
  else if (BR.via === 'rtc' && BR.lead) st = [BR.lobbyN > 1 ? 'Everyone here? Press START NOW. Echoes fill the empty places.' : 'Give your friends the game code' + (wild ? '' : ', or open the lobby to others') + '. Then START NOW.', 'ok'];
  else if (BR.busy && cd < 0) st = ['A match is running. The next one starts when it ends (or start now).', 'warn'];
  else if (cd >= 0) st = [(wild ? 'The sky opens in ' : 'The horn sounds in ') + cd + 's' + (BR.lobbyN < 2 ? '  (echoes fill the empty places)' : ''), 'ok'];
  else st = ['Waiting for the leader...', 'info'];
  const note = BR.via === 'room' ? 'Friends need this page: share it from claude.ai.' : wild ? (BR.via === 'rtc' ? 'Up to 8 Wakers; echoes fill the 32-player match.' : '') : BR.via === 'rtc' && !host ? 'You are in ' + (COOP.hostName || 'the host') + '\'s lobby. Your party stays together.' : '';
  const invite = (host) || (!wild && BR.via === 'room');
  return { wild, id: wild ? 'wlobby' : 'brlobby', me, host, list, sz, parties, cd, off, st, note, invite, max: wild ? WBR_MAX : BR_HUMANS };
}
const lobCell = () => KIT.T ? 56 : 50, lobRowH = 38;
const lobWakersH = (I, w) => { const per = max(1, floor(w / lobCell())), n = min(I.list.length, per * 2); return ceil(n / per) * lobRowH + (I.list.length > n ? 10 : 0) + (I.parties.length ? 10 : 0); };
function lobWakers(c, x, y, w, I) {
  const per = max(1, floor(w / lobCell())), cell = floor(w / per), n = min(I.list.length, per * 2);
  for (let i = 0; i < n; i++) {
    const e = I.list[i], cx = x + (i % per) * cell + round(cell / 2), cy = y + floor(i / per) * lobRowH, lead = e.id === BR.leaderId && e.ph !== 'M', pi = I.parties.indexOf(e.pt);
    amHead(c, e.sk, e.me ? G.hat | 0 : e.ht | 0, cx - 7, cy + 6, { crown: lead, dim: e.ph === 'M' });
    if (pi >= 0) { c.fillStyle = TR_TEAMCOL[pi % TR_TEAMCOL.length]; c.fillRect(cx - 9, cy + 24, 18, 1); }
    const busy = e.ph === 'M' && (performance.now() / 1500 | 0) % 2, nm = fitText(busy ? 'IN A MATCH' : e.n + (!I.wild && I.sz > 1 && e.tw ? ' ' + e.tw : ''), cell - 4); textC(c, nm, cx, cy + 27, e.ph === 'M' ? '#6a6485' : e.me ? '#ffd35a' : '#8ff5e6', 1, drawText);
  }
  let yy = y + ceil(n / per) * lobRowH;
  if (I.list.length > n) { drawText(c, '+' + (I.list.length - n) + ' more', x, yy, '#8b8fa3'); yy += 10; }
  if (I.parties.length) drawText(c, fitText('a line under a Waker marks a party', w), x, yy, '#6a6485');
}
// the status, on its own row: a coloured square and the words
const lobStatusH = (I, w) => amParaH(I.st[0], w - 8) + 4;
function lobStatus(c, x, y, w, I) { return kmsg(c, x, y, w, { text: I.st[0], kind: I.st[1] }) + 4; }
// the match's settings: the leader changes them, the others read them
const lobSetH = I => I.wild ? 12 : KIT.sizes.sm + 6 + 10;
function lobSettings(c, x, y, w, I) {
  const S = KIT.sizes;
  if (I.wild) { drawText(c, fitText((BR.matchType || 'unranked').toUpperCase() + '  ·  ' + I.list.length + ' OF ' + I.max + ' WAKERS', w), x, y + 1, '#8ff5e6'); return; }
  const aw = BR.arenaWant === undefined ? 2 : BR.arenaWant, n = I.sz > 1 ? 3 : 2, bw = floor((w - S.gap * (n - 1)) / n);
  drawText(c, 'TEAMS', x, y, '#8b8fa3'); drawText(c, 'ARENA', x + bw + S.gap, y, '#8b8fa3'); if (n > 2) drawText(c, 'YOUR TEAM', x + (bw + S.gap) * 2, y, '#8b8fa3');
  const yy = y + 10;
  if (BR.lead) { kbutton(c, x, yy, bw, TR_SIZE_N[I.sz], () => { BR.sizeWant = I.sz % 3 + 1; sfx('ui'); }, { small: true, hint: 'Solo, duos or trios: click to change.' }); kbutton(c, x + bw + S.gap, yy, bw, TR_ARENA_PICK[aw], () => { BR.arenaWant = (aw + 1) % 3; sfx('ui'); }, { small: true, hint: 'The island, the mountain, or either: click to change.' }); }
  else { const ty = yy + round((S.sm - 8) / 2); drawText(c, TR_SIZE_N[I.sz], x + 2, ty, '#d8d4e6'); drawText(c, TR_ARENA_PICK[aw], x + bw + S.gap + 2, ty, '#d8d4e6'); }
  if (n > 2) kbutton(c, x + (bw + S.gap) * 2, yy, bw, 'TEAM: ' + (BR.wish ? BR.wish : 'ANY'), () => { BR.wish = ((BR.wish | 0) + 1) % (ceil(BR_FILL / I.sz) + 1); sfx('ui'); }, { small: true, hint: 'Ask for a team number, so friends can share one.' });
}
// the leader's button (or the reason there is none); returns true when the main action is START NOW or PLAY WITH ECHOES
function lobStart(c, x, y, w, I) {
  if (I.off) { kbutton(c, x, y, w, 'PLAY WITH ECHOES', () => { if (I.wild) { wBrLeave(); wBrSolo(); } else { brLeave(); brSolo(); } }, { main: true, short: 'PLAY ECHOES', hint: 'The room cannot be reached: play a match against echoes instead.' }); return true; }
  if (BR.lead) { kbutton(c, x, y, w, 'START NOW', () => { BR.startNow = true; sfx('ui'); }, { main: true, hint: 'Start the match now; echoes fill the empty places.' }); return true; }
  drawText(c, fitText(BR.via === 'rtc' ? 'Only the host can start.' : 'The leader starts it.', w), x, y + round((KIT.bh - 8) / 2), '#8b8fa3');
  return false;
}
// INVITE: the party word (online), the game code with COPY, and the public board (the host of a party)
function lobInviteH(I, w) {
  const S = KIT.sizes; let h = 0;
  if (!I.wild && BR.via === 'room') h += (KIT.T ? 34 : 28) + amParaH('Friends who type the same word share a team.', w) + 6;
  if (I.host) {
    if (!netOK()) return h + amParaH('This window cannot connect to other computers.', w);
    h += amParaH(lobCodeWords(I), w) + 2 + 30 + 4 + amParaH(lobReady(I), w) + 6;
    if (!I.wild) h += S.bh + S.gap + S.bh + 6 + amParaH(lobOpenWords(), w);
  }
  return h;
}
const lobCodeWords = I => I.wild ? 'GAME CODE: friends pick JOIN A FRIEND and type it.' : 'YOUR PARTY\'S GAME CODE: friends pick JOIN A FRIEND and type it.';
const lobReady = I => COOP.err || COOP.note || (sigReady() ? (I.wild ? 'Ready: up to 7 friends can join this lobby.' : 'Ready: friends can join with this code.') : performance.now() - SIG.startT > 7000 ? 'Can\'t reach the internet, so friends can\'t find this match.' : 'Getting ready...');
const lobOpenWords = () => BR.open ? 'Listed on the public board: other players and parties can walk in, and face your party.' : 'Private. Open it to meet other people, or take your party to a lobby that is open.';
function lobInvite(c, x, y, w, I) {
  const S = KIT.sizes; let yy = y;
  if (!I.wild && BR.via === 'room') {
    if (FORM.brparty === undefined) FORM.brparty = '';
    yy += kfield(c, x, yy, w, 'brparty', 'PARTY', 'a shared word', { hint: 'Friends who type the same word share a team.' });
    yy += amPara(c, 'Friends who type the same word share a team.', x, yy, w, '#8b8fa3') + 6;
  }
  if (!I.host) return;
  if (!netOK()) { amPara(c, 'This window cannot connect to other computers.', x, yy, w, '#ffb347'); return; }
  sigHost(I.wild ? 'wilds' : 'br');
  yy += amPara(c, lobCodeWords(I), x, yy, w, '#d8d4e6') + 2;
  // the code, large, in a dark box; COPY beside it
  const cbw = KIT.T ? 64 : 52; c.fillStyle = '#16121f'; c.fillRect(x, yy, w, 30); c.fillStyle = KIT.col; c.fillRect(x, yy, 2, 30);
  textC(c, sigSpaced(COOP.gcode || '......'), x + (w - cbw - 8) / 2 + 2, yy + 8, '#ffd35a', 2, textO);
  kbutton(c, x + w - cbw - 4, yy + round((30 - S.sm) / 2), cbw, copyLabel(), () => copyText(COOP.gcode, 'gcopy'), { small: true, hint: 'Copy the code to send it.' }); yy += 34;
  if (COOP.copied > 0 && COOP.copyFail) { copyHint(c, x, yy); yy += 10; } else yy += amPara(c, lobReady(I), x, yy, w, COOP.err ? '#ff9a8a' : sigReady() ? '#7ddc6f' : '#ffd35a');
  yy += 6;
  if (I.wild) return;
  kbutton(c, x, yy, w, 'OPEN TO OTHERS: ' + (BR.open ? 'YES' : 'NO'), () => { BR.open = !BR.open; sfx('ui'); }, { on: !!BR.open, hint: 'List your lobby on the public board, so others can walk in.' }); yy += S.bh + S.gap;
  kbutton(c, x, yy, w, 'FIND AN OPEN MATCH (' + OPENB.list.size + ')', () => { BR.showOpen = true; UI.scroll = 0; sfx('ui'); }, { hint: 'Take your party into a lobby someone opened.' }); yy += S.bh + 6;
  amPara(c, lobOpenWords(), x, yy, w, BR.open ? '#7ddc6f' : '#8b8fa3');
}
function lobLeave() { if (BR.wild) wBrLeave(); else brLeave(); sfx('ui'); }
function arenaLobby(c, wild) {
  const I = lobInfo(wild), id = I.id, S = KIT.sizes, mode = menuMode(), bk = KIT.T ? 64 : 58;
  menuBackdrop(c, id); kview(id);
  const title = wild ? 'THE WILDS : LOBBY' : 'THE ASHFALL TRIALS : LOBBY', code = BR.via === 'room' ? BR.code.toUpperCase() : '';
  const count = (c, rx, ry) => { const s = I.list.length + (BR.via === 'rtc' || wild ? ' OF ' + I.max : '') + (code ? '  ·  ' + code : ''); drawText(c, s, rx - textW(s), ry + 5, '#8b8fa3'); };
  if (mode === 'narrow') {
    // one card: the Wakers, the status, the settings and the invite scroll; START NOW and LEAVE are pinned
    const cw0 = 228 - 16, need = lobWakersH(I, cw0) + 8 + lobStatusH(I, cw0) + 4 + lobSetH(I) + 8 + (I.invite ? lobInviteH(I, cw0 - 4) + 8 : 0) + (I.note ? amParaH(I.note, cw0) : 0) + 4;
    const F = menuFrame(id, 228, 29 + need + S.bh + 10); menuHero(c, id, F);
    const K = kcard(c, F.x, F.y, F.w, F.h, id, wild ? 'WILDS LOBBY' : 'THE LOBBY', { foot: true, i: 0, right: count }), cx = K.x + 8, cw = K.w - 16;
    const B = { x: K.x + 1, y: K.by - 2, w: K.w - 2, h: K.footY - 2 - K.by }, dy = need > B.h ? kscroll(c, B, need, 'lob') : 0; let yy = K.by + dy;
    lobWakers(c, cx, yy, cw - 4, I); yy += lobWakersH(I, cw0) + 8; yy += lobStatus(c, cx, yy, cw - 4, I) + 4; lobSettings(c, cx, yy, cw - 4, I); yy += lobSetH(I) + 8;
    if (I.invite) { c.fillStyle = '#2b2740'; c.fillRect(cx, yy - 5, cw - 4, 1); lobInvite(c, cx, yy, cw - 4, I); yy += lobInviteH(I, cw0 - 4) + 8; }
    if (I.note) amPara(c, I.note, cx, yy, cw - 4, '#8b8fa3');
    if (need > B.h) kscrollEnd(c);
    lobStart(c, cx, K.footY + 5, cw - bk - S.gap, I);
    kbutton(c, K.x + K.w - 8 - bk, K.footY + 5, bk, 'LEAVE', lobLeave, { hint: 'Leave the lobby.' });
  } else {
    // two columns: the Wakers over the match on the left, the invite on the right (when there is one)
    const F0 = menuFrame(id, I.invite ? 600 : 400, 400), rw = I.invite ? min(KIT.T ? 250 : 236, floor(F0.w * .42)) : 0, lw = F0.w - (rw ? rw + 8 : 0), lcw = lw - 16;
    const wh = 29 + lobWakersH(I, lcw) + 4, mh = 29 + lobStatusH(I, lcw) + 6 + lobSetH(I) + 8 + (I.note ? amParaH(I.note, lcw) : 0) + 4 + S.bh + 10, ih = I.invite ? 29 + lobInviteH(I, rw - 20) + 6 : 0;
    const F = menuFrame(id, I.invite ? 600 : 400, max(wh + 8 + mh, ih)), short = wh + 8 + mh > F.h;
    const wH = short ? max(29 + lobRowH + 4, F.h - mh - 8) : wh, mH = F.h - wH - 8;
    const W = kcard(c, F.x, F.y, lw, wH, id, 'WAKERS HERE', { i: 0, right: count });
    { const B = { x: W.x + 1, y: W.by - 1, w: W.w - 2, h: W.y + W.h - 2 - W.by }, need = lobWakersH(I, lcw) + 2, dy = need > B.h ? kscroll(c, B, need, 'lobw') : 0; lobWakers(c, W.x + 8, W.by + 1 + dy, lcw - 4, I); if (need > B.h) kscrollEnd(c); }
    const M = kcard(c, F.x, F.y + wH + 8, lw, mH, id, 'THE MATCH', { i: 1, foot: true }); let yy = M.by + 1;
    yy += lobStatus(c, M.x + 8, yy, lcw, I) + 2; lobSettings(c, M.x + 8, yy, lcw, I); yy += lobSetH(I) + 8;
    if (I.note && yy + amParaH(I.note, lcw) <= M.footY - 2) amPara(c, I.note, M.x + 8, yy, lcw, '#8b8fa3');
    lobStart(c, M.x + 8, M.footY + 5, min(170, lcw - bk - S.gap), I);
    kbutton(c, M.x + M.w - 8 - bk, M.footY + 5, bk, 'LEAVE', lobLeave, { hint: 'Leave the lobby.' });
    if (I.invite) {
      const V = kcard(c, F.x + lw + 8, F.y, rw, F.h, id, 'INVITE', { i: 2 }), B = { x: V.x + 1, y: V.by - 1, w: V.w - 2, h: V.y + V.h - 2 - V.by }, need = lobInviteH(I, rw - 20) + 4, dy = need > B.h ? kscroll(c, B, need, 'lobi') : 0;
      lobInvite(c, V.x + 8, V.by + 1 + dy, rw - 20, I); if (need > B.h) kscrollEnd(c);
    }
  }
  // the board of open matches, over the lobby, as a card of its own with CLOSE
  if (BR.showOpen && !wild) {
    c.fillStyle = 'rgba(18,13,31,.62)'; c.fillRect(0, 0, VS.uw, VS.uh); hit(0, 0, VS.uw, VS.uh, () => { BR.showOpen = false; sfx('ui'); }, false, 'veil:open');
    const F = menuFrame('bropen', 380, openListH(380)); drawOpenList(c, F.x, F.y, F.w, F.h, { close: () => { BR.showOpen = false; sfx('ui'); }, i: 3 });
  }
}
const lobIdle = () => BR.wild ? kb('Wait for the others, or start. Escape leaves.', 'Wait for the others, or start.') : BR.lead ? kb('START NOW when everyone is here. Escape leaves the lobby.', 'START NOW when everyone is here.') : 'The match starts when the leader says so.';
Object.assign(MENUS, {
  brlobby: {
    col: '#e0d2b4', art: 'plinth', motes: 'ashfall', place: 'THE PLINTHS', sound: 'chime', glow: { x: .5, y: .8 }, still: true,
    idle: lobIdle,
    diorama(x, W, H) {
      // twelve plinths in a ring round the hearth, low on the horizon
      for (let i = 0; i < 12; i++) { const u = i / 11, px = round(W * (.12 + .76 * u)), py = H - 26 - round(sin(u * PI) * 10); x.fillStyle = 'rgba(114,109,125,.55)'; x.fillRect(px - 5, py, 10, 8); x.fillStyle = 'rgba(185,189,208,.4)'; x.fillRect(px - 5, py, 10, 1); }
      x.fillStyle = 'rgba(18,13,31,.6)'; x.fillRect(0, H - 18, W, 18);
    },
    live(c, uw, uh, now) { const W = ceil(uw), H = ceil(uh), f = (now / 110) | 0; c.globalAlpha = .3 + .1 * sin(now / 300); c.drawImage(kitGlow(26, '#ff8a3d', 1), round(W / 2) - 26, H - 60); c.globalAlpha = 1; c.fillStyle = '#ff8a3d'; c.fillRect(round(W / 2) - 2, H - 38 + (f & 1), 4, 4); c.fillStyle = '#ffd35a'; c.fillRect(round(W / 2) - 1, H - 37, 2, 2); },
    keys(e) { return false; },
    back() { if (BR.showOpen && !BR.wild) { BR.showOpen = false; sfx('ui'); return; } lobLeave(); }
  },
  wlobby: { col: '#c77dff', art: 'chute', motes: 'souls', place: 'THE WILDS', glow: { x: .5, y: .2 }, still: true, diorama: (x, W, H) => MENUS.wilds.diorama(x, W, H), live: (c, uw, uh, now) => MENUS.wilds.live(c, uw, uh, now) }
});
Object.assign(MENUS, {
  bropen: {
    col: '#ffb36a', art: 'banner', motes: 'ashfall', place: 'THE OPEN BOARD', sound: 'ui', glow: { x: .2, y: .4 },
    idle: () => openList().length ? kb('JOIN walks you into a lobby someone opened. Escape goes back.', 'JOIN walks you into a lobby someone opened.') : 'Lobbies opened to everyone show here.',
    diorama(x, W, H) { const px = round(W * .1); x.fillStyle = '#365058'; x.fillRect(px, H - 110, 2, 100); x.fillRect(px - 3, H - 112, 8, 2); x.fillStyle = 'rgba(18,13,31,.5)'; x.fillRect(px - 10, H - 12, 22, 4); },
    live(c, uw, uh, now) {
      // a banner waving on its pole: five strips, each a little behind the last
      const px = round(ceil(uw) * .1) + 2, py = ceil(uh) - 106;
      for (let i = 0; i < 6; i++) { const o = round(sin(now / 260 - i * .7) * 2); c.fillStyle = i % 2 ? '#c94a2e' : '#ffb36a'; c.fillRect(px + i * 6, py + o, 6, 22 - (i === 5 ? 4 : 0)); }
    },
    back() { G.state = 'brform'; UI.focus = null; sfx('ui'); }
  }
});

// ---------------- in a match: the dead and results cards, the score and the map ----------------
// THE END OF A FIGHT: one card above the hotbar, no higher than 42% down the screen; red when you are down, gold for a
// victory, violet otherwise. o = { title, col, art, ms (how long it has been showing), lines: [[text, colour]],
// spec (the Waker you watch, with < > to switch), buttons: [[label, fn, hint]] (the first is the main one) }
function amEndCard(c, o) {
  const S = KIT.sizes, uw = VS.uw, uh = VS.uh, w = min(300, uw - 16), cw = w - 16, bot = hotbarLayout().y - 6, top = round(uh * .42);
  const lh = o.lines.reduce((s, [t]) => s + wrapC(t, cw).length * 10, 0), need = 29 + lh + (o.spec ? S.sm + 6 : 0) + 4 + S.bh + 10, h = min(need, max(29 + S.bh + 30, bot - top)), x = round((uw - w) / 2), y = bot - h, ga = c.globalAlpha;
  const K = kcard(c, x, y, w, h, 'dead', o.title, { col: o.col, art: o.art, foot: true, i: amFade(o.ms) });
  hit(K.x, K.y, K.w, K.footY - K.y, () => { }, false, 'card:' + o.art);
  const B = { x: K.x + 1, y: K.by - 2, w: K.w - 2, h: K.footY - 2 - K.by }, inner = lh + (o.spec ? S.sm + 6 : 0) + 2, dy = inner > B.h ? kscroll(c, B, inner, 'endcard') : 0; let yy = K.by + dy;
  for (const [t, col] of o.lines) for (const l of wrapC(t, cw)) { textC(c, l, K.x + w / 2, yy, col, 1, drawText); yy += 10; }
  if (o.spec) {
    const s = 'watching ' + o.spec.name, aw = KIT.T ? 30 : 20, tw = min(textW(s), cw - aw * 2 - 16), sx = round(K.x + (w - tw) / 2), sy = yy + 2;
    drawText(c, fitText(s, tw), sx, sy + round((S.sm - 8) / 2), '#8ff5e6');
    karrow(c, sx - aw - 6, sy, aw, S.sm, -1, false, () => o.specNext(-1), 'btn:WATCH <'); karrow(c, sx + tw + 6, sy, aw, S.sm, 1, false, () => o.specNext(1), 'btn:WATCH >');
    yy += S.sm + 6;
  }
  if (inner > B.h) kscrollEnd(c);
  const n = o.buttons.length, fy = K.footY + 5;
  if (n) { KIT.endMain = o.buttons[0][1]; const bw = floor((cw - S.gap * (n - 1)) / n); o.buttons.forEach(([label, fn, hint], i) => kbutton(c, K.x + 8 + i * (bw + S.gap), fy, i === n - 1 && n > 1 ? cw - (bw + S.gap) * (n - 1) : bw, label, fn, { main: i === 0, hint })); }
  else if (o.footNote) drawText(c, fitText(o.footNote, cw), K.x + 8, fy + round((S.bh - 8) / 2), '#8b8fa3');
  c.globalAlpha = ga;
}
// on a touch screen, the highest y from y0 down where a card of w x h is clear of the touch controls (else y0)
// (worked out at most twice a second: it reads where each touch control is on the page)
function amClearY(x, y0, w, h) {
  if (!mobileDevice) return y0; const now = performance.now(), k = [x, y0, w, h, VS.uw, VS.uh].join(), C = AM.clear || (AM.clear = {});
  if (C.k === k && now - C.t < 500) return C.y;
  const ym = hotbarLayout().y - 4; let r = y0; for (let y = y0; y + h <= ym; y += 4) if (touchClear(x, y, w, h)) { r = y; break; }
  Object.assign(C, { k, t: now, y: r }); return r;
}
// WHO IS LEFT (Tab): a card at the score's old place, one or two columns of names with their takedowns
function amScore(c, title, col, list, ally) {
  const uw = VS.uw, two = list.length > 16, rows = two ? 16 : list.length, w = min(two ? 380 : 210, uw - 12), h = 29 + rows * 10 + 5, x = round((uw - w) / 2), y = amClearY(x, KIT.T ? 44 : 40, w, h), ga = c.globalAlpha, colW = two ? floor(w / 2) : w;
  kcard(c, x, y, w, h, 'brscore', title, { col, art: 'tally' });
  list.slice(0, 32).forEach((f, i) => {
    const xx = x + (two && i >= 16 ? colW : 0), yy = y + 28 + (i % 16) * 10, a = ally(f);
    if (a.bar) { c.fillStyle = a.bar; c.fillRect(xx + 4, yy, 2, 8); }
    const k = f.dead ? 'down' : String(f.kills), kw = textW(k);
    drawText(c, fitText((f === G.p ? '> ' : a.mark || '') + f.name + (f.brBot || f.ghostBot ? '  (echo)' : ''), colW - kw - 22), xx + 9, yy, f.dead ? '#6a6485' : f === G.p ? '#ffd35a' : a.col || (f.brBot || f.ghostBot ? '#d8d4e6' : '#8ff5e6'));
    drawText(c, k, xx + colW - kw - 8, yy, f.dead ? '#6a6485' : '#fff');
  });
  c.globalAlpha = ga;
}
// THE ISLAND (M): the map's card around the picture at its old place; returns nothing (the map draws inside it)
function amMapCard(c, x, y, w, h, legend) {
  const ga = c.globalAlpha; kcard(c, x, y, w, h, 'brmap', kb('THE ISLAND  [M] close', 'THE ISLAND'), { art: 'islemap', close: () => { BR.mapOpen = false; sfx('ui'); } }); c.globalAlpha = ga;
  if (legend) drawText(c, fitText(legend, w - 16), x + 8, y + h - 12, '#8b8fa3');
}
Object.assign(MENUS, {
  perks: { col: '#ffd35a', art: 'perk', place: 'A PERK' },
  dead: { col: '#e2483b', art: 'fallen', place: 'TAKEN DOWN' },
  results: { col: '#ffd35a', art: 'crown', place: 'THE END' },
  brscore: { col: '#ff8a3d', art: 'tally', place: 'WHO IS LEFT' },
  brmap: { col: '#5fb0ff', art: 'islemap', place: 'THE ISLAND' }
});
