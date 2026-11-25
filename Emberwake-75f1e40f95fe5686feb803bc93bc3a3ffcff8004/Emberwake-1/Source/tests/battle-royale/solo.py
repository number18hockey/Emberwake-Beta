# The Ashfall alone with the echoes: the fall, gathering and crafting by echoes, the border, the fights, to the end.
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(mode='none')
    await h.ev("G.nick = 'TESTER'; G.skin = 0; SETTINGS.diff = 'normal'; brSolo(); G.manual = true;")
    info = await h.ev("[BR.chests.length, BR.pois.map(q => q.name + '@' + q.x).join(' '), BR.segs.join(','), G.fighters.length, BR.phase, G.p.glide, WW, WH]")
    print('island:', info)
    ims, labels = [], []
    await h.step(150, ""); ims.append(await h.shot()); labels.append('waiting for the horn')
    await h.step(250, "keys.KeyD = true;"); await h.ev("keys.KeyD = false;")
    ims.append(await h.shot()); labels.append('falling')
    for i in range(60):
        if await h.ev("!G.p.glide"): break
        await h.step(20, "")
    print('landed', await h.ev("[round(G.p.x / T), round(G.p.y / T), G.p.glide, G.p.onGround, G.p.hp]"))
    # walk to the nearest chest above ground and open it
    c = await h.ev("(() => { let b = null, bd = 1e9; for (const c of BR.chests) { if (c.open || c.cave || c.hid) continue; const d = abs(c.x * T - G.p.x); if (d < bd) { bd = d; b = c; } } return b ? [b.i, b.x, b.y] : null; })()")
    await h.ev("(() => { const p = G.p; p.x = p.px = %d * T - 6; p.y = p.py = (%d + 1) * T - p.h; p.vx = p.vy = 0; p.inv = 1e9; })()" % (c[1], c[2]))
    await h.step(10, "G.p.inv = 1e9;"); await h.step(1, "pressed.KeyF = true;"); await h.step(4, "G.p.inv = 1e9;")
    ims.append(await h.shot()); labels.append('a chest opened')
    print('chest open', await h.ev("BR.chests[%d].open" % c[0]), 'drops', await h.ev("G.drops.filter(d => abs(d.x - G.p.x) < 60).map(d => d.id + 'x' + d.n).join(' ')"))
    await h.step(120, "G.p.inv = 1e9;")
    print('pack', await h.ev("inv.filter(Boolean).map(s => s.id + 'x' + s.n).join(' ')"))
    # use a salve
    await h.ev("G.p.hp = 60; addItem('br_salve', 1); G.p.hurtT = 0; UI.open = null;"); await h.step(1, "pressed.KeyH = true;"); await h.step(120, "G.p.inv = 1e9;")
    print('after H', await h.ev("[round(G.p.hp), round(G.p.ward || 0), !!G.p.brUse]"))
    # now watch the echoes play the match out (you stand aside and cannot be hurt)
    stats = []
    for k in range(60):
        await h.step(1500, "G.p.inv = 1e9; G.p.hp = 100; G.p.noHit = true; G.p.x = G.p.px = 20 * T; G.p.y = G.p.py = 6 * T; G.p.vx = G.p.vy = 0;")
        st = await h.ev("[+(BR.t / 3600).toFixed(1), BR.phase, BR.lastAlive, BR.ring.n, round(BR.storm.L / T), round(BR.storm.R / T), G.wx.id, Object.entries([...BR.bots.values()].filter(f => !f.dead).reduce((o, f) => (o[f.wid] = (o[f.wid] || 0) + 1, o), {})).map(e => e.join(':')).join(' '), BR.chests.filter(c => c.open).length, G.enemies.length, G.drops.length]")
        stats.append(st)
        if st[1] == 'over' or st[2] <= 2: break
    print('minutes, phase, alive, closings, border, weather, what they fight with, chests open, beasts, drops')
    for s in stats[::3]: print(s)
    print('last', stats[-1])
    print('feed', await h.ev("G.kfeed.map(k => (k.a||'') + '>' + k.b + (k.txt ? ' ' + k.txt : '')).join(' | ')"))
    await h.ev("BR.mapOpen = true;"); await h.step(2, ""); ims.append(await h.shot()); labels.append('map [M]'); await h.ev("BR.mapOpen = false;")
    sheet(ims, 2, shot('royale_solo.png'), labels, .5)
    assert stats[-1][2] < 32 and any(s[3] for s in stats), 'echoes should fall, and the border should have answered'
    assert any('flint' in s[7] or 'stone' in s[7] or 'bone' in s[7] for s in stats), 'echoes should make their own weapons'
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:8])
    await h.stop()
asyncio.run(main())
