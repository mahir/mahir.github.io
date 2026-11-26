// No. 024 · Cities, in print: the wall, the cycle, controls, URL parameters.
//
//   #new-york               start with that city
//   ?bare                   the poster alone, filling the window
//   ?still                  the finished poster at once, no cycling
//   ?at=6.5                 (for checks) stop the poster at that second
//   ?hold=12                seconds a finished poster stays
import { Press, W, H } from './print.js';
import { CITIES, load } from './cities/index.js';

const HOLD = 12;
const TURN = 1.25;

const q = new URLSearchParams(location.search);
const num = (k, d) => (q.has(k) && Number.isFinite(+q.get(k)) ? +q.get(k) : d);
const bare = q.has('bare');
const stillMode = q.has('still');
const atParam = q.has('at') ? Math.max(0, num('at', 0)) : null;
const holdS = Math.max(1, num('hold', HOLD));
const motionQ = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = motionQ.matches;
if (bare) document.body.classList.add('bare');

const $ = (id) => document.getElementById(id);
const wall = $('wall'), status = $('status'), holdBar = $('holdBar');
const sheets = [$('sheetA'), $('sheetB')];
let front = 0;

// ---------------------------------------------------------------- a city, when its turn comes
// Its drawing is its own file, and its type its own Google Fonts link: both load
// when the city is next, so the page carries one city at a time, not a hundred.
const ready = new Map();
function fontLink(query) {
  return new Promise((res) => {
    const href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
    if (document.querySelector(`link[data-q="${CSS.escape(query)}"]`)) return res();
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; l.dataset.q = query;
    l.onload = l.onerror = () => res();
    document.head.appendChild(l);
  });
}
function loadCity(i) {
  const id = CITIES[i].id;
  if (!ready.has(id)) {
    const p = load(id).then(async (city) => {
      const fonts = fontLink(city.google || '').then(() => Promise.all((city.fonts || []).map((f) => (Array.isArray(f) ? document.fonts.load(f[0], f[1]) : document.fonts.load(f)).catch(() => null))));
      await Promise.race([fonts, new Promise((res) => setTimeout(res, 4000))]);
      return city;
    });
    // a failed load can be tried again later
    p.catch(() => ready.delete(id));
    ready.set(id, p);
  }
  return ready.get(id);
}

// ---------------------------------------------------------------- layout
function fit() {
  const vw = innerWidth, vh = innerHeight;
  const phone = vw < 720;
  const padX = bare ? 0 : phone ? 14 : 40;
  // room at the foot for the list of cities, which wraps on a wide screen as cities are added
  const padTop = bare ? 0 : phone ? 92 : 70, padBot = bare ? 0 : phone ? 58 : 56;
  const k = Math.min((vw - 2 * padX) / W, (vh - padTop - padBot) / H);
  const w = Math.round(W * k), h = Math.round(H * k);
  const x = Math.round((vw - w) / 2), y = Math.round(padTop + (vh - padTop - padBot - h) / 2);
  return { x, y, w, h };
}

function place(el, box) {
  Object.assign(el.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
  const cv = el.querySelector('canvas');
  const dpr = Math.min(2, devicePixelRatio || 1);
  const pw = Math.round(box.w * dpr);
  if (cv.width !== pw) { cv.width = pw; cv.height = Math.round(pw * H / W); return true; }
  return false;
}

// ---------------------------------------------------------------- the cities
// At the foot: the city on the wall between a step back and a step on; the name
// opens the index of every city.
const list = $('cities'), index = $('index'), here = $('here');
CITIES.forEach((c, i) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button'; b.dataset.i = i;
  // a small picture of the finished poster, fetched the first time the index opens
  const img = document.createElement('img');
  img.alt = ''; img.width = 240; img.height = 300; img.loading = 'lazy'; img.decoding = 'async';
  img.dataset.src = `thumbs/${c.id}.webp`;
  img.style.background = c.wall;
  const name = document.createElement('span');
  name.textContent = c.name;
  b.append(img, name);
  b.addEventListener('click', () => { showIndex(false); go(i); });
  li.appendChild(b); list.appendChild(li);
});
function showIndex(open) {
  index.hidden = !open; here.setAttribute('aria-expanded', String(open));
  if (open) list.querySelectorAll('img[data-src]').forEach((img) => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
  if (open) (list.querySelector('[aria-current="true"]') || list.querySelector('button'))?.focus({ preventScroll: false });
}
here.addEventListener('click', () => showIndex(index.hidden));
$('prev').addEventListener('click', () => cur && go((cur.i - 1 + CITIES.length) % CITIES.length));
$('fwd').addEventListener('click', () => cur && go((cur.i + 1) % CITIES.length));
function mark(i) {
  list.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.i === i)));
  $('hereName').textContent = CITIES[i].name;
  $('hereCount').textContent = `${i + 1} / ${CITIES.length}`;
}

const fromHash = () => {
  const h = decodeURIComponent(location.hash.replace('#', ''));
  const i = CITIES.findIndex((c) => c.id === h);
  return i < 0 ? 0 : i;
};

// ---------------------------------------------------------------- the cycle
let cur = null;        // { i, city, plate, press, el }
let t = 0, phase = 'draw', holdT = 0, paused = false, last = 0, busy = false, want = null;

async function make(i, el) {
  const city = await loadCity(i);
  const plate = city.build();
  const box = fit();
  place(el, box);
  // the sheet's last poster lets go of its layers before the next is made on it
  if (el._press) el._press.dispose();
  const press = new Press(plate, el.querySelector('canvas'));
  el._press = press;
  return { i, city, plate, press, el };
}

async function go(i, opts = {}) {
  // a city asked for while another is loading is gone to once that one is up
  if (busy) { want = i; return; }
  busy = true;
  const next = (front + 1) % 2;
  const el = sheets[next];
  let made;
  try { made = await make(i, el); } catch (e) {
    console.error(e); busy = false;
    status.textContent = `${CITIES[i].name} could not be loaded.`;
    return;
  }
  const old = cur;
  cur = made;
  front = next;
  wall.style.setProperty('--wall', made.city.wall);
  document.documentElement.style.background = made.city.wall;
  mark(i);
  if (!opts.keepHash) history.replaceState(null, '', `${location.search}#${made.city.id}`);
  status.textContent = `${made.city.name}, ${i + 1} of ${CITIES.length}`;
  el.querySelector('canvas').setAttribute('aria-label', `A poster of ${made.city.name}. ${made.city.alt || ''}`.trim());
  t = stillMode || reduced ? made.plate.end + 0.01 : atParam != null && !old ? atParam : 0;
  phase = stillMode || atParam != null ? 'still' : t > made.plate.end ? 'hold' : 'draw';
  holdT = 0;
  holdBar.style.transform = 'scaleX(0)';
  made.press.frame(t);

  // this sheet may still be leaving from a turn a moment ago: keep its timer from hiding it
  clearTimeout(el._hide);
  el.hidden = false;
  el.classList.remove('leave', 'in');
  el.classList.add('top');
  if (old) {
    el.classList.add('enter');
    el.getBoundingClientRect();
    el.classList.remove('enter');
    el.classList.add('in');
    old.el.classList.remove('top', 'in');
    old.el.classList.add('leave');
    old.el._hide = setTimeout(() => { old.el.hidden = true; old.el.classList.remove('leave'); old.press.dispose(); }, TURN * 1000 + 100);
    // the new sheet stays blank while it slides in (a finished one arrives finished)
    if (phase === 'draw' && !reduced) t = -TURN * 0.75;
  }
  // get the next city's drawing and type ready while this one draws
  loadCity((i + 1) % CITIES.length).catch(() => null);
  busy = false;
  if (want != null) { const w = want; want = null; if (w !== i) go(w); }
}

function tick(now) {
  requestAnimationFrame(tick);
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
  last = now;
  if (!cur) return;
  if (!paused && phase !== 'still') {
    t += dt;
    if (phase === 'draw' && t >= cur.plate.end) { phase = 'hold'; holdT = 0; }
    else if (phase === 'hold') {
      holdT += dt;
      holdBar.style.transform = `scaleX(${Math.min(1, holdT / holdS)})`;
      if (holdT >= holdS) go((cur.i + 1) % CITIES.length);
    }
  }
  cur.press.frame(Math.max(0, t));
}

// ---------------------------------------------------------------- controls
const pauseBtn = $('pause');
function setPaused(v) { paused = v; pauseBtn.setAttribute('aria-pressed', String(v)); pauseBtn.textContent = v ? 'Play' : 'Pause'; }
pauseBtn.addEventListener('click', () => setPaused(!paused));
$('next').addEventListener('click', () => cur && go((cur.i + 1) % CITIES.length));
$('save').addEventListener('click', save);
addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (e.key === 'Escape' && !index.hidden) { showIndex(false); here.focus(); return; }
  if (!index.hidden) return;
  if (e.key === ' ') { e.preventDefault(); setPaused(!paused); }
  else if (e.key === 'ArrowRight') cur && go((cur.i + 1) % CITIES.length);
  else if (e.key === 'ArrowLeft') cur && go((cur.i - 1 + CITIES.length) % CITIES.length);
});

const info = $('info'), card = $('about-card');
info.addEventListener('click', () => {
  const open = card.hidden;
  card.hidden = !open; info.setAttribute('aria-expanded', String(open));
});
addEventListener('click', (e) => {
  if (!card.hidden && !card.contains(e.target) && !info.contains(e.target)) { card.hidden = true; info.setAttribute('aria-expanded', 'false'); }
  if (!index.hidden && !index.contains(e.target) && !here.contains(e.target)) showIndex(false);
});

function save() {
  if (!cur) return;
  // the finished poster, at full size
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const pr = new Press(cur.plate, cv);
  pr.frame(cur.plate.end + 60);
  cv.toBlob((b) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `${cur.city.id}-no-024.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
}

addEventListener('hashchange', () => { const i = fromHash(); if (!cur || i !== cur.i) go(i, { keepHash: true }); });
let rz = 0;
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    if (!cur) return;
    if (place(cur.el, fit())) cur.press.size();
    cur.press.frame(Math.max(0, t));
  }, 120);
});
motionQ.addEventListener?.('change', (e) => { reduced = e.matches; });
document.addEventListener('visibilitychange', () => { last = 0; });

go(fromHash(), { keepHash: !location.hash }).then(() => requestAnimationFrame(tick));
