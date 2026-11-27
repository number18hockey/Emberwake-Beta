// ============================================================
//  The arenas' menus (part B of the menu redesign builds them here
//  with the kit, 10-interface/4-menu-kit.js): the Cinder Ring's
//  form, the Ashfall Trials' form and lobbies, the Wilds, perks,
//  the dead and results panels. Register places with
//  Object.assign(MENUS, { ... }) and Object.assign(MENU_ART, { ... }).
// ============================================================
function drawRingForm(c) {
  const uw = VS.uw, uh = VS.uh, w = min(330, uw - 16), h = 244, x = round((uw - w) / 2), y = max(8, round((uh - h) / 2));
  c.fillStyle = 'rgba(18,13,31,.55)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'THE CINDER RING : ONLINE PVP');
  const fx = x + 10, fw = w - 20;
  drawText(c, 'NAME', fx, y + 22, '#b9bdd0'); field(c, fx + 46, y + 18, fw - 46, 'nick', 'WAKER');
  skinPicker(c, fx, y + 38);
  drawText(c, 'RING', fx, y + 70, '#b9bdd0'); field(c, fx + 46, y + 66, fw - 46, 'code', 'open  (or a private code)');
  const L = ['First to 10 takedowns takes the ring. Alone in a ring?', 'Echoes spar with you until someone joins.', 'FRIENDS: host a ring, and your friends pick JOIN A FRIEND', 'on the title screen and type your game code. Up to 4.'];
  L.forEach((l, i) => drawText(c, l, fx, y + 92 + i * 10, '#d8d4e6'));
  drawText(c, NET.room ? 'claude.ai live room: everyone with the same ring code meets.' : 'claude.ai live room: not here. Game codes work anywhere.', fx, y + 136, NET.room ? '#7ddc6f' : '#8b8fa3');
  if (netOK()) button(c, x + 10, y + h - 50, fw, 18, 'HOST A RING FOR FRIENDS (GAME CODE)', () => {
    UI.focus = null; const nick = cleanName(FORM.nick) || 'WAKER'; FORM.nick = nick; G.state = 'loading'; G.loadMsg = 'Lighting the ring...';
    setTimeout(() => { coopReset(); enterArena(nick, FORM.skin, 'friends', 'rtc'); }, 30); sfx('quest', 0);
  });
  button(c, x + 10, y + h - 26, 150, 18, NET.room ? 'ENTER THE RING' : 'PRACTICE (ECHOES)', () => {
    UI.focus = null; const nick = cleanName(FORM.nick) || 'WAKER'; FORM.nick = nick; G.state = 'loading'; G.loadMsg = 'Entering the ring...';
    setTimeout(() => enterArena(nick, FORM.skin, cleanCode(FORM.code) || 'open'), 30); sfx('quest', 0);
  });
  button(c, x + w - 70, y + h - 26, 60, 18, 'BACK', () => { G.state = 'title'; UI.focus = null; sfx('ui'); });
}
