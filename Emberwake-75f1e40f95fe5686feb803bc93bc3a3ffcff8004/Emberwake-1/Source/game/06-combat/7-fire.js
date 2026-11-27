// ============================================================
//  FIRE THAT CLINGS. The strips of burning ground (a flask on the
//  floor, the Hearthkeeper's roar, the Keeper's shock, the forge
//  link) are G.fires and live in 2-links.js, as they always have.
//  These are the other flames: the ones that take root on the bare
//  faces of rock around a point (a flask against a wall or under a
//  roof, a lightning strike, the Wilds' wildfire), and the burning
//  drops of a flask that bursts with no ground beneath it. They are
//  little animated tongues that lean, lick and split, each keeping
//  its own rhythm, and rain puts them out sooner.
// ============================================================
const FLAME_N = 24, FLAME_DIM = [[9, 11], [11, 15], [13, 20]];
let FLAME = null;
function buildFlames() {
  const cols = [[.8, '#fff6d0'], [.58, '#ffd35a'], [.34, '#ff9a2a'], [.14, '#f0622a'], [.02, '#b8371c']];
  FLAME = FLAME_DIM.map(([w, h], k) => {
    const frames = [], R = mulberry32(331 + k), off = [R() * TAU, R() * TAU, R() * TAU];
    for (let f = 0; f < FLAME_N; f++) {
      const [c, x] = mk(w, h), th = f / FLAME_N * TAU;
      // a tall tongue and two shorter ones beside it
      const tongues = [[w * .5, 1, off[0], .46], [w * .28, .6, off[1] + 2.1, .3], [w * .73, .68, off[2] + 4.2, .32]];
      for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
        const Y = h - 1 - py; let heat = 0;
        for (const [cx, amp, ph, wd] of tongues) {
          const H = (h - 1) * amp * (.78 + .16 * sin(th + ph) + .1 * sin(2 * th + ph * 1.7)), u = Y / H; if (u > 1) continue;
          const mid = cx + (sin(th + ph + u * 2.4) * 1.5 + sin(2 * th + ph * 2.1 + u * 4) * .6) * u, half = w * wd * pow(1 - u, .72) * (1 + .16 * sin(2 * th + ph + u * 5)) + .25, d = abs(px + .5 - mid) / half;
          if (d < 1) heat = max(heat, (1 - d) * .52 + (1 - u) * .5);
        }
        // now and then the tip breaks away and floats up
        const r = (f / FLAME_N + k * .31) % 1, ly = (h - 3) * (.55 + r * .5), lx = w * .5 + sin(th * 2) * 1.6, rad = 1.5 * (1 - r); if (rad > .4 && hypot(px + .5 - lx, Y - ly) < rad) heat = max(heat, .3);
        if (heat > .02) for (const [at, col] of cols) if (heat > at) { x.fillStyle = col; x.fillRect(px, py, 1, 1); break; }
      }
      frames.push(c);
    }
    return frames;
  });
}
// the bare faces around a point, reached through open air only (fire does not pass through a wall)
function fireFaces(x, y, R) {
  const out = [], sol = (tx, ty) => solidAt(tx, ty) && !TP[tileAt(tx, ty)].ghost, open = (tx, ty) => inW(tx, ty) && !solidAt(tx, ty) && !TP[tileAt(tx, ty)].liquid;
  let sx = floor(x / T), sy = floor(y / T);
  if (!open(sx, sy)) { let best = null, bd = 1e9; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { if (!open(sx + dx, sy + dy)) continue; const d = hypot((sx + dx) * T + 4 - x, (sy + dy) * T + 4 - y); if (d < bd) { bd = d; best = [sx + dx, sy + dy]; } } if (!best) return out; sx = best[0]; sy = best[1]; }
  const seen = new Set([sy * WW + sx]), q = [[sx, sy]];
  const face = (fx, fy, nx, ny) => { const d = hypot(fx - x, fy - y); if (d <= R) out.push({ x: fx, y: fy, nx, ny, s: 1 - d / R * .6, ph: hh(fx | 0, fy | 0, 5) }); };
  while (q.length) {
    const [tx, ty] = q.pop(), px = tx * T, py = ty * T;
    if (sol(tx, ty + 1) || platAt(tx, ty + 1)) { face(px + 2, py + T, 0, -1); face(px + 6, py + T, 0, -1); }
    if (sol(tx - 1, ty)) { face(px, py + 3, 1, 0); face(px, py + 7, 1, 0); }
    if (sol(tx + 1, ty)) { face(px + T, py + 3, -1, 0); face(px + T, py + 7, -1, 0); }
    if (sol(tx, ty - 1)) face(px + 4, py, 0, 1);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = tx + dx, ny = ty + dy, k = ny * WW + nx; if (seen.has(k) || !open(nx, ny) || hypot(nx * T + 4 - x, ny * T + 4 - y) > R + 6) continue; seen.add(k); q.push([nx, ny]); }
  }
  return out;
}
const FACE_FIRES = [];
function addFire(x, y, pts, life, by, ghost) {
  if (!pts.length) return null; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of pts) { x0 = min(x0, p.x); x1 = max(x1, p.x); y0 = min(y0, p.y); y1 = max(y1, p.y); }
  if (FACE_FIRES.length > 40) FACE_FIRES.shift();
  const f = { x, y, pts, x0: x0 - 3, x1: x1 + 3, y0: y0 - 4, y1: y1 + 4, life, max: life, by, ghost: !!ghost }; FACE_FIRES.push(f); return f;
}
// burn the surfaces around (x, y); returns null where there is nothing to cling to. A flask asks for walls and roofs only, and only
// when it broke right against one: the ground beneath it burns as a strip, the old way. A side of rock is a wall only where the
// rock goes on above it: the riser of a one-tile step and the lip of a ledge are ground, and stay as they always were
function lightFire(x, y, R, life, by, ghost, wallsOnly) {
  let pts = fireFaces(x, y, R); if (wallsOnly) { pts = pts.filter(p => p.ny > 0 || p.ny === 0 && solidAt(floor((p.x - p.nx * 2) / T), floor(p.y / T) - 1)); if (!pts.some(p => hypot(p.x - x, p.y - y) < 7)) pts = []; }
  return addFire(x, y, pts, life, by, ghost);
}
// burning drops thrown from a burst in mid-air: they fall, and burn where they land
const FIRE_DROPS = [];
function rainFire(x, y, n, by, ghost) { for (let i = 0; i < n; i++) FIRE_DROPS.push({ x, y, px: x, py: y, vx: frand(-1.5, 1.5), vy: frand(-1.8, .2), t: 0, by, ghost: !!ghost }); if (FIRE_DROPS.length > 60) FIRE_DROPS.splice(0, FIRE_DROPS.length - 60); }
function firesOut() { FACE_FIRES.length = 0; FIRE_DROPS.length = 0; }
function tickFires() {
  for (let i = FIRE_DROPS.length - 1; i >= 0; i--) {
    const d = FIRE_DROPS[i]; d.px = d.x; d.py = d.y; d.vy = min(d.vy + .16, 5); d.x += d.vx; d.y += d.vy;
    if (G.time % 2 === 0) P(d.x, d.y, frand(-.2, .2), -.3, 14, fpick(['#ff7a2a', '#ffd35a', '#e2542b']), { glow: 1, g: -.02 });
    const tx = floor(d.x / T), ty = floor(d.y / T); if (liqAt(d.x, d.y) === 1 || ++d.t > 240) { FIRE_DROPS.splice(i, 1); continue; }
    if (solidAt(tx, ty) || platAt(tx, ty) && d.vy > 0) { FIRE_DROPS.splice(i, 1); lightFire(d.px, d.py, 8, 150, d.by, d.ghost); }
  }
  for (let i = FACE_FIRES.length - 1; i >= 0; i--) {
    const f = FACE_FIRES[i]; f.life -= wxWetAt(f.x, f.y) ? 3 : 1; if (f.life <= 0) { FACE_FIRES.splice(i, 1); continue; }
    // a flame whose rock has been dug away goes out
    if ((G.time + i) % 20 === 0) { f.pts = f.pts.filter(p => p.keep || solidAt(floor((p.x - p.nx * 2) / T), floor((p.y - p.ny * 2) / T)) || platAt(floor(p.x / T), floor((p.y + 2) / T))); if (!f.pts.length) { FACE_FIRES.splice(i, 1); continue; } }
    if (near(f)) {
      if (G.time % 3 === 0) { const p = fpick(f.pts); P(p.x + frand(-2, 2) + p.nx * 2, p.y + (p.ny > 0 ? 3 : -frand(2, 7)), frand(-.25, .25) + p.nx * .2, frand(-1.1, -.5), frand(16, 34) | 0, fpick(['#ff7a2a', '#ffd35a', '#e2542b', '#fff1a8']), { glow: 1, g: -.014, fr: .97 }); }
      if (G.time % 14 === 0) { const p = fpick(f.pts); P(p.x, p.y - 12, frand(-.15, .15), -.45, 70, fpick(['#4a4450', '#5f5a69']), { g: -.004, fr: .99 }); }
      if (G.time % 50 === 0) sfx('fire', 300);
    }
    if (!f.ghost && G.time % 10 === 0) {
      const by = f.by, foes = by && by.fighter ? foesOf(by) : G.fighters.filter(q => (q.team === 'p' || wildOn() && q.brIn) && !q.remote);
      for (const e of foes) if (!e.dead && !e.noHit && e.x + e.w > f.x0 - 3 && e.x < f.x1 + 3 && e.y + e.h > f.y0 - 8 && e.y < f.y1 + 3 && f.pts.some(p => p.x > e.x - 4 && p.x < e.x + e.w + 4 && p.y > e.y - 3 && p.y < e.y + e.h + 5)) applyStatus(e, 'burn', by, { d: 120 });
    }
  }
}
function fireLights(cx, cy) {
  for (const f of FACE_FIRES) { if (f.x1 < cx - 60 || f.x0 > cx + VS.vw + 60 || f.y1 < cy - 60 || f.y0 > cy + VS.vh + 60) continue; const k = min(1, f.life / 50) * (.86 + .14 * sin(G.time * .23 + f.x)); for (let i = 0; i < f.pts.length; i += 4) { const p = f.pts[i]; addLight(p.x + p.nx * 4, p.y + p.ny * 4, .95 * k, .5 * k, .16 * k); } }
  for (const d of FIRE_DROPS) addLight(d.x, d.y, .7, .35, .1);
}
// c is in world units; glow draws the soft light around the flames instead of the flames themselves
function drawFires(c, cx, cy, glow) {
  if (!FACE_FIRES.length && !FIRE_DROPS.length) return; if (!FLAME) buildFlames();
  const t = G.time;
  for (const f of FACE_FIRES) {
    if (f.x1 < cx - 20 || f.x0 > cx + VS.vw + 20 || f.y1 < cy - 24 || f.y0 > cy + VS.vh + 24) continue;
    const up = min(1, (f.max - f.life) / 14 + .15), dn = min(1, f.life / 55);
    if (glow) { c.fillStyle = '#ff7a2a'; for (const p of f.pts) { const g = 5 + 3 * p.s; c.globalAlpha = .07 * dn * up; c.fillRect(round(p.x + p.nx * 3 - g), round(p.y + p.ny * 4 - g), round(g * 2), round(g * 2)); } c.globalAlpha = 1; continue; }
    for (let i = 0; i < f.pts.length; i++) {
      const p = f.pts[i], vis = p.s * up * dn * (.86 + .2 * sin(t * .11 + p.ph * 40)); if (vis < .12) continue;
      const k = vis > .72 ? 2 : vis > .42 ? 1 : 0, fr = FLAME[k][floor(t * (.42 + p.ph * .2) + p.ph * 97 + i * 5) % FLAME_N], [w, h] = FLAME_DIM[k], H = max(3, h * (.55 + .45 * vis)), lean = sin(t * .09 + p.ph * 20) * .1;
      c.globalAlpha = min(1, dn * 1.4);
      c.save(); c.translate(p.x, p.y);
      if (p.ny < 0) c.transform(1, 0, -lean, 1, 0, 0); else if (p.ny > 0) { c.scale(1, -.62); c.transform(1, 0, lean, 1, 0, 0); } else { c.translate(p.nx, 1); c.transform(1, 0, -p.nx * .62 - lean, 1, 0, 0); }
      c.drawImage(fr, -w / 2, -H + 1, w, H); c.restore();
    }
    c.globalAlpha = 1;
  }
  if (!glow) for (const d of FIRE_DROPS) { c.fillStyle = '#ff7a2a'; c.fillRect(round(d.x) - 1, round(d.y) - 1, 3, 3); c.fillStyle = '#fff1a8'; c.fillRect(round(d.x), round(d.y), 1, 1); }
}
