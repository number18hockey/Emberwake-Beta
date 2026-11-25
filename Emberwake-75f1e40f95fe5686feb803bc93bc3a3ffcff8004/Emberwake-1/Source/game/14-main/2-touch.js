// ============================================================
//  Touch: a stick to move, a few buttons, and fingers on the world
//  and the panels themselves. On a computer with a mouse none of
//  this does anything. (The buttons and their look are in build.py's
//  page; the first version of this is Hakerfire1234's.)
// ============================================================
const mobileControls = document.getElementById('mobileControls'), mobileTextInput = document.getElementById('mobileTextInput'), mobileDevice = matchMedia('(pointer:coarse)').matches;
const movePad = document.getElementById('movePad'), moveKnob = document.getElementById('moveKnob');
let stickPointer = null, stickX = 0, stickY = 0, canvasTouchPointer = null, touchAim = false, touchTap = null;
// ---------------- typing: an unseen text box brings up the phone's keyboard ----------------
function focusMobileText(key) {
  if (!mobileDevice) return;
  mobileTextInput.dataset.formKey = key; mobileTextInput.type = key === 'accountPassword' || key === 'accountConfirm' ? 'password' : 'text';
  mobileTextInput.value = FORM[key] || ''; mobileTextInput.focus({ preventScroll: true });
}
mobileTextInput.addEventListener('input', () => {
  const key = mobileTextInput.dataset.formKey; if (!key || UI.focus !== key) return;
  const limit = key === 'accountPassword' || key === 'accountConfirm' ? 64 : key === 'name' ? 24 : key === 'seed' ? 18 : key === 'gcode' || key === 'code' ? 6 : key === 'accountName' ? 18 : 12;
  const value = mobileTextInput.value.slice(0, limit), normalized = key === 'nick' ? value.toUpperCase() : key === 'code' ? value.toLowerCase() : value;
  FORM[key] = normalized; if (mobileTextInput.value !== normalized) mobileTextInput.value = normalized;
});
mobileTextInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); UI.focus = null; mobileTextInput.blur(); }
});
// ---------------- the stick ----------------
function virtualKey(code, down) { if (down && !keys[code]) pressed[code] = true; keys[code] = down; }
function clearMobileInput() {
  stickPointer = null; stickX = stickY = 0; moveKnob.style.transform = 'translate(-50%,-50%)'; touchAim = false;
  for (const k of ['KeyA', 'KeyD', 'ArrowDown', 'Space', 'KeyF']) keys[k] = false;
  mouse.l = mouse.r = false;
  document.querySelectorAll('#mobileControls .pressed').forEach(el => el.classList.remove('pressed'));
}
function updateStick(e) {
  const r = movePad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, radius = r.width * .34;
  let dx = clamp((e.clientX - cx) / radius, -1, 1), dy = clamp((e.clientY - cy) / radius, -1, 1), d = hypot(dx, dy);
  if (d < .2) dx = dy = 0;
  else if (d > 1) { dx /= d; dy /= d; }
  stickX = dx; stickY = dy;
  moveKnob.style.transform = `translate(calc(-50% + ${round(dx * radius)}px), calc(-50% + ${round(dy * radius)}px))`;
  virtualKey('KeyA', dx < -.22); virtualKey('KeyD', dx > .22); virtualKey('ArrowDown', dy > .48);
}
movePad.addEventListener('pointerdown', e => { e.preventDefault(); stickPointer = e.pointerId; movePad.setPointerCapture(e.pointerId); audioInit(); updateStick(e); });
movePad.addEventListener('pointermove', e => { if (e.pointerId === stickPointer) { e.preventDefault(); updateStick(e); } });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) movePad.addEventListener(type, e => {
  if (e.pointerId !== stickPointer) return;
  stickPointer = null; stickX = stickY = 0; moveKnob.style.transform = 'translate(-50%,-50%)';
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
bindTouchButton('attackLight', () => { if (touchPlay()) { touchAim = true; mouse.l = true; mouse.lp = true; mobileAim(); } }, () => { mouse.l = false; touchAim = false; });
bindTouchButton('attackHeavy', () => { if (touchPlay()) { touchAim = true; mouse.r = true; mouse.rp = true; mobileAim(); } }, () => { mouse.r = false; touchAim = false; });
bindTouchButton('mobileJump', () => { if (touchPlay()) virtualKey('Space', true); }, () => virtualKey('Space', false));
bindTouchButton('mobileUse', () => { if (touchPlay()) pressed.KeyF = true; });
for (const [id, code] of [['mobilePack', 'KeyE'], ['mobileMap', 'KeyM'], ['mobileHeal', 'KeyH'], ['mobilePact', 'KeyP'], ['mobileMenu', 'Escape']]) bindTouchButton(id, () => { if (touchPlay()) tapKey(code); });
bindTouchButton('mobileClose', () => { if (UI.open) { closeUI(); sfx('ui'); } });
const touchMapBtn = document.getElementById('mobileMap'), touchPactBtn = document.getElementById('mobilePact');
function syncMobileControls() {
  if (!mobileDevice) return; // (a mouse's clicks and keys are its own business)
  const play = G.state === 'play' && !G.dialog && !G.cine, visible = play && !UI.open;
  mobileControls.classList.toggle('visible', visible); mobileControls.classList.toggle('panel', play && !!UI.open); mobileControls.setAttribute('aria-hidden', String(!play));
  if (play && (RFRAME & 15) === 0) { touchMapBtn.classList.toggle('off', !WORLD.royale && !hasUtil('fieldmap')); touchPactBtn.classList.toggle('off', !WORLD.royale); }
  if (!visible && (stickPointer !== null || mouse.l || mouse.r)) clearMobileInput();
  if (visible && touchAim) mobileAim();
}
// ---------------- fingers on the picture itself ----------------
cv.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  e.preventDefault(); canvasTouchPointer = e.pointerId; cv.setPointerCapture(e.pointerId); setMouse(e); audioInit();
  if (AC && AC.state === 'suspended') AC.resume();
  if (G.state === 'intro') { advance(); return; }
  mouse.held = true; mouse.hp = true;
  // on a panel a finger that slides scrolls it, and one that lifts where it came down taps it
  if (G.state === 'play' && UI.open && UI.open !== 'map') { touchTap = { y: e.clientY, slid: false }; return; }
  if (uiMouseDown(0) || G.state !== 'play') return;
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
  mouse.l = mouse.r = mouse.held = false; uiMouseUp();
});
