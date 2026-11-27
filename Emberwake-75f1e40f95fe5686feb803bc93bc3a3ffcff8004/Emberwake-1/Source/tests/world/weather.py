# What the weather does: rain, snow, a thunderstorm, the long fog and ashfall each slow you, make the ground slick,
# take your breath or hide you; a roof or the underground keeps all of it off; rain puts fire out (the flames that cling to rock: a strip of burning ground
# keeps its time) and lightning starts one, likes a tall tree and can bring it down; a thunderstorm has a wind (and no other sky has): it bends
# an arrow, shoves whoever is in the air, helps a run with it and hinders one against it, and blows the same way for a host and their guests;
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

        # ---- the wind of a thunderstorm ----
        wind = await h.ev("""(() => { const p = G.p, gy = flat(), tx = floor(p.x / T), x0 = tx * T, out = {};
          // no wind at all under any other sky, nor in an arena, in the Wilds, in another world or on the title
          const at = k => { setSky(k); p.shel = false; return wxWind(); };
          out.none = ['clear', 'rain', 'snow', 'fog', 'ashfall'].map(at); out.storm = at('thunder');
          WORLD.arena = true; const a = wxWind(); WORLD.royale = true; const bw = BR.wild; BR.wild = true; const w = wxWind(); BR.wild = bw; WORLD.royale = false; WORLD.arena = false; DIM = 1; const d = wxWind(); DIM = 0; const st = G.state; G.state = 'title'; const t = wxWind(); G.state = st; out.elsewhere = [a, w, d, t];
          const arrow = (k, y = gy * T - 200) => { sky(k, 20); G.projs.length = 0; G.projs.push({ type: 'arrow', x: x0, y, px: x0, py: y, vx: 0, vy: 0, r: 2, dmg: 1, kb: [0, 0], life: 300, t: 0, owner: p, g: .1 });
            let x = x0; for (let i = 0; i < 40 && G.projs.length; i++) { calm(); G.enemies.length = 0; tick(); if (G.projs[0]) x = G.projs[0].x; } G.projs.length = 0; return +(x - x0).toFixed(2); };
          // someone in the air: the shove itself in one tick of weather, and how far a leap with the wind and against it carries
          const shove = k => { flat(); sky(k, 20); p.y = p.py = gy * T - p.h - 40; p.vx = p.vy = 0; p.onGround = false; tickWeatherWays(); const v = p.vx; p.vx = 0; return +v.toFixed(4); };
          const leap1 = key => { flat(); for (const q in keys) keys[q] = false; for (let i = 0; i < 4; i++) { calm(); tick(); } const xs = p.x; keys[key] = keys.Space = pressed.Space = true; calm(); tick(); pressed.Space = false; let n = 0; while ((!p.onGround || n < 6) && n++ < 200) { calm(); G.enemies.length = 0; tick(); } keys[key] = keys.Space = false; return +abs(p.x - xs).toFixed(2); };
          const leap = k => { flat(); sky(k, 20); return [leap1('KeyA'), leap1('KeyD')]; };
          const run = k => { flat(); sky(k, 20); const l = walk('KeyA', 50); flat(); sky(k, 2); return [l, walk('KeyD', 50)]; };
          for (const k of ['clear', 'rain', 'thunder']) out[k] = { arrow: arrow(k), shove: shove(k), leap: leap(k), run: run(k) };
          // a roof keeps it off a jumper and off a pair of legs
          flat(); for (let x = tx - 6; x <= tx + 6; x++) setTile(x, gy - 14, STONE); sky('thunder', 20); out.roofLegs = [wxSpeed(p, -1), wxSpeed(p, 1)]; out.roofed = p.shel; p.y = p.py = gy * T - p.h - 40; p.vx = p.vy = 0; p.onGround = false; tickWeatherWays(); out.roofShove = p.vx; p.vx = 0; for (let x = tx - 46; x <= tx + 46; x++) setTile(x, gy - 14, AIR);
          // and it does not reach an arrow let go in a closed hollow deep in the rock
          for (let x = tx - 3; x <= tx + 3; x++) for (let y = gy + 22; y <= gy + 34; y++) setTile(x, y, abs(x - tx) < 3 && y > gy + 22 && y < gy + 34 ? AIR : STONE); out.deep = [wxCovered(x0, (gy + 24) * T), arrow('thunder', (gy + 24) * T)];
          // it blows the way the storm's own rain leans, the same all through the storm, and a guest who is sent the host's sky feels the same wind
          flat(); G.parts.length = 0; const signs = new Set(); for (let i = 0; i < 200; i++) { calm(); G.enemies.length = 0; tick(); signs.add(sign(wxWind())); } out.signs = [...signs];
          const drop = G.parts.find(q => q.col === '#8a9ad0'); out.rainLeans = drop ? sign(drop.vx) : 0;
          const host = wxWind(), m = JSON.parse(JSON.stringify(worldState())), keep = [G.ev, G.time, G.clock, G.days, G.wx, WORLD.seed];
          G.ev = null; G.time += 12345; WORLD.seed = (WORLD.seed ^ 0x5bd1) >>> 0; onWorld(m); out.hostGuest = [host, wxWind()]; [G.ev, G.time, G.clock, G.days, G.wx, WORLD.seed] = keep;
          flat(); setSky('clear'); return out; })()""")
        print('wind under a clear sky, rain, snow, fog, ashfall:', wind['none'], ' in a thunderstorm:', wind['storm'], ' in a storm but in an arena / the Wilds / another world / on the title:', wind['elsewhere'])
        for k in ('clear', 'rain', 'thunder'): print('%-8s' % k, 'an arrow let go in still air drifts; the shove on someone in the air; a leap and a run, to the left and to the right:', wind[k])
        print('under a roof in a storm, legs with and against it:', wind['roofLegs'], ' the shove on someone in the air:', wind['roofShove'])
        print('an arrow let go in a closed hollow under the ground in a storm (is it under cover, how far it drifts):', wind['deep'])
        print('the wind through 200 ticks of one storm blows:', wind['signs'], ' the storm rain leans:', wind['rainLeans'], ' host and guest feel:', wind['hostGuest'])
        assert wind['none'] == [0, 0, 0, 0, 0] and wind['elsewhere'] == [0, 0, 0, 0] and wind['storm'] != 0, 'only a thunderstorm in the Waking Lands has a wind'
        for k in ('clear', 'rain'):
            assert wind[k]['arrow'] == 0 and wind[k]['shove'] == 0 and wind[k]['leap'][0] == wind[k]['leap'][1] and wind[k]['run'][0] == wind[k]['run'][1], 'without a thunderstorm nothing is blown about: ' + k
        st = wind['thunder']
        assert abs(st['arrow']) > 2 and st['arrow'] * wind['storm'] > 0, 'a storm should bend an arrow down the wind'
        assert st['shove'] * wind['storm'] > 0 and st['leap'][0] != st['leap'][1] and (st['leap'][0] > st['leap'][1]) == (wind['storm'] < 0), 'a storm should push whoever is in the air: a leap with the wind carries farther than one against it'
        assert st['run'][0] != st['run'][1] and (st['run'][0] > st['run'][1]) == (wind['storm'] < 0), 'a run with the wind should be faster than one against it'
        assert max(st['run']) < wind['clear']['run'][0], 'and the storm still slows both'
        assert wind['roofed'] and wind['roofLegs'] == [1, 1] and wind['roofShove'] == 0, 'a roof should keep the wind off'
        assert wind['deep'] == [True, 0], 'the wind should not bend an arrow in a closed hollow deep underground'
        assert wind['signs'] == [wind['rainLeans']] and wind['rainLeans'] != 0, 'the wind should blow one way through a storm: the way its rain leans'
        assert wind['hostGuest'][0] == wind['hostGuest'][1] != 0, 'host and guest should feel the same wind'

        # ---- rain against fire ----
        fire = await h.ev("""(() => { const p = G.p, gy = flat(), tx = floor(p.x / T), out = {}; p.x = p.px = (tx - 20) * T;
          const burn = (k, x) => { sky(k, 2); firesOut(); lightFire(x, gy * T - 2, 13, 170, null); let n = 0; while (FACE_FIRES.length && n < 400) { calm(); G.enemies.length = 0; tick(); n++; } return n; };
          // (a strip of burning ground, as a flask on the floor or a guardian lays, is not shortened by rain)
          const strip = (k, x) => { sky(k, 2); G.fires.length = 0; G.fires.push({ x0: x - 18, x1: x + 18, y: gy * T, life: 150, max: 150, by: null }); let n = 0; while (G.fires.length && n < 400) { calm(); G.enemies.length = 0; tick(); n++; } return n; };
          out.stripClear = strip('clear', tx * T); out.stripRain = strip('rain', tx * T);
          out.clear = burn('clear', tx * T); out.rain = burn('rain', tx * T); for (let x = tx - 4; x <= tx + 4; x++) setTile(x, gy - 6, STONE); out.rainRoofed = burn('rain', tx * T); for (let x = tx - 4; x <= tx + 4; x++) setTile(x, gy - 6, AIR);
          const doused = k => { sky(k, 20); stOf(p).burn = 200; let n = 0; while (p.st.burn > 0 && n < 400) { calm(); tick(); n++; } return n; }; out.onYouClear = doused('clear'); out.onYouRain = doused('rain'); p.st.burn = 0; return out; })()""")
        print('ticks a fire lasts on open ground, in the rain, and in the rain under a roof; a strip of burning ground; and on you:', fire)
        assert fire['stripRain'] == fire['stripClear'] == 150, 'a strip of burning ground should last as long in the rain as out of it'
        assert fire['rain'] < fire['clear'] * .5 and fire['rainRoofed'] == fire['clear'], 'rain should put out a fire in the open and not one under a roof'
        assert fire['onYouRain'] < fire['onYouClear'] * .5, 'rain should put you out too'

        # ---- lightning ----
        bolt = await h.ev("""(() => { const p = G.p, gy = flat(), tx = floor(p.x / T), out = {}, x = (tx + 12) * T + 4;
          const strike = (k, o) => { sky(k, 2); firesOut(); G.dhaz.length = 0; strikeAt(x, gy * T, false, Object.assign({ warn: 3 }, o)); for (let i = 0; i < 6; i++) { calm(); tick(); } return FACE_FIRES.length; };
          out.storm = strike('thunder'); out.rod = strike('thunder', { rod: 1 }); out.clear = strike('clear'); G.drops.length = 0;
          // and left to itself a thunderstorm finds something to set light to
          setSky('thunder'); firesOut(); G.thunT = 30; let lit = 0; for (let i = 0; i < 1500 && !lit; i++) { calm(1); G.thunT = Math.min(G.thunT, 60); G.enemies.length = 0; tick(); lit = FACE_FIRES.length; } out.byItself = lit > 0; firesOut(); G.dhaz.length = 0; return out; })()""")
        print('fires lit by a bolt in a thunderstorm, on a lightning rod, and by a bolt out of a clear sky:', bolt)
        assert bolt['storm'] == 1 and bolt['rod'] == 0 and bolt['clear'] == 0 and bolt['byItself'], 'a thunderstorm bolt should start a fire, a rod should take it to earth'

        # ---- a bolt likes a tall tree, and a struck tree comes down more often than not ----
        tree = await h.ev("""(() => { const p = G.p, gy = flat(), tx = floor(p.x / T), out = {}, X = tx + 12;
          for (const k of [...treeTops.keys()]) if (abs(k - tx) < 60) treeTops.delete(k);
          out.noTree = [...Array(60)].every(() => wxBoltTree(tx + 3, tx) === tx + 3);
          const plant = () => { for (let y = gy - 6; y < gy; y++) setTile(X, y, TRUNK); treeTops.set(X, { y: gy - 6, kind: 0, v: 0, ph: 0 }); }, stands = () => TP[tileAt(X, gy - 1)].stalk && treeTops.has(X);
          plant(); let aimed = 0; for (let i = 0; i < 200; i++) if (wxBoltTree(tx + 3, tx) === X) aimed++; out.aimed = aimed;
          const strike = (k, o) => { plant(); sky(k, 2); firesOut(); G.dhaz.length = 0; G.felled.length = 0; strikeAt(X * T + 4, gy * T, false, Object.assign({ warn: 3 }, o)); for (let i = 0; i < 6; i++) { calm(); tick(); } return !stands(); };
          let fell = 0, lit = 0, falling = 0; for (let i = 0; i < 40; i++) { if (strike('thunder')) { fell++; if (G.felled.length) falling++; } if (FACE_FIRES.length) lit++; } out.fell = fell; out.lit = lit; out.falling = falling;
          let other = 0; for (let i = 0; i < 12; i++) { if (strike('clear')) other++; if (strike('thunder', { rod: 1 })) other++; } out.other = other;
          for (let y = gy - 6; y < gy; y++) setTile(X, y, AIR); treeTops.delete(X); G.felled.length = 0; G.drops.length = 0; firesOut(); G.dhaz.length = 0; setSky('clear'); return out; })()""")
        print('with no tree in reach a bolt keeps its ground:', tree['noTree'], ' with one, bolts out of 200 that go for it:', tree['aimed'], ' trees felled by 40 storm bolts:', tree['fell'], '(seen falling: %d, fires lit: %d)' % (tree['falling'], tree['lit']), ' by 12 bolts from a clear sky and 12 on a rod:', tree['other'])
        assert tree['noTree'] and 60 < tree['aimed'] < 140, 'a bolt should go for a tree in reach about half the time, and keep its ground when there is none'
        assert 8 < tree['fell'] < 36 and tree['lit'] == 40 and tree['falling'] == tree['fell'], 'a struck tree should come down more often than not (as a falling tree, not just gone), and the fire is lit either way'
        assert tree['other'] == 0, 'only a thunderstorm bolt that reaches the tree fells it'

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
