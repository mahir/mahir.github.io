// Single-stroke technical lettering, caps only, upright.
//
//   strokeText(str, opts = {}) -> { paths: number[][], width }
//
// Cap height = 1, baseline y = 0, y UP, x right, the string starts at x = 0.
// Each path is a flat [x0, y0, x1, y1, ...] polyline. opts.spacing is extra letter
// spacing in cap heights (default 0.18). Lowercase maps to caps, accents are dropped
// (Ç -> C, Ş -> S), unknown characters render as a space. width is the advance of
// the whole string (no trailing spacing).
//
// Also exported: textWidth(str, opts) and the glyph table GLYPHS for the specimen.
//
// The letters are drawn on a cap height of 1 with lines and elliptical arcs; arcs are
// cut into short straight pieces (about one every 9 degrees), enough to read as round
// from 7 to 40 px cap height. Each glyph is shifted so its ink starts at x = 0, and its
// advance is its ink width plus the spacing, so the gaps between letters are even.

const D = Math.PI / 180;

// an elliptical arc from a0 to a1 degrees (counterclockwise when a1 > a0)
function arc(cx, cy, rx, ry, a0, a1, step = 9) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + (a1 - a0) * (i / n)) * D;
    out.push(cx + rx * Math.cos(a), cy + ry * Math.sin(a));
  }
  return out;
}

// a squarer ellipse (superellipse, exponent e > 2), for O, C, G, Q, 0
function sq(cx, cy, rx, ry, a0, a1, e = 2.35, step = 7) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
  const out = [];
  const p = 2 / e;
  for (let i = 0; i <= n; i++) {
    const a = (a0 + (a1 - a0) * (i / n)) * D;
    const c = Math.cos(a), s = Math.sin(a);
    out.push(cx + rx * Math.sign(c) * Math.abs(c) ** p, cy + ry * Math.sign(s) * Math.abs(s) ** p);
  }
  return out;
}

// join pieces into one polyline, dropping a point that repeats the previous one
function P(...parts) {
  const out = [];
  for (const part of parts) {
    for (let i = 0; i < part.length; i += 2) {
      const x = part[i], y = part[i + 1];
      const n = out.length;
      if (n && Math.abs(out[n - 2] - x) < 1e-6 && Math.abs(out[n - 1] - y) < 1e-6) continue;
      out.push(x, y);
    }
  }
  return out;
}

const DOT = 0.055; // a dot is a very short vertical stroke; the pen's round cap makes it round
const dot = (x, y) => [x, y, x, y + DOT];

// the glyphs, each a list of polylines; x is shifted later so the ink starts at 0
const RAW = {
  A: [[0, 0, 0.34, 1, 0.68, 0], [0.115, 0.32, 0.565, 0.32]],
  B: [P([0, 0.53, 0, 1, 0.34, 1], arc(0.34, 0.765, 0.235, 0.235, 90, -90), [0, 0.53]),
      P([0, 0.53, 0.36, 0.53], arc(0.36, 0.265, 0.265, 0.265, 90, -90), [0, 0, 0, 0.53])],
  C: [sq(0.33, 0.5, 0.33, 0.5, 38, 322)],
  D: [P([0, 0, 0, 1, 0.26, 1], arc(0.26, 0.5, 0.36, 0.5, 90, -90, 7), [0, 0])],
  E: [[0.54, 1, 0, 1, 0, 0, 0.56, 0], [0, 0.53, 0.44, 0.53]],
  F: [[0.54, 1, 0, 1, 0, 0], [0, 0.53, 0.44, 0.53]],
  G: [P(sq(0.34, 0.5, 0.34, 0.5, 38, 352), [0.68, 0.44, 0.38, 0.44])],
  H: [[0, 0, 0, 1], [0.6, 0, 0.6, 1], [0, 0.53, 0.6, 0.53]],
  I: [[0, 0, 0, 1]],
  J: [P([0.5, 1, 0.5, 0.27], arc(0.25, 0.27, 0.25, 0.27, 0, -180), [0, 0.32])],
  K: [[0, 0, 0, 1], [0.58, 1, 0, 0.36], [0.2, 0.59, 0.6, 0]],
  L: [[0, 1, 0, 0, 0.52, 0]],
  M: [[0, 0, 0, 1, 0.38, 0.22, 0.76, 1, 0.76, 0]],
  N: [[0, 0, 0, 1, 0.62, 0, 0.62, 1]],
  O: [sq(0.35, 0.5, 0.35, 0.5, 90, 450)],
  P: [P([0, 0, 0, 1, 0.33, 1], arc(0.33, 0.75, 0.25, 0.25, 90, -90), [0, 0.5])],
  Q: [sq(0.35, 0.5, 0.35, 0.5, 90, 450), [0.42, 0.24, 0.72, -0.05]],
  R: [P([0, 0, 0, 1, 0.33, 1], arc(0.33, 0.755, 0.245, 0.245, 90, -90), [0, 0.51]), [0.3, 0.51, 0.6, 0]],
  S: [P(arc(0.3, 0.75, 0.265, 0.25, 22, 270), arc(0.3, 0.25, 0.295, 0.25, 90, -158))],
  T: [[0, 1, 0.62, 1], [0.31, 1, 0.31, 0]],
  U: [P([0, 1, 0, 0.31], arc(0.3, 0.31, 0.3, 0.31, 180, 360), [0.6, 1])],
  V: [[0, 1, 0.33, 0, 0.66, 1]],
  W: [[0, 1, 0.2, 0, 0.46, 0.78, 0.72, 0, 0.92, 1]],
  X: [[0, 1, 0.62, 0], [0, 0, 0.62, 1]],
  Y: [[0, 1, 0.32, 0.48, 0.64, 1], [0.32, 0.48, 0.32, 0]],
  Z: [[0.02, 1, 0.58, 1, 0, 0, 0.6, 0]],

  0: [sq(0.29, 0.5, 0.29, 0.5, 90, 450, 2.25)],
  1: [[0, 0.78, 0.24, 1, 0.24, 0]],
  2: [P(arc(0.28, 0.72, 0.27, 0.27, 158, -38), [0, 0, 0.57, 0])],
  3: [P(arc(0.27, 0.765, 0.235, 0.235, 152, -90), [0.2, 0.53]),
      P([0.2, 0.53, 0.3, 0.53], arc(0.3, 0.27, 0.27, 0.26, 90, -152))],
  4: [[0.44, 0, 0.44, 1, 0, 0.3, 0.6, 0.3]],
  5: [P([0.52, 1, 0.07, 1, 0.045, 0.565], arc(0.29, 0.325, 0.285, 0.325, 132, -150))],
  6: [P(arc(0.29, 0.6, 0.29, 0.4, 62, 180), [0, 0.3], arc(0.29, 0.3, 0.29, 0.3, 180, 540))],
  7: [[0, 1, 0.56, 1, 0.18, 0]],
  8: [arc(0.28, 0.765, 0.235, 0.235, -90, 270), arc(0.28, 0.265, 0.28, 0.265, 90, 450)],
  9: null, // 6 turned over, below
  ' ': [],
  '.': [dot(0, 0)],
  ',': [[0.05, 0.06, 0.05, 0, 0, -0.16]],
  '-': [[0, 0.46, 0.36, 0.46]],
  '/': [[0, -0.02, 0.44, 1.02]],
  ':': [dot(0, 0.6), dot(0, 0)],
  ';': [dot(0.05, 0.6), [0.05, 0.06, 0.05, 0, 0, -0.16]],
  "'": [[0, 1, 0, 0.72]],
  '"': [[0, 1, 0, 0.72], [0.17, 1, 0.17, 0.72]],
  '(': [arc(0.42, 0.5, 0.42, 0.6, 122, 238)],
  ')': null, // ( turned over
  '+': [[0, 0.46, 0.52, 0.46], [0.26, 0.2, 0.26, 0.72]],
  '×': [[0, 0.24, 0.42, 0.66], [0, 0.66, 0.42, 0.24]],
  '°': [arc(0.12, 0.86, 0.12, 0.12, 90, 450, 20)],
  '#': [[0.12, 0, 0.25, 1], [0.39, 0, 0.52, 1], [0.0, 0.33, 0.6, 0.33], [0.04, 0.67, 0.64, 0.67]],
  '&': [P([0.66, 0, 0.205, 0.625], arc(0.3, 0.8, 0.16, 0.2, 238, -42), [0.06, 0.34]),
        P(arc(0.27, 0.23, 0.25, 0.23, 154, 380), [0.62, 0.44])],
  '?': [P(arc(0.27, 0.74, 0.26, 0.25, 160, -48), [0.27, 0.36, 0.27, 0.27]), dot(0.27, 0)],
  '!': [[0, 1, 0, 0.27], dot(0, 0)],
  '=': [[0, 0.32, 0.52, 0.32], [0, 0.6, 0.52, 0.6]],
  '·': [dot(0, 0.44)],
  '%': [[0, 0, 0.62, 1], arc(0.12, 0.83, 0.12, 0.17, 90, 450, 20), arc(0.5, 0.17, 0.12, 0.17, 90, 450, 20)],
  '<': [[0.48, 0.78, 0, 0.46, 0.48, 0.14]],
  '>': [[0, 0.78, 0.48, 0.46, 0, 0.14]],
  '_': [[0, -0.12, 0.6, -0.12]],
  'Ø': [sq(0.35, 0.5, 0.35, 0.5, 90, 450), [-0.04, -0.04, 0.74, 1.04]],
};

const turn = (paths) => {
  let x1 = 0;
  for (const p of paths) for (let i = 0; i < p.length; i += 2) x1 = Math.max(x1, p[i]);
  return paths.map((p) => { const q = []; for (let i = 0; i < p.length; i += 2) q.push(x1 - p[i], 1 - p[i + 1]); return q; });
};
RAW[9] = turn(RAW[6]);
RAW[')'] = RAW['('].map((p) => { const q = []; for (let i = 0; i < p.length; i += 2) q.push(-p[i], p[i + 1]); return q; });

// a little air on both sides of the thin punctuation, so 1:120 and NO. do not crowd
const PAD = { '.': 0.05, ',': 0.05, ':': 0.07, ';': 0.07, '!': 0.04, '·': 0.1, "'": 0.02, I: 0.01, 1: 0.01 };

// normalize: ink starts at x = 0 (plus its pad); w = ink width (plus both pads)
export const GLYPHS = {};
for (const [ch, paths] of Object.entries(RAW)) {
  let x0 = Infinity, x1 = -Infinity;
  for (const p of paths) for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); }
  if (!paths.length) { GLYPHS[ch] = { paths: [], w: 0.42 }; continue; }
  const pad = PAD[ch] || 0;
  GLYPHS[ch] = { paths: paths.map((p) => p.map((v, i) => (i % 2 ? v : v - x0 + pad))), w: x1 - x0 + 2 * pad };
}
const SPACE = GLYPHS[' '];

const ALIAS = { '–': '-', '—': '-', '‘': "'", '’': "'", '“': '"', '”': '"', '•': '·', '*': '×' };

function glyphOf(ch) {
  let g = GLYPHS[ch];
  if (g) return g;
  if (ALIAS[ch]) return GLYPHS[ALIAS[ch]];
  const up = ch.toUpperCase();
  if (GLYPHS[up]) return GLYPHS[up];
  const base = up.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (base === 'ı' || base === 'İ') return GLYPHS.I;
  if (GLYPHS[base]) return GLYPHS[base];
  if (up === 'ß') return GLYPHS.S;
  return SPACE;
}

const cache = new Map();

export function strokeText(str, opts = {}) {
  const spacing = opts.spacing ?? 0.18;
  const s = String(str);
  const key = spacing + '|' + s;
  const hit = cache.get(key);
  if (hit) return { paths: hit.paths.map((p) => p.slice()), width: hit.width };
  const paths = [];
  let x = 0;
  const chars = [...s];
  for (let k = 0; k < chars.length; k++) {
    const g = glyphOf(chars[k]);
    if (k > 0) x += spacing;
    for (const p of g.paths) {
      const q = new Array(p.length);
      for (let i = 0; i < p.length; i += 2) { q[i] = p[i] + x; q[i + 1] = p[i + 1]; }
      paths.push(q);
    }
    x += g.w;
  }
  const out = { paths, width: x };
  if (cache.size > 4000) cache.clear();
  cache.set(key, out);
  return { paths: paths.map((p) => p.slice()), width: x };
}

export function textWidth(str, opts = {}) {
  const spacing = opts.spacing ?? 0.18;
  let x = 0, k = 0;
  for (const ch of String(str)) { if (k++) x += spacing; x += glyphOf(ch).w; }
  return x;
}
