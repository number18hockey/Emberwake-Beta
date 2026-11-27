// ============================================================
//  The FFA arcade: ten weapon-focused ring variants, local records,
//  and the shared private-match flow.
// ============================================================
const FFA_MODES = [
  { id: 'crystal', name: 'CRYSTAL PVP', desc: 'Place, blast, and out-position.', color: '#c77dff', weapons: ['steel_sword', 'iron_sword'], arms: ['flask'], map: 'crystal' },
  { id: 'sword', name: 'SWORD FFA', desc: 'Combos, timing, and footwork.', color: '#ff8a3d', weapons: ['bronze_sword', 'iron_sword', 'steel_sword'], arms: ['shuriken'], map: 'sword' },
  { id: 'mace', name: 'MACE FFA', desc: 'Rise high. Land heavy.', color: '#ffd35a', weapons: ['copper_mace', 'rust_mace', 'deep_warhammer'], arms: ['shuriken'], map: 'mace' },
  { id: 'spear', name: 'SPEAR FFA', desc: 'Own the lane. Strike at reach.', color: '#8ff5e6', weapons: ['spear', 'iron_spear', 'steel_halberd'], arms: ['javelin'], map: 'spear' },
  { id: 'grapple', name: 'GRAPPLE FFA', desc: 'Hook in, swing, reposition.', color: '#7ddc6f', weapons: ['sword', 'iron_sword'], arms: ['hook'], map: 'grapple' },
  { id: 'bow', name: 'BOW FFA', desc: 'Aim ahead. Make every shot count.', color: '#5aa8ff', weapons: ['bow', 'wood_shortbow', 'bone_recurve'], arms: ['shuriken'], map: 'bow' },
  { id: 'axe', name: 'AXE FFA', desc: 'Slow swings. Brutal close-range hits.', color: '#e2483b', weapons: ['battleaxe', 'iron_battleaxe', 'steel_greataxe'], arms: ['shuriken'], map: 'axe' },
  { id: 'shield', name: 'SHIELD & SWORD', desc: 'Guard, wait, then counterattack.', color: '#b9bdd0', weapons: ['bronze_sword', 'iron_sword'], arms: ['smoke'], map: 'shield' },
  { id: 'knockback', name: 'KNOCKBACK', desc: 'Send rivals off the floating ring.', color: '#ff6b6b', weapons: ['club', 'maul', 'nunchaku'], arms: ['hook'], map: 'knockback' },
  { id: 'random', name: 'RANDOM LOADOUT', desc: 'A new balanced kit each respawn.', color: '#fff1a8', weapons: ['sword', 'spear', 'fangs', 'maul', 'bow', 'nunchaku', 'iron_sword', 'iron_spear', 'copper_mace', 'iron_battleaxe'], arms: ['shuriken', 'hook', 'flask', 'smoke'], map: 'random' }
];
const FFA = { selected: 'crystal', mode: 'crystal', active: false, private: false, resetAt: 0, resetN: 0, winRound: -1, crystals: [], crystalCd: 0, cloudTimer: 0 };
const ffaMode = id => FFA_MODES.find(m => m.id === id) || FFA_MODES[0];
const ffaStatsKey = owner => 'ew2.ffa.' + owner;

function ffaStats() {
  const owner = typeof accountId === 'function' ? accountId() : 'guest';
  try {
    const raw = typeof LS === 'object' ? JSON.parse(LS.get(ffaStatsKey(owner)) || '{}') : {};
    const modes = {};
    for (const m of FFA_MODES) {
      const s = raw.modes && raw.modes[m.id] || {};
      modes[m.id] = { kills: max(0, num(s.kills) | 0), deaths: max(0, num(s.deaths) | 0), wins: max(0, num(s.wins) | 0), matches: max(0, num(s.matches) | 0), elo: clamp(num(s.elo, 1000) | 0, 0, 9999) };
    }
    return { modes, updatedAt: max(0, num(raw.updatedAt)) };
  } catch (e) {
    return { modes: Object.fromEntries(FFA_MODES.map(m => [m.id, { kills: 0, deaths: 0, wins: 0, matches: 0, elo: 1000 }])), updatedAt: 0 };
  }
}
function ffaSaveStats(data = ffaStats(), sync = true) {
  const owner = typeof accountId === 'function' ? accountId() : 'guest', key = ffaStatsKey(owner);
  data.updatedAt = Date.now();
  if (typeof LS === 'object' && !LS.set(key, JSON.stringify(data))) { console.warn('Could not save FFA progression in this browser.'); return false; }
  if (sync && SAVE.db && typeof dpath === 'function') {
    clearTimeout(FFA.cloudTimer);
    FFA.cloudTimer = setTimeout(() => {
      if (!SAVE.db || accountId() !== owner) return;
      SAVE.db.doc(dpath('ffa-profile', owner)).set(data).catch(e => console.warn('Could not sync FFA progression:', e));
    }, 800);
  }
  return true;
}
async function ffaSyncProfile(owner) {
  if (!SAVE.db || typeof dpath !== 'function') return;
  const db = SAVE.db, ref = db.doc(dpath('ffa-profile', owner));
  try {
    const snap = await withTimeout(ref.get(), 9000);
    if (accountId() !== owner || SAVE.db !== db) return;
    const local = ffaStats(), remote = snap && snap.exists ? snap.data() : null;
    if (remote && num(remote.updatedAt) > local.updatedAt && remote.modes && typeof remote.modes === 'object') ffaSaveStats(remote, false);
    else await withTimeout(ref.set(local), 9000);
  } catch (e) { console.warn('Could not load cloud FFA progression:', e); }
}
function ffaModeStats(id = FFA.mode) { return ffaStats().modes[id] || { kills: 0, deaths: 0, wins: 0, matches: 0, elo: 1000 }; }
function ffaRecord(type) {
  if (!FFA.active || !G.p) return;
  const data = ffaStats(), stat = data.modes[FFA.mode];
  if (type === 'kill') {
    stat.kills++; stat.elo = min(9999, stat.elo + 2);
    if (typeof brProfile === 'function' && typeof brSaveProfile === 'function') { const p = brProfile(); p.souls++; brSaveProfile(p); }
  } else if (type === 'death') {
    stat.deaths++; stat.elo = max(0, stat.elo - 1);
  } else if (type === 'match') {
    stat.matches++;
    if (typeof brProfile === 'function' && typeof brSaveProfile === 'function') { const p = brProfile(); p.coins++; brSaveProfile(p); }
  }
  else if (type === 'win') {
    stat.wins++; stat.elo = min(9999, stat.elo + 12);
    if (typeof brProfile === 'function' && typeof brSaveProfile === 'function') { const p = brProfile(); p.coins += 3; brSaveProfile(p); }
  } else return;
  ffaSaveStats(data);
}
function ffaWeaponIds(id = FFA.mode) {
  const mode = ffaMode(id);
  const available = mode.weapons.filter(item => IT[item] && IT[item].type === 'weapon');
  return available.length ? available : ['sword'];
}
function ffaArms(id = FFA.mode) {
  const mode = ffaMode(id);
  return mode.arms.filter(item => IT[item] && IT[item].type === 'arm');
}
function ffaEquip(f) {
  const weapons = ffaWeaponIds(), item = fpick(weapons);
  if (f === G.p) {
    inv = new Array(INV_N).fill(null);
    const kit = FFA.mode === 'random' ? [item] : weapons.slice(0, 5);
    kit.forEach((id, i) => { if (i < hotN()) inv[i] = { id, n: 1 }; });
    G.sel = 0;
    f.arm = ffaArms()[0] || null;
    if (FFA.mode === 'bow' && IT.arrow) inv[5] = { id: 'arrow', n: 40 };
  } else {
    f.wid = item;
    f.arms = ffaArms();
  }
}
function ffaStart(mode, via = 'solo') {
  const selected = ffaMode(mode).id;
  FFA.selected = selected; FFA.mode = selected; FFA.private = via === 'rtc'; FFA.active = true; FFA.resetN = 0; FFA.winRound = -1;
  FFA.resetAt = selected === 'crystal' ? Date.now() + 10 * 60 * 1000 : 0; FFA.crystals.length = 0; FFA.crystalCd = 0;
  ffaRecord('match');
}
function ffaResetArena() {
  FFA.crystals.length = 0;
  genArena(FFA.mode);
  G.drops.length = 0; G.projs.length = 0; G.smokes.length = 0; G.parts.length = 0;
  for (const f of G.fighters) if (!f.remote) arenaRespawn(f);
  FFA.resetN++; FFA.resetAt = Date.now() + 10 * 60 * 1000;
  G.banner = { text: 'CRYSTAL ARENA RESET', sub: 'arena restored · fighters returned to spawn', t: 0 };
  sfx('quest', 0);
}
function ffaTick() {
  if (FFA.crystalCd > 0) FFA.crystalCd--;
  if (!FFA.active || FFA.mode !== 'crystal' || !FFA.resetAt || Date.now() < FFA.resetAt) return;
  ffaResetArena();
}
function ffaCrystalAction() {
  if (!FFA.active || FFA.mode !== 'crystal' || UI.open || G.dialog || !pressed.KeyF || FFA.crystalCd > 0) return;
  const p = G.p, owner = NET.me || 'local', near = FFA.crystals.findIndex(c => c.owner === owner && hypot(c.x - p.x, c.y - p.y) < 96);
  if (near >= 0) {
    const crystal = FFA.crystals.splice(near, 1)[0];
    for (const [tx, ty, old] of crystal.cells) setTile(tx, ty, old);
    burst(crystal.x, crystal.y, 36, ['#c77dff', '#8ff5e6', '#fff1a8'], 3, 60, { glow: 1, g: -.02 });
    for (const f of G.fighters) {
      if (f.dead || f.gone) continue;
      const d = hypot(f.x + 3 - crystal.x, f.y + f.h / 2 - crystal.y);
      if (d > 92) continue;
      const dmg = max(6, round(28 * (1 - d / 120)));
      const kx = sign(f.x + 3 - crystal.x) * (4 - d / 40);
      if (f.remote) netHit(f, dmg, kx, -3, true, null, p);
      else hurtFighter(f, dmg, crystal.x, { kx, ky: -3, by: p, pvp: true, crit: true });
    }
    FFA.crystalCd = 18; sfx('boom', 0); return;
  }
  if (FFA.crystals.length >= 3) { say('Three crystals are already set. Detonate one with [F].'); return; }
  const tx = clamp(floor((p.x + 3 + p.face * 22) / T), 3, WW - 4);
  let surface = clamp(floor((p.y + p.h) / T), 1, WH - 5);
  while (surface < WH - 4 && tileAt(tx, surface) === AIR) surface++;
  surface--;
  const cells = [[tx, surface - 1], [tx, surface - 2], [tx, surface - 3]];
  if (cells.some(([cx, cy]) => cy < 1 || tileAt(cx, cy) !== AIR)) { say('There is no room to place a crystal here.'); return; }
  for (let i = 0; i < cells.length; i++) {
    const [cx, cy] = cells[i]; cells[i].push(tiles[cy * WW + cx]); setTile(cx, cy, i === 2 ? CRYSTAL : BRICK);
  }
  FFA.crystals.push({ x: tx * T + 4, y: (surface - 2) * T, tx, surface, owner, cells });
  FFA.crystalCd = 24; sfx('place', 0);
}
function ffaSyncPeerCrystals(f, source) {
  if (!FFA.active || FFA.mode !== 'crystal' || !Array.isArray(source)) return;
  const data = source.slice(0, 3).filter(q => Array.isArray(q) && q.length >= 2).map(q => [clamp(num(q[0]) | 0, 3, WW - 4), clamp(num(q[1]) | 0, 4, WH - 5)]);
  const key = JSON.stringify(data);
  if (f.ffaCrystalKey === key) return;
  const old = FFA.crystals.filter(c => c.owner === f.peer);
  for (const c of old) for (const [tx, ty, tile] of c.cells) setTile(tx, ty, tile);
  FFA.crystals = FFA.crystals.filter(c => c.owner !== f.peer);
  for (const [tx, surface] of data) {
    const cells = [[tx, surface - 1], [tx, surface - 2], [tx, surface - 3]];
    if (cells.some(([cx, cy]) => cy < 1 || tileAt(cx, cy) !== AIR)) continue;
    for (let i = 0; i < cells.length; i++) { const [cx, cy] = cells[i]; cells[i].push(tiles[cy * WW + cx]); setTile(cx, cy, i === 2 ? CRYSTAL : BRICK); }
    FFA.crystals.push({ x: tx * T + 4, y: (surface - 2) * T, tx, surface, owner: f.peer, cells });
  }
  f.ffaCrystalKey = key;
}
function ffaModeLabel(id = FFA.mode) { return ffaMode(id).name; }

function ffaEnter(mode, privateMatch = false) {
  const selected = ffaMode(mode).id;
  UI.focus = null;
  const nick = cleanName(FORM.nick) || 'WAKER'; FORM.nick = nick; G.nick = nick; G.skin = FORM.skin | 0;
  FFA.selected = selected;
  G.state = 'loading'; G.loadMsg = privateMatch ? 'Opening your private FFA...' : 'Entering the FFA arena...';
  setTimeout(() => {
    if (privateMatch) { coopReset(); COOP.ffaMode = selected; enterArena(nick, FORM.skin, 'friends', 'rtc', selected); }
    else enterArena(nick, FORM.skin, 'ffa-' + selected, 'room', selected);
  }, 30);
  sfx('quest', 0);
}
function ffaQuickPlay() {
  const mode = fpick(FFA_MODES);
  ffaEnter(mode.id);
}
function drawFFAMenu(c) {
  const uw = VS.uw, uh = VS.uh, w = min(620, uw - 12), h = min(320, uh - 10), x = round((uw - w) / 2), y = max(5, round((uh - h) / 2));
  c.fillStyle = 'rgba(18,13,31,.7)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'THE FFA ARCADE  ·  10 MODES');
  const fx = x + 8, fw = w - 16, mode = ffaMode(FFA.selected), skinY = y + 20;
  drawText(c, 'NAME', fx, skinY + 4, '#b9bdd0'); field(c, fx + 40, skinY, min(160, fw - 145), 'nick', 'WAKER'); skinPicker(c, x + w - 130, skinY - 2);

  const colGap = 6, cardW = floor((fw - colGap) / 2), cardH = 22, listY = y + 43;
  for (let i = 0; i < FFA_MODES.length; i++) {
    const m = FFA_MODES[i], col = i < 5 ? 0 : 1, row = i % 5, cx = fx + col * (cardW + colGap), cy = listY + row * 23;
    const selected = m.id === FFA.selected;
    c.fillStyle = selected ? '#3a3020' : 'rgba(32,27,45,.92)'; c.fillRect(cx, cy, cardW, cardH);
    c.fillStyle = selected ? m.color : '#4a4460'; c.fillRect(cx, cy, 2, cardH);
    c.fillStyle = m.color; c.fillRect(cx + 6, cy + 6, 8, 8); c.fillStyle = INK; c.fillRect(cx + 8, cy + 8, 4, 4);
    drawText(c, m.name, cx + 19, cy + 3, selected ? '#fff1a8' : '#fff');
    let desc = m.desc; while (desc.length > 4 && textW(desc) > cardW - 25) desc = desc.slice(0, -1);
    drawText(c, desc, cx + 19, cy + 12, '#8b8fa3');
    const count = '3 BOTS'; drawText(c, count, cx + cardW - textW(count) - 4, cy + 3, '#7ddc6f');
    hit(cx, cy, cardW, cardH, () => { FFA.selected = m.id; sfx('ui'); });
  }
  const stats = ffaModeStats(mode.id), ratio = stats.deaths ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toFixed(2);
  const infoY = listY + 5 * 23 + 4;
  drawText(c, `${mode.name}   ${mode.desc}`, fx, infoY, mode.color);
  drawText(c, `K ${stats.kills}  D ${stats.deaths}  W ${stats.wins}  MATCHES ${stats.matches}  K/D ${ratio}  ELO ${stats.elo}`, fx, infoY + 10, '#d8d4e6');
  const best = FFA_MODES.map(m => ({ name: m.name, elo: ffaModeStats(m.id).elo })).sort((a, b) => b.elo - a.elo)[0];
  drawText(c, `PERSONAL LEADERBOARD  ·  TOP ${best.name} ${best.elo} ELO  ·  QUICK PLAY picks a random mode`, fx, infoY + 20, '#8b8fa3');
  const milestones = [stats.kills >= 10 && '10 KILLS', stats.wins >= 1 && 'FIRST WIN', stats.matches >= 10 && '10 MATCHES'].filter(Boolean);
  drawText(c, `MILESTONES  ·  ${milestones.length ? milestones.join('  ·  ') : 'First win, 10 kills, 10 matches'}`, fx, infoY + 30, '#ffd35a');
  const actionY = y + h - 38;
  button(c, fx, actionY, floor((fw - 8) / 2), 16, 'PLAY ' + mode.name, () => ffaEnter(mode.id), { col: mode.color });
  button(c, fx + floor((fw - 8) / 2) + 8, actionY, floor((fw - 8) / 2), 16, 'QUICK PLAY  ·  RANDOM MODE', ffaQuickPlay, { col: '#ffd35a' });
  if (netOK()) {
    button(c, fx, actionY + 19, floor((fw - 8) / 2), 15, 'HOST PRIVATE MATCH  ·  CODE', () => ffaEnter(mode.id, true), { col: '#8ff5e6' });
    drawText(c, 'Friends: title screen → JOIN A FRIEND → enter your code.', fx + floor((fw - 8) / 2) + 8, actionY + 23, '#8b8fa3');
  } else drawText(c, 'Private matches need WebRTC. Practice is ready offline with 3 bots.', fx, actionY + 23, '#8b8fa3');
  button(c, x + w - 66, y + h - 18, 58, 13, 'BACK', () => { G.state = 'title'; UI.focus = null; sfx('ui'); });
}
