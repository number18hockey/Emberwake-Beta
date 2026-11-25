# Weather: how often each kind comes, what it does to you and to the land, that it stays out from under a roof,
# and the rare creatures it brings. Saves a picture of every kind.
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import shot
from harness import H, sheet


async def main():
    h = await H().start(seed=4242, size=1)
    try:
        odds = await h.ev("""(() => { const n = {}, R = mulberry32(7); let id = 'clear', t = 0; for (let k = 0; k < 4000; k++) { const [a, b] = WX[id].dur, d = a + R() * (b - a); n[id] = (n[id] || 0) + d; t += d; id = wxPick(id, R); } for (const k in n) n[k] = +(n[k] / t * 100).toFixed(1); return n; })()""")
        print('share of the time, per cent:', odds)
        assert odds['clear'] + odds['cloudy'] > 60, 'clear and cloudy should be the most common'
        assert min(odds['clear'], odds['cloudy']) > max(odds[k] for k in odds if k not in ('clear', 'cloudy')), 'each of them more than anything else'
        local = await h.ev("({ reach: wxLocal('rain', 'reach').snow, dunes: wxLocal('storm', 'dunes').sand, ash: wxLocal('rain', 'ash').ash, moor: wxLocal('rain', 'moor').rain })")
        print('rain in other lands:', local)
        assert all(v > .5 for v in local.values()), 'rain should be snow in the Reach, sand in the dunes, ash on the ash'

        await h.ev("""void (() => { const tx = SPAWN_X + 70; streamTo(tx * T, true); const p = G.p; p.x = p.px = tx * T; p.y = p.py = (heights[tx] - 3) * T; while (boxHits(p.x, p.y, p.w, p.h)) { p.y -= T; p.py = p.y; } snapCam(); G.spawnT = 1e9;
          window.sky = (id, ticks) => { wxSet(id, 1); for (const k of WXK) G.wxI[k] = 0; G.wx.mobT = 1e9; G.wx.dur = 1e9; G.wx.boltT = 1e9; for (let i = 0; i < ticks; i++) { G.clock = .25; p.hp = 100; G.enemies.length = 0; G.wx.boltT = 1e9; tick(); } };
          window.walk = (key, n) => { for (const k in keys) keys[k] = false; const x0 = p.x; p.vx = 0; keys[key] = true; let v = 0; for (let i = 0; i < n; i++) { p.stam = 100; G.enemies.length = 0; tick(); v = Math.max(v, abs(p.vx)); if (p.hitWall) { pressed.Space = true; } } keys[key] = false; return +v.toFixed(2); };
        })()""")
        ims, labels, speed = [], [], {}
        for k in ('clear', 'cloudy', 'windy', 'rain', 'storm', 'fog'):
            await h.ev("sky('%s', 420)" % k)
            speed[k] = await h.ev("[walk('KeyD', 50), walk('KeyA', 50)]")
            await h.ev("sky('%s', 200)" % k); await h.step(4, "G.clock = .25;")
            ims.append(await h.shot()); labels.append(k)
        print('top speed, with the wind and against it:', speed)
        assert max(speed['rain']) < max(speed['clear']) * .93, 'rain should slow you'
        assert speed['windy'][0] > speed['windy'][1], 'the wind should help one way and hinder the other'
        sheet(ims, 2, shot('weather.png'), labels, .5)

        land = await h.ev("""(() => { const out = {}; sky('rain', 700); out.wet = +G.wx.wet.toFixed(2); out.drops = WXDROPS.length; const [tx, tr] = [...treeTops][0]; const q = crownInfo(tr.kind, tr.v); out.leafEdge = q.top.length; sky('clear', 500); out.calm = abs(crownSway(tr, 2) - crownSway(tr, 30)); sky('windy', 500); let m = 0; for (let i = 0; i < 60; i++) { G.time++; m = Math.max(m, abs(crownSway(tr, 2))); } out.bend = +m.toFixed(1); out.root = +abs(crownSway(tr, 31)).toFixed(1); return out; })()""")
        print('land:', land)
        assert land['wet'] > .4 and land['drops'] > 3, 'rain should wet the ground and run down the lens'
        assert land['bend'] > 4 and land['root'] < 1, 'wind should bend a crown and leave its root where it is'

        roof = await h.ev("""(() => { const p = G.p; sky('storm', 400); p.shel = undefined; for (let i = 0; i < 20; i++) tick(); const out = { open: p.shel }; const tx = floor((p.x + 3) / T), ty = floor(p.y / T); for (let x = tx - 3; x <= tx + 3; x++) setTile(x, ty - 4, STONE); for (let i = 0; i < 40; i++) tick(); out.under = p.shel; out.speed = wxSpeed(p, 1); for (let x = tx - 3; x <= tx + 3; x++) setTile(x, ty - 4, AIR); return out; })()""")
        print('shelter:', roof)
        assert roof == {'open': False, 'under': True, 'speed': 1}, 'a roof should keep the weather off you'

        bolt = await h.ev("""(() => { const p = G.p; sky('storm', 60); p.hp = 100; p.inv = 0; p.shel = false; WXBOLTS.length = 0; G.fires.length = 0; const tx = floor((p.x + 3) / T); WXBOLTS.push({ x: p.x + 3, y: p.y + p.h, gy: p.y + p.h, t: -2, tx, tree: null, seed: 3 }); for (let i = 0; i < 6; i++) { p.shel = false; G.hitstop = 0; tick(); } return { hp: p.hp, fire: G.fires.length }; })()""")
        print('lightning:', bolt)
        assert bolt['hp'] < 100, 'lightning should hurt whoever it strikes'

        mobs = await h.ev("""(() => { const out = {}; for (const [id, want] of [['rain', 'puddling'], ['windy', 'galewisp'], ['fog', 'mistwraith'], ['storm', 'stormcaller']]) { sky(id, 420); G.time = 5000; const got = new Set(); let most = 0; for (let k = 0; k < 120; k++) { wxMob(); for (const e of G.enemies) got.add(e.type); most = Math.max(most, G.enemies.filter(e => WXMOB.has(e.type)).length); if (k % 10 === 9) G.enemies.length = 0; } out[id] = [got.has(want), most]; G.enemies.length = 0; }
          // every one of them lives, moves and can be fought, in its own weather
          const own = { puddling: 'rain', stormcaller: 'rain bolt', galewisp: 'wind', mistwraith: 'fog', rimefang: 'snow', dustmaw: 'sand' };
          const p = G.p, tx = floor((p.x + 3) / T); for (const type of WXMOB) { G.enemies.length = 0; const x0 = tx * T, y0 = heights[tx] * T - p.h - 1, e = spawnMob(type, tx + 8, heights[tx + 8]); if (e.fly) e.y -= 40; p.hp = 100; p.inv = 0; p.x = p.px = x0; p.y = p.py = y0; p.vx = p.vy = 0; let hit = false; for (let i = 0; i < 900; i++) { for (const k of WXK) G.wxI[k] = own[type].includes(k) ? 1 : 0; G.wxWind = type === 'galewisp' ? .6 : 0; G.wx.boltT = G.wx.mobT = 1e9; p.hp = Math.max(p.hp, 60); G.hitstop = 0; if (p.dead) reviveFighter(p, p.x, p.y); const b = p.hp; tick(); if (p.hp < b) hit = true; } if (i => 0) render(1); const alive = G.enemies.includes(e); if (alive) { e.noHit = false; e.invuln = false; damageEnemy(e, 9999, 1, -1); } out[type] = [hit, !G.enemies.some(q => !q.dead && q === e)]; } G.enemies.length = 0; return out; })()""")
        print('weather creatures:', mobs)
        for k in ('rain', 'windy', 'fog', 'storm'):
            assert mobs[k][0], 'the right creature should come out in ' + k
            assert mobs[k][1] <= 2, 'and no more than two at a time'
        for t in ('puddling', 'stormcaller', 'galewisp', 'mistwraith', 'rimefang', 'dustmaw'):
            assert mobs[t][0] and mobs[t][1], t + ' should be able to hurt you, and to die'
        gone = await h.ev("""(() => { const p = G.p, tx = floor((p.x + 3) / T), out = {}; for (const [id, type] of [['rain', 'puddling'], ['fog', 'mistwraith'], ['windy', 'galewisp']]) { sky(id, 420); const e = spawnMob(type, tx + 30, heights[tx + 30] - 2); const here = n => { for (let i = 0; i < n; i++) { p.hp = 100; p.inv = 60; G.hitstop = 0; G.wx.boltT = 1e9; tick(); } return G.enemies.includes(e) && !e.dead; }; G.time -= G.time % 60; const stays = here(400); wxSet('clear', 1); G.wx.mobT = 1e9; out[type] = [stays, here(1300)]; G.enemies.length = 0; } return out; })()""")
        print('still about in their weather, and after it:', gone)
        assert all(v == [True, False] for v in gone.values()), 'they should stay while their weather lasts, and go when it has passed'
        sight = await h.ev("""(() => { const p = G.p, tx = floor((p.x + 3) / T), out = []; for (const id of ['clear', 'fog']) { sky(id, 420); G.enemies.length = 0; for (let x = tx; x <= tx + 34; x++) { for (let y = heights[tx] - 9; y < heights[tx]; y++) setTile(x, y, AIR); setTile(x, heights[tx], STONE); } const e = spawnMob('husk', tx + 26, heights[tx]); for (const k of WXK) G.wxI[k] = 0; G.wxI.fog = id === 'fog' ? 1 : 0; let near0 = abs(e.x - p.x), best = near0; for (let i = 0; i < 160; i++) { G.wxI.fog = id === 'fog' ? 1 : 0; p.hp = 100; p.inv = 60; G.hitstop = 0; G.wx.mobT = 1e9; tick(); best = Math.min(best, abs(e.x - p.x)); } out.push(Math.round(near0 - best)); G.enemies.length = 0; } return out; })()""")
        print('how far a husk 26 paces off comes toward you, in the clear and in fog:', sight)
        assert sight[0] > sight[1] + 20, 'creatures should lose sight of you in fog'
        same = await h.ev("JSON.stringify(wxSchedule(99)) === JSON.stringify(wxSchedule(99)) && JSON.stringify(wxSchedule(99)) !== JSON.stringify(wxSchedule(100))")
        assert same, 'a match has the same weather on every computer'
        print('errors:', h.errs[:5] or 'none')
        assert not h.errs, 'browser reported an error'
    finally:
        await h.stop()


asyncio.run(main())
