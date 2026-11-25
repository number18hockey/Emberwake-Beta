# The Ashfall with friends by game code: the host opens a lobby, a friend joins, and the match starts for both.
# The Ashfall with friends from the plain HTML file: the host opens a lobby, a friend joins with the game code,
# and the match starts for both. Then the two make a pact and one walks out of it, an echo is asked for one,
# dug ground shows on both screens, and a dropped thing can only be picked up once.
# A local stand-in broker plays the public ones.
import asyncio, sys, io, os, time
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
URL = GAME_URL
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18832
async def main():
    Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []; res = {}
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME); ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type == 'error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(700); return b, pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    bA, A = await page('HOST'); bB, B = await page('FRIEND')
    await A.evaluate("G.nick = 'ALPHA'; FORM.nick = 'ALPHA'; COOP.br = true; brLobbyEnter('rtc', 'friends');")
    await wait(A, "!!COOP.gcode && sigReady()", 8000); code = await A.evaluate("COOP.gcode")
    res['host lobby code'] = code
    await B.evaluate("FORM.nick = 'BRAVO'; G.state = 'join';"); await B.evaluate("sigJoin(%r)" % code)
    ok = await wait(B, "BR.on && G.state === 'brlobby' && BR.via === 'rtc'", 25000)
    res['friend in the host lobby'] = [ok, await B.evaluate("[NET.me, BR.leaderId]")]
    await A.wait_for_timeout(1200)
    res['host lobby sees'] = await A.evaluate("[...BR.people.values()].map(q => q.n + ':' + q.ph).join(',')")
    await A.evaluate("BR.startNow = true")
    okA = await wait(A, "G.state === 'play' && BR.phase === 'drop'"); okB = await wait(B, "G.state === 'play' && BR.phase === 'drop'")
    res['both in the match, same seed'] = [okA, okB, (await A.evaluate("BR.seed")) == (await B.evaluate("BR.seed"))]
    await B.wait_for_timeout(1500)
    res['friend sees host and echoes'] = await B.evaluate("[[...NET.peers.values()].map(f => f.name).join(','), [...BR.bots.values()].filter(f => f.remote).length]")
    await B.evaluate("keys.KeyS = true; 0"); await wait(B, "!G.p.glide && G.p.onGround", 45000); await B.evaluate("keys.KeyS = false; 0"); await B.wait_for_timeout(600)
    bx = await B.evaluate("G.p.x"); hx = await A.evaluate("(() => { const f = [...NET.peers.values()][0]; return f ? f.x : -1; })()")
    res['host sees the friend where they landed (px apart)'] = round(abs(bx - hx), 1)
    # side by side, out of everyone else's way
    stand = "void (() => { const p = G.p, tx = %d; p.glide = false; p.noHit = false; p.inv = 1e9; p.hp = 100; p.x = p.px = tx * T; p.y = p.py = (heights[tx] - 3) * T; while (boxHits(p.x, p.y, p.w, p.h)) { p.y -= T; p.py = p.y; } p.vx = p.vy = 0; BR.mobT = 1e9; })()"
    await A.evaluate("for (const f of BR.bots.values()) { f.ai = null; f.noHit = true; f.hp = 100; } 0")
    await A.evaluate(stand % 1600); await B.evaluate(stand % 1604); await A.wait_for_timeout(1500)
    await A.evaluate("brPactKey(G.p)"); offered = await wait(B, "!!BR.pactFrom", 6000); await B.evaluate("brPactKey(G.p)")
    made = [await wait(A, "!!BR.teammate", 6000), await wait(B, "!!BR.teammate", 6000)]
    same = (await A.evaluate("G.p.team")) == (await B.evaluate("G.p.team"))
    res['pact: offered, made on both, one team'] = [offered, made, same]
    await B.evaluate("brPactKey(G.p); brPactKey(G.p)"); left = await wait(A, "!BR.teammate && G.p.team === 'me'", 6000); await A.wait_for_timeout(1200)
    res['pact left: host told, both on their own again'] = [left, await A.evaluate("[BR.teammate, G.p.team]"), await B.evaluate("[BR.teammate, G.p.team]")]
    assert offered and all(made) and same and left, 'a pact should form on both screens, and end on both when one leaves'
    # the friend asks one of the host's echoes
    await A.evaluate("void (() => { const b = [...BR.bots.values()][0]; b.dead = false; b.noHit = false; b.br.roll = 0; b.br.bold = .1; b.br.ally = null; b.br.asked = -99999; b.lastHitBy = null; b.x = b.px = 1607 * T; b.y = b.py = G.p.y; BR.lastAlive = 30; })()"); await A.wait_for_timeout(1500)
    tag = await A.evaluate("[...BR.bots.values()][0].botTag")
    await B.evaluate("BR.pactBroke = -999; BR.pactWith = %r; 0" % tag); res['an echo run by the host takes a pact with the friend'] = [await wait(B, "BR.teammate === %r" % tag, 8000), await A.evaluate("BR.bots.get(%r).team" % tag)]
    await B.evaluate("brPactKey(G.p); brPactKey(G.p)"); res['and is let go'] = await wait(A, "BR.bots.get(%r).team === %r" % (tag, tag), 8000)
    # dug ground, and goods
    i = await A.evaluate("(() => { const x = 1601, y = heights[1601]; setTile(x, y, AIR); return y * WW + x; })()"); res['dug ground shows on the other screen'] = await wait(B, "tiles[%d] === AIR" % i, 6000)
    await A.evaluate("spawnDrop('flint', 3, 1612 * T, (heights[1612] - 3) * T, 0, 0); 0"); seen = await wait(B, "G.drops.some(d => d.id === 'flint')", 6000)
    await B.evaluate(stand % 1612); took = await wait(B, "countItem('flint') === 3", 8000); gone = await wait(A, "!G.drops.some(d => d.id === 'flint')", 6000)
    res['dropped goods: seen by both, picked up once'] = [seen, took, gone, await A.evaluate("countItem('flint')")]
    assert seen and took and gone, 'what one Waker picks up should be gone for the other'
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', errs[:6])
    await bA.close(); await bB.close(); await pw.stop()
asyncio.run(main())
