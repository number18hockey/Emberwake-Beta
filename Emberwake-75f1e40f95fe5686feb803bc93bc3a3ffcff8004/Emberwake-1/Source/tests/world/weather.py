# What the weather does: rain, snow, a thunderstorm, the long fog and ashfall each slow you, make the ground slick,
# take your breath or hide you; a roof or the underground keeps all of it off; rain puts fire out and lightning starts one;
# and each kind brings its own rare creatures, which leave when it ends. Under a clear sky nothing changes at all.
# Saves a picture of the six creatures.
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import shot
from harness import H, sheet

SKIES = ('clear', 'rain', 'snow', 'thunder', 'fog', 'ashfall')


async def main():
    h = await H().start(seed=4242, size=1)
    try:
        await h.ev("""void (() => { const tx = SPAWN_X + 70; streamTo(tx * T, true); const p = G.p; p.x = p.px = tx * T; p.y = p.py = (heights[tx] - 3) * T; while (boxHits(p.x, p.y, p.w, p.h)) { p.y -= T; p.py = p.y; } snapCam(); G.spawnT = 1e9;
          // level, open ground to stand on
          window.flat = () => { const tx = floor(p.x / T), gy = heights[tx]; for (let x = tx - 40; x <= tx + 40; x++) { for (let y = gy - 40; y < gy; y++) if (inW(x, y)) setTile(x, y, AIR); for (let y = gy; y < gy + 3; y++) setTile(x, y, STONE); } p.x = p.px = tx * T; p.y = p.py = gy * T - p.h; p.vx = p.vy = 0; return gy; };
          // the sky of the uploaded game, set by hand: rain and snow are the year's weather, the rest are events
          window.setSky = k => { G.wx = k === 'rain' || k === 'snow' ? { k, t: 1e6, a: 1 } : null; G.wxT = 1e9; G.ev = k === 'thunder' || k === 'fog' || k === 'ashfall' ? { id: k, t: 0, fade: 1, end: false } : null; G.thunT = 1e9; };
          window.calm = wild => { G.clock = .25; G.spawnT = 1e9; if (!wild) G.thunT = 1e9; WXW.mobT = 1e9; G.hitstop = 0; if (G.ev) G.ev.t = 0; p.hp = 100; if (p.dead) reviveFighter(p, p.x, p.y); };
          window.sky = (k, ticks) => { setSky(k); for (let i = 0; i < ticks; i++) { calm(); G.enemies.length = 0; tick(); } };
          window.walk = (key, n) => { for (const k in keys) keys[k] = false; p.vx = 0; let v = 0; for (let i = 0; i < n; i++) { calm(); p.stam = 100; G.enemies.length = 0; keys[key] = true; tick(); v = Math.max(v, abs(p.vx)); } keys[key] = false; return +v.toFixed(3); };
        })()""")
        await h.ev("flat()")

        # ---- nothing at all under a clear sky, in an arena, in another world, on the title ----
        still = await h.ev("""(() => { const p = G.p, all = () => [wxSpeed(p), wxSlick(p), wxBreath(p), wxSight()].every(v => v === 1) && !wxWetAt(p.x, p.y) && wxForm() === '', out = {};
          sky('rain', 30); out.rainOpen = wxSpeed(p) < 1; p.shel = false; sky('clear', 0); out.clear = all();
          for (const k of ['rain', 'snow', 'thunder', 'fog', 'ashfall']) { setSky(k); p.shel = false; WORLD.arena = true; const a = all(); WORLD.arena = false; DIM = 1; const d = all(); DIM = 0; const st = G.state; G.state = 'title'; const t = all(); G.state = st; out[k] = [a, d, t]; }
          setSky('clear'); return out; })()""")
        print('out in rain it bites:', still['rainOpen'], ' clear sky is exactly 1:', still['clear'])
        print('each sky set, but in an arena / another world / on the title:', {k: still[k] for k in SKIES[1:]})
        assert still['rainOpen'] and still['clear'], 'a clear sky must change nothing'
        assert all(still[k] == [True, True, True] for k in SKIES[1:]), 'weather must not reach arenas, the other worlds or the title'

        # ---- each effect, on and off ----
        feel = {}
        for k in SKIES:
            await h.ev("flat(); sky('%s', 40)" % k)
            feel[k] = await h.ev("""(() => { const p = G.p, out = {}; out.speed = walk('KeyD', 50);
              let n = 0; while (abs(p.vx) > .01 && n < 200) { calm(); G.enemies.length = 0; tick(); n++; } out.stop = n;
              p.stam = 0; p.stamDelay = 0; for (let i = 0; i < 60; i++) { calm(); G.enemies.length = 0; tick(); } out.breath = +p.stam.toFixed(1); out.sight = +wxSight().toFixed(2); return out; })()""")
        for k in SKIES: print('%-8s' % k, feel[k])
        c = feel['clear']
        assert feel['rain']['speed'] < c['speed'] * .9 and feel['snow']['speed'] < c['speed'] * .9 and feel['thunder']['speed'] < c['speed'] * .9, 'rain, snow and a storm should slow you'
        assert c['speed'] * .9 < feel['ashfall']['speed'] < c['speed'], 'ashfall slows you a little'
        assert feel['fog']['speed'] == c['speed'], 'fog does not slow you'
        assert feel['rain']['stop'] > c['stop'] and feel['snow']['stop'] > c['stop'] and feel['fog']['stop'] == c['stop'], 'wet and icy ground is slippery'
        assert feel['snow']['breath'] < c['breath'] and feel['ashfall']['breath'] < c['breath'] and feel['rain']['breath'] == c['breath'], 'snow and ash take your breath'
        assert feel['fog']['sight'] <= .5 and feel['rain']['sight'] < 1 and c['sight'] == 1, 'fog and rain hide you'

        # ---- shelter ----
        roof = await h.ev("""(() => { const p = G.p, gy = flat(), tx = floor(p.x / T), out = {}; sky('rain', 20); out.open = p.shel; out.openSpeed = +wxSpeed(p).toFixed(2);
          for (let x = tx - 3; x <= tx + 3; x++) setTile(x, gy - 5, STONE); sky('rain', 20); out.under = p.shel; out.underAll = [wxSpeed(p), wxSlick(p), wxBreath(p), wxSight()].every(v => v === 1); out.wetOut = wxWetAt((tx + 10) * T, (gy - 1) * T); out.wetUnder = wxWetAt(p.x, p.y);
          for (let x = tx - 3; x <= tx + 3; x++) setTile(x, gy - 5, AIR); out.below = wxCovered(p.x, (SKYL[tx] + 12) * T); return out; })()""")
        print('shelter:', roof)
        assert roof == {'open': False, 'openSpeed': .84, 'under': True, 'underAll': True, 'wetOut': True, 'wetUnder': False, 'below': True}, 'a roof or the underground should keep the weather off you'

        # ---- rain against fire ----
        fire = await h.ev("""(() => { const p = G.p, gy = flat(), tx = floor(p.x / T), out = {}; p.x = p.px = (tx - 20) * T;
          const burn = (k, x) => { sky(k, 2); G.fires.length = 0; lightFire(x, gy * T - 2, 13, 170, null); let n = 0; while (G.fires.length && n < 400) { calm(); G.enemies.length = 0; tick(); n++; } return n; };
          out.clear = burn('clear', tx * T); out.rain = burn('rain', tx * T); for (let x = tx - 4; x <= tx + 4; x++) setTile(x, gy - 6, STONE); out.rainRoofed = burn('rain', tx * T); for (let x = tx - 4; x <= tx + 4; x++) setTile(x, gy - 6, AIR);
          const doused = k => { sky(k, 20); stOf(p).burn = 200; let n = 0; while (p.st.burn > 0 && n < 400) { calm(); tick(); n++; } return n; }; out.onYouClear = doused('clear'); out.onYouRain = doused('rain'); p.st.burn = 0; return out; })()""")
        print('ticks a fire lasts on open ground, in the rain, and in the rain under a roof; and on you:', fire)
        assert fire['rain'] < fire['clear'] * .5 and fire['rainRoofed'] == fire['clear'], 'rain should put out a fire in the open and not one under a roof'
        assert fire['onYouRain'] < fire['onYouClear'] * .5, 'rain should put you out too'

        # ---- lightning ----
        bolt = await h.ev("""(() => { const p = G.p, gy = flat(), tx = floor(p.x / T), out = {}, x = (tx + 12) * T + 4;
          const strike = (k, o) => { sky(k, 2); G.fires.length = 0; G.dhaz.length = 0; strikeAt(x, gy * T, false, Object.assign({ warn: 3 }, o)); for (let i = 0; i < 6; i++) { calm(); tick(); } return G.fires.length; };
          out.storm = strike('thunder'); out.rod = strike('thunder', { rod: 1 }); out.clear = strike('clear'); G.drops.length = 0;
          // and left to itself a thunderstorm finds something to set light to
          setSky('thunder'); G.fires.length = 0; G.thunT = 30; let lit = 0; for (let i = 0; i < 1500 && !lit; i++) { calm(1); G.thunT = Math.min(G.thunT, 60); G.enemies.length = 0; tick(); lit = G.fires.length; } out.byItself = lit > 0; G.fires.length = 0; G.dhaz.length = 0; return out; })()""")
        print('fires lit by a bolt in a thunderstorm, on a lightning rod, and by a bolt out of a clear sky:', bolt)
        assert bolt['storm'] == 1 and bolt['rod'] == 0 and bolt['clear'] == 0 and bolt['byItself'], 'a thunderstorm bolt should start a fire, a rod should take it to earth'

        # ---- the creatures: the right ones come, never a crowd ----
        mobs = await h.ev("""(() => { const out = {}; flat(); for (const [k, want] of [['rain', ['puddling']], ['snow', ['rimefang']], ['thunder', ['puddling', 'stormcaller', 'galewisp']], ['fog', ['mistwraith']], ['ashfall', ['dustmaw']], ['clear', []]]) {
            sky(k, 20); G.time = 5000; const got = new Set(); let most = 0; for (let n = 0; n < 160; n++) { if (wxForm()) wxMob(wxForm()); for (const e of G.enemies) got.add(e.type); most = Math.max(most, G.enemies.filter(e => WXMOB.has(e.type)).length); if (n % 10 === 9) G.enemies.length = 0; }
            out[k] = [[...got].sort().join(' '), want.sort().join(' '), most]; G.enemies.length = 0; }
          // and they come by themselves when their weather has set in
          setSky('rain'); let came = 0; for (let i = 0; i < 400 && !came; i++) { calm(); WXW.mobT = 1; tick(); came = G.enemies.filter(e => WXMOB.has(e.type)).length; } out.byItself = came; G.enemies.length = 0; return out; })()""")
        print('who comes out, who should, and the most at once:', {k: v for k, v in mobs.items() if k != 'byItself'}, ' by itself in rain:', mobs['byItself'])
        for k in SKIES:
            assert mobs[k][0] == mobs[k][1], 'the wrong creatures came out in ' + k
            assert mobs[k][2] <= 2, 'and no more than two at a time'
        assert mobs['byItself'] >= 1, 'a creature should arrive by itself in its weather'

        # ---- every one of them lives, moves, can hurt you and can be killed, in its own weather ----
        ims, labels, fight = [], [], {}
        for t, k in (('puddling', 'rain'), ('stormcaller', 'thunder'), ('galewisp', 'thunder'), ('mistwraith', 'fog'), ('rimefang', 'snow'), ('dustmaw', 'ashfall')):
            fight[t] = await h.ev("""(() => { const p = G.p, gy = flat(), tx = floor(p.x / T), x0 = p.x, y0 = p.y; sky('%s', 20); G.enemies.length = 0; const e = spawnMob('%s', tx + 8, gy); if (e.fly) e.y -= 40; let hit = false, mired = false, here = 0;
              for (let i = 0; i < 900; i++) { calm(); p.hp = Math.max(p.hp, 60); p.inv = 0; const b = p.hp; tick(); if (p.hp < b) hit = true; if (p.mire > 0) mired = true; if (G.enemies.includes(e) && !e.dead) here++; if (hit && i > 300 && abs(e.x - p.x) < 60 && !e.noHit) break; }
              snapCam(); render(1); window.SEEN = [e.x + e.w / 2, e.y + e.h / 2]; const alive = G.enemies.includes(e) && !e.dead; if (alive) { e.noHit = false; e.invuln = false; damageEnemy(e, 9999, 1, -1); } return { hit, mired, stayed: here > 290, dies: alive && e.dead }; })()""" % (k, t))
            x, y = await h.ev("SEEN"); ims.append(await h.crop(x, y, 60, 44)); labels.append(t + ' (' + k + ')')
            await h.ev("G.enemies.length = 0; G.drops.length = 0; G.p.mire = 0;")
        sheet(ims, 3, shot('weather_creatures.png'), labels, 2)
        print('weather creatures:', fight)
        for t in fight:
            assert fight[t]['hit'] and fight[t]['stayed'] and fight[t]['dies'], t + ' should stay in its weather, be able to hurt you, and to die'
        assert fight['puddling']['mired'] or fight['rimefang']['mired'], 'a puddling or a rimefang should leave your legs heavy'
        mire = await h.ev("""(() => { const p = G.p; sky('clear', 2); applyStatus(p, 'mire', null, { d: 30 }); const a = wxSpeed(p); for (let i = 0; i < 31; i++) { calm(); tick(); } return [a, wxSpeed(p)]; })()""")
        print('heavy legs, and after they clear:', mire)
        assert mire == [.66, 1], 'mired legs are slow for a while, under any sky'

        # ---- they stay while their weather lasts, and go when it has passed ----
        gone = await h.ev("""(() => { const p = G.p, gy = flat(), tx = floor(p.x / T), out = {}; for (const [k, type] of [['rain', 'puddling'], ['fog', 'mistwraith'], ['thunder', 'galewisp'], ['snow', 'rimefang'], ['ashfall', 'dustmaw']]) { sky(k, 20); const e = spawnMob(type, tx + 30, gy - 2);
            const here = n => { for (let i = 0; i < n; i++) { calm(); p.inv = 60; tick(); } return G.enemies.includes(e) && !e.dead; }; G.time -= G.time % 60; const stays = here(400); setSky('clear'); out[type] = [stays, here(1300)]; G.enemies.length = 0; } return out; })()""")
        print('still about in their weather, and after it:', gone)
        assert all(v == [True, False] for v in gone.values()), 'they should stay while their weather lasts, and go when it has passed'

        # ---- sight ----
        sight = await h.ev("""(() => { const p = G.p, gy = flat(), tx = floor(p.x / T), out = []; for (const k of ['clear', 'fog']) { sky(k, 20); G.enemies.length = 0; const e = spawnMob('husk', tx + 26, gy); const near0 = abs(e.x - p.x); let best = near0;
            for (let i = 0; i < 160; i++) { calm(); p.inv = 60; tick(); best = Math.min(best, abs(e.x - p.x)); } out.push(Math.round(near0 - best)); G.enemies.length = 0; } setSky('clear'); return out; })()""")
        print('how far a husk 26 paces off comes toward you, in the clear and in fog:', sight)
        assert sight[0] > sight[1] + 20, 'creatures should lose sight of you in fog'
        print('errors:', h.errs[:5] or 'none')
        assert not h.errs, 'browser reported an error'
    finally:
        await h.stop()


asyncio.run(main())
