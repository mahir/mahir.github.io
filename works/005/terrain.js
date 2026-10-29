// The land, as a heightfield in metres. The main ridge's crest is the year of closing prices, exactly: day i stands
// at x = dayX(i), z = 0, at the altitude of its close, and between days it follows a monotone cubic, so it never
// rises above a close it didn't reach. The 50- and 200-day averages make two ranges behind it. Erosion only ever
// carves down from each ridge's envelope and stays off the crest, so the line survives every bit of noise.

import { makeNoise } from './noise.js';
import { YEAR } from './data.js';
import { FLOOR } from './scale.js';

export const FOOT = 150; // m, where the ranges meet the plain
export const HORIZON = 100; // m, the flat land the grid fades into at its edges, which runs on to the horizon
const BLEND = 120; // m, how softly the ranges and the plain merge; a crest this far above everything else stays exact

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// a max that rounds the crease where two surfaces meet, and is exact once they're BLEND apart
const smax = (a, b) => { const h = Math.max(BLEND - Math.abs(a - b), 0) / BLEND; return Math.max(a, b) + (h * h * BLEND) / 4; };

// Columns land exactly on the days; rows are as fine as the columns around the ridges and coarser toward the edges.
// quality: columns a day, 1 (low), 2 (mid) or 3 (high).
export function grid(L, quality = 'high') {
  const sub = { low: 1, mid: 2, high: 3 }[quality] || 2;
  const dx = L / ((YEAR - 1) * sub);
  const left = Math.ceil((0.25 * L) / dx);
  const cols = left * 2 + (YEAR - 1) * sub + 1;
  const xs = new Float32Array(cols);
  for (let c = 0; c < cols; c++) xs[c] = (c - left) * dx;
  const zmin = -0.85 * L, zmax = 0.45 * L;
  const step = (z) => dx * (1 + 2.5 * smoothstep(0.25 * L, 0.65 * L, Math.abs(z + 0.1 * L)));
  const up = [0];
  while (up[up.length - 1] < zmax) up.push(up[up.length - 1] + step(up[up.length - 1]));
  const down = [];
  for (let z = 0; z > zmin;) { z -= step(z); down.push(z); }
  const zs = Float32Array.from([...down.reverse(), ...up]);
  return { xs, zs, cols, rows: zs.length, zero: down.length, dayCol: (i) => left + i * sub };
}

// Fritsch–Carlson: through every point, never overshooting between neighbours. Points are h apart from x = 0.
export function monotone(ys, h) {
  const n = ys.length;
  const d = new Float64Array(n - 1), m = new Float64Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / h;
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    const u = clamp(x / h, 0, n - 1);
    const i = Math.min(n - 2, Math.floor(u)), t = u - i;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

function blur(ys, sigma) {
  const r = Math.ceil(sigma * 3), out = new Float64Array(ys.length);
  for (let i = 0; i < ys.length; i++) {
    let s = 0, w = 0;
    for (let k = -r; k <= r; k++) {
      const wk = Math.exp(-(k * k) / (2 * sigma * sigma));
      s += wk * ys[clamp(i + k, 0, ys.length - 1)];
      w += wk;
    }
    out[i] = s / w;
  }
  return out;
}

// A ridge line over x: the crest inside the year, falling away to the plain past either end.
function ridgeLine(alts, L) {
  const h = L / (YEAR - 1);
  const crest = monotone(alts, h);
  const soft = monotone(blur(alts, 8), h);
  const shoulder = 0.1 * L;
  const fall = (x) => (x < 0 ? Math.exp(-((x / shoulder) ** 2)) : x > L ? Math.exp(-(((x - L) / shoulder) ** 2)) : 1);
  return {
    crest: (x) => FOOT + (crest(x) - FOOT) * fall(x),
    soft: (x) => FOOT + (soft(x) - FOOT) * fall(x),
  };
}

export function buildTerrain({ closes, ma50, ma200, scale, seed = 1, quality = 'high' }) {
  const { L } = scale;
  const g = grid(L, quality);
  const { xs, zs, cols, rows } = g;
  const noise = makeNoise(seed);
  const lift = (p) => Math.max(FOOT + 60, scale.alt(p)); // the averages can sit below the year's low; keep them land
  const main = ridgeLine(closes.map(scale.alt), L);
  const ranges = [
    { line: main, z: 0, wide: 1 },
    { line: ridgeLine(ma50.map(lift), L), z: -0.3 * L, wide: 1.4 },
    { line: ridgeLine(ma200.map(lift), L), z: -0.62 * L, wide: 1.8 },
  ];
  const gully = clamp(L / 40, 250, 800); // spacing of spurs and gullies, which run down the slopes (along z)
  const spike = Math.max(1.6 * (L / (YEAR - 1)), 160); // how far a day's rise or dip reaches down the slope; wide enough that hills stay rounded
  const hills = clamp(0.13 * scale.relief, 120, 480); // the foothills' height
  const broad = 0.35 * L;

  const heights = new Float32Array(cols * rows);
  const base = new Float32Array(cols * rows);
  // per column and range: the crest, its smoothed line, and how wide and lopsided the range is there
  const perCol = ranges.map((r, k) => {
    const out = { c: new Float64Array(cols), s: new Float64Array(cols), wide: new Float64Array(cols), back: new Float64Array(cols) };
    for (let ci = 0; ci < cols; ci++) {
      const x = xs[ci];
      out.c[ci] = r.line.crest(x);
      out.s[ci] = r.line.soft(x);
      out.wide[ci] = r.wide * (1 + 0.28 * noise.fbm(x / (0.12 * L), 3.7 + k * 11, 2));
      out.back[ci] = 1.35 * (1 + 0.25 * noise.fbm(x / (0.09 * L), -8.1 + k * 7, 2));
    }
    return out;
  });

  let maxH = 0;
  for (let ri = 0; ri < rows; ri++) {
    const z = zs[ri];
    for (let ci = 0; ci < cols; ci++) {
      const x = xs[ci];
      const plain = FOOT - 40 + 120 * (0.5 + 0.5 * noise.fbm(x / broad, z / broad, 3)) + 25 * noise.fbm(x / 700, z / 700, 3);
      // where water would have carved: deep in eroded noise's valleys, little along its ridges
      const erosion = clamp(0.5 - 0.62 * noise.eroded(x / (2.2 * gully), z / (2.6 * gully), 6), 0, 1);
      const detail = 0.5 + 0.5 * noise.fbm(x / (gully * 0.35), z / (gully * 0.35), 3); // only ever carves
      // belts of foothills in front of the range, for depth; lower where the year was low, never near the crest
      const front = smoothstep(0.07 * L, 0.17 * L, z) * (1 - smoothstep(0.36 * L, 0.44 * L, z));
      let h = plain;
      if (front > 0) {
        const lowHere = clamp((perCol[0].c[ci] - FLOOR) / Math.max(scale.relief, 1) * 2, 0.3, 1);
        const belt = clamp(0.45 + 0.7 * noise.eroded(x / (0.06 * L) + 11.3, z / (0.04 * L) - 4.1, 6), 0, 1);
        h += front * lowHere * hills * belt ** 1.6;
      }
      for (let k = 0; k < ranges.length; k++) {
        const col = perCol[k];
        const c = col.c[ci], s = col.s[ci];
        const dz = z - ranges[k].z;
        const w = (0.62 * (s - FOOT) + 0.035 * L + 200) * col.wide[ci] * (dz < 0 ? col.back[ci] : 1);
        const d = Math.abs(dz) / w;
        if (d > 6) continue;
        const p = 1.9 - 0.6 * clamp((s - FLOOR) / 2500, 0, 1); // round hills, sharper peaks
        // the ranges behind never reach the main crest: after a fall the averages stand taller than the price
        const f = Math.exp(-(d ** p)) * (k === 0 ? 1 : 1 - smoothstep(-0.14 * L, -0.04 * L, z));
        const keep = 1 - Math.exp(-((d / 0.07) ** 2)); // 0 on the crest line, so it stays exact
        // The slopes follow the smoothed line. The day-to-day wiggle (c - s) fades fast below the crest, so it
        // doesn't run down the mountainside as ribs; a notch fades only as fast as keeps the crest the highest point.
        const R = s - FOOT, wiggle = c - s;
        const fast = Math.exp(-((Math.abs(dz) / spike) ** 2)); // a day's spike is a peak, about as deep as it is wide
        const g = wiggle >= 0 ? fast : Math.max(fast, 1 - (R * (1 - f)) / -wiggle);
        const r = FOOT + (R * f + wiggle * g) * (1 - 0.42 * erosion * keep - 0.03 * detail * keep);
        h = smax(h, r);
      }
      // toward the grid's edges everything settles onto the flat land beyond
      const edge = smoothstep(0, 0.08 * L, Math.min(x - xs[0], xs[cols - 1] - x, z - zs[0], zs[rows - 1] - z));
      const i = ri * cols + ci;
      heights[i] = HORIZON + (h - HORIZON) * edge;
      base[i] = HORIZON + (plain - HORIZON) * edge;
      if (h > maxH) maxH = h;
    }
  }
  return { ...g, heights, base, normals: normals(g, heights), maxH, L };
}

export function normals({ xs, zs, cols, rows }, heights) {
  const out = new Float32Array(cols * rows * 3);
  for (let ri = 0; ri < rows; ri++) {
    const r0 = Math.max(0, ri - 1), r1 = Math.min(rows - 1, ri + 1);
    for (let ci = 0; ci < cols; ci++) {
      const c0 = Math.max(0, ci - 1), c1 = Math.min(cols - 1, ci + 1);
      const hx = (heights[ri * cols + c1] - heights[ri * cols + c0]) / (xs[c1] - xs[c0]);
      const hz = (heights[r1 * cols + ci] - heights[r0 * cols + ci]) / (zs[r1] - zs[r0]);
      const len = Math.hypot(hx, 1, hz), o = (ri * cols + ci) * 3;
      out[o] = -hx / len; out[o + 1] = 1 / len; out[o + 2] = -hz / len;
    }
  }
  return out;
}

// Height anywhere on the grid, bilinear.
export function sampler({ xs, zs, cols, rows, heights }) {
  const find = (arr, v) => {
    let lo = 0, hi = arr.length - 1;
    if (v <= arr[0]) return [0, 0];
    if (v >= arr[hi]) return [hi - 1, 1];
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (arr[mid] <= v) lo = mid; else hi = mid; }
    return [lo, (v - arr[lo]) / (arr[lo + 1] - arr[lo])];
  };
  return (x, z) => {
    const [c, tx] = find(xs, x), [r, tz] = find(zs, z);
    const h = (rr, cc) => heights[Math.min(rows - 1, rr) * cols + Math.min(cols - 1, cc)];
    const a = h(r, c) + (h(r, c + 1) - h(r, c)) * tx;
    const b = h(r + 1, c) + (h(r + 1, c + 1) - h(r + 1, c)) * tx;
    return a + (b - a) * tz;
  };
}

// The crest as a polyline for the opening chart, several points a day, on the same cubic as the land.
export function crestLine(closes, scale, perDay = 4) {
  const n = (YEAR - 1) * perDay + 1;
  const f = monotone(closes.map(scale.alt), scale.L / (YEAR - 1));
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * scale.L;
    out[i * 3] = x; out[i * 3 + 1] = f(x); out[i * 3 + 2] = 0;
  }
  return out;
}
