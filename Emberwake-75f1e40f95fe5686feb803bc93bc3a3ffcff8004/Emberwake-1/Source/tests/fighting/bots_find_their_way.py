# Fighters the computer runs find a real way to where they are going (game/07-fighters/2-nav.js): over walls, across pits,
# up and down rope bridges, round what is too tall, never into a pool they could not climb out of, never through fire.
# Each course is built in the Cinder Ring and run twice: by the route finder, and by the old straight-line steering alone.
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H

SETUP = r"""void (() => {
  const FY = 60; window.FY = FY;
  // a clean course: open air above a brick floor
  window.clearCourse = () => { for (let x = 4; x <= 145; x++) { for (let y = 8; y < FY; y++) tiles[y * WW + x] = AIR; for (let y = FY; y < WH - 3; y++) tiles[y * WW + x] = BRICK; } VENTS.length = 0; };
  window.box = (x0, x1, y0, y1, t) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) tiles[y * WW + x] = t; };
  const mk = (tx, row) => { const f = newFighter(tx * T + 1, (row === undefined ? FY : row) * T - 20, { team: 'x', wid: 'sword', name: 'B', botI: 0, ai: newBrain(.5), br: { lx: 0, stuck: 0, chest: null, roam: null, skip: new Set() } }); f.onGround = true; return f; };
  window.mkBot = mk;
  // one fighter sent to stand at tile (gx, row gy is the ground it should stand on); how = 'route' or 'old'
  window.send = (build, sx, srow, gxT, grow, how, maxT = 900) => {
    clearCourse(); build(); const f = mk(sx, srow), I = f.ai.I, gx = gxT * T + 4, gy = grow * T, hp0 = f.hp; let wet = 0, said = 'go', t = 0, gave = false;
    f.br.chest = { x: gxT, y: grow - 1, i: 0 };
    for (let k = 0; k < 10; k++) tickFighter(f, I);
    for (t = 0; t < maxT; t++) {
      G.time++; I.jumpP = false; if (f.ai.jumpCd > 0) f.ai.jumpCd--; const cx = f.x + 3;
      if (how === 'route') said = navTo(f, I, gx, gy, null);
      else {
        // the steering as it was, with the jump an echo used to try under a chest it could not reach
        brSteer(f, I, gx); const dyc = gy - (f.y + f.h);
        if (abs(gx - cx) < 10 && dyc < -10) { if (f.onGround && f.ai.jumpCd <= 0) { I.jumpP = I.jumpH = true; f.ai.jumpCd = 24; } else if (!f.onGround) { I.jumpH = true; if (f.vy > -.4 && !f.dblUsed) I.jumpP = true; } }
        if (!f.br.chest) gave = true;
      }
      if (said === 'stuck') break;
      tickFighter(f, I); if (liqAt(f.x + 3, f.y + f.h - 5) === 1) wet++;
      if (f.dead) break;
      if (f.onGround && abs(f.x + 3 - gx) < 8 && abs(f.y + f.h - gy) < 3) return { got: true, t, wet, hurt: hp0 - f.hp, x: round(f.x / T), row: round((f.y + f.h) / T) };
    }
    return { got: false, t, wet, hurt: round(hp0 - f.hp), refused: said === 'stuck', gave, dead: f.dead, x: round(f.x / T), row: round((f.y + f.h) / T) };
  };
  window.COURSES = {
    'a wall four tiles high': [() => box(40, 42, FY - 4, FY - 1, BRICK), 20, FY, 60, FY],
    'a wall seven tiles high (wants the second jump)': [() => box(40, 42, FY - 7, FY - 1, BRICK), 20, FY, 60, FY],
    'a gap four tiles wide and fourteen deep': [() => { box(4, 39, FY - 14, FY - 1, BRICK); box(44, 100, FY - 14, FY - 1, BRICK); }, 20, FY - 14, 60, FY - 14],
    'up a stair of rope bridges to a ledge twelve tiles up': [() => { box(40, 44, FY - 4, FY - 4, PLATFORM); box(47, 51, FY - 8, FY - 8, PLATFORM); box(54, 58, FY - 12, FY - 12, BRICK); }, 20, FY, 56, FY - 12],
    'down through two rope bridges': [() => { box(30, 50, FY - 10, FY - 10, PLATFORM); box(30, 50, FY - 5, FY - 5, PLATFORM); }, 40, FY - 10, 42, FY],
    'a wall too tall to jump, with a way round behind': [() => { box(40, 41, FY - 12, FY - 1, BRICK); box(28, 32, FY - 5, FY - 5, PLATFORM); box(33, 37, FY - 9, FY - 9, PLATFORM); }, 37, FY, 60, FY],
    'a pool with steep sides (leap it, stay dry)': [() => { box(40, 45, FY, FY + 5, AIR); box(40, 45, FY + 3, FY + 5, WATER); }, 20, FY, 60, FY],
    'a pool with a low bank (swim it)': [() => { box(40, 55, FY, FY + 4, AIR); box(40, 55, FY + 1, FY + 4, WATER); }, 20, FY, 70, FY],
    'slag with a rope bridge over it': [() => { box(40, 53, FY, FY + 1, CINDER); box(37, 56, FY - 4, FY - 4, PLATFORM); }, 20, FY, 70, FY],
  };
  window.REFUSE = {
    'a pool too wide to leap, too steep to leave': [() => { box(40, 55, FY, FY + 6, AIR); box(40, 55, FY + 3, FY + 6, WATER); }, 20, FY, 70, FY],
    'slag from wall to wall': [() => { box(40, 53, FY, FY + 1, CINDER); }, 20, FY, 70, FY],
    'a wall too tall, and no way round': [() => box(40, 41, FY - 12, FY - 1, BRICK), 20, FY, 60, FY],
  };
  // twelve at once on one busy course: what the route finder costs in each tick, and that it never searches twice in one
  window.crowd = () => {
    clearCourse(); box(40, 42, FY - 4, FY - 1, BRICK); box(60, 63, FY, WH - 4, AIR); box(75, 79, FY - 4, FY - 4, PLATFORM); box(82, 86, FY - 8, FY - 8, PLATFORM); box(89, 93, FY - 12, FY - 12, BRICK); box(100, 101, FY - 7, FY - 1, BRICK);
    const bots = [], goals = [[120, FY], [91, FY - 12], [10, FY], [84, FY - 8], [50, FY], [130, FY]];
    for (let i = 0; i < 12; i++) { const f = mk(8 + i * 10); f.botI = i; f.goal = goals[i % goals.length]; bots.push(f); }
    let worst = 0, sum = 0, twice = 0, searches = 0, got = 0; const T0 = 900;
    for (let t = 0; t < T0; t++) {
      G.time++; const g0 = NAV.gen, a = performance.now();
      for (const f of bots) { f.ai.I.jumpP = false; f.said = navTo(f, f.ai.I, f.goal[0] * T + 4, f.goal[1] * T, null); }
      const ms = performance.now() - a; sum += ms; worst = max(worst, ms); if (NAV.gen - g0 > 1) twice++; searches += NAV.gen - g0;
      for (const f of bots) tickFighter(f, f.ai.I);
    }
    for (const f of bots) if (f.onGround && abs(f.x + 3 - f.goal[0] * T - 4) < 8 && abs(f.y + f.h - f.goal[1] * T) < 3) got++;
    return { mean: +(sum / T0).toFixed(3), worst: +worst.toFixed(2), twice, searches, got };
  };
})()"""


async def main():
    h = await H().start(mode='arena')
    try:
        await h.ev(SETUP)
        names = await h.ev("Object.keys(COURSES)")
        beat = 0
        for n in names:
            new = await h.ev("send(...COURSES[%r], 'route')" % n)
            old = await h.ev("send(...COURSES[%r], 'old')" % n)
            print('%-56s route: %s in %3d ticks%s | old steering: %s' % (n, 'there' if new['got'] else 'NOT there (%s)' % new, new['t'], ' (wet %d ticks)' % new['wet'] if new['wet'] else '',
                  'there in %d%s%s' % (old['t'], ', wet %d ticks' % old['wet'] if old['wet'] else '', ', burnt for %d' % old['hurt'] if old['hurt'] else '') if old['got'] else 'never (ended at tile %d, row %d%s)' % (old['x'], old['row'], ', gave up' if old['gave'] else '')))
            assert new['got'], 'the route finder should get there: ' + n
            assert new['hurt'] == 0, 'and unharmed: ' + n
            if 'stay dry' in n or 'slag' in n: assert new['wet'] == 0, 'without getting wet: ' + n
            if 'swim' in n: assert new['wet'] > 0, 'this one is meant to be swum'
            if not old['got'] or old['hurt'] or (old['wet'] and 'swim' not in n): beat += 1
        print('courses the old steering could not do (or only by wading through water or fire) but the route finder can:', beat, 'of', len(names))
        assert beat >= 4, 'the route finder should manage what straight-line steering cannot'
        for n in await h.ev("Object.keys(REFUSE)"):
            r = await h.ev("send(...REFUSE[%r], 'route')" % n)
            print('%-56s route: %s after %d ticks, at tile %d, wet %d, hurt %d' % (n, 'refused' if r['refused'] else 'did not refuse', r['t'], r['x'], r['wet'], r['hurt']))
            assert r['refused'] and not r['got'] and r['wet'] == 0 and r['hurt'] == 0 and r['x'] < 40, 'should say there is no way, and stay out of it: ' + n
            assert r['t'] < 400, 'and say so within a few seconds'
        # a fighter with one jump only (the open world): the search itself knows a seven-tile wall is too much, and a four-tile one is not
        one = await h.ev("""(() => { const plan = (hgt, J) => { clearCourse(); box(40, 42, FY - hgt, FY - 1, BRICK); const e = navSearch(20, FY - 1, 60, FY - 1, J, null, 2500); return e >= 0 && NAV.tx === (((e - e % 14) / 14) % 96) && NAV.ty === ((((e - e % 14) / 14) / 96) | 0); }; return [plan(4, 4), plan(7, 4), plan(7, 8), plan(9, 8)]; })()""")
        print('a route over a wall: 4 high on one jump', one[0], '| 7 high on one jump', one[1], '| 7 high with the second jump', one[2], '| 9 high with both', one[3])
        assert one == [True, False, True, False], 'the search should know what one jump and two jumps can clear'
        c = await h.ev("crowd()")
        print('twelve at once: route finding took %.3f ms a tick on average, %.2f ms at worst; %d searches in 900 ticks, %d ticks with more than one; %d of 12 standing at their goals' % (c['mean'], c['worst'], c['searches'], c['twice'], c['got']))
        assert c['twice'] == 0, 'never more than one search in a tick'
        assert c['mean'] < 1.5 and c['worst'] < 12, 'route finding must stay cheap'
        assert c['got'] >= 10, 'and they should get where they are going'
        errs = [e for e in h.errs if 'agent-proxy' not in e]
        print('errors:', errs[:5] or 'none')
        assert not errs, 'browser reported an error'
        print('ALL PASS')
    finally:
        await h.stop()
asyncio.run(main())
