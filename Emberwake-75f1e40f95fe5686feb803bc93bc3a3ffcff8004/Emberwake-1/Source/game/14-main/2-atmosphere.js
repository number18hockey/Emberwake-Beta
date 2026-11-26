// ============================================================
//  Atmosphere: what the air does to the picture.
//    BLOOM     everything that gives off light (fires, pods, embers,
//              a blade in mid-swing) bleeds a soft glow
//    GRADING   each land, each mood of a land, each season and each
//              kind of weather tints the whole view a little
//    MIST      lies in the low ground at dawn where the world has it
//    THE SKY   every world has its own stars and its own two
//              constellations; stars fall; a second moon where the
//              world has one; the sun throws rays when it is low
//    THE WAKE  the Waker trails embers at a run, brighter in tempo
//    TRAILS    a blow in time leaves a gold arc, a crisp one a white
//              one, a rushed one a dull one
//    THE KICK  the view jolts the way a blow lands
//  All of it is drawing only (nothing here changes the game), and
//  FX: PLAIN in the menu turns the costly parts off.
// ============================================================
const FX = () => SETTINGS.fx !== 'plain';

// ---------------- bloom: the emissive layer, blurred and added back into itself ----------------
// (done at the art's own resolution, before that layer goes to the screen: the glow sits on the pixel grid like everything else,
//  and it costs three small copies instead of a full-screen pass)
let BLM = null;
function bloomPass(f, src) {
  if (!FX()) return; const w = src.width, h = src.height;
  if (!BLM || BLM.w !== w || BLM.h !== h) { BLM = { w, h, a: mk(ceil(w / 2), ceil(h / 2)), b: mk(ceil(w / 4), ceil(h / 4)), d: mk(ceil(w / 8), ceil(h / 8)) }; for (const k of ['a', 'b', 'd']) { BLM[k][1].imageSmoothingEnabled = true; BLM[k][1].imageSmoothingQuality = 'medium'; } }
  const down = (dst, from, fw, fh) => { const x = dst[1]; x.globalCompositeOperation = 'copy'; x.drawImage(from, 0, 0, fw, fh, 0, 0, fw / 2, fh / 2); };
  down(BLM.a, src, w, h); down(BLM.b, BLM.a[0], w / 2, h / 2); down(BLM.d, BLM.b[0], w / 4, h / 4);
  const dark = .55 + .45 * max(1 - G.dn, G.underK || 0);   // glow shows most at night and underground
  f.save(); f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = 'lighter'; f.imageSmoothingEnabled = true; f.imageSmoothingQuality = 'medium';
  f.globalAlpha = .46 * dark; f.drawImage(BLM.b[0], 0, 0, w / 4, h / 4, 0, 0, w, h);
  f.globalAlpha = .38 * dark; f.drawImage(BLM.d[0], 0, 0, w / 8, h / 8, 0, 0, w, h);
  f.restore(); f.imageSmoothingEnabled = false;
}

// ---------------- grading: the colour of the air ----------------
const BIOTINT = { moor: [255, 150, 120, .05], mosswood: [120, 215, 140, .05], willowmere: [140, 215, 195, .06], thorn: [120, 220, 150, .05], reach: [150, 220, 255, .08], fen: [110, 200, 160, .07], dunes: [255, 225, 150, .07], scoria: [255, 140, 90, .07], ash: [190, 180, 215, .08], village: [255, 190, 130, .05], ring: [255, 140, 90, .06] };
const ATM = { r: 255, g: 255, b: 255, a: 0, mist: 0, wake: 0, t: -1 };
// what the air should look like here and now: [r, g, b, strength]
function airTarget() {
  let r = 0, g = 0, b = 0, a = 0; const add = (c, k = 1) => { const w = c[3] * k; if (w <= 0) return; r += c[0] * w; g += c[1] * w; b += c[2] * w; a += w; };
  const p = G.p, up = 1 - (G.underK || 0), dk = 1 - G.dn, edge = sin(clamp(G.dn, 0, 1) * PI);
  if (DIM || (WORLD.arena && !WORLD.royale)) { add([255, 160, 110, .04]); return [r / a, g / a, b / a, a]; }
  const tx = p ? floor((p.x + 3) / T) : X0, bio = WORLD.royale ? brBio(tx) : G.biome;
  if (BIOTINT[bio]) add(BIOTINT[bio], up);
  if (WORLD.royale && !BR.wild) add(BR.arena === 1 ? [255, 104, 64, .09] : [205, 190, 230, .06]);   // the Trials: each arena has its own air
  if (!WORLD.arena) { const M = MOODS[bio] ? moodOf(tx, bio) : MOOD0; if (M.tint) add(M.tint, up * 1.3); if (seasonOn()) { const k = seasonBlend(); add(SEASON().tint, up * (1 - k)); add(SEASONS[(seasonI() + 1) % 4].tint, up * k); } }
  add([110, 140, 195, .11], wxA('rain') * up); add([205, 225, 255, .08], wxA('snow') * up);
  add([70, 95, 200, .1], dk * up * (wt('twomoons') ? 1.3 : 1)); add(wt('embersky') ? [255, 80, 40, .15] : [255, 150, 90, .07], edge * up);
  add([95, 120, 210, .07], (G.underK || 0) * (1 - (G.deepK || 0))); add([255, 90, 60, .09], G.deepK || 0);
  return a > 0 ? [r / a, g / a, b / a, min(.26, a)] : [255, 255, 255, 0];
}
// how thick the morning mist is (0 to 1)
function mistTarget() {
  if (DIM || WORLD.arena || G.state === 'title') return 0; const c = G.clock, dawn = c > .93 ? (c - .93) / .07 : c < .2 ? 1 - c / .2 : 0, up = 1 - (G.underK || 0);
  return clamp(dawn * ((wt('mist') ? .85 : 0) + (G.biome === 'fen' ? .5 : G.biome === 'willowmere' ? .35 : 0) + (seasonOn() && SEASON().k === 'kindling' ? .2 : 0)), 0, 1) * up;
}
function atmoTick() {
  const A = ATM, t = airTarget(), k = A.t < 0 || G.time - A.t > 30 || G.time < A.t ? 1 : .025; A.t = G.time;
  A.r = lerp(A.r, t[0], k); A.g = lerp(A.g, t[1], k); A.b = lerp(A.b, t[2], k); A.a = lerp(A.a, t[3], k); A.mist = lerp(A.mist, mistTarget(), k === 1 ? 1 : .01);
  const K = G.kick; if (K) { K.x *= .74; K.y *= .74; if (abs(K.x) + abs(K.y) < .05) G.kick = null; }
  wakeTick(); skyTick();
}
function gradePass(c, W, H, cx, cy) {
  if (!FX()) return; const A = ATM, S = VS.s;
  if (A.a > .004) { c.globalCompositeOperation = 'soft-light'; c.fillStyle = `rgba(${A.r | 0},${A.g | 0},${A.b | 0},${min(.6, A.a * 2.3).toFixed(3)})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
  if (A.mist > .02 && VEILS.length) {
    // bands of mist drifting over the ground line, thickest in the hollows
    const tx = clamp(floor((cx + VS.vw / 2) / T), 0, WW - 1), gy = ((heights[tx] || BASE_Y) * T - cy) * S; c.imageSmoothingEnabled = true;
    for (let k = 0; k < 4; k++) { const sp = VEILS[k % VEILS.length], w = sp.width * S * 7, h = sp.height * S * (5 + k * 2), span = W + w, x = (((k * 371 + G.time * (.12 + k * .05) * S - cx * (.5 + k * .12) * S) % span) + span) % span - w; c.globalAlpha = A.mist * (.34 - k * .05); c.drawImage(sp, x, gy - h * (.75 - k * .16), w, h); c.drawImage(sp, x - span * .52, gy - h * (.6 - k * .12) + S * 6, w, h); }
    c.globalAlpha = A.mist * .1; c.fillStyle = '#dfe8f4'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; c.imageSmoothingEnabled = false;
  }
}

// ---------------- the sky of this world ----------------
let SKYKEY = '', SKYSTARS = [], SKYCON = [], MOON2 = null; const SHOOT = [];
const STARCOL = ['#ffffff', '#ffffff', '#c9fff6', '#fff1a8', '#ffc2a0', '#b4c8ff'];
function skyBuild() {
  const key = SEED + ':' + (wt('starlit') ? 1 : 0); if (key === SKYKEY) return; SKYKEY = key;
  const R = mulberry32((SEED ^ 0x5bd1e995) >>> 0), n = wt('starlit') ? 300 : 150; SKYSTARS = []; SKYCON = [];
  for (let i = 0; i < n; i++) SKYSTARS.push([R(), R() * .78, R() * TAU, R() < .16 ? 2 : 1, floor(R() * STARCOL.length), R() < .045 ? 1 : 0]);
  // two constellations: a short crooked chain of bright stars each, different in every world
  for (let q = 0; q < 2; q++) { let x = .12 + R() * .76, y = .1 + R() * .42, an = R() * TAU; const pts = [[x, y]]; for (let i = 0, m = 4 + floor(R() * 3); i < m; i++) { an += (R() - .5) * 2.1; const d = .035 + R() * .04; x = clamp(x + cos(an) * d, .03, .97); y = clamp(y + sin(an) * d * 1.5, .04, .66); pts.push([x, y]); } SKYCON.push(pts); }
  if (!MOON2 && SHARDMOON) { const [m, x] = mk(SHARDMOON.width, SHARDMOON.height); x.drawImage(SHARDMOON, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(80,220,200,.5)'; x.fillRect(0, 0, m.width, m.height); MOON2 = m; }
}
function skyTick() {
  for (let i = SHOOT.length - 1; i >= 0; i--) { const s = SHOOT[i]; s.x += s.vx; s.y += s.vy; if (--s.life <= 0) SHOOT.splice(i, 1); }
  if (G.dn < .28 && !DIM && SHOOT.length < 3 && Math.random() < (wt('starlit') ? .014 : .0035)) { const d = Math.random() < .5 ? 1 : -1; SHOOT.push({ x: Math.random(), y: Math.random() * .4, vx: d * (.006 + Math.random() * .008), vy: .003 + Math.random() * .004, life: 22 + floor(Math.random() * 16), max: 38 }); }
}
// the colours of the sky bend with the season, the weather and the world
function skyTone(top, bot, dn) {
  if (DIM || WORLD.arena) return; const edge = sin(clamp(dn, 0, 1) * PI), mixIn = (a, c, k) => { a[0] = lerp(a[0], c[0], k); a[1] = lerp(a[1], c[1], k); a[2] = lerp(a[2], c[2], k); };
  if (wt('embersky')) { mixIn(bot, [255, 92, 44], .42 * edge); mixIn(top, [116, 30, 44], .3 * edge); mixIn(bot, [250, 200, 170], .12 * dn); }
  if (wt('twomoons')) mixIn(top, [10, 26, 54], .5 * (1 - dn));
  if (seasonOn()) { const k = SEASON().k; if (k === 'ashrest') { mixIn(top, [150, 172, 204], .28 * dn); mixIn(bot, [226, 232, 244], .3 * dn); } else if (k === 'emberfall') mixIn(bot, [255, 196, 140], .3 * dn); else if (k === 'kindling') mixIn(top, [96, 170, 200], .2 * dn); }
  const r = wxA('rain'), s = wxA('snow'); if (r > 0) { mixIn(top, [58, 66, 88], .62 * r); mixIn(bot, [112, 120, 142], .6 * r); } if (s > 0) { mixIn(top, [140, 150, 172], .45 * s); mixIn(bot, [214, 220, 232], .45 * s); }
}
function skyStars(c, W, H, S, dn, cx) {
  skyBuild(); const a = (.7 - dn) / .7, px = max(1, S - 1), off = cx * .006 * S;
  if (dn < .3) { c.strokeStyle = '#c9d6ff'; c.lineWidth = 1; c.globalAlpha = (.3 - dn) / .3 * .16; for (const pts of SKYCON) { c.beginPath(); pts.forEach((p, i) => { const x = ((p[0] * W - off) % W + W) % W, y = p[1] * H; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke(); } }
  for (const s of SKYSTARS) {
    const x = floor(((s[0] * W - off) % W + W) % W), y = floor(s[1] * H), tw = .45 + .55 * sin(G.time * (s[5] ? .05 : .03) + s[2]); c.globalAlpha = a * tw; c.fillStyle = STARCOL[s[4]]; c.fillRect(x, y, s[3] * px, s[3] * px);
    if (s[5] && a > .5) { c.globalAlpha = a * tw * .55; c.fillRect(x - px * 2, y + (s[3] * px >> 1), px * (4 + s[3]), 1); c.fillRect(x + (s[3] * px >> 1), y - px * 2, 1, px * (4 + s[3])); }
  }
  if (dn < .3) for (const pts of SKYCON) for (const p of pts) { c.globalAlpha = a * .9; c.fillStyle = '#ffffff'; c.fillRect(floor(((p[0] * W - off) % W + W) % W) - px, floor(p[1] * H) - px, px * 2, px * 2); }
  for (const s of SHOOT) { const u = s.life / s.max, x = s.x * W, y = s.y * H; for (let i = 0; i < 9; i++) { c.globalAlpha = a * u * (1 - i / 9); c.fillStyle = i < 2 ? '#ffffff' : '#c9fff6'; c.fillRect(floor(x - s.vx * W * i * .55), floor(y - s.vy * H * i * .55), px + (i < 2 ? 1 : 0), px); } }
  c.globalAlpha = 1;
}
// rays from a low sun; a second, smaller moon where the world has one
function skyExtras(c, W, H, S, dn, t) {
  if (!FX()) return;
  if (t < .62) { const u = t / .62, low = max(0, 1 - sin(u * PI) * 2.2); if (low > .02) { const rx = W * (.08 + .84 * u), ry = H * .7 - sin(u * PI) * H * .52; c.globalCompositeOperation = 'lighter'; c.fillStyle = wt('embersky') ? '#ff6a3a' : '#ffb26a'; for (let k = 0; k < 9; k++) { const an = k * TAU / 9 + G.time * .0012, wd = .05 + .03 * sin(k * 2.7), L = W * (.34 + .16 * sin(k * 1.9 + G.time * .004)); c.globalAlpha = low * .055; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + cos(an - wd) * L, ry + sin(an - wd) * L); c.lineTo(rx + cos(an + wd) * L, ry + sin(an + wd) * L); c.fill(); } c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } }
  else if (wt('twomoons') && MOON2) { const u = ((t - .62) / .38 + .27) % 1, mx = W * (.1 + .8 * u), my = H * .58 - sin(u * PI) * H * .4, sc = S * .75; c.globalAlpha = .85; c.drawImage(MOON2, round(mx - MOON2.width * sc / 2), round(my), round(MOON2.width * sc), round(MOON2.height * sc)); c.globalAlpha = 1; }
}

// ---------------- the wake: embers behind the Waker at a run ----------------
function wakeTick() {
  const p = G.p; if (!p || p.dead || G.state !== 'play' || !FX()) { ATM.wake = 0; if (G.wake) G.wake.length = 0; return; }
  const sp = hypot(p.vx, p.vy), want = clamp((sp - 1.15) / 1.4, 0, 1) * (p.onBarge ? 0 : 1); ATM.wake = lerp(ATM.wake, want, want > ATM.wake ? .2 : .07);
  const Wk = G.wake || (G.wake = []); Wk.push(p.x + 3 - p.face, p.y + 9); if (Wk.length > 30) Wk.splice(0, 2);
  if (ATM.wake > .35 && G.time % (p.tempo >= 3 ? 2 : 4) === 0) P(p.x + 3 - p.face * 2 + frand(-1, 1), p.y + 9 + frand(-3, 3), -p.vx * .12 + frand(-.15, .15), frand(-.35, -.05), 20 + (p.tempo | 0) * 4, fpick(p.tempo >= 5 ? ['#ffffff', '#fff1a8'] : p.tempo >= 3 ? ['#ffd35a', '#fff1a8'] : ['#ff9a3d', '#ffd35a']), { g: -.004, fr: .96, glow: 1 });
}
function drawWake(f) {
  const Wk = G.wake, k = ATM.wake; if (!Wk || k < .04 || Wk.length < 6) return; const p = G.p, n = Wk.length / 2, col = p && p.tempo >= 5 ? '#fff1a8' : p && p.tempo >= 3 ? '#ffd35a' : '#ff9a3d';
  f.fillStyle = col;
  for (let i = 1; i < n; i++) { const x0 = Wk[i * 2 - 2], y0 = Wk[i * 2 - 1], x1 = Wk[i * 2], y1 = Wk[i * 2 + 1], d = hypot(x1 - x0, y1 - y0), m = max(1, ceil(d / 1.5)), u = i / n; if (d > 30) continue; f.globalAlpha = k * u * u * .6; for (let j = 0; j < m; j++) f.fillRect(round(lerp(x0, x1, j / m)) - (u > .6 ? 1 : 0), round(lerp(y0, y1, j / m)), u > .6 ? 2 : 1, u > .8 ? 2 : 1); }
  f.globalAlpha = 1;
}

// ---------------- trails that show the timing of the blow ----------------
// [outer, inner] colours for a swing made in time, crisp, as a crescendo, or rushed; null for a plain one
function tempoSty(a) {
  if (!a || !FX()) return null;
  if (a.rushed) return ['#5a5668', '#8a8794']; if (a.cresc) return ['#ff5a2a', '#ffffff']; if (a.perfect) return ['#4fd8c8', '#ffffff'];
  if (a.beat === 2) return ['#8ff5e6', '#ffffff']; if (a.beat === 1) return ['#ffb347', '#fff1a8']; return null;
}
// the view jolts the way a blow lands
function addKick(x, y) { if (!FX()) return; const K = G.kick || (G.kick = { x: 0, y: 0 }); K.x = clamp(K.x + x, -5, 5); K.y = clamp(K.y + y, -4, 4); }

// ---------------- the stalks through the year ----------------
const TOPC = new Map(), TOPTINT = { kindling: ['rgba(120,230,160,.22)', 0], emberfall: ['rgba(255,128,48,.5)', 1], ashrest: ['rgba(214,226,244,.55)', 1] };
function treeTopCv(tr) {
  const base = SPR.top[tr.kind][tr.v].cv; if (!FX() || !seasonOn() || (tr.kind !== 0 && tr.kind !== 3)) return base; const k = SEASON().k, tt = TOPTINT[k]; if (!tt) return base;
  const key = k + tr.kind + ':' + tr.v; let c = TOPC.get(key);
  if (!c) { const [cv, x] = mk(base.width, base.height); x.drawImage(base, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = tt[0]; x.fillRect(0, 0, cv.width, cv.height); TOPC.set(key, c = cv); }
  return c;
}
// leaves in Emberfall, petals in Kindling, and what drifts in the lands that had nothing drifting
function ambientMore() {
  const b = G.biome, cx = G.cam.x, cy = G.cam.y, p = G.p; if (!p || WORLD.arena || DIM || !FX()) return;
  const surf0 = (G.underK || 0) < .3, night = G.dn < .35;
  if (surf0 && seasonOn() && (b === 'moor' || b === 'thorn' || b === 'fen' || b === 'village' || b === 'mosswood' || b === 'willowmere')) {
    const k = SEASON().k;
    if (k === 'emberfall' && G.time % 9 === 0) P(cx + frand(-20, VS.vw + 40), cy - 4, frand(-.5, -.15), frand(.25, .5), 420, fpick(['#ff8a3d', '#e2542b', '#ffb347', '#c94a1e']), { g: .0006, fr: .999, sz: Math.random() < .4 ? 2 : 1 });
    else if (k === 'kindling' && G.time % 16 === 0) P(cx + frand(-20, VS.vw + 40), cy - 4, frand(-.35, -.05), frand(.18, .36), 520, fpick(['#ffd9e6', '#ffffff', '#c9ffd8']), { g: .0003, fr: .999 });
  }
  if (!surf0) { if (G.time % 22 === 0) P(p.x + frand(-70, 70), p.y + frand(-50, 30), frand(-.05, .05), frand(-.04, .04), 160, '#8d8794', { g: 0, fr: 1 }); return; }
  if (b === 'fen') { if (night && G.time % 6 === 0) P(cx + frand(VS.vw), cy + VS.vh * frand(.35, .95), frand(-.2, .2), frand(-.15, .15), 150, fpick(['#c9ff7a', '#e8ffb0', '#8ff5a0']), { g: 0, fr: .99, glow: 1 }); else if (!night && G.time % 12 === 0) P(cx + frand(VS.vw), cy + VS.vh * frand(.4, 1), frand(-.12, .12), frand(-.1, -.02), 240, '#b8d8c8', { g: 0, fr: 1 }); }
  else if (b === 'thorn' && G.time % 10 === 0) P(cx - 4, cy + frand(VS.vh * .9), frand(.3, .7), frand(-.12, .1), 520, fpick(['#f4e8c8', '#ffffff', '#d8c8a0']), { g: -.0002, fr: 1 });
  else if (b === 'dunes' && G.time % 3 === 0) P(cx + VS.vw + 4, cy + VS.vh * frand(.35, 1), frand(-2.6, -1.4), frand(-.06, .1), 240, fpick(['#f0e0b0', '#e6c890', '#fff1c8']), { g: 0, fr: 1 });
  if (wt('embersky') && G.time % 8 === 0) P(cx + frand(VS.vw), cy + VS.vh * frand(.2, 1), frand(-.3, .1), frand(-.4, -.15), 260, fpick(SPARK), { g: -.001, fr: 1, glow: 1 });
}
