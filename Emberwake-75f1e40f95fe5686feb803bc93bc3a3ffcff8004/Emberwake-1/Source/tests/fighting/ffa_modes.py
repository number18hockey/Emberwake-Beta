# The FFA modes use distinct arenas and legal mode-specific kits; Crystal PvP
# places, detonates and resets its arena, while random loadouts change on respawn.
import asyncio, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL

ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True, args=ARGS)
        page = await browser.new_page(viewport={'width': 960, 'height': 540})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
        await page.goto(GAME_URL)
        await page.wait_for_timeout(500)
        await page.evaluate("G.state = 'ring'")
        await page.wait_for_timeout(200)
        result = await page.evaluate("""() => {
          const records = [];
          for (const mode of FFA_MODES) {
            enterArena('TEST', 0, 'ffa-' + mode.id, 'room', mode.id);
            const allowed = ffaWeaponIds(mode.id), loadout = inv.filter(x => x && IT[x.id] && IT[x.id].type === 'weapon').map(x => x.id);
            records.push({
              id: mode.id, bots: G.fighters.filter(f => f.echoBot).length,
              legal: loadout.length > 0 && loadout.every(id => allowed.includes(id)),
              botLegal: G.fighters.filter(f => f.echoBot).every(f => allowed.includes(f.wid)),
              matches: ffaModeStats(mode.id).matches,
              map: tiles.join(',')
            });
          }
          enterArena('TEST', 0, 'ffa-crystal', 'room', 'crystal');
          const p = G.p;
          p.x = 75 * T; p.y = 60 * T - 21; p.face = 1;
          pressed.KeyF = true; FFA.crystalCd = 0; ffaCrystalAction();
          const placed = FFA.crystals.length === 1;
          const crystal = FFA.crystals[0];
          const visible = !!crystal && tileAt(crystal.tx, crystal.surface - 3) === CRYSTAL;
          FFA.crystalCd = 0; ffaCrystalAction();
          const detonated = FFA.crystals.length === 0;
          const restored = !!crystal && crystal.cells.every(([x, y, old]) => tileAt(x, y) === old);
          const baseline = tileAt(5, 5);
          setTile(5, 5, CRYSTAL); G.drops.push({}); G.projs.push({}); G.smokes.push({}); G.parts.push({});
          const resetN = FFA.resetN; FFA.resetAt = Date.now() - 1; ffaTick();
          const reset = FFA.resetN === resetN + 1 && FFA.resetAt > Date.now() &&
            FFA.crystals.length === 0 && tileAt(5, 5) === baseline &&
            !G.drops.length && !G.projs.length && !G.smokes.length &&
            G.fighters.every(f => f.remote || f.inv > 0);
          enterArena('TEST', 0, 'ffa-shield', 'room', 'shield');
          const shieldPlayer = G.p, attacker = G.fighters.find(f => f.echoBot);
          shieldPlayer.x = 75 * T; shieldPlayer.face = 1; shieldPlayer.hp = 100; shieldPlayer.inv = 0; shieldPlayer.iDodge = 0; shieldPlayer.stam = 100;
          keys.KeyG = true; hurtFighter(shieldPlayer, 20, shieldPlayer.x + 20, { pvp: true, by: attacker });
          const frontDamage = 100 - shieldPlayer.hp, frontGuarded = shieldPlayer.riposte > 0 && shieldPlayer.stam === 88;
          shieldPlayer.hp = 100; shieldPlayer.inv = 0; shieldPlayer.iDodge = 0; shieldPlayer.stam = 100;
          hurtFighter(shieldPlayer, 20, shieldPlayer.x - 20, { pvp: true, by: attacker });
          const backDamage = 100 - shieldPlayer.hp, backUnblocked = shieldPlayer.stam === 100;
          keys.KeyG = false;
          enterArena('TEST', 0, 'ffa-random', 'room', 'random');
          const seen = new Set();
          for (let i = 0; i < 24; i++) { ffaEquip(G.p); seen.add(inv[0] && inv[0].id); }
          return { records, distinctMaps: new Set(records.map(r => r.map)).size, placed, visible, detonated, restored, reset, randomLoadouts: seen.size, progression: FFA_MODES.every(m => ffaModeStats(m.id).matches > 0), frontDamage, backDamage, frontGuarded, backUnblocked };
        }""")
        for label, passed in [
            ('all ten modes use separate maps', result['distinctMaps'] == 10),
            ('all ten modes start with three bots and legal kits', all(r['bots'] == 3 and r['legal'] and r['botLegal'] for r in result['records'])),
            ('each mode records its own progression', result['progression']),
            ('Crystal PvP places and displays a crystal', result['placed'] and result['visible']),
            ('Crystal PvP detonates and restores placed blocks', result['detonated'] and result['restored']),
            ('Crystal PvP reset restores the arena, clears entities, and respawns fighters', result['reset']),
            ('Shield & Sword blocks attacks from the front and opens a riposte', result['frontGuarded'] and result['frontDamage'] < result['backDamage']),
            ('random loadouts change across respawns', result['randomLoadouts'] > 1),
        ]:
            print(('PASS ' if passed else 'FAIL ') + label)
        if errors:
            print('PAGE ERRORS:', errors[:5])
        await browser.close()
        if errors or result['distinctMaps'] != 10 or not all(r['bots'] == 3 and r['legal'] and r['botLegal'] for r in result['records']) or not result['progression'] or not all(result[k] for k in ('placed', 'visible', 'detonated', 'restored', 'reset', 'frontGuarded', 'backUnblocked')) or result['frontDamage'] >= result['backDamage'] or result['randomLoadouts'] < 2:
            raise SystemExit(1)

asyncio.run(main())
