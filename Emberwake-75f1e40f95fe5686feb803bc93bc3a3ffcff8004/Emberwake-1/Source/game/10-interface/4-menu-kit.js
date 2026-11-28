// ============================================================
//  THE MENU KIT: every menu but the home page is built from this.
//  (Read this top part before you build or change a menu. It is
//  the whole contract: you should not need to read the code below.)
// ============================================================
//
//  THE IDEA
//  Every menu is a PLACE in the home page's family: the same dark cards with a coloured bar on top, an emblem and a
//  title, the same drifting land behind, embers or other motes in the air. What makes each place its own is its
//  accent colour, its emblem, its motes and a little diorama in the backdrop. All sizes are in "ui px" (the menus'
//  own pixels: 640x360 on a 1280x720 screen). D means a computer (mouse and keys), T a touch screen (KIT.T).
//
//  1. REGISTER YOUR PLACE (once, at the top level of your own file):
//     Object.assign(MENUS, { myplace: {
//       col: '#ffb347',            accent colour: card bar, title, hover, focus, the main button
//       art: 'lantern',            emblem name in MENU_ART (16x16, drawn at the card's top left)
//       motes: 'lanterns',         mote kind in the air (see MOTES below), or null
//       place: 'THE HEARTH',       the place's name (the hero band on a tall phone shows it)
//       idle: 'what to do here',   grey hint line when nothing is hovered (a string, or a function returning one)
//       sound: 'fire',             optional: played when the place opens (out of play)
//       keys(e) { return false },  optional: your own keys; return true when you used the key
//       back() { },                optional: what Escape and your BACK button do (else MENU_PARENT below)
//       enter() { }, leave() { },  optional: run when the place opens / closes
//       typed(key) { },            optional: run after any typing into a field of yours
//       top: 86,                   optional: a number or function: the highest y a card may use out of play
//       hero: false,               optional: false stops the hero band on tall phones
//       zoom: false,               optional: false keeps a tall phone at ui scale 2 (see menuUi)
//       diorama(x, W, H) { },      optional: draw still props into the cached backdrop (x is that canvas's context)
//       live(c, uw, uh, now) { },  optional: up to 12 fillRects of live backdrop motion (a flame, a blinking pin)
//       glow: { x: .5, y: .5 },    optional: where the backdrop's accent glow sits, as fractions of the screen
//       still: true,               optional: the land behind does not drift (the intro and loading: the camera is the game's)
//     (each place gets one entry; a sub-view with its own colour and emblem, like the long invite inside 'join', may
//      add an entry of its own and pass that id to kcard: MENUS.joinlong)
//     } });
//     Object.assign(MENU_ART, { myemblem(c, x, y) { ... } });   16x16, at most 14 fillRects, animate with (performance.now() / 110) | 0
//     The place id is G.state out of play and UI.open in play. A place with a MENUS entry is "kit-built": it gets the
//     hint line, Escape = BACK, Tab and Enter, the slide-to-scroll, and on a tall phone the portrait zoom.
//
//  2. DRAW IT, every frame (your draw function is called from drawUI as before):
//     menuBackdrop(c, id)                  out of play, first thing: the drifting land, gradient, glow, diorama, motes
//     (in play the veil is drawn for you by drawUI before the HUD; do not draw a wash yourself)
//     const F = menuFrame(id, wantW, wantH) where a card may go: {x, y, w, h, mode, hero, top, bot}
//                                          mode is 'wide' (640x360 and up), 'short' (480x270) or 'narrow' (phones held upright)
//     menuHero(c, id, F)                   on a tall phone, fills the empty space above a bottom-anchored card
//     kview('create')                      say which sub-view you show (re-plays the cards' entrance when it changes)
//     const K = kcard(c, F.x, F.y, F.w, F.h, id, 'TITLE', { foot: true, i: 0 })
//                                          the card. K.by is where the body starts, K.footY the foot strip's top line
//                                          (foot buttons go at K.footY + 5). Everything after it fades in with it.
//     kbutton / kfield / kchooser / ksegment / ktabs / krow / klist / kscroll / klook / kmsg / kconfirm: the controls.
//
//  3. THE HELPERS (signature, then what it does)
//     menuUi()                              (called by render) a tall phone draws kit-built places at ui scale 3
//     menuMode()                            'wide' | 'short' | 'narrow' for the screen now
//     menuFrame(id, wantW, wantH)           the card rect: width min(wantW, uw-24, narrow uw-12); out of play top 6
//                                          (or MENUS[id].top) to uh-24; in play under the bars to above the hotbar;
//                                          height min(wantH, room), centred; a narrow screen with 96+ px spare anchors
//                                          it to the bottom and returns F.hero; with the phone keyboard up, y is 8
//     menuHero(c, id, F)                    accent glow, the emblem at 4x and the place name in F.hero (if any)
//     menuBackdrop(c, id)                   the backdrop out of play (one cached image + live rects + motes)
//     menuVeil(c, id)                       (called by drawUI in play) a soft blurred copy of the world behind panels
//     menuMotes(c, kind, o)                 motes in the air; o = {n, avoid: [rects], at: {x, y}}; cheap and stateless
//     kcard(c, x, y, w, h, id, title, o)   a card; o = {col, art, right, close, foot, i, dom}; returns {x, y, w, h, by, footY}
//                                          right: a string (grey, head right) or fn(c, rightX, y) for a control there
//                                          close: fn -> a 16x16 close box at the head's right (computers only; a phone
//                                          has its CLOSE pill); i: entrance order (cards fade in 40 ms apart);
//                                          dom: the card holds an HTML box, so it appears at once
//     kbutton(c, x, y, w, label, fn, o)    a button, KIT.bh tall (o.small: KIT.sm); o = {main, off, on, small, sub, hint,
//                                          short, danger}; main = Enter runs it (and an ENTER keycap shows on a computer);
//                                          off = greyed, no hit, its hint says why; sub = a grey caption under it;
//                                          short = shorter label for when the full one does not fit; returns hover
//     kfield(c, x, y, w, key, label, ph, o)a labelled text box over FORM[key]; o = {secret, check, hint, show, toggle};
//                                          secret = stars, SHOW/HIDE inside the box and a CAPS chip; check() returns
//                                          {text, kind, pips: [n, of]} for a live line under it; returns its height
//                                          (28 on a computer, 34 on touch, 12 more with a check line)
//     kchooser(c, x, y, w, label, names, key, descs)   < value > over FORM[key]; Left/Right change it; descs[i] is a grey
//                                          line under it (wrapping to two lines); returns height (ah+4, ah+14 or ah+23)
//     ksegment(c, x, y, w, opts, cur, set, o)          one row of choices; o.icons[i](c, x, y) draws an 8x8 icon
//     ktabs(c, x, y, w, names, cur, set, o) tabs with an accent underline, wrapping into rows; o.cols forces a grid
//     krow(c, x, y, w, h, fn, o)           a list row (o.sel = chosen, o.tag = 'row:kind:id', o.hint); returns hover
//     klist(c, B, n, rowH, drawRow)        n rows of rowH in box B over UI.scroll, with "a-b of n" and up/down arrows
//                                          when they overflow; drawRow(c, i, x, y, w, h) draws row i (use krow)
//     kscroll(c, B, contentH, id) -> dy    clip to B and scroll its content (add dy to your y's); end with kscrollEnd(c)
//     kscrollEnd(c)                         ends a kscroll (draws the thumb, keeps the focused field in view)
//     klook(c, x, y, w, o)                 the look: skin tiles and the HAT chooser over FORM.skin / FORM.hat;
//                                          o.preview draws the head at 3x on a lit plinth above them; o.hat = false
//                                          leaves the HAT chooser out (a form that only takes a skin); returns height
//     khead(c, skin, hat, x, y, sc)        a head (with its hat sitting right) with its top left at x, y, sc times
//     kclose(c, x, y, fn)                   the 16x16 close box (computers only)
//     kmsg(c, x, y, w, m)                   a message {text, kind: err|ok|info|warn} behind a colour square; returns height
//     kconfirm(c, F, text, yes, no)         a red question with YES (danger) and NO in box F; returns height
//     kfootHint(c, K, w)                    in play: the hint of what is under the mouse, in card K's foot strip
//     khint(s)                              set the hint line for this frame (every control does this from o.hint)
//     kitToast(text, kind)                  a slim card at the top for 3 s, in any state ('ok', 'err', 'info', 'warn')
//     kerr(key)                             mark field `key` wrong: red border, a short shake
//     kview(name)                           name the sub-view being drawn (entrance re-plays when it changes)
//     fitText(s, w)                         s cut at whole words with '..' to fit w px (never one letter at a time)
//     wrapC(s, w)                           wrapText, cached: use it in draw code
//     mix(a, b, t)                          blend two '#rrggbb' colours; rgbaHex(hex, alpha) for 'rgba(...)'
//     kb(desk, touch)                       the computer's words or the phone's ("press Enter" / "tap")
//     menuBack()                            what Escape does out of play (MENUS[id].back, else MENU_PARENT)
//     kitHit(prefix)                        the centre {x, y} of the first hit whose tag starts with prefix (for tests)
//     kitBegin() kitEnd(c) kitKey(e)        (called by drawUI and the keydown handler; you do not call these)
//
//  4. RULES
//     - Tags: every hit carries a tag with its FULL label even when a short one is drawn: 'btn:' + label,
//       'field:' + key, 'row:' + kind + ':' + id, 'tab:' + name. Tests find controls by tag (kitHit).
//     - Sizes come from KIT.sizes (KIT.bh button, KIT.sm small button, KIT.sizes.row list rows...): they are bigger on
//       a touch screen. Keep controls KIT.sizes.gap apart (8 on touch, 4 on a computer): touch hits are padded.
//     - Labels are scale 1. Never touchFit a label: pass o.short, or let the kit fitText it.
//     - Words: kb('click', 'tap'). No key names in phone wording.
//     - The main action of a card: kbutton(..., { main: true }). Enter runs it, also from inside a field and from the
//       phone keyboard's Go key. Escape runs MENUS[id].back or MENU_PARENT. Tab walks fields, then buttons.
//     - Lists: klist (rows) or kscroll (free content). Both scroll by the wheel, by sliding a finger, and the list by
//       its arrows. Pin a card's foot (K.footY) and scroll only its body.
//     - In play, put the hint in the main card's foot strip with kfootHint; out of play the kit draws it at uh-15.
//     - Colours: body #d8d4e6, field labels #b9bdd0, captions #8b8fa3, messages err #ff9a8a, ok #7ddc6f,
//       info #8ff5e6, warn #ffd35a (KIT_MSG). Use the place's accent (KIT.col after kcard) for highlights.
//     - Sounds: 'ui' moves and back, 'quest' main actions, 'deny' refusals, 'brk' delete.
//     - Cost: cards and the backdrop are cached images; draw at most a few dozen live rects a frame.
//     - Parts B and C: add places with Object.assign(MENUS|MENU_ART, ...) in your own file, write any local helper you
//       need there, and do not change this file.
//
//  5. WHAT IS ALREADY BUILT (read one before you build yours: they are short)
//     Out of play, part A: accounts (THE HEARTH, 5-accounts.js); howto, worlds, create, intro, loading (7-places.js);
//     join and its long invite (2-game-codes.js, 1-co-op.js); wcopy, wpaste (1-co-op.js). drawWorlds is the fullest
//     example: a klist of rows with buttons on them, a delete question in the row, a chip in the card's head, Up/Down
//     keys of its own, and KIT.main set by hand. drawJoin shows two cards side by side that stack on a phone, with an
//     HTML box in one. drawHowTo shows tabs over a kscroll body.
//     Emblem names already taken in MENU_ART (do not reuse them): lantern ledger key mirror post chart anvil isle
//     portal fire beacon letter scrollOut scrollIn. KIT.sy ids taken: door create forge howto.
//
//  6. GOTCHAS (each of these bit someone once)
//     - Out of play, menuBackdrop(c, id) is the first thing you draw: never lay a flat wash of your own.
//     - kcard leaves c.globalAlpha at its fade-in value so what follows fades with it. If you change globalAlpha,
//       keep it and put it back (const ga = c.globalAlpha; ... c.globalAlpha = ga), never set it to 1.
//     - menuFrame wants the height your content needs, not the screen's: it centres the card, keeps it on screen and,
//       on a phone held upright, anchors it low and gives you F.hero (call menuHero). Too tall: scroll the body with
//       kscroll and keep the foot pinned (kcard o.foot; buttons at K.footY + 5).
//     - HTML boxes (domBox, 12-playing-together/1-co-op.js) are laid over the canvas: they cannot sit inside a kscroll
//       (nothing clips them), and the card that holds one needs o.dom so it does not fade in under a box that does
//       not. domBox options: input, ro, ph, val, onEnter, onCtrlEnter, onEsc. Set el.style.borderColor yourself.
//     - Only one main per screen: the last kbutton with o.main sets KIT.main (Enter). With several (a PLAY per row),
//       set KIT.main = fn yourself after drawing them.
//     - MENUS[id].keys(e) sees Up and Down first out of play: return false for keys you do not use, so the kit can
//       move the focus. In play the kit acts only while a panel with a MENUS entry is open: Enter runs the main,
//       Up/Down scroll the first list or kscroll it drew, keys(e) gets the rest; Escape, P, Tab and letters keep
//       closing and opening panels as before (1-main.js).
//     - Touch: every kit control's hit is padded 3 px down and up and 2 across; where two padded hits would overlap,
//       kitEnd splits them halfway between the controls, so neighbours never steal each other's taps. A control
//       drawn on top of another (a button on a row) is left alone: the later one wins there.
//     - Never shorten text a letter at a time in a loop, never touchFit a label: fitText, wrapC, o.short.
//     - kchooser's description wraps to two lines: use its returned height, do not assume one.
// ============================================================

const KIT = {
  T: mobileDevice, zoom: true,
  sizes: mobileDevice ? { bh: 24, sm: 20, fh: 22, tab: 22, row: 32, aw: 24, ah: 22, gap: 8, close: 0, tileW: 30, tileH: 32 }
                      : { bh: 18, sm: 14, fh: 16, tab: 14, row: 24, aw: 14, ah: 14, gap: 4, close: 16, tileW: 20, tileH: 22 },
  fields: [], fieldsPrev: [], main: null, mainPrev: null, endMain: null, ctrls: [], ctrlsPrev: [], scrollers: [], scrollersPrev: [],
  hint: '', hintPrev: '', tapHint: null, focus: null, kbd: false, caps: false, err: {}, reveal: {},
  enter: { key: '', t0: 0, view: '' }, sy: {}, toast: null, cache: new Map(), col: '#ffd35a', mx: null, my: null, scrollNow: null
};
KIT.bh = KIT.sizes.bh; KIT.sm = KIT.sizes.sm;
const KIT_MSG = { err: '#ff9a8a', ok: '#7ddc6f', info: '#8ff5e6', warn: '#ffd35a' };
const HAT_N = ['NO HAT', 'EMBER', 'CROWN', 'FROST'];
// every place built with the kit, and its emblem (other files add theirs with Object.assign)
const MENUS = {};
const MENU_ART = {};
// where Escape (and BACK) leads from each out-of-play screen that does not say for itself
const MENU_PARENT = { howto: 'title', worlds: 'title', join: 'title', ring: 'title', brform: 'title', create: 'worlds', wcopy: 'worlds', wpaste: 'worlds', bropen: 'brform' };
const kb = (desk, touch) => KIT.T ? touch : desk;
const kitPlace = () => G.state === 'play' ? UI.open : G.state;
const kitTyping = () => mobileDevice && document.activeElement === mobileTextInput;
function kitCache(k, v) { if (KIT.cache.size > 90) KIT.cache.clear(); KIT.cache.set(k, v); return v; }

// ---------------- words and colours ----------------
const MIXC = new Map();
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) || 0);
function mix(a, b, t) {
  const k = a + b + t; let r = MIXC.get(k); if (r) return r;
  const A = hexRGB(a), B = hexRGB(b); r = '#' + A.map((v, i) => clamp(round(v + (B[i] - v) * t), 0, 255).toString(16).padStart(2, '0')).join('');
  if (MIXC.size > 300) MIXC.clear(); MIXC.set(k, r); return r;
}
function rgbaHex(h, a) { const p = hexRGB(h); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; }
// cut at whole words, ending in '..'; a single word too long is cut once to fit (never a letter at a time per frame)
function fitText(s, w) {
  s = String(s); if (textW(s) <= w) return s;
  const words = s.split(' '); while (words.length > 1 && textW(words.join(' ') + '..') > w) words.pop();
  let t = words.join(' ');
  if (textW(t + '..') > w) { let lo = 0, hi = t.length; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (textW(t.slice(0, m) + '..') <= w) lo = m; else hi = m - 1; } t = t.slice(0, lo); }
  return t + '..';
}
const WRAPC = new Map();
function wrapC(s, w) { const k = w + '|' + s; let r = WRAPC.get(k); if (!r) { if (WRAPC.size > 300) WRAPC.clear(); r = wrapText(s, w); WRAPC.set(k, r); } return r; }

// ---------------- the portrait zoom, modes and frames ----------------
// A phone held upright draws kit-built places at ui scale 3 (240 ui px across): bigger words and bigger targets.
// The home page, the intro and the loading screen keep their own scale.
function menuUi() {
  if (VS.baseUi === undefined) VS.baseUi = VS.ui;
  const st = G.state, M = MENUS[st];
  const want = KIT.zoom && mobileDevice && VS.H > VS.W * 1.3 && st !== 'play' && st !== 'title' && st !== 'intro' && st !== 'loading' && M && M.zoom !== false ? 3 : VS.baseUi;
  if (want !== VS.ui) { VS.ui = want; VS.uw = VS.W / VS.ui; VS.uh = VS.H / VS.ui; HITS = []; }
}
function menuMode() { const uw = VS.uw, uh = VS.uh; return uw >= 520 && uh >= 300 ? 'wide' : uh < 300 ? 'short' : 'narrow'; }
function menuFrame(id, wantW, wantH) {
  const uw = VS.uw, uh = VS.uh, mode = menuMode(), play = G.state === 'play', M = MENUS[id] || {};
  const w = max(40, min(wantW, floor(uw - (mode === 'narrow' ? 12 : 24))));
  let top, bot;
  if (play) { top = KIT.T ? 42 : 30; bot = hotbarLayout().y - 4; }
  else { top = M.top === undefined ? 6 : typeof M.top === 'function' ? M.top() : M.top; bot = floor(uh - 24); }
  const kbUp = !play && kitTyping(); if (kbUp) top = 8;
  const room = max(24, bot - top), h = min(wantH, room), x = round((uw - w) / 2);
  let y = kbUp ? top : top + round((room - h) / 2), hero = null;
  if (mode === 'narrow' && !play && !kbUp && M.hero !== false && room - h >= 96) { y = bot - h; hero = { x: 0, y: top, w: uw, h: y - top }; }
  return { x, y, w, h, mode, hero, top, bot };
}
function kitGlow(r, col, a) {
  const k = 'glow|' + r + col + a; let g = KIT.cache.get(k);
  if (!g) { const [cv2, x] = mk(r * 2, r * 2), p = hexRGB(col), gr = x.createRadialGradient(r, r, 2, r, r, r); gr.addColorStop(0, `rgba(${p},${a})`); gr.addColorStop(1, `rgba(${p},0)`); x.fillStyle = gr; x.fillRect(0, 0, r * 2, r * 2); g = kitCache(k, cv2); }
  return g;
}
function menuHero(c, id, F) {
  const H = F && F.hero, M = MENUS[id] || {}; if (!H || H.h < 60) return;
  const col = M.col || '#ffd35a', cx = round(H.x + H.w / 2), cy = round(H.y + H.h / 2) - 8;
  c.drawImage(kitGlow(60, col, .22), cx - 60, cy - 60);
  if (M.art && MENU_ART[M.art]) { c.save(); c.translate(cx - 32, cy - 40); c.scale(4, 4); MENU_ART[M.art](c, 0, 0); c.restore(); }
  if (M.place) textC(c, M.place, cx, cy + 30, col, 2, textO);
}

// ---------------- backdrop, veil, motes ----------------
function menuBackdrop(c, id) {
  const M = MENUS[id] || {}, uw = VS.uw, uh = VS.uh, now = performance.now(), W = ceil(uw), H = ceil(uh), col = M.col || '#ffd35a';
  if (!M.still) titleDrift(now);
  const k = 'bd|' + id + '|' + W + 'x' + H; let img = KIT.cache.get(k);
  if (!img) {
    const [cv2, x] = mk(W, H), g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(18,13,31,.62)'); g.addColorStop(.45, 'rgba(18,13,31,.2)'); g.addColorStop(1, 'rgba(18,13,31,.5)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const gl = M.glow || { x: .5, y: .5 }, r = round(.6 * max(W, H)), rg = x.createRadialGradient(W * gl.x, H * gl.y, 4, W * gl.x, H * gl.y, r), p = hexRGB(col); rg.addColorStop(0, `rgba(${p},.14)`); rg.addColorStop(1, `rgba(${p},0)`); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    if (M.diorama) { try { M.diorama(x, W, H); } catch (e) { } }
    img = kitCache(k, cv2);
  }
  c.drawImage(img, 0, 0);
  if (M.live) M.live(c, uw, uh, now);
  if (M.motes) menuMotes(c, M.motes);
}
const VEIL = { cv: null, x: null, w: 0, h: 0, ui: null, ux: null, uw: 0, uh: 0, key: '', frozen: false };
function menuVeil(c, id) {
  const uw = VS.uw, uh = VS.uh, M = MENUS[id] || {};
  if (SETTINGS.fx === 'plain' || SETTINGS.fpsMode) { c.fillStyle = 'rgba(18,13,31,.45)'; c.fillRect(0, 0, uw, uh); return; }
  const w = max(1, round(VS.W / 6)), h = max(1, round(VS.H / 6)), W = ceil(uw), H = ceil(uh), key = (M.col || '') + W + 'x' + H;
  if (!VEIL.cv || VEIL.w !== w || VEIL.h !== h) { const m = mk(w, h); VEIL.cv = m[0]; VEIL.x = m[1]; VEIL.w = w; VEIL.h = h; VEIL.frozen = false; }
  if (!VEIL.ui || VEIL.uw !== W || VEIL.uh !== H) { const m = mk(W, H); VEIL.ui = m[0]; VEIL.ux = m[1]; VEIL.uw = W; VEIL.uh = H; VEIL.frozen = false; }
  if (VEIL.key !== key) { VEIL.key = key; VEIL.frozen = false; }
  // the world shrunk to a sixth and grown back smoothly (a soft blur), with the vignette and the place's glow on it, made
  // at the menus' own size and laid over the screen in one draw. A world that stands still (pausing alone) is made once.
  const still = id === 'pause' && !WORLD.arena && !netLive();
  if (!(still && VEIL.frozen)) {
    VEIL.x.imageSmoothingEnabled = true; VEIL.x.drawImage(cv, 0, 0, w, h);
    const x = VEIL.ux; x.imageSmoothingEnabled = true; x.globalAlpha = 1; x.drawImage(VEIL.cv, 0, 0, W, H); x.drawImage(menuVignette(M, W, H), 0, 0);
    VEIL.frozen = still;
  }
  c.globalAlpha = .9; c.drawImage(VEIL.ui, 0, 0); c.globalAlpha = 1;
}
function menuVignette(M, W, H) {
  const k = 'veil|' + (M.col || '') + W + 'x' + H; let v = KIT.cache.get(k);
  if (!v) {
    const [cv2, x] = mk(W, H); x.fillStyle = 'rgba(18,13,31,.25)'; x.fillRect(0, 0, W, H);
    const r = x.createRadialGradient(W / 2, H / 2, min(W, H) * .3, W / 2, H / 2, hypot(W, H) / 2); r.addColorStop(0, 'rgba(18,13,31,0)'); r.addColorStop(1, 'rgba(18,13,31,.7)'); x.fillStyle = r; x.fillRect(0, 0, W, H);
    if (M.col) { const p = hexRGB(M.col), g = x.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, max(W, H) * .5); g.addColorStop(0, `rgba(${p},.1)`); g.addColorStop(1, `rgba(${p},0)`); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    v = kitCache(k, cv2);
  }
  return v;
}
// motes: each is worked out from its number and the clock alone (nothing kept between frames). [count, colour, fn]
// fn(k, t, uw, uh, a, b) returns [x, y, size, alpha] or null; a and b are fixed random numbers of mote k.
const MOTES = {
  lanterns: [18, '#ffb347', (k, t, uw, uh, a, b) => { const sp = 4 + a * 5, span = uh + 20, life = (t * sp + b * span * 3) % span, u = life / span; return [hh(k, 5, 12) * uw + sin(t * (.3 + b * .4) + k) * 7, uh + 10 - life, k % 5 ? 1 : 2, (1 - u) * (.35 + .45 * b) * (.75 + .25 * sin(t * 6 + k))]; }],
  glints: [30, '#8ff5e6', (k, t, uw, uh, a, b) => { const ph = (t / 2.4 + b) % 1, cyc = floor(t / 2.4 + b); return [hh(k, cyc, 4) * uw, hh(k, cyc, 9) * uh, ph > .4 && ph < .6 ? 3 : 1, sin(ph * PI) * .8]; }],
  leaves: [22, '#7ddc6f', (k, t, uw, uh, a, b) => { const sp = 10 + a * 6, span = uh + 20, life = (t * sp + b * span * 3) % span; return [hh(k, 5, 12) * uw + sin(t * (.6 + b) + k) * 10, life - 10, 2, .5 + .3 * b]; }],
  sparks: [26, '#ff8a3d', (k, t, uw, uh, a, b, o) => { const per = 1.2, tt = (t + b * per) % per, at = o.at || { x: uw / 2, y: uh - 30 }, v = 40 + a * 30, ang = -PI / 2 + (hh(k, floor((t + b * per) / per), 3) - .5) * 1.6; return [at.x + cos(ang) * v * tt, at.y + sin(ang) * v * tt + 30 * tt * tt, 1, 1 - tt / per]; }],
  fireflies: [14, '#c9ffb8', (k, t, uw, uh, a, b) => { const on = sin(t * (1.5 + a) + k * 3); return on < .2 ? null : [hh(k, 5, 12) * uw + sin(t * .3 + k) * 20, uh * (.3 + .6 * b) + cos(t * .4 + k * 2) * 12, 1, on]; }],
  cinders: [30, '#ff6b6b', (k, t, uw, uh, a, b) => { const sp = 10 + a * 12, span = uh + 20, life = (t * sp + b * span * 3) % span, up = k % 6 === 0; return [hh(k, 5, 12) * uw + sin(t + k) * 4, up ? uh + 10 - life : life - 10, 1, .35 + .45 * b]; }],
  ashfall: [40, '#b9b0a0', (k, t, uw, uh, a, b) => { const sp = 14 + a * 8, span = uh + 20, life = (t * sp + b * span * 3) % span; return [hh(k, 5, 12) * uw + sin(t * .7 + k) * 6, life - 10, k % 4 ? 1 : 2, .3 + .4 * b]; }],
  souls: [20, '#c77dff', (k, t, uw, uh, a, b) => { const sp = 8 + a * 8, span = uh + 20, life = (t * sp + b * span * 3) % span, u = life / span; return [hh(k, 5, 12) * uw + sin(t * 1.5 + k) * (6 + 6 * b), uh + 10 - life, 1, (1 - u) * .8]; }],
  stars: [26, '#c9d2ff', (k, t, uw, uh, a, b) => [hh(k, 5, 12) * uw, hh(k, 7, 3) * uh * .8, k % 7 ? 1 : 2, .25 + .6 * abs(sin(t * (.5 + a) + k))]],
  smoke: [10, '#8b8fa3', (k, t, uw, uh, a, b) => { const sp = 6 + a * 4, span = uh * .6, life = (t * sp + b * span * 3) % span, u = life / span; return [hh(k, 5, 12) * uw + sin(t * .4 + k) * 8, uh - 20 - life, 3 + round(u * 3), .15 * (1 - u)]; }],
  dust: [16, '#fff1a8', (k, t, uw, uh, a, b) => { const u = (t * (.02 + .02 * a) + b) % 1; return [uw * (.25 + .3 * u) + hh(k, 2, 2) * 40, uh * u, 1, .35 * sin(u * PI)]; }],
  moths: [10, '#d8d4e6', (k, t, uw, uh, a, b) => [uw * (.2 + .6 * b) + sin(t * (2 + a) + k) * 16, uh * (.15 + .3 * a) + sin(t * (3.1 + b) + k * 2) * 10, 1, .6]],
  chips: [14, '#a9b4c8', (k, t, uw, uh, a, b) => { const tt = (t * (.6 + a * .4) + b) % 1; return [hh(k, 5, 12) * uw, uh - 24 - abs(sin(tt * PI * 2)) * (10 + 20 * b), 1, .6]; }],
  slashes: [8, '#9fc3ff', (k, t, uw, uh, a, b) => { const per = 2 + a, ph = ((t + b * per) % per) * 1000; return ph > 400 ? null : [hh(k, floor((t + b * per) / per), 5) * uw, hh(k, floor((t + b * per) / per), 8) * uh, 4, 1 - ph / 400]; }]
};
function menuMotes(c, kind, o = {}) {
  const K = MOTES[kind]; if (!K || SETTINGS.fx === 'plain' || SETTINGS.fpsMode) return;
  const uw = VS.uw, uh = VS.uh, t = performance.now() / 1000, play = G.state === 'play', n = min(40, o.n || (play ? K[0] >> 1 : K[0])), av = o.avoid || [];
  c.fillStyle = K[1];
  for (let k = 0; k < n; k++) {
    const m = K[2](k, t, uw, uh, hh(k, 3, 77), hh(k, 9, 31), o); if (!m || m[3] <= 0) continue;
    const x = round(m[0]), y = round(m[1]), s = m[2]; if (av.some(r => x >= r.x - 1 && x < r.x + r.w + 1 && y >= r.y - 1 && y < r.y + r.h + 1)) continue;
    c.globalAlpha = min(1, m[3]);
    if (s === 3 && kind === 'glints') { c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3); }
    else if (kind === 'slashes') { c.fillRect(x, y, s, 1); c.fillRect(x + 1, y - 1, s, 1); }
    else c.fillRect(x, y, s, s);
  }
  c.globalAlpha = 1;
}

// ---------------- hits, hints, focus ----------------
// a kit hit: on a touch screen padded 2 px across and 3 px down and up, held inside the screen
// (two padded hits that would overlap are split halfway between the controls at the end of the frame: kitEnd)
function khit(x, y, w, h, fn, tag, hint) {
  const r = [x, y, w, h];
  if (KIT.T) { const x0 = max(0, x - 2), y0 = max(0, y - 3), x1 = min(VS.uw, x + w + 2), y1 = min(VS.uh, y + h + 3); x = x0; y = y0; w = x1 - x0; h = y1 - y0; }
  const n = HITS_NEXT.length; hit(x, y, w, h, fn, false, tag);
  if (HITS_NEXT.length > n) { const q = HITS_NEXT[n]; if (hint) q.hint = hint; if (KIT.T) q.r = r; }
}
// touch: where the padding of two neighbouring controls overlaps, each keeps the half on its own side (a control drawn
// inside another, a button on a row, is left alone: the later one wins there, as always)
function kitUnpad() {
  const L = HITS_NEXT.filter(q => q.r); if (L.length < 2) return;
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const a = L[i], b = L[j];
    if (min(a.x + a.w, b.x + b.w) <= max(a.x, b.x) || min(a.y + a.h, b.y + b.h) <= max(a.y, b.y)) continue;
    const A = a.r, B = b.r, gx = max(A[0], B[0]) - min(A[0] + A[2], B[0] + B[2]), gy = max(A[1], B[1]) - min(A[1] + A[3], B[1] + B[3]);
    if (gx < 0 && gy < 0) continue;
    const [u, v, U, V] = (gy >= gx ? A[1] <= B[1] : A[0] <= B[0]) ? [a, b, A, B] : [b, a, B, A];
    if (gy >= gx) { const m = (U[1] + U[3] + V[1]) / 2; if (u.y + u.h > m) u.h = max(1, m - u.y); if (v.y < m) { v.h = max(1, v.y + v.h - m); v.y = m; } }
    else { const m = (U[0] + U[2] + V[0]) / 2; if (u.x + u.w > m) u.w = max(1, m - u.x); if (v.x < m) { v.w = max(1, v.x + v.w - m); v.x = m; } }
  }
}
function khint(s) { if (s) KIT.hint = s; }
function kerr(key) { KIT.err[key] = performance.now(); }
// is the mouse over this rect (and inside any scrolling box being drawn)?
const kin = (x, y, w, h) => inR(x, y, w, h) && (!HIT_CLIP || (mouse.uy >= HIT_CLIP.y0 && mouse.uy < HIT_CLIP.y1));
function kring(c, x, y, w, h) { c.fillStyle = KIT.col; c.fillRect(x - 2, y - 2, w + 4, 1); c.fillRect(x - 2, y + h + 1, w + 4, 1); c.fillRect(x - 2, y - 1, 1, h + 2); c.fillRect(x + w + 1, y - 1, 1, h + 2); }
const kfoc = tag => KIT.kbd && KIT.focus === tag;
function kctrl(q) { KIT.ctrls.push(q); }
function kview(name) {
  if (KIT.enter.view === name) return;
  KIT.enter.view = name; KIT.enter.t0 = performance.now(); KIT.focus = null; KIT.kbd = false;
}
function kitHit(prefix) { const h = HITS.find(q => q.tag && q.tag.startsWith(prefix)); return h ? { x: h.x + h.w / 2, y: h.y + h.h / 2 } : null; }
function kitScrollerAt(x, y) { const L = KIT.scrollersPrev; for (let i = L.length - 1; i >= 0; i--) { const s = L[i]; if (x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) return s; } return null; }

// ---------------- the card ----------------
function kcard(c, x, y, w, h, id, title, o = {}) {
  const M = MENUS[id] || {}, col = o.col || M.col || '#ffd35a', art = o.art || M.art, now = performance.now(), bh = KIT.bh;
  KIT.col = col;
  let a = 1; if (!o.dom) { a = clamp((now - KIT.enter.t0 - 40 * (o.i || 0)) / 160, 0, 1); a = 1 - (1 - a) ** 3; }
  y += round(6 * (1 - a)); c.globalAlpha = a;
  const foot = o.foot ? h - (bh + 10) : 0, rw = typeof o.right === 'string' ? textW(o.right) + 8 : o.right ? 0 : 0, tt = title ? fitText(title, w - 34 - rw - (o.close && !KIT.T ? 20 : 0)) : '';
  const k = 'card|' + w + 'x' + h + '|' + tt + '|' + col + '|' + foot; let img = KIT.cache.get(k);
  if (!img) {
    const [cv2, x2] = mk(w + 2, h + 2);
    x2.fillStyle = INK; x2.fillRect(0, 0, w + 2, h + 2); x2.fillStyle = 'rgba(22,17,34,.88)'; x2.fillRect(1, 1, w, h);
    x2.fillStyle = col; x2.fillRect(1, 1, w, 2); x2.fillStyle = '#2b2740'; x2.fillRect(1, h, w, 1); x2.fillRect(1, 24, w, 1);
    if (foot) x2.fillRect(1, 1 + foot, w, 1);
    if (tt) textS(x2, tt, 29, 10, col);
    img = kitCache(k, cv2);
  }
  c.drawImage(img, x - 1, y - 1);
  if (art && MENU_ART[art]) MENU_ART[art](c, x + 6, y + 5);
  if (typeof o.right === 'string') textS(c, o.right, x + w - 6 - textW(o.right) - (o.close && !KIT.T ? 20 : 0), y + 9, '#8b8fa3');
  else if (o.right) o.right(c, x + w - 6 - (o.close && !KIT.T ? 20 : 0), y + 4);
  if (o.close) kclose(c, x + w - 20, y + 4, o.close);
  return { x, y, w, h, by: y + 29, footY: o.foot ? y + foot : y + h, a };
}
function kfootHint(c, K, w) { const s = KIT.whyPrev || ''; if (s) drawText(c, fitText(s, w || K.w - 12), K.x + 6, K.footY + round((KIT.bh + 10 - 8) / 2), '#d8d4e6'); }

// ---------------- buttons ----------------
function kbutton(c, x, y, w, label, fn, o = {}) {
  const S = KIT.sizes, h = o.small ? S.sm : S.bh, acc = o.danger ? '#ff6b6b' : KIT.col, tag = 'btn:' + label, off = !!o.off;
  const foc = kfoc(tag), hv = !off && kin(x, y, w, h), lit = hv || foc;
  let bd, fill, lc;
  if (off) { bd = '#2b2740'; fill = '#1d1a29'; lc = '#6a6485'; }
  else if (o.main) { bd = acc; fill = lit ? mix('#3a3350', acc, .2) : mix('#262234', acc, .16); lc = '#fff1a8'; }
  else if (o.on) { bd = acc; fill = '#3d3320'; lc = acc; }
  else if (lit) { bd = acc; fill = '#3a3350'; lc = acc; }
  else { bd = '#4a4460'; fill = '#262234'; lc = o.danger ? '#ff9a8a' : '#fff'; }
  c.fillStyle = bd; c.fillRect(x, y, w, h); c.fillStyle = fill; c.fillRect(x + 1, y + 1, w - 2, h - 2);
  const key = o.main && !off && !KIT.T && w >= textW(label) + 46, room = w - 8 - (key ? 37 : 0);
  const s = textW(label) <= room ? label : o.short && textW(o.short) <= room ? o.short : fitText(label, room);
  textC(c, s, x + (key ? (w - 37) / 2 : w / 2), y + round((h - 8) / 2), lc, 1, drawText);
  // (the keycap is 2 px wider than ENTER's letters, so the R stays inside its border)
  if (key) { const kx = x + w - 37, ky = y + round((h - 10) / 2); c.fillStyle = '#4a4460'; c.fillRect(kx, ky, 33, 10); c.fillStyle = '#1d1a29'; c.fillRect(kx + 1, ky + 1, 31, 8); drawText(c, 'ENTER', kx + 2, ky + 1, '#6a6485'); }
  // (a line under a button only says why it is off)
  if (o.sub && off) drawText(c, fitText(o.sub, w), x + 1, y + h + 3, '#8b8fa3');
  if (foc) kring(c, x, y, w, h);
  if (lit) khint(o.hint); else if (off && inR(x, y, w, h) && o.hint) KIT.why = o.hint;
  if (!off) { if (o.main) KIT.main = fn; khit(x, y, w, h, fn, tag, o.hint); kctrl({ tag, kind: 'btn', x, y, w, h, fn }); }
  return hv;
}
function kclose(c, x, y, fn) {
  if (KIT.T) return false;
  const hv = kin(x, y, 16, 16), tag = 'btn:CLOSE', lit = hv || kfoc(tag);
  c.fillStyle = lit ? KIT.col : '#4a4460'; c.fillRect(x, y, 16, 16); c.fillStyle = lit ? '#3a3350' : '#262234'; c.fillRect(x + 1, y + 1, 14, 14);
  c.fillStyle = lit ? KIT.col : '#d8d4e6'; for (let i = 0; i < 6; i++) { c.fillRect(x + 5 + i, y + 5 + i, 1, 1); c.fillRect(x + 10 - i, y + 5 + i, 1, 1); }
  khit(x, y, 16, 16, fn, tag, 'Close (Esc).'); kctrl({ tag, kind: 'btn', x, y, w: 16, h: 16, fn });
  return hv;
}
// a small arrow button (dir -1 up / left, 1 down / right; vertical when v)
function karrow(c, x, y, w, h, dir, v, fn, tag, off) {
  const hv = !off && kin(x, y, w, h), lit = hv || kfoc(tag);
  c.fillStyle = off ? '#2b2740' : lit ? KIT.col : '#4a4460'; c.fillRect(x, y, w, h); c.fillStyle = off ? '#1d1a29' : lit ? '#3a3350' : '#262234'; c.fillRect(x + 1, y + 1, w - 2, h - 2);
  c.fillStyle = off ? '#4a4460' : lit ? KIT.col : '#fff'; const cx = x + (w >> 1), cy = y + (h >> 1);
  for (let i = 0; i < 3; i++) { const L = 1 + i * 2, d = dir < 0 ? i : 2 - i; if (v) c.fillRect(cx - i, cy - 1 + d, L, 1); else c.fillRect(cx - 1 + d, cy - i, 1, L); }
  if (!off) { khit(x, y, w, h, fn, tag); kctrl({ tag, kind: 'btn', x, y, w, h, fn }); }
  return hv;
}

// ---------------- fields ----------------
function kfield(c, x, y, w, key, label, ph, o = {}) {
  const S = KIT.sizes, fh = S.fh, col = KIT.col, f = UI.focus === key, by = y + 10, now = performance.now(), tag = 'field:' + key;
  const secret = !!o.secret, shown = secret && (o.toggle ? !!o.show : !!KIT.reveal[key]), sw = secret ? 30 : 0;
  drawText(c, label, x, y, '#b9bdd0');
  if (secret && KIT.caps && f) { const cw = textW('CAPS') + 6, cx = x + w - cw; c.fillStyle = '#ffb347'; c.fillRect(cx, y - 1, cw, 9); drawText(c, 'CAPS', cx + 3, y, INK); }
  const e = KIT.err[key], shake = e && now - e < 240 ? round(sin((now - e) / 240 * PI * 6) * 2) : 0, bx = x + shake, hv = kin(x, by, w, fh);
  if (f) { c.fillStyle = rgbaHex(col, .35); c.fillRect(bx - 1, by - 1, w + 2, fh + 2); }
  c.fillStyle = e ? '#ff6b6b' : f ? col : hv ? '#8c86a8' : '#4a4460'; c.fillRect(bx, by, w, fh); c.fillStyle = INK; c.fillRect(bx + 1, by + 1, w - 2, fh - 2);
  const room = w - 8 - sw - 2, raw = String(FORM[key] || '');
  let v = secret && !shown ? '*'.repeat(min(raw.length, floor(room / 6))) : raw;
  if (!(secret && !shown) && textW(v) > room) { let i = v.length - 1; while (i > 0 && textW(v.slice(i - 1)) <= room) i--; v = v.slice(i); }
  const ty = by + round((fh - 8) / 2);
  if (v) drawText(c, v, bx + 4, ty, '#fff'); else if (!f) drawText(c, fitText(ph || '', room), bx + 4, ty, '#6a6485');
  if (f && (now / 400 | 0) & 1) { c.fillStyle = col; c.fillRect(bx + 5 + (v ? textW(v) : -1), ty - 1, 1, 9); }
  const fw = w - sw - (secret && KIT.T ? 4 : 0);
  khit(x, by, fw, fh, () => { UI.focus = key; KIT.focus = tag; sfx('ui'); }, tag, o.hint);
  if (secret) {
    const sx = x + w - sw - 1, st = shown ? 'HIDE' : 'SHOW', sh = kin(sx, by + 1, sw, fh - 2);
    c.fillStyle = sh ? '#3a3350' : '#1d1a29'; c.fillRect(sx, by + 1, sw, fh - 2); c.fillStyle = '#2b2740'; c.fillRect(sx, by + 1, 1, fh - 2);
    textC(c, st, sx + sw / 2, ty, sh ? col : '#8b8fa3', 1, drawText);
    khit(sx, by, sw + 1, fh, () => { if (o.toggle) o.toggle(); else KIT.reveal[key] = !KIT.reveal[key]; UI.focus = key; KIT.focus = tag; sfx('ui'); }, 'btn:SHOW', shown ? 'Hide the password.' : 'Show the password as you type it.');
  }
  if (hv || f) khint(o.hint);
  KIT.fields.push(key); kctrl({ tag, kind: 'field', key, x, y: by, w, h: fh });
  let hgt = KIT.T ? 34 : 28;
  if (o.check) {
    const r = o.check(), ly = by + fh + 2;
    if (r) {
      let lx = x;
      if (r.pips) { const [n, of] = r.pips, pc = n >= of ? '#7ddc6f' : '#ffb347'; for (let i = 0; i < of; i++) { c.fillStyle = i < n ? pc : '#2b2740'; c.fillRect(lx + i * 5, ly + 2, 4, 4); } lx += of * 5 + 4; }
      if (r.text) drawText(c, fitText(r.text, w - (lx - x)), lx, ly, KIT_MSG[r.kind] || '#8b8fa3');
    }
    hgt += 12;
  }
  return hgt;
}

// ---------------- choosers, segments, tabs ----------------
function kchooser(c, x, y, w, label, names, key, descs) {
  const S = KIT.sizes, aw = S.aw, ah = S.ah, n = names.length, tag = 'choose:' + key, foc = kfoc(tag), lw = 46, bx = x + lw, bw = w - lw;
  const left = () => { FORM[key] = (FORM[key] + n - 1) % n; sfx('ui'); }, right = () => { FORM[key] = (FORM[key] + 1) % n; sfx('ui'); };
  drawText(c, label, x, y + round((ah - 8) / 2), foc ? KIT.col : '#b9bdd0');
  karrow(c, bx, y, aw, ah, -1, false, left, 'btn:' + label + ' <');
  textC(c, fitText(names[FORM[key]], bw - aw * 2 - 6), bx + bw / 2, y + round((ah - 8) / 2), KIT.col, 1, drawText);
  karrow(c, bx + bw - aw, y, aw, ah, 1, false, right, 'btn:' + label + ' >');
  if (foc) kring(c, bx, y, bw, ah);
  kctrl({ tag, kind: 'choose', x: bx, y, w: bw, h: ah, left, right });
  // the description under it wraps onto a second line rather than lose its end
  let dl = 0; if (descs) { const L = wrapC(descs[FORM[key]], bw); dl = min(2, L.length); for (let i = 0; i < dl; i++) drawText(c, i === 1 && L.length > 2 ? fitText(L.slice(1).join(' '), bw) : L[i], bx, y + ah + 3 + i * 9, '#8b8fa3'); }
  return ah + (descs ? 5 + dl * 9 : 4);
}
function ksegment(c, x, y, w, opts, cur, set, o = {}) {
  const S = KIT.sizes, h = S.sm, n = opts.length, gap = 2, cw = floor((w - gap * (n - 1)) / n), i0 = opts.indexOf(cur), tag = 'seg:' + opts.join('|'), foc = kfoc(tag);
  opts.forEach((op, i) => {
    const cx = x + i * (cw + gap), on = op === cur, hv = kin(cx, y, cw, h);
    c.fillStyle = on ? KIT.col : hv ? '#8c86a8' : '#4a4460'; c.fillRect(cx, y, cw, h); c.fillStyle = '#262234'; c.fillRect(cx + 1, y + 1, cw - 2, h - 2);
    if (on) { c.fillStyle = rgbaHex(KIT.col, .22); c.fillRect(cx + 1, y + 1, cw - 2, h - 2); }
    const ic = o.icons && o.icons[i], room = cw - 6 - (ic ? 10 : 0), s = fitText(op, room), tw = textW(s) + (ic ? 10 : 0), tx = cx + round((cw - tw) / 2), ty = y + round((h - 8) / 2);
    if (ic) ic(c, tx, ty);
    drawText(c, s, tx + (ic ? 10 : 0), ty, on ? '#fff' : hv ? KIT.col : '#b9bdd0');
    khit(cx, y, cw, h, () => { set(op); sfx('ui'); }, 'btn:' + op, o.hints && o.hints[i]);
    if (hv && o.hints) khint(o.hints[i]);
  });
  if (foc) kring(c, x, y, w, h);
  kctrl({ tag, kind: 'seg', x, y, w, h, left: () => { set(opts[(i0 + n - 1) % n]); sfx('ui'); }, right: () => { set(opts[(i0 + 1) % n]); sfx('ui'); } });
  return h + 4;
}
function ktabs(c, x, y, w, names, cur, set, o = {}) {
  const S = KIT.sizes, th = S.tab, n = names.length, i0 = names.indexOf(cur), tag = 'tabs:' + names.join('|'), foc = kfoc(tag);
  // lay the cells out in rows: a forced grid (o.cols), or as many as fit in each row, stretched to fill it
  const rows = []; if (o.cols) for (let i = 0; i < n; i += o.cols) rows.push(names.slice(i, i + o.cols));
  else { let r = [], rw = 0; for (const nm of names) { const cw = textW(nm) + 12; if (r.length && rw + cw > w) { rows.push(r); r = []; rw = 0; } r.push(nm); rw += cw; } if (r.length) rows.push(r); }
  rows.forEach((r, ri) => {
    const ry = y + ri * (th + 2), nat = r.reduce((s, nm) => s + textW(nm) + 12, 0), extra = o.cols ? 0 : max(0, w - nat); let cx = x;
    r.forEach((nm, ci) => {
      const cw = o.cols ? floor(w / o.cols) : textW(nm) + 12 + floor(extra / r.length) + (ci === r.length - 1 ? extra % r.length : 0), on = nm === cur, hv = kin(cx, ry, cw, th);
      c.fillStyle = on ? '#2b2740' : hv ? '#262234' : '#1d1a29'; c.fillRect(cx, ry, cw - 1, th);
      textC(c, fitText(nm, cw - 4), cx + cw / 2, ry + round((th - 8) / 2), on ? KIT.col : hv ? '#fff' : '#8b8fa3', 1, drawText);
      c.fillStyle = on ? KIT.col : '#2b2740'; c.fillRect(cx, ry + th - (on ? 2 : 1), cw - 1, on ? 2 : 1);
      khit(cx, ry, cw - 1, th, () => { set(nm); sfx('ui'); }, 'tab:' + nm);
      cx += cw;
    });
  });
  const h = rows.length * (th + 2);
  if (foc) kring(c, x, y, w, h - 2);
  kctrl({ tag, kind: 'tabs', x, y, w, h, left: () => { set(names[(i0 + n - 1) % n]); sfx('ui'); }, right: () => { set(names[(i0 + 1) % n]); sfx('ui'); } });
  return h + 2;
}

// ---------------- rows, lists, scrolling ----------------
function krow(c, x, y, w, h, fn, o = {}) {
  const tag = o.tag || 'row:' + x + ':' + y, hv = kin(x, y, w, h), foc = kfoc(tag);
  c.fillStyle = o.sel ? '#3d3320' : hv || foc ? '#2b2740' : '#221e30'; c.fillRect(x, y, w, h);
  if (o.sel) { c.fillStyle = KIT.col; c.fillRect(x, y, 2, h); }
  if (foc) kring(c, x, y, w, h);
  if (hv) khint(o.hint);
  khit(x, y, w, h, fn, tag, o.hint); kctrl({ tag, kind: 'row', x, y, w, h, fn });
  return hv;
}
function klist(c, B, n, rowH, drawRow) {
  const S = KIT.sizes, over = n * rowH > B.h, ch = over ? S.sm + 4 : 0, vis = max(1, floor((B.h - ch) / rowH));
  UI.scroll = clamp(UI.scroll | 0, 0, max(0, n - vis)); const first = UI.scroll;
  for (let i = 0; i < vis; i++) { const k = i + first; if (k >= n) break; drawRow(c, k, B.x, B.y + i * rowH, B.w, rowH - 2); }
  const by = d => { UI.scroll = clamp(UI.scroll + d, 0, max(0, n - vis)); };
  if (over) {
    const yy = B.y + B.h - S.sm, aw = KIT.T ? 30 : 20;
    drawText(c, `${first + 1}-${min(n, first + vis)} of ${n}`, B.x + 2, yy + round((S.sm - 8) / 2), '#8b8fa3');
    karrow(c, B.x + B.w - aw * 2 - S.gap, yy, aw, S.sm, -1, true, () => { by(-1); sfx('ui'); }, 'btn:LIST UP', first <= 0);
    karrow(c, B.x + B.w - aw, yy, aw, S.sm, 1, true, () => { by(1); sfx('ui'); }, 'btn:LIST DOWN', first + vis >= n);
  }
  KIT.scrollers.push({ x: B.x, y: B.y, w: B.w, h: B.h, by });
  return { vis, first };
}
function kscroll(c, B, contentH, id) {
  const most = max(0, contentH - B.h); KIT.sy[id] = clamp(KIT.sy[id] || 0, 0, most);
  c.save(); c.beginPath(); c.rect(B.x, B.y, B.w, B.h); c.clip(); HIT_CLIP = { y0: B.y, y1: B.y + B.h };
  KIT.scrollNow = { B, contentH, id, most, n: KIT.ctrls.length };
  if (most > 0) KIT.scrollers.push({ x: B.x, y: B.y, w: B.w, h: B.h, by: d => { KIT.sy[id] = clamp((KIT.sy[id] || 0) + d * 12, 0, most); } });
  return -KIT.sy[id];
}
function kscrollEnd(c) {
  c.restore(); HIT_CLIP = null; const S = KIT.scrollNow; KIT.scrollNow = null; if (!S) return;
  const { B, contentH, id, most } = S;
  if (most > 0) { const th = max(10, round(B.h * B.h / contentH)), ty = B.y + round((B.h - th) * KIT.sy[id] / most); c.fillStyle = '#2b2740'; c.fillRect(B.x + B.w - 2, B.y, 2, B.h); c.fillStyle = KIT.col; c.fillRect(B.x + B.w - 2, ty, 2, th); }
  // the field or control in hand is kept in view (it moves next frame)
  for (let i = S.n; i < KIT.ctrls.length; i++) {
    const q = KIT.ctrls[i]; if (!(q.kind === 'field' && UI.focus === q.key) && !(KIT.kbd && KIT.focus === q.tag)) continue;
    if (q.y < B.y) KIT.sy[id] = clamp(KIT.sy[id] - (B.y - q.y) - 12, 0, most); else if (q.y + q.h > B.y + B.h) KIT.sy[id] = clamp(KIT.sy[id] + (q.y + q.h - B.y - B.h) + 4, 0, most);
  }
}

// ---------------- the look of a Waker ----------------
function khead(c, skin, hat, x, y, sc) {
  const S = SK[clamp(skin | 0, 0, SK.length - 1)] || SK[0];
  c.save(); c.translate(x - S.hx * sc, y - S.hy * sc); c.scale(sc, sc); c.drawImage(S.head, S.hx, S.hy);
  if (hat) { c.translate(0, S.hy + 9); drawHat(c, hat); }   // (the hat sits on the head, not two pixels above it)
  c.restore();
}
function klook(c, x, y, w, o = {}) {
  const S = KIT.sizes, tw = S.tileW, th = S.tileH, gap = S.gap; let yy = y;
  if (o.preview) {
    const ph = 50, cx = x + round(w / 2);
    c.drawImage(kitGlow(28, KIT.col, .3), cx - 28, yy + ph - 40);
    c.fillStyle = '#2b2740'; c.fillRect(cx - 18, yy + ph - 6, 36, 4); c.fillStyle = '#4a4460'; c.fillRect(cx - 16, yy + ph - 7, 32, 1); c.fillStyle = '#1d1a29'; c.fillRect(cx - 14, yy + ph - 2, 28, 2);
    khead(c, FORM.skin, FORM.hat, cx - 10, yy + ph - 28, 3);
    yy += ph + 6;
  }
  drawText(c, 'LOOK', x, yy + round((th - 8) / 2), '#b9bdd0');
  for (let i = 0; i < 4; i++) {
    const bx = x + 46 + i * (tw + gap), on = FORM.skin === i, tag = 'btn:LOOK ' + (i + 1), hv = kin(bx, yy, tw, th), lit = hv || kfoc(tag);
    c.fillStyle = on ? KIT.col : lit ? '#8c86a8' : '#4a4460'; c.fillRect(bx, yy, tw, th); c.fillStyle = on ? '#3d3320' : '#262234'; c.fillRect(bx + 1, yy + 1, tw - 2, th - 2);
    const hs = KIT.T ? 3 : 2; khead(c, i, 0, bx + round((tw - 7 * hs) / 2), yy + 2, hs);
    c.fillStyle = SKINS[i][4]; c.fillRect(bx + 3, yy + th - 5, (tw >> 1) - 3, 2); c.fillStyle = SKINS[i][0]; c.fillRect(bx + (tw >> 1), yy + th - 5, (tw >> 1) - 3, 2);
    if (kfoc(tag)) kring(c, bx, yy, tw, th);
    const fn = () => { FORM.skin = i; sfx('ui'); };
    khit(bx, yy, tw, th, fn, tag, 'How your Waker looks.'); kctrl({ tag, kind: 'btn', x: bx, y: yy, w: tw, h: th, fn });
  }
  yy += th + gap + 2;
  if (o.hat !== false) yy += kchooser(c, x, yy, min(w, 46 + 4 * (tw + gap) - gap), 'HAT', HAT_N, 'hat');
  return yy - y;
}

// ---------------- messages, questions, toasts ----------------
function kmsg(c, x, y, w, m) {
  if (!m || !m.text) return 0; const col = KIT_MSG[m.kind] || KIT_MSG.info, L = wrapC(m.text, w - 8);
  c.fillStyle = col; c.fillRect(x, y + 2, 4, 4); L.forEach((l, i) => drawText(c, l, x + 8, y + i * 9, col));
  return L.length * 9;
}
function kconfirm(c, F, text, yes, no) {
  const S = KIT.sizes, bw = KIT.T ? 44 : 36, L = wrapC(text, F.w - bw * 2 - S.gap - 12), h = max(S.bh, L.length * 9);
  L.forEach((l, i) => drawText(c, l, F.x + 6, F.y + round((h - L.length * 9) / 2) + i * 9, '#ff6b6b'));
  const by = F.y + round((h - S.bh) / 2);
  kbutton(c, F.x + F.w - bw * 2 - S.gap - 4, by, bw, 'YES', yes, { danger: true, hint: 'Yes: this cannot be undone.' });
  kbutton(c, F.x + F.w - bw - 4, by, bw, 'NO', no, { hint: 'No: keep it.' });
  return h;
}
function kitToast(text, kind = 'ok') { KIT.toast = { text: String(text), kind, t0: performance.now() }; }
function kitDrawToast(c) {
  const T = KIT.toast; if (!T) return; const age = performance.now() - T.t0; if (age > 3400) { KIT.toast = null; return; }
  const col = KIT_MSG[T.kind] || KIT_MSG.ok, s = fitText(T.text, VS.uw - 28), w = textW(s) + 16, x = round((VS.uw - w) / 2), y = 4;
  c.globalAlpha = age < 3000 ? 1 : 1 - (age - 3000) / 400;
  c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, 18); c.fillStyle = 'rgba(22,17,34,.94)'; c.fillRect(x, y, w, 16); c.fillStyle = col; c.fillRect(x, y, w, 2);
  drawText(c, s, x + 8, y + 6, '#fff1a8'); c.globalAlpha = 1;
}

// ---------------- each frame ----------------
function kitBegin() {
  const now = performance.now();
  KIT.fields = []; KIT.main = null; KIT.endMain = null; KIT.ctrls = []; KIT.scrollers = []; KIT.hint = ''; KIT.why = ''; HIT_CLIP = null; KIT.col = '#ffd35a';
  if (KIT.mx !== mouse.x || KIT.my !== mouse.y) { KIT.kbd = false; KIT.mx = mouse.x; KIT.my = mouse.y; }
  if (UI.open !== 'pause') VEIL.frozen = false;
  const key = G.state + '|' + (UI.open || '');
  if (key !== KIT.enter.key) {
    const [ws, wo] = KIT.enter.key.split('|'), was = ws === 'play' ? wo : ws, id = kitPlace();
    if (ws !== 'play' && G.state === 'play') KIT.toast = null; // a sign-in's welcome does not follow you into play
    KIT.enter.key = key; KIT.enter.t0 = now; KIT.enter.view = ''; KIT.focus = null; KIT.kbd = false; KIT.err = {}; KIT.tapHint = null;
    if (was && MENUS[was] && MENUS[was].leave) MENUS[was].leave();
    if (id && MENUS[id]) { if (MENUS[id].enter) MENUS[id].enter(); if (G.state !== 'play' && MENUS[id].sound) sfx(MENUS[id].sound); }
  }
}
function kitSaid() { const now = performance.now(), tap = KIT.tapHint && now - KIT.tapHint.t < 2500 ? KIT.tapHint.s : ''; return KIT.why || tap || ''; }
function kitEnd(c) {
  c.globalAlpha = 1; if (HIT_CLIP) HIT_CLIP = null; if (KIT.T) kitUnpad();
  const st = G.state, M = MENUS[st];
  // the line at the bottom says only why a button is off, what a setting does, or what a tap just did (no idle words)
  if (st !== 'play' && st !== 'title' && M) { const s = kitSaid(); if (s) textC(c, fitText(s, VS.uw - 12), VS.uw / 2, round(VS.uh - 15), '#d8d4e6', 1, textO); }
  kitDrawToast(c);
  KIT.fieldsPrev = KIT.fields; KIT.mainPrev = KIT.main; KIT.ctrlsPrev = KIT.ctrls; KIT.scrollersPrev = KIT.scrollers; KIT.hintPrev = KIT.hint; KIT.whyPrev = KIT.why;
}
// typing reached a field: its error mark goes, and the place may clear its messages
function kitTyped(key) { if (key) KIT.err[key] = 0; const M = MENUS[G.state]; if (M && M.typed) M.typed(key); }
// the field after (or before) the one in hand, or null past the last one
function kitNextField(back) {
  const L = KIT.fieldsPrev; if (!L.length) return null; const i = L.indexOf(UI.focus);
  if (back) return L[i <= 0 ? L.length - 1 : i - 1];
  return i < 0 ? L[0] : i + 1 < L.length ? L[i + 1] : null;
}
function kitNav(dir, from) {
  const L = KIT.ctrlsPrev; if (!L.length) return;
  let i = L.findIndex(q => from ? q.tag === from : q.tag === KIT.focus || (q.kind === 'field' && q.key === UI.focus));
  i = i < 0 ? (dir > 0 ? 0 : L.length - 1) : (i + dir + L.length) % L.length;
  const q = L[i]; KIT.focus = q.tag; KIT.kbd = true; UI.focus = q.kind === 'field' ? q.key : null; sfx('ui');
}
function menuBack() {
  const st = G.state, M = MENUS[st]; UI.focus = null;
  if (M && M.back) { M.back(); return; }
  if (st === 'brlobby') { brLeave(); sfx('ui'); return; }
  if (st === 'brform' && BR.wild) { BR.wild = false; sfx('ui'); return; }
  if (st === 'join' && COOP.long) { COOP.long = false; coopLeave(); COOP.err = ''; sfx('ui'); return; }
  if (st === 'title' || st === 'play' || st === 'intro' || st === 'loading') return;
  const to = MENU_PARENT[st] || 'title';
  if (st === 'wcopy') COOP.wcode = ''; if (st === 'wpaste' || st === 'wcopy') COOP.err = ''; if (st === 'worlds') G.worldNote = '';
  G.state = to; if (to === 'title' && COOP.role) coopLeave(); sfx('ui');
}
// keys of the kit: runs first in the keydown handler; true means the key was used
function kitKey(e) {
  KIT.caps = !!(e.getModifierState && e.getModifierState('CapsLock'));
  const k = e.code, st = G.state, use = () => { e.preventDefault(); return true; };
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (st === 'title') { if (k === 'KeyA' && !e.repeat && !UI.focus && ACCOUNT.active) { accountsOpen(); return use(); } return false; }
  if (st === 'intro' || st === 'loading') return false;
  if (st === 'play') {
    // the arenas' dead and results cards are drawn by the HUD with no panel open: Enter presses their first button
    if ((k === 'Enter' || k === 'NumpadEnter') && !UI.open && !G.dialog && KIT.endMain) { KIT.endMain(); return use(); }
    const M = MENUS[UI.open]; if (!UI.open || !M || G.dialog) return false;
    if ((k === 'Enter' || k === 'NumpadEnter') && KIT.mainPrev) { KIT.mainPrev(); return use(); }
    if (M.keys && k !== 'Escape' && k !== 'Tab' && M.keys(e)) return use();
    // Up and Down scroll the panel's list (the first list or scrolling box it drew)
    if ((k === 'ArrowUp' || k === 'ArrowDown') && KIT.scrollersPrev.length) { KIT.scrollersPrev[0].by(k === 'ArrowUp' ? -1 : 1); return use(); }
    return false;
  }
  const M = MENUS[st];
  if ((k === 'ArrowUp' || k === 'ArrowDown') && M && M.keys && M.keys(e)) return use();
  if (UI.focus) {
    if (k === 'Enter' || k === 'NumpadEnter') { const go = KIT.mainPrev; UI.focus = null; if (go) go(); return use(); }
    if (k === 'Tab') { const from = 'field:' + UI.focus, nx = kitNextField(e.shiftKey); if (nx) { UI.focus = nx; KIT.focus = 'field:' + nx; } else kitNav(1, from); return use(); }
    if (k === 'Escape') { UI.focus = null; return use(); }
    return false;
  }
  if (e.repeat && !k.startsWith('Arrow')) return false;
  if (k === 'Tab') { kitNav(e.shiftKey ? -1 : 1); return use(); }
  if (!M) { if (k === 'Escape') { menuBack(); return use(); } return false; }
  if (k === 'ArrowUp' || k === 'ArrowDown') { kitNav(k === 'ArrowUp' ? -1 : 1); return use(); }
  if (k === 'ArrowLeft' || k === 'ArrowRight') { const q = KIT.kbd && KIT.ctrlsPrev.find(q => q.tag === KIT.focus); if (q && (k === 'ArrowLeft' ? q.left : q.right)) { (k === 'ArrowLeft' ? q.left : q.right)(); return use(); } if (M.keys && M.keys(e)) return use(); return false; }
  if (k === 'Enter' || k === 'NumpadEnter' || (k === 'Space' && KIT.kbd && KIT.focus)) {
    const q = KIT.kbd && KIT.ctrlsPrev.find(q => q.tag === KIT.focus && q.fn);
    if (q) { q.fn(); return use(); } if (KIT.mainPrev) { KIT.mainPrev(); return use(); } return false;
  }
  if (k === 'Escape') { menuBack(); return use(); }
  if (M.keys && M.keys(e)) return use();
  return false;
}
