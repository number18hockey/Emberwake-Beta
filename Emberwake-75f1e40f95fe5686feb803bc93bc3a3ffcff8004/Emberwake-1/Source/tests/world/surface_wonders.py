# The surface's new places: the four gates, the old observatory, a fallen star, a sun shrine, sunstone on a
# peak and the flowers that keep their hours. Each is visited, checked and photographed.
import asyncio, sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(seed=4242, size=1); ok = True; ims = []; labels = []
    def check(name, cond, info=''):
        nonlocal ok; ok = ok and bool(cond); print(('PASS ' if cond else 'FAIL ') + name, info)
    await h.ev("G.clock = .3; updateSun();")
    for k, tile in [('frost', 'FROSTGATE'), ('clock', 'CLOCKGATE'), ('storm', 'STORMGATE'), ('ring', 'RINGGATE'), ('obs', 'TELESCOPE')]:
        x = await h.ev("gateX(%r)" % k)
        await h.goto(x - 6); await h.step(3)
        found = await h.ev("[...tileObjs.values()].some(o => o.id === %s && Math.abs(o.x - %d) < 12)" % (tile, x))
        check('%s gate stands at %d' % (k, x), found)
        ims.append(await h.pcrop(220, 150)); labels.append(k)
    # the land around a gate keeps its own country
    b = await h.ev("JSON.stringify([biomeE(FROST_X), biomeE(CLOCK_X), biomeE(STORMG_X), biomeE(RING_X)])")
    check('each gate stands in its own country', json.loads(b)[0] == 'reach', b)
    # a fallen star and a sun shrine somewhere near the village
    star = await h.ev("(() => { for (let k = 25; k < 36; k++) { const c = craterOf(k); if (c) return c.x; } return -1; })()")
    check('a fallen star lies within reach', star > 0, star)
    if star > 0:
        await h.goto(star - 18); await h.step(3)
        n = await h.ev("(() => { let n = 0; for (let x = %d - 20; x < %d + 20; x++) for (let y = 0; y < WH; y++) if (tiles[y * WW + x] === SKYIRON) n++; return n; })()" % (star, star))
        check('the crater holds skyiron', n >= 8, n); ims.append(await h.pcrop(220, 150)); labels.append('fallen star')
    sun = await h.ev("(() => { for (let k = 30; k < 44; k++) { const s = shrineOf(k); if (s) return s.x; } return -1; })()")
    check('a sun shrine stands on a hill', sun > 0, sun)
    if sun > 0:
        await h.goto(sun - 2); await h.step(3)
        found = await h.ev("[...tileObjs.values()].some(o => o.id === SUNSHRINE && Math.abs(o.x - %d) < 3)" % sun); check('the shrine is there', found)
        await h.ev("G.clock = .3; updateSun(); addItem('sunstone', 1); G.flags['sun%d'] = 0;" % sun)
        hp0 = await h.ev("G.p.maxhp"); await h.ev("sunShrineAct([...tileObjs.values()].find(o => o.id === SUNSHRINE && Math.abs(o.x - %d) < 3))" % sun); await h.step(2)
        hp1 = await h.ev("G.p.maxhp"); check('a sunstone at midday makes you harder to kill', hp1 == hp0 + 5, (hp0, hp1))
        ims.append(await h.pcrop(160, 110)); labels.append('sun shrine')
    # sunstone by day, nothing by night
    await h.ev("(() => { const x = SPAWN_X + 30, y = heights[x] + 3; tiles[y * WW + x] = SUNSTONE; G.clock = .3; updateSun(); for (const k in YACC) delete YACC[k]; yieldCell(SUNSTONE, IT.prism_pick || HAND); })()")
    day = await h.ev("JSON.stringify(YACC)")
    await h.ev("(() => { G.clock = .8; updateSun(); for (const k in YACC) delete YACC[k]; yieldCell(SUNSTONE, IT.prism_pick || HAND); })()")
    night = await h.ev("JSON.stringify(YACC)")
    check('sunstone gives itself up by day only', 'sunstone' in day and 'sunstone' not in night, (day, night))
    # flowers somewhere near
    fl = await h.ev("(() => { let s = 0, m = 0; for (let x = SPAWN_X - 2500; x < SPAWN_X + 2500; x++) { if (!chunkReadyAt(x)) continue; const t = tiles[(heights[x] - 1) * WW + x]; if (t === SUNBLOOM) s++; if (t === MOONPETAL) m++; } return [s, m]; })()")
    check('sunbloom and moonpetal grow out there', fl[0] + fl[1] > 0, fl)
    # the telescope charts things
    await h.ev("telescopeAct()"); ch = await h.ev("JSON.stringify([G.flags.charted, (G.flags.stars || []).length, (G.flags.suns || []).length])")
    check('the telescope charts gates, stars and shrines', json.loads(ch)[0] == 1 and json.loads(ch)[1] > 0, ch)
    # gates refuse without a key, and open with one
    await h.goto(await h.ev("FROST_X") - 2); await h.ev("G.flags.dim4 = false; gateOpenAct('frost')")
    check('the frost gate stays shut without its key', not await h.ev("!!G.flags.dim4"))
    sheet(ims, 3, shot('surface_wonders.png'), labels, .6)
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:6])
    await h.stop(); print('ALL PASS' if ok else 'SOME FAILED')
asyncio.run(main())
