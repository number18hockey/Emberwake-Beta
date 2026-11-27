// ============================================================
//  The island of the Wilds: 3500 paces of it, nine kinds of land run
//  into one another, with lakes, woods, named places and sky-isles
//  above, and below them caves that go down and down until the rock
//  turns to fire. Everything comes from the match's seed, so every
//  computer raises the same island.
// ============================================================
// 3500 paces x 8 game units = 28000 game units. 3750 paces brings the horizontal
// field to exactly 30000 game units while preserving the proven vertical/depth model.
const WBRW = 3750, WBRH = 286, BR_GROUND = 92, BR_HOT = 238, BR_LAVA = 264;
const WBR_MAP_UNITS = WBRW * 8;
const BR_STRUCTURE_TYPES = ['fortress', 'bunker', 'village', 'temple', 'outpost'];
const WBR_BIOMES = ['moor', 'mosswood', 'willowmere', 'thorn', 'fen', 'dunes', 'scoria', 'reach', 'ash'];
const WBR_SURF = { moor: [GRASS, DIRT], mosswood: [GRASS, DIRT], willowmere: [GRASS, MUD], thorn: [GRASS, DIRT], fen: [MUD, PEAT], dunes: [SAND, SANDSTONE], scoria: [SAND, SANDSTONE], reach: [SNOW, STONE], ash: [ASH, STONE] };
const WBR_WALL = { moor: W_DIRT, mosswood: W_DIRT, willowmere: W_DIRT, thorn: W_DIRT, fen: W_DIRT, dunes: W_SAND, scoria: W_SAND, reach: W_STONE, ash: W_ASH };
const WBR_PNAMES = {
  moor: ['HEARTHWICK', 'MILLSTEAD', 'LANTERN GREEN'], mosswood: ['THE HANGING WALK', 'OAKMANTLE', 'MOSSFALL'], willowmere: ['REEDWATER', 'THE LONG JETTY', 'MERESIDE'], thorn: ['THORNWOOD', 'BRAMBLE CAMP', 'THE TANGLE'], fen: ['STILT HOLLOW', 'MIREWATCH', 'PEATEND'],
  dunes: ['SUNKEN SPIRE', 'DUSTWATCH', 'THE DRY BELL'], scoria: ['RUSTFALL QUARRY', 'REDCUT', 'THE OLD DIG'], reach: ['COLDGLASS KEEP', 'FROSTGATE', 'STILLWATCH'], ash: ['CINDER WORKS', 'SLAG HOLLOW', 'THE KILNS']
};
const BR_MAPCOL = { moor: '#4f7a3a', mosswood: '#2f6a3a', willowmere: '#5f9a8a', thorn: '#5a5a32', fen: '#5a5a42', dunes: '#c9a46a', scoria: '#a3583a', reach: '#d8e6ee', ash: '#6a6070' };

// ---------------- which land is where ----------------
const wBrBio = x => WBR_BIOMES[BR.bio ? BR.bio[clamp(floor(x), 0, WBRW - 1)] : 0] || 'moor';
function brSegWeights(x, soft) { const out = []; let tot = 0; for (let i = 0; i < BR.segs.length; i++) { const w = smooth((x - BR.segX[i]) / soft + .5) * smooth((BR.segX[i + 1] - x) / soft + .5); if (w > .002) { out.push([BR.segs[i], w]); tot += w; } } for (const e of out) e[1] /= tot || 1; return out; }
function wBrRegionMix(x) {
  const BG = { moor: 'moor', mosswood: 'moor', willowmere: 'moor', thorn: 'moor', fen: 'moor', dunes: 'scoria', scoria: 'scoria', reach: 'reach', ash: 'ash' }, acc = { reach: 0, moor: 0, ash: 0, scoria: 0 };
  for (const [b, w] of brSegWeights(x, 130)) acc[BG[b]] += w; return Object.entries(acc).filter(e => e[1] > .02);
}
function brDealLands() {
  const deal = a => { for (let i = a.length - 1; i > 0; i--) { const j = randi(0, i), q = a[i]; a[i] = a[j]; a[j] = q; } return a; };
  let seq; for (let tries = 0; tries < 60; tries++) { seq = deal(WBR_BIOMES.concat(deal(['moor', 'mosswood', 'thorn', 'willowmere', 'dunes', 'reach']).slice(0, 3))); let ok = true; for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1]) ok = false; if (ok) break; }
  const ws = seq.map(() => rand(.75, 1.25)), tot = ws.reduce((a, b) => a + b, 0); let x = 0; BR.segs = seq; BR.segX = [0]; for (const w of ws) { x += w / tot * WBRW; BR.segX.push(round(x)); } BR.segX[seq.length] = WBRW;
  BR.bio = new Uint8Array(WBRW); for (let i = 0; i < seq.length; i++) for (let q = BR.segX[i]; q < BR.segX[i + 1]; q++) BR.bio[q] = WBR_BIOMES.indexOf(seq[i]);
}
// a smooth field worked out on a coarse grid and filled in between: the caves need half a dozen of these over a million tiles
function brField(step, fn) {
  const nx = ceil(WBRW / step) + 2, ny = ceil(WBRH / step) + 2, a = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) a[j * nx + i] = fn(i * step, j * step);
  return (x, y) => { const fx = x / step, fy = y / step, i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, k = j * nx + i, t = a[k] + (a[k + 1] - a[k]) * u, b = a[k + nx] + (a[k + nx + 1] - a[k + nx]) * u; return t + (b - t) * v; };
}

// ---------------- small builders ----------------
function wBrFlat(x0, x1, gy, b) {
  for (let x = x0; x <= x1; x++) {
    if (!inW(x, gy) || x < 4 || x > WBRW - 5) continue; const [top, sub] = WBR_SURF[b || wBrBio(x)], old = heights[x];
    for (let y = max(0, gy - 70); y < gy; y++) { const i = y * WW + x; if (tiles[i] !== BEDROCK) { tiles[i] = AIR; walls[i] = 0; } }
    for (let y = gy; y < max(gy + 8, old + 3); y++) { const i = y * WW + x; tiles[i] = y === gy ? top : y < gy + 7 ? sub : STONE; if (y > gy + 1) walls[i] = y < gy + 12 ? WBR_WALL[wBrBio(x)] : W_STONE; }
    heights[x] = gy; treeTops.delete(x);
  }
}
// a ramp of earth so the ground beside a flattened place stays walkable
function wBrEase(x, dir, gy) { for (let k = 1; k < 34; k++) { const xx = x + dir * k; if (xx < 5 || xx > WBRW - 6) return; const want = gy + sign(heights[xx] - gy) * min(abs(heights[xx] - gy), k * 2); if (want === heights[xx]) return; wBrFlat(xx, xx, want); } }
function wBrChest(x, y, rare, o = {}) {
  if (!inW(x, y) || tiles[y * WW + x] !== AIR && !(TP[tiles[y * WW + x]].decor && !TP[tiles[y * WW + x]].dyn) || !TP[tileAt(x, y + 1)].solid && tileAt(x, y + 1) !== PLATFORM) return null;
  for (const c of BR.chests) if (abs(c.x - x) < 4 && abs(c.y - y) < 4) return null;
  tiles[y * WW + x] = AIR;
  const c = { i: BR.chests.length, x, y, rare: !!rare, cave: !!o.cave, high: !!o.high, crown: !!o.crown, feast: !!o.feast, structure: o.structure || '', open: false, t: 0 }; BR.chests.push(c); return c;
}
// the island's own crowns: mangroves in the fen, pines on the reach, maples on the scoria, palms on the dunes (the open world grows only oak and willow)
const wCrownFor = (b, kind, r) => b === 'mosswood' ? (r < .72 ? CROWN.oak : kind) : b === 'willowmere' ? (r < .75 ? CROWN.willow : kind) : b === 'fen' ? (r < .7 ? CROWN.mangrove : kind) : b === 'reach' ? (r < .42 ? CROWN.pine : kind) : b === 'scoria' ? (r < .55 ? CROWN.maple : kind) : b === 'dunes' ? CROWN.palm : kind;
const BR_TREE = { moor: [0, .42], mosswood: [0, .8], willowmere: [0, .34], thorn: [3, .62], fen: [0, .36], dunes: [2, .16], scoria: [2, .3], reach: [1, .46], ash: [2, .16] };
function wBrTree(x, gy, b, tall = 0) {
  const kind = BR_TREE[b][0], th = (b === 'mosswood' ? 8 + randi(0, 8) : kind === 0 ? 6 + randi(0, 8) : kind === 1 ? 5 + randi(0, 6) : 5 + randi(0, 4)) + tall;
  for (let y = 1; y <= th + 4; y++) { const t = tileAt(x, gy - y); if (t !== AIR && !(TP[t].decor && !TP[t].dyn)) return false; } if (!TP[tileAt(x, gy)].solid || tileAt(x - 1, gy) === AIR || tileAt(x + 1, gy) === AIR) return false;
  for (let y = 1; y <= th; y++) tiles[(gy - y) * WW + x] = [TRUNK, TRUNK2, TRUNK3, TRUNK4][kind];
  treeTops.set(x, { y: gy - th, kind: wCrownFor(b, kind, rand()), v: randi(0, 2), ph: rand(TAU) }); return true;
}
// benches and fires on level ground near cx, as many of the list as will fit side by side
function brStations(cx, list, starts = [23, -23, 19, -19, 15, -15, 11, -11, 7, -7, 3, -3, 27, -27]) {
  for (const start of starts) {
    const dir = start < 0 ? -1 : 1, spots = []; let clear = true;
    for (let k = 0; k < list.length; k++) {
      const x = cx + start + dir * k * 2; if (x < 5 || x > WBRW - 6) { clear = false; break; } const y = heights[x] - 1, i = y * WW + x;
      if (tiles[i] !== AIR && !(TP[tiles[i]].decor && !TP[tiles[i]].dyn) || !TP[tiles[i + WW]].solid || tiles[i - WW] !== AIR || BR.chests.some(c => abs(c.x - x) < 2 && abs(c.y - y) < 3)) { clear = false; break; } spots.push([x, y]);
    }
    if (clear) { spots.forEach(([x, y], i) => dyn(x, y, list[i])); return true; }
  }
  return false;
}
function brDig(cx, cy, rx, ry, wall, rough = .3) {
  for (let y = floor(cy - ry); y <= cy + ry; y++) for (let x = floor(cx - rx); x <= cx + rx; x++) { if (x < 6 || x > WBRW - 7 || y < 4 || y > WBRH - 6) continue; const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d > 1 - rough * hh(x >> 1, y >> 1, SEED + 5)) continue; const i = y * WW + x; if (tiles[i] === BEDROCK) continue; if (TP[tiles[i]].dyn) continue; tiles[i] = AIR; if (wall) walls[i] = wall; }
}
// where the floor is under (x, y)
function brFloor(x, y, lim = 40) { let k = 0; while (k++ < lim && y < WBRH - 4 && !TP[tileAt(x, y + 1)].solid && !platAt(x, y + 1)) y++; return y; }

// ---------------- the land itself ----------------
function wGenRoyale(seed) {
  buildWildProps(); SEED = seed >>> 0; rng = mulberry32(SEED); DIM = 0; resetWorld(WBRW, WBRH); WORLD.arena = true; WORLD.royale = true; WORLD.endless = 0; BR.wildLand = true;
  SPAWN_X = WBRW >> 1; SHRINE_X = SHRINE2_X = MINE_X = FORGE_X = GATE_X = SKY_X = BLADE_X = SPIRE_X = REACH_X = RUST_X = -100000; SHRINE_Y = SHRINE2_Y = GATE_Y = MINE_Y = FORGE_Y = SKY_Y = 0;
  BASE_Y = BR_GROUND; DEEP_Y = 9999; DRIFT_Y = -99; VIL_Y = -999; brDealLands();
  BR.chests = []; BR.pois = []; BR.caves = []; BR.nests = []; BR.lakes = []; BR.structures = [];
  // the lie of the land: each land's own shape, melting into the next; cliffs at the world's two ends
  const raw = new Float32Array(WBRW);
  for (let x = 0; x < WBRW; x++) { let s = 0; for (const [b, w] of brSegWeights(x, 110)) s += w * LFN[b](x) * (b === 'reach' ? .44 : b === 'scoria' ? .7 : .62); let h = BR_GROUND + (fbm(x * .0023, 3.3, 3) - .5) * 44 + s; const e = min(x, WBRW - 1 - x); if (e < 18) h -= (18 - e) * 3.2; raw[x] = h < 56 ? 56 - sqrt(56 - h) * 1.6 : min(h, 128); }
  for (let x = 0; x < WBRW; x++) { let s = 0, n = 0; for (let k = -2; k <= 2; k++) { const q = clamp(x + k, 0, WBRW - 1), w = 3 - abs(k); s += raw[q] * w; n += w; } heights[x] = round(s / n); }
  for (let pass = 0; pass < 5; pass++) { for (let x = 19; x < WBRW - 19; x++) { const b = wBrBio(x), m = b === 'reach' || b === 'scoria' ? 3 : 2, d = heights[x] - heights[x - 1]; if (abs(d) > m) heights[x] = heights[x - 1] + sign(d) * m; } for (let x = WBRW - 20; x > 18; x--) { const b = wBrBio(x), m = b === 'reach' || b === 'scoria' ? 3 : 2, d = heights[x] - heights[x + 1]; if (abs(d) > m) heights[x] = heights[x + 1] + sign(d) * m; } }
  // lakes: a bowl pressed into the land, full to its lower rim
  const wet = { willowmere: .95, fen: .85, moor: .4, mosswood: .4, thorn: .2, reach: .3 }, lakeAtX = new Int16Array(WBRW);
  for (let k = 0; k < WBRW / 130; k++) {
    const c = k * 130 + 30 + randi(0, 70), b = wBrBio(c); if (rand() > (wet[b] || 0) || abs(c - WBRW / 2) < 110) continue; const a = 12 + randi(0, b === 'willowmere' ? 18 : 10), D = 5 + randi(0, 5); if (c - a < 40 || c + a > WBRW - 40) continue;
    const lv = max(heights[c - a], heights[c + a]); if (abs(heights[c - a] - heights[c + a]) > 6) continue;
    for (let x = c - a; x <= c + a; x++) { const u = (x - c) / a; heights[x] = max(min(heights[x], lv + D), round(lv + D * (1 - u * u))); lakeAtX[x] = lv; } BR.lakes.push({ x: c, a, lv, ice: b === 'reach' });
  }
  // rock, soil and ore
  const strata = brField(4, (x, y) => fbm(x * .05, y * .06 + 9, 2)), oreA = brField(3, (x, y) => fbm(x * .085 + 1.1, y * .085 + 7.7, 2)), oreB = brField(3, (x, y) => fbm(x * .08 + 22.2, y * .08 + 5.5, 2)), oreC = brField(3, (x, y) => fbm(x * .075 + 44.4, y * .075 + 1.1, 2)), zone = brField(8, (x, y) => fbm(x * .0075, y * .013 + 44, 2));
  const worm1 = brField(3, (x, y) => fbm(x * .0195, y * .035 + 100, 2)), worm2 = brField(3, (x, y) => fbm(x * .0155 + 50, y * .029 + 300, 2)), hall = brField(4, (x, y) => fbm(x * .0115, y * .021 + 700, 3)), deepF = brField(4, (x, y) => fbm(x * .021, y * .05 + 900, 2));
  for (let x = 0; x < WBRW; x++) {
    const b = wBrBio(x), [top, sub] = WBR_SURF[b], gy = heights[x], soil = 4 + floor(hh(x >> 2, 7, SEED) * 3), lk = lakeAtX[x], edge = min(x, WBRW - 1 - x);
    for (let y = 0; y < WBRH; y++) {
      const i = y * WW + x, d = y - gy; if (y >= WBRH - 3 || edge < 2) { tiles[i] = y >= WBRH - 3 || d < 400 ? BEDROCK : AIR; continue; }
      if (d < 0) { if (lk && y >= lk) tiles[i] = b === 'reach' && y === lk ? SNOW : WATER; continue; }
      let t, w = 0; const st = strata(x, y), deep = y >= BR_HOT - 18 + (st - .5) * 26;
      if (d > 1) w = deep ? W_DEEP : d < 12 ? WBR_WALL[b] : W_STONE;
      if (deep) t = st > .63 ? DEEPGLOW : DEEPSTONE;
      else if (d === 0) t = lk ? (b === 'fen' || b === 'willowmere' ? MUD : b === 'reach' ? SNOW : CLAY) : top;
      else if (d < soil) t = lk ? CLAY : (b === 'thorn' && st > .6) || (b === 'moor' && st > .68) ? GRAVEL : (b === 'fen' && st > .55) ? CLAY : sub;
      else if ((b === 'dunes' || b === 'scoria') && d < 34) t = st > .52 ? SANDSTONE : SAND;
      else if (b === 'fen' && d < 14 && st > .5) t = CLAY;
      else t = d < 22 && st > .56 ? DIRT : st > .66 ? GRAVEL : st < .3 && d > 10 ? SANDSTONE : STONE;
      // ore lies in blobs, each at the depths it belongs to
      if (d > 3 && (t === STONE || t === DIRT || t === SANDSTONE || t === GRAVEL || t === DEEPSTONE)) {
        if (deep) { if (oreC(x, y) > .735) t = EMBER; else if (oreA(x, y) > .77) t = IRON; }
        else if (d > 4 && d < 92 && oreA(x, y) > .735) t = COPPER; else if (d > 7 && d < 100 && oreA(x, y) < .262) t = TIN; else if (d > 6 && oreB(x, y) > .725) t = COAL; else if (d > 30 && oreB(x, y) < .27) t = IRON;
        else if (d > 5 && d < 60 && oreC(x, y) > .75) t = b === 'dunes' ? SALT : b === 'fen' || b === 'willowmere' ? CLAY : GRAVEL; else if (d > 24 && oreC(x, y) < .25 && zone(x, y) < .42) t = GEODE;
      }
      // caves: two families of winding tunnel that thicken with depth, and halls where they meet
      if (d > 8 && edge > 12 && !(lk && d < 16) && t !== BEDROCK) {
        const dd = min(1, d / 120), wid = .0175 + .0085 * dd, hl = hall(x, y); let cave = abs(worm1(x, y) - .5) < wid || abs(worm2(x, y) - .5) < wid * .82 || hl > .672 - .03 * dd;
        // the molten deep: everything opens out
        if (y > BR_LAVA - 15) cave = cave || deepF(x, y) > .43 + max(0, (BR_LAVA - 4 - y)) * .012;
        if (cave) { t = y >= BR_LAVA ? CINDER : AIR; if (hl > .74 && d > 30) w = 0; }
      }
      tiles[i] = t; walls[i] = w;
    }
    SKYL[x] = gy + 3;
  }
  // ways down: sloping mouths and, here and there, a sinkhole with vines to climb
  for (let k = 0; k < WBRW / 96; k++) {
    let x = k * 96 + 24 + randi(0, 60); if (x < 40 || x > WBRW - 60 || lakeAtX[x] || abs(x - WBRW / 2) < 90) continue; let y = heights[x];
    if (rand() < .26) { const L = 26 + randi(0, 46), hw = 1 + randi(0, 1); let lastV = x + round((fbm(-2 * .09, k * 9.1, 2) - .5) * 9) - hw; for (let j = -2; j < L; j++) { const cx = x + round((fbm(j * .09, k * 9.1, 2) - .5) * 9); for (let o = -hw; o <= hw + 1; o++) { const i = (y + j) * WW + cx + o; if (inW(cx + o, y + j) && y + j < BR_HOT - 10 && tiles[i] !== BEDROCK && !TP[tiles[i]].liquid) tiles[i] = AIR; } for (let q = min(lastV, cx - hw); q <= max(lastV, cx - hw); q++) { const vi = (y + j) * WW + q; if (j > -1 && inW(q, y + j) && (tiles[vi] === AIR || j > 0 && y + j < BR_HOT - 10 && TP[tiles[vi]].full && tiles[vi] !== BEDROCK)) tiles[vi] = CREEPER; } lastV = cx - hw; } continue; }
    const dir = rand() < .5 ? -1 : 1, L = 34 + randi(0, 30); let fx = x, fy = y + 1, sl = .42; for (let j = 0; j < L; j++) { sl = clamp(sl + (rand() - .5) * .3, .15, .85); fx += dir; fy += sl; if (fx < 30 || fx > WBRW - 30) break; const r = 2 + (j > 8 ? rand() * 1.2 : .4); brDig(fx, fy, r + .8, r, 0, .1); }
  }
  brUnderPlaces(zone);
  // the named places, one in each land, and the Crown at the heart of it all
  const used = new Set();
  BR.segs.forEach((b, i) => {
    const w = BR.segX[i + 1] - BR.segX[i], cx0 = round((BR.segX[i] + BR.segX[i + 1]) / 2 + rand(-w * .16, w * .16)); let cx = cx0; for (let t = 0; t < 40 && (BR.lakes.some(l => abs(l.x - cx) < l.a + 32 && b !== 'willowmere') || abs(cx - WBRW / 2) < 84); t++) cx = cx0 + (t & 1 ? 1 : -1) * (t + 2) * 6;
    cx = clamp(cx, 60, WBRW - 60); const names = WBR_PNAMES[b], name = names.find(n => !used.has(n) && rand() < .6) || names.find(n => !used.has(n)) || names[0]; used.add(name); withRng(hh(cx, 2201, SEED) * 4294967296, () => wBrPOI(b, cx, name));
  });
  brCrown();
  // sky-isles with a shrine on each, a vent under every one
  for (let k = 0; k < 7; k++) {
    const cx = round((k + .5) * WBRW / 7 + rand(-120, 120)), cy = min(heights[clamp(cx, 0, WBRW - 1)], heights[clamp(cx - 14, 0, WBRW - 1)], heights[clamp(cx + 14, 0, WBRW - 1)]) - 34 - randi(0, 8), a = 11 + randi(0, 4); if (cy < 22) continue;
    if (island(cx, cy, a, 7, false)) { for (let y = cy - 11; y < cy; y++) for (let x = cx - 9; x <= cx + 9; x++) if (inW(x, y) && tiles[y * WW + x] !== BEDROCK) tiles[y * WW + x] = AIR; brSkyhouse(cx, cy, k % 2 === 0); const vx = cx + (rand() < .5 ? -1 : 1) * (a + 4); vent(vx, cy - 12); }
  }
  // watch platforms
  for (let k = 0; k < 9; k++) {
    const x = round((k + .5) * WBRW / 9 + rand(-120, 120)); let bad = false; for (let q = x - 2; q <= x + 14; q++) if (!inW(q, 5) || RESV[q] || lakeAtX[q]) bad = true; if (bad) continue; const gy = min(heights[x], heights[x + 12]), py = gy - 11;
    for (const px of [x, x + 12]) for (let y = py + 1; y < heights[px]; y++) if (!TP[tileAt(px, y)].solid) tiles[y * WW + px] = BEAM; for (let y = py; y < heights[x + 6]; y++) tiles[y * WW + x + 6] = LADDER;
    for (let q = x; q <= x + 12; q++) if (q !== x + 6) { tiles[py * WW + q] = PLATFORM; for (let y = py - 4; y < py; y++) if (TP[tiles[y * WW + q]].stalk) tiles[y * WW + q] = AIR; } if (k % 3 === 0) wBrChest(x + 3, py - 1, false, { high: true }); reserve(x - 1, x + 13, 1);
  }
  brWilds(lakeAtX);
  wBrDistributeStructures(lakeAtX);
  for (let x = 0; x < WBRW; x++) SKYL[x] = heights[x] + 3;
  for (const [x, tr] of [...treeTops]) if (!TP[tileAt(x, tr.y)].stalk) treeTops.delete(x);
  for (const q of PROPS) bucketAdd(PROPB, q); for (const q of FGP) bucketAdd(FGPB, q);
  MODS_ON = false; wBrMapArt();
}

// ---------------- the caves' own places ----------------
// each is made once or twice on the island, and no two islands deal them the same
function brUnderPlaces(zone) {
  const spots = [], far = (x, y, d) => spots.every(s => abs(s.x - x) > d || abs(s.y - y) > 26);
  const put = (kind, name, dMin, dMax, rx, ry, fn) => {
    for (let t = 0; t < 60; t++) { const x = randi(90, WBRW - 90), y = heights[x] + randi(dMin, dMax); if (y + ry > BR_HOT - 6 && kind !== 'brink') continue; if (!far(x, y, 130)) continue; spots.push({ x, y }); BR.caves.push({ x, y, kind, name, r: rx }); withRng(hh(x, y, SEED) * 4294967296, () => fn(x, y)); return true; } return false;
  };
  // a forge someone left burning: the only anvils below ground
  const forge = (x, y) => { brDig(x, y, 19, 8, W_STONE, .2); const fy = brFloorFlat(x - 13, x + 13, y + 6, DEEPSTONE); dyn(x - 9, fy, BLOOMERY); dyn(x - 5, fy, FURNACE); dyn(x - 1, fy, ANVIL); dyn(x + 4, fy, BENCH); dyn(x + 8, fy, FIRE); for (const ox of [-12, 12]) { let ty = y - 3; dyn(x + ox, ty, TORCH); } wBrChest(x + 11, fy, false, { cave: true }); };
  for (let k = 0; k < 4; k++) put('forge', 'THE HOLLOW FORGE', 34, 100, 19, 8, forge);
  for (let k = 0; k < 3; k++) put('lake', 'THE UNDERLAKE', 40, 110, 34, 11, (x, y) => { brDig(x, y, 34, 11, 0, .14); for (let yy = y + 3; yy <= y + 13; yy++) for (let xx = x - 36; xx <= x + 36; xx++) { const i = yy * WW + xx; if (inW(xx, yy) && tiles[i] === AIR && ((xx - x) / 36) ** 2 + ((yy - y) / 13) ** 2 < 1) tiles[i] = WATER; } for (let ox = -6; ox <= 6; ox++) for (let oy = 2 + (abs(ox) >> 1); oy < 12; oy++) if (inW(x + ox, y + oy)) tiles[(y + oy) * WW + x + ox] = oy < 4 ? MUD : CLAY; tiles[(y + 1) * WW + x - 3] = GLOWCAP; wBrChest(x + 1, y + 1, true, { cave: true }); BR.nests.push({ x, y: y + 2, mobs: ['puddling', 'bat', 'bat'] }); });
  for (let k = 0; k < 3; k++) put('bones', 'THE BONE CATHEDRAL', 46, 120, 15, 18, (x, y) => { brDig(x, y, 15, 18, W_STONE, .16); for (let ox = -12; ox <= 12; ox += 4) { const fy = brFloor(x + ox, y); if (tileAt(x + ox, fy) === AIR) tiles[fy * WW + x + ox] = BONES; propC(WILD.ribs[0], x + ox, fy + 1, { lit: 1 }); } wBrChest(x, brFloor(x, y), true, { cave: true }); BR.nests.push({ x, y, mobs: ['crawler', 'crawler', 'husk', 'husk'] }); });
  for (let k = 0; k < 4; k++) put('crystal', 'THE CRYSTAL HEART', 50, 125, 11, 10, (x, y) => { for (let oy = -13; oy <= 13; oy++) for (let ox = -14; ox <= 14; ox++) { const d = (ox / 14) ** 2 + (oy / 13) ** 2, i = (y + oy) * WW + x + ox; if (d < 1 && inW(x + ox, y + oy) && tiles[i] !== BEDROCK && !TP[tiles[i]].dyn) tiles[i] = hh(x + ox, y + oy, 5) < .22 ? IRON : GEODE; } brDig(x, y, 10, 9, W_STONE, .12); brDig(x + 15, y + 3, 8, 3, 0, .2); for (let ox = -8; ox <= 8; ox += 2) { const fy = brFloor(x + ox, y); if (tileAt(x + ox, fy) === AIR && rand() < .6) tiles[fy * WW + x + ox] = CRYSTAL; } propC(WILD.spike[0], x - 3, brFloor(x - 3, y) + 1, { lit: 1, light: [.16, .4, .46] }); propC(WILD.spike[1], x + 4, brFloor(x + 4, y) + 1, { lit: 1, light: [.16, .4, .46] }); BR.nests.push({ x, y, mobs: ['mite', 'mite', 'glassfly'] }); });
  for (let k = 0; k < 4; k++) put('garden', 'THE GLOWCAP GARDEN', 24, 80, 24, 8, (x, y) => { brDig(x, y, 24, 8, W_DIRT, .2); for (let ox = -20; ox <= 20; ox++) { const fy = brFloor(x + ox, y), i = fy * WW + x + ox; if (tileAt(x + ox, fy) !== AIR) continue; const below = i + WW; if (TP[tiles[below]].full && tiles[below] !== BEDROCK) tiles[below] = MUD; if (rand() < .3) tiles[i] = GLOWCAP; else if (rand() < .2) tiles[i] = FUNGUS; else if (rand() < .1) propC(WILD.shroom[randi(0, 1)], x + ox, fy + 1, { lit: 1, light: [.3, .12, .24] }); } BR.nests.push({ x, y, mobs: ['mote', 'bat'] }); });
  // a shelf of rock hung over the fire, with the best chest below ground
  for (let k = 0; k < 3; k++) put('brink', 'THE EMBER BRINK', 132, 148, 22, 9, (x, y0) => { const y = BR_LAVA - 13; brDig(x, y, 22, 9, 0, .12); for (let ox = -24; ox <= 24; ox++) for (let yy = y + 7; yy < BR_LAVA; yy++) { const i = yy * WW + x + ox; if (inW(x + ox, yy) && abs(ox) > 7) tiles[i] = AIR; } for (let ox = -24; ox <= 24; ox++) if (abs(ox) < 8 || ox % 6 < 2) for (let yy = y + 5; yy < y + 7 + (abs(ox) < 8 ? 2 : 0); yy++) tiles[yy * WW + x + ox] = DEEPSTONE; BR.caves[BR.caves.length - 1].y = y; wBrChest(x, y + 4, true, { cave: true, crown: true }); BR.nests.push({ x, y, mobs: ['cinderling', 'cinderling', 'bat'] }); });
}
function brFloorFlat(x0, x1, y, t) { for (let x = x0; x <= x1; x++) { for (let k = 1; k < 8; k++) { const i = (y + k - 1) * WW + x; if (k === 1) { if (!TP[tiles[i]].dyn) tiles[i] = AIR; } else if (k < 5 && !TP[tiles[i]].full) tiles[i] = t; } for (let k = 1; k < 5; k++) { const i = (y - k) * WW + x; if (!TP[tiles[i]].dyn) tiles[i] = AIR; } } return y; }

// ---------------- what grows ----------------
function brWilds(lakeAtX) {
  const bushOf = b => WILD.bush[b] || WILD.bush.moor, rock = { moor: 'stone', mosswood: 'moss', willowmere: 'clay', thorn: 'stone', fen: 'moss', dunes: 'clay', scoria: 'rust', reach: 'glass', ash: 'ash' };
  for (let x = 8; x < WBRW - 8; x++) {
    const b = wBrBio(x), gy = heights[x], i = (gy - 1) * WW + x; if (tileAt(x, gy - 1) !== AIR || !TP[tileAt(x, gy)].solid || TP[tileAt(x, gy)].ghost) continue;
    const lk = lakeAtX[x], level = abs(heights[x - 1] - gy) <= 1 && abs(heights[x + 1] - gy) <= 1; if (lk) { continue; }
    const shore = lakeAtX[x - 1] || lakeAtX[x + 1] || lakeAtX[x - 3] || lakeAtX[x + 3], r = rand();
    if (RESV[x] < 2 && level && x % 2 === 0 && rand() < BR_TREE[b][1] * .72 && !RESV[x]) { if (wBrTree(x, gy, b)) { if (rand() < .5) fgOn(fpickR(bushOf(b)), x + (rand() < .5 ? 2 : -2), heights[x + 2] === gy ? gy : heights[x], { lit: 1 }); continue; } }
    if (RESV[x] > 1) { if (r < .1 && (b === 'moor' || b === 'mosswood' || b === 'willowmere')) tiles[i] = TALLGRASS; continue; }
    // the small things you can gather by hand
    if (shore) { if (r < .55) tiles[i] = REED; else if (r < .6) propC(WILD.reeds[randi(0, 1)], x, gy, { lit: 1 }); continue; }
    if (b === 'dunes') tiles[i] = r < .05 ? BONES : r < .1 ? PEBBLE : r < .17 ? DEADBUSH : r < .2 ? STICKS : AIR;
    else if (b === 'scoria') tiles[i] = r < .1 ? PEBBLE : r < .16 ? DEADBUSH : r < .22 ? STICKS : r < .38 ? TALLGRASS : r < .42 ? BERRY : AIR;
    else if (b === 'ash') tiles[i] = r < .06 ? BONES : r < .12 ? PEBBLE : r < .2 ? DEADBUSH : r < .24 ? STICKS : AIR;
    else if (b === 'reach') tiles[i] = r < .07 ? CRYSTAL : r < .12 ? PEBBLE : r < .16 ? STICKS : r < .24 ? DEADBUSH : r < .26 ? BERRY : AIR;
    else if (b === 'fen') tiles[i] = r < .34 ? REED : r < .4 ? STICKS : r < .44 ? BERRY : r < .48 ? PEBBLE : r < .5 ? GLOWCAP : AIR;
    else tiles[i] = r < (b === 'thorn' ? .07 : .045) ? BERRY : r < .115 ? STICKS : r < .165 ? PEBBLE : r < .5 ? TALLGRASS : r < .58 ? FLOWER : r < .6 ? DEADBUSH : AIR;
    // and the big ones that make the land
    if (!RESV[x] && level) {
      const q = rand();
      if (q < .05) fgOn(fpickR(bushOf(b)), x, gy, { lit: 1 });
      else if (q < .068) { const set = WILD.boulder[rock[b]]; propC(set[randi(0, set.length - 1)], x, gy, { lit: 1 }); }
      else if (q < .078 && (b === 'mosswood' || b === 'moor' || b === 'thorn' || b === 'willowmere')) propC(rand() < .6 ? WILD.log[0] : WILD.stump[0], x, gy, { lit: 1 });
      else if (q < .1 && b === 'dunes') propC(WILD.cactus[randi(0, 2)], x, gy, { lit: 1 });
      else if (q < .078 && (b === 'dunes' || b === 'ash')) propC(WILD.ribs[0], x, gy, { lit: 1 });
      else if (q < .09 && b === 'reach') propC(WILD.spike[randi(0, 1)], x, gy, { lit: 1, light: [.06, .16, .18] });
      else if (q < .1 && b === 'mosswood') propC(WILD.shroom[randi(0, 1)], x, gy, { lit: 1 });
      else if (q < .15) { const set = FOL[b === 'dunes' ? 'scoria' : b] || FOL.moor; fgOn(set[randi(0, set.length - 1)], x, gy, { lit: 1 }); }
    }
  }
  // below ground: whatever the place is made of
  if (!PROPV) { PROPV = { st: [], cy: [] }; for (let k = 0; k < 12; k++) PROPV.st.push(PROP.stalactite(8 + round(k * 1.2), 100 + k)); for (let k = 0; k < 6; k++) PROPV.cy.push(PROP.crystal(k * 7 + 3)); }
  for (let x = 8; x < WBRW - 8; x++) for (let y = heights[x] + 5; y < BR_LAVA - 2; y++) {
    const i = y * WW + x; if (tiles[i] !== AIR) continue; const below = tiles[i + WW], above = tiles[i - WW], r = hh(x, y, SEED + 77), z = fbm(x * .0075, y * .013 + 44, 2), hot = y > BR_HOT - 12;
    if (TP[below].full && !TP[below].ghost) {
      if (hot) { if (r < .03) tiles[i] = FUNGUS; else if (r < .045) tiles[i] = BONES; continue; }
      if (z < .4) { if (r < .1) tiles[i] = CRYSTAL; else if (r < .14) tiles[i] = PEBBLE; } else if (z < .5) { if (r < .05) tiles[i] = GLOWCAP; else if (r < .12) tiles[i] = FUNGUS; } else if (z > .6) { if (r < .07) tiles[i] = BONES; else if (r < .12) tiles[i] = PEBBLE; } else if (r < .05) tiles[i] = PEBBLE; else if (r < .065) tiles[i] = GLOWCAP;
      if (r > .993) propC(PROPV.cy[(hh(x, y, 3) * 6) | 0], x, y + 1, { lit: 1, light: z < .4 ? [.1, .3, .34] : null });
    } else if (TP[above].full && !TP[above].ghost) { if (r < .05 && z < .56) { for (let j = 0, n = 1 + floor(hh(x, y, 78) * 5); j < n && tiles[i + j * WW] === AIR; j++) tiles[i + j * WW] = VINE; } else if (r > .972 && tileAt(x, y + 1) === AIR && tileAt(x, y + 2) === AIR) hang(PROPV.st[(hh(x, y, 4) * 12) | 0], x, y, { lit: 1 }); }
  }
  // pools where the caves are wet, and slow fire where they are hot
  for (let k = 0; k < 130; k++) { const x = randi(30, WBRW - 30), y = heights[x] + randi(16, 120); if (y > BR_HOT - 20 || tileAt(x, y) !== AIR) continue; if (fbm(x * .0075, y * .013 + 44, 2) > .5) poolAt(x, y, WATER, 18, 4); }
  for (let k = 0; k < 60; k++) { const x = randi(30, WBRW - 30), y = randi(BR_HOT - 10, BR_LAVA - 5); if (tileAt(x, y) === AIR) poolAt(x, y, CINDER, 14, 3); }
  // a few chests out in the wild
  for (let k = 0, n = 0; k < 60 && n < 7; k++) { const x = randi(40, WBRW - 40); if (RESV[x] || lakeAtX[x]) continue; const gy = heights[x]; if (abs(heights[x - 1] - gy) <= 1 && abs(heights[x + 1] - gy) <= 1 && !BR.chests.some(c => abs(c.x - x) < 120) && wBrChest(x, gy - 1, false)) n++; }
}
const fpickR = a => a[randi(0, a.length - 1)];
function brSkyhouse(cx, cy, chest) {
  for (let x = cx - 8; x <= cx + 8; x++) { tiles[(cy - 10) * WW + x] = CUTSTONE; tiles[(cy - 1) * WW + x] = CUTSTONE; for (let y = cy - 9; y < cy - 1; y++) { walls[y * WW + x] = W_CUT; if ((x === cx - 8 || x === cx + 8) && y < cy - 5) tiles[y * WW + x] = CUTSTONE; } }
  for (const x of [cx - 8, cx + 8]) for (let y = cy - 13; y < cy - 10; y++) tiles[y * WW + x] = CUTSTONE;
  for (const s of [-1, 1]) { const X = cx + s * 9; if (tileAt(X, cy - 1) === AIR && TP[tileAt(X, cy)].solid) tiles[(cy - 1) * WW + X] = CUTSTONE; }
  dyn(cx - 3, cy - 2, TORCH); dyn(cx + 2, cy - 6, TORCH); if (chest) wBrChest(cx + 4, cy - 2, true, { high: true });
}
// the Crown: a great broken horn at the island's heart. The best chests there are, and no cover to open them in
function brCrown() {
  const cx = WBRW >> 1; let gy = heights[cx]; wBrFlat(cx - 36, cx + 36, gy); wBrEase(cx - 36, -1, gy); wBrEase(cx + 36, 1, gy);
  for (let x = cx - 34; x <= cx + 34; x++) { tiles[gy * WW + x] = abs(x - cx) % 7 === 0 ? BRICK : CUTSTONE; tiles[(gy + 1) * WW + x] = BRICK; }
  // the horn: an arch of brick, open underneath from both sides
  for (let k = 0; k <= 60; k++) { const a = PI * k / 60, rx = 15, ry = 15, x = round(cx - cos(a) * rx), y = round(gy - 5 - sin(a) * (ry - 4)); for (let q = 0; q < 2; q++) if (inW(x, y - q)) tiles[(y - q) * WW + x] = k % 9 === 0 ? CINDERBRICK : BRICK; }
  for (let x = cx - 13; x <= cx + 13; x++) for (let y = gy - 14; y < gy; y++) if (((x - cx) / 14.5) ** 2 + ((y - gy + 5) / 11) ** 2 < 1 || (y >= gy - 5 && abs(x - cx) < 14)) walls[y * WW + x] = W_RUIN;
  for (let x = cx - 8; x <= cx + 8; x++) tiles[(gy - 6) * WW + x] = PLATFORM; for (const s of [-1, 1]) for (let y = gy - 6; y < gy; y++) tiles[y * WW + cx + s * 9] = LADDER;
  for (const s of [-1, 1]) { for (let y = gy - 8; y < gy; y++) { tiles[y * WW + cx + s * 27] = CUTSTONE; tiles[y * WW + cx + s * 28] = CUTSTONE; } dyn(cx + s * 27, gy - 9, TORCH); }
  wBrChest(cx - 5, gy - 1, true, { crown: true }); wBrChest(cx + 5, gy - 1, true, { crown: true }); wBrChest(cx, gy - 7, true, { crown: true, high: true });
  for (const ox of [-18, -22, 18, 22]) { const c = wBrChest(cx + ox, gy - 1, true, { feast: true }); if (c) c.hid = true; }
  dyn(cx - 11, gy - 1, TORCH); dyn(cx + 11, gy - 1, TORCH); BR.pois.push({ name: 'THE CROWN', x: cx, b: 'crown', crown: 1 }); reserve(cx - 36, cx + 36, 2);
}
// the named places, a kind for each land. Every one of them can be walked into
function wBrPOI(b, cx, name) {
  const gy = heights[cx]; BR.pois.push({ name, x: cx, b }); const bare = (w) => { wBrFlat(cx - w, cx + w, gy, b); wBrEase(cx - w, -1, gy); wBrEase(cx + w, 1, gy); };
  const set = (x, y, t) => { if (inW(x, y) && tiles[y * WW + x] !== BEDROCK) tiles[y * WW + x] = t; };
  if (b === 'moor') {
    bare(34); house(cx - 29, gy, 14, 8, 5, { door: 2, floors: 2, name }); house(cx - 7, gy, 14, 12, 5, { door: 2, floors: 3 }); house(cx + 15, gy, 14, 8, 4, { door: 2, floors: 2 });
    for (let x = cx - 34; x <= cx + 34; x++) for (let y = gy - 5; y < gy; y++) if (tiles[y * WW + x] === DOORC) tiles[y * WW + x] = DOORO;
    for (const hx of [cx - 18, cx - 5, cx + 26]) for (let y = gy - 4; y < gy; y++) if (tiles[y * WW + hx] === AIR || tiles[y * WW + hx] === PLATFORM) set(hx, y, LADDER);
    wBrChest(cx - 24, gy - 1, false); wBrChest(cx + 1, gy - 9, true); dyn(cx - 33, gy - 1, TORCH); dyn(cx + 33, gy - 1, TORCH); brStations(cx, [BENCH, FIRE], [9, 11, -10, -13]);
  } else if (b === 'mosswood') {
    // a walk hung between great trees
    bare(30); const posts = [-24, -8, 8, 24]; for (const ox of posts) { for (let y = gy - 20; y < gy; y++) set(cx + ox, y, TRUNK); treeTops.set(cx + ox, { y: gy - 20, kind: CROWN.oak, v: randi(0, 2), ph: rand(TAU) }); }
    for (let x = cx - 25; x <= cx + 25; x++) { if (tileAt(x, gy - 9) === AIR) set(x, gy - 9, PLATFORM); if (abs(x - cx) < 10 && tileAt(x, gy - 15) === AIR) set(x, gy - 15, PLATFORM); } for (const ox of [-16, 16]) for (let y = gy - 9; y < gy; y++) set(cx + ox, y, LADDER); for (let y = gy - 15; y < gy - 9; y++) set(cx + 3, y, LADDER);
    for (let x = cx - 6; x <= cx + 6; x++) { set(x, gy - 20, THATCH); for (let y = gy - 19; y < gy - 15; y++) walls[y * WW + x] = W_WATTLE; } wBrChest(cx - 3, gy - 16, true, { high: true }); wBrChest(cx - 20, gy - 10, false, { high: true }); brStations(cx, [BENCH, FIRE, CAULDRON]);
  } else if (b === 'willowmere') {
    // a jetty and a house on stilts, over its own water
    bare(30); const lv = gy + 1; for (let x = cx - 18; x <= cx + 18; x++) { const d = round(6 * (1 - ((x - cx) / 19) ** 2)); for (let y = gy; y < gy + d; y++) set(x, y, y >= lv ? WATER : AIR); if (d > 0) { set(x, gy + d, MUD); set(x, gy + d + 1, CLAY); heights[x] = gy + d; } }
    for (let x = cx - 22; x <= cx + 22; x++) set(x, gy - 1, PLATFORM); for (const ox of [-16, -8, 8, 16]) for (let y = gy; y < gy + 6; y++) if (!TP[tileAt(cx + ox, y)].solid) set(cx + ox, y, BEAM);
    for (let x = cx - 6; x <= cx + 6; x++) { set(x, gy - 8, THATCH); if (abs(x - cx) < 5) set(x, gy - 9, THATCH); for (let y = gy - 7; y < gy - 1; y++) walls[y * WW + x] = W_WATTLE; set(x, gy - 2, AIR); } for (const s of [-1, 1]) for (let y = gy - 7; y < gy - 4; y++) set(cx + s * 6, y, WATTLE);
    wBrChest(cx - 2, gy - 2, true); wBrChest(cx - 26, gy - 1, false); dyn(cx + 3, gy - 2, TORCH); brStations(cx, [BENCH, FIRE], [25, -28, 27]);
  } else if (b === 'thorn') {
    // a camp of tents, each open towards the fire
    bare(27); for (const [ox, w, side] of [[-22, 12, 1], [11, 12, -1]]) { const x0 = cx + ox; for (let k = 0; k < w; k++) { const hgt = max(1, round((1 - abs(k - (w - 1) / 2) / (w / 2)) * 8)), x = x0 + k, inner = side > 0 ? k >= w - 4 : k <= 3; for (let y = gy - hgt; y < gy; y++) { walls[y * WW + x] = W_WATTLE; if (y === gy - hgt && !inner) set(x, y, THATCH); } } }
    dyn(cx, gy - 1, CAMP); dyn(cx - 5, gy - 1, BENCH); dyn(cx + 5, gy - 1, SIEVE); wBrChest(cx - 18, gy - 1, true); wBrChest(cx + 18, gy - 1, false); for (const ox of [-26, 26]) wBrTree(cx + ox, gy, 'thorn');
    for (const ox of [-9, 9]) for (let y = gy - 3; y < gy; y++) set(cx + ox, y, BEAM);
  } else if (b === 'fen') {
    bare(26); for (const [x0, w] of [[cx - 20, 14], [cx + 7, 13]]) { for (let x = x0; x < x0 + w; x++) { set(x, gy - 5, PLATFORM); set(x, gy - 11, THATCH); for (let y = gy - 10; y < gy - 5; y++) walls[y * WW + x] = W_WATTLE; } for (const x of [x0, x0 + w - 1]) { for (let y = gy - 4; y < gy; y++) set(x, y, BEAM); for (let y = gy - 10; y < gy - 8; y++) set(x, y, WATTLE); } for (let y = gy - 5; y < gy; y++) set(x0 + (w >> 1), y, LADDER); }
    for (let x = cx - 7; x < cx + 8; x++) set(x, gy - 5, PLATFORM); wBrChest(cx - 16, gy - 6, true); wBrChest(cx + 16, gy - 6, false); dyn(cx - 10, gy - 6, TORCH); brStations(cx, [BENCH, FIRE, CAULDRON], [-3, 3, -5, 23, -23]);
  } else if (b === 'dunes') {
    bare(22); tower(cx - 6, gy, 13, 30, { ruin: true, name }); wBrChest(cx - 2, gy - 7, false); wBrChest(cx, gy - 31, true, { high: true }); for (const ox of [-20, 18]) for (let y = gy - 5; y < gy; y++) set(cx + ox, y, SANDSTONE); brStations(cx, [BENCH, FIRE, SIEVE], [9, -10, 11, -13]);
  } else if (b === 'scoria') {
    // a stepped quarry with a working forge at the bottom
    bare(32); for (let k = 0; k < 4; k++) for (let x = cx - 20 + k * 4; x <= cx + 20 - k * 4; x++) { for (let y = gy + k * 2; y < gy + k * 2 + 2; y++) set(x, y, AIR); heights[x] = gy + k * 2 + 2; set(x, gy + k * 2 + 2, k === 3 ? STONE : SANDSTONE); }
    const fy = gy + 7; dyn(cx - 6, fy, BLOOMERY); dyn(cx - 3, fy, FURNACE); dyn(cx, fy, ANVIL); dyn(cx + 3, fy, BENCH); dyn(cx + 6, fy, FIRE); for (let k = 0; k < 14; k++) { const x = cx + randi(-24, 24), y = heights[x] + randi(2, 5); if (TP[tileAt(x, y)].full) set(x, y, k % 3 ? COPPER : IRON); }
    for (let y = gy - 10; y < gy; y++) set(cx + 24, y, BEAM); for (let x = cx + 12; x <= cx + 24; x++) set(x, gy - 10, BEAMH); for (let y = gy - 9; y < gy - 4; y++) set(cx + 13, y, ROPE); wBrChest(cx - 24, gy - 1, true); wBrChest(cx + 27, gy - 1, false);
  } else if (b === 'reach') {
    bare(28); for (let x = cx - 22; x <= cx + 22; x++) { for (let y = gy - 13; y < gy; y++) walls[y * WW + x] = W_BRICK; set(x, gy - 13, abs(x - cx) < 21 ? PLATFORM : BRICK); if (abs(x - cx) % 4 === 0) set(x, gy - 14, BRICK); } for (const s of [-1, 1]) { for (let y = gy - 13; y < gy - 4; y++) set(cx + s * 22, y, BRICK); for (let y = gy - 19; y < gy - 13; y++) { set(cx + s * 22, y, BRICK); set(cx + s * 21, y, BRICK); } for (let y = gy - 13; y < gy; y++) set(cx + s * 12, y, LADDER); }
    for (let x = cx - 9; x <= cx + 9; x++) set(x, gy - 7, PLATFORM); for (const s of [-1, 1]) for (let x = 10; x <= 11; x++) set(cx + s * x, gy - 7, PLATFORM); wBrChest(cx - 2, gy - 8, true); wBrChest(cx + 17, gy - 14, false, { high: true }); dyn(cx - 19, gy - 7, TORCH); dyn(cx + 19, gy - 7, TORCH); brStations(cx, [BENCH, FIRE, ARMOURY], [3, -3, 15, -15]);
  } else {
    bare(28); for (const [ox, h] of [[-24, 9], [-14, 13], [12, 10], [22, 7]]) for (let y = gy - h; y < gy - 3; y++) { set(cx + ox, y, y < gy - h + 3 && rand() < .5 ? AIR : CINDERBRICK); walls[y * WW + cx + ox + 1] = W_RUIN; } for (let x = cx - 14; x <= cx + 12; x++) set(x, gy - 13, PLATFORM); for (let y = gy - 13; y < gy; y++) set(cx - 6, y, LADDER);
    vent(cx - 18, gy - 28); wBrChest(cx + 8, gy - 14, true, { high: true }); wBrChest(cx + 17, gy - 1, false); brStations(cx, [BLOOMERY, FURNACE, ANVIL, BENCH, FIRE], [-4, 0, 2, -2, 3]);
  }
  reserve(cx - 30, cx + 30, 2);
}
// the island carries a fixed five kinds of small structure in every match:
// Five landmark types are spread across the field, so the Crown is not the only destination.
function wBrDistributeStructures(lakeAtX) {
  BR.structures = [];
  for (let k = 0; k < 30; k++) {
    const type = BR_STRUCTURE_TYPES[k % BR_STRUCTURE_TYPES.length];
    let cx = -1;
    for (let tries = 0; tries < 12 && cx < 0; tries++) {
      const x = round((k + .5) * WBRW / 30 + rand(-68, 68));
      if (x < 45 || x > WBRW - 46 || lakeAtX[x] || RESV[x]) continue;
      const gy = heights[x];
      if (abs(heights[x - 1] - gy) > 2 || abs(heights[x + 1] - gy) > 2) continue;
      if (BR.pois.some(q => abs(q.x - x) < 65) || BR.structures.some(s => abs(s.x - x) < 62)) continue;
      cx = x;
    }
    if (cx < 0) continue;
    const gy = heights[cx];
    wBrFlat(cx - 7, cx + 7, gy, wBrBio(cx));
    if (type === 'fortress') {
      for (const ox of [-8, 8]) for (let y = gy - 9; y < gy; y++) tiles[y * WW + cx + ox] = CINDERBRICK;
      for (let x = cx - 8; x <= cx + 8; x++) if (abs(x - cx) > 1) tiles[(gy - 9) * WW + x] = BRICK;
      for (let y = gy - 5; y < gy; y++) { tiles[y * WW + cx - 4] = BRICK; tiles[y * WW + cx + 4] = BRICK; }
    } else if (type === 'bunker') {
      brDig(cx, gy + 8, 9, 6, W_STONE, .16);
      for (let x = cx - 8; x <= cx + 8; x++) tiles[(gy + 2) * WW + x] = CINDERBRICK;
      for (let y = gy + 2; y < gy + 8; y++) { tiles[y * WW + cx - 8] = BRICK; tiles[y * WW + cx + 8] = BRICK; }
      for (let y = gy + 1; y < gy + 8; y++) if (tileAt(cx, y) === AIR) tiles[y * WW + cx] = LADDER;
    } else if (type === 'village') {
      house(cx - 6, gy, 8, 5, 3, { door: 2 });
      house(cx + 3, gy, 6, 5, 2, { door: 2 });
      dyn(cx + 8, gy - 1, BENCH);
    } else if (type === 'temple') {
      for (const ox of [-7, -3, 3, 7]) for (let y = gy - 8; y < gy; y++) tiles[y * WW + cx + ox] = CINDERBRICK;
      for (let x = cx - 7; x <= cx + 7; x++) tiles[(gy - 8) * WW + x] = BRICK;
      for (let x = cx - 7; x <= cx + 7; x++) tiles[(gy - 1) * WW + x] = PLATFORM;
    } else {
      for (const ox of [-5, 5]) for (let y = gy - 11; y < gy; y++) tiles[y * WW + cx + ox] = BEAM;
      for (let x = cx - 6; x <= cx + 6; x++) tiles[(gy - 11) * WW + x] = PLATFORM;
      for (let y = gy - 10; y < gy - 3; y++) if (tileAt(cx, y) === AIR) tiles[y * WW + cx] = LADDER;
    }
    if (k % 5 === 0) wBrChest(cx + (type === 'village' ? 8 : k % 10 ? 3 : -3), type === 'bunker' ? gy + 1 : gy - 1, k % 15 === 0, { structure: type, high: type === 'outpost' });
    BR.structures.push({ x: cx, y: gy, type, kind: 'structure' });
    reserve(cx - 10, cx + 10, 1);
  }
}
// a small picture of the whole island for the map and the strip along the top
function wBrMapArt() {
  const s = 2, c = document.createElement('canvas'); c.width = ceil(WBRW / s); c.height = ceil(WBRH / s); const x = c.getContext('2d'), im = x.createImageData(c.width, c.height), d = im.data, hex = {}; const rgbOf = h => hex[h] || (hex[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  for (let tx = 0; tx < WBRW; tx += s) for (let ty = 0; ty < WBRH; ty += s) { const t = tiles[ty * WW + tx]; let col = null; if (TP[t].liquid === 1) col = '#3a7a9a'; else if (TP[t].liquid === 2) col = '#e2542b'; else if (TP[t].stalk) col = '#2f5a3a'; else if (TP[t].solid && !(t === BEDROCK && (tx < 3 || tx > WBRW - 4))) col = ty <= heights[tx] + 1 ? BR_MAPCOL[wBrBio(tx)] : ty >= BR_HOT ? '#4a2420' : ty < heights[tx] + 8 ? '#5a4a40' : '#3a3442'; else if (ty > heights[tx] + 4) col = '#1c1826'; if (!col) continue; const q = rgbOf(col), k = ((ty / s) * c.width + tx / s) * 4; d[k] = q[0]; d[k + 1] = q[1]; d[k + 2] = q[2]; d[k + 3] = 255; }
  x.putImageData(im, 0, 0); BR.mapCv = c;
}
