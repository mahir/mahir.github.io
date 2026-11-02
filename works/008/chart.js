// Philosophy, mind to mind: the chart.
// Lays the thinkers out down a timeline, draws the lines between them, and lets you pan, zoom,
// follow a thinker's lineage up and down, and trace the line that runs from one to another.
(() => {
  'use strict';
  document.documentElement.classList.replace('no-js', 'js');

  const { nodes, edges } = window.Thinkers;
  const SVG = 'http://www.w3.org/2000/svg';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const still = new URLSearchParams(location.search).has('still');
  document.documentElement.classList.toggle('still', still);

  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), chart = $('chart'), world = $('world');
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(SVG, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* ---------- time runs down the sheet, faster where fewer of them wrote ---------- */
  /* ---------- time runs down the sheet, faster where fewer of them wrote ---------- */
  const SHEET_W = 2560;
  const TOP = 110;
  const ANCHORS = [[-720, 0], [-250, 1000], [200, 1450], [800, 1790], [1350, 2330], [1500, 2520], [1700, 3140], [1800, 3760],
    [1900, 4600], [1950, 5300], [2010, 5850]];
  function Y(year) {
    for (let i = 1; i < ANCHORS.length; i++) {
      const [y0, p0] = ANCHORS[i - 1], [y1, p1] = ANCHORS[i];
      if (year <= y1 || i === ANCHORS.length - 1) return TOP + p0 + (year - y0) / (y1 - y0) * (p1 - p0);
    }
  }
  function yearAt(y) {
    const p = y - TOP;
    for (let i = 1; i < ANCHORS.length; i++) {
      const [y0, p0] = ANCHORS[i - 1], [y1, p1] = ANCHORS[i];
      if (p <= p1 || i === ANCHORS.length - 1) return y0 + (p - p0) / (p1 - p0) * (y1 - y0);
    }
  }
  const FIN_Y = Y(2010) + 150;
  const SHEET_H = FIN_Y + 330;
  // the hints in the data run 0 to 1600; spread them over the wider sheet
  const spread = (x) => 110 + x * 1.42;

  // one color per tradition, for the canvas map (the chart takes them from CSS)
  const COLORS = { ancient: '#ff8f6b', east: '#4fd1b0', india: '#ffc35a', islam: '#7fb2ff', west: '#efe8da', source: '#d59bff' };
  const TRADITIONS = [['ancient', 'Greece and Rome'], ['east', 'China and Japan'], ['india', 'India'], ['islam', 'The Islamic world'],
    ['west', 'Europe and the Americas'], ['source', 'From outside philosophy']];

  const fmtYear = (y) => (y < 0 ? `${-y} BCE` : y < 1000 ? `${y} CE` : `${y}`);
  function lifespan(n) {
    if (n.when) return n.when;
    if (n.kind !== 'person') return n.year < 0 ? `c. ${-n.year} BCE` : `${n.year}`;
    const c = n.circa ? 'c. ' : '';
    if (n.died == null) return `born ${n.born}`;
    if (n.born < 0 && n.died < 0) return `${c}${-n.born}–${-n.died} BCE`;
    if (n.born < 0) return `${c}${-n.born} BCE–${n.died} CE`;
    return `${c}${n.born}–${n.died}`;
  }
  const yearOf = (n) => (n.kind === 'person' ? n.born : n.year ?? n.at);

  /* ---------- the graph ---------- */
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const n of nodes) { n.ins = []; n.outs = []; }
  for (const e of edges) { e.a = byId.get(e.from); e.b = byId.get(e.to); e.a.outs.push(e); e.b.ins.push(e); }

  function reach(start, dir) {
    // every node upstream (dir 'ins') or downstream (dir 'outs'), with its distance
    const dist = new Map([[start, 0]]), queue = [start];
    while (queue.length) {
      const n = queue.shift();
      for (const e of n[dir]) {
        const m = dir === 'ins' ? e.a : e.b;
        if (!dist.has(m)) { dist.set(m, dist.get(n) + 1); queue.push(m); }
      }
    }
    dist.delete(start);
    return dist;
  }
  function shortest(from, to) {
    // a directed line of influence from one to the other. It prefers strong links, and steps through the centuries
    // between rather than leaping across them, so the line tells more of the story.
    const cost = new Map([[from, 0]]), prev = new Map(), open = [from];
    while (open.length) {
      open.sort((p, q) => cost.get(p) - cost.get(q));
      const n = open.shift();
      if (n === to) break;
      for (const e of n.outs) {
        const gap = (e.b.at - e.a.at) / 500;
        const c = cost.get(n) + (e.weak ? 2 : 1) + gap * gap;
        if (c < (cost.get(e.b) ?? Infinity)) { cost.set(e.b, c); prev.set(e.b, e); if (!open.includes(e.b)) open.push(e.b); }
      }
    }
    if (!prev.has(to)) return null;
    const path = [];
    for (let n = to; n !== from; n = prev.get(n).a) path.unshift(prev.get(n));
    return path;
  }

  /* ---------- measuring, then laying out ---------- */
  const ctx = document.createElement('canvas').getContext('2d');
  const FONTS = { serif: '"Instrument Serif"', sans: '"Instrument Sans"', mono: '"JetBrains Mono"' };
  function textW(s, size, family = 'serif', weight = 400, track = 0) {
    ctx.font = `${weight} ${size}px ${FONTS[family]}`;
    return ctx.measureText(s).width + track * size * s.length;
  }

  // each mind is a point, with its name to the right; l and r are how far the label reaches either side of the point
  function measure() {
    for (const n of nodes) {
      const lines = n.name.split('\n');
      n.lines = lines;
      const k = Math.sqrt(n.outs.length);
      if (n.kind === 'person') {
        n.size = Math.min(27, 16 + 2.4 * k);
        n.r = 3 + .85 * k;
        n.lh = n.size;
        n.meta = lifespan(n);
        n.tx = n.r + 6;
        n.w = Math.max(textW(n.name, n.size), textW(n.meta, 9.5, 'mono'));
        n.top = Math.min(-n.r, -n.size * .62); n.bottom = n.size * .3 + 13;
      } else if (n.kind === 'school') {
        n.size = 11; n.lh = 13.5; n.r = 7;
        n.meta = n.who ? `${lifespan(n)} · ${n.who}` : lifespan(n);
        n.tx = n.r + 7;
        n.w = Math.max(...lines.map((l) => textW(l, n.size, 'sans', 600, .16)), textW(n.meta, 8.5, 'mono'));
        n.top = -8 - (lines.length - 1) * n.lh; n.bottom = 16;
      } else if (n.kind === 'source') {
        n.size = 9.5; n.lh = 12; n.r = 5;
        n.meta = n.when || fmtYear(n.year);
        n.tx = n.r + 7;
        n.w = Math.max(...lines.map((l) => textW(l, n.size, 'mono', 500, .06)), textW(n.meta, 8.5, 'mono'));
        n.top = -8 - (lines.length - 1) * n.lh; n.bottom = 16;
      } else {
        n.size = 40; n.r = 6;
        n.w = textW(n.name, n.size);
        n.top = -n.r - 4; n.bottom = 58;
      }
      if (n.kind === 'end') { n.l = -n.w / 2; n.rr = n.w / 2; } else { n.l = -n.r - 3; n.rr = n.tx + n.w + 2; }
      n.y = Y(n.at);
      n.x = n.x0 = spread(n.x);
    }
  }

  function relax() {
    // y is fixed by time; slide them sideways until no two labels overlap, each pulled back toward where it was meant to stand
    const L = 90, R = SHEET_W - 90, PAD = 16, VPAD = 5;
    const list = nodes.slice().sort((p, q) => p.y - q.y);
    for (let it = 0; it < 500; it++) {
      let moved = 0;
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        for (let j = i + 1; j < list.length; j++) {
          const q = list[j];
          if (q.y + q.top - VPAD > p.y + p.bottom + VPAD) break;
          if (p.y + p.top - VPAD > q.y + q.bottom + VPAD) continue;
          const [a, b] = p.x < q.x || (p.x === q.x && p.id < q.id) ? [p, q] : [q, p];
          const need = (a.x + a.rr + PAD) - (b.x + b.l);
          if (need > 0) { a.x -= need / 2; b.x += need / 2; moved += need; }
        }
      }
      for (const n of list) {
        n.x += (n.x0 - n.x) * .015;
        n.x = Math.max(L - n.l, Math.min(R - n.rr, n.x));
      }
      if (moved < .5 && it > 20) break;
    }
  }

  /* ---------- the lines: from point to point, leaving downward and arriving from above ---------- */
  function ports() {
    for (const e of edges) {
      e.sx = e.a.x; e.sy = e.a.y; e.ex = e.b.x; e.ey = e.b.y;
      const dy = e.ey - e.sy;
      const k = Math.min(dy * .45, 40 + Math.abs(e.ex - e.sx) * .16);
      e.d = `M${e.sx.toFixed(1)} ${e.sy.toFixed(1)}C${e.sx.toFixed(1)} ${(e.sy + k).toFixed(1)} ${e.ex.toFixed(1)} ${(e.ey - k).toFixed(1)} ${e.ex.toFixed(1)} ${e.ey.toFixed(1)}`;
    }
  }

  /* ---------- drawing ---------- */
  function draw() {
    world.textContent = '';
    const sheet = el('g', { class: 'margin' }, world);
    // the years down both margins, each with a faint line across
    for (const yr of ticks(1, 0, SHEET_H, 105)) {
      const y = Y(yr);
      el('line', { class: yr % 100 === 0 ? 'century' : '', x1: 76, x2: SHEET_W - 76, y1: y, y2: y }, sheet);
      el('text', { x: 16, y: y + 4 }, sheet).textContent = fmtYear(yr);
      el('text', { x: SHEET_W - 16, y: y + 4, 'text-anchor': 'end' }, sheet).textContent = fmtYear(yr);
    }

    const gEdges = el('g', {}, world);
    // the quiet European lines first, so the other traditions show through them
    const order = edges.slice().sort((p, q) => (q.weak - p.weak) || ((p.a.t !== 'west') - (q.a.t !== 'west')));
    for (const e of order) {
      e.g = el('g', { class: `edge t-${e.a.t}${e.weak ? ' weak' : ''}` }, gEdges);
      e.path = el('path', { d: e.d }, e.g);
    }

    const gNodes = el('g', {}, world);
    for (const n of nodes) {
      const g = el('g', { class: `node ${n.kind === 'source' ? 'src' : n.kind} t-${n.t}`, transform: `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`, 'data-id': n.id }, gNodes);
      n.g = g;
      el('circle', { class: 'ring', r: n.r + 6 }, g);
      if (n.kind === 'source') {
        const s = n.r;
        el('path', { class: 'dot', d: `M0 ${-s}L${s} 0L0 ${s}L${-s} 0Z` }, g);
      } else {
        el('circle', { class: 'dot', r: n.r }, g);
        if (n.kind === 'school') el('circle', { class: 'core', r: 2.2 }, g);
      }
      if (n.kind === 'end') {
        const t = el('text', { class: 'name', 'text-anchor': 'middle', y: 44, 'font-size': n.size }, g);
        t.textContent = n.name.charAt(0) + n.name.slice(1).toLowerCase();
      } else {
        const first = n.kind === 'person' ? n.size * .3 : 3.5 - (n.lines.length - 1) * n.lh;
        n.lines.forEach((l, i) => {
          const t = el('text', { class: 'name', x: n.tx, y: first + i * n.lh, 'font-size': n.size }, g);
          if (n.kind === 'school') t.setAttribute('letter-spacing', (n.size * .16).toFixed(2));
          if (n.kind === 'source') t.setAttribute('letter-spacing', (n.size * .06).toFixed(2));
          t.textContent = l;
        });
        el('text', { class: 'meta', x: n.tx, y: n.kind === 'person' ? n.size * .3 + 12 : 15 }, g).textContent = n.meta;
      }
      el('rect', { class: 'hit', x: n.l - 4, y: n.top - 4, width: n.rr - n.l + 8, height: n.bottom - n.top + 8 }, g);
    }

    // the end of the sheet: the title, and where the form came from
    const fin = el('g', { class: 'finale' }, world);
    const size = Math.min(190, 100 * (SHEET_W * .7) / textW('Philosophy, mind to mind', 100));
    const title = el('text', { class: 'title', x: SHEET_W / 2, y: FIN_Y + size * .72, 'text-anchor': 'middle', 'font-size': size.toFixed(1) }, fin);
    title.innerHTML = 'Philosophy, <tspan>mind to mind</tspan>';
    const people = nodes.filter((n) => n.kind === 'person').length;
    const sub = el('text', { class: 'sub', x: SHEET_W / 2, y: FIN_Y + size * .72 + 62, 'text-anchor': 'middle', 'font-size': 17 }, fin);
    sub.textContent = `${people} thinkers · ${edges.length} lines of influence · from Thales to Judith Butler`;
    const credit = el('text', { class: 'credit', x: SHEET_W / 2, y: FIN_Y + size * .72 + 100, 'text-anchor': 'middle', 'font-size': 12 }, fin);
    credit.textContent = 'Its form owes a debt to Alfred H. Barr Jr.’s chart for Cubism and Abstract Art, The Museum of Modern Art, 1936';
  }

  // years to mark: round ones first, as many as fit at the given spacing
  function ticks(scale, y0, y1, gap) {
    const all = [];
    for (let yr = -700; yr <= 2000; yr += 10) if (yr !== 0) all.push(yr);
    const rank = (yr) => (yr % 500 === 0 ? 0 : yr % 100 === 0 ? 1 : yr % 50 === 0 ? 2 : yr % 25 === 0 ? 3 : 4);
    all.sort((p, q) => rank(p) - rank(q) || p - q);
    const kept = [];
    for (const yr of all) {
      const y = Y(yr) * scale;
      if (y < y0 - 40 || y > y1 + 40) continue;
      if (kept.every((k) => Math.abs(Y(k) * scale - y) >= gap)) kept.push(yr);
    }
    return kept.sort((p, q) => p - q);
  }

  /* ---------- the view: pan and zoom ---------- */
  const view = { s: 1, x: 0, y: 0 };
  let intro = [];
  let flight = null;
  const box = () => stage.getBoundingClientRect();
  const minScale = () => { const r = box(); return Math.min(r.width / SHEET_W, r.height / SHEET_H) * .9; };
  const MAX = 3.2;
  const isPhone = () => matchMedia('(max-width: 760px)').matches;

  // the part of the screen the card doesn't cover
  function free() {
    const r = box();
    const card = $('card');
    let w = r.width, h = r.height;
    if (!card.classList.contains('closed')) {
      const c = card.getBoundingClientRect();
      if (isPhone()) h = Math.max(160, c.top); else w = Math.max(240, c.left);
    } else if (isPhone()) h -= 46;
    return { x: 0, y: isPhone() ? 60 : 0, w, h: h - (isPhone() ? 60 : 0) };
  }

  function clamp() {
    const r = box();
    const W = SHEET_W * view.s, H = SHEET_H * view.s;
    view.x = Math.min(r.width * .5, Math.max(r.width * .5 - W, view.x));
    view.y = Math.min(r.height * .5, Math.max(r.height * .5 - H, view.y));
  }
  function apply() {
    world.setAttribute('transform', `translate(${view.x.toFixed(2)} ${view.y.toFixed(2)}) scale(${view.s.toFixed(4)})`);
    overlays();
  }
  function zoomAt(px, py, k) {
    finishIntro();
    const s = Math.max(minScale(), Math.min(MAX, view.s * k));
    view.x = px - (px - view.x) * s / view.s;
    view.y = py - (py - view.y) * s / view.s;
    view.s = s;
    clamp(); apply();
  }
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function fly(to, ms = 700) {
    if (flight) cancelAnimationFrame(flight.raf);
    if (ms) finishIntro();
    const from = { ...view };
    const r = box();
    const t0 = performance.now();
    const target = { ...to };
    { const v = { ...view }; Object.assign(view, target); clamp(); Object.assign(target, view); Object.assign(view, v); }
    if (reduceMotion || ms === 0) { Object.assign(view, target); apply(); return; }
    // zoom out a little on the way when travelling far
    const far = Math.hypot((target.x - from.x) / r.width, (target.y - from.y) / r.height);
    const dip = Math.min(.45, far * .12);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms), e = ease(t);
      // interpolate in world space around the screen center so the motion reads as travel
      const cx = r.width / 2, cy = r.height / 2;
      const wx0 = (cx - from.x) / from.s, wy0 = (cy - from.y) / from.s;
      const wx1 = (cx - target.x) / target.s, wy1 = (cy - target.y) / target.s;
      const s = Math.exp(Math.log(from.s) + (Math.log(target.s) - Math.log(from.s)) * e) * (1 - dip * Math.sin(Math.PI * t));
      const wx = wx0 + (wx1 - wx0) * e, wy = wy0 + (wy1 - wy0) * e;
      view.s = s; view.x = cx - wx * s; view.y = cy - wy * s;
      apply();
      if (t < 1) flight.raf = requestAnimationFrame(step); else { Object.assign(view, target); apply(); flight = null; }
    };
    flight = { raf: requestAnimationFrame(step) };
  }
  function stopFlight() { if (flight) { cancelAnimationFrame(flight.raf); flight = null; } }

  // show a world rectangle in the free part of the screen
  function frame(x0, y0, x1, y1, { maxS = 1.25, minS = 0, ms } = {}) {
    const f = free();
    const pad = 40;
    let s = Math.min((f.w - pad * 2) / (x1 - x0), (f.h - pad * 2) / (y1 - y0), maxS);
    s = Math.max(s, minS, minScale());
    fly({ s, x: f.x + f.w / 2 - (x0 + x1) / 2 * s, y: f.y + f.h / 2 - (y0 + y1) / 2 * s }, ms);
  }
  function fitWidth(ms) {
    const r = box();
    const s = Math.max(minScale(), Math.min(1, (r.width - 20) / SHEET_W));
    const cx = (r.width - SHEET_W * s) / 2;
    // keep the same moment in time at the center
    const midYear = yearAt((r.height / 2 - view.y) / view.s);
    fly({ s, x: cx, y: r.height / 2 - Y(midYear) * s }, ms);
  }
  function lookAt(n, ms) {
    const f = free();
    const s = Math.max(view.s, isPhone() ? .8 : .75);
    const inView = (() => {
      const sx = n.x * view.s + view.x, sy = n.y * view.s + view.y;
      return view.s >= s * .99 && sx > f.x + 60 && sx < f.x + f.w - 60 && sy > f.y + 70 && sy < f.y + f.h - 50;
    })();
    if (inView) return;
    fly({ s, x: f.x + f.w / 2 - n.x * s, y: f.y + f.h * .42 - n.y * s }, ms);
  }
  function goYear(yr) {
    const f = free();
    const r = box();
    const s = isPhone() ? Math.max(view.s, .7) : Math.max(view.s, Math.min(1, (r.width - 20) / SHEET_W));
    const cx = isPhone() ? f.w / 2 - spread(800) * s : (f.w - SHEET_W * s) / 2;
    fly({ s, x: cx, y: f.y + 90 - Y(yr) * s });
  }

  /* ---------- the margin that travels with you, and the little map ---------- */
  const ruler = $('ruler');
  const map = $('map'), mctx = map.getContext('2d');
  let mapBase = null, mapScale = 1;
  let overlayQueued = false;
  function overlays() {
    if (overlayQueued) return;
    overlayQueued = true;
    requestAnimationFrame(() => { overlayQueued = false; drawRuler(); drawMap(); });
  }
  function drawRuler() {
    const r = box();
    // the sheet's own years are in view: no need for these
    const hidden = view.x > -4 * view.s;
    ruler.classList.toggle('off', hidden);
    if (hidden) return;
    const top = -view.y, bottom = r.height - view.y;
    const html = [];
    for (const yr of ticks(view.s, top, bottom, 64)) {
      const y = Y(yr) * view.s + view.y;
      if (y < 70 || y > r.height - 20) continue;
      html.push(`<span style="top:${y.toFixed(1)}px">${fmtYear(yr)}</span>`);
    }
    ruler.innerHTML = html.join('');
  }
  function buildMap() {
    const phone = isPhone();
    const cssW = phone ? 46 : 64;
    const cssH = Math.round(cssW * SHEET_H / SHEET_W);
    const maxH = Math.max(140, Math.min(phone ? 200 : 300, innerHeight - 260));
    const h = Math.min(cssH, maxH), w = Math.round(h * SHEET_W / SHEET_H);
    const dpr = Math.min(2, devicePixelRatio || 1);
    map.style.width = `${w}px`; map.style.height = `${h}px`;
    map.width = w * dpr; map.height = h * dpr;
    mapScale = w / SHEET_W;
    const off = document.createElement('canvas');
    off.width = map.width; off.height = map.height;
    const c = off.getContext('2d');
    c.scale(dpr * mapScale, dpr * mapScale);
    c.lineWidth = 1 / (mapScale * dpr) * .7;
    for (const e of edges) {
      c.globalAlpha = e.a.t === 'west' ? .3 : .55;
      c.strokeStyle = COLORS[e.a.t];
      c.beginPath(); c.moveTo(e.sx, e.sy); c.lineTo(e.ex, e.ey); c.stroke();
    }
    c.globalAlpha = 1;
    for (const n of nodes) {
      c.fillStyle = COLORS[n.t];
      c.beginPath(); c.arc(n.x, n.y, n.kind === 'person' ? 8 + n.r * 2 : 12, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = 'rgba(239,232,218,.5)';
    c.fillRect(SHEET_W * .15, FIN_Y + 40, SHEET_W * .7, 90);
    mapBase = off;
    drawMap();
  }
  function drawMap() {
    if (!mapBase) return;
    const dpr = map.width / parseFloat(map.style.width);
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.clearRect(0, 0, map.width, map.height);
    mctx.drawImage(mapBase, 0, 0);
    const r = box();
    const k = mapScale * dpr;
    const x = -view.x / view.s * k, y = -view.y / view.s * k, w = r.width / view.s * k, h = r.height / view.s * k;
    mctx.fillStyle = 'rgba(239,232,218,.08)';
    mctx.fillRect(x, y, w, h);
    mctx.strokeStyle = 'rgba(239,232,218,.85)'; mctx.lineWidth = dpr;
    mctx.strokeRect(x, y, w, h);
  }
  {
    let dragging = false;
    const to = (ev) => {
      const rect = map.getBoundingClientRect();
      const wx = (ev.clientX - rect.left) / mapScale, wy = (ev.clientY - rect.top) / mapScale;
      const r = box();
      view.x = r.width / 2 - wx * view.s; view.y = r.height / 2 - wy * view.s;
      clamp(); apply();
    };
    map.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); stopFlight(); finishIntro(); endJourney(); dragging = true; map.setPointerCapture(ev.pointerId); to(ev); });
    map.addEventListener('pointermove', (ev) => { if (dragging) to(ev); });
    map.addEventListener('pointerup', () => { dragging = false; });
    map.addEventListener('pointercancel', () => { dragging = false; });
  }

  /* ---------- gestures ---------- */
  const pointers = new Map();
  let gesture = null, lastTap = 0;
  stage.addEventListener('pointerdown', (ev) => {
    stopFlight(); finishIntro(); endJourney();
    stage.setPointerCapture(ev.pointerId);
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pointers.size === 1) {
      gesture = { type: 'pan', x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y, moved: 0, target: ev.target, kind: ev.pointerType };
    } else if (pointers.size === 2) {
      const [p, q] = [...pointers.values()];
      gesture = { type: 'pinch', d: Math.hypot(p.x - q.x, p.y - q.y), mx: (p.x + q.x) / 2, my: (p.y + q.y) / 2, view: { ...view }, moved: 99 };
    }
  });
  stage.addEventListener('pointermove', (ev) => {
    if (!pointers.has(ev.pointerId)) {
      if (ev.pointerType === 'mouse') hoverAt(ev.target);
      return;
    }
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (!gesture) return;
    const r = box();
    if (gesture.type === 'pan') {
      const dx = ev.clientX - gesture.x, dy = ev.clientY - gesture.y;
      gesture.moved = Math.max(gesture.moved, Math.hypot(dx, dy));
      if (gesture.moved > 5) {
        stage.classList.add('grabbing');
        view.x = gesture.vx + dx; view.y = gesture.vy + dy; clamp(); apply();
      }
    } else if (gesture.type === 'pinch' && pointers.size >= 2) {
      const [p, q] = [...pointers.values()];
      const d = Math.hypot(p.x - q.x, p.y - q.y), mx = (p.x + q.x) / 2 - r.left, my = (p.y + q.y) / 2 - r.top;
      const v = gesture.view;
      const s = Math.max(minScale(), Math.min(MAX, v.s * d / gesture.d));
      const wx = (gesture.mx - r.left - v.x) / v.s, wy = (gesture.my - r.top - v.y) / v.s;
      view.s = s; view.x = mx - wx * s; view.y = my - wy * s;
      clamp(); apply();
    }
  });
  const end = (ev) => {
    if (!pointers.has(ev.pointerId)) return;
    pointers.delete(ev.pointerId);
    stage.classList.remove('grabbing');
    if (gesture && gesture.type === 'pan' && gesture.moved <= 5 && ev.type === 'pointerup') tap(gesture.target, ev);
    if (pointers.size === 1) {
      const [p] = [...pointers.values()];
      gesture = { type: 'pan', x: p.x, y: p.y, vx: view.x, vy: view.y, moved: 99 };
    } else if (pointers.size === 0) gesture = null;
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    stopFlight(); finishIntro(); endJourney();
    const r = box();
    const unit = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? r.height : 1;
    if (ev.ctrlKey || ev.metaKey) zoomAt(ev.clientX - r.left, ev.clientY - r.top, Math.exp(-ev.deltaY * unit * .01));
    else { view.x -= ev.deltaX * unit; view.y -= ev.deltaY * unit; clamp(); apply(); }
  }, { passive: false });
  // Safari's own pinch on a trackpad
  let gestureScale = 1;
  stage.addEventListener('gesturestart', (ev) => { ev.preventDefault(); gestureScale = 1; });
  stage.addEventListener('gesturechange', (ev) => {
    ev.preventDefault();
    const r = box();
    zoomAt(ev.clientX - r.left, ev.clientY - r.top, ev.scale / gestureScale); gestureScale = ev.scale;
  });

  function tap(target, ev) {
    const g = target.closest && target.closest('.node');
    const now = performance.now();
    if (g) { select(byId.get(g.dataset.id)); lastTap = 0; return; }
    // a double tap on the paper zooms in
    if (now - lastTap < 320) {
      const r = box();
      zoomAt(ev.clientX - r.left, ev.clientY - r.top, 1.7); lastTap = 0; return;
    }
    lastTap = now;
    if (state.mode !== 'none') clear();
    else if (isPhone()) setCard(false);
  }

  addEventListener('keydown', (ev) => {
    if (ev.target.closest('input')) return;
    finishIntro();
    const r = box();
    const k = ev.key;
    if (k === '/' ) { ev.preventDefault(); $('q').focus(); return; }
    if (k === 'Escape') { clear(); return; }
    if (k === '+' || k === '=') zoomAt(r.width / 2, r.height / 2, 1.3);
    else if (k === '-' || k === '_') zoomAt(r.width / 2, r.height / 2, 1 / 1.3);
    else if (k === '0') fitWidth();
    else if (k === 'ArrowDown') { view.y -= 120; clamp(); apply(); }
    else if (k === 'ArrowUp') { view.y += 120; clamp(); apply(); }
    else if (k === 'ArrowLeft') { view.x += 120; clamp(); apply(); }
    else if (k === 'ArrowRight') { view.x -= 120; clamp(); apply(); }
    else return;
    ev.preventDefault();
  });
  $('zin').onclick = () => { const r = box(); zoomAt(r.width / 2, r.height / 2, 1.4); };
  $('zout').onclick = () => { const r = box(); zoomAt(r.width / 2, r.height / 2, 1 / 1.4); };
  $('zfit').onclick = () => fitWidth();

  /* ---------- lighting up a lineage ---------- */
  const state = { mode: 'none', node: null, direct: false, path: null, hover: null };

  function paint() {
    const lit = state.mode !== 'none' || state.hover;
    chart.classList.toggle('lit', !!lit);
    for (const e of edges) e.g.classList.remove('up', 'down', 'path', 'near');
    for (const n of nodes) n.g.classList.remove('up', 'down', 'sel', 'path', 'ends', 'here');
    if (!lit) return;
    if (state.mode === 'trace') {
      for (const e of state.path) {
        e.g.classList.add('path');
        e.a.g.classList.add('path'); e.b.g.classList.add('path');
      }
      for (const n of state.ends) n.g.classList.add('ends');
      return;
    }
    const n = state.mode === 'node' ? state.node : state.hover;
    const direct = state.mode !== 'node' || state.direct;
    n.g.classList.add('sel');
    const up = direct ? new Set(n.ins.map((e) => e.a)) : new Set(reach(n, 'ins').keys());
    const down = direct ? new Set(n.outs.map((e) => e.b)) : new Set(reach(n, 'outs').keys());
    for (const m of up) m.g.classList.add('up');
    for (const m of down) m.g.classList.add('down');
    for (const e of edges) {
      if (e.b === n || (!direct && up.has(e.b) && up.has(e.a))) e.g.classList.add('up');
      else if (e.a === n || (!direct && down.has(e.a) && down.has(e.b))) e.g.classList.add('down');
      if (e.a === n || e.b === n) e.g.classList.add('near');
    }
  }
  function hoverAt(target) {
    if (gesture || state.mode !== 'none') return;
    const g = target.closest && target.closest('.node');
    const n = g ? byId.get(g.dataset.id) : null;
    if (n === state.hover) return;
    state.hover = n; paint();
  }
  stage.addEventListener('pointerleave', () => { if (state.hover) { state.hover = null; paint(); } });

  function select(n, { fly: move = true } = {}) {
    endJourney(); finishIntro();
    state.mode = 'node'; state.node = n; state.path = null; state.hover = null;
    paint(); showNode(n); setCard(true);
    setHash(n.id);
    if (move) requestAnimationFrame(() => lookAt(n));
  }
  function clear() {
    endJourney();
    state.mode = 'none'; state.node = null; state.path = null; state.hover = null;
    paint(); showIntro(); setHash('');
  }

  function trace(a, b, { move = true, auto = false } = {}) {
    // a line from the older to the younger; failing that, back to the nearest source they share
    let [p, q] = a.at <= b.at ? [a, b] : [b, a];
    let path = shortest(p, q), common = null;
    if (!path && (path = shortest(q, p))) [p, q] = [q, p];
    let left = null, right = null;
    if (!path) {
      const ua = reach(a, 'ins'), ub = reach(b, 'ins');
      let best = Infinity;
      for (const [m, d] of ua) if (ub.has(m) && d + ub.get(m) < best) { best = d + ub.get(m); common = m; }
      if (!common) {
        // two lines that never meet on this sheet
        endJourney(); finishIntro();
        state.mode = 'trace'; state.node = null; state.path = []; state.ends = [a, b]; state.hover = null;
        paint();
        for (const n of [a, b]) n.g.classList.add('path');
        kicker.textContent = 'No line runs between them';
        body.innerHTML = `
          <h2>${esc(a.short)} and ${esc(b.short)}</h2>
          <p class="idea">Neither drew on the other, and on this sheet they share no source.</p>
          <div class="row"><button class="pill" type="button" data-go="${a.id}">${esc(a.short)}</button><button class="pill" type="button" data-go="${b.id}">${esc(b.short)}</button><button class="pill main" type="button" data-act="random">A random line</button></div>`;
        setCard(true);
        setHash(`${a.id}/${b.id}`);
        if (move) requestAnimationFrame(() => frame(Math.min(a.x, b.x) - 80, Math.min(a.y, b.y) - 40, Math.max(a.x, b.x) + 160, Math.max(a.y, b.y) + 40, { maxS: 1, minS: .3 }));
        return null;
      }
      left = shortest(common, a); right = shortest(common, b);
      path = [...left, ...right];
    }
    endJourney(); finishIntro();
    state.mode = 'trace'; state.node = null; state.path = path; state.hover = null;
    state.ends = [a, b];
    paint();
    showTrace(a, b, common ? { common, left, right } : { line: path, from: p, to: q });
    setCard(!(auto && isPhone()));
    if (!auto) setHash(`${a.id}/${b.id}`);
    if (!move) return null;
    if (reduceMotion) { requestAnimationFrame(() => framePath(path, 0)); return null; }
    const title = common ? `${a.short} and ${b.short}, back to ${common.short}` : `${p.short} to ${q.short}`;
    return travel(common ? [left, right] : [path], { auto, title });
  }
  function framePath(path, ms = 1100) {
    const ns = new Set(path.flatMap((e) => [e.a, e.b]));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of ns) { x0 = Math.min(x0, n.x + n.l); x1 = Math.max(x1, n.x + n.rr); y0 = Math.min(y0, n.y + n.top); y1 = Math.max(y1, n.y + n.bottom); }
    frame(x0, y0, x1, y1 + (isPhone() ? 0 : 90), { maxS: 1, minS: isPhone() ? .3 : .28, ms });
  }

  // the camera follows the line down through time, drawing each step as it arrives, then steps back to show all of it
  let journey = 0, trips = 0;
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  const caption = $('caption');
  function say(step, pair, line, button) {
    $('nowstep').textContent = step;
    $('nowpair').innerHTML = pair;
    $('nowsay').textContent = line;
    $('stop').textContent = button;
    caption.hidden = false;
  }
  async function travel(branches, { auto, title }) {
    const token = journey = ++trips;
    const all = branches.flat();
    for (const e of all) e.g.classList.add('pending');
    const s = isPhone() ? .85 : .95;
    const center = (n, ms) => { const f = free(); fly({ s, x: f.x + f.w / 2 - n.x * s, y: f.y + f.h * (isPhone() ? .4 : .42) - n.y * s }, ms); };
    const here = (n) => { for (const m of nodes) m.g.classList.toggle('here', m === n); };
    const button = auto ? 'Explore' : 'Skip';
    let step = 0;
    for (const path of branches) {
      center(path[0].a, 1100);
      here(path[0].a);
      mark(step++);
      say(title, esc(path[0].a.short), path[0].a.idea || '', button);
      await pause(auto ? 2400 : 1200);
      for (const [i, e] of path.entries()) {
        if (token !== journey) return;
        const len = e.path.getTotalLength();
        const ms = auto ? Math.max(1700, Math.min(2800, len * 1.3)) : Math.max(1000, Math.min(1800, len));
        e.g.classList.remove('pending');
        e.path.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }], { duration: ms, easing: 'cubic-bezier(.45,0,.3,1)' });
        say(`Step ${step} of ${all.length} · ${fmtYear(Math.round(yearOf(e.a)))} to ${fmtYear(Math.round(yearOf(e.b)))}`,
          `${esc(e.a.short)}<i>→</i>${esc(e.b.short)}`, (e.weak ? '(indirect) ' : '') + (e.note || ''), button);
        center(e.b, ms);
        await pause(ms);
        if (token !== journey) return;
        here(e.b);
        mark(step++);
        await pause(auto ? (e.note ? 1700 : 900) : 450);
      }
    }
    if (token !== journey) return;
    mark(-1); here(null);
    framePath(all, 1400);
    if (auto) say('The whole line', esc(title), 'Another follows in a moment.', button);
    else caption.hidden = true;
    journey = 0;
  }
  function mark(i) {
    for (const li of body.querySelectorAll('[data-step]')) {
      const k = +li.dataset.step;
      li.classList.toggle('now', k === i);
      li.classList.toggle('ahead', i >= 0 && k > i);
    }
    const cur = body.querySelector('[data-step].now');
    if (cur) cur.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function endJourney() {
    if (!auto.on) caption.hidden = true;
    if (!journey) return;
    journey = 0;
    for (const e of edges) e.g.classList.remove('pending');
    for (const n of nodes) n.g.classList.remove('here');
    mark(-1);
  }
  function pickLine() {
    // somewhere old to somewhere much younger, by a line of at least four steps
    const from = nodes.filter((n) => n.kind === 'person' && n.at < 1700 && n.outs.length);
    for (let i = 0; i < 80; i++) {
      const a = from[Math.floor(Math.random() * from.length)];
      const to = nodes.filter((n) => n.kind === 'person' && n.at > Math.max(1850, a.at + 700));
      const b = to[Math.floor(Math.random() * to.length)];
      const p = b && shortest(a, b);
      if (p && p.length >= 4 && p.length <= 10) return [a, b];
    }
    return [byId.get('thales'), byId.get('butler')];
  }
  function randomLine() { trace(...pickLine()); }

  /* ---------- left alone, it plays lines by itself ---------- */
  const auto = { on: false, run: 0, timer: 0, touched: false };
  const playBtn = $('play');
  function startAuto() {
    if (auto.on) return;
    auto.on = true;
    playBtn.setAttribute('aria-pressed', 'true'); playBtn.setAttribute('aria-label', 'Stop playing lines');
    loop(++auto.run);
  }
  async function loop(run) {
    while (auto.on && run === auto.run) {
      await trace(...pickLine(), { auto: true });
      if (!auto.on || run !== auto.run) return;
      await pause(5200);
    }
  }
  function stopAuto() {
    if (!auto.on) return;
    auto.on = false; auto.run++;
    playBtn.setAttribute('aria-pressed', 'false'); playBtn.setAttribute('aria-label', 'Play random lines');
    stopFlight(); endJourney();
    caption.hidden = true;
  }
  // the first time after twelve quiet seconds; once someone has looked around, only after a long while with nothing chosen
  function idle() {
    clearTimeout(auto.timer);
    if (still) return;
    auto.timer = setTimeout(() => {
      const busy = document.activeElement && document.activeElement.matches('input');
      if (document.hidden || busy || (auto.touched && state.mode !== 'none')) return idle();
      startAuto();
    }, auto.touched ? 90000 : 12000);
  }
  function acted(ev) {
    if (ev.target.closest && ev.target.closest('#play, #stop')) return;
    auto.touched = true;
    stopAuto();
    idle();
  }
  for (const type of ['pointerdown', 'wheel', 'keydown']) addEventListener(type, acted, { capture: true, passive: true });
  addEventListener('pointermove', () => { if (!auto.on) idle(); }, { passive: true });
  playBtn.onclick = () => { auto.touched = true; if (auto.on) stopAuto(); else startAuto(); idle(); };
  $('stop').onclick = () => {
    if (auto.on) { auto.touched = true; stopAuto(); idle(); return; }
    // skip to the end of a line being drawn
    if (journey && state.path) { endJourney(); framePath(state.path, 900); }
    caption.hidden = true;
  };

  /* ---------- the card ---------- */
  const card = $('card'), body = $('body'), kicker = $('kicker');
  function setCard(open) {
    card.classList.toggle('closed', !open);
    document.documentElement.classList.toggle('sheet-open', open);
    const r = card.getBoundingClientRect();
    document.documentElement.style.setProperty('--card-w', !open || isPhone() ? '0px' : `${r.width + 14}px`);
    document.documentElement.style.setProperty('--sheet-h', isPhone() ? (open ? `${Math.round(r.height)}px` : '46px') : '0px');
  }
  $('close').onclick = () => { if (state.mode !== 'none') clear(); else setCard(false); };
  $('grip').onclick = () => setCard(card.classList.contains('closed'));

  const link = (n, note) => `<li><button class="${goClass(n)}" data-go="${n.id}">${esc(n.short)}<span class="yr">${esc(when(n))}</span></button><span class="note">${esc(note || '')}</span></li>`;
  const when = (n) => (n.kind === 'end' ? '' : n.kind === 'person' ? (n.born < 0 ? `${-n.born} BCE` : `${n.born}`) : fmtYear(n.year));
  const icon = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="m11 11 4 4"/></svg>';
  const people = nodes.filter((n) => n.kind === 'person');

  const goClass = (n) => `go t-${n.t}${n.kind === 'source' ? ' src' : n.kind === 'school' ? ' school' : ''}`;
  function showIntro() {
    kicker.textContent = 'Who drew on whom';
    const key = TRADITIONS.map(([t, label]) => `<span class="t-${t}"><i${t === 'source' ? ' class="ring"' : ''}></i>${label}</span>`).join('');
    body.innerHTML = `
      <h1>Philosophy, <i>mind to mind</i></h1>
      <p>Twenty-six centuries of philosophy as one chart of influence: ${people.length} thinkers from Thales to Judith Butler, the schools they formed, and what reached them from outside philosophy. Time runs down the page, so every line runs from an older mind to a younger one.</p>
      <p>Tap a name to light up where it came from and where it went, or trace a line between any two. Left alone, the chart plays lines by itself.</p>
      <div class="row"><button class="pill main" type="button" data-act="random"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 1v8l7-4z"/></svg>Follow a random line</button></div>
      <h3>Colored by tradition</h3>
      <div class="key">${key}
        <span><svg viewBox="0 0 26 10"><path d="M1 5h24" stroke="#efe8da" stroke-width="1.3" fill="none"/></svg>drew on directly</span>
        <span><svg viewBox="0 0 26 10"><path d="M1 5h24" stroke="#efe8da" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="1 4.5" fill="none"/></svg>indirectly, or disputed</span>
      </div>
      <p class="fine">A bigger point and name means more drew on them. Each thinker stands at about the age of thirty, and time runs faster where fewer of them wrote. The lines are the well-documented ones: teachers, readers, rivals answered in print.</p>
      <h3>Go to</h3>
      <div class="eras">
        <button type="button" data-year="-640">Greece, China, India</button>
        <button type="button" data-year="-120">Rome</button>
        <button type="button" data-year="780">Baghdad to Paris</button>
        <button type="button" data-year="1480">The new science</button>
        <button type="button" data-year="1690">Enlightenment</button>
        <button type="button" data-year="1790">The 1800s</button>
        <button type="button" data-year="1880">The 1900s</button>
        <button type="button" data-year="1965">Today</button>
      </div>
      <p class="fine" style="margin-top:1.2rem">The idea of charting influence as one diagram comes from Alfred H. Barr Jr.’s cover for <i>Cubism and Abstract Art</i>, MoMA, 1936.</p>`;
  }

  function showNode(n) {
    const isSrc = n.kind === 'source', isEnd = n.kind === 'end';
    kicker.textContent = isEnd ? 'Where the lines arrive' : isSrc ? `From outside philosophy · ${n.when || fmtYear(n.year)}` : `${lifespan(n)} · ${n.place}`;
    const up = reach(n, 'ins'), down = reach(n, 'outs');
    const far = (m, pick) => [...m.keys()].filter((k) => k.kind === 'person').sort(pick)[0];
    const oldest = far(up, (p, q) => p.at - q.at), youngest = far(down, (p, q) => q.at - p.at);
    const count = (m) => [...m.keys()].filter((k) => k.kind === 'person').length;
    const plural = (k) => `${k} thinker${k === 1 ? '' : 's'}`;
    const reachLine = [
      !up.size ? '' : count(up) ? `Upstream, ${plural(count(up))}${oldest ? `, back to ${esc(oldest.short)}` : ''}.` : 'Upstream, only sources from outside philosophy.',
      !down.size ? '' : `Downstream, ${plural(count(down))}${youngest ? `, as far as ${esc(youngest.short)}` : ''}.`,
    ].filter(Boolean).join(' ');
    const ins = n.ins.slice().sort((p, q) => p.a.at - q.a.at);
    const outs = n.outs.slice().sort((p, q) => p.b.at - q.b.at);
    body.innerHTML = `
      ${n.who ? `<p class="fine" style="margin:0">${esc(n.who)}</p>` : ''}
      <h2>${esc(n.name.replace('\n', ' '))}</h2>
      ${n.idea ? `<p class="idea">${esc(n.idea)}</p>` : ''}
      ${reachLine ? `<p class="reach">${reachLine} Above it in time is where it came from; below, where it went.</p>` : ''}
      ${up.size + down.size > n.ins.length + n.outs.length ? `<div class="seg" role="group" aria-label="How much to light"><button type="button" data-act="all" aria-pressed="${!state.direct}">Whole lineage</button><button type="button" data-act="direct" aria-pressed="${state.direct}">Direct only</button></div>` : ''}
      ${ins.length ? `<h3>${isEnd ? 'Arriving' : 'Drew on'}</h3><ul class="links">${ins.map((e) => link(e.a, (e.weak ? '(indirect) ' : '') + e.note)).join('')}</ul>` : ''}
      ${outs.length ? `<h3>${isSrc ? 'Moved' : 'Passed on to'}</h3><ul class="links">${outs.map((e) => link(e.b, (e.weak ? '(indirect) ' : '') + e.note)).join('')}</ul>` : ''}
      ${isEnd ? '' : `<h3>Trace a line</h3>
      <p class="fine">From ${esc(n.short)} to anyone else on the sheet.</p>
      <div class="tracer">${icon}<input id="to" type="search" placeholder="Choose another thinker" aria-label="Trace a line to" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="false" aria-controls="tohits"><ul class="hits" id="tohits" role="listbox"></ul></div>`}`;
    if (!isEnd) finder($('to'), $('tohits'), (m) => trace(n, m));
    body.scrollTop = 0;
  }

  function showTrace(a, b, t) {
    const years = (p, q) => Math.round(Math.abs(yearOf(q) - yearOf(p)));
    let step = 0;
    const chain = (path) => {
      const out = [`<li class="${path[0].a.kind === 'source' ? 'src' : ''}" data-step="${step++}">${goBtn(path[0].a)}</li>`];
      for (const e of path) {
        out.push(`<li class="via t-${e.a.t}">${esc(e.note || '')}${e.weak ? `${e.note ? ' ' : ''}<i>(indirect)</i>` : ''}</li>`);
        out.push(`<li class="${e.b.kind === 'source' ? 'src' : ''}" data-step="${step++}">${goBtn(e.b)}</li>`);
      }
      return `<ol class="path">${out.join('')}</ol>`;
    };
    if (t.common) {
      kicker.textContent = 'No line runs between them';
      body.innerHTML = `
        <h2>${esc(a.short)} and ${esc(b.short)}</h2>
        <p class="idea">Neither drew on the other, even at a distance. Both go back to ${esc(t.common.short)}.</p>
        <h3>To ${esc(a.short)}</h3>${chain(t.left)}
        <h3>To ${esc(b.short)}</h3>${chain(t.right)}
        <div class="row" style="margin-top:1rem"><button class="pill main" type="button" data-act="random">Another random line</button><button class="pill" type="button" data-go="${a.id}">Back to ${esc(a.short)}</button></div>`;
    } else {
      const steps = t.line.length;
      kicker.textContent = `${steps} step${steps === 1 ? '' : 's'} · ${years(t.from, t.to).toLocaleString('en-US')} years`;
      body.innerHTML = `
        <h2>${esc(t.from.short)} to ${esc(t.to.short)}</h2>
        ${chain(t.line)}
        <div class="row" style="margin-top:1rem"><button class="pill main" type="button" data-act="random">Another random line</button><button class="pill" type="button" data-go="${a.id}">Back to ${esc(a.short)}</button></div>`;
    }
    body.scrollTop = 0;
  }
  const goBtn = (n) => `<button class="${goClass(n)}" data-go="${n.id}">${esc(n.short)}<span class="yr">${esc(when(n))}</span></button>`;

  card.addEventListener('click', (ev) => {
    const go = ev.target.closest('[data-go]');
    if (go) { select(byId.get(go.dataset.go)); return; }
    const yr = ev.target.closest('[data-year]');
    if (yr) { goYear(+yr.dataset.year); if (isPhone()) setCard(false); return; }
    const act = ev.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'random') randomLine();
    if (act.dataset.act === 'all' || act.dataset.act === 'direct') {
      state.direct = act.dataset.act === 'direct';
      for (const b of act.parentNode.children) b.setAttribute('aria-pressed', String(b === act));
      paint();
    }
  });

  /* ---------- finding a name ---------- */
  const searchable = nodes.filter((n) => n.kind !== 'end');
  function finder(input, list, pick) {
    let hits = [], at = -1;
    const render = () => {
      list.innerHTML = hits.map((n, i) => `<li role="option" id="${list.id}-${i}" aria-selected="${i === at}" data-i="${i}">${esc(n.kind === 'person' ? n.name : n.short)}<small>${esc(n.kind === 'source' ? 'source' : n.kind === 'school' ? 'school' : lifespan(n))}</small></li>`).join('');
      input.setAttribute('aria-expanded', String(hits.length > 0));
      if (at >= 0) input.setAttribute('aria-activedescendant', `${list.id}-${at}`); else input.removeAttribute('aria-activedescendant');
    };
    const update = () => {
      const q = fold(input.value.trim());
      if (!q) { hits = []; at = -1; render(); return; }
      const score = (n) => {
        const names = [n.name, n.short, ...(n.who ? [n.who] : [])].map((s) => fold(s.replace('\n', ' ')));
        if (names.some((s) => s.startsWith(q))) return 0;
        if (names.some((s) => s.split(/[\s-]+/).some((w) => w.startsWith(q)))) return 1;
        if (names.some((s) => s.includes(q))) return 2;
        return 9;
      };
      hits = searchable.map((n) => [score(n), n]).filter(([s]) => s < 9).sort((p, q) => p[0] - q[0] || p[1].at - q[1].at).slice(0, 8).map(([, n]) => n);
      at = hits.length ? 0 : -1; render();
    };
    const choose = (n) => { input.value = ''; hits = []; render(); input.blur(); pick(n); };
    input.addEventListener('input', update);
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown' && hits.length) { at = (at + 1) % hits.length; render(); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp' && hits.length) { at = (at - 1 + hits.length) % hits.length; render(); ev.preventDefault(); }
      else if (ev.key === 'Enter' && hits[at]) { choose(hits[at]); ev.preventDefault(); }
      else if (ev.key === 'Escape') { input.value = ''; hits = []; render(); input.blur(); }
    });
    list.addEventListener('pointerdown', (ev) => {
      const li = ev.target.closest('li');
      if (li) { ev.preventDefault(); choose(hits[+li.dataset.i]); }
    });
    input.addEventListener('blur', () => setTimeout(() => { hits = []; render(); }, 150));
  }
  finder($('q'), $('hits'), (n) => select(n));

  /* ---------- addresses: #kant selects, #thales/butler traces ---------- */
  function setHash(h) {
    const url = h ? `#${h}` : location.pathname + location.search;
    history.replaceState(null, '', url);
  }
  function fromHash() {
    const [a, b] = decodeURIComponent(location.hash.slice(1)).split('/');
    if (a && b && byId.has(a) && byId.has(b)) return trace(byId.get(a), byId.get(b)), true;
    if (a && byId.has(a)) return select(byId.get(a)), true;
    return false;
  }
  addEventListener('hashchange', fromHash);

  /* ---------- inking the sheet ---------- */
  function inkIn() {
    if (reduceMotion || still) return;
    const span = 3600;
    const t = (n) => (n.at + 720) / 2730;
    for (const e of edges) {
      const delay = 250 + t(e.a) * span;
      const len = e.path.getTotalLength();
      const dur = 380 + Math.min(900, len * .9);
      if (e.weak) {
        intro.push(e.path.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur, delay, fill: 'backwards', easing: 'ease-out' }));
      } else {
        intro.push(e.path.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }],
          { duration: dur, delay, fill: 'backwards', easing: 'cubic-bezier(.3,.1,.3,1)' }));
      }
    }
    for (const n of nodes) {
      intro.push(n.g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 100 + t(n) * span, fill: 'backwards', easing: 'ease-out' }));
    }
  }
  function finishIntro() {
    if (!intro.length) return;
    for (const a of intro) { try { a.finish(); } catch (_) { /* already gone */ } }
    intro = [];
  }

  /* ---------- start ---------- */
  function home(ms = 0) {
    const r = box();
    if (isPhone()) {
      const s = .72;
      // open on Greece
      fly({ s, x: r.width / 2 - spread(800) * s, y: 70 - (TOP - 40) * s }, ms);
    } else {
      const f = free();
      const s = Math.max(.62, Math.min(1, (f.w - 30) / SHEET_W));
      // the whole width if it fits; if not, centered on the Greeks, with China and India to the left
      const x = SHEET_W * s <= f.w ? (f.w - SHEET_W * s) / 2 : Math.min(10, f.w * .5 - spread(820) * s);
      fly({ s, x, y: 70 - (TOP - 70) * s }, ms);
    }
  }

  async function start() {
    try {
      await Promise.race([
        Promise.all(['400 16px "Instrument Serif"', 'italic 400 16px "Instrument Serif"', '600 11px "Instrument Sans"', '400 9px "JetBrains Mono"', '500 9px "JetBrains Mono"'].map((f) => document.fonts.load(f))),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch (_) { /* measure with whatever loaded */ }
    measure(); relax(); ports(); draw();
    showIntro();
    if (still) {
      card.classList.add('closed');
      const p = new URLSearchParams(location.search);
      const s = +(p.get('s') || .62), yr = +(p.get('y') || 1780), cx = +(p.get('x') || 900);
      const r = box();
      view.s = s; view.x = r.width / 2 - cx * s; view.y = 0 - Y(yr) * s;
      apply();
      if (location.hash) fromHash();
      return;
    }
    setCard(!isPhone() || !location.hash);
    home();
    buildMap();
    if (fromHash()) auto.touched = true;
    else inkIn();
    idle();
    let w = innerWidth;
    addEventListener('resize', () => {
      buildMap(); clamp(); apply();
      setCard(!card.classList.contains('closed'));
      if (Math.abs(innerWidth - w) > 200) { w = innerWidth; home(); }
    });
  }
  start();
})();
