// ============================================================
//  Past the three floors. The Dawnforge was more than a ring: it had a
//  quench to cool what it made, a clock to turn it, a storm to breathe on
//  it, and around all of it the cold it kept out. Each is a world of its
//  own now, reached through a gate on the surface:
//    THE LONG WINTER  (the Frost Gate)        snowfields, frozen pines, glaciers.
//                     The cold builds in you on open ground: keep near fire,
//                     wear something warm, eat something hot.
//    THE HOURWORKS    (the Stopped Clocktower) brass plains, pendulum country,
//                     hourglass dunes. Springs throw you high, belts carry
//                     you, and when the great chime rings, the hour holds:
//                     everything but you stands still for a moment.
//    THE THUNDERHEAD  (the Stormspire)         cloudbanks, anvil columns, the
//                     still eye. Wind pushes you about and lightning finds
//                     whoever stands out in the open.
//    THE OUTSIDE      (the Ringstair)          pale ash, drifting pieces of the
//                     other worlds, ember fields. It is dark; away from any
//                     light the Hollow notices you.
//  Each has its own ore, worked at its own forge, a guardian, and places.
// ============================================================
const FROSTSNOW = 180, PERMAFROST = 181, GLACIER = 182, RIMEORE = 183, RIMEICE = 184, ICEFLOWER = 185, FROSTGRASS = 186,
  BRASSPLATE = 187, COGSTONE = 188, HOURORE = 189, SPRINGPAD = 190, BELTL = 191, BELTR = 192, GLASSSAND = 193, GEARBLOOM = 194,
  CLOUD = 195, STORMCLOUD = 196, STORMORE = 197, CHARGED = 198, CLOUDPLAT = 199, STATICGRASS = 200,
  ASHGLASS = 201, VOIDROCK = 202, DAWNORE = 203, LASTEMBER = 204, COLDHEARTH = 205, DRIFTSHARD = 206,
  RIMEFORGE = 207, ESCAPEMENT = 208, THUNDERANVIL = 209, DAWNANVIL = 210;
const W_FROST = 43, W_BRASS = 44, W_CLOUD = 45, W_VOID = 46;
defT(FROSTSNOW, { name: 'Deep Snow', solid: true, full: true, hard: 12, hi: '#ffffff', dust: '#d8eef4', cap: 2 });
defT(PERMAFROST, { name: 'Permafrost', solid: true, full: true, hard: 36, hi: '#8aa4b4', dust: '#4a5a6a' });
defT(GLACIER, { name: 'Glacier Ice', solid: true, full: true, hard: 46, hi: '#e8ffff', dust: '#8fd0d8', light: [.02, .05, .07] });
defT(RIMEORE, { name: 'Rimesteel Ore', solid: true, full: true, hard: 90, hi: '#ffffff', dust: '#9adcf0', light: [.05, .1, .14] });
defT(RIMEICE, { name: 'Lake Ice', solid: true, full: true, hard: 18, hi: '#ffffff', dust: '#c9fff6' });
defT(ICEFLOWER, { name: 'Frostbell', decor: true, hard: 1, ground: true, light: [.06, .14, .18], dust: '#c9fff6' });
defT(FROSTGRASS, { decor: true, hard: 1, ground: true, dust: '#d8eef4' });
defT(BRASSPLATE, { name: 'Brass Plate', solid: true, full: true, hard: 40, hi: '#fff1a8', dust: '#c9a44a' });
defT(COGSTONE, { name: 'Cogstone', solid: true, full: true, hard: 50, hi: '#a89a7a', dust: '#5a4a30' });
defT(HOURORE, { name: 'Hourbrass Ore', solid: true, full: true, hard: 100, hi: '#fff1a8', dust: '#ffd35a', light: [.16, .12, .04] });
defT(SPRINGPAD, { name: 'Mainspring Pad', solid: true, full: true, hard: Infinity, hi: '#ffd35a', dust: '#c9a44a' });
defT(BELTL, { name: 'Running Belt', solid: true, full: true, hard: Infinity, hi: '#c9a44a', dust: '#5a4a30' });
defT(BELTR, { name: 'Running Belt', solid: true, full: true, hard: Infinity, hi: '#c9a44a', dust: '#5a4a30' });
defT(GLASSSAND, { name: 'Hourglass Sand', solid: true, full: true, hard: 10, hi: '#fff8e0', dust: '#e8d8a0', cap: 3 });
defT(GEARBLOOM, { name: 'Gearbloom', decor: true, hard: 1, ground: true, light: [.14, .1, .03], dust: '#ffd35a' });
defT(CLOUD, { name: 'Thundercloud', solid: true, full: true, hard: 10, hi: '#ffffff', dust: '#c8d0e8', cap: 2 });
defT(STORMCLOUD, { name: 'Stormstone', solid: true, full: true, hard: 44, hi: '#8a94b4', dust: '#3a4060' });
defT(STORMORE, { name: 'Stormsilver Ore', solid: true, full: true, hard: 110, hi: '#ffffff', dust: '#9ab0ff', light: [.1, .12, .26] });
defT(CHARGED, { name: 'Charged Crystal', solid: true, full: true, hard: 60, hi: '#e8f0ff', dust: '#9ab0ff', light: [.18, .2, .45] });
defT(CLOUDPLAT, { name: 'Cloud Ledge', plat: true, hard: 4, dust: '#ffffff' });
defT(STATICGRASS, { decor: true, hard: 1, ground: true, light: [.04, .05, .12], dust: '#9ab0ff' });
defT(ASHGLASS, { name: 'Ashglass', solid: true, full: true, hard: 30, hi: '#e8e0f0', dust: '#a8a0b8', cap: 4 });
defT(VOIDROCK, { name: 'Voidrock', solid: true, full: true, hard: 60, hi: '#4a4458', dust: '#1a1626' });
defT(DAWNORE, { name: 'Dawnsteel Ore', solid: true, full: true, hard: 120, hi: '#fff1a8', dust: '#ff9a3d', light: [.4, .22, .06] });
defT(LASTEMBER, { name: 'Last Ember', decor: true, hard: 1, ground: true, light: [.55, .26, .06], dust: '#ff9a3d' });
defT(COLDHEARTH, { name: 'The Cold Hearth', dyn: true, hard: Infinity, light: [.3, .2, .12], dust: '#8a84a0' });
defT(DRIFTSHARD, { name: 'Driftshard', solid: true, full: true, hard: 50, hi: '#e0d2ff', dust: '#7a6ab0', light: [.06, .04, .1] });
defStn(RIMEFORGE, 'Rime Forge', 'rime_forge', { light: [.3, .55, .7], dust: '#8fd0d8', hard: 30 });
defStn(ESCAPEMENT, 'Escapement', 'escapement', { light: [.5, .4, .15], dust: '#c9a44a', hard: 30 });
defStn(THUNDERANVIL, 'Thunder Anvil', 'thunder_anvil', { light: [.35, .4, .8], dust: '#6a7aa8', hard: 30 });
defStn(DAWNANVIL, 'Dawnforge', 'dawnforge', { light: [.9, .55, .2], dust: '#ff9a3d', hard: 30 });
Object.assign(STATIONS, { [RIMEFORGE]: 'anvil', [ESCAPEMENT]: 'anvil', [THUNDERANVIL]: 'anvil', [DAWNANVIL]: 'anvil' });
// how hot each forge runs: it makes everything a lower one makes, and its own world's metal
const ANVIL_LVL = { [ANVIL]: 1, [ANVIL2]: 2, [SLAGFORGE]: 3, [RIMEFORGE]: 4, [ESCAPEMENT]: 5, [THUNDERANVIL]: 6, [DAWNANVIL]: 7 };
const LVL_SEEN = { 3: 'seen1', 4: 'seen4', 5: 'seen5', 6: 'seen6', 7: 'seen7' };
defM(FROSTSNOW, { hp: 3, k: 'soil', y: [['snow', 1.5]] }); defM(PERMAFROST, { hp: 9, tier: 7, k: 'stone', y: [['permafrost', 2]] });
defM(GLACIER, { hp: 10, tier: 8, k: 'glass', y: [['glacier_ice', 2]] }); defM(RIMEORE, { hp: 16, tier: 9, k: 'ore', y: [['rime_ore', 3], ['glacier_ice', .4]] });
defM(RIMEICE, { hp: 4, tier: 2, k: 'glass', y: [['glacier_ice', .6]] });
defM(BRASSPLATE, { hp: 10, tier: 9, k: 'stone', y: [['brassplate', 2]] }); defM(COGSTONE, { hp: 12, tier: 9, k: 'stone', y: [['cogstone', 2], ['ancient_gear', .02]] });
defM(HOURORE, { hp: 18, tier: 10, k: 'ore', y: [['hour_ore', 3], ['cogstone', .4]] }); defM(GLASSSAND, { hp: 2, k: 'sand', y: [['glass_sand', 1.5]], fall: 1 });
defM(CLOUD, { hp: 2, k: 'soil', y: [['cloud_tuft', 1]] }); defM(STORMCLOUD, { hp: 12, tier: 10, k: 'stone', y: [['stormstone', 2]] });
defM(STORMORE, { hp: 20, tier: 11, k: 'ore', y: [['storm_ore', 3], ['stormstone', .4]] }); defM(CHARGED, { hp: 12, tier: 10, k: 'glass', y: [['charged_shard', 1.2]] });
defM(ASHGLASS, { hp: 9, tier: 10, k: 'stone', y: [['ashglass', 2]] }); defM(VOIDROCK, { hp: 14, tier: 11, k: 'stone', y: [['voidrock', 2]] });
defM(DAWNORE, { hp: 22, tier: 12, k: 'ore', y: [['dawn_ore', 3], ['voidrock', .3]] }); defM(DRIFTSHARD, { hp: 12, tier: 10, k: 'glass', y: [['drift_shard', 1.5]] });
defM([RIMEFORGE, ESCAPEMENT, THUNDERANVIL, DAWNANVIL], { hp: 8, tier: 1, k: 'stone' });
MAT[RIMEFORGE].y = [['rime_forge', 1]]; MAT[ESCAPEMENT].y = [['escapement', 1]]; MAT[THUNDERANVIL].y = [['thunder_anvil', 1]]; MAT[DAWNANVIL].y = [['dawnforge', 1]];
Object.assign(PLUCK, { [ICEFLOWER]: [['frostbell', 1, 2]], [GEARBLOOM]: [['gearbloom', 1, 1], ['ancient_gear', 0, 1]], [STATICGRASS]: [['fiber', 1, 1], ['charged_shard', 0, 1]], [LASTEMBER]: [['last_ember', 1, 1]], [FROSTGRASS]: [['fiber', 1, 2]] });
Object.assign(BIOME, {
  tundra: 'THE SNOWFIELDS', pines: 'THE FROZEN PINES', glacier: 'THE GLACIER STAIR', winter_u: 'UNDER THE ICE', winter_d: 'THE FROZEN DEEP',
  gearplains: 'THE BRASS PLAINS', pendulums: 'PENDULUM COUNTRY', hourglass: 'THE HOURGLASS DUNES', hour_u: 'THE WORKINGS', hour_d: 'THE MOVEMENT',
  cloudbank: 'THE CLOUDBANK', anvilhead: 'THE ANVILHEADS', eye: 'THE STILL EYE', storm_u: 'INSIDE THE CLOUD', storm_d: 'THE THUNDERCORE',
  ashen: 'THE PALE ASH', shards: 'THE DRIFTING PIECES', cinders: 'THE EMBER FIELDS', outside_u: 'UNDER THE ASH', outside_d: 'THE NOTHING UNDER'
});
DIMP.push(
  { key: 'winter', name: 'THE LONG WINTER', short: 'the Long Winter', sub: 'where the mornings went to cool', col: '#c9fff6', base: 150, deep: EH - 70, bio: ['tundra', 'pines', 'glacier'], aid: GLASSROOT, wall: W_FROST,
    sun: [.66, .74, .86], dn: .45, sky: [[8, 14, 30], [30, 54, 86], [130, 170, 200]], tone: [[84, 110, 136], [52, 72, 96]], arena: 680, arenaR: 30, boss: 'winterstag',
    place: "THE STAG'S CIRQUE", placeSub: 'antlers in the ice, taller than trees', loot: 'winterruin', ev: 'whiteout', floor: GLACIER, dplace: 'lodge', ruin: [ICEBRICK, W_FROST], flash: '200,240,255', lakeHome: 'tundra', under: [[22, 34, 48], [12, 22, 34]] },
  { key: 'hour', name: 'THE HOURWORKS', short: 'the Hourworks', sub: 'the clockwork that turned the ring', col: '#ffd35a', base: 140, deep: EH - 66, bio: ['gearplains', 'pendulums', 'hourglass'], aid: RUSTCHAIN, wall: W_BRASS,
    sun: [.74, .62, .42], dn: .55, sky: [[26, 16, 8], [86, 58, 26], [196, 148, 76]], tone: [[104, 76, 44], [66, 48, 28]], arena: 720, arenaR: 32, boss: 'horologist',
    place: 'THE MAINSPRING', placeSub: 'every gear in this world turns toward it', loot: 'hourruin', ev: 'stoppedhour', floor: BRASSPLATE, dplace: 'workshop', ruin: [COGSTONE, W_BRASS], flash: '255,220,140', lakes: 0, under: [[40, 30, 18], [26, 18, 10]] },
  { key: 'storm', name: 'THE THUNDERHEAD', short: 'the Thunderhead', sub: 'the storm that breathed on the forge', col: '#9ab0ff', base: 160, deep: EH - 70, bio: ['cloudbank', 'anvilhead', 'eye'], aid: GLASSROOT, wall: W_CLOUD,
    sun: [.5, .54, .7], dn: .32, sky: [[8, 10, 22], [32, 38, 70], [86, 96, 140]], tone: [[66, 72, 110], [40, 44, 72]], arena: 760, arenaR: 30, boss: 'stormwright',
    place: 'THE EYE OF THE STORM', placeSub: 'the only still air for a thousand miles', loot: 'stormruin', ev: 'tempest', floor: STORMCLOUD, dplace: 'rodtower', ruin: [STORMCLOUD, W_CLOUD], flash: '200,210,255', lakes: 0, under: [[26, 30, 50], [14, 16, 30]] },
  { key: 'outside', name: 'THE OUTSIDE', short: 'the Outside', sub: 'where the heat goes out', col: '#ff9a3d', base: 150, deep: EH - 72, bio: ['ashen', 'shards', 'cinders'], aid: RUSTCHAIN, wall: W_VOID,
    sun: [.17, .15, .2], dn: .08, sky: [[2, 2, 6], [10, 8, 18], [30, 22, 34]], tone: [[34, 28, 46], [20, 18, 30]], arena: 820, arenaR: 34, boss: 'hollowking',
    place: 'THE COLD HEARTH', placeSub: 'the first fire, gone out', loot: 'outsideruin', ev: 'longdark', floor: VOIDROCK, dplace: 'cairn', ruin: [VOIDROCK, W_VOID], flash: '255,200,140', lakeHome: 'ashen', under: [[14, 12, 20], [6, 5, 10]] }
);
// ---------------- the shape of their lands ----------------
Object.assign(DLF, {
  tundra: x => (fbm(x * .004, 101.1, 3) - .5) * 30 + (fbm(x * .04, 101.7, 2) - .5) * 3,
  pines: x => (fbm(x * .008, 102.2, 3) - .5) * 64 + (fbm(x * .05, 102.9, 2) - .5) * 5,
  glacier: x => { const r = 1 - abs(fbm(x * .006, 103.3, 3) * 2 - 1); return round((-12 - r * r * 64) / 5) * 5 + (fbm(x * .08, 103.9, 2) - .5) * 1.5; },
  gearplains: x => round(((fbm(x * .005, 111.1, 3) - .5) * 52) / 3) * 3,
  pendulums: x => (fbm(x * .007, 112.2, 3) - .5) * 44 + sin(x * .05) * 3,
  hourglass: x => 6 - abs(sin(x * .03 + fbm(x * .01, 113.3, 2) * 5)) * 14 + (fbm(x * .004, 113.7, 2) - .5) * 16,
  cloudbank: x => (fbm(x * .006, 121.1, 3) - .5) * 70 + sin(x * .02) * 6,
  anvilhead: x => { const n = fbm(x * .01, 122.2, 3); return (n - .5) * 90 - max(0, n - .6) * 170; },
  eye: x => (fbm(x * .003, 123.3, 2) - .5) * 14 + 8,
  ashen: x => (fbm(x * .005, 131.1, 3) - .5) * 36,
  shards: x => (fbm(x * .012, 132.2, 3) - .5) * 64 + (hh(floor(x / 7), 133, 7) - .5) * 6,
  cinders: x => (fbm(x * .008, 134.4, 3) - .5) * 50 - 6
});
function realmColumn(x) {
  const D = DIMP[DIM], hs = dimSurf(x), b = dimBio(x), dd = 3 + floor(fbm(x * .07, 50 + DIM, 2) * 4), prot = protectDepth(x), win = inWindow(x, 2);
  heights[x] = hs; SKYL[x] = hs + 3;
  const LK = win ? null : dimLakeAt(x), lvl = LK ? LK.lv : -1;
  for (let y = 0; y < WH; y++) {
    const i = y * WW + x, d = y - hs; let t = AIR, w = 0;
    if (y >= WH - 3) t = BEDROCK;
    else if (d < 0) { if (lvl > 0 && y >= lvl) t = DIM === 4 && y === lvl ? RIMEICE : WATER; }
    else {
      const deep = y >= DEEP_Y + (fbm(x * .04, 3.3 + DIM, 2) - .5) * 12; if (d > 2) w = D.wall;
      t = realmGround(x, y, d, dd, deep, b);
      let cave = 0;
      if (d >= max(1, prot)) {
        if (deep) { const v = fbm(x * .018, y * .04 + 300 + DIM * 500, 3); if (v > .57) cave = v > .61 ? 2 : 1; }
        else if (d >= 6) {
          const wid = .02 + min(.012, d * .00018);
          if (abs(fbm(x * .021, y * .032 + 100 + DIM * 500, 2) - .5) < wid || abs(fbm(x * .016 + 50, y * .027 + 300 + DIM * 500, 2) - .5) < wid * .8) cave = 1;
          else if (d > 14) { const cv = fbm(x * .0105, y * .019 + 700 + DIM * 500, 3); if (cv > .66) cave = cv > .7 ? 2 : 1; }
        }
      }
      if (cave) { t = AIR; if (cave === 2) w = 0; } else t = realmOre(x, y, d, t, deep);
    }
    tiles[i] = t; walls[i] = w;
  }
  realmDecor(x, hs, b);
  for (const nx of [x - 1, x + 1]) { const hn = dimSurf(nx); if (hs - hn < 5 || inWindow(x, 2)) continue; for (let y = hn; y < hs; y++) { const i = y * WW + x; if (!tiles[i] || (TP[tiles[i]].decor && !TP[tiles[i]].dyn)) tiles[i] = D.aid; } }
}
function realmGround(x, y, d, dd, deep, b) {
  const n = fbm(x * .06, y * .06 + 20 + DIM * 7, 2);
  if (DIM === 4) { if (d < dd) return b === 'glacier' && d > 0 ? GLACIER : FROSTSNOW; if (deep) return abs(fbm(x * .05, y * .05 + 40, 3) - .5) < .035 ? GLACIER : PERMAFROST; return n > .7 || (b === 'glacier' && n > .55) ? GLACIER : PERMAFROST; }
  if (DIM === 5) { if (b === 'hourglass' && d < dd + 7) return d < 1 && n > .6 ? BRASSPLATE : GLASSSAND; if (d < 2) return BRASSPLATE; return deep && n > .66 ? BRASSPLATE : COGSTONE; }
  if (DIM === 6) { if (d < dd) return CLOUD; if (deep) return abs(fbm(x * .05, y * .05 + 40, 3) - .5) < .02 ? CHARGED : STORMCLOUD; return d < dd + 4 && n > .5 ? CLOUD : STORMCLOUD; }
  if (d < dd) return ASHGLASS; if (b === 'shards' && n > .68) return DRIFTSHARD; return VOIDROCK;
}
function realmOre(x, y, d, t, deep) {
  const o = fbm(x * .11, y * .11 + 120 + DIM * 13, 2);
  if (DIM === 4) { if (d > 12 && o > (deep ? .74 : .785)) return RIMEORE; if (d > 6 && fbm(x * .12, y * .12 + 95, 2) > .81) return COAL; if (d > 20 && fbm(x * .1, y * .1 + 97, 2) > .82) return IRON; }
  else if (DIM === 5) { if (d > 12 && o > (deep ? .75 : .79)) return HOURORE; if (d > 6 && fbm(x * .12, y * .12 + 95, 2) > .8) return COPPER; if (d > 18 && fbm(x * .1, y * .1 + 97, 2) > .83) return TIN; }
  else if (DIM === 6) { if (d > 12 && o > (deep ? .76 : .8)) return STORMORE; if (d > 8 && fbm(x * .12, y * .12 + 95, 2) > .83) return CHARGED; }
  else { if (d > 14 && o > (deep ? .76 : .8)) return DAWNORE; if (deep && fbm(x * .13, y * .13 + 77, 2) > .82) return EMBER; if (d > 6 && fbm(x * .12, y * .12 + 95, 2) > .82) return COAL; }
  return t;
}
function realmDecor(x, hs, b) {
  const i = (hs - 1) * WW + x; if (hs < 4 || tiles[i] !== AIR || !TP[tiles[hs * WW + x]].solid || inWindow(x, 1)) return; const r = hh(x, 77, SEED + DIM);
  if (DIM === 4) { if (r < .04) tiles[i] = ICEFLOWER; else if (r < (b === 'tundra' ? .2 : .1)) tiles[i] = FROSTGRASS; }
  else if (DIM === 5) { if (r < .05) tiles[i] = GEARBLOOM; else if (r < .08) tiles[i] = PEBBLE; }
  else if (DIM === 6) { if (r < (b === 'eye' ? .2 : .09)) tiles[i] = STATICGRASS; }
  else { if (r < (b === 'cinders' ? .07 : .015)) tiles[i] = LASTEMBER; else if (r < .06) tiles[i] = BONES; }
}
// ---------------- step two: what stands on the land ----------------
function realmFinish(cx, x0, x1, here) {
  const D = DIMP[DIM];
  if (DIM === 4) {
    for (let x = x0 + randi(1, 6); x < x1; x += randi(5, 11)) { if (dimBio(x) !== 'pines' || RESV[x] || inWindow(x, 4)) continue; const gy = heights[x]; if (!TP[tileAt(x, gy)].solid || tileAt(x, gy - 1) !== AIR && !TP[tileAt(x, gy - 1)].decor) continue; propC(PINES[randi(0, PINES.length - 1)], x, gy, { lit: 1 }); }
    for (let x = x0 + randi(2, 9); x < x1; x += randi(9, 20)) { if (dimBio(x) !== 'glacier' || RESV[x] || inWindow(x, 4)) continue; const gy = heights[x], h = randi(3, 7); for (let y = gy - h; y < gy; y++) if (tileAt(x, y) === AIR || TP[tileAt(x, y)].decor) tiles[y * WW + x] = GLACIER; }
  } else if (DIM === 5) {
    for (let x = x0 + randi(4, 20); x < x1; x += randi(34, 60)) { if (RESV[x] || inWindow(x, 6)) continue; const gy = heights[x]; if (abs(heights[x - 1] - gy) > 1 || abs(heights[x + 1] - gy) > 1) continue; if (TP[tileAt(x, gy)].solid) tiles[gy * WW + x] = SPRINGPAD; for (let y = gy - 14; y < gy; y++) if (tileAt(x, y) !== AIR && !TP[tileAt(x, y)].solid) tiles[y * WW + x] = AIR; }
    for (let k = floor(x0 / 70); k <= floor(x1 / 70); k++) {
      const bx = k * 70 + 10 + floor(hh(k, 2101, SEED) * 40); if (!here(bx) || dimBio(bx) !== 'gearplains' || hh(k, 2102, SEED) > .6 || inWindow(bx, 20)) continue;
      const len = 6 + floor(hh(k, 2103, SEED) * 8), gy = heights[bx], dir = hh(k, 2104, SEED) < .5 ? BELTL : BELTR; if (![...Array(len).keys()].every(q => heights[bx + q] === gy)) continue;
      for (let q = 0; q < len; q++) tiles[gy * WW + bx + q] = dir;
    }
    for (let x = x0 + randi(3, 12); x < x1; x += randi(26, 46)) { if (dimBio(x) !== 'pendulums' || RESV[x] || inWindow(x, 6)) continue; const gy = heights[x]; if (!TP[tileAt(x, gy)].solid) continue; propC(PENDULUM, x, gy, { lit: 1, light: [.3, .24, .08] }); }
  } else if (DIM === 6) {
    // ledges of cloud to climb, high over the bank
    for (let x = x0 + randi(2, 12); x < x1; x += randi(14, 26)) { if (RESV[x] || inWindow(x, 6)) continue; const gy = heights[x], y = gy - randi(9, 26), len = randi(5, 11); for (let q = 0; q < len; q++) if (tileAt(x + q, y) === AIR && heights[x + q] > y + 4) tiles[y * WW + x + q] = CLOUDPLAT; }
    for (let x = x0 + randi(4, 14); x < x1; x += randi(20, 40)) { if (dimBio(x) !== 'anvilhead' || RESV[x] || inWindow(x, 4)) continue; const gy = heights[x], h = randi(4, 9); for (let y = gy - h; y < gy; y++) if (tileAt(x, y) === AIR) tiles[y * WW + x] = CHARGED; }
  } else {
    for (let x = x0 + randi(2, 8); x < x1; x += randi(9, 18)) { if (RESV[x] || inWindow(x, 4)) continue; const gy = heights[x]; if (!TP[tileAt(x, gy)].solid || tileAt(x, gy - 1) !== AIR && !TP[tileAt(x, gy - 1)].decor) continue; propC(DEADTREES[randi(0, DEADTREES.length - 1)], x, gy, { lit: 1 }); }
    // pieces of other worlds, hanging in the dark
    for (let k = floor(x0 / 60); k <= floor(x1 / 60); k++) {
      const sx = k * 60 + 10 + floor(hh(k, 2201, SEED) * 40); if (!here(sx) || hh(k, 2202, SEED) > .45 || inWindow(sx, 30)) continue;
      const sy = heights[sx] - 18 - floor(hh(k, 2203, SEED) * 22), r = 2 + floor(hh(k, 2204, SEED) * 3), mats = [SLAG, ROOTWOOD, PALESTONE, GLACIER, COGSTONE, STORMCLOUD, DRIFTSHARD], m = mats[floor(hh(k, 2205, SEED) * mats.length)];
      for (let dy = -r; dy <= r; dy++) for (let dx = -r - 1; dx <= r + 1; dx++) if ((dx * dx) / ((r + 1) * (r + 1)) + (dy * dy) / (r * r) <= 1 && tileAt(sx + dx, sy + dy) === AIR) tiles[(sy + dy) * WW + sx + dx] = dy < -r + 1 ? DRIFTSHARD : m;
    }
  }
}
// places of the new worlds: a hunter's lodge, a clockmaker's workshop, a rod tower, a cairn
Object.assign(DPLACE, {
  lodge(x, gy) {
    for (let dx = -8; dx <= 8; dx++) { for (let y = gy - 9; y < gy; y++) setT(x + dx, y, AIR, abs(dx) < 7 && y > gy - 7 ? W_LOG : 0); setT(x + dx, gy, PLANK); for (let y = gy + 1; y < gy + 3; y++) if (!solidAt(x + dx, y)) setT(x + dx, y, PERMAFROST); }
    for (const s of [-1, 1]) for (let y = gy - 6; y < gy; y++) setT(x + s * 7, y, y >= gy - 3 ? AIR : LOGWALL, W_LOG);
    for (let dx = -8; dx <= 8; dx++) { setT(x + dx, gy - 7, THATCH); if (abs(dx) < 6) setT(x + dx, gy - 8, THATCH); if (abs(dx) < 3) setT(x + dx, gy - 9, THATCH); }
    dyn(x - 4, gy - 1, FIRE); chestAt(x + 4, gy - 1, 'winterruin'); dyn(x + 1, gy - 1, BEDROLL);
    lair('lodge', x, gy, [['frostwolf', x - 10, gy], ['frostwolf', x + 10, gy], ['rimewisp', x, gy - 10]], { done: 'THE LODGE IS QUIET', sub: 'its fire is yours now' });
    reserve(x - 9, x + 9, 2); mark('wl' + x, "A HUNTER'S LODGE", 'someone kept a fire here, once', x, gy - 10, 12);
  },
  workshop(x, gy) {
    for (let dx = -10; dx <= 10; dx++) { for (let y = gy - 10; y < gy; y++) setT(x + dx, y, AIR, abs(dx) < 9 && y > gy - 8 ? W_BRASS : 0); setT(x + dx, gy, BRASSPLATE); }
    for (const s of [-1, 1]) for (let y = gy - 8; y < gy; y++) setT(x + s * 9, y, y >= gy - 3 ? AIR : COGSTONE, W_BRASS);
    for (let dx = -9; dx <= 9; dx++) setT(x + dx, gy - 8, COGSTONE); for (let dx = -6; dx <= 6; dx++) setT(x + dx, gy - 4, PLATFORM, W_BRASS);
    chestAt(x + 6, gy - 1, 'hourruin'); chestAt(x - 3, gy - 5, 'hourruin'); lampAt(x, gy - 7, [.7, .55, .2]); tiles[gy * WW + x - 6] = SPRINGPAD;
    lair('workshop', x, gy, [['clockmite', x - 4, gy], ['clockmite', x + 3, gy], ['brasssentry', x, gy - 5]], { done: 'THE WORKSHOP IS STILL', sub: 'nothing ticks in it but you' });
    reserve(x - 11, x + 11, 2); mark('hw' + x, "A CLOCKMAKER'S WORKSHOP", 'the clocks on the walls all disagree', x, gy - 10, 12);
  },
  rodtower(x, gy) {
    for (let dx = -3; dx <= 3; dx++) { for (let y = gy - 20; y < gy; y++) setT(x + dx, y, abs(dx) === 3 ? (y >= gy - 3 ? AIR : STORMCLOUD) : AIR, abs(dx) < 3 ? W_CLOUD : 0); setT(x + dx, gy, STORMCLOUD); }
    for (let y = gy - 6; y > gy - 20; y -= 5) for (let dx = -2; dx <= 2; dx++) setT(x + dx, y, CLOUDPLAT, W_CLOUD);
    for (let y = gy - 20; y < gy; y++) setT(x - 2, y, LADDER, W_CLOUD); for (let dx = -3; dx <= 3; dx++) setT(x + dx, gy - 21, STORMCLOUD); dyn(x, gy - 22, LROD);
    chestAt(x + 2, gy - 1, 'stormruin'); chestAt(x + 2, gy - 16, 'stormruin');
    lair('rodtower', x, gy, [['stormkite', x - 6, gy - 6], ['stormkite', x + 6, gy - 8], ['voltgolem', x + 7, gy]], { done: 'THE TOWER IS STILL', sub: 'only the rod hums' });
    reserve(x - 4, x + 4, 2); mark('rt' + x, 'A ROD TOWER', 'the storm has struck it a thousand times', x, gy - 23, 10);
  },
  cairn(x, gy) {
    for (let dx = -6; dx <= 6; dx++) { for (let y = gy - 10; y < gy; y++) setT(x + dx, y, AIR, 0); setT(x + dx, gy, VOIDROCK); }
    for (let k = 0; k < 6; k++) for (let dx = -5 + k; dx <= 5 - k; dx++) setT(x + dx, gy - 1 - k, k === 5 ? DAWNORE : VOIDROCK);
    for (const s of [-1, 1]) dyn(x + s * 6, gy - 1, TORCH); chestAt(x - 3, gy - 2, 'outsideruin');
    lair('cairn', x, gy, [['shade', x - 8, gy], ['shade', x + 8, gy], ['hollowhound', x + 3, gy]], { done: 'THE CAIRN IS QUIET', sub: 'the dark draws back a little' });
    reserve(x - 7, x + 7, 2); mark('oc' + x, 'A CAIRN OF EMBERS', 'someone tried to keep a light here', x, gy - 8, 10);
  }
});
// ---------------- the sky, the light and the air ----------------
function realmSun(e) {
  const s = G.sun;
  if (e && e.id === 'whiteout') for (let i = 0; i < 3; i++) s[i] = lerp(s[i], .82, .4 * e.fade);
  else if (e && e.id === 'stoppedhour') { s[0] = min(1, s[0] + .06 * e.fade); s[2] *= 1 - .2 * e.fade; }
  else if (e && e.id === 'tempest') { const k = 1 - .3 * e.fade; for (let i = 0; i < 3; i++) s[i] *= k; }
  else if (e && e.id === 'longdark') for (let i = 0; i < 3; i++) s[i] *= 1 - .7 * e.fade;
  if (DIM === 6 && G.bolt > 0) { const k = G.bolt / 20; for (let i = 0; i < 3; i++) s[i] = min(1, s[i] + .6 * k); }
  if (DIM === 7 && G.flags.dawnLit) { s[0] = max(s[0], .52); s[1] = max(s[1], .4); s[2] = max(s[2], .34); G.dn = .5; }
}
function drawRealmSky(c, cx, cy) {
  const W = VS.W, H = VS.H, S = VS.s, D = DIMP[DIM], t = G.time;
  const ctx0 = clamp(floor((cx + VS.vw / 2) / T), 0, WW - 1), cty = (cy + VS.vh / 2) / T;
  const under = smooth((cty - SKYL[ctx0] - 6) / 22), deep = smooth((cty - DEEP_Y + 10) / 16);
  if (under < 1) {
    const [a, m, bt] = D.sky, bands = 18;
    for (let i = 0; i < bands; i++) { const u = i / (bands - 1), col = u < .6 ? mixc(a, m, u / .6) : mixc(m, bt, (u - .6) / .4); c.fillStyle = rgb(col); c.fillRect(0, floor(i * H / bands), W, ceil(H / bands) + 1); }
    if (DIM === 4) {
      for (const s of stars) { c.globalAlpha = .4 + .4 * sin(t * .03 + s[2]); c.fillStyle = '#ffffff'; c.fillRect(floor(s[0] * W), floor(s[1] * H * .7), S - 1 || 1, S - 1 || 1); }
      for (let k = 0; k < 3; k++) { c.fillStyle = k === 1 ? '#7affc0' : k === 2 ? '#c88aff' : '#4fd8c8'; for (let X = 0; X < W; X += S * 2) { const y = H * (.12 + .06 * k) + sin(X * .003 + t * .005 + k * 2) * H * .05, h = H * (.06 + .04 * sin(X * .005 + t * .008 + k)); c.globalAlpha = .1 + .1 * sin(X * .015 + t * .02 + k); c.fillRect(X, round(y), S * 2, round(h)); } }
      c.globalAlpha = .35; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(W * .7 - cx * .006 * S, H * .25, H * .05, 0, TAU); c.fill(); c.globalAlpha = 1;
    } else if (DIM === 5) {
      // great gears turning slowly behind everything
      for (const [gx, gy, r, sp, al] of [[.18, .32, .3, .0016, .16], [.62, .22, .22, -.0022, .14], [.86, .5, .16, .003, .12], [.4, .7, .26, -.0012, .1]]) {
        const X = W * gx - cx * .02 * S, Y = H * gy, R = H * r; c.globalAlpha = al; c.fillStyle = '#ffd35a'; c.beginPath(); c.arc(X, Y, R * .82, 0, TAU); c.fill();
        for (let k = 0; k < 14; k++) { const an = k / 14 * TAU + t * sp; c.save(); c.translate(X + cos(an) * R * .86, Y + sin(an) * R * .86); c.rotate(an); c.fillRect(-R * .07, -R * .09, R * .14, R * .18); c.restore(); }
        c.globalAlpha = al * 1.6; c.fillStyle = rgb(D.sky[1]); c.beginPath(); c.arc(X, Y, R * .5, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
    } else if (DIM === 6) {
      const y = round(H * .56 + (BASE_Y * T + 200 - cy) * .3 * S), w = 640 * S;
      for (let k = 0; k < 2; k++) { const x0 = -(((cx * (.1 + k * .12) * S + t * (.2 + k * .25) * S) % w) + w) % w; c.globalAlpha = .25 + k * .15; for (let x = x0; x < W; x += w) c.drawImage(BGL.clouds.hi, round(x), y - k * 60 * S, w, 200 * S); }
      c.globalAlpha = 1;
      if (G.bolt > 0) { c.globalAlpha = G.bolt / 20 * .5; c.fillStyle = '#e8f0ff'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    } else {
      for (const s of stars) if (s[2] > 3) { c.globalAlpha = .25; c.fillStyle = '#e0d2ff'; c.fillRect(floor(s[0] * W), floor(s[1] * H), S - 1 || 1, S - 1 || 1); }
      // the ring, very close now, and cold
      const lit = G.flags.dawnLit, img = lit && SPR.ringWhole ? SPR.ringWhole : SPR.ring, sz = H * 1.3, rx = W * .55 - cx * .004 * S, ry = H * .42;
      c.globalAlpha = lit ? .9 : .2 + .05 * sin(t * .01); c.drawImage(img, round(rx - sz / 2), round(ry - sz / 2), round(sz), round(sz)); c.globalAlpha = 1;
    }
    const ref = BASE_Y * T, mid = cy + VS.vh * .55, [f1, f2] = D.tone, k1 = DIM === 4 ? 'reach' : DIM === 5 ? 'rust' : DIM === 6 ? 'moor' : 'ash';
    drawLayer(c, k1 + '_far', f1, .2, .07, H * .8 + (ref - mid) * .07 * S, .9 * (1 - under), cx, true, false, .6);
    drawLayer(c, k1 + '_mid', f2, .15, .16, H * .9 + (ref - mid) * .16 * S, .9 * (1 - under), cx, true, false, .6);
  }
  if (under > .01) {
    const [u0, u1] = D.under; c.globalAlpha = under; c.fillStyle = rgb(mixc(u0, u1, deep)); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    const ref = SKYL[ctx0] * T + 400, mid = cy + VS.vh / 2;
    drawLayer(c, 'cave_far', mixc(u0, [255, 255, 255], .12), 0, .08, (ref - mid) * .08 * S, under, cx, false, true);
    drawLayer(c, 'cave_mid', mixc(u0, [0, 0, 0], .2), 0, .2, (ref - mid) * .2 * S, under * .9, cx, false, true);
  }
}
function realmOverlay(c, W, H) {
  const e = G.dev, p = G.p;
  if (DIM === 4) {
    const ch = (p && p.chill) || 0; if (ch > 40) { const a = clamp((ch - 40) / 60, 0, 1) * .35, g = c.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .8); g.addColorStop(0, 'rgba(200,240,255,0)'); g.addColorStop(1, `rgba(200,240,255,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    if (e && e.id === 'whiteout' && e.fade > 0) { c.globalAlpha = .5 * e.fade; c.fillStyle = '#e8f4f8'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  } else if (DIM === 5) {
    if (G.chimeT > 0) { c.globalAlpha = .22 * min(1, G.chimeT / 20); c.fillStyle = '#c9a44a'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  } else if (DIM === 7) {
    const dk = (p && p.dark) || 0; if (dk > 30 && !G.flags.dawnLit) { const a = clamp((dk - 30) / 70, 0, 1) * .6, g = c.createRadialGradient(W / 2, H / 2, H * .15, W / 2, H / 2, H * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(4,2,10,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  }
}
function realmAmbient() {
  const cx = G.cam.x, cy = G.cam.y, p = G.p, under = realmAt(floor((p.x + 3) / T), floor((p.y + 10) / T)) !== 'surface', wind = G.wind || 0;
  if (DIM === 4) { const n = G.dev && G.dev.id === 'whiteout' ? 3 : 1; if (!under) for (let k = 0; k < n; k++) if (Math.random() < .7) P(cx + frand(-40, VS.vw + 40), cy - 4, frand(-.3, .1) + wind * .3, frand(.3, .7), 300, fpick(['#ffffff', '#e8f4f8', '#c9fff6']), { g: 0, fr: 1 }); }
  else if (DIM === 5) { if (Math.random() < .35) P(cx + frand(VS.vw), cy + frand(VS.vh), frand(-.1, .1), frand(-.1, .05), 200, fpick(['#ffd35a', '#c9a44a', '#fff1a8']), { g: 0, fr: 1, glow: 1 }); }
  else if (DIM === 6) { if (!under) for (let k = 0; k < (G.dev && G.dev.id === 'tempest' ? 4 : 2); k++) P(cx + frand(-60, VS.vw + 60), cy - 4, wind * .8 - .3, frand(2.6, 3.4), 90, '#8a9ad0', { g: 0, fr: 1 }); if (Math.random() < .2) P(cx + frand(VS.vw), cy + frand(VS.vh), frand(-.5, .5), frand(-.5, .5), 14, '#e8f0ff', { g: 0, glow: 1 }); }
  else if (Math.random() < .45) P(cx + frand(VS.vw), cy + VS.vh * frand(.3, 1.1), frand(-.15, .15), frand(-.4, -.1), 260, fpick(['#a8a0b8', '#6a6480', '#ff9a3d']), { g: -.001, fr: 1 });
}
// ---------------- what each world does to you ----------------
const WARM_IDS = () => [FIRE, TORCH, CAMP, FURNACE, BLOOMERY, SLAGFORGE, RIMEFORGE, DAWNANVIL, LASTEMBER];
function nearLight(p, r) {
  const ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T);
  for (const o of tileObjs.values()) if (abs(o.x - ptx) <= r && abs(o.y - pty) <= r && TP[o.id].light) return true;
  for (let y = pty - 3; y <= pty + 3; y++) for (let x = ptx - 4; x <= ptx + 4; x++) { const t = tileAt(x, y); if (t === LASTEMBER || t === DAWNORE || t === EMBER) return true; }
  const it = heldItem(); return !!(it && (it.id === 'torch' || it.id === 'lantern' || it.id === 'emberlamp' || it.glow)) || boonHas('glow') || gearHas('bright') || gearHas('lastlight');
}
function nearWarmth(p) {
  if (G.nearWarm) return true; const ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T), W = WARM_IDS();
  for (const o of tileObjs.values()) if (abs(o.x - ptx) <= 6 && abs(o.y - pty) <= 4 && W.includes(o.id)) return true;
  const it = heldItem(); return !!(it && it.id === 'torch');
}
function tickRealm() {
  const p = G.p, F = G.flags; if (!p || p.dead || WORLD.arena) return;
  const ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T), surface = realmAt(ptx, pty) === 'surface', e = G.dev && G.dev.fade > .3 ? G.dev : null;
  if (G.bolt > 0) G.bolt--;
  if (DIM === 4) {
    // the cold: it builds out in the open, eases by a fire or underground
    if (p.chill === undefined) p.chill = 0;
    if (G.time % 10 === 0) {
      const res = gearRes('cold'), warm = nearWarmth(p);
      if (warm) p.chill = max(0, p.chill - 4);
      else if (!surface) p.chill = max(0, p.chill - .6);
      else p.chill = min(100, p.chill + (e && e.id === 'whiteout' ? 2.4 : 1.1) * (1 - res));
      if (p.chill >= 100 && G.time % 60 === 0) { hurtFighter(p, 4, p.x + 3, { env: 1 }); applyStatus(p, 'frost', null, { d: 70 }); if (!F.saidCold) { F.saidCold = 1; say('You are freezing. Find a fire, or something warm to wear, or a hot meal.'); } }
      else if (p.chill > 70 && !F.saidChill) { F.saidChill = 1; say('The cold is getting into you. A fire, a brazier, a torch in hand: anything warm.'); }
    }
  } else if (DIM === 5) {
    // springs and belts
    const under = tileAt(ptx, floor((p.y + p.h + 1) / T));
    if (p.onGround && under === SPRINGPAD && !(p.springT > 0)) { p.vy = -7.4; p.onGround = false; p.springT = 12; sfx('jump', 0); burst(p.x + 3, p.y + p.h, 10, ['#ffd35a', '#fff1a8'], 1.6, 20); }
    if (p.springT > 0) p.springT--;
    if (p.onGround && (under === BELTL || under === BELTR)) { const v = under === BELTL ? -.85 : .85, nx = p.x + v; if (!boxHits(nx, p.y, p.w, p.h)) p.x = nx; }
    for (const q of G.enemies) if (!q.dead && !q.fly && q.onGround) { const u = tileAt(floor((q.x + q.w / 2) / T), floor((q.y + q.h + 1) / T)); if (u === BELTL || u === BELTR) { const nx = q.x + (u === BELTL ? -.7 : .7); if (!boxHits(nx, q.y, q.w, q.h)) q.x = nx; } else if (u === SPRINGPAD && !q.boss) { q.vy = -6; q.onGround = false; } }
    // the great chime: the hour holds, and everything but you stands still
    const every = e && e.id === 'stoppedhour' ? 480 : 1800;
    if (G.time % every === every - 120 && !G.boss) { sfx('shrine', 0); G.note = { text: 'The great chime is winding up...', t: 0 }; }
    if (G.time % every === 0) { G.chimeT = 90; sfx('quest', 0); addShake(3); for (const q of G.enemies) if (!q.dead && !q.boss && !q.ghost) q.stun = max(q.stun || 0, 90); for (const pr of G.projs) if (!pr.owner || pr.owner !== p) { pr.vx *= .15; pr.vy *= .15; } if (!F.saidChime) { F.saidChime = 1; say('The hour holds. Everything but you stands still, for a moment.'); } }
    if (G.chimeT > 0) G.chimeT--;
  } else if (DIM === 6) {
    // wind, and lightning that looks for whoever stands out in the open
    const gust = e && e.id === 'tempest' ? 1.8 : 1; G.wind = (sin(G.time * .0011) * .9 + sin(G.time * .0047 + 1.3) * .5) * gust;
    if (surface && !gearHas('stormborn')) { const push = G.wind * (p.onGround ? .12 : .32), nx = p.x + push; if (!boxHits(nx, p.y, p.w, p.h)) p.x = nx; }
    if (G.boltT === undefined) G.boltT = 300; if (--G.boltT <= 0) {
      G.boltT = (e && e.id === 'tempest' ? 70 : 260) + frand(e && e.id === 'tempest' ? 80 : 220);
      if (surface && !G.boss) { const x = p.x + 3 + frand(-150, 150) + (Math.random() < .35 ? 0 : p.vx * 30), gy = groundAt(floor(x / T)) * T; strikeAt(x, gy, !gearHas('stormborn')); }
    }
  } else if (DIM === 7) {
    // the dark: away from any light the Hollow notices you
    if (p.dark === undefined) p.dark = 0; if (G.time % 10 === 0) {
      if (F.dawnLit || gearHas('lastlight') || nearLight(p, 7)) p.dark = max(0, p.dark - 6);
      else p.dark = min(100, p.dark + (e && e.id === 'longdark' ? 2.6 : 1.3));
      if (p.dark >= 100 && G.time % 90 === 0) { hurtFighter(p, 5, p.x + 3, { env: 1 }); if (G.enemies.filter(q => q.type === 'shade' && !q.dead).length < 3 && !netGuest()) placeMob('shade', ptx, pty, !surface); if (!F.saidDark) { F.saidDark = 1; say('Something in the dark has noticed you. Light: a torch, a lantern, an ember. Anything.'); } }
    }
  }
}
// lightning: a warning on the ground, then the strike (the Thunderhead's weather, the Stormwright, the surface's thunderstorms)
function strikeAt(x, gy, hurtful, o = {}) {
  G.trails.push({ kind: 'warn', x, y: gy, life: o.warn || 50, max: o.warn || 50 });
  G.dhaz.push({ kind: 'bolt', x, y: gy, delay: o.warn || 50, life: 12, dmg: o.dmg || 26, hurt: hurtful, rod: o.rod });
}
function drawBolt(f, t, u) {
  const Rn = mulberry32(t.seed || 1); let x = t.x + (Rn() - .5) * 40, y = t.y - 220; f.globalAlpha = u; f.strokeStyle = '#ffffff'; f.lineWidth = 2; f.beginPath(); f.moveTo(x, y);
  while (y < t.y) { y = min(t.y, y + 10 + Rn() * 16); x += (Rn() - .5) * 14 + (t.x - x) * .25; f.lineTo(x, y); } f.stroke(); f.strokeStyle = '#9ab0ff'; f.lineWidth = 1; f.stroke(); f.globalAlpha = 1;
}
function boltHit(z) {
  G.trails.push({ kind: 'bolt', x: z.x, y: z.y, life: 10, max: 10, seed: (Math.random() * 1e9) | 0 });
  const p = G.p; addShake(6); sfx('boom', 30); G.bolt = 20; G.flash = max(G.flash, .35); G.flashCol = '220,230,255';
  burst(z.x, z.y - 4, 24, ['#ffffff', '#e8f0ff', '#9ab0ff'], 3, 30, { glow: 1 });
  if (z.rod) { spawnDrop('storm_glass', randi(1, 2), z.x, z.y - 10); G.flags.rodStruck = (G.flags.rodStruck | 0) + 1; return; }
  if (z.hurt && p && !p.dead && abs(p.x + 3 - z.x) < 12 && p.y + p.h > z.y - 160) { hurtFighter(p, z.dmg, z.x, { kx: (sign(p.x + 3 - z.x) || 1) * 3, ky: -3.4, shock: 1 }); }
  if (!z.net) for (const e of G.enemies) if (!e.dead && !e.boss && abs(e.x + e.w / 2 - z.x) < 14 && e.y + e.h > z.y - 160) damageEnemy(e, 40, sign(e.x - z.x) * 3, -3, { stop: 3 });
}
// ---------------- art ----------------
const PINES = [], DEADTREES = []; let PENDULUM = null;
function buildRealmArt() {
  for (const t of [FROSTSNOW, PERMAFROST, GLACIER, RIMEORE, BRASSPLATE, COGSTONE, HOURORE, GLASSSAND, CLOUD, STORMCLOUD, STORMORE, CHARGED, ASHGLASS, VOIDROCK, DAWNORE, DRIFTSHARD]) NATURAL.add(t);
  const pal = (p, seed) => (px, py, v) => shade(p, hh(px >> 1, py >> 1, seed + v * 7) * .55 + hh(px, py, seed + v * 13) * .45);
  const PF = ['#4a5a6a', '#5a6c7e', '#6a7e92', '#3a4856'], CG = ['#5a4a30', '#6a5a3a', '#7a6a46', '#4a3c26'], SC = ['#3a4060', '#4a5274', '#5a6488', '#2e3450'], VR = ['#1a1626', '#241e34', '#2e2842', '#14101e'];
  TEX[FROSTSNOW] = genTex((px, py, v) => py < 2 ? (hh(px, py, 2001 + v) > .3 ? '#ffffff' : '#e8f4f8') : hh(px, py, 2002 + v) > .9 ? '#c9fff6' : pal(['#d8eef4', '#e8f4f8', '#c8e0ea', '#bcd6e2'], 2003)(px, py, v));
  TEX[PERMAFROST] = genTex((px, py, v) => hh(px, py, 2011 + v) > .94 ? '#c9fff6' : pal(PF, 2012)(px, py, v));
  TEX[GLACIER] = genTex((px, py, v) => { const d = (px + py * 2 + v) % 7; return d === 0 ? '#ffffff' : d < 3 ? '#c9fff6' : hh(px, py, 2021 + v) > .5 ? '#8fd0d8' : '#62a9bc'; });
  TEX[RIMEORE] = genTex((px, py, v) => { const r = hh(px >> 1, py >> 1, 2031 + v); return r > .68 ? (hh(px, py, 2032) > .5 ? '#ffffff' : '#9adcf0') : r > .56 ? '#4a8aa8' : pal(PF, 2033)(px, py, v); });
  TEX[RIMEICE] = genTex((px, py, v) => py === 0 ? '#ffffff' : (px + py + v) % 5 === 0 ? '#ffffff' : py < 4 ? '#c9fff6' : '#8fd0d8');
  TEX[BRASSPLATE] = genTex((px, py, v) => { if (py === 0) return (px + v) % 3 === 0 ? '#ffd35a' : '#fff1a8'; if (py === 1 && (px + v) % 4 === 1) return '#7a5218'; return (px + v) % 8 === 0 || py % 4 === 3 ? '#7a5a28' : hh(px, py, 2041 + v) > .85 ? '#fff1a8' : '#c9a44a'; });
  TEX[COGSTONE] = genTex((px, py, v) => { const cx = (px + v * 2) % 8 - 3.5, cy = (py + v) % 8 - 3.5, d = hypot(cx, cy); return d > 2 && d < 3.2 && hh(px, py, 2051 + v) > .3 ? '#8a7a5a' : pal(CG, 2052)(px, py, v); });
  TEX[HOURORE] = genTex((px, py, v) => { const r = hh(px >> 1, py >> 1, 2061 + v); return r > .66 ? (hh(px, py, 2062) > .5 ? '#fff1a8' : '#ffd35a') : r > .54 ? '#c98a2b' : pal(CG, 2063)(px, py, v); });
  TEX[SPRINGPAD] = genTex((px, py, v) => py < 2 ? (px % 2 ? '#ffd35a' : '#fff1a8') : py === 2 || py === 5 ? '#7a5218' : (px + py) % 3 === 0 ? '#c9a44a' : '#3a2a14');
  const belt = s => genTex((px, py) => { if (py === 0 || py === 7) return '#3a2a14'; if (py >= 2 && py <= 5) { const k = (s > 0 ? px : 7 - px) % 4, m = abs(py - 3.5) < 1 ? 1 : 0; if (k === (m ? 2 : 1)) return '#ffd35a'; } return py === 1 || py === 6 ? '#c9a44a' : '#5a4a30'; });
  TEX[BELTL] = belt(-1); TEX[BELTR] = belt(1);
  TEX[GLASSSAND] = genTex((px, py, v) => hh(px, py, 2071 + v) > .92 ? '#ffffff' : pal(['#e8d8a0', '#f4e8b8', '#fff8e0', '#d8c890'], 2072)(px, py, v));
  TEX[CLOUD] = genTex((px, py, v) => py < 2 ? '#ffffff' : hh(px >> 1, py >> 1, 2081 + v) > .55 ? '#e8ecf8' : '#c8d0e8');
  TEX[STORMCLOUD] = genTex((px, py, v) => hh(px, py, 2091 + v) > .95 ? '#9ab0ff' : pal(SC, 2092)(px, py, v));
  TEX[STORMORE] = genTex((px, py, v) => { const r = hh(px >> 1, py >> 1, 2101 + v); return r > .66 ? (hh(px, py, 2102) > .5 ? '#ffffff' : '#c9d8ff') : r > .55 ? '#6a7aa8' : pal(SC, 2103)(px, py, v); });
  TEX[CHARGED] = genTex((px, py, v) => { const d = (px - py + 8 + v) % 4; return d === 0 ? '#ffffff' : d === 1 ? '#e8f0ff' : hh(px, py, 2111 + v) > .5 ? '#9ab0ff' : '#6a7aa8'; });
  TEX[CLOUDPLAT] = genTex((px, py, v) => py === 0 ? '#ffffff' : py === 1 ? ((px + v) % 3 ? '#e8ecf8' : '#c8d0e8') : py === 2 && (px + v) % 2 === 0 ? '#c8d0e8' : null);
  TEX[ASHGLASS] = genTex((px, py, v) => py < 2 ? (hh(px, py, 2121 + v) > .4 ? '#e8e0f0' : '#c8c0d4') : pal(['#a8a0b8', '#b8b0c8', '#c8c0d4', '#8a84a0'], 2122)(px, py, v));
  TEX[VOIDROCK] = genTex((px, py, v) => hh(px, py, 2131 + v) > .96 ? '#4a4458' : pal(VR, 2132)(px, py, v));
  TEX[DAWNORE] = genTex((px, py, v) => { const r = hh(px >> 1, py >> 1, 2141 + v); return r > .64 ? (hh(px, py, 2142) > .45 ? '#fff1a8' : '#ff9a3d') : r > .52 ? '#c94a2a' : pal(VR, 2143)(px, py, v); });
  TEX[DRIFTSHARD] = genTex((px, py, v) => { const d = (px + py + v) % 5; return d === 0 ? '#e0d2ff' : d === 1 ? '#a58ae0' : hh(px, py, 2151 + v) > .6 ? '#7a6ab0' : '#4a3a8a'; });
  TEX[ICEFLOWER] = genTex(mask8(['...#....', '..###...', '..#.#...', '...#....', '...#....', '..##....', '...#....', '...#....'], (px, py) => py < 3 ? (py === 1 && px === 3 ? '#ffffff' : '#c9fff6') : '#8fd0d8'));
  TEX[FROSTGRASS] = genTex(mask8(['........', '........', '.#...#..', '.#.#.#..', '##.#.##.', '.#.#.#..', '########', '########'], (px, py, v) => py > 5 ? null : hh(px, py, 2161 + v) > .5 ? '#ffffff' : '#c8e0ea'));
  TEX[GEARBLOOM] = genTex(mask8(['..#.#...', '.#####..', '##.#.##.', '.#####..', '..#.#...', '...#....', '...#....', '..###...'], (px, py) => py < 5 ? (px === 3 && py === 2 ? '#fff1a8' : '#ffd35a') : '#7a5a28'));
  TEX[STATICGRASS] = genTex(mask8(['........', '..#.....', '.#..#...', '.#.#..#.', '.#.#.#..', '#..#.#..', '#.#..#.#', '########'], (px, py, v) => py === 7 ? null : hh(px, py, 2171 + v) > .7 ? '#e8f0ff' : '#6a7aa8'));
  TEX[LASTEMBER] = genTex(mask8(['........', '...#....', '..###...', '..#.#...', '.##.##..', '.#####..', '.##.##..', '########'], (px, py, v) => py === 7 ? '#3a3450' : py < 3 ? '#fff1a8' : hh(px, py, 2181 + v) > .5 ? '#ff9a3d' : '#c94a2a'));
  for (const id of [COLDHEARTH, RIMEFORGE, ESCAPEMENT, THUNDERANVIL, DAWNANVIL]) TEX[id] = TEX[DIRT];
  const wall = (src, a) => src.map(s => { const [c, x] = mk(8, 8); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(9,6,24,${a})`; x.fillRect(0, 0, 8, 8); return c; });
  WTEX[W_FROST] = wall(TEX[PERMAFROST], .5); WTEX[W_BRASS] = wall(TEX[COGSTONE], .55); WTEX[W_CLOUD] = wall(TEX[STORMCLOUD], .5); WTEX[W_VOID] = wall(TEX[VOIDROCK], .4);
  const R = (rows, p) => spr(rows, p);
  STN_SPR[RIMEFORGE] = { img: R(['.aaaaaaaa.', 'abbbbbbbba', 'abcccccdba', 'abceeecdba', 'abceffcdba', 'abbbbbbbba', '.ab....ba.', '.aa....aa.'], { a: '#2a4a5a', b: '#8fd0d8', c: '#3a5a6a', d: '#c9fff6', e: '#62a9bc', f: '#ffffff' }), ox: -1, oy: 0 };
  STN_SPR[ESCAPEMENT] = { img: R(['..aaaaaa..', '.abbbbbba.', 'abcdccdcba', 'abccddccba', 'abcdccdcba', '.abbbbbba.', '..a.aa.a..', '.aaaaaaaa.'], { a: '#3a2a14', b: '#c9a44a', c: '#7a5a28', d: '#ffd35a' }), ox: -1, oy: 0 };
  STN_SPR[THUNDERANVIL] = { img: R(['aaaaaaaaaa', '.abbbbbba.', '..abccba..', '..abddba..', '..abccba..', '.aabbbbaa.', '.abbbbbba.', 'aaaaaaaaaa'], { a: '#1e2236', b: '#6a7aa8', c: '#3a4268', d: '#e8f0ff' }), ox: -1, oy: 0 };
  STN_SPR[DAWNANVIL] = { img: R(['...aaaa...', '..abccba..', '.abcddcba.', 'aaaaaaaaaa', '.abbbbbba.', '..abccba..', '..abbbba..', '.aaaaaaaa.'], { a: '#7a2a14', b: '#ff9a3d', c: '#ffd35a', d: '#ffffff' }), ox: -1, oy: 0 };
  STN_SPR[COLDHEARTH] = { img: R(['.....aa.....', '....abba....', '...abccba...', '..abc..cba..', '.abc....cba.', 'abbbbbbbbbba', 'addddddddddA', '.aaaaaaaaaa.'], { a: '#3a3450', b: '#6a6480', c: '#8a84a0', d: '#2a2436', A: '#3a3450' }), ox: -2, oy: 0 };
  // frozen pines
  for (let k = 0; k < 3; k++) { const h = 30 + k * 10, w = 16 + k * 4, [c, x] = mk(w, h); x.fillStyle = '#3a2a24'; x.fillRect(w / 2 - 1, h - 8, 2, 8); for (let l = 0; l < 5 + k; l++) { const y = 2 + l * (h - 10) / (5 + k), hw = 2 + l * (w / 2 - 2) / (5 + k); x.fillStyle = '#2a4a4a'; x.beginPath(); x.moveTo(w / 2, y); x.lineTo(w / 2 - hw, y + 6); x.lineTo(w / 2 + hw, y + 6); x.fill(); x.fillStyle = '#ffffff'; x.fillRect(round(w / 2 - hw + 1), round(y + 5), round(hw * 2 - 2), 1); } PINES.push(c); }
  // dead trees of the Outside, ember-tipped
  for (let k = 0; k < 3; k++) { const h = 22 + k * 8, Rn = mulberry32(400 + k), [c, x] = mk(24, h); x.strokeStyle = '#1a1626'; x.lineWidth = 2; const br = (X, Y, a, L, d) => { const X2 = X + cos(a) * L, Y2 = Y + sin(a) * L; x.beginPath(); x.moveTo(X, Y); x.lineTo(X2, Y2); x.stroke(); if (d > 0) { br(X2, Y2, a - .5 - Rn() * .3, L * .7, d - 1); br(X2, Y2, a + .4 + Rn() * .3, L * .65, d - 1); } else { x.fillStyle = Rn() < .5 ? '#ff9a3d' : '#c94a2a'; x.fillRect(round(X2), round(Y2), 1, 1); } }; x.lineWidth = 2; br(12, h, -PI / 2, h * .38, 3); DEADTREES.push(c); }
  // a great pendulum on its frame
  { const [c, x] = mk(28, 64); x.fillStyle = '#3a2a14'; x.fillRect(1, 0, 3, 64); x.fillRect(24, 0, 3, 64); x.fillRect(1, 0, 26, 3); x.strokeStyle = '#c9a44a'; x.lineWidth = 1; x.beginPath(); x.moveTo(14, 3); x.lineTo(18, 44); x.stroke(); x.fillStyle = '#ffd35a'; x.beginPath(); x.arc(18, 48, 6, 0, TAU); x.fill(); x.fillStyle = '#7a5218'; x.beginPath(); x.arc(18, 48, 3, 0, TAU); x.fill(); PENDULUM = c; }
  DFOL.winter = [PINES[0]]; DFOL.hour = [DFOL.cinder[1]]; DFOL.storm = [DFOL.glass[0]]; DFOL.outside = [DFOL.cinder[0]];
  // the ring made whole again, for after
  SPR.ringWhole = genRing(true);
}
