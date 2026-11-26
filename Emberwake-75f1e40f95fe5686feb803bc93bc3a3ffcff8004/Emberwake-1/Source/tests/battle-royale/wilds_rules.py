# The rules of the Wilds: the fall from the sky, empty hands, gathering and crafting, digging, the lava, sparse chests,
# a border that answers to the fallen, pacts you can leave, doors you can walk through, and beasts that can kill you.
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H

SETUP = """void (() => {
  G.nick = 'TESTER'; G.skin = 0; SETTINGS.diff = 'normal'; BR.via = 'solo'; BR.lead = true; BR.on = true; wBrEnterMatch('t', @SEED, ['me'], 31); G.manual = true;
  // put someone on the ground at a column, facing the world with nothing happening to them
  window.put = (f, tx, ty) => { f.glide = false; f.noHit = false; f.inv = 0; f.hurtT = 0; f.st = null; f.state = 'normal'; f.atk = null; f.vx = f.vy = 0; f.x = f.px = tx * T + 1; f.y = f.py = (ty === undefined ? heights[tx] - 3 : ty) * T; let n = 0; while (boxHits(f.x, f.y, f.w, f.h) && n++ < 80) { f.y -= T; f.py = f.y; } };
  window.quiet = () => { for (const f of G.fighters) if (f !== G.p && !f.dead) put(f, 40 + (f.botI % 6) * 4); };
  window.bare = tx => { for (let x = tx - 14; x <= tx + 14; x++) { for (let y = heights[x] - 8; y < heights[x]; y++) if (inW(x, y) && tiles[y * WW + x] !== BEDROCK) setTile(x, y, AIR); } };
})()"""


async def main():
    h = await H().start(mode='none')
    try:
        await h.ev(SETUP.replace('@SEED', '4021'))
        island = await h.ev("({ w: WW, h: WH, lands: new Set(BR.segs).size, chests: BR.chests.length, caves: BR.caves.length, places: BR.pois.length, trees: treeTops.size, pack: inv.filter(Boolean).length, slots: [INV_N, hotN()], bots: [...BR.bots.values()].map(f => f.wid + ':' + Object.keys(f.br.bag).length).filter(s => s !== 'fists:0').length, sky: G.fighters.every(f => f.y < 20 * T && f.glide), spread: new Set(G.fighters.map(f => Math.floor(f.x / T / 100))).size })")
        print('island:', island)
        assert island['w'] == 3500, 'the island should be 3500 paces across'
        assert island['lands'] == 9 and island['caves'] >= 12, 'nine kinds of land, and caves with places of their own'
        assert island['chests'] <= 60, 'chests should be few'
        assert island['pack'] == 0 and island['bots'] == 0, 'nobody should start with anything'
        assert island['slots'] == [20, 10], 'a crafter needs a full pack and hotbar'
        assert island['sky'] and island['spread'] > 24, 'everyone should start in the sky, spread over the island'

        await h.step(300); hold = await h.ev("[G.p.y < 60 * T, G.p.glide, BR.phase]")
        for i in range(60):
            if await h.ev("!G.p.glide"): break
            await h.step(20)
        print('fall:', hold, 'landed', await h.ev("[Math.round(G.p.x / T), !G.p.glide, Math.round(G.p.hp), G.p.noHit]"))
        assert await h.ev("!G.p.glide && !G.p.noHit && G.p.hp === 100"), 'you should glide down unhurt'

        loot = await h.ev("""(() => { const all = [], out = { most: 0, weapons: 0, bows: 0, speed: 0, n: 0 };
          for (let k = 0; k < 60; k++) for (const c of BR.chests) { const l = wBrLoot(c); out.n++; out.most = Math.max(out.most, l.length); if (!c.feast && !c.crown) for (const [id] of l) { if (IT[id].type === 'weapon') out.weapons++; if (id === 'bow') out.bows++; } }
          const c = BR.chests.find(c => !c.hid && !c.open); put(G.p, c.x, c.y - 2); G.drops.length = 0; wBrOpenChest(c, G.p); out.drops = G.drops.length; out.speed = Math.max(0, ...G.drops.map(d => Math.hypot(d.vx, d.vy))); out.pct = +(out.weapons / out.n * 100).toFixed(1); return out; })()""")
        print('loot:', loot)
        assert loot['most'] <= 3, 'a chest holds at most three things'
        assert loot['pct'] < 12 and loot['bows'] == 0, 'a weapon in a chest should be rare, and never a Dawnstring Bow'
        assert loot['speed'] < .6, 'what is in a chest is set down, not thrown'

        # gather by hand: a click on grass, sticks and pebbles
        await h.ev("quiet(); put(G.p, 1200); bare(1200); G.drops.length = 0; inv.fill(null); setTile(1202, heights[1202] - 1, STICKS); setTile(1198, heights[1198] - 1, PEBBLE); 0")
        await h.step(20)
        for tx in (1202, 1198):
            await h.ev("(() => { const x = %d * T + 4, y = (heights[%d] - 1) * T + 4; window.aimAt = [x, y]; })()" % (tx, tx))
            await h.step(60, "mouse.wx = aimAt[0]; mouse.wy = aimAt[1]; mouse.l = i < 40; mouse.lp = i === 0; G.p.inv = 50;")
        await h.ev("mouse.l = false; 0"); await h.step(60)
        got = await h.ev("inv.filter(Boolean).map(s => s.id)")
        print('gathered:', got)
        assert 'stick' in got and 'rock' in got, 'bare hands should pick up sticks and pebbles'

        # dig with bare hands, then make a spear and fight with it
        dug = await h.ev("""(() => { put(G.p, 1200); window.before = 0; const tx = 1200; for (let y = heights[tx]; y < heights[tx] + 3; y++) if (solidAt(tx, y)) before++; return before; })()""")
        await h.step(700, "mouse.wx = G.p.x + 3; mouse.wy = G.p.y + 40; mouse.l = true; mouse.lp = i === 0; G.p.inv = 50; G.p.stam = 100;")
        left = await h.ev("(() => { mouse.l = false; let n = 0; for (let y = heights[1200]; y < heights[1200] + 3; y++) if (solidAt(1200, y)) n++; return [n, inv.filter(Boolean).map(s => s.id + 'x' + s.n).join(' ')]; })()")
        print('dug by hand:', dug, '->', left)
        assert left[0] < dug, 'bare hands should dig soil'
        fight = await h.ev("""(() => { const out = {}; inv.fill(null); for (const [id, n] of [['flint', 6], ['stick', 10], ['fiber', 30], ['rock', 8]]) addItem(id, n);
          const make = id => { const r = RECIPES.find(r => r.out === id && r.st === 'hand' && Object.keys(r.need).every(k => IT[k])); craft(r); };
          make('twine'); make('twine'); make('twine'); make('twine'); make('spearhead'); make('flint_spear'); make('knifeblade'); make('flint_knife'); make('axehead'); make('flint_axe');
          out.slots = ['flint_spear', 'flint_knife', 'flint_axe'].map(id => inv.findIndex(s => s && s.id === id)); out.hot = hotN();
          const b = [...BR.bots.values()].find(f => !f.dead), p = G.p, hit = (sel, frames) => { put(p, 1300); bare(1300); put(b, 1302); b.hp = 100; b.ward = 0; b.ai.atkCd = 1e9; b.br.foe = null; G.sel = sel; p.stam = 100; p.face = 1; let low = 100;
            for (let i = 0; i < frames; i++) { mouse.wx = b.x + 3; mouse.wy = b.y + 9; mouse.l = true; mouse.lp = i % 24 === 0; b.x = b.px = p.x + 17; b.y = b.py = p.y; b.vx = 0; b.inv = 0; b.iDodge = 0; b.state = 'normal'; b.atk = null; p.stam = 100; p.hp = 100; p.hurtT = 0; if (G.hitstop > 0) { G.hitstop--; continue; } tick(); low = Math.min(low, b.hp); } mouse.l = false; return +(100 - low).toFixed(0); };
          out.spear = hit(out.slots[0], 90); out.knife = hit(out.slots[1], 90); out.axe = hit(out.slots[2], 90); G.sel = 9; inv[9] = null; out.fists = hit(9, 90); return out; })()""")
        print('crafted and fought:', fight)
        assert all(0 <= s < fight['hot'] for s in fight['slots']), 'what you craft should land where you can reach it'
        assert fight['spear'] > 0 and fight['knife'] > 0 and fight['axe'] > 0 and fight['fists'] > 0, 'crafted weapons and tools, and fists, must all hurt another Waker'

        # wherever you come down there is something to make twine of, and reeds will do as well as grass
        fibre = await h.ev("""(() => { const n = {}, len = {}; for (let x = 10; x < WBRW - 10; x++) { const b = wBrBio(x), L = PLUCK[tileAt(x, heights[x] - 1)]; len[b] = (len[b] || 0) + 1; if (L && L.some(q => q[0] === 'fiber' || q[0] === 'reed')) n[b] = (n[b] || 0) + 1; } for (const b in len) n[b] = +((n[b] || 0) / len[b] * 100).toFixed(1); return n; })()""")
        print('plants that twist into twine, for every 100 paces:', fibre)
        assert len(fibre) == 9 and min(fibre.values()) >= 2, 'no land should leave you without twine'
        assert await h.ev("(() => { inv.fill(null); addItem('reed', 3); const r = RECIPES.find(r => r.out === 'twine' && r.need.reed); craft(r); return countItem('twine'); })()") == 1, 'reeds should twist into twine'

        # doors: every kind of named place can be walked into
        doors = await h.ev("""(() => { const out = {}; quiet(); for (const q of BR.pois) { const gy = heights[q.x]; for (const S of STRUCTS) if (S.kind === 'house' && S.x0 > q.x - 40 && S.x1 < q.x + 40) for (const side of [-1, 1]) { const p = G.p; put(p, side < 0 ? S.x0 - 3 : S.x1 + 3); let n = 0; const goal = (S.x0 + S.x1) / 2 * T; for (; n < 260; n++) { for (const k in keys) keys[k] = false; keys[side < 0 ? 'KeyD' : 'KeyA'] = true; keys.Space = p.hitWall && p.onGround; pressed.Space = keys.Space; p.inv = 50; p.hp = 100; tick(); if (abs(p.x - goal) < 14) break; } for (const k in keys) keys[k] = false; out[q.name] = (out[q.name] || []).concat(n < 260 ? 'in' : 'STUCK'); } } return out; })()""")
        print('houses entered:', doors)
        assert doors and all(v == 'in' for L in doors.values() for v in L), 'a house must let you in from both sides'

        # too deep
        deep = await h.ev("""(() => { quiet(); const p = G.p; put(p, 1500); p.hp = 100; p.y = p.py = (BR_HOT + 8) * T; const s0 = [...tiles.subarray(0, 1)]; for (let y = BR_HOT + 4; y < BR_HOT + 14; y++) for (let x = 1496; x < 1506; x++) tiles[y * WW + x] = y > BR_HOT + 11 ? DEEPSTONE : AIR; let low = 100; for (let i = 0; i < 300; i++) { p.inv = 50; tick(); low = Math.min(low, p.hp); } const burned = low < 100 && !p.dead; p.hp = 100; p.y = p.py = (BR_LAVA + 2) * T; tick(); return { depth: BR_LAVA - BR_GROUND, burned, dead: p.dead, cause: p.cause }; })()""")
        print('deep:', deep)
        assert 150 <= deep['depth'] <= 200, 'the lava should lie 150 to 200 paces down'
        assert deep['burned'] and deep['dead'] and 'lava' in deep['cause'], 'the rock burns you first, and the lava kills'

        # echoes who fall down a hole come up again: one is put at the bottom of each vine, and given a minute and a half
        holes = await h.ev("""(() => { const keep = [brSpawnTick, brGames, brRingTick, wxMob, brBotMeet], bots = [...BR.bots.values()].filter(f => !f.dead), used = []; brSpawnTick = brGames = brRingTick = wxMob = brBotMeet = () => { };
          const put1 = (f, x, d) => { for (let n = 0; n < 500; n++) { const X = n ? x + randiF(-5, 5) : x, Y = heights[x] + d + (n ? randiF(-6, 6) : 0); if (solidAt(X, Y) || solidAt(X, Y - 1) || solidAt(X, Y - 2)) continue; put(f, X, Y - 2); f.y = f.py = (Y + 1) * T - f.h; f.team = 'same'; f.br.goal = null; f.br.foe = null; used.push(f); return; } };
          let last = -99; for (let x = 12; x < WBRW - 12 && used.length < bots.length; x++) { let n = 0; for (let y = heights[x]; y < heights[x] + 60; y++) if (TP[tileAt(x, y)].climb) n++; if (n > 12 && x - last > 12) { last = x; put1(bots[used.length], x, 16); } }
          const gone = G.fighters.filter(f => f !== G.p && !used.includes(f)); G.fighters = [G.p, ...used]; const down = new Map(), up = f => floor((f.y + f.h) / T) <= heights[clamp(floor(f.x / T), 0, WBRW - 1)] + 5, done = new Set();
          for (let i = 0; i < 5400 && done.size < used.length; i++) { const p = G.p; p.dead = false; p.inv = 50; p.hp = 100; p.x = p.px = 20 * T; p.y = p.py = 6 * T; p.vx = p.vy = 0; BR.storm = null; G.hitstop = 0; tick(); for (const f of used) { f.hp = 100; if (up(f)) done.add(f); } }
          [brSpawnTick, brGames, brRingTick, wxMob, brBotMeet] = keep; G.fighters.push(...gone); return [used.length, done.size]; })()""")
        print('echoes put down holes, and up again:', holes)
        assert holes[0] >= 4 and holes[1] >= holes[0] * .8, 'echoes should find their way out of a hole'

        # the border waits for the fallen
        await h.ev(SETUP.replace('@SEED', '77'))
        border = await h.ev("""(() => { const out = {}; BR.phase = 'fight'; BR.t = WBR_DROP + 100; BR.lastFall = BR.t; quiet(); const run = n => { for (let i = 0; i < n; i++) { G.p.hp = 100; G.p.inv = 50; BR.lastFall = BR.t; for (const f of G.fighters) { f.hp = 100; f.br && (f.br.foe = null); } tick(); if (G.p.dead) break; } };
          BR.t += 60 * 60 * 14; BR.lastFall = BR.t; run(5); out.afterLongWait = BR.ring.n; const need = brNextAt(); out.need = need; const L = [...BR.bots.values()]; while (wBrAlive().length > need) { const f = L.find(f => !f.dead); f.hp = 0; killFighter(f, null); } run(3); out.called = BR.ring.n; out.msg = BR.storm.warn; const w0 = BR.storm.R - BR.storm.L; BR.t += BR_WARN + BR_MOVE; run(2); out.shrunk = BR.storm.R - BR.storm.L < w0 * .8; out.waits = !BR.storm.moving && !BR.storm.warn && BR.storm.next < need; return out; })()""")
        print('border:', border)
        assert border['afterLongWait'] == 0, 'time alone should not bring the border in'
        assert border['called'] == 1 and border['shrunk'] and border['waits'], 'the border should move when enough have fallen, then wait for more'

        # a pact with an echo, and out of it again
        pact = await h.ev("""(() => { const out = {}, p = G.p, b = [...BR.bots.values()].find(f => !f.dead); put(p, 1700); put(b, 1703); b.br.roll = 0; b.br.bold = .1; b.lastHitBy = null; b.br.ally = null; b.team = b.botTag; brPactKey(p); out.with = BR.teammate === b.botTag && p.team === b.team; refreshFoes(); out.friends = !p.foes.includes(b); brPactKey(p); out.still = BR.teammate === b.botTag; brPactKey(p); out.left = !BR.teammate && p.team === 'me' && b.team === b.botTag; refreshFoes(); out.foes = p.foes.includes(b); return out; })()""")
        print('pact:', pact)
        assert pact == {'with': True, 'friends': True, 'still': True, 'left': True, 'foes': True}, 'a pact should be made with P, and left with P twice'

        # beasts
        beast = await h.ev("""(() => { quiet(); const p = G.p, out = { low: 100 }; put(p, 1900); bare(1900); p.hp = 30; p.dead = false; BR.mobT = 1e9; for (const t of ['husk', 'thornback', 'husk']) spawnMob(t, 1900 + G.enemies.length * 4 - 4, heights[1900]); for (let i = 0; i < 1500 && !p.dead; i++) { for (const e of G.enemies) if (abs(e.x - p.x) > 120) { e.x = e.px = p.x + 40; e.y = e.py = p.y; } tick(); out.low = Math.min(out.low, p.hp); } out.dead = p.dead; out.feed = G.kfeed[0] && (G.kfeed[0].a + '|' + G.kfeed[0].txt); return out; })()""")
        print('beasts:', beast)
        assert beast['dead'], 'the beasts of the island should be able to kill you'
        spawns = await h.ev("""(() => { const kinds = {}; BR.storm = null; for (const [b, name] of WBR_BIOMES.map(b => [b, b])) { const i = BR.segs.indexOf(b), x = Math.round((BR.segX[i] + BR.segX[i + 1]) / 2), f = { x: x * T, y: heights[x] * T - 20 }; G.enemies.length = 0; for (let k = 0; k < 12; k++) brSpawnNear(f, 20, 20); kinds[b] = [...new Set(G.enemies.map(e => e.type))].join(','); } G.enemies.length = 0; return kinds; })()""")
        print('creatures:', spawns)
        assert all(spawns.values()), 'every land should have its creatures'
        print('errors:', h.errs[:5] or 'none')
        assert not h.errs, 'browser reported an error'
    finally:
        await h.stop()


asyncio.run(main())
