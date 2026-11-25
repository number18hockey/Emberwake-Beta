# The Ashfall Trials as a team: two friends by game code in DUOS. They share a team, cannot hurt each other,
# one falls and the other rekindles them, both see the same night and its Hollow Ones, and they win together.
import asyncio, sys, io, os, time
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
from PIL import Image
URL = GAME_URL
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18841


async def main():
    Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []; ok = []
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
    def check(name, v, extra=''):
        ok.append((name, bool(v))); print(('  ok   ' if v else '  FAIL ') + name, extra)

    bA, A = await page('HOST'); bB, B = await page('FRIEND')
    await A.evaluate("G.nick = 'ALPHA'; FORM.nick = 'ALPHA'; COOP.br = true; BR.sizeWant = 2; brLobbyEnter('rtc', 'friends');")
    await wait(A, "!!COOP.gcode && sigReady()", 8000); code = await A.evaluate("COOP.gcode")
    await B.evaluate("FORM.nick = 'BRAVO'; G.state = 'join';"); await B.evaluate("sigJoin(%r)" % code)
    check('the friend reaches the lobby', await wait(B, "BR.on && G.state === 'brlobby' && BR.via === 'rtc'", 25000))
    check('the friend sees the host chose DUOS', await wait(B, "BR.sizeWant === 2", 6000))
    lobby = await B.screenshot()
    await A.wait_for_timeout(800); await A.evaluate("BR.startNow = true")
    okA = await wait(A, "G.state === 'play' && BR.phase === 'drop'"); okB = await wait(B, "G.state === 'play' && BR.phase === 'drop'")
    check('both are in the match on the same island', okA and okB and (await A.evaluate("BR.seed")) == (await B.evaluate("BR.seed")))
    await wait(B, "NET.peers.size > 0 && BR.bots.size >= 10", 8000); await wait(A, "NET.peers.size > 0", 8000)
    tA = await A.evaluate("[BR.size, BR.tms.join(''), G.p.team, [...NET.peers.values()][0].team, BR.nteams]"); tB = await B.evaluate("[BR.size, BR.tms.join(''), G.p.team, [...NET.peers.values()][0].team, BR.nteams]")
    check('both know the same six teams of two', tA[0] == 2 and tA[1] == tB[1] and tA[4] == 6, str(tA))
    check('the two friends are one team', tA[2] == tA[3] == tB[2] == tB[3])
    ped = await A.evaluate("[Math.round(G.p.x / T), Math.round([...NET.peers.values()][0].x / T)]")
    check('they stand on neighbouring plinths', abs(ped[0] - ped[1]) == 7, str(ped))
    start = await A.screenshot()
    check('the horn frees both', await wait(A, "BR.phase === 'fight' && !G.p.onBarge", 16000) and await wait(B, "BR.phase === 'fight' && !G.p.onBarge", 6000))
    await A.evaluate("G.p.inv = 1e9; 1"); await B.evaluate("G.p.inv = 1e9; 1")
    check('teammates are not each other\'s foes', await A.evaluate("!G.p.foes.includes([...NET.peers.values()][0])") and await B.evaluate("!G.p.foes.includes([...NET.peers.values()][0])"))
    mates = await A.evaluate("G.fighters.filter(f => trMate(f)).map(f => f.name).join(',')")
    check('the host\'s team panel lists the friend', mates == 'BRAVO', mates)

    # ---- the friend falls; the host rekindles them ----
    await B.evaluate("G.p.inv = 0; G.p.hp = 0; killFighter(G.p, null); 1")
    check('the fallen friend leaves an ember (on both screens)', await wait(B, "G.p.dead && trCanRise(G.p)", 3000) and await wait(A, "(() => { const f = [...NET.peers.values()][0]; return f.dead && trCanRise(f); })()", 5000))
    print('   host sees:', await A.evaluate("(() => { const f = [...NET.peers.values()][0]; return JSON.stringify([f.dead, f.rk, f.fellAt, BR.t, BR.size, f.team, G.p.team, brAlive().map(o => o.name + ':' + o.team).join(',')]); })()"), ' friend:', await B.evaluate("JSON.stringify([G.p.dead, G.p.rk, BR.t, BR.place])"))
    check('the team is not out while one stands', await B.evaluate("BR.place === 0 && BR.phase === 'fight'"))
    await A.evaluate("(() => { const f = [...NET.peers.values()][0], p = G.p; p.x = p.px = f.rk.x - 3; p.y = p.py = f.rk.y - p.h + 2; p.vx = p.vy = 0; keys.KeyF = true; })()")
    await A.wait_for_timeout(900); held = await A.screenshot()
    rose = await wait(B, "!G.p.dead && G.p.hp > 0", 8000); await A.evaluate("keys.KeyF = false; 1")
    check('holding F at the ember rekindles the friend', rose, str(await B.evaluate("[G.p.dead, Math.round(G.p.hp), BR.place]")))
    check('the host sees the friend standing again', await wait(A, "!([...NET.peers.values()][0].dead)", 5000))
    await B.evaluate("G.p.inv = 1e9; 1")

    # ---- night comes for both, with its Hollow Ones ----
    await A.evaluate("BR.t = trTickAt(TR_DAY) - 40; 1")
    check('night falls on both screens', await wait(A, "trClock().night", 6000) and await wait(B, "trClock().night", 6000))
    check('the host raises Hollow Ones and the friend sees them', await wait(A, "[...BR.bots.values()].filter(f => f.hunter && !f.dead).length >= 2", 5000) and await wait(B, "[...BR.bots.values()].filter(f => f.hunter && f.remote && !f.dead).length >= 2", 6000))
    night = await B.screenshot()
    # ---- they win together ----
    await A.evaluate("for (const f of [...BR.bots.values()]) if (!f.dead && !f.remote && f.team !== G.p.team) { f.hp = 0; killFighter(f, G.p); } 1")
    check('when every other team is down, both friends win', await wait(A, "BR.phase === 'over' && BR.winMe", 6000) and await wait(B, "BR.phase === 'over' && BR.winMe", 8000), str(await B.evaluate("[BR.phase, BR.winMe, BR.winner, BR.place]")))
    await A.wait_for_timeout(1800); won = await B.screenshot()
    ims = [Image.open(io.BytesIO(x)).convert('RGB') for x in (lobby, start, held, night, won)]
    w, h = ims[0].size; out = Image.new('RGB', (w * 3, h * 2), (20, 20, 30))
    for i, im in enumerate(ims): out.paste(im, ((i % 3) * w, (i // 3) * h))
    out.resize((w * 3 // 2, h)).save(shot('royale_teams.png'))
    bad = [n for n, v in ok if not v]; pe = [e for e in errs if 'PAGEERROR' in e]
    print('errors:', pe[:6])
    print('ALL PASS' if not bad and not pe else 'FAILED: %d' % (len(bad) + len(pe)))
    await bA.close(); await bB.close(); await pw.stop()
asyncio.run(main())
