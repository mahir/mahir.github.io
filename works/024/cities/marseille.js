// Marseille: the Vieux-Port painted as a Fauve would, about 1906. Looking down
// the old harbor to its mouth: Notre-Dame de la Garde on its hill to the left,
// the Fort Saint-Jean with its square tower and its round lantern tower on the
// right, the Château d'If out at sea, the quays of houses on either side, and
// fishing boats with lateen yards in the foreground. Everything is laid on in
// thick broken strokes of pure color, with the bare canvas showing between them;
// the water is green, orange and red rather than blue. The name brushed in.

import { Plate, W, H } from '../print.js';
import { mix, poly } from '../kit.js';

// pure colors, straight from the tube
const VERM = '#e8412b', ORANGE = '#f28a2e', YEL = '#f6c93a', LEMON = '#f3e35e', EMER = '#1f9a6b', VIRID = '#13705c';
const MINT = '#8fd3a7', ULTRA = '#2b3fb0', COBALT = '#2f6fd0', CERUL = '#5fb0e4', VIOLET = '#7b4fb5', PINK = '#ef7fa6';
const ROSE = '#f4b6b4', PRUSS = '#1c2a6e', CREAM = '#f7ecd3', OCHRE = '#d7953a', CRIMSON = '#c4234a', LILAC = '#b79ae0';
const CANVAS = '#ece1c8';

export const city = {
  id: 'marseille', name: 'Marseille', wall: '#2a1f3a',
  alt: "A Fauvist painting of the Vieux-Port in broken strokes of pure color: Notre-Dame de la Garde on its green hill, the Fort Saint-Jean's square tower and round lantern tower at the harbor mouth, the Château d'If out at sea, quays of pink and yellow houses with shutters, a forest of masts, fishing boats with lateen yards in red, yellow, green and blue on orange and green water, and gulls",
  google: 'family=Caveat+Brush',
  fonts: [['400 270px "Caveat Brush"', 'Marseille'], ['400 64px "Caveat Brush"', 'le Vieux-Port, 1906']],
  build,
};

// ================================================================ the brush
// a stroke of the brush: a leaf, tapered where the brush lands, blunt where it lifts
const PROF = [[-0.5, 0], [-0.32, 0.4], [-0.05, 0.5], [0.28, 0.47], [0.47, 0.25], [0.53, 0], [0.47, -0.25], [0.28, -0.5], [-0.05, -0.5], [-0.32, -0.36]];
function leaf(r, x, y, a, L, w) {
  const ca = Math.cos(a), sa = Math.sin(a), out = [];
  for (const [u, v] of PROF) {
    const uu = u * L * (1 + r.range(-0.07, 0.07)), vv = v * w * (1 + r.range(-0.22, 0.22));
    out.push(x + ca * uu - sa * vv, y + sa * uu + ca * vv);
  }
  return out;
}
function pip(pts, x, y) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
function bounds(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
// strokes laid over a shape: o = { s: spacing, L, w, ang(x, y), aj, col(x, y), streak }
function field(r, shape, o) {
  const b = bounds(shape), out = [];
  const s = o.s, sy = s * (o.sy ?? 0.55);
  for (let y = b.y + sy * 0.4; y < b.y + b.h; y += sy) {
    for (let x = b.x + r.range(0, s); x < b.x + b.w; x += s * r.range(0.7, 1.15)) {
      const px = x + r.range(-s, s) * 0.3, py = y + r.range(-sy, sy) * 0.4;
      if (!pip(shape, px, py)) continue;
      if (o.keep && !o.keep(px, py)) continue;
      const a = o.ang(px, py) + r.gauss() * (o.aj ?? 0.12);
      const L = o.L * r.range(0.7, 1.25), w = o.w * r.range(0.75, 1.2);
      out.push({ x: px, y: py, col: o.col(px, py), pts: leaf(r, px, py, a, L, w), a, L });
    }
  }
  return out;
}
// strokes along a line: a painted contour, broken where the brush ran dry
function along(r, line, o) {
  const out = [];
  for (let i = 1; i < line.length; i++) {
    const [x0, y0] = line[i - 1], [x1, y1] = line[i];
    const len = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
    const n = Math.max(1, Math.round(len / (o.L * 0.72)));
    for (let k = 0; k < n; k++) {
      if (o.gaps && r() < o.gaps) continue;
      const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      const L = Math.min(o.L, len / n * 1.25) * r.range(0.9, 1.2);
      out.push({ x, y, col: typeof o.col === 'function' ? o.col(x, y) : o.col, pts: leaf(r, x + r.range(-1, 1) * (o.j ?? 1.5), y + r.range(-1, 1) * (o.j ?? 1.5), a + r.range(-0.08, 0.08), L, o.w * r.range(0.8, 1.15)), a, L });
    }
  }
  return out;
}
const pick = (r, list) => { // [[color, weight], ...]
  let tot = 0; for (const [, w] of list) tot += w;
  let u = r() * tot; for (const [c, w] of list) { if ((u -= w) <= 0) return c; }
  return list[list.length - 1][0];
};
// smooth value noise, 0 to 1: the painter works in patches of one color, not confetti
function hash(i, j, s) { let h = (i * 374761393 + j * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function noise(x, y, s = 0) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// a color from a short list, chosen by the patch the point falls in; now and
// then a stroke of an accent
function zone(r, x, y, cols, o = {}) {
  if (o.acc && r() < (o.p ?? 0.1)) return r.pick(o.acc);
  const n = noise(x * (o.fx ?? 0.006), y * (o.fy ?? 0.012), o.s || 0) * 0.85 + noise(x * 0.03, y * 0.05, (o.s || 0) + 9) * 0.15;
  return cols[Math.min(cols.length - 1, Math.floor(n * cols.length * 1.15 - cols.length * 0.07))] || cols[0];
}

// enlarge a set of strokes about a point
function grow(dabs, cx, cy, k) {
  for (const d of dabs) {
    for (let i = 0; i < d.pts.length; i += 2) { d.pts[i] = cx + (d.pts[i] - cx) * k; d.pts[i + 1] = cy + (d.pts[i + 1] - cy) * k; }
    d.x = cx + (d.x - cx) * k; d.y = cy + (d.y - cy) * k; d.L *= k;
  }
}
// a bundle of strokes, one path per color, with a lighter streak in the big ones
function bundle(dabs) {
  const by = new Map();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const d of dabs) {
    if (!by.has(d.col)) by.set(d.col, { pts: [], streaks: [] });
    const e = by.get(d.col);
    e.pts.push(d.pts);
    if (d.L > 26) {
      const ca = Math.cos(d.a), sa = Math.sin(d.a), off = (d.pts[5] - d.x) * 0.0; // a streak a little off the spine
      const nx = -sa * 2.2, ny = ca * 2.2;
      e.streaks.push([d.x - ca * d.L * 0.32 + nx + off, d.y - sa * d.L * 0.32 + ny, d.x + ca * d.L * 0.36 + nx, d.y + sa * d.L * 0.36 + ny]);
    }
    for (let i = 0; i < d.pts.length; i += 2) { x0 = Math.min(x0, d.pts[i]); x1 = Math.max(x1, d.pts[i]); y0 = Math.min(y0, d.pts[i + 1]); y1 = Math.max(y1, d.pts[i + 1]); }
  }
  const inks = [...by].map(([col, e]) => [col, e.pts, e.streaks, mix(col, '#ffffff', 0.32), mix(col, '#000000', 0.18)]);
  const box = { x: x0 - 6, y: y0 - 6, w: x1 - x0 + 12, h: y1 - y0 + 12 };
  const draw = (c) => {
    for (const [col, pts, streaks, light, dark] of inks) {
      c.fillStyle = col; c.beginPath();
      for (const q of pts) { c.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) c.lineTo(q[i], q[i + 1]); c.closePath(); }
      c.fill();
      if (streaks.length) {
        c.lineWidth = 1.7; c.lineCap = 'round';
        c.strokeStyle = light; c.beginPath();
        for (const s of streaks) { c.moveTo(s[0], s[1]); c.lineTo(s[2], s[3]); }
        c.stroke();
        c.strokeStyle = dark; c.lineWidth = 1.1; c.beginPath();
        for (const s of streaks) { c.moveTo(s[0], s[1] - 4.5); c.lineTo(s[2] - 3, s[3] - 4.5); }
        c.stroke();
      }
    }
  };
  return { box, draw };
}

// the marks are collected first and handed to the plate in order of time,
// so every layer bakes as it goes
class Queue {
  constructor() { this.q = []; }
  add(layer, m) { this.q.push([layer, m]); return m; }
  // dabs laid in n bundles, swept along an axis
  lay(layer, dabs, o) {
    if (!dabs.length) return;
    const key = o.key || ((d) => d.x);
    const sorted = dabs.slice().sort((a, b) => key(a) - key(b));
    const n = Math.max(1, Math.min(o.n || 1, sorted.length));
    for (let i = 0; i < n; i++) {
      const part = sorted.slice(Math.floor((i * sorted.length) / n), Math.floor(((i + 1) * sorted.length) / n));
      if (!part.length) continue;
      const { box, draw } = bundle(part);
      this.add(layer, { t: o.t + i * (o.gap ?? 0.12), d: o.d ?? 0.8, reveal: o.reveal || 'wipe', ease: o.ease || 'out', box, draw, dy: o.dy });
    }
  }
  flush(p) {
    this.q.forEach((e, i) => { e[2] = i; });
    this.q.sort((a, b) => a[1].t - b[1].t || a[2] - b[2]);
    for (const [layer, m] of this.q) p.mark(layer, m);
  }
}

// ================================================================ the scene
const HZ = 775; // the sea at the harbor mouth
const HILL = [[-20, 540], [60, 500], [150, 470], [250, 440], [340, 412], [470, 404], [560, 432], [640, 500], [720, 590], [800, 690], [870, 750], [930, 790], [-20, 790]];
const quayL = (x) => 805 + ((720 - x) / 720) * 290; // the left quay's edge on the water
const quayR = (x) => 802 + ((x - 1290) / 310) * 230;
const WATER = [[-20, quayL(-20)], [720, 805], [1290, 802], [1620, quayR(1620)], [1620, H + 20], [-20, H + 20]];

function build() {
  const p = new Plate({ paper: CANVAS, seed: 1906 });
  const r = p.r;
  p.stack('under', 'sky', 'land', 'town', 'water', 'refl', 'boats', 'rig', 'ink', 'live', 'title');
  const Q = new Queue();
  under(Q, r);
  sky(Q, r);
  hill(Q, r);
  basilica(Q, r);
  far(Q, r);
  fort(Q, r);
  quays(Q, r);
  water(Q, r);
  boats(Q, r);
  title(Q);
  Q.flush(p);
  life(p, r);
  return p;
}

// first the drawing: a few quick ultramarine lines laid on the canvas, then a
// thin wash of each region, so the canvas between the strokes is tinted
function under(Q, r) {
  const lines = [
    HILL.slice(0, 12),
    [[-20, quayL(-20)], [720, 805], [1290, 802], [1620, quayR(1620)]],
    [[-20, 450], [720, 700]], [[1620, 390], [1290, 690]],
    [[960, 740], [1150, 714], [1150, 552], [1238, 552], [1238, 712], [1300, 716]],
    [[400, 412], [400, 170], [460, 170], [460, 412]],
    ...BIG.map((b) => hullShape(b).concat([hullShape(b)[0]])),
  ];
  lines.forEach((ln, i) => {
    const pts = ln.map(([x, y]) => [x + r.range(-3, 3), y + r.range(-3, 3)]);
    let len = 0; for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    const b = bounds(pts);
    Q.add('under', {
      t: 0.1 + i * 0.12, d: 0.9, reveal: 'draw', ease: 'inOut', box: { x: b.x - 6, y: b.y - 6, w: b.w + 12, h: b.h + 12 },
      draw: (c, q) => {
        c.strokeStyle = 'rgba(43,63,176,.55)'; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
        if (q < 1) { c.setLineDash([len, len + 1]); c.lineDashOffset = len * (1 - q); }
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]); c.stroke();
      },
    });
  });
  const washes = [
    [[[0, 0], [W, 0], [W, HZ + 20], [0, HZ + 20]], '#f3d4b0', 1.0],
    [HILL, '#a8c79a', 1.3],
    [WATER, '#e3b48a', 1.6],
  ];
  for (const [shape, col, t] of washes) {
    const b = bounds(shape);
    Q.add('under', { t, d: 1.2, reveal: 'fade', box: { x: b.x - 4, y: b.y - 4, w: b.w + 8, h: b.h + 8 }, draw: (c) => { c.globalAlpha *= 0.4; c.fillStyle = col; poly(c, shape); c.fill(); } });
  }
}

function sky(Q, r) {
  const shape = [[-10, -10], [W + 10, -10], [W + 10, HZ + 6], [-10, HZ + 6]];
  const col = (x, y) => {
    const k = y / HZ;
    if (k < 0.3) return zone(r, x, y, [COBALT, CERUL, LILAC, CERUL], { s: 1, acc: [MINT, PINK], p: 0.08 });
    if (k < 0.62) return zone(r, x, y, [ROSE, LEMON, PINK, CERUL, LILAC], { s: 2, acc: [CREAM, YEL], p: 0.1 });
    return zone(r, x, y, [LEMON, YEL, ORANGE, MINT, ROSE], { s: 3, acc: [CREAM, PINK], p: 0.1 });
  };
  // swept on in long horizontal strokes, a little wavy
  const dabs = field(r, shape, { s: 58, sy: 0.44, L: 96, w: 30, ang: (x, y) => Math.sin(x * 0.004 + y * 0.01) * 0.2 - 0.06, aj: 0.1, col });
  // bands from the top down, each wiped from left to right
  const bands = 10;
  for (let i = 0; i < bands; i++) {
    const y0 = (i * (HZ + 10)) / bands, y1 = ((i + 1) * (HZ + 10)) / bands;
    Q.lay('sky', dabs.filter((d) => d.y >= y0 && d.y < y1), { t: 0.6 + i * 0.32, d: 0.8, n: 3, gap: 0.2, reveal: 'wipe' });
  }
}

function hill(Q, r) {
  const col = (x, y) => (y < 470 ? zone(r, x, y, [ORANGE, PINK, YEL], { s: 21, acc: [EMER], p: 0.1 })
    : zone(r, x, y, [EMER, VIRID, ORANGE, EMER, VIOLET], { s: 22, fx: 0.008, fy: 0.01, acc: [MINT, YEL], p: 0.1 }));
  const dabs = field(r, HILL, { s: 38, sy: 0.58, L: 60, w: 21, ang: (x, y) => (x < 470 ? -0.45 : 0.6), aj: 0.25, col });
  Q.lay('land', dabs, { t: 2.5, d: 0.8, n: 6, gap: 0.18, key: (d) => -d.y + d.x * 0.2, reveal: 'rise' });
  // the ridge in violet and blue, broken
  Q.lay('ink', along(r, HILL.slice(0, 12), { L: 38, w: 8, col: (x) => (x > 600 ? VIOLET : ULTRA), gaps: 0.18 }), { t: 4.0, d: 1.4, n: 2, gap: 0.6, reveal: 'wipe' });
  // pines on the slope: dark green cones in clumps
  const pines = [];
  for (let i = 0; i < 26; i++) {
    const x = r.range(40, 860), y = r.range(520, 760);
    const top = HILL.reduce((m, [hx, hy], k) => (k && HILL[k - 1][0] <= x && hx >= x ? HILL[k - 1][1] + ((x - HILL[k - 1][0]) / (hx - HILL[k - 1][0])) * (hy - HILL[k - 1][1]) : m), 0);
    if (y < top + 30) continue;
    const s = r.range(0.8, 1.3);
    pines.push(...field(r, [[x, y - 40 * s], [x + 18 * s, y], [x - 18 * s, y]], { s: 9, sy: 0.7, L: 16, w: 7, ang: () => -1.2, aj: 0.4, col: () => pick(r, [[VIRID, 3], [PRUSS, 1], [EMER, 1]]) }));
  }
  Q.lay('land', pines, { t: 3.7, d: 0.7, n: 3, gap: 0.2, reveal: 'rise' });
}

// Notre-Dame de la Garde: the belfry tower on its terrace, the nave and its
// dome behind, in banded white and green stone, the gilded statue on top
function basilica(Q, r) {
  const X = 430, B = 412; // the foot of the tower
  const parts = [];
  // the terraces and the rock
  const rock = [[300, B + 26], [560, B + 26], [580, B + 60], [280, B + 62]];
  parts.push(...field(r, rock, { s: 12, sy: 0.6, L: 20, w: 9, ang: () => 0, aj: 0.3, col: () => pick(r, [[OCHRE, 2], [PINK, 2], [ORANGE, 1]]) }));
  const terrace = [[310, B - 6], [552, B - 6], [552, B + 28], [310, B + 28]];
  parts.push(...field(r, terrace, { s: 13, sy: 0.6, L: 20, w: 8, ang: () => 0, aj: 0.1, col: (x, y) => (Math.floor((y - B) / 9) % 2 ? CREAM : MINT) }));
  // the nave to the right of the tower, its dome
  const nave = [[466, B - 6], [548, B - 6], [548, B - 70], [466, B - 70]];
  parts.push(...field(r, nave, { s: 12, sy: 0.6, L: 18, w: 8, ang: () => 0, aj: 0.1, col: (x, y) => (Math.floor((y - B) / 10) % 2 ? LEMON : CREAM) }));
  const dome = []; for (let k = 0; k <= 12; k++) { const a = Math.PI + (k / 12) * Math.PI; dome.push([507 + Math.cos(a) * 32, B - 70 + Math.sin(a) * 34]); }
  parts.push(...field(r, dome, { s: 9, sy: 0.6, L: 14, w: 7, ang: (x) => (x < 507 ? -0.9 : 0.9), aj: 0.2, col: () => pick(r, [[ORANGE, 2], [YEL, 2], [VERM, 1]]) }));
  // the tower: square, banded, the belfry stage, then the pedestal
  const tw = 30;
  const tower = [[X - tw, B], [X + tw, B], [X + tw, B - 150], [X - tw, B - 150]];
  parts.push(...field(r, tower, { s: 10, sy: 0.6, L: 15, w: 7, ang: () => 0, aj: 0.06, col: (x, y) => (Math.floor((B - y) / 11) % 2 ? CREAM : (x > X ? EMER : MINT)) }));
  const belfry = [[X - tw + 4, B - 150], [X + tw - 4, B - 150], [X + tw - 4, B - 218], [X - tw + 4, B - 218]];
  parts.push(...field(r, belfry, { s: 9, sy: 0.6, L: 13, w: 7, ang: () => 0, aj: 0.06, col: (x) => (x > X ? PINK : CREAM) }));
  const ped = [[X - 18, B - 218], [X + 18, B - 218], [X + 12, B - 246], [X - 12, B - 246]];
  parts.push(...field(r, ped, { s: 8, sy: 0.6, L: 11, w: 6, ang: () => 0, aj: 0.1, col: () => pick(r, [[LEMON, 1], [CREAM, 1]]) }));

  // openings, outlines and the gold, in one go
  const ink = [];
  for (const dx of [-12, 12]) ink.push(...along(r, [[X + dx, B - 160], [X + dx, B - 206]], { L: 14, w: 7, col: ULTRA }));
  for (const yy of [B - 40, B - 85, B - 125]) ink.push(...along(r, [[X - 8, yy], [X - 8, yy - 20]], { L: 10, w: 6, col: VIOLET }), ...along(r, [[X + 8, yy], [X + 8, yy - 20]], { L: 10, w: 6, col: VIOLET }));
  for (const xx of [480, 500, 520, 538]) ink.push(...along(r, [[xx, B - 22], [xx, B - 44]], { L: 10, w: 5, col: ULTRA }));
  ink.push(...along(r, [[X - tw, B], [X - tw, B - 150], [X - tw + 4, B - 218], [X + tw - 4, B - 218], [X + tw, B - 150], [X + tw, B]], { L: 18, w: 5, col: ULTRA, gaps: 0.12 }));
  ink.push(...along(r, [[X - tw - 4, B - 150], [X + tw + 4, B - 150]], { L: 16, w: 6, col: VERM }));
  ink.push(...along(r, [[310, B - 6], [552, B - 6]], { L: 24, w: 6, col: VIOLET, gaps: 0.1 }));
  // the statue: a gilded upright form with a glow of yellow strokes
  const gold = [];
  gold.push({ x: X, y: B - 268, col: '#f2b51c', pts: leaf(r, X, B - 268, -Math.PI / 2, 46, 13), a: -Math.PI / 2, L: 20 });
  gold.push({ x: X, y: B - 292, col: '#f2b51c', pts: leaf(r, X, B - 292, -Math.PI / 2, 12, 10), a: -Math.PI / 2, L: 10 });
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k - 4) * 0.36, rr = 44;
    gold.push({ x: X + Math.cos(a) * rr, y: B - 272 + Math.sin(a) * rr, col: k % 2 ? LEMON : YEL, pts: leaf(r, X + Math.cos(a) * rr, B - 272 + Math.sin(a) * rr, a, 22, 6), a, L: 20 });
  }
  grow(parts, X, B + 20, 1.32); grow(ink, X, B + 20, 1.32); grow(gold, X, B + 20, 1.32);
  Q.lay('land', parts, { t: 4.0, d: 0.9, n: 4, gap: 0.22, key: (d) => -d.y, reveal: 'rise' });
  Q.lay('ink', ink, { t: 6.2, d: 0.8, n: 2, gap: 0.3, key: (d) => -d.y, reveal: 'fade' });
  Q.lay('ink', gold, { t: 7.2, d: 0.9, n: 1, reveal: 'pop' });
}

// the open sea at the mouth, the Frioul and the Château d'If
function far(Q, r) {
  const sea = [[700, HZ - 14], [1100, HZ - 14], [1100, 806], [700, 806]];
  Q.lay('land', field(r, sea, { s: 22, sy: 0.4, L: 36, w: 9, ang: () => 0, aj: 0.04, col: () => pick(r, [[COBALT, 3], [ULTRA, 2], [CERUL, 2], [VIOLET, 1]]) }), { t: 3.4, d: 0.8, n: 1 });
  const isle = [[810, HZ + 2], [826, HZ - 8], [846, HZ - 14], [880, HZ - 12], [900, HZ + 2]];
  const fortIf = [[836, HZ - 14], [876, HZ - 14], [876, HZ - 34], [866, HZ - 34], [866, HZ - 44], [852, HZ - 44], [852, HZ - 34], [836, HZ - 34]];
  const d = [
    ...field(r, isle, { s: 7, sy: 0.6, L: 12, w: 6, ang: () => 0, aj: 0.2, col: () => pick(r, [[OCHRE, 1], [PINK, 1]]) }),
    ...field(r, fortIf, { s: 6, sy: 0.6, L: 10, w: 5, ang: () => 0, aj: 0.1, col: (x) => (x > 860 ? LILAC : CREAM) }),
    ...along(r, [[836, HZ - 14], [836, HZ - 34], [876, HZ - 34], [876, HZ - 14]], { L: 8, w: 3, col: ULTRA }),
  ];
  Q.lay('land', d, { t: 4.2, d: 0.6, n: 1, reveal: 'pop' });
}

// Fort Saint-Jean: the long walls, the square Tour du Roi René with its
// machicolations, the round Tour du Fanal with its lantern turret
function fort(Q, r) {
  const base = 802;
  const parts = [];
  const rocks = [[960, base + 4], [1300, base + 4], [1300, base - 20], [960, base - 14]];
  parts.push(...field(r, rocks, { s: 12, sy: 0.6, L: 20, w: 9, ang: () => 0.1, aj: 0.3, col: () => pick(r, [[VIOLET, 1], [ORANGE, 1.4], [PINK, 1]]) }));
  const walls = [[960, base - 14], [1300, base - 20], [1300, base - 86], [1240, base - 92], [1060, base - 84], [960, base - 62]];
  parts.push(...field(r, walls, { s: 13, sy: 0.55, L: 22, w: 9, ang: () => 0, aj: 0.08, col: (x, y) => (y > base - 40 ? pick(r, [[ORANGE, 2], [OCHRE, 2], [VERM, 0.6]]) : pick(r, [[YEL, 2], [ORANGE, 1], [CREAM, 1]])) }));
  // the round tower
  const fanal = [[1000, base - 60], [1046, base - 62], [1046, base - 152], [1000, base - 152]];
  parts.push(...field(r, fanal, { s: 9, sy: 0.6, L: 15, w: 8, ang: () => -Math.PI / 2, aj: 0.1, col: (x) => (x < 1012 ? CREAM : x < 1032 ? YEL : ORANGE) }));
  const lant = [[1010, base - 152], [1036, base - 152], [1036, base - 178], [1010, base - 178]];
  parts.push(...field(r, lant, { s: 7, sy: 0.6, L: 11, w: 6, ang: () => -Math.PI / 2, aj: 0.1, col: () => pick(r, [[YEL, 1], [CREAM, 1]]) }));
  // the square tower, lit on its left face
  const king = [[1150, base - 88], [1238, base - 92], [1238, base - 250], [1150, base - 250]];
  parts.push(...field(r, king, { s: 11, sy: 0.55, L: 18, w: 9, ang: () => -Math.PI / 2, aj: 0.1, col: (x) => (x < 1200 ? pick(r, [[LEMON, 2], [YEL, 2], [CREAM, 1]]) : pick(r, [[ORANGE, 2], [PINK, 1.5], [VERM, 0.6]])) }));
  const crown = [[1142, base - 250], [1246, base - 250], [1246, base - 272], [1142, base - 272]];
  parts.push(...field(r, crown, { s: 9, sy: 0.6, L: 14, w: 7, ang: () => 0, aj: 0.1, col: () => pick(r, [[YEL, 1], [ORANGE, 1]]) }));
  Q.lay('town', parts, { t: 4.6, d: 0.8, n: 4, gap: 0.2, key: (d) => -d.y, reveal: 'rise' });

  const ink = [
    ...along(r, [[1150, base - 88], [1150, base - 250], [1142, base - 250], [1142, base - 272], [1246, base - 272], [1246, base - 250], [1238, base - 250], [1238, base - 92]], { L: 18, w: 5, col: ULTRA, gaps: 0.1 }),
    ...along(r, [[1000, base - 60], [1000, base - 152], [1046, base - 152], [1046, base - 62]], { L: 16, w: 5, col: ULTRA, gaps: 0.1 }),
    ...along(r, [[960, base - 62], [1060, base - 84], [1240, base - 92], [1300, base - 86]], { L: 20, w: 5, col: VIOLET, gaps: 0.15 }),
  ];
  // battlements, loopholes, the lantern's windows
  for (let x = 1146; x < 1244; x += 16) ink.push(...along(r, [[x, base - 274], [x, base - 284]], { L: 10, w: 7, col: x < 1200 ? YEL : ORANGE }));
  for (let x = 970; x < 1290; x += 26) ink.push(...along(r, [[x, base - 66 - (x - 960) * 0.07], [x, base - 76 - (x - 960) * 0.07]], { L: 9, w: 6, col: x % 52 < 26 ? ORANGE : YEL }));
  for (const [x, y] of [[1172, base - 150], [1214, base - 150], [1172, base - 210], [1214, base - 210], [1194, base - 120]]) ink.push(...along(r, [[x, y], [x, y - 16]], { L: 10, w: 5, col: PRUSS }));
  ink.push(...along(r, [[1016, base - 162], [1016, base - 172]], { L: 8, w: 4, col: VERM }), ...along(r, [[1030, base - 162], [1030, base - 172]], { L: 8, w: 4, col: VERM }));
  Q.lay('ink', ink, { t: 6.6, d: 0.8, n: 2, gap: 0.3, reveal: 'fade' });
}

// the quays: rows of tall houses on either side, foreshortened toward the mouth
function quays(Q, r) {
  const wall = [[ROSE, PINK], [LEMON, YEL], [CREAM, LEMON], [ORANGE, OCHRE], [PINK, CRIMSON], [MINT, EMER], [YEL, ORANGE]];
  const shut = [EMER, ULTRA, VIRID, COBALT, VERM];
  const make = (side, xs, base, top) => {
    const out = { body: [], win: [], roof: [], edge: [] };
    for (let i = 0; i < xs.length - 1; i++) {
      const xa = xs[i], xb = xs[i + 1];
      const lift = r.range(-26, 20);
      const ya = base(xa), yb = base(xb), ta = top(xa) + lift, tb = top(xb) + lift;
      const shape = [[xa, ya], [xb, yb], [xb, tb], [xa, ta]];
      const [c1, c2] = wall[(i * 3 + (side > 0 ? 2 : 0)) % wall.length];
      const w = Math.abs(xb - xa), h = ya - ta;
      const s = Math.max(9, Math.min(17, w / 4));
      out.body.push(...field(r, shape, { s, sy: 0.6, L: s * 1.7, w: s * 0.7, ang: () => -Math.PI / 2, aj: 0.1, col: () => pick(r, [[c1, 3], [c2, 1.4], [CREAM, 0.5]]) }));
      // the roof edge: a run of orange-red strokes along the top
      // the joint between this house and the next, a violet stroke
      out.edge.push(...along(r, [[xa, ya], [xa, ta]], { L: 26, w: Math.max(4, s * 0.38), col: () => pick(r, [[VIOLET, 2], [ULTRA, 1]]), gaps: 0.15 }));
      out.roof.push(...along(r, [[xa, ta], [xb, tb]], { L: Math.max(10, s * 1.6), w: Math.max(5, s * 0.6), col: () => pick(r, [[VERM, 2], [ORANGE, 2], [CRIMSON, 1]]) }));
      // windows with shutters, in rows and columns
      const cols = Math.max(1, Math.round(w / Math.max(20, s * 3.2)));
      const rows = Math.max(2, Math.round(h / Math.max(24, s * 3.6)));
      const sc = shut[(i + (side > 0 ? 1 : 3)) % shut.length];
      for (let rr = 0; rr < rows; rr++) {
        for (let k = 0; k < cols; k++) {
          const u = (k + 0.5) / cols, v = (rr + 0.62) / (rows + 0.2);
          const x = xa + (xb - xa) * u, yb0 = ya + (yb - ya) * u, yt0 = ta + (tb - ta) * u;
          const y = yb0 - (yb0 - yt0) * v;
          const wh = (yb0 - yt0) / (rows + 0.2) * 0.5, ww = Math.max(3, (w / cols) * 0.18);
          if (r() < 0.1) continue;
          // the window dark, its two shutters open beside it (or closed over it)
          if (r() < 0.3) out.win.push(...along(r, [[x, y + wh / 2], [x, y - wh / 2]], { L: wh * 1.1, w: ww * 2.2, col: sc, j: 0.5 }));
          else {
            out.win.push(...along(r, [[x, y + wh / 2], [x, y - wh / 2]], { L: wh * 1.1, w: ww * 1.5, col: pick(r, [[PRUSS, 2], [VIOLET, 1]]), j: 0.4 }));
            for (const sx of [-1, 1]) out.win.push(...along(r, [[x + sx * ww * 1.5, y + wh / 2], [x + sx * ww * 1.5, y - wh / 2]], { L: wh * 1.1, w: ww * 0.9, col: sc, j: 0.3 }));
          }
        }
      }
    }
    return out;
  };
  // the left quay (Rive Neuve): near houses on the left, tall
  const L = make(-1, [-20, 70, 170, 270, 360, 440, 510, 570, 625, 675, 720], quayL, (x) => 700 - ((720 - x) / 720) * 250);
  // the right quay, toward the town hall and the Panier above
  const R = make(1, [1290, 1340, 1395, 1455, 1525, 1620], quayR, (x) => 690 - ((x - 1290) / 330) * 300);
  // the Panier climbing behind the right quay: little cubes of color
  const pan = [];
  for (let i = 0; i < 34; i++) {
    const x = r.range(1300, 1610), y = r.range(590, 690) - (x - 1290) * 0.55;
    const w = r.range(18, 34), h = r.range(14, 26);
    const [c1] = wall[i % wall.length];
    pan.push(...field(r, [[x, y], [x + w, y], [x + w, y - h], [x, y - h]], { s: 8, sy: 0.6, L: 13, w: 6, ang: () => 0, aj: 0.2, col: () => pick(r, [[c1, 2], [ORANGE, 0.6]]) }));
  }
  Q.lay('town', pan, { t: 5.0, d: 0.8, n: 2, gap: 0.3, key: (d) => d.y, reveal: 'rise' });
  Q.lay('town', L.body, { t: 5.3, d: 0.7, n: 6, gap: 0.16, key: (d) => -d.x, reveal: 'rise' });
  Q.lay('town', R.body, { t: 5.5, d: 0.7, n: 4, gap: 0.18, key: (d) => d.x, reveal: 'rise' });
  Q.lay('town', [...L.edge, ...R.edge, ...L.roof, ...R.roof], { t: 6.6, d: 0.9, n: 2, gap: 0.2, reveal: 'wipe' });
  Q.lay('town', [...L.win, ...R.win], { t: 7.0, d: 0.9, n: 3, gap: 0.25, key: (d) => Math.abs(d.x - 1000), reveal: 'fade' });
  // the quay stones: a pale ledge along the water
  const ledge = [
    ...along(r, [[-20, quayL(-20)], [720, 805]], { L: 30, w: 12, col: () => pick(r, [[CREAM, 2], [LILAC, 1], [ROSE, 1]]) }),
    ...along(r, [[1290, 802], [1620, quayR(1620)]], { L: 30, w: 12, col: () => pick(r, [[CREAM, 2], [LILAC, 1], [LEMON, 1]]) }),
  ];
  Q.lay('town', ledge, { t: 7.4, d: 0.8, n: 1, reveal: 'wipe' });
}

// the water: not blue but green, orange and red, in flat horizontal strokes
// that grow as they come near; the reflections of the houses fall in it
function water(Q, r) {
  // a column of orange light down the middle from the mouth, green to the sides
  const col = (x, y) => {
    const k = (y - 800) / (H - 800), mid = Math.abs(x - 900 + k * 120) / (260 + k * 380);
    if (mid < 0.55 + noise(x * 0.01, y * 0.02, 5) * 0.4) return zone(r, x, y, [YEL, ORANGE, VERM, ORANGE, LEMON], { s: 11, fx: 0.012, fy: 0.03, acc: [PINK, CREAM], p: 0.08 });
    if (k < 0.25) return zone(r, x, y, [MINT, EMER, COBALT, EMER], { s: 12, fx: 0.008, fy: 0.03, acc: [ORANGE, LEMON], p: 0.08 });
    return zone(r, x, y, [VIRID, EMER, ULTRA, VIRID, VIOLET], { s: 13, fx: 0.006, fy: 0.02, acc: [ORANGE, VERM, MINT], p: 0.1 });
  };
  const near = (y) => 0.55 + ((y - 800) / (H - 800)) * 0.9;
  const dabs = [];
  for (const [y0, y1, s] of [[795, 1000, 34], [1000, 1350, 48], [1350, H + 10, 64]]) {
    const band = WATER.length && [[-20, y0], [W + 20, y0], [W + 20, y1], [-20, y1]];
    dabs.push(...field(r, band, { s, sy: 0.4, L: s * 1.75, w: s * 0.46, ang: () => 0, aj: 0.05, col, keep: (x, y) => pip(WATER, x, y) }));
  }
  for (const d of dabs) { const k = near(d.y); d.k = k; }
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    const y0 = 790 + (i * (H - 780)) / bands, y1 = 790 + ((i + 1) * (H - 780)) / bands;
    Q.lay('water', dabs.filter((d) => d.y >= y0 && d.y < y1), { t: 3.6 + i * 0.36, d: 0.65, n: 4, gap: 0.14, reveal: 'wipe' });
  }
  // reflections: broken vertical strokes under the houses, the fort and the hill
  const refl = [];
  const src = [
    [0, 720, quayL, [PINK, LEMON, ORANGE, CREAM, MINT], 160],
    [960, 1300, () => 806, [YEL, ORANGE, LEMON], 110],
    [1290, 1610, quayR, [ROSE, YEL, MINT, PINK], 150],
  ];
  for (const [x0, x1, base, cols, len] of src) {
    for (let x = x0; x < x1; x += r.range(12, 22)) {
      const y = base(x) + 6, n = r.int(2, 5);
      for (let k = 0; k < n; k++) {
        const yy = y + k * len / n + r.range(0, 10), L = r.range(12, 22);
        refl.push({ x, y: yy, col: r.pick(cols), pts: leaf(r, x + r.range(-4, 4), yy, Math.PI / 2 + r.range(-0.1, 0.1), L, 7), a: Math.PI / 2, L });
      }
    }
  }
  // and the Tour du Roi René's long yellow column on the water
  for (let k = 0; k < 9; k++) { const yy = 820 + k * 26, L = 22; refl.push({ x: 1194, y: yy, col: k % 2 ? YEL : LEMON, pts: leaf(r, 1194 + r.range(-12, 12), yy, Math.PI / 2, L, 14 - k), a: Math.PI / 2, L }); }
  Q.lay('refl', refl, { t: 7.6, d: 0.9, n: 3, gap: 0.2, key: (d) => d.y, reveal: 'fall' });
}

// the fishing boats: pointus with high stems, lateen yards and furled sails.
// Small ones moored in rows far off, five big ones in front
const BIG = [
  { x0: 860, x1: 1180, y: 1120, h: 70, hull: YEL, band: ULTRA, stripe: VERM, mast: 0.6, yard: 1 },
  { x0: 180, x1: 560, y: 1230, h: 84, hull: EMER, band: VERM, stripe: YEL, mast: 0.45, yard: -1 },
  { x0: 1040, x1: 1580, y: 1470, h: 116, hull: VERM, band: EMER, stripe: LEMON, mast: 0.55, yard: -1 },
  { x0: 470, x1: 1040, y: 1680, h: 128, hull: COBALT, band: ORANGE, stripe: LEMON, mast: 0.5, yard: 1 },
  { x0: -80, x1: 600, y: 1930, h: 150, hull: ORANGE, band: VIRID, stripe: VERM, mast: 0.62, yard: 1 },
];
function hullShape(b) {
  const { x0, x1, y, h } = b, L = x1 - x0;
  // stern on the left, bow on the right; both posts rise
  return [
    [x0 - L * 0.02, y - h * 1.02], [x0 + L * 0.1, y - h * 0.82], [x0 + L * 0.5, y - h * 0.7], [x0 + L * 0.85, y - h * 0.82], [x1 + L * 0.02, y - h * 1.12],
    [x1 - L * 0.03, y - h * 0.6], [x1 - L * 0.1, y - h * 0.1], [x0 + L * 0.55, y + h * 0.08], [x0 + L * 0.15, y - h * 0.04], [x0 + L * 0.02, y - h * 0.5],
  ];
}
function boats(Q, r) {
  // the forest of masts far off, and their little hulls
  const small = [], masts = [];
  for (let i = 0; i < 34; i++) {
    const side = i % 2 ? -1 : 1;
    const y = r.range(840, 1040);
    const x = side < 0 ? r.range(80, 640) + (y - 840) * -1.2 : r.range(1060, 1580) + (y - 840) * 0.9;
    if (x < 10 || x > 1590) continue;
    const s = 0.35 + (y - 820) / 400;
    const L = r.range(50, 80) * s, h = 13 * s;
    small.push(...field(r, [[x, y - h], [x + L, y - h * 1.2], [x + L * 0.9, y], [x + L * 0.1, y]], { s: 7, sy: 0.6, L: 12 * s + 4, w: 6 * s + 2, ang: () => 0, aj: 0.1, col: () => r.pick([VERM, YEL, ULTRA, CREAM, EMER, PINK]) }));
    const mh = r.range(110, 190) * s;
    masts.push(...along(r, [[x + L * 0.5, y - h], [x + L * 0.5 + r.range(-6, 6), y - h - mh]], { L: 22, w: 3.4 * s + 1, col: () => pick(r, [[PRUSS, 2], [VERM, 1], [VIOLET, 1]]), j: 0.4 }));
  }
  Q.lay('boats', small, { t: 7.2, d: 0.8, n: 2, gap: 0.2, key: (d) => d.y, reveal: 'pop' });
  Q.lay('rig', masts, { t: 7.6, d: 0.9, n: 2, gap: 0.2, key: (d) => d.y, reveal: 'rise' });

  BIG.forEach((b, i) => {
    const t = 8.0 + i * 0.38;
    const sh = hullShape(b), L = b.x1 - b.x0;
    // its reflection: the hull's colors broken and stretched downward
    const rf = [];
    for (let x = b.x0 + 20; x < b.x1 - 10; x += r.range(14, 30) * (b.h / 80)) {
      const n = r.int(1, 4);
      for (let k = 0; k < n; k++) {
        if (r() < 0.25) continue;
        const yy = b.y + 14 + k * b.h * 0.36 + r.range(0, b.h * 0.2), LL = r.range(18, 40) * (b.h / 80);
        rf.push({ x, y: yy, col: k === 0 && r() < 0.5 ? b.band : r.chance(0.8) ? b.hull : b.stripe, pts: leaf(r, x + r.range(-10, 10) + Math.sin(yy * 0.08) * 8, yy, Math.PI / 2 + r.range(-0.2, 0.2), LL, r.range(8, 13) * (b.h / 80)), a: Math.PI / 2, L: LL });
      }
    }
    Q.lay('refl', rf, { t, d: 0.8, n: 1, reveal: 'fall' });
    // the hull, in strokes along its length; the band at the gunwale; a stripe
    const s = Math.max(10, b.h / 4.4);
    const body = field(r, sh, { s, sy: 0.55, L: s * 2.4, w: s * 0.8, ang: (x, y) => (y > b.y - b.h * 0.3 ? 0.03 : -0.02), aj: 0.05, col: (x, y) => (y < b.y - b.h * 0.6 ? b.band : y > b.y - b.h * 0.18 ? mix(b.hull, '#1c2a6e', 0.25) : b.hull) });
    const stripe = along(r, [[b.x0 + L * 0.06, b.y - b.h * 0.42], [b.x0 + L * 0.5, b.y - b.h * 0.34], [b.x1 - L * 0.07, b.y - b.h * 0.42]], { L: s * 2, w: s * 0.6, col: b.stripe });
    Q.lay('boats', [...body, ...stripe], { t, d: 0.9, n: 1, reveal: 'rise' });
    // the outline, a heavy ultramarine contour
    const outline = along(r, [...sh, sh[0]], { L: s * 1.6, w: Math.max(5, s * 0.42), col: () => pick(r, [[PRUSS, 3], [ULTRA, 2], [VIOLET, 1]]), gaps: 0.06 });
    Q.lay('ink', outline, { t: t + 0.45, d: 0.9, n: 1, reveal: 'wipe' });
    // mast, yard and the furled sail
    const mx = b.x0 + L * b.mast, my = b.y - b.h * 0.72;
    const mh = L * 0.85;
    const top = [mx + b.yard * 14, my - mh];
    const rig = [...along(r, [[mx, my], top], { L: 30, w: Math.max(6, b.h * 0.09), col: () => pick(r, [[PRUSS, 2], [OCHRE, 1], [VERM, 1]]), j: 0.3 })];
    const ya = [mx - b.yard * L * 0.3, my - mh * 0.34], yb = [mx + b.yard * L * 0.24, my - mh * 0.98];
    const sail = along(r, [ya, [mx, my - mh * 0.62], yb], { L: 60, w: Math.max(14, b.h * 0.24), col: () => pick(r, [[CREAM, 3], [ROSE, 1.4]]), j: 1.2 });
    const yard = along(r, [ya, yb], { L: 30, w: Math.max(3, b.h * 0.06), col: PRUSS, j: 0.2 });
    Q.lay('rig', rig, { t: t + 0.5, d: 0.8, n: 1, reveal: 'rise' });
    Q.lay('rig', [...sail, ...yard], { t: t + 0.85, d: 0.9, n: 1, reveal: b.yard > 0 ? 'wipe' : 'wipeL' });
    // a figure in the near boats, and coiled rope, nets
    if (b.h > 70) {
      const fx = b.x0 + L * (b.mast > 0.5 ? 0.25 : 0.75), fy = b.y - b.h * 0.72;
      const fig = [
        { x: fx, y: fy - 30, col: CRIMSON, pts: leaf(r, fx, fy - 26, -Math.PI / 2, b.h * 0.6, b.h * 0.3), a: 0, L: 10 },
        { x: fx, y: fy - 60, col: '#c98a5a', pts: leaf(r, fx, fy - b.h * 0.62, -Math.PI / 2, b.h * 0.2, b.h * 0.17), a: 0, L: 10 },
        { x: fx, y: fy - 66, col: PRUSS, pts: leaf(r, fx, fy - b.h * 0.7, 0, b.h * 0.3, b.h * 0.08), a: 0, L: 10 },
        ...field(r, [[fx + 30, fy], [fx + 90, fy - 4], [fx + 84, fy - 22], [fx + 36, fy - 18]], { s: 8, sy: 0.6, L: 14, w: 5, ang: () => 0.4, aj: 0.8, col: () => pick(r, [[OCHRE, 1], [VERM, 1]]) }),
      ];
      Q.lay('rig', fig, { t: t + 1.2, d: 0.7, n: 1, reveal: 'pop' });
    }
  });
}

function title(Q) {
  const FONT = '400 270px "Caveat Brush"';
  // brushed on in one sweep: a shadow of ultramarine, then vermilion over it
  Q.add('title', {
    t: 10.6, d: 1.8, reveal: 'wipe', ease: 'inOut', box: { x: 620, y: 120, w: 960, h: 300 },
    draw: (c) => {
      c.font = FONT; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
      c.fillStyle = PRUSS; c.fillText('Marseille', 1532, 346);
      c.fillStyle = VERM; c.fillText('Marseille', 1522, 336);
    },
  });
  // a swash under it
  Q.add('title', {
    t: 12.0, d: 0.8, reveal: 'wipe', ease: 'inOut', box: { x: 760, y: 350, w: 800, h: 50 },
    draw: (c) => {
      c.strokeStyle = ULTRA; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(780, 382); c.bezierCurveTo(1000, 360, 1300, 372, 1530, 360); c.stroke();
    },
  });
  Q.add('title', {
    t: 12.4, d: 0.9, reveal: 'wipe', box: { x: 1000, y: 380, w: 560, h: 90 },
    draw: (c) => { c.font = '400 64px "Caveat Brush"'; c.textAlign = 'right'; c.fillStyle = PRUSS; c.fillText('le Vieux-Port, 1906', 1528, 448); },
  });
}

// ================================================================ what moves
function life(p, r) {
  // glints of light on the water: yellow and white strokes that come and go
  const glints = [];
  for (let i = 0; i < 46; i++) {
    const y = r.range(830, 1950), x = r.range(0, W);
    if (!pip(WATER, x, y)) continue;
    const s = 0.5 + (y - 800) / 900;
    glints.push({ pts: leaf(r, x, y, 0, r.range(22, 40) * s, 7 * s), col: r.pick([LEMON, CREAM, YEL]), ph: r() * 7, sp: r.range(0.8, 1.8) });
  }
  p.live('live', {
    t: 9.4, d: 1, reveal: 'fade', box: { x: 0, y: 800, w: W, h: H - 800 },
    draw: (c, time) => {
      for (const g of glints) {
        const a = 0.5 + 0.5 * Math.sin(time * g.sp + g.ph);
        if (a < 0.15) continue;
        c.globalAlpha = a; c.fillStyle = g.col;
        const q = g.pts; c.beginPath(); c.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) c.lineTo(q[i], q[i + 1]); c.closePath(); c.fill();
      }
      c.globalAlpha = 1;
    },
  });
  // a red pennant on the Tour du Roi René
  p.live('live', {
    t: 9.8, d: 0.8, reveal: 'fade', box: { x: 1180, y: 450, w: 120, h: 90 },
    draw: (c, time) => {
      const x = 1196, y = 530;
      c.strokeStyle = PRUSS; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 62); c.stroke();
      c.fillStyle = VERM; c.beginPath(); c.moveTo(x, y - 62);
      for (let k = 0; k <= 8; k++) { const u = k / 8; c.lineTo(x + u * 70, y - 62 + u * 12 + Math.sin(time * 5 - u * 5) * 6 * u); }
      for (let k = 8; k >= 0; k--) { const u = k / 8; c.lineTo(x + u * 70, y - 34 - u * 12 + Math.sin(time * 5 - u * 5) * 6 * u); }
      c.closePath(); c.fill();
    },
  });
  // gulls: white strokes with a blue edge, wheeling over the harbor
  const gulls = [];
  for (let i = 0; i < 8; i++) gulls.push({ cx: r.range(250, 1350), cy: r.range(470, 760), R: r.range(40, 130), w: r.range(0.25, 0.5) * (r.chance(0.5) ? 1 : -1), ph: r() * 7, s: r.range(0.8, 1.5) });
  p.live('live', {
    t: 10.0, d: 1, reveal: 'fade', box: { x: 0, y: 300, w: W, h: 600 },
    draw: (c, time) => {
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const g of gulls) {
        const a = time * g.w + g.ph, x = g.cx + Math.cos(a) * g.R, y = g.cy + Math.sin(a) * g.R * 0.4;
        const f = Math.sin(time * 6 + g.ph) * 5 * g.s, w = 16 * g.s;
        c.beginPath(); c.moveTo(x - w, y - 2 - f); c.quadraticCurveTo(x - w * 0.4, y - 8 * g.s - f * 0.5, x, y); c.quadraticCurveTo(x + w * 0.4, y - 8 * g.s - f * 0.5, x + w, y - 2 - f);
        c.strokeStyle = PRUSS; c.lineWidth = 6 * g.s; c.stroke();
        c.strokeStyle = '#ffffff'; c.lineWidth = 3.2 * g.s; c.stroke();
      }
    },
  });
}

