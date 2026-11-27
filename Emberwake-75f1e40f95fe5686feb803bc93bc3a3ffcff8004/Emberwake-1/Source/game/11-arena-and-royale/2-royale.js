// ============================================================
//  THE ASHFALL: battle royale.
//  Everyone rides the Ember Barge over an island and leaps off where
//  they like. Chests hold weapons, salves and wards. The ashfall storm
//  closes in from both sides, and the last Waker standing wins. Empty
//  places are filled by echoes (computer players).
//  Online, the match leader (the first person in the lobby) runs the
//  storm clock and the echoes; every computer runs its own Waker and
//  shares it as presence, exactly like the Cinder Ring.
// ============================================================
const BRW = 800, BRH = 140, BRSKY = 17, BR_MAX = 12, BR_FILL = 12;
const BR_TIERS = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'], BR_TCOL = ['#c8c4d4', '#7ddc6f', '#5aa8ff', '#c77dff', '#ffd35a', '#ff7a9e'];
const BR_MATT = { wood: 0, flint: 0, bone: 0, stone: 0, copper: 1, bronze: 1, rust: 2, chitin: 2, iron: 2, steel: 3, glass: 3, deep: 4, ember: 5 };
const BR_OLD = { sword: 0, spear: 0, fangs: 1, maul: 2, bow: 1, nunchaku: 1, kblade: 4, kmaul: 4, vpike: 3, vfangs: 3 };
const BR_BIOMES = ['moor', 'thorn', 'dunes', 'reach', 'ash'];
const BR_SURF = { moor: [GRASS, DIRT], thorn: [GRASS, DIRT], dunes: [SAND, SANDSTONE], reach: [SNOW, STONE], ash: [ASH, STONE] };
const BR_WALL = { moor: W_DIRT, thorn: W_DIRT, dunes: W_SAND, reach: W_STONE, ash: W_ASH };
const BR_PNAMES = { moor: ['HEARTHWICK', 'MILLSTEAD', 'LANTERN GREEN'], thorn: ['THORNWOOD', 'BRAMBLE CAMP', 'THE TANGLE'], dunes: ['SUNKEN SPIRE', 'DUSTWATCH', 'RUSTFALL RUINS'], reach: ['COLDGLASS KEEP', 'FROSTGATE', 'STILLWATCH'], ash: ['CINDER WORKS', 'SLAG HOLLOW', 'THE KILNS'] };
const BR_BOTN = ['WREN', 'KESTREL', 'MARROW', 'TINDER', 'SORREL', 'FLINT', 'ROOK', 'BRAMBLE', 'EMBERLY', 'SALTWICK', 'HOLLIS', 'VESK', 'ODA', 'TALLOW'];
// storm phases: seconds of waiting, seconds of closing, share of the map still safe after, damage per second outside
// a match is three days and three nights long (see 5-the-trials.js), and the ashfall ends on the Hearth
const STORM = [[230, 50, .68, 1], [135, 45, .44, 2], [110, 40, .24, 3], [90, 35, .1, 5], [60, 30, 0, 9]];
const BR_DROP = 10 * 60;   // the count on the plinths before the horn
const BR = {
  on: false, via: 'solo', code: 'open', phase: '', mi: '', seed: 0, t: 0, ro: [], nb: 0, lead: true, leaderId: '', people: new Map(),
  cd: 0, cdAt: 0, cdMax: 0, chests: [], open: new Set(), mine: new Set(), zones: [], storm: null, bots: new Map(), bk: [], bkSeq: 0, bkSeen: new Map(),
  dlSeen: new Set(), dl: null, place: 0, spec: null, specT: 0, overT: 0, winner: '', winMe: false, pois: [], segs: BR_BIOMES.slice(), segW: BRW / 5, mapCv: null,
  note: '', noteT: 0, chan: null, inStorm: false, poiNow: '', mapOpen: false, total: 0, lastAlive: 0, lobbyT: 0, err: '',
  // the Wilds (the third arena: 20-wilds-royale.js and on) keeps its own extra state here
  wild: false, wildLand: false, matchType: 'unranked', rewarded: false, ring: { n: 0, at: 0 }, lastFall: 0, caves: [], nests: [], lakes: [], segX: [], bio: null, structures: [], lastTeams: 0, pactWith: '', pactFrom: '', pactFromT: 0, teammate: '', pactSeen: false, leaveT: 0, dropsOut: [], dropSeq: 0, dropSeen: new Map(), tookOut: [], tookSeq: 0, tookSeen: new Map(), tileOut: new Map(), applying: false, fallen: [], fallenT: 0, show: null, gifts: [], giftAt: 0, feast: 0, hazard: null, hounds: 0, bounty: null, mobT: 0, botMobT: 0, menuTab: 'queue', menuScroll: 0, menuRows: 1, menuMsg: ''
};
const brOn = () => WORLD.royale && BR.on;
// true only inside a match of the Wilds (the third arena): everything the Wilds changes in the shared game asks this first
function wildOn() { return WORLD.royale && BR.wild; }
const brTag = f => !f ? '' : f === G.p ? (NET.me || 'me') : f.botTag || f.peer || '';

// ---------------- loot ----------------
const brTier = id => { const it = IT[id]; if (!it || it.type !== 'weapon' || it.fist) return -1; return it.tier ? (BR_MATT[it.tier] ?? -1) : (BR_OLD[id] ?? -1); };
let BR_POOL = null;
function brPool() { if (BR_POOL) return BR_POOL; BR_POOL = [[], [], [], [], [], []]; for (const id in IT) { const k = brTier(id); if (k >= 0 && !IT[id].relic) BR_POOL[k].push(id); } return BR_POOL; }
function brItems() {
  const v = (a, b, c, d, e) => ({ a, b, c, d, e });
  defI('br_salve', { name: 'Ember Salve', type: 'brheal', heal: 25, cap: 100, use: 70, stack: 6, icon: icon('vial', v('#ffd3a0', '#ff8a3d', '#c94a1e', '#5a2010', '#fff1a8')), desc: 'Heals 25. Takes a moment to rub in.' });
  defI('br_draught', { name: 'Heartroot Draught', type: 'brheal', heal: 60, cap: 100, use: 150, stack: 3, icon: icon('jug', v('#ffb0b0', '#e2483b', '#8f2233', '#4a1018', '#ffd0d0')), desc: 'Heals 60. Drink it somewhere safe.' });
  defI('br_shard', { name: 'Ward Shard', type: 'brheal', ward: 25, cap: 50, use: 80, stack: 6, icon: icon('stone', v('#e0f4ff', '#8fd0ff', '#4a8adf', '#22406a', '#ffffff')), desc: '+25 ward, up to 50. Ward takes blows before your health does.' });
  defI('br_ward', { name: 'Greatward Flask', type: 'brheal', ward: 50, cap: 100, use: 160, stack: 3, icon: icon('vial', v('#e0f4ff', '#5aa8ff', '#2a62c0', '#14305a', '#ffffff')), desc: '+50 ward, up to 100.' });
  trItems(); trKitItems(); wBrItems();
}
function brRollTier(rare) { const r = Math.random(); return rare ? (r < .22 ? 2 : r < .58 ? 3 : r < .94 ? 4 : 5) : (r < .42 ? 0 : r < .72 ? 1 : r < .91 ? 2 : r < .99 ? 3 : r < .999 ? 4 : 5); }
function brLoot(rare) {
  const P = brPool(), k = brRollTier(rare), pool = P[k].length ? P[k] : P.slice(0, k).reverse().find(p => p.length) || P[0], out = [[fpick(pool), 1]];
  const n = rare ? 2 : 1 + (Math.random() < .55 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const r = Math.random();
    out.push(r < .27 ? ['br_salve', 2] : r < .38 ? ['br_draught', 1] : r < .62 ? ['br_shard', 2] : r < .7 ? ['br_ward', 1] : r < .84 ? [fpick(['shuriken', 'flask', 'smoke']), fpick([2, 3])] : r < .9 ? ['hook', 1] : ['arrow', 15]);
  }
  if (IT[out[0][0]].ammo && !out.some(o => o[0] === 'arrow')) out.push(['arrow', 20]);
  return out;
}

// ---------------- the island ----------------
const brBio = x => BR.wild ? wBrBio(x) : BR.segs[clamp(floor(x / BR.segW), 0, BR.segs.length - 1)] || 'moor';
function brRegionMix(x) { if (BR.wild) return wBrRegionMix(x);
  const BG = { moor: 'moor', thorn: 'moor', dunes: 'scoria', reach: 'reach', ash: 'ash' }, acc = { reach: 0, moor: 0, ash: 0, scoria: 0 }; let tot = 0;
  BR.segs.forEach((b, i) => { const c = (i + .5) * BR.segW, w = smooth(1 - (abs(x - c) - BR.segW * .3) / (BR.segW * .45)); if (w > .001) { acc[BG[b]] += w; tot += w; } });
  if (!tot) { acc.moor = 1; tot = 1; } for (const k in acc) acc[k] /= tot; return Object.entries(acc).filter(e => e[1] > .02);
}
function brFlat(x0, x1, gy, b) {
  const [top, sub] = BR_SURF[b || brBio((x0 + x1) >> 1)];
  for (let x = x0; x <= x1; x++) {
    if (!inW(x, gy)) continue;
    for (let y = 0; y < gy; y++) if (tiles[y * WW + x] !== BEDROCK) { tiles[y * WW + x] = AIR; walls[y * WW + x] = 0; }
    for (let y = gy; y < min(BRH - 3, gy + 6); y++) { tiles[y * WW + x] = y === gy ? top : sub; if (y > gy) walls[y * WW + x] = BR_WALL[brBio(x)]; }
    heights[x] = gy; SKYL[x] = gy + 3;
  }
}
// a ramp of earth so the ground beside a flattened place stays walkable
function brEase(x, dir, gy) { for (let k = 1; k < 30; k++) { const xx = x + dir * k; if (xx < 3 || xx > BRW - 4) return; const want = gy + sign(heights[xx] - gy) * min(abs(heights[xx] - gy), k * 2); if (want === heights[xx]) return; brFlat(xx, xx, want); } }
function brChest(x, y, rare, o = {}) {
  if (!inW(x, y) || tiles[y * WW + x] !== AIR || !TP[tileAt(x, y + 1)].solid && tileAt(x, y + 1) !== PLATFORM) return null;
  for (const c of BR.chests) if (abs(c.x - x) < 3 && abs(c.y - y) < 3) return null;
  const c = { i: BR.chests.length, x, y, rare: !!rare, cave: !!o.cave, high: !!o.high, open: false, t: 0, kind: o.kind || '', feast: !!o.feast, hearth: !!o.hearth, at: o.at || 0 }; BR.chests.push(c); return c;
}
function brTree(x, gy, b) {
  const kind = b === 'thorn' ? 3 : b === 'moor' ? 0 : b === 'reach' ? 1 : 2, th = kind === 0 ? 7 + randi(0, 7) : kind === 1 ? 5 + randi(0, 5) : 5 + randi(0, 4);
  for (let y = 1; y <= th + 4; y++) if (tileAt(x, gy - y) !== AIR) return; if (tileAt(x - 1, gy) === AIR || tileAt(x + 1, gy) === AIR) return;
  for (let y = 1; y <= th; y++) tiles[(gy - y) * WW + x] = [TRUNK, TRUNK2, TRUNK3, TRUNK4][kind];
  treeTops.set(x, { y: gy - th, kind, v: randi(0, 2), ph: rand(TAU) });
}
function genRoyale(seed) {
  trRelics(); SEED = seed >>> 0; rng = mulberry32(SEED); DIM = 0; resetWorld(BRW, BRH); WORLD.arena = true; WORLD.royale = true; WORLD.endless = 0; BR.wildLand = false;
  SPAWN_X = BRW >> 1; SHRINE_X = SHRINE2_X = MINE_X = FORGE_X = GATE_X = SKY_X = BLADE_X = SPIRE_X = REACH_X = RUST_X = -100000; SHRINE_Y = SHRINE2_Y = GATE_Y = MINE_Y = FORGE_Y = SKY_Y = 0;
  BASE_Y = 74; DEEP_Y = 9999; DRIFT_Y = -99; VIL_Y = -999;
  const order = BR_BIOMES.slice(); for (let i = order.length - 1; i > 0; i--) { const j = randi(0, i); const q = order[i]; order[i] = order[j]; order[j] = q; }
  BR.segs = order; BR.segW = BRW / order.length; BR.chests = []; BR.pois = []; BR.anvils = []; BR.drops = [];
  // the shape of the land: rolling hills, steeper in the Reach, flatter in the dunes, cliffs at the edges of the world
  const a1 = rand(TAU), a2 = rand(TAU), a3 = rand(TAU);
  for (let x = 0; x < BRW; x++) {
    const b = brBio(x), amp = b === 'dunes' ? .55 : b === 'reach' ? 1.35 : b === 'thorn' ? 1.1 : 1;
    let h = 76 + (8 * sin(x * .019 + a1) + 4 * sin(x * .051 + a2) + 2 * sin(x * .13 + a3)) * amp; const e = min(x, BRW - 1 - x);
    // EMBER PEAK: one mountain, low shores at both ends and the Hearth on the summit
    if (BR.arena === 1) { const u = 1 - abs(x - BRW / 2) / (BRW / 2); h = 114 - 64 * pow(u, 1.15) + (3 * sin(x * .037 + a1) + 1.5 * sin(x * .11 + a2)) * (1 - u * .6); }
    if (e < 16) h -= (16 - e) * 3.2;
    heights[x] = round(h);
  }
  for (let pass = 0; pass < 4; pass++) for (let x = 17; x < BRW - 17; x++) { const d = heights[x] - heights[x - 1]; if (abs(d) > 2) heights[x] = heights[x - 1] + sign(d) * 2; }
  for (let x = 0; x < BRW; x++) {
    const b = brBio(x), [top, sub] = BR_SURF[b], gy = heights[x], deep = 4 + floor(hh(x, 7, SEED) * 3);
    for (let y = gy; y < BRH; y++) { const d = y - gy, i = y * WW + x; tiles[i] = y >= BRH - 3 ? BEDROCK : d === 0 ? top : d < deep ? sub : hh(x, y, 11) > .94 ? GRAVEL : hh(x, y, 12) > .97 ? COAL : STONE; walls[i] = d > 0 ? (d < 7 ? BR_WALL[b] : W_STONE) : 0; }
    if (x < 2 || x >= BRW - 2) for (let y = 0; y < gy; y++) tiles[y * WW + x] = BEDROCK;
    SKYL[x] = gy + 3;
  }
  // tunnels under the hills: two or three, each with a chest or two at its far end
  for (let k = 0; k < (BR.arena === 1 ? 0 : 4); k++) {
    let x = randi(40, BRW - 80), y = heights[x] + 1, dir = rand() < .5 ? -1 : 1, len = randi(50, 90), ent = x;
    for (let s = 0; s < len; s++) {
      const dy = s < 10 ? 1 : s > len - 10 ? -1 : (rand() < .2 ? (rand() < .5 ? -1 : 1) : 0); x += dir; y = clamp(y + dy, heights[clamp(x, 0, BRW - 1)] + 2, BRH - 12);
      if (x < 20 || x > BRW - 21) break;
      for (let oy = -2; oy <= 1; oy++) for (let ox = 0; ox <= 1; ox++) { const xx = x + ox, yy = y + oy; if (inW(xx, yy) && tiles[yy * WW + xx] !== BEDROCK) tiles[yy * WW + xx] = AIR; }
      if (s % 14 === 7) { const ty = y - 2; if (tileAt(x, ty - 1) !== AIR) dyn(x, ty, TORCH); }
    }
    for (let yy = heights[ent] - 1; yy <= heights[ent] + 3; yy++) for (let xx = ent - 1; xx <= ent + 1; xx++) if (inW(xx, yy) && tiles[yy * WW + xx] !== BEDROCK && yy >= heights[ent]) tiles[yy * WW + xx] = AIR;
    for (let q = 0; q < 2; q++) { const qx = x - q * 4 * dir; let fy = y; while (fy < BRH - 4 && !solidAt(qx, fy + 1)) fy++; brChest(qx, fy, q === 0, { cave: true }); }
  }
  // the named places, one in each land
  const used = new Set(), mid = BR.segs.length >> 1;
  trBuildHearth(BRW >> 1);
  BR.segs.forEach((b, i) => {
    if (i === mid) return;
    const side = rand() < .5 ? -1 : 1, cx = round((i + .5) * BR.segW + side * BR.segW * .2), names = BR_PNAMES[b], name = names.find(n => !used.has(n) && rand() < .6) || names[0]; used.add(name);
    withRng(hh(cx, 2201, SEED) * 4294967296, () => brPOI(b, cx, name));
    trCamp(round(cx - side * BR.segW * .46));
  });
  for (const s of [-1, 1]) trCamp((BRW >> 1) + s * 96);
  // floating isles with a rare chest each, and a vent beneath to reach them
  for (let k = 0; k < 3; k++) {
    const cx = round((k + .5) * BRW / 3 + rand(-50, 50)), cy = heights[cx] - 26 - randi(0, 6), a = 7 + randi(0, 3);
    if (island(cx, cy, a, 4, false)) { for (let y = cy - 4; y < cy; y++) for (let x = cx - 3; x <= cx + 3; x++) if (inW(x, y)) tiles[y * WW + x] = AIR; let gy = cy; while (gy < cy + 6 && !solidAt(cx, gy)) gy++; brChest(cx, gy - 1, true, { high: true }); const vx = cx + (rand() < .5 ? -1 : 1) * (a + 3); vent(vx, cy - 8); }
  }
  // trees, grass and rocks between the places
  for (let x = 8; x < BRW - 8; x++) {
    const b = brBio(x), gy = heights[x]; if (RESV[x] || tileAt(x, gy - 1) !== AIR) continue;
    const ch = b === 'thorn' ? .2 : b === 'moor' ? .09 : b === 'reach' ? .07 : b === 'ash' ? .03 : 0;
    if (rand() < ch && abs(heights[x - 1] - gy) <= 1 && abs(heights[x + 1] - gy) <= 1) { brTree(x, gy, b); x += 3; continue; }
    const r = rand(); if (b === 'dunes') { if (r < .05) tiles[(gy - 1) * WW + x] = DEADBUSH; } else if (b === 'ash') { if (r < .04) tiles[(gy - 1) * WW + x] = DEADBUSH; } else if (b !== 'reach' || r < .3) { if (r < .22) tiles[(gy - 1) * WW + x] = TALLGRASS; else if (r < .27) tiles[(gy - 1) * WW + x] = FLOWER; else if (r < .29) tiles[(gy - 1) * WW + x] = BUSH; }
  }
  // chests out in the open, about one every thirty paces
  for (let x = 20; x < BRW - 20; x += 26 + randi(0, 18)) { if (RESV[x]) continue; const gy = heights[x]; if (abs(heights[x - 1] - gy) <= 1 && abs(heights[x + 1] - gy) <= 1) brChest(x, gy - 1, rand() < .08); }
  trBushes(); trPlanDrops(seed >>> 0);
  // a few watch platforms with a chest on top
  for (let k = 0; k < 9; k++) {
    const x = randi(30, BRW - 40); if (RESV[x] || RESV[x + 7]) continue; const gy = min(heights[x], heights[x + 7]), py = gy - 6;
    for (let y = py + 1; y <= max(heights[x], heights[x + 7]) - 1; y++) { if (tileAt(x, y) === AIR) tiles[y * WW + x] = BEAM; if (tileAt(x + 7, y) === AIR) tiles[y * WW + x + 7] = BEAM; }
    for (let xx = x; xx <= x + 7; xx++) if (tileAt(xx, py) === AIR) tiles[py * WW + xx] = PLATFORM;
    brChest(x + 3, py - 1, false, { high: true }); reserve(x - 1, x + 8, 1);
  }
  for (let x = 0; x < BRW; x++) { let y = 0; while (y < BRH && !TP[tiles[y * WW + x]].solid) y++; SKYL[x] = max(heights[x] + 3, min(y + 3, BRH)); }
  for (const q of PROPS) bucketAdd(PROPB, q); for (const q of FGP) bucketAdd(FGPB, q);
  MODS_ON = false; brMapArt();
}
// the five kinds of named place
function brPOI(b, cx, name) {
  const gy = heights[cx]; BR.pois.push({ name, x: cx, b });
  if (b === 'moor') {
    brFlat(cx - 26, cx + 26, gy); brEase(cx - 26, -1, gy); brEase(cx + 26, 1, gy);
    house(cx - 22, gy, 11, 6, 4, { door: 2, name }); house(cx - 5, gy, 11, 9, 4, { door: 2, floors: 2 }); house(cx + 12, gy, 10, 6, 3, { door: 2 });
    for (let x = cx - 24; x <= cx + 24; x++) for (let y = gy - 4; y < gy; y++) if (tiles[y * WW + x] === DOORC) tiles[y * WW + x] = DOORO;
    brChest(cx - 17, gy - 1, false); brChest(cx, gy - 1, false); brChest(cx + 1, gy - 5, true); brChest(cx + 16, gy - 1, false);
    dyn(cx - 24, gy - 1, TORCH); dyn(cx + 24, gy - 1, TORCH);
  } else if (b === 'thorn') {
    brFlat(cx - 18, cx + 18, gy); brEase(cx - 18, -1, gy); brEase(cx + 18, 1, gy);
    for (const [ox, w] of [[-14, 7], [5, 8]]) { const x0 = cx + ox; for (let k = 0; k < w; k++) { const hgt = round((1 - abs(k - (w - 1) / 2) / (w / 2)) * 4); for (let y = gy - hgt; y < gy; y++) if (y === gy - hgt || k === 0 || k === w - 1) tiles[y * WW + x0 + k] = THATCH; else walls[y * WW + x0 + k] = W_WATTLE; } }
    dyn(cx - 2, gy - 1, CAMP);
    brChest(cx - 11, gy - 1, false); brChest(cx + 9, gy - 1, true); brChest(cx + 15, gy - 1, false);
    for (const ox of [-17, 17]) brTree(cx + ox, gy, 'thorn');
  } else if (b === 'dunes') {
    brFlat(cx - 14, cx + 14, gy); brEase(cx - 14, -1, gy); brEase(cx + 14, 1, gy);
    tower(cx - 4, gy, 9, 20, { ruin: true, name }); brChest(cx, gy - 1, false); brChest(cx - 1, gy - 5, false); brChest(cx + 1, gy - 13, false); brChest(cx, gy - 21, true, { high: true });
    for (const ox of [-12, 10]) for (let y = gy - 3; y < gy; y++) tiles[y * WW + cx + ox] = SANDSTONE;
  } else if (b === 'reach') {
    brFlat(cx - 20, cx + 20, gy); brEase(cx - 20, -1, gy); brEase(cx + 20, 1, gy);
    for (let x = cx - 16; x <= cx + 16; x++) { for (let y = gy - 9; y < gy; y++) walls[y * WW + x] = W_BRICK; tiles[(gy - 9) * WW + x] = abs(x - cx) < 15 ? PLATFORM : BRICK; if (abs(x - cx) % 3 === 0) tiles[(gy - 10) * WW + x] = BRICK; }
    for (const s of [-1, 1]) { for (let y = gy - 9; y < gy - 3; y++) tiles[y * WW + cx + s * 16] = BRICK; for (let y = gy - 13; y < gy - 9; y++) { tiles[y * WW + cx + s * 16] = BRICK; tiles[y * WW + cx + s * 15] = BRICK; } }
    for (let x = cx - 6; x <= cx + 6; x++) tiles[(gy - 5) * WW + x] = PLATFORM;
    brChest(cx - 10, gy - 1, false); brChest(cx + 10, gy - 1, false); brChest(cx, gy - 6, true); brChest(cx + 12, gy - 10, false, { high: true });
    dyn(cx - 13, gy - 4, TORCH); dyn(cx + 13, gy - 4, TORCH);
  } else {
    brFlat(cx - 18, cx + 18, gy); brEase(cx - 18, -1, gy); brEase(cx + 18, 1, gy);
    for (const [ox, h] of [[-15, 6], [-9, 9], [7, 7], [14, 5]]) for (let y = gy - h; y < gy; y++) { tiles[y * WW + cx + ox] = y < gy - h + 2 && rand() < .5 ? AIR : CINDERBRICK; walls[y * WW + cx + ox + 1] = W_RUIN; }
    for (let x = cx - 9; x <= cx + 7; x++) tiles[(gy - 9) * WW + x] = PLATFORM;
    vent(cx - 3, gy - 22); brChest(cx - 12, gy - 1, false); brChest(cx + 2, gy - 1, false); brChest(cx - 1, gy - 10, true, { high: true }); brChest(cx + 11, gy - 1, false);
  }
  reserve(cx - 28, cx + 28, 2);
}
// a small picture of the whole island for the map and the storm strip
function brMapArt() {
  const s = 2, c = document.createElement('canvas'); c.width = ceil(BRW / s); c.height = ceil(BRH / s); const x = c.getContext('2d');
  const col = { moor: '#4f7a3a', thorn: '#3d6a32', dunes: '#c9a46a', reach: '#d8e6ee', ash: '#6a6070' };
  for (let tx = 0; tx < BRW; tx += s) for (let ty = 0; ty < BRH; ty += s) { const t = tiles[ty * WW + tx]; if (!TP[t].solid || t === BEDROCK && (tx < 3 || tx > BRW - 4)) continue; x.fillStyle = ty <= heights[tx] + 1 ? col[brBio(tx)] : ty < heights[tx] + 8 ? '#5a4a40' : '#3a3442'; x.fillRect(tx / s, ty / s, 1, 1); }
  BR.mapCv = c;
}

// ---------------- the storm ----------------
function brZones(seed) {
  const r = mulberry32((seed ^ 0x5bd1e995) >>> 0), Wp = BRW * T, Z = [[3 * T, Wp - 3 * T]];
  const hc = (BRW >> 1) * T;
  // on the Peak the slag rises evenly up both flanks
  if (BR.arena === 1) { for (const [, , fr] of STORM) Z.push([hc - fr * (hc - 3 * T), hc + fr * (hc - 3 * T)]); return Z; }
  STORM.forEach(([, , fr], i) => { const L = Z[Z.length - 1][0], R = Z[Z.length - 1][1], w = fr * Wp, room = max(0, R - L - w); let nL = L + r() * room; nL = lerp(nL, clamp(hc - w / 2, L, L + room), (i + 1) / STORM.length); Z.push([nL, nL + min(w, R - L)]); });
  return Z;
}
function brStormAt(t) {
  let at = 0; const Z = BR.zones;
  for (let i = 0; i < STORM.length; i++) {
    const w = STORM[i][0] * 60, d = STORM[i][1] * 60;
    if (t < at + w) return { L: Z[i][0], R: Z[i][1], nL: Z[i + 1][0], nR: Z[i + 1][1], i, moving: false, left: at + w - t, dps: i ? STORM[i - 1][3] : 0 };
    if (t < at + w + d) { const u = (t - at - w) / d; return { L: lerp(Z[i][0], Z[i + 1][0], u), R: lerp(Z[i][1], Z[i + 1][1], u), nL: Z[i + 1][0], nR: Z[i + 1][1], i, moving: true, left: at + w + d - t, dps: STORM[i][3] }; }
    at += w + d;
  }
  const L = Z[Z.length - 1]; return { L: L[0], R: L[1], nL: L[0], nR: L[1], i: STORM.length, moving: false, left: 0, dps: STORM[STORM.length - 1][3] };
}
const brOut = f => { const z = BR.storm, x = f.x + 3; if (!z || !(z.dps > 0)) return false; return BR.arena === 1 ? f.y + f.h > BR.slagY + 3 : x < z.L || x > z.R; };
function brStormHurt(f) {
  const d = BR.storm.dps / 2 * (trHas(f, 'ash') ? .5 : 1); f.hp -= d; f.flash = 4; f.regenT = 0;
  if (f === G.p) { numPop(f.x + 3, f.y - 4, round(d * 10) / 10, '#c77dff'); sfx('hurt', 30); G.flash = max(G.flash, .12); G.flashCol = '170,70,200'; }
  if (f.hp <= 0) { f.hp = 0; killFighter(f, null); }
}

// ---------------- the barge ----------------
function brBarge(t) { const u = clamp((t === undefined ? BR.t : t) / BR_DROP, 0, 1), dir = BR.seed & 1 ? 1 : -1, x0 = 26 * T, x1 = (BRW - 26) * T; return { x: dir > 0 ? lerp(x0, x1, u) : lerp(x1, x0, u), y: BRSKY * T, dir }; }
// before the horn everyone stands on a plinth round the Hearth (onBarge is the old name for 'held at the start')
function brRide(f) { const x = trPedX(trTagOf(f)), gy = BR.hearthY || heights[x]; f.x = f.px = x * T + 1; f.y = f.py = (gy - 1) * T - f.h; f.vx = f.vy = 0; f.onGround = true; f.face = x < (BR.hearth || BRW >> 1) ? 1 : -1; f.atk = null; f.state = 'normal'; }
function brLeap(f) {
  if (!f.onBarge) return; f.onBarge = false; f.glide = false; f.noHit = false; f.inv = 24;
  if (f === G.p) { sfx('horn', 0); G.banner = { text: 'THE HORN', sub: BR.size > 1 ? 'stay with your team. Hearth or wilds?' : 'Hearth or wilds? Choose.', t: 60 }; addShake(3); }
}
function brGlide(f, I) {
  if (!f.glide) return;
  if (f.onGround || f.dead) { f.glide = false; if (!f.dead) dust(f.x + 3, f.y + f.h, 8); return; }
  const dive = I && I.down; f.vy = min(f.vy, dive ? 3.6 : 1.2);
  const want = (I ? I.md : 0) * 2.7; f.vx += (want - f.vx) * .06;
}

// ---------------- using salves and wards (it takes a moment) ----------------
function brStartUse(f, id) {
  const it = IT[id]; if (!it || (it.type !== 'brheal' && it.type !== 'brfood')) return false;
  if (it.type === 'brfood') { if (f === G.p && G.food >= 96) { sfx('deny'); BR.note = 'You are not hungry'; BR.noteT = 90; return false; } f.brUse = { id, t: 0, dur: it.use }; if (f === G.p) sfx('stir', 0); return true; }
  const full = it.heal ? f.hp >= it.cap : (f.ward || 0) >= it.cap; if (full) { if (f === G.p) { sfx('deny'); BR.note = it.heal ? 'Your health is full' : 'Your ward is as strong as that will make it'; BR.noteT = 90; } return false; }
  f.brUse = { id, t: 0, dur: it.use }; if (f === G.p) sfx('stir', 0); return true;
}
function brTickUse(f) {
  const u = f.brUse; if (!u) return;
  if (f.dead || f.hurtT > 0 || f.state !== 'normal' || f.glide) { f.brUse = null; if (f === G.p) { BR.note = 'Interrupted'; BR.noteT = 60; } return; }
  if (++u.t < u.dur) { if (G.time % 6 === 0) P(f.x + frand(-1, 7), f.y + frand(4, 18), 0, -.5, 20, IT[u.id].ward ? '#8fd0ff' : '#ffb347', { glow: 1, g: -.01 }); return; }
  const it = IT[u.id]; f.brUse = null;
  if (f === G.p) { if (countItem(u.id) < 1) return; removeItem(u.id, 1); } else if (f.br) { if (it.heal) f.br.heals--; else f.br.wards--; }
  if (it.type === 'brfood') { if (f === G.p) G.food = min(100, G.food + it.food); if (it.heal) f.hp = min(f.maxhp, f.hp + it.heal); numPop(f.x + 3, f.y - 4, 'FED', '#e0a050'); sfx('heal', 0); return; }
  if (it.heal) { f.hp = min(it.cap, f.hp + it.heal); numPop(f.x + 3, f.y - 4, '+' + it.heal, '#7ddc6f'); }
  else { f.ward = min(it.cap, (f.ward || 0) + it.ward); numPop(f.x + 3, f.y - 4, '+' + it.ward, '#8fd0ff'); }
  sfx('heal', 0); burst(f.x + 3, f.y + 10, 12, it.ward ? ['#8fd0ff', '#ffffff'] : ['#7ddc6f', '#c9fff6'], 1.4, 30, { glow: 1, g: -.01 });
}
function brQuickUse(p) {
  const order = p.hp < 75 ? ['br_salve', 'br_draught', 'br_shard', 'br_ward'] : ['br_shard', 'br_ward', 'br_salve', 'br_draught'];
  if (G.food < 60 && p.hp >= 75) for (const id of ['br_berries', 'br_ration']) if (countItem(id) > 0 && brStartUse(p, id)) return;
  for (const id of order) if (countItem(id) > 0 && brStartUse(p, id)) return;
  for (const id of ['br_berries', 'br_ration']) if (G.food < 90 && countItem(id) > 0 && brStartUse(p, id)) return;
  if (!p.brUse) sfx('deny');
}

// ---------------- chests ----------------
function brNearChest(f, r = 16) { let best = null, bd = r; for (const c of BR.chests) { if (c.open || !trLive(c)) continue; const d = abs(c.x * T + 4 - (f.x + 3)) + abs((c.y + 1) * T - (f.y + f.h)) * .7; if (d < bd) { bd = d; best = c; } } return best; }
function brOpenChest(c, f) {
  if (!c || c.open || !trLive(c)) return;
  if (trSealed(c)) { if (f === G.p) { sfx('deny'); BR.note = 'Sealed until the feast.'; BR.noteT = 90; } return; }
  c.open = true; c.t = 0; BR.mine.add(c.i);
  const px = c.x * T + 4, py = c.y * T + 2; sfx(c.kind === 'bush' ? 'pickup' : 'craft', 0); if (c.kind !== 'bush') burst(px, py, 14, c.rare ? ['#ffd35a', '#fff1a8'] : ['#ffb347', '#c98a5a'], 1.6, 30, { glow: 1 });
  if (f === G.p) { brFavor(c.feast ? 15 : c.kind === 'drop' ? 12 : c.kind === 'bush' ? 1 : 2); if (c.kind === 'bush') BR.st.bushes = (BR.st.bushes | 0) + 1; else BR.st.chests = (BR.st.chests | 0) + 1; }
  const loot = trLoot(c); if (trHas(f, 'scav')) { if (c.kind === 'bush') loot[0][1] *= 2; else loot.push(fpick([['br_salve', 1], ['br_shard', 1], ['br_ration', 1], ['br_scrap', 2]])); }
  if (f === G.p) { loot.forEach(([id, n], k) => spawnDrop(id, n, px - 3, py - 4, (k - (loot.length - 1) / 2) * 1.1, -2.4 - k * .2)); return; }
  if (f && f.br) for (const [id, n] of loot) brBotTake(f, id, n);
}
function brBotTake(f, id, n) {
  const it = IT[id]; if (!it) return;
  if (it.type === 'weapon') { if (brTier(id) > brTier(f.wid) || f.wid === 'fists' || (it.relic && !IT[f.wid].relic)) { f.wid = id; f.arms = f.arms || []; if (it.relic) f.amps = []; } }
  else if (it.type === 'bramp') { if (f.amps && f.amps.length < 2 && !f.amps.includes(it.amp) && !(IT[f.wid] && IT[f.wid].relic)) f.amps.push(it.amp); }
  else if (id === 'br_salve' || id === 'br_draught') f.br.heals += n; else if (id === 'br_shard' || id === 'br_ward') f.br.wards += n;
  else if (ARMS.includes(id) && f.arms && !f.arms.includes(id)) f.arms.push(id);
}
// what you drop when you fall: everything you carried
function brSpill(f) {
  const out = [];
  if (f === G.p) { for (let i = 0; i < INV_N; i++) { const s = inv[i]; if (s && IT[s.id]) { out.push(s.amps && s.amps.length ? [s.id, 1, s.amps] : [s.id, s.n]); inv[i] = null; } } }
  else if (f.br) { if (f.wid && f.wid !== 'fists') out.push(f.amps && f.amps.length ? [f.wid, 1, f.amps.slice()] : [f.wid, 1]); if (f.amps) f.amps = []; if (f.br.heals > 0) out.push(['br_salve', min(4, f.br.heals)]); if (f.br.wards > 0) out.push(['br_shard', min(4, f.br.wards)]); }
  return out;
}
function brDropPile(x, y, items) { items.forEach(([id, n, amps], k) => { if (IT[id] && n > 0) spawnDrop(id, n, x + frand(-3, 3), y - 4, (k - (items.length - 1) / 2) * .9, -2 - frand(1), amps); }); }

// ---------------- starting a match ----------------
function brNewBot(i, skill) {
  const name = BR_BOTN[i % BR_BOTN.length], f = newFighter(0, 0, { name, skin: i % 4, team: trTeam('B' + i), botTag: 'B' + i, botI: i, wid: 'fists', ai: newBrain(skill), brBot: true, echoBot: true, brIn: true, arms: [], amps: [], perks: [TR_BOT_PERKS[floor(hh(i, 13, BR.seed & 0xffff) * TR_BOT_PERKS.length) % TR_BOT_PERKS.length]], ward: 0, onBarge: true, noHit: true,
    br: { heals: 0, wards: 0, drop: 0, roam: null, roamT: 0, chest: null, skip: new Set(), lx: 0, stuck: 0, think: 0, rkT: 0, bold: hh(i, 5, BR.seed & 0xffff) < .42 } });
  // the cautious ones run for a place of their own when the horn sounds; the bold ones go for the Hearth
  const P0 = BR.pois.filter(q => !q.hearth); f.br.home = (P0.length ? P0[floor(hh(i, 9, BR.seed & 0xffff) * P0.length) % P0.length].x : BRW / 2) * T; trApplyPerks(f); return f;
}
function brSkill() { const d = SETTINGS.diff; return d === 'hard' ? frand(.58, .82) : d === 'normal' ? frand(.42, .66) : frand(.3, .52); }
// everyone runs this with the same seed, so everyone stands on the same island
function brEnterMatch(mi, seed, roster, nb, size, tms, arena) {
  const nick = G.nick, skin = G.skin; BR.arena = arena === 1 ? 1 : 0; BR.wild = false;
  genRoyale(seed); freshSession(); G.nick = nick; G.skin = skin; G.clock = .08; updateSun(); BR.seed = seed; trSetTeams(roster, nb, size || 1, tms); trReset();
  Object.assign(BR, { mapHide: false, mi, seed, t: 0, ro: roster.slice(), nb, phase: 'drop', open: new Set(), mine: new Set(), bots: new Map(), bk: [], bkSeq: 0, bkSeen: new Map(), dlSeen: new Set(), dl: null, place: 0, spec: null, specT: 0, overT: 0, winner: '', winMe: false, chan: null, note: '', noteT: 0, inStorm: false, poiNow: '', mapOpen: false, lastAlive: 0 });
  BR.zones = brZones(seed); BR.storm = brStormAt(0); NET.deathN = 0; NET.kb = ['', 0]; NET.hits = []; NET.shots = []; NET.seen.clear();
  inv = new Array(INV_N).fill(null); G.sel = 0;
  G.p = newPlayer(); Object.assign(G.p, { name: G.nick, brIn: true, ward: 0, onBarge: true, noHit: true, team: trTeam(brMe()) }); G.fighters = [G.p]; G.npcs = []; G.enemies = []; trKitReset(); trOffer('start');
  for (const f of NET.peers.values()) { f.gone = true; } NET.peers.clear();
  // echoes fill the empty places; the leader runs them, everyone else sees them through the leader
  rng = mulberry32((seed ^ 0x2545F491) >>> 0);
  if (BR.lead) for (let i = 0; i < nb; i++) { const f = brNewBot(i, brSkill()); BR.bots.set(f.botTag, f); G.fighters.push(f); brRide(f); }
  brRide(G.p); snapCam(); G.state = 'play'; UI.open = null; G.cine = null; G.dialog = null;
  BR.total = roster.length + nb; BR.cnt = 99; G.banner = { text: 'THE ASHFALL TRIALS', sub: TR_ARENA_N[BR.arena] + ': ' + BR.total + ' Wakers' + (BR.size > 1 ? ' in ' + BR.nteams + ' teams' : '') + '. The horn sounds in ten.', t: 0 }; sfx('quest', 0);
}
function brSolo(size) {
  BR.via = 'solo'; BR.lead = true; BR.on = true; NET.me = ''; NET.status = 'off'; size = clamp((size || FORM.brsize || 1) | 0, 1, 3); FORM.brsize = size;
  const seed = (Math.random() * 4294967296) >>> 0; brEnterMatch('s' + seed.toString(36), seed, ['me'], BR_FILL - 1, size, null, trArenaPick(seed));
}

// ---------------- the match, every tick ----------------
function brTick() { if (BR.wild) return wBrTick();
  if (!BR.on) return;
  if (BR.phase === 'drop' || BR.phase === 'fight') BR.t++;
  BR.storm = brStormAt(max(0, BR.t - BR_DROP)); trSlag();
  if (BR.phase === 'drop' && BR.t >= BR_DROP) { BR.phase = 'fight'; for (const f of G.fighters) if (f.onBarge && !f.remote) brLeap(f); }
  if (BR.noteT > 0) BR.noteT--; trTick();
  for (const c of BR.chests) if (c.open && c.t < 40) c.t++;
  // my Waker and my echoes take storm damage; everyone else's computer handles theirs
  if (BR.t % 30 === 0 && BR.phase !== 'over') for (const f of G.fighters) if (f.brIn && !f.remote && !f.dead && !f.onBarge && brOut(f)) brStormHurt(f);
  const p = G.p; BR.inStorm = !p.dead && !p.onBarge && brOut(p);
  // the named place you stand in
  if (!p.dead && !p.onBarge && G.time % 20 === 0) { const q = BR.pois.find(q => abs(q.x * T - p.x) < 26 * T); const n = q ? q.name : ''; if (n && n !== BR.poiNow) { G.note = { text: n, t: 0 }; if (!BR.seenPoi.has(n) && !q.camp) { BR.seenPoi.add(n); if (BR.seenPoi.size > 1) brFavor(8); } } BR.poiNow = n; }
  // spectating after you fall
  if (p.dead && BR.phase !== 'over') { const s = BR.spec; if (!s || s.dead || s.gone || !G.fighters.includes(s)) { BR.specT++; if (BR.specT > 50) { const al = brAlive(); BR.spec = al.find(f => f !== p && f.team === p.team) || al.find(f => f !== p) || null; BR.specT = 0; } } if (pressed.KeyD || pressed.ArrowRight || pressed.KeyA || pressed.ArrowLeft) brSpecNext(pressed.KeyA || pressed.ArrowLeft ? -1 : 1); }
  // who is left
  const alive = brAlive(); BR.lastAlive = alive.length;
  if (BR.phase === 'fight' && new Set(alive.map(f => f.team)).size <= 1 && BR.t > BR_DROP + 60) brOver(alive[0] || null);
  if (BR.phase === 'over') { BR.overT++; if (BR.via !== 'solo' && BR.overT > 60 * 14) brBackToLobby(); }
  if (BR.via !== 'solo') brNetTick();
}
const brAlive = () => G.fighters.filter(f => f.brIn && !f.dead && !f.gone);
function brSpecNext(d) { const a = brAlive().filter(f => f !== G.p); if (!a.length) return; const i = a.indexOf(BR.spec); BR.spec = a[((i < 0 ? 0 : i + d) % a.length + a.length) % a.length]; sfx('ui'); }
function brOver(w) {
  const team = w ? G.fighters.filter(f => f.brIn && f.team === w.team && !f.gone) : [];
  BR.phase = 'over'; BR.overT = 0; BR.winner = w ? (BR.size > 1 ? team.map(f => f.name).join(' & ') : w.name) : ''; BR.winMe = !!w && w.team === G.p.team; sfx('horn', 0);
  if (!BR.winMe && !BR.place) BR.place = 2;
  if (BR.winMe) BR.place = 1; trCareerSave();
  if (BR.winMe) { BR.place = 1; G.banner = { text: BR.size > 1 ? 'YOUR TEAM OUTLASTED THEM ALL' : 'YOU ARE THE LAST EMBER', sub: G.p.kills + ' taken down. ' + (BR.arena === 1 ? 'The slag cools.' : 'The ashfall settles.'), t: 0 }; sfx('quest', 0); G.flash = .5; G.flashCol = '255,211,90'; for (let i = 0; i < 40; i++) P(G.p.x + 3 + frand(-60, 60), G.p.y - frand(10, 80), frand(-.5, .5), frand(.3, 1), 90, fpick(['#ffd35a', '#ff8a3d', '#fff1a8']), { glow: 1, g: .01 }); }
  else G.banner = { text: w ? BR.winner + (BR.size > 1 ? ' OUTLAST THEM ALL' : ' IS THE LAST EMBER') : 'THE ASHFALL TOOK EVERYONE', sub: BR.place ? 'you placed #' + BR.place : '', t: 0 };
  if (w && w !== G.p && G.p.dead) BR.spec = w;
}
// someone fell (called for every death this computer is in charge of)
function brDeath(f, by) { if (BR.wild) return wBrDeath(f, by);
  const ka = by ? by.name : '';
  // a Hollow One burning away at dawn is nobody's kill
  if (f.hunter && !by) return;
  if (!f.hunter) { trFell(f.name); f.fellAt = BR.t; if (brAlive().some(o => o.team === f.team)) trEmber(f); }
  if (f === G.p) {
    NET.deathN++; NET.kb = [brTag(by), NET.deathN]; if (by && by.brBot && !by.remote) { by.kills++; trTookDown(by, f); }
    BR.place = f.rk ? 0 : trTeamsAlive().size + 1; const items = brSpill(f); BR.dl = [NET.deathN, round(f.x + 3), round(f.y + 10), items]; brDropPile(f.x + 3, f.y + 10, items);
    G.kfeed.unshift({ a: ka, b: f.name, t: 0, me: 2, txt: by ? '' : trHazTxt() }); BR.spec = by && !by.dead && by !== f ? by : null; BR.specT = 0; f.brUse = null;
  } else if (f.brBot && !f.remote) {
    if (by === G.p) { G.p.kills++; brRewardKill(); G.banner = { text: f.hunter ? 'PUT DOWN' : 'TAKEN DOWN', sub: f.name, t: 120 }; comboHit(true); sfx('newmove', 0); brFavor(f.hunter ? 20 : 35); } else if (by && by.brBot && !by.remote) by.kills++;
    if (by && !f.hunter) trTookDown(by, f);
    const items = f.hunter ? [['br_ration', 1], ['br_salve', 1], ['br_scrap', 1]] : brSpill(f); brDropPile(f.x + 3, f.y + 10, items); f.brUse = null;
    BR.bk.push([f.botTag, brTag(by), ++BR.bkSeq, round(f.x + 3), round(f.y + 10), items]); if (BR.bk.length > 8) BR.bk.shift();
    G.kfeed.unshift({ a: ka, b: f.name, t: 0, me: by === G.p ? 1 : 0, txt: by ? '' : trHazTxt() });
  }
  if (G.kfeed.length > 6) G.kfeed.length = 6;
}

// ---------------- your Waker in a match ----------------
// runs before the usual fighter tick; returns false while you ride the barge
function brInput(p, I) { if (BR.wild) return wBrInput(p, I);
  if (p.onBarge) { brRide(p); return false; }
  if (p.dead) return true;
  if (p.glide) { I.lp = I.rp = I.l = I.r = I.dodgeP = I.armP = I.jumpP = false; }
  if (p.brUse) { I.lp = I.rp = I.l = I.r = I.dodgeP = I.armP = false; I.md = 0; }
  const it = heldItem();
  if (it && (it.type === 'brheal' || it.type === 'brfood') && !UI.open) { if (I.lp && !p.brUse) brStartUse(p, it.id); I.lp = I.l = false; }
  else if (it && it.type === 'bramp' && !UI.open) { if (I.lp) trFitAmp(p, it); I.lp = I.l = false; }
  if (!UI.open && !G.dialog) {
    if (pressed.KeyF && !BR.rkNear) { const c = brNearChest(p); if (c) brOpenChest(c, p); else if (trNearAnvil(p)) trForge(p); }
    if (pressed.KeyH) brQuickUse(p);
    if (pressed.KeyT) cycleArm(p);
  }
  return true;
}
function brAfter(p, I) { if (BR.wild) return wBrAfter(p, I); brGlide(p, I); brTickUse(p); }
// the camera follows whoever you are watching
function brCamTarget() { if (BR.wild) return wBrCamTarget();
  const p = G.p; if (!brOn()) return null;
  // on the barge: keep it near the top of the screen and show as much of the island below as fits
  if (!p.dead) return null; const s = BR.spec; return s && !s.gone ? s : null;
}

// ---------------- echoes: they loot, mind the storm, and fight ----------------
function brSee(f, o) {
  const x0 = f.x + 3, y0 = f.y + 6, x1 = o.x + 3, y1 = o.y + 6, n = ceil(hypot(x1 - x0, y1 - y0) / 6);
  for (let k = 1; k < n; k++) { const u = k / n, tx = floor(lerp(x0, x1, u) / T), ty = floor(lerp(y0, y1, u) / T), t = tileAt(tx, ty); if (TP[t].solid && t !== PLATFORM && !TP[t].ghost) return false; }
  return true;
}
// the ashfall's walls and the slag's line, for whoever plans a route in a match (see 07-fighters/2-nav.js)
const BR_NAV = { L: -1e9, R: 1e9, floor: 1e9 };
function brNav() { if (BR.wild) return wBrNav(); const z = BR.storm, ash = !!z && z.dps > 0 && BR.arena !== 1; BR_NAV.L = ash ? z.L : -1e9; BR_NAV.R = ash ? z.R : 1e9; BR_NAV.floor = BR.arena === 1 ? BR.slagY + 3 : 1e9; return BR_NAV; }
// how well armed someone is (-1: bare hands)
const brArm = o => { const W = o.isPlayer ? heldOf(o) : IT[o.wid]; return W && W.type === 'weapon' && !W.fist ? brTier(W.id) : -1; };
// How a fight with this foe looks from here: above 1 the echo fancies its chances. Health and ward, steel against steel,
// friends at its side, others closing in, and whether the foe is reeling or busy with a salve.
function brOdds(f, foe) {
  let mine = (f.hp + (f.ward || 0)) * (1 + .25 * (brArm(f) + 1)), theirs = (foe.hp + (foe.ward || 0)) * (1 + .25 * (brArm(foe) + 1));
  for (const o of G.fighters) { if (o === f || o === foe || o.dead || o.gone || o.onBarge || abs(o.x - f.x) + abs(o.y - f.y) > 150) continue; if (o.team === f.team) mine += 50; else theirs += o.team === foe.team ? 50 : 25; }
  if (foe.brUse || foe.hurtT > 6 || (foe.atk && foe.atk.rushed)) theirs *= .6;
  return mine / max(1, theirs);
}
// a quiet moment: every foe is either a long run away, or a fair way off with no line of sight
function brQuiet(f) { for (const o of foesOf(f)) { if (o.dead || o.onBarge || o.gone) continue; const d = abs(o.x - f.x) + abs(o.y - f.y) * 1.5; if (d < 70 || (d < 190 && brSee(f, o))) return false; } return true; }
// somewhere safer to run to: on ground the ashfall will leave alone, far from every foe, and out of sight of the one it runs from
function brRefuge(f, foe) {
  const z = BR.storm, cx = f.x + 3, away = -(sign(foe.x - f.x) || 1); let bx = clamp(cx + away * 220, z.L + 24, z.R - 24), bs = -1e9;
  for (let k = -4; k <= 4; k++) {
    if (!k) continue; const x = clamp(cx + k * 70, z.L + 24, z.R - 24), y = heights[clamp(floor(x / T), 2, WW - 3)] * T; let near = 1e9;
    for (const o of foesOf(f)) if (!o.dead && !o.onBarge && !o.gone) near = min(near, abs(o.x + 3 - x) + abs(o.y + o.h - y));
    // (running past the foe to get there, or hardly moving at all, is a poor way to be safer)
    const s = min(near, 340) + (brSee({ x: x - 3, y: y - 20 }, foe) ? 0 : 130) - abs(x - cx) * .2 - (sign(k) !== away ? 150 : 0) - (abs(x - cx) < 40 ? 200 : 0);
    if (s > bs) { bs = s; bx = x; }
  }
  return bx;
}
// which chest to go for: the one that is cheapest to get to by a real route (a chest it cannot get to is left alone).
// When it is not this echo's turn to look, it guesses from how far off each one is, as it always did.
function brBotChest(f) {
  const cx = f.x + 3, fy = f.y + f.h, z = BR.storm, seen = f.br.saw = navFlood(f, brNav()); let best = null, bd = 1e9;
  for (const c of BR.chests) {
    if (c.open || c.kind === 'bush' || !trLive(c) || trSealed(c) || f.br.skip.has(c.i)) continue; const x = c.x * T + 4, dx = abs(x - cx); if (dx > (c.feast || c.kind === 'drop' ? 1500 : 420)) continue;
    if (z && (x < z.L + 16 || x > z.R - 16)) continue; const dy = (c.y + 1) * T - fy;
    // (with the ashfall on the move, or about to be, a chest on ground it is about to take is not worth the walk back out)
    if (z && (z.moving || z.left < 60 * 30) && (x < z.nL + 16 || x > z.nR - 16)) continue;
    let d = seen ? navCost(x, (c.y + 1) * T) : -1; if (d === Infinity) continue;
    if (d < 0) { if (c.cave || dy < -7 * T) continue; d = (dx + abs(dy) * 2) * 1.25 * (seen ? 1.3 : 1); }
    // the feast and the barge's crates are worth crossing the island for
    d *= c.feast || c.kind === 'drop' ? .12 : 1; if (d < bd) { bd = d; best = c; }
  }
  return best;
}
// an echo on its way to a place (gy: the height of the ground there; left out, the open ground at gx). It goes by a real
// route; the old straight-line steering below is only for when there is no route at all
function brWalk(f, I, gx, gy) {
  const way = navTo(f, I, gx, gy, brNav()); if (way === 'stuck') brSteer(f, I, gx); else { I.wx = f.x + 3 + I.md * 40; I.wy = f.y + 8; }
  return way;
}
function brSteer(f, I, gx) {
  const B = f.ai, br = f.br, cx = f.x + 3, d = gx - cx;
  I.md = abs(d) < 5 ? 0 : sign(d); I.jumpH = false; I.down = false; I.wx = cx + I.md * 40; I.wy = f.y + 8;
  if (I.md) {
    const ax = floor((cx + I.md * 8) / T), fy = floor((f.y + f.h - 1) / T); let rise = 0;
    for (let k = 0; k < 9; k++) { if (TP[tileAt(ax, fy - k)].solid && tileAt(ax, fy - k) !== PLATFORM) rise = k + 1; else break; }
    if (f.onGround && B.jumpCd <= 0 && (rise >= 2 || f.hitWall)) { I.jumpP = I.jumpH = true; B.jumpCd = 16; }
    else if (!f.onGround && f.vy > -.4 && !f.dblUsed && (f.hitWall || rise >= 2) && canDbl(f)) I.jumpP = I.jumpH = true;
    else if (!f.onGround && f.vy < 0) I.jumpH = true;
  }
  const below = tileAt(floor(cx / T), floor((f.y + f.h + 1) / T)); if (below === PLATFORM && br.chest && (br.chest.y + 1) * T > f.y + f.h + 12) I.down = true;
  if (G.time % 30 === (f.botI | 0) % 30) { if (I.md && abs(cx - br.lx) < 3) { if (++br.stuck >= 3) { if (br.chest) br.skip.add(br.chest.i); br.chest = null; br.roam = null; br.stuck = 0; } } else br.stuck = 0; br.lx = cx; }
}
function brBotThink(f) { if (BR.wild) return wBrBotThink(f);
  const B = f.ai, I = B.I, br = f.br;
  I.lp = I.rp = I.jumpP = I.dodgeP = I.armP = false; I.l = I.r = false;
  if (f.hunter) return trHunterThink(f);
  if (f.dead) { I.md = 0; return I; }
  if (f.brUse) { I.md = 0; return I; }
  // echoes are wary: they run at the horn unless they are bold, do not pick fights bare-handed, keep their distance
  // on the first day and grow bolder as the island shrinks. Hit one and it will always answer.
  const early = BR.t < BR_DROP + 60 * 22 && !br.bold, unarmed = f.wid === 'fists', day = trClock().day;
  // how far off it will pick a fight: hardly at all at first, a little more each day, and anything in sight once the feast is on
  // On the first day, after the scramble at the Hearth, echoes leave each other alone (people who come close are fair game).
  const sec = trSec(), late = BR.storm && BR.storm.i >= 3, eng = early || unarmed ? 0 : sec < 45 ? 30 : late ? 240 : sec < TR_CYC ? 0 : sec < TR_FEAST ? 60 : sec < TR_CYC * 2 ? 110 : 230, engP = eng || (early || unarmed ? 0 : 60);
  const z = BR.storm, cx = f.x + 3, out = brOut(f) || (z && (cx < z.L + 6 || cx > z.R - 6));
  let foe = null, fd = 1e9;
  for (const o of foesOf(f)) {
    if (o.dead || o.onBarge || o.noHit) continue; const dx = abs(o.x - f.x), dy = abs(o.y - f.y), rng = o.hunter ? max(eng, 120) : o.brBot ? eng : engP;
    // a foe who is reeling, nearly done for, or busy with a salve is worth going further for, and is taken first
    const weak = rng > 0 && (!!o.brUse || o.hp < 35 || o.hurtT > 10); if (dx > (weak ? rng * 1.5 + 70 : rng) || dy > 80) continue;
    const dd = dx + dy * 1.5; if (dd * (weak ? .6 : 1) < fd && (dd < 60 || brSee(f, o))) { fd = dd * (weak ? .6 : 1); foe = o; }
  }
  // in a team an echo goes to the help of a mate who is fighting, and they take the same foe
  if (BR.size > 1 && !unarmed && !early && fd > 40) for (const m of G.fighters) {
    if (m === f || m.team !== f.team || m.dead || m.gone || !m.brIn || abs(m.x - f.x) > 300 || abs(m.y - f.y) > 120 || !(m.takenT > 0 || m.atk)) continue;
    const o = m.ai && m.ai.tgt && m.ai.tgt.team !== f.team ? m.ai.tgt : m.takenT > 0 ? m.lastHitBy : null; if (o && !o.dead && !o.gone && !o.onBarge && !o.noHit && o.team !== f.team && abs(o.x - f.x) < 320 && abs(o.y - f.y) < 120) { foe = o; fd = 0; break; }
  }
  // it does not start a fight it would likely lose (one that comes to it is another matter)
  if (foe && !late && fd > 50 && !(f.takenT > 0 && f.lastHitBy === foe) && brOdds(f, foe) < .7) foe = null;
  if (!foe && f.lastHitBy && !f.lastHitBy.dead && f.takenT > 0 && abs(f.lastHitBy.x - f.x) < 300) foe = f.lastHitBy;
  // two bare-handed echoes have better things to do than box each other to death
  if (foe && unarmed && foe.brBot && foe.wid === 'fists' && !foe.hunter) foe = null;
  // badly hurt with a salve in the pack, bare-handed against steel, or plainly outmatched: break away first. Running away is
  // a route to somewhere safer, and the salve waits until nobody can see it or get to it quickly. (Nobody outruns a Hollow
  // One, which needs no sight of its quarry: being outmatched by one is no reason to turn its back on it)
  // (Once it has turned to run it keeps running for a couple of seconds, though that takes the foe out of its sight or
  // betters its odds: otherwise it would turn back at once, and run again, and so dither on one spot)
  if (!foe && br.runF && G.time < br.runT && !br.runF.dead && !br.runF.gone && !br.runF.onBarge) foe = br.runF;
  const run = !!foe && foe === br.runF && G.time < br.runT;
  if (foe && !out && z && !late && (run || (f.hp < 38 && (br.heals > 0 || day < 3)) || (unarmed && brArm(foe) >= 0) || (day < 3 && !foe.hunter && brArm(foe) - brTier(f.wid) >= 2) || (!foe.hunter && brOdds(f, foe) < .5))) {
    if (!run) { br.runF = foe; br.runT = G.time + 150; }
    if (B.atkCd > 0) B.atkCd--; if (B.jumpCd > 0) B.jumpCd--;
    if (f.onGround && f.hp < 70 && br.heals > 0 && f.hurtT <= 0 && brQuiet(f)) { brStartUse(f, f.hp < 45 ? 'br_draught' : 'br_salve'); I.md = 0; return I; }
    if (br.ref === undefined || G.time >= br.refT || br.refF !== foe) { br.ref = brRefuge(f, foe); br.refT = G.time + 60; br.refF = foe; }
    if (brWalk(f, I, br.ref) !== 'go') br.refT = 0;
    if (abs(foe.x - f.x) < 40 && f.dodgeCd <= 0 && f.stam > 30 && Math.random() < .05) { I.dodgeP = true; I.md = -(sign(foe.x - f.x) || 1); } return I;
  }
  if (foe && !(out && z && z.dps >= 4)) { if (B.tgt !== foe) { B.tgt = foe; B.retarget = 40; } return aiThink(f); }
  if (B.atkCd > 0) B.atkCd--; if (B.jumpCd > 0) B.jumpCd--;
  let gx = null, gy, what = '';
  if (f.onGround && !out && f.hurtT <= 0 && ((f.hp < 70 && br.heals > 0) || ((f.ward || 0) < 50 && br.wards > 0))) {
    if (brQuiet(f)) { brStartUse(f, f.hp < 70 && br.heals > 0 ? (f.hp < 45 ? 'br_draught' : 'br_salve') : (f.ward < 25 ? 'br_ward' : 'br_shard')); I.md = 0; return I; }
    // someone could be on it before the salve is rubbed in: get out of their sight first
    if (z && f.hp < 55 && br.heals > 0) { let nf = null, nd = 1e9; for (const o of foesOf(f)) { const d = abs(o.x - f.x) + abs(o.y - f.y); if (!o.dead && !o.onBarge && !o.gone && d < nd) { nd = d; nf = o; } } if (nf) { if (br.ref === undefined || G.time >= br.refT || br.refF !== nf) { br.ref = brRefuge(f, nf); br.refT = G.time + 60; br.refF = nf; } gx = br.ref; } }
  }
  if (gx !== null) what = 'hide';
  else if (out || !z) gx = z ? (z.L + z.R) / 2 : cx;
  else if (trBotRekindle(f, I)) return I;
  else if (early) gx = br.home;
  else {
    if (z.left < 60 * 20 && (cx < z.nL || cx > z.nR)) gx = (z.nL + z.nR) / 2;
    // it leaves for the ground that will last while there is still time to walk there: the way is measured along a real
    // route (not as the crow flies), against the moment the ashfall's wall will be where it stands
    else if (z.i < STORM.length && (cx < z.nL + 30 || cx > z.nR - 30)) {
      const left = cx < z.nL + 30, edge = left ? z.nL + 50 : z.nR - 50;
      if (br.zn === undefined || G.time % 90 === (f.botI | 0) % 90) { const t = navReach(f, edge, undefined, brNav()); if (t >= 0 || br.zn === undefined) br.zn = t >= 0 && t < Infinity ? t : abs(edge - cx) / 1.45 * 1.6; }
      const u = clamp(left ? (cx - z.L) / max(1, z.nL - z.L) : (z.R - cx) / max(1, z.R - z.nR), 0, 1), wall = z.moving ? z.left * u : z.left + STORM[z.i][1] * 60 * u;
      if (wall < br.zn * 1.3 + 150) gx = (z.nL + z.nR) / 2;
    }
    if (gx === null) { if (br.chest && br.chest.open) { br.chest = null; br.think = 0; } if (--br.think <= 0) { br.chest = brBotChest(f); br.think = br.saw ? (br.chest ? 90 : 45) : 10; } if (br.chest) { gx = br.chest.x * T + 4; gy = (br.chest.y + 1) * T; what = 'chest'; } }
    // with nothing to open, an echo keeps near its team's first standing member
    if (gx === null && BR.size > 1) { const lead = G.fighters.find(o => o !== f && o.team === f.team && !o.dead && !o.gone && o.brIn); if (lead && abs(lead.x - f.x) > 110 && lead.x + 3 > z.L + 10 && lead.x + 3 < z.R - 10) { gx = lead.x + 3; gy = lead.y + lead.h; } }
    // otherwise it drifts from one named place or camp to another and waits there a while. It keeps off the open Hearth until late
    if (gx === null) { if (br.roam === null || --br.roamT <= 0) { const Q = BR.pois.filter(q => !q.hearth && q.x * T > z.nL + 30 && q.x * T < z.nR - 30 && abs(q.x * T - cx) < 2200); br.roam = Q.length && sec < TR_CYC * 2 ? fpick(Q).x * T + frand(-50, 50) : lerp(z.nL, z.nR, frand(.2, .8)); br.roamT = 700 + floor(Math.random() * 700); } gx = br.roam; what = 'roam'; }
  }
  // no way there at all: want something else (and leave that chest alone from now on)
  const way = brWalk(f, I, gx, gy);
  if (way === 'stuck') { if (what === 'chest' && br.chest) { br.skip.add(br.chest.i); br.chest = null; br.think = 0; } else if (what === 'roam') br.roam = null; else if (what === 'hide') br.refT = 0; }
  const c = br.chest;
  if (c && !c.open && abs(c.x * T + 4 - cx) < 10) {
    const dyc = (c.y + 1) * T - (f.y + f.h);
    if (abs(dyc) < 14 && f.onGround) { brOpenChest(c, f); br.chest = null; br.think = 0; br.wait = 0; }
    // (on a real route it is on its way up or down to the chest; the rest is for the old steering)
    else if (way !== 'stuck') br.wait = 0;
    // right under (or over) a chest it cannot reach: try a jump or two, then give that one up
    else if ((br.wait = (br.wait || 0) + 1) > 70) { br.skip.add(c.i); br.chest = null; br.wait = 0; }
    else if (dyc < -10 && f.onGround && B.jumpCd <= 0) { I.jumpP = I.jumpH = true; B.jumpCd = 24; } else if (dyc < -10 && !f.onGround) { I.jumpH = true; if (f.vy > -.4 && !f.dblUsed && canDbl(f)) I.jumpP = true; }
  } else br.wait = 0;
  return I;
}
// echoes riding the barge leap when it passes the spot they chose
function brBotRide(f) { if (BR.phase !== 'drop') brLeap(f); else brRide(f); }
function brBotAfter(f) { if (BR.wild) return wBrBotAfter(f); brGlide(f, f.ai.I); brTickUse(f); }
