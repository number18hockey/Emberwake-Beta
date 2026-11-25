// ============================================================
//  WEATHER, in the Waking Lands and in the Ashfall.
//  Mostly clear or cloudy; now and then wind, rain, a thunderstorm
//  or fog. The same weather means different things in different
//  lands: rain is snow in the Reach, a sandstorm in the dunes and the
//  rust country, ashfall on the ash.
//  It is felt (rain, snow and sand slow you, the wind shoves you about,
//  lightning strikes) and it is seen: crowns bend and shed leaves,
//  drops break on them and drip through, puddles fill, snow settles,
//  the lens runs with water. Under a roof or below ground it stays out.
//  In a shared world the host's sky leads; in a match it follows the seed.
// ============================================================
const WXK = ['cloud', 'rain', 'snow', 'sand', 'ash', 'fog', 'wind', 'bolt'];
const WX = {
  clear: { name: 'CLEAR SKIES', w: 38, dur: [140, 280], f: { cloud: .1 } },
  cloudy: { name: 'OVERCAST', w: 28, dur: [110, 230], f: { cloud: .72, wind: .06 } },
  windy: { name: 'HIGH WIND', sub: 'it shoves you about', w: 11, dur: [70, 140], f: { cloud: .38, wind: 1 } },
  rain: { name: 'RAIN', sub: 'slow going, slick ground', w: 19, dur: [80, 170], f: { cloud: .92, rain: .78, wind: .24 } },
  storm: { name: 'THUNDERSTORM', sub: 'keep off high ground', w: 7, dur: [70, 120], f: { cloud: 1, rain: 1, wind: .68, bolt: 1 } },
  fog: { name: 'FOG', sub: 'something moves in it', w: 6, dur: [80, 150], f: { cloud: .5, fog: 1 } }
};
const WXC = { x0: 0, n: 0, top: new Int16Array(0), at: -99 }, WXDROPS = [], WXBOLTS = [];
const wxOn = () => !DIM && (!WORLD.arena || WORLD.royale) && G.state === 'play';
function wxReset() {
  G.wx = { id: 'clear', t: 0, dur: 60 * frand(70, 150), dir: Math.random() < .5 ? -1 : 1, wet: 0, snow: 0, boltT: 400, mobT: 1500, flash: 0, scr: 0, said: 'clear', tg: null };
  G.wxI = {}; for (const k of WXK) G.wxI[k] = 0; G.wxWind = 0; WXDROPS.length = 0; WXBOLTS.length = 0; WXC.at = -99;
}
// what a kind of weather comes to in one land
function wxLocal(id, b) {
  const f = Object.assign({}, (WX[id] || WX.clear).f), r = f.rain || 0;
  if (b === 'reach') { if (r) { f.snow = r; f.rain = 0; f.bolt = 0; } }
  else if (b === 'dunes' || b === 'scoria') { if (r) { f.sand = r; f.rain = 0; f.wind = max(f.wind, .75); f.cloud *= .5; } else if (id === 'windy') f.sand = .42; else if (id === 'fog') { f.sand = .2; f.fog = .35; } }
  else if (b === 'ash') { if (r) { f.ash = r; f.rain = 0; } else if (id === 'windy') f.ash = .4; }
  return f;
}
function wxPick(prev, R) {
  // it clouds over before it rains, and a storm breaks up into cloud or rain
  const ok = id => id !== prev && ((id !== 'rain' && id !== 'storm') || prev === 'cloudy' || prev === 'rain' || prev === 'windy') && !(prev === 'storm' && id === 'windy');
  const L = Object.keys(WX).filter(ok); let s = 0; for (const k of L) s += WX[k].w; let r = R() * s; for (const k of L) { r -= WX[k].w; if (r <= 0) return k; } return 'clear';
}
// a match's weather, worked out from its seed so everyone stands under the same sky
function wxSchedule(seed) {
  const R = mulberry32((seed ^ 0x7ea12c3d) >>> 0), L = []; let at = 0, id = R() < .6 ? 'clear' : 'cloudy';
  while (at < 60 * 60 * 90) { const [a, b] = WX[id].dur, dur = round((a + R() * (b - a)) * 60 * .62); L.push({ at, id, dir: R() < .5 ? -1 : 1 }); at += dur; id = wxPick(id, R); }
  return L;
}
function wxSet(id, dir) { const W = G.wx; W.id = id; W.t = 0; W.dir = dir; W.tg = null; const [a, b] = WX[id].dur; W.dur = 60 * frand(a, b); if (id !== 'clear' && id !== 'cloudy') W.mobT = 60 * frand(14, 30); }
// is there rock or a roof over this spot?
function wxCovered(x, y) {
  const tx = floor(x / T), ty = floor(y / T); if (!inW(tx, max(0, ty))) return false; if (ty > SKYL[tx] + 2) return true;
  for (let k = 1; k < 36 && ty - k >= 0; k++) if (TP[tiles[(ty - k) * WW + tx]].solid) return true; return false;
}
const wxWetAt = (x, y) => !!G.wxI && G.wxI.rain > .35 && !wxCovered(x, y);
// what the weather does to a pair of legs
function wxSpeed(f, md) {
  const I = G.wxI; let k = f.mire > 0 ? .66 : 1; if (!I || f.shel !== false) return k;
  k *= 1 - .16 * I.rain - .14 * I.snow - .17 * I.sand - .07 * I.ash; const w = G.wxWind || 0; if (md && abs(w) > .12) k *= sign(w) === md ? 1 + .09 * abs(w) : 1 - .17 * abs(w); return k;
}
const wxSlick = f => G.wxI && f.shel === false && G.wxI.rain + G.wxI.snow > .3 ? .62 : 1;
const wxBreath = f => G.wxI && f.shel === false ? 1 - .2 * G.wxI.sand - .15 * G.wxI.snow - .1 * G.wxI.ash : 1;
const wxSight = () => G.wxI ? 1 - .5 * G.wxI.fog - .3 * G.wxI.sand - .12 * G.wxI.rain : 1;
function tickWeather() {
  const W = G.wx, I = G.wxI, p = G.p; if (!W || !p) return; const on = wxOn();
  if (on) {
    W.t++;
    if (WORLD.royale) { const L = BR.wxList; if (L && L.length) { let k = BR.wxAt | 0; while (k < L.length - 1 && BR.t >= L[k + 1].at) k++; while (k > 0 && BR.t < L[k].at) k--; BR.wxAt = k; if (L[k].id !== W.id || L[k].dir !== W.dir) wxSet(L[k].id, L[k].dir); } }
    else if (!netGuest() && W.t > W.dur) wxSet(G.ev && G.ev.fade > .1 ? 'clear' : wxPick(W.id, Math.random), Math.random() < .5 ? -1 : 1);
    else if (G.ev && G.ev.fade > .3 && W.id !== 'clear' && !netGuest()) wxSet('clear', W.dir);
    if (W.said !== W.id && W.t > 60) { W.said = W.id; if (W.id !== 'clear' && W.id !== 'cloudy' && !p.dead) { const sub = wxSub(); G.note = { text: wxName() + (sub ? '  ·  ' + sub : ''), t: 0 }; } }
  }
  const mid = clamp(floor((G.cam.x + VS.vw / 2) / T), 0, WW - 1);
  if (!W.tg || G.time % 12 === 0) W.tg = on ? wxLocal(W.id, biomeAt(mid)) : {};
  for (const k of WXK) I[k] = approach(I[k], W.tg[k] || 0, k === 'cloud' ? .0035 : .0045);
  G.wxWind = approach(G.wxWind || 0, W.dir * I.wind * clamp(.74 + .2 * sin(G.time * .011) + .18 * sin(G.time * .037 + 1), .2, 1.1), .012);
  W.wet = approach(W.wet, I.rain > .2 ? 1 : 0, I.rain > .2 ? .0016 * I.rain : .0005); W.snow = approach(W.snow, I.snow > .2 ? 1 : 0, I.snow > .2 ? .0013 : .0003); if (W.flash > 0) W.flash = max(0, W.flash - .06);
  if (!on) return;
  const rough = I.rain + I.snow + I.sand + I.ash + abs(G.wxWind) > .08;
  for (const f of G.fighters) {
    if (f.remote || f.dead) continue; if (f.mire > 0) f.mire--;
    if (f.shel === undefined || (G.time + (f.botI | 0)) % 14 === 0) f.shel = wxCovered(f.x + 3, f.y);
    if (!rough || f.shel) continue;
    if (!f.onGround && abs(G.wxWind) > .15 && f.state !== 'dodge' && !f.climbing) { const lim = f.glide || f.gliding ? 3.4 : 2.4, v = f.vx + G.wxWind * .03 * (f.glide || f.gliding ? 1.5 : 1); if (abs(v) < lim || abs(v) < abs(f.vx)) f.vx = v; }
    if (I.rain > .4 && f.st && f.st.burn > 0) f.st.burn = max(0, f.st.burn - 2);
    if (f === p) {
      if (I.rain > .3 && f.onGround && abs(f.vx) > .6 && G.time % 5 === 0) for (let k = 0; k < 2; k++) P(f.x + 3 - f.face * 2, f.y + f.h - 1, -f.vx * .3 + frand(-.4, .4), frand(-1.2, -.5), 14, '#b4d6e8', { g: .12 });
      if (I.snow > .3 && f.onGround && abs(f.vx) > .6 && G.time % 6 === 0) P(f.x + 3, f.y + f.h - 1, -f.vx * .2, -.5, 18, '#ffffff', { g: .06 });
    }
  }
  if (abs(G.wxWind) > .25) for (const pr of G.projs) if ((pr.type === 'arrow' || pr.type === 'flask' || pr.type === 'pellet' || pr.type === 'javelin' || pr.type === 'glob') && pr.t % 2 === 0) pr.vx += G.wxWind * .018;
  W.scr = approach(W.scr, (brCamTarget() || p).shel === false || p.shel === false ? 1 : 0, .035);
  wxTrees(); wxLens();
  // thunder
  if (I.bolt > .5 && I.rain > .5 && --W.boltT <= 0) { W.boltT = 60 * frand(5, 12); wxBolt(); }
  for (let i = WXBOLTS.length - 1; i >= 0; i--) { const b = WXBOLTS[i]; b.t++; if (b.t < 0) { if (b.t % 4 === 0) { P(b.x + frand(-5, 5), b.y - frand(4, 40), 0, frand(-1.5, -.5), 12, fpick(['#c9e8ff', '#ffffff', '#8fd0ff']), { glow: 1, g: 0 }); if (near(b)) sfx('tele', 90); } } else if (b.t === 0) wxStrike(b); else if (b.t > 14) WXBOLTS.splice(i, 1); }
  // the rare things that come out in it
  if (--W.mobT <= 0) { W.mobT = 60 * frand(22, 44); if (!netGuest() && !p.dead && Math.random() < .5) wxMob(); }
  if (G.time % 60 === 0 && (!netGuest() || WORLD.royale)) wxMobLeave();
}
function wxName() { const I = G.wx.tg || {}; return I.snow ? (G.wx.id === 'storm' ? 'BLIZZARD' : 'SNOW') : I.sand > .3 ? (G.wx.id === 'storm' || G.wx.id === 'rain' ? 'SANDSTORM' : 'BLOWING SAND') : I.ash ? 'ASHFALL' : WX[G.wx.id].name; }
function wxSub() { const I = G.wx.tg || {}; return I.snow ? 'slow going, and cold' : I.sand > .3 ? 'it slows you and takes your breath' : I.ash ? 'slow going' : WX[G.wx.id].sub || ''; }
// ---------------- trees and ground ----------------
function wxTrees() {
  const I = G.wxI, aw = abs(G.wxWind), cx = G.cam.x, cy = G.cam.y, busy = G.parts.length > 750 || SETTINGS.fpsMode; if (busy || (I.rain < .12 && aw < .22 && I.snow < .15)) return;
  for (const [tx, tr] of treeTops) {
    const X = tx * T + 4 - 23, Y = tr.y * T + 1 - 31; if (X > cx + VS.vw + 10 || X < cx - 60 || Y > cy + VS.vh + 10 || Y < cy - 60) continue;
    const q = crownInfo(tr.kind, tr.v);
    // drops break on the leaves, run through, and fall from the fringe
    if (I.rain > .12) {
      if (Math.random() < .5 * I.rain) { const [px, py] = fpick(q.top), sx = X + px + crownSway(tr, py), sy = Y + py; for (let k = 0; k < 2; k++) P(sx, sy, frand(-.7, .7) + G.wxWind * .4, frand(-1, -.35), 12, '#d8ecf8', { g: .1 }); }
      if (q.bot.length && Math.random() < .22 * (.3 + I.rain)) { const [px, py] = fpick(q.bot); P(X + px + crownSway(tr, py), Y + py + 1, 0, .4, 90, '#9cc8e0', { g: .13, fr: 1, hit: 1 }); }
    } else if (G.wx.wet > .3 && q.bot.length && Math.random() < .05) { const [px, py] = fpick(q.bot); P(X + px + crownSway(tr, py), Y + py + 1, 0, .4, 90, '#9cc8e0', { g: .13, fr: 1, hit: 1 }); }
    if (aw > .22 && Math.random() < .06 * aw) { const [px, py] = fpick(q.top); P(X + px, Y + py + 3, G.wxWind * frand(1.2, 2.6), frand(-.4, .4), frand(90, 200) | 0, fpick(LEAF[tr.kind] || LEAF[0]), { g: .008, fr: .998, hit: 1 }); }
    if (aw > .5 && I.snow > .3 && Math.random() < .05) { const [px, py] = fpick(q.top); for (let k = 0; k < 4; k++) P(X + px + frand(-3, 3), Y + py, G.wxWind * frand(.4, 1.2), frand(0, .5), 50, '#ffffff', { g: .03 }); }
  }
  if (aw > .4 && Math.random() < aw * .4) P(G.wxWind > 0 ? cx - 6 : cx + VS.vw + 6, cy + frand(VS.vh), G.wxWind * frand(2.4, 4), frand(-.3, .3), 260, fpick(['#b9bdd0', '#8d8794', '#6ba653', '#c98a64']), { g: 0, fr: 1 });
}
// for each column on screen, the row the sky reaches down to
function wxTop(vx0, vx1) {
  const n = vx1 - vx0 + 1; if (WXC.x0 === vx0 && WXC.n === n && RFRAME - WXC.at < 8 && RFRAME >= WXC.at) return WXC;
  if (WXC.top.length < n) WXC.top = new Int16Array(n + 16); WXC.x0 = vx0; WXC.n = n; WXC.at = RFRAME;
  for (let k = 0; k < n; k++) { const tx = vx0 + k; let y = 0; if (tx < 0 || tx >= WW) { WXC.top[k] = 0; continue; } const lim = min(WH, heights[tx] + 60); while (y < lim) { const t = tiles[y * WW + tx], q = TP[t]; if (q.solid || q.liquid || q.plat) break; y++; } WXC.top[k] = y; }
  return WXC;
}
// puddles, sheen and lying snow: drawn on the world itself, so the light falls on them too
function wxGround(w, vx0, vx1, vy0, vy1) {
  const W = G.wx, I = G.wxI; if (!W || DIM || (W.wet < .04 && W.snow < .04 && I.rain < .05)) return;
  const C = wxTop(vx0, vx1), wet = W.wet, snow = W.snow;
  for (let k = 1; k < C.n - 1; k++) {
    const tx = vx0 + k, y = C.top[k]; if (y < vy0 || y > vy1 || tx < 1 || tx >= WW - 1) continue; const t = tileAt(tx, y), q = TP[t], px = tx * T, py = y * T, b = biomeAt(tx);
    if (q.liquid === 1) { if (I.rain > .1 && hh(tx, G.time >> 3, 11) < .3 * I.rain) { w.fillStyle = 'rgba(220,240,250,.7)'; w.fillRect(px + ((hh(tx, G.time >> 3, 12) * 6) | 0), py, 3, 1); } continue; }
    if (!q.solid || q.ghost) continue;
    if (snow > .04 && b === 'reach') { w.globalAlpha = min(1, snow * 1.5); w.fillStyle = '#ffffff'; for (let c = 0; c < 8; c += 2) w.fillRect(px + c, py - (hh(tx * 4 + c, 3, SEED) < snow * .7 ? 2 : 1), 2, 2); w.fillStyle = '#dcf7f5'; w.fillRect(px, py + 1, 8, 1); w.globalAlpha = 1; }
    if (wet > .04 && b !== 'reach' && b !== 'dunes' && b !== 'scoria') {
      w.fillStyle = `rgba(8,14,34,${.26 * wet})`; w.fillRect(px, py + 1, 8, 5); w.fillStyle = `rgba(190,220,240,${.3 * wet})`; w.fillRect(px + (hh(tx, 5, SEED) < .5 ? 0 : 3), py + 1, 4, 1);
      // a hollow fills: one or two paces of level ground
      if (hh(tx >> 1, 77, SEED) < .34 && C.top[k - 1] <= y && C.top[k + 1] <= y) {
        w.fillStyle = `rgba(96,150,186,${.75 * wet})`; w.fillRect(px, py, 8, 2); w.fillStyle = `rgba(206,232,246,${.7 * wet})`; w.fillRect(px + ((G.time >> 4) + tx * 3) % 6, py, 2, 1);
        if (I.rain > .1 && hh(tx, G.time >> 3, 21) < .5 * I.rain) { w.fillStyle = 'rgba(235,246,252,.8)'; w.fillRect(px + ((hh(tx, G.time >> 3, 22) * 5) | 0), py, 3, 1); }
      }
    }
  }
}
// ---------------- lightning ----------------
function wxBolt() {
  const p = G.p, cx = G.cam.x; if (realmAt(clamp(floor((p.x + 3) / T), 0, WW - 1), floor((p.y + 10) / T)) !== 'surface') { G.wx.flash = .35; setTimeout(() => sfx('thunder', 400), 500); return; }
  let tx = -1, tree = null; const L = []; for (const [k, tr] of treeTops) if (k * T > cx - 60 && k * T < cx + VS.vw + 60) L.push([k, tr]);
  if (L.length && Math.random() < .5) { const q = fpick(L); tx = q[0]; tree = q[1]; }
  else if (p.shel === false && !p.dead && Math.random() < .3) tx = floor((p.x + 3 + frand(-26, 26)) / T);
  else tx = floor((cx + frand(VS.vw)) / T);
  tx = clamp(tx, 2, WW - 3); let y = 0; while (y < WH - 1 && !TP[tiles[y * WW + tx]].solid && !TP[tiles[y * WW + tx]].liquid) y++;
  WXBOLTS.push({ x: tx * T + 4, y: tree ? tree.y * T : y * T, gy: y * T, t: -46, tx, tree, seed: (Math.random() * 1e6) | 0 });
}
function wxStrike(b) {
  const p = G.p; G.wx.flash = 1; b.y0 = G.cam.y - 60; const d = abs(p.x - b.x); setTimeout(() => sfx('thunder', 200), d > 260 ? 340 : 20); if (d < 320) addShake(5);
  burst(b.x, b.y, 26, ['#ffffff', '#c9e8ff', '#8fd0ff', '#fff1a8'], 3, 30, { glow: 1, g: .04 }); G.trails.push({ kind: 'ring', x: b.x, y: b.gy, r: 22, life: 10, max: 10 });
  for (const f of G.fighters) { if (f.remote || f.dead || f.noHit || f.shel !== false) continue; const dx = f.x + 3 - b.x, dy = f.y + f.h - b.gy; if (abs(dx) < 17 && dy > -64 && dy < 14) hurtFighter(f, f === p ? 18 : 14, b.x, { kx: (sign(dx) || 1) * 2.6, ky: -3.2 }); }
  if (!netGuest() || WORLD.royale) for (const e of G.enemies) if (!e.dead && !e.noHit && !e.boss && e.type !== 'stormcaller' && abs(e.x + e.w / 2 - b.x) < 18 && e.y + e.h > b.gy - 70 && e.y < b.gy + 8) damageEnemy(e, 26, sign(e.x - b.x) * 2, -3, { stagger: 30 });
  lightFire(b.x, b.gy - 2, 13, 170, null);
  // a struck tree comes down more often than not
  if (b.tree && treeTops.get(b.tx) === b.tree && !netGuest() && Math.random() < .55) { let y = b.tree.y; while (y < WH - 2 && TP[tileAt(b.tx, y + 1)].stalk) y++; if (TP[tileAt(b.tx, y)].stalk) fell(b.tx, y, Math.random() < .5 ? 1 : -1); }
}
function wxDrawBolts(f) {
  for (const b of WXBOLTS) {
    if (b.t < 0) { f.globalAlpha = .1 + .1 * ((b.t >> 1) & 1); f.fillStyle = '#c9e8ff'; f.fillRect(b.x - 2, b.y - 120, 4, 120); f.globalAlpha = 1; continue; }
    const a = 1 - b.t / 14, R = mulberry32(b.seed + (b.t >> 2)); f.globalAlpha = a; f.lineWidth = b.t < 4 ? 3 : 1.5; f.strokeStyle = '#eaf6ff'; f.beginPath(); let X = b.x + (R() - .5) * 60, Y = (b.y0 || b.y - 260) - 20; f.moveTo(X, Y);
    while (Y < b.y) { Y = min(b.y, Y + 10 + R() * 16); X = lerp(X, b.x, .3) + (Y >= b.y ? 0 : (R() - .5) * 22); if (Y >= b.y) X = b.x; f.lineTo(X, Y); if (R() < .22) { f.lineTo(X + (R() - .5) * 34, Y + 14 * R()); f.moveTo(X, Y); } }
    f.stroke(); f.globalAlpha = 1;
  }
}
// ---------------- the sky ----------------
let WXCLOUD = null;
function wxClouds() {
  WXCLOUD = [0, 1, 2, 3].map(k => { const w = 150 + k * 26, h = 40, R = mulberry32(900 + k), blobs = []; for (let i = 0; i < 11; i++) { const u = i / 10; blobs.push([14 + u * (w - 28), h - 13 - sin(u * PI) * (6 + R() * 8), 7 + sin(u * PI) * (6 + R() * 7)]); } const [c, x] = mk(w, h); for (let Y = 0; Y < h - 6; Y++) for (let X = 0; X < w; X++) { let in1 = false, lit = true; for (const [bx, by, r] of blobs) { const d = ((X - bx) ** 2 + ((Y - by) * 1.25) ** 2) / (r * r); if (d < 1) { in1 = true; if (Y > by + r * .12) lit = false; } } if (!in1) continue; x.fillStyle = lit ? '#ffffff' : Y > h - 13 ? '#9aa0b8' : '#c8cddd'; x.fillRect(X, Y, 1, 1); } return c; });
}
function wxSky(c, cx, cy, under) {
  const I = G.wxI; if (!I || DIM || G.state !== 'play' || under >= 1 || WORLD.arena && !WORLD.royale) return; if (!WXCLOUD) wxClouds();
  const W = VS.W, H = VS.H, S = VS.s, dn = G.dn, vis = 1 - under, gloom = clamp(I.cloud * .5 + I.rain * .28 + I.snow * .2, 0, .82);
  if (gloom > .02) { const day = mixc([26, 26, 44], I.snow > .3 ? [196, 204, 216] : I.sand > .3 ? [196, 158, 112] : [122, 134, 156], dn); c.globalAlpha = gloom * vis; c.fillStyle = rgb(day); c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  if (I.sand > .02) { c.globalAlpha = .5 * I.sand * vis; c.fillStyle = rgb(mixc([60, 40, 34], [206, 156, 98], dn)); c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  const dark = clamp(I.rain * .5 + I.bolt * .25, 0, .7), n = 5 + round(I.cloud * 11);
  for (let i = 0; i < n; i++) {
    const row = i % 3, sp = WXCLOUD[i % 4], k = S * (.85 + row * .34 + hh(i, 2, 3) * .3), w = sp.width * k, h = sp.height * k, span = W + w * 2, drift = G.time * (.05 + row * .045) * S * (1 + 3 * abs(G.wxWind || 0)) * ((G.wxWind || .3) >= 0 ? 1 : -1);
    const x = (((hh(i, 1, 7) * span + drift - cx * (.03 + row * .035) * S) % span) + span) % span - w, y = H * (.03 + row * .1 + hh(i, 4, 9) * .09) - (cy - 400) * .015 * S, a = (i < 5 ? .3 + .5 * I.cloud : clamp(I.cloud * 1.5 - .2, 0, .9)) * vis * (.3 + .7 * dn);
    if (a < .03) continue; c.globalAlpha = a; c.drawImage(sp, round(x), round(y), round(w), round(h));
    if (dark > .05) { c.globalAlpha = a * dark; c.drawImage(wxDark(i % 4), round(x), round(y), round(w), round(h)); }
  }
  c.globalAlpha = 1; if (G.wx.flash > .05) { c.globalAlpha = G.wx.flash * .5 * vis; c.fillStyle = '#eaf4ff'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
}
const WXDARK = [];
function wxDark(k) { if (!WXDARK[k]) { const s = WXCLOUD[k], [c, x] = mk(s.width, s.height); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#2c3348'; x.fillRect(0, 0, s.width, s.height); WXDARK[k] = c; } return WXDARK[k]; }
function wxSun() {
  const I = G.wxI; if (!I || DIM) return; const s = G.sun, k = clamp(I.cloud * .26 + I.rain * .24 + I.sand * .18 + I.ash * .2 + I.fog * .08, 0, .58), g = (s[0] + s[1] + s[2]) / 3;
  s[0] = lerp(s[0], g * .94, I.cloud * .4) * (1 - k); s[1] = lerp(s[1], g, I.cloud * .4) * (1 - k); s[2] = lerp(s[2], min(1, g * 1.1), I.cloud * .4) * (1 - k * .86);
  if (I.sand > .1) { s[0] *= 1 + .12 * I.sand; s[2] *= 1 - .25 * I.sand; }
  const fl = G.wx.flash; if (fl > 0) for (let i = 0; i < 3; i++) s[i] = lerp(s[i], 1, fl * .85);
}
// ---------------- what falls, in front of the world ----------------
// nothing here is remembered from frame to frame: each drop's place is worked out from its number and the time
function wxFall(c, cx, cy, vx0, vx1) {
  const I = G.wxI; if (!I || DIM || G.state !== 'play' || I.rain + I.snow + I.sand + I.ash < .03) return;
  const C = wxTop(vx0, vx1), vw = VS.vw + 90, vh = VS.vh + 90, t = G.time, wind = G.wxWind || 0, low = SETTINGS.fpsMode ? .4 : 1;
  const wrap = (v, o, span) => o + (((v - o) % span) + span) % span, gy = X => { const k = floor(X / T) - C.x0; return k < 0 || k >= C.n ? -1 : C.top[k] * T; };
  if (I.rain > .03) {
    const n = floor(440 * I.rain * low);
    for (const layer of [0, 1]) {
      const len = layer ? 13 : 8, sp = layer ? 8.4 : 6.2, sl = wind * (layer ? 3.6 : 2.6); c.strokeStyle = layer ? 'rgba(206,228,246,.5)' : 'rgba(150,186,220,.34)'; c.lineWidth = layer ? 1 : .7; c.beginPath();
      for (let i = layer; i < n; i += 2) { const X = wrap(hh(i, 1, 9) * 4096 + t * sl, cx - 45, vw), Y = wrap(hh(i, 2, 9) * 4096 + t * sp * (.9 + .2 * hh(i, 3, 9)), cy - 60, vh), g = gy(X); if (g < 0 || Y > g) continue; const L = min(len, g - Y); c.moveTo(X, Y); c.lineTo(X + sl / sp * L, Y + L); }
      c.stroke();
    }
    // where they land
    c.fillStyle = 'rgba(214,234,248,.75)';
    for (let k = 0; k < C.n; k++) { const tx = C.x0 + k, ph = (t + ((hh(tx, 8, 3) * 64) | 0)) >> 2, r = hh(tx, ph, 31); if (r > .3 * I.rain) continue; const X = tx * T + hh(tx, ph, 32) * 8, Y = C.top[k] * T; if (Y < cy - 4 || Y > cy + VS.vh) continue; const s = t & 3; c.fillRect(X - 1 - s * .4, Y - 1 - s * .5, 1, 1); c.fillRect(X + 1 + s * .4, Y - 1 - s * .5, 1, 1); if (s < 2) c.fillRect(X, Y - 2, 1, 1); }
  }
  if (I.snow > .03 || I.ash > .03) {
    const s = max(I.snow, I.ash), n = floor(190 * s * low); c.fillStyle = I.snow >= I.ash ? 'rgba(255,255,255,.9)' : 'rgba(168,160,176,.85)';
    for (let i = 0; i < n; i++) { const v = .7 + hh(i, 3, 5) * .8, X = wrap(hh(i, 1, 5) * 4096 + t * wind * 1.9 * v + sin(t * .03 + i) * 9, cx - 45, vw), Y = wrap(hh(i, 2, 5) * 4096 + t * v, cy - 60, vh), g = gy(X); if (g < 0 || Y > g) continue; const z = i % 5 === 0 ? 1.6 : 1; c.fillRect(X, Y, z, z); }
  }
  if (I.sand > .03) {
    const n = floor(150 * I.sand * low), d = sign(wind) || 1; c.fillStyle = 'rgba(232,190,132,.55)';
    for (let i = 0; i < n; i++) { const v = 3.4 + hh(i, 3, 6) * 3.2, X = wrap(hh(i, 1, 6) * 4096 + t * v * d, cx - 45, vw), Y = wrap(hh(i, 2, 6) * 4096 + sin(t * .02 + i * 1.7) * 14, cy - 60, vh), g = gy(X); if (g < 0 || Y > g) continue; c.fillRect(X, Y, 3 + v * .8, i % 4 ? .7 : 1.3); }
  }
}
// ---------------- the lens: haze, and water running down the glass ----------------
let wxSm = null, wxSmX, wxBl, wxBlX, wxMask, wxPuff = null;
function wxScreen(c, W, H, cx, cy) {
  const I = G.wxI, wx = G.wx; if (!I || DIM || G.state !== 'play' || WORLD.arena && !WORLD.royale) return; const vis = wx.scr;
  if (I.fog > .02 || I.sand > .05 || I.ash > .05) {
    const dn = .3 + .7 * G.dn; if (!wxPuff) { const [p, x] = mk(128, 48); const g = x.createRadialGradient(64, 24, 2, 64, 24, 62); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.6, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.setTransform(1, 0, 0, .38, 0, 15); x.fillRect(0, -40, 128, 128); wxPuff = p; }
    // haze hangs over the ground, not inside it
    const C = wxTop(floor(cx / T) - 3, floor((cx + VS.vw) / T) + 3), S = VS.s; c.save(); c.beginPath(); c.moveTo(0, 0); for (let k = 0; k < C.n; k++) { const X = ((C.x0 + k) * T - cx) * S, Y = (C.top[k] * T + 5 - cy) * S; c.lineTo(X, Y); c.lineTo(X + T * S, Y); } c.lineTo(W, 0); c.closePath(); c.clip();
    if (I.fog > .02 && vis > .02) {
      c.globalAlpha = .34 * I.fog * vis; c.fillStyle = rgb([200 * dn, 206 * dn, 218 * dn]); c.fillRect(0, 0, W, H); c.imageSmoothingEnabled = true;
      for (let i = 0; i < 9; i++) { const w = W * (.5 + hh(i, 1, 4) * .4), h = H * (.16 + hh(i, 2, 4) * .16), span = W + w * 2, x = (((hh(i, 3, 4) * span + G.time * (.3 + hh(i, 5, 4) * .5) * (wx.dir || 1) - cx * VS.s * (.4 + hh(i, 6, 4) * .5)) % span) + span) % span - w; c.globalAlpha = .3 * I.fog * vis * dn; c.drawImage(wxPuff, x, H * (.1 + .85 * hh(i, 4, 4)) - h / 2 + sin(G.time * .006 + i) * 12, w, h); }
      c.imageSmoothingEnabled = false;
    }
    if (I.sand > .05) { c.globalAlpha = .26 * I.sand * vis; c.fillStyle = rgb([210 * dn, 160 * dn, 100 * dn]); c.fillRect(0, 0, W, H); }
    if (I.ash > .05) { c.globalAlpha = .13 * I.ash * vis; c.fillStyle = '#6a6474'; c.fillRect(0, 0, W, H); }
    c.restore(); c.globalAlpha = 1; c.imageSmoothingEnabled = false;
  }
  if (I.snow > .3) { c.globalAlpha = .1 * I.snow * vis; c.fillStyle = '#e8f2ff'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  const k = I.rain * vis; if ((k < .04 && !WXDROPS.length) || SETTINGS.fpsMode) return;
  // a small soft copy of the picture: the edges of the glass blur, and each drop bends what is behind it
  const sw = max(80, round(W / 6)), sh = max(60, round(H / 6));
  if (!wxSm || wxSm.width !== sw || wxSm.height !== sh) { [wxSm, wxSmX] = mk(sw, sh); [wxBl, wxBlX] = mk(sw, sh); wxSmX.imageSmoothingEnabled = true; const [m, mx] = mk(sw, sh); const g = mx.createRadialGradient(sw / 2, sh / 2, sh * .3, sw / 2, sh / 2, sw * .6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); mx.fillStyle = g; mx.fillRect(0, 0, sw, sh); wxMask = m; }
  wxSmX.globalCompositeOperation = 'copy'; wxSmX.drawImage(cv, 0, 0, W, H, 0, 0, sw, sh);
  if (k > .04) { wxBlX.globalCompositeOperation = 'copy'; wxBlX.drawImage(wxSm, 0, 0); wxBlX.globalCompositeOperation = 'destination-in'; wxBlX.drawImage(wxMask, 0, 0); c.imageSmoothingEnabled = true; c.globalAlpha = .8 * k; c.drawImage(wxBl, 0, 0, W, H); c.globalAlpha = 1; }
  c.imageSmoothingEnabled = true;
  for (const d of WXDROPS) {
    const r = d.r, x = d.x * W, y = d.y * H, a = min(1, d.life / 30); c.save(); c.globalAlpha = a; c.beginPath(); c.ellipse(x, y, r, r * (1.12 + min(.6, d.vy * 90)), 0, 0, TAU); c.clip();
    c.translate(x, y); c.scale(1, -1); const z = r * 3.2; c.drawImage(wxSm, clamp((x - z) / 6, 0, sw - 2), clamp((y - z) / 6, 0, sh - 2), min(z / 3, sw), min(z / 3, sh), -r * 1.1, -r * 1.8, r * 2.2, r * 3.6); c.scale(1, -1);
    c.fillStyle = 'rgba(8,14,30,.18)'; c.fillRect(-r, -r * 1.8, r * 2, r * 1.1); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(-r * .3, -r * .35, r * .22, 0, TAU); c.fill(); c.restore();
  }
  c.globalAlpha = 1; c.imageSmoothingEnabled = false;
}
function wxLens() {
  const k = G.wxI.rain * G.wx.scr; if (SETTINGS.fpsMode) { WXDROPS.length = 0; return; }
  if (k > .1 && WXDROPS.length < 24 && Math.random() < .12 * k) WXDROPS.push({ x: Math.random(), y: Math.random() * .9, r: frand(4, 8) * (Math.random() < .25 ? 1.8 : 1) * max(1.15, VS.s * .62), vy: 0, life: frand(120, 300), run: Math.random() < .4 });
  for (let i = WXDROPS.length - 1; i >= 0; i--) { const d = WXDROPS[i]; d.life -= k > .1 ? 1 : 3; if (d.run && d.life < 200) d.vy = min(.006, d.vy + .00007); d.y += d.vy; if (d.life <= 0 || d.y > 1.1) WXDROPS.splice(i, 1); }
}
// ---------------- sound: rain and wind are one long breath, turned up and down ----------------
let wxSnd = null;
function wxAudio() {
  if (!AC || AC.state !== 'running') return;
  if (!wxSnd) { try { const line = (type, f0, q) => { const s = AC.createBufferSource(), b = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; s.loop = true; b.type = type; b.frequency.value = f0; b.Q.value = q; g.gain.value = 0; s.connect(b); b.connect(g); g.connect(master); s.start(); return { g, b }; }; wxSnd = { rain: line('lowpass', 1500, .4), wind: line('bandpass', 340, .9) }; } catch (e) { wxSnd = { off: true }; } }
  if (wxSnd.off) return; const I = G.wxI, on = G.state === 'play' && !muted && I && !DIM && UI.open !== 'pause', in1 = G.p && G.p.shel !== false ? .4 : 1, now = AC.currentTime;
  wxSnd.rain.g.gain.setTargetAtTime(on ? .2 * I.rain * in1 + .03 * I.sand : 0, now, .4); wxSnd.wind.g.gain.setTargetAtTime(on ? (.2 * abs(G.wxWind || 0) + .05 * I.snow + .08 * I.sand) * in1 : 0, now, .5); wxSnd.wind.b.frequency.setTargetAtTime(300 + 260 * abs(G.wxWind || 0) + 60 * sin(G.time * .02), now, .6);
}
// a little picture of the sky by your health
function wxHud(c, x, y) {
  const I = G.wxI; if (!I || DIM || !wxOn()) return; const id = G.wx.id, tg = G.wx.tg || {}, dark = id === 'storm' || id === 'rain';
  if (id === 'clear') { c.fillStyle = G.dn > .4 ? '#ffd35a' : '#dcf7f5'; c.fillRect(x + 3, y + 2, 5, 5); c.fillStyle = G.dn > .4 ? '#ff8a3d' : '#8fd0d8'; if (G.dn > .4) for (const [a, b] of [[5, 0], [5, 8], [1, 4], [9, 4]]) c.fillRect(x + a, y + b, 1, 1); else c.fillRect(x + 6, y + 2, 2, 3); return; }
  if (id === 'windy') { c.fillStyle = '#dcf7f5'; for (let k = 0; k < 3; k++) { const s = (G.time >> 3) + k * 3; c.fillRect(x + (s % 4), y + 2 + k * 2, 7, 1); } return; }
  c.fillStyle = dark ? '#7a8298' : '#c8cddd'; c.fillRect(x + 1, y + 2, 9, 3); c.fillRect(x + 3, y, 5, 2); c.fillStyle = dark ? '#5a6078' : '#9aa0b8'; c.fillRect(x + 1, y + 4, 9, 1);
  const f = G.time >> 2; if (tg.rain) { c.fillStyle = '#8fd0ff'; for (let k = 0; k < 4; k++) c.fillRect(x + 2 + k * 2, y + 6 + ((f + k * 2) % 3), 1, 1); } if (tg.snow || tg.ash) { c.fillStyle = tg.snow ? '#ffffff' : '#a19baa'; for (let k = 0; k < 4; k++) c.fillRect(x + 2 + k * 2 + ((f >> 1) & 1), y + 6 + (((f >> 1) + k * 2) % 3), 1, 1); } if (tg.sand > .3) { c.fillStyle = '#e8be84'; for (let k = 0; k < 3; k++) c.fillRect(x + (f + k * 3) % 9, y + 6 + k, 3, 1); }
  if (tg.bolt) { c.fillStyle = '#ffd35a'; c.fillRect(x + 6, y + 5, 1, 2); c.fillRect(x + 5, y + 7, 1, 2); } if (id === 'fog') { c.fillStyle = '#c8cddd'; c.fillRect(x, y + 6, 8, 1); c.fillRect(x + 3, y + 8, 8, 1); }
}
