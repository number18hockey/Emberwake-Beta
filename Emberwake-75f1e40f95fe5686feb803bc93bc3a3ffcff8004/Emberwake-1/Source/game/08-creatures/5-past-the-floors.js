// ============================================================
//  Creatures past the floors, and the surface's new weather.
//    the Long Winter: frost wolves (in packs), rime wisps, ice golems,
//                     snow stalkers that wait under the drifts
//    the Hourworks:   clockmites, brass sentries, pendulum knights,
//                     rewinders that step back to where they were
//    the Thunderhead: storm kites, volt golems, gale harpies, sparklings
//    the Outside:     shades (only in the dark), hollow hounds, ash
//                     colossi, ember wraiths
//    the surface:     skyhawks round the peaks; stormcrows in a thunderstorm
//  A THUNDERSTORM can roll over the Waking Lands: lightning finds the high
//  ground, and any rod you raised; the Stormspire opens only then.
// ============================================================
function buildRealmMobs() {
  const S = (k, rows, pal) => { MOBSPR[k] = spr(rows, pal); };
  const wf = { a: '#ffffff', b: '#c8e0ea', c: '#62a9bc', d: '#4a5a6a', e: '#120d1f' }, wfT = ['..........aa.', '.........abba', '.aaaaaaaaabcb', 'abbbbbbbbbbbe', 'bbbbbbbbbbb..'];
  S('wolf0', wfT.concat(['.dd.....dd...', '.d.d...d.d...', '.d..d..d..d..']), wf); S('wolf1', wfT.concat(['..dd...dd....', '..dd...dd....', '.d..d.d..d...']), wf);
  S('wisp', ['...a...', '..aba..', '.abcba.', 'abcdcba', '.abcba.', '..aba..', '...a...'], { a: '#62a9bc', b: '#c9fff6', c: '#e8ffff', d: '#ffffff' });
  const gl = { a: '#e8ffff', b: '#8fd0d8', c: '#62a9bc', d: '#2a5a6a', e: '#ffffff' }, glT = ['....aaaaa.....', '...abbbbba....', '...bebbebb....', '...bbbbbbb....', '.aabbbbbbbaa..', 'abbbccccbbbba.', 'bbbcccccccbbb.', 'bbb.ccccc.bbb.', 'bb..bbbbb..bb.', 'cc..bbbbb..cc.', 'cc..ccccc..cc.'];
  S('golem0', glT.concat(['....bb.bb.....', '...bbb.bbb....', '...cc...cc....', '..dcc...ccd...']), gl); S('golem1', glT.concat(['....bb.bb.....', '....bbbbb.....', '....cc.cc.....', '...dcc.ccd....']), gl);
  const cm = { a: '#ffd35a', b: '#c9a44a', c: '#7a5218', d: '#3a2a14', e: '#ffffff' };
  S('mite0', ['..aaaa..', '.abbbba.', 'abebbeba', 'bbbbbbbb', 'bcbbbbcb', '.d.dd.d.'], cm); S('mite1', ['........', '..aaaa..', '.abbbba.', 'abebbeba', 'bbbbbbbb', 'd.d..d.d'], cm);
  S('kite0', ['aa..............aa', '.abb..........bba.', '..abbbbbbbbbbbba..', '....bbbccbbbb.....', '.......bb.........'], { a: '#9ab0ff', b: '#3a4268', c: '#ffffff' });
  S('kite1', ['..................', 'aabb..........bbaa', '.abbbbbbbbbbbbbba.', '....bbbccbbbb.....', '........bb........'], { a: '#9ab0ff', b: '#3a4268', c: '#ffffff' });
  const hh0 = { a: '#3a3450', b: '#1a1626', c: '#ff9a3d', d: '#0e0a16' }, hdT = ['..........aa.', '.........abba', '.aaaaaaaaabcb', 'abbbbbbbbbbb.', 'bbbbbbbbbbb..'];
  S('hhound0', hdT.concat(['.dd.....dd...', '.d.d...d.d...', '.d..d..d..d..']), hh0); S('hhound1', hdT.concat(['..dd...dd....', '..dd...dd....', '.d..d.d..d...']), hh0);
  S('hawk0', ['a.........a', 'aa.......aa', '.abb...bba.', '..abbcbba..', '....bbb....', '.....d.....'], { a: '#c9d8ff', b: '#6a7aa8', c: '#ffd35a', d: '#3a4268' });
  S('hawk1', ['...........', '...........', 'aabbbcbbbaa', '.aabbbbbaa.', '....bbb....', '.....d.....'], { a: '#c9d8ff', b: '#6a7aa8', c: '#ffd35a', d: '#3a4268' });
  S('crow0', ['a.........a', 'aa.......aa', '.abb...bba.', '..abbcbba..', '....bbb....', '.....d.....'], { a: '#3a4268', b: '#1e2236', c: '#e8f0ff', d: '#9ab0ff' });
  S('crow1', ['...........', '...........', 'aabbbcbbbaa', '.aabbbbbaa.', '....bbb....', '.....d.....'], { a: '#3a4268', b: '#1e2236', c: '#e8f0ff', d: '#9ab0ff' });
}
// ================= the Long Winter =================
mob('frostwolf', { w: 12, h: 7, hp: 170, dmg: 26, contact: false, canStep: true, kbRes: .3, name: 'Frost Wolf', glow: [.02, .06, .08] }, (e, p, dx, dy, dist) => {
  if (e.cd > 0) e.cd--;
  if (e.state === 'crouch') { grav(e); e.vx *= .7; moveBody(e); if (e.t > 12) { e.state = 'pounce'; e.t = 0; e.vy = -3.3; e.vx = e.dir * 3.9; e.hitP = false; } return; }
  if (e.state === 'pounce') { grav(e); moveBody(e); if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; if (hitP(e, e.dmg, { kx: e.dir * 3 })) applyStatus(p, 'frost', e, { d: 80 }); } if (e.onGround && e.t > 6) { e.state = 'idle'; e.t = 0; e.cd = 46; } return; }
  walker(e, p, dx, dy, dist, 2.1, 360); if (e.onGround && dist < 80 && dist > 22 && !(e.cd > 0) && !p.dead) { e.state = 'crouch'; e.t = 0; }
}, (e, x, y, o) => drawEnt(32, 16, 24, c => { c.scale(-(e.dir || 1), 1); if (e.state === 'pounce') c.rotate(-.2); c.drawImage(frameOf(e, 'wolf0', 'wolf1', .4), -6, -8 + (e.state === 'crouch' ? 1 : 0)); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -3 }));
mob('rimewisp', { w: 8, h: 8, hp: 130, dmg: 22, contact: false, fly: true, name: 'Rime Wisp', glow: [.2, .4, .5] }, (e, p, dx, dy, dist) => {
  e.ph += .1; if (e.a === undefined) e.a = frand(TAU);
  if (e.state === 'tele') { e.vx *= .9; e.vy *= .9; if (e.t === 24) { for (const k of [-.3, 0, .3]) { const a = atan2(dy, dx) + k; spawnProj({ type: 'orb', x: e.x + 4, y: e.y + 4, vx: cos(a) * 2.5, vy: sin(a) * 2.5, r: 2, dmg: 16, life: 130, col: '#c9fff6', col2: '#ffffff', sz: 2, frost: true, light: [.2, .35, .45] }); } sfx('tele', 40); } if (e.t > 40) { e.state = 'idle'; e.t = 0; } }
  else { e.a += .03; flyTo(e, p.x + 3 + cos(e.a) * 70, p.y - 34 + sin(e.a * 1.7) * 16, .07, 1.5); if (e.t > 130 && dist < 240 && !p.dead) { e.state = 'tele'; e.t = 0; } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.rotate(sin(G.time * .05 + e.seed) * .4); c.drawImage(MOBSPR.wisp, -3, -3); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + G.time * .07; rc(c, '#e8ffff', round(cos(a) * 6), round(sin(a) * 6), 1, 1); } }, x + e.w / 2, y + e.h / 2, { flash: o.flash || (e.state === 'tele' && (e.t >> 2) & 1), unlit: 1 }));
mob('icegolem', { w: 13, h: 18, hp: 460, dmg: 34, contact: false, canStep: true, kbRes: .8, armor: .7, name: 'Ice Golem' }, (e, p, dx, dy, dist) => {
  if (e.cd > 0) e.cd--;
  if (e.state === 'idle' || e.state === 'chase') { walker(e, p, dx, dy, dist, .5, 240); if (dist < 50 && abs(dy) < 30 && !(e.cd > 0) && !p.dead) { e.state = 'wind'; e.t = 0; sfx('tele'); } return; }
  grav(e, .3);
  if (e.state === 'wind') { e.vx *= .8; if (e.t > 36) { e.state = 'slam'; e.t = 0; addShake(5); sfx('boom', 30); const gy = (e.y + e.h); for (const s of [-1, 1]) for (let k = 1; k <= 3; k++) G.dhaz.push({ kind: 'spike', x: e.x + e.w / 2 + s * (10 + k * 12), y: gy, delay: 8 + k * 7, dmg: 20 }); if (abs(dx) < 30 && abs(dy) < 26) hitP(e, e.dmg, { kx: (sign(dx) || 1) * 4, ky: -3 }); dust(e.x + e.w / 2, e.y + e.h, 10, '#c9fff6', 1.6); } }
  else if (e.state === 'slam') { e.vx = 0; if (e.t > 44) { e.state = 'idle'; e.t = 0; e.cd = 70; } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(48, 24, 40, c => { c.scale(e.dir || 1, 1); const up = e.state === 'wind' ? -min(4, e.t / 7) : 0; c.translate(0, up * .3); c.drawImage(frameOf(e, 'golem0', 'golem1', .3), -7, -18); }, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'wind' && (e.t >> 2) & 1), ly: -8 }));
mob('snowstalker', { w: 8, h: 20, hp: 280, dmg: 30, contact: false, canStep: true, kbRes: .5, name: 'Snow Stalker' }, (e, p, dx, dy, dist) => {
  if (e.alpha === undefined) e.alpha = .12; if (e.cd > 0) e.cd--;
  if (e.state === 'idle') { grav(e); e.vx *= .8; moveBody(e); e.alpha = approach(e.alpha, .12, .02); e.noHit = false; if (dist < 70 && !p.dead) { e.state = 'rise'; e.t = 0; sfx('roar', 60); burst(e.x + 4, e.y + e.h, 14, ['#ffffff', '#c8e0ea'], 2, 26); } return; }
  e.alpha = approach(e.alpha, 1, .08);
  if (e.state === 'rise') { grav(e); moveBody(e); if (e.t > 18) { e.state = 'chase'; e.t = 0; } return; }
  if (e.state === 'chase') { walker(e, p, dx, dy, dist, 1.25, 320); if (dist > 300) { e.state = 'idle'; e.t = 0; } if (dist < 36 && !(e.cd > 0)) { e.state = 'swipe'; e.t = 0; } return; }
  grav(e); e.vx *= .8; moveBody(e);
  if (e.state === 'swipe') { if (e.t === 18 && abs(dx) < 40 && abs(dy) < 30) { if (hitP(e, e.dmg, { kx: e.dir * 4.5, ky: -3 })) applyStatus(p, 'frost', e, { d: 90 }); } if (e.t > 34) { e.state = 'chase'; e.t = 0; e.cd = 50; } }
}, (e, x, y, o) => drawEnt(64, 32, 40, c => {
  c.scale(e.dir || 1, 1); const sw = e.state === 'swipe' ? sin(min(1, e.t / 18) * PI * .5) : 0, step = sin(e.ph * .8) * 1.5;
  rc(c, '#c8e0ea', -4, -18, 9, 14); rc(c, '#ffffff', -3, -17, 7, 6); rc(c, '#c8e0ea', -3, -24, 7, 7); rc(c, '#120d1f', 0, -22, 2, 1); rc(c, '#62a9bc', -2, -20, 1, 1);
  rc(c, '#a8c0cc', -3, -5, 3, 5 + step * .3); rc(c, '#a8c0cc', 1, -5, 3, 5 - step * .3);
  c.save(); c.translate(3, -16); c.rotate(-.6 + sw * 2.2); rc(c, '#c8e0ea', 0, 0, 3, 11); rc(c, '#ffffff', 0, 10, 4, 2); c.restore();
}, x + e.w / 2, y + e.h, { flash: o.flash, alpha: e.alpha, ly: -10 }));
// ================= the Hourworks =================
mob('clockmite', { w: 8, h: 6, hp: 140, dmg: 22, contact: false, canStep: true, armor: .85, name: 'Clockmite', glow: [.12, .1, .03] }, (e, p, dx, dy, dist) => {
  grav(e, .26);
  if (e.onGround) { e.vx *= .7; if (e.t > e.wait) { const near = dist < 220 && !p.dead; e.dir = near ? (sign(dx) || 1) : (Math.random() < .5 ? -1 : 1); e.vy = -(2.8 + frand(1.2)); e.vx = e.dir * (near ? 1.9 + frand(.6) : .7); e.t = 0; e.wait = 18 + frand(28); e.sq = -1; sfx('clink', 60); } }
  const wg = e.onGround; moveBody(e); if (!wg && e.onGround) e.sq = 1; e.sq *= .86; touch(e, p);
}, (e, x, y, o) => { const s = e.sq || 0; drawEnt(32, 16, 24, c => { c.scale((e.dir || 1) * (1 + s * .3), 1 - s * .3); c.drawImage(e.onGround ? MOBSPR.mite0 : MOBSPR.mite1, -4, -6); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -3 }); });
mob('brasssentry', { w: 10, h: 10, hp: 260, dmg: 18, contact: false, fly: true, kbRes: .9, armor: .6, name: 'Brass Sentry', glow: [.3, .24, .08] }, (e, p, dx, dy, dist) => {
  if (e.hx === undefined) { e.hx = e.x; e.hy = e.y; } e.ph += .05;
  e.vx = approach(e.vx, clamp((e.hx + sin(e.t * .01) * 14 - e.x) * .02, -.5, .5), .03); e.vy = approach(e.vy, clamp((e.hy + sin(e.t * .02) * 5 - e.y) * .02, -.5, .5), .03);
  if (e.state === 'idle' && e.t > 90 && dist < 230 && !p.dead) { e.state = 'wind'; e.t = 0; sfx('clink'); }
  else if (e.state === 'wind' && e.t > 40) { e.state = 'fire'; e.t = 0; e.n = 0; }
  else if (e.state === 'fire') { if (e.t % 7 === 0 && e.n < 5) { e.n++; shootAt(e, p, { col: '#ffd35a', col2: '#fff1a8', sz: 1, sp: 3.4, dmg: 14, light: [.3, .24, .08] }); sfx('bolt', 50); } if (e.t > 50) { e.state = 'idle'; e.t = 0; } }
  e.x += e.vx; e.y += e.vy;
}, (e, x, y, o) => drawEnt(32, 16, 16, c => {
  const a = atan2(G.p.y + 10 - e.y - 5, G.p.x + 3 - e.x - 5); rc(c, '#3a2a14', -5, -5, 10, 10); c.save(); c.rotate(e.ph); for (let k = 0; k < 8; k++) { c.rotate(PI / 4); rc(c, '#c9a44a', -1, -7, 2, 3); } c.restore();
  rc(c, '#c9a44a', -4, -4, 8, 8); rc(c, '#ffd35a', -3, -3, 6, 6); rc(c, e.state === 'wind' && (e.t >> 2) & 1 ? '#ff3b2a' : '#3a2a14', round(cos(a) * 2) - 1, round(sin(a) * 2) - 1, 3, 3);
}, x + e.w / 2, y + e.h / 2, { flash: o.flash, unlit: 1 }));
mob('pendulumknight', { w: 9, h: 22, hp: 520, dmg: 32, contact: false, canStep: true, kbRes: .85, name: 'Pendulum Knight', glow: [.1, .08, .02] }, (e, p, dx, dy, dist) => {
  if (e.cd > 0) e.cd--; const facing = (sign(dx) || 1) === (e.dir || 1);
  e.armor = facing && e.state !== 'swing' && e.state !== 'recover' ? .3 : 1;
  if (e.state === 'idle' || e.state === 'chase') { walker(e, p, dx, dy, dist, .7, 300); if (dist < 52 && abs(dy) < 30 && !(e.cd > 0) && !p.dead) { e.state = 'wind'; e.t = 0; e.sw = 0; sfx('clink'); } return; }
  grav(e); moveBody(e);
  if (e.state === 'wind') { e.vx *= .8; if (e.t > 32) { e.state = 'swing'; e.t = 0; e.hitP = false; } }
  else if (e.state === 'swing') { e.vx = 0; e.sw = min(1, e.t / 14); if (!e.hitP && e.t > 5 && e.t < 14 && abs(dx) < 54 && abs(dy) < 34) { e.hitP = true; hitP(e, e.dmg, { kx: (sign(dx) || 1) * 5, ky: -3.4 }); } if (e.t > 16) { e.state = 'recover'; e.t = 0; } }
  else if (e.state === 'recover') { e.vx = 0; e.sw = max(0, 1 - e.t / 30); if (e.t > 46) { e.state = 'idle'; e.t = 0; e.cd = 40; } }
}, (e, x, y, o) => drawEnt(96, 48, 40, c => {
  c.scale(e.dir || 1, 1); const sw = e.state === 'wind' ? -min(1, e.t / 32) * .9 : e.sw ? -0.9 + e.sw * 2.4 : 0, step = sin(e.ph * .7) * 1.5;
  rc(c, '#3a2a14', -3, -6, 3, 6 + step * .3); rc(c, '#3a2a14', 1, -6, 3, 6 - step * .3); rc(c, '#7a5a28', -4, -18, 9, 13); rc(c, '#c9a44a', -3, -17, 7, 5); rc(c, '#ffd35a', -3, -24, 7, 7); rc(c, '#3a2a14', -1, -22, 3, 2);
  c.save(); c.translate(2, -16); c.rotate(sw); rc(c, '#7a5a28', 0, -1, 2, 26); c.beginPath(); c.fillStyle = '#ffd35a'; c.arc(1, 27, 5, 0, TAU); c.fill(); rc(c, '#7a5218', -1, 25, 4, 4); c.restore();
}, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'wind' && (e.t >> 2) & 1), ly: -10 }));
mob('rewinder', { w: 8, h: 18, hp: 220, dmg: 24, contact: false, canStep: true, kbRes: .4, name: 'Rewinder', glow: [.18, .14, .06] }, (e, p, dx, dy, dist) => {
  e.hist = e.hist || []; if (e.t % 6 === 0) { e.hist.push([e.x, e.y, e.hp]); if (e.hist.length > 20) e.hist.shift(); }
  if (e.cd > 0) e.cd--; if (e.rwCd > 0) e.rwCd--;
  // badly hurt: it steps back to where it stood two seconds ago, with the health it had then
  if (e.hp < e.maxhp * .5 && !(e.rwCd > 0) && e.hist.length > 12 && e.state !== 'rewind') { e.state = 'rewind'; e.t = 0; sfx('tele'); }
  if (e.state === 'rewind') { e.noHit = true; if (e.t === 14) { const h0 = e.hist[0]; burst(e.x + 4, e.y + 9, 14, ['#ffd35a', '#fff1a8'], 2, 22, { glow: 1 }); e.x = e.px = h0[0]; e.y = e.py = h0[1]; e.hp = max(e.hp, min(e.maxhp, h0[2])); e.hist = []; } if (e.t > 22) { e.noHit = false; e.state = 'chase'; e.t = 0; e.rwCd = 600; } return; }
  if (e.state === 'idle' || e.state === 'chase') { walker(e, p, dx, dy, dist, 1.15, 300); if (dist < 34 && !(e.cd > 0) && !p.dead) { e.state = 'cut'; e.t = 0; } return; }
  grav(e); e.vx *= .8; moveBody(e);
  if (e.state === 'cut') { if (e.t === 12 && abs(dx) < 36 && abs(dy) < 28) hitP(e, e.dmg, { kx: e.dir * 3.5, ky: -2.5 }); if (e.t > 26) { e.state = 'chase'; e.t = 0; e.cd = 30; } }
}, (e, x, y, o) => drawEnt(64, 32, 40, c => {
  c.scale(e.dir || 1, 1); const step = sin(e.ph * .8) * 1.5, cut = e.state === 'cut' ? min(1, e.t / 12) : 0;
  rc(c, '#5a4a30', -3, -6, 2, 6 + step * .3); rc(c, '#5a4a30', 1, -6, 2, 6 - step * .3); rc(c, '#c9a44a', -3, -16, 7, 10); rc(c, '#e8d8b0', -3, -22, 7, 6); rc(c, '#3a2a14', -2, -20, 5, 1); rc(c, '#3a2a14', 0, -21, 1, 3);
  c.save(); c.translate(3, -14); c.rotate(-1 + cut * 2.2); rc(c, '#fff1a8', 0, -1, 12, 2); c.restore();
}, x + e.w / 2, y + e.h, { flash: o.flash, alpha: e.state === 'rewind' ? max(.2, 1 - e.t / 14) : 1, ly: -10 }));
// ================= the Thunderhead =================
mob('stormkite', { w: 16, h: 5, hp: 190, dmg: 26, contact: false, fly: true, kbRes: .5, name: 'Storm Kite', glow: [.15, .18, .4] }, (e, p, dx, dy, dist) => {
  e.ph += .15;
  if (e.state === 'swoop') { if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; hitP(e, e.dmg, { kx: sign(e.vx) * 3.5, ky: -2.5, shock: 1 }); } if (e.t % 3 === 0) P(e.x + 8, e.y + 2, 0, 0, 16, '#e8f0ff', { glow: 1, g: 0 }); e.vy -= .06; if (e.t > 56) { e.state = 'idle'; e.t = 0; } }
  else { const a = e.t * .016; flyTo(e, p.x + 3 + cos(a) * 130, p.y - 70 + sin(a * 2) * 18 + (G.wind || 0) * 10, .05, 1.9); if (e.t > 120 && dist < 220 && !p.dead) { e.state = 'swoop'; e.t = 0; e.hitP = false; const d = hypot(dx, dy) || 1; e.vx = dx / d * 4.4; e.vy = dy / d * 4.4; sfx('tele'); } }
  e.dir = sign(e.vx) || e.dir || 1; e.x += e.vx + (G.wind || 0) * .3; e.y += e.vy;
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.scale(e.dir || 1, 1); c.rotate(clamp(e.vy * .1, -.4, .4)); c.drawImage(frameOf(e, 'kite0', 'kite1', .5), -9, -3); }, x + e.w / 2, y + e.h / 2, { flash: o.flash, unlit: 1 }));
mob('voltgolem', { w: 12, h: 16, hp: 540, dmg: 30, contact: false, canStep: true, kbRes: .8, armor: .75, name: 'Volt Golem', glow: [.2, .22, .5] }, (e, p, dx, dy, dist) => {
  if (e.cd > 0) e.cd--;
  if (e.state === 'idle' || e.state === 'chase') { walker(e, p, dx, dy, dist, .6, 260); if (dist < 80 && !(e.cd > 0) && !p.dead) { e.state = 'charge'; e.t = 0; sfx('tele'); } return; }
  grav(e); e.vx *= .8; moveBody(e);
  if (e.state === 'charge') { if (e.t % 4 === 0) P(e.x + frand(e.w), e.y + frand(e.h), frand(-1, 1), frand(-1, 1), 12, '#e8f0ff', { glow: 1, g: 0 }); if (e.t > 50) { e.state = 'burst'; e.t = 0; addShake(5); sfx('boom', 30); G.trails.push({ kind: 'ring', x: e.x + e.w / 2, y: e.y + e.h / 2, r: 46, life: 12, max: 12 }); if (dist < 50) hitP(e, e.dmg, { kx: (sign(dx) || 1) * 4, ky: -3, shock: 1 }); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; spawnProj({ type: 'orb', x: e.x + e.w / 2, y: e.y + e.h / 2, vx: cos(a) * 2.2, vy: sin(a) * 2.2, r: 2, dmg: 14, life: 60, col: '#9ab0ff', col2: '#ffffff', sz: 2, shock: 1, light: [.2, .25, .5] }); } } }
  else if (e.state === 'burst') { if (e.t > 40) { e.state = 'idle'; e.t = 0; e.cd = 90; } }
}, (e, x, y, o) => drawEnt(48, 24, 40, c => {
  c.scale(e.dir || 1, 1); const ch = e.state === 'charge' ? e.t / 50 : 0, step = sin(e.ph * .5) * 1.5;
  rc(c, '#2e3450', -5, -6, 4, 6 + step * .3); rc(c, '#2e3450', 2, -6, 4, 6 - step * .3); rc(c, '#3a4268', -7, -16, 14, 11); rc(c, '#6a7aa8', -6, -15, 12, 4); rc(c, '#3a4268', -4, -21, 9, 6);
  rc(c, ch > 0 && (G.time >> 1) & 1 ? '#ffffff' : '#9ab0ff', -2, -12, 5, 4); rc(c, '#e8f0ff', -1, -19, 3, 1); rc(c, '#3a4268', -10, -15, 3, 9); rc(c, '#3a4268', 7, -15, 3, 9);
}, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'charge' && (e.t >> 2) & 1), ly: -8 }));
mob('galeharpy', { w: 9, h: 9, hp: 210, dmg: 22, contact: false, fly: true, name: 'Gale Harpy' }, (e, p, dx, dy, dist) => {
  e.ph += .35;
  if (e.state === 'gust') { e.vx *= .9; e.vy *= .9; if (e.t === 20) { sfx('dodge', 30); for (let k = 0; k < 10; k++) P(e.x + 4, e.y + 4, (sign(dx) || 1) * frand(2, 4), frand(-.5, .5), 22, '#e8f0ff', { g: 0 }); if (abs(dx) < 120 && abs(dy) < 60 && !p.dead) { p.vx += (sign(dx) || 1) * 5.5; p.vy = min(p.vy, -2); } } if (e.t > 36) { e.state = 'dive'; e.t = 0; const d = hypot(dx, dy) || 1; e.vx = dx / d * 4; e.vy = dy / d * 4; e.hitP = false; } }
  else if (e.state === 'dive') { if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; hitP(e, e.dmg); } if (e.t > 30 || e.hitWall) { e.state = 'idle'; e.t = 0; } }
  else { flyTo(e, p.x + 3 + sin(e.t * .02) * 60, p.y - 40, .08, 1.7); if (e.t > 140 && dist < 140 && !p.dead) { e.state = 'gust'; e.t = 0; } }
  e.dir = sign(dx) || 1; moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.scale(e.dir, 1); const fl = sin(e.ph) * 3; rc(c, '#c8d0e8', -3, -3, 6, 6); rc(c, '#e8ecf8', -2, -6, 4, 4); rc(c, '#120d1f', 0, -5, 1, 1); rc(c, '#ffd35a', 2, -4, 2, 1); c.fillStyle = '#9ab0ff'; c.beginPath(); c.moveTo(-2, -2); c.lineTo(-10, -4 - fl); c.lineTo(-4, 1); c.fill(); c.beginPath(); c.moveTo(2, -2); c.lineTo(9, -5 - fl); c.lineTo(3, 1); c.fill(); rc(c, '#6a7aa8', -2, 3, 1, 3); rc(c, '#6a7aa8', 1, 3, 1, 3); }, x + e.w / 2, y + e.h / 2, { flash: o.flash || (e.state === 'gust' && (e.t >> 2) & 1) }));
mob('sparkling', { w: 5, h: 5, hp: 60, dmg: 14, contact: false, fly: true, name: 'Sparkling', glow: [.3, .35, .6] }, (e, p, dx, dy, dist) => {
  e.ph += .4; if (e.a === undefined) { e.a = frand(TAU); e.next = 60 + frand(80); }
  if (e.state === 'dart') { if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; hitP(e, e.dmg, { shock: 1 }); } if (e.t > 22 || e.hitWall) { e.state = 'idle'; e.t = 0; e.next = 60 + frand(80); } }
  else { e.a += .05; flyTo(e, p.x + 3 + cos(e.a) * 36, p.y + sin(e.a) * 20 - 14, .15, 2.3); if (e.t > e.next && dist < 110 && !p.dead) { const d = hypot(dx, dy) || 1; e.vx = dx / d * 4.6; e.vy = dy / d * 4.6; e.state = 'dart'; e.t = 0; e.hitP = false; } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.rotate(e.ph); rc(c, '#9ab0ff', -2, -1, 5, 3); rc(c, '#9ab0ff', -1, -2, 3, 5); rc(c, '#ffffff', -1, -1, 2, 2); }, x + e.w / 2, y + e.h / 2, { flash: o.flash, unlit: 1 }));
// ================= the Outside =================
mob('shade', { w: 8, h: 18, hp: 240, dmg: 26, contact: false, fly: true, name: 'Shade' }, (e, p, dx, dy, dist) => {
  if (e.alpha === undefined) e.alpha = 0; e.ph += .08;
  const lit = p.dark !== undefined && p.dark < 40; if (lit && e.state !== 'flee') { e.state = 'flee'; e.t = 0; }
  if (e.state === 'flee') { e.alpha = max(0, e.alpha - .05); e.noHit = e.alpha < .3; e.vy -= .02; e.x += e.vx; e.y += e.vy; if (e.alpha <= 0) e.dead = true; return; }
  e.alpha = min(.85, e.alpha + .03);
  if (e.state === 'blink') { e.noHit = true; if (e.t === 14) { const s = -(p.face || 1); e.x = e.px = p.x + 3 + s * 26 - e.w / 2; e.y = e.py = p.y - 4; e.vx = e.vy = 0; } if (e.t > 22) { e.noHit = false; e.state = 'grasp'; e.t = 0; } return; }
  if (e.state === 'grasp') { e.vx = 0; e.vy = 0; if (e.t === 16 && abs(dx) < 30 && abs(dy) < 26) hitP(e, e.dmg, { kx: (sign(dx) || 1) * 3 }); if (e.t > 32) { e.state = 'idle'; e.t = 0; } return; }
  flyTo(e, p.x + 3 + sin(e.t * .03) * 40, p.y + 2, .05, 1.2); if (e.t > 100 && dist < 200 && !p.dead) { e.state = 'blink'; e.t = 0; sfx('tele'); }
  e.x += e.vx; e.y += e.vy;
}, (e, x, y, o) => drawEnt(48, 24, 36, c => {
  const g = e.state === 'grasp' ? min(1, e.t / 16) : 0;
  c.fillStyle = '#0e0a16'; c.beginPath(); c.moveTo(-5, -18); c.quadraticCurveTo(0, -22, 5, -18); c.lineTo(6, -2 + sin(e.ph) * 2); c.lineTo(2, 0); c.lineTo(0, -3); c.lineTo(-2, 0); c.lineTo(-6, -2 - sin(e.ph) * 2); c.fill();
  rc(c, '#ff9a3d', -3, -16, 1, 1); rc(c, '#ff9a3d', 2, -16, 1, 1); if (g) { c.strokeStyle = '#0e0a16'; c.lineWidth = 2; c.beginPath(); c.moveTo(3, -10); c.lineTo(3 + 16 * g * (e.dir || 1), -8); c.stroke(); }
}, x + e.w / 2, y + e.h, { flash: o.flash, alpha: e.alpha, unlit: 1 }));
mob('hollowhound', { w: 12, h: 7, hp: 270, dmg: 28, contact: false, canStep: true, kbRes: .35, name: 'Hollow Hound', glow: [.2, .1, .02] }, (e, p, dx, dy, dist) => {
  if (e.cd > 0) e.cd--;
  if (e.state === 'crouch') { grav(e); e.vx *= .7; moveBody(e); if (e.t > 12) { e.state = 'pounce'; e.t = 0; e.vy = -3.2; e.vx = e.dir * 4; e.hitP = false; } return; }
  if (e.state === 'pounce') { grav(e); moveBody(e); if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; if (hitP(e, e.dmg, { kx: e.dir * 3 })) applyStatus(p, 'bleed', e, { d: 120 }); } if (e.onGround && e.t > 6) { e.state = 'idle'; e.t = 0; e.cd = 40; } return; }
  walker(e, p, dx, dy, dist, 2.2, 360); if (e.onGround && dist < 80 && dist > 22 && !(e.cd > 0) && !p.dead) { e.state = 'crouch'; e.t = 0; }
}, (e, x, y, o) => drawEnt(32, 16, 24, c => { c.scale(-(e.dir || 1), 1); if (e.state === 'pounce') c.rotate(-.2); c.drawImage(frameOf(e, 'hhound0', 'hhound1', .4), -6, -8 + (e.state === 'crouch' ? 1 : 0)); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -3, unlit: 1 }));
mob('ashcolossus', { w: 18, h: 30, hp: 980, dmg: 40, contact: false, canStep: true, kbRes: .95, armor: .7, name: 'Ash Colossus', glow: [.25, .12, .04] }, (e, p, dx, dy, dist) => {
  if (e.cd > 0) e.cd--;
  if (e.state === 'idle' || e.state === 'chase') { walker(e, p, dx, dy, dist, .45, 260); if (dist < 64 && abs(dy) < 40 && !(e.cd > 0) && !p.dead) { e.state = 'raise'; e.t = 0; sfx('tele'); } return; }
  grav(e, .3); e.vx *= .8; moveBody(e);
  if (e.state === 'raise') { if (e.t > 44) { e.state = 'fall'; e.t = 0; addShake(8); sfx('boom', 0); for (const s of [-1, 1]) spawnProj({ type: 'shock', x: e.x + e.w / 2 + s * 12, y: e.y + e.h - 4, vx: s * 2.8, vy: 0, r: 5, dmg: 22, life: 80 }); if (abs(dx) < 40 && dy > -50) hitP(e, e.dmg, { kx: (sign(dx) || 1) * 5, ky: -4 }); dust(e.x + e.w / 2, e.y + e.h, 18, '#a8a0b8', 2); } }
  else if (e.state === 'fall') { if (e.t > 50) { e.state = 'idle'; e.t = 0; e.cd = 80; } }
}, (e, x, y, o) => drawEnt(96, 48, 80, c => {
  c.scale(e.dir || 1, 1); const up = e.state === 'raise' ? min(1, e.t / 30) : 0, wk = sin(e.ph * .6) * 2;
  rc(c, '#3a3450', -8, -10 + max(0, wk), 6, 10); rc(c, '#3a3450', 3, -10 + max(0, -wk), 6, 10); rc(c, '#4a4458', -11, -30, 22, 21); rc(c, '#6a6480', -9, -29, 18, 6); rc(c, '#3a3450', -6, -38, 12, 9);
  rc(c, '#ff9a3d', -3, -35, 2, 2); rc(c, '#ff9a3d', 2, -35, 2, 2); for (const [a, b] of [[-6, -24], [3, -20], [-2, -15]]) rc(c, '#c94a2a', a, b, 2, 4);
  const ay = -28 - up * 18; rc(c, '#4a4458', -17, ay, 6, 18); rc(c, '#4a4458', 11, ay, 6, 18); rc(c, '#3a3450', -18, ay + 16, 8, 7); rc(c, '#3a3450', 10, ay + 16, 8, 7);
}, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'raise' && (e.t >> 2) & 1), ly: -14 }));
mob('emberwraith', { w: 9, h: 12, hp: 250, dmg: 24, contact: false, fly: true, name: 'Ember Wraith', glow: [.6, .3, .08] }, (e, p, dx, dy, dist) => {
  e.ph += .1; if (e.a === undefined) e.a = frand(TAU);
  if (e.state === 'tele') { e.vx *= .9; e.vy *= .9; if (e.t === 26) { for (const k of [-.18, .18]) { const a = atan2(dy, dx) + k; spawnProj({ type: 'orb', x: e.x + 4, y: e.y + 6, vx: cos(a) * 2.8, vy: sin(a) * 2.8, r: 3, dmg: 18, life: 140, col: '#ff9a3d', col2: '#fff1a8', sz: 2, burn: true, light: [.7, .35, .1] }); } sfx('fire', 40); } if (e.t > 44) { e.state = 'idle'; e.t = 0; } }
  else { e.a += .025; flyTo(e, p.x + 3 + cos(e.a) * 90, p.y - 50 + sin(e.a * 2) * 18, .06, 1.6); if (e.t > 110 && dist < 260 && !p.dead) { e.state = 'tele'; e.t = 0; } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.drawImage(MOBSPR.wraith, -5, -6 + sin(G.time * .08 + e.seed) * 1.5); rc(c, '#ff9a3d', -1, -4, 3, 2); }, x + e.w / 2, y + e.h / 2, { flash: o.flash || (e.state === 'tele' && (e.t >> 2) & 1), unlit: 1, alpha: .85 }));
// ================= the surface: up high, and in a storm =================
mob('skyhawk', { w: 11, h: 6, hp: 70, dmg: 14, contact: false, fly: true, name: 'Skyhawk' }, (e, p, dx, dy, dist) => {
  e.ph += .2; if (e.hx === undefined) { e.hx = e.x; e.hy = e.y; }
  if (e.state === 'swoop') { if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; hitP(e, e.dmg); } e.vy -= .07; if (e.t > 50) { e.state = 'idle'; e.t = 0; } }
  else { const a = e.t * .02 + e.seed; flyTo(e, (dist < 260 ? p.x + 3 : e.hx) + cos(a) * 90, (dist < 260 ? p.y : e.hy) - 70 + sin(a * 2) * 12, .05, 1.7); if (e.t > 160 && dist < 160 && !p.dead) { e.state = 'swoop'; e.t = 0; e.hitP = false; const d = hypot(dx, dy) || 1; e.vx = dx / d * 3.8; e.vy = dy / d * 3.8; sfx('tele'); } }
  e.dir = sign(e.vx) || e.dir || 1; e.x += e.vx; e.y += e.vy;
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.scale(e.dir || 1, 1); c.drawImage(frameOf(e, 'hawk0', 'hawk1', .25), -5, -3); }, x + e.w / 2, y + e.h / 2, { flash: o.flash }));
mob('stormcrow', { w: 11, h: 6, hp: 110, dmg: 18, contact: false, fly: true, name: 'Stormcrow', glow: [.1, .12, .3] }, (e, p, dx, dy, dist) => {
  e.ph += .25;
  if (e.state === 'dive') { if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; hitP(e, e.dmg, { shock: 1 }); } if (e.t > 34 || e.hitWall) { e.state = 'idle'; e.t = 0; } }
  else { const a = e.t * .03 + e.seed; flyTo(e, p.x + 3 + cos(a) * 60, p.y - 50 + sin(a) * 16, .08, 2); if (e.t > 120 && dist < 150 && !p.dead) { e.state = 'dive'; e.t = 0; e.hitP = false; const d = hypot(dx, dy) || 1; e.vx = dx / d * 4.2; e.vy = dy / d * 4.2; } }
  e.dir = sign(e.vx) || e.dir || 1; moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.scale(e.dir || 1, 1); c.drawImage(frameOf(e, 'crow0', 'crow1', .25), -5, -3); }, x + e.w / 2, y + e.h / 2, { flash: o.flash, unlit: 1 }));
// what they leave
Object.assign(DROPS, {
  frostwolf: [['frost_pelt', .8, 1, 2], ['meat', .8, 1, 2], ['rime_ore', .15, 1, 2]], rimewisp: [['frostbell', .6, 1, 2], ['glacier_ice', .6, 1, 3]], icegolem: [['glacier_ice', 1, 3, 6], ['rime_ore', .6, 2, 4], ['frost_heart', .3, 1, 1]], snowstalker: [['frost_pelt', 1, 2, 3], ['bone', .6, 1, 3], ['rime_ore', .3, 1, 2]],
  clockmite: [['ancient_gear', .5, 1, 2], ['cogstone', .5, 1, 2], ['hour_ore', .12, 1, 2]], brasssentry: [['ancient_gear', .8, 1, 3], ['hour_ore', .4, 1, 2]], pendulumknight: [['hour_ore', .8, 2, 4], ['mainspring_coil', .35, 1, 1], ['ancient_gear', .6, 1, 2]], rewinder: [['hour_sand', .9, 1, 3], ['ancient_gear', .4, 1, 1]],
  stormkite: [['skyfeather', .7, 1, 2], ['charged_shard', .5, 1, 2]], voltgolem: [['storm_ore', .8, 2, 4], ['charged_shard', .8, 2, 3], ['storm_glass', .2, 1, 1]], galeharpy: [['skyfeather', .9, 1, 3], ['cloud_tuft', .5, 1, 2]], sparkling: [['charged_shard', .4, 1, 1]],
  shade: [['hollow_ash', .8, 1, 3], ['shade_cloth', .4, 1, 1]], hollowhound: [['hollow_ash', .7, 1, 2], ['last_ember', .3, 1, 1], ['hide', .5, 1, 2]], ashcolossus: [['dawn_ore', .9, 3, 5], ['voidrock', .8, 3, 6], ['last_ember', .6, 1, 2]], emberwraith: [['last_ember', .8, 1, 2], ['cinder', .6, 2, 4]],
  skyhawk: [['skyfeather', .9, 1, 2], ['meat', .5, 1, 1]], stormcrow: [['skyfeather', .9, 1, 3], ['storm_glass', .12, 1, 1]]
});
// ---------------- where they live ----------------
Object.assign(DSPAWN, {
  4: { tundra: [['frostwolf', 4], ['rimewisp', 2], ['icegolem', 1]], pines: [['frostwolf', 3], ['snowstalker', 2], ['rimewisp', 2]], glacier: [['icegolem', 3], ['rimewisp', 3], ['snowstalker', 1]], under: [['rimewisp', 2], ['icegolem', 2], ['crawler', 1]], deep: [['icegolem', 3], ['snowstalker', 2], ['rimewisp', 1]] },
  5: { gearplains: [['clockmite', 5], ['brasssentry', 2], ['rewinder', 1]], pendulums: [['pendulumknight', 3], ['clockmite', 3], ['brasssentry', 1]], hourglass: [['rewinder', 3], ['clockmite', 3], ['brasssentry', 2]], under: [['clockmite', 4], ['rewinder', 2], ['pendulumknight', 1]], deep: [['pendulumknight', 3], ['brasssentry', 2], ['rewinder', 2]] },
  6: { cloudbank: [['stormkite', 3], ['galeharpy', 3], ['sparkling', 2]], anvilhead: [['voltgolem', 3], ['stormkite', 2], ['sparkling', 2]], eye: [['galeharpy', 2], ['sparkling', 3], ['stormkite', 1]], under: [['voltgolem', 2], ['sparkling', 3]], deep: [['voltgolem', 3], ['sparkling', 2]] },
  7: { ashen: [['hollowhound', 3], ['emberwraith', 2], ['ashcolossus', 1]], shards: [['emberwraith', 3], ['hollowhound', 2], ['shade', 1]], cinders: [['ashcolossus', 2], ['emberwraith', 3], ['hollowhound', 2]], under: [['shade', 2], ['hollowhound', 2], ['emberwraith', 1]], deep: [['ashcolossus', 2], ['shade', 2], ['hollowhound', 2]] }
});
Object.assign(DEVMOBS, { whiteout: [['snowstalker', 3], ['frostwolf', 4]], stoppedhour: [['rewinder', 4], ['clockmite', 4]], tempest: [['stormkite', 4], ['sparkling', 4]], longdark: [['shade', 5], ['hollowhound', 2]] });
Object.assign(DEVENTS, { whiteout: { name: 'WHITEOUT', sub: 'the cold comes twice as fast. find a fire' }, stoppedhour: { name: 'THE STOPPED HOUR', sub: 'the great chime rings and rings' }, tempest: { name: 'TEMPEST', sub: 'the lightning is hunting. keep low' }, longdark: { name: 'THE LONG DARK', sub: 'keep your light close' } });
BIOME_MOBS.reach.push(['skyhawk', 2]); BIOME_MOBS.thorn.push(['skyhawk', 1]);
// packs: wolves and hounds come in twos and threes, sparklings in swarms
const PACKS = { frostwolf: [2, 3], hollowhound: [2, 3], sparkling: [3, 4] };
// ---------------- the thunderstorm over the Waking Lands ----------------
Object.assign(EVENTS, {
  thunder: { name: 'THUNDERSTORM', sub: 'lightning looks for high ground. and for rods', when: 'any', need: F => !!(F.seen3 || F.matriarchDead), chance: .22, mobs: [['stormcrow', 3]], cap: 3, dur: 7000, end: 'The storm rolls on, over the edge of the world.' }
});
EVMOB.add('stormcrow');
function thunderTick(e) {
  const p = G.p; if (!p || p.dead || G.time % 3) return;
  if (G.time % 2 === 0) for (let k = 0; k < 3; k++) P(G.cam.x + frand(-40, VS.vw + 40), G.cam.y - 4, -.6, frand(3, 3.8), 80, '#8a9ad0', { g: 0, fr: 1, sky: 1 });
  if (G.thunT === undefined) G.thunT = 200; if ((G.thunT -= 3) > 0) return; G.thunT = 180 + frand(260);
  // a rod you raised within reach draws it; otherwise the highest ground near you
  const ptx = floor((p.x + 3) / T); let rod = null; for (const o of tileObjs.values()) if (o.id === LROD && abs(o.x - ptx) < 90 && (!rod || abs(o.x - ptx) < abs(rod.x - ptx))) rod = o;
  if (rod && Math.random() < .8) { strikeAt(rod.x * T + 4, rod.y * T, false, { rod: 1, warn: 30 }); return; }
  let best = ptx + randi(-30, 30); for (let k = 0; k < 6; k++) { const x = ptx + randi(-40, 40); if (heights[x] < heights[best]) best = x; }
  best = wxBoltTree(best, ptx);
  strikeAt(best * T + 4, groundAt(best) * T, realmAt(ptx, floor((p.y + 10) / T)) === 'surface' && !gearHas('stormborn'), { dmg: 22 });
}
// ---------------- drawing the new missiles ----------------
const REALMP = {
  icespike(w, pr, x, y) { const u = min(1, pr.t / 6) * min(1, pr.life / 8); w.fillStyle = '#8fd0d8'; w.beginPath(); w.moveTo(round(x) - 4, round(y) + 6); w.lineTo(round(x), round(y) + 6 - 14 * u); w.lineTo(round(x) + 4, round(y) + 6); w.fill(); w.fillStyle = '#ffffff'; w.fillRect(round(x) - 1, round(y) + 6 - 12 * u, 1, 10 * u); },
  gear(w, pr, x, y) { w.save(); w.translate(round(x), round(y)); w.rotate(pr.t * .3 * (sign(pr.vx) || 1)); w.fillStyle = '#c9a44a'; w.beginPath(); w.arc(0, 0, pr.r - 1, 0, TAU); w.fill(); w.fillStyle = '#ffd35a'; for (let k = 0; k < 8; k++) { w.rotate(PI / 4); w.fillRect(-1, -pr.r - 1, 2, 3); } w.fillStyle = '#3a2a14'; w.fillRect(-1, -1, 2, 2); w.restore(); }
};
