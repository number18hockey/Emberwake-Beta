// ============================================================
//  The open sky is worth walking under. Things only the surface gives:
//    SUNSTONE     in the stone of the high peaks; dark at night, it only
//                 gives itself up by daylight
//    SKYIRON      where a star came down: craters, far apart
//    SUNBLOOM     in the meadows, opens by day; MOONPETAL up high, only at night
//    SKYFEATHERS  from the skyhawks that circle the peaks
//    STORM GLASS  where lightning finds a rod you raised in a thunderstorm
//    OLD GEARS    in the observatories
//  And places: SUN SHRINES on hilltops (a sunstone at midday makes you
//  harder to kill, once at each), OBSERVATORIES (their telescopes chart
//  the gates and the fallen stars), and four GATES that lead past the
//  three floors of the world: the Frost Gate on a peak, the Stopped
//  Clocktower, the Stormspire (it opens only in a thunderstorm) and the
//  Ringstair, which climbs toward the broken ring.
// ============================================================
const SUNSTONE = 167, SKYIRON = 168, SUNBLOOM = 169, MOONPETAL = 170, LROD = 171, SUNSHRINE = 172, TELESCOPE = 173,
  FROSTGATE = 174, CLOCKGATE = 175, STORMGATE = 176, RINGGATE = 177, SCORCH = 178, ICEBRICK = 179;
defT(SUNSTONE, { name: 'Sunstone', solid: true, full: true, hard: 60, hi: '#fff1a8', dust: '#ffd35a', light: [.3, .22, .06] });
defT(SKYIRON, { name: 'Skyiron', solid: true, full: true, hard: 80, hi: '#d8e4ff', dust: '#8a9ad0', light: [.06, .08, .16] });
defT(SUNBLOOM, { name: 'Sunbloom', decor: true, hard: 1, ground: true, light: [.18, .14, .04], dust: '#ffd35a' });
defT(MOONPETAL, { name: 'Moonpetal', decor: true, hard: 1, ground: true, light: [.05, .07, .15], dust: '#c9d8ff' });
defStn(LROD, 'Lightning Rod', 'lightning_rod', { dust: '#c98a2b', hard: 10 });
defT(SUNSHRINE, { name: 'Sun Shrine', dyn: true, hard: Infinity, light: [.45, .36, .12], dust: '#ffd35a' });
defT(TELESCOPE, { name: 'Telescope', dyn: true, hard: Infinity, dust: '#c98a2b' });
defT(FROSTGATE, { name: 'Frost Gate', dyn: true, hard: Infinity, light: [.3, .5, .7], dust: '#b4e6e8' });
defT(CLOCKGATE, { name: 'Clock Gate', dyn: true, hard: Infinity, light: [.55, .45, .2], dust: '#c9a44a' });
defT(STORMGATE, { name: 'Storm Gate', dyn: true, hard: Infinity, light: [.4, .45, .8], dust: '#8a9ad0' });
defT(RINGGATE, { name: 'Ring Gate', dyn: true, hard: Infinity, light: [.8, .6, .3], dust: '#ffd35a' });
defT(SCORCH, { name: 'Starglass', solid: true, full: true, hard: 40, hi: '#7a7a9a', dust: '#3a3a5a' });
defPart(ICEBRICK, { name: 'Ice Brick', solid: true, full: true, hi: '#e8ffff', dust: '#b4e6e8', drop: 'icebrick', light: [.02, .05, .07] });
defM(SUNSTONE, { hp: 12, tier: 6, k: 'ore', y: [['sunstone', 2]], when: () => !DIM && G.dn > .45, alt: [['rock', 1]], whenSay: 'The sunstone is dark. It only gives itself up by daylight.' });
defM(SKYIRON, { hp: 14, tier: 7, k: 'ore', y: [['skyiron_ore', 2.4]] });
defM(SCORCH, { hp: 8, tier: 3, k: 'stone', y: [['flint', .5], ['glass', .4], ['rock', .6]] });
defM(ICEBRICK, { hp: 5, tier: 2, k: 'stone', y: [['icebrick', 1]] });
defM(LROD, { hp: 6, tier: 1, k: 'stone' }); MAT[LROD].y = [['lightning_rod', 1]];
Object.assign(PLUCK, { [SUNBLOOM]: [['sunbloom', 1, 2]], [MOONPETAL]: [['moonpetal', 1, 2]] });
// flowers that keep their hours: out of them they give nothing but fibre
const PLUCK_WHEN = {
  [SUNBLOOM]: { ok: () => G.dn > .45, alt: [['fiber', 1, 1]], say: 'A closed bud. Sunbloom only opens by day.' },
  [MOONPETAL]: { ok: () => G.dn < .35, alt: [['fiber', 1, 1]], say: 'Shut tight. Moonpetal only opens at night.' }
};
BIG_B.observatory = x => { buildObservatory(x); return true; };
TIER_N.push('a rimesteel tool', 'an hourbrass tool', 'a stormsilver tool', 'a dawnsteel tool');

// ---------------- where the gates are ----------------
// fixed distances from the village, on the side the seed chose; a world made before them keeps them out past
// the land it had already seen, and once worked out they never move (they are saved with the world)
let FROST_X = -1e5, CLOCK_X = -1e5, STORMG_X = -1e5, RING_X = -1e5, OBS_X = -1e5, FROST_Y = 0, CLOCK_Y = 0, STORMG_Y = 0, RING_Y = 0;
const GATE_D = { frost: -1500, clock: 1750, storm: -2150, ring: 2500, obs: -820 };
const GATE_INFO = {
  frost: { d: 4, tile: FROSTGATE, name: 'THE FROST GATE', key: 'frost_key', sub: 'a door into the long winter' },
  clock: { d: 5, tile: CLOCKGATE, name: 'THE STOPPED CLOCKTOWER', key: 'hour_key', sub: 'its hands stopped at the hour the ring broke' },
  storm: { d: 6, tile: STORMGATE, name: 'THE STORMSPIRE', key: 'storm_key', sub: 'it only opens in a thunderstorm' },
  ring: { d: 7, tile: RINGGATE, name: 'THE RINGSTAIR', key: 'dawnring', sub: 'it climbs toward the broken ring' }
};
const gateX = k => k === 'frost' ? FROST_X : k === 'clock' ? CLOCK_X : k === 'storm' ? STORMG_X : k === 'ring' ? RING_X : OBS_X;
function cleanGates(g) { const o = {}; if (g && typeof g === 'object') for (const k in GATE_D) if (isFinite(g[k]) && g[k] > 200 && g[k] < EW - 200) o[k] = g[k] | 0; return Object.keys(o).length === 5 ? o : null; }
function wondersInit(s) {
  // (a world of the other branch keeps its land exactly as that branch made it, and that branch had none of this: no gates, no observatory)
  if (forkLand()) { FROST_X = CLOCK_X = STORMG_X = RING_X = OBS_X = -1e5; WORLD.gates = null; return; }
  const G0 = cleanGates(WORLD.gates), K = WORLD.land >= 3 ? null : WORLD.known;
  const at = k => {
    if (G0) return G0[k]; let x = X0 + s * GATE_D[k];
    if (K) { if (x > X0) x = max(x, K[1] + 330); else x = min(x, K[0] - 330); }
    return clamp(x, 400, EW - 400);
  };
  FROST_X = at('frost'); CLOCK_X = at('clock'); STORMG_X = at('storm'); RING_X = at('ring'); OBS_X = at('obs');
  WORLD.gates = { frost: FROST_X, clock: CLOCK_X, storm: STORMG_X, ring: RING_X, obs: OBS_X };
  // the country each sits in: a peak in the cold, a green moor, dry stony heights, the ash
  FORCE.push({ x: FROST_X, r: 90, t: .06, h: .5 }, { x: CLOCK_X, r: 70, t: .5, h: .5 }, { x: STORMG_X, r: 80, t: .5, h: .22 }, { x: RING_X, r: 90, t: .84, h: .82 }, { x: OBS_X, r: 50, t: .5, h: .45 });
  const fl = (x, r, k) => { let sum = 0, n = 0; for (let q = x - r; q <= x + r; q += 2) { sum += Hraw(q); n++; } FLATS.push({ x, r, k, h: round(sum / n) }); return FLATS[FLATS.length - 1].h; };
  FROST_Y = fl(FROST_X, 10, 8); CLOCK_Y = fl(CLOCK_X, 8, 8); STORMG_Y = fl(STORMG_X, 7, 8); RING_Y = fl(RING_X, 16, 10); fl(OBS_X, 9, 8);
  WINDOWS.push([FROST_X - 14, FROST_X + 14, 16], [CLOCK_X - 10, CLOCK_X + 10, 14], [STORMG_X - 9, STORMG_X + 9, 14], [RING_X - 20, RING_X + 20, 16], [OBS_X - 11, OBS_X + 11, 14]);
  Object.assign(SPOTS, { frostgate: { x: FROST_X, y: FROST_Y - 1 }, clockgate: { x: CLOCK_X, y: CLOCK_Y - 1 }, stormgate: { x: STORMG_X, y: STORMG_Y - 1 }, ringgate: { x: RING_X + 2, y: RING_Y - 16 }, obs: { x: OBS_X, y: 0 } });
}

// ---------------- step two on the surface: wonders ----------------
function craterOf(k) {
  return pmemo('m' + k, () => {
    if (DIM || WORLD.arena || hh(k, 1700, SEED) > .5) return null;
    const x = k * 1100 + 150 + floor(hh(k, 1701, SEED) * 800);
    if (!newLand(x - 24) || !newLand(x + 24) || inWindow(x, 40) || abs(x - SPAWN_X) < 300 || lakeAt(x) || lakeAt(x - 16) || lakeAt(x + 16) || bigNear(x, 20)) return null;
    const h0 = surf(x); for (const o of [-14, -8, 8, 14]) if (abs(surf(x + o) - h0) > 7) return null;
    for (let q = floor(x / 150) - 1; q <= floor(x / 150) + 1; q++) { const s = structOf(q); if (s && abs(s.x - x) < 30) return null; }
    return { x, r: 10 + floor(hh(k, 1702, SEED) * 5), k };
  });
}
function shrineOf(k) {
  return pmemo('u' + k, () => {
    if (DIM || WORLD.arena || hh(k, 1720, SEED) > .55) return null;
    // the first hilltop along the cell, starting somewhere the seed picks
    const s0 = floor(hh(k, 1721, SEED) * 60);
    for (let j = 0; j < 60; j++) {
      const x = k * 900 + 80 + ((s0 + j) % 60) * 12, h = surf(x);
      if (!newLand(x - 10) || !newLand(x + 10) || inWindow(x, 24) || abs(x - SPAWN_X) < 200 || lakeAt(x) || bigNear(x, 10)) continue;
      if (!(surf(x - 14) > h + 2 && surf(x + 14) > h + 2)) continue;
      if ([-3, -2, -1, 1, 2, 3].some(o => abs(surf(x + o) - h) > 2)) continue;
      let clash = false; for (let q = floor(x / 150) - 1; q <= floor(x / 150) + 1; q++) { const s = structOf(q); if (s && abs(s.x - x) < 22) clash = true; } if (clash) continue;
      return { x, k };
    }
    return null;
  });
}
function wondersFinish(cx, x0, x1, here) {
  if (DIM || WORLD.arena || forkLand()) return;
  if (here(FROST_X)) buildFrostGate(); if (here(CLOCK_X)) buildClockGate(); if (here(STORMG_X)) buildStormGate(); if (here(RING_X)) buildRingstair(); if (here(OBS_X)) buildObservatory(OBS_X, 1);
  for (let k = floor(x0 / 1100) - 1; k <= floor(x1 / 1100) + 1; k++) { const c = craterOf(k); if (c && here(c.x)) withRng(hh(c.x, 1750, SEED) * 4294967296, () => buildCrater(c)); }
  for (let k = floor(x0 / 900) - 1; k <= floor(x1 / 900) + 1; k++) { const s = shrineOf(k); if (s && here(s.x)) buildSunShrine(s); }
  // sunstone in the high stone, flowers that keep their hours
  for (let x = x0; x < x1; x++) {
    if (RESV[x] > 1 || inWindow(x, 2)) continue; const h = heights[x], b = biomeE(x); if (h < 4 || h > WH - 8) continue;
    const top = tileAt(x, h), above = tileAt(x, h - 1);
    if (h < BASE_Y - 30 && hh(x, 1730, SEED) < .05 && (top === STONE || top === SNOW || top === DIRT)) { for (let d = 0; d < 2 + floor(hh(x, 1731, SEED) * 3); d++) if (NATURAL.has(tileAt(x, h + d))) tiles[(h + d) * WW + x] = SUNSTONE; if (hh(x, 1732, SEED) < .5 && NATURAL.has(tileAt(x + 1, heights[x + 1]))) tiles[heights[x + 1] * WW + x + 1] = SUNSTONE; continue; }
    if (above !== AIR && !(TP[above].decor && !TP[above].dyn)) continue;
    if ((b === 'moor' || b === 'fen' || b === 'thorn' || b === 'mosswood') && top === GRASS && hh(x, 1733, SEED) < .022) tiles[(h - 1) * WW + x] = SUNBLOOM;
    else if ((b === 'reach' || h < BASE_Y - 22) && (top === SNOW || top === STONE || top === GRASS || top === DIRT) && hh(x, 1734, SEED) < .024) tiles[(h - 1) * WW + x] = MOONPETAL;
  }
}
function buildCrater(c) {
  const x = c.x, R = c.r, gy = heights[x];
  for (let dx = -R - 3; dx <= R + 3; dx++) {
    const X = x + dx, u = dx / R, depth = abs(u) < 1 ? round((1 - u * u) * R * .5) : 0, rim = abs(u) >= 1 ? max(0, round(2 - (abs(dx) - R))) : 0, top = heights[X];
    if (depth) { for (let y = top - 20; y < gy + depth; y++) if (inW(X, y) && tiles[y * WW + X] !== BEDROCK) { tiles[y * WW + X] = AIR; if (y >= gy) walls[y * WW + X] = 0; } heights[X] = gy + depth; for (let y = gy + depth; y < gy + depth + 2; y++) tiles[y * WW + X] = SCORCH; }
    else if (rim) { for (let y = top - rim; y < top; y++) if (tileAt(X, y) === AIR) tiles[y * WW + X] = SCORCH; heights[X] = top - rim; }
  }
  // the star itself, and splinters of it in the floor
  const fy = gy + round(R * .5); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) tiles[(fy + dy) * WW + x + dx] = SKYIRON;
  for (let k = 0; k < 6; k++) { const X = x + randi(-R + 2, R - 2), Y = heights[X] + randi(0, 2); if (tileAt(X, Y) === SCORCH) tiles[Y * WW + X] = SKYIRON; }
  for (let y = fy - 3; y > fy - 12; y--) if (tileAt(x, y) !== AIR) tiles[y * WW + x] = AIR; heights[x] = fy - 2;
  reserve(x - R - 2, x + R + 2, 1); mark('star' + c.k, 'A FALLEN STAR', 'skyiron, still warm', x, gy - 2, R + 4);
}
function buildSunShrine(s) {
  const x = s.x, gy = flatten(x - 3, x + 3, STONE);
  bp(x - 3, gy - 2, ['...S...', '.CCCCC.'], { '.': [AIR, 0], S: [SUNSHRINE, 0], C: CUTSTONE });
  for (let dx = -3; dx <= 3; dx++) setT(x + dx, gy, CUTSTONE);
  propC(PROP.post, x - 3, gy - 1, { light: [.6, .45, .15], lyo: 2 }); propC(PROP.post, x + 3, gy - 1, { light: [.6, .45, .15], lyo: 2 });
  reserve(x - 4, x + 4, 2); mark('sun' + s.k, 'A SUN SHRINE', 'bring it a sunstone at midday', x, gy - 5, 8); small();
}
function buildObservatory(x, fixed) {
  const gy = flatten(x - 8, x + 8, STONE);
  for (let dx = -5; dx <= 5; dx++) { for (let y = gy - 12; y < gy; y++) setT(x + dx, y, abs(dx) === 5 ? (y >= gy - 3 ? AIR : CUTSTONE) : AIR, abs(dx) < 5 ? W_CUT : 0); setT(x + dx, gy, CUTSTONE); for (let y = gy + 1; y < gy + 4; y++) if (!solidAt(x + dx, y)) setT(x + dx, y, STONE); }
  for (let dx = -4; dx <= 4; dx++) setT(x + dx, gy - 6, PLATFORM, W_CUT);
  for (let dx = -5; dx <= 5; dx++) { const h = round(sqrt(max(0, 25 - dx * dx)) * .8); for (let k = 0; k <= h; k++) setT(x + dx, gy - 13 - k, k === h && abs(dx) > 1 ? COBBLE : AIR, abs(dx) < 5 && k < h ? W_CUT : undefined); }
  for (let y = gy - 12; y < gy; y++) setT(x - 4, y, LADDER, W_CUT);
  dyn(x + 1, gy - 7, TELESCOPE); chestAt(x + 3, gy - 1, 'observatory'); chestAt(x - 2, gy - 7, 'observatory'); lampAt(x, gy - 4, [.8, .6, .3]); lampAt(x + 2, gy - 11, [.8, .6, .3]);
  reserve(x - 9, x + 9, 2); mark('obs' + x, fixed ? 'THE OLD OBSERVATORY' : 'AN OBSERVATORY', 'its telescope still points at the sky', x, gy - 15, 12);
}
function buildFrostGate() {
  const x = FROST_X, gy = FROST_Y; heights[x] = gy;
  for (let dx = -10; dx <= 10; dx++) { const X = x + dx; for (let y = gy - 24; y < gy; y++) setT(X, y, AIR, 0); setT(X, gy, abs(dx) % 4 === 0 ? ICEBRICK : SNOW); for (let y = gy + 1; y < gy + 6; y++) if (!solidAt(X, y)) setT(X, y, STONE); heights[X] = gy; }
  // an arch of ice brick, a little crooked
  for (const s of [-1, 1]) { for (let y = gy - 9; y < gy; y++) { setT(x + s * 4, y, ICEBRICK); setT(x + s * 5, y, y < gy - 1 ? ICEBRICK : AIR); } }
  for (let dx = -5; dx <= 5; dx++) { const y = gy - 10 - (abs(dx) < 3 ? 1 : 0); setT(x + dx, y, ICEBRICK); if (abs(dx) < 4) setT(x + dx, y + 1, AIR, W_STONE); }
  for (let y = gy - 9; y < gy; y++) for (let dx = -3; dx <= 3; dx++) walls[y * WW + x + dx] = W_STONE;
  dyn(x, gy - 1, FROSTGATE); dyn(x - 8, gy - 1, TORCH); dyn(x + 8, gy - 1, TORCH);
  reserve(x - 11, x + 11, 2); mark('frostgate', GATE_INFO.frost.name, GATE_INFO.frost.sub, x, gy - 12, 14);
}
// a tower of brick you can climb inside: solid sides, a ladder, floors every five rows
function gateTower(x, gy, half, h, mat, wall) {
  for (let dx = -half; dx <= half; dx++) for (let y = gy - h; y < gy; y++) setT(x + dx, y, abs(dx) === half ? mat : AIR, wall);
  for (let dx = -half; dx <= half; dx++) setT(x + dx, gy - h - 1, mat);
  for (let y = gy - 6; y > gy - h; y -= 5) for (let dx = -half + 1; dx < half; dx++) setT(x + dx, y, PLATFORM, wall);
  for (let y = gy - h; y < gy; y++) setT(x - half + 1, y, LADDER, wall);
}
function buildClockGate() {
  const x = CLOCK_X, gy = CLOCK_Y; heights[x] = gy;
  for (let dx = -9; dx <= 9; dx++) { const X = x + dx; for (let y = gy - 30; y < gy; y++) setT(X, y, AIR, 0); setT(X, gy, abs(dx) % 3 ? COBBLE : CUTSTONE); for (let y = gy + 1; y < gy + 5; y++) if (!solidAt(X, y)) setT(X, y, STONE); heights[X] = gy; }
  gateTower(x, gy, 4, 26, BRICK, W_BRICK);
  // the doorway at the foot, with the gate in it, and a way in from either side
  for (let y = gy - 5; y < gy; y++) for (const s of [-1, 1]) setT(x + s * 4, y, y < gy - 4 ? BRICK : AIR);
  setT(x - 3, gy - 1, AIR, W_BRICK); dyn(x, gy - 1, CLOCKGATE);
  // the stopped clock, and a little roof
  hang(PROP.clockface, x, gy - 24, { light: [.5, .4, .2] });
  for (let dx = -5; dx <= 5; dx++) setT(x + dx, gy - 27, BRICK); for (let dx = -3; dx <= 3; dx++) setT(x + dx, gy - 28, BRICK); setT(x, gy - 29, BRICK);
  dyn(x + 6, gy - 1, TORCH); dyn(x - 6, gy - 1, TORCH);
  reserve(x - 10, x + 10, 2); mark('clockgate', GATE_INFO.clock.name, GATE_INFO.clock.sub, x, gy - 30, 12);
}
function buildStormGate() {
  const x = STORMG_X, gy = STORMG_Y; heights[x] = gy;
  for (let dx = -8; dx <= 8; dx++) { const X = x + dx; for (let y = gy - 36; y < gy; y++) setT(X, y, AIR, 0); setT(X, gy, abs(dx) % 2 ? STONE : CUTSTONE); for (let y = gy + 1; y < gy + 5; y++) if (!solidAt(X, y)) setT(X, y, STONE); heights[X] = gy; }
  gateTower(x, gy, 3, 30, CUTSTONE, W_CUT);
  for (let y = gy - 5; y < gy; y++) for (const s of [-1, 1]) setT(x + s * 3, y, y < gy - 4 ? CUTSTONE : AIR);
  for (let y = gy - 28; y < gy - 2; y += 6) for (const s of [-1, 1]) setT(x + s * 3, y, COPPER);
  setT(x - 2, gy - 1, AIR, W_CUT); dyn(x, gy - 1, STORMGATE); dyn(x, gy - 32, LROD);
  reserve(x - 9, x + 9, 2); mark('stormgate', GATE_INFO.storm.name, GATE_INFO.storm.sub, x, gy - 34, 10);
}
function buildRingstair() {
  const x = RING_X, gy = RING_Y; heights[x] = gy;
  for (let dx = -18; dx <= 18; dx++) { const X = x + dx; for (let y = gy - 30; y < gy; y++) setT(X, y, AIR, 0); setT(X, gy, abs(dx) % 5 === 0 ? CUTSTONE : ASH); for (let y = gy + 1; y < gy + 6; y++) if (!solidAt(X, y)) setT(X, y, STONE); heights[X] = gy; }
  // fourteen steps up out of the ash on arches, and a landing on pillars with the gate on it
  for (let k = 0; k < 14; k++) { const X = x - 16 + k, top = gy - 1 - k; setT(X, top, CUTSTONE); setT(X, top + 1, CUTSTONE); if (k % 4 === 0) for (let y = top + 2; y < gy; y++) setT(X, y, CUTSTONE); }
  for (let dx = -2; dx <= 6; dx++) { setT(x + dx, gy - 15, CUTSTONE); setT(x + dx, gy - 14, CUTSTONE); }
  for (const dx of [-2, 2, 6]) for (let y = gy - 13; y < gy; y++) setT(x + dx, y, CUTSTONE);
  dyn(x + 2, gy - 16, RINGGATE); dyn(x - 2, gy - 16, TORCH); dyn(x + 6, gy - 16, TORCH);
  reserve(x - 19, x + 19, 2); mark('ringgate', GATE_INFO.ring.name, GATE_INFO.ring.sub, x + 2, gy - 22, 20);
}

// ---------------- the sun shrines, the telescopes and the gates ----------------
function wonderInteract(L) {
  const p = G.p, ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T), F = G.flags;
  for (const o of tileObjs.values()) {
    if (abs(o.x - ptx) > 7 || abs(o.y - pty) > 6) continue; const i = o.y * WW + o.x;
    if (o.id === SUNSHRINE) L.push({ x: o.x * T + 4, y: (o.y + 1) * T, r: 16, label: F['sun' + o.x] ? 'the shrine is warm (spent)' : hasItem('sunstone') ? 'set a sunstone on the shrine' : 'look at the sun shrine', act: () => sunShrineAct(o) });
    else if (o.id === TELESCOPE) L.push({ x: o.x * T + 4, y: (o.y + 1) * T, r: 16, label: 'look through the telescope', act: telescopeAct });
    else if (o.id === LROD) L.push({ x: o.x * T + 4, y: (o.y + 1) * T, r: 12, label: 'look at the lightning rod', act: () => say(G.ev && G.ev.id === 'thunder' ? 'It hums. Stay clear of it.' : 'It waits for a thunderstorm. Lightning picks the rod over you, and leaves storm glass.') });
    else for (const k in GATE_INFO) { const Gi = GATE_INFO[k]; if (o.id !== Gi.tile) continue; L.push({ x: o.x * T + 4, y: (o.y + 1) * T, r: 22, label: F['dim' + Gi.d] ? 'step through ' + gateName(k) : hasItem(Gi.key) ? 'open ' + gateName(k) + ' with the ' + IT[Gi.key].name : 'inspect ' + gateName(k), act: () => gateOpenAct(k), host: 1 }); }
  }
}
const gateName = k => ({ frost: 'the Frost Gate', clock: 'the clock gate', storm: 'the Stormspire', ring: 'the Ring Gate' })[k];
function sunShrineAct(o) {
  const F = G.flags, k = 'sun' + o.x;
  if (F[k]) { say('The shrine is still warm from the last sunstone. It has given you all it has.'); return; }
  if (!hasItem('sunstone')) { say('A bowl for something bright, facing the sky. Sunstone, from the high peaks, set here at midday.'); learn('sunshrines', true); return; }
  if (G.clock < .15 || G.clock > .45) { say('The bowl is cold. It wants the sun high: come back at midday.'); sfx('deny'); return; }
  removeItem('sunstone', 1); F[k] = 1; F.sunHP = (F.sunHP | 0) + 5; G.dirty = true; sfx('quest', 0); G.flash = .6; G.flashCol = '255,230,150';
  burst(o.x * T + 4, o.y * T, 30, ['#fff1a8', '#ffd35a', '#ffffff'], 2.2, 40, { glow: 1, g: -.03 }); G.p.hp = min(G.p.maxhp + 5, G.p.hp + 5);
  G.banner = { text: 'SUN SHRINE', sub: '5 more health, for good (' + (F.sunHP | 0) + ' from shrines so far)', t: 0 };
}
function telescopeAct() {
  const F = G.flags; sfx('quest', 0); F.charted = 1; G.dirty = true;
  for (const k of ['g_frost', 'g_clock', 'g_storm', 'g_ring']) learn(k, true);
  // the nearest fallen stars and shrines, out to a long way
  const px = floor((G.p.x + 3) / T); F.stars = []; for (let k = floor(px / 1100) - 4; k <= floor(px / 1100) + 4; k++) { const c = craterOf(k); if (c) F.stars.push(c.x); }
  F.suns = []; for (let k = floor(px / 900) - 5; k <= floor(px / 900) + 5; k++) { const s = shrineOf(k); if (s) F.suns.push(s.x); }
  G.banner = { text: 'THE SKY CHART', sub: 'the gates, fallen stars and sun shrines are on your map [M]', t: 0 };
  say('Four lights on the horizon that are not stars. And where the stars did fall, the ground is still scorched.');
}
function gateOpenAct(k) {
  const Gi = GATE_INFO[k], F = G.flags, d = Gi.d;
  if (DIM || netGuest()) return;
  if (F['dim' + d]) { enterDim(d); return; }
  if (k === 'storm' && !(G.ev && G.ev.id === 'thunder' && G.ev.fade > .3)) { say(hasItem(Gi.key) ? 'The key fits, but the door is dead stone. It wants a thunderstorm.' : 'A door with no handle, under a rod that has been struck a thousand times. It only opens in a thunderstorm, and it wants a Storm Key.'); learn('g_storm', true); sfx('deny'); return; }
  if (!hasItem(Gi.key)) { say(GATE_HINT[k]); learn('g_' + k, true); sfx('deny'); return; }
  if (k !== 'ring') removeItem(Gi.key, 1);
  F['dim' + d] = true; G.dirty = true; sfx('quest', 0); G.flash = .8; G.flashCol = '255,240,200';
  G.banner = { text: Gi.name, sub: 'it opens', t: 0 }; setTimeout(() => enterDim(d), 700);
}
const GATE_HINT = {
  frost: 'Ice over a door, and a keyhole full of frost. A Frost Key would turn it: a Slagforge can make one from prismglass, sunstone, skyfeathers and the Prism Heart.',
  clock: 'The clock stopped at the hour the ring broke. Under it, a door with a keyhole shaped like an hourglass. An Hour Key, made at a Rime Forge, would wind it.',
  ring: 'Fourteen steps up, and a ring of stone with nothing in it. It is waiting for a ring to fit inside it: the Dawnring, forged from what every guardian kept.'
};

// ---------------- the sky chart on the map ----------------
function mapWonders(c, at, near, label, vx, vw) {
  const F = G.flags; if (DIM || !F.charted) return;
  const dot = (tx, ty, col, name) => { const [lx, ly] = at(tx, ty); if (lx < vx - 20 || lx > vx + vw + 20) return; c.fillStyle = '#120d1f'; c.fillRect(round(lx) - 2, round(ly) - 2, 5, 5); c.fillStyle = col; c.fillRect(round(lx) - 1, round(ly) - 1, 3, 3); near(lx, ly, name); if (MAPV.z >= 1.5) label(name, lx, ly, col); };
  for (const k in GATE_INFO) dot(gateX(k), (SPOTS[k + 'gate'] || { y: BASE_Y }).y || BASE_Y, '#e0d2ff', GATE_INFO[k].name);
  for (const x of F.stars || []) dot(x, surf(x), '#c9d8ff', 'a fallen star');
  for (const x of F.suns || []) if (!F['sun' + x]) dot(x, surf(x), '#ffd35a', 'a sun shrine');
}

// ---------------- what the open sky gives ----------------
Object.assign(LOOT_T, {
  observatory: [['ancient_gear', .85, 1, 3], ['storm_glass', .55, 1, 2], ['glass', .6, 2, 4], ['spyglass', .14, 1, 1], ['compass', .1, 1, 1], ['scroll', .3, 1, 1], ['sunstone', .3, 1, 2], ['salve', .5, 1, 2], ['copper_bar', .4, 1, 3], ['jerky', .4, 1, 3]]
});
function wonderItems() {
  const Ico = (rows, p) => outlined(spr(rows, p)), M = (id, name, ic, pal, desc, o) => defI(id, Object.assign({ name, icon: typeof ic === 'string' ? icon(ic, pal) : ic, desc }, o));
  M('sunstone', 'Sunstone', 'flint', { a: '#fff1a8', b: '#ffd35a', c: '#c98a2b', d: '#7a5218', e: '#ffffff' }, 'A stone that holds noon. It only comes loose by daylight, high on the peaks. Sun shrines, the Frost Key and the forges past the floors want it.', { glow: 1 });
  M('skyiron_ore', 'Skyiron', 'nug', { a: '#ffffff', b: '#c9d8ff', c: '#8a9ad0', d: '#4a5a8a', e: '#ffffff' }, 'Iron that fell out of the sky, from the craters where the stars came down. A Slagforge smelts it.');
  M('skyiron_bar', 'Skyiron Bar', 'bar', { a: '#ffffff', b: '#c9d8ff', c: '#8a9ad0', d: '#4a5a8a', e: '#ffffff' }, 'Light, and it rings like a bell. The Storm Key and the Thunder Anvil need it.');
  M('sunbloom', 'Sunbloom', 'berry', { a: '#ffd35a', b: '#fff1a8', c: '#c98a2b', e: '#5a8a3a', f: '#7ddc6f' }, 'It only opens by day, in the meadows. Warm to hold, and sweet. A Rime Offering wants it.', { type: 'food', food: 3, heal: 3 });
  M('moonpetal', 'Moonpetal', 'berry', { a: '#c9d8ff', b: '#ffffff', c: '#6a7aa8', e: '#3a4a6a', f: '#8a9ad0' }, 'It only opens at night, up high. Cold to hold. The Hour Key and the Hour Offering want it.');
  M('skyfeather', 'Skyfeather', 'wing', { a: '#ffffff', b: '#c9d8ff', c: '#8a9ad0' }, 'From a skyhawk, or a stormcrow. Lighter than it looks. The Frost Key and the Storm Offering want it.');
  M('storm_glass', 'Storm Glass', 'flint', { a: '#ffffff', b: '#c9d8ff', c: '#6a7aa8', d: '#2a2e46', e: '#e8f0ff' }, 'Sand that lightning found. Only a rod you raised in a thunderstorm makes it. The Storm Key needs it.', { glow: 1 });
  M('ancient_gear', 'Old Gear', Ico(['..a.a.a..', '.abbbbba.', 'abccccbba', '.bc...cb.', 'abc...cba', '.bc...cb.', 'abbccccba', '.abbbbba.', '..a.a.a..'], { a: '#7a5218', b: '#c9a44a', c: '#ffd35a' }), 'A brass gear from the old observatories. It still wants to turn. The Hour Key and the Escapement want it.');
  M('icebrick', 'Ice Brick', 'brick', { a: '#ffffff', b: '#c9fff6', c: '#8fd0d8', d: '#4a8a9a', e: '#ffffff' }, 'Packed snow, cut square. It never melts. Place it to build.', { type: 'block', tile: ICEBRICK });
  M('lightning_rod', 'Lightning Rod', Ico(['....a', '...ab', '..ab.', '.ab..', 'cb...', 'cc...'], { a: '#ffd35a', b: '#c98a2b', c: '#5f5a69' }), 'Raise it in open ground. In a thunderstorm lightning picks the rod over you, and leaves storm glass at its foot.', { type: 'block', tile: LROD, stack: 10 });
  M('storm_bell', 'Storm Bell', 'lamp', { a: '#ffffff', b: '#c9d8ff', c: '#6a7aa8', d: '#2a2e46', e: '#ffd35a' }, 'Ring it under the open sky to call a thunderstorm. It cracks.', { type: 'summon', summon: 'thunder', stack: 10 });
  R('anvil', 'skyiron_bar', 1, { skyiron_ore: 3, coal: 1 }, { lvl: 3 });
  R('mason', 'icebrick', 2, { snow: 3 });
  R('anvil', 'lightning_rod', 1, { copper_bar: 3, iron_bar: 1 }, { lvl: 2 });
  R('anvil', 'storm_bell', 1, { storm_glass: 1, skyiron_bar: 1, copper_bar: 2 }, { lvl: 3 });
  Object.assign(GLINT, { sunstone: '#fff1a8', skyiron_ore: '#c9d8ff', storm_glass: '#e8f0ff' });
}

// ---------------- art ----------------
function buildWonderArt() {
  for (const t of [SUNSTONE, SKYIRON, SCORCH]) NATURAL.add(t);
  const pal = (p, seed) => (px, py, v) => shade(p, hh(px >> 1, py >> 1, seed + v * 7) * .55 + hh(px, py, seed + v * 13) * .45);
  const ST = ['#2b4250', '#375666', '#456a7a', '#22343f'];
  TEX[SUNSTONE] = genTex((px, py, v) => { const r = hh(px >> 1, py >> 1, 1801 + v); return r > .62 ? (hh(px, py, 1802 + v) > .45 ? '#fff1a8' : '#ffd35a') : r > .5 ? '#c98a2b' : pal(ST, 1803)(px, py, v); });
  TEX[SKYIRON] = genTex((px, py, v) => { const r = hh(px >> 1, py >> 1, 1811 + v); return r > .66 ? (hh(px, py, 1812) > .5 ? '#d8e4ff' : '#8a9ad0') : r > .54 ? '#4a5a8a' : pal(['#2a2a3e', '#34344c', '#40405a', '#1e1e2e'], 1813)(px, py, v); });
  TEX[SCORCH] = genTex((px, py, v) => { const r = hh(px, py, 1821 + v); return r > .93 ? '#c9d8ff' : r > .86 ? '#ff8a3d' : pal(['#2a2a3e', '#3a3a52', '#4a4a64', '#1e1e2a'], 1822)(px, py, v); });
  TEX[ICEBRICK] = genTex((px, py, v) => { const row = py >> 2, off = row % 2 ? 4 : 0; if (py % 4 === 3 || (px + off) % 8 === 0) return '#8fd0d8'; return hh(px, py, 1831 + v) > .8 ? '#ffffff' : py % 4 === 0 ? '#e8ffff' : '#c9fff6'; });
  TEX[SUNBLOOM] = genTex(mask8(['........', '..#.#...', '.#####..', '..###...', '...#....', '...#..#.', '.#.#.#..', '..###...'], (px, py) => py < 4 ? (px === 3 && py === 2 ? '#c94a2a' : py === 1 || py === 3 ? '#ffd35a' : '#fff1a8') : '#5a8a3a'));
  TEX[MOONPETAL] = genTex(mask8(['...#....', '..###...', '.##.##..', '..###...', '...#....', '...#....', '..##....', '...#....'], (px, py) => py < 4 ? (py === 2 && px === 3 ? '#ffffff' : '#c9d8ff') : '#6a7aa8'));
  for (const id of [SUNSHRINE, TELESCOPE, FROSTGATE, CLOCKGATE, STORMGATE, RINGGATE, LROD]) TEX[id] = TEX[DIRT];
  const R = (rows, p) => spr(rows, p);
  STN_SPR[SUNSHRINE] = { img: R(['...aaaa...', '..abccba..', '.abcddcba.', '..abccba..', '...abba...', '....bb....', '...bbbb...', '..aaaaaa..'], { a: '#8a7a68', b: '#c9a44a', c: '#ffd35a', d: '#fff1a8' }), ox: -1, oy: 0 };
  STN_SPR[TELESCOPE] = { img: R(['..........aab', '........aabbc', '......aabbc..', '....aabbc....', '..aabbc......', '...bc........', '...d.........', '..ddd........', '.d.d.d.......', 'd..d..d......'], { a: '#c98a2b', b: '#ffd35a', c: '#7a5218', d: '#5f5a69' }), ox: -2, oy: -2 };
  STN_SPR[LROD] = { img: R(['.a.', '.a.', 'aba', '.b.', '.b.', '.b.', '.b.', '.b.', '.b.', 'cbc', 'ccc'], { a: '#ffd35a', b: '#c98a2b', c: '#5f5a69' }), ox: 2, oy: -3 };
  // the gates: tall arched doors, each with its own mark, and the empty ring
  const door = (P, mark) => { const W = 24, H = 38, [c, x] = mk(W, H);
    x.fillStyle = P.frame; x.beginPath(); x.moveTo(0, H); x.lineTo(0, 12); x.arc(12, 12, 12, PI, 0); x.lineTo(W, H); x.fill();
    x.fillStyle = P.edge; x.beginPath(); x.moveTo(2, H); x.lineTo(2, 12); x.arc(12, 12, 10, PI, 0); x.lineTo(W - 2, H); x.fill();
    x.fillStyle = P.leaf; x.beginPath(); x.moveTo(4, H); x.lineTo(4, 13); x.arc(12, 13, 8, PI, 0); x.lineTo(W - 4, H); x.fill();
    x.fillStyle = P.dark; x.fillRect(11, 6, 2, H - 6); for (let y = 16; y < H - 2; y += 7) { x.fillRect(5, y, 14, 1); }
    x.fillStyle = P.hi; x.fillRect(5, 13, 1, H - 15); x.fillRect(13, 6, 1, H - 8);
    mark(x); x.fillStyle = P.frame; x.fillRect(0, H - 2, W, 2); return c; };
  STN_SPR[FROSTGATE] = { img: door({ frame: '#2a5a6a', edge: '#8fd0d8', leaf: '#62a9bc', dark: '#2a5a6a', hi: '#c9fff6' }, x => { x.fillStyle = '#e8ffff'; for (const [a, b] of [[12, 20], [9, 23], [15, 23], [12, 26], [12, 23]]) x.fillRect(a - 1, b - 1, 2, 2); x.fillStyle = '#ffffff'; for (let k = 0; k < 7; k++) x.fillRect(4 + k * 3, 4 + (k % 2) * 2, 1, 3 + (k % 3)); }), ox: -8, oy: -30 };
  STN_SPR[CLOCKGATE] = { img: door({ frame: '#3a2a14', edge: '#c9a44a', leaf: '#7a5a28', dark: '#3a2a14', hi: '#ffd35a' }, x => { x.fillStyle = '#ffd35a'; x.fillRect(8, 18, 8, 1); x.fillRect(8, 28, 8, 1); for (let k = 0; k < 4; k++) { x.fillRect(9 + k, 19 + k, 6 - 2 * k, 1); x.fillRect(9 + k, 27 - k, 6 - 2 * k, 1); } x.fillStyle = '#fff1a8'; x.fillRect(11, 26, 2, 1); }), ox: -8, oy: -30 };
  STN_SPR[STORMGATE] = { img: door({ frame: '#1e2236', edge: '#6a7aa8', leaf: '#3a4268', dark: '#1e2236', hi: '#9ab0ff' }, x => { x.fillStyle = '#e8f0ff'; for (const [a, b, w] of [[13, 15, 2], [12, 17, 2], [11, 19, 2], [10, 21, 5], [13, 22, 2], [12, 24, 2], [11, 26, 2], [10, 28, 2]]) x.fillRect(a, b, w, 2); }), ox: -8, oy: -30 };
  STN_SPR[RINGGATE] = { img: (() => { const [c, x] = mk(40, 44); for (let Y = 0; Y < 40; Y++) for (let X = 0; X < 40; X++) { const d = hypot(X - 19.5, Y - 19.5), a = (atan2(Y - 19.5, X - 19.5) + TAU) % TAU, gap = (a > .5 && a < .8) || (a > 3.6 && a < 3.85); if (d > 14 && d < 19.5 && !gap) { x.fillStyle = d < 15.5 ? '#ffd35a' : d < 17 ? '#a8a0b8' : d < 18.5 ? '#6a6480' : '#3a3450'; x.fillRect(X, Y, 1, 1); } } x.fillStyle = '#5f5a69'; x.fillRect(12, 38, 16, 6); x.fillStyle = '#8a84a0'; x.fillRect(13, 38, 14, 1); return c; })(), ox: -16, oy: -36 };
  PROP.clockface = (() => { const [c, x] = mk(23, 23); x.fillStyle = '#3a2a14'; x.beginPath(); x.arc(11.5, 11.5, 11, 0, TAU); x.fill(); x.fillStyle = '#e8dcb0'; x.beginPath(); x.arc(11.5, 11.5, 9, 0, TAU); x.fill(); x.fillStyle = '#7a5a28'; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; x.fillRect(round(11 + cos(a) * 7.5), round(11 + sin(a) * 7.5), 2, 2); } x.strokeStyle = '#2a1a0a'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(11.5, 11.5); x.lineTo(11.5, 4.5); x.moveTo(11.5, 11.5); x.lineTo(16, 14); x.stroke(); x.fillStyle = '#c94a2a'; x.fillRect(11, 11, 2, 2); return c; })();
}
