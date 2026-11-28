// ============================================================
//  WEATHER YOU FEEL (on top of 11-weather-ways.js):
//    hail   a storm of Kindling, Emberfall or Ashrest. Out in the open the stones hurt, a couple of points at a time,
//           and bounce off the ground; creatures caught out take it too. Under a roof or underground you are safe
//    rain   drops gather on the screen and run down it while you stand out in it
//    snow   the cold builds while you stand out in it: frost creeps in at the screen's edges, then it starts to
//           hurt. A fire, a torch in hand, warm clothes or a WARM meal keep it off; a roof or the ground slows it
//  EFFECTS: PLAIN (and FPS MODE) leave the drops off the screen.
// ============================================================
const wxHail = () => seasonOn() ? wxA('hail') : 0;
const LENS = [];
function tickWeatherYouFeel() {
  const p = G.p; if (!p || G.state !== 'play' || WORLD.arena) { LENS.length = 0; return; }
  const out = p.shel === false && !p.dead, rain = wxRain(), hail = wxHail(), snow = wxSnow();
  // hail: now and then a stone finds whoever is out in it
  if (hail > .25) {
    for (const f of G.fighters) {
      if (f.dead || f.remote || f.noHit || f.shel !== false || Math.random() >= .011 * hail) continue;
      if (hurtFighter(f, 3 + (Math.random() < .4 ? 1 : 0), f.x + 3 + frand(-3, 3), { env: 1 })) {
        if (near(f)) sfx('clink', 30); burst(f.x + 3, f.y, 4, ['#ffffff', '#dcf7f5'], 1.2, 14, { g: .2 });
        if (f === G.p && !G.flags.saidHail) { G.flags.saidHail = 1; say('Hail! Get under a roof, or underground.'); }
      }
    }
    if (G.time % 30 === 0 && !netGuest()) for (const e of G.enemies) if (!e.dead && !e.noHit && !e.boss && e.type !== 'dummy' && Math.random() < .08 * hail && !wxCovered(e.x + e.w / 2, e.y)) damageEnemy(e, 2, 0, 0, { dot: 1, col: '#dcf7f5' });
  }
  // rain on the screen: drops gather while you are out in it, some run, and they dry once you are under cover
  const lens = SETTINGS.fx !== 'plain' && !SETTINGS.fpsMode;
  if (lens && out && rain > .15 && LENS.length < 44 && Math.random() < rain * .45) { const q = Math.random(); LENS.push({ x: frand(VS.uw), y: frand(VS.uh * .8), r: q < .15 ? 3 : q < .5 ? 2 : 1, vy: 0, run: Math.random() < .35, life: 220 + frand(260) }); }
  for (let i = LENS.length - 1; i >= 0; i--) { const d = LENS[i]; d.life -= out && rain > .15 && lens ? 1 : 5; if (d.run) { d.vy = min(1.1, d.vy + .015); d.y += d.vy; } if (d.life <= 0 || d.y > VS.uh + 6) LENS.splice(i, 1); }
  // the cold of the snow (the frozen world keeps its own: 7-new-worlds.js)
  if (!DIM && G.time % 10 === 0) {
    if (p.chill === undefined) p.chill = 0;
    const warm = nearWarmth(p) || (G.meal && G.meal.k === 'warm' && G.meal.t > 0), res = gearRes('cold');
    if (snow > .3 && out && !warm) p.chill = min(100, p.chill + .6 * snow * (1 - res));
    else p.chill = max(0, p.chill - (warm ? 4 : 1.2));
    if (p.chill >= 100 && G.time % 120 === 0 && !p.dead) { hurtFighter(p, 2, p.x + 3, { env: 1 }); applyStatus(p, 'frost', null, { d: 50 }); if (!G.flags.saidSnowCold) { G.flags.saidSnowCold = 1; say('The snow has got into you. A fire, a torch, or a roof.'); } }
  }
}
// drops on the screen, and frost at its edges
function drawWeatherYouFeel(c) {
  const p = G.p; if (!p) return; const uw = VS.uw, uh = VS.uh;
  if (!DIM && p.chill > 30) { const a = clamp((p.chill - 30) / 70, 0, 1) * .38, g = c.createRadialGradient(uw / 2, uh / 2, min(uw, uh) * .32, uw / 2, uh / 2, max(uw, uh) * .72); g.addColorStop(0, 'rgba(210,240,255,0)'); g.addColorStop(1, `rgba(220,244,255,${a})`); c.fillStyle = g; c.fillRect(0, 0, uw, uh); }
  for (const d of LENS) {
    const a = min(1, d.life / 60) * .6, x = round(d.x), y = round(d.y); c.globalAlpha = a;
    if (d.run && d.vy > .3) { c.fillStyle = '#9ec6e6'; c.globalAlpha = a * .35; c.fillRect(x + (d.r > 1 ? 1 : 0), y - 7, 1, 7); c.globalAlpha = a; }
    // a bead of water: dark rim below, the light through it above, a glint at the top left
    const r = d.r; c.fillStyle = '#5f8fb8'; c.fillRect(x, y + 1, r + 1, r + 1); c.fillRect(x + 1, y + r + 1, max(1, r - 1), 1); c.fillStyle = '#b4d8f0'; c.fillRect(x, y, r + 1, r + 1); c.fillStyle = '#e8f6ff'; c.fillRect(x, y, 1, 1); if (r > 1) c.fillRect(x + 1, y, 1, 1);
  }
  c.globalAlpha = 1;
}
