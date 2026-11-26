// ============================================================
//  THE ASHFALL TRIALS: what turns a quick brawl into a long hunt.
//
//  Twelve Wakers stand on plinths round the Hearth. A horn sounds.
//  The best gear is piled at the Hearth, where everyone can see
//  everyone; the wilds are safer and poorer. From there a match runs
//  up to fourteen minutes, over three days and three nights:
//
//    HUNGER    you get hungry. Fed, you mend; starving, you fade.
//              Berries on bushes, rations in chests.
//    SCRAP     two or more at a camp anvil reforge the weapon in
//              your hand into the next better one.
//    FAVOR     the crowd is watching. Clean fighting, bold moves and
//              kills earn favor; when it fills, a sponsor's gift
//              floats down to you.
//    NIGHT     it is dark, the names of the fallen are read out, and
//              Hollow Ones walk the island until dawn.
//    THE BARGE drops supply crates twice, where everyone is told.
//    THE FEAST the sealed chests on the Hearth open half way through.
//    TEAMS     solo, duos or trios. A fallen teammate leaves an ember
//              that a friend can rekindle (hold F) for a while.
//    THE ASHFALL closes on the Hearth, so it ends where it began.
//
//  Everything here follows from the match seed and the leader's clock,
//  so every computer in a match sees the same days, drops and feast.
// ============================================================
const TR_DAY = 170, TR_NIGHT = 105, TR_CYC = TR_DAY + TR_NIGHT;
const TR_FEAST = 370, TR_DROPS = [135, 525], TR_WARN = 25, TR_RK = 45 * 60, TR_RK_HOLD = 170;
const TR_TEAMCOL = ['#ffd35a', '#5aa8ff', '#7ddc6f', '#ff6b6b', '#c77dff', '#ff9a3d', '#8ff5e6', '#ff9adf', '#c8c4d4', '#a0e060', '#e0a050', '#9ab0ff'];
const TR_SIZE_N = ['', 'SOLO', 'DUOS', 'TRIOS'], TR_SIZE_D = ['', 'every Waker for themselves', 'teams of two', 'teams of three'];
const trSec = () => max(0, BR.t - BR_DROP) / 60, trTickAt = s => BR_DROP + s * 60;
function trClock() { const s = trSec(), c = s % TR_CYC; return { day: floor(s / TR_CYC) + 1, night: c >= TR_DAY, c, left: ceil(c >= TR_DAY ? TR_CYC - c : TR_DAY - c) }; }
const trMMSS = s => { s = max(0, s | 0); return ((s / 60) | 0) + ':' + String(s % 60).padStart(2, '0'); };
Object.assign(BR, { gifts: [], fallen: [], ann: {}, drops: [], anvils: [], seenPoi: new Set(), rvSeen: new Set(), rvSeq: 0, rvOut: null, size: 1, sizeWant: 1, wish: 0, tms: [], ent: [], order: [], peds: [], nteams: 12, favor: 0 });
Object.assign(SFX, {
  cannon() { tone('sine', 90, 30, .7, .4); noise(.5, .35, 700, 60, .7, 'lowpass'); },
  horn() { for (const [f, d] of [[146.8, 0], [220, .0], [293.7, .55]]) { tone('sawtooth', f, f, 1.1, .09, d); tone('triangle', f * 2, f * 2, 1.1, .06, d); } }
});

// ---------------- teams ----------------
// the leader decides the teams; everyone else is told. One entry per fighter: the people in the roster, then the echoes.
function trMakeTeams(ids, nb, size, wish) {
  const n = ids.length + nb, nt = max(1, ceil(n / size)), cnt = new Array(nt).fill(0), out = new Array(n).fill(-1);
  ids.forEach((id, i) => { const w = (wish && wish[id]) | 0; if (size > 1 && w >= 1 && w <= nt && cnt[w - 1] < size) { out[i] = w - 1; cnt[w - 1]++; } });
  for (let i = 0; i < n; i++) if (out[i] < 0) { let t = 0; while (t < nt - 1 && cnt[t] >= size) t++; out[i] = t; cnt[t]++; }
  return out;
}
function trSetTeams(roster, nb, size, tms) {
  const ent = roster.slice(); for (let i = 0; i < nb; i++) ent.push('B' + i);
  BR.size = clamp(size | 0, 1, 3) || 1; BR.ent = ent;
  BR.tms = Array.isArray(tms) && tms.length === ent.length ? tms.map(t => clamp(num(t) | 0, 0, 11)) : trMakeTeams(roster, nb, BR.size, null);
  BR.order = ent.map((t, i) => [t, BR.tms[i], i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(e => e[0]);
  BR.nteams = new Set(BR.tms).size;
}
const trTeamI = tag => { const i = BR.ent ? BR.ent.indexOf(tag) : -1; return i < 0 ? 99 : BR.tms[i]; };
const trTeam = tag => 'T' + trTeamI(tag);
const trTagOf = f => f === G.p ? brMe() : f.botTag || f.peer || '';
const trMate = f => !!f && f !== G.p && BR.size > 1 && f.team === G.p.team && !f.hunter;
const trTeamsAlive = () => new Set(brAlive().map(f => f.team));
function trPedX(tag) { const i = BR.order ? BR.order.indexOf(tag) : -1, P = BR.peds || []; return P.length ? P[(i < 0 ? 0 : i) % P.length] : BRW >> 1; }

// ---------------- the island: the Hearth, the camps, the bushes, the drops ----------------
function trBuildHearth(cx) {
  const gy = heights[cx]; brFlat(cx - 66, cx + 66, gy); brEase(cx - 66, -1, gy); brEase(cx + 66, 1, gy);
  BR.hearth = cx; BR.hearthY = gy; BR.pois.push({ name: 'THE HEARTH', x: cx, b: brBio(cx), hearth: 1 });
  for (let x = cx - 66; x <= cx + 66; x++) for (let y = gy - 12; y < gy; y++) { const i = y * WW + x; if (tiles[i] !== BEDROCK) tiles[i] = AIR; }
  for (let s = 0; s < 3; s++) for (let x = cx - 9 + s * 2; x <= cx + 9 - s * 2; x++) tiles[(gy - 1 - s) * WW + x] = CUTSTONE;
  dyn(cx, gy - 4, CAMP); for (const ox of [-12, 12]) dyn(cx + ox, gy - 1, TORCH);
  for (const [ox, oy] of [[-8, 2], [8, 2], [-6, 3], [6, 3], [-15, 1], [15, 1]]) brChest(cx + ox, gy - oy, true, { hearth: true });
  for (const ox of [-3, 3]) brChest(cx + ox, gy - 4, true, { feast: true });
  const P = [];
  for (let k = 5; k >= 0; k--) P.push(cx - 24 - k * 7); for (let k = 0; k < 6; k++) P.push(cx + 24 + k * 7);
  for (const px of P) for (let x = px - 1; x <= px + 1; x++) tiles[(gy - 1) * WW + x] = CUTSTONE;
  BR.peds = P; reserve(cx - 70, cx + 70, 2);
}
function trCamp(cx) {
  const gy = heights[cx]; if (RESV[cx - 9] || RESV[cx + 9] || cx < 14 || cx > BRW - 15) return;
  brFlat(cx - 8, cx + 8, gy); brEase(cx - 8, -1, gy); brEase(cx + 8, 1, gy);
  for (let x = cx - 8; x <= cx + 8; x++) for (let y = gy - 5; y < gy; y++) tiles[y * WW + x] = AIR;
  dyn(cx, gy - 1, CAMP); tiles[(gy - 1) * WW + cx - 4] = ANVIL; BR.anvils.push({ x: cx - 4, y: gy - 1 });
  brChest(cx + 4, gy - 1, false); brChest(cx - 7, gy - 1, false, { kind: 'bush' }); brChest(cx + 7, gy - 1, false, { kind: 'bush' });
  BR.pois.push({ name: 'CAMP', x: cx, b: brBio(cx), camp: 1 }); reserve(cx - 10, cx + 10, 1);
}
function trBushes() {
  for (let x = 26; x < BRW - 26; x += 20 + randi(0, 14)) {
    if (RESV[x]) continue; const gy = heights[x], i = (gy - 1) * WW + x; if (abs(heights[x - 1] - gy) > 1 || abs(heights[x + 1] - gy) > 1) continue;
    if (tiles[i] !== AIR && TP[tiles[i]].decor) tiles[i] = AIR; brChest(x, gy - 1, false, { kind: 'bush' });
  }
}
// where the barge will set its crates down: inside the ground the ashfall will still have left by then
function trPlanDrops(seed) {
  const Z = brZones(seed), r = mulberry32((seed ^ 0x1f123bb5) >>> 0); BR.drops = [];
  TR_DROPS.forEach((s, k) => {
    const z = Z[k === 0 ? 1 : 3];
    for (let tries = 0; tries < 60; tries++) {
      const x = clamp(round(lerp(z[0], z[1], .12 + r() * .76) / T), 14, BRW - 14); if (abs(x - BR.hearth) < 22) continue;
      let gy = 4; while (gy < BRH - 4 && !TP[tiles[gy * WW + x]].solid) gy++; const i = (gy - 1) * WW + x; if (tiles[i] !== AIR && TP[tiles[i]].decor) tiles[i] = AIR;
      const c = brChest(x, gy - 1, true, { kind: 'drop', at: trTickAt(s) }); if (c) { BR.drops.push({ x, y: gy - 1, at: c.at, i: c.i }); break; }
    }
  });
}
const trLive = c => !(c.at && BR.t < c.at);
const trSealed = c => !!c.feast && BR.t < trTickAt(TR_FEAST);
function trLoot(c) {
  const P = brPool(), wp = k => { for (let j = k; j >= 0; j--) if (P[j].length) return fpick(P[j]); return fpick(P[0]); };
  if (c.kind === 'bush') return [['br_berries', Math.random() < .35 ? 3 : 2]];
  const amp = () => ['amp_' + fpick(TR_AMP_IDS), 1], rel = trRelicIds();
  if (c.feast) { const w = rel.length ? fpick(rel) : wp(4); return [[w, 1], amp(), ['br_draught', 1], ['br_ward', 1], ['br_ration', 2], ['br_scrap', 3], ...(IT[w].ammo ? [['arrow', 25]] : [])]; }
  if (c.kind === 'drop') { const w = rel.length && Math.random() < .5 ? fpick(rel) : wp(Math.random() < .5 ? 4 : 3); return [[w, 1], amp(), ['br_draught', 1], ['br_shard', 2], ['br_ration', 1], ['br_scrap', 2], ...(IT[w].ammo ? [['arrow', 25]] : [])]; }
  // the Hearth's first chests are good, not the best: the best comes with the feast and the barge
  const out = brLoot(c.rare && !c.hearth), r = Math.random(); if (c.hearth) { out[0] = [wp(Math.random() < .5 ? 3 : 2), 1]; if (IT[out[0][0]].ammo && !out.some(o => o[0] === 'arrow')) out.push(['arrow', 20]); out.push(['br_shard', 1]); }
  if (r < .34) out.push(['br_ration', 1]); else if (r < .62) out.push(['br_scrap', 1 + (Math.random() < .3 ? 1 : 0)]); else if (r < .74) out.push(['br_berries', 2]); else if (r < .8) out.push(['torch', 1]);
  if (Math.random() < (c.rare || c.hearth ? .4 : .13)) out.push(amp());
  return out;
}
function trItems() {
  const v = (a, b, c, d, e) => ({ a, b, c, d, e });
  defI('br_berries', { name: 'Emberberries', type: 'brfood', food: 16, use: 26, stack: 12, icon: icon('stone', v('#ffb0b0', '#e2483b', '#8f2233', '#4a1018', '#ffd0d0')), desc: 'A handful from a bush. Takes the edge off hunger.' });
  defI('br_ration', { name: 'Trail Ration', type: 'brfood', food: 42, heal: 6, use: 55, stack: 6, icon: icon('jug', v('#f0d8a8', '#c9a05a', '#8a6230', '#4a3214', '#fff1d0')), desc: 'A proper meal. Fed Wakers mend on their own.' });
  defI('br_scrap', { name: 'Scrap Iron', stack: 30, icon: icon('stone', v('#d8dce8', '#9aa0b4', '#5a6078', '#2a2e3e', '#ffffff')), desc: 'At a camp anvil (F), scrap reforges the weapon in your hand into a better one.' });
}

// ---------------- arenas ----------------
// THE ASHEN ISLE: rolling hills, and the ashfall closing from both ends.
// EMBER PEAK: one mountain with the Hearth on its summit, and a sea of slag that rises. High ground buys time.
const TR_ARENA_N = ['THE ASHEN ISLE', 'EMBER PEAK'], TR_ARENA_PICK = ['ASHEN ISLE', 'EMBER PEAK', 'EITHER'];
const trArenaPick = seed => { const w = BR.arenaWant === undefined ? 2 : BR.arenaWant | 0; return w === 2 ? (seed >>> 3) & 1 : w ? 1 : 0; };
const trHazTxt = () => BR.arena === 1 ? 'was taken by the slag' : 'fell to the ashfall';
const trHazN = () => BR.arena === 1 ? 'SLAG' : 'ASHFALL';
// where the slag stands: level with the ground at the edge of what is still dry, then on up over the summit
function trSlag() {
  if (BR.arena !== 1) { BR.slagY = 1e9; return; } const z = BR.storm, gy = x => heights[clamp(floor(x / T), 20, BRW - 21)] * T + 4;
  if (z.i >= STORM.length) { BR.slagY = max(0, (BR.slagY === undefined || BR.slagY > 1e8 ? gy(z.L) : BR.slagY) - .35); return; }
  BR.slagY = (gy(z.L) + gy(z.R)) / 2;
}
function trSlagDraw(ctx, cx, cy) {
  const y0 = BR.slagY, top = cy - 4, bot = cy + VS.vh + 8; if (y0 > bot) return; const y = max(top, y0), on = BR.storm.dps > 0;
  ctx.fillStyle = on ? `rgba(255,96,32,${.46 + .06 * sin(G.time * .05)})` : 'rgba(200,80,40,.3)'; ctx.fillRect(cx - 4, y, VS.vw + 8, bot - y);
  if (y0 >= top) { ctx.fillStyle = 'rgba(255,220,120,.85)'; for (let x = floor(cx / 6) * 6 - 6; x < cx + VS.vw + 8; x += 6) ctx.fillRect(x, round(y0 + sin(G.time * .06 + x * .09) * 1.2), 6, 1); ctx.fillStyle = 'rgba(255,150,60,.6)'; ctx.fillRect(cx - 4, y0 + 2, VS.vw + 8, 2); }
  for (let k = 0; k < 26; k++) { const bx = cx + ((hh(k, 3, 19) * 991 + G.time * (.1 + hh(k, 4, 19) * .2)) % (VS.vw + 8)), by = bot - ((hh(k, 5, 19) * 577 + G.time * (.25 + hh(k, 6, 19) * .5)) % max(1, bot - y)); ctx.fillStyle = k % 3 ? 'rgba(255,210,120,.6)' : 'rgba(255,255,220,.55)'; ctx.fillRect(round(bx), round(by), 1, 1 + (k & 1)); }
}

// ---------------- hunger ----------------
function trHunger(p) {
  if (BR.t % 60 === 0) G.food = max(0, G.food - 100 / 270 * (trHas(p, 'gut') ? .5 : 1));
  if (G.food <= 0 && BR.t % 150 === 0 && p.hp > 6) { p.hp -= 2; p.flash = 4; p.regenT = 0; numPop(p.x + 3, p.y - 6, 'STARVING', '#e0a050'); }
  if (G.food < 25 && !BR.ann.hungry) { BR.ann.hungry = 1; BR.note = 'You are hungry. Pick berries (F at a bush) or eat a ration.'; BR.noteT = 260; }
}

// ---------------- favor: the crowd, and what its sponsors send ----------------
function brFavor(n) {
  if (!WORLD.royale || BR.wild || !BR.on || !G.p || G.p.dead || BR.phase !== 'fight' || !(n > 0)) return;
  BR.favor = (BR.favor || 0) + n * (trHas(G.p, 'crowd') ? 1.5 : 1); BR.favorT = 90; if (BR.favor >= 100) { BR.favor -= 100; trGift(); }
}
function trGift() {
  const p = G.p, W = heldOf(p), k = W && W.type === 'weapon' ? brTier(W.id) : -1, P = brPool(), items = [];
  if (p.hp < 60) items.push(['br_draught', 1]); else if ((p.ward || 0) < 50) items.push(['br_ward', 1]); else items.push(['br_salve', 2]);
  if (G.food < 55) items.push(['br_ration', 2]);
  if (k < 3) { let j = min(4, k + 2); while (j > 0 && !P[j].length) j--; const same = W && W.set ? P[j].filter(id => IT[id].set === W.set) : []; const w = fpick(same.length ? same : P[j]); items.push([w, 1]); if (IT[w].ammo) items.push(['arrow', 20]); }
  else items.push(['amp_' + fpick(TR_AMP_IDS), 1]);
  BR.gifts.push({ x: clamp(p.x + 3 + frand(-26, 26), 20, BRW * T - 20), y: p.y - 170, items, t: 0 });
  G.banner = { text: 'A SPONSOR SENDS A GIFT', sub: 'the crowd likes how you fight. Look up.', t: 60 }; sfx('shrine', 0);
}
function trGifts() {
  for (let i = BR.gifts.length - 1; i >= 0; i--) {
    const g = BR.gifts[i]; g.t++; g.y += .85; g.x += sin(g.t * .05) * .25;
    if (solidAt(floor(g.x / T), floor((g.y + 6) / T)) || g.t > 900) { brDropPile(g.x, g.y, g.items); sfx('craft', 0); burst(g.x, g.y, 14, ['#ffd35a', '#fff1a8'], 1.6, 30, { glow: 1 }); BR.gifts.splice(i, 1); }
  }
}

// ---------------- the days: nightfall, dawn, the barge, the feast ----------------
function trFell(name) { if (!name) return; BR.fallen.push(name); sfx('cannon', 400); G.flash = max(G.flash, .08); G.flashCol = '255,255,255'; }
function trNightfall(day) {
  const names = BR.fallen.splice(0); G.banner = { text: 'NIGHT ' + day + ' : THE FALLEN', sub: names.length ? names.slice(0, 8).join('   ') : 'no one fell today', t: 0 }; sfx('quest', 0);
  if (!G.p.dead) brFavor(15);
  if (BR.lead) { const n = min(day + 1, 3); for (let k = 0; k < n; k++) trSpawnHunter(20 + (day - 1) * 4 + k, day); }
}
function trDawn(day) {
  G.banner = { text: 'DAY ' + day, sub: day >= 3 ? 'the ' + trHazN().toLowerCase() + ' is nearly at the Hearth' : 'the Hollow Ones burn away with the light', t: 30 }; if (!G.p.dead && BR.phase === 'fight') trOffer('dawn');
  for (const f of BR.bots.values()) if (f.hunter && !f.dead) { burst(f.x + 3, f.y + 10, 26, ['#c77dff', '#ff9adf', '#ffffff'], 2.4, 40, { glow: 1 }); if (!f.remote) { f.hp = 0; f.dead = true; f.deadT = 0; f.atk = null; } }
}
function trSpawnHunter(i, day) {
  const al = brAlive(); if (!al.length) return; const tgt = fpick(al), z = BR.storm, P = brPool();
  const f = brNewBot(i, .46 + .07 * day);
  let x = tgt.x + (Math.random() < .5 ? -1 : 1) * frand(190, 280); if (z) x = clamp(x, z.L + 20, z.R - 20); x = clamp(x, 30, BRW * T - 30);
  const tx = floor(x / T); let gy = 4; while (gy < BRH - 4 && !TP[tiles[gy * WW + tx]].solid) gy++;
  Object.assign(f, { name: 'HOLLOW ONE', skin: 11, team: 'HUNT', hunter: true, brIn: false, onBarge: false, noHit: false, hp: 55 + 15 * day, maxhp: 55 + 15 * day, wid: fpick(P[min(day, 2)].length ? P[min(day, 2)] : P[0]), x, px: x, y: gy * T - 20, py: gy * T - 20 });
  BR.bots.set(f.botTag, f); G.fighters.push(f); burst(x + 3, gy * T - 10, 24, ['#c77dff', '#3a2a50', '#ff9adf'], 2.2, 44, { glow: 1 });
}
// a Hollow One: no chests, no salves, no fear of the ashfall. It walks at the nearest Waker until dawn.
function trHunterThink(f) {
  const B = f.ai, I = B.I; I.lp = I.rp = I.jumpP = I.dodgeP = I.armP = false; I.l = I.r = false; if (f.dead) { I.md = 0; return I; }
  let best = null, bd = 1e9; for (const o of G.fighters) { if (!o.brIn || o.dead || o.onBarge || o.gone) continue; const d = abs(o.x - f.x) + abs(o.y - f.y) * 1.5; if (d > 110 && trHas(o, 'eyes')) continue; if (d < bd) { bd = d; best = o; } }
  if (!best) { I.md = 0; return I; }
  if (bd < 210) { if (B.tgt !== best) { B.tgt = best; B.retarget = 40; } return aiThink(f); }
  if (B.atkCd > 0) B.atkCd--; if (B.jumpCd > 0) B.jumpCd--; brWalk(f, I, best.x + 3, best.y + best.h); return I;
}
function trEvents() {
  const A = BR.ann;
  for (const d of BR.drops || []) {
    const near = () => { const q = BR.pois.filter(q => !q.camp).sort((a, b) => abs(a.x - d.x) - abs(b.x - d.x))[0]; return q ? q.name : 'the wilds'; };
    if (BR.t >= d.at - TR_WARN * 60 && BR.t < d.at && !A['dw' + d.i]) { A['dw' + d.i] = 1; G.banner = { text: 'THE BARGE BRINGS SUPPLIES', sub: 'near ' + near() + ', in ' + TR_WARN + ' seconds. Everyone has been told.', t: 0 }; sfx('quest', 0); }
    if (BR.t >= d.at && !A['dl' + d.i]) { A['dl' + d.i] = 1; if (BR.t < d.at + 300) { G.kfeed.unshift({ a: '', b: 'SUPPLIES', txt: 'have landed near ' + near(), t: 0 }); sfx('craft', 0); } }
  }
  const ft = trTickAt(TR_FEAST);
  if (BR.t >= ft - 30 * 60 && BR.t < ft && !A.fw) { A.fw = 1; G.banner = { text: 'A FEAST IS LAID AT THE HEARTH', sub: 'its sealed chests open in thirty seconds', t: 0 }; sfx('quest', 0); }
  if (BR.t >= ft && !A.fo) { A.fo = 1; if (BR.t < ft + 300) { G.banner = { text: 'THE FEAST IS OPEN', sub: 'the best arms on the island, for whoever dares the Hearth', t: 0 }; sfx('horn', 0); } }
}

// ---------------- rekindling a fallen teammate ----------------
// another computer's fighter went down: once per fall, the cannon sounds and (in a team) an ember is left
function trSeenDown(f) { if (!f || f.hunter || (f.fellAt !== undefined && BR.t - f.fellAt < 120)) return; f.fellAt = BR.t; trFell(f.name); if (brAlive().some(o => o.team === f.team)) trEmber(f); }
function trEmber(f) { if (BR.size < 2 || f.hunter) return; f.rk = { x: f.x + 3, y: f.y + f.h - 4, until: BR.t + TR_RK }; }
const trCanRise = f => !!f && f.dead && !!f.rk && BR.t < f.rk.until && !f.gone;
// the fallen stands up again, on whichever computer runs them
function trRise(f, hp) {
  if (!f || !f.dead || !f.rk) return; const r = f.rk; f.rk = null;
  reviveFighter(f, r.x - 3, r.y - f.h + 4); f.hp = clamp(hp | 0, 40, 70) || 40; f.ward = 0; f.inv = 120; f.brUse = null; if (f.br) { f.wid = 'fists'; f.br.heals = 0; f.br.wards = 0; f.br.chest = null; }
  burst(f.x + 3, f.y + 10, 30, ['#ffd35a', '#ff8a3d', '#fff1a8'], 2.6, 46, { glow: 1, g: -.02 }); sfx('shrine', 0);
  if (f === G.p) { BR.spec = null; BR.place = 0; BR.dl = null; G.food = max(G.food, 40); G.banner = { text: 'REKINDLED', sub: 'a teammate brought your ember back. You have nothing but your fists.', t: 30 }; }
  G.kfeed.unshift({ a: '', b: f.name, txt: 'was rekindled', t: 0 }); if (G.kfeed.length > 6) G.kfeed.length = 6;
}
// someone who can (a living teammate) calls a fallen one back
function trRekindle(t, by) {
  if (!trCanRise(t)) return;
  const hp = by && trHas(by, 'medic') ? 70 : 40;
  if (t === G.p || (t.brBot && !t.remote)) trRise(t, hp);
  else { BR.rvOut = [trTagOf(t), ++BR.rvSeq, hp]; BR.rvOutT = 240; t.rk = null; burst(t.x + 3, t.y + 10, 20, ['#ffd35a', '#fff1a8'], 2, 40, { glow: 1 }); }
}
// another computer says someone was rekindled
function trHeardRise(from, id, rv) {
  if (!Array.isArray(rv) || rv.length < 2 || typeof rv[0] !== 'string') return; const key = id + ':' + num(rv[1]); if (BR.rvSeen.has(key)) return; BR.rvSeen.add(key);
  const tag = rv[0], t = tag === brMe() ? G.p : BR.bots.get(tag); if (!t || (from && from.team !== t.team)) return;
  if (t === G.p) { if (trCanRise(t) || (t.dead && t.rk && BR.t < t.rk.until + 180)) trRise(t, rv[2]); }
  else if (BR.lead && !t.remote && t.dead && t.rk) trRise(t, rv[2]);
}
function trMyRekindle(p) {
  let t = null, bd = 18; if (!p.dead && BR.size > 1) for (const f of G.fighters) { if (f === p || f.team !== p.team || !trCanRise(f)) continue; const d = hypot(f.rk.x - (p.x + 3), f.rk.y - (p.y + p.h - 4)); if (d < bd) { bd = d; t = f; } }
  BR.rkNear = t;
  if (t && keys.KeyF && !UI.open && p.hurtT <= 0 && p.state === 'normal') { BR.rkT = (BR.rkT || 0) + 1; if (BR.rkT % 12 === 0) P(t.rk.x + frand(-4, 4), t.rk.y - frand(0, 8), 0, -.6, 22, fpick(['#ffd35a', '#ff8a3d']), { glow: 1, g: -.01 }); if (BR.rkT >= TR_RK_HOLD * (trHas(p, 'medic') ? .5 : 1)) { BR.rkT = 0; trRekindle(t, p); BR.rkNear = null; brFavor(25); BR.st.revives = (BR.st.revives | 0) + 1; } }
  else BR.rkT = 0;
}
// an echo beside a teammate's ember stays and brings them back
function trBotRekindle(f, I) {
  if (BR.size < 2) return false; let t = null, bd = 260;
  for (const o of G.fighters) { if (o === f || o.team !== f.team || !trCanRise(o)) continue; const d = abs(o.rk.x - (f.x + 3)) + abs(o.rk.y - (f.y + f.h)) * 2; if (d < bd) { bd = d; t = o; } }
  if (!t) { f.br.rkT = 0; return false; }
  // it goes to where the ember lies (up on a roof or down in a hollow, by a real route) and must stand by it
  const far = abs(t.rk.x - (f.x + 3)) > 8;
  if ((far || abs(t.rk.y + 4 - (f.y + f.h)) > 24) && (brWalk(f, I, t.rk.x, t.rk.y + 4) !== 'stuck' || far)) { f.br.rkT = 0; return true; }
  I.md = 0; if (++f.br.rkT >= TR_RK_HOLD) { f.br.rkT = 0; trRekindle(t, f); } return true;
}

// ---------------- the camp anvil ----------------
function trNearAnvil(p) { for (const a of BR.anvils || []) if (abs(a.x * T + 4 - (p.x + 3)) < 14 && abs((a.y + 1) * T - (p.y + p.h)) < 14) return a; return null; }
function trForgeCost(W) { return max(1, 2 + max(0, brTier(W.id)) - (trHas(G.p, 'tinker') ? 1 : 0)); }
function trForge(p) {
  const W = heldOf(p); if (!W || W.type !== 'weapon' || W.fist) { BR.note = 'Hold the weapon you want reforged.'; BR.noteT = 120; sfx('deny'); return; }
  const k = brTier(W.id), P = brPool(); let next = null; for (let j = k + 1; j <= 4 && !next; j++) { const same = P[j].filter(id => IT[id].set === W.set); if (same.length) next = fpick(same); }
  if (!next) { BR.note = 'That weapon is as fine as it will ever be.'; BR.noteT = 120; sfx('deny'); return; }
  const cost = trForgeCost(W); if (countItem('br_scrap') < cost) { BR.note = 'Reforging this takes ' + cost + ' scrap iron. You have ' + countItem('br_scrap') + '.'; BR.noteT = 150; sfx('deny'); return; }
  removeItem('br_scrap', cost); const s = inv[G.sel]; if (s) s.id = next;
  sfx('craft', 0); addShake(2); burst(p.x + 3, p.y + 8, 18, SPARK, 2.4, 30, { glow: 1 }); numPop(p.x + 3, p.y - 10, IT[next].name.toUpperCase(), BR_TCOL[brTier(next)]); brFavor(6);
}

// ---------------- every tick of a match ----------------
function trReset() {
  Object.assign(BR, { favor: 0, favorT: 0, gifts: [], fallen: [], ann: {}, wasNight: false, seenPoi: new Set(), rvOut: null, rvOutT: 0, rvSeq: BR.rvSeq | 0, rvSeen: new Set(), rkT: 0, rkNear: null });
  G.food = 72;
}
function trTick() {
  const p = G.p, k = trClock(); trOfferTick();
  G.clock = BR.phase === 'drop' ? .08 : k.night ? (.56 + (k.c - TR_DAY) / TR_NIGHT * .52) % 1 : lerp(.08, .56, k.c / TR_DAY);
  if (BR.phase === 'drop') { const left = ceil((BR_DROP - BR.t) / 60); if (left !== BR.cnt) { BR.cnt = left; if (left > 0 && left <= 5) sfx('beat', 0); } return; }
  if (BR.phase !== 'fight') return;
  if (k.night && !BR.wasNight) { BR.wasNight = true; if (k.c - TR_DAY < 20) trNightfall(k.day); } else if (!k.night && BR.wasNight) { BR.wasNight = false; trDawn(k.day); }
  trEvents(); trGifts(); trEchoes();
  if (!p.dead && !p.onBarge) { trHunger(p); trMyRekindle(p); }
  if (BR.rvOutT > 0 && --BR.rvOutT <= 0) BR.rvOut = null;
  if (BR.favorT > 0) BR.favorT--;
  // (a fighter shown from another computer is replayed a moment late, so give its fall time to arrive)
  for (const f of G.fighters) if (f.rk && (BR.t >= f.rk.until || (!f.dead && (!f.remote || BR.t - (f.fellAt || 0) > 60)))) f.rk = null;
  // my team is out once nobody on it is standing
  if (p.dead && !BR.place && !brAlive().some(f => f.team === p.team)) BR.place = trTeamsAlive().size + 1;
}

// ---------------- drawing: in the world ----------------
function trBush(w, px, py, picked) {
  w.fillStyle = INK; w.fillRect(px - 2, py + 1, 12, 7); w.fillStyle = '#2f6a3a'; w.fillRect(px - 1, py + 2, 10, 6); w.fillStyle = '#4a9a4e'; w.fillRect(px, py + 2, 7, 3); w.fillStyle = '#6fbf62'; w.fillRect(px + 1, py + 2, 3, 1);
  if (!picked) { w.fillStyle = '#e2483b'; for (const [ox, oy] of [[1, 4], [4, 3], [7, 5], [5, 6], [2, 6]]) w.fillRect(px + ox, py + oy, 2, 2); w.fillStyle = '#ffb0b0'; w.fillRect(px + 4, py + 3, 1, 1); w.fillRect(px + 1, py + 4, 1, 1); }
}
function trCrate(w, x, y, chute) {
  x = round(x); y = round(y);
  if (chute) { w.fillStyle = INK; w.beginPath(); w.ellipse(x, y - 15, 10, 6, 0, PI, TAU); w.fill(); w.fillStyle = '#ff7a3d'; w.beginPath(); w.ellipse(x, y - 15, 9, 5, 0, PI, TAU); w.fill(); w.fillStyle = '#ffd35a'; w.fillRect(x - 3, y - 19, 6, 1); w.fillStyle = '#d8d4e6'; w.fillRect(x - 8, y - 15, 1, 10); w.fillRect(x + 7, y - 15, 1, 10); w.fillRect(x, y - 15, 1, 10); }
  w.fillStyle = INK; w.fillRect(x - 5, y - 6, 10, 9); w.fillStyle = '#a06a3a'; w.fillRect(x - 4, y - 5, 8, 7); w.fillStyle = '#ffd35a'; w.fillRect(x - 4, y - 2, 8, 1); w.fillRect(x - 1, y - 5, 2, 7);
}
function trWorld(w, al, cx, cy) {
  // the barge crossing with a crate, and the crate coming down
  for (const d of BR.drops || []) {
    const u = (BR.t - (d.at - 20 * 60)) / (24 * 60); if (u < 0 || u > 1) continue;
    const dir = d.i & 1 ? -1 : 1, bx = d.x * T + 4 + dir * (BR.t - (d.at - 5 * 60)) * 1.6, by = BRSKY * T + 26;
    if (bx > cx - 90 && bx < cx + VS.vw + 90) brDrawBarge(w, { x: bx, y: by, dir }, al);
    if (BR.t >= d.at - 5 * 60 && BR.t < d.at) { const v = 1 - (d.at - BR.t) / 300; trCrate(w, d.x * T + 4, lerp(by + 14, d.y * T + 2, v), true); }
  }
  for (const g of BR.gifts) trCrate(w, g.x, g.y, true);
  // the embers of the fallen who can still be called back
  for (const f of G.fighters) {
    const r = f.rk; if (!r || !f.dead || r.x < cx - 20 || r.x > cx + VS.vw + 20) continue; const u = clamp((r.until - BR.t) / TR_RK, 0, 1), pul = 2 + ((G.time >> 3) & 1);
    w.globalAlpha = .35 + .4 * u; w.fillStyle = '#ff8a3d'; w.fillRect(round(r.x) - pul, round(r.y) - pul, pul * 2, pul * 2); w.globalAlpha = 1; w.fillStyle = '#fff1a8'; w.fillRect(round(r.x) - 1, round(r.y) - 1, 2, 2);
    if (G.time % 8 === 0) P(r.x + frand(-2, 2), r.y - 2, 0, -.5, 26, fpick(['#ffd35a', '#ff8a3d']), { glow: 1, g: -.01 });
  }
}
// prompts and marks, unlit, over the world
function trOverlay(ctx, al, cx, cy) {
  const p = G.p; if (p.dead || p.onBarge) return;
  const say1 = (s, X, Y, col) => textO(ctx, s, round(X - textW(s) / 2), round(Y), col || '#fff');
  const t = BR.rkNear;
  if (t && t.rk) { say1('[hold F] REKINDLE ' + t.name, t.rk.x, t.rk.y - 22, '#ffd35a'); if (BR.rkT > 0) { const X = round(t.rk.x) - 12, Y = round(t.rk.y) - 12; ctx.fillStyle = INK; ctx.fillRect(X - 1, Y - 1, 26, 4); ctx.fillStyle = '#ffd35a'; ctx.fillRect(X, Y, min(24, round(24 * BR.rkT / (TR_RK_HOLD * (trHas(p, 'medic') ? .5 : 1)))), 2); } return; }
  const ch = brNearChest(p, 22);
  if (ch) { const X = ch.x * T + 4, Y = ch.y * T - 10; if (trSealed(ch)) say1('SEALED UNTIL THE FEAST  ' + trMMSS((trTickAt(TR_FEAST) - BR.t) / 60), X, Y, '#c77dff'); else say1(ch.kind === 'bush' ? '[F] PICK' : ch.kind === 'drop' ? '[F] OPEN SUPPLIES' : '[F] OPEN', X, Y, ch.rare ? '#ffd35a' : '#fff'); return; }
  const a = trNearAnvil(p); if (a) { const W = heldOf(p), ok = W && W.type === 'weapon' && !W.fist; say1(ok ? '[F] REFORGE  (' + trForgeCost(W) + ' scrap, you have ' + countItem('br_scrap') + ')' : 'hold a weapon to reforge it', a.x * T + 4, a.y * T - 12, '#ffd35a'); }
}

// ---------------- drawing: the HUD ----------------
function trHud(c) {
  const p = G.p, uw = VS.uw, uh = VS.uh, k = trClock();
  if (BR.phase === 'drop') {
    const n = max(1, ceil((BR_DROP - BR.t) / 60)); if (!(G.banner && G.banner.t >= 0 && G.banner.t < 230)) textC(c, String(n), uw / 2, round(uh * .26), '#ffd35a', 4, textO);   // (once the match's banner has gone: the strip above counts too)
    textC(c, BR.size > 1 ? 'your team stands beside you. The best arms are at the Hearth.' : 'the best arms are piled at the Hearth. So is everyone else.', uw / 2, round(uh * .26) + 40, '#fff', 1, textO);
    if (!BR.offer) textC(c, '[F] open, pick, reforge, rekindle    [H] heal or eat    [M] map    [TAB] who is left    [R] sidearm', uw / 2, round(uh * .26) + 54, '#b9bdd0', 1, textO);   // (the keys show once you have chosen your perk)
    drawOffer(c); return;
  }
  // the day, and what is coming
  let ev = '', ec = '#fff1a8'; const ft = trTickAt(TR_FEAST);
  for (const d of BR.drops || []) if (BR.t < d.at && BR.t >= d.at - TR_WARN * 60) { ev = 'SUPPLY DROP IN ' + trMMSS((d.at - BR.t) / 60); ec = '#ffd35a'; }
  if (!ev && BR.t < ft && BR.t >= ft - 60 * 60) { ev = 'THE FEAST OPENS IN ' + trMMSS((ft - BR.t) / 60); ec = '#c77dff'; }
  textC(c, (k.night ? 'NIGHT ' : 'DAY ') + k.day + (k.night ? '   dawn in ' : '   dusk in ') + trMMSS(k.left) + (ev ? '     ' + ev : ''), uw / 2, 27, ev ? ec : k.night ? '#b49cff' : '#d8d4e6', 1, textO);
  // hunger
  if (!p.dead) { const f = G.food / 100; bar(c, 15, 26, 72, 2, f, f < .25 && (G.time >> 4) & 1 ? '#ff9a8a' : '#e0a050', '#7a4a1a'); if (f < .3) textO(c, f <= 0 ? 'STARVING' : 'HUNGRY', 91, 23, '#e0a050'); }
  // favor
  if (!p.dead) { bar(c, 15, 32, 72, 2, (BR.favor || 0) / 100, BR.favorT > 0 && (G.time >> 2) & 1 ? '#ffffff' : '#ffd35a', '#7a5a1a'); textS(c, 'FAVOR', 91, 29, BR.favorT > 0 ? '#fff1a8' : '#8b8fa3'); }
  // the team
  if (BR.size > 1) {
    let y = 40; const col = TR_TEAMCOL[trTeamI(brMe()) % TR_TEAMCOL.length];
    for (const f of G.fighters) {
      if (!trMate(f) || f.gone) continue; const down = f.dead;
      c.fillStyle = 'rgba(18,13,31,.6)'; c.fillRect(3, y, 100, 11); c.fillStyle = col; c.fillRect(3, y, 2, 11);
      drawText(c, String(f.name).slice(0, 9), 8, y + 2, down ? '#8b8fa3' : '#fff');
      if (!down) bar(c, 64, y + 4, 34, 3, f.hp / (f.maxhp || 100), '#7ddc6f', '#2f8a43'); else drawText(c, trCanRise(f) ? 'DOWN ' + trMMSS((f.rk.until - BR.t) / 60) : 'OUT', 62, y + 2, trCanRise(f) ? '#ffd35a' : '#6a6485');
      y += 13;
    }
  }
  if (BR.perks.length && !p.dead) { const hb = hotbarLayout(); let x = hb.x; for (const k of BR.perks) { const s = TR_PERKS[k].n; c.fillStyle = 'rgba(18,13,31,.7)'; c.fillRect(x - 2, hb.y + 21, textW(s) + 4, 9); drawText(c, s, x, hb.y + 22, '#8ff5e6'); x += textW(s) + 7; } }
  drawOffer(c);
  if (p.dead && trCanRise(p) && BR.phase !== 'over') textC(c, 'your ember still glows: a teammate can rekindle you  ' + trMMSS((p.rk.until - BR.t) / 60), uw / 2, round(uh * .3) + 36, '#ffd35a', 1, textO);
}
// names: your team in its colour, the Hollow Ones in violet
function trTagCol(f) { return f.hunter ? '#c77dff' : trMate(f) ? '#7ddc6f' : null; }
