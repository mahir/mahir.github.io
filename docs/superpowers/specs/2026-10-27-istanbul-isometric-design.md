# No. 004 — Isometric Istanbul: design

*Written 2026-10-27, from a brainstorm with Mahir. Anything marked **(my call)** was decided by Claude, not by Mahir, and is open to change.*

## Intent

Mahir saw an isometric jigsaw puzzle of Istanbul (Galata Bridge, Eminönü, Karaköy and the ferries, all drawn in terracotta roofs, turquoise water and cream stone) and liked two things about it: it is **the map of Istanbul drawn isometrically**, and **the colors**. No. 004 takes that into his works series as a game: you put Istanbul back together, landmark by landmark, and watch the city grow around them.

It sits next to No. 003, *Manhattan sundial*, as another city, but unlike No. 003 it isn't tied to the clock. It's something to play with.

## What it is

An isometric, true-to-scale map of Istanbul **where the waters meet**: the Bosphorus, the Golden Horn and the Sea of Marmara. You rebuild the city's iconic landmarks on it in a short, relaxed game.

### The frame (Mahir chose this)

- **True to scale**, roughly 9 × 9 km: longitude **28.945°–29.052° E**, latitude **40.976°–41.057° N**.
- **Contents:** the historic peninsula (Sultanahmet, Eminönü, Süleymaniye), Galata, Karaköy, Beyoğlu up to about Taksim, Beşiktaş and Ortaköy on the European side; Üsküdar and Kadıköy on the Asian side; the mouth of the Golden Horn; the Bosphorus up to and including the Bosphorus Bridge; and the north edge of the Marmara.
- **Not included:** the fortresses, the second bridge, Çamlıca and the Princes' Islands are outside the frame.
- **Camera (my call):** looks roughly north-northeast from above the Marmara, so the historic peninsula is in the foreground, Galata is behind it across the Golden Horn, and the Asian side is on the right. That's close to the puzzle's view.

### View and scale (my call)

A whole 9 km frame on a phone gives about 25–30 m per pixel, which shrinks Hagia Sophia to a few pixels. Seven of the landmarks sit within roughly 2 km of each other around the mouth of the Golden Horn. The rules:

- **The geography stays true to scale:** the coastline, and where each landmark stands.
- **Landmarks are enlarged up to about 3×**, as much as needed to read, but never moved off their real spot and never overlapping a neighbor. Ordinary buildings stay near true footprint but a little taller, so the city reads as packed.
- **Opening view:** on desktop, the whole frame. On phones, the mouth of the Golden Horn (the peninsula's tip, Galata and Üsküdar), with a pinch out to see everything.
- **The camera helps you find things.** Picking up or tapping a tray piece whose outline is off-screen glides the camera to that outline. "Build it for me" moves from landmark to landmark as it builds. The last piece pulls back to the whole frame, which is the payoff view.
- **Tap and drop targets** around outlines keep a minimum on-screen size (about 44 px) at any zoom.
- **The share image and the no-WebGL still** show the whole finished frame.

### How it plays (Mahir chose this)

1. **Opening state.** The page opens on the water and bare land. Every landmark's spot shows a **faint outline** of what goes there, in the style of a sticker book.
2. **The tray.** It holds the landmark pieces. **Drag a piece onto its outline** and it settles in.
3. **Tap-to-build shortcut.** **Tap or click an outline** and its landmark builds itself, with no dragging.
4. **"Build it for me."** This button finishes everything that's left, one landmark at a time, so you can sit back and watch it rise.
5. **Placing feedback.** As each landmark lands, its **name and year** appear briefly, and a counter shows progress ("4 of 13").
6. **Neighborhoods grow around landmarks.** The land starts bare. Placing a landmark brings its neighborhood up around it: houses around Süleymaniye, Galata's streets around the tower, and so on. When every piece is in, the whole frame is built.
7. **The finish (my call).** When the last piece lands, the city comes alive: ferries cross on their real routes, gulls circle, the tram and traffic cross Galata Bridge, and fishermen line the bridge rail.
8. **Getting around.** Drag to pan, and scroll or pinch to zoom. The view never rotates (my call).

No timers, scores or wrong answers. Nobody gets stuck.

### The landmarks (13)

Positions are approximate and should be checked against OpenStreetMap. Each piece shows the year its present structure was completed, which is my call.

| Piece | Where | Year |
|---|---|---|
| Süleymaniye Mosque | 41.0162, 28.9639 | 1557 |
| Yeni Cami (New Mosque) | 41.0171, 28.9714 | 1665 |
| Galata Bridge | Eminönü 41.0175, 28.9727 → Karaköy 41.0228, 28.9737 | 1994 |
| Topkapı Palace | 41.0115, 28.9834 | 1478 |
| Hagia Sophia | 41.0086, 28.9802 | 537 |
| Blue Mosque (Sultan Ahmed) | 41.0054, 28.9768 | 1616 |
| Galata Tower | 41.0256, 28.9741 | 1348 |
| Maiden's Tower | 41.0211, 29.0041 (in the water) | 1763 |
| Dolmabahçe Palace | 41.0391, 29.0004 | 1856 |
| Ortaköy Mosque | 41.0473, 29.0270 | 1856 |
| Mihrimah Sultan Mosque, Üsküdar | 41.0270, 29.0153 | 1548 |
| Haydarpaşa Station | 40.9969, 29.0190 | 1908 |
| Bosphorus Bridge | centre about 41.045, 29.034 | 1973 |

The list can grow, but every landmark must sit inside the frame.

### Neighborhoods (my call, within Mahir's choice B)

- **Which landmark owns which land.** Every land cell in the frame belongs to the nearest landmark **on the same shore**: European peninsula, European north of the Golden Horn, or Asian. That way, placing all the land landmarks builds all the land.
  - Süleymaniye and Yeni Cami own the west and north of the peninsula.
  - The Sultanahmet three own its tip. Gülhane Park's trees come with Topkapı.
  - Galata Tower owns Karaköy, Galata and Beyoğlu, Dolmabahçe owns Beşiktaş, and Ortaköy owns the European shore up to the bridge.
  - Mihrimah owns Üsküdar and the Asian shore north toward Beylerbeyi, and Haydarpaşa owns Kadıköy and Moda.
- **Pieces that own no land.** Galata Bridge, the Bosphorus Bridge and Maiden's Tower bring life to the water and the bridges instead: boats around the tower, traffic on the bridges.
- **How a neighborhood rises.** It grows outward from its landmark, staggered, over a second or two.

## Look

- **Palette** from the puzzle: terracotta roofs in several shades, turquoise water, cream and sand walls, pale stone for mosques and palaces, grey-blue lead domes, dark cypress and plane-tree greens, white ferries with red funnels.
  - The values below were sampled from the puzzle image Mahir shared. They are a starting point, so tune them by eye in the lit scene.

  | Material | Shade | Mid | Light |
  |---|---|---|---|
  | Water | `#2d7f88` | `#33838f` | `#35909b` |
  | Terracotta roofs | `#a37149` | `#dd6a44` | `#e8845a` |
  | Deep red (accents, funnels) | `#ad5746` | `#c1381e` | — |
  | Trees | `#546647` | `#5caa3b` | `#8eb14c` |
  | Walls, ferries | `#e2e9db` | `#f6ebdc` | — |
  | Stone, sand | `#c2a87f` | `#c8bca2` | `#ebd3a3` |
  | Lead domes, roads | `#6a747c` | `#8b8f90` | `#a3aaaa` |

- **Reference image.** The puzzle is someone else's artwork, so the image itself stays out of this public repository. What we take from it:
  - the palette above
  - a high, near-isometric camera angle
  - density: buildings packed almost edge to edge, narrow streets, trees in courtyards and along the shore
  - shadows that are soft and short
- **No credit line on the page (my call),** since only the palette and spirit are borrowed.
- **Ordinary buildings** read as Istanbul: 3–6 storey blocks with hipped terracotta roofs, packed close, with some variation in height and color. Gaps along a few main roads are optional.
- **Landmarks are built in code** as simple, toy-like 3D shapes that are still instantly recognizable. Hagia Sophia's buttressed dome and four minarets, the Blue Mosque's six minarets, Süleymaniye's cascade of domes, Galata Tower's cone, Maiden's Tower on its rock, the suspension bridge. They are a little larger than true scale so they read at the default zoom.
- **Light (my call):** fixed warm afternoon light with soft shadows, like the puzzle. It doesn't follow the clock.
- **Water:** calm turquoise with a light sparkle. A few boats move on it from the start, so the opening isn't dead.

## How it's built (my calls)

- **Where it lives.** A self-contained page at `works/004/`, following `works/README.md`:
  - the `<head>` copied from No. 002 with this work's title, description and `og:` lines
  - the "← All works" pill at top left with "No. 004" and the title
  - an `og.jpg` of the finished city (1200 × 630)
  - an entry in `works.js`, then `python3 works/_build.py`
- **Rendering.** three.js, pinned to the same version No. 003 loads (`three@0.170.0` from jsDelivr through an import map), with an orthographic camera at an isometric angle. Ordinary buildings are instanced, because there will be thousands.
- **Coastline.** Taken from OpenStreetMap for the frame, simplified, and saved beside the page as a JSON file (No. 003 does the same with `city.json`).
  - The script that makes it lives in `works/004/` with a name starting with `_`, so it stays in the repo but Jekyll doesn't publish it.
  - The page credits "© OpenStreetMap contributors", as OSM's licence requires.
- **Ordinary buildings** are generated from the land cells: deterministic, seeded, with no real footprints.
- **No WebGL:** the page shows a still image of the finished city, as No. 003 does.
- **Phones.**
  - It must work on a recent phone at a smooth frame rate.
  - The tray sits along the bottom and scrolls sideways.
  - One finger pans the map. A drag that starts on a tray piece moves that piece instead.
- **Accessibility.**
  - Each tray piece is a button. Activating it from the keyboard builds that landmark, the same as tapping its outline.
  - Landmark names are readable by screen readers.
  - With reduced motion, things appear without rising animations.
- **No sound.** Nothing remembers progress between visits: each visit starts bare.

## Schedule and first version (Mahir chose the date)

No. 004 is dated **2026-10-28** in `works.js`, to keep the daily run going. Its title is **"Istanbul, piece by piece"** (my call), and its medium is "Interactive WebGL game".

**When it goes up.**
- If it's pushed before midnight New York time on the 27th, the daily Action puts it on the homepage just after midnight.
- If it's pushed during the 28th, run `python3 works/_build.py` before pushing, or run the Action by hand, so the homepage follows.
- The work's own page goes public as soon as it's pushed, whatever its date.

**The first version has the whole game loop.**
- the frame and coastline
- the 13 landmarks with outlines, the tray, drag-to-place, tap-to-build and "Build it for me"
- the counter, and names with years
- neighborhoods growing
- pan and zoom on desktop and phones, and the camera glides
- the finish with ferries and gulls
- the "← All works" pill, the OSM credit, the share image and the no-WebGL still
- the `works.js` entry

**These can wait for a later pass:**
- the tram, traffic and fishermen on Galata Bridge
- richer landmark models
- extra landmarks

## Goals

- It reads as Istanbul at a glance, in the puzzle's palette.
- A relaxed game: finish it in a couple of minutes, or press one button and watch.
- Watching the city grow from bare land to the full view is the payoff.
- Works on desktop and phones.

## Non-goals

- All of Istanbul, or the full length of the Bosphorus.
- Real building footprints, street networks or elevation.
- Live time of day or weather. That was No. 003's idea.
- Scores, timers, levels, saved progress, rotation or sound.

## Anti-goals (a failure even if it works)

- **It looks like a copy of the puzzle's artwork.** We take its palette and its spirit, not its drawing or composition.
- **It feels like work:** someone gets stuck, or can't find where a piece goes.
- **It's a generic low-poly town** that could be anywhere.
- **The geography makes someone from Istanbul wince:** a landmark on the wrong shore, or the Golden Horn in the wrong place.
- **It's slow or janky on a phone.**

## Left to the builder

- **Grid and rendering details:** cell size and building density, as long as the finished city looks packed like the puzzle and stays smooth on phones.
- **The landmark models:** exact shapes, and how the outlines are drawn.
- **Placing rules:** the snap tolerance for drops, and what a wrong drop does (it floats back to the tray).
- **Animation details:** timing and easing for rises, ferry routes and boat counts.
- **Layout details:** the order of pieces in the tray, the hint text, and the size of the counter and the "Build it for me" button.
