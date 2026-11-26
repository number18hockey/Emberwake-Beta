// ============================================================
//  What makes one world unlike another.
//
//  TRAITS. Every world forged from now on draws three traits from its
//  seed: one for the LAND, one for what LIVES on it, one for its SKY.
//  A cragged, feral world under twin moons is a different place from a
//  drowned, quiet one under long nights, and plays differently too.
//
//  MOODS. The lands themselves are not the same all the way along any
//  more: a moor may be the Emberfelt Moor you know, or burnt black, or
//  open meadow lit by glowcaps. Each mood has its own plants, its own
//  ground and its own creatures, and a name that shows when you cross
//  into it.
//
//  Both are worked out from the seed alone (nothing is saved for them),
//  and only for worlds made with land 4 or later: a world from before
//  keeps every hill, tree and cave exactly where it was.
// ============================================================
const TRAITS = {
  // the land
  crags: { g: 'land', n: 'CRAGGED', d: 'The land rises in shelves and cliffs.' },
  lowland: { g: 'land', n: 'GENTLE', d: 'Low, rolling country with wide lakes.' },
  hollow: { g: 'land', n: 'HOLLOW', d: 'More caves, bigger caverns, more ways down.' },
  rich: { g: 'land', n: 'RICH VEINS', d: 'Ore lies thicker in the rock.' },
  drowned: { g: 'land', n: 'DROWNED', d: 'Fens spread, and there is a lake past every hill.' },
  frozen: { g: 'land', n: 'LONG WINTER', d: 'The cold of the Reach has crept across the land.' },
  scorched: { g: 'land', n: 'SCORCHED', d: 'Dunes, rust and ash crowd out the green.' },
  skytorn: { g: 'land', n: 'SKY-TORN', d: 'Twice the islands hang on the wind.' },
  // what lives here
  oldgrowth: { g: 'life', n: 'OLD GROWTH', d: 'Stalks grow tall and close. Berries are easy.' },
  barren: { g: 'life', n: 'BARREN', d: 'Little grows. Bones lie where plants would.' },
  feral: { g: 'life', n: 'FERAL', d: 'Creatures hunt in packs.' },
  quiet: { g: 'life', n: 'QUIET DAYS', d: 'Little stirs by day. The nights make up for it.' },
  shields: { g: 'life', n: 'SHIELD-BEARERS', d: 'Warded foes are three times as common.' },
  elder: { g: 'life', n: 'ELDER BEASTS', d: 'Some creatures have grown old, huge and rich.' },
  bounty: { g: 'life', n: 'BOUNTIFUL', d: 'Creatures carry more. Bushes fruit twice as fast.' },
  // the sky
  longnight: { g: 'sky', n: 'LONG NIGHTS', d: 'Night lasts half again as long.' },
  longday: { g: 'sky', n: 'LONG DAYS', d: 'The sun lingers, and the nights are short.' },
  storms: { g: 'sky', n: 'STORM-WRACKED', d: 'Storms, ash and fog come twice as often.' },
  starlit: { g: 'sky', n: 'STARLIT', d: 'Bright nights, a crowded sky, and falling stars.' },
  twomoons: { g: 'sky', n: 'TWIN MOONS', d: 'Two moons ride the night. It is never fully dark.' },
  embersky: { g: 'sky', n: 'EMBER SKIES', d: 'Red dawns and dusks. Embers ride every wind.' },
  mist: { g: 'sky', n: 'MISTBOUND', d: 'Mist lies in the low ground every morning.' }
};
const TRAIT_G = { land: [], life: [], sky: [] }; for (const k in TRAITS) TRAIT_G[TRAITS[k].g].push(k);
const TRAIT_COL = { land: '#ffd35a', life: '#7ddc6f', sky: '#8ff5e6' };
let WT = {}, WT_ON = false, WT_KEYS = [], GENV = null, MOODC = null, WT_T = 0, WT_H = 0;
// the three traits a seed gives (one from each group), whatever world is loaded
function traitsOf(seed) { return ['land', 'life', 'sky'].map((g, i) => { const L = TRAIT_G[g]; return L[floor(hh(i + 1, 4711, seed | 0) * L.length)]; }); }
// called before any land is worked out
function traitsInit() {
  CURIO_AT.clear(); WT = {}; WT_KEYS = []; WT_ON = (WORLD.land | 0) >= 4; GENV = null; MOODC = WT_ON ? new Uint8Array(EW) : null; WT_T = WT_H = 0;
  if (!WT_ON) return;
  WT_KEYS = traitsOf(SEED); for (const k of WT_KEYS) WT[k] = 1;
  GENV = Object.assign({}, LANDS[4], { tall: LANDS[4].tall * (WT.lowland ? .62 : 1) });
  WT_T = WT.frozen ? -.17 : WT.scorched ? .17 : 0; WT_H = WT.drowned ? .15 : 0;
}
// a trait that is in force right now (never in the arenas, never in the other worlds)
const wt = k => WT_ON && WT[k] === 1 && !WORLD.arena && !DIM;
const traitLine = (keys = WT_KEYS) => keys.map(k => TRAITS[k].n.toLowerCase()).join(', ');
// CRAGGED: the height is pulled toward shelves nine tiles apart, with a steep riser between
function cragY(y) { const st = 10, q = y / st, f = q - floor(q), s = floor(q) + smooth((f - .5) * 6.5 + .5); return lerp(y, s * st, .8); }

// ---------------- moods: one land, three ways ----------------
// fol: which tufts stand in front; folSkip: how many of them are missing; tree: how many stalks (x); th: how tall (x); kind: which stalk; berry / flower / grass / reed / bones / bush / pebble: how much of each (x);
// glow: glowcaps in the open (chance); crystal: glass shoots (x); top: [tile, how much of the topsoil]; mobs: who walks here
// (the Mosswood and the Willowmere are only in worlds made since they grew: see LAND_NEW in 3-endless.js)
const MOODS = {
  moor: [{ n: 'EMBERFELT MOOR' },
    { n: 'THE BURNT MOOR', sub: 'a fire went through here, and stayed', fol: 'ash', tree: .5, kind: 2, berry: .25, flower: 0, grass: .3, bush: .09, bones: .03, top: [ASH, .56], mobs: [['husk', 3], ['mote', 3], ['cinderling', 1], ['bat', 1, 1]], tint: [255, 120, 70, .07] },
    { n: 'LANTERN MEADOWS', sub: 'glowcaps under an open sky', tree: .3, flower: 2.4, grass: 1.2, glow: .055, berry: 1.5, mobs: [['ashhare', 5], ['mote', 2], ['glassfly', 1], ['husk', 2, 1]], tint: [150, 255, 200, .05] }],
  thorn: [{ n: 'THE THORNWEALD' },
    { n: 'THE BRAMBLE DEEPS', sub: 'the stalks close overhead', tree: 1.35, th: 1.5, berry: 1.9, grass: 1.2, mobs: [['thornback', 5], ['ashhare', 1], ['bat', 2, 1], ['husk', 2, 1]], tint: [90, 200, 130, .07] },
    { n: 'THE GRAVEL BARRENS', sub: 'stone, wind, and not much else', fol: 'ash', folSkip: .5, tree: .2, berry: .3, grass: .25, flower: .2, pebble: 3, top: [GRAVEL, .6], mobs: [['rustback', 3], ['thornback', 1], ['mote', 2], ['husk', 2, 1]], tint: [190, 180, 170, .06] }],
  reach: [{ n: 'STILLGLASS REACH' },
    { n: 'THE GLASS SPIRES', sub: 'the cold grew teeth here', tree: 1.6, th: 1.45, crystal: 3.2, mobs: [['glassfly', 4], ['mite', 3], ['husk', 1, 1]], tint: [140, 230, 255, .07] },
    { n: 'THE WHITE QUIET', sub: 'snow, and nothing on it', folSkip: .75, tree: .08, crystal: .3, mobs: [['mite', 2], ['ashhare', 1], ['husk', 1, 1]], few: 1, tint: [235, 240, 255, .08] }],
  fen: [{ n: 'SALLOWMERE' },
    { n: 'THE BLACK FEN', sub: 'peat, rot and small lights', tree: 1.8, kind: 2, reed: .55, glow: .07, berry: .3, top: [PEAT, .85], mobs: [['bat', 3], ['husk', 2], ['mote', 2], ['lurker', 0]], tint: [90, 70, 130, .08] },
    { n: 'THE REEDSEA', sub: 'reeds to the shoulder, water to the knee', tree: .3, reed: 1.7, berry: 2.2, mobs: [['ashhare', 2], ['mote', 3], ['glassfly', 2], ['lurker', 0], ['husk', 1, 1]], tint: [170, 230, 150, .06] }],
  mosswood: [{ n: 'MOSSWOOD' },
    { n: 'THE OLD GROVE', sub: 'oaks that were old before the village was', tree: 1.3, th: 1.3, berry: 1.4, grass: 1.2, glow: .03, mobs: [['mossdeer', 5, 0, 1], ['ashhare', 2], ['mote', 2], ['bat', 2, 1], ['husk', 2, 1]], tint: [110, 210, 130, .07] },
    { n: 'THE DEER LAWNS', sub: 'short grass, and something always watching', tree: .3, flower: 2, grass: 1.3, berry: 1.2, mobs: [['mossdeer', 6, 0, 1], ['ashhare', 3], ['mote', 2], ['husk', 2, 1]], tint: [200, 240, 150, .05] }],
  willowmere: [{ n: 'WILLOWMERE' },
    { n: 'THE HEN MEADS', sub: 'wet meadow, and wild hens in it', tree: .5, reed: .6, berry: 1.8, mobs: [['willowhen', 7, 0, 1], ['ashhare', 2], ['mote', 2], ['husk', 1, 1]], tint: [200, 235, 170, .05] },
    { n: 'THE STILL POOLS', sub: 'willows over quiet water, pale lights at night', tree: 1.6, reed: 1.3, glow: .06, mobs: [['mossdeer', 3, 0, 1], ['willowhen', 3, 0, 1], ['mote', 3], ['glassfly', 1], ['bat', 2, 1], ['husk', 1, 1]], tint: [150, 170, 240, .06] }],
  dunes: [{ n: 'THE SALT DUNES' },
    { n: 'THE BONE FIELDS', sub: 'something very large died here, more than once', bones: 5, bush: 1.6, mobs: [['husk', 3], ['serpent', 1], ['ashhare', 1], ['bat', 2, 1]], tint: [255, 235, 200, .06] },
    { n: 'THE GLASS FLATS', sub: 'salt from here to the edge of sight', fol: 'reach', folSkip: .6, top: [SALT, .86], bones: .3, bush: .4, glint: 1, mobs: [['glassfly', 3], ['ashhare', 2], ['serpent', 1], ['husk', 1, 1]], tint: [220, 250, 255, .08] }],
  scoria: [{ n: 'RUSTFALL' },
    { n: 'THE IRON GARDENS', sub: 'rust that learned to grow', tree: 5, th: 1.3, kind: 2, pebble: 2, mobs: [['rustback', 5], ['mote', 1], ['cinderling', 1], ['husk', 1, 1]], tint: [255, 150, 90, .07] },
    { n: 'RUSTFALL' }],
  ash: [{ n: 'ASHEN HOLLOW' },
    { n: 'THE STONE WOOD', sub: 'stalks turned to stone where they stood', tree: 4.5, th: 1.35, kind: 2, bones: 1.5, mobs: [['husk', 4], ['bat', 2], ['mote', 1]], tint: [170, 160, 200, .07] },
    { n: 'THE CINDER FIELDS', sub: 'the ground has not finished burning', bush: 2.2, bones: 2, cinder: 1, mobs: [['cinderling', 4], ['mote', 3], ['husk', 2]], tint: [255, 110, 60, .09] }]
};
const MOOD0 = {};
// which mood the land is in at a column: 0 the land as you know it, 1 or 2 its other faces
function moodAt(x) {
  if (!WT_ON || x < 0 || x >= EW) return 0; let m = MOODC[x]; if (m) return m - 1;
  const v = fbm(x * .0013, 133.7, 2); m = v < .455 ? 1 : v > .545 ? 2 : 0; if (m && inWindow(x, 50)) m = 0;
  MOODC[x] = m + 1; return m;
}
const moodOf = (x, b) => { const L = MOODS[b]; return L ? L[moodAt(x)] || MOOD0 : MOOD0; };
// the name of the land under a column, for the banner and the map
const BIOME2 = { thorn: 'THE THORNWEALD', fen: 'SALLOWMERE', dunes: 'THE SALT DUNES' };
function landName(b, tx) { if (!DIM && !WORLD.arena && MOODS[b] && tx !== undefined) { const M = moodOf(tx, b); if (M.n) return M.n; } return BIOME[b] || BIOME2[b] || ''; }
function landSub(b, tx) { return !DIM && !WORLD.arena && MOODS[b] ? moodOf(tx, b).sub || '' : ''; }

// plants on open ground in a world with traits and moods (a world from before them uses the old table in decorColumn).
// true: this ground was one of ours, whether or not anything was planted
function decorNew(i, below, r, b, M, gk) {
  const m = (k, d = 1) => M[k] === undefined ? d : M[k];
  if (below === MUD || below === PEAT) {
    const reed = .5 * m('reed'), berry = .04 * m('berry') * gk;
    if (r < reed) tiles[i] = REED; else if (r < reed + berry) tiles[i] = BERRY; else if (M.glow && r > 1 - M.glow) tiles[i] = GLOWCAP;
    return true;
  }
  if (below === GRASS) {
    const be = (b === 'thorn' ? .09 : .035) * m('berry') * gk, pe = .04 * m('pebble'), gr = .38 * m('grass') * gk, fl = .08 * m('flower') * gk;
    let a = be; if (r < a) tiles[i] = BERRY; else if (r < (a += .065)) tiles[i] = STICKS; else if (r < (a += pe)) tiles[i] = PEBBLE; else if (r < (a += gr)) tiles[i] = TALLGRASS; else if (r < (a += fl)) tiles[i] = FLOWER;
    else if (M.glow && r > 1 - M.glow) tiles[i] = GLOWCAP; else if (M.bush && r > 1 - M.bush - (M.glow || 0)) tiles[i] = DEADBUSH; else if (WT.barren && r > .955) tiles[i] = BONES;
    return true;
  }
  if ((below === SAND || below === SALT) && b === 'dunes') {
    const bo = .04 * m('bones'), bu = .03 * m('bush');
    if (r < bo) tiles[i] = BONES; else if (r < bo + .03) tiles[i] = PEBBLE; else if (r < bo + .03 + bu) tiles[i] = DEADBUSH; else if (M.glint && r > .93) tiles[i] = CRYSTAL;
    return true;
  }
  if (below === GRAVEL && M.pebble) { if (r < .12) tiles[i] = PEBBLE; else if (r < .16) tiles[i] = STICKS; else if (r < .19) tiles[i] = DEADBUSH; return true; }
  return false;
}

// ---------------- what the traits change while you play ----------------
// how many creatures may be about, and how soon the next one comes
function traitCap(n, night, under) { if (under) return n; if (wt('quiet')) return night ? n + 2 : 1; if (wt('feral')) return n + 2; return n; }
function traitPace(night, under) { if (under) return 1; if (wt('quiet')) return night ? .62 : 1.9; return 1; }
const PACK_OK = new Set(['husk', 'mote', 'mite', 'thornback', 'rustback', 'cinderling', 'ashhare', 'bat']);
const ELDER_OK = new Set(['husk', 'mite', 'thornback', 'rustback', 'mote', 'cinderling']);
// a creature has just come out of the dark: packs, elders
function traitSpawned(e, tx, ty, under) {
  if (!e || DIM || WORLD.arena || under) return;   // (the caves keep their own ways)
  const M = moodOf(tx, biomeAt(tx)); if (M.few && Math.random() < .5 && !e.fly) { e.dead = true; return; }
  if (wt('elder') && ELDER_OK.has(e.type) && Math.random() < .09) { makeElder(e); return; }
  if (wt('feral') && PACK_OK.has(e.type) && !e.elder) {
    e.hp = e.maxhp = max(4, round(e.maxhp * .8));
    const side = Math.random() < .5 ? -1 : 1;
    for (let k = 0, n = Math.random() < .5 ? 1 : 2; k < n; k++) {
      const x2 = tx + side * (k + 1) * 2; let y2 = -1; for (let y = ty - 5; y <= ty + 5; y++) if (solidAt(x2, y) && !solidAt(x2, y - 1) && !solidAt(x2, y - 2) && !solidAt(x2, y - 3) && !liqAt(x2 * T + 4, (y - 1) * T + 4)) { y2 = y; break; }
      if (y2 < 0) continue; const q = spawnMob(e.type, x2, y2); q.hp = q.maxhp = e.maxhp;
    }
  }
}
// an ELDER: half again the size, far tougher, and it carries more
function makeElder(e) {
  const k = 1.4, w0 = e.w, h0 = e.h; e.elder = true; e.warded = false; e.name = 'Elder ' + (e.name || e.type);
  e.w = round(w0 * k); e.h = round(h0 * k); e.x -= (e.w - w0) / 2; e.y -= e.h - h0; e.px = e.x; e.py = e.y;
  for (let i = 0; i < 12 && boxHits(e.x, e.y, e.w, e.h); i++) { e.y -= 2; e.py = e.y; }
  e.hp = e.maxhp = round(e.maxhp * 2.8); e.dmg = round((e.dmg || 6) * 1.35); e.kbRes = max(e.kbRes || 0, .5); e.mpz = undefined; e.pz = undefined;
}
// what an elder leaves, on top of what its kind does
function elderDrops(e, cx, cy) {
  spawnDrop('shard', randi(2, 3), cx, cy); spawnDrop('cinder', randi(3, 5), cx, cy); rollDrops(e.type, cx, cy); rollDrops(e.type, cx, cy);
  if (Math.random() < .5) spawnDrop(fpick(['salve', 'whetstone', 'jerky', 'glowcap']), 1, cx, cy);
  burst(cx, cy, 26, ['#ffd35a', '#fff1a8', '#ffffff'], 3, 46, { glow: 1, g: -.01 }); numPop(cx, cy - 18, 'ELDER FELLED', '#ffd35a'); sfx('quest', 0);
}
// the clock: long nights and long days stretch one half of it
function traitClock(c) {
  const night = c > .6 && c < .97;
  if (wt('longnight')) return night ? .64 : 1; if (wt('longday')) return night ? 1.5 : .7; return 1;
}
// the light of the night sky
function traitSun() {
  if (DIM || WORLD.arena || !WT_ON) return; const dk = 1 - G.dn;
  if (WT.twomoons) { G.sun[0] += .07 * dk; G.sun[1] += .09 * dk; G.sun[2] += .14 * dk; }
  else if (WT.starlit) { G.sun[0] += .05 * dk; G.sun[1] += .06 * dk; G.sun[2] += .08 * dk; }
  if (WT.embersky) { const edge = sin(clamp(G.dn, 0, 1) * PI); G.sun[0] = min(1, G.sun[0] + .06 * edge); G.sun[2] = max(0, G.sun[2] - .05 * edge); }
}
// how often the sky turns (storms, ashfall, the long fog, starfall)
const traitEvent = k => (wt('storms') ? 2 : 1) * (wt('starlit') && k === 'starfall' ? 2.5 : 1) * (wt('mist') && k === 'fog' ? 2 : 1);

// ---------------- showing them ----------------
// the three traits and what each does: side by side where there is room, else the name with its line under it
function drawTraits(c, x, y, w, keys = WT_KEYS, gap = 11, under = false) {
  keys.forEach((k, i) => { const t = TRAITS[k]; if (under) { drawText(c, t.n, x, y + i * gap * 2, TRAIT_COL[t.g]); drawText(c, t.d, x + 8, y + i * gap * 2 + gap - 1, '#b9bdd0'); } else { drawText(c, t.n, x, y + i * gap, TRAIT_COL[t.g]); drawText(c, t.d, x + 96, y + i * gap, '#b9bdd0'); } });
}
