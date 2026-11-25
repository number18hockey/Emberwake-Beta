// ============================================================
//  The story past the floors. The three embers closed the gate under the
//  world, but the ring itself is still broken: the Hollow got outside it.
//  Every guardian of the ring kept a piece of it. The Long Winter, the
//  Hourworks and the Thunderhead each tell part of what the ring was; the
//  Outside is where the Hollow waits by the first fire, gone cold.
// ============================================================
ECHOES.push(
  [ // the Long Winter
    ['The Quench', 'Everything the Dawnforge made was quenched here, hissing, in a cold that was built on purpose. A morning cooled this way kept its shape all day.'],
    ['Frost Wolves', 'The wolves were the smiths\' dogs. They still guard the quench. They do not remember from what.'],
    ['The Stag', 'The Winter Stag carried the cold from one end of the quench to the other on its antlers, and set it down where the smiths asked. Now no one asks.'],
    ['Rimesteel', 'Steel quenched in the Long Winter keeps the cold in it forever. A blade of it freezes what it cuts, and what is frozen, it breaks.'],
    ['Firelight', 'It is not the snow that kills here. It is being far from a fire. The lodges are an old kindness: someone hoped you would come.'],
    ['The First Fragment', 'When the ring broke, each of its guardians caught a piece of it and held on. The Stag holds one still. So, if you listen, do all the others.']
  ],
  [ // the Hourworks
    ['The Hour', 'The ring turned once a day because something turned it. This is the something: a clock the size of a world, wound by a mainspring the size of a mountain.'],
    ['The Great Chime', 'When the great chime rings, the clock holds its breath, and so does everything in it. Everything but a Waker. Wakers were never on the clock.'],
    ['Rewinders', 'Some of the clockwork learned to turn its own hands back. It does not get older. It does not get better either.'],
    ['The Horologist', 'The Horologist kept the hour. When the ring stopped, it kept the hour anyway, alone, for a thousand years, and it has started to resent anyone who interrupts.'],
    ['Hourbrass', 'Hourbrass keeps time. A blow struck with it happens, and then it happens again, a moment later, because the metal insists.']
  ],
  [ // the Thunderhead
    ['Breath', 'A forge needs air. The ring\'s air came from here: a storm that never ended, breathing on the coals every morning.'],
    ['The Eye', 'In the middle of the storm there is a place where the air is still. The Stormwright lives there. It is the only place it can hear itself think.'],
    ['Rods', 'The old towers are not watchtowers. They are rods. The Stormwright struck them to light the first spark of every day.'],
    ['Stormsilver', 'Stormsilver remembers the lightning that made it. Strike something with it and the lightning goes looking for the next thing over.'],
    ['Weather', 'The thunderstorms over the Waking Lands drift up from here. Raise a rod under one and the storm will give you something of itself.']
  ],
  [ // the Outside
    ['Outside', 'The ring kept the heat in. Outside it, the heat goes out. Everything here is the colour of a fire the morning after.'],
    ['The Hollow', 'The Hollow is not a creature. It is what is left in a place when the heat goes out of it. Out here, there is nothing left but that, and it has had a long time to learn shapes.'],
    ['The Cold Hearth', 'The first fire was lit here, before the ring, before the smiths. When the ring broke, the Hollow sat down beside it and waited for it to go out. It did.'],
    ['Pieces', 'The stones drifting in the dark are pieces of the other worlds, flaking off at their edges, falling outward. One day there will be nothing inside to fall.'],
    ['Dawnsteel', 'The ring was made of dawnsteel. There is only a little left: in the ore here, and in the last embers, and in you.'],
    ['Lighting It', 'Bring the ring to the hearth. Not the pieces. The ring. A fire needs something to burn and something to hold it, and the ring was always both.']
  ]
);
for (let d = LORE_N.length; d < ECHOES.length; d++) LORE_N.push(ECHOES[d].length);
Object.assign(BEASTS, {
  frostwolf: ['Frost Wolf', 'The Long Winter: snowfields and pines', 'Hunts in twos and threes. A bite leaves frost in you.'], rimewisp: ['Rime Wisp', 'The Long Winter', 'Throws shards of ice, three at a time.'],
  icegolem: ['Ice Golem', 'The Long Winter: the glacier stair', 'Its slam raises ice from the ground around it.'], snowstalker: ['Snow Stalker', 'The Long Winter: pines', 'Waits under the drifts until you are close.'],
  clockmite: ['Clockmite', 'The Hourworks', 'A beetle that keeps time. Armoured.'], brasssentry: ['Brass Sentry', 'The Hourworks', 'Winds up, then fires five bolts.'],
  pendulumknight: ['Pendulum Knight', 'The Hourworks: pendulum country', 'Blocks from the front. Swings wide. Get behind it.'], rewinder: ['Rewinder', 'The Hourworks: hourglass dunes', 'Badly hurt, it steps back to where it stood, with the health it had then. Finish it fast.'],
  stormkite: ['Storm Kite', 'The Thunderhead', 'Rides the wind, then dives.'], voltgolem: ['Volt Golem', 'The Thunderhead: the anvilheads', 'Charges up, then bursts. Back off when it crackles.'],
  galeharpy: ['Gale Harpy', 'The Thunderhead', 'Blows you away, then dives.'], sparkling: ['Sparkling', 'The Thunderhead', 'Sparks that swarm.'],
  shade: ['Shade', 'The Outside, in the dark', 'Only comes when your light is gone. Light it away.'], hollowhound: ['Hollow Hound', 'The Outside', 'A hound of ash. Bites bleed.'],
  ashcolossus: ['Ash Colossus', 'The Outside: the ember fields', 'Slow, huge, and the ground breaks where its fists come down.'], emberwraith: ['Ember Wraith', 'The Outside', 'Throws the last of its fire at you.'],
  skyhawk: ['Skyhawk', 'The Waking Lands: high peaks', 'Circles the heights. Its feathers are lighter than air.'], stormcrow: ['Stormcrow', 'The Waking Lands, in a thunderstorm', 'Flies in the storm. Carries a little of it.'],
  winterstag: ['The Winter Stag', "The Long Winter: the Stag's Cirque", 'Carried the cold for the smiths. Charges, raises ice, breathes frost.'], horologist: ['The Horologist', 'The Hourworks: the Mainspring', 'Kept the hour. Turns it back when it is losing.'],
  stormwright: ['The Stormwright', 'The Thunderhead: the eye', 'Struck the first spark of every day.'], hollowking: ['The Hollow', 'The Outside: the Cold Hearth', 'What is left when the heat goes out.']
});
if (typeof BEAST_ORDER !== 'undefined') for (const k of ['skyhawk', 'stormcrow', 'frostwolf', 'rimewisp', 'icegolem', 'snowstalker', 'clockmite', 'brasssentry', 'pendulumknight', 'rewinder', 'stormkite', 'voltgolem', 'galeharpy', 'sparkling', 'shade', 'hollowhound', 'ashcolossus', 'emberwraith', 'winterstag', 'horologist', 'stormwright', 'hollowking']) if (!BEAST_ORDER.includes(k)) BEAST_ORDER.push(k);
JOURNAL.tempo = ['The Beat of a Fight', 'A fight has a pulse. After each blow your weapon GLINTS: strike on the glint and the chain goes on, the blow bites, and an ember of TEMPO lights (up to five; each makes blows hit harder). Strike before the glint and you have RUSHED: weak, slow, open. A heavy blow (right mouse) spends every ember at once; at five it is a CRESCENDO. Land blows with the sweet spot of the weapon for a CLEAN hit. Swing into an enemy blow to CLASH and turn it aside. Being hit in your wind-up means you are CAUGHT. A foe shows ! before it strikes, and has a guard that blows in time will BREAK. Holding the button does nothing: every blow is a choice. A heavy blow on a BROKEN foe is a SUNDER, half again as hard. After a CLASH your next blow is the ANSWER, and bites. Let a charged blow go just as it flashes: a PERFECT RELEASE. A WARDED foe turns plain blows from the front, so strike heavy, clean, or from behind. Mashing costs stamina as well as the chain.'];
JOURNAL.world = ['What Kind of World', 'No two worlds are alike. Each has three traits from its seed: one for its land, one for what lives on it, one for its sky. The menu lists them. The lands have moods too: a moor may be burnt black or open meadow, and each mood keeps its own company. The year turns every three days: Kindling, Highsun, Emberfall, Ashrest. And between the great places the road has small ones: milestones, springs, stones that sing.'];
Object.assign(JOURNAL, {
  surface: ['Under the Open Sky', 'The surface keeps things the deep never will. Sunstone in the high stone, only by daylight. Skyiron where stars came down. Sunbloom by day, moonpetal by night. Feathers from the hawks round the peaks. Storm glass where lightning finds a rod. Sun shrines on the hilltops, and observatories whose telescopes still see the gates.'],
  gates: ['Four Gates', 'Past the three floors there are four more doors, all on the surface: the Frost Gate on a peak in the cold country, the Stopped Clocktower, the Stormspire (it opens only in a thunderstorm) and the Ringstair, which climbs toward the broken ring.'],
  dim4: ['The Long Winter', 'The quench of the Dawnforge: snow, frozen pines, glaciers. Out in the open the cold gets into you. Stay near fire, wear fur or something warmer, eat hot food. Rimesteel lies deep, and needs a prismglass pick and a Rime Forge.'],
  dim5: ['The Hourworks', 'The clock that turned the ring. Springs throw you high; belts carry you. When the great chime rings, everything but you stands still for a moment: use it. Hourbrass needs a rimesteel pick and an Escapement.'],
  dim6: ['The Thunderhead', 'The storm that breathed on the forge. The wind pushes, and lightning looks for whoever stands in the open: watch for the red marks on the ground. Stormsilver needs an hourbrass pick and a Thunder Anvil.'],
  dim7: ['The Outside', 'Outside the ring. Dark, and the dark notices you: carry a light, stay near embers. Dawnsteel needs a stormsilver pick and the Dawnforge. The Cold Hearth is where the Hollow waits.'],
  winterstag: ['The Winter Stag', 'The Stag is down. Its antler rings when you hold it. An Hour Key needs it, to open the Stopped Clocktower.'],
  horologist: ['The Horologist', 'The Horologist has stopped. Its mainspring is yours: a Storm Key needs it, for the Stormspire.'],
  stormwright: ['The Stormwright', 'The Stormwright is spent. Every guardian has given up its piece of the ring now, or will: ten fragments, and a Thunder Anvil, make the Dawnring.'],
  hollowking: ['The Hollow', 'The Hollow went out. The Cold Hearth burns.'],
  ending: ['The Dawnforge', 'The ring is whole. The nights will not run long any more. Wick says he always knew. He did not.']
});
Object.assign(LEADS, {
  sunshrines: { title: 'Sun shrines', text: 'Small shrines on the hilltops face the sky. A sunstone, set in one at midday, makes you harder to kill: once at each shrine.', done: () => (G.flags.sunHP | 0) >= 15 },
  g_frost: { title: 'The Frost Gate', text: 'A gate on a peak in the cold country. A Frost Key opens it: prismglass, sunstone (from the high peaks, by day), skyfeathers and the Prism Heart, at a Slagforge.', at: () => FROST_X, done: () => !!G.flags.dim4 },
  rimeforge: { title: 'A colder anvil', text: 'Rimesteel will not take a shape on a Slagforge. Build a Rime Forge at one: rimesteel ore, glacier ice, cinderite bars and sunstone.', done: () => !!G.flags.used_anvil4 || !!G.flags.placed_rime_forge },
  winterstag: { title: "The Stag's Cirque", text: 'The Winter Stag sleeps in the cirque. Wake it at the altar with a Rime Offering: rimesteel, glacier ice, sunbloom (meadows, by day), slag hearts and moth wax.', dim: 4, at: () => DARENA_X, done: () => !!G.flags.stagDead },
  g_clock: { title: 'The Stopped Clocktower', text: "A clock tower stopped at the hour the ring broke. An Hour Key winds it: the Stag's antler, rimesteel, old gears (observatories) and moonpetal (high up, at night), at a Rime Forge.", at: () => CLOCK_X, done: () => !!G.flags.dim5 },
  hourkey: { title: 'The Hour Key', text: "At a Rime Forge: the Stag's antler, 4 rimesteel bars, 3 old gears and 2 moonpetals. Then the Stopped Clocktower.", done: () => !!G.flags.dim5 },
  escapement: { title: 'A forge that keeps time', text: 'Hourbrass only takes a shape on the beat. Build an Escapement at a Rime Forge: hourbrass ore, cogstone, rimesteel bars and old gears.', done: () => !!G.flags.used_anvil5 || !!G.flags.placed_escapement },
  horologist: { title: 'The Mainspring', text: "The Horologist keeps the mainspring. Wake it with an Hour Offering: hourbrass, old gears, moonpetal, prism dust and the Stag's antler.", dim: 5, at: () => DARENA_X, done: () => !!G.flags.horologistDead },
  g_storm: { title: 'The Stormspire', text: 'A spire under a rod struck a thousand times. It only opens in a thunderstorm, for a Storm Key: the Mainspring, hourbrass, skyiron (fallen stars) and storm glass, at an Escapement.', at: () => STORMG_X, done: () => !!G.flags.dim6 },
  stormkey: { title: 'The Storm Key', text: 'At an Escapement: the Mainspring, 4 hourbrass bars, 3 skyiron bars and 2 storm glass. Storm glass: observatories often keep some, and a lightning rod raised in a thunderstorm makes more. A Storm Bell (storm glass, skyiron, copper) calls a storm when you want one.', done: () => !!G.flags.dim6 },
  thunderanvil: { title: 'An anvil for lightning', text: 'Stormsilver needs a Thunder Anvil, made at an Escapement: stormsilver ore, stormstone, hourbrass and skyiron.', done: () => !!G.flags.used_anvil6 || !!G.flags.placed_thunder_anvil },
  stormwright: { title: 'The Eye of the Storm', text: 'The Stormwright waits in the still eye. Wake it with a Storm Offering: stormsilver, storm glass, skyfeathers, spore dust and the Mainspring.', dim: 6, at: () => DARENA_X, done: () => !!G.flags.stormwrightDead },
  dawnring: { title: 'The Dawnring', text: 'Every guardian kept a fragment of the ring: the Warden, Vesper, the Keeper, the Tyrant, the Rootmother, the Matriarch, the Pale Shepherd, the Stag, the Horologist and the Stormwright. Ten fragments, 4 stormsilver bars and 4 sunstone, at a Thunder Anvil, make the Dawnring.', done: () => !!G.flags.dim7 || hasItem('dawnring') },
  g_ring: { title: 'The Ringstair', text: 'Fourteen steps up out of the ash, and an empty ring of stone at the top. The Dawnring fits it.', at: () => RING_X, done: () => !!G.flags.dim7 },
  dawnforge: { title: 'The Dawnforge', text: 'Dawnsteel, the metal of the ring, needs the Dawnforge, made at a Thunder Anvil: dawnsteel ore, voidrock, stormsilver and sunstone.', done: () => !!G.flags.used_anvil7 || !!G.flags.placed_dawnforge },
  hollowking: { title: 'The Cold Hearth', text: 'The Hollow waits by the first fire. Set the Dawnring on the Cold Hearth with an Ember Offering: dawnsteel, last embers, sunstone, cinderite and the Thunder Heart.', dim: 7, at: () => DARENA_X, done: () => !!G.flags.hollowDead }
});
LEAD_ORDER.push('sunshrines', 'g_frost', 'rimeforge', 'winterstag', 'g_clock', 'hourkey', 'escapement', 'horologist', 'g_storm', 'stormkey', 'thunderanvil', 'stormwright', 'dawnring', 'g_ring', 'dawnforge', 'hollowking');
// the matriarch's lead points onward now
LEADS.matriarch.text = 'The Prism Matriarch keeps the broken sky. Wake her at the altar with a Prism Offering (it needs moth wax from the Rootmother). Her heart opens the way past the floors.';
BOSSES.matriarch.leads = ['g_frost'];
