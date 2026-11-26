// Isfahan: a page from a Persian manuscript. A miniature of Naqsh-e Jahan
// Square from above, its ground tipped up toward us: the Shah Mosque's portal
// and blue dome at the far end, its minarets breaking through the ruled frame
// into a gold sky with ribbon clouds; Sheikh Lotfollah's buff dome on the left,
// Ali Qapu's columned veranda on the right, the two-story arcades with the
// bazaar's little domes behind them, plane trees, the long pool, polo players
// riding over the lawns. Gold flowering vines in the salmon margin; the name in
// an illuminated panel below.

import { Plate, W, H } from '../print.js';
import { mix, lerp, poly, rng } from '../kit.js';

const INK = '#2a1f17', MARGIN = '#ecc9ad', IVORY = '#f6ecd4';
const GOLD = '#cfa443', GOLD_L = '#ecd07a', GOLD_D = '#9a7425';
const LAPIS = '#1f3c8f', LAPIS_D = '#152b68', TURQ = '#2ba3ae', TURQ_L = '#86d3cf', TURQ_D = '#1a7a86';
const VERM = '#cf4a2c', MAL = '#3f8a5a', MAL_D = '#2a6340', SAFFRON = '#e7b43c';
const BRICK = '#ddb582', BRICK_D = '#b98a59', BRICK_L = '#ecd0a4', DOOR = '#5a3826';
const SAND = '#ead7ab', LAWN = '#93b06c', LAWN_D = '#6e8f4e', WATER = '#5d8fc2', WATER_L = '#d9ecf2';
const LILAC = '#b9a5c9', LILAC_D = '#8f7aa8', ROSE = '#e3a99a', ROSE_D = '#c47d70';
const BUFF = '#e2c59a', BUFF_D = '#bf9e70';
const ROBES = ['#cf4a2c', '#1f3c8f', '#3f8a5a', '#e7b43c', '#8a4a8c', '#2ba3ae', '#f2ead6', '#d97a9a'];

export const city = {
  id: 'isfahan', name: 'Isfahan', wall: '#17203d',
  alt: 'A Persian miniature of Naqsh-e Jahan Square seen from above: the Shah Mosque with its blue dome and minarets at the far end against a gold sky with ribbon clouds, the Sheikh Lotfollah Mosque’s dome on the left, Ali Qapu’s columned veranda on the right, two-story arcades with the bazaar’s small domes, plane trees, a long pool and polo players on horseback, in a salmon margin of gold flowering vines, with the name اصفهان in an illuminated panel and ISFAHAN below',
  google: 'family=Amiri:wght@400;700',
  fonts: [['700 150px "Amiri"', 'اصفهان'], ['400 52px "Amiri"', 'ISFAHAN']],
  build,
};

const FONT = '"Amiri", serif';
// the picture, the panel under it, both inside ruled frames
const PX0 = 214, PX1 = 1386, PY0 = 196, PY1 = 1530;
const TY0 = 1580, TY1 = 1792;
const CX = W / 2;
// the square: its far edge under the mosque, its near edge at the foot of the picture
const FAR = 640, NEAR = PY1, FHW = 268, NHW = 560;
const edgeX = (y, s) => CX + s * lerp(FHW, NHW, (y - FAR) / (NEAR - FAR));
const depth = (y) => (y - FAR) / (NEAR - FAR); // 0 far, 1 near
const scaleAt = (y) => lerp(0.42, 1, depth(y));

function build() {
  const p = new Plate({ paper: MARGIN, seed: 1598 });
  p.clip = { x: PX0, y: PY0, w: PX1 - PX0, h: PY1 - PY0 };
  p.stack('margin', 'sky', 'hills', 'ground', 'arcade', 'domes', 'mosque', 'trees', 'folk', 'riders', 'spires', 'panel', 'air');
  for (const n of ['margin', 'spires', 'panel', 'air']) p.layer(n, { clip: false });

  margin(p);
  sky(p);
  hills(p);
  ground(p);
  arcades(p);
  shahMosque(p);
  lotfollah(p);
  aliQapu(p);
  trees(p);
  folk(p);
  panel(p);
  life(p);
  return p;
}

// ================================================================ the page
// the ruled frame (jadval): a band of gold between colored hairlines
function jadval(p, x0, y0, x1, y1, t) {
  const rect = (k) => [[x0 - k, y0 - k], [x1 + k, y0 - k], [x1 + k, y1 + k], [x0 - k, y1 + k], [x0 - k, y0 - k]];
  p.pen('margin', rect(9), GOLD, 9, { t, d: 1.3, cap: 'square' });
  p.pen('margin', rect(16), LAPIS, 2.2, { t: t + 0.15, d: 1.3, cap: 'square' });
  p.pen('margin', rect(3), VERM, 1.6, { t: t + 0.25, d: 1.3, cap: 'square' });
  p.pen('margin', rect(22), MAL, 1.2, { t: t + 0.35, d: 1.3, cap: 'square' });
  p.pen('margin', rect(14), INK, 1.0, { t: t + 0.3, d: 1.3, cap: 'square' });
}
function margin(p) {
  // flecks of gold scattered in the paper
  const rr = rng(77), flecks = [];
  for (let i = 0; i < 420; i++) {
    const x = rr() * W, y = rr() * H;
    if (x > PX0 - 30 && x < PX1 + 30 && y > PY0 - 30 && y < TY1 + 30) continue;
    flecks.push([x, y, rr.range(1, 3.6), rr() * Math.PI]);
  }
  p.group('margin', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = GOLD;
    c.beginPath();
    for (const [x, y, s, a] of flecks) { c.moveTo(x + Math.cos(a) * s, y + Math.sin(a) * s); c.lineTo(x + Math.cos(a + 2.2) * s, y + Math.sin(a + 2.2) * s); c.lineTo(x + Math.cos(a + 4.1) * s * 0.7, y + Math.sin(a + 4.1) * s * 0.7); c.closePath(); }
    c.fill();
  }, { t: 0.0, d: 1.0, reveal: 'fade' });
  jadval(p, PX0, PY0, PX1, PY1, 0.2);
  jadval(p, PX0, TY0, PX1, TY1, 0.6);
  vines(p);
}

// gold vines in the margin (tahrir): long waving stems that curl, leaves and blossoms on them
function vineStem(rr, x0, y0, x1, y1, amp, waves) {
  const pts = [], n = 90;
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  for (let k = 0; k <= n; k++) {
    const t = k / n, w = Math.sin(t * Math.PI * waves) * amp;
    pts.push([x0 + dx * t + nx * w, y0 + dy * t + ny * w]);
  }
  return pts;
}
function vines(p) {
  const rr = rng(1501);
  // runs along each side of the margin, down the middle of it
  const runs = [
    [107, 120, 107, 1880, 38, 9], [W - 107, 120, W - 107, 1880, 38, 9],
    [260, 96, W - 260, 96, 26, 7], [260, 1950, W - 260, 1950, 22, 7],
  ];
  const leaves = [], blossoms = [], foliage = [];
  runs.forEach(([x0, y0, x1, y1, amp, waves], i) => {
    const stem = vineStem(rr, x0, y0, x1, y1, amp, waves);
    p.pen('margin', stem, GOLD_D, 2.6, { t: 0.6 + i * 0.25, d: 1.9 });
    // a curling tendril at every crest, and leaves and flowers along the stem
    for (let k = 1; k < waves * 2; k++) {
      const idx = Math.round((k / (waves * 2)) * (stem.length - 1));
      const [x, y] = stem[idx];
      const side = k % 2 ? 1 : -1;
      const horiz = Math.abs(y1 - y0) < 1;
      const ox = horiz ? 0 : side * 26, oy = horiz ? side * 22 : 0;
      const curl = [];
      for (let j = 0; j <= 26; j++) {
        const t = j / 26, a = t * Math.PI * 2.4 * side, rad = 16 * (1 - t) + 2;
        curl.push([x + ox * t * 1.2 + Math.cos(a + (horiz ? 0 : Math.PI / 2)) * rad * t, y + oy * t * 1.2 + Math.sin(a + (horiz ? 0 : Math.PI / 2)) * rad * t]);
      }
      leaves.push({ pts: curl, t: 1.8 + i * 0.25 + (k / (waves * 2)) * 1.4 });
      // two leaves where the tendril leaves the stem, and one between crests
      const [xb, yb] = stem[Math.max(0, idx - 5)], [xm, ym] = stem[Math.round(((k - 0.5) / (waves * 2)) * (stem.length - 1))];
      const along = Math.atan2(stem[idx][1] - yb, stem[idx][0] - xb);
      foliage.push([xb, yb, along + side * 0.9, 1], [xb, yb, along - side * 1.2, 0.8], [xm, ym, along + Math.PI / 2 * -side, 0.9]);
      blossoms.push([x - ox * 0.9, y - oy * 0.9, rr.range(9, 14), rr.int(0, 2), rr() * Math.PI]);
    }
  });
  // the tendrils, a few at a time
  for (let i = 0; i < leaves.length; i += 6) {
    const set = leaves.slice(i, i + 6);
    p.strokes('margin', set.map((l) => l.pts), GOLD_D, 1.6, { t: set[0].t, d: 0.9, reveal: 'fade' });
  }
  // the leaves: pointed, gold, with a vein, set in four batches
  for (let i = 0; i < 4; i++) {
    const set = foliage.filter((_, k) => k % 4 === i);
    p.group('margin', { x: 0, y: 0, w: W, h: H }, (c) => {
      c.fillStyle = GOLD; c.strokeStyle = GOLD_D; c.lineWidth = 0.9;
      for (const [x, y, a, s] of set) {
        const L = 22 * s, wd = 7 * s, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L, nx = -Math.sin(a) * wd, ny = Math.cos(a) * wd;
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + ex) / 2 + nx, (y + ey) / 2 + ny, ex, ey); c.quadraticCurveTo((x + ex) / 2 - nx, (y + ey) / 2 - ny, x, y); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(x, y); c.lineTo(lerp(x, ex, 0.8), lerp(y, ey, 0.8)); c.stroke();
      }
    }, { t: 2.6 + i * 0.3, d: 0.8, reveal: 'fade' });
  }
  // the blossoms: rosettes and palmettes in gold with a darker heart
  for (let i = 0; i < blossoms.length; i += 8) {
    const set = blossoms.slice(i, i + 8);
    const xs = set.map((b) => b[0]), ys = set.map((b) => b[1]);
    p.group('margin', { x: Math.min(...xs) - 24, y: Math.min(...ys) - 24, w: Math.max(...xs) - Math.min(...xs) + 48, h: Math.max(...ys) - Math.min(...ys) + 48 }, (c) => {
      for (const [x, y, s, kind, a] of set) blossom(c, x, y, s, kind, a);
    }, { t: 12.4 + i * 0.03, d: 0.8, reveal: 'fade' });
  }
}
function blossom(c, x, y, s, kind, a) {
  c.save(); c.translate(x, y); c.rotate(a);
  c.fillStyle = GOLD; c.strokeStyle = GOLD_D; c.lineWidth = 1;
  const n = kind === 0 ? 6 : kind === 1 ? 8 : 5;
  c.beginPath();
  for (let k = 0; k < n; k++) { const b = (k / n) * Math.PI * 2; c.moveTo(0, 0); c.ellipse(Math.cos(b) * s * 0.55, Math.sin(b) * s * 0.55, s * 0.5, s * 0.24, b, 0, Math.PI * 2); }
  c.fill(); c.stroke();
  c.fillStyle = GOLD_D; c.beginPath(); c.arc(0, 0, s * 0.22, 0, Math.PI * 2); c.fill();
  c.fillStyle = GOLD_L; c.beginPath(); c.arc(0, 0, s * 0.1, 0, Math.PI * 2); c.fill();
  c.restore();
}

// ================================================================ the sky and the hills
function sky(p) {
  const rr = rng(12), dust = [];
  for (let i = 0; i < 500; i++) dust.push([rr.range(PX0, PX1), rr.range(PY0, 700), rr.range(0.6, 1.8)]);
  p.group('sky', { x: PX0, y: PY0, w: PX1 - PX0, h: 720 - PY0 }, (c) => {
    c.fillStyle = GOLD; c.fillRect(PX0, PY0, PX1 - PX0, 720 - PY0);
    // the gold is laid with a brush: a burnished middle, darker at the edges
    const g = c.createLinearGradient(PX0, 0, PX1, 0);
    g.addColorStop(0, 'rgba(120,80,20,.16)'); g.addColorStop(0.5, 'rgba(255,240,180,.18)'); g.addColorStop(1, 'rgba(120,80,20,.16)');
    c.fillStyle = g; c.fillRect(PX0, PY0, PX1 - PX0, 720 - PY0);
    c.fillStyle = 'rgba(130,90,25,.35)'; c.beginPath();
    for (const [x, y, s] of dust) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); }
    c.fill();
  }, { t: 1.0, d: 1.2, reveal: 'fall', ease: 'inOut' });
  // ribbon clouds in the Chinese manner: a knotted band, white with a blue edge
  const clouds = [[360, 300, 1.0, 1], [1220, 260, 0.9, -1], [560, 420, 0.7, -1], [1130, 440, 0.65, 1], [300, 500, 0.55, 1]];
  clouds.forEach(([x, y, s, dir], i) => {
    const pts = ribbon(x, y, s, dir);
    p.group('sky', { x: x - 150 * s, y: y - 60 * s, w: 300 * s, h: 120 * s }, (c) => {
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = LAPIS; c.lineWidth = 15 * s; stroke(c, pts);
      c.strokeStyle = IVORY; c.lineWidth = 10 * s; stroke(c, pts);
      c.strokeStyle = TURQ_L; c.lineWidth = 2.4 * s; stroke(c, pts);
    }, { t: 2.0 + i * 0.22, d: 1.0, reveal: dir > 0 ? 'wipe' : 'wipeL', ease: 'inOut' });
  });
}
function stroke(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
// a cloud band: a wave that ties itself in a loop in the middle and curls at both ends
function ribbon(x, y, s, dir) {
  const pts = [];
  for (let k = 0; k <= 120; k++) {
    const t = k / 120;
    let px = (t - 0.5) * 260, py = Math.sin(t * Math.PI * 3) * 14;
    // the knot
    const kn = Math.exp(-((t - 0.5) ** 2) / 0.006);
    px += Math.sin(t * Math.PI * 16) * 26 * kn; py += (Math.cos(t * Math.PI * 16) - 1) * 18 * kn;
    // the curls at the ends
    const e0 = Math.max(0, 0.12 - t) / 0.12, e1 = Math.max(0, t - 0.88) / 0.12;
    px += Math.sin(e0 * 5) * 10 * e0 - Math.sin(e1 * 5) * 10 * e1; py -= (e0 + e1) * 16;
    pts.push([x + px * s * dir, y + py * s]);
  }
  return pts;
}
// the hills beyond the city: lumpy rocks in lilac and rose, outlined, with poplars
function hills(p) {
  const specs = [
    { x0: PX0 - 10, x1: 640, base: 660, top: 470, col: LILAC, dk: LILAC_D, seed: 3 },
    { x0: 980, x1: PX1 + 10, base: 660, top: 450, col: ROSE, dk: ROSE_D, seed: 4 },
    { x0: PX0 - 10, x1: 520, base: 700, top: 560, col: ROSE, dk: ROSE_D, seed: 5 },
    { x0: 1090, x1: PX1 + 10, base: 700, top: 560, col: LILAC, dk: LILAC_D, seed: 6 },
  ];
  specs.forEach((h, i) => {
    const rr = rng(h.seed), lumps = [];
    let x = h.x0;
    while (x < h.x1) {
      const w = rr.range(50, 110), t = (x - h.x0) / (h.x1 - h.x0);
      const rise = (i % 2 === 0 ? 1 - t : t);
      lumps.push([x + w / 2, lerp(h.base - 30, h.top, rise ** 0.8) + rr.range(-14, 14), w * 0.62]);
      x += w * 0.7;
    }
    const poplars = [];
    for (let k = 0; k < 6; k++) { const j = rr.int(0, lumps.length - 1); poplars.push([lumps[j][0] + rr.range(-10, 10), lumps[j][1] + 6, rr.range(28, 48)]); }
    p.group('hills', { x: h.x0 - 80, y: h.top - 110, w: h.x1 - h.x0 + 160, h: h.base - h.top + 130 }, (c) => {
      // the heap of rounded rocks, each outlined, with a darker lip on its underside
      c.fillStyle = h.col; c.beginPath();
      for (const [lx, ly, lr] of lumps) { c.moveTo(lx + lr, ly); c.ellipse(lx, ly, lr, lr * 0.8, 0, 0, Math.PI * 2); c.rect(lx - lr * 0.98, ly, lr * 1.96, h.base - ly + 40); }
      c.fill();
      c.strokeStyle = h.dk; c.lineWidth = 1.6;
      for (const [lx, ly, lr] of lumps) { c.beginPath(); c.ellipse(lx, ly, lr, lr * 0.8, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.beginPath(); c.ellipse(lx + lr * 0.1, ly + lr * 0.2, lr * 0.55, lr * 0.4, 0, 0.2, Math.PI - 0.2); c.stroke(); }
      // poplars: tall thin flames of green
      for (const [px, py, ph] of poplars) {
        c.fillStyle = MAL_D; c.beginPath(); c.moveTo(px, py - ph); c.quadraticCurveTo(px + 9, py - ph * 0.4, px + 1, py); c.quadraticCurveTo(px - 9, py - ph * 0.4, px, py - ph); c.fill();
        c.strokeStyle = MAL; c.lineWidth = 1; c.beginPath(); for (let y = py - ph + 8; y < py - 4; y += 5) { c.moveTo(px - 3, y + 3); c.lineTo(px, y); c.lineTo(px + 3, y + 3); } c.stroke();
      }
    }, { t: 2.6 + i * 0.25, d: 0.9, reveal: 'rise' });
  });
}

// ================================================================ the square
function ground(p) {
  const L = 'ground';
  const trap = (y0, y1, k = 0) => [[edgeX(y0, -1) + k, y0], [edgeX(y0, 1) - k, y0], [edgeX(y1, 1) - k, y1], [edgeX(y1, -1) + k, y1]];
  // the city round the square, beyond the arcades: pale roofs to the frame's edges
  p.group(L, { x: PX0, y: 600, w: PX1 - PX0, h: PY1 - 600 }, (c) => {
    c.fillStyle = BRICK_L; c.fillRect(PX0, 600, PX1 - PX0, PY1 - 600);
  }, { t: 2.8, d: 0.8, reveal: 'fade' });
  // the sand of the square
  p.group(L, { x: PX0, y: FAR - 4, w: PX1 - PX0, h: NEAR - FAR + 8 }, (c) => {
    c.fillStyle = SAND; poly(c, trap(FAR, NEAR)); c.fill();
    // raked lines along it
    c.strokeStyle = 'rgba(180,150,100,.35)'; c.lineWidth = 1; c.beginPath();
    for (let k = -10; k <= 10; k++) { c.moveTo(CX + k * FHW / 10.5, FAR); c.lineTo(CX + k * NHW / 10.5, NEAR); }
    c.stroke();
  }, { t: 3.0, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // two long lawns either side of the pool, with tufts of flowers
  const rr = rng(21), tufts = [];
  for (let i = 0; i < 1500; i++) {
    const y = lerp(FAR + 40, NEAR - 10, rr() ** 0.85), s = scaleAt(y);
    const side = rr.chance(0.5) ? -1 : 1;
    const inner = CX + side * (lerp(36, 90, depth(y)) + 8 * s), outer = edgeX(y, side) - side * lerp(54, 118, depth(y));
    tufts.push([lerp(inner, outer, rr()), y, s, rr.int(0, 3)]);
  }
  for (const side of [-1, 1]) {
    const lawn = (c) => {
      const yi = [FAR + 30, NEAR];
      const pts = [];
      for (const y of yi) pts.push([CX + side * lerp(36, 90, depth(y)), y]);
      for (const y of [...yi].reverse()) pts.push([edgeX(y, side) - side * lerp(54, 118, depth(y)), y]);
      return pts;
    };
    p.group(L, { x: side < 0 ? PX0 : CX, y: FAR, w: CX - PX0, h: NEAR - FAR }, (c) => {
      const pts = lawn(c);
      c.fillStyle = LAWN; poly(c, pts); c.fill();
      c.strokeStyle = MAL_D; c.lineWidth = 2; c.stroke();
      // a border of small flowers along its edge
      c.save(); poly(c, pts); c.clip();
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; c.beginPath();
      for (let y = FAR + 40; y < NEAR; y += lerp(10, 22, depth(y))) { c.moveTo(PX0, y); c.lineTo(PX1, y); }
      c.stroke();
      // every flower stands on a sprig of leaves
      c.fillStyle = LAWN_D; c.beginPath();
      for (const [x, y, s, t] of tufts) if (t > 0 && Math.sign(x - CX) === side) { c.moveTo(x - 4 * s, y); c.quadraticCurveTo(x, y - 6 * s, x, y - 9 * s); c.quadraticCurveTo(x, y - 6 * s, x + 4 * s, y); c.closePath(); }
      c.fill();
      const cols = [LAWN_D, VERM, IVORY, SAFFRON];
      for (let k = 0; k < 4; k++) {
        c.fillStyle = cols[k]; c.beginPath();
        for (const [x, y, s, t] of tufts) if (t === k && Math.sign(x - CX) === side) {
          if (k === 0) { c.moveTo(x - 5 * s, y); c.quadraticCurveTo(x - 4 * s, y - 8 * s, x - 1 * s, y - 12 * s); c.lineTo(x, y - 3 * s); c.lineTo(x + 1 * s, y - 12 * s); c.quadraticCurveTo(x + 4 * s, y - 8 * s, x + 5 * s, y); c.closePath(); } else { c.moveTo(x + 2.8 * s, y - 9 * s); c.arc(x, y - 9 * s, 2.8 * s, 0, Math.PI * 2); }
        }
        c.fill();
      }
      c.restore();
    }, { t: 3.4 + (side > 0 ? 0.2 : 0), d: 0.9, reveal: 'fall', ease: 'inOut' });
  }
  // the long pool down the middle: blue water in a stone rim, with a basketweave of ripples
  const pool = [[CX - 30, FAR + 60], [CX + 30, FAR + 60], [CX + 74, NEAR - 60], [CX - 74, NEAR - 60]];
  p.group(L, { x: CX - 90, y: FAR + 50, w: 180, h: NEAR - FAR - 100 }, (c) => {
    c.fillStyle = IVORY; poly(c, [[CX - 36, FAR + 54], [CX + 36, FAR + 54], [CX + 82, NEAR - 54], [CX - 82, NEAR - 54]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = WATER; poly(c, pool); c.fill();
    c.save(); poly(c, pool); c.clip();
    c.strokeStyle = WATER_L; c.lineWidth = 1.2; c.beginPath();
    for (let y = FAR + 66, k = 0; y < NEAR - 60; y += lerp(7, 15, depth(y)), k++) {
      const s = scaleAt(y), hw = lerp(30, 74, depth(y));
      for (let x = CX - hw + (k % 2) * 5 * s; x < CX + hw; x += 10 * s) { c.moveTo(x, y); c.quadraticCurveTo(x + 2.5 * s, y - 3 * s, x + 5 * s, y); }
    }
    c.stroke();
    c.restore();
    // fountain basins along it
    for (const y of [800, 1000, 1220, 1420]) {
      const s = scaleAt(y);
      c.fillStyle = IVORY; c.beginPath(); c.ellipse(CX, y, 14 * s, 6 * s, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    }
  }, { t: 3.9, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // the stone polo goals at each end: two posts
  for (const y of [FAR + 36, NEAR - 30]) {
    const s = scaleAt(y);
    p.group(L, { x: CX - 120, y: y - 70 * s, w: 240, h: 80 * s }, (c) => {
      for (const dx of [-60, 60]) {
        const x = CX + dx * s * 1.2;
        c.fillStyle = IVORY; c.fillRect(x - 6 * s, y - 52 * s, 12 * s, 52 * s);
        c.fillStyle = BUFF_D; c.fillRect(x - 6 * s, y - 52 * s, 4 * s, 52 * s);
        c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x - 6 * s, y - 52 * s, 12 * s, 52 * s);
        c.fillStyle = IVORY; c.beginPath(); c.arc(x, y - 56 * s, 7 * s, 0, Math.PI * 2); c.fill(); c.stroke();
      }
    }, { t: 8.6 + (y > 1000 ? 0.2 : 0), d: 0.6, reveal: 'rise' });
  }
}

// a point inside a quad: u along it, v up it
function qp(q, u, v) {
  const [a, b, cc, d] = q;
  const x0 = lerp(a[0], b[0], u), y0 = lerp(a[1], b[1], u), x1 = lerp(d[0], cc[0], u), y1 = lerp(d[1], cc[1], u);
  return [lerp(x0, x1, v), lerp(y0, y1, v)];
}
// a pointed arch in a quad's unit square, as points
function archPts(u0, u1, v0, v1, spring) {
  const pts = [[u0, v0], [u0, spring]];
  const mid = (u0 + u1) / 2, hw = (u1 - u0) / 2;
  for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([u0 + hw * Math.sin(t * Math.PI / 2) ** 0.8, spring + (v1 - spring) * (1 - Math.cos(t * Math.PI / 2))]); }
  pts.push([mid, v1]);
  for (let k = 8; k >= 0; k--) { const t = k / 8; pts.push([u1 - hw * Math.sin(t * Math.PI / 2) ** 0.8, spring + (v1 - spring) * (1 - Math.cos(t * Math.PI / 2))]); }
  pts.push([u1, spring], [u1, v0]);
  return pts;
}
// the arcades down both sides: two stories of pointed arches, the bazaar's domes behind
const BAYS = 22;
function arcades(p) {
  for (const side of [-1, 1]) {
    const bays = [];
    for (let i = 0; i < BAYS; i++) {
      const ya = lerp(FAR, NEAR + 40, i / BAYS), yb = lerp(FAR, NEAR + 40, (i + 1) / BAYS);
      const ha = lerp(62, 190, depth(ya)), hb = lerp(62, 190, depth(yb));
      const a = [edgeX(ya, side), ya], b = [edgeX(yb, side), yb];
      // the wall is laid flat outward, as a miniaturist draws it, its top away from the square
      const top = (pt, h) => [pt[0] + side * h * 0.92, pt[1] - h * 0.42];
      bays.push({ q: [a, b, top(b, hb), top(a, ha)], s: scaleAt(ya), i, portal: false });
    }
    // the portal of Sheikh Lotfollah on the left, the gate under Ali Qapu on the right
    bays[6].portal = true;
    // the bazaar behind: rows of little domes over the shops, out to the frame
    const rr = rng(side < 0 ? 31 : 32), domes = [];
    for (let i = 0; i < BAYS; i++) {
      const { q, s } = bays[i];
      const [tx, ty] = qp(q, 0.5, 1);
      for (let k = 0; k < 6; k++) {
        const dx = side * (k * 46 * s + rr.range(0, 14) * s + 22 * s), dy = -k * 6 * s - rr.range(0, 10) * s;
        const x = tx + dx;
        if ((side < 0 && x < PX0 - 30) || (side > 0 && x > PX1 + 30)) break;
        domes.push([x, ty + dy + 6 * s, 15 * s * rr.range(0.85, 1.15), rr.chance(0.12)]);
      }
    }
    domes.sort((a, b) => a[1] - b[1]);
    for (let part = 0; part < 4; part++) {
      const mine = domes.filter((d) => Math.floor(depth(d[1]) * 4) === part || (part === 3 && depth(d[1]) >= 1) || (part === 0 && depth(d[1]) < 0));
      if (!mine.length) continue;
      p.group('domes', { x: side < 0 ? PX0 - 40 : CX, y: FAR - 120, w: CX - PX0 + 40, h: NEAR - FAR + 160 }, (c) => {
        for (const [x, y, rad, green] of mine) bazaarDome(c, x, y, rad, green);
      }, { t: 4.4 + part * 0.3 + (side > 0 ? 0.15 : 0), d: 0.7, reveal: 'rise' });
    }
    // the arcade itself, set bay by bay from the far end
    for (let g = 0; g < BAYS; g += 3) {
      const set = bays.slice(g, g + 3);
      const all = set.flatMap((b) => b.q);
      const xs = all.map((pt) => pt[0]), ys = all.map((pt) => pt[1]);
      p.group('arcade', { x: Math.min(...xs) - 30, y: Math.min(...ys) - 120, w: Math.max(...xs) - Math.min(...xs) + 60, h: Math.max(...ys) - Math.min(...ys) + 130 }, (c) => {
        for (const b of set) bay(c, b, side);
      }, { t: 3.8 + g * 0.09 + (side > 0 ? 0.1 : 0), d: 0.6, reveal: 'rise' });
    }
  }
}
function bazaarDome(c, x, y, rad, green) {
  c.fillStyle = BRICK; c.fillRect(x - rad * 1.2, y - rad * 0.2, rad * 2.4, rad * 1.2);
  c.fillStyle = green ? TURQ : BRICK_L; c.beginPath(); c.ellipse(x, y - rad * 0.2, rad, rad * 0.8, 0, Math.PI, 0); c.fill();
  c.strokeStyle = BRICK_D; c.lineWidth = 1; c.stroke();
  c.fillStyle = green ? TURQ_D : BRICK_D; c.beginPath(); c.ellipse(x - rad * 0.4, y - rad * 0.3, rad * 0.35, rad * 0.5, 0, Math.PI * 0.6, Math.PI * 1.5); c.fill();
  c.fillStyle = IVORY; c.fillRect(x - 1, y - rad * 1.15, 2, rad * 0.25);
}
function bay(c, b, side) {
  const { q, s, portal } = b;
  // the wall, in buff brick
  c.fillStyle = BRICK; poly(c, q); c.fill();
  c.strokeStyle = BRICK_D; c.lineWidth = 1; c.stroke();
  const P = (pts) => pts.map(([u, v]) => qp(q, u, v));
  if (portal) return;
  // two stories: a tall arch below, a smaller one above, each framed in blue tile
  for (const [v0, v1, sp] of [[0, 0.5, 0.32], [0.56, 0.9, 0.76]]) {
    c.fillStyle = TURQ; poly(c, P(archPts(0.1, 0.9, v0, v1 + 0.04, sp))); c.fill();
    c.fillStyle = DOOR; poly(c, P(archPts(0.18, 0.82, v0, v1, sp))); c.fill();
  }
  // the shop's open front on the ground floor: a lit stall in the arch
  c.fillStyle = mix(SAFFRON, BRICK, 0.4); poly(c, P([[0.24, 0], [0.76, 0], [0.76, 0.2], [0.24, 0.2]])); c.fill();
  // tile dots in the spandrels and a band under the parapet
  c.fillStyle = LAPIS;
  for (const u of [0.04, 0.96]) { const [x, y] = qp(q, u, 0.48); c.beginPath(); c.arc(x, y, 2 * s, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = TURQ_D; poly(c, P([[0, 0.94], [1, 0.94], [1, 1], [0, 1]])); c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.8; poly(c, q); c.stroke();
}

// ================================================================ the Shah Mosque
const SM = { x: CX, base: FAR - 6, top: 350, hw: 100 };
function shahMosque(p) {
  const { x, base, top, hw } = SM;
  // the courtyard wall behind the portal, with blind arches
  p.group('mosque', { x: x - 300, y: 520, w: 600, h: base - 520 + 6 }, (c) => {
    c.fillStyle = BRICK; c.fillRect(x - 290, 560, 580, base - 560);
    c.strokeStyle = BRICK_D; c.lineWidth = 1; c.strokeRect(x - 290, 560, 580, base - 560);
    for (let k = 0; k < 18; k++) {
      const ax = x - 280 + k * 32;
      c.fillStyle = TURQ; poly(c, archPtsAbs(ax, ax + 24, base - 8, 574, 590)); c.fill();
      c.fillStyle = LAPIS_D; poly(c, archPtsAbs(ax + 4, ax + 20, base - 8, 580, 594)); c.fill();
    }
    c.fillStyle = TURQ_D; c.fillRect(x - 290, 556, 580, 6);
  }, { t: 4.8, d: 0.8, reveal: 'rise' });
  dome(p, 'mosque', { x: x + 170, base: 470, hw: 104, top: 270, drum: 46, col: TURQ, line: LAPIS, dot: SAFFRON, t: 5.4 });
  // the sanctuary's two minarets behind, beside the dome
  minaret(p, x + 70, 486, 210, 13, 5.9);
  minaret(p, x + 270, 486, 210, 13, 6.0);
  // the portal: a tall frame of tile round a deep niche with a honeycomb vault
  p.group('mosque', { x: x - hw - 10, y: top - 10, w: 2 * hw + 20, h: base - top + 16 }, (c) => {
    c.fillStyle = TURQ_D; c.fillRect(x - hw, top, 2 * hw, base - top);
    // the panel of arabesque tile round the niche
    c.save(); c.beginPath(); c.rect(x - hw, top, 2 * hw, base - top); c.clip();
    lattice(c, x - hw, top, 2 * hw, base - top, 22, LAPIS, SAFFRON, IVORY);
    c.restore();
    // the white band of inscription along the top and down the sides
    c.fillStyle = IVORY; c.fillRect(x - hw + 8, top + 8, 2 * hw - 16, 20); c.fillRect(x - hw + 8, top + 8, 12, base - top - 8); c.fillRect(x + hw - 20, top + 8, 12, base - top - 8);
    c.strokeStyle = LAPIS; c.lineWidth = 1.4; c.beginPath();
    for (let k = x - hw + 14; k < x + hw - 14; k += 9) { c.moveTo(k, top + 24); c.lineTo(k + 2, top + 13); c.moveTo(k + 3, top + 20); c.quadraticCurveTo(k + 6, top + 16, k + 8, top + 22); }
    c.stroke();
    // the niche
    const nx0 = x - hw + 30, nx1 = x + hw - 30, ntop = top + 54;
    c.fillStyle = LAPIS_D; poly(c, archPtsAbs(nx0, nx1, base, ntop, ntop + 70)); c.fill();
    // the honeycomb: rows of small arches stepping in
    c.save(); poly(c, archPtsAbs(nx0, nx1, base, ntop, ntop + 70)); c.clip();
    for (let row = 0; row < 7; row++) {
      const y = ntop + 18 + row * 15, n = 3 + row, w = (nx1 - nx0) / n;
      for (let k = 0; k < n; k++) {
        const ax = nx0 + k * w;
        c.fillStyle = (row + k) % 2 ? TURQ : SAFFRON; poly(c, archPtsAbs(ax + 1, ax + w - 1, y + 14, y, y + 6)); c.fill();
        c.fillStyle = LAPIS_D; poly(c, archPtsAbs(ax + 4, ax + w - 4, y + 14, y + 5, y + 9)); c.fill();
      }
    }
    c.restore();
    // the doorway at the back of the niche
    c.fillStyle = DOOR; poly(c, archPtsAbs(x - 22, x + 22, base, base - 80, base - 64)); c.fill();
    c.fillStyle = GOLD; c.fillRect(x - 18, base - 50, 36, 3);
    c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(x - hw, top, 2 * hw, base - top);
  }, { t: 6.2, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the portal's two minarets, rising through the frame
  minaret(p, x - hw + 14, top + 4, 190, 15, 7.0, 'spires');
  minaret(p, x + hw - 14, top + 4, 190, 15, 7.15, 'spires');
}
function archPtsAbs(x0, x1, y0, y1, spring) {
  return archPts(0, 1, 0, 1, (y0 - spring) / (y0 - y1)).map(([u, v]) => [lerp(x0, x1, u), lerp(y0, y1, v)]);
}
// a net of curved lozenges, tile-like, in a rect
function lattice(c, x, y, w, h, step, line, dot, ground2) {
  c.strokeStyle = line; c.lineWidth = 2;
  c.beginPath();
  for (let k = -Math.ceil(h / step); k < Math.ceil(w / step) + 2; k++) {
    const x0 = x + k * step;
    c.moveTo(x0, y); for (let t = 0; t <= h; t += 6) c.lineTo(x0 + t * 0.7 + Math.sin(t / step * Math.PI) * 4, y + t);
    c.moveTo(x0 + h * 0.7, y); for (let t = 0; t <= h; t += 6) c.lineTo(x0 + h * 0.7 - t * 0.7 + Math.sin(t / step * Math.PI) * 4, y + t);
  }
  c.stroke();
  c.fillStyle = dot; c.beginPath();
  for (let yy = y + step * 0.35; yy < y + h; yy += step * 0.7) for (let xx = x + ((Math.round((yy - y) / (step * 0.7)) % 2) * step / 2); xx < x + w; xx += step) { c.moveTo(xx + 2.6, yy); c.arc(xx, yy, 2.6, 0, Math.PI * 2); }
  c.fill();
  if (ground2) { c.fillStyle = ground2; c.beginPath(); for (let yy = y + step * 0.7; yy < y + h; yy += step * 1.4) for (let xx = x + step / 2; xx < x + w; xx += step) { c.moveTo(xx + 1.3, yy); c.arc(xx, yy, 1.3, 0, Math.PI * 2); } c.fill(); }
}
// a dome on a drum: the bulb's outline, a net of arabesque, a finial
function domeShape(c, x, base, hw, top) {
  c.beginPath();
  c.moveTo(x - hw * 0.94, base);
  c.bezierCurveTo(x - hw * 1.08, base - (base - top) * 0.55, x - hw * 0.5, top + (base - top) * 0.1, x, top);
  c.bezierCurveTo(x + hw * 0.5, top + (base - top) * 0.1, x + hw * 1.08, base - (base - top) * 0.55, x + hw * 0.94, base);
  c.closePath();
}
function dome(p, L, o) {
  const { x, base, hw, top, drum, col, line, dot, t, n = 8, lw = 2.2 } = o;
  p.group(L, { x: x - hw - 10, y: base - 4, w: 2 * hw + 20, h: drum + 10 }, (c) => {
    // the drum: a band of inscription over windows
    c.fillStyle = TURQ_D; c.fillRect(x - hw * 0.94, base, hw * 1.88, drum);
    c.fillStyle = IVORY; c.fillRect(x - hw * 0.94, base + 4, hw * 1.88, 12);
    c.strokeStyle = LAPIS; c.lineWidth = 1.2; c.beginPath();
    for (let k = x - hw * 0.9; k < x + hw * 0.9; k += 8) { c.moveTo(k, base + 14); c.lineTo(k + 2, base + 6); c.moveTo(k + 3, base + 12); c.quadraticCurveTo(k + 5, base + 8, k + 7, base + 13); }
    c.stroke();
    for (let k = -3; k <= 3; k++) { const wx = x + k * hw * 0.26; c.fillStyle = LAPIS_D; poly(c, archPtsAbs(wx - 6, wx + 6, base + drum - 4, base + 20, base + 26)); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x - hw * 0.94, base, hw * 1.88, drum);
  }, { t, d: 0.6, reveal: 'rise' });
  p.group(L, { x: x - hw * 1.1, y: top - 50, w: hw * 2.2, h: base - top + 54 }, (c) => {
    domeShape(c, x, base, hw, top); c.fillStyle = col; c.fill();
    c.save(); domeShape(c, x, base, hw, top); c.clip();
    // the net: arcs from the foot sweeping up to the crown, crossing
    c.strokeStyle = line; c.lineWidth = lw; c.beginPath();
    for (let k = -n; k <= n; k++) {
      const fx = x + k * hw * 1.3 / n;
      c.moveTo(fx, base); c.quadraticCurveTo(fx + hw * 0.5, base - (base - top) * 0.55, x + k * 4, top);
      c.moveTo(fx, base); c.quadraticCurveTo(fx - hw * 0.5, base - (base - top) * 0.55, x + k * 4, top);
    }
    c.stroke();
    c.fillStyle = dot; c.beginPath();
    for (let row = 1; row < 9; row++) {
      const yy = base - (base - top) * row / 9.5, wr = hw * Math.sin(Math.acos(Math.min(1, row / 9.5))) ;
      for (let k = -6; k <= 6; k++) { const xx = x + k * hw * 0.16 * (wr / hw) + (row % 2) * hw * 0.08 * (wr / hw); if (Math.abs(xx - x) < wr) { c.moveTo(xx + 3, yy); c.arc(xx, yy, 3, 0, Math.PI * 2); } }
    }
    c.fill();
    // the light on its left shoulder, the shade on its right
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(x - hw * 0.45, base - (base - top) * 0.55, hw * 0.25, (base - top) * 0.35, 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(20,30,70,.16)'; c.beginPath(); c.ellipse(x + hw * 0.7, base - (base - top) * 0.4, hw * 0.35, (base - top) * 0.5, -0.2, 0, Math.PI * 2); c.fill();
    c.restore();
    domeShape(c, x, base, hw, top); c.strokeStyle = IVORY; c.lineWidth = 3; c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    // the finial: gold balls on a rod
    c.strokeStyle = GOLD_D; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, top); c.lineTo(x, top - 44); c.stroke();
    for (const [yy, rad] of [[top - 10, 6], [top - 22, 5], [top - 33, 4]]) { c.fillStyle = GOLD; c.beginPath(); c.arc(x, yy, rad, 0, Math.PI * 2); c.fill(); }
  }, { t: t + 0.4, d: 1.2, reveal: 'rise', ease: 'inOut' });
}
// a minaret: a slim shaft in patterned tile, a balcony on brackets, a little cap
function minaret(p, x, base, h, hw, t, L = 'mosque') {
  const top = base - h;
  p.group(L, { x: x - hw - 12, y: top - 40, w: 2 * hw + 24, h: base - top + 44 }, (c) => {
    c.fillStyle = BRICK; c.fillRect(x - hw, top + 30, 2 * hw, base - top - 30);
    // a diamond net of blue tile on the shaft
    c.save(); c.beginPath(); c.rect(x - hw, top + 30, 2 * hw, base - top - 30); c.clip();
    c.strokeStyle = LAPIS; c.lineWidth = 1.6; c.beginPath();
    for (let y = top + 20; y < base + 20; y += 10) { c.moveTo(x - hw, y); c.lineTo(x + hw, y + 10); c.moveTo(x + hw, y); c.lineTo(x - hw, y + 10); }
    c.stroke();
    c.fillStyle = TURQ; c.fillRect(x - hw, base - 40, 2 * hw, 8); c.fillRect(x - hw, top + 60, 2 * hw, 6);
    c.fillStyle = 'rgba(60,30,10,.16)'; c.fillRect(x + hw * 0.3, top, hw * 0.7, h);
    c.restore();
    // the balcony on its honeycomb brackets
    c.fillStyle = TURQ; poly(c, [[x - hw, top + 30], [x - hw - 7, top + 18], [x + hw + 7, top + 18], [x + hw, top + 30]]); c.fill();
    c.fillStyle = IVORY; c.fillRect(x - hw - 7, top + 10, 2 * hw + 14, 8);
    c.strokeStyle = LAPIS; c.lineWidth = 1; c.beginPath(); for (let k = x - hw - 5; k < x + hw + 6; k += 4) { c.moveTo(k, top + 10); c.lineTo(k, top + 18); } c.stroke();
    // the lantern and its cap
    c.fillStyle = BRICK_L; c.fillRect(x - hw * 0.75, top - 8, hw * 1.5, 18);
    c.fillStyle = LAPIS_D; c.fillRect(x - 2, top - 4, 4, 10);
    c.fillStyle = TURQ; c.beginPath(); c.moveTo(x - hw * 0.85, top - 8); c.quadraticCurveTo(x - hw * 0.7, top - 26, x, top - 32); c.quadraticCurveTo(x + hw * 0.7, top - 26, x + hw * 0.85, top - 8); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    c.strokeStyle = GOLD_D; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, top - 32); c.lineTo(x, top - 40); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x - hw, top + 30, 2 * hw, base - top - 30);
  }, { t, d: 1.1, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the other two
// Sheikh Lotfollah: a buff dome netted in blue, over a portal in the left arcade
function lotfollah(p) {
  const y = lerp(FAR, NEAR + 40, 6.5 / BAYS), ex = edgeX(y, -1), s = scaleAt(y);
  dome(p, 'mosque', { x: ex - 120, base: y - 104 * s - 30, hw: 92, top: y - 104 * s - 200, drum: 36, col: BUFF, line: LAPIS_D, dot: IVORY, t: 6.9, n: 4, lw: 3 });
  // the portal, square to us, standing in the arcade
  const x0 = ex - 70, x1 = ex + 16, top = y - 150 * s - 70, base = y + 14;
  p.group('mosque', { x: x0 - 6, y: top - 6, w: x1 - x0 + 12, h: base - top + 12 }, (c) => {
    c.fillStyle = TURQ_D; c.fillRect(x0, top, x1 - x0, base - top);
    c.save(); c.beginPath(); c.rect(x0, top, x1 - x0, base - top); c.clip(); lattice(c, x0, top, x1 - x0, base - top, 14, LAPIS, SAFFRON); c.restore();
    c.fillStyle = IVORY; c.fillRect(x0 + 5, top + 5, x1 - x0 - 10, 10);
    c.fillStyle = LAPIS_D; poly(c, archPtsAbs(x0 + 14, x1 - 14, base, top + 30, top + 60)); c.fill();
    c.fillStyle = DOOR; poly(c, archPtsAbs(x0 + 28, x1 - 28, base, base - 44, base - 34)); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x0, top, x1 - x0, base - top);
  }, { t: 7.4, d: 0.8, reveal: 'rise' });
}
// Ali Qapu: a tall brick block with an arched gate, the wooden veranda (talar) of
// slender columns under a flat painted roof, and the upper floors behind
function aliQapu(p) {
  const y = lerp(FAR, NEAR + 40, 6.5 / BAYS), ex = edgeX(y, 1);
  const x0 = ex - 30, x1 = ex + 170, base = y + 18;
  const talar = base - 150, roof = talar - 84;
  p.group('mosque', { x: x0 - 30, y: roof - 80, w: x1 - x0 + 60, h: base - roof + 86 }, (c) => {
    // the upper block behind the veranda
    c.fillStyle = BRICK; c.fillRect(x0 + 34, roof - 64, x1 - x0 - 68, 70);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x0 + 34, roof - 64, x1 - x0 - 68, 70);
    for (let k = 0; k < 5; k++) { const wx = x0 + 50 + k * 22; c.fillStyle = DOOR; poly(c, archPtsAbs(wx, wx + 12, roof - 12, roof - 50, roof - 42)); c.fill(); }
    c.fillStyle = BRICK_L; c.fillRect(x0 + 70, roof - 88, x1 - x0 - 140, 26); c.strokeRect(x0 + 70, roof - 88, x1 - x0 - 140, 26);
    // the base: brick, the great gate, small windows
    c.fillStyle = BRICK; c.fillRect(x0, talar, x1 - x0, base - talar);
    c.fillStyle = BRICK_D; c.fillRect(x0, talar, 12, base - talar);
    c.fillStyle = TURQ; poly(c, archPtsAbs(x0 + 70, x1 - 70, base, talar + 34, talar + 58)); c.fill();
    c.fillStyle = DOOR; poly(c, archPtsAbs(x0 + 78, x1 - 78, base, talar + 42, talar + 64)); c.fill();
    for (const wx of [x0 + 24, x0 + 46, x1 - 58, x1 - 36]) for (const wy of [talar + 24, talar + 82]) { c.fillStyle = TURQ_D; poly(c, archPtsAbs(wx, wx + 12, wy + 30, wy, wy + 8)); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(x0, talar, x1 - x0, base - talar);
    // the veranda's floor, a balustrade, the columns and the roof
    c.fillStyle = IVORY; c.fillRect(x0 - 8, talar - 6, x1 - x0 + 16, 8);
    c.strokeStyle = DOOR; c.lineWidth = 1.2; c.beginPath(); for (let k = x0 - 4; k < x1 + 6; k += 6) { c.moveTo(k, talar - 6); c.lineTo(k, talar - 20); } c.moveTo(x0 - 8, talar - 20); c.lineTo(x1 + 8, talar - 20); c.stroke();
    c.fillStyle = mix(DOOR, INK, 0.2); c.fillRect(x0 + 6, roof + 10, x1 - x0 - 12, talar - roof - 16);
    c.fillStyle = mix(SAFFRON, BRICK, 0.3); c.fillRect(x0 + 30, roof + 22, x1 - x0 - 60, talar - roof - 40);
    for (let k = 0; k < 6; k++) {
      const cx2 = lerp(x0 - 2, x1 + 2, k / 5);
      c.fillStyle = BRICK_L; c.fillRect(cx2 - 3, roof + 6, 6, talar - roof - 6);
      c.strokeStyle = DOOR; c.lineWidth = 0.8; c.strokeRect(cx2 - 3, roof + 6, 6, talar - roof - 6);
      c.fillStyle = GOLD; c.fillRect(cx2 - 5, roof + 6, 10, 5);
    }
    // the flat roof, painted underneath in a lattice
    c.fillStyle = DOOR; c.fillRect(x0 - 22, roof - 4, x1 - x0 + 44, 12);
    c.fillStyle = VERM; c.fillRect(x0 - 22, roof + 6, x1 - x0 + 44, 4);
    c.fillStyle = GOLD; for (let k = x0 - 18; k < x1 + 20; k += 10) c.fillRect(k, roof, 4, 4);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x0 - 22, roof - 4, x1 - x0 + 44, 14);
  }, { t: 7.2, d: 1.2, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ trees and people
// plane trees down both sides of the square, a cypress at each near corner
function trees(p) {
  const rr = rng(44), list = [];
  for (const side of [-1, 1]) {
    for (let k = 0; k < 11; k++) {
      const y = lerp(FAR + 40, NEAR - 20, (k + 0.3) / 11);
      const s = scaleAt(y);
      list.push({ x: edgeX(y, side) - side * lerp(30, 72, depth(y)), y, s, kind: 0, seed: rr.int(0, 1e6) });
    }
  }
  list.push({ x: edgeX(NEAR - 40, -1) - (-1) * 150, y: NEAR - 10, s: 1.1, kind: 1, seed: 7 });
  list.push({ x: edgeX(NEAR - 40, 1) - 150, y: NEAR - 10, s: 1.1, kind: 1, seed: 8 });
  list.sort((a, b) => a.y - b.y);
  for (let i = 0; i < list.length; i += 3) {
    const set = list.slice(i, i + 3);
    for (const tr of set) {
      const rt = rng(tr.seed);
      tr.leaves = [];
      for (let k = 0; k < 40; k++) { const a = rt() * Math.PI * 2, d = Math.sqrt(rt()); tr.leaves.push([Math.cos(a) * d, Math.sin(a) * d * 0.85, rt() * Math.PI, rt.int(0, 2)]); }
    }
    const ys = set.map((t) => t.y);
    p.group('trees', { x: PX0, y: Math.min(...ys) - 160, w: PX1 - PX0, h: Math.max(...ys) - Math.min(...ys) + 170 }, (c) => {
      for (const tr of set) (tr.kind ? cypress(c, tr) : plane(c, tr));
    }, { t: 8.0 + i * 0.06, d: 0.6, reveal: 'pop' });
  }
}
function plane(c, { x, y, s, leaves }) {
  const rad = 40 * s;
  c.fillStyle = DOOR; c.fillRect(x - 3 * s, y - 34 * s, 6 * s, 34 * s);
  c.fillStyle = MAL_D; c.beginPath(); c.ellipse(x, y - 34 * s - rad * 0.7, rad, rad * 0.85, 0, 0, Math.PI * 2); c.fill();
  // leaves painted one by one, three greens
  const cols = [MAL, '#5ea36a', '#8cc27a'];
  for (let k = 0; k < 3; k++) {
    c.fillStyle = cols[k]; c.beginPath();
    for (const [lx, ly, a, t] of leaves) if (t === k) { const px = x + lx * rad * 0.9, py = y - 34 * s - rad * 0.7 + ly * rad * 0.9; c.moveTo(px, py); c.ellipse(px, py, 6 * s, 3.4 * s, a, 0, Math.PI * 2); }
    c.fill();
  }
  c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, y - 34 * s - rad * 0.7, rad, rad * 0.85, 0, 0, Math.PI * 2); c.stroke();
}
function cypress(c, { x, y, s }) {
  const h = 230 * s;
  c.fillStyle = MAL_D; c.beginPath(); c.moveTo(x, y - h); c.bezierCurveTo(x + 30 * s, y - h * 0.6, x + 26 * s, y - 20, x + 4, y); c.lineTo(x - 4, y); c.bezierCurveTo(x - 26 * s, y - 20, x - 30 * s, y - h * 0.6, x, y - h); c.fill();
  c.strokeStyle = MAL; c.lineWidth = 1.4; c.beginPath();
  for (let yy = y - h + 14; yy < y - 10; yy += 9) { const w = Math.min(22 * s, (yy - (y - h)) * 0.25); c.moveTo(x - w, yy + 6); c.quadraticCurveTo(x, yy - 4, x + w, yy + 6); }
  c.stroke();
  // a flowering vine twined round it, as painters liked
  c.fillStyle = '#f0c6cf'; c.beginPath(); for (let k = 0; k < 14; k++) { const yy = y - h * 0.15 - k * h * 0.055, xx = x + Math.sin(k * 1.3) * 14 * s; c.moveTo(xx + 3.4, yy); c.arc(xx, yy, 3.4, 0, Math.PI * 2); } c.fill();
}
// people about the square: merchants, strollers, onlookers by the goals
function folk(p) {
  const rr = rng(66), list = [];
  for (let i = 0; i < 70; i++) {
    const y = lerp(FAR + 50, NEAR - 6, rr() ** 0.9), side = rr.chance(0.5) ? -1 : 1;
    const inPath = rr.chance(0.7);
    const x = inPath ? edgeX(y, side) - side * rr.range(6, lerp(26, 54, depth(y))) : CX + side * rr.range(lerp(36, 90, depth(y)) - 4, lerp(36, 90, depth(y)) + 12);
    list.push([x, y, scaleAt(y), rr.int(0, ROBES.length - 1), rr.int(0, ROBES.length - 1), rr.chance(0.3)]);
  }
  list.sort((a, b) => a[1] - b[1]);
  for (let i = 0; i < list.length; i += 10) {
    const set = list.slice(i, i + 10);
    const ys = set.map((f) => f[1]);
    p.group('folk', { x: PX0, y: Math.min(...ys) - 60, w: PX1 - PX0, h: Math.max(...ys) - Math.min(...ys) + 66 }, (c) => {
      for (const f of set) person(c, ...f);
    }, { t: 9.0 + i * 0.03, d: 0.6, reveal: 'drop', dy: 12 });
  }
}
function person(c, x, y, s, robe, sash, seated) {
  s *= 1.35;
  const h = (seated ? 22 : 34) * s;
  c.fillStyle = ROBES[robe]; poly(c, [[x - 6 * s, y], [x + 6 * s, y], [x + 3.5 * s, y - h], [x - 3.5 * s, y - h]]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
  c.fillStyle = ROBES[sash]; c.fillRect(x - 4 * s, y - h * 0.55, 8 * s, 2.4 * s);
  c.fillStyle = '#e8c29a'; c.beginPath(); c.arc(x, y - h - 3.4 * s, 3.4 * s, 0, Math.PI * 2); c.fill();
  // a white turban with a little plume
  c.fillStyle = IVORY; c.beginPath(); c.ellipse(x, y - h - 6.4 * s, 4.4 * s, 2.8 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = VERM; c.fillRect(x - 0.6 * s, y - h - 12 * s, 1.4 * s, 4 * s);
}

// ================================================================ the panel and the name
function panel(p) {
  const x0 = PX0, x1 = PX1, y0 = TY0, y1 = TY1, mx = CX, my = (y0 + y1) / 2;
  // the field: lapis, with a gold scroll of tendrils over it
  const rr = rng(91), curls = [];
  for (let i = 0; i < 46; i++) curls.push([rr.range(x0 + 20, x1 - 20), rr.range(y0 + 18, y1 - 18), rr.range(9, 16), rr.chance(0.5) ? 1 : -1, rr() * 6]);
  p.group('panel', { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, (c) => {
    c.fillStyle = LAPIS; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.strokeStyle = GOLD; c.lineWidth = 1.6; c.beginPath();
    for (const [x, y, rad, dir, a0] of curls) {
      for (let k = 0; k <= 24; k++) { const t = k / 24, a = a0 + dir * t * Math.PI * 2.2, rr2 = rad * (1 - t * 0.85); const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2; k ? c.lineTo(px, py) : c.moveTo(px, py); }
    }
    c.stroke();
    c.fillStyle = GOLD; c.beginPath();
    for (const [x, y, rad, , a0] of curls) { const px = x + Math.cos(a0) * rad, py = y + Math.sin(a0) * rad; c.moveTo(px + 3, py); c.ellipse(px, py, 4, 2, a0, 0, Math.PI * 2); }
    c.fill();
  }, { t: 10.4, d: 1.0, reveal: 'iris', ease: 'inOut' });
  // the cartouche: a lobed oval of gold with a fine border, small roundels either side
  const cw = 330, ch = 82;
  const lobed = (c, k) => {
    c.beginPath();
    const n = 28;
    for (let i = 0; i <= n * 8; i++) {
      const t = (i / (n * 8)) * Math.PI * 2, lobe = 1 + 0.045 * Math.abs(Math.sin(t * n / 2));
      const px = mx + Math.cos(t) * (cw + k) * lobe, py = my + Math.sin(t) * (ch + k) * lobe;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  };
  p.group('panel', { x: mx - cw - 40, y: my - ch - 30, w: 2 * cw + 80, h: 2 * ch + 60 }, (c) => {
    lobed(c, 14); c.fillStyle = IVORY; c.fill();
    lobed(c, 8); c.fillStyle = GOLD; c.fill();
    lobed(c, 0); c.fillStyle = IVORY; c.fill();
    // a pale floral ground inside, faint
    c.save(); lobed(c, 0); c.clip();
    c.fillStyle = 'rgba(207,164,67,.18)'; c.beginPath(); for (let x = mx - cw; x < mx + cw; x += 26) for (let y = my - ch; y < my + ch; y += 26) { c.moveTo(x + 5, y); c.arc(x, y, 5, 0, Math.PI * 2); } c.fill();
    c.restore();
    lobed(c, 0); c.strokeStyle = LAPIS_D; c.lineWidth = 1.4; c.stroke();
    lobed(c, 14); c.strokeStyle = GOLD_D; c.lineWidth = 1.2; c.stroke();
    // the pendants at the two ends
    for (const s of [-1, 1]) {
      const px = mx + s * (cw + 40);
      c.fillStyle = GOLD; c.beginPath(); c.moveTo(px - s * 26, my); c.lineTo(px, my - 16); c.lineTo(px + s * 22, my); c.lineTo(px, my + 16); c.closePath(); c.fill();
      c.strokeStyle = GOLD_D; c.lineWidth = 1; c.stroke();
      c.fillStyle = VERM; c.beginPath(); c.arc(px, my, 5, 0, Math.PI * 2); c.fill();
    }
  }, { t: 10.9, d: 0.8, reveal: 'pop' });
  // roundels at the far ends of the panel
  for (const s of [-1, 1]) {
    const rx = mx + s * 470;
    p.group('panel', { x: rx - 60, y: my - 60, w: 120, h: 120 }, (c) => {
      c.fillStyle = IVORY; c.beginPath(); c.arc(rx, my, 50, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD; c.beginPath(); c.arc(rx, my, 44, 0, Math.PI * 2); c.fill();
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        c.fillStyle = k % 2 ? TURQ : VERM;
        c.beginPath(); c.ellipse(rx + Math.cos(a) * 26, my + Math.sin(a) * 26, 12, 5, a, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = LAPIS; c.beginPath(); c.arc(rx, my, 13, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD_L; c.beginPath(); c.arc(rx, my, 5, 0, Math.PI * 2); c.fill();
      c.strokeStyle = GOLD_D; c.lineWidth = 1.2; c.beginPath(); c.arc(rx, my, 50, 0, Math.PI * 2); c.stroke();
    }, { t: 11.2 + (s > 0 ? 0.15 : 0), d: 0.7, reveal: 'iris' });
  }
  // اصفهان, set whole so its letters join, wiped in from the right as it is read
  p.mark('panel', {
    t: 11.6, d: 1.4, reveal: 'wipeL', ease: 'inOut', box: { x: mx - cw, y: my - ch - 30, w: 2 * cw, h: 2 * ch + 50 },
    draw: (c) => {
      c.font = `700 132px ${FONT}`; c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillStyle = GOLD; c.fillText('اصفهان', mx + 3, my + 40 + 3);
      c.fillStyle = LAPIS_D; c.fillText('اصفهان', mx, my + 40);
      c.direction = 'ltr';
    },
  });
  p.type('panel', 'ISFAHAN', mx, 1880, { family: FONT, size: 52, color: VERM, align: 'center', track: 0.5, t: 12.9, gap: 0.1, d: 0.6 });
  // small gold stars either side of it
  p.group('panel', { x: mx - 330, y: 1840, w: 660, h: 50 }, (c) => {
    for (const s of [-1, 1]) {
      const x = mx + s * 290, y = 1864;
      c.fillStyle = GOLD; c.beginPath();
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, rad = k % 2 ? 6 : 15; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
      c.closePath(); c.fill();
      c.fillStyle = VERM; c.beginPath(); c.arc(x, y, 3.4, 0, Math.PI * 2); c.fill();
    }
  }, { t: 13.6, d: 0.5, reveal: 'pop' });
}

// ================================================================ life
function life(p) {
  // polo players galloping round the lawns
  const riders = [
    // each loop kept inside its lawn, clear of the pool's rim and the people by it
    [CX - 210, 1180, 85, 50, 0.55, 0, 0], [CX + 190, 1060, 80, 50, -0.5, 2, 2], [CX - 160, 880, 60, 34, 0.6, 4, 4],
    [CX + 234, 1330, 95, 50, 0.45, 1, 1], [CX + 160, 870, 55, 30, -0.6, 3, 3],
  ];
  p.live('riders', {
    t: 9.8, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const [x0, y0, ax, ay, w, ph, col] of riders) {
        const a = time * w + ph;
        const x = x0 + Math.cos(a) * ax, y = y0 + Math.sin(a) * ay;
        const dir = -Math.sin(a) * w > 0 ? 1 : -1;
        rider(c, x, y, scaleAt(y) * 1.7, dir, time * 9 + ph * 3, col);
      }
    },
  });
  // the fountains playing in the pool
  p.live('riders', {
    t: 10.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = 'rgba(245,250,255,.85)'; c.lineCap = 'round';
      for (const [k, y] of [800, 1000, 1220, 1420].entries()) {
        const s = scaleAt(y), h = (26 + Math.sin(time * 3 + k) * 4) * s;
        c.lineWidth = 1.6 * s; c.beginPath();
        for (const dx of [-1, 0, 1]) { c.moveTo(CX, y - 2 * s); c.quadraticCurveTo(CX + dx * 4 * s, y - h, CX + dx * 12 * s, y - 2 * s); }
        c.stroke();
      }
    },
  });
  // a skein of cranes crossing the gold, and pigeons wheeling over the dome
  p.live('air', {
    t: 10.5, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineCap = 'round'; c.lineWidth = 2;
      for (let k = 0; k < 7; k++) {
        const x = ((time * 14 + 300 - k * 26) % 1300) + PX0 - 60, y = 250 + Math.abs(k - 3) * 14 + Math.sin(time + k) * 2;
        if (x < PX0 + 8 || x > PX1 - 8) continue;
        const f = Math.sin(time * 4 + k) * 5;
        c.beginPath(); c.moveTo(x - 12, y - f); c.quadraticCurveTo(x - 5, y - 4, x, y); c.quadraticCurveTo(x + 5, y - 4, x + 12, y - f); c.stroke();
      }
      c.lineWidth = 1.4;
      for (let k = 0; k < 6; k++) {
        const a = time * 0.7 + k * 1.05, x = 960 + Math.cos(a) * (110 + k * 6), y = 360 + Math.sin(a) * 40;
        const f = Math.sin(time * 9 + k) * 3;
        c.beginPath(); c.moveTo(x - 6, y - f); c.quadraticCurveTo(x - 2, y - 2, x, y); c.quadraticCurveTo(x + 2, y - 2, x + 6, y - f); c.stroke();
      }
    },
  });
}
function rider(c, x, y, s, dir, ph, col) {
  c.save(); c.translate(x, y); c.scale(s * dir, s);
  const horse = ['#f2ead6', '#9a5a32', '#3a2a22', '#c8a070', '#f2ead6'][col];
  // legs, at the gallop
  c.strokeStyle = horse === '#f2ead6' ? '#bfae90' : mix(horse, INK, 0.3); c.lineWidth = 3; c.lineCap = 'round';
  const g = Math.sin(ph), h2 = Math.cos(ph);
  c.beginPath();
  c.moveTo(12, -16); c.lineTo(18 + g * 8, -2 + Math.abs(g) * -2);
  c.moveTo(8, -16); c.lineTo(12 - g * 6, -1);
  c.moveTo(-12, -16); c.lineTo(-18 + h2 * 7, -1);
  c.moveTo(-8, -16); c.lineTo(-12 - h2 * 6, -2);
  c.stroke();
  // body, neck and head
  c.fillStyle = horse; c.beginPath(); c.ellipse(0, -22, 19, 8.5, 0, 0, Math.PI * 2); c.fill();
  poly(c, [[12, -26], [20, -40], [27, -40], [30, -34], [24, -32], [18, -20]]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.ellipse(0, -22, 19, 8.5, 0, 0, Math.PI * 2); c.stroke();
  // the tail, flying, and a red saddle cloth
  c.strokeStyle = horse === '#3a2a22' ? INK : mix(horse, INK, 0.35); c.lineWidth = 3; c.beginPath(); c.moveTo(-18, -26); c.quadraticCurveTo(-28, -30, -32, -22 + g * 2); c.stroke();
  c.fillStyle = VERM; c.fillRect(-8, -30, 14, 8);
  // the rider: robe, turban, and the mallet swung low
  c.fillStyle = ROBES[(col * 3 + 1) % ROBES.length]; poly(c, [[-6, -28], [6, -28], [3, -46], [-4, -46]]); c.fill();
  c.fillStyle = '#e8c29a'; c.beginPath(); c.arc(0, -50, 3.6, 0, Math.PI * 2); c.fill();
  c.fillStyle = IVORY; c.beginPath(); c.ellipse(0, -53, 4.6, 3, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = DOOR; c.lineWidth = 1.4; const sw = Math.sin(ph * 0.5) * 0.6;
  c.beginPath(); c.moveTo(3, -40); c.lineTo(3 + Math.cos(0.9 + sw) * 30, -40 + Math.sin(0.9 + sw) * 30); c.stroke();
  c.restore();
}
