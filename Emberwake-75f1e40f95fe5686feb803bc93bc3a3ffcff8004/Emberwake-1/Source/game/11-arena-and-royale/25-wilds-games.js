// ============================================================
//  The games themselves: the beasts of the island, and everything the
//  people watching do to make it a better show.
//    creatures      each land and each cave has its own; more at night
//    sponsors       a deed worth seeing earns a parcel on a silver chute
//    the Feast      when half have fallen, four tables are laid at the Crown
//    hazards        a stretch of the island burns, or chokes
//    the hounds     loosed on the last few
//    the Marked One whoever has taken down the most is shown to everyone
//    the fallen     a cannon for each; their faces in the sky
// ============================================================
const BR_MOBS = {
  moor: [['ashhare', 4], ['thornback', 3], ['mote', 3], ['husk', 3, 1]], mosswood: [['mossdeer', 5, 0, 1], ['ashhare', 2], ['thornback', 2], ['mote', 2], ['husk', 3, 1]], willowmere: [['willowhen', 5, 0, 1], ['mossdeer', 3, 0, 1], ['mote', 2], ['husk', 2, 1]],
  thorn: [['thornback', 5], ['ashhare', 2], ['mote', 1], ['husk', 3, 1]], fen: [['mote', 3], ['ashhare', 2], ['bat', 3, 1], ['husk', 2, 1]], dunes: [['ashhare', 3], ['mote', 2], ['glassfly', 1], ['husk', 2, 1]], scoria: [['rustback', 4], ['mote', 2], ['husk', 2, 1]], reach: [['mite', 4], ['glassfly', 2], ['ashhare', 2], ['husk', 2, 1]], ash: [['mote', 3], ['husk', 3], ['bat', 2, 1]]
};
const BR_PREY = new Set(['ashhare', 'willowhen', 'mossdeer']);

// ---------------- creatures ----------------
// each goes for whichever Waker run by this computer is nearest
function brMobTarget(e) {
  let best = G.p && !G.p.dead ? G.p : null, bd = best ? abs(best.x - e.x) + abs(best.y - e.y) * 1.4 - (e.tgtF === best ? 30 : 0) : 1e9;
  for (const f of G.fighters) { if (f.remote || f.dead || f.noHit || !f.brIn || f === G.p) continue; const d = abs(f.x - e.x) + abs(f.y - e.y) * 1.4 - (f === e.tgtF ? 30 : 0); if (d < bd) { bd = d; best = f; } }
  return e.tgtF = best || G.p;
}
function brTickMobs() {
  const arr = G.enemies, keep = G.p;
  for (let i = arr.length - 1; i >= 0; i--) {
    const e = arr[i]; if (!e) continue; if (!isFinite(e.x) || !isFinite(e.y) || e.y > BR_LAVA * T + 10) { arr.splice(i, 1); continue; }
    const t = e.dead ? keep : brMobTarget(e); if (t !== keep) { G.proxy = keep; G.p = t; } sfxHush = abs(e.x - keep.x) > 340 || abs(e.y - keep.y) > 240;
    try { tickEnemy(e, i, arr, G.p); } finally { G.p = keep; G.proxy = null; sfxHush = false; }
  }
  // what they did to echoes while the echoes stood in your place
  if (G.proxyHits.length) for (const [f, dmg, x, o] of G.proxyHits.splice(0)) if (f !== G.p) hurtFighter(f, dmg, x, o || {});
}
function brGround(tx, y0, y1) { for (let y = max(3, y0); y < min(WBRH - 4, y1); y++) if (solidAt(tx, y) && !TP[tileAt(tx, y)].ghost && !solidAt(tx, y - 1) && !solidAt(tx, y - 2) && !solidAt(tx, y - 3) && !liqAt(tx * T + 4, (y - 1) * T + 4)) return y; return -1; }
function brSpawnNear(f, edge, span) {
  const tx0 = floor((f.x + 3) / T), ty0 = floor((f.y + 10) / T), under = ty0 > heights[clamp(tx0, 0, WBRW - 1)] + 8, deep = ty0 > BR_HOT - 26, night = G.dn < .35, z = BR.storm;
  for (let k = 0; k < 14; k++) {
    const tx = tx0 + (Math.random() < .5 ? -1 : 1) * floor(frand(edge, edge + span)); if (tx < 6 || tx > WBRW - 7 || (z && (tx * T < z.L || tx * T > z.R))) continue;
    const gy = under ? brGround(tx, ty0 - 12, ty0 + 12) : brGround(tx, heights[tx] - 6, heights[tx] + 8); if (gy < 0) continue;
    let type; if (deep) type = Math.random() < .75 ? 'cinderling' : 'bat'; else if (under) type = pickMob([['bat', 3], ['husk', 3], ['crawler', 2], ['mote', 2], [wBrBio(tx) === 'reach' ? 'mite' : wBrBio(tx) === 'scoria' ? 'rustback' : 'mote', 2]], true); else type = pickMob(BR_MOBS[wBrBio(tx)] || BR_MOBS.moor, night);
    if (type === 'crawler') { let cy = gy - 4; while (cy > gy - 16 && !solidAt(tx, cy - 1)) cy--; if (!solidAt(tx, cy - 1)) type = 'husk'; else { return spawnMob('crawler', tx, cy); } }
    if (type === 'glassfly') { spawnMob('glassfly', tx + 1, gy); return spawnMob('glassfly', tx, gy); }
    return spawnMob(type, tx, gy);
  }
  return null;
}
function brSpawnTick() {
  const p = G.p; if (BR.phase !== 'fight' && BR.t < WBR_DROP * .8) return;
  if (--BR.mobT <= 0) {
    const night = G.dn < .35; BR.mobT = (night ? 130 : 240) + randiF(0, 160);
    if (!p.dead && !p.glide) { let n = 0; for (const e of G.enemies) if (!e.dead && abs(e.x - p.x) < 640 && abs(e.y - p.y) < 420 && !BR_PREY.has(e.type)) n++; const under = floor(p.y / T) > heights[clamp(floor(p.x / T), 0, WBRW - 1)] + 8; if (n < (under ? 4 : night ? 5 : 3) && G.enemies.length < 22) brSpawnNear(p, ceil(VS.vw / T / 2) + 3, 18); }
  }
  // the echoes' stretch of the island has its beasts as well
  if (BR.lead && --BR.botMobT <= 0) { BR.botMobT = 260 + randiF(0, 200); const L = G.fighters.filter(f => f.brBot && !f.remote && !f.dead && !f.glide && abs(f.x - p.x) > 900); if (L.length && G.enemies.filter(e => abs(e.x - p.x) > 700).length < 7) brSpawnNear(fpick(L), 14, 12); }
  // something has made its home in the caves' great rooms
  if (G.time % 30 === 0 && !p.dead) for (const n of BR.nests) if (!n.woke && abs(n.x * T - p.x) < 44 * T && abs(n.y * T - p.y) < 22 * T) { n.woke = true; for (const type of n.mobs) { const tx = n.x + randiF(-10, 10), gy = brGround(tx, n.y - 10, n.y + 14); if (gy > 0) { if (type === 'crawler') { let cy = gy - 4; while (cy > gy - 22 && !solidAt(tx, cy - 1)) cy--; spawnMob('crawler', tx, cy); } else spawnMob(type, tx, gy); } } }
}

// ---------------- sponsors ----------------
// a deed the watchers liked: a parcel comes down on a chute a few seconds later
function brDeed(kind) { if (!wBrOn() || BR.phase !== 'fight' || G.p.dead || BR.t < BR.giftAt) return; BR.giftAt = BR.t + 60 * 80; BR.giftDue = { at: BR.t + 200, kind }; }
function brGift(kind) {
  const p = G.p, R = Math.random, L = [], W = heldOf(p), bow = W && W.set === 'bow';
  if (p.hp < 45) L.push(['br_draught', 1]); else if (R() < .5) L.push(['br_salve', 1]); else L.push(['berries', 3]);
  if (bow) L.push(['arrow', 6]); else if (kind === 'kill') L.push(...brRoll([fpick([['copper_ore', 3, 4], ['br_shard', 1, 1], ['rope', 1, 2], ['coal', 2, 2]])])); else if (kind === 'craft') L.push(...brRoll([fpick([['leather', 1, 2], ['resin', 1, 2], ['flint', 2, 3], ['br_shard', 1, 1]])])); else L.push(['br_emberlight', 1]);
  const x = p.x + 3 + frand(-50, 50); BR.gifts.push({ x, y: p.y - 190, px: x, py: p.y - 190, t: 0, items: L.filter(e => IT[e[0]]), land: false }); G.note = { text: 'A SPONSOR SENDS A GIFT', t: 0 }; sfx('chime', 0);
}
function brNearGift(p) { return BR.gifts.find(g => g.land && abs(g.x - p.x - 3) < 18 && abs(g.y - p.y - p.h) < 22) || null; }
function brOpenGift(g) { BR.gifts = BR.gifts.filter(q => q !== g); burst(g.x, g.y - 4, 14, ['#ffffff', '#c9d8e8', '#ffd35a'], 1.4, 26, { glow: 1 }); sfx('craft', 0); g.items.forEach(([id, n], k) => spawnDrop(id, n, g.x + (k - (g.items.length - 1) / 2) * 7, g.y - 5, 0, 0)); }
function brTickGifts() {
  const p = G.p; if (BR.giftDue && BR.t >= BR.giftDue.at) { const k = BR.giftDue.kind; BR.giftDue = null; if (!p.dead) brGift(k); }
  for (let i = BR.gifts.length - 1; i >= 0; i--) { const g = BR.gifts[i]; g.px = g.x; g.py = g.y; g.t++; if (g.land) { if (g.t % 20 === 0 && near(g)) P(g.x + frand(-4, 4), g.y - 6, 0, -.4, 30, '#ffffff', { glow: 1, g: 0 }); if (g.t > 60 * 150) BR.gifts.splice(i, 1); continue; } g.y += .95; g.x += sin(g.t * .04) * .3 + (wxWind() || 0) * .5; const tx = floor(g.x / T), ty = floor(g.y / T); if (solidAt(tx, ty) || platAt(tx, ty) || liqAt(g.x, g.y)) { g.land = true; g.y = ty * T; dust(g.x, g.y, 6); } }
  // what the watchers notice
  if (G.time % 40 === 0 && !p.dead && BR.phase === 'fight') { if (!G.flags.brMade) for (const k in G.flags) if (k.startsWith('crafted_') && IT[k.slice(8)] && IT[k.slice(8)].type === 'weapon') { G.flags.brMade = true; brDeed('craft'); break; } if (p.hp < 24 && (BR.lowAt || 0) < BR.t) { BR.lowAt = BR.t + 60 * 200; brDeed('low'); } }
}

// ---------------- the watchers' cruelties ----------------
// a stretch inside the next circle that will burn, or choke (the seed decides where, so everyone knows the same)
function brHazardFor(n) {
  if (n < 2 || n > 5) return; const r = mulberry32((BR.seed ^ (n * 0x9E3779B9)) >>> 0), Z = BR.zones[min(n, BR.zones.length - 1)], w = (Z[1] - Z[0]) * (.2 + r() * .1), L = Z[0] + r() * max(0, Z[1] - Z[0] - w);
  BR.hazard = { kind: r() < .55 ? 'fire' : 'gas', L, R: L + w, at: BR.t + 25 * 60, end: BR.t + 75 * 60, said: 0 };
}
const brHazardOn = () => BR.hazard && BR.t >= BR.hazard.at && BR.t < BR.hazard.end;
const brInHazard = (x, pad = 0) => !!BR.hazard && BR.t > BR.hazard.at - 600 && BR.t < BR.hazard.end && x > BR.hazard.L - pad && x < BR.hazard.R + pad;
function brHazardTick() {
  const h = BR.hazard, p = G.p; if (!h) return; if (BR.t >= h.end) { BR.hazard = null; return; }
  if (!h.said && BR.t > h.at - 600) { h.said = 1; brSay(h.kind === 'fire' ? 'WILDFIRE IS COMING DOWN  ·  SEE THE STRIP' : 'A POISON FOG IS RISING  ·  SEE THE STRIP', 200); sfx('roar', 0); }
  if (BR.t < h.at) return; const inside = f => f.x + 3 > h.L && f.x + 3 < h.R;
  if (h.kind === 'fire') { if (!p.dead && BR.t % 22 === 0 && inside(p)) { const x = clamp(p.x + 3 + frand(-170, 170), h.L, h.R); G.dhaz.push({ kind: 'bomb', x, y: G.cam.y - 24, vx: frand(-.8, .8), vy: 1.6, g: .06, light: [.9, .4, .1] }); if (Math.random() < .25) { const gx = clamp(p.x + 3 + frand(-190, 190), h.L, h.R), gy = heights[clamp(floor(gx / T), 0, WBRW - 1)] * T; lightFire(gx, gy - 2, 12, 220, null); } } }
  if (BR.t % 40 === 0) for (const f of G.fighters) if (f.brIn && !f.remote && !f.dead && !f.noHit && inside(f) && (h.kind === 'gas' ? floor(f.y / T) < heights[clamp(floor(f.x / T), 0, WBRW - 1)] + 6 : f !== p && !wxCovered(f.x + 3, f.y) && Math.random() < .5)) { const d = h.kind === 'gas' ? 3 : 4; f.hp -= d; f.flash = 4; f.regenT = 0; if (f === p) { numPop(f.x + 3, f.y - 4, d, '#9adf6f'); sfx('hurt', 60); } if (f.hp <= 0) { f.hp = 0; f.cause = h.kind === 'gas' ? 'choked in the fog' : 'burned in the wildfire'; killFighter(f, null); } }
}
function brGames() {
  const p = G.p; brSpawnTick(); brTickGifts(); brHazardTick(); if (G.dhaz && G.dhaz.length) tickHazards(); if (BR.phase !== 'fight') return;
  const n = BR.lastAlive, big = BR.total >= 6;
  // the Feast
  if (!BR.feast && big && n <= floor(BR.total * .5)) { BR.feast = 1; BR.feastAt = BR.t + 45 * 60; G.banner = { text: 'A FEAST IS CALLED', sub: 'four tables at the Crown, in 45 seconds. what you need is on one of them', t: 0 }; sfx('quest', 0); }
  if (BR.feast === 1 && BR.t >= BR.feastAt) { BR.feast = 2; for (const c of BR.chests) if (c.feast) { c.hid = false; burst(c.x * T + 4, c.y * T, 20, ['#ffd35a', '#fff1a8'], 2, 40, { glow: 1 }); } brSay('THE FEAST IS LAID', 180); sfx('quest', 0); }
  // the hounds
  if (!BR.hounds && big && n <= max(3, floor(BR.total * .22))) { BR.hounds = 1; G.banner = { text: 'THE HOUNDS ARE LOOSED', sub: 'they were something else, once', t: 0 }; sfx('howl', 0); if (!p.dead) for (let k = 0; k < 3; k++) brHound(p); if (BR.lead) for (const f of G.fighters.filter(q => q.brBot && !q.remote && !q.dead).slice(0, 3)) brHound(f); }
  if (BR.hounds && BR.t % (60 * 45) === 0 && !p.dead && n > 1) { sfx('howl', 0); brHound(p); brHound(p); }
  // the Marked One
  if (BR.t % 120 === 0) { let best = null; for (const f of G.fighters) if (f.brIn && !f.dead && f.kills >= 3 && (!best || f.kills > best.kills)) best = f; if (best && best !== BR.bounty && (!BR.bounty || BR.bounty.dead || best.kills > BR.bounty.kills)) { BR.bounty = best; brSay((best === p ? 'YOU ARE' : best.name + ' IS') + ' THE MARKED ONE  ·  ' + best.kills + ' TAKEN DOWN', 190); sfx('tele', 0); } if (BR.bounty && (BR.bounty.dead || BR.bounty.gone)) BR.bounty = null; }
  // their faces, in the sky
  if (BR.t % (60 * 60 * 4) === 0 && BR.fallen.length > BR.fallenT) { BR.show = { list: BR.fallen.slice(BR.fallenT), t: 0 }; BR.fallenT = BR.fallen.length; sfx('shrine', 0); }
  if (BR.show && ++BR.show.t > 420) BR.show = null;
}
function brHound(f) {
  const tx0 = floor(f.x / T); for (let k = 0; k < 14; k++) { const tx = tx0 + (Math.random() < .5 ? -1 : 1) * randiF(30, 50); if (tx < 8 || tx > WBRW - 9) continue; const gy = brGround(tx, heights[tx] - 8, heights[tx] + 8); if (gy < 0) continue; const e = spawnMob(MOBX.gloamhound ? 'gloamhound' : 'thornback', tx, gy); e.name = 'HOUND'; e.hp = e.maxhp = 46; e.dmg = 12; return e; }
  return null;
}
