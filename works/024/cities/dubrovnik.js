// Dubrovnik: a 1930s Adriatic poster. The walled city seen from the slope of
// Srđ, high above it, looking south over the roofs to the open sea: flat
// lithographic inks with no outlines, terracotta roofs by the hundred, the
// round Minčeta tower at the near corner of the walls, the Lovrijenac fortress
// on its rock, the old port under St John's fortress, the island of Lokrum,
// sailing boats on deep blue water, and the name in wide Raleway capitals.

import { Plate, W, H, boxOf } from '../print.js';
import { Ground, shade, mix, lerp, clamp, poly, rng } from '../kit.js';

// the inks
const PAPER = '#efe5cf';
const SKY_T = '#9cc0d8', SKY_B = '#f1dfb8';
const SEA_F = '#6f9fcf', SEA_M = '#2c5ca8', SEA_N = '#173f8c', SEA_D = '#11306e', SHALLOW = '#3d9bb0', FOAM = '#eef3ee';
const ROOFS = ['#cf5a2f', '#d9683a', '#c24f2c', '#b9573a', '#de7a45', '#c9654a', '#a9493a', '#d4703f'];
const STONE = '#e9d9b3', STONE_D = '#bda67b', STONE_L = '#f6ecd2', PAVE = '#efe2c2';
const ROCK = '#a48d6c', ROCK_D = '#7c6a52', LAND = '#a99c63', SHUTTER = '#3f6a48', HOLE = '#4a3a33';
const PINE = '#3f6236', PINE_D = '#2a4529', PINE_L = '#5d8248', OLIVE = '#7d8f5a', TRUNK = '#5b4433';
const SHADOW = '#8f7d5c';
const FAR_L = '#9bb3c9', FAR_D = '#829db8', NAVY = '#1b2d5a';

export const city = {
  id: 'dubrovnik', name: 'Dubrovnik', wall: '#1c2f55',
  alt: "A 1930s Adriatic poster of Dubrovnik seen from the hill above it: the walled old town's terracotta roofs split by the Stradun, the round Minčeta tower at the corner of the walls, the bell tower, the cathedral dome and the Jesuit church, the Lovrijenac fortress on its rock, the old port under St John's fortress, the island of Lokrum, sailing boats on deep blue sea, and pines and cypresses on the slope in front",
  google: 'family=Raleway:wght@700;900',
  fonts: [['900 200px "Raleway"', 'DUBROVNIK'], ['700 34px "Raleway"', 'DALMACIJA · JADRAN']],
  build,
};

// the view: meters on the ground (X to the west, which is to the right; Y to
// the south, away from us; Z up) projected from high on the hill
const G = new Ground({ cx: 720, hy: 470, y0: 2000, U: 880, K: 1 });
const MU = 220, VC = 1.15, ZK = 3.7;
const P = (X, Y, Z = 0) => G.P(X / MU, VC + Y / MU, Z * ZK);
const CAM = [0, (-1 - VC) * MU]; // the ground point under the eye
const LIGHT = norm([-0.8, 0.55]); // the sun is in the south-east, behind and to the left

function norm([x, y]) { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; }
const depth = (X, Y) => Y + Math.abs(X) * 0.02; // far first; at the same depth, the outer first

// the town's walls, going round (X, Y)
const WALL = [
  [185, -150], [120, -142], [40, -130], [-40, -122], [-120, -114], [-185, -104], [-214, -62], [-234, -12],
  [-240, 36], [-216, 60], [-206, 106], [-238, 140], [-236, 176], [-196, 190], [-120, 182], [-40, 188],
  [40, 186], [112, 178], [168, 150], [226, 104], [246, 40], [244, -30], [220, -100],
];
// the ground around the town and the shore (sea beyond it), left to right
const COAST = [
  [-2600, -260], [-1200, -110], [-700, -50], [-470, -20], [-360, 0], [-300, 28], [-262, 56], [-250, 84],
  [-226, 100], [-226, 120], [-262, 136], [-266, 186], [-232, 210], [-160, 204], [-60, 210], [40, 208],
  [120, 200], [186, 166], [246, 118], [268, 50], [276, 14], [298, -4], [330, -6], [352, 16],
  [378, 52], [430, 72], [478, 50], [492, 0], [560, -30], [760, -24], [1100, -70], [2600, -220],
];

function inside(pt, poly0) {
  let c = false;
  for (let i = 0, j = poly0.length - 1; i < poly0.length; j = i++) {
    const [xi, yi] = poly0[i], [xj, yj] = poly0[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// the town climbs from the Stradun to the north, and a little to the south
const rise = (X, Y) => (Y < 0 ? Math.min(22, -Y * 0.16) : Math.min(14, Y * 0.1));

function build() {
  const p = new Plate({ paper: PAPER, seed: 1930 });
  const r = p.r;
  p.clip = { x: 0, y: 0, w: W, h: H };
  p.stack('sky', 'sea', 'far', 'waves', 'land', 'town', 'front', 'live', 'title');

  sky(p, r);
  sea(p, r);
  lokrum(p, r);
  land(p, r);
  town(p, r);
  slope(p, r);
  boats(p, r);
  title(p);
  return p;
}

// ================================================================ sky and sea
function sky(p, r) {
  // flat bands of tint, as a stone litho lays them, darkening upward
  const bands = 7;
  for (let i = 0; i < bands; i++) {
    const y0 = (i / bands) * 480, col = mix(SKY_T, SKY_B, i / (bands - 1));
    p.group('sky', { x: 0, y: y0 - 2, w: W, h: 480 - y0 + 4 }, (c) => { c.fillStyle = col; c.fillRect(0, y0, W, 480 - y0); },
      { t: 0.1 + (bands - 1 - i) * 0.1, d: 0.8, reveal: 'fall', ease: 'soft' });
  }
  // long flat clouds, two inks
  const clouds = [[180, 430, 420, 16], [980, 405, 520, 14], [620, 448, 260, 9], [1250, 445, 260, 8], [60, 395, 200, 8]];
  clouds.forEach(([x, y, w, h], i) => {
    const pts = [];
    for (let k = 0; k <= 24; k++) { const t = k / 24; pts.push([x + t * w, y - h * Math.sin(t * Math.PI) ** 0.6 * (1 + 0.3 * Math.sin(t * 9 + i))]); }
    pts.push([x + w, y + 2], [x, y + 2]);
    p.fill('sky', pts, '#f8efdc', { t: 1.0 + i * 0.15, d: 1.2, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

function sea(p, r) {
  // the sea in stepped bands from the hazy horizon to the deep blue in front
  const steps = [[470, SEA_F], [520, mix(SEA_F, SEA_M, 0.5)], [600, SEA_M], [760, mix(SEA_M, SEA_N, 0.5)], [960, SEA_N], [1300, SEA_D]];
  steps.forEach(([y0, col], i) => {
    p.group('sea', { x: 0, y: y0 - 2, w: W, h: H - y0 + 2 }, (c) => { c.fillStyle = col; c.fillRect(0, y0, W, H - y0); },
      { t: 0.5 + i * 0.16, d: 0.9, reveal: 'fall', ease: 'soft' });
  });
  // the horizon: far coasts in haze, the Elafiti islands to the right, Cavtat's shore to the left
  const far = (pts, col, t) => p.fill('far', pts, col, { t, d: 1.0, reveal: 'rise' });
  const ridge = (x0, x1, y, h, seed, steps = 40) => {
    const rr = rng(seed), pts = [[x0, y]];
    const ph = rr.range(0, 6);
    for (let k = 0; k <= steps; k++) {
      const t = k / steps, e = Math.sin(t * Math.PI) ** 0.5;
      pts.push([lerp(x0, x1, t), y - h * e * (0.75 + 0.25 * Math.sin(t * 7 + ph) * Math.sin(t * 3 + ph))]);
    }
    pts.push([x1, y]);
    return pts;
  };
  far(ridge(-60, 520, 476, 34, 3), FAR_L, 1.2);
  far(ridge(-60, 260, 478, 18, 4), FAR_D, 1.35);
  far(ridge(1090, 1380, 472, 14, 5), FAR_L, 1.3);
  far(ridge(1290, 1660, 478, 26, 6), FAR_D, 1.45);
  far(ridge(1480, 1660, 484, 20, 7), mix(FAR_D, SEA_M, 0.3), 1.55);

  // ripples: short flat dashes of a lighter blue, smaller and closer toward the horizon
  const rows = 8;
  for (let b = 0; b < rows; b++) {
    const ya = lerp(486, 1980, (b / rows) ** 1.7), yb = lerp(486, 1980, ((b + 1) / rows) ** 1.7);
    const lines = [], deep = [];
    for (let y = ya; y < yb;) {
      const v = G.vAt(y), s = G.s(v);
      const n = Math.round(W / (90 * s + 14));
      for (let i = 0; i < n; i++) {
        const x = r.range(0, W), L = r.range(8, 28) * s + 2;
        (r.chance(0.6) ? lines : deep).push([[x - L, y], [x + L, y]]);
      }
      y += Math.max(2.4, 15 * s);
    }
    const t = 1.5 + b * 0.18, col = mix(SEA_F, '#dfe9f0', 0.3 + 0.1 * (b / rows));
    p.strokes('waves', lines, col, clamp(0.6 + b * 0.25, 0.7, 2.4), { t, d: 0.9, reveal: 'wipe', box: { x: 0, y: ya - 4, w: W, h: yb - ya + 8 } });
    p.strokes('waves', deep, SEA_D, clamp(0.6 + b * 0.25, 0.7, 2.4), { t: t + 0.1, d: 0.9, reveal: 'wipeL', box: { x: 0, y: ya - 4, w: W, h: yb - ya + 8 } });
  }
  // the sun's glitter far out on the left
  const glit = [];
  for (let i = 0; i < 70; i++) {
    const y = r.range(490, 640), s = G.s(G.vAt(y)), x = 300 + r.gauss() * 220 * (1 + (y - 490) / 300);
    const L = r.range(6, 22) * s + 3;
    glit.push([[x - L, y], [x + L, y]]);
  }
  p.strokes('waves', glit, '#f6f1df', 1.6, { t: 3.1, d: 1.2, reveal: 'fade' });
}

// ================================================================ Lokrum
function lokrum(p, r) {
  // the island lies out to the south-east, low and dark with pines
  const X0 = -860, X1 = -300;
  const near = (t) => 700 + 60 * Math.sin(t * Math.PI) ** 0.8 - 110 * t;
  const far = (t) => near(t) + 30;
  const h = (t) => 62 * Math.sin(clamp((t - 0.02) / 0.96) * Math.PI) ** 0.45 * (1 - 0.22 * Math.sin(t * 5.5 + 0.4) ** 2);
  const top = [], bottom = [];
  for (let k = 0; k <= 60; k++) {
    const t = k / 60, X = lerp(X0, X1, t);
    top.push(P(X, near(t), h(t)));
    bottom.push(P(X, near(t), 0));
  }
  const body = [...top, ...bottom.reverse()];
  const b = boxOf(body, 6);
  const foam = bottom.map(([x, y]) => [x, y + 1.5]);
  const pines = [];
  for (let i = 0; i < 260; i++) {
    const t = r.range(0.04, 0.96), X = lerp(X0, X1, t), f = r();
    const Y = near(t), Z = h(t) * f * 0.97;
    const [x, y] = P(X, Y, Z);
    pines.push([x, y, r.range(2.4, 5), r.chance(0.3)]);
  }
  pines.sort((a, b2) => a[1] - b2[1]);
  // Fort Royal on the summit, a pale square
  const fort = P(lerp(X0, X1, 0.53), near(0.53), h(0.53) - 2), sF = G.s(VC + near(0.53) / MU);
  p.group('far', b, (c) => {
    c.fillStyle = PINE_D; poly(c, body); c.fill();
    // the lit flank toward the sun
    c.save(); poly(c, body); c.clip();
    c.fillStyle = PINE; c.beginPath();
    for (const [x, y, rr, light] of pines) if (!light) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); }
    c.fill();
    c.fillStyle = PINE_L; c.beginPath();
    for (const [x, y, rr, light] of pines) if (light) { c.moveTo(x + rr, y); c.arc(x, y, rr * 0.8, 0, Math.PI * 2); }
    c.fill();
    c.restore();
    c.fillStyle = ROCK; c.beginPath(); c.moveTo(foam[0][0], foam[0][1]);
    for (const [x, y] of foam) c.lineTo(x, y - 3); for (let i = foam.length - 1; i >= 0; i--) c.lineTo(foam[i][0], foam[i][1] + 1); c.fill();
    c.strokeStyle = FOAM; c.lineWidth = 1.3; c.beginPath(); foam.forEach(([x, y], i) => (i ? c.lineTo(x, y + 1) : c.moveTo(x, y + 1))); c.stroke();
    const fw = 70 * sF * 4.4 / ZK;
    c.fillStyle = STONE_D; c.fillRect(fort[0] - fw / 2, fort[1] - fw * 0.55, fw, fw * 0.55);
    c.fillStyle = STONE; c.fillRect(fort[0] - fw / 2, fort[1] - fw * 0.55, fw * 0.45, fw * 0.55);
  }, { t: 1.9, d: 1.4, reveal: 'rise', ease: 'out' });
}

// ================================================================ the land and its shore
function land(p, r) {
  const coast = COAST.map(([X, Y]) => P(X, Y));
  const shore = [...coast, [W + 400, H + 400], [-400, H + 400]];
  // the shallows: a band of green-blue just off the rocks
  const shallow = COAST.map(([X, Y]) => P(X, Y + 18 + Math.abs(Math.sin(X * 0.03)) * 8));
  const shallowPts = [...shallow, [W + 400, H + 400], [-400, H + 400]];
  p.fill('land', shallowPts, SHALLOW, { t: 2.3, d: 0.9, reveal: 'fade', box: { x: 0, y: 520, w: W, h: H - 520 } });
  // foam lines along the rocks
  const foam = [];
  for (let k = 0; k < 3; k++) foam.push(COAST.map(([X, Y]) => P(X, Y + 5 + k * 6 + Math.sin(X * 0.05 + k) * 2)));
  p.group('land', { x: 0, y: 520, w: W, h: H - 520 }, (c) => {
    c.fillStyle = LAND; poly(c, shore); c.fill();
    // rock along the water: a darker skirt
    c.fillStyle = ROCK; c.beginPath();
    coast.forEach(([x, y], i) => (i ? c.lineTo(x, y + 3) : c.moveTo(x, y + 3)));
    for (let i = coast.length - 1; i >= 0; i--) c.lineTo(coast[i][0], coast[i][1] - 9);
    c.fill();
    c.strokeStyle = FOAM; c.lineCap = 'round';
    foam.forEach((l, k) => {
      c.lineWidth = 2.4 - k * 0.7; c.globalAlpha = 1 - k * 0.3;
      c.setLineDash(k ? [10 + k * 6, 8 + k * 9] : []);
      c.beginPath(); l.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    });
    c.setLineDash([]); c.globalAlpha = 1;
  }, { t: 2.6, d: 1.0, reveal: 'rise', ease: 'out' });

  // Lovrijenac's rock: a cliff rising out of the sea west of the walls
  const rockFoot = [], rockTop = [];
  for (let k = 0; k <= 20; k++) {
    const a = Math.PI * (k / 20), X = 425 + Math.cos(a) * 62, Y = 18 + Math.sin(a) * 50;
    rockFoot.push(P(X, Y, 0)); rockTop.push(P(X * 0.98 + 8, Y * 0.85, 30));
  }
  const rockPts = [...rockTop, ...rockFoot.slice().reverse()];
  const cliffs = [];
  for (let k = 0; k < 26; k++) {
    const t = r.range(0.05, 0.95), a = Math.PI * t, X = 425 + Math.cos(a) * 62, Y = 18 + Math.sin(a) * 50;
    const [xa, ya] = P(X, Y, r.range(0, 6)), [, yb] = P(X, Y, r.range(14, 30));
    cliffs.push([[xa, ya], [xa + r.range(-2, 2), yb]]);
  }
  p.group('land', boxOf(rockPts, 10), (c) => {
    c.fillStyle = ROCK; poly(c, rockPts); c.fill();
    c.strokeStyle = ROCK_D; c.lineWidth = 2.2; c.beginPath();
    for (const [a, b] of cliffs) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
    c.fillStyle = '#c4ae86'; c.beginPath(); rockTop.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
  }, { t: 3.0, d: 0.9, reveal: 'rise' });

  // terraces: dry-stone walls following the slope, and the garden plots between them
  const landPoly = [...COAST, [2600, -900], [-2600, -900]];
  const terr = [];
  for (let Y = -300; Y < 100; Y += r.range(9, 15)) {
    let run = [];
    for (let X = -800; X <= 800; X += 8) {
      const YY = Y + 6 * Math.sin(X * 0.012 + Y * 0.1);
      const ok = inside([X, YY + 4], landPoly) && ![[0, 0], [16, 0], [-16, 0], [0, 16], [0, -16]].some(([dx, dy]) => inside([X + dx, YY + dy], WALL));
      if (ok) run.push(P(X, YY)); else { if (run.length > 1) terr.push(run); run = []; }
    }
    if (run.length > 1) terr.push(run);
  }
  p.strokes('land', terr, mix(LAND, STONE, 0.45), 1.6, { t: 3.0, d: 1.0, reveal: 'fall', box: { x: 0, y: 700, w: W, h: H - 700 } });

  // the town's ground: pale stone within the walls, and the Stradun cut straight across
  const ground = WALL.map(([X, Y]) => P(X, Y, rise(X, Y) * 0.4));
  const strad = [P(-222, -8, 0), P(234, -8, 0), P(234, 8, 0), P(-222, 8, 0)];
  p.group('land', boxOf(ground, 6), (c) => {
    c.fillStyle = mix(STONE, ROCK, 0.35); poly(c, ground); c.fill();
    c.fillStyle = PAVE; poly(c, strad); c.fill();
  }, { t: 3.3, d: 3.4, reveal: 'fall', ease: 'linear' });
}

// ================================================================ the town
// shapes drawn in one depth order: walls in short pieces, houses, towers, churches
function prism(c, foot, z0, z1, col, o = {}) {
  // foot: [[X, Y], ...] going round; z in meters. Visible sides, then the top.
  const n = foot.length;
  let cx = 0, cy = 0; for (const [x, y] of foot) { cx += x / n; cy += y / n; }
  for (let i = 0; i < n; i++) {
    const a = foot[i], b = foot[(i + 1) % n];
    let nx = b[1] - a[1], ny = -(b[0] - a[0]);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    if (nx * (mx - cx) + ny * (my - cy) < 0) { nx = -nx; ny = -ny; }
    const nn = norm([nx, ny]);
    if (nn[0] * (CAM[0] - mx) + nn[1] * (CAM[1] - my) <= 0) continue;
    const lit = 0.66 + 0.4 * Math.max(0, nn[0] * LIGHT[0] + nn[1] * LIGHT[1]);
    c.fillStyle = shade(col, lit);
    poly(c, [P(a[0], a[1], z0), P(b[0], b[1], z0), P(b[0], b[1], z1), P(a[0], a[1], z1)]); c.fill();
    if (o.face) o.face(c, a, b, z0, z1, lit);
  }
  if (o.top !== false) { c.fillStyle = o.top || shade(col, 1.08); poly(c, foot.map(([x, y]) => P(x, y, z1))); c.fill(); }
}

// a hipped roof over an X/Y rectangle
function hipRoof(c, X0, Y0, X1, Y1, z, col, pitch = 0.5, tiles = true) {
  const wx = X1 - X0, wy = Y1 - Y0, along = wx >= wy;
  const half = (along ? wy : wx) / 2, rh = half * pitch;
  const R = along ? [[X0 + half, (Y0 + Y1) / 2], [X1 - half, (Y0 + Y1) / 2]] : [[(X0 + X1) / 2, Y0 + half], [(X0 + X1) / 2, Y1 - half]];
  const c00 = [X0, Y0], c10 = [X1, Y0], c11 = [X1, Y1], c01 = [X0, Y1];
  // the four slopes with the way each faces
  const faces = along
    ? [[[c00, c10, R[1], R[0]], [0, -1]], [[c11, c01, R[0], R[1]], [0, 1]], [[c01, c00, R[0]], [1, 0]], [[c10, c11, R[1]], [-1, 0]]]
    : [[[c00, c01, R[1], R[0]], [1, 0]], [[c11, c10, R[0], R[1]], [-1, 0]], [[c10, c00, R[0]], [0, -1]], [[c01, c11, R[1]], [0, 1]]];
  const mx = (X0 + X1) / 2, my = (Y0 + Y1) / 2;
  const facing = ([nx, ny]) => nx * (CAM[0] - mx) + ny * (CAM[1] - my) > 0;
  faces.sort((a, b) => facing(a[1]) - facing(b[1]));
  for (const [pts, nrm] of faces) {
    // the X axis on the sheet runs to the west, so a face toward -X faces east (the sun)
    const lit = 0.84 + 0.26 * (nrm[0] * LIGHT[0] + nrm[1] * LIGHT[1]) - (nrm[1] < 0 ? 0.08 : 0);
    c.fillStyle = shade(col, lit);
    const sp = pts.map(([x, y], i) => P(x, y, i < 2 ? z : z + rh));
    poly(c, sp); c.fill();
    // rows of tiles on the long slopes we look at
    if (sp.length === 4 && facing(nrm) && tiles) {
      c.strokeStyle = shade(col, lit * 0.78); c.lineWidth = 0.7; c.beginPath();
      for (let k = 1; k < 4; k++) {
        const t = k / 4, a = [lerp(sp[0][0], sp[3][0], t), lerp(sp[0][1], sp[3][1], t)], b = [lerp(sp[1][0], sp[2][0], t), lerp(sp[1][1], sp[2][1], t)];
        c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
      }
      c.stroke();
    }
  }
  return rh;
}

function town(p, r) {
  const items = [];
  const add = (X, Y, draw, pts, tag) => items.push({ d: depth(X, Y), draw, pts, tag });

  // ---- the walls, in pieces of about 18 m: a broad parapet with a walk on top
  const wallH = (X, Y) => (Y < -60 ? 24 : Y > 120 ? 20 : 18) + rise(X, Y) * 0.5;
  for (let i = 0; i < WALL.length; i++) {
    const a = WALL[i], b = WALL[(i + 1) % WALL.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 18));
    // the inward normal, so the wall stands just inside the line
    let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    if (!inside([(a[0] + b[0]) / 2 + nx * 4, (a[1] + b[1]) / 2 + ny * 4], WALL)) { nx = -nx; ny = -ny; }
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n;
      const A = [lerp(a[0], b[0], t0), lerp(a[1], b[1], t0)], B = [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1)];
      const th = 7;
      const foot = [A, B, [B[0] + nx * th, B[1] + ny * th], [A[0] + nx * th, A[1] + ny * th]];
      const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, z1 = wallH(mx, my);
      const pts = foot.flatMap(([x, y]) => [P(x, y, 0), P(x, y, z1 + 3)]);
      const outN = -ny; // the outer face looks north when the inward normal points south
      const shadow = outN < -0.3 ? [A, B, [B[0], B[1] - z1 * 0.55], [A[0], A[1] - z1 * 0.55]] : null;
      add(mx, my, (c) => {
        if (shadow) { c.fillStyle = SHADOW; poly(c, shadow.map(([x, y]) => P(x, y, 0))); c.fill(); }
        prism(c, foot, 0, z1, STONE, { top: STONE_L, face: courses });
        // the parapet: a thin raised lip on the outer edge with dark slits
        const lip = [A, B, [B[0] + nx * 1.6, B[1] + ny * 1.6], [A[0] + nx * 1.6, A[1] + ny * 1.6]];
        prism(c, lip, z1, z1 + 1.2, STONE, { top: STONE_L });
        merlons(c, [A, B], z1 + 1.2, true);
      }, shadow ? pts.concat(shadow.map(([x, y]) => P(x, y, 0))) : pts, 'wall');
    }
  }

  // ---- towers on the walls (small square ones), and the great forts
  const square = (X, Y, w, z0, col = STONE, cap = null) => {
    const z1 = wallH(X, Y) + z0 - 20;
    const foot = [[X - w / 2, Y - w / 2], [X + w / 2, Y - w / 2], [X + w / 2, Y + w / 2], [X - w / 2, Y + w / 2]];
    const pts = foot.flatMap(([x, y]) => [P(x, y, 0), P(x, y, z1 + 8)]);
    add(X, Y, (c) => {
      prism(c, foot, 0, z1, col, { top: STONE_L });
      merlons(c, foot, z1);
      if (cap) cap(c);
    }, pts, 'tower');
  };
  for (const [X, Y] of [[60, -134], [-60, -120], [-150, -110], [-226, -36], [100, 182], [-70, 186], [8, 188], [236, -64], [205, 128]]) square(X, Y, 15, 30);

  // Bokar, the low round bastion at the south-west corner
  add(226, 104, (c) => round(c, 222, 100, 16, 0, 26, { crown: true }), ring(222, 100, 18, 30), 'bokar');
  // St John's fortress over the old port: a massive block with a rounded sea face
  const sj = [[-262, 132], [-214, 128], [-206, 176], [-224, 200], [-262, 196]];
  add(-236, 166, (c) => {
    prism(c, sj, 0, 30, STONE, { top: false, face: slits });
    court(c, sj, 30);
    merlons(c, sj, 30);
    const top = [[-252, 140], [-226, 140], [-226, 160], [-252, 160]];
    prism(c, top, 30, 40, STONE);
    merlons(c, top, 40);
  }, sj.flatMap(([x, y]) => [P(x, y, 0), P(x, y, 48)]), 'stjohn');
  // the Revelin fortress outside the east gate
  const rv = [[-296, -36], [-258, -52], [-242, -14], [-266, 12], [-300, 2]];
  add(-270, -16, (c) => { prism(c, rv, 0, 24, STONE, { top: false, face: slits }); court(c, rv, 24, 0.6); merlons(c, rv, 24); },
    rv.flatMap(([x, y]) => [P(x, y, 0), P(x, y, 30)]), 'revelin');

  // ---- the houses: lots laid along the streets, cut by the Stradun and the lanes
  const lots = [];
  const busy = (X, Y) =>
    Math.abs(Y) < 10 || // the Stradun
    (X < -150 && Y > -16 && Y < 70) || // the Luža square, the Sponza and the Rector's palace
    (X > -150 && X < -100 && Y > 70 && Y < 130) || // the cathedral
    (X > 150 && Y > -48 && Y < 30) || // the Franciscan monastery and the Pile gate
    (X > -40 && X < 40 && Y > 92 && Y < 160) || // the Jesuit church and its steps
    (X < -150 && Y < -60); // the Dominican monastery
  // north half: narrow blocks running uphill between stepped lanes
  for (let X = -196; X < 204; X += 22) {
    for (let Y = -16; Y > -150;) {
      const d = r.range(11, 17);
      if (Math.abs(Y + 66) < 4) { Y -= 6; continue; } // Prijeko, the long street
      lots.push([X + 2, Y - d, X + 20, Y]);
      Y -= d;
    }
  }
  // south half: wider blocks, irregular
  for (let X = -212; X < 240;) {
    const w = r.range(24, 34);
    for (let Y = 14; Y < 196;) {
      const d = r.range(12, 19);
      if (Math.abs(Y - 46) < 5) { Y += 8; continue; } // Od Puča
      const split = r.chance(0.55);
      if (split) { lots.push([X + 2, Y, X + w / 2, Y + d]); lots.push([X + w / 2 + 0.6, Y, X + w - 2, Y + d]); }
      else lots.push([X + 2, Y, X + w - 2, Y + d]);
      Y += d;
    }
    X += w;
  }
  const keep = lots.filter(([X0, Y0, X1, Y1]) => {
    const pts = [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]];
    if (!pts.every((q) => inside(q, WALL))) return false;
    // keep clear of the wall's own thickness
    const inner = pts.map(([x, y]) => [x + Math.sign(-x) * 8, y + Math.sign(-y) * 9]);
    if (!inner.every((q) => inside(q, WALL))) return false;
    const mx = (X0 + X1) / 2, my = (Y0 + Y1) / 2;
    if (busy(mx, my)) return false;
    // stay in from the walls
    for (const [dx, dy] of [[9, 0], [-9, 0], [0, 9], [0, -9]]) if (!inside([mx + dx * 2, my + dy * 2], WALL)) return false;
    return true;
  });
  for (const [X0, Y0, X1, Y1] of keep) {
    const mx = (X0 + X1) / 2, my = (Y0 + Y1) / 2;
    const base = rise(mx, my), z = base + r.range(11, 19);
    const col = r.pick(ROOFS);
    // windows with green shutters on the face toward us, and the lit east face
    const rows = Math.floor((z - base - 3) / 3.6);
    const winN = [], winE = [];
    for (let k = 0; k < rows; k++) {
      const zz = base + 3 + k * 3.6;
      for (let x = X0 + 2.5; x < X1 - 2; x += 4.2) if (r.chance(0.8)) winN.push([x, zz]);
      for (let y = Y0 + 2.5; y < Y1 - 2; y += 4.4) if (r.chance(0.7)) winE.push([y, zz]);
    }
    const chimney = r.chance(0.35) ? [lerp(X0, X1, r.range(0.25, 0.75)), lerp(Y0, Y1, r.range(0.25, 0.75))] : null;
    const foot = [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]];
    const pts = foot.flatMap(([x, y]) => [P(x, y, 0), P(x, y, z + 8)]);
    add(mx, my, (c) => {
      prism(c, foot, 0, z, STONE, { top: false });
      // shutters: on the north face (toward us) and the east face if we see it
      const sN = G.s(VC + Y0 / MU), u = 1.1;
      c.fillStyle = SHUTTER; c.beginPath();
      for (const [x, zz] of winN) { const [px, py] = P(x, Y0, zz + 2.2); c.rect(px, py, 1.6 * u * sN * 4.4, 2.2 * sN * ZK); }
      c.fill();
      if (X0 > CAM[0]) { // a face toward the east (left) is seen when the house stands right of the eye
        c.fillStyle = shade(SHUTTER, 1.15); c.beginPath();
        for (const [y, zz] of winE) { const a = P(X0, y, zz + 2.2), b = P(X0, y + 1.6, zz); c.moveTo(a[0], a[1]); c.lineTo(b[0], a[1] + (b[1] - a[1]) * 0.3); c.lineTo(b[0], b[1]); c.lineTo(a[0], b[1] - (b[1] - a[1]) * 0.3); c.closePath(); }
        c.fill();
      }
      hipRoof(c, X0 - 0.6, Y0 - 0.6, X1 + 0.6, Y1 + 0.6, z, col);
      if (chimney) { const [cxx, cyy] = chimney; prism(c, [[cxx - 0.8, cyy - 0.8], [cxx + 0.8, cyy - 0.8], [cxx + 0.8, cyy + 0.8], [cxx - 0.8, cyy + 0.8]], z, z + 5, STONE); }
    }, pts, 'house');
  }

  // ---- the landmarks
  // the city bell tower at the east end of the Stradun, with its cupola
  add(-160, -2, (c) => {
    const f = [[-166, -8], [-154, -8], [-154, 4], [-166, 4]];
    prism(c, f, 0, 64, STONE);
    // the belfry's open arches
    for (const [ax, ay] of [[-160, -8.2]]) { const [x0, y0] = P(ax - 3, ay, 60), [x1, y1] = P(ax + 3, ay, 51); c.fillStyle = HOLE; c.fillRect(x0, y0, x1 - x0, y1 - y0); }
    dome(c, -160, -2, 5.5, 64, 8, '#7aa38a', true);
  }, ring(-160, -2, 10, 84), 'bell');
  // the Sponza palace and the Rector's palace: long arcaded fronts on the square
  const sponza = [[-208, -34], [-168, -34], [-168, -12], [-208, -12]];
  add(-188, -23, (c) => { prism(c, sponza, 0, 18, STONE, { top: false, face: arcade }); hipRoof(c, -209, -35, -167, -11, 18, ROOFS[3], 0.35); },
    sponza.flatMap(([x, y]) => [P(x, y, 0), P(x, y, 28)]), 'sponza');
  const rector = [[-200, 22], [-160, 22], [-160, 58], [-200, 58]];
  add(-180, 40, (c) => { prism(c, rector, 0, 19, STONE, { top: false, face: arcade }); hipRoof(c, -201, 21, -159, 59, 19, ROOFS[5], 0.35); },
    rector.flatMap(([x, y]) => [P(x, y, 0), P(x, y, 30)]), 'rector');
  // St Blaise's church on the square, with its small dome
  add(-140, 22, (c) => {
    const f = [[-150, 14], [-128, 14], [-128, 36], [-150, 36]];
    prism(c, f, 0, 16, STONE_L, { top: false });
    hipRoof(c, -151, 13, -127, 37, 16, ROOFS[0], 0.3);
    dome(c, -139, 25, 6, 20, 6, '#8a9a8a', true);
  }, ring(-139, 25, 20, 40), 'blaise');
  // the cathedral by the port, with its big dome and lantern
  add(-126, 100, (c) => {
    const nave = [[-146, 78], [-104, 78], [-104, 126], [-146, 126]];
    prism(c, nave, 0, 24, STONE_L, { top: false, face: tall });
    hipRoof(c, -147, 77, -103, 127, 24, ROOFS[6], 0.35);
    const drum = 9;
    round(c, -125, 104, drum, 24, 40);
    dome(c, -125, 104, drum, 40, 16, '#8fa7a2', true);
  }, ring(-125, 104, 30, 70), 'cathedral');
  // the Jesuit church, high on the south side, with its baroque front and steps
  add(0, 126, (c) => {
    const f = [[-22, 104], [22, 104], [22, 158], [-22, 158]];
    prism(c, f, rise(0, 126), rise(0, 126) + 30, STONE_L, { top: false, face: tall });
    hipRoof(c, -23, 103, 23, 159, rise(0, 126) + 30, ROOFS[2], 0.35);
    // the steps below its front
    for (let k = 0; k < 6; k++) prism(c, [[-14, 94 - k * 2], [14, 94 - k * 2], [14, 104 - k * 2], [-14, 104 - k * 2]], 0, rise(0, 126) - k * 2, PAVE);
    // the bell gable
    const g0 = [[-4, 101], [4, 101], [4, 106], [-4, 106]];
    prism(c, g0, rise(0, 126) + 30, rise(0, 126) + 40, STONE_L);
  }, ring(0, 126, 40, 60), 'jesuit');
  // the Franciscan monastery's bell tower by the Pile gate, a pointed cap
  add(186, -36, (c) => {
    const cl = [[160, -50], [224, -50], [224, -14], [160, -14]];
    prism(c, cl, 0, 16, STONE, { top: false });
    hipRoof(c, 159, -51, 225, -13, 16, ROOFS[4], 0.35);
    const f = [[176, -44], [186, -44], [186, -34], [176, -34]];
    prism(c, f, 0, 48, STONE);
    spire(c, 181, -39, 6, 48, 16, '#7f6a58');
  }, ring(186, -36, 44, 64), 'franciscan');
  // the Dominican monastery, a long block with its tower on the north-east
  add(-176, -84, (c) => {
    const f = [[-206, -100], [-154, -100], [-154, -68], [-206, -68]];
    prism(c, f, rise(-180, -84), rise(-180, -84) + 16, STONE, { top: false });
    hipRoof(c, -207, -101, -153, -67, rise(-180, -84) + 16, ROOFS[1], 0.35);
    const tw = [[-168, -86], [-158, -86], [-158, -76], [-168, -76]];
    prism(c, tw, 0, rise(-163, -81) + 34, STONE);
    spire(c, -163, -81, 6, rise(-163, -81) + 34, 9, '#7f6a58');
  }, ring(-180, -84, 40, 60), 'dominican');
  // Minčeta: the great round tower at the near corner, on a wider battered base
  add(178, -154, (c) => {
    round(c, 178, -150, 27, 0, 26, { batter: 1.14, crown: true });
    round(c, 178, -150, 15, 26, 66, { corbels: true });
    round(c, 178, -150, 16.8, 66, 72, { crown: true });
    // the small round turret on top
    round(c, 183, -147, 6, 72, 82, { crown: true });
  }, ring(178, -150, 36, 100), 'minceta');
  // Lovrijenac on its rock: a three-sided fort with tall walls
  const lv = [[388, 4], [458, -6], [470, 44], [424, 62], [394, 44]];
  add(430, 28, (c) => {
    // the rock it stands on, then its tall walls
    prism(c, lv.map(([x, y]) => [x + (x - 428) * 0.12, y + (y - 30) * 0.12]), 0, 30, ROCK, { top: '#c4ae86', face: cliff });
    prism(c, lv, 30, 58, STONE, { top: false, face: slits });
    court(c, lv, 58, 0.66);
    merlons(c, lv, 58);
    const keep2 = [[416, 18], [440, 16], [442, 36], [418, 38]];
    prism(c, keep2, 58, 66, STONE);
  }, lv.flatMap(([x, y]) => [P(x, y, 20), P(x, y, 72)]), 'lovrijenac');
  // the breakwater (Kaše) closing the old port
  add(-300, 160, (c) => prism(c, [[-330, 120], [-318, 118], [-306, 190], [-318, 192]], 0, 3, STONE), ring(-318, 150, 50, 10), 'kase');


  // ---- outside the walls: Pile and Ploče, houses in gardens among pines, olives and cypresses
  const landPoly = [...COAST, [2600, -900], [-2600, -900]];
  const clear = (X, Y) => {
    for (const [dx, dy] of [[0, 0], [18, 0], [-18, 0], [0, 18], [0, -18], [13, 13], [-13, 13], [13, -13], [-13, -13]]) if (inside([X + dx, Y + dy], WALL)) return false;
    if (!inside([X, Y + 14], landPoly)) return false;
    if (Math.hypot(X - 425, Y - 30) < 80 || Math.hypot(X + 270, Y + 16) < 48 || Math.hypot(X - 178, Y + 150) < 44) return false;
    const [x, y] = P(X, Y);
    return x > -40 && x < W + 40 && y < H + 60;
  };
  const placed = [], hubs = [];
  for (let i = 0; i < 30; i++) hubs.push([r.range(-760, 760), r.range(-300, 100)]);
  for (let i = 0; i < 6000 && placed.length < 950; i++) {
    const hub = hubs[i % hubs.length];
    const X = i % 5 ? hub[0] + r.gauss() * 46 : r.range(-760, 760), Y = i % 5 ? hub[1] + r.gauss() * 30 : r.range(-300, 110);
    if (!clear(X, Y)) continue;
    const house = r.chance(Y < -170 ? 0.16 : 0.3);
    const need = house ? 15 : 6;
    if (placed.some(([x2, y2, h2]) => Math.hypot(x2 - X, y2 - Y) < (h2 || house ? need : 6.5))) continue;
    placed.push([X, Y, house]);
    if (house) {
      const w = r.range(10, 17), d = r.range(8, 12), z = r.range(7, 12), col = r.pick(ROOFS);
      const X0 = X - w / 2, X1 = X + w / 2, Y0 = Y - d / 2, Y1 = Y + d / 2;
      const foot = [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]];
      const wins = [];
      for (let x = X0 + 2.5; x < X1 - 2; x += 4.2) if (r.chance(0.75)) wins.push(x);
      add(X, Y, (c) => {
        c.fillStyle = SHADOW; poly(c, [P(X0, Y0), P(X1, Y0), P(X1, Y0 - z * 0.5), P(X0, Y0 - z * 0.5)]); c.fill();
        prism(c, foot, 0, z, STONE, { top: false });
        const sN = G.s(VC + Y0 / MU);
        c.fillStyle = SHUTTER; c.beginPath();
        for (const x of wins) { const [px, py] = P(x, Y0, z - 2); c.rect(px, py, 1.7 * sN * 4, 2.6 * sN * ZK); }
        c.fill();
        hipRoof(c, X0 - 0.7, Y0 - 0.7, X1 + 0.7, Y1 + 0.7, z, col);
      }, foot.flatMap(([x, y]) => [P(x, y, 0), P(x, y - z * 0.5, 0), P(x, y, z + 8)]), 'house');
    } else {
      const kind = r.pick(['pine', 'pine', 'olive', 'olive', 'cypress']);
      const rad = kind === 'cypress' ? r.range(1.8, 2.6) : r.range(5, 10), h = kind === 'cypress' ? r.range(14, 22) : r.range(6, 11);
      add(X, Y, (c) => tree(c, X, Y, rad, h, kind), ring(X, Y, rad + 6, h + rad + 4), 'house');
    }
  }

  // far to near, then into marks: each landmark arrives on its own, houses in batches
  items.sort((a, b) => b.d - a.d);
  const groups = [];
  let cur = null;
  for (const it of items) {
    const solo = !['house', 'wall', 'tower'].includes(it.tag);
    if (solo) { groups.push({ items: [it], solo: true }); cur = null; continue; }
    if (!cur || cur.items.length >= 14) { cur = { items: [] }; groups.push(cur); }
    cur.items.push(it);
  }
  const t0 = 3.4, t1 = 8.0;
  groups.forEach((g0, i) => {
    const b = boxOf(g0.items.flatMap((it) => it.pts), 8);
    const t = lerp(t0, t1, i / (groups.length - 1));
    p.group('town', b, (c) => { for (const it of g0.items) it.draw(c); },
      g0.solo ? { t, d: 1.1, reveal: 'rise', ease: 'out' } : { t, d: 0.7, reveal: 'drop', ease: 'out', dy: 10 });
  });
}

// a tree seen from above: a crown on a short trunk, its shadow on the ground toward us
function tree(c, X, Y, rad, h, kind) {
  const s = G.s(VC + Y / MU), k = s * (G.U / MU);
  const [x, y] = P(X, Y), [, yt] = P(X, Y, h);
  if (kind === 'cypress') {
    const w = rad * k, top = yt - rad * k * 1.5;
    c.fillStyle = SHADOW; c.beginPath(); c.ellipse(x, y + w * 0.6, w * 1.1, w * 0.6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = PINE_D; c.beginPath(); c.moveTo(x, top); c.quadraticCurveTo(x + w * 1.4, (top + y) / 2, x, y); c.quadraticCurveTo(x - w * 1.4, (top + y) / 2, x, top); c.fill();
    c.fillStyle = PINE; c.beginPath(); c.moveTo(x, top); c.quadraticCurveTo(x - w * 1.3, (top + y) / 2, x - w * 0.1, y); c.quadraticCurveTo(x - w * 0.5, (top + y) / 2, x, top); c.fill();
    return;
  }
  const R = rad * k, col = kind === 'olive' ? OLIVE : PINE, dark = kind === 'olive' ? shade(OLIVE, 0.72) : PINE_D;
  c.fillStyle = SHADOW; c.beginPath(); c.ellipse(x - R * 0.2, y - R * 0.1, R * 1.05, R * 0.55, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = TRUNK; c.fillRect(x - Math.max(0.6, R * 0.1), yt, Math.max(1.2, R * 0.2), y - yt);
  const fl = kind === 'pine' ? 0.5 : 0.75;
  c.fillStyle = dark; c.beginPath(); c.ellipse(x, yt, R, R * fl, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = col; c.beginPath(); c.ellipse(x - R * 0.22, yt - R * fl * 0.25, R * 0.7, R * fl * 0.62, 0, 0, Math.PI * 2); c.fill();
}

// a ring of points around (X, Y) up to a height, for boxes
function ring(X, Y, rad, z) {
  const pts = [];
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; pts.push(P(X + Math.cos(a) * rad, Y + Math.sin(a) * rad, 0), P(X + Math.cos(a) * rad, Y + Math.sin(a) * rad, z)); }
  return pts;
}

// a round tower from z0 to z1, lit from the left; o.batter widens its foot
function round(c, X, Y, rad, z0, z1, o = {}) {
  const N = 36, rb = rad * (o.batter || 1);
  const at = (rr, a, z) => P(X + Math.cos(a) * rr, Y + Math.sin(a) * rr, z);
  // the near half (facing the eye, toward -Y) in vertical strips, shaded across
  for (let k = 0; k < N; k++) {
    const a0 = Math.PI + (k / N) * Math.PI, a1 = Math.PI + ((k + 1) / N) * Math.PI;
    const nx = Math.cos((a0 + a1) / 2), ny = Math.sin((a0 + a1) / 2);
    const lit = 0.74 + 0.34 * Math.max(0, nx * LIGHT[0] + ny * LIGHT[1]) + 0.08 * Math.max(0, -nx);
    c.fillStyle = shade(STONE, lit);
    poly(c, [at(rb, a0, z0), at(rb, a1 + 0.01, z0), at(rad, a1 + 0.01, z1), at(rad, a0, z1)]); c.fill();
  }
  // the top
  c.fillStyle = STONE_L; c.beginPath();
  for (let k = 0; k <= N; k++) { const [x, y] = at(rad, (k / N) * Math.PI * 2, z1); k ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.fill();
  if (o.corbels) { // a row of small brackets under the crown
    c.fillStyle = shade(STONE, 0.6); c.beginPath();
    for (let k = 1; k < 22; k++) { const a = Math.PI + (k / 22) * Math.PI; const [x, y] = at(rad, a, z1 - 0.5); c.rect(x - 1.2, y, 2.4, 5); }
    c.fill();
  }
  if (o.crown) { // merlons round the rim
    c.fillStyle = STONE; c.beginPath();
    const n = Math.round(rad * 1.2);
    for (let k = 0; k < n; k++) {
      const a = Math.PI + ((k + 0.25) / n) * Math.PI, a1 = Math.PI + ((k + 0.75) / n) * Math.PI;
      const pa = at(rad, a, z1), pb = at(rad, a1, z1), pc = at(rad, a1, z1 + 3.2), pd = at(rad, a, z1 + 3.2);
      c.moveTo(pa[0], pa[1]); c.lineTo(pb[0], pb[1]); c.lineTo(pc[0], pc[1]); c.lineTo(pd[0], pd[1]); c.closePath();
    }
    c.fill();
    c.fillStyle = shade(STONE, 0.66); c.beginPath();
    for (let k = 0; k < n; k++) {
      const a = Math.PI + ((k + 0.75) / n) * Math.PI, a1 = Math.PI + ((k + 1.25) / n) * Math.PI;
      const pa = at(rad * 0.86, a, z1), pb = at(rad * 0.86, a1, z1), pc = at(rad * 0.86, a1, z1 + 2.2), pd = at(rad * 0.86, a, z1 + 2.2);
      c.moveTo(pa[0], pa[1]); c.lineTo(pb[0], pb[1]); c.lineTo(pc[0], pc[1]); c.lineTo(pd[0], pd[1]); c.closePath();
    }
    c.fill();
  }
}

// the top of a fort: a walk along the walls round a sunken courtyard
function court(c, foot, z, k = 0.72) {
  const n = foot.length; let cx = 0, cy = 0; for (const [x, y] of foot) { cx += x / n; cy += y / n; }
  const inner = foot.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
  c.fillStyle = STONE_L; poly(c, foot.map(([x, y]) => P(x, y, z))); c.fill();
  c.fillStyle = mix(STONE_D, ROCK, 0.4); poly(c, inner.map(([x, y]) => P(x, y, z - 1))); c.fill();
  // the inner wall's lit face, seen across the yard
  c.fillStyle = shade(STONE, 0.86); poly(c, inner.slice(0, 3).map(([x, y]) => P(x, y, z - 1)).concat(inner.slice(0, 3).reverse().map(([x, y]) => P(x, y, z - 4)))); c.fill();
}

// merlons along the top of a polygon of walls
function merlons(c, foot, z, open = false) {
  c.fillStyle = STONE; c.beginPath();
  for (let i = 0; i < foot.length - (open ? 1 : 0); i++) {
    const a = foot[i], b = foot[(i + 1) % foot.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L / 3.4));
    for (let k = 0; k < n; k += 2) {
      const t0 = k / n, t1 = (k + 1) / n;
      const pa = P(lerp(a[0], b[0], t0), lerp(a[1], b[1], t0), z), pb = P(lerp(a[0], b[0], t1), lerp(a[1], b[1], t1), z);
      const h = pa[1] - P(lerp(a[0], b[0], t0), lerp(a[1], b[1], t0), z + 2.6)[1];
      c.moveTo(pa[0], pa[1]); c.lineTo(pb[0], pb[1]); c.lineTo(pb[0], pb[1] - h); c.lineTo(pa[0], pa[1] - h); c.closePath();
    }
  }
  c.fill();
}

// a dome over (X, Y): radius in meters, from z up h; with a lantern
function dome(c, X, Y, rad, z, h, col, lantern) {
  const pts = [];
  for (let k = 0; k <= 24; k++) { const a = Math.PI + (k / 24) * Math.PI; pts.push(P(X + Math.cos(a) * rad, Y + Math.sin(a) * rad * 0.2, z)); }
  const [tx, ty] = P(X, Y, z + h);
  const [lx, ly] = P(X - rad, Y, z), [rx] = P(X + rad, Y, z);
  const w = (rx - lx) / 2, cx = (rx + lx) / 2;
  c.fillStyle = shade(col, 0.82);
  c.beginPath(); c.moveTo(lx, ly); c.bezierCurveTo(lx, ly - (ly - ty) * 0.75, cx - w * 0.55, ty, cx, ty); c.bezierCurveTo(cx + w * 0.55, ty, rx, ly - (ly - ty) * 0.75, rx, ly); c.closePath(); c.fill();
  // the lit left flank
  c.fillStyle = shade(col, 1.12);
  c.beginPath(); c.moveTo(lx, ly); c.bezierCurveTo(lx, ly - (ly - ty) * 0.75, cx - w * 0.55, ty, cx, ty); c.bezierCurveTo(cx - w * 0.3, ty + (ly - ty) * 0.3, cx - w * 0.35, ly, cx - w * 0.2, ly); c.closePath(); c.fill();
  if (lantern) {
    const lw = Math.max(2, w * 0.22), lh = lw * 1.6;
    c.fillStyle = STONE_L; c.fillRect(cx - lw / 2, ty - lh + 1, lw, lh);
    c.fillStyle = shade(col, 0.9); c.beginPath(); c.moveTo(cx - lw * 0.7, ty - lh + 1); c.lineTo(cx, ty - lh * 2); c.lineTo(cx + lw * 0.7, ty - lh + 1); c.fill();
  }
}

// a pointed pyramid cap
function spire(c, X, Y, rad, z, h, col) {
  const a = P(X - rad, Y - rad, z), b = P(X + rad, Y - rad, z), d = P(X - rad, Y + rad, z), e = P(X + rad, Y + rad, z), t = P(X, Y, z + h);
  c.fillStyle = shade(col, 0.8); poly(c, [d, e, t]); c.fill();
  c.fillStyle = shade(col, 1.18); poly(c, [a, d, t]); c.fill();
  c.fillStyle = col; poly(c, [a, b, t]); c.fill();
}

// arched openings along a face (a loggia on the ground floor)
function arcade(c, a, b, z0, z1) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L / 6));
  c.fillStyle = HOLE; c.beginPath();
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    const X = lerp(a[0], b[0], t), Y = lerp(a[1], b[1], t);
    const [x, y] = P(X, Y, z0), [, yt] = P(X, Y, z0 + 6);
    const w = Math.max(1.2, (y - yt) * 0.35);
    c.moveTo(x - w, y); c.lineTo(x - w, yt + w); c.arc(x, yt + w, w, Math.PI, 0); c.lineTo(x + w, y); c.closePath();
    const [, y2] = P(X, Y, z0 + 11), [, y3] = P(X, Y, z0 + 14);
    c.rect(x - w * 0.5, y3, w, y2 - y3);
  }
  c.fill();
}
// the wall's face: a sloped foot and a string course, as two tints
function courses(c, a, b, z0, z1, lit) {
  c.fillStyle = shade(STONE, lit * 0.9);
  poly(c, [P(a[0], a[1], z0), P(b[0], b[1], z0), P(b[0], b[1], z0 + (z1 - z0) * 0.35), P(a[0], a[1], z0 + (z1 - z0) * 0.35)]); c.fill();
  c.fillStyle = shade(STONE, lit * 1.12);
  poly(c, [P(a[0], a[1], z0 + (z1 - z0) * 0.35), P(b[0], b[1], z0 + (z1 - z0) * 0.35), P(b[0], b[1], z0 + (z1 - z0) * 0.39), P(a[0], a[1], z0 + (z1 - z0) * 0.39)]); c.fill();
}

// tall church windows
function tall(c, a, b, z0, z1) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 10));
  c.fillStyle = HOLE; c.beginPath();
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, X = lerp(a[0], b[0], t), Y = lerp(a[1], b[1], t);
    const [x, y] = P(X, Y, z0 + (z1 - z0) * 0.3), [, yt] = P(X, Y, z0 + (z1 - z0) * 0.75);
    const w = Math.max(1, (y - yt) * 0.16);
    c.moveTo(x - w, y); c.lineTo(x - w, yt + w); c.arc(x, yt + w, w, Math.PI, 0); c.lineTo(x + w, y); c.closePath();
  }
  c.fill();
}
// a cliff face: streaks of shadow down the rock
function cliff(c, a, b, z0, z1) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L / 6));
  c.strokeStyle = ROCK_D; c.lineWidth = 1.6; c.beginPath();
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, X = lerp(a[0], b[0], t), Y = lerp(a[1], b[1], t);
    const [x, y] = P(X, Y, z0 + (k % 3) * 3), [, yt] = P(X, Y, z1 - (k % 2) * 6);
    c.moveTo(x, y); c.lineTo(x + (k % 2 ? 1 : -1), yt);
  }
  c.stroke();
}

// arrow slits
function slits(c, a, b, z0, z1) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 12));
  c.fillStyle = HOLE; c.beginPath();
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, X = lerp(a[0], b[0], t), Y = lerp(a[1], b[1], t);
    const [x, y] = P(X, Y, z0 + (z1 - z0) * 0.45), [, yt] = P(X, Y, z0 + (z1 - z0) * 0.7);
    c.rect(x - 1, yt, 2, y - yt);
  }
  c.fill();
}

// ================================================================ the slope in front
function slope(p, r) {
  // cypresses: tall dark flames on the slope
  const cyp = [[96, 1660, 210], [140, 1700, 160], [1400, 1640, 230], [1460, 1690, 170], [1340, 1720, 140], [520, 1760, 120], [1080, 1740, 130]];
  cyp.forEach(([x, y, h], i) => {
    const w = h * 0.14;
    const pts = [[x, y - h]];
    for (let k = 1; k <= 12; k++) { const t = k / 12; pts.push([x + w * Math.sin(t * Math.PI * 0.9) * (1 + 0.08 * Math.sin(k * 3.1)), y - h + h * t]); }
    for (let k = 12; k >= 1; k--) { const t = k / 12; pts.push([x - w * Math.sin(t * Math.PI * 0.9) * (1 + 0.08 * Math.cos(k * 2.3)), y - h + h * t]); }
    const lit = pts.slice(13).concat([[x, y], [x, y - h]]);
    p.group('front', boxOf(pts, 6), (c) => {
      c.fillStyle = PINE_D; poly(c, pts); c.fill();
      c.fillStyle = PINE; poly(c, lit.map(([px, py]) => [lerp(px, x, 0.25), py])); c.fill();
    }, { t: 8.5 + i * 0.1, d: 0.8, reveal: 'rise' });
  });
  // an Aleppo pine leaning in from the left, its crown in flat layered clouds
  const trunk = [[40, 2010], [76, 2010], [100, 1840], [160, 1700], [230, 1600], [214, 1592], [140, 1690], [80, 1830]];
  const branches = [[[120, 1760], [40, 1690], [-20, 1660]], [[180, 1660], [280, 1630], [360, 1640]], [[200, 1630], [150, 1560], [110, 1530]]];
  const pads = [[220, 1590, 150, 44], [360, 1640, 100, 30], [100, 1520, 120, 38], [-10, 1660, 120, 36], [200, 1500, 90, 30], [20, 1590, 80, 24]];
  p.group('front', { x: -60, y: 1440, w: 520, h: 580 }, (c) => {
    c.fillStyle = TRUNK; poly(c, trunk); c.fill();
    c.strokeStyle = TRUNK; c.lineCap = 'round';
    for (const br of branches) { c.lineWidth = 11; c.beginPath(); c.moveTo(br[0][0], br[0][1]); c.quadraticCurveTo(br[1][0], br[1][1], br[2][0], br[2][1]); c.stroke(); }
    c.fillStyle = shade(TRUNK, 1.4); c.beginPath(); c.moveTo(76, 2010); c.lineTo(100, 1840); c.lineTo(160, 1700); c.lineTo(230, 1600); c.lineTo(224, 1598); c.lineTo(152, 1700); c.lineTo(90, 1840); c.lineTo(66, 2010); c.fill();
  }, { t: 8.9, d: 1.0, reveal: 'rise' });
  pads.forEach(([x, y, w, h], i) => {
    const pad = [];
    for (let k = 0; k <= 30; k++) { const a = Math.PI + (k / 30) * Math.PI; pad.push([x + Math.cos(a) * w, y + Math.sin(a) * h * (1 + 0.12 * Math.sin(k * 1.7 + i))]); }
    pad.push([x + w * 0.9, y + h * 0.25], [x - w * 0.9, y + h * 0.25]);
    const needles = [];
    for (let k = 0; k < 24; k++) { const a = Math.PI * (0.1 + 0.8 * ((k + 0.5) / 24)); const px = x - Math.cos(a) * w * 0.85, py = y - Math.sin(a) * h * 0.7; needles.push([[px, py], [px + 3, py - 7]]); }
    p.group('front', boxOf(pad, 12), (c) => {
      c.fillStyle = PINE_D; poly(c, pad); c.fill();
      c.fillStyle = PINE; c.beginPath(); c.ellipse(x - w * 0.15, y - h * 0.45, w * 0.7, h * 0.42, 0, Math.PI, Math.PI * 2); c.fill();
      c.strokeStyle = PINE_L; c.lineWidth = 2; c.beginPath();
      for (const [a, b] of needles) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
    }, { t: 9.1 + i * 0.12, d: 0.7, reveal: 'pop' });
  });
}

// ================================================================ boats and gulls
function sailAt(c, x, y, s, sail, hull, flip = 1) {
  c.fillStyle = 'rgba(17,48,110,.55)';
  c.beginPath(); c.ellipse(x, y + 2 * s, 30 * s, 4 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = hull; c.beginPath(); c.moveTo(x - 24 * s * flip, y - 4 * s); c.lineTo(x + 28 * s * flip, y - 4 * s); c.lineTo(x + 18 * s * flip, y + 3 * s); c.lineTo(x - 18 * s * flip, y + 3 * s); c.closePath(); c.fill();
  c.fillStyle = sail;
  c.beginPath(); c.moveTo(x + 2 * s * flip, y - 74 * s); c.quadraticCurveTo(x + 24 * s * flip, y - 40 * s, x + 26 * s * flip, y - 8 * s); c.lineTo(x + 2 * s * flip, y - 8 * s); c.closePath(); c.fill();
  c.fillStyle = shade(sail, 0.82);
  c.beginPath(); c.moveTo(x - 1 * s * flip, y - 60 * s); c.lineTo(x - 1 * s * flip, y - 8 * s); c.lineTo(x - 20 * s * flip, y - 8 * s); c.closePath(); c.fill();
}

function boats(p, r) {
  // moored boats in the old port and at anchor
  const moored = [[-258, 96, '#f3ecd8', '#8a3d2c'], [-270, 112, '#e2b95c', NAVY], [-285, 84, '#f3ecd8', NAVY], [-250, 72, '#f3ecd8', '#3f6a48']];
  const mpts = moored.map(([X, Y]) => P(X, Y));
  p.group('town', boxOf(mpts, 30), (c) => {
    moored.forEach(([X, Y, sail, hull], i) => { const [x, y] = P(X, Y), s = G.s(VC + Y / MU) * 0.42; sailAt(c, x, y, s, sail, hull, i % 2 ? -1 : 1); });
  }, { t: 8.3, d: 0.7, reveal: 'fade' });
  // boats out on the sea, still
  const still = [[-520, 360, 0.6, '#f3ecd8', NAVY, 1], [620, 420, 0.55, '#e7c46a', '#8a3d2c', -1], [-140, 760, 0.45, '#f3ecd8', NAVY, 1], [980, 980, 0.4, '#f3ecd8', NAVY, -1], [200, 1500, 0.3, '#d9663f', NAVY, 1], [-1300, 1300, 0.3, '#f3ecd8', NAVY, 1], [1600, 1700, 0.3, '#f3ecd8', '#8a3d2c', -1]];
  still.forEach(([X, Y, k, sail, hull, f], i) => {
    const [x, y] = P(X, Y), s = G.s(VC + Y / MU) * 1.6 * k;
    const wake = [];
    for (let j = 1; j < 6; j++) wake.push([[x - f * (34 + j * 14) * s, y + j * 1.5 * s], [x - f * (44 + j * 14) * s, y + j * 1.5 * s]]);
    p.group('waves', { x: x - 140 * s - 10, y: y - 80 * s - 10, w: 280 * s + 20, h: 100 * s + 20 }, (c) => {
      c.strokeStyle = FOAM; c.lineWidth = Math.max(1, 2.2 * s); c.beginPath();
      for (const [a, b] of wake) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
      sailAt(c, x, y, s, sail, hull, f);
    }, { t: 4.0 + i * 0.35, d: 0.8, reveal: 'drop', dy: 8 });
  });
  // live: two boats crossing slowly, and gulls wheeling
  const movers = [
    { X0: -900, X1: -200, Y: 560, k: 0.75, sail: '#f6efdc', hull: NAVY, f: -1, t0: 9.2 },
    { X0: 700, X1: 1150, Y: 260, k: 0.9, sail: '#e7c46a', hull: '#8a3d2c', f: -1, t0: 9.6 },
  ];
  for (const m of movers) {
    const s = G.s(VC + m.Y / MU) * 1.6 * m.k;
    p.live('live', {
      t: m.t0, d: 1.0, reveal: 'fade',
      box: { x: 0, y: 470, w: W, h: H - 470 },
      draw: (c, time) => {
        const u = ((time - m.t0) * 0.012) % 1;
        const X = lerp(m.X0, m.X1, m.f < 0 ? 1 - u : u);
        const [x, y] = P(X, m.Y);
        const fade = Math.min(1, Math.min(u, 1 - u) * 12);
        c.globalAlpha *= fade;
        c.strokeStyle = FOAM; c.lineWidth = Math.max(1, 2 * s); c.beginPath();
        for (let j = 1; j < 5; j++) { c.moveTo(x + (34 + j * 16) * s, y + j * 1.6 * s); c.lineTo(x + (46 + j * 16) * s, y + j * 1.6 * s); }
        c.stroke();
        sailAt(c, x, y, s, m.sail, m.hull, m.f);
      },
    });
  }
  const gulls = [[1200, 700, 1.4, 0], [1290, 760, 1.1, 1.3], [380, 620, 1.0, 2.1], [980, 560, 0.9, 0.7]];
  p.live('live', {
    t: 9.8, d: 1.0, reveal: 'fade', box: { x: 0, y: 400, w: W, h: 700 },
    draw: (c, time) => {
      c.strokeStyle = '#f7f1e2'; c.lineCap = 'round';
      for (const [gx, gy, s, ph] of gulls) {
        const a = time * 0.35 + ph, x = gx + Math.cos(a) * 60 * s, y = gy + Math.sin(a * 1.3) * 18 * s;
        const flap = Math.sin(time * 5 + ph * 3), w = 11 * s, h = (2 + flap * 3) * s;
        c.lineWidth = 2.2 * s; c.beginPath();
        c.moveTo(x - w, y - h); c.quadraticCurveTo(x - w * 0.4, y - h - 3 * s, x, y); c.quadraticCurveTo(x + w * 0.4, y - h - 3 * s, x + w, y - h); c.stroke();
      }
    },
  });
}

// ================================================================ the title
function title(p) {
  const y = 300;
  // a thin rule and the line beneath, then the name a letter at a time
  p.pen('title', [[300, 352], [1300, 352]], NAVY, 2.5, { t: 10.2, d: 0.9, cap: 'butt' });
  p.type('title', 'DUBROVNIK', 800, y, {
    family: '"Raleway"', weight: 900, size: 200, color: NAVY, shadow: '#cf5a2f', sx: 7, sy: 7, track: 0.06, align: 'center', fit: 1360,
    t: 10.5, gap: 0.1, d: 0.8, reveal: 'drop', ease: 'back',
  });
  p.type('title', 'DALMACIJA · JADRAN', 800, 410, {
    family: '"Raleway"', weight: 700, size: 34, color: '#7e3424', track: 0.42, align: 'center',
    t: 11.6, gap: 0.05, d: 0.6, reveal: 'fade',
  });
}
