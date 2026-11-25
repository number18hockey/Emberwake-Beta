# Two friends over a slow, bumpy line (every message held back 60 to 160 ms, never out of turn).
# They build, dig, drop sand, pour water, use a door, share a chest, fight, and one goes far away to build
# alone. After each part the two worlds are compared: tiles, walls, placed things, what is in containers,
# creatures and things lying on the ground. Last, the same patch of land is drawn on both screens from the
# same spot at the same moment and compared pixel by pixel (away from the players and the HUD).
import asyncio, sys, os, json, io
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
from PIL import Image, ImageChops
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18873
LAG = int(os.environ.get('LAG', '60')); JIT = int(os.environ.get('JIT', '100')); RELAY = os.environ.get('RELAY') == '1'
# RELAY=1: the friend's window has no direct line at all, so everything goes through the relay
SLOW_LINE = """(() => { const S = RTCDataChannel.prototype.send;
  RTCDataChannel.prototype.send = function (d) { const ch = this, q = ch.__q || (ch.__q = []), now = performance.now();
    const t = Math.max(ch.__last || 0, now + %d + Math.random() * %d); ch.__last = t; q.push([t, d]);
    if (!ch.__on) { ch.__on = 1; const pump = () => { const n = performance.now(); while (q.length && q[0][0] <= n) { const x = q.shift()[1]; try { S.call(ch, x); } catch (e) { } } if (q.length) setTimeout(pump, 4); else ch.__on = 0; }; setTimeout(pump, 4); } };
})();""" % (LAG, JIT)
KIT = r"""
window.tp = (x, dy = 0) => { streamTo(x * T, true); const y = topAt(x) - 3 + dy; G.p.x = G.p.px = x * T + 1; G.p.y = G.p.py = y * T; G.p.vx = G.p.vy = 0; G.p.inv = 999999; };
window.put = (id, tx, ty) => { const it = IT[id]; if (!it) return 'no item ' + id; addItem(id, 1); const ok = tryPlace(it, tx, ty); return ok ? 1 : 0; };
window.dig = (tx, ty) => breakAt(tx, ty, { tool: IT.iron_pick || IT.copper_pick || HAND });
window.box = (x0, x1, y0, y1) => { const t = [], w = [], o = [], s = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = y * WW + x; t.push(tiles[i]); w.push(walls[i]); }
  for (const [i, q] of tileObjs) { const x = i % WW, y = (i / WW) | 0; if (x >= x0 && x < x1 && y >= y0 && y < y1) o.push(i + ':' + q.id); }
  for (const [i, q] of STN) { const x = i % WW, y = (i / WW) | 0; if (x >= x0 && x < x1 && y >= y0 && y < y1) s.push(i + ':' + q.t + ':' + JSON.stringify((q.items || []).map(z => z ? z.id + 'x' + z.n : 0)) + ':' + (q.crop || '') + (q.open ? ':open' : '')); }
  o.sort(); s.sort(); return { t, w, o, s, ready: chunkReadyAt(x0) && chunkReadyAt(x1 - 1) }; };
window.foes = (x0, x1) => G.enemies.filter(e => !e.dead && e.x >= x0 * T && e.x < x1 * T).map(e => ({ k: e.nid || 0, type: e.type, x: Math.round(e.x), y: Math.round(e.y), hp: Math.round(e.hp), g: !!e.ghost }));
window.loose = (x0, x1) => G.drops.filter(d => d.x >= x0 * T && d.x < x1 * T).map(d => d.id + 'x' + d.n + '@' + Math.round(d.x / T)).sort();
"""
async def main():
    broker = Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []; out = []
    def say(*a): s = ' '.join(str(x) for x in a); out.append(s); print(s, flush=True)
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
        ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT + (("delete window.RTCPeerConnection; window.RTCPeerConnection = undefined;") if RELAY and name == 'GUEST' else SLOW_LINE))
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type in ('error', 'warning') and 'coop' in m.text else None)
        await pg.goto(GAME_URL); await pg.wait_for_timeout(600); await pg.evaluate(KIT); return b, pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    bA, A = await page('HOST'); bB, B = await page('GUEST')
    async def compare(label, x0, x1, y0, y1, settle=2500):
        await A.wait_for_timeout(settle)
        for pg in (A, B): await pg.evaluate("streamTo(%d * T, true)" % ((x0 + x1) // 2)) if False else None
        a = await A.evaluate("box(%d,%d,%d,%d)" % (x0, x1, y0, y1)); b = await B.evaluate("box(%d,%d,%d,%d)" % (x0, x1, y0, y1))
        W = x1 - x0; diffs = []
        for k in range(len(a['t'])):
            if a['t'][k] != b['t'][k] or a['w'][k] != b['w'][k]: diffs.append((x0 + k % W, y0 + k // W, a['t'][k], b['t'][k], a['w'][k], b['w'][k]))
        names = {}
        if diffs: names = json.loads(await A.evaluate("JSON.stringify(Object.fromEntries([...new Set(%s)].map(t => [t, TP[t] ? TP[t].name : '?'])))" % json.dumps(sorted(set([d[2] for d in diffs] + [d[3] for d in diffs])))))
        so = sorted(set(a['o']) ^ set(b['o'])); ss = sorted(set(a['s']) ^ set(b['s']))
        # creatures: the host's real ones against the friend's copies, matched one by one (a little wider than the box)
        fa = await A.evaluate("foes(%d,%d)" % (x0 - 20, x1 + 20)); fb = await B.evaluate("foes(%d,%d)" % (x0 - 20, x1 + 20))
        gb = {f['k']: f for f in fb if f['g']}; inner = [f for f in fa if f['type'] != 'dummy' and x0 * 8 + 64 < f['x'] < x1 * 8 - 64]
        missing = [f['type'] for f in inner if f['k'] not in gb]; far = [(f['type'], f['x'] - gb[f['k']]['x'], f['y'] - gb[f['k']]['y']) for f in fa if f['k'] in gb and (abs(f['x'] - gb[f['k']]['x']) > 24 or abs(f['y'] - gb[f['k']]['y']) > 24)]
        if missing: say('   creatures the friend does not see:', missing)
        if far: say('   creatures in different places (type, dx, dy):', far[:6])
        # (things dug up or dropped by creatures are each player's own; only what a player throws down is shared)
        return len(diffs) + len(so) + len(ss)
    # ---------- the host makes the world and changes it before anyone comes ----------
    await A.evaluate("Object.assign(WORLD,{id:'lag',name:'Lag',seed:5151,size:1,shape:0,mode:0,arena:false}); FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.time=700; G.p.inv=999999; G.clock = .32;")
    sx = await A.evaluate("SPAWN_X"); vw = await A.evaluate("VIL_W")
    X = sx + vw + 60  # open land east of the village
    await A.evaluate("tp(%d)" % X)
    gy = await A.evaluate("topAt(%d)" % X)
    say('site at', X, 'ground', gy)
    await A.evaluate("""(() => { const X = %d; for (let dx = 0; dx < 4; dx++) { const x = X - 12 + dx, y = topAt(x); dig(x, y); dig(x, y + 1); }
      put('torch', X - 4, topAt(X - 4) - 1); put('chest', X - 2, topAt(X - 2) - 1); })()""" % X)
    # ---------- the friend arrives ----------
    await A.evaluate("UI.open='coop';"); await wait(A, "!!COOP.gcode && sigReady()", 8000); code = await A.evaluate("COOP.gcode"); await A.evaluate("closeUI(); UI.open = null;")
    await B.evaluate("FORM.nick='BRAVO'; G.state='join';"); await B.evaluate("sigJoin(%r)" % code)
    ok = await wait(B, "G.state==='play' && WORLD.guest && COOP.joined", 30000); say('joined:', ok)
    await B.evaluate("G.p.inv = 999999; G.says.length = 0; G.sayCur = null; tp(%d)" % (X + 6))
    await compare('what the host did before the friend came', X - 40, X + 40, gy - 25, gy + 20)
    # ---------- both build and dig side by side, at the same time ----------
    await asyncio.gather(
        A.evaluate("""(() => { const X = %d; for (let k = 0; k < 6; k++) { const x = X + k, y = topAt(x) - 1; put('plank', x, y); put('plank', x, y - 1); } for (let k = 0; k < 5; k++) dig(X + 8 + k, topAt(X + 8 + k)); })()""" % X),
        B.evaluate("""(() => { const X = %d; for (let k = 0; k < 6; k++) { const x = X + 3 + k, y = topAt(x) - 1; put('cutstone', x, y); } for (let k = 0; k < 5; k++) dig(X + 10 + k, topAt(X + 10 + k)); })()""" % X))
    await compare('building and digging side by side', X - 20, X + 30, gy - 25, gy + 20)
    # ---------- sand held up by a plank, the plank taken away ----------
    await A.evaluate("""(() => { const X = %d + 20, y = topAt(X) - 6; put('plank', X, y); for (let k = 1; k <= 4; k++) { addItem('sand', 1); tryPlace(IT.sand, X, y - k); } })()""" % X)
    await A.wait_for_timeout(1200)
    await B.evaluate("(() => { const X = %d + 20; for (let y = topAt(X) - 12; y < topAt(X); y++) if (tiles[y * WW + X] === PLANK) { dig(X, y); break; } })()" % X)
    await compare('sand falling', X + 14, X + 28, gy - 25, gy + 20, 4000)
    # ---------- water poured into a pit the friend dug ----------
    await B.evaluate("(() => { const X = %d + 30; for (let dx = 0; dx < 4; dx++) for (let dy = 0; dy < 3; dy++) dig(X + dx, topAt(X + dx)); })()" % X)
    await A.wait_for_timeout(800)
    await A.evaluate("(() => { const X = %d + 31, y = topAt(X) - 1; for (let k = 0; k < 3; k++) { setTile(X + k, y, WATER); } })()" % X)
    await compare('water settling', X + 24, X + 40, gy - 25, gy + 20, 6000)
    # ---------- a door: the friend hangs it, the host opens it ----------
    await B.evaluate("(() => { const X = %d - 20; put('door', X, topAt(X) - 1); })()" % X)
    await A.wait_for_timeout(1500)
    await A.evaluate("(() => { const X = %d - 20; for (let y = topAt(X) - 4; y < topAt(X) + 1; y++) if (tiles[y * WW + X] === DOORC) { toggleDoor(X, y); break; } })()" % X)
    await compare('a door', X - 24, X - 16, gy - 25, gy + 20)
    # ---------- the chest: the host fills it, the friend empties part of it ----------
    await A.evaluate("""(() => { const X = %d - 2; const y = topAt(X) - 1; let i = -1; for (let yy = y - 3; yy <= y + 1; yy++) if (tiles[yy * WW + X] === CHEST) i = yy * WW + X; if (i < 0) return 'no chest';
      const s = stnState(i, CHEST); s.items[0] = { id: 'rock', n: 12 }; s.items[1] = { id: 'plank', n: 5 }; COOP.stns.add(i); return i; })()""" % X)
    await A.wait_for_timeout(1500)
    await B.evaluate("""(() => { const X = %d - 2; for (let yy = topAt(X) - 4; yy <= topAt(X) + 1; yy++) { const i = yy * WW + X; if (tiles[i] === CHEST) { const s = stnState(i, CHEST); s.items[0] = null; COOP.stns.add(i); addItem('rock', 12); return i; } } })()""" % X)
    await compare('a shared chest', X - 6, X + 2, gy - 25, gy + 20)
    # ---------- a fight near the friend ----------
    await A.evaluate("(() => { for (let k = 0; k < 3; k++) spawnMob('husk', %d + 44 + k * 4, topAt(%d + 44 + k * 4) - 2); })()" % (X, X))
    await B.evaluate("tp(%d + 40)" % X)
    for k in range(8):
        await B.evaluate("(() => { const e = G.enemies.filter(e => !e.dead).sort((a, b) => Math.abs(a.x - G.p.x) - Math.abs(b.x - G.p.x))[0]; if (e) { G.p.x = G.p.px = e.x - 10; G.p.face = 1; } G.p.inv = 999999; })()")
        await B.mouse.click(560, 280); await B.wait_for_timeout(350)
    await compare('a fight', X + 30, X + 70, gy - 25, gy + 20, 2500)
    # ---------- the friend goes far away and builds alone ----------
    FAR = X - 700
    await B.evaluate("tp(%d)" % FAR)
    await B.wait_for_timeout(1500)
    await B.evaluate("""(() => { const X = %d; for (let k = 0; k < 8; k++) { const x = X + k, y = topAt(x); dig(x, y); dig(x, y + 1); dig(x, y + 2); } for (let k = 0; k < 5; k++) put('cobble', X + 12 + k, topAt(X + 12 + k) - 1); put('torch', X + 10, topAt(X + 10) - 1); put('campfire', X - 4, topAt(X - 4) - 1); })()""" % FAR)
    fy = await B.evaluate("topAt(%d)" % FAR)
    await compare('far away, built alone', FAR - 30, FAR + 30, fy - 25, fy + 20, 3000)
    await A.evaluate("tp(%d + 2)" % FAR)
    await compare('far away, after the host came', FAR - 30, FAR + 30, fy - 25, fy + 20, 3000)
    # ---------- the same land drawn on both screens ----------
    VX = (FAR - 30) * 8; VY = fy * 8 - 150
    for pg in (A, B):
        await pg.evaluate("(() => { G.manual = true; G.parts.length = 0; G.trails.length = 0; G.time = 9000; G.clock = .32; updateSun(); G.shake = 0; G.flash = 0; const c = G.cam; c.x = c.px = %d; c.y = c.py = %d; G.says.length = 0; G.sayCur = null; G.banner = null; G.note = null; G.biomeT = 999; render(1); })()" % (VX, VY))
    ia = Image.open(io.BytesIO(await A.screenshot())).convert('RGB'); ib = Image.open(io.BytesIO(await B.screenshot())).convert('RGB')
    crop = (40, 150, 920, 480); ca = ia.crop(crop); cb = ib.crop(crop)
    d = ImageChops.difference(ca, cb).convert('L'); hist = d.histogram(); big = sum(hist[40:])
    say('pixels that differ (same spot, same moment, the middle of the screen):', big)
    sheet = Image.new('RGB', (ca.width, ca.height * 3)); sheet.paste(ca, (0, 0)); sheet.paste(cb, (0, ca.height)); sheet.paste(d.point(lambda v: 255 if v > 40 else 0).convert('RGB'), (0, ca.height * 2))
    sheet.save(shot('coop_relay_view.png' if RELAY else 'coop_lag_view.png'))
    say('errors:', [e for e in errs if 'agent-proxy' not in e][:10])
    await bA.close(); await bB.close(); await pw.stop()
asyncio.run(main())
