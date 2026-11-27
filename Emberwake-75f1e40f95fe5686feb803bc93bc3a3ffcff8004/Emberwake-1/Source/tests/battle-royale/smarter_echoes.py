# The echoes of the Ashfall Trials think before they move: they get where they are going by a real route, open chests
# that are up on roofs and platforms, keep out of the ashfall, break away to heal where nobody can reach them, weigh a
# fight before they pick it, help a teammate, and keep the beat as well as their skill allows.
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H

# the tester takes no part: it stays on its plinth, where nobody can see or hurt it
AWAY = "G.p.onBarge = true; G.p.inv = 1e9; G.p.hp = 100; G.food = 90;"
WATCH = r"""void (() => {
  const W = window.W = { worst: 0, stuckSec: 0, ashTicks: 0, ashDeaths: 0, salves: 0, seenSalves: 0, searches: 0, ms: 0, worstMs: 0, slow: 0, ticks: 0 };
  // an echo that is trying to walk and gets nowhere is stuck (but not the one this test holds in its place for a while)
  window.watch = () => {
    W.ticks++;
    for (const f of BR.bots.values()) {
      if (f.hunter || f.dead || f.onBarge || f === W.held) continue;
      if (BR.storm && BR.storm.dps > 0 && brOut(f)) W.ashTicks++;
      // (one that is pinned to a wall, hooked or held by a foe is not stuck: it is caught)
      const s = f.st || {}, want = f.ai.I.md !== 0 && !f.brUse && f.state === 'normal' && f.hurtT <= 0 && !(s.pin > 0 || s.held > 0 || s.reel > 0 || s.hook > 0);
      if (want && abs(f.x - f._sx) < 8 && abs(f.y - f._sy) < 8) {
        if (++f._st > W.worst) { const nv = f.ai.nav || {}, c = f.br.chest; W.worst = f._st; W.who = f.name + ' at tile ' + round(f.x / T) + ',' + round((f.y + f.h) / T) + ' t=' + round(trSec()) + 's, ' + (f.onGround ? 'on the ground' : 'in the air') + ', after ' + (f.ai.tgt && !f.ai.tgt.dead && f.ai.retarget > 0 ? 'the foe ' + f.ai.tgt.name : c ? 'a chest at ' + c.x + ',' + c.y : 'a place') + ', route of ' + (nv.n | 0) + ' at ' + (nv.i | 0) + (nv.out ? ' (getting out of an updraft)' : '') + ', statuses ' + Object.keys(s).filter(k => s[k] > 0).join(' '); }
        if (f._st > 120) W.stuckSec += 1 / 60;
      }
      else { f._sx = f.x; f._sy = f.y; f._st = 0; }
    }
  };
  const death = brDeath; brDeath = function (f, by) { if (!by && f.brBot && !f.hunter) W.ashDeaths++; return death(f, by); };
  const use = brStartUse; brStartUse = function (f, id) { const ok = use(f, id); if (ok && f.brBot) { W.salves++; if (!brQuiet(f)) W.seenSalves++; } return ok; };
  const search = navSearch; navSearch = function (...a) { const t = performance.now(), r = search(...a), ms = performance.now() - t; W.searches++; W.ms += ms; if (ms > W.worstMs) W.worstMs = ms; if (ms > 8) W.slow++; return r; };
})()"""


async def beat():
    # ---- two echoes of unlike skill fight for three minutes: the clumsy one rushes more, the practised one keeps the beat ----
    h = await H().start(mode='arena')
    await h.ev("""void (() => {
      G.p.noHit = true; G.p.x = G.p.px = 20 * T; const gy = 60 * T - 20;
      // (a walled pen with a flat floor, so that nothing but their skill is being compared)
      for (let x = 58; x <= 112; x++) { for (let y = 30; y < 60; y++) tiles[y * WW + x] = x < 60 || x > 110 ? BRICK : AIR; for (let y = 60; y < WH - 3; y++) tiles[y * WW + x] = BRICK; }
      // (and the arena's own echoes are sent away and not sent for again: they spawn in the pen too, and when one of them
      // takes ten the round starts over, which sends these two back to the spawns healed of all they took)
      G.fighters = G.fighters.filter(f => !f.echoBot); G.echoT = 1e9;
      const mk = (x, team, sk) => { const f = newFighter(x * T, gy, { name: team, team, wid: 'sword', hp: 1e7, maxhp: 1e7, ai: newBrain(sk), noRegen: true }); G.fighters.push(f); return f; };
      window.LOW = mk(80, 'clumsy', .22); window.HIGH = mk(88, 'practised', .86);
      const spend = tempoSpend; tempoSpend = a => { spend(a); if (a.spent) { a.f._sp = (a.f._sp | 0) + 1; if (a.cresc) a.f._cr = (a.f._cr | 0) + 1; } };
      // dodges, and how often a foe's rushed or missed blow (an opening) is answered with a blow within two thirds of a second
      const look = (f, o) => {
        if (f.state === 'dodge' && f._was !== 'dodge') f._dg = (f._dg | 0) + 1; f._was = f.state;
        const a = o.atk; if (a && a !== f._saw && (a.rushed || a.whiff)) { f._saw = a; f._opT = G.time; f._opN = f.atkN; f._op = (f._op | 0) + 1; }
        if (f._opT && f.atkN !== f._opN) { f._an = (f._an | 0) + 1; f._opT = 0; } else if (f._opT && G.time - f._opT > 40) f._opT = 0;
      };
      window.duel = () => { look(LOW, HIGH); look(HIGH, LOW); };
    })()""")
    await h.step(10800, "G.p.noHit = true; G.p.inv = 1e9; duel();")
    r = await h.ev("[LOW, HIGH].map(f => ({ n: f.atkN, rushed: f.rushN | 0, dealt: Math.round(1e7 - (f === LOW ? HIGH : LOW).hp), spent: f._sp | 0, cresc: f._cr | 0, dodges: f._dg | 0, open: f._op | 0, ans: f._an | 0 }))")
    lo, hi = r
    print('three minutes of an echo of skill .22 against one of .86:')
    for n, d in (('clumsy', lo), ('practised', hi)):
        print('  %-9s blows %4d, rushed %3d (%.1f%%), harm done %5d, heavies that spent embers %d, of them at five embers %d' % (n, d['n'], d['rushed'], 100 * d['rushed'] / max(1, d['n']), d['dealt'], d['spent'], d['cresc']))
        print('            dodges %d; openings its foe gave it (a rushed or missed blow) %d, answered with a blow at once %d (%.0f%%)' % (d['dodges'], d['open'], d['ans'], 100 * d['ans'] / max(1, d['open'])))
    errs = [e for e in h.errs if 'agent-proxy' not in e and 'PAGEERROR' in e]
    await h.stop()
    return [('both echoes fought', lo['n'] > 60 and hi['n'] > 60),
            ('the clumsy echo rushes a larger share of its blows than the practised one', lo['rushed'] / max(1, lo['n']) > hi['rushed'] / max(1, hi['n'])),
            ('even the clumsy one mostly keeps the beat, and even the practised one is not perfect in three minutes of it', lo['rushed'] / max(1, lo['n']) < .4 and lo['rushed'] > 0),
            ('the practised echo answers more of the openings its foe gives it', hi['ans'] / max(1, hi['open']) > lo['ans'] / max(1, lo['open'])),
            ('the practised echo does more harm', hi['dealt'] > lo['dealt'])], errs


async def team():
    # ---- duos: an echo goes to the help of a mate who is fighting, and takes the same foe; and how it weighs a fight ----
    h = await H().start(mode='none')
    await h.ev("G.nick = 'TESTER'; G.skin = 0; SETTINGS.diff = 'normal'; brSolo(2); G.manual = true;")
    await h.step(BR_HORN + 60 * 24, "")
    r = await h.ev("""(() => {
      const bots = [...BR.bots.values()].filter(f => !f.dead), E = bots.find(f => bots.some(m => m !== f && m.team === f.team)), M = bots.find(m => m !== E && m.team === E.team), X = bots.find(f => f.team !== E.team);
      const w = brPool()[1][0] || brPool()[0][0], x0 = (BR.storm.L + BR.storm.R) / 2 - 400, put = (f, x) => { const tx = floor(x / T); f.x = f.px = tx * T + 1; f.y = f.py = heights[tx] * T - f.h; f.vx = f.vy = 0; while (boxHits(f.x, f.y, f.w, f.h)) f.y = f.py = f.y - T; };
      // clear the others out of the way, arm the three, and set the mate fighting the foe a good way off from E
      for (const f of bots) if (f !== E && f !== M && f !== X) put(f, x0 + 1400 + bots.indexOf(f) * 30);
      for (const f of [E, M, X]) { f.wid = w; f.hp = 100; f.br.bold = true; f.br.chest = null; f.br.heals = 0; f.br.wards = 0; f.ward = 0; }
      put(E, x0); put(M, x0 + 250); put(X, x0 + 275); window.E = E; window.M = M; window.X = X;
      const lone = brOdds(E, X); M.x -= 200; const mate = brOdds(E, X); M.x += 200; X.hp = 30; const weak = brOdds(E, X); X.hp = 100; E.hp = 30; const hurt = brOdds(E, X); E.hp = 100;
      return { odds: [lone, mate, weak, hurt].map(v => +v.toFixed(2)), d0: abs(E.x - X.x) };
    })()""")
    print('how an echo weighs a fight (above 1 it likes its chances): even', r['odds'][0], '| with a mate beside it', r['odds'][1], '| foe nearly done for', r['odds'][2], '| itself badly hurt', r['odds'][3])
    got = False
    for k in range(60):
        await h.step(10, AWAY + "M.hp = X.hp = E.hp = 100; M.lastHitBy = X; M.takenT = 200; M.ai.tgt = X; X.lastHitBy = M; X.takenT = 200;")
        if await h.ev("E.ai.tgt === X && abs(E.x - X.x) < 70"): got = True; break
    print('a mate %d px away is fighting: the echo %s after %.1f s' % (r['d0'], 'is at the same foe' if got else 'did not come', (k + 1) / 6))
    errs = [e for e in h.errs if 'agent-proxy' not in e and 'PAGEERROR' in e]
    await h.stop()
    o = r['odds']
    return [('odds: a mate beside it helps, a foe nearly done for is fancied, being badly hurt is not', o[1] > o[0] and o[2] > o[0] and o[3] < o[0] and o[3] < .7),
            ('in a team an echo goes to the help of a mate who is fighting, and takes the same foe', got)], errs


async def match():
    # ---- a whole match alone with the echoes, watched ----
    h = await H().start(mode='none')
    await h.ev("G.nick = 'TESTER'; G.skin = 0; SETTINGS.diff = 'normal'; brSolo(1); G.manual = true;")
    await h.ev(WATCH)
    info = await h.ev("({ arena: BR.arena, high: BR.chests.filter(c => !c.kind && (c.high || c.y < heights[c.x] - 3)).length, chests: BR.chests.filter(c => !c.kind).length })")
    await h.step(BR_HORN, "")
    ok = []
    # ---- a hurt echo with a salve, and an armed foe that has just hit it right beside it: it does not rub the salve in
    # there and then, it breaks away, and heals where the foe cannot get at it. (This is the first day, when echoes do not
    # hunt each other, and the foe is kept where it stands: an echo that is hunted by one as fast as itself cannot always
    # get away, and is not asked to here.) ----
    await h.step(60 * 50, AWAY + "watch();")
    await h.ev("""void (() => {
      const bots = [...BR.bots.values()].filter(f => !f.dead && !f.hunter), free = bots.filter(f => f.onGround && !f.brUse && !brOut(f)); let E = null, bd = -1;
      for (const f of free) { let d = 1e9; for (const o of bots) if (o !== f) d = min(d, abs(o.x - f.x)); if (d > bd) { bd = d; E = f; } }
      let X = null; bd = 1e9; for (const o of bots) if (o !== E && abs(o.x - E.x) < bd) { bd = abs(o.x - E.x); X = o; }
      X.x = X.px = E.x + 26; X.y = X.py = E.y; X.vx = X.vy = 0; while (boxHits(X.x, X.y, X.w, X.h)) X.y = X.py = X.y - T;
      X.wid = brPool()[1][0] || brPool()[0][0]; X.br.bold = true; X.hp = 100; X.brUse = null;
      E.wid = brPool()[0][0]; E.hp = 30; E.br.heals = 2; E.lastHitBy = X; E.takenT = 240; window.E = E; window.X = X; window.HEAL = null; window.EFROM = E.x; window.XFROM = X.x; W.held = X;
    })()""")
    for k in range(150):
        await h.step(6, AWAY + "watch(); X.x = X.px = XFROM; X.vx = 0; if (!HEAL && E.brUse) HEAL = { d: Math.round(abs(X.x - E.x) + abs(X.y - E.y)), seen: brSee(E, X), quiet: brQuiet(E), ran: Math.round(abs(E.x - EFROM)), t: W.ticks };")
        if await h.ev("E.dead || E.hp >= 50"): break
    heal = await h.ev("W.held = null, ({ h: HEAL, hp: Math.round(E.hp), dead: E.dead, heals: E.br.heals })")
    print('hurt echo (30 health, two salves, an armed foe at its side):', 'it went %d px, began its salve with the foe %d px off (26 at first; in sight: %s), health now %d' % (heal['h']['ran'], heal['h']['d'], heal['h']['seen'], heal['hp']) if heal['h'] else 'never healed: %s' % heal)
    ok.append(('a hurt echo with a salve breaks away and heals where no foe can get at it quickly', bool(heal['h']) and heal['h']['quiet'] and heal['h']['d'] > 60 and not heal['dead'] and heal['hp'] >= 50))
    stats = []; back = None
    for k in range(300):
        await h.step(300, AWAY + "watch();")
        # ---- once the ashfall has begun: an echo set down well outside the safe ground walks back into it ----
        if back is None and await h.ev("BR.phase !== 'over' && BR.storm.dps > 0 && (BR.arena === 1 || BR.storm.L > 200)"):
            back = await h.ev("""(() => {
              const Z = [...BR.bots.values()].find(f => !f.dead && !f.hunter && f.onGround && !brOut(f) && !f.brUse && !(f.takenT > 0)); if (!Z) return null;
              // (on the Ashen Isle that is beyond the ashfall's wall; on Ember Peak, down the slope below the slag's line, once
              // the slag has risen over some of the slope: until then there is nowhere to try it, and it is tried again later)
              const z = BR.storm; let tx = BR.arena === 1 ? -1 : floor((z.L - 130) / T);
              for (let d = 2; d < 200 && tx < 0; d++) for (const x of [floor(z.L / T) - d, floor(z.R / T) + d]) if (tx < 0 && x > 22 && x < WW - 22 && heights[x] * T > BR.slagY + 40) tx = x;
              if (tx < 0) return null;
              Z.x = Z.px = tx * T + 1; Z.y = Z.py = heights[tx] * T - Z.h; Z.vx = Z.vy = 0; while (boxHits(Z.x, Z.y, Z.w, Z.h)) Z.y = Z.py = Z.y - T;
              Z.hp = 100; window.Z = Z; return { name: Z.name, out: brOut(Z), t: -1 };
            })()""")
            if not back: back = None
            for j in range(120 if back else 0):
                await h.step(10, AWAY + "watch(); Z.inv = 2;")
                if await h.ev("!brOut(Z) && Z.onGround"): back['t'] = (j + 1) / 6; break
        st = await h.ev("[Math.round(trSec()), BR.phase, BR.lastAlive, BR.chests.filter(c => c.open && !c.kind).length, BR.chests.filter(c => c.open && !c.kind && (c.high || c.y < heights[c.x] - 3)).length, Math.round(W.ashTicks / 60), W.ashDeaths, W.worst]")
        stats.append(st)
        if st[1] == 'over': break
        if st[2] <= 2 and st[0] > 400: await h.ev("G.p.onBarge = false; G.p.inv = 0; G.p.hp = 0; killFighter(G.p, null); 1")
    for s in stats[::10]: print(s)
    end = stats[-1]; w = await h.ev("W")
    print('arena:', ['the Ashen Isle', 'Ember Peak'][info['arena']], '| match over after %d s, winner %s' % (end[0], await h.ev("BR.winner")))
    print('chests opened by echoes: %d of %d; of those above the ground (roofs, platforms, towers, isles): %d of %d' % (end[3], info['chests'], end[4], info['high']))
    print('longest an echo pushed at something without getting anywhere: %.1f s (%s); echo-seconds spent stuck for more than 2 s: %.1f' % (w['worst'] / 60, w.get('who', '-'), w['stuckSec']))
    print('echo-seconds spent in the ashfall: %d; echoes that died with nobody to blame (ashfall, slag, the island itself): %d of 11' % (end[5], end[6]))
    print('an echo set down well outside the safe ground:', 'was outside: %s, standing inside again after %.1f s' % (back['out'], back['t']) if back else 'there was never a moment to try it')
    print('salves and wards begun by echoes: %d; of those with a foe near or in sight: %d' % (w['salves'], w['seenSalves']))
    print('route searches: %d in %d ticks (%.2f a tick), %.2f ms each on average, %.1f ms the slowest, %d of them over 8 ms' % (w['searches'], w['ticks'], w['searches'] / max(1, w['ticks']), w['ms'] / max(1, w['searches']), w['worstMs'], w['slow']))
    # (now and then every echo falls on the first day, before the ashfall has begun: such a match cannot show how they deal
    # with the ashfall, or much about chests, so another is run for those; what it can show is still held against it)
    short = end[1] == 'over' and end[0] < 250
    if short: print('this match was over before the ashfall began: another is run for what it could not show')
    else:
        ok.append(('the match ends with a winner', end[1] == 'over' and end[0] <= 950))
        ok.append(('echoes open chests that are above the ground', end[4] >= 2))
        ok.append(('echoes keep out of the ashfall: few die of it', end[6] <= 3))
        ok.append(('an echo outside the safe ground gets back in', bool(back) and back['out'] and 0 < back['t'] <= 15))
    ok.append(('no echo pushes at anything for more than a few seconds', w['worst'] <= 360))
    ok.append(('no echo begins a salve with a foe near or in sight', short or (w['salves'] > 0 and w['seenSalves'] == 0)))
    ok.append(('route finding stays cheap: never more than one search in a tick', w['searches'] <= w['ticks'] and w['ms'] / max(1, w['searches']) < 3))
    errs = [e for e in h.errs if 'agent-proxy' not in e and 'PAGEERROR' in e]
    await h.stop()
    return ok, errs, short


async def main():
    ok, errs = [], []
    for part in (beat, team):
        o, e = await part(); ok += o; errs += e
    for go in range(3):
        o, e, short = await match(); ok += o; errs += e
        if not short: break
    else: ok.append(('a match that lasts into the ashfall, in three tries', False))
    for n, v in ok: print(('  ok   ' if v else '  FAIL ') + n)
    print('errors:', errs[:8])
    bad = [n for n, v in ok if not v]
    print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
BR_HORN = 10 * 60 + 30
asyncio.run(main())
