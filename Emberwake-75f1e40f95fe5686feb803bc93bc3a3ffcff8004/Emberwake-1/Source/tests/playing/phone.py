# A phone, held both ways: the stick, the buttons, a finger on the world and on the panels, in a match of the Ashfall.
# And on a computer, where the touch controls must leave the mouse and the keys alone.
import asyncio, io, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, CHROME, shot
from playwright.async_api import async_playwright
from PIL import Image

START = """void (() => { G.nick = 'PHONE'; G.skin = 0; SETTINGS.diff = 'easy'; BR.via = 'solo'; BR.lead = true; BR.on = true; brEnterMatch('p', 4242, ['me'], 31); brSpawnTick = () => { }; brGames = () => { }; })()"""
GROUND = """(() => { const p = G.p, x = 1200; p.glide = false; p.noHit = false; for (let q = x - 14; q <= x + 14; q++) { for (let y = heights[x] - 9; y < heights[x]; y++) setTile(q, y, AIR); for (let y = heights[x]; y < heights[x] + 4; y++) setTile(q, y, DIRT); } p.x = p.px = x * T; p.y = p.py = heights[x] * T - p.h - 1; p.vx = 0; p.inv = 1e9; G.enemies.length = 0; for (const f of G.fighters) if (f !== p) { f.glide = false; f.noHit = false; f.x = f.px = 40 * T; f.y = f.py = (heights[40] - 4) * T; } for (let q = x - 8; q <= x + 8; q++) if (q !== x) setTile(q, heights[x] - 1, [STICKS, PEBBLE, TALLGRASS][(q + 30) % 3]); snapCam(); })()"""


async def phone(pw, label, w, h):
    b = await pw.chromium.launch(headless=True, args=['--no-sandbox'], **CHROME)
    ctx = await b.new_context(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=True, device_scale_factor=1)
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e))); pg.on('console', lambda m: errs.append(m.type + ': ' + m.text[:160]) if m.type == 'error' else None)
    await pg.goto(GAME_URL); await pg.wait_for_timeout(800); cdp = await ctx.new_cdp_session(pg); ims = []

    async def picture(): ims.append(Image.open(io.BytesIO(await pg.screenshot())).convert('RGB'))
    async def touch(kind, at): await cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': k} for k, (x, y) in enumerate(at)]})
    async def hold(x, y, ms, dx=0, dy=0):
        await touch('touchStart', [(x, y)])
        if dx or dy: await pg.wait_for_timeout(40); await touch('touchMove', [(x + dx, y + dy)])
        await pg.wait_for_timeout(ms); await touch('touchEnd', [])
    async def mid(sel): return await pg.evaluate("(s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width, r.height]; }", sel)
    async def tap(sel, ms=90): x, y, *_ = await mid(sel); await hold(x, y, ms); await pg.wait_for_timeout(180)
    async def seen(): return await pg.evaluate("[...document.querySelectorAll('#mobileControls button')].filter(b => b.offsetParent).map(b => b.textContent.trim())")
    out = {}
    try:
        for state in ("G.state = 'title'", "G.state = 'brform'; BR.menuTab = 'queue'", "BR.menuTab = 'wheel'", "BR.menuTab = 'style'"):
            await pg.evaluate(state + '; 0'); await pg.wait_for_timeout(200); await picture()
        await pg.evaluate(START); out['touch'] = await pg.evaluate('mobileDevice'); await pg.wait_for_timeout(4600)
        x0 = await pg.evaluate('G.p.x'); mx, my, mw, mh = await mid('#movePad'); await hold(mx, my, 700, mw * .4, 0); out['steered'] = round(await pg.evaluate('G.p.x') - x0); await picture()
        await pg.evaluate(GROUND); await pg.wait_for_timeout(300); out['buttons'] = await seen()
        y0 = await pg.evaluate('G.p.y'); jx, jy, *_ = await mid('#mobileJump'); await touch('touchStart', [(jx, jy)]); await pg.wait_for_timeout(260); out['jumped'] = round(y0 - await pg.evaluate('G.p.y')); await touch('touchEnd', []); await pg.wait_for_timeout(700)
        for q in (1201, 1202, 1203, 1199, 1198, 1197):
            x, y = await pg.evaluate("(x) => [(x * T + 4 - G.cam.x) * VS.s, ((heights[1200] - 1) * T + 4 - G.cam.y) * VS.s]", q); await hold(x, y, 420); await pg.wait_for_timeout(120)
        await pg.wait_for_timeout(500); out['gathered'] = await pg.evaluate("inv.filter(Boolean).map(s => s.id)")
        x, y, tx, ty = await pg.evaluate("[(G.p.x + 3 - G.cam.x) * VS.s, (G.p.y + G.p.h + 5 - G.cam.y) * VS.s, floor((G.p.x + 3) / T), floor((G.p.y + G.p.h + 4) / T)]"); solid0 = await pg.evaluate("([x, y]) => solidAt(x, y)", [tx, ty]); await hold(x, y, 2400); out['dug'] = [solid0, await pg.evaluate("([x, y]) => solidAt(x, y)", [tx, ty])]
        await pg.evaluate("for (const [id, n] of [['stick', 9], ['fiber', 14], ['rock', 6], ['flint', 4]]) addItem(id, n); 0")
        await tap('#mobilePack'); await pg.wait_for_timeout(250); out['pack'] = [await pg.evaluate('UI.open'), await seen()]; await picture()
        rows = await pg.evaluate("HITS.filter(h => h.w > 100 && h.h === 18).map(h => [(h.x + h.w / 2) * VS.ui, (h.y + 9) * VS.ui])"); t0 = await pg.evaluate("countItem('twine')"); await hold(rows[0][0], rows[0][1], 60); await pg.wait_for_timeout(250); out['crafted'] = await pg.evaluate("countItem('twine')") - t0
        before = await pg.evaluate("inv.filter(Boolean).map(s => s.id + s.n).join()"); px, py = rows[-1]; await touch('touchStart', [(px, py)])
        for k in range(1, 5): await touch('touchMove', [(px, py - 26 * k)]); await pg.wait_for_timeout(30)
        await touch('touchEnd', []); await pg.wait_for_timeout(200); out['scrolled'] = [await pg.evaluate('UI.scroll') > 0, before == await pg.evaluate("inv.filter(Boolean).map(s => s.id + s.n).join()")]
        await tap('#mobileClose'); out['closed'] = await pg.evaluate('UI.open')
        x, y = await pg.evaluate("(() => { const h = hotbarLayout(); return [(h.x + 2 * 19 + 9) * VS.ui, (h.y + 9) * VS.ui]; })()"); await hold(x, y, 60); await pg.wait_for_timeout(120); out['slot'] = await pg.evaluate('G.sel')
        await tap('#mobileMap'); m1 = await pg.evaluate('BR.mapOpen'); await tap('#mobileMap'); out['map'] = [m1, await pg.evaluate('BR.mapOpen')]
        await pg.evaluate("(() => { const b = window.foe = [...BR.bots.values()].find(f => !f.dead); b.x = b.px = G.p.x + 14; b.y = b.py = G.p.y; b.br.ally = null; b.team = b.botTag; b.br.foe = null; b.br.roll = 0; b.br.bold = .1; b.lastHitBy = null; b.br.asked = -99999; b.br.spurned = -99999; })()"); steps = []
        for _ in range(3): await tap('#mobilePact', 120); steps.append(bool(await pg.evaluate('BR.teammate')))
        out['pact'] = steps
        for _ in range(5):
            await pg.evaluate("(() => { const b = foe; b.team = b.botTag; b.x = b.px = G.p.x + 13; b.y = b.py = G.p.y; b.vx = 0; b.inv = 0; b.iDodge = 0; b.atk = null; b.state = 'normal'; b.br.foe = null; b.br.flee = 0; G.p.face = 1; G.sel = 9; inv[9] = null; })()"); await tap('#attackLight', 60)
        out['struck'] = await pg.evaluate('foe.hp') < 100
        await tap('#mobileMenu'); m1 = await pg.evaluate('UI.open'); await picture(); await tap('#mobileClose'); out['menu'] = [m1, await pg.evaluate('UI.open')]
        out['errors'] = errs[:4]; W, H = ims[0].size; sheet = Image.new('RGB', (W * 4, H * ((len(ims) + 3) // 4)))
        for i, m in enumerate(ims): sheet.paste(m, ((i % 4) * W, (i // 4) * H))
        sheet.save(shot('phone_%s.png' % label))
    finally:
        await b.close()
    print(label + ':', out)
    assert out['touch'] and out['steered'] > 20 and out['jumped'] > 10, 'the stick should steer and JUMP should jump'
    assert 'PACK' in out['buttons'] and 'PACT' in out['buttons'] and 'CLOSE' not in out['buttons'], 'the buttons of a match should be there'
    assert {'stick', 'rock', 'fiber'} <= set(out['gathered']) and out['dug'] == [True, False], 'a finger should gather, and dig where it points'
    assert out['pack'] == ['inv', ['CLOSE']] and out['crafted'] == 1 and out['scrolled'] == [True, True] and out['closed'] is None, 'the pack should open, craft by tapping, scroll by sliding, and close'
    assert out['slot'] == 2 and out['map'] == [True, False] and out['pact'] == [True, True, False] and out['struck'] and out['menu'] == ['pause', None], 'the hotbar, map, pact, attack and menu should all answer'
    assert not out['errors'], 'browser reported an error'


async def desktop(pw):
    b = await pw.chromium.launch(headless=True, args=['--no-sandbox'], **CHROME)
    pg = await (await b.new_context(viewport={'width': 1280, 'height': 720})).new_page(); await pg.goto(GAME_URL); await pg.wait_for_timeout(800)
    await pg.evaluate(START); await pg.wait_for_timeout(4600); await pg.evaluate(GROUND); await pg.wait_for_timeout(200); x0 = await pg.evaluate('G.p.x')
    await pg.mouse.move(700, 200); await pg.keyboard.down('KeyD'); await pg.mouse.down(); await pg.wait_for_timeout(900)
    held = await pg.evaluate("[!!keys.KeyD, mouse.l, document.getElementById('mobileControls').className]"); moved = round(await pg.evaluate('G.p.x') - x0); await pg.mouse.up(); await pg.keyboard.up('KeyD'); await b.close()
    print('desktop, running with the button held:', held, 'moved', moved)
    assert held == [True, True, ''] and moved > 30, 'on a computer the touch controls must not let go of the keys or the mouse'


async def main():
    pw = await async_playwright().start()
    try:
        await phone(pw, 'landscape', 844, 390); await phone(pw, 'portrait', 390, 844); await desktop(pw)
        print('errors: none')
    finally:
        await pw.stop()


asyncio.run(main())
