// ============================================================
//  What the weather brings out. Rare: one or two at a time, and gone
//  when the sky changes.
//    puddling     rain            sinks into a puddle, slides under you, bursts up
//    stormcaller  a thunderstorm  a drifting bell of cloud; mark, then lightning
//    galewisp     a thunderstorm  a walking whirl that flings you off your feet
//    mistwraith   the long fog    barely there until it is beside you; blinds
//    rimefang     snow            circles, pounces, leaves you stiff with cold
//    dustmaw      ashfall         swims the ground and leaps
// ============================================================
const WXMOBS = { rain: ['puddling'], storm: ['puddling', 'stormcaller', 'stormcaller', 'galewisp'], fog: ['mistwraith'], snow: ['rimefang'], ash: ['dustmaw'] };
const WXMOB = new Set(['puddling', 'stormcaller', 'galewisp', 'mistwraith', 'rimefang', 'dustmaw']);
Object.assign(DROPS, {
  puddling: [['clay', .7, 1, 2], ['glowcap', .5, 1, 1], ['lurker_oil', .3, 1, 1]], stormcaller: [['skysilk', 1, 1, 3], ['shard', .6, 1, 2], ['membrane', .6, 1, 1]], galewisp: [['skysilk', 1, 1, 2], ['fiber', .8, 2, 4]],
  mistwraith: [['husk_fiber', 1, 1, 3], ['bone', .6, 1, 2], ['shard', .3, 1, 1]], rimefang: [['hide', 1, 1, 2], ['meat', 1, 1, 2], ['bone', .7, 1, 2], ['tusk', .3, 1, 1]], dustmaw: [['scale', .8, 1, 2], ['bone', .8, 1, 3], ['venom', .3, 1, 1]]
});
function buildWeatherMobs() {
  const S = (k, rows, pal) => { MOBSPR[k] = spr(rows, pal); };
  const pd = { a: '#c9ecff', b: '#6fb4e0', c: '#3f7fb4', e: '#12233f', w: '#ffffff' };
  S('pud0', ['....aa....', '..aawwaa..', '.abbbbbba.', '.bbebbebb.', 'bbbebbebbc', 'bbbbbbbbbc', '.cbbbbbbc.', '..cccccc..'], pd); S('pud1', ['..........', '...aaaa...', '..abbwba..', '.bebbbeb..', '.bebbbebb.', 'bbbbbbbbbc', 'cbbbbbbbbc', '.cccccccc.'], pd);
  const st = { a: '#e8ecf8', b: '#a8aec8', c: '#6a7090', d: '#454a66', e: '#fff1a8', y: '#ffd35a' };
  S('storm0', ['....aaaaaaa....', '..aabbbbbbbaa..', '.abbbbbbbbbbba.', 'abbbebbbbebbbbc', 'bbbbebbbbebbbbc', 'cbbbbbbbbbbbbcc', '.cccbbccbbcccc.', '..d.cd..dc.d...', '..d..d..d..d...', '.....d.....d...'], st); S('storm1', ['....aaaaaaa....', '..aabbbbbbbaa..', '.abbbbbbbbbbba.', 'abbbybbbbybbbbc', 'bbbbybbbbybbbbc', 'cbbbbbbbbbbbbcc', '.ccccbbccbbccc.', '...d.cd.cd.d...', '..d...d..d..d..', '..d..........d.'], st);
  const gw = { a: '#f4fbff', b: '#c4dcea', c: '#8fb4cc', e: '#24405a' };
  S('gale0', ['..aaaaaaa..', '.abbbbbbbc.', '...aabbcc..', '..abebebc..', '...abbbcc..', '....abbc...', '...abbbc...', '....abc....', '.....bc....', '....ab.....', '.....c.....'], gw); S('gale1', ['.aaaaaaaa..', '..abbbbbbc.', '..aabbbcc..', '..abebebcc.', '....abbbc..', '...abbbc...', '....abbc...', '...abbc....', '....ab.....', '.....bc....', '....c......'], gw);
  const mw = { a: '#f0f2fa', b: '#c2c8dc', c: '#8a92b0', e: '#1c2238', d: '#5f6788' };
  S('mist0', ['...aaaa...', '..abbbba..', '.abbbbbba.', '.beebbeeb.', '.beebbeeb.', '.bbbbbbbc.', '.cbbddbbc.', '..bbbbbbc.', '.abbbbbbcc', 'abbbbbbbbc', 'a.bbbbbbc.', '..bbbbbbc.', '..cbbbbbc.', '...bbbbc..', '...cbbc...', '....bc....', '....c.....'], mw);
  const rf = { a: '#ffffff', b: '#d4e8f0', c: '#9cc4d4', d: '#5a8aa0', e: '#2fd0ff', k: '#24405a' };
  S('rime0', ['.............aa.', '..a..a..a...bbbb', '.abababab..bbebb', 'abbbbbbbbbbbbbbk', 'bbbbbbbbbbbbbbb.', 'cbbbbbbbbbbbcc..', '.ccbbbbbbbcc....', '.cc.cc..cc.cc...', '.d...d..d...d...'], rf); S('rime1', ['.............aa.', '..a..a..a...bbbb', '.abababab..bbebb', 'abbbbbbbbbbbbbbk', 'bbbbbbbbbbbbbbb.', 'cbbbbbbbbbbbcc..', '.ccbbbbbbbcc....', '..cc..cccc..cc..', '.d....d..d....d.'], rf);
  const dm = { a: '#f0d8a0', b: '#c99a5a', c: '#8a6238', d: '#5a3e24', e: '#ff6a4a', w: '#f4ead8' };
  S('maw0', ['....aaaaaa......', '..aabbbbbbaa....', '.abbbbbbbbbbba..', 'abbbbbbbbebbbbba', 'bbbcbbcbbbbbwwww', 'cbbbbbbbbbdddd..', '.ccbbbbbbbbwwww.', '...ccccccccc....'], dm);
  S('mawfin', ['...a....', '..aba...', '.abbba..', 'abbbbcc.'], dm);
}
// ---- puddling ----
mob('puddling', { w: 10, h: 8, hp: 34, dmg: 9, contact: false, name: 'Puddling', glow: [.08, .16, .24] }, (e, p, dx, dy, dist) => {
  grav(e, .22);
  if (e.state === 'idle') {
    e.noHit = false; if (e.onGround) { e.vx *= .7; if (e.t > e.wait) { e.dir = sign(dx) || 1; e.vy = -(2 + frand(1)); e.vx = e.dir * (dist < 240 ? 1.3 : .5); e.t = 0; e.wait = 26 + frand(30); e.sq = -1; e.hops = (e.hops | 0) + 1; } }
    if (!p.dead && overlap(e, p) && (e.hitT | 0) < G.time) { e.hitT = G.time + 50; if (touch(e, p)) { applyStatus(p, 'mire', null, { d: 90 }); splashAt(e.x + 5, e.y + 8, 8); } }
    if ((e.hops | 0) > 3 && e.onGround && dist < 220 && !p.dead) { e.state = 'sink'; e.t = 0; e.hops = 0; sfx('stir', 60); }
  } else if (e.state === 'sink') { e.vx *= .6; e.noHit = e.t > 14; if (e.t > 20) { e.state = 'slide'; e.t = 0; } }
  else if (e.state === 'slide') { e.noHit = true; e.dir = sign(dx) || e.dir; e.vx = approach(e.vx, e.dir * 2.1, .2); if (e.t % 4 === 0) P(e.x + 5, e.y + e.h - 1, frand(-.4, .4), -.3, 16, '#8fd0ff', { g: .05 }); if ((abs(dx) < 7 && abs(dy) < 30) || e.t > 110 || e.hitWall) { e.state = 'rise'; e.t = 0; e.vx = 0; sfx('tele', 40); } }
  else if (e.state === 'rise') { e.vx = 0; e.noHit = e.t < 16; if (e.t % 2 === 0) P(e.x + frand(10), e.y + e.h, frand(-.3, .3), -1, 12, '#c9ecff', { g: .08 }); if (e.t === 20) { e.vy = -3.4; splashAt(e.x + 5, e.y + 8, 16); sfx('land', 0); if (!p.dead && overlap(e, p, 5)) { hitP(e, e.dmg + 3, { kx: e.dir * 1.2, ky: -4.4 }); applyStatus(p, 'mire', null, { d: 120 }); } } if (e.t > 40 && e.onGround) { e.state = 'idle'; e.t = 0; } }
  e.sq *= .86; moveBody(e);
}, (e, x, y, o) => {
  const flat = e.state === 'slide' || (e.state === 'sink' && e.t > 8) || (e.state === 'rise' && e.t < 14);
  if (flat) { drawEnt(32, 16, 24, c => { c.fillStyle = '#3f7fb4'; c.fillRect(-9, -2, 18, 2); c.fillStyle = '#c9ecff'; c.fillRect(-6 + (G.time >> 3) % 4, -2, 4, 1); }, x + e.w / 2, y + e.h, { ly: -2 }); return; }
  drawEnt(32, 16, 24, c => { c.scale(1 + (e.sq || 0) * .25, 1 - (e.sq || 0) * .25); c.drawImage(MOBSPR[e.onGround ? 'pud1' : 'pud0'], -5, -8); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -4 });
});
function splashAt(x, y, n) { for (let k = 0; k < n; k++) P(x + frand(-4, 4), y, frand(-1.6, 1.6), frand(-2.6, -.6), 24, fpick(['#c9ecff', '#8fd0ff', '#6fb4e0']), { g: .15 }); }
// ---- stormcaller ----
mob('stormcaller', { w: 15, h: 9, hp: 64, dmg: 15, fly: true, contact: false, name: 'Stormcaller', glow: [.3, .32, .42] }, (e, p, dx, dy, dist) => {
  if (e.a === undefined) e.a = frand(TAU); e.a += .02;
  if (e.state === 'idle' || e.state === 'chase') { const near1 = dist < 320 && !p.dead; flyTo(e, (near1 ? p.x + 3 : e.x) + cos(e.a) * 40, (near1 ? p.y : e.y) - 66 + sin(e.a * 1.7) * 8, .05, 1.5); if (near1 && e.t > 110 && abs(dx) < 70) { e.state = 'mark'; e.t = 0; e.mx = p.x + 3; sfx('tele'); } }
  else if (e.state === 'mark') {
    e.vx *= .85; e.vy *= .85; if (e.t < 24) e.mx = lerp(e.mx, p.x + 3, .12); if (e.t % 3 === 0) { let gy = floor((e.y + e.h) / T); while (gy < WH - 1 && gy < e.y / T + 40 && !solidAt(floor(e.mx / T), gy)) gy++; e.gy = gy * T; P(e.mx + frand(-4, 4), e.gy - 1, 0, frand(-1.4, -.5), 14, '#fff1a8', { glow: 1, g: 0 }); }
    if (e.t >= 46) { const gy = e.gy || e.y + 120; G.trails.push({ kind: 'beam', x: e.x + e.w / 2, y: e.y + e.h, x2: e.mx, y2: gy, w: 3, life: 9, max: 9, col: '#8fd0ff' }, { kind: 'ring', x: e.mx, y: gy, r: 16, life: 9, max: 9 }); burst(e.mx, gy - 3, 16, ['#ffffff', '#c9e8ff', '#fff1a8'], 2.6, 24, { glow: 1 }); if (near(e)) { sfx('thunder', 200); addShake(3); } if (!p.dead && abs(p.x + 3 - e.mx) < 11 && p.y + p.h > e.y && p.y < gy + 4) hitP(e, e.dmg, { kx: (sign(p.x + 3 - e.mx) || 1) * 2, ky: -3 }); e.state = 'rest'; e.t = 0; }
  } else { e.vy = approach(e.vy, .3, .02); e.vx *= .96; e.vuln = 1.4; if (e.t > 70) { e.state = 'idle'; e.t = frand(30); e.vuln = 1; } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { const hot = e.state === 'mark' && (e.t >> 2) & 1; c.drawImage(MOBSPR[hot || (G.time >> 4) & 1 ? 'storm1' : 'storm0'], -7, -5 + round(sin(G.time * .07 + (e.seed || 0)) * 1)); }, x + e.w / 2, y + e.h / 2, { flash: o.flash || (e.state === 'mark' && e.t > 34 && (e.t >> 1) & 1), unlit: e.state === 'mark' }));
// ---- galewisp ----
mob('galewisp', { w: 9, h: 11, hp: 40, dmg: 8, contact: false, kbRes: .4, name: 'Galewisp', canStep: true }, (e, p, dx, dy, dist) => {
  grav(e, .16, 3); const chase = dist < 260 && !p.dead; e.dir = chase ? sign(dx) || 1 : e.dir || 1; e.vx = approach(e.vx, e.dir * (chase ? 1.9 : 1), .07); e.ph += .4;
  if (e.hitWall && e.onGround) { e.vy = -3.6; if (!chase && Math.random() < .3) e.dir *= -1; } if (e.t % 3 === 0) P(e.x + e.w / 2 + cos(e.t * .5) * 8, e.y + frand(e.h), sin(e.t * .5) * -1, -.6, 16, fpick(['#f4fbff', '#c4dcea', '#8d8794']), { g: -.01, fr: .95 });
  for (const d of G.drops) { const ex = e.x + 4 - d.x, ey = e.y - d.y; if (abs(ex) < 34 && abs(ey) < 30 && d.delay <= 0) { d.vx += sign(ex) * .12; d.vy -= .16; d.rest = 0; } }
  if (!p.dead && overlap(e, p, 2) && (e.hitT | 0) < G.time) { e.hitT = G.time + 55; if (hitP(e, e.dmg, { kx: e.dir * 2.8, ky: -5.4 })) { p.onGround = false; sfx('spin', 0); } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 24, c => { c.scale((e.ph | 0) & 1 ? -1 : 1, 1); c.drawImage(MOBSPR[(e.ph | 0) & 2 ? 'gale1' : 'gale0'], -5, -11); }, x + e.w / 2 + sin(G.time * .4) * 1, y + e.h, { flash: o.flash, alpha: .88, ly: -5 }));
// ---- mistwraith ----
mob('mistwraith', { w: 8, h: 16, hp: 44, dmg: 12, fly: true, contact: false, name: 'Mistwraith' }, (e, p, dx, dy, dist) => {
  if (e.fade === undefined) e.fade = .08; if (e.ox === undefined) e.ox = Math.random() < .5 ? -1 : 1;
  if (e.state === 'idle' || e.state === 'chase') { e.fade = approach(e.fade, dist < 70 ? .5 : .07, .02); if (dist < 300 && !p.dead) flyTo(e, p.x + 3 + e.ox * (e.t > 160 ? 22 : 64), p.y + 6 + sin(e.t * .05) * 6, .05, 1.35); else { e.vx *= .95; e.vy *= .95; } if (dist < 36 && e.t > 70) { e.state = 'reach'; e.t = 0; sfx('tele'); } }
  else if (e.state === 'reach') { e.fade = approach(e.fade, .95, .06); e.vx *= .85; e.vy *= .85; if (e.t === 20) { const d = hypot(dx, dy) || 1; e.vx = dx / d * 4.8; e.vy = dy / d * 4.2; e.hitP = false; sfx('swing', 0); } if (e.t > 20 && !e.hitP && !p.dead && overlap(e, p, 1)) { e.hitP = true; if (hitP(e, e.dmg)) applyStatus(p, 'blind', null, { d: 70 }); } if (e.t > 40) { e.state = 'idle'; e.t = 0; e.ox *= -1; } }
  if (G.time % 5 === 0) P(e.x + frand(e.w), e.y + e.h, frand(-.2, .2), .2, 26, '#c2c8dc', { g: 0, fr: .97 });
  e.x += e.vx; e.y += e.vy;
}, (e, x, y, o) => { if (abs(e.vx || 0) > .1) e.dir = sign(e.vx); drawEnt(32, 16, 24, c => { c.scale(e.dir || 1, 1); c.drawImage(MOBSPR.mist0, -5, -17 + round(sin(G.time * .06 + (e.seed || 0)))); }, x + e.w / 2, y + e.h, { flash: o.flash, alpha: e.fade === undefined ? .5 : e.flash > 0 ? .95 : e.fade, ly: -8 }); });
// ---- rimefang ----
mob('rimefang', { w: 14, h: 8, hp: 56, dmg: 12, contact: false, kbRes: .25, name: 'Rimefang', canStep: true }, (e, p, dx, dy, dist) => {
  grav(e); if (e.side === undefined) e.side = Math.random() < .5 ? -1 : 1;
  if (e.state === 'idle') { if (dist < 270 && !p.dead) { const want = p.x + 3 + e.side * 58, d = want - (e.x + 7); e.vx = approach(e.vx, clamp(d * .06, -2.3, 2.3), .14); e.dir = abs(e.vx) > .4 ? sign(e.vx) : sign(dx) || e.dir; if (e.hitWall && e.onGround) e.vy = -3.9; if (e.t > 90 && e.onGround && abs(dx) < 90 && dy > -46 && dy < 96) { e.state = 'crouch'; e.t = 0; e.dir = sign(dx) || 1; sfx('tele'); } } else { e.vx = approach(e.vx, e.dir * .5, .05); if (e.hitWall || Math.random() < .004) e.dir *= -1; } e.ph += abs(e.vx) * .16; }
  else if (e.state === 'crouch') { e.vx *= .7; if (e.t > 22) { const n = clamp(abs(dx) / 3.4, 12, 26); e.state = 'pounce'; e.t = 0; e.dir = sign(dx) || e.dir; e.vx = dx / n; e.vy = clamp(dy / n - .125 * (n + 1), -5, -1.4); e.hitP = false; sfx('jump'); } }
  else if (e.state === 'pounce') { if (!e.hitP && !p.dead && overlap(e, p, 1)) { e.hitP = true; if (hitP(e, e.dmg)) { applyStatus(p, 'mire', null, { d: 110 }); burst(p.x + 3, p.y + 10, 10, FROST, 1.6, 26); } } if (e.onGround && e.t > 4) { e.state = 'idle'; e.t = 0; e.side *= -1; dust(e.x + 7, e.y + e.h, 4, '#ffffff'); } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 24, c => { c.scale(e.dir, 1); if (e.state === 'pounce') c.rotate(-.22); if (e.state === 'crouch') c.translate(0, 1); c.drawImage(MOBSPR[(e.ph | 0) % 2 ? 'rime1' : 'rime0'], -8, -9); }, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'crouch' && (e.t >> 2) & 1), ly: -4 }));
// ---- dustmaw ----
mob('dustmaw', { w: 14, h: 8, hp: 52, dmg: 13, contact: false, kbRes: .4, name: 'Dustmaw', canStep: true }, (e, p, dx, dy, dist) => {
  if (e.state === 'idle') { e.state = 'swim'; e.t = 0; }
  if (e.state === 'swim') { grav(e); e.noHit = true; const chase = dist < 280 && !p.dead; e.dir = chase ? sign(dx) || e.dir : e.dir; e.vx = approach(e.vx, e.dir * (chase ? 2 : .7), .1); if (e.hitWall) { e.vy = -3.4; if (!chase) e.dir *= -1; } if (e.t % 3 === 0 && e.onGround) dust(e.x + 7, e.y + e.h, 2, '#e8be84'); if (chase && e.t > 60 && abs(dx) < 30 && e.onGround) { e.state = 'shake'; e.t = 0; sfx('tele'); } }
  else if (e.state === 'shake') { grav(e); e.noHit = true; e.vx *= .7; if (e.t % 2 === 0) dust(e.x + frand(14), e.y + e.h, 2, '#f0d8a0', 1.4); if (e.t > 24) { e.state = 'leap'; e.t = 0; e.noHit = false; e.dir = sign(dx) || 1; e.vx = e.dir * clamp(abs(dx) / 16, .8, 2.6); e.vy = -4.8; e.hitP = false; burst(e.x + 7, e.y + 8, 16, ['#f0d8a0', '#c99a5a', '#8a6238'], 2.4, 30, { g: .1 }); sfx('brk', 0); } }
  else if (e.state === 'leap') { grav(e, .2); if (!e.hitP && !p.dead && overlap(e, p, 2)) { e.hitP = true; hitP(e, e.dmg, { kx: e.dir * 2, ky: -3.6 }); } if (e.onGround && e.t > 6) { e.state = 'flop'; e.t = 0; } }
  else if (e.state === 'flop') { grav(e); e.vx *= .85; e.vuln = 1.35; if (e.t > 46) { e.state = 'swim'; e.t = 0; e.vuln = 1; dust(e.x + 7, e.y + e.h, 8, '#e8be84', 1.4); } }
  moveBody(e);
}, (e, x, y, o) => {
  if (e.state === 'swim' || e.state === 'shake') { drawEnt(24, 12, 16, c => { c.scale(e.dir, 1); c.drawImage(MOBSPR.mawfin, -4, -4 + (e.state === 'shake' ? (G.time & 1) : 0)); }, x + e.w / 2, y + e.h + 1, { ly: -3 }); return; }
  drawEnt(32, 16, 24, c => { c.scale(e.dir, 1); if (e.state === 'leap') c.rotate(e.vy < 0 ? -.5 : .4); c.drawImage(MOBSPR.maw0, -8, -8); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -4 });
});
// ---------------- when they come, and when they go ----------------
const WXHOME = { puddling: () => wxRain() > .2, stormcaller: () => wxThunder() > .2, galewisp: () => wxThunder() > .2, mistwraith: () => wxFog() > .25, rimefang: () => wxSnow() > .2, dustmaw: () => wxAsh() > .2 };
// the kind of weather that is fully down, if any
const wxForm = () => wxThunder() > .5 ? 'storm' : wxSnow() > .5 ? 'snow' : wxAsh() > .55 ? 'ash' : wxRain() > .5 ? 'rain' : wxFog() > .6 ? 'fog' : '';
// once their weather has passed they slip away: at once if nobody is looking, or when they have been left alone a while
function wxMobLeave() {
  for (const e of G.enemies) {
    if (e.dead || !WXMOB.has(e.type)) continue; if (WXHOME[e.type]() || e.flash > 0) { e.stray = 0; continue; }
    const seen = e.x > G.cam.x - 30 && e.x < G.cam.x + VS.vw + 30 && e.y > G.cam.y - 30 && e.y < G.cam.y + VS.vh + 30; e.stray = (e.stray | 0) + 1; if (e.stray < (seen ? 10 : 3)) continue;
    e.dead = true; if (seen) { burst(e.x + e.w / 2, e.y + e.h / 2, 18, ['#f4fbff', '#c2c8dc', '#8a92b0'], 1.2, 40, { g: -.02, fr: .95 }); sfx('tele', 60); }
  }
}
function wxMob(form) {
  const p = G.p, ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T); if (!inW(ptx, pty) || WORLD.mode === 1 || G.boss || G.duel || G.cine || G.time < 900 || G.dialog) return;
  if (realmAt(ptx, pty) !== 'surface' || placeAt(ptx, pty) === 'village' || abs(ptx - SPAWN_X) < VIL_W + 14) return;
  let n = 0; for (const e of G.enemies) if (!e.dead && WXMOB.has(e.type)) n++; if (n >= (form === 'storm' ? 2 : 1 + (Math.random() < .3 ? 1 : 0))) return;
  const type = fpick(WXMOBS[form]), fly = MOBX[type] && MOBX[type].stats.fly;
  for (let k = 0; k < 16; k++) {
    const tx = ptx + (Math.random() < .5 ? -1 : 1) * floor(frand(ceil(VS.vw / T / 2) + 2, ceil(VS.vw / T / 2) + 18)); if (tx < 6 || tx > WW - 7) continue;
    let y = max(2, pty - 30); while (y < min(WH - 2, pty + 30) && !solidAt(tx, y)) y++; if (y >= min(WH - 2, pty + 30) || liqAt(tx * T + 4, (y - 1) * T + 4) || wxCovered(tx * T + 4, (y - 1) * T)) continue;
    const e = spawnMob(type, tx, y); if (fly) e.y = e.py = (y - 9) * T; return;
  }
}
