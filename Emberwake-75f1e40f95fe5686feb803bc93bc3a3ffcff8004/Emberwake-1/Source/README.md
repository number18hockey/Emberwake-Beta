# Emberwake: the source

Everything needed to change the game. Building it needs only Python 3.

## Building

From this folder:

```
python3 build.py           # the game, the guide and the Mac app
python3 build.py --game    # only the game (quickest while working on it)
python3 build.py --no-app  # the game and the guide
```

It writes three things next to this folder: **Emberwake.html** (the game), **Emberwake Guide.html** and **Emberwake.app**.

`build.py` refuses to build if two files define the same name, because in one big script the second would silently replace the first. If Node.js is installed, it also checks the code for syntax errors.

## What's where

| Folder | What is in it |
| --- | --- |
| `game/` | the game's code, in the order it loads (folders and files are numbered) |
| `guide/` | the guide's chapters (Markdown) and its pictures |
| `mac/` | the Mac app's parts: the launcher, the window script, `Info.plist`, the icon |
| `tests/` | automated checks (see `tests/README.md`) |
| `tools/` | helpers for looking after the project (`guide_pictures.py` retakes the guide's pictures from the game) |

## The game's code

The game is plain JavaScript in one page, with no libraries and no image files: every sprite is drawn by code. `build.py` joins every file in `game/` into one script, folders in number order and files in number order inside each. All files share one scope, so anything one file defines, every other file can use.

| Folder | What it does |
| --- | --- |
| `01-core` | constants, math, noise, input, sound, the pixel font |
| `02-art` | sprites and textures (all drawn by code), and the kinds of tiles; `4-wilds.js` is the tree crowns (the oaks of the Mosswood, the willows of the Willowmere) |
| `03-world` | world generation, structures, the endless land, the other worlds, places to find, the surface's wonders and gates, and the four worlds past the floors; `8-traits-and-moods.js` (the three traits a seed gives a world, and the moods of its lands), `9-the-year.js` (seasons and weather), `10-curios.js` (small things on the road) and `11-weather-ways.js` (what the weather does to whoever is out in it: slow going, slick ground, breath, how far creatures see, shelter) |
| `04-items` | items and recipes, weapons, the later tiers, the benches (and which bench makes what), trinkets and meals, and the brews (in `5-trinkets-and-meals.js`) |
| `05-physics` | game state, physics bodies, particles, drops, projectiles; mining and building (and eating, which takes a moment); craters; armour; furniture and what it does |
| `06-combat` | movesets and hits, links (chains and sidearms), weapon styles, learned forms, follow-ups, counters and arts, the new worlds' weapon effects, and `6-tempo.js`: the beat (the glint, rushed blows, tempo, clean hits, clashes, guards, sunder, the answer, warded foes); `7-fire.js` is fire that burns where a flask breaks, and its flames |
| `07-fighters` | the player and the other fighters (echoes, duelists), and the run a fighter keeps through a blow or a dodge; `2-nav.js` is the pathfinder the echoes, duelists and rivals walk by |
| `08-creatures` | creatures and spawning, the guardians, world events, the offerings that wake the guardians; `7-weather-creatures.js` is the six creatures that only the weather brings out |
| `09-story` | people, leads, the journal, lore and echo stones |
| `10-interface` | menus (the accounts board among them), the HUD, the pack, crafting stations, the map, the recipe book and trinket slots |
| `11-arena-and-royale` | the Cinder Ring arena, and the Ashfall Trials (island, ashfall, loot, echoes, online play, screens; `5-the-trials.js` holds teams, hunger, favor, nights, drops, the feast and rekindling; `6-perks-amps-relics.js` the Trials' own kit; `7-parties.js` parties and the board of open matches); and the Wilds, the third arena, in `19-wilds-art.js` to `25-wilds-games.js` (its names start with `w` or `W` so they do not clash with the Trials') |
| `12-playing-together` | co-op (sharing a world), game codes, the relay |
| `13-saving` | accounts (a name and a password kept in this browser, each with its own worlds) and worlds: create, list, load, save |
| `14-main` | the sky, drawing, the game loop (a frame that goes wrong is caught and the game carries on), input, start-up; `2-atmosphere.js` is the look of the air (glow, grading, mist, each world's stars, the ember wake, timed trails); `3-touch.js` is the touch controls of a phone or tablet (their buttons are in the page in `build.py`) |

**Old worlds must not change.** The land is worked out from the seed, so any change to how it is made would move every hill in every saved world. Each world remembers which version of the land it was made with (`WORLD.land`); new rules apply only from the next version up (traits, moods and curios are land 4; the Mosswood and the Willowmere are land 5). `LAND_NEW` in `03-world/3-endless.js` is the version a world made today gets: it is 5 now. To change how land is made, raise `LAND_NEW` and make the new rule apply only from that number up. `tests/world/world_character.py` checks that older lands still come out tile for tile, and `tests/world/new_lands.py` checks the two new lands.

A new file goes after anything it uses while loading (for example, a `const` built from another file's values). Code inside functions can use anything, wherever it lives.

## Publishing on claude.ai

The game also runs as a claude.ai artifact page: publish `Emberwake.html` as its `index.html`. There the page can't reach the internet message boards, so online play (the arena, the Ashfall Trials' PLAY ONLINE, and game codes) goes through the page's own live room instead.
