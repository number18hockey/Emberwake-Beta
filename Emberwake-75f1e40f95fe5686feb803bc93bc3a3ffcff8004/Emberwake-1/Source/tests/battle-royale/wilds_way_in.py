# The way in to the Wilds and the way out: the WILDS button on the Trials' form, the Wilds' own form, BACK, the home page;
# a Trials match after a Wilds match in the same sitting; and the souls and coins a Trials match pays.
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import shot
from harness import H, sheet

# (a click where the game's own screen coordinates say a button is)
CLICK = "(([x, y]) => { const r = cv.getBoundingClientRect(); return [r.left + (x + 3) * VS.s * r.width / cv.width, r.top + (y + 3) * VS.s * r.height / cv.height]; })"
SAFE = "G.p.inv = 1e9; G.p.hp = 100;"


async def main():
    # (the Trials' form looks at the public board of open matches: keep the test off the real message boards)
    h = await H().start(mode='none', init="window.EW_BROKERS = ['ws://127.0.0.1:1/mqtt'];"); ok = []
    def check(name, v, extra=''):
        ok.append((name, bool(v))); print(('  ok   ' if v else '  FAIL ') + name, extra)
    async def click(js):
        x, y = await h.pg.evaluate(CLICK + "(" + js + ")"); await h.pg.mouse.move(x, y); await h.pg.wait_for_timeout(120); await h.pg.mouse.click(x, y); await h.pg.wait_for_timeout(200)
    await h.ev("localStorage.removeItem('ew2.br.' + accountId()); G.state = 'brform'; FORM.nick = 'TESTER'; 1"); await h.pg.wait_for_timeout(300)
    im1 = await h.shot()
    check('the Trials form is the Trials form', await h.ev("!BR.wild && G.state === 'brform'"))
    # the WILDS button sits at the end of the ARENA row
    await click("(() => { const uw = VS.uw, uh = VS.uh, w = min(360, uw - 16), x = round((uw - w) / 2), y = max(2, round((uh - 326) / 2)); return [x + 10 + 292, y + 134 + 18]; })()")
    im2 = await h.shot()
    check('WILDS opens the Wilds form', await h.ev("BR.wild && G.state === 'brform' && BR.menuTab === 'queue'"))
    await click("(() => { const uw = VS.uw, uh = VS.uh, h = min(380, uh - 12), w = min(440, uw - 16), x = round((uw - w) / 2), y = max(6, round((uh - h) / 2)); return [x + w - 70, y + h - 22]; })()")
    check('BACK returns to the Trials form', await h.ev("!BR.wild && G.state === 'brform'"))
    await h.ev("BR.wild = true; 1"); await h.pg.keyboard.press('Escape'); await h.pg.wait_for_timeout(200)
    check('the home page leaves the Wilds behind', await h.ev("!BR.wild && G.state === 'title'"))

    # a match in the Wilds, then one in the Trials
    await h.ev("G.nick = 'TESTER'; G.skin = 0; SETTINGS.diff = 'normal'; wBrSolo(); G.manual = true;"); await h.step(400, SAFE)
    w = await h.ev("[BR.wild, wildOn(), G.fighters.length, hotN(), WW]")
    check('a Wilds match: thirty-two Wakers, ten slots, the long island', w == [True, True, 32, 10, 3500], str(w))
    await h.ev("brLeave(); 1")
    check('leaving it leaves the Wilds', await h.ev("!BR.wild && !BR.on && G.state === 'title'"))
    await h.ev("brSolo(1); G.manual = true;"); await h.step(700, SAFE)
    t = await h.ev("[BR.wild, wildOn(), G.fighters.length, hotN(), WW, BR.phase, Array.isArray(BR.perks)]")
    check('then a Trials match is a Trials match', t == [False, False, 12, 6, 800, 'fight', True], str(t))
    # what the Trials pay: a soul a takedown, a hundred coins a win
    before = await h.ev("(() => { const p = brProfile(); return [p.souls, p.coins, p.wins, p.matches]; })()")
    n = await h.ev("(() => { let n = 0; for (const f of [...BR.bots.values()]) if (!f.dead) { f.hp = 0; killFighter(f, G.p); n++; } return n; })()")
    for _ in range(40):
        if await h.ev("BR.phase") == 'over': break
        await h.step(30, SAFE)
    im3 = await h.shot()
    after = await h.ev("(() => { const p = brProfile(); return [p.souls, p.coins, p.wins, p.matches]; })()")
    check('the Trials pay a soul for each takedown', after[0] - before[0] == n and n == 11, '%s -> %s (%d taken down)' % (before, after, n))
    check('and a win pays a hundred coins, once', await h.ev("BR.phase === 'over' && BR.winMe") and after[1] - before[1] == 100 and after[2] - before[2] == 1 and after[3] - before[3] == 1, str(after))
    await h.step(200, SAFE)
    again = await h.ev("(() => { const p = brProfile(); return [p.souls, p.coins, p.wins, p.matches]; })()")
    check('nothing is paid twice', again == after, str(again))
    check('the Trials still keep their own record', await h.ev("trCareer().w >= 1 && trCareer().k >= 11"))
    await h.ev("brLeave(); G.manual = false; 1"); await h.pg.wait_for_timeout(200)
    sheet([im1, im2, im3], 3, shot('wilds_way_in.png'), ['the Trials form, with WILDS', 'the Wilds form', 'a Trials win'], .5)
    errs = [e for e in h.errs if 'PAGEERROR' in e]; print('errors:', errs[:6])
    bad = [n for n, v in ok if not v]; print('ALL PASS' if not bad and not errs else 'FAILED: %d' % (len(bad) + len(errs)))
    await h.stop()
asyncio.run(main())
