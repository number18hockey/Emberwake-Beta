# Fighting: balance. Kinds of weapon trade reach, speed and risk but stay in one band; metal tiers climb steadily;
# tools hit about half as hard as a sword of the same metal at every tier; the new rewards for skill pay out.
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H, sheet
from where import shot

SETUP = """(() => { G.enemies.length = 0; const p = G.p; if (!window.GX) { window.GX = floor((p.x + 3) / T); window.GY = heights[GX]; for (let x = GX - 8; x <= GX + 30; x++) { for (let y = GY - 12; y < GY; y++) setTile(x, y, 0); for (let y = GY; y < GY + 3; y++) setTile(x, y, CUTSTONE); heights[x] = GY; } }
  const e = spawnMob('husk', GX + 3, GY); e.warded = false; e.hp = e.maxhp = %s; e.mpz = %s; e.pz = e.mpz; e.x0 = e.x; window.FOE = e; p.hp = p.maxhp; p.tempo = 0; p.atk = null; p.state = 'normal'; p.hist = []; p.lastMove = null; p.chainT = 0; p.buf = null; p.st = null; p.stam = 100; p.answerT = 0; G.combo.n = G.combo.pts = 0; G.hitstop = 0; G.fam = {}; G.mast = {}; return 1; })()"""
KEEP = "G.p.inv = 5; G.p.stam = max(G.p.stam, 60); FOE.state = 'chase'; FOE.t = 0; FOE.x = FOE.px = FOE.x0; FOE.vx = 0; FOE.stun = 0; G.hitstop = 0; (() => { const p = G.p, e = FOE; p.x = p.px = e.x - GAP; p.y = p.py = e.y + e.h - p.h; p.vx = p.vy = 0; p.face = 1; p.onGround = true; mouse.wx = e.x + 3; mouse.wy = e.y + 8; })();"
MIX = "(() => { const p = G.p, a = p.atk; if (!a && p.state === 'normal' && !(p.chainT > 0)) mouse.lp = true; else if (a && a.phase === 2 && a.pt === beatOpen(a) + 1) { if (p.tempo >= 4) mouse.rp = true; else mouse.lp = true; } })();"
CLEAR = "mouse.lp = false; mouse.rp = false; mouse.l = false; mouse.r = false;"
BIG = '1e7', '1e12'


async def dps(h, wid):
    """damage a second from keeping the beat and spending embers on heavy blows, for each point of the metal's base damage"""
    info = await h.ev("(() => { const W = IT['%s']; return [W.set, W.dmg, W.len, WMAT[W.tier] ? WMAT[W.tier].base : 0]; })()" % wid)
    gap = max(10, int((6.5 + info[2]) * .78))
    await h.ev("inv.fill(null); inv[0] = { id: '%s', n: 1 }; G.sel = 0; window.GAP = %d; 1" % (wid, gap)); await h.ev(SETUP % BIG); await h.step(3, KEEP + CLEAR)
    hp0 = await h.ev("FOE.hp"); await h.step(1200, KEEP + CLEAR + MIX)
    return (hp0 - await h.ev("FOE.hp")) / 20 / info[3], info


async def run():
    ok = []
    h = await H().start(seed=4242, size=1)
    # This test weighs weapons, not the weather. With its fixed dice it rains partway through, and rain now slows you and
    # makes the ground slick (tests/world/weather.py covers that), so what the weather does is switched off here.
    await h.ev("if (typeof tickWeatherWays === 'function') tickWeatherWays = () => { }; 1")
    await h.ev("SETTINGS.diff = 'normal'; Math.random = (() => { let s = 12345; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })(); for (const k of ['rush','crisp','clean','broken','clash','caught','ablaze','head','sunder','warded','release']) G.flags['th_' + k] = 1; 1")

    # 1. metal tiers: each one better than the last, by a steady step
    tiers = await h.ev("['copper','bronze','iron','steel','ember','cinder','gloom','prism','rime','hour','storm','dawn'].map(m => WMAT[m].base)")
    steps = [b / a for a, b in zip(tiers, tiers[1:])]
    print('  sword metal bases', tiers, ' steps', ' '.join('%.2f' % s for s in steps))
    ok.append(('each metal is 8% to 30% better than the one before', all(1.08 <= s <= 1.3 for s in steps)))

    # 2. kinds of weapon stay in one band when every one is used well
    kinds = ['iron_sword', 'iron_shortsword', 'steel_greatsword', 'iron_spear', 'steel_halberd', 'iron_daggers', 'steel_claws', 'iron_battleaxe', 'steel_greataxe', 'steel_nunchaku', 'iron_flail']
    res = {}
    for wid in kinds:
        v, info = await dps(h, wid); res[wid] = v; print('  %-18s %-6s dmg %-3d reach %-3d  on the beat: %.1f a second for each point of metal' % (wid, info[0], info[1], info[2], v))
    lo, hi = min(res.values()), max(res.values())
    print('  spread %.2f (lowest %s, highest %s)' % (hi / lo, min(res, key=res.get), max(res, key=res.get)))
    ok.append(('no kind of weapon out-damages another by more than half', hi / lo <= 1.5))
    ok.append(('the slowest weapons hit hardest, the longest least', res['steel_greataxe'] > res['iron_sword'] > res['iron_spear']))

    # 3. tools: half a sword on a tap, at every tier (they used to overtake swords in the late worlds)
    tools = await h.ev("""(() => { const out = []; G.enemies.length = 0; const e = spawnMob('husk', GX + 3, GY); e.warded = false; e.hp = e.maxhp = 1e7; e.mpz = e.pz = 1e12; const p = G.p; p.x = p.px = e.x - 12; p.y = p.py = e.y + e.h - p.h; mouse.wx = e.x + 3; mouse.wy = e.y + 8;
      const sw = { 1: 'stone', 2: 'copper', 3: 'bronze', 4: 'iron', 5: 'steel', 6: 'ember', 7: 'cinder', 8: 'gloom', 9: 'prism', 10: 'rime', 11: 'hour', 12: 'storm', 13: 'dawn' };
      for (const id of Object.keys(IT)) { const t = IT[id]; if (t.type !== 'tool' || t.kind !== 'pick' || !sw[t.tier]) continue; const hit = k => { e.hp = 1e7; e.inv = 0; e.stagT = 0; toolHitsFoe(p, t, k); return 1e7 - e.hp; }; out.push([id, t.tier, hit(0), hit(1), WMAT[sw[t.tier]].base]); }
      return out; })()""")
    worst_tap = max(t[2] / t[4] for t in tools); worst_full = max(t[3] / t[4] for t in tools)
    for t in tools[::3]: print('  %-12s tier %-2d tap %-3d wound up %-3d  sword of that metal %d' % tuple(t))
    ok.append(('a tapped tool does about half what a sword of its metal does (%.2f at most)' % worst_tap, worst_tap <= .62 and min(t[2] / t[4] for t in tools) >= .38))
    ok.append(('a wound-up tool never beats the sword (%.2f at most)' % worst_full, worst_full <= 1.0))

    # 4. SUNDER: a heavy blow on a foe whose guard is broken
    await h.ev("window.RND0 = Math.random; Math.random = () => .5; inv.fill(null); inv[0] = { id: 'iron_sword', n: 1 }; G.sel = 0; window.GAP = 16; 1"); await h.ev(SETUP % ('1e6', '40'))   # no lucky critical hits in this part
    heavy = "(() => { const p = G.p; if (!p.atk && p.state === 'normal') mouse.rp = true; })();"
    async def one_heavy(pre=''):
        await h.ev("G.p.atk = null; G.p.state = 'normal'; G.p.buf = null; G.p.tempo = 0; G.p.chainT = 0; G.p.hist = []; G.combo.n = G.combo.pts = 0; FOE.inv = 0; " + pre + "; 1"); hp0 = await h.ev("FOE.hp")
        await h.step(1, KEEP + CLEAR + heavy)
        for _ in range(90):
            await h.step(1, KEEP + CLEAR + "FOE.inv = 0;" + ("FOE.stagT = max(FOE.stagT, 30);" if pre else ''))
            if await h.ev("!G.p.atk"): break
        return hp0 - await h.ev("FOE.hp")
    plain = await one_heavy()
    first = await one_heavy("FOE.stagT = 80; FOE.sundered = false"); flag = await h.ev("!!FOE.sundered")
    second = await one_heavy("FOE.stagT = 80")
    print('  heavy blow: plain %d, on a broken guard %d (sunder), again while it still reels %d' % (plain, first, second))
    ok.append(('a heavy blow on a broken guard is a SUNDER (once per break)', flag and first >= second * 1.3 and second >= plain * 1.15))
    im_sunder = await h.pcrop(150, 110)

    # 5. PERFECT RELEASE of a charged heavy
    await h.ev(SETUP % BIG); await h.ev("G.p.atk = null; G.p.state = 'normal'; 1")
    await h.step(1, KEEP + CLEAR + "mouse.rp = true; mouse.r = true;")
    held = 0
    for _ in range(140):
        await h.step(1, KEEP + "mouse.lp = false; mouse.rp = false; mouse.r = true;"); held += 1
        if await h.ev("!!(G.p.atk && G.p.atk.charged)"): break
    await h.step(1, KEEP + CLEAR); perfect = await h.ev("!!(G.p.atk && G.p.atk.perfect)")
    for _ in range(80): await h.step(1, KEEP + CLEAR)
    await h.ev("G.p.atk = null; G.p.state = 'normal'; G.p.buf = null; 1"); await h.step(1, KEEP + CLEAR + "mouse.rp = true; mouse.r = true;")
    for _ in range(held + 30): await h.step(1, KEEP + "mouse.lp = false; mouse.rp = false; mouse.r = true;")
    await h.step(1, KEEP + CLEAR); late = await h.ev("!!(G.p.atk && G.p.atk.perfect)")
    print('  charged after %d ticks; released on the flash: perfect=%s; released late: perfect=%s' % (held, perfect, late))
    ok.append(('letting a charged blow go on the flash is a PERFECT RELEASE; late is not', perfect and not late))

    # 6. ANSWER: the blow after a clash
    await h.ev(SETUP % BIG); await h.ev("G.p.atk = null; G.p.state = 'normal'; G.p.buf = null; 1")
    await h.step(1, KEEP + CLEAR + "mouse.lp = true;")
    for _ in range(40):
        await h.step(1, KEEP + CLEAR)
        if await h.ev("!!(G.p.atk && G.p.atk.phase === 1)"): break
    clashed = await h.ev("(() => { const p = G.p; p.inv = 0; const hp = p.hp; hurtFighter(p, 12, FOE.x + 4, { by: FOE }); return [p.hp === hp, p.answerT | 0]; })()")
    ok.append(('a blow met in mid-swing is a CLASH and opens an answer', clashed[0] and clashed[1] > 0))
    print('  clash:', clashed)

    # 7. rushing costs stamina as well as the chain
    await h.ev(SETUP % BIG); await h.ev("G.p.atk = null; G.p.state = 'normal'; G.p.buf = null; G.p.stam = 100; G.p.rushN = 0; 1")
    for i in range(120): await h.step(1, "G.p.inv = 5; FOE.state = 'chase'; FOE.t = 0; FOE.x = FOE.px = FOE.x0; G.hitstop = 0;" + CLEAR + ("mouse.lp = true;" if i % 3 == 0 else ''))
    st = await h.ev("[round(G.p.stam), G.p.rushN | 0]"); print('  after two seconds of mashing: stamina %d, rushed %d' % tuple(st))
    ok.append(('mashing drains stamina', st[0] <= 75 and st[1] >= 3))

    # 8. WARDED foes: plain blows from the front glance off; heavy blows and blows from behind get through
    await h.ev(SETUP % BIG)
    w = await h.ev("""(() => { const e = FOE, p = G.p; e.warded = true; e.dir = -1; const hit = (kx, o) => { e.hp = 1e7; e.inv = 0; e.stagT = 0; e.glT = -99; damageEnemy(e, 100, kx, -1, o); return round(1e7 - e.hp); };
      return [hit(2, { bite: false }), hit(2, { gb: true }), hit(-2, { bite: false }), (() => { e.stagT = 50; e.hp = 1e7; e.inv = 0; damageEnemy(e, 100, 2, -1, {}); e.stagT = 0; return round(1e7 - e.hp); })()]; })()""")
    print('  warded husk, 100 damage: plain from the front %d, heavy from the front %d, plain from behind %d, while its guard is broken %d' % tuple(w))
    ok.append(('a warded foe turns plain blows from the front only', w[0] <= 40 and w[1] >= 95 and w[2] >= 95 and w[3] >= 95))
    await h.ev("FOE.warded = true; FOE.dir = -1; damageEnemy(FOE, 10, 2, -1, {}); 1"); await h.step(2, KEEP + CLEAR + "FOE.dir = -1;")
    im_ward = await h.pcrop(150, 110)

    sheet([im_sunder, im_ward], 2, shot('balance.png'), ['SUNDER', 'a WARDED foe'])
    bad = [n for n, v in ok if not v]
    for n, v in ok: print(('  ok   ' if v else '  FAIL ') + n)
    errs = [e for e in h.errs if 'PAGEERROR' in e]
    for e in errs[:5]: print('  ', e[:300])
    await h.stop()
    print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
    return not bad and not errs

if __name__ == '__main__':
    sys.exit(0 if asyncio.run(run()) else 1)
