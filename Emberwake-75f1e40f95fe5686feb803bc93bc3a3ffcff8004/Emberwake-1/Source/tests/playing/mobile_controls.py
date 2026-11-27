# Touch controls: the overlay fits narrow and tall screens, and dash is the desktop dodge action.
import asyncio, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import CHROME
from harness import H

async def main():
    pw = await async_playwright().start()
    browser = await pw.chromium.launch(headless=True, args=['--no-sandbox'], **CHROME)
    ctx = await browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    # the test must never reach the public message boards: the only one it knows is a closed door on this computer
    await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:1/mqtt'];")
    # (the harness signs in as a test account, so the accounts board is already behind us when the world starts)
    h = await H().start(ctx=ctx, pw=pw)
    await h.ev("G.state = 'play'; G.manual = true; G.dialog = null; G.cine = null; UI.open = null; syncMobileControls();")
    results = []
    for width, height in [(390, 844), (320, 568)]:
        await h.pg.set_viewport_size({'width': width, 'height': height})
        await h.pg.wait_for_timeout(50)
        layout = await h.ev("""(() => {
          syncMobileControls();
          const ids = ['movePad','mobileJump','mobileDash','mobileUse','attackHeavy','attackLight'];
          const rects = ids.map(id => { const r = document.getElementById(id).getBoundingClientRect(); return [id,r.left,r.top,r.right,r.bottom]; });
          return { visible: mobileControls.classList.contains('visible'), coarse: mobileDevice, rects };
        })()""")
        results.append(layout)
    await h.pg.locator('#mobileDash').tap()
    dash = await h.ev("[pressed.ShiftLeft, playerInput().dodgeP]")
    await h.ev("endTick()")
    await h.ev("G.sel = 0; render(1);")
    x, y = await h.ev("(() => { const r=cv.getBoundingClientRect(), k=VS.ui*r.width/cv.width, hb=hotbarLayout(); return [(hb.x+27)*k,(hb.y+10)*k]; })()")
    await h.pg.locator('#c').tap(position={'x': x, 'y': y})
    hotbar = await h.ev("G.sel")
    print('mobile layouts:', results)
    print('dash press activates desktop dodge input:', dash)
    print('touch hotbar selection:', hotbar)
    errors = [e for e in h.errs if 'agent-proxy' not in e]
    print('browser errors:', errors[:6])
    assert all(r['visible'] and r['coarse'] for r in results), 'Touch controls did not appear on mobile.'
    for layout, (width, height) in zip(results, [(390, 844), (320, 568)]):
        boxes = layout['rects']
        assert all(x1 >= 0 and y1 >= 0 and x2 <= width and y2 <= height for _, x1, y1, x2, y2 in boxes), 'A control is outside the viewport.'
        for i, a in enumerate(boxes):
            for b in boxes[i + 1:]:
                overlap = min(a[3], b[3]) > max(a[1], b[1]) and min(a[4], b[4]) > max(a[2], b[2])
                assert not overlap, f'{a[0]} overlaps {b[0]} at {width}x{height}.'
    assert dash == [True, True], 'Dash control did not activate dodge.'
    assert hotbar == 1, 'Touching a hotbar slot did not switch the selected item.'
    assert not errors, f'Browser errors: {errors}'
    await h.stop()
    await browser.close()
    await pw.stop()

asyncio.run(main())
