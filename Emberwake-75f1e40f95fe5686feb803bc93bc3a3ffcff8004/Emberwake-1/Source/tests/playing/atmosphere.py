# The look of the air: glow, the colour of each land and season, mist, each world's own sky, the Waker's ember wake,
# trails that show the timing of a blow, and the jolt of a hit. Drawing only: none of it may change the game or throw.
import asyncio, io, json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H, sheet
from where import shot
from PIL import Image, ImageStat


async def world(h, traits, seed=4242):
    await h.ev("window.FORCE_T = %s; if (!window.TRAITS0) window.TRAITS0 = traitsOf; traitsOf = s => FORCE_T || TRAITS0(s); Object.assign(WORLD, { id: 'test', name: 'Test', seed: %d, size: 1, shape: 0, mode: 0, arena: false }); G.skin = 0; startWorld(null); 1" % (json.dumps(traits), seed))
    for _ in range(120):
        if await h.ev("G.state") in ('intro', 'play'): break
        await h.pg.wait_for_timeout(100)
    await h.ev("G.manual = true; if (G.state === 'intro') beginPlay(true); G.says.length = 0; G.sayCur = null; G.time = 700; G.spawnT = 1e9; G.cine = null; G.banner = null; G.pin = null; G.found = new Set(LANDMARKS.map(l => l.id)); SETTINGS.fx = 'full'; 1")


def bright(im): return sum(ImageStat.Stat(im.convert('RGB')).mean)


async def run():
    ok = []; ims = []; labels = []
    h = await H().start(mode='none')
    await world(h, ['rich', 'bounty', 'mist'])
    QUIET = "G.banner = null; G.biomeT = 0; G.cine = null; G.note = null;"

    # ---- glow
    await h.ev("inv.fill(null); G.sel = 0; 1"); await h.goto("X0 + 8"); await h.ev("G.clock = .8; G.days = 4.2; updateSun(); G.enemies.length = 0; 1"); await h.step(60, QUIET)
    fire = await h.ev("(() => { let best = null; for (const o of tileObjs.values()) if ((o.id === FIRE || o.id === CAMP || o.id === TORCH) && abs(o.x * T - G.p.x) < 200 && (!best || abs(o.x * T - G.p.x) < abs(best.x * T - G.p.x))) best = o; return best ? [best.x * T + 4, best.y * T + 2, best.id] : null; })()")
    if fire:
        a = await h.crop(fire[0], fire[1] - 6, 46, 40); await h.ev("SETTINGS.fx = 'plain'; 1"); await h.step(2, QUIET); b = await h.crop(fire[0], fire[1] - 6, 46, 40); await h.ev("SETTINGS.fx = 'full'; 1"); await h.step(2, QUIET)
        print('  around a fire at night: brightness %.1f with glow, %.1f without' % (bright(a), bright(b)))
        ok.append(('fires bleed a glow into the dark (FX: FULL), and not with FX: PLAIN', bright(a) > bright(b) * 1.04))
        ims.append(await h.shot()); labels.append('Hearthhold at night')
    else: ok.append(('found a fire to look at', False))

    # ---- the colour of the air
    air = {}
    for name, js in (('moor noon', "G.biome = 'moor'; G.clock = .3; G.days = 4.2"), ('reach noon', "G.biome = 'reach'"), ('fen noon', "G.biome = 'fen'"), ('moor night', "G.biome = 'moor'; G.clock = .8"), ('moor in Emberfall', "G.clock = .3; G.days = 7.2"),
                     ('moor in Ashrest', "G.days = 10.2"), ('moor in rain', "G.days = 1.2; G.wx = { k: 'rain', t: 999, a: 1 }")):
        await h.ev(js + "; G.underK = 0; G.deepK = 0; updateSun(); 1"); air[name] = [round(v, 3) for v in await h.ev("airTarget()")]
    await h.ev("G.wx = null; G.underK = 1; G.deepK = 0; 1"); air['a cave'] = [round(v, 3) for v in await h.ev("airTarget()")]
    await h.ev("G.underK = 0; 1")
    for k, v in air.items(): print('  air: %-18s rgb %3d %3d %3d  strength %.3f' % (k, v[0], v[1], v[2], v[3]))
    diff = lambda a, b: abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])
    ok.append(('each land tints the air its own way', diff(air['moor noon'], air['reach noon']) > 40 and diff(air['moor noon'], air['fen noon']) > 40))
    ok.append(('night, the seasons and the rain each change it', diff(air['moor noon'], air['moor night']) > 30 and diff(air['moor in Emberfall'], air['moor in Ashrest']) > 30 and air['moor in rain'][2] > air['moor noon'][2]))
    ok.append(('it is never strong enough to hide the picture', all(0 < v[3] <= .26 for v in air.values())))
    sm = await h.ev("(() => { G.biome = 'moor'; G.clock = .3; G.days = 4.2; updateSun(); for (let i = 0; i < 400; i++) atmoTick(); const a = [ATM.r, ATM.g, ATM.b]; G.biome = 'reach'; atmoTick(); const b = [ATM.r, ATM.g, ATM.b]; for (let i = 0; i < 400; i++) atmoTick(); return [abs(a[0] - b[0]) + abs(a[2] - b[2]), abs(a[0] - ATM.r) + abs(a[2] - ATM.b)]; })()")
    ok.append(('and it changes smoothly as you walk from one land to the next', sm[0] < 6 and sm[1] > 20))

    # ---- mist
    mi = await h.ev("(() => { G.biome = 'moor'; G.days = 4.2; G.underK = 0; G.clock = .02; const dawn = mistTarget(); G.clock = .3; const noon = mistTarget(); WT.mist = 0; G.clock = .02; const none = mistTarget(); G.biome = 'fen'; const fen = mistTarget(); WT.mist = 1; return [dawn, noon, none, fen]; })()")
    print('  mist: dawn %.2f, noon %.2f, a world without it %.2f, a fen at dawn %.2f' % tuple(mi))
    ok.append(('MISTBOUND: mist at dawn, gone by noon; fens have their own', mi[0] > .6 and mi[1] == 0 and mi[2] == 0 and mi[3] > .3))
    await h.goto("X0 + 700"); await h.ev("G.clock = .03; G.days = 4.2; updateSun(); 1"); await h.step(260, QUIET + "G.clock = .03;"); ims.append(await h.shot()); labels.append('MISTBOUND: dawn')

    # ---- the sky
    sk = await h.ev("(() => { skyBuild(); const a = JSON.stringify(SKYSTARS.slice(0, 5)), n = SKYSTARS.length, c = SKYCON.map(p => p.length); SKYKEY = ''; skyBuild(); const same = JSON.stringify(SKYSTARS.slice(0, 5)) === a; const s0 = SEED; SEED = 99; skyBuild(); const other = JSON.stringify(SKYSTARS.slice(0, 5)) !== a; SEED = s0; WT.starlit = 1; skyBuild(); const many = SKYSTARS.length; WT.starlit = 0; skyBuild(); return [n, c, same, other, many]; })()")
    print('  the sky: %d stars, constellations of %s stars; the same every time %s; another world differs %s; STARLIT has %d' % tuple(sk))
    ok.append(('every world has its own stars and two constellations; a STARLIT world has twice the stars', sk[0] == 150 and len(sk[1]) == 2 and min(sk[1]) >= 5 and sk[2] and sk[3] and sk[4] == 300))
    sh = await h.ev("(() => { G.clock = .8; updateSun(); let seen = 0; Math.random = (r => () => r() * .2)(Math.random); for (let i = 0; i < 400; i++) { skyTick(); seen = max(seen, SHOOT.length); } return seen; })()")
    ok.append(('stars fall at night', sh >= 1))
    await h.pg.reload(); await h.pg.wait_for_timeout(700); await world(h, ['rich', 'bounty', 'twomoons'])
    await h.goto("X0 + 700"); await h.ev("G.clock = .84; G.days = 4.2; updateSun(); 1"); await h.step(60, QUIET); ims.append(await h.shot()); labels.append('TWIN MOONS')
    await world(h, ['rich', 'bounty', 'embersky']); await h.goto("X0 + 700"); await h.ev("G.clock = .58; G.days = 4.2; updateSun(); 1"); await h.step(60, QUIET); dusk = await h.shot(); ims.append(dusk); labels.append('EMBER SKIES at dusk')
    await h.ev("WT.embersky = 0; 1"); await h.step(2, QUIET); plain = await h.shot(); await h.ev("WT.embersky = 1; 1")
    top = lambda im: ImageStat.Stat(im.crop((0, 60, 1280, 240)).convert('RGB')).mean
    ta, tb = top(dusk), top(plain); print('  dusk sky, red against blue: %.2f in an ember sky, %.2f in a plain one' % (ta[0] / ta[2], tb[0] / tb[2]))
    ok.append(('EMBER SKIES: a redder dusk', ta[0] / ta[2] > tb[0] / tb[2] * 1.08))

    # ---- the wake
    await world(h, ['rich', 'bounty', 'mist']); await h.goto(33700); await h.ev("G.clock = .8; G.days = 4.2; updateSun(); G.enemies.length = 0; 1"); await h.step(30, QUIET)
    still = await h.ev("[ATM.wake, G.parts.filter(p => p.glow).length]")
    await h.step(40, QUIET + "G.p.vx = 2.6; G.p.face = 1; G.p.tempo = 5; G.p.tempoT = 600;"); run_ = await h.ev("[ATM.wake, (G.wake || []).length, G.parts.filter(p => p.glow && abs(p.x - G.p.x) < 60).length]"); im_wake = await h.pcrop(170, 100)
    await h.step(90, QUIET + "G.p.vx = 0;"); after = await h.ev("ATM.wake")
    print('  the wake: standing %.2f, running %.2f with %d embers behind, standing again %.2f' % (still[0], run_[0], run_[2], after))
    ok.append(('the Waker trails embers at a run, and not standing still', still[0] < .05 and run_[0] > .5 and run_[1] >= 12 and run_[2] >= 3 and after < .05))
    ims.append(im_wake.resize((1224, 720), Image.NEAREST).crop((0, 0, 1224, 720)).resize((1280, 720), Image.NEAREST)); labels.append('the wake at five embers')

    # ---- trails and the kick
    st = await h.ev("JSON.stringify([tempoSty({ rushed: 1 }), tempoSty({ beat: 1 }), tempoSty({ beat: 2 }), tempoSty({ cresc: 1, beat: 1 }), tempoSty({}), (SETTINGS.fx = 'plain', tempoSty({ beat: 1 }))])"); await h.ev("SETTINGS.fx = 'full'; 1")
    st = json.loads(st); print('  trails:', st)
    ok.append(('a blow in time, a crisp one, a crescendo and a rushed one each leave their own trail', len(set(json.dumps(s) for s in st[:4])) == 4 and st[4] is None and st[5] is None))
    k = await h.ev("(() => { G.kick = null; hitFx(G.p.x + 20, G.p.y, G.p.y, 20, { stop: 6, crit: true }, 3, true); const a = G.kick ? G.kick.x : 0; hitFx(G.p.x - 20, G.p.y, G.p.y, 20, { stop: 2 }, -3, false); const b = G.kick ? G.kick.x : 0; G.hitstop = 0; for (let i = 0; i < 40; i++) atmoTick(); return [a, b, G.kick]; })()")
    print('  the kick:', k); ok.append(('a hit you are part of jolts the view its way, and the jolt dies out', k[0] > 1.5 and k[1] == k[0] and k[2] is None))

    # ---- the stalks through the year
    tt = await h.ev("(() => { const tr = { kind: 0, v: 0 }, base = SPR.top[0][0].cv; G.days = 4.2; const hs = treeTopCv(tr) === base; G.days = 7.2; const a = treeTopCv(tr), b = treeTopCv(tr); G.days = 10.2; const w = treeTopCv(tr); const px = cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let r = 0, bl = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { r += d[i]; bl += d[i + 2]; n++; } return [r / n, bl / n]; }; return [hs, a !== base, a === b, px(base), px(a), px(w), treeTopCv({ kind: 1, v: 0 }) === SPR.top[1][0].cv]; })()")
    print('  stalk tops: red/blue %s as they are, %s in Emberfall, %s in Ashrest' % (tt[3], tt[4], tt[5]))
    ok.append(('stalk tops turn amber in Emberfall and pale in Ashrest (glass stalks never change)', tt[0] and tt[1] and tt[2] and tt[4][0] > tt[3][0] + 15 and tt[5][1] > tt[3][1] + 15 and tt[6]))
    await h.ev("G.days = 7.2; G.clock = .35; updateSun(); 1"); await h.step(500, QUIET); ims.append(await h.shot()); labels.append('Emberfall')

    # ---- nothing here may throw, wherever you are
    n0 = len([e for e in h.errs if 'PAGEERROR' in e])
    await h.ev("G.flags.dim1 = G.flags.dim2 = G.flags.dim3 = true; G.flags.e3 = true; enterDim(1, true); 1"); await h.step(60, QUIET); d1 = await h.ev("[DIM, ATM.a]")
    await h.ev("enterDim(0, true); 1"); await h.step(30, QUIET)
    await h.ev("quitToTitle(); 1"); await h.pg.wait_for_timeout(300); await h.ev("for (let i = 0; i < 20; i++) render(1); 1")
    await h.ev("enterArena('TESTER', 0, 'open'); 1"); await h.pg.wait_for_timeout(300); await h.ev("G.manual = true; 1"); await h.step(60); ring = await h.ev("[WORLD.arena, ATM.a, mistTarget()]")
    await h.ev("quitToTitle(); 1"); await h.pg.wait_for_timeout(300)
    await h.ev("FORM.nick = 'TESTER'; brSolo(1); 1"); await h.pg.wait_for_timeout(1500); await h.ev("G.manual = true; 1"); await h.step(120); roy = await h.ev("[!!WORLD.royale, ATM.a, wt('mist'), seasonOn()]")
    await h.pg.set_viewport_size({'width': 900, 'height': 600}); await h.pg.wait_for_timeout(200); await h.step(10)
    errs = [e for e in h.errs if 'PAGEERROR' in e]
    print('  another world', d1, ' the ring', ring, ' the trials', roy, ' errors', len(errs) - n0)
    ok.append(('another world, the title, the Cinder Ring, the Trials and a resized window all draw without error', len(errs) == n0 and d1[0] == 1 and ring[0] and ring[2] == 0 and roy[0] and not roy[2] and not roy[3]))

    sheet(ims, 3, shot('atmosphere.png'), labels, .5)
    bad = [n for n, v in ok if not v]
    for n, v in ok: print(('  ok   ' if v else '  FAIL ') + n)
    for e in errs[:5]: print('  ', e[:300])
    await h.stop()
    print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
    return not bad and not errs

if __name__ == '__main__':
    sys.exit(0 if asyncio.run(run()) else 1)
