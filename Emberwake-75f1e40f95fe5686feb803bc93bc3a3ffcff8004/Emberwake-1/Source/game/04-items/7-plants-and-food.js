// ============================================================
//  Wild plants, and what the fire and the oven make of them.
//  New ground plants (worlds made since land 6 grow them: decorNew, 03-world/8-traits-and-moods.js):
//    wild potato and wild onion, frostmint and emberleaf (herbs for the pot);
//    stinging nettle and cactus hurt to brush past (placeHazards, 03-world/5-places.js);
//    nightshade looks like a meal and is poison (finishEat: it.bad).
//  Wild pigs and hens (08-creatures/8-wild-game.js) give pork and fowl.
// ============================================================
// the new foods. Raw is barely worth it; the fire, the oven and the pot are where they shine
function plantItems() {
  const M = (id, name, ic, pal, desc, o) => defI(id, Object.assign({ name, icon: icon(ic, pal), desc }, o));
  const meal = (id, name, ic, pal, food, heal, k, desc, t) => M(id, name, ic, pal, desc, { type: 'food', food, heal, meal: k, buff: k ? 'meal' : undefined, mealT: t, stack: 20 });
  M('potato', 'Wild Potato', 'rock', { a: '#e8c898', b: '#c9a070', c: '#8a6a48', d: '#5a4030', e: '#f4e0b0' }, 'Knobbly and starchy. Bake it, or boil it into soup.', { type: 'food', food: 4, heal: 0 });
  M('onion', 'Wild Onion', 'nug', { a: '#ffffff', b: '#f4efe6', c: '#c8b8a0', d: '#8a7a60', e: '#c8e8a0' }, 'Sharp raw, sweet cooked. It goes in everything.', { type: 'food', food: 2, heal: 0 });
  M('frostmint', 'Frostmint', 'fiber', { a: '#e0fff4', b: '#8ff5c8', c: '#3aa080' }, 'Cool leaves. Brewed into tea they settle a sick stomach.', { type: 'food', food: 1, heal: 3 });
  M('emberleaf', 'Emberleaf', 'fiber', { a: '#ffd0a0', b: '#ff8a3d', c: '#a83a2a' }, 'A hot red herb. A pinch makes a meal fierce.', { type: 'food', food: 1, heal: 0 });
  M('nettle', 'Nettle Leaves', 'fiber', { a: '#c8f0b0', b: '#5aa05a', c: '#2a6a3a' }, 'They sting raw. Boiled, the sting goes and a good soup is left.', { type: 'food', food: 2, heal: 0, bad: { dmg: 3 } });
  M('nightshade', 'Nightshade', 'berry', { a: '#b49cff', b: '#5a3a8a', c: '#2a1a4a', e: '#2a4a32', f: '#3a6a46' }, 'Black berries that look like supper. Poison: your stomach turns and the world sways. A venom coat can use them.', { type: 'food', food: 2, heal: 0, bad: { poison: 420, sick: 600 } });
  M('cactus_flesh', 'Cactus Flesh', 'nug', { a: '#c8f0b0', b: '#6fae7a', c: '#3a7a52', d: '#1e4a2e', e: '#ffffff' }, 'Wet and green, the spines picked out.', { type: 'food', food: 5, heal: 3 });
  M('pork', 'Raw Pork', 'meat', 'meat', 'From a wild pig. Cook it through.', { type: 'food', food: 8, heal: 0 });
  M('fowl', 'Raw Fowl', 'meat', { a: '#ffd8c8', b: '#f0a898', c: '#c06a5a', d: '#7a3a30', e: '#fff0e0', w: '#f4efe6' }, 'A wild hen, plucked. Cook it.', { type: 'food', food: 6, heal: 0 });
  M('baked_potato', 'Baked Potato', 'rock', { a: '#f0d090', b: '#c98a4a', c: '#8a5a2a', d: '#5a3a1a', e: '#fff1a8' }, 'Fluffy inside, crackling skin.', { type: 'food', food: 18, heal: 6 });
  M('roast_pork', 'Roast Pork', 'meat', 'cmeat', 'Crackling and rich.', { type: 'food', food: 30, heal: 10 });
  M('roast_fowl', 'Roast Fowl', 'meat', { a: '#f0c080', b: '#c98a4a', c: '#8a5a2a', d: '#5a3a1a', e: '#fff1a8', w: '#f4efe6' }, 'Golden and light.', { type: 'food', food: 24, heal: 12 });
  M('fried_egg', 'Fried Egg', 'bowl', { a: '#ffffff', b: '#f4efe6', c: '#c8b8a0', e: '#ffd35a' }, 'Quick and good.', { type: 'food', food: 12, heal: 6 });
  M('mint_tea', 'Frostmint Tea', 'bowl', { a: '#a0805a', b: '#8ff5c8', c: '#3aa080', e: '#e0fff4' }, 'Clears the head: cures sickness, and heals 20.', { type: 'food', food: 3, heal: 20, cure: 'sick' });
  M('nettle_soup', 'Nettle Soup', 'bowl', { a: '#5a4030', b: '#5aa05a', c: '#2a6a3a', e: '#c8f0b0' }, 'Green and sharp. Draws out poison, and keeps it off a while.', { type: 'food', food: 24, heal: 16, buff: 'ward', stack: 20 });
  M('herb_roast', 'Herb Roast', 'meat', { a: '#c98a5a', b: '#8a4a2a', c: '#5a2a18', d: '#3a1a10', e: '#7ddc6f', w: '#f4efe6' }, 'Meat rubbed with emberleaf.', { type: 'food', food: 36, heal: 14 });
  meal('potato_soup', 'Potato Soup', 'bowl', { a: '#5a4030', b: '#e0c090', c: '#a8845a', e: '#fff1d0' }, 32, 16, 'warm', 'A boon: WARM. The cold barely touches you, for 4 minutes.');
  meal('hen_stew', 'Hen Stew', 'bowl', { a: '#5a4030', b: '#f0c080', c: '#a87050', e: '#ffd35a' }, 44, 22, 'hearty', 'A boon: HEARTY. You heal between fights and take less, for 4 minutes.');
  meal('ember_skewer', 'Ember Skewer', 'strips', { a: '#ff8a3d', b: '#c94a2a', c: '#5a2018', e: '#ffd35a' }, 34, 10, 'fierce', 'A boon: FIERCE. Your blows land harder for 3 minutes.', 10800);
  meal('cactus_stew', 'Cactus Stew', 'bowl', { a: '#5a4030', b: '#8ac06a', c: '#3a7a52', e: '#e0c090' }, 30, 14, 'sweet', 'A boon: SWEET. Stamina comes back faster for 4 minutes.');
  meal('garden_salad', 'Wild Salad', 'bowl', { a: '#a0805a', b: '#7ddc6f', c: '#3a7a52', e: '#ff6a4a' }, 16, 12, 'quick', 'A boon: QUICK. You walk faster for 4 minutes.');
  meal('pork_pie', 'Pork Pie', 'roll', { a: '#f0c070', b: '#c98a2b', c: '#8a5a22', e: '#8a4a2a' }, 54, 14, 'hearty', 'A boon: HEARTY. You heal between fights and take less, for 4 minutes.');
  meal('potato_bake', 'Potato Bake', 'bowl', { a: '#8a5a32', b: '#f0d090', c: '#c98a4a', e: '#fff1a8' }, 42, 12, 'delve', 'A boon: DELVING. You dig faster for 4 minutes.');
}
// ---- the campfire ----
R('fire', 'baked_potato', 1, { potato: 1 }, { t: 420 }); R('fire', 'roast_pork', 1, { pork: 1 }, { t: 540 }); R('fire', 'roast_fowl', 1, { fowl: 1 }, { t: 480 });
R('fire', 'fried_egg', 1, { egg: 1 }, { t: 300 }); R('fire', 'herb_roast', 1, { meat: 1, emberleaf: 1 }, { t: 600 }); R('fire', 'herb_roast', 1, { pork: 1, emberleaf: 1 }, { t: 600 });
R('fire', 'mint_tea', 1, { frostmint: 2, jug_w: 1 }, { t: 480, ret: { jug: 1 } }); R('fire', 'nettle_soup', 2, { nettle: 3, onion: 1, jug_w: 1 }, { t: 720, ret: { jug: 1 } });
R('fire', 'potato_soup', 2, { potato: 2, onion: 1, jug_w: 1 }, { t: 780, ret: { jug: 1 } }); R('fire', 'hen_stew', 2, { fowl: 1, potato: 1, onion: 1, jug_w: 1 }, { t: 900, ret: { jug: 1 } });
R('fire', 'ember_skewer', 1, { pork: 1, emberleaf: 1, onion: 1, stick: 1 }, { t: 600 }); R('fire', 'cactus_stew', 2, { cactus_flesh: 2, potato: 1, jug_w: 1 }, { t: 780, ret: { jug: 1 } });
// ---- by hand, the oven and the pot ----
R('hand', 'garden_salad', 1, { frostmint: 1, onion: 1, berries: 2 });
R('oven', 'pork_pie', 1, { flour: 2, roast_pork: 1, onion: 1 }); R('oven', 'potato_bake', 2, { potato: 3, onion: 1, salt: 1 });
R('oven', 'roast_pork', 2, { pork: 2 }); R('oven', 'roast_fowl', 2, { fowl: 2 }); R('oven', 'baked_potato', 3, { potato: 3 });
R('pot', 'venomcoat', 2, { nightshade: 3, resin: 1 }, { col: [90, 58, 138] });
// food that should not have been eaten: a sting, poison, and a sick stomach (the screen sways: see sickTick)
function badFood(p, it) {
  const b = it.bad; if (!b || !p) return;
  if (b.dmg) hurtFighter(p, b.dmg, p.x + 3, { env: 1 });
  if (b.poison) applyStatus(p, 'poison', null, { d: b.poison });
  if (b.sick) sicken(p, b.sick);
}
