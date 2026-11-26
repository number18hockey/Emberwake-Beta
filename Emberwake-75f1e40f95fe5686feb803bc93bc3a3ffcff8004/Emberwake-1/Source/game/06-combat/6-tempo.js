// ============================================================
//  TEMPO — a fight has a pulse, and you win by keeping it.
//
//  Every blow ends in a follow-through. Part way through it your
//  weapon GLINTS: strike again on the glint and the chain goes on,
//  the blow BITES (the foe flinches) and your TEMPO builds. Strike
//  before the glint and you have RUSHED: a weak, slow blow that
//  leaves you open and costs you tempo. So mashing loses, and a
//  steady hand wins.
//
//    TEMPO     0..5 embers that circle you. Each one makes light
//              blows hit harder. A heavy blow SPENDS them all at
//              once; at five it is a CRESCENDO.
//    CLEAN     the far edge of your reach (a spear's point, a
//              dagger in the back, a fist that beats a wind-up).
//    CLASH     swing so your blow meets theirs and theirs is
//              turned aside.
//    CAUGHT    hit while you wind up or after rushing: it hurts
//              more and your tempo is gone.
//    BROKEN    foes have a guard. Blows that bite wear it down;
//              when it breaks they reel and take more.
// ============================================================
const TEMPO_MAX = 5, TEMPO_HOLD = 210;
// how wide the glint is, by difficulty: perfect ticks, ticks after the follow-through ends, and how early a press is forgiven
const BEATS = { easy: { perf: 6, late: 15, early: 4 }, normal: { perf: 5, late: 11, early: 3 }, hard: { perf: 4, late: 8, early: 2 } };
const BEAT = () => (WORLD.arena ? BEATS.normal : BEATS[SETTINGS.diff] || BEATS.easy);
const NOTE = [392, 440, 523.25, 587.33, 659.25, 783.99];
// states in which a creature is winding up a blow: it shows, and it is the moment to answer
const TELL = new Set(['tele', 'wind', 'windup', 'aim', 'crouch', 'raise', 'curl', 'sweepTele']);

// what each family of weapons gets from keeping the beat (the forms page says so too)
const FAM_TEMPO_T = { sword: 'heavy blows spend embers best', spear: 'a clean point lights two embers', fangs: 'embers fade slowly', maul: 'a heavy that lands keeps two embers', bow: 'a head shot lights two embers', chuks: 'the glint lasts longer', brawl: 'a wider moment to clash' };
const atkSpd = a => a.tm || a.W.wsp || 1;
function atkRec(a) { return round(a.m.rec * atkSpd(a) * (a.rushed ? 1.7 : 1)) + (a.whiff ? 4 : 0); }
function beatOpen(a) { return max(2, floor(a.m.rec * atkSpd(a) * .5)); }
function beatNote(k, crisp) { if (!AC || muted) return; try { const f = NOTE[clamp(k | 0, 0, 5)]; tone('triangle', f, f, .16, .1); if (crisp) tone('sine', f * 2, f * 2, .22, .05, .01); } catch (e) { } }
Object.assign(SFX, {
  beat() { tone('triangle', 1760, 1760, .03, .035); },
  rush() { tone('square', 150, 90, .12, .08); noise(.08, .1, 500, 200, 1, 'lowpass'); },
  clash() { tone('triangle', 1250, 1180, .28, .2); tone('sine', 1880, 1760, .34, .12, .01); noise(.07, .25, 5000, 2500, 2, 'highpass'); },
  broken() { tone('sine', 220, 70, .32, .25); noise(.2, .22, 1800, 300, 1.2); tone('triangle', 880, 440, .18, .12, .03); },
  caught() { tone('sawtooth', 240, 110, .16, .1); },
  ablaze() { for (let k = 0; k < 4; k++) tone('triangle', NOTE[k + 2], NOTE[k + 2], .3, .09, k * .05); },
  crescendo() { for (const k of [0, 2, 4, 5]) tone('triangle', NOTE[k] * 2, NOTE[k] * 2, .5, .1); tone('sine', 98, 49, .5, .3); noise(.35, .3, 2400, 200, 1); }
});
// a hint the first time each thing happens, so the rules are learned by doing
function tempoHint(k, text) { if (WORLD.arena || !G.flags || G.flags['th_' + k]) return; G.flags['th_' + k] = 1; say(text); G.dirty = true; if (G.journal && !G.journal.includes('tempo')) unlock('tempo'); }

function tempoAdd(f, n) {
  const t0 = f.tempo | 0; f.tempo = clamp(t0 + n, 0, TEMPO_MAX); if (n > 0) { const W = heldOf(f); f.tempoT = TEMPO_HOLD * (W && W.set === 'fangs' ? 1.7 : 1); }
  if (f.tempo === TEMPO_MAX && t0 < TEMPO_MAX) { fsx(f, 'ablaze', 0); numPop(f.x + 3, f.y - 12, 'ABLAZE', '#ffd35a'); if (f === G.p) tempoHint('ablaze', 'ABLAZE: five embers. A heavy blow (right mouse) now spends them all in one CRESCENDO.'); }
}
function tickTempo(f) {
  if (f.tempo > 0 && !(WORLD.royale && trKeepTempo(f)) && --f.tempoT <= 0) { f.tempo--; f.tempoT = 50; }
  if (f.glintT > 0) f.glintT--; if (f.answerT > 0) f.answerT--;
}
// a press of an attack button: on the glint it carries the chain on; before it, the blow in hand is rushed
function beatPress(f, b) {
  const a = f.atk, B = BEAT();
  if (f.state === 'attack' && a) {
    if (a.rushed) return;
    if (a.phase === 2) { const open = beatOpen(a), bb = (f.bb || 0) + (a.setName === 'chuks' ? 2 : 0); if (a.pt >= open - B.early - bb) { f.buf = { b, t: B.early + bb + 4, beat: a.pt >= open && a.pt < open + B.perf + bb ? 2 : 1 }; return; } }
    // a held wind-up (charging a heavy) is a hold, not a second press
    if (a.phase === 0 && a.charge > 0 && b === a.btn) return;
    rushBlow(f, a); return;
  }
  f.buf = { b, t: 8, beat: f.state === 'normal' && (f.chainT > 0 || (f === G.p && !WORLD.arena && blessOn('cadence'))) ? 1 : 0 };   // (the Singing Stones' blessing: every chain begins in time)
}
function rushBlow(f, a) {
  a.rushed = true; a.beat = 0; f.buf = null; if (!f.noRushCost) tempoAdd(f, -2); f.rushN = (f.rushN | 0) + 1; f.stam = max(0, f.stam - 8); f.stamDelay = max(f.stamDelay | 0, 34);
  if (f === G.p) { numPop(f.x + 3, f.y - 10, 'RUSHED', '#8a8794'); sfx('rush', 60); tempoHint('rush', 'RUSHED. Hammering the button makes weak, slow blows. Strike again when your weapon glints, not before.'); if (G.drill) drillNote('rush'); }
}
// the follow-through reaches its opening: the weapon glints
function beatGlint(a) {
  const f = a.f, B = BEAT(), m = a.m, L = (ARM + a.W.len) * m.reach; let ox = a.face * 9, oy = 8;
  if (m.kind === 'swing') { const th = swingAng(a, a.act); ox = a.face * (1 + cos(th) * L * .6); oy = 6 + sin(th) * L * .6; }
  else if (m.kind === 'thrust') { ox = a.face * (1 + cos(a.th) * L * .7); oy = 6 + sin(a.th) * L * .7; }
  f.glOx = ox; f.glOy = oy; f.glintMax = f.glintT = atkRec(a) - a.pt + B.late; f.glintP = B.perf + (f.bb || 0) + (a.setName === 'chuks' ? 2 : 0);
  if (f === G.p) sfx('beat', 0);
}
// when the blow leaves the hand: a heavy one takes every ember with it
function tempoSpend(a) {
  const f = a.f; if (a.btn !== 'H' || !(f.tempo > 0) || a.m.kind === 'shot') return;
  a.spent = f.tempo; f.tempo = 0; if (a.spent >= TEMPO_MAX) { a.cresc = true; a.crit = true; fsx(f, 'crescendo', 0); if (f === G.p) { G.flash = max(G.flash, .3); G.flashCol = '255,211,90'; if (slowOK()) G.slowT = max(G.slowT, 14); } }
}
// where on the weapon the blow landed: 1 = clean, -1 = jammed, 0 = plain
function edgeOf(a, e, hx, hy) {
  const f = a.f, m = a.m, k = m.kind; if (m.style || k === 'spin' || k === 'flip' || k === 'plunge' || k === 'kick' || k === 'shot') return 0;
  const set = a.setName;
  if (set === 'fangs') { const ed = e.fighter ? e.face : e.dir; return ed && sign(e.x + e.w / 2 - (f.x + 3)) === ed ? 1 : 0; }
  if (set === 'brawl') return (e.fighter ? e.atk && e.atk.phase === 0 : TELL.has(e.state)) ? 1 : 0;
  const L = (ARM + a.W.len) * m.reach * (a.rm || 1), u = hypot(hx - (f.x + 3 + a.face), hy - (f.y + 6)) / L;
  if (set === 'spear') return u >= .64 ? 1 : u < .3 ? -1 : 0;
  if (set === 'maul') return (k === 'swing' && a.pt >= a.act * .5) || u >= .6 ? 1 : 0;
  return u >= .52 ? 1 : 0;
}
const EDGE_HINT = { sword: 'the outer half of the blade', spear: 'the point, at full reach', fangs: 'a blow in the back', maul: 'the end of the swing', chuks: 'the far end of the chain', brawl: 'a punch that beats their wind-up' };
// how a blow's damage, bite and weight follow from how it was struck
function tempoHit(a, e, edge, crit) {
  const f = a.f, m = a.m, t = f.tempo | 0;
  let k = a.spent ? 1 + .2 * a.spent + (a.cresc ? .3 : 0) : 1 + .06 * t;
  const lean = FAM_LEAN[a.setName]; if (a.spent && lean && lean.rhythm) k *= 1 + (lean.rhythm - 1) * a.spent / TEMPO_MAX;
  if (a.beat === 2) k *= 1.1; if (a.rushed) k *= .7; if (edge > 0) k *= 1.15; else if (edge < 0) k *= .7;
  if (a.perfect) k *= 1.2; if (f.answerT > 0) k *= 1.25;
  const bite = !a.rushed && edge >= 0 && (a.beat > 0 || f.answerT > 0 || !!a.perfect || a.btn === 'H' || !!m.big || !!m.stagger || !!m.launch || edge > 0 || !!crit || !!m.dash || !!m.style || !!m.pair || m.kind === 'plunge' || !!a.forced);
  let pz = (a.btn === 'H' ? 2 : 1) * (a.beat ? 1.4 : 1) * (edge > 0 ? 1.5 : 1) * (1 + .12 * t) * (a.spent ? 1 + .3 * a.spent : 1) * (m.blunt || a.setName === 'maul' ? 1.3 : 1) * (a.rushed ? .4 : 1);
  return { k, bite, pz };
}
// after a blow lands: tempo, the note, the words
function tempoLanded(a, e, edge, dmg, hx, hy) {
  const f = a.f, P0 = f === G.p, first = !a.hit; a.lastEdge = edge;
  if (edge > 0 && first) { G.trails.push({ kind: 'hit', x: hx, y: hy, life: 7, max: 7, a: PI / 4, big: true }); sparks(hx, hy, 6, 0, 2.6, ['#fff1a8', '#ffffff']); if (P0) { tempoHint('clean', 'CLEAN. Where a weapon lands matters: with this one, ' + (EDGE_HINT[a.setName] || 'the far edge of your reach') + ' hits harder and breaks guards faster.'); a.lastEdge = 1; } }
  else if (edge < 0 && first && P0) numPop(hx, hy - 10, 'JAMMED', '#8a8794');
  if (f.answerT > 0 && first) { f.answerT = 0; if (P0) numPop(hx, hy - 14, 'ANSWER', '#8ff5e6'); }
  if (a.spent && first && a.setName === 'maul') { f.tempo = max(f.tempo | 0, min(2, a.spent)); f.tempoT = TEMPO_HOLD; }
  if (first && a.beat > 0) {
    tempoAdd(f, 1 + (a.setName === 'spear' && edge > 0 ? 1 : 0)); if (P0) { beatNote(f.tempo, a.beat === 2); if (a.beat === 2) { if (G.time - (f.wordT || -99) > 50) { f.wordT = G.time; numPop(f.x + 3, f.y - 10, 'CRISP', '#fff1a8'); } sparks(f.x + 3 + (f.glOx || 0), f.y + (f.glOy || 6), 5, 0, 1.8, ['#ffffff', '#fff1a8']); f.stam = min(f.maxstam, f.stam + 4); tempoHint('crisp', 'CRISP: struck right on the glint. Blows in time bite, and each one lights an ember. Embers make every blow hit harder.'); } }
  }
  if (a.cresc && first) { numPop(hx, hy - 16, 'CRESCENDO', '#ffd35a', 2); addShake(7); G.trails.push({ kind: 'ring', x: hx, y: hy, r: 46, life: 14, max: 14 }); burst(hx, hy, 34, ['#ffd35a', '#fff1a8', '#ff8a3d', '#ffffff'], 3.6, 34, { glow: 1, g: .02 }); if (P0) G.hitstop = max(G.hitstop, 9); }
  else if (a.spent && first && P0) numPop(hx, hy - 14, 'x' + (1 + .2 * a.spent).toFixed(1), '#ffd35a');
  // in the Trials the crowd rewards clean fighting
  if (P0 && first && WORLD.royale) brFavor(a.cresc ? 10 : a.beat === 2 ? 2 : edge > 0 || a.beat ? 1 : 0);
}
// the blow is over without touching anything: a wasted swing costs an ember and a moment
function tempoWhiff(a) {
  const f = a.f; if (a.hit || a.dug || a.clashed || a.m.kind === 'shot' || a.m.style) return;
  a.whiff = true; if (f.tempo > 0 && !a.spent) tempoAdd(f, -1); f.stam = max(0, f.stam - 4);
}

// ---------------- CLASH: your blow meets theirs ----------------
function tryClash(f, dmg, fromX, o) {
  const a = f.atk; if (!a || a.rushed || o.env || o.link || o.dot || o.noClash || a.m.kind === 'shot' || f.clashAt === G.time) return false;
  const wind = round(a.m.wind * atkSpd(a));
  if (!(a.phase === 1 ? true : a.phase === 0 && a.pt >= wind - (a.setName === 'brawl' ? 5 : 2) && !a.charge)) return false;
  const fx = f.x + 3; if (fromX !== undefined && abs(fromX - fx) > 4 && sign(fromX - fx) !== a.face && a.m.kind !== 'spin' && a.m.kind !== 'flip') return false;
  a.clashed = true; f.clashAt = G.time; f.inv = max(f.inv, 16); f.answerT = 60; tempoAdd(f, 1); f.stam = min(f.maxstam, f.stam + 12);
  const by = o.by, hx = fx + a.face * 9, hy = f.y + 8;
  if (by && by.fighter) { by.atk = null; by.state = 'normal'; by.buf = null; by.hurtT = max(by.hurtT, 16); by.vx = a.face * 2.6; by.vy = min(by.vy, -1); if (by.tempo > 0) tempoAdd(by, -1); }
  else if (by && by.hp !== undefined && !by.dead) {
    const root = by.root || by; if (!root.noKb && !root.boss) { by.vx = a.face * 2.4 * (1 - (by.kbRes || 0)); by.stun = max(by.stun || 0, 18); if (TELL.has(by.state) || by.state === 'swing' || by.state === 'lunge' || by.state === 'pounce' || by.state === 'leap' || by.state === 'swoop') { by.state = by.fly ? 'idle' : 'chase'; by.t = 0; } }
    poiseHit(root, (root.mpz || max(10, root.maxhp * .55)) * .5, {});
  }
  sparks(hx, hy, 14, a.face, 3.2, ['#ffffff', '#fff1a8', '#8ff5e6']); G.trails.push({ kind: 'ring', x: hx, y: hy, r: 16, life: 8, max: 8 }, { kind: 'hit', x: hx, y: hy, life: 7, max: 7, a: 0, big: true });
  numPop(fx, f.y - 12, 'CLASH', '#8ff5e6'); fsx(f, 'clash', 0);
  if (f === G.p || by === G.p) { G.hitstop = max(G.hitstop, 6); addShake(3.5); }
  if (WORLD.royale && !BR.wild) { if (f === G.p) BR.st.clash = (BR.st.clash | 0) + 1; if (by && !by.dead && (trAmps(f, a.W) || []).includes('thorn')) strike(f, by, 10, a.face * 2, -1, { stop: 2 }); }
  if (f === G.p) { comboHit(true); if (WORLD.royale) brFavor(6); tempoHint('clash', 'CLASH. Your blow met theirs and turned it aside. Time a swing into an attack and it cannot hurt you.'); if (G.drill) drillNote('clash'); }
  return true;
}
// caught in a wind-up or after a rushed blow: it costs more
function caughtOpen(f, o) { const a = f.atk; return !o.env && !o.dot && !!a && (a.phase === 0 || !!a.rushed); }

// ---------------- GUARD: what a foe can take before it reels ----------------
function poiseOf(root) { if (root.mpz === undefined) { root.mpz = root.boss ? max(60, root.maxhp * .09) : max(10, root.maxhp * .55); root.pz = root.mpz; } return root.mpz; }
function hasPoise(root) { return !(root.type === 'keeper' || root.type === 'boss' || root.type === 'dummy' || root.type === 'fist' || root.maxhp < 28 || root.ghost); }
function poiseHit(root, amt, o) {
  if (!hasPoise(root) || root.stagT > 0 || root.dead || root.invuln) return false; poiseOf(root);
  root.pz -= amt; root.pzT = 150; if (root.pz > 0) return false;
  root.pz = root.mpz; root.sundered = false; root.stagT = root.boss ? 60 : 85; if (!root.boss && !root.noKb) { root.stun = max(root.stun || 0, root.stagT); if (TELL.has(root.state) || root.state === 'swing') { root.state = root.fly ? 'idle' : 'chase'; root.t = 0; } }
  numPop(root.x + root.w / 2, root.y - 10, 'BROKEN', '#ffd35a'); sfx('broken', 0); addShake(3); G.hitstop = max(G.hitstop, 5);
  burst(root.x + root.w / 2, root.y + root.h * .4, 16, ['#ffd35a', '#fff1a8', '#ffffff'], 2.6, 26, { glow: 1 });
  tempoHint('broken', 'BROKEN. Its guard gave way: it reels, and every blow now hurts it more. Blows in time and heavy blows break guards fastest.');
  return true;
}
function tickPoise(e) {
  if (e.pzT > 0) e.pzT--; else if (e.mpz !== undefined && e.pz < e.mpz) e.pz = min(e.mpz, e.pz + e.mpz * .012);
  if (e.stagT > 0) { e.stagT--; if (G.time % 6 === 0) P(e.x + e.w / 2 + cos(G.time * .2) * (e.w / 2 + 3), e.y - 3 + sin(G.time * .4) * 1.5, 0, -.2, 14, fpick(['#ffd35a', '#fff1a8']), { glow: 1, g: 0 }); return !!e.boss; }
  return false;
}
// an arrow: the head counts, and so does shooting in time
function arrowStrike(pr, ow, e) {
  const head = pr.type === 'arrow' && e.h >= 10 && pr.y < e.y + e.h * .3 && !e.root, k = (head ? 1.35 : 1) * (pr.tk || 1);
  if (head && ow === G.p) { numPop(pr.x, pr.y - 8, 'HEAD', '#fff1a8'); tempoHint('head', 'HEAD. An arrow that lands high hits a third harder.'); }
  if ((pr.beat || head) && !pr.tempoed) { pr.tempoed = true; tempoAdd(ow, head ? 2 : 1); if (ow === G.p) beatNote(ow.tempo, pr.beat === 2); }
  return { dmg: max(1, round(pr.dmg * k)), bite: !!pr.beat || head || !!pr.stagger || (pr.stop || 0) >= 5, pz: (pr.beat ? 1.4 : 1) * (head ? 1.5 : 1), gb: head };
}

// SUNDER: a heavy blow on a foe whose guard is broken. Once for each time it reels.
function tempoSunder(a, e, hx, hy) {
  const f = a.f; numPop(hx, hy - 18, 'SUNDER', '#ffd35a', 2); addShake(6); sfx('broken', 0); sfx('crit', 0); G.trails.push({ kind: 'ring', x: hx, y: hy, r: 30, life: 12, max: 12 }, { kind: 'hit', x: hx, y: hy, life: 8, max: 8, a: PI / 4, big: true });
  burst(hx, hy, 26, ['#ffd35a', '#fff1a8', '#ffffff'], 3.4, 30, { glow: 1 }); f.stam = min(f.maxstam, f.stam + 25); tempoAdd(f, 2);
  if (f === G.p) { G.hitstop = max(G.hitstop, 8); if (slowOK()) G.slowT = max(G.slowT, 10); tempoHint('sunder', 'SUNDER. A heavy blow on a foe whose guard is broken hits half again as hard, and gives back stamina and two embers. Break them, then finish it.'); }
}
// WARDED foes carry a shield: plain blows from the front glance off. Heavy, clean and critical blows get through,
// and so does anything from behind. Breaking its guard drops the shield while it reels.
function wardRoll(e) {
  if (WORLD.arena || e.boss || e.fly || e.root || e.elder || !hasPoise(e) || e.maxhp < 40 || e.maxhp > 600 || e.type === 'golem' || e.type === 'rustback' || e.type === 'serpent' || e.type === 'lurker') return;
  if (Math.random() < (DIM ? .16 : .08) * (wt('shields') ? 3 : 1)) { e.warded = true; e.name = 'Warded ' + (e.name || 'foe'); e.hp = e.maxhp = round(e.maxhp * 1.15); }
}
function wardGlance(e, root, kx, o) {
  if (!root.warded || root.stagT > 0 || o.dot || o.gb || o.thorn || !kx || sign(kx) !== -(e.dir || 1)) return false;
  const x = e.x + e.w / 2 - (e.dir || 1) * -(e.w / 2 + 2), y = e.y + e.h * .45; sparks(x, y, 7, sign(kx) * -1, 2.2, ['#e8edf2', '#aab3c2', '#ffffff']);
  if (G.time - (root.glT || -99) > 40) { root.glT = G.time; numPop(e.x + e.w / 2, e.y - 8, 'GLANCED', '#aab3c2'); sfx('reflect', 60); }
  tempoHint('warded', 'WARDED. Its shield turns plain blows from the front. A heavy blow, a clean one, or anything from behind gets through. Break its guard and the shield drops.');
  return true;
}
function drawWard(c, e, x, y) {
  if (!e.warded || e.dead) return; const d = e.dir || 1, sx = round(x + e.w / 2 + d * (e.w / 2 + 2)), sy = round(y + e.h * .3), down = e.stagT > 0;
  c.globalAlpha = down ? .35 : 1; c.fillStyle = INK; c.fillRect(sx - 2, sy - 1, 5, 9); c.fillStyle = '#aab3c2'; c.fillRect(sx - 1, sy, 3, 6); c.fillRect(sx, sy + 6, 1, 1); c.fillStyle = '#e8edf2'; c.fillRect(sx - 1, sy, 1, 5); c.fillStyle = '#ffd35a'; c.fillRect(sx, sy + 2, 1, 2); c.globalAlpha = 1;
}

// ---------------- drawing ----------------
// the embers of tempo circle whoever holds them: you can read a rival's as easily as your own
function drawTempo(c, f, rx, ry) {
  const n = f.tempo | 0; if (n <= 0 || f.dead) return; const full = n >= TEMPO_MAX, t = G.time * (full ? .16 : .09);
  for (let k = 0; k < n; k++) {
    const an = t + k / TEMPO_MAX * TAU, x = round(rx + cos(an) * 11), y = round(ry - 12 + sin(an) * 4), back = sin(an) < 0;
    // a soft glow, then the ember: a small bright cross with a white heart
    c.globalAlpha = back ? .12 : .28; c.fillStyle = full ? '#fff1a8' : '#ff8a3d'; c.fillRect(x - 2, y - 2, 5, 5);
    c.globalAlpha = back ? .5 : 1; c.fillStyle = INK; c.fillRect(x - 1, y - 2, 3, 5); c.fillRect(x - 2, y - 1, 5, 3);
    c.fillStyle = full ? '#fff1a8' : '#ff8a3d'; c.fillRect(x, y - 1, 1, 3); c.fillRect(x - 1, y, 3, 1); c.fillStyle = full ? '#ffffff' : '#ffd35a'; c.fillRect(x, y, 1, 1);
  }
  c.globalAlpha = 1;
  if (full && G.time % 3 === 0) P(rx + frand(-5, 5), ry - frand(2, 18), frand(-.2, .2), -.7, 16, fpick(['#ffd35a', '#ff8a3d', '#fff1a8']), { glow: 1, g: -.01 });
}
// the glint: bright while the timing is perfect, then fading until the chance is gone
function drawGlint(c, f, rx, ry) {
  if (!(f.glintT > 0) || f.dead) return; const el = f.glintMax - f.glintT, crisp = el < f.glintP, x = round(rx + f.glOx), y = round(ry - f.h + f.glOy), s = crisp ? 4 : 2;
  c.globalAlpha = crisp ? 1 : clamp(f.glintT / max(1, f.glintMax - f.glintP), .15, .8); c.fillStyle = crisp ? '#ffffff' : '#ffd35a';
  c.fillRect(x - s, y, s * 2 + 1, 1); c.fillRect(x, y - s, 1, s * 2 + 1); if (crisp) { c.fillStyle = '#fff1a8'; c.fillRect(x - 1, y - 1, 3, 3); c.fillStyle = '#ffffff'; c.fillRect(x, y, 1, 1); }
  c.globalAlpha = 1;
}
// five pips beside your health: the same embers, where a glance finds them
function drawTempoHud(c, p, x, y) {
  const n = p.tempo | 0, full = n >= TEMPO_MAX;
  for (let k = 0; k < TEMPO_MAX; k++) { const on = k < n, px = x + k * 6; c.fillStyle = INK; c.fillRect(px, y, 5, 5); c.fillStyle = on ? (full ? ((G.time >> 2) & 1 ? '#ffffff' : '#fff1a8') : '#ff8a3d') : '#2a2438'; c.fillRect(px + 1, y + 1, 3, 3); if (on && !full) { c.fillStyle = '#ffd35a'; c.fillRect(px + 2, y + 1, 1, 1); } }
  if (full && (G.time >> 3) & 1) textS(c, 'RMB: CRESCENDO', x - textW('RMB: CRESCENDO') - 4, y - 1, '#ffd35a');
}
// a foe winding up shows it; a foe's guard shows under its health once it has been tested
function drawTell(c, e, x, y) {
  if (!TELL.has(e.state) || e.dead || e.stun > 0) return; const bx = round(x + e.w / 2), by = round(y - 9 - (e.boss ? 6 : 0)), on = (G.time >> 2) & 1;
  c.fillStyle = INK; c.fillRect(bx - 2, by - 5, 4, 8); c.fillStyle = on ? '#ffffff' : '#ff6b6b'; c.fillRect(bx - 1, by - 4, 2, 4); c.fillRect(bx - 1, by + 1, 2, 1);
}
function drawPoise(c, e, x, y) {
  if (e.mpz === undefined || e.root || e.boss) return; const st = e.stagT > 0; if (!st && e.pz >= e.mpz) return;
  c.fillStyle = INK; c.fillRect(x - 1, y + 2, 14, 2); c.fillStyle = st ? ((G.time >> 2) & 1 ? '#ffffff' : '#ffd35a') : '#e0a020'; c.fillRect(x, y + 2, st ? 12 : max(1, round(12 * clamp(e.pz / e.mpz, 0, 1))), 1);
}
