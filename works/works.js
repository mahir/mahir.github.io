// The schedule of works. Each work lives at /works/<n as three digits>/ and goes up on its date.
// The homepage is the newest work whose date has arrived in New York: works/_build.py writes it there, and a
// GitHub Action runs that build just after midnight New York time, so a work dated ahead goes up by itself
// on its day, and a day without a new work keeps the last one.
// Preview any day by adding ?on=YYYY-MM-DD to the homepage or the index.
// `medium` and `about` describe the work to search engines and AI assistants; after editing the list,
// run `python3 works/_build.py` to refresh the sitemap, llms.txt and the pages' structured data.
window.Works = (() => {
  'use strict';

  const list = [
    {
      n: 1, title: 'Self-portrait in latent space', date: '2026-10-26', medium: 'Interactive WebGL',
      about: 'A career as a cloud of points that searches itself under the cursor and gathers into a face when the name is clicked.',
    },
    {
      n: 2, title: 'Self-portrait in type', date: '2026-10-26', medium: 'Interactive canvas and type',
      about: 'The original homepage as a letterpress print: a round plate whose face is set in the page’s own text, in Eczar from weight 400 to 800.',
    },
    {
      n: 3, title: 'Manhattan sundial', date: '2026-10-27', medium: 'Interactive WebGL and live solar data',
      about: 'An abstract model of Manhattan lit by the sun where it stands over New York at this minute; drag through the day and the year, or jump to the next Manhattanhenge.',
    },
    {
      n: 4, title: 'Istanbul, piece by piece', date: '2026-10-28', medium: 'Interactive WebGL game',
      about: 'An isometric Istanbul where the Bosphorus, the Golden Horn and the Marmara meet, rebuilt landmark by landmark as each one raises its neighborhood.',
    },
  ];

  const pad = (x, w) => String(x).padStart(w, '0');
  // New York's calendar day, as YYYY-MM-DD
  const newYork = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });

  function today() {
    const on = new URLSearchParams(location.search).get('on');
    return /^\d{4}-\d{2}-\d{2}$/.test(on || '') ? on : newYork.format(new Date());
  }

  // Works up on a given day, oldest first.
  const live = (day) => list.filter((w) => w.date <= day).sort((a, b) => a.date.localeCompare(b.date) || a.n - b.n);

  return {
    list,
    today,
    live,
    current: (day) => live(day).pop() || null,
    url: (w) => `/works/${pad(w.n, 3)}/`,
    number: (w) => pad(w.n, 3),
    // A schedule date as a local calendar day, never shifted by UTC.
    date: (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },
  };
})();
