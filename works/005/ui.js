// The words over the picture: the company and its year, the buttons, the dates under the opening chart, and the
// tags that stand on the crest at the year's high, its low and the month ends the flight passes.

import { money, pct, day, shortDay, span, summary } from './format.js';

export function createUI({ onSkip, onAnother }) {
  const $ = (id) => document.getElementById(id);
  const el = {
    sym: $('sym'), name: $('name'), move: $('move'), span: $('span'), source: $('source'), live: $('live'),
    skip: $('skip'), another: $('another'),
    hi: $('tag-hi'), lo: $('tag-lo'), marks: [$('tag-month-a'), $('tag-month-b')], start: $('axis-start'), end: $('axis-end'),
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

  // two month tags take turns, so one can fade out while the next fades in
  function setMark(node, d, i) {
    if (node.dataset.day === `${d.t}:${i}`) return;
    node.dataset.day = `${d.t}:${i}`;
    node.textContent = `${day(d.dates[i])} · ${money(d.closes[i])}`;
  }

  const bottom = document.querySelector('.bottom');

  // A tag at a point on screen, or hidden. A crest tag turns to the left of its stem when there's more room there
  // near the right edge, fades out as the screen's edge reaches it rather than being cut off, and hides rather than
  // sit on the company's name.
  function place(node, at, opacity, crest = false) {
    if (crest && at && at.y > bottom.getBoundingClientRect().top - 8) at = null;
    if (!at || opacity < 0.01) { node.style.opacity = '0'; return; }
    if (crest) {
      const w = node.offsetWidth, right = innerWidth - at.x - w, left = at.x - w;
      const flip = right < 12 && left > right;
      node.classList.toggle('flip', flip);
      const room = flip ? Math.min(left, innerWidth - at.x) : Math.min(at.x, right);
      const u = Math.min(1, Math.max(0, (room + 6) / 30));
      opacity *= u * u * (3 - 2 * u);
      if (opacity < 0.01) { node.style.opacity = '0'; return; }
    }
    node.style.transform = `translate3d(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px, 0)`;
    node.style.opacity = opacity.toFixed(3);
  }

  return { el, setTicker, setMark, place };
}
