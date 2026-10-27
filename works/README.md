# Works

The homepage is whichever work is up today. Every work is a page of its own, and new ones can go up every day or only some days.

- `/` is today's work itself, not a redirect to it: `_build.py` copies the work's page into `/index.html` with the site's own title, description and structured data, so a search for Mahir finds the homepage as his. Never edit `/index.html` by hand.
- `/works/` opens on Mahir (name, role, short bio), then lists every work that is up, newest first, with the links that stay the same whatever the work is.
- `/works/NNN/` is one work. It can look like anything.
- `works.js` is the schedule, and the only list of works.
- `_build.py` writes the homepage and what search engines and AI assistants read from that list (see below).

"Today" is New York's calendar day. A GitHub Action (`.github/workflows/daily.yml`) runs the build just after midnight there and publishes the change when a work's date has come; on a day with no new work, the latest one stays up and nothing is committed. It can also be run by hand from the repository's Actions tab.

## Add a work

1. Make a folder for it: `works/003/index.html`, three digits.
2. Make it self-contained: its own HTML, CSS and JS, with any files it needs beside it. Shared files from the site root, such as the portrait, use absolute paths: `/profile.jpg`.
3. Give it a clear way back: an "← All works" link to `/works/` that is visible as soon as the page opens, on phones too. No. 001 and No. 002 put it top left, as a pill, with the work's number and title beside it.
4. Copy the `<head>` of No. 002 and change the title, description (under 160 characters), canonical URL, `og:` and `twitter:` lines. Keep them, and the empty `<!-- gen:ld -->` marker the build fills, between `<!-- page:head -->` and `<!-- /page:head -->`: on the homepage the build swaps that block for the site's own. The page needs one `</body>`.
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

The work's own page is public as soon as it is pushed, even when its date is still ahead; only the homepage and the list wait for the date. After changing a work that is on the homepage, run the build again so the homepage copy follows.

## Search engines and AI assistants

Most crawlers, and almost all AI ones, read the HTML without running JavaScript. So besides each page's own `<head>`, `_build.py` writes from `works.js`:

- the structured data (JSON-LD) in every page: who Mahir is and every profile that is his, the site, the list of works, each work, and the breadcrumb trail to it
- on `/`, an account of Mahir (role, full bio, the works, his links) that screen readers and crawlers read and the artwork does not show
- a plain list of works and the short bio in the HTML of `/works/`; visitors with JavaScript see the live list in its place
- `/sitemap.xml` and `/llms.txt`

The facts about Mahir (role, bio, short bio, links, the homepage's title and description) live at the top of `_build.py`; change them there and run it again. Works dated after today are left out of all of this until the day comes. Running it twice changes nothing.

Not published, though they stay in the repository: these notes, `llms/CLAUDE.md` and the old Kaleidoscope project (see `/_config.yml`). The lecture decks under `/llms/` and `/pm/` are published but kept out of search engines by `/robots.txt` until they are updated. Addresses that don't exist get `/404.html`.

## Preview a day

Add `?on=YYYY-MM-DD` to see the site as it will be that day:

- `/?on=2026-11-02` hands over to the work that will be on the homepage
- `/works/?on=2026-11-02` shows the list as it will be, marked as a preview

To try it locally, serve the repository root, for example `python3 -m http.server`, and open `http://localhost:8000/`. Opening the files directly does not work, because the pages use paths from the site root.
