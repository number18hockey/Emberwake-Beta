# The four worlds past the floors: each one is entered, walked and photographed (arrival, out in its
# lands, underground), and its ground, ore and places are checked.
import asyncio, sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(seed=777, size=1); ok = True; ims = []; labels = []
    def check(name, cond, info=''):
        nonlocal ok; ok = ok and bool(cond); print(('PASS ' if cond else 'FAIL ') + name, info)
    for d in (4, 5, 6, 7):
        await h.ev("G.flags.dim%d = true; G.spawnT = 1e9; G.devT = 1e9; enterDim(%d, true); G.state = 'play'; G.cine = null; G.says.length = 0; G.sayCur = null; G.p.inv = 1e6;" % (d, d))
        await h.step(5)
        here = await h.ev("DIM"); check('entered world %d' % d, here == d)
        name = await h.ev("DIMP[DIM].name")
        ims.append(await h.pcrop(240, 140)); labels.append(name + ' arrival')
        # out in the lands, both ways
        for off in (260, -420):
            x = await h.ev("SPAWN_X + %d" % off); await h.goto(x); await h.step(4)
            ims.append(await h.pcrop(240, 140)); labels.append('%s %s (%s)' % (name, 'east' if off > 0 else 'west', await h.ev("dimBio(%d)" % x)))
        # what the ground holds
        x = await h.ev("SPAWN_X + 300")
        counts = json.loads(await h.ev("JSON.stringify((() => { const c = {}; for (let x = SPAWN_X + 100; x < SPAWN_X + 700; x++) for (let y = 0; y < WH; y++) { const t = tiles[y * WW + x]; if (t) c[TP[t].name || t] = (c[TP[t].name || t] || 0) + 1; } return c; })())"))
        ore = {4: 'Rimesteel Ore', 5: 'Hourbrass Ore', 6: 'Stormsilver Ore', 7: 'Dawnsteel Ore'}[d]
        check('world %d holds its ore' % d, counts.get(ore, 0) > 20, counts.get(ore, 0))
        top = sorted(counts.items(), key=lambda q: -q[1])[:6]; print('   ', top)
        # underground
        await h.ev("(() => { const x = SPAWN_X + 300; streamTo(x * T, true); let y = heights[x] + 30; while (y < WH - 10 && (solidAt(x, y) || solidAt(x, y + 1) || solidAt(x, y + 2))) y++; G.p.x = G.p.px = x * T + 1; G.p.y = G.p.py = y * T; G.p.vx = G.p.vy = 0; snapCam(); })()")
        await h.step(3); ims.append(await h.pcrop(240, 140)); labels.append(name + ' under')
        # the guardian's arena and the place-of-the-world
        ax = await h.ev("DARENA_X"); await h.goto(ax - 6); await h.step(3)
        alt = await h.ev("[...tileObjs.values()].some(o => (o.id === DALTAR || o.id === COLDHEARTH) && Math.abs(o.x - DARENA_X) < 3)")
        check('world %d has its guardian\'s altar' % d, alt)
        ims.append(await h.pcrop(240, 140)); labels.append(name + ' arena')
    await h.ev("enterDim(0, true); G.state = 'play';")
    sheet(ims, 3, shot('new_worlds.png'), labels, .5)
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:8])
    await h.stop(); print('ALL PASS' if ok else 'SOME FAILED')
asyncio.run(main())
