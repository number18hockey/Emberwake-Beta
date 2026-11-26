// ============================================================
//  Echoes in the Wilds: computer Wakers who start, like you, with
//  empty hands. They pick sticks and grass, knap and bind what they
//  find into something to fight with, dig ore out of the hillside and
//  carry it to a forge. They run from what they can't beat, hunt what
//  they can, mind the border, and some will take a pact.
// ============================================================
function brBrain() { return { heals: 0, wards: 0, arrows: 0, bag: {}, gear: {}, bold: frand(.08, .95), likes: fpick(['maul', 'spear', 'fangs', 'fangs', 'sword', 'sword', 'chuks']), goal: null, skip: new Map(), lx: 0, ly: 0, stuck: 0, think: 0, foe: null, foeT: 0, flee: 0, off: 0, pil: -1, side: 0, sideD: 0, workT: 0, eatT: 0, pick: 0, axe: 0, ally: null, allyT: 0, asked: -99999, spurned: -99999, roll: Math.random(), digT: 0, dir: 1, dirT: 0, hopD: 0, hopT: 0, gy: 0, hi: 1e9, hiT: 0, noVine: 0 }; }
function wBrNewBot(i, skill) {
  return newFighter(0, 0, { name: WBR_BOTN[i % WBR_BOTN.length], skin: i % SKINS.length, team: 'B' + i, botTag: 'B' + i, botI: i, wid: 'fists', ai: newBrain(skill), brBot: true, echoBot: true, brIn: true, arms: [], ward: 0, br: brBrain() });
}
function wBrSkill() { const d = SETTINGS.diff; return d === 'hard' ? frand(.5, .78) : d === 'normal' ? frand(.36, .6) : frand(.24, .46); }
// how good a thing is to fight with, for an echo choosing
const brWorth = id => { const W = IT[id]; return !W || W.fist || W.type !== 'weapon' ? 0 : 1 + wBrTier(id) * .9 + brDmgOf(W) * .05; };
function wBrBotTake(f, id, n) {
  const it = IT[id], br = f.br; if (!it || !br) return;
  if (it.type === 'weapon') { if (it.set === 'bow' && br.arrows < 4) { br.bag[id] = 1; return; } if (brWorth(id) > brWorth(f.wid)) { br.backup = f.wid; f.wid = id; } }
  else if (id === 'arrow') br.arrows += n; else if (id === 'br_salve' || id === 'br_draught') br.heals += n; else if (id === 'br_shard' || id === 'br_ward') br.wards += n;
  else if (it.type === 'armor') { const old = IT[br.gear[it.slot]]; if (!old || it.prot > old.prot) br.gear[it.slot] = id; }
  else if (ARMS.includes(id)) { if (!f.arms.includes(id)) f.arms.push(id); }
  else { const q = BR_FIBER[id]; br.bag[q ? 'fiber' : id] = (br.bag[q ? 'fiber' : id] || 0) + n * (q || 1); }
}
// what else twists into twine, counted in fiber
const BR_FIBER = { reed: 1, husk_fiber: 6, hide: 9 };
// what they know how to make, and what it costs them (twine is counted in fiber, bars in ore)
const BR_MAKE = [
  { id: 'stone_club', need: { stick: 1, rock: 2, fiber: 3 } }, { id: 'flint_spear', need: { flint: 1, stick: 2, fiber: 3 } }, { id: 'flint_daggers', need: { flint: 2, stick: 1, fiber: 6 } }, { id: 'bone_club', need: { bone: 3, fiber: 3 } }, { id: 'bone_spear', need: { bone: 2, stick: 2, fiber: 3 } },
  { id: 'flint_battleaxe', need: { flint: 4, stick: 2, fiber: 6 } }, { id: 'bone_cleaver', need: { bone: 4, stick: 1, fiber: 3 } }, { id: 'bone_nunchaku', need: { bone: 2, fiber: 9 } },
  { id: 'copper_shortsword', need: { copper_ore: 6, stick: 1, coal: 1 }, forge: 1 }, { id: 'copper_spear', need: { copper_ore: 9, stick: 2, coal: 1 }, forge: 1 }, { id: 'copper_mace', need: { copper_ore: 9, stick: 1, coal: 1 }, forge: 1 },
  { id: 'bronze_sword', need: { copper_ore: 9, tin_ore: 3, stick: 1, coal: 1 }, forge: 1 }, { id: 'bronze_spear', need: { copper_ore: 9, tin_ore: 3, stick: 2, coal: 1 }, forge: 1 }, { id: 'iron_sword', need: { iron_ore: 12, stick: 1, coal: 2 }, forge: 1 }, { id: 'iron_spear', need: { iron_ore: 12, stick: 2, coal: 2 }, forge: 1 }
];
const brHas = (bag, need) => { for (const k in need) if ((bag[k] || 0) < need[k]) return false; return true; };
const brPay = (bag, need) => { for (const k in need) bag[k] -= need[k]; };
function brForgeNear(f, r = 24) { for (const o of tileObjs.values()) if ((o.id === ANVIL || o.id === ANVIL2) && abs(o.x * T - f.x) < r * T && abs(o.y * T - f.y) < 22 * T) return o; return null; }
function brBotCraft(f) {
  const br = f.br, bag = br.bag, forge = brForgeNear(f); let best = null, bs = brWorth(f.wid) + .12 + (IT[f.wid] && IT[f.wid].set === br.likes ? .4 : 0);
  for (const m of BR_MAKE) { if (m.forge && !forge || !IT[m.id] || !brHas(bag, m.need)) continue; const s = brWorth(m.id) + (IT[m.id].set === br.likes ? .4 : 0); if (s > bs) { bs = s; best = m; } }
  if (best) { brPay(bag, best.need); br.backup = f.wid === 'fists' ? null : f.wid; f.wid = best.id; if (best.arrows) br.arrows += best.arrows; br.made = (br.made | 0) + 1; if (near(f)) { sfx('craft', 60); sparks(f.x + 3, f.y + 10, 8, 0, 1.6); } return true; }
  // with something to fight with, tools next: a pick for ore, an axe for wood
  if (f.wid !== 'fists' && !br.pick && brHas(bag, { flint: 2, stick: 1, fiber: 3 })) { brPay(bag, { flint: 2, stick: 1, fiber: 3 }); br.pick = 1; return true; }
  if (f.wid !== 'fists' && !br.axe && brHas(bag, { flint: 2, stick: 1, fiber: 3 })) { brPay(bag, { flint: 2, stick: 1, fiber: 3 }); br.axe = 1; return true; }
  if (f.wid !== 'fists' && IT[f.wid].set === 'bow' && br.arrows < 10 && brHas(bag, { stick: 2, flint: 1, fiber: 1 })) { brPay(bag, { stick: 2, flint: 1, fiber: 1 }); br.arrows += 4; return true; }
  return false;
}

// ---------------- seeing ----------------
function wBrSee(f, o) {
  const x0 = f.x + 3, y0 = f.y + 6, x1 = o.x + (o.w || 6) / 2, y1 = o.y + 6, n = ceil(hypot(x1 - x0, y1 - y0) / 7);
  for (let k = 1; k < n; k++) { const u = k / n, t = tileAt(floor(lerp(x0, x1, u) / T), floor(lerp(y0, y1, u) / T)); if (TP[t].solid && t !== PLATFORM && !TP[t].ghost) return false; }
  return true;
}
const brPower = f => (f.hp + (f.ward || 0) * .8) / 100 * (f.fighter ? .55 + brWorth(f === G.p ? (heldOf(f) || {}).id : f.wid) * .45 : (f.dmg || 6) / 11);
// who matters most right now: whoever is hitting me, then the nearest I can see
function brFoe(f) {
  const br = f.br, sight = 230 * wxSight(); let best = null, bd = 1e9;
  for (const o of foesOf(f)) {
    if (o.dead || o.noHit || o.root) continue; const beast = !o.fighter; if (beast && (!o.contact && !(MOBX[o.type] && o.dmg > 0))) continue;
    const dx = abs(o.x - f.x), dy = abs(o.y - f.y); if (dx > (beast ? 80 : sight) || dy > 90) continue;
    let d = dx + dy * 1.5; if (o === f.lastHitBy && f.takenT > 0) d -= 90; if (br.ally && o.lastHitBy === br.ally) d -= 60; if (d < bd && (d < 50 || wBrSee(f, o))) { bd = d; best = o; }
  }
  if (!best && f.lastHitBy && !f.lastHitBy.dead && f.lastHitBy.team !== f.team && f.takenT > 0 && abs(f.lastHitBy.x - f.x) < 300) best = f.lastHitBy;
  return best;
}
// fight or run
function brDares(f, o) {
  // the longer it goes on, the less they weigh it
  const br = f.br, d = abs(o.x - f.x), late = BR.lastAlive <= 4 || BR.ring.n >= 5 ? .5 : BR.t < 60 * 60 * 4 ? 1.9 : [1.55, 1.3, 1.1, .92, .72][BR.ring.n] || 1;
  if (!o.fighter) return f.wid !== 'fists' || d < 26 || f.takenT > 0;
  if (d < 22 && f.takenT > 0) return true;
  if (br.ally && !br.ally.dead && abs(br.ally.x - f.x) < 160) return true;
  const my = brPower(f), his = max(.05, brPower(o)), need = (1.25 - br.bold * .75) * late;
  // two with empty hands would rather find a stick than scrap
  if (f.wid === 'fists' && o.fighter && (o.wid === 'fists' || o === G.p && !(heldOf(G.p) || {}).dmg) && BR.ring.n < 2) return br.bold > .86 && d < 90;
  // hurt is hurt: nobody stays in a fight they can walk out of
  if (f.hp < 46 && d > 22 && br.bold < .82 && BR.ring.n < 4) return false;
  return my / his > need;
}

// ---------------- getting about ----------------
function brBotDig(f, tx, ty) {
  const t = tileAt(tx, ty), q = TP[t]; if (!q.solid || q.ghost || q.liquid || t === BEDROCK || q.hard === Infinity || q.dyn || !inW(tx, ty)) return false;
  const y = MAT[t] && MAT[t].y && MAT[t].y[0] ? MAT[t].y[0][0] : null; breakAt(tx, ty, { noYield: true, quiet: !near(f), by: f }); if (y && IT[y]) f.br.bag[y] = (f.br.bag[y] || 0) + 1; f.throwT = 10; f.throwA = .3; if (near(f)) sfx('mine', 60); return true;
}
// (the pathfinder, navTo in 07-fighters/2-nav.js, was not in the tree when the Wilds came in: once it is, ask it here as the Trials' brWalk does)
function wBrWalk(f, I, gx) {
  const B = f.ai, br = f.br, cx = f.x + 3, d = gx - cx, row = floor((f.y + f.h - 1) / T), tx = floor(cx / T), surfRow = heights[clamp(tx, 0, WBRW - 1)], under = row > surfRow + 4;
  I.md = abs(d) < 5 ? 0 : sign(d); I.jumpH = false; I.down = false; I.wx = cx + I.md * 40; I.wy = f.y + 8;
  const wet = liqAt(cx, f.y + f.h - 5); if (wet) { I.jumpH = true; if (G.time % 20 === 0) I.jumpP = true; }
  if (I.md) {
    const ax = floor((cx + I.md * 8) / T); let rise = 0; for (let k = 0; k < 9; k++) { const t = tileAt(ax, row - k); if (TP[t].solid && t !== PLATFORM && t !== DOORC) rise = k + 1; else break; }
    if (f.onGround && B.jumpCd <= 0 && (rise >= 2 || f.hitWall)) { I.jumpP = I.jumpH = true; B.jumpCd = 16; }
    else if (!f.onGround && f.vy > -.4 && !f.dblUsed && (f.hitWall || rise >= 2) && canDbl(f)) I.jumpP = I.jumpH = true; else if (!f.onGround && f.vy < 0) I.jumpH = true;
    // a fall too long to like: look before stepping off
    if (f.onGround && !under && rise === 0) { let drop = 0; while (drop < 14 && !solidAt(ax, row + 1 + drop) && !platAt(ax, row + 1 + drop)) drop++; if (drop >= 14 && B.jumpCd <= 0) { I.jumpP = I.jumpH = true; B.jumpCd = 20; } }
  }
  const under1 = tileAt(tx, row + 1); if (under1 === PLATFORM && br.goal && br.goal.y !== undefined && br.goal.y > row + 2) I.down = true;
  // not getting anywhere: dig through it, or dig up and out
  if (f.onGround) br.gy = f.y; // (hopping on the spot is not getting anywhere: only where they stand counts)
  if (G.time % 24 === (f.botI | 0) % 24) { if (I.md && abs(cx - br.lx) < 4 && abs(br.gy - br.ly) < 10) br.stuck++; else br.stuck = max(0, br.stuck - 1); br.lx = cx; br.ly = br.gy; }
  if (br.stuck >= 3 && I.md && --br.digT <= 0) {
    br.digT = 9; const ax = tx + I.md; let dug = false; const top = row - 2, climb = under || br.stuck > 6;
    for (const [x, y] of climb ? [[tx, top - 1], [ax, top - 1], [ax, top], [ax, row - 1]] : [[ax, row - 1], [ax, row], [ax, top]]) if (brBotDig(f, x, y)) { dug = true; break; }
    if (climb && f.onGround) { I.jumpP = I.jumpH = true; }
    if (!dug && br.stuck > 9) { if (br.goal) br.skip.set(br.goal.x, BR.t + 1800); br.goal = null; br.roam = null; br.stuck = 0; br.dir = -I.md; br.dirT = 160; }
  }
}
const climbAbove = f => { const cx = floor((f.x + 3) / T), y = floor((f.y + 2) / T); return TP[tileAt(cx, y)].climb || TP[tileAt(cx, y - 1)].climb; };
// out of a hole: dig away what is overhead, jump, and pack earth underfoot, one tile at a time
function brClimbOut(f, I) {
  const B = f.ai, br = f.br, tx = floor((f.x + 3) / T), row = floor((f.y + f.h - 1) / T); I.md = 0; I.down = false; I.jumpH = true; I.wx = f.x + 3; I.wy = f.y - 30;
  // no higher than eight seconds ago: this is no way out. Leave the vines be for a while, go a few paces along, and dig up from there
  if (f.y < br.hi - 3) { br.hi = f.y; br.hiT = G.time; }
  else if (G.time - br.hiT > 480) { br.hiT = G.time; br.hi = f.y + 40; br.noVine = 600; br.hopT = 0; br.pil = -1; br.side = randiF(40, 90); br.sideD = Math.random() < .5 ? -1 : 1; f.climbing = false; }
  if (br.noVine > 0) br.noVine--;
  // vines, ladders and ropes are there to be climbed
  if (climbAt(f) && !(f.letGo > 0) && br.noVine <= 0) {
    br.pil = -1; if (f.onGround && B.jumpCd <= 0) { I.jumpP = true; B.jumpCd = 14; } if (TP[tileAt(tx, row - 3)].solid && --br.digT <= 0) { br.digT = 7; brBotDig(f, tx, row - 3); }
    // the end of this vine: hop across to one that goes higher, or to a ledge, and keep leaning that way in the air
    if (f.climbing && !climbAbove(f)) {
      let top = floor((f.y + 2) / T); while (top < row && !TP[tileAt(tx, top)].climb) top++;
      const room = k => [0, 1, 2, 3].some(q => ![0, 1, 2].some(h => TP[tileAt(tx + k, top + 1 - q - h)].solid)), up = k => room(sign(k)) && [1, 2, 3].some(q => TP[tileAt(tx + k, top - q)].climb), ledge = k => { for (let y = top - 4; y <= top + 1; y++) if (!TP[tileAt(tx + k, y)].solid && !TP[tileAt(tx + k, y - 1)].solid && TP[tileAt(tx + k, y + 1)].solid) return true; return false; };
      const D = [-1, 1, -2, 2], to = D.find(up) || D.find(ledge), leap = B.jumpCd <= 0; if (leap) B.jumpCd = 18; I.jumpP = leap;
      if (to) { I.md = br.hopD = sign(to); br.hopT = 26; }
      // it ends under bare rock: jump straight up, pack earth on top of it, and dig on from there
      else { br.hopT = 0; br.pil = top - 1; if (leap) { I.jumpP = false; f.climbing = false; f.letGo = 14; f.letGoX = tx; f.vy = -3.6; } }
    }
    return I;
  }
  if (br.hopT > 0) { br.hopT--; if (!f.onGround && br.pil < 0) { I.md = br.hopD; return I; } }
  if (liqAt(f.x + 3, f.y + f.h - 5)) { br.pil = -1; br.wetT = (br.wetT | 0) + 1; if (br.wetT % 240 > 170) I.md = (f.botI & 1) ? 1 : -1; return I; }
  if (br.side > 0) { br.side--; wBrWalk(f, I, f.x + 3 + br.sideD * 50); br.stuck = max(br.stuck, 3); return I; }
  if (abs(f.x - (tx * T + 1)) > .6) f.vx = clamp((tx * T + 1 - f.x) * .3, -1, 1); else f.vx = 0;
  if (--br.digT <= 0) { br.digT = 7; for (const k of [3, 4, 5]) if (TP[tileAt(tx, row - k)].solid) { if (!brBotDig(f, tx, row - k)) { br.side = 46; br.sideD = br.sideD ? -br.sideD : f.botI & 1 ? 1 : -1; } break; } }
  if (f.onGround && B.jumpCd <= 0) { I.jumpP = true; B.jumpCd = 14; br.pil = row; }
  if (!f.onGround && br.pil > 0 && f.y + f.h < br.pil * T - .5) { const t = tileAt(tx, br.pil); if (t === AIR || TP[t].decor && !TP[t].dyn) { setTile(tx, br.pil, br.pil > BR_HOT - 20 ? DEEPSTONE : DIRT); if (near(f)) { sfx('place', 60); dust(f.x + 3, br.pil * T + 4, 2); } } br.pil = -1; }
  return I;
}

// ---------------- what to do with no one about ----------------
const brInZone = (x, pad = 30) => { const z = BR.storm; if (brInHazard(x, pad)) return false; return !z || (x > z.L + pad && x < z.R - pad && (!(z.warn || z.moving) || (x > z.nL + pad && x < z.nR - pad))); };
function brSkipped(br, x) { const t = br.skip.get(x); if (t === undefined) return false; if (BR.t > t) { br.skip.delete(x); return false; } return true; }
function brGatherGoal(f) {
  const br = f.br, bag = br.bag, cx = floor((f.x + 3) / T), want = new Set(), armed = f.wid !== 'fists', lim = armed ? 4 : 2;
  if ((bag.stick || 0) < lim + 1) for (const t of [STICKS, BUSH, DEADBUSH, BERRY]) want.add(t); if ((bag.fiber || 0) < lim * 3) for (const t of [TALLGRASS, FLOWER, REED, DEADBUSH]) want.add(t); if ((bag.rock || 0) < 3 || (bag.flint || 0) < lim) want.add(PEBBLE); if ((bag.bone || 0) < 4) want.add(BONES); if (f.hp < 90 || (bag.berries || 0) < 3) { want.add(BERRY); want.add(GLOWCAP); }
  if (br.axe && (bag.log || 0) < 2) for (let d = 2; d < 60; d++) for (const s of [br.dir, -br.dir]) { const x = cx + s * d; if (treeTops.has(x) && !brSkipped(br, x) && brInZone(x * T) && TP[tileAt(x, heights[x] - 1)].stalk) return { kind: 'chop', x, y: heights[x] - 1 }; }
  if (br.pick && Math.random() < .5) { let best = null, bd = 99; for (let x = max(6, cx - 34); x <= min(WBRW - 7, cx + 34); x++) for (let y = heights[x] + 1; y < heights[x] + 8; y++) { const t = tileAt(x, y); if ((t === COPPER || t === TIN || t === COAL || t === IRON) && !brSkipped(br, x) && abs(x - cx) < bd && brInZone(x * T)) { bd = abs(x - cx); best = { kind: 'mine', x, y }; } } if (best) return best; }
  if (want.size) for (let d = 0; d < 110; d++) for (const s of d ? [br.dir, -br.dir] : [1]) { const x = cx + s * d; if (x < 8 || x > WBRW - 9 || brSkipped(br, x) || !brInZone(x * T)) continue; const y = heights[x] - 1, t = tileAt(x, y); if (want.has(t)) return { kind: 'pick', x, y, t }; }
  return null;
}
function brChestGoal(f, reach) {
  const br = f.br, cx = f.x + 3, fy = f.y + f.h; let best = null, bd = 1e9;
  for (const c of BR.chests) { if (c.open || c.hid || c.cave || brSkipped(br, c.x)) continue; const x = c.x * T + 4, dx = abs(x - cx); if (dx > reach || !brInZone(x)) continue; const dy = (c.y + 1) * T - fy; if (dy < -8 * T) continue; const d = dx + abs(dy) * 2; if (d < bd) { bd = d; best = c; } }
  return best ? { kind: 'chest', x: best.x, y: best.y, c: best } : null;
}
function brForgeGoal(f) { const bag = f.br.bag; if (!BR_MAKE.some(m => m.forge && brHas(bag, m.need) && brWorth(m.id) > brWorth(f.wid) + .12)) return null; let best = null, bd = 260; for (const o of tileObjs.values()) if (o.id === ANVIL && abs(o.y - heights[clamp(o.x, 0, WBRW - 1)]) < 12) { const d = abs(o.x - f.x / T); if (d < bd && brInZone(o.x * T)) { bd = d; best = o; } } return best ? { kind: 'forge', x: best.x, y: best.y } : null; }
function brHuntGoal(f) {
  // nobody knows where everyone is, but smoke, birds and noise say roughly where someone is
  let best = null, bd = BR.ring.n >= 3 ? 1e9 : 2600; for (const o of G.fighters) { if (o === f || !o.brIn || o.dead || o.team === f.team || o.noHit) continue; const d = abs(o.x - f.x) * (o === G.p ? 1 : 1.05) + frand(700); if (d < bd) { bd = d; best = o; } }
  return best ? { kind: 'go', x: clamp(floor((best.x + frand(-160, 160)) / T), 12, WBRW - 13) } : null;
}
function brPlan(f) {
  const br = f.br, armed = f.wid !== 'fists', z = BR.storm, r = Math.random(); if (br.dirT > 0) br.dirT -= 40;
  if (!armed) { const c = brChestGoal(f, 200), g = brGatherGoal(f); if (c && (!g || r < .4)) return c; if (g) return g; }
  else {
    const late = BR.ring.n >= 2 || BR.lastAlive <= 10, early = BR.t < 60 * 60 * 3; const forge = brForgeGoal(f); if (forge) return forge;
    if (r < (late ? .16 : early ? .6 : .46)) { const g = brGatherGoal(f); if (g) return g; }
    if (r < (late ? .24 : early ? .74 : .58)) { const c = brChestGoal(f, 460); if (c) return c; }
    if (r < (late ? .56 + br.bold * .28 : early ? 0 : .58 + br.bold * .12)) { const h = brHuntGoal(f); if (h) return h; }
  }
  // otherwise walk: towards a place with a name, or just on
  const L = max(60, z ? z.nL / T : 60), R = min(WBRW - 60, z ? z.nR / T : WBRW - 60), here = BR.pois.filter(q => q.x > L && q.x < R && abs(q.x * T - f.x) < 4200 && !brSkipped(br, q.x)), q = here.length && Math.random() < .45 ? fpick(here) : null;
  if (q) { br.skip.set(q.x, BR.t + 5400); return { kind: 'go', x: clamp(floor(q.x + frand(-24, 24)), 12, WBRW - 13) }; }
  if (Math.random() < .3) br.dir *= -1; return { kind: 'go', x: clamp(floor(f.x / T + br.dir * frand(50, 190)), floor(L), max(floor(L) + 1, floor(R))) };
}
// hands on it: pick, chop, mine or open
function brWork(f, I, g) {
  const br = f.br; I.md = 0; br.workT++; const need = g.kind === 'pick' ? 20 : g.kind === 'chop' ? 110 : g.kind === 'mine' ? 130 : g.kind === 'forge' ? 120 : 4; if (br.workT % 14 === 1 && g.kind !== 'go') { f.throwT = 11; f.throwA = g.kind === 'chop' ? 0 : .7; f.face = g.x * T + 4 >= f.x + 3 ? 1 : -1; if (near(f)) { if (g.kind === 'chop') sfx('chop', 80); else if (g.kind === 'mine') sfx('mine', 80); else if (g.kind === 'forge') sfx('anvil', 120); dust(g.x * T + 4, (g.y + 1) * T - 2, 2, '#8a8296'); } }
  if (br.workT < need) return; br.workT = 0; br.goal = null; br.think = 0;
  if (g.kind === 'pick') { const t = tileAt(g.x, g.y), L = PLUCK[t]; if (L) { for (const [id, a, b] of L) { const n = randiF(a, b); if (n > 0) { if (id === 'glowcap') br.heals += Math.random() < .4 ? 1 : 0; else wBrBotTake(f, id, n); } } setTile(g.x, g.y, t === BERRY ? BUSH : AIR); } else br.skip.set(g.x, BR.t + 3000); }
  else if (g.kind === 'chop') { if (TP[tileAt(g.x, g.y)].stalk) { fell(g.x, g.y, f.face); const q = G.felled[G.felled.length - 1]; if (q) q.noDrop = true; br.bag.log = (br.bag.log || 0) + randiF(2, 4); br.bag.stick = (br.bag.stick || 0) + 2; } br.skip.set(g.x, BR.t + 1e6); }
  else if (g.kind === 'mine') { const t = tileAt(g.x, g.y), id = t === COPPER ? 'copper_ore' : t === TIN ? 'tin_ore' : t === COAL ? 'coal' : t === IRON ? 'iron_ore' : null; if (id) { br.bag[id] = (br.bag[id] || 0) + 3; breakAt(g.x, g.y, { noYield: true, quiet: true, by: f }); for (let y = heights[g.x]; y < g.y; y++) if (hh(g.x, y, 5) < .6) brBotDig(f, g.x, y); } else br.skip.set(g.x, BR.t + 2400); }
  else if (g.kind === 'chest') { if (!g.c.open) wBrOpenChest(g.c, f); }
  brBotCraft(f);
}

// ---------------- each tick ----------------
function wBrBotThink(f) {
  const B = f.ai, I = B.I, br = f.br;
  I.lp = I.rp = I.jumpP = I.dodgeP = I.armP = false; I.l = I.r = false;
  if (f.dead) { I.md = 0; return I; }
  if (f.glide) { const dx = f.slotX + sin(f.botI * 7) * 160 - (f.x + 3); I.md = abs(dx) > 14 ? sign(dx) : 0; I.down = f.y < heights[clamp(floor(f.x / T), 0, WBRW - 1)] * T - 150 && (f.botI & 3) !== 0; I.jumpH = false; return I; }
  if (f.brUse) { I.md = 0; return I; }
  const z = BR.storm, cx = f.x + 3, out = wBrOut(f) || (z && (z.dps > 0 || z.moving) && (cx < z.L + 8 || cx > z.R - 8)), row = (f.y + f.h) / T;
  if (br.ally && (br.ally.dead || br.ally.gone || br.ally.team !== f.team)) { br.ally = null; if (f.team !== f.botTag && !(BR.teammate === f.botTag)) f.team = f.botTag; }
  if ((G.time + f.botI) % 6 === 0) { br.foe = brFoe(f); if (br.foe && !brDares(f, br.foe)) { if (abs(br.foe.x - f.x) < 170 && (br.foe.fighter || abs(br.foe.x - f.x) < 60)) { br.flee = 130; br.from = br.foe; } br.foe = null; } }
  const foe = br.foe && !br.foe.dead && !br.foe.noHit ? br.foe : null;
  // a bow with no arrows is a stick
  if (br.dry) { br.dry = false; if (IT[f.wid] && IT[f.wid].set === 'bow' && br.arrows <= 0) { br.bag[f.wid] = 1; f.wid = br.backup || 'fists'; br.backup = null; } }
  if (foe && !(out && z && z.dps >= 4) && row < BR_HOT - 4) { br.goal = null; br.workT = 0; f.climbing = false; if (B.tgt !== foe) { B.tgt = foe; B.retarget = 40; } return aiThink(f); }
  if (B.atkCd > 0) B.atkCd--; if (B.jumpCd > 0) B.jumpCd--;
  const pit = row - heights[clamp(floor(cx / T), 0, WBRW - 1)];
  // caught inside something that fell or was built there
  if (G.time % 10 === f.botI % 10 && boxHits(f.x, f.y, f.w, f.h)) { let free = false; for (let y = floor(f.y / T); y <= floor((f.y + f.h - .01) / T); y++) for (let x = floor(f.x / T); x <= floor((f.x + f.w - .01) / T); x++) if (solidAt(x, y) && brBotDig(f, x, y)) free = true; if (!free) f.y -= T; }
  // run
  if (pit > 9) br.flee = 0;
  if (br.flee > 0 && br.from && !br.from.dead) { br.flee--; const away = sign(cx - br.from.x) || 1; wBrWalk(f, I, cx + away * 80); if (br.flee % 50 === 25 && f.stam > 40 && abs(br.from.x - f.x) < 70) I.dodgeP = true; if (!brInZone(cx + away * 60, 10)) br.flee = 0; return I; }
  // mend
  if (f.onGround && !out && f.hurtT <= 0) {
    if ((f.hp < 70 && br.heals > 0) || ((f.ward || 0) < 50 && br.wards > 0)) { wBrStartUse(f, f.hp < 70 && br.heals > 0 ? 'br_salve' : 'br_shard'); I.md = 0; return I; }
    if (f.hp < 85 && br.eatT < BR.t) { const id = ['berries', 'egg', 'meat'].find(k => (br.bag[k] || 0) > 0); if (id) { br.bag[id]--; br.eatT = BR.t + 200; f.hp = min(100, f.hp + 7); } else if (f.takenT <= 0) { br.eatT = BR.t + 150; f.hp = min(100, f.hp + 1); } }
  }
  // up and out of the heat, or a hole
  { const deep = pit; if (row > BR_HOT - 22 || deep > 9 || br.out && deep > 1) { if (!br.out) { br.hi = f.y + 1; br.hiT = G.time; br.noVine = 0; } br.out = true; br.goal = null; return brClimbOut(f, I); } br.out = false; }
  if (out || (z && (z.warn || z.moving) && (cx < z.nL + 20 || cx > z.nR - 20) && (z.moving || z.left < 60 * 24))) { br.goal = null; wBrWalk(f, I, clamp(cx, z.nL + 120, z.nR - 120)); return I; }
  if (brInHazard(cx) && BR.hazard) { br.goal = null; wBrWalk(f, I, cx - BR.hazard.L < BR.hazard.R - cx ? BR.hazard.L - 60 : BR.hazard.R + 60); return I; }
  // with an ally: stay close, and watch what they are fighting
  if (br.ally && (!br.ally.brBot || br.ally.botI < f.botI)) {   // (of two echoes, one leads)
    const a = br.ally, dx = a.x - f.x; if (brLoyal(f)) { if (abs(dx) > 70 || abs(a.y - f.y) > 60) { wBrWalk(f, I, a.x + 3 - sign(dx) * 26); return I; } if (f.wid !== 'fists') { I.md = 0; if (abs(dx) > 34) wBrWalk(f, I, a.x + 3 - sign(dx) * 30); return I; } }
  }
  if (!br.goal || --br.think <= 0) { br.goal = br.goal && br.workT > 0 ? br.goal : brPlan(f); br.think = 420 + randiF(0, 200); br.workT = 0; br.stuck = 0; if ((G.time + f.botI) % 2 === 0) brBotMeet(f); }
  const g = br.goal, gx = g.x * T + 4; if (g.y !== undefined ? abs(gx - cx) < 9 && abs((g.y + 1) * T - (f.y + f.h)) < (g.kind === 'mine' ? 76 : 18) : abs(gx - cx) < 12) { if (g.kind === 'go') { br.goal = null; I.md = 0; return I; } brWork(f, I, g); return I; }
  wBrWalk(f, I, gx);
  // over or under it and no way to it: let it go
  if (g.y !== undefined && abs(gx - cx) < 12) { if (++br.off > 50) { br.off = 0; br.skip.set(g.x, BR.t + 3600); br.goal = null; } } else br.off = 0;
  return I;
}
function wBrBotAfter(f) { wBrGlide(f, f.ai.I); wBrTickUse(f); }

// ---------------- pacts with echoes ----------------
function brBotAgrees(bot, p) {
  const br = bot.br; if (!br || br.ally || bot.dead || BR.lastAlive <= 4 || (bot.lastHitBy === p && bot.takenT > 0) || BR.t - br.asked < 900 || BR.t - br.spurned < 5400) return false;
  return br.roll < .82 - br.bold * .6 + (bot.hp < 50 ? .18 : 0) + (p.kills > 1 ? .06 : 0);
}
// an echo may turn on you near the end, if it was always that kind of echo
function brLoyal(f) {
  const br = f.br, a = br.ally; if (br.bold < .62 || BR.lastAlive > 6 || BR.t - br.allyT < 2400 || (BR.t + f.botI * 37) % 600) return true; if (Math.random() > .12) return true;
  if (a === G.p) { brBreakPact(true, true); brSay(f.name + ' TURNS ON YOU', 200); sfx('roar', 0); G.kfeed.unshift({ a: '', b: f.name, t: 0, me: 2, txt: 'broke the pact with ' + a.name }); } else if (a.br) { a.br.ally = null; a.team = a.botTag; }
  f.team = f.botTag; br.ally = null; br.foe = a; return false;
}
// two wary echoes who meet may go on together
function brBotMeet(f) {
  const br = f.br; if (br.ally || br.bold > .6 || BR.lastAlive < 9 || Math.random() > .25) return;
  for (const o of G.fighters) { if (o === f || !o.brBot || o.dead || o.remote || !o.br || o.br.ally || o.br.bold > .6 || o.team === f.team || hypot(o.x - f.x, o.y - f.y) > 130 || o.lastHitBy === f || f.lastHitBy === o) continue; const team = brPactTeam(f.botTag, o.botTag); f.team = o.team = team; br.ally = o; o.br.ally = f; br.allyT = o.br.allyT = BR.t; if (near(f)) { G.kfeed.unshift({ a: '', b: f.name, t: 0, me: 0, txt: 'and ' + o.name + ' have a pact' }); if (G.kfeed.length > 6) G.kfeed.length = 6; } return; }
}
