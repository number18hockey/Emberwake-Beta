# The echoes of the Wilds get where they are going by a real route: up to a thing above them, down to a thing below them,
# round what is in the way. Where there is no way at all they still dig one. No route is planned through the lava or down
# into the hot rock over it. And with 31 echoes on the island, finding the way stays cheap.
import asyncio, sys, os, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import shot
from harness import H, sheet

# a course built high over the island, walled in with rock nobody can dig: a long shelf with one way up to it (a block to
# leap from, past its far end), a berry bush on the shelf and one under it, and a third bush shut in behind two tiles of earth
BUILD = r"""(() => {
  const z = BR.storm, X0 = clamp(floor((z.nL + z.nR) / 2 / T) - 35, 60, WBRW - 140); let top = 1e9; for (let x = X0 - 2; x <= X0 + 72; x++) top = min(top, heights[x]);
  const Y0 = max(22, top - 26);
  for (let x = X0; x <= X0 + 70; x++) for (let y = Y0 - 16; y <= Y0 + 1; y++) setTile(x, y, y >= Y0 || x === X0 || x === X0 + 70 || y === Y0 - 16 ? BEDROCK : AIR);
  for (let x = X0 + 1; x <= X0 + 38; x++) setTile(x, Y0 - 6, BEDROCK);
  for (let x = X0 + 41; x <= X0 + 44; x++) for (let y = Y0 - 3; y < Y0; y++) setTile(x, y, BEDROCK);
  for (let x = X0 + 52; x <= X0 + 53; x++) for (let y = Y0 - 15; y < Y0; y++) setTile(x, y, DIRT);
  window.C = { X0, Y0, up: [X0 + 8, Y0 - 7], down: [X0 + 8, Y0 - 1], shut: [X0 + 60, Y0 - 1], digs: 0 };
  for (const k of ['up', 'down', 'shut']) setTile(C[k][0], C[k][1], BERRY);
  const E = window.E = [...BR.bots.values()].find(f => !f.dead && !f.glide);
  const dig = brBotDig; brBotDig = function (f, x, y) { const ok = dig(f, x, y); if (ok && f === E) C.digs++; return ok; };
  // (the match stands still while the course is run: no border, no games; nobody can see or hurt anybody)
  window.T0 = BR.t - BR.t % 30 + 5;
  return { X0, Y0, echo: E.name, twice: canDbl(E) };
})()"""
HOLD = "BR.t = T0; G.enemies.length = 0; for (const f of G.fighters) f.noHit = true; const p = G.p; p.glide = false; p.inv = 1e9; p.hp = 100; p.x = p.px = (C.X0 + 30) * T; p.y = p.py = C.Y0 * T - p.h; p.vx = p.vy = 0;"
# the echo is stood at a place with one thing on its mind: the bush at (x, y)
SEND = """(() => { const [gx, gy] = C.%s, br = E.br; E.x = E.px = (C.X0 + %d) * T + 1; E.y = E.py = (C.Y0 - %d) * T - E.h; E.vx = E.vy = 0; E.hp = 100; E.st = null; E.ai.nav = null; E.climbing = false; E.brUse = null;
  br.goal = { kind: 'pick', x: gx, y: gy, t: BERRY }; br.think = 1e9; br.workT = 0; br.stuck = 0; br.off = 0; br.flee = 0; br.foe = null; br.out = false; br.ally = null; br.skip.clear(); br.bag = {}; br.lx = br.ly = 0; C.digs = 0; })()"""
# rock in the deep with a stair cut down through it, from well above the hot rock to well inside it; and a level passage
# with a wide trench across it, filled to a tile under its brim with lava or with water
DEEP = r"""(() => {
  const S = C.X0, R0 = BR_HOT - 32, RL = BR_HOT - 50;
  for (let x = S; x <= S + 30; x++) for (let y = R0 - 5; y <= BR_HOT - 8; y++) setTile(x, y, DEEPSTONE);
  const cut = (x, y) => { for (let k = 0; k < 4; k++) setTile(x, y - k, AIR); };
  for (let x = S + 1; x <= S + 4; x++) cut(x, R0); for (let k = 1; k <= 20; k++) cut(S + 4 + k, R0 + k); for (let x = S + 25; x <= S + 28; x++) cut(x, R0 + 20);
  for (let x = S + 34; x <= S + 74; x++) for (let y = RL - 6; y <= RL + 5; y++) setTile(x, y, DEEPSTONE);
  for (let x = S + 35; x <= S + 73; x++) cut(x, RL);
  window.D = { from: [S + 2, R0], to: [S + 27, R0 + 20], a: [S + 37, RL], b: [S + 71, RL], t0: S + 46, t1: S + 62, RL };
  // one search, as the pathfinder is asked for it; what comes back is where the route ends and the lowest and hottest of it
  window.route = (a, b, o) => {
    const e = navSearch(a[0], a[1], b[0], b[1], 4, o, NAV_MAX), N = NAV; let low = -1, fire = 0, n = 0, end = null;
    for (let i = e; i >= 0; i = N.par[i]) { const c = (i - i % NAV_S) / NAV_S, x = N.x0 + c % NAV_W, y = N.y0 + ((c / NAV_W) | 0); if (!end) end = [x, y]; low = max(low, y); if (navK(x, y) === 4 || navK(x, y + 1) === 4 && !(i % NAV_S)) fire++; n++; }
    return { end, low, fire, n, work: N.n };
  };
  window.trench = t => { for (let x = D.t0; x <= D.t1; x++) for (let y = D.RL + 1; y <= D.RL + 4; y++) setTile(x, y, y === D.RL + 1 ? AIR : t); };
  return D;
})()"""
# watching a whole match: who gets nowhere, what the searches cost, where the routes go, who digs
WATCH = r"""void (() => {
  const W = window.W = { worst: 0, stuckSec: 0, searches: 0, ms: 0, worstMs: 0, slow: 0, ticks: 0, twice: 0, hot: 0, fire: 0, routes: 0, digs: 0, up: 0, down: 0, level: 0, chests: 0, made: 0 };
  let gen = NAV.gen;
  window.watch = () => {
    W.ticks++; if (NAV.gen - gen > 1) W.twice++; gen = NAV.gen;
    for (const f of BR.bots.values()) {
      if (f.dead || f.glide) continue; const br = f.br;
      // (what it wants now, and how high it stood when it began to want it)
      if (br.goal !== f._g) { f._g = br.goal; f._gy = (f.y + f.h) / T; }
      const s = f.st || {}, want = f.ai.I.md !== 0 && !f.brUse && f.state === 'normal' && f.hurtT <= 0 && !(s.pin > 0 || s.held > 0 || s.reel > 0 || s.hook > 0);
      if (want && abs(f.x - f._sx) < 8 && abs(f.y - f._sy) < 8) {
        if (++f._st > W.worst) { const nv = f.ai.nav || {}, g = br.goal; W.worst = f._st; W.who = f.name + ' at tile ' + round(f.x / T) + ',' + round((f.y + f.h) / T) + ' (the ground there is at ' + heights[clamp(round(f.x / T), 0, WBRW - 1)] + ') ' + round(BR.t / 60) + ' s in, ' + (f.onGround ? 'on the ground' : 'in the air') + ', ' + (br.out ? 'climbing out' : br.flee > 0 ? 'running from a foe' : f.ai.tgt && !f.ai.tgt.dead && f.ai.retarget > 0 ? 'after the foe ' + f.ai.tgt.name : g ? 'going to ' + g.kind + ' at ' + g.x + ',' + g.y : 'going nowhere') + ', route of ' + (nv.n | 0) + ' at ' + (nv.i | 0) + ', stuck count ' + br.stuck; }
        if (f._st > 120) W.stuckSec += 1 / 60;
      }
      else { f._sx = f.x; f._sy = f.y; f._st = 0; }
    }
  };
  const search = navSearch; navSearch = function (...a) {
    const t = performance.now(), e = search(...a), ms = performance.now() - t, N = NAV; W.searches++; W.ms += ms; if (ms > W.worstMs) W.worstMs = ms; if (ms > 8) W.slow++;
    // the route this search found: none of it in the hot rock (unless it began there, and is the way out), none of it in fire
    if (a[2] >= 0 && e >= 0) { W.routes++; let hot = 0, fire = 0; for (let i = e; i >= 0; i = N.par[i]) { const c = (i - i % NAV_S) / NAV_S, x = N.x0 + c % NAV_W, y = N.y0 + ((c / NAV_W) | 0); if (y >= BR_HOT - 22 && !N.low) hot = 1; if (navK(x, y) === 4) fire = 1; } W.hot += hot; W.fire += fire; }
    return e;
  };
  const dig = brBotDig; brBotDig = function (f, x, y) { const ok = dig(f, x, y); if (ok) W.digs++; return ok; };
  const work = brWork; brWork = function (f, I, g) { if (!f.br.workT && g.y !== undefined && f._w !== g) { f._w = g; const d = (f.y + f.h) / T - f._gy; if (d < -2.5) W.up++; else if (d > 2.5) W.down++; else W.level++; } return work(f, I, g); };
  const open = wBrOpenChest; wBrOpenChest = function (c, f) { if (f && f.brBot) W.chests++; return open(c, f); };
})()"""
AWAY = "G.p.inv = 1e9; G.p.hp = 100; G.p.noHit = true; G.p.x = G.p.px = 20 * T; G.p.y = G.p.py = 6 * T; G.p.vx = G.p.vy = 0;"


async def landed(h, js):
    for i in range(80):
        await h.step(30, js)
        if await h.ev("BR.phase === 'fight' && [...BR.bots.values()].every(f => f.dead || !f.glide)"): return True
    return False


async def courses():
    h = await H().start(mode='none'); ok = []; ims = []; labels = []
    await h.ev("G.nick = 'TESTER'; G.skin = 0; SETTINGS.diff = 'normal'; wBrSolo(); G.manual = true;")
    ok.append(('everyone comes down onto the island', await landed(h, AWAY)))
    c = await h.ev(BUILD); print('the course is at tile %d,%d, high over the island; the echo is %s (%s)' % (c['X0'], c['Y0'], c['echo'], 'it has the second jump' if c['twice'] else 'one jump only'))
    async def run(what, x, up, secs):
        await h.ev(SEND % (what, x, up)); t = -1
        for k in range(secs * 6):
            await h.step(10, HOLD)
            if await h.ev("tileAt(C.%s[0], C.%s[1]) === BUSH" % (what, what)): t = (k + 1) / 6; break
        ims.append(await h.shot()); return t, await h.ev("[C.digs, E.br.bag.berries | 0, round(E.x / T) - C.X0, C.Y0 - round((E.y + E.h) / T), E.br.stuck]")
    # ---- a bush on the shelf above it: the only way up is round by the far end ----
    t, e = await run('up', 20, 0, 40); labels.append('to the bush on the shelf above')
    print('a bush six tiles above it and twelve along, on a shelf: picked after %.1f s (tiles dug: %d; berries in its bag: %d)' % (t, e[0], e[1]))
    ok.append(('an echo gets up to a thing above it, round by the only way there is', 0 < t <= 30 and e[0] == 0 and e[1] >= 2))
    # ---- a bush on the floor under the shelf it stands on: the only way down is off the far end ----
    t, e = await run('down', 20, 6, 40); labels.append('to the bush under the shelf')
    print('a bush six tiles under it and twelve along, under the shelf it stands on: picked after %.1f s (tiles dug: %d)' % (t, e[0]))
    ok.append(('an echo gets down to a thing below it', 0 < t <= 30 and e[0] == 0))
    # ---- a bush shut in behind earth: there is no way, so it digs one ----
    t, e = await run('shut', 47, 0, 60); labels.append('to the bush behind the earth')
    print('a bush shut in behind two tiles of earth: picked after %.1f s (tiles dug: %d)' % (t, e[0]))
    ok.append(('where there is no way it digs one, as echoes here always did', 0 < t <= 45 and e[0] >= 3))
    # ---- the hot rock and the lava ----
    d = await h.ev(DEEP)
    free, wild = await h.ev("route(D.from, D.to, null)"), await h.ev("route(D.from, D.to, wBrNav())")
    print('a stair down into the hot rock (it begins at row %d, the hot rock at %d): told nothing of the Wilds the route ends at row %d; told of them, at row %d, and goes no lower than row %d' % (d['from'][1], await h.ev("BR_HOT"), free['end'][1], wild['end'][1], wild['low']))
    ok.append(('the stair itself can be walked', free['end'] == d['to']))
    ok.append(('no route goes down into the hot rock over the lava', wild['low'] < await h.ev("BR_HOT - 22") and wild['n'] > 1))
    await h.ev("trench(WATER)"); wet = await h.ev("route(D.a, D.b, wBrNav())")
    await h.ev("trench(CINDER)"); lava = await h.ev("route(D.a, D.b, wBrNav())")
    print('a passage with a trench %d tiles wide across it: full of water the route ends at tile %d (the far end is %d); full of lava, at tile %d (the trench begins at %d)' % (d['t1'] - d['t0'] + 1, wet['end'][0], d['b'][0], lava['end'][0], d['t0']))
    ok.append(('water is swum', wet['end'] == d['b']))
    ok.append(('no route goes through lava', lava['end'][0] < d['t0'] and lava['fire'] == 0))
    sheet(ims, 3, shot('wilds_echoes_find_their_way.png'), labels, .5)
    errs = [e for e in h.errs if 'PAGEERROR' in e]
    await h.stop(); return ok, errs


async def match():
    h = await H().start(mode='none'); ok = []
    await h.ev("G.nick = 'TESTER'; G.skin = 0; SETTINGS.diff = 'normal'; wBrSolo(); G.manual = true;"); await h.ev(WATCH)
    n = await h.ev("BR.bots.size"); await landed(h, AWAY + "watch();")
    stats = []; t0 = time.time(); ticks = 0
    # five minutes of the match, the tester standing aside where nobody can see or hurt it
    for k in range(60):
        await h.step(300, AWAY + "watch();"); ticks += 300
        st = await h.ev("[round(BR.t / 60), BR.phase, BR.lastAlive, W.searches, W.digs, W.chests, W.worst]"); stats.append(st)
        if st[1] == 'over' or st[2] <= 3: break
    wall = (time.time() - t0) * 1000 / max(1, ticks)
    print('seconds in, phase, alive, searches so far, tiles dug, chests opened, longest anyone got nowhere (ticks)')
    for s in stats[::6]: print(s)
    w = await h.ev("W"); lava = await h.ev("G.fighters.filter(f => f.brBot && f.dead && /lava/.test(f.cause || '')).length")
    print('echoes in the match: %d; still standing after %d s: %d' % (n, stats[-1][0], stats[-1][2]))
    print('route searches: %d in %d ticks (%.2f a tick; ticks with more than one: %d), %.2f ms each on average, %.1f ms the slowest, %d of them over 8 ms' % (w['searches'], w['ticks'], w['searches'] / max(1, w['ticks']), w['twice'], w['ms'] / max(1, w['searches']), w['worstMs'], w['slow']))
    print('finding the way cost %.3f ms a tick with %d echoes (the whole game: %.1f ms a tick on this computer just now)' % (w['ms'] / max(1, w['ticks']), n, wall))
    print('routes found: %d; of those that went into the hot rock: %d; through fire: %d; echoes the lava took: %d' % (w['routes'], w['hot'], w['fire'], lava))
    print('things echoes went to and got their hands on: %d that were above where they set out, %d below, %d about level; chests opened: %d; tiles dug: %d' % (w['up'], w['down'], w['level'], w['chests'], w['digs']))
    print('longest an echo pushed at something without getting anywhere: %.1f s (%s); echo-seconds spent stuck for more than 2 s: %.1f' % (w['worst'] / 60, w.get('who', '-'), w['stuckSec']))
    ok.append(('31 echoes play', n == 31 and w['searches'] > 200))
    ok.append(('never more than one search in a tick', w['twice'] == 0 and w['searches'] <= w['ticks']))
    ok.append(('a search is cheap on an island this size', w['ms'] / max(1, w['searches']) < 3))
    ok.append(('no route is planned into the hot rock or through fire', w['routes'] > 100 and w['hot'] == 0 and w['fire'] == 0))
    ok.append(('echoes get to things above them and below them', w['up'] >= 1 and w['down'] >= 1))
    ok.append(('echoes still dig', w['digs'] >= 1))
    ok.append(('no echo pushes at anything for more than a few seconds', w['worst'] <= 360))
    errs = [e for e in h.errs if 'PAGEERROR' in e]
    await h.stop(); return ok, errs


async def main():
    ok, errs = [], []
    for part in (courses, match):
        o, e = await part(); ok += o; errs += e
    for n, v in ok: print(('  ok   ' if v else '  FAIL ') + n)
    print('errors:', errs[:8])
    bad = [n for n, v in ok if not v]
    print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
asyncio.run(main())
