# No. 024 · Cities, in print: the brief for a city poster

(Dev notes, not published.) You are drawing one or more city posters for No. 024 on
mahiryavuz.com, in `/Users/mahir/code/mahir.github.io/works/024/`. Each poster is drawn on a
canvas while the visitor watches (about 14 seconds), stays a while, and the next sheet slides
over it. There will be a hundred. The owner asked for posters that are "super stylish,
detailed, very nicely animated, super polished, very pleasant to watch", each city with its
own typography and colors. Your cities, and the direction for each, are in `_plan.md`.

## Read first, fully

- `print.js`, the engine: a `Plate` has named layers of marks; each mark has `t` (start),
  `d` (duration), a `reveal` (rise, fall, wipe, wipeL, fade, pop, press, drop, slide, iris,
  draw) and an `ease`. `type()` sets a word a letter at a time. `live()` marks are redrawn
  every frame (boats, birds, lights). A `Press` plays a plate.
- `kit.js`, shared helpers: `Ground` perspective, `box`, `windows`, clouds, trees, gulls,
  sailboats, `waveLines` and the color helpers.
- Two finished posters that set the bar: `cities/new-york.js` (an engraved bird's-eye view)
  and `cities/istanbul.js` (night skyline in a tile border). Render them before you start,
  and glance at the contact sheet of the first twelve.

## What a city file is

`cities/<id>.js` exports exactly:

```js
export const city = {
  id: 'mexico-city',              // the file name
  name: 'Mexico City',            // as the page shows it (may carry accents: 'Kraków')
  alt: 'One sentence, no final period, saying what the poster shows',
  google: 'family=Bowlby+One+SC', // the Google Fonts css2 query for every face you use
  wall: '#3a2a1e',                // the wall behind the poster: dark, a color of the city
  fonts: [['400 100px "Bowlby One SC"', 'MEXICO CIUDAD'], ...], // loaded before drawing;
                                  // [font, text] pairs for non-Latin scripts and accents
  build,                          // returns a Plate
};
```

Do not name any function `city` (it collides with the export).

`alt` is read aloud to screen-reader users and printed in the page's text. Name only what is
actually drawn, by its real name, and check every name against your own code (a past poster
called the Westerkerk the Munttoren).

## The bar

- Dense and detailed like New York: hundreds of small things (windows, roof details, trees,
  people, boats, pattern, hatching) and 4 to 6 recognizable landmarks with accurate
  silhouettes. Flat silhouettes alone are not enough. Leave calm areas too.
- It must read as a real, beautiful printed poster in its tradition (see `_plan.md`), not as
  a generic vector illustration. Texture, line, border and lettering all belong to that
  tradition. Look at what you render honestly and iterate several rounds.
- It must look nothing like the other cities: different composition, palette, line, border
  and type.
- The title is part of the design: big, well kerned, set in the planned face. Use the city's
  own script where `_plan.md` says so.
- `type()` sets one character at a time, which breaks scripts whose letters join or stack
  (Arabic, Devanagari, Thai, Myanmar, Khmer): set those whole and reveal them with a wipe
  (right to left for Arabic), or one grapheme cluster at a time with `Intl.Segmenter`
  (Marrakech, Mumbai and Bangkok do this).

## The animation

- `plate.end` 12 to 16 s. Paper and sky first, then the subject built up (far to near,
  rising, wiping, pens drawing lines, things dropping into place), then details, then 2 to 6
  cheap live elements, then the title letters (around 10 to 13 s) and the last touches.
  Watch it at `at=2,5,8,11`: the build should be a pleasure in itself.
- The press bakes a layer's marks in the order they were added, and a mark is baked only
  once every earlier mark in its layer is finished. Within a layer, add marks in roughly
  increasing `t` and keep `d` under about 2 s, or later marks are redrawn every frame.
- Keep fewer than about 50 marks arriving at the same moment (Paris and Rio stutter where
  60 to 80 blocks arrive at once). Stagger them, or group many small things into one
  `p.group` or `p.strokes` mark.
- Live marks redraw every frame: keep them cheap (no big gradients or hundreds of paths).
- Clipping reveals (rise, wipe, iris) clip a mark to its box for good once baked, so give
  every mark a box that generously covers what it draws, strokes and shadows included.
- Never call a random generator inside a draw function, not even one made at build time
  (`const r = rng(7); p.group(..., (c) => { ... r.range(...) ... })` is the same bug): a mark
  is drawn every frame while it arrives, so it shimmers. Draw the numbers at build time into
  arrays and let the draw read them. The gate plays the poster frame by frame and compares
  it with a jump to the same moment, which catches this.
- Framed posters: `plate.clip` is only a rectangle. To hide what lies outside an arch or an
  oval, put the frame's wall on top layers with `{ clip: false }` and lay down, at t=0, a
  paper-colored fill of the whole sheet minus the opening (Marrakech does this).
- Keep layers few (ten to fifteen is plenty) and fill many same-colored shapes as one
  path: every layer is a full-size canvas. The press merges a run of finished layers
  without live marks into one, so a layer costs most while it still has marks arriving,
  and a layer holding a live mark is never merged: put live marks on as few layers as
  you can, high in the stack.

## Rules

- Write only your own `cities/<id>.js` files (plus scratch images in your scratch folder).
  Do not edit `print.js`, `kit.js`, `main.js`, `index.html`, `style.css`, `cities/index.js`,
  `_static.js`, the dev pages or any other city: other agents are working beside you. Put
  helpers inside your own file. If you find a real bug in the engine or kit, report it.
- Google Fonts only, and only the faces in your `google` query.
- No brands, logos or trademarks; no real people's likenesses; nothing sacred used as
  decoration (no deities, no religious figures as ornament; buildings are fine).
- American spelling in comments and English text on the poster (the city's own words in
  its own language are fine).
- Match the examples' code style: ES modules, short plain-English comments.

## Tools

- The server at http://127.0.0.1:8779/ serves the repository root (already running).
- `_one.html?city=<id>` shows the finished poster; `&at=6.5` that second; `&play` plays it.
  It loads your `google` fonts itself. Errors print top left.
- Render headless:
  `works/024/_shot.sh "http://127.0.0.1:8779/works/024/_one.html?city=<id>" <out.png> 1200 1500 20000`
  then look at the PNG with the Read tool. Keep images in your scratch folder.
- `node works/024/_gate.js <id> [<id> ...]` runs the checks every city must pass: it loads
  and builds, draws for 11 to 17 s, has every field, uses only fonts that loaded with every
  character, and draws the same finished poster twice. It also notes how many marks arrive
  at once. Your cities must pass it.

## Speed

A frame must cost well under 16 ms or the draw stutters. Time yours with
`node /private/tmp/claude-501/-Users-mahir-code-mahir-github-io/9f0900ac-f2cd-46fa-950d-ae6fdef543fa/scratchpad/bench.mjs 1400 <id>,<id>`:
it plays every frame of the draw at 1400 px and prints the median, p95 and the seconds the
slow frames fall in. Aim for a median under 11 ms and almost no frames over 16 ms. Other
agents share the machine, so numbers swing; a second run tells you whether it was you.
`_diag.html?city=<id>&at=5,6` shows what each layer is redrawing at those seconds. The usual
causes: many long-lived or out-of-order marks in one layer, too many layers, heavy live
marks (gradients, shadowBlur, hundreds of paths every frame), and an `iris` reveal on a
large stroked mark (a full-sheet guilloche or ring halo): `fade` it instead.

## Report back, briefly

For each city: the file, one sentence on the poster, its `end`, the gate's line for it, its
bench line, and anything you could not get right. Do not paste code.
