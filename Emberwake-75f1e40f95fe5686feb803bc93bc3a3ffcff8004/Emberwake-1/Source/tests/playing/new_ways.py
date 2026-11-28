# The settings page, doors that hold, sleep only at night, weight against knockback, the thrown trident, weapons that
# really poison and bleed, the weapon kinds taken out, plants that come loose when dug under, new food, the venomous
# adder and sickness, hail, and a world made since land 6 (its places laid out by its seed, green turf).
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import shot
from harness import H

async def main():
    h = await H().start(seed=4242)
    res, ok = {}, []
    async def settle(): await h.step(40, "G.cine=null; G.enemies.length=0;")
    await settle()
    PRESS = "(() => { render(1); const p = kitHit(%r); if (!p) return false; mouse.ux = p.x; mouse.uy = p.y; uiMouseDown(0); return true; })()"

    # ---- the settings page: from the home page, its switches work and are kept ----
    await h.ev("G.state = 'settings'; render(1);")
    m0 = await h.ev("muted"); await h.ev(PRESS % 'btn:SOUND'); m1 = await h.ev("[muted, JSON.parse(localStorage.getItem('ew_settings')).mute]")
    await h.ev(PRESS % 'btn:SOUND'); c0 = await h.ev("calmOn()"); await h.ev(PRESS % 'btn:SCREEN MOTION'); c1 = await h.ev("calmOn()"); await h.ev(PRESS % 'btn:SCREEN MOTION')
    res['settings: sound, kept, calm'] = [m0, m1, c0, c1]
    ok.append(('the settings page switches sound (and keeps it) and screen motion', m1 == [not m0, not m0] and c1 != c0))
    await h.ev("G.state = 'play';")

    # ---- doors: a closed door is a wall; the right button opens and shuts it from a few paces, from either side ----
    r = await h.ev("""(() => { const p = G.p, tx = floor((p.x + 3) / T) + 4, gy = groundAt(tx); for (let x = tx - 6; x <= tx + 6; x++) for (let y = gy - 5; y < gy; y++) if (TP[tileAt(x, y)].solid || TP[tileAt(x, y)].decor) setTile(x, y, AIR);
      for (let x = tx - 7; x <= tx + 7; x++) { setTile(x, gy, DIRT); setTile(x, gy + 1, DIRT); }
      for (let y = gy - 3; y < gy; y++) setTile(tx, y, DOORC); p.x = p.px = (tx - 3) * T; p.y = p.py = (gy - 3) * T - p.h + 3 * T - 1; window.DX = tx; window.DY = gy - 1; return [tx, gy]; })()""")
    await h.step(30, "G.cine=null;")
    await h.step(50, "keys.KeyD = true;"); await h.ev("keys.KeyD = false;")
    blocked = await h.ev("[G.p.x + G.p.w <= DX * T + .5, tileAt(DX, DY) === DOORC]")
    await h.ev("G.p.x = G.p.px = (DX - 6) * T;"); await h.step(4)
    await h.step(1, "mouse.wx = DX * T + 4; mouse.wy = (DY - 1) * T + 4; mouse.r = true; mouse.rp = true;"); await h.step(2, "mouse.r = false;")
    opened = await h.ev("tileAt(DX, DY) === DOORO")
    await h.step(90, "keys.KeyD = true;"); await h.ev("keys.KeyD = false;")
    through = await h.ev("G.p.x > DX * T + 8")
    await h.ev("G.p.x = G.p.px = (DX + 5) * T;"); await h.step(4)
    await h.step(1, "mouse.wx = DX * T + 4; mouse.wy = (DY - 1) * T + 4; mouse.r = true; mouse.rp = true;"); await h.step(2, "mouse.r = false;")
    shut = await h.ev("tileAt(DX, DY) === DOORC")
    res['doors: blocked, opened from 6 away, walked through, shut from the far side'] = [blocked, opened, through, shut]
    ok.append(('a closed door holds you back, and opens and shuts from a few paces on either side', blocked == [True, True] and opened and through and shut))

    # ---- sleep: only at night, and it heals more the more you are hurt, 40 at most ----
    day = await h.ev("(() => { G.clock = .4; updateSun(); G.p.hp = 30; const r = sleepAt(floor(G.p.x / T), floor(G.p.y / T)); return [r, G.p.hp]; })()")
    night = await h.ev("(() => { const out = []; for (const hp of [0, 20, 90]) { G.clock = .8; updateSun(); G.p.hp = max(1, hp); const before = G.p.hp; sleepAt(floor(G.p.x / T), floor(G.p.y / T)); out.push(round(G.p.hp - before)); } return out; })()")
    again = await h.ev("(() => { G.clock = .8; updateSun(); G.p.hp = 10; sleepAt(floor(G.p.x / T), floor(G.p.y / T)); const a = G.p.hp; sleepAt(floor(G.p.x / T), floor(G.p.y / T)); return [a, G.p.hp]; })()")
    res['sleep: by day, at night (hp 1, 20, 90), twice in a row'] = [day, night, again]
    ok.append(('no sleep by day; at night it heals up to 40, less the less you are hurt, and only once a night', day == [False, 30] and night[0] in (39, 40) and night[1] == 32 and night[2] == 4 and again[1] == again[0]))

    # ---- weight: the more you carry, the less a blow throws you ----
    kb = await h.ev("""(() => { const out = []; for (const load of [0, 1]) { inv.fill(null); if (load) for (let i = 1; i < INV_N; i++) inv[i] = { id: 'cobble', n: IT.cobble.stack }; const p = G.p; p.inv = 0; p.iDodge = 0; p.hurtT = 0; p.dead = false; p.hp = 100; p.vx = 0; hurtFighter(p, 1, p.x - 20, {}); out.push(+abs(p.vx).toFixed(2)); } inv.fill(null); return out; })()""")
    res['knockback: empty pack, full of stone'] = kb
    ok.append(('a full pack takes the sting out of knockback', kb[1] < kb[0] * .8))

    # ---- the trident is thrown and flies back; the hand is empty meanwhile ----
    # (a flat open stretch to throw along and to meet the adder on)
    FLAT = """(() => { const p = G.p, tx = floor((p.x + 3) / T), gy = floor((p.y + p.h) / T); for (let x = tx - 4; x <= tx + 30; x++) { for (let y = gy - 12; y < gy; y++) setTile(x, y, AIR); setTile(x, gy, DIRT); setTile(x, gy + 1, DIRT); } p.vx = p.vy = 0; p.y = p.py = gy * T - p.h; })()"""
    await h.ev("G.p.hp = 100; G.p.dead = false; G.p.hurtT = 0; inv.fill(null); inv[0] = { id: 'bone_trident', n: 1 }; G.sel = 0; G.p.stam = 100; G.p.face = 1; G.fam = { spear: 9999 };")
    await h.ev(FLAT); await h.step(20)
    await h.step(1, "mouse.wx = G.p.x + 80; mouse.wy = G.p.y + 2; mouse.r = true; mouse.rp = true;")
    await h.step(45, "mouse.r = true;"); await h.step(1, "mouse.r = false;")
    seq = []
    for i in range(90):
        await h.step(1); seq.append(await h.ev("(() => { const j = G.projs.find(p => p.type === 'javelin'); return (j ? (j.back ? 'B' : 'O') : '-') + (G.p.thrown ? 't' : '.'); })()"))
    res['trident flight'] = ''.join(s[0] for s in seq)
    ok.append(('the trident leaves the hand, flies, comes back, and is caught', 'O' in res['trident flight'] and 'B' in res['trident flight'] and seq[-1] == '-.' and any(s.endswith('t') for s in seq)))

    # ---- weapons that say they bleed or poison, do, every time ----
    st = await h.ev("""(() => { const out = {}; for (const id of ['bone_cleaver', 'chitin_daggers', 'flint_spear']) { G.enemies.length = 0; const e = spawnMob('husk', floor(G.p.x / T) + 2, floor((G.p.y + G.p.h) / T)); e.hp = e.maxhp = 500;
        const a = { f: G.p, m: MOVESETS[IT[id].set].moves[MOVESETS[IT[id].set].map.chain[0]], W: IT[id], hits: new Map(), pt: 0, stale: 1, face: 1, btn: 'L', setName: IT[id].set, beat: 0 };
        weaponStatus(a.W, G.p, e); out[id] = [(e.st && e.st.bleed) | 0, (e.st && e.st.poison) | 0]; } G.enemies.length = 0; return out; })()""")
    res['bleed / poison on a blow'] = st
    ok.append(('a bleeding weapon bleeds and a venomous one poisons on every blow', st['bone_cleaver'][0] > 0 and st['chitin_daggers'][1] > 0 and st['flint_spear'][0] > 0))
    gone = await h.ev("[['claws','sai','glaive','chainwhip','longsword'].filter(k => WTYPE[k]), ['steel_claws','glass_sai','bronze_glaive','glass_chainwhip','steel_longsword'].map(k => [!!IT[k], liveId(k), !!IT[liveId(k)]])]")
    res['weapon kinds taken out'] = gone
    ok.append(('claws, sai, glaives, chain whips and longswords are gone, and an old one becomes its kin', gone[0] == [] and all(not a and c for a, b, c in gone[1])))

    # ---- plants: dig under one and it comes loose; new food; nightshade sickens, frostmint tea settles it ----
    pl = await h.ev("""(() => { const tx = floor((G.p.x + 3) / T) + 3; let ty = 0; for (let y = 5; y < WH - 5; y++) if (solidAt(tx, y)) { ty = y; break; } setTile(tx, ty - 1, BERRY); const a = chipArr(ty * WW + tx); for (let c = 0; c < 8; c++) a[c] = 0; const n = G.drops.length; undercut(tx, ty); return [tileAt(tx, ty - 1), G.drops.length > n]; })()""")
    food = await h.ev("['potato','onion','frostmint','emberleaf','nettle','nightshade','pork','fowl','potato_soup','hen_stew','mint_tea','nettle_soup','pork_pie','ember_skewer'].filter(k => !IT[k] || !RECIPES.some(r => r.out === k) && !['potato','onion','frostmint','emberleaf','nettle','nightshade','pork','fowl'].includes(k))")
    await h.ev("G.enemies.length = 0; G.p.hurtT = 0; G.p.sick = 0; G.p.eatCd = 0; G.food = 50; if (G.p.st) G.p.st.poison = 0; addItem('nightshade', 1); eat(IT.nightshade);"); await h.step(40)
    sick = await h.ev("[G.p.sick > 0, G.p.st && G.p.st.poison > 0]")
    await h.ev("G.p.eatCd = 0; addItem('mint_tea', 1); eat(IT.mint_tea);"); await h.step(60)
    cured = await h.ev("G.p.sick | 0")
    res['plants: undercut, foods missing, nightshade, tea'] = [pl, food, sick, cured]
    ok.append(('a plant comes loose when its ground is dug away, and drops its fruit', pl == [0, True]))
    ok.append(('the new foods and their recipes are all there', food == []))
    ok.append(('nightshade poisons and sickens; frostmint tea settles the stomach', sick == [True, True] and cured == 0))

    # ---- the ash adder: a venomous bite poisons for a long while and turns the stomach ----
    await h.ev(FLAT); await h.step(10, "G.enemies.length = 0;")
    await h.ev("""(() => { G.enemies.length = 0; const p = G.p; p.hp = p.maxhp; p.sick = 0; p.inv = 0; p.hurtT = 0; if (p.st) p.st.poison = 0; const e = spawnMob('adder', floor((p.x + 3) / T) + 4, floor((p.y + p.h) / T)); e.y = p.y + p.h - e.h; e.x = p.x + 30; })()""")
    for i in range(40):
        await h.step(3, "G.cine=null;")
        if await h.ev("(G.p.st && G.p.st.poison > 300) && G.p.sick > 0"): break
    bit = await h.ev("[(G.p.st && G.p.st.poison) | 0, G.p.sick | 0]")
    res['adder bite: poison, sick'] = bit
    ok.append(('the adder\'s bite poisons for a long while and makes you sick', bit[0] > 300 and bit[1] > 0))
    await h.ev("G.enemies.length = 0; G.p.sick = 0; if (G.p.st) G.p.st.poison = 0;")

    # ---- hail: it hurts out in the open, not under a roof ----
    hail = await h.ev("""(() => { const p = G.p; p.hp = p.maxhp; p.inv = 0; G.wx = { k: 'hail', t: 9999, a: 1 }; const keep = Math.random; Math.random = () => .001; p.shel = false; tickWeatherYouFeel(); const open = p.hp; p.hp = p.maxhp; p.inv = 0; p.shel = true; tickWeatherYouFeel(); const roof = p.hp; Math.random = keep; G.wx = null; return [open < p.maxhp, roof === p.maxhp]; })()""")
    res['hail: hurts in the open, not under a roof'] = hail
    ok.append(('hail hurts out in the open and not under a roof', hail == [True, True]))
    await h.stop()

    # ---- a world made since land 6: its places laid out by its seed, green turf on the moor ----
    lay = []
    for seed in (101, 202):
        w = await H().start(seed=seed)
        lay.append(await w.ev("[WORLD.land, SHRINE_X - X0, SHRINE2_X - X0, BLADE_X - X0, SPIRE_X - X0, SKY_X - X0, feltAt(X0) === FELT_G]"))
        await w.stop()
    res['land 6 places (two seeds)'] = lay
    ok.append(('a new world is land 6, and two seeds lay the story\'s places out differently', lay[0][0] == 6 and lay[0][1:6] != lay[1][1:6]))
    ok.append(('the village\'s moor has green turf in a new world', lay[0][6] and lay[1][6]))

    for k, v in res.items(): print(k, '=>', v)
    bad = [t for t, g in ok if not g]
    for t, g in ok: print(('ok   ' if g else 'FAIL ') + t)
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e and 'WebSocket' not in e][:6])
    assert not bad, 'failed: ' + '; '.join(bad)

asyncio.run(main())
