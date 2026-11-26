# The Wilds: weapons of a kind, against each other: evenly matched echoes duel with every pair at each level of making, and the
# share each weapon wins is printed. (Echoes are poor archers, so bows say little here: in a match they also eat arrows.)
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H

ROUNDS = int(sys.argv[1]) if len(sys.argv) > 1 else 8
LEVELS = [['stone_club', 'flint_spear', 'flint_daggers', 'bone_cleaver', 'bone_nunchaku'], ['copper_shortsword', 'copper_spear', 'copper_mace', 'bone_trident', 'flint_battleaxe'], ['bronze_sword', 'iron_sword', 'bronze_spear', 'iron_spear', 'bronze_battleaxe', 'iron_daggers', 'nunchaku', 'iron_flail']]
DUEL = r"""
([ids, rounds]) => {
  const L = [...BR.bots.values()], A = L[0], B = L[1], p = G.p; G.enemies.length = 0;
  brSpawnTick = () => { }; brGames = () => { }; brRingTick = () => { }; wxMob = () => { }; wBrBotThink = f => aiThink(f);
  const mid = 1700; for (let x = mid - 70; x <= mid + 70; x++) { for (let y = 40; y < 90; y++) if (tiles[y * WW + x]) setTile(x, y, AIR); for (let y = 90; y < 96; y++) setTile(x, y, STONE); heights[x] = 90; } for (const s of [-70, 70]) for (let y = 60; y < 90; y++) setTile(mid + s, y, STONE);
  const set = (f, wid, x) => { Object.assign(f, { dead: false, deadT: 0, hp: 100, ward: 0, wid, x, px: x, y: 90 * T - f.h, py: 90 * T - f.h, vx: 0, vy: 0, state: 'normal', atk: null, buf: null, hurtT: 0, inv: 0, iDodge: 0, st: null, stam: 100, glide: false, noHit: false, gone: false, taken: 0, riposte: 0, link: null, lastHitBy: null, counted: true, hist: [] }); f.ai = newBrain(.5); f.br.arrows = 40; f.br.gear = {}; f.arms = []; };
  const wins = {}, games = {}; for (const id of ids) wins[id] = games[id] = 0;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) for (let r = 0; r < rounds; r++) {
    const s = r & 1; set(A, ids[s ? j : i], (mid - 14) * T); set(B, ids[s ? i : j], (mid + 14) * T); G.fighters = [p, A, B]; G.projs.length = G.drops.length = 0; BR.phase = 'fight'; BR.t = WBR_DROP + 5000; G.link = null;
    for (let t = 0; t < 60 * 50; t++) { p.noHit = true; p.hp = 100; p.inv = 1e9; p.x = p.px = 30 * T; p.y = p.py = 6 * T; G.hitstop = 0; tick(); if (A.dead || B.dead) break; }
    const w = A.dead ? B.wid : B.dead ? A.wid : A.hp > B.hp ? A.wid : B.wid; wins[w]++; games[ids[i]]++; games[ids[j]]++;
  }
  const out = {}; for (const id of ids) out[id] = Math.round(wins[id] / games[id] * 100); return out;
}
"""


async def main():
    h = await H().start(w=480, h=300, mode='none')
    try:
        await h.ev("void (() => { G.nick = 'T'; G.skin = 0; SETTINGS.diff = 'normal'; BR.via = 'solo'; BR.lead = true; BR.on = true; wBrEnterMatch('t', 5, ['me'], 31); G.manual = true; })()")
        damage = await h.ev("Object.fromEntries(%r.flat().map(id => [id, +brDmgOf(IT[id]).toFixed(1)]))" % LEVELS)
        print('what each is worth a blow here:', damage)
        assert max(damage.values()) < 2.6 * min(damage.values()), 'the best you can forge should not be worlds away from what you can knap'
        for level in LEVELS:
            won = await h.pg.evaluate(DUEL, [level, ROUNDS]); print('duels won, per cent:', won)
            assert max(won.values()) <= 92 and min(won.values()) >= 8, 'no weapon should beat everything of its level, or nothing'
        print('errors:', h.errs[:5] or 'none')
    finally:
        await h.stop()


asyncio.run(main())
