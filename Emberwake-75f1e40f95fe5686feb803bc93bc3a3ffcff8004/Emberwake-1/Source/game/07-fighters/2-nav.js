// ============================================================
//  FINDING THE WAY. Every fighter the computer runs (the echoes
//  of the Trials, the Hollow Ones, rivals and duelists) asks this
//  file how to get somewhere, and is given the keys to press.
//
//  The land is searched tile by tile the way a body really moves:
//  it walks, steps up one tile, leaps (a leap has only so much
//  rise in it: four tiles, eight with the second jump), falls,
//  drops through rope bridges, swims, and rides an updraft. Fire
//  is never crossed; ground the ashfall has taken costs dear.
//
//  A search looks at a window of the land around the fighter and
//  stops after a fixed amount of work. If the goal is further off
//  than that, the route leads as near as the search came, and is
//  planned again from there. Only one search runs in any one
//  tick, however many fighters are asking.
// ============================================================
// the window (in tiles), the manners of being in a cell, the work one search may do, the longest route kept
const NAV_W = 96, NAV_H = 64, NAV_S = 14, NAV_MAX = 2500, NAV_LEN = 240;
// a manner: 0 = at rest (standing, or swimming); 1..8 = rising, with that many tiles of rise left in the leap;
// 9 = at the top of a leap or just off an edge; 10..13 = fallen one, two, three, four or more tiles
const NAV = {
  gen: 0, x0: 0, y0: 0, tx: -1, ty: -1, J: 4, L: -1e9, R: 1e9, floor: 1e9, low: false, t: -1, q: [], n: 0, hn: 0, vn: 0, ax: 0, ay: 0,
  g: new Float32Array(NAV_W * NAV_H * NAV_S), par: new Int32Array(NAV_W * NAV_H * NAV_S), seen: new Uint32Array(NAV_W * NAV_H * NAV_S), done: new Uint32Array(NAV_W * NAV_H * NAV_S), com: new Uint8Array(NAV_W * NAV_H * NAV_S),
  ci: new Uint8Array(NAV_W * NAV_H), cs: new Uint32Array(NAV_W * NAV_H), hi: new Int32Array(1 << 15), hf: new Float32Array(1 << 15), vent: new Int16Array(24)
};
// what a tile is to a body: 0 open, 1 a wall, 2 a rope bridge (stood on, passed through), 3 water, 4 fire, or the pit under the world
const navK = (x, y) => { if (x < 0 || x >= WW) return 1; if (y >= WH - 2) return 4; if (y < 0) return 0; const p = TP[tiles[y * WW + x]]; return p.solid ? 1 : p.plat ? 2 : p.liquid === 2 ? 4 : p.liquid ? 3 : 0; };
// a body is three tiles tall: it fits where none of the three is wall or fire
const navFit = (x, y) => { const a = navK(x, y), b = navK(x, y - 1), c = navK(x, y - 2); return a !== 1 && a !== 4 && b !== 1 && b !== 4 && c !== 1 && c !== 4; };
const navFirm = (x, y) => { const b = navK(x, y + 1); return b === 1 || b === 2; };
// what is known of a cell of the window, worked out once in each search:
// 1 a body fits, 2 there is something to stand on, 4 its feet are in water, 8 it stands on a rope bridge, 16 the ashfall has it, 32 an updraft
function navCell(c) {
  const N = NAV; if (N.cs[c] === N.gen) return N.ci[c];
  const x = N.x0 + c % NAV_W, y = N.y0 + ((c / NAV_W) | 0); let v = 0;
  if (navFit(x, y) && (N.low || (y + 1) * T <= N.floor)) {
    v = 1; const b = navK(x, y + 1); if (b === 1 || b === 2) v |= 2; if (b === 2) v |= 8; if (navK(x, y) === 3) v |= 4;
    if (x * T + 4 < N.L || x * T + 4 > N.R || (y + 1) * T > N.floor - 5 * T) v |= 16;
    for (let k = 0; k < N.vn; k += 3) if (abs(x - N.vent[k]) <= 1 && y >= N.vent[k + 1] && y < N.vent[k + 2]) v |= 32;
  }
  N.cs[c] = N.gen; return N.ci[c] = v;
}
const navAt = (x, y) => x < 0 || x >= NAV_W || y < 0 || y >= NAV_H ? 0 : navCell(y * NAV_W + x);
// the list of what to look at next, cheapest first
function navPush(i, f) { const N = NAV, H = N.hi, F = N.hf; let k = N.hn; if (k >= H.length) return; N.hn++; while (k > 0) { const p = (k - 1) >> 1; if (F[p] <= f) break; H[k] = H[p]; F[k] = F[p]; k = p; } H[k] = i; F[k] = f; }
function navPop() {
  const N = NAV, H = N.hi, F = N.hf, top = H[0], n = --N.hn;
  if (n > 0) { const i = H[n], f = F[n]; let k = 0; for (;;) { let c = 2 * k + 1; if (c >= n) break; if (c + 1 < n && F[c + 1] < F[c]) c++; if (F[c] >= f) break; H[k] = H[c]; F[k] = F[c]; k = c; } H[k] = i; F[k] = f; }
  return top;
}
function navOpen(from, g, i, x, y, m) {
  const N = NAV; if (N.done[i] === N.gen || (N.seen[i] === N.gen && N.g[i] <= g)) return;
  N.seen[i] = N.gen; N.g[i] = g; N.par[i] = from; N.com[i] = m; navPush(i, N.tx < 0 ? g : g + 12 * max(abs(x - N.tx), abs(y - N.ty)));
}
// One move into the cell (x, y) in manner s. Water is slow going; whatever comes down on something to stand on comes to rest
// there; a body rising through a rope bridge may settle on it or go on up. What cannot be undone is remembered along the
// way (m: 128 once it has gone into water or dropped further than it could leap back, and below that the tiles fallen so far)
function navStep(from, g, x, y, s, cost, up) {
  if (x < 0 || x >= NAV_W || y < 0 || y >= NAV_H) return; const N = NAV, c = y * NAV_W + x, v = navCell(c); if (!(v & 1)) return;
  g += (v & 4 ? cost * 3 : cost) + (v & 16 ? 40 : 0);
  let m = N.com[from]; const n = s >= 10 ? min((m & 127) + 1, 127) : 0; m &= 128;
  if (v & 4) { if (!(navCell((from - from % NAV_S) / NAV_S) & 4)) m = 128; s = 0; }
  else if (s && (v & 2)) { if (!up) { s = 0; if (n > N.J) m = 128; } else if (v & 8) navOpen(from, g, c * NAV_S, x, y, m); }
  navOpen(from, g, c * NAV_S + s, x, y, s >= 10 ? m | n : m);
}
// One search from the cell (sx, sy). With a goal it makes for the goal and returns the end of the route; or, if it did not
// get there, of the route to the nearest place it found without doing anything that cannot be undone (nobody jumps into a
// pool on the chance that there is a way out). With no goal (tx < 0) it spreads evenly, to learn what can be reached at
// all: navCost reads the answer.
// o = { L, R: the ashfall's walls in pixels (ground outside them costs dear), floor: the slag's height (nothing is planned under it) }
function navSearch(sx, sy, tx, ty, J, o, lim) {
  const N = NAV; N.gen++; N.J = J; N.hn = 0; N.n = 0; N.L = o && o.L !== undefined ? o.L : -1e9; N.R = o && o.R !== undefined ? o.R : 1e9; N.floor = o && o.floor !== undefined ? o.floor : 1e9;
  N.x0 = clamp(sx - (NAV_W >> 1) + (tx < 0 ? 0 : clamp(tx - sx, -40, 40)), 0, max(0, WW - NAV_W)); N.y0 = clamp(sy - (NAV_H >> 1) + (tx < 0 ? 0 : clamp(ty - sy, -24, 24)), 0, max(0, WH - NAV_H));
  // someone already under the slag may wade out through it; nobody else plans a step below its line
  N.low = (sy + 1) * T > N.floor; N.tx = tx < 0 ? -1 : tx - N.x0; N.ty = ty - N.y0;
  N.vn = 0; for (const v of VENTS) if (N.vn < 24 && v.x >= N.x0 - 1 && v.x <= N.x0 + NAV_W) { N.vent[N.vn] = v.x - N.x0; N.vent[N.vn + 1] = v.top - N.y0; N.vent[N.vn + 2] = v.gy - N.y0; N.vn += 3; }
  const x0 = sx - N.x0, y0 = sy - N.y0; if (x0 < 0 || x0 >= NAV_W || y0 < 0 || y0 >= NAV_H) return -1;
  const start = (y0 * NAV_W + x0) * NAV_S; N.g[start] = 0; N.par[start] = -1; N.com[start] = 0; N.seen[start] = N.gen; navPush(start, 0);
  let best = -1, bh = 1e9, n = 0;
  while (N.hn > 0 && n < lim) {
    const i = navPop(); if (N.done[i] === N.gen) continue; N.done[i] = N.gen; n++;
    // (wherever it starts from on dry land counts as standing, even with its heels over an edge)
    const s = i % NAV_S, c = (i - s) / NAV_S, x = c % NAV_W, y = (c / NAV_W) | 0, v = i !== start ? navCell(c) : navCell(c) & 4 ? navCell(c) | 1 : navCell(c) | 3, g = N.g[i];
    if (!s && tx >= 0) { const h = max(abs(x - N.tx), abs(y - N.ty)); if (h < bh && (!h || N.com[i] < 128)) { bh = h; best = i; if (!h) break; } }
    if (!s) {
      if (v & 4) {
        // in the water: swim any way, and climb out over a bank no more than a tile above it
        const top = !(navAt(x, y - 1) & 4);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue; const d = navAt(x + dx, y + dy); if (!(d & 1) || (dx && dy && !((navAt(x + dx, y) & 1) && (navAt(x, y + dy) & 1)))) continue;
          if (d & 4) navStep(i, g, x + dx, y + dy, 0, dx && dy ? 14 : 10); else if (top && dy <= 0 && (d & 2)) navStep(i, g, x + dx, y + dy, 0, 30);
        }
        if (top && (navAt(x, y - 2) & 1)) for (let dx = -1; dx <= 1; dx += 2) if ((navAt(x + dx, y - 2) & 7) === 3) navStep(i, g, x + dx, y - 2, 0, 44);
      }
      if (v & 2) {
        for (let dx = -1; dx <= 1; dx += 2) {
          // a step along the ground, off an edge, or up a rise of one tile
          const d = navAt(x + dx, y);
          if (d & 1) navStep(i, g, x + dx, y, d & 6 ? 0 : 9, 10); else if ((navAt(x + dx, y - 1) & 3) === 3 && (navAt(x, y - 1) & 1)) navStep(i, g, x + dx, y - 1, 0, 12);
        }
        // a leap (not from deep water), and a drop through the rope bridge underfoot
        if (!(v & 4) || !(navAt(x, y - 1) & 4)) navOpen(i, g + 6, c * NAV_S + J, x, y, N.com[i] & 128);
        if (v & 8) navStep(i, g, x, y + 1, 10, 24);
      }
      if (v & 32) navStep(i, g, x, y - 1, 9, 6, 1);
    } else if (s <= 8) {
      // rising: straight up or across, each spending a tile of the leap; up and across at once only every other tile
      // (a body climbs faster than it drifts, so a leap that slanted all the way up would promise too much)
      const s1 = s > 1 ? s - 1 : 9; navStep(i, g, x, y - 1, s1, 10, 1); if (v & 32) navStep(i, g, x, y - 1, s, 6, 1);
      for (let dx = -1; dx <= 1; dx += 2) if (navAt(x + dx, y) & 1) { navStep(i, g, x + dx, y, s1, 10); if (!(s & 1) && (navAt(x, y - 1) & 1)) navStep(i, g, x + dx, y - 1, s1, 13, 1); }
    } else {
      // falling: down, and for the first tiles of a fall a little sideways too (every other tile: a falling body drifts slower than it drops)
      const s1 = s < 13 ? s + 1 : 13; navStep(i, g, x, y + 1, s1, 8); if (v & 32) navStep(i, g, x, y - 1, 9, 6, 1);
      if ((s === 9 || s === 11) && (navAt(x, y + 1) & 1)) for (let dx = -1; dx <= 1; dx += 2) if (navAt(x + dx, y) & 1) navStep(i, g, x + dx, y + 1, s1, 11);
      // (at the very top of a leap there is a moment to step across, onto the wall it has just cleared)
      if (s === 9) for (let dx = -1; dx <= 1; dx += 2) navStep(i, g, x + dx, y, 10, 10);
    }
  }
  N.n = n; return best;
}
// write the route that ends in state e into a fighter's own list: for each cell it passes through, x, y and the manner
function navTrace(nv, e) {
  const N = NAV, p = nv.p; let n = 0; for (let i = e; i >= 0; i = N.par[i]) n++;
  let k = n; for (let i = e; i >= 0; i = N.par[i]) { if (--k < NAV_LEN) { const s = i % NAV_S, c = (i - s) / NAV_S; p[k * 3] = N.x0 + c % NAV_W; p[k * 3 + 1] = N.y0 + ((c / NAV_W) | 0); p[k * 3 + 2] = s; } }
  // (a route too long for the list is cut where it stands on the ground)
  n = min(n, NAV_LEN); while (n > 1 && p[n * 3 - 1]) n--; nv.n = n;
}
// the cell a goal in pixels means: the nearest place by it where a body can stand (the ground under it first, then above;
// a foe at the top of a leap is met where it will come down)
function navAim(gx, gy, by) {
  const N = NAV, tx = clamp(floor(gx / T), 1, WW - 2); let ty = gy === undefined ? (heights[tx] || by + 1) - 1 : floor((gy - 1) / T);
  for (let k = 0; k < 24; k++) { const y = ty + (k < 18 ? k : 17 - k); if (navFit(tx, y) && (navFirm(tx, y) || navK(tx, y) === 3)) { ty = y; break; } }
  N.ax = tx; N.ay = ty;
}
// whose turn it is to search: one fighter in each tick, in the order they asked
function navAsk(f, nv) {
  const Q = NAV.q; nv.ask = G.time; if (!Q.includes(f)) Q.push(f);
  while (Q.length && Q[0] !== f && (Q[0].dead || Q[0].gone || !Q[0].ai || !Q[0].ai.nav || G.time - Q[0].ai.nav.ask > 20)) Q.shift();
  if (Q[0] !== f || NAV.t === G.time) return false; Q.shift(); NAV.t = G.time; return true;
}
// what a fighter remembers of its route (kept in its brain, never sent to anyone: whoever runs the fighter plans for it)
function navOf(f) { return f.ai.nav || (f.ai.nav = { p: new Int16Array(NAV_LEN * 3), n: 0, i: 0, k: 0, tx: -99, ty: -99, at: -1e9, still: 0, fail: 0, bd: 1e9, ask: 0, off: false, leg: -1, up: false, dead: -1e9, rx: -99, ry: -99, rt: -1e9, rc: -1, air: 0, out: 0, now: 0 }); }
// how far it can still drift before its feet come down to the height y, if it lets go of the jump now
function navFly(f, y) { let fy = f.y + f.h, vy = max(f.vy, -1.7), t = 0; while (t < 120 && (vy < 0 || fy < y)) { vy = min(vy + .26, 6.4); fy += vy; t++; } return t * 1.3; }

// THE WAY THERE. Sets the keys in I (md, jumpP, jumpH, down) that carry f toward the point (gx, gy) in pixels, where gy is
// the height of the ground to stand on (left out: the open ground at gx). Returns 'go' while it is on its way, 'arrived'
// when it stands there, and 'stuck' when there is no way, or the way has failed twice: the caller should want something else.
function navTo(f, I, gx, gy, o) {
  const nv = navOf(f), cx = f.x + 3, fb = f.y + f.h, bx = floor(cx / T), by = floor((fb - 1) / T), wet = liqAt(cx, fb - 5) === 1, firm = f.onGround || wet;
  navAim(gx, gy, by); const tx = NAV.ax, ty = NAV.ay, moved = abs(tx - nv.tx) > 3 || abs(ty - nv.ty) > 3;
  I.jumpH = false; I.down = false;
  // (asked again after doing something else for a while, a fight say: the time it stood still then was not time lost on the way)
  if (G.time - nv.now > 2) { nv.still = 0; nv.leg = -1; } nv.now = G.time;
  if (bx === tx && by === ty && firm) { nv.n = 0; nv.fail = 0; nv.still = 0; I.md = abs(gx - cx) < 3 ? 0 : sign(gx - cx); return 'arrived'; }
  // hanging in the air, neither rising nor falling, for longer than the top of any leap lasts: an updraft has it that the
  // route never asked for. It goes out of it sideways, one way (the other if a wall is there), until its feet are down again
  if (firm) nv.air = nv.out = 0; else if (abs(f.vy) > 1.5) nv.air = 0; else if (++nv.air > 40 && !nv.out) nv.out = sign(gx - cx) || 1;
  if (nv.out) { if (f.hitWall) nv.out = -nv.out; I.md = nv.out; return 'go'; }
  if (!moved && nv.dead > G.time) return 'stuck';
  if (moved) { nv.fail = 0; nv.still = 0; nv.bd = 1e9; }
  const p = nv.p;
  if (nv.n < 2) nv.leg = -1;
  else if (firm) {
    // where on the route it stands now
    let k = -1; for (let j = nv.i, e = min(nv.n, j + 16); j < e; j++) if (!p[j * 3 + 2] && p[j * 3] === bx && p[j * 3 + 1] === by) k = j;
    // a leap that came down where it began, or somewhere else altogether, has failed; so has standing about getting nowhere
    if (nv.leg >= 0) { if (k <= nv.leg) { nv.fail++; nv.off = true; } nv.leg = -1; }
    if (k > nv.i) { nv.still = 0; nv.i = k; const d = max(abs(bx - tx), abs(by - ty)); if (d < nv.bd - 1) { nv.bd = d; nv.fail = 0; } }
    else if (k < 0 && (abs(bx - p[nv.i * 3]) > 1 || abs(by - p[nv.i * 3 + 1]) > 1)) nv.off = true;
    if (++nv.still > 45) { nv.still = 0; nv.fail++; nv.off = true; }
  }
  // plan when there is no route, the goal has moved, the route is old or has run out, or it has strayed or failed
  if (nv.fail < 2 && (nv.n < 2 || moved || nv.off || nv.i >= nv.n - 1 || G.time - nv.at > 240) && firm && navAsk(f, nv)) {
    const e = navSearch(bx, by, tx, ty, canDbl(f) ? 8 : 4, o, NAV_MAX);
    nv.tx = tx; nv.ty = ty; nv.at = G.time; nv.i = 0; nv.off = false; nv.still = 0; nv.leg = -1; navTrace(nv, e); if (nv.n < 2) nv.fail++;
  }
  // twice failed with nothing gained: there is no way, for now
  if (nv.fail >= 2) { nv.fail = 0; nv.n = 0; nv.dead = G.time + 150; return 'stuck'; }
  const i = nv.i;
  if (nv.n < 2 || nv.off || i >= nv.n - 1) { I.md = firm ? 0 : sign(gx - cx); return 'go'; }
  const ax = p[i * 3], ay = p[i * 3 + 1], nx = p[i * 3 + 3], ny = p[i * 3 + 4], ns = p[i * 3 + 5];
  if (!ns) {
    // a step along the ground, or a stroke through the water: up for air, and a kick at the surface to climb out
    // (lifted off its feet on the way, it carries on the way the route goes: turning back for the spot would hang it there)
    I.md = (firm ? 0 : sign(nx - ax)) || sign(nx * T + 4 - cx) || 1;
    if (navK(ax, ay) === 3 && navK(nx, ny) !== 3) { I.jumpH = true; if (wet && !liqAt(cx, f.y + 2)) I.jumpP = true; }
    else if (wet) I.jumpH = fb > (ny + 1) * T - 4;
    return 'go';
  }
  // a leap or a fall: where it comes down, and the highest it has to go on the way
  let L = i + 1, top = ay; while (L < nv.n - 1 && p[L * 3 + 2]) { top = min(top, p[L * 3 + 1]); L++; } top = min(top, p[L * 3 + 1]);
  const lx = p[L * 3] * T + 4, ly = (p[L * 3 + 1] + 1) * T, leap = ns <= 8;
  if (f.onGround) {
    nv.k = i + 1; nv.up = false;
    // off an edge, down through a rope bridge (hold down), or up on an updraft (stand in it)
    if (!leap) { I.md = sign(nx - ax); I.down = nx === ax && ny > ay; return 'go'; }
    // a leap over a drop starts from the very lip, at a run; any other starts where it stands
    let d = 0; for (let j = i + 2; j <= L && !d; j++) d = sign(p[j * 3] - ax);
    const lip = d && navFit(ax + d, ay) && !navFirm(ax + d, ay), off = ax * T + 4 - cx;
    I.md = d || (abs(off) > 2 ? sign(off) : 0);
    if (!lip || (d > 0 ? f.x + f.w >= (ax + 1) * T - 2 : f.x <= ax * T + 2)) I.jumpP = I.jumpH = true;
    return 'go';
  }
  // in the air: steer by the cells of the route in turn, as each is passed
  if (nv.leg < 0) nv.leg = i;
  let k = max(nv.k, i + 1);
  while (k < L) { const x = p[k * 3], y = p[k * 3 + 1], px = p[k * 3 - 3], py = p[k * 3 - 2]; if (y < py ? by <= y : y > py ? by >= y : x === px || (x - px) * (cx - x * T - 4) >= -3) k++; else break; }
  nv.k = k;
  const dx = p[k * 3] * T + 4 - cx, dl = lx - cx;
  if (k < L) I.md = abs(dx) > 2 ? sign(dx) : sign(p[k * 3 + 3] - p[k * 3]);
  // (coming down, it slows to land on the spot: the place may be one tile wide)
  else { const want = clamp(dl * .14, -1.45, 1.45); I.md = abs(want - f.vx) < .15 ? 0 : sign(want - f.vx); }
  // the jump is held only until the leap is high enough and long enough; the second jump is for a leap that is falling short
  if (fb <= (top + 1) * T - 3) nv.up = true;
  const short = navFly(f, ly) < abs(dl) - 3;
  I.jumpH = (leap && !nv.up) || short;
  if (leap && f.coyote > 0 && f.vy >= 0) I.jumpP = true;
  else if (f.vy > -.4 && f.coyote <= 0 && !f.dblUsed && canDbl(f) && ((leap && !nv.up) || short)) I.jumpP = I.jumpH = true;
  I.down = !leap && nx === ax && ny > ay && fb < (ay + 1) * T + 2;
  return 'go';
}
// how long the way to a place is, in ticks of travel. Infinity: there is no way at all. -1: no time to look just now.
// (The answer is kept for a few seconds, so asking again is free.)
function navReach(f, gx, gy, o) {
  const nv = navOf(f), cx = f.x + 3, by = floor((f.y + f.h - 1) / T); navAim(gx, gy, by); const tx = NAV.ax, ty = NAV.ay;
  if (abs(tx - nv.rx) <= 3 && abs(ty - nv.ry) <= 3 && G.time - nv.rt < 200) return nv.rc;
  if (!(f.onGround || liqAt(cx, f.y + f.h - 5) === 1) || !navAsk(f, nv)) return -1;
  const e = navSearch(floor(cx / T), by, tx, ty, canDbl(f) ? 8 : 4, o, NAV_MAX), N = NAV; let c = Infinity;
  // (a route that ran out of window or of work: what was found, and the rest of the way as the crow flies, half as long again)
  if (e >= 0 && N.par[e] >= 0) { const s = (e - e % NAV_S) / NAV_S, x = s % NAV_W, y = (s / NAV_W) | 0; c = (N.g[e] + 15 * max(abs(x - N.tx), abs(y - N.ty))) * .55; }
  nv.rx = tx; nv.ry = ty; nv.rt = G.time; return nv.rc = c;
}
// look all round from where it stands (this is its search for the tick); false when it is not its turn
function navFlood(f, o) {
  const nv = navOf(f), cx = f.x + 3; if (!(f.onGround || liqAt(cx, f.y + f.h - 5) === 1) || !navAsk(f, nv)) return false;
  navSearch(floor(cx / T), floor((f.y + f.h - 1) / T), -1, 0, canDbl(f) ? 8 : 4, o, NAV_MAX * 2); return true;
}
// after navFlood: what it costs to go and stand at a place (ten for each tile walked). Infinity: it cannot be reached.
// -1: too far off to tell
function navCost(gx, gy) {
  const N = NAV; navAim(gx, gy, 0); const x = N.ax - N.x0, y = N.ay - N.y0; if (x < 0 || x >= NAV_W || y < 0 || y >= NAV_H) return -1;
  const i = (y * NAV_W + x) * NAV_S; return N.done[i] === N.gen ? N.g[i] : N.n < NAV_MAX * 2 ? Infinity : -1;
}
