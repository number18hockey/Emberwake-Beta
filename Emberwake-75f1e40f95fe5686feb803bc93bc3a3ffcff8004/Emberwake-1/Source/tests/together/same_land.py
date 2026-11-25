# A friend who arrives somewhere from a different direction must find the same land.
# The same world is made twice: once walking out from the village, once dropped straight into the far
# country (as a guest is, going to their host). Every tile, wall, tree crown and prop must match.
import asyncio, sys, os, json
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
ARGS = ['--no-sandbox']
DUMP = r"""((x0, x1) => { const t = [], w = [];
  for (let y = 0; y < WH; y++) for (let x = x0; x < x1; x++) { const i = y * WW + x; t.push(tiles[i]); w.push(walls[i]); }
  const tops = [...treeTops].filter(([x]) => x >= x0 && x < x1).map(([x, q]) => x + ':' + q.y + ':' + q.kind + ':' + q.v).sort();
  const props = []; for (const [k, b] of PROPB) for (const q of b) if (q.x >= x0 * T && q.x < x1 * T) props.push(round(q.x) + ':' + round(q.y) + ':' + q.img.width + 'x' + q.img.height);
  const fg = []; for (const [k, b] of FGPB) for (const q of b) if (q.x >= x0 * T && q.x < x1 * T) fg.push(round(q.x) + ':' + round(q.y) + ':' + q.img.width + 'x' + q.img.height);
  props.sort(); fg.sort(); return JSON.stringify({ t, w, tops, props, fg, ready: [chunkReadyAt(x0), chunkReadyAt(x1 - 1)] }); })"""
async def main():
    pw = await async_playwright().start(); errs = []
    b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
    pg = await (await b.new_context(viewport={'width': 960, 'height': 540})).new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(GAME_URL); await pg.wait_for_timeout(500)
    seed = int(sys.argv[1]) if len(sys.argv) > 1 else 7171
    dirn = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    async def fresh():
        await pg.evaluate("Object.assign(WORLD,{id:'',name:'Same',seed:%d,size:1,shape:0,mode:0,arena:false}); startWorld(null); if (G.state==='intro') beginPlay(true); G.manual = true;" % seed)
        await pg.wait_for_timeout(200)
    await fresh()
    sx = await pg.evaluate("SPAWN_X"); cw = await pg.evaluate("CW")
    far = sx + dirn * 1400
    # the first time: walk out to the far place, a chunk at a time
    await pg.evaluate("(() => { const a = %d, b = %d; for (let x = a; %d > 0 ? x <= b : x >= b; x += %d * 16) streamTo(x * T, false), streamTo(x * T); streamTo(b * T, true); })()" % (sx, far, dirn, dirn))
    x0 = far - 260; x1 = far + 260
    A = json.loads(await pg.evaluate(DUMP + "(%d,%d)" % (x0, x1)))
    # the second time: dropped straight there
    await fresh()
    await pg.evaluate("streamTo(%d * T, true)" % far)
    B = json.loads(await pg.evaluate(DUMP + "(%d,%d)" % (x0, x1)))
    W = x1 - x0; diffs = []; cols = {}
    for k in range(len(A['t'])):
        if A['t'][k] != B['t'][k] or A['w'][k] != B['w'][k]:
            x = x0 + k % W; y = k // W; diffs.append((x, y, A['t'][k], B['t'][k], A['w'][k], B['w'][k])); cols[x // cw] = cols.get(x // cw, 0) + 1
    names = await pg.evaluate("JSON.stringify(Object.fromEntries([...new Set(%s)].map(t => [t, TP[t] ? TP[t].name : '?'])))" % json.dumps(sorted(set([d[2] for d in diffs] + [d[3] for d in diffs]))))
    print('seed', seed, 'direction', dirn, 'ready', A['ready'], B['ready'], 'chunk width', cw)
    print('tile or wall differences:', len(diffs), 'by chunk:', dict(sorted(cols.items())))
    print('samples (x, y, walked tile, dropped tile, walked wall, dropped wall):', diffs[:12])
    print('tile names:', names)
    print('tree crowns only walked:', sorted(set(A['tops']) - set(B['tops']))[:8], 'only dropped:', sorted(set(B['tops']) - set(A['tops']))[:8])
    print('props only walked:', len(set(A['props']) - set(B['props'])), 'only dropped:', len(set(B['props']) - set(A['props'])), sorted(set(A['props']) ^ set(B['props']))[:8])
    print('front props differing:', len(set(A['fg']) ^ set(B['fg'])))
    print('errors:', errs[:5])
    await b.close(); await pw.stop()
asyncio.run(main())
