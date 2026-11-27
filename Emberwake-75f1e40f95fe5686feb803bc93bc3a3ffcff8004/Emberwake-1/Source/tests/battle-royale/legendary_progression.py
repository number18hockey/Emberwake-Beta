import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H


async def main():
    h = await H().start(mode='none')
    await h.ev("G.nick = 'TESTER'; G.skin = 0; SETTINGS.diff = 'normal'; wBrSolo(); G.manual = true;")
    r = await h.ev("""(() => {
      const ids = ['voidblade', 'stormpiercer', 'rimecaller', 'soulreaper', 'earthshatter'];
      const defs = ids.map(id => {
        const it = IT[id], recipe = RECIPES.find(r => r.out === id && r.wild);
        return { id, found: !!it, legendary: !!(it && it.legendary), relic: !!(it && it.relic), tier: it && it.tier, cooldown: it && it.abilityCooldown, ability: it && it.legendAbility, rare: !!(recipe && Math.max(recipe.need.iron_ore || 0, recipe.need.copper_ore || 0, recipe.need.tin_ore || 0) >= 9), forge: !!(recipe && recipe.st === 'anvil') };
      });
      const spawnedEmpty = [...BR.bots.values()].every(f => f.wid === 'fists');
      const f = wBrNewBot(0, .5), rec = BR_LEGENDARY_RECIPES.find(r => r.id === 'rimecaller');
      f.wid = 'iron_sword'; f.x = 1e6; f.br.legendaryTarget = 'rimecaller'; f.br.bag = Object.assign({}, rec.need);
      const forge = brForgeNear; brForgeNear = () => ({});
      BR.ring.n = 1; BR.lastAlive = 20; const locked = brBotCraft(f);
      BR.ring.n = 2; BR.lastAlive = 5; const crafted = brBotCraft(f);
      brForgeNear = forge;
      const targetBot = wBrNewBot(5, .5); BR.ring.n = 2; BR.lastAlive = 8; targetBot.br.likes = 'maul';
      const likesMaul = brLegendaryTarget(targetBot).id;
      const wounded = wBrNewBot(6, .5); wounded.hp = 40; wounded.br.likes = 'spear';
      const likesHealing = brLegendaryTarget(wounded).id;
      const oldStrike = strike, oldRoyale = WORLD.royale, oldTime = G.time, hits = [];
      WORLD.royale = true; G.time = 1000;
      strike = (...args) => { hits.push(args); return true; };
      const attacker = { x: 1e6, y: 0, w: 6, h: 20, hp: 40, maxhp: 100, onGround: true, foes: [] };
      const primary = { x: 100, y: 100, w: 6, h: 20, dead: false, noHit: false }, chained = { x: 145, y: 100, w: 6, h: 20, dead: false, noHit: false };
      attacker.foes = [primary, chained];
      const attack = { f: attacker, W: IT.stormpiercer, face: 1 };
      legendaryOnHit(attack, primary, 40, 100, 100); const first = hits.length;
      legendaryOnHit(attack, primary, 40, 100, 100); const duringCooldown = hits.length;
      G.time += IT.stormpiercer.abilityCooldown; legendaryOnHit(attack, primary, 40, 100, 100); const afterCooldown = hits.length;
      strike = oldStrike; WORLD.royale = oldRoyale; G.time = oldTime;
      return { defs, poolExcluded: ids.every(id => !brPool().some(tier => tier.includes(id))), spawnedEmpty, locked, crafted, craftedId: f.wid, spentOre: f.br.bag.iron_ore, likesMaul, likesHealing, first, duringCooldown, afterCooldown };
    })()""")
    for d in r['defs']:
        print('%s: %s (%s, cooldown %s ticks)' % (d['id'], d['ability'], d['tier'], d['cooldown']))
    ok = [
        ('all five distinct legendary weapons and Wilds forge recipes are registered without changing chest pools', all(d['found'] and d['legendary'] and d['relic'] and d['tier'] == 'ember' and d['rare'] and d['forge'] for d in r['defs']) and len({d['ability'] for d in r['defs']}) == 5 and r['poolExcluded']),
        ('bots spawn empty-handed', r['spawnedEmpty']),
        ('a legendary craft is stage-gated', not r['locked']),
        ('a late-stage bot crafts from its gathered rare ore', r['crafted'] and r['craftedId'] == 'rimecaller' and r['spentOre'] == 0),
        ('bot weapon preference adapts to strategy and low health', r['likesMaul'] == 'earthshatter' and r['likesHealing'] == 'soulreaper'),
        ('a custom combat ability triggers once per cooldown', r['first'] == 1 and r['duringCooldown'] == 1 and r['afterCooldown'] == 2),
    ]
    for name, passed in ok: print(('  ok   ' if passed else '  FAIL ') + name)
    errs = [e for e in h.errs if 'PAGEERROR' in e]
    print('errors:', errs[:8])
    await h.stop()
    if not all(passed for _, passed in ok) or errs: raise SystemExit(1)


asyncio.run(main())
