// ============================================================
//  THE IN-PLAY PANELS, part C of the menu redesign: every panel you open while you play is a place of the menu
//  kit (10-interface/4-menu-kit.js), drawn over the kit's veil: the pause panel, the pack, the forms codex, the
//  journal, the recipe book, the stations, chests, waystones, knapping, the map, the notice board, the rift,
//  the echo stone, the ending, play together, and the HUD-level dialog, say bubble, tooltips and ring scores.
//  This file holds their places and emblems, the local helpers they share (pcard, pchrome, pbtn, pfoot, prows),
//  and the pause panel, the codex and the journal. The others stay in their own files and use these helpers.
// ============================================================
// run: the world keeps going behind the pause panel (an arena, a match, friends); the hourglass runs only then
const PANEL = { run: false, tab: 'SETTINGS', ink: new Map(), bookT: 0, bookSt: '', chips: [], mapT: 0, needle: 0 };
Object.assign(MENUS, {
  pause: { col: '#c9d2ff', art: 'hourglass', motes: 'stars', place: 'THE WORLD HELD STILL', idle: '' },
  inv: { col: '#d99a5b', art: 'satchel', motes: 'dust', place: 'THE SATCHEL', idle: '' },
  codex: { col: '#9fc3ff', art: 'blade', motes: 'slashes', place: 'THE FORMS', idle: '' },

  book: { col: '#ffd35a', art: 'page', motes: 'dust', place: 'THE RECIPE BOOK', idle: '' },
  stn: { col: '#c9a46a', art: 'bench', motes: 'smoke', place: 'THE WORKSHOP', idle: '' },
  chest: { col: '#b07a45', art: 'chest', motes: 'dust', place: 'THE CHEST', idle: '' },
  way: { col: '#7fd8ff', art: 'rune', motes: 'glints', place: 'THE WAYSTONES', idle: '' },
  knap: { col: '#a9b4c8', art: 'flake', motes: 'chips', place: 'KNAPPING', idle: '' },
  map: { col: '#5fb0ff', art: 'compass', motes: null, place: 'THE FIELD MAP', idle: '', enter() { PANEL.mapT = performance.now(); } },
  board: { col: '#c8935a', art: 'notice', motes: 'dust', place: 'THE NOTICE BOARD', idle: '' },
  rift: { col: '#e05aff', art: 'swirl', motes: 'souls', place: 'THE RIFT', idle: '' },
  echo: { col: '#cfe8ff', art: 'rings', motes: 'glints', place: 'THE ECHO STONE', idle: '' },
  ending: { col: '#fff1a8', art: 'sunrise', motes: 'dust', place: 'THE DAWNFORGE', idle: '' },
  coop: { col: '#7ddc6f', art: 'camp', motes: 'fireflies', place: 'PLAY TOGETHER', idle: '' },
  coopLong: { col: '#7ddc6f', art: 'camp', motes: 'fireflies', place: 'LONG CODES', idle: '' },
  dialog: { col: '#ffd35a', art: null, motes: null, place: '', idle: '' },
  say: { col: '#ff8a3d', art: null, motes: null, place: '', idle: '' },
  tip: { col: '#6a6485', art: null, motes: null, place: '', idle: '' },
  score: { col: '#ff6b6b', art: 'crown', motes: null, place: 'THE SCORES', idle: '' }
});
// the panels' emblems: 16x16, 14 rects or fewer, live
const PFRAME = () => (performance.now() / 110) | 0;
Object.assign(MENU_ART, {
  // an hourglass: the sand runs only while the world behind runs
  hourglass(c, x, y) {
    const f = PANEL.run ? PFRAME() % 12 : 5, top = 4 - (f / 3 | 0), bot = 1 + (f / 3 | 0);
    c.fillStyle = '#8a6a48'; c.fillRect(x + 3, y + 1, 10, 2); c.fillRect(x + 3, y + 13, 10, 2);
    c.fillStyle = '#6a7090'; c.fillRect(x + 4, y + 3, 1, 4); c.fillRect(x + 11, y + 3, 1, 4); c.fillRect(x + 4, y + 9, 1, 4); c.fillRect(x + 11, y + 9, 1, 4); c.fillRect(x + 6, y + 7, 4, 2);
    c.fillStyle = '#ffd35a'; c.fillRect(x + 5, y + 7 - top, 6, top); c.fillRect(x + 5, y + 13 - bot, 6, bot);
    if (PANEL.run) { c.fillStyle = '#fff1a8'; c.fillRect(x + 7, y + 8, 2, 5 - bot); }
  },
  // a satchel whose flap lifts now and then
  satchel(c, x, y) {
    const up = performance.now() % 1600 < 260;
    c.fillStyle = '#6b4a2f'; c.fillRect(x + 2, y + 6, 12, 9); c.fillStyle = '#8a6a48'; c.fillRect(x + 3, y + 7, 10, 7);
    c.fillStyle = '#4a3220'; c.fillRect(x + 5, y + 2, 6, 1); c.fillRect(x + 4, y + 3, 1, 3); c.fillRect(x + 11, y + 3, 1, 3);
    c.fillStyle = '#d99a5b'; c.fillRect(x + 2, y + (up ? 4 : 6), 12, 4); c.fillStyle = '#ffd35a'; c.fillRect(x + 7, y + (up ? 7 : 9), 2, 2);
    if (up) { c.fillStyle = '#fff1a8'; c.fillRect(x + 6, y + 6, 1, 1); c.fillRect(x + 9, y + 5, 1, 1); }
  },
  // a blade with a glint running down it
  blade(c, x, y) {
    const g = PFRAME() % 14;
    c.fillStyle = '#6a7090'; for (let i = 0; i < 9; i++) c.fillRect(x + 4 + i, y + 10 - i, 2, 2);
    c.fillStyle = '#d8e4ff'; c.fillRect(x + 5, y + 9, 1, 1);
    c.fillStyle = '#8a6a48'; c.fillRect(x + 1, y + 12, 4, 2); c.fillStyle = '#ffd35a'; c.fillRect(x + 3, y + 10, 1, 5);
    if (g < 9) { c.fillStyle = '#fff'; c.fillRect(x + 4 + g, y + 10 - g, 2, 1); }
  },
  // a quill over an inkwell, a drop forming at its tip
  quill(c, x, y) {
    const d = PFRAME() % 10;
    c.fillStyle = '#e8e4f4'; c.fillRect(x + 9, y + 1, 3, 2); c.fillRect(x + 8, y + 3, 3, 2); c.fillRect(x + 7, y + 5, 3, 2); c.fillRect(x + 6, y + 7, 2, 2);
    c.fillStyle = '#b49cff'; c.fillRect(x + 12, y + 1, 2, 1); c.fillRect(x + 11, y + 3, 1, 2);
    c.fillStyle = '#4a4460'; c.fillRect(x + 5, y + 9, 1, 2);
    c.fillStyle = '#2b2740'; c.fillRect(x + 2, y + 12, 7, 3); c.fillStyle = '#1d1a29'; c.fillRect(x + 3, y + 11, 5, 1);
    if (d < 6) { c.fillStyle = '#7a62c8'; c.fillRect(x + 5, y + 11 + (d >> 1), 1, 1); }
  },
  // an open book whose page turns
  page(c, x, y) {
    const f = PFRAME() % 18, t = f < 6 ? f : 6;
    c.fillStyle = '#8a6a48'; c.fillRect(x + 1, y + 4, 14, 10); c.fillStyle = '#e8dcc0'; c.fillRect(x + 2, y + 4, 5, 9); c.fillRect(x + 9, y + 4, 5, 9);
    c.fillStyle = '#4a3220'; c.fillRect(x + 7, y + 3, 2, 11);
    c.fillStyle = '#b9a888'; c.fillRect(x + 3, y + 6, 3, 1); c.fillRect(x + 3, y + 8, 3, 1); c.fillRect(x + 10, y + 6, 3, 1); c.fillRect(x + 10, y + 8, 3, 1);
    if (f < 6) { c.fillStyle = '#fff1a8'; c.fillRect(x + 9 + (t >> 1) - (t > 3 ? (t - 3) * 2 : 0), y + 2 + (t >> 1), 3, 8 - t); }
  },
  // the station's own sprite (its item's icon); chests and waystones draw theirs
  bench(c, x, y) { const ic = stnIcon(); if (ic) c.drawImage(ic, x + 8 - (ic.width >> 1), y + 8 - (ic.height >> 1)); },
  chest(c, x, y) {
    const open = performance.now() % 2200 < 300;
    c.fillStyle = '#4a3220'; c.fillRect(x + 1, y + 6, 14, 9); c.fillStyle = '#b07a45'; c.fillRect(x + 2, y + 7, 12, 7);
    c.fillStyle = '#8a5a30'; c.fillRect(x + 1, y + (open ? 2 : 4), 14, 3); c.fillStyle = '#ffd35a'; c.fillRect(x + 7, y + 8, 2, 3);
    if (open) { c.fillStyle = '#fff1a8'; c.fillRect(x + 4, y + 5, 8, 1); }
  },
  // a standing stone with a rune that lights and fades
  rune(c, x, y) {
    const a = .4 + .6 * abs(sin(performance.now() / 600));
    c.fillStyle = '#4a4460'; c.fillRect(x + 4, y + 2, 8, 13); c.fillStyle = '#6a6485'; c.fillRect(x + 5, y + 1, 6, 1); c.fillRect(x + 3, y + 14, 10, 2);
    const ga = c.globalAlpha; c.globalAlpha = ga * a; c.fillStyle = '#7fd8ff'; c.fillRect(x + 7, y + 4, 2, 8); c.fillRect(x + 5, y + 6, 6, 1); c.fillRect(x + 6, y + 10, 4, 1); c.globalAlpha = ga;
  },
  // a flint core and the hammerstone that strikes it
  flake(c, x, y) {
    const hitNow = performance.now() % 1000 < 120;
    c.fillStyle = '#456878'; c.fillRect(x + 2, y + 8, 9, 6); c.fillStyle = '#6f97a8'; c.fillRect(x + 3, y + 8, 6, 2);
    c.fillStyle = '#8a8296'; c.fillRect(x + (hitNow ? 9 : 11), y + (hitNow ? 4 : 1), 5, 4);
    if (hitNow) { c.fillStyle = '#fff'; c.fillRect(x + 12, y + 9, 1, 1); c.fillRect(x + 14, y + 7, 1, 1); c.fillStyle = '#a9b4c8'; c.fillRect(x + 13, y + 11, 1, 1); }
  },
  // a compass whose needle swings, then settles, each time the map opens
  compass(c, x, y) {
    const t = (performance.now() - PANEL.mapT) / 1000, a = -PI / 2 + sin(t * 9) * 1.2 * Math.exp(-t * 2.2);
    c.fillStyle = '#8a6a48'; c.fillRect(x + 3, y + 2, 10, 12); c.fillRect(x + 2, y + 4, 12, 8);
    c.fillStyle = '#f4efe6'; c.fillRect(x + 4, y + 3, 8, 10); c.fillRect(x + 3, y + 5, 10, 6);
    c.fillStyle = '#e2483b'; for (let k = 1; k < 5; k++) c.fillRect(round(x + 7.5 + cos(a) * k), round(y + 7.5 + sin(a) * k), 1, 1);
    c.fillStyle = '#365058'; for (let k = 1; k < 4; k++) c.fillRect(round(x + 7.5 - cos(a) * k), round(y + 7.5 - sin(a) * k), 1, 1);
  },
  // a board with two pinned notes, one fluttering
  notice(c, x, y) {
    const fl = PFRAME() % 16 < 3;
    c.fillStyle = '#6b4a2f'; c.fillRect(x + 1, y + 2, 14, 10); c.fillRect(x + 3, y + 12, 2, 4); c.fillRect(x + 11, y + 12, 2, 4);
    c.fillStyle = '#e8dcc0'; c.fillRect(x + 3, y + 4, 4, 5); c.fillRect(x + 9, y + (fl ? 3 : 4), 4, fl ? 6 : 5);
    c.fillStyle = '#e2483b'; c.fillRect(x + 4, y + 4, 1, 1); c.fillRect(x + 11, y + 4, 1, 1);
  },
  // a swirling portal
  swirl(c, x, y) {
    const t = performance.now() / 300;
    c.fillStyle = '#3a1f4a'; c.fillRect(x + 3, y + 2, 10, 12); c.fillStyle = '#7a3aa0'; c.fillRect(x + 5, y + 4, 6, 8);
    c.fillStyle = '#e05aff'; for (let k = 0; k < 6; k++) { const a = t + k * TAU / 6, r = 2 + (k % 3); c.fillRect(round(x + 7.5 + cos(a) * r), round(y + 7.5 + sin(a) * r * 1.3), 1, 1); }
    c.fillStyle = '#fff'; c.fillRect(x + 7, y + 7, 2, 2);
  },
  // an echo stone and the rings that go out from it
  rings(c, x, y) {
    const u = (performance.now() % 1800) / 1800, r = 1 + round(u * 6), ga = c.globalAlpha;
    c.fillStyle = '#4a4460'; c.fillRect(x + 6, y + 6, 4, 9); c.fillStyle = '#cfe8ff'; c.fillRect(x + 7, y + 8, 2, 2);
    c.globalAlpha = ga * (1 - u); c.fillStyle = '#cfe8ff'; c.fillRect(x + 8 - r, y + 9 - r, r * 2, 1); c.fillRect(x + 8 - r, y + 9 + r, r * 2, 1); c.fillRect(x + 8 - r, y + 9 - r, 1, r * 2); c.fillRect(x + 8 + r, y + 9 - r, 1, r * 2 + 1); c.globalAlpha = ga;
  },
  // a sun rising over a line of land
  sunrise(c, x, y) {
    const u = min(1, (UI.endT || 0) / 400), sy = y + 12 - round(u * 7);
    c.fillStyle = '#ff8a3d'; c.fillRect(x + 4, sy, 8, 4); c.fillStyle = '#fff1a8'; c.fillRect(x + 5, sy + 1, 6, 2);
    c.fillStyle = '#ffd35a'; c.fillRect(x + 7, sy - 3, 2, 2); c.fillRect(x + 1, sy + 1, 2, 1); c.fillRect(x + 13, sy + 1, 2, 1);
    c.fillStyle = '#2b2740'; c.fillRect(x, y + 13, 16, 3);
  },
  // a campfire with two heads by it
  camp(c, x, y) {
    const f = PFRAME() % 4;
    c.fillStyle = '#4a3220'; c.fillRect(x + 5, y + 13, 6, 2);
    c.fillStyle = '#ff8a3d'; c.fillRect(x + 6, y + 9 + (f & 1), 4, 4 - (f & 1)); c.fillStyle = '#ffd35a'; c.fillRect(x + 7, y + 10 + (f >> 1), 2, 3 - (f >> 1));
    c.fillStyle = '#e8c9a0'; c.fillRect(x, y + 8, 4, 4); c.fillRect(x + 12, y + 8, 4, 4);
    c.fillStyle = '#7ddc6f'; c.fillRect(x, y + 12, 4, 3); c.fillStyle = '#8ff5e6'; c.fillRect(x + 12, y + 12, 4, 3);
  },
  // the ring's crown (the scoreboard)
  crown(c, x, y) {
    const g = PFRAME() % 12;
    c.fillStyle = '#ffd35a'; c.fillRect(x + 2, y + 6, 12, 6); c.fillRect(x + 2, y + 3, 2, 3); c.fillRect(x + 7, y + 2, 2, 4); c.fillRect(x + 12, y + 3, 2, 3);
    c.fillStyle = '#ff6b6b'; c.fillRect(x + 7, y + 8, 2, 2); c.fillStyle = '#b8862a'; c.fillRect(x + 2, y + 11, 12, 1);
    if (g < 2) { c.fillStyle = '#fff'; c.fillRect(x + 3 + g * 5, y + 7, 1, 1); }
  }
});
// the item icon of the open station (its emblem)
const STN_ICON_ITEM = { chest: 'chest', way: 'waystone', fire: 'campfire', kiln: 'furnace' };
function stnIcon() {
  const S = UI.stn; if (!S) return null; const B0 = BENCHES.find(b => b.st === S.kind), id = (B0 && B0.item) || STN_ICON_ITEM[S.kind];
  const it = id && IT[id]; return it && it.icon || null;
}
// a station's accent: wood, fire, stone and metal, the pot; chests and waystones have their own places
function stnCol(kind) {
  return kind === 'chest' ? '#b07a45' : kind === 'way' ? '#7fd8ff' : ['fire', 'kiln', 'bloom'].includes(kind) ? '#e2542b' : ['anvil', 'armr', 'mason', 'quern', 'sieve'].includes(kind) ? '#b9bdd0' : kind === 'pot' ? '#58a868' : '#c9a46a';
}

// ---------------- helpers the panels share ----------------
const pclose = () => { closeUI(); sfx('ui'); };
// a panel's card: where menuFrame puts it (or o.frame), its motes around it, a hit that swallows clicks on it, the kit card
// with the close box (on a computer; a phone has its CLOSE pill). o = {frame, foot, right, close, art, col, i, dom, motes, avoid}
function pcard(c, id, wantW, wantH, title, o = {}) {
  const F = o.frame || menuFrame(id, wantW, wantH), M = MENUS[id] || {};
  if (o.motes !== false && M.motes) menuMotes(c, M.motes, { avoid: [F].concat(o.avoid || []) });
  hit(F.x, F.y, F.w, F.h, () => { });
  const K = kcard(c, F.x, F.y, F.w, F.h, id, title, { foot: o.foot, i: o.i || 0, right: o.right, close: o.close === false ? null : o.close || pclose, art: o.art, col: o.col, dom: o.dom });
  K.mode = F.mode || menuMode(); return K;
}
// the compact card of the pack and the worn panel: kit colours and a stitched edge at today's rects, a 16-px head
function pchrome(c, x, y, w, h, id, title, o = {}) {
  const M = MENUS[id] || {}, col = o.col || M.col || '#ffd35a', k = 'pch|' + w + 'x' + h + '|' + title + '|' + col + '|' + !!o.art; KIT.col = col;
  let img = KIT.cache.get(k);
  if (!img) {
    const [cv2, x2] = mk(w + 2, h + 2), st = mix('#221e30', col, .45);
    x2.fillStyle = INK; x2.fillRect(0, 0, w + 2, h + 2); x2.fillStyle = 'rgba(22,17,34,.92)'; x2.fillRect(1, 1, w, h);
    x2.fillStyle = col; x2.fillRect(1, 1, w, 2); x2.fillStyle = '#2b2740'; x2.fillRect(1, 16, w, 1);
    x2.fillStyle = st; for (let i = 5; i < w - 3; i += 5) { x2.fillRect(1 + i, h - 2, 3, 1); } for (let j = 21; j < h - 4; j += 5) { x2.fillRect(3, 1 + j, 1, 3); x2.fillRect(w - 2, 1 + j, 1, 3); }
    textS(x2, title, o.art ? 22 : 6, 6, col);
    img = kitCache(k, cv2);
  }
  c.drawImage(img, x - 1, y - 1);
  if (o.art && MENU_ART[o.art]) MENU_ART[o.art](c, x + 3, y);
}
// a kit-look button of any height (for the tight rows of the pack and the stations); o = {main, off, on, danger, hint, short, tag}
function pbtn(c, x, y, w, h, label, fn, o = {}) {
  const off = !!o.off, acc = o.danger ? '#ff6b6b' : KIT.col, tag = o.tag || 'btn:' + label, foc = kfoc(tag), hv = !off && kin(x, y, w, h), lit = hv || foc;
  let bd, fill, lc;
  if (off) { bd = '#2b2740'; fill = '#1d1a29'; lc = '#6a6485'; }
  else if (o.main) { bd = acc; fill = lit ? mix('#3a3350', acc, .2) : mix('#262234', acc, .16); lc = '#fff1a8'; }
  else if (o.on) { bd = acc; fill = '#3d3320'; lc = acc; }
  else if (lit) { bd = acc; fill = '#3a3350'; lc = acc; }
  else { bd = '#4a4460'; fill = '#262234'; lc = o.danger ? '#ff9a8a' : '#fff'; }
  c.fillStyle = bd; c.fillRect(x, y, w, h); c.fillStyle = fill; c.fillRect(x + 1, y + 1, w - 2, h - 2);
  const s = textW(label) <= w - 6 ? label : o.short && textW(o.short) <= w - 6 ? o.short : fitText(label, w - 6);
  textC(c, s, x + w / 2, y + round((h - 8) / 2), lc, 1, drawText);
  if (foc) kring(c, x, y, w, h);
  if (lit || (off && inR(x, y, w, h))) khint(o.hint);
  if (!off) { if (o.main) KIT.main = fn; khit(x, y, w, h, fn, tag, o.hint); kctrl({ tag, kind: 'btn', x, y, w, h, fn }); }
  return hv;
}
// a card's foot strip says only why a button is off, what a setting does, or what a tap just did
function pfoot(c, K, idle, room) {
  const t = kitSaid();
  if (t) drawText(c, fitText(t, room || K.w - 12), K.x + 6, K.footY + round((KIT.bh + 10 - 8) / 2), '#d8d4e6');
}
// n rows of rh px in box B, scrolling (kscroll id) when they do not fit; fn(i, y) draws row i (only the rows in view)
function plist(c, B, n, rh, id, fn) {
  const need = n * rh + 4, sc = need > B.h, dy = sc ? kscroll(c, B, need, id) : 0;
  const i0 = max(0, floor(-dy / rh) - 1), i1 = min(n, i0 + ceil(B.h / rh) + 3);
  for (let i = i0; i < i1; i++) fn(i, B.y + 2 + dy + i * rh);
  if (sc) kscrollEnd(c);
}
// rows of text [text, colour] (9 px apart) in box B
function prows(c, B, rows, id, x0 = 7) { plist(c, B, rows.length, 9, id, (i, y) => { const r = rows[i]; if (r && r[0]) drawText(c, r[0], B.x + x0, y, r[1]); }); }
// a list of rows over UI.scroll that the wheel, a finger and Up / Down move (rows of the pack, the stations, the book)
function pscroller(B, n, vis) { const most = max(0, n - vis); UI.scroll = clamp(UI.scroll | 0, 0, most); if (most > 0) KIT.scrollers.push({ x: B.x, y: B.y, w: B.w, h: B.h, by: d => { UI.scroll = clamp(UI.scroll + d, 0, most); } }); }
// scroll is up to the wheel, or a finger
const pwheel = () => kb('wheel', 'slide');

// ---------------- THE PAUSE PANEL: THE WORLD HELD STILL ----------------
// The actions (THE WORLD card) beside a card of tabs: SETTINGS, KEYS (TOUCH on a phone) and THIS WORLD (its traits).
// A phone held upright gets one card: the actions two by two over the tabs, all of it scrolling over a pinned foot.
// a touch screen has no C key: the forms codex opens from here
function pauseBooks(L, A) {
  if (!KIT.T) return;
  L.push({ l: 'FORMS', fn: () => toggleUI('codex') });
}
function pauseActs(A) {
  const leave = () => { closeUI(); if (WORLD.royale && BR.on && BR.via !== 'solo') brBackToLobby(); else quitToTitle(); sfx('ui'); };
  const L = [{ l: 'RESUME', fn: () => { closeUI(); sfx('ui'); }, o: { main: true, hint: kb('Back to the world (Esc or P).', 'Back to the world.') } }];
  if (A) {
    const l = WORLD.royale ? (BR.via !== 'solo' ? 'TO THE LOBBY' : 'LEAVE MATCH') : 'LEAVE FFA';
    L.push({ l, fn: leave, o: { danger: true, hint: WORLD.royale ? (BR.via !== 'solo' ? 'Leave the match for the lobby.' : 'Leave the match.') : 'Leave the arcade for the home page.' } });
    if (wildOn() && BR.teammate) L.push({ l: 'LEAVE PACT', fn: () => { brBreakPact(false); closeUI(); }, o: { hint: 'Break the pact with your teammate.' } });
    pauseBooks(L, A); return L;
  }
  L.push({ l: 'SAVE', fn: () => { saveWorld(); sfx('craft'); }, o: { hint: 'Save this world now.' } });
  L.push({ l: 'SAVE & QUIT', fn: leave, o: { hint: 'Save, and go back to the home page.' } });
  if (netGuest()) L.push({ l: 'LEAVE THEIR WORLD', fn: () => { closeUI(); quitToTitle(); }, o: { danger: true, short: 'LEAVE', hint: 'Your pack is kept on this computer for next time.' } });
  else L.push({ l: COOP.role ? 'PLAY TOGETHER (' + (1 + [...COOP.peers.values()].filter(P => P.ok).length) + ')' : 'PLAY TOGETHER', fn: () => { UI.open = 'coop'; COOP.err = ''; sfx('ui'); }, o: { short: 'TOGETHER', hint: 'Let friends join this world with a code.' } });
  pauseBooks(L, A);
  if (G.p && !G.boss && !G.duel) L.push({ l: 'WAKE AT THE FIRE', fn: () => { closeUI(); wakeAtFire(); }, o: { short: 'TO THE FIRE', hint: 'Walk back to the fire or your bedroll. It costs a meal.' } });
  return L;
}
// (the switches are settingRows, 8-settings.js: the same ones the home page's SETTINGS shows)
const pauseSets = A => settingRows(A);
// the keys (on a touch screen, the buttons) as [key, what it does]
function pauseKeys(A) {
  const simple = SETTINGS.combat === 'simple', aim = simple ? 'aim up to launch, aim down or hold S for low blows; click a creature to punch it, whatever you hold' : 'where you aim, the keys you hold, the air and the cursor\'s distance change the attack';
  const beat = ['the beat', 'strike again on the GLINT; five in time is DRUMFIRE.'];
  if (KIT.T) return [['stick', 'walk; push down to drop through bridges'], ['JUMP', 'jump'], ['DASH', 'dodge'], ['LIGHT', 'a light blow'], ['HEAVY', 'a heavy blow'], beat,
    ...(A ? [['finger', 'aims where it points']] : [['USE', 'talk, use; beside a station, use it'], ['PACK', 'pack and crafting'], ['finger', 'held on the ground, digs where it points']]),
    ['MENU', 'this menu'], ...(A ? [['', 'Echoes leave when a Waker joins.']] : [['', 'Ore, keys and such leave your fists free.']])];
  if (A) return [['A / D', 'move'], ['SPACE, W', 'jump'], ['SHIFT', 'dodge'], ['LMB', 'light blow'], ['RMB, Q', 'heavy blow'], ['aim', aim], beat, ['1-6', 'weapons'], ['TAB', 'scores'], ['C', 'forms'], ['O', 'sound'], ['R / T', 'throw / switch sidearm'], ['', 'Echoes leave when a Waker joins.']];
  return [['A / D', 'move'], ['SPACE, W', 'jump'], ['SHIFT', 'dodge'], ['LMB', 'light blow'], ['RMB, Q', 'heavy blow; tools: hold RMB'], ['aim', aim], beat, ['1-0, wheel', 'hotbar'], ['E', 'pack + crafting'], ['C', 'forms'],
    ['F', 'talk / use; beside a station, use it'], ['H', 'quick heal'], ['R / T', 'throw / switch sidearm'], ['S held', 'drop through bridges'], ['W / S', 'climb ladders'], ['RMB', 'opens doors'], ['K', 'knap'], ['M', 'map'], ['V', 'weapon style (5 per weapon)'], ['X', 'swap to off hand'], ['', 'Ore, keys and such leave your fists free. Tools swing where you point, at rock or beast.']];
}
const pauseTabs = A => A || DIM || !WT_ON || !WT_KEYS.length ? ['SETTINGS', kb('KEYS', 'TOUCH')] : ['SETTINGS', kb('KEYS', 'TOUCH'), 'THIS WORLD'];
// a tab's body at width w from y; returns its height (draw false only measures)
function pauseBody(c, x, y, w, tab, A, draw) {
  const S = KIT.sizes;
  if (tab === 'SETTINGS') return settingGrid(c, x, y, w, pauseSets(A), 2, draw);
  if (tab === 'THIS WORLD') {
    let yy = y; if (draw) drawText(c, 'THIS WORLD IS', x, yy, '#8b8fa3'); yy += 12;
    for (const k of WT_KEYS) { const t = TRAITS[k]; if (draw) drawText(c, t.n, x, yy, TRAIT_COL[t.g]); yy += 10; for (const l of wrapC(t.d, w - 8)) { if (draw) drawText(c, l, x + 8, yy, '#b9bdd0'); yy += 9; } yy += 3; }
    return yy - y;
  }
  const K = pauseKeys(A), kw = min(max(...K.map(k => textW(k[0]))) + 8, round(w * .34)); let yy = y;
  for (const [k, t] of K) {
    const L = wrapC(t, w - (k ? kw : 0) - 2), col = k === 'the beat' ? '#8ff5e6' : k ? '#d8d4e6' : '#8b8fa3';
    if (draw) { if (k) drawText(c, k, x, yy, KIT.col); L.forEach((l, i) => drawText(c, l, x + (k ? kw : 0), yy + i * 9, col)); }
    yy += L.length * 9 + 2;
  }
  return yy - y;
}
function drawPause(c) {
  const A = WORLD.arena, S = KIT.sizes, uw = VS.uw, acts = pauseActs(A), tabs = pauseTabs(A);
  PANEL.run = !!A || netLive();
  if (!tabs.includes(PANEL.tab)) PANEL.tab = tabs[0];
  const name = A ? (WORLD.royale ? (BR.wild ? 'THE WILDS' : 'THE ASHFALL TRIALS') : 'FFA ARCADE') : WORLD.name.toUpperCase();
  const yl = A || DIM ? '' : yearLine(), held = PANEL.run ? (A ? 'THE MATCH RUNS ON' : 'THE WORLD RUNS ON') : 'THE WORLD HELD STILL';
  const setTab = nm => { if (PANEL.tab !== nm) { PANEL.tab = nm; KIT.sy.pause = 0; KIT.sy.pauseN = 0; } };
  const idle = kb('Esc or P goes back to the world.', 'RESUME or CLOSE goes back to the world.');
  const year = (c2, rx, ry, room) => { if (!yl) return; const s = fitText(yl, room); textS(c2, s, rx - textW(s), ry + 5, SEASON().col); };
  if (uw - 24 >= 400) {
    // two cards: THE WORLD (what you can do) and the tabs
    const W = min(460, uw - 24), lw = KIT.T ? 170 : 150, rw = W - lw - 8, bw = lw - 16;
    const leftH = 29 + acts.length * (S.bh + S.gap) - S.gap + 8, setH = pauseBody(c, 0, 0, rw - 16, 'SETTINGS', A, false);
    const F = menuFrame('pause', W, max(leftH, 29 + S.tab + 8 + setH + 8 + S.bh + 10)), L = { x: F.x, y: F.y, w: lw, h: F.h }, R = { x: F.x + lw + 8, y: F.y, w: rw, h: F.h };
    const KL = pcard(c, 'pause', 0, 0, fitText(name, lw - 34), { frame: L, close: false, i: 0, avoid: [R] });
    let yy = KL.by + 1; for (const q of acts) { kbutton(c, KL.x + 8, yy, bw, q.l, q.fn, q.o); yy += S.bh + S.gap; }
    const KR = pcard(c, 'pause', 0, 0, fitText(held, rw - 40 - (yl ? min(textW(yl), rw - 150) + 8 : 0) - (KIT.T ? 0 : 20)), { frame: R, foot: true, i: 1, motes: false, right: (c2, rx, ry) => year(c2, rx, ry, rw - 150) });
    const x = KR.x + 8, w = KR.w - 16; yy = KR.by + 1;
    yy += ktabs(c, x, yy, w, tabs, PANEL.tab, setTab) + 4;
    const B = { x: KR.x + 1, y: yy, w: KR.w - 2, h: KR.footY - 4 - yy }, need = pauseBody(c, 0, 0, w - 6, PANEL.tab, A, false), sc = need > B.h, dy = sc ? kscroll(c, B, need + 4, 'pause') : 0;
    pauseBody(c, x, yy + 2 + dy, w - 6, PANEL.tab, A, true); if (sc) kscrollEnd(c);
    pfoot(c, KR, idle);
    return;
  }
  // one card: the actions two by two, the year, the tabs and the tab, all scrolling over a pinned foot with the hint
  const W = uw - 12, w = W - 16, cw = floor((w - S.gap) / 2), actH = ceil(acts.length / 2) * (S.bh + S.gap), tabH = S.tab + 6;
  const bodyH = actH + 4 + (yl ? 11 : 0) + tabH + pauseBody(c, 0, 0, w - 6, PANEL.tab, A, false) + 6;
  const K = pcard(c, 'pause', W, 29 + bodyH + S.bh + 10 + 4, fitText(name + '  :  ' + held, W - 40), { foot: true, i: 0 }), x = K.x + 8;
  const B = { x: K.x + 1, y: K.by, w: K.w - 2, h: K.footY - 4 - K.by }, sc = bodyH > B.h, dy = sc ? kscroll(c, B, bodyH, 'pauseN') : 0; let yy = K.by + 1 + dy;
  acts.forEach((q, i) => kbutton(c, x + (i & 1) * (cw + S.gap), yy + (i >> 1) * (S.bh + S.gap), cw, q.l, q.fn, q.o)); yy += actH + 4;
  if (yl) { textS(c, fitText(yl, w), x, yy, SEASON().col); yy += 11; }
  yy += ktabs(c, x, yy, w, tabs, PANEL.tab, setTab, { cols: tabs.length }) + 4;
  pauseBody(c, x, yy, w - 6, PANEL.tab, A, true);
  if (sc) kscrollEnd(c);
  pfoot(c, K, idle);
}

// ---------------- THE FORMS CODEX: a glinting blade, slashes in the air ----------------
// Nine tabs (two rows below the widest screens); the list scrolls, clipped above a footer pinned to the card's bottom.
const CODEX_SETS = ['brawl', 'sword', 'spear', 'fangs', 'maul', 'bow', 'chuks', 'links', 'styles'], CODEX_TABS = ['FISTS', 'BLADE', 'PIKE', 'FANGS', 'MAUL', 'BOW', 'CHAIN', 'LINKS', 'STYLE'];
// forms that only the movement keys or cursor distance reach: not used with SIMPLE controls
const fullOnly = (set, id) => SETTINGS.combat === 'simple' && ['far', 'back', 'near', 'hBack'].some(k => set.map[k] === id) && !['up', 'upf', 'down', 'h', 'hUp', 'hDown', 'hFwd', 'dash', 'rip', 'aD', 'aU', 'ha', 'haU', 'haD'].some(k => set.map[k] === id) && !set.map.chain.includes(id) && !set.map.aChain.includes(id);
const ST_NAME = { pin: 'pinned', hook: 'hooked', burn: 'burning', blind: 'blinded', launched: 'in the air' };
function drawCodex(c) {
  const sn = UI.codex || 'sword', mode = menuMode(), set = MOVESETS[sn];
  const setTab = nm => { const s = CODEX_SETS[CODEX_TABS.indexOf(nm)]; if (s !== UI.codex) { UI.codex = s; UI.scroll = 0; KIT.sy.codex = 0; } };
  let title = 'STYLES';
  if (sn === 'links') title = `LINKS ${G.linksKnown.size}/${LINK_ORDER.length}`;
  else if (sn !== 'styles') { let kn = 0, tot = 0; for (const k in set.moves) { if (isStyleId(k)) continue; tot++; if (G.known.has(sn + ':' + k)) kn++; } title = `FORMS ${kn}/${tot}`; }
  const F = menuFrame('codex', 430, 360), K = pcard(c, 'codex', 0, 0, title, { frame: F }), x = K.x + 8, w = K.w - 16; let yy = K.by + 1;
  yy += ktabs(c, x, yy, w, CODEX_TABS, CODEX_TABS[CODEX_SETS.indexOf(sn)], setTab, mode === 'narrow' ? { cols: 5 } : {}) + 2;
  // the footer: mastery, the beat, the controls, what freshness does
  const foot = [];
  if (sn === 'links') foot.push(['A link fires when you attack a foe in that state, close enough.', '#8ff5e6']);
  else if (sn !== 'styles') {
    const st = famStep(sn), xp = (G.fam && G.fam[sn]) || 0;
    foot.push([(FAM_NAME[sn] || '') + ': ' + FAM_STEP[st] + (st < 3 && !famAll() ? '  ' + floor(xp) + '/' + FAM_AT[st + 1] + ' to ' + FAM_STEP[st + 1] : '') + '.  Best at ' + (FAM_LEAN_T[sn] || 'everything') + '.', '#ffd35a']);
    if (FAM_TEMPO_T[sn]) foot.push(['In time: ' + FAM_TEMPO_T[sn] + '.', '#8ff5e6']);
    foot.push([KIT.T ? 'Where you aim chooses the form.' : SETTINGS.combat === 'simple' ? 'SIMPLE controls: aim and S choose the form, not A / D.' : 'Forward key = A or D toward your cursor. Back key = away.', '#b9bdd0']);
    foot.push(['Fresh forms hit 10% harder. Repeats go dull. ' + kb('Wheel scrolls.', 'Slide to scroll.'), '#8ff5e6']);
  }
  const FL = []; for (const [t, col] of foot) for (const l of wrapC(t, w)) FL.push([l, col]);
  const fy = K.y + K.h - 5 - FL.length * 9;
  if (FL.length) { c.fillStyle = '#2b2740'; c.fillRect(K.x + 1, fy - 4, K.w - 2, 1); FL.forEach((r, i) => drawText(c, r[0], x, fy + i * 9, r[1])); }
  const B = { x: K.x + 1, y: yy, w: K.w - 2, h: (FL.length ? fy - 6 : K.y + K.h - 4) - yy };
  if (sn === 'styles') { drawStylesPage(c, B, x, w); return; }
  if (sn === 'links') {
    const rows = [{ h: 'SIDEARMS : ' + kb('[R] THROW  [T] SWITCH', 'THROW  SWITCH') }];
    for (const t of ['Star Knife: carries a foe into the nearest wall and pins it there.', 'Chain Hook: drags a foe to you, or you to a wall. Big foes pull you in.', 'Ember Flask: bursts into fire that clings. Smoke Pellet: blinds.', 'Launchers (aim up) throw a foe into the air.']) for (const l of wrapC(t, w - 4)) rows.push({ t: l });
    rows.push({ h: 'LINKS : THE RIGHT WEAPON ON THE RIGHT MOMENT' });
    for (const id of LINK_ORDER) rows.push({ L: LINKS[id], k: G.linksKnown.has(id) });
    plist(c, B, rows.length, 10, 'codex', (i, ry) => {
      const r = rows[i];
      if (r.h) { textS(c, fitText(r.h, w), x, ry, '#ffd35a'); return; } if (r.t) { drawText(c, r.t, x + 2, ry, '#e8edf2'); return; }
      const L = r.L, names = L.sets.length > 4 ? 'any close weapon' : L.sets.map(s => CODEX_TABS[CODEX_SETS.indexOf(s)]).join(' / '), nx = min(98, round(w * .3));
      c.fillStyle = r.k ? '#7ddc6f' : '#4a4460'; c.fillRect(x + 1, ry + 1, 3, 5);
      drawText(c, fitText(r.k ? L.name : '???', nx - 10), x + 7, ry, r.k ? '#fff' : '#8b8fa3');
      drawText(c, fitText(`${ST_NAME[L.st]} + ${names} + ${L.btn === 'L' ? kb('LMB', 'LIGHT') : kb('RMB', 'HEAVY')}`, w - nx), x + nx, ry, r.k ? '#b9bdd0' : '#6f6a85');
    });
    return;
  }
  const rows = []; for (const [sec, ids] of set.sections) { rows.push({ h: sec }); for (const id of ids) rows.push({ id, m: set.moves[id] }); }
  const nx = min(102, round(w * .32));
  plist(c, B, rows.length, 9, 'codex', (i, ry) => {
    const r = rows[i];
    if (r.h) { textS(c, r.h, x, ry, '#ffd35a'); c.fillStyle = '#4a4460'; c.fillRect(x + 4 + textW(r.h), ry + 3, w - 6 - textW(r.h), 1); return; }
    const k = G.known.has(sn + ':' + r.id), lock = !famOpen(sn, r.id) || (r.m.art && !famAll() && !(G.arts && [...G.arts].some(q => q.startsWith(sn) && +q.slice(sn.length) >= r.m.art))), off = fullOnly(set, r.id) || lock;
    c.fillStyle = off ? '#4a4460' : r.m.btn === 'L' ? '#6c93a8' : '#ff8a3d'; c.fillRect(x + 1, ry, 2, 7); drawText(c, fitText(r.m.name, nx - 14), x + 7, ry, off ? '#6a6485' : k ? '#fff' : '#8b8fa3');
    if (k && !off) { c.fillStyle = '#7ddc6f'; c.fillRect(x + nx - 6, ry + 2, 3, 3); }
    drawText(c, fitText(lock ? (r.m.art ? 'art of ' + ART_TIER_N[r.m.art] + ' weapons' : 'learned at ' + FAM_STEP[set.tier[r.id]]) : off ? 'FULL controls only (pause menu)' : r.m.hint, w - nx - 4), x + nx, ry, off ? '#5a5470' : k ? '#b9bdd0' : '#6f6a85');
  });
}


