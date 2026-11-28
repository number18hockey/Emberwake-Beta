// ============================================================
//  Wild plants: the tiles, what picking them gives, and their pictures.
//  (What they become in the kitchen, and the nightshade's poison, are 04-items/7-plants-and-food.js;
//   where they grow is decorNew, 03-world/8-traits-and-moods.js: only in worlds made since land 6)
//    wild potato, wild onion, frostmint, emberleaf: food and herbs for the pot
//    stinging nettle, cactus: they hurt to brush past (TP.sting; placeHazards, 03-world/5-places.js)
//    nightshade: berries that are poison
// ============================================================
const POTATO = 211, ONION = 212, MINT = 213, EMBERLEAF = 214, NETTLE = 215, NIGHTSHADE = 216, CACTUS = 217;
defT(POTATO, { name: 'Wild Potato', decor: true, hard: 1, ground: true, dust: '#6fae7a' });
defT(ONION, { name: 'Wild Onion', decor: true, hard: 1, ground: true, dust: '#c8e8a0' });
defT(MINT, { name: 'Frostmint', decor: true, hard: 1, ground: true, dust: '#8ff5c8' });
defT(EMBERLEAF, { name: 'Emberleaf', decor: true, hard: 1, ground: true, dust: '#ff8a3d' });
defT(NETTLE, { name: 'Stinging Nettle', decor: true, hard: 1, ground: true, dust: '#5aa05a', sting: 'nettle' });
defT(NIGHTSHADE, { name: 'Nightshade', decor: true, hard: 1, ground: true, dust: '#6a4aa0' });
defT(CACTUS, { name: 'Cactus', decor: true, hard: 1, ground: true, dust: '#6fae7a', sting: 'cactus' });
Object.assign(PLUCK, {
  [POTATO]: [['potato', 1, 3], ['fiber', 0, 1]], [ONION]: [['onion', 1, 2]], [MINT]: [['frostmint', 1, 2]], [EMBERLEAF]: [['emberleaf', 1, 2]],
  [NETTLE]: [['nettle', 1, 2], ['fiber', 1, 1]], [NIGHTSHADE]: [['nightshade', 1, 3], ['stick', 0, 1]], [CACTUS]: [['cactus_flesh', 1, 1]]
});
// the plants' pictures (8x8, four of each)
(function plantArt() {
  TEX[POTATO] = genTex(mask8(['........', '..#..#..', '.###.##.', '.######.', '..####..', '.######.', '..####..', '...##...'], (px, py, v) => py === 1 && hh(px, v, 401) > .3 ? '#f4efe6' : py === 2 && hh(px, v, 403) > .7 ? '#c9a0e0' : py >= 6 ? '#2c574a' : hh(px, py, 402 + v) > .55 ? '#6fae6a' : '#3a7a52'));
  TEX[ONION] = genTex((px, py, v) => { if (py >= 6) return px >= 2 && px <= 5 ? (py === 7 ? '#c8b8a0' : px === 2 ? '#e0d6c4' : '#f4efe6') : null; const s = [[2, 4, 5], [3, 4, 6], [2, 3, 5], [3, 5, 6]][v]; if (s.includes(px) && py >= 1 + ((px + v) % 3)) return py < 3 ? '#a8d878' : '#5a9a5e'; return null; });
  TEX[MINT] = genTex(mask8(['........', '........', '..#.....', '.###.#..', '..#.###.', '.##..#..', '.######.', '...##...'], (px, py, v) => py >= 7 ? '#2c574a' : hh(px, py, 411 + v) > .6 ? '#e0fff4' : py < 5 ? '#8ff5c8' : '#3aa080'));
  TEX[EMBERLEAF] = genTex(mask8(['........', '...#....', '..###...', '.#.#.#..', '.##.##..', '..###...', '...#....', '...#....'], (px, py, v) => py >= 6 ? '#4a2a1a' : hh(px, py, 421 + v) > .65 ? '#ffd35a' : py < 3 ? '#ff8a3d' : '#c94a2a'));
  TEX[NETTLE] = genTex((px, py, v) => { const s = [1, 3, 5, 6][(px + v) % 4]; if (px === s && py >= 1 + (px % 3)) return py % 2 ? '#3a7a3a' : '#5aa05a'; if ((px === s + 1 || px === s - 1) && py % 3 === (v + px) % 3 && py > 1) return hh(px, py, 431 + v) > .5 ? '#f4efe6' : '#8ac060'; return null; });
  TEX[NIGHTSHADE] = genTex((px, py, v) => { const dx = px - 3.5, dy = py - 4.6, inb = dx * dx / 14 + dy * dy / 9 < 1; if (!inb) return py === 7 && (px === 3 || px === 4) ? '#2a1c18' : null; if (hh(px, py, 441 + v) > .74) return hh(px, py, 442) > .5 ? '#2a1a4a' : '#7a5ac0'; return hh(px, py, 443 + v) > .55 ? '#24402e' : py < 4 ? '#3a5a3e' : '#18301e'; });
  TEX[CACTUS] = genTex((px, py, v) => { if (px < 2 || px > 5) return (px === 1 || px === 6) && (py + v) % 4 === 1 ? '#f4efe6' : null; if (px === 2) return '#8ac06a'; if (px === 5) return '#2c574a'; return (py + px + v) % 3 === 0 ? '#3a7a52' : '#5aa05a'; });
})();
