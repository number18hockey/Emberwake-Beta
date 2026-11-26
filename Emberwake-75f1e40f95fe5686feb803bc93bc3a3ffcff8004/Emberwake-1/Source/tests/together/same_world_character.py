# Two friends in a world with traits: the guest must work out the same traits, moods and curios from the seed,
# and share the host's day of the year and weather.
import asyncio, sys, io, os, json
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, CHROME
from broker import Broker
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18871
WHAT = """JSON.stringify({ land: WORLD.land, traits: WT_KEYS, moods: [-9000, -5000, -2500, -900, 900, 2500, 5000, 9000].map(d => biomeE(X0 + d) + moodAt(X0 + d)),
  curios: (() => { const out = []; for (let k = floor((X0 - 6000) / CURIO_W); k <= floor((X0 + 6000) / CURIO_W); k++) { const c = curioOf(k); if (c) out.push(c.x + c.kind); } return out; })(), lakes: (() => { let n = 0; for (let k = floor((X0 - 6000) / lakeW()); k <= floor((X0 + 6000) / lakeW()); k++) if (lakeOf(k)) n++; return n; })(), surf: [1, 2, 3, 4, 5, 6].map(i => surf(X0 + i * 733)) })"""


async def main():
    Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []; ok = []
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME); ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e))); await pg.goto(GAME_URL); await pg.wait_for_timeout(700); return b, pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    def check(name, v, extra=''):
        ok.append((name, bool(v))); print(('  ok   ' if v else '  FAIL ') + name, extra)

    bA, A = await page('HOST'); bB, B = await page('GUEST')
    # seed 18 is a DROWNED, FERAL, MISTBOUND world: its lakes and its climate differ from a plain one, so a guest who got it wrong would show
    await A.evaluate("Object.assign(WORLD,{id:'tw',name:'Trait World',seed:18,size:1,shape:0,mode:0,arena:false}); G.skin=0; FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'"); await A.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.p.inv=999999; UI.open = 'coop';")
    check('the host has a game code', await wait(A, "!!COOP.gcode && sigReady()", 10000)); code = await A.evaluate("COOP.gcode")
    await B.evaluate("FORM.nick = 'BRAVO'; G.state = 'join';"); await B.evaluate("sigJoin(%r)" % code)
    check('the friend joins', await wait(B, "G.state==='play' && WORLD.guest && COOP.joined", 30000))
    a = json.loads(await A.evaluate(WHAT)); b = json.loads(await B.evaluate(WHAT))
    print('   host :', a['land'], a['traits'], a['moods'], len(a['curios']), 'curios', a['lakes'], 'lakes'); print('   guest:', b['land'], b['traits'], b['moods'], len(b['curios']), 'curios', b['lakes'], 'lakes')
    check('both know the same three traits', a['traits'] == b['traits'] and len(a['traits']) == 3 and a['land'] == b['land'] == 5)
    check('the same moods, the same curios, the same lakes and hills', a['moods'] == b['moods'] and a['curios'] == b['curios'] and len(a['curios']) > 5 and a['lakes'] == b['lakes'] and a['surf'] == b['surf'])
    # the year and the weather follow the host
    await A.evaluate("G.days = 7.31; G.wx = { k: 'rain', t: 5000, a: .8 }; 1")
    got = await wait(B, "abs(worldDays() - 7.31) < .05 && !!G.wx && G.wx.k === 'rain'", 8000)
    check('the guest is on the host\'s day, in the host\'s season, in the host\'s rain', got, str(await B.evaluate("[worldDays().toFixed(2), SEASON().n, G.wx && G.wx.k]")))
    await A.evaluate("G.wx = null; 1"); await B.wait_for_timeout(2500)
    check('and the rain stops for both', await wait(B, "!G.wx || G.wx.t <= 240", 6000))
    for e in errs[:5]: print('  ', e[:300])
    bad = [n for n, v in ok if not v]
    print('errors:', errs[:3]); print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
    await bA.close(); await bB.close(); await pw.stop()
    return not bad and not errs

if __name__ == '__main__':
    sys.exit(0 if asyncio.run(main()) else 1)
