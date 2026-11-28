// ============================================================
//  The year. Three days to a season, four seasons, and the land looks
//  and behaves differently in each:
//    KINDLING   the stalks wake: showers, and picked bushes fruit fast
//    HIGHSUN    long days, clear skies
//    EMBERFALL  the stalks turn the colour of coals; creatures carry more
//    ASHREST    snow off the Reach, long nights, and more abroad in them
//  The weather comes with the season: rain, snow, or a clear sky.
//  A world's age in days is kept with its save; a world from before the
//  seasons works its age out from how long you have played it.
// ============================================================
const SEASONS = [
  { k: 'kindling', n: 'KINDLING', sub: 'the stalks wake, and what was picked grows back', tint: [140, 255, 170, .05], wx: [['hail', .07], ['rain', .34]], col: '#7ddc6f' },
  { k: 'highsun', n: 'HIGHSUN', sub: 'long light and short shadows', tint: [255, 232, 150, .06], wx: [['rain', .07]], col: '#ffd35a' },
  { k: 'emberfall', n: 'EMBERFALL', sub: 'the stalks turn the colour of coals', tint: [255, 150, 70, .075], wx: [['hail', .1], ['rain', .22]], col: '#ff9a3d' },
  { k: 'ashrest', n: 'ASHREST', sub: 'the cold comes down off the Reach', tint: [170, 205, 255, .085], wx: [['hail', .08], ['snow', .5]], col: '#b4e6e8' }
];
const SEASON_DAYS = 3;
// the season a new world wakes in comes from its seed (old worlds count from Kindling)
const yearStart = () => WT_ON ? floor(hh(7, 7717, SEED) * 4) * SEASON_DAYS : 0;
const worldDays = () => G.days === undefined ? 0 : G.days;
const seasonI = () => floor(worldDays() / SEASON_DAYS) % 4, SEASON = () => SEASONS[seasonI()];
// how far through the season (0 to 1), and how much of the next one is already in the air (the last sixth blends)
const seasonU = () => (worldDays() / SEASON_DAYS) % 1, seasonBlend = () => smooth((seasonU() - .84) / .16);
const seasonOn = () => !WORLD.arena && !DIM && G.state !== 'title';
const dayN = () => floor(worldDays()) + 1;
// the clock runs a little slow through the long half of the day
function seasonClock(c) { if (!seasonOn()) return 1; const night = c > .6 && c < .97, k = SEASON().k; return k === 'highsun' ? (night ? 1.25 : .86) : k === 'ashrest' ? (night ? .8 : 1.2) : 1; }
const seasonRegrow = () => !seasonOn() ? 1 : SEASON().k === 'kindling' ? .5 : SEASON().k === 'ashrest' ? 1.7 : 1;
const seasonDrops = () => seasonOn() && SEASON().k === 'emberfall' ? 1.3 : 1;
const seasonCap = night => seasonOn() && SEASON().k === 'ashrest' && night ? 1 : 0;

// ---------------- weather ----------------
// G.wx: { k: 'rain' | 'snow' | 'hail', t: ticks left, a: how hard (fades in and out) }
function tickYear(dc) {
  if (WORLD.arena || DIM) return;
  const d0 = worldDays(), s0 = floor(d0 / SEASON_DAYS) % 4; G.days = d0 + dc; const s1 = seasonI();
  if (s1 !== s0 && G.state === 'play' && !G.cine) { const S = SEASONS[s1]; G.banner = { text: S.n, sub: S.sub, t: 0 }; sfx('quest', 0); G.dirty = true; }
  const w = G.wx;
  if (w) { w.t--; w.a = w.t > 240 ? min(1, w.a + .004) : max(0, w.a - .0045); if (w.t <= 0 && w.a <= 0) { G.wx = null; if (!netGuest()) G.wxT = 3600 + frand(5400); } return; }
  if (netGuest() || G.state !== 'play') return;
  if (G.wxT === undefined) G.wxT = 2400 + frand(3600); if (--G.wxT > 0) return; G.wxT = 3000 + frand(4200);
  if (G.ev || G.boss) return;
  for (const [k, ch] of SEASON().wx) if (Math.random() < ch * (wt('storms') ? 1.6 : 1)) { G.wx = { k, t: 5400 + floor(frand(5400)), a: 0 }; break; }
}
const wxA = k => G.wx && G.wx.k === k && !WORLD.arena && !DIM ? G.wx.a : 0;
// rain and snow fall on open ground only; under a roof or underground you just hear about it
function wxParticles() {
  const w = G.wx; if (!w || w.a <= .02 || WORLD.arena || DIM) return; const cx = G.cam.x, cy = G.cam.y, p = G.p;
  if (!p || realmAt(floor((p.x + 3) / T), floor((p.y + 10) / T)) !== 'surface') return;
  if (w.k === 'rain') { for (let i = 0, n = ceil(w.a * 5 * VS.vw / 420); i < n; i++) P(cx + frand(-30, VS.vw + 90), cy - 6, -1.5, frand(5.4, 6.8), 70, fpick(['#9ac8e8', '#c4e2f4', '#7fb0d8']), { g: 0, fr: 1, rain: 1 }); }
  // hail: white stones that bounce where they land
  else if (w.k === 'hail') { for (let i = 0, n = ceil(w.a * 2.2 * VS.vw / 420); i < n; i++) P(cx + frand(-30, VS.vw + 70), cy - 6, frand(-.8, -.3), frand(5, 6.5), 80, fpick(['#ffffff', '#e8f4ff', '#dcf7f5']), { g: .18, fr: .995, hit: 1, sz: 2, sky: 1 }); }
  else if (G.time % 2 === 0) { for (let i = 0, n = ceil(w.a * 2 * VS.vw / 420); i < n; i++) P(cx + frand(-30, VS.vw + 70), cy - 4, frand(-.7, -.2), frand(.5, 1), 420, fpick(['#ffffff', '#e8f4ff', '#cfe6f4']), { g: 0, fr: 1, sky: 1 }); }
}
// the weather dims the day a little
function seasonSun() {
  if (WORLD.arena || DIM) return; const r = wxA('rain') + wxA('hail') * .8, s = wxA('snow');
  if (r > 0) { G.sun[0] *= 1 - .2 * r; G.sun[1] *= 1 - .16 * r; G.sun[2] *= 1 - .1 * r; }
  if (s > 0) { G.sun[0] *= 1 - .1 * s; G.sun[1] *= 1 - .07 * s; G.sun[2] *= 1 - .03 * s; }
}
// the sound of rain: one quiet loop of hiss, faded with the weather (and muffled underground)
let RAINS = null, RAINL = -1;
function rainSound() {
  if (!AC || !noiseBuf || !master) return; const lv = G.state === 'play' && !muted ? wxA('rain') * (1 - (G.underK || 0) * .85) : 0;
  if (!RAINS) { if (lv < .02) return; try { const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; s.loop = true; f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = .35; g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start(); RAINS = { s, g }; RAINL = -1; } catch (e) { return; } }
  if (abs(lv - RAINL) > .02) { RAINL = lv; try { RAINS.g.gain.setTargetAtTime(lv * .07, AC.currentTime, .5); } catch (e) { } }
}
// a line for the pause screen and the pocket watch
const yearLine = () => 'DAY ' + dayN() + ' - ' + SEASON().n + (G.wx && G.wx.a > .3 ? ' - ' + (G.wx.k === 'rain' ? 'RAIN' : G.wx.k === 'hail' ? 'HAIL' : 'SNOW') : '');
