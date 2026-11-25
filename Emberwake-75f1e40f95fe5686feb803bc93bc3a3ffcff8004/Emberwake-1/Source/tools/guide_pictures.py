#!/usr/bin/env python3
# Takes the pictures in the guide straight from the game, so they always match it:
#   python3 tools/guide_pictures.py      (from Source; then python3 build.py)
# Needs what the tests need (Playwright and Pillow). Saves to Source/guide/pictures/.
import asyncio, io, os, sys
SOURCE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(SOURCE, 'tests', 'helpers'))
from where import GAME_URL, CHROME
from broker import Broker
from playwright.async_api import async_playwright
from PIL import Image

OUT = os.path.join(SOURCE, 'guide', 'pictures')
SIZE = {'width': 1120, 'height': 630}
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18901


def four(pngs, name):
    """four pictures in one, two by two"""
    os.makedirs(OUT, exist_ok=True); ims = [Image.open(io.BytesIO(p)).convert('RGB') if isinstance(p, bytes) else p for p in pngs]; w, h = ims[0].size
    out = Image.new('RGB', (w, h), (18, 13, 31))
    for i, im in enumerate(ims[:4]): out.paste(im.resize((w // 2 - 2, h // 2 - 2), Image.LANCZOS), ((i % 2) * (w // 2 + 2), (i // 2) * (h // 2 + 2)))
    out.save(os.path.join(OUT, name), 'JPEG', quality=86, optimize=True, progressive=True); print('saved', name)


def zoomed(png, fx, k=3):
    """the part of a picture round a point (fractions of it), k times the size"""
    im = Image.open(io.BytesIO(png)).convert('RGB'); w, h = im.size; cw, ch = w // k, h // k
    x = min(max(int(fx[0] * w - cw / 2), 0), w - cw); y = min(max(int(fx[1] * h - ch / 2), 0), h - ch)
    return im.crop((x, y, x + cw, y + ch)).resize((w, h), Image.NEAREST)


def save(png, name, zoom=None):
    """zoom = (cx, cy) as fractions of the picture: keep the half of it round that point, at twice the size"""
    os.makedirs(OUT, exist_ok=True)
    im = Image.open(io.BytesIO(png)).convert('RGB')
    if zoom:
        w, h = im.size; x = min(max(int(zoom[0] * w - w / 4), 0), w // 2); y = min(max(int(zoom[1] * h - h / 4), 0), h // 2)
        im = im.crop((x, y, x + w // 2, y + h // 2)).resize((w, h), Image.NEAREST)
    im.save(os.path.join(OUT, name), 'JPEG', quality=84, optimize=True, progressive=True)
    print('saved', name)


async def main():
    Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start()

    async def window():
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
        ctx = await b.new_context(viewport=SIZE)
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT)
        pg = await ctx.new_page(); await pg.goto(GAME_URL); await pg.wait_for_timeout(900)
        return b, pg

    async def wait(pg, js, ms=20000):
        for _ in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False

    async def world(pg, nick, seed=4242):
        await pg.evaluate("Object.assign(WORLD,{id:'guide',name:'Aldermere',seed:%d,size:1,shape:0,mode:0,arena:false}); FORM.nick=%r; G.skin=0; startWorld(null);" % (seed, nick))
        await wait(pg, "G.state==='intro'||G.state==='play'")
        await pg.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.banner=null; G.clock=.32; G.spawnT=1e9; G.p.inv=999999; 0")
        await pg.wait_for_timeout(1500)
        await pg.evaluate("G.says.length=0; G.sayCur=null; G.banner=null; G.cine=null; 0")

    bA, A = await window()
    save(await A.screenshot(), 'title.jpg')
    await world(A, 'ALPHA')
    await A.evaluate("keys.KeyD = true; 0"); await A.wait_for_timeout(700); await A.evaluate("keys.KeyD = false; 0"); await A.wait_for_timeout(900)
    await A.evaluate("G.says.length=0; G.sayCur=null; G.banner=null; 0"); await A.wait_for_timeout(300)
    save(await A.screenshot(), 'world.jpg')
    # a fight: three embers of tempo, the glint on the blade, and a husk winding up
    await A.evaluate("""(() => { const p = G.p; inv[0] = { id: 'steel_sword', n: 1 }; G.sel = 0; G.enemies.length = 0; G.spawnT = 1e9;
      let tx = SPAWN_X - 150; streamTo(tx * T, true); for (let k = 0; k < 60; k++) { let flat = true; for (let x = tx - 3; x <= tx + 6; x++) if (heights[x] !== heights[tx]) flat = false; if (flat) break; tx--; }
      const gy = heights[tx]; for (let x = tx - 6; x <= tx + 9; x++) for (let y = gy - 6; y < gy; y++) if (TP[tileAt(x, y)].decor) setTile(x, y, AIR);
      p.x = p.px = tx * T; p.y = p.py = gy * T - p.h; p.vx = p.vy = 0; p.face = 1; p.inv = 0; p.hp = p.maxhp; snapCam();
      const e = spawnMob('husk', tx + 3, gy); e.hp = 30; e.maxhp = 48; e.dir = -1; e.state = 'windup'; e.t = 0; e.pz = 9; e.mpz = 26; e.pzT = 9999; window.FOE = e; window.FX = e.x;
      p.tempo = 3; p.tempoT = 9999; mouse.wx = e.x + 3; mouse.wy = e.y + 8; for (const k of ['rush','crisp','clean','broken','clash','caught','ablaze']) G.flags['th_' + k] = 1; G.clock = .3; })(); 0""")
    await A.wait_for_timeout(500)
    KEEP = "FOE.state = 'windup'; FOE.t = 2; FOE.stun = 0; FOE.x = FOE.px = FX; FOE.vx = 0; FOE.hp = 30; G.p.tempo = 3; G.p.tempoT = 999; G.p.hp = G.p.maxhp; G.says.length = 0; G.sayCur = null; G.banner = null; G.note = null; mouse.wx = FOE.x + 3; mouse.wy = FOE.y + 8; 0"
    await A.evaluate(KEEP); await A.evaluate("mouse.lp = true; 0"); await A.wait_for_timeout(50); await A.evaluate("mouse.lp = false; 0")
    for _ in range(60):
        await A.evaluate(KEEP)
        if await A.evaluate("G.p.glintT > 0 && G.p.glintMax - G.p.glintT < 4"): break
        await A.wait_for_timeout(12)
    fx = await A.evaluate("[(G.p.x + 14 - G.rcx) * VS.s / innerWidth, (G.p.y + 2 - G.rcy) * VS.s / innerHeight]")
    save(await A.screenshot(), 'fight.jpg', zoom=fx)
    await A.evaluate("G.enemies.length = 0; G.p.tempo = 0; G.p.atk = null; G.p.state = 'normal'; inv[0] = null; 0")
    # no two worlds alike: four moods of this world's lands, then four curios on its roads
    QUIET = "G.says.length = 0; G.sayCur = null; G.banner = null; G.note = null; G.cine = null; G.wx = null; G.enemies.length = 0; 0"
    async def stand(x, clock=.32, wait_ms=1400, name=True):
        await A.evaluate("(() => { const p = G.p, x = %d; streamTo(x * T, true); p.x = p.px = x * T + 1; p.y = p.py = (heights[x] - 3) * T; let n = 0; while (boxHits(p.x, p.y, p.w, p.h) && n++ < 80) p.y = p.py = p.y - T; p.vx = p.vy = 0; p.inv = 999999; G.clock = %s; G.spawnT = 1e9; snapCam(); })(); 0" % (x, clock))
        await A.wait_for_timeout(wait_ms); await A.evaluate(QUIET); await A.evaluate("G.biomeT = %s; 0" % ('100' if name else '0')); await A.wait_for_timeout(250)
    spots = await A.evaluate("""(() => { const at = {}; for (let d = 300; d < 16000; d += 10) for (const s of [1, -1]) { const x = X0 + s * d, b = biomeE(x), m = moodAt(x), k = b + m; if (m && !at[k] && !inWindow(x, 90) && biomeE(x - 50) === b && biomeE(x + 50) === b && moodAt(x - 50) === m && moodAt(x + 50) === m && !lakeAt(x) && !lakeAt(x - 20) && !lakeAt(x + 20)) at[k] = x; } return at; })()""")
    want = [k for k in ('moor1', 'moor2', 'reach1', 'dunes2', 'thorn1', 'fen1', 'ash1', 'scoria1', 'reach2', 'fen2', 'thorn2', 'dunes1', 'ash2') if k in spots][:4]; shots = []
    for k in want: await stand(spots[k], .34 if k != 'moor2' else .6); shots.append(await A.screenshot())
    if len(shots) == 4: four(shots, 'moods.jpg')
    cur = await A.evaluate("(() => { const at = {}; for (let k = floor((X0 - 14000) / CURIO_W); k <= floor((X0 + 14000) / CURIO_W); k++) { const c = curioOf(k); if (c && (!at[c.kind] || abs(c.x - X0) < abs(at[c.kind] - X0))) at[c.kind] = c.x; } return at; })()")
    shots = []
    for k in [k for k in ('rest', 'stones', 'ribs', 'spring', 'mile', 'hermit', 'cart') if k in cur][:4]:
        await stand(cur[k] - (5 if k != 'stones' else 7), .34, 1200, False); fx = await A.evaluate("[(%d * T + 4 - G.rcx) * VS.s / innerWidth, (G.p.y - 2 - G.rcy) * VS.s / innerHeight]" % cur[k]); shots.append(zoomed(await A.screenshot(), fx))
    if len(shots) == 4: four(shots, 'curios.jpg')
    # the look of the air: a village night, rain, an ember dusk, snow in Ashrest
    shots = []
    for clock, days, wx in ((.8, 4.2, None), (.3, 1.2, 'rain'), (.57, 7.2, None), (.3, 10.2, 'snow')):
        await stand(spots.get('moor2', spots[want[0]]) if clock != .8 else await A.evaluate('SPAWN_X + 8'), clock, 500, False)
        await A.evaluate("G.days = %s; G.wx = %s; G.clock = %s; 0" % (days, "{ k: '%s', t: 99999, a: 1 }" % wx if wx else 'null', clock)); await A.wait_for_timeout(2600 if wx else 1500)
        await A.evaluate("G.says.length = 0; G.sayCur = null; G.banner = null; G.note = null; G.cine = null; G.biomeT = 0; G.clock = %s; 0" % clock); await A.wait_for_timeout(200); shots.append(await A.screenshot())
    four(shots, 'look.jpg'); await A.evaluate("G.days = 0; G.wx = null; G.clock = .32; 0")
    await A.evaluate("(() => { const p = G.p, sx = SPOTS.camp ? SPOTS.camp.x - 6 : SPAWN_X; streamTo(sx * T, true); p.x = p.px = sx * T + 1; p.y = p.py = (heights[sx] - 3) * T; let n = 0; while (boxHits(p.x, p.y, p.w, p.h) && n++ < 80) p.y = p.py = p.y - T; p.inv = 999999; snapCam(); })(); 0"); await A.wait_for_timeout(400)
    # the pack, with a few things picked up
    await A.evaluate("for (const [id, n] of [['log', 6], ['stick', 9], ['fiber', 14], ['flint', 3], ['berries', 5], ['glow_amulet', 1]]) addItem(id, n); trinkFit(); G.trink[0] = 'quick_ring'; G.trink[1] = 'miner_charm'; UI.open = 'inv'; 0")
    await A.wait_for_timeout(600); save(await A.screenshot(), 'pack.jpg')
    # the recipe book, open at the carpenter's page
    await A.evaluate("closeUI(); for (const [id, n] of [['plank', 14], ['stick', 6], ['fittings', 2], ['resin', 3], ['glass', 1]]) addItem(id, n); UI.open = 'book'; UI.bookSt = 'carp'; UI.scroll = 0; 0")
    await A.wait_for_timeout(500); save(await A.screenshot(), 'book.jpg')
    await A.evaluate("closeUI(); UI.open = null; 0")
    # playing together: the friend types the code, then the host sees them
    await A.evaluate("UI.open = 'coop'; 0"); await wait(A, "!!COOP.gcode && sigReady()"); code = await A.evaluate("COOP.gcode")
    bB, B = await window()
    await B.evaluate("FORM.nick = 'BRAVO'; FORM.skin = 2; G.state = 'join'; COOP.long = false; 0"); await B.wait_for_timeout(400)
    box = await B.query_selector('#ew-gcin'); await box.click(); await B.keyboard.type(code); await B.wait_for_timeout(300)
    save(await B.screenshot(), 'join.jpg')
    await B.keyboard.press('Enter'); await wait(B, "G.state==='play' && COOP.joined", 30000)
    await B.evaluate("G.p.inv = 999999; G.says.length = 0; G.sayCur = null; G.banner = null; 0")
    await A.wait_for_timeout(2500); save(await A.screenshot(), 'together.jpg')
    await A.evaluate("closeUI(); UI.open = null; 0")
    # the friend's own view, once their arrival scene is over: both Wakers, names over their heads
    await B.wait_for_timeout(1500); await B.evaluate("G.cine = null; G.banner = null; G.says.length = 0; G.sayCur = null; 0"); await B.wait_for_timeout(1500)
    await B.evaluate("G.cine = null; G.banner = null; G.says.length = 0; G.sayCur = null; 0"); await B.wait_for_timeout(400)
    save(await B.screenshot(), 'friends.jpg')
    # the battle royale: on the barge over the island
    bC, C = await window()
    # a home: furniture that does something, at dusk
    await world(C, 'ALPHA')
    await C.evaluate("""(() => { const p = G.p, tx = floor((p.x + 3) / T) + 90, g = heights[tx], ty = g - 1; streamTo(tx * T, true); G.clock = .5; updateSun(); G.enemies.length = 0; G.pin = null; G.found.add('village');
      for (let y = ty - 7; y <= ty; y++) for (let x = tx - 11; x <= tx + 11; x++) { setTile(x, y, AIR); walls[y * WW + x] = x < tx ? W_POLISHED : W_MOSSB; }
      for (let x = tx - 16; x <= tx + 26; x++) { for (let y = ty - 9; y <= ty; y++) if (x < tx - 12 || x > tx + 12) setTile(x, y, AIR); for (let y = ty + 2; y <= ty + 30; y++) if (!TP[tileAt(x, y)].solid) setTile(x, y, DIRT); setTile(x, ty + 1, x < tx - 12 || x > tx + 12 ? GRASS : POLISHED); }
      for (let x = tx - 12; x <= tx + 12; x++) setTile(x, ty - 8, ROOFTILE);
      for (let x = tx - 20; x <= tx + 30; x++) treeTops.delete(x); for (const B of [PROPB, FGPB]) for (const [k, bk] of B) B.set(k, bk.filter(q => q.x < (tx - 20) * T || q.x > (tx + 30) * T));
      for (let y = ty - 7; y <= ty; y++) { setTile(tx - 12, y, MOSSBRICK); setTile(tx + 12, y, MOSSBRICK); }
      for (let y = ty - 2; y <= ty; y++) setTile(tx + 12, y, AIR); setTile(tx - 12, ty - 4, STAINED_R); setTile(tx + 12, ty - 5, STAINED_B);
      const put = [[BED, -10], [CHAIR, -7], [TABLE, -5], [CANDLES, -5], [RUG, -2], [BOOKSHELF, 0], [WRACK, 2], [STRONGBOX, 4], [BARREL, 5], [PLANTER, 7], [FLOWERPOT, 9], [BRAZIER, 10]];
      for (const [t, dx] of put) { setTile(tx + dx, ty, t); stnPlaced(tx + dx, ty, t); }
      setTile(tx - 3, ty - 7, CHANDELIER); setTile(tx + 6, ty - 7, BANNER);
      stnState(ty * WW + tx + 2, WRACK).items[0] = { id: 'steel_sword', n: 1 }; const pl = stnState(ty * WW + tx + 7, PLANTER); pl.crop = 'berries'; pl.grow = 99999;
      for (const [t, dx] of [[LAMPPOST, 14], [BALLISTA, 17], [SPIKETRAP, 20], [FENCE, 21], [FENCE, 22], [BEEHIVE, 24], [SIGNPOST, -14]]) { const x = tx + dx; setTile(x, ty, t); stnPlaced(x, ty, t); }
      p.x = p.px = (tx + 9) * T; p.y = p.py = (ty + 1) * T - p.h; p.vx = p.vy = 0; p.face = -1; G.says.length = 0; G.sayCur = null; G.banner = null; G.cine = null; snapCam(); })(); 0""")
    for _ in range(3):
        await C.wait_for_timeout(700); await C.evaluate("G.says.length = 0; G.sayCur = null; G.banner = null; G.note = null; G.cine = null; G.biomeT = 0; 0")
    await C.wait_for_timeout(200)
    save(await C.screenshot(), 'home.jpg')
    # the Ashfall Trials in duos: the count on the plinths, then rekindling a fallen teammate
    await C.evaluate("G.nick = 'ALPHA'; FORM.nick = 'ALPHA'; BR.arenaWant = 0; brSolo(2); 0"); await wait(C, "G.state === 'play' && BR.on")
    await C.wait_for_timeout(2000); save(await C.screenshot(), 'royale_kit.jpg')    # three perks to choose from, on the plinth
    await C.evaluate("if (BR.offer) trPick(0); 0"); await C.wait_for_timeout(2200); save(await C.screenshot(), 'royale.jpg')
    await wait(C, "BR.phase === 'fight' && !G.p.onBarge", 15000); await C.wait_for_timeout(2500)
    await C.evaluate("""(() => { const p = G.p, m = G.fighters.find(f => trMate(f)); p.inv = 999999; G.banner = null; m.x = m.px = p.x + 26; m.y = m.py = p.y; m.hp = 0; killFighter(m, null); G.banner = null; window.MATE = m; })(); 0""")
    await C.wait_for_timeout(1300)
    await C.evaluate("(() => { const p = G.p, m = MATE; if (m.rk) { p.x = p.px = m.rk.x - 3; p.vx = 0; } keys.KeyF = true; G.banner = null; })(); 0"); await C.wait_for_timeout(1400)
    fx = await C.evaluate("[(G.p.x + 3 - G.rcx) * VS.s / innerWidth, (G.p.y - 6 - G.rcy) * VS.s / innerHeight]")
    save(await C.screenshot(), 'royale_team.jpg', zoom=fx); await C.evaluate("keys.KeyF = false; 0")
    # a party: the host's lobby with a friend in it, open to others
    await C.evaluate("quitToTitle(); 0"); await C.wait_for_timeout(400); await B.evaluate("quitToTitle(); 0"); await B.wait_for_timeout(400)
    await C.evaluate("G.nick = 'ALPHA'; FORM.nick = 'ALPHA'; COOP.br = true; BR.sizeWant = 2; BR.arenaWant = 2; brLobbyEnter('rtc', 'friends'); 0"); await wait(C, "!!COOP.gcode && sigReady()", 10000); code = await C.evaluate("COOP.gcode")
    await B.evaluate("FORM.nick = 'BRAVO'; FORM.skin = 2; G.state = 'join'; 0"); await B.evaluate("sigJoin(%r)" % code)
    if await wait(B, "BR.on && G.state === 'brlobby'", 30000):
        await wait(C, "BR.people.size === 1", 6000); await C.evaluate("BR.open = true; 0"); await C.wait_for_timeout(1500); save(await C.screenshot(), 'royale_party.jpg')
    else: print('!! the friend did not reach the lobby: royale_party.jpg not taken')
    for b in (bA, bB, bC): await b.close()
    await pw.stop()


asyncio.run(main())
