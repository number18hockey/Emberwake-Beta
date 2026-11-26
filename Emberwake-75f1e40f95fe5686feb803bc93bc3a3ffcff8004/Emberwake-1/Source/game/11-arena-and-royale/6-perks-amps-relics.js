// ============================================================
//  THE TRIALS' OWN KIT. None of this exists in the world outside.
//
//    PERKS   what you are. Pick one of three on the plinth, and one
//            more at each dawn you live to see. They stack into a build.
//    AMPS    what your weapon is. Small charms found in chests: hold
//            one and click to fit it to your weapon (two sockets).
//            They change what timed, clean and crisp blows do.
//    RELICS  six named weapons, one for each family, with two amps
//            forged in. They come only with the feast, the barge and
//            the crowd's gifts.
//
//  Everything works on other people as well as on echoes: what a blow
//  does is decided on the attacker's computer and sent with the blow.
// ============================================================
const TR_PERKS = {
  fleet: { n: 'FLEET', d: 'You run a tenth faster.' },
  gut: { n: 'IRON GUT', d: 'Hunger comes on half as fast, and every meal mends you.' },
  eyes: { n: 'NIGHT EYES', d: 'You see far in the dark. Hollow Ones pass you by unless you are close.' },
  scav: { n: 'SCAVENGER', d: 'Chests give one thing more. Bushes give double.' },
  tinker: { n: 'TINKER', d: 'Reforging costs 1 scrap less. Your weapons take a third amp.' },
  wind: { n: 'SECOND WIND', d: 'Once a match, a killing blow leaves you standing at 1 health.' },
  crowd: { n: 'CROWD FAVORITE', d: 'You win favor half again as fast.' },
  ash: { n: 'ASHWALKER', d: 'The ashfall (or the slag) hurts you half as much.' },
  blood: { n: 'BLOODRUSH', d: 'A takedown gives back 30 health and all your stamina.' },
  steady: { n: 'STEADY HANDS', d: 'The glint lasts longer for you. Rushing costs no tempo.' },
  medic: { n: 'FIELD MEDIC', d: 'You rekindle teammates twice as fast. They rise with 70 health.' },
  brawl: { n: 'BRAWLER', d: 'Your bare fists hit far harder.' },
  last: { n: 'LAST EMBER', d: 'Under 35 health you hit a fifth harder and your tempo never fades.' },
  quick: { n: 'QUICKSILVER', d: 'Dodging costs half the stamina.' }
};
const TR_PERK_IDS = Object.keys(TR_PERKS), TR_BOT_PERKS = ['fleet', 'wind', 'ash', 'blood', 'last', 'quick', 'brawl'];
const TR_AMPS = {
  sear: { n: 'SEAR', col: '#ff8a3d', d: 'Blows struck in time set the foe alight.' },
  rime: { n: 'RIME', col: '#8fd0ff', d: 'Clean blows chill: the foe is slowed.' },
  leech: { n: 'LEECH', col: '#e2483b', d: 'Crisp blows give back 3 health.' },
  reach: { n: 'REACH', col: '#d8d4e6', d: 'A sixth more reach.' },
  weight: { n: 'WEIGHT', col: '#b98a5a', d: 'Blows throw foes further and break guards faster. Swings are a little slower.' },
  quick: { n: 'QUICKEN', col: '#8ff5e6', d: 'Swings come a tenth faster.' },
  echo: { n: 'ECHO', col: '#c77dff', d: 'Every third blow in time lands again a moment later.' },
  thorn: { n: 'THORN', col: '#7ddc6f', d: 'A clash hurts whoever you turned aside.' },
  kindle: { n: 'KINDLE', col: '#ffd35a', d: 'Your embers of tempo do not fade.' },
  venom: { n: 'VENOM', col: '#9a5ad0', d: 'Clean blows poison.' }
};
const TR_AMP_IDS = Object.keys(TR_AMPS);
const TR_RELICS = { sword: ['EMBERTONGUE', ['sear', 'kindle']], spear: ['LONGWATCH', ['reach', 'weight']], fangs: ['THE WHISPERS', ['venom', 'leech']], maul: ['THE ANVIL\'S ANSWER', ['weight', 'thorn']], bow: ['WIDOW\'S STRING', ['echo', 'quick']], chuks: ['STORMCOIL', ['quick', 'sear']] };
Object.assign(BR, { perks: [], offer: null, echoes: [], st: {}, windUsed: false });

// ---------------- perks ----------------
// (perks, amps and the crowd's favor belong to the Trials: in the Wilds nobody has any)
const trHas = (f, k) => !BR.wild && !!f && (f === G.p ? BR.perks.includes(k) : !!(f.perks && f.perks.includes(k)));
function trApplyPerks(f) {
  f.spd = trHas(f, 'fleet') ? 1.1 : 1; f.bb = trHas(f, 'steady') ? 3 : 0; f.noRushCost = trHas(f, 'steady'); f.dodgeCost = trHas(f, 'quick') ? .5 : 1;
}
function trOffer(why) {
  const pool = TR_PERK_IDS.filter(k => !BR.perks.includes(k) && (k !== 'medic' || BR.size > 1)); if (pool.length < 3) return;
  for (let i = pool.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
  BR.offer = { ids: pool.slice(0, 3), t: 0, max: why === 'start' ? BR_DROP + 300 : 1500, why }; sfx('ui', 0);
}
function trPick(i) {
  const o = BR.offer; if (!o) return; const k = o.ids[clamp(i | 0, 0, 2)]; BR.offer = null; if (!k || BR.perks.includes(k)) return;
  BR.perks.push(k); trApplyPerks(G.p); sfx('newmove', 0); G.banner = { text: TR_PERKS[k].n, sub: TR_PERKS[k].d, t: 40 };
}
function trOfferTick() {
  const o = BR.offer; if (!o) return; o.t++;
  if (!UI.open) { if (pressed.KeyZ) return trPick(0); if (pressed.KeyX) return trPick(1); if (pressed.KeyV) return trPick(2); }
  if (o.t >= o.max || G.p.dead) trPick((Math.random() * 3) | 0);
}
function drawOffer(c) {
  const o = BR.offer; if (!o) return; const uw = VS.uw, uh = VS.uh, cw = min(150, floor((uw - 24) / 3)), x0 = round((uw - cw * 3 - 8) / 2), y = min(round(uh * .73), uh - 76), keys1 = ['Z', 'X', 'V'];   // under your feet, so the cards never cover the Wakers on their plinths
  textC(c, o.why === 'start' ? 'CHOOSE A PERK' : 'DAWN: CHOOSE A PERK  (' + max(0, ceil((o.max - o.t) / 60)) + ')', uw / 2, y - 11, '#ffd35a', 1, textO);
  o.ids.forEach((k, i) => {
    const x = x0 + i * (cw + 4), hv = inR(x, y, cw, 40), P0 = TR_PERKS[k];
    c.fillStyle = INK; c.fillRect(x - 1, y - 1, cw + 2, 42); c.fillStyle = hv ? 'rgba(58,51,80,.95)' : 'rgba(22,17,34,.9)'; c.fillRect(x, y, cw, 40); c.fillStyle = hv ? '#ffd35a' : '#6a6485'; c.fillRect(x, y, cw, 1);
    drawText(c, '[' + keys1[i] + '] ' + P0.n, x + 4, y + 4, '#ffd35a'); wrapText(P0.d, cw - 8).slice(0, 3).forEach((l, j) => drawText(c, l, x + 4, y + 14 + j * 8, '#d8d4e6'));
    hit(x, y, cw, 40, () => trPick(i));
  });
}
// SECOND WIND: called when a blow would kill. True = it did not.
function trCheatDeath(f) {
  if (!WORLD.royale || !trHas(f, 'wind')) return false; if (f === G.p ? BR.windUsed : f.windUsed) return false;
  if (f === G.p) BR.windUsed = true; else f.windUsed = true;
  f.hp = 1; f.inv = 110; numPop(f.x + 3, f.y - 14, 'SECOND WIND', '#8ff5e6'); fsx(f, 'perfect', 0); burst(f.x + 3, f.y + 10, 24, ['#8ff5e6', '#ffffff'], 2.6, 36, { glow: 1 }); return true;
}
function trHitMul(a, f, e) { let k = 1; if (a.W.fist && trHas(f, 'brawl')) k *= 1.7; if (f.hp < 35 && trHas(f, 'last')) k *= 1.2; return k; }
function trKeepTempo(f) { if (f.hp < 35 && trHas(f, 'last')) return true; const W = heldOf(f), A = W && W.type === 'weapon' ? trAmps(f, W) : null; return !!A && A.includes('kindle'); }
function trTookDown(by, v) {
  if (!by || !trHas(by, 'blood')) return; by.hp = min(by.maxhp || 100, by.hp + 30); by.stam = by.maxstam; if (by === G.p) numPop(by.x + 3, by.y - 14, '+30', '#7ddc6f');
}

// ---------------- amps ----------------
function trKitItems() {
  const v = (a, b, c, d, e) => ({ a, b, c, d, e });
  for (const k of TR_AMP_IDS) { const A = TR_AMPS[k]; defI('amp_' + k, { name: 'Amp: ' + A.n[0] + A.n.slice(1).toLowerCase(), type: 'bramp', amp: k, stack: 3, icon: icon('stone', v('#ffffff', A.col, '#3a3450', '#17121f', '#ffffff')), desc: A.d + ' Hold it and click to fit it to your weapon.' }); }
}
// the relics are made once every weapon in the game exists, the same on every computer
function trRelics() {
  if (BR.relicsMade) return; BR.relicsMade = true; const P = brPool();
  for (const set in TR_RELICS) {
    let base = null; for (let j = 4; j >= 0 && !base; j--) base = P[j].find(id => IT[id].set === set) || null; if (!base) continue;
    const [name, amps] = TR_RELICS[set];
    defI('rel_' + set, Object.assign({}, IT[base], { id: 'rel_' + set, name: name[0] + name.slice(1).toLowerCase(), dmg: round(IT[base].dmg * 1.1), amps0: amps, relic: 1, desc: 'A relic of the Trials. ' + amps.map(k => TR_AMPS[k].n).join(' and ') + ' are forged into it.' }));
  }
}
const trRelicIds = () => Object.keys(TR_RELICS).map(s => 'rel_' + s).filter(id => IT[id]);
const trSockets = f => trHas(f, 'tinker') ? 3 : 2;
// every amp on the weapon a fighter is using
function trAmps(f, W) {
  if (!WORLD.royale || BR.wild || !W) return null; const own = f === G.p ? (inv[G.sel] && inv[G.sel].id === W.id ? inv[G.sel].amps : null) : f.amps;
  const a = [...(W.amps0 || []), ...(own || [])]; return a.length ? a : null;
}
// what the amps change before the blow is thrown
function trAmpStart(a) {
  const A = a.amps; if (!A) return;
  if (A.includes('quick')) a.tm = (a.tm || a.W.wsp || 1) * .9;
  if (A.includes('weight')) { a.tm = (a.tm || a.W.wsp || 1) * 1.06; a.kbm = 1.3; a.pzm = 1.35; }
  if (A.includes('reach')) a.rm = 1.16;
}
// and what they do when it lands
function trAmpHit(a, e, edge, dmg, hx, hy) {
  if (BR.wild) return;
  const f = a.f, A = a.amps, first = !a.ampHit; if (f === G.p && first) { const S = BR.st; S.dealt = (S.dealt | 0) + dmg; if (a.beat === 2) S.crisp = (S.crisp | 0) + 1; if (edge > 0) S.clean = (S.clean | 0) + 1; }
  a.ampHit = true; if (!A || !first || e.dead) return;
  if (A.includes('sear') && a.beat > 0) applyStatus(e, 'burn', f, { d: 96 });
  if (A.includes('rime') && edge > 0) applyStatus(e, 'frost', f, { d: 110 });
  if (A.includes('venom') && edge > 0) applyStatus(e, 'poison', f, { d: 200 });
  if (A.includes('leech') && a.beat === 2 && f.hp < f.maxhp) { f.hp = min(f.maxhp, f.hp + 3); if (f === G.p) numPop(f.x + 3, f.y - 6, '+3', '#7ddc6f'); }
  if (A.includes('echo') && a.beat > 0) { f.echoN = (f.echoN | 0) + 1; if (f.echoN % 3 === 0) BR.echoes.push({ t: 14, f, e, dmg: max(1, round(dmg * .45)), kx: a.face * .8, hx, hy }); }
}
function trEchoes() {
  for (let i = BR.echoes.length - 1; i >= 0; i--) {
    const q = BR.echoes[i]; if (--q.t > 0) continue; BR.echoes.splice(i, 1); if (q.e.dead || q.f.dead || q.e.gone) continue;
    const hx = q.e.x + 3, hy = q.e.y + 9; G.trails.push({ kind: 'ring', x: hx, y: hy, r: 10, life: 8, max: 8 }); sparks(hx, hy, 6, 0, 2, ['#c77dff', '#ffffff']);
    strike(q.f, q.e, q.dmg, q.kx, -.6, { stop: 2, hx, hy, bite: false });
  }
}
// fitting an amp: it goes to the weapon you last held
function trFitAmp(p, it) {
  let i = G.lastWeapon; if (!(inv[i] && IT[inv[i].id] && IT[inv[i].id].type === 'weapon')) i = inv.findIndex((s, k) => k < hotN() && s && IT[s.id].type === 'weapon' && !IT[s.id].fist);
  const s = inv[i], W = s && IT[s.id];
  const no = msg => { BR.note = msg; BR.noteT = 130; sfx('deny'); };
  if (!s || !W || W.type !== 'weapon' || W.fist) return no('Pick up a weapon first: amps go on weapons.');
  if (W.relic) return no('A relic has its amps forged in. It takes no more.');
  if (s.n > 1) return no('Set the spare ' + W.name + ' down first.');
  const have = s.amps || []; if (have.includes(it.amp)) return no('That weapon already has ' + TR_AMPS[it.amp].n + '.');
  if (have.length >= trSockets(p)) return no('That weapon\'s ' + trSockets(p) + ' sockets are full.');
  s.amps = [...have, it.amp]; removeItem(it.id, 1); sfx('craft', 0); numPop(p.x + 3, p.y - 12, TR_AMPS[it.amp].n + ' FITTED', TR_AMPS[it.amp].col); burst(p.x + 3, p.y + 8, 14, [TR_AMPS[it.amp].col, '#ffffff'], 2, 30, { glow: 1 }); brFavor(4);
  BR.st.amps = (BR.st.amps | 0) + 1;
}
// a weapon with amps on it keeps them when it is dropped and picked up
function trTakeAmped(d) {
  const W = IT[d.id]; if (!W) return true; let i = -1;
  for (let k = 0; k < INV_N; k++) if (!inv[k]) { i = k; break; }
  if (i < 0) return false; inv[i] = { id: d.id, n: 1, amps: d.amps.slice(0, 3) }; return true;
}
const trAmpsOk = a => Array.isArray(a) ? a.filter(k => typeof k === 'string' && TR_AMPS[k]).slice(0, 3) : null;
// pips under a weapon in the hotbar, one for each amp
function drawAmpPips(c, s, x, y) {
  if (!s || !WORLD.royale) return; const W = IT[s.id]; if (!W || W.type !== 'weapon') return; const A = [...(W.amps0 || []), ...(s.amps || [])];
  A.forEach((k, i) => { c.fillStyle = INK; c.fillRect(x + 1 + i * 5, y + 14, 5, 4); c.fillStyle = TR_AMPS[k].col; c.fillRect(x + 2 + i * 5, y + 15, 3, 2); });
  if (W.relic) { c.fillStyle = '#ffd35a'; c.fillRect(x, y, 18, 1); }
}
function trAmpLine(s) { const W = s && IT[s.id]; if (!W || W.type !== 'weapon') return ''; const A = [...(W.amps0 || []), ...(s.amps || [])]; return A.map(k => TR_AMPS[k].n).join(' + '); }

// ---------------- the match in numbers: a title, and a record kept on this computer ----------------
function trKitReset() { Object.assign(BR, { perks: [], offer: null, echoes: [], st: { t0: performance.now() }, windUsed: false }); trApplyPerks(G.p); }
function trTitle() {
  const S = BR.st, k = G.p.kills | 0;
  if (BR.winMe && k === 0) return ['THE GHOST', 'won without a single takedown'];
  if (k >= 5) return ['THE REAPER', k + ' taken down'];
  if ((S.clash | 0) >= 4) return ['THE ANSWER', S.clash + ' blows turned aside'];
  if ((S.crisp | 0) >= 20) return ['THE METRONOME', S.crisp + ' crisp blows'];
  if ((S.revives | 0) >= 2) return ['THE KEEPER OF EMBERS', S.revives + ' teammates rekindled'];
  if ((S.chests | 0) >= 12) return ['THE MAGPIE', S.chests + ' chests opened'];
  if ((S.clean | 0) >= 15) return ['THE EDGE', S.clean + ' clean blows'];
  if (BR.winMe) return ['THE LAST EMBER', 'outlasted them all'];
  return [trClock().day >= 3 ? 'THE LONG WALKER' : 'A WAKER OF THE TRIALS', 'lived to day ' + trClock().day];
}
function trCareer() { try { return Object.assign({ n: 0, w: 0, k: 0, best: 0 }, JSON.parse(localStorage.getItem('ew_trials') || '{}')); } catch (e) { return { n: 0, w: 0, k: 0, best: 0 }; } }
function trCareerSave() {
  if (BR.st.saved) return; BR.st.saved = true; BR.rewarded = false; brRewardMatch(); const C = trCareer(); C.n++; if (BR.winMe) C.w++; C.k += G.p.kills | 0; const pl = BR.place || 1; if (!C.best || pl < C.best) C.best = pl;
  try { localStorage.setItem('ew_trials', JSON.stringify(C)); } catch (e) { }
}
