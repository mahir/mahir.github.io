// The walk itself: a street graph, the shortest way on foot from a start point to everything within
// fifteen minutes, and how much ground that covers. No drawing here, so it also runs under Node (_numbers.js).
(function (root) {
  'use strict';

  const REACH = 1250;            // metres walked in fifteen minutes at 5 km/h
  const SECONDS = 900;
  const CELL = 10;               // the ground is counted on a 10 m grid
  const NEAR = 50;               // ground within 50 m of a street reached counts as reached
  const GRID = 2 * (REACH + NEAR) / CELL;                  // cells across, 260
  const RING_KM2 = Math.PI * REACH * REACH / 1e6;          // 4.91 km², what a straight line reaches
  const STEP = 12;               // streets are cut into pieces of at most 12 m, each with its own arrival time

  // the cells within 50 m of a cell
  const DISC = [];
  for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) if (dx * dx + dy * dy <= 25) DISC.push(dx, dy);

  // data: { n: [x, y, ...], e: [a, b, n, dx, dy, ...  |  a, b, -1, length, ...] } as _streets.py writes it
  function graph(data) {
    const N = data.n.length / 2, e = data.e;
    let E = 0, P = 0;
    for (let i = 0; i < e.length;) { const n = e[i + 2]; E++; if (n < 0) i += 4; else { P += n + 2; i += 3 + 2 * n; } }
    const g = {
      N, E, x: new Float32Array(N), y: new Float32Array(N),
      a: new Int32Array(E), b: new Int32Array(E), len: new Float32Array(E),
      at: new Int32Array(E), count: new Int32Array(E),       // where each edge's points start in px/py, and how many (0: not drawn)
      px: new Float32Array(P), py: new Float32Array(P),
      box: new Float32Array(4 * E),                          // each edge's bounds: min x, min y, max x, max y
      head: new Int32Array(N + 1), to: null, via: null,
    };
    for (let i = 0; i < N; i++) { g.x[i] = data.n[2 * i]; g.y[i] = data.n[2 * i + 1]; }
    let k = 0, p = 0;
    for (let i = 0; i < e.length; k++) {
      const a = e[i], b = e[i + 1], n = e[i + 2];
      g.a[k] = a; g.b[k] = b; g.head[a + 1]++; g.head[b + 1]++;
      if (n < 0) { g.len[k] = e[i + 3]; g.at[k] = p; i += 4; continue; }
      g.at[k] = p; g.count[k] = n + 2;
      let x = g.x[a], y = g.y[a], len = 0, x0 = x, y0 = y, x1 = x, y1 = y;
      g.px[p] = x; g.py[p++] = y;
      for (let j = 0; j <= n; j++) {
        const nx = j < n ? x + e[i + 3 + 2 * j] : g.x[b], ny = j < n ? y + e[i + 4 + 2 * j] : g.y[b];
        len += Math.hypot(nx - x, ny - y); x = nx; y = ny;
        g.px[p] = x; g.py[p++] = y;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      g.len[k] = Math.max(len, 0.5);
      g.box.set([x0, y0, x1, y1], 4 * k);
      i += 3 + 2 * n;
    }
    for (let i = 0; i < N; i++) g.head[i + 1] += g.head[i];
    g.to = new Int32Array(2 * E); g.via = new Int32Array(2 * E);
    const fill = g.head.slice(0, N);
    for (let j = 0; j < E; j++) {
      const a = g.a[j], b = g.b[j];
      g.to[fill[a]] = b; g.via[fill[a]++] = j; g.to[fill[b]] = a; g.via[fill[b]++] = j;
    }
    g.dist = new Float32Array(N); g.heapD = new Float32Array(4 * E + 8); g.heapN = new Int32Array(4 * E + 8);
    return g;
  }

  // The point on a drawn street nearest to (x, y): { edge, along (metres from the edge's first junction), x, y }.
  function nearest(g, x, y) {
    let best = Infinity, out = null;
    for (let k = 0; k < g.E; k++) {
      const c = g.count[k]; if (!c) continue;
      const q = 4 * k, bx = g.box[q], by = g.box[q + 1], cx = g.box[q + 2], cy = g.box[q + 3];
      const ox = x < bx ? bx - x : x > cx ? x - cx : 0, oy = y < by ? by - y : y > cy ? y - cy : 0;
      if (ox * ox + oy * oy >= best) continue;
      let along = 0;
      for (let i = g.at[k], end = i + c - 1; i < end; i++) {
        const ax = g.px[i], ay = g.py[i], dx = g.px[i + 1] - ax, dy = g.py[i + 1] - ay, d2 = dx * dx + dy * dy;
        const u = d2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / d2)) : 0;
        const hx = ax + u * dx, hy = ay + u * dy, d = (x - hx) * (x - hx) + (y - hy) * (y - hy), seg = Math.sqrt(d2);
        if (d < best) { best = d; out = { edge: k, along: along + u * seg, x: hx, y: hy }; }
        along += seg;
      }
    }
    return out;
  }

  // Walks from the street point nearest (x, y). Returns the pieces of street reached, in order of arrival,
  // and the ground covered second by second.
  function walk(g, x, y) {
    const s = nearest(g, x, y);
    const dist = g.dist.fill(Infinity), hd = g.heapD, hn = g.heapN;
    let size = 0;
    const push = (d, n) => {
      let i = size++;
      while (i > 0) { const up = (i - 1) >> 1; if (hd[up] <= d) break; hd[i] = hd[up]; hn[i] = hn[up]; i = up; }
      hd[i] = d; hn[i] = n;
    };
    const pop = () => {
      const top = hn[0], d = hd[--size], n = hn[size];
      let i = 0;
      for (;;) {
        let c = 2 * i + 1; if (c >= size) break;
        if (c + 1 < size && hd[c + 1] < hd[c]) c++;
        if (hd[c] >= d) break;
        hd[i] = hd[c]; hn[i] = hn[c]; i = c;
      }
      hd[i] = d; hn[i] = n;
      return top;
    };
    const a0 = g.a[s.edge], b0 = g.b[s.edge], scale0 = 1;
    dist[a0] = s.along * scale0; push(dist[a0], a0);
    if (g.len[s.edge] - s.along < dist[b0]) { dist[b0] = g.len[s.edge] - s.along; push(dist[b0], b0); }
    while (size) {
      const d = hd[0], n = pop();
      if (d > dist[n]) continue;
      if (d > REACH) break;
      for (let i = g.head[n], end = g.head[n + 1]; i < end; i++) {
        const m = g.to[i], nd = d + g.len[g.via[i]];
        if (nd < dist[m]) { dist[m] = nd; push(nd, m); }
      }
    }

    // the ground: for every 10 m cell, when the first street within 50 m of it is reached
    const when = new Float32Array(GRID * GRID).fill(Infinity);
    const gx0 = s.x - REACH - NEAR, gy1 = s.y + REACH + NEAR;
    const stamp = (px, py, t) => {
      const cx = Math.floor((px - gx0) / CELL), cy = Math.floor((gy1 - py) / CELL);
      for (let i = 0; i < DISC.length; i += 2) {
        const ix = cx + DISC[i], iy = cy + DISC[i + 1];
        if (ix < 0 || iy < 0 || ix >= GRID || iy >= GRID) continue;
        const q = iy * GRID + ix; if (t < when[q]) when[q] = t;
      }
    };

    // the pieces
    let cap = 4096, n = 0;
    let X1 = new Float32Array(cap), Y1 = new Float32Array(cap), X2 = new Float32Array(cap), Y2 = new Float32Array(cap), T = new Float32Array(cap);
    const grow = () => {
      cap *= 2;
      for (const [old, set] of [[X1, (v) => X1 = v], [Y1, (v) => Y1 = v], [X2, (v) => X2 = v], [Y2, (v) => Y2 = v], [T, (v) => T = v]]) {
        const next = new Float32Array(cap); next.set(old); set(next);
      }
    };
    for (let k = 0; k < g.E; k++) {
      const da = dist[g.a[k]], db = dist[g.b[k]], L = g.len[k], here = k === s.edge;
      if (da > REACH && db > REACH && !here) continue;
      const c = g.count[k];
      if (!c) {                                        // a sidewalk or crossing: it covers ground but isn't drawn
        const ax = g.x[g.a[k]], ay = g.y[g.a[k]], bx = g.x[g.b[k]], by = g.y[g.b[k]], parts = Math.max(1, Math.ceil(L / CELL));
        for (let j = 0; j <= parts; j++) {
          const f = j / parts, t = Math.min(da + f * L, db + (1 - f) * L);
          if (t <= REACH) stamp(ax + f * (bx - ax), ay + f * (by - ay), t);
        }
        continue;
      }
      let along = 0;
      for (let i = g.at[k], end = i + c - 1; i < end; i++) {
        const ax = g.px[i], ay = g.py[i], dx = g.px[i + 1] - ax, dy = g.py[i + 1] - ay, seg = Math.hypot(dx, dy);
        const parts = Math.max(1, Math.ceil(seg / STEP));
        for (let j = 0; j < parts; j++) {
          const mid = along + seg * (j + 0.5) / parts;
          let t = Math.min(da + mid, db + L - mid);
          if (here) t = Math.min(t, Math.abs(mid - s.along));
          if (t > REACH) continue;
          if (n === cap) grow();
          const f1 = j / parts, f2 = (j + 1) / parts;
          X1[n] = ax + f1 * dx; Y1[n] = ay + f1 * dy; X2[n] = ax + f2 * dx; Y2[n] = ay + f2 * dy; T[n++] = t;
          stamp(ax + (f1 + f2) / 2 * dx, ay + (f1 + f2) / 2 * dy, t);
        }
        along += seg;
      }
    }

    // put the pieces in order of arrival, a second at a time: pieces of second i are order[from[i] .. from[i + 1])
    const perSecond = SECONDS / REACH, from = new Int32Array(SECONDS + 2), order = new Int32Array(n);
    const sec = new Int16Array(n);
    for (let i = 0; i < n; i++) { sec[i] = Math.min(SECONDS, Math.floor(T[i] * perSecond)); from[sec[i] + 1]++; }
    for (let i = 0; i <= SECONDS; i++) from[i + 1] += from[i];
    const fill = from.slice(0, SECONDS + 1);
    for (let i = 0; i < n; i++) order[fill[sec[i]]++] = i;

    // ground covered after each second, in cells, counted inside the ring only
    const cells = new Int32Array(SECONDS + 1), half = GRID / 2, limit = (REACH / CELL) * (REACH / CELL);
    for (let iy = 0; iy < GRID; iy++) for (let ix = 0; ix < GRID; ix++) {
      const t = when[iy * GRID + ix];
      if (t === Infinity || (ix + 0.5 - half) * (ix + 0.5 - half) + (iy + 0.5 - half) * (iy + 0.5 - half) > limit) continue;
      cells[Math.min(SECONDS, Math.ceil(t * perSecond))]++;
    }
    for (let i = 1; i <= SECONDS; i++) cells[i] += cells[i - 1];

    return { x: s.x, y: s.y, n, X1, Y1, X2, Y2, order, from, when, cells };
  }

  // km² covered after `seconds`, and that as a share of the ring
  const km2 = (w, seconds) => w.cells[Math.max(0, Math.min(SECONDS, Math.floor(seconds)))] * CELL * CELL / 1e6;
  const share = (w, seconds) => km2(w, seconds) / RING_KM2;

  const api = { REACH, SECONDS, CELL, NEAR, GRID, RING_KM2, graph, nearest, walk, km2, share };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Walk = api;
})(typeof self !== 'undefined' ? self : this);
