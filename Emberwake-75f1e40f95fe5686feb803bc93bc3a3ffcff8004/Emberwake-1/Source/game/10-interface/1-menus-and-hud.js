// ============================================================
//  UI: menus, HUD, pack + crafting, forms codex, journal,
//  dialogue, the ring scoreboard. Everything clickable registers
//  a hit box while it draws; clicks test last frame's boxes.
// ============================================================
// a note that names the J or C key reads, on a touch screen, without it (the pause card's JOURNAL and FORMS open them there)
const noKeys = s => !KIT.T || !s ? s : s.replace(/\[C\] shows them/g, 'FORMS in the menu shows them').replace(/ *\[[JC]\]/g, '');
const inR = (x, y, w, h) => mouse.ux >= x && mouse.ux < x + w && mouse.uy >= y && mouse.uy < y + h;
const FORM = { name: '', seed: '', size: 1, shape: 0, mode: 0, skin: 0, hat: 0, nick: '', code: '', accountName: '', accountPassword: '', accountConfirm: '', brRanked: false };
const COSMETIC_SHOP = { tab: 'skin', selected: 0, scroll: 0, rows: 1 };
const SIZE_D = ['600 x 260 tiles', '900 x 320 tiles', '1400 x 380 tiles', '2200 x 440 tiles: days to cross'], SHAPE_D = ['every seed deals its lands in a new order', 'the Drift is crowded with islands', 'few islands, the Underdark yawns wider'], MODE_D = ['three embers, any order, nothing forced', 'every item, no monsters, build freely'];
let HITS = [], HITS_NEXT = [];
// HIT_CLIP {y0, y1}: while a scrolling box is drawn (kscroll), boxes outside it are skipped and boxes partly in it are trimmed.
// tag: the control's full name ('btn:' + label, 'field:' + key, 'row:kind:id', 'tab:' + name), for keys and tests.
let HIT_CLIP = null;
function hit(x, y, w, h, fn, slot, tag) {
  if (HIT_CLIP) { const y0 = max(y, HIT_CLIP.y0), y1 = min(y + h, HIT_CLIP.y1); if (y1 <= y0) return; y = y0; h = y1 - y0; }
  HITS_NEXT.push({ x, y, w, h, fn, slot: !!slot, tag });
}
function panel(c, x, y, w, h, title) {
  c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = '#1d1a29'; c.fillRect(x, y, w, h);
  c.fillStyle = '#4a4460'; c.fillRect(x, y, w, 1); c.fillRect(x, y, 1, h); c.fillStyle = '#2b2740'; c.fillRect(x, y + h - 1, w, 1); c.fillRect(x + w - 1, y, 1, h);
  if (title) { c.fillStyle = '#2b2740'; c.fillRect(x + 1, y + 1, w - 2, 11); textS(c, title, x + 5, y + 3, '#ffd35a', touchFit(title, w - 10)); }
}
function button(c, x, y, w, h, label, fn, o = {}) {
  const hv = !o.off && inR(x, y, w, h), on = o.on;
  c.fillStyle = o.off ? '#2b2740' : hv || on ? '#ffd35a' : '#4a4460'; c.fillRect(x, y, w, h);
  c.fillStyle = hv ? '#3a3350' : on ? '#3d3320' : '#262234'; c.fillRect(x + 1, y + 1, w - 2, h - 2);
  const sc = touchFit(label, w - 8); textC(c, label, x + w / 2, y + round((h - 8 * sc) / 2), o.off ? '#6a6485' : hv || on ? '#ffd35a' : (o.col || '#fff'), sc, drawText);
  if (!o.off) hit(x, y, w, h, fn, false, 'btn:' + label);
}
function field(c, x, y, w, key, ph) {
  // (a password shows as stars, and no more of them than the box holds; on a phone a long entry shows its end)
  const f = UI.focus === key, v = key === 'accountPassword' || key === 'accountConfirm' ? '*'.repeat(min(FORM[key].length, floor((w - 8) / 6))) : touchTail(FORM[key], w - 10);
  c.fillStyle = f ? '#ffd35a' : inR(x, y, w, 14) ? '#8c86a8' : '#4a4460'; c.fillRect(x, y, w, 14); c.fillStyle = INK; c.fillRect(x + 1, y + 1, w - 2, 12);
  if (v) drawText(c, v, x + 4, y + 4, '#fff'); else drawText(c, ph, x + 4, y + 4, '#6a6485');
  if (f && (performance.now() / 400 | 0) & 1) { c.fillStyle = '#ffd35a'; c.fillRect(x + 5 + (v ? textW(v) : -1), y + 3, 1, 8); }
  hit(x, y, w, 14, () => { UI.focus = key; sfx('ui'); }, false, 'field:' + key); KIT.fields.push(key);
}
function chooser(c, x, y, w, label, names, key, descs) {
  drawText(c, label, x, y + 4, '#b9bdd0'); const bx = x + 46, bw = w - 46;
  button(c, bx, y, 14, 14, '<', () => { FORM[key] = (FORM[key] + names.length - 1) % names.length; sfx('ui'); });
  textC(c, names[FORM[key]], bx + bw / 2, y + 4, '#ffd35a', 1, drawText);
  button(c, bx + bw - 14, y, 14, 14, '>', () => { FORM[key] = (FORM[key] + 1) % names.length; sfx('ui'); });
  if (descs) textC(c, descs[FORM[key]], bx + bw / 2, y + 17, '#8b8fa3', 1, drawText);
}
function skinPicker(c, x, y) {
  drawText(c, 'LOOK', x, y + 8, '#b9bdd0');
  for (let i = 0; i < 4; i++) {
    const bx = x + 46 + i * 24, on = FORM.skin === i; c.fillStyle = on ? '#ffd35a' : inR(bx, y, 20, 22) ? '#8c86a8' : '#4a4460'; c.fillRect(bx, y, 20, 22); c.fillStyle = '#262234'; c.fillRect(bx + 1, y + 1, 18, 20);
    c.drawImage(SK[i].head, bx + 3, y + 2, 14, 14); c.fillStyle = SKINS[i][4]; c.fillRect(bx + 3, y + 17, 7, 2); c.fillStyle = SKINS[i][0]; c.fillRect(bx + 10, y + 17, 7, 2);
    hit(bx, y, 20, 22, () => { FORM.skin = i; sfx('ui'); });
  }
}
function slotBox(c, x, y, sel, hov) { c.fillStyle = sel ? '#ffd35a' : hov ? '#8c86a8' : '#4a4460'; c.fillRect(x, y, 18, 18); c.fillStyle = sel ? '#3a3350' : '#262234'; c.fillRect(x + 1, y + 1, 16, 16); }
function drawStack(c, s, x, y) { if (!s) return; const ic = IT[s.id].icon; c.drawImage(ic, x + 9 - (ic.width >> 1), y + 9 - (ic.height >> 1)); if (s.n > 1) textO(c, s.n > 999 ? '999' : s.n, x + 17 - textW(min(s.n, 999)), y + 10, '#fff'); }
function bar(c, x, y, w, h, f, col, dark) { c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = '#2b2740'; c.fillRect(x, y, w, h); const fw = round(w * clamp(f, 0, 1)); c.fillStyle = col; c.fillRect(x, y, fw, h); c.fillStyle = dark; c.fillRect(x, y + h - 1, fw, 1); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, y, fw, 1); }
const hotN = () => WORLD.arena && !wildOn() ? 6 : 10;
const hotbarLayout = () => ({ x: round((VS.uw - hotN() * 19 + 1) / 2), y: VS.uh - 22 });
function invLayout() {
  const wide = VS.uw >= 420, gw = 189, cw = 190, pr = ceil(INV_N / 10), ph = pr * 19 + 20, rows = wide ? clamp(floor((VS.uh - 90) / 19), 4, 9) : clamp(floor((VS.uh - 150 - ph) / 19), 2, 6);
  // a screen held upright with room to spare: the cards start under the HUD's bars, and the BY HAND list takes the height
  // that is left above the strip (its last line, 'more at benches', included)
  const low = !wide && VS.uh - 56 - (46 + ph + 98) >= 38;
  const tw = wide ? gw + cw + 14 : cw, x0 = round((VS.uw - tw) / 2), y0 = wide ? round(max(34, (VS.uh - rows * 19) / 2 - 20)) : low ? 46 : 34, cy = wide ? y0 : y0 + ph + 18 + 80;
  const nr = wide ? rows : low ? floor((VS.uh - 56 - cy) / 19) : max(2, rows - 3);
  return { gx: x0, gy: y0, cx: wide ? x0 + gw + 14 : x0, cy, cw, rows: nr, ph, ay: y0 + ph + 2 };
}
const craftMiss = r => Object.keys(r.need).reduce((n, k) => n + (countItem(k) >= r.need[k] ? 0 : 1), 0);
const craftList = () => RECIPES.filter(r => r.st === 'hand' && recipeHere(r)).map(r => ({ r, can: canCraft(r), miss: craftMiss(r) })).sort((a, b) => b.can - a.can || a.miss - b.miss);
function closeUI() { if (UI.stn && COOP.role) { COOP.stns.add(UI.stn.i); netLock(UI.stn.i, false); } UI.job = null; UI.stn = null; UI.msg = null; UI.dust = null; if (UI.held) { const l = addItem(UI.held.id, UI.held.n); if (l) spawnDrop(UI.held.id, l, G.p.x + 3, G.p.y + 4); UI.held = null; } UI.open = null; UI.scroll = 0; }
function toggleUI(n) {
  if (n === 'map' && !hasUtil('fieldmap')) { say('You have no map. Reeds pressed flat, a little charcoal: you could draw one.'); return; }
  if (UI.open === n) closeUI(); else { closeUI(); UI.open = n; UI.scroll = 0; if (n === 'map') mapReveal(); if (n === 'journal') { G.jNew = false; UI.scroll = 9999; } if (n === 'codex') { const it = heldItem(); UI.codex = it && it.type === 'weapon' ? it.set : !it || carried(it) ? 'brawl' : (UI.codex || 'brawl'); } }
  sfx('ui');
}
function slotClick(i, btn) {
  if (btn === 0 && !UI.held && inv[i] && (keys.ShiftLeft || keys.ShiftRight)) { quickMove(i); return; }
  const s = inv[i], h = UI.held, st = s ? IT[s.id].stack : 0;
  // right click a piece of armour to put it on
  if (btn !== 0 && !h && s && IT[s.id].type === 'armor') { wearAt(i); return; }
  if (btn !== 0 && !h && s && IT[s.id].type === 'trinket') { wearTrinketAt(i); return; }
  if (btn === 0) {
    if (!h) { if (s) { UI.held = s; inv[i] = null; } }
    else if (!s) { inv[i] = h; UI.held = null; }
    else if (s.id === h.id && s.n < st) { const k = min(h.n, st - s.n); s.n += k; h.n -= k; if (h.n <= 0) UI.held = null; }
    else { inv[i] = h; UI.held = s; }
  } else {
    if (!h) { if (s && s.n > 1) { const k = ceil(s.n / 2); UI.held = { id: s.id, n: k }; s.n -= k; } else if (s) { UI.held = s; inv[i] = null; } }
    else if (!s) { inv[i] = { id: h.id, n: 1 }; if (--h.n <= 0) UI.held = null; }
    else if (s.id === h.id && s.n < st) { s.n++; if (--h.n <= 0) UI.held = null; }
  }
  G.dirty = true; sfx('ui');
}
function uiMouseDown(btn) {
  UI.focus = null; UI.dn = btn === 0 ? { x: mouse.ux, y: mouse.uy, had: !!UI.held } : null;
  for (let i = HITS.length - 1; i >= 0; i--) { const h = HITS[i]; if (inR(h.x, h.y, h.w, h.h)) { if (h.hint) KIT.tapHint = { s: h.hint, t: performance.now() }; h.fn(btn); if (UI.open === 'stn' && UI.stn && COOP.role) COOP.stns.add(UI.stn.i); return true; } }
  if (G.state !== 'play' || G.dialog) return true;
  if (UI.open === 'inv' && UI.held) { dropHeld(); return true; }
  return !!UI.open && UI.open !== 'score';
}
// a tooltip: a small kit card, its bar in the colour of its first line
function drawTip(c, lines) {
  let w = 0; for (const l of lines) w = max(w, textW(l[0])); const h = lines.length * 9 + 7, col = (lines[0] && lines[0][1]) || '#6a6485';
  const x = clamp(mouse.ux + 10, 2, VS.uw - w - 10), y = clamp(mouse.uy + 10, 2, VS.uh - h - 2);
  c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 10, h + 2); c.fillStyle = 'rgba(22,17,34,.95)'; c.fillRect(x, y, w + 8, h); c.fillStyle = col; c.fillRect(x, y, w + 8, 2);
  lines.forEach((l, i) => drawText(c, l[0], x + 4, y + 5 + i * 9, l[1] || '#fff'));
}
function itemTip(it) {
  const L = [[it.name, '#ffd35a']];
  if (it.type === 'weapon') {
    const q = qBonus(it.id), tr = ['bleed', 'poison', 'frost', 'burn', 'steal', 'stag'].filter(k => it[k]).map(k => ({ bleed: 'bleeds', poison: 'poisons', frost: 'chills', burn: 'burns', steal: 'drinks life', stag: 'staggers' }[k]));
    L.push([`${it.dmg} damage${q ? ` (${q > 0 ? '+' : ''}${round(q * 100)}% ${QN[qTier(G.quality[it.id])].toLowerCase()})` : ''}${it.wsp ? (it.wsp < .95 ? ', quick' : it.wsp > 1.08 ? ', slow' : '') : ''}`, '#fff']);
    if (tr.length || it.crit) L.push([[...tr, it.crit ? 'keen' : ''].filter(Boolean).join(', '), '#ffb347']);
    L.push([`${Object.keys(MOVESETS[it.set].moves).filter(k => !isStyleId(k)).length} forms` + kb('  [C]', ''), '#8ff5e6']); if (STYLES[weaponType(it)]) L.push([`styles: rank ${styleLevel(weaponType(it))}/5 (V)`, '#ffd35a']);
  }
  else if (it.type === 'tool') L.push([`${{ pick: 'pick', axe: 'axe', shovel: 'shovel', hammer: 'hammer', knife: 'knife' }[it.kind]} : power ${it.power}, works ${TIER_N[it.tier].replace(/^an? /, '').replace(' tool', '')} rock and softer`, '#fff']);
  else if (it.type === 'food') L.push([`food +${it.food || 0}${it.heal ? `, heals ${it.heal}` : ''}`, '#7ddc6f']);
  else if (it.type === 'armor') { L.push([`${it.slot}: protection ${it.prot}, weight ${it.wt}`, '#fff']); if (it.light || it.mine || it.poise || it.shot) L.push([[it.light ? 'sheds light' : '', it.mine ? `digs ${round((it.mine - 1) * 100)}% harder` : '', it.poise ? 'barely flinches' : '', it.shot ? 'turns arrows' : ''].filter(Boolean).join(', '), '#ffb347']); const g = G.gear && G.gear[it.slot]; if (g && g.id !== it.id) L.push([`now wearing ${IT[g.id].name} (${IT[g.id].prot})`, '#8b8fa3']); L.push(['right click to wear', '#8ff5e6']); }
  if (it.type === 'weapon' && WORLD.royale) { const s = inv.find(q => q && q.id === it.id), ln = trAmpLine(s || { id: it.id }); if (ln) L.push(['amps: ' + ln, '#c77dff']); }
  if (it.type === 'trinket') { const on = (G.trink || []).slice(0, trinkSlots()).includes(it.id); L.push([on ? 'TRINKET: worn' : 'TRINKET', '#b49cff']); }
  for (const l of wrapText(it.desc, 150)) if (l) L.push([l, '#b9bdd0']);
  { const ma = madeAt(it.id); if (ma.length) L.push(['made at: ' + ma.slice(0, 3).join(', '), '#b49cff']); }
  const u = USES[it.id]; if (u && u.length) for (const l of wrapText('Used for: ' + u.slice(0, 6).join(', ') + (u.length > 6 ? `, +${u.length - 6} more` : ''), 150)) L.push([l, '#8ff5e6']);
  return L;
}
function fmtTime(s) { s = s | 0; const h = (s / 3600) | 0, m = ((s % 3600) / 60) | 0; return h ? `${h}h ${m}m` : `${m}m`; }

// ---------------- menus ----------------
function drawLogo(c, cy, sub) {
  const uw = VS.uw, sc = uw > 520 ? 5 : uw > 380 ? 4 : 3, s = 'EMBERWAKE', w = textW(s, sc), x = round((uw - w) / 2);
  textO(c, s, x, cy, '#e2542b', sc, INK); c.save(); c.beginPath(); c.rect(0, cy, uw, sc * 4); c.clip(); drawText(c, s, x, cy, '#ffd35a', sc); c.restore();
  c.save(); c.beginPath(); c.rect(0, cy, uw, sc * 2); c.clip(); drawText(c, s, x, cy, '#fff1a8', sc); c.restore();
  if (sub) textC(c, sub, uw / 2, cy + sc * 8 + 6, '#fff', 1, textO);
}
// ---------------- the home screen ----------------
// A dusk view of the land with embers rising through it, and three boards: alone, with friends, the arenas.
const TITLE = { hint: '', pan: null, subI: 0 };
const TITLE_SUBS = ['THREE EMBERS : GO ANYWHERE', 'SEVEN WORLDS UNDER A BROKEN RING', 'EVERY BLOW IS A CHOICE', 'DIG, BUILD, FIGHT, WAKE THE DAWN'];
function titleScene() { G.clock = .6; updateSun(); TITLE.pan = null; }
// the land drifts slowly by behind the boards
function titleDrift(now) {
  if (TITLE.pan === null) TITLE.pan = { x: G.cam.x, t0: now };
  const span = min(34 * T, max(0, WW * T - VS.vw) / 2); G.cam.x = G.cam.px = camX(TITLE.pan.x + sin((now - TITLE.pan.t0) / 21000) * span);
}
function titleEmbers(c, uw, uh) {
  const t = performance.now() / 1000;
  for (let k = 0; k < 54; k++) {
    const a = hh(k, 3, 77), b = hh(k, 9, 31), sp = 9 + a * 18, span = uh + 24, life = (t * sp + b * span * 3) % span, x = hh(k, 5, 12) * uw + sin(t * (.4 + b) + k) * (5 + 9 * b), u = life / span;
    c.globalAlpha = (1 - u) * (.3 + .55 * b); c.fillStyle = k % 5 === 0 ? '#fff1a8' : k % 2 ? '#ff8a3d' : '#ffd35a'; const sz = k % 7 === 0 ? 2 : 1; c.fillRect(round(x), round(uh + 6 - life), sz, sz);
  }
  c.globalAlpha = 1;
}
const TITLE_ART = {
  fire(c, x, y) { const f = (performance.now() / 110) | 0; c.fillStyle = '#5a3a22'; c.fillRect(x + 2, y + 12, 12, 2); c.fillRect(x + 4, y + 10, 8, 2); c.fillStyle = '#e2542b'; c.fillRect(x + 5, y + 5 + (f & 1), 6, 6 - (f & 1)); c.fillStyle = '#ffd35a'; c.fillRect(x + 6, y + 7 + (f % 3 === 0 ? 1 : 0), 4, 4); c.fillStyle = '#fff1a8'; c.fillRect(x + 7, y + 9, 2, 2); c.fillStyle = '#ff8a3d'; c.fillRect(x + 7 + (f % 3) - 1, y + 2 + (f & 1), 1, 2); },
  friends(c, x, y) { c.drawImage(SK[1].head, x, y + 3, 9, 9); c.drawImage(SK[0].head, x + 7, y + 1, 10, 10); c.fillStyle = '#7ddc6f'; c.fillRect(x + 3, y + 13, 11, 1); c.fillRect(x + 8, y + 12, 1, 3); },
  arena(c, x, y) { c.fillStyle = '#b9bdd0'; for (let k = 0; k < 11; k++) { c.fillRect(x + 2 + k, y + 2 + k, 2, 1); c.fillRect(x + 13 - k, y + 2 + k, 2, 1); } c.fillStyle = '#ffd35a'; c.fillRect(x + 1, y + 11, 3, 3); c.fillRect(x + 13, y + 11, 3, 3); c.fillStyle = '#e2483b'; c.fillRect(x + 7, y + 6, 3, 3); }
};
function titleCard(c, x, y, w, h, title, col, art, rows) {
  c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = 'rgba(22,17,34,.88)'; c.fillRect(x, y, w, h);
  c.fillStyle = col; c.fillRect(x, y, w, 2); c.fillStyle = '#2b2740'; c.fillRect(x, y + h - 1, w, 1); c.fillRect(x, y + 23, w, 1);
  TITLE_ART[art](c, x + 6, y + 5); textS(c, title, x + 28, y + 9, col);
  rows.forEach((r, i) => {
    const by = y + 29 + i * 33; button(c, x + 6, by, w - 12, 18, r[0], r[2], r[4] || {});
    let sub = String(r[1]); while (sub.length > 3 && textW(sub) > w - 14) sub = sub.slice(0, -1); drawText(c, sub, x + 8, by + 21, '#8b8fa3');
    if (inR(x + 6, by, w - 12, 30)) TITLE.hint = r[3] || '';
  });
}
function drawTitle(c) {
  const uw = VS.uw, uh = VS.uh, now = performance.now();
  titleDrift(now);
  const g = c.createLinearGradient(0, 0, 0, uh); g.addColorStop(0, 'rgba(18,13,31,.62)'); g.addColorStop(.45, 'rgba(18,13,31,.2)'); g.addColorStop(1, 'rgba(18,13,31,.5)'); c.fillStyle = g; c.fillRect(0, 0, uw, uh);
  titleEmbers(c, uw, uh);
  const ly = round(uh * .09); { const r = c.createRadialGradient(uw / 2, ly + 16, 4, uw / 2, ly + 16, 150); r.addColorStop(0, 'rgba(255,140,60,.26)'); r.addColorStop(1, 'rgba(255,140,60,0)'); c.fillStyle = r; c.fillRect(uw / 2 - 160, ly - 40, 320, 120); }
  drawLogo(c, ly, TITLE_SUBS[((now / 6000) | 0) % TITLE_SUBS.length]);
  const nick = () => { if (!FORM.nick) FORM.nick = cleanName(G.nick) || 'WAKER' + ((Math.random() * 90 + 10) | 0); };
  const last = SAVE.list && SAVE.list[0];
  const goWorlds = note => { G.state = 'worlds'; UI.scroll = 0; UI.confirm = null; G.menuNote = ''; G.worldNote = note || ''; sfx('ui'); };
  const alone = [
    last ? ['CONTINUE', String(last.name || 'World').slice(0, 14) + '  ' + fmtTime(last.played || 0), () => { openWorld(last); sfx('quest', 0); }, 'Back into ' + (last.name || 'your world') + ', right where you left it.', { col: '#ffd35a' }]
         : ['BEGIN', 'forge your first world', () => { G.state = 'create'; Object.assign(FORM, { name: 'World 1', seed: rollSeed() }); UI.focus = 'name'; sfx('ui'); }, 'A new land, a cold fire, and three embers to find.', { col: '#ffd35a' }],
    ['WORLDS', 'new, load, copy', () => goWorlds(''), 'Every world you have made. Forge a new one, or paste one a friend sent.']];
  const friends = [
    ['JOIN A FRIEND', 'world or private FFA code', () => { G.state = 'join'; UI.focus = null; COOP.err = ''; COOP.note = ''; COOP.long = false; nick(); sfx('ui'); }, 'Join a friend\'s world or private FFA match with their game code.'],
    ['HOST A WORLD', 'open one, then invite', () => goWorlds('Open a world, then press P and choose PLAY TOGETHER for a code.'), 'Open one of your worlds, press P, choose PLAY TOGETHER: friends join with the code.']];
  const arenas = [
    ['FFA ARCADE', '10 combat modes · 3 bots', () => { G.state = 'ring'; UI.focus = null; nick(); sfx('ui'); }, 'Ten weapon-focused arenas, three opponents in quick play, personal ratings, and private matches by code.'],
    ['THE ASHFALL TRIALS', 'outlast the field', () => { G.state = 'brform'; UI.focus = null; nick(); if (FORM.brcode === undefined) FORM.brcode = ''; sfx('ui'); }, 'Twelve Wakers, one island. Scavenge, team up, survive the nights. About twelve minutes.']];
  TITLE.hint = '';
  if (uw >= 430) {
    const cw = min(158, floor((uw - 28) / 3)), gap = min(10, floor((uw - cw * 3) / 4)), x0 = round((uw - cw * 3 - gap * 2) / 2), cy = max(ly + 62, round(uh * .37)), ch = 96;
    titleCard(c, x0, cy, cw, ch, 'ALONE', '#ffd35a', 'fire', alone);
    titleCard(c, x0 + cw + gap, cy, cw, ch, 'WITH FRIENDS', '#7ddc6f', 'friends', friends);
    titleCard(c, x0 + (cw + gap) * 2, cy, cw, ch, 'THE ARENAS', '#ff6b6b', 'arena', arenas);
    const by = min(uh - 36, cy + ch + 10), bw = min(104, floor((uw - 44) / 5)), bx = round((uw - bw * 5 - 16) / 2);
    button(c, bx, by, bw, 14, muted ? 'SOUND: OFF' : 'SOUND: ON', () => { muted = !muted; sfx('ui'); }); if (inR(bx, by, bw, 14)) TITLE.hint = 'Sound on or off (also the O key while playing).';
    button(c, bx + bw + 4, by, bw, 14, 'DIFFICULTY: ' + DIFF().n, () => { SETTINGS.diff = SETTINGS.diff === 'easy' ? 'normal' : SETTINGS.diff === 'normal' ? 'hard' : 'easy'; saveSettings(); sfx('ui'); }); if (inR(bx + bw + 4, by, bw, 14)) TITLE.hint = 'How hard blows land on you, and how wide the timing of your own blows is.';
    button(c, bx + (bw + 4) * 2, by, bw, 14, 'CONTROLS: ' + (SETTINGS.combat === 'simple' ? 'SIMPLE' : 'FULL'), () => { SETTINGS.combat = SETTINGS.combat === 'simple' ? 'full' : 'simple'; saveSettings(); sfx('ui'); }); if (inR(bx + (bw + 4) * 2, by, bw, 14)) TITLE.hint = 'SIMPLE: aim and S choose the form. FULL: movement keys and distance change it too.';
    button(c, bx + (bw + 4) * 3, by, bw, 14, 'HOW TO PLAY', () => { G.state = 'howto'; sfx('ui'); }); if (inR(bx + (bw + 4) * 3, by, bw, 14)) TITLE.hint = 'The keys, and how a fight works.';
    button(c, bx + (bw + 4) * 4, by, bw, 14, 'COSMETIC SHOP', () => { G.state = 'shop'; COSMETIC_SHOP.scroll = 0; sfx('ui'); });
  } else {
    // a narrow window: one plain column
    const bw = min(176, uw - 16), bx = round((uw - bw) / 2); let by = max(ly + 56, round(uh * .36));
    for (const r of [...alone, ...friends, ...arenas]) { button(c, bx, by, bw, 16, r[0], r[2], r[4] || {}); if (inR(bx, by, bw, 16)) TITLE.hint = r[3]; by += 19; }
    button(c, bx, by, bw, 14, 'COSMETIC SHOP', () => { G.state = 'shop'; COSMETIC_SHOP.scroll = 0; sfx('ui'); }); by += 16;
    button(c, bx, by, bw, 14, 'HOW TO PLAY', () => { G.state = 'howto'; sfx('ui'); });
  }
  { let h = TITLE.hint || (mobileDevice ? 'touch to move and fight' : 'mouse + keyboard'); while (h.length > 3 && textW(h) > uw - 12) h = h.slice(0, -1); textC(c, h, uw / 2, uh - 15, TITLE.hint ? '#d8d4e6' : '#8b8fa3', 1, textO); }
  const vs = 'version ' + GAME_VERSION; textS(c, vs, uw - textW(vs) - 4, uh - 10, '#6a6485');
}
// (how to play, the worlds board and the forge are 7-places.js)
// a seed you can say out loud, so a friend can forge the same world
const SEED_A = ['ember', 'ashen', 'hollow', 'glass', 'cinder', 'salt', 'thorn', 'rust', 'pale', 'still', 'deep', 'wake', 'lantern', 'gloam', 'iron', 'moth'], SEED_B = ['vale', 'reach', 'moor', 'fen', 'crown', 'harbor', 'hollow', 'field', 'gate', 'well', 'spire', 'march', 'barrow', 'ford', 'rise', 'drift'];
const rollSeed = () => fpick(SEED_A) + '-' + fpick(SEED_B) + '-' + (10 + floor(Math.random() * 90));
// (the accounts board, THE HEARTH, is 5-accounts.js; the FFA Arcade's form, drawRingForm, is 11-arena-and-royale/26-arena-menus.js)

// ---------------- in-game HUD ----------------
function drawHUD(c) {
  const p = G.p, uw = VS.uw, uh = VS.uh, A = WORLD.arena, wild = wildOn();
  c.drawImage(SPR.heart, 3, 3); bar(c, 15, 4, 72, 7, p.hp / p.maxhp, p.hp < 30 && (G.time >> 3) & 1 ? '#ff9a8a' : '#e2483b', '#8f2233'); textO(c, ceil(max(0, p.hp)), 91, 4, '#fff');
  if ((!A || wild) && gearOn()) { drawGearHud(c); if (!A) { if (!SETTINGS.fpsMode) { drawStyleHud(c); drawFamHud(c); } drawDrill(c); } }
  bar(c, 15, 14, 72, 4, p.stam / p.maxstam, p.stam < 22 ? '#ffd35a' : '#7ddc6f', p.stam < 22 ? '#b85a1e' : '#2f8a43');
  if ((!A || wild) && WORLD.mode !== 1) { const f = G.food / 100; bar(c, 15, 20, 72, 2, f, f < .25 && (G.time >> 4) & 1 ? '#ff9a8a' : '#e0a050', '#7a4a1a'); if (f < .3) textO(c, f <= 0 ? 'STARVING' : 'HUNGRY', 91, 16, '#e0a050'); }
  if (p.riposte > 0 && (G.time >> 2) & 1) textO(c, 'RIPOSTE READY', 15, 22, '#8ff5e6');
  else if (!UI.open && WORLD.royale) { if (wild && !SETTINGS.fpsMode && !mobileDevice && !(BR.t > 60 * 60 || G.note || p.dead)) textS(c, '[LMB] hit / dig  [F] open  [E] pack  [B] recipes  [K] knap  [H] heal  [P] pact  [M] map', 4, 35, '#8b8fa3'); }
  else if (!UI.open && !SETTINGS.fpsMode && !mobileDevice) textS(c, A ? (FFA.active ? FFA.mode === 'crystal' ? '[TAB] scores  [F] place / detonate crystal  [P] menu' : FFA.mode === 'shield' ? '[TAB] scores  [G] guard  [P] menu' : '[TAB] scores  [C] forms  [P] menu  1-6 weapons  [R] sidearm' : '[TAB] scores  [C] forms  [P] menu  1-6 weapons  [R] sidearm [T] swap') : '[E] pack  [K] knap  [F] use  [J] journal  [P] menu', 4, 25, '#8b8fa3');
  if (!SETTINGS.fpsMode && !A && G.jNew && (G.time >> 4) & 1) textS(c, kb('NEW JOURNAL ENTRY [J]', 'NEW JOURNAL ENTRY'), 4, 32, '#ffd35a');
  if (!SETTINGS.fpsMode) { drawBless(c); drawMealHud(c); drawGadgetHud(c); }
  drawCoopHud(c);
  if (G.savedNote) { const t = G.savedNote.t; c.globalAlpha = clamp((120 - t) / 30, 0, 1); textS(c, G.savedNote.ok ? (SAVE.db ? 'saved to your account' : 'saved') : 'could not save', 4, A ? 32 : 42, '#7ddc6f'); c.globalAlpha = 1; }
  // hotbar
  const hb = hotbarLayout();
  { const W = heldOf(p); if (W && W.type === 'weapon' && !G.dialog) drawTempoHud(c, p, hb.x + hotN() * 19 - 31, hb.y - 9); }
  for (let i = 0; i < hotN(); i++) {
    const sel = i === G.sel, x = hb.x + i * 19, y = hb.y - (sel ? 2 : 0); slotBox(c, x, y, sel, !G.dialog && inR(x, hb.y - 2, 18, 20)); drawStack(c, inv[i], x, y); drawAmpPips(c, inv[i], x, y); drawText(c, (i + 1) % 10, x + 2, y + 2, sel ? '#ffd35a' : '#6a6485');
    if (!G.dialog && UI.open !== 'pause') hit(x, hb.y - 2, 18, 20, b => { if (UI.open === 'inv') slotClick(i, b); else { G.sel = i; G.selT = 120; sfx('ui'); } }, UI.open === 'inv');
  }
  { const id = curArm(p), ax = hb.x + hotN() * 19 + 6, ay = hb.y; c.fillStyle = INK; c.fillRect(ax - 1, ay - 1, 20, 20); c.fillStyle = id ? '#2b2740' : '#1d1828'; c.fillRect(ax, ay, 18, 18); c.fillStyle = '#ff8a3d'; c.fillRect(ax, ay + 17, 18, 1);
    if (id) { const ic = IT[id].icon; c.drawImage(ic, ax + 9 - (ic.width >> 1), ay + 9 - (ic.height >> 1)); const n = (A && !WORLD.royale) || WORLD.mode === 1 || id === 'hook' ? '' : countItem(id); if (n !== '') textO(c, n, ax + 18 - textW(String(n)), ay + 11, '#fff'); if (p.armCd > 0) { c.fillStyle = 'rgba(18,13,31,.6)'; c.fillRect(ax, ay, 18, round(18 * p.armCd / 34)); } }
    drawText(c, 'R', ax + 2, ay + 2, '#ff8a3d'); if (armsOwned(p).length > 1) drawText(c, 'T', ax + 13, ay - 8, '#8b8fa3');
    if (G.armT > 0 && !UI.open) { c.globalAlpha = min(1, G.armT / 30); textO(c, id ? IT[id].name : 'no sidearms', ax + 22, ay + 5, id ? '#ffd35a' : '#8b8fa3'); c.globalAlpha = 1; } }
  const it = heldItem(); if (it && G.selT > 0 && !UI.open) { c.globalAlpha = min(1, G.selT / 30); textC(c, it.name, uw / 2, hb.y - 14, '#fff'); c.globalAlpha = 1; }
  // objective / ring status
  if (!UI.open) { if (WORLD.royale) brHud(c); else if (A) drawRingStatus(c); else if (!SETTINGS.fpsMode) { G.miniH = drawMinimap(c); drawObjective(c); } }
  // move feed
  let fy = round(uh * .34);
  if (!SETTINGS.fpsMode) G.feed.forEach((f, i) => { const a = clamp(1 - (f.t - 150) / 60, 0, 1) * (1 - i * .16); if (a <= 0) return; c.globalAlpha = a; const x = 6 + (f.t < 6 ? (6 - f.t) * -3 : 0); if (f.isNew) { textO(c, 'NEW FORM', x, fy, '#8ff5e6'); fy += 9; } textO(c, f.name, x, fy, f.isNew ? '#ffd35a' : f.fresh ? '#fff' : '#8b8fa3'); if (i === 0 && !f.fresh) drawText(c, 'dull', x + textW(f.name) + 5, fy, '#6a6485'); fy += 10; });
  c.globalAlpha = 1;
  if (!SETTINGS.fpsMode && G.combo.n > 1 && !A) { const r = rankI(), s = `${G.combo.n} HITS`, x = uw - 8 - textW(s, 2), y = round(uh * .34), pop = G.combo.t > 172 ? 1 : 0; textO(c, s, x, y - pop, '#fff', 2); if (r) textO(c, RANKS[r], uw - 8 - textW(RANKS[r]), y + 18, RANK_COL[r]); bar(c, uw - 68, y + 29, 60, 2, G.combo.t / 180, RANK_COL[r], '#4a4460'); }
  // boss bars
  const b = G.boss, v = G.duel;
  if (b && b.state !== 'intro') { const bw = clamp(uw - 300, 110, 220), bx = round((uw - bw) / 2); textC(c, b.name, uw / 2, 5, '#ffd35a', 1, textO); bar(c, bx, 15, bw, 6, b.hp / b.maxhp, b.phase === 2 ? '#ff7a2a' : '#c94a3a', '#8f2233'); if (b.state === 'tired' || b.state === 'stagger') textC(c, 'STAGGERED: STRIKE NOW', uw / 2, 24, (G.time >> 3) & 1 ? '#8ff5e6' : '#fff', 1, textO); else if (b.st && b.st.blind > 0) textC(c, 'BLINDED', uw / 2, 24, '#b9bdd0', 1, textO); }
  else if (v && !v.yielded) { const bw = clamp(uw - 300, 110, 220), bx = round((uw - bw) / 2); textC(c, 'VESPER, THE GLASS WAKER', uw / 2, 5, '#8ff5e6', 1, textO); bar(c, bx, 15, bw, 6, v.hp / v.maxhp, v.phase === 2 ? '#8ff5e6' : '#6fb9c9', '#3f7f92'); }
  // banners and notes
  // (not over a panel: the veil hides the world, and the words would show through the gaps between its cards)
  const veiled = UI.open && UI.open !== 'score';
  if (G.biomeT > 0 && !G.banner && G.state === 'play' && !veiled) { const a = min(1, G.biomeT / 40, (200 - G.biomeT) / 30); c.globalAlpha = max(0, a); const s = G.biomeN || BIOME[G.biome] || ''; textC(c, s, uw / 2, round(uh * .2), '#fff', 2, textO); if (s) { c.fillStyle = '#ffd35a'; c.fillRect(round(uw / 2 - 30), round(uh * .2) + 20, 60, 1); if (G.biomeS) textC(c, G.biomeS, uw / 2, round(uh * .2) + 25, '#d8d4e6', 1, textO); } c.globalAlpha = 1; }
  if (G.banner && G.banner.t >= 0 && !veiled) { const t = G.banner.t, a = clamp(min(t / 25, (230 - t) / 30), 0, 1); c.globalAlpha = a; const wild = wildOn(); textC(c, G.banner.text, uw / 2, round(uh * .24), '#ffd35a', wild && textW(G.banner.text, 2) > uw - 8 ? 1 : 2, textO); if (G.banner.sub) (wild ? wrapText(noKeys(G.banner.sub), uw - 8) : [noKeys(G.banner.sub)]).forEach((l, i) => textC(c, l, uw / 2, round(uh * .24) + 22 + i * 10, '#fff', 1, textO)); c.globalAlpha = 1; }
  if (G.note && G.note.t >= 0 && !veiled) { c.globalAlpha = clamp(min(G.note.t / 15, (240 - G.note.t) / 30), 0, 1); textC(c, noKeys(G.note.text), uw / 2, wildOn() ? (uw < 300 ? 112 : 48) : 36, '#ffd35a', 1, textO); c.globalAlpha = 1; }
  if (G.linkBanner) { const t = G.linkBanner.t, a = clamp(min(t / 8, (150 - t) / 25), 0, 1), y = round(uh * .36); c.globalAlpha = a; textC(c, G.linkBanner.first ? 'NEW LINK' : 'LINK', uw / 2, y - 12, '#8ff5e6', 1, textO); textC(c, G.linkBanner.name.toUpperCase(), uw / 2 + (t < 8 ? (8 - t) * 3 : 0), y, '#fff1a8', 2, textO); c.globalAlpha = 1; }
  if (G.leadDone) { const t = G.leadDone.t; c.globalAlpha = clamp(min(t / 15, (200 - t) / 30), 0, 1); textC(c, 'LEAD FOLLOWED : ' + G.leadDone.title, uw / 2, 48, '#7ddc6f', 1, textO); c.globalAlpha = 1; }
  if (!SETTINGS.fpsMode) G.picks.forEach((q, i) => { c.globalAlpha = clamp((200 - q.t) / 40, 0, 1); const ic = IT[q.id].icon, y = uh - 16 - i * 12; c.drawImage(ic, 4, y - (ic.height >> 1) + 4); textS(c, `+${q.n} ${IT[q.id].name}`, 24, y, '#fff'); }); c.globalAlpha = 1;
  if (G.sayCur && !UI.open && !G.dialog) {
    const s = G.sayCur, col = s.who === 'vesper' ? '#8ff5e6' : s.who === 'wick' ? '#ffd35a' : '#ff8a3d', w = min(300, uw - 30), lines = wrapText(s.text, w - 16), h = lines.length * 9 + 8, x = round((uw - w) / 2), y = hb.y - 22 - h; let left = floor(s.t / 1.4);
    // (the say bubble: a slim kit card, its bar in the speaker's colour)
    c.globalAlpha = clamp((s.text.length * 1.4 + 190 - s.t) / 30, 0, 1); c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 3); c.fillStyle = 'rgba(22,17,34,.9)'; c.fillRect(x, y, w, h + 1); c.fillStyle = col; c.fillRect(x, y, w, 2);
    lines.forEach((l, i) => { if (left <= 0) return; drawText(c, l.slice(0, left), x + 8, y + 6 + i * 9, s.who === 'vesper' ? '#c9fff6' : '#fff1a8'); left -= l.length + 1; }); c.globalAlpha = 1;
  }
  if (A) drawKillFeed(c);
  if (p.dead && !WORLD.royale) {
    c.fillStyle = `rgba(18,13,31,${min(.6, p.deadT / 100)})`; c.fillRect(0, 0, uw, uh); c.globalAlpha = min(1, p.deadT / 50);
    textC(c, A ? 'TAKEN DOWN' : 'YOUR EMBER GUTTERS', uw / 2, round(uh * .4), '#e2483b', 2, textO);
    if (A) textC(c, 'rising in ' + max(1, ceil((150 - p.deadT) / 60)), uw / 2, round(uh * .4) + 22, '#fff', 1, textO);
    c.globalAlpha = 1;
  }
}
function drawObjective(c) {
  const uw = VS.uw, p = G.p, id = G.pin, L = id && LEADS[id];
  if (WORLD.mode === 1 && !L) return;
  if (!L) { if (leadsOpen().length) textS(c, kb('[J] leads', 'leads'), uw - 52, 6 + (G.miniH || 0), '#6a6485'); drawMileWay(c, uw, 18 + (G.miniH || 0)); return; }
  const qw = min(160, uw - 200), lines = wrapText(L.text, qw - 10), at = leadAt(L), qh = 14 + min(3, lines.length) * 9 + (at !== null && at !== undefined ? 9 : 0), qx = uw - qw - 4, oy = G.miniH || 0;
  c.fillStyle = 'rgba(18,13,31,.62)'; c.fillRect(qx, 4 + oy, qw, qh); c.fillStyle = '#ffd35a'; c.fillRect(qx, 4 + oy, 2, qh);
  textS(c, 'LEAD : ' + L.title.toUpperCase(), qx + 6, 7 + oy, '#ffd35a'); lines.slice(0, 3).forEach((l, i) => textS(c, l, qx + 6, 17 + oy + i * 9, '#fff'));
  if (at !== null && at !== undefined) { const d = at * T - p.x, m = round(abs(d) / T); textS(c, m < 8 ? 'you are here' : d > 0 ? `→ ${m} paces east` : `← ${m} paces west`, qx + 6, 17 + oy + min(3, lines.length) * 9, '#8ff5e6'); }
  drawMileWay(c, uw, 6 + oy + qh);
}
function ringStatusText() { if (NET.via === 'rtc') return (netHost() ? 'PRIVATE CODE ' + sigSpaced(COOP.gcode || '......') + ' : ' : (COOP.hostName || 'HOST') + '\'S FFA : ') + (NET.peers.size + 1) + ' WAKER' + (NET.peers.size ? 'S' : ''); return NET.status === 'online' ? `ONLINE : ${NET.peers.size + 1} WAKER${NET.peers.size ? 'S' : ''}` : NET.status === 'connecting' ? 'CONNECTING...' : 'OFFLINE : PRACTICE'; }
function drawRingStatus(c) {
  const uw = VS.uw, list = [...G.fighters].filter(f => !f.npc).sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
  const w = 120, x = uw - w - 4; let y = 4;
  c.fillStyle = 'rgba(18,13,31,.62)'; c.fillRect(x, y, w, 13 + min(5, list.length) * 9); c.fillStyle = NET.status === 'online' ? '#7ddc6f' : '#ffb347'; c.fillRect(x, y, 2, 13 + min(5, list.length) * 9);
  textS(c, ffaModeLabel(), x + 6, y + 3, '#ffd35a'); drawText(c, NET.status === 'online' ? 'live' : NET.status === 'connecting' ? '...' : 'solo', x + w - 24, y + 3, NET.status === 'online' ? '#7ddc6f' : '#ffb347');
  list.slice(0, 5).forEach((f, i) => { const yy = y + 13 + i * 9, me = f === G.p; drawText(c, (me ? '> ' : '') + f.name, x + 6, yy, me ? '#ffd35a' : f.echoBot ? '#b9bdd0' : '#8ff5e6'); drawText(c, `${f.kills}/${f.deaths}`, x + w - 8 - textW(`${f.kills}/${f.deaths}`), yy, '#fff'); });
  textC(c, NET.via === 'rtc' ? 'PRIVATE FFA  ·  CODE ' + sigSpaced(COOP.gcode || '......') : `FFA  ·  ${NET.peers.size + 1} WAKERS`, uw / 2, 4, NET.status === 'online' ? '#7ddc6f' : '#ffb347', 1, textO);
  if (NET.roundOver) textC(c, 'next round in ' + ceil(NET.roundOver / 60), uw / 2, 14, '#fff', 1, textO);
  if (FFA.mode === 'crystal' && FFA.resetAt) {
    const left = max(0, ceil((FFA.resetAt - Date.now()) / 1000)), reset = `ARENA RESET ${String(floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
    textC(c, reset, uw / 2, 14 + (NET.roundOver ? 9 : 0), '#c9fff6', 1, textO);
  }
}
function drawKillFeed(c) {
  const uw = VS.uw; let y = WORLD.royale ? 30 : 4 + 13 + min(5, G.fighters.length) * 9 + 6;
  for (const k of G.kfeed) {
    const a = clamp((330 - k.t) / 40, 0, 1); if (a <= 0) continue; c.globalAlpha = a;
    const s = k.txt ? `${k.b} ${k.txt}` : (k.a ? `${k.a} > ${k.b}` : `${k.b} fell`), w = textW(s) + 8, x = uw - w - 4;
    c.fillStyle = k.me === 1 ? 'rgba(255,211,90,.35)' : k.me === 2 ? 'rgba(226,72,59,.35)' : 'rgba(18,13,31,.55)'; c.fillRect(x, y, w, 10); drawText(c, s, x + 4, y + 1, '#fff'); y += 11;
  }
  c.globalAlpha = 1;
}
// the arena's scores (Tab): a kit card, its crown emblem
function drawScore(c) {
  const uw = VS.uw, uh = VS.uh, list = [...G.fighters].sort((a, b) => b.kills - a.kills || a.deaths - b.deaths), w = min(280, uw - 16), h = 29 + 12 + list.length * 11 + 14, x = round((uw - w) / 2), y = round((uh - h) / 2) - 10, ga = c.globalAlpha;
  kcard(c, x, y, w, h, 'score', `${ffaModeLabel()} : ${NET.code.toUpperCase()} : ROUND ${NET.rd + 1}`);
  const ty = y + 29; drawText(c, 'WAKER', x + 8, ty, '#8b8fa3'); drawText(c, 'K', x + w - 122, ty, '#8b8fa3'); drawText(c, 'D', x + w - 82, ty, '#8b8fa3'); drawText(c, 'K/D', x + w - 48, ty, '#8b8fa3');
  list.forEach((f, i) => { const yy = ty + 12 + i * 11, me = f === G.p, kd = f.deaths ? (f.kills / f.deaths).toFixed(1) : f.kills.toFixed(1); if (me) { c.fillStyle = '#3d3320'; c.fillRect(x + 4, yy - 2, w - 8, 10); c.fillStyle = KIT.col; c.fillRect(x + 4, yy - 2, 2, 10); } drawText(c, fitText(f.name + (f.echoBot ? '  (bot)' : f.remote ? '' : '  (you)'), w - 140), x + 8, yy, me ? '#ffd35a' : f.echoBot ? '#b9bdd0' : '#8ff5e6'); drawText(c, String(f.kills), x + w - 122, yy, '#fff'); drawText(c, String(f.deaths), x + w - 82, yy, '#fff'); drawText(c, kd, x + w - 48, yy, '#fff'); });
  drawText(c, fitText(ringStatusText(), w - 16), x + 8, y + h - 11, '#7ddc6f'); c.globalAlpha = ga;
}
// ---------------- THE PACK: THE SATCHEL (a place of the menu kit: 6-panel-menus.js) ----------------
// invLayout and the 18-tall rows are as they were (the slots and rows are hit where they always were); the cards are the
// kit's, with a stitched edge, and the strip above the hotbar holds the hint (and any banner the pack covers).
function drawInv(c) {
  const L = invLayout(), hb = hotbarLayout(); let tip = null;
  // the panels catch clicks first (so a click never falls through into the world); the slots and rows drawn after them sit on top
  hit(L.gx - 5, L.gy - 16, 199, L.ph, () => { }); hit(L.cx - 5, L.cy - 16, L.cw + 10, L.rows * 19 + 21, () => { });
  menuMotes(c, 'dust', { avoid: [{ x: L.gx - 5, y: L.gy - 16, w: 199, h: L.ph }, { x: L.cx - 5, y: L.cy - 16, w: L.cw + 10, h: L.rows * 19 + 21 }] });
  pchrome(c, L.gx - 5, L.gy - 16, 199, L.ph, 'inv', `PACK ${INV_N}`, { art: 'satchel' });
  if (hasItem('rock') || hasItem('flint') || WORLD.mode === 1) pbtn(c, L.gx + 124, L.gy - 14, 64, 12, kb('KNAP [K]', 'KNAP'), () => toggleUI('knap'), { tag: 'btn:KNAP [K]', hint: 'Knap flint or rock into heads for tools.' });
  for (let i = 0; i < INV_N; i++) { const x = L.gx + (i % 10) * 19, y = L.gy + floor(i / 10) * 19, hov = inR(x, y, 18, 18); slotBox(c, x, y, i === G.sel, hov); drawStack(c, inv[i], x, y); if (hov && inv[i] && !UI.held) tip = itemTip(IT[inv[i].id]); hit(x, y, 18, 18, b => slotClick(i, b), true); }
  const list = craftList(); pscroller({ x: L.cx, y: L.cy, w: L.cw, h: L.rows * 19 }, list.length, L.rows);
  pchrome(c, L.cx - 5, L.cy - 16, L.cw + 10, L.rows * 19 + 21, 'inv', 'BY HAND'); pbtn(c, L.cx + L.cw - 62, L.cy - 14, 64, 12, kb('BOOK [B]', 'BOOK'), () => toggleUI('book'), { tag: 'btn:BOOK [B]', hint: 'Every bench and what it makes.' });
  drawText(c, kb('more at benches [F]', 'more at benches'), L.cx, L.cy + L.rows * 19 + 7, '#6a6485');
  for (let r = 0; r < L.rows; r++) {
    const e = list[r + UI.scroll]; if (!e) break; const x = L.cx, y = L.cy + r * 19, hov = inR(x, y, L.cw, 18), it = IT[e.r.out], right = x + L.cw - 2;
    if (hov) { c.fillStyle = '#2b2740'; c.fillRect(x, y, L.cw, 18); }
    slotBox(c, x, y, false, hov && e.can); c.globalAlpha = e.can ? 1 : .4; drawStack(c, { id: e.r.out, n: e.r.n }, x, y); c.globalAlpha = 1;
    drawText(c, fitText(it.name, L.cw - 24), x + 22, y + 1, e.can ? '#fff' : '#8b8fa3');
    // what it needs, cut to the row: what does not fit is counted (+2), never drawn past the edge
    const ks = Object.keys(e.r.need); let nx = x + 22;
    for (let q = 0; q < ks.length; q++) {
      const k = ks[q], hv = countItem(k), col = hv >= e.r.need[k] ? '#7ddc6f' : '#e2483b', s = `${min(hv, e.r.need[k])}/${e.r.need[k]} ${IT[k].name}`, more = q < ks.length - 1 ? 14 : 0;
      if (nx + textW(s) > right - more) { const left = ks.length - q; if (q === 0) { nx += drawText(c, fitText(s, right - nx - (left > 1 ? 14 : 0)), nx, y + 10, col) + 3; if (left > 1) drawText(c, '+' + (left - 1), nx, y + 10, '#8b8fa3'); } else drawText(c, '+' + left, nx, y + 10, '#8b8fa3'); break; }
      nx += drawText(c, s, nx, y + 10, col) + 5;
    }
    if (hov) { tip = itemTip(it).slice(0, 4); tip.push(['NEEDS', '#ffd35a']); for (const k in e.r.need) { const hv = countItem(k); tip.push([`${IT[k].name}: ${hv} of ${e.r.need[k]}`, hv >= e.r.need[k] ? '#7ddc6f' : '#e2483b']); } tip.push([e.can ? kb('click to make it', 'tap to make it') : 'you are missing the red ones', e.can ? '#8ff5e6' : '#b9bdd0']); }
    hit(x, y, L.cw, 18, () => craft(e.r));
  }
  if (list.length > L.rows) { const s = `${UI.scroll + 1}-${min(list.length, UI.scroll + L.rows)}/${list.length}`; drawText(c, s, L.cx + L.cw - textW(s), L.cy + L.rows * 19 + 7, '#6a6485'); }
  if (!WORLD.arena || wildOn()) { const t2 = drawGearPanel(c, L.gx, L.ay + 14); if (t2) tip = t2; }
  invStrip(c, hb);
  if (tip) drawTip(c, tip);
}
// the strip above the hotbar: the hint of what is under the mouse (or was tapped), else how the pack works; it also
// carries the journal's NEW ENTRY line, which the pack covers on a small screen
function invStrip(c, hb) {
  const now = performance.now(), tap = KIT.T && KIT.tapHint && now - KIT.tapHint.t < 2500 ? KIT.tapHint.s : '', h = KIT.T ? tap : KIT.hint;
  let s = h || kb('drag to move : drag out to drop : shift-click: hotbar / pack : right-click splits', 'drag to move : drag out to drop');
  if (G.jNew && !SETTINGS.fpsMode && !WORLD.arena) s = kb('NEW JOURNAL ENTRY [J]', 'NEW JOURNAL ENTRY') + '  :  ' + s;
  if (G.banner && G.banner.t >= 0 && G.banner.t < 230) s = G.banner.text + '  :  ' + s;   // a banner the pack hides
  s = fitText(s, VS.uw - 24); const w = textW(s) + 14, x = round((VS.uw - w) / 2), y = hb.y - 16;
  c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, 13); c.fillStyle = 'rgba(22,17,34,.9)'; c.fillRect(x, y, w, 11); c.fillStyle = MENUS.inv.col; c.fillRect(x, y, w, 1);
  drawText(c, s, x + 7, y + 2, h ? '#d8d4e6' : '#b9bdd0');
}
// (the forms codex, the journal and the pause panel are 10-interface/6-panel-menus.js)
// a villager speaks: a kit card at HUD level, its bar in the speaker's colour, the portrait in a framed box
function drawDialog(c) {
  const d = G.dialog, line = d.s.lines[d.i], sp = SPEAKER[line[0]] || { col: '#fff', skin: 0 }, uw = VS.uw, uh = VS.uh;
  d.t += 1.15; const w = min(380, uw - 16), L = wrapC(line[1], w - 70), h = max(58, 26 + L.length * 9 + 8), x = round((uw - w) / 2), y = uh - h - 30;
  c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = 'rgba(22,17,34,.94)'; c.fillRect(x, y, w, h); c.fillStyle = sp.col; c.fillRect(x, y, w, 2);
  c.fillStyle = '#2b2740'; c.fillRect(x + 5, y + 5, 48, 48); c.fillStyle = '#262234'; c.fillRect(x + 6, y + 6, 46, 46); c.fillStyle = sp.col; c.fillRect(x + 6, y + 50, 46, 2);
  const hd = SK[sp.skin].head; c.drawImage(hd, x + 29 - hd.width * 2.5, y + 10, hd.width * 5, hd.height * 5);
  textS(c, line[0], x + 60, y + 8, sp.col);
  let left = floor(d.t); L.forEach((l, i) => { if (left <= 0) return; drawText(c, l.slice(0, left), x + 60, y + 20 + i * 9, '#fff'); left -= l.length + 1; });
  if (d.t >= line[1].length && (performance.now() / 400 | 0) & 1) { const s = d.i < d.s.lines.length - 1 ? kb('click', 'tap') : 'done'; drawText(c, s, x + w - 8 - textW(s), y + h - 11, '#8b8fa3'); }
  hit(0, 0, uw, uh, () => dialogAdvance());
}
function drawUI(c) {
  HITS_NEXT = []; kitBegin(); const uw = VS.uw, uh = VS.uh, st = G.state;
  if (st === 'title') drawTitle(c); else if (st === 'shop') drawCosmeticShop(c); else if (st === 'accounts') drawAccounts(c); else if (st === 'howto') drawHowTo(c); else if (st === 'worlds') drawWorlds(c); else if (st === 'create') drawCreate(c); else if (st === 'ring') drawRingForm(c); else if (st === 'brform') drawBrForm(c); else if (st === 'bropen') drawBrOpen(c); else if (st === 'brlobby') drawBrLobby(c); else if (st === 'join') drawJoin(c); else if (st === 'wcopy') drawWorldCopy(c); else if (st === 'wpaste') drawWorldPaste(c);
  else if (st === 'loading') drawLoading(c);
  else if (st === 'intro') drawIntro(c);
  else if (G.cine && !UI.open) { // a panel opened during a place-name card (Esc, E) is drawn, not hidden behind it
    const ci = G.cine, a = clamp(min((ci.t - 30) / 25, (ci.dur - 20 - ci.t) / 25), 0, 1);
    c.globalAlpha = a; textC(c, ci.title, uw / 2, round(uh * .2), '#ffd35a', uw > 420 ? 3 : 2, textO); if (ci.sub) textC(c, ci.sub, uw / 2, round(uh * .2) + (uw > 420 ? 30 : 22), '#fff', 1, textO); c.globalAlpha = 1;
    if (ci.t > 30) textC(c, 'space to skip', uw / 2, uh - 14, '#6a6485', 1, textS);
    if (G.dialog) drawDialog(c);
  } else {
    if (UI.open && UI.open !== 'score') menuVeil(c, UI.open);
    drawHUD(c);
    if (UI.open === 'inv') drawInv(c); else if (UI.open === 'codex') drawCodex(c); else if (UI.open === 'journal') drawJournal(c); else if (UI.open === 'pause') drawPause(c); else if (UI.open === 'coop') drawCoopPanel(c);
    else if (UI.open === 'book') drawBook(c); else if (UI.open === 'stn') drawStation(c); else if (UI.open === 'knap') drawKnap(c); else if (UI.open === 'map') drawMap(c); else if (UI.open === 'board') drawBoard(c); else if (UI.open === 'rift') drawRiftUI(c); else if (UI.open === 'echo') drawEchoUI(c); else if (UI.open === 'ending') drawEndingUI(c);
    if (!SETTINGS.fpsMode) drawCompass(c);
    if (WORLD.arena && !WORLD.royale && keys.Tab && !UI.open) drawScore(c);
    if (G.dialog) drawDialog(c);
    if (UI.held) drawStack(c, UI.held, mouse.ux - 9, mouse.uy - 9);
    drawChatBox(c);
  }
  kitEnd(c);
  domSweep();
  HITS = HITS_NEXT;
  // FPS MODE: a plain cross to aim by while you play; every menu keeps the cursor
  if (SETTINGS.fpsMode && G.state === 'play' && !UI.open && !G.dialog) {
    const x = round(mouse.ux), y = round(mouse.uy);
    c.strokeStyle = '#17131f'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.moveTo(x, y - 6); c.lineTo(x, y + 6); c.stroke();
    c.strokeStyle = '#fff1a8'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x - 2, y); c.moveTo(x + 2, y); c.lineTo(x + 5, y); c.moveTo(x, y - 5); c.lineTo(x, y - 2); c.moveTo(x, y + 2); c.lineTo(x, y + 5); c.stroke();
  } else c.drawImage(SPR.cursor, mouse.ux - 3, mouse.uy - 3);
}
// ---------------- moving things in and out of the pack ----------------
// throw what you hold on the cursor into the world in front of you
function dropHeld() {
  if (!UI.held) return; const p = G.p, n0 = G.drops.length; spawnDrop(UI.held.id, UI.held.n, p.x + 3 + p.face * 8, p.y + 6, p.face * 2.2, -1.5);
  if (G.drops.length > n0) { G.drops[G.drops.length - 1].delay = 90; netDropOut(G.drops[G.drops.length - 1]); }
  UI.held = null; G.dirty = true; sfx('ui');
}
// [G]: drop one of what is in your hand (shift: the whole stack)
function dropSelected(all) {
  const s = inv[G.sel]; if (!s) { sfx('deny'); return; } const n = all ? s.n : 1, p = G.p, n0 = G.drops.length;
  spawnDrop(s.id, n, p.x + 3 + p.face * 8, p.y + 6, p.face * 2.2, -1.5); if (G.drops.length > n0) { G.drops[G.drops.length - 1].delay = 90; netDropOut(G.drops[G.drops.length - 1]); }
  s.n -= n; if (s.n <= 0) inv[G.sel] = null; G.dirty = true; sfx('ui');
}
// shift-click: hotbar to pack, or pack to hotbar
function quickMove(i) {
  const s = inv[i]; if (!s) return; const hn = hotN(), toPack = i < hn, a = toPack ? hn : 0, b = toPack ? INV_N : hn, st = IT[s.id].stack;
  for (let k = a; k < b && s.n > 0; k++) { const t = inv[k]; if (t && t.id === s.id && t.n < st) { const m = min(s.n, st - t.n); t.n += m; s.n -= m; } }
  for (let k = a; k < b && s.n > 0; k++) if (!inv[k]) { inv[k] = { id: s.id, n: s.n }; s.n = 0; }
  if (s.n <= 0) inv[i] = null; else { sfx('deny'); return; } G.dirty = true; sfx('ui');
}
// letting go of the mouse after dragging a stack: drop it on the slot under the cursor, or out into the world
function uiMouseUp() {
  const d = UI.dn; UI.dn = null; if (!d || d.had || !UI.held || G.state !== 'play') return;
  if (abs(mouse.ux - d.x) + abs(mouse.uy - d.y) < 5) return;
  for (let i = HITS.length - 1; i >= 0; i--) { const h = HITS[i]; if (inR(h.x, h.y, h.w, h.h)) { if (h.slot) h.fn(0); return; } }
  if (UI.open === 'inv') dropHeld();
}
