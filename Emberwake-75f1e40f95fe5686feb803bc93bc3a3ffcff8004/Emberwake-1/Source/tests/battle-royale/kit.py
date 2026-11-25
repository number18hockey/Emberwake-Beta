# The Trials' own kit: perks (picked on the plinth and at dawn), amps fitted to weapons, and relics.
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet

SAFE = "G.p.inv = 1e9; G.p.hp = max(G.p.hp, 60);"
# an echo that stands still next to the tester, as a target
FOE = """(() => { const p = G.p; for (const f of G.fighters) if (f !== p) f.noHit = true; const f = [...BR.bots.values()].find(f => !f.dead && !f.hunter && f.team !== p.team);
  f.noHit = false; f.hp = f.maxhp = 100000; f.ward = 0; f.ai = null; f.inv = 0; f.iDodge = 0; f.spawnT = 0; f.x = f.px = p.x + %d; f.y = f.py = p.y; f.vx = f.vy = 0; f.face = %d; f.st = null; window.FOE = f; return f.name; })()"""
AIM = "(() => { const e = FOE; mouse.wx = e.x + 3; mouse.wy = e.y + 8; e.x = e.px = G.p.x + (window.GAP || 20); e.vx = 0; e.hurtT = 0; e.inv = 0; e.taken = 0; })();"
BEAT = "(() => { const p = G.p, a = p.atk; if (!a && p.state === 'normal' && !(p.chainT > 0)) mouse.lp = true; else if (a && a.phase === 2 && a.pt === beatOpen(a) + 1) mouse.lp = true; })();"


async def main():
    h = await H().start(mode='none'); ok = []
    def check(name, v, extra=''):
        ok.append((name, bool(v))); print(('  ok   ' if v else '  FAIL ') + name, extra)
    await h.ev("G.nick = 'TESTER'; G.skin = 0; SETTINGS.diff = 'normal'; brSolo(1); G.manual = true;")
    await h.step(30, "")
    o = await h.ev("BR.offer && BR.offer.ids")
    check('three perks are offered on the plinth', o and len(o) == 3 and len(set(o)) == 3, str(o))
    im1 = await h.shot()
    await h.ev("BR.offer.ids = ['fleet', 'wind', 'scav']; 1"); await h.step(1, "pressed.KeyZ = true;"); await h.step(2, "")
    check('Z takes the first: FLEET', await h.ev("BR.perks.join() === 'fleet' && !BR.offer && G.p.spd === 1.1"))
    check('every echo holds a perk of its own', await h.ev("[...BR.bots.values()].every(f => f.perks && f.perks.length === 1)"))
    await h.step(620, "")
    check('the horn', await h.ev("BR.phase === 'fight'"))
    await h.ev(SAFE)
    # FLEET: a tenth faster over the same stretch
    async def run(spd):
        await h.ev("(() => { const p = G.p; p.spd = %s; p.x = p.px = (BR.hearth - 20) * T; p.y = p.py = (BR.hearthY - 1) * T - p.h; p.vx = 0; })()" % spd)
        x0 = await h.ev("G.p.x"); await h.step(60, SAFE + "keys.KeyD = true;"); x1 = await h.ev("G.p.x"); await h.ev("keys.KeyD = false; 1"); return x1 - x0
    slow, fast = await run(1), await run(1.1)
    check('FLEET runs a tenth further in a second', 1.06 < fast / slow < 1.14, '%.1f %.1f' % (slow, fast))
    # SECOND WIND
    await h.ev("BR.perks.push('wind'); G.p.inv = 0; G.p.hp = 10; hurtFighter(G.p, 50, G.p.x + 20, { pvp: true }); 1")
    check('SECOND WIND: a killing blow leaves you at 1 health, once', await h.ev("!G.p.dead && G.p.hp === 1 && BR.windUsed"))
    await h.ev("G.p.hp = 100; 1")
    # ---- amps ----
    await h.ev("inv.fill(null); inv[0] = { id: brPool()[2].find(id => IT[id].set === 'sword'), n: 1 }; inv[1] = { id: 'amp_sear', n: 1 }; inv[2] = { id: 'amp_reach', n: 1 }; inv[3] = { id: 'amp_leech', n: 1 }; G.sel = 0; G.lastWeapon = 0; G.hitstop = 0; 1")
    await h.step(2, SAFE + "G.hitstop = 0;")
    for slot in (1, 2, 3):
        await h.ev("G.sel = %d; 1" % slot); await h.step(1, SAFE + "mouse.lp = true;"); await h.step(2, SAFE + "mouse.lp = false;")
    a = await h.ev("[inv[0].amps, inv[1], inv[2], inv[3] && inv[3].id]")
    check('two amps fit a weapon; the third stays in the pack', a[0] == ['sear', 'reach'] and a[1] is None and a[2] is None and a[3] == 'amp_leech', str(a))
    name = await h.ev(FOE % (20, -1)); await h.ev("G.sel = 0; window.GAP = 20; 1")
    await h.ev("window.SEARED = 0; 1")
    for _ in range(12): await h.step(10, SAFE + AIM + "mouse.lp = false; if (FOE.st && FOE.st.burn > 0) window.SEARED = 1;" + BEAT)   # (alight at any moment of the exchange: the fire may have burnt out by the end)
    check('SEAR: blows in time set an echo alight', await h.ev("!!window.SEARED"), name)
    # REACH: a blow that falls short without it lands with it
    async def reach(amps, gap):
        await h.ev("inv[0].amps = %s; window.GAP = %d; FOE.hp = 100000; FOE.st = null; G.p.atk = null; G.p.state = 'normal'; G.p.chainT = 0; G.p.lastMove = null; G.p.hist = []; G.hitstop = 0; 1" % (amps, gap)); await h.step(30, SAFE + AIM + "mouse.lp = false; G.hitstop = 0;")
        await h.step(1, SAFE + AIM + "mouse.lp = true;"); await h.step(24, SAFE + AIM + "mouse.lp = false;"); return 100000 - await h.ev("FOE.hp")
    L = await h.ev("(ARM + IT[inv[0].id].len) * 1")
    # blow by blow at each distance, with and without: somewhere the plain blade falls short and the amped one lands (same form both times)
    await h.ev("window.NH = 0; if (!window.HF0) { window.HF0 = hurtFighter; hurtFighter = function (f, dmg, x, o) { if (f === FOE && o && o.by === G.p) NH++; return HF0.apply(this, arguments); }; } 1")   # (only the tester's own blows count: other echoes wander by and take a swing at this one)
    LEVEL = "FOE.y = FOE.py = G.p.y;"   # (keep the echo level with the tester, so the aim, and with it the form, stays the same)
    async def blow(amps, gap):
        await h.ev("inv[0].amps = %s; window.GAP = %d; NH = 0; FOE.hp = 100000; FOE.st = null; G.p.atk = null; G.p.state = 'normal'; G.p.chainT = 0; G.p.lastMove = null; G.p.hist = []; G.p.buf = null; G.p.tempo = 0; G.p.vy = 0; G.hitstop = 0; 1" % (amps, gap)); await h.step(16, SAFE + LEVEL + AIM + "mouse.lp = false; G.hitstop = 0;")
        await h.step(1, SAFE + LEVEL + AIM + "mouse.lp = true;"); mv = await h.ev("G.p.atk ? G.p.atk.id : ''"); await h.step(26, SAFE + LEVEL + AIM + "mouse.lp = false; G.hitstop = 0;")
        return mv, await h.ev("NH") > 0
    won = lost = 0; seen = []
    for gap in range(int(L + 2), int(L + 14)):
        (m0, h0), (m1, h1) = await blow('[]', gap), await blow("['reach']", gap)
        if m0 != m1 or not m0: continue
        seen.append('%d%s%s' % (gap, '*' if h0 else '.', '*' if h1 else '.')); won += (not h0) and h1; lost += h0 and not h1
    rm = await h.ev("(() => { const a = { W: IT[inv[0].id], f: G.p, amps: ['reach'], tm: 1 }; trAmpStart(a); const b = { W: IT[inv[0].id], f: G.p, amps: [], tm: 1 }; trAmpStart(b); return [a.rm, b.rm || 1]; })()")
    check('REACH: a sixth more reach', rm[0] > 1.15 and rm[1] == 1 and won >= 1 and lost == 0, 'distance, plain, amped: %s (reach x%s)' % (' '.join(seen), rm[0]))
    im2 = await h.pcrop(150, 90)
    # a weapon keeps its amps when dropped and picked up again
    await h.ev("inv[0].amps = ['sear', 'reach']; const s = inv[0]; inv[0] = null; spawnDrop(s.id, 1, G.p.x + 3, G.p.y, 0, -1, s.amps); 1"); await h.step(120, SAFE)
    check('a dropped weapon keeps its amps', await h.ev("(inv.find(s => s && s.amps) || {}).amps + '' === 'sear,reach'"))
    # ---- relics ----
    rel = await h.ev("trRelicIds().map(id => id + ':' + IT[id].name + ':' + IT[id].amps0.join('+'))")
    print('  relics:', rel)
    check('six relics, each with two amps forged in', len(rel) == 6)
    await h.ev("inv.fill(null); inv[0] = { id: 'rel_sword', n: 1 }; inv[1] = { id: 'amp_venom', n: 1 }; G.sel = 0; G.lastWeapon = 0; 1"); await h.step(2, SAFE)
    await h.ev("G.sel = 1; 1"); await h.step(1, SAFE + "mouse.lp = true;"); await h.step(2, SAFE + "mouse.lp = false;")
    check('a relic takes no more amps', await h.ev("!inv[0].amps && inv[1] && inv[1].id === 'amp_venom'"))
    check('relics are not in ordinary chests', await h.ev("brPool().every(p => p.every(id => !IT[id].relic))"))
    feast = await h.ev("trLoot({ feast: true }).map(e => e[0]).join(',')")
    check('the feast holds a relic and an amp', 'rel_' in feast and 'amp_' in feast, feast)
    # ---- dawn brings another perk ----
    await h.ev("BR.t = trTickAt(TR_DAY) - 10; 1"); await h.step(60, SAFE); await h.ev("BR.t = trTickAt(TR_CYC) - 10; 1"); await h.step(60, SAFE)
    o2 = await h.ev("BR.offer && BR.offer.ids")
    check('dawn offers another perk, never one you hold', o2 and len(o2) == 3 and 'fleet' not in o2 and 'wind' not in o2, str(o2))
    im3 = await h.shot()
    await h.step(1, SAFE + "pressed.KeyV = true;"); await h.step(2, SAFE)
    check('V takes the third', await h.ev("BR.perks.length === 3 && !BR.offer"), str(await h.ev("BR.perks")))
    # ---- the end of a match: a title and a record ----
    await h.ev("localStorage.removeItem('ew_trials'); BR.st.saved = false; for (const f of [...BR.bots.values()]) if (!f.dead) { f.noHit = false; f.hp = 0; killFighter(f, G.p); } 1"); await h.step(120, SAFE)
    t = await h.ev("[BR.phase, BR.winMe, trTitle()[0], JSON.stringify(trCareer())]")
    check('the match ends with a title and a record kept on this computer', t[0] == 'over' and t[1] and t[2] and '"w":1' in t[3], str(t))
    await h.step(40, SAFE); im4 = await h.shot()
    sheet([im1, im3, im4], 3, shot('royale_kit.png'), ['perks on the plinth', 'a perk at dawn', 'the end: a title'], .5); im2.save(shot('royale_amps.png'))
    errs = [e for e in h.errs if 'PAGEERROR' in e]; print('errors:', errs[:6])
    bad = [n for n, v in ok if not v]; print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
    await h.stop()
asyncio.run(main())
