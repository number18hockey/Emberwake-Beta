# Fighting: the beat. Mashing must lose to timing; mistakes cost; clean, timed play is rewarded.
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H, sheet
from where import shot

# a tough husk that fights back, standing in front of the Waker
FOE = """(() => { G.enemies.length = 0; const p = G.p; if (!window.GX) { window.GX = floor((p.x + 3) / T); window.GY = heights[GX]; for (let x = GX - 8; x <= GX + 12; x++) { for (let y = GY - 9; y < GY; y++) setTile(x, y, 0); for (let y = GY; y < GY + 3; y++) setTile(x, y, CUTSTONE); heights[x] = GY; } }
  const x = GX + 3, e = spawnMob('husk', x, GY); e.hp = e.maxhp = %d; e.x0 = e.x; window.FOE = e; p.face = 1; p.hp = p.maxhp; p.tempo = 0; p.atk = null; p.state = 'normal'; p.rushN = 0; p.inv = 0; p.hurtT = 0; p.hist = []; p.lastMove = null; p.chainT = 0; p.rhythm = 0; p.buf = null; p.quick = 0; p.quickT = 0; p.rollT = 0; p.rollOut = 0; p.stoke = 0; p.st = null; G.combo.n = G.combo.pts = 0; G.hitstop = 0; G.slowT = 0; return e.hp; })()"""
AIM = "(() => { const e = FOE; mouse.wx = e.x + 3; mouse.wy = e.y + 8; mouse.x = (mouse.wx - G.rcx) * VS.s; mouse.y = (mouse.wy - G.rcy) * VS.s; })();"
# stand at the edge of reach, facing the foe
SAFE = "G.p.inv = 5; FOE.state = 'chase'; FOE.t = 0; FOE.x = FOE.px = FOE.x0; FOE.vx = 0;"   # the husk never gets a blow in
PLACE = "(() => { const p = G.p, e = FOE; p.x = p.px = e.x - %d; p.y = p.py = e.y + e.h - p.h; p.vx = p.vy = 0; p.face = 1; p.onGround = true; })();"


async def fight(h, style, ticks=600, hp=4000, gap=20):
    """fight the husk for `ticks` with one way of pressing; return what happened"""
    await h.ev("mouse.lp = mouse.rp = mouse.l = mouse.r = false; 1"); await h.ev(FOE % hp); await h.ev(PLACE % gap); await h.step(2, AIM + "mouse.lp = false;")
    hp0 = await h.ev("FOE.hp")
    if style == 'mash':      # a press every 3 ticks, no thought
        press = "if (G.time % 3 === 0) mouse.lp = true;"
    elif style == 'hold':    # the button held down
        press = "mouse.l = true;"
    elif style == 'slow':    # one unhurried press a second, never chained
        press = "if (G.time % 60 === 0) mouse.lp = true;"
    else:                    # strike on the glint
        press = "(() => { const p = G.p, a = p.atk; if (p.hurtT > 0) return; if (!a && p.state === 'normal' && !(p.chainT > 0)) mouse.lp = true; else if (a && a.phase === 2 && a.pt === beatOpen(a) + 1) mouse.lp = true; })();"
    keep = "G.p.hp = max(G.p.hp, 40); if (abs(G.p.x - (FOE.x - %d)) > 40) { %s }" % (gap, PLACE % gap)
    peak = 0
    for _ in range(ticks // 20):
        await h.step(20, AIM + "mouse.lp = false; mouse.l = false;" + press + keep)
        peak = max(peak, await h.ev("G.p.tempo | 0"))
    out = await h.ev("({ dealt: Math.round(%d - FOE.hp), rushed: G.p.rushN | 0 })" % hp0)
    out['tempo peak'] = peak
    return out


async def run():
    h = await H().start(seed=4242, size=1)
    await h.ev("inv.fill(null); inv[0] = { id: 'steel_sword', n: 1 }; G.sel = 0; G.p.stam = 100; SETTINGS.diff = 'normal'; G.flags.th_rush = G.flags.th_crisp = G.flags.th_clean = G.flags.th_broken = G.flags.th_clash = G.flags.th_caught = G.flags.th_ablaze = 1;")
    res = {}
    for style in ('mash', 'hold', 'slow', 'beat'):
        res[style] = await fight(h, style)
        print('  %-5s' % style, res[style])
    ok = []
    ok.append(('keeping the beat out-damages mashing by half again or more', res['beat']['dealt'] >= res['mash']['dealt'] * 1.5))
    ok.append(('mashing is called out as rushed', res['mash']['rushed'] >= 5 and res['beat']['rushed'] == 0))
    ok.append(('holding the button down does not attack', res['hold']['dealt'] == 0))
    ok.append(('only timed blows build tempo', res['beat']['tempo peak'] >= 4 and res['mash']['tempo peak'] <= 1 and res['slow']['tempo peak'] <= 1))
    ok.append(('slow single blows are weakest of all', res['slow']['dealt'] < res['beat']['dealt'] * .5))

    # ---- a rushed blow: weak, slow, chain lost ----
    # (since the quickening one press before the glint is only HASTY: hammering, three presses before it, is what rushes)
    await h.ev(FOE % 4000); await h.ev(PLACE % 20); await h.step(2, AIM)
    await h.step(1, AIM + SAFE + "mouse.lp = true;"); await h.step(3, AIM + SAFE + "mouse.lp = true;")
    r = await h.ev("({ rushed: !!(G.p.atk && G.p.atk.rushed), rec: atkRec(G.p.atk), plain: round(G.p.atk.m.rec * (G.p.atk.tm || 1)) })")
    ok.append(('a press before the glint rushes the blow and stretches its recovery', r['rushed'] and r['rec'] > r['plain'] * 1.5))
    await h.step(60, AIM + SAFE + "mouse.lp = false;")
    ok.append(('after a rushed blow the chain starts over', await h.ev("G.p.lastMove === null && !(G.p.chainT > 0)")))

    # ---- a blow on the glint: the chain goes on, it bites, an ember lights ----
    await h.ev(FOE % 4000); await h.ev(PLACE % 20); await h.step(2, AIM)
    await h.step(1, AIM + SAFE + "mouse.lp = true;")
    for _ in range(60):
        await h.step(1, AIM + SAFE + "mouse.lp = false;")
        if await h.ev("!!(G.p.atk && G.p.atk.phase === 2 && G.p.atk.pt === beatOpen(G.p.atk))"): break
    g = await h.ev("G.p.glintT > 0")
    await h.step(1, AIM + SAFE + "mouse.lp = true;"); await h.step(1, AIM + SAFE + "mouse.lp = false;")
    c = await h.ev("({ id: G.p.atk && G.p.atk.id, beat: G.p.atk && G.p.atk.beat, st: G.p.state, hurt: G.p.hurtT, last: G.p.lastMove })"); print('  glint', g, c)
    await h.step(14, AIM + SAFE + "mouse.lp = false;")
    ok.append(('the weapon glints when the opening comes', g))
    ok.append(('a press on the glint is CRISP and carries the chain on', c['id'] == 'return_stroke' and c['beat'] == 2))
    ok.append(('the timed blow lit an ember and made the husk flinch', await h.ev("G.p.tempo >= 1 && FOE.stun > 0")))

    # ---- a lone light blow does not stop a sturdy foe ----
    await h.ev(FOE % 4000); await h.ev(PLACE % 9); await h.ev('Math.random = () => .5; 1'); await h.step(2, AIM)
    await h.step(1, AIM + SAFE + "mouse.lp = true;"); await h.step(12, AIM + SAFE + "mouse.lp = false;")
    ok.append(('a lone light blow hurts but does not make it flinch', await h.ev("FOE.hp < 4000 && !(FOE.stun > 0)")))

    # ---- clean: the outer half of the blade ----
    async def one(gap):
        await h.ev(FOE % 4000); await h.ev(PLACE % gap); await h.ev("FOE.stun = 999; Math.random = () => .5; 1"); await h.step(2, AIM)
        await h.step(1, AIM + "mouse.lp = true;"); await h.step(16, AIM + "mouse.lp = false;")
        return await h.ev("Math.round(4000 - FOE.hp)")
    near, far = await one(9), await one(21)
    print('  near', near, 'far', far)
    ok.append(('the far edge of the blade hits harder than its base', far > near * 1.1))

    # ---- five embers, then a heavy blow: a crescendo ----
    await h.ev(FOE % 4000); await h.ev(PLACE % 20); await h.ev("FOE.stun = 999; G.p.tempo = 0; G.p.stam = 100;"); await h.step(2, AIM)
    await h.step(1, AIM + "mouse.rp = true;"); await h.step(50, AIM + "mouse.rp = false; mouse.r = false;"); plain = await h.ev("Math.round(4000 - FOE.hp)")
    await h.ev(FOE % 4000); await h.ev(PLACE % 20); await h.ev("FOE.stun = 999; G.p.tempo = 5; G.p.tempoT = 300; G.p.stam = 100;"); await h.step(2, AIM)
    await h.step(1, AIM + "mouse.rp = true;"); await h.step(50, AIM + "mouse.rp = false; mouse.r = false;"); big = await h.ev("Math.round(4000 - FOE.hp)")
    print('  heavy', plain, 'crescendo', big)
    ok.append(('a heavy blow at five embers is a crescendo (twice a plain heavy, or more)', big >= plain * 2))
    ok.append(('and it spends every ember', await h.ev("(G.p.tempo | 0) === 0")))

    # ---- guard: blows that bite break it ----
    await h.ev(FOE % 300); await h.ev(PLACE % 20); await h.step(2, AIM)
    broke = False
    for _ in range(40):
        await h.step(10, AIM + SAFE + "mouse.lp = false; FOE.hp = 300; (() => { const p = G.p, a = p.atk; if (!a && p.state === 'normal' && !(p.chainT > 0)) mouse.lp = true; else if (a && a.phase === 2 && a.pt === beatOpen(a) + 1) mouse.lp = true; })();")
        if await h.ev("FOE.stagT > 0"): broke = True; break
    if not broke: print('  guard', await h.ev("JSON.stringify({ pz: FOE.pz, mpz: FOE.mpz, hp: FOE.hp, st: FOE.state, p: [G.p.state, G.p.hurtT, G.p.atkN, G.p.x - FOE.x, G.p.tempo] })"))
    ok.append(('timed blows break a foe\'s guard: it reels', broke))
    hp1 = await h.ev("FOE.hp"); await h.ev("damageEnemy(FOE, 10, 0, 0, {})"); stag = hp1 - await h.ev("FOE.hp")
    ok.append(('a reeling foe takes a third more', stag == 13))
    im_break = await h.pcrop(120, 80)

    # ---- clash: a swing that meets their blow turns it aside ----
    await h.ev(FOE % 4000); await h.ev(PLACE % 14); await h.step(2, AIM)
    await h.ev("G.p.hp = 100; 1")
    await h.step(1, AIM + SAFE + "mouse.lp = true;")
    for _ in range(30):
        await h.step(1, AIM + SAFE + "mouse.lp = false;")
        if await h.ev("!!(G.p.atk && G.p.atk.phase === 1)"): break
    hit = await h.ev("G.p.inv = 0, hurtFighter(G.p, 20, FOE.x + 3, { by: FOE })")
    ok.append(('a blow that lands on your swing is turned aside (CLASH)', hit is False and await h.ev("G.p.hp === 100 && G.p.atk && G.p.atk.clashed")))
    im_clash = await h.pcrop(120, 80)
    # ---- caught: hit in the wind-up ----
    await h.step(60, AIM + SAFE + "mouse.lp = false;"); await h.ev("G.p.hp = 100; G.p.tempo = 3; G.p.tempoT = 300; G.p.stam = 100;")
    await h.step(1, AIM + SAFE + "mouse.rp = true;"); await h.step(2, AIM + SAFE + "mouse.rp = false;")
    ph = await h.ev("G.p.atk ? G.p.atk.phase : -1")
    await h.ev("G.p.inv = 0; hurtFighter(G.p, 20, FOE.x + 3, { by: FOE })")
    lost = 100 - await h.ev("G.p.hp"); print('  caught: phase', ph, 'lost', lost)
    ok.append(('hit during a wind-up you are CAUGHT: a quarter more, and tempo gone', ph == 0 and lost == 25 and await h.ev("(G.p.tempo | 0) === 0")))

    # ---- a rival who fights by the same rules ----
    await h.ev("G.enemies.length = 0; G.p.hp = 100;")
    bot = await h.ev("""(() => { const p = G.p, f = newFighter(p.x + 30, p.y, { team: 'e', wid: 'steel_sword', name: 'RIVAL', skin: 3, hp: 5000, maxhp: 5000 }); f.ai = newBrain(.9); f.foes = [p]; p.foes = [f]; G.fighters.push(f); window.BOT = f; return 1; })()""")
    await h.step(900, "G.p.hp = 100; G.p.inv = 0; const I = aiThink(BOT); tickFighter(BOT, I);")
    b = await h.ev("({ atk: BOT.atkN | 0, rushed: BOT.rushN | 0 })")
    print('  rival', b)
    ok.append(('a skilled rival chains on the beat and seldom rushes', b['atk'] >= 8 and b['rushed'] <= b['atk'] * .25))

    sheet([im_break, im_clash], 2, shot('tempo.png'), ['guard BROKEN', 'CLASH'])
    bad = [n for n, v in ok if not v]
    for n, v in ok: print(('  ok   ' if v else '  FAIL ') + n)
    errs = [e for e in h.errs if 'PAGEERROR' in e]
    for e in errs[:5]: print('  ', e[:300])
    await h.stop()
    print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
    return not bad and not errs

if __name__ == '__main__':
    sys.exit(0 if asyncio.run(run()) else 1)
