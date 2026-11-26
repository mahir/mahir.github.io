// Seoul: a minhwa folk painting on hanji, mounted in indigo silk. Bugaksan and
// Inwangsan in mineral blue-green with moss dots, hills striped like a tiger's
// coat, Gyeongbokgung's Geunjeongjeon and Gwanghwamun among a field of tiled
// roofs, Namsan with its tower, the river in scalloped waves, peonies on a
// garden rock and a pine where a magpie sits. Flat soft color, uneven ink line.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, rng } from '../kit.js';

const PAPER = '#eddfc0', INK = '#2b241f', INK2 = 'rgba(43,36,31,.55)';
const SILK = '#2e4a5a', SILK_L = '#456a7a', SILK_D = '#223947', RED = '#b8432f', SEAL = '#c0392b';
const BLUEGREEN = '#5f9488', BG_L = '#8fb8a3', BG_D = '#3f6f69', AZURE = '#4f7fa8';
const OCHRE = '#d9a253', TIGER = '#d98536', STRIPE = '#3a2a20', SAND = '#e6c991';
const ROOF = '#55606b', ROOF_L = '#7d8894', ROOF_D = '#3b434c', WALL = '#f5efe0', WOOD = '#8a4a32';
const DAN_G = '#3f8a74', DAN_R = '#c0483a', DAN_B = '#3f6ea0';
const PINE = '#3f6b48', PINE_L = '#6f9a62', BARK = '#9a5a3c', BARK_D = '#6d3a26';
const PEONY = ['#e2758a', '#f2b2bb', '#c23d4f', '#f8e2df', '#f0d06a'];
const WATER = '#bcd6d6', WAVE = '#4f7fa8';

export const city = {
  id: 'seoul', name: 'Seoul', wall: '#1f3340',
  alt: "A folk painting of Seoul in the minhwa manner: Gyeongbokgung's Geunjeongjeon hall and Gwanghwamun gate among a town of tiled roofs, Bugaksan and Inwangsan behind, hills striped like a tiger, Namsan with N Seoul Tower, curling clouds, a river of scalloped waves with two mandarin ducks, peonies by a garden rock and a magpie in a pine",
  google: 'family=Gowun+Batang:wght@400;700',
  fonts: [['700 190px "Gowun Batang"', '서울'], ['400 40px "Gowun Batang"', 'SEOUL'], ['700 30px "Gowun Batang"', '서울']],
  build,
};

// the painting inside its silk mount
const X0 = 112, Y0 = 112, X1 = W - 112, Y1 = H - 112;

function build() {
  const p = new Plate({ paper: PAPER, seed: 1394 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  // few layers: each one is a full canvas laid down every frame
  p.stack('sky', 'clouds', 'far', 'bugak', 'inwang', 'namsan', 'tower', 'hills', 'palace', 'roofs', 'river', 'rock', 'peony', 'pine', 'needles', 'title', 'mount');
  p.layer('mount', { clip: false });

  mount(p, r);
  sky(p, r);
  mountains(p, r);
  namsan(p, r);
  hills(p, r);
  palace(p, r);
  roofs(p, r);
  river(p, r);
  garden(p, r);
  pine(p, r);
  magpie(p);
  life(p, r);
  title(p);
  return p;
}

// ================================================================ ink helpers
// an uneven brush line: points nudged a little, fixed at build time
function wobble(r, pts, amt = 1.6, step = 14) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k < n; k++) out.push([lerp(ax, bx, k / n) + r.range(-amt, amt), lerp(ay, by, k / n) + r.range(-amt, amt)]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function path(c, pts, close) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}
// a smooth ridge through control heights: [[x, y], ...] sampled into a line
function ridge(ctrl, step = 8) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const [ax, ay] = ctrl[i], [bx, by] = ctrl[i + 1];
    for (let x = ax; x < bx; x += step) { const t = (x - ax) / (bx - ax), e = t * t * (3 - 2 * t); out.push([x, lerp(ay, by, e)]); }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

// ================================================================ the silk mount
function mount(p, r) {
  // the indigo silk with its woven cloud pattern, the red and cream bands inside
  const dots = [];
  for (let y = 30; y < H; y += 46) for (let x = 30 + ((y / 46) % 2) * 23; x < W; x += 46) if (x < X0 - 24 || x > X1 + 24 || y < Y0 - 24 || y > Y1 + 24) dots.push([x, y]);
  p.group('mount', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = SILK;
    c.beginPath(); c.rect(0, 0, W, H); c.rect(X0 - 2, Y0 - 2, X1 - X0 + 4, Y1 - Y0 + 4); c.fill('evenodd');
    // the weave: small paired cloud curls
    c.strokeStyle = SILK_L; c.lineWidth = 1.6; c.lineCap = 'round';
    c.beginPath();
    for (const [x, y] of dots) { c.moveTo(x + 7, y); c.arc(x, y, 7, 0, Math.PI * 1.5); c.moveTo(x + 4, y - 7); c.arc(x + 10, y - 7, 6, Math.PI, Math.PI * 2.2); }
    c.stroke();
    c.strokeStyle = SILK_D; c.lineWidth = 3; c.strokeRect(14, 14, W - 28, H - 28);
  }, { t: 0, d: 0.9, reveal: 'fade' });
  p.group('mount', { x: X0 - 30, y: Y0 - 30, w: X1 - X0 + 60, h: Y1 - Y0 + 60 }, (c) => {
    c.strokeStyle = RED; c.lineWidth = 9; c.strokeRect(X0 - 16, Y0 - 16, X1 - X0 + 32, Y1 - Y0 + 32);
    c.strokeStyle = '#e9d9b0'; c.lineWidth = 6; c.strokeRect(X0 - 6, Y0 - 6, X1 - X0 + 12, Y1 - Y0 + 12);
    c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
  }, { t: 0.5, d: 1.0, reveal: 'iris', ease: 'inOut' });
}

// ================================================================ the sky: the paper itself, a faint wash at the horizon
function sky(p, r) {
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: 900 }, (c) => {
    // a faint wash of color laid in bands, as a painter would
    const bands = ['rgba(150,190,200,.16)', 'rgba(150,190,200,.10)', 'rgba(230,190,140,.10)', 'rgba(230,180,120,.16)'];
    bands.forEach((col, i) => { c.fillStyle = col; c.fillRect(X0, Y0 + 120 + i * 170, X1 - X0, 260); });
  }, { t: 0.6, d: 1.4, reveal: 'fall', ease: 'inOut' });
}

// ================================================================ the mountains
// a minhwa peak: an inked outline, a blue-green cap over a paler foot, fiber
// strokes down its faces, and moss dots along the ridges
function peak(p, layer, r, o) {
  const top = wobble(r, ridge(o.ctrl), 1.4, 12);
  const shape = [...top, [o.ctrl[o.ctrl.length - 1][0], o.base], [o.ctrl[0][0], o.base]];
  // the cap: the ridge pushed down a little
  const cap = [...top, ...top.slice().reverse().map(([x, y]) => [x, y + o.cap * (0.6 + 0.4 * Math.sin(x * 0.02))])];
  const fibers = [];
  for (let i = 0; i < o.fibers; i++) {
    const k = Math.floor(r() * (top.length - 2)) + 1;
    const [x, y] = top[k];
    const len = r.range(30, o.fiberLen);
    const slope = (top[k + 1][1] - top[k - 1][1]) * 0.6;
    fibers.push([[x, y + 6], [x + slope * 0.5 + r.range(-6, 6), y + len * 0.5], [x + slope + r.range(-10, 10), y + len]]);
  }
  const moss = [];
  for (let i = 0; i < o.moss; i++) {
    const k = Math.floor(r() * top.length);
    const [x, y] = top[k];
    moss.push([x + r.range(-4, 4), y + r.range(-2, 10), r.range(1.8, 3.8)]);
  }
  p.group(layer, boxOf(shape, 12), (c) => {
    c.fillStyle = o.foot; path(c, shape, true); c.fill();
    c.fillStyle = o.top; path(c, cap, true); c.fill();
    c.save(); path(c, shape, true); c.clip();
    c.strokeStyle = o.fiber; c.lineWidth = 1.5; c.lineCap = 'round';
    c.beginPath(); for (const [a, b, d] of fibers) { c.moveTo(a[0], a[1]); c.quadraticCurveTo(b[0], b[1], d[0], d[1]); } c.stroke();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 2.2; c.lineJoin = 'round'; path(c, top); c.stroke();
  }, { t: o.t, d: 1.4, reveal: 'rise', ease: 'out' });
  p.group(layer, boxOf(top, 16), (c) => {
    c.fillStyle = INK; for (const [x, y, rr] of moss) { c.beginPath(); c.ellipse(x, y, rr * 1.3, rr, 0, 0, Math.PI * 2); c.fill(); }
  }, { t: o.t + 1.2, d: 0.6, reveal: 'fade' });
}
function mountains(p, r) {
  // the far range, pale
  const farR = wobble(r, ridge([[X0, 700], [260, 640], [420, 690], [600, 600], [900, 660], [1120, 590], [1300, 650], [X1, 610]]), 1, 14);
  p.group('far', { x: X0, y: 560, w: X1 - X0, h: 500 }, (c) => {
    c.fillStyle = '#b9cbc4'; path(c, [...farR, [X1, 1000], [X0, 1000]], true); c.fill();
    c.strokeStyle = INK2; c.lineWidth = 1.4; path(c, farR); c.stroke();
  }, { t: 1.2, d: 1.2, reveal: 'rise' });
  // Bugaksan, behind the palace: a rounded granite peak
  peak(p, 'bugak', r, {
    ctrl: [[400, 960], [520, 760], [640, 560], [720, 470], [790, 520], [880, 650], [980, 760], [1080, 960]],
    base: 1000, cap: 110, top: BLUEGREEN, foot: BG_L, fiber: BG_D, fibers: 70, fiberLen: 150, moss: 70, t: 1.6,
  });
  // Inwangsan, to the west, rocky
  peak(p, 'inwang', r, {
    ctrl: [[X0, 900], [220, 840], [330, 760], [420, 700], [480, 740], [560, 820], [660, 1000]],
    base: 1040, cap: 80, top: AZURE, foot: '#a9c3c8', fiber: '#3d6687', fibers: 46, fiberLen: 120, moss: 46, t: 2.1,
  });
}

// ================================================================ Namsan and its tower
function namsan(p, r) {
  const top = wobble(r, ridge([[930, 1120], [1080, 840], [1200, 690], [1270, 668], [1340, 690], [1440, 800], [X1, 880]]), 1.4, 12);
  const shape = [...top, [X1, 1160], [930, 1160]];
  const trees = [];
  for (let i = 0; i < 90; i++) {
    const x = r.range(980, X1 - 10);
    const k = top.reduce((best, q) => (Math.abs(q[0] - x) < Math.abs(best[0] - x) ? q : best), top[0]);
    const y = k[1] + 14 + r() ** 0.8 * Math.max(0, Math.min(260, 1140 - k[1] - 14));
    trees.push([x, y, r.range(6, 11), r.int(0, 1)]);
  }
  trees.sort((a, b) => a[1] - b[1]);
  p.group('namsan', boxOf(shape, 12), (c) => {
    c.fillStyle = '#93b47e'; path(c, shape, true); c.fill();
    c.fillStyle = '#6f9a62'; path(c, [...top, ...top.slice().reverse().map(([x, y]) => [x, y + 60])], true); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2.2; path(c, top); c.stroke();
  }, { t: 3.0, d: 1.3, reveal: 'rise' });
  // small pines on its slopes: a stem and three tiers of needles
  p.group('namsan', boxOf(shape, 20), (c) => {
    for (const [x, y, s, k] of trees) {
      c.strokeStyle = BARK_D; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - s * 1.6); c.stroke();
      c.fillStyle = k ? PINE : '#4d7a52';
      for (let j = 0; j < 3; j++) { c.beginPath(); c.ellipse(x, y - s * (0.6 + j * 0.55), s * (1 - j * 0.25), s * 0.32, 0, 0, Math.PI * 2); c.fill(); }
    }
  }, { t: 4.0, d: 0.8, reveal: 'fade' });
  // the N Seoul Tower: a white shaft, its round observation decks, the mast
  const x = 1270, base = 676;
  p.group('tower', { x: x - 50, y: 280, w: 100, h: base - 270 }, (c) => {
    c.fillStyle = '#f6f1e6'; c.strokeStyle = INK; c.lineWidth = 1.6;
    // the base and the shaft
    poly(c, [[x - 22, base], [x - 9, base - 50], [x - 7, 470], [x + 7, 470], [x + 9, base - 50], [x + 22, base]]); c.fill(); c.stroke();
    c.fillStyle = '#d9d1c2'; poly(c, [[x + 2, base], [x + 3, 470], [x + 7, 470], [x + 9, base - 50], [x + 22, base]]); c.fill();
    // the decks
    c.fillStyle = '#f6f1e6';
    c.beginPath(); c.roundRect(x - 24, 440, 48, 30, 6); c.fill(); c.stroke();
    c.beginPath(); c.roundRect(x - 20, 420, 40, 20, 5); c.fill(); c.stroke();
    c.fillStyle = '#5c7f9c'; c.fillRect(x - 22, 448, 44, 7); c.fillRect(x - 18, 427, 36, 5);
    // the mast, banded red and white
    c.fillStyle = '#f6f1e6'; c.fillRect(x - 5, 360, 10, 60); c.strokeRect(x - 5, 360, 10, 60);
    for (let y = 300; y < 360; y += 12) { c.fillStyle = (y / 12) % 2 ? DAN_R : '#f6f1e6'; c.fillRect(x - 3, y, 6, 12); }
    c.strokeRect(x - 3, 300, 6, 60);
    c.beginPath(); c.moveTo(x, 300); c.lineTo(x, 286); c.stroke();
  }, { t: 4.4, d: 1.3, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ hills striped like a tiger's coat
function hills(p, r) {
  const set = [
    { ctrl: [[X0, 960], [220, 880], [380, 900], [520, 980], [620, 1090]], base: 1300, t: 2.8 },
    { ctrl: [[840, 1080], [960, 970], [1120, 905], [1300, 950], [X1, 990]], base: 1300, t: 3.1 },
    { ctrl: [[X0, 1110], [200, 1050], [360, 1070], [480, 1150], [580, 1260]], base: 1300, t: 3.4 },
    { ctrl: [[900, 1270], [1040, 1130], [1240, 1080], [1400, 1100], [X1, 1120]], base: 1300, t: 3.7 },
  ];
  set.forEach((h, i) => {
    const top = wobble(r, ridge(h.ctrl), 1.2, 12);
    const shape = [...top, [h.ctrl[h.ctrl.length - 1][0], h.base], [h.ctrl[0][0], h.base]];
    // stripes: tapered, wavering brush marks through the whole hill, as on a tiger's flank
    const yAt = (x) => { for (let k = 1; k < top.length; k++) if (top[k][0] >= x) return top[k][1]; return top[top.length - 1][1]; };
    const stripes = [];
    const x0 = h.ctrl[0][0], x1 = h.ctrl[h.ctrl.length - 1][0];
    for (let n = 0; n < (x1 - x0) / 4.5; n++) {
      const x = r.range(x0 + 6, x1 - 6), ty = yAt(x);
      const y = ty + r() ** 0.7 * (h.base - ty - 30);
      if (y < ty + 4) continue;
      const len = r.range(40, 110) * (r.chance(0.3) ? 0.5 : 1), w = r.range(3.5, 8);
      stripes.push([x, y, r.range(-14, 14), len, w, r.range(-8, 8)]);
    }
    p.group('hills', boxOf(shape, 10), (c) => {
      c.fillStyle = i % 2 ? OCHRE : TIGER; path(c, shape, true); c.fill();
      c.save(); path(c, shape, true); c.clip();
      c.fillStyle = STRIPE;
      for (const [x, y, dx, len, w, bend] of stripes) {
        c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x + dx * 0.4 + bend, y + len * 0.5, x + dx, y + len);
        c.quadraticCurveTo(x + dx * 0.4 + bend + w * 0.8, y + len * 0.5, x + w, y); c.closePath(); c.fill();
      }
      c.restore();
      c.strokeStyle = INK; c.lineWidth = 2; path(c, top); c.stroke();
    }, { t: h.t, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  });
}

// ================================================================ tiled roofs, the palace and the town
// a giwa roof: the eave line sags and turns up at its ends, the ridge flares;
// the tiles in rows, a white ridge cap. (x0..x1 the eave, y the eave line)
function roof(c, x0, x1, y, h, o = {}) {
  const w = x1 - x0, lift = h * (o.lift ?? 0.35), inset = w * (o.inset ?? 0.16);
  const sag = h * 0.12;
  const col = o.col || ROOF;
  // eave from left tip to right tip, then the ridge back
  c.beginPath();
  c.moveTo(x0 - w * 0.02, y - lift);
  c.quadraticCurveTo(x0 + w * 0.18, y + sag * 0.2, x0 + w * 0.5, y + sag * 0.5);
  c.quadraticCurveTo(x1 - w * 0.18, y + sag * 0.2, x1 + w * 0.02, y - lift);
  c.lineTo(x1 - inset, y - h);
  c.quadraticCurveTo(x0 + w * 0.5, y - h + sag, x0 + inset, y - h);
  c.closePath();
  c.fillStyle = col; c.fill();
  // tile rows
  if (o.tiles !== false) {
    c.save(); c.clip();
    c.strokeStyle = o.tileCol || ROOF_L; c.lineWidth = Math.max(0.8, w / 160);
    c.beginPath();
    const n = Math.max(6, Math.round(w / (o.pitch || 7)));
    for (let i = 1; i < n; i++) {
      const t = i / n, xb = lerp(x0, x1, t), xt = lerp(x0 + inset, x1 - inset, t);
      c.moveTo(xt, y - h); c.lineTo(xb, y + sag * 0.5);
    }
    c.stroke();
    c.restore();
  }
  c.strokeStyle = INK; c.lineWidth = o.lw ?? Math.max(1, w / 110); c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(x0 - w * 0.02, y - lift);
  c.quadraticCurveTo(x0 + w * 0.18, y + sag * 0.2, x0 + w * 0.5, y + sag * 0.5);
  c.quadraticCurveTo(x1 - w * 0.18, y + sag * 0.2, x1 + w * 0.02, y - lift);
  c.lineTo(x1 - inset, y - h);
  c.quadraticCurveTo(x0 + w * 0.5, y - h + sag, x0 + inset, y - h);
  c.closePath(); c.stroke();
  // the ridge cap, white, its ends turned up
  const rw = Math.max(2, h * 0.13);
  c.fillStyle = o.ridge || '#e9e4d8';
  c.beginPath();
  c.moveTo(x0 + inset - rw, y - h - rw * 1.6); c.quadraticCurveTo(x0 + w * 0.5, y - h + sag - rw, x1 - inset + rw, y - h - rw * 1.6);
  c.lineTo(x1 - inset + rw * 0.6, y - h + rw * 0.4); c.quadraticCurveTo(x0 + w * 0.5, y - h + sag + rw * 0.4, x0 + inset - rw * 0.6, y - h + rw * 0.4);
  c.closePath(); c.fill(); c.lineWidth = Math.max(0.8, w / 160); c.stroke();
}
// the painted band of brackets under a palace eave: green with red and blue
function dancheong(c, x0, x1, y, h) {
  c.fillStyle = DAN_G; c.fillRect(x0, y, x1 - x0, h);
  const n = Math.round((x1 - x0) / (h * 1.1));
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, (i + 0.5) / n);
    c.fillStyle = DAN_R; c.beginPath(); c.arc(x, y + h * 0.5, h * 0.28, 0, Math.PI * 2); c.fill();
    c.fillStyle = DAN_B; c.fillRect(x - h * 0.45, y + h * 0.15, h * 0.12, h * 0.7); c.fillRect(x + h * 0.33, y + h * 0.15, h * 0.12, h * 0.7);
    c.fillStyle = '#f3ead6'; c.beginPath(); c.arc(x, y + h * 0.5, h * 0.11, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x0, y, x1 - x0, h);
}
// a row of red columns with white walls and lattice between
function colonnade(c, x0, x1, y0, y1, n) {
  c.fillStyle = WALL; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  // lattice doors
  c.strokeStyle = 'rgba(138,74,50,.7)'; c.lineWidth = 1;
  c.beginPath();
  for (let x = x0 + 4; x < x1; x += 6) { c.moveTo(x, y0 + 4); c.lineTo(x, y1 - 2); }
  for (let y = y0 + 6; y < y1; y += 6) { c.moveTo(x0, y); c.lineTo(x1, y); }
  c.stroke();
  for (let i = 0; i <= n; i++) {
    const x = lerp(x0, x1, i / n);
    c.fillStyle = DAN_R; c.fillRect(x - 3.5, y0, 7, y1 - y0);
  }
  c.strokeStyle = INK; c.lineWidth = 1.3; c.strokeRect(x0, y0, x1 - x0, y1 - y0);
}
// a stone terrace with a balustrade
function terrace(c, x0, x1, y0, y1) {
  c.fillStyle = '#d8d2c2'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  c.strokeStyle = 'rgba(43,36,31,.35)'; c.lineWidth = 1;
  c.beginPath();
  for (let y = y0 + 8; y < y1; y += 8) { c.moveTo(x0, y); c.lineTo(x1, y); }
  for (let y = y0, k = 0; y < y1; y += 8, k++) for (let x = x0 + (k % 2) * 12; x < x1; x += 24) { c.moveTo(x, y); c.lineTo(x, Math.min(y1, y + 8)); }
  c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(x0, y0, x1 - x0, y1 - y0);
  // the balustrade
  c.strokeStyle = '#8f8878'; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(x0, y0 - 8); c.lineTo(x1, y0 - 8);
  for (let x = x0; x <= x1; x += 14) { c.moveTo(x, y0); c.lineTo(x, y0 - 10); }
  c.stroke();
}

function palace(p, r) {
  const cx = 720;
  // the long corridors and walls round the courtyard
  p.group('palace', { x: 330, y: 920, w: 800, h: 220 }, (c) => {
    c.fillStyle = '#e8dcc0'; c.fillRect(380, 930, 680, 190);
    c.strokeStyle = 'rgba(43,36,31,.25)'; c.lineWidth = 1; c.beginPath(); for (let y = 940; y < 1090; y += 11) { c.moveTo(390, y); c.lineTo(1050, y); } c.stroke();
    colonnade(c, 360, 1080, 1092, 1120, 36);
    roof(c, 350, 1090, 1092, 26, { inset: 0.01, lift: 0.3, pitch: 8 });
    // the side corridors running back
    for (const [a, b] of [[370, 470], [970, 1070]]) { colonnade(c, a, b, 966, 990, 6); roof(c, a - 8, b + 8, 966, 20, { inset: 0.05, pitch: 7 }); }
  }, { t: 4.6, d: 1.0, reveal: 'rise' });
  // Geunjeongjeon: two stone terraces, a hall of two stories, two roofs
  p.group('palace', { x: cx - 230, y: 640, w: 460, h: 320 }, (c) => {
    c.translate(0, -60);
    terrace(c, cx - 200, cx + 200, 980, 1010);
    terrace(c, cx - 170, cx + 170, 952, 980);
    colonnade(c, cx - 150, cx + 150, 900, 952, 9);
    dancheong(c, cx - 156, cx + 156, 888, 12);
    roof(c, cx - 214, cx + 214, 892, 46, { inset: 0.12, lift: 0.5, pitch: 7 });
    colonnade(c, cx - 110, cx + 110, 822, 846, 7);
    dancheong(c, cx - 116, cx + 116, 812, 10);
    roof(c, cx - 170, cx + 170, 816, 70, { inset: 0.22, lift: 0.4, pitch: 7 });
    // the steps up the middle
    c.fillStyle = '#cfc8b6'; c.fillRect(cx - 18, 952, 36, 58);
    c.strokeStyle = INK2; c.lineWidth = 1; c.beginPath(); for (let y = 956; y < 1010; y += 5) { c.moveTo(cx - 18, y); c.lineTo(cx + 18, y); } c.stroke();
  }, { t: 5.0, d: 1.4, reveal: 'rise', ease: 'out' });
  // Gwanghwamun: a granite base with three arched gates, a pavilion of two roofs
  const gy = 1304;
  p.group('palace', { x: X0, y: gy - 80, w: X1 - X0, h: 90 }, (c) => {
    // the palace's outer wall running out from the gate, white plaster under a tiled cap
    c.fillStyle = '#efe6d2'; c.fillRect(X0, gy - 46, X1 - X0, 46);
    c.strokeStyle = 'rgba(43,36,31,.3)'; c.lineWidth = 1; c.beginPath();
    for (let x = X0 + 20; x < X1; x += 40) { c.moveTo(x, gy - 46); c.lineTo(x, gy); }
    c.stroke();
    c.fillStyle = '#c9b48e'; c.fillRect(X0, gy - 14, X1 - X0, 14);
    c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(X0, gy - 46, X1 - X0, 46);
    roof(c, X0 - 20, X1 + 20, gy - 44, 18, { inset: 0.002, lift: 0.2, pitch: 6 });
  }, { t: 5.4, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  p.group('palace', { x: cx - 230, y: 980, w: 460, h: gy - 970 }, (c) => {
    c.fillStyle = '#ddd6c4'; c.fillRect(cx - 190, gy - 104, 380, 104);
    c.strokeStyle = 'rgba(43,36,31,.3)'; c.lineWidth = 1; c.beginPath();
    for (let y = gy - 96, k = 0; y < gy; y += 12, k++) { c.moveTo(cx - 190, y); c.lineTo(cx + 190, y); for (let x = cx - 190 + (k % 2) * 16; x < cx + 190; x += 32) { c.moveTo(x, y); c.lineTo(x, y + 12); } }
    c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(cx - 190, gy - 104, 380, 104);
    for (const [ax, aw] of [[cx - 108, 44], [cx, 54], [cx + 108, 44]]) {
      c.fillStyle = '#2c2a2e'; c.beginPath(); c.moveTo(ax - aw / 2, gy); c.lineTo(ax - aw / 2, gy - 50); c.arc(ax, gy - 50, aw / 2, Math.PI, 0); c.lineTo(ax + aw / 2, gy); c.closePath(); c.fill();
      c.fillStyle = DAN_R; c.fillRect(ax - aw / 2 + 4, gy - 40, aw / 2 - 5, 40); c.fillRect(ax + 1, gy - 40, aw / 2 - 5, 40);
      c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ax - aw / 2, gy); c.lineTo(ax - aw / 2, gy - 50); c.arc(ax, gy - 50, aw / 2, Math.PI, 0); c.lineTo(ax + aw / 2, gy); c.stroke();
    }
    colonnade(c, cx - 150, cx + 150, gy - 136, gy - 104, 9);
    dancheong(c, cx - 156, cx + 156, gy - 146, 11);
    roof(c, cx - 200, cx + 200, gy - 140, 38, { inset: 0.1, lift: 0.5, pitch: 7 });
    colonnade(c, cx - 104, cx + 104, gy - 196, gy - 176, 7);
    dancheong(c, cx - 110, cx + 110, gy - 204, 9);
    roof(c, cx - 156, cx + 156, gy - 198, 58, { inset: 0.24, lift: 0.4, pitch: 7 });
    // a name board under the upper eave
    c.fillStyle = '#1f2a3a'; c.fillRect(cx - 22, gy - 194, 44, 16); c.strokeStyle = '#d9b65a'; c.lineWidth = 1.4; c.strokeRect(cx - 20, gy - 192, 40, 12);
  }, { t: 5.6, d: 1.4, reveal: 'rise', ease: 'out' });
  // the plaza in front
  p.group('palace', { x: X0, y: gy - 4, w: X1 - X0, h: 40 }, (c) => {
    c.fillStyle = '#e4d6b6'; c.fillRect(cx - 260, gy, 520, 24);
    c.strokeStyle = INK2; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - 260, gy); c.lineTo(cx + 260, gy); c.stroke();
  }, { t: 6.4, d: 0.6, reveal: 'wipe' });
}

// a town house: white walls, a wooden frame, its tiled roof
function hanok(c, x, y, w, front, col = ROOF) {
  const h = w * 0.3;
  if (front) {
    const wh = w * 0.28;
    c.fillStyle = WALL; c.fillRect(x + w * 0.1, y, w * 0.8, wh);
    c.strokeStyle = WOOD; c.lineWidth = Math.max(1, w / 60);
    c.beginPath();
    for (let k = 0; k <= 3; k++) { const xx = x + w * (0.1 + 0.8 * k / 3); c.moveTo(xx, y); c.lineTo(xx, y + wh); }
    c.moveTo(x + w * 0.1, y + wh * 0.4); c.lineTo(x + w * 0.9, y + wh * 0.4);
    c.stroke();
    c.fillStyle = 'rgba(138,74,50,.35)'; c.fillRect(x + w * 0.4, y + wh * 0.45, w * 0.2, wh * 0.55);
  }
  roof(c, x, x + w, y + 2, h, { col, inset: 0.14, lift: 0.4, pitch: Math.max(4, w / 14), lw: Math.max(0.9, w / 90) });
}
function roofs(p, r) {
  // rows of houses from the palace's walls down to the river, larger as they come near
  const rows = [];
  for (let y = 1330, k = 0; y < 1545; k++) {
    const w = lerp(80, 130, (y - 1330) / 215);
    const list = [];
    for (let x = X0 - w * 0.4 + r.range(0, w * 0.5); x < X1; x += w * r.range(0.72, 0.95)) {
      // keep the palace and gate clear
      if (r() < 0.1) continue;
      list.push([x, y + r.range(-6, 6), w * r.range(0.85, 1.1), r() < 0.14, r.pick([ROOF, '#606b76', '#4b555f', ROOF])]);
    }
    rows.push(list);
    y += w * 0.36;
  }
  // in three layers, near rows last; each row lands in its turn
  rows.forEach((list, i) => {
    const layer = 'roofs';
    const near = i >= rows.length - 3;
    const pts = list.flatMap(([x, y, w]) => [[x - w * 0.05, y - w * 0.4], [x + w * 1.05, y + w * 0.35]]);
    p.group(layer, boxOf(pts, 6), (c) => {
      for (const [x, y, w, tree, col] of list) {
        hanok(c, x, y, w, true, col);
        if (tree) {
          // a persimmon tree in a yard, with its fruit
          c.fillStyle = '#5f7f45'; c.beginPath(); c.arc(x + w * 0.85, y - w * 0.28, w * 0.2, 0, Math.PI * 2); c.fill();
          c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
          c.fillStyle = '#e8822e'; for (const [a, b] of [[-0.08, -0.05], [0.07, 0.02], [0, -0.13], [-0.1, 0.06]]) { c.beginPath(); c.arc(x + w * (0.85 + a), y - w * (0.28 + b), w * 0.03, 0, Math.PI * 2); c.fill(); }
        }
      }
    }, { t: 6.0 + i * 0.28, d: 0.8, reveal: 'drop', dy: 16 });
  });
}

// ================================================================ the river, in scalloped waves
function river(p, r) {
  const y0 = 1545, y1 = 1680;
  p.group('river', { x: X0, y: y0 - 10, w: X1 - X0, h: y1 - y0 + 20 }, (c) => {
    c.fillStyle = WATER; c.fillRect(X0, y0, X1 - X0, y1 - y0);
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(X0, y0); c.lineTo(X1, y0); c.moveTo(X0, y1); c.lineTo(X1, y1); c.stroke();
  }, { t: 8.4, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  const rows = [];
  for (let y = y0 + 22, k = 0; y < y1 + 6; y += 22, k++) rows.push([y, k]);
  rows.forEach(([y, k], i) => {
    p.group('river', { x: X0, y: y - 24, w: X1 - X0, h: 30 }, (c) => {
      c.save(); c.beginPath(); c.rect(X0, y0, X1 - X0, y1 - y0); c.clip();
      const s = 34;
      for (let x = X0 - s + (k % 2) * s * 0.5; x < X1 + s; x += s) {
        c.fillStyle = '#d9ebe6'; c.beginPath(); c.arc(x + s / 2, y, s / 2, Math.PI, 0); c.fill();
        c.strokeStyle = WAVE; c.lineWidth = 1.8; c.beginPath(); c.arc(x + s / 2, y, s / 2, Math.PI, 0); c.stroke();
        c.lineWidth = 1; c.beginPath(); c.arc(x + s / 2, y, s / 2 - 6, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
        c.beginPath(); c.arc(x + s / 2, y, s / 2 - 11, Math.PI * 1.2, Math.PI * 1.8); c.stroke();
      }
      c.restore();
    }, { t: 8.6 + i * 0.18, d: 0.7, reveal: i % 2 ? 'wipeL' : 'wipe' });
  });
}

// ================================================================ the garden rock and the peonies
function peonyFlower(c, x, y, rad, k, ang = 0) {
  const base = PEONY[k], light = PEONY[k === 2 ? 0 : 1], deep = k === 2 ? '#8e2433' : '#c2536b';
  c.save(); c.translate(x, y); c.rotate(ang);
  // outer petals: a ring of rounded lobes
  const n = 9;
  c.fillStyle = base; c.strokeStyle = INK; c.lineWidth = 1.6;
  c.beginPath();
  for (let i = 0; i <= n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    if (i === 0) c.moveTo(Math.cos(a0) * rad * 0.8, Math.sin(a0) * rad * 0.62);
    c.quadraticCurveTo(Math.cos(am) * rad * 1.18, Math.sin(am) * rad * 0.9, Math.cos(a1) * rad * 0.8, Math.sin(a1) * rad * 0.62);
  }
  c.fill(); c.stroke();
  // the cup of inner petals, lighter, opening upward
  c.fillStyle = light;
  c.beginPath(); c.moveTo(-rad * 0.62, -rad * 0.05);
  for (let i = 0; i < 5; i++) { const xa = lerp(-rad * 0.62, rad * 0.62, i / 5), xb = lerp(-rad * 0.62, rad * 0.62, (i + 1) / 5); c.quadraticCurveTo((xa + xb) / 2, -rad * (0.62 + (i % 2) * 0.12), xb, -rad * 0.05); }
  c.quadraticCurveTo(0, rad * 0.5, -rad * 0.62, -rad * 0.05); c.fill(); c.stroke();
  // the deep center and its stamens
  c.fillStyle = deep; c.beginPath(); c.ellipse(0, -rad * 0.08, rad * 0.3, rad * 0.16, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = PEONY[4]; for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; c.beginPath(); c.arc(Math.cos(a) * rad * 0.22, -rad * 0.1 + Math.sin(a) * rad * 0.14, rad * 0.04, 0, Math.PI * 2); c.fill(); }
  // petal veins
  c.strokeStyle = deep; c.lineWidth = 1;
  c.beginPath(); for (let i = 0; i < 7; i++) { const a = Math.PI * (0.15 + i * 0.1); c.moveTo(Math.cos(a) * rad * 0.4, Math.sin(a) * rad * 0.3); c.lineTo(Math.cos(a) * rad * 0.85, Math.sin(a) * rad * 0.62); } c.stroke();
  c.restore();
}
function peonyLeaf(c, x, y, len, ang) {
  c.save(); c.translate(x, y); c.rotate(ang);
  // three lobes, the middle longest
  c.fillStyle = '#5d8a55'; c.strokeStyle = INK; c.lineWidth = 1.4;
  for (const [a, l] of [[-0.5, 0.7], [0.5, 0.7], [0, 1]]) {
    c.save(); c.rotate(a);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * l * 0.5, -len * 0.2, len * l, 0); c.quadraticCurveTo(len * l * 0.5, len * 0.2, 0, 0); c.fill(); c.stroke();
    c.strokeStyle = '#2f5a36'; c.beginPath(); c.moveTo(len * 0.1, 0); c.lineTo(len * l * 0.85, 0); c.stroke(); c.strokeStyle = INK;
    c.restore();
  }
  c.restore();
}
function garden(p, r) {
  // the near bank: a green rise with its stripes, small stones and lingzhi along it
  const top = wobble(r, ridge([[X0, 1730], [380, 1700], [700, 1722], [1000, 1694], [1250, 1716], [X1, 1700]]), 1.4, 12);
  const marks = [];
  for (let k = 2; k < top.length - 2; k += 2) marks.push([top[k][0] + r.range(-4, 4), top[k][1] + r.range(6, 40), r.range(18, 40)]);
  const stones = [[620, 1790, 46, 26], [880, 1760, 34, 20], [1120, 1830, 52, 30], [760, 1850, 30, 18], [1460, 1800, 40, 24]];
  p.group('rock', { x: X0, y: 1680, w: X1 - X0, h: Y1 - 1680 }, (c) => {
    c.fillStyle = '#c4cc8e'; path(c, [...top, [X1, Y1], [X0, Y1]], true); c.fill();
    c.fillStyle = '#d8d9a6'; path(c, [...top.map(([x, y]) => [x, y + 50]), [X1, Y1], [X0, Y1]], true); c.fill();
    c.strokeStyle = '#7f8f4e'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath(); for (const [x, y, l] of marks) { c.moveTo(x, y); c.quadraticCurveTo(x + 4, y + l * 0.5, x + 2, y + l); } c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2; path(c, top); c.stroke();
    for (const [x, y, a, b] of stones) {
      c.fillStyle = '#a7b6b4'; c.beginPath(); c.ellipse(x, y, a, b, 0, Math.PI, 0); c.lineTo(x + a, y + 4); c.lineTo(x - a, y + 4); c.closePath(); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();
      c.fillStyle = INK; for (const k of [-0.5, 0, 0.45]) { c.beginPath(); c.arc(x + k * a, y - b * 0.85 + Math.abs(k) * b * 0.4, 2.2, 0, Math.PI * 2); c.fill(); }
    }
    // lingzhi at the foot of the pine: red-brown caps on short stems
    for (const [x, y, sc] of [[1220, 1800, 1], [1260, 1820, 0.8], [1190, 1830, 0.7]]) {
      c.strokeStyle = '#7a3a24'; c.lineWidth = 4 * sc; c.beginPath(); c.moveTo(x, y + 18 * sc); c.quadraticCurveTo(x - 4 * sc, y + 6 * sc, x, y); c.stroke();
      c.fillStyle = '#b5532f'; c.beginPath(); c.ellipse(x, y, 22 * sc, 12 * sc, -0.1, Math.PI, 0); c.quadraticCurveTo(x, y + 6 * sc, x - 22 * sc, y); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
      c.strokeStyle = '#e9b36a'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y - 1, 15 * sc, 7 * sc, -0.1, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    }
  }, { t: 8.8, d: 1.0, reveal: 'rise' });
  // the rock: a pierced garden stone, blue-gray, inked in heavy strokes
  const rock = wobble(r, [[150, 1890], [140, 1760], [190, 1640], [170, 1560], [240, 1500], [330, 1520], [380, 1600], [360, 1690], [420, 1780], [430, 1890]], 2.2, 16);
  const mossK = Array.from({ length: 26 }, () => r.int(0, rock.length - 1));
  p.group('rock', boxOf(rock, 10), (c) => {
    c.fillStyle = '#9fb2b6'; path(c, rock, true); c.fill();
    c.fillStyle = '#c4d2d0'; c.beginPath(); c.ellipse(260, 1600, 50, 60, 0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5f7378';
    for (const [x, y, a, b] of [[250, 1590, 22, 30], [330, 1700, 18, 26], [210, 1760, 26, 18], [310, 1820, 16, 22]]) { c.beginPath(); c.ellipse(x, y, a, b, 0.4, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 3; c.lineJoin = 'round'; path(c, rock, true); c.stroke();
    c.lineWidth = 1.6; for (const [x, y, a, b] of [[250, 1590, 22, 30], [330, 1700, 18, 26], [210, 1760, 26, 18], [310, 1820, 16, 22]]) { c.beginPath(); c.ellipse(x, y, a, b, 0.4, 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = INK; for (const k of mossK) { c.beginPath(); c.arc(rock[k][0] + 4, rock[k][1] + 3, 2.4, 0, Math.PI * 2); c.fill(); }
  }, { t: 9.0, d: 1.0, reveal: 'rise' });
  // the peonies on their stems, leaves round them
  const flowers = [[420, 1590, 62, 0, -0.1], [560, 1700, 70, 2, 0.08], [380, 1760, 58, 1, 0.12], [660, 1600, 48, 3, -0.15], [520, 1840, 54, 0, 0], [710, 1800, 44, 1, 0.1]];
  const leaves = [];
  for (let i = 0; i < 26; i++) leaves.push([r.range(330, 780), r.range(1560, 1880), r.range(38, 60), r.range(0, Math.PI * 2)]);
  p.group('peony', { x: 300, y: 1500, w: 520, h: 400 }, (c) => {
    c.strokeStyle = '#4d6b3a'; c.lineWidth = 2.6; c.lineCap = 'round';
    for (const [x, y] of flowers) { c.beginPath(); c.moveTo(560, 1890); c.quadraticCurveTo((x + 560) / 2 + 20, (y + 1890) / 2, x, y + 20); c.stroke(); }
    for (const [x, y, l, a] of leaves) peonyLeaf(c, x, y, l, a);
  }, { t: 9.4, d: 0.9, reveal: 'rise' });
  flowers.forEach(([x, y, rad, k, a], i) => {
    p.group('peony', { x: x - rad * 1.4, y: y - rad * 1.2, w: rad * 2.8, h: rad * 2.3 }, (c) => peonyFlower(c, x, y, rad, k, a), { t: 9.8 + i * 0.16, d: 0.6, reveal: 'pop' });
  });
  // buds
  p.group('peony', { x: 300, y: 1480, w: 520, h: 120 }, (c) => {
    for (const [x, y] of [[470, 1520], [760, 1700], [330, 1680]]) {
      c.fillStyle = '#5d8a55'; c.beginPath(); c.ellipse(x, y + 6, 10, 8, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = PEONY[0]; c.beginPath(); c.ellipse(x, y - 4, 9, 12, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    }
  }, { t: 10.8, d: 0.5, reveal: 'pop' });
  // grass along the foot
  const grass = [];
  for (let i = 0; i < 220; i++) { const x = r.range(X0, X1), y = r.range(1700, Y1); grass.push([[x, y], [x + r.range(-10, 10), y - r.range(10, 26)]]); }
  p.strokes('rock', grass, '#5d7a45', 2, { t: 10.0, d: 0.6, reveal: 'fade' });
}

// ================================================================ the pine, rising from the lower right
function pine(p, r) {
  const trunk = [[1330, Y1 + 10], [1340, 1780], [1300, 1660], [1330, 1540], [1270, 1420], [1200, 1340]];
  const branches = [
    [[1220, 1360], [1120, 1340], [1000, 1360], [880, 1340]],
    [[1290, 1460], [1380, 1400], [1460, 1380]],
    [[1240, 1380], [1250, 1280], [1310, 1220], [1400, 1200]],
  ];
  const tufts = [
    [870, 1326, 70], [950, 1336, 64], [1050, 1318, 76], [1140, 1328, 66], [1440, 1366, 74], [1370, 1392, 56],
    [1410, 1186, 78], [1320, 1206, 70], [1250, 1262, 62], [1196, 1316, 60], [1460, 1230, 58], [1110, 1290, 50],
  ];
  const sm = (pts) => wobble(r, pts, 3, 20);
  const T = sm(trunk), Bs = branches.map(sm);
  const scales = [];
  for (let i = 1; i < T.length - 1; i++) for (let k = 0; k < 3; k++) scales.push([T[i][0] + r.range(-16, 16), T[i][1] + r.range(-10, 10), r.range(6, 12)]);
  p.group('pine', { x: 820, y: 1150, w: X1 - 820 + 20, h: Y1 - 1150 + 30 }, (c, q) => {
    // the trunk thick at the foot, thinning; drawn upward as by a brush
    const m = Math.max(2, Math.ceil(T.length * q));
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [col, wd] of [[INK, 60], [BARK, 52]]) { c.strokeStyle = col; c.lineWidth = wd; path(c, T.slice(0, m)); c.stroke(); }
    if (q > 0.6) {
      const bq = clamp((q - 0.6) / 0.4);
      for (const B of Bs) { const n = Math.max(2, Math.ceil(B.length * bq)); for (const [col, wd] of [[INK, 22], [BARK, 16]]) { c.strokeStyle = col; c.lineWidth = wd; path(c, B.slice(0, n)); c.stroke(); } }
    }
    if (q >= 1) {
      c.fillStyle = BARK_D; c.strokeStyle = INK; c.lineWidth = 1;
      for (const [x, y, s] of scales) { c.beginPath(); c.ellipse(x, y, s, s * 0.55, 0.3, 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = '#c2805a'; c.lineWidth = 2; c.beginPath(); c.moveTo(T[0][0] - 14, T[0][1]); for (const [x, y] of T) c.lineTo(x - 14, y); c.stroke();
    }
  }, { t: 9.2, d: 1.6, reveal: 'draw', ease: 'inOut' });
  // needle tufts: fans of fine strokes over a dark round
  tufts.forEach(([x, y, s], i) => {
    p.group('needles', { x: x - s * 1.3, y: y - s * 0.9, w: s * 2.6, h: s * 1.2 }, (c) => {
      c.fillStyle = PINE; c.beginPath(); c.ellipse(x, y - s * 0.2, s, s * 0.42, 0, Math.PI, 0); c.closePath(); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath();
      for (let k = 0; k <= 16; k++) { const a = Math.PI + (k / 16) * Math.PI; c.moveTo(x, y - s * 0.06); c.lineTo(x + Math.cos(a) * s * 1.05, y - s * 0.2 + Math.sin(a) * s * 0.5); }
      c.stroke();
      c.strokeStyle = PINE_L; c.lineWidth = 1; c.beginPath();
      for (let k = 0; k <= 12; k++) { const a = Math.PI + ((k + 0.5) / 13) * Math.PI; c.moveTo(x, y - s * 0.1); c.lineTo(x + Math.cos(a) * s * 0.8, y - s * 0.2 + Math.sin(a) * s * 0.36); }
      c.stroke();
    }, { t: 10.2 + i * 0.1, d: 0.6, reveal: 'pop' });
  });
}

// ================================================================ the magpie on the pine branch: black and white, a long blue tail
function bird(c, time) {
  const bob = Math.sin(time * 2.4) * 0.06, tail = Math.sin(time * 1.7) * 0.08;
  // the tail
  c.save(); c.translate(20, 6); c.rotate(0.5 + tail);
  c.fillStyle = '#2a3c5a'; c.beginPath(); c.moveTo(0, -6); c.lineTo(92, -4); c.lineTo(96, 4); c.lineTo(0, 7); c.closePath(); c.fill();
  c.strokeStyle = '#5b7fae'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(10, 0); c.lineTo(90, 0); c.stroke();
  c.restore();
  // the body
  c.fillStyle = '#1e1c22'; c.beginPath(); c.ellipse(0, 0, 32, 19, -0.25, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#f6f1e6'; c.beginPath(); c.ellipse(-4, 8, 20, 11, -0.2, 0, Math.PI * 2); c.fill();
  // the wing, with its white patch and blue sheen
  c.fillStyle = '#2a3c5a'; c.beginPath(); c.ellipse(8, -4, 24, 11, -0.15, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#f6f1e6'; c.beginPath(); c.ellipse(2, -6, 12, 5, -0.2, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#5b7fae'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(14, -2); c.lineTo(30, 2); c.moveTo(14, 2); c.lineTo(28, 6); c.stroke();
  // the head, nodding
  c.save(); c.translate(-26, -14); c.rotate(bob);
  c.fillStyle = '#1e1c22'; c.beginPath(); c.arc(0, 0, 13, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(-10, -2); c.lineTo(-26, 2); c.lineTo(-10, 4); c.closePath(); c.fill();
  c.fillStyle = '#f6f1e6'; c.beginPath(); c.arc(-4, -3, 2.6, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#1e1c22'; c.beginPath(); c.arc(-4, -3, 1.2, 0, Math.PI * 2); c.fill();
  c.restore();
  // the legs gripping the branch
  c.strokeStyle = '#1e1c22'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-6, 16); c.lineTo(-8, 28); c.moveTo(4, 16); c.lineTo(6, 28); c.stroke();
}
function magpie(p) {
  const x = 1000, y = 1306;
  p.live('needles', {
    t: 10.8, d: 0.9, reveal: 'drop', dy: 30, box: { x: x - 110, y: y - 90, w: 280, h: 170 },
    draw: (c, time) => { c.translate(x, y); c.scale(1.45, 1.45); bird(c, time); },
  });
}

// ================================================================ clouds drifting, butterflies, ducks on the river
function cloud(c, x, y, s) {
  // a lingzhi cloud: rounded heads each holding a curl, and a trailing tail
  const heads = [[0, 0, 30], [36, -14, 24], [66, 2, 20], [-30, 8, 18]];
  c.fillStyle = '#fbf6ea'; c.strokeStyle = AZURE; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x - 46 * s, y + 18 * s); c.quadraticCurveTo(x - 110 * s, y + 30 * s, x - 150 * s, y + 18 * s); c.quadraticCurveTo(x - 100 * s, y + 40 * s, x - 40 * s, y + 30 * s); c.closePath(); c.fill(); c.stroke();
  for (const [dx, dy, rr] of heads) { c.beginPath(); c.arc(x + dx * s, y + dy * s, rr * s, 0, Math.PI * 2); c.fill(); c.stroke(); }
  c.fillStyle = '#fbf6ea'; for (const [dx, dy, rr] of heads) { c.beginPath(); c.arc(x + dx * s, y + dy * s, rr * s - 1.5, 0, Math.PI * 2); c.fill(); }
  c.lineWidth = 1.5; c.beginPath();
  for (const [dx, dy, rr] of heads) { const cx = x + dx * s, cy = y + dy * s; c.moveTo(cx + rr * s * 0.55, cy); c.arc(cx, cy, rr * s * 0.55, 0, Math.PI * 1.5); c.arc(cx + rr * s * 0.2, cy, rr * s * 0.3, Math.PI * 1.5, Math.PI * 0.4, true); }
  c.stroke();
}
function life(p, r) {
  const clouds = [[520, 260, 1.1, 0.0], [840, 420, 0.8, 1.7], [1400, 520, 0.9, 3.1], [300, 820, 0.6, 4.4]];
  p.live('clouds', {
    t: 2.0, d: 1.4, reveal: 'fade',
    draw: (c, time) => { for (const [x, y, s, ph] of clouds) cloud(c, x + Math.sin(time * 0.18 + ph) * 26, y + Math.sin(time * 0.3 + ph) * 3, s * 1.3); },
  });
  // two butterflies over the peonies
  const bf = [[560, 1560, '#f0c94a', 0], [700, 1680, '#f4f0e6', 2.4]];
  p.live('needles', {
    t: 11.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const [x0, y0, col, ph] of bf) {
        const a = time * 0.7 + ph, x = x0 + Math.cos(a) * 60 + Math.sin(a * 2.3) * 14, y = y0 + Math.sin(a * 1.3) * 34;
        const f = 0.35 + 0.65 * Math.abs(Math.sin(time * 9 + ph));
        c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1;
        for (const sx of [-1, 1]) {
          c.beginPath(); c.ellipse(x + sx * 9 * f, y - 5, 10 * f, 8, sx * 0.4, 0, Math.PI * 2); c.fill(); c.stroke();
          c.beginPath(); c.ellipse(x + sx * 6 * f, y + 6, 6 * f, 5, -sx * 0.4, 0, Math.PI * 2); c.fill(); c.stroke();
        }
        c.fillStyle = INK; c.fillRect(x - 1.2, y - 9, 2.4, 18);
      }
    },
  });
  // a pair of mandarin ducks on the river
  p.live('river', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const [x0, y0, ph, drake] of [[980, 1588, 0, true], [1040, 1600, 1.2, false]]) {
        const x = x0 + Math.sin(time * 0.25 + ph) * 30, y = y0 + Math.sin(time * 1.4 + ph) * 1.5;
        c.fillStyle = drake ? '#c8763a' : '#9a8a74'; c.strokeStyle = INK; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(x - 24, y); c.quadraticCurveTo(x - 20, y - 16, x, y - 14); c.quadraticCurveTo(x + 18, y - 14, x + 26, y - 4); c.quadraticCurveTo(x + 10, y + 6, x - 24, y); c.fill(); c.stroke();
        c.fillStyle = drake ? '#2f6b5a' : '#7f7262'; c.beginPath(); c.arc(x - 20, y - 20, 9, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = drake ? '#d94a32' : '#c9a05a'; c.beginPath(); c.moveTo(x - 28, y - 21); c.lineTo(x - 37, y - 18); c.lineTo(x - 28, y - 16); c.fill();
        c.fillStyle = '#f6f1e6'; c.beginPath(); c.arc(x - 21, y - 22, 2.2, 0, Math.PI * 2); c.fill();
        c.strokeStyle = WAVE; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 30, y + 4); c.quadraticCurveTo(x, y + 9, x + 30, y + 3); c.stroke();
      }
    },
  });
  // the tower's beacon
  p.live('tower', {
    t: 9.0, d: 0.5, reveal: 'fade',
    draw: (c, time) => { const a = 0.4 + 0.6 * Math.max(0, Math.sin(time * 2.2)); c.fillStyle = `rgba(230,60,40,${a.toFixed(3)})`; c.beginPath(); c.arc(1270, 286, 4.5, 0, Math.PI * 2); c.fill(); },
  });
}

// ================================================================ the title: 서울 set down the left, SEOUL, and a red seal
function title(p) {
  const x = 250;
  const f = '"Gowun Batang", serif';
  p.type('title', '서', x, 360, { family: f, weight: 700, size: 190, color: INK, align: 'center', t: 11.4, d: 0.9 });
  p.type('title', '울', x, 556, { family: f, weight: 700, size: 190, color: INK, align: 'center', t: 11.8, d: 0.9 });
  p.type('title', 'SEOUL', x, 628, { family: f, weight: 400, size: 40, color: INK, align: 'center', track: 0.42, t: 12.4, gap: 0.08, d: 0.5, reveal: 'fade' });
  // the seal: carved, so the letters are paper and the ground is red
  p.group('title', { x: x - 44, y: 654, w: 88, h: 88 }, (c) => {
    c.fillStyle = SEAL; c.beginPath(); c.roundRect(x - 34, 664, 68, 68, 5); c.fill();
    c.strokeStyle = PAPER; c.lineWidth = 2; c.beginPath(); c.roundRect(x - 29, 669, 58, 58, 3); c.stroke();
    c.fillStyle = PAPER; c.font = `700 30px ${f}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText('서', x, 695); c.fillText('울', x, 724);
  }, { t: 12.9, d: 0.5, reveal: 'press' });
}
