// The schedule of works. Each work lives at /works/<n as three digits>/ and goes up on its date.
// The homepage features the newest work whose date has arrived in New York: works/_build.py writes it there,
// and a GitHub Action runs that build just after midnight New York time, so a work dated ahead goes up by
// itself on its day, and a day without a new work keeps the last one.
// Preview any day by adding ?on=YYYY-MM-DD to the homepage.
// `about` is the line under the work on the homepage; it and `medium` also describe the work to search engines
// and AI assistants. After editing the list, run `python3 works/_build.py` to refresh the homepage, sitemap,
// llms.txt and the pages' structured data.
window.Works = (() => {
  'use strict';

  const list = [
    {
      n: 1, title: 'Self-portrait in latent space', date: '2026-10-26', medium: 'Interactive WebGL',
      about: 'A career as a cloud of points that searches itself under the cursor and gathers into a face when the name is clicked.',
    },
    {
      n: 2, title: 'Self-portrait in type', date: '2026-10-26', medium: 'Interactive canvas and type',
      about: 'The original homepage as a full screen of type: the page’s own text runs across it as one line, wound in a spiral from an eye, and sets a face that turns toward the pointer; click to spill the type and wind it again from there, or type to set it in your own words.',
    },
    {
      n: 3, title: 'Manhattan sundial', date: '2026-10-27', medium: 'Interactive WebGL and live solar data',
      about: 'An abstract model of Manhattan lit by the sun where it stands over New York at this minute; drag through the day and the year, or jump to the next Manhattanhenge.',
    },
    {
      n: 4, title: 'Istanbul, piece by piece', date: '2026-10-28', medium: 'Interactive WebGL game',
      about: 'An isometric Istanbul where the Bosphorus, the Golden Horn and the Marmara meet, rebuilt landmark by landmark as each one raises its neighborhood.',
    },
    {
      n: 5, title: 'The year in relief', date: '2026-10-29', medium: 'Interactive WebGL and daily market data',
      about: 'A well-known S&P 500 company’s last year of closing prices as a mountain range, a new company every visit, with the weather set by how the year went.',
    },
    {
      n: 6, title: 'New York, interlocked', date: '2026-10-30', medium: 'Animated SVG lettering',
      about: 'New York neighborhoods drawn stroke by stroke in nested block letters, short letters held in the arms of tall ones, in pairs of colors after Josef Albers, a new name every 15 seconds.',
    },
    {
      n: 7, title: 'Iznik, plate by plate', date: '2026-10-31', medium: 'Interactive WebGL and canvas',
      about: 'Ottoman Iznik dishes painted on a 3D plate in workshop order, outline, cobalt, turquoise, green and red, then glazed, a new pattern every time.',
    },
    {
      n: 8, title: 'Philosophy, mind to mind', date: '2026-11-03', medium: 'Interactive SVG chart',
      about: 'Who drew on whom in 2,600 years of philosophy, from Thales to Judith Butler, as one chart that plays its own lines through time; tap a thinker to light their lineage.',
    },
    {
      n: 9, title: 'The midterm tide', date: '2026-11-04', medium: 'Interactive SVG charts and election data',
      about: 'Every US midterm since 1790 set against 2026: what the record said before the vote, the results as they were called, and state-by-state maps since 1978.',
    },
    {
      n: 10, title: 'The S&P 500, by weight', date: '2026-11-09', medium: 'Interactive canvas chart and SEC filing data',
      about: 'Every company’s share of the S&P 500 from 1995 to 2026, stacked by rank: the twenty largest drawn one by one as they rise and fall, with all 500 a click away.',
    },
    {
      n: 11, title: 'A piano, tuned by ear', date: '2026-11-11', medium: 'Interactive WebGL and Web Audio',
      about: 'One octave of a grand piano’s strings, each a little flat, tuned in the tuner’s own order: turn the lever on a pin until the beat between two notes slows to the right pace, then move to the next string.',
    },
    {
      n: 12, title: 'Ebru, sheet by sheet', date: '2026-11-12', medium: 'Interactive WebGL',
      about: 'A marbler’s tray seen from above: drop the colours, draw them back and forth, comb them, then lay a sheet of paper on the water and keep the sheet as a picture.',
    },
    {
      n: 13, title: 'Turkish, suffix by suffix', date: '2026-11-13', medium: 'Interactive type',
      about: 'A Turkish word grows a suffix at each tap, from Çekoslovakya to 44 letters, while the English under it grows from one word into a sentence; four words to build, and a change of root changes the vowels of every suffix.',
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
