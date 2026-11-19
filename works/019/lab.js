// lab.js: the page of No. 019. Seven feeds of one shop, side by side; favorite a listing and each sorts
// itself again. The ranking is recs.js, the pictures are draw.js; this file is only what you see and touch.
//
//   build()            draws the lab into #feeds, #you and #why
//   set(patch)         changes favorites, weights, ads or whose shoes you are in, and re-sorts
//   toggle(id)         favorites a listing, or takes it back
//   select(id | null)  opens the panel that says where one listing stands in every feed, and why
//   focus(ids | null)  the tour's: asks the eye to some feeds by fading the others

import { world } from './world.js';
import { prepare, rank, explain, measures, place, FEEDS, TOP, WEIGHTS } from './recs.js';
import { url } from './draw.js';
import { COLORS, title, longTitle, price, listed, plural } from './vocab.js';

export const W = prepare(world);
export const state = { favorites: [], weights: { ...WEIGHTS }, ads: true, as: 'you' };
export let R = null;

let hot = null, selected = null, mine = [];
const seen = new Set();
const els = {};
const listeners = new Set();
const still = matchMedia('(prefers-reduced-motion: reduce)');
const wide = matchMedia('(min-width: 1100px)');
const $ = (s, el = document) => el.querySelector(s);
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4S4.6 15.900 4.600 10.300A4.200 4.200 0 0 1 12 7.700a4.200 4.200 0 0 1 7.400 2.600c0 5.600-7.400 10.100-7.400 10.100z"/></svg>';
const TAGS = { new: 'New', try: 'A try', ad: 'Ad' };
const CAPS = {
  popular: 'Favorites of each of the ten', trending: 'Recent favorites. Hollow: lifted for being new',
  similar: 'Match with your favorites', shoppers: 'Votes from your favorites', explore: 'Fit with your taste. Hollow: a try',
};
const SLIDERS = [['taste', 'Taste'], ['popular', 'Popular'], ['fresh', 'Fresh'], ['variety', 'Variety']];
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const onChange = (fn) => listeners.add(fn);

// ---------------------------------------------------------------- build
export function build() {
  const feeds = $('#feeds');
  feeds.innerHTML = FEEDS.map((f) => `<section class="feed" data-feed="${f.id}" aria-labelledby="h-${f.id}"><div class="head"><h2 id="h-${f.id}">${f.name}</h2><p class="line">${f.line}</p></div><div class="inst${f.id === 'learned' || f.id === 'blend' ? '' : ' plain'}"></div><div class="meas"></div><ol class="list"></ol></section>`).join('') + '<svg class="thread" aria-hidden="true"></svg>';
  for (const f of FEEDS) { const root = $(`[data-feed="${f.id}"]`, feeds); els[f.id] = { root, inst: $('.inst', root), meas: $('.meas', root), list: $('.list', root) }; }
  els.blend.inst.innerHTML = `<div class="mix">${SLIDERS.map(([k, name]) => `<label><span>${name}</span><input type="range" min="0" max="100" value="${Math.round(state.weights[k] * 100)}" data-w="${k}"></label>`).join('')}<label class="sell"><input type="checkbox" checked data-ads> Sell two places</label></div>`;
  els.learned.inst.innerHTML = '<canvas role="img" aria-label="A map of the shop: listings favorited by the same shoppers sit together"></canvas><p class="cap"></p>';

  const you = $('#you');
  you.innerHTML = `<div class="tray-wrap"><span class="label">Your favorites</span><span class="tray"></span></div><div class="as" role="group" aria-label="Shop as"><span class="label">Shop as</span><button type="button" data-as="you">You</button>${W.shoppers.map((s) => `<button type="button" data-as="${s.name}">${s.name}</button>`).join('')}</div><button type="button" class="reset">Start over</button><p class="seen"></p>`;
  you.hidden = false;

  // one listener each for hearts, picks, hovers and sliders
  feeds.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    if (e.target.closest('.heart')) toggle(+card.dataset.id); else select(+card.dataset.id);
  });
  feeds.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') { const c = e.target.closest('.card'); warm(c ? +c.dataset.id : selected); } });
  feeds.addEventListener('pointerleave', () => warm(selected));
  feeds.addEventListener('focusin', (e) => { const c = e.target.closest('.card'); if (c) warm(+c.dataset.id); });
  feeds.addEventListener('input', (e) => {
    if (e.target.dataset.w) state.weights = { ...state.weights, [e.target.dataset.w]: e.target.value / 100 };
    else if ('ads' in e.target.dataset) state.ads = e.target.checked;
    else return;
    render();
  });
  you.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.id) toggle(+b.dataset.id);
    else if (b.dataset.as) set({ as: b.dataset.as, favorites: b.dataset.as === 'you' ? mine.slice() : W.shoppers.find((s) => s.name === b.dataset.as).favs.slice() });
    else if (b.classList.contains('reset')) { mine = []; select(null); set({ as: 'you', favorites: [], weights: { ...WEIGHTS }, ads: true }); }
  });
  const why = $('#why');
  why.addEventListener('click', (e) => { if (e.target.closest('.close')) select(null); else if (e.target.closest('.fav')) toggle(selected); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && selected !== null) select(null); });
  let wait = 0;
  addEventListener('resize', () => { clearTimeout(wait); wait = setTimeout(() => { map(); thread(); }, 80); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(thread);

  render(false);
}

// ---------------------------------------------------------------- change
export function set(patch, animate = true) {
  Object.assign(state, patch);
  if (state.as === 'you' && patch.favorites) mine = patch.favorites.slice();
  for (const [k] of SLIDERS) { const input = $(`[data-w="${k}"]`); if (input) input.value = Math.round(state.weights[k] * 100); }
  const ads = $('[data-ads]'); if (ads) ads.checked = state.ads;
  render(animate);
}
export function toggle(id) {
  const favorites = state.favorites.slice(), at = favorites.indexOf(id);
  if (at < 0) favorites.push(id); else favorites.splice(at, 1);
  set({ favorites });
}
export function select(id) {
  selected = id === selected ? null : id;
  warm(selected);
  why();
}
export function focus(ids) {
  $('#feeds').classList.toggle('focusing', !!ids);
  for (const f of FEEDS) els[f.id].root.classList.toggle('focus', !!ids && ids.includes(f.id));
}

// ---------------------------------------------------------------- render
export function render(animate = true) {
  R = rank(W, state);
  const move = animate && !still.matches;
  for (const f of FEEDS) feed(f, move);
  you();
  map();
  why();
  thread();
  if (move) setTimeout(thread, 760);   // again once the cards have landed
  for (const fn of listeners) fn();
}

function card(id) {
  const l = W.items[id], li = document.createElement('li'), name = esc(title(l));
  li.className = 'card'; li.dataset.id = id;
  li.innerHTML = `<button type="button" class="pick" aria-label="${name}: where it stands in every feed"><img src="${url(l)}" alt="" draggable="false"><span class="tag"></span></button><button type="button" class="heart" aria-label="Favorite ${name}" aria-pressed="false">${HEART}</button><div class="txt"><span class="rank"></span><div><p class="t">${name}</p><p class="s">${esc(W.shops[l.shop])} · ${price(l.price)}</p></div></div>`;
  return li;
}

function feed(f, move) {
  const r = R[f.id], el = els[f.id], top = r.order.slice(0, TOP);
  for (const id of top) seen.add(id);
  const old = new Map([...el.list.children].map((c) => [+c.dataset.id, c]));
  const was = new Map();
  if (move) for (const [id, c] of old) was.set(id, c.getBoundingClientRect());
  const next = top.map((id, n) => {
    const c = old.get(id) || card(id);
    $('.rank', c).textContent = n + 1;
    const tag = (r.tags && r.tags[id]) || '', t = $('.tag', c);
    t.dataset.tag = tag; t.textContent = TAGS[tag] || '';
    c.classList.toggle('lent', !!r.fallback || (r.padFrom !== undefined && n >= r.padFrom));
    c.classList.toggle('hot', id === hot);
    return c;
  });
  el.list.replaceChildren(...next);
  // each card slides from where it was to where it is now; a new one fades in
  if (move) next.forEach((c, n) => {
    const a = was.get(+c.dataset.id), b = c.getBoundingClientRect();
    const timing = { duration: 620, easing: 'cubic-bezier(.2,.7,.2,1)', delay: n * 16, fill: 'backwards' };
    if (!a) c.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { ...timing, duration: 460, delay: 140 + n * 16 });
    else if (Math.abs(a.left - b.left) > 0.5 || Math.abs(a.top - b.top) > 0.5) c.animate([{ transform: `translate(${a.left - b.left}px,${a.top - b.top}px)` }, { transform: 'none' }], timing);
  });

  const m = measures(W, top);
  el.meas.innerHTML = `<div><b>${m.crafts}</b><span>${m.crafts === 1 ? 'craft' : 'crafts'}, ${m.colors} ${m.colors === 1 ? 'color' : 'colors'}</span></div><div><b>${m.favorites}</b><span>favorites, median</span></div><div><b>${m.days}</b><span>days listed, median</span></div>`;
  if (f.id === 'learned') $('.cap', el.inst).textContent = r.fallback ? 'Nothing to go on yet. This is Most popular.' : 'Two of eight directions. Ring: you.';
  else if (f.id !== 'blend') bars(f, r, top);
}

// What the feed measured for each of its ten, as ten bars.
function bars(f, r, top) {
  const el = els[f.id].inst;
  if (r.fallback) { el.innerHTML = '<p class="none">Nothing to go on yet.<br>This is Most popular.</p>'; return; }
  if (!$('.bars', el)) el.innerHTML = `<div class="bars">${'<i></i>'.repeat(TOP)}</div><p class="cap"></p>`;
  $('.cap', el).textContent = f.id === 'explore' && !state.favorites.length ? 'Popularity. Hollow: a try' : CAPS[f.id];
  const s = top.map((id) => Math.max(0, r.scores[id])), max = Math.max(...s, 1e-9);
  [...$('.bars', el).children].forEach((b, n) => {
    const id = top[n], tag = r.tags && r.tags[id];
    b.style.height = `${id === undefined ? 0 : Math.max(4, (s[n] / max) * 100)}%`;
    b.className = `${tag === 'new' || tag === 'try' ? 'hollow' : ''} ${id === hot ? 'on' : ''}`;
    b.dataset.id = id;
    // a try or a new listing has no score of its own yet: show the lift it was given
    if (tag === 'try') b.style.height = '34%';
  });
}

function you() {
  const el = $('#you');
  $('.tray', el).innerHTML = state.favorites.length
    ? state.favorites.map((id) => { const name = esc(title(W.items[id])); return `<button type="button" data-id="${id}" title="${name}" aria-label="Take ${name} out of your favorites"><img src="${url(W.items[id])}" alt=""></button>`; }).join('')
    : '<span class="none">None yet. Tap a heart.</span>';
  for (const b of el.querySelectorAll('[data-as]')) b.setAttribute('aria-pressed', String(b.dataset.as === state.as));
  $('.seen', el).innerHTML = `The feeds have shown you <b>${seen.size.toLocaleString('en-US')}</b> of ${W.N.toLocaleString('en-US')} listings`;
}

// ---------------------------------------------------------------- one listing, everywhere
function warm(id) {
  if (id === hot) return;
  hot = id;
  for (const c of document.querySelectorAll('.card.hot')) c.classList.remove('hot');
  for (const b of document.querySelectorAll('.bars i.on')) b.classList.remove('on');
  if (id !== null) {
    for (const c of document.querySelectorAll(`.card[data-id="${id}"]`)) c.classList.add('hot');
    for (const b of document.querySelectorAll(`.bars i[data-id="${id}"]`)) b.classList.add('on');
  }
  thread(); map();
}

// A line through the same listing in every feed that shows it.
function thread() {
  const svg = $('.thread');
  if (!svg) return;
  const pts = [];
  if (wide.matches && hot !== null) {
    const box = svg.getBoundingClientRect();
    for (const f of FEEDS) {
      const img = $(`.card[data-id="${hot}"] img`, els[f.id].list);
      if (img) { const b = img.getBoundingClientRect(); pts.push({ l: b.left - box.left, r: b.right - box.left, y: b.top - box.top + b.height / 2 }); }
    }
  }
  if (pts.length < 2) { svg.innerHTML = ''; return; }
  let d = '', dots = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const x0 = pts[i].r + 5, x1 = pts[i + 1].l - 5, mx = (x0 + x1) / 2;
    d += `M${x0.toFixed(1)} ${pts[i].y.toFixed(1)}C${mx.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx.toFixed(1)} ${pts[i + 1].y.toFixed(1)} ${x1.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`;
    dots += `<circle cx="${x0.toFixed(1)}" cy="${pts[i].y.toFixed(1)}" r="2.5"/><circle cx="${x1.toFixed(1)}" cy="${pts[i + 1].y.toFixed(1)}" r="2.5"/>`;
  }
  svg.innerHTML = `<path d="${d}"/>${dots}`;
}

// The map under Learned taste: every listing with a favorite, where the factorization put it.
function map() {
  const cv = $('canvas', els.learned.inst), w = cv.clientWidth, h = cv.clientHeight;
  if (!w) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = w * dpr; cv.height = h * dpr;
  const g = cv.getContext('2d');
  g.scale(dpr, dpr);
  const X = (x) => 7 + (x / 1000) * (w - 14), Y = (y) => 7 + (1 - y / 1000) * (h - 14);
  const dot = (l, rad, fill, alpha = 1) => { g.globalAlpha = alpha; g.fillStyle = fill; g.beginPath(); g.arc(X(l.x), Y(l.yy), rad, 0, 7); g.fill(); };
  // the page's own ink and its one accent
  const css = getComputedStyle(document.documentElement), ink = css.getPropertyValue('--ink').trim(), me1 = css.getPropertyValue('--you').trim();
  for (const l of W.items) if (l.favs) dot(l, 1.3, COLORS[l.color].hex, 0.6);
  const r = R.learned;
  if (!r.fallback) for (const id of r.order.slice(0, TOP)) dot(W.items[id], 2.6, ink);
  for (const id of state.favorites) if (W.items[id].favs) dot(W.items[id], 2.8, me1);
  g.globalAlpha = 1; g.lineWidth = 1.75;
  const me = place(W, state.favorites);
  if (me) { g.strokeStyle = me1; g.beginPath(); g.arc(X(me.x), Y(me.y), 8, 0, 7); g.stroke(); }
  if (hot !== null && W.items[hot].favs) { const l = W.items[hot]; g.strokeStyle = ink; g.beginPath(); g.arc(X(l.x), Y(l.yy), 5, 0, 7); g.stroke(); }
}

function why() {
  const el = $('#why');
  if (selected === null) { el.hidden = true; document.body.classList.remove('has-why'); return; }
  const l = W.items[selected], fav = state.favorites.includes(selected);
  const rows = fav ? `<li class="in"><b>Every feed</b><span class="place">Yours</span><span class="text">One of your favorites, so no feed shows it to you again.</span></li>`
    : FEEDS.map((f) => {
      const e = explain(W, state, R, f.id, selected);
      return `<li class="${e.rank <= TOP ? 'in' : ''}"><b>${f.name}</b><span class="place">No. ${e.rank.toLocaleString('en-US')}</span><span class="text">${esc(e.text)}</span></li>`;
    }).join('');
  el.innerHTML = `<button type="button" class="close" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="thing"><img src="${url(l)}" alt=""><div><h2>${esc(longTitle(l))}</h2><p class="facts">${esc(W.shops[l.shop])} · ${price(l.price)}<br>Listed ${listed(l.age)} · ${plural(l.favs, 'favorite')}</p><button type="button" class="fav" aria-pressed="${fav}">${HEART}${fav ? 'Favorited' : 'Favorite'}</button></div></div><ol>${rows}</ol>`;
  el.hidden = false;
  document.body.classList.add('has-why');
}
