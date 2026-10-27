// The schedule of works. Each work lives at /works/<n as three digits>/ and goes up on its date.
// The homepage shows the newest work whose date has arrived in the visitor's time zone, so a work dated
// in the future goes up by itself that day, and a day without a new work keeps the last one.
// Preview any day by adding ?on=YYYY-MM-DD to the homepage or the index.
window.Works = (() => {
  'use strict';

  const list = [
    { n: 1, title: 'Self-portrait in latent space', date: '2026-10-26' },
  ];

  const pad = (x, w) => String(x).padStart(w, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;

  function today() {
    const on = new URLSearchParams(location.search).get('on');
    return /^\d{4}-\d{2}-\d{2}$/.test(on || '') ? on : ymd(new Date());
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
