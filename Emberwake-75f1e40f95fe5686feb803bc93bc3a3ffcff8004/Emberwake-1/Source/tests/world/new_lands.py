# Two new lands, the Mosswood and the Willowmere: in every world made from now on, and in no world made before.
# A stretch of each lies a walk from home (the Mosswood on one side, the Willowmere on the other), and more far out;
#  they have their own ground, plants, tree crowns, places and creatures;
# the village still stands on the moor; a saved world keeps the land it was made with; and you can walk through them.
import asyncio, json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H, sheet
from where import shot

SEEDS = [4242, 777, 12345, 31337, 2024]
# where the two lands are: how much of the country they hold, and the nearest real stretch of each (100 columns or more): [where it starts, how wide]
WHERE = """(() => { const out = { land: WORLD.land, home: biomeE(X0), share: {}, run: {} }; let cur = '', n = 0, x0 = 0; const N = 12000, d = q => min(abs(q[0] - X0), abs(q[0] + q[1] - X0));
  for (let x = X0 - N; x <= X0 + N; x++) { const b = x < X0 + N ? biomeE(x) : ''; out.share[b] = (out.share[b] || 0) + 1;
    if (b !== cur) { if ((cur === 'mosswood' || cur === 'willowmere') && n >= 100 && (!out.run[cur] || d([x0, n]) < d(out.run[cur]))) out.run[cur] = [x0, n]; cur = b; n = 0; x0 = x; } n++; }
  out.far = {}; for (const b in out.run) out.far[b] = d(out.run[b]); return out; })()"""
# what stands in one stretch of a land (it is formed first)
LOOK = """((x0, n) => { for (let x = x0; x < x0 + n + 48; x += 48) streamTo(x * T, true);
  const o = { grass: 0, mud: 0, reeds: 0, trees: 0, crowns: {}, fol: {} };
  for (let x = x0; x < x0 + n; x++) { const h = heights[x], t = tiles[h * WW + x]; if (t === GRASS) o.grass++; if (t === MUD || t === PEAT) o.mud++; if (tiles[(h - 1) * WW + x] === REED) o.reeds++;
    const tr = treeTops.get(x); if (tr) { o.trees++; o.crowns[tr.kind] = (o.crowns[tr.kind] || 0) + 1; } }
  const sets = { mosswood: new Set(FOL.mosswood), willowmere: new Set(FOL.willowmere), moor: new Set(FOL.moor) };
  for (const q of FGP) if (q.x >= x0 * T && q.x < (x0 + n) * T) for (const k in sets) if (sets[k].has(q.img)) o.fol[k] = (o.fol[k] || 0) + 1;
  return o; })"""
# every crowned tree formed so far, by the land it stands in
CROWNS = "(() => { const o = {}; for (const [x, tr] of treeTops) if (tr.kind >= 4) { const b = biomeE(x); o[b] = (o[b] || 0) + 1; } return o; })()"
PLACES = """(() => { const o = { mosswood: {}, willowmere: {} }, big = { mosswood: {}, willowmere: {} }, cur = { mosswood: {}, willowmere: {} };
  for (let k = floor((X0 - 30000) / 150); k <= floor((X0 + 30000) / 150); k++) { const s = structOf(k); if (s && o[biomeE(s.x)]) o[biomeE(s.x)][s.kind] = (o[biomeE(s.x)][s.kind] || 0) + 1; }
  for (let k = floor((X0 - 30000) / bigW()); k <= floor((X0 + 30000) / bigW()); k++) { const s = bigOf(k); if (s && big[biomeE(s.x)]) big[biomeE(s.x)][s.kind] = (big[biomeE(s.x)][s.kind] || 0) + 1; }
  for (let k = floor((X0 - 30000) / CURIO_W); k <= floor((X0 + 30000) / CURIO_W); k++) { const s = curioOf(k); if (s && cur[biomeE(s.x)]) cur[biomeE(s.x)][s.kind] = (cur[biomeE(s.x)][s.kind] || 0) + 1; }
  return { small: o, big, curios: cur }; })()"""
BOT = r"""
window.botStep = (key) => {
  const p = G.p; keys.KeyA = keys.KeyD = false; keys.KeyW = !p.onGround && p.vy < 0 && (p.bot && p.bot.jumping); keys[key] = true; if (p.onGround && p.bot) p.bot.jumping = false;
  if (!p.bot) p.bot = { lx: p.x, still: 0 };
  const moved = Math.abs(p.x - p.bot.lx); p.bot.lx = p.x;
  if (moved < .2) p.bot.still++; else p.bot.still = 0;
  const onC = climbAt(p), wet = liqAt(p.x + 3, p.y + 10);
  if (wet) keys.KeyW = true;
  const cx = Math.floor((p.x + 3) / T), dir = key === 'KeyD' ? 1 : -1, hh0 = heights[cx];
  // (a closed door is a wall now: open it, as a Waker would)
  { const fx = Math.floor((p.x + 3 + dir * 6) / T); for (let y = Math.floor(p.y / T); y <= Math.floor((p.y + p.h - 1) / T); y++) if (tileAt(fx, y) === DOORC) { toggleDoor(fx, y); break; } }
  if (p.onGround && heights[cx + dir] > hh0 + 5 && [2, 3, 4].some(k => heights[cx + dir * k] <= hh0 + 3)) { pressed.KeyW = true; keys.KeyW = true; p.bot.jumping = true; }
  if (p.bot.still > 4) { if (onC) { keys.KeyW = true; keys[key] = p.bot.still % 40 > 30; } else if (p.onGround) { pressed.KeyW = true; keys.KeyW = true; p.bot.jumping = true; } }
};
"""


async def world(h, seed):
    """forge a new world of this seed, as the game does today"""
    await h.ev("Object.assign(WORLD, { id: 'test', name: 'Test', seed: %d, size: 1, shape: 0, mode: 0, arena: false }); G.skin = 0; startWorld(null); 1" % seed)
    for _ in range(120):
        if await h.ev("G.state") in ('intro', 'play'): break
        await h.pg.wait_for_timeout(100)
    await h.ev("G.manual = true; if (G.state === 'intro') beginPlay(true); G.says.length = 0; G.sayCur = null; G.time = 700; G.spawnT = 1e9; G.cine = null; G.banner = null; 1")


async def run():
    ok = []
    h = await H().start(mode='none')
    await h.ev(BOT)

    # ---- 1. a world made today has both lands, a long walk from home at most
    W = {}
    for seed in SEEDS:
        await world(h, seed); w = W[seed] = await h.ev(WHERE); sx = await h.ev("X0")
        print('  seed %-6d land %d  home on the %s  the Mosswood %s paces away, %s wide (%.1f%% of the country)  the Willowmere %s paces away, %s wide (%.1f%%)' % (seed, w['land'], w['home'], w['far'].get('mosswood'), (w['run'].get('mosswood') or [0, 0])[1], w['share'].get('mosswood', 0) / 240,
              w['far'].get('willowmere'), (w['run'].get('willowmere') or [0, 0])[1], w['share'].get('willowmere', 0) / 240))
        w['look'] = {b: await h.ev(LOOK + "(%d, %d)" % tuple(w['run'][b])) for b in w['run']}
    ok.append(('a world made today is land 6 (the newest: it has both lands too)', all(W[s]['land'] == 6 for s in SEEDS)))
    ok.append(('a real stretch of the Mosswood lies within 3000 paces of home on every seed', all(W[s]['far'].get('mosswood', 1e9) < 3000 for s in SEEDS)))
    ok.append(('and of the Willowmere within 4000', all(W[s]['far'].get('willowmere', 1e9) < 4000 for s in SEEDS)))
    ok.append(('the village still stands on the moor', all(W[s]['home'] == 'moor' for s in SEEDS)))
    ok.append(('every older land is still there', all(all(W[s]['share'].get(b, 0) > 0 for b in ('moor', 'thorn', 'reach', 'fen')) for s in SEEDS)))

    # ---- 2. what grows and stands there (the nearest stretch of each, on every seed; then a closer look at seed 4242)
    C = await h.ev("CROWN"); tot = {b: dict(n=0, grass=0, mud=0, reeds=0, trees=0, own=0, fol=0, moor=0) for b in ('mosswood', 'willowmere')}
    for seed in SEEDS:
        for b in ('mosswood', 'willowmere'):
            q = W[seed]['look'][b]; t = tot[b]; t['n'] += W[seed]['run'][b][1]; own = q['crowns'].get(str(C['oak' if b == 'mosswood' else 'willow']), 0)
            for k in ('grass', 'mud', 'reeds', 'trees'): t[k] += q[k]
            t['own'] += own; t['fol'] += q['fol'].get(b, 0); t['moor'] += q['fol'].get('moor', 0)
            print('  seed %-6d %-10s %3d columns: grass on %d, mud or peat on %d, reeds on %d, stalks %d (%d %s), tufts in front %s' % (seed, b, W[seed]['run'][b][1], q['grass'], q['mud'], q['reeds'], q['trees'], own, 'oaks' if b == 'mosswood' else 'willows', q['fol']))
    M, L = tot['mosswood'], tot['willowmere']
    ok.append(('the Mosswood is grass under many trees, most of them oaks', M['grass'] > M['n'] * .5 and M['trees'] > M['n'] * .04 and M['own'] > M['trees'] * .5))
    ok.append(('with its own ferns in front', M['fol'] > 50 and not M['moor']))
    ok.append(('the Willowmere is mud and peat under fewer trees, most of them willows', L['mud'] > L['n'] * .5 and 0 < L['trees'] / L['n'] < M['trees'] / M['n'] and L['own'] > L['trees'] * .5))
    ok.append(('with its own tufts, and reeds', L['fol'] > 50 and not L['moor'] and L['reeds'] > L['n'] * .1))
    await world(h, 4242); w = W[4242]; sx = await h.ev("X0"); mx, mn = w['run']['mosswood']; wx, wn = w['run']['willowmere']
    im1 = None; im2 = None
    await h.ev("G.clock = .3; updateSun(); 1")
    await h.goto(mx + mn // 2); await h.step(41); im1 = await h.shot(); n1 = await h.ev("[G.biome, G.biomeN]")
    await h.goto(wx + wn // 2); await h.step(41); im2 = await h.shot(); n2 = await h.ev("[G.biome, G.biomeN]")
    print('  standing there, the banner reads', n1, 'and', n2)
    ok.append(('each land is named on the banner', n1[0] == 'mosswood' and bool(n1[1]) and n2[0] == 'willowmere' and bool(n2[1])))
    await h.ev("for (const sx of [X0, X0 + 700, X0 - 900, X0 + 2600, X0 - 4100]) streamTo(sx * T, true); 1"); cr = await h.ev(CROWNS)
    print('  crowned trees formed so far, by land:', cr)
    ok.append(('no tree outside the two lands has a crown', all(b in ('mosswood', 'willowmere') for b in cr) and len(cr) > 0))
    P = await h.ev(PLACES)
    print('  places in the Mosswood', P['small']['mosswood'], 'great places', P['big']['mosswood'], 'curios', P['curios']['mosswood'])
    print('  places in the Willowmere', P['small']['willowmere'], 'great places', P['big']['willowmere'], 'curios', P['curios']['willowmere'])
    ok.append(('both lands have places of their own', len(P['small']['mosswood']) >= 2 and len(P['small']['willowmere']) >= 1 and len(P['big']['mosswood']) + len(P['big']['willowmere']) >= 1))
    ok.append(('and things on the road', len(P['curios']['mosswood']) >= 1 and len(P['curios']['willowmere']) >= 1))
    T0 = await h.ev("(() => { const o = {}; for (const b of ['mosswood', 'willowmere']) o[b] = [BIOME[b], MOODS[b].map(m => m.n), !!BIOTINT[b], (FOL[b] || []).length, (BIOME_MOBS[b] || []).length, (SKINDS[b] || []).length, (SKINDS2[b] || []).length, (BKINDS3[b] || []).length, (CURIO_KINDS[b] || []).length, typeof LFN[b], BIDX[b]]; return o; })()")
    print('  tables:', T0)
    ok.append(('every table that is keyed by land knows them', all(all(v for v in T0[b]) for b in T0)))

    # ---- 3. hens and deer: by day only, they run, and what they leave
    R = await h.ev("""(() => { const cnt = (b, night) => { const o = {}; for (let i = 0; i < 600; i++) { const t = pickMob(BIOME_MOBS[b], night); o[t] = (o[t] || 0) + 1; } return o; };
      return { md: cnt('mosswood', false), mn: cnt('mosswood', true), wd: cnt('willowmere', false), wn: cnt('willowmere', true), moor: cnt('moor', false) }; })()""")
    print('  who comes in the Mosswood by day', R['md'], 'by night', R['mn']); print('  who comes in the Willowmere by day', R['wd'], 'by night', R['wn'])
    ok.append(('moss deer in the Mosswood and willow hens in the Willowmere, by day', R['md'].get('mossdeer', 0) > 150 and R['wd'].get('willowhen', 0) > 150))
    ok.append(('never by night, and no deer on the moor', not R['mn'].get('mossdeer') and not R['mn'].get('wildpig') and not R['wn'].get('willowhen') and not R['wn'].get('mossdeer') and not R['moor'].get('mossdeer')))
    ok.append(('wild pigs and hens roam the moor by day too', R['moor'].get('wildpig', 0) > 0 and R['moor'].get('willowhen', 0) > 0))
    await h.goto(mx + mn // 2)
    sp = await h.ev("""(() => { G.enemies.length = 0; G.clock = .3; updateSun(); G.time = 5000; let seen = {}; for (let i = 0; i < 400 && G.enemies.length < 3; i++) { G.spawnT = 0; spawnTick0(); } for (const e of G.enemies) seen[e.type] = (seen[e.type] || 0) + 1; return seen; })()""")
    print('  left alone in the Mosswood at midday, these came:', sp)
    ok.append(('creatures do come in the Mosswood', sum(sp.values()) > 0))
    D = await h.ev("""(() => { const p = G.p, out = {}; for (const [type, n] of [['willowhen', 300], ['mossdeer', 300]]) { G.drops.length = 0; for (let i = 0; i < n; i++) rollDrops(type, p.x, p.y - 20); const o = {}; for (const d of G.drops) o[d.id] = (o[d.id] || 0) + d.n; out[type] = o; } G.drops.length = 0; return out; })()""")
    print('  300 hens leave', D['willowhen']); print('  300 deer leave', D['mossdeer'])
    ok.append(('a hen leaves eggs and feathers, a deer meat, hide and antlers (and now and then a moonseed)', D['willowhen'].get('egg', 0) > 200 and D['willowhen'].get('feather', 0) > 300 and D['mossdeer'].get('meat', 0) > 300 and D['mossdeer'].get('antler', 0) > 120 and 0 < D['mossdeer'].get('moonseed', 0) < 80))
    ok.append(('and all of it can be carried', await h.ev("['egg', 'feather', 'antler', 'moonseed'].every(id => IT[id] && IT[id].icon && IT[id].name)")))
    # (on a flat, bare patch: in a world made today the Mosswood may hold a wall to turn them, or a nettle to sting the Waker)
    await h.ev("""(() => { const p = G.p, tx = floor(p.x / T), gy = heights[tx]; for (let x = tx - 8; x <= tx + 60; x++) { for (let y = gy - 14; y < gy; y++) setTile(x, y, AIR); setTile(x, gy, DIRT); setTile(x, gy + 1, DIRT); heights[x] = gy; } p.y = p.py = gy * T - p.h; p.vx = p.vy = 0; })()""")
    F = await h.ev("""(() => { const p = G.p, tx = floor(p.x / T); G.enemies.length = 0; const out = {};
      for (const type of ['willowhen', 'mossdeer']) { const e = spawnMob(type, tx + 3, heights[tx + 3]); const d0 = abs(e.x - p.x), hp = p.hp; for (let i = 0; i < 240; i++) { G.spawnT = 1e9; tick(); } out[type] = [round(d0), round(abs(e.x - p.x)), p.hp === hp, e.dead ? 1 : 0]; e.dead = true; G.enemies.length = 0; }
      return out; })()""")
    print('  a hen three paces away is %d away four seconds on; a deer %d' % (F['willowhen'][1], F['mossdeer'][1]))
    ok.append(('they run from a Waker and do no harm', all(F[t][1] > F[t][0] + 20 and F[t][2] for t in F)))
    fl = await h.ev("""(() => { const p = G.p, tx = floor(p.x / T); G.enemies.length = 0; const e = spawnMob('mossdeer', tx + 2, heights[tx + 2]); G.drops.length = 0; killEnemy(e); const o = {}; for (const d of G.drops) o[d.id] = (o[d.id] || 0) + d.n; G.drops.length = 0; G.enemies.length = 0; return [e.dead, o]; })()""")
    print('  a felled deer left', fl[1])
    ok.append(('a felled deer drops meat', fl[0] and fl[1].get('meat', 0) >= 1))

    # ---- 4. a world made before them has neither, and a saved world keeps its land
    old = await h.ev("""(() => { const out = {}; for (const land of [1, 2, 3, 4, 5]) { Object.assign(WORLD, { id: 't', name: 't', seed: 4242, size: 1, shape: 0, mode: 0, arena: false, land, legacy: {}, gates: null, known: null }); SEED = 4242; PLC.clear(); initEndless();
      let n = 0; for (let x = X0 - 12000; x < X0 + 12000; x += 3) { const b = biomeE(x); if (b === 'mosswood' || b === 'willowmere') n++; } streamTo((X0 + 1500) * T, true); let c = 0; for (const [x, tr] of treeTops) if (tr.kind >= 4) c++; out[land] = [n, c, WT_ON]; } return out; })()""")
    print('  columns of the new lands, crowned trees, traits on, by the land a world of seed 4242 was made with:', old)
    ok.append(('worlds made as land 1 to 4 have neither land and no crowns', all(old[str(k)][0] == 0 and old[str(k)][1] == 0 for k in (1, 2, 3, 4))))
    ok.append(('land 5 keeps the traits and moods of land 4', old['5'][2] and old['5'][0] > 0))
    sv = await h.ev("""(async () => { localStorage.clear(); const res = {};
      for (const land of [6, 5, 4]) { createWorld({ name: 'L' + land, seed: 'moss', size: 1, shape: 0, mode: 0, skin: 0 }); await new Promise(r => setTimeout(r, 500)); if (G.state === 'intro') beginPlay(true);
        if (land < 6) { WORLD.land = land; SEED = WORLD.seed; initEndless(); streamTo(SPAWN_X * T, true); }
        const a = []; for (let x = X0 - 6000; x < X0 + 6000; x += 40) a.push(biomeE(x)); saveWorld(true);
        const id = WORLD.id, meta = JSON.parse(localStorage.getItem(profileKey('index'))).find(m => m.id === id); quitToTitle(); await new Promise(r => setTimeout(r, 200));
        await openWorld(meta); await new Promise(r => setTimeout(r, 500)); if (G.state === 'intro') beginPlay(false);
        const b = []; for (let x = X0 - 6000; x < X0 + 6000; x += 40) b.push(biomeE(x));
        res[land] = [WORLD.land, a.join() === b.join(), a.filter(q => q === 'mosswood' || q === 'willowmere').length]; quitToTitle(); await new Promise(r => setTimeout(r, 200)); }
      return res; })()""")
    print('  saved and opened again [land, same lands in the same places, sightings of the new lands]:', sv)
    ok.append(('a new (land-6) world opens as land 6, with its lands where they were', sv['6'][0] == 6 and sv['6'][1] and sv['6'][2] > 0))
    ok.append(('a land-5 world opens as land 5, with its lands where they were', sv['5'][0] == 5 and sv['5'][1] and sv['5'][2] > 0))
    ok.append(('a land-4 world opens as land 4, still without them', sv['4'][0] == 4 and sv['4'][1] and sv['4'][2] == 0))

    # ---- 5. walking through them, both ways, on four seeds
    paces = 0; stuck = []; inside = []; ims = [im1, im2]; labels = ['the Mosswood', 'the Willowmere']
    for seed in SEEDS[:4]:
        await world(h, seed); w = W[seed]; await h.ev("G.p.maxhp = 99999; G.p.hp = 99999; G.enemies.length = 0; spawnTick = () => {}; 1"); line = []
        for b in ('mosswood', 'willowmere'):
            x0, n = w['run'][b]; n = min(n, 600)   # (a world made today can have a land thousands of paces wide: 600 of it is plenty)
            for key, d, a in (('KeyD', 1, x0 + 3), ('KeyA', -1, x0 + n - 3)):
                await h.goto(a); await h.ev("G.p.bot = null; 1"); best = 0
                for k in range(30):
                    await h.step(200, js="botStep('%s'); G.p.hp = G.p.maxhp;" % key)
                    r = json.loads(await h.ev("JSON.stringify({ x: G.p.x / T, still: G.p.bot.still, down: floor(G.p.y / T) - heights[floor(G.p.x / T)] })")); best = max(best, (r['x'] - a) * d)
                    if best > n - 8 or r['still'] > 600: break
                got = best > n - 8; paces += min(best, n); line.append('%s %s %d of %d' % (b, 'east' if d > 0 else 'west', round(best), n))
                if not got and r['down'] > 6: inside.append('%d %s x=%d, %d below the ground' % (seed, b, r['x'], r['down']))
                elif not got: stuck.append('%d %s x=%d' % (seed, b, r['x']))
                if not got: ims.append(await h.pcrop(200, 110)); labels.append('stopped %d %s' % (seed, b))
        print('  seed %-6d %s' % (seed, ', '.join(line)))
    print('  walked %d paces through the two lands; stuck on the land: %s; went down into a buried place and stayed there: %s' % (paces, stuck or 'never', inside or 'never'))
    ok.append(('more than 1500 paces through the new lands, both ways across each, never stuck on the land', paces > 1500 and not stuck))
    sheet([im.resize((640, 360)) for im in ims[:2]] + [im.resize((640, 360)) for im in ims[2:]], 2, shot('new_lands.png'), labels)

    bad = [n for n, v in ok if not v]
    for n, v in ok: print(('  ok   ' if v else '  FAIL ') + n)
    errs = [e for e in h.errs if 'PAGEERROR' in e]
    for e in errs[:5]: print('  ', e[:300])
    await h.stop()
    print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
    return not bad and not errs

if __name__ == '__main__':
    sys.exit(0 if asyncio.run(run()) else 1)
