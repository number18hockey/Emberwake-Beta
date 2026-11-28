// ============================================================
//  VARIED LANDS: what a world made since land 6 does differently (LAND6(), 3-endless.js). Older worlds keep every
//  hill, tree and tuft where it was.
//    green     the mild lands are green: the moor, the Mosswood and the Willowmere grow green turf and grass, the
//              thornweald and the fens an olive one. The cold glass of the Reach and the hot lands are rarer
//              (bioOf5 and bweights5 take their edges from T_COLD and T_HOT), so the mild middle is most of the world
//    a fourth face   every land has a face it never had: THE GREENWOOD, THE DEEPWOOD, THE WILLOW TANGLE, THE BLACKTHORN
//              THICKET (trees shoulder to shoulder: M.dense), THE FROST FOREST (a forest in the glass), THE DROWNED
//              WOOD, THE CACTUS FLATS (cactus and not one tree), THE RUST GROVE and THE CINDER WOOD (moodAt)
//    the story's places   the Warden's crater, the mirror, the mine, the forge and the gate, the old watch with the Waker's
//              Blade, the broken spire and the sky altar are laid out by the seed: sides and distances change from
//              world to world (storyLayout6)
//    sky islands   a sky shrine, a nest, a cache of sky-glass weapons, a glider left behind, a glass garden, or bare
//              rock and wind (skyFeature)
// ============================================================
// the edges of the cold and hot lands (t is the climate's warmth, 0 to 1)
// (the old worlds' edges are written out as they always were, so not one of their hills moves)
const T_COLD = () => LAND6() ? .24 : .34, T_HOT = () => LAND6() ? .76 : .66;
// ---------------- warmth, in stretches ----------------
// The old worlds' warmth is one slow wave of noise, so a cold stretch of the Reach could run for thousands of paces and the
// glass came round as often as the green. A world made since land 6 deals its warmth out in stretches of WARM_W columns:
// about one in eight cold, one in six hot, the rest mild (from a little cool to a little warm). Each blends into the next
// over a long rise, so a cold stretch is about as wide as the Reach always was; it just comes round less often.
const WARM_W = 1500;
// (a LONG WINTER deals far more cold stretches, and SCORCHED more hot ones, before their warmth shifts the whole land too)
const warmOf = q => { const r = hh(q, 7711, SEED), cP = WT_ON && WT.frozen ? .3 : .12, hP = WT_ON && WT.scorched ? .32 : .16; return r < cP ? .13 : r > 1 - hP ? .87 : .4 + hh(q, 7712, SEED) * .2; };
function warmth6(x) {
  const q0 = floor(x / WARM_W); let s = 0, ws = 0;
  for (let q = q0 - 1; q <= q0 + 1; q++) { const d = abs(x - (q + .5) * WARM_W) / WARM_W, w = d < 1 ? (1 - d) ** 3 : 0; s += warmOf(q) * w; ws += w; }
  return s / ws + (fbm(x * .004, 19.9, 2) - .5) * .06;   // (and a little ripple, so no edge runs like a ruler)
}
// ---------------- green turf ----------------
const FELT_E = [...FELT, '#ffc2a0'], FELT_G = ['#b8e88a', '#6fb04e', '#3f7a3a', '#e0ffc0'], FELT_O = ['#d8d890', '#98a858', '#5a6a38', '#f0f0c0'];
function feltAt(tx) {
  if (!LAND6() || DIM || WORLD.arena) return FELT_E; const b = biomeE(tx);
  if (b === 'moor' && moodAt(tx) === 1) return FELT_E;   // (the burnt moor keeps its embers)
  return b === 'moor' || b === 'mosswood' || b === 'willowmere' ? FELT_G : b === 'thorn' || b === 'fen' ? FELT_O : FELT_E;
}
const grassTex = (pal, hi) => genTex((px, py, v) => { const hgt = hh(px, v, 161) > .35 ? 1 + ((hh(px, v, 162) * 4) | 0) : 0; return py >= 8 - hgt ? (py === 8 - hgt ? hi : pal) : null; });
const TEX_TALLG = grassTex('#5aa04a', '#b8e88a'), TEX_TALLO = grassTex('#8a9a4a', '#d8d890');
// the tall grass's picture where the turf is green
function decorTex(t, tx) { if (t !== TALLGRASS) return TEX[t]; const F = feltAt(tx); return F === FELT_G ? TEX_TALLG : F === FELT_O ? TEX_TALLO : TEX[t]; }
// ---------------- a fourth face for every land ----------------
const MOOD3 = {
  moor: { n: 'THE GREENWOOD', sub: 'trees shoulder to shoulder', dense: 1, tree: 2.2, th: 1.2, berry: 1.3, grass: 1.1, mobs: [['wildpig', 4, 0, 1], ['ashhare', 2], ['willowhen', 2, 0, 1], ['mote', 2], ['husk', 2, 1]], tint: [120, 220, 120, .06] },
  mosswood: { n: 'THE DEEPWOOD', sub: 'oaks so close the light comes down green', dense: 1, tree: 2.6, th: 1.4, glow: .04, mobs: [['mossdeer', 4, 0, 1], ['wildpig', 3, 0, 1], ['adder', 1], ['bat', 2, 1], ['husk', 2, 1]], tint: [90, 200, 110, .09] },
  willowmere: { n: 'THE WILLOW TANGLE', sub: 'a willow rooted in every pool', dense: 1, tree: 2.2, reed: 1.2, mobs: [['willowhen', 4, 0, 1], ['mossdeer', 2, 0, 1], ['mote', 2], ['husk', 1, 1]], tint: [150, 210, 170, .06] },
  thorn: { n: 'THE BLACKTHORN THICKET', sub: 'bramble on bramble on bramble', dense: 1, tree: 2.4, th: 1.1, berry: 2, mobs: [['thornback', 4], ['adder', 3], ['wildpig', 2, 0, 1], ['husk', 2, 1]], tint: [120, 160, 90, .07] },
  reach: { n: 'THE FROST FOREST', sub: 'glass trees as close as a crowd', dense: 1, tree: 2.6, th: 1.3, crystal: 1.4, mobs: [['mite', 3], ['glassfly', 2], ['ashhare', 1], ['husk', 1, 1]], tint: [150, 230, 255, .07] },
  fen: { n: 'THE DROWNED WOOD', sub: 'dead trunks standing in black water', dense: 1, tree: 2.2, kind: 2, reed: .8, glow: .05, mobs: [['adder', 2], ['bat', 3], ['husk', 2], ['mote', 2], ['lurker', 0]], tint: [90, 110, 100, .08] },
  dunes: { n: 'THE CACTUS FLATS', sub: 'cactus as far as you can see, and not one tree', tree: 0, cactus: 1, bones: .5, bush: .5, mobs: [['adder', 4], ['ashhare', 2], ['serpent', 1], ['husk', 1, 1]], tint: [255, 230, 170, .06] },
  scoria: { n: 'THE RUST GROVE', sub: 'iron trees, packed tight', dense: 1, tree: 3, kind: 2, mobs: [['rustback', 4], ['mote', 2], ['husk', 1, 1]], tint: [255, 150, 90, .07] },
  ash: { n: 'THE CINDER WOOD', sub: 'black trunks, still smoking', dense: 1, tree: 3, kind: 2, bush: 1, mobs: [['husk', 4], ['cinderling', 2], ['mote', 2]], tint: [200, 120, 90, .08] }
};
for (const b in MOOD3) if (MOODS[b]) MOODS[b][3] = MOOD3[b];
// ---------------- the story's places, laid out by the seed ----------------
// (returns the side the Warden's crater is on: the two new lands' stretches are set past the places on the far sides)
function storyLayout6() {
  const R = k => hh(k, 7301, SEED), side = k => R(k) < .5 ? 1 : -1, far = (x, L, d) => L.every(q => abs(x - q) >= d), sW = side(1);
  SHRINE_X = X0 + sW * (340 + floor(R(2) * 300));
  SHRINE2_X = X0 - sW * (440 + floor(R(3) * 380));
  MINE_X = SHRINE_X + sW * (360 + floor(R(4) * 280)); FORGE_X = MINE_X + sW * 160; GATE_X = MINE_X + sW * 320;
  // the old watch with the Waker's Blade, the broken spire and the sky altar: either side, near or far, never on another place
  let bS = side(5), bD = 140 + floor(R(6) * 260); for (let n = 0; n < 8 && !far(X0 + bS * bD, [SHRINE_X, SHRINE2_X, MINE_X, FORGE_X, GATE_X], 120); n++) { if (n % 2) bD += 70; else bS = -bS; }
  BLADE_X = X0 + bS * bD;
  let pS = -bS, pD = 120 + floor(R(7) * 220); for (let n = 0; n < 8 && !far(X0 + pS * pD, [SHRINE_X, SHRINE2_X, MINE_X, FORGE_X, GATE_X, BLADE_X], 90); n++) { if (n % 2) pD += 60; else pS = -pS; }
  SPIRE_X = X0 + pS * pD;
  let kS = side(8), kD = 210 + floor(R(9) * 260); for (let n = 0; n < 8 && !far(X0 + kS * kD, [SHRINE_X, SHRINE2_X, MINE_X, GATE_X], 200); n++) { if (n % 2) kD += 80; else kS = -kS; }
  SKY_X = X0 + kS * kD;
  return sW;
}
// ---------------- sky islands ----------------
Object.assign(LOOT_T, {
  skynest: [['feather', .9, 2, 5], ['skysilk', .7, 1, 3], ['egg', .5, 1, 2], ['membrane', .4, 1, 2], ['glider', .08, 1, 1]],
  skyarms: [['glass_sabre', .3, 1, 1], ['glass_spear', .3, 1, 1], ['glass_longbow', .2, 1, 1], ['glass_daggers', .25, 1, 1], ['glass_nunchaku', .2, 1, 1], ['skyglass', .6, 1, 3], ['arrow', .5, 6, 12]],
  skyglide: [['glider', 1, 1, 1], ['skysilk', .8, 2, 4], ['rope', .5, 1, 2]]
});
// a sky cache always holds one weapon of sky glass (which one, the seed says), and a few things beside it
const SKY_ARMS = ['glass_sabre', 'glass_spear', 'glass_longbow', 'glass_daggers', 'glass_nunchaku'];
SKY_ARMS.forEach((id, k) => { LOOT_T['skyarms' + k] = [[id, 1, 1, 1], ['skyglass', .6, 1, 3], ['arrow', id === 'glass_longbow' ? 1 : .3, 6, 12], ['skysilk', .4, 1, 2]]; });
const skyIsleTop = (x, cy) => { for (let y = cy - 7; y < cy + 6; y++) if (tileAt(x, y) === SNOW) return y; return -1; };
function skyFeature(icx, icy, a, k) {
  const r = hh(k, 911, SEED), top = skyIsleTop(icx, icy); if (top < 8) return;
  const put = (x, y, t) => { if (tileAt(x, y) === AIR) tiles[y * WW + x] = t; };
  if (r < .22) { if (a >= 7) withRng(hh(icx, 1450, SEED) * 4294967296, () => skyhouse(icx)); return; }
  if (r < .38) { chestAt(icx, top - 1, 'skynest'); for (const dx of [-2, -1, 1, 2]) put(icx + dx, top - 1, STICKS); mark('sn' + icx, 'A SKY NEST', 'something big nests up here', icx, top - 3, 6); small(); return; }
  if (r < .5) { chestAt(icx, top - 1, 'skyarms' + floor(hh(k, 915, SEED) * SKY_ARMS.length)); for (const dx of [-2, 2]) for (let j = 1; j <= 2; j++) put(icx + dx, top - j, CUTSTONE); mark('sa' + icx, 'A SKY CACHE', 'weapons left where no one walks', icx, top - 4, 6); small(); return; }
  if (r < .6) { chestAt(icx, top - 1, 'skyglide'); put(icx - 2, top - 1, BEAM); put(icx - 2, top - 2, BEAM); return; }
  if (r < .78) { for (let dx = -a + 1; dx <= a - 1; dx++) { const t = skyIsleTop(icx + dx, icy); if (t > 0 && hh(icx + dx, t, 913) < .45) put(icx + dx, t - 1, hh(icx + dx, t, 914) < .7 ? CRYSTAL : MINT); } return; }
  // (and the rest are bare: wind, and a long way down)
}
