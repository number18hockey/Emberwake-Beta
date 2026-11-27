# Crafting with the real mouse: a hand recipe, armour at the workbench, a plank at the workbench,
# meat on the campfire (fuel goes in by itself), charcoal in the kiln (no damper fiddling).
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(seed=777); pg = h.pg; res = {}; ims = []
    await h.ev("SETTINGS.craft = 'simple'; G.cine = null; G.dialog = null; G.says.length = 0; G.sayCur = null; inv.fill(null); G.p.inv = 1e9; addItem('fiber', 7); addItem('log', 4); addItem('meat', 2); addItem('stick', 6);")
    async def click_ui(x, y):
        cx, cy = await h.ev("(() => { const r = cv.getBoundingClientRect(), k = VS.ui * r.width / cv.width; return [r.left + %f * k, r.top + %f * k]; })()" % (x, y))
        await pg.mouse.click(cx, cy); await h.step(2, "")
    # 1. by hand: twine from fiber, clicked in the pack's list
    await h.ev("UI.open = 'inv'; UI.scroll = 0;"); await h.step(2, "")
    row = await h.ev("(() => { const L = invLayout(), list = craftList(); const k = list.findIndex(e => e.r.out === 'twine' && e.can); return k < 0 ? null : [L.cx + 40, L.cy + k * 19 + 9]; })()")
    ims.append(await h.shot())
    if row: await click_ui(*row)
    res['by hand: twine'] = await h.ev("[countItem('twine'), countItem('fiber')]")
    await h.ev("closeUI()")
    # 2. the workbench: planks in one click
    await h.ev("(() => { const p = G.p, tx = floor((p.x + 3) / T) + 2, ty = floor((p.y + p.h - 1) / T); setTile(tx, ty, BENCH); window.__b = [tx, ty]; openStation(tx, ty); })()"); await h.step(2, "")
    row = await h.ev("stnRowXY('bench', BENCH, e => e.r.out === 'plank')")
    if row: await click_ui(*row)
    await h.step(10, ""); ims.append(await h.shot()); await h.step(60, "")
    res['workbench: planks, logs'] = await h.ev("[countItem('plank'), countItem('log'), !!UI.job]")
    await h.ev("closeUI()")
    # 3. armour is easy to make at the same workbench; it no longer needs a separate stand or anvil
    await h.ev("addItem('hide', 2); addItem('twine', 2); openStation(window.__b[0], window.__b[1]);"); await h.step(2, "")
    res['armour recipes are available at the workbench'] = await h.ev("RECIPES.filter(r => IT[r.out] && IT[r.out].type === 'armor').every(r => r.st === 'bench')")
    await h.ev("UI.stnCat = 'armour'; UI.scroll = 0;"); await h.step(1, "")
    row = await h.ev("stnRowXY('bench', BENCH, e => e.r.out === 'hide_head' && e.can)")
    res['hide armour row is craftable'] = row is not None
    if row: await click_ui(*row)
    await h.step(60, "")
    res['workbench: hide armour'] = await h.ev("[countItem('hide_head'), countItem('hide'), countItem('twine')]")
    assert res['armour recipes are available at the workbench'] and res['hide armour row is craftable']
    assert res['workbench: hide armour'] == [1, 1, 2], 'Hide armour was not crafted at the workbench.'
    await h.ev("closeUI()")
    # 4. the campfire: cook meat; the fire is lit with a stick on its own
    await h.ev("(() => { const p = G.p, tx = floor((p.x + 3) / T) - 3, ty = floor((p.y + p.h - 1) / T); setTile(tx, ty, FIRE); window.__f = [tx, ty]; openStation(tx, ty); })()"); await h.step(2, "")
    row = await h.ev("stnRowXY('fire', FIRE, e => e.r.out === 'cmeat')")
    if row: await click_ui(*row)
    st = await h.ev("(() => { const s = stnState(window.__f[1] * WW + window.__f[0], FIRE); return [s.fuel > 0, s.slots.filter(Boolean).length, countItem('stick')]; })()")
    res['campfire: lit itself, meat on'] = st
    await h.step(700, "")
    await h.ev("(() => { const s = stnState(window.__f[1] * WW + window.__f[0], FIRE); takeSlot(s, s.slots.findIndex(Boolean), true); })()")
    await h.step(1200, "")
    res['cooked meat (never charred)'] = await h.ev("[countItem('cmeat'), countItem('charcoal')]")
    await h.ev("closeUI()")
    # 5. the kiln: charcoal from a log, whatever the damper says
    await h.ev("(() => { const p = G.p, tx = floor((p.x + 3) / T) + 5, ty = floor((p.y + p.h - 1) / T); setTile(tx, ty, FURNACE); window.__k = [tx, ty]; addItem('log', 3); openStation(tx, ty); const st = stnState(ty * WW + tx, FURNACE); st.open = 1; })()"); await h.step(2, "")
    row = await h.ev("stnRowXY('kiln', FURNACE, e => e.r.out === 'charcoal')")
    if row: await click_ui(*row)
    await h.step(760, "")
    ims.append(await h.shot())
    res['kiln: charcoal ready'] = await h.ev("(() => { const s = stnState(window.__k[1] * WW + window.__k[0], FURNACE); const k = s.slots.findIndex(Boolean); if (k < 0) return 'nothing in it'; const r = RECIPES[s.slots[k].r]; const done = s.slots[k].t >= r.t; takeSlot(s, k, false); return [done, countItem('charcoal')]; })()")
    for k, v in res.items(): print(k, '=>', v)
    sheet(ims, 3, shot('crafting.png'), ['by hand', 'workbench', 'kiln'], .5)
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:6])
    await h.stop()
asyncio.run(main())
