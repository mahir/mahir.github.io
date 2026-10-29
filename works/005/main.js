// No. 005 boots here: the closing prices, a company to show, its land built in a worker, then the beats. Without
// WebGL, or if anything fails to load, the page shows a still of one range and says what the experiment is.

import { decode, pick, seedOf, YEAR } from './data.js';
import { makeScale, FLOOR } from './scale.js';
import { weatherFor, deckFor } from './weather.js';
import { makePath, beats as beatsAt, blend, T } from './path.js';
import { crestLine, monotone, sampler } from './terrain.js';

const root = document.documentElement;
root.classList.replace('no-js', 'js');
const params = new URLSearchParams(location.search);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 700;
const still = params.has('still'); // opens on the rest view with nothing over it, for the share image
if (params.has('nogl')) HTMLCanvasElement.prototype.getContext = () => null; // to check the fallback

const KEY = 'works005.last';
const remembered = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const remember = (t) => { try { localStorage.setItem(KEY, t); } catch { /* private window */ } };
const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
const mixBeats = (a, b, u) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k] + (b[k] - a[k]) * u]));
const END = beatsAt(T.rest + 10);

try {
  const res = await fetch(new URL('./prices.json', import.meta.url));
  if (!res.ok) throw new Error(`prices.json: ${res.status}`);
  const json = await res.json();
  const [{ createScene }, { createUI }] = await Promise.all([import('./scene.js'), import('./ui.js')]);
  const canvas = document.getElementById('scene');
  const scene = createScene(canvas, { small });
  const worker = new Worker(new URL('./terrain-worker.js', import.meta.url), { type: 'module' });
  const noFlight = still || reducedMotion; // no flight: the chart, then straight to the rest

  let aspect = scene.resize();
  let range = null, t = 0, skipping = null, wantSkip = false, buildId = 0, swapping = false, restFrames = 0;

  const ui = createUI({ onSkip: skip, onAnother: another });

  function show(symbol) {
    const d = decode(json, symbol);
    const scale = makeScale(d.lo, d.hi);
    const crest = monotone(d.closes.map(scale.alt), scale.L / (YEAR - 1));
    const top = Math.max(...[...d.closes, ...d.ma50, ...d.ma200].map(scale.alt));
    const sky = weatherFor(d.change);
    const deck = deckFor(sky, top);
    const weather = { ...sky, cloudBase: deck.base, ceiling: deck.ceiling };
    range = { d, scale, weather, crest, heightAt: null, ready: false };
    scene.setWeather(weather, scale);
    scene.setLine(crestLine(d.closes, scale, 4));
    rebuildPath();
    ui.setTicker(d);
    remember(symbol);
    t = 0; skipping = null; wantSkip = false; restFrames = 0;
    root.classList.remove('resting');
    worker.postMessage({ id: ++buildId, closes: d.closes, ma50: d.ma50, ma200: d.ma200, lo: d.lo, hi: d.hi, seed: seedOf(symbol), quality: small ? 'mid' : 'high' });
  }

  worker.onmessage = async ({ data }) => {
    if (data.id !== buildId) return;
    const mine = range;
    mine.heightAt = sampler(data);
    scene.setTerrain(data, mine.heightAt);
    rebuildPath();
    await scene.prepare();
    if (range !== mine) return;
    range.ready = true;
    if (noFlight) t = T.rest;
    if (wantSkip) skip();
  };
  worker.onerror = (e) => fail(e);

  function rebuildPath() {
    const { cloudBase, ceiling } = range.weather;
    range.path = makePath({ scale: range.scale, crest: range.crest, aspect, cloudBase, ceiling, ground: range.heightAt || (() => FLOOR) });
  }

  function skip() {
    if (!range || t >= T.rest) return;
    if (!range.ready) { wantSkip = true; return; }
    skipping = { pose: range.path.at(t), beats: beatsAt(t), u: 0 };
    t = T.rest;
  }

  function another() {
    if (swapping || !range) return;
    swapping = true;
    root.classList.add('swap');
    setTimeout(() => {
      show(pick(json, { last: range.d.t }));
      root.classList.remove('swap');
      swapping = false;
    }, 380);
  }

  // Is anything between the camera and this point? A few samples along the way, against the land.
  function hidden(p, cam) {
    if (!range.heightAt) return false;
    for (let i = 1; i < 18; i++) {
      const u = i / 18;
      const x = cam[0] + (p[0] - cam[0]) * u, y = cam[1] + (p[1] - cam[1]) * u, z = cam[2] + (p[2] - cam[2]) * u;
      if (range.heightAt(x, z) > y + 20) return true;
    }
    return false;
  }

  function tag(node, p, cam, opacity) {
    const s = scene.project(p);
    ui.place(node, s.visible && !hidden(p, cam) ? s : null, opacity, true);
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (range) {
      // hold on the chart until the land is built; with reduced motion, hold on the finished chart
      if (noFlight && !range.ready) t = T.tip - 0.001;
      else if (!range.ready && t >= T.tip) t = T.tip;
      else t += dt;
      let b = beatsAt(t);
      let pose = noFlight && t >= T.rest ? range.path.rest : range.path.at(t);
      if (skipping) {
        skipping.u = Math.min(1, skipping.u + dt / 1.4);
        const u = smooth(skipping.u);
        pose = blend(skipping.pose, pose, u);
        b = mixBeats(skipping.beats, END, u);
        if (skipping.u >= 1) skipping = null;
      }
      const stretch = 1 + (range.path.stretch - 1) * b.stretch;
      scene.frame({ pose, beats: b, stretch, time: now / 1000 });

      const { d, scale } = range;
      const alt = (c) => FLOOR + (scale.alt(c) - FLOOR) * stretch;
      const marks = skipping ? 0 : smooth((t - T.flight + 0.4) / 1.4);
      tag(ui.el.hi, [scale.dayX(d.hiDay), alt(d.hi), 0], pose.pos, marks);
      tag(ui.el.lo, [scale.dayX(d.loDay), alt(d.lo), 0], pose.pos, marks);
      const along = smooth((t - T.alongStart) / 0.8) * (1 - smooth((t - T.alongEnd + 0.4) / 0.8));
      if (along > 0 && !skipping) {
        const i = Math.max(0, Math.min(YEAR - 1, Math.round((pose.target[0] / scale.L) * (YEAR - 1))));
        ui.setCursor(d, i);
        tag(ui.el.cursor, [scale.dayX(i), alt(d.closes[i]), 0], pose.pos, along);
      } else ui.place(ui.el.cursor, null, 0);
      const axis = b.draw * (1 - smooth((t - T.tip) / 0.8));
      const below = FLOOR - 0.07 * scale.relief * stretch;
      ui.place(ui.el.start, scene.project([0, below, 0]), axis);
      ui.place(ui.el.end, scene.project([scale.L, below, 0]), axis);

      const resting = t >= T.rest - 0.6;
      root.classList.toggle('resting', resting);
      if (resting && range.ready && still && ++restFrames === 4) document.title = 'ready';
    }
    requestAnimationFrame(tick);
  }

  addEventListener('resize', () => { aspect = scene.resize(); if (range) rebuildPath(); });
  canvas.addEventListener('click', skip);
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('a, button')) return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); skip(); }
  });

  show(pick(json, { param: params.get('t'), last: remembered() }));
  if (still) root.classList.add('still-mode');
  requestAnimationFrame((n) => { last = n; root.classList.add('ready'); tick(n); });
  if (params.has('dev')) Object.assign(window, { __scene: scene, __range: () => range, __t: (v) => { if (v !== undefined) t = v; return t; } });
} catch (err) {
  fail(err);
}

function fail(err) {
  console.warn(err);
  root.classList.add('no-gl', 'ready');
}
