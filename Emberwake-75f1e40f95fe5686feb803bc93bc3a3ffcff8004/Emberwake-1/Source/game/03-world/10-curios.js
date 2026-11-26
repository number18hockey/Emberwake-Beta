// ============================================================
//  Curios: small things on the road between the big places, so a long
//  walk is never just grass. A milestone that still points true, a
//  Waker of an older age carved mid-form, a warm spring, three stones
//  that sing if you strike them in time, something buried, a hermit's
//  cold fire and what he wrote down, the ribs of something vast, a
//  cart the road took a wheel from.
//  They come from the seed like everything else, and only in worlds
//  with traits (land 4 and later): older worlds stay as they were.
// ============================================================
const CURIO = 94;
defT(CURIO, { name: 'Curio', dyn: true, hard: Infinity, dust: '#8d8794' });
const CURIO_AT = new Map(), CURIO_W = 170, CURIO_SPR = {};
const CURIO_KINDS = {
  moor: ['mile', 'rest', 'spring', 'stones', 'cache', 'hermit', 'cart', 'mile'], thorn: ['mile', 'cache', 'hermit', 'stones', 'cart', 'rest'], mosswood: ['mile', 'rest', 'spring', 'stones', 'cache', 'hermit', 'cart'], willowmere: ['spring', 'hermit', 'cache', 'cart', 'mile', 'rest'], reach: ['mile', 'rest', 'stones', 'spring', 'cache'],
  fen: ['spring', 'hermit', 'cache', 'cart', 'mile'], dunes: ['ribs', 'ribs', 'mile', 'cache', 'rest'], scoria: ['ribs', 'mile', 'cart', 'rest', 'stones'], ash: ['ribs', 'rest', 'cache', 'mile']
};
Object.assign(LOOT_T, {
  curio: [['shard', .7, 1, 3], ['salve', .5, 1, 2], ['whetstone', .35, 1, 1], ['iron_bar', .3, 1, 2], ['copper_bar', .4, 1, 3], ['scroll', .12, 1, 1], ['glowcap', .4, 1, 3], ['fieldmap', .08, 1, 1], ['iron_sabre', .06, 1, 1], ['compass', .05, 1, 1]],
  cart: [['rope', .6, 1, 2], ['cloth', .5, 1, 3], ['jerky', .6, 2, 4], ['ration', .4, 1, 2], ['torch', .6, 2, 5], ['fittings', .4, 2, 4], ['tin_bar', .3, 1, 2], ['arrow', .4, 5, 12], ['salt', .4, 1, 3]]
});
BLESS.cadence = { n: 'THE STONES', s: 'every chain begins in time', c: '#8ff5e6' };   // (not one the blessing stones give: BLESS_K was listed before this)
const NOTES = [
  'Do not hurry the blade. It tells you when. I learned that late.',
  'A shield-bearer turns what comes from the front. So I stopped coming from the front.',
  'Three stones up the road sing if you strike them low to high. Mind the pause between.',
  'In Ashrest the bushes sleep. Dry your berries in Emberfall or go hungry.',
  'The old ones grow big because nothing has managed to kill them. Be the first, or be elsewhere.',
  'A heavy blow on a broken guard. That is the whole art. The rest is waiting.',
  'Milestones still point true. Whoever set them expected to come back.',
  'When the weapon flashes at the top of its swing, let go. Not before. Not after.',
  'Rain puts nothing out here. The fire in this ground is older than rain.',
  'Went down for iron. Found a road at the bottom of the world. Did not follow it.',
  'If you meet her in the west, do not let her talk first.',
  'I kept the fire in the square for a season once. Wick does not remember. I do not mind.'
];
const BIG_N = { hamlet: 'a hamlet', fort: 'a hollow fort', castle: 'a fallen castle', pyramid: 'a sand pyramid', temple: 'a frozen temple', observatory: 'an old observatory' };

// where the curio of a stretch of land is, if it has one
function curioOf(k) { return pmemo('q' + k, () => curioOf0(k)); }
function curioOf0(k) {
  if (!WT_ON || DIM || WORLD.arena || hh(k, 1702, SEED) > .64) return null;
  const x = k * CURIO_W + 24 + floor(hh(k, 1701, SEED) * (CURIO_W - 48));
  if (inWindow(x, 26) || abs(x - SPAWN_X) < VIL_W + 60) return null;
  for (const o of [-9, 0, 9]) if (reservedAt(x + o) || lakeAt(x + o)) return null;
  const h0 = surf(x); for (const o of [-6, -4, -2, 2, 4, 6]) if (abs(surf(x + o) - h0) > 2) return null;
  const L = CURIO_KINDS[biomeE(x)]; if (!L) return null; return { x, kind: L[floor(hh(k, 1703, SEED) * L.length)] };
}
// no stalk grows on top of one
function curioNear(x) { if (!WT_ON) return false; const k = floor(x / CURIO_W); for (const q of [k - 1, k, k + 1]) { const c = curioOf(q); if (c && abs(x - c.x) < 8) return true; } return false; }
function curiosFinish(cx, x0, x1, here) {
  if (!WT_ON) return;
  for (let k = floor(x0 / CURIO_W) - 1; k <= floor(x1 / CURIO_W) + 1; k++) { const c = curioOf(k); if (c && here(c.x) && CURIO_B[c.kind]) withRng(hh(c.x, 1710, SEED) * 4294967296, () => CURIO_B[c.kind](c.x)); }
}
const curioPut = (x, y, k, o) => { dyn(x, y, CURIO); CURIO_AT.set(y * WW + x, Object.assign({ k }, o)); };
const curioMark = (x, y, name, sub) => { mark('q' + x, name, sub, x, y, 8); LANDMARKS[LANDMARKS.length - 1].small = 1; };
const clearUp = (x0, x1, gy, n = 5) => { for (let x = x0; x <= x1; x++) for (let y = gy - n; y < gy; y++) if (inW(x, y) && !TP[tiles[y * WW + x]].liquid) { tiles[y * WW + x] = AIR; } };
const CURIO_B = {
  mile(x) { const gy = flatten(x - 2, x + 2, DIRT); clearUp(x - 2, x + 2, gy); curioPut(x, gy - 1, 'mile'); tiles[(gy - 1) * WW + x - 2] = PEBBLE; curioMark(x, gy - 2, 'A MILESTONE', 'the old road still counts its paces'); },
  rest(x) { const gy = flatten(x - 3, x + 4, STONE); clearUp(x - 3, x + 4, gy, 6); curioPut(x, gy - 1, 'rest', { set: ['sword', 'spear', 'fangs', 'maul', 'chuks', 'bow'][floor(hh(x, 1711, SEED) * 6)] }); tiles[(gy - 1) * WW + x + 3] = FLOWER; curioMark(x, gy - 3, "A WAKER'S REST", 'someone knelt here and did not get up'); },
  spring(x) { const gy = flatten(x - 3, x + 3, STONE); clearUp(x - 3, x + 3, gy); curioPut(x, gy - 1, 'spring'); tiles[(gy - 1) * WW + x - 3] = GLOWCAP; tiles[(gy - 1) * WW + x + 3] = FLOWER; curioMark(x, gy - 2, 'AN EMBER SPRING', 'warm water, and a light in it'); },
  stones(x) { const gy = flatten(x - 5, x + 5, STONE); clearUp(x - 5, x + 5, gy, 6); for (let j = 0; j < 3; j++) curioPut(x - 3 + j * 3, gy - 1, 's' + j, { base: x }); curioMark(x, gy - 3, 'THE SINGING STONES', 'low, then middle, then high'); },
  cache(x) {
    const gy = flatten(x - 2, x + 2, DIRT); clearUp(x - 2, x + 2, gy); for (let y = gy; y < gy + 5; y++) for (let q = x - 1; q <= x + 1; q++) if (inW(q, y)) tiles[y * WW + q] = DIRT;
    tiles[(gy + 3) * WW + x] = AIR; chestAt(x, gy + 3, 'curio'); tiles[(gy - 1) * WW + x - 1] = PEBBLE; tiles[(gy - 1) * WW + x + 1] = PEBBLE; propC(CURIO_SPR.cross, x, gy, { lit: 1 }); curioMark(x, gy - 2, 'SOMETHING BURIED', 'the ground here has been turned');
  },
  hermit(x) {
    const gy = flatten(x - 4, x + 4, DIRT); clearUp(x - 4, x + 4, gy); dyn(x - 2, gy - 1, FIRE); dyn(x + 1, gy - 1, BEDROLL); tiles[(gy - 1) * WW + x + 4] = POT; tiles[(gy - 1) * WW + x - 4] = STICKS;
    curioPut(x + 3, gy - 1, 'note', { n: floor(hh(x, 1712, SEED) * NOTES.length) }); curioMark(x, gy - 2, "A HERMIT'S FIRE", 'whoever lived here wrote things down');
  },
  ribs(x) {
    const gy = flatten(x - 6, x + 6, biomeE(x) === 'ash' ? ASH : SAND); clearUp(x - 6, x + 6, gy, 4); prop(CURIO_SPR.ribs, x * T + 4 - (CURIO_SPR.ribs.width >> 1), gy * T - CURIO_SPR.ribs.height + 2, { lit: 1 });
    for (const o of [-5, -2, 2, 5]) if (rand() < .7) tiles[(gy - 1) * WW + x + o] = BONES; tiles[(gy - 1) * WW + x] = POT; if (rand() < .5) tiles[(gy - 1) * WW + x + 3] = POT;
    curioMark(x, gy - 3, 'THE RIBS', 'it lay down, and the land grew round it');
  },
  cart(x) { const gy = flatten(x - 3, x + 4, DIRT); clearUp(x - 3, x + 4, gy); propAt(CURIO_SPR.cart, x - 2, gy, { lit: 1 }); chestAt(x + 3, gy - 1, 'cart'); tiles[(gy - 1) * WW + x - 3] = STICKS; curioMark(x, gy - 2, 'A BROKEN CART', 'the road took a wheel'); }
};

// ---------------- what they look like ----------------
function buildCurioArt() {
  TEX[CURIO] = TEX[DIRT];
  const P = { a: '#2a2636', b: '#8a8498', B: '#6a6480', c: '#ffd35a', d: '#cfd6e0', g: '#3f3a4c', h: '#e8edf2' };
  CURIO_SPR.mile = { img: spr(['...aaa...', '..abbba..', '.abbbbba.', '.abbcbba.', '.abcccba.', '.abbcbba.', '.abBbbba.', '.abccbBa.', '.abbbbba.', '.aBbccba.', 'aabbbbbaa', 'ggggggggg'], P), ox: 0, oy: -4 };
  CURIO_SPR.rest = { img: spr(['.....aaaa......', '....abbbba.....', '...abbhbbba....', '...abBBBbba....', '...abBaBbba....', '....abbbba.....', '...aabbbbaa....', '..abbbbbbbba...', '..abhbbbbBba...', '..abbbddbbba...', '..abbadddabba..', '..abba.d.abba..', '..abBa.d.aBba..', '..abba.d.abba..', '..abBa.d.aBba..', '..abba.d.abba..', '.aabbaadaabbaa.', '.aGGGGGGGGGGGa.', 'aGGgGGGgGGGgGGa', 'aggggggggggggga'], Object.assign({}, P, { G: '#57516a' })), ox: -3, oy: -12 };
  CURIO_SPR.spring = { img: spr(['..aaaaaaaaaa..', '.abbbbbbbbbba.', 'abccccccccccba', 'abchcccchcccba', '.abbbBbbbbbba.', '..aabbbBbbaa..', '....gggggg....'], Object.assign({}, P, { c: '#ffb347', h: '#fff1a8' })), ox: -3, oy: 1 };
  CURIO_SPR.note = { img: spr(['.ppppp.', '.pwwwp.', '.pwlwp.', '.pwwwp.', '.pwlwp.', '.ppppp.', '...s...', '...s...', '...s...'], { p: '#8a7a68', w: '#e6dccc', l: '#5a4030', s: '#7a5a40' }), ox: 0, oy: -1 };
  for (let j = 0; j < 3; j++) { const h = 9 + j * 5, rows = []; for (let y = 0; y < h; y++) rows.push(y === 0 ? '..aaa..' : y === 1 ? '.abbba.' : y === h - 1 ? 'ggggggg' : (y === 3 || (y - 3) % 5 === 0) && y < h - 2 ? 'abtttba' : y % 4 === 2 ? 'abbBbba' : 'abbbbba'); CURIO_SPR['s' + j] = { img: spr(rows, Object.assign({}, P, { t: '#4fd8c8' })), ox: 0, oy: 8 - h }; }
  CURIO_SPR.cross = spr(['s.....s', '.s...s.', '..s.s..', '...s...', '..s.s..', '.s...s.', 's.....s'], { s: '#7a5a40' });
  CURIO_SPR.cart = spr(['........................', '..wwwwwwwwwwwwwwww......', '..wdddddddddddddDw......', '..wdDdddDdddDddddw..hh..', '..wddddddddddddddw.hh...', '..wwwwwwwwwwwwwwwwhh....', '...TTTTTTTTTTTTTTT......', '....ooo.......T.........', '...o.s.o......T.........', '..o..s..o.....TT........', '..osssss.o..............', '..o..s..o...............', '...o.s.o................', '....ooo.................'], { w: '#7a5a40', d: '#a07a50', D: '#8a6a48', T: '#4a3220', h: '#5a4030', o: '#3a2a20', s: '#5a4030' });
  { const [c, x] = mk(44, 26); x.strokeStyle = '#e6dccc'; x.lineWidth = 2; for (let k = 0; k < 4; k++) { const cx = 7 + k * 10, r = 13 - abs(k - 1.5) * 2; x.beginPath(); x.moveTo(cx, 26); x.quadraticCurveTo(cx - 5, 26 - r * 1.7, cx + 6, 26 - r * 1.75); x.stroke(); }
    x.fillStyle = '#b8a890'; for (let k = 0; k < 4; k++) x.fillRect(5 + k * 10, 23, 5, 3); x.fillStyle = '#e6dccc'; x.fillRect(2, 24, 40, 2); CURIO_SPR.ribs = outlined(c); }
}
function drawCurio(w, o) { const q = CURIO_AT.get(o.y * WW + o.x), s = q && CURIO_SPR[q.k]; if (s) w.drawImage(s.img, o.x * T + s.ox, o.y * T + s.oy); }
// the glow of a spring, the ring of a stone that has just been struck, the stone it is time to strike
function curioGlow(f, x0, x1, y0, y1) {
  if (!CURIO_AT.size) return;
  for (const o of tileObjs.values()) {
    if (o.id !== CURIO || o.x < x0 || o.x > x1 || o.y < y0 || o.y > y1) continue; const q = CURIO_AT.get(o.y * WW + o.x); if (!q) continue; const px = o.x * T, py = o.y * T;
    if (q.k === 'spring') { f.globalAlpha = .3 + .1 * sin(G.time * .06); f.fillStyle = '#ffb347'; f.fillRect(px - 2, py + 2, 12, 4); f.globalAlpha = 1; if (G.time % 9 === 0) P(px + frand(8), py + 3, 0, -.25, 40, fpick(['#ffd35a', '#fff1a8']), { g: -.003, fr: 1, glow: 1 }); }
    else if (q.k === 'mile') { f.globalAlpha = .35 + .15 * sin(G.time * .05 + o.x); f.fillStyle = '#ffd35a'; f.fillRect(px + 3, py - 1, 3, 3); f.globalAlpha = 1; }
    else if (q.k[0] === 's' && q.k.length === 2) {
      const S = G.sing, j = +q.k[1], h = 9 + j * 5; if (q.ringT > G.time) { f.globalAlpha = (q.ringT - G.time) / 40; f.fillStyle = '#8ff5e6'; f.fillRect(px, py + 8 - h, 7, h); f.globalAlpha = 1; }
      if (S && S.base === q.base && S.n === j && G.time - S.t >= SING_LO && G.time - S.t <= SING_HI) { f.fillStyle = '#ffffff'; f.fillRect(px + 2, py + 5 - h, 3, 1); f.fillRect(px + 3, py + 4 - h, 1, 3); }
    }
  }
}
function curioLights(x0, x1) { if (!CURIO_AT.size) return; for (const o of tileObjs.values()) { if (o.id !== CURIO || o.x < x0 - 20 || o.x > x1 + 20) continue; const q = CURIO_AT.get(o.y * WW + o.x); if (q && q.k === 'spring') addLight(o.x * T + 4, o.y * T + 2, .7, .45, .2); else if (q && q.k === 'mile') addLight(o.x * T + 4, o.y * T, .3, .24, .1); } }

// ---------------- using them ----------------
const SING_LO = 24, SING_HI = 52;
const curioUsed = i => !!(G.curios && G.curios[i] !== undefined), curioDay = i => G.curios && G.curios[i] !== undefined ? G.curios[i] : -99;
function curioInteract(L) {
  if (!CURIO_AT.size) return; const p = G.p, ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T);
  for (const o of tileObjs.values()) {
    if (o.id !== CURIO || abs(o.x - ptx) > 4 || abs(o.y - pty) > 4) continue; const i = o.y * WW + o.x, q = CURIO_AT.get(i); if (!q) continue; const at = { x: o.x * T + 4, y: (o.y + 1) * T, r: 13 };
    if (q.k === 'mile') L.push(Object.assign(at, { label: 'read the milestone', act: () => mileAct(o.x) }));
    else if (q.k === 'rest') L.push(Object.assign(at, { label: curioUsed(i) ? 'the stance is yours now' : 'study the stance', act: () => restAct(i, q) }));
    else if (q.k === 'spring') L.push(Object.assign(at, { label: worldDays() - curioDay(i) < 1 ? 'the spring is resting' : 'drink from the spring', act: () => springAct(i, o) }));
    else if (q.k === 'note') L.push(Object.assign(at, { label: 'read the note', act: () => noteAct(i, q) }));
    else if (q.k[0] === 's') L.push(Object.assign(at, { r: 9, label: 'strike the stone', act: () => stoneAct(i, q, o) }));
  }
}
// the milestone: how far home is, and the nearest great place you have not found
function mileAct(tx) {
  const home = SPAWN_X - tx; let best = null;
  for (let k = floor(tx / bigW()) - 4; k <= floor(tx / bigW()) + 4; k++) { const s = bigOf(k); if (s && abs(s.x - tx) > 30 && (!best || abs(s.x - tx) < abs(best.x - tx))) best = s; }
  say(`The milestone reads: HEARTHHOLD, ${abs(home)} paces ${home > 0 ? 'east' : 'west'}.`);
  if (best) { const d = best.x - tx; say(`Scratched under it: ${BIG_N[best.kind] || 'something'}, ${abs(d)} paces ${d > 0 ? 'east' : 'west'}.`); G.way = { x: best.x, n: (BIG_N[best.kind] || 'a place').toUpperCase(), t: G.time }; }
  else say('Nothing else is scratched on it.');
  sfx('ui');
}
function restAct(i, q) {
  if (curioUsed(i)) { say('You have learned what the stone had to teach.'); sfx('ui'); return; }
  if (!G.curios) G.curios = {}; G.curios[i] = r2(worldDays()); G.dirty = true; const p = G.p, sn = MOVESETS[q.set] ? q.set : 'sword';
  famGain(sn, 30); p.hp = min(p.maxhp, p.hp + 20); sfx('quest', 0); burst(p.x + 3, p.y + 6, 18, ['#ffd35a', '#fff1a8', '#ffffff'], 2, 44, { glow: 1, g: -.02 });
  say(`A Waker of an older age, carved in the middle of a form. You stand as the stone stands, until it makes sense.`); say(`${(FAM_NAME[sn] || sn).toUpperCase()}: you understand it better.`);
}
function springAct(i, o) {
  if (worldDays() - curioDay(i) < 1) { say('The spring has given what it had today. Come back tomorrow.'); sfx('ui'); return; }
  if (!G.curios) G.curios = {}; G.curios[i] = r2(worldDays()); G.dirty = true; const p = G.p;
  p.hp = p.maxhp; p.stam = p.maxstam; p.tonic = max(p.tonic || 0, 60 * 180); if (p.st) for (const k of ['burn', 'poison', 'bleed', 'frost']) delete p.st[k];
  G.banner = { text: 'WARMED', sub: 'whole again, and your wind comes back fast for a while', t: 0 }; sfx('quest', 0); G.flash = .3; G.flashCol = '255,180,90';
  burst(o.x * T + 4, o.y * T + 2, 26, ['#ffb347', '#ffd35a', '#fff1a8'], 2.4, 50, { glow: 1, g: -.02 });
}
function noteAct(i, q) {
  say('The note says: "' + NOTES[q.n % NOTES.length] + '"'); sfx('ui');
  if (!curioUsed(i)) { if (!G.curios) G.curios = {}; G.curios[i] = r2(worldDays()); G.dirty = true; addItem('jerky', 2); say('Under it, wrapped in cloth: dried meat. He will not be needing it.'); }
}
// the singing stones: low, middle, high, each struck as the next one glints
function stoneAct(i, q, o) {
  const j = +q.k[1], S = G.sing, base = q.base, done = worldDays() - curioDay(base) < 1;
  q.ringT = G.time + 40; beatNote(j * 2, false); sparks(o.x * T + 4, o.y * T - 2 - j * 5, 6, 0, 1.6, ['#8ff5e6', '#ffffff']);
  if (done) { say('The stones have sung today. They will again tomorrow.'); return; }
  const dt = S && S.base === base ? G.time - S.t : 1e9;
  if (j === 0) { G.sing = { base, n: 1, t: G.time }; return; }
  if (!S || S.base !== base || S.n !== j) { G.sing = null; say('Wrong stone. Begin with the lowest.'); sfx('deny'); return; }
  if (dt < SING_LO) { G.sing = null; say('Too soon. Let each note ring, and strike when the next stone glints.'); sfx('deny'); return; }
  if (dt > SING_HI) { G.sing = null; say('Too late: the note had died. Begin again with the lowest.'); sfx('deny'); return; }
  if (j === 1) { G.sing = { base, n: 2, t: G.time }; return; }
  G.sing = null; if (!G.curios) G.curios = {}; G.curios[base] = r2(worldDays()); G.dirty = true;
  G.bless = { k: 'cadence', t: BLESS_T }; G.banner = { text: 'THE STONES ANSWER', sub: 'for a while, every chain you begin is already in time', t: 0 }; sfx('quest', 0); G.flash = .35; G.flashCol = '143,245,230';
  for (let k = 0; k < 3; k++) { const c = CURIO_AT.get(i - (2 - k) * 3); if (c) c.ringT = G.time + 60 + k * 8; } burst(o.x * T + 4, o.y * T - 8, 30, ['#8ff5e6', '#ffffff', '#4fd8c8'], 2.6, 60, { glow: 1, g: -.02 });
}
// where the last milestone pointed, under the lead on the HUD
function drawMileWay(c, uw, y) {
  const W = G.way, p = G.p; if (!W || !p || WORLD.arena || DIM) return 0; const d = W.x * T - p.x, m = round(abs(d) / T);
  if (m < 26 || G.time - W.t > 60 * 60 * 12 || G.time < W.t) { G.way = null; return 0; }
  const s = `MILESTONE : ${W.n} ${d > 0 ? '→' : '←'} ${m}`, w = textW(s) + 12, x = uw - w - 4; c.fillStyle = 'rgba(18,13,31,.62)'; c.fillRect(x, y, w, 12); c.fillStyle = '#8ff5e6'; c.fillRect(x, y, 2, 12); textS(c, s, x + 6, y + 2, '#8ff5e6'); return 14;
}
