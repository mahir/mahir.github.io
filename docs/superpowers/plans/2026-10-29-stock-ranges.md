# No. 005 The year in relief — Implementation Plan

**Goal:** Ship `works/005`. Each visit picks a well-known S&P 500 company and turns its last year of closing prices into a photorealistic mountain range. The page opens on the plain chart, which tips forward into land, then flies along the year.

**Spec:** `docs/superpowers/specs/2026-10-29-stock-ranges-design.md`

**Architecture:**
- **Prices.** `works/005/_prices.py` (Python 3.9 stdlib) fetches about 20 months of daily closes per ticker from Nasdaq's public API. It writes `works/005/prices.json`. The daily Action runs it before `works/_build.py`.
- **Pure logic.** These modules never import three and are tested with `node --test`: noise, data decoding and picking, the price-to-altitude scale, the weather blend, label formats, the terrain heightfield and the camera path.
- **The terrain** is built in a module worker from the pure terrain module while the chart draws itself. It hands back heights and normals as transferable arrays.
- **Rendering.** three.js modules draw the land, sky, haze, clouds and line. They are verified in the browser.

**Tech stack:** three.js 0.170.0 (import map, jsDelivr, `Line2` from addons), plain ES modules, Python 3.9 stdlib, Node test runner, headless Chrome for the share image and still.

## Findings from 2026-10-29

- **Nasdaq answers GitHub's servers.** The probe workflow got 10 of 10 tickers, 1–3 s each, 418 rows since 3 Mar 2025, split-adjusted. Rows come newest first.
  - Prices are strings like `"$61.99"` and dates like `"10/28/2026"`.
  - Berkshire is `BRK.B`, and the API reports it as `BRK/B`.
- **`yfinance` also works there,** and stays the fallback. Its last row is today's price while the market is still open, so it would need trimming.
- **EA and WBD are gone** from the S&P 500 list in `datasets/s-and-p-500-companies`. The other 116 draft tickers are members.

## Global constraints

- **Branch.** `works/005-ranges`, in the worktree `.claude/worktrees/005-ranges`, cut from `origin/master`. Mahir's own checkout has uncommitted work in the experiment pages, so it is left alone. Merging to `master` and pushing `master` need Mahir's go-ahead in chat.
- **Folder layout.** Everything lives in `works/005/`. Names starting with `_` (`_prices.py`, `_test_prices.py`, `_test/`) are tools and tests, and Jekyll does not publish them.
- **Paths.**
  - The homepage copies the page's `<head>` facts, so the HTML uses absolute paths: `/works/005/main.js`, `/works/005/still.jpg`.
  - Data loads with `new URL('./prices.json', import.meta.url)`, and modules import each other relatively, so the same files run in Node and the browser.
- **Pure modules never import `three`:** `noise.js`, `data.js`, `scale.js`, `weather.js`, `format.js`, `terrain.js`, `path.js`.
- **The data file:**

  ```json
  {
    "through": "2026-10-28",
    "dates": ["2025-01-03", "… 451 trading days, oldest first …", "2026-10-28"],
    "tickers": [
      { "t": "NFLX", "name": "Netflix", "closes": [/* 451 closes in dollars, 2 decimals, aligned with dates */] }
    ]
  }
  ```

  - The last 252 days are the year. The 199 before them feed the 200-day average on the year's first day.
  - The page computes the averages, the high and the low itself.
  - Closes are exact to the cent, so every price shown matches Nasdaq's close. This replaces the spec's 0–1000 quantization, which would have made the price under the flight cursor approximate.
- **Scale (`scale.js`):**
  - Altitude is `FLOOR + K × ln(price ÷ year's low)`, with `FLOOR = 300` m and `K = 4300` m.
  - When `K × ln(high ÷ low)` would pass `8848 − 300`, K shrinks so the high is exactly 8,848 m.
  - Tree line 1,900 m, snow line 2,800 m.
- **Year length (`scale.js`, builder's call within the spec):** `L = clamp(10 × relief, 8000, 32000)` m. Keeping the ridge's proportions like a chart's makes a flat year short hills and a wild year a long range. Heights stay true meters.
- **World:**
  - Day `i` (0..251) sits at `x = i × L / 251`, and the main crest at `z = 0`.
  - The camera is on the `+z` side, and `+y` is up, in meters.
  - The 50-day range's crest is at `z = −0.30 L`, the 200-day range's at `z = −0.62 L`.
  - The terrain spans `x ∈ [−0.25 L, 1.25 L]`, `z ∈ [−0.85 L, 0.45 L]`.
- **The crest is exact.** The heightfield at `(x_i, 0)` equals the day's altitude to within 0.5 m, wherever the other ranges and the base are at least 150 m lower. Between days it follows a monotone cubic, so it never overshoots a day's close.
- **Weather (`weather.js`):** `m = clamp(change ÷ 0.30, −1, 1)` blends three anchors: golden (+1), overcast (0) and storm (−1). The spec's table gives their character.
- **Copy:**
  - title "The year in relief" (Claude's call; Mahir may rename)
  - medium "Interactive WebGL and daily market data"
  - buttons "Another" and "Skip"
  - ticker line "NFLX · Netflix", then "$61.99 · −44.1% over the year", then "29 Oct 2025 – 28 Oct 2026"
  - markers "High $134.12 · 30 Jun" and "Low $58.10 · 2 Oct"
  - source "Daily closes from Nasdaq, through 28 Oct 2026."
  - Dates read "28 Oct 2026". Changes use a true minus sign and one decimal.
- **Fonts:** Archivo and IBM Plex Mono, with the same Google Fonts link as No. 004.
- **No sound.** `localStorage` keeps only the last ticker shown, wrapped in try/catch.

## Review focus

- the crest staying exact under noise and erosion
- labels matching the data, and dates in New York's calendar, not UTC
- the Action never committing a half-written `prices.json`
- frame rate on a phone

## Tasks

### 1. Prices
- [x] `works/005/_prices.py`:
  - `TICKERS` holds about 100 `(symbol, display name)` pairs, spread across sectors. Check them against the S&P 500 CSV, skipping the check if the CSV can't be read.
  - Fetch 700 days back, with 4 threads and 2 retries. Parse the closes and dates.
  - Align the tickers on the most common calendar and forward-fill up to 3 missing days. Drop a ticker with more gaps or fewer than 451 days.
  - Keep the last 451 days. Write `prices.json` atomically, through a temporary file and a rename, only if at least 90% of the tickers came back. Otherwise keep the old file and exit 0 with a message.
  - Running it twice on the same day changes nothing.
- [x] `works/005/_test_prices.py` (stdlib unittest): parsing, alignment and forward-fill, trimming, and the 90% rule.
- [x] Run it locally and commit `prices.json`.
- [x] `.github/workflows/daily.yml`:
  - a step `python3 works/005/_prices.py` before the build, with `continue-on-error: true`
  - the commit message "Refresh No. 005's prices" when only `works/005/prices.json` changed
  - Remove `nasdaq-probe.yml`.

### 2. Pure modules and tests (`works/005/_test/*.test.mjs`)
- [x] `noise.js`: seeded 2D simplex, `fbm` and `ridged`. Deterministic for a seed, with values in range.
- [x] `data.js`:
  - `decode(json, t)` → `{ t, name, dates, closes (252), ma50, ma200, first, last, hi, lo, hiDay, loDay, change }`
  - `pick(json, { param, last, random })`: honours `?t=`, falls back to random on an unknown ticker, and avoids `last`
  - `seedOf(t)`
  - Moving averages are checked against a hand-computed example.
- [x] `scale.js`: `relief`, `altitude`, the Everest cap, `yearLength`, `dayX`.
- [x] `weather.js`: `weatherFor(change)` → sun elevation and azimuth, colors (zenith, horizon, haze, sun, ground bounce), haze density and falloff, cloud cover, base and darkness, exposure. The anchors are hit exactly, the in-between values are monotone, and the ends clamp.
- [x] `format.js`: `money`, `pct`, `day` ("28 Oct 2026"), `shortDay` ("30 Jun"), `summary` (the screen-reader sentence).
- [x] `terrain.js`:
  - `grid(L, quality)` → column x's (day points fall on columns) and row z's (dense near the ridge)
  - `crestAt(series, x)` as a monotone cubic
  - `buildTerrain(opts)` → `{ heights, normals, cols, rows, xs, zs, maxH }`
  - Tests: crest exactness, determinism per seed, and the crest being the highest point of its cross-section near the ridge.
- [x] `path.js`: camera keyframes for the four beats, given the scale and the series. The flight stays clear of the cloud band (−200/+300 m) and above the ground under it. The rest view frames `[0, L]`.

### 3. Rendering
- [x] `terrain-worker.js`: a module worker wrapping `buildTerrain`, transferring the arrays.
- [x] `sky.js`: a sky dome shader driven by the weather (zenith-to-horizon gradient, sun glow and disk, a high cloud layer, and a night blend for the chart beat), plus a PMREM environment from it.
- [x] `land.js`: terrain mesh and material:
  - a `MeshStandardMaterial` with `onBeforeCompile` mixing grass, forest, rock and snow by altitude, slope and noise, with a detail normal on rock
  - height fog with aerial perspective that replaces three's fog
  - the rise and exaggeration uniforms
- [x] `clouds.js`: two stacked deck layers with an fbm coverage shader, lit tops and dark bases, a soft fade where they meet the terrain (heightmap texture), and the same haze.
- [x] `scene.js`: renderer (AgX tonemapping, sRGB, pixel ratio capped at 2 on desktop and 1.5 on phones), sun, shadows (4096 on desktop, 2048 on phones), the crest `Line2`, and the beat timeline.
- [x] `main.js` and `ui.js`: load, pick, build, run the beats; skip, "Another" and `?t=`; markers projected from world points; the flight cursor; the screen-reader summary; reduced motion; a `?still=1` mode for screenshots.

### 4. The page
- [x] `works/005/index.html`:
  - the `<head>` from No. 004, changed for No. 005, with the empty `gen:ld` marker
  - the "← Home" pill and label, the ticker block, Skip and Another, the source line
  - the `still.jpg` fallback for no-JS and no-WebGL, an about section, and the import map

### 5. Finish
- [x] Browser checks: desktop and phone sizes, a flat, a big and a falling ticker, reduced motion, no WebGL.
- [x] `og.jpg` (1200 × 630) and `still.jpg` from headless Chrome with `?t=…&still=1`.
- [x] The `works.js` entry, dated the first free day once it's checked. Run `python3 works/_build.py`.
- [x] `works/README.md`: a section on the daily price refresh. `PRODUCT.md` is uncommitted in Mahir's checkout, so give Mahir the line it needs instead of writing it here.
- [x] Code review (fixes below), then ask Mahir before merging.

## Changes made while building

- **Closes are exact,** and the page computes the averages, high and low (see the data file above).
- **Honeywell is left out** while its June 2026 aerospace spin-off is in the file. Nasdaq doesn't adjust for spin-offs, and the 51% one-day fall would draw a false cliff. `_prices.py` now leaves out any company that fell more than 40% in a day.
- **The slopes follow a smoothed crest.** The day-to-day wiggle fades within about 1.6 days' width below the crest (at least 160 m), so it doesn't run down the faces as ribs. A notch fades only as fast as keeps the crest the highest point of its cross-section.
- **Erosion comes from Inigo Quilez's derivative-damped fbm** (`noise.eroded`). Ridged noise drew a bed of small cones.
- **Under a heavy deck** (overcast, storm), the clouds lift to 350 m above the highest ground and the camera stays below them (`weatherFor` → `deckFor`).
- **The storm** has a dusk sun low behind the range, so the crest stands as a silhouette against a band of light.
- **The rest view** turns three-quarters toward today's end, at about peak height. Foothill belts in front give it depth.
- **Steep ground is textured from the side** (two-plane projection), so cliffs aren't smeared.
- **The land's shaders compile with `compileAsync`** while the chart draws, so phones don't freeze on a black screen.
- **The share image and still** were captured from the in-app browser with a dev-only `__shot()` hook (`?dev`). Headless software rendering was too slow for this scene.
- **Fixes from the code review:**
  - The land fades fully into the haze before the camera's far plane. Before, quiet years showed a hard line just below the horizon.
  - The horizon plane's height lives in its vertices, so it no longer sits too high while the land rises.
  - A rise close to a whole multiple (an unadjusted reverse split) is left out like a spin-off's fall, but Moderna's real ×2.77 stays.
  - A day fewer than 95% of the companies have yet is still being posted, so it waits for the next run.
  - The file's date never moves backwards.
  - Each new range frees the last one's GPU buffers.
  - A lost WebGL context, or a failed swap, shows the still.
- **Calmer after a first look:**
  - The beats are slower: 34 seconds to the rest, from 24. The tip forward takes 5½ seconds and the flight along the year 17.
  - The flight's clock is a monotone cubic through the keys (`flightClock`), so the camera sets off from the wide view and settles on the rest without a jolt. Its top speed is about half what it was.
  - The camera's heights along the year are smoothed across neighbouring keys, so it glides rather than bobbing.
  - The tag under the flight stands at each month's last close and crossfades into the next, instead of rolling through every day. Months within six days of the high or the low are left out.
  - Crest tags sit on whichever side of their stem has more room, and fade at the screen's edge instead of being cut off.
  - "Another" fades the name and tags out with the land, over 0.6 seconds, and Skip glides to the rest over 2.
- **Kinds of land** (`kinds.js`), so the ranges don't all look alike:
  - Six kinds: granite, larch (autumn), sandstone (terraced red-rock mesas), basalt (black rock and moss), moor (rounded heather hills) and limestone (pale walls over meadows).
  - Each is a shape for the terrain (erosion, how round or flat-topped the slopes, terraces) and a paint for the land (ground, forest, rock and its layers). The tree and snow lines stay the same in every kind, so height still reads as price.
  - Each company always gets the same kind, from its ticker. The salt spreads today's 102 companies 16 to 18 to a kind, and Micron stays granite, so the share image still matches.
  - "Another" and a reload never show the same kind twice in a row.
  - Terraces only carve and leave the crest alone, in beds of uneven thickness. On the coarser phone grid their cliffs are gentler, so they don't draw a sawtooth.
