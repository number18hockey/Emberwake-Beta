// ============================================================
//  The wilds: more kinds of tree, and the bushes, boulders, logs,
//  cacti and reeds that stand between them.
//  Tree crowns are kinds 4 to 9 (0 to 3 are the older lantern, frost,
//  rust and thorn stalks); any crown can stand on any trunk.
// ============================================================
const CROWN = { oak: 4, willow: 5, mangrove: 6, palm: 7, pine: 8, maple: 9 };
// what a crown sheds: leaf colours, for wind and for falling trees
const LEAF = [['#3a6f76', '#2c575e', '#ffb347'], ['#dcf7f5', '#8fd0d8', '#ffffff'], ['#bd5a36', '#a3482e', '#7a3222'], ['#5a2424', '#2c4a34', '#3a1414'], ['#6ba653', '#b2e38a', '#3f8a55'], ['#80b99a', '#b4e6c2', '#477d70'], ['#4f6b3a', '#7a8f4a', '#33482c'], ['#c9b45a', '#8f9a4a', '#e0d28a'], ['#2f6a5a', '#dcf7f5', '#1f4a44'], ['#e2742b', '#ffb347', '#b8371c']];
const WILD = {};
function buildWilds() {
  const W = 46, H = 32;
  const canopy = (seed, blobs, cols, o = {}) => {
    const [c, x] = mk(W, H), R = mulberry32(seed), px = (X, Y, col) => { if (X >= 0 && Y >= 0 && X < W && Y < H) { x.fillStyle = col; x.fillRect(X, Y, 1, 1); } };
    const solid = (X, Y) => blobs.some(([bx, by, r, sq]) => ((X - bx) ** 2) / (r * r) + ((Y - by) ** 2) / (r * r * (sq || .8) ** 2) < 1);
    for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
      if (!solid(X, Y)) continue; const edge = !solid(X - 1, Y) || !solid(X + 1, Y) || !solid(X, Y - 1) || !solid(X, Y + 1);
      if (edge && hh(X, Y, seed) < .22 && Y > 3) continue;   // a ragged leafy edge
      const lit = !solid(X - 2, Y - 3) || !solid(X, Y - 3), low = !solid(X, Y + 4), n = hh(X >> 1, Y >> 1, seed + 3) * .6 + hh(X, Y, seed + 9) * .4;
      px(X, Y, edge && low ? cols[3] : lit && n > .35 ? cols[2] : low ? cols[0] : n > .74 ? cols[2] : n > .36 ? cols[1] : cols[0]);
      if (edge && !low && !lit) px(X, Y, cols[0]);
    }
    const pods = []; for (let k = 0; k < (o.pods || 0); k++) { const b = blobs[(R() * blobs.length) | 0], X = round(b[0] + (R() - .5) * b[2]), Y = round(b[1] + (R() - .2) * b[2] * .6); if (!solid(X, Y)) continue; px(X, Y, o.podCol || '#ffd35a'); px(X + 1, Y, o.podCol || '#ffd35a'); pods.push([X, Y, o.podKind || 0]); }
    // the stem showing under the leaves
    for (let Y = H - 7; Y < H; Y++) { px(22, Y, '#142a30'); px(23, Y, o.stem || '#2c575e'); px(24, Y, o.stem || '#2c575e'); px(25, Y, '#142a30'); }
    return { cv: c, pods };
  };
  const droop = (seed, cols, n, len, o = {}) => {
    const [c, x] = mk(W, H), R = mulberry32(seed), px = (X, Y, col) => { X = round(X); Y = round(Y); if (X >= 0 && Y >= 0 && X < W && Y < H) { x.fillStyle = col; x.fillRect(X, Y, 1, 1); } };
    for (let Y = 9; Y < H; Y++) { px(22, Y, '#142a30'); px(23, Y, o.stem || '#477d70'); px(24, Y, o.stem || '#477d70'); px(25, Y, '#142a30'); }
    for (let k = 0; k < n; k++) {
      const u = (k + .5) / n * 2 - 1, reach = u * (13 + R() * 7), top = 4 + abs(u) * 4 + R() * 3, L = len * (.65 + R() * .5);
      for (let s = 0; s <= 1; s += .04) px(23.5 + reach * s, 12 - (12 - top) * sin(s * PI * .62) + abs(u) * s * 2, cols[0]);
      const ex = 23.5 + reach, ey = 12 - (12 - top) * sin(PI * .62) + abs(u) * 2;
      for (let j = 0; j < 4; j++) { let X = ex - u * j * 3.2, Y = ey - j * .4; const l2 = L * (.6 + R() * .5); for (let i = 0; i < l2 && Y < H - 1; i++) { px(X, Y, i > l2 - 3 ? cols[2] : i % 3 === 0 ? cols[2] : cols[1]); if (i % 2) px(X + (R() < .5 ? 1 : -1), Y, cols[0]); Y++; X += (R() - .5) * .5; } }
    }
    return { cv: c, pods: [] };
  };
  const palm = (seed) => {
    const [c, x] = mk(W, H), R = mulberry32(seed), px = (X, Y, col) => { X = round(X); Y = round(Y); if (X >= 0 && Y >= 0 && X < W && Y < H) { x.fillStyle = col; x.fillRect(X, Y, 1, 1); } };
    for (let Y = 14; Y < H; Y++) { px(22, Y, '#4a3a28'); px(23, Y, '#8a6a48'); px(24, Y, Y % 3 ? '#8a6a48' : '#6a4e34'); px(25, Y, '#4a3a28'); }
    for (let k = 0; k < 8; k++) { const a = -PI / 2 + (k - 3.5) * .5 + (R() - .5) * .2, len = 15 + R() * 6; for (let i = 0; i < len; i++) { const u = i / len, X = 23.5 + cos(a) * i, Y = 14 + sin(a) * i * .8 + u * u * 11; px(X, Y, u > .8 ? '#e0d28a' : '#8f9a4a'); px(X, Y + 1, '#5f6a34'); if (i % 2 && i > 3) { px(X, Y + 2, '#c9b45a'); px(X + 1, Y + 3, '#8f9a4a'); } } }
    for (const [dx, dy] of [[-2, 2], [1, 3], [3, 1]]) { px(23 + dx, 14 + dy, '#ffb347'); px(24 + dx, 14 + dy, '#c96a2a'); }
    return { cv: c, pods: [[22, 17, 0]] };
  };
  const pine = (seed) => {
    const [c, x] = mk(W, H), px = (X, Y, col) => { if (X >= 0 && Y >= 0 && X < W && Y < H) { x.fillStyle = col; x.fillRect(X, Y, 1, 1); } };
    for (let t = 0; t < 4; t++) { const y0 = t * 7, half = 5 + t * 4; for (let j = 0; j < 10; j++) { const w = round(half * (j + 1) / 10); for (let k = -w; k <= w; k++) { const X = 23 + k, Y = y0 + j; if (Y > H - 3) continue; const n = hh(X, Y, seed); if (abs(k) === w && n < .4) continue; px(X, Y, j < 2 || (k < 0 && n > .72) ? '#dcf7f5' : abs(k) >= w - 1 ? '#14332f' : n > .6 ? '#2f6a5a' : '#1f4a44'); } } }
    for (let Y = H - 3; Y < H; Y++) { px(22, Y, '#142a30'); px(23, Y, '#5a7a82'); px(24, Y, '#5a7a82'); px(25, Y, '#142a30'); }
    return { cv: c, pods: [] };
  };
  for (let k = 4; k <= 9; k++) SPR.top[k] = [];
  for (let v = 0; v < 3; v++) {
    const R = mulberry32(700 + v), j = a => (R() - .5) * a;
    SPR.top[CROWN.oak][v] = canopy(41 + v, [[23, 14, 10], [12 + j(3), 18, 8], [34 + j(3), 18, 8], [17, 9 + j(3), 8], [29, 9 + j(3), 8], [23, 21, 9, .6]], ['#245a3a', '#3f8a55', '#8bd27b', '#163a28'], { pods: 3 + v, podCol: '#d5f07a', stem: '#4a5a3a' });
    SPR.top[CROWN.willow][v] = droop(51 + v, ['#477d70', '#80b99a', '#d2f2d2'], 9, 17, { stem: '#5a7a6a' });
    SPR.top[CROWN.mangrove][v] = canopy(61 + v, [[23, 9, 12, .42], [12 + j(4), 11, 10, .42], [34 + j(4), 11, 10, .42], [23, 12, 15, .3]], ['#33482c', '#4f6b3a', '#93a85a', '#1f2c1c'], { stem: '#5a4a38' });
    SPR.top[CROWN.palm][v] = palm(71 + v);
    SPR.top[CROWN.pine][v] = pine(81 + v);
    SPR.top[CROWN.maple][v] = canopy(91 + v, [[23, 13, 11], [13 + j(3), 16, 8], [33 + j(3), 16, 8], [23, 6 + j(2), 7], [18, 20, 8, .6], [29, 20, 8, .6]], ['#8f2f1c', '#c9502a', '#ff9a4a', '#4a1810'], { pods: 2, podCol: '#ffe08a', stem: '#6a3a2a' });
  }
  // ---------------- things that stand on the ground ----------------
  const art = (w, h, fn) => { const [c, x] = mk(w, h); fn((X, Y, col) => { X = round(X); Y = round(Y); if (X >= 0 && Y >= 0 && X < w && Y < h) { x.fillStyle = col; x.fillRect(X, Y, 1, 1); } }, x); return outlined(c); };
  const bush = (seed, cols, dot) => art(20, 11, px => { const R = mulberry32(seed); for (let Y = 0; Y < 11; Y++) for (let X = 0; X < 20; X++) { const h1 = 10.5 * pow(max(0, 1 - ((X - 9.5) / 10) ** 2), .5) * (.78 + .22 * sin(X * 1.3 + seed)); if (10 - Y > h1) continue; const n = hh(X, Y, seed); px(X, Y, 10 - Y > h1 - 2 ? cols[2] : n > .6 ? cols[1] : cols[0]); } if (dot) for (let k = 0; k < 6; k++) { const X = 3 + R() * 14, Y = 3 + R() * 6; px(X, Y, dot); } });
  WILD.bush = { moor: [bush(1, ['#8a3a44', '#c94a4e', '#ffa07c']), bush(2, ['#8a3a44', '#c94a4e', '#ffc2a0'], '#ffd35a')], mosswood: [bush(3, ['#245a3a', '#3f8a55', '#8bd27b']), bush(4, ['#245a3a', '#3f8a55', '#b2e38a'], '#e2483b')], willowmere: [bush(5, ['#477d70', '#80b99a', '#d2f2d2']), bush(6, ['#477d70', '#6aa58a', '#b4e6c2'], '#f4a0c0')], thorn: [bush(7, ['#2a1c1c', '#5a2424', '#8a4a3a'], '#c93a2a')], fen: [bush(8, ['#33482c', '#4f6b3a', '#93a85a'])], scoria: [bush(9, ['#7a3222', '#a3482e', '#f0b070'])], reach: [bush(10, ['#62a9bc', '#8fd0d8', '#ffffff'])], ash: [bush(11, ['#5a5464', '#726c7c', '#b8b2c0'])], dunes: [bush(12, ['#6a5a34', '#8f9a4a', '#e0d28a'])] };
  const boulder = (seed, w, h, p) => art(w, h, px => { for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) { const u = (X - (w - 1) / 2) / (w / 2), top = h * (1 - pow(max(0, 1 - u * u), .45) * (.86 + .14 * sin(X * .9 + seed))); if (Y < top) continue; const n = hh(X >> 1, Y >> 1, seed); px(X, Y, Y < top + 2 ? p[2] : X > w * .68 || Y > h - 3 ? p[3] : n > .62 ? p[1] : p[0]); } });
  WILD.boulder = { stone: [boulder(1, 20, 13, PALS.basalt), boulder(2, 30, 18, PALS.basalt)], clay: [boulder(3, 22, 14, PALS.clay), boulder(4, 14, 9, PALS.clay)], rust: [boulder(5, 24, 15, PALS.rust), boulder(6, 15, 10, PALS.rust)], glass: [boulder(7, 20, 14, PALS.glass), boulder(8, 28, 17, PALS.glass)], ash: [boulder(9, 22, 13, PALS.ash)], moss: [boulder(10, 24, 14, ['#3a5a4a', '#4a6a5a', '#8bd27b', '#24402f'])] };
  WILD.log = [art(30, 8, px => { for (let X = 0; X < 30; X++) for (let Y = 1; Y < 8; Y++) px(X, Y, Y === 1 ? '#6f97a4' : Y > 5 ? '#1f3d44' : hh(X >> 2, Y, 3) > .6 ? '#3a6f76' : '#2c575e'); for (let Y = 1; Y < 8; Y++) px(29, Y, '#c9b48a'); for (const X of [4, 5, 6, 14, 15, 22]) px(X, 0, '#8bd27b'); for (const X of [4, 5, 15]) px(X, 1, '#3f8a55'); })];
  WILD.stump = [art(12, 8, px => { for (let X = 1; X < 11; X++) for (let Y = 2; Y < 8; Y++) px(X, Y, X < 3 ? '#3a6f76' : X > 8 ? '#142a30' : '#2c575e'); for (let X = 1; X < 11; X++) px(X, 1, X % 3 ? '#c9b48a' : '#8a7a5a'); px(0, 7, '#2c575e'); px(11, 7, '#142a30'); })];
  const cactus = (seed, h) => art(13, h, px => { const R = mulberry32(seed); for (let Y = 1; Y < h; Y++) { px(5, Y, '#3f6a3a'); px(6, Y, '#5f8f4a'); px(7, Y, '#33562f'); if (Y % 3 === 0) px(6, Y, '#e0d28a'); } const a = 4 + (R() * 4 | 0), b = a + 3; for (let X = 2; X < 5; X++) px(X, b, '#3f6a3a'); for (let Y = a; Y < b; Y++) { px(1, Y, '#3f6a3a'); px(2, Y, '#5f8f4a'); } for (let X = 8; X < 11; X++) px(X, b + 3, '#33562f'); for (let Y = a + 2; Y < b + 3; Y++) { px(10, Y, '#5f8f4a'); px(11, Y, '#33562f'); } px(6, 0, '#f4a0c0'); });
  WILD.cactus = [cactus(1, 18), cactus(2, 24), cactus(3, 14)];
  WILD.reeds = [1, 2].map(s => art(18, 16, px => { const R = mulberry32(s); for (let k = 0; k < 9; k++) { let X = 1 + k * 2, h = 8 + R() * 8; for (let i = 0; i < h; i++) px(X + (i > h * .6 ? (k & 1 ? .6 : -.6) : 0), 15 - i, i > h - 4 && k % 3 === 0 ? '#7a4a2a' : i % 3 ? '#4f6b3a' : '#7a8f4a'); } }));
  WILD.ribs = [art(26, 14, px => { for (let k = 0; k < 5; k++) { const bx = 3 + k * 5; for (let i = 0; i < 12; i++) { const X = bx + sin(i / 12 * PI * .8) * 4, Y = 13 - i; px(X, Y, i > 8 ? '#f4ead8' : '#d6c8ae'); px(X + 1, Y, '#bba888'); } } for (let X = 1; X < 25; X++) if (X % 5) px(X, 13, '#bba888'); })];
  WILD.spike = [1, 2].map(s => art(14, 22, px => { const R = mulberry32(s + 20); for (const [cx, h, w] of [[4, 12 + R() * 4, 3], [9, 18 + R() * 4, 4], [12, 8, 2]]) for (let i = 0; i < h; i++) { const hw = w * (1 - i / h); for (let k = -hw; k <= hw; k++) px(cx + k, 21 - i, k < -hw * .2 ? '#ffffff' : k < hw * .4 ? '#b4e6e8' : '#62a9bc'); } }));
  WILD.shroom = [1, 2].map(s => art(16, 12, px => { const R = mulberry32(s + 40); for (const [cx, h, r] of [[4, 6, 3], [10, 10, 4], [14, 4, 2]]) { for (let i = 0; i < h - 2; i++) { px(cx, 11 - i, '#e0d2c0'); px(cx + 1, 11 - i, '#a08a78'); } for (let k = -r; k <= r; k++) { px(cx + k, 11 - h + 2, '#8a3a6a'); if (abs(k) < r) px(cx + k, 11 - h + 1, '#c96aa0'); if (abs(k) < r - 1) px(cx + k, 11 - h, '#f0b0d8'); } } }));
}
// where a crown's leaves begin and end, column by column (rain strikes the top edge, drips off the bottom, snow lies along the top)
const CROWN_INFO = new Map();
function crownInfo(kind, v) {
  const key = kind * 4 + v; let o = CROWN_INFO.get(key); if (o) return o;
  const cv = SPR.top[kind][v].cv, W = cv.width, H = cv.height, [, x] = mk(W, H, { willReadFrequently: true }); x.drawImage(cv, 0, 0);
  const d = x.getImageData(0, 0, W, H).data, top = [], bot = []; const [sc, sx] = mk(W, H); sx.fillStyle = '#ffffff';
  for (let X = 0; X < W; X++) { let a = -1, b = -1; for (let Y = 0; Y < H; Y++) if (d[(Y * W + X) * 4 + 3] > 100) { if (a < 0) a = Y; b = Y; } if (a >= 0) { top.push([X, a]); if (abs(X - 23) > 2) bot.push([X, b]); sx.fillStyle = '#ffffff'; sx.fillRect(X, a, 1, 2); if (hh(X, a, 3) > .5) { sx.fillStyle = '#dcf7f5'; sx.fillRect(X, a + 2, 1, 1); } } }
  o = { top, bot, snow: sc }; CROWN_INFO.set(key, o); return o;
}
// how far a crown leans at height y of its picture (0 top, 31 where it meets the trunk)
function crownSway(tr, y) { const w = G.wxWind || 0, aw = abs(w), k = pow(clamp((31 - y) / 31, 0, 1), 1.25); return sin(G.time * .02 + tr.ph) * 1.3 * (.35 + .65 * k) + (aw > .04 ? k * (w * 7 + aw * (2.6 * sin(G.time * .085 + tr.ph) + 1.5 * sin(G.time * .23 + tr.ph * 3.1))) : 0); }
function drawCrown(w, tx, tr) {
  const cv = SPR.top[tr.kind][tr.v].cv, X = tx * T + 4 - 23, Y = tr.y * T + 1 - 31, aw = abs(G.wxWind || 0), snow = G.wx && G.wx.snow > .06 && biomeAt(tx) === 'reach' ? crownInfo(tr.kind, tr.v).snow : null;
  if (aw < .12) { const sw = round(crownSway(tr, 6)); w.drawImage(cv, X + sw, Y); if (snow) { w.globalAlpha = min(1, G.wx.snow * 1.2); w.drawImage(snow, X + sw, Y); w.globalAlpha = 1; } return; }
  // in a wind the crown bends: drawn in bands, each leaning a little farther than the one below
  for (let y = 0; y < 32; y += 4) { const sw = round(crownSway(tr, y + 2)); w.drawImage(cv, 0, y, 46, 4, X + sw, Y + y, 46, 4); if (snow) { w.globalAlpha = min(1, G.wx.snow * 1.2); w.drawImage(snow, 0, y, 46, 4, X + sw, Y + y, 46, 4); w.globalAlpha = 1; } }
}
