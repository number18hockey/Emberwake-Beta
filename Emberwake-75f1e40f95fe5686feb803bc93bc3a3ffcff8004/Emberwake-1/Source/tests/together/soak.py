# Two friends play for a while and the two worlds are compared.
# Both dig, build, place furniture and storage, light fires, fell a tree, blow something up, pour water,
# fight creatures and wait out a stretch of time; then every tile, wall and placed object around them is
# compared between the host and the guest, and both views are screenshotted standing in the same spot.
import asyncio, sys, os, json
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
from PIL import Image, ImageChops
import io
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18871
PLACE = "window.placeAt2 = (tx, ty, id) => { const it = IT[id]; if (!it) return false; addItem(id, 1); return tryPlace(it, tx, ty); };"
COMPARE = r"""((x0, x1, y0, y1) => { const t = [], w = [], o = [], s = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = y * WW + x; t.push(tiles[i]); w.push(walls[i]); }
  for (const [i, q] of tileObjs) { const x = i % WW, y = (i / WW) | 0; if (x >= x0 && x < x1 && y >= y0 && y < y1) o.push(i + ':' + q.id); }
  for (const [i, q] of STN) { const x = i % WW, y = (i / WW) | 0; if (x >= x0 && x < x1 && y >= y0 && y < y1) s.push(i + ':' + q.t + ':' + JSON.stringify(q.items || []) + ':' + (q.crop || '') + ':' + (q.honey | 0)); }
  o.sort(); s.sort(); return JSON.stringify({ t, w, o, s, ready: [chunkReadyAt(x0), chunkReadyAt(x1)] }); })"""
async def main():
    broker = Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []; res = {}
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
        ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type in ('error',) else None)
        await pg.goto(GAME_URL); await pg.wait_for_timeout(600); return b, pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    bA, A = await page('HOST'); bB, B = await page('GUEST')
    await A.evaluate("Object.assign(WORLD,{id:'soak',name:'Soak',seed:7171,size:1,shape:0,mode:0,arena:false}); FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.time=700; G.p.inv=999999; UI.open='coop';")
    await wait(A, "!!COOP.gcode && sigReady()", 8000); code = await A.evaluate("COOP.gcode"); await A.evaluate("closeUI(); UI.open = null;")
    await B.evaluate("FORM.nick='BRAVO'; G.state='join';"); await B.evaluate("sigJoin(%r)" % code)
    res['joined'] = await wait(B, "G.state==='play' && WORLD.guest && COOP.joined", 25000)
    await B.evaluate("G.p.inv = 999999; G.says.length = 0; G.sayCur = null;"); await A.wait_for_timeout(800)
    for pg in (A, B): await pg.evaluate(PLACE)
    hx = await A.evaluate("floor((G.p.x + 3) / T)"); x0 = hx + 20
    # walk both out of the village to open land
    for pg in (A, B):
        await pg.evaluate("(() => { const x = %d; G.p.x = G.p.px = x * T + 1; G.p.y = G.p.py = (heights[x] - 3) * T; G.p.vx = G.p.vy = 0; })()" % (x0 + (0 if pg is A else 4)))
    await A.wait_for_timeout(1500)
    # ---- the host: digs a pit, builds a little wall, places storage and furniture, stores things ----
    await A.evaluate("""(() => { const x = %d; for (let dx = 0; dx < 5; dx++) for (let dy = 0; dy < 3; dy++) breakAt(x + 8 + dx, heights[x + 8 + dx] + dy, { tool: IT.iron_pick || HAND });
      for (let dy = 1; dy <= 4; dy++) { const tx = x - 6, ty = heights[x - 6] - dy; if (tileAt(tx, ty) === AIR) placeAt2(tx, ty, 'cutstone'); }
      const g = heights[x + 2] - 1; for (const [dx, id] of [[2, 'crate'], [3, 'planter'], [5, 'barrel'], [6, 'bed']]) placeAt2(x + dx, heights[x + dx] - 1, id);
      const s = stnState(heights[x + 2] - 1 >= 0 ? (heights[x + 2] - 1) * WW + x + 2 : 0, CRATE); if (s && s.items) { s.items[0] = { id: 'rock', n: 9 }; COOP.stns.add((heights[x + 2] - 1) * WW + x + 2); }
      addItem('berries', 2); const pi = (heights[x + 3] - 1) * WW + x + 3, ps = stnState(pi, PLANTER); planterAct(pi, ps);
    })()""".replace('%d', str(x0)))
    # ---- the guest: digs, builds, places a torch and a door, a fire ----
    await B.evaluate("""(() => { const x = %d; for (let dx = 0; dx < 4; dx++) breakAt(x + 14 + dx, heights[x + 14 + dx], { tool: IT.iron_pick || HAND });
      placeAt2(x + 10, heights[x + 10] - 1, 'torch'); placeAt2(x - 2, heights[x - 2] - 1, 'campfire');
      for (let dy = 1; dy <= 3; dy++) placeAt2(x - 9, heights[x - 9] - dy, 'plank');
    })()""".replace('%d', str(x0)))
    await A.wait_for_timeout(1500)
    # ---- a tree felled by the host, a charge set off by the guest, water poured by the host ----
    tree = await A.evaluate("(() => { for (let x = %d - 40; x < %d + 40; x++) { const t = tileAt(x, heights[x] - 1); if (TP[t] && TP[t].name && /Stalk|Trunk|Tree|Log/i.test(TP[t].name)) return x; } return -1; })()" % (x0, x0))
    res['tree found'] = tree
    if tree >= 0:
        await A.evaluate("(() => { const x = %d; for (let k = 0; k < 40; k++) { const t = tileAt(x, heights[x] - 1); if (!TP[t] || !TP[t].name || !/Stalk|Trunk|Tree|Log/i.test(TP[t].name)) break; breakAt(x, heights[x] - 1, { tool: IT.iron_axe || HAND }); } })()" % tree)
    await B.evaluate("(() => { const x = %d + 24, y = heights[x] - 1; explode(x * T + 4, y * T + 4, 22, 10, G.p); })()" % x0)
    await A.evaluate("(() => { const x = %d + 9, y = heights[x + 1]; setTile(x + 1, y - 1, WATER); COOP.tiles.add((y - 1) * WW + x + 1); })()" % x0)
    # ---- creatures to fight, and time passing ----
    await A.evaluate("(() => { for (let k = 0; k < 3; k++) spawnMob('husk', %d + 30 + k * 3, heights[%d + 30 + k * 3]); })()" % (x0, x0))
    for k in range(10):
        await A.evaluate("G.p.vx = 0;"); await A.wait_for_timeout(600)
    res['clock host, guest'] = [await A.evaluate("G.clock.toFixed(3)"), await B.evaluate("G.clock.toFixed(3)")]
    res['creatures host, guest'] = [await A.evaluate("G.enemies.filter(e => !e.dead).length"), await B.evaluate("G.enemies.filter(e => !e.dead).length")]
    await A.wait_for_timeout(2500)
    # ---- compare the two worlds around them ----
    box = (x0 - 50, x0 + 50, 0, 0)
    gy = await A.evaluate("heights[%d]" % x0); box = (x0 - 50, x0 + 50, gy - 30, gy + 25)
    a = json.loads(await A.evaluate(COMPARE + "(%d,%d,%d,%d)" % box)); b = json.loads(await B.evaluate(COMPARE + "(%d,%d,%d,%d)" % box))
    W = box[1] - box[0]; diffs = []
    for k in range(len(a['t'])):
        if a['t'][k] != b['t'][k] or a['w'][k] != b['w'][k]:
            x = box[0] + k % W; y = box[2] + k // W
            diffs.append([x - x0, y - gy, a['t'][k], b['t'][k], a['w'][k], b['w'][k]])
    tn = await A.evaluate("JSON.stringify(Object.fromEntries([...new Set(%s)].map(t => [t, TP[t] ? TP[t].name : '?'])))" % json.dumps(sorted(set([d[2] for d in diffs] + [d[3] for d in diffs]))))
    res['tile or wall differences'] = len(diffs)
    res['first differences [dx, dy, host tile, guest tile, host wall, guest wall]'] = diffs[:14]
    res['their names'] = tn
    res['objects only on host'] = sorted(set(a['o']) - set(b['o']))[:10]
    res['objects only on guest'] = sorted(set(b['o']) - set(a['o']))[:10]
    res['station states that differ'] = sorted(set(a['s']) ^ set(b['s']))[:10]
    # ---- both views from the same spot ----
    for pg in (A, B):
        await pg.evaluate("(() => { const x = %d; G.p.x = G.p.px = x * T + 1; G.p.y = G.p.py = (heights[x] - 3) * T; G.p.vx = G.p.vy = 0; G.says.length = 0; G.sayCur = null; G.banner = null; G.note = null; })()" % (x0 + 4))
    await A.wait_for_timeout(1200)
    for pg in (A, B): await pg.evaluate("snapCam(); G.says.length = 0; G.sayCur = null;")
    await A.wait_for_timeout(300)
    ia = Image.open(io.BytesIO(await A.screenshot())).convert('RGB'); ib = Image.open(io.BytesIO(await B.screenshot())).convert('RGB')
    d = ImageChops.difference(ia, ib).convert('L'); big = sum(1 for v in d.getdata() if v > 60)
    res['pixels that differ a lot between the two views'] = big
    sheet = Image.new('RGB', (ia.width, ia.height * 3)); sheet.paste(ia, (0, 0)); sheet.paste(ib, (0, ia.height)); sheet.paste(d.point(lambda v: 255 if v > 60 else 0).convert('RGB'), (0, ia.height * 2))
    sheet.resize((ia.width // 2, ia.height * 3 // 2)).save(shot('coop_soak.png'))
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', [e for e in errs if 'agent-proxy' not in e][:8])
    await bA.close(); await bB.close(); await pw.stop()
asyncio.run(main())
