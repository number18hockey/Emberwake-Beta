# A phone, held both ways: typing a world's name, the stick, the buttons, a finger on the world and on the panels,
# in a world of your own and in a match of the Ashfall Trials.
# And on a computer, where the touch controls must leave the mouse and the keys alone and show nothing.
# (The phone in a match of the Wilds, with its PACT button, is phone_in_the_wilds.py.)
import asyncio, io, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, CHROME, shot
from playwright.async_api import async_playwright
from PIL import Image

WORLD = """void (() => { Object.assign(WORLD, { id: 'phone', name: 'Phone', seed: 12345, size: 1, shape: 0, mode: 0, arena: false }); G.skin = 0; startWorld(null); })()"""
AWAKE = """void (() => { if (G.state === 'intro') beginPlay(true); G.says.length = 0; G.sayCur = null; G.spawnT = 1e9; G.found = new Set(LANDMARKS.map(l => l.id)); for (const r of ['drift', 'under', 'deep']) G.found.add('realm_' + r); G.cine = null; G.dialog = null; })()"""
# a flat, empty stretch of ground under the Waker, who cannot be hurt
GROUND = """(() => { const p = G.p, x = floor((p.x + 3) / T), gy = heights[x]; p.glide = false; for (let q = x - 14; q <= x + 14; q++) { for (let y = gy - 9; y < gy; y++) setTile(q, y, AIR); for (let y = gy; y < gy + 4; y++) setTile(q, y, DIRT); } p.x = p.px = x * T; p.y = p.py = gy * T - p.h - 1; p.vx = p.vy = 0; p.inv = 1e9; p.hp = p.maxhp; G.enemies.length = 0; snapCam(); return [x, gy]; })()"""
# every press of a blow by the Waker is counted, so a held button can be seen to strike once
COUNT = """void (() => { if (window.blows) return; const was = beatPress; window.blows = []; beatPress = (f, b) => { if (f === G.p) blows.push(b); return was(f, b); }; })()"""
# the test must never reach the public message boards: the only one it knows is a closed door on this computer
NO_BOARDS = "window.EW_BROKERS = ['ws://127.0.0.1:1/mqtt'];"
TRIALS = """void (() => { G.nick = 'PHONE'; G.skin = 0; SETTINGS.diff = 'easy'; brSolo(1); for (let i = 0; i < 900 && BR.phase !== 'fight'; i++) tick(); })()"""
ECHO = """(() => { const p = G.p, b = window.foe = window.foe && !foe.dead ? foe : G.fighters.find(f => f !== p && !f.dead); for (const f of G.fighters) if (f !== p && f !== b) { f.x = f.px = p.x + 400; } b.x = b.px = p.x + 13; b.y = b.py = p.y; b.vx = 0; b.inv = 0; b.iDodge = 0; b.atk = null; b.state = 'normal'; p.face = 1; p.inv = 1e9; return b.hp; })()"""


async def phone(pw, label, w, h):
    b = await pw.chromium.launch(headless=True, args=['--no-sandbox'], **CHROME)
    ctx = await b.new_context(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=True, device_scale_factor=1)
    await ctx.add_init_script(NO_BOARDS); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e))); pg.on('console', lambda m: errs.append(m.type + ': ' + m.text[:160]) if m.type == 'error' and '127.0.0.1:1/' not in m.text else None)
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
    # where a place on the menus (in their own pixels), or a place in the world, is on the glass
    async def ui(x, y): return await pg.evaluate("([x, y]) => { const k = VS.ui * cv.getBoundingClientRect().width / cv.width; return [x * k, y * k]; }", [x, y])
    async def world(x, y): return await pg.evaluate("([x, y]) => { const k = VS.s * cv.getBoundingClientRect().width / cv.width; return [(x - G.rcx) * k, (y - G.rcy) * k]; }", [x, y])
    async def until(js, ms=3000):
        for _ in range(ms // 50):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(50)
        return False
    async def typing(): return await pg.evaluate("document.activeElement === mobileTextInput")
    out = {}
    try:
        # ---- signing in: the game opens on the accounts board, and a phone has to be able to make an account ----
        FIT = "HITS.every(h => h.x >= 0 && h.y >= 0 && h.x + h.w <= VS.uw && h.y + h.h <= VS.uh)"
        async def press(pick):   # a finger on the middle of the game's own button that `pick` chooses out of HITS
            hx, hy = await pg.evaluate("(() => { const h = %s; return [h.x + h.w / 2, h.y + h.h / 2]; })()" % pick)
            x, y = await ui(hx, hy); await hold(x, y, 80); await pg.wait_for_timeout(200)
        board = [await pg.evaluate('G.state'), await pg.evaluate("HITS.length >= 1 && " + FIT)]
        await press("HITS.find(h => h.tag === 'btn:+ CREATE ACCOUNT')")
        board.append(await pg.evaluate("ACCOUNT.form === 'create' && HITS.length >= 5 && " + FIT)); fields = []
        for k, text in enumerate(('Mira_01!', 'p@ss word#9', 'p@ss word#9')):
            await press("HITS.filter(h => h.tag && h.tag.startsWith('field:'))[%d]" % k); fields.append([await pg.evaluate('UI.focus'), await typing()]); await pg.keyboard.type(text)
        await pg.wait_for_timeout(100); entered = await pg.evaluate("[FORM.accountName, FORM.accountPassword, FORM.accountConfirm]"); await picture()
        await press("HITS.find(h => String(h.fn).includes('accountCreate'))"); await until("G.state === 'title'", 8000)
        out['signin'] = [board, fields, entered, await pg.evaluate("[G.state, ACCOUNT.active && ACCOUNT.active.name, !!(ACCOUNT.active && ACCOUNT.active.hash), JSON.stringify(ACCOUNT.profiles).includes('p@ss')]")]
        # ---- the home screen, and a name typed with the phone's keyboard ----
        out['touch'] = await pg.evaluate('mobileDevice'); out['fits'] = await pg.evaluate("HITS.length >= 7 && HITS.every(h => h.x >= 0 && h.y >= 0 && h.x + h.w <= VS.uw && h.y + h.h <= VS.uh)"); await picture()
        x, y = await ui(*await pg.evaluate("[HITS[0].x + HITS[0].w / 2, HITS[0].y + HITS[0].h / 2]")); await hold(x, y, 80); await pg.wait_for_timeout(200)
        out['begin'] = [await pg.evaluate('G.state'), await pg.evaluate('UI.focus'), await typing()]
        await pg.evaluate("FORM.name = ''; mobileTextInput.value = ''; 0"); await pg.keyboard.type('Ash-fen 2!'); await pg.keyboard.press('Backspace'); await pg.keyboard.type("é" + 'x' * 30); name = await pg.evaluate('FORM.name')
        fx, fy = await pg.evaluate("(() => { const f = HITS.filter(h => h.tag && h.tag.startsWith('field:'))[1]; return [f.x + 8, f.y + 7]; })()"); x, y = await ui(fx, fy); await hold(x, y, 80); await pg.wait_for_timeout(150); await pg.keyboard.type('Q'); seed = await pg.evaluate("[UI.focus, FORM.seed.slice(-1), FORM.name.length]"); await picture()
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(100); out['typed'] = [name, seed, await pg.evaluate('UI.focus'), await typing()]
        out['screens'] = []
        for state in ('create', 'worlds', 'join', 'ring', 'brform'):
            await pg.evaluate("G.state = '%s'; if (!FORM.nick) FORM.nick = 'WAKER'; if (FORM.brcode === undefined) FORM.brcode = ''; 0" % state); await pg.wait_for_timeout(200); await picture()
            if await pg.evaluate("HITS.length < 3 || HITS.some(h => h.x < 0 || h.y < 0 || h.x + h.w > VS.uw || h.y + h.h > VS.uh)"): out['screens'].append(state)
        # ---- a world of your own ----
        await pg.evaluate(WORLD)
        for _ in range(100):
            if await pg.evaluate('G.state') in ('intro', 'play'): break
            await pg.wait_for_timeout(100)
        await pg.evaluate(AWAKE); await pg.evaluate(COUNT); await pg.evaluate(GROUND); await pg.wait_for_timeout(400); out['buttons'] = await seen()
        x0 = await pg.evaluate('G.p.x'); mx, my, mw, mh = await mid('#movePad'); await hold(mx, my, 700, mw * .4, 0); out['steered'] = round(await pg.evaluate('G.p.x') - x0); await picture()
        gx, gy = await pg.evaluate(GROUND); await pg.wait_for_timeout(300)
        y0 = await pg.evaluate('G.p.y'); jx, jy, *_ = await mid('#mobileJump'); await touch('touchStart', [(jx, jy)]); await pg.wait_for_timeout(260); out['jumped'] = round(y0 - await pg.evaluate('G.p.y')); await touch('touchEnd', []); await pg.wait_for_timeout(700)
        # (the view leans toward where the finger is, so the finger follows its tile)
        await pg.evaluate("(() => { const id = Object.keys(IT).find(k => IT[k].type === 'tool' && IT[k].kind === 'shovel'); inv[0] = { id, n: 1 }; G.sel = 0; })()")
        whole = "tileAt(%d + 2, %d) !== AIR && !CHIP.has(%d * WW + %d + 2)" % (gx, gy, gy, gx); whole0 = await pg.evaluate(whole)
        spot = "[(%d + 2) * T + 4, %d * T + 4]" % (gx, gy); await touch('touchStart', [await world(*await pg.evaluate(spot))])
        for _ in range(13): await pg.wait_for_timeout(200); await touch('touchMove', [await world(*await pg.evaluate(spot))])
        await touch('touchEnd', []); out['dug'] = [whole0, await pg.evaluate(whole), await pg.evaluate("countItem('dirt')") > 0]
        await pg.evaluate("for (const [id, n] of [['stick', 9], ['fiber', 14], ['rock', 6], ['flint', 4]]) addItem(id, n); 0")
        await tap('#mobilePack'); await until("UI.open === 'inv' && HITS.some(h => h.w > 100 && h.h === 18)"); await pg.wait_for_timeout(100); out['pack'] = [await pg.evaluate('UI.open'), await seen()]; await picture()
        rows = await pg.evaluate("(() => { const k = VS.ui * cv.getBoundingClientRect().width / cv.width; return HITS.filter(h => h.w > 100 && h.h === 18).map(h => [(h.x + h.w / 2) * k, (h.y + 9) * k]); })()"); made = await pg.evaluate("craftList()[0].r.out"); n0 = await pg.evaluate("countItem('%s')" % made); await hold(rows[0][0], rows[0][1], 60); await pg.wait_for_timeout(250); out['crafted'] = await pg.evaluate("countItem('%s')" % made) > n0
        before = await pg.evaluate("inv.filter(Boolean).map(s => s.id + s.n).join()"); px, py = rows[-1]; await touch('touchStart', [(px, py)])
        for k in range(1, 5): await touch('touchMove', [(px, py - 26 * k)]); await pg.wait_for_timeout(30)
        await touch('touchEnd', []); await pg.wait_for_timeout(200); out['scrolled'] = [await pg.evaluate('UI.scroll') > 0, before == await pg.evaluate("inv.filter(Boolean).map(s => s.id + s.n).join()")]
        await tap('#mobileClose'); out['closed'] = await pg.evaluate('UI.open')
        x, y = await ui(*await pg.evaluate("(() => { const h = hotbarLayout(); return [h.x + 2 * 19 + 9, h.y + 9]; })()")); await hold(x, y, 60); await pg.wait_for_timeout(120); out['slot'] = await pg.evaluate('G.sel')
        nomap = 'MAP' in await seen(); await pg.evaluate("addItem('fieldmap', 1); 0"); await until("!!document.getElementById('mobileMap').offsetParent"); await tap('#mobileMap'); await until("UI.open === 'map'"); m1 = await pg.evaluate('UI.open'); await picture(); await tap('#mobileClose'); out['map'] = [nomap, m1, await pg.evaluate('UI.open')]
        # LIGHT and HEAVY are the mouse's two buttons: each press is one blow, and a held button strikes once
        await pg.evaluate("(() => { const id = Object.keys(IT).find(k => IT[k].type === 'weapon'); inv[5] = { id, n: 1 }; G.sel = 5; blows.length = 0; })()")
        await tap('#attackLight', 60); await pg.wait_for_timeout(700); one = await pg.evaluate('blows.join("")'); await tap('#attackLight', 1500); await pg.wait_for_timeout(700); await tap('#attackHeavy', 60); out['blows'] = [one, await pg.evaluate('blows.join("")'), await pg.evaluate('mouse.l || mouse.r')]
        await pg.evaluate("G.p.hp = 40; G.p.healCd = 0; addItem('salve', 2); 0"); await tap('#mobileHeal'); out['healed'] = await pg.evaluate('G.p.hp') > 40
        ux, uy, *_ = await mid('#mobileUse'); await touch('touchStart', [(ux, uy)]); await pg.wait_for_timeout(150); f1 = await pg.evaluate('!!keys.KeyF'); await touch('touchEnd', []); await pg.wait_for_timeout(100); out['use held'] = [f1, await pg.evaluate('!!keys.KeyF')]; await pg.evaluate("if (UI.open) closeUI(); G.dialog = null; 0"); await until("!!document.getElementById('mobileMenu').offsetParent")  # (USE may have found a notice board or someone to talk to)
        await tap('#mobileMenu'); await until("UI.open === 'pause'"); m1 = await pg.evaluate('UI.open'); await picture(); await tap('#mobileClose'); out['menu'] = [m1, await pg.evaluate('UI.open')]
        # with friends in the world there is CHAT, the ENTER key of a keyboard: the line to type on opens with the phone's keyboard (the test only says a friend is here)
        nochat = 'CHAT' in await seen(); await pg.evaluate("COOP.role = 'host'; 0"); await until("!!document.getElementById('mobileChat').offsetParent"); await tap('#mobileChat'); c1 = await pg.evaluate("[COOP.chatOpen, document.activeElement.id]"); await pg.keyboard.type('hello'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(100)
        out['chat'] = [nochat, c1, await pg.evaluate("[COOP.chatOpen, COOP.chat.some(l => l.s === 'hello')]")]; await pg.evaluate("COOP.role = null; COOP.chat.length = 0; 0"); await until("!document.getElementById('mobileChat').offsetParent")
        # ---- a match of the Ashfall Trials ----
        await pg.evaluate("quitToTitle(); 0"); await pg.wait_for_timeout(200); await pg.evaluate(TRIALS); await pg.wait_for_timeout(600); await pg.evaluate(GROUND); await pg.wait_for_timeout(400)
        t = {'phase': await pg.evaluate('BR.phase'), 'buttons': await seen()}
        x0 = await pg.evaluate('G.p.x'); await hold(mx, my, 700, mw * .4, 0); t['steered'] = round(await pg.evaluate('G.p.x') - x0); await pg.evaluate(GROUND); await pg.wait_for_timeout(300)
        y0 = await pg.evaluate('G.p.y'); await touch('touchStart', [(jx, jy)]); await pg.wait_for_timeout(260); t['jumped'] = round(y0 - await pg.evaluate('G.p.y')); await touch('touchEnd', []); await pg.wait_for_timeout(700)
        hp0 = await pg.evaluate(ECHO)
        for _ in range(5): await pg.evaluate(ECHO); await tap('#attackLight', 60); await pg.wait_for_timeout(250)
        t['struck'] = await pg.evaluate('foe.hp') < hp0; await picture()
        # stand by a chest (the first one the Waker can stand still beside), then USE
        for k in range(6):
            await pg.evaluate("(() => { const p = G.p; for (const f of G.fighters) if (f !== p) f.x = f.px = p.x + 600; const c = window.chest = BR.chests.filter(c => !c.kind && !c.open && !c.feast && trLive(c) && !trSealed(c))[%d]; p.x = p.px = c.x * T - 6; p.y = p.py = (c.y + 1) * T - p.h; p.vx = p.vy = 0; snapCam(); })()" % k); await pg.wait_for_timeout(300)
            if await pg.evaluate("brNearChest(G.p) === chest && G.p.onGround && !UI.open"): break
        await tap('#mobileUse'); await until('!!chest.open', 1000); t['chest'] = await pg.evaluate('!!chest.open')
        await pg.evaluate("G.p.hp = 40; addItem('br_salve', 1); 0"); await tap('#mobileHeal'); await until("!!G.p.brUse || G.p.hp > 40", 1000); t['healing'] = await pg.evaluate("!!G.p.brUse || G.p.hp > 40 || countItem('br_salve') < 1")
        await tap('#mobileMap'); await until('!!BR.mapOpen', 1000); m1 = await pg.evaluate('!!BR.mapOpen'); await picture(); await tap('#mobileMap'); await until('!BR.mapOpen', 1000); t['map'] = [m1, await pg.evaluate('!!BR.mapOpen')]
        out['trials'] = t
        out['errors'] = errs[:4]; W, H = ims[0].size; sheet = Image.new('RGB', (W * 4, H * ((len(ims) + 3) // 4)))
        for i, m in enumerate(ims): sheet.paste(m, ((i % 4) * W, (i // 4) * H))
        sheet.save(shot('phone_%s.png' % label))
    finally:
        await b.close()
    print(label + ':', out)
    assert out['signin'][0] == ['accounts', True, True], 'the game should open on the accounts board, and the board and its form should fit a phone'
    assert out['signin'][1] == [['accountName', True], ['accountPassword', True], ['accountConfirm', True]], 'a finger on each account field should bring the keyboard up for it'
    assert out['signin'][2] == ['Mira_01', 'p@ss word#9', 'p@ss word#9'], 'a name keeps to the game\'s letters, a password may hold anything'
    assert out['signin'][3] == ['title', 'Mira_01', True, False], 'CREATE ACCOUNT should sign you in and lead to the home screen, with no password kept in the clear'
    assert out['touch'] and out['fits'], 'the home screen should fit a phone, every button of it'
    assert out['begin'] == ['create', 'name', True], 'BEGIN should open a new world with its name ready to type and the keyboard up'
    assert out['typed'] == ['Ash-fen ' + 'x' * 16, ['seed', 'Q', 24], None, False], 'typing should reach the field in hand, by the game\'s own rules, and ENTER should put the keyboard away'
    assert out['screens'] == [], 'every button of every menu should be on the glass, whichever way up the phone is held'
    assert out['buttons'] == ['JUMP', 'DASH', 'USE', 'HEAVY', 'LIGHT', 'PACK', 'HEAL', 'MENU'], 'the buttons of a world (no map yet, and never a pact)'
    assert out['steered'] > 20 and out['jumped'] > 10, 'the stick should steer and JUMP should jump'
    assert out['dug'] == [True, False, True], 'a finger held on the ground should dig where it points'
    assert out['pack'] == ['inv', ['CLOSE']] and out['crafted'] and out['scrolled'] == [True, True] and out['closed'] is None, 'the pack should open, craft by tapping, scroll by sliding, and close'
    assert out['slot'] == 2 and out['map'] == [False, 'map', None] and out['menu'] == ['pause', None], 'the hotbar, the map and the menu should all answer'
    assert out['blows'] == ['L', 'LLH', False], 'one press is one blow, and a held button strikes once, as a held mouse button does'
    assert out['healed'] and out['use held'] == [True, False], 'HEAL should heal, and USE should be F for as long as it is held'
    assert out['chat'] == [False, [True, 'ew-chat'], [False, True]], 'CHAT should show only with friends, open the line with the keyboard up, and ENTER should say it'
    t = out['trials']
    assert t['phase'] == 'fight' and 'PACT' not in t['buttons'] and {'JUMP', 'DASH', 'USE', 'HEAVY', 'LIGHT', 'PACK', 'MAP', 'HEAL', 'MENU'} == set(t['buttons']), 'the buttons of a match should be there'
    assert t['steered'] > 20 and t['jumped'] > 10 and t['struck'] and t['chest'] and t['healing'] and t['map'] == [True, False], 'in the Trials the stick, JUMP, LIGHT, USE, HEAL and MAP should all answer'
    assert not out['errors'], 'browser reported an error'


async def desktop(pw):
    b = await pw.chromium.launch(headless=True, args=['--no-sandbox'], **CHROME)
    ctx = await b.new_context(viewport={'width': 1280, 'height': 720}); await ctx.add_init_script(NO_BOARDS); pg = await ctx.new_page(); await pg.goto(GAME_URL); await pg.wait_for_timeout(800)
    await pg.evaluate("ACCOUNT.active = { id: 'test', name: 'TEST', skin: 0, hat: 0 }; SAVE.list = readLocalIndex(); G.state = 'title'; 0")   # (past the accounts board)
    await pg.evaluate(TRIALS); await pg.wait_for_timeout(600); await pg.evaluate(GROUND); await pg.wait_for_timeout(200); x0 = await pg.evaluate('G.p.x')
    await pg.mouse.move(700, 200); await pg.keyboard.down('KeyD'); await pg.mouse.down(); await pg.wait_for_timeout(900)
    held = await pg.evaluate("[!!keys.KeyD, mouse.l, document.getElementById('mobileControls').className]"); moved = round(await pg.evaluate('G.p.x') - x0); await pg.mouse.up(); await pg.keyboard.up('KeyD')
    # nothing of the touch controls is on the page to be seen or pressed, and the picture is its own size
    shown = await pg.evaluate("[mobileDevice, document.documentElement.className, [mobileControls, mobileTextInput, ...document.querySelectorAll('#mobileControls *')].filter(el => el.getClientRects().length).length, cv.width, cv.height]"); await b.close()
    print('desktop, running with the button held:', held, 'moved', moved, 'touch controls:', shown)
    assert held == [True, True, ''] and moved > 30, 'on a computer the touch controls must not let go of the keys or the mouse'
    assert shown == [False, '', 0, 1280, 720], 'on a computer none of the touch controls may show'


async def main():
    pw = await async_playwright().start()
    try:
        await phone(pw, 'landscape', 844, 390); await phone(pw, 'portrait', 390, 844); await desktop(pw)
        print('errors: none')
    finally:
        await pw.stop()


asyncio.run(main())
