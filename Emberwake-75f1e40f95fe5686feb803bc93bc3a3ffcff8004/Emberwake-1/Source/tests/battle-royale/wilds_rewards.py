# What a match in the Wilds pays: a soul for every kill, coins for a win, looks from the wheel and the shop. And what it doesn't:
# nothing anyone owns is ever carried into a match, not even kits unlocked before matches began empty-handed.
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H


async def main():
    h = await H().start(mode='none')
    try:
        await h.ev("void (() => { LS.set('ew2.br.' + accountId(), JSON.stringify({ xp: 4200, elo: 1500, souls: 4, coins: 30, kits: ['ranger', 'archer', 'ironclad'], kit: 'archer', skins: [0], hats: [0] })); G.nick = 'T'; G.skin = 0; G.hat = 0; BR.via = 'solo'; BR.lead = true; BR.on = true; wBrEnterMatch('t', 99, ['me'], 31); G.manual = true; })()")
        start = await h.ev("({ pack: inv.filter(Boolean).length, gear: Object.values(G.gear).filter(Boolean).length, arms: (G.p.arms || []).length, profile: brProfile() })")
        print('match begins with:', start)
        assert start['pack'] == 0 and start['gear'] == 0, 'a match should begin with nothing, whatever the profile holds'
        assert start['profile']['kits'] == ['ranger', 'archer', 'ironclad'] and start['profile']['souls'] == 4, 'what was earned before should be kept on record'

        kill = await h.ev("""(() => { for (let i = 0; i < 1100; i++) { G.p.inv = 50; G.p.hp = 100; G.hitstop = 0; tick(); } const s0 = brProfile().souls, b = [...BR.bots.values()].find(f => !f.dead); b.hp = 0; killFighter(b, G.p); return [s0, brProfile().souls, G.p.kills, G.banner && G.banner.sub]; })()""")
        print('a kill pays:', kill)
        assert kill[1] == kill[0] + 1 and kill[2] == 1 and 'SOUL' in kill[3], 'a kill should pay one soul, and say so'

        win = await h.ev("""(() => { const a = brProfile(); for (const f of [...BR.bots.values()]) if (!f.dead) { f.hp = 0; killFighter(f, null); } for (let i = 0; i < 400 && BR.phase !== 'over'; i++) { G.p.inv = 50; G.p.hp = 100; G.hitstop = 0; tick(); } for (let i = 0; i < 200; i++) tick(); const z = brProfile(); return { over: BR.phase, won: BR.winMe, coins: z.coins - a.coins, wins: z.wins - a.wins, text: BR.rewardText }; })()""")
        print('a win pays:', win)
        assert win['won'] and win['coins'] == 100 and win['wins'] == 1 and 'COINS' in win['text'], 'a win should pay a hundred coins'

        wheel = await h.ev("""(() => { const out = { few: null, got: [], all: null }, p = brProfile(); p.souls = 5; brSaveProfile(p); out.few = [brSpinSoulWheel(), BR.menuMsg]; const q = brProfile(); q.souls = 200; q.skins = [0]; q.hats = [0]; brSaveProfile(q);
          for (let i = 0; i < 12; i++) { const s = brProfile().souls, k = brSpinSoulWheel(); if (!k) break; out.got.push([k.kind, k.name, s - brProfile().souls, k.cost > 0]); } out.all = BR.menuMsg; out.owned = [brProfile().skins.length, brProfile().hats.length]; out.pack = inv.filter(Boolean).length; return out; })()""")
        print('the wheel:', wheel)
        assert wheel['few'][0] is None and len(wheel['got']) == 7 and all(g[2] == 10 and g[3] for g in wheel['got']) and 'every look' in wheel['all'], 'ten souls should buy one look you lack, until there are none left'

        shop = await h.ev("""(() => { const p = brProfile(); p.coins = 120; p.hats = [0]; p.skins = [0]; brSaveProfile(p); const out = []; out.push(brShopCosmetic('hat', 2), G.hat, brProfile().coins); out.push(brShopCosmetic('skin', 5), G.skin, brProfile().coins); out.push(brShopCosmetic('hat', 0), G.hat, brProfile().coins); out.push(brShopCosmetic('hat', 99)); return out; })()""")
        print('the shop:', shop)
        assert shop == [True, 2, 20, False, 0, 20, True, 0, 20, False], 'a look should be bought once, refused when too dear, and worn for nothing after'

        pages = await h.ev("""(() => { const out = {}; BR.on = false; G.state = 'brform'; for (const t of ['queue', 'wheel', 'style']) { BR.menuTab = t; BR.menuScroll = 0; HITS.length = 0; let n = OOPS.n; render(1); render(1); out[t] = [HITS.length > 4, OOPS.n - n]; } G.state = 'title'; return out; })()""")
        print('menu pages draw:', pages)
        assert all(v == [True, 0] for v in pages.values()), 'every page of the menu should draw and take clicks'
        print('errors:', h.errs[:5] or 'none'); assert not h.errs, 'browser reported an error'
    finally:
        await h.stop()


asyncio.run(main())
