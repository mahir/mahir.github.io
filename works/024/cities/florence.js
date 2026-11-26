// Florence: a panel painting in tempera and gold, set in a gilded tabernacle frame.
// The city seen from the hill of San Miniato: Brunelleschi's dome and Giotto's
// banded campanile over a sea of terracotta roofs, the tower of the Palazzo
// Vecchio and the Bargello, Santa Croce's white front, the Arno with the Ponte
// Vecchio's hanging shops, the hills of Fiesole beyond, and cypresses and olives
// on the slope in front. The frame is built as a painter's shop would build it:
// white gesso, red bole, then gold leaf, punched and tooled, with the Florentine
// lily in the spandrels; the title is set in gold on the lapis predella below.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, lerp, clamp, poly, rng } from '../kit.js';

// the shop's colors: gesso, bole and gold; lapis, vermilion, terra verde and the earths
const GESSO = '#efe6d2', BOLE = '#9a3b26', BOLE_D = '#6e2618';
const GOLD = '#c99a3c', GOLD_L = '#f0d27c', GOLD_D = '#8a6420', GOLD_K = '#5d4214';
const LAPIS = '#23408a', LAPIS_D = '#152a5f', LAPIS_L = '#3d62b0';
const VERM = '#c23b22', VERM_D = '#8f2414';
const SKY_T = '#2c4f97', SKY_M = '#7fa3cf', SKY_H = '#e9e0c6';
const HILL_F = '#9fb3b4', HILL_M = '#7e9a86', HILL_N = '#5f7f58', HILL_D = '#46653f';
const TERRA = '#b85a35', TERRA_L = '#d47a4f', TERRA_D = '#8a3f22';
const PLASTER = ['#e8d6b2', '#dcc093', '#e9c79c', '#d8b48a', '#efe0c0', '#d9a879', '#e4cfa4'];
const MARBLE = '#f1ead9', MARBLE_S = '#d8ccb3', GREENM = '#3f6b52', PINKM = '#c98a7c';
const STONE = '#a98d68', STONE_D = '#7d6547', STONE_L = '#c7ad86', PIETRA = '#8e8a7e';
const ARNO = '#6f8c78', ARNO_D = '#56735f', ARNO_L = '#a9bca5';
const CYP = '#22382a', CYP_L = '#3b5a3e', OLIVE = '#8fa07a', OLIVE_D = '#6a7d5b', GRASS = '#86955c', GRASS_D = '#6b7a46';
const INK = '#3a2717', SHUTTER = '#4f6b4a';

export const city = {
  id: 'florence', name: 'Florence', wall: '#2c1a12',
  alt: "Florence painted as a Renaissance panel in a gilded arched frame: Brunelleschi's dome and Giotto's campanile over terracotta roofs, the towers of the Palazzo Vecchio and the Bargello, Santa Croce's white front, the Arno with the Ponte Vecchio and its hanging shops, the hills of Fiesole beyond and cypresses and olive trees on the slope of San Miniato in front, with the Florentine lily in the gold spandrels",
  google: 'family=EB+Garamond:ital,wght@0,500;0,600;1,400',
  fonts: [['600 200px "EB Garamond"', 'FIRENZE'], ['italic 400 42px "EB Garamond"', 'Veduta dal colle di San Miniato al Monte'], ['500 26px "EB Garamond"', 'MCDXXXVI · TEMPERA E ORO SU TAVOLA']],
  build,
};

// the opening: a round arch on straight jambs; the predella below it
const CX = W / 2, X0 = 180, X1 = W - 180, R = (X1 - X0) / 2, AC = 820, YB = 1500;
const PY0 = 1580, PY1 = 1860;
const HOR = 985; // where the far hills meet the city

function archPath(c, k = 0) {
  c.moveTo(X0 - k, YB + k); c.lineTo(X0 - k, AC);
  c.arc(CX, AC, R + k, Math.PI, 0, false);
  c.lineTo(X1 + k, YB + k); c.closePath();
}
function goldGrad(c, x0, y0, x1, y1) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, GOLD_D); g.addColorStop(0.28, GOLD_L); g.addColorStop(0.5, GOLD);
  g.addColorStop(0.72, GOLD_L); g.addColorStop(1, GOLD_D);
  return g;
}

function build() {
  const p = new Plate({ paper: GESSO, seed: 1436 });
  const r = p.r;
  p.clip = { x: X0, y: AC - R - 4, w: X1 - X0, h: YB - (AC - R) + 8 };
  p.stack('sky', 'far', 'city', 'monu', 'river', 'near', 'life', 'crack', 'frame', 'title');
  for (const n of ['frame', 'title']) p.layer(n, { clip: false });

  frame(p, r);
  sky(p, r);
  hills(p, r);
  const hs = town(p, r);
  landmarks(p, r, hs);
  river(p, r);
  slope(p, r);
  life(p, r);
  craquelure(p, r);
  title(p, r);
  return p;
}

// ================================================================ the frame
function framePath(c) {
  c.beginPath(); c.rect(0, 0, W, H); archPath(c, 0);
}
function frame(p, r) {
  const ALL = { x: 0, y: 0, w: W, h: H };
  // the gesso: hides whatever the painting draws outside the arch, from the start
  p.mark('frame', { t: 0, d: 0.1, reveal: 'none', box: ALL, draw: (c) => { framePath(c); c.fillStyle = GESSO; c.fill('evenodd'); } });
  // the red bole, laid on with a brush, from the foot up
  p.mark('frame', {
    t: 0.1, d: 0.9, reveal: 'rise', ease: 'inOut', box: ALL,
    draw: (c) => { framePath(c); c.fillStyle = BOLE; c.fill('evenodd'); },
  });
  // the gold leaf, burnished: laid from the top down; a little bole shows at the worn edges
  p.mark('frame', {
    t: 0.7, d: 1.3, reveal: 'fall', ease: 'inOut', box: ALL,
    draw: (c) => {
      c.save(); framePath(c); c.clip('evenodd');
      c.fillStyle = goldGrad(c, 0, 0, W, H * 0.7); c.fillRect(0, 0, W, H);
      // the worn corners, where the bole comes through
      c.fillStyle = 'rgba(154,59,38,.35)';
      for (const [x, y, rr] of WORN) { c.beginPath(); c.ellipse(x, y, rr, rr * 0.6, 0.6, 0, Math.PI * 2); c.fill(); }
      c.restore();
    },
  });
  // the moldings: the outer cornice, the jambs and the sill, as bands of light and shade
  p.group('frame', ALL, (c) => {
    const band = (k, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.strokeRect(k, k, W - 2 * k, H - 2 * k); };
    band(6, 12, GOLD_K); band(17, 8, GOLD_L); band(26, 8, GOLD_D); band(36, 4, BOLE_D); band(46, 10, GOLD_L); band(56, 4, GOLD_D);
    // a bead and reel along the inner molding
    c.fillStyle = GOLD_L;
    for (let x = 80; x < W - 70; x += 22) { c.beginPath(); c.ellipse(x, 68, 7, 4, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(x, H - 68, 7, 4, 0, 0, Math.PI * 2); c.fill(); }
    for (let y = 90; y < H - 70; y += 22) { c.beginPath(); c.ellipse(68, y, 4, 7, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(W - 68, y, 4, 7, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = GOLD_K;
    for (let x = 91; x < W - 70; x += 22) { c.fillRect(x - 1, 66, 2, 4); c.fillRect(x - 1, H - 70, 2, 4); }
    for (let y = 101; y < H - 70; y += 22) { c.fillRect(66, y - 1, 4, 2); c.fillRect(W - 70, y - 1, 4, 2); }
  }, { t: 1.6, d: 1.0, reveal: 'fade' });

  // the pilasters beside the jambs: lapis, with a gold candelabrum of rosettes and leaves
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? 96 : X1 + 34, x1 = s < 0 ? X0 - 34 : W - 96;
    p.group('frame', { x: x0 - 6, y: AC - 10, w: x1 - x0 + 12, h: YB - AC + 20 }, (c) => {
      c.fillStyle = LAPIS; c.fillRect(x0, AC, x1 - x0, YB - AC);
      c.strokeStyle = GOLD_L; c.lineWidth = 3; c.strokeRect(x0 + 5, AC + 5, x1 - x0 - 10, YB - AC - 10);
      const mx = (x0 + x1) / 2;
      c.strokeStyle = GOLD; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(mx, AC + 30); c.lineTo(mx, YB - 30); c.stroke();
      for (let y = AC + 60; y < YB - 40; y += 84) {
        // a rosette
        c.fillStyle = GOLD_L;
        for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; c.beginPath(); c.ellipse(mx + Math.cos(a) * 9, y + Math.sin(a) * 9, 7, 4, a, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = VERM; c.beginPath(); c.arc(mx, y, 5, 0, Math.PI * 2); c.fill();
        // a pair of leaves curling off the stem
        c.strokeStyle = GOLD; c.lineWidth = 2.2;
        for (const d of [-1, 1]) {
          c.beginPath(); c.moveTo(mx, y + 42); c.bezierCurveTo(mx + d * 22, y + 30, mx + d * 26, y + 54, mx + d * 12, y + 60); c.stroke();
        }
      }
    }, { t: 1.9 + (s > 0 ? 0.15 : 0), d: 1.1, reveal: 'fall', ease: 'inOut' });
  }

  // the arch's own molding: a lapis band set with gold stars, between gold beads
  p.mark('frame', {
    t: 2.2, d: 1.4, reveal: 'draw', ease: 'inOut', box: { x: X0 - 60, y: AC - R - 60, w: 2 * R + 120, h: YB - AC + R + 80 },
    draw: (c, q) => {
      const a1 = Math.PI + Math.PI * q;
      c.lineCap = 'butt';
      c.strokeStyle = LAPIS; c.lineWidth = 34; c.beginPath(); c.arc(CX, AC, R + 20, Math.PI, a1); c.stroke();
      c.strokeStyle = GOLD_L; c.lineWidth = 4; c.beginPath(); c.arc(CX, AC, R + 3, Math.PI, a1); c.stroke();
      c.strokeStyle = GOLD_D; c.lineWidth = 3; c.beginPath(); c.arc(CX, AC, R + 39, Math.PI, a1); c.stroke();
      c.fillStyle = GOLD_L;
      for (let k = 0; k <= 40; k++) {
        const a = Math.PI + (k / 40) * Math.PI;
        if (a > a1) break;
        star(c, CX + Math.cos(a) * (R + 20), AC + Math.sin(a) * (R + 20), 8);
      }
      // the jambs, straight down
      const yy = lerp(AC, YB, q);
      for (const x of [X0 - 20, X1 + 20]) {
        c.strokeStyle = LAPIS; c.lineWidth = 34; c.beginPath(); c.moveTo(x, AC); c.lineTo(x, yy); c.stroke();
        c.fillStyle = GOLD_L; for (let y = AC + 30; y < yy; y += 44) star(c, x, y, 8);
      }
      c.strokeStyle = GOLD_L; c.lineWidth = 4;
      c.beginPath(); c.moveTo(X0 - 3, AC); c.lineTo(X0 - 3, yy); c.moveTo(X1 + 3, AC); c.lineTo(X1 + 3, yy); c.stroke();
    },
  });

  // the sill under the opening
  p.group('frame', { x: X0 - 60, y: YB - 8, w: 2 * R + 120, h: 80 }, (c) => {
    c.fillStyle = goldGrad(c, 0, YB, 0, YB + 60); c.fillRect(X0 - 50, YB, 2 * R + 100, 60);
    c.fillStyle = GOLD_K; c.fillRect(X0 - 50, YB, 2 * R + 100, 3); c.fillRect(X0 - 50, YB + 56, 2 * R + 100, 3);
    // egg and dart
    for (let x = X0 - 36; x < X1 + 40; x += 28) {
      c.fillStyle = GOLD_D; c.beginPath(); c.ellipse(x, YB + 30, 10, 14, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD_L; c.beginPath(); c.ellipse(x - 1, YB + 28, 7, 10, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD_K; c.fillRect(x + 13, YB + 18, 2, 24);
    }
  }, { t: 2.6, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // the punchwork in the spandrels: rings of dots following the arch, and rosettes
  const dots = [];
  for (let ring = 0; ring < 3; ring++) {
    const rad = R + 62 + ring * 16;
    const n = Math.round(Math.PI * rad / (ring === 1 ? 9 : 13));
    for (let k = 0; k <= n; k++) { const a = Math.PI + (k / n) * Math.PI; dots.push([CX + Math.cos(a) * rad, AC + Math.sin(a) * rad, ring === 1 ? 2.2 : 3.2, a]); }
  }
  // punched rosettes over the rest of the spandrels: a dot ringed by six
  for (let y = 104; y < AC; y += 40) {
    for (let x = 104 + ((y / 40) % 2) * 20; x < W - 100; x += 40) {
      if (Math.hypot(x - CX, y - AC) < R + 118 || Math.hypot(x - 205, y - 205) < 122 || Math.hypot(x - W + 205, y - 205) < 122) continue;
      if (y > AC - 60 && (x < X0 - 50 || x > X1 + 50)) continue;
      dots.push([x, y, 2.6, 0]);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; dots.push([x + Math.cos(a) * 7.5, y + Math.sin(a) * 7.5, 1.7, 0]); }
    }
  }
  const dotsIn = dots.filter(([x, y]) => x > 80 && x < W - 80 && y > 80 && Math.hypot(x - CX, y - AC) > R + 46);
  for (let pass = 0; pass < 4; pass++) {
    const these = dotsIn.filter((d, i) => i % 4 === pass);
    p.group('frame', { x: 60, y: 60, w: W - 120, h: AC }, (c) => {
      c.fillStyle = GOLD_K;
      c.beginPath(); for (const [x, y, rr] of these) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); } c.fill();
      c.fillStyle = 'rgba(255,240,190,.75)';
      c.beginPath(); for (const [x, y, rr] of these) { c.moveTo(x + rr * 0.5 - 0.6, y - 0.6); c.arc(x - 0.6, y - 0.6, rr * 0.45, 0, Math.PI * 2); } c.fill();
    }, { t: 3.0 + pass * 0.35, d: 0.7, reveal: 'fade' });
  }

  // the Florentine lily, red on white, in a roundel in each spandrel
  for (const s of [-1, 1]) {
    const x = s < 0 ? 205 : W - 205, y = 205;
    p.group('frame', { x: x - 110, y: y - 110, w: 220, h: 220 }, (c) => {
      c.fillStyle = GOLD_K; c.beginPath(); c.arc(x, y, 98, 0, Math.PI * 2); c.fill();
      c.fillStyle = goldGrad(c, x - 95, y - 95, x + 95, y + 95); c.beginPath(); c.arc(x, y, 94, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD_D; for (let k = 0; k < 36; k++) { const a = (k / 36) * Math.PI * 2; c.beginPath(); c.arc(x + Math.cos(a) * 84, y + Math.sin(a) * 84, 3, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#f6efe0'; c.beginPath(); c.arc(x, y, 74, 0, Math.PI * 2); c.fill();
      c.strokeStyle = GOLD_D; c.lineWidth = 2; c.stroke();
      giglio(c, x, y + 4, 1.05, VERM);
    }, { t: 4.2 + (s > 0 ? 0.25 : 0), d: 0.8, reveal: 'pop' });
  }
}
const WORN = [[40, 40, 30], [W - 44, 48, 26], [36, H - 40, 34], [W - 40, H - 46, 28], [CX, 26, 22], [26, 1100, 18], [W - 24, 760, 20]];

function star(c, x, y, rr) {
  c.beginPath();
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2 - Math.PI / 2, d = k % 2 ? rr * 0.38 : rr; c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  c.closePath(); c.fill();
}
// the giglio: a stylized lily with its stamens, as Florence paints it
function giglio(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = col;
  // the middle petal
  c.beginPath(); c.moveTo(0, -60); c.bezierCurveTo(14, -40, 12, -14, 4, 6); c.lineTo(-4, 6); c.bezierCurveTo(-12, -14, -14, -40, 0, -60); c.fill();
  // the two side petals curling outward and down
  for (const d of [-1, 1]) {
    c.beginPath(); c.moveTo(d * 4, 4);
    c.bezierCurveTo(d * 10, -30, d * 44, -40, d * 50, -18);
    c.bezierCurveTo(d * 54, -6, d * 44, 0, d * 40, -8);
    c.bezierCurveTo(d * 40, -22, d * 22, -16, d * 12, 6);
    c.fill();
    // the stamens between them
    c.lineWidth = 3.4; c.strokeStyle = col; c.lineCap = 'round';
    c.beginPath(); c.moveTo(d * 5, 2); c.quadraticCurveTo(d * 16, -22, d * 22, -40); c.stroke();
    c.beginPath(); c.arc(d * 23, -44, 5, 0, Math.PI * 2); c.fill();
  }
  // the band and the foot
  c.fillRect(-26, 6, 52, 10);
  for (const d of [-1, 1]) {
    c.beginPath(); c.moveTo(d * 3, 16); c.bezierCurveTo(d * 8, 36, d * 30, 34, d * 34, 46); c.bezierCurveTo(d * 20, 46, d * 6, 38, 0, 30); c.fill();
  }
  c.beginPath(); c.moveTo(-6, 16); c.lineTo(6, 16); c.lineTo(0, 46); c.fill();
  c.restore();
}

// ================================================================ the sky
function sky(p, r) {
  const top = AC - R;
  p.group('sky', { x: X0, y: top - 4, w: X1 - X0, h: 1000 }, (c) => {
    const g = c.createLinearGradient(0, top, 0, HOR);
    g.addColorStop(0, SKY_T); g.addColorStop(0.45, '#4d74b5'); g.addColorStop(0.78, SKY_M); g.addColorStop(1, SKY_H);
    c.fillStyle = g; c.fillRect(X0, top, X1 - X0, HOR - top + 60);
    // the brush: long horizontal strokes of the lighter blue, as tempera is laid
    c.strokeStyle = 'rgba(255,255,255,.06)'; c.lineWidth = 3;
    c.beginPath(); for (const [x, y, L] of SKYSTROKES) { c.moveTo(x, y); c.lineTo(x + L, y + 1); } c.stroke();
  }, { t: 1.2, d: 1.6, reveal: 'fall', ease: 'inOut' });
  // the ground below the sky: a warm imprimatura with the sinopia drawing on it
  p.group('sky', { x: X0, y: HOR - 160, w: X1 - X0, h: YB - HOR + 170 }, (c) => {
    c.fillStyle = '#dcc398'; c.fillRect(X0, HOR - 10, X1 - X0, YB - HOR + 20);
    c.strokeStyle = 'rgba(150,70,40,.55)'; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(X0, HOR - 30); c.bezierCurveTo(400, HOR - 120, 600, HOR - 60, 800, HOR - 50); c.bezierCurveTo(1000, HOR - 40, 1200, HOR - 110, X1, HOR - 60);
    c.moveTo(X0, 1238); c.lineTo(X1, 1238); c.moveTo(X0, 1336); c.lineTo(X1, 1336);
    c.moveTo(870, 1000); c.quadraticCurveTo(800, 900, 870, 840); c.quadraticCurveTo(940, 900, 870, 1000);
    c.moveTo(742, 1108); c.lineTo(742, 820); c.moveTo(548, 1150); c.lineTo(548, 760);
    c.moveTo(250, 1500); c.lineTo(214, 1030); c.moveTo(1360, 1500); c.lineTo(1390, 1000);
    c.moveTo(X0, 1440); c.bezierCurveTo(560, 1400, 900, 1450, X1, 1395);
    c.stroke();
  }, { t: 1.4, d: 1.2, reveal: 'wipe', ease: 'inOut', box: { x: X0, y: HOR - 160, w: X1 - X0, h: YB - HOR + 170 } });
  // small, round clouds, lit from the left, as the Quattrocento paints them
  const clouds = [[360, 500, 1.0], [1080, 430, 1.25], [700, 610, 0.8], [1260, 640, 0.7], [470, 740, 0.62], [930, 760, 0.55]];
  clouds.forEach(([x, y, s], i) => {
    const puffs = [];
    const n = 5 + (i % 3);
    for (let k = 0; k < n; k++) { const t = k / (n - 1); puffs.push([x + (t - 0.5) * 170 * s + r.range(-8, 8) * s, y - Math.sin(t * Math.PI) * 30 * s + r.range(-5, 5) * s, (22 + Math.sin(t * Math.PI) * 18 + r.range(-3, 5)) * s]); }
    p.group('sky', { x: x - 150 * s, y: y - 100 * s, w: 300 * s, h: 150 * s }, (c) => {
      c.fillStyle = 'rgba(150,140,185,.5)';
      c.beginPath(); for (const [px, py, pr] of puffs) { c.moveTo(px + pr * 1.5 + 3, py + 5); c.ellipse(px + 3, py + 5, pr * 1.5, pr * 0.62, 0, 0, Math.PI * 2); } c.fill();
      c.fillStyle = '#f2ead8';
      c.beginPath(); for (const [px, py, pr] of puffs) { c.moveTo(px + pr * 1.5, py); c.ellipse(px, py, pr * 1.5, pr * 0.62, 0, 0, Math.PI * 2); } c.fill();
      c.fillStyle = '#fffaf0';
      c.beginPath(); for (const [px, py, pr] of puffs) { c.moveTo(px - pr * 0.3 + pr * 0.9, py - pr * 0.22); c.ellipse(px - pr * 0.3, py - pr * 0.22, pr * 0.9, pr * 0.3, 0, 0, Math.PI * 2); } c.fill();
      // the gold the painter touched along their lit edges
      c.strokeStyle = 'rgba(232,196,110,.7)'; c.lineWidth = 1.6; c.beginPath(); for (const [px, py, pr] of puffs) { c.moveTo(px - pr * 1.3, py - pr * 0.2); c.ellipse(px, py, pr * 1.5, pr * 0.62, 0, Math.PI * 1.05, Math.PI * 1.45); } c.stroke();
      // the flat foot, shaded
      
    }, { t: 2.5 + i * 0.18, d: 1.0, reveal: 'fade' });
  });
}
const SKYSTROKES = (() => { const r = rng(91); const a = []; for (let i = 0; i < 160; i++) a.push([r.range(X0, X1 - 100), r.range(AC - R, HOR), r.range(60, 260)]); return a; })();

// ================================================================ the hills of Fiesole
function ridge(r, y0, amp, n, peaks) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = X0 - 20 + (i / n) * (X1 - X0 + 40);
    let y = y0;
    for (const [px, ph, pw] of peaks) y -= ph * Math.exp(-(((x - px) / pw) ** 2));
    y += Math.sin(i * 0.9) * amp * 0.3 + r.range(-amp, amp) * 0.2;
    pts.push([x, y]);
  }
  return pts;
}
function hills(p, r) {
  const far = ridge(r, HOR - 20, 6, 60, [[420, 90, 200], [900, 60, 260], [1300, 110, 180]]);
  const mid = ridge(r, HOR + 4, 5, 60, [[300, 70, 160], [640, 110, 170], [1100, 70, 240]]);
  const shape = (pts, y1) => [...pts, [X1 + 20, y1], [X0 - 20, y1]];
  p.fill('far', shape(far, HOR + 60), HILL_F, { t: 2.6, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // the near hills, Fiesole's: terra verde, modeled with short hatched strokes
  const midShape = shape(mid, HOR + 60);
  const strokes = [];
  for (let i = 0; i < 900; i++) {
    const x = r.range(X0, X1), y = r.range(HOR - 120, HOR + 20);
    const top = interp(mid, x);
    if (y < top + 4) continue;
    strokes.push([[x, y], [x + 5, y - 4]]);
  }
  // olive groves as dots, villas, and cypress strokes along the ridges
  const groves = [], villas = [], cyps = [];
  for (let i = 0; i < 520; i++) {
    const x = r.range(X0, X1), top = interp(mid, x), y = r.range(top + 6, HOR + 10);
    groves.push([x, y, r.range(1.8, 3.2)]);
  }
  for (let i = 0; i < 26; i++) {
    const x = r.range(X0 + 20, X1 - 20), top = interp(mid, x), y = r.range(top + 14, HOR - 6);
    villas.push([x, y, r.range(9, 16), r.range(6, 10), r.pick(PLASTER)]);
  }
  for (let i = 0; i < 70; i++) {
    const x = r.range(X0, X1), top = interp(mid, x), y = r.range(top + 8, HOR + 6);
    cyps.push([x, y, r.range(9, 18)]);
  }
  p.group('far', boxOf(midShape, 4), (c) => {
    const g = c.createLinearGradient(0, HOR - 120, 0, HOR + 40);
    g.addColorStop(0, '#86a08a'); g.addColorStop(1, HILL_M);
    c.fillStyle = g; poly(c, midShape); c.fill();
    c.save(); poly(c, midShape); c.clip();
    c.strokeStyle = 'rgba(60,90,60,.22)'; c.lineWidth = 1.2;
    c.beginPath(); for (const [[a, b], [d, e]] of strokes) { c.moveTo(a, b); c.lineTo(d, e); } c.stroke();
    c.fillStyle = 'rgba(70,100,70,.55)';
    c.beginPath(); for (const [x, y, rr] of groves) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); } c.fill();
    c.restore();
  }, { t: 3.0, d: 1.1, reveal: 'wipeL', ease: 'inOut' });
  // Fiesole on its hill: a cluster of walls, the cathedral's square bell tower
  p.group('far', { x: X0, y: HOR - 160, w: X1 - X0, h: 190 }, (c) => {
    for (const [x, y, w, h, col] of villas) { c.fillStyle = col; c.fillRect(x, y - h, w, h); c.fillStyle = TERRA; c.fillRect(x - 1, y - h - 3, w + 2, 3); }
    c.fillStyle = CYP;
    for (const [x, y, h] of cyps) { c.beginPath(); c.moveTo(x - 2.2, y); c.quadraticCurveTo(x - 2.6, y - h * 0.6, x, y - h); c.quadraticCurveTo(x + 2.6, y - h * 0.6, x + 2.2, y); c.fill(); }
    const fx = 330, fy = interp(mid, 330) + 16;
    c.fillStyle = '#d9c39c'; c.fillRect(fx - 26, fy - 10, 52, 10); c.fillRect(fx + 14, fy - 16, 20, 16);
    c.fillStyle = TERRA; c.fillRect(fx - 27, fy - 12, 54, 3); c.fillRect(fx + 13, fy - 18, 22, 3);
    c.fillStyle = '#cdb184'; c.fillRect(fx - 4, fy - 40, 8, 30);
    c.fillStyle = '#b8955f'; c.fillRect(fx - 5, fy - 43, 10, 4);
    c.fillStyle = INK; c.fillRect(fx - 2, fy - 36, 1.5, 5); c.fillRect(fx + 0.5, fy - 36, 1.5, 5);
  }, { t: 3.6, d: 1.0, reveal: 'fade' });
}
function interp(pts, x) {
  for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) { const t = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return lerp(pts[i - 1][1], pts[i][1], t); }
  return pts[pts.length - 1][1];
}

// ================================================================ the town
// the landmarks' footprints: no ordinary house stands in them
const SPOTS = [
  { x0: 470, x1: 620, y: 1150 }, // Palazzo Vecchio
  { x0: 632, x1: 668, y: 1128 }, // the Bargello
  { x0: 700, x1: 990, y: 1108 }, // the Duomo and the campanile
  { x0: 1080, x1: 1290, y: 1215 }, // Santa Croce
];
function house(c, h) {
  const { x, y, w, ht, d, wall, roof } = h;
  // the side wall, in shade, then the front, then the roof seen from a little above
  c.fillStyle = mix(wall, '#6b5040', 0.35); c.fillRect(x + w, y - ht + d * 0.2, d * 0.45, ht - d * 0.2);
  c.fillStyle = wall; c.fillRect(x, y - ht, w, ht);
  c.fillStyle = roof;
  c.beginPath(); c.moveTo(x - 1.5, y - ht + 0.5); c.lineTo(x + w + d * 0.45 + 1.5, y - ht + d * 0.2); c.lineTo(x + w + d * 0.3, y - ht - d * 0.5); c.lineTo(x + d * 0.15, y - ht - d * 0.6); c.closePath(); c.fill();
  // the ridge and the tile rows
  c.strokeStyle = TERRA_D; c.lineWidth = Math.max(0.5, d * 0.08);
  c.beginPath(); c.moveTo(x + d * 0.12, y - ht - d * 0.32); c.lineTo(x + w + d * 0.35, y - ht - d * 0.18); c.stroke();
  // the windows, dark, with a green shutter here and there
  if (h.win) {
    c.fillStyle = h.shut ? SHUTTER : '#4b3626';
    const ww = Math.max(1, w * 0.12), wh = Math.max(1.2, ht * 0.16);
    for (let row = 0; row < h.rows; row++) for (let k = 0; k < h.cols; k++) {
      c.fillRect(x + (k + 0.5) * (w / h.cols) - ww / 2, y - ht + ht * 0.18 + row * (ht * 0.8 / h.rows), ww, wh);
    }
  }
}
function town(p, r) {
  const hs = [];
  // rows of houses from the hills down to the Arno, growing as they come nearer
  for (let y = HOR + 4; y < 1238; ) {
    const k = (y - HOR) / (1238 - HOR);
    const s = lerp(0.45, 1.5, k);
    for (let x = X0 - 10; x < X1 + 10; ) {
      const w = r.range(18, 34) * s, ht = r.range(12, 24) * s, d = r.range(10, 16) * s;
      const hh = { x, y: y + r.range(-3, 3) * s, w, ht, d, wall: r.pick(PLASTER), roof: r.pick([TERRA, TERRA, TERRA_L, '#c4683e', '#a94f2e']), win: s > 0.65, shut: r.chance(0.3), rows: ht > 22 ? 2 : 1, cols: Math.max(1, Math.round(w / 9)) };
      const inSpot = SPOTS.some((sp) => x + w > sp.x0 && x < sp.x1 && hh.y < sp.y + 4 && hh.y > sp.y - 70);
      if (!inSpot && !(y > 1180 && x < 580)) hs.push(hh); // the Ponte Vecchio's end is clear
      x += w + r.range(-2, 6) * s;
    }
    y += 7 * s + 2;
  }
  // set them down a band at a time, from the hills toward the river
  const bands = 10;
  for (let b = 0; b < bands; b++) {
    const ya = lerp(HOR, 1240, b / bands), yb = lerp(HOR, 1240, (b + 1) / bands);
    const these = hs.filter((h) => h.y >= ya && h.y < yb);
    if (!these.length) continue;
    p.group('city', { x: X0 - 20, y: ya - 70, w: X1 - X0 + 40, h: yb - ya + 80 }, (c) => { for (const h of these) house(c, h); },
      { t: 3.7 + b * 0.32, d: 0.9, reveal: 'rise', ease: 'out' });
  }
  return hs;
}

// ================================================================ the landmarks
function landmarks(p, r, hs) {
  palazzoVecchio(p, 4.9);
  bargello(p, 5.3);
  duomo(p, 5.7);
  campanile(p, 6.4);
  santaCroce(p, 7.0);
  // the houses in front of the landmarks, set again over their feet
  const front = hs.filter((h) => SPOTS.some((sp) => h.x + h.w > sp.x0 - 30 && h.x < sp.x1 + 30 && h.y > sp.y + 2 && h.y < sp.y + 60));
  p.group('monu', { x: X0, y: 1080, w: X1 - X0, h: 220 }, (c) => { for (const h of front) house(c, h); }, { t: 7.6, d: 0.6, reveal: 'fade' });
}
function crenel(c, x0, x1, y, h, w, swallow) {
  // a row of merlons along a top, square (Guelph) or swallowtailed (Ghibelline)
  const n = Math.max(2, Math.round((x1 - x0) / (w * 2)));
  const step = (x1 - x0) / n;
  for (let k = 0; k < n; k++) {
    const a = x0 + k * step + step * 0.2, b = a + step * 0.6;
    if (swallow) { c.beginPath(); c.moveTo(a, y); c.lineTo(a, y - h); c.lineTo((a + b) / 2, y - h * 0.5); c.lineTo(b, y - h); c.lineTo(b, y); c.fill(); }
    else c.fillRect(a, y - h, b - a, h);
  }
}
function palazzoVecchio(p, t) {
  const bx0 = 470, bx1 = 610, base = 1150, top = 1050;
  const tx = 548, tw = 34;
  p.group('monu', { x: 440, y: 700, w: 200, h: 470 }, (c) => {
    // the block, rough pietraforte, a little lighter on the lit face
    c.fillStyle = STONE_D; c.fillRect(bx1, top + 6, 20, base - top - 6);
    c.fillStyle = STONE; c.fillRect(bx0, top, bx1 - bx0, base - top);
    // the gallery on its corbels, and the merlons
    c.fillStyle = STONE_L; c.fillRect(bx0 - 4, top - 16, bx1 - bx0 + 8, 16);
    c.fillStyle = STONE_D; for (let x = bx0; x < bx1; x += 9) c.fillRect(x, top - 2, 5, 8);
    c.fillStyle = STONE; crenel(c, bx0 - 4, bx1 + 4, top - 16, 10, 5, false);
    // rows of mullioned windows
    c.fillStyle = INK;
    for (const yy of [top + 26, top + 62]) for (let x = bx0 + 12; x < bx1 - 8; x += 22) { c.beginPath(); c.moveTo(x, yy + 16); c.lineTo(x, yy + 4); c.arc(x + 5, yy + 4, 5, Math.PI, 0); c.lineTo(x + 10, yy + 16); c.fill(); }
    c.fillStyle = STONE_L; for (const yy of [top + 26, top + 62]) for (let x = bx0 + 12; x < bx1 - 8; x += 22) c.fillRect(x + 4.3, yy + 2, 1.4, 14);
    // the rustication: courses of stone
    c.strokeStyle = 'rgba(80,60,40,.35)'; c.lineWidth = 0.8;
    c.beginPath(); for (let y = top + 8; y < base; y += 7) { c.moveTo(bx0, y); c.lineTo(bx1, y); } c.stroke();
    // the tower, set forward over the front: shaft, gallery, belfry and cupola
    const g0 = 830;
    c.fillStyle = STONE_D; c.fillRect(tx + tw / 2, g0, 8, top - g0);
    c.fillStyle = STONE; c.fillRect(tx - tw / 2, g0, tw, top - g0);
    c.strokeStyle = 'rgba(80,60,40,.3)'; c.beginPath(); for (let y = g0 + 8; y < top; y += 7) { c.moveTo(tx - tw / 2, y); c.lineTo(tx + tw / 2, y); } c.stroke();
    c.fillStyle = INK; c.fillRect(tx - 3, 900, 6, 12); c.fillRect(tx - 3, 960, 6, 12);
    // the projecting gallery with its corbels and swallowtail merlons
    c.fillStyle = STONE_L; c.fillRect(tx - tw / 2 - 7, g0 - 18, tw + 14, 18);
    c.fillStyle = STONE_D; for (let x = tx - tw / 2 - 5; x < tx + tw / 2 + 6; x += 6) c.fillRect(x, g0 - 2, 3.5, 7);
    c.fillStyle = STONE; crenel(c, tx - tw / 2 - 7, tx + tw / 2 + 7, g0 - 18, 9, 3.4, true);
    // the belfry on four columns, its own merlons, the cupola and the lion's staff
    c.fillStyle = STONE; c.fillRect(tx - 12, 778, 24, 34);
    c.fillStyle = INK; c.fillRect(tx - 7, 784, 5, 20); c.fillRect(tx + 2, 784, 5, 20);
    c.fillStyle = STONE_L; c.fillRect(tx - 14, 776, 28, 5);
    c.fillStyle = STONE; crenel(c, tx - 14, tx + 14, 776, 7, 2.6, true);
    c.fillStyle = STONE_D; c.beginPath(); c.moveTo(tx - 9, 768); c.quadraticCurveTo(tx, 744, tx + 9, 768); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(tx, 750); c.lineTo(tx, 728); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.arc(tx, 750, 2.6, 0, Math.PI * 2); c.fill();
    // the clock
    c.fillStyle = '#efe4c8'; c.beginPath(); c.arc(tx, 868, 8, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); c.beginPath(); c.moveTo(tx, 868); c.lineTo(tx + 4, 864); c.stroke();
  }, { t, d: 1.5, reveal: 'rise', ease: 'out' });
}
function bargello(p, t) {
  const x = 650, base = 1128, top = 905, w = 22;
  p.group('monu', { x: 620, y: 880, w: 70, h: 260 }, (c) => {
    c.fillStyle = STONE_D; c.fillRect(x - 36, base - 50, 72, 50);
    c.fillStyle = STONE_L; c.fillRect(x - 36, base - 54, 72, 4);
    c.fillStyle = STONE; crenel(c, x - 36, x + 36, base - 54, 6, 3, false);
    c.fillStyle = '#9b7f5c'; c.fillRect(x + w / 2, top, 5, base - top - 50);
    c.fillStyle = STONE; c.fillRect(x - w / 2, top, w, base - top - 50);
    c.fillStyle = STONE_L; c.fillRect(x - w / 2 - 3, top - 8, w + 6, 8);
    c.fillStyle = STONE; crenel(c, x - w / 2 - 3, x + w / 2 + 3, top - 8, 6, 2.4, false);
    c.fillStyle = INK; c.fillRect(x - 2, top + 20, 4, 10); c.fillRect(x - 2, top + 70, 4, 10);
  }, { t, d: 1.3, reveal: 'rise' });
}
function duomo(p, t) {
  const cx = 870, dbase = 984, a = 100, dh = 148, drumT = 1000;
  // the body of the church: the nave toward the facade on the left, the tribunes round the dome
  p.group('monu', { x: 690, y: 940, w: 320, h: 180 }, (c) => {
    // the nave roof and its marble walls
    c.fillStyle = MARBLE_S; c.fillRect(712, 1040, 180, 62);
    c.fillStyle = MARBLE; c.fillRect(712, 1040, 180, 52);
    c.fillStyle = GREENM; for (let x = 720; x < 890; x += 18) c.fillRect(x, 1046, 2.5, 44);
    c.fillRect(712, 1062, 180, 2.5);
    c.fillStyle = TERRA; c.beginPath(); c.moveTo(706, 1042); c.lineTo(896, 1042); c.lineTo(888, 1020); c.lineTo(716, 1020); c.fill();
    c.strokeStyle = TERRA_D; c.lineWidth = 0.8; c.beginPath(); for (let x = 720; x < 890; x += 5) { c.moveTo(x, 1022); c.lineTo(x - 1, 1041); } c.stroke();
    // the tribunes with their half domes, on the right
    for (const [x, w] of [[960, 60], [905, 54]]) {
      c.fillStyle = MARBLE_S; c.fillRect(x - w / 2, 1046, w, 56);
      c.fillStyle = MARBLE; c.fillRect(x - w / 2, 1046, w - 8, 56);
      c.fillStyle = GREENM; for (let k = 0; k < 4; k++) c.fillRect(x - w / 2 + 6 + k * (w - 12) / 3, 1052, 2.5, 44);
      c.fillStyle = TERRA; c.beginPath(); c.ellipse(x, 1046, w / 2 + 2, 22, 0, Math.PI, 0); c.fill();
      c.strokeStyle = MARBLE; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, 1024); c.lineTo(x, 1046); c.moveTo(x - w * 0.3, 1030); c.lineTo(x - w * 0.42, 1046); c.moveTo(x + w * 0.3, 1030); c.lineTo(x + w * 0.42, 1046); c.stroke();
    }
    // the drum: three faces of the octagon, marble framed, each with its round window
    const faces = [[cx - a, cx - a * 0.42, 0.82], [cx - a * 0.42, cx + a * 0.42, 1], [cx + a * 0.42, cx + a, 0.7]];
    for (const [x0, x1, k] of faces) {
      c.fillStyle = mix(MARBLE, '#8a7a66', 1 - k); c.fillRect(x0, dbase, x1 - x0, 52);
      c.strokeStyle = GREENM; c.lineWidth = 2.5; c.strokeRect(x0 + 3, dbase + 4, x1 - x0 - 6, 44);
      c.fillStyle = INK; c.beginPath(); c.arc((x0 + x1) / 2, dbase + 22, 7 * (x1 - x0) / (a * 0.84), 0, Math.PI * 2); c.fill();
      c.strokeStyle = MARBLE; c.lineWidth = 2; c.stroke();
    }
    c.fillStyle = MARBLE; c.fillRect(cx - a - 3, dbase - 4, 2 * a + 6, 6);
    c.fillStyle = GREENM; c.fillRect(cx - a - 3, dbase + 2, 2 * a + 6, 2);
  }, { t, d: 1.2, reveal: 'rise' });
  // the dome: a pointed shell of red tile on eight white ribs, rising
  const side = (sgn, k = 1) => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const u = (i / 24) * 0.93, y = dbase - dh * u;
      const x = cx + sgn * k * hwAt(u);
      pts.push([x, y]);
    }
    return pts;
  };
  // the shell is pointed: each side an arc struck from a center inside the other (quinto acuto)
  function hwAt(u) { return Math.sqrt((1.6 * a) ** 2 - (dh * u) ** 2) - 0.6 * a; }
  p.group('monu', { x: cx - a - 10, y: dbase - dh - 70, w: 2 * a + 20, h: dh + 76 }, (c) => {
    const L = side(-1), Rt = side(1);
    const g = c.createLinearGradient(cx - a, 0, cx + a, 0);
    g.addColorStop(0, '#c9693f'); g.addColorStop(0.42, TERRA_L); g.addColorStop(1, '#8e3f22');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (const q of L) c.lineTo(q[0], q[1]); for (let i = Rt.length - 1; i >= 0; i--) c.lineTo(Rt[i][0], Rt[i][1]); c.closePath(); c.fill();
    // the courses of tile: fine curved lines across the shell
    c.save(); c.clip();
    c.strokeStyle = 'rgba(110,40,20,.32)'; c.lineWidth = 0.9;
    c.beginPath();
    for (let i = 1; i < 26; i++) { const u = (i / 26) * 0.93, y = dbase - dh * u, hw = hwAt(u); c.moveTo(cx - hw, y); c.quadraticCurveTo(cx, y + 9 * (1 - u), cx + hw, y); }
    c.stroke();
    // the little round windows of the shell, in rows
    c.fillStyle = 'rgba(60,25,10,.6)';
    for (const [u, xs] of [[0.3, [-0.5, 0.05, 0.6]], [0.62, [-0.3, 0.32]]]) for (const f of xs) { const y = dbase - dh * u, hw = hwAt(u); c.beginPath(); c.arc(cx + f * hw, y, 2.2, 0, Math.PI * 2); c.fill(); }
    c.restore();
    // the ribs: the middle one and two either side, white marble
    c.strokeStyle = MARBLE; c.lineCap = 'round';
    for (const k of [-1, -0.7, 0, 0.7, 1]) {
      const pts = side(k < 0 ? -1 : 1, Math.abs(k) || 0.0001);
      c.lineWidth = k === 0 ? 5 : Math.abs(k) === 1 ? 3.5 : 4.4;
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts) c.lineTo(q[0], q[1]); c.stroke();
    }
    // the lantern: a ring, buttressed white marble, a cone and the gilded ball and cross
    const ly = dbase - dh * 0.93;
    c.fillStyle = MARBLE; c.fillRect(cx - 18, ly - 4, 36, 6);
    c.fillStyle = MARBLE_S; c.fillRect(cx - 12, ly - 32, 24, 28);
    c.fillStyle = MARBLE; c.fillRect(cx - 12, ly - 32, 16, 28);
    c.fillStyle = INK; c.fillRect(cx - 7, ly - 27, 3, 15); c.fillRect(cx + 1, ly - 27, 3, 15);
    for (const d of [-1, 1]) { c.fillStyle = MARBLE; c.beginPath(); c.moveTo(cx + d * 12, ly - 30); c.quadraticCurveTo(cx + d * 22, ly - 14, cx + d * 20, ly); c.lineTo(cx + d * 12, ly); c.fill(); }
    c.fillStyle = MARBLE_S; c.beginPath(); c.moveTo(cx - 14, ly - 32); c.lineTo(cx + 14, ly - 32); c.lineTo(cx, ly - 56); c.fill();
    c.fillStyle = MARBLE; c.beginPath(); c.moveTo(cx - 14, ly - 32); c.lineTo(cx + 2, ly - 32); c.lineTo(cx, ly - 56); c.fill();
    c.fillStyle = GOLD_L; c.beginPath(); c.arc(cx, ly - 60, 5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, ly - 64); c.lineTo(cx, ly - 76); c.moveTo(cx - 4, ly - 71); c.lineTo(cx + 4, ly - 71); c.stroke();
  }, { t: t + 0.6, d: 1.4, reveal: 'rise', ease: 'out' });
}
function campanile(p, t) {
  // Giotto's tower: square, flat-topped, banded in white, green and pink marble
  const x = 742, w = 44, base = 1108, top = 820;
  p.group('monu', { x: x - w / 2 - 10, y: top - 20, w: w + 30, h: base - top + 30 }, (c) => {
    c.fillStyle = MARBLE_S; c.fillRect(x + w / 2, top + 6, 9, base - top - 6);
    c.fillStyle = MARBLE; c.fillRect(x - w / 2, top, w, base - top);
    // the storys, each with its frame of green and an inlaid pink panel
    const stories = [[1108, 1062], [1062, 1018], [1018, 960], [960, 900], [900, 830]];
    stories.forEach(([y1, y0], i) => {
      c.fillStyle = GREENM; c.fillRect(x - w / 2, y0, w, 2.5); c.fillRect(x - w / 2, y1 - 2.5, w, 2.5);
      c.fillRect(x - w / 2, y0, 2.5, y1 - y0); c.fillRect(x + w / 2 - 2.5, y0, 2.5, y1 - y0);
      if (i < 2) { c.fillStyle = PINKM; c.fillRect(x - w / 2 + 7, y0 + 8, w - 14, y1 - y0 - 16); c.fillStyle = MARBLE; c.fillRect(x - w / 2 + 11, y0 + 12, w - 22, y1 - y0 - 24); c.fillStyle = GREENM; c.beginPath(); c.arc(x, (y0 + y1) / 2, 4, 0, Math.PI * 2); c.fill(); }
      else {
        // the gothic windows: two lights, then two, then the tall three-light top
        const n = i === 4 ? 3 : 2, ww = i === 4 ? 7 : 8, hh = (y1 - y0) * 0.6;
        c.fillStyle = INK;
        for (let k = 0; k < n; k++) {
          const wx = x - (n * ww + (n - 1) * 3) / 2 + k * (ww + 3), wy = y0 + (y1 - y0) * 0.22;
          c.beginPath(); c.moveTo(wx, wy + hh); c.lineTo(wx, wy + ww * 0.6); c.quadraticCurveTo(wx, wy, wx + ww / 2, wy - ww * 0.3); c.quadraticCurveTo(wx + ww, wy, wx + ww, wy + ww * 0.6); c.lineTo(wx + ww, wy + hh); c.fill();
        }
        c.fillStyle = PINKM; c.fillRect(x - w / 2 + 3, y1 - 8, w - 6, 3);
      }
    });
    // the flat crown on its corbels, without the spire Giotto drew
    c.fillStyle = MARBLE; c.fillRect(x - w / 2 - 5, top - 10, w + 10, 12);
    c.fillStyle = GREENM; c.fillRect(x - w / 2 - 5, top - 1, w + 10, 2);
    c.fillStyle = MARBLE_S; for (let xx = x - w / 2 - 3; xx < x + w / 2 + 4; xx += 6) c.fillRect(xx, top + 1, 3, 6);
    c.fillStyle = MARBLE; c.fillRect(x - w / 2 - 5, top - 16, w + 10, 3);
    for (let xx = x - w / 2 - 5; xx <= x + w / 2 + 5; xx += 6.5) c.fillRect(xx, top - 16, 1.6, 7);
  }, { t, d: 1.5, reveal: 'rise', ease: 'out' });
}
function santaCroce(p, t) {
  const x = 1170, base = 1215, w = 150, top = 1100;
  p.group('monu', { x: x - w / 2 - 20, y: 960, w: w + 140, h: base - 950 }, (c) => {
    // the brick bell tower behind, on the right, with its pointed spire
    const bx = 1262;
    c.fillStyle = '#9c6a48'; c.fillRect(bx - 12, 1000, 24, 160);
    c.fillStyle = '#b57e57'; c.fillRect(bx - 12, 1000, 16, 160);
    c.fillStyle = INK; for (const y of [1020, 1060]) { c.fillRect(bx - 6, y, 4, 16); c.fillRect(bx + 1, y, 4, 16); }
    c.fillStyle = '#7d5235'; c.beginPath(); c.moveTo(bx - 13, 1000); c.lineTo(bx + 13, 1000); c.lineTo(bx, 958); c.fill();
    c.fillStyle = '#9c6a48'; c.beginPath(); c.moveTo(bx - 13, 1000); c.lineTo(bx + 2, 1000); c.lineTo(bx, 958); c.fill();
    // the long nave roof running back
    c.fillStyle = TERRA_D; c.beginPath(); c.moveTo(x - 50, top + 10); c.lineTo(x + 50, top + 10); c.lineTo(x + 30, top - 14); c.lineTo(x - 30, top - 14); c.fill();
    // the white front: a tall middle gable, two lower ones, green bands, the rose window
    c.fillStyle = MARBLE_S; c.fillRect(x - w / 2, top + 40, w, base - top - 40);
    c.fillStyle = MARBLE;
    c.beginPath(); c.moveTo(x - w / 2, base); c.lineTo(x - w / 2, top + 56); c.lineTo(x - w / 2 + 40, top + 40); c.lineTo(x - 30, top + 40); c.lineTo(x - 30, top + 20); c.lineTo(x, top - 6); c.lineTo(x + 30, top + 20); c.lineTo(x + 30, top + 40); c.lineTo(x + w / 2 - 40, top + 40); c.lineTo(x + w / 2, top + 56); c.lineTo(x + w / 2, base); c.fill();
    c.strokeStyle = GREENM; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x - 30, top + 20); c.lineTo(x, top - 6); c.lineTo(x + 30, top + 20);
    for (const xx of [x - w / 2 + 3, x - 30, x + 30, x + w / 2 - 3]) { c.moveTo(xx, top + 42); c.lineTo(xx, base); }
    c.moveTo(x - w / 2, top + 70); c.lineTo(x + w / 2, top + 70); c.stroke();
    // the rose window, the star in the gable and the three doors
    c.fillStyle = GREENM; c.beginPath(); c.arc(x, top + 44, 12, 0, Math.PI * 2); c.fill();
    c.fillStyle = MARBLE; c.beginPath(); c.arc(x, top + 44, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(x, top + 44, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD; star(c, x, top + 14, 5);
    c.fillStyle = INK;
    for (const [xx, ww] of [[x, 16], [x - 48, 10], [x + 48, 10]]) { c.beginPath(); c.moveTo(xx - ww / 2, base); c.lineTo(xx - ww / 2, base - ww * 1.6); c.lineTo(xx, base - ww * 2.4); c.lineTo(xx + ww / 2, base - ww * 1.6); c.lineTo(xx + ww / 2, base); c.fill(); }
    // the piazza in front, with its little people
    c.fillStyle = '#dccaa3'; c.fillRect(x - w / 2 - 10, base, w + 20, 6);
  }, { t, d: 1.4, reveal: 'rise', ease: 'out' });
}

// ================================================================ the Arno
const RY0 = 1238, RY1 = 1336;
function river(p, r) {
  // the water: a cool green, with long strokes of light along it
  const lines = [];
  for (let i = 0; i < 120; i++) { const y = r.range(RY0 + 6, RY1 - 4), x = r.range(X0, X1), L = r.range(20, 90) * (0.6 + (y - RY0) / 100); lines.push([[x, y], [x + L, y]]); }
  p.group('river', { x: X0, y: RY0 - 4, w: X1 - X0, h: RY1 - RY0 + 8 }, (c) => {
    const g = c.createLinearGradient(0, RY0, 0, RY1);
    g.addColorStop(0, ARNO_L); g.addColorStop(0.4, ARNO); g.addColorStop(1, ARNO_D);
    c.fillStyle = g; c.fillRect(X0, RY0, X1 - X0, RY1 - RY0);
    // the embankment walls on the far side
    c.fillStyle = '#cdb58c'; c.fillRect(X0, RY0 - 4, X1 - X0, 6);
    c.fillStyle = 'rgba(80,60,40,.3)'; c.fillRect(X0, RY0 + 2, X1 - X0, 2);
  }, { t: 7.2, d: 1.1, reveal: 'wipe', ease: 'inOut' });
  p.strokes('river', lines, 'rgba(235,240,220,.5)', 1.3, { t: 7.8, d: 0.8, reveal: 'fade' });
  pontevecchio(p, r, 8.0);
  grazie(p, 8.8);
}
function pontevecchio(p, r, t) {
  const x0 = 186, x1 = 590, deck = 1236, water = 1290;
  const piers = [[x0, 'end'], [318, 'pier'], [458, 'pier'], [x1, 'end']];
  // the shops along the bridge: irregular, colored, hanging out over the water on brackets
  const shops = [];
  for (let x = x0 + 4; x < x1 - 10; ) {
    const w = r.range(16, 30), h = r.range(26, 40), hang = r.chance(0.6) ? r.range(10, 22) : 0;
    if (x > 360 && x < 420) { x = 420; continue; } // the open loggia in the middle
    shops.push({ x, w, h, hang, col: r.pick(['#d89a4f', '#e0b267', '#c9763f', '#d8a879', '#b8643a', '#e6c48a']), sh: r.chance(0.5) });
    x += w;
  }
  p.group('river', { x: X0 - 10, y: 1110, w: x1 - X0 + 30, h: 240 }, (c) => {
    // the reflection in the water first
    c.fillStyle = 'rgba(80,60,40,.25)';
    c.fillRect(x0, water + 4, x1 - x0, 30);
    c.fillStyle = 'rgba(200,150,90,.2)';
    for (const s of shops) c.fillRect(s.x, water + 4, s.w - 2, 18);
    // the three arches: segmental, low, in pietraforte
    c.fillStyle = STONE;
    c.beginPath(); c.moveTo(x0 - 6, deck); c.lineTo(x1 + 6, deck); c.lineTo(x1 + 6, water + 4);
    for (let i = piers.length - 1; i > 0; i--) {
      const a = piers[i][0] - (i === piers.length - 1 ? 0 : 12), b = piers[i - 1][0] + (i - 1 === 0 ? 0 : 12), mid = (a + b) / 2;
      c.lineTo(a, water + 4); c.lineTo(a, deck + 30); c.quadraticCurveTo(mid, deck + 4, b, deck + 30); c.lineTo(b, water + 4);
    }
    c.lineTo(x0 - 6, water + 4); c.closePath(); c.fill();
    // the voussoirs around each arch, and the cutwaters
    c.strokeStyle = STONE_D; c.lineWidth = 1.4;
    for (let i = 1; i < piers.length; i++) {
      const a = piers[i][0] - (i === piers.length - 1 ? 0 : 12), b = piers[i - 1][0] + (i - 1 === 0 ? 0 : 12), mid = (a + b) / 2;
      c.beginPath(); c.moveTo(a, deck + 30); c.quadraticCurveTo(mid, deck + 4, b, deck + 30); c.stroke();
      for (let k = 1; k < 10; k++) { const u = k / 10, xx = lerp(b, a, u), yy = (1 - u) ** 2 * (deck + 30) + 2 * u * (1 - u) * (deck + 4) + u * u * (deck + 30); c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy - 6); c.stroke(); }
    }
    for (const [px, kind] of piers) if (kind === 'pier') { c.fillStyle = STONE_L; c.beginPath(); c.moveTo(px - 12, water + 4); c.lineTo(px - 12, deck + 34); c.lineTo(px, deck + 26); c.lineTo(px + 12, deck + 34); c.lineTo(px + 12, water + 4); c.fill(); c.fillStyle = STONE_D; c.fillRect(px + 4, deck + 32, 8, water - deck - 28); }
    // the dark under the arches
    c.fillStyle = 'rgba(40,40,30,.35)';
    for (let i = 1; i < piers.length; i++) { const a = piers[i][0] - 12, b = piers[i - 1][0] + 12; c.fillRect(b, water - 2, a - b, 6); }
    c.fillStyle = STONE_L; c.fillRect(x0 - 6, deck - 3, x1 - x0 + 12, 5);
  }, { t, d: 1.0, reveal: 'rise' });
  p.group('river', { x: X0 - 10, y: 1110, w: x1 - X0 + 30, h: 160 }, (c) => {
    // the shops, each with its window, shutters and tile roof, some on wooden brackets
    for (const s of shops) {
      const y = deck - 2;
      if (s.hang) { c.strokeStyle = '#5a3d24'; c.lineWidth = 2; c.beginPath(); c.moveTo(s.x + 3, y + 22); c.lineTo(s.x + s.w / 2, y + 2); c.moveTo(s.x + s.w - 3, y + 22); c.lineTo(s.x + s.w / 2, y + 2); c.stroke(); c.fillStyle = s.col; c.fillRect(s.x, y - 4, s.w - 1, 12); }
      c.fillStyle = s.col; c.fillRect(s.x, y - s.h, s.w - 1, s.h);
      c.fillStyle = mix(s.col, '#4a3020', 0.25); c.fillRect(s.x + s.w - 4, y - s.h, 3, s.h);
      c.fillStyle = s.sh ? SHUTTER : '#4b3626'; c.fillRect(s.x + s.w * 0.25, y - s.h * 0.72, s.w * 0.4, s.h * 0.3);
      c.fillStyle = TERRA; c.beginPath(); c.moveTo(s.x - 1, y - s.h); c.lineTo(s.x + s.w, y - s.h); c.lineTo(s.x + s.w - 2, y - s.h - 7); c.lineTo(s.x + 1, y - s.h - 7); c.fill();
    }
    // the loggia in the middle: three arches open to the river
    c.fillStyle = STONE_L; c.fillRect(360, deck - 40, 60, 40);
    c.fillStyle = INK; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(366 + k * 18, deck - 4); c.lineTo(366 + k * 18, deck - 26); c.arc(372 + k * 18, deck - 26, 6, Math.PI, 0); c.lineTo(378 + k * 18, deck - 4); c.fill(); }
    // Vasari's corridor on top, with its little round windows
    const cy = deck - 62;
    c.fillStyle = '#e6d2a6'; c.fillRect(x0, cy - 18, x1 - x0, 20);
    c.fillStyle = TERRA; c.fillRect(x0 - 2, cy - 24, x1 - x0 + 4, 6);
    c.fillStyle = INK; for (let x = x0 + 10; x < x1 - 6; x += 17) { c.beginPath(); c.arc(x, cy - 8, 3.2, 0, Math.PI * 2); c.fill(); }
  }, { t: t + 0.7, d: 0.9, reveal: 'rise' });
}
function grazie(p, t) {
  // a lower, plainer bridge downstream on the right, on its stone piers
  const deck = 1262, water = 1300;
  p.group('river', { x: 900, y: deck - 10, w: X1 - 900 + 10, h: 60 }, (c) => {
    c.fillStyle = 'rgba(80,60,40,.18)'; c.fillRect(910, water + 2, X1 - 910, 16);
    c.fillStyle = '#c4ad86'; c.fillRect(910, deck, X1 - 910, 8);
    c.fillStyle = STONE_D; c.fillRect(910, deck - 4, X1 - 910, 4);
    for (let x = 940; x < X1; x += 96) { c.fillStyle = '#b39b74'; c.fillRect(x, deck + 8, 18, water - deck - 6); c.fillStyle = STONE_D; c.fillRect(x + 12, deck + 8, 6, water - deck - 6); }
    c.fillStyle = INK; for (let x = 920; x < X1; x += 9) c.fillRect(x, deck - 9, 1.2, 5);
  }, { t, d: 0.9, reveal: 'wipeL' });
}

// ================================================================ the slope of San Miniato
function cypress(c, x, y, h, w) {
  c.fillStyle = CYP;
  c.beginPath(); c.moveTo(x - w * 0.3, y);
  c.bezierCurveTo(x - w * 0.62, y - h * 0.3, x - w * 0.5, y - h * 0.7, x, y - h);
  c.bezierCurveTo(x + w * 0.5, y - h * 0.7, x + w * 0.62, y - h * 0.3, x + w * 0.3, y);
  c.closePath(); c.fill();
}
function slope(p, r) {
  const NB = 1336;
  // the Oltrarno: a row of tall houses along the near bank, seen from above and behind
  const row = [];
  for (const [yy, s] of [[NB + 14, 1.5], [NB + 34, 1.75]]) {
    for (let x = X0 - 20; x < X1 + 10;) {
      const w = r.range(22, 38) * s, ht = r.range(16, 26) * s;
      row.push({ x, y: yy + r.range(-2, 2), w, ht, d: r.range(12, 16) * s, wall: r.pick(PLASTER), roof: r.pick([TERRA, TERRA_L, '#c4683e', '#a94f2e']), win: true, shut: r.chance(0.5), rows: 2, cols: Math.max(1, Math.round(w / 12)), chim: r.chance(0.35) });
      x += w + r.range(0, 4);
    }
  }
  p.group('near', { x: X0, y: NB - 80, w: X1 - X0, h: 130 }, (c) => {
    c.fillStyle = '#cdb58c'; c.fillRect(X0, NB - 4, X1 - X0, 8);
    c.fillStyle = 'rgba(80,60,40,.35)'; c.fillRect(X0, NB + 3, X1 - X0, 2);
    for (const h of row) {
      house(c, h);
      if (h.chim) { c.fillStyle = mix(h.wall, '#6b5040', 0.2); c.fillRect(h.x + h.w * 0.6, h.y - h.ht - h.d * 0.9, 5, 10); c.fillStyle = TERRA_D; c.fillRect(h.x + h.w * 0.6 - 1.5, h.y - h.ht - h.d * 0.9 - 3, 8, 3); }
    }
  }, { t: 8.8, d: 0.9, reveal: 'rise' });
  // the hillside: green, worked in short strokes, a road climbing it with its wall
  const hill = [[X0 - 10, 1386], [400, 1378], [700, 1392], [1000, 1380], [1300, 1388], [X1 + 10, 1382], [X1 + 10, YB + 10], [X0 - 10, YB + 10]];
  const hatch = [];
  for (let i = 0; i < 700; i++) { const x = r.range(X0, X1), y = r.range(1390, YB); hatch.push([[x, y], [x + 4, y - 6]]); }
  p.group('near', boxOf(hill, 4), (c) => {
    const g = c.createLinearGradient(0, 1360, 0, YB);
    g.addColorStop(0, GRASS); g.addColorStop(1, GRASS_D);
    c.fillStyle = g; poly(c, hill); c.fill();
    c.strokeStyle = 'rgba(60,80,40,.25)'; c.lineWidth = 1.2;
    c.beginPath(); for (const [[a, b], [d, e]] of hatch) { c.moveTo(a, b); c.lineTo(d, e); } c.stroke();
    // the road, pale, with its low wall
    c.strokeStyle = '#e3d3ae'; c.lineWidth = 16; c.lineCap = 'round';
    c.beginPath(); c.moveTo(X0 - 10, 1446); c.bezierCurveTo(560, 1406, 900, 1456, X1 + 10, 1400); c.stroke();
    c.strokeStyle = '#b9a47c'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(X0 - 10, 1437); c.bezierCurveTo(560, 1397, 900, 1447, X1 + 10, 1391); c.stroke();
  }, { t: 9.1, d: 1.0, reveal: 'rise' });
  // olive trees in rows on the slope, silver green, with the light on top
  const olives = [];
  for (let i = 0; i < 40; i++) { const y = r.range(1400, YB - 30); olives.push([r.range(X0 + 30, X1 - 30), y, lerp(10, 26, (y - 1400) / 70)]); }
  olives.sort((a, b) => a[1] - b[1]);
  const ob = [];
  for (const [x, y, s] of olives) { const bl = []; for (let k = 0; k < 5; k++) bl.push([x + r.range(-0.7, 0.7) * s, y - s * 0.9 + r.range(-0.4, 0.3) * s, s * r.range(0.4, 0.6)]); ob.push([x, y, s, bl]); }
  for (let half = 0; half < 2; half++) {
    const these = ob.filter((o, i) => i % 2 === half);
    p.group('near', { x: X0, y: 1340, w: X1 - X0, h: YB - 1340 + 6 }, (c) => {
      for (const [x, y, s, bl] of these) {
        c.fillStyle = '#5a4630'; c.fillRect(x - 1.5, y - s * 0.5, 3, s * 0.5);
        c.fillStyle = OLIVE_D; c.beginPath(); for (const [bx, by, br] of bl) { c.moveTo(bx + br + 1, by + 1); c.arc(bx + 1, by + 1, br, 0, Math.PI * 2); } c.fill();
        c.fillStyle = OLIVE; c.beginPath(); for (const [bx, by, br] of bl) { c.moveTo(bx + br * 0.8 - 1, by - 1); c.arc(bx - 1, by - 1, br * 0.8, 0, Math.PI * 2); } c.fill();
        c.fillStyle = 'rgba(230,235,210,.55)'; c.beginPath(); for (const [bx, by, br] of bl) { c.moveTo(bx + br * 0.3 - 2, by - br * 0.4); c.arc(bx - 2, by - br * 0.4, br * 0.3, 0, Math.PI * 2); } c.fill();
      }
    }, { t: 9.5 + half * 0.3, d: 0.7, reveal: 'pop' });
  }
  // the tall cypresses that frame the view, rising from the slope
  const cyps = [[214, 1500, 470, 56], [272, 1500, 360, 44], [318, 1500, 250, 34], [1390, 1500, 500, 58], [1334, 1500, 380, 46], [1290, 1500, 270, 36], [1060, 1440, 120, 20], [1100, 1445, 150, 24], [610, 1450, 110, 18]];
  cyps.forEach(([x, y, h, w], i) => {
    const strokes = [];
    const rr = rng(400 + i);
    for (let k = 0; k < h / 2.2; k++) { const u = rr(), yy = y - u * h * 0.96, hw = w * 0.45 * Math.sin(Math.min(1, (1 - u) * 1.3) * Math.PI * 0.55); const xx = x + rr.range(-hw, hw * 0.6); strokes.push([[xx, yy], [xx + 3, yy - 7]]); }
    p.group('near', { x: x - w, y: y - h - 6, w: 2 * w, h: h + 12 }, (c) => {
      c.fillStyle = 'rgba(30,40,20,.3)'; c.beginPath(); c.ellipse(x + w * 0.4, y, w * 0.6, 5, 0, 0, Math.PI * 2); c.fill();
      cypress(c, x, y, h, w);
      c.strokeStyle = CYP_L; c.lineWidth = 1.5;
      c.beginPath(); for (const [[a, b], [d, e]] of strokes) { c.moveTo(a, b); c.lineTo(d, e); } c.stroke();
    }, { t: 9.9 + i * 0.12, d: 1.1, reveal: 'rise', ease: 'out' });
  });
  // three travelers on the road, in vermilion, lapis and ochre
  p.group('near', { x: 640, y: 1395, w: 140, h: 50 }, (c) => {
    for (const [x, y, col, s] of [[668, 1428, VERM, 1], [690, 1429, LAPIS, 0.95], [742, 1434, '#c9953c', 1.05]]) {
      c.fillStyle = col; c.beginPath(); c.moveTo(x - 4 * s, y); c.lineTo(x - 2.5 * s, y - 14 * s); c.lineTo(x + 2.5 * s, y - 14 * s); c.lineTo(x + 4 * s, y); c.fill();
      c.fillStyle = '#e9c9a5'; c.beginPath(); c.arc(x, y - 17 * s, 2.6 * s, 0, Math.PI * 2); c.fill();
    }
  }, { t: 11.0, d: 0.6, reveal: 'fade' });
  // the stone balustrade of the terrace the painter stood on
  p.group('near', { x: X0, y: 1450, w: X1 - X0, h: YB - 1450 + 4 }, (c) => {
    c.fillStyle = PIETRA; c.fillRect(X0, 1462, X1 - X0, 12);
    c.fillStyle = '#b3ad9c'; c.fillRect(X0, 1458, X1 - X0, 6);
    for (let x = X0 + 8; x < X1; x += 26) {
      c.fillStyle = '#a9a391';
      c.beginPath(); c.moveTo(x, 1474); c.bezierCurveTo(x - 9, 1482, x - 9, 1490, x - 3, YB - 6); c.lineTo(x + 3, YB - 6); c.bezierCurveTo(x + 9, 1490, x + 9, 1482, x, 1474); c.fill();
      c.fillStyle = 'rgba(70,60,50,.35)'; c.fillRect(x + 1, 1478, 3, YB - 1484);
    }
    c.fillStyle = PIETRA; c.fillRect(X0, YB - 8, X1 - X0, 8);
    c.fillStyle = 'rgba(60,50,40,.4)'; c.fillRect(X0, 1472, X1 - X0, 2);
  }, { t: 11.2, d: 0.9, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ life
function life(p, r) {
  // swallows wheeling over the roofs
  const sw = [];
  for (let i = 0; i < 9; i++) sw.push([r.range(400, 1250), r.range(620, 880), r.range(50, 140), r.range(0.25, 0.5) * (r.chance(0.5) ? 1 : -1), r() * 7, r.range(0.8, 1.2)]);
  p.live('life', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#2a2420';
      for (const [x0, y0, rx, w, ph, s] of sw) {
        const a = time * w + ph, x = x0 + Math.cos(a) * rx, y = y0 + Math.sin(a * 1.3) * rx * 0.35;
        const fl = Math.sin(time * 9 + ph * 5) * 0.5 + 0.5, dir = Math.sign(-Math.sin(a) * w) || 1;
        c.beginPath();
        c.moveTo(x + dir * 5 * s, y);
        c.lineTo(x - dir * 2 * s, y - (3 + fl * 5) * s); c.lineTo(x - dir * 7 * s, y - (4 + fl * 6) * s);
        c.lineTo(x - dir * 3 * s, y);
        c.lineTo(x - dir * 7 * s, y + (4 - fl * 2) * s); c.lineTo(x - dir * 2 * s, y + (3 - fl) * s);
        c.closePath(); c.fill();
      }
    },
  });
  // a boatman poling his barchetto slowly down the Arno, and back
  p.live('life', {
    t: 9.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const k = time - 9.2, span = X1 - 640;
      const u = (k * 0.035) % 2, f = u < 1 ? u : 2 - u, dir = u < 1 ? 1 : -1;
      const x = 640 + f * span * 0.75, y = 1310 + Math.sin(time * 1.4) * 0.8;
      c.fillStyle = 'rgba(60,50,30,.25)'; c.fillRect(x - 30, y + 3, 60, 3);
      c.fillStyle = '#5a3a22'; c.beginPath(); c.moveTo(x - 32, y - 6); c.lineTo(x + 32, y - 6); c.lineTo(x + 24, y + 2); c.lineTo(x - 24, y + 2); c.fill();
      c.fillStyle = VERM; c.fillRect(x - 4 * dir - 3, y - 22, 7, 16);
      c.fillStyle = '#e9c9a5'; c.beginPath(); c.arc(x - 4 * dir, y - 25, 3.2, 0, Math.PI * 2); c.fill();
      const sw2 = Math.sin(time * 0.9) * 6;
      c.strokeStyle = '#4a3220'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x - 4 * dir + 2, y - 30); c.lineTo(x - dir * 22 + sw2, y + 10); c.stroke();
      // ripples behind it
      c.strokeStyle = 'rgba(235,240,220,.6)'; c.lineWidth = 1.2;
      c.beginPath(); for (let j = 1; j < 4; j++) { c.moveTo(x - dir * (34 + j * 12), y + j); c.lineTo(x - dir * (44 + j * 12), y + j); } c.stroke();
    },
  });
  // the banner on the Palazzo Vecchio's staff, stirring
  p.live('life', {
    t: 8.0, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      const x = 548, y = 730;
      c.fillStyle = VERM;
      c.beginPath(); c.moveTo(x, y);
      for (let k = 0; k <= 6; k++) c.lineTo(x + k * 4.5, y + Math.sin(time * 3 + k * 0.8) * 2 * (k / 6));
      for (let k = 6; k >= 0; k--) c.lineTo(x + k * 4.5, y + 12 + Math.sin(time * 3 + k * 0.8 + 0.4) * 2 * (k / 6));
      c.closePath(); c.fill();
      c.fillStyle = '#f6efe0'; c.fillRect(x + 8, y + 4 + Math.sin(time * 3 + 1.6) * 0.6, 6, 4);
    },
  });
  // the sun catching the water: a few flecks of light, coming and going
  const fl = [];
  for (let i = 0; i < 40; i++) fl.push([r.range(620, X1 - 10), r.range(RY0 + 8, RY1 - 6), r() * 7, r.range(6, 18)]);
  p.live('life', {
    t: 8.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#f7f1dc';
      for (const [x, y, ph, L] of fl) { const a = Math.sin(time * 1.6 + ph * 3); if (a < 0.4) continue; c.globalAlpha = (a - 0.4) * 1.4; c.fillRect(x, y, L, 1.6); }
      c.globalAlpha = 1;
    },
  });
}

// ================================================================ age: the fine cracks of old tempera
function craquelure(p, r) {
  const cracks = [];
  for (let i = 0; i < 260; i++) {
    let x = r.range(X0, X1), y = r.range(AC - R + 40, YB), a = r() * Math.PI * 2;
    const pts = [[x, y]];
    const n = r.int(3, 8);
    for (let k = 0; k < n; k++) { a += r.range(-0.9, 0.9); const L = r.range(8, 26); x += Math.cos(a) * L; y += Math.sin(a) * L; pts.push([x, y]); }
    cracks.push(pts);
  }
  p.strokes('crack', cracks, 'rgba(70,45,25,.16)', 0.8, { t: 12.6, d: 1.2, reveal: 'fade', box: { x: X0, y: AC - R, w: X1 - X0, h: YB - AC + R } });
  // the varnish, gone a little warm with age, over the whole painting
  p.group('crack', { x: X0, y: AC - R, w: X1 - X0, h: YB - AC + R }, (c) => {
    c.fillStyle = 'rgba(190,150,70,.07)'; c.fillRect(X0, AC - R, X1 - X0, YB - AC + R);
  }, { t: 12.9, d: 1.0, reveal: 'fade' });
}

// ================================================================ the predella and the title
function title(p, r) {
  const x0 = X0 - 40, x1 = X1 + 40;
  // the predella: a lapis panel in a gold frame
  p.group('title', { x: x0 - 10, y: PY0 - 10, w: x1 - x0 + 20, h: PY1 - PY0 + 20 }, (c) => {
    c.fillStyle = GOLD_K; c.fillRect(x0, PY0, x1 - x0, PY1 - PY0);
    const g = c.createLinearGradient(0, PY0, 0, PY1);
    g.addColorStop(0, LAPIS_D); g.addColorStop(0.5, LAPIS); g.addColorStop(1, LAPIS_D);
    c.fillStyle = g; c.fillRect(x0 + 8, PY0 + 8, x1 - x0 - 16, PY1 - PY0 - 16);
    c.strokeStyle = GOLD_L; c.lineWidth = 3; c.strokeRect(x0 + 18, PY0 + 18, x1 - x0 - 36, PY1 - PY0 - 36);
    c.strokeStyle = GOLD_D; c.lineWidth = 1.5; c.strokeRect(x0 + 25, PY0 + 25, x1 - x0 - 50, PY1 - PY0 - 50);
    // a scatter of small gold stars in the blue, as in a painted vault
    c.fillStyle = 'rgba(240,210,124,.5)';
    for (const [sx, sy] of PSTARS) star(c, sx, sy, 4);
  }, { t: 10.2, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // a quatrefoil at each end, with the lily in gold
  for (const s of [-1, 1]) {
    const qx = s < 0 ? x0 + 120 : x1 - 120, qy = (PY0 + PY1) / 2;
    p.group('title', { x: qx - 80, y: qy - 80, w: 160, h: 160 }, (c) => {
      c.fillStyle = GOLD_D; quatrefoil(c, qx, qy, 64); c.fill();
      c.fillStyle = VERM_D; quatrefoil(c, qx, qy, 58); c.fill();
      c.fillStyle = VERM; quatrefoil(c, qx, qy, 52); c.fill();
      giglio(c, qx, qy + 4, 0.72, GOLD_L);
    }, { t: 10.6 + (s > 0 ? 0.2 : 0), d: 0.7, reveal: 'pop' });
  }
  // FIRENZE, in gold capitals
  p.type('title', 'FIRENZE', CX, 1762, {
    family: '"EB Garamond", serif', weight: 600, size: 196, color: GOLD_L, shadow: '#0c1838', sx: 4, sy: 5,
    align: 'center', track: 0.16, t: 11.0, gap: 0.16, d: 0.8, fit: 820,
  });
  p.type('title', 'Veduta dal colle di San Miniato al Monte', CX, 1823, {
    family: '"EB Garamond", serif', style: 'italic', weight: 400, size: 38, color: '#e9d39a',
    align: 'center', track: 0.02, t: 12.2, gap: 0.02, d: 0.5, reveal: 'fade',
  });
  p.type('title', 'MCDXXXVI · TEMPERA E ORO SU TAVOLA', CX, 1906, {
    family: '"EB Garamond", serif', weight: 500, size: 24, color: '#4a3412',
    align: 'center', track: 0.3, t: 13.0, gap: 0.015, d: 0.5, reveal: 'fade',
  });
}
const PSTARS = (() => { const r = rng(17); const a = []; for (let i = 0; i < 40; i++) { const x = r.range(X0 + 10, X1 - 10), y = r.range(PY0 + 34, PY1 - 34); if (Math.abs(x - CX) < 460 && y > PY0 + 60) continue; a.push([x, y]); } return a; })();
function quatrefoil(c, x, y, rr) {
  c.beginPath();
  const k = rr * 0.42;
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; c.moveTo(x + Math.cos(a) * k + rr * 0.58, y + Math.sin(a) * k); c.arc(x + Math.cos(a) * k, y + Math.sin(a) * k, rr * 0.58, 0, Math.PI * 2); }
}
