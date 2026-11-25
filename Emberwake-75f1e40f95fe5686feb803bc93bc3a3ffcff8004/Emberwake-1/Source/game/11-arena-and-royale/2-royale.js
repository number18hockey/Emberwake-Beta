// ============================================================
//  THE ASHFALL: battle royale.
//  Everyone falls out of the sky over the island with nothing at all.
//  You gather, dig, knap and forge what you fight with; chests are few
//  and hold little. The ashfall closes in as people fall, not by the
//  clock, and the last Waker (or the last pact) standing wins. Empty
//  places are filled by echoes (computer players), who start with
//  nothing too.
//  Online, the match leader (the first person in the lobby) runs the
//  clock, the border and the echoes; every computer runs its own Waker
//  and shares it as presence, exactly like the Cinder Ring.
//  (the island: 5-royale-island; echoes: 6-royale-echoes; creatures,
//  gifts and the other cruelties of the games: 7-royale-games)
// ============================================================
const BR_MAX = 32, BR_FILL = 32, BR_HOLD = 4 * 60, BR_DROP = 16 * 60;
const BR_TIERS = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'], BR_TCOL = ['#c8c4d4', '#7ddc6f', '#5aa8ff', '#c77dff', '#ffd35a'];
const BR_MATT = { wood: 0, flint: 0, bone: 0, stone: 0, copper: 1, bronze: 2, rust: 2, chitin: 1, iron: 2, steel: 3, glass: 3, deep: 4, ember: 4, cinder: 4, gloom: 4, prism: 4 };
const BR_OLD = { sword: 1, spear: 0, fangs: 1, maul: 2, bow: 1, nunchaku: 1, kblade: 4, kmaul: 4, vpike: 3, vfangs: 3 };
const BR_BOTN = ['WREN', 'KESTREL', 'MARROW', 'TINDER', 'SORREL', 'FLINT', 'ROOK', 'BRAMBLE', 'EMBERLY', 'SALTWICK', 'HOLLIS', 'VESK', 'ODA', 'TALLOW', 'RUE', 'CINNA', 'THRESH', 'FINCH', 'ALDER', 'MAGS', 'PEWTER', 'QUILL', 'SEDGE', 'CLOVE', 'HAWTHORN', 'LARK', 'MOSS', 'NETTLE', 'OAKLEY', 'PIKE', 'REED', 'SABLE'];
// The border moves when enough Wakers have fallen: [share of the field still standing, share of the island left safe, damage a second outside].
// Nothing here runs on a clock, except that a field where nobody falls for a long while is made to move.
const BR_RING = [[.75, .72, 1], [.5, .46, 2], [.32, .27, 3], [.2, .13, 5], [.11, .05, 7], [.07, 0, 10]];
const BR_WARN = 40 * 60, BR_MOVE = 105 * 60, BR_RESTLESS = 5 * 60 * 60;
// titles a Waker earns with experience
const BR_TITLES = ['TRIBUTE', 'FORAGER', 'TRAPPER', 'SCAVENGER', 'RANGER', 'CAREER', 'VICTOR'];
const BR = {
  on: false, via: 'solo', code: 'open', matchType: 'unranked', rewarded: false, phase: '', mi: '', seed: 0, t: 0, ro: [], nb: 0, lead: true, leaderId: '', people: new Map(),
  cd: 0, cdAt: 0, cdMax: 0, chests: [], open: new Set(), mine: new Set(), zones: [], storm: null, ring: { n: 0, at: 0 }, lastFall: 0, bots: new Map(), bk: [], bkSeq: 0, bkSeen: new Map(),
  dlSeen: new Set(), dl: null, place: 0, spec: null, specT: 0, overT: 0, winner: '', winMe: false, pois: [], caves: [], nests: [], lakes: [], segs: [], segX: [], bio: null, mapCv: null,
  note: '', noteT: 0, chan: null, inStorm: false, poiNow: '', mapOpen: false, total: 0, lastAlive: 0, lastTeams: 0, lobbyT: 0, err: '', wxList: null, wxAt: 0,
  pactWith: '', pactFrom: '', pactFromT: 0, teammate: '', pactSeen: false, leaveT: 0, dropsOut: [], dropSeq: 0, dropSeen: new Map(), tookOut: [], tookSeq: 0, tookSeen: new Map(), tileOut: new Map(), applying: false,
  fallen: [], fallenT: 0, show: null, gifts: [], giftAt: 0, feast: 0, hazard: null, hounds: 0, bounty: null, mobT: 0, botMobT: 0
};
const brOn = () => WORLD.royale && BR.on;
const brTag = f => !f ? '' : f === G.p ? (NET.me || 'me') : f.botTag || f.peer || '';
const brSay = (s, t = 150) => { BR.note = s; BR.noteT = t; };

// reeds twist into twine as well as grass does, so a fen is as good a place to land as a moor
// (added after every other recipe: saved worlds know recipes by their number)
R('hand', 'twine', 1, { reed: 3 });

// ---------------- what carries over between matches: a pass level, a rating, a title ----------------
function brProfile() {
  const key = 'ew2.br.' + (typeof accountId === 'function' ? accountId() : 'none');
  try {
    const raw = typeof LS === 'object' ? JSON.parse(LS.get(key) || '{}') : {};
    return { xp: max(0, num(raw.xp) | 0), elo: clamp(num(raw.elo, 1000) | 0, 0, 9999), wins: max(0, num(raw.wins) | 0), matches: max(0, num(raw.matches) | 0), kills: max(0, num(raw.kills) | 0) };
  } catch (e) { return { xp: 0, elo: 1000, wins: 0, matches: 0, kills: 0 }; }
}
function brSaveProfile(p) {
  const key = 'ew2.br.' + (typeof accountId === 'function' ? accountId() : 'none');
  if (typeof LS === 'object' && !LS.set(key, JSON.stringify(p))) { console.warn('Could not save Battle Royale progression'); return false; }
  return true;
}
function brPassLevel() { return floor(brProfile().xp / 1000); }
const brTitle = lv => BR_TITLES[clamp(lv | 0, 0, BR_TITLES.length - 1)];
function brRewardMatch() {
  if (BR.rewarded || !G.p || !BR.place) return;
  BR.rewarded = true;
  const p = brProfile(), won = BR.winMe, place = clamp(BR.place, 1, max(1, BR.total));
  const ranked = BR.matchType === 'ranked' && BR.via !== 'solo';
  const xp = 100 + max(0, BR.total - place) * 20 + G.p.kills * 50 + (won ? 300 : 0);
  p.xp += xp; p.matches++; p.kills += G.p.kills; if (won) p.wins++;
  if (ranked) {
    const progress = BR.total > 1 ? (BR.total - place) / (BR.total - 1) : won ? 1 : 0;
    p.elo = clamp(p.elo + round((progress - .5) * 32), 0, 9999);
  }
  brSaveProfile(p);
  BR.rewardText = `+${xp} PASS XP` + (ranked ? `  ·  ELO ${p.elo}` : '');
}

// ---------------- how hard things hit here ----------------
// A match is won by how you fight, so better metal helps without deciding it: half of what a weapon has over flint
// counts. Quick and far-reaching weapons give up some of their bite for their ease.
// (the numbers come from many hundreds of duels between evenly matched echoes: see tests/battle-royale/balance.py)
const BR_BAL = { sword: .92, spear: .82, fangs: 1.08, maul: .84, bow: .85, chuks: 1.02, brawl: 1.25 };
const BR_KIND = { spear: .88, trident: .75, cleaver: .79, battleaxe: .75, greataxe: .76, halberd: .86, glaive: .86, greatsword: .88, mace: .9, warhammer: .92, club: 1.06, daggers: 1.06, claws: 1.06, sai: 1.04, kama: 1.04, fangs: 1.16, nunchaku: 1.12, shortsword: 1.04 };
const brDmgOf = W => !W || !W.dmg ? 0 : (W.dmg <= 9 ? W.dmg : 9 + (W.dmg - 9) * .5) * (BR_BAL[W.set] || 1) * (BR_KIND[W.id.slice(W.id.lastIndexOf('_') + 1)] || 1);
function brWeaponMul(f) { const W = f.atk && f.atk.W || heldOf(f); return W && W.type === 'weapon' && W.dmg ? brDmgOf(W) / W.dmg : 1; }
// beasts bite a Waker a little softer than in the story, and an echo softer still (so they are not all eaten)
const brWildHurt = f => (f.wildT = G.time, f === G.p) ? (SETTINGS.diff === 'hard' ? 1 : SETTINGS.diff === 'normal' ? .85 : .7) : .5;

// ---------------- loot ----------------
const brTier = id => { const it = IT[id]; if (!it || it.type !== 'weapon' || it.fist) return -1; return it.tier ? (BR_MATT[it.tier] ?? 0) : (BR_OLD[id] ?? 0); };
function brItems() {
  const v = (a, b, c, d, e) => ({ a, b, c, d, e });
  defI('br_salve', { name: 'Ember Salve', type: 'brheal', heal: 25, cap: 100, use: 70, stack: 6, icon: icon('vial', v('#ffd3a0', '#ff8a3d', '#c94a1e', '#5a2010', '#fff1a8')), desc: 'Heals 25. Takes a moment to rub in.' });
  defI('br_draught', { name: 'Heartroot Draught', type: 'brheal', heal: 60, cap: 100, use: 150, stack: 3, icon: icon('jug', v('#ffb0b0', '#e2483b', '#8f2233', '#4a1018', '#ffd0d0')), desc: 'Heals 60. Drink it somewhere safe.' });
  defI('br_shard', { name: 'Ward Shard', type: 'brheal', ward: 25, cap: 50, use: 80, stack: 6, icon: icon('stone', v('#e0f4ff', '#8fd0ff', '#4a8adf', '#22406a', '#ffffff')), desc: '+25 ward, up to 50. Ward takes blows before your health does.' });
  defI('br_ward', { name: 'Greatward Flask', type: 'brheal', ward: 50, cap: 100, use: 160, stack: 3, icon: icon('vial', v('#e0f4ff', '#5aa8ff', '#2a62c0', '#14305a', '#ffffff')), desc: '+50 ward, up to 100.' });
  defI('br_emberlight', { name: 'Emberlight', type: 'brheal', ward: 35, cap: 100, use: 55, stack: 2, icon: icon('vial', v('#fff1a8', '#ffb347', '#e2542b', '#6a2418', '#ffffff')), desc: 'A sponsor\'s gift: drink for 35 ward.' });
  // bare hands have no picture of their own, and anything without one can't be drawn in a slot: give them the fist's
  if (IT.fists && !IT.fists.icon) IT.fists.icon = icon('stone', v('#f2d2b0', '#d8a878', '#a87048', '#5a3420', '#ffffff'));
}
const BR_W = [['stone_club', 'wood_club', 'flint_spear', 'bone_club', 'flint_daggers', 'bone_spear'], ['copper_shortsword', 'copper_spear', 'bone_cleaver', 'bone_trident', 'flint_battleaxe', 'copper_mace'], ['bronze_sword', 'bronze_spear', 'iron_shortsword', 'bronze_battleaxe', 'iron_cleaver', 'bronze_mace']];
const BR_FOOD = [['berries', 2, 3], ['meat', 1, 1], ['egg', 1, 2], ['glowcap', 1, 1], ['berries', 3, 4]];
const BR_BUNDLE = [[['stick', 2, 4], ['fiber', 2, 4]], [['rock', 2, 3], ['flint', 1, 1]], [['log', 1, 2], ['resin', 1, 1]], [['bone', 2, 3]], [['rope', 1, 1], ['torch', 1, 2]], [['copper_ore', 2, 3], ['coal', 1, 1]], [['arrow', 3, 5]], [['hide', 1, 2], ['fiber', 2, 3]]];
const randiF = (a, b) => floor(a + Math.random() * (b - a + 1));
const brRoll = L => L.map(([id, a, b]) => [id, randiF(a, b)]).filter(e => IT[e[0]]);
// a chest holds two or three things, and almost never a weapon: weapons are made
function brLoot(c) {
  const out = [], R = Math.random;
  if (c.feast) { out.push([fpick(BR_W[R() < .75 ? 2 : 1]), 1], ['br_draught', 1], [R() < .5 ? 'br_ward' : 'br_shard', 1]); return out; }
  if (c.crown) { if (R() < .5) out.push([fpick(BR_W[R() < .8 ? 1 : 0]), 1]); else out.push(...brRoll([['copper_ore', 3, 4], ['tin_ore', 1, 2]])); out.push([R() < .5 ? 'br_draught' : 'br_salve', 1], ['br_shard', 1]); return out.slice(0, 3); }
  out.push(...brRoll(fpick(BR_BUNDLE)).slice(0, c.rare ? 2 : 1));
  if (c.rare) { const r = R(); if (r < .12) out.push([fpick(BR_W[R() < .65 ? 0 : 1]), 1]); else if (r < .34) out.push([fpick(['hide_head', 'hide_body', 'hide_legs', 'hide_feet']), 1]); else if (r < .6) out.push(['br_shard', 1]); else out.push(['br_salve', 1]); }
  else if (R() < .045) out.push([fpick(BR_W[0]), 1]); else if (R() < .4) out.push(['br_salve', 1]); else out.push(...brRoll([fpick(BR_FOOD)]));
  return out.filter(e => IT[e[0]]).slice(0, 3);
}

// ---------------- the border: it answers to the fallen, not the clock ----------------
function brZones(seed) {
  const r = mulberry32((seed ^ 0x5bd1e995) >>> 0), Wp = BRW * T, mid = Wp / 2, Z = [[3 * T, Wp - 3 * T]];
  BR_RING.forEach(([, fr], k) => {
    const L = Z[Z.length - 1][0], R = Z[Z.length - 1][1], w = fr * Wp, room = max(0, R - L - w); let nL = L + r() * room;
    // the Crown stays inside for the first three closings
    if (k < 3 && w > 0) nL = clamp(nL, max(L, mid + 240 - w), min(L + room, mid - 240)); Z.push([nL, nL + min(w, R - L)]);
  });
  return Z;
}
// how many may still be standing for the next closing
const brNextAt = () => BR.ring.n < BR_RING.length ? max(2, floor(BR.total * BR_RING[BR.ring.n][0])) : 0;
function brStormAt() {
  const Z = BR.zones, n = BR.ring.n; if (!n) return { L: Z[0][0], R: Z[0][1], nL: Z[1][0], nR: Z[1][1], i: 0, moving: false, warn: false, left: 0, dps: 0, next: brNextAt() };
  const k = n - 1, t = max(0, BR.t - BR.ring.at), dps0 = k ? BR_RING[k - 1][2] : 0, dps1 = BR_RING[k][2];
  if (t < BR_WARN) return { L: Z[k][0], R: Z[k][1], nL: Z[k + 1][0], nR: Z[k + 1][1], i: n, moving: false, warn: true, left: BR_WARN - t, dps: dps0, next: 0 };
  if (t < BR_WARN + BR_MOVE) { const u = (t - BR_WARN) / BR_MOVE; return { L: lerp(Z[k][0], Z[k + 1][0], u), R: lerp(Z[k][1], Z[k + 1][1], u), nL: Z[k + 1][0], nR: Z[k + 1][1], i: n, moving: true, warn: false, left: BR_WARN + BR_MOVE - t, dps: dps1, next: 0 }; }
  const q = min(n + 1, Z.length - 1); return { L: Z[n][0], R: Z[n][1], nL: Z[q][0], nR: Z[q][1], i: n, moving: false, warn: false, left: 0, dps: dps1, next: brNextAt(), done: n >= BR_RING.length };
}
// whoever leads the match calls the closings
function brRingTick(alive) {
  if (!BR.lead || BR.phase !== 'fight' || BR.ring.n >= BR_RING.length) return; const z = BR.storm; if (z.warn || z.moving) return;
  const quiet = BR.t - max(BR.lastFall, BR.ring.n ? BR.ring.at + BR_WARN + BR_MOVE : BR_DROP) > (alive <= 6 ? .6 : 1) * BR_RESTLESS;
  if (alive <= brNextAt() || quiet) { BR.ring = { n: BR.ring.n + 1, at: BR.t }; brRingCalled(quiet); }
}
function brRingCalled(quiet) { const n = BR.ring.n; G.banner = { text: n >= BR_RING.length ? 'THE LAST CLOSING' : 'THE ASHFALL STIRS', sub: quiet ? 'nobody has fallen in a long while. it grows restless' : BR.lastAlive + ' still stand. it will move in ' + round(BR_WARN / 60) + ' seconds', t: 0 }; sfx('roar', 0); BR.hazard = null; brHazardFor(n); }
const brOut = f => { const z = BR.storm, x = f.x + 3; return !!z && z.dps > 0 && (x < z.L || x > z.R); };
function brStormHurt(f) {
  const d = BR.storm.dps / 2; f.hp -= d; f.flash = 4; f.regenT = 0;
  if (f === G.p) { numPop(f.x + 3, f.y - 4, round(d * 10) / 10, '#c77dff'); sfx('hurt', 30); G.flash = max(G.flash, .12); G.flashCol = '170,70,200'; }
  if (f.hp <= 0) { f.hp = 0; f.cause = 'fell to the ashfall'; killFighter(f, null); }
}
// ---------------- how deep is too deep ----------------
// past BR_HOT the rock itself burns you; at the molten sea there is no getting out again
function brDeep(f) {
  const row = (f.y + f.h) / T; if (row < BR_HOT) return;
  if (row > BR_LAVA + 1.2) { f.hp = 0; f.ward = 0; f.cause = 'was swallowed by the lava'; for (let k = 0; k < 24; k++) P(f.x + 3 + frand(-6, 6), BR_LAVA * T, frand(-1, 1), frand(-4, -1), 40, fpick(['#ff7a2a', '#ffd35a', '#e2542b']), { glow: 1, g: .12 }); killFighter(f, null); return; }
  if ((BR.t + (f.botI | 0)) % 45 === 0) {
    const d = 1 + floor((row - BR_HOT) / 7); f.hp -= d; f.flash = 4; f.regenT = 0; if (f === G.p) { numPop(f.x + 3, f.y - 4, d, '#ff7a2a'); sfx('fire', 60); G.flash = max(G.flash, .14); G.flashCol = '255,110,40'; if (BR.noteT < 20) brSay('THE ROCK IS BURNING  ·  ' + max(0, ceil(BR_LAVA - row)) + ' PACES ABOVE THE LAVA', 80); }
    if (f.hp <= 0) { f.hp = 0; f.cause = 'burned in the deep'; killFighter(f, null); }
  }
}

// ---------------- the fall: everyone comes down somewhere else ----------------
// the island is cut into as many strips as there are Wakers, shuffled, and each comes down somewhere in their own
function brSlots(seed, n) { const r = mulberry32((seed ^ 0x3C6EF372) >>> 0), a = []; for (let i = 0; i < n; i++) a.push(round(50 + (i + .12 + .76 * r()) * (BRW - 100) / n)); for (let i = n - 1; i > 0; i--) { const j = floor(r() * (i + 1)), q = a[i]; a[i] = a[j]; a[j] = q; } return a; }
function brPlaceInSky(f, k) { f.slotX = (BR.slots[k] || BRW / 2) * T; f.x = f.px = f.slotX; f.y = f.py = 8 * T + (k % 3) * 10; f.vx = f.vy = 0; f.onGround = false; f.glide = true; f.noHit = true; f.ward = 0; for (const s of f.scarf) { s.x = s.ox = f.x + 3; s.y = s.oy = f.y + 5; } }
// hanging in the air until the horn
function brHover(f) { f.px = f.x; f.py = f.y; f.vx = f.vy = 0; f.y = 8 * T + ((f.botI | 0) % 3) * 10 + sin(G.time * .05 + f.slotX) * 2; tickScarf(f); }
function brGlide(f, I) {
  if (!f.glide) return;
  if (f.onGround || f.dead || liqAt(f.x + 3, f.y + f.h - 4)) { f.glide = false; f.noHit = false; f.inv = max(f.inv, 50); if (!f.dead) { dust(f.x + 3, f.y + f.h, 8); if (f === G.p) { sfx('land', 0); G.banner = null; brSay('GATHER  ·  DIG  ·  MAKE SOMETHING SHARP', 240); } } return; }
  const dive = I && I.down; f.vy = min(f.vy, dive ? 4.2 : 1.35); const want = (I ? I.md : 0) * 2.9; f.vx += (want - f.vx) * .07;
}

// ---------------- using salves and wards (it takes a moment) ----------------
function brStartUse(f, id) {
  const it = IT[id]; if (!it || it.type !== 'brheal') return false;
  const full = it.heal ? f.hp >= it.cap : (f.ward || 0) >= it.cap; if (full) { if (f === G.p) { sfx('deny'); brSay(it.heal ? 'Your health is full' : 'Your ward is as strong as that will make it', 90); } return false; }
  f.brUse = { id, t: 0, dur: it.use }; if (f === G.p) sfx('stir', 0); return true;
}
function brTickUse(f) {
  const u = f.brUse; if (!u) return;
  if (f.dead || f.hurtT > 0 || f.state !== 'normal' || f.glide) { f.brUse = null; if (f === G.p) brSay('Interrupted', 60); return; }
  if (++u.t < u.dur) { if (G.time % 6 === 0) P(f.x + frand(-1, 7), f.y + frand(4, 18), 0, -.5, 20, IT[u.id].ward ? '#8fd0ff' : '#ffb347', { glow: 1, g: -.01 }); return; }
  const it = IT[u.id]; f.brUse = null;
  if (f === G.p) { if (countItem(u.id) < 1) return; removeItem(u.id, 1); } else if (f.br) { if (it.heal) f.br.heals--; else f.br.wards--; }
  if (it.heal) { f.hp = min(it.cap, f.hp + it.heal); numPop(f.x + 3, f.y - 4, '+' + it.heal, '#7ddc6f'); }
  else { f.ward = min(it.cap, (f.ward || 0) + it.ward); numPop(f.x + 3, f.y - 4, '+' + it.ward, '#8fd0ff'); }
  fsx(f, 'heal', 0); burst(f.x + 3, f.y + 10, 12, it.ward ? ['#8fd0ff', '#ffffff'] : ['#7ddc6f', '#c9fff6'], 1.4, 30, { glow: 1, g: -.01 });
}
function brQuickUse(p) {
  const order = p.hp < 75 ? ['br_salve', 'br_draught', 'br_shard', 'br_ward', 'br_emberlight'] : ['br_shard', 'br_ward', 'br_emberlight', 'br_salve', 'br_draught'];
  for (const id of order) if (countItem(id) > 0 && brStartUse(p, id)) return;
  if (!p.brUse && !p.consume) { const food = ['salve', 'poultice', 'berries', 'glowcap', 'egg', 'meat'].find(id => countItem(id) > 0 && IT[id] && IT[id].type === 'food'); if (food) { eat(IT[food]); return; } sfx('deny'); }
}

// ---------------- chests ----------------
function brNearChest(f, r = 16) { let best = null, bd = r; for (const c of BR.chests) { if (c.open || c.hid) continue; const d = abs(c.x * T + 4 - (f.x + 3)) + abs((c.y + 1) * T - (f.y + f.h)) * .7; if (d < bd) { bd = d; best = c; } } return best; }
function brNearStation(f, r = 6) {
  const px = floor((f.x + 3) / T), py = floor((f.y + f.h / 2) / T); let best = null, bd = r + 1;
  for (const o of tileObjs.values()) { if (!STATIONS[o.id] || o.id === POST) continue; const d = abs(o.x - px) + abs(o.y - py) * .5; if (d < bd) { bd = d; best = o; } }
  return best;
}
function brOpenChest(c, f) {
  if (!c || c.open || c.hid) return; c.open = true; c.t = 0; BR.mine.add(c.i);
  const px = c.x * T + 4, py = c.y * T + 2; if (near(f)) sfx('craft', 0); burst(px, py, 10, c.rare ? ['#ffd35a', '#fff1a8'] : ['#ffb347', '#c98a5a'], 1.2, 24, { glow: 1 });
  const loot = brLoot(c);
  // what is inside is set down where it stands
  if (f === G.p) { loot.forEach(([id, n], k) => spawnDrop(id, n, px + (k - (loot.length - 1) / 2) * 7, py, 0, 0)); return; }
  if (f && f.br) for (const [id, n] of loot) brBotTake(f, id, n);
}
// what you drop when you fall: everything you carried
function brSpill(f) {
  const out = [];
  if (f === G.p) { for (let i = 0; i < INV_N; i++) { const s = inv[i]; if (s && IT[s.id]) { out.push([s.id, s.n]); inv[i] = null; } } for (const s of GEAR_SLOTS) if (G.gear[s]) { out.push([G.gear[s].id, 1]); G.gear[s] = null; } }
  else if (f.br) { if (f.wid && f.wid !== 'fists') out.push([f.wid, 1]); if (f.br.heals > 0) out.push(['br_salve', min(3, f.br.heals)]); if (f.br.wards > 0) out.push(['br_shard', min(2, f.br.wards)]); if (f.br.arrows > 0) out.push(['arrow', min(10, f.br.arrows)]); const bag = Object.entries(f.br.bag).filter(e => IT[e[0]] && e[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 4); for (const [id, n] of bag) out.push([id, min(6, n)]); }
  return out;
}
function brDropPile(x, y, items) { items = items.slice(0, 14); items.forEach(([id, n], k) => { if (IT[id] && n > 0) spawnDrop(id, n, x + frand(-5, 5), y - 4, (k - (items.length - 1) / 2) * .22, -.8 - frand(.5), true, 'd' + round(x) + ':' + round(y) + ':' + k); }); }

// ---------------- starting a match ----------------
// everyone runs this with the same seed, so everyone stands on the same island
function brEnterMatch(mi, seed, roster, nb) {
  const nick = G.nick, skin = G.skin;
  genRoyale(seed); freshSession(); WORLD.mode = 0; G.nick = nick; G.skin = skin; G.clock = .08; updateSun();
  const ro = roster.slice(0, BR_MAX);
  Object.assign(BR, { mapHide: false, mi, seed, t: 0, ro, nb: clamp(nb | 0, 0, BR_MAX - ro.length), rewarded: false, rewardText: '', phase: 'drop', open: new Set(), mine: new Set(), bots: new Map(), bk: [], bkSeq: 0, bkSeen: new Map(), dlSeen: new Set(), dl: null, place: 0, spec: null, specT: 0, overT: 0, winner: '', winMe: false, chan: null, note: '', noteT: 0, inStorm: false, poiNow: '', mapOpen: false, lastAlive: 0, lastTeams: 0, ring: { n: 0, at: 0 }, lastFall: 0, pactWith: '', pactFrom: '', pactFromT: 0, teammate: '', pactSeen: false, leaveT: 0, dropsOut: [], dropSeq: 0, dropSeen: new Map(), tookOut: [], tookSeq: 0, tookSeen: new Map(), tileOut: new Map(), applying: false, fallen: [], fallenT: 0, show: null, gifts: [], giftAt: 60 * 60, feast: 0, hazard: null, hounds: 0, bounty: null, mobT: 600, botMobT: 1200, wxAt: 0 });
  BR.total = BR.ro.length + BR.nb; BR.zones = brZones(seed); BR.storm = brStormAt(); BR.slots = brSlots(seed, BR.total); BR.wxList = wxSchedule(seed); NET.deathN = 0; NET.kb = ['', 0]; NET.hits = []; NET.shots = []; NET.seen.clear();
  inv = new Array(PACK_MAX).fill(null); INV_N = packCap(); G.sel = 0; G.food = 80;
  G.p = newPlayer(); Object.assign(G.p, { name: G.nick, brIn: true, ward: 0, team: 'me' }); G.fighters = [G.p]; G.npcs = []; G.enemies = [];
  for (const f of NET.peers.values()) { f.gone = true; } NET.peers.clear();
  brPlaceInSky(G.p, max(0, BR.ro.indexOf(brMe())));
  // echoes fill the empty places; the leader runs them, everyone else sees them through the leader
  rng = mulberry32((seed ^ 0x2545F491) >>> 0);
  if (BR.lead) for (let i = 0; i < BR.nb; i++) { const f = brNewBot(i, brSkill()); BR.bots.set(f.botTag, f); G.fighters.push(f); brPlaceInSky(f, BR.ro.length + i); }
  snapCam(); G.state = 'play'; UI.open = null; G.cine = null; G.dialog = null; BR.lastAlive = BR.total;
  G.banner = { text: 'THE ASHFALL', sub: BR.total + ' Wakers, and nothing in your hands', t: 0 }; sfx('quest', 0);
}
function brSolo() {
  BR.via = 'solo'; BR.lead = true; BR.on = true; NET.me = ''; NET.status = 'off';
  const seed = (Math.random() * 4294967296) >>> 0; brEnterMatch('s' + seed.toString(36), seed, ['me'], BR_FILL - 1);
}

// ---------------- the match, every tick ----------------
function brTick() {
  if (!BR.on) return;
  if (BR.phase === 'drop' || BR.phase === 'fight') BR.t++;
  // a day on the island lasts a quarter of an hour
  if (BR.phase !== 'over') G.clock = (.08 + BR.t / 54000) % 1;
  if (BR.t === BR_HOLD && BR.phase === 'drop') { G.banner = { text: 'LET THE GAMES BEGIN', sub: 'A / D to steer, S to dive', t: 0 }; sfx('cannon', 0); addShake(5); }
  BR.storm = brStormAt();
  if (BR.phase === 'drop' && BR.t >= BR_DROP) { BR.phase = 'fight'; BR.lastFall = BR.t; }
  if (BR.noteT > 0) BR.noteT--; if (BR.leaveT > 0) BR.leaveT--; if (BR.pactFromT > 0 && --BR.pactFromT === 0) BR.pactFrom = '';
  for (const c of BR.chests) if (c.open && c.t < 40) c.t++;
  // my Waker and my echoes answer to the border and the deep here; everyone else's computer handles theirs
  if (BR.t % 30 === 0 && BR.phase !== 'over') for (const f of G.fighters) if (f.brIn && !f.remote && !f.dead && !f.noHit && brOut(f)) brStormHurt(f);
  if (BR.phase !== 'over') for (const f of G.fighters) if (f.brIn && !f.remote && !f.dead && f.y > (BR_HOT - 4) * T) brDeep(f);
  const p = G.p; BR.inStorm = !p.dead && !p.noHit && brOut(p);
  // the named place you stand in, above ground or below
  if (!p.dead && !p.glide && G.time % 20 === 0) { const q = BR.pois.find(q => abs(q.x * T - p.x) < 26 * T && abs(heights[clamp(q.x, 0, BRW - 1)] * T - p.y) < 34 * T) || BR.caves.find(q => abs(q.x * T - p.x) < (q.r + 4) * T && abs(q.y * T - p.y) < 14 * T); const n = q ? q.name : ''; if (n && n !== BR.poiNow) G.note = { text: n, t: 0 }; BR.poiNow = n; }
  // spectating after you fall
  if (p.dead && BR.phase !== 'over') { const s = BR.spec; if (!s || s.dead || s.gone || !G.fighters.includes(s)) { BR.specT++; if (BR.specT > 50) { BR.spec = brAlive().find(f => f !== p) || null; BR.specT = 0; } } if (pressed.KeyD || pressed.ArrowRight || pressed.KeyA || pressed.ArrowLeft) brSpecNext(pressed.KeyA || pressed.ArrowLeft ? -1 : 1); }
  // who is left
  const alive = brAlive(), teams = new Set(alive.map(f => f.team)); BR.lastAlive = alive.length; BR.lastTeams = teams.size;
  brRingTick(alive.length); brGames();
  if (BR.phase === 'fight' && teams.size <= 1 && BR.t > BR_DROP + 60 && brRosterHere()) brOver(alive[0] || null);
  if (BR.phase === 'over') { BR.overT++; if (BR.via !== 'solo' && BR.overT > 60 * 14) brBackToLobby(); }
  if (BR.via !== 'solo') brNetTick();
}
// (online, nobody has won until the leader's echoes have shown up here)
const brRosterHere = () => BR.lead || BR.bots.size >= BR.nb || BR.t > BR_DROP + 1200;
const brAlive = () => G.fighters.filter(f => f.brIn && !f.dead && !f.gone);
function brSpecNext(d) { const a = brAlive().filter(f => f !== G.p); if (!a.length) return; const i = a.indexOf(BR.spec); BR.spec = a[((i < 0 ? 0 : i + d) % a.length + a.length) % a.length]; sfx('ui'); }
function brOver(w) {
  BR.phase = 'over'; BR.overT = 0; BR.winner = w ? w.name : ''; BR.winMe = !!(w && G.p && w.team === G.p.team);
  if (BR.winMe) BR.place = 1;
  brRewardMatch();
  if (BR.winMe) { G.banner = { text: w === G.p ? 'YOU ARE THE LAST EMBER' : 'YOUR PACT OUTLASTED THE ASHFALL', sub: G.p.kills + ' taken down. The ashfall settles.', t: 0 }; sfx('quest', 0); G.flash = .5; G.flashCol = '255,211,90'; for (let i = 0; i < 40; i++) P(G.p.x + 3 + frand(-60, 60), G.p.y - frand(10, 80), frand(-.5, .5), frand(.3, 1), 90, fpick(['#ffd35a', '#ff8a3d', '#fff1a8']), { glow: 1, g: .01 }); }
  else G.banner = { text: w ? w.name + ' IS THE LAST EMBER' : 'THE ASHFALL TOOK EVERYONE', sub: BR.place ? 'you placed #' + BR.place : '', t: 0 };
  if (w && w !== G.p) BR.spec = w;
}
// someone fell (called for every death this computer is in charge of)
function brDeath(f, by) {
  // whoever opened the wound is the one who did it
  const st = f.st || {}; if (!by && !f.cause) { const q = st.poison > 0 ? st.poisonBy : st.bleed > 0 ? st.bleedBy : null; if (q && q !== f && q.name && !q.gone) by = q; }
  const wild = by && !by.fighter, ka = by ? (by.name || '').toUpperCase() : '', txt = by ? '' : f.cause || (st.poison > 0 ? 'died of poison' : st.burn > 0 ? 'burned to death' : st.bleed > 0 ? 'bled out' : G.time - (f.wildT || -999) < 300 ? 'was taken by the wilds' : G.food <= 0 && f === G.p ? 'starved' : brOut(f) ? 'fell to the ashfall' : 'did not get up again');
  if (!by) f.cause = txt;
  if (f === G.p) {
    NET.deathN++; NET.kb = [wild ? '' : brTag(by), NET.deathN]; if (by && by.brBot && !by.remote) by.kills++;
    BR.place = brAlive().length + 1; const items = brSpill(f); BR.dl = [NET.deathN, round(f.x + 3), round(f.y + 10), items.slice(0, 14)]; brDropPile(f.x + 3, f.y + 10, items);
    G.kfeed.unshift({ a: ka, b: f.name, t: 0, me: 2, txt }); BR.spec = by && by.fighter && !by.dead && by !== f ? by : null; BR.specT = 0; f.brUse = null; f.consume = null;
  } else if (f.brBot && !f.remote) {
    if (by === G.p) brTookDown(f); else if (by && by.brBot && !by.remote) by.kills++;
    const items = brSpill(f); brDropPile(f.x + 3, f.y + 10, items); f.brUse = null;
    BR.bk.push([f.botTag, wild ? '' : brTag(by), ++BR.bkSeq, round(f.x + 3), round(f.y + 10), items.slice(0, 14), wild ? ka : txt]); if (BR.bk.length > 8) BR.bk.shift();
    G.kfeed.unshift({ a: ka, b: f.name, t: 0, me: by === G.p ? 1 : 0, txt });
  }
  brFallen(f);
  if (G.kfeed.length > 6) G.kfeed.length = 6;
}
function brTookDown(f) { G.p.kills++; G.banner = { text: 'TAKEN DOWN', sub: f ? f.name : '', t: 120 }; comboHit(true); sfx('newmove', 0); brDeed('kill'); }
// a cannon for every one of the fallen, and their face in the sky when the light goes
function brFallen(f) {
  if (f.counted) return; f.counted = true; BR.lastFall = BR.t; BR.fallen.push({ name: f.name, skin: f.skin | 0 }); if (f !== G.p && BR.teammate && BR.teammate === brTag(f)) brBreakPact(true);
  sfx('cannon', 250); const n = max(0, brAlive().filter(q => q !== f).length); if (f !== G.p && BR.noteT < 60) brSay('A CANNON SOUNDS  ·  ' + n + ' REMAIN', 110);
}

// ---------------- your Waker in a match ----------------
// runs before the usual fighter tick; returns false while you hang in the air waiting for the horn
function brInput(p, I) {
  if (BR.t < BR_HOLD && BR.phase === 'drop') { brHover(p); return false; }
  if (p.dead) return true;
  if (p.glide) { I.lp = I.rp = I.l = I.r = I.dodgeP = I.armP = I.jumpP = false; }
  if (p.brUse) { I.lp = I.rp = I.l = I.r = I.dodgeP = I.armP = false; I.md *= .5; }
  if (p.consume) { I.lp = I.rp = I.l = I.r = I.dodgeP = I.armP = I.jumpP = I.jumpH = false; I.md = 0; }
  const it = heldItem();
  if (it && it.type === 'brheal' && !UI.open) { if (I.lp && !p.brUse) brStartUse(p, it.id); I.lp = I.l = false; }
  if (!UI.open && !G.dialog && !p.glide) {
    if (pressed.KeyF) { const g = brNearGift(p), c = brNearChest(p); if (g) brOpenGift(g); else if (c) brOpenChest(c, p); else { const s = brNearStation(p), d = s && abs(s.x * T - p.x) < 20 ? null : brNearDoor(p); if (d) toggleDoor(d[0], d[1]); else if (s) openStation(s.x, s.y); } }
    if (pressed.KeyH) brQuickUse(p);
    if (pressed.KeyP) brPactKey(p);
  }
  return true;
}
function brNearDoor(p) { const px = floor((p.x + 3) / T), py = floor((p.y + 10) / T); for (let x = px - 2; x <= px + 2; x++) for (let y = py - 1; y <= py + 1; y++) { const t = tileAt(x, y); if (t === DOORC || t === DOORO) return [x, y]; } return null; }
function brAfter(p, I) { brGlide(p, I); brTickUse(p); }

// ---------------- pacts: two Wakers (or a Waker and an echo) who win or lose together ----------------
const brPactTeam = (a, b) => 'P:' + [a, b].sort().map(v => String(v).replace(/[^\w-]/g, '').slice(0, 24)).join(':');
const brAlly = () => BR.teammate ? NET.peers.get(BR.teammate) || BR.bots.get(BR.teammate) || null : null;
function brPactKey(p) {
  if (BR.pactFrom && !BR.teammate) { brFormPact(BR.pactFrom); return; }
  if (BR.teammate) {
    // twice to leave: once could be a slip of the finger
    if (BR.leaveT > 0) { brBreakPact(false); return; }
    const a = brAlly(); BR.leaveT = 200; brSay('PACT WITH ' + (a ? a.name : 'YOUR ALLY').toUpperCase() + '  ·  PRESS P AGAIN TO LEAVE IT', 200); sfx('ui'); return;
  }
  let best = null, bd = 84;
  for (const f of G.fighters) { if (f === p || f.dead || f.gone || !f.brIn || f.team === p.team || f.noHit) continue; const d = hypot(f.x - p.x, f.y - p.y); if (d < bd) { bd = d; best = f; } }
  if (!best) { brSay('MOVE CLOSE TO A WAKER AND PRESS P TO OFFER A PACT'); sfx('deny'); return; }
  if (best.botTag) {
    // an echo weighs you up on the spot (one run by another computer answers in its own time)
    if (best.remote) { BR.pactWith = best.botTag; BR.pactWithT = BR.t; brSay('PACT OFFERED TO ' + best.name); sfx('ui'); return; }
    if (brBotAgrees(best, p)) brJoinBot(best, p); else { brSay(best.name + ' WANTS NO PART OF IT'); sfx('deny'); if (best.br) best.br.asked = BR.t; } return;
  }
  BR.pactWith = best.peer; BR.pactWithT = BR.t; brSay('PACT OFFER SENT TO ' + best.name.toUpperCase(), 120); sfx('ui');
}
// an echo takes a pact with you
function brJoinBot(bot, p) { const team = brPactTeam(brMe(), bot.botTag); p.team = team; bot.team = team; if (bot.br) { bot.br.ally = p; bot.br.allyT = BR.t; } BR.teammate = bot.botTag; BR.pactSeen = true; BR.pactWith = ''; BR.pactFrom = ''; brPactMade(bot); }
function brPactMade(f) { brSay('PACT FORGED WITH ' + f.name.toUpperCase(), 180); sfx('quest', 0); burst(G.p.x + 3, G.p.y + 8, 18, ['#8ff5e6', '#ffffff', '#ffd35a'], 2, 32, { glow: 1 }); G.kfeed.unshift({ a: '', b: G.p.name, t: 0, me: 0, txt: 'and ' + f.name + ' have a pact' }); if (G.kfeed.length > 6) G.kfeed.length = 6; }
function brFormPact(id) {
  const p = G.p, f = NET.peers.get(id); if (!p || !f || BR.teammate || BR.pactWith !== id && BR.pactFrom !== id) return;
  const team = brPactTeam(brMe(), id); p.team = team; f.team = team; BR.teammate = id; BR.pactSeen = false; BR.pactWith = ''; BR.pactFrom = ''; brPactMade(f);
}
// theirs: they left (or fell); ours: we walked out
function brBreakPact(theirs, quiet) {
  const p = G.p, f = brAlly(); BR.teammate = ''; BR.pactSeen = false; BR.pactWith = ''; BR.pactFrom = ''; BR.leaveT = 0; BR.pactBroke = BR.t; if (p) p.team = 'me';
  if (f) { f.team = f.botTag ? f.botTag : 'r:' + f.peer; if (f.br) { f.br.ally = null; f.br.spurned = BR.t; } }
  if (quiet) return; const n = f ? f.name.toUpperCase() : 'YOUR ALLY'; brSay(f && f.dead ? n + ' HAS FALLEN  ·  THE PACT IS OVER' : theirs ? n + ' HAS LEFT THE PACT' : 'YOU LEAVE THE PACT WITH ' + n, 200); sfx(theirs ? 'deny' : 'ui', 0);
  if (f && !f.dead) { G.kfeed.unshift({ a: '', b: theirs ? f.name : p.name, t: 0, me: 0, txt: 'broke the pact with ' + (theirs ? p.name : f.name) }); if (G.kfeed.length > 6) G.kfeed.length = 6; }
}

// ---------------- things everyone must agree on: dug ground, dropped goods ----------------
function brTileChanged(i) { if (!BR.on || !WORLD.royale || BR.applying || BR.via === 'solo' || BR.phase === 'lobby' || !Number.isInteger(i) || i < 0 || i >= tiles.length) return; BR.tileOut.set(i, [i, tiles[i], walls[i]]); if (BR.tileOut.size > 1600) BR.tileOut.delete(BR.tileOut.keys().next().value); }
function brTilePacket() { const a = []; for (const [i, v] of BR.tileOut) { a.push(v); BR.tileOut.delete(i); if (a.length >= 40) break; } return a; }
function brQueueDrop(id, n, x, y, vx, vy) { if (!BR.on || !WORLD.royale || !IT[id]) return undefined; const seq = ++BR.dropSeq; if (BR.via !== 'solo' && BR.dropsOut.length < 120) BR.dropsOut.push([seq, id, n, round(x), round(y), r1(vx || 0), r1(vy || 0)]); return brMe() + ':' + seq; }
function brDropPacket() { return BR.dropsOut.splice(0, 18); }
// I picked this up: everyone else's copy of it goes
function brTook(d) { if (!d.uid || BR.via === 'solo') return; BR.tookOut.push([++BR.tookSeq, d.uid]); if (BR.tookOut.length > 24) BR.tookOut.shift(); }
// the camera follows whoever you are watching
function brCamTarget() { const p = G.p; if (!brOn() || !p.dead) return null; const s = BR.spec; return s && !s.gone ? s : null; }
