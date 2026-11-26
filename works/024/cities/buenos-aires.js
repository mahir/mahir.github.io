// Buenos Aires: a fileteado porteño sign. On a black ground, painted scrolls of
// acanthus in red, green, blue and gold, each shaded in flat steps with a white
// line along its light edge, curl round a medallion. In it, the Obelisk stands
// at the end of the Avenida 9 de Julio under its jacarandas, with the Palacio
// Barolo and the Congress dome behind; in front, Caminito's painted tin houses
// and a couple dancing a tango under a street lamp. Shaded letters and a ribbon.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, shade, lerp, clamp, poly, rng } from '../kit.js';

const BLACK = '#15110e', INK = '#0b0907';
// the scroll paints, darkest to lightest
const RED = ['#5a0c12', '#9c1820', '#d0302b', '#ee6f52', '#ffc9ad'];
const GREEN = ['#0d3620', '#1c6537', '#369a52', '#86cc74', '#e2f5c4'];
const BLUE = ['#0d2a52', '#1d5a9c', '#4592d4', '#99cdf0', '#ecf8ff'];
const GOLD = ['#553304', '#a06a0c', '#dba52a', '#f6d870', '#fff5cd'];
const CELESTE = '#7cc0ea', CREAM = '#fff4d6';
// the scene
const SKY = ['#2f7fc4', '#4c97d3', '#6eaedc', '#93c4e2', '#b9d8e4', '#dfe3d6', '#f4dcb6', '#f6c897'];
const STONE = ['#eadcc0', '#dfcba7', '#d3bd98', '#efe4cc', '#c9b393', '#e2d2b4'];
const SLATE = '#4f5a6e', SLATE_L = '#6d7a8f';
const JAC = ['#7d62bf', '#9479cf', '#b29ce0', '#cdbcef'];
const ASPHALT = '#8d8a86', ASPHALT_D = '#77746f';
const TIN = ['#d63a2c', '#f2c230', '#2f7fc0', '#3d9a4e', '#e87a2a', '#7bc4e4', '#c94a8a', '#f4e6c4'];

export const city = {
  id: 'buenos-aires', name: 'Buenos Aires', wall: '#2a1d16',
  alt: 'A fileteado sign of painted acanthus scrolls round a medallion in which the Obelisk stands on the Avenida 9 de Julio among jacarandas, with the Palacio Barolo and the Congress dome behind, the painted tin houses of Caminito, a street lamp and a couple dancing a tango',
  google: 'family=Berkshire+Swash',
  fonts: [['400 190px "Berkshire Swash"', 'Buenos Aires'], ['400 48px "Berkshire Swash"', 'la Reina del Plata']],
  build,
};

// the medallion: a squarish oval (a superellipse)
const MX = 800, MY = 760, MA = 505, MB = 610, MN = 3.2;
function medPts(ins = 0, n = 240) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = -Math.PI / 2 + (i / n) * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t);
    pts.push([MX + (MA - ins) * Math.sign(ct) * Math.abs(ct) ** (2 / MN), MY + (MB - ins) * Math.sign(st) * Math.abs(st) ** (2 / MN)]);
  }
  return pts;
}
// the half-width of the medallion's opening at a height
function medHalf(y) { const k = Math.abs((y - MY) / MB); return k >= 1 ? 0 : MA * (1 - k ** MN) ** (1 / MN); }

// the avenue in perspective: X across (meters, 0 the middle), Z away, Y up
const HY = 880, VX = 800, F = 620, CAM = 14;
const P = (X, Z, Y = 0) => [VX + (X * F) / Z, HY + ((CAM - Y) * F) / Z];

function build() {
  const p = new Plate({ paper: BLACK, seed: 1536 });
  const r = p.r;
  p.clip = { x: MX - MA - 4, y: MY - MB - 4, w: 2 * MA + 8, h: 2 * MB + 8 };
  // few layers: each one is a full canvas laid down every frame
  p.stack('sky', 'far', 'ground', 'bld', 'treesFar', 'obelisk', 'treesNear', 'street', 'houses', 'couple', 'mat', 'ring', 'orn', 'title', 'border');
  for (const n of ['mat', 'ring', 'orn', 'title', 'border']) p.layer(n, { clip: false });

  mat(p);
  border(p);
  ring(p);
  ornament(p);
  sky(p, r);
  far(p, r);
  barolo(p);
  congreso(p);
  ground(p, r);
  avenue(p, r);
  jacarandas(p, r);
  obelisk(p);
  traffic(p);
  street(p, r);
  houses(p, r);
  lamp(p);
  couple(p);
  title(p);
  ribbon(p);
  finish(p, r);
  p.layers.bld.marks.sort((a, b) => a.t - b.t);
  return p;
}

// ================================================================ fileteado drawing
// a curve whose bend tightens toward its end, so it rolls into a curl.
// heading h (radians), length L, bend k0 at the start and k1 at the end; dir +1 or -1
function curl(x, y, h, L, k0, k1, dir, pw = 3, n = 90) {
  const pts = [];
  let a = h;
  const ds = L / n;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    pts.push([x, y, a, s]);
    a += dir * (k0 + (k1 - k0) * s ** pw) * ds;
    x += Math.cos(a) * ds; y += Math.sin(a) * ds;
  }
  return pts;
}
// a closed loop of points with their headings
function loop(pts) {
  const n = pts.length;
  return pts.map(([x, y], i) => {
    const a = pts[(i + 1) % n], b = pts[(i - 1 + n) % n];
    return [x, y, Math.atan2(a[1] - b[1], a[0] - b[0]), i / (n - 1)];
  });
}

// a band along a curve, width from a profile of s, shaded across in flat steps
// from its dark edge to its light one, with a black outline and a fine light line
function band(c, pts, wf, cols, o = {}) {
  if (pts.length < 2) return;
  const side = o.flip ? -1 : 1;
  const E = pts.map(([x, y, a, s]) => [x, y, -Math.sin(a) * side, Math.cos(a) * side, wf(s) / 2]);
  const at = (f) => E.map(([x, y, nx, ny, w]) => [x + nx * w * f, y + ny * w * f]);
  const n = cols.length;
  for (let i = 0; i < n; i++) {
    const f0 = -1 + (2 * i) / n, f1 = i === n - 1 ? 1 : -1 + (2 * (i + 1.3)) / n;
    const A = at(f0), B = at(f1);
    c.fillStyle = cols[i];
    c.beginPath(); A.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y)));
    for (let k = B.length - 1; k >= 0; k--) c.lineTo(B[k][0], B[k][1]);
    c.closePath(); c.fill();
  }
  const A = at(-1), B = at(1);
  c.strokeStyle = o.ink || INK; c.lineWidth = o.lw ?? 2.2; c.lineJoin = 'round';
  c.beginPath(); A.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y)));
  for (let k = B.length - 1; k >= 0; k--) c.lineTo(B[k][0], B[k][1]);
  if (!o.open) c.closePath();
  c.stroke();
  if (o.hi !== false) {
    const Hh = at(o.hiAt ?? 0.6);
    const a0 = Math.floor(Hh.length * (o.hiStart ?? 0.05)), a1 = Math.floor(Hh.length * (o.hiEnd ?? 0.8));
    if (a1 - a0 > 1) {
      c.strokeStyle = o.hiCol || 'rgba(255,255,255,.92)'; c.lineWidth = o.hlw ?? 1.5; c.lineCap = 'round';
      c.beginPath(); for (let k = a0; k < a1; k++) (k > a0 ? c.lineTo(Hh[k][0], Hh[k][1]) : c.moveTo(Hh[k][0], Hh[k][1]));
      c.stroke();
    }
  }
}

// an acanthus scroll grown to q (0 to 1): the main band rolls into a curl and
// leaves sweep back off its outer side, each curling at its tip
function acanthus(c, s, q = 1) {
  const { x, y, h, L, wd, dir, cols } = s;
  // the curves are fixed, so they are worked out once
  const cache = (s.cache ||= {});
  const once = (k, f) => (cache[k] ||= f());
  const main = once('main', () => curl(x, y, h, L, s.k0 ?? 0.001, s.k1 ?? 0.06, dir, s.pw ?? 3.4));
  const wf = (t) => wd * (0.8 + 0.25 * Math.sin(Math.min(1, t * 4) * Math.PI / 2)) * (1 - t ** 1.1 * 0.9);
  const leaves = s.leaves ?? [0.1, 0.24, 0.38, 0.52, 0.64];
  leaves.forEach((t, i) => {
    const lq = clamp((q - t) / 0.3);
    if (lq <= 0) return;
    const k = Math.floor(t * (main.length - 1));
    const [px, py, a] = main[k];
    const w = wf(t) / 2;
    const nx = Math.sin(a) * dir, ny = -Math.cos(a) * dir; // the outer side
    const len = wd * (2.6 - i * 0.3) * (s.leafK ?? 1);
    const la = a - dir * (0.55 + i * 0.06);
    const leaf = once(`leaf${i}`, () => curl(px + nx * w * 0.2, py + ny * w * 0.2, la, len, 0.004, 0.21, -dir, 3.2, 44));
    const bw = wd * (1.05 - i * 0.1) * (s.leafW ?? 1);
    const lc = s.leafCols ? s.leafCols[i % s.leafCols.length] : cols;
    band(c, leaf.slice(0, Math.max(2, Math.ceil(leaf.length * lq))), (u) => bw * (1 - u) ** 0.75 * clamp(0.6 + u * 6, 0, 1) + 2, lc.slice(0, 4), { flip: dir < 0, lw: 1.7, hlw: 1.2, hiEnd: 0.75 });
  });
  // a small curl rolling the other way at the root, so the scroll ends in two eyes
  if (s.root !== false) {
    const rq = clamp(q / 0.25);
    const rt = once('root', () => curl(x + Math.cos(h) * wd * 0.3, y + Math.sin(h) * wd * 0.3, h + Math.PI + dir * 0.5, wd * 2.4, 0.01, 0.1 * 60 / wd, dir, 1.6, 40));
    band(c, rt.slice(0, Math.max(2, Math.ceil(rt.length * rq))), (u) => wd * 0.78 * (1 - u * 0.85), cols, { flip: dir < 0, lw: 2.2, hlw: 1.4, hiEnd: 0.6 });
  }
  band(c, main.slice(0, Math.max(2, Math.ceil(main.length * q))), wf, cols, { flip: dir > 0, lw: 2.4, hlw: 1.7 });
  if (q >= 1) {
    const e = main[main.length - 1];
    c.fillStyle = cols[4]; c.beginPath(); c.arc(e[0], e[1], wd * 0.08 + 1.6, 0, Math.PI * 2); c.fill();
  }
}
const acBox = (s) => {
  const main = curl(s.x, s.y, s.h, s.L, s.k0 ?? 0.001, s.k1 ?? 0.06, s.dir, s.pw ?? 3.4);
  return boxOf(main.map(([x, y]) => [x, y]), s.wd * 3.2);
};
// a scroll and its mirror image across the middle of the sheet
function pair(p, layer, s, t, d = 1.8) {
  const b = acBox(s);
  p.group(layer, b, (c, q) => acanthus(c, s, q), { t, d, reveal: 'draw', ease: 'inOut' });
  p.group(layer, { x: W - b.x - b.w, y: b.y, w: b.w, h: b.h }, (c, q) => { c.translate(W, 0); c.scale(-1, 1); acanthus(c, s, q); }, { t: t + 0.12, d, reveal: 'draw', ease: 'inOut' });
}

// a painted rose: shaded rounds of petals, light lines for their edges
function rose(c, x, y, rad, cols = RED) {
  for (let i = 0; i < 4; i++) {
    const rr = rad * (1 - i * 0.2);
    c.fillStyle = cols[i]; c.beginPath(); c.arc(x + i * rad * 0.04, y - i * rad * 0.06, rr, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = cols[4]; c.lineWidth = 1.6; c.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3 + 0.4, rr = rad * (0.85 - i * 0.14);
    c.beginPath(); c.arc(x + Math.cos(a) * rad * 0.06, y + Math.sin(a) * rad * 0.06, rr, a, a + 2.2); c.stroke();
  }
  c.fillStyle = cols[4]; c.beginPath(); c.arc(x + rad * 0.1, y - rad * 0.15, rad * 0.09, 0, Math.PI * 2); c.fill();
}
// a pointed leaf, shaded in two, with a light vein
function leaf(c, x, y, len, a, cols = GREEN) {
  c.save(); c.translate(x, y); c.rotate(a);
  const w = len * 0.32;
  c.fillStyle = cols[1]; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.45, -w, len, 0); c.quadraticCurveTo(len * 0.45, w, 0, 0); c.fill();
  c.fillStyle = cols[2]; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.45, -w, len, 0); c.quadraticCurveTo(len * 0.5, -w * 0.15, 0, 0); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.45, -w, len, 0); c.quadraticCurveTo(len * 0.45, w, 0, 0); c.stroke();
  c.strokeStyle = cols[4]; c.lineWidth = 1.2; c.beginPath(); c.moveTo(len * 0.1, 0); c.quadraticCurveTo(len * 0.5, -w * 0.12, len * 0.85, 0); c.stroke();
  c.restore();
}
// pearls: little white beads with a shadow
function pearl(c, x, y, rad, col = CREAM) {
  c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.arc(x + rad * 0.25, y + rad * 0.3, rad, 0, Math.PI * 2); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.35, 0, Math.PI * 2); c.fill();
}

// ================================================================ the black ground, with the medallion's opening
function mat(p) {
  const pts = medPts(0);
  p.group('mat', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = BLACK;
    c.beginPath(); c.rect(0, 0, W, H);
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath(); c.fill('evenodd');
  }, { t: 0, d: 0.05, reveal: 'none' });
}

// ================================================================ the painted border: two fine lines and corner curls
function border(p) {
  const lines = (ins) => [[ins, ins], [W - ins, ins], [W - ins, H - ins], [ins, H - ins], [ins, ins]];
  p.pen('border', lines(30), GOLD[2], 3.2, { t: 0.1, d: 1.6, cap: 'square' });
  p.pen('border', lines(42), RED[2], 1.8, { t: 0.3, d: 1.6, cap: 'square' });
  // a curl into each corner
  p.group('border', { x: 0, y: 0, w: W, h: H }, (c, q) => {
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      c.save(); c.translate(sx > 0 ? 0 : W, sy > 0 ? 0 : H); c.scale(sx, sy);
      const cv = curl(54, 130, -Math.PI / 2, 120, 0.0, 0.11, 1, 2.2, 40);
      const cv2 = curl(130, 54, Math.PI, 120, 0.0, 0.11, -1, 2.2, 40);
      for (const pts of [cv, cv2]) {
        const m = Math.max(2, Math.ceil(pts.length * q));
        c.strokeStyle = GOLD[3]; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); pts.slice(0, m).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
      }
      if (q > 0.9) { pearl(c, 66, 66, 6, CREAM); pearl(c, 92, 56, 3.4, CELESTE); pearl(c, 56, 92, 3.4, CELESTE); }
      c.restore();
    }
  }, { t: 1.2, d: 1.2, reveal: 'draw', ease: 'inOut' });
}

// ================================================================ the medallion's painted ring
function ring(p) {
  const pts = loop(medPts(-14, 360));
  const n = pts.length;
  const half = Math.floor(n / 2);
  // drawn from the top both ways round to the foot
  p.group('ring', { x: MX - MA - 50, y: MY - MB - 50, w: 2 * MA + 100, h: 2 * MB + 100 }, (c, q) => {
    const m = Math.max(2, Math.ceil(half * q));
    const wf = () => 26;
    band(c, pts.slice(0, m + 1), wf, GOLD, { flip: true, lw: 2.2, hiAt: 0.55, hiStart: 0, hiEnd: 1, open: true });
    band(c, pts.slice(n - 1 - m), wf, GOLD, { flip: true, lw: 2.2, hiAt: 0.55, hiStart: 0, hiEnd: 1, open: true });
  }, { t: 0.4, d: 2.0, reveal: 'draw', ease: 'inOut' });
  // the fine lines inside and outside it
  const inner = medPts(4), outer = medPts(-36);
  p.group('ring', { x: MX - MA - 60, y: MY - MB - 60, w: 2 * MA + 120, h: 2 * MB + 120 }, (c) => {
    c.lineWidth = 3; c.strokeStyle = RED[2]; poly(c, inner); c.stroke();
    c.lineWidth = 1.4; c.strokeStyle = CELESTE; poly(c, medPts(10)); c.stroke();
    c.lineWidth = 2; c.strokeStyle = BLUE[3]; poly(c, outer); c.stroke();
  }, { t: 2.2, d: 0.8, reveal: 'fade' });
}

// ================================================================ the scrolls around the medallion
function ornament(p) {
  // green scrolls climbing the sides and rolling into the top corners
  pair(p, 'orn', { x: 140, y: 720, h: -Math.PI / 2 - 0.04, L: 600, wd: 52, dir: 1, cols: GREEN, k1: 0.05, leaves: [0.08, 0.2, 0.32, 0.44], leafCols: [GREEN, BLUE, GREEN, GOLD] }, 1.0, 2.2);
  // big red ones rising from beside the title and rolling in toward the medallion
  pair(p, 'orn', { x: 150, y: 1500, h: -Math.PI / 2 - 0.02, L: 600, wd: 64, dir: 1, cols: RED, k1: 0.05, leaves: [0.08, 0.2, 0.32, 0.44, 0.56], leafCols: [RED, GOLD, RED, GREEN, RED] }, 1.5, 2.2);
  // gold ones from the crest at the top
  pair(p, 'orn', { x: 740, y: 120, h: Math.PI + 0.12, L: 250, wd: 26, dir: 1, cols: GOLD, k1: 0.12, leaves: [0.18, 0.42], leafCols: [GOLD, RED] }, 2.6, 1.4);
  // small blue ones along the top from the corners
  pair(p, 'orn', { x: 150, y: 96, h: 0.02, L: 230, wd: 22, dir: 1, cols: BLUE, k1: 0.12, leaves: [0.2, 0.45], leafCols: [BLUE, GOLD], root: false }, 2.9, 1.3);
  // blue ones from the bottom corners
  pair(p, 'orn', { x: 70, y: 1920, h: -0.08, L: 400, wd: 40, dir: -1, cols: BLUE, k1: 0.07, leaves: [0.12, 0.3, 0.48], leafCols: [BLUE, GREEN, BLUE] }, 2.2, 1.8);
  // the crest: a rose between leaves over the top of the ring
  p.group('orn', { x: 680, y: 60, w: 240, h: 170 }, (c) => {
    leaf(c, 770, 140, 80, Math.PI + 0.5); leaf(c, 830, 140, 80, -0.5);
    leaf(c, 785, 120, 60, -Math.PI / 2 - 0.9, BLUE); leaf(c, 815, 120, 60, -Math.PI / 2 + 0.9, BLUE);
    rose(c, 800, 130, 38);
  }, { t: 3.1, d: 0.7, reveal: 'pop' });
  // a spray between the green and the red on each side: a rose, a bud and leaves
  for (const s of [1, -1]) {
    const X = (x) => (s > 0 ? x : W - x);
    p.group('orn', { x: Math.min(X(40), X(280)), y: 780, w: 240, h: 260 }, (c) => {
      leaf(c, X(150), 920, 90, s > 0 ? -2.2 : -0.94); leaf(c, X(150), 920, 80, s > 0 ? 2.4 : 0.74);
      leaf(c, X(150), 920, 70, s > 0 ? -0.5 : -2.64, BLUE); leaf(c, X(150), 920, 64, s > 0 ? 0.7 : 2.44, GOLD);
      rose(c, X(150), 912, 34, s > 0 ? RED : BLUE);
      pearl(c, X(96), 846, 5); pearl(c, X(212), 990, 5); pearl(c, X(206), 842, 3.5, CELESTE); pearl(c, X(92), 990, 3.5, CELESTE);
    }, { t: 3.4 + (s > 0 ? 0 : 0.2), d: 0.7, reveal: 'pop' });
  }
}

// ================================================================ the sky, in flat painted bands
function sky(p, r) {
  const y0 = MY - MB, y1 = HY + 4;
  const n = SKY.length;
  p.group('sky', { x: MX - MA, y: y0, w: 2 * MA, h: y1 - y0 }, (c) => {
    for (let i = 0; i < n; i++) {
      const a = lerp(y0, y1, (i / n) ** 0.8), b = lerp(y0, y1, ((i + 1) / n) ** 0.8);
      c.fillStyle = SKY[i]; c.fillRect(MX - MA, a, 2 * MA, b - a + 1);
    }
  }, { t: 0.5, d: 1.6, reveal: 'fall', ease: 'inOut' });
  // flat clouds with a lit top and a shaded foot
  const clouds = [[470, 330, 200], [1110, 260, 240], [860, 450, 150], [400, 560, 130], [1200, 520, 170]];
  clouds.forEach(([x, y, w], i) => {
    const puffs = [];
    const k = Math.round(w / 40);
    for (let j = 0; j < k; j++) {
      const t = (j + 0.5) / k;
      puffs.push([x - w / 2 + t * w, y - Math.sin(t * Math.PI) * w * 0.14 - r() * 8, w / k * (0.62 + Math.sin(t * Math.PI) * 0.35)]);
    }
    p.group('sky', { x: x - w / 2 - 40, y: y - w * 0.5, w: w + 80, h: w * 0.6 }, (c) => {
      c.save(); c.beginPath(); c.rect(x - w, y - w, 2 * w, w + 2); c.clip();
      c.fillStyle = INK; for (const [cx, cy, rr] of puffs) { c.beginPath(); c.arc(cx, cy, rr + 2.4, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#cfe4ef'; for (const [cx, cy, rr] of puffs) { c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#fbfaf2'; for (const [cx, cy, rr] of puffs) { c.beginPath(); c.arc(cx - rr * 0.12, cy - rr * 0.16, rr * 0.82, 0, Math.PI * 2); c.fill(); }
      c.restore();
      c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - w / 2 - 10, y); c.lineTo(x + w / 2 + 10, y); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.4;
      c.beginPath(); for (const [cx, cy, rr] of puffs) { c.moveTo(cx - rr * 0.6, cy - rr * 0.45); c.arc(cx, cy, rr * 0.75, Math.PI * 1.15, Math.PI * 1.6); } c.stroke();
    }, { t: 1.4 + i * 0.25, d: 1.2, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ================================================================ the far city on the horizon
function far(p, r) {
  const blocks = [];
  for (let x = MX - MA; x < MX + MA;) {
    const w = r.range(14, 40), h = r.range(18, 70) * (1 - Math.abs(x - VX) / 900);
    blocks.push([x, w, Math.max(10, h), r.int(0, 2)]);
    x += w - 2;
  }
  const cols = ['#a9a8c4', '#9c9bba', '#b6b3c9'];
  p.group('far', { x: MX - MA, y: HY - 90, w: 2 * MA, h: 100 }, (c) => {
    for (const [x, w, h, k] of blocks) {
      c.fillStyle = cols[k]; c.fillRect(x, HY - h, w, h + 4);
      c.fillStyle = 'rgba(70,64,110,.35)';
      for (let yy = HY - h + 5; yy < HY - 3; yy += 6) for (let xx = x + 3; xx < x + w - 3; xx += 5) c.fillRect(xx, yy, 2, 2.4);
    }
    c.strokeStyle = 'rgba(40,36,70,.5)'; c.lineWidth = 1;
    for (const [x, w, h] of blocks) c.strokeRect(x, HY - h, w, h + 4);
  }, { t: 2.0, d: 1.3, reveal: 'rise', ease: 'out' });
}

// the Palacio Barolo: an office block crowned by a tower and a domed lighthouse
function barolo(p) {
  const x = 585, base = HY + 20;
  const cream = '#e9d3ac', sh = '#c4a77e', line = '#3b2a22';
  p.group('far', { x: x - 110, y: 380, w: 220, h: base - 370 }, (c) => {
    const fillStroke = (pts, col) => { c.fillStyle = col; poly(c, pts); c.fill(); c.strokeStyle = line; c.lineWidth = 1.6; c.stroke(); };
    // the body
    fillStroke([[x - 90, base], [x - 90, 650], [x + 90, 650], [x + 90, base]], cream);
    fillStroke([[x + 90, base], [x + 90, 650], [x + 104, 656], [x + 104, base]], sh);
    // its cornice and the setback
    fillStroke([[x - 96, 652], [x + 108, 652], [x + 108, 640], [x - 96, 640]], sh);
    fillStroke([[x - 60, 640], [x - 60, 590], [x + 60, 590], [x + 60, 640]], cream);
    // the tower
    fillStroke([[x - 32, 590], [x - 32, 500], [x + 32, 500], [x + 32, 590]], cream);
    fillStroke([[x + 32, 590], [x + 32, 500], [x + 40, 504], [x + 40, 590]], sh);
    fillStroke([[x - 38, 502], [x + 44, 502], [x + 44, 492], [x - 38, 492]], sh);
    // the round lantern and its dome
    fillStroke([[x - 22, 492], [x - 22, 452], [x + 22, 452], [x + 22, 492]], cream);
    c.fillStyle = '#7c8a7a'; c.beginPath(); c.moveTo(x - 24, 452); c.quadraticCurveTo(x - 22, 414, x, 404); c.quadraticCurveTo(x + 22, 414, x + 24, 452); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x, 404); c.lineTo(x, 384); c.stroke();
    c.fillStyle = '#ffe6a0'; c.beginPath(); c.arc(x, 386, 3.2, 0, Math.PI * 2); c.fill();
    // windows: arched in the tower, rows in the body
    c.fillStyle = '#5b4a5e';
    for (const xx of [x - 20, x - 4, x + 12]) { c.fillRect(xx, 516, 8, 30); c.beginPath(); c.arc(xx + 4, 516, 4, Math.PI, 0); c.fill(); c.fillRect(xx, 552, 8, 26); }
    for (const xx of [x - 12, x + 4]) c.fillRect(xx, 462, 7, 22);
    for (let yy = 600; yy < 632; yy += 14) for (let xx = x - 52; xx < x + 52; xx += 12) c.fillRect(xx, yy, 6, 9);
    for (let yy = 664; yy < base - 10; yy += 15) for (let xx = x - 82; xx < x + 84; xx += 12) c.fillRect(xx, yy, 6, 9);
    c.fillStyle = sh; c.fillRect(x - 90, 650, 180, 3);
  }, { t: 2.6, d: 1.4, reveal: 'rise', ease: 'out' });
}

// the Congress: a long colonnaded palace and its green dome
function congreso(p) {
  const x = 1030, base = HY + 20;
  const stone = '#e4d6bf', sh = '#bfae94', line = '#3b2a22', dome = '#6fa58c', domeD = '#4d826c';
  p.group('far', { x: x - 200, y: 540, w: 400, h: base - 530 }, (c) => {
    c.lineWidth = 1.5; c.strokeStyle = line;
    const fs = (pts, col) => { c.fillStyle = col; poly(c, pts); c.fill(); c.stroke(); };
    // wings and the portico
    fs([[x - 190, base], [x - 190, 790], [x + 190, 790], [x + 190, base]], stone);
    fs([[x - 60, 790], [x, 760], [x + 60, 790]], stone);
    c.fillStyle = '#8a7a72'; for (let xx = x - 182; xx < x + 182; xx += 11) c.fillRect(xx, 800, 4, base - 806);
    c.fillStyle = sh; c.fillRect(x - 190, 790, 380, 6);
    // the drum with its columns
    fs([[x - 62, 790], [x - 62, 712], [x + 62, 712], [x + 62, 790]], stone);
    c.fillStyle = '#7b6c66'; for (let xx = x - 56; xx < x + 56; xx += 9) c.fillRect(xx, 722, 3.5, 60);
    fs([[x - 68, 716], [x + 68, 716], [x + 68, 706], [x - 68, 706]], sh);
    // the dome: green copper, its ribs, and the lantern
    c.fillStyle = dome; c.beginPath(); c.moveTo(x - 64, 706); c.bezierCurveTo(x - 64, 650, x - 30, 618, x, 614); c.bezierCurveTo(x + 30, 618, x + 64, 650, x + 64, 706); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = domeD; c.beginPath(); c.moveTo(x + 18, 706); c.bezierCurveTo(x + 22, 660, x + 12, 625, x, 614); c.bezierCurveTo(x + 30, 618, x + 64, 650, x + 64, 706); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(30,50,40,.7)'; c.lineWidth = 1.1;
    for (const k of [-0.7, -0.4, -0.1, 0.2, 0.5, 0.8]) { c.beginPath(); c.moveTo(x + k * 62, 706); c.quadraticCurveTo(x + k * 40, 640, x, 614); c.stroke(); }
    c.strokeStyle = line; c.lineWidth = 1.5;
    fs([[x - 9, 616], [x - 9, 590], [x + 9, 590], [x + 9, 616]], stone);
    c.fillStyle = dome; c.beginPath(); c.arc(x, 590, 10, Math.PI, 0); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x, 580); c.lineTo(x, 562); c.stroke();
  }, { t: 3.0, d: 1.4, reveal: 'rise', ease: 'out' });
}

// ================================================================ the avenue's ground: lanes, medians, crossings
function ground(p, r) {
  const y0 = HY, y1 = MY + MB;
  p.group('ground', { x: MX - MA, y: y0 - 2, w: 2 * MA, h: y1 - y0 + 2 }, (c) => {
    c.fillStyle = ASPHALT; c.fillRect(MX - MA, y0, 2 * MA, y1 - y0);
    // sidewalks and medians
    const strip = (xa, xb, col, z0 = 30, z1 = 3000) => { c.fillStyle = col; poly(c, [P(xa, z0), P(xb, z0), P(xb, z1), P(xa, z1)]); c.fill(); };
    strip(-82, -66, '#cdbfa7'); strip(66, 82, '#cdbfa7');
    strip(-40, -28, '#6c8d4f', 60); strip(28, 40, '#6c8d4f', 60);
    strip(-5, 5, '#6c8d4f', 60, 260); strip(-5, 5, '#6c8d4f', 340, 3000);
    // the obelisk's plaza
    c.fillStyle = '#c9bea6'; poly(c, [P(-24, 260), P(24, 260), P(24, 340), P(-24, 340)]); c.fill();
    c.fillStyle = '#7fa75a'; poly(c, [P(-16, 272), P(16, 272), P(16, 328), P(-16, 328)]); c.fill();
  }, { t: 3.4, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // lane lines and the crossings
  const lines = [];
  for (const X of [-58, -50, -16, 16, 50, 58]) for (let z = 34; z < 1400; z *= 1.16) lines.push([P(X, z), P(X, z * 1.07)]);
  const zebra = [];
  for (const zc of [150, 420]) for (let X = -64; X < 64; X += 4) { zebra.push([P(X, zc), P(X + 2, zc), P(X + 2, zc + zc * 0.05), P(X, zc + zc * 0.05)]); }
  p.group('ground', { x: MX - MA, y: HY, w: 2 * MA, h: MB }, (c) => {
    c.strokeStyle = '#f3ead2'; c.lineWidth = 1.6;
    c.beginPath(); for (const [a, b] of lines) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
    c.fillStyle = '#ece3cb'; for (const q of zebra) { poly(c, q); c.fill(); }
    c.strokeStyle = 'rgba(40,30,20,.35)'; c.lineWidth = 1;
    for (const X of [-82, -66, -40, -26, 26, 40, 66, 82]) { c.beginPath(); const a = P(X, 30), b = P(X, 3000); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  }, { t: 4.0, d: 0.9, reveal: 'fall', ease: 'inOut' });
}

// ================================================================ the buildings down both sides of the avenue
function avenue(p, r) {
  for (const side of [-1, 1]) {
    const layer = 'bld';
    const blds = [];
    let z = 46;
    while (z < 900) {
      const len = r.range(16, 34) * (z / 120) ** 0.35;
      const hgt = r.chance(0.2) ? r.range(42, 70) : r.range(20, 36);
      blds.push({ z0: z, z1: z + len, h: hgt, col: r.pick(STONE), mans: hgt < 40 && r.chance(0.55), bal: r.chance(0.7) });
      z += len;
    }
    // far to near, in four batches so each rises in its turn
    blds.reverse();
    const per = Math.ceil(blds.length / 4);
    for (let b = 0; b < 4; b++) {
      const set = blds.slice(b * per, (b + 1) * per);
      if (!set.length) continue;
      const pts = [];
      for (const s of set) pts.push(P(side * 82, s.z0, s.h + 8), P(side * 82, s.z0), P(side * 140, s.z0, s.h + 8));
      p.group(layer, boxOf(pts, 20), (c) => { for (const s of set) facade(c, side, s); }, { t: 3.6 + b * 0.45 + (side > 0 ? 0.2 : 0), d: 1.1, reveal: 'rise', ease: 'out' });
    }
  }
}
function facade(c, side, s) {
  const X = side * 82, Xb = side * 130, { z0, z1, h } = s;
  const line = '#3b2a22';
  c.lineJoin = 'round';
  // the end wall facing us, and the long wall on the avenue
  c.fillStyle = shade(s.col, 0.8); poly(c, [P(X, z0), P(Xb, z0), P(Xb, z0, h), P(X, z0, h)]); c.fill();
  c.fillStyle = s.col; poly(c, [P(X, z0), P(X, z1), P(X, z1, h), P(X, z0, h)]); c.fill();
  c.strokeStyle = line; c.lineWidth = clamp(120 / z0, 0.5, 1.8);
  poly(c, [P(X, z0), P(X, z1), P(X, z1, h), P(X, z0, h)]); c.stroke();
  poly(c, [P(X, z0), P(Xb, z0), P(Xb, z0, h), P(X, z0, h)]); c.stroke();
  // a mansard roof of slate, with dormers
  if (s.mans) {
    c.fillStyle = SLATE; poly(c, [P(X, z0, h), P(X, z1, h), P(X + side * 4, z1, h + 6), P(X + side * 4, z0, h + 6)]); c.fill(); c.stroke();
    c.fillStyle = SLATE_L; poly(c, [P(X, z0, h), P(Xb, z0, h), P(Xb, z0, h + 6), P(X + side * 4, z0, h + 6)]); c.fill(); c.stroke();
    c.fillStyle = '#e9dcc0';
    for (let z = z0 + 3; z < z1 - 2; z += 5) { const a = P(X + side * 1.5, z, h + 1.5), b = P(X + side * 1.5, z + 1.6, h + 4.5); c.fillRect(Math.min(a[0], b[0]), b[1], Math.max(1, Math.abs(b[0] - a[0])), a[1] - b[1]); }
  } else {
    c.fillStyle = shade(s.col, 0.7); poly(c, [P(X, z0, h), P(X, z1, h), P(X, z1, h + 1), P(X, z0, h + 1)]); c.fill();
  }
  // windows, floor by floor; balconies under them
  c.fillStyle = '#4c4060';
  c.beginPath();
  for (let y = 3.5; y < h - 2; y += 3.4) {
    for (let z = z0 + 1.2; z < z1 - 1.4; z += 3.2) {
      const a = P(X, z, y), b = P(X, z + 1.3, y), cc = P(X, z + 1.3, y + 2), d = P(X, z, y + 2);
      c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath();
    }
  }
  c.fill();
  if (s.bal && z0 < 260) {
    c.strokeStyle = 'rgba(40,30,30,.8)'; c.lineWidth = clamp(60 / z0, 0.4, 1.2);
    c.beginPath();
    for (let y = 6.9; y < h - 3; y += 6.8) { const a = P(X + side * -0.6, z0 + 0.8, y), b = P(X + side * -0.6, z1 - 0.8, y); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
  }
  // the shop fronts at the foot
  c.fillStyle = 'rgba(90,50,40,.55)'; poly(c, [P(X, z0 + 0.5), P(X, z1 - 0.5), P(X, z1 - 0.5, 3), P(X, z0 + 0.5, 3)]); c.fill();
}

// ================================================================ jacarandas along the sidewalks and the medians
function jacarandas(p, r) {
  const trees = [];
  for (const X of [-74, 74, -33, 33]) {
    for (let z = 44 + r() * 10; z < 1100; z += 13 + z * 0.02) trees.push({ X: X + r.range(-1.5, 1.5), z, rad: r.range(4.2, 5.6), k: r() });
  }
  trees.sort((a, b) => b.z - a.z);
  const farT = trees.filter((t) => t.z > 300), nearT = trees.filter((t) => t.z <= 300);
  const crowns = (set) => set.map((t) => {
    const [x, y] = P(t.X, t.z), s = F / t.z;
    const rr = t.rad * s;
    const blobs = [];
    const rr2 = rng(Math.floor(t.z * 31 + t.X * 7));
    for (let i = 0; i < 6; i++) blobs.push([x + rr2.range(-0.7, 0.7) * rr, y - 6 * s - rr * rr2.range(0.5, 1.4), rr * rr2.range(0.45, 0.7), rr2.int(0, 3)]);
    const dots = [];
    for (let i = 0; i < Math.min(40, rr * 0.8); i++) dots.push([x + rr2.range(-1.1, 1.1) * rr, y - 6 * s - rr * rr2.range(0.1, 1.9), rr2.range(0.6, 1.4) * Math.min(2, s * 0.25)]);
    return { x, y, s, rr, blobs, dots };
  });
  const draw = (c, list) => {
    for (const t of list) {
      c.fillStyle = '#4a3a30'; c.fillRect(t.x - 0.25 * t.s, t.y - 6 * t.s, 0.5 * t.s, 6 * t.s);
      c.fillStyle = INK; for (const [bx, by, br] of t.blobs) { c.beginPath(); c.arc(bx, by, br + Math.min(1.6, t.s * 0.12), 0, Math.PI * 2); c.fill(); }
      for (const [bx, by, br, k] of t.blobs) { c.fillStyle = JAC[k]; c.beginPath(); c.arc(bx, by, br, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = JAC[3]; for (const [dx, dy, dr] of t.dots) { c.beginPath(); c.arc(dx, dy, dr, 0, Math.PI * 2); c.fill(); }
    }
  };
  const F1 = crowns(farT), N1 = crowns(nearT);
  const chunk = (list, n) => { const out = []; const k = Math.ceil(list.length / n); for (let i = 0; i < n; i++) out.push(list.slice(i * k, (i + 1) * k)); return out.filter((x) => x.length); };
  chunk(F1, 3).forEach((set, i) => p.group('treesFar', boxOf(set.map((t) => [t.x, t.y]), 30), (c) => draw(c, set), { t: 5.0 + i * 0.3, d: 0.9, reveal: 'pop' }));
  chunk(N1, 4).forEach((set, i) => p.group('treesNear', boxOf(set.flatMap((t) => [[t.x - t.rr * 1.6, t.y - t.rr * 2.4], [t.x + t.rr * 1.6, t.y + 4]]), 6), (c) => draw(c, set), { t: 6.0 + i * 0.35, d: 1.0, reveal: 'rise' }));
}

// ================================================================ the Obelisk: white, tapering, with its little window
function obelisk(p) {
  const x = VX, base = 912, top = 300, wb = 34, wt = 23, ph = 46;
  p.group('obelisk', { x: x - 80, y: top - 20, w: 160, h: base - top + 40 }, (c) => {
    // the lit face and the shaded face
    c.fillStyle = '#fbf3e0'; poly(c, [[x - wb, base], [x - wt, top + ph], [x + 4, top + ph], [x + 6, base]]); c.fill();
    c.fillStyle = '#d9cbb0'; poly(c, [[x + 6, base], [x + 4, top + ph], [x + wt, top + ph], [x + wb, base]]); c.fill();
    // the pyramid at the top
    c.fillStyle = '#fbf3e0'; poly(c, [[x - wt, top + ph], [x, top], [x + 4, top + ph]]); c.fill();
    c.fillStyle = '#cbbb9d'; poly(c, [[x + 4, top + ph], [x, top], [x + wt, top + ph]]); c.fill();
    // fine shading lines on the dark face
    c.strokeStyle = 'rgba(120,96,70,.4)'; c.lineWidth = 1;
    c.beginPath(); for (let k = 0.2; k < 1; k += 0.2) { c.moveTo(lerp(x + 6, x + wb, k), base); c.lineTo(lerp(x + 4, x + wt, k), top + ph); } c.stroke();
    // the window near the top
    c.fillStyle = '#3d3348'; c.fillRect(x - 9, top + ph + 16, 9, 13);
    c.fillStyle = '#2d2538'; c.fillRect(x + 9, top + ph + 16, 7, 13);
    c.strokeStyle = INK; c.lineWidth = 2.2; c.lineJoin = 'round';
    poly(c, [[x - wb, base], [x - wt, top + ph], [x, top], [x + wt, top + ph], [x + wb, base]]); c.stroke();
    c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - wt, top + ph); c.lineTo(x + wt, top + ph); c.moveTo(x + 4, top + ph); c.lineTo(x, top); c.moveTo(x + 4, top + ph); c.lineTo(x + 6, base); c.stroke();
    // its plinth
    c.fillStyle = '#d6c9ae'; c.fillRect(x - wb - 6, base - 6, 2 * wb + 12, 10);
    c.strokeRect(x - wb - 6, base - 6, 2 * wb + 12, 10);
  }, { t: 4.6, d: 1.8, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ traffic: buses and taxis running along the avenue
function traffic(p) {
  const cars = [
    { X: -55, sp: 0.06, ph: 0.1, col: '#e8b21e', bus: false },
    { X: -46, sp: 0.045, ph: 0.55, col: '#3b6fb8', bus: true },
    { X: 46, sp: -0.05, ph: 0.3, col: '#d8402e', bus: true },
    { X: 55, sp: -0.065, ph: 0.8, col: '#1d1a18', bus: false },
    { X: -50, sp: 0.05, ph: 0.85, col: '#2e8a58', bus: true },
    { X: 52, sp: -0.055, ph: 0.05, col: '#e8b21e', bus: false },
  ];
  p.live('obelisk', {
    t: 8.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const v of cars) {
        let u = (v.ph + time * v.sp) % 1; if (u < 0) u += 1;
        const z = 40 * Math.exp(u * 2.6); // 40 m to about 540 m
        const [x, y] = P(v.X, z), s = F / z;
        const L = (v.bus ? 4.4 : 2.4) * s, Hh = (v.bus ? 3.2 : 1.6) * s;
        c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x - L / 2, y - s * 0.3, L, s * 0.5);
        c.fillStyle = v.col; c.fillRect(x - L / 2, y - Hh, L, Hh);
        c.fillStyle = '#d8eef6'; c.fillRect(x - L / 2 + s * 0.3, y - Hh * 0.85, L - s * 0.6, Hh * 0.35);
        if (v.bus) { c.fillStyle = '#f4e6b8'; c.fillRect(x - L / 2, y - Hh * 0.38, L, Hh * 0.1); }
      }
    },
  });
}

// ================================================================ the cobbled street in front
function street(p, r) {
  const y0 = 1150, y1 = MY + MB;
  p.group('street', { x: MX - MA, y: y0 - 4, w: 2 * MA, h: y1 - y0 + 4 }, (c) => {
    c.fillStyle = '#6d625a';
    c.beginPath(); c.moveTo(MX - MA, y1); c.lineTo(MX - MA, 1190); c.quadraticCurveTo(800, 1150, MX + MA, 1190); c.lineTo(MX + MA, y1); c.closePath(); c.fill();
  }, { t: 6.4, d: 0.7, reveal: 'fall' });
  // the cobbles, row by row, smaller with distance
  const stones = [];
  for (let y = 1168, row = 0; y < y1; row++) {
    const s = 0.5 + (y - 1160) / 260;
    const w = 16 * s, h = 7 * s;
    for (let x = MX - MA + (row % 2) * w * 0.5; x < MX + MA; x += w + 1.5 * s) stones.push([x + r.range(-1, 1), y, w * r.range(0.8, 1), h, r.int(0, 2)]);
    y += h + 1.6 * s;
  }
  const cols = ['#9b8d80', '#8a7d72', '#ab9d8e'];
  p.group('street', { x: MX - MA, y: 1160, w: 2 * MA, h: y1 - 1160 }, (c) => {
    for (let k = 0; k < 3; k++) {
      c.fillStyle = cols[k]; c.beginPath();
      for (const [x, y, w, h, kk] of stones) if (kk === k) c.roundRect(x, y, w, h, h * 0.45);
      c.fill();
    }
    c.fillStyle = 'rgba(255,240,220,.25)'; c.beginPath();
    for (const [x, y, w, h] of stones) c.rect(x + w * 0.2, y + 1, w * 0.5, Math.max(1, h * 0.18));
    c.fill();
  }, { t: 6.8, d: 1.2, reveal: 'fall', ease: 'inOut' });
  // the pool of lamplight the couple dance in
  p.group('street', { x: 520, y: 1150, w: 560, h: 240 }, (c) => {
    const g = c.createRadialGradient(800, 1330, 10, 800, 1300, 280);
    g.addColorStop(0, 'rgba(255,214,140,.75)'); g.addColorStop(0.5, 'rgba(255,200,120,.35)'); g.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(800, 1300, 280, 130, 0, 0, Math.PI * 2); c.fill();
  }, { t: 8.0, d: 1.0, reveal: 'fade' });
}

// ================================================================ Caminito's painted tin houses
function corrugate(c, x, y, w, h, col, step = 5) {
  c.fillStyle = col; c.fillRect(x, y, w, h);
  c.strokeStyle = shade(col, 0.78); c.lineWidth = 1.2;
  c.beginPath(); for (let xx = x + step / 2; xx < x + w; xx += step) { c.moveTo(xx, y); c.lineTo(xx, y + h); } c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 0.8;
  c.beginPath(); for (let xx = x + step; xx < x + w; xx += step) { c.moveTo(xx, y); c.lineTo(xx, y + h); } c.stroke();
}
function shutters(c, x, y, w, h, col, frame = '#f4ead2') {
  c.fillStyle = frame; c.fillRect(x - 4, y - 4, w + 8, h + 8);
  c.fillStyle = '#2b2530'; c.fillRect(x, y, w, h);
  // two leaves folded open, slatted
  for (const sx of [x - w * 0.42 - 3, x + w + 3]) {
    c.fillStyle = col; c.fillRect(sx, y, w * 0.42, h);
    c.strokeStyle = shade(col, 0.7); c.lineWidth = 1;
    c.beginPath(); for (let yy = y + 3; yy < y + h; yy += 3.5) { c.moveTo(sx + 1, yy); c.lineTo(sx + w * 0.42 - 1, yy); } c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(sx, y, w * 0.42, h);
  }
  c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(x - 4, y - 4, w + 8, h + 8);
  c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.stroke();
}
function railing(c, x, y, w, h, col) {
  c.fillStyle = shade(col, 0.6); c.fillRect(x - 6, y + h, w + 12, 6);
  c.strokeStyle = INK; c.lineWidth = 1.3; c.strokeRect(x - 6, y + h, w + 12, 6);
  c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + w + 4, y); c.stroke();
  c.lineWidth = 1.4; c.beginPath();
  for (let xx = x; xx <= x + w; xx += 6) { c.moveTo(xx, y); c.lineTo(xx, y + h); }
  c.stroke();
  // a little scroll in the middle, painted
  c.strokeStyle = CREAM; c.lineWidth = 1.2; c.beginPath(); c.arc(x + w / 2 - 6, y + h / 2, 5, 0, Math.PI * 1.6); c.arc(x + w / 2 + 6, y + h / 2, 5, Math.PI, Math.PI * 2.6); c.stroke();
}
function houses(p, r) {
  // houseB: the farther ones, toward the avenue; houseA: the nearer, at the sides
  const B = [
    { x: 520, y: 1000, w: 150, h: 210, cols: [TIN[2], TIN[1]], roof: '#8a3c2c' },
    { x: 940, y: 990, w: 150, h: 220, cols: [TIN[3], TIN[0]], roof: '#5a4a6c' },
  ];
  const A = [
    { x: 296, y: 950, w: 250, h: 360, cols: [TIN[0], TIN[1], TIN[5]], roof: '#2e5c3a' },
    { x: 1066, y: 940, w: 250, h: 370, cols: [TIN[1], TIN[2], TIN[4]], roof: '#7a2a24' },
  ];
  const house = (c, hs, i) => {
    const { x, y, w, h, cols } = hs;
    // the walls: the upper story one color, the lower another, a side panel in a third
    corrugate(c, x, y + h * 0.48, w, h * 0.52, cols[0]);
    corrugate(c, x, y + 26, w, h * 0.48 - 26, cols[1]);
    if (cols[2]) corrugate(c, i % 2 ? x : x + w * 0.78, y + 26, w * 0.22, h - 26, cols[2]);
    // the low roof and its fringe
    c.fillStyle = hs.roof; poly(c, [[x - 14, y + 28], [x + w / 2, y - 4], [x + w + 14, y + 28]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.fillStyle = CREAM; for (let xx = x - 8; xx < x + w + 10; xx += 10) { c.beginPath(); c.moveTo(xx, y + 28); c.lineTo(xx + 5, y + 36); c.lineTo(xx + 10, y + 28); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 2.2; c.strokeRect(x, y + 26, w, h - 26);
    c.beginPath(); c.moveTo(x, y + h * 0.48); c.lineTo(x + w, y + h * 0.48); c.stroke();
  };
  const details = (c, hs, i, near) => {
    const { x, y, w, h, cols } = hs;
    const k = w / 250;
    // windows with shutters, a door
    const wy = y + 26 + (h * 0.48 - 26) * 0.25, wh = (h * 0.48 - 26) * 0.5;
    const wx = i % 2 ? x + w * 0.42 : x + w * 0.22;
    shutters(c, wx, wy, 34 * k, wh, cols[2] || TIN[3]);
    railing(c, wx - 20 * k, wy + wh * 0.45, 34 * k + 40 * k, wh * 0.55 + 6, '#1f2a24');
    const dy = y + h * 0.48 + 20, dh = h * 0.52 - 20;
    const dx = i % 2 ? x + w * 0.58 : x + w * 0.2;
    c.fillStyle = '#f4ead2'; c.fillRect(dx - 4, dy - 4, 44 * k + 8, dh + 4);
    c.fillStyle = cols[2] || TIN[6]; c.fillRect(dx, dy, 44 * k, dh);
    c.strokeStyle = shade(cols[2] || TIN[6], 0.65); c.lineWidth = 1.2; c.strokeRect(dx + 5 * k, dy + 6, 34 * k, dh * 0.42); c.strokeRect(dx + 5 * k, dy + dh * 0.52, 34 * k, dh * 0.4);
    c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(dx - 4, dy - 4, 44 * k + 8, dh + 4);
    if (near) {
      const plate = i === 1;
      // a second window below, and flower pots
      const sx = i % 2 ? x + w * 0.2 : x + w * 0.55;
      shutters(c, sx, dy + 6, 30 * k, dh * 0.45, cols[1]);
      for (let j = 0; j < 3; j++) {
        const px = wx - 14 * k + j * 22 * k, py = wy + wh * 0.45 - 2;
        c.fillStyle = '#b8552f'; c.fillRect(px, py - 8, 12, 8);
        c.fillStyle = GREEN[2]; c.beginPath(); c.arc(px + 6, py - 12, 7, 0, Math.PI * 2); c.fill();
        c.fillStyle = j % 2 ? RED[2] : '#f6e04a'; for (const [ax, ay] of [[-3, -14], [3, -16], [0, -10]]) { c.beginPath(); c.arc(px + 6 + ax, py + ay, 2.2, 0, Math.PI * 2); c.fill(); }
      }
      // a painted name plate on the corner
      if (plate) {
      const nx = i % 2 ? x + 16 : x + w - 100, ny = y + h * 0.48 - 30;
      c.fillStyle = INK; c.beginPath(); c.roundRect(nx, ny, 84, 22, 4); c.fill();
      c.strokeStyle = GOLD[3]; c.lineWidth = 1.4; c.beginPath(); c.roundRect(nx + 3, ny + 3, 78, 16, 3); c.stroke();
      c.fillStyle = CREAM; c.font = '400 13px "Berkshire Swash"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('Caminito', nx + 42, ny + 12);
      }
    }
  };
  B.forEach((hs, i) => {
    p.group('houses', { x: hs.x - 30, y: hs.y - 20, w: hs.w + 60, h: hs.h + 40 }, (c) => house(c, hs, i), { t: 6.6 + i * 0.3, d: 1.0, reveal: 'rise', ease: 'out' });
  });
  A.forEach((hs, i) => {
    p.group('houses', { x: hs.x - 30, y: hs.y - 20, w: hs.w + 60, h: hs.h + 40 }, (c) => house(c, hs, i), { t: 7.2 + i * 0.3, d: 1.0, reveal: 'rise', ease: 'out' });
  });
  [...B.map((hs, i) => [hs, i, false]), ...A.map((hs, i) => [hs, i, true])].forEach(([hs, i, near], k) => {
    p.group('houses', { x: hs.x - 40, y: hs.y - 30, w: hs.w + 80, h: hs.h + 60 }, (c) => details(c, hs, i, near), { t: 7.9 + k * 0.22, d: 0.7, reveal: 'pop' });
  });
  // a clothesline across the left house, with washing that stirs
  const wash = [[330, '#f4ead2', 26], [366, CELESTE, 22], [398, RED[2], 30], [440, '#f6e04a', 20], [470, '#ffffff', 26], [506, BLUE[2], 22]];
  const lineY = (x) => 1085 + Math.sin(((x - 310) / 220) * Math.PI) * 14;
  p.live('houses', {
    t: 9.0, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); for (let x = 310; x <= 530; x += 10) (x > 310 ? c.lineTo(x, lineY(x)) : c.moveTo(x, lineY(x))); c.stroke();
      wash.forEach(([x, col, w], i) => {
        const y = lineY(x), sw = Math.sin(time * 2.2 + i * 1.3) * 3;
        c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w + sw, y + w * 1.1); c.lineTo(x + sw, y + w * 1.1); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = INK; c.fillRect(x + 3, y - 3, 2, 5); c.fillRect(x + w - 5, y - 3, 2, 5);
      });
    },
  });
}

// ================================================================ the street lamp, a farol with its lantern
function lamp(p) {
  const x = 1005, foot = 1345, top = 1020;
  p.group('couple', { x: x - 80, y: top - 70, w: 130, h: foot - top + 80 }, (c) => {
    c.fillStyle = '#1c2420'; c.strokeStyle = INK; c.lineWidth = 1.4;
    c.fillRect(x - 3.5, top, 7, foot - top);
    c.beginPath(); c.moveTo(x - 12, foot); c.lineTo(x - 7, foot - 36); c.lineTo(x + 7, foot - 36); c.lineTo(x + 12, foot); c.closePath(); c.fill();
    // the curled arm
    c.strokeStyle = '#1c2420'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, top + 10); c.bezierCurveTo(x, top - 30, x - 60, top - 30, x - 52, top + 4); c.stroke();
    c.lineWidth = 2.2; c.beginPath(); c.arc(x - 14, top + 10, 9, Math.PI * 0.2, Math.PI * 1.7); c.stroke();
    // the lantern
    const lx = x - 52, ly = top + 6;
    c.fillStyle = '#1c2420'; c.beginPath(); c.moveTo(lx - 16, ly + 12); c.lineTo(lx, ly); c.lineTo(lx + 16, ly + 12); c.closePath(); c.fill();
    c.fillStyle = '#ffe9a6'; c.beginPath(); c.moveTo(lx - 13, ly + 12); c.lineTo(lx + 13, ly + 12); c.lineTo(lx + 9, ly + 40); c.lineTo(lx - 9, ly + 40); c.closePath(); c.fill();
    c.strokeStyle = '#1c2420'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.moveTo(lx, ly + 12); c.lineTo(lx, ly + 40); c.stroke();
  }, { t: 8.2, d: 0.9, reveal: 'rise' });
  p.live('couple', {
    t: 9.2, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      const a = 0.22 + 0.06 * Math.sin(time * 3.1) + 0.03 * Math.sin(time * 7.3);
      c.fillStyle = `rgba(255,224,140,${a.toFixed(3)})`;
      c.beginPath(); c.arc(x - 52, top + 32, 46, 0, Math.PI * 2); c.fill();
      c.fillStyle = `rgba(255,236,170,${(a * 1.4).toFixed(3)})`;
      c.beginPath(); c.arc(x - 52, top + 32, 22, 0, Math.PI * 2); c.fill();
    },
  });
}

// ================================================================ the dancers: one silhouette, swaying a little
// a limb: a tapered shape through a few points, from width w0 to w1
function limb(c, pts, w0, w1) {
  const n = pts.length, Lft = [], Rgt = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), w = lerp(w0, w1, i / (n - 1)) / 2;
    Lft.push([pts[i][0] - Math.sin(ang) * w, pts[i][1] + Math.cos(ang) * w]);
    Rgt.push([pts[i][0] + Math.sin(ang) * w, pts[i][1] - Math.cos(ang) * w]);
  }
  c.beginPath(); Lft.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  for (let i = n - 1; i >= 0; i--) c.lineTo(Rgt[i][0], Rgt[i][1]);
  c.closePath(); c.fill();
  c.beginPath(); c.arc(pts[0][0], pts[0][1], w0 / 2, 0, Math.PI * 2); c.arc(pts[n - 1][0], pts[n - 1][1], w1 / 2, 0, Math.PI * 2); c.fill();
}
function dancers(c) {
  // feet at 0, about 260 tall; he on the left facing right, she facing him
  c.fillStyle = INK;
  // his legs: the back one reaching behind, the front one stepping between hers
  limb(c, [[-34, -118], [-46, -60], [-60, -6]], 22, 13);
  limb(c, [[-16, -118], [-8, -62], [2, -8]], 22, 13);
  c.beginPath(); c.ellipse(-66, -4, 15, 5, 0.1, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(8, -4, 14, 5, 0, 0, Math.PI * 2); c.fill();
  // his jacket and shoulders, leaning into her
  c.beginPath();
  c.moveTo(-46, -122); c.lineTo(-50, -176); c.quadraticCurveTo(-52, -204, -36, -210);
  c.lineTo(-8, -212); c.quadraticCurveTo(4, -206, 2, -186); c.lineTo(-4, -122); c.closePath(); c.fill();
  // neck, head and the hat
  c.fillRect(-28, -222, 10, 14);
  c.beginPath(); c.ellipse(-21, -232, 12, 14, 0.1, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(-22, -243, 23, 4.2, -0.06, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(-36, -244); c.lineTo(-34, -262); c.quadraticCurveTo(-22, -268, -9, -262); c.lineTo(-8, -244); c.closePath(); c.fill();
  // his arm held out to the left, her hand in his
  limb(c, [[-44, -204], [-80, -204], [-104, -226]], 13, 9);
  // her standing leg, on her toes, and the leg she flicks back in a boleo
  limb(c, [[14, -112], [12, -58], [14, -10]], 17, 9);
  c.beginPath(); c.moveTo(9, -10); c.lineTo(22, -2); c.lineTo(20, 2); c.lineTo(7, -2); c.closePath(); c.fill();
  c.fillRect(8, -8, 3, 8);
  limb(c, [[20, -108], [38, -58], [58, -10]], 18, 9);
  c.beginPath(); c.moveTo(54, -12); c.lineTo(74, -2); c.lineTo(72, 1); c.lineTo(56, -4); c.closePath(); c.fill();
  // her body: shoulders, a slim waist, the hips
  c.beginPath();
  c.moveTo(-2, -204); c.quadraticCurveTo(12, -210, 26, -202); c.quadraticCurveTo(30, -186, 24, -166);
  c.quadraticCurveTo(18, -148, 22, -126); c.quadraticCurveTo(28, -112, 26, -100);
  c.lineTo(4, -100); c.quadraticCurveTo(0, -120, 6, -140); c.quadraticCurveTo(10, -160, 2, -176); c.closePath(); c.fill();
  // her head turned toward him, her hair gathered high
  c.fillRect(8, -214, 9, 12);
  c.beginPath(); c.ellipse(13, -224, 11, 13, -0.15, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(23, -232, 8, 0, Math.PI * 2); c.fill();
  // her arm across to his hand
  limb(c, [[2, -202], [-50, -214], [-100, -228]], 9, 7);
  c.beginPath(); c.arc(-104, -230, 6.5, 0, Math.PI * 2); c.fill();
  // the red dress: the bodice, and a skirt slit high that swings with the kick
  c.fillStyle = RED[2];
  c.beginPath();
  c.moveTo(0, -198); c.quadraticCurveTo(12, -204, 24, -198); c.quadraticCurveTo(26, -184, 22, -166);
  c.quadraticCurveTo(16, -148, 20, -128); c.quadraticCurveTo(30, -110, 30, -96);
  c.quadraticCurveTo(44, -74, 56, -50); c.lineTo(36, -50); c.quadraticCurveTo(26, -66, 24, -80);
  c.lineTo(20, -52); c.quadraticCurveTo(10, -50, 2, -54); c.quadraticCurveTo(0, -80, 4, -104);
  c.quadraticCurveTo(0, -122, 6, -142); c.quadraticCurveTo(10, -162, 2, -176); c.closePath(); c.fill();
  c.fillStyle = RED[1];
  c.beginPath(); c.moveTo(24, -80); c.quadraticCurveTo(26, -66, 36, -50); c.lineTo(46, -52); c.quadraticCurveTo(34, -70, 28, -92); c.closePath(); c.fill();
  c.strokeStyle = RED[3]; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(22, -196); c.quadraticCurveTo(26, -180, 20, -164); c.stroke();
  // a flower in her hair
  c.fillStyle = RED[2]; c.beginPath(); c.arc(28, -238, 4.5, 0, Math.PI * 2); c.fill();
  // his hat's band
  c.fillStyle = '#3a3330'; c.fillRect(-34, -250, 25, 4);
}
function couple(p) {
  const x = 770, foot = 1352;
  // their shadow, cast by the lamp
  p.group('couple', { x: x - 160, y: foot - 20, w: 300, h: 30 }, (c) => {
    c.fillStyle = 'rgba(20,12,8,.4)'; c.beginPath(); c.ellipse(x - 10, foot - 2, 110, 9, 0, 0, Math.PI * 2); c.fill();
  }, { t: 8.6, d: 0.6, reveal: 'fade' });
  p.live('couple', {
    t: 8.8, d: 1.2, reveal: 'drop', dy: 20,
    box: { x: x - 140, y: foot - 320, w: 260, h: 330 },
    draw: (c, time) => {
      c.translate(x, foot); c.rotate(Math.sin(time * 1.6) * 0.018); c.scale(1.14, 1.14);
      dancers(c);
    },
  });
}

// ================================================================ the title: shaded letters, outlined in black
function letters(p, layer, str, x, y, o) {
  const m = document.createElement('canvas').getContext('2d');
  const size = o.size;
  const font = `400 ${size}px "Berkshire Swash"`;
  m.font = font;
  const tr = (o.track || 0) * size;
  const wAt = (k) => m.measureText(str.slice(0, k)).width + tr * k;
  const total = wAt(str.length) - tr;
  const x0 = x - total / 2;
  let k = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const gw = m.measureText(ch).width, gx = x0 + wAt(i + 1) - tr - gw;
    if (ch === ' ') continue;
    const t = o.t + k * o.gap; k++;
    p.mark(layer, {
      t, d: o.d, reveal: 'press', ease: 'out',
      box: { x: gx - size * 0.3, y: y - size * 1.15, w: gw + size * 0.6, h: size * 1.6 },
      draw: (c) => {
        c.font = font; c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.lineJoin = 'round';
        // the deep shadow, the black outline, a white rim, then the painted fill
        const sx = size * 0.06, sy = size * 0.065;
        c.strokeStyle = INK; c.lineWidth = size * 0.035; c.strokeText(ch, gx + sx, y + sy);
        c.fillStyle = o.shadow; c.fillText(ch, gx + sx, y + sy);
        c.strokeStyle = o.shadow2; c.lineWidth = size * 0.012; c.strokeText(ch, gx + sx, y + sy);
        c.strokeStyle = INK; c.lineWidth = size * 0.05; c.strokeText(ch, gx, y);
        c.fillStyle = '#ffffff'; c.fillText(ch, gx - size * 0.012, y - size * 0.012);
        const g = c.createLinearGradient(0, y - size * 0.75, 0, y);
        o.fill.forEach((col, j) => { g.addColorStop(j / (o.fill.length - 1), col); });
        c.fillStyle = g; c.fillText(ch, gx, y);
      },
    });
  }
  return { x0, total };
}
function title(p) {
  letters(p, 'title', 'Buenos Aires', W / 2, 1572, {
    size: 188, track: 0.01, t: 10.4, gap: 0.14, d: 0.7, shadow: RED[1], shadow2: RED[3], fill: ['#fff6d2', '#f8d462', '#f0a22a', '#e0701c'],
  });
}

// ================================================================ the ribbon under the title, and the last curls
function ribbon(p) {
  const y = 1712, x0 = 470, x1 = 1130, hh = 40;
  const top = (x) => y - hh - Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * -14;
  p.group('title', { x: x0 - 140, y: y - 80, w: x1 - x0 + 280, h: 170 }, (c) => {
    // the tails, folded behind
    for (const s of [-1, 1]) {
      const ex = s < 0 ? x0 : x1;
      c.fillStyle = mix(CELESTE, '#000', 0.25);
      poly(c, [[ex, top(ex) + 22], [ex + s * 110, top(ex) + 30], [ex + s * 80, top(ex) + 62], [ex + s * 120, top(ex) + 96], [ex, top(ex) + 92]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
      c.fillStyle = '#2d5f8c'; poly(c, [[ex, top(ex) + 70], [ex - s * 26, top(ex) + 70], [ex, top(ex) + 92]]); c.fill(); c.stroke();
    }
    // the band: celeste, white, celeste
    const band3 = (f0, f1, col) => {
      c.fillStyle = col; c.beginPath();
      for (let x = x0 - 26; x <= x1 + 26; x += 10) c.lineTo(x, top(x) + f0 * 2 * hh);
      for (let x = x1 + 26; x >= x0 - 26; x -= 10) c.lineTo(x, top(x) + f1 * 2 * hh);
      c.closePath(); c.fill();
    };
    band3(0, 0.22, CELESTE); band3(0.22, 0.78, '#fbf7ec'); band3(0.78, 1, CELESTE);
    c.strokeStyle = INK; c.lineWidth = 2.4;
    c.beginPath(); for (let x = x0 - 26; x <= x1 + 26; x += 10) c.lineTo(x, top(x)); for (let x = x1 + 26; x >= x0 - 26; x -= 10) c.lineTo(x, top(x) + 2 * hh); c.closePath(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.2;
    c.beginPath(); for (let x = x0 - 20; x <= x1 + 20; x += 10) c.lineTo(x, top(x) + 4); c.stroke();
  }, { t: 12.1, d: 0.9, reveal: 'iris', ease: 'inOut' });
  p.type('title', 'la Reina del Plata', W / 2, y + 16, {
    family: '"Berkshire Swash", cursive', size: 48, color: '#1d3f7a', align: 'center', track: 0.04, t: 12.6, gap: 0.04, d: 0.5, reveal: 'fade',
  });
  // gold scrolls from under the ribbon, out along the foot
  pair(p, 'title', { x: 760, y: 1858, h: Math.PI + 0.06, L: 420, wd: 34, dir: 1, cols: GOLD, k1: 0.1, leaves: [0.14, 0.32, 0.5], leafCols: [GOLD, RED, GREEN] }, 12.4, 1.4);
  p.group('title', { x: 740, y: 1800, w: 120, h: 110 }, (c) => { leaf(c, 790, 1858, 50, Math.PI - 0.4); leaf(c, 810, 1858, 50, 0.4); rose(c, 800, 1856, 24, BLUE); }, { t: 13.0, d: 0.6, reveal: 'pop' });
}

// ================================================================ swallows over the avenue, and pearls on the ring
function finish(p, r) {
  const bs = [];
  for (let i = 0; i < 9; i++) bs.push([lerp(420, 1180, r()), lerp(260, 640, r()), r.range(20, 70), r.range(8, 20), r.range(0.3, 0.6) * (r.chance(0.5) ? 1 : -1), r() * 7, r.range(0.8, 1.3)]);
  p.live('sky', {
    t: 9.4, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#1c1f2e';
      for (const [x0, y0, rx, ry, w, ph, s] of bs) {
        const a = time * w + ph, x = x0 + Math.cos(a) * rx, y = y0 + Math.sin(a) * ry, f = Math.sin(time * 9 + ph * 3) * 3 * s;
        c.beginPath(); c.moveTo(x - 11 * s, y - 2 * s - f); c.quadraticCurveTo(x - 4 * s, y - 1 * s, x, y + 2 * s); c.quadraticCurveTo(x + 4 * s, y - 1 * s, x + 11 * s, y - 2 * s - f); c.quadraticCurveTo(x + 3 * s, y + 2 * s, x, y + 6 * s); c.quadraticCurveTo(x - 3 * s, y + 2 * s, x - 11 * s, y - 2 * s - f); c.fill();
      }
    },
  });
  // white pearls round the ring, set last
  const pts = medPts(-52, 120);
  p.group('border', { x: MX - MA - 70, y: MY - MB - 70, w: 2 * MA + 140, h: 2 * MB + 140 }, (c) => {
    pts.forEach(([x, y], i) => { if (i % 2 === 0 && !(y < 260 && Math.abs(x - 800) < 140)) pearl(c, x, y, 3.6, i % 4 ? CREAM : CELESTE); });
  }, { t: 13.4, d: 0.7, reveal: 'fade' });
}
