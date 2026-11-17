// No. 015: two cities side by side, every street in the color of the direction it runs.
// _shape.py measures the cities; this draws two of them and sweeps a compass hand across both.
(() => {
  'use strict';
  const html = document.documentElement;
  html.classList.replace('no-js', 'js');
  const params = new URLSearchParams(location.search);
  const bare = params.has('bare');
  if (bare) html.classList.add('bare');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; };

  const R = 1500, VIEW = R + 20;       // meters: the circle of streets, and from the middle of a map to its edge
  const SWEEP_MS = 5200;               // the hand takes this long to go from north round to south
  const FULL = 0.65;                   // a petal reaches the compass's rim when it holds this share of the street
  const EVEN = 1 / 36;                 // each petal's share if streets ran every way alike

  // A color for each direction. Streets at right angles share one, so the wheel turns once in 90 degrees.
  function oklch(L, C, h) {
    const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]
      .map((v) => Math.round(255 * Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055))));
  }
  const HUE = Array.from({ length: 90 }, (_, d) => `rgb(${oklch(0.8, 0.135, 95 + d * 4).join(',')})`);
  const near = (deg, mid, by) => { const d = Math.abs(((deg - mid) % 180 + 270) % 180 - 90); return d <= by; };

  // ---- the cities, read from the table in the page ----
  const cities = [...document.querySelectorAll('tbody tr[id]')].map((tr) => ({
    slug: tr.id, tr, name: tr.querySelector('th').firstChild.textContent, place: tr.querySelector('small').textContent,
    s: Object.fromEntries(Object.entries(tr.dataset).map(([k, v]) => [k, +v])), seg: null, rose: null, loading: null,
  }));
  const bySlug = Object.fromEntries(cities.map((c) => [c.slug, c]));

  function load(c) {
    return c.loading = c.loading || fetch(`data/${c.slug}.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => {
      // every piece of street, sorted into 180 bins by the direction it runs
      const bins = Array.from({ length: 180 }, () => []), e = d.e, n = d.n;
      for (let i = 0; i < e.length;) {
        const a = e[i], b = e[i + 1], k = e[i + 2];
        let x = n[2 * a], y = n[2 * a + 1];
        for (let j = 0; j <= k; j++) {
          const nx = j < k ? x + e[i + 3 + 2 * j] : n[2 * b], ny = j < k ? y + e[i + 4 + 2 * j] : n[2 * b + 1];
          if (nx !== x || ny !== y) bins[Math.floor((Math.atan2(nx - x, ny - y) * 180 / Math.PI + 360) % 180) % 180].push(x, y, nx, ny);
          x = nx; y = ny;
        }
        i += 3 + 2 * k;
      }
      c.seg = bins.map((v) => Float32Array.from(v)); c.rose = d.rose;
    });
  }

  // ---- one side: a map and a compass ----
  class Side {
    constructor(key) {
      this.key = key; this.city = null; this.drawn = 0;
      this.mapBox = $('map-' + key); this.roseBox = $('rose-' + key);
      this.map = this.mapBox.querySelector('canvas'); this.rose = this.roseBox.querySelector('canvas');
      this.pick = $('pick-' + key); this.name = $('name-' + key); this.from = $('from-' + key); this.score = $('score-' + key);
    }
    measure() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const [box, canvas] of [[this.mapBox, this.map], [this.roseBox, this.rose]]) {
        const px = Math.round(box.clientWidth * dpr);
        if (px && (canvas.width !== px || canvas.height !== px)) { canvas.width = canvas.height = px; this.drawn = -1; }
      }
      this.dpr = dpr;
    }
    // streets whose direction the hand has passed (upto, in degrees), or all of them with one direction picked out
    drawMap(upto, pick) {
      const c = this.city; if (!c || !c.seg || !this.map.width) return;
      const ctx = this.map.getContext('2d'), s = this.map.width, k = s / (2 * VIEW), h = s / 2;
      let from = this.drawn;
      if (pick != null || this.picked || from < 0 || upto < from) {
        ctx.clearRect(0, 0, s, s); from = 0;
        ctx.beginPath(); ctx.arc(h, h, R * k, 0, 2 * Math.PI); ctx.lineWidth = this.dpr; ctx.strokeStyle = 'rgba(238,241,246,.16)'; ctx.stroke();
        // 500 m, in the corner the circle leaves free
        const d = this.dpr, x = 2 * d, y = s - 5 * d;
        ctx.beginPath(); ctx.moveTo(x, y - 4 * d); ctx.lineTo(x, y); ctx.lineTo(x + 500 * k, y); ctx.lineTo(x + 500 * k, y - 4 * d);
        ctx.strokeStyle = 'rgba(154,165,184,.9)'; ctx.stroke();
        ctx.fillStyle = 'rgba(154,165,184,1)'; ctx.font = `500 ${10.5 * d}px 'Public Sans', system-ui, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('500 m', x + 5 * d, y - 6 * d);
      }
      this.picked = pick != null; this.drawn = upto;
      ctx.lineCap = 'round';
      for (let b = from; b < upto; b++) {
        const v = c.seg[b]; if (!v.length) continue;
        const on = pick == null || near(b + .5, pick, 7.5);
        ctx.globalAlpha = on ? 1 : .16; ctx.lineWidth = (on && pick != null ? 1.8 : 1.15) * this.dpr; ctx.strokeStyle = HUE[b % 90];
        ctx.beginPath();
        for (let i = 0; i < v.length; i += 4) { ctx.moveTo(h + v[i] * k, h - v[i + 1] * k); ctx.lineTo(h + v[i + 2] * k, h - v[i + 3] * k); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // the compass: a petal each way for every 5 degrees of direction, its area the share of street that runs that way
    drawRose(upto, pick, hand) {
      const c = this.city; if (!c || !c.rose || !this.rose.width) return;
      const ctx = this.rose.getContext('2d'), s = this.rose.width, h = s / 2, d = this.dpr, rim = h - 19 * d, rad = Math.PI / 180;
      ctx.clearRect(0, 0, s, s);
      // the rim is the key: the color of a street that runs toward that point of the compass
      ctx.lineWidth = 3 * d;
      for (let b = 0; b < 360; b += 2) {
        ctx.strokeStyle = HUE[b % 90]; ctx.globalAlpha = pick == null || near(b, pick, 7.5) ? 1 : .25;
        ctx.beginPath(); ctx.arc(h, h, rim + 3 * d, (b - 91.2) * rad, (b - 88.8) * rad); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.lineWidth = d;
      ctx.setLineDash([2 * d, 3 * d]); ctx.strokeStyle = 'rgba(238,241,246,.4)';
      ctx.beginPath(); ctx.arc(h, h, rim * Math.sqrt(EVEN / FULL), 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      for (let b = 0; b < 36; b++) {
        if (b * 5 + 2.5 > upto && upto < 180) continue;
        const r = rim * Math.sqrt(Math.min(1, c.rose[b] / FULL));
        ctx.fillStyle = HUE[(b * 5) % 90]; ctx.globalAlpha = pick == null || near(b * 5, pick, 7.5) ? 1 : .2;
        for (const turn of [0, 180]) {
          const mid = (b * 5 + turn - 90) * rad;
          ctx.beginPath(); ctx.moveTo(h, h); ctx.arc(h, h, r, mid - 2.15 * rad, mid + 2.15 * rad); ctx.closePath(); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (hand != null) {
        const a = (hand - 90) * rad;
        ctx.beginPath(); ctx.moveTo(h - rim * Math.cos(a), h - rim * Math.sin(a)); ctx.lineTo(h + rim * Math.cos(a), h + rim * Math.sin(a));
        ctx.lineWidth = d; ctx.strokeStyle = 'rgba(238,241,246,.85)'; ctx.stroke();
      }
      ctx.fillStyle = 'rgba(154,165,184,1)'; ctx.font = `600 ${10 * d}px 'Public Sans', system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('N', h, 7 * d);
    }
  }
  // The direction of the street nearest a pointer on a map, to the nearest 5 degrees; null if none is within reach.
  function streetAt(side, e) {
    const c = side.city; if (!c || !c.seg) return null;
    const r = side.mapBox.getBoundingClientRect(), m = 2 * VIEW / r.width;
    const x = (e.clientX - r.left - r.width / 2) * m, y = -(e.clientY - r.top - r.height / 2) * m;
    let best = (14 * m) ** 2, at = null;
    for (let b = 0; b < 180; b++) {
      const v = c.seg[b];
      for (let i = 0; i < v.length; i += 4) {
        const ax = v[i], ay = v[i + 1], dx = v[i + 2] - ax, dy = v[i + 3] - ay, d2 = dx * dx + dy * dy;
        const u = d2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / d2)) : 0;
        const d = (x - ax - u * dx) ** 2 + (y - ay - u * dy) ** 2;
        if (d < best) { best = d; at = b; }
      }
    }
    return at == null ? null : (Math.round((at + .5) / 5) * 5) % 180;
  }
  const sides = { a: new Side('a'), b: new Side('b') };
  const both = [sides.a, sides.b];

  // ---- the sweep ----
  let angle = 180, playing = false, last = 0, pick = null;
  function paint() {
    for (const side of both) {
      side.drawMap(pick != null ? 180 : Math.floor(angle), pick);
      side.drawRose(pick != null ? 180 : angle, pick, pick != null ? pick : angle < 180 ? angle : null);
    }
  }
  function frame(now) {
    if (!playing) return;
    angle = Math.min(180, angle + (now - last) * 180 / SWEEP_MS); last = now;
    if (angle >= 180) playing = false;
    if (pick == null) paint();
    if (playing) requestAnimationFrame(frame);
  }
  function sweep() {
    pick = null; held = false; if (typeof say === 'function' && sides.a.city) say();
    if (still || bare) { angle = 180; playing = false; paint(); return; }
    angle = 0; playing = true; last = performance.now(); paint(); requestAnimationFrame(frame);
  }
  $('sweep').addEventListener('click', sweep);

  // ---- pointing at a street or a compass picks out the streets that run that way, in both cities; a click holds it ----
  const read = $('read'), free = $('free');
  const HINT = 'Point at a street or a compass to pick out every street that runs that way, in both cities.';
  let held = false;
  function say() {
    const [a, b] = both.map((s) => s.city);
    free.hidden = !held;
    if (pick == null || !a.rose || !b.rose) { read.textContent = HINT; return; }
    const share = (c) => { const k = Math.round(pick / 5); return Math.round(100 * (c.rose[(k + 35) % 36] + c.rose[k % 36] + c.rose[(k + 1) % 36])); };
    read.replaceChildren('Street within 7.5° of this line: ', el('b', '', `${a.name} ${share(a)}%`), ', ', el('b', '', `${b.name} ${share(b)}%`), held ? '.' : '. Click to hold it.');
  }
  const choose = (deg) => { if (deg === pick) return; pick = deg; say(); paint(); };
  const release = () => { const was = pick != null || held; pick = null; held = false; if (was) { say(); paint(); } };
  const hold = (deg) => { held = true; pick = null; choose(deg); };
  free.addEventListener('click', release);
  for (const side of both) {
    // on a compass, the direction is the pointer's own
    const rose = side.roseBox;
    const compass = (e) => {
      const r = rose.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      return Math.hypot(dx, dy) < 4 ? pick : (Math.round(((Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 180) / 5) * 5) % 180;
    };
    rose.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') { rose.setPointerCapture(e.pointerId); hold(compass(e)); }
      else if (held) { held = false; pick = null; choose(compass(e)); } else hold(compass(e));
    });
    rose.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' ? !held : e.buttons) { if (e.pointerType !== 'mouse') held = true; choose(compass(e)); } });
    rose.addEventListener('pointerleave', () => { if (!held) release(); });
    // on a map, it is the direction of the street under the pointer
    const map = side.mapBox;
    map.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && !held) { const d = streetAt(side, e); if (d == null) release(); else choose(d); } });
    map.addEventListener('pointerleave', () => { if (!held) release(); });
    map.addEventListener('click', (e) => {
      const d = streetAt(side, e);
      if (d == null || (held && d === pick)) release(); else hold(d);
    });
  }

  // ---- the numbers ----
  const ROWS = [
    ['grid', 'On the grid', 'street within 7.5° of the city’s two main directions', '%', 100],
    ['cross', 'Crossroads', 'junctions where four or more streets meet', '%', 100],
    ['tee', 'T-junctions', 'junctions where three streets meet', '%', 100],
    ['dead', 'Dead ends', 'as a share of junctions and dead ends', '%', 100],
    ['corner', 'Between corners', 'median length of street from one junction to the next', ' m', 100],
    ['km', 'Street per km²', '', ' km', 30],
  ];
  const tape = $('tape'), cells = {};
  for (const [key, name, note] of ROWS) {
    const row = el('div', 'row'), what = el('div', 'what');
    what.append(el('b', '', name)); if (note) what.append(el('span', '', note));
    cells[key] = {};
    for (const side of ['a', 'b']) {
      const val = el('div', 'val ' + side), num = el('b'), bar = el('div', 'bar'), fill = el('i');
      bar.append(fill); val.append(num, bar); cells[key][side] = { num, fill };
      if (side === 'a') row.append(val, what); else row.append(val);
    }
    tape.append(row);
  }
  function numbers() {
    for (const [key, , , unit, full] of ROWS) for (const side of both) {
      const v = side.city.s[key], { num, fill } = cells[key][side.key];
      num.replaceChildren(String(v), el('small', '', unit.trim()));
      fill.style.width = Math.min(100, 100 * v / full) + '%';
    }
  }

  // ---- choosing the two ----
  for (const side of both) {
    for (const c of cities) side.pick.append(new Option(c.name, c.slug));
    side.pick.addEventListener('change', () => {
      const other = side === sides.a ? sides.b : sides.a, c = bySlug[side.pick.value];
      set(side === sides.a ? c : c === other.city ? side.city : other.city, side === sides.b ? c : c === other.city ? side.city : other.city);
    });
  }
  function set(a, b, quiet) {
    sides.a.city = a; sides.b.city = b; pick = null;
    for (const side of both) {
      const c = side.city;
      side.pick.value = c.slug; if (side.name) side.name.textContent = c.name; side.from.textContent = c.place; side.score.textContent = c.s.grid + '%'; side.drawn = -1;
      side.mapBox.setAttribute('aria-label', `Street map of ${c.name}, 3 km across, each street colored by its direction`);
      side.roseBox.setAttribute('aria-label', `Compass of street directions in ${c.name}: ${c.s.grid}% of street runs along its two main directions`);
    }
    const pair = `${a.slug}-${b.slug}`;
    for (const t of document.querySelectorAll('[data-pair]')) t.setAttribute('aria-pressed', t.dataset.pair === pair);
    for (const c of cities) c.tr.classList.toggle('on', c === a || c === b);
    if (!quiet) history.replaceState(null, '', '#' + pair);
    numbers(); say();
    for (const side of both) { side.map.getContext('2d').clearRect(0, 0, side.map.width, side.map.height); side.rose.getContext('2d').clearRect(0, 0, side.rose.width, side.rose.height); }
    Promise.all([load(a), load(b)]).then(() => { if (sides.a.city === a && sides.b.city === b) { html.classList.add('ready'); sweep(); } }, () => { read.textContent = 'The map did not load.'; });
  }
  for (const t of document.querySelectorAll('[data-pair]')) t.addEventListener('click', () => { const [a, b] = t.dataset.pair.split('-'); set(bySlug[a], bySlug[b]); });
  const fromHash = () => { const [a, b] = location.hash.slice(1).split('-').map((s) => bySlug[s]); return a && b && a !== b ? [a, b] : null; };
  addEventListener('hashchange', () => { const p = fromHash(); if (p && (p[0] !== sides.a.city || p[1] !== sides.b.city)) set(p[0], p[1], true); });

  // the canvas labels are drawn in Public Sans: draw again once it has come
  if (document.fonts) Promise.all([document.fonts.load("500 10px 'Public Sans'"), document.fonts.load("600 10px 'Public Sans'")]).then(() => { for (const side of both) side.drawn = -1; if (!playing) paint(); }, () => {});
  const measure = () => { for (const side of both) side.measure(); if (!playing) paint(); };
  new ResizeObserver(measure).observe($('duel'));
  for (const side of both) side.measure();
  const first = fromHash() || [bySlug.london, bySlug.newyork];
  set(first[0], first[1], true);
})();
