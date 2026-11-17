// No. 018 · Vehicles, sheet by sheet: boot, the cycle, controls, URL parameters.
//
//   #48213 or ?seed=48213   start with that sheet
//   ?bare                   no page chrome
//   ?still                  draw the finished sheet at once, do not cycle
//   ?class=lander           only that class of vehicle
//   ?draw=12&hold=5         seconds for the drawing and for the hold
//   ?at=0.35                (for checks) freeze the sheet at that fraction of the draw
//   ?bench                  (for checks) time the pen frame by frame, result in the title
import * as S from './sheet.js';

const DRAW = 12;      // seconds from a blank sheet to the finished drawing
const HOLD = 5;       // seconds the finished sheet stays
const TURN = 0.7;     // seconds for the sheet to slide away
const MAX_PIXELS = 14e6;

const q = new URLSearchParams(location.search);
const num = (k, d) => (q.has(k) && Number.isFinite(+q.get(k)) ? +q.get(k) : d);
const drawS = Math.max(1, num('draw', DRAW));
const holdS = Math.max(0, num('hold', HOLD));
const bare = q.has('bare');
const stillMode = q.has('still');
const atParam = q.has('at') ? Math.max(0, Math.min(1, num('at', 1))) : null;
const onlyClass = q.get('class') || null;
const motionQ = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = motionQ.matches;
if (bare) document.body.classList.add('bare');

const $ = (id) => document.getElementById(id);
const desk = $('desk');
const status = $('status');

// ---------------------------------------------------------------- the vehicles

// (underscore files are not published, so the page must not depend on any)
const fleet = await import('./fleet.js');
const source = 'fleet';

function makeDrawing(seed, box) {
  // phones: no dimension lines, so the vehicle can be drawn larger
  return fleet.make(seed, box, { class: onlyClass || undefined, dims: !(L && L.W < 640) });
}

// the drawing at a standard scale, as large as the sheet allows: make it once for the
// reference box, find where it goes and how large (S.place), make it again at that size
function prepare(seed, L) {
  const box = { w: L.box.w, h: L.box.h };
  // a sheet that cannot be drawn is skipped for the next number
  let d0 = null;
  for (let i = 0; i < 12 && !d0; i++) {
    try { d0 = makeDrawing(seed, box); } catch (e) { console.warn(`sheet ${seed} failed`, e); seed = (seed + 1) % 100000; }
  }
  if (!d0) throw new Error('no sheet could be drawn');
  const at = S.place(L, d0);
  const { r } = S.snapScale(d0.pxPerMeter * at.k);
  const k = (at.k * r) / 0.997; // just over the standard scale, so it snaps to it
  const d = Math.abs(k - 1) < 0.004 ? d0 : makeDrawing(seed, { w: box.w * k, h: box.h * k });
  const sheet = S.compose(L, d, { seed, date: S.today(), cx: at.cx, cy: at.cy });
  return { seed, d, sheet };
}

// ---------------------------------------------------------------- the desk

const plates = [new S.Plate($('sheetA')), new S.Plate($('sheetB'))];
let front = 0;
let L = null, dpr = 1, paperCanvas = null;
let cur = null, next = null;
let t = 0, phase = 'draw', holdT = 0, turnT = 0, paused = false, last = 0;

function avoidRects() {
  if (bare) return [];
  return ['nav', 'controls'].map((id) => $(id)).filter(Boolean).map((el) => {
    const r = el.getBoundingClientRect();
    return { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom };
  }).filter((r) => r.x1 > r.x0);
}

function measure() {
  const W = Math.max(320, desk.clientWidth || innerWidth), H = Math.max(320, desk.clientHeight || innerHeight);
  dpr = Math.min(2.5, devicePixelRatio || 1);
  if (W * H * dpr * dpr > MAX_PIXELS) dpr = Math.sqrt(MAX_PIXELS / (W * H));
  L = S.layout(W, H, { avoid: avoidRects() });
  paperCanvas = S.paper(L, dpr);
  for (const p of plates) p.setup(L, dpr, paperCanvas);
}

const drawT = () => (atParam != null ? atParam : stillMode || reduced ? 1 : Math.min(1, t / drawS));

function show(seed) {
  cur = prepare(seed, L);
  const p = plates[front];
  p.load(cur.sheet);
  p.advance(drawT());
  const c = p.c;
  c.setAttribute('aria-label', cur.sheet.label);
  status.textContent = cur.sheet.label;
  history.replaceState(null, '', '#' + cur.seed);
  document.title = `Mahir Yavuz · Vehicles, sheet by sheet · ${cur.d.meta.name || ''}`.replace(/ · $/, '');
  window.__sheet = { seed, source, drawing: cur.d, sheet: cur.sheet, L };
}

const randomSeed = () => Math.floor(Math.random() * 100000);
function firstSeed() {
  const h = location.hash.replace('#', '');
  if (/^\d{1,5}$/.test(h)) return +h;
  if (q.has('seed') && /^\d{1,5}$/.test(q.get('seed'))) return +q.get('seed');
  return randomSeed();
}

// ---------------------------------------------------------------- the cycle

function startDraw() { t = 0; phase = 'draw'; holdT = 0; }

function prepareNext() {
  if (next) return;
  // not the same kind of vehicle twice in a row
  let seed = randomSeed();
  const last = cur && cur.d.meta && cur.d.meta.klassId;
  if (fleet && fleet.pickClass && !onlyClass && last) {
    for (let i = 0; i < 6 && fleet.pickClass(seed).id === last; i++) seed = randomSeed();
  }
  next = prepare(seed, L);
}

function turn() {
  if (!next) prepareNext();
  const back = 1 - front;
  const old = plates[front], neu = plates[back];
  neu.load(next.sheet);
  neu.advance(0);
  neu.c.classList.remove('away');
  neu.c.style.zIndex = 1;
  old.c.style.zIndex = 2;
  neu.c.hidden = false;
  const nextSeed = next.seed;
  front = back;
  next = null;
  if (reduced || stillMode) {
    old.c.hidden = true;
    show(nextSeed);
    startDraw();
    return;
  }
  phase = 'turn'; turnT = 0;
  old.c.classList.add('away');
  setTimeout(() => {
    old.c.hidden = true;
    old.c.classList.remove('away');
    old.c.style.zIndex = 0;
  }, TURN * 1000 + 40);
  show(nextSeed);
  t = 0;
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!last) { last = now; return; }
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (paused || document.hidden || !cur) return;
  const t0 = performance.now();
  if (phase === 'turn') {
    turnT += dt;
    if (turnT >= TURN) startDraw();
    return;
  }
  if (atParam != null || stillMode) return;
  if (reduced) return;
  if (phase === 'draw') {
    t += dt;
    plates[front].advance(Math.min(1, t / drawS));
    if (t >= drawS) {
      phase = 'hold'; holdT = 0;
      setTimeout(() => { try { prepareNext(); } catch (e) { console.error(e); } }, 60);
    }
  } else if (phase === 'hold') {
    holdT += dt;
    holdBar.style.transform = `scaleX(${Math.min(1, holdT / Math.max(0.01, holdS))})`;
    if (holdT >= holdS && next) { holdBar.style.transform = 'scaleX(0)'; turn(); }
  }
  perf.push(performance.now() - t0);
  if (perf.length > 600) perf.shift();
}
const perf = [];
window.__perf = perf;
const holdBar = $('holdBar');

// ---------------------------------------------------------------- controls

const pauseBtn = $('pause'), nextBtn = $('next'), saveBtn = $('save');
function setPaused(v) {
  paused = v;
  pauseBtn.setAttribute('aria-pressed', String(v));
  pauseBtn.textContent = v ? 'Play' : 'Pause';
  document.body.classList.toggle('paused', v);
}
pauseBtn.addEventListener('click', () => setPaused(!paused));
nextBtn.addEventListener('click', () => goNext());
saveBtn.addEventListener('click', save);
function goNext() {
  if (phase === 'turn') return;
  holdBar.style.transform = 'scaleX(0)';
  turn();
  if (paused) setPaused(false);
}
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.key === ' ' || e.code === 'Space') {
    if (e.target && e.target.tagName === 'BUTTON') return; // the button handles it
    e.preventDefault(); setPaused(!paused);
  } else if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
});

function save() {
  if (!cur) return;
  const c = S.still(L, cur.sheet, 2);
  c.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vehicle-${cur.sheet.drgNo}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

addEventListener('hashchange', () => {
  const h = location.hash.replace('#', '');
  if (/^\d{1,5}$/.test(h) && cur && +h !== cur.seed) {
    next = prepare(+h, L);
    goNext();
  }
});

// redo the layout on resize, at the same progress
let rz = 0, lastSize = '';
function relayout() {
  const size = `${desk.clientWidth}x${desk.clientHeight}x${devicePixelRatio}`;
  if (size === lastSize) return;
  lastSize = size;
  measure();
  next = null;
  if (cur) {
    const seed = cur.seed;
    const p = plates[front];
    cur = prepare(seed, L);
    p.load(cur.sheet);
    p.advance(phase === 'draw' ? drawT() : 1);
    window.__sheet = { seed, source, drawing: cur.d, sheet: cur.sheet, L };
  }
}
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(relayout, 180); });
motionQ.addEventListener?.('change', (e) => { reduced = e.matches; if (reduced && cur) plates[front].advance(1); });
document.addEventListener('visibilitychange', () => { last = 0; });

// ---------------------------------------------------------------- boot

measure();
lastSize = `${desk.clientWidth}x${desk.clientHeight}x${devicePixelRatio}`;
plates[1].c.hidden = true;
plates[0].c.style.zIndex = 2;
show(firstSeed());
document.body.classList.add('ready');
if (stillMode || reduced || atParam != null) plates[front].advance(drawT());
if (stillMode) document.body.classList.add('still');
if (q.has('bench')) {
  // per-frame pen cost over a 12 s draw at 60 fps, written into the title
  const p = plates[front]; p.reset();
  const times = [];
  const steps = Math.round(drawS * 60);
  for (let i = 1; i <= steps; i++) { const a = performance.now(); p.advance(i / steps); p.g.getImageData(0, 0, 1, 1); times.push(performance.now() - a); }
  times.sort((x, y) => x - y);
  let segs = 0; for (const s of cur.d.strokes) segs += (s.pts.length >> 1) - 1;
  const tm = performance.now(); p.reset(); p.advance(1); p.g.getImageData(0, 0, 1, 1); const full = performance.now() - tm;
  document.title = `bench src=${source} segs=${segs} ops=${cur.sheet.ops.length} dpr=${dpr.toFixed(2)} med=${times[steps >> 1].toFixed(2)} p95=${times[Math.floor(steps * 0.95)].toFixed(2)} max=${times[steps - 1].toFixed(2)} full=${full.toFixed(0)}ms`;
} else requestAnimationFrame(frame);
