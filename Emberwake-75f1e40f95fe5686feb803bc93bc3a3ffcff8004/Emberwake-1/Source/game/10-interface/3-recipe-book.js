// ============================================================
//  The recipe book [B], the bench filters, and the trinket slots.
//  The book lists every bench with what it is for and everything it
//  makes, green where you have enough. A bench with a long list gets a
//  SHOW button (weapons, tools, armour...) and a CAN MAKE switch.
// ============================================================
const CAT_N = { all: 'ALL', weapons: 'WEAPONS', tools: 'TOOLS', armour: 'ARMOUR', blocks: 'BLOCKS', food: 'FOOD', gear: 'GEAR', trinkets: 'TRINKETS', offerings: 'OFFERINGS', materials: 'MATERIALS' };
function catOf(r) {
  const it = r.out && IT[r.out]; if (!it) return 'materials'; const t = it.type;
  return t === 'weapon' ? 'weapons' : t === 'tool' ? 'tools' : t === 'armor' ? 'armour' : t === 'block' || t === 'wall' ? 'blocks' : t === 'food' || t === 'heal' ? 'food'
    : t === 'trinket' ? 'trinkets' : t === 'util' || t === 'arm' ? 'gear' : t === 'offering' || t === 'summon' || t === 'key' ? 'offerings' : 'materials';
}
// the SHOW and CAN MAKE buttons over a station's list; returns the list they leave
function stnFilterOf(list) {
  const cats = ['all']; for (const e of list) { const k = catOf(e.r); if (!cats.includes(k)) cats.push(k); }
  if (!cats.includes(UI.stnCat)) UI.stnCat = 'all';
  if (!(cats.length > 2 || list.length > 8)) return { list, dy: 0, cats };
  return { list: list.filter(e => (UI.stnCat === 'all' || catOf(e.r) === UI.stnCat) && (!UI.stnCan || e.can)), dy: KIT.sm + 4, cats };
}
function stnFilter(c, L, list) {
  const F0 = stnFilterOf(list), cats = F0.cats; if (!F0.dy) return F0;
  const half = (L.w - KIT.sizes.gap) >> 1, two = cats.length > 2;
  if (two) pbtn(c, L.x, L.y, half, KIT.sm, 'SHOW: ' + CAT_N[UI.stnCat], () => { UI.stnCat = cats[(cats.indexOf(UI.stnCat) + 1) % cats.length]; UI.scroll = 0; sfx('ui'); }, { on: UI.stnCat !== 'all', tag: 'btn:SHOW', hint: 'Show one kind of thing: ' + cats.map(k => CAT_N[k].toLowerCase()).join(', ') + '.' });
  pbtn(c, L.x + (two ? half + KIT.sizes.gap : 0), L.y, two ? half : L.w, KIT.sm, UI.stnCan ? 'CAN MAKE: ON' : 'CAN MAKE: OFF', () => { UI.stnCan = !UI.stnCan; UI.scroll = 0; sfx('ui'); }, { on: !!UI.stnCan, tag: 'btn:CAN MAKE', hint: 'Only what you can make now.' });
  return F0;
}
function recipeLevelOk(r) {
  if (!r.lvl) return true;
  if (r.st === 'anvil') return anvilNear() >= r.lvl;
  if (r.st === 'pot') {
    const lvl = nearStation(MOON_CAULDRON) ? 3 : nearStation(BREW_STAND) ? 2 : nearStation(CAULDRON) ? 1 : 0;
    return lvl >= r.lvl;
  }
  return true;
}
function recipeTip(r, lvlOk = true) {
  const outId = r.out || Object.keys(r.need)[0], lines = r.out ? itemTip(IT[r.out]) : [['Sift ' + IT[outId].name.toLowerCase(), '#ffd35a']];
  if (!r.out && r.loot) lines.push(['Possible: ' + r.loot.map(l => IT[l[0]].name).join(', '), '#b9bdd0']);
  const checks = craftChecks(r), status = (WORLD.mode === 1 || (lvlOk && checks.every(q => q.have >= q.need))) ? 'READY TO CRAFT' : !lvlOk ? 'MISSING LEVEL REQUIREMENT' : 'MISSING MATERIALS';
  lines.unshift([status, status === 'READY TO CRAFT' ? '#7ddc6f' : '#e2483b']);
  for (const q of checks) {
    const name = q.kind === 'fuel' ? 'fuel units' : IT[q.id].name + (q.kind === 'kept' ? ' (kept)' : '');
    for (const l of wrapText(`${q.have}/${q.need} ${name}`, 180)) lines.push([l, q.have >= q.need ? '#7ddc6f' : '#e2483b']);
  }
  if (r.lvl) {
    const levels = LVL_NEED[r.st === 'armr' ? 'armr' : r.st === 'pot' ? 'pot' : 'anvil'];
    lines.push([`${lvlOk ? 'Level met:' : 'Needs:'} ${levels[r.lvl]}`, lvlOk ? '#7ddc6f' : '#e2483b']);
  }
  if (r.temp && !craftEasy()) lines.push([`needs heat ${r.temp}${r.shut ? ', damper shut' : ''}`, '#ff8a3d']);
  if (r.t) lines.push([`takes ${round(r.t / 60)}s`, '#8ff5e6']);
  if (r.band) lines.push([`heat band ${r.band}`, '#ff8a3d']);
  return lines;
}
function drawRecipeRow(c, r, x, y, w, lvlOk = true) {
  const checks = craftChecks(r), can = WORLD.mode === 1 || (lvlOk && checks.every(q => q.have >= q.need));
  const status = can ? 'READY' : !lvlOk ? 'NEEDS LEVEL' : 'MISSING', statusCol = can ? '#7ddc6f' : '#e2483b';
  const outId = r.out || Object.keys(r.need)[0], label = r.out ? IT[r.out].name : 'Sift ' + IT[outId].name.toLowerCase();
  const sx = x + w - textW(status) - 4;
  c.save(); c.beginPath(); c.rect(x + 21, y, max(0, sx - x - 24), 9); c.clip();
  drawText(c, label, x + 21, y + 1, can ? '#fff' : '#8b8fa3'); c.restore();
  drawText(c, status, sx, y + 1, statusCol);
  let nx = x + 21; const right = x + w - 5;
  for (let i = 0; i < checks.length; i++) {
    const q = checks[i], name = q.kind === 'fuel' ? 'fuel' : IT[q.id].name + (q.kind === 'kept' ? ' kept' : '');
    const text = `${q.have}/${q.need} ${name}`, color = q.have >= q.need || WORLD.mode === 1 ? '#7ddc6f' : '#e2483b';
    const width = textW(text);
    if (nx + width > right) { drawText(c, `+${checks.length - i}`, nx, y + 10, '#8b8fa3'); break; }
    drawText(c, text, nx, y + 10, color); nx += width + 4;
  }
  if (r.lvl && !lvlOk && nx + 22 < right) drawText(c, 'level', nx, y + 10, '#e2483b');
}
// where a station's recipe row sits on screen (in UI units), for whoever wants to click it
function stnRowXY(kind, t, pick) {
  const { L } = stnLay(), F0 = stnFilterOf(stnList(kind, t)), k = F0.list.findIndex(pick);
  return k < 0 ? null : [L.x + 30, L.y + F0.dy + (k - UI.scroll) * 19 + 9];
}
// ---------------- the book ----------------
// THE RECIPE BOOK: two facing pages and a spine. The benches on the left page, the chosen bench's work on the right;
// choosing a bench sweeps a light across the right page.
function drawBook(c) {
  if (!UI.bookSt) UI.bookSt = 'hand';
  const S = KIT.sizes, mode = menuMode(), F = menuFrame('book', 460, mode === 'narrow' ? 420 : 320), K = pcard(c, 'book', 0, 0, kb('RECIPE BOOK  [B]', 'RECIPE BOOK'), { frame: F }), now = performance.now();
  const x = K.x, y = K.y, w = K.w, h = K.h, lw = mode === 'narrow' ? 108 : 122, top = K.by - 2, bot = y + h - 16, ph = bot - top;
  // the pages and the spine
  c.fillStyle = '#1d1a29'; c.fillRect(x + 4, top, lw + 2, ph); c.fillRect(x + lw + 12, top, w - lw - 16, ph);
  c.fillStyle = '#2b2740'; c.fillRect(x + lw + 6, top, 6, ph); c.fillStyle = rgbaHex(KIT.col, .35); c.fillRect(x + lw + 8, top, 2, ph);
  let tip = null;
  const rh = KIT.T ? 22 : clamp(floor(ph / BENCHES.length), 11, 14), LB = { x: x + 5, y: top + 1, w: lw, h: ph - 2 };
  plist(c, LB, BENCHES.length, rh, 'bookL', (k, by) => {
    const b = BENCHES[k], on = UI.bookSt === b.st, built = b.st === 'hand' || (b.item && (G.flags['placed_' + b.item] || hasItem(b.item) || WORLD.mode === 1));
    krow(c, LB.x, by - 2, lw - 3, rh - 1, () => { if (UI.bookSt !== b.st) { UI.bookSt = b.st; UI.scroll = 0; PANEL.bookT = performance.now(); sfx('ui'); } }, { sel: on, tag: 'row:bench:' + b.st, hint: b.d });
    drawText(c, fitText(b.n, lw - 12), LB.x + 5, by - 2 + ((rh - 9) >> 1), on ? KIT.col : built ? '#fff' : '#8b8fa3');
  });
  const B = BENCHES.find(b => b.st === UI.bookSt) || BENCHES[0], rx = x + lw + 16, rw = w - lw - 24; let ry = top + 3;
  for (const l of wrapC(B.d, rw)) { drawText(c, l, rx, ry, '#b9bdd0'); ry += 9; }
  const br = B.item && RECIPES.find(r => r.out === B.item);
  if (br) { const s = 'Build one at the ' + benchName(br.st) + ': ' + Object.keys(br.need).map(k => br.need[k] + ' ' + IT[k].name.toLowerCase()).join(', ') + '.'; for (const l of wrapC(s, rw)) { drawText(c, l, rx, ry, '#8ff5e6'); ry += 9; } }
  ry += 3;
  const list = RECIPES.map((r, i) => ({ r, i })).filter(e => e.r.st === B.st && recipeHere(e.r) && (e.r.lvl !== 3 || G.flags.seen1 || WORLD.mode === 1)).map(e => ({ r: e.r, lvlOk: recipeLevelOk(e.r), can: canCraft(e.r) && recipeLevelOk(e.r) })).sort((a, b) => b.can - a.can);
  const rows = max(1, floor((bot - 2 - ry) / 19)); pscroller({ x: rx, y: ry, w: rw, h: rows * 19 }, list.length, rows);
  for (let k = 0; k < rows; k++) {
    const e = list[k + UI.scroll]; if (!e) break; const r = e.r, yy = ry + k * 19, hov = inR(rx, yy, rw, 18), outId = r.out || Object.keys(r.need)[0];
    if (hov) { c.fillStyle = '#2b2740'; c.fillRect(rx, yy, rw, 18); }
    slotBox(c, rx, yy, false, hov && e.can); c.globalAlpha = e.can ? 1 : .45; drawStack(c, { id: outId, n: r.out ? r.n : 1 }, rx, yy); c.globalAlpha = 1;
    drawRecipeRow(c, r, rx, yy, rw, e.lvlOk);
    if (hov) tip = recipeTip(r, e.lvlOk);
  }
  // the sweep of light after choosing a bench
  const sw = (now - PANEL.bookT) / 320; if (sw < 1) { const ga = c.globalAlpha; c.globalAlpha = ga * .22 * (1 - sw); c.fillStyle = KIT.col; c.fillRect(x + lw + 12 + round((w - lw - 16) * sw) - 12, top, 24, ph); c.globalAlpha = ga; }
  const fy = y + h - 12, left = kb('use a bench: [F] by it', 'use a bench: USE by it');
  if (!list.length) drawText(c, 'Nothing yet.', rx, ry, '#8b8fa3');
  else { const s = `${list.length} recipes${list.length > rows ? `: ${UI.scroll + 1}-${min(list.length, UI.scroll + rows)}, ${kb('wheel scrolls', 'slide to scroll')}` : ''}`; drawText(c, fitText(s, w - 24 - textW(left)), x + w - 8 - textW(fitText(s, w - 24 - textW(left))), fy, '#6a6485'); }
  drawText(c, left, x + 8, fy, '#6a6485');
  if (tip) drawTip(c, tip);
}
// ---------------- trinket slots, in the WORN panel ----------------
function drawTrinketRow(c, x, y) {
  trinkFit(); const n = trinkSlots(); let tip = null;
  textS(c, 'TRINKETS', x, y + 6, '#b49cff');
  for (let k = 0; k < TRINK_MAX; k++) {
    const sx = x + 54 + k * 19, hov = inR(sx, y, 18, 18), cur = k < n ? G.trink[k] : null, h = UI.held, fits = k < n && h && IT[h.id] && IT[h.id].type === 'trinket';
    if (k >= n) { c.fillStyle = '#2a2638'; c.fillRect(sx, y, 18, 18); c.fillStyle = '#1a1626'; c.fillRect(sx + 1, y + 1, 16, 16); c.fillStyle = '#4a4460'; c.fillRect(sx + 7, y + 8, 4, 4); c.fillRect(sx + 7, y + 5, 1, 3); c.fillRect(sx + 10, y + 5, 1, 3); c.fillRect(sx + 7, y + 5, 4, 1);
      if (hov) tip = [['LOCKED', '#8b8fa3'], [`Beat ${TRINK_OPEN[k - 2] || 'more guardians'} to open it.`, '#b9bdd0']]; continue; }
    slotBox(c, sx, y, fits, hov); if (cur && IT[cur]) drawStack(c, { id: cur, n: 1 }, sx, y);
    if (hov && cur && !h) tip = itemTip(IT[cur]); else if (hov && !cur && !h) tip = [['TRINKET', '#b49cff'], ['Drop a trinket here, or right click one in your pack.', '#b9bdd0'], ['Trinkets come from the Jeweller\'s Bench and the guardians.', '#8b8fa3']];
    hit(sx, y, 18, 18, () => trinkSlotClick(k), true);
  }
  return tip;
}
