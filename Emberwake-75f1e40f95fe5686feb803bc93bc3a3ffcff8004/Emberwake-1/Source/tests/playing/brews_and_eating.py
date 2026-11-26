# Eating, drinking and the brews.
# Food takes a moment to get down and a blow interrupts it (you keep the food); the Quickstep brew makes you faster and
# wears off; the Emberheart brew makes a blow land harder and wears off; the Doublesoul Draught calls a mirror of you that
# goes home again; the Brewer's Stand and the Moon Cauldron are placed, open as cauldrons of their own rank and keep their
# own tile numbers through a save (and a Blessing Stone is still a Blessing Stone); the new recipes come after all the
# old ones; a dead bush gives fibre too in the Wilds (and only sticks anywhere else, as it always did). Screenshots:
# drinking, the mirror beside you, the three cauldrons, the stand's work.
import asyncio, sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import shot
from harness import H, sheet

# a flat stone floor to stand, walk and fight on
FLOOR = """(() => { const p = G.p; window.GX = floor((p.x + 3) / T); window.GY = heights[GX];
  for (let x = GX - 14; x <= GX + 30; x++) { for (let y = GY - 9; y < GY; y++) setTile(x, y, AIR); for (let y = GY; y < GY + 3; y++) setTile(x, y, CUTSTONE); heights[x] = GY; } })()"""
HOME = "(() => { const p = G.p; p.x = p.px = GX * T + 1; p.y = p.py = GY * T - p.h; p.vx = p.vy = 0; p.face = 1; p.onGround = true; p.state = 'normal'; p.atk = null; p.hurtT = 0; p.consume = null; p.eatCd = 0; keys.KeyD = false; })();"
# the fastest you get walking right for a second and a half
WALK = "(() => { %s let top = 0; keys.KeyD = true; for (let k = 0; k < 90; k++) { tick(); top = max(top, G.p.vx); } keys.KeyD = false; return +top.toFixed(3); })()" % HOME
# one sword blow on a husk that only stands there, with the dice held still: what it took off
BLOW = """(() => { %s const R = Math.random; Math.random = () => .5; G.enemies.length = 0; G.hitstop = 0; G.slowT = 0;
  const p = G.p, e = spawnMob('husk', GX + 2, GY); e.hp = e.maxhp = 5000; p.x = p.px = e.x - 14; p.tempo = 0; p.hist = []; p.lastMove = null; p.chainT = 0; p.buf = null; p.inv = 1e9;
  mouse.wx = e.x + 3; mouse.wy = e.y + 8; mouse.x = (mouse.wx - G.rcx) * VS.s; mouse.y = (mouse.wy - G.rcy) * VS.s;
  for (let k = 0; k < 70; k++) { mouse.lp = k === 2; e.stun = 9999; e.vx = 0; if (G.hitstop > 0) { G.hitstop--; tickParts(); } else tick(); }
  mouse.lp = false; Math.random = R; const d = round(5000 - e.hp); e.dead = true; G.enemies.length = 0; return d; })()""" % HOME


async def main():
    h = await H().start(seed=4242, size=1); res = {}; ims = []; labels = []; bad = []
    def must(ok, what):
        if not ok: bad.append(what)
    await h.ev("SETTINGS.craft = 'simple'; G.cine = null; G.dialog = null; G.says.length = 0; G.sayCur = null; inv.fill(null); G.enemies.length = 0; G.spawnT = 1e9; G.p.inv = 1e9; G.food = 50;")
    await h.ev(FLOOR); await h.ev(HOME); await h.step(3, "")

    # ---- eating takes a moment ----
    r = await h.ev("""(() => { addItem('berries', 2); G.food = 50; const it = IT.berries; eat(it); const at0 = [countItem('berries'), G.food, !!G.p.consume, !!fighterPose(G.p, 0).consumeIcon];
      let n = 0; keys.KeyD = true; const x0 = G.p.x; while (G.p.consume && n < 200) { tick(); n++; } keys.KeyD = false;
      return { 'on the first bite: berries, food, eating, held to the mouth': at0, 'ticks to get it down': n, 'after: berries, food': [countItem('berries'), G.food], 'walked while eating (px)': +(G.p.x - x0).toFixed(1), 'pose afterwards': !!fighterPose(G.p, 0).consumeIcon }; })()""")
    res.update(r)
    must(r['on the first bite: berries, food, eating, held to the mouth'] == [2, 50, True, True], 'the first bite should not have fed you yet')
    must(r['ticks to get it down'] >= 20 and r['after: berries, food'][0] == 1 and r['after: berries, food'][1] > 50, 'a berry should go down after a moment')
    must(abs(r['walked while eating (px)']) < 6 and not r['pose afterwards'], 'eating should root you, and the pose should end')
    # ---- a blow interrupts it and you keep the food ----
    r = await h.ev("""(() => { %s G.food = 50; const p = G.p; eat(IT.berries); for (let k = 0; k < 8; k++) tick(); const mid = !!p.consume; p.inv = 0; hurtFighter(p, 1, p.x - 10, {}); p.inv = 1e9; tick(); tick();
      const out = [mid, !!p.consume, countItem('berries'), G.food, p.eatCd]; p.hp = p.maxhp; return out; })()""" % HOME)
    res['hit while eating: was eating, still eating, berries, food, wait'] = r
    must(r[0] is True and r[1] is False and r[2] == 1 and r[4] == 0, 'a blow should stop the meal and leave the food')
    must(r[3] <= 50, 'an interrupted meal should not feed you')
    # ---- a drink is slower than a bite; a cooked meal still gives its boon ----
    res['ticks: a berry, a tea, a brew'] = await h.ev("""(() => { const out = []; for (const id of ['berries', 'tea', 'swiftbrew']) { %s G.food = 20; addItem(id, 1); eat(IT[id]); out.push(G.p.consume ? G.p.consume.dur : 0); G.p.consume = null; G.p.eatCd = 0; removeItem(id, 1); } return out; })()""" % HOME)
    r = await h.ev("""(() => { %s G.food = 20; G.meal = null; addItem('egg_scramble', 1); eat(IT.egg_scramble); for (let k = 0; k < 90 && G.p.consume; k++) tick(); return [G.meal && G.meal.k, countItem('egg_scramble'), madeAt('egg_scramble').join('/')]; })()""" % HOME)
    res['a Willow Omelet: boon, left, made at'] = r
    must(r[0] == 'hearty' and r[1] == 0, 'the omelet should give HEARTY')
    await h.ev("G.meal = null; G.p.eatCd = 0;")

    # ---- the Quickstep brew ----
    v0 = await h.ev(WALK)
    await h.ev(HOME + "G.food = 20; addItem('swiftbrew', 1); eat(IT.swiftbrew);"); await h.step(20, "")
    ims.append(await h.pcrop(160, 90)); labels.append('drinking a brew')
    r = await h.ev("(() => { let n = 20; while (G.p.consume && n < 300) { tick(); n++; } return [n, G.brew && G.brew.k, G.brew && G.brew.t, brewMul('swift'), combatDmgMul(G.p), countItem('swiftbrew')]; })()")
    res['Quickstep: ticks to drink, brew, time left, walk x, blow x, left'] = r
    must(r[1] == 'swift' and r[3] == 1.28 and r[4] == 1 and r[5] == 0, 'the Quickstep brew should start')
    v1 = await h.ev(WALK)
    await h.ev("G.brew.t = 2;"); await h.step(3, "")
    v2 = await h.ev(WALK)
    res['top walking speed: before, with Quickstep, after it fades'] = [v0, v1, v2, await h.ev("[G.brew, brewMul('swift')]")]
    must(v1 > v0 * 1.2 and v2 == v0, 'Quickstep should quicken you, then fade')

    # ---- the Emberheart brew: a blow lands harder, then as before ----
    await h.ev("inv.fill(null); inv[0] = { id: 'steel_sword', n: 1 }; G.sel = 0; G.p.stam = 100;")
    d0 = await h.ev(BLOW); d0b = await h.ev(BLOW)
    await h.ev(HOME + "G.sel = 1; G.food = 20; addItem('mightbrew', 1); eat(IT.mightbrew); for (let k = 0; k < 120 && G.p.consume; k++) tick(); G.sel = 0;")
    m = await h.ev("[G.brew && G.brew.k, combatDmgMul(G.p), brewMul('swift')]")
    d1 = await h.ev(BLOW)
    await h.ev("G.brew.t = 2;"); await h.step(3, "")
    d2 = await h.ev(BLOW)
    res['Emberheart: brew, blow x, walk x'] = m
    res['one sword blow: plain, plain again, with Emberheart, after it fades'] = [d0, d0b, d1, d2, round(d1 / d0, 3) if d0 else None]
    must(m == ['might', 1.22, 1], 'the Emberheart brew should start')
    must(d0 > 0 and d0 == d0b and d2 == d0, 'a plain blow should be the same before and after the brew')
    must(d0 and 1.15 < d1 / d0 < 1.3, 'Emberheart should make the blow about 22% harder')
    res['no brew: what a brew adds to a blow, for you and for another'] = await h.ev("[combatDmgMul(G.p), combatDmgMul({})]")

    # ---- the Doublesoul Draught ----
    await h.ev(HOME + "G.enemies.length = 0; G.sel = 1; G.food = 20; addItem('mirrordraught', 2); eat(IT.mirrordraught); for (let k = 0; k < 150 && G.p.consume; k++) tick();")
    await h.step(30, "")
    r = await h.ev("""(() => { const c = G.fighters.find(f => f.isClone); if (!c) return null; const p = G.p; p.eatCd = 0; eat(IT.mirrordraught);
      return { name: c.name, team: c.team === p.team, hp: c.hp, 'blow x': c.dmgMul, 'time left': c.cloneT, 'draughts left': countItem('mirrordraught'), 'a second one refused': !p.consume, fighters: G.fighters.length }; })()""")
    res['the mirror'] = r
    must(r and r['team'] and r['a second one refused'] and r['draughts left'] == 1, 'the draught should call one mirror on your side')
    await h.ev("snapCam();"); await h.step(2, ""); ims.append(await h.pcrop(160, 90)); labels.append('the mirror beside you')
    # (with a husk in reach it stops repeating you and fights it with a mind of its own)
    r = await h.ev("""(() => { const c = G.fighters.find(f => f.isClone), p = G.p, e = spawnMob('husk', GX - 6, GY); e.hp = e.maxhp = 5000; p.x = p.px = (GX + 20) * T; c.x = c.px = e.x + 16; c.y = c.py = GY * T - c.h; c.inv = 1e9;
      for (let k = 0; k < 360; k++) { e.stun = 9999; e.vx = 0; if (G.hitstop > 0) { G.hitstop--; tickParts(); } else tick(); } const out = [round(5000 - e.hp), c.wid, c.dead]; e.dead = true; G.enemies.length = 0; return out; })()""")
    res['the mirror against a husk for six seconds: harm done, its weapon, fallen'] = r
    must(r[0] > 0 and not r[2], 'the mirror should fight what comes near')
    r = await h.ev("(() => { const c = G.fighters.find(f => f.isClone); c.cloneT = 2; for (let k = 0; k < 4; k++) tick(); return [G.fighters.some(f => f.isClone), G.fighters.length]; })()")
    res['when its time is up: still here, fighters'] = r
    must(r == [False, 1], 'the mirror should go home')
    r = await h.ev("""(() => { const p = G.p, d0 = G.deaths || 0; p.cloneCd = 0; spawnMirrorClone(); const c = G.fighters.find(f => f.isClone); killFighter(c, null); tick();
      const out = [G.fighters.some(f => f.isClone), (G.deaths || 0) - d0, p.cloneCd > 0]; p.cloneCd = 0; return out; })()""")
    res['a mirror struck down: still here, deaths counted, the glass must rest'] = r
    must(r == [False, 0, True], 'a fallen mirror is not your death')

    # ---- the two stations: placed, opened, their own rank of work, kept through a save ----
    here = "const p = G.p, tx = GX, ty = GY - 1;"
    r = json.loads(await h.ev("""(() => { %s inv.fill(null); const out = {};
      for (const [tile, item, dx] of [[CAULDRON, 'cauldron', 3], [BREW_STAND, 'brewstand', 5], [MOON_CAULDRON, 'moon_cauldron', 7]]) {
        addItem(item, 1); const placed = tryPlace(IT[item], tx + dx, ty); if (!placed) setTile(tx + dx, ty, tile); stnPlaced(tx + dx, ty, tile); openStation(tx + dx, ty); render(1);
        const L = stnList('pot', tile), ok = id => { const e = L.find(q => q.r.out === id); return e ? e.lvlOk : 'hidden'; };
        out[TP[tile].name] = { tile: tileAt(tx + dx, ty), 'placed by hand': !!placed, 'opens as': UI.open === 'stn' ? UI.stn.kind : UI.open, quickstep: ok('swiftbrew'), emberheart: ok('mightbrew'), doublesoul: ok('mirrordraught'), gives: TP[tile].drop, 'hits to break': MAT[tile].hp, light: !!TP[tile].light, drawn: !!STN_SPR[tile] }; closeUI(); }
      setTile(tx - 4, ty, OBELISK); out.stone = [tileAt(tx - 4, ty), TP[OBELISK].name, TP[SPIKES].name];
      out.made = ['brewstand', 'moon_cauldron', 'swiftbrew', 'mightbrew', 'mirrordraught'].map(id => id + ': ' + madeAt(id).join('/')).join(', ');
      out.numbers = [BREW_STAND, MOON_CAULDRON, OBELISK, SPIKES]; return JSON.stringify(out); })()""" % here))
    res['the stations'] = r
    must(r["Brewer's Stand"]['tile'] == 95 and r['Moon Cauldron']['tile'] == 96 and r['stone'][0] == 91, 'the stations should have their own tile numbers')
    must(all(r[k]['opens as'] == 'pot' and r[k]['drawn'] for k in ('Cauldron', "Brewer's Stand", 'Moon Cauldron')), 'all three should open as cauldrons')
    must([r['Cauldron']['emberheart'], r["Brewer's Stand"]['emberheart'], r['Moon Cauldron']['doublesoul']] == [False, True, True], 'each rank of cauldron should unlock its own brew')
    await h.ev("snapCam();"); await h.step(4, ""); ims.append(await h.pcrop(200, 90)); labels.append('cauldron, brewer\'s stand, moon cauldron')
    await h.ev("(() => { %s G.flags.seen1 = true; openStation(tx + 5, ty); })()" % here); await h.step(3, ""); (await h.shot()).save(shot('the_brewers_stand.png')); await h.ev("closeUI()")
    r = await h.ev("""(async () => { %s saveWorld(true); const id = WORLD.id, meta = JSON.parse(localStorage.getItem(profileKey('index'))).find(m => m.id === id);
      if (!meta) return 'no save'; quitToTitle(); await new Promise(r => setTimeout(r, 200)); await openWorld(meta); await new Promise(r => setTimeout(r, 500)); if (G.state === 'intro') beginPlay(false);
      return [tileAt(tx + 3, ty), tileAt(tx + 5, ty), tileAt(tx + 7, ty), tileAt(tx - 4, ty), TP[tileAt(tx + 5, ty)].name, TP[tileAt(tx - 4, ty)].name, G.brew, G.fighters.length]; })()""" % here)
    res['after a save and load: cauldron, stand, moon cauldron, stone'] = r
    must(r[:4] == [82, 95, 96, 91] and r[5] == 'Blessing Stone', 'tiles should come back from a save as what they were')

    # ---- the recipe list: the new work comes after all the old, and what goes into it exists ----
    r = await h.ev("""(() => { const ids = ['brewstand', 'moon_cauldron', 'swiftbrew', 'mightbrew', 'mirrordraught', 'egg_scramble'], at = ids.map(id => RECIPES.findIndex(r => r.out === id));
      return { 'recipes in all': RECIPES.length, 'the new ones are numbers': at, 'missing things': RECIPES.filter(r => ids.includes(r.out)).flatMap(r => Object.keys(r.need)).filter(k => !IT[k]),
        materials: ['egg', 'feather', 'antler', 'moonseed'].map(id => IT[id] ? IT[id].name : 'MISSING'), 'a dead bush gives': PLUCK[DEADBUSH].map(d => d[0]),
        'and in the Wilds': (() => { const a = WORLD.royale, b = BR.wild; WORLD.royale = true; BR.wild = true; const L = PLUCK[DEADBUSH].map(d => d[0]); WORLD.royale = a; BR.wild = b; return L; })() }; })()""")
    res['the recipe list'] = r
    # (a save knows a recipe by its number: the 549 recipes the game had before these must keep theirs)
    must(min(r['the new ones are numbers']) >= 549, 'the new recipes should come after the 549 old ones')
    must(not r['missing things'] and 'MISSING' not in r['materials'] and r['a dead bush gives'] == ['stick'] and r['and in the Wilds'] == ['stick', 'fiber'], 'the new materials should exist')

    sheet(ims, 3, shot('brews_and_eating.png'), labels, 1)
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:6])
    must(not [e for e in h.errs if 'agent-proxy' not in e], 'the page should report no errors')
    print('FAIL: ' + '; '.join(bad) if bad else 'all the essentials hold')
    await h.stop()
    if bad: sys.exit(1)
asyncio.run(main())
