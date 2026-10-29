# No. 005 — The year in relief: design

*Written 2026-10-29, from a planning session with Mahir. Anything marked **(my call)** was decided by Claude, not by Mahir, and is open to change.*

## Intent

Every time the page loads, it picks a well-known S&P 500 company, takes its last year of closing prices, and turns that line into a photorealistic mountain range. The first seconds show a plain stock chart you recognize; then it tips forward and becomes land.

It sits next to No. 003 (a city lit by live data) as another piece where a real number shapes a real-looking place. Unlike No. 004 it isn't a game: you watch it, then load another.

## What it is

### The ridge is the chart (Mahir chose this)

- **One year left to right.** The main ridge runs from a year ago on the left to the last close on the right, one step per trading day (about 252).
- **The crest follows the closing price exactly.** Rock, gullies and erosion detail go on the slopes, never on the crest line, so the chart stays readable from any angle.
- **Two ranges behind it (my call),** from the 50-day and 200-day moving averages of the same stock, further back and fading into haze. Every ridge in the picture is the stock's own data. They rise only after the chart phase, so the opening silhouette is the price line alone.

### Real scale (Mahir chose this)

How much the stock moved decides how big the mountains are. The camera always frames the whole ridge, but the landscape's scale cues stay fixed, so a quiet year and a wild year look like different places.

- **Height is the log of the price (my call),** so equal percentage moves look equal wherever they happen: altitude = 300 m + 4,300 m × ln(price ÷ year's low). A stock that doubled has about 3,000 m of relief.
- **Fixed lines:** tree line about 1,900 m, snow line about 2,800 m, and the cloud deck at the height the mood sets (below). These numbers are starting points, to tune by eye.
- **What that gives:**
  - A stock that moved 10% in the year: green rolling hills, forest to the top.
  - One that moved 60%: bare rock above the trees, maybe a dusting of snow.
  - One that doubled or tripled: snowy peaks above the clouds.
- **Nothing taller than Everest (my call).** Relief is capped at 8,848 m, a year of about 7×. The labels always show the real numbers.
- **The flattest stock on the list must still read as its chart.** For small moves the camera sits lower, with a longer lens, so the crest reads against the sky the way real hills do in a telephoto photo.

### The weather follows the year (Mahir chose this)

The one-year change sets the light, the clouds and the haze. It's a continuous blend, not three presets **(my call)**:

| One-year change | Light | Sky |
|---|---|---|
| +30% or better | clear golden morning, low warm sun | crisp air, a few high clouds |
| around 0% | soft, bright, diffuse | full overcast, light haze |
| −30% or worse | stormy dusk, cold light under the cloud base | low heavy cloud, thick haze |

Values in between blend smoothly, and the ends clamp.

### The tickers (Mahir chose this)

- **About 100 companies people recognize:** Netflix, Microsoft, Nike, Apple, Disney, Coca-Cola, and so on.
- **The list is checked against the current S&P 500** every time the prices are fetched. A company that leaves the index drops out by itself.
- **Spread across sectors (my call),** so reloads don't land on five chipmakers in a row.
- **Short display names (my call):** "Netflix", not "Netflix, Inc."
- The plan proposes the list, and Mahir can edit it.

### Getting around (my calls)

- **Every load picks at random,** and doesn't repeat the ticker the visitor saw last time.
- **"Another"** picks a new one without reloading the page and runs the animation again.
- **`?t=NFLX`** pins a ticker so a particular range can be shared. An unknown ticker falls back to a random one.
- **No search box and no ticker list.** The surprise is the point.

## The animation (Mahir chose "chart becomes land")

1. **The chart.** A plain white line draws itself left to right on a dark, empty background, with the ticker, the company name and faint start and end dates. It should look like any stock chart. About 2 seconds.
2. **It tips forward.** The camera swings from a flat front view to a low view across the land. Terrain rises up under the line, the line becomes the crest, the sky lights into the day's weather, and the ranges behind rise out of the haze. About 5½ seconds.
3. **The flight.** A slow camera flight along the ridge from a year ago to today. Small markers stand at the year's high and low, and a tag stands at each month's last close as the flight passes it, crossfading into the next. About 20 seconds.
4. **The rest.** The camera ends on the whole range with today's close in view, the labels settle, and the camera drifts slowly. "Another" is there.

- **Skipping.** A click, tap or key skips straight to the rest view.
- **Reduced motion.** The page opens on the rest view, with no line drawing and no flight.

## Look

- **Photorealistic, within what a browser can do on a phone.** The aim is a high-end game or an aerial photograph, not film CG.
- **Kinds of land:** *added after a first look.* Each company always stands in one of six kinds of land, picked from its ticker: granite, autumn larch, red-rock sandstone mesas, black basalt and moss, heather moor, pale limestone walls. The tree and snow lines are the same in every kind.
- **Sky:** a physical sky model, so the sun's position and the weather drive the colors.
- **Distance:** aerial perspective, meaning distance haze that goes bluer and paler with depth. It does most of the work of making the scale read.
- **Ground:** grass and forest below the tree line, rock on steep slopes, scree, and snow above the snow line where the slope is gentle enough to hold it.
- **Light:** soft shadows from the sun, film-style tonemapping, and a little bloom on bright snow and sun.
- **Clouds:** layered, at the cloud deck's height, with peaks breaking through on big years.
- **Labels sit on top in plain type (my call):** Archivo and IBM Plex Mono, as No. 003 and No. 004 use.
  - bottom left: "NFLX · Netflix" large, then "$61.99 · −44.1% over the year", then "29 Oct 2025 – 28 Oct 2026" in mono
  - at the year's high and low, small markers in the scene: "High $134.12 · 30 Jun", "Low $58.10 · 2 Oct"
  - a quiet source line: "Daily closes from Nasdaq, through 28 Oct 2026."
  - The figures here are examples, not checked numbers.
- **Neutral colors (my call).** No green-up or red-down anywhere. The weather already carries the mood, and red and green would make it look like a trading app.

## Data (my calls)

- **The page can't fetch prices itself.** None of the free sources allow requests from a browser on another site (CORS), and keyed APIs would show the key to every visitor.
- **Tested on 2026-10-29:**
  - **Nasdaq's public API** (`api.nasdaq.com/api/quote/<T>/historical`) worked. It returned 252 daily closes for NFLX, adjusted for splits: the November 2025 10-for-1 split comes through smooth.
  - **Yahoo** answered 429 (too many requests).
  - **Stooq** now shows a JavaScript bot check before its CSV downloads.
- **`works/005/_prices.py`** (stdlib Python 3.9) fetches each ticker's closes for about 20 months, enough history for the 200-day average on the year's first day. It writes `works/005/prices.json`. The `_` keeps the script unpublished, like No. 004's `_coast.py`.
- **`prices.json` holds only what the page draws:**
  - the date the data runs through, and one shared list of 451 trading days
  - per ticker: the display name and its 451 daily closes, to the cent
  - The page takes the last 252 as the year, and the 199 before them feed the 200-day average.
  - no open, intraday high and low, or volume
  - about 100–150 KB once GitHub Pages gzips it
  - *Changed while planning the build:* closes are exact rather than quantized to 0–1000, so the price under the flight cursor matches Nasdaq's close.
- **The daily Action** (`.github/workflows/daily.yml`) runs `_prices.py` before `_build.py`.
  - The market has closed by then, so the data is final.
  - Weekends and holidays bring no new data, so nothing changes and nothing is committed.
  - A price refresh gets its own commit message, not "Put up today's work".
  - If a fetch fails, the old file stays and the experiment build still runs, the same way the Substack posts are handled.
- **This changes how often the Action commits:** on every trading day, not only on days a new experiment goes up. `PRODUCT.md` and `works/README.md` get a line saying so.
- **Risks:**
  - **Nasdaq may block GitHub's servers.** The first build task is a test run from Actions. The fallback is the `yfinance` library, the only non-stdlib dependency, installed in the workflow.
  - **Nasdaq's terms limit redistribution.** The file holds closing prices only, which is what the picture shows, but it is still their data republished.

## How it's built (my calls)

- **Where it lives.** A self-contained page at `works/005/`, following `works/README.md`:
  - the `<head>` copied from No. 002 with this experiment's title, description and `og:` lines, and the empty `<!-- gen:ld -->` marker
  - the "← Home" pill at top left with "No. 005" and the title, visible from the first frame, on phones too
  - `og.jpg` (1200 × 630) and `still.jpg` of one finished range, with its ticker named in the alt text
  - an entry in `works.js`, then `python3 works/_build.py`
- **Rendering.** three.js `0.170.0` from jsDelivr through an import map, as No. 003 and No. 004 load it. The `Sky` addon is a starting point for the sky.
- **Terrain.**
  - It is built on the device from the three lines: a heightfield whose crest is the price line, plus seeded noise and erosion detail on the slopes.
  - The same ticker always makes the same mountains.
  - The mesh resolution adapts to the device.
- **The chart-to-land move.** The opening "flat front view" is a perspective camera far away with a very narrow lens, which looks flat. It then dollies in and widens, which avoids a jump between projections.
- **Pure logic** is tested with `node --test`, like No. 004: picking a ticker, the price-to-altitude scale, the weather blend, label text and date formats. Rendering is checked in the browser.
- **No WebGL.** The page shows `still.jpg` with a text summary of that range.
- **Phones.** It must run smoothly on a recent phone: cap the pixel ratio, use one shadow cascade, and render the clouds at low resolution.
- **Accessibility.**
  - A screen-reader summary, updated on "Another": "Netflix (NFLX), the year to 28 Oct 2026: from $110.37 to $61.99, down 44%. High $134.12 on 30 Jun, low $58.10 on 2 Oct."
  - "Another" and skip work from the keyboard.
- **No sound.** The only thing remembered between visits is the last ticker shown, so the next load can avoid it.

## Schedule and first version

- **Date (my call):** the first free day once it's finished and checked, 2026-10-30 at the earliest. Medium: "Interactive WebGL and daily market data".
- **Branch:** `works/005-ranges`, cut from `master`. Merging and pushing need Mahir's go-ahead in chat.

**The first version has:**
- `_prices.py`, `prices.json`, the ticker list and the Action step, with the Nasdaq test run done first
- the three ranges, real scale, the weather blend, snow, forest and rock
- the full animation with skip and reduced motion
- the labels, the high and low markers, "Another" and `?t=`
- the "← Home" pill, `og.jpg`, `still.jpg`, the no-WebGL fallback and the `works.js` entry

**These can wait for a later pass:**
- richer clouds
- a lake in the valley at the year's low
- rivers down the gullies

## Goals

- In the first two seconds you see a stock chart. Five seconds later you believe it's a place.
- A quiet year and a wild year feel like different landscapes, not the same Alps redrawn.
- Each load is a small surprise: what did Nike do this year?
- It works on desktop and phones.

## Non-goals

- A finance tool: no comparisons, indicators, intraday data or live prices.
- All ~500 companies, or a way to search for one.
- Choosing a date range other than the last year.

## Anti-goals (a failure even if it works)

- **The line gets lost.** Noise or erosion blurs the crest until it no longer reads as the chart.
- **Generic terrain** that would look the same with random data.
- **A 2005 tech demo:** plastic shading, flat fog, tiled textures.
- **It looks like a trading app:** green and red, tickers scrolling past, buy and sell language.
- **Wrong numbers:** an unadjusted split that turns into a cliff, a stale date, or a price that doesn't match the label.
- **Slow or janky on a phone.**

## Left to the builder

- **The scale constants:** 4,300 m per log unit, the tree, snow and cloud lines, and the horizontal length of the year. The plan starts with a length of 10 × the relief, between 8 and 32 km, so the ridge keeps a chart's proportions. The flattest and the wildest stock on the list are the test cases.
- **The terrain recipe:** the noise, the erosion and the slope falloff, as long as the crest stays exact.
- **The cloud technique, and the camera path and timings** within the beats above.
- **Which ticker the share image shows,** chosen when it's made for how good it looks.
