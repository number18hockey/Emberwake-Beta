# The Ashfall Trials alone with the echoes: the plinths, the horn, scavenging, hunger, the forge,
# the nights and their Hollow Ones, the supply drops, the feast, and a whole match played to its end.
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet

SAFE = "G.p.inv = 1e9; G.p.hp = max(G.p.hp, 60);"
# keep the tester out of the ashfall while it only watches
KEEP = SAFE + "const z = BR.storm; if (z && z.dps > 0) { const m = (z.L + z.R) / 2; if (G.p.x < z.L + 20 || G.p.x > z.R - 20) { G.p.x = G.p.px = m; let n = 0; while (boxHits(G.p.x, G.p.y, G.p.w, G.p.h) && n++ < 80) G.p.y = G.p.py = G.p.y - T; } }"
PUT = "(() => { const p = G.p; p.x = p.px = %d * T - 6; p.y = p.py = (%d + 1) * T - p.h; p.vx = p.vy = 0; })()"


async def main():
    h = await H().start(mode='none')
    ok = []
    await h.ev("G.nick = 'TESTER'; G.skin = 0; SETTINGS.diff = 'normal'; brSolo(1); G.manual = true;")
    info = await h.ev("({ chests: BR.chests.filter(c => !c.kind).length, bushes: BR.chests.filter(c => c.kind === 'bush').length, feast: BR.chests.filter(c => c.feast).length, drops: BR.drops.map(d => d.x + '@' + Math.round((d.at - BR_DROP) / 60) + 's'), pois: BR.pois.map(q => q.name + '@' + q.x).join(' '), anvils: BR.anvils.length, fighters: G.fighters.length, phase: BR.phase, held: G.p.onBarge, w: WW, peds: BR.peds, hearth: BR.hearth })")
    print('island:', info)
    ok.append(('a wide island with a Hearth, camps, bushes and two planned drops', info['w'] == 800 and info['bushes'] >= 12 and info['feast'] == 2 and len(info['drops']) == 2 and info['anvils'] >= 3 and 'THE HEARTH' in info['pois']))
    ok.append(('twelve fighters, each on a plinth', info['fighters'] == 12 and len(info['peds']) == 12 and info['held']))
    ims, labels = [], []
    await h.step(120, "")
    ims.append(await h.shot()); labels.append('on the plinths, the count running')
    spread = await h.ev("(() => { const xs = G.fighters.map(f => Math.round(f.x / T)); return [new Set(xs).size, G.fighters.every(f => f.onGround && f.noHit)]; })()")
    ok.append(('everyone stands on a plinth of their own, safe until the horn', spread[0] == 12 and spread[1]))
    await h.step(1, "pressed.Space = true; keys.KeyD = true;"); x0 = await h.ev("G.p.x"); await h.step(30, "keys.KeyD = true;")
    ok.append(('nobody can move before the horn', abs(await h.ev("G.p.x") - x0) < 1))
    await h.ev("keys.KeyD = false; 1")
    await h.step(500, "")
    ok.append(('the horn frees everyone', await h.ev("BR.phase === 'fight' && !G.p.onBarge && G.fighters.every(f => !f.onBarge)")))
    ims.append(await h.shot()); labels.append('the horn: some rush the Hearth, some run')

    # ---- scavenging: a bush, a chest, hunger ----
    await h.ev(SAFE)
    # (a bush no echo is standing by: they go for what they can reach now, and one may strip the nearest bush first)
    b = await h.ev("(() => { const free = c => c.kind === 'bush' && !c.open, far = c => !G.fighters.some(f => f !== G.p && !f.dead && Math.abs(f.x - c.x * T) < 200); const c = BR.chests.find(c => free(c) && far(c)) || BR.chests.find(free); return [c.i, c.x, c.y]; })()")
    await h.ev(PUT % (b[1], b[2])); await h.step(10, SAFE); await h.step(1, SAFE + "pressed.KeyF = true;"); await h.step(80, SAFE)
    berries = await h.ev("countItem('br_berries')")
    ok.append(('a bush gives berries', berries >= 2 and await h.ev("BR.chests[%d].open" % b[0])))
    await h.ev("G.food = 30; G.sel = inv.findIndex(s => s && s.id === 'br_berries'); 1")
    await h.step(1, SAFE + "mouse.lp = true;"); await h.step(60, SAFE + "mouse.lp = false;")
    ok.append(('eating berries eases hunger', await h.ev("G.food") > 40))
    f0 = await h.ev("G.food = 50, G.food"); await h.step(600, SAFE)
    ok.append(('hunger grows as the match goes on', await h.ev("G.food") < f0 - 2))
    for _ in range(3):   # (what spills from a chest can roll away before it is picked up: three chests make sure of a weapon)
        c = await h.ev("(() => { let b = null, bd = 1e9; for (const c of BR.chests) { if (c.open || c.cave || c.kind || c.feast || c.high) continue; const d = abs(c.x * T - G.p.x); if (d < bd) { bd = d; b = c; } } return [b.i, b.x, b.y]; })()")
        await h.ev(PUT % (c[1], c[2])); await h.step(10, SAFE); await h.step(1, SAFE + "pressed.KeyF = true;"); await h.step(160, SAFE)
        if await h.ev("inv.some(s => s && IT[s.id].type === 'weapon')"): break
    print('pack after a chest:', await h.ev("inv.filter(Boolean).map(s => s.id + 'x' + s.n).join(' ')"))
    ok.append(('a chest gives a weapon', await h.ev("inv.some(s => s && IT[s.id].type === 'weapon')")))
    # ---- the feast chests are sealed for now ----
    fc = await h.ev("(() => { const c = BR.chests.find(c => c.feast); return [c.i, c.x, c.y]; })()")
    await h.ev(PUT % (fc[1], fc[2])); await h.step(10, SAFE); await h.step(1, SAFE + "pressed.KeyF = true;"); await h.step(5, SAFE)
    ok.append(('the feast chests are sealed before the feast', await h.ev("!BR.chests[%d].open && trSealed(BR.chests[%d])" % (fc[0], fc[0]))))
    ims.append(await h.shot()); labels.append('the Hearth: sealed feast chests')
    # ---- the forge ----
    a = await h.ev("[BR.anvils[0].x, BR.anvils[0].y]")
    await h.ev("inv.fill(null); inv[0] = { id: brPool()[0].find(id => IT[id].set === 'sword') || brPool()[0][0], n: 1 }; inv[1] = { id: 'br_scrap', n: 6 }; G.sel = 0; 1")
    w0 = await h.ev("inv[0].id"); await h.ev(PUT % (a[0], a[1])); await h.step(10, SAFE)
    for _ in range(4):   # (a camp has a chest and bushes by its anvil: F takes the nearest thing first)
        await h.ev("G.sel = 0; 1"); await h.step(1, SAFE + "pressed.KeyF = true;"); await h.step(12, SAFE)
        if await h.ev("inv[0] && inv[0].id") != w0: break
    w1 = await h.ev("inv[0].id")
    print('reforged', w0, '->', w1, 'scrap left', await h.ev("countItem('br_scrap')"))
    ok.append(('scrap at a camp anvil reforges the weapon in hand into a better one', w1 != w0 and await h.ev("brTier('%s') > brTier('%s') && IT['%s'].set === IT['%s'].set" % (w1, w0, w1, w0))))
    ims.append(await h.shot()); labels.append('a camp: fire, anvil, bushes')
    # ---- favor ----
    await h.ev("BR.favor = 96; brFavor(10); 1"); await h.step(260, SAFE)
    ok.append(('a full favor bar brings a sponsor gift down', await h.ev("BR.favor < 20") and await h.ev("G.drops.length + inv.filter(Boolean).length") >= 3))

    # ---- now watch the echoes play the whole match (the tester cannot be hurt and stays out of the ashfall) ----
    stats, seen = [], {'hunters': 0, 'night': False, 'drop': False, 'feast': False}
    for k in range(260):
        await h.step(300, KEEP)
        st = await h.ev("[Math.round(trSec()), BR.phase, BR.lastAlive, trClock().day + (trClock().night ? 'N' : 'D'), [...BR.bots.values()].filter(f => f.hunter && !f.dead).length, BR.chests.filter(c => c.open && !c.kind).length, BR.chests.filter(c => c.feast && c.open).length, BR.chests.filter(c => c.kind === 'drop' && c.open).length, Math.round(G.food)]")
        stats.append(st)
        seen['hunters'] = max(seen['hunters'], st[4]); seen['night'] = seen['night'] or st[3].endswith('N'); seen['feast'] = seen['feast'] or st[6] > 0; seen['drop'] = seen['drop'] or st[7] > 0
        if st[3] == '1N' and len(ims) == 5: ims.append(await h.shot()); labels.append('the first night')
        if st[0] >= 385 and len(ims) == 6: ims.append(await h.shot()); labels.append('after the feast opened (%ds, %d left)' % (st[0], st[2]))
        if st[1] == 'over': break
        # with one echo left the tester stops hiding, so the match can end
        if st[2] <= 2 and st[0] > 500: await h.ev("G.p.inv = 0; G.p.hp = 0; killFighter(G.p, null); 1")
    for s in stats[::8]: print(s)
    print('last', stats[-1])
    end = stats[-1]
    ok.append(('night fell and Hollow Ones walked', seen['night'] and seen['hunters'] >= 2))
    ok.append(('a match runs for many minutes and ends with a winner', end[1] == 'over' and 300 <= end[0] <= 900))
    print('winner:', await h.ev("BR.winner"), 'after', end[0], 's;  feast opened by an echo:', seen['feast'], ' drop opened:', seen['drop'])
    print('feed', await h.ev("G.kfeed.map(k => (k.a||'') + '>' + k.b + (k.txt ? ' ' + k.txt : '')).join(' | ')"))
    await h.ev("BR.mapOpen = true;"); await h.step(2, ""); ims.append(await h.shot()); labels.append('map [M]'); await h.ev("BR.mapOpen = false;")
    sheet(ims, 2, shot('royale_solo.png'), labels, .5)
    errs = [e for e in h.errs if 'agent-proxy' not in e and 'PAGEERROR' in e]
    for n, v in ok: print(('  ok   ' if v else '  FAIL ') + n)
    print('errors:', errs[:8])
    await h.stop()
    bad = [n for n, v in ok if not v]
    print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
asyncio.run(main())
