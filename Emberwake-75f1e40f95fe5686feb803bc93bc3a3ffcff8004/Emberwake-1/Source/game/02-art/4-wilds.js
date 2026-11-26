// ============================================================
//  The wilds: more kinds of tree.
//  Tree crowns are kinds 4 to 9 (0 to 3 are the older lantern, frost,
//  rust and thorn stalks); any crown can stand on any trunk, and is
//  drawn, lit and felled exactly as a stalk's own top is.
//  Oaks and willows grow in the Mosswood and the Willowmere (see
//  crownFor in 03-world/3-endless.js); no older land grows a crown.
// ============================================================
const CROWN = { oak: 4, willow: 5, mangrove: 6, palm: 7, pine: 8, maple: 9 };
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
}
