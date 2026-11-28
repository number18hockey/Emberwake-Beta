// ============================================================
//  Wild game, and the first venomous things.
//    wild pig     grazes in the green lands and bolts when you come near; pork and hide
//    willow hen   now roams the moor and the Mosswood too, not only the Willowmere; fowl, eggs, feathers
//    ash adder    lies in long grass, thorn and sand. Come close and it coils, then strikes: its venom poisons
//                 you for a long while and turns your stomach (the screen sways). Frostmint tea, nettle soup
//                 or an antidote settle it
//  Sickness: sicken(f, t) and the sway in render (14-main/1-main.js); SETTINGS.calm keeps the screen still and
//  only tints it.
// ============================================================
Object.assign(DROPS, {
  wildpig: [['pork', 1, 1, 3], ['hide', .6, 1, 1], ['bone', .3, 1, 1]],
  adder: [['venom', .7, 1, 1], ['hide', .25, 1, 1]],
  willowhen: [['egg', .9, 1, 2], ['feather', 1, 1, 3], ['fowl', .85, 1, 1]]
});
function gameSprites() {
  if (MOBSPR.pig0) return;
  const pig = { a: '#f4c4b4', b: '#d8907e', c: '#8a4a42', e: '#1d131b', n: '#ff9a8a' };
  MOBSPR.pig0 = spr(['..a........', '.abbbbbbb..', 'abbbbbbbbbn', 'bbbbbbbbebn', 'bbbbbbbbbb.', '.c.c...c.c.', '.c.c...c.c.'], pig);
  MOBSPR.pig1 = spr(['..a........', '.abbbbbbb..', 'abbbbbbbbbn', 'bbbbbbbbebn', 'bbbbbbbbbb.', 'c..c..c..c.', 'c...c.c...c'], pig);
  const ad = { a: '#d8b860', b: '#8a6a2a', c: '#4a3a1a', e: '#ff3a2a', t: '#e2483b', d: '#2a2010' };
  MOBSPR.adder0 = spr(['...........', '.......aab.', 'aab..aabeb.', 'bbbaabb....', '.ddbdd.....'], ad);
  MOBSPR.adder1 = spr(['........aa.', '.......abeb', 'aab...ab..t', 'bbbaabb....', '.ddbdd.....'], ad);
  MOBSPR.adderS = spr(['.........aab.', '.......aabebt', 'aabaaabb.....', 'bbbbbb.......', '.dddd........'], ad);
}
// ---- the wild pig ----
mob('wildpig', { w: 11, h: 7, hp: 24, dmg: 0, contact: false, name: 'Wild Pig', canStep: true }, (e, p, dx, dy, dist) => { grazeAI(e, p, dx, dist, 1.7, 2.1, 68); e.ph += abs(e.vx) * .35; },
  (e, x, y, o) => { gameSprites(); drawEnt(32, 16, 22, c => { c.scale(e.dir, 1); c.drawImage(MOBSPR[(e.ph | 0) % 2 ? 'pig1' : 'pig0'], -5, -7); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -3 }); });
// ---- the ash adder ----
mob('adder', { w: 10, h: 4, hp: 16, dmg: 6, contact: false, name: 'Ash Adder', canStep: true }, (e, p, dx, dy, dist) => {
  e.vy = min(e.vy + .25, 5);
  if (e.state === 'idle') {
    e.vx = approach(e.vx, 0, .1); if (e.t > e.wait && Math.random() < .02) { e.dir = Math.random() < .5 ? 1 : -1; e.vx = e.dir * .5; e.wait = 60 + frand(120); e.t = 0; }
    if (!p.dead && abs(dx) < 46 && abs(dy) < 18 && e.onGround) { e.state = 'coil'; e.t = 0; e.dir = sign(dx) || 1; if (near(e)) sfx('tele', 60); }
  } else if (e.state === 'coil') { e.vx *= .6; if (e.t >= 22) { e.state = 'strike'; e.t = 0; e.hitP = false; e.vx = e.dir * 3.4; e.vy = -1.5; } }
  else if (e.state === 'strike') {
    if (!e.hitP && !p.dead && overlap(e, p, 1)) { e.hitP = true; if (hurtFighter(p, e.dmg, e.x + e.w / 2, { kx: e.dir * 1.6, ky: -1.2, by: e })) { applyStatus(p, 'poison', e, { d: 720 }); sicken(p, 420); } }
    if (e.t > 14 && e.onGround) { e.state = 'back'; e.t = 0; e.vx = -e.dir * 1.2; }
  } else if (e.state === 'back') { e.vx *= .92; if (e.t > 50) { e.state = 'idle'; e.t = 0; } }
  moveBody(e);
}, (e, x, y, o) => { gameSprites(); const s = e.state === 'coil' || e.state === 'strike' ? 'adderS' : (G.time >> 4) & 1 ? 'adder1' : 'adder0'; drawEnt(32, 16, 16, c => { c.scale(e.dir, 1); c.drawImage(MOBSPR[s], -5, -5); }, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'coil' && (e.t >> 2) & 1), ly: -2 }); });
// where they live: pigs in the green lands, hens past the Willowmere, adders in long grass, thorn and sand
for (const [b, add] of Object.entries({ moor: [['wildpig', 2, 0, 1], ['willowhen', 2, 0, 1], ['adder', 1]], mosswood: [['wildpig', 3, 0, 1], ['willowhen', 2, 0, 1], ['adder', 1]], thorn: [['wildpig', 2, 0, 1], ['adder', 2]], willowmere: [['wildpig', 1, 0, 1]], fen: [['adder', 1]], dunes: [['adder', 2]] })) if (BIOME_MOBS[b]) BIOME_MOBS[b].push(...add);
for (const b of ['moor', 'mosswood', 'thorn', 'willowmere']) for (const M of MOODS[b] || []) if (M && M.mobs && M.mobs.some(m => m[0] === 'ashhare' || m[0] === 'mossdeer' || m[0] === 'willowhen')) M.mobs.push(['wildpig', 2, 0, 1]);
// ---------------- sickness: venom and bad food turn your stomach ----------------
function sicken(f, t) {
  if (!f || f.dead) return; const was = f.sick > 0; f.sick = max(f.sick | 0, t);
  if (f === G.p && !was) { numPop(f.x + 3, f.y - 12, 'SICK', '#9adc5a'); sfx('hurt', 0); }
}
// how far the screen sways (0 to 1) while you are sick; nothing at all with SCREEN MOTION: CALM
const sickSway = p => p && p.sick > 0 && !p.dead && !calmOn() ? min(1, p.sick / 90) : 0;
// the green at the edges of the screen while you are sick
function drawSick(c) {
  const p = G.p; if (!p || !(p.sick > 0) || p.dead) return; const uw = VS.uw, uh = VS.uh, k = min(1, p.sick / 90), a = (.16 + .06 * sin(G.time * .07)) * k;
  const g = c.createRadialGradient(uw / 2, uh / 2, min(uw, uh) * .3, uw / 2, uh / 2, max(uw, uh) * .7); g.addColorStop(0, 'rgba(110,190,80,0)'); g.addColorStop(1, `rgba(90,170,60,${a})`);
  c.fillStyle = g; c.fillRect(0, 0, uw, uh);
}
