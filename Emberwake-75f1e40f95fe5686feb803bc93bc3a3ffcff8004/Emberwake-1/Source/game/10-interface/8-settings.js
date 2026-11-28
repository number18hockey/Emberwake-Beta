// ============================================================
//  THE SETTINGS: every switch on one card, opened from the home page's top right.
//  The pause panel's SETTINGS tab shows the same switches (settingRows), less the ones a match cannot change.
// ============================================================
// the sound switch is kept between visits, like the rest
muted = !!SETTINGS.mute;
function setMuted(on) { muted = !!on; SETTINGS.mute = muted; saveSettings(); }
const moveNamesOn = () => SETTINGS.moveNames !== false;
const calmOn = () => !!SETTINGS.calm;
// every switch as { l: its label with its state, fn, hint: said only for the switches whose names do not say it all }
function settingRows(A) {
  const flip = (k, a, b, after) => () => { SETTINGS[k] = SETTINGS[k] === a ? b : a; saveSettings(); if (after) after(); sfx('ui'); };
  const L = [
    { l: 'SOUND: ' + (muted ? 'OFF' : 'ON'), fn: () => { setMuted(!muted); sfx('ui'); } },
    { l: 'ATTACK NAMES: ' + (moveNamesOn() ? 'ON' : 'OFF'), fn: () => { SETTINGS.moveNames = !moveNamesOn(); saveSettings(); if (!moveNamesOn() && G.feed) G.feed.length = 0; sfx('ui'); } },
    { l: 'CONTROLS: ' + (SETTINGS.combat === 'simple' ? 'SIMPLE' : 'FULL'), fn: flip('combat', 'simple', 'full'), hint: 'SIMPLE: where you aim chooses the attack. FULL: the keys you hold and the distance do too.' }
  ];
  if (!A) L.push({ l: 'DIFFICULTY: ' + DIFF().n, fn: () => { SETTINGS.diff = SETTINGS.diff === 'easy' ? 'normal' : SETTINGS.diff === 'normal' ? 'hard' : 'easy'; saveSettings(); sfx('ui'); } });
  if (!A) L.push({ l: 'CRAFTING: ' + (SETTINGS.craft === 'hands' ? 'HANDS-ON' : 'SIMPLE'), fn: flip('craft', 'hands', 'simple', () => { UI.job = null; }), hint: 'HANDS-ON: a little task at each bench. SIMPLE: one click makes it.' });
  L.push({ l: 'EFFECTS: ' + (SETTINGS.fx === 'plain' ? 'PLAIN' : 'FULL'), fn: flip('fx', 'plain', 'full'), hint: 'Glow, coloured air, mist and drops on the screen. PLAIN for a slow machine.' });
  L.push({ l: 'SCREEN MOTION: ' + (calmOn() ? 'CALM' : 'FULL'), short: 'MOTION: ' + (calmOn() ? 'CALM' : 'FULL'), fn: () => { SETTINGS.calm = !calmOn(); saveSettings(); sfx('ui'); }, hint: 'CALM: less shaking, and no wobble when you feel sick.' });
  L.push({ l: 'FPS MODE: ' + (SETTINGS.fpsMode ? 'ON' : 'OFF'), fn: () => { SETTINGS.fpsMode = !SETTINGS.fpsMode; if (SETTINGS.fpsMode && G.parts) G.parts.length = 0; saveSettings(); sfx('ui'); }, hint: 'No particles and a barer HUD, for speed.' });
  return L;
}
// the switches as buttons, cols across, from y; returns the height (draw false only measures)
function settingGrid(c, x, y, w, L, cols, draw) {
  const S = KIT.sizes, cw = floor((w - S.gap * (cols - 1)) / cols), rows = ceil(L.length / cols);
  if (draw) L.forEach((q, i) => {
    const bx = x + (i % cols) * (cw + S.gap), by = y + floor(i / cols) * (S.bh + S.gap);
    kbutton(c, bx, by, cw, q.l, q.fn, { short: q.short });
    if (q.hint && kin(bx, by, cw, S.bh)) KIT.why = q.hint;
  });
  return rows * (S.bh + S.gap) - S.gap;
}
function drawSettings(c) {
  menuBackdrop(c, 'settings'); kview('settings');
  const S = KIT.sizes, L = settingRows(false), cols = menuMode() === 'narrow' ? 1 : 2, bodyH = settingGrid(c, 0, 0, 100, L, cols, false);
  const F = menuFrame('settings', 340, 29 + bodyH + 8 + S.bh + 10); menuHero(c, 'settings', F);
  const K = kcard(c, F.x, F.y, F.w, F.h, 'settings', 'SETTINGS', { foot: true, i: 0 }), x = K.x + 8, w = K.w - 16;
  const B = { x: K.x + 1, y: K.by - 2, w: K.w - 2, h: K.footY - 2 - K.by }, sc = bodyH + 4 > B.h, dy = sc ? kscroll(c, B, bodyH + 4, 'settings') : 0;
  settingGrid(c, x, K.by + 1 + dy, w, L, cols, true);
  if (sc) kscrollEnd(c);
  const bw = KIT.T ? 72 : 62;
  kbutton(c, K.x + K.w - 8 - bw, K.footY + 5, bw, 'BACK', menuBack, { main: true });
}
Object.assign(MENU_ART, {
  // a cog that turns an eighth every half second
  cog(c, x, y) {
    const f = ((performance.now() / 500) | 0) & 1;
    c.fillStyle = '#8b8fa3'; c.fillRect(x + 4, y + 3, 8, 10); c.fillRect(x + 3, y + 4, 10, 8);
    c.fillStyle = '#d8d4e6';
    if (f) { c.fillRect(x + 7, y, 2, 3); c.fillRect(x + 7, y + 13, 2, 3); c.fillRect(x, y + 7, 3, 2); c.fillRect(x + 13, y + 7, 3, 2); }
    else { c.fillRect(x + 2, y + 2, 2, 2); c.fillRect(x + 12, y + 2, 2, 2); c.fillRect(x + 2, y + 12, 2, 2); c.fillRect(x + 12, y + 12, 2, 2); }
    c.fillStyle = '#1d1a29'; c.fillRect(x + 6, y + 6, 4, 4);
  }
});
Object.assign(MENUS, {
  settings: { col: '#b9bdd0', art: 'cog', motes: 'dust', place: 'SETTINGS', sound: 'ui' }
});
MENU_PARENT.settings = 'title';
