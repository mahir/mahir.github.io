// New Orleans: a screen-printed jazz poster. Down a French Quarter street at
// sundown, between painted townhouses with two stories of cast-iron galleries,
// lace railings, hanging ferns and bougainvillea, gas lamps on the posts, to
// St. Louis Cathedral's three spires over Jackson Square. A streetcar comes up
// the street and a brass band marches toward us under a parasol. A few flat
// inks with halftone dots, a little off register; the name in a wood-type face
// in a plum band, brass instruments along the foot.

import { Plate, W, H } from '../print.js';
import { lerp, rng, shade, mix } from '../kit.js';

const CREAM = '#f1e5cb', INK = '#2a1c33', PLUM = '#46285e', PLUM_D = '#341d47';
const GOLD = '#e8a92f', GOLD_L = '#f3c25a', CORAL = '#d9573e', CORAL_L = '#ea8a6a';
const GREEN = '#2f6a52', GREEN_L = '#5c9471', TEAL = '#3b8582', PINK = '#e9a28d', OCHRE = '#d68e3a', SKY_T = '#e2735a', SKY_M = '#efa25a', SKY_L = '#f6cf7c';
const MAGENTA = '#c23f6e';
const F = '"Rye", serif';

export const city = {
  id: 'new-orleans', name: 'New Orleans', wall: '#2a1a35',
  alt: "A screen-printed jazz poster looking down a French Quarter street at sundown, painted townhouses with two stories of cast-iron galleries, lace railings, hanging ferns, bougainvillea and gas lamps, to the three spires of St. Louis Cathedral over Jackson Square, with a red streetcar and a brass band marching under a parasol, the name in wood type above and brass instruments along the foot",
  google: 'family=Rye',
  fonts: [['400 160px "Rye"', 'NEW ORLEANS'], ['400 30px "Rye"', 'VIEUX CARRÉ · LOUISIANA · JACKSON SQUARE DESIRE']],
  build,
};

// the street in one-point perspective: X across (meters), Y up, Z away
const VX = W / 2, HZ = 1190, FOC = 860, EYE = 1.6;
const P = (x, y, z) => [VX + (FOC * x) / z, HZ - (FOC * (y - EYE)) / z];
const FAC = 6, CURB = 3.4, BAY = 3.4, Z0 = 2.0, ZEND = 38;
// the print: a cream margin, a plum band for the name, the picture, the band at the foot
const M = 52, TOP = 372, FOOT = 1736;

function build() {
  const p = new Plate({ paper: CREAM, seed: 1718 });
  const r = p.r;
  p.clip = { x: M, y: TOP, w: W - 2 * M, h: FOOT - TOP };
  p.stack('sky', 'cath', 'square', 'facade', 'gallery', 'street', 'car', 'band', 'lamps', 'notes', 'frame', 'title');
  for (const n of ['frame', 'title']) p.layer(n, { clip: false });

  frame(p);
  sky(p, r);
  cathedral(p);
  square(p, r);
  street(p, r);
  houses(p, r);
  streetcar(p);
  band(p);
  life(p);
  title(p);
  return p;
}

// ================================================================ helpers
function path(c, pts, close = true) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath(); }
function addPoly(c, pts) { pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }
function boxOfPts(pts, pad = 4) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}
// a quad on a wall at X, from (z0, y0) to (z1, y1)
const wallQ = (X, z0, z1, y0, y1) => [P(X, y0, z0), P(X, y0, z1), P(X, y1, z1), P(X, y1, z0)];
// a quad level at Y, between X0 and X1, from z0 to z1
const flatQ = (x0, x1, y, z0, z1) => [P(x0, y, z0), P(x0, y, z1), P(x1, y, z1), P(x1, y, z0)];

// ================================================================ the print's frame: a plum band above, another at the foot
function frame(p) {
  p.mark('frame', {
    t: 0, d: 0.9, reveal: 'fall', ease: 'inOut', box: { x: M, y: M, w: W - 2 * M, h: TOP - M + 4 },
    draw: (c) => { c.fillStyle = PLUM; c.fillRect(M, M, W - 2 * M, TOP - M); },
  });
  p.mark('frame', {
    t: 0.3, d: 0.9, reveal: 'rise', ease: 'inOut', box: { x: M, y: FOOT - 4, w: W - 2 * M, h: H - M - FOOT + 8 },
    draw: (c) => { c.fillStyle = PLUM; c.fillRect(M, FOOT, W - 2 * M, H - M - FOOT); },
  });
  // fine gold rules inside the bands
  p.mark('frame', {
    t: 0.9, d: 1.0, reveal: 'wipe', ease: 'inOut', box: { x: M, y: M, w: W - 2 * M, h: H - 2 * M },
    draw: (c) => {
      c.strokeStyle = GOLD; c.lineWidth = 2;
      c.strokeRect(M + 16, M + 16, W - 2 * M - 32, TOP - M - 32);
      c.strokeRect(M + 16, FOOT + 16, W - 2 * M - 32, H - M - FOOT - 32);
      c.lineWidth = 1; c.strokeRect(M + 22, M + 22, W - 2 * M - 44, TOP - M - 44);
      c.strokeRect(M + 22, FOOT + 22, W - 2 * M - 44, H - M - FOOT - 44);
    },
  });
}

// ================================================================ the sky: flat inks with halftone where they meet
function dotsBand(r, y0, y1, step, rmax, up) {
  // a halftone ramp: dots growing from nothing at one edge to full at the other
  const out = [];
  let row = 0;
  for (let y = y0; y < y1; y += step, row++) {
    const k = (y - y0) / (y1 - y0), rad = rmax * (up ? 1 - k : k);
    if (rad < 0.5) continue;
    for (let x = M + (row % 2) * step / 2; x < W - M; x += step) out.push([x, y, rad]);
  }
  return out;
}
function sky(p, r) {
  const sun = P(0, 28, 44);
  p.mark('sky', {
    t: 0.6, d: 1.2, reveal: 'rise', box: { x: M, y: TOP, w: W - 2 * M, h: FOOT - TOP },
    draw: (c) => {
      c.fillStyle = SKY_L; c.fillRect(M, TOP, W - 2 * M, HZ - TOP + 40);
      c.fillStyle = SKY_M; c.fillRect(M, TOP, W - 2 * M, 760 - TOP);
      c.fillStyle = SKY_T; c.fillRect(M, TOP, W - 2 * M, 560 - TOP);
    },
  });
  const d1 = dotsBand(r, 560, 660, 11, 5.6, true), d2 = dotsBand(r, 760, 880, 11, 5.6, true);
  p.mark('sky', {
    t: 1.2, d: 1.0, reveal: 'fall', box: { x: M, y: 556, w: W - 2 * M, h: 330 },
    draw: (c) => {
      c.fillStyle = SKY_T; c.beginPath(); for (const [x, y, rad] of d1) { c.moveTo(x + rad, y); c.arc(x, y, rad, 0, Math.PI * 2); } c.fill();
      c.fillStyle = SKY_M; c.beginPath(); for (const [x, y, rad] of d2) { c.moveTo(x + rad, y); c.arc(x, y, rad, 0, Math.PI * 2); } c.fill();
    },
  });
  // the low sun behind the cathedral, a cream disk ringed in dots
  const [sx, sy] = [sun[0], sun[1] + 140];
  p.mark('sky', {
    t: 1.6, d: 1.2, reveal: 'iris', box: { x: sx - 270, y: sy - 270, w: 540, h: 540 },
    draw: (c) => {
      c.fillStyle = CREAM; c.beginPath(); c.arc(sx, sy, 190, 0, Math.PI * 2); c.fill();
      c.fillStyle = CREAM;
      for (let ring = 0; ring < 5; ring++) {
        const rr = 206 + ring * 14, n = Math.round((2 * Math.PI * rr) / 14), rad = 4.4 - ring * 0.8;
        c.beginPath();
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + ring * 0.2; c.moveTo(sx + Math.cos(a) * rr + rad, sy + Math.sin(a) * rr); c.arc(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr, rad, 0, Math.PI * 2); }
        c.fill();
      }
    },
  });
  // a few birds far off
  p.mark('sky', {
    t: 2.4, d: 0.8, reveal: 'fade', box: { x: 400, y: 440, w: 800, h: 160 },
    draw: (c) => {
      c.strokeStyle = INK; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath();
      for (const [x, y, s] of [[520, 520, 1], [560, 500, 0.8], [1060, 470, 0.9], [1100, 492, 0.7], [1020, 500, 0.6]]) { c.moveTo(x - 12 * s, y - 4 * s); c.quadraticCurveTo(x - 5 * s, y - 10 * s, x, y); c.quadraticCurveTo(x + 5 * s, y - 10 * s, x + 12 * s, y - 4 * s); }
      c.stroke();
    },
  });
}

// ================================================================ St. Louis Cathedral, at the end of the street
function cathedral(p) {
  const Z = 44, K = 1.0, KX = 0.95; // drawn taller than life, and the towers closer, as posters do
  const q = (x, y) => P(x * K * KX, y * K, Z);
  const ink = (c, pts) => { path(c, pts); c.fill(); };
  const WHITE = '#f6eedb', SHADE = '#e2d2b4';
  // the arch of an opening in the facade's plane
  const arch = (c, x0, x1, y0, y1) => { const [a, b] = q(x0, y0), [a2] = q(x1, y0), [, b2] = q(x0, y1), w = a2 - a; c.moveTo(a, b); c.lineTo(a, b2 + w / 2); c.arc(a + w / 2, b2 + w / 2, w / 2, Math.PI, 0); c.lineTo(a2, b); c.closePath(); };
  const all = [q(-14, 0), q(14, 0), q(0, 43)];
  // the body and towers first
  p.group('cath', boxOfPts(all, 40), (c) => {
    c.fillStyle = WHITE;
    ink(c, [q(-13, 0), q(13, 0), q(13, 16), q(-13, 16)]);
    // the pediment-like stepped top of the middle
    ink(c, [q(-3.8, 16), q(3.8, 16), q(3.8, 21.5), q(-3.8, 21.5)]);
    ink(c, [q(-3.1, 21.5), q(3.1, 21.5), q(3.1, 27.6), q(-3.1, 27.6)]);
    for (const sx of [-1, 1]) {
      ink(c, [q(sx * 9.2, 0), q(sx * 13.6, 0), q(sx * 13.6, 23), q(sx * 9.2, 23)]);
      ink(c, [q(sx * 9.8, 23), q(sx * 13, 23), q(sx * 13, 26.4), q(sx * 9.8, 26.4)]);
    }
    // shade down the right of each tower
    c.fillStyle = SHADE;
    for (const [x0, x1, y1] of [[12.4, 13.6, 23], [-10.2, -9.2, 23], [2.8, 3.8, 21.5]]) ink(c, [q(x0, 0), q(x1, 0), q(x1, y1), q(x0, y1)]);
    // cornices across, the paired pilasters
    c.fillStyle = '#d7c39c';
    for (const y of [7.4, 15.4]) ink(c, [q(-13.2, y), q(13.2, y), q(13.2, y + 0.6), q(-13.2, y + 0.6)]);
    for (const [x0, x1, y] of [[-3.9, 3.9, 21.2], [-3.2, 3.2, 27.3], [-13.8, -9.0, 22.7], [9.0, 13.8, 22.7], [-13.2, -9.6, 26.1], [9.6, 13.2, 26.1]]) ink(c, [q(x0, y), q(x1, y), q(x1, y + 0.5), q(x0, y + 0.5)]);
    c.strokeStyle = '#c9b48c'; c.lineWidth = 1.2; c.beginPath();
    for (const x of [-12.6, -12.0, -9.8, -9.2, -3.6, -3.0, 3.0, 3.6, 9.2, 9.8, 12.0, 12.6]) { const [a, b] = q(x, 0), [, b2] = q(x, 15.4); c.moveTo(a, b); c.lineTo(a, b2); }
    c.stroke();
    // the doors, the windows, the belfry openings with their louvers
    c.fillStyle = PLUM; c.beginPath();
    arch(c, -1.7, 1.7, 0, 6.2); arch(c, -7.2, -5.2, 0, 5.2); arch(c, 5.2, 7.2, 0, 5.2);
    arch(c, -1.5, 1.5, 9.0, 14.2); arch(c, -7.0, -5.4, 9.4, 13.6); arch(c, 5.4, 7.0, 9.4, 13.6);
    arch(c, -12.2, -10.6, 9.4, 13.6); arch(c, 10.6, 12.2, 9.4, 13.6); arch(c, -12.2, -10.6, 1.4, 5.6); arch(c, 10.6, 12.2, 1.4, 5.6);
    arch(c, -12.1, -10.7, 17.4, 21.6); arch(c, 10.7, 12.1, 17.4, 21.6);
    arch(c, -1.3, 1.3, 22.4, 26.6);
    c.fill();
    c.strokeStyle = WHITE; c.lineWidth = 1; c.beginPath();
    for (const [x0, x1, y0, y1] of [[-12.1, -10.7, 17.6, 20.8], [10.7, 12.1, 17.6, 20.8], [-1.3, 1.3, 22.6, 25.8]]) for (let y = y0 + 0.5; y < y1; y += 0.55) { const [a, b] = q(x0, y), [a2] = q(x1, y); c.moveTo(a, b); c.lineTo(a2, b); }
    c.stroke();
    // the clock
    const [cx, cy] = q(0, 18.6), cr = (FOC / Z) * K * 1.35;
    c.fillStyle = INK; c.beginPath(); c.arc(cx, cy, cr + 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = CREAM; c.beginPath(); c.arc(cx, cy, cr, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - cr * 0.75); c.moveTo(cx, cy); c.lineTo(cx + cr * 0.5, cy + cr * 0.2); c.stroke();
    c.lineWidth = 1.2; c.beginPath(); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.moveTo(cx + Math.cos(a) * cr * 0.82, cy + Math.sin(a) * cr * 0.82); c.lineTo(cx + Math.cos(a) * cr * 0.95, cy + Math.sin(a) * cr * 0.95); } c.stroke();
  }, { t: 2.0, d: 1.6, reveal: 'rise', ease: 'soft' });
  // the slate spires, drawn up after: the tall middle one with its dormers, the two hexagonal ones
  p.group('cath', boxOfPts([q(-14, 26), q(14, 26), q(0, 44)], 30), (c) => {
    c.fillStyle = INK;
    ink(c, [q(-3.0, 27.8), q(3.0, 27.8), q(0.22, 42), q(-0.22, 42)]);
    for (const sx of [-1, 1]) ink(c, [q(sx * 9.8, 26.6), q(sx * 13.0, 26.6), q(sx * 11.4 + 0.15, 34.5), q(sx * 11.4 - 0.15, 34.5)]);
    // the facets of the hexagonal spires, lighter on one face
    c.fillStyle = '#4b3a5c';
    for (const sx of [-1, 1]) ink(c, [q(sx * 10.9, 26.6), q(sx * 11.9, 26.6), q(sx * 11.4 + 0.05, 34.5), q(sx * 11.4 - 0.05, 34.5)]);
    ink(c, [q(-0.9, 27.8), q(0.9, 27.8), q(0.05, 42), q(-0.05, 42)]);
    // dormer lights on the tall spire
    c.fillStyle = GOLD_L;
    for (const [y, w] of [[30.5, 0.55], [34.2, 0.42]]) ink(c, [q(-w, y), q(w, y), q(w, y + 1.1), q(0, y + 1.6), q(-w, y + 1.1)]);
    // the crosses at the tops
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath();
    for (const [x, y, s] of [[0, 42, 1], [-11.4, 34.5, 0.7], [11.4, 34.5, 0.7]]) { const [a, b] = q(x, y); c.moveTo(a, b); c.lineTo(a, b - 28 * s); c.moveTo(a - 8 * s, b - 20 * s); c.lineTo(a + 8 * s, b - 20 * s); }
    c.stroke();
  }, { t: 3.0, d: 1.2, reveal: 'rise' });
}

// ================================================================ Jackson Square: its fence, its trees, the lamps
function square(p, r) {
  const Z = 41;
  const trees = [];
  const rr = rng(5);
  for (let i = 0; i < 12; i++) trees.push([rr.range(-10, 10), rr.range(3.2, 5.2), Z + rr.range(0, 4)]);
  trees.sort((a, b) => b[2] - a[2]);
  const area = [P(-8, 0, Z), P(8, 0, Z), P(8, 9, Z), P(-8, 9, Z)];
  p.group('square', boxOfPts(area, 40), (c) => {
    for (const [x, y, z] of trees) {
      const [a, b] = P(x, y, z), s = FOC / z;
      c.fillStyle = GREEN; c.beginPath(); c.arc(a, b, s * 2.4, 0, Math.PI * 2); c.arc(a - s * 1.6, b + s * 0.8, s * 1.8, 0, Math.PI * 2); c.arc(a + s * 1.7, b + s * 0.7, s * 1.9, 0, Math.PI * 2); c.fill();
      c.fillStyle = GREEN_L; c.beginPath(); c.arc(a - s * 0.6, b - s * 0.8, s * 1.1, 0, Math.PI * 2); c.fill();
      c.fillStyle = INK; const [, g] = P(x, 0, z); c.fillRect(a - s * 0.18, b + s * 1.2, s * 0.36, g - b - s * 1.2);
    }
    // the iron fence with gilt spear tips, and the pavement before it
    const [a0, gy] = P(-8, 0, Z), [a1] = P(8, 0, Z), [, ty] = P(0, 1.7, Z);
    c.fillStyle = '#e3cfa6'; c.fillRect(a0 - 40, gy, a1 - a0 + 80, 6);
    c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath();
    c.moveTo(a0 - 40, ty); c.lineTo(a1 + 40, ty); c.moveTo(a0 - 40, gy - 4); c.lineTo(a1 + 40, gy - 4);
    for (let x = a0 - 40; x < a1 + 40; x += 4.5) { c.moveTo(x, gy); c.lineTo(x, ty - 4); }
    c.stroke();
    c.fillStyle = GOLD; c.beginPath(); for (let x = a0 - 40; x < a1 + 40; x += 9) { c.moveTo(x - 1.6, ty - 3); c.lineTo(x, ty - 8); c.lineTo(x + 1.6, ty - 3); } c.fill();
  }, { t: 3.0, d: 1.0, reveal: 'rise' });
}

// ================================================================ the street: pavement, curbs, the streetcar's rails and wire
function street(p, r) {
  const road = [P(-CURB, 0, Z0), P(CURB, 0, Z0), P(CURB, 0, ZEND), P(-CURB, 0, ZEND)];
  p.mark('street', {
    t: 2.6, d: 1.2, reveal: 'fall', ease: 'soft', box: { x: M, y: 1180, w: W - 2 * M, h: FOOT - 1180 },
    draw: (c) => {
      // the asphalt, the brick sidewalks, the granite curbs
      c.fillStyle = '#b88f74'; path(c, road); c.fill();
      for (const s of [-1, 1]) {
        c.fillStyle = '#c96f50'; path(c, [P(s * CURB, 0, Z0), P(s * FAC, 0, Z0), P(s * FAC, 0, ZEND), P(s * CURB, 0, ZEND)]); c.fill();
        c.fillStyle = '#e8d5b0'; path(c, [P(s * CURB, 0, Z0), P(s * (CURB - 0.25), 0, Z0), P(s * (CURB - 0.25), 0, ZEND), P(s * CURB, 0, ZEND)]); c.fill();
      }
      // the rails: two pairs of lines toward the cathedral
      c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath();
      for (const x of [-0.72, 0.72]) { const [a, b] = P(x, 0, Z0), [a2, b2] = P(x, 0, ZEND); c.moveTo(a, b); c.lineTo(a2, b2); }
      c.stroke();
      // halftone in the road, darker near
      c.fillStyle = 'rgba(42,28,51,.22)'; c.beginPath();
      for (let z = Z0 + 0.3; z < 22; z *= 1.1) {
        const step = Math.max(0.14, 0.3 * (z / 10));
        for (let x = -CURB + 0.3; x < CURB - 0.3; x += step) { const [a, b] = P(x, 0, z), rad = Math.max(0.5, (FOC / z) * 0.032 * (1 - z / 24)); c.moveTo(a + rad, b); c.arc(a, b, rad, 0, Math.PI * 2); }
      }
      c.fill();
      // bricks in the sidewalks: a line now and then across
      c.strokeStyle = 'rgba(42,28,51,.35)'; c.lineWidth = 1; c.beginPath();
      for (let z = Z0; z < ZEND; z += 0.6) for (const s of [-1, 1]) { const [a, b] = P(s * CURB, 0, z), [a2, b2] = P(s * FAC, 0, z); c.moveTo(a, b); c.lineTo(a2, b2); }
      c.stroke();
    },
  });
  // a water meter cover in the street: the crescent moon and stars cast in iron
  const mz = 3.3, mx = -1.25, rad = 0.42;
  const ring = [];
  for (let k = 0; k <= 40; k++) { const a = (k / 40) * Math.PI * 2; ring.push(P(mx + Math.cos(a) * rad, 0, mz + Math.sin(a) * rad)); }
  const stars = [];
  for (let k = 0; k < 13; k++) { const a = (k / 13) * Math.PI * 2; stars.push(P(mx + Math.cos(a) * rad * 0.78, 0, mz + Math.sin(a) * rad * 0.78)); }
  const moon = [];
  for (let k = 0; k <= 16; k++) { const a = Math.PI * 0.6 + (k / 16) * Math.PI * 1.8; moon.push(P(mx + Math.cos(a) * rad * 0.42, 0, mz + Math.sin(a) * rad * 0.42)); }
  for (let k = 16; k >= 0; k--) { const a = Math.PI * 0.75 + (k / 16) * Math.PI * 1.5; moon.push(P(mx + 0.08 + Math.cos(a) * rad * 0.32, 0, mz + Math.sin(a) * rad * 0.32)); }
  p.mark('street', {
    t: 4.0, d: 0.6, reveal: 'fade', box: boxOfPts(ring, 8),
    draw: (c) => {
      c.fillStyle = '#4a3a4e'; path(c, ring); c.fill();
      c.strokeStyle = '#7a6670'; c.lineWidth = 3; path(c, ring); c.stroke();
      c.fillStyle = '#a8928c'; path(c, moon); c.fill();
      c.beginPath(); for (const [x, y] of stars) { c.moveTo(x + 4, y); c.arc(x, y, 4, 0, Math.PI * 2); } c.fill();
    },
  });
}

// ================================================================ the houses and their galleries
const PALETTE = [CORAL, OCHRE, TEAL, PINK, GOLD_L, GREEN_L, '#cf6f87', '#e7c07a'];
function houses(p, r) {
  // bays from near to far on each side; the houses are runs of two or three bays
  const sides = [];
  for (const s of [-1, 1]) {
    const bays = [];
    let z = Z0 - 0.6, k = s < 0 ? 0 : 3, left = 0, col = null, top = 12, stories = 3;
    while (z < ZEND - 0.5) {
      if (left === 0) {
        col = PALETTE[k++ % PALETTE.length]; left = r.pick([2, 2, 3]);
        // three stories near, mostly two farther on, so the spires show over the roofs
        stories = z < 11 ? 3 : 2;
        top = 4 * stories + r.pick([0.2, 0.7, 1.2]);
      }
      const z1 = Math.min(ZEND, z + BAY);
      bays.push({ s, z0: z, z1, col, top, stories, gr: 4 * stories - 0.2, shutter: col === TEAL || col === GREEN_L ? GOLD : GREEN, fern: r.chance(0.8), fern2: stories === 3 && r.chance(0.7), boug: r.chance(0.35), beads: z < 16 && r.chance(0.6) ? [[z + 0.3, z + 1.6, 0.7], [z + 1.0, z + 2.4, 1.0], [z + 1.9, z + 3.1, 0.55]] : null });
      left--; z = z1;
    }
    sides.push(bays);
  }
  // facades rise from far to near, the two sides by turns
  const all = [...sides[0], ...sides[1]].sort((a, b) => b.z0 - a.z0);
  all.forEach((b, i) => {
    const t = 3.2 + i * 0.1;
    p.group('facade', boxOfPts(wallQ(b.s * FAC, b.z0, b.z1, 0, b.top + 3), 6), (c) => facade(c, b), { t, d: 0.8, reveal: 'rise' });
  });
  // then the galleries, far to near: floors, posts, railings of lace, ferns
  all.forEach((b, i) => {
    const t = 5.2 + i * 0.12;
    const pts = [...wallQ(b.s * CURB, b.z0, b.z1, 0, b.gr + 0.4), ...wallQ(b.s * FAC, b.z0, b.z1, 0, b.gr + 0.4)];
    p.group('gallery', boxOfPts(pts, 12), (c) => gallery(c, b), { t, d: 0.9, reveal: b.z0 < 6 ? 'fade' : 'rise' });
  });
  all.forEach((b, i) => {
    if (!b.fern && !b.fern2 && !b.boug && !b.beads) return;
    const pts = [...wallQ(b.s * CURB, b.z0, b.z1, 2, b.gr + 0.4), ...wallQ(b.s * (CURB + 1), b.z0, b.z1, 2, b.gr + 0.4)];
    p.group('gallery', boxOfPts(pts, 40), (c) => greenery(c, b), { t: 7.6 + i * 0.07, d: 0.7, reveal: 'pop' });
  });
}

function facade(c, b) {
  const X = b.s * FAC, mid = (b.z0 + b.z1) / 2;
  const near = b.z0 < 14;
  c.fillStyle = b.col; path(c, wallQ(X, b.z0, b.z1, 0, b.top)); c.fill();
  // the cornice and a parapet
  c.fillStyle = INK; path(c, wallQ(X, b.z0, b.z1, b.top - 0.35, b.top)); c.fill();
  c.fillStyle = CREAM; path(c, wallQ(X, b.z0, b.z1, b.top - 0.75, b.top - 0.45)); c.fill();
  // a tall French door on each floor, its shutters folded back
  for (const [y0, y1, arched] of [[0.15, 3.3, true], [4.3, 7.2, false], [8.3, 11.0, false]].slice(0, b.stories)) {
    const w = 0.62;
    c.fillStyle = PLUM_D; path(c, wallQ(X, mid - w, mid + w, y0, y1)); c.fill();
    if (arched) { c.fillStyle = INK; path(c, wallQ(X, mid - w, mid + w, y1 - 0.5, y1)); c.fill(); }
    // the panes: a cross of mullions
    c.strokeStyle = b.col; c.lineWidth = Math.max(0.6, 50 / mid * 0.05); c.beginPath();
    for (const zz of [mid]) { const [a, bb] = P(X, y0, zz), [a2, b2] = P(X, y1, zz); c.moveTo(a, bb); c.lineTo(a2, b2); }
    for (let k = 1; k < 4; k++) { const yy = lerp(y0, y1, k / 4); const [a, bb] = P(X, yy, mid - w), [a2, b2] = P(X, yy, mid + w); c.moveTo(a, bb); c.lineTo(a2, b2); }
    c.stroke();
    c.fillStyle = b.shutter;
    for (const [za, zb] of [[mid - w - 0.62, mid - w - 0.04], [mid + w + 0.04, mid + w + 0.62]]) { path(c, wallQ(X, za, zb, y0, y1)); c.fill(); }
    if (near) {
      // louvers on the shutters
      c.strokeStyle = 'rgba(42,28,51,.45)'; c.lineWidth = 0.8; c.beginPath();
      for (const [za, zb] of [[mid - w - 0.62, mid - w - 0.04], [mid + w + 0.04, mid + w + 0.62]]) for (let yy = y0 + 0.12; yy < y1; yy += 0.16) { const [a, bb] = P(X, yy, za), [a2, b2] = P(X, yy, zb); c.moveTo(a, bb); c.lineTo(a2, b2); }
      c.stroke();
    }
  }
  // the edge of the house against the next
  c.strokeStyle = 'rgba(42,28,51,.55)'; c.lineWidth = 1; c.beginPath();
  const [a, bb] = P(X, 0, b.z0), [a2, b2] = P(X, b.top, b.z0); c.moveTo(a, bb); c.lineTo(a2, b2); c.stroke();
}

function gallery(c, b) {
  const s = b.s, Xc = s * CURB, Xf = s * FAC, z0 = b.z0, z1 = b.z1, near = z0 < 16;
  const lw = (z, k) => Math.max(0.7, (FOC / z) * k);
  const floors = b.stories === 3 ? [4, 8, b.gr] : [4, b.gr];
  for (const fy of floors) {
    // the floor seen from below: the house's color in shade, the roof darker
    c.fillStyle = fy === b.gr ? mix(b.col, PLUM_D, 0.7) : mix(b.col, PLUM, 0.5); path(c, flatQ(Xf, Xc, fy, z0, z1)); c.fill();
    // its edge, a fascia board
    c.fillStyle = INK; path(c, wallQ(Xc, z0, z1, fy - 0.22, fy + 0.05)); c.fill();
    if (fy < b.gr) {
      // the railing: rails, pickets and a row of lace rings
      const [ya, yb] = [fy + 0.06, fy + 1.0];
      c.strokeStyle = INK; c.lineWidth = lw(z0, 0.05); c.beginPath();
      for (const yy of [ya + 0.08, yb - 0.04, yb - 0.2]) { const [a, bb] = P(Xc, yy, z0), [a2, b2] = P(Xc, yy, z1); c.moveTo(a, bb); c.lineTo(a2, b2); }
      c.stroke();
      c.lineWidth = lw(z0, 0.022); c.beginPath();
      const n = Math.round((z1 - z0) / (near ? 0.1 : 0.2));
      for (let i = 0; i <= n; i++) { const z = lerp(z0, z1, i / n); const [a, bb] = P(Xc, ya + 0.08, z), [a2, b2] = P(Xc, yb - 0.2, z); c.moveTo(a, bb); c.lineTo(a2, b2); }
      if (near) {
        // rings between the pickets, and little arcs along the top
        for (let z = z0 + 0.25; z < z1 - 0.1; z += 0.5) {
          for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI * 2; const [x, y] = P(Xc, ya + 0.5 + Math.sin(a) * 0.2, z + Math.cos(a) * 0.2); k ? c.lineTo(x, y) : c.moveTo(x, y); }
          for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI; const [x, y] = P(Xc, yb - 0.2 + Math.sin(a) * 0.12, z + 0.25 + Math.cos(a) * 0.12); k ? c.lineTo(x, y) : c.moveTo(x, y); }
        }
      }
      c.stroke();
    }
    // lace brackets in the corners under each floor, at both posts
    if (near) {
      c.strokeStyle = INK; c.lineWidth = lw(z0, 0.03); c.beginPath();
      for (const zp of [z0, z1]) for (const dir of [1, -1]) {
        if ((zp === z0 && dir < 0) || (zp === z1 && dir > 0)) continue;
        for (const rr of [0.55, 0.38]) {
          for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI / 2; const [x, y] = P(Xc, fy - 0.22 - rr + Math.sin(a) * rr, zp + dir * (rr - Math.cos(a) * rr)); k ? c.lineTo(x, y) : c.moveTo(x, y); }
        }
      }
      // a valance of small scallops along the fascia
      for (let z = z0 + 0.08; z < z1; z += 0.22) { for (let k = 0; k <= 6; k++) { const a = (k / 6) * Math.PI; const [x, y] = P(Xc, fy - 0.24 - Math.sin(a) * 0.1, z + 0.11 - Math.cos(a) * 0.11); k ? c.lineTo(x, y) : c.moveTo(x, y); } }
      c.stroke();
    }
  }
  // the post at the near end of the bay: slim cast iron, top to bottom
  const [pa, pb] = P(Xc, 0, z0), [, pt] = P(Xc, b.gr, z0);
  const pw = (FOC / z0) * 0.16;
  c.fillStyle = INK; c.fillRect(pa - pw / 2, pt, pw, pb - pt);
  // its capitals and collars at each floor
  for (const fy of floors.map((y) => y - 0.4)) { const [, cy] = P(Xc, fy, z0); c.fillRect(pa - pw, cy, pw * 2, (FOC / z0) * 0.16); }
  // the soffit's shade dots, near only
  if (near) {
    c.fillStyle = 'rgba(30,14,40,.3)'; c.beginPath();
    for (const fy of floors.slice(0, -1)) for (let z = z0 + 0.2; z < z1; z += 0.35) for (let x = 0.2; x < FAC - CURB; x += 0.35) { const [a, bb] = P(s * (CURB + x), fy, z), rad = (FOC / z) * 0.05 * (x / (FAC - CURB)); if (rad > 0.4) { c.moveTo(a + rad, bb); c.arc(a, bb, rad, 0, Math.PI * 2); } }
    c.fill();
  }
}

// ferns hanging in baskets, bougainvillea spilling over the railing
function fernAt(c, x, y, s) {
  c.strokeStyle = INK; c.lineWidth = Math.max(0.5, s * 0.02);
  c.beginPath(); c.moveTo(x, y - s * 1.0); c.lineTo(x, y - s * 0.32); c.stroke();
  c.fillStyle = GREEN;
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k - 4) * 0.36, L = s * (0.9 - Math.abs(k - 4) * 0.06);
    const ex = x + Math.cos(a) * L * 0.6 + Math.sin(a) * 0, ey = y - s * 0.2 + Math.abs(Math.cos(a)) * L * 0.9;
    c.beginPath(); c.moveTo(x, y - s * 0.22);
    c.quadraticCurveTo(x + Math.cos(a) * L * 0.9, y - s * 0.4, ex, ey);
    c.quadraticCurveTo(x + Math.cos(a) * L * 0.5, y - s * 0.1, x, y - s * 0.16);
    c.fill();
  }
  c.fillStyle = GREEN_L;
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.5; c.beginPath(); c.ellipse(x + Math.cos(a) * s * 0.22, y - s * 0.28, s * 0.2, s * 0.07, a, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = OCHRE; c.beginPath(); c.ellipse(x, y - s * 0.24, s * 0.2, s * 0.1, 0, 0, Math.PI); c.fill();
}
function greenery(c, b) {
  const s = b.s, Xc = s * CURB, mid = (b.z0 + b.z1) / 2;
  const sc = FOC / mid;
  if (b.fern) { const [x, y] = P(s * (CURB + 0.35), 6.6, mid); fernAt(c, x, y, sc * 0.75); }
  if (b.fern2) { const [x, y] = P(s * (CURB + 0.35), 10.5, mid + 0.3); fernAt(c, x, y, sc * 0.7); }
  if (b.beads) {
    // Mardi Gras beads looped over the lower railing: purple, gold and green
    const cols = [PLUM, GOLD, GREEN];
    for (const [k, loop] of b.beads.entries()) {
      c.fillStyle = cols[k % 3];
      c.beginPath();
      for (let i = 0; i <= 26; i++) {
        const t = i / 26, z = lerp(loop[0], loop[1], t), y = 5.0 - Math.sin(t * Math.PI) * loop[2];
        const [x, yy] = P(Xc, y, z), rad = sc * 0.028;
        c.moveTo(x + rad, yy); c.arc(x, yy, rad, 0, Math.PI * 2);
      }
      c.fill();
    }
  }
  if (b.boug) {
    // a mass of small magenta bracts over the upper railing, with leaves
    const rr = rng(Math.round(b.z0 * 100) + (s > 0 ? 7 : 0));
    const dots = [];
    for (let i = 0; i < 70; i++) { const z = rr.range(b.z0 + 0.2, b.z1 - 0.2), y = 8.9 - rr.range(0, 1) ** 1.6 * 2.6 + rr.range(0, 0.3); dots.push([...P(Xc, y, z), sc * rr.range(0.05, 0.1), rr.chance(0.3)]); }
    for (const [x, y, rad, leaf] of dots) { c.fillStyle = leaf ? GREEN : rad > sc * 0.08 ? MAGENTA : CORAL_L; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill(); }
  }
}

// ================================================================ the streetcar, coming up the street
function carAt(c, z) {
  const q = (x, y) => P(x, y, z), k = FOC / z;
  const [x0, yb] = q(-1.3, 0.35), [x1] = q(1.3, 0.35), [, yt] = q(0, 3.5), [, yr] = q(0, 3.9);
  const w = x1 - x0;
  // the body, its rounded roof, the trolley pole to the wire
  c.fillStyle = INK; c.fillRect(x0 + w * 0.08, yb, w * 0.84, k * 0.35);
  c.fillStyle = CORAL; c.beginPath(); c.moveTo(x0, yb); c.lineTo(x0, yt); c.quadraticCurveTo(x0 + w / 2, yr - k * 0.2, x1, yt); c.lineTo(x1, yb); c.closePath(); c.fill();
  c.fillStyle = CREAM; c.fillRect(x0, yt + k * 0.2, w, k * 0.12);
  // three front windows, the sign box, the headlight, the bumper
  c.fillStyle = PLUM_D;
  for (let i = 0; i < 3; i++) c.fillRect(x0 + w * (0.06 + i * 0.31), yt + k * 0.45, w * 0.26, k * 1.15);
  c.fillStyle = INK; c.fillRect(x0 + w * 0.25, yt - k * 0.05, w * 0.5, k * 0.28);
  c.fillStyle = GOLD_L; c.font = `${(k * 0.2).toFixed(1)}px ${F}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('DESIRE', x0 + w / 2, yt + k * 0.09, w * 0.46);
  c.fillStyle = GOLD; c.fillRect(x0, yb - k * 0.6, w, k * 0.08); c.fillRect(x0 - k * 0.06, yb - k * 0.1, w + k * 0.12, k * 0.12);
  c.fillStyle = CREAM; c.beginPath(); c.arc(x0 + w / 2, yb - k * 0.95, k * 0.16, 0, Math.PI * 2); c.fill();
  c.strokeStyle = INK; c.lineWidth = Math.max(1, k * 0.05); c.beginPath();
  const [px, py] = q(0, 3.85), [wx, wy] = P(0, 5.6, z + 2.2); c.moveTo(px, py); c.lineTo(wx, wy); c.stroke();
  // a short run of the wire above it
  c.lineWidth = 1; c.beginPath(); const [w0x, w0y] = P(0, 5.65, z - 1), [w1x, w1y] = P(0, 5.65, z + 6); c.moveTo(w0x, w0y); c.lineTo(w1x, w1y); c.stroke();
}
function streetcar(p) {
  // it rolls up from the square and stops; the bell rings with a glint
  p.live('car', {
    t: 8.4, d: 0.6, reveal: 'fade', box: { x: 600, y: 900, w: 400, h: 400 },
    draw: (c, time) => {
      const u = Math.min(1, Math.max(0, (time - 8.4) / 2.6)), e = 1 - (1 - u) ** 3;
      carAt(c, lerp(34, 19, e));
    },
  });
}

// ================================================================ the brass band, marching toward us
function player(c, x, y, h, kind, time, ph) {
  // a frontal figure: dark suit, white shirt, a hat, with the instrument in gold
  const bob = Math.abs(Math.sin(time * 3 + ph)) * h * 0.02, step = Math.sin(time * 3 + ph);
  const fy = y - bob;
  const u = h / 100;
  c.fillStyle = INK;
  // legs, one stepping
  c.fillRect(x - 10 * u, fy - 46 * u, 8 * u, 46 * u - step * 3 * u);
  c.fillRect(x + 2 * u, fy - 46 * u, 8 * u, 46 * u + step * 3 * u);
  // the jacket, the shirt, the head and the hat
  c.beginPath(); c.moveTo(x - 15 * u, fy - 82 * u); c.lineTo(x + 15 * u, fy - 82 * u); c.lineTo(x + 13 * u, fy - 44 * u); c.lineTo(x - 13 * u, fy - 44 * u); c.closePath(); c.fill();
  c.fillStyle = CREAM; c.beginPath(); c.moveTo(x - 5 * u, fy - 82 * u); c.lineTo(x + 5 * u, fy - 82 * u); c.lineTo(x, fy - 62 * u); c.closePath(); c.fill();
  // the arms, posed for the instrument
  const arms = { tuba: [[-14, -78, -20, -60, -6, -58], [14, -78, 22, -66, 16, -54]], trumpet: [[-14, -78, -16, -86, -4, -92], [14, -78, 16, -86, 4, -92]],
    trombone: [[-14, -78, -14, -90, -6, -96], [14, -78, 18, -66, 18 + step * 4, -54]], drum: [[-14, -78, -18, -62, -8, -68], [14, -78, 18, -62, 8, -72 + step * 4]],
    clarinet: [[-14, -78, -12, -66, 2, -72], [14, -78, 14, -64, 6, -62]], parasol: [[-14, -78, -18, -60, -14, -46], [14, -78, 18, -76, 12, -88]] }[kind];
  c.strokeStyle = INK; c.lineWidth = 6 * u; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
  for (const [ax, ay, bx2, by2, cx2, cy2] of arms) { c.moveTo(x + ax * u, fy + ay * u); c.lineTo(x + bx2 * u, fy + by2 * u); c.lineTo(x + cx2 * u, fy + cy2 * u); }
  c.stroke();
  c.fillStyle = INK; c.fillRect(x - 12 * u, fy - 3 * u, 10 * u, 3 * u); c.fillRect(x + 2 * u, fy - 3 * u, 10 * u, 3 * u);
  c.beginPath(); c.arc(x, fy - 89 * u, 7 * u, 0, Math.PI * 2); c.fill();
  c.fillRect(x - 11 * u, fy - 95 * u, 22 * u, 3 * u); c.fillRect(x - 7 * u, fy - 101 * u, 14 * u, 7 * u);
  c.fillStyle = CORAL; c.fillRect(x - 7 * u, fy - 97 * u, 14 * u, 2 * u);
  c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = Math.max(0.8, u * 1.2);
  if (kind === 'tuba') {
    // a sousaphone: the coil around the body, the big bell above the head
    c.lineWidth = 6 * u; c.strokeStyle = GOLD; c.beginPath(); c.ellipse(x, fy - 66 * u, 20 * u, 18 * u, 0, 0, Math.PI * 2); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.ellipse(x + 12 * u, fy - 118 * u, 24 * u, 22 * u, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = OCHRE; c.beginPath(); c.ellipse(x + 12 * u, fy - 118 * u, 16 * u, 14 * u, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = PLUM_D; c.beginPath(); c.ellipse(x + 12 * u, fy - 118 * u, 8 * u, 7 * u, 0, 0, Math.PI * 2); c.fill();
  } else if (kind === 'trumpet') {
    c.fillStyle = INK; c.fillRect(x - 16 * u, fy - 86 * u, 8 * u, 6 * u); c.fillRect(x + 8 * u, fy - 86 * u, 8 * u, 6 * u);
    c.fillStyle = GOLD; c.fillRect(x - 2 * u, fy - 92 * u, 4 * u, 8 * u);
    c.beginPath(); c.arc(x + 1 * u, fy - 96 * u, 9 * u, 0, Math.PI * 2); c.fill();
    c.fillStyle = OCHRE; c.beginPath(); c.arc(x + 1 * u, fy - 96 * u, 5 * u, 0, Math.PI * 2); c.fill();
  } else if (kind === 'trombone') {
    c.fillStyle = GOLD; c.beginPath(); c.arc(x - 4 * u, fy - 100 * u, 10 * u, 0, Math.PI * 2); c.fill();
    c.fillStyle = OCHRE; c.beginPath(); c.arc(x - 4 * u, fy - 100 * u, 6 * u, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 3 * u; c.beginPath(); c.moveTo(x + 2 * u, fy - 88 * u); c.lineTo(x + 18 * u + step * 4 * u, fy - 52 * u); c.stroke();
  } else if (kind === 'drum') {
    c.fillStyle = CREAM; c.beginPath(); c.arc(x, fy - 62 * u, 19 * u, 0, Math.PI * 2); c.fill();
    c.strokeStyle = CORAL; c.lineWidth = 3 * u; c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1 * u; c.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; c.moveTo(x, fy - 62 * u); c.lineTo(x + Math.cos(a) * 19 * u, fy - 62 * u + Math.sin(a) * 19 * u); } c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.ellipse(x, fy - 82 * u - Math.max(0, step) * 3 * u, 12 * u, 3 * u, 0, 0, Math.PI * 2); c.fill();
  } else if (kind === 'clarinet') {
    c.strokeStyle = INK; c.lineWidth = 3.5 * u; c.beginPath(); c.moveTo(x, fy - 86 * u); c.lineTo(x + 6 * u, fy - 58 * u); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.arc(x + 6 * u, fy - 57 * u, 3.4 * u, 0, Math.PI * 2); c.fill();
  } else if (kind === 'parasol') {
    // the grand marshal's parasol, turning, fringed
    const a0 = time * 0.9 + ph;
    c.strokeStyle = INK; c.lineWidth = 2 * u; c.beginPath(); c.moveTo(x + 12 * u, fy - 80 * u); c.lineTo(x + 14 * u, fy - 134 * u); c.stroke();
    const cx = x + 14 * u, cy = fy - 134 * u, R = 36 * u;
    for (let k = 0; k < 8; k++) {
      const a = a0 + (k / 8) * Math.PI * 2, x1 = cx + Math.cos(a) * R, x2 = cx + Math.cos(a + Math.PI / 4) * R;
      if (Math.sin(a + Math.PI / 8) < -0.2) continue;
      c.fillStyle = k % 2 ? GOLD : CORAL;
      c.beginPath(); c.moveTo(cx, cy - 16 * u); c.lineTo(x1, cy + Math.sin(a) * 4 * u); c.lineTo(x2, cy + Math.sin(a + Math.PI / 4) * 4 * u); c.closePath(); c.fill();
    }
    c.fillStyle = GOLD; c.beginPath(); c.arc(cx, cy - 17 * u, 3 * u, 0, Math.PI * 2); c.fill();
    c.fillStyle = CORAL; c.fillRect(x - 15 * u, fy - 80 * u, 30 * u, 5 * u);
  }
}
const BAND = [
  // x, z, kind, phase
  [-2.2, 7.8, 'drum', 0.6], [2.1, 7.4, 'tuba', 1.7], [-1.2, 6.6, 'trombone', 2.2],
  [1.15, 6.0, 'trumpet', 0.2], [2.5, 5.3, 'clarinet', 1.1], [-2.3, 4.9, 'parasol', 2.9],
];
function band(p) {
  p.live('band', {
    t: 9.2, d: 1.2, reveal: 'drop', dy: 30, box: { x: 300, y: 900, w: 1000, h: 640 },
    draw: (c, time) => {
      for (const [x, z, kind, ph] of BAND) {
        const [a, b] = P(x, 0, z), h = (FOC / z) * 1.75;
        // a shadow on the street
        c.fillStyle = 'rgba(42,28,51,.25)'; c.beginPath(); c.ellipse(a, b, h * 0.2, h * 0.03, 0, 0, Math.PI * 2); c.fill();
        player(c, a, b, h, kind, time, ph);
      }
    },
  });
}

// ================================================================ the gas lamps, the notes rising
function life(p) {
  const lamps = [[-1, 7.6], [1, 9.4], [-1, 17.4], [1, 21.0]];
  p.live('lamps', {
    t: 8.8, d: 0.8, reveal: 'fade', box: { x: M, y: TOP, w: W - 2 * M, h: FOOT - TOP },
    draw: (c, time) => {
      for (const [s, z] of lamps) {
        const [px, py] = P(s * (CURB - 0.05), 3.0, z), k = FOC / z;
        const fl = 0.75 + 0.25 * Math.sin(time * 7 + z) * Math.sin(time * 3.1 + s);
        // the bracket, the lantern and its flame
        c.strokeStyle = INK; c.lineWidth = Math.max(1, k * 0.04); c.beginPath(); c.moveTo(px, py); c.lineTo(px - s * k * 0.4, py); c.stroke();
        const lx = px - s * k * 0.4;
        c.fillStyle = `rgba(246,207,124,${(0.3 * fl).toFixed(3)})`; c.beginPath(); c.arc(lx, py + k * 0.32, k * 0.34, 0, Math.PI * 2); c.fill();
        c.fillStyle = INK; c.beginPath(); c.moveTo(lx - k * 0.16, py + k * 0.06); c.lineTo(lx + k * 0.16, py + k * 0.06); c.lineTo(lx + k * 0.12, py + k * 0.58); c.lineTo(lx - k * 0.12, py + k * 0.58); c.closePath(); c.fill();
        c.fillStyle = GOLD_L; c.fillRect(lx - k * 0.09, py + k * 0.14, k * 0.18, k * 0.36);
        c.fillStyle = `rgba(217,87,62,${(0.5 + 0.5 * fl).toFixed(3)})`; c.beginPath(); c.ellipse(lx, py + k * 0.36, k * 0.035, k * 0.08 * fl, 0, 0, Math.PI * 2); c.fill();
      }
    },
  });
  // notes rising from the trumpet's bell
  const [tx, ty] = P(1.15, 0, 6.0), th = (FOC / 6.0) * 1.75;
  const bx = tx + th * 0.01, by = ty - th * 0.96;
  p.live('notes', {
    t: 10.2, d: 1.0, reveal: 'fade', box: { x: bx - 60, y: by - 330, w: 300, h: 340 },
    draw: (c, time) => {
      for (let i = 0; i < 4; i++) {
        const u = ((time * 0.22 + i * 0.25) % 1);
        const x = bx + 20 + u * 140 + Math.sin(u * 8 + i) * 14, y = by - 20 - u * 290, a = Math.min(1, u * 5) * (1 - u);
        c.globalAlpha = a; c.fillStyle = INK; c.strokeStyle = INK; c.lineWidth = 2.6;
        c.beginPath(); c.ellipse(x, y, 8, 6, -0.4, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.moveTo(x + 7, y - 2); c.lineTo(x + 7, y - 34); if (i % 2) c.lineTo(x + 18, y - 26); c.stroke();
        if (i % 2 === 0) { c.beginPath(); c.ellipse(x + 22, y - 6, 8, 6, -0.4, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(x + 29, y - 8); c.lineTo(x + 29, y - 40); c.lineTo(x + 7, y - 34); c.stroke(); }
        c.globalAlpha = 1;
      }
    },
  });
}

// ================================================================ the name in wood type, the instruments at the foot
function trumpet(c, x, y, s, flip) {
  c.save(); c.translate(x, y); c.scale(flip ? -s : s, s);
  c.fillStyle = GOLD; c.strokeStyle = PLUM_D; c.lineWidth = 1.4;
  // the bell flaring to the right, the lead pipe, the valves, the loop
  c.beginPath(); c.moveTo(40, -5); c.lineTo(70, -5); c.quadraticCurveTo(88, -8, 96, -22); c.lineTo(96, 22); c.quadraticCurveTo(88, 8, 70, 5); c.lineTo(40, 5); c.closePath(); c.fill();
  c.fillRect(-60, -3, 104, 6);
  c.beginPath(); c.moveTo(-10, 3); c.lineTo(-10, 22); c.quadraticCurveTo(-10, 30, 0, 30); c.lineTo(40, 30); c.quadraticCurveTo(50, 30, 50, 20); c.lineTo(50, 3); c.lineTo(44, 3); c.lineTo(44, 20); c.quadraticCurveTo(44, 24, 40, 24); c.lineTo(0, 24); c.quadraticCurveTo(-4, 24, -4, 20); c.lineTo(-4, 3); c.closePath(); c.fill();
  for (const vx of [6, 16, 26]) { c.fillRect(vx - 3, -16, 6, 30); c.beginPath(); c.arc(vx, -18, 4.5, 0, Math.PI * 2); c.fill(); }
  c.beginPath(); c.moveTo(-60, 0); c.lineTo(-70, -6); c.lineTo(-70, 6); c.closePath(); c.fill();
  c.restore();
}
function trombone(c, x, y, s, flip) {
  c.save(); c.translate(x, y); c.scale(flip ? -s : s, s);
  c.fillStyle = GOLD;
  c.beginPath(); c.moveTo(30, -5); c.lineTo(60, -5); c.quadraticCurveTo(80, -8, 88, -24); c.lineTo(88, 24); c.quadraticCurveTo(80, 8, 60, 5); c.lineTo(30, 5); c.closePath(); c.fill();
  c.fillRect(-120, -3, 152, 6);
  c.fillRect(-120, 17, 150, 6);
  c.beginPath(); c.arc(-120, 10, 13, Math.PI / 2, Math.PI * 1.5); c.lineTo(-120, -7); c.lineTo(-120, -3); c.arc(-120, 10, 7, Math.PI * 1.5, Math.PI / 2, true); c.closePath(); c.fill();
  c.fillRect(-40, -3, 4, 26); c.fillRect(20, -3, 4, 26);
  c.restore();
}
function clarinet(c, x, y, s, ang) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.fillStyle = INK; c.fillRect(-80, -5, 150, 10);
  c.beginPath(); c.moveTo(70, -5); c.quadraticCurveTo(86, -8, 92, -14); c.lineTo(92, 14); c.quadraticCurveTo(86, 8, 70, 5); c.closePath(); c.fill();
  c.fillStyle = GOLD; for (let k = 0; k < 7; k++) c.fillRect(-60 + k * 18, -6, 3, 12);
  c.fillRect(-92, -3, 12, 6);
  c.restore();
}
function fleur(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath();
  c.moveTo(0, -30); c.quadraticCurveTo(10, -16, 4, 0); c.lineTo(-4, 0); c.quadraticCurveTo(-10, -16, 0, -30);
  c.moveTo(-3, -4); c.quadraticCurveTo(-24, -10, -20, -24); c.quadraticCurveTo(-14, -14, -2, -6);
  c.moveTo(3, -4); c.quadraticCurveTo(24, -10, 20, -24); c.quadraticCurveTo(14, -14, 2, -6);
  c.rect(-10, 0, 20, 4);
  c.moveTo(-2, 4); c.quadraticCurveTo(-10, 12, -14, 10); c.quadraticCurveTo(-8, 8, -4, 4);
  c.moveTo(2, 4); c.quadraticCurveTo(10, 12, 14, 10); c.quadraticCurveTo(8, 8, 4, 4);
  c.fill();
  c.restore();
}
function title(p) {
  // the name: gold wood type with a plum drop shadow, set across the band
  p.type('title', 'NEW ORLEANS', W / 2, 286, { family: F, size: 168, color: GOLD, shadow: PLUM_D, sx: 6, sy: 6, align: 'center', track: 0.02, fit: W - 2 * M - 120, t: 10.6, gap: 0.14, d: 0.7 });
  p.type('title', 'VIEUX CARRÉ', W / 2, 128, { family: F, size: 30, color: CREAM, align: 'center', track: 0.3, t: 12.2, gap: 0.05, d: 0.4, reveal: 'fade' });
  p.group('title', { x: 400, y: 80, w: 800, h: 70 }, (c) => {
    c.fillStyle = GOLD; fleur(c, 560, 128, 0.8); fleur(c, W - 560, 128, 0.8);
    c.fillRect(380, 114, 140, 2); c.fillRect(W - 520, 114, 140, 2);
  }, { t: 12.5, d: 0.5, reveal: 'fade' });
  // the foot: brass crossed either side of the line of words
  const fy = (FOOT + H - M) / 2;
  p.group('title', { x: M, y: FOOT, w: W - 2 * M, h: H - M - FOOT }, (c) => {
    trumpet(c, 270, fy - 34, 1.35, false); trombone(c, 300, fy + 40, 1.15, false);
    trumpet(c, W - 270, fy - 34, 1.35, true); clarinet(c, W - 290, fy + 42, 1.25, 0.04);
  }, { t: 12.0, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  p.type('title', 'LOUISIANA', W / 2, fy - 4, { family: F, size: 50, color: CREAM, align: 'center', track: 0.24, t: 12.6, gap: 0.06, d: 0.4, reveal: 'press' });
  p.type('title', 'JACKSON SQUARE', W / 2, fy + 50, { family: F, size: 26, color: GOLD, align: 'center', track: 0.34, t: 13.1, gap: 0.04, d: 0.4, reveal: 'fade' });
}
