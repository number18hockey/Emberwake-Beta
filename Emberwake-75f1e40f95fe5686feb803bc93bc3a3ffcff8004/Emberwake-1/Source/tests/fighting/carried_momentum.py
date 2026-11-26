# Fighting: a blow or a dash never stops you dead. Held keys keep you running through a swing, a dash flows into a run,
# hands off the keys you glide to a stop, and striking behind you while you back away doesn't turn you round.
# Also: a fire flask that breaks against a wall or under a roof burns on that face with many small moving flames; on the floor
# it lays the strip of burning ground it always did; with no ground beneath it, it rains burning drops.
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H


async def main():
    h = await H().start(seed=4242, size=1)
    try:
        await h.ev("""void (() => {
          window.flat = () => { const p = G.p, tx = floor(p.x / T); for (let x = tx - 60; x <= tx + 60; x++) { for (let y = heights[tx] - 14; y < heights[tx]; y++) if (inW(x, y)) setTile(x, y, AIR); for (let y = heights[tx]; y < heights[tx] + 3; y++) if (inW(x, y)) setTile(x, y, STONE); } p.y = p.py = heights[tx] * T - p.h; };
          window.run = (ticks, o = {}) => { const p = G.p, vs = []; Object.assign(p, { state: 'normal', atk: null, buf: null, hurtT: 0, stam: 100, dodgeCd: 0, dodgeGrace: 0, carryT: 0, vx: 0, vy: 0, face: 1, st: null }); G.enemies.length = 0; G.spawnT = 1e9;
            for (let i = 0; i < ticks; i++) { for (const k in keys) keys[k] = false; if (o.hold && i < (o.holdTo || 1e9)) keys[o.hold] = true; if (o.at !== undefined && i === o.at) { if (o.dodge) pressed.ShiftLeft = true; else if (o.heavy) { mouse.rp = true; } else mouse.lp = true; } mouse.wx = p.x + (o.aim || 60); mouse.wy = p.y + 8; p.stam = 100; G.hitstop = 0; tick(); vs.push(+p.vx.toFixed(2)); } for (const k in keys) keys[k] = false; return vs; };
        })()""")
        await h.ev("inv.fill(null); inv[0] = { id: 'steel_sword', n: 1 }; G.sel = 0; flat();")
        top = await h.ev("(() => { const v = run(40, { hold: 'KeyD' }); return v[39]; })()")
        for name, o in (('light', "{ hold: 'KeyD', at: 30 }"), ('heavy', "{ hold: 'KeyD', at: 30, heavy: 1 }")):
            v = await h.ev("flat(); run(90, %s)" % o); low = min(v[30:75])
            print(name, 'blow while running: top', top, 'slowest', low, 'after', v[-1])
            assert low > top * (.5 if name == 'heavy' else .7), 'a %s blow should not stop a run' % name
            assert v[-1] > top * .95, 'and the run should be whole again afterwards'
        await h.ev("inv.fill(null); G.sel = 0;")
        v = await h.ev("flat(); run(80, { hold: 'KeyD', at: 30 })")
        print('punch while running: slowest', min(v[30:70]))
        assert min(v[30:70]) > top * .7, 'a punch should not plant you'
        v = await h.ev("flat(); run(70, { hold: 'KeyD', at: 20, dodge: 1 })")
        print('dash, still holding: peak', max(v), 'ten ticks on', v[42], 'end', v[-1])
        assert max(v) > 3 and v[42] > top * .95 and v[-1] > top * .95, 'a dash should flow into a run'
        v = await h.ev("flat(); run(70, { hold: 'KeyD', holdTo: 20, at: 20, dodge: 1 })")
        stop = next(i for i in range(32, 70) if abs(v[i]) < .1)
        print('dash, hands off: gliding for', stop - 31, 'ticks')
        assert 8 <= stop - 31 <= 30, 'a dash with no key held should glide to a stop, not freeze'
        await h.ev("inv[0] = { id: 'steel_sword', n: 1 };")
        v = await h.ev("flat(); run(60, { hold: 'KeyA', at: 30, aim: 60 })")
        print('striking behind while backing off: ', v[29], '->', max(v[30:50]))
        assert max(v[30:50]) < -.5, 'a blow behind you should not turn you round'

        # fire where it breaks
        fire = await h.ev("""(() => { const p = G.p, tx = floor(p.x / T), gy = heights[tx], out = {}; flat(); for (let y = gy - 14; y < gy; y++) for (let x = tx + 12; x < tx + 16; x++) setTile(x, y, STONE); for (let x = tx - 12; x < tx + 12; x++) setTile(x, gy - 14, STONE);
          // (FACE_FIRES are the flames that cling to a face; G.fires are the strips of burning ground)
          const burst = (x, y) => { G.fires.length = 0; firesOut(); armBurst({ type: 'flask', owner: p, x, y, vx: 0, vy: 0 }); return FACE_FIRES[0]; };
          const wall = burst((tx + 12) * T - 2, (gy - 8) * T); out.wall = wall ? { onWall: wall.pts.filter(q => q.nx < 0).length, onFloor: wall.pts.filter(q => q.ny < 0).length, lowest: Math.round(gy * T - Math.max(...wall.pts.map(q => q.y))), n: wall.pts.length } : null;
          const roof = burst(tx * T, (gy - 13) * T + 2); out.roof = roof ? roof.pts.filter(q => q.ny > 0).length : 0;
          burst(tx * T, gy * T - 2); out.floor = { clinging: FACE_FIRES.length, drops: FIRE_DROPS.length, strips: G.fires.map(f => [f.x0 - tx * T, f.x1 - tx * T, f.y - gy * T, f.life]) };
          burst(tx * T, (gy - 6) * T); out.above = { clinging: FACE_FIRES.length, drops: FIRE_DROPS.length, strips: G.fires.map(f => [f.x0 - tx * T, f.x1 - tx * T, f.y - gy * T, f.life]) };
          burst(tx * T, (gy - 10) * T); out.midair = { strips: G.fires.length, drops: FIRE_DROPS.length }; for (let i = 0; i < 120; i++) tickFires(); out.landed = FACE_FIRES.length;
          buildFlames(); const c = FLAME[1][3], px = k => { const d = FLAME[1][k].getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = ''; for (let i = 3; i < d.length; i += 4) s += d[i] ? 1 : 0; return s; }; out.shapes = new Set([...Array(FLAME_N).keys()].map(px)).size; out.frames = FLAME_N; G.fires.length = 0; firesOut(); return out; })()""")
        print('fire:', fire)
        assert fire['wall'] and fire['wall']['onWall'] >= 4 and fire['wall']['onFloor'] == 0 and fire['wall']['lowest'] > 24, 'a flask on a wall should burn on the wall, not the ground below'
        assert fire['roof'] >= 2, 'and on a roof'
        strip = {'clinging': 0, 'drops': 0, 'strips': [[-18, 18, 0, 260]]}
        assert fire['floor'] == strip and fire['above'] == strip, 'on the floor, or in the air with ground close below, it lays the old strip of burning ground and nothing else'
        assert fire['midair'] == {'strips': 0, 'drops': 6} and fire['landed'] > 0, 'one that bursts with no ground beneath it rains burning drops'
        assert fire['shapes'] == fire['frames'], 'every frame of a flame should differ from the last'
        print('errors:', h.errs[:5] or 'none')
        assert not h.errs, 'browser reported an error'
    finally:
        await h.stop()


asyncio.run(main())
