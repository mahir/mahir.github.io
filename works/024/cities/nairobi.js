// Nairobi: a 1950s safari poster, flat gouache in gold, umber and a cool mint sky. A
// Masai giraffe stands huge in the national park's golden grass, its neck reaching
// up to browse a flat-topped acacia; beyond the plain, past zebras, a pair of distant
// giraffes and small thorn trees, the city's towers stand on the horizon with the
// Kenyatta center's round tower and its cone, and the Ngong Hills far off to the
// left. The name is set across the grass at the foot in a fat slab letter.

import { Plate, W, H } from '../print.js';
import { shade, lerp, poly } from '../kit.js';

// the inks
const UMBER = '#3b2414', UMBER_L = '#6b4426', CREAM = '#f6e9c6';
const SKY_T = '#8fcac4', SKY_M = '#c4e2d2', SKY_B = '#f3ead0';
const GOLD = '#e2ad44', GOLD_L = '#eec466', GOLD_P = '#f2d892', OCHRE = '#c98a2e', OCHRE_D = '#a46a22', TAWNY = '#8a5420';
const HILL = '#93aebb', HILL_D = '#7a97a8', CITY = '#7d93a6', CITY_D = '#62788c', CITY_L = '#a9bac6';
const OLIVE = '#4a5530', OLIVE_D = '#323b21', OLIVE_L = '#6c7a3f', BARK = '#4a3122';
const COAT = '#f1dcae', PATCH = '#9c4c24', PATCH_D = '#7a3618';

export const city = {
  id: 'nairobi', name: 'Nairobi', wall: '#3b2414',
  alt: "A 1950s safari poster: a Masai giraffe standing tall in golden grass in Nairobi National Park, stretching its neck to browse a flat-topped acacia, with zebras, two distant giraffes and small thorn trees on the plain, the city's towers on the horizon with the round tower and cone of the Kenyatta International Convention Centre, the Ngong Hills far off, kites wheeling in a mint-green sky, and the name NAIROBI across the grass",
  google: 'family=Ultra',
  fonts: [['400 250px "Ultra"', 'NAIROBI'], ['400 30px "Ultra"', 'KENYA · NATIONAL PARK · THE GREEN CITY IN THE SUN']],
  build,
};

const B = 22;              // the umber border
const HZ = 1120;           // the horizon
const GROUND = 1640;       // where the giraffe and the big acacia stand

function build() {
  const p = new Plate({ paper: CREAM, seed: 1958 });
  const r = p.r;
  p.clip = { x: B, y: B, w: W - 2 * B, h: H - 2 * B };
  p.stack('sky', 'far', 'plain', 'herd', 'tree', 'giraffe', 'coat', 'grass', 'air', 'title', 'frame');
  p.layer('frame', { clip: false });

  frame(p);
  sky(p, r);
  hills(p, r);
  skyline(p, r);
  plain(p, r);
  herd(p, r);
  acacia(p, r);
  giraffe(p, r);
  grass(p, r);
  life(p, r);
  title(p);
  return p;
}

// a closed smooth shape through a list of points
function smooth(c, pts) {
  const n = pts.length;
  c.beginPath();
  const m0 = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2];
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  }
  c.closePath();
}

// ================================================================ the frame
function frame(p) {
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = UMBER; c.beginPath(); c.rect(0, 0, W, H); c.rect(B, B, W - 2 * B, H - 2 * B); c.fill('evenodd');
  }, { t: 0, d: 0.4, reveal: 'fade' });
  p.pen('frame', [[B + 10, B + 10], [W - B - 10, B + 10], [W - B - 10, H - B - 10], [B + 10, H - B - 10], [B + 10, B + 10]], CREAM, 2, { t: 0.2, d: 1.8, cap: 'square' });
}

// ================================================================ the sky
function sky(p, r) {
  p.group('sky', { x: B, y: B, w: W - 2 * B, h: HZ - B + 4 }, (c) => {
    const g = c.createLinearGradient(0, B, 0, HZ);
    g.addColorStop(0, SKY_T); g.addColorStop(0.55, SKY_M); g.addColorStop(1, SKY_B);
    c.fillStyle = g; c.fillRect(B, B, W - 2 * B, HZ - B + 4);
  }, { t: 0.2, d: 1.3, reveal: 'fall', ease: 'inOut' });
  // a printer's dot screen in the upper sky, the dots shrinking toward the horizon
  p.group('sky', { x: B, y: B, w: W - 2 * B, h: 560 }, (c) => {
    c.fillStyle = 'rgba(70,140,140,.22)'; c.beginPath();
    for (let y = B + 8, row = 0; y < 560; y += 14, row++) {
      const rad = 3.6 * (1 - (y - B) / 540);
      if (rad < 0.4) break;
      for (let x = B + 6 + (row % 2) * 7; x < W - B; x += 14) { c.moveTo(x + rad, y); c.arc(x, y, rad, 0, Math.PI * 2); }
    }
    c.fill();
  }, { t: 1.2, d: 1.0, reveal: 'fall' });
  // flat-bottomed fair-weather clouds, cream with mint undersides
  const clouds = [[930, 300, 300, 70], [1240, 520, 220, 50], [560, 650, 260, 52], [1100, 760, 180, 36], [160, 820, 200, 40], [1380, 180, 180, 44]];
  clouds.forEach(([x, y, w, h], i) => {
    const bumps = [];
    const n = Math.round(w / (h * 0.8));
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; bumps.push([x + t * w, y - h * 0.3 - Math.sin(t * Math.PI) * h * 0.45 * r.range(0.8, 1.15), (w / n) * r.range(0.6, 0.8)]); }
    p.group('sky', { x: x - 30, y: y - h * 1.6, w: w + 60, h: h * 1.6 + 10 }, (c) => {
      c.save(); c.beginPath(); c.rect(x - 40, y - h * 2, w + 80, h * 2); c.clip();
      c.fillStyle = '#9cc8c0'; c.beginPath(); for (const [bx, by, br] of bumps) { c.moveTo(bx + br, by + 6); c.arc(bx, by + 6, br, 0, Math.PI * 2); } c.fill();
      c.fillStyle = '#fbf6e6'; c.beginPath(); for (const [bx, by, br] of bumps) { c.moveTo(bx + br - 3, by - 2); c.arc(bx - 3, by - 2, br, 0, Math.PI * 2); } c.fill();
      c.restore();
      c.fillStyle = '#b4d8cf'; c.fillRect(x + w * 0.08, y - 7, w * 0.84, 7);
    }, { t: 1.5 + i * 0.14, d: 0.9, reveal: 'rise' });
  });
}

// ================================================================ the Ngong Hills
function hills(p, r) {
  // four knuckles along a ridge, far off on the left
  const pts = [[B - 10, HZ + 2]];
  for (let x = B - 10; x <= 760; x += 8) {
    let y = HZ - 26 - 30 * Math.exp(-(((x - 60) / 180) ** 2));
    for (const [cx, h, w] of [[200, 70, 40], [270, 84, 38], [340, 76, 36], [410, 62, 34]]) y = Math.min(y, HZ - h * Math.exp(-(((x - cx) / w) ** 2)) - 22);
    y += Math.max(0, x - 520) * 0.11;
    pts.push([x, y]);
  }
  pts.push([760, HZ + 2]);
  p.fill('far', pts, HILL, { t: 1.8, d: 1.0, reveal: 'rise' });
  // their shadowed sides
  const sh = [];
  for (const [cx, h] of [[200, 70], [270, 84], [340, 76], [410, 62]]) sh.push([[cx + 6, HZ - h - 20], [cx + 30, HZ - 30], [cx + 40, HZ - 22], [cx + 10, HZ - 22]]);
  p.group('far', { x: 150, y: HZ - 120, w: 320, h: 120 }, (c) => { c.fillStyle = HILL_D; for (const q of sh) { poly(c, q); c.fill(); } }, { t: 2.4, d: 0.6, reveal: 'fade' });
}

// ================================================================ the skyline
function tower(c, x, w, h, o = {}) {
  const y = HZ;
  c.fillStyle = o.col || CITY; c.fillRect(x, y - h, w, h);
  c.fillStyle = CITY_D; c.fillRect(x, y - h, Math.max(2, w * 0.25), h);
  // window bands
  c.fillStyle = CITY_L; for (let yy = y - h + 6; yy < y - 4; yy += 7) c.fillRect(x + w * 0.32, yy, w * 0.6, 2);
}
function skyline(p, r) {
  // the far city: rows of towers along the horizon, between the acacia and the giraffe
  const blocks = [];
  for (let x = 470; x < 960;) { const w = r.range(14, 30); blocks.push([x, w, r.range(16, 60)]); x += w + r.range(0, 4); }
  for (let x = 1400; x < W - B;) { const w = r.range(14, 28); blocks.push([x, w, r.range(16, 54)]); x += w + r.range(0, 4); }
  p.group('far', { x: 460, y: HZ - 70, w: W - 460, h: 72 }, (c) => { for (const [x, w, h] of blocks) tower(c, x, w, h); }, { t: 2.2, d: 0.8, reveal: 'rise' });
  // the taller towers, one after another
  const tall = [[520, 26, 120], [600, 34, 176], [650, 24, 132], [840, 30, 150], [890, 22, 196], [930, 28, 110], [1440, 30, 160], [1500, 22, 120]];
  tall.forEach(([x, w, h], i) => {
    p.group('far', { x: x - 4, y: HZ - h - 30, w: w + 8, h: h + 32 }, (c) => {
      tower(c, x, w, h);
      if (i === 4) { // a slim prism with a slanted crown
        c.fillStyle = CITY; poly(c, [[x, HZ - h], [x + w, HZ - h - 22], [x + w, HZ - h]]); c.fill();
      }
      if (i === 1) { c.fillStyle = CITY_D; c.fillRect(x + w / 2 - 1, HZ - h - 26, 2, 26); }
    }, { t: 2.5 + i * 0.12, d: 0.7, reveal: 'rise' });
  });
  // the Kenyatta International Convention Centre: a fluted round tower with a flared,
  // cone-roofed top, and the amphitheater's great cone beside it
  const kx = 744, kw = 40, kh = 210;
  p.group('far', { x: kx - 90, y: HZ - kh - 70, w: 170, h: kh + 72 }, (c) => {
    // the amphitheater: a cone with a cut tip, in terracotta
    c.fillStyle = '#b0705a'; poly(c, [[kx - 84, HZ - 4], [kx - 16, HZ - 4], [kx - 44, HZ - 62], [kx - 56, HZ - 62]]); c.fill();
    c.fillStyle = '#93594a'; poly(c, [[kx - 84, HZ - 4], [kx - 50, HZ - 4], [kx - 50, HZ - 62], [kx - 56, HZ - 62]]); c.fill();
    c.fillStyle = '#b0705a'; c.fillRect(kx - 53, HZ - 72, 6, 10);
    // the podium
    c.fillStyle = CITY_D; c.fillRect(kx - 30, HZ - 22, 90, 22);
    // the shaft, ribbed with the bays of its cuboids
    c.fillStyle = '#c9b49a'; c.fillRect(kx, HZ - kh, kw, kh);
    c.fillStyle = '#a8927a'; c.fillRect(kx, HZ - kh, 9, kh);
    c.fillStyle = '#8f7b66'; for (let k = 1; k < 5; k++) c.fillRect(kx + k * 8, HZ - kh, 1.6, kh);
    c.fillStyle = 'rgba(70,60,50,.4)'; for (let yy = HZ - kh + 10; yy < HZ - 24; yy += 7) c.fillRect(kx + 2, yy, kw - 4, 1.6);
    // the flared top under its cone
    c.fillStyle = '#c9b49a'; poly(c, [[kx - 2, HZ - kh], [kx + kw + 2, HZ - kh], [kx + kw + 12, HZ - kh - 14], [kx - 12, HZ - kh - 14]]); c.fill();
    c.fillStyle = '#b0705a'; poly(c, [[kx - 14, HZ - kh - 14], [kx + kw + 14, HZ - kh - 14], [kx + kw / 2, HZ - kh - 40]]); c.fill();
    c.fillStyle = '#93594a'; poly(c, [[kx - 14, HZ - kh - 14], [kx + kw / 2, HZ - kh - 14], [kx + kw / 2, HZ - kh - 40]]); c.fill();
    c.strokeStyle = CITY_D; c.lineWidth = 1.5; c.beginPath(); c.moveTo(kx + kw / 2, HZ - kh - 40); c.lineTo(kx + kw / 2, HZ - kh - 58); c.stroke();
  }, { t: 3.6, d: 0.9, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the plain
function plain(p, r) {
  // bands of grass going gold toward us
  const bands = [[HZ, 1230, GOLD_P], [1210, 1360, GOLD_L], [1340, 1520, GOLD], [1500, H, OCHRE]];
  bands.forEach(([y0, y1, col], i) => {
    const edge = [];
    for (let x = B - 10; x <= W - B + 10; x += 20) edge.push([x, y0 + (i ? Math.sin(x * 0.006 + i) * 12 + Math.sin(x * 0.021 + i * 2) * 5 : 0)]);
    p.fill('plain', [...edge, [W - B + 10, y1 + 40], [B - 10, y1 + 40]], col, { t: 2.6 + i * 0.25, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  });
  // tufts of grass on the plain as short dashes, smaller far off
  for (let k = 0; k < 3; k++) {
    const dash = [];
    for (let i = 0; i < 330; i++) {
      const f = r() ** 1.3, y = HZ + 10 + f * 520, s = 0.3 + f * 1.2, x = r.range(B, W - B);
      dash.push([[x, y], [x + r.range(-2, 2) * s, y - 8 * s]]);
    }
    p.strokes('plain', dash, k === 1 ? OCHRE_D : k === 2 ? TAWNY : OCHRE, 1.6, { t: 3.6 + k * 0.2, d: 0.7, reveal: 'wipe' });
  }
  // small flat-topped thorn trees and whistling-thorn bushes along the plain
  const trees = [[90, HZ + 14, 0.5], [520, HZ + 6, 0.35], [1460, HZ + 20, 0.55], [1250, HZ + 40, 0.7], [180, 1240, 0.9], [1540, 1300, 1.0], [640, 1210, 0.6]];
  trees.forEach(([x, y, s], i) => {
    p.group('plain', { x: x - 80 * s, y: y - 110 * s, w: 160 * s, h: 116 * s }, (c) => smallAcacia(c, x, y, s), { t: 4.0 + i * 0.12, d: 0.6, reveal: 'rise' });
  });
  const bushes = [];
  for (let i = 0; i < 40; i++) bushes.push([r.range(B, W - B), HZ + 10 + r() ** 1.4 * 380, r.range(5, 14)]);
  p.group('plain', { x: B, y: HZ - 10, w: W - 2 * B, h: 420 }, (c) => {
    c.fillStyle = OLIVE; c.beginPath(); for (const [x, y, s] of bushes) { c.moveTo(x + s * 1.4, y); c.ellipse(x, y - s * 0.4, s * 1.4, s * 0.6, 0, 0, Math.PI * 2); } c.fill();
    c.fillStyle = OLIVE_L; c.beginPath(); for (const [x, y, s] of bushes) { c.moveTo(x + s * 0.8, y - s * 0.6); c.ellipse(x - s * 0.3, y - s * 0.6, s * 0.8, s * 0.3, 0, 0, Math.PI * 2); } c.fill();
  }, { t: 4.6, d: 0.6, reveal: 'fade' });
}
function smallAcacia(c, x, y, s) {
  c.strokeStyle = BARK; c.lineCap = 'round'; c.lineWidth = 5 * s;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4 * s, y - 50 * s); c.moveTo(x - 2 * s, y - 40 * s); c.lineTo(x - 36 * s, y - 78 * s); c.moveTo(x - 3 * s, y - 46 * s); c.lineTo(x + 30 * s, y - 80 * s); c.stroke();
  c.fillStyle = OLIVE_D; c.beginPath(); c.ellipse(x - 4 * s, y - 84 * s, 74 * s, 14 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = OLIVE; c.beginPath(); c.ellipse(x - 8 * s, y - 90 * s, 62 * s, 10 * s, 0, 0, Math.PI * 2); c.fill();
}

// ================================================================ the herd
function zebra(c, x, y, s, dir, stripes) {
  // a small zebra in profile, facing dir (1 right, -1 left); y is its hooves
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.fillStyle = '#f7f1e2';
  c.beginPath(); c.ellipse(0, -46, 30, 15, 0, 0, Math.PI * 2); c.fill();
  // neck and head
  poly(c, [[18, -56], [30, -82], [40, -84], [50, -64], [44, -60], [34, -70], [26, -46]]); c.fill();
  // legs
  c.fillRect(-24, -40, 6, 40); c.fillRect(-16, -40, 6, 38); c.fillRect(14, -40, 6, 40); c.fillRect(22, -40, 6, 38);
  // black stripes and mane, hooves, muzzle
  c.strokeStyle = '#1d1712'; c.lineWidth = 3; c.lineCap = 'butt'; c.beginPath();
  for (const [a, b] of stripes) { c.moveTo(a, -60); c.quadraticCurveTo(a + 4, -46, b, -32); }
  for (let k = 0; k < 4; k++) { c.moveTo(24 + k * 5, -50 - k * 6); c.lineTo(32 + k * 4, -60 - k * 6); }
  for (const lx of [-21, -13, 17, 25]) for (let yy = -30; yy < -6; yy += 7) { c.moveTo(lx - 3, yy); c.lineTo(lx + 3, yy); }
  c.stroke();
  c.fillStyle = '#1d1712'; c.fillRect(28, -88, 10, 6); c.fillRect(44, -66, 7, 6);
  for (const lx of [-24, -16, 14, 22]) c.fillRect(lx, -4, 6, 4);
  c.beginPath(); c.moveTo(-30, -50); c.quadraticCurveTo(-40, -40, -36, -26); c.lineWidth = 2; c.strokeStyle = '#1d1712'; c.stroke();
  c.restore();
}
function herd(p, r) {
  const zs = [[470, 1400, 0.8, 1], [560, 1388, 0.72, 1], [640, 1410, 0.86, -1], [720, 1392, 0.7, 1], [820, 1420, 0.9, -1], [900, 1396, 0.74, 1], [1460, 1430, 0.95, -1], [1540, 1410, 0.8, -1], [380, 1380, 0.6, 1]];
  zs.sort((a, b) => a[1] - b[1]);
  zs.forEach(([x, y, s, dir], i) => {
    const st = []; for (let k = 0; k < 8; k++) st.push([-24 + k * 6, -26 + k * 6 + r.range(-2, 2)]);
    p.group('herd', { x: x - 70 * s, y: y - 100 * s, w: 140 * s, h: 106 * s }, (c) => zebra(c, x, y, s, dir, st), { t: 4.6 + i * 0.16, d: 0.6, reveal: 'drop' });
  });
  // two distant giraffes on the plain
  [[560, 1196, 0.22, -1], [610, 1204, 0.18, -1]].forEach(([x, y, s, dir], i) => {
    p.group('herd', { x: x - 120 * s * 4, y: y - 700 * s, w: 240 * s * 4, h: 710 * s }, (c) => farGiraffe(c, x, y, s, dir), { t: 4.2 + i * 0.2, d: 0.7, reveal: 'rise' });
  });
}
function farGiraffe(c, x, y, s, dir) {
  // a small giraffe in silhouette, its neck up; y is its hooves
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.fillStyle = TAWNY;
  smooth(c, [[-90, -300], [-60, -350], [40, -380], [90, -372], [104, -330], [80, -290], [-60, -280]]); c.fill();
  smooth(c, [[50, -370], [120, -520], [170, -650], [196, -664], [236, -650], [230, -630], [196, -618], [150, -500], [100, -330]]); c.fill();
  for (const [lx, w] of [[-74, 22], [-44, 20], [44, 22], [74, 20]]) { poly(c, [[lx - w / 2, -300], [lx + w / 2, -300], [lx + w / 4, 0], [lx - w / 4, 0]]); c.fill(); }
  c.lineWidth = 10; c.strokeStyle = TAWNY; c.beginPath(); c.moveTo(190, -660); c.lineTo(186, -700); c.stroke();
  c.restore();
}

// ================================================================ the big acacia
function acacia(p, r) {
  // the trunk and its limbs, drawn up from the ground, then the flat tiers of the crown
  const trunk = [[352, GROUND + 6], [360, 1450], [348, 1250], [370, 1050], [356, 880], [380, 760]];
  p.pen('tree', trunk, BARK, 46, { t: 5.0, d: 1.2 });
  const limbs = [
    [[380, 770], [320, 640], [210, 520], [120, 440]],
    [[380, 770], [420, 640], [520, 520], [640, 440]],
    [[370, 820], [300, 700], [280, 560], [300, 470]],
    [[384, 760], [470, 600], [740, 470], [820, 430]],
    [[376, 780], [400, 620], [420, 470]],
  ];
  limbs.forEach((l, i) => p.pen('tree', l, BARK, 22 - i * 2, { t: 5.6 + i * 0.12, d: 0.9 }));
  // twigs fanning up into the crown
  const twigs = [];
  for (let i = 0; i < 60; i++) { const x = r.range(60, 860), y = r.range(430, 520); twigs.push([[x, y], [x + r.range(-30, 30), y - r.range(30, 70)]]); }
  p.strokes('tree', twigs, BARK, 2.4, { t: 6.2, d: 0.7, reveal: 'rise' });
  // the crown: overlapping flat tiers, dark beneath, olive above, with leaf texture
  const tiers = [[460, 300, 500, 46], [150, 400, 160, 34], [620, 410, 230, 36], [300, 340, 240, 40], [500, 370, 300, 38], [740, 380, 110, 26]];
  tiers.forEach(([cx, cy, rx, ry], i) => {
    const bumps = [];
    for (let a = 0; a < Math.PI * 2; a += 0.22) bumps.push([cx + Math.cos(a) * rx * r.range(0.95, 1.04), cy + Math.sin(a) * ry * r.range(0.85, 1.12)]);
    const dots = [];
    for (let k = 0; k < rx * 0.7; k++) { const a = r() * Math.PI * 2, f = Math.sqrt(r()); dots.push([cx + Math.cos(a) * rx * f * 0.95, cy - ry * 0.2 + Math.sin(a) * ry * f * 0.6, r.range(3, 7)]); }
    p.group('tree', { x: cx - rx - 10, y: cy - ry - 30, w: 2 * rx + 20, h: 2 * ry + 50 }, (c) => {
      c.fillStyle = OLIVE_D; smooth(c, bumps.map(([x, y]) => [x, y + 10])); c.fill();
      c.fillStyle = OLIVE; smooth(c, bumps.map(([x, y]) => [x, y - (y < cy ? 6 : -2)])); c.fill();
      c.fillStyle = OLIVE_L; c.beginPath(); for (const [x, y, s] of dots) { c.moveTo(x + s * 1.5, y); c.ellipse(x, y, s * 1.5, s * 0.6, 0, 0, Math.PI * 2); } c.fill();
      c.fillStyle = 'rgba(30,36,20,.35)'; c.fillRect(cx - rx * 0.85, cy + ry * 0.55, rx * 1.7, 4);
    }, { t: 6.4 + i * 0.16, d: 0.8, reveal: 'pop' });
  });
  // its shadow on the grass
  p.group('tree', { x: 100, y: GROUND - 30, w: 600, h: 70 }, (c) => {
    c.fillStyle = 'rgba(122,74,22,.45)'; c.beginPath(); c.ellipse(380, GROUND + 8, 260, 22, 0, 0, Math.PI * 2); c.fill();
  }, { t: 7.4, d: 0.6, reveal: 'fade' });
}

// ================================================================ the giraffe
// the parts of a Masai giraffe facing left, browsing at the crown's edge
const NECK = [[1100, 1000], [1046, 896], [994, 786], [934, 676], [872, 556], [846, 498], [806, 522], [790, 584], [826, 712], [870, 840], [904, 970], [944, 1160]];
const BODY = [[946, 1150], [972, 1040], [1040, 984], [1100, 980], [1210, 1016], [1320, 1060], [1384, 1078], [1422, 1124], [1426, 1190], [1404, 1248], [1314, 1262], [1180, 1258], [1050, 1252], [972, 1230]];
const HEAD = [[840, 478], [818, 458], [786, 452], [752, 470], [716, 494], [690, 512], [680, 532], [694, 548], [730, 550], [776, 546], [812, 540], [842, 516]];
function legPts(x0, x1, top, wTop, knee = 0.55) {
  // a leg from its top (x0) to its hoof (x1): wide thigh, knobby knee, slim cannon
  const yk = lerp(top, GROUND, knee), xk = lerp(x0, x1, knee);
  return [[x0 - wTop / 2, top], [x0 + wTop / 2, top], [xk + 15, yk - 26], [xk + 19, yk], [xk + 13, yk + 30], [x1 + 11, GROUND - 30], [x1 + 15, GROUND - 8], [x1 + 16, GROUND], [x1 - 16, GROUND], [x1 - 15, GROUND - 8], [x1 - 11, GROUND - 30], [xk - 13, yk + 30], [xk - 19, yk], [xk - 15, yk - 26]];
}
const LEGS = {
  farFront: legPts(1070, 1086, 1190, 74),
  farBack: legPts(1326, 1344, 1190, 86, 0.6),
  nearFront: legPts(1012, 984, 1180, 84),
  nearBack: legPts(1374, 1392, 1180, 96, 0.6),
};
// every part wound the same way, so one clip path holds their union
function clockwise(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; a += x0 * y1 - x1 * y0; }
  return a > 0 ? pts : pts.slice().reverse();
}
for (const part of [NECK, BODY, HEAD]) { const cw = clockwise(part); part.splice(0, part.length, ...cw); }
for (const k in LEGS) LEGS[k] = clockwise(LEGS[k]);
function giraffe(p, r) {
  // the ground shadow
  p.group('giraffe', { x: 900, y: GROUND - 30, w: 600, h: 60 }, (c) => {
    c.fillStyle = 'rgba(122,74,22,.5)'; c.beginPath(); c.ellipse(1180, GROUND + 6, 270, 18, 0, 0, Math.PI * 2); c.fill();
  }, { t: 6.4, d: 0.6, reveal: 'fade' });
  // the far legs, in shade
  for (const [k, t] of [['farFront', 6.6], ['farBack', 6.75]]) {
    p.group('giraffe', { x: 980, y: 1170, w: 440, h: GROUND - 1160 }, (c) => {
      c.fillStyle = shade(COAT, 0.8); poly(c, LEGS[k]); c.fill();
    }, { t, d: 0.8, reveal: 'rise' });
  }
  // the body, the neck rising up to the head, and the near legs
  p.group('giraffe', { x: 960, y: 970, w: 470, h: 300 }, (c) => { c.fillStyle = COAT; smooth(c, BODY); c.fill(); }, { t: 6.9, d: 0.8, reveal: 'fade' });
  for (const [k, t] of [['nearFront', 7.0], ['nearBack', 7.1]]) {
    p.group('giraffe', { x: 950, y: 1170, w: 480, h: GROUND - 1160 }, (c) => { c.fillStyle = COAT; poly(c, LEGS[k]); c.fill(); }, { t, d: 0.8, reveal: 'rise' });
  }
  p.group('giraffe', { x: 780, y: 480, w: 330, h: 690 }, (c) => { c.fillStyle = COAT; smooth(c, NECK); c.fill(); }, { t: 7.2, d: 1.0, reveal: 'rise', ease: 'inOut' });
  p.group('giraffe', { x: 670, y: 440, w: 190, h: 130 }, (c) => { c.fillStyle = COAT; smooth(c, HEAD); c.fill(); }, { t: 7.8, d: 0.6, reveal: 'pop' });

  // the coat: jagged leafy patches, in bands from the head down
  const patches = [];
  const add = (x, y, rad) => {
    // a jagged, leafy blotch: a lumpy outline with a few deep notches
    const n = 18, pts = [], sx = r.range(0.85, 1.2), sy = r.range(0.8, 1.15), rot = r() * Math.PI;
    const l1 = r() * 6, l2 = r() * 6;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      let rr = rad * (1 + 0.16 * Math.sin(a * 3 + l1) + 0.1 * Math.sin(a * 5 + l2)) * r.range(0.9, 1.06);
      if (r() < 0.2) rr *= 0.62;
      const px = Math.cos(a) * rr * sx, py = Math.sin(a) * rr * sy;
      pts.push([x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)]);
    }
    patches.push(pts);
  };
  for (let y = 440; y < GROUND;) {
    const legs = y > 1250, headZone = y < 580;
    const sp = legs ? 24 : headZone ? 20 : 42, rad = legs ? 10 : headZone ? 7.5 : 20.5;
    for (let x = 660 + r.range(0, sp); x < 1430; x += sp) add(x + r.range(-sp * 0.18, sp * 0.18), y + r.range(-sp * 0.18, sp * 0.18), rad * r.range(0.9, 1.1));
    y += sp * 0.88;
  }
  const NB = 8;
  for (let i = 0; i < NB; i++) {
    const y0 = 440 + (i / NB) * (GROUND - 440), y1 = 440 + ((i + 1) / NB) * (GROUND - 440);
    const mine = patches.filter((pts) => pts[0][1] >= y0 && pts[0][1] < y1);
    const P = new Path2D(); for (const pts of mine) { P.moveTo(pts[0][0], pts[0][1]); for (const q of pts) P.lineTo(q[0], q[1]); P.closePath(); }
    p.group('coat', { x: 660, y: y0 - 30, w: 780, h: y1 - y0 + 60 }, (c) => {
      c.save();
      c.beginPath(); smoothInto(c, NECK); smoothInto(c, BODY); smoothInto(c, HEAD); for (const k in LEGS) polyInto(c, LEGS[k]); c.clip();
      c.fillStyle = PATCH; c.fill(P);
      c.restore();
    }, { t: 7.6 + i * 0.16, d: 0.6, reveal: 'fade' });
  }
  // shading down the belly, the back of the neck and the far side, then the details
  p.group('coat', { x: 660, y: 430, w: 780, h: GROUND - 420 }, (c) => {
    c.save(); c.beginPath(); smoothInto(c, NECK); smoothInto(c, BODY); for (const k in LEGS) polyInto(c, LEGS[k]); c.clip();
    c.fillStyle = 'rgba(90,40,14,.28)';
    c.beginPath(); c.ellipse(1190, 1260, 260, 50, 0.04, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(1094, 986); c.lineTo(1000, 800); c.lineTo(870, 560); c.lineTo(880, 556); c.lineTo(1060, 900); c.lineTo(1120, 1000); c.fill();
    c.fillRect(1380, 1100, 40, 160);
    c.restore();
    // the short mane along the back of the neck
    c.strokeStyle = PATCH_D; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(846, 512); c.lineTo(924, 670); c.lineTo(986, 790); c.lineTo(1046, 910); c.stroke();
    // hooves
    c.fillStyle = UMBER; for (const k in LEGS) { poly(c, LEGS[k].filter((q) => q[1] >= GROUND - 8)); c.fill(); }
  }, { t: 8.9, d: 0.6, reveal: 'fade' });
  // the head: ossicones with dark tufts, an ear, the eye, the nostril
  p.group('coat', { x: 670, y: 400, w: 220, h: 170 }, (c) => {
    c.strokeStyle = COAT; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(800, 460); c.lineTo(804, 420); c.moveTo(818, 464); c.lineTo(830, 426); c.stroke();
    c.fillStyle = UMBER; for (const [x, y] of [[804, 418], [831, 424]]) { c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill(); }
    // the ear, held out sideways
    c.fillStyle = COAT; c.beginPath(); c.moveTo(830, 474); c.quadraticCurveTo(866, 452, 884, 466); c.quadraticCurveTo(864, 486, 834, 486); c.fill();
    c.fillStyle = 'rgba(122,54,24,.5)'; c.beginPath(); c.moveTo(838, 478); c.quadraticCurveTo(862, 464, 876, 468); c.quadraticCurveTo(860, 480, 840, 482); c.fill();
    // eye with lashes, nostril, mouth
    c.fillStyle = UMBER; c.beginPath(); c.ellipse(772, 484, 7, 5, -0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(770, 482, 1.8, 0, Math.PI * 2); c.fill();
    c.strokeStyle = UMBER; c.lineWidth = 2; c.beginPath(); c.moveTo(764, 478); c.lineTo(758, 472); c.moveTo(770, 477); c.lineTo(767, 470); c.stroke();
    c.beginPath(); c.ellipse(698, 520, 5, 3, -0.6, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(684, 538); c.quadraticCurveTo(700, 546, 720, 542); c.stroke();
    // the tongue curling round a sprig of the acacia
    c.strokeStyle = '#4a3040'; c.lineWidth = 5; c.beginPath(); c.moveTo(686, 532); c.quadraticCurveTo(664, 520, 670, 498); c.stroke();
  }, { t: 9.1, d: 0.6, reveal: 'pop' });
}
function smoothInto(c, pts) {
  const n = pts.length;
  c.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  c.closePath();
}
function polyInto(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (const q of pts) c.lineTo(q[0], q[1]); c.closePath(); }

// ================================================================ the near grass
function grass(p, r) {
  // tall blades in front of the hooves and the trunk, in four inks, rising in sweeps
  const cols = [OCHRE_D, GOLD_L, TAWNY, GOLD_P];
  cols.forEach((col, k) => {
    const blades = [];
    for (let i = 0; i < 360; i++) {
      const x = r.range(B, W - B), y = r.range(1560, H - B), h = r.range(30, 90) * (0.6 + (y - 1560) / 500), lean = r.range(-0.4, 0.4);
      blades.push([[x, y], [x + lean * h * 0.4, y - h * 0.55], [x + lean * h, y - h]]);
    }
    p.strokes('grass', blades, col, k === 3 ? 1.6 : 2.4, { t: 8.6 + k * 0.25, d: 0.9, reveal: 'rise' });
  });
  // seed heads catching the light
  const seeds = [];
  for (let i = 0; i < 140; i++) { const x = r.range(B, W - B), y = r.range(1520, 1700); seeds.push([[x, y], [x + 2, y - 14]]); }
  p.strokes('grass', seeds, CREAM, 4, { t: 9.6, d: 0.6, reveal: 'fade' });
  // the dark foot of the sheet under the name
  p.group('grass', { x: B, y: 1680, w: W - 2 * B, h: H - 1680 }, (c) => {
    const g = c.createLinearGradient(0, 1680, 0, H);
    g.addColorStop(0, 'rgba(122,74,22,0)'); g.addColorStop(0.5, 'rgba(106,62,22,.55)'); g.addColorStop(1, 'rgba(70,40,18,.8)');
    c.fillStyle = g; c.fillRect(B, 1680, W - 2 * B, H - 1680);
  }, { t: 9.8, d: 0.6, reveal: 'fade' });
}

// ================================================================ what moves
function life(p, r) {
  // kites wheeling high over the plain
  const kites = [];
  for (let i = 0; i < 5; i++) kites.push([r.range(950, 1450), r.range(160, 520), r.range(40, 110), r.range(0.25, 0.5) * (r.chance(0.5) ? 1 : -1), r() * 7, r.range(0.8, 1.3)]);
  p.live('air', {
    t: 9.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = UMBER_L;
      for (const [x0, y0, rad, w, ph, s] of kites) {
        const a = time * w + ph, x = x0 + Math.cos(a) * rad, y = y0 + Math.sin(a) * rad * 0.4, f = Math.sin(time * 3 + ph) * 3;
        c.beginPath(); c.moveTo(x - 22 * s, y - f * s); c.quadraticCurveTo(x - 8 * s, y - 6 * s, x, y); c.quadraticCurveTo(x + 8 * s, y - 6 * s, x + 22 * s, y - f * s); c.quadraticCurveTo(x + 6 * s, y + 2 * s, x, y + 6 * s); c.quadraticCurveTo(x - 6 * s, y + 2 * s, x - 22 * s, y - f * s); c.fill();
      }
    },
  });
  // a propeller airliner crossing high toward the city, now and then
  p.live('air', {
    t: 9.8, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      const k = (time - 9.8) * 26, x = W + 80 - (k % 2600), y = 96 + x * 0.03;
      if (x < -80 || x > W + 80) return;
      c.fillStyle = '#f4f1e8';
      c.beginPath(); c.ellipse(x, y, 34, 5, 0, 0, Math.PI * 2); c.fill();
      poly(c, [[x - 4, y], [x + 14, y], [x + 22, y + 18], [x + 14, y + 18]]); c.fill();
      poly(c, [[x - 4, y], [x + 14, y], [x + 8, y - 12], [x + 2, y - 12]]); c.fill();
      poly(c, [[x + 24, y - 2], [x + 34, y - 2], [x + 38, y - 14], [x + 32, y - 14]]); c.fill();
      c.fillStyle = '#c23b2e'; c.fillRect(x - 28, y - 1, 52, 2);
    },
  });
  // the giraffe's tail swishing, and grass heads nodding in the breeze
  const heads = [];
  for (let i = 0; i < 40; i++) heads.push([r.range(B + 20, W - B - 20), r.range(1600, 1700), r.range(40, 80), r() * 7]);
  p.live('air', {
    t: 9.3, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      const sw = Math.sin(time * 1.4) * 0.35 + Math.sin(time * 3.3) * 0.1;
      const tx = 1404, ty = 1110, L = 260;
      const ex = tx + 10 + Math.sin(sw) * L * 0.6, ey = ty + Math.cos(sw) * L;
      c.strokeStyle = COAT; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + 16, ty + L * 0.5, ex, ey); c.stroke();
      c.fillStyle = UMBER; c.beginPath(); c.ellipse(ex, ey + 18, 8, 24, -sw * 0.8, 0, Math.PI * 2); c.fill();
      c.strokeStyle = GOLD_P; c.lineWidth = 2.4;
      c.beginPath();
      for (const [x, y, h, ph] of heads) { const b = Math.sin(time * 1.6 + ph + x * 0.004) * 10; c.moveTo(x, y); c.quadraticCurveTo(x + b * 0.3, y - h * 0.6, x + b, y - h); }
      c.stroke();
    },
  });
}

// ================================================================ the title
function title(p) {
  p.type('title', 'NAIROBI', W / 2, 1866, {
    family: '"Ultra", serif', size: 250, color: CREAM, shadow: UMBER, sx: 10, sy: 10, align: 'center', track: 0.02, fit: W - 2 * B - 120, t: 10.4, gap: 0.16, d: 0.8, reveal: 'press',
  });
  p.type('title', 'KENYA · NATIONAL PARK · THE GREEN CITY IN THE SUN', W / 2, 1938, {
    family: '"Ultra", serif', size: 28, color: GOLD_P, align: 'center', track: 0.2, t: 12.0, gap: 0.02, d: 0.4, reveal: 'fade',
  });
}

