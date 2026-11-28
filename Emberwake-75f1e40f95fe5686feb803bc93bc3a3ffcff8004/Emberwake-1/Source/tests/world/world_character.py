# The world's own character: three traits from the seed, lands with moods, curios on the road, the seasons and the weather.
# And the promise behind all of it: a world made before these existed still comes out tile for tile as it did.
import asyncio, json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H, sheet
from where import shot

# the land of five older worlds, hashed in the last build before traits (seed : land : shape)
OLD = {'4242:3:0': 843561104, '777:3:1': 1119153289, '99:2:0': 2540136475, '31337:1:2': 3823243006, '12345:3:0': 2405459842}
HASH = """(() => { const out = {}; for (const [seed, land, shape] of [[4242, 3, 0], [777, 3, 1], [99, 2, 0], [31337, 1, 2], [12345, 3, 0]]) {
  Object.assign(WORLD, { id: 't', name: 't', seed, size: 1, shape, mode: 0, arena: false, land, legacy: {}, gates: null, known: null }); SEED = seed; PLC.clear(); initEndless();
  let h = 2166136261 >>> 0; for (const sx of [X0, X0 + 700, X0 - 900, X0 + 2600, X0 - 4100]) { streamTo(sx * T, true); for (let x = sx - 96; x < sx + 96; x++) { for (let y = 0; y < WH; y++) { const i = y * WW + x; h = Math.imul(h ^ tiles[i], 16777619) >>> 0; h = Math.imul(h ^ walls[i], 16777619) >>> 0; } h = Math.imul(h ^ heights[x], 16777619) >>> 0; } }
  for (const [x, t] of treeTops) h = Math.imul(h ^ (x * 31 + t.y * 7 + t.kind), 16777619) >>> 0;
  out[seed + ':' + land + ':' + shape] = [h, WT_ON, WT_KEYS.length, CURIO_AT.size]; } return out; })()"""
# the shape of a world with the traits it was forced to have
STATS = """(() => { let lakes = 0, steep = 0, sum = 0, sq = 0, n = 0, big = 0; const bio = {};
  for (let k = floor((X0 - 6000) / 360); k <= floor((X0 + 6000) / 360); k++) if (lakeOf(k)) lakes++;
  for (let k = floor((X0 - 12000) / bigW()); k <= floor((X0 + 12000) / bigW()); k++) if (bigOf(k)) big++;
  for (let x = X0 - 6000; x < X0 + 6000; x++) { const s = surf(x); sum += s; sq += s * s; n++; if (abs(surf(x + 2) - s) >= 3) steep++; const b = biomeE(x); bio[b] = (bio[b] || 0) + 1; }
  const sx = X0 + 1500; streamTo(sx * T, true); let air = 0, rock = 0, ore = 0, trees = 0, isle = 0;
  for (let x = sx - 150; x < sx + 150; x++) { if (treeTops.has(x)) trees++; for (let y = 4; y < DEEP_Y - 12; y++) { const t = tiles[y * WW + x]; if (y < heights[x] - 30) { if (TP[t].full) isle++; continue; } if (y < heights[x] + 12) continue; if (t === AIR) air++; else rock++; if (t === COPPER || t === TIN || t === IRON || t === COAL || t === EMBER) ore++; } }
  return { lakes, steep, big, sd: Math.sqrt(sq / n - (sum / n) ** 2), bio, air: air / (air + rock), ore, trees, isle, keys: WT_KEYS.join(',') }; })()"""


async def world(h, traits, seed=4242):
    """forge a new world of this seed, with these three traits whatever the seed would have given"""
    await h.ev("window.FORCE_T = %s; traitsOf = s => FORCE_T || TRAITS0(s); Object.assign(WORLD, { id: 'test', name: 'Test', seed: %d, size: 1, shape: 0, mode: 0, arena: false }); G.skin = 0; startWorld(null); 1" % (json.dumps(traits), seed))
    for _ in range(120):
        if await h.ev("G.state") in ('intro', 'play'): break
        await h.pg.wait_for_timeout(100)
    await h.ev("G.manual = true; if (G.state === 'intro') beginPlay(true); G.says.length = 0; G.sayCur = null; G.time = 700; G.spawnT = 1e9; G.cine = null; G.banner = null; 1")


async def run():
    ok = []
    h = await H().start(mode='none')
    await h.ev("window.TRAITS0 = traitsOf; 1")

    # ---- 1. older worlds are untouched
    got = await h.ev(HASH); same = all(got[k][0] == OLD[k] for k in OLD)
    for k in OLD: print('  old world %-12s %s' % (k, 'same land' if got[k][0] == OLD[k] else 'CHANGED (%d, was %d)' % (got[k][0], OLD[k])))
    ok.append(('worlds made before traits come out tile for tile as they did', same))
    ok.append(('and have no traits, moods or curios', all(not got[k][1] and got[k][2] == 0 and got[k][3] == 0 for k in OLD)))

    # ---- 2. three traits from the seed
    t = await h.ev("(() => { const a = [1, 2, 3, 99, 4242, 777777].map(s => traitsOf(s)), b = [1, 2, 3, 99, 4242, 777777].map(s => traitsOf(s)); const seen = new Set(); for (let s = 1; s <= 600; s++) for (const k of traitsOf(s)) seen.add(k); return { a, same: JSON.stringify(a) === JSON.stringify(b), groups: a.every(t => t.length === 3 && TRAITS[t[0]].g === 'land' && TRAITS[t[1]].g === 'life' && TRAITS[t[2]].g === 'sky'), all: seen.size === Object.keys(TRAITS).length, n: Object.keys(TRAITS).length }; })()")
    print('  seeds 1, 2, 3 give', t['a'][:3])
    ok.append(('a seed always gives the same three traits: one for land, one for life, one for sky', t['same'] and t['groups']))
    ok.append(('every one of the %d traits turns up' % t['n'], t['all']))

    # ---- 3. what the land traits do to the land
    S = {}
    for name, tr in (('plain', ['rich', 'bounty', 'mist']), ('crags', ['crags', 'bounty', 'mist']), ('lowland', ['lowland', 'bounty', 'mist']), ('drowned', ['drowned', 'bounty', 'mist']), ('frozen', ['frozen', 'bounty', 'mist']),
                     ('scorched', ['scorched', 'bounty', 'mist']), ('hollow', ['hollow', 'bounty', 'mist']), ('skytorn', ['skytorn', 'bounty', 'mist']), ('oldgrowth', ['skytorn', 'oldgrowth', 'mist']), ('barren', ['skytorn', 'barren', 'mist'])):
        await world(h, tr); S[name] = await h.ev(STATS)
        s = S[name]; print('  %-9s lakes %-3d steep %-4d height spread %-5.1f great places %-2d caves %.3f ore %-4d stalks %-3d sky rock %-4d cold %.2f hot %.2f wet %.2f' % (name, s['lakes'], s['steep'], s['sd'], s['big'], s['air'], s['ore'], s['trees'], s['isle'],
              s['bio'].get('reach', 0) / 12000, (s['bio'].get('dunes', 0) + s['bio'].get('scoria', 0) + s['bio'].get('ash', 0)) / 12000, s['bio'].get('fen', 0) / 12000))
    P = S['plain']; hot = lambda s: s['bio'].get('dunes', 0) + s['bio'].get('scoria', 0) + s['bio'].get('ash', 0)
    ok.append(('CRAGGED: the land steps up in shelves (more steep ground)', S['crags']['steep'] > P['steep'] * 1.25))
    ok.append(('and still has room for great places', S['crags']['big'] >= max(3, P['big'] * .5)))
    ok.append(('GENTLE: lower hills, more lakes', S['lowland']['sd'] < P['sd'] * .85 and S['lowland']['lakes'] > P['lakes']))
    ok.append(('DROWNED: lakes everywhere and more fen', S['drowned']['lakes'] > P['lakes'] * 1.6 and S['drowned']['bio'].get('fen', 0) > P['bio'].get('fen', 0) * 1.15))
    ok.append(('LONG WINTER: the Reach spreads', S['frozen']['bio'].get('reach', 0) > P['bio'].get('reach', 0) * 1.15))
    ok.append(('SCORCHED: dunes, rust and ash spread', hot(S['scorched']) > hot(P) * 1.15))
    ok.append(('HOLLOW: more of the ground is cave', S['hollow']['air'] > P['air'] * 1.12))
    ok.append(('RICH VEINS: more ore in the same rock (the plain world here is a rich one)', P['ore'] > S['crags']['ore'] * 1.15))
    ok.append(('SKY-TORN: more islands on the wind', S['skytorn']['isle'] > P['isle'] * 1.3 or (P['isle'] == 0 and S['skytorn']['isle'] > 0)))
    ok.append(('OLD GROWTH against BARREN: many stalks or few', S['oldgrowth']['trees'] >= S['barren']['trees'] * 2 and S['oldgrowth']['trees'] > 0))

    # ---- 4. what the life and sky traits do while you play
    await world(h, ['rich', 'quiet', 'longnight'])
    r = await h.ev("(() => ({ day: traitCap(3, false, false), night: traitCap(5, true, false), under: traitCap(5, true, true), pd: traitPace(false, false), pn: traitPace(true, false), cn: traitClock(.8), cd: traitClock(.3) }))()")
    ok.append(('QUIET DAYS: one creature by day, seven by night, the underground as ever', r['day'] == 1 and r['night'] == 7 and r['under'] == 5 and r['pd'] > 1.5 and r['pn'] < .8))
    ok.append(('LONG NIGHTS: the clock runs slow after dark only', r['cn'] < .7 and r['cd'] == 1))
    c0 = await h.ev("G.clock = .8; G.days = 0; 1"); await h.step(600); night = await h.ev("G.clock - .8")
    await h.ev("G.clock = .3; 1"); await h.step(600); day = await h.ev("G.clock - .3")
    print('  ten seconds of clock: by day %.5f, by night %.5f' % (day, night)); ok.append(('and it really does', night < day * .75))
    await world(h, ['rich', 'feral', 'twomoons'])
    await h.goto("X0 + 600"); n = await h.ev("(() => { G.enemies.length = 0; const tx = floor(G.p.x / T) + 12, e = spawnMob('husk', tx, groundAt(tx)); Math.random = () => .7; traitSpawned(e, tx, groundAt(tx)); Math.random = RND; return [G.enemies.length, e.maxhp]; })()".replace('RND', 'window.RND0')) if await h.ev("window.RND0 = Math.random; 1") else None
    print('  a feral husk comes with company:', n); ok.append(('FERAL: creatures come in packs, each a little weaker', n[0] >= 2 and n[1] < 48))
    sun = await h.ev("(() => { G.clock = .8; updateSun(); const a = G.sun.slice(); WT.twomoons = 0; updateSun(); const b = G.sun.slice(); WT.twomoons = 1; return [a, b]; })()")
    ok.append(('TWIN MOONS: the night is brighter', sun[0][2] > sun[1][2] + .08))
    await world(h, ['rich', 'elder', 'storms'])
    await h.goto("X0 + 600"); e = await h.ev("(() => { G.enemies.length = 0; G.drops.length = 0; const tx = floor(G.p.x / T) + 10, e = spawnMob('husk', tx, groundAt(tx)); const w0 = e.w, h0 = e.h, hp0 = e.maxhp; makeElder(e); const out = [e.w / w0, e.h / h0, e.maxhp / hp0, e.name, boxHits(e.x, e.y, e.w, e.h)]; window.ELD = e; return out; })()")
    await h.step(20); im_elder = await h.crop("ELD.x + 4", "ELD.y + 10", 110, 80)
    d = await h.ev("(() => { damageEnemy(ELD, 1e6, 1, -1, {}); return [ELD.dead, G.drops.length]; })()")
    print('  an elder husk:', e, ' felled:', d); ok.append(('ELDER BEASTS: bigger, far tougher, not stuck in the ground, and they carry more', e[0] > 1.25 and e[2] > 2.5 and not e[4] and d[0] and d[1] >= 3))
    ok.append(('STORM-WRACKED: the sky turns twice as often', await h.ev("traitEvent('thunder') === 2 && traitEvent('fog') === 2")))
    await world(h, ['rich', 'shields', 'mist'])
    w = await h.ev("(() => { let n = 0; const tx = floor(G.p.x / T) + 10; for (let i = 0; i < 400; i++) { const e = mkEnemy('husk', 0, 0); wardRoll(e); if (e.warded) n++; } WT.shields = 0; let m = 0; for (let i = 0; i < 400; i++) { const e = mkEnemy('husk', 0, 0); wardRoll(e); if (e.warded) m++; } WT.shields = 1; return [n, m]; })()")
    print('  warded husks in 400 with SHIELD-BEARERS and without:', w); ok.append(('SHIELD-BEARERS: a quarter carry a shield, three times the usual', 60 <= w[0] <= 140 and 10 <= w[1] <= 60))

    # ---- 5. moods: one land, three ways
    await world(h, None)
    m = await h.ev("""(() => { const at = {}, n = {}; for (let d = 200; d < 16000; d += 10) for (const s of [1, -1]) { const x = X0 + s * d, b = biomeE(x), md = moodAt(x), k = b + md; n[k] = (n[k] || 0) + 1; if (!at[k] && !inWindow(x, 90) && biomeE(x - 50) === b && biomeE(x + 50) === b && moodAt(x - 50) === md && moodAt(x + 50) === md) at[k] = x; } return { at, n, traits: WT_KEYS }; })()""")
    kinds = sorted(m['at']); moody = [k for k in kinds if k[-1] != '0']
    print('  this world is', m['traits'], ' its lands:', ' '.join(kinds))
    ok.append(('the lands of one world come in different moods (%d of them here)' % len(moody), len(moody) >= 5))
    names = await h.ev("JSON.stringify(Object.entries(%s).map(([k, x]) => [k, landName(biomeE(x), x), landSub(biomeE(x), x)]))" % json.dumps(m['at']))
    names = json.loads(names); print('  ' + ', '.join('%s=%s' % (a, b) for a, b, c in names))
    ok.append(('each mood has its own name', len(set(b for a, b, c in names)) >= len(names) - 1 and all(b for a, b, c in names)))
    ims = []; labels = []
    stat = {}
    for k in kinds:
        x = m['at'][k]; await h.goto(x); await h.ev("G.clock = .3; updateSun(); G.wx = null; G.enemies.length = 0; 1"); await h.step(25)
        stat[k] = await h.ev("(() => { const x0 = %d; let trees = 0, fl = 0, ash = 0, cry = 0, bones = 0, gl = 0, reed = 0, salt = 0; for (let x = x0 - 60; x < x0 + 60; x++) { if (treeTops.has(x)) trees++; const y = heights[x], t = tiles[(y - 1) * WW + x], g = tiles[y * WW + x]; if (t === FLOWER) fl++; if (t === CRYSTAL) cry++; if (t === BONES) bones++; if (t === GLOWCAP) gl++; if (t === REED) reed++; if (g === ASH) ash++; if (g === SALT) salt++; } return { trees, fl, ash, cry, bones, gl, reed, salt, banner: G.biomeN }; })()" % x)
        if k[-1] != '0' and len(ims) < 6: ims.append(await h.shot()); labels.append('%s  %s' % (k, stat[k]['banner']))
    for k in kinds: print('    %-8s %s' % (k, {a: b for a, b in stat[k].items() if b}))
    ok.append(('walking into a mood shows its name', all(stat[k]['banner'] for k in kinds)))
    chk = []
    if 'moor1' in stat: chk.append(stat['moor1']['ash'] > 10 and stat['moor1']['fl'] == 0)
    if 'moor2' in stat: chk.append(stat['moor2']['fl'] + stat['moor2']['gl'] >= 8)
    if 'reach1' in stat and 'reach2' in stat: chk.append(stat['reach1']['trees'] > stat['reach2']['trees'] * 2)
    if 'dunes2' in stat: chk.append(stat['dunes2']['salt'] > 60)
    if 'thorn1' in stat and 'thorn2' in stat: chk.append(stat['thorn1']['trees'] > stat['thorn2']['trees'] * 2)
    if 'fen1' in stat: chk.append(stat['fen1']['gl'] > 0)
    ok.append(('and its own ground and plants (%d checks)' % len(chk), len(chk) >= 3 and all(chk)))
    if ims: sheet(ims, 3, shot('world_moods.png'), labels, .5)

    # ---- 6. curios on the road
    cur = await h.ev("(() => { const at = {}; let n = 0; for (let k = floor((X0 - 14000) / CURIO_W); k <= floor((X0 + 14000) / CURIO_W); k++) { const c = curioOf(k); if (!c) continue; n++; if (!at[c.kind] || abs(c.x - X0) < abs(at[c.kind] - X0)) at[c.kind] = c.x; } return { at, n }; })()")
    print('  curios within 14000 paces:', cur['n'], cur['at'])
    ok.append(('there are curios along the road, of many kinds', cur['n'] >= 25 and len(cur['at']) >= 6))
    A = cur['at']; cims = []; clab = []
    near = "interactables().filter(l => hypot(l.x - G.p.x - 3, l.y - G.p.y - 10) < 60)"
    async def at(kind, dx=-2):
        await h.goto(A[kind] + dx); await h.ev("G.clock = .3; updateSun(); G.wx = null; G.enemies.length = 0; G.banner = null; G.says.length = 0; G.sayCur = null; 1"); await h.step(12)
        cims.append(await h.pcrop(150, 90)); clab.append(kind)
    if 'mile' in A:
        await at('mile'); r = await h.ev("(() => { const l = %s.find(l => l.label === 'read the milestone'); if (!l) return null; l.act(); return [G.says.concat(G.sayCur ? [G.sayCur] : []).map(s => s.text || s).join(' / '), G.way]; })()" % near)
        print('  milestone:', r); ok.append(('a milestone tells you the way home and to the nearest great place', bool(r) and 'HEARTHHOLD' in r[0] and (r[1] is None or r[1]['x'] > 0)))
    if 'rest' in A:
        await at('rest'); r = await h.ev("(() => { const l = %s.find(l => l.label === 'study the stance'); if (!l) return null; const f0 = JSON.stringify(G.fam || {}); G.p.hp = 50; l.act(); const f1 = JSON.stringify(G.fam || {}); l.act(); return [f0 !== f1, G.p.hp, %s.some(l => l.label === 'the stance is yours now'), JSON.stringify(G.fam) === f1]; })()" % (near, near))
        print('  a Waker\'s rest:', r); ok.append(("a Waker's Rest teaches a weapon family once", bool(r) and r[0] and r[1] == 70 and r[2] and r[3]))
    if 'spring' in A:
        await at('spring'); r = await h.ev("(() => { const l = %s.find(l => l.label === 'drink from the spring'); if (!l) return null; G.p.hp = 12; G.p.stam = 5; l.act(); const a = [G.p.hp === G.p.maxhp, G.p.tonic > 0]; const l2 = %s.find(l => /spring/.test(l.label)); G.p.hp = 12; l2.act(); a.push(l2.label, G.p.hp); G.days += 1.01; a.push(%s.find(l => /spring/.test(l.label)).label); return a; })()" % (near, near, near))
        print('  an ember spring:', r); ok.append(('an ember spring makes you whole, once a day', bool(r) and r[0] and r[1] and r[2] == 'the spring is resting' and r[3] == 12 and r[4] == 'drink from the spring'))
    if 'hermit' in A:
        await at('hermit', 2); r = await h.ev("(() => { const l = %s.find(l => l.label === 'read the note'); if (!l) return null; const j0 = countItem('jerky'); l.act(); const j1 = countItem('jerky'); l.act(); return [j1 - j0, countItem('jerky') - j1, (G.sayCur ? [G.sayCur] : []).concat(G.says).map(s => s.text || s).join(' / ').slice(0, 90)]; })()" % near)
        print('  a hermit\'s note:', r); ok.append(("a hermit's note says something, and leaves you his jerky once", bool(r) and r[0] == 2 and r[1] == 0 and 'note says' in r[2]))
    if 'cache' in A:
        await at('cache'); r = await h.ev("(() => { const x = %d, gy = heights[x]; let c = -1; for (let y = gy; y < gy + 7; y++) if (tiles[y * WW + x] === CHEST) c = y - gy; return [c, LOOT.get((gy + c) * WW + x)]; })()" % A['cache'])
        print('  something buried:', r); ok.append(('a buried cache is a chest under turned ground', r[0] >= 2 and r[1] == 'curio'))
    if 'stones' in A:
        await at('stones', 0)
        STONE = "(j => { const l = interactables().filter(l => l.label === 'strike the stone').sort((a, b) => a.x - b.x)[j]; G.p.x = G.p.px = l.x - 3; l.act(); return 1; })"
        await h.ev("G.bless = null; G.sing = null; 1")
        await h.ev(STONE + "(0)"); await h.step(8); await h.ev(STONE + "(1)"); early = await h.ev("[G.sing, G.bless]")
        await h.ev(STONE + "(0)"); await h.step(36); await h.ev(STONE + "(1)"); await h.step(20); cims.append(await h.pcrop(150, 90)); clab.append('the next stone glints'); await h.step(16); await h.ev(STONE + "(2)")
        good = await h.ev("[G.bless && G.bless.k, G.banner && G.banner.text]")
        beat = await h.ev("(() => { const p = G.p; p.atk = null; p.state = 'normal'; p.chainT = 0; p.buf = null; beatPress(p, 'L'); const b = p.buf && p.buf.beat; G.bless = null; p.buf = null; beatPress(p, 'L'); const c = p.buf && p.buf.beat; p.buf = null; return [b, c]; })()")
        print('  the singing stones: too soon ->', early, ' in time ->', good, ' first blow of a chain with and without the blessing:', beat)
        ok.append(('the Singing Stones want low, middle, high, each in time', early[0] is None and early[1] is None and good[0] == 'cadence'))
        ok.append(('their blessing makes the first blow of every chain count as in time', beat[0] == 1 and beat[1] == 0))
    if cims: sheet(cims, 4, shot('world_curios.png'), clab)

    # ---- 7. the year and the weather
    await world(h, ['rich', 'bounty', 'mist'])
    y = await h.ev("(() => { G.days = 0; const a = SEASON().n; G.days = 2.999; G.banner = null; G.state = 'play'; tickYear(.002); const b = SEASON().n, ban = G.banner && G.banner.text; G.days = 9.5; const c = SEASON().n; G.days = 12.2; const d = SEASON().n; return [a, b, ban, c, d, yearLine()]; })()")
    print('  the year:', y); ok.append(('three days to a season, four seasons, and a banner when it turns', y[0] == 'KINDLING' and y[1] == 'HIGHSUN' and y[2] == 'HIGHSUN' and y[3] == 'ASHREST' and y[4] == 'KINDLING'))
    k = await h.ev("(() => { G.days = 4; const hs = [seasonClock(.3), seasonClock(.8)]; G.days = 10; const ar = [seasonClock(.3), seasonClock(.8), seasonCap(true), seasonRegrow()]; G.days = 1; const ki = seasonRegrow(); G.days = 7; return [hs, ar, ki, seasonDrops()]; })()")
    ok.append(('HIGHSUN stretches the day, ASHREST the night; Kindling regrows fast; Emberfall is the harvest', k[0][0] < 1 < k[0][1] and k[1][0] > 1 > k[1][1] and k[1][2] == 1 and k[1][3] > 1 and k[2] < 1 and k[3] > 1))
    await h.goto("X0 + 400"); await h.ev("G.days = 1; G.clock = .3; G.wx = { k: 'rain', t: 4000, a: 1 }; G.parts.length = 0; updateSun(); 1"); s0 = await h.ev("G.sun.slice()")
    await h.step(40); rain = await h.ev("[G.parts.filter(p => p.rain).length, G.sun[0]]"); im_rain = await h.shot()
    await h.ev("G.wx = null; updateSun(); 1"); dry = await h.ev("G.sun[0]")
    await h.ev("G.days = 10; G.wx = { k: 'snow', t: 4000, a: 1 }; G.parts.length = 0; 1"); await h.step(120); snow = await h.ev("G.parts.length"); im_snow = await h.shot()
    print('  rain drops on screen %d, light %.2f against %.2f dry; snowflakes %d' % (rain[0], rain[1], dry, snow))
    ok.append(('rain falls, lands, and dims the day; snow falls in Ashrest', rain[0] > 30 and rain[1] < dry - .05 and snow > 30))
    under = await h.ev("(() => { const p = G.p, tx = floor(p.x / T); let y = heights[tx] + 30; while (y < DEEP_Y && solidAt(tx, y)) y++; if (y >= DEEP_Y) return -1; p.x = p.px = tx * T + 1; p.y = p.py = (y - 2) * T; G.parts.length = 0; G.wx = { k: 'rain', t: 4000, a: 1 }; for (let i = 0; i < 30; i++) wxParticles(); return G.parts.filter(q => q.rain).length; })()")
    ok.append(('no rain underground', under <= 0))
    sv = await h.ev("(() => { G.days = 7.25; G.curios = { 123: 7 }; const d = snapshotWorld(); return [d.days, d.land, JSON.stringify(d.curios)]; })()")
    ok.append(('the day of the year, the land version and used curios are saved', sv[0] == 7.25 and sv[1] == 6 and sv[2] == '{"123":7}'))
    sheet([im_elder.resize((330, 240)), im_rain.resize((426, 240)), im_snow.resize((426, 240))][1:], 2, shot('world_weather.png'), ['rain in Kindling', 'snow in Ashrest'])

    bad = [n for n, v in ok if not v]
    for n, v in ok: print(('  ok   ' if v else '  FAIL ') + n)
    errs = [e for e in h.errs if 'PAGEERROR' in e]
    for e in errs[:5]: print('  ', e[:300])
    await h.stop()
    print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
    return not bad and not errs

if __name__ == '__main__':
    sys.exit(0 if asyncio.run(run()) else 1)
