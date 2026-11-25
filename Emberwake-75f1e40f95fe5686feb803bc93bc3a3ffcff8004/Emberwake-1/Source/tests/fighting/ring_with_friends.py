# The Cinder Ring with friends by game code, from the plain HTML file (no claude.ai room): the host lights a
# ring, a friend joins it with JOIN A FRIEND, both see each other move, a blow lands across the line, a
# takedown counts for the right person, and leaving ends it cleanly for the friend.
import asyncio, sys, io, os, time
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
from PIL import Image
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18852
async def main():
    Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []; ok = True
    def check(name, cond, info=''):
        nonlocal ok; ok = ok and bool(cond); print(('PASS ' if cond else 'FAIL ') + name, info)
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME); ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type == 'error' else None)
        await pg.goto(GAME_URL); await pg.wait_for_timeout(700); return b, pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    bA, A = await page('HOST'); bB, B = await page('FRIEND')
    check('the claude.ai room is not here (plain file)', not await A.evaluate("!!NET.room"))
    # the host lights a ring from the ring screen's button
    await A.evaluate("FORM.nick = 'ALPHA'; G.state = 'ring';"); await A.wait_for_timeout(300)
    await A.evaluate("coopReset(); enterArena('ALPHA', 0, 'friends', 'rtc');")
    check('the host is in its ring', await wait(A, "WORLD.arena && G.state === 'play' && NET.via === 'rtc'", 5000))
    check('the host has a game code', await wait(A, "!!COOP.gcode && sigReady()", 10000)); code = await A.evaluate("COOP.gcode")
    # the friend joins with it
    await B.evaluate("FORM.nick = 'BRAVO'; G.state = 'join';"); await B.evaluate("sigJoin(%r)" % code)
    check('the friend lands in the ring', await wait(B, "WORLD.arena && G.state === 'play' && NET.via === 'rtc' && NET.peers.size === 1", 25000))
    check('the host sees the friend', await wait(A, "NET.peers.size === 1 && [...NET.peers.values()][0].name === 'BRAVO'", 8000))
    check('the echoes stepped aside', await wait(A, "!G.fighters.some(f => f.echoBot)", 5000) and await wait(B, "!G.fighters.some(f => f.echoBot)", 5000))
    # both move; each sees the other where they really are
    await A.evaluate("(() => { const p = G.p; p.x = p.px = 60 * T; p.y = p.py = 20 * T; p.vx = p.vy = 0; })()")
    await B.evaluate("(() => { const p = G.p; p.x = p.px = 66 * T; p.y = p.py = 20 * T; p.vx = p.vy = 0; })()")
    await A.wait_for_timeout(1500)
    ax = await A.evaluate("G.p.x"); bx = await B.evaluate("G.p.x")
    seenB = await A.evaluate("[...NET.peers.values()][0].x"); seenA = await B.evaluate("[...NET.peers.values()][0].x")
    check('each sees the other where they stand', abs(seenB - bx) < 12 and abs(seenA - ax) < 12, (round(ax), round(seenA), round(bx), round(seenB)))
    # a blow from the host lands on the friend
    hp0 = await B.evaluate("G.p.hp")
    await A.evaluate("(() => { const f = [...NET.peers.values()][0]; strike(G.p, f, 18, 2, -1, {}); })()")
    await wait(B, "G.p.hp < %d" % hp0, 4000); hp1 = await B.evaluate("G.p.hp")
    check('a blow lands across the line', hp1 < hp0, (hp0, hp1))
    # a takedown counts for the host
    for k in range(12):
        if await B.evaluate("G.p.dead"): break
        await A.evaluate("(() => { const f = [...NET.peers.values()][0]; if (f && !f.dead) strike(G.p, f, 30, 2, -1, {}); })()"); await A.wait_for_timeout(450)
    await A.wait_for_timeout(1500)
    k = await A.evaluate("G.p.kills"); d = await B.evaluate("G.p.deaths")
    check('the takedown counts for the host', k >= 1 and d >= 1, (k, d))
    im = Image.open(io.BytesIO(await B.screenshot())); im.save(shot('ring_friends.png'))
    # the host leaves: the friend is told and goes back to the join screen
    await A.evaluate("quitToTitle()")
    check('the friend hears the host left', await wait(B, "G.state === 'join' && !WORLD.arena", 20000), await B.evaluate("[G.state, COOP.err]"))
    print('errors:', errs[:6])
    await bA.close(); await bB.close(); await pw.stop(); print('ALL PASS' if ok else 'SOME FAILED')
asyncio.run(main())
