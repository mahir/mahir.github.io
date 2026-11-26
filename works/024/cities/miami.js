// Miami: a streamline-moderne travel poster, screen-printed in flat pastel inks
// in the morning light. From the water's edge we look west across the beach,
// past a striped lifeguard tower, umbrellas and the palms of the park, to the
// art deco hotels of Ocean Drive: eyebrows over every window, racing stripes,
// portholes, fins and stepped towers, trimmed with neon tubes that are lit even
// by day. The name is set in tubing across the sky; a stepped deco frame and a
// caption band under the picture.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, shade, mix } from '../kit.js';

const PAPER = '#f6ecd9';
const SKY0 = '#7fd3cf', SKY1 = '#c4ece0', SKY2 = '#fbe9cf';
const PINK = '#f5b3c0', PINK_D = '#e58aa0', MINT = '#bde6d2', MINT_D = '#82c6aa', LEMON = '#f8e39a', LEMON_D = '#e9c662';
const BLUE = '#bcd8f0', BLUE_D = '#8db7de', WHITE = '#fcf7ee', WHITE_D = '#e9dfcf', PEACH = '#f8c9a4', PEACH_D = '#eda57d';
const TEAL = '#21a39d', TEAL_D = '#137a76', CORAL = '#f2607a', CORAL_D = '#cf3f5c';
const NEON_P = '#ff5aa5', NEON_B = '#35c6f4', WIN = '#4e8ea6', WIN_L = '#9ed2df', INK = '#2c3e4a';
const ROAD = '#cbc2d2', WALK = '#efe0cc', STONE = '#e6d1b0', STONE_D = '#cdb48d', GRASS = '#7fc29a', GRASS_D = '#5aa87e';
const SAND = '#f5ddb4', SAND_D = '#e7c690', SEA = '#45c3bd', SEA_D = '#2aa3a2';
const TRUNK = '#b98c60', TRUNK_D = '#8e6643', FROND = '#2c8c6c', FROND_D = '#1d6a54', FROND_L = '#4fae86';

const TITLE = '"Monoton", cursive', CAP = '"Poiret One", sans-serif';

export const city = {
  id: 'miami', name: 'Miami', wall: '#1d4a4e',
  alt: 'A streamline-moderne travel poster in pastel inks: the art deco hotels of Ocean Drive in pink, lemon, blue and white with eyebrows over their windows, racing stripes, portholes, fins and a stepped tower trimmed in neon tubes, cafe umbrellas and strollers on the sidewalk and a convertible on the drive, coconut palms in the park, and on the beach a striped lifeguard tower with its ramp and flag, umbrellas, sunbathers and the edge of the surf, under a clear morning sky with pelicans and the name MIAMI in tubing',
  google: 'family=Monoton&family=Poiret+One',
  fonts: [['400 280px "Monoton"', 'MIAMI'], ['400 40px "Poiret One"', 'OCEAN DRIVE · SOUTH BEACH · FLORIDA · HOTEL']],
  build,
};

const M = 56; // the paper margin
const PY1 = 1830; // the picture's foot; the caption band below it
const BASE = 1340; // the hotels' foot, on the sidewalk
const ROAD0 = 1366, ROAD1 = 1440, WALL0 = 1500, WALL1 = 1526, SURF = 1770;

function build() {
  const p = new Plate({ paper: PAPER, seed: 1939 });
  const r = p.r;
  p.clip = { x: M, y: M, w: W - 2 * M, h: PY1 - M };
  p.stack('sky', 'hotels', 'facade', 'neon', 'street', 'beach', 'palms', 'tower', 'people', 'live', 'title');
  p.layer('title', { clip: false });
  sky(p, r);
  hotels(p, r);
  street(p, r);
  beach(p, r);
  palms(p, r);
  tower(p, r);
  people(p, r);
  live(p, r);
  title(p, r);
  return p;
}

const rr = (c, x, y, w, h) => { c.beginPath(); c.rect(x, y, w, h); };
function path(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }

// ================================================================ the sky
function sky(p, r) {
  p.group('sky', { x: M, y: M, w: W - 2 * M, h: BASE - M + 10 }, (c) => {
    const g = c.createLinearGradient(0, M, 0, BASE);
    g.addColorStop(0, SKY0); g.addColorStop(0.55, SKY1); g.addColorStop(1, SKY2);
    c.fillStyle = g; c.fillRect(M, M, W - 2 * M, BASE - M + 10);
  }, { t: 0.2, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // flat clouds, printed white with a pale shadow underneath
  const clouds = [[220, 520, 1], [1180, 470, 0.85], [760, 600, 0.7], [1420, 640, 0.6]];
  clouds.forEach(([x, y, s], i) => {
    const puffs = [[-70, 0, 34], [-30, -22, 42], [20, -30, 46], [66, -12, 36], [100, 4, 24]].map(([dx, dy, R]) => [x + dx * s, y + dy * s, R * s]);
    p.group('sky', { x: x - 120 * s, y: y - 90 * s, w: 250 * s, h: 130 * s }, (c) => {
      c.fillStyle = 'rgba(126,196,196,.35)'; c.beginPath(); c.roundRect(x - 106 * s, y + 6 * s, 236 * s, 22 * s, 11 * s); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); for (const [px, py, R] of puffs) { c.moveTo(px + R, py); c.arc(px, py, R, 0, Math.PI * 2); } c.rect(x - 104 * s, y - 4 * s, 230 * s, 24 * s); c.fill();
    }, { t: 0.9 + i * 0.15, d: 0.6, reveal: 'wipe', ease: 'inOut' });
  });
}

// ================================================================ the hotels: shared pieces
// a row of windows in groups, each with its eyebrow shade and the shade's shadow
function windowRow(c, x0, x1, y, h, o = {}) {
  const groups = o.groups || [[x0, x1]];
  for (const [a, b] of groups) {
    const n = o.panes ?? Math.max(2, Math.round((b - a) / 26));
    c.fillStyle = o.glass || WIN; c.fillRect(a, y, b - a, h);
    c.fillStyle = WIN_L; c.fillRect(a, y, b - a, h * 0.28);
    c.strokeStyle = o.frame || WHITE; c.lineWidth = 2.4; c.beginPath();
    for (let k = 1; k < n; k++) { const x = lerp(a, b, k / n); c.moveTo(x, y); c.lineTo(x, y + h); }
    c.moveTo(a, y + h * 0.45); c.lineTo(b, y + h * 0.45);
    c.stroke();
    c.strokeRect(a, y, b - a, h);
    if (o.brow !== false) eyebrow(c, a - 10, b + 10, y - 6, o.brow || o.trim || WHITE, o.wall);
  }
}
function eyebrow(c, a, b, y, col, wall) {
  // the slab's shadow falls straight down in the high sun
  c.fillStyle = 'rgba(40,60,80,.18)'; c.fillRect(a + 4, y + 6, b - a - 4, 16);
  c.fillStyle = col; c.fillRect(a, y, b - a, 7);
  c.fillStyle = shade(col, 0.82); c.fillRect(a, y + 5, b - a, 2.5);
}
function porthole(c, x, y, R, rim) {
  c.fillStyle = rim; c.beginPath(); c.arc(x, y, R + 5, 0, Math.PI * 2); c.fill();
  c.fillStyle = WIN; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.fill();
  c.fillStyle = WIN_L; c.beginPath(); c.arc(x - R * 0.3, y - R * 0.3, R * 0.38, 0, Math.PI * 2); c.fill();
}
function stripes(c, x0, x1, y, col, n = 3, gap = 9, lw = 4) {
  c.fillStyle = col; for (let k = 0; k < n; k++) c.fillRect(x0, y + k * gap, x1 - x0, lw);
}
// a rounded corner, in flat bands of tone
function roundCorner(c, x0, x1, y0, y1, col, dir = 1) {
  const n = 5;
  for (let k = 0; k < n; k++) {
    const t = k / n, a = lerp(x0, x1, t), b = lerp(x0, x1, (k + 1) / n);
    c.fillStyle = shade(col, dir > 0 ? 1 - t * 0.2 : 0.8 + t * 0.2);
    c.fillRect(a, y0, b - a + 0.5, y1 - y0);
  }
}
// a cafe umbrella and its table
function cafe(c, x, y, col, s = 1) {
  c.fillStyle = WHITE; c.fillRect(x - 1.5 * s, y - 46 * s, 3 * s, 46 * s);
  c.fillStyle = col; c.beginPath(); c.moveTo(x - 34 * s, y - 40 * s); c.quadraticCurveTo(x, y - 66 * s, x + 34 * s, y - 40 * s); c.closePath(); c.fill();
  c.fillStyle = WHITE; c.beginPath(); c.moveTo(x - 12 * s, y - 40 * s); c.quadraticCurveTo(x - 4 * s, y - 60 * s, x, y - 60 * s); c.quadraticCurveTo(x + 4 * s, y - 60 * s, x + 12 * s, y - 40 * s); c.closePath(); c.fill();
  c.fillStyle = WHITE; c.fillRect(x - 14 * s, y - 16 * s, 28 * s, 3 * s); c.fillRect(x - 1.5 * s, y - 16 * s, 3 * s, 16 * s);
  c.fillStyle = TEAL_D; c.fillRect(x - 24 * s, y - 12 * s, 3 * s, 12 * s); c.fillRect(x + 21 * s, y - 12 * s, 3 * s, 12 * s);
}

// ================================================================ the hotels, south to north
function hotels(p, r) {
  // ---------------------------------------------- 1: white, three fins over the roof, long eyebrows wrapping round
  {
    const x0 = 80, x1 = 440, top = 760, gf = BASE - 170;
    p.group('hotels', { x: x0 - 30, y: top - 180, w: x1 - x0 + 60, h: BASE - top + 186 }, (c) => {
      c.fillStyle = WHITE; c.fillRect(x0, top, x1 - x0, BASE - top);
      roundCorner(c, x1 - 50, x1, top, BASE, WHITE, 1);
      // the fins, each with a teal edge
      for (const fx of [180, 262, 344]) {
        c.fillStyle = WHITE; c.fillRect(fx - 13, top - 150, 26, 150);
        c.fillStyle = WHITE_D; c.fillRect(fx + 5, top - 150, 8, 150);
        c.fillStyle = TEAL; c.fillRect(fx - 13, top - 156, 26, 8);
      }
      c.fillStyle = MINT; c.fillRect(x0, top - 12, x1 - x0, 14);
    }, { t: 1.4, d: 1.1, reveal: 'rise', ease: 'out' });
    p.group('facade', { x: x0 - 10, y: top - 10, w: x1 - x0 + 20, h: BASE - top + 12 }, (c) => {
      for (let k = 0; k < 3; k++) {
        const y = top + 40 + k * 128;
        windowRow(c, x0 + 20, x1 - 10, y, 62, { groups: [[x0 + 18, x0 + 120], [x0 + 150, x0 + 222], [x0 + 260, x1 - 8]], brow: MINT_D, panes: 4 });
        // the eyebrow runs on round the corner as one long band
        eyebrow(c, x0, x1, y - 8, MINT_D);
      }
      stripes(c, x0, x1, gf - 22, TEAL, 3, 8, 3);
      // the porch: a terrace behind square piers
      c.fillStyle = '#d9cdb9'; c.fillRect(x0, gf, x1 - x0, BASE - gf);
      c.fillStyle = 'rgba(40,60,80,.2)'; c.fillRect(x0, gf, x1 - x0, 26);
      c.fillStyle = WHITE; for (let x = x0 + 10; x < x1; x += 70) c.fillRect(x, gf, 20, BASE - gf);
      c.fillStyle = WIN; for (let x = x0 + 44; x < x1 - 30; x += 70) { c.fillRect(x, gf + 50, 34, 80); }
    }, { t: 2.4, d: 0.9, reveal: 'fall', ease: 'inOut' });
  }
  // ---------------------------------------------- 2: pale blue, a stepped central tower striped in lemon
  {
    const x0 = 440, x1 = 800, top = 640, cx = 620, gf = BASE - 170;
    p.group('hotels', { x: x0 - 10, y: 380, w: x1 - x0 + 20, h: BASE - 380 + 6 }, (c) => {
      c.fillStyle = BLUE; c.fillRect(x0, top, x1 - x0, BASE - top);
      // the tower, in three steps
      const steps = [[52, 520], [40, 470], [28, 430]];
      c.fillStyle = WHITE; c.fillRect(cx - 62, top - 30, 124, 30 + 10);
      for (const [hw, y] of steps) { c.fillStyle = WHITE; c.fillRect(cx - hw, y, hw * 2, top - y); c.fillStyle = WHITE_D; c.fillRect(cx + hw - 10, y, 10, top - y); }
      // lemon and blue bands down its face
      for (let y = 540; y < BASE - 180; y += 34) { c.fillStyle = LEMON; c.fillRect(cx - 40, y, 80, 14); c.fillStyle = BLUE_D; c.fillRect(cx - 40, y + 14, 80, 4); }
      c.fillStyle = LEMON_D; c.fillRect(cx - 28, 422, 56, 10);
      c.fillStyle = BLUE_D; c.fillRect(x0, top - 6, x1 - x0, 8);
    }, { t: 2.0, d: 1.2, reveal: 'rise', ease: 'out' });
    p.group('facade', { x: x0 - 12, y: top - 4, w: x1 - x0 + 24, h: BASE - top + 6 }, (c) => {
      for (let k = 0; k < 4; k++) {
        const y = top + 36 + k * 112;
        windowRow(c, x0, x1, y, 54, { groups: [[x0 + 22, x0 + 120], [x1 - 120, x1 - 22]], brow: WHITE, panes: 4 });
        c.fillStyle = WIN; c.fillRect(cx - 60, y + 8, 14, 40); c.fillRect(cx + 46, y + 8, 14, 40);
      }
      stripes(c, x0, cx - 62, top + 18, LEMON_D, 3, 7, 3); stripes(c, cx + 62, x1, top + 18, LEMON_D, 3, 7, 3);
      // the porch with lemon awnings
      c.fillStyle = '#cfd9e6'; c.fillRect(x0, gf, x1 - x0, BASE - gf);
      for (let x = x0 + 16; x < x1 - 40; x += 64) {
        c.fillStyle = LEMON; c.beginPath(); c.moveTo(x, gf + 20); c.lineTo(x + 48, gf + 20); c.lineTo(x + 54, gf + 52); c.lineTo(x - 6, gf + 52); c.closePath(); c.fill();
        c.fillStyle = WHITE; for (let k = 0; k < 4; k++) c.fillRect(x + 4 + k * 12, gf + 20, 5, 32);
        c.fillStyle = WIN; c.fillRect(x + 4, gf + 62, 40, 82);
      }
      c.fillStyle = WHITE; c.fillRect(x0, gf - 8, x1 - x0, 10);
    }, { t: 3.0, d: 0.9, reveal: 'fall', ease: 'inOut' });
  }
  // ---------------------------------------------- 3: pink, a tall sign fin, a deep canopy over the door
  {
    const x0 = 800, x1 = 1150, top = 740, fx = 975, gf = BASE - 170;
    p.group('hotels', { x: x0 - 10, y: 520, w: x1 - x0 + 20, h: BASE - 520 + 6 }, (c) => {
      c.fillStyle = PINK; c.fillRect(x0, top, x1 - x0, BASE - top);
      c.fillStyle = WHITE; c.fillRect(x0, top - 18, x1 - x0, 20);
      // the parapet steps up toward the fin
      c.fillStyle = PINK; c.fillRect(fx - 90, top - 50, 180, 50); c.fillStyle = WHITE; c.fillRect(fx - 90, top - 58, 180, 10);
      // the fin
      c.fillStyle = WHITE; c.fillRect(fx - 26, 560, 52, BASE - 260 - 560);
      c.fillStyle = WHITE_D; c.fillRect(fx + 14, 560, 12, BASE - 260 - 560);
      c.fillStyle = TEAL; c.beginPath(); c.moveTo(fx - 26, 560); c.lineTo(fx, 534); c.lineTo(fx + 26, 560); c.closePath(); c.fill();
    }, { t: 2.6, d: 1.1, reveal: 'rise', ease: 'out' });
    p.group('facade', { x: x0 - 12, y: top - 4, w: x1 - x0 + 24, h: BASE - top + 8 }, (c) => {
      for (let k = 0; k < 3; k++) {
        const y = top + 44 + k * 124;
        windowRow(c, x0, x1, y, 60, { groups: [[x0 + 24, x0 + 88], [x0 + 104, fx - 42], [fx + 42, x1 - 104], [x1 - 88, x1 - 24]], brow: WHITE, panes: 2 });
      }
      stripes(c, x0, fx - 30, gf - 30, CORAL_D, 2, 9, 4); stripes(c, fx + 30, x1, gf - 30, CORAL_D, 2, 9, 4);
      // the porch, the canopy, the door
      c.fillStyle = '#e9cdd2'; c.fillRect(x0, gf, x1 - x0, BASE - gf);
      c.fillStyle = WIN; for (const x of [x0 + 26, x0 + 96, x1 - 146, x1 - 76]) c.fillRect(x, gf + 50, 50, 90);
      c.fillStyle = '#3a6276'; c.fillRect(fx - 34, gf + 40, 68, BASE - gf - 40);
      c.fillStyle = WHITE; c.fillRect(fx - 110, gf + 18, 220, 20);
      c.fillStyle = 'rgba(40,60,80,.2)'; c.fillRect(fx - 106, gf + 38, 212, 14);
      c.fillStyle = WHITE; c.fillRect(fx - 104, gf + 38, 6, BASE - gf - 38); c.fillRect(fx + 98, gf + 38, 6, BASE - gf - 38);
    }, { t: 3.5, d: 0.9, reveal: 'fall', ease: 'inOut' });
  }
  // ---------------------------------------------- 4: lemon, a rounded corner, portholes, a stepped parapet
  {
    const x0 = 1150, x1 = W - M, top = 770, gf = BASE - 170;
    p.group('hotels', { x: x0 - 10, y: 600, w: x1 - x0 + 20, h: BASE - 600 + 6 }, (c) => {
      c.fillStyle = LEMON; c.fillRect(x0, top, x1 - x0, BASE - top);
      roundCorner(c, x0, x0 + 70, top, BASE, LEMON, -1);
      // the ziggurat over the middle
      const zx = 1330;
      [[110, 50], [76, 40], [44, 36]].reduce((y, [hw, h]) => { c.fillStyle = LEMON; c.fillRect(zx - hw, y - h, hw * 2, h); c.fillStyle = WHITE; c.fillRect(zx - hw, y - h, hw * 2, 7); return y - h; }, top);
      c.fillStyle = WHITE; c.fillRect(x0, top - 6, x1 - x0, 8);
    }, { t: 3.2, d: 1.1, reveal: 'rise', ease: 'out' });
    p.group('facade', { x: x0 - 12, y: top - 4, w: x1 - x0 + 24, h: BASE - top + 8 }, (c) => {
      for (let k = 0; k < 3; k++) {
        const y = top + 44 + k * 124;
        // round the corner: narrow windows bending with it
        c.fillStyle = WIN; for (let j = 0; j < 4; j++) c.fillRect(x0 + 8 + j * 16, y + 4, 10 - j * 1.5 + 4, 54);
        eyebrow(c, x0, x0 + 76, y - 6, TEAL);
        windowRow(c, x0, x1, y, 58, { groups: [[1250, 1300], [1360, 1410]], brow: TEAL, panes: 2 });
        porthole(c, 1330, y + 30, 14, WHITE);
        porthole(c, 1460, y + 30, 14, WHITE);
      }
      // a slot of glass block up the middle
      c.fillStyle = '#d4eef0'; c.fillRect(1206, top + 30, 20, gf - top - 50);
      c.strokeStyle = WIN_L; c.lineWidth = 1.2; c.beginPath(); for (let y = top + 30; y < gf - 20; y += 10) { c.moveTo(1206, y); c.lineTo(1226, y); } c.moveTo(1216, top + 30); c.lineTo(1216, gf - 20); c.stroke();
      stripes(c, x0 + 70, x1, gf - 26, TEAL, 3, 8, 3);
      c.fillStyle = '#ece0b8'; c.fillRect(x0, gf, x1 - x0, BASE - gf);
      c.fillStyle = 'rgba(40,60,80,.18)'; c.fillRect(x0, gf, x1 - x0, 22);
      c.fillStyle = WIN; for (let x = x0 + 40; x < x1 - 40; x += 82) c.fillRect(x, gf + 50, 54, 90);
      c.fillStyle = TEAL; for (let x = x0 + 30; x < x1 - 30; x += 82) { c.beginPath(); c.moveTo(x, gf + 26); c.lineTo(x + 74, gf + 26); c.lineTo(x + 68, gf + 44); c.lineTo(x + 6, gf + 44); c.closePath(); c.fill(); }
    }, { t: 3.9, d: 0.9, reveal: 'fall', ease: 'inOut' });
  }
  // ---------------------------------------------- the neon tubes, lit one after another
  const tubes = [
    { pts: [[453 + 167, 432], [620, 1150]], col: NEON_B, t: 9.4 },
    { pts: [[86, 1160], [434, 1160]], col: NEON_P, t: 9.5 },
    { pts: [[975, 580], [975, 1060]], col: NEON_P, t: 9.6 },
    { pts: [[867, BASE - 152], [1083, BASE - 152]], col: NEON_B, t: 9.7 },
    { pts: [[1156, BASE - 176], [W - M - 4, BASE - 176]], col: NEON_P, t: 9.8 },
    { pts: [[1222, 704], [1438, 704]], col: NEON_B, t: 9.9 },
    { pts: [[446, 638], [794, 638]], col: NEON_P, t: 10.0 },
  ];
  for (const tb of tubes) {
    const len = Math.hypot(tb.pts[1][0] - tb.pts[0][0], tb.pts[1][1] - tb.pts[0][1]);
    p.mark('neon', {
      t: tb.t, d: 0.5, reveal: 'draw', ease: 'out', box: boxOf(tb.pts, 14),
      draw: (c, q) => {
        const [a, b] = tb.pts, x = lerp(a[0], b[0], q), y = lerp(a[1], b[1], q);
        c.lineCap = 'round';
        c.strokeStyle = tb.col; c.globalAlpha *= 0.25; c.lineWidth = 16; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(x, y); c.stroke();
        c.globalAlpha /= 0.25; c.lineWidth = 6; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(x, y); c.stroke();
        c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(x, y); c.stroke();
      },
    });
  }
  // HOTEL down the fin, in tubing
  p.group('neon', { x: 945, y: 590, w: 60, h: 300 }, (c) => {
    c.font = `400 40px ${CAP}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    'HOTEL'.split('').forEach((ch, k) => { c.fillStyle = TEAL_D; c.fillText(ch, 975, 640 + k * 50); });
  }, { t: 10.1, d: 0.5, reveal: 'fall' });
}

// ================================================================ Ocean Drive, the park, the wall
function street(p, r) {
  p.group('street', { x: M, y: BASE - 4, w: W - 2 * M, h: WALL1 - BASE + 30 }, (c) => {
    c.fillStyle = WALK; c.fillRect(M, BASE, W - 2 * M, ROAD0 - BASE);
    c.fillStyle = WHITE_D; for (let x = M; x < W - M; x += 40) c.fillRect(x, BASE, 2, ROAD0 - BASE);
    c.fillStyle = ROAD; c.fillRect(M, ROAD0, W - 2 * M, ROAD1 - ROAD0);
    c.fillStyle = LEMON; for (let x = M + 20; x < W - M; x += 90) c.fillRect(x, (ROAD0 + ROAD1) / 2 - 2, 46, 4);
    c.fillStyle = WALK; c.fillRect(M, ROAD1, W - 2 * M, 14);
    c.fillStyle = GRASS; c.fillRect(M, ROAD1 + 14, W - 2 * M, WALL0 - ROAD1 - 14);
    c.fillStyle = GRASS_D; c.beginPath(); for (let x = M; x < W - M; x += 12) { c.moveTo(x, WALL0); c.lineTo(x + 6, WALL0 - 8); c.lineTo(x + 12, WALL0); } c.fill();
    // the low wall of coral stone, its blocks
    c.fillStyle = STONE; c.fillRect(M, WALL0, W - 2 * M, WALL1 - WALL0);
    c.fillStyle = WHITE; c.fillRect(M, WALL0 - 4, W - 2 * M, 6);
    c.fillStyle = STONE_D; for (let x = M + 30; x < W - M; x += 60) c.fillRect(x, WALL0 + 2, 2, WALL1 - WALL0 - 2);
  }, { t: 4.4, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // cafe tables on the sidewalk under umbrellas
  const tables = [[160, CORAL], [300, TEAL], [520, LEMON_D], [700, CORAL], [880, TEAL], [1240, CORAL], [1400, TEAL]];
  p.group('street', { x: M, y: BASE - 80, w: W - 2 * M, h: 90 }, (c) => {
    for (const [x, col] of tables) cafe(c, x, BASE + 6, col, 1);
  }, { t: 5.0, d: 0.7, reveal: 'pop' });
  // sea grape and hibiscus along the wall
  const bushes = [];
  for (let x = M + 10; x < W - M; x += r.range(38, 70)) bushes.push([x, WALL0 + 2, r.range(16, 26), r() < 0.3]);
  p.group('street', { x: M, y: WALL0 - 40, w: W - 2 * M, h: 50 }, (c) => {
    for (const [x, y, s, fl] of bushes) {
      c.fillStyle = '#3d9a6c'; c.beginPath(); c.arc(x, y - s * 0.4, s, Math.PI, 0); c.fill();
      c.fillStyle = '#62b884'; c.beginPath(); c.arc(x - s * 0.3, y - s * 0.6, s * 0.5, 0, Math.PI * 2); c.fill();
      if (fl) { c.fillStyle = CORAL; for (const [u, v] of [[-0.5, -0.7], [0.3, -0.9], [0.6, -0.4]]) { c.beginPath(); c.arc(x + u * s, y + v * s, 3.5, 0, Math.PI * 2); c.fill(); } }
    }
  }, { t: 5.4, d: 0.6, reveal: 'rise' });
}

// ================================================================ the beach: sand, umbrellas, the surf
function beach(p, r) {
  const dots = [];
  for (let i = 0; i < 700; i++) dots.push([r.range(M, W - M), r.range(WALL1 + 4, SURF - 4)]);
  const prints = [];
  for (let k = 0; k < 16; k++) { const t = k / 15; prints.push([lerp(240, 860, t) + (k % 2) * 10, lerp(SURF - 20, WALL1 + 40, t) + (k % 2) * 4]); }
  p.group('beach', { x: M, y: WALL1, w: W - 2 * M, h: SURF - WALL1 + 4 }, (c) => {
    c.fillStyle = SAND; c.fillRect(M, WALL1, W - 2 * M, SURF - WALL1 + 4);
    c.fillStyle = SAND_D; c.beginPath(); for (const [x, y] of dots) c.rect(x, y, 2.2, 2.2); c.fill();
    c.fillStyle = 'rgba(200,160,110,.5)'; c.beginPath(); for (const [x, y] of prints) { c.moveTo(x + 4, y); c.ellipse(x, y, 4, 2.4, 0.3, 0, Math.PI * 2); } c.fill();
  }, { t: 5.6, d: 0.8, reveal: 'fall', ease: 'inOut' });
  // the water's edge: a scallop of foam and the turquoise shallows
  const scallops = [];
  for (let x = M - 20; x < W - M + 20; x += 46) scallops.push(x + r.range(-6, 6));
  p.group('beach', { x: M, y: SURF - 20, w: W - 2 * M, h: PY1 - SURF + 24 }, (c) => {
    c.fillStyle = 'rgba(214,190,150,.6)'; c.fillRect(M, SURF - 14, W - 2 * M, 16);
    c.fillStyle = SEA; c.fillRect(M, SURF, W - 2 * M, PY1 - SURF);
    c.fillStyle = SEA_D; c.fillRect(M, SURF + 34, W - 2 * M, PY1 - SURF - 34);
    c.fillStyle = '#ffffff'; c.beginPath(); for (const x of scallops) { c.moveTo(x + 26, SURF); c.arc(x, SURF, 26, 0, Math.PI); } c.fill();
    c.strokeStyle = '#bfeeea'; c.lineWidth = 3; c.beginPath(); for (let x = M + 20; x < W - M; x += 120) { c.moveTo(x, SURF + 46); c.lineTo(x + 60, SURF + 46); } c.stroke();
  }, { t: 6.0, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // striped umbrellas and towels
  const umbrellas = [[230, 1690, [CORAL, WHITE]], [470, 1640, [TEAL, WHITE]], [700, 1716, [LEMON_D, WHITE]], [150, 1600, [PINK_D, WHITE]]];
  umbrellas.forEach(([x, y, cols], i) => {
    p.group('beach', { x: x - 90, y: y - 140, w: 180, h: 160 }, (c) => {
      c.strokeStyle = WHITE; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 12, y - 110); c.stroke();
      c.save(); c.translate(x - 12, y - 110); c.rotate(-0.2);
      for (let k = 0; k < 6; k++) { c.fillStyle = cols[k % 2]; c.beginPath(); c.moveTo(0, -18); c.lineTo(-72 + k * 24, 18); c.quadraticCurveTo(-60 + k * 24, 10, -48 + k * 24, 18); c.closePath(); c.fill(); }
      c.fillStyle = cols[0]; c.beginPath(); c.arc(0, -20, 5, 0, Math.PI * 2); c.fill();
      c.restore();
    }, { t: 8.4 + i * 0.15, d: 0.5, reveal: 'pop', ease: 'back' });
  });
}

// ================================================================ the palms
const PALMS = [
  { x: 330, y: 1500, top: [300, 500], lean: -30 },
  { x: 760, y: 1494, top: [790, 860], lean: 30 },
  { x: 1000, y: 1500, top: [1060, 440], lean: 60 },
  { x: 1440, y: 1500, top: [1410, 560], lean: -30 },
  { x: 120, y: 1494, top: [150, 760], lean: 30 },
];
function palms(p, r) {
  PALMS.forEach((pl, i) => {
    const [tx, ty] = pl.top;
    const pts = [];
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      pts.push([lerp(pl.x, tx, t) + Math.sin(t * Math.PI) * pl.lean, lerp(pl.y, ty, t)]);
    }
    pl.pts = pts;
    p.group('palms', boxOf(pts, 26), (c) => {
      // the trunk tapers, ringed
      c.fillStyle = TRUNK; c.beginPath();
      for (let k = 0; k <= 24; k++) { const w = lerp(15, 8, k / 24); c.lineTo(pts[k][0] - w, pts[k][1]); }
      for (let k = 24; k >= 0; k--) { const w = lerp(15, 8, k / 24); c.lineTo(pts[k][0] + w, pts[k][1]); }
      c.closePath(); c.fill();
      c.fillStyle = TRUNK_D; c.beginPath();
      for (let k = 0; k <= 24; k++) { const w = lerp(15, 8, k / 24); c.lineTo(pts[k][0] + w * 0.2, pts[k][1]); }
      for (let k = 24; k >= 0; k--) { const w = lerp(15, 8, k / 24); c.lineTo(pts[k][0] + w, pts[k][1]); }
      c.closePath(); c.fill();
      c.strokeStyle = TRUNK_D; c.lineWidth = 2; c.beginPath();
      for (let y = pl.y - 10; y > ty + 10; y -= 14) { const t = (pl.y - y) / (pl.y - ty), k = Math.round(t * 24), w = lerp(15, 8, t); c.moveTo(pts[k][0] - w, pts[k][1]); c.quadraticCurveTo(pts[k][0], pts[k][1] + 4, pts[k][0] + w, pts[k][1]); }
      c.stroke();
      // coconuts
      c.fillStyle = '#8a6a2c'; for (const [u, v] of [[-8, 8], [6, 10], [-1, 16]]) { c.beginPath(); c.arc(tx + u, ty + v, 7, 0, Math.PI * 2); c.fill(); }
    }, { t: 6.2 + i * 0.22, d: 0.9, reveal: 'rise', ease: 'out' });
  });
}
// a crown of fronds; sway in -1..1
function crown(c, x, y, s, sway, fr) {
  for (const f of fr) {
    const a = f.a + sway * 0.06 * f.k, L = f.L * s;
    const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * 0.75 + f.droop * s;
    const mx = x + Math.cos(a) * L * 0.5, my = y + Math.sin(a) * L * 0.5 - 30 * s;
    const nx = -Math.sin(a), ny = Math.cos(a);
    c.fillStyle = f.dark ? FROND_D : FROND;
    c.beginPath(); c.moveTo(x, y);
    // the leaflets: a saw-tooth along each side of the rib
    for (let k = 1; k <= 8; k++) {
      const t = k / 8, px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * mx + t * t * ex, py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * my + t * t * ey;
      const w = 30 * s * Math.sin(t * Math.PI) * (k % 2 ? 1 : 0.7);
      c.lineTo(px + nx * w + Math.cos(a) * 8, py + ny * w + 10 * s);
      c.lineTo(px, py);
    }
    for (let k = 8; k >= 1; k--) {
      const t = k / 8, px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * mx + t * t * ex, py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * my + t * t * ey;
      const w = 30 * s * Math.sin(t * Math.PI) * (k % 2 ? 0.7 : 1);
      c.lineTo(px - nx * w + Math.cos(a) * 8, py - ny * w + 10 * s);
      c.lineTo(px, py);
    }
    c.closePath(); c.fill();
    c.strokeStyle = FROND_L; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
  }
}

// ================================================================ the lifeguard tower: a striped hut on stilts, a ramp, a flag
const TX = 1230, TY = 1740, TS = 1.3; // the foot of the tower's middle, and its scale
function tower(p, r) {
  const hx0 = TX - 120, hx1 = TX + 120, deck = TY - 190, roof = deck - 150;
  const sb = { x: TX + (hx0 - 330 - TX) * TS, y: TY + (roof - 130 - TY) * TS, w: 640 * TS, h: (TY - roof + 150) * TS };
  p.group('tower', sb, (c) => {
    c.translate(TX, TY); c.scale(TS, TS); c.translate(-TX, -TY);
    // a shadow on the sand
    c.fillStyle = 'rgba(190,150,100,.45)'; c.beginPath(); c.ellipse(TX + 20, TY + 4, 170, 16, 0, 0, Math.PI * 2); c.fill();
    // the stilts and their braces
    c.fillStyle = WHITE; for (const x of [hx0 + 14, TX - 6, hx1 - 26]) c.fillRect(x, deck, 12, TY - deck);
    c.strokeStyle = WHITE_D; c.lineWidth = 5; c.beginPath(); c.moveTo(hx0 + 20, deck + 20); c.lineTo(TX, TY - 30); c.lineTo(hx1 - 20, deck + 20); c.stroke();
    // the ramp, down to the sand on the left
    c.fillStyle = PEACH; poly(c, [[hx0 - 10, deck + 4], [hx0 - 300, TY - 4], [hx0 - 268, TY], [hx0 + 10, deck + 22]]); c.fill();
    c.fillStyle = PEACH_D; poly(c, [[hx0 - 300, TY - 4], [hx0 - 268, TY], [hx0 + 10, deck + 22], [hx0 + 10, deck + 28], [hx0 - 268, TY + 6]]); c.fill();
    c.strokeStyle = WHITE; c.lineWidth = 3; c.beginPath(); c.moveTo(hx0 - 300, TY - 40); c.lineTo(hx0 - 10, deck - 36);
    for (let k = 0; k <= 6; k++) { const t = k / 6; c.moveTo(lerp(hx0 - 300, hx0 - 10, t), lerp(TY - 40, deck - 36, t)); c.lineTo(lerp(hx0 - 300, hx0 - 10, t), lerp(TY - 4, deck + 4, t)); }
    c.stroke();
    // the deck with its rail
    c.fillStyle = WHITE; c.fillRect(hx0 - 30, deck, hx1 - hx0 + 60, 14);
    c.strokeStyle = WHITE; c.lineWidth = 3; c.beginPath(); c.moveTo(hx0 - 30, deck - 36); c.lineTo(hx1 + 30, deck - 36);
    for (let x = hx0 - 30; x <= hx1 + 30; x += 20) { c.moveTo(x, deck - 36); c.lineTo(x, deck); } c.stroke();
    // the hut: aqua with coral stripes, rounded at the ends
    c.fillStyle = MINT; c.beginPath(); c.roundRect(hx0, roof + 8, hx1 - hx0, deck - roof - 8, [40, 40, 0, 0]); c.fill();
    c.save(); c.clip();
    for (let x = hx0 + 8; x < hx1; x += 34) { c.fillStyle = CORAL; c.fillRect(x, roof, 14, deck - roof); }
    c.fillStyle = 'rgba(40,60,80,.14)'; c.fillRect(TX + 60, roof, 70, deck - roof);
    c.restore();
    // its windows, a door, a porthole
    c.fillStyle = WIN; c.beginPath(); c.roundRect(TX - 86, roof + 46, 120, 50, 10); c.fill();
    c.fillStyle = WIN_L; c.fillRect(TX - 80, roof + 50, 108, 12);
    c.strokeStyle = WHITE; c.lineWidth = 3; c.beginPath(); c.roundRect(TX - 86, roof + 46, 120, 50, 10); c.moveTo(TX - 26, roof + 46); c.lineTo(TX - 26, roof + 96); c.stroke();
    porthole(c, TX + 74, roof + 70, 14, WHITE);
    // the roof: a lemon cap with an overhang
    c.fillStyle = LEMON; c.beginPath(); c.moveTo(hx0 - 26, roof + 14); c.quadraticCurveTo(TX, roof - 54, hx1 + 26, roof + 14); c.lineTo(hx1 + 26, roof + 26); c.lineTo(hx0 - 26, roof + 26); c.closePath(); c.fill();
    c.fillStyle = LEMON_D; c.fillRect(hx0 - 26, roof + 20, hx1 - hx0 + 52, 8);
    // the pole
    c.fillStyle = TEAL_D; c.fillRect(hx1 - 6, roof - 110, 5, 124);
  }, { t: 7.4, d: 1.2, reveal: 'rise', ease: 'out' });
}

// ================================================================ the people: on the drive, on the sand
function person(c, x, y, s, top, bottom, skin) {
  c.fillStyle = skin; c.fillRect(x - 3 * s, y - 14 * s, 2.6 * s, 14 * s); c.fillRect(x + 0.6 * s, y - 14 * s, 2.6 * s, 14 * s);
  c.fillStyle = bottom; c.fillRect(x - 4 * s, y - 20 * s, 8 * s, 7 * s);
  c.fillStyle = top; c.fillRect(x - 4.5 * s, y - 32 * s, 9 * s, 13 * s);
  c.fillStyle = skin; c.beginPath(); c.arc(x, y - 36 * s, 4 * s, 0, Math.PI * 2); c.fill();
}
function people(p, r) {
  const skins = ['#8a5a3a', '#d9a27a', '#b9805a', '#f0c8a0', '#6e4630'];
  // a row of walkers on the sidewalk and a cyclist
  const walkers = [];
  for (let i = 0; i < 11; i++) walkers.push([r.range(90, 1500), BASE + 22, r.range(1.05, 1.25), r.pick([CORAL, TEAL, WHITE, LEMON_D, PINK_D, '#3a6276']), r.pick([WHITE, '#3a6276', TEAL_D, SAND_D]), r.pick(skins)]);
  p.group('people', { x: M, y: BASE - 40, w: W - 2 * M, h: 70 }, (c) => {
    for (const w of walkers) person(c, ...w);
  }, { t: 8.0, d: 0.6, reveal: 'fade' });
  // sunbathers on towels and a pair walking at the water
  const bathers = [[300, 1724, CORAL], [560, 1664, TEAL], [880, 1690, LEMON_D]];
  p.group('people', { x: 200, y: 1560, w: 900, h: 220 }, (c) => {
    for (const [x, y, col] of bathers) {
      c.fillStyle = col; c.fillRect(x - 50, y - 12, 100, 22); c.fillStyle = WHITE; c.fillRect(x - 50, y - 4, 100, 5);
      c.fillStyle = skins[1]; c.fillRect(x - 36, y - 8, 64, 9);
      c.beginPath(); c.arc(x + 34, y - 4, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = PINK_D; c.fillRect(x - 6, y - 9, 14, 10);
    }
    person(c, 980, SURF - 6, 1.6, CORAL, CORAL, skins[0]);
    person(c, 1010, SURF - 10, 1.6, WHITE, TEAL_D, skins[3]);
    // a beach ball
    c.fillStyle = WHITE; c.beginPath(); c.arc(640, 1748, 13, 0, Math.PI * 2); c.fill();
    c.fillStyle = CORAL; c.beginPath(); c.moveTo(640, 1748); c.arc(640, 1748, 13, -0.5, 0.6); c.closePath(); c.fill();
    c.fillStyle = TEAL; c.beginPath(); c.moveTo(640, 1748); c.arc(640, 1748, 13, 1.6, 2.7); c.closePath(); c.fill();
  }, { t: 8.9, d: 0.6, reveal: 'pop' });
  // the lifeguard on the deck
  p.group('people', { x: TX - 100, y: TY - 330, w: 80, h: 90 }, (c) => person(c, TX - 64, TY - 190 * TS, 1.9, CORAL, CORAL, skins[2]), { t: 9.2, d: 0.4, reveal: 'pop' });
}

// ================================================================ what moves: palm crowns, the flag, a convertible, pelicans
function live(p, r) {
  const fronds = PALMS.map(() => {
    const out = [];
    for (let k = 0; k < 11; k++) {
      const a = -Math.PI + (k / 10) * Math.PI * 1.0 + r.range(-0.1, 0.1);
      const side = Math.cos(a);
      out.push({ a: k < 2 || k > 8 ? a + side * 0.25 : a, L: r.range(150, 190), droop: (Math.abs(side) ** 1.4) * 70 + 10, dark: k % 3 === 0, k: r.range(0.6, 1.4) });
    }
    for (let k = 0; k < 3; k++) out.push({ a: Math.PI * (0.15 + k * 0.35), L: r.range(110, 140), droop: 50, dark: true, k: 1 });
    return out.sort((x, y) => (y.dark ? 1 : 0) - (x.dark ? 1 : 0));
  });
  PALMS.forEach((pl, i) => {
    const [tx, ty] = pl.top, s = i === 1 || i === 4 ? 0.7 : 1;
    p.live('live', {
      t: 7.0 + i * 0.2, d: 0.6, reveal: 'pop', ease: 'back', box: { x: tx - 230 * s, y: ty - 120 * s, w: 460 * s, h: 260 * s },
      draw: (c, time) => crown(c, tx, ty, s, Math.sin(time * 1.1 + i * 1.3), fronds[i]),
    });
  });
  // the red flag on the tower
  const fx = TX + (120 - 6) * TS, fy = TY - (190 + 150 + 110) * TS;
  p.live('live', {
    t: 9.0, d: 0.5, box: { x: fx - 4, y: fy - 10, w: 100, h: 66 },
    draw: (c, time) => {
      c.fillStyle = CORAL_D; c.beginPath(); c.moveTo(fx + 6, fy);
      for (let k = 1; k <= 6; k++) { const u = k / 6; c.lineTo(fx + 6 + u * 80, fy + Math.sin(time * 6 - u * 4) * 6 * u); }
      for (let k = 6; k >= 0; k--) { const u = k / 6; c.lineTo(fx + 6 + u * 80, fy + 44 + Math.sin(time * 6 - u * 4) * 6 * u); }
      c.closePath(); c.fill();
    },
  });
  // a pastel convertible cruising up the drive, behind the palms
  p.live('street', {
    t: 9.2, d: 0.6, box: { x: M, y: ROAD0 - 40, w: W - 2 * M, h: ROAD1 - ROAD0 + 46 },
    draw: (c, time) => {
      const u = ((time - 9.2) * 0.06) % 1, x = lerp(-140, W + 140, u), y = ROAD1 - 12;
      c.fillStyle = PINK_D; c.beginPath(); c.moveTo(x - 90, y - 6); c.lineTo(x - 84, y - 28); c.lineTo(x - 30, y - 32); c.lineTo(x - 14, y - 46); c.lineTo(x + 20, y - 46); c.lineTo(x + 40, y - 32); c.lineTo(x + 88, y - 26); c.lineTo(x + 94, y - 6); c.closePath(); c.fill();
      c.fillStyle = WHITE; c.fillRect(x - 86, y - 20, 178, 5);
      c.fillStyle = WIN_L; c.beginPath(); c.moveTo(x - 10, y - 44); c.lineTo(x + 16, y - 44); c.lineTo(x + 30, y - 32); c.lineTo(x - 22, y - 32); c.closePath(); c.fill();
      c.fillStyle = INK; for (const dx of [-56, 58]) { c.beginPath(); c.arc(x + dx, y - 4, 13, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = WHITE; for (const dx of [-56, 58]) { c.beginPath(); c.arc(x + dx, y - 4, 5, 0, Math.PI * 2); c.fill(); }
    },
  });
  // pelicans gliding in a line over the hotels
  p.live('live', {
    t: 10.6, d: 0.8, box: { x: M, y: 380, w: W - 2 * M, h: 260 },
    draw: (c, time) => {
      const base = lerp(W + 100, -300, ((time - 10.6) * 0.035) % 1);
      c.fillStyle = INK;
      for (let k = 0; k < 4; k++) {
        const x = base + k * 70, y = 470 + k * 22 + Math.sin(time * 0.8 + k) * 4, f = Math.sin(time * 2.2 + k * 0.7) * 5;
        c.beginPath(); c.moveTo(x - 32, y - f); c.quadraticCurveTo(x - 14, y - 8, x, y); c.quadraticCurveTo(x + 14, y - 8, x + 32, y - f); c.lineTo(x + 30, y - f + 3); c.quadraticCurveTo(x + 12, y - 3, x, y + 4); c.quadraticCurveTo(x - 12, y - 3, x - 30, y - f + 3); c.closePath(); c.fill();
        c.fillRect(x - 14, y - 1, 8, 2.4);
      }
    },
  });
}

// ================================================================ the frame, the name in tubing, the caption
function title(p, r) {
  // the stepped deco frame
  const f = (inset) => {
    const a = M + inset, b = W - M - inset, t = M + inset, bt = PY1 - inset, st = 26;
    return [[a + st, t], [b - st, t], [b - st, t + st], [b, t + st], [b, bt - st], [b - st, bt - st], [b - st, bt], [a + st, bt], [a + st, bt - st], [a, bt - st], [a, t + st], [a + st, t + st], [a + st, t]];
  };
  p.pen('title', f(16), WHITE, 5, { t: 0.4, d: 1.6, cap: 'square' });
  p.pen('title', f(28), TEAL, 2.5, { t: 0.6, d: 1.6, cap: 'square' });
  // MIAMI across the sky, coral tubing with a hard teal shadow
  p.type('title', 'MIAMI', W / 2, 360, { family: TITLE, size: 300, fit: 1280, color: CORAL, shadow: TEAL_D, sx: 8, sy: 8, align: 'center', t: 10.8, gap: 0.22, d: 0.6, reveal: 'press' });
  // the caption band below the picture: speed lines either side
  p.group('title', { x: M, y: PY1 + 10, w: W - 2 * M, h: H - M - PY1 - 10 }, (c) => {
    c.font = `400 40px ${CAP}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = TEAL_D; c.fillText('OCEAN DRIVE · SOUTH BEACH · FLORIDA', W / 2, (PY1 + H - M) / 2 + 2);
    const tw = c.measureText('OCEAN DRIVE · SOUTH BEACH · FLORIDA').width;
    c.fillStyle = CORAL;
    for (let k = 0; k < 3; k++) {
      const y = (PY1 + H - M) / 2 - 10 + k * 10;
      c.fillRect(M + 40 + k * 30, y, W / 2 - tw / 2 - 70 - M - k * 30, 3);
      c.fillRect(W / 2 + tw / 2 + 30, y, W / 2 - tw / 2 - 70 - M - k * 30, 3);
    }
  }, { t: 12.2, d: 0.8, reveal: 'iris', ease: 'out' });
}
