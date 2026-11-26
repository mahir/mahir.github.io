// Moscow: a Constructivist poster, red and black on cream. Everything stands on a
// grid tilted twelve degrees: the Kremlin wall runs uphill across the sheet, the
// Spasskaya Tower leans out of it in front of a black disc, the Shukhov radio
// tower is drawn in thin black lattice over a red wedge. St. Basil's is pasted
// on as a halftone photograph cut out with scissors, and the bell tower of Ivan
// the Great sits in a round photo crop. Tiny figures cross Red Square under it.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, lerp, clamp, poly } from '../kit.js';

const PAPER = '#ece1c6', CREAM = '#f5eedb', RED = '#cc2a1e', RED_D = '#9c1f17', INK = '#1a1716';
const RED_L = '#e0533f', STONE = '#efe5cc';

const TITLE = '"Russo One", sans-serif';
// the twenty towers of the Kremlin wall, set in a list under the name
const TOWERS = ['СПАССКАЯ', 'ЦАРСКАЯ', 'НАБАТНАЯ', 'КОНСТАНТИНО-ЕЛЕНИНСКАЯ', 'БЕКЛЕМИШЕВСКАЯ', 'ПЕТРОВСКАЯ', '2-Я БЕЗЫМЯННАЯ',
  '1-Я БЕЗЫМЯННАЯ', 'ТАЙНИЦКАЯ', 'БЛАГОВЕЩЕНСКАЯ', 'ВОДОВЗВОДНАЯ', 'БОРОВИЦКАЯ', 'ОРУЖЕЙНАЯ', 'КОМЕНДАНТСКАЯ', 'ТРОИЦКАЯ',
  'КУТАФЬЯ', 'СРЕДНЯЯ АРСЕНАЛЬНАЯ', 'УГЛОВАЯ АРСЕНАЛЬНАЯ', 'НИКОЛЬСКАЯ', 'СЕНАТСКАЯ'];
const WORDS = 'МОСКВА MOSCOW КРАСНАЯ ПЛОЩАДЬ КРЕМЛЬ ШАБОЛОВКА ИВАН ВЕЛИКИЙ ХРАМ ВАСИЛИЯ БЛАЖЕННОГО БАШНИ КРЕМЛЯ ГОД ОСНОВАНИЯ 0123456789·';

export const city = {
  id: 'moscow', name: 'Moscow', wall: '#2b1513',
  alt: "A Constructivist poster in red and black: the Spasskaya Tower and the Kremlin wall on a slanting grid in front of a black disc, the Shukhov radio tower over a red wedge, St. Basil's Cathedral pasted on as a halftone photograph, the bell tower of Ivan the Great in a round crop, and small figures crossing Red Square",
  google: 'family=Russo+One',
  fonts: [['400 100px "Russo One"', WORDS + TOWERS.join(' ')]],
  build,
};

// the slanted frame: X runs uphill along the wall, Y down across it
const ANG = -12 * Math.PI / 180, CA = Math.cos(ANG), SA = Math.sin(ANG), OX = 800, OY = 1000;
const toS = (X, Y) => [OX + X * CA - Y * SA, OY + X * SA + Y * CA];
const inF = (c) => { c.translate(OX, OY); c.rotate(ANG); };
function boxF(x, y, w, h, pad = 8) {
  return boxOf([toS(x, y), toS(x + w, y), toS(x + w, y + h), toS(x, y + h)], pad);
}

// the ground line of the square, the wall, the Spasskaya Tower's foot
const GY = 230, WALL_TOP = 92, TX = -20;

function build() {
  const p = new Plate({ paper: PAPER, seed: 1147 });
  const r = p.r;
  p.stack('grid', 'wedge', 'disc', 'shukhov', 'waves', 'inset', 'birds', 'senate', 'wall', 'merlons', 'band',
    'crowd', 'spass', 'clock', 'titleband', 'cutout', 'basil', 'dots', 'title', 'type');

  grid(p, r);
  shapes(p, r);
  shukhov(p);
  inset(p);
  wall(p, r);
  senate(p);
  spasskaya(p);
  crowd(p, r);
  basil(p);
  life(p, r);
  title(p);
  return p;
}

// a mark in the slanted frame, revealed along it: up, down, right, left, drop or fade
function fm(p, layer, R, draw, o) {
  const dir = o.dir || 'up';
  return p.mark(layer, {
    t: o.t, d: o.d ?? 0.8, ease: o.ease || 'out', reveal: dir === 'fade' ? 'fade' : 'draw', box: boxF(R.x, R.y, R.w, R.h, 10),
    draw: (c, q) => {
      c.save(); inF(c);
      if (q < 1 && dir !== 'fade') {
        const pd = 10;
        c.beginPath();
        if (dir === 'up') c.rect(R.x - pd, R.y + R.h * (1 - q) - pd, R.w + 2 * pd, R.h * q + 2 * pd);
        else if (dir === 'down') c.rect(R.x - pd, R.y - pd, R.w + 2 * pd, R.h * q + 2 * pd);
        else if (dir === 'right') c.rect(R.x - pd, R.y - pd, R.w * q + 2 * pd, R.h + 2 * pd);
        else if (dir === 'left') c.rect(R.x + R.w * (1 - q) - pd, R.y - pd, R.w * q + 2 * pd, R.h + 2 * pd);
        else c.rect(R.x - 2000, R.y - 2000, R.w + 4000, R.h + 4000);
        c.clip();
        if (dir === 'drop') { c.translate(0, -36 * (1 - q)); c.globalAlpha *= Math.min(1, q * 2.5); }
      }
      draw(c, q);
      c.restore();
    },
  });
}

// a screen of round dots over a rectangle, their size from a tone function (0 paper, 1 ink)
function dotRect(c, x0, y0, x1, y1, step, tone) {
  c.beginPath();
  for (let y = y0 + step / 2, j = 0; y < y1; y += step * 0.5, j++) {
    for (let x = x0 + (j % 2 ? step / 2 : 0) + step / 4; x < x1; x += step) {
      const T = tone(x, y);
      if (T <= 0.02) continue;
      const rr = step * 0.36 * Math.sqrt(T) * 1.15;
      c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2);
    }
  }
  c.fill();
}

// a halftone photograph: paint a gray picture into a hidden canvas, then turn
// it into dots on a screen at 45 degrees. Returns flat [x, y, r, ...] in its box.
function screen(w, h, paint, step = 6.5, gain = 1.12) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d', { willReadFrequently: true });
  paint(c);
  const d = c.getImageData(0, 0, w, h).data;
  const out = [];
  const ca = Math.SQRT1_2, R = Math.hypot(w, h) / step + 2;
  for (let i = -R; i < R; i++) for (let j = -R; j < R; j++) {
    const x = w / 2 + (i - j) * ca * step, y = h / 2 + (i + j) * ca * step;
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const k = 4 * ((y | 0) * w + (x | 0));
    if (d[k + 3] < 140) continue;
    const T = 1 - (d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11) / 255;
    const rr = step * 0.5 * Math.sqrt(T) * gain;
    if (rr > 0.45) out.push(x, y, rr);
  }
  return { dots: out, cv };
}
function drawDots(c, dots, ox, oy, y0 = -1e9, y1 = 1e9) {
  c.beginPath();
  for (let i = 0; i < dots.length; i += 3) {
    const y = dots[i + 1];
    if (y < y0 || y >= y1) continue;
    const x = dots[i] + ox, rr = dots[i + 2];
    c.moveTo(x + rr, y + oy); c.arc(x, y + oy, rr, 0, Math.PI * 2);
  }
  c.fill();
}
const gray = (v) => { const n = Math.round(clamp(v) * 255); return `rgb(${n},${n},${n})`; };

// ================================================================ the grid
function grid(p, r) {
  // thin rules in both directions of the slanted frame
  const along = [], across = [];
  for (let Y = -1500; Y <= 1500; Y += 125) along.push([toS(-1400, Y), toS(1400, Y)]);
  for (let X = -1400; X <= 1400; X += 125) across.push([toS(X, -1500), toS(X, 1500)]);
  p.strokes('grid', along, 'rgba(26,23,22,.13)', 1.3, { t: 0.15, d: 1.2, reveal: 'fall', ease: 'inOut', box: { x: 0, y: 0, w: W, h: H } });
  p.strokes('grid', across, 'rgba(26,23,22,.13)', 1.3, { t: 0.45, d: 1.2, reveal: 'wipe', ease: 'inOut', box: { x: 0, y: 0, w: W, h: H } });
  // registration ticks where some rules cross, like a layout sheet
  const ticks = [];
  for (let i = 0; i < 26; i++) {
    const X = -1250 + 125 * r.int(0, 20), Y = -1125 + 125 * r.int(0, 18);
    const [a, b] = [toS(X - 9, Y), toS(X + 9, Y)], [cc, d] = [toS(X, Y - 9), toS(X, Y + 9)];
    ticks.push([a, b], [cc, d]);
  }
  p.strokes('grid', ticks, 'rgba(26,23,22,.5)', 1.6, { t: 1.2, d: 0.6, reveal: 'fade' });
}

// ================================================================ wedge, disc and bars
function shapes(p, r) {
  // the red wedge, from the left edge toward the disc
  const wedge = [[-10, 250], [-10, 860], [700, 610]];
  p.mark('wedge', {
    t: 0.6, d: 1.1, reveal: 'wipe', ease: 'inOut', box: boxOf(wedge, 6),
    draw: (c) => {
      c.fillStyle = RED; poly(c, wedge); c.fill();
    },
  });
  // the black disc behind the tower's clock
  const dx = 760, dy = 600, dr = 300;
  p.mark('disc', {
    t: 0.95, d: 1.1, reveal: 'iris', ease: 'inOut', box: { x: dx - dr - 4, y: dy - dr - 4, w: 2 * dr + 8, h: 2 * dr + 8 },
    draw: (c) => {
      c.fillStyle = INK; c.beginPath(); c.arc(dx, dy, dr, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(245,238,219,.22)'; c.lineWidth = 1.4;
      c.beginPath(); c.arc(dx, dy, dr - 16, Math.PI * 0.9, Math.PI * 1.6); c.stroke();
    },
  });
  // a thin red ring, off center, for the eye to swing on
  p.pen('disc', ringPts(dx + 36, dy - 30, dr + 46, 90), RED, 3, { t: 1.5, d: 1.4 });
  // heavy black bars, as in a layout
  fm(p, 'disc', { x: 560, y: -850, w: 560, h: 30 }, (c) => { c.fillStyle = INK; c.fillRect(560, -850, 560, 30); }, { t: 1.4, d: 0.7, dir: 'right' });
  fm(p, 'disc', { x: 620, y: -806, w: 300, h: 10 }, (c) => { c.fillStyle = RED; c.fillRect(620, -806, 300, 10); }, { t: 1.6, d: 0.6, dir: 'right' });
}
function ringPts(cx, cy, rr, n) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return out;
}

// ================================================================ the Shukhov tower
// six stacked hyperboloids of straight steel, each narrower than the last
const SH = { cx: 250, base: 1190, rings: [150, 120, 95, 75, 59, 47, 38], hs: 148, tw: 1.05, n: 22 };
function shukhov(p) {
  const { cx, base, rings, hs, tw, n } = SH;
  for (let s = 0; s < 6; s++) {
    const yb = base - s * hs, yt = yb - hs, R0 = rings[s], R1 = rings[s + 1];
    const e = 0.13;
    const front = [], back = [];
    for (const dir of [1, -1]) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const b = a + dir * tw;
        const p0 = [cx + R0 * Math.cos(a), yb + R0 * e * Math.sin(a)], p1 = [cx + R1 * Math.cos(b), yt + R1 * e * Math.sin(b)];
        (Math.sin(a) + Math.sin(b) > 0 ? front : back).push([p0, p1]);
      }
    }
    // the rings: the waist of each hyperboloid, and its top and foot
    const ringLines = [];
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const rr = Math.sqrt((1 - t) ** 2 * R0 * R0 + t * t * R1 * R1 + 2 * t * (1 - t) * R0 * R1 * Math.cos(tw));
      const yy = lerp(yb, yt, t), pts = [];
      for (let k = 0; k <= 40; k++) { const a = (k / 40) * Math.PI * 2; pts.push([cx + rr * Math.cos(a), yy + rr * e * Math.sin(a)]); }
      ringLines.push(pts);
    }
    const bx = { x: cx - R0 - 8, y: yt - R1 * 0.2 - 8, w: 2 * R0 + 16, h: hs + R0 * 0.3 + 16 };
    p.mark('shukhov', {
      t: 1.5 + s * 0.36, d: 0.75, reveal: 'rise', ease: 'inOut', box: bx,
      draw: (c) => {
        c.lineCap = 'round';
        c.strokeStyle = 'rgba(26,23,22,.42)'; c.lineWidth = 1.1;
        c.beginPath(); for (const [a, b] of back) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
        c.strokeStyle = INK; c.lineWidth = 1.9;
        c.beginPath(); for (const [a, b] of front) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
        c.lineWidth = 1.5;
        c.beginPath(); for (const l of ringLines) { c.moveTo(l[0][0], l[0][1]); for (const q of l) c.lineTo(q[0], q[1]); } c.stroke();
        // the heavy rings where one section sits on the next
        c.lineWidth = 3.2;
        c.beginPath(); c.ellipse(cx, yt, R1, R1 * e, 0, 0, Math.PI * 2); c.stroke();
      },
    });
  }
  // the mast and its little platform
  const top = base - 6 * hs;
  p.mark('shukhov', {
    t: 3.7, d: 0.6, reveal: 'rise', box: { x: cx - 30, y: top - 80, w: 60, h: 84 },
    draw: (c) => {
      c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, top); c.lineTo(cx, top - 74); c.stroke();
      c.lineWidth = 1.4; c.beginPath();
      for (let k = 0; k < 4; k++) { c.moveTo(cx - 14 + k * 2, top - 16 - k * 14); c.lineTo(cx + 14 - k * 2, top - 16 - k * 14); }
      c.stroke();
      c.fillStyle = RED; c.beginPath(); c.arc(cx, top - 78, 5, 0, Math.PI * 2); c.fill();
    },
  });
  // a caption on the lattice
  // a caption up the left edge
  const cap = p.type('type', 'ШАБОЛОВКА · 1922', 54, 1180, { family: TITLE, size: 22, color: INK, track: 0.3, t: 4.0, gap: 0.03, d: 0.4, reveal: 'fade' });
  turn(cap, 54, 1180, -Math.PI / 2);
}

// ================================================================ the round crop: Ivan the Great
const IN = { cx: 1290, cy: 330, r: 200 };
function inset(p) {
  const { cx, cy, r: rr } = IN;
  const w = 2 * rr, h = 2 * rr;
  const { dots } = screen(w, h, (c) => {
    c.save(); c.beginPath(); c.arc(rr, rr, rr - 2, 0, Math.PI * 2); c.clip();
    // a pale sky, darker overhead
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, gray(0.4)); g.addColorStop(0.85, gray(0.76)); g.addColorStop(1, gray(0.7));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // the Assumption Cathedral's five domes to the left, lower, then the bell tower
    c.save(); c.translate(rr - 120, h - 6); c.scale(0.8, 0.8); assumption(c, 0, 0); c.restore();
    c.save(); c.translate(rr + 48, h + 16); c.scale(0.7, 0.7); ivan(c, 0, 0); c.restore();
    c.restore();
  }, 4.4, 1.12);
  p.mark('inset', {
    t: 6.0, d: 1.4, reveal: 'iris', ease: 'inOut', box: { x: cx - rr - 6, y: cy - rr - 6, w: 2 * rr + 12, h: 2 * rr + 12 },
    draw: (c) => {
      c.fillStyle = CREAM; c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.fill();
      c.fillStyle = INK; drawDots(c, dots, cx - rr, cy - rr);
    },
  });
  p.pen('inset', ringPts(cx, cy, rr + 9, 120), RED, 14, { t: 5.7, d: 1.0, cap: 'butt' });
  p.pen('inset', ringPts(cx, cy, rr + 22, 120), INK, 2, { t: 6.2, d: 1.0 });
  p.type('type', 'ИВАН ВЕЛИКИЙ', cx, cy + rr + 62, { family: TITLE, size: 24, color: INK, track: 0.3, align: 'center', t: 7.2, gap: 0.04, d: 0.4, reveal: 'fade' });
}
// the bell tower of Ivan the Great: white octagons stepping in, a gold dome
function ivan(c, x, g) {
  const tiers = [[0, 150, 64], [150, 250, 54], [250, 330, 44], [330, 372, 34]];
  for (const [h0, h1, hw] of tiers) {
    const y0 = g - h1, y1 = g - h0;
    // lit face, shaded face
    c.fillStyle = gray(0.99); c.fillRect(x - hw, y0, hw * 1.1, y1 - y0);
    c.fillStyle = gray(0.45); c.fillRect(x + hw * 0.1, y0, hw * 0.9, y1 - y0);
    // arched openings for the bells
    for (const ax of [-0.55, 0.45]) {
      const aw = hw * 0.36, ah = (y1 - y0) * 0.42, ay = y0 + (y1 - y0) * 0.22;
      c.fillStyle = gray(0.12);
      c.beginPath(); c.moveTo(x + ax * hw, ay + ah); c.lineTo(x + ax * hw, ay + aw / 2); c.arc(x + ax * hw + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0); c.lineTo(x + ax * hw + aw, ay + ah); c.fill();
    }
    // cornice
    c.fillStyle = gray(0.4); c.fillRect(x - hw - 4, y0 - 4, hw * 2 + 8, 6);
  }
  // drum and dome
  const dy = g - 372;
  c.fillStyle = gray(0.85); c.fillRect(x - 26, dy - 40, 52, 40);
  c.fillStyle = gray(0.5); c.fillRect(x + 6, dy - 40, 20, 40);
  const R = 36;
  onionPath(c, x, dy - 40, R, R * 1.7);
  const gg = c.createLinearGradient(x - R, 0, x + R, 0); gg.addColorStop(0, gray(0.45)); gg.addColorStop(0.35, gray(0.9)); gg.addColorStop(1, gray(0.15));
  c.fillStyle = gg; c.fill();
  c.fillStyle = gray(0.2); c.fillRect(x - 1.5, dy - 40 - R * 1.7 - 26, 3, 28);
}
function assumption(c, x, g) {
  c.fillStyle = gray(0.92); c.fillRect(x - 110, g - 150, 220, 150);
  c.fillStyle = gray(0.66); c.fillRect(x + 40, g - 150, 70, 150);
  for (let k = 0; k < 4; k++) { c.fillStyle = gray(0.3); c.fillRect(x - 96 + k * 52, g - 110, 12, 60); }
  // the zakomary: round gables along the top
  c.fillStyle = gray(0.85);
  for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x - 82 + k * 55, g - 150, 27, Math.PI, 0); c.fill(); }
  for (const [dx, R, hh] of [[0, 30, 90], [-62, 22, 60], [62, 22, 60], [-34, 20, 40], [34, 20, 40]]) {
    const dy = g - 170 - hh;
    c.fillStyle = gray(0.8); c.fillRect(x + dx - R * 0.6, dy, R * 1.2, hh + 20);
    c.fillStyle = gray(0.45); c.fillRect(x + dx + R * 0.1, dy, R * 0.5, hh + 20);
    onionPath(c, x + dx, dy, R, R * 1.7);
    const gg = c.createLinearGradient(x + dx - R, 0, x + dx + R, 0); gg.addColorStop(0, gray(0.42)); gg.addColorStop(0.35, gray(0.9)); gg.addColorStop(1, gray(0.15));
    c.fillStyle = gg; c.fill();
  }
}

// ================================================================ onion domes
// the outline's half width at height t (0 at the neck, 1 at the tip)
const onionF = (t) => (t < 0.33 ? 0.56 + 0.44 * Math.sin((t / 0.33) * Math.PI / 2) : Math.cos(((t - 0.33) / 0.67) * Math.PI / 2) ** 1.5);
function onionPath(c, cx, base, R, Hd) {
  c.beginPath();
  for (let i = 0; i <= 40; i++) { const t = i / 40; c.lineTo(cx - R * onionF(t), base - t * Hd); }
  for (let i = 40; i >= 0; i--) { const t = i / 40; c.lineTo(cx + R * onionF(t), base - t * Hd); }
  c.closePath();
}

// ================================================================ the Kremlin wall
const WX0 = -1300, WX1 = 1150;
function wall(p, r) {
  // the brick body
  fm(p, 'wall', { x: WX0, y: WALL_TOP, w: WX1 - WX0, h: GY - WALL_TOP }, (c) => {
    c.fillStyle = RED; c.fillRect(WX0, WALL_TOP, WX1 - WX0, GY - WALL_TOP);
    // courses
    c.strokeStyle = 'rgba(80,14,10,.28)'; c.lineWidth = 1;
    c.beginPath();
    for (let y = WALL_TOP + 9; y < GY; y += 9) { c.moveTo(WX0, y); c.lineTo(WX1, y); }
    c.stroke();
    // a cornice of white stone, and the shadow under the walkway
    c.fillStyle = RED_D; c.fillRect(WX0, WALL_TOP, WX1 - WX0, 14);
    c.fillStyle = INK; dotRect(c, WX0, WALL_TOP + 14, WX1, WALL_TOP + 52, 7, (x, y) => 0.55 * (1 - (y - WALL_TOP - 14) / 38));
    // blind arches along the foot
    c.fillStyle = RED_D;
    for (let x = WX0 + 40; x < WX1; x += 110) { c.beginPath(); c.moveTo(x, GY); c.lineTo(x, GY - 40); c.arc(x + 30, GY - 40, 30, Math.PI, 0); c.lineTo(x + 60, GY); c.fill(); }
  }, { t: 2.5, d: 1.3, dir: 'right', ease: 'inOut' });

  // the swallowtail merlons, dropping on in runs
  const mer = [];
  for (let x = WX0 + 10; x < WX1 - 10; x += 46) mer.push(x);
  const runs = 9, per = Math.ceil(mer.length / runs);
  for (let k = 0; k < runs; k++) {
    const xs = mer.slice(k * per, (k + 1) * per);
    if (!xs.length) continue;
    const x0 = xs[0] - 20, x1 = xs[xs.length - 1] + 20;
    fm(p, 'merlons', { x: x0, y: WALL_TOP - 52, w: x1 - x0, h: 56 }, (c) => {
      for (const x of xs) {
        const pts = [[x - 15, WALL_TOP + 1], [x - 15, WALL_TOP - 46], [x - 4, WALL_TOP - 46], [x, WALL_TOP - 34], [x + 4, WALL_TOP - 46], [x + 15, WALL_TOP - 46], [x + 15, WALL_TOP + 1]];
        // the horns are notched in two steps, as on the real wall
        c.fillStyle = RED; poly(c, pts); c.fill();
        c.fillStyle = RED_D; c.fillRect(x + 6, WALL_TOP - 46, 9, 47);
        c.fillStyle = INK; c.fillRect(x - 2, WALL_TOP - 24, 4, 14);
        c.fillStyle = STONE; c.fillRect(x - 15, WALL_TOP - 47, 11, 2.5); c.fillRect(x + 4, WALL_TOP - 47, 11, 2.5);
      }
    }, { t: 3.0 + k * 0.13, d: 0.5, dir: 'drop' });
  }

  // the square's paving: a black band with cobbles picked out
  fm(p, 'band', { x: WX0, y: GY, w: WX1 - WX0 + 300, h: 64 }, (c) => {
    c.fillStyle = INK; c.fillRect(WX0, GY, WX1 - WX0 + 300, 64);
    c.fillStyle = 'rgba(245,238,219,.16)';
    for (let row = 0; row < 5; row++) {
      for (let x = WX0 + (row % 2) * 9; x < WX1 + 300; x += 18) c.fillRect(x, GY + 14 + row * 10, 12, 5);
    }
    c.fillStyle = RED; c.fillRect(WX0, GY + 64, WX1 - WX0 + 300, 7);
  }, { t: 3.3, d: 1.1, dir: 'right', ease: 'inOut' });
}

// the Senate Tower, plain and square, with its green tent (black here)
function senate(p) {
  const x = -330, h = 290, hw = 50, y0 = GY - h;
  fm(p, 'senate', { x: x - hw - 10, y: y0 - 190, w: hw * 2 + 40, h: h + 190 }, (c) => {
    c.fillStyle = RED; c.fillRect(x - hw, y0, hw * 2, h);
    c.fillStyle = RED_D; c.fillRect(x + hw * 0.4, y0, hw * 0.6, h);
    c.fillStyle = INK; dotRect(c, x + hw * 0.4, y0, x + hw, GY, 6, () => 0.35);
    // white stone cornice and a row of arches
    c.fillStyle = STONE; c.fillRect(x - hw - 5, y0 - 10, hw * 2 + 10, 10);
    c.fillStyle = INK; for (let k = 0; k < 4; k++) c.fillRect(x - hw + 12 + k * 24, y0 + 22, 9, 26);
    c.fillStyle = INK; c.fillRect(x - 8, y0 + 120, 16, 30);
    // the tent
    c.fillStyle = INK; poly(c, [[x - hw + 4, y0 - 10], [x + hw - 4, y0 - 10], [x, y0 - 150]]); c.fill();
    c.strokeStyle = STONE; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y0 - 150); c.lineTo(x - 10, y0 - 10); c.stroke();
    c.fillStyle = STONE; c.beginPath(); c.arc(x, y0 - 156, 5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y0 - 160); c.lineTo(x, y0 - 182); c.stroke();
  }, { t: 3.8, d: 0.9 });
}

// ================================================================ the Spasskaya Tower
// local units: the foot at 0, up is negative; drawn in the slanted frame
function spasskaya(p) {
  const L = 'spass';
  const tier = (x, y, w, h, t, d, draw) => fm(p, L, { x: TX + x, y: GY + y, w, h }, (c, q) => { c.translate(TX, GY); draw(c, q); }, { t, d });
  // the gate block
  tier(-150, -420, 300, 424, 4.1, 1.1, (c) => {
    const x0 = -124, x1 = 124, sx = 168, top = -400;
    c.fillStyle = RED; c.fillRect(x0, top, x1 - x0, 400);
    c.fillStyle = RED_D; c.fillRect(x1, top, sx - x1, 400);
    c.fillStyle = INK; dotRect(c, x1, top, sx, 0, 6, (x) => 0.3 + 0.35 * (x - x1) / (sx - x1));
    // courses
    c.strokeStyle = 'rgba(80,14,10,.3)'; c.lineWidth = 1; c.beginPath();
    for (let y = top + 10; y < 0; y += 10) { c.moveTo(x0, y); c.lineTo(sx, y); } c.stroke();
    // the gateway, its white stone surround
    c.fillStyle = STONE; archFill(c, -52, -230, 104, 230);
    c.fillStyle = INK; archFill(c, -38, -212, 76, 212);
    c.fillStyle = RED_D; archFill(c, sx - 34, -150, 22, 120);
    // white stone: a band of little gothic arches, corner pilasters
    c.fillStyle = STONE; c.fillRect(x0, -320, x1 - x0, 30); c.fillRect(x0, top, 12, 400); c.fillRect(x1 - 12, top, 12, 400);
    c.fillStyle = RED;
    for (let k = 0; k < 11; k++) archFill(c, x0 + 14 + k * 20.5, -314, 12, 22);
    // windows over the gate
    c.fillStyle = INK; for (const wx of [-60, 46]) archFill(c, wx, -290, 16, 34);
    c.fillStyle = STONE; c.fillRect(-14, -262, 28, 22); c.fillStyle = INK; c.fillRect(-10, -258, 20, 14);
    // the cornice
    c.fillStyle = STONE; c.fillRect(x0 - 6, top - 4, sx - x0 + 8, 10);
  });
  // the parapet and its pinnacles
  tier(-150, -560, 330, 164, 5.0, 0.7, (c) => {
    c.fillStyle = STONE; c.fillRect(-124, -440, 292, 36);
    c.fillStyle = INK; for (let k = 0; k < 14; k++) c.fillRect(-116 + k * 20, -432, 7, 20);
    for (const [px, hh] of [[-118, 140], [118, 140], [160, 110], [-60, 80], [60, 80]]) pinnacle(c, px, -440, hh, px > 120);
  });
  // the clock tier
  tier(-110, -700, 230, 280, 5.4, 0.9, (c) => {
    const x0 = -90, x1 = 90, sx = 124, top = -690, bot = -440;
    c.fillStyle = RED; c.fillRect(x0, top, x1 - x0, bot - top);
    c.fillStyle = RED_D; c.fillRect(x1, top, sx - x1, bot - top);
    c.fillStyle = INK; dotRect(c, x1, top, sx, bot, 6, (x) => 0.35 + 0.3 * (x - x1) / (sx - x1));
    c.fillStyle = STONE; c.fillRect(x0, top, 12, bot - top); c.fillRect(x1 - 12, top, 12, bot - top); c.fillRect(x0 - 6, top - 10, sx - x0 + 8, 12);
    c.fillStyle = STONE; for (let k = 0; k < 7; k++) archFill(c, x0 + 14 + k * 22, top + 6, 13, 18);
    // the clock on the side face, seen at a slant
    c.fillStyle = STONE; c.beginPath(); c.ellipse(x1 + (sx - x1) / 2, -570, (sx - x1) * 0.36, 50, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; c.beginPath(); c.ellipse(x1 + (sx - x1) / 2, -570, (sx - x1) * 0.28, 42, 0, 0, Math.PI * 2); c.fill();
  });
  // the clock face
  const ccx = 0, ccy = -565;
  fm(p, L, { x: TX - 80, y: GY + ccy - 80, w: 160, h: 160 }, (c, q) => {
    c.translate(TX, GY);
    const s = 0.6 + 0.4 * q; c.translate(ccx, ccy); c.scale(s, s); c.translate(-ccx, -ccy);
    c.fillStyle = STONE; c.beginPath(); c.arc(ccx, ccy, 72, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(ccx, ccy, 62, 0, Math.PI * 2); c.fill();
    c.strokeStyle = STONE; c.lineWidth = 1.2; c.beginPath(); c.arc(ccx, ccy, 56, 0, Math.PI * 2); c.stroke();
    c.fillStyle = STONE;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      c.save(); c.translate(ccx + Math.cos(a) * 47, ccy + Math.sin(a) * 47); c.rotate(a + Math.PI / 2);
      c.fillRect(-2, -6, 4, k % 3 ? 8 : 13); c.restore();
    }
    for (let k = 0; k < 60; k++) { const a = (k / 60) * Math.PI * 2; c.fillRect(ccx + Math.cos(a) * 58 - 0.8, ccy + Math.sin(a) * 58 - 0.8, 1.6, 1.6); }
  }, { t: 5.9, d: 0.6, dir: 'fade' });
  // the octagon and its belfry arches
  tier(-90, -880, 190, 200, 6.2, 0.8, (c) => {
    const top = -850, bot = -690;
    // faces: left slant, front, right slant
    const faces = [[-70, -36, RED_L], [-36, 36, RED], [36, 88, RED_D]];
    for (const [a, b, col] of faces) { c.fillStyle = col; c.fillRect(a, top, b - a, bot - top); }
    c.fillStyle = INK; dotRect(c, 36, top, 88, bot, 6, () => 0.45);
    c.fillStyle = STONE; for (const x of [-70, -38, 34, 86]) c.fillRect(x - 2, top, 5, bot - top);
    for (const [a, b] of faces) { c.fillStyle = INK; archFill(c, a + (b - a) * 0.25, top + 40, (b - a) * 0.5, 80); }
    c.fillStyle = STONE; c.fillRect(-76, top - 8, 170, 10); c.fillRect(-76, bot - 10, 170, 10);
  });
  // the little gallery and the tent
  tier(-80, -1150, 160, 310, 6.7, 0.9, (c) => {
    const base = -858;
    c.fillStyle = STONE; c.fillRect(-60, base - 28, 128, 28);
    c.fillStyle = INK; for (let k = 0; k < 8; k++) archFill(c, -54 + k * 15.5, base - 24, 8, 18);
    const top = -1096, bw = 56;
    c.fillStyle = INK; poly(c, [[-bw, base - 28], [bw + 10, base - 28], [4, top]]); c.fill();
    // the lit ridge and the ribs
    c.strokeStyle = STONE; c.lineWidth = 2; c.beginPath(); c.moveTo(4, top); c.lineTo(-bw, base - 28); c.moveTo(4, top); c.lineTo(-8, base - 28); c.stroke();
    c.lineWidth = 1; c.strokeStyle = 'rgba(239,229,204,.5)'; c.beginPath(); c.moveTo(4, top); c.lineTo(28, base - 28); c.stroke();
    // dormers in two rows
    c.fillStyle = STONE;
    for (const [dx, dy, s] of [[-30, base - 60, 1], [0, base - 66, 1], [30, base - 60, 1], [-14, base - 124, 0.8], [16, base - 124, 0.8], [2, base - 176, 0.6]]) {
      poly(c, [[dx - 8 * s, dy + 12 * s], [dx + 8 * s, dy + 12 * s], [dx + 8 * s, dy], [dx, dy - 10 * s], [dx - 8 * s, dy]]); c.fill();
      c.fillStyle = INK; c.fillRect(dx - 3 * s, dy, 6 * s, 9 * s); c.fillStyle = STONE;
    }
    // spire and ball
    c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(4, top); c.lineTo(4, top - 24); c.stroke();
    c.fillStyle = STONE; c.beginPath(); c.arc(4, top - 14, 6, 0, Math.PI * 2); c.fill();
  });
  // the star
  fm(p, L, { x: TX - 50, y: GY - 1190, w: 108, h: 104 }, (c, q) => {
    c.translate(TX + 4, GY - 1146);
    const s = 0.4 + 0.6 * q; c.scale(s, s); c.rotate((1 - q) * -1.2);
    star(c, 0, 0, 40, 16, STONE); star(c, 0, 0, 33, 13, RED);
    c.strokeStyle = RED_D; c.lineWidth = 1.2; c.beginPath();
    for (const [x, y] of starPts(0, 0, 33, 13)) { c.moveTo(0, 0); c.lineTo(x, y); }
    c.stroke();
  }, { t: 7.2, d: 0.7, dir: 'fade', ease: 'back' });
}
function starPts(cx, cy, R, r0) {
  const out = [];
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k / 10) * Math.PI * 2, rr = k % 2 ? r0 : R; out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return out;
}
function star(c, cx, cy, R, r0, col) { c.fillStyle = col; poly(c, starPts(cx, cy, R, r0)); c.fill(); }
function archFill(c, x, y, w, h) {
  const rr = w / 2;
  c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + rr); c.arc(x + rr, y + rr, rr, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); c.fill();
}
// a white stone pinnacle with a black tented cap
function pinnacle(c, x, y, h, dark) {
  const w = 12;
  c.fillStyle = dark ? '#d8cdb2' : STONE; c.fillRect(x - w / 2, y - h * 0.55, w, h * 0.55);
  c.fillStyle = INK; c.fillRect(x - 2, y - h * 0.45, 4, h * 0.2);
  c.fillStyle = INK; poly(c, [[x - w / 2 - 2, y - h * 0.55], [x + w / 2 + 2, y - h * 0.55], [x, y - h]]); c.fill();
  c.fillStyle = STONE; c.beginPath(); c.arc(x, y - h - 3, 3, 0, Math.PI * 2); c.fill();
}

// ================================================================ the crowd
function crowd(p, r) {
  const people = [];
  for (let X = WX0 + 30; X < WX1 + 200; X += r.range(9, 22)) {
    if (Math.abs(X - TX) < 190) continue;
    const s = r.range(0.85, 1.15);
    people.push([X, s, r() < 0.5 ? 1 : -1, r()]);
  }
  const runs = 8, per = Math.ceil(people.length / runs);
  for (let k = 0; k < runs; k++) {
    const grp = people.slice(k * per, (k + 1) * per);
    if (!grp.length) continue;
    const x0 = grp[0][0] - 20, x1 = grp[grp.length - 1][0] + 20;
    fm(p, 'crowd', { x: x0, y: GY - 40, w: x1 - x0, h: 46 }, (c) => {
      c.fillStyle = INK; c.strokeStyle = INK; c.lineCap = 'round';
      for (const [X, s, dir, ph] of grp) walker(c, X, GY + 2, s, dir, ph);
    }, { t: 8.6 + k * 0.14, d: 0.6, dir: 'right' });
  }
}
// a small striding figure: head, coat, legs apart
function walker(c, x, y, s, dir, ph) {
  const h = 30 * s, st = (0.35 + ph * 0.5) * 7 * s;
  c.lineWidth = 2.6 * s;
  c.beginPath(); c.moveTo(x, y - h * 0.42); c.lineTo(x - st * 0.6, y); c.moveTo(x, y - h * 0.42); c.lineTo(x + st * 0.6, y); c.stroke();
  poly(c, [[x - 4.5 * s, y - h * 0.36], [x + 4.5 * s, y - h * 0.36], [x + 3.2 * s, y - h * 0.82], [x - 3.2 * s, y - h * 0.82]]); c.fill();
  c.beginPath(); c.arc(x + dir * 0.6 * s, y - h * 0.92, 3.4 * s, 0, Math.PI * 2); c.fill();
  if (ph > 0.6) { c.fillRect(x - 4.5 * s, y - h * 1.05, 9 * s, 2 * s); }
}

// ================================================================ St. Basil's, a cut-out photograph
const BW = 560, BH = 650;
const BASIL = { x: 1050, y: 740, s: 0.93 };
function basil(p) {
  const { x: bx, y: by, s } = BASIL;
  const w = Math.round(BW * s), h = Math.round(BH * s);
  // the gray picture, for the dots
  const { dots, cv } = screen(w, h, (c) => { c.scale(s, s); cathedral(c, 'gray'); }, 5.2, 1.12);
  // the cut-out: the picture's shape grown by a margin, once in cream and once for its shadow
  const pad = 14, k = 2;
  const cut = document.createElement('canvas'); cut.width = (w + 2 * pad) * k; cut.height = (h + 2 * pad) * k;
  const cc = cut.getContext('2d');
  cc.scale(k, k);
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; cc.drawImage(cv, pad + Math.cos(a) * 11, pad + Math.sin(a) * 11); }
  cc.drawImage(cv, pad, pad);
  cc.globalCompositeOperation = 'source-in'; cc.fillStyle = CREAM; cc.fillRect(0, 0, w + 2 * pad, h + 2 * pad);
  const sh = document.createElement('canvas'); sh.width = cut.width; sh.height = cut.height;
  const sc = sh.getContext('2d'); sc.drawImage(cut, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = INK; sc.fillRect(0, 0, sh.width, sh.height);

  const B = { x: bx - pad - 4, y: by - pad - 40, w: w + 2 * pad + 30, h: h + 2 * pad + 70 };
  // pasted down: it drops a little and settles
  p.mark('cutout', {
    t: 7.6, d: 0.8, reveal: 'drop', dy: 40, box: B,
    draw: (c) => {
      c.drawImage(sh, bx - pad + 12, by - pad + 14, w + 2 * pad, h + 2 * pad);
      c.drawImage(cut, bx - pad, by - pad, w + 2 * pad, h + 2 * pad);
    },
  });
  // the red printed first, then the black dots in bands, like a second pass
  p.mark('basil', {
    t: 8.2, d: 0.9, reveal: 'fade', box: { x: bx - 4, y: by - 4, w: w + 8, h: h + 8 },
    draw: (c) => { c.save(); c.translate(bx, by); c.scale(s, s); cathedral(c, 'red'); c.restore(); },
  });
  const bands = 5;
  for (let i = 0; i < bands; i++) {
    const y0 = (h * i) / bands, y1 = (h * (i + 1)) / bands;
    p.mark('dots', {
      t: 8.6 + i * 0.22, d: 0.6, reveal: 'wipe', ease: 'inOut', box: { x: bx - 6, y: by + y0 - 6, w: w + 12, h: y1 - y0 + 12 },
      draw: (c) => { c.fillStyle = INK; drawDots(c, dots, bx, by, y0, y1); },
    });
  }
  p.type('type', 'ХРАМ ВАСИЛИЯ БЛАЖЕННОГО', bx + w / 2, by + h + 52, { family: TITLE, size: 19, color: INK, track: 0.22, align: 'center', t: 9.8, gap: 0.02, d: 0.4, reveal: 'fade' });
}

// the cathedral seen from Red Square, in local units (BW by BH, ground at 630).
// mode 'gray' paints the photograph's tones; 'red' paints only what is printed red.
function cathedral(c, mode) {
  const G = 630;
  const gry = mode === 'gray';
  const fill = (role, v) => {
    if (gry) { c.fillStyle = gray(v); return true; }
    if (role === 'red') { c.fillStyle = RED; return true; }
    return false;
  };
  // the bell tower, to the left
  {
    const x = 44, w = 66;
    if (fill('red', 0.6)) c.fillRect(x - w / 2, 330, w, G - 330);
    if (gry) { c.fillStyle = gray(0.4); c.fillRect(x + w * 0.12, 330, w * 0.38, G - 330); }
    if (fill('cream', 0.9)) { c.fillRect(x - w / 2 - 4, 322, w + 8, 12); c.fillRect(x - w / 2, 262, w, 62); c.fillRect(x - w / 2 - 3, 256, w + 6, 8); }
    if (gry) {
      c.fillStyle = gray(0.1);
      for (const ax of [-26, 3]) archFill(c, x + ax, 272, 22, 46);
      c.fillStyle = gray(0.25); for (let y = 380; y < 600; y += 62) archFill(c, x - 7, y, 14, 28);
      c.fillStyle = gray(0.92); for (let y = 360; y < 620; y += 62) c.fillRect(x - w / 2, y, w, 4);
    }
    if (fill('red', 0.52)) { poly(c, [[x - 30, 256], [x + 30, 256], [x, 150]]); c.fill(); }
    if (gry) { c.fillStyle = gray(0.28); poly(c, [[x, 150], [x + 30, 256], [x + 8, 256]]); c.fill(); c.fillStyle = gray(0.95); for (let k = 0; k < 4; k++) { c.fillRect(x - 18 + k * 4, 240 - k * 24, 4, 4); c.fillRect(x - 4 + k * 1.5, 240 - k * 24, 4, 4); } }
    if (fill('cream', 0.85)) c.fillRect(x - 6, 140, 12, 12);
    dome(c, mode, x, 142, 17, 34, 'ribs', ['dark', 'cream']);
    if (gry) { c.fillStyle = gray(0.2); c.fillRect(x - 1, 92, 2, 18); }
  }
  // the gallery that wraps the whole base: red brick, a white-trimmed arcade
  if (fill('red', 0.64)) c.fillRect(74, 492, 486, G - 492);
  if (gry) {
    c.fillStyle = gray(0.42); c.fillRect(440, 492, 120, G - 492);
    c.fillStyle = gray(0.94); for (let x = 90; x < 550; x += 38) archFill(c, x - 4, 526, 28, 80);
    c.fillStyle = gray(0.08); for (let x = 90; x < 550; x += 38) archFill(c, x, 532, 20, 74);
    c.fillStyle = gray(0.94); c.fillRect(74, 484, 486, 10); c.fillRect(74, 612, 486, 8);
  } else { c.fillStyle = INK; for (let x = 90; x < 550; x += 38) archFill(c, x, 532, 20, 74); }

  // the central tent of the Intercession, tallest, behind
  {
    const x = 300;
    if (fill('cream', 0.86)) c.fillRect(x - 62, 220, 124, 280);
    if (gry) { c.fillStyle = gray(0.5); c.fillRect(x + 22, 220, 40, 280); }
    // kokoshniks: tiers of pointed gables at the tent's foot
    for (let row = 0; row < 3; row++) {
      const yb = 262 - row * 22, n = 4 - row;
      for (let k = 0; k < n; k++) {
        const kx = x - 48 + row * 16 + (n > 1 ? k * ((96 - row * 32) / (n - 1)) : 0);
        if (fill('red', 0.6)) { c.beginPath(); c.moveTo(kx - 15, yb); c.quadraticCurveTo(kx - 13, yb - 22, kx, yb - 30); c.quadraticCurveTo(kx + 13, yb - 22, kx + 15, yb); c.fill(); }
        if (gry) { c.fillStyle = gray(0.95); c.beginPath(); c.arc(kx, yb - 6, 7, Math.PI, 0); c.fill(); }
      }
    }
    // the tent, its faces in bands
    const tb = 200, tt = 52, tw = 54;
    const faces = [[-1, -0.45, 0.95], [-0.45, 0.3, 0.84], [0.3, 1, 0.48]];
    for (const [a, b, v] of faces) {
      if (fill('cream', v)) { poly(c, [[x + a * tw, tb], [x + b * tw, tb], [x + b * 7, tt], [x + a * 7, tt]]); c.fill(); }
    }
    // the tent's diamond tiles, red on the white
    for (let k = 0; k < 9; k++) {
      const y = tb - 10 - k * 16, wk = lerp(tw, 7, (tb - y) / (tb - tt));
      for (const f of [-0.72, -0.08, 0.62]) {
        const dx = x + f * wk;
        if (fill('red', 0.45)) { poly(c, [[dx, y - 5], [dx + 4, y], [dx, y + 5], [dx - 4, y]]); c.fill(); }
      }
    }
    if (fill('cream', 0.85)) c.fillRect(x - 9, 34, 18, 20);
    dome(c, mode, x, 36, 15, 28, 'ribs', ['dark', 'cream']);
    if (gry) { c.fillStyle = gray(0.2); c.fillRect(x - 1, -10, 2, 20); }
  }

  // the onion domes on their drums, back ones first
  const domes = [
    [196, 318, 52, 98, 'facets', ['dark', 'cream']],
    [404, 306, 54, 102, 'ribs', ['red', 'cream']],
    [522, 432, 36, 66, 'scales', ['dark', 'red']],
    [124, 372, 76, 142, 'spiral', ['red', 'cream']],
    [452, 368, 76, 142, 'zigzag', ['red', 'dark']],
    [296, 414, 62, 118, 'scales', ['cream', 'red']],
  ];
  for (const [x, base, R, Hd, pat, roles] of domes) {
    // the drum down to the gallery: white, with red pilasters and dark windows
    const dw = R * 0.6;
    if (fill('cream', 0.88)) c.fillRect(x - dw, base, dw * 2, 492 - base);
    if (gry) { c.fillStyle = gray(0.48); c.fillRect(x + dw * 0.3, base, dw * 0.7, 492 - base); }
    for (const f of [-0.92, 0.86]) if (fill('red', 0.58)) c.fillRect(x + f * dw - 3, base + 4, 6, 492 - base - 4);
    if (gry) {
      c.fillStyle = gray(0.95); c.fillRect(x - dw - 4, base - 2, dw * 2 + 8, 8);
      c.fillStyle = gray(0.08); for (const f of [-0.64, 0, 0.6]) archFill(c, x + f * dw - dw * 0.12, base + 18, dw * 0.24, Math.min(40, (492 - base) * 0.5));
    }
    dome(c, mode, x, base, R, Hd, pat, roles);
    if (gry) { c.fillStyle = gray(0.2); c.fillRect(x - 1.2, base - Hd - 22, 2.4, 24); c.beginPath(); c.arc(x, base - Hd - 4, 3.5, 0, Math.PI * 2); c.fill(); }
  }
}

// one onion dome with its pattern. roles name the two inks of the pattern:
// 'red' prints red (and light under the dots), 'cream' is paper, 'dark' is dense dots
function dome(c, mode, cx, base, R, Hd, pat, roles) {
  const gry = mode === 'gray';
  const tone = { red: 0.64, cream: 0.95, dark: 0.26 };
  const P = (a, t) => [cx + R * onionF(t) * Math.sin(clamp(a, -Math.PI / 2, Math.PI / 2)), base - t * Hd];
  c.save();
  onionPath(c, cx, base, R, Hd);
  if (gry) { c.fillStyle = gray(tone[roles[1]]); c.fill(); }
  c.clip();
  const band = (role, pts) => {
    if (gry) c.fillStyle = gray(tone[role]);
    else if (role === 'red') c.fillStyle = RED; else return;
    poly(c, pts); c.fill();
  };
  const A = 24;
  if (pat === 'spiral' || pat === 'ribs') {
    const n = 10, tw = pat === 'spiral' ? 2.6 : 0;
    for (let k = 0; k < n; k++) {
      if (k % 2) continue;
      const a0 = -Math.PI + (k / n) * Math.PI * 2, a1 = a0 + Math.PI / n;
      const left = [], right = [];
      for (let i = 0; i <= A; i++) { const t = i / A; left.push(P(a0 + tw * t, t)); right.push(P(a1 + tw * t, t)); }
      band(roles[0], [...left, ...right.reverse()]);
      // the same band one turn round, where the twist brings it to the front
      const left2 = [], right2 = [];
      for (let i = 0; i <= A; i++) { const t = i / A; left2.push(P(a0 + tw * t - Math.PI * 2, t)); right2.push(P(a1 + tw * t - Math.PI * 2, t)); }
      if (tw) band(roles[0], [...left2, ...right2.reverse()]);
    }
  } else if (pat === 'zigzag') {
    const rows = 7, m = 5;
    for (let k = 0; k < rows; k += 2) {
      const top = [], bot = [];
      for (let i = 0; i <= 40; i++) {
        const a = -Math.PI / 2 + (i / 40) * Math.PI, z = Math.abs(((a * m / Math.PI) % 1 + 1) % 1 - 0.5) * 0.9;
        bot.push(P(a, (k + z) / rows)); top.push(P(a, (k + 1 + z) / rows));
      }
      band(roles[0], [...bot, ...top.reverse()]);
    }
  } else {
    // facets and scales: a lattice of diamonds over the surface
    const rows = pat === 'scales' ? 9 : 6, cols = pat === 'scales' ? 8 : 6;
    for (let j = 0; j < rows; j++) {
      for (let i = -cols; i <= cols; i++) {
        if ((i + j) % 2) continue;
        const a = (i / cols) * Math.PI / 2, t = (j + 0.5) / rows, da = Math.PI / 2 / cols, dt = 0.5 / rows;
        band(roles[0], [P(a, t - dt), P(a + da, t), P(a, t + dt), P(a - da, t)]);
      }
    }
  }
  // the light on a round thing: bright upper left, dark to the right
  if (gry) {
    const g = c.createLinearGradient(cx - R, 0, cx + R, 0);
    g.addColorStop(0, 'rgba(0,0,0,.2)'); g.addColorStop(0.3, 'rgba(255,255,255,.3)'); g.addColorStop(0.58, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.62)');
    c.fillStyle = g; c.fillRect(cx - R, base - Hd, 2 * R, Hd);
  }
  c.restore();
}

// ================================================================ what moves
function life(p, r) {
  // the clock's hands, turning
  const [kx, ky] = [TX, GY - 565];
  p.live('clock', {
    t: 6.3, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      c.save(); inF(c); c.translate(kx, ky);
      c.fillStyle = STONE; c.strokeStyle = STONE; c.lineCap = 'round';
      const m = (time * 0.11) % (Math.PI * 2), hr = 2.1 + time * 0.0092;
      c.lineWidth = 4.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(hr) * 30, -Math.cos(hr) * 30); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(m) * 46, -Math.cos(m) * 46); c.stroke();
      c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill();
      c.restore();
    },
  });
  // radio waves from the Shukhov tower's mast
  const mx = SH.cx, my = SH.base - 6 * SH.hs - 78;
  p.live('waves', {
    t: 4.2, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = RED; c.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        const ph = ((time * 0.55 + k / 4) % 1);
        const rr = 18 + ph * 150;
        c.globalAlpha = (1 - ph) * 0.9; c.lineWidth = 5 - ph * 3;
        c.beginPath(); c.arc(mx, my, rr, -0.55, 0.55); c.stroke();
        c.beginPath(); c.arc(mx, my, rr, Math.PI - 0.55, Math.PI + 0.55); c.stroke();
      }
      c.globalAlpha = 1;
    },
  });
  // jackdaws crossing the sky
  const birds = [];
  for (let i = 0; i < 16; i++) birds.push([r.range(-200, 1700), r.range(820, 1060) - i * 6, r.range(14, 26), r.range(0.7, 1.4), r() * 6]);
  p.live('birds', {
    t: 9.3, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = INK;
      for (const [x0, y0, v, s, ph] of birds) {
        const x = ((x0 + time * v) % 1900) - 150, y = y0 - x * 0.45 + Math.sin(time * 0.8 + ph) * 8;
        const f = Math.sin(time * 9 + ph * 3);
        const w = 11 * s, hh = (3 + 4 * f) * s;
        c.beginPath(); c.moveTo(x - w, y - hh); c.quadraticCurveTo(x - w * 0.4, y - hh * 0.2, x, y + 2 * s); c.quadraticCurveTo(x + w * 0.4, y - hh * 0.2, x + w, y - hh);
        c.quadraticCurveTo(x + w * 0.4, y + hh * 0.1, x, y + 4 * s); c.quadraticCurveTo(x - w * 0.4, y + hh * 0.1, x - w, y - hh); c.fill();
      }
    },
  });
}

// ================================================================ the title
// turn a set word about a point (its letters keep their own reveals)
function turn(res, px, py, ang) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (const m of res.glyphs) {
    const draw = m.draw, b = m.box;
    m.draw = (c, q) => { c.save(); c.translate(px, py); c.rotate(ang); c.translate(-px, -py); draw(c, q); c.restore(); };
    const pts = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]].map(([x, y]) => [px + (x - px) * ca - (y - py) * sa, py + (x - px) * sa + (y - py) * ca]);
    m.box = boxOf(pts, 4);
  }
  return res;
}
function title(p) {
  // the red band the name is cut out of
  const Y0 = 336, Y1 = 612, X0 = -1300, X1 = 1250;
  fm(p, 'titleband', { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 }, (c) => {
    c.fillStyle = RED; c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    c.fillStyle = INK; c.fillRect(X0, Y1 + 18, X1 - X0, 12);
  }, { t: 10.0, d: 1.0, dir: 'right', ease: 'inOut' });
  const slant = (res) => {
    for (const m of res.glyphs) {
      const draw = m.draw, b = m.box;
      m.draw = (c, q) => { c.save(); inF(c); draw(c, q); c.restore(); };
      m.box = boxF(b.x, b.y, b.w, b.h, 6);
    }
    return res;
  };
  slant(p.type('title', 'МОСКВА', -870, 556, {
    family: TITLE, size: 252, color: CREAM, shadow: INK, sx: 9, sy: 9, track: 0.01, t: 10.7, gap: 0.17, d: 0.7,
  }));
  slant(p.type('title', 'MOSCOW', 30, 716, {
    family: TITLE, size: 82, color: INK, track: 0.5, t: 11.9, gap: 0.1, d: 0.5,
  }));
  fm(p, 'type', { x: 30, y: 744, w: 640, h: 6 }, (c) => { c.fillStyle = INK; c.fillRect(30, 744, 640, 5); }, { t: 12.5, d: 0.6, dir: 'right' });
  slant(p.type('type', 'КРАСНАЯ ПЛОЩАДЬ · КРЕМЛЬ', -840, 300 - 18, {
    family: TITLE, size: 22, color: CREAM, track: 0.3, t: 12.5, gap: 0.02, d: 0.4, reveal: 'fade',
  }));
  // a last red rule and the year
  fm(p, 'type', { x: -870, y: 650, w: 800, h: 12 }, (c) => { c.fillStyle = INK; c.fillRect(-870, 650, 800, 12); }, { t: 12.2, d: 0.7, dir: 'right' });
  slant(p.type('type', '1147', -872, 800, { family: TITLE, size: 128, color: RED, track: 0.04, t: 12.8, gap: 0.12, d: 0.5 }));
  slant(p.type('type', 'ГОД ОСНОВАНИЯ', -870, 690, { family: TITLE, size: 20, color: INK, track: 0.3, t: 12.6, gap: 0.02, d: 0.4, reveal: 'fade' }));
  // the towers of the wall, numbered, in two columns
  slant(p.type('type', 'БАШНИ КРЕМЛЯ', 30, 790, { family: TITLE, size: 20, color: RED, track: 0.3, t: 12.9, gap: 0.02, d: 0.4, reveal: 'fade' }));
  // set as whole lines (fillText keeps the face's own spacing), five names to a mark
  for (let k = 0; k < 4; k++) {
    const names = TOWERS.slice(k * 5, k * 5 + 5), col = k < 2 ? 0 : 1, X = 30 + col * 330, Y0 = 822 + (k % 2) * 105;
    fm(p, 'type', { x: X - 4, y: Y0 - 18, w: 320, h: 110 }, (c) => {
      c.font = `400 14px ${TITLE}`; c.textBaseline = 'alphabetic'; c.letterSpacing = '2px';
      names.forEach((name, i) => {
        const y = Y0 + i * 21;
        c.fillStyle = RED; c.fillText(String(k * 5 + i + 1).padStart(2, '0'), X, y);
        c.fillStyle = INK; c.fillText(name, X + 30, y);
      });
      c.letterSpacing = '0px';
    }, { t: 13.0 + k * 0.18, d: 0.6, dir: 'down' });
  }
}
