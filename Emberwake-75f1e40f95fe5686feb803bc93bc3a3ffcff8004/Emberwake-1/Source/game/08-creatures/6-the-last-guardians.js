// ============================================================
//  The last guardians, and what waits outside.
//    THE WINTER STAG   (the Long Winter)  charges, ice spikes that run along
//                      the ground, frost breath, a leap; calls its wolves
//    THE HOROLOGIST    (the Hourworks)    rolling gears, a pendulum across the
//                      floor, two clock hands that sweep like beams; it stops
//                      time to land a blow, and twice it turns the hour back:
//                      it, and you, go back to where you were
//    THE STORMWRIGHT   (the Thunderhead)  lightning that hunts you, a gale
//                      toward the edge, a hammer dive, chain lightning
//    THE HOLLOW        (the Outside)      wears the shapes of every guardian you
//                      beat, then the dark, then the last cold. Called at the
//                      Cold Hearth with the Dawnring, which is forged from a
//                      fragment of the ring that each guardian kept.
//  Every guardian is harder now: more health, harder blows while you fight
//  one, and below a third of its health it rages (everything it does comes
//  faster).
// ============================================================
// ---------------- the ring's fragments ----------------
const FRAG_OF = { boss: 'frag_ash', vesper: 'frag_glass', keeper: 'frag_forge', slagtyrant: 'frag_cinder', rootmother: 'frag_root', matriarch: 'frag_prism', shepherd: 'frag_moon', winterstag: 'frag_rime', horologist: 'frag_hour', stormwright: 'frag_storm' };
const SIGIL_FRAG = { warden_sigil: 'frag_ash', glass_sigil: 'frag_glass', keeper_sigil: 'frag_forge' };
const FRAGS = ['frag_ash', 'frag_glass', 'frag_forge', 'frag_cinder', 'frag_root', 'frag_prism', 'frag_moon', 'frag_rime', 'frag_hour', 'frag_storm'];
function fragDrop(id, first, x, y) { if (id && (first || Math.random() < .4)) spawnDrop(id, 1, x, y - 8, frand(-.6, .6), -3.2); }
Object.assign(BOSSES, {
  winterstag: { flag: 'stagDead', down: 'THE WINTER STAG FALLS', sub: 'its antlers ring like bells as they break', loot: [['stag_antler', 2, 2], ['rime_ore', 14, 20], ['rime_bar', 2, 4], ['frost_heart', 1, 2], ['frost_pelt', 2, 4]], first: [['stag_crown', 1, 1]], cols: ['#ffffff', '#c9fff6', '#8fd0d8', '#62a9bc'], flash: '220,250,255', journal: 'winterstag', leads: ['g_clock', 'hourkey'] },
  horologist: { flag: 'horologistDead', down: 'THE HOROLOGIST STOPS', sub: 'for the first time in a thousand years, nothing here is ticking', loot: [['mainspring', 2, 2], ['hour_ore', 14, 20], ['hour_bar', 2, 4], ['hour_sand', 3, 5], ['ancient_gear', 3, 5]], first: [['hour_charm', 1, 1]], cols: ['#ffd35a', '#fff1a8', '#c9a44a', '#7a5218'], flash: '255,230,160', journal: 'horologist', leads: ['g_storm', 'stormkey'] },
  stormwright: { flag: 'stormwrightDead', down: 'THE STORMWRIGHT IS SPENT', sub: 'the thunder goes on without it, quieter', loot: [['thunder_heart', 2, 2], ['storm_ore', 14, 20], ['storm_bar', 2, 4], ['storm_glass', 2, 4], ['charged_shard', 4, 6]], first: [['storm_sigil', 1, 1]], cols: ['#ffffff', '#e8f0ff', '#9ab0ff', '#3a4268'], flash: '220,230,255', journal: 'stormwright', leads: ['dawnring', 'g_ring'] },
  hollowking: { flag: 'hollowDead', down: 'THE HOLLOW GOES OUT', sub: 'and the cold has nothing left to hold it', loot: [['dawn_heart', 1, 1], ['dawn_ore', 10, 16], ['dawn_bar', 3, 5], ['last_ember', 4, 6]], cols: ['#fff1a8', '#ff9a3d', '#ffffff', '#3a3450'], flash: '255,240,200', journal: 'hollowking', leads: [] }
});
Object.assign(DIM_OFFER, { winterstag: 'rime_offering', horologist: 'hour_offering', stormwright: 'storm_offering', hollowking: 'ember_offering' });
Object.assign(OFFER, {
  rime_offering: { boss: 'the Winter Stag', where: 'the altar in the Long Winter' },
  hour_offering: { boss: 'the Horologist', where: 'the altar in the Hourworks' },
  storm_offering: { boss: 'the Stormwright', where: 'the altar in the Thunderhead' },
  ember_offering: { boss: 'the Hollow', where: 'the Cold Hearth, with the Dawnring' }
});
// each wants something from every corner: its own world, the surface, a world before, and what the last guardian left
R('altar', 'rime_offering', 1, { rime_bar: 3, glacier_ice: 6, sunbloom: 4, slag_heart: 2, moth_wax: 2 });
R('altar', 'hour_offering', 1, { hour_bar: 3, ancient_gear: 4, moonpetal: 4, prism_dust: 4, stag_antler: 1 });
R('altar', 'storm_offering', 1, { storm_bar: 3, storm_glass: 3, skyfeather: 4, spore_dust: 4, mainspring: 1 });
R('altar', 'ember_offering', 1, { dawn_bar: 4, last_ember: 4, sunstone: 4, cinderite_ore: 6, thunder_heart: 1 });
function realmOfferings() {
  const off = (id, name, pal) => { const O = OFFER[id], r = RECIPES.find(q => q.out === id); defI(id, { name, type: 'offering', stack: 5, icon: outlined(spr(['...e...', '..efe..', '...e...', 'a.....a', 'abbbbba', '.abbba.', '..ccc..'], pal)), desc: `Wakes ${O.boss}: bring it to ${O.where} and press [F]. Made at an Offering Altar${r ? ' from ' + Object.keys(r.need).map(k => r.need[k] + ' ' + (IT[k] ? IT[k].name.toLowerCase() : k)).join(', ') : ''}.` }); };
  off('rime_offering', 'Rime Offering', { a: '#3a5a6a', b: '#8fd0d8', c: '#2a4a5a', e: '#c9fff6', f: '#ffffff' });
  off('hour_offering', 'Hour Offering', { a: '#7a5218', b: '#c9a44a', c: '#3a2a14', e: '#ffd35a', f: '#fff1a8' });
  off('storm_offering', 'Storm Offering', { a: '#3a4268', b: '#6a7aa8', c: '#1e2236', e: '#9ab0ff', f: '#ffffff' });
  off('ember_offering', 'Ember Offering', { a: '#3a3450', b: '#c94a2a', c: '#1a1626', e: '#ff9a3d', f: '#fff1a8' });
}
// ---------------- every guardian is harder ----------------
const BOSS_HP = 1.3;
function bossRage(b, p, dx, dy, dist) {
  if (b.state === 'dying' || b.state === 'intro' || b.dead) return;
  if (!b.rage && b.hp < b.maxhp * .3) { b.rage = true; sfx('roar', 0); addShake(6); G.flash = .45; G.flashCol = '255,80,60'; G.banner = { text: (b.name || 'IT') + ' RAGES', sub: 'everything it does comes faster now', t: 0 }; }
  if (b.rage && G.time % 3 === 0) { b.t++; MOBX[b.type].ai(b, p, dx, dy, dist); }
}
// ---------------- the altars and the hearth ----------------
const REALM_SPAWN = {
  winterstag: (cx, gy, side) => bossSpawn('winterstag', cx + side * 80 - 15, gy - 30),
  horologist: (cx, gy) => bossSpawn('horologist', cx - 8, gy - 60),
  stormwright: (cx, gy) => bossSpawn('stormwright', cx - 9, gy - 110)
};
function hearthAct() {
  if (G.boss || DIM !== 7) return;
  if (G.flags.hollowDead && !hasItem('ember_offering')) { say('The hearth is warm now. It will burn for a long time. (An Ember Offering would call the Hollow back to fight again.)'); return; }
  if (!hasItem('dawnring') && WORLD.mode !== 1) { say('A hearth of grey stone, cold as anything you have touched. Something ring-shaped belongs here: the Dawnring, forged from what every guardian kept.'); learn('dawnring', true); sfx('deny'); return; }
  if (!payOffering('ember_offering')) return;
  const cx = DARENA_X * T + 4, gy = DARENA_Y * T; G.flags.woke_hollowking = true;
  const b = bossSpawn('hollowking', cx - 12, gy - 140); G.barT = 1; burst(cx, gy - 8, 40, ['#3a3450', '#1a1626', '#ff9a3d'], 3, 50, { glow: 1 });
  G.banner = { text: 'THE HOLLOW', sub: 'what is left when the heat goes out', t: 0 }; learn('hollowking', true);
}
// ================= THE WINTER STAG =================
mob('winterstag', { w: 30, h: 28, hp: 3400, dmg: 32, contact: false, noKb: true, boss: true, kbRes: 1, armor: .85, canStep: true, name: 'THE WINTER STAG', glow: [.3, .45, .55] }, (b, p, dx, dy, dist) => {
  const cx = DARENA_X * T + 4, R = (DIMP[4].arenaR - 3) * T, P2 = b.phase === 2, gy = DARENA_Y * T;
  grav(b, .3); if (b.hitCd > 0) b.hitCd--;
  if (b.state === 'dying') { b.vx *= .85; moveBody(b); bossDying(b); return; }
  if (bossLeash(b, cx, R + 34 * T, 'The Stag walks back into the snow. The cirque waits.')) return;
  if (b.state !== 'charge' && b.state !== 'stunned' && b.state !== 'leap') b.dir = sign(dx) || b.dir;
  const spikes = (x0, dir, n, gap, d0) => { for (let k = 0; k < n; k++) { const x = x0 + dir * (14 + k * gap); if (abs(x - cx) > R) break; G.dhaz.push({ kind: 'spike', x, y: gy, delay: d0 + k * 5, dmg: 22 }); } };
  switch (b.state) {
    case 'intro': b.invuln = true; b.vx = 0; if (b.t % 10 === 0) { addShake(2); burst(b.x + b.w / 2, b.y + b.h, 8, ['#ffffff', '#c9fff6'], 1.6, 24); } if (b.t > 150) { b.invuln = false; toIdle(b); } break;
    case 'idle': b.vx = approach(b.vx, b.dir * (P2 ? .95 : .65), .05); b.ph += abs(b.vx) * .2;
      if (b.t > (P2 ? 40 : 62)) { const r = Math.random(); b.t = 0; b.state = dist < 64 && r < .4 ? 'stompPrep' : r < .3 ? 'chargePrep' : r < .55 ? 'spikesPrep' : r < .78 ? 'breathPrep' : P2 ? 'leapPrep' : 'chargePrep'; sfx('tele'); } break;
    case 'stompPrep': b.vx *= .8; if (b.t > (P2 ? 20 : 28)) { b.state = 'stomp'; b.t = 0; addShake(7); sfx('boom', 0); if (abs(dx) < 40 && dy > -40) hitP(b, b.dmg, { kx: (sign(dx) || 1) * 4.5, ky: -3.5 }); spikes(b.x + b.w / 2, 1, 3, 12, 4); spikes(b.x + b.w / 2, -1, 3, 12, 4); } break;
    case 'stomp': b.vx = 0; if (b.t > 36) toIdle(b); break;
    case 'chargePrep': b.vx *= .7; if (b.t % 6 === 0) burst(b.x + b.w / 2 - b.dir * 14, b.y + b.h, 3, ['#ffffff', '#c8e0ea'], 1.2, 18); if (b.t > 32) { b.state = 'charge'; b.t = 0; b.dir = sign(dx) || 1; b.hitP = false; } break;
    case 'charge': b.vx = b.dir * (P2 ? 4 : 3.3); if (b.t % 3 === 0) burst(b.x + b.w / 2 - b.dir * 14, b.y + b.h, 2, ['#ffffff', '#c8e0ea'], 1, 16); if (!b.hitP && overlap(b, p) && !p.dead) { b.hitP = true; hitP(b, b.dmg + 6, { kx: b.dir * 5.5, ky: -3.5 }); }
      if (b.hitWall || abs(b.x + b.w / 2 + b.vx * 4 - cx) > R) { b.state = 'stunned'; b.t = 0; b.vx = -b.dir * 1.4; b.vy = -2; addShake(7); sfx('crack', 0); b.vuln = 1.6; b.armor = 1; burst(b.x + b.w / 2 + b.dir * 14, b.y + 8, 18, ['#ffffff', '#c9fff6', '#8fd0d8'], 2.6, 30); } else if (b.t > 110) toIdle(b); break;
    case 'stunned': b.vx *= .9; if (b.t % 12 === 0) P(b.x + b.w / 2, b.y - 6, frand(-.5, .5), -.4, 30, '#ffffff', { g: 0 }); if (b.t > (P2 ? 80 : 110)) { b.vuln = 1; b.armor = .85; toIdle(b); } break;
    case 'spikesPrep': b.vx *= .8; if (b.t > 22) { b.state = 'spikes'; b.t = 0; sfx('crack', 0); spikes(b.x + b.w / 2, sign(dx) || 1, 12, 11, 2); if (P2) spikes(cx + (sign(dx) || 1) * R, -(sign(dx) || 1), 10, 13, 20); } break;
    case 'spikes': b.vx = 0; if (b.t > 60) toIdle(b); break;
    case 'breathPrep': b.vx *= .8; if (b.t > 24) { b.state = 'breath'; b.t = 0; } break;
    case 'breath': b.vx = 0; if (b.t % 4 === 0 && b.t < (P2 ? 56 : 40)) { const a = atan2(p.y + 8 - b.y - 6, p.x + 3 - b.x - b.w / 2) + frand(-.3, .3); spawnProj({ type: 'orb', x: b.x + b.w / 2 + b.dir * 14, y: b.y + 6, vx: cos(a) * 2.6, vy: sin(a) * 2.6, r: 3, dmg: 14, life: 90, col: '#c9fff6', col2: '#ffffff', sz: 2, frost: true, light: [.2, .35, .45] }); sfx('shatter', 60); } if (b.t > 70) toIdle(b); break;
    case 'leapPrep': b.vx *= .7; if (b.t > 18) { b.state = 'leap'; b.t = 0; b.vy = -7; b.vx = clamp(dx / 32, -4, 4); b.hitP = false; } break;
    case 'leap': if (b.onGround && b.t > 6) { b.state = 'stomp'; b.t = 0; addShake(9); sfx('boom', 0); for (const s of [-1, 1]) spawnProj({ type: 'shock', x: b.x + b.w / 2 + s * 14, y: b.y + b.h - 4, vx: s * 3, vy: 0, r: 5, dmg: 20, life: 80 }); if (abs(dx) < 34 && dy > -30) hitP(b, b.dmg, { kx: (sign(dx) || 1) * 4, ky: -4 }); } break;
  }
  if (bossPhase(b, 'The Stag bells. Its wolves answer.')) for (const s of [-1, 1]) { const e = mkEnemy('frostwolf', cx + s * R * .8, gy - 10); e.minion = b; G.enemies.push(e); }
  if (P2 && b.state === 'idle' && b.t === 1 && G.enemies.filter(e => e.minion === b && !e.dead).length < 1 && Math.random() < .25) for (const s of [-1, 1]) { const e = mkEnemy('frostwolf', cx + s * R * .8, gy - 10); e.minion = b; G.enemies.push(e); }
  if (b.state !== 'stunned' && b.state !== 'intro' && b.state !== 'charge' && overlap(b, p) && !(b.hitCd > 0)) { hitP(b, 14, { kx: (sign(dx) || 1) * 3, ky: -2 }); b.hitCd = 40; }
  moveBody(b); if (b.state !== 'charge') b.x = clamp(b.x, cx - R - b.w / 2, cx + R - b.w / 2);
}, (b, x, y, o) => drawEnt(96, 48, 92, c => {
  c.scale(b.dir || 1, 1); const st = b.state, P2 = b.phase === 2, t = G.time, wk = sin((b.ph || 0) * 1.1) * 2, rise = st === 'intro' ? max(0, 1 - b.t / 120) * 30 : 0, low = st === 'chargePrep' || st === 'charge' ? 1 : 0;
  c.translate(0, rise);
  for (const [lx, ph] of [[-12, 0], [-6, 1], [6, 0], [11, 1]]) { const k = ph ? wk : -wk; rc(c, '#a8c0cc', lx, -12 + max(0, k), 3, 12); rc(c, '#62a9bc', lx, -2, 3, 2); }
  rc(c, '#e8f4f8', -15, -24, 30, 13); rc(c, '#ffffff', -13, -24, 24, 4); rc(c, '#c8e0ea', -15, -13, 30, 2);
  c.save(); c.translate(13, -22); c.rotate(low ? .7 : -.25); rc(c, '#e8f4f8', 0, -4, 6, 10); rc(c, '#ffffff', 2, -12, 7, 7); rc(c, '#120d1f', 6, -10, 2, 1); rc(c, P2 ? '#ffffff' : '#8fd0d8', 5, -10, 1, 1);
  c.strokeStyle = P2 ? '#ffffff' : '#c9fff6'; c.lineWidth = 2; const ant = (s) => { c.beginPath(); c.moveTo(4, -12); c.lineTo(4 + s * 6, -22); c.lineTo(4 + s * 14, -30); c.moveTo(4 + s * 6, -22); c.lineTo(4 + s * 2, -32); c.moveTo(4 + s * 10, -26); c.lineTo(4 + s * 18, -24); c.stroke(); };
  ant(1); ant(-.6); c.restore();
  if (st === 'breath') { c.globalAlpha = .6; rc(c, '#c9fff6', 22, -20, 6, 3); c.globalAlpha = 1; }
  c.globalAlpha = .5 + .4 * sin(t * .1); rc(c, '#ffffff', -4, -20, 3, 3); c.globalAlpha = 1;
}, x + b.w / 2, y + b.h, { flash: o.flash || ((st => st === 'chargePrep' || st === 'stompPrep' || st === 'leapPrep')(b.state) && (b.t >> 2) & 1), ly: -14 }));
// ================= THE HOROLOGIST =================
mob('hpendulum', { w: 10, h: 10, hp: 1, dmg: 26, contact: false, noKb: true, fly: true, name: 'Pendulum' }, (e, p) => {
  const b = e.root; if (!b || b.dead || !G.boss) { e.dead = true; return; }
  e.noHit = true; e.a += e.da; const L = e.len; e.x = e.ox + sin(e.a) * L - 5; e.y = e.oy + cos(e.a) * L - 5; if (e.t > e.life) e.dead = true;
  if (!p.dead && overlap(e, p, 2)) hitP(e, e.dmg, { kx: sign(cos(e.a) * e.da) * 5, ky: -3 });
}, (e, x, y, o) => { wctx.strokeStyle = '#7a5218'; wctx.lineWidth = 1; wctx.beginPath(); wctx.moveTo(e.ox, e.oy); wctx.lineTo(x + 5, y + 5); wctx.stroke(); drawEnt(32, 16, 16, c => { c.fillStyle = '#ffd35a'; c.beginPath(); c.arc(0, 0, 6, 0, TAU); c.fill(); rc(c, '#7a5218', -2, -2, 4, 4); rc(c, '#ffffff', -4, -1, 8, 1); }, x + 5, y + 5, { unlit: 1 }); });
mob('horologist', { w: 16, h: 40, hp: 3700, dmg: 30, contact: false, noKb: true, boss: true, kbRes: 1, armor: .8, fly: true, name: 'THE HOROLOGIST', glow: [.5, .42, .16] }, (b, p, dx, dy, dist) => {
  const cx = DARENA_X * T + 4, gy = DARENA_Y * T, R = (DIMP[5].arenaR - 2) * T, P2 = b.phase === 2;
  // it remembers where everyone stood, three seconds back
  if (b.t % 6 === 0) { (b.hp0 = b.hp0 || []).push([b.x, b.y, p.x, p.y]); if (b.hp0.length > 30) b.hp0.shift(); }
  if (b.state === 'dying') { b.vy = min(b.vy + .1, 3); b.vx *= .9; b.x += b.vx; b.y += b.vy; if (b.y + b.h > gy) b.y = gy - b.h; bossDying(b); return; }
  if (bossLeash(b, cx, R + 34 * T, 'The Horologist winds itself down. The mainspring waits.')) return;
  const hover = (tx, ty, sp = .03) => { b.vx = approach(b.vx, clamp((tx - b.x - b.w / 2) * sp, -2.2, 2.2), .1); b.vy = approach(b.vy, clamp((ty - b.y - b.h / 2) * sp, -2.2, 2.2), .1); };
  b.dir = sign(dx) || b.dir; b.hand = (b.hand || 0) + (P2 ? .06 : .035);
  // twice it turns the hour back: at two thirds and one third
  for (const [k, at] of [['rw1', .66], ['rw2', .33]]) if (!b[k] && b.hp < b.maxhp * at && b.state !== 'intro') { b[k] = 1; b.state = 'rewind'; b.t = 0; }
  switch (b.state) {
    case 'intro': b.invuln = true; hover(cx, gy - 60); if (b.t > 150) { b.invuln = false; toIdle(b); } break;
    case 'idle': hover(clamp(p.x + 3 - (sign(dx) || 1) * 70, cx - R, cx + R), gy - 40 + sin(b.t * .05) * 8); if (b.t > (P2 ? 42 : 66)) { b.t = 0; b.atkN++; const r = Math.random(), kids = G.enemies.filter(e => e.minion === b && !e.dead).length; b.state = P2 && kids < 2 && r < .2 ? 'brood' : r < .3 ? 'gears' : r < .55 ? 'pendulum' : r < .78 ? 'hands' : 'stopPrep'; sfx('clink'); } break;
    case 'gears': hover(b.x + b.w / 2, gy - 50); if (b.t % 14 === 6 && b.t < (P2 ? 60 : 44)) { const s = Math.random() < .5 ? -1 : 1, x = s < 0 ? cx + R : cx - R; spawnProj({ type: 'gear', x, y: gy - 6, vx: s * (P2 ? 2.6 : 2.1), vy: 0, g: 0, r: 6, dmg: 20, life: 2 * R / 2 + 40, phase: 1, pierce: true }); sfx('clang', 40); } if (b.t > 70) toIdle(b); break;
    case 'pendulum': hover(cx, gy - 120); if (b.t === 30) { for (const k of P2 ? [0, 1] : [0]) { const e = mkEnemy('hpendulum', cx, gy - 60); Object.assign(e, { root: b, ox: cx, oy: gy - 130, len: 124, a: k ? 1.3 : -1.3, da: (k ? -1 : 1) * .028, life: 230, t: 0 }); e.px = e.x; e.py = e.y; G.enemies.push(e); } sfx('clang', 0); } if (b.t > 120) toIdle(b); break;
    case 'hands': hover(cx, gy - 70); b.vx *= .9; b.vy *= .9; if (b.t === 1) { b.ha = atan2(p.y + 10 - b.y - b.h / 2, p.x + 3 - b.x - b.w / 2) - .9; sfx('tele'); }
      if (b.t < 40) { aimTrail(b, b.ha, 220, '#ffd35a'); aimTrail(b, b.ha + PI, 220, '#ffd35a'); } else { b.ha += P2 ? .022 : .016; fireBeam(b, b.ha, 240, 3, 20, '#ffd35a'); fireBeam(b, b.ha + PI, 240, 3, 20, '#ffd35a'); } if (b.t > (P2 ? 150 : 120)) toIdle(b); break;
    case 'stopPrep': hover(b.x + b.w / 2, b.y + b.h / 2); if (b.t === 1) { sfx('shrine', 0); G.note = { text: 'Its face glows: it is going to stop the hour', t: 0 }; } if (b.t > 44) { b.state = 'stop'; b.t = 0; G.chimeT = 70; G.flash = .4; G.flashCol = '255,220,140'; if (!p.dead && !(p.iDodge > 0)) { applyStatus(p, 'frost', b, { d: 60 }); p.vx = 0; p.vy = 0; } } break;
    case 'stop': if (b.t < 20) hover(p.x + 3 - (sign(dx) || 1) * 18, p.y + 4, .08); else if (b.t === 20) { if (abs(dx) < 40 && abs(dy) < 40) hitP(b, b.dmg + 8, { kx: (sign(dx) || 1) * 5, ky: -3 }); G.trails.push({ kind: 'arc', x: b.x + b.w / 2, y: b.y + 20, face: sign(dx) || 1, a0: -1.6, a1: 1.2, r0: 8, r1: 40, life: 10, max: 10, sty: ['#ffd35a', '#ffffff'] }); sfx('heavy', 0); } if (b.t > 40) toIdle(b); break;
    case 'brood': if (b.t === 20) for (const s of [-1, 1]) { const e = mkEnemy('clockmite', cx + s * 40, gy - 10); e.minion = b; G.enemies.push(e); burst(cx + s * 40, gy - 6, 10, ['#ffd35a', '#c9a44a'], 1.4, 20); } if (b.t > 40) toIdle(b); break;
    case 'rewind': b.invuln = true; b.vx *= .8; b.vy *= .8;
      if (b.t === 1) { sfx('roar', 0); G.banner = { text: 'IT TURNS THE HOUR BACK', sub: 'you, and it, go back to where you stood', t: 0 }; }
      if (b.t === 50) { const h0 = (b.hp0 || [])[0]; if (h0) { b.x = b.px = h0[0]; b.y = b.py = h0[1]; if (!p.dead) { p.x = p.px = h0[2]; p.y = p.py = h0[3]; p.vx = p.vy = 0; unstickMe(); snapCam(); } } b.hp = min(b.maxhp, b.hp + b.maxhp * .05); G.flash = .7; G.flashCol = '255,220,140'; burst(b.x + 8, b.y + 20, 30, ['#ffd35a', '#fff1a8', '#ffffff'], 2.6, 40, { glow: 1 }); b.hp0 = []; }
      if (b.t > 70) { b.invuln = false; toIdle(b); } break;
  }
  bossPhase(b, 'The Horologist winds itself tighter. Its hands move faster.');
  b.x += b.vx; b.y += b.vy; b.x = clamp(b.x, cx - R - b.w / 2, cx + R - b.w / 2); if (b.y + b.h > gy) { b.y = gy - b.h; b.vy = 0; } b.y = max(b.y, gy - 200);
}, (b, x, y, o) => drawEnt(96, 48, 70, c => {
  const P2 = b.phase === 2, t = G.time, bob = sin(t * .05) * 1.5, h = b.hand || 0, glow = b.state === 'stopPrep' ? .5 + .5 * sin(t * .4) : 0;
  c.translate(0, bob); c.scale(b.dir || 1, 1);
  c.fillStyle = '#3a2a14'; c.beginPath(); c.moveTo(-8, -26); c.lineTo(8, -26); c.lineTo(12, 0); c.lineTo(-12, 0); c.fill(); rc(c, '#7a5a28', -7, -25, 14, 4); for (let k = 0; k < 3; k++) rc(c, '#c9a44a', -9 + k * 1, -18 + k * 6, 18 - k * 2, 1);
  c.save(); c.translate(0, -34); c.fillStyle = '#7a5218'; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill(); c.fillStyle = glow ? `rgba(255,241,168,${.6 + glow * .4})` : '#e8dcb0'; c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fill();
  c.strokeStyle = '#2a1a0a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(cos(h * 12) * 6, sin(h * 12) * 6); c.moveTo(0, 0); c.lineTo(cos(h) * 4, sin(h) * 4); c.stroke(); rc(c, P2 ? '#ff3b2a' : '#c94a2a', -1, -1, 2, 2); c.restore();
  for (const s of [-1, 1]) { c.save(); c.translate(s * 8, -22); c.rotate(s * (.3 + sin(t * .06 + s) * .2) + (b.state === 'stop' ? -s * .8 : 0)); rc(c, '#c9a44a', -1, 0, 2, 16); rc(c, '#ffd35a', -2, 15, 4, 3); c.restore(); }
}, x + b.w / 2, y + b.h, { flash: o.flash || (b.state === 'stopPrep' && (b.t >> 2) & 1), unlit: 1, alpha: b.state === 'rewind' ? .5 + .5 * sin(b.t * .4) : 1 }));
// ================= THE STORMWRIGHT =================
mob('stormwright', { w: 18, h: 30, hp: 3700, dmg: 32, contact: false, noKb: true, boss: true, kbRes: 1, fly: true, armor: .85, name: 'THE STORMWRIGHT', glow: [.4, .45, .85] }, (b, p, dx, dy, dist) => {
  const cx = DARENA_X * T + 4, gy = DARENA_Y * T, R = (DIMP[6].arenaR - 2) * T, P2 = b.phase === 2;
  if (b.state === 'dying') { b.vy = min(b.vy + .1, 3); b.vx *= .9; b.x += b.vx; b.y += b.vy; if (b.y + b.h > gy) b.y = gy - b.h; bossDying(b); return; }
  if (bossLeash(b, cx, R + 34 * T, 'The Stormwright rises into its clouds. The eye waits.')) return;
  const hover = (tx, ty) => { b.vx = approach(b.vx, clamp((tx - b.x - b.w / 2) * .03, -2.4, 2.4), .1); b.vy = approach(b.vy, clamp((ty - b.y - b.h / 2) * .03, -2.4, 2.4), .1); };
  b.dir = sign(dx) || b.dir;
  switch (b.state) {
    case 'intro': b.invuln = true; hover(cx, gy - 90); if (b.t % 20 === 0) strikeAt(cx + frand(-R, R), gy, false, { warn: 10 }); if (b.t > 150) { b.invuln = false; toIdle(b); } break;
    case 'idle': { const a = b.t * .02; hover(clamp(p.x + 3 + cos(a) * 80, cx - R, cx + R), gy - 80 + sin(a * 1.6) * 20); if (b.t > (P2 ? 44 : 70)) { b.t = 0; b.atkN++; const r = Math.random(), kids = G.enemies.filter(e => e.minion === b && !e.dead).length; b.state = P2 && kids < 2 && r < .18 ? 'brood' : r < .35 ? 'bolts' : r < .55 ? 'gale' : r < .78 ? 'hammerPrep' : 'chain'; sfx('tele'); } } break;
    case 'bolts': hover(b.x + b.w / 2, gy - 100); if (b.t % (P2 ? 12 : 16) === 4 && b.t < (P2 ? 70 : 56)) strikeAt(clamp(p.x + 3 + p.vx * 26 + frand(-20, 20), cx - R, cx + R), gy, true, { warn: 38, dmg: 26 }); if (b.t > 100) toIdle(b); break;
    case 'gale': { const s = b.galeS || (b.galeS = p.x + 3 < cx ? -1 : 1); hover(cx - s * R * .7, gy - 60); if (!p.dead && !gearHas('stormborn')) { const nx = p.x + s * (P2 ? .9 : .7); if (!boxHits(nx, p.y, p.w, p.h)) p.x = nx; } if (b.t % 3 === 0) P(b.x + b.w / 2, b.y + frand(b.h), s * frand(3, 5), frand(-.5, .5), 26, '#e8f0ff', { g: 0 }); if (b.t % 20 === 10) shootAt(b, p, { col: '#9ab0ff', col2: '#ffffff', sz: 2, sp: 2.6, dmg: 14, shock: 1, light: [.2, .25, .5] }); if (b.t > 130) { b.galeS = 0; toIdle(b); } } break;
    case 'hammerPrep': hover(p.x + 3, gy - 130); if (b.t > 40) { b.state = 'hammer'; b.t = 0; b.tx = p.x + 3; sfx('roar', 0); } break;
    case 'hammer': b.vx = clamp((b.tx - b.x - b.w / 2) * .1, -3, 3); b.vy = 6; b.x += b.vx; b.y += b.vy; if (b.y + b.h >= gy) { b.y = gy - b.h; b.state = 'land'; b.t = 0; addShake(10); sfx('boom', 0); G.trails.push({ kind: 'ring', x: b.x + b.w / 2, y: gy, r: 50, life: 14, max: 14 }); if (abs(dx) < 46 && abs(dy) < 40) hitP(b, b.dmg + 6, { kx: (sign(dx) || 1) * 5, ky: -4, shock: 1 }); for (const s of [-1, 1]) spawnProj({ type: 'shock', x: b.x + b.w / 2 + s * 12, y: gy - 4, vx: s * 3.2, vy: 0, r: 5, dmg: 20, life: 80 }); } break;
    case 'land': b.vx = b.vy = 0; b.vuln = 1.4; if (b.t > (P2 ? 50 : 70)) { b.vuln = 1; toIdle(b); } break;
    case 'chain': hover(b.x + b.w / 2, b.y + b.h / 2); if (b.t === 20 || (P2 && b.t === 50)) { for (const k of [-.25, 0, .25]) { const a = atan2(p.y + 10 - b.y - 15, p.x + 3 - b.x - 9) + k; spawnProj({ type: 'orb', x: b.x + 9, y: b.y + 15, vx: cos(a) * 3.2, vy: sin(a) * 3.2, r: 3, dmg: 18, life: 100, col: '#e8f0ff', col2: '#ffffff', sz: 2, shock: 1, light: [.3, .35, .7] }); } sfx('bolt', 0); } if (b.t > 70) toIdle(b); break;
    case 'brood': if (b.t === 20) for (const s of [-1, 1]) { const e = mkEnemy('stormkite', cx + s * 60, gy - 90); e.minion = b; G.enemies.push(e); } if (b.t > 40) toIdle(b); break;
  }
  bossPhase(b, 'The Stormwright laughs like thunder. The storm closes in.');
  if (b.state !== 'hammer') { b.x += b.vx; b.y += b.vy; }
  b.x = clamp(b.x, cx - R - b.w / 2, cx + R - b.w / 2); if (b.y + b.h > gy) { b.y = gy - b.h; b.vy = 0; } b.y = max(b.y, gy - 200);
}, (b, x, y, o) => drawEnt(96, 48, 70, c => {
  const t = G.time, P2 = b.phase === 2, up = b.state === 'hammerPrep' ? min(1, b.t / 30) : 0;
  c.scale(b.dir || 1, 1); c.fillStyle = '#3a4268'; c.beginPath(); c.moveTo(-9, -26); c.quadraticCurveTo(0, -32, 9, -26); c.lineTo(11, -4 + sin(t * .2) * 2); c.lineTo(4, 0); c.lineTo(0, -4); c.lineTo(-4, 0); c.lineTo(-11, -4 - sin(t * .2) * 2); c.fill();
  c.fillStyle = '#c8d0e8'; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(-8 + k * 4, -26 + sin(t * .05 + k) * 1.5, 4, 0, TAU); c.fill(); }
  rc(c, '#e8f0ff', -3, -24, 6, 5); rc(c, P2 ? '#ffffff' : '#9ab0ff', -2, -22, 1, 1); rc(c, P2 ? '#ffffff' : '#9ab0ff', 2, -22, 1, 1);
  c.save(); c.translate(8, -16); c.rotate(-.6 - up * 1.6 + (b.state === 'land' ? 1.6 : 0)); rc(c, '#6a7aa8', -1, 0, 2, 16); rc(c, '#e8f0ff', -4, 14, 8, 6); if ((t >> 2) & 1) rc(c, '#ffffff', -2, 16, 4, 2); c.restore();
}, x + b.w / 2, y + b.h, { flash: o.flash || (b.state === 'hammerPrep' && (b.t >> 2) & 1), unlit: 1 }));
// ================= THE HOLLOW =================
mob('hollowking', { w: 24, h: 44, hp: 7000, dmg: 34, contact: false, noKb: true, boss: true, kbRes: 1, armor: .85, fly: true, name: 'THE HOLLOW' }, (b, p, dx, dy, dist) => {
  const cx = DARENA_X * T + 4, gy = DARENA_Y * T, R = (DIMP[7].arenaR - 2) * T, f = b.hp / b.maxhp, P = f > .66 ? 1 : f > .33 ? 2 : 3;
  if (b.state === 'dying') { b.vx *= .9; b.vy = min(b.vy + .05, 1); b.x += b.vx; b.y += b.vy; if (b.y + b.h > gy) b.y = gy - b.h; hollowDying(b); return; }
  if (bossLeash(b, cx, R + 34 * T, 'The Hollow folds back into the cold. The hearth waits.')) return;
  const hover = (tx, ty, sp = .03) => { b.vx = approach(b.vx, clamp((tx - b.x - b.w / 2) * sp, -2.2, 2.2), .1); b.vy = approach(b.vy, clamp((ty - b.y - b.h / 2) * sp, -2.2, 2.2), .1); };
  b.dir = sign(dx) || b.dir; if (P !== b.P) { if (b.P) { G.flash = .7; G.flashCol = '20,10,30'; sfx('roar', 0); addShake(8); G.banner = { text: P === 2 ? 'THE DARK' : 'THE LAST COLD', sub: P === 2 ? 'it puts out the light around you' : 'stand by the hearth: it remembers being warm', t: 0 }; if (P === 2) for (const s of [-1, 1]) { const e = mkEnemy('shade', cx + s * R * .6, gy - 30); e.minion = b; G.enemies.push(e); } } b.P = P; }
  // the hearth fights back at the end: blows struck beside it land harder
  b.vuln = P === 3 && abs(p.x + 3 - cx) < 46 ? 1.3 : 1;
  const tendril = x => { const e = mkEnemy('rmtendril', x - 3, gy); e.root = b; e.t = 0; e.gy = gy; e.up = 0; e.noHit = true; e.px = e.x; e.py = e.y; G.enemies.push(e); };
  for (const e of G.enemies) if (e.root === b && e.type === 'rmtendril' && !e.dead) {
    e.t++; const up = e.t < 45 ? 0 : e.t < 55 ? (e.t - 45) / 10 : e.t < 105 ? 1 : max(0, 1 - (e.t - 105) / 12); e.up = up; e.noHit = true; e.y = e.py = e.gy - e.h * up; e.px = e.x;
    if (e.t === 45) { burst(e.x + 3, e.gy, 12, ['#3a3450', '#1a1626', '#ff9a3d'], 2, 24); sfx('brk'); }
    if (up > .6 && !p.dead && overlap(e, p)) hitP(e, 22, { kx: (sign(p.x - e.x) || 1) * 3, ky: -4.5 }); if (e.t > 117) e.dead = true;
  }
  switch (b.state) {
    case 'intro': b.invuln = true; hover(cx, gy - 70, .02); if (b.t % 12 === 0) { addShake(2); burst(cx + frand(-R, R), gy, 6, ['#3a3450', '#1a1626'], 1.4, 30); } if (b.t > 180) { b.invuln = false; toIdle(b); } break;
    case 'idle': hover(clamp(p.x + 3 - (sign(dx) || 1) * 60, cx - R, cx + R), gy - 50 + sin(b.t * .04) * 10); if (b.t > (P === 3 ? 34 : P === 2 ? 44 : 56)) { b.t = 0; b.atkN++; const L = P === 1 ? ['slam', 'tendrils', 'beam', 'spikes', 'gears', 'bolts'] : P === 2 ? ['blink', 'beam', 'tendrils', 'bolts', 'nova', 'blink'] : ['nova', 'blink', 'spikes', 'bolts', 'slam', 'beam']; b.state = L[floor(Math.random() * L.length)]; sfx('tele'); } break;
    case 'slam': if (b.t < 30) hover(p.x + 3, gy - 60, .06); else if (b.t === 30) { b.vy = 6; } else if (b.t > 30 && b.y + b.h < gy) { b.y += 6; } else if (!b.hitDone) { b.hitDone = 1; b.y = gy - b.h; addShake(9); sfx('boom', 0); for (const s of [-1, 1]) spawnProj({ type: 'shock', x: b.x + b.w / 2 + s * 14, y: gy - 4, vx: s * 3, vy: 0, r: 5, dmg: 22, life: 90 }); if (abs(dx) < 40 && abs(dy) < 40) hitP(b, b.dmg, { kx: (sign(dx) || 1) * 5, ky: -4 }); } if (b.t > 70) { b.hitDone = 0; toIdle(b); } break;
    case 'tendrils': hover(cx, gy - 80); if (b.t === 1 || b.t === 30 || (P > 1 && b.t === 55)) for (let k = 0; k < 2; k++) tendril(clamp(p.x + 3 + (k ? frand(-50, 50) : p.vx * 24), cx - R, cx + R)); if (b.t > 90) toIdle(b); break;
    case 'beam': b.vx *= .9; b.vy *= .9; if (b.t === 1) b.aim = atan2(p.y + 10 - b.y - b.h / 2, p.x + 3 - b.x - b.w / 2); else if (b.t < 44) b.aim += clamp(atan2(p.y + 10 - b.y - b.h / 2, p.x + 3 - b.x - b.w / 2) - b.aim, -.03, .03); if (b.t < 44) aimTrail(b, b.aim, 280, '#ff9a3d'); else fireBeam(b, b.aim += (P === 3 ? .012 : 0), 300, 4, b.dmg - 4, '#ff9a3d'); if (b.t > 72) toIdle(b); break;
    case 'spikes': hover(b.x + b.w / 2, gy - 50); if (b.t === 20) { const s = sign(dx) || 1; for (let k = 0; k < 14; k++) { const x = b.x + b.w / 2 + s * (10 + k * 11); if (abs(x - cx) > R) break; G.dhaz.push({ kind: 'spike', x, y: gy, delay: 1 + k * 4, dmg: 22 }); } } if (b.t > 70) toIdle(b); break;
    case 'gears': hover(b.x + b.w / 2, gy - 60); if (b.t % 16 === 8 && b.t < 50) { const s = Math.random() < .5 ? -1 : 1; spawnProj({ type: 'gear', x: s < 0 ? cx + R : cx - R, y: gy - 6, vx: s * 2.4, vy: 0, g: 0, r: 6, dmg: 20, life: R + 40, phase: 1, pierce: true }); } if (b.t > 60) toIdle(b); break;
    case 'bolts': hover(b.x + b.w / 2, gy - 100); if (b.t % 14 === 4 && b.t < 60) strikeAt(clamp(p.x + 3 + p.vx * 24 + frand(-16, 16), cx - R, cx + R), gy, true, { warn: 36, dmg: 26 }); if (b.t > 90) toIdle(b); break;
    case 'blink': b.noHit = b.t > 6 && b.t < 28; if (b.t === 16) { const s = -(p.face || 1); b.x = b.px = clamp(p.x + 3 + s * 30, cx - R, cx + R) - b.w / 2; b.y = b.py = p.y - 20; b.vx = b.vy = 0; } if (b.t === 34) { if (abs(dx) < 44 && abs(dy) < 40) hitP(b, b.dmg, { kx: (sign(dx) || 1) * 4.5, ky: -3 }); G.trails.push({ kind: 'arc', x: b.x + b.w / 2, y: b.y + 24, face: sign(dx) || 1, a0: -1.8, a1: 1.3, r0: 10, r1: 46, life: 12, max: 12, sty: ['#3a3450', '#ff9a3d'] }); sfx('heavy', 0); } if (b.t > 50) { b.noHit = false; toIdle(b); } break;
    case 'nova': hover(cx, gy - 70); if (b.t === 24 || (P === 3 && b.t === 48)) { for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + b.t * .1; spawnProj({ type: 'orb', x: b.x + b.w / 2, y: b.y + b.h / 2, vx: cos(a) * 2, vy: sin(a) * 2, r: 3, dmg: 16, life: 170, col: '#3a3450', col2: '#ff9a3d', sz: 3 }); } sfx('shrine', 0); } if (b.t > 70) toIdle(b); break;
  }
  b.x += b.vx; if (b.state !== 'slam' || b.t < 30) b.y += b.vy; b.x = clamp(b.x, cx - R - b.w / 2, cx + R - b.w / 2); if (b.y + b.h > gy) { b.y = gy - b.h; b.vy = 0; } b.y = max(b.y, gy - 200);
}, (b, x, y, o) => drawEnt(96, 48, 76, c => {
  const t = G.time, f = b.hp / b.maxhp, sway = sin(t * .04) * 2, rise = b.state === 'intro' ? max(0, 1 - b.t / 160) * 30 : 0;
  c.translate(0, rise); c.scale(b.dir || 1, 1);
  c.fillStyle = '#0e0a16'; c.beginPath(); c.moveTo(-12, -40); c.quadraticCurveTo(0, -50, 12, -40); c.lineTo(16, -6 + sway); c.lineTo(8, 0); c.lineTo(3, -6); c.lineTo(-3, 0); c.lineTo(-8, -6); c.lineTo(-16, -6 - sway); c.fill();
  c.fillStyle = '#1a1626'; c.beginPath(); c.moveTo(-9, -38); c.quadraticCurveTo(0, -46, 9, -38); c.lineTo(10, -14); c.lineTo(-10, -14); c.fill();
  for (let k = 0; k < 5; k++) { const a = -PI / 2 + (k - 2) * .35; rc(c, k === 2 ? '#ff9a3d' : '#c94a2a', round(cos(a) * 12) - 1, -46 + round(sin(a) * 6), 2, 4 + (k === 2 ? 2 : 0)); }
  rc(c, '#ff9a3d', -4, -36, 2, 1); rc(c, '#ff9a3d', 3, -36, 2, 1);
  c.globalAlpha = .4 + .3 * sin(t * .08) * f; rc(c, '#ff9a3d', -3, -28, 6, 6); c.globalAlpha = 1; rc(c, '#fff1a8', -1, -26, 2, 2);
  for (const s of [-1, 1]) { c.save(); c.translate(s * 10, -32); c.rotate(s * (.4 + sin(t * .05 + s) * .15) + (b.state === 'blink' && b.t > 28 ? -s * 1.2 : 0)); rc(c, '#0e0a16', -2, 0, 4, 26); rc(c, '#3a3450', -3, 24, 6, 4); c.restore(); }
}, x + b.w / 2, y + b.h, { flash: o.flash, unlit: 1, alpha: b.state === 'blink' && b.t > 6 && b.t < 28 ? .25 : 1 }));
// the Hollow goes out: the ring is lit again
function hollowDying(b) {
  const I = BOSSES.hollowking; b.invuln = true;
  if (b.t % 4 === 0) { burst(b.x + frand(b.w), b.y + frand(b.h), 8, ['#ffffff', '#fff1a8', '#ff9a3d'], 2.4, 34, { glow: 1 }); addShake(2); sfx('hit2', 40); }
  if (b.t === 60) { G.flash = 1; G.flashCol = '255,250,230'; sfx('quest', 0); }
  if (b.t > 150) { const first = !G.flags.hollowDead; bossDown(b); if (first) dawnLit(); }
}
function dawnLit() {
  const F = G.flags; F.dawnLit = true; F.hollowDead = true; G.dirty = true; unlock('ending'); sfx('quest', 0); G.flash = 1; G.flashCol = '255,240,200';
  setTimeout(() => { if (G.state !== 'play') return; closeUI(); UI.open = 'ending'; UI.endT = 0; }, 2500);
  saveWorld(true);
}
const ENDING = [
  'The Hollow goes out like a candle in a closed room: not with a sound, but with the sudden knowledge that it is gone.',
  'Behind you, the Cold Hearth catches. Then the ring above it catches, one fragment at a time, ash and glass and forge and cinder, root and prism and moon, rime and hour and storm, until the circle closes.',
  'In the Waking Lands, Wick looks up from a fire he has kept for longer than he admits, and sees the Dawnforge whole.',
  'The nights will not run long any more. The light has a smith again.',
  'You were ash on the wind once. Something said rise. You did.'
];
function drawEndingUI(c) {
  // THE DAWNFORGE: the world darkens, the lines come one by one under a rising sun, then CARRY ON
  UI.endT = (UI.endT || 0) + 1; const S = KIT.sizes, w0 = min(340, VS.uw - (menuMode() === 'narrow' ? 12 : 24)), lines = ENDING.map(s => wrapC(s, w0 - 24)), n = lines.reduce((a, l) => a + l.length, 0), need = n * 10 + ENDING.length * 6;
  c.fillStyle = `rgba(8,6,16,${min(.6, UI.endT / 160)})`; c.fillRect(0, 0, VS.uw, VS.uh);
  const F = menuFrame('ending', 340, 29 + need + 4 + S.bh + 10), K = pcard(c, 'ending', 0, 0, 'THE DAWNFORGE', { frame: F, foot: true, close: false }), ga = c.globalAlpha;
  const B = { x: K.x + 1, y: K.by, w: K.w - 2, h: K.footY - 2 - K.by }, sc = need > B.h, dy = sc ? kscroll(c, B, need, 'ending') : 0; let yy = K.by + 2 + dy;
  lines.forEach((L, k) => { const a = clamp((UI.endT - k * 70) / 50, 0, 1); c.globalAlpha = ga * a; for (const l of L) { drawText(c, l, K.x + 12, yy, k === lines.length - 1 ? KIT.col : '#e8e4f4'); yy += 10; } yy += 6; c.globalAlpha = ga; });
  if (sc) kscrollEnd(c);
  if (UI.endT > ENDING.length * 70) { const bw = KIT.T ? 112 : 100; kbutton(c, K.x + round((K.w - bw) / 2), K.footY + 5, bw, 'CARRY ON', () => { closeUI(); sfx('ui'); G.banner = { text: 'THE DAWN IS LIT', sub: 'the world is yours to keep walking', t: 0 }; }, { main: true, hint: 'The world is yours to keep walking.' }); }
}
