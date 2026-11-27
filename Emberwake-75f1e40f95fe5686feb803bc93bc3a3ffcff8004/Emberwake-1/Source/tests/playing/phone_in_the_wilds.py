# A phone in a match of the Wilds: the Wilds' own screens fit the glass, the stick steers the glider, a finger gathers what lies
# on the ground and digs with bare hands, PACK and MAP answer, and PACT asks the echo beside you, then lets it go again.
# (The phone in a world of your own and in the Ashfall Trials is phone.py.)
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, CHROME, shot
from playwright.async_api import async_playwright

# a match by yourself against echoes, on a seed everyone can repeat
START = """void (() => { if (typeof ACCOUNT !== 'undefined') { ACCOUNT.active = { id: 'test', name: 'TEST', skin: 0, hat: 0 }; } G.nick = 'PHONE'; G.skin = 0; SETTINGS.diff = 'easy'; BR.via = 'solo'; BR.lead = true; BR.on = true; wBrEnterMatch('p', 4242, ['me'], 31); })()"""
# a flat, empty stretch of ground under the Waker, who cannot be hurt, with things lying on it to pick up
GROUND = """(() => { const p = G.p, x = 1200; p.glide = false; p.noHit = false; for (let q = x - 14; q <= x + 14; q++) { for (let y = heights[x] - 9; y < heights[x]; y++) setTile(q, y, AIR); for (let y = heights[x]; y < heights[x] + 4; y++) setTile(q, y, DIRT); } p.x = p.px = x * T; p.y = p.py = heights[x] * T - p.h - 1; p.vx = 0; p.inv = 1e9; G.enemies.length = 0; for (const f of G.fighters) if (f !== p) { f.glide = false; f.noHit = false; f.x = f.px = 40 * T; f.y = f.py = (heights[40] - 4) * T; } for (let q = x - 8; q <= x + 8; q++) if (q !== x) setTile(q, heights[x] - 1, [STICKS, PEBBLE, TALLGRASS][(q + 30) % 3]); snapCam(); })()"""
# the test must never reach the public message boards: the only one it knows is a closed door on this computer
NO_BOARDS = "window.EW_BROKERS = ['ws://127.0.0.1:1/mqtt'];"


async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True, args=['--no-sandbox'], **CHROME)
        ctx = await b.new_context(viewport={'width': 844, 'height': 390}, has_touch=True, is_mobile=True, device_scale_factor=1)
        await ctx.add_init_script(NO_BOARDS)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e))); pg.on('console', lambda m: errs.append(m.type + ': ' + m.text[:160]) if m.type == 'error' and '127.0.0.1:1/' not in m.text else None)
        await pg.goto(GAME_URL); await pg.wait_for_timeout(800); cdp = await ctx.new_cdp_session(pg)
        async def touch(kind, at): await cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': k} for k, (x, y) in enumerate(at)]})
        async def hold(x, y, ms, dx=0, dy=0):
            await touch('touchStart', [(x, y)])
            if dx or dy: await pg.wait_for_timeout(40); await touch('touchMove', [(x + dx, y + dy)])
            await pg.wait_for_timeout(ms); await touch('touchEnd', [])
        async def mid(sel): return await pg.evaluate("(s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width, r.height]; }", sel)
        async def tap(sel, ms=90): x, y, *_ = await mid(sel); await hold(x, y, ms); await pg.wait_for_timeout(180)
        async def seen(): return await pg.evaluate("[...document.querySelectorAll('#mobileControls button')].filter(b => b.offsetParent).map(b => b.textContent.trim())")
        # where a spot of the world is on the glass
        async def world(x, y): return await pg.evaluate("([x, y]) => { const k = VS.s * cv.getBoundingClientRect().width / cv.width; return [(x - G.rcx) * k, (y - G.rcy) * k]; }", [x, y])
        # a finger held on a spot of the world, following it as the view moves
        async def finger(spot, moves):
            await touch('touchStart', [await world(*await pg.evaluate(spot))])
            for _ in range(moves): await pg.wait_for_timeout(110); await touch('touchMove', [await world(*await pg.evaluate(spot))])
            await touch('touchEnd', [])
        out = {}

        # ---- the Wilds' own screens: every button on the glass ----
        scr = {}
        for tab in ('queue', 'wheel', 'style', 'shop'):
            await pg.evaluate("void (() => { ACCOUNT.active = { id: 'test', name: 'TEST', skin: 0, hat: 0 }; G.state = 'brform'; BR.wild = true; BR.menuTab = '%s'; if (!FORM.nick) FORM.nick = 'WAKER'; if (FORM.brcode === undefined) FORM.brcode = ''; })()" % tab); await pg.wait_for_timeout(250)
            scr[tab] = await pg.evaluate("[HITS.length, HITS.filter(h => h.x < 0 || h.y < 0 || h.x + h.w > VS.uw || h.y + h.h > VS.uh).length]")
            await pg.screenshot(path=shot('phone_in_the_wilds_%s.png' % tab))
        out['screens'] = scr

        # ---- into a match: the glider answers the stick ----
        await pg.evaluate(START); out['touch'] = await pg.evaluate('mobileDevice')
        # (the match opens with everyone held in the sky for a count; wait until they are let go and the glider answers)
        for _ in range(200):
            if await pg.evaluate("G.state === 'play' && BR.t > BR_HOLD + 12"): break
            await pg.wait_for_timeout(100)
        out['state'] = await pg.evaluate("[G.state, WORLD.royale, BR.wild, G.p.glide]")
        x0 = await pg.evaluate('G.p.x'); mx, my, mw, mh = await mid('#movePad'); await hold(mx, my, 700, mw * .4, 0); out['steered'] = round(await pg.evaluate('G.p.x') - x0)

        # ---- on the ground: the buttons of the Wilds, gathering and digging by finger ----
        await pg.evaluate(GROUND); await pg.wait_for_timeout(300); out['buttons'] = await seen()
        for q in (1201, 1202, 1203, 1199, 1198, 1197):
            await finger("[%d * T + 4, (heights[1200] - 1) * T + 4]" % q, 4); await pg.wait_for_timeout(120)
        await pg.wait_for_timeout(500); out['gathered'] = sorted(await pg.evaluate("inv.filter(Boolean).map(s => s.id)"))
        # bare hands: an empty slot in hand, and a finger held on the ground beside you
        await pg.evaluate("(() => { let k = inv.findIndex((s, i) => i < 10 && !s); G.sel = k < 0 ? 9 : k; if (k < 0) inv[9] = null; })()")
        tx, ty = await pg.evaluate("[floor((G.p.x + 3) / T) + 1, heights[1200]]"); dirt0 = await pg.evaluate("countItem('dirt')")
        solid0 = await pg.evaluate("([x, y]) => solidAt(x, y)", [tx, ty]); await finger("[%d * T + 4, %d * T + 4]" % (tx, ty), 24)
        out['dug'] = [solid0, await pg.evaluate("([x, y]) => solidAt(x, y)", [tx, ty]), await pg.evaluate("countItem('dirt')") > dirt0]

        # ---- PACK, MAP, PACT and MENU ----
        await tap('#mobilePack'); await pg.wait_for_timeout(250); out['pack'] = [await pg.evaluate('UI.open'), await seen()]
        await tap('#mobileClose'); out['closed'] = await pg.evaluate('UI.open')
        await tap('#mobileMap'); m1 = await pg.evaluate('BR.mapOpen'); await tap('#mobileMap'); out['map'] = [m1, await pg.evaluate('BR.mapOpen')]
        # an echo beside you with no ally, no quarrel and nothing against you: the first tap asks it, the second is ignored while you
        # are sworn, the third (held a little) lets it go
        await pg.evaluate("(() => { const b = window.foe = [...BR.bots.values()].find(f => !f.dead); b.x = b.px = G.p.x + 14; b.y = b.py = G.p.y; b.br.ally = null; b.team = b.botTag; b.br.foe = null; b.br.roll = 0; b.br.bold = .1; b.lastHitBy = null; b.br.asked = -99999; b.br.spurned = -99999; })()"); steps = []
        for _ in range(3): await tap('#mobilePact', 120); steps.append(bool(await pg.evaluate('BR.teammate')))
        out['pact'] = steps
        await tap('#mobileMenu'); out['menu'] = await pg.evaluate('UI.open'); await pg.screenshot(path=shot('phone_in_the_wilds_menu.png'))
        out['errors'] = errs[:4]
        await b.close()
    for k, v in out.items(): print(k, ':', v)
    assert out['touch'] and all(n > 0 and off == 0 for n, off in out['screens'].values()), 'every button of the Wilds\' four screens should be on the glass of a phone'
    assert out['state'] == ['play', True, True, True] and out['steered'] > 20, 'a match of the Wilds should begin on the glider, and the stick should steer it'
    assert out['buttons'] == ['JUMP', 'DASH', 'USE', 'HEAVY', 'LIGHT', 'PACK', 'MAP', 'HEAL', 'PACT', 'MENU'], 'the buttons of the Wilds: those of a match, and PACT'
    assert {'fiber', 'flint', 'rock', 'stick'} <= set(out['gathered']), 'a finger on what lies on the ground should gather it'
    assert out['dug'] == [True, False, True], 'a finger held on the ground should dig it with bare hands, and the dirt is yours'
    assert out['pack'] == ['inv', ['CLOSE']] and out['closed'] is None and out['map'] == [True, False], 'PACK and MAP should open and close'
    assert out['pact'] == [True, True, False], 'PACT should swear a pact with the echo beside you, and a later press should leave it'
    assert out['menu'] == 'pause', 'MENU should open the menu'
    assert not out['errors'], 'browser reported an error'


asyncio.run(main())
