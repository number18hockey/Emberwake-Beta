// ============================================================
//  WHAT THE WEATHER DOES. The sky itself belongs to the year (rain
//  and snow, 9-the-year.js) and to the events (a thunderstorm, the
//  long fog, ashfall). This is how it feels to be out in it:
//    rain, a thunderstorm   slow going, slick ground, creatures see a little less far, fire dies quickly
//    snow                   slow going, slick ground, and your breath comes back slower
//    ashfall                a little slower, and short of breath
//    the long fog           creatures see about half as far
//    a thunderstorm's wind  bends an arrow or a thrown thing, shoves whoever is in the air, helps a run with it and hinders one against it
//    lightning              sets fire to what it strikes, likes a tall tree and can bring it down
//  Under a roof or below ground none of it reaches you. Under a clear
//  sky, in an arena, in the other worlds and on the title every factor
//  here is exactly 1 and nothing happens.
// ============================================================
const wxEv = id => G.ev && G.ev.id === id ? G.ev.fade : 0;
// how hard each kind is coming down, 0 to 1 (a thunderstorm rains as well)
const wxRain = () => seasonOn() ? max(wxA('rain'), wxEv('thunder')) : 0, wxSnow = () => seasonOn() ? wxA('snow') : 0;
const wxAsh = () => seasonOn() ? wxEv('ashfall') : 0, wxFog = () => seasonOn() ? wxEv('fog') : 0, wxThunder = () => seasonOn() ? wxEv('thunder') : 0;
// is there rock or a roof over this spot?
function wxCovered(x, y) {
  const tx = floor(x / T), ty = floor(y / T); if (!inW(tx, max(0, ty))) return false; if (ty > SKYL[tx] + 2) return true;
  for (let k = 1; k < 36 && ty - k >= 0; k++) if (TP[tiles[(ty - k) * WW + tx]].solid) return true; return false;
}
// the wind of a thunderstorm. It blows the way the storm's rain already leans (to the left), so a host and their guests
// feel the same one; under any other sky it is exactly 0
const wxWind = () => -.5 * wxThunder() || 0;
const wxWetAt = (x, y) => wxRain() > .35 && !wxCovered(x, y);
// what it does to a pair of legs (f.shel is false only for someone standing out in it; mired legs are slow under any sky).
// md is the way they are trying to go: with the wind is a little easier, against it harder
function wxSpeed(f, md) {
  const k = f.mire > 0 ? .66 : 1; if (f.shel !== false) return k; const w = wxWind(), aw = abs(w);
  return k * (1 - .16 * wxRain() - .14 * wxSnow() - .07 * wxAsh()) * (md && aw > .12 ? sign(w) === md ? 1 + .09 * aw : 1 - .17 * aw : 1);
}
const wxSlick = f => f.shel === false && wxRain() + wxSnow() > .3 ? .62 : 1;
const wxBreath = f => f.shel === false ? 1 - .15 * wxSnow() - .1 * wxAsh() : 1;
// fog and rain hide you from what hunts by eye
const wxSight = () => G.p && G.p.shel === false ? 1 - .5 * wxFog() - .12 * wxRain() : 1;
// the things that come out in it keep their own time (see 08-creatures/7-weather-creatures.js)
const WXW = { form: '', mobT: 0 };
function tickWeatherWays() {
  const p = G.p; if (!p) return;
  for (const f of G.fighters) if (f.mire > 0 && !f.remote) f.mire--;
  const rain = wxRain(), wind = wxWind(), aw = abs(wind);
  if (rain + wxSnow() + wxAsh() + wxFog() > 0) for (const f of G.fighters) {
    if (f.dead) continue;
    // who is out in it: looked at afresh a few times a second
    if (f.shel === undefined || (G.time + (f.botI | 0)) % 14 === 0) f.shel = wxCovered(f.x + 3, f.y);
    if (rain > .4 && !f.shel && !f.remote && f.st && f.st.burn > 0) f.st.burn = max(0, f.st.burn - 2);
    // the wind takes whoever is off the ground and out of shelter (never past a fair running speed)
    if (aw > .15 && !f.shel && !f.remote && !f.onGround && f.state !== 'dodge' && !f.climbing) { const gl = f.glide || f.gliding, lim = gl ? 3.4 : 2.4, v = f.vx + wind * .03 * (gl ? 1.5 : 1); if (abs(v) < lim || abs(v) < abs(f.vx)) f.vx = v; }
  }
  // and it bends whatever is shot, thrown or spat (out in the open: not down a mine or under a roof)
  if (aw > .25) for (const pr of G.projs) if ((pr.type === 'arrow' || pr.type === 'flask' || pr.type === 'pellet' || pr.type === 'javelin' || pr.type === 'glob') && pr.t % 2 === 0 && !wxCovered(pr.x, pr.y)) pr.vx += wind * .018;
  if (netGuest()) return;
  const form = wxForm(); if (form !== WXW.form) { WXW.form = form; if (form) WXW.mobT = 60 * frand(14, 30); }
  if (form && --WXW.mobT <= 0) { WXW.mobT = 60 * frand(22, 44); if (!p.dead && Math.random() < .5) wxMob(form); }
  if (G.time % 60 === 0) wxMobLeave();
}
// a thunderstorm's bolt likes a tall tree: half the time it leaves the ground it had picked for one standing within its reach
function wxBoltTree(best, ptx) { const L = []; for (const tx of treeTops.keys()) if (abs(tx - ptx) <= 40) L.push(tx); return L.length && Math.random() < .5 ? fpick(L) : best; }
// a thunderstorm's lightning sets light to what it strikes (a rod takes the bolt to earth, and a guardian's lightning is its own affair),
// and a struck tree comes down more often than not
function wxStruck(z) {
  if (z.rod || z.net || G.boss || wxThunder() <= 0) return; lightFire(z.x, z.y - 2, 13, 170, null);
  const tx = floor(z.x / T), top = treeTops.get(tx); if (!top || netGuest() || Math.random() >= .55) return;
  let y = top.y; while (y < WH - 2 && TP[tileAt(tx, y + 1)].stalk) y++; if (TP[tileAt(tx, y)].stalk) fell(tx, y, Math.random() < .5 ? 1 : -1);
}
