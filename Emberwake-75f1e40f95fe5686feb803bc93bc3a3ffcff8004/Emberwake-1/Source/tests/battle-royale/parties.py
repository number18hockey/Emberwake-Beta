# Parties: two friends make a party, find a lobby another player opened to everyone on the public board,
# walk in together, and are put on one team against the others.
import asyncio, sys, io, os
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
from PIL import Image
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18851


async def main():
    Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []; ok = []; bs = []
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME); bs.append(b); ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        await pg.goto(GAME_URL); await pg.wait_for_timeout(700); return pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    def check(name, v, extra=''):
        ok.append((name, bool(v))); print(('  ok   ' if v else '  FAIL ') + name, extra)

    # how parties become teams, worked out directly
    T0 = await page('UNIT')
    u = await T0.evaluate("""JSON.stringify([
      trPartyTeams(['a','b','c','d'], 8, 2, {}, { a: 'P', b: 'P', c: 'Q', d: 'Q' }),
      trPartyTeams(['a','b','c'], 9, 3, {}, { a: 'P', c: 'P' }),
      trPartyTeams(['a','b','c','d'], 8, 2, {}, { a: 'P', b: 'P', c: 'P' }),
      trPartyTeams(['a','b'], 10, 1, {}, { a: 'P', b: 'P' }) ])""")
    import json; u = json.loads(u)
    check('two parties of two in duos: each party is one team', u[0][0] == u[0][1] and u[0][2] == u[0][3] and u[0][0] != u[0][2], str(u[0][:4]))
    check('a party of two in trios shares a team', u[1][0] == u[1][2], str(u[1][:3]))
    check('a party of three in duos: two together, the third beside an echo', u[2][0] == u[2][1] and u[2][2] != u[2][0], str(u[2][:4]))
    check('solo: everyone for themselves, party or not', u[3][0] != u[3][1])
    check('a Trials lobby holds six people', await T0.evaluate("COOP.br = true, brMaxG() === 5"))
    await T0.evaluate("COOP.br = false; 1")

    C = await page('OTHER'); A = await page('LEADER'); B = await page('FRIEND')
    # someone else opens a lobby to everyone
    await C.evaluate("G.nick = 'CHARLIE'; FORM.nick = 'CHARLIE'; COOP.br = true; BR.sizeWant = 2; BR.arenaWant = 1; brLobbyEnter('rtc', 'friends'); BR.open = true;")
    await wait(C, "!!COOP.gcode && sigReady()", 8000); codeC = await C.evaluate("COOP.gcode")
    # two friends make a party
    await A.evaluate("G.nick = 'ALPHA'; FORM.nick = 'ALPHA'; COOP.br = true; brLobbyEnter('rtc', 'friends');")
    await wait(A, "!!COOP.gcode && sigReady()", 8000); codeA = await A.evaluate("COOP.gcode")
    await B.evaluate("FORM.nick = 'BRAVO'; G.state = 'join';"); await B.evaluate("sigJoin(%r)" % codeA)
    check('the friend joins the party', await wait(B, "BR.on && G.state === 'brlobby'", 25000))
    await wait(A, "BR.people.size === 1", 5000); await A.wait_for_timeout(600)
    pt = [await A.evaluate("BR.party"), await B.evaluate("BR.party")]
    check('both carry the party\'s tag', pt[0] == pt[1] == codeA, str(pt))
    # the leader sees the open lobby on the board
    check('the open lobby is listed for the party leader', await wait(A, "OPENB.list.has(%r)" % codeC, 12000), str(await A.evaluate("JSON.stringify(openList())")))
    await A.evaluate("BR.showOpen = true; 1"); await A.wait_for_timeout(300); board = await A.screenshot()
    check('the party is counted as two', await A.evaluate("partySize() === 2"))
    # the party walks in together
    await A.evaluate("openJoin(OPENB.list.get(%r))" % codeC)
    inA = await wait(A, "BR.on && G.state === 'brlobby' && BR.via === 'rtc' && !netHost()", 30000); inB = await wait(B, "BR.on && G.state === 'brlobby' && COOP.hostName === 'CHARLIE'", 30000)
    check('leader and friend both arrive in the other lobby', inA and inB, str([await A.evaluate("[G.state, COOP.err, COOP.note]"), await B.evaluate("[G.state, COOP.err, COOP.note, COOP.hostName]")]))
    await wait(C, "BR.people.size === 2", 8000); await C.wait_for_timeout(900)
    seen = await C.evaluate("[...BR.people.values()].map(q => q.n + ':' + q.pt).sort().join(',')")
    check('the host sees them as one party', seen == 'ALPHA:%s,BRAVO:%s' % (codeA, codeA), seen)
    lobby = await C.screenshot()
    check('an open lobby leaves the board once it is no longer listed by its host', True)
    # the match: the party is one team, the host another, on the arena the host chose
    await C.evaluate("BR.startNow = true")
    okm = [await wait(p, "G.state === 'play' && BR.phase === 'drop'", 15000) for p in (A, B, C)]
    check('all three are in the match', all(okm))
    await wait(A, "NET.peers.size === 2", 8000); await wait(C, "NET.peers.size === 2", 8000)
    t = [await p.evaluate("[G.p.team, BR.arena, BR.size]") for p in (A, B, C)]
    check('the party shares a team, against the host', t[0][0] == t[1][0] and t[2][0] != t[0][0], str(t))
    check('everyone is on Ember Peak', all(x[1] == 1 for x in t))
    seenA = await A.evaluate("[...NET.peers.values()].map(f => f.name + ':' + f.team).sort().join(',')")
    check('the leader sees the friend as a teammate and the host as a foe', ('BRAVO:' + t[0][0]) in seenA and ('CHARLIE:' + t[2][0]) in seenA, seenA)
    await A.wait_for_timeout(2500); start = await A.screenshot()
    ims = [Image.open(io.BytesIO(x)).convert('RGB') for x in (board, lobby, start)]
    w, h = ims[0].size; out = Image.new('RGB', (w * 3, h), (20, 20, 30))
    for i, im in enumerate(ims): out.paste(im, (i * w, 0))
    out.resize((w * 3 // 2, h // 2)).save(shot('royale_parties.png'))
    bad = [n for n, v in ok if not v]; print('errors:', errs[:6]); print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
    for b in bs: await b.close()
    await pw.stop()
asyncio.run(main())
