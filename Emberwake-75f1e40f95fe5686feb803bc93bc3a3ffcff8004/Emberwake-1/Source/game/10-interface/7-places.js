// ============================================================
//  THE PLACES OUTSIDE PLAY (part A of the menu redesign), built
//  with the menu kit (4-menu-kit.js):
//    howto    THE TRAINING YARD  how to play: four tabs, a beat ticking in the head
//    worlds   THE MAP TABLE      your worlds, each with a little chart of its land
//    create   THE ANVIL          forging a new world: ROLL throws sparks
//    intro    the four pages of the story before a new world
//    loading  the wait, with the emblem of where you are going
//  Joining a friend (THE SIGNAL BEACON) and copying a world (THE
//  SCRIBE'S DESK) are in 12-playing-together; the sign-in board
//  (THE HEARTH) is 5-accounts.js.
// ============================================================
Object.assign(MENU_ART, {
  // a training post whose lamp flashes on the beat (every 600 ms, the GLINT's tempo)
  post(c, x, y) {
    const on = performance.now() % 600 < 130;
    c.fillStyle = '#4b6d78'; c.fillRect(x + 7, y + 7, 2, 8); c.fillRect(x + 5, y + 14, 6, 2);
    c.fillStyle = '#365058'; c.fillRect(x + 5, y + 1, 6, 1); c.fillRect(x + 4, y + 2, 1, 4); c.fillRect(x + 11, y + 2, 1, 4); c.fillRect(x + 5, y + 6, 6, 1);
    c.fillStyle = on ? '#fff1a8' : '#ffb347'; c.fillRect(x + 5, y + 2, 6, 4);
    c.fillStyle = on ? '#8ff5e6' : '#ffd35a'; c.fillRect(x + 7, y + 3, 2, 2);
    if (on) { c.fillStyle = '#8ff5e6'; c.fillRect(x + 1, y + 3, 2, 1); c.fillRect(x + 13, y + 3, 2, 1); c.fillRect(x + 7, y, 2, 1); }
  },
  // a chart with a pin blinking on it
  chart(c, x, y) {
    const f = (performance.now() / 110) | 0;
    c.fillStyle = '#a8845a'; c.fillRect(x + 1, y + 3, 14, 11);
    c.fillStyle = '#e3d8c2'; c.fillRect(x + 2, y + 4, 12, 9);
    c.fillStyle = '#6fb9c9'; c.fillRect(x + 2, y + 9, 5, 4); c.fillRect(x + 10, y + 4, 4, 3);
    c.fillStyle = '#7ddc6f'; c.fillRect(x + 7, y + 6, 3, 4);
    c.fillStyle = '#8a6a48'; c.fillRect(x + 3, y + 6, 3, 1); c.fillRect(x + 10, y + 11, 3, 1);
    c.fillStyle = f % 8 < 4 ? '#ff6b6b' : '#a93a42'; c.fillRect(x + 11, y + 7, 2, 2); c.fillStyle = '#4a3220'; c.fillRect(x + 11, y + 9, 1, 2);
  },
  // an anvil; the hammer falls every 900 ms and strikes a spark
  anvil(c, x, y) {
    const down = performance.now() % 900 < 140, hy = down ? y + 4 : y + 1;
    c.fillStyle = '#726d7d'; c.fillRect(x + 1, y + 8, 13, 2);
    c.fillStyle = '#3f3a4c'; c.fillRect(x + 4, y + 10, 7, 2); c.fillRect(x + 6, y + 12, 3, 1); c.fillRect(x + 3, y + 13, 9, 2);
    c.fillStyle = '#b9bdd0'; c.fillRect(x + 5, hy, 5, 3);
    c.fillStyle = '#8a6a48'; c.fillRect(x + 10, hy + 1, 5, 1);
    if (down) { c.fillStyle = '#ffd35a'; c.fillRect(x + 3, y + 5, 1, 1); c.fillRect(x + 11, y + 4, 1, 1); c.fillStyle = '#ff8a3d'; c.fillRect(x + 2, y + 3, 1, 1); c.fillRect(x + 13, y + 6, 1, 1); }
  },
  // an island with a tree (the Trials and the Wilds, while the island is raised)
  isle(c, x, y) {
    const f = (performance.now() / 110) | 0;
    c.fillStyle = '#3a6f76'; c.fillRect(x, y + 12, 16, 3); c.fillStyle = '#8ff5e6'; c.fillRect(x + 1 + (f % 6) * 2, y + 12, 2, 1);
    c.fillStyle = '#bba888'; c.fillRect(x + 3, y + 10, 10, 2); c.fillStyle = '#58a868'; c.fillRect(x + 5, y + 9, 6, 1);
    c.fillStyle = '#6b4a2f'; c.fillRect(x + 7, y + 4, 2, 5); c.fillStyle = '#7ddc6f'; c.fillRect(x + 4, y + 2, 8, 3); c.fillRect(x + 6, y + 1, 4, 1);
  },
  // a swirling gate to another world
  portal(c, x, y) {
    const f = (performance.now() / 110) | 0, k = f % 4;
    c.fillStyle = '#5a4a72'; c.fillRect(x + 4, y + 1, 8, 2); c.fillRect(x + 4, y + 13, 8, 2); c.fillRect(x + 2, y + 3, 2, 10); c.fillRect(x + 12, y + 3, 2, 10);
    c.fillStyle = '#e05aff'; c.fillRect(x + 4, y + 3, 8, 10);
    c.fillStyle = '#c77dff'; c.fillRect(x + 5 + (k & 1) * 3, y + 4 + (k >> 1) * 4, 3, 4);
    c.fillStyle = '#fff1a8'; c.fillRect(x + 7, y + 7, 2, 2);
  }
});

// ---------------- HOW TO PLAY: THE TRAINING YARD ----------------
const HOWTO = { tab: 0, lay: new Map() };
const howtoTabs = () => ['MOVING', 'FIGHTING', 'THE WORLD', KIT.T ? 'TOUCH' : 'KEYS'];
// each tab's text: [words, colour] lines, a '' line is a gap; keys tabs are [key, what] pairs
function howtoText(i) {
  const T = KIT.T, A = '#ffd35a', G = '#8ff5e6', R = '#ff9a8a';
  if (i === 0) return T ? [['The stick walks. JUMP jumps: twice in the air, once you have learned it.'], ['DASH dodges: a quick dash that slips through blows.'], ['Push the stick down to drop through bridges.'], [''],
    ['PACK opens your pack and crafting. USE uses and talks. MENU holds the world still.'], ['A finger held on the ground digs where it points.']]
    : [['A / D walk. SPACE or W jumps: twice in the air, once you have learned it.'], ['SHIFT dodges: a quick dash that slips through blows.'], ['Hold S to drop through bridges.'], [''],
    ['E opens your pack and crafting. F uses and talks. M is the map, P the menu.']];
  if (i === 1) return [['THE BEAT', A], [T ? 'LIGHT strikes a light blow. HEAVY strikes a heavy one.' : 'LEFT MOUSE strikes a light blow. RIGHT MOUSE or Q a heavy one.'],
    ['After each blow your weapon GLINTS. Strike on it: the blow bites, an ember of TEMPO lights, and blows QUICKEN. Five in time: DRUMFIRE, hammer away.', G],
    ['One press too soon is HASTY, out of time. Hammer and you are RUSHED.', R], ['Holding the button does nothing. Pressing while hit gets you up sooner.', R], [''],
    ['A heavy blow spends every ember: at five, a CRESCENDO. In DRUMFIRE, a CRASH.'], ['CLEAN: land the sweet spot of your weapon (a blade\'s outer half, a spear\'s point).'],
    ['CLASH: swing into an enemy\'s blow and it is turned aside. Your next blow is the ANSWER.'], ['A foe shows ! before it strikes. Dodge THROUGH the blow, then strike: RIPOSTE.'],
    ['Hit foes in time and their guard BREAKS: they reel. A heavy blow then is a SUNDER.'], ['A WARDED foe turns plain blows from the front: go heavy, clean, or behind it.']];
  if (i === 2) return [['Dig, build, craft. Find three embers below, then four gates above.'], ['Every world has three TRAITS of its own, lands with MOODS, and a year of four seasons.'],
    ['The lead at the top right says what to try next; click it for the next one.']];
  return T ? [['stick', 'walk; down drops through bridges'], ['JUMP', 'jump (twice, once learned)'], ['DASH', 'dodge'], ['LIGHT', 'a light blow'], ['HEAVY', 'a heavy blow'], ['USE', 'use, talk; hold to rekindle'], ['PACK', 'pack and crafting'], ['MAP', 'the map, once you have one'], ['HEAL', 'a quick heal'], ['MENU', 'hold the world still'], ['CHAT', 'talk, with friends'], ['finger', 'on the ground: dig and build']]
    : [['A / D', 'walk'], ['SPACE, W', 'jump (twice, once learned)'], ['SHIFT', 'dodge'], ['S held', 'drop through bridges'], ['LEFT MOUSE', 'a light blow'], ['RIGHT MOUSE, Q', 'a heavy blow'], ['1-0, wheel', 'the hotbar'], ['E', 'pack and crafting'], ['F', 'use, talk'], ['H', 'a quick heal'],
      ['C', 'forms (the codex)'], ['M', 'map'], ['K', 'knap a stone'], ['B', 'recipe book'], ['R / T', 'throw / switch sidearm'], ['G', 'drop what you hold'], ['O', 'sound on or off'], ['P, ESC', 'the menu'], ['TAB', 'scores, in an arena'], ['ENTER', 'chat, with friends']];
}
// the tab laid out at width w: rows of {t, col, x} (and keys tabs: {k, t}); cached
function howtoLayout(i, w) {
  const key = i + '|' + w + '|' + KIT.T; let L = HOWTO.lay.get(key); if (L) return L; L = [];
  if (i === 3 && w >= 400) {
    // two columns of keys, read down the left first
    const K = howtoText(3), half = ceil(K.length / 2), cw = floor((w - 16) / 2), kw = max(...K.map(k => textW(k[0]))) + 8;
    for (let r = 0; r < half; r++) for (const j of [r, r + half]) if (K[j]) L.push({ k: K[j][0], t: fitText(K[j][1], cw - kw - 4), x: kw, cx: j < half ? 0 : cw + 16, h: j < half && K[r + half] ? 0 : 10 });
  } else if (i === 3) { const kw = min(84, round(w * .38)); for (const [k, t] of howtoText(3)) { const W = wrapC(t, w - kw - 4); W.forEach((s, j) => L.push({ k: j ? '' : k, t: s, x: kw })); } }
  else for (const [t, col] of howtoText(i)) { if (!t) { L.push({ t: '', h: 5 }); continue; } wrapC(t, w).forEach(s => L.push({ t: s, col })); }
  if (HOWTO.lay.size > 40) HOWTO.lay.clear(); HOWTO.lay.set(key, L); return L;
}
const howtoH = L => L.reduce((s, r) => s + (r.h === undefined ? 10 : r.h), 0);
function howtoSet(i) { if (HOWTO.tab === i) return; HOWTO.tab = i; KIT.sy.howto = 0; }
function drawHowTo(c) {
  menuBackdrop(c, 'howto'); kview('howto');
  const S = KIT.sizes, mode = menuMode(), names = howtoTabs(), tw = min(520, VS.uw - (mode === 'narrow' ? 12 : 24)) - 16;
  const tabsH = mode === 'narrow' ? 2 * (S.tab + 2) + 2 : S.tab + 4, bodyW = tw - 6, most = max(70, howtoH(howtoLayout(HOWTO.tab, bodyW)));
  const F = menuFrame('howto', 520, 29 + tabsH + 6 + most + 8 + S.bh + 10); menuHero(c, 'howto', F);
  const K = kcard(c, F.x, F.y, F.w, F.h, 'howto', 'HOW TO PLAY', { foot: true, i: 0, right: (c, rx, ry) => howtoBeat(c, rx, ry) });
  const x = K.x + 8, w = K.w - 16; let yy = K.by + 1;
  yy += ktabs(c, x, yy, w, names, names[HOWTO.tab], nm => howtoSet(names.indexOf(nm)), mode === 'narrow' ? { cols: 2 } : {}) + 4;
  const L = howtoLayout(HOWTO.tab, w - 6), B = { x: K.x + 1, y: yy, w: K.w - 2, h: K.footY - 4 - yy }, need = howtoH(L), dy = need > B.h ? kscroll(c, B, need + 4, 'howto') : 0;
  let ty = yy + 2 + dy;
  for (const r of L) {
    if (ty > B.y - 10 && ty < B.y + B.h) { const cx = x + (r.cx || 0); if (r.k !== undefined) { if (r.k) drawText(c, r.k, cx, ty, KIT.col); drawText(c, r.t, cx + r.x, ty, '#d8d4e6'); } else if (r.t) drawText(c, r.t, cx, ty, r.col || '#d8d4e6'); }
    ty += r.h === undefined ? 10 : r.h;
  }
  if (need > B.h) kscrollEnd(c);
  const bw = KIT.T ? 72 : 62;
  kbutton(c, K.x + K.w - 8 - bw, K.footY + 5, bw, 'BACK', menuBack, { main: true });
}
// the head's metronome: a mark runs along a 60x3 bar and strikes NOW every 600 ms
function howtoBeat(c, rx, ry) {
  const now = performance.now(), u = (now % 600) / 600, x = rx - 60, y = ry + 6, hot = u < .2;
  c.fillStyle = '#2b2740'; c.fillRect(x, y, 60, 3); c.fillStyle = rgbaHex(KIT.col, .45); c.fillRect(x, y, round(57 * u), 3);
  c.fillStyle = KIT.col; c.fillRect(x + round(57 * u), y - 1, 3, 5); c.fillRect(x + 59, y - 2, 1, 7);
  if (hot) { const ga = c.globalAlpha; c.globalAlpha = ga * (1 - u / .2); drawText(c, 'NOW', x - textW('NOW') - 4, y - 2, '#fff1a8'); c.globalAlpha = ga; }
}

// ---------------- WORLDS: THE MAP TABLE ----------------
const WORLDS = { sel: 0, vis: 1, sw: new Map() };
// a 24x16 chart of a world's land from its seed: sky, two ranges of hills, water in a hollow
function worldSwatch(m) {
  const k = m.id + '|' + m.seed; let im = WORLDS.sw.get(k); if (im) return im;
  const [cv2, x] = mk(24, 16), s = (m.seed | 0) + 7, H = (n, a) => hh(s, n, a);
  const sky = ['#2c3a5a', '#3a2f4a', '#24465a', '#4a3a3a'][floor(H(1, 1) * 4)], hill = ['#4f7a52', '#6b5a3a', '#3f6a6a', '#5a4a72'][floor(H(2, 2) * 4)], low = ['#7ddc6f', '#c9a46a', '#8ff5e6', '#b9b0a0'][floor(H(3, 3) * 4)];
  x.fillStyle = sky; x.fillRect(0, 0, 24, 16); x.fillStyle = '#fff1a8'; x.fillRect(2 + floor(H(4, 4) * 18), 2, 2, 2);
  for (let i = 0; i < 24; i++) {
    const a = 6 + round(sin(i * (.3 + H(5, 5) * .3) + H(6, 6) * 6) * 3 + H(i, 7) * 1.5), b = 10 + round(sin(i * (.5 + H(8, 8) * .4) + H(9, 9) * 6) * 2);
    x.fillStyle = hill; x.fillRect(i, a, 1, 16 - a); x.fillStyle = low; x.fillRect(i, b, 1, 1); x.fillStyle = '#3a2f2a'; x.fillRect(i, b + 1, 1, 15 - b);
  }
  if (H(10, 10) > .4) { const wx = 4 + floor(H(11, 11) * 12); x.fillStyle = '#6fb9c9'; x.fillRect(wx, 12, 6, 2); }
  x.fillStyle = INK; x.fillRect(0, 0, 24, 1); x.fillRect(0, 15, 24, 1); x.fillRect(0, 0, 1, 16); x.fillRect(23, 0, 1, 16);
  if (WORLDS.sw.size > 60) WORLDS.sw.clear(); WORLDS.sw.set(k, cv2); return cv2;
}
const worldProg = m => (m.mode ? 'free forge' : m.v < 3 ? 'old world (will regrow)' : (m.e | 0) + ' of 3 embers') + ' - ' + fmtTime(m.played || 0);
const worldKind = m => (m.land | 0) >= 4 && m.endless ? [traitsOf(m.seed).map(k => TRAITS[k].n.toLowerCase()).join(', '), '#6fb9c9']
  : [`${MODE_N[m.mode ? 1 : 0]} - ${m.endless ? (GEN_RANGE_N[m.size | 0] || 'Normal') + ' range' : SIZE_N[m.size | 0] || ''} - ${SHAPE_N[m.shape | 0] || ''}`, '#6a6485'];
function worldsNew() { G.state = 'create'; Object.assign(FORM, { name: 'World ' + (SAVE.list.length + 1), seed: rollSeed() }); UI.focus = 'name'; KIT.sy.forge = 0; sfx('ui'); }
function worldsPaste() { G.state = 'wpaste'; COOP.err = ''; G.worldNote = ''; sfx('ui'); }
function worldsPlay(m) { if (!m) return; UI.confirm = null; openWorld(m); sfx('quest', 0); }
function worldsSee(j) { const v = WORLDS.vis || 1; if (j < UI.scroll) UI.scroll = j; else if (j >= UI.scroll + v) UI.scroll = j - v + 1; }
// the ember pips of a world: lit ones flicker
function worldPips(c, m, x, y) {
  if (m.mode) return; const now = performance.now(), ga = c.globalAlpha;
  for (let k = 0; k < 3; k++) { const on = k < (m.e | 0); c.fillStyle = on ? ['#ffd35a', '#8ff5e6', '#ff9a3d'][k] : '#3a3450'; c.globalAlpha = on ? ga * (.75 + .25 * sin(now / 140 + k * 2.1 + (m.seed | 0))) : ga; c.fillRect(x + k * 5, y, 4, 2); }
  c.globalAlpha = ga;
}
function worldRow(c, i, x, y, w, h) {
  const S = KIT.sizes, m = SAVE.list[i], narrow = menuMode() === 'narrow', sel = i === WORLDS.sel, name = String(m.name || 'World'), conf = UI.confirm === m.id;
  krow(c, x, y, w, h, () => { WORLDS.sel = i; sfx('ui'); }, { sel, tag: 'row:world:' + m.id, hint: kb('Click PLAY to open ', 'PLAY opens ') + name + '.' });
  if (conf) {
    c.fillStyle = 'rgba(255,107,107,.14)'; c.fillRect(x, y, w, h); c.fillStyle = '#ff6b6b'; c.fillRect(x, y, 2, h);
    kconfirm(c, { x: x + 2, y: y + round((h - S.bh) / 2), w: w - 2 }, 'DELETE ' + fitText(name, w - 120) + '?', () => { deleteWorld(m.id); UI.confirm = null; WORLDS.sel = clamp(WORLDS.sel, 0, max(0, SAVE.list.length - 1)); sfx('brk'); }, () => { UI.confirm = null; sfx('ui'); });
    return;
  }
  c.drawImage(worldSwatch(m), x + 6, y + 4); worldPips(c, m, x + 7, y + 22);
  const cw = KIT.T ? 48 : 40, pw = KIT.T ? 52 : 40, xw = KIT.T ? 30 : 18, g = S.gap, tx = x + 36;
  const copy = () => { worldCopy(m); sfx('ui'); }, play = () => worldsPlay(m), del = () => { UI.confirm = m.id; WORLDS.sel = i; sfx('ui'); };
  if (narrow) {
    drawText(c, fitText(name, x + w - 6 - tx), tx, y + 4, '#fff'); drawText(c, fitText(worldProg(m), x + w - 6 - tx), tx, y + 14, '#8b8fa3');
    const by = y + h - S.bh - 4, bx = x + 6, rw = w - 12 - xw - g * 2, aw = floor(rw * .42);
    kbutton(c, bx, by, aw, 'COPY', copy, { hint: 'Copy this world as text, to move it to another computer.' });
    kbutton(c, bx + aw + g, by, rw - aw, 'PLAY', play, { main: true, hint: 'Open ' + name + '.' });
    kbutton(c, x + w - 6 - xw, by, xw, 'X', del, { danger: true, hint: 'Delete ' + name + ' (you are asked first).' });
    return;
  }
  const bx = x + w - 6 - xw - pw - cw - g * 2, room = bx - 6 - tx, by = y + round((h - S.bh) / 2), [kind, kc] = worldKind(m);
  drawText(c, fitText(name, room), tx, y + 3, '#fff'); drawText(c, fitText(worldProg(m), room), tx, y + 13, '#8b8fa3'); drawText(c, fitText(kind, room), tx, y + 23, kc);
  kbutton(c, bx, by, cw, 'COPY', copy, { hint: 'Copy this world as text, to move it to another computer.' });
  kbutton(c, bx + cw + g, by, pw, 'PLAY', play, { main: true, hint: 'Open ' + name + '.' });
  kbutton(c, bx + cw + pw + g * 2, by, xw, 'X', del, { danger: true, hint: 'Delete ' + name + ' (you are asked first).' });
}
// the signed-in chip: the name opens the ledger, SIGN OUT signs out; right-aligned at rx
function worldsChip(c, rx, y) {
  const a = ACCOUNT.active; if (!a) return 0; const S = KIT.sizes, sw = KIT.T ? 64 : 56, nw = min(textW(a.name) + 14, 110), g = S.gap;
  kbutton(c, rx - sw, y, sw, 'SIGN OUT', () => { accountLogout(); sfx('ui'); }, { small: true, hint: 'Sign out. Your worlds are saved first.' });
  kbutton(c, rx - sw - g - nw, y, nw, a.name, accountsOpen, { small: true, hint: 'Signed in as ' + a.name + '. The ledger: change look, or switch account.' });
  return sw + g + nw;
}
function drawWorlds(c) {
  menuBackdrop(c, 'worlds'); kview('worlds');
  const S = KIT.sizes, L = SAVE.list, n = L.length, mode = menuMode(), narrow = mode === 'narrow', rowH = narrow ? (KIT.T ? 62 : 52) : (KIT.T ? 40 : 36), foot = S.bh + 10;
  WORLDS.sel = clamp(WORLDS.sel | 0, 0, max(0, n - 1));
  const note = G.menuNote ? { text: G.menuNote, kind: 'err' } : G.worldNote ? { text: KIT.T ? G.worldNote.replace('press P and choose', 'tap MENU and choose') : G.worldNote, kind: 'ok' } : null, cw = min(460, VS.uw - (narrow ? 12 : 24));
  const noteH = note ? wrapC(note.text, cw - 24).length * 9 + 4 : 0, F0 = menuFrame('worlds', 460, 400), heroChip = narrow && F0.hero;
  const chipH = narrow && ACCOUNT.active ? S.sm + 6 : 0, listH = n ? n * rowH : 46;
  const F = menuFrame('worlds', 460, 29 + listH + 4 + noteH + foot + (heroChip ? 0 : chipH));
  menuHero(c, 'worlds', F);
  const store = SAVE.db ? 'saved to your Claude account' : 'saved in this browser';
  const K = kcard(c, F.x, F.y, F.w, F.h, 'worlds', 'YOUR WORLDS', { foot: true, i: 0, right: narrow ? (SAVE.db ? 'ON CLAUDE' : 'IN THIS BROWSER') : (c, rx, ry) => worldsChip(c, rx, KIT.T ? ry - 2 : ry) });
  let top = K.by;
  if (narrow && ACCOUNT.active) {
    if (F.hero && F.hero.h >= 120) { const cy = round(F.hero.y + F.hero.h / 2) - 8 + 44; worldsChip(c, round(VS.uw / 2) + round((min(textW(ACCOUNT.active.name) + 14, 110) + S.gap + (KIT.T ? 64 : 56)) / 2), cy); }
    else { worldsChip(c, K.x + K.w - 6, top); top += S.sm + 6; }
  }
  const B = { x: K.x + 6, y: top, w: K.w - 12, h: K.footY - 4 - noteH - top };
  if (!n) {
    textC(c, 'No worlds yet.', K.x + K.w / 2, top + 14, '#b9bdd0', 1, drawText);
  } else WORLDS.vis = klist(c, B, n, rowH, worldRow).vis;
  if (note) kmsg(c, K.x + 8, K.footY - noteH, K.w - 16, note);
  const fy = K.footY + 5, x = K.x + 8, g = S.gap;
  if (narrow) {
    const bw = floor((K.w - 16 - g * 2) / 3);
    kbutton(c, x, fy, bw, '+ NEW WORLD', worldsNew, { main: !n, short: '+ NEW', hint: 'Forge a new world.' });
    kbutton(c, x + bw + g, fy, bw, 'PASTE A WORLD', worldsPaste, { short: 'PASTE', hint: 'Add a world copied from another game.' });
    kbutton(c, K.x + K.w - 8 - bw, fy, bw, 'BACK', menuBack, { hint: 'Back to the home page.' });
  } else {
    const nw = KIT.T ? 112 : 104, bk = KIT.T ? 64 : 56;
    kbutton(c, x, fy, nw, '+ NEW WORLD', worldsNew, { main: !n, hint: 'Forge a new world.' + kb(' (N)', '') });
    kbutton(c, x + nw + g, fy, nw, 'PASTE A WORLD', worldsPaste, { hint: 'Add a world copied from another game.' });
    const sx = x + nw * 2 + g * 2 + 8, room = K.x + K.w - 8 - bk - 8 - sx;
    if (room > 40) drawText(c, fitText(store, room), sx, fy + round((S.bh - 8) / 2), '#8b8fa3');
    kbutton(c, K.x + K.w - 8 - bk, fy, bk, 'BACK', menuBack, { hint: 'Back to the home page.' });
  }
  if (n && !UI.confirm) KIT.main = () => worldsPlay(SAVE.list[WORLDS.sel]);
}
function worldsKeys(e) {
  const k = e.code, n = SAVE.list.length;
  if (UI.confirm) { if (k === 'KeyY') { const id = UI.confirm; deleteWorld(id); UI.confirm = null; WORLDS.sel = clamp(WORLDS.sel, 0, max(0, SAVE.list.length - 1)); sfx('brk'); return true; } if (k === 'KeyN') { UI.confirm = null; sfx('ui'); return true; } return false; }
  if ((k === 'ArrowUp' || k === 'ArrowDown') && n) { WORLDS.sel = clamp(WORLDS.sel + (k === 'ArrowUp' ? -1 : 1), 0, n - 1); worldsSee(WORLDS.sel); KIT.kbd = false; sfx('ui'); return true; }
  if (k === 'KeyN') { worldsNew(); return true; }
  if ((k === 'Delete' || k === 'Backspace') && n) { UI.confirm = SAVE.list[WORLDS.sel].id; sfx('ui'); return true; }
  return false;
}

// ---------------- FORGE A NEW WORLD: THE ANVIL ----------------
const FORGE = { t: -1e9, x: 0, y: 0 };
function forgeRoll() { FORM.seed = rollSeed(); FORGE.t = performance.now(); sfx('clang'); }
function forgeGo() { UI.focus = null; createWorld({ name: FORM.name.trim() || 'World', seed: FORM.seed, size: FORM.size, shape: FORM.shape, mode: FORM.mode, skin: FORM.skin }); sfx('quest', 0); }
// ROLL throws 16 sparks off the seed box for 700 ms
function forgeSparks(c) {
  const t = (performance.now() - FORGE.t) / 1000, ga = c.globalAlpha; if (t < 0 || t > .7) return;
  for (let k = 0; k < 16; k++) {
    const a = -PI / 2 + (hh(k, 3, floor(FORGE.t)) - .5) * 2.6, v = 50 + hh(k, 5, 9) * 50, x = FORGE.x + (hh(k, 7, 1) - .5) * 30 + cos(a) * v * t, y = FORGE.y + sin(a) * v * t + 90 * t * t;
    c.globalAlpha = ga * (1 - t / .7); c.fillStyle = k % 3 ? '#ff8a3d' : '#ffd35a'; c.fillRect(round(x), round(y), k % 5 ? 1 : 2, 1);
  }
  c.globalAlpha = ga;
}
// what this seed makes: the three traits, glowing a moment after a ROLL
function forgeTraits(c, x, y, w) {
  const g = clamp(1 - (performance.now() - FORGE.t) / 300, 0, 1);
  if (!FORM.seed.trim()) return;
  if (g > 0) { c.fillStyle = rgbaHex(KIT.col, .22 * g); c.fillRect(x - 3, y - 2, w + 6, forgeTraitsH); }
  drawText(c, fitText('THIS SEED MAKES A WORLD THAT IS', w), x, y, '#8b8fa3'); let yy = y + 12;
  for (const k of traitsOf(seedFrom(FORM.seed))) { const t = TRAITS[k], L = wrapC(t.d, w - 6); drawText(c, t.n, x, yy, TRAIT_COL[t.g]); yy += 9; for (const l of L.slice(0, 2)) { drawText(c, l, x + 6, yy, '#b9bdd0'); yy += 9; } yy += 2; }
}
const forgeTraitsH = 12 + 3 * 29;
function forgeLeft(c, x, y, w) {
  const S = KIT.sizes, rw = KIT.T ? 52 : 40; let yy = y;
  yy += kfield(c, x, yy, w, 'name', 'NAME', 'my world', { hint: 'What the world is called in your list.' });
  kfield(c, x, yy, w - rw - S.gap, 'seed', 'SEED', 'random: type a word', { hint: 'The same seed makes the same land: tell a friend yours.' });
  FORGE.x = x + round((w - rw) / 2); FORGE.y = yy + 12;
  kbutton(c, x + w - rw, yy + 10 - (S.bh - S.fh) / 2, rw, 'ROLL', forgeRoll, { hint: 'A new seed, said in words.' + kb(' (R)', '') }); yy += KIT.T ? 34 : 28;
  yy += 6; forgeTraits(c, x, yy, w); yy += forgeTraitsH;
  return yy - y;
}
function forgeRight(c, x, y, w) {
  let yy = y;
  yy += kchooser(c, x, yy, w, 'RANGE', GEN_RANGE_N, 'size');
  yy += kchooser(c, x, yy, w, 'SHAPE', SHAPE_N, 'shape');
  yy += kchooser(c, x, yy, w, 'MODE', MODE_N, 'mode');
  yy += 2 + klook(c, x, yy, w, { hat: false });
  return yy - y;
}
function drawCreate(c) {
  menuBackdrop(c, 'create'); kview('create');
  const S = KIT.sizes, narrow = menuMode() === 'narrow', fh = KIT.T ? 34 : 28, ch = S.ah + 6;
  const leftH = fh * 2 + 6 + forgeTraitsH, rightH = ch * 3 + 2 + S.tileH + S.gap + 2, foot = S.bh + 10;
  const F = menuFrame('create', 480, 29 + (narrow ? leftH + 8 + rightH : max(leftH, rightH)) + 6 + foot); menuHero(c, 'create', F);
  const K = kcard(c, F.x, F.y, F.w, F.h, 'create', 'FORGE A NEW WORLD', { foot: true, i: 0 });
  if (narrow) {
    const B = { x: K.x + 1, y: K.by - 3, w: K.w - 2, h: K.footY - 2 - (K.by - 3) }, need = leftH + 8 + rightH + 6, sc = need > B.h;
    let yy = K.by + 1 + (sc ? kscroll(c, B, need, 'forge') : 0);
    yy += forgeLeft(c, K.x + 8, yy, K.w - 16) + 8; forgeRight(c, K.x + 8, yy, K.w - 16);
    if (sc) kscrollEnd(c);
  } else {
    const lw = floor((K.w - 28) * .5), lx = K.x + 8, rx = lx + lw + 12, rw = K.x + K.w - 8 - rx;
    forgeLeft(c, lx, K.by + 1, lw);
    c.fillStyle = '#2b2740'; c.fillRect(rx - 6, K.by, 1, K.footY - K.by - 6);
    forgeRight(c, rx, K.by + 1, rw);
  }
  forgeSparks(c);
  const bk = KIT.T ? 64 : 60;
  kbutton(c, K.x + 8, K.footY + 5, min(170, K.w - 24 - bk), 'FORGE WORLD', forgeGo, { main: true, hint: 'Forge it and step in.' });
  kbutton(c, K.x + K.w - 8 - bk, K.footY + 5, bk, 'BACK', menuBack, { hint: 'Back to your worlds.' });
}

// ---------------- the intro and the loading screen ----------------
function drawIntro(c) {
  menuBackdrop(c, 'intro');
  const uw = VS.uw, uh = VS.uh, lines = INTRO[G.introI].split('\n'), y0 = round(uh * .4 - lines.length * 6);
  c.drawImage(kitGlow(120, '#120d1f', .7), round(uw / 2) - 120, y0 + lines.length * 6 - 120);
  c.globalAlpha = clamp(G.introT / 40, 0, 1);
  lines.forEach((l, i) => textC(c, l, uw / 2, y0 + i * 13, '#fff1a8', 1, textO)); c.globalAlpha = 1;
  // the page: four embers, the ones read lit
  const px = round(uw / 2) - 14; for (let i = 0; i < INTRO.length; i++) { c.fillStyle = i < G.introI ? '#ff8a3d' : i === G.introI ? '#ffd35a' : '#3a3450'; c.fillRect(px + i * 8, round(uh * .7), 4, 4); }
  if (G.introT > 50) textC(c, kb('click or Enter to continue', 'tap to continue'), uw / 2, round(uh * .78), '#8b8fa3', 1, textS);
}
// where the wait leads: [emblem, colour] by the words of the message
function loadingArt() {
  const m = G.loadMsg || '';
  return /^Forging/.test(m) ? ['anvil', '#ff8a3d'] : /^(Opening|Rebuilding)/.test(m) ? ['chart', '#6fb9c9'] : /^(Joining|Following)/.test(m) ? ['beacon', '#7ddc6f']
    : /ring/i.test(m) ? ['ring', '#ff6b6b'] : /island/i.test(m) ? ['isle', '#e0d2b4'] : /^(Stepping|Back to)/.test(m) ? ['portal', '#e05aff'] : ['fire', '#ffd35a'];
}
function drawLoading(c) {
  menuBackdrop(c, 'loading');
  const uw = VS.uw, uh = VS.uh, cy = round(uh * .45), [art, col] = loadingArt(), cx = round(uw / 2);
  c.drawImage(kitGlow(110, '#120d1f', .75), cx - 110, cy - 110);
  c.drawImage(kitGlow(44, col, .3), cx - 44, cy - 62);
  c.save(); c.translate(cx - 16, cy - 40); c.scale(2, 2);
  if (art === 'ring') TITLE_ART.arena(c, 0, 0); else if (art === 'fire') TITLE_ART.fire(c, 0, 0); else if (MENU_ART[art]) MENU_ART[art](c, 0, 0);
  c.restore();
  textC(c, G.loadMsg || 'Loading...', uw / 2, cy, '#fff1a8', 1, textO);
  const n = (performance.now() / 300 | 0) % 4; for (let i = 0; i < 3; i++) { c.fillStyle = i < n ? col : '#3a3450'; c.fillRect(cx - 8 + i * 6, cy + 14, 3, 3); }
}

// ---------------- the places ----------------
// the backdrops' still props (drawn once into the cached backdrop) and their bit of live motion
const yardAt = W => [round(W * .04), round(W * .96) - 10, round(W * .89) - 10];
function yardPosts(x, W, H) { for (const px of yardAt(W)) { x.fillStyle = 'rgba(18,13,31,.5)'; x.fillRect(px - 4, H - 4, 18, 2); x.drawImage(PROP.post, px, H - 46, 10, 42); } }
function plankTable(x, W, H) {
  const y = H - 22; x.fillStyle = '#4a3220'; x.fillRect(0, y, W, 22); x.fillStyle = '#6b4a2f'; x.fillRect(0, y, W, 3); x.fillStyle = '#8a6a48'; x.fillRect(0, y, W, 1);
  x.fillStyle = '#3a2618'; for (let i = 0; i < W; i += 37) x.fillRect(i + ((i / 37) % 2 ? 11 : 0), y + 4, 1, 18); for (const r of [y + 10, y + 16]) x.fillRect(0, r, W, 1);
}
Object.assign(MENUS, {
  howto: {
    col: '#8ff5e6', art: 'post', motes: 'glints', place: 'THE TRAINING YARD', sound: 'beat',
    idle: () => kb('Every blow is a choice: strike on the glint.', 'Strike on the glint.'),
    diorama: yardPosts,
    live(c, uw, uh, now) {
      // a glint pops on each post's lamp in turn, on the beat
      const i = floor(now / 600) % 3, u = (now % 600) / 600, W = ceil(uw), H = ceil(uh), px = yardAt(W)[i] + 5, py = H - 41;
      if (u < .35) { c.globalAlpha = 1 - u / .35; c.fillStyle = '#8ff5e6'; c.fillRect(px - 4, py, 9, 1); c.fillRect(px, py - 4, 1, 9); c.fillStyle = '#fff1a8'; c.fillRect(px - 1, py - 1, 3, 3); c.globalAlpha = 1; }
    },
    keys(e) {
      const k = e.code;
      if (/^Digit[1-4]$/.test(k)) { howtoSet(+k[5] - 1); sfx('ui'); return true; }
      if ((k === 'ArrowLeft' || k === 'ArrowRight') && !KIT.kbd) { howtoSet((HOWTO.tab + (k === 'ArrowLeft' ? 3 : 1)) % 4); sfx('ui'); return true; }
      if (k === 'ArrowUp' || k === 'ArrowDown') { KIT.sy.howto = max(0, (KIT.sy.howto || 0) + (k === 'ArrowUp' ? -12 : 12)); return true; }
      return false;
    }
  },
  worlds: {
    col: '#6fb9c9', art: 'chart', motes: 'dust', place: 'THE MAP TABLE', sound: 'ui', glow: { x: .5, y: .3 },
    idle: () => SAVE.list.length ? kb('Up and Down choose, Enter plays, N forges a new world.', 'Tap PLAY to open a world.') : 'Forge your first world.',
    diorama(x, W, H) {
      plankTable(x, W, H); const y = H - 22, cx = round(W * .84);
      // a compass on the table
      x.fillStyle = '#8a6a48'; x.fillRect(cx - 7, y - 3, 14, 4); x.fillStyle = '#b8862a'; x.fillRect(cx - 6, y - 4, 12, 2); x.fillStyle = '#e3d8c2'; x.fillRect(cx - 4, y - 4, 8, 1); x.fillStyle = '#c94a4e'; x.fillRect(cx, y - 4, 3, 1);
      // a candle stub
      const kx = round(W * .14); x.fillStyle = '#e3d8c2'; x.fillRect(kx, y - 9, 4, 9); x.fillStyle = '#726d7d'; x.fillRect(kx - 2, y - 1, 8, 2);
    },
    live(c, uw, uh, now) {
      const f = (now / 110) | 0, kx = round(ceil(uw) * .14), y = ceil(uh) - 22;
      c.globalAlpha = .2 + .05 * sin(now / 300); c.drawImage(kitGlow(26, '#ffb347', 1), kx - 24, y - 38); c.globalAlpha = 1;
      c.fillStyle = '#ffb347'; c.fillRect(kx + 1, y - 13 + (f & 1), 2, 4 - (f & 1)); c.fillStyle = '#fff1a8'; c.fillRect(kx + 1 + (f % 3 === 0 ? 1 : 0), y - 11, 1, 2);
    },
    keys: worldsKeys,
    enter() { WORLDS.sel = 0; },
    back() { if (UI.confirm) { UI.confirm = null; sfx('ui'); return; } G.worldNote = ''; G.state = 'title'; sfx('ui'); }
  },
  create: {
    col: '#ff8a3d', art: 'anvil', motes: null, place: 'THE ANVIL', sound: 'clink', glow: { x: .5, y: .85 },
    idle: () => kb('Name it, choose a seed, and forge. R rolls a new seed.', 'Name it, choose a seed, and forge.'),
    diorama(x, W, H) { const ax = round(W * .08); x.fillStyle = 'rgba(18,13,31,.55)'; x.fillRect(ax - 4, H - 4, 42, 2); x.drawImage(PROP.anvil, ax, H - 25, 33, 21); },
    live(c, uw, uh, now) {
      const ax = round(ceil(uw) * .08), H = ceil(uh);
      c.globalAlpha = .2 + .08 * sin(now / 420); c.drawImage(kitGlow(40, '#ff8a3d', 1), ax - 24, H - 66); c.globalAlpha = 1;
      menuMotes(c, 'sparks', { at: { x: ax + 16, y: H - 26 }, n: 12 });
    },
    keys(e) { if (e.code === 'KeyR' && !UI.focus) { forgeRoll(); return true; } return false; }
  },
  intro: { col: '#ffd35a', art: 'fire', motes: 'lanterns', place: '', idle: '', still: true, hero: false, zoom: false, glow: { x: .5, y: .4 } },
  loading: { col: '#fff1a8', art: 'fire', motes: null, place: '', idle: '', still: true, hero: false, zoom: false }
});
// (the kit draws a missing emblem as nothing: the intro and loading pages use the home page's fire)
Object.assign(MENU_ART, { fire: TITLE_ART.fire });
