// No. 014: twelve cities, each walked for fifteen minutes from one spot. walk.js does the walking; this draws it.
(() => {
  'use strict';
  const html = document.documentElement;
  html.classList.replace('no-js', 'js');
  const params = new URLSearchParams(location.search);
  const bare = params.has('bare');
  if (bare) html.classList.add('bare');

  const W = window.Walk, { REACH, SECONDS, GRID, NEAR } = W;
  const VIEW = REACH + 100;          // meters from the middle of a map to its edge
  const FREE = 1200;                 // how far the start can be moved
  const PLAY_MS = 12000;             // the fifteen minutes take twelve seconds
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls) => { const x = document.createElement(tag); if (cls) x.className = cls; return x; };

  // a color for each minute, from the start outward
  const STOPS = [[0, [255, 241, 184]], [.25, [255, 194, 71]], [.5, [255, 122, 61]], [.72, [240, 69, 126]], [1, [143, 91, 255]]];
  const BANDS = Array.from({ length: 15 }, (_, i) => {
    const f = i / 14, k = STOPS.findIndex((s) => s[0] >= f), [f1, c1] = STOPS[Math.max(0, k - 1)], [f2, c2] = STOPS[k];
    const u = f2 > f1 ? (f - f1) / (f2 - f1) : 0;
    return c1.map((v, j) => Math.round(v + (c2[j] - v) * u));
  });
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  const band = (sec) => Math.min(14, Math.floor(sec / 60));
  $('ramp').style.background = `linear-gradient(90deg,${BANDS.map((c, i) => `${rgb(c)} ${i / .15}% ${(i + 1) / .15}%`).join(',')})`;

  // One map: the streets, the ground covered (a soft fill under them) and the streets reached, on three canvases.
  class Panel {
    constructor(box, big) {
      this.box = box; this.big = big; this.city = null; this.size = 0; this.seen = null; this.to = 0; this.fillTo = -1;
      this.base = el('canvas'); this.halo = el('canvas', 'halo'); this.line = el('canvas'); this.dot = el('i', 'dot');
      this.halo.width = this.halo.height = GRID;
      this.fill = this.halo.getContext('2d'); this.image = this.fill.createImageData(GRID, GRID);
      box.prepend(this.base, this.halo, this.line, this.dot);
    }
    measure() {
      const css = this.box.clientWidth, dpr = Math.min(window.devicePixelRatio || 1, 2), px = Math.round(css * dpr);
      if (!px || px === this.size) return;
      this.size = px; this.css = css; this.dpr = dpr; this.seen = null;
      this.base.width = this.base.height = this.line.width = this.line.height = px;
    }
    show(city) { this.city = city; this.seen = null; }
    render(T) {
      const c = this.city, w = c && c.walk;
      if (!w || !this.size) return;
      const upto = T >= SECONDS ? SECONDS + 1 : Math.floor(T);
      if (w !== this.seen || c.at.x !== this.ax || c.at.y !== this.ay) {
        this.seen = w; this.ax = c.at.x; this.ay = c.at.y; this.to = 0; this.fillTo = -1;
        this.drawStreets(c.graph, w);
        this.line.getContext('2d').clearRect(0, 0, this.size, this.size);
        const k = this.css / (2 * VIEW), dx = (w.x - this.ax) * k, dy = -(w.y - this.ay) * k;
        this.dot.style.transform = this.halo.style.transform = `translate(${dx}px,${dy}px)`;
      }
      if (upto < this.to) { this.line.getContext('2d').clearRect(0, 0, this.size, this.size); this.to = 0; }
      if (upto > this.to) { this.drawReached(w, this.to, upto); this.to = upto; }
      if (upto !== this.fillTo) { this.drawGround(w, upto); this.fillTo = upto; }
    }
    drawStreets(g, w) {
      const ctx = this.base.getContext('2d'), s = this.size, k = s / (2 * VIEW), h = s / 2, ax = this.ax, ay = this.ay;
      ctx.clearRect(0, 0, s, s);
      ctx.beginPath();
      for (let e = 0; e < g.E; e++) {
        const n = g.count[e]; if (!n) continue;
        const q = 4 * e;
        if (g.box[q] > ax + VIEW || g.box[q + 2] < ax - VIEW || g.box[q + 1] > ay + VIEW || g.box[q + 3] < ay - VIEW) continue;
        let i = g.at[e]; const end = i + n;
        ctx.moveTo(h + (g.px[i] - ax) * k, h - (g.py[i] - ay) * k);
        for (i++; i < end; i++) ctx.lineTo(h + (g.px[i] - ax) * k, h - (g.py[i] - ay) * k);
      }
      ctx.lineWidth = (this.big ? 1 : .7) * this.dpr; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(150,166,198,.34)'; ctx.stroke();
      // the ring: fifteen minutes in a straight line
      ctx.beginPath(); ctx.arc(h + (w.x - ax) * k, h - (w.y - ay) * k, REACH * k, 0, 2 * Math.PI);
      ctx.lineWidth = this.dpr; ctx.strokeStyle = 'rgba(238,241,246,.5)'; ctx.stroke();
    }
    drawReached(w, from, to) {
      const ctx = this.line.getContext('2d'), s = this.size, k = s / (2 * VIEW), h = s / 2, ax = this.ax, ay = this.ay;
      ctx.lineWidth = (this.big ? 1.7 : 1.15) * this.dpr; ctx.lineCap = 'round';
      for (let m = band(from); m <= 14 && m * 60 < to; m++) {
        const a = w.from[Math.max(from, m * 60)], b = w.from[m === 14 ? to : Math.min(to, (m + 1) * 60)];
        if (b <= a) continue;
        ctx.beginPath();
        for (let i = a; i < b; i++) {
          const p = w.order[i];
          ctx.moveTo(h + (w.X1[p] - ax) * k, h - (w.Y1[p] - ay) * k); ctx.lineTo(h + (w.X2[p] - ax) * k, h - (w.Y2[p] - ay) * k);
        }
        ctx.strokeStyle = rgb(BANDS[m]); ctx.stroke();
      }
    }
    drawGround(w, upto) {
      if (!w.sec) {                                   // each cell's second of arrival, -1 if never or outside the ring
        const per = SECONDS / REACH, half = GRID / 2, lim = (REACH / W.CELL) ** 2;
        w.sec = new Int16Array(GRID * GRID);
        for (let iy = 0, q = 0; iy < GRID; iy++) for (let ix = 0; ix < GRID; ix++, q++) {
          const t = w.when[q];
          w.sec[q] = t === Infinity || (ix + .5 - half) ** 2 + (iy + .5 - half) ** 2 > lim ? -1 : Math.min(SECONDS, Math.ceil(t * per));
        }
      }
      const d = this.image.data, sec = w.sec;
      for (let q = 0, i = 0; q < sec.length; q++, i += 4) {
        const t = sec[q];
        if (t < 0 || t >= upto) { d[i + 3] = 0; continue; }
        const c = BANDS[band(t)]; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      }
      this.fill.putImageData(this.image, 0, 0);
    }
  }

  // ---- the cities, read from the page ----
  const cities = [...document.querySelectorAll('.city')].map((node) => {
    const c = {
      slug: node.id, node, name: node.querySelector('h2').textContent, place: node.querySelector('.from').textContent,
      year: +node.dataset.year, since: node.querySelector('.since').textContent, note: node.querySelector('.note').textContent,
      pct: node.querySelector('.reach b'), km: node.querySelector('.reach span'),
      graph: null, wide: false, loading: null, at: { x: 0, y: 0 }, walk: null,
    };
    c.panel = new Panel(node.querySelector('.map'), false);
    c.panel.show(c);
    node.querySelector('.open').addEventListener('click', () => open(c));
    return c;
  });
  const bySlug = Object.fromEntries(cities.map((c) => [c.slug, c]));
  let order = 'age';

  // ---- the clock ----
  let T = SECONDS, playing = false, last = 0, focus = null;
  const big = new Panel($('f-map'), true);
  const slider = $('t'), veil = $('veil'), clock = $('clock'), play = $('play');

  function paint() {
    for (const c of cities) {
      c.panel.render(T);
      if (c.walk) { c.pct.textContent = Math.round(100 * W.share(c.walk, T)) + '%'; c.km.textContent = W.km2(c.walk, T).toFixed(1) + ' km²'; }
    }
    if (focus) {
      big.render(T);
      if (focus.walk) { $('f-pct').textContent = Math.round(100 * W.share(focus.walk, T)) + '%'; $('f-km').textContent = `of the ring · ${W.km2(focus.walk, T).toFixed(1)} of ${W.RING_KM2.toFixed(1)} km²`; }
    }
    const s = Math.floor(T);
    slider.value = s; veil.style.left = (T / SECONDS * 100) + '%';
    clock.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    play.textContent = playing ? 'Pause' : T >= SECONDS ? 'Walk again' : 'Walk';
  }
  function frame(now) {
    if (!playing) return;
    T = Math.min(SECONDS, T + (now - last) * SECONDS / PLAY_MS); last = now;
    if (T >= SECONDS) playing = false;
    paint();
    if (playing) requestAnimationFrame(frame);
  }
  function start(from) {
    if (from != null) T = from;
    playing = true; last = performance.now(); requestAnimationFrame(frame); paint();
  }
  play.addEventListener('click', () => { if (playing) { playing = false; paint(); } else start(T >= SECONDS ? 0 : null); });
  slider.addEventListener('input', () => { playing = false; T = +slider.value; paint(); });

  // ---- the order of the cities ----
  function sort() {
    const reach = (c) => c.walk ? W.share(c.walk, SECONDS) : -1;
    const list = [...cities].sort(order === 'reach' ? (a, b) => reach(b) - reach(a) : (a, b) => a.year - b.year);
    list.forEach((c, i) => { c.node.style.order = i; c.rank = i; });
    return list;
  }
  for (const b of document.querySelectorAll('[data-order]')) b.addEventListener('click', () => {
    order = b.dataset.order;
    for (const o of document.querySelectorAll('[data-order]')) o.setAttribute('aria-pressed', o === b);
    sort();
  });

  // ---- loading ----
  const load = (c, wide) => fetch(`data/${c.slug}${wide ? '-wide' : ''}.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => { c.graph = W.graph(d); c.wide = wide; c.walk = W.walk(c.graph, c.at.x, c.at.y); });
  const widen = (c) => c.wide ? Promise.resolve() : (c.loading = c.loading || load(c, true));

  const measure = () => { for (const c of cities) c.panel.measure(); big.measure(); if (!playing) paint(); };
  new ResizeObserver(measure).observe($('grid'));
  new ResizeObserver(measure).observe($('f-map'));

  T = still || bare ? SECONDS : 0;
  paint();
  let left = cities.length, begun = false;
  const begin = () => { if (begun) return; begun = true; if (!still && !bare) start(0); else paint(); };
  for (const c of cities) load(c, false).then(() => { if (!playing) paint(); }, () => c.node.classList.add('failed')).then(() => {
    if (!--left) { begin(); const c = bySlug[location.hash.slice(1)]; if (c && !bare) open(c); html.classList.add('ready'); }
  });
  setTimeout(begin, 4000);

  // ---- one city, opened ----
  const dialog = $('focus'), map = $('f-map'), dock = $('dock'), home = el('span');
  const WINDS = ['east', 'north-east', 'north', 'north-west', 'west', 'south-west', 'south', 'south-east'];

  function describe() {
    const c = focus, w = c.walk, d = w ? Math.hypot(w.x, w.y) : 0, moved = d >= 20;
    $('f-from').textContent = moved
      ? `${Math.round(d / 10) * 10} m ${WINDS[Math.round(Math.atan2(w.y, w.x) / (Math.PI / 4) + 8) % 8]} of ${c.place}`
      : c.place;
    $('f-reset').hidden = !moved;
    c.node.querySelector('.from').textContent = moved ? `near ${c.place}` : c.place;
  }
  function open(c) {
    focus = c; big.show(c);
    $('f-name').textContent = c.name; $('f-note').textContent = c.note; $('f-since').textContent = c.since;
    $('f-reset').textContent = `Back to ${c.place}`;
    const list = sort(), i = list.indexOf(c), prev = list[(i + list.length - 1) % list.length], next = list[(i + 1) % list.length];
    $('f-prev').textContent = `← ${prev.name}`; $('f-prev').onclick = () => open(prev);
    $('f-next').textContent = `${next.name} →`; $('f-next').onclick = () => open(next);
    if (!dialog.open) { dock.replaceWith(home); $('f-dock').append(dock); dialog.showModal(); }
    history.replaceState(null, '', '#' + c.slug);
    map.classList.toggle('wait', !c.wide);
    describe(); big.measure(); paint();
    widen(c).then(() => { if (focus === c) { map.classList.remove('wait'); paint(); } }, () => {});
  }
  dialog.addEventListener('close', () => {
    focus = null; home.replaceWith(dock);
    history.replaceState(null, '', location.pathname + location.search);
    if (order === 'reach') sort();
    paint();
  });
  $('f-close').addEventListener('click', () => dialog.close());
  addEventListener('hashchange', () => { const c = bySlug[location.hash.slice(1)]; if (c && c !== focus && c.walk) open(c); });

  // moving the start: the map slides under it
  function move(x, y) {
    const c = focus; if (!c || !c.wide) return;
    const d = Math.hypot(x, y); if (d > FREE) { x *= FREE / d; y *= FREE / d; }
    c.at = { x, y }; c.walk = W.walk(c.graph, x, y);
    describe();
    if (!playing) paint();
  }
  let held = null;
  map.addEventListener('pointerdown', (e) => {
    if (!focus || !focus.wide || e.button) return;
    held = { id: e.pointerId, x: e.clientX, y: e.clientY, ax: focus.at.x, ay: focus.at.y };
    map.setPointerCapture(e.pointerId); map.classList.add('held'); $('f-hint').hidden = true;
  });
  map.addEventListener('pointermove', (e) => {
    if (!held || e.pointerId !== held.id) return;
    const k = 2 * VIEW / map.clientWidth;
    move(held.ax - (e.clientX - held.x) * k, held.ay + (e.clientY - held.y) * k);
  });
  const drop = (e) => {
    if (!held || e.pointerId !== held.id) return;
    held = null; map.classList.remove('held');
    if (focus && focus.walk) move(focus.walk.x, focus.walk.y);       // settle on the street the walk starts from
  };
  map.addEventListener('pointerup', drop); map.addEventListener('pointercancel', drop);
  map.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [-60, 0], ArrowRight: [60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] }[e.key];
    if (!step || !focus) return;
    e.preventDefault(); move(focus.at.x + step[0], focus.at.y + step[1]);
  });
  $('f-reset').addEventListener('click', () => move(0, 0));
})();
