# No. 004 Istanbul, piece by piece — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship works/004, an isometric Istanbul game in which you put 13 landmarks back on a true-to-scale map and each one raises its neighborhood. It is dated 2026-10-28.

**Architecture:**
- **Coastline data.** A one-off Python script turns OpenStreetMap coastline into a 40 m land/water grid labelled by shore (`land.json`).
- **Pure logic.** These modules are tested with `node --test`: projection, landmarks, neighborhoods and buildings, game state, ferry routes.
- **Rendering and UI.** three.js modules draw the scene and run the tray and gestures. They are verified in the browser.
- **The page.** The work follows `works/README.md` like No. 003.

**Tech Stack:** three.js 0.170.0 (import map, jsDelivr, OrbitControls from addons), plain ES modules, Python 3.9 stdlib, Node 25 test runner, headless Chrome for the share image.

**Spec:** `docs/superpowers/specs/2026-10-27-istanbul-isometric-design.md`

## Global Constraints

- **Branch.** All work happens on branch `works/004-istanbul`, cut from `master`. Merging to `master` and pushing need Mahir's go-ahead in chat.
- **Folder layout.** Everything lives in `works/004/`. Files and folders starting with `_` (`_coast.py`, `_test_coast.py`, `_test/`) are tools and tests. Jekyll does not publish them.
- **Absolute paths for the page's own references.** The homepage is a copy of this page served at `/`, so the HTML uses absolute paths: `/works/004/main.js`, `/works/004/still.jpg`. Data loads with `new URL('./land.json', import.meta.url)`.
- **Relative paths between modules** (`./geo.js`), so the same files run in Node tests and in the browser.
- **Pure modules never import `three`.** These are `geo.js`, `landmarks.js`, `city.js`, `game.js` and `routes.js`. Only `scene.js`, `models.js`, `life.js`, `ui.js` and `main.js` touch three or the DOM.
- **Frame:** west 28.945, south 40.976, east 29.052, north 41.057.
- **Projection:** `MX = 111320 * cos(((40.976 + 41.057) / 2)°)` and `MY = 110950` metres per degree. The same constants are used in Python and JS.
- **Grid:** 40 m cells. Row 0 is the north edge.
- **Region codes:** `0` water, `1` historic peninsula, `2` European side north of the Golden Horn, `3` Asian side.
- **Python 3.9.** No `match`, and no `X | Y` type hints.
- **Copy:**
  - title "Istanbul, piece by piece" (Claude's call; Mahir may rename)
  - hint "Drag a landmark onto its outline, or tap an outline to build it."
  - button "Build it for me"
  - counter "N of 13"
  - toast "Name · year"
  - credit "Coastline © OpenStreetMap contributors", linking to https://www.openstreetmap.org/copyright
- **Fonts:** Archivo and IBM Plex Mono, with the same Google Fonts link as `works/003/index.html:118`.
- **Palette:** the spec's Look table. The page background is `#f3ead9`.
- **No sound, no saved progress, no rotation.**

## Review Focus

1. **Gesture conflict on phones.** A one-finger drag that starts on a tray piece moves the piece and never pans the map. A second finger during a piece drag cancels the drag and returns the piece. *Owned by Task 7, Step 4.*
2. **Drops in the wrong place.** A drop off target, over the tray or button, or outside the canvas sends the piece back to the tray with no error and no placement. *Owned by Task 7, Step 4.*
3. **Double placement.** Tapping "Build it for me" twice, during a drag, or during another landmark's rise never places a landmark twice. The counter never passes 13, and the button disables when all are placed. *Owned by Task 3 (unit test) and Task 7, Step 4.*
4. **Resize and rotation.** Resizing the window or turning a phone keeps the aspect right and the zoom and pan clamped. At 360 px wide, the tray and the button don't overlap. *Owned by Task 5, Step 5 and Task 7, Step 4.*
5. **Homepage copy and no WebGL.** At `/?on=2026-10-28`, after `_build.py`, the scene loads from the homepage copy. With WebGL off, the still and the landmark list show and nothing throws. *Owned by Task 9, Step 5.*

---

### Task 1: Coastline grid from OpenStreetMap

**Files:**
- Create: `works/004/_coast.py`, `works/004/_test_coast.py`
- Generates: `works/004/land.json`

**Interfaces:**
- Produces `land.json`:
  ```json
  {"frame":[28.945,40.976,29.052,41.057],"cell":40,"cols":225,"rows":225,"rows_n_to_s":["00011122…", "…"]}
  ```
  Each string has length `cols`, and each character is a region code.
- In `_coast.py`:
  - `project(lat, lon) -> (x, y)`: metres east of west and north of south
  - `bucket(ways, size) -> dict`
  - `land_side(px, py, buckets) -> bool`
  - `rasterize(ways, cell) -> list[list[bool]]` (rows north to south)
  - `remove_specks(grid, min_cells=6) -> grid`
  - `label(grid, seeds: dict[code, (row, col)]) -> list[str]`

- [ ] **Step 1: Branch, then write the failing tests** in `_test_coast.py`, using `unittest` and runnable as a script. A "way" is a list of `(x, y)` metre points. OSM coastline keeps land on the **left** of the way's direction.

```python
class T(unittest.TestCase):
    def square(self, x0, y0, s):  # counter-clockwise ring: land inside (left)
        return [(x0, y0), (x0 + s, y0), (x0 + s, y0 + s), (x0, y0 + s), (x0, y0)]
    def test_inside_is_land_outside_is_water(self):
        b = coast.bucket([self.square(100, 100, 200)], 50)
        self.assertTrue(coast.land_side(200, 200, b))
        self.assertFalse(coast.land_side(50, 50, b))
    def test_near_a_convex_corner_outside_is_water(self):
        b = coast.bucket([self.square(100, 100, 200)], 50)
        self.assertFalse(coast.land_side(95, 95, b))     # nearest point is the shared vertex (100,100)
        self.assertTrue(coast.land_side(105, 105, b))
    def test_specks_removed(self):
        g = [[False] * 5 for _ in range(5)]; g[2][2] = True              # lone land cell
        self.assertFalse(coast.remove_specks(g, 6)[2][2])
        g = [[True] * 5 for _ in range(5)]; g[2][2] = False              # lone water cell
        self.assertTrue(coast.remove_specks(g, 6)[2][2])
    def test_label_by_seed_and_drop_unseeded(self):
        g = [[c in (0, 1) for c in range(6)] for _ in range(3)]          # columns 0-1 land
        g[1][4] = True                                                   # unseeded land cell
        rows = coast.label(g, {'1': (0, 0)})                             # seed as (row, col)
        self.assertEqual(rows[0][:2], '11'); self.assertEqual(rows[1][4], '0')
```

- [ ] **Step 2: Run them and see them fail**
  - Run: `python3 works/004/_test_coast.py`
  - Expected: `ModuleNotFoundError: No module named '_coast'` or `AttributeError`.

- [ ] **Step 3: Implement `_coast.py`.** The approach was proven in a spike: an ASCII preview showed the Golden Horn, the Bosphorus mouth, the peninsula, Üsküdar and Kadıköy in place.
  - **Fetching.** POST to `https://overpass-api.de/api/interpreter` with User-Agent `mahiryavuz.com works/004 coastline`. The query is `[out:json][timeout:50];way["natural"="coastline"](40.966,28.935,41.067,29.062);out geom;`, which is the frame plus a 0.01° margin, so ways run past the edges.
  - **`bucket(ways, size)`:** a dict from `(floor(x/size), floor(y/size))` to the list of segments touching that bucket.
  - **`land_side`.** Find the nearest segment by searching rings of buckets outward until a hit is found, then one ring more. The point is land if it lies left of that segment: `cross = dx*(py-ay) - dy*(px-ax) > 0`.
    - Ties at a shared vertex (equal distance to within 1e-6 m²) go to the segment with the larger `abs(cross)/len`.
  - **`rasterize`.** Cell `(r, c)` is sampled at its centre: `x = (c+.5)*cell`, `y = HEIGHT - (r+.5)*cell`.
  - **`remove_specks`.** Flood fill, 4-connected: land components under `min_cells` become water, and water components under `min_cells` become land.
  - **`label(grid, seeds)`.** Flood-fill each land component. It takes the code of the seed it contains, and any component without a seed becomes `0`.
    - The seeds are Süleymaniye `(41.0162, 28.9639)` → `'1'`, Galata Tower `(41.0256, 28.9741)` → `'2'` and Mihrimah `(41.0270, 29.0153)` → `'3'`. Each is converted to (row, col). If a seed falls on water, snap it to the nearest land cell within 3 cells.
  - **`main()`.**
    - Fetch, project, rasterize, clean and label.
    - Assert that every land landmark has its expected region at the nearest land cell within 120 m. Use the coordinates in Task 2's table: region 1 for the five peninsula landmarks, 2 for Galata Tower, Dolmabahçe and Ortaköy, 3 for Mihrimah and Haydarpaşa.
    - Write `land.json` with no whitespace, and print a 96 × 48 ASCII preview.

- [ ] **Step 4: Run the tests and see them pass**
  - Run: `python3 works/004/_test_coast.py`
  - Expected: `OK`, 4 tests.

- [ ] **Step 5: Generate and check the grid**
  - Run: `python3 works/004/_coast.py`
  - Expected: no assertion error. The preview shows the Golden Horn running northwest from the middle, the Bosphorus running north-northeast, and the Marmara along the south. `land.json` is about 50 KB, with `cols` and `rows` both 225.

- [ ] **Step 6: Commit**
  - `git add works/004/_coast.py works/004/_test_coast.py works/004/land.json`
  - Commit message: "No. 004: coastline grid from OpenStreetMap"

### Task 2: Projection, land grid and landmarks

**Files:**
- Create: `works/004/geo.js`, `works/004/landmarks.js`, `works/004/_test/geo.test.js`

**Interfaces:**
- Produces from `geo.js`:
  - `FRAME`, `MX`, `MY`, `WIDTH`, `HEIGHT` (metres, about 8987 each)
  - `toLocal(lat, lon) -> {x, y}`
  - `toWorld(lat, lon) -> {x, z}`, where `x = local.x - WIDTH/2` and `z = HEIGHT/2 - local.y`. So +x is east and +z is south.
  - `parseLand(json) -> Land`. Land is `{cols, rows, cell, region: Uint8Array /* row-major, north row first */, index(x, z) -> i | -1, regionAt(x, z) -> 0..3, center(i) -> {x, z}}`. The centre of cell `(r, c)` is `x = (c+.5)*cell - WIDTH/2` and `z = (r+.5)*cell - HEIGHT/2`.
- Produces from `landmarks.js`: `LANDMARKS`, an array in tour order (this is also the tray order and the order "Build it for me" uses). Each entry is `{id, name, year, lat, lon, region, ownsLand}`. Bridges also have `from: [lat, lon]` and `to: [lat, lon]`, and their `lat`/`lon` is the midpoint.

| id | name | year | lat, lon | region | ownsLand |
|---|---|---|---|---|---|
| hagia-sophia | Hagia Sophia | 537 | 41.0086, 28.9802 | 1 | yes |
| blue-mosque | Blue Mosque | 1616 | 41.0054, 28.9768 | 1 | yes |
| topkapi | Topkapı Palace | 1478 | 41.0115, 28.9834 | 1 | yes |
| yeni-cami | Yeni Cami | 1665 | 41.0171, 28.9714 | 1 | yes |
| suleymaniye | Süleymaniye Mosque | 1557 | 41.0162, 28.9639 | 1 | yes |
| galata-bridge | Galata Bridge | 1994 | from 41.0175, 28.9727 to 41.0228, 28.9737 | 0 | no |
| galata-tower | Galata Tower | 1348 | 41.0256, 28.9741 | 2 | yes |
| dolmabahce | Dolmabahçe Palace | 1856 | 41.0391, 29.0004 | 2 | yes |
| ortakoy | Ortaköy Mosque | 1856 | 41.0473, 29.0270 | 2 | yes |
| bosphorus-bridge | Bosphorus Bridge | 1973 | from 41.0488, 29.0264 to 41.0418, 29.0424 | 0 | no |
| mihrimah | Mihrimah Sultan Mosque | 1548 | 41.0270, 29.0153 | 3 | yes |
| maidens-tower | Maiden's Tower | 1763 | 41.0211, 29.0041 | 0 | no |
| haydarpasa | Haydarpaşa Station | 1908 | 40.9969, 29.0190 | 3 | yes |

Check the Bosphorus Bridge ends against OSM with a one-off Overpass query: `way["bridge"]["name"~"15 Temmuz"](41.03,29.01,41.06,29.05);out geom;`. If they're more than 100 m off, correct the table.

- [ ] **Step 1: Write the failing tests** in `_test/geo.test.js`, using `node:test` and `node:assert/strict`:

```js
test('frame corners', () => {
  assert.deepEqual(toLocal(40.976, 28.945), { x: 0, y: 0 });
  const ne = toLocal(41.057, 29.052);
  assert.ok(Math.abs(ne.x - 8987) < 5 && Math.abs(ne.y - 8987) < 5);
  const c = toWorld(41.0165, 28.9985); assert.ok(Math.abs(c.x) < 1 && Math.abs(c.z) < 1);
  assert.ok(toWorld(41.05, 29).z < 0);  // north is -z
});
test('parseLand fixture', () => {
  const L = parseLand({ cell: 40, cols: 3, rows: 2, rows_n_to_s: ['013', '200'] });
  const p = L.center(2); assert.equal(L.regionAt(p.x, p.z), 3);
  assert.equal(L.region[3], 2); assert.equal(L.index(1e6, 0), -1);
});
test('real land.json: landmarks on their shore', () => {
  const L = parseLand(JSON.parse(readFileSync(new URL('../land.json', import.meta.url))));
  assert.equal(L.cols, 225);
  for (const m of LANDMARKS.filter((m) => m.ownsLand)) {
    // within 120 m: the nearest land cell around the landmark is on its shore
    assert.equal(nearestLandRegion(L, toWorld(m.lat, m.lon), 120), m.region, m.id);
  }
});
test('landmarks table', () => {
  assert.equal(LANDMARKS.length, 13);
  assert.equal(new Set(LANDMARKS.map((m) => m.id)).size, 13);
  for (const m of LANDMARKS) assert.ok(m.lat > FRAME.south && m.lat < FRAME.north && m.lon > FRAME.west && m.lon < FRAME.east, m.id);
});
```

  `nearestLandRegion` is a helper in the test file. It scans the cells within the radius and returns the region of the nearest non-zero one.

- [ ] **Step 2: Run and see them fail**
  - Run: `node --test "works/004/_test/*.test.js"`
  - Expected: FAIL, because a module is not found.

- [ ] **Step 3: Implement `geo.js` and `landmarks.js`** to the interfaces above.

- [ ] **Step 4: Run and see them pass**
  - Run: `node --test "works/004/_test/*.test.js"`
  - Expected: all pass.

- [ ] **Step 5: Commit**
  - Commit message: "No. 004: projection, land grid and landmarks"

### Task 3: Neighborhoods, buildings, game state and ferry routes

**Files:**
- Create: `works/004/city.js`, `works/004/game.js`, `works/004/routes.js`, `works/004/_test/city.test.js`, `works/004/_test/game.test.js`

**Interfaces:**
- Consumes `parseLand`, `toWorld` and `LANDMARKS` from Task 2.
- Produces from `city.js`:
  - `mulberry32(seed) -> () => number`
  - `assignOwners(land, landmarks) -> Int16Array`. For each cell it gives the index into `landmarks` of the nearest landmark with `ownsLand` and the same region as the cell, measured in world metres. Water cells get `-1`.
  - `makeCity(land, owners, landmarks, seed = 4) -> {houses, trees}`:
    - `House = {x, z, w, d, h, roof: 0..3, wall: 0..2, owner, delay}`
    - `Tree = {x, z, r, owner, delay}`
- Produces from `game.js`:
  - `createGame(ids) -> {place(id) -> boolean, isPlaced(id), remaining() -> string[] /* in ids order */, count() -> {placed, total}, done() -> boolean, on(type, fn)}`. Events are `'place'` with `{id, placed, total}`, and `'done'`, which fires once.
  - `onTarget(point, target, radius) -> boolean`, comparing x/z distance against the radius.
- Produces from `routes.js`: `ROUTES`, an array of `{id, stops: [[lat, lon], …]}`:
  - `eminonu-kadikoy`: (41.0178, 28.9745) → (41.0145, 28.9950) → (40.9935, 29.0225)
  - `eminonu-uskudar`: (41.0178, 28.9745) → (41.0265, 29.0128)
  - `karakoy-kadikoy`: (41.0215, 28.9790) → (41.0120, 29.0000) → (40.9935, 29.0225)
  - `besiktas-uskudar`: (41.0410, 29.0055) → (41.0265, 29.0128)
  - Add or move waypoints until the water test passes. The piers sit at the shore, so the test allows 80 m at each end.

**Values the spec leaves to Claude, fixed here:**

| Constant | Value |
|---|---|
| `HOUSE_CHANCE` | 0.82 |
| `TREE_CHANCE` | 0.08 |
| Storeys | 3–6 × `STOREY` 3.2 m × `HEIGHT_SCALE` 2 |
| Footprint `w`, `d` | `cell * (0.72 + 0.2 * rnd())` |
| `CLEAR` | 150 m (no houses or trees this close to an owning landmark) |
| Gülhane Park | every land cell within 260 m of (41.0130, 28.9813) becomes a tree, never a house |
| `delay` | `Math.min(2, distanceToOwner / 1500)` seconds |

- [ ] **Step 1: Write the failing tests.**

  In `city.test.js`, the fixture land is two regions side by side: columns 0–4 are region 1 and columns 5–9 are region 3. Landmark A is region 1 at the far left. Landmark B is region 3 at column 5, which makes it nearer to column 4 than A is. Landmark C has `ownsLand: false`.

```js
test('owners: nearest landmark on the same shore', () => {
  const o = assignOwners(L, [A, B, C]);
  assert.equal(o[L.index(colX(4), rowZ(0))], 0);       // B is nearer, but on the other shore
  assert.ok(![...o].includes(2));                       // non-owning landmarks own nothing
  assert.equal(o[waterIndex], -1);
});
test('city is deterministic, staggered and clear around landmarks', () => {
  const a = makeCity(L, o, ls, 4), b = makeCity(L, o, ls, 4);
  assert.deepEqual(a, b);
  for (const h of a.houses) { assert.ok(h.delay >= 0 && h.delay <= 2); assert.ok(dist(h, ls[h.owner]) >= 150); }
});
test('real map: every land cell has an owner', () => {
  const o = assignOwners(realLand, LANDMARKS);
  realLand.region.forEach((r, i) => assert.equal(o[i] === -1, r === 0));
});
test('ferry routes stay on water', () => {
  for (const r of ROUTES) for (const p of sampleEvery(r.stops, 40).filter(awayFromEnds(80))) assert.equal(realLand.regionAt(p.x, p.z), 0, r.id);
});
```

  In `game.test.js`:

```js
test('place once, count, done fires once', () => {
  const g = createGame(['a', 'b']); let done = 0; g.on('done', () => done++);
  assert.equal(g.place('a'), true); assert.equal(g.place('a'), false); assert.equal(g.place('zzz'), false);
  assert.deepEqual(g.count(), { placed: 1, total: 2 }); assert.deepEqual(g.remaining(), ['b']);
  g.place('b'); g.place('b'); assert.equal(done, 1); assert.equal(g.done(), true);
});
test('onTarget', () => { assert.ok(onTarget({ x: 3, z: 4 }, { x: 0, z: 0 }, 5)); assert.ok(!onTarget({ x: 3, z: 4.1 }, { x: 0, z: 0 }, 5)); });
```

- [ ] **Step 2: Run and see them fail**
  - Run: `node --test "works/004/_test/*.test.js"`
  - Expected: FAIL.

- [ ] **Step 3: Implement `city.js`, `game.js` and `routes.js`** to the interfaces and constants above.

- [ ] **Step 4: Run and see them pass**
  - Run: `node --test "works/004/_test/*.test.js"`
  - Expected: all pass.

- [ ] **Step 5: Commit**
  - Commit message: "No. 004: neighborhoods, buildings, game state, ferry routes"

### Task 4: Page shell, scene, camera and land

**Files:**
- Create: `works/004/index.html`, `works/004/main.js`, `works/004/scene.js`, `.claude/launch.json` (local only, not committed)

**Interfaces:**
- Consumes everything from Tasks 2 and 3.
- Produces from `scene.js`: `startScene(canvas, {land, landmarks, city, owners, reducedMotion, small}) -> Promise<Scene>`. Scene provides:
  - `glideTo(target /* id | 'all' | 'start' */, {duration}) -> Promise`
  - `screenToGround(clientX, clientY) -> {x, z} | null`
  - `pxToMetres(px) -> number`
  - `pickOutline(clientX, clientY) -> id | null`
  - `controls`, the OrbitControls, so the UI can turn panning off during a piece drag
  - `three`, `scene`, `onFrame(fn)`
- Task 5 adds `showOutline(id, on)` and `placeLandmark(id, {animate}) -> Promise`.

- [ ] **Step 1: Write `index.html`.**
  - **Head.** Copy lines 1–5 and the `<!-- page:head -->` block from `works/002/index.html:1-115`, then change:
    - title: "Mahir Yavuz · Istanbul, piece by piece"
    - description: "Istanbul, piece by piece, No. 004 by Mahir Yavuz: put Istanbul's landmarks back where the Bosphorus meets the Golden Horn, and watch the city grow around them."
    - canonical and `og:url`: `https://mahiryavuz.com/works/004/`
    - `og:title`: "Istanbul, piece by piece · Mahir Yavuz"
    - `og:description`: "No. 004: rebuild Istanbul landmark by landmark, and watch each neighborhood rise around it."
    - `og:image`: `…/works/004/og.jpg`
    - `og:image:alt`: "An isometric model of Istanbul where the Bosphorus meets the Golden Horn: terracotta roofs around domes and minarets, ferries on turquoise water"
    - `theme-color`: `#f3ead9`
    - Leave the `gen:ld` block empty. The build fills it.
  - **Body:**
    - `<canvas id="scene">` and `<figure class="still"><img src="/works/004/still.jpg" alt=""></figure>`
    - a nav copying `works/003/index.html:260-264`, with the label "No. 004 · Istanbul, piece by piece, 2026"
    - `#count` at top right
    - `<ol id="tray">` with buttons at the bottom, which `ui.js` fills
    - `<button id="build">Build it for me</button>`
    - `#hint`, `#toast`, `<p class="sr-only" id="live" aria-live="polite">`
    - the OSM credit link at bottom left
    - `<section class="about">` with an `h1`, one sentence, and a `<ul>` of the 13 landmark names with years. Screen readers and no-JS readers see it; the page shows it visually only when `.no-js` or `.no-gl` is set, following `works/003/index.html:216-228`.
  - **Scripts:**
    - the import map from `works/003/index.html:313-320`
    - `<script type="module" src="/works/004/main.js">`
    - exactly one `</body>`

- [ ] **Step 2: Write `scene.js`'s base.**
  - **Renderer** as in `works/003/index.html:648-655`: pixel ratio capped at 1.5 on small screens and 1.75 elsewhere, PCF soft shadows. The shadow map is 2048, or 1024 when `small`.
  - **Camera.** An `OrthographicCamera` looking toward heading 20° (north-northeast) from 40° above the horizon. The camera offset from the target is the direction `(-sin20°·cos40°, sin40°, cos20°·cos40°)`.
  - **Lights.** A `HemisphereLight` (`#fff6e6` / `#9c8a6a`) plus a warm `DirectionalLight` (`#fff1dc`) from the west-southwest at 35°.
  - **Water.** A plane covering the frame plus 600 m, at y = 0, in `#33838f`. Use `MeshStandardMaterial` with roughness 0.35, so the sun leaves a soft sheen: the spec's "light sparkle".
  - **Land.** One `InstancedMesh` of 40 × 6 × 40 m boxes at y = 3, one per land cell, in `#e9dbbd` with no per-region colour. The frame edge gets slab sides 60 m deep in darker sand and water tones, like the mockup's diorama edge.
  - **Controls.** OrbitControls with `enableRotate = false`, `screenSpacePanning = true`, `mouseButtons.LEFT = PAN`, and touches `ONE: PAN`, `TWO: DOLLY_PAN`. On `change`, clamp the target to the frame.
  - **Zoom limits.** The visible height runs from 500 m to 11,000 m.
  - **Opening view.** Desktop: the whole frame. Small screens (shorter side under 700 px): centre on (41.0190, 28.9850) with a visible height of 2,600 m.
  - **`glideTo`.** Tween the target and zoom over `duration`, default 900 ms. It's instant under reduced motion. Targets: a landmark is framed at a 1,400 m visible height, `'all'` frames the whole frame, and `'start'` returns to the opening view.
  - **`resize()`** on `resize` and `orientationchange`.

- [ ] **Step 3: Write `main.js`.**
  - Replace `no-js` with `js`.
  - Load `land.json`, then call `parseLand`, `assignOwners`, `makeCity` and `startScene`.
  - On any error, add `no-gl` to `<html>` and stop.
  - Read the URL flags `?built` and `?still`; Task 9 uses them.
  - After two frames, add `ready`.

- [ ] **Step 4: Serve and look.**
  - Create `.claude/launch.json` with `{"version":"0.0.1","configurations":[{"name":"site","runtimeExecutable":"python3","runtimeArgs":["-m","http.server","8000"],"port":8000}]}`, start it with `preview_start`, and open `/works/004/`.
  - Expected: the water, the sand-coloured land and the frame's slab edge are visible. The Golden Horn opens to the upper left and the Bosphorus runs up and to the right, with the Asian side on the right. There are no console errors.

- [ ] **Step 5: Check phones and resizing (Review Focus 4).**
  - Use `resize_window` at the mobile preset, then reload. Expected: it opens on the Golden Horn mouth, and one-finger pan and pinch zoom clamp at the frame edge.
  - Switch to tablet, then back to desktop. Expected: the image is never stretched.

- [ ] **Step 6: Commit**
  - `git add works/004/index.html works/004/main.js works/004/scene.js`
  - Commit message: "No. 004: page, scene and land"

### Task 5: Landmark models, outlines and growing neighborhoods

**Files:**
- Create: `works/004/models.js`
- Modify: `works/004/scene.js`

**Interfaces:**
- Produces from `models.js`:
  - `PALETTE`: the spec's Look table as hex numbers
  - `buildLandmark(THREE, landmark) -> THREE.Group`: origin at the landmark's ground centre, metres, +x east
  - `buildOutline(THREE, landmark) -> THREE.Group`
- Produces from `scene.js`:
  - `showOutline(id, on)`
  - `placeLandmark(id, {animate = true}) -> Promise`. It resolves when the landmark and its neighborhood have finished rising.

**Model targets.** Sizes are the rendered size, already enlarged per the spec (up to 3×). Exact shapes are up to the builder.

| id | must read as | footprint × height (m) |
|---|---|---|
| hagia-sophia | big flattened dome on a square block, two half-domes, buttresses, 4 slim minarets; walls `#d7a07a` | 240 × 200, dome to 150 |
| blue-mosque | stepped cascade of grey domes, **6** minarets | 240 × 220, minarets 190 |
| suleymaniye | great central dome over a cascade, 4 minarets at the corners of the courtyard | 260 × 220, minarets 200 |
| yeni-cami | central dome and cascade on a raised base by the water, 2 minarets | 160 × 140 |
| topkapi | low courtyards and long roofs, the Tower of Justice with its conical cap, trees | 360 × 260 |
| galata-tower | stone cylinder with a grey cone cap and a ring of windows at the top | Ø 60, height 190 |
| dolmabahce | long white façade along the shore, a central block slightly taller | 520 × 120, height 60 |
| ortakoy | small white mosque at the water's edge, 2 minarets | 110 × 110 |
| mihrimah | dome on a block, 2 minarets, small courtyard | 160 × 150 |
| haydarpasa | U-shaped stone station with two conical-roofed corner towers, on the water | 200 × 120, towers 90 |
| maidens-tower | a rock islet, a white low building and a slim tower with a lead cone | Ø 90, tower 110 |
| galata-bridge | a flat deck between its true ends, 60 m wide, on low piers, with a lower level of arches | true length |
| bosphorus-bridge | 2 towers 260 m high near each end, a deck at 100 m, catenary main cables and hangers | true length |

- **Outlines.** A translucent cream (`#fffaf0`, opacity 0.55) footprint plate at y = 7, a dashed brown `#6b5444` loop around it, and a pale silhouette of the model (the same group with a translucent white material, opacity 0.25), gently pulsing in opacity unless reduced motion is on.
- **Neighborhood rendering.** One `InstancedMesh` for walls (`BoxGeometry`), one for roofs (`ConeGeometry(…, 4)` rotated 45°, a hip roof) and one for trees (`IcosahedronGeometry(1, 0)`). Colours come from `PALETTE` through `setColorAt`. Instances start at scale 0.
- **`placeLandmark`.**
  - Add the model and remove its outline.
  - Raise the model from y = −height to 0 over 700 ms with a small overshoot.
  - Then raise each house and tree of that owner from scale 0 to 1, starting at its `delay`, each over 400 ms.
  - Each frame, update only the instances that are still rising, then call `instanceMatrix.needsUpdate`.
  - With reduced motion or `animate: false`, everything snaps into place.

- [ ] **Step 1: Write `models.js`** to the table.

- [ ] **Step 2: Add the outlines, the neighborhood meshes and `placeLandmark`** to `scene.js`. Show every outline at the start.

- [ ] **Step 3: Check every model.**
  - With the dev console in the browser pane, call `place` on every landmark through the scene object (`window.__scene` in dev only; remove it before commit). Glide to each landmark and take a screenshot.
  - Expected: each one is recognisable at its glide zoom, none overlaps a neighbor, Galata Bridge and the Bosphorus Bridge land exactly on their shores, and Maiden's Tower stands in the water off Üsküdar.

- [ ] **Step 4: Check the finished city.**
  - Use `glideTo('all')` and take a screenshot.
  - Expected: all the land is built, it reads as densely packed terracotta, Gülhane is green beside Topkapı, and there are no houses inside landmark footprints.
  - Check the frame rate on the mobile preset with `renderer.info` and the frame time in the console: under 20 ms per frame on desktop.

- [ ] **Step 5: Commit**
  - Commit message: "No. 004: landmark models, outlines, growing neighborhoods"

### Task 6: Life on the water

**Files:**
- Create: `works/004/life.js`
- Modify: `works/004/scene.js`, `works/004/main.js`

**Interfaces:**
- Consumes `ROUTES` from Task 3 and `toWorld`.
- Produces `createLife(THREE, scene, {reducedMotion}) -> {update(dt), finish()}`:
  - From the start, 6 small boats drift slowly along short loops near the shore.
  - `finish()` adds the 4 ferries, which shuttle along `ROUTES` with a 25-second crossing and a 4-second pause at each pier, plus 12 gulls circling over Eminönü and Karaköy.
  - With reduced motion, boats and ferries are placed but don't move, and the gulls are left out.
  - **Ferry model:** a white hull 90 × 20 m, a cream upper deck and one red funnel (`PALETTE` deep red). It faces its direction of travel.

- [ ] **Step 1: Implement `life.js`,** hook `update` into the scene's frame loop, and call `finish()` from `main.js` on the game's `'done'` event.

- [ ] **Step 2: Check it.**
  - Place all the landmarks from the console.
  - Expected: ferries leave their piers, cross without touching land and turn at each end, and gulls circle over the bridge.
  - Reload with reduced motion emulated (DevTools rendering setting, or `matchMedia` overridden in the console before boot). Expected: nothing moves.

- [ ] **Step 3: Commit**
  - Commit message: "No. 004: boats, ferries and gulls"

### Task 7: Tray, gestures, build button and feedback

**Files:**
- Create: `works/004/ui.js`
- Modify: `works/004/index.html` (styles), `works/004/main.js`

**Interfaces:**
- Consumes `createGame`, `onTarget`, `LANDMARKS`, and the Scene from Tasks 4 and 5.
- Produces `startUI({game, scene, landmarks, reducedMotion})`.

**Behaviour:**
- **Tray.** One `<button>` per remaining landmark, in `LANDMARKS` order. Each shows a small icon (a CSS-drawn glyph, or the model rendered once to a 96 px canvas) and the name. The tray scrolls sideways on small screens.
- **Dragging a piece.**
  - On `pointerdown` on a tray button, capture the pointer and set `controls.enabled = false`.
  - A floating ghost (the icon) follows the pointer, and `scene.glideTo(id)` brings its outline into view if it's off-screen.
  - **Drop.** Let `p = scene.screenToGround(...)`. If `onTarget(p, toWorld(lm), max(130, scene.pxToMetres(44)))`, the piece is placed. Otherwise the ghost animates back to its tray slot over 250 ms.
  - Either way, re-enable `controls`.
  - A second pointer (`pointerdown` with another `pointerId`) or `pointercancel` cancels the drag the same way.
- **Click versus drag.** A tray button tap with less than 6 px of movement, or Enter/Space, glides to that outline and builds it.
- **Tapping an outline.** A canvas tap (less than 6 px of movement) that `pickOutline` hits builds that landmark.
- **Building.** Each build calls `game.place(id)` first and stops if it returns false. Only after that does it call `scene.placeLandmark(id)`.
- **On each `place` event:**
  - remove the tray button
  - update `#count` to "N of 13"
  - show `#toast` "Name · year" for 2.4 s
  - set `#live` to "Name placed, N of 13"
  - hide `#hint` after the first placement
- **"Build it for me."**
  - Disable the button.
  - For each id in `game.remaining()`: glide to it (600 ms), place it, and wait for that `placeLandmark` to finish (or 900 ms, whichever is first) before the next.
  - Then `glideTo('all', {duration: 2200})`.
  - A drag or tap during the run is ignored; the button state shows it's running.
- **On `'done'`:** the counter reads "13 of 13", the tray is hidden, the button disables, and the scene glides to `'all'` if it isn't already there.
- **Layout.**
  - At widths under 560 px, the button sits above the tray on the right, so the two never overlap.
  - Under 420 px wide, the label beside the back pill hides, as in `works/003/index.html:235`.

- [ ] **Step 1: Implement `ui.js` and its styles,** and wire it from `main.js`.

- [ ] **Step 2: Check desktop by hand in the browser pane.**
  - Drag Hagia Sophia onto its outline. Expected: it rises, the neighborhood grows, the counter reads "1 of 13" and the toast says "Hagia Sophia · 537".
  - Drag the Blue Mosque onto Galata. Expected: it floats back.
  - Tap the Topkapı outline. Expected: it builds.
  - Press "Build it for me". Expected: the rest build in tour order and the view pulls back to the whole city.

- [ ] **Step 3: Check the keyboard.**
  - Tab to the first tray button and press Enter. Expected: it builds, and the live region text updates.

- [ ] **Step 4: Check the Review Focus 1–4 cases** on the mobile preset and at 360 × 740:
  - A drag from the tray never pans the map.
  - A drop on the tray or button returns the piece.
  - Tapping "Build it for me" twice quickly gives exactly 13 placements, the counter never shows 14, and the button stays disabled.
  - Rotating to landscape mid-game keeps the layout working.

- [ ] **Step 5: Run the unit tests again**
  - Run: `node --test "works/004/_test/*.test.js"`
  - Expected: all pass.

- [ ] **Step 6: Commit**
  - Commit message: "No. 004: tray, gestures, build button"

### Task 8: Share image and still

**Files:**
- Create: `works/004/og.jpg` (1200 × 630), `works/004/still.jpg` (1600 × 1000)
- Modify: `works/004/main.js`, `works/004/index.html`

- [ ] **Step 1: Add the URL flags.**
  - `?built`: places every landmark with `animate: false` and runs `finish()`.
  - `?still`: does the same, adds the class `still-mode` (which hides every UI element), frames `'all'`, and sets `document.title = 'ready'` once two frames have rendered after the city is complete.

- [ ] **Step 2: Capture both images.** The server from Task 4 must be running.

```bash
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; OUT=/private/tmp/claude-501/-Users-m-Documents-GitHub-mahir-github-io/b23fc917-3fa5-462a-b0be-fb940ac2fb7f/scratchpad
"$CH" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=1200,630 --virtual-time-budget=20000 --screenshot="$OUT/og.png" "http://localhost:8000/works/004/?still"
"$CH" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=1600,1000 --virtual-time-budget=20000 --screenshot="$OUT/still.png" "http://localhost:8000/works/004/?still"
sips -s format jpeg -s formatOptions 82 "$OUT/og.png" --out works/004/og.jpg && sips -s format jpeg -s formatOptions 80 "$OUT/still.png" --out works/004/still.jpg
```

  - Expected: both JPEGs show the whole finished city with no UI, and each is under 300 KB. Open them with Read to check.
  - If headless rendering comes out blank, take the screenshots from the browser pane at those viewport sizes instead and say so.

- [ ] **Step 3: Commit**
  - Commit message: "No. 004: share image and still"

### Task 9: Schedule it and check the homepage copy

**Files:**
- Modify: `works/works.js`, plus the files `_build.py` regenerates (`index.html` only when the date has come, `works/index.html`, `sitemap.xml`, `llms.txt`)

- [ ] **Step 1: Add the entry to `works.js`'s `list`:**

```js
{
  n: 4, title: 'Istanbul, piece by piece', date: '2026-10-28', medium: 'Interactive WebGL game',
  about: 'An isometric Istanbul where the Bosphorus, the Golden Horn and the Marmara meet, rebuilt landmark by landmark as each one raises its neighborhood.',
},
```

- [ ] **Step 2: Build.**
  - Run: `python3 works/_build.py`
  - Expected: no error. On 2026-10-27 in New York, `/index.html` stays on No. 003, and No. 004 does not appear in the sitemap yet. On or after 2026-10-28 it becomes the homepage.

- [ ] **Step 3: Check the schedule preview.**
  - Open `/works/?on=2026-10-28`. Expected: No. 004 tops the list.
  - Open `/?on=2026-10-28`. Expected: it hands over to `/works/004/`, which loads and plays.

- [ ] **Step 4: Run the full checks**
  - Run: `node --test "works/004/_test/*.test.js" && python3 works/004/_test_coast.py`
  - Expected: all pass.

- [ ] **Step 5: Check the homepage copy and no WebGL (Review Focus 5).** `_build.py` has no date override, so build the homepage copy in a scratch worktree with the date moved back a day.

```bash
H=/private/tmp/claude-501/-Users-m-Documents-GitHub-mahir-github-io/b23fc917-3fa5-462a-b0be-fb940ac2fb7f/scratchpad/home-check
git worktree add "$H" HEAD && sed -i '' "s/date: '2026-10-28'/date: '2026-10-27'/" "$H/works/works.js" && python3 "$H/works/_build.py"
```

  - Add a `home-check` configuration to `.claude/launch.json`: `python3 -m http.server 8001 -d "$H"`. Start it with `preview_start` and open `http://localhost:8001/`.
    - Expected: the homepage is the game, `land.json` and `main.js` load, and there are no console errors.
  - Stop that server, then run `git worktree remove --force "$H"`.
  - **No WebGL:** add a `?nogl` flag to `main.js` that sets `HTMLCanvasElement.prototype.getContext = () => null` before boot, then open `/works/004/?nogl`.
    - Expected: the still and the landmark list show, and nothing throws.

- [ ] **Step 6: Commit.** Commit message: "No. 004: schedule for 2026-10-28".

- [ ] **Step 7: Ask Mahir for the go-ahead** to merge `works/004-istanbul` into `master` and push.
  - Pushing before midnight New York time on the 27th lets the daily Action put it up.
  - On the 28th, run `_build.py` before pushing.
  - Do not push without that go-ahead.
