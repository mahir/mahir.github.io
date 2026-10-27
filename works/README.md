# Works

The homepage is whichever work is up today. Every work is a page of its own, and new ones can go up every day or only some days.

- `/` reads the schedule and hands the visitor to today's work, carrying any `?query` or `#about` along.
- `/works/` lists every work that is up, newest first, with the links that stay the same whatever the work is.
- `/works/NNN/` is one work. It can look like anything.
- `works.js` is the schedule, and the only list of works.

"Today" is the visitor's own calendar day. On a day with no new work, the latest one stays up.

## Add a work

1. Make a folder for it: `works/002/index.html`, three digits.
2. Make it self-contained: its own HTML, CSS and JS, with any files it needs beside it. Shared files from the site root, such as the portrait, use absolute paths: `/profile.jpg`.
3. Give it a way back: a link to `/works/` (No. 001 uses its top-left label, with "All works →" in its About panel).
4. Add it to the schedule in `works.js`:

   ```js
   { n: 2, title: 'Title of the work', date: '2026-11-02' },
   ```

   A date in the future schedules it: the work goes up by itself on that day. Several can be queued ahead.

The work's own page is public as soon as it is pushed, even when its date is still ahead; only the homepage and the list wait for the date.

## Preview a day

Add `?on=YYYY-MM-DD` to see the site as it will be that day:

- `/?on=2026-11-02` opens the work that will be on the homepage
- `/works/?on=2026-11-02` shows the list as it will be, marked as a preview

To try it locally, serve the repository root, for example `python3 -m http.server`, and open `http://localhost:8000/`. Opening the files directly does not work, because the pages use paths from the site root.
