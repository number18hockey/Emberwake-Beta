# The account cosmetic shop: priced looks, cosmetic-only equipment, saving and shared appearance.
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H


async def main():
    h = await H().start(mode='none')
    try:
        await h.ev("""(() => {
          ACCOUNT.active = { id: 'cosmetic-test', name: 'TEST', skin: 0, hat: 0, trail: 0 };
          G.skin = G.hat = G.trail = 0;
          const p = { xp: 0, elo: 1000, wins: 0, matches: 0, kills: 0, coins: 120, souls: 40, skins: [0], hats: [0], trails: [0] };
          LS.set('ew2.br.' + accountId(), JSON.stringify(p));
        })()""")
        bought = await h.ev("""(() => {
          const trail = brShopCosmetic('trail', 1), coins = brShopCosmetic('skin', 2);
          const refused = brShopCosmetic('trail', 2), saved = JSON.parse(LS.get('ew2.br.' + accountId()));
          return { trail, coins, refused, wallet: [saved.coins, saved.souls], equipped: [G.skin, G.hat, G.trail],
            owned: [saved.skins, saved.trails], account: [ACCOUNT.active.skin, ACCOUNT.active.trail] };
        })()""")
        print('purchases and account save:', bought)
        assert bought['trail'] and bought['coins'] and not bought['refused'], 'Soul and Coin purchases should succeed only when affordable'
        assert bought['wallet'] == [20, 25] and bought['equipped'] == [2, 0, 1], 'purchases should charge the right wallet and only change appearance'
        assert bought['owned'] == [[0, 2], [0, 1]] and bought['account'] == [2, 1], 'purchases and equipped cosmetics should persist to the account'

        unequipped = await h.ev("""(() => {
          brUnequipCosmetic('trail');
          const p = JSON.parse(LS.get('ew2.br.' + accountId()));
          const f = newFighter(0, 0, { skin: G.skin, hat: G.hat, trail: G.trail });
          const s = fighterState(f, false);
          return [G.trail, ACCOUNT.active.trail, p.equipped.trail, f.trail, s.sk, s.ht, s.tr];
        })()""")
        print('unequipped state and multiplayer payload:', unequipped)
        assert unequipped == [0, 0, 0, 0, 2, 0, 0], 'unequip should persist and sync only cosmetic identity'

        cloud = await h.ev("""(async () => {
          const previous = SAVE.db, owner = accountId(), remote = { updatedAt: Date.now() + 10000, coins: 7, souls: 8, skins: [0, 1], hats: [0, 2], trails: [0, 1],
            equipped: { skin: 1, hat: 2, trail: 1 } };
          SAVE.db = { doc: () => ({ get: async () => ({ exists: true, data: () => remote }), set: async () => {} }) };
          await brSyncProfile(owner); SAVE.db = previous;
          return [G.skin, G.hat, G.trail, ACCOUNT.active.skin, brProfile().coins, brProfile().souls];
        })()""")
        print('cloud profile synchronization:', cloud)
        assert cloud == [1, 2, 1, 1, 7, 8], 'a newer account cloud profile should restore wallet and equipped cosmetics'

        screen = await h.ev("""(() => {
          G.state = 'shop'; COSMETIC_SHOP.tab = 'trail'; COSMETIC_SHOP.selected = 1;
          render(1); render(1);
          return [G.state, COSMETIC_SHOP.rows, HITS.length, BR_SHOP_ITEMS.length];
        })()""")
        print('shop screen:', screen)
        assert screen[0] == 'shop' and screen[1] > 0 and screen[2] > 4 and screen[3] >= 15, 'the shop screen should draw preview, categories and actionable rows'
        errors = [e for e in h.errs if 'PAGEERROR' in e or e.startswith('error:')]
        assert not errors, 'browser reported an error: ' + repr(errors[:5])
    finally:
        await h.stop()


asyncio.run(main())
