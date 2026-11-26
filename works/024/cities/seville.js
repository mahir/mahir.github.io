// Seville: a feria poster in flat gouache. A lobed horseshoe arch after the Real
// Alcázar's, its voussoirs striped red and cream, set in an albero-yellow wall
// with painted vines and a tiled dado, frames the Plaza de España: the curve of
// the brick building with its arcades, its two tall towers, the tiled benches,
// the canal and its bridge, with the Giralda far off. Feria lanterns hang across
// the view, orange trees stand either side, and below, the name over the red,
// white-spotted flounces of a flamenco dress, a black shawl and its silk fringe.
// The whole sheet sits in a border of painted Triana tiles.

import { Plate, W, H } from '../print.js';
import { poly, rng } from '../kit.js';

// albero and almagra: the yellow and red of Seville's walls
const ALBERO = '#e7ad3c', ALBERO_D = '#c98d24', ALBERO_L = '#f2c866', ALMAGRA = '#a8302a', ALMAGRA_D = '#7a1f1d';
const CREAM = '#f6ecd6', PLASTER = '#efe0c0', INK = '#2a1714';
const BRICK = '#bb5a3c', BRICK_D = '#8f3c29', BRICK_L = '#d27a55', STONE = '#f3e5c6', STONE_D = '#d8c39b';
const SKY_T = '#6fa7d2', SKY_B = '#f4dcb2', CLOUD = '#fbf5e8', CLOUD_S = '#d9e3ea';
const COBALT = '#1f4f9c', TEAL = '#2f8a96', TEAL_L = '#6bb8bd', OCHRE = '#e1a230', GREEN = '#2f7a46', MANG = '#4a2a22';
const LEAF = '#2f5d34', LEAF_D = '#1f4126', LEAF_L = '#4f8a45', ORANGE = '#f08a1c', RED = '#cf2229', SAND = '#ecc77a', SAND_D = '#d9aa59';

export const city = {
  id: 'seville', name: 'Seville',
  alt: "A feria poster in flat gouache: through a lobed horseshoe arch in the manner of the Real Alcázar, its voussoirs painted red and cream, marble columns, painted vines and a tiled dado, the brick curve of the Plaza de España with its arcades, its two towers, tiled benches, the canal and its bridge, a carriage and strollers, and the Giralda far off, under strings of feria lanterns; orange trees either side, and below, the name Sevilla over the red, white-spotted flounces of a flamenco dress and a black shawl with a silk fringe, all in a border of painted tiles",
  google: 'family=Yeseva+One',
  wall: '#4a1a17',
  fonts: [['400 300px "Yeseva One"', 'Sevilla'], ['400 40px "Yeseva One"', 'FIESTAS DE PRIMAVERA · PLAZA DE ESPAÑA · REAL ALCÁZAR']],
  build,
};

// ================================================================ geometry
const TS = 80;                 // the border tiles
const X = W / 2, AC = 690, R = 386, LOBE = 44, JW = 356, SILL = 1400;
const A0 = Math.PI - Math.acos(JW / R), A1 = 2 * Math.PI + Math.acos(JW / R); // the springing, either side
const SPRING = AC + Math.sqrt(R * R - JW * JW);
const R2 = R + LOBE + 78;     // the outside of the voussoirs
const ALF = { x0: X - R2 - 44, x1: X + R2 + 44, y0: AC - R2 - 40, y1: SPRING + 24 }; // the alfiz
const PLINTH = 1440;

// the opening: straight jambs, and over them a horseshoe of eleven lobes
const OPEN = (() => {
  const pts = [[X - JW, SILL + 2], [X - JW, SPRING]];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = A0 + ((A1 - A0) * i) / n, b = A0 + ((A1 - A0) * (i + 1)) / n;
    for (let k = 0; k <= 12; k++) {
      const t = k / 12, ang = a + (b - a) * t, rr = R + LOBE * Math.sin(Math.PI * t) ** 0.6;
      pts.push([X + Math.cos(ang) * rr, AC + Math.sin(ang) * rr]);
    }
  }
  pts.push([X + JW, SPRING], [X + JW, SILL + 2]);
  return pts;
})();
const VIEW = { x: X - R - LOBE - 4, y: AC - R - LOBE - 4, w: 2 * (R + LOBE + 4), h: SILL - (AC - R - LOBE) + 10 };

// the Plaza de España, seen from the middle of its half circle: everything bends
// toward us at the ends
const kk = (x) => ((x - X) / 430) ** 2;
const EAVE = (x) => 868 - 52 * kk(x);
const BASE = (x) => 1012 + 50 * kk(x);
const BENCH = (x) => BASE(x) + 40;
const CANAL = (x) => BENCH(x) + 50 + 22 * kk(x);
const RAIL = (x) => CANAL(x) + 18;
const TOWERS = [548, 1052];

// the marks are collected and handed to the plate in order of time
class Queue {
  constructor() { this.q = []; }
  add(layer, t, d, box, draw, o = {}) { this.q.push([layer, { ...o, t, d, box, draw }]); }
  // a word set letter by letter, kept whole and placed at its first letter's time
  type(layer, str, x, y, o) { this.q.push([layer, { t: o.t, word: [str, x, y, o] }]); }
  flush(p) {
    this.q.forEach((e, i) => { e[2] = i; });
    this.q.sort((a, b) => a[1].t - b[1].t || a[2] - b[2]);
    for (const [layer, m] of this.q) (m.word ? p.type(layer, ...m.word) : p.mark(layer, m));
  }
}
// a closed polygon added to the current path (poly() would start a new one)
function sub(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
const B = (x0, y0, x1, y1, pad = 4) => ({ x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad });
function curve(f, x0, x1, step = 8) { const out = []; for (let x = x0; x <= x1 + 0.1; x += step) out.push([x, f(x)]); return out; }

function build() {
  const p = new Plate({ paper: CREAM, seed: 1929 });
  const r = p.r;
  p.clip = VIEW;
  p.stack('sky', 'far', 'plaza', 'towers', 'front', 'people', 'lanterns', 'wall', 'arch', 'trees', 'tiles', 'title', 'fringe');
  for (const n of ['wall', 'arch', 'trees', 'tiles', 'title', 'fringe']) p.layer(n, { clip: false });
  const Q = new Queue();
  mask(Q);
  border(Q);
  sky(Q, r);
  giralda(Q);
  building(Q, r);
  towers(Q);
  benches(Q, r);
  canal(Q, r);
  people(Q, r);
  wall(Q, r);
  arch(Q);
  trees(Q, r);
  title(Q, r);
  Q.flush(p);
  life(p, r);
  return p;
}

// the plaster: the sheet, less the opening, laid down at once so nothing of the
// view shows outside the arch
function mask(Q) {
  Q.add('wall', 0, 0.05, { x: 0, y: 0, w: W, h: H }, (c) => {
    c.beginPath(); c.rect(0, 0, W, H); sub(c, OPEN); c.fillStyle = CREAM; c.fill('evenodd');
  }, { reveal: 'none' });
}

// ================================================================ the tile border
// a Triana tile in cuerda seca: a cobalt rosette, quarter circles of green at the
// corners that make whole rings with the neighbors, ochre buds between
function tileArt(c, x, y, s, k) {
  const h = s / 2, cx = x + h, cy = y + h;
  c.fillStyle = '#f7f0df'; c.fillRect(x, y, s, s);
  // the corners: green quarter rings
  c.fillStyle = GREEN;
  for (const [ex, ey] of [[x, y], [x + s, y], [x, y + s], [x + s, y + s]]) {
    c.beginPath(); c.moveTo(ex, ey); c.arc(ex, ey, s * 0.3, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = '#f7f0df';
  for (const [ex, ey] of [[x, y], [x + s, y], [x, y + s], [x + s, y + s]]) { c.beginPath(); c.arc(ex, ey, s * 0.17, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = OCHRE;
  for (const [ex, ey] of [[x, y], [x + s, y], [x, y + s], [x + s, y + s]]) { c.beginPath(); c.arc(ex, ey, s * 0.08, 0, Math.PI * 2); c.fill(); }
  // the rosette: eight petals, alternately cobalt and the tile's second color
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    c.fillStyle = i % 2 ? (k % 2 ? TEAL : COBALT) : COBALT;
    c.beginPath(); c.ellipse(cx + Math.cos(a) * s * 0.18, cy + Math.sin(a) * s * 0.18, s * 0.15, s * 0.07, a, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = OCHRE; c.beginPath(); c.arc(cx, cy, s * 0.08, 0, Math.PI * 2); c.fill();
  // the dark lines of the cuerda seca
  c.strokeStyle = MANG; c.lineWidth = 1.3;
  c.beginPath(); c.arc(cx, cy, s * 0.36, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(cx, cy, s * 0.08, 0, Math.PI * 2); c.stroke();
  // ochre buds at the middle of each side
  c.fillStyle = OCHRE;
  for (const [bx, by, a] of [[cx, y, Math.PI / 2], [cx, y + s, -Math.PI / 2], [x, cy, 0], [x + s, cy, Math.PI]]) {
    c.beginPath(); c.ellipse(bx + Math.cos(a) * s * 0.06, by + Math.sin(a) * s * 0.06, s * 0.07, s * 0.035, a, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = 'rgba(74,42,34,.35)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
}
function border(Q) {
  // the ring of tiles in order, clockwise from the top left, in runs of four
  const cells = [];
  const nx = W / TS, ny = H / TS;
  for (let i = 0; i < nx; i++) cells.push([i, 0]);
  for (let j = 1; j < ny; j++) cells.push([nx - 1, j]);
  for (let i = nx - 2; i >= 0; i--) cells.push([i, ny - 1]);
  for (let j = ny - 2; j >= 1; j--) cells.push([0, j]);
  const run = 4;
  for (let s = 0; s < cells.length; s += run) {
    const part = cells.slice(s, s + run);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [i, j] of part) { x0 = Math.min(x0, i * TS); y0 = Math.min(y0, j * TS); x1 = Math.max(x1, i * TS + TS); y1 = Math.max(y1, j * TS + TS); }
    Q.add('tiles', 0.15 + (s / run) * 0.055, 0.45, B(x0, y0, x1, y1, 2), (c) => {
      for (const [i, j] of part) tileArt(c, i * TS, j * TS, TS, i + j);
    }, { reveal: 'pop' });
  }
  // a thin red fillet inside the tiles
  Q.add('tiles', 1.6, 1.0, B(TS - 8, TS - 8, W - TS + 8, H - TS + 8), (c) => {
    c.strokeStyle = ALMAGRA; c.lineWidth = 7; c.strokeRect(TS + 3.5, TS + 3.5, W - 2 * TS - 7, H - 2 * TS - 7);
    c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(TS + 8, TS + 8, W - 2 * TS - 16, H - 2 * TS - 16);
  }, { reveal: 'fade' });
}

// ================================================================ the view
function sky(Q, r) {
  Q.add('sky', 0.5, 1.0, VIEW, (c) => {
    const g = c.createLinearGradient(0, VIEW.y, 0, 1060);
    g.addColorStop(0, SKY_T); g.addColorStop(0.55, '#a9cbe0'); g.addColorStop(1, SKY_B);
    c.fillStyle = g; c.fillRect(VIEW.x, VIEW.y, VIEW.w, VIEW.h);
  }, { reveal: 'fall', ease: 'inOut' });
  // flat gouache clouds, each a heap of round puffs with a cooler underside
  const clouds = [[560, 460, 190], [930, 380, 240], [1110, 600, 150], [700, 660, 120]];
  clouds.forEach(([x, y, w], i) => {
    const puffs = [];
    const n = Math.round(w / 34);
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; puffs.push([x - w / 2 + t * w, y - Math.sin(t * Math.PI) * w * 0.12 - r.range(0, 10), w / n * r.range(0.75, 1.0) * (0.8 + Math.sin(t * Math.PI) * 0.5)]); }
    Q.add('sky', 1.2 + i * 0.25, 0.8, B(x - w / 2 - 50, y - w * 0.4, x + w / 2 + 50, y + 14), (c) => {
      c.save(); c.beginPath(); c.rect(x - w, y - w, w * 2, w + 2); c.clip();
      c.fillStyle = CLOUD_S; for (const [px, py, pr] of puffs) { c.beginPath(); c.arc(px + 4, py + 5, pr, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = CLOUD; for (const [px, py, pr] of puffs) { c.beginPath(); c.arc(px, py, pr, 0, Math.PI * 2); c.fill(); }
      c.restore();
    }, { reveal: 'wipe', ease: 'out' });
  });
}

// the Giralda, far off over the roofs: the Moorish shaft with its panels of
// brick lattice, the Renaissance belfry and the weathervane
function giralda(Q) {
  const x = 905, foot = 875, s = 0.62;
  Q.add('far', 2.0, 1.2, B(x - 30, foot - 360 * s - 30, x + 30, foot), (c) => {
    c.save(); c.translate(x, foot); c.scale(s, s);
    const shaft = '#d9a98a', shadow = '#c48f72', bel = '#efe1c3';
    c.fillStyle = shaft; c.fillRect(-26, -230, 52, 230);
    c.fillStyle = shadow; c.fillRect(8, -230, 18, 230);
    // the lattice panels (sebka) on the shaft
    c.strokeStyle = '#a86e55'; c.lineWidth = 1.6;
    for (const yy of [-200, -130, -60]) {
      c.strokeRect(-17, yy, 34, 46);
      c.beginPath(); for (let k = 0; k < 4; k++) { c.moveTo(-17 + k * 11, yy + 46); c.lineTo(-17 + k * 11 + 6, yy + 20); c.lineTo(-17 + k * 11 + 11, yy + 46); } c.stroke();
    }
    // the belfry stages, narrowing
    c.fillStyle = bel; c.fillRect(-24, -268, 48, 38); c.fillRect(-18, -300, 36, 32); c.fillRect(-12, -326, 24, 26);
    c.fillStyle = '#5a3b33'; for (const xx of [-14, 2]) c.fillRect(xx, -262, 10, 24); c.fillRect(-5, -294, 10, 20);
    c.fillStyle = OCHRE; c.beginPath(); c.arc(0, -330, 9, Math.PI, 0); c.fill();
    c.fillRect(-1.5, -362, 3, 32);
    c.beginPath(); c.moveTo(0, -362); c.lineTo(9, -352); c.lineTo(0, -346); c.fill();
    c.restore();
  }, { reveal: 'rise' });
}

// the brick half circle: an arcade below, windows above, the balustrade on top,
// the taller pavilion in the middle
function building(Q, r) {
  const x0 = VIEW.x, x1 = VIEW.x + VIEW.w;
  const top = curve(EAVE, x0, x1), foot = curve(BASE, x0, x1);
  const body = [...top, ...foot.slice().reverse()];
  Q.add('plaza', 2.2, 1.3, B(x0, 800, x1, 1080), (c) => {
    c.fillStyle = BRICK; poly(c, body); c.fill();
    // the stone band between the floors and the cornice
    c.strokeStyle = STONE; c.lineCap = 'butt';
    for (const [f, lw] of [[(x) => EAVE(x) + 4, 8], [(x) => EAVE(x) + (BASE(x) - EAVE(x)) * 0.5, 5], [(x) => BASE(x) - 2, 4]]) {
      c.lineWidth = lw * 1; c.beginPath(); curve(f, x0, x1).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    }
  }, { reveal: 'rise' });
  // the arcade and the windows, as many small shapes in two marks
  const arches = [], wins = [];
  for (let x = x0 + 10; x < x1 - 10; x += 30 + 10 * kk(x)) {
    const k = kk(x), w = 16 + 8 * k, b = BASE(x) - 4, e = EAVE(x), mid = e + (b - e) * 0.5;
    if (Math.abs(x - X) < 80) continue;
    arches.push([x, b, w, (b - mid) * 0.72]);
    wins.push([x, mid - 8, w * 0.5, (mid - e) * 0.42]);
  }
  Q.add('plaza', 3.0, 0.9, B(x0, 820, x1, 1080), (c) => {
    c.fillStyle = STONE;
    for (const [x, b, w, h] of arches) { c.beginPath(); c.rect(x - w / 2 - 3, b - h + w / 2 - 3, w + 6, h - w / 2 + 3); c.arc(x, b - h + w / 2, w / 2 + 3, Math.PI, 0); c.fill(); }
    c.fillStyle = '#3c2320';
    for (const [x, b, w, h] of arches) { c.beginPath(); c.rect(x - w / 2, b - h + w / 2, w, h - w / 2); c.arc(x, b - h + w / 2, w / 2, Math.PI, 0); c.fill(); }
    c.fillStyle = STONE;
    for (const [x, y, w, h] of wins) c.fillRect(x - w / 2 - 2, y - h - 2, w + 4, h + 4);
    c.fillStyle = '#3c2320';
    for (const [x, y, w, h] of wins) c.fillRect(x - w / 2, y - h, w, h);
  }, { reveal: 'wipe' });
  // the balustrade along the top, little white posts
  Q.add('plaza', 3.4, 0.8, B(x0, 790, x1, 880), (c) => {
    c.fillStyle = STONE;
    for (let x = x0; x < x1; x += 7) { const y = EAVE(x); c.fillRect(x, y - 9, 3, 9); }
    c.beginPath(); curve((x) => EAVE(x) - 10, x0, x1).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.strokeStyle = STONE; c.lineWidth = 3; c.stroke();
  }, { reveal: 'wipe' });
  // the pavilion in the middle: a taller front with a great arched door and a stepped gable
  Q.add('plaza', 3.2, 1.0, B(X - 90, 730, X + 90, 1020), (c) => {
    const b = BASE(X), e = EAVE(X) - 64;
    c.fillStyle = BRICK_L; c.fillRect(X - 72, e, 144, b - e);
    c.fillStyle = BRICK_D; c.fillRect(X + 40, e, 32, b - e);
    c.fillStyle = STONE; poly(c, [[X - 78, e], [X - 40, e - 30], [X - 22, e - 30], [X, e - 52], [X + 22, e - 30], [X + 40, e - 30], [X + 78, e]]); c.fill();
    c.fillStyle = ALMAGRA; c.beginPath(); c.arc(X, e - 22, 10, 0, Math.PI * 2); c.fill();
    c.fillStyle = STONE; c.fillRect(X - 34, b - 92, 68, 92); c.beginPath(); c.arc(X, b - 92, 34, Math.PI, 0); c.fill();
    c.fillStyle = '#3c2320'; c.fillRect(X - 24, b - 90, 48, 90); c.beginPath(); c.arc(X, b - 90, 24, Math.PI, 0); c.fill();
    c.fillStyle = STONE; for (const s of [-1, 1]) { c.fillRect(X + s * 56 - 7, e + 20, 14, 30); c.fillRect(X + s * 56 - 7, e + 70, 14, 30); }
    c.fillStyle = '#3c2320'; for (const s of [-1, 1]) { c.fillRect(X + s * 56 - 4, e + 23, 8, 24); c.fillRect(X + s * 56 - 4, e + 73, 8, 24); }
    c.strokeStyle = STONE; c.lineWidth = 4; c.strokeRect(X - 72, e, 144, b - e);
  }, { reveal: 'rise' });
}

// the two towers: a brick shaft with stone quoins, a balcony stage, a belfry,
// a lantern with its cupola, and pinnacles at every corner
function tower(c, x, foot) {
  const st = (x0, y0, w, h, col) => { c.fillStyle = col; c.fillRect(x0, y0, w, h); };
  const pin = (px, py, h) => { c.fillStyle = STONE; poly(c, [[px - 4, py], [px + 4, py], [px + 1.5, py - h], [px - 1.5, py - h]]); c.fill(); c.beginPath(); c.arc(px, py - h - 3, 3.5, 0, Math.PI * 2); c.fill(); };
  const w = 86, top1 = 560;
  // the shaft
  st(x - w / 2, top1, w, foot - top1, BRICK);
  st(x + w / 2 - 26, top1, 26, foot - top1, BRICK_D);
  st(x - w / 2, top1, 8, foot - top1, STONE); st(x + w / 2 - 8, top1, 8, foot - top1, STONE_D);
  for (let y = top1 + 30; y < foot - 20; y += 46) { st(x - w / 2, y, 12, 14, STONE); st(x + w / 2 - 12, y, 12, 14, STONE_D); }
  // windows up the shaft
  for (const y of [640, 740, 840, 940]) { st(x - 11, y, 22, 34, STONE); st(x - 7, y + 4, 14, 30, '#3c2320'); c.fillStyle = STONE; c.beginPath(); c.arc(x, y + 2, 11, Math.PI, 0); c.fill(); }
  // the balcony: a cornice with a pierced railing
  st(x - w / 2 - 8, top1 - 10, w + 16, 12, STONE);
  st(x - w / 2 - 6, top1 - 26, w + 12, 4, STONE);
  for (let k = 0; k <= 10; k++) st(x - w / 2 - 6 + k * (w + 12) / 10 - 1.5, top1 - 24, 3, 14, STONE);
  // the belfry: three arches
  const w2 = 66, top2 = 474;
  st(x - w2 / 2, top2, w2, top1 - 26 - top2, BRICK_L);
  st(x + w2 / 2 - 18, top2, 18, top1 - 26 - top2, BRICK);
  for (const dx of [-20, 0, 20]) { c.fillStyle = '#3c2320'; c.beginPath(); c.rect(x + dx - 6, top2 + 20, 12, 40); c.arc(x + dx, top2 + 20, 6, Math.PI, 0); c.fill(); }
  st(x - w2 / 2 - 6, top2 - 8, w2 + 12, 10, STONE);
  pin(x - w / 2 - 2, top1 - 26, 26); pin(x + w / 2 + 2, top1 - 26, 26);
  // the lantern, octagonal, with its cupola and spire
  const w3 = 40, top3 = 420;
  st(x - w3 / 2, top3, w3, top2 - 8 - top3, STONE);
  st(x + w3 / 2 - 12, top3, 12, top2 - 8 - top3, STONE_D);
  for (const dx of [-8, 8]) { c.fillStyle = '#3c2320'; c.beginPath(); c.rect(x + dx - 4, top3 + 12, 8, 22); c.arc(x + dx, top3 + 12, 4, Math.PI, 0); c.fill(); }
  pin(x - w2 / 2 - 2, top2 - 8, 22); pin(x + w2 / 2 + 2, top2 - 8, 22);
  c.fillStyle = '#3f7f8c'; c.beginPath(); c.ellipse(x, top3, w3 / 2 + 4, 26, 0, Math.PI, 0); c.fill();
  c.fillStyle = '#2d606b'; c.beginPath(); c.ellipse(x, top3, w3 / 2 + 4, 26, 0, Math.PI * 1.55, 0); c.lineTo(x, top3); c.fill();
  c.strokeStyle = OCHRE; c.lineWidth = 1.4; for (const dx of [-10, 0, 10]) { c.beginPath(); c.moveTo(x + dx, top3); c.quadraticCurveTo(x + dx * 0.7, top3 - 18, x, top3 - 26); c.stroke(); }
  st(x - 2, top3 - 62, 4, 38, OCHRE);
  c.fillStyle = OCHRE; c.beginPath(); c.arc(x, top3 - 40, 5, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(x - 9, top3 - 54); c.lineTo(x + 9, top3 - 54); c.moveTo(x, top3 - 62); c.lineTo(x, top3 - 46);
  c.strokeStyle = OCHRE; c.lineWidth = 2.5; c.stroke();
}
function towers(Q) {
  TOWERS.forEach((x, i) => {
    Q.add('towers', 2.4 + i * 0.5, 1.6, B(x - 64, 330, x + 64, BASE(x) + 6), (c) => tower(c, x, BASE(x)), { reveal: 'rise', ease: 'inOut' });
  });
}

// the benches: a tiled alcove for every province, between brick piers
function benches(Q, r) {
  const x0 = VIEW.x, x1 = VIEW.x + VIEW.w;
  const panels = [];
  const pal = [[COBALT, OCHRE], [TEAL, '#f7f0df'], [OCHRE, COBALT], [GREEN, OCHRE], [COBALT, '#f7f0df'], [ALMAGRA, OCHRE]];
  let i = 0;
  for (let x = x0; x < x1; x += 42 + 18 * kk(x)) panels.push([x, 42 + 18 * kk(x), pal[(i++ * 5) % pal.length], r.range(0, 1)]);
  Q.add('front', 4.4, 1.2, B(x0, 990, x1, 1130), (c) => {
    // the back wall of the alcoves
    c.fillStyle = BRICK_D; poly(c, [...curve(BASE, x0, x1), ...curve(BENCH, x0, x1).reverse()]); c.fill();
    for (const [x, w, [a, b2]] of panels) {
      const y0 = BASE(x) + 4, y1 = BENCH(x) - 10, ww = w - 12;
      // the tile picture: a field, a border, a motif
      c.fillStyle = '#f7f0df'; c.fillRect(x + 6, y0, ww, y1 - y0);
      c.fillStyle = a; c.fillRect(x + 8, y0 + 2, ww - 4, y1 - y0 - 4);
      c.fillStyle = b2; c.fillRect(x + 6 + ww * 0.3, y0 + 5, ww * 0.4, y1 - y0 - 10);
      // the bench seat and its tiled front
      c.fillStyle = STONE; c.fillRect(x + 4, y1, w - 8, 4);
      c.fillStyle = OCHRE; c.fillRect(x + 4, y1 + 4, w - 8, 6);
      // the brick pier with a stone cap
      c.fillStyle = BRICK; c.fillRect(x - 3, BASE(x) - 2, 9, BENCH(x) - BASE(x) + 2);
      c.fillStyle = STONE; c.fillRect(x - 4, BASE(x) - 4, 11, 4);
    }
  }, { reveal: 'wipe', ease: 'inOut' });
}

// the canal with its tiled balustrade and the bridge to the middle
function canal(Q, r) {
  const x0 = VIEW.x, x1 = VIEW.x + VIEW.w;
  Q.add('front', 5.0, 1.0, B(x0, 1040, x1, 1190), (c) => {
    c.fillStyle = TEAL; poly(c, [...curve(BENCH, x0, x1), ...curve(CANAL, x0, x1).reverse()]); c.fill();
    c.fillStyle = 'rgba(187,90,60,.45)'; poly(c, [...curve(BENCH, x0, x1), ...curve((x) => BENCH(x) + 12, x0, x1).reverse()]); c.fill();
  }, { reveal: 'wipe' });
  // ripples, fixed now
  const rip = [];
  for (let i = 0; i < 70; i++) { const x = r.range(x0, x1), y = r.range(BENCH(x) + 14, CANAL(x) - 4); rip.push([x, y, r.range(8, 20)]); }
  Q.add('front', 5.6, 0.6, B(x0, 1040, x1, 1190), (c) => {
    c.strokeStyle = TEAL_L; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();
    for (const [x, y, l] of rip) { c.moveTo(x - l / 2, y); c.lineTo(x + l / 2, y); }
    c.stroke();
  }, { reveal: 'fade' });
  // the near balustrade: blue and white balusters on a stone rail
  Q.add('front', 5.8, 1.0, B(x0, 1080, x1, 1210), (c) => {
    c.fillStyle = SAND_D; poly(c, [...curve(CANAL, x0, x1), ...curve(RAIL, x0, x1).reverse()]); c.fill();
    let k = 0;
    for (let x = x0; x < x1; x += 9 + 3 * kk(x)) {
      if (Math.abs(x - X) < 110) continue;
      const y = CANAL(x);
      c.fillStyle = k++ % 2 ? COBALT : '#f7f0df';
      c.fillRect(x - 2.5, y - 14, 5, 14);
    }
    c.strokeStyle = STONE; c.lineWidth = 5; c.beginPath();
    curve((x) => CANAL(x) - 15, x0, X - 110).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke(); c.beginPath();
    curve((x) => CANAL(x) - 15, X + 110, x1).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  }, { reveal: 'wipe' });
  // the bridge, coming toward us: its deck, its tiled parapets, lamps at its ends
  Q.add('front', 6.2, 1.0, B(X - 140, 1000, X + 140, 1215), (c) => {
    const yf = BENCH(X) - 2, yn = RAIL(X) + 6;
    c.fillStyle = SAND; poly(c, [[X - 60, yf], [X + 60, yf], [X + 100, yn], [X - 100, yn]]); c.fill();
    for (const s of [-1, 1]) {
      const a = [X + s * 60, yf], b = [X + s * 102, yn];
      c.fillStyle = '#f7f0df'; poly(c, [[a[0], a[1] - 16], [b[0], b[1] - 26], [b[0], b[1]], [a[0], a[1]]]); c.fill();
      c.fillStyle = COBALT;
      for (let k = 1; k < 8; k++) { const t = k / 8, xx = a[0] + (b[0] - a[0]) * t, yy = a[1] + (b[1] - a[1]) * t, h = 16 + 10 * t; c.fillRect(xx - 2, yy - h + 3, 4, h - 6); }
      c.strokeStyle = STONE; c.lineWidth = 4; c.beginPath(); c.moveTo(a[0], a[1] - 16); c.lineTo(b[0], b[1] - 26); c.stroke();
      // the lamp at the near end
      c.fillStyle = INK; c.fillRect(b[0] - 2, b[1] - 88, 4, 62);
      c.fillStyle = '#f8e6a0'; c.beginPath(); c.arc(b[0], b[1] - 92, 8, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }
  }, { reveal: 'rise' });
  // the albero of the plaza, raked in lines
  const rake = [];
  for (let i = 0; i < 44; i++) { const y = r.range(1215, 1395), x = r.range(x0, x1); rake.push([x, y, r.range(30, 80)]); }
  Q.add('front', 5.2, 1.0, B(x0, 1100, x1, SILL + 4), (c) => {
    c.fillStyle = SAND; poly(c, [...curve(RAIL, x0, x1), [x1, SILL + 4], [x0, SILL + 4]]); c.fill();
    c.strokeStyle = SAND_D; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();
    for (const [x, y, l] of rake) { c.moveTo(x - l / 2, y); c.lineTo(x + l / 2, y); }
    c.stroke();
  }, { reveal: 'fall' });
}

// strollers in feria dress, and a carriage
function person(c, p) {
  const { x, y, s, dress, top, kind } = p;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(120,80,30,.25)'; c.beginPath(); c.ellipse(4, 0, 14, 3, 0, 0, Math.PI * 2); c.fill();
  if (kind === 'flamenca') {
    // a fitted bodice and a skirt of three flounces
    c.fillStyle = dress; poly(c, [[-5, -40], [5, -40], [4, -26], [-4, -26]]); c.fill();
    for (let k = 0; k < 3; k++) { const y0 = -26 + k * 8; poly(c, [[-5 - k * 2.5, y0], [5 + k * 2.5, y0], [8 + k * 3, y0 + 9], [-8 - k * 3, y0 + 9]]); c.fill(); }
    c.fillStyle = '#fff'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(-6 + (k % 3) * 6, -20 + Math.floor(k / 3) * 9, 1.2, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#c98a5a'; c.beginPath(); c.arc(0, -45, 4.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(0, -47, 4.5, Math.PI * 0.9, Math.PI * 2.1); c.fill();
    c.fillStyle = RED; c.beginPath(); c.arc(3, -50, 2.4, 0, Math.PI * 2); c.fill();
  } else {
    // a short jacket, high-waisted trousers, a flat-brimmed hat
    c.fillStyle = INK; c.fillRect(-4, -22, 3, 22); c.fillRect(1, -22, 3, 22);
    c.fillStyle = top; c.fillRect(-5, -40, 10, 18);
    c.fillStyle = '#c98a5a'; c.beginPath(); c.arc(0, -45, 4.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; c.fillRect(-8, -50, 16, 2.5); c.fillRect(-4, -55, 8, 5);
  }
  c.restore();
}
function people(Q, r) {
  const list = [];
  const dresses = [RED, '#1f6fa8', '#f2c94c', '#2f8a5a', '#e46aa0', '#f4efe2', ALMAGRA];
  for (let i = 0; i < 30; i++) {
    const y = r.range(1226, 1390), x = r.range(VIEW.x + 30, VIEW.x + VIEW.w - 30);
    if ((Math.abs(x - 1090) < 90 && y > 1290) || (Math.abs(x - X) < 110 && Math.abs(y - 1262) < 40)) continue;
    list.push({ x, y, s: 0.75 + (y - 1220) / 260, dress: r.pick(dresses), top: r.pick([INK, '#5a3b33', '#2c3a5c']), kind: r.chance(0.6) ? 'flamenca' : 'man' });
  }
  list.sort((a, b) => a.y - b.y);
  // in three handfuls, far to near
  for (let k = 0; k < 3; k++) {
    const part = list.filter((_, i) => i % 3 === k);
    Q.add('people', 6.6 + k * 0.3, 0.6, B(VIEW.x, 1160, VIEW.x + VIEW.w, SILL + 4), (c) => { for (const p of part) person(c, p); }, { reveal: 'drop', dy: 14 });
  }
  // the fountain in the middle of the plaza: a round basin, two bowls
  Q.add('people', 6.4, 0.8, B(X - 110, 1170, X + 110, 1300), (c) => {
    const y = 1272;
    c.fillStyle = 'rgba(120,80,30,.25)'; c.beginPath(); c.ellipse(X + 6, y + 6, 104, 18, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = STONE; c.beginPath(); c.ellipse(X, y, 100, 18, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = TEAL_L; c.beginPath(); c.ellipse(X, y - 4, 88, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = COBALT; c.fillRect(X - 100, y - 2, 200, 9);
    c.fillStyle = STONE; c.beginPath(); c.ellipse(X, y + 7, 100, 14, 0, 0, Math.PI); c.fill();
    c.fillStyle = COBALT; for (let k = -4; k <= 4; k++) c.fillRect(X + k * 21 - 4, y + 6, 8, 8 - Math.abs(k) * 0.6);
    c.fillStyle = STONE; c.fillRect(X - 7, y - 58, 14, 56); c.beginPath(); c.ellipse(X, y - 58, 34, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillRect(X - 4, y - 92, 8, 34); c.beginPath(); c.ellipse(X, y - 92, 18, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = STONE_D; c.beginPath(); c.ellipse(X, y - 56, 34, 6, 0, 0, Math.PI); c.fill();
  }, { reveal: 'rise' });
  // a horse and its open carriage, waiting
  Q.add('people', 7.4, 0.8, B(980, 1270, 1220, 1400), (c) => {
    const x = 1000, y = 1370;
    c.fillStyle = 'rgba(120,80,30,.25)'; c.beginPath(); c.ellipse(x + 100, y + 2, 110, 6, 0, 0, Math.PI * 2); c.fill();
    // the horse, dappled grey, plumed
    c.fillStyle = '#e8e2d6';
    c.beginPath(); c.ellipse(x + 30, y - 46, 30, 15, 0, 0, Math.PI * 2); c.fill();
    poly(c, [[x + 4, y - 56], [x - 10, y - 88], [x - 22, y - 86], [x - 14, y - 62], [x + 8, y - 40]]); c.fill();
    c.fillRect(x + 6, y - 38, 5, 38); c.fillRect(x + 16, y - 36, 5, 36); c.fillRect(x + 42, y - 38, 5, 38); c.fillRect(x + 52, y - 36, 5, 36);
    c.strokeStyle = '#bdb5a5'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 60, y - 50); c.quadraticCurveTo(x + 72, y - 40, x + 68, y - 24); c.stroke();
    c.fillStyle = RED; c.beginPath(); c.arc(x - 14, y - 92, 5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 14, y - 74); c.lineTo(x + 20, y - 56); c.lineTo(x + 90, y - 40); c.stroke();
    // the carriage: black body, yellow wheels
    c.fillStyle = INK; poly(c, [[x + 80, y - 60], [x + 200, y - 66], [x + 196, y - 28], [x + 96, y - 26]]); c.fill();
    c.fillStyle = ALMAGRA; c.fillRect(x + 140, y - 86, 40, 24);
    c.strokeStyle = OCHRE; c.lineWidth = 3.5;
    for (const [wx, wr] of [[x + 108, 18], [x + 180, 26]]) {
      c.beginPath(); c.arc(wx, y - wr, wr, 0, Math.PI * 2); c.stroke();
      c.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI; c.moveTo(wx + Math.cos(a) * wr, y - wr + Math.sin(a) * wr); c.lineTo(wx - Math.cos(a) * wr, y - wr - Math.sin(a) * wr); } c.lineWidth = 1.5; c.stroke(); c.lineWidth = 3.5;
    }
    // the coachman in his hat
    c.fillStyle = INK; c.fillRect(x + 96, y - 92, 14, 30); c.fillRect(x + 90, y - 100, 26, 4); c.fillRect(x + 96, y - 110, 14, 10);
    c.fillStyle = '#c98a5a'; c.beginPath(); c.arc(x + 103, y - 94, 4, 0, Math.PI * 2); c.fill();
  }, { reveal: 'slide', dx: -60 });
}

// ================================================================ the wall and the arch
function wall(Q, r) {
  // the albero wash: everything inside the border and above the plinth, but the opening
  Q.add('wall', 6.0, 1.4, B(TS, TS, W - TS, PLINTH), (c) => {
    c.beginPath(); c.rect(TS, TS, W - 2 * TS, PLINTH - TS); sub(c, OPEN); c.fillStyle = ALBERO; c.fill('evenodd');
    // a little unevenness in the lime wash
    c.save(); c.beginPath(); c.rect(TS, TS, W - 2 * TS, PLINTH - TS); sub(c, OPEN); c.clip('evenodd');
    c.fillStyle = ALBERO_L; c.globalAlpha *= 0.35;
    for (const [x, y, w, h] of WASH) { c.beginPath(); c.ellipse(x, y, w, h, 0, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }, { reveal: 'fall', ease: 'inOut' });
  // the alfiz: a red frame around the arch, with a cream fillet
  Q.add('wall', 7.0, 0.8, B(ALF.x0 - 20, ALF.y0 - 20, ALF.x1 + 20, ALF.y1 + 20), (c) => {
    c.save(); c.beginPath(); c.rect(ALF.x0, ALF.y0, ALF.x1 - ALF.x0, ALF.y1 - ALF.y0); c.clip();
    c.fillStyle = PLASTER; c.beginPath(); c.rect(ALF.x0, ALF.y0, ALF.x1 - ALF.x0, ALF.y1 - ALF.y0); sub(c, OPEN); c.fill('evenodd'); c.restore();
    c.save(); c.beginPath(); c.rect(0, 0, W, H); sub(c, OPEN); c.clip('evenodd');
    c.strokeStyle = ALMAGRA; c.lineWidth = 22; c.strokeRect(ALF.x0 - 11, ALF.y0 - 11, ALF.x1 - ALF.x0 + 22, ALF.y1 - ALF.y0 + 22);
    c.strokeStyle = CREAM; c.lineWidth = 2.5; c.strokeRect(ALF.x0 - 11, ALF.y0 - 11, ALF.x1 - ALF.x0 + 22, ALF.y1 - ALF.y0 + 22);
    c.restore();
  }, { reveal: 'iris' });
  // painted vines in the spandrels: red stems curling out of the corners
  const vines = [];
  const vr = rng(77);
  for (const sd of [-1, 1]) {
    // a stem following the ring, and scrolls curling off it into the corner
    const stem = [];
    for (let k = 0; k <= 30; k++) { const a = -Math.PI / 2 + sd * (0.18 + k / 30 * 1.12); stem.push([X + Math.cos(a) * (R2 + 34), AC + Math.sin(a) * (R2 + 34)]); }
    vines.push(stem);
    for (let k = 3; k < 30; k += 4) {
      const [sx, sy] = stem[k];
      const out = Math.atan2(sy - AC, sx - X), rad = vr.range(20, 34) + (k % 8 === 3 ? 14 : 0);
      const cx = sx + Math.cos(out) * rad * 1.2, cy = sy + Math.sin(out) * rad * 1.2;
      if (cx < ALF.x0 + rad + 8 || cx > ALF.x1 - rad - 8 || cy < ALF.y0 + rad + 8) continue;
      const pts = [[sx, sy]];
      const a0 = out + Math.PI;
      for (let q = 0; q <= 36; q++) { const t = q / 36, a = a0 + (k % 8 === 3 ? 1 : -1) * sd * t * Math.PI * 2.2, rr = rad * (1 - t * 0.8); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
      vines.push(pts);
    }
    // a rosette in the far corner
    vines.push([]);
  }
  const leaves = [];
  vines.forEach((v) => { for (let k = 4; v.length && k < v.length - 2; k += 6) leaves.push([v[k][0], v[k][1], Math.atan2(v[k + 1][1] - v[k][1], v[k + 1][0] - v[k][0]) + Math.PI / 2, (k / 6) % 2 ? GREEN : ALMAGRA]); });
  Q.add('wall', 7.6, 1.0, B(ALF.x0, ALF.y0, ALF.x1, ALF.y0 + 300), (c) => {
    c.save(); c.beginPath(); c.rect(ALF.x0, ALF.y0, ALF.x1 - ALF.x0, ALF.y1 - ALF.y0); c.arc(X, AC, R2 + 4, 0, Math.PI * 2); c.clip('evenodd');
    c.strokeStyle = ALMAGRA; c.lineWidth = 3.5; c.lineCap = 'round';
    for (const v of vines) { if (!v.length) continue; c.beginPath(); v.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
    for (const [x, y, a, col] of leaves) { c.fillStyle = col; c.beginPath(); c.ellipse(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 9, 4, a, 0, Math.PI * 2); c.fill(); }
    // rosettes in the top corners of the alfiz
    for (const [x, y] of [[ALF.x0 + 52, ALF.y0 + 52], [ALF.x1 - 52, ALF.y0 + 52]]) {
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.fillStyle = k % 2 ? GREEN : ALMAGRA; c.beginPath(); c.ellipse(x + Math.cos(a) * 17, y + Math.sin(a) * 17, 14, 6, a, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = OCHRE; c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill();
      c.strokeStyle = ALMAGRA; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 38, 0, Math.PI * 2); c.stroke();
    }
    c.restore();
  }, { reveal: 'fade' });
  // the tiled dado either side of the arch, in smaller tiles
  const ds = 52;
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? TS : X + JW + 30, x1 = s < 0 ? X - JW - 30 : W - TS;
    const y0 = PLINTH - 40 - ds * 4;
    Q.add('wall', 8.0 + (s > 0 ? 0.3 : 0), 0.9, B(x0, y0 - 14, x1, PLINTH - 40), (c) => {
      c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, ds * 4); c.clip();
      for (let j = 0; j < 4; j++) for (let x = s < 0 ? x1 - ds : x0, i = 0; s < 0 ? x > x0 - ds : x < x1; x += s < 0 ? -ds : ds, i++) tileArt(c, x, y0 + j * ds, ds, i + j + 1);
      c.restore();
      c.fillStyle = ALMAGRA; c.fillRect(x0, y0 - 12, x1 - x0, 12);
      c.fillStyle = CREAM; c.fillRect(x0, y0 - 14, x1 - x0, 3);
    }, { reveal: s < 0 ? 'wipeL' : 'wipe' });
  }
  // the plinth: a red step across the whole wall, the threshold of the arch
  Q.add('wall', 8.4, 0.8, B(TS, PLINTH - 42, W - TS, PLINTH + 6), (c) => {
    c.fillStyle = ALMAGRA; c.fillRect(TS, PLINTH - 40, W - 2 * TS, 40);
    c.fillStyle = ALMAGRA_D; c.fillRect(TS, PLINTH - 10, W - 2 * TS, 10);
    c.fillStyle = PLASTER; c.fillRect(X - JW - 6, PLINTH - 40, 2 * JW + 12, 10);
  }, { reveal: 'wipe' });
}
const WASH = (() => { const r = rng(41), out = []; for (let i = 0; i < 26; i++) out.push([r.range(TS, W - TS), r.range(TS, PLINTH), r.range(60, 180), r.range(20, 60)]); return out; })();

// the arch: cream plaster in the lobes, the striped voussoirs set one by one,
// the keystone ring, the marble columns and their capitals
function arch(Q) {
  Q.add('arch', 7.2, 0.6, B(X - R2 - 4, AC - R2 - 4, X + R2 + 4, SPRING + 30), (c) => {
    c.save(); c.beginPath(); c.rect(0, 0, W, SPRING + 2); c.clip();
    c.beginPath(); c.arc(X, AC, R + LOBE + 14, 0, Math.PI * 2); sub(c, OPEN);
    c.fillStyle = PLASTER; c.fill('evenodd'); c.restore();
    c.beginPath(); OPEN.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.strokeStyle = ALMAGRA_D; c.lineWidth = 3; c.stroke();
  }, { reveal: 'fade' });
  const n = 27, ri = R + LOBE + 12;
  const E0 = A0 - 0.16, E1 = A1 + 0.16; // carried down to the springing line outside
  for (let i = 0; i < n; i++) {
    const a = E0 + ((E1 - E0) * i) / n, b = E0 + ((E1 - E0) * (i + 1)) / n;
    const pts = [];
    for (let k = 0; k <= 6; k++) pts.push([X + Math.cos(a + (b - a) * k / 6) * ri, AC + Math.sin(a + (b - a) * k / 6) * ri]);
    for (let k = 6; k >= 0; k--) pts.push([X + Math.cos(a + (b - a) * k / 6) * R2, AC + Math.sin(a + (b - a) * k / 6) * R2]);
    const red = i % 2 === 0;
    const m = (a + b) / 2;
    const bx = X + Math.cos(m) * (ri + R2) / 2, by = AC + Math.sin(m) * (ri + R2) / 2;
    Q.add('arch', 7.4 + Math.min(i, n - 1 - i) * 0.12, 0.5, B(bx - 90, by - 90, bx + 90, by + 90), (c) => {
      c.save(); c.beginPath(); c.rect(0, 0, W, SPRING + 2); c.clip();
      c.fillStyle = red ? ALMAGRA : CREAM; poly(c, pts); c.fill();
      // a brick line or a painted dot in each
      if (red) { c.strokeStyle = ALMAGRA_D; c.lineWidth = 1.5; c.beginPath(); for (const f of [0.33, 0.66]) { const rr = ri + (R2 - ri) * f; c.moveTo(X + Math.cos(a + 0.02) * rr, AC + Math.sin(a + 0.02) * rr); c.lineTo(X + Math.cos(b - 0.02) * rr, AC + Math.sin(b - 0.02) * rr); } c.stroke(); }
      else { c.fillStyle = ALMAGRA; c.beginPath(); c.arc(bx, by, 7, 0, Math.PI * 2); c.fill(); c.fillStyle = OCHRE; c.beginPath(); c.arc(bx, by, 3, 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = INK; c.lineWidth = 1.6; poly(c, pts); c.stroke();
      c.restore();
    }, { reveal: 'pop', ease: 'back' });
  }
  // the extrados: a dark line and a cream bead
  Q.add('arch', 8.8, 0.8, B(X - R2 - 10, AC - R2 - 10, X + R2 + 10, SPRING + 30), (c) => {
    c.save(); c.beginPath(); c.rect(0, 0, W, SPRING + 2); c.clip();
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(X, AC, R2 + 2, A0 - 0.3, A1 + 0.3); c.stroke();
    c.strokeStyle = CREAM; c.lineWidth = 3; c.setLineDash([2, 9]); c.lineCap = 'round'; c.beginPath(); c.arc(X, AC, R2 + 9, A0 - 0.3, A1 + 0.3); c.stroke(); c.setLineDash([]);
    c.restore();
  }, { reveal: 'fade' });
  // the columns: white marble shafts, carved capitals, bases on the step
  for (const s of [-1, 1]) {
    const cx = X + s * (JW + 4);
    Q.add('arch', 8.2 + (s > 0 ? 0.15 : 0), 1.0, B(cx - 30, SPRING - 10, cx + 30, PLINTH), (c) => {
      const top = SPRING + 34, bot = PLINTH - 52;
      c.fillStyle = '#f5efe3'; c.fillRect(cx - 11, top, 22, bot - top);
      c.fillStyle = '#d9cfbe'; c.fillRect(cx + 3, top, 8, bot - top);
      c.strokeStyle = '#b9ab95'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 4, top); c.lineTo(cx - 6, bot); c.stroke();
      // the capital: a block of acanthus with an abacus
      c.fillStyle = '#f5efe3'; poly(c, [[cx - 12, top], [cx + 12, top], [cx + 20, top - 26], [cx - 20, top - 26]]); c.fill();
      c.fillStyle = '#d9cfbe'; for (const dx of [-12, 0, 12]) { c.beginPath(); c.ellipse(cx + dx, top - 12, 5, 9, 0, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#f5efe3'; c.fillRect(cx - 24, top - 36, 48, 10);
      c.fillStyle = ALMAGRA; c.fillRect(cx - 24, top - 30, 48, 3);
      // the base
      c.fillStyle = '#f5efe3'; c.fillRect(cx - 16, bot, 32, 8); c.fillRect(cx - 20, bot + 8, 40, 10);
      c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(cx - 11, top, 22, bot - top); c.strokeRect(cx - 24, top - 36, 48, 10); c.strokeRect(cx - 20, bot + 8, 40, 10);
    }, { reveal: 'rise' });
  }
}

// orange trees either side, set in the albero of the patio, hung with fruit
function trees(Q, r) {
  for (const [x, s] of [[230, 1], [1370, 1.08]]) {
    const foot = PLINTH + 6;
    const blobs = [];
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; blobs.push([x + Math.cos(a) * 70 * s, 1120 + Math.sin(a) * 56 * s, r.range(56, 74) * s]); }
    blobs.push([x, 1110, 84 * s]);
    const fruit = []; for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 120 * s; fruit.push([x + Math.cos(a) * d, 1120 + Math.sin(a) * d * 0.78, r.range(7, 10)]); }
    const glints = blobs.map(([bx, by, br]) => [bx - br * 0.3, by - br * 0.35, br * 0.35]);
    const t0 = 8.8 + (x > 800 ? 0.25 : 0);
    Q.add('trees', t0, 0.8, B(x - 30, 1150, x + 30, foot + 4), (c) => {
      c.fillStyle = '#6b4630'; poly(c, [[x - 9, foot], [x + 9, foot], [x + 6, 1150], [x - 6, 1150]]); c.fill();
      c.fillStyle = '#4a2e20'; c.fillRect(x + 1, 1150, 5, foot - 1150);
      // the round bed of white lime around the trunk
      c.fillStyle = '#f4ecd8'; c.beginPath(); c.ellipse(x, foot - 2, 40, 7, 0, 0, Math.PI * 2); c.fill();
    }, { reveal: 'rise' });
    Q.add('trees', t0 + 0.3, 0.9, B(x - 220 * s, 960, x + 220 * s, 1260), (c) => {
      c.fillStyle = LEAF_D; for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx + 6, by + 8, br, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = LEAF; for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx, by, br * 0.92, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = LEAF_L; for (const [bx, by, br] of glints) { c.beginPath(); c.arc(bx, by, br, 0, Math.PI * 2); c.fill(); }
    }, { reveal: 'pop' });
    Q.add('trees', t0 + 0.9, 0.6, B(x - 200 * s, 960, x + 200 * s, 1260), (c) => {
      for (const [fx, fy, fr] of fruit) {
        c.fillStyle = ORANGE; c.beginPath(); c.arc(fx, fy, fr, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffc25a'; c.beginPath(); c.arc(fx - fr * 0.3, fy - fr * 0.3, fr * 0.35, 0, Math.PI * 2); c.fill();
      }
    }, { reveal: 'pop' });
  }
}

// ================================================================ the foot of the poster
// the flounces of a flamenco dress: three tiers of red, spotted white, each
// with a scalloped hem, swept across under the name
const FL = (x, k) => 1806 + k * 24 * (0.4 + (x - 140) / 1330) + Math.sin(((x - 140) / 1330) * Math.PI * 2.4 + 0.4) * 14;
function title(Q, r) {
  Q.type('title', 'FIESTAS DE PRIMAVERA', X, 1508, { family: '"Yeseva One", serif', size: 40, color: ALMAGRA, align: 'center', track: 0.26, t: 10.2, gap: 0.04, d: 0.5, reveal: 'fade' });
  // small ornaments: a fan either side of that line
  for (const s of [-1, 1]) {
    const x = X + s * 470, y = 1496;
    Q.add('title', 10.6, 0.6, B(x - 40, y - 40, x + 40, y + 20), (c) => {
      for (let k = 0; k < 9; k++) { const a = Math.PI + 0.25 + (k / 8) * (Math.PI - 0.5); c.fillStyle = k % 2 ? RED : INK; c.beginPath(); c.moveTo(x, y + 12); c.arc(x, y + 12, 34, a - 0.17, a + 0.17); c.fill(); }
      c.fillStyle = OCHRE; c.beginPath(); c.arc(x, y + 12, 5, 0, Math.PI * 2); c.fill();
    }, { reveal: 'pop' });
  }
  // the flounces, back tier first: they flare from left to right like a
  // skirt caught in a turn, each with a scalloped hem and a lace edge
  for (let k = 0; k < 3; k++) {
    const x0 = 140 + k * 40, x1 = 1470 - k * 10;
    const flare = (x) => 0.35 + 0.75 * ((x - x0) / (x1 - x0));
    const top = [], hem = [], lace = [];
    for (let x = x0; x <= x1; x += 6) top.push([x, FL(x, k) - 30 * flare(x)]);
    const per = 36;
    for (let x = x1; x >= x0; x -= 2) { const ph = ((x - x0) % per) / per, f = flare(x); hem.push([x, FL(x, k) + 14 * f + Math.sin(ph * Math.PI) * 14 * f]); }
    for (let x = x0; x <= x1; x += 2) { const ph = ((x - x0) % per) / per, f = flare(x); lace.push([x, FL(x, k) + 14 * f + Math.sin(ph * Math.PI) * 14 * f]); }
    const shape = [...top, ...hem];
    const dots = []; for (let x = x0 + 16; x < x1 - 10; x += 22) { const f = flare(x); for (const dy of [-0.55, 0.1]) dots.push([x + (dy > 0 ? 11 : 0), FL(x, k) + dy * 26 * f, 2.4 + 2.4 * f]); }
    const folds = []; for (let x = x0 + per / 2; x < x1; x += per) { const f = flare(x); folds.push([x, FL(x, k) - 22 * f, FL(x, k) + 22 * f]); }
    Q.add('title', 9.6 + k * 0.35, 1.2, B(x0 - 10, 1700, x1 + 10, 1900), (c) => {
      c.fillStyle = [ALMAGRA_D, '#b51e25', RED][k]; poly(c, shape); c.fill();
      c.strokeStyle = 'rgba(80,10,12,.32)'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath();
      for (const [x, y0, y1] of folds) { c.moveTo(x, y0); c.quadraticCurveTo(x + 6, (y0 + y1) / 2, x, y1); }
      c.stroke();
      c.fillStyle = '#fbf3e6'; for (const [x, y, rr] of dots) { c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = INK; c.lineWidth = 2; poly(c, shape); c.stroke();
      c.strokeStyle = '#fbf3e6'; c.lineWidth = 2; c.setLineDash([3, 4]); c.beginPath(); lace.forEach(([x, y], i) => (i ? c.lineTo(x, y - 4) : c.moveTo(x, y - 4))); c.stroke(); c.setLineDash([]);
    }, { reveal: 'wipe', ease: 'inOut' });
  }
  // the name, set letter by letter, red with a black shadow
  Q.type('title', 'Sevilla', X, 1758, { family: '"Yeseva One", serif', size: 300, color: ALMAGRA, shadow: INK, sx: 7, sy: 7, align: 'center', track: 0.01, t: 11.0, gap: 0.14, d: 0.8 });
  // the black shawl's edge along the foot, embroidered with roses
  const roses = []; for (let x = 200; x < 1400; x += 120) roses.push([x + r.range(-10, 10), 1899]);
  Q.add('title', 12.4, 0.9, B(TS, 1880, W - TS, 1916), (c) => {
    c.fillStyle = INK; c.fillRect(TS, 1886, W - 2 * TS, 26);
    for (const [x, y] of roses) {
      c.fillStyle = '#e8566a'; c.beginPath(); c.arc(x, y, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f7d6dc'; c.beginPath(); c.arc(x - 2, y - 2, 3.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#4f9a5a'; c.beginPath(); c.ellipse(x - 15, y + 2, 7, 3, 0.3, 0, Math.PI * 2); c.ellipse(x + 15, y + 2, 7, 3, -0.3, 0, Math.PI * 2); c.fill();
    }
  }, { reveal: 'wipe' });
}

// ================================================================ what moves
function life(p, r) {
  // the feria lanterns: two strings across the view, swaying
  const strings = [
    { x0: VIEW.x, x1: VIEW.x + VIEW.w, y: 520, sag: 70, n: 13, ph: 0 },
    { x0: VIEW.x, x1: VIEW.x + VIEW.w, y: 610, sag: 90, n: 11, ph: 1.7 },
  ];
  const cols = [[RED, '#fff'], ['#2f8a5a', '#fff'], ['#fff', RED], ['#f2c94c', '#2f8a5a'], [RED, '#f2c94c']];
  p.live('lanterns', {
    t: 9.4, d: 1.2, reveal: 'fall', box: { x: VIEW.x, y: 470, w: VIEW.w, h: 260 },
    draw: (c, time) => {
      for (const s of strings) {
        const sw = Math.sin(time * 0.9 + s.ph) * 4;
        const y = (x) => s.y + s.sag * (1 - (((x - s.x0) / (s.x1 - s.x0)) * 2 - 1) ** 2) + sw * Math.sin(((x - s.x0) / (s.x1 - s.x0)) * Math.PI);
        c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath();
        for (let x = s.x0; x <= s.x1; x += 30) (x === s.x0 ? c.moveTo(x, y(x)) : c.lineTo(x, y(x)));
        c.stroke();
        for (let i = 1; i < s.n; i++) {
          const x = s.x0 + ((s.x1 - s.x0) * i) / s.n, yy = y(x) + 4, [a, b] = cols[(i + (s.ph ? 2 : 0)) % cols.length];
          const tilt = Math.sin(time * 1.4 + i + s.ph) * 0.08;
          c.save(); c.translate(x, yy); c.rotate(tilt);
          c.fillStyle = a; c.beginPath(); c.ellipse(0, 16, 11, 16, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = b; c.beginPath(); c.arc(-4, 11, 2.6, 0, Math.PI * 2); c.arc(4, 19, 2.6, 0, Math.PI * 2); c.arc(-3, 24, 2.2, 0, Math.PI * 2); c.fill();
          c.fillStyle = INK; c.fillRect(-5, -1, 10, 3); c.fillRect(-4, 31, 8, 3);
          c.restore();
        }
      }
    },
  });
  // a rowing boat on the canal and pigeons over the plaza
  const doves = []; for (let i = 0; i < 7; i++) doves.push({ cx: r.range(560, 1050), cy: r.range(700, 960), R: r.range(40, 120), w: r.range(0.3, 0.6) * (r.chance(0.5) ? 1 : -1), ph: r() * 7 });
  p.live('lanterns', {
    t: 9.8, d: 1.0, reveal: 'fade', box: VIEW,
    draw: (c, time) => {
      const u = ((time * 0.012 + 0.32) % 1), x = VIEW.x + 60 + u * (VIEW.w - 120);
      const y = (BENCH(x) + CANAL(x)) / 2 + 8;
      c.fillStyle = '#f7f0df'; poly(c, [[x - 26, y - 8], [x + 26, y - 8], [x + 20, y], [x - 20, y]]); c.fill();
      c.fillStyle = COBALT; c.fillRect(x - 24, y - 9, 48, 3);
      c.fillStyle = RED; c.fillRect(x - 4, y - 24, 9, 15);
      c.fillStyle = '#c98a5a'; c.beginPath(); c.arc(x, y - 28, 4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = MANG; c.lineWidth = 2; const ow = Math.sin(time * 2.4) * 8;
      c.beginPath(); c.moveTo(x - 14, y - 2 + ow * 0.3); c.lineTo(x + 18, y - 18 - ow * 0.3); c.stroke();
      c.lineCap = 'round';
      // the fountain's jets, rising and falling a little
      const jy = 1272 - 92, h = 30 + Math.sin(time * 2.2) * 4;
      c.strokeStyle = 'rgba(240,248,250,.9)'; c.lineWidth = 2.4; c.beginPath();
      for (const s of [-1, -0.5, 0.5, 1]) { c.moveTo(X, jy - 4); c.quadraticCurveTo(X + s * 14, jy - h, X + s * 30, jy + 30); }
      c.moveTo(X, jy - 2); c.lineTo(X, jy - h - 6);
      c.stroke();
      for (const d of doves) {
        const a = time * d.w + d.ph, dx = d.cx + Math.cos(a) * d.R, dy = d.cy + Math.sin(a) * d.R * 0.35, f = Math.sin(time * 7 + d.ph) * 4;
        c.strokeStyle = '#f4f1ea'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(dx - 10, dy - f); c.quadraticCurveTo(dx - 4, dy - 6, dx, dy); c.quadraticCurveTo(dx + 4, dy - 6, dx + 10, dy - f); c.stroke();
      }
    },
  });
  // the silk fringe of the shawl, hanging over the tiles and stirring
  const strands = []; for (let x = TS + 4; x < W - TS; x += 7) strands.push([x, r.range(70, 86), r() * 6]);
  p.live('fringe', {
    t: 12.8, d: 1.0, reveal: 'fall', box: { x: TS, y: 1900, w: W - 2 * TS, h: 96 },
    draw: (c, time) => {
      c.strokeStyle = '#f3e4c4'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
      for (const [x, len, ph] of strands) {
        const sw = Math.sin(time * 1.3 + x * 0.012 + ph * 0.2) * 5;
        c.moveTo(x, 1910); c.quadraticCurveTo(x + sw * 0.3, 1910 + len * 0.5, x + sw, 1910 + len);
      }
      c.stroke();
      c.strokeStyle = 'rgba(160,120,70,.6)'; c.lineWidth = 1; c.beginPath();
      for (const [x, len, ph] of strands) { const sw = Math.sin(time * 1.3 + x * 0.012 + ph * 0.2) * 5; c.moveTo(x + 1.5, 1912); c.quadraticCurveTo(x + 1.5 + sw * 0.3, 1910 + len * 0.5, x + 1.5 + sw, 1910 + len - 4); }
      c.stroke();
    },
  });
}
