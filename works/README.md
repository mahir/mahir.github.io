# Works

The homepage is whichever work is up today. Every work is a page of its own, and new ones can go up every day or only some days.

- `/` reads the schedule and hands the visitor to today's work, carrying any `?query` or `#about` along.
- `/works/` lists every work that is up, newest first, with the links that stay the same whatever the work is.
- `/works/NNN/` is one work. It can look like anything.
- `works.js` is the schedule, and the only list of works.
- `_build.py` writes what search engines and AI assistants read from that list (see below).

"Today" is the visitor's own calendar day. On a day with no new work, the latest one stays up.

## Add a work

1. Make a folder for it: `works/003/index.html`, three digits.
2. Make it self-contained: its own HTML, CSS and JS, with any files it needs beside it. Shared files from the site root, such as the portrait, use absolute paths: `/profile.jpg`.
3. Give it a clear way back: an "← All works" link to `/works/` that is visible as soon as the page opens, on phones too. No. 001 and No. 002 put it top left, as a pill, with the work's number and title beside it.
4. Copy the `<head>` of No. 002 and change the title, description, canonical URL, `og:` and `twitter:` lines. Keep the empty `<!-- gen:ld -->` marker; the build fills it.
5. Add a share image beside the page: `og.jpg`, 1200 × 630.
6. Add it to the schedule in `works.js`:

   ```js
   {
     n: 3, title: 'Title of the work', date: '2026-11-02', medium: 'Interactive WebGL',
     about: 'One sentence on what the work is, for search engines, AI assistants and the list.',
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

- the structured data (JSON-LD) in every page: who Mahir is, the site, the list of works, each work
- a plain list of works and a short bio in the HTML of `/` and `/works/`. Visitors with JavaScript see the bio on `/works/` and the live list in place of the plain one; `/` sends them on to today's work
- `/sitemap.xml` and `/llms.txt`

The facts about Mahir (role, bio, links) live at the top of `_build.py`; change them there and run it again. Works dated after the day you run it are left out of all of this, so run it again once a scheduled work has gone up. Running it twice changes nothing.

## Preview a day

Add `?on=YYYY-MM-DD` to see the site as it will be that day:

- `/?on=2026-11-02` opens the work that will be on the homepage
- `/works/?on=2026-11-02` shows the list as it will be, marked as a preview

To try it locally, serve the repository root, for example `python3 -m http.server`, and open `http://localhost:8000/`. Opening the files directly does not work, because the pages use paths from the site root.
