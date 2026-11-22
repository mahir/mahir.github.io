// A river that moves, and the sheet that remembers where it has been. No DOM in here.
//
// The river is a line of points down the middle of the channel. Each year every point moves
// sideways, toward the outside of its bend, at a rate set by the bends upstream of it. That
// is the rule of Alan Howard and Thomas Knutson, "Sufficient conditions for river
// meandering: A simulation approach", Water Resources Research 20 (1984): a bank's nominal
// rate grows with the curvature of the bend and is greatest where the bend's radius is
// about three channel widths; the rate a point really moves at is its own nominal rate
// times OMEGA plus GAMMA times an average of the nominal rates upstream, weighted less the
// farther upstream. When two reaches of the river touch, it takes the short way and the
// loop is left behind.
//
// All lengths are in channel widths, all times in years.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.River = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // What every river shares.
  const P = {
    years: 2000,     // how long a river runs
    every: 2,        // the sheet looks at the river every so many years
    h: 0.5,          // spacing of the points along the channel
    omega: -1,       // Howard and Knutson's weight on a point's own bend
    gamma: 2.5,      // and on the bends upstream of it
    sharp: 2.99,     // the bend radius at which a bank moves fastest
    reach: 2,        // curvature is read from the points this many to each side
    iron: 0.04,      // how hard short kinks are ironed out each step
    rough: 0.25,     // how far from its valley's middle line a river starts
    cols: 1536,      // the sheet, in cells along the valley
    rows: 960,       // and across it
    fill: 6,         // an abandoned loop is marked in this many bands, bank to middle
    pond: 400,       // years for the water in such a loop to close up, at its middle
    set: 150,        // years for the clay in it to set
    plug: 0.2,       // how fast a bank cuts set clay, against open ground
    stiff: 0.1,      // and how fast it cuts the hard ground a valley starts with
    bend: 9.5,       // a river's bends come about this many widths apart, divided by alpha
    pace: 1,         // see kl in character()
  };

  // a small seeded generator (mulberry32)
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // how a bend's curvature (in 1/widths) sets the nominal rate: in step with curvature up
  // to the sharpest bend that still speeds up, then falling with the square of the radius
  function rate(c) {
    const c0 = 1 / P.sharp;
    return c <= c0 ? c : c0 * c0 * c0 / (c * c);
  }

  // What one river has of its own, drawn from its number: how big it is on the sheet, how
  // far upstream its bends listen, how fast its banks move, how soon it cuts a loop off,
  // the shape of its valley and where the ground is hard. Lengths are in widths of the
  // river, so a river that is small on the sheet has a sheet many widths long.
  function character(seed) {
    const r = rng(((seed >>> 0) * 2654435761) >>> 0);
    const C = Object.assign({}, P);
    C.seed = seed;
    // size on the sheet, and how far the weight on upstream bends reaches (it dies away
    // as exp(-alpha * distance)); between them they set how many bends a sheet holds
    do { C.long = Math.round(48 * Math.pow(2, r() * 1.4)); C.alpha = 0.45 * Math.pow(2, r() * 1.6); }
    while (C.long * C.alpha < 30 || C.long * C.alpha > 125);
    C.wide = C.long * C.rows / C.cols;
    C.per = C.cols / C.long;
    const lam = C.lam = P.bend / C.alpha;
    // two reaches this close, center to center, and the river cuts across: 1 is banks touching
    C.neck = r() < 0.55 ? 1 : 1 + r() * 1.5;
    // how many times over the river could have grown a loop and cut it in its 2,000 years
    C.age = 1.1 + 1.9 * (r() + r()) / 2;
    // the migration constant, widths a year for a bend of radius one width, that gives it
    // that age: the sum below was fitted by running rivers of every kind and timing their
    // first cut-offs
    C.kl = P.pace * (34 + 10.4 / Math.pow(C.alpha, 2.5)) * (1 - 0.12 * (C.neck - 1)) * C.age / P.years;
    C.sub = Math.max(1, Math.ceil(C.kl / 0.1));       // steps a year, to keep the sums steady
    C.lead = Math.max(50, 4.5 * lam);                  // river run upstream of the sheet, so bends arrive grown
    C.tail = Math.max(30, 2.5 * lam);                  // and downstream of it
    // the valley: how much its walls wander, its half-width, and how far off the sheet's
    // middle it lies; the three are drawn so the walls stay on the sheet
    const room = C.room = C.wide / 2 - 1.4;
    const wander = room * 0.34 * r();
    const least = Math.min(room - wander, Math.max(0.42 * room, 0.45 * lam));
    C.half = least + (room - wander - least) * r();
    C.off = (room - wander - C.half) * (r() * 2 - 1) * 0.8;
    const share = r(), sway = wander * share, pinch = Math.min(wander * (1 - share), C.half - Math.max(2.5, 0.3 * lam));
    const wave = (amp, part) => [Math.max(0, amp) * part, Math.PI * 2 / (C.long * (0.35 + 0.95 * r())), r() * Math.PI * 2];
    // nine waves: three move both walls together, three the wall on one side, three the other
    C.waves = [wave(sway, 0.5), wave(sway, 0.3), wave(sway, 0.2), wave(pinch, 0.5), wave(pinch, 0.3), wave(pinch, 0.2), wave(pinch, 0.5), wave(pinch, 0.3), wave(pinch, 0.2)];
    // ground that was hard before the river came: a few ovals on the valley floor
    C.hard = [];
    for (let k = Math.min(4, Math.floor(r() * r() * 5.2)); k > 0; k--) {
      const rx = lam * (0.16 + 0.34 * r()), px = C.long * (0.06 + 0.88 * r()), [top, bottom] = walls(C, px);
      C.hard.push([px, (top + bottom) / 2 + (top - bottom) / 2 * 0.7 * (r() * 2 - 1), rx, rx * (0.4 + 0.6 * r()), r() * Math.PI]);
    }
    return C;
  }

  // a river's character, in a sentence
  function describe(C) {
    const size = C.long <= 62 ? 'A broad river' : C.long >= 98 ? 'A small river' : 'A river';
    const has = [];
    if (C.alpha <= 0.62) has.push('long, sweeping bends'); else if (C.alpha >= 1.02) has.push('tight bends');
    if (C.age <= 1.65) has.push('slow banks'); else if (C.age >= 2.45) has.push('restless banks');
    const quick = C.neck > 1.6 ? (has.length ? ', quick to cut its loops off,' : ' that is quick to cut its loops off,') : '';
    const valley = C.half <= 0.8 * C.lam ? 'a narrow valley' : C.half >= 1.9 * C.lam ? 'a wide valley' : 'its valley';
    const n = Math.min(4, C.hard.length), hard = n ? ` with ${['', 'one patch', 'two patches', 'three patches', 'four patches'][n]} of hard ground` : '';
    return `${size}${has.length ? ' with ' + has.join(' and ') : ''}${quick} in ${valley}${hard}.`;
  }

  // the valley's two walls at a place along it: [upper, lower], measured from the sheet's middle line
  function walls(C, x) {
    const w = C.waves, s = (i) => w[i][0] * Math.sin(w[i][1] * x + w[i][2]);
    const both = s(0) + s(1) + s(2);
    return [C.off + C.half + both + s(3) + s(4) + s(5), C.off - C.half + both - s(6) - s(7) - s(8)];
  }

  function Channel(seed, C) {
    C = C || character(seed);
    const rand = rng(seed);
    const span = C.lead + C.long + C.tail;
    let cap = 4096, n = Math.round(span / C.h) + 1;
    while (n * 2 > cap) cap *= 2;
    let x = new Float64Array(cap), y = new Float64Array(cap);
    let nx = new Float64Array(cap), ny = new Float64Array(cap);
    let r0 = new Float64Array(cap), r1 = new Float64Array(cap), ds = new Float64Array(cap);

    // down the middle of its valley, nearly: a few long, low waves of chance
    const waves = [];
    for (let k = 0; k < 9; k++) waves.push({ l: C.lam * (0.4 + rand() * 1.5), p: rand() * Math.PI * 2, a: (0.4 + rand()) });
    const total = waves.reduce((s, w) => s + w.a, 0);
    for (let i = 0; i < n; i++) {
      const s = i * C.h;
      let v = 0;
      for (const w of waves) v += w.a * Math.sin(s * Math.PI * 2 / w.l + w.p);
      x[i] = -C.lead + s;
      const [a, b] = walls(C, x[i]);
      y[i] = (a + b) / 2 + C.rough * (C.lam / 13) * v / total * 2 * smooth(0, 8, s) * smooth(0, 8, span - s);
    }

    // a grid of cells one neck wide, to find reaches that have come together
    const gx0 = -C.lead - 20, gy0 = -C.wide / 2 - 10, gw = Math.ceil((span + 40) / C.neck), gh = Math.ceil((C.wide + 20) / C.neck);
    const head = new Int32Array(gw * gh);
    let next = new Int32Array(cap);
    // and a grid of half-width cells that remembers where a cut-off loop lies, and since when
    const cw = Math.ceil((span + 40) * 2), chh = Math.ceil((C.wide + 20) * 2);
    const clay = new Float32Array(cw * chh).fill(-1);
    const clayAt = (px, py) => {
      const cx = Math.floor((px - gx0) * 2), cy = Math.floor((py - gy0) * 2);
      return cx < 0 || cy < 0 || cx >= cw || cy >= chh ? -1 : cy * cw + cx;
    };

    const cuts = [];      // every loop cut off: { year, x, y }
    let year = 0, length = span, fastest = 0;

    // how easily a bank is cut at a place: 1 on open ground, less in hard ground and set clay
    function soft(px, py) {
      let e = 1;
      for (const k of C.hard) {
        const dx = px - k[0], dy = py - k[1], c = Math.cos(k[4]), s = Math.sin(k[4]);
        const u = ((dx * c + dy * s) / k[2]) ** 2 + ((dy * c - dx * s) / k[3]) ** 2;
        if (u < 1) e = Math.min(e, C.stiff + (1 - C.stiff) * smooth(0.75, 1, u));
      }
      const i = clayAt(px, py);
      if (i >= 0 && clay[i] >= 0) e = Math.min(e, 1 - (1 - C.plug) * smooth(0, C.set, year - clay[i]));
      return e;
    }

    function grow() {
      cap *= 2;
      const bigger = (a) => { const b = new Float64Array(cap); b.set(a); return b; };
      x = bigger(x); y = bigger(y); nx = new Float64Array(cap); ny = new Float64Array(cap);
      r0 = new Float64Array(cap); r1 = new Float64Array(cap); ds = new Float64Array(cap);
      next = new Int32Array(cap);
    }

    function move(dt) {
      // curvature at each point, from the circle through it and two of its neighbors
      length = 0;
      r0[0] = 0; ds[0] = 0;
      const m = C.reach;
      for (let i = 1; i < n; i++) {
        const la = Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]);
        ds[i] = la; length += la;
        if (i === n - 1) { r0[i] = 0; break; }
        const i0 = i - m < 0 ? 0 : i - m, i1 = i + m > n - 1 ? n - 1 : i + m;
        const ax = x[i] - x[i0], ay = y[i] - y[i0], bx = x[i1] - x[i], by = y[i1] - y[i];
        const k = 2 * (ax * by - ay * bx) / (Math.hypot(ax, ay) * Math.hypot(bx, by) * Math.hypot(ax + bx, ay + by) + 1e-12);
        r0[i] = C.kl * rate(Math.abs(k)) * (k < 0 ? -1 : 1);
      }
      // a longer river on the same fall is a slower one
      const straight = Math.hypot(x[n - 1] - x[0], y[n - 1] - y[0]);
      const slow = Math.pow(length / straight, -2 / 3);
      // each point's own rate and the weighted average upstream of it
      let A = 0, B = 0, s = 0;
      for (let i = 1; i < n - 1; i++) {
        const e = Math.exp(-C.alpha * ds[i]);
        A = r0[i] * ds[i] + e * A;
        B = ds[i] + e * B;
        s += ds[i];
        r1[i] = (C.omega * r0[i] + C.gamma * A / B) * slow * smooth(0, 6, s) * smooth(0, 6, length - s);
      }
      // move, at right angles to the channel, toward the outside of the bend
      for (let i = 1; i < n - 1; i++) {
        const tx = x[i + 1] - x[i - 1], ty = y[i + 1] - y[i - 1], l = Math.hypot(tx, ty) || 1;
        const sign = r1[i] < 0 ? -1 : 1, ox = sign * ty / l, oy = -sign * tx / l;
        // the bank being cut is three quarters of a width that way: how soft is it there?
        let go = Math.abs(r1[i]) * soft(x[i] + ox * 0.75, y[i] + oy * 0.75);
        // the valley's walls: a bank cutting toward one slows to nothing
        if (oy !== 0) {
          const [a, b] = walls(C, x[i]);
          go *= smooth(0, 3, oy > 0 ? a - y[i] : y[i] - b);
        }
        if (go > fastest) fastest = go;
        nx[i] = x[i] + ox * go * dt;
        ny[i] = y[i] + oy * go * dt;
        const ci = clayAt(x[i], y[i]);
        if (ci >= 0) clay[ci] = -1;       // where the river runs, it has taken the clay away
      }
      for (let i = 1; i < n - 1; i++) { x[i] = nx[i]; y[i] = ny[i]; }
      // take out kinks a point or two long, which the rule above cannot see
      const q = C.iron;
      for (let i = 2; i < n - 2; i++) {
        nx[i] = x[i] - q * (x[i - 2] - 4 * x[i - 1] + 6 * x[i] - 4 * x[i + 1] + x[i + 2]);
        ny[i] = y[i] - q * (y[i - 2] - 4 * y[i - 1] + 6 * y[i] - 4 * y[i + 1] + y[i + 2]);
      }
      for (let i = 2; i < n - 2; i++) { x[i] = nx[i]; y[i] = ny[i]; }
    }

    // keep the points evenly spaced: add one where two have drawn apart, drop one where
    // two have closed up
    function space() {
      let m = 0;
      nx[m] = x[0]; ny[m] = y[0]; m++;
      for (let i = 1; i < n; i++) {
        const px = nx[m - 1], py = ny[m - 1];
        const d = Math.hypot(x[i] - px, y[i] - py);
        if (d < C.h * 0.6 && i < n - 1) continue;
        if (d > C.h * 1.5) {
          // a point halfway, on the curve through the four around it
          const i0 = Math.max(0, i - 2), i3 = Math.min(n - 1, i + 1);
          const kept = Math.abs(x[i - 1] - px) < 1e-9 && Math.abs(y[i - 1] - py) < 1e-9;
          if (m + 2 >= cap) return false;
          if (kept) {
            nx[m] = (-x[i0] + 9 * x[i - 1] + 9 * x[i] - x[i3]) / 16;
            ny[m] = (-y[i0] + 9 * y[i - 1] + 9 * y[i] - y[i3]) / 16;
          } else { nx[m] = (px + x[i]) / 2; ny[m] = (py + y[i]) / 2; }
          m++;
        }
        if (m + 1 >= cap) return false;
        nx[m] = x[i]; ny[m] = y[i]; m++;
      }
      for (let i = 0; i < m; i++) { x[i] = nx[i]; y[i] = ny[i]; }
      n = m;
      return true;
    }

    // find the first place two reaches touch, and take the short way
    function cut() {
      // two points close together are a neck only if the river runs some way between them
      const near = C.neck * C.neck, far = (3 + 2.2 * C.neck) / C.h;
      for (let again = 0; again < 8; again++) {
        head.fill(-1);
        let a = -1, b = -1;
        for (let i = 0; i < n && a < 0; i++) {
          const cx = Math.max(0, Math.min(gw - 1, Math.floor((x[i] - gx0) / C.neck)));
          const cy = Math.max(0, Math.min(gh - 1, Math.floor((y[i] - gy0) / C.neck)));
          let best = near;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const gx = cx + dx, gy = cy + dy;
            if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) continue;
            for (let j = head[gy * gw + gx]; j >= 0; j = next[j]) {
              if (i - j <= far) continue;
              const d = (x[i] - x[j]) * (x[i] - x[j]) + (y[i] - y[j]) * (y[i] - y[j]);
              if (d < best) { best = d; a = j; b = i; }
            }
          }
          const cell = cy * gw + cx;
          next[i] = head[cell]; head[cell] = i;
        }
        if (a < 0) break;
        cuts.push({ year, x: Float32Array.from(x.subarray(a, b + 1)), y: Float32Array.from(y.subarray(a, b + 1)) });
        // clay begins to settle in the loop left behind, away from its two ends
        for (let i = a + 4; i < b - 3; i++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (dx && dy) continue;
          const ci = clayAt(x[i] + dx * 0.5, y[i] + dy * 0.5);
          if (ci >= 0) clay[ci] = year;
        }
        x.copyWithin(a + 1, b, n); y.copyWithin(a + 1, b, n);
        n -= b - a - 1;
      }
    }

    return {
      C,
      get n() { return n; }, get x() { return x; }, get y() { return y; },
      get year() { return year; }, get length() { return length; }, cuts, soft,
      // the most any point has moved in a year
      get fastest() { return fastest; },
      // how many times longer than the straight line between its ends
      get winding() { return length / Math.hypot(x[n - 1] - x[0], y[n - 1] - y[0]); },
      // one year
      step() {
        year++;
        for (let k = 0; k < C.sub; k++) {
          move(1 / C.sub);
          while (!space()) grow();
          cut();
        }
      },
    };
  }

  // The sheet: a grid of cells, each remembering when the river was on it.
  // A visit is one 32-bit number: the first look at which the cell was water (10 bits; a
  // look is P.every years), the last (10 bits), and for a cell left behind in a cut-off
  // loop how near the middle of the old channel it was (3 bits: 0 when the river moved
  // off, 1 at the bank to P.fill in the middle). `head` has, for each cell, where its
  // visits start in `pool` (24 bits) and how many there are (8 bits), oldest first.
  const NONE = 0xFFFF;
  function Sheet(C) {
    const cols = C.cols, rows = C.rows, N = cols * rows;
    const seen = new Uint16Array(N).fill(NONE), from = new Uint16Array(N);
    const lake = new Uint8Array(N), lakeAt = new Uint16Array(N), count = new Uint8Array(N);
    let cap = N * 2, logged = 0, cells = new Uint32Array(cap), vals = new Uint32Array(cap);
    let look = 0, prev = NONE, band = 0, marking = false;
    let head = null, pool = null;

    function close(p, last) {
      // a loop is marked at the look after its cut: a cell last seen the look before was in it
      const flag = lake[p] && lakeAt[p] === last + 1 ? lake[p] : 0;
      lake[p] = 0;
      if (logged === cap) {
        cap *= 2;
        const c = new Uint32Array(cap), v = new Uint32Array(cap);
        c.set(cells); v.set(vals); cells = c; vals = v;
      }
      cells[logged] = p; vals[logged++] = from[p] | (last << 10) | (flag << 20);
      if (count[p] < 255) count[p]++;
    }

    // every cell whose center is inside the triangle
    function tri(ax, ay, bx, by, cx, cy) {
      const lo = Math.min(ay, by, cy), hi = Math.max(ay, by, cy);
      if (hi < 0 || lo > rows) return;
      const r0 = Math.max(0, Math.ceil(lo - 0.5)), r1 = Math.min(rows - 1, Math.floor(hi - 0.5));
      for (let r = r0; r <= r1; r++) {
        const yc = r + 0.5;
        let xl = Infinity, xr = -Infinity;
        if ((ay <= yc) !== (by <= yc)) { const v = ax + (yc - ay) * (bx - ax) / (by - ay); if (v < xl) xl = v; if (v > xr) xr = v; }
        if ((by <= yc) !== (cy <= yc)) { const v = bx + (yc - by) * (cx - bx) / (cy - by); if (v < xl) xl = v; if (v > xr) xr = v; }
        if ((cy <= yc) !== (ay <= yc)) { const v = cx + (yc - cy) * (ax - cx) / (ay - cy); if (v < xl) xl = v; if (v > xr) xr = v; }
        if (xr < 0 || xl > cols) continue;
        const c0 = Math.max(0, Math.ceil(xl - 0.501)), c1 = Math.min(cols - 1, Math.floor(xr - 0.499));
        let p = r * cols + c0;
        if (marking) {
          for (let c = c0; c <= c1; c++, p++) { lake[p] = band; lakeAt[p] = look; }
        } else {
          for (let c = c0; c <= c1; c++, p++) {
            const s = seen[p];
            if (s === look) continue;
            if (s !== prev) { if (s !== NONE) close(p, s); from[p] = look; }
            seen[p] = look;
          }
        }
      }
    }

    // the channel as a ribbon `half` widths to each side of the line through (x, y)
    function ribbon(x, y, n, half) {
      const per = C.per, oy = C.wide / 2;
      let lx = 0, ly = 0, rx = 0, ry = 0;
      for (let i = 0; i < n; i++) {
        const i0 = i > 0 ? i - 1 : 0, i1 = i < n - 1 ? i + 1 : n - 1;
        const tx = x[i1] - x[i0], ty = y[i1] - y[i0], l = Math.hypot(tx, ty) || 1;
        const ox = -ty / l * half, oyv = tx / l * half;
        const Lx = (x[i] + ox) * per, Ly = (y[i] + oyv + oy) * per, Rx = (x[i] - ox) * per, Ry = (y[i] - oyv + oy) * per;
        if (i > 0 && !(Math.max(Lx, Rx, lx, rx) < 0 || Math.min(Lx, Rx, lx, rx) > cols || Math.max(Ly, Ry, ly, ry) < 0 || Math.min(Ly, Ry, ly, ry) > rows)) {
          tri(lx, ly, Lx, Ly, Rx, Ry);
          tri(lx, ly, Rx, Ry, rx, ry);
        }
        lx = Lx; ly = Ly; rx = Rx; ry = Ry;
      }
    }

    return {
      cols, rows,
      get head() { return head; }, get pool() { return pool; },
      // the river as it is at this look
      stamp(n, x, y, points) {
        look = n; prev = n === 0 ? NONE : n - 1; marking = false;
        ribbon(x, y, points, 0.5);
      },
      // a loop just cut off: mark its cells, in bands from the banks to the middle
      abandon(n, x, y) {
        look = n; marking = true;
        for (band = 1; band <= C.fill; band++) ribbon(x, y, x.length, 0.5 * (C.fill - band + 1) / C.fill);
        marking = false;
      },
      // after the last look: close every visit, and gather each cell's visits together
      finish() {
        for (let p = 0; p < N; p++) if (seen[p] !== NONE) { close(p, seen[p]); seen[p] = NONE; }
        head = new Uint32Array(N);
        pool = new Uint32Array(Math.ceil(Math.max(1, logged) / 4096) * 4096);
        let at = 0;
        for (let p = 0; p < N; p++) { head[p] = at | (count[p] << 24); at += count[p]; }
        const put = new Uint8Array(N);
        // the log is in the order the visits ended, so each cell's come out oldest first
        for (let i = 0; i < logged; i++) { const p = cells[i]; if (put[p] < 255) pool[(head[p] & 0xFFFFFF) + put[p]++] = vals[i]; }
        cells = vals = null;
        return logged;
      },
      // what one cell remembers, oldest visit first: [{ from, to, lake }], in looks
      visits(col, row) {
        const h = head[row * cols + col], out = [];
        for (let k = 0, o = h & 0xFFFFFF; k < h >>> 24; k++) { const v = pool[o + k]; out.push({ from: v & 1023, to: (v >> 10) & 1023, lake: v >> 20 }); }
        return out;
      },
    };
  }

  // Run a whole river. Call `more(ms)` until it gives false, to run it a slice at a time.
  function Run(seed, C) {
    C = C || character(seed);
    const ch = Channel(seed, C), sheet = Sheet(C);
    const looks = C.years / C.every;
    const stats = { winding: new Float32Array(looks + 1), cuts: new Uint16Array(looks + 1) };
    let cutsDone = 0, onSheet = 0;
    const inSheet = (c) => { for (let i = 0; i < c.x.length; i++) if (c.x[i] > 0 && c.x[i] < C.long && Math.abs(c.y[i]) < C.wide / 2) return true; return false; };
    sheet.stamp(0, ch.x, ch.y, ch.n);
    stats.winding[0] = ch.winding;
    return {
      seed, C, channel: ch, sheet, stats, looks,
      get year() { return ch.year; },
      get done() { return ch.year >= C.years; },
      // run for about `ms` milliseconds; false when the river has run its years
      more(ms) {
        const until = Date.now() + (ms || 1e9);
        while (ch.year < C.years) {
          ch.step();
          const n = Math.ceil(ch.year / C.every);
          while (cutsDone < ch.cuts.length) {
            const c = ch.cuts[cutsDone++];
            c.sheet = inSheet(c);
            if (c.sheet) onSheet++;
            sheet.abandon(n, c.x, c.y);
          }
          if (ch.year % C.every === 0) {
            sheet.stamp(n, ch.x, ch.y, ch.n);
            stats.winding[n] = ch.winding; stats.cuts[n] = onSheet;
          }
          if (ch.year >= C.years) { sheet.finish(); return false; }
          if ((ch.year & 7) === 0 && Date.now() > until) return true;
        }
        return false;
      },
    };
  }

  return { P, rng, rate, character, describe, walls, Channel, Sheet, Run };
});
