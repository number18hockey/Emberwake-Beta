// ============================================================
//  Past the floors: four more metals, each mined in its own world and
//  worked at its own forge, each forge hotter than the last.
//    Rimesteel    (the Long Winter)  Rime Forge     blows freeze, and shatter
//    Hourbrass    (the Hourworks)    Escapement     blows echo
//    Stormsilver  (the Thunderhead)  Thunder Anvil  blows arc to others
//    Dawnsteel    (the Outside)      Dawnforge      blows burn and mend you
//  Each forge also makes everything the forges before it make. The keys to
//  the gates, the guardians' offerings and the Dawnring all want things
//  from several worlds and from the surface.
// ============================================================
const REALMATS = ['rime', 'hour', 'storm', 'dawn'], REALM_LVL = { rime: 4, hour: 5, storm: 6, dawn: 7 }, REALM_GRIP = { rime: 'rootwood', hour: 'rootwood', storm: 'skyiron_bar', dawn: 'skyiron_bar' };
const REALM_EXTRA = { rime: 'frost_pelt', hour: 'ancient_gear', storm: 'skyfeather', dawn: 'last_ember' };
// how the new trinkets look (shape, colours), for the trinket builder
const TRINK_LOOK = { hearth_charm: ['charm', { a: '#8a7a68', b: '#c94a2a', c: '#5a1a10', e: '#ffd35a', f: '#fff1a8' }], last_lantern: ['amulet', { a: '#3a3450', b: '#ff9a3d', e: '#ffd35a', f: '#ffffff' }], stag_crown: ['scale', { a: '#ffffff', b: '#8fd0d8', c: '#2a5a6a', e: '#c9fff6' }], hour_charm: ['eye', { a: '#7a5218', b: '#e8dcb0', c: '#c9a44a', f: '#3a2a14' }], storm_sigil: ['brand', { a: '#1e2236', b: '#6a7aa8', e: '#e8f0ff' }] };
function realmItemsPre() {
  Object.assign(TMAT, {
    rime: { n: 'Rimesteel', tier: 10, pow: 54, cd: 7, m: '#e8ffff', M: '#62a9bc', h: '#2a3a4a' },
    hour: { n: 'Hourbrass', tier: 11, pow: 62, cd: 7, m: '#fff1a8', M: '#c9a44a', h: '#3a2a14' },
    storm: { n: 'Stormsilver', tier: 12, pow: 70, cd: 6, m: '#ffffff', M: '#9ab0ff', h: '#1e2236' },
    dawn: { n: 'Dawnsteel', tier: 13, pow: 80, cd: 6, m: '#fff1a8', M: '#ff9a3d', h: '#3a2420' }
  });
  Object.assign(WMAT, {
    rime: { n: 'Rimesteel', base: 38, w: '#ffffff', b: '#e8ffff', B: '#8fd0d8', g: '#2a5a6a', h: '#2a3a4a', x: '#c9fff6', frost: 1, rime: 1, cold: true, t: 'Rime: blows freeze, and a heavy blow or a critical on a frozen foe shatters it.' },
    hour: { n: 'Hourbrass', base: 42, w: '#fff8d8', b: '#fff1a8', B: '#c9a44a', g: '#5a3a14', h: '#3a2a14', x: '#ffd35a', echo: 1, t: 'Echo: every blow strikes again a moment later.' },
    storm: { n: 'Stormsilver', base: 46, w: '#ffffff', b: '#e8f0ff', B: '#9ab0ff', g: '#2a2e46', h: '#1e2236', x: '#e8f0ff', arc: 1, crit: .05, t: 'Arc: blows leap as lightning to foes close by.' },
    dawn: { n: 'Dawnsteel', base: 52, w: '#ffffff', b: '#fff1a8', B: '#ff9a3d', g: '#7a2a14', h: '#3a2420', x: '#ffd35a', radiance: 1, burn: 1, glow: true, t: 'Radiance: blows burn and mend you a little; the Hollow and all it made take more.' }
  });
  WLIST.push(['sword', 'rime'], ['greatsword', 'rime'], ['spear', 'rime'], ['glaive', 'rime'], ['warhammer', 'rime'], ['daggers', 'rime'], ['longbow', 'rime'], ['flail', 'rime'],
    ['sabre', 'hour'], ['longsword', 'hour'], ['halberd', 'hour'], ['kama', 'hour'], ['mace', 'hour'], ['recurve', 'hour'], ['chainwhip', 'hour'],
    ['sword', 'storm'], ['trident', 'storm'], ['claws', 'storm'], ['battleaxe', 'storm'], ['greataxe', 'storm'], ['longbow', 'storm'], ['nunchaku', 'storm'],
    ['greatsword', 'dawn'], ['spear', 'dawn'], ['sai', 'dawn'], ['warhammer', 'dawn'], ['longbow', 'dawn'], ['flail', 'dawn'], ['shortsword', 'dawn']);
  Object.assign(AMAT, {
    fur: { n: 'Frostfur', prot: 30, wt: 6, k: 'soft', c: ['#e8f4f8', '#c8e0ea', '#6a7e92', '#ffffff'], res: { cold: 1 }, gift: 'warm', set: 'Snowbound: the cold of the Long Winter cannot reach you.' },
    rime: { n: 'Rimesteel', prot: 100, wt: 22, k: 'helm', c: ['#e8ffff', '#8fd0d8', '#2a5a6a', '#ffffff'], res: { cold: 1 }, gift: 'hearthward', set: 'Hearthward: the cold cannot touch you, and frost never slows you.' },
    hour: { n: 'Hourbrass', prot: 106, wt: 14, k: 'crest', c: ['#ffd35a', '#c9a44a', '#5a3a14', '#fff1a8'], gift: 'clockwork', set: 'Clockwork: dodges carry further and stamina comes back faster.' },
    storm: { n: 'Stormsilver', prot: 112, wt: 12, k: 'crest', c: ['#e8f0ff', '#9ab0ff', '#2a2e46', '#ffffff'], res: { shock: 1 }, gift: 'stormborn', set: 'Stormborn: lightning and wind do not touch you.' },
    dawn: { n: 'Dawnsteel', prot: 124, wt: 18, k: 'helm', c: ['#fff1a8', '#ff9a3d', '#7a2a14', '#ffffff'], res: { fire: 1, cold: 1 }, gift: 'lastlight', set: 'Last Light: you shine, and the dark of the Outside cannot touch you.' }
  });
  Object.assign(TRINK, {
    hearth_charm: { n: 'Hearthstone Charm', res: { cold: .9 }, d: 'A warm stone on a cord. The cold barely gets in.' },
    last_lantern: { n: 'Last Lantern', tags: ['glow'], mul: { taken: .96 }, d: 'A little of the last light, on a chain. You are never in the dark.' },
    stag_crown: { n: "Stag's Crown", res: { cold: .6 }, mul: { walk: 1.06, hdmg: 1.06 }, d: 'Left by the Winter Stag: the cold bites less, you walk faster and heavy blows land harder.', boss: 1 },
    hour_charm: { n: 'Stopped Watch', mul: { dodge: 1.15, st: 1.15 }, tags: ['veil'], d: 'Left by the Horologist: dodges carry further, stamina comes back faster, a wider perfect window.', boss: 1 },
    storm_sigil: { n: 'Storm Sigil', res: { shock: .7 }, mul: { dmg: 1.07 }, d: 'Left by the Stormwright: lightning bites less; blows land 7% harder.', boss: 1 }
  });
}
function realmItemsPost() {
  const Ico = (rows, p) => outlined(spr(rows, p)), M = (id, name, ic, pal, desc, o) => defI(id, Object.assign({ name, icon: typeof ic === 'string' ? icon(ic, typeof pal === 'string' ? P[pal] || pal : pal) : ic, desc }, o));
  const P = {
    rime: { a: '#ffffff', b: '#e8ffff', c: '#8fd0d8', d: '#2a5a6a', e: '#ffffff' }, ice: { a: '#ffffff', b: '#c9fff6', c: '#62a9bc', d: '#2a5a6a', e: '#ffffff' }, perm: { a: '#8aa4b4', b: '#6a7e92', c: '#4a5a6a', d: '#2a3440', e: '#c9fff6' },
    hour: { a: '#fff8d8', b: '#fff1a8', c: '#c9a44a', d: '#5a3a14', e: '#ffffff' }, cog: { a: '#a89a7a', b: '#7a6a46', c: '#5a4a30', d: '#3a2a14', e: '#ffd35a' }, brass: { a: '#fff1a8', b: '#ffd35a', c: '#c9a44a', d: '#7a5218', e: '#ffffff' },
    storm: { a: '#ffffff', b: '#e8f0ff', c: '#9ab0ff', d: '#3a4268', e: '#ffffff' }, sst: { a: '#8a94b4', b: '#5a6488', c: '#3a4060', d: '#1e2236', e: '#9ab0ff' }, cloud: { a: '#ffffff', b: '#e8ecf8', c: '#c8d0e8', d: '#8a94b4', e: '#ffffff' },
    dawn: { a: '#ffffff', b: '#fff1a8', c: '#ff9a3d', d: '#7a2a14', e: '#ffffff' }, ash: { a: '#e8e0f0', b: '#c8c0d4', c: '#a8a0b8', d: '#6a6480', e: '#ffffff' }, void: { a: '#4a4458', b: '#2e2842', c: '#1a1626', d: '#0e0a16', e: '#8a84a0' }, drift: { a: '#e0d2ff', b: '#a58ae0', c: '#7a6ab0', d: '#4a3a8a', e: '#ffffff' }
  };
  // ---- the ground of each world ----
  M('permafrost', 'Permafrost', 'rock', 'perm', 'Ground that has been frozen since the ring broke. Place it to build.', { type: 'block', tile: PERMAFROST });
  M('glacier_ice', 'Glacier Ice', 'brick', 'ice', 'Blue ice that never melts. Rime Forges and Rime Offerings want it. Place it to build.', { type: 'block', tile: GLACIER });
  M('brassplate', 'Brass Plate', 'brick', 'brass', 'The floor of the Hourworks. Place it to build.', { type: 'block', tile: BRASSPLATE });
  M('cogstone', 'Cogstone', 'rock', 'cog', 'Stone with gears grown into it. The Escapement wants it. Place it to build.', { type: 'block', tile: COGSTONE });
  M('glass_sand', 'Hourglass Sand', 'pile', { a: '#fff8e0', b: '#f4e8b8', c: '#e8d8a0', d: '#a89870', e: '#ffffff' }, 'Sand that remembers falling through an hourglass. It falls. Place it to build.', { type: 'block', tile: GLASSSAND });
  M('cloud_tuft', 'Thundercloud', 'pile', 'cloud', 'A handful of cloud that holds its shape. Place it to build: soft, and solid.', { type: 'block', tile: CLOUD });
  M('stormstone', 'Stormstone', 'rock', 'sst', 'The dark heart of the Thunderhead. The Thunder Anvil wants it. Place it to build.', { type: 'block', tile: STORMCLOUD });
  M('ashglass', 'Ashglass', 'flint', 'ash', 'Pale glass that was ash once. Place it to build.', { type: 'block', tile: ASHGLASS });
  M('voidrock', 'Voidrock', 'rock', 'void', 'Stone that is mostly nothing. The Dawnforge wants it. Place it to build.', { type: 'block', tile: VOIDROCK });
  M('drift_shard', 'Driftshard', 'flint', 'drift', 'A piece of some other world, drifting. Place it to build.', { type: 'block', tile: DRIFTSHARD });
  // ---- ores and bars ----
  M('rime_ore', 'Rimesteel Ore', 'nug', 'rime', 'Ore from the Long Winter, colder than the ice around it. Needs a prismglass pick. A Rime Forge smelts it.');
  M('hour_ore', 'Hourbrass Ore', 'nug', 'hour', 'Ore from the Hourworks. It ticks if you hold it to your ear. Needs a rimesteel pick. An Escapement smelts it.');
  M('storm_ore', 'Stormsilver Ore', 'nug', 'storm', 'Ore from the Thunderhead. Your hair stands up near it. Needs an hourbrass pick. A Thunder Anvil smelts it.');
  M('dawn_ore', 'Dawnsteel Ore', 'nug', 'dawn', 'Ore from the Outside, the last warm thing there. Needs a stormsilver pick. The Dawnforge smelts it.', { glow: 1 });
  M('rime_bar', 'Rimesteel Bar', 'bar', 'rime', 'Steel quenched in the Long Winter. Frost lives in it.');
  M('hour_bar', 'Hourbrass Bar', 'bar', 'hour', 'Brass that keeps time. Blows struck with it happen twice.');
  M('storm_bar', 'Stormsilver Bar', 'bar', 'storm', 'Silver with a storm folded into it. It crackles.');
  M('dawn_bar', 'Dawnsteel Bar', 'bar', 'dawn', 'The metal the ring was made of. It is warm. It is always warm.', { glow: 1 });
  // ---- from the creatures and the land ----
  M('frostbell', 'Frostbell', 'berry', { a: '#ffffff', b: '#c9fff6', c: '#8fd0d8', e: '#62a9bc', f: '#ffffff' }, 'A flower that rings in the wind. Bitter. Cold to hold.', { type: 'food', food: 2, heal: 4 });
  M('frost_pelt', 'Frost Pelt', 'hide', P.cloud, 'Thick white fur. Frostfur armour, and rimesteel armour, want it.');
  M('frost_heart', 'Frost Heart', 'nug', P.ice, 'The cold core of an ice golem. A Hearthstone Charm wants it, oddly.');
  M('gearbloom', 'Gearbloom', 'berry', { a: '#ffd35a', b: '#fff1a8', c: '#c9a44a', e: '#7a5218', f: '#ffd35a' }, 'A brass flower. It turns toward the hour.');
  M('hour_sand', 'Hour Sand', 'pile', { a: '#ffffff', b: '#fff8e0', c: '#ffd35a', d: '#c9a44a', e: '#ffffff' }, 'Sand from a rewinder. It runs uphill when no one is looking.');
  M('mainspring_coil', 'Mainspring Coil', 'coil', 'brass', 'A coiled spring from a pendulum knight, still wound.');
  M('charged_shard', 'Charged Shard', 'flint', 'storm', 'A crystal full of lightning. It stings.', { glow: 1 });
  M('last_ember', 'Last Ember', 'nug', { a: '#fff1a8', b: '#ff9a3d', c: '#c94a2a', d: '#5a1a10', e: '#ffffff' }, 'One of the last warm things in the Outside. Hold it: the dark stays back.', { glow: 1 });
  M('shade_cloth', 'Shade Cloth', 'cloth', P.void, 'What a shade wears. It is cold, and darker than it should be.');
  // ---- what the guardians leave ----
  defI('stag_antler', { name: "Stag's Antler", icon: Ico(['a.....a.', 'a..a..a.', '.a.a.a..', '..aaa...', '...a....', '...ab...', '...ab...', '...bb...'], { a: '#ffffff', b: '#8fd0d8' }), desc: 'A tine of the Winter Stag, ringing faintly. The Hour Key and the Hour Offering need it.' });
  defI('mainspring', { name: 'The Mainspring', icon: Ico(['..aaaa..', '.abbbba.', 'ab.cc.ba', 'ab.c..ba', 'ab..c.ba', 'ab.cc.ba', '.abbbba.', '..aaaa..'], { a: '#7a5218', b: '#ffd35a', c: '#fff1a8' }), desc: "The Horologist's heart, wound tight. The Storm Key and the Storm Offering need it." });
  defI('thunder_heart', { name: 'Thunder Heart', icon: Ico(['...a....', '..ab....', '.abba...', 'abbbbaa.', '...abba.', '...abba.', '..abba..', '..aa....'], { a: '#3a4268', b: '#e8f0ff' }), desc: "The Stormwright's heart: a bolt that never landed. The Ember Offering needs it." });
  defI('dawn_heart', { name: 'Heart of the Dawn', icon: Ico(['..aaaa..', '.abccba.', 'abcddcba', 'acdeedca', 'acdeedca', 'abcddcba', '.abccba.', '..aaaa..'], { a: '#7a2a14', b: '#ff9a3d', c: '#ffd35a', d: '#fff1a8', e: '#ffffff' }), desc: 'What the Hollow held onto: the last of the first fire. The Dawnbreaker is forged around it.', glow: 1 });
  // ---- the ring's fragments ----
  const FR = { frag_ash: ['Ashen Fragment', '#8d8794', 'the Ashen Warden'], frag_glass: ['Glass Fragment', '#c9fff6', 'Vesper'], frag_forge: ['Forge Fragment', '#ff8a3d', 'the Forge-Keeper'], frag_cinder: ['Cinder Fragment', '#ff7a2a', 'the Slag Tyrant'], frag_root: ['Root Fragment', '#6ff0c0', 'the Rootmother'], frag_prism: ['Prism Fragment', '#e0c8ff', 'the Prism Matriarch'], frag_moon: ['Moon Fragment', '#ff3b2a', 'the Pale Shepherd'], frag_rime: ['Rime Fragment', '#e8ffff', 'the Winter Stag'], frag_hour: ['Hour Fragment', '#ffd35a', 'the Horologist'], frag_storm: ['Storm Fragment', '#9ab0ff', 'the Stormwright'] };
  for (const id in FR) { const [n, c, who] = FR[id]; defI(id, { name: n, stack: 5, glow: 1, icon: Ico(['....aa..', '...abba.', '..abcb..', '.abcb...', 'abcb....', 'abb.....', '.a......'], { a: '#3a3450', b: c, c: '#ffffff' }), desc: `A piece of the Dawnforge's ring that ${who} kept. Ten of them, one from every guardian, forge the Dawnring.` }); }
  // ---- forges ----
  const forge = (id, name, tile, pal, desc) => defI(id, { name, type: 'block', tile, stack: 5, icon: Ico(['.aaaaaa.', 'abbbbbba', 'abcddcba', 'abcddcba', 'abbbbbba', '.a....a.'], pal), desc });
  forge('rime_forge', 'Rime Forge', RIMEFORGE, { a: '#2a4a5a', b: '#8fd0d8', c: '#3a5a6a', d: '#ffffff' }, 'An anvil cold enough to quench rimesteel. It makes everything a Slagforge makes, too. Place it, then [F].');
  forge('escapement', 'Escapement', ESCAPEMENT, { a: '#3a2a14', b: '#c9a44a', c: '#7a5a28', d: '#ffd35a' }, 'A forge that keeps time; hourbrass will only take a shape on the beat. Everything a Rime Forge makes, too. Place it, then [F].');
  forge('thunder_anvil', 'Thunder Anvil', THUNDERANVIL, { a: '#1e2236', b: '#6a7aa8', c: '#3a4268', d: '#e8f0ff' }, 'An anvil struck by lightning instead of a hammer. Stormsilver, and everything an Escapement makes. Place it, then [F].');
  forge('dawnforge', 'Dawnforge', DAWNANVIL, { a: '#7a2a14', b: '#ff9a3d', c: '#c94a2a', d: '#fff1a8' }, 'A small piece of what the ring was. Dawnsteel, and everything else. Place it, then [F].');
  // ---- keys and the ring ----
  const key = (id, name, c1, c2, desc) => defI(id, { name, type: 'key', stack: 1, icon: Ico(['.aaa......', 'a...a.....', 'a.b.abbbbb', 'a...a..b.b', '.aaa...b..'], { a: c1, b: c2 }), desc });
  key('frost_key', 'Frost Key', '#e8ffff', '#62a9bc', 'Turn it in the Frost Gate, on a peak in the cold country. It opens the Long Winter.');
  key('hour_key', 'Hour Key', '#ffd35a', '#7a5218', 'Wind it into the door under the Stopped Clocktower. It opens the Hourworks.');
  key('storm_key', 'Storm Key', '#e8f0ff', '#3a4268', 'Set it in the Stormspire, in a thunderstorm. It opens the Thunderhead.');
  defI('dawnring', { name: 'The Dawnring', type: 'key', stack: 1, glow: 1, icon: Ico(['...aaaa...', '..abbbba..', '.abc..cba.', 'abc....cba', 'abc....cba', 'abc....cba', '.abc..cba.', '..abbbba..', '...aaaa...'], { a: '#7a2a14', b: '#ff9a3d', c: '#fff1a8' }), desc: 'Ten fragments of the ring, made whole in your hand. It opens the Ringstair, and at the Cold Hearth, with an Ember Offering, it calls the Hollow. It is not used up.' });
  // ---- recipes: forges, bars, keys ----
  R('anvil', 'rime_forge', 1, { rime_ore: 6, glacier_ice: 12, cinder_bar: 4, sunstone: 2 }, { lvl: 3, q: 1 });
  R('anvil', 'escapement', 1, { hour_ore: 6, cogstone: 12, rime_bar: 4, ancient_gear: 3 }, { lvl: 4, q: 1 });
  R('anvil', 'thunder_anvil', 1, { storm_ore: 6, stormstone: 12, hour_bar: 4, skyiron_bar: 2 }, { lvl: 5, q: 1 });
  R('anvil', 'dawnforge', 1, { dawn_ore: 6, voidrock: 12, storm_bar: 4, sunstone: 4 }, { lvl: 6, q: 1 });
  R('anvil', 'rime_bar', 1, { rime_ore: 3, coal: 1 }, { lvl: 4 });
  R('anvil', 'hour_bar', 1, { hour_ore: 3, copper_bar: 1 }, { lvl: 5 });
  R('anvil', 'storm_bar', 1, { storm_ore: 3, skyiron_bar: 1 }, { lvl: 6 });
  R('anvil', 'dawn_bar', 1, { dawn_ore: 3, sunstone: 1 }, { lvl: 7 });
  R('anvil', 'frost_key', 1, { prism_bar: 4, sunstone: 3, skyfeather: 2, prism_heart: 1 }, { lvl: 3 });
  R('anvil', 'hour_key', 1, { stag_antler: 1, rime_bar: 4, ancient_gear: 3, moonpetal: 2 }, { lvl: 4 });
  R('anvil', 'storm_key', 1, { mainspring: 1, hour_bar: 4, skyiron_bar: 3, storm_glass: 2 }, { lvl: 5 });
  R('anvil', 'dawnring', 1, Object.assign({ storm_bar: 4, sunstone: 4 }, ...FRAGS.map(f => ({ [f]: 1 }))), { lvl: 6 });
  R('anvil', 'hearth_charm', 1, { frost_heart: 1, sunstone: 2, copper_bar: 2 }, { lvl: 4 });
  R('anvil', 'last_lantern', 1, { last_ember: 4, dawn_bar: 1, glass: 2 }, { lvl: 7 });
  R('mason', 'glacier_ice', 2, { glacier_ice: 1, snow: 4 });
  // ---- tools, weapons and armour of the four metals ----
  for (const mat of REALMATS) for (const kind of ['pick', 'axe', 'shovel', 'hammer']) {
    const m = TMAT[mat], s = TSHAPE[kind], held = spr(s.rows, { h: m.h, m: m.m, M: m.M }), id = `${mat}_${kind}`;
    defI(id, { name: `${m.n} ${s.n}`, type: 'tool', kind, tier: m.tier, power: m.pow, cd: m.cd, stack: 1, held, grip: s.grip, icon: rotIcon(held), desc: TOOL_D[kind], mat });
    R('anvil', id, 1, { [mat + '_bar']: kind === 'shovel' ? 2 : 3, [REALM_GRIP[mat]]: 2 }, { lvl: REALM_LVL[mat], q: 1 });
  }
  for (const [ty, mt] of WLIST) {
    if (!REALMATS.includes(mt)) continue; const id = `${mt}_${ty}`, T0 = WTYPE[ty]; if (!IT[id]) continue; const b = mt + '_bar', n = max(1, T0.sz);
    const need = T0.set === 'bow' ? { [b]: 2, plank: 1, rope: 1 } : T0.set === 'chuks' ? { chain: 1, [b]: 2 } : Object.assign({ [b]: n }, T0.set === 'spear' ? { [REALM_GRIP[mt]]: 2 } : T0.sz >= 4 ? { leather: 1 } : { [REALM_GRIP[mt]]: 1 });
    need[REALM_EXTRA[mt]] = 1; R('anvil', id, 1, need, { lvl: REALM_LVL[mt], q: 1 });
  }
  for (const r of RECIPES) { const it = IT[r.out]; if (it && it.type === 'armor' && REALMATS.includes(it.mat)) { const n = r.need[it.mat + '_bar'] || 2; r.need = { [it.mat + '_bar']: n, [REALM_EXTRA[it.mat]]: 1, leather: 1 }; r.lvl = REALM_LVL[it.mat]; } }
  // ---- the guardians' own weapons ----
  const uniq = (id, base, name, o, need, lvl, desc) => { if (!IT[base]) return; defI(id, Object.assign({}, IT[base], { id, name, desc }, o)); R('anvil', id, 1, need, { lvl, q: 1 }); };
  uniq('antlerbrand', 'rime_greatsword', 'Antlerbrand', { dmg: round(IT.rime_greatsword.dmg * 1.25), rime: 2 }, { stag_antler: 1, rime_bar: 6, frost_heart: 2 }, 4, "Forged around the Winter Stag's antler. Everything it touches freezes, and it shatters what is frozen.");
  uniq('second_hand', 'hour_sabre', 'The Second Hand', { dmg: round(IT.hour_sabre.dmg * 1.25), echo: 2, crit: (IT.hour_sabre.crit || 0) + .05 }, { mainspring: 1, hour_bar: 5, hour_sand: 4 }, 5, "The Horologist's spring, made a blade. Every blow happens three times.");
  uniq('stormcaller', 'storm_trident', 'Stormcaller', { dmg: round(IT.storm_trident.dmg * 1.25), arc: 3 }, { thunder_heart: 1, storm_bar: 6, charged_shard: 6 }, 6, "The Stormwright's heart on a pole. Lightning jumps from it to everything near.");
  uniq('dawnbreaker', 'dawn_greatsword', 'Dawnbreaker', { dmg: round(IT.dawn_greatsword.dmg * 1.3), radiance: 3, crit: (IT.dawn_greatsword.crit || 0) + .08 }, { dawn_heart: 1, dawn_bar: 8, last_ember: 6 }, 7, 'Forged around the Heart of the Dawn. It is morning, in your hand.');
  FORGE_KIT.push('rime_forge', 'frost_key', 'rime_sword');
}
// what lies in the ruins past the floors
Object.assign(LOOT_T, {
  winterruin: [['rime_ore', .55, 2, 5], ['glacier_ice', .6, 2, 6], ['frost_pelt', .5, 1, 2], ['frostbell', .5, 1, 3], ['salve', .6, 1, 3], ['prism_bar', .3, 1, 2], ['jerky', .5, 2, 4], ['rime_daggers', .05, 1, 1], ['scroll', .16, 1, 1]],
  hourruin: [['hour_ore', .55, 2, 5], ['ancient_gear', .8, 2, 4], ['hour_sand', .5, 1, 3], ['salve', .6, 1, 3], ['rime_bar', .3, 1, 2], ['mainspring_coil', .2, 1, 1], ['hour_kama', .05, 1, 1], ['scroll', .16, 1, 1]],
  stormruin: [['storm_ore', .55, 2, 5], ['charged_shard', .7, 2, 4], ['skyfeather', .6, 1, 3], ['salve', .6, 1, 3], ['hour_bar', .3, 1, 2], ['storm_glass', .3, 1, 2], ['storm_claws', .05, 1, 1], ['scroll', .16, 1, 1]],
  outsideruin: [['dawn_ore', .5, 2, 5], ['last_ember', .7, 1, 3], ['voidrock', .5, 3, 6], ['salve', .7, 1, 3], ['storm_bar', .3, 1, 2], ['sunstone', .3, 1, 2], ['dawn_sai', .05, 1, 1], ['scroll', .2, 1, 1]]
});
