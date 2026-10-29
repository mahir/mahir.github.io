// The words over the picture: the company and its year, the buttons, the dates under the opening chart, and the
// tags that stand on the crest at the year's high, its low and the day the flight is passing.

import { money, pct, day, shortDay, span, summary } from './format.js';

export function createUI({ onSkip, onAnother }) {
  const $ = (id) => document.getElementById(id);
  const el = {
    sym: $('sym'), name: $('name'), move: $('move'), span: $('span'), source: $('source'), live: $('live'),
    skip: $('skip'), another: $('another'),
    hi: $('tag-hi'), lo: $('tag-lo'), cursor: $('tag-day'), start: $('axis-start'), end: $('axis-end'),
  };
  el.skip.addEventListener('click', (e) => { e.stopPropagation(); onSkip(); });
  el.another.addEventListener('click', (e) => { e.stopPropagation(); onAnother(); });

  function setTicker(d) {
    el.sym.textContent = d.t;
    el.name.textContent = d.name === d.t ? '' : d.name;
    el.move.textContent = `${money(d.last)} · ${pct(d.change)} over the year`;
    el.span.textContent = span(d.dates);
    el.source.textContent = `Daily closes from Nasdaq, through ${day(d.through)}.`;
    el.hi.textContent = `High ${money(d.hi)} · ${shortDay(d.dates[d.hiDay])}`;
    el.lo.textContent = `Low ${money(d.lo)} · ${shortDay(d.dates[d.loDay])}`;
    el.start.textContent = day(d.dates[0]);
    el.end.textContent = day(d.dates[d.dates.length - 1]);
    el.live.textContent = summary(d);
  }

  function setCursor(d, i) {
    el.cursor.textContent = `${day(d.dates[i])} · ${money(d.closes[i])}`;
  }

  // a tag at a point on screen, or hidden
  function place(node, at, opacity) {
    if (!at || opacity < 0.01) { node.style.opacity = '0'; return; }
    node.style.transform = `translate3d(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px, 0)`;
    node.style.opacity = opacity.toFixed(3);
  }

  return { el, setTicker, setCursor, place };
}
