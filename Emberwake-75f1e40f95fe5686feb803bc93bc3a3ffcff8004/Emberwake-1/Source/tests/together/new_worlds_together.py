# Two friends past the floors: the guest follows the host into the Long Winter and the Stormhead, both stand on the
# same ground, each feels the cold for themselves, and the guest sees a guardian's lightning (and is hurt by it).
import asyncio, sys, io, os
from playwright.async_api import async_playwright
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
URL = GAME_URL
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
HASH = "(() => { let h = 0; const x0 = SPAWN_X - 40; for (let x = x0; x < x0 + 80; x++) for (let y = 20; y < min(WH, 160); y++) h = (h * 31 + tiles[y * WW + x] * 7 + walls[y * WW + x]) | 0; return h; })()"


async def main():
    pw = await async_playwright().start(); errs = []; bs = []; ok = []
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME); bs.append(b)
        pg = await (await b.new_context(viewport={'width': 960, 'height': 540})).new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(800); return pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    def check(name, v, extra=''):
        ok.append((name, bool(v))); print(('  ok   ' if v else '  FAIL ') + name, extra)
    A = await page('HOST'); B = await page('GUEST')
    await A.evaluate("Object.assign(WORLD,{id:'nw',name:'Past',seed:4242,size:1,shape:0,mode:0,arena:false}); G.skin=0; FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.cine=null; G.says.length=0; G.sayCur=null; G.time=700; G.spawnT=1e9; G.p.inv=999999; for (let d = 1; d <= 7; d++) G.flags['dim' + d] = G.flags['seen' + d] = 1;")
    await A.evaluate("coopInvite()"); await wait(A, "!!COOP.code"); code = await A.evaluate("COOP.code")
    await B.evaluate("FORM.nick='BRAVO'; G.state='join';"); await B.evaluate("coopAnswer(%r)" % code); await wait(B, "!!COOP.reply")
    await A.evaluate("coopConnect(%r)" % await B.evaluate("COOP.reply")); await wait(B, "G.state==='play' && COOP.joined", 20000)
    await B.evaluate("G.cine=null; G.says.length=0; G.sayCur=null; G.p.inv=999999;")
    ims = []
    for d, name in ((4, 'the Long Winter'), (6, 'the Stormhead')):
        await A.evaluate("G.spawnT = 1e9; enterDim(%d, true)" % d)
        check('the guest follows the host into ' + name, await wait(B, "DIM === %d && G.state === 'play'" % d, 12000))
        await B.wait_for_timeout(1200); await A.evaluate("G.enemies.length = 0; G.spawnT = 1e9; 1")
        ha, hb = await A.evaluate(HASH), await B.evaluate(HASH)
        check('both stand on the same ground there', ha == hb, '%s %s' % (ha, hb))
        near = await B.evaluate("abs(G.p.x - COOP.peers.get('h').f.x) < 200")
        check('the guest arrives beside the host', near)
        if d == 4:
            for pg in (A, B):   # out into the open, away from the fire where travellers arrive
                await pg.evaluate("(() => { const tx = SPAWN_X + 70; streamTo(tx * T, true); const p = G.p; p.x = p.px = tx * T; p.y = p.py = (groundAt(tx) - 4) * T; let n = 0; while (boxHits(p.x, p.y, p.w, p.h) && n++ < 80) p.y = p.py = p.y - T; p.vx = p.vy = 0; p.chill = 0; G.cine = null; snapCam(); })()")
            await B.wait_for_timeout(3000)
            ch = [await A.evaluate("Math.round(G.p.chill || 0)"), await B.evaluate("Math.round(G.p.chill || 0)")]
            check('each of them feels the cold', ch[0] > 0 and ch[1] > 0, str(ch))
        ims.append(Image.open(io.BytesIO(await B.screenshot())).convert('RGB'))
    # the Stormwright's lightning, called by the host's game, lands on the guest's screen too
    for pg in (A, B):
        await pg.evaluate("(() => { streamTo(DARENA_X * T, true); const p = G.p; p.x = p.px = (DARENA_X - 10) * T; p.y = p.py = (DARENA_Y - 4) * T; let n = 0; while (boxHits(p.x, p.y, p.w, p.h) && n++ < 80) p.y = p.py = p.y - T; p.vx = p.vy = 0; p.inv = 0; p.hp = p.maxhp; snapCam(); })()")
    await B.wait_for_timeout(900)
    await A.evaluate("(() => { const b = bossSpawn('stormwright', DARENA_X * T, (DARENA_Y - 12) * T); b.nid = COOP.nid++; window.BOSS = b; })()")
    check('the guest sees the guardian', await wait(B, "!!G.boss && G.boss.ghost", 6000))
    await B.evaluate("window.HZ = 0; const oh = onHaz; onHaz = function (m) { HZ++; return oh(m); }; G.cine = null; G.p.inv = 0; 1")
    gx = await B.evaluate("G.p.x + 3"); gy = await B.evaluate("groundAt(floor((G.p.x + 3) / T)) * T")
    await A.evaluate("G.p.inv = 999999; strikeAt(%s, %s, true, { warn: 40 }); 1" % (gx, gy))
    for _ in range(16): await B.evaluate("G.cine = null; if (G.p.inv > 60) G.p.inv = 0; 1"); await B.wait_for_timeout(100)
    r = await B.evaluate("[HZ, Math.round(G.p.hp), G.p.maxhp]")
    check('a guardian\'s lightning is shown to the guest and can hurt them', r[0] >= 1 and r[1] < r[2], str(r))
    ims.append(Image.open(io.BytesIO(await B.screenshot())).convert('RGB'))
    w, h = ims[0].size; out = Image.new('RGB', (w * len(ims), h), (20, 20, 30))
    for i, im in enumerate(ims): out.paste(im, (i * w, 0))
    out.resize((w * len(ims) // 2, h // 2)).save(shot('coop_new_worlds.png'))
    bad = [n for n, v in ok if not v]
    print('errors:', errs[:6]); print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
    for b in bs: await b.close()
    await pw.stop()
asyncio.run(main())
