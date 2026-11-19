# Works

The homepage is Mahir's, and features whichever work is up today. Every work is a page of its own, and new ones can go up every day or only some days.

On the site they are called experiments ("Experiments", "Open the experiment"); in the code, these notes and the addresses they are works (`/works/NNN/`, `works.js`), so the pages already out there keep their addresses.

- `/` opens on Mahir (photo, name, role, short bio), then the work on view today, then the works that are up, newest first (the three before today's, with a button beside the heading that shows them all, today's included; every one is in the HTML, and a link to `/#experiments` arrives with the list open), then his latest three Substack posts, then his profiles elsewhere. The talks, press and lectures are part of the short bio. The page itself is written by hand; `_build.py` fills in the parts between `<!-- gen:… -->` markers.
- `/press/` lists his talks, podcasts, press, papers and art projects, each linked to where it was published. The page is written by hand like the homepage; `_build.py` fills its list from the facts at its top (see "Add a talk or an article").
- `/works/` only sends old links on to the list on `/` (`/#experiments`). It can become an archive of its own once there are many works.
- `/works/NNN/` is one work. It can look like anything.
- `works.js` is the schedule, and the only list of works.
- `_build.py` writes today's work, the list and the latest posts (from the Substack feed; if it can't be read, the posts already listed stay) onto the homepage, and what search engines and AI assistants read, from that list (see below).

"Today" is New York's calendar day. A GitHub Action (`.github/workflows/daily.yml`) runs the build just after midnight there and publishes the change when a work's date has come; on a day with no new work, the latest one stays up and nothing is committed. It can also be run by hand from the repository's Actions tab.

## No. 005's prices

No. 005 draws a year of a company's closing prices, from `works/005/prices.json`. The daily Action runs `works/005/_prices.py` before the build, so the file follows each trading day and the Action commits it ("Refresh No. 005's prices") even on days no work goes up. If Nasdaq doesn't answer, yesterday's file stays and the build still runs. The companies are listed at the top of `_prices.py`; one that leaves the S&P 500 drops out by itself, and one whose price falls more than 40% in a day, which is almost always a spin-off Nasdaq doesn't adjust for, is left out while that day is in the file. To refresh by hand: `python3 works/005/_prices.py`.

## No. 010's weights

No. 010 draws each company's share of the S&P 500 from `works/010/weights.js`, which `works/010/_weights.py` builds from the holdings the SPDR S&P 500 ETF Trust reports to the SEC (one report a year from 1995 to 2009, two a year to 2019, four a year since). The fund files a new quarter about two months after it ends. To add it, run `python3 works/010/_weights.py` and commit `weights.js`; the page's opening numbers follow the data. Filings are kept in `works/010/_cache/`, which is not committed. Renames and mergers of large companies are listed at the top of the script (`ALIAS`, `SPLIT`, `SHOW`); when a top-20 company changes its name, add it there. The Action does not run this.

## No. 014's streets

No. 014 walks fifteen minutes from one spot in each of twelve cities, over street graphs in `works/014/data/`. `works/014/_streets.py` builds them from OpenStreetMap through the Overpass API: `<city>.json` covers 1.3 km around the start and is what the page opens with, `<city>-wide.json` covers 2.6 km and is loaded when a city is opened, so the start can be dragged. The cities and their start points are listed at the top of the script; the text about each city is in the page itself. Overpass replies are kept in `works/014/_cache/`, which is not committed, and the public Overpass servers are often busy, so the script retries. After the data changes, run `node works/014/_numbers.js`: it writes each city's reach into `index.html`, for readers without scripts. The Action does not run either.

## No. 015's streets

No. 015 puts two of the same twelve cities side by side, colored by the direction their streets run. `works/015/_shape.py` builds `works/015/data/` from the Overpass replies No. 014's script keeps in `works/014/_cache/` (run `python3 works/014/_streets.py` first if that folder is gone), takes its cities and start points from that script, and writes the table of all twelve into `works/015/index.html`, between the `<!-- rows -->` markers; the page reads its numbers from that table. The "What shows up" paragraphs quote some of those numbers by hand, so read them again after the data changes. The Action does not run it.

## No. 017's cards

No. 017 sets Sufi sayings on cards, one saying to a card, from `works/017/sayings.json`. Each entry has the English text with one `*phrase*` to set in italics, the author and dates, the work and where in it the saying is, the original words, one of nine themes and a grade: "A" found in the work itself, "B" reported in a named classical source, "C" a traditional attribution, which the page prints as "Attributed to". Only sayings that can be traced go in; lines that circulate under Rumi's or Yunus Emre's name without a source stay out, and the English is the page's own, not a published translation. The page shows the themes as nine sections, each opening on one row of cards, so a theme's first sayings in the file are the ones a visitor sees first; the originals are in Persian, Arabic, Turkish, Punjabi, Sindhi, Pashto and Urdu. After the file changes, run `node works/017/_cards.js`: it writes the cards into `index.html`, for readers without scripts, gives each card a color pair that differs from its neighbors', and measures each card's type size and line breaks in a headless browser (Playwright's headless shell) so the page opens with them set. It lists the cards whose line breaks still have a fault; a card that needs its breaks set by hand goes in the `BREAKS` table at the top of `_cards.js`, and `--report <file>` writes every card's lines for reading through. The colors come from `palette.js`, one pair of field and ink per theme and variant; `node works/017/_palette_test.js` checks every pair for contrast. `_og.html` is the page `og.jpg` is rendered from, and `_sheet.html` shows all the cards at once. The Action does not run any of this.

## No. 018's vehicles

No. 018 draws imaginary vehicles, one to a sheet. Nothing is stored: the sheet number is a seed, and `works/018/fleet.js` turns it into a vehicle, so `/works/018/#48213` opens the same sheet again. `geom.js` holds the solids, `hlr.js` projects them and removes hidden lines, `kit.js` is the shared kit of parts and surface treatments (its opening comment is the whole guide to writing a class), `classes/` has one file per kind of vehicle, and `sheet.js` and `main.js` lay out the paper, the title block and the parts list and move the pen. To add a kind of vehicle, add `classes/<id>.js` and its id to `CLASS_FILES` in `fleet.js`. The first 21 kinds are plain vehicles and come up half as often (`PLAIN`); the rest are things that are not vehicles (shoes, teapots, pianos, lighthouses) standing on running gear from `classes/gear.js` (`G.plan`, then build the object, then `g.build()`), ordinary vehicles with too much of one thing (`excess`) and halves of two vehicles (`graft`); `classes/extras.js` has small equipment any class may add. Adding or reweighting a kind changes which vehicle every sheet number draws. `_contact.html` shows finished drawings side by side (`?n=12&class=lander`, `?one=306`, `?kit` for every part). The page takes `?seed=`, `?class=`, `?draw=` and `?hold=` in seconds, `?still` for a finished sheet and `?bare` for no buttons; `og.jpg` is a `?still&bare` sheet. The Action does not run any of this.

## No. 019's shop

No. 019 sorts one imaginary shop with seven recommenders, side by side. `works/019/_world.js` builds the shop from a seed and writes `world.js`: about 1,200 listings in eight crafts, 120 shops, and what the rankers need from the favorites of 2,500 simulated shoppers (each listing's nearest neighbors by co-favorites, and its place in a taste space trained by alternating least squares). The shoppers are not shipped. Each has one or two of eight hidden tastes, listed at the top of the script, and a taste spans crafts with no attribute in common: that is what makes "Similar items" and "Shoppers like you" disagree. The script's parameters are in `P`; after changing them run `node works/019/_world.js`, which also writes the two plain lists and the count into `index.html`, for readers without scripts, then `node works/019/_test.js`. The test rebuilds the shop, recounts every number an explanation quotes from the shoppers' favorites, and checks each claim the tour makes, so a change that breaks the tour fails there. `recs.js` is the seven feeds as pure functions (`rank`, `explain`, `measures`); `draw.js` draws a listing from its attributes; `vocab.js` holds the crafts, surfaces, colors and titles; `lab.js` is the page and `tour.js` its six steps, whose sentences quote the lab's own numbers. `_sheet.html` shows the drawings (`?craft=rug`, `?top`, `?n=`). The page takes `?step=`, `?notour`, `?as=Defne`, `?pick=` a listing's number and `?bare`. The Action does not run any of this.

## After a new Substack post

The Writing list is refreshed by hand. Substack refuses GitHub's servers, so the daily Action can't read the feed and keeps the posts already listed. After a post goes up, run `python3 works/_build.py` on your own machine, check the homepage, and commit what it changed (`index.html` and `llms.txt`, and `sitemap.xml` when the post is newer than the latest work).

## Add a work

1. Make a folder for it: `works/003/index.html`, three digits.
2. Make it self-contained: its own HTML, CSS and JS, with any files it needs beside it. Shared files from the site root use absolute paths, such as `/portrait.jpg`, the photo on the homepage, or `/profile.jpg`, the older, smaller one that No. 001 and No. 002 are drawn from (No. 001 is tuned to it, so leave it as it is).
3. Give it a clear way back: a "← Home" link to `/` that is visible as soon as the page opens, on phones too. No. 001 and No. 002 put it top left, as a pill, with the work's number and title beside it.
4. Copy the `<head>` of No. 002 and change the title, description (under 160 characters), canonical URL, `og:` and `twitter:` lines. Keep the empty `<!-- gen:ld -->` marker; the build fills it.
5. Add a share image beside the page: `og.jpg`, 1200 × 630. It is also the picture of the work on the homepage while it is on view.
6. Add it to the schedule in `works.js`:

   ```js
   {
     n: 3, title: 'Title of the work', date: '2026-11-02', medium: 'Interactive WebGL',
     about: 'One sentence on what the work is, for the homepage, search engines and AI assistants.',
   },
   ```

   A date in the future schedules it: the work goes up by itself on that day. Several can be queued ahead.
7. Run the build, from the repository root:

   ```sh
   python3 works/_build.py
   ```

The work's own page is public as soon as it is pushed, even when its date is still ahead; only the homepage and the list wait for the date.

## Add a talk or an article

The list on `/press/` lives at the top of `_build.py`, in `TALKS`, `PODCASTS`, `PRESS`, `PAPERS` and `PROJECTS`. Add an entry to the right one: the address, the piece's own title, who published it, the date (a year or a month is enough when the day isn't known) and one plain sentence on what it is. Open the address first and check that the piece is there and says what the sentence says. Then set `PRESS_UPDATED` to today, run the build and commit. The same entry goes to search engines and into `/llms.txt`; to link it from the short bio as well, add it to `SHORT_BIO`.

## Search engines and AI assistants

Most crawlers, and almost all AI ones, read the HTML without running JavaScript. So besides each page's own `<head>`, `_build.py` writes from `works.js`:

- the structured data (JSON-LD) in every page: who Mahir is and every profile that is his, the site, the list of works, each work, and the breadcrumb trail to it
- the short bio, today's work and a plain list of works in the HTML of `/`; visitors with JavaScript see today's work and the list drawn again for their own day
- `/sitemap.xml` and `/llms.txt`

The facts about Mahir that the build writes (role, bio, short bio, profiles, photo, talks and press) live at the top of `_build.py`; change them there and run it again. The bios name examples, not every school, show or talk. Talks and press go to search engines as pieces about Mahir, never among his profiles. The homepage's title, description, role line and the Elsewhere links are written in `/index.html` itself. Works dated after today are left out of all of this until the day comes. Running it twice changes nothing.

Not published, though they stay in the repository: these notes, `llms/CLAUDE.md` and the old Kaleidoscope project (see `/_config.yml`). The lecture decks under `/llms/` and `/pm/` are published but kept out of search engines until they are updated: each deck's page (`/llms/`, `/pm/`, `/pm/v1/` and so on) carries `<meta name="robots" content="noindex">`, and `/robots.txt` lets crawlers read those pages only, so the slides' text stays closed. A new deck page needs the same `noindex` line in its `<head>`; a blocked page can still be listed in search results by its address alone, which is why the pages are open and say `noindex` themselves. Addresses that don't exist get `/404.html`.

## Preview a day

Add `?on=YYYY-MM-DD` to see the site as it will be that day:

- `/?on=2026-11-02` shows the homepage as it will be: the work on view and the list, marked as a preview

To try it locally, serve the repository root, for example `python3 -m http.server`, and open `http://localhost:8000/`. Opening the files directly does not work, because the pages use paths from the site root.
