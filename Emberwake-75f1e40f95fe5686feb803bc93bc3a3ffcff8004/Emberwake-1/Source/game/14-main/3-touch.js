// ============================================================
//  Touch: a stick to move, a few buttons, and fingers on the world
//  and the panels themselves. On a computer with a mouse none of
//  this does anything. (The buttons and their look are in build.py's
//  page; the first version of this is Hakerfire1234's.)
// ============================================================
const mobileControls = document.getElementById('mobileControls'), mobileTextInput = document.getElementById('mobileTextInput');
const movePad = document.getElementById('movePad'), moveKnob = document.getElementById('moveKnob');
let stickPointer = null, canvasTouchPointer = null, touchAim = false, touchTap = null, touchDash = false;
if (mobileDevice) document.documentElement.classList.add('touch');
// ---------------- small screens ----------------
// a label wider than its box is drawn smaller, and a field shows the end of what is typed. A computer draws both as it always did.
function touchFit(label, w) { return mobileDevice ? min(1, max(1, w) / max(1, textW(label))) : 1; }
function touchTail(v, w) {
  if (!mobileDevice || !v || textW(v) <= w) return v;
  let i = v.length - 1; while (i > 0 && textW(v.slice(i - 1)) <= w) i--;
  return v.slice(i);
}
// ---------------- typing: an unseen text box brings up the phone's keyboard ----------------
// It follows whichever field the game has in hand (UI.focus). What is typed there is held to the same letters and
// the same lengths as the keys of a keyboard are (the keydown handler in 1-main.js).
function focusMobileText(key) {
  if (!mobileDevice) return;
  if (!key || G.state === 'play') { mobileTextInput.blur(); return; }
  if (document.activeElement === mobileTextInput && mobileTextInput.dataset.formKey === key) return;
  mobileTextInput.dataset.formKey = key; mobileTextInput.value = FORM[key] || ''; mobileTextInput.focus({ preventScroll: true });
}
mobileTextInput.addEventListener('input', () => {
  const key = mobileTextInput.dataset.formKey; if (!key || UI.focus !== key) return;
  // (the account's name and password follow the same rules as on a keyboard: a password may hold any printable character)
  const secret = key === 'accountPassword' || key === 'accountConfirm', lim = secret ? 64 : key === 'name' ? 24 : key === 'seed' || key === 'accountName' ? 18 : key === 'gcode' ? 6 : 12;
  const kept = [...mobileTextInput.value].filter(ch => secret ? !/[\u0000-\u001f]/.test(ch) : /[A-Za-z0-9 _\-'.]/.test(ch)).join('').slice(0, lim);
  const v = key === 'nick' ? kept.toUpperCase() : key === 'code' ? kept.toLowerCase() : kept;
  FORM[key] = v; if (mobileTextInput.value !== v) mobileTextInput.value = v;
});
mobileTextInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') { e.preventDefault(); UI.focus = null; mobileTextInput.blur(); }
});
// ---------------- the stick ----------------
function virtualKey(code, down) { if (down && !keys[code]) pressed[code] = true; keys[code] = down; }
function clearMobileInput() {
  stickPointer = null; moveKnob.style.transform = 'translate(-50%,-50%)'; touchAim = false;
  for (const k of ['KeyA', 'KeyD', 'ArrowDown', 'Space', 'KeyF']) keys[k] = false;
  mouse.l = mouse.r = false;
  document.querySelectorAll('#mobileControls .pressed').forEach(el => el.classList.remove('pressed'));
}
function updateStick(e) {
  const r = movePad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, radius = r.width * .34;
  let dx = clamp((e.clientX - cx) / radius, -1, 1), dy = clamp((e.clientY - cy) / radius, -1, 1), d = hypot(dx, dy);
  if (d < .2) dx = dy = 0;
  else if (d > 1) { dx /= d; dy /= d; }
  moveKnob.style.transform = `translate(calc(-50% + ${round(dx * radius)}px), calc(-50% + ${round(dy * radius)}px))`;
  virtualKey('KeyA', dx < -.22); virtualKey('KeyD', dx > .22); virtualKey('ArrowDown', dy > .48);
}
movePad.addEventListener('pointerdown', e => { e.preventDefault(); stickPointer = e.pointerId; movePad.setPointerCapture(e.pointerId); audioInit(); updateStick(e); });
movePad.addEventListener('pointermove', e => { if (e.pointerId === stickPointer) { e.preventDefault(); updateStick(e); } });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) movePad.addEventListener(type, e => {
  if (e.pointerId !== stickPointer) return;
  stickPointer = null; moveKnob.style.transform = 'translate(-50%,-50%)';
  virtualKey('KeyA', false); virtualKey('KeyD', false); virtualKey('ArrowDown', false);
});
// ---------------- the buttons ----------------
function bindTouchButton(id, down, up) {
  const el = document.getElementById(id); let pointer = null;
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); pointer = e.pointerId; el.setPointerCapture(e.pointerId); el.classList.add('pressed'); audioInit();
    if (AC && AC.state === 'suspended') AC.resume(); down();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(type, e => {
    if (e.pointerId !== pointer) return;
    pointer = null; el.classList.remove('pressed'); if (up) up();
  });
}
// the attack buttons strike at whoever is in front of you, or straight ahead; a finger on the world aims where it points
function mobileAim() {
  if (!G.p || (!mouse.l && !mouse.r)) return; const p = G.p, fc = p.face || 1; let best = null, bd = 64;
  for (const e of p.foes || []) { if (e.dead || e.noHit) continue; const dx = e.x + e.w / 2 - p.x - 3, dy = e.y + e.h / 2 - p.y - 10, d = hypot(dx, dy); if (d < bd && abs(dy) < 40 && (dx * fc > 0 || abs(dx) < 14)) { bd = d; best = e; } }
  mouse.x = clamp(((best ? best.x + best.w / 2 : p.x + 3 + fc * 40) - G.rcx) * VS.s, 0, VS.W);
  mouse.y = clamp(((best ? best.y + best.h / 2 : p.y + 8) - G.rcy) * VS.s, 0, VS.H);
  mouse.ux = mouse.x / VS.ui; mouse.uy = mouse.y / VS.ui; mouse.wx = mouse.x / VS.s + G.rcx; mouse.wy = mouse.y / VS.s + G.rcy;
}
// a key of the keyboard, pressed and let go
function tapKey(code) { for (const type of ['keydown', 'keyup']) dispatchEvent(new KeyboardEvent(type, { code, key: code.startsWith('Key') ? code[3].toLowerCase() : code })); }
const touchPlay = () => G.state === 'play' && !UI.open;
// LIGHT and HEAVY are the two mouse buttons: one press is one blow on the beat, and holding one down strikes no more than a held mouse button does
bindTouchButton('attackLight', () => { if (touchPlay()) { touchAim = true; mouse.l = true; mouse.lp = true; mobileAim(); } }, () => { mouse.l = false; touchAim = false; });
bindTouchButton('attackHeavy', () => { if (touchPlay()) { touchAim = true; mouse.r = true; mouse.rp = true; mobileAim(); } }, () => { mouse.r = false; touchAim = false; });
bindTouchButton('mobileJump', () => { if (touchPlay()) virtualKey('Space', true); }, () => virtualKey('Space', false));
// DASH is the Shift key; touchDash says this button is what holds it down (a real keyboard's Shift is never let go from here)
bindTouchButton('mobileDash', () => { if (touchPlay()) { virtualKey('ShiftLeft', true); touchDash = true; } }, () => { if (touchDash) { touchDash = false; virtualKey('ShiftLeft', false); } });
// USE is the F key, and it can be held: rekindling a fallen teammate in the Trials takes a held F
bindTouchButton('mobileUse', () => { if (touchPlay()) virtualKey('KeyF', true); }, () => virtualKey('KeyF', false));
for (const [id, code] of [['mobilePack', 'KeyE'], ['mobileMap', 'KeyM'], ['mobileHeal', 'KeyH'], ['mobilePact', 'KeyP'], ['mobileMenu', 'Escape']]) bindTouchButton(id, () => { if (touchPlay()) tapKey(code); });
bindTouchButton('mobileClose', () => { if (UI.open) { closeUI(); sfx('ui'); } });
// CHAT is the ENTER key of a world shared with friends: it opens the line to type on, under the finger's own press so that the phone's keyboard comes up with it
bindTouchButton('mobileChat', () => { if (touchPlay() && !COOP.chatOpen && chatKey()) drawChatBox(ctx); });
// (PACT is the P key of a match in the Wilds, and is seen only there)
const touchPactBtn = document.getElementById('mobilePact'), touchMapBtn = document.getElementById('mobileMap'), touchPackBtn = document.getElementById('mobilePack'), touchChatBtn = document.getElementById('mobileChat');
// Is this patch of the picture (in ui px) clear of every touch control on screen? Something a finger must tap (the Trials'
// perk cards, the map's zoom) is moved until it is, or a tap there would move, strike or close instead.
// (Hidden controls measure nothing, so a computer never moves anything.)
function touchClear(x, y, w, h) {
  if (!mobileDevice) return true;
  const r = cv.getBoundingClientRect(), k = cv.width / (r.width || 1) / VS.ui;
  for (const el of mobileControls.querySelectorAll('#movePad, .touchButton, .touchPill')) {
    const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue;
    const bx = (b.left - r.left) * k, by = (b.top - r.top) * k;
    if (bx < x + w && bx + b.width * k > x && by < y + h && by + b.height * k > y) return false;
  }
  return true;
}
function syncMobileControls() {
  if (!mobileDevice) return; // (a mouse's clicks and keys are its own business)
  // a finished match shows its own end panel (PLAY AGAIN, LEAVE): the sticks would only lie over it
  const play = G.state === 'play' && !G.dialog && !G.cine, over = WORLD.royale && BR.on && BR.phase === 'over', visible = play && !UI.open && !over;
  mobileControls.classList.toggle('visible', visible); mobileControls.classList.toggle('panel', play && !!UI.open); mobileControls.setAttribute('aria-hidden', String(!play));
  // no button for what would do nothing: there is no pack in the Cinder Ring, no map there or before you have drawn one, and nobody to talk to alone
  if (visible) { const ring = WORLD.arena && !WORLD.royale; touchPackBtn.classList.toggle('off', ring); touchMapBtn.classList.toggle('off', ring || (!WORLD.royale && !hasUtil('fieldmap'))); touchChatBtn.classList.toggle('off', !COOP.role); touchPactBtn.classList.toggle('off', !wildOn()); }
  if (!visible && (stickPointer !== null || mouse.l || mouse.r)) clearMobileInput();
  // a finger still on DASH when the buttons go or you fall (a panel opens, you leave for the title) no longer holds Shift:
  // or a tap in the pack would be a Shift-click until it lifts
  if (touchDash && (!visible || !G.p || G.p.dead)) { touchDash = false; keys.ShiftLeft = false; }
  if (visible && touchAim) mobileAim();
}
// ---------------- fingers on the picture itself ----------------
// A tap is a click. On a panel or the list of worlds a finger that slides scrolls, and one that lifts where it came down taps.
cv.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  e.preventDefault(); canvasTouchPointer = e.pointerId; cv.setPointerCapture(e.pointerId); setMouse(e); audioInit();
  if (AC && AC.state === 'suspended') AC.resume();
  if (G.state === 'intro') { advance(); return; }
  mouse.held = true; mouse.hp = true;
  if (G.state === 'worlds' || (G.state === 'play' && UI.open && UI.open !== 'map')) { touchTap = { y: e.clientY, slid: false }; return; }
  const taken = uiMouseDown(0); focusMobileText(UI.focus);
  if (taken || G.state !== 'play') return;
  mouse.l = true; mouse.lp = true;
});
cv.addEventListener('pointermove', e => {
  if (e.pointerType !== 'touch' || e.pointerId !== canvasTouchPointer) return; setMouse(e);
  if (touchTap && abs(e.clientY - touchTap.y) > 20) { UI.scroll = max(0, UI.scroll - sign(e.clientY - touchTap.y)); touchTap.y = e.clientY; touchTap.slid = true; }
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) cv.addEventListener(type, e => {
  if (e.pointerType !== 'touch' || e.pointerId !== canvasTouchPointer) return;
  canvasTouchPointer = null; setMouse(e); const tap = touchTap; touchTap = null;
  if (tap && !tap.slid && type === 'pointerup') uiMouseDown(0);
  mouse.l = mouse.r = mouse.held = false; uiMouseUp(); focusMobileText(UI.focus);
});
