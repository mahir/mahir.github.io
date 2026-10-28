# Works

The homepage is Mahir's, and features whichever work is up today. Every work is a page of its own, and new ones can go up every day or only some days.

On the site they are called experiments ("Experiments", "Open the experiment"); in the code, these notes and the addresses they are works (`/works/NNN/`, `works.js`), so the pages already out there keep their addresses.

- `/` opens on Mahir (photo, name, role, short bio), then the work on view today, then every work that is up, newest first, then his profiles elsewhere. The talks, press and lectures are part of the short bio. The page itself is written by hand; `_build.py` fills in the parts between `<!-- gen:… -->` markers.
- `/works/` only sends old links on to the list on `/` (`/#experiments`). It can become an archive of its own once there are many works.
- `/works/NNN/` is one work. It can look like anything.
- `works.js` is the schedule, and the only list of works.
- `_build.py` writes today's work and the list onto the homepage, and what search engines and AI assistants read, from that list (see below).

"Today" is New York's calendar day. A GitHub Action (`.github/workflows/daily.yml`) runs the build just after midnight there and publishes the change when a work's date has come; on a day with no new work, the latest one stays up and nothing is committed. It can also be run by hand from the repository's Actions tab.

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

## Search engines and AI assistants

Most crawlers, and almost all AI ones, read the HTML without running JavaScript. So besides each page's own `<head>`, `_build.py` writes from `works.js`:

- the structured data (JSON-LD) in every page: who Mahir is and every profile that is his, the site, the list of works, each work, and the breadcrumb trail to it
- the short bio, today's work and a plain list of works in the HTML of `/`; visitors with JavaScript see today's work and the list drawn again for their own day
- `/sitemap.xml` and `/llms.txt`

The facts about Mahir that the build writes (role, bio, short bio, profiles, photo, talks and press) live at the top of `_build.py`; change them there and run it again. The bios name examples, not every school, show or talk. Talks and press go to search engines as pieces about Mahir, never among his profiles. The homepage's title, description, role line and the Elsewhere links are written in `/index.html` itself. Works dated after today are left out of all of this until the day comes. Running it twice changes nothing.

Not published, though they stay in the repository: these notes, `llms/CLAUDE.md` and the old Kaleidoscope project (see `/_config.yml`). The lecture decks under `/llms/` and `/pm/` are published but kept out of search engines by `/robots.txt` until they are updated. Addresses that don't exist get `/404.html`.

## Preview a day

Add `?on=YYYY-MM-DD` to see the site as it will be that day:

- `/?on=2026-11-02` shows the homepage as it will be: the work on view and the list, marked as a preview

To try it locally, serve the repository root, for example `python3 -m http.server`, and open `http://localhost:8000/`. Opening the files directly does not work, because the pages use paths from the site root.
