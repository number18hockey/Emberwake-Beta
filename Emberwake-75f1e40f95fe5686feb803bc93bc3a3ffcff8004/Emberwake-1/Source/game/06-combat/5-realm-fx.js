// ============================================================
//  What the metals past the floors do to whatever they hit, and what
//  their arts add:
//    RIME      (rimesteel)    blows freeze; a heavy blow or a critical on a
//                             frozen foe SHATTERS it for half again
//    ECHO      (hourbrass)    every blow strikes again a moment later
//    ARC       (stormsilver)  blows leap as lightning to foes close by
//    RADIANCE  (dawnsteel)    blows mend you a little, and the Hollow and
//                             everything it made take more
//  Some arts add more: ice spikes that run along the ground, lightning
//  called down around the blow, a stopped moment for everything near.
// ============================================================
const HOLLOWISH = new Set(['shade', 'hollowhound', 'ashcolossus', 'emberwraith', 'hollowking', 'moonwretch', 'husk', 'fogwalker', 'umbralknight']);
function realmFx(a) {
  const W = a.W || {}, m = a.m || {}, o = { rime: (W.rime || 0) + (m.rime || 0), echo: (W.echo || 0) + (m.echo || 0), arc: (W.arc || 0) + (m.arc || 0), rad: (W.radiance || 0) + (m.radiance || 0), big: a.btn === 'H' || !!m.big, spikes: m.spikes || 0, bolts: m.bolts || 0, stop: m.timestop || 0, face: a.face || 1 };
  return o.rime || o.echo || o.arc || o.rad || o.spikes || o.bolts || o.stop ? o : null;
}
function realmFxHit(fx, f, e, dmg, crit, hx, hy, a) {
  if (!fx || !e || e.fighter || !f) return; const P0 = f === G.p, wfx = G.wfx || (G.wfx = []);
  if (hx === undefined) { hx = e.x + e.w / 2; hy = e.y + e.h / 2; }
  if (fx.rime && !e.dead) {
    const s = e.st;
    if (s && s.frost > 0 && (fx.big || crit)) { s.frost = 0; damageEnemy(e, max(1, round(dmg * (.5 + .25 * fx.rime))), 0, -1, { stop: 3, hx, hy }); burst(hx, hy, 16, ['#ffffff', '#c9fff6', '#8fd0d8'], 2.4, 26); sfx('shatter', 30); numPop(hx, hy - 10, 'SHATTER', '#c9fff6'); }
    else applyStatus(e, 'frost', f, { d: 80 + fx.rime * 40 });
  }
  if (fx.echo) for (let k = 1; k <= fx.echo; k++) wfx.push({ k: 'echo', e, f, dmg: max(1, round(dmg * .35)), t: 16 * k });
  if (fx.arc) {
    let from = e; const hit = new Set([e.root || e]);
    for (let j = 0; j < 1 + fx.arc; j++) {
      let best = null, bd = 66; for (const q of foesOf(f)) { if (q.dead || q.noHit || q.fighter || hit.has(q.root || q)) continue; const d = hypot(q.x + q.w / 2 - from.x - from.w / 2, q.y + q.h / 2 - from.y - from.h / 2); if (d < bd) { bd = d; best = q; } }
      if (!best) break; hit.add(best.root || best); G.trails.push({ kind: 'beam', x: from.x + from.w / 2, y: from.y + from.h / 2, x2: best.x + best.w / 2, y2: best.y + best.h / 2, w: 1, life: 6, max: 6, col: '#9ab0ff' });
      damageEnemy(best, max(1, round(dmg * .45)), 0, -1, { stop: 2 }); if (!best.boss) best.stun = max(best.stun || 0, 18); from = best;
    }
    if (hit.size > 1) sfx('bolt', 40);
  }
  if (fx.rad) { if (HOLLOWISH.has((e.root || e).type) && !e.dead) damageEnemy(e, max(1, round(dmg * .3 * fx.rad)), 0, 0, { dot: 1 }); if (P0 && f.hp < f.maxhp && Math.random() < .5) f.hp = min(f.maxhp, f.hp + fx.rad); burst(hx, hy, 6, ['#fff1a8', '#ffd35a'], 1.4, 18, { glow: 1 }); }
  if (fx.stop) for (const q of foesOf(f)) if (!q.dead && !q.boss && !q.fighter && hypot(q.x - e.x, q.y - e.y) < 72) { q.stun = max(q.stun || 0, 60); P(q.x + q.w / 2, q.y - 3, 0, -.3, 40, '#ffd35a', { g: 0, glow: 1 }); }
  if (a && fx.spikes && !a.spiked) { a.spiked = 1; const gy = (f.y + f.h); for (let k = 0; k < fx.spikes; k++) wfx.push({ k: 'spike', f, x: f.x + 3 + fx.face * (16 + k * 12), y: gy, dmg: max(1, round(dmg * .6)), t: 4 + k * 4 }); }
  if (a && fx.bolts && !a.bolted) { a.bolted = 1; for (let k = 0; k < fx.bolts; k++) { const x = hx + (k ? frand(-40, 40) : 0); wfx.push({ k: 'bolt', f, x, y: groundAt(floor(x / T)) * T, dmg: max(1, round(dmg * .7)), t: 8 + k * 9 }); } }
}
function tickWeaponFx() {
  const L = G.wfx; if (!L || !L.length) return;
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i]; if (--q.t > 0) continue; L.splice(i, 1);
    if (q.k === 'echo') { const r = q.e.root || q.e; if (!q.e.dead && !r.dead && !r.invuln) { damageEnemy(q.e, q.dmg, 0, 0, { dot: 1 }); burst(q.e.x + q.e.w / 2, q.e.y + q.e.h / 2, 6, ['#ffd35a', '#fff1a8'], 1.2, 16, { glow: 1 }); sfx('clink', 40); } }
    else if (q.k === 'spike') { if (!solidAt(floor(q.x / T), floor((q.y - 4) / T))) { spawnProj({ type: 'icespike', owner: q.f, x: q.x, y: q.y - 6, vx: 0, vy: 0, g: 0, r: 6, dmg: q.dmg, life: 30, pierce: true, phase: 1, kb: [0, -2.5], hits: new Set() }); sfx('crack', 40); } }
    else if (q.k === 'bolt') { G.trails.push({ kind: 'bolt', x: q.x, y: q.y, life: 10, max: 10, seed: (Math.random() * 1e9) | 0 }); G.bolt = 12; addShake(3); sfx('boom', 30); for (const e of foesOf(q.f)) if (!e.dead && !e.noHit && !e.fighter && abs(e.x + e.w / 2 - q.x) < 16 && e.y + e.h > q.y - 140) damageEnemy(e, q.dmg, 0, -2, { stop: 2 }); }
  }
}
