// run.js: the part of the page where the shop runs forward. Seven copies of it, one for each feed, drawn as
// seven grids of the same 1,200 listings. forward.js does the running; this draws what it reports.
//
// The shoppers (shoppers.js) are fetched when the visitor first presses Run, not before.

import { world } from './world.js';
import { FEEDS } from './recs.js';
import { begin, advance, outcome, RUN } from './forward.js';
import { url } from './draw.js';
import { title, plural } from './vocab.js';

const COLS = 30;                                         // listings in a row of a grid
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (n) => n.toLocaleString('en-US');

let W, root, order, before = '', sim = null, crowd = null, running = false, target = 0;
const panels = [];

export function build(lab) {
  W = lab.W;
  root = $('#run');
  if (!root) return;
  const N = W.N;
  // the listings from most favorited to least, as forward.js orders them
  order = W.items.map((l) => l.id).sort((a, b) => W.items[b].favs - W.items[a].favs || a - b);
  const tenth = Math.round(N / 10), held = order.slice(0, tenth).reduce((s, id) => s + W.items[id].favs, 0) / W.items.reduce((s, l) => s + l.favs, 0);

  root.innerHTML = `<div class="bar"><button type="button" class="go">Run a month</button><button type="button" class="again" hidden>Start over</button><p class="day" aria-live="polite"></p></div>
<p class="sum"></p>
<p class="key"><span><i class="k0"></i>Never shown</span><span><i class="k1"></i>Shown to someone</span><span><i class="k2"></i>Favorited, darker for more</span><span><i class="k3"></i>Above the line: the ${num(tenth)} most favorited as the run starts</span></p>
<div class="copies">${FEEDS.map((f) => `<article class="copy" data-feed="${f.id}"><div class="head"><h3>${f.name}</h3></div><div class="grid"><canvas role="img" aria-label="The ${num(N)} listings of the shop run by ${f.name}: which were shown, and which gained favorites"></canvas><p class="tip" hidden></p></div><div class="meas"></div><ol class="most" aria-label="The listings that gained the most"></ol></article>`).join('')}</div>
`;
  before = `Nothing has happened yet: all seven are the same shop on the same day. Each square is a listing, the most favorited first. Above the line are the ${num(tenth)} that hold ${Math.round(held * 100)}% of all favorites.`;
  for (const f of FEEDS) {
    const el = $(`.copy[data-feed="${f.id}"]`, root), p = { feed: f, el, box: $('.grid', el), cv: $('canvas', el), tip: $('.tip', el), meas: $('.meas', el), most: $('.most', el), geo: null };
    panels.push(p);
    const at = (e) => { const id = under(p, e); label(p, id); };
    p.cv.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') at(e); });
    p.cv.addEventListener('pointerleave', () => label(p, null));
    p.cv.addEventListener('click', at);
  }
  $('.go', root).addEventListener('click', run);
  $('.again', root).addEventListener('click', () => { running = false; sim = null; target = 0; draw(); });
  let wait = 0;
  addEventListener('resize', () => { clearTimeout(wait); wait = setTimeout(draw, 80); });
  root.hidden = false;
  draw();
}

// Run to the end of the month, or stop if it is running.
export async function run() {
  if (running) { running = false; return; }
  const go = $('.go', root), day = $('.day', root);
  if (!crowd) {
    go.disabled = true; day.textContent = 'Fetching the shoppers';
    try { ({ crowd } = await import('./shoppers.js')); } catch (e) { day.textContent = 'The shoppers could not be fetched. Try again.'; go.disabled = false; return; }
    go.disabled = false;
  }
  if (!sim) sim = begin(world, crowd);
  if (sim.day >= target) target = sim.day - (sim.day % RUN.days) + RUN.days;
  running = true;
  draw();
  // Stop takes effect when the day ends, so that every copy has had the same days
  while (sim && sim.day < target) {
    if (advance(sim, 14)) { if (!running) break; draw(); }
    await new Promise((r) => setTimeout(r, 0));          // let the page breathe between slices of work
  }
  running = false;
  draw();
  document.documentElement.dataset.ran = sim ? String(sim.day) : '0';
}

// ---------------------------------------------------------------- draw
function draw() {
  const day = sim ? sim.day : 0, go = $('.go', root), again = $('.again', root);
  const whole = day > 0 && day % RUN.days === 0 && !running;
  go.textContent = running ? 'Stop' : day === 0 ? 'Run a month' : whole ? 'Run another month' : 'Go on';
  again.hidden = running || day === 0;
  $('.day', root).innerHTML = day === 0 && !running ? '' : `Day <b>${day}</b>${running || !whole ? ` of ${target}` : ''}`;
  const out = panels.map((p) => (sim ? outcome(sim, sim.worlds[FEEDS.indexOf(p.feed)]) : null));
  panels.forEach((p, n) => {
    const o = out[n], wd = sim ? sim.worlds[n] : null;
    paint(p, wd);
    p.meas.innerHTML = `<div><b>${o ? num(o.favorites) : 0}</b><span>favorites given</span></div><div><b>${o ? num(o.shown) : 0}</b><span>listings shown</span></div><div><b>${o && o.favorites ? `${Math.round(o.top * 100)}%` : '–'}</b><span>to the top tenth</span></div>`;
    p.most.innerHTML = o ? o.most.map((id) => { const name = esc(title(W.items[id])); return `<li title="${name}"><img src="${url(W.items[id])}" alt="${name}"><b>+${wd.gained[id]}</b></li>`; }).join('') : '';
    if (!p.tip.hidden) label(p, p.shownId);
  });
  $('.sum', root).textContent = day ? summary(out, day) : before;
}

// What the days so far came to, in the run's own numbers.
function summary(out, day) {
  const by = (key, dir) => out.map((o, n) => n).sort((a, b) => dir * (out[b][key] - out[a][key]) || a - b)[0];
  const best = by('favorites', 1), wide = by('shown', 1), narrow = by('shown', -1), name = (n) => FEEDS[n].name;
  const first = `After ${plural(day, 'day')}, ${name(best)} has earned the most favorites: ${num(out[best].favorites)}, having shown ${num(out[best].shown)} of the ${num(W.N)} listings.`;
  const second = wide === best ? '' : ` ${name(wide)} has shown the most of the shop, ${num(out[wide].shown)} listings, and earned ${num(out[wide].favorites)}.`;
  const third = narrow === best || narrow === wide ? '' : ` ${name(narrow)} has shown ${num(out[narrow].shown)}.`;
  return first + second + third;
}

// One grid: a square a listing, pale if it was shown, dark if it gained favorites.
function paint(p, wd) {
  const avail = p.box.clientWidth, N = W.N;
  if (!avail) return;
  const dpr = Math.min(2, devicePixelRatio || 1), gap = Math.max(1, Math.round(dpr));
  const c = Math.floor((avail * dpr + gap) / COLS), rows = Math.ceil(N / COLS);
  const top = Number.isInteger(Math.round(N / 10) / COLS) ? Math.round(N / 10) / COLS : 0, split = top ? 4 * gap : 0;
  const cv = p.cv;
  cv.width = c * COLS - gap; cv.height = c * rows - gap + split;
  cv.style.width = `${cv.width / dpr}px`; cv.style.height = `${cv.height / dpr}px`;
  p.geo = { c: c / dpr, split: split / dpr, top, rows };
  const g = cv.getContext('2d');
  g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
  for (let n = 0; n < N; n++) {
    const id = order[n], row = Math.floor(n / COLS), gained = wd ? wd.gained[id] : 0;
    g.globalAlpha = gained ? 0.34 + 0.66 * Math.min(1, Math.sqrt(gained / 40)) : wd && wd.shown[id] ? 0.16 : 0.055;
    g.fillRect((n % COLS) * c, row * c + (top && row >= top ? split : 0), c - gap, c - gap);
  }
  if (top) { g.globalAlpha = 1; g.fillRect(0, top * c + gap, cv.width, gap); }
}

// The listing under the pointer, or null.
function under(p, e) {
  if (!p.geo) return null;
  const box = p.cv.getBoundingClientRect(), { c, split, top } = p.geo;
  const x = e.clientX - box.left, y = e.clientY - box.top;
  const row = top && y >= top * c ? Math.floor((y - split) / c) : Math.floor(y / c), col = Math.floor(x / c);
  const n = row * COLS + col;
  return col < 0 || col >= COLS || row < 0 || n >= W.N || (top && y >= top * c && y < top * c + split) ? null : order[n];
}
function label(p, id) {
  p.shownId = id;
  if (id === null || id === undefined) { p.tip.hidden = true; return; }
  const l = W.items[id], wd = sim ? sim.worlds[FEEDS.indexOf(p.feed)] : null, n = order.indexOf(id), { c, split, top } = p.geo;
  const said = !wd ? plural(l.favs, 'favorite') : wd.gained[id] ? `+${wd.gained[id]} on ${l.favs}, shown ${plural(wd.shown[id], 'time')}` : wd.shown[id] ? `Shown ${plural(wd.shown[id], 'time')}, no favorite` : `Never shown. ${plural(l.favs, 'favorite')}`;
  p.tip.innerHTML = `<img src="${url(l)}" alt=""><span><b>${esc(title(l))}</b>${said}</span>`;
  p.tip.hidden = false;
  const row = Math.floor(n / COLS), x = (n % COLS + 0.5) * c, y = row * c + (top && row >= top ? split : 0);
  // keep it inside the page: it may be wider than its grid
  const left = p.box.getBoundingClientRect().left, wide = p.tip.offsetWidth, room = document.documentElement.clientWidth;
  p.tip.style.left = `${Math.max(8 - left, Math.min(room - 8 - left - wide, x - wide / 2))}px`;
  p.tip.style.top = `${y > p.tip.offsetHeight + 14 ? y - p.tip.offsetHeight - 8 : y + c + 8}px`;
}
