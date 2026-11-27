# Every placeable inventory block and wall works in survival and free-build modes when supported.
import asyncio, json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H

async def main():
    h = await H().start(seed=9876)
    result = json.loads(await h.ev("""(() => {
      const items = Object.entries(IT).filter(([,it]) => it.type === 'block' || it.type === 'wall'), out = {};
      G.p.inv = 1e9;
      for (const mode of [0, 1]) {
        WORLD.mode = mode; const failed = [], x0 = SPAWN_X + 25 + mode * 3;
        items.forEach(([id,it], k) => {
          if (!mode) { inv.fill(null); addItem(id, it.cost || 1); }
          const tx = x0 + k * 3, ty = heights[tx] - 1, i = ty * WW + tx;
          setTile(tx, ty, AIR); walls[i] = 0; setTile(tx, ty + 1, STONE);
          if (it.type === 'wall') walls[i - 1] = W_POLISHED;
          else if (!TP[it.tile].ground) setTile(tx - 1, ty, STONE);
          if (!tryPlace(it, tx, ty)) failed.push(id);
        });
        out[mode ? 'free-build' : 'survival'] = { total: items.length, failed };
      }
      return JSON.stringify(out);
    })()"""))
    errors = [e for e in h.errs if 'agent-proxy' not in e]
    print('placement results:', result)
    print('browser errors:', errors[:6])
    assert all(not mode['failed'] for mode in result.values()), 'Some supported inventory blocks could not be placed.'
    assert not errors, f'Browser errors: {errors}'
    await h.stop()

asyncio.run(main())
