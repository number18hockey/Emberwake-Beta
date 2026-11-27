# A world made in the game's other branch (the one that first had accounts and hats, before the two were joined) must open
# on exactly the land it was made with: that branch grew the Mosswood and the Willowmere into every world its own way.
# Its saves name a hat and no 'land'; such a world is known by that, marked (WORLD.fork), and its land is made as that
# branch made it. The numbers in GOLD were taken from that branch's own last build (seeds fixed): each stands for every
# tile and wall of a stretch of land 600 columns wide and the whole world tall, its ground line, its lands, its tree
# crowns, and its chests with what is in them. Also here: which saves count as such a world and which do not, that the
# mark survives saving here, that zip-made old worlds and new worlds are untouched by it, and that a friend who joins
# such a world stands on the same land.
import asyncio, json, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, CHROME
from harness import H
from broker import Broker
PORT = 18897
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
# a save as that branch wrote it (no 'land'; 'hat'; 'gen' is the shape of its land, 1 or 2; 'dim': which world you stood in)
SAVE = "({ id: 'fw', name: 'Fork World', seed: %d, size: 1, shape: %d, mode: 0, skin: 0, hat: 1, e: 0, v: 6, endless: 1, gen: %d, boons: [], legacy: {}, dim: %d, dims: {}, mods: '||||', inv: [], p: null, flags: {}, journal: [], known: [], used: [], found: [], links: [] })"
OPEN = "(d => { Object.assign(WORLD, { id: d.id, name: d.name, seed: d.seed | 0, size: d.size | 0, shape: d.shape | 0, mode: 0, arena: false }); G.skin = 0; startWorld(d); return 1; })"
# one number for a stretch of land: the stretch is formed, then every tile, wall, ground height, land, tree crown and chest goes into it
HASH = r"""((off, half) => { const x0 = X0 + off - half, x1 = X0 + off + half; for (let x = x0 - 64; x <= x1 + 64; x += 64) streamTo(x * T, true);
  let h = 2166136261 >>> 0; const eat = v => { h = Math.imul(h ^ (v & 255), 16777619) >>> 0; h = Math.imul(h ^ ((v >> 8) & 255), 16777619) >>> 0; };
  for (let y = 0; y < WH; y++) for (let x = x0; x < x1; x++) { const i = y * WW + x; eat(tiles[i]); eat(walls[i]); }
  for (let x = x0; x < x1; x++) { eat(heights[x]); eat(BIDX[biomeE(x)] || 0); const tr = treeTops.get(x); if (tr) { eat(tr.y); eat(tr.kind * 4 + tr.v); } }
  for (const [i, k] of [...LOOT].filter(([i]) => i % WW >= x0 && i % WW < x1).sort((a, b) => a[0] - b[0])) { eat(i % WW - x0); eat((i / WW) | 0); for (const s of fillLoot(i, k)) if (s) { for (const ch of s.id) eat(ch.charCodeAt(0)); eat(s.n); } }
  return h.toString(16); })"""
# [seed, shape, gen, the world you stand in (0: the surface)]: the stretches looked at, as columns from home
FAR = [0, 600, -600, 3000, -3000, 9000, -9000]; NEAR = [0, 600, -600]
CASES = [[4242, 0, 2, 0, FAR], [12345, 0, 2, 0, FAR], [777, 0, 2, 0, FAR], [31337, 0, 2, 0, FAR], [2024, 0, 2, 0, FAR], [7171, 0, 2, 0, FAR], [4242, 2, 2, 0, FAR], [12345, 1, 2, 0, FAR], [808, 0, 1, 0, FAR],
         [4242, 0, 2, 1, NEAR], [4242, 0, 2, 2, NEAR], [12345, 2, 2, 3, NEAR]]
GOLD = {'4242/0/2/0': ["c5258b00", "3dc68376", "1117107e", "d94bf623", "77a1131b", "989f04f", "9467062b"],
        '12345/0/2/0': ["274736fb", "5c16bf92", "ee21aa29", "2d786e61", "805593c6", "dd76abd2", "e6e0632"],
        '777/0/2/0': ["e9b59830", "ee0ccf37", "d93e30b8", "21ffa26c", "811726e0", "4e275ae1", "aceb0668"],
        '31337/0/2/0': ["f88e95e0", "dd00021", "cf589a18", "f9530aea", "7f4e9c25", "954b673d", "51323985"],
        '2024/0/2/0': ["4e171bc4", "dd1fe2d5", "abd8b434", "e3d11b45", "2e18aa8e", "3b9b3fdd", "feb8d319"],
        '7171/0/2/0': ["9d94a429", "c9cc99a0", "35b6bb44", "443f6d73", "806d832", "b7e8ec4f", "9e6e2e69"],
        '4242/2/2/0': ["b278a49e", "aee17c0f", "cadb0d5b", "be3400bb", "d6c927c0", "277a4b55", "718c96ee"],
        '12345/1/2/0': ["6763e2e8", "d9ff8cfc", "df7a963a", "7938cbf2", "17dacac2", "f5611fdd", "e6e0632"],
        '808/0/1/0': ["af8ee215", "731ca562", "53d0e2e2", "da6485b5", "b050415", "ce6dc0bc", "8269d734"],
        '4242/0/2/1': ["f374f6c6", "acb026b7", "d0400d97"],
        '4242/0/2/2': ["9ae2954a", "2f5c5b7f", "316aed9"],
        '12345/2/2/3': ["bc0e453d", "61aed8dc", "99895864"]}
FACTS = "JSON.stringify({ fork: WORLD.fork || 0, land: WORLD.land, gates: WORLD.gates, moss: (() => { let n = 0; for (let x = X0 - 3000; x <= X0 + 3000; x += 4) { const b = biomeE(x); if (b === 'mosswood' || b === 'willowmere') n++; } return n; })() })"


async def opened(pg, js, manual=True):
    """start a world from a save (or a new one) and wait until it stands (manual: the game does not run on by itself)"""
    await pg.evaluate(js)
    for _ in range(300):
        if await pg.evaluate("G.state") in ('intro', 'play'): break
        await pg.wait_for_timeout(100)
    await pg.evaluate("G.manual = %s; if (G.state === 'intro') beginPlay(true); G.says.length = 0; G.sayCur = null; G.cine = null; 1" % ('true' if manual else 'false'))


async def hashes(pg, seed, shape, gen, dim, offs):
    await opened(pg, OPEN + '(' + SAVE % (seed, shape, gen, dim) + ')')
    return [await pg.evaluate(HASH + "(%d, 300)" % off) for off in offs]


async def main():
    ok = []; errs = []
    def check(name, v, extra=''):
        ok.append((name, bool(v))); print(('  ok   ' if v else '  FAIL ') + name, extra)
    h = await H().start(mode='none'); pg = h.pg

    # ---- 1. which saves are such a world
    async def what(d):
        await opened(pg, OPEN + '((d => { ' + d + '; return d; })(' + SAVE % (4242, 0, 2, 0) + '))'); return json.loads(await pg.evaluate(FACTS))
    a = await what(""); check('a save with a hat and no land is a world of the other branch, land 2, with both new lands and no gates', a['fork'] == 1 and a['land'] == 2 and a['moss'] > 50 and a['gates'] is None, str(a))
    a = await what("d.gen = 1"); check('with gen 1 it is one on the oldest shape of land', a['fork'] == 1 and a['land'] == 1 and a['moss'] > 20, str(a))
    b = await what("delete d.hat"); check('an old save of this branch (boons, no hat, no land) is land 2 as ever: no new lands, and its gates', b['fork'] == 0 and b['land'] == 2 and b['moss'] == 0 and b['gates'], str(b))
    b = await what("delete d.hat; delete d.boons"); check('and one from before the boons is land 1', b['fork'] == 0 and b['land'] == 1 and b['moss'] == 0, str(b))
    b = await what("d.land = 4"); check('a save that names its land is that land, hat or no hat', b['fork'] == 0 and b['land'] == 4 and b['moss'] == 0, str(b))
    b = await what("d.land = 2; d.fork = 1; delete d.hat"); check('a save that says it is of the other branch is', b['fork'] == 1 and b['land'] == 2 and b['moss'] > 50, str(b))
    await opened(pg, "Object.assign(WORLD, { id: 'nw', name: 'New', seed: 4242, size: 1, shape: 0, mode: 0, arena: false }); startWorld(null); 1")
    n = json.loads(await pg.evaluate(FACTS)); meta = await pg.evaluate("worldMeta()")
    check('a new world is land 5, not of the other branch, and its save says nothing of a fork or a hat', n['fork'] == 0 and n['land'] == 5 and 'fork' not in meta and 'hat' not in meta and meta['land'] == 5, str(n))

    # ---- 2. the land, against the other branch's own build
    bad = 0
    for seed, shape, gen, dim, offs in CASES:
        got = await hashes(pg, seed, shape, gen, dim, offs); key = '%d/%d/%d/%d' % (seed, shape, gen, dim); want = GOLD.get(key, [])
        same = got == want; bad += not same
        print('  %s seed %-6d shape %d gen %d %s: %d stretches of 600 columns %s' % ('ok  ' if same else 'FAIL', seed, shape, gen, 'on the surface' if not dim else 'in world %d' % dim, len(offs), '' if same else 'got ' + json.dumps(got)))
    check('every stretch of every world is the land the other branch made (%d worlds)' % len(CASES), bad == 0)
    # (and it is not the land this branch would have made of that save before it knew better)
    await opened(pg, OPEN + '((d => { delete d.hat; return d; })(' + SAVE % (4242, 0, 2, 0) + '))'); z = await pg.evaluate(HASH + "(600, 300)")
    check('the same seed as a land 2 world of this branch is other land', z != GOLD.get('4242/0/2/0', [0, z])[1], z)

    # ---- 3. saved here, it stays one; and nothing leads to gates it does not have
    await opened(pg, OPEN + '(' + SAVE % (12345, 0, 2, 0) + ')')
    await pg.evaluate("G.hat = 2; G.leads.clear(); learn('g_frost', true); 1"); lead = await pg.evaluate("G.leads.has('g_frost')")
    snap = await pg.evaluate("JSON.stringify(snapshotWorld())"); s = json.loads(snap)
    check('its save says so, keeps land 2, and still names the hat (the other branch puts on the hat a world names)', s.get('fork') == 1 and s.get('land') == 2 and s.get('hat') == 2 and s.get('gen') == 2, str({k: s.get(k) for k in ('fork', 'land', 'hat', 'gen')}))
    check('no lead points at a gate there', not lead)
    await opened(pg, OPEN + '(' + snap + ')'); f = json.loads(await pg.evaluate(FACTS)); again = [await pg.evaluate(HASH + "(%d, 300)" % off) for off in NEAR]
    check('opened again from that save it is the same world on the same land', f['fork'] == 1 and f['land'] == 2 and again == GOLD.get('12345/0/2/0', [])[:3], str(f))
    await opened(pg, OPEN + '((d => { delete d.hat; return d; })(' + SAVE % (12345, 0, 2, 0) + '))'); await pg.evaluate("G.leads.clear(); learn('g_frost', true); 1")
    check('(a world with gates still gets that lead)', await pg.evaluate("G.leads.has('g_frost')"))

    # ---- 3b. jobs left working at a kiln: a job is saved under its recipe's number, and that branch counts its recipes
    #          differently from 227 on (its roof tile is 268, flower pot 269, stained glasses 270 and 271; the jug, 93, is the same)
    await opened(pg, OPEN + '(' + SAVE % (12345, 0, 2, 0) + ')')
    k = json.loads(await pg.evaluate(r"""(() => { const x = floor(G.p.x / T) + 6, y = heights[x] - 1, i = y * WW + x, j = i + 3, brick = RECIPES.findIndex(r => r.st === 'kiln' && r.out === 'brick');
      setTile(x, y, FURNACE); setTile(x + 3, y, FURNACE);
      applyStn([{ i, t: FURNACE, slots: [[93, 5, 'jug'], [268, 7, 'rooftile'], [269, 9, 'flowerpot'], [270, 11, 'stained_r']] }, { i: j, t: FURNACE, slots: [[271, 13, 'stained_b'], 0, [268, 5, 'no_such_thing'], [brick, 21, 'brick']] }]);
      const see = i => stnState(i, FURNACE).slots.map(s => s ? [RECIPES[s.r].st, RECIPES[s.r].out, s.t] : 0), a = see(i), b = see(j), right = stnState(j, FURNACE).slots[3].r === brick && stnState(i, FURNACE).slots[0].r === 93;
      const kept = encodeStn().filter(o => o.i === i || o.i === j); STN.delete(i); STN.delete(j); applyStn(kept);
      return JSON.stringify({ a, b, right, again: [see(i), see(j)] }); })()"""))
    check('four kiln jobs saved under that branch\'s numbers are still working on the same things, as far along', k['a'] == [['kiln', 'jug', 5], ['kiln', 'rooftile', 7], ['kiln', 'flowerpot', 9], ['kiln', 'stained_r', 11]], json.dumps(k['a']))
    check('so is the fifth; an empty slot stays empty, a thing nobody makes is dropped, and a job whose number is right keeps its number', k['b'] == [['kiln', 'stained_b', 13], 0, 0, ['kiln', 'brick', 21]] and k['right'], json.dumps(k['b']))
    check('saved here and opened again they are the same jobs', k['again'] == [k['a'], k['b']], json.dumps(k['again']))
    errs += h.errs; await h.stop()

    # ---- 4. a friend joins such a world: the same land
    Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start()
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME); ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT); p = await ctx.new_page()
        p.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e))); await p.goto(GAME_URL); await p.wait_for_timeout(700); return b, p
    async def wait(p, js, ms=15000):
        for _ in range(ms // 100):
            if await p.evaluate(js): return True
            await p.wait_for_timeout(100)
        return False
    bA, A = await page('HOST'); bB, B = await page('GUEST')
    await A.evaluate("FORM.nick = 'ALPHA'; 1"); await opened(A, OPEN + '(' + SAVE % (4242, 0, 2, 0) + ')', False); await A.evaluate("G.p.inv = 999999; UI.open = 'coop'; 1")
    check('the host of such a world has a game code', await wait(A, "!!COOP.gcode && sigReady()", 10000)); code = await A.evaluate("COOP.gcode")
    await B.evaluate("FORM.nick = 'BRAVO'; G.state = 'join';"); await B.evaluate("sigJoin(%r)" % code)
    check('the friend joins', await wait(B, "G.state === 'play' && WORLD.guest && COOP.joined", 30000))
    g = json.loads(await B.evaluate(FACTS)); gh = [await B.evaluate(HASH + "(%d, 300)" % off) for off in (600, -3000)]; want = GOLD.get('4242/0/2/0', [0] * 7)
    check('the friend knows what kind of world it is', g['fork'] == 1 and g['land'] == 2 and g['gates'] is None, str(g))
    hh = [await A.evaluate(HASH + "(%d, 300)" % off) for off in (600, -3000)]   # (the host looks only after the friend has made that land alone)
    check('and stands on the same land as the host, near home and far out where the host had not been', gh == hh == [want[1], want[4]], 'friend ' + json.dumps(gh) + ' host ' + json.dumps(hh))
    await bA.close(); await bB.close(); await pw.stop()

    for e in errs[:5]: print('  ', e[:300])
    bad = [n for n, v in ok if not v]
    print('errors:', errs[:3]); print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
    return not bad and not errs

if __name__ == '__main__':
    sys.exit(0 if asyncio.run(main()) else 1)
