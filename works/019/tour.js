// tour.js: seven steps through the page, six of them in the lab. Each step sets the lab's state through the same calls a visitor's
// taps make, so nothing in the tour is staged: the feeds on screen are what the rankers return.
// The sentences quote the lab's own numbers, so they stay true when the shop is rebuilt.

import { measures, explain, FEEDS, TOP } from './recs.js';
import { CRAFTS, title } from './vocab.js';
import { RUN } from './forward.js';

const $ = (s) => document.querySelector(s);
const list = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const count = (n, one, many) => `${['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] || n} ${n === 1 ? one : many}`;

export function start(lab, opt = {}) {
  const { W } = lab, t = W.tour, bar = $('#tour'), open = $('#tour-open');
  const name = (id) => title(W.items[id]).toLowerCase();
  const top = (feed) => lab.R[feed].order.slice(0, TOP);
  const four = [t.first, ...t.more];

  const steps = [
    {
      title: 'A new visitor', focus: ['similar', 'shoppers', 'learned'], favorites: [],
      say: () => 'You have no favorites, so the three feeds that work from them have nothing to go on. They show Most popular instead, which is what every new visitor to a shop sees.',
    },
    {
      title: 'One favorite', focus: ['similar', 'shoppers'], favorites: [t.first],
      say: () => {
        const mine = W.items[t.first].craft;
        const others = [...new Set(top('shoppers').map((id) => W.items[id].craft).filter((c) => c !== mine))].map((c) => CRAFTS[c].plural);
        return `You favorite the ${name(t.first)}. Similar items fills with ${CRAFTS[mine].plural} like it. Shoppers like you brings ${list(others)} as well: nothing about those listings resembles a ${CRAFTS[mine].name}, but the same shoppers favorited them.`;
      },
    },
    {
      title: 'Three more', focus: ['similar', 'popular'], favorites: four,
      say: () => {
        const s = measures(W, top('similar')), p = measures(W, top('popular'));
        return `Three more favorites of the same kind. Similar items is down to ${count(s.crafts, 'craft', 'crafts')} and ${count(s.colors, 'color', 'colors')}, and its median listing has ${s.favorites} favorites where Most popular’s has ${p.favorites}. It can only return more of what you gave it, popular or not.`;
      },
    },
    {
      title: 'A space of tastes', focus: ['learned'], favorites: four, map: true,
      say: () => `Learned taste never reads what a listing is. From ${W.counts.favorites.toLocaleString('en-US')} favorites it gives every listing a place, so that things favorited by the same shoppers sit together. The map shows two of its eight directions: the red dots are your favorites, the ring is you, the large dots are its ten.`,
    },
    {
      title: 'A listing from yesterday', focus: ['trending', 'similar', 'explore'], favorites: four, select: t.fresh,
      say: () => {
        const at = (feed) => explain(W, lab.state, lab.R, feed, t.fresh).rank.toLocaleString('en-US');
        return `This ${name(t.fresh)} was listed yesterday and nobody has favorited it. The feeds that learn from shoppers cannot see it: it is No. ${at('popular')} in Most popular and No. ${at('learned')} in Learned taste. Similar items only reads the listing, and has it at No. ${at('similar')}. Trending and new lifts it on purpose, to No. ${at('trending')}.`;
      },
    },
    {
      title: 'The blend', focus: ['blend'], favorites: four,
      say: () => 'A shop’s front page is a mix. The blend takes candidates from the other feeds, scores each with the weights under its name, spaces out look-alikes, and sells its second and seventh places to the shop that bids the most for a listing that fits you. Move the sliders and it sorts again.',
    },
    {
      title: 'A month on', focus: null, favorites: four, go: '#forward',
      say: () => `Until now the shop stood still. But shoppers can only favorite what they are shown, so a feed also decides what gets favorited next. Below are seven copies of the shop, each run by one feed for ${RUN.days} days. Press Run a month and compare them. Then the shop is yours.`,
    },
  ];

  let at = 0;
  function show(n) {
    at = Math.max(0, Math.min(steps.length - 1, n));
    const s = steps[at];
    lab.select(null);
    lab.set({ as: 'you', favorites: s.favorites.slice() }, bar.hidden === false);
    if (s.select !== undefined) lab.select(s.select);
    lab.focus(s.focus);
    lab.openMap(!!s.map);
    bar.innerHTML = `<p class="n" aria-label="Step ${at + 1} of ${steps.length}">${at + 1}<small>/${steps.length}</small></p><div><h2>${s.title}</h2><p class="say">${s.say()}</p></div><div class="go"><button type="button" data-go="-1"${at === 0 ? ' disabled' : ''}>Back</button><button type="button" class="next" data-go="1">${at === steps.length - 1 ? 'Done' : 'Next'}</button><button type="button" data-go="0">Skip</button><button type="button" class="more" aria-expanded="false">More</button></div>`;
    bar.classList.remove('open');
    bar.hidden = false; open.hidden = true;
  }
  function end() {
    bar.hidden = true; open.hidden = false;
    lab.focus(null);
    lab.openMap(false);
  }
  bar.addEventListener('click', (e) => {
    const more = e.target.closest('.more');
    if (more) { const open = bar.classList.toggle('open'); more.textContent = open ? 'Less' : 'More'; more.setAttribute('aria-expanded', String(open)); return; }
    const b = e.target.closest('[data-go]');
    if (!b) return;
    const go = +b.dataset.go;
    if (go === 0 || (go === 1 && at === steps.length - 1)) end(); else show(at + go);
    if (go !== 0) bar.querySelector('.next')?.focus({ preventScroll: true });
    // bring the bar to the top of the window, so the feeds it talks about are under it and the panel
    // that step five opens does not cover it; once it is stuck there this does nothing
    // a step about another part of the page goes there instead, and the bar follows, since it sticks
    const to = !bar.hidden && steps[at].go ? $(steps[at].go) : null;
    const y = to ? to.getBoundingClientRect().top + scrollY - bar.offsetHeight - 28 : bar.getBoundingClientRect().top + scrollY - 8;
    if (go !== 0 && !bar.hidden && Math.abs(scrollY - y) > 4) scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  open.addEventListener('click', () => show(0));

  if (opt.off) end(); else show(opt.step ? opt.step - 1 : 0);
  return { show, end, steps: steps.length, FEEDS };
}
