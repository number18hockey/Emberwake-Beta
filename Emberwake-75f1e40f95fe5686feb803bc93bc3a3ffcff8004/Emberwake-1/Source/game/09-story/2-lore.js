// ============================================================
//  Lore. All of it is optional: echo stones standing at the roadside,
//  a bestiary that fills in as you hunt, journal pages for the new worlds.
//  Nothing in the game needs you to read any of it. The game is the
//  digging, building and fighting; this is just what the world remembers.
// ============================================================
const ECHOES = [
  [ // the Waking Lands
    ['The Ring', 'Before it broke, the ring in the sky turned once a day and the light poured off its rim. The old smiths called it the Dawnforge because it made mornings the way a forge makes nails: one at a time, on purpose.'],
    ['Hands', 'The first Wakers were the Dawnforge\'s own smiths. When their work was done they asked to be ash, and the ring kept the ash warm. That is why a Waker always wakes near a fire.'],
    ['Hearthhold', 'The village is older than its walls. It began as a single campfire someone refused to let go out, and everyone who passed added a log, then a roof, then a reason to stay.'],
    ['Three Embers', 'Three embers fell when the ring cracked. Not because they were loose. Because they were the parts that remembered how to close the gate under the world.'],
    ['The Hollow', 'The Hollow is not a creature. It is what is left in a place when the heat goes out of it. Husks and wretches are only the shapes it borrows.'],
    ['Glass Mountains', 'The reach was a lake once. When the ring broke, a shard fell into it and the water froze into glass in a single afternoon. The fish are still in there, if you look.'],
    ['The Keeper', 'The Keeper was built to tend the hearths under the land, and it never stopped. It does not know the forge it worked for has been gone for a thousand years.'],
    ['Below and Above', 'The old maps had three more floors to the world: one below that burned, one below that grew, and one above that shone. The maps also had dragons, so nobody believed them.']
  ],
  [ // Cinderdeep
    ['The Furnace', 'Cinderdeep is the bottom of the Dawnforge\'s chimney. Everything the ring ever burned fell down here and kept burning.'],
    ['The Kilnworks', 'The smiths had a second village down here, for the work too hot to do in daylight. Their kilns still glow. Their doors still open from the inside.'],
    ['Cinderite', 'Cinderite is ordinary ore that has been molten for so long it forgot how to be solid all the way through. Hammer it fast. It remembers.'],
    ['The Tyrant', 'The Tyrant was a bellows once: a great walking furnace that kept the deep heat moving. With no one to give it orders it decided the heat was its own.'],
    ['Eruptions', 'Every so often the deep remembers the ring and tries to send it more fire. None of it gets that far. It comes back down on whoever is walking.'],
    ['Wax and Moons', 'The red moon over the Waking Lands is Cinderdeep\'s light seen from above, through the cracks. What walks under it walks up from here.']
  ],
  [ // the Rootdark
    ['Where Roots Drink', 'Every tree on the surface has a root that goes all the way down to the Rootdark. The trees are fine. It is the roots that are strange.'],
    ['Glowcaps', 'The glowcaps make their own light because nothing else down here will. They grow toward anything warm, which is why they grow toward you.'],
    ['The Gardener', 'The Rootmother was planted, not born. Someone wanted the world\'s roots kept, and gave the job to something that would never get bored of it.'],
    ['Hounds', 'Gloam hounds hunt by heat and run in threes. If you can see one, the other two can already see you.'],
    ['Lantern Moths', 'The moths carry wax in their wings and burn it slowly, all their lives. Lamplighters on the surface used to trade for it. Wick still has a candle of it, somewhere.'],
    ['The Taproots', 'At the very bottom the roots braid into one root as wide as a hill. Something is moving inside it, slowly, upward.']
  ],
  [ // the Glass Expanse
    ['The Broken Sky', 'When the ring cracked, the sky under it cracked too. These islands are the pieces that did not fall. They are still deciding whether to.'],
    ['The Hush', 'Out where the islands thin, there is no wind and no sound. Shout and your voice just stops a little way from your mouth.'],
    ['Starfall', 'The stars that fall on the Waking Lands are not stars. They are flakes of this place, shaken loose, still glowing on the way down.'],
    ['The Matriarch', 'The Matriarch was the ring\'s lens: the piece that took the forge\'s fire and made it into light. Without the ring she makes it into other things.'],
    ['Prismglass', 'Prismglass is sky that set hard. It cuts because it still thinks it is a sunbeam.'],
    ['The Void', 'There is nothing under the islands. Falling into it is not like falling. It is like being put back where you were, minus something.']
  ]
];
const LORE_N = ECHOES.map(a => a.length);
function echoInfo(id) { const d = floor(id / 100), i = id % 100; return ECHOES[d] && ECHOES[d][i]; }
function readEcho(id) {
  const E = echoInfo(id); if (!E) return; closeUI(); UI.open = 'echo'; UI.echo = id; sfx('shrine', 0);
  if (!G.echoes.has(id)) { G.echoes.add(id); G.dirty = true; burst(G.p.x + 3, G.p.y + 4, 14, ['#8ff5e6', '#ffffff', '#b49cff'], 1.4, 30, { glow: 1, g: -.02 }); }
}
// THE ECHO STONE: what the stone remembers, with rings going out from it; it closes by its close box, CLOSE or Escape
function drawEchoUI(c) {
  const E = echoInfo(UI.echo); if (!E) { closeUI(); return; } const S = KIT.sizes, w0 = min(320, VS.uw - (menuMode() === 'narrow' ? 12 : 24)), lines = wrapC(E[1], w0 - 24);
  const F = menuFrame('echo', 320, 29 + 14 + lines.length * 10 + 6 + S.bh + 10), K = pcard(c, 'echo', 0, 0, 'ECHO STONE', { frame: F, foot: true }), x = K.x + 12;
  const B = { x: K.x + 1, y: K.by, w: K.w - 2, h: K.footY - 2 - K.by }, need = 14 + lines.length * 10, sc = need > B.h, dy = sc ? kscroll(c, B, need, 'echo') : 0;
  textC(c, E[0].toUpperCase(), K.x + K.w / 2, K.by + dy, KIT.col, 1, textO); lines.forEach((l, k) => drawText(c, l, x, K.by + 14 + dy + k * 10, '#e8e4f4'));
  if (sc) kscrollEnd(c);
  const bw = KIT.T ? 72 : 60; kbutton(c, K.x + K.w - 8 - bw, K.footY + 5, bw, 'CLOSE', pclose, { main: true, hint: 'Close the stone.' });
  pfoot(c, K, '', K.w - bw - 24);
}
// ---------------- the bestiary: where things live and when they come out ----------------
const BEASTS = {
  ashhare: ['Ash Hare', 'Waking Lands: moor and ash', 'Eats ash. Tastes of it.'], thornback: ['Thornback', 'Waking Lands: thornwood', 'Charges anything that moves. Including other thornbacks.'],
  mote: ['Ember Mote', 'Waking Lands: everywhere at night', 'A spark of the Hollow looking for something warm to put out.'], husk: ['Husk', 'Waking Lands: open ground, at night', 'An empty shape the Hollow wears to walk.'],
  bat: ['Flit', 'Caves', 'Lives on the warmth of sleeping things.'], mite: ['Glass Mite', 'The reach, and caves under it', 'Chews glass, spits sand.'], glassfly: ['Glassfly', 'The reach', 'Shatters when it dies. Do not be close.'],
  rustback: ['Rustback', 'Rustfall and the scoria', 'Its shell is the rust of a thousand old tools.'], lurker: ['Bog Lurker', 'Fen water; Rootdark mire water', 'Waits under the surface. It is patient.'], serpent: ['Dune Serpent', 'The dunes', 'Swims through sand as if it were water.'],
  crawler: ['Ceiling Crawler', 'Cave ceilings', 'Drops on whatever walks underneath.'], golem: ['Stone Golem', 'Deep caverns', 'A wall that decided to stand up.'], skyray: ['Sky Ray', 'High above the land', 'Glides for days without landing.'],
  cinderling: ['Cinderling', 'The Deep; Cinderdeep tunnels', 'A coal that learned to walk.'], hollow: ['Hollowborn', 'The Deep and the Kilnworks', 'A Waker the Hollow got to first.'],
  slagling: ['Slagling', 'Cinderdeep: the cinder wastes', 'Hops because the ground is too hot to stand on.'], cinderimp: ['Cinder Imp', 'Cinderdeep: anywhere in the open', 'Throws fire because it has nothing else.'],
  basaltbrute: ['Basalt Brute', 'Cinderdeep: the basalt steps, and deep', 'Slow, heavy, and the ground shakes when it agrees with itself.'], ashwraith: ['Ash Wraith', 'Cinderdeep, and the Waking Lands during ASHFALL', 'Fades out, comes back behind you.'],
  cindereel: ['Cinder Eel', 'Cinderdeep: only in lava pools', 'Leaps at shadows on the surface of the lava.'],
  sporeling: ['Sporeling', 'Rootdark: the glowcap groves', 'Puffs spores when cornered. Do not stand in the cloud.'], rootlasher: ['Root Lasher', 'Rootdark: the rootwood, and under it', 'Rooted. Patient. Long reach.'],
  gloamhound: ['Gloam Hound', 'Rootdark: the rootwood, in packs', 'They crouch before they pounce. That is your only warning.'], lanternmoth: ['Lantern Moth', 'Rootdark: everywhere', 'Drawn to your light. Dives when it is close.'],
  mirestalker: ['Mire Stalker', 'Rootdark: the gloam mire', 'Nearly invisible until it is close enough to swing.'],
  shardling: ['Shardling', 'Glass Expanse: the shard isles', 'A piece of sky that hops.'], mirrorwisp: ['Mirror Wisp', 'Glass Expanse: everywhere', 'Blinks beside you, then fires three ways.'],
  voidray: ['Void Ray', 'Glass Expanse: open air over the void', 'Circles wide, then swoops.'], glasssentinel: ['Glass Sentinel', 'Glass Expanse: the prism fields', 'Aims for a long time. Then it does not miss. Move.'],
  moonwretch: ['Moonwretch', 'Waking Lands: only under the EMBER MOON', 'Fast and leaping. Drips moon wax.'], starling: ['Starling', 'Waking Lands: only during STARFALL', 'Swarms in threes, darts when it flashes.'],
  umbralknight: ['Umbral Knight', 'Waking Lands: only during an ECLIPSE', 'Its shield faces you. Wait for the swing, then strike its back.'], fogwalker: ['Fogwalker', 'Waking Lands: moor, fen, thorn and reach, only in THE LONG FOG', 'You will not see it until it is close.'],
  boss: ['The Ashen Warden', 'The shrine in the crater', 'Kept the first ember.'], keeper: ['The Keeper', 'Under the forge', 'Still tending hearths no one needs.'],
  slagtyrant: ['The Slag Tyrant', "Cinderdeep: the Tyrant's Caldera (wake it at the altar)", 'Charge it into the caldera wall. It staggers.'],
  rootmother: ['The Rootmother', 'Rootdark: the Heartroot Hollow (wake it at the altar)', 'Strike the tendrils. When she blooms, strike her.'],
  matriarch: ['The Prism Matriarch', "Glass Expanse: the Matriarch's Spire (wake it at the altar)", 'Step out of the red line before it turns white.'],
  shepherd: ['The Pale Shepherd', 'Waking Lands: late in an EMBER MOON night', 'Leaves at dawn. Its bell calls the Ember Moon.']
};
const BEAST_ORDER = Object.keys(BEASTS);
function beastKill(type) { if (!BEASTS[type]) return; G.beasts[type] = (G.beasts[type] || 0) + 1; G.dirty = true; }
// ---------------- journal pages and leads for the new worlds ----------------
Object.assign(JOURNAL, {
  dim1: ['Cinderdeep', 'Behind the Furnace Gate, the Kiln Heart opens onto a world of slag and lava under everything. Cinderite grows in its rock; a Slagforge (built at an iron anvil) can work it. Somewhere off from the rift, a guardian sleeps in a caldera. Touch the rift to go home.'],
  dim2: ['The Rootdark', 'Dark, wet and lit by fungus. Gloom ore hides deep under the rootwood. Spore dust, from sporelings and glowcaps, folds it into gloomsteel. The Rootmother keeps the Heartroot Hollow.'],
  dim3: ['The Glass Expanse', 'Islands of pale stone over nothing at all. Glass walkways run between them; updrafts lift you to the high islands. Fall, and the void throws you back, bruised. The Prism Matriarch keeps her spire.'],
  tyrant: ['The Slag Tyrant', 'The Tyrant is down. Its core still beats in your pack. With wax from the Ember Moon and cinderite bars, a Slagforge can make it into a Rootward Key.'],
  rootmother: ['The Rootmother', 'The Rootmother is down, and left a seed. A Prism Key needs it, along with starshards from a Starfall and umbral shards from an Eclipse. Eclipses can come now.'],
  matriarch: ['The Prism Matriarch', 'The Matriarch is down. Her heart can become the Starsplitter, or be drunk to make you harder to kill. Every world is yours to walk.'],
  shepherd: ['The Pale Shepherd', 'It walked the Ember Moon. Now its bell is yours: ring it at night and the moon turns red for you.'],
  skyevents: ['The Sky\'s Moods', 'The sky over the Waking Lands changes. Some things only walk when it does: wretches under the Ember Moon, starlings in a Starfall, knights in an Eclipse, wraiths in the Ashfall, walkers in the Long Fog. Each leaves something you can get no other way.']
});
Object.assign(LEADS, {
  kiln: { title: 'The Kiln Heart', text: 'Behind the open Furnace Gate a round red door glows. Step through it.', at: () => GATE_X, done: () => !!G.flags.seen1 },
  slagforge: { title: 'A hotter anvil', text: 'Cinderite will not take shape on an ordinary anvil. Build a Slagforge at an iron anvil: slagrock, charglass, embersteel and cinderite.', done: () => !!G.flags.placed_slagforge || !!G.flags.used_anvil3 },
  tyrant: { title: 'The caldera', text: "Something sleeps in the Tyrant's Caldera. Wake it at the altar with a Cinder Offering (it needs a Keeper's Sigil).", dim: 1, at: () => DARENA_X, done: () => !!G.flags.tyrantDead },
  emoon: { title: 'The Ember Moon', text: 'Since you came back from Cinderdeep, some nights the moon will rise red. Moonwretches drip moon wax. Call the moon yourself with a Moon Lantern (Offering Altar) and, late in the night, something else comes.', done: () => !!G.flags.ev_emoon },
  rootkey: { title: 'The Rootward Key', text: "At an Offering Altar: the Tyrant's Core, 5 cinderite bars and 3 moon wax. Touch the key to any rift.", done: () => !!G.flags.dim2 },
  rootmother: { title: 'The Heartroot Hollow', text: 'The Rootmother keeps the hollow. Wake her at the altar with a Root Offering (it needs a slag heart from the Tyrant).', dim: 2, at: () => DARENA_X, done: () => !!G.flags.rootmotherDead },
  starfall: { title: 'Starfall', text: 'Some nights now the sky sheds. Catch the starshards where they land.', done: () => !!G.flags.ev_starfall },
  eclipse: { title: 'The Eclipse', text: 'Some days now the ring goes dark at noon, and Umbral Knights walk. Their shards are cut from nothing else.', done: () => !!G.flags.ev_eclipse },
  prismkey: { title: 'The Prism Key', text: 'At an Offering Altar: the Heartseed, 5 gloomsteel bars, 4 starshards and 2 umbral shards. Touch it to a rift.', done: () => !!G.flags.dim3 },
  matriarch: { title: "The Matriarch's Spire", text: 'The Prism Matriarch keeps the broken sky. Wake her at the altar with a Prism Offering (it needs moth wax from the Rootmother).', dim: 3, at: () => DARENA_X, done: () => !!G.flags.matriarchDead },
  shepherd: { title: 'The Pale Shepherd', text: 'Something tall walks an Ember Moon that you called with a Moon Lantern. It leaves at dawn.', done: () => !!G.flags.shepherdDead }
});
LEADS.offerings = { title: 'Offerings', text: 'The guardians wake for offerings. Build an Offering Altar at a Mason\'s Bench, then look in the recipe book [B]: each offering needs things you gather and something the guardian before it left behind.', done: () => !!G.flags.offered_ashen_offering };
LEAD_ORDER.push('offerings', 'kiln', 'slagforge', 'tyrant', 'emoon', 'rootkey', 'rootmother', 'starfall', 'eclipse', 'prismkey', 'matriarch', 'shepherd');
const leadAt = L => !L || !L.at || (L.dim || 0) !== DIM ? null : L.at();
// ---------------- things to touch in the other worlds ----------------
function dimInteract(L) {
  const p = G.p, ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T);
  for (const o of tileObjs.values()) {
    if (abs(o.x - ptx) > 6 || abs(o.y - pty) > 5) continue;
    if (o.id === ECHOSTONE) { const id = ECHOPOS.get(o.y * WW + o.x); if (id !== undefined) L.push({ x: o.x * T + 4, y: (o.y + 1) * T, r: 14, label: G.echoes.has(id) ? 'listen again' : 'listen to the echo', act: () => readEcho(id) }); }
    else if (o.id === COLDHEARTH && DIM === 7) L.push({ x: o.x * T + 4, y: (o.y + 1) * T, r: 22, label: G.flags.hollowDead ? 'sit by the hearth' : hasItem('dawnring') ? 'set the Dawnring on the hearth' + (hasItem('ember_offering') ? ' (offering)' : '') : 'look at the cold hearth', act: hearthAct, hide: () => !!G.boss, host: 1 });
    else if (o.id === DALTAR && DIM) L.push({ x: o.x * T + 4, y: (o.y + 1) * T, r: 18, label: (G.flags[BOSSES[DIMP[DIM].boss].flag] ? 'wake the guardian again' : 'wake the guardian') + (hasItem(DIM_OFFER[DIMP[DIM].boss]) ? ' (offering)' : ''), act: altarAct, hide: () => !!G.boss, host: 1 });
  }
}
// ---------------- the sky's colour during an event ----------------
function eventSun() {
  const e = G.ev; if (!e || DIM || e.fade <= 0) return; const s = G.sun, k = e.fade;
  if (e.id === 'emoon' && G.dn < .5) { s[0] = lerp(s[0], .62, k * .55); s[1] = lerp(s[1], .16, k * .55); s[2] = lerp(s[2], .18, k * .55); }
  else if (e.id === 'eclipse') { s[0] = lerp(s[0], .16, k * .85); s[1] = lerp(s[1], .14, k * .85); s[2] = lerp(s[2], .32, k * .85); G.dn = lerp(G.dn, .16, k); }
  else if (e.id === 'ashfall') { const g = (s[0] + s[1] + s[2]) / 3; for (let i = 0; i < 3; i++) s[i] = lerp(s[i], g * .7, k * .6); }
  else if (e.id === 'fog') { for (let i = 0; i < 3; i++) s[i] = lerp(s[i], .72, k * .3); }
  else if (e.id === 'starfall' && G.dn < .5) s[2] = min(1, s[2] + .1 * k);
}
