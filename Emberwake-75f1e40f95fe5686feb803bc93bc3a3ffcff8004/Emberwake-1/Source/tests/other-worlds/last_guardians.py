# The three new guardians and the Hollow: each is called with its offering at its altar (the Hollow at the Cold
# Hearth with the Dawnring), fought for a while, pushed through its phases, put down; what it leaves is checked,
# and the Hollow's fall lights the ring and shows the ending.
import asyncio, sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(seed=31337, size=1); ok = True; ims = []; labels = []
    def check(name, cond, info=''):
        nonlocal ok; ok = ok and bool(cond); print(('PASS ' if cond else 'FAIL ') + name, info)
    for d, boss, offer in [(4, 'winterstag', 'rime_offering'), (5, 'horologist', 'hour_offering'), (6, 'stormwright', 'storm_offering'), (7, 'hollowking', 'ember_offering')]:
        await h.ev("G.flags.dim%d = true; G.spawnT = 1e9; G.devT = 1e9; enterDim(%d, true); G.state = 'play'; G.cine = null; G.says.length = 0; G.sayCur = null;" % (d, d))
        await h.goto(await h.ev("DARENA_X - 12")); await h.step(3)
        await h.ev("addItem('%s', 1); addItem('dawnring', 1); G.p.inv = 0; G.p.hp = G.p.maxhp = 400;" % offer)
        await h.ev("(%s)()" % ("hearthAct" if d == 7 else "altarAct"))
        b = await h.ev("G.boss ? [G.boss.type, G.boss.maxhp] : null")
        check('%s answers its offering' % boss, b and b[0] == boss, b)
        if not b: continue
        # a while of fighting: the player keeps getting healed, so we see every attack
        took = 0
        for k in range(16):
            hp0 = await h.ev("G.p.hp"); await h.step(40, "G.p.hp = max(G.p.hp, 200); G.p.dead = false;"); took += max(0, hp0 - await h.ev("G.p.hp"))
            if k == 6: ims.append(await h.shot()); labels.append(boss + ' fighting')
        states = await h.ev("G.boss ? G.boss.state : 'gone'")
        check('%s fights (it hurt the player %d)' % (boss, took), took > 0 or boss == 'hollowking', states)
        # push it through its phases to near death; it rages under a third
        for f in (.6, .45, .25):
            await h.ev("(() => { const b = G.boss; if (!b) return; b.hp = round(b.maxhp * %s); })()" % f); await h.step(120, "G.p.hp = max(G.p.hp, 200); G.p.dead = false;")
        rage = await h.ev("G.boss ? !!G.boss.rage : null"); check('%s rages near the end' % boss, rage is True, rage)
        if boss == 'horologist': check('the Horologist turned the hour back', await h.ev("!!(G.boss && G.boss.rw1 && G.boss.rw2)"))
        if boss == 'hollowking': check('the Hollow went through the dark and the last cold', await h.ev("G.boss && G.boss.P === 3"))
        ims.append(await h.shot()); labels.append(boss + ' raging')
        # down
        await h.ev("(() => { const b = G.boss; if (b) killEnemy(b); })()"); await h.step(200, "G.p.hp = max(G.p.hp, 200); G.p.dead = false;")
        flag = {'winterstag': 'stagDead', 'horologist': 'horologistDead', 'stormwright': 'stormwrightDead', 'hollowking': 'hollowDead'}[boss]
        check('%s is down' % boss, await h.ev("!!G.flags.%s && !G.boss" % flag))
        drops = await h.ev("JSON.stringify(G.drops.map(q => q.id).concat(inv.filter(Boolean).map(q => q.id)))")
        want = {'winterstag': 'frag_rime', 'horologist': 'frag_hour', 'stormwright': 'frag_storm', 'hollowking': 'dawn_heart'}[boss]
        check('%s leaves %s' % (boss, want), want in drops, drops[:200])
    # the ring is lit, and the ending shows
    await h.step(200); lit = await h.ev("!!G.flags.dawnLit"); check('the Hollow\'s fall lights the ring', lit)
    await h.pg.wait_for_timeout(2800); await h.step(10)
    endui = await h.ev("UI.open"); check('the ending shows', endui == 'ending', endui)
    for k in range(5): await h.step(80)
    ims.append(await h.shot()); labels.append('the ending')
    await h.ev("closeUI(); enterDim(0, true); G.state = 'play'; G.clock = .25; updateSun();"); await h.step(4)
    ims.append(await h.shot()); labels.append('the ring, whole')
    sheet([im.resize((480, 270)) for im in ims], 3, shot('last_guardians.png'), labels)
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:8])
    await h.stop(); print('ALL PASS' if ok else 'SOME FAILED')
asyncio.run(main())
