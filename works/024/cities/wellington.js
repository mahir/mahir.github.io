// Wellington: a mid-century screen print in five inks, a charcoal keyline laid
// a hair off its flat colors. The red cable car climbs the Kelburn hillside on
// its straight track, over two trestle viaducts and into a tunnel, between
// wooden houses stacked on poles up the slope. Below it the city meets the
// harbor: the Beehive, Parliament House and the towers; across the water Mount
// Victoria with Oriental Bay's pines and boatsheds at its foot, Matiu / Somes
// Island and the far ranges. The Carter Observatory's dome sits on the crest.
// The wind does the rest: clouds streaming, curls of air, gulls thrown about,
// washing flapping, whitecaps and a heeling yacht, and the name blown in.

import { Plate, W, H } from '../print.js';
import { mix, shade, poly, rng, lerp, clamp } from '../kit.js';

// the inks
const PAPER = '#efe7d6', CHAR = '#2b2a2e', RED = '#d23a2e', RED_D = '#a42a22', MUST = '#e3aa3c', MUST_D = '#c08a26';
const TEAL = '#2f7486', TEAL_L = '#69a5b1', TEAL_D = '#1f5565', SKY = '#bdd5d7', SKY_L = '#dde8e1', WHITE = '#f8f3e7';
const HILL = '#d9c68f', HILL_D = '#b39c5c', SAGE = '#a3b38c', SAGE_D = '#728866', OLIVE = '#55694b', OLIVE_D = '#3f4f3a', FAR = '#8fa5ab', FAR_D = '#71898f', PINK = '#e7b39c', SAND = '#e9d2a0';
const WALLS = [WHITE, MUST, PINK, '#d9e2d4', TEAL_L, WHITE, '#f1d9a8', RED];
const ROOFS = [RED, CHAR, TEAL, RED_D, '#6b6f73', RED];

export const city = {
  id: 'wellington', name: 'Wellington', wall: '#1d3640',
  alt: 'A mid-century screen print of Wellington on a windy day: the red cable car climbing its straight track up the Kelburn hillside over two trestle viaducts toward a tunnel, wooden houses on poles stacked up the slope, the Carter Observatory’s dome on the crest, the Beehive, Parliament House and the city’s towers at the harbor’s edge, Mount Victoria with Oriental Bay’s Norfolk pines and boatsheds across the water, Matiu / Somes Island, a ferry and a heeling yacht, streaming clouds, gulls and washing on a line, with the name WELLINGTON blown across the sky',
  google: 'family=Fredericka+the+Great',
  fonts: [['400 190px "Fredericka the Great"', 'WELLINGTON'], ['400 44px "Fredericka the Great"', 'NEW ZEALAND THE HARBOR CAPITAL']],
  build,
};

const FACE = '"Fredericka the Great", serif';
const M = 56; // the paper margin
const HZ = 800; // where the far ranges meet the harbor
// the Kelburn hillside's crest, falling from the top left toward the city
const crest = (x) => (x < 420 ? 1010 + Math.sin(x / 60) * 8 + (x - 60) * 0.28 : 1112 + (x - 420) * 0.4 + Math.sin(x / 45) * 6);
// the cable car's track: a straight line from Lambton Quay up to the top station
const A = [1250, 1990], B = [200, 1190];
const onTrack = (u) => [lerp(A[0], B[0], u), lerp(A[1], B[1], u)];
const TRACK_ANG = Math.atan2(B[1] - A[1], B[0] - A[0]); // pointing up the hill
const VIADUCTS = [[0.24, 0.36], [0.55, 0.64]];
const TUNNEL = [0.70, 0.79];
// the distance from a point to the track, and how far along it lies
function trackCoord(x, y) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy;
  const u = ((x - A[0]) * dx + (y - A[1]) * dy) / L2;
  const px = A[0] + u * dx, py = A[1] + u * dy;
  return { u, d: Math.hypot(x - px, y - py), side: Math.sign((x - A[0]) * dy - (y - A[1]) * dx) };
}

function build() {
  const p = new Plate({ paper: PAPER, seed: 1955 });
  const r = p.r;
  p.clip = { x: M, y: M, w: W - 2 * M, h: H - 2 * M };
  p.stack('sky', 'clouds', 'far', 'harbor', 'victoria', 'town', 'hill', 'track', 'houses', 'car', 'front', 'air', 'title');
  sky(p, r);
  clouds(p, r);
  far(p, r);
  harbor(p, r);
  victoria(p, r);
  town(p, r);
  hill(p, r);
  track(p, r);
  houses(p, r);
  crestTop(p, r);
  tunnel(p, r);
  front(p, r);
  life(p, r);
  title(p);
  return p;
}

// ---------------------------------------------------------------- helpers
// lines across a shape, the screen printer's tint
function hatch(c, pts, ang, step, color, lw) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  c.save(); poly(c, pts); c.clip();
  c.strokeStyle = color; c.lineWidth = lw; c.beginPath();
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 4;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (let k = -R; k < R; k += step) { c.moveTo(cx - ca * R - sa * k, cy - sa * R + ca * k); c.lineTo(cx + ca * R - sa * k, cy + sa * R + ca * k); }
  c.stroke(); c.restore();
}
// a keyline, printed a little off the color under it
const OFF = [-4, -3];
function keyline(c, pts, closed = true, lw = 2.6) {
  c.strokeStyle = CHAR; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath(); c.moveTo(pts[0][0] + OFF[0], pts[0][1] + OFF[1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0] + OFF[0], pts[i][1] + OFF[1]);
  if (closed) c.closePath();
  c.stroke();
}
const shift = (pts) => pts.map(([x, y]) => [x + OFF[0], y + OFF[1]]);
function bbox(pts, pad) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}

// ---------------------------------------------------------------- the sky
function sky(p, r) {
  p.group('sky', { x: 0, y: 0, w: W, h: HZ + 20 }, (c) => {
    c.fillStyle = SKY; c.fillRect(0, 0, W, HZ + 10);
  }, { t: 0.2, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // a paler band low down, edged in a row of dots like a screen tint
  p.group('sky', { x: 0, y: 560, w: W, h: HZ - 540 }, (c) => {
    c.fillStyle = SKY_L; c.fillRect(0, 640, W, HZ - 630);
    c.beginPath();
    for (let row = 0; row < 5; row++) for (let x = M + (row % 2) * 9; x < W - M; x += 18) { const rad = 4.5 - row * 0.8; c.moveTo(x + rad, 632 - row * 14); c.arc(x, 632 - row * 14, rad, 0, Math.PI * 2); }
    c.fill();
  }, { t: 0.8, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // curls of wind, each a line that ends in a loop, drawn by the pen
  const curls = [[130, 300, 1, 1.0], [930, 250, 1, 1.15], [420, 470, -1, 0.85], [1180, 560, 1, 0.9], [200, 150, -1, 0.7], [1380, 380, -1, 0.8]];
  curls.forEach(([x, y, dir, s], i) => {
    const pts = [];
    const L = 260 * s;
    for (let k = 0; k <= 30; k++) { const u = k / 30; pts.push([x + u * L, y + Math.sin(u * Math.PI * 1.5) * 10 * s * dir]); }
    const cx = x + L, cy = y + Math.sin(Math.PI * 1.5) * 10 * s * dir - 22 * s * dir;
    for (let k = 0; k <= 36; k++) { const rad = 22 * s * (1 - k / 60); pts.push([cx + Math.cos(Math.PI / 2 - (k / 36) * Math.PI * 1.7) * rad, cy + dir * Math.sin(Math.PI / 2 - (k / 36) * Math.PI * 1.7) * rad]); }
    p.pen('sky', pts, CHAR, 2.6, { t: 2.0 + i * 0.18, d: 1.1 });
  });
}
// ribbons of cloud stretched out by the wind: drawn live, they stream across
const CLOUDS = [[200, 380, 520, 52, 26], [900, 330, 440, 44, 34], [600, 560, 600, 40, 22], [1300, 640, 380, 34, 30], [80, 690, 300, 26, 40]];
function ribbon(x, y, w, h) {
  // a long lens, fat at the front (left), thin and torn at the tail
  const top = [], bot = [];
  for (let k = 0; k <= 24; k++) {
    const u = k / 24, fat = Math.sin(Math.PI * Math.pow(u, 0.6)) * h;
    top.push([x + u * w, y - fat * 0.9 - Math.sin(u * 9) * h * 0.08]);
    bot.push([x + u * w, y + fat * 0.25]);
  }
  return top.concat(bot.reverse());
}
function clouds(p, r) {
  const shapes = CLOUDS.map(([x, y, w, h]) => ({ x, y, w, h, pts: ribbon(0, 0, w, h) }));
  p.live('clouds', {
    t: 1.0, d: 1.4, reveal: 'wipe', box: { x: 0, y: 200, w: W, h: 560 },
    draw: (c, time) => {
      for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i], sp = CLOUDS[i][4], span = W + s.w + 200;
        const x = ((s.x + time * sp) % span) - s.w;
        c.save(); c.translate(x, s.y);
        c.fillStyle = WHITE; poly(c, s.pts); c.fill();
        c.strokeStyle = CHAR; c.lineWidth = 2.4; c.lineJoin = 'round';
        c.beginPath(); for (let k = 0; k <= 24; k++) { const [px, py] = s.pts[k]; k ? c.lineTo(px - 4, py - 3) : c.moveTo(px - 4, py - 3); } c.stroke();
        // the shaded belly, two thin lines
        c.lineWidth = 1.4; c.beginPath(); c.moveTo(s.w * 0.12, s.h * 0.05); c.lineTo(s.w * 0.7, s.h * 0.05); c.moveTo(s.w * 0.2, s.h * 0.16); c.lineTo(s.w * 0.55, s.h * 0.16); c.stroke();
        c.restore();
      }
    },
  });
}

// ---------------------------------------------------------------- the far side
function far(p, r) {
  // the ranges across the harbor, two flat inks, a keyline along the nearer
  const back = [[0, HZ + 4]], front = [[0, HZ + 4]];
  for (let x = 0; x <= W; x += 20) {
    back.push([x, HZ - 70 - 30 * Math.sin(x / 210 + 1) - 18 * Math.sin(x / 67) + (x > 1100 ? (x - 1100) * 0.06 : 0)]);
    front.push([x, HZ - 26 - 22 * Math.sin(x / 140 + 2) - 8 * Math.sin(x / 41)]);
  }
  back.push([W, HZ + 4]); front.push([W, HZ + 4]);
  p.group('far', { x: 0, y: HZ - 140, w: W, h: 150 }, (c) => {
    c.fillStyle = mix(FAR, SKY, 0.45); poly(c, back); c.fill();
  }, { t: 2.2, d: 1.0, reveal: 'rise' });
  p.group('far', { x: 0, y: HZ - 70, w: W, h: 80 }, (c) => {
    c.fillStyle = FAR; poly(c, front); c.fill();
    hatch(c, front, -0.9, 9, FAR_D, 1.4);
  }, { t: 2.5, d: 0.9, reveal: 'rise' });
  p.pen('far', front.slice(1, -1).map(([x, y]) => [x - 4, y - 3]), CHAR, 2.2, { t: 2.8, d: 1.2 });
}

// ---------------------------------------------------------------- the harbor
function harbor(p, r) {
  p.group('harbor', { x: 0, y: HZ - 4, w: W, h: 760 }, (c) => {
    c.fillStyle = TEAL; c.fillRect(0, HZ, W, 760);
    c.fillStyle = TEAL_L; c.fillRect(0, HZ, W, 12);
  }, { t: 2.8, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // little V-shaped waves in rows, and whitecaps where the wind catches them
  const rr = rng(31), vs = [], caps = [];
  for (let y = HZ + 22; y < 1500; y += 16 + (y - HZ) * 0.02) {
    const s = 0.6 + (y - HZ) / 500;
    for (let x = M + rr.range(0, 40); x < W - M; x += rr.range(40, 90) * s) {
      vs.push([[x - 7 * s, y - 4 * s], [x, y], [x + 7 * s, y - 4 * s]]);
      if (rr.chance(0.22)) caps.push([[x + 14 * s, y - 2], [x + 30 * s, y - 2]]);
    }
  }
  p.strokes('harbor', vs, TEAL_L, 2, { t: 3.2, d: 1.2, reveal: 'wipe', box: { x: 0, y: HZ, w: W, h: 720 } });
  p.strokes('harbor', caps, WHITE, 3, { t: 3.5, d: 1.0, reveal: 'wipe', box: { x: 0, y: HZ, w: W, h: 720 } });
  // Matiu / Somes Island, with its little lighthouse
  const isl = [[880, 862], [910, 846], [960, 838], [1010, 844], [1050, 858], [1060, 866], [870, 866]];
  p.group('harbor', bbox(isl, 40), (c) => {
    c.fillStyle = SAGE; poly(c, isl); c.fill();
    hatch(c, isl, 0.9, 7, SAGE_D, 1.2);
    keyline(c, isl.slice(0, 6), false, 2);
    c.fillStyle = WHITE; c.fillRect(1000, 822, 7, 20); c.fillStyle = RED; c.fillRect(999, 818, 9, 5);
  }, { t: 3.6, d: 0.7, reveal: 'rise' });
}

// ---------------------------------------------------------------- Mount Victoria and Oriental Bay
function victoria(p, r) {
  const top = (x) => 1260 - 380 * Math.exp(-(((x - 1330) / 230) ** 2)) - 40 * Math.exp(-(((x - 1150) / 90) ** 2)) + Math.sin(x / 31) * 3;
  const hillPts = [[960, 1280]];
  for (let x = 960; x <= W; x += 12) hillPts.push([x, Math.min(1270, top(x))]);
  hillPts.push([W, 1300], [960, 1300]);
  const rr = rng(41), pines = [], homes = [];
  for (let i = 0; i < 90; i++) { const x = rr.range(1040, 1580), t = top(x); const y = rr.range(t + 6, t + 120); if (y < 1250) pines.push([x, y, rr.range(9, 15)]); }
  for (let i = 0; i < 120; i++) { const x = rr.range(990, 1580), t = top(x); const y = rr.range(t + 100, 1250); if (y < 1255 && y > t + 30) homes.push([x, y, rr.pick(WALLS), rr.pick(ROOFS)]); }
  homes.sort((a, b) => a[1] - b[1]);
  p.group('victoria', bbox(hillPts, 6), (c) => {
    c.fillStyle = SAGE; poly(c, hillPts); c.fill();
    hatch(c, hillPts, -0.7, 10, mix(SAGE, SAGE_D, 0.6), 1.3);
  }, { t: 3.7, d: 1.0, reveal: 'rise', ease: 'out' });
  p.pen('victoria', hillPts.slice(1, -3).map(([x, y]) => [x - 4, y - 3]), CHAR, 2.6, { t: 4.1, d: 1.2 });
  // the town belt's dark pines along the ridge, the lookout on the summit
  p.group('victoria', { x: 1000, y: 860, w: 600, h: 320 }, (c) => {
    c.fillStyle = OLIVE_D;
    for (const [x, y, s] of pines) { poly(c, [[x, y - s * 2], [x - s * 0.8, y], [x + s * 0.8, y]]); c.fill(); }
    c.fillStyle = WHITE; c.fillRect(1318, 872, 24, 10); c.fillStyle = CHAR; c.fillRect(1316, 868, 28, 4);
    c.strokeStyle = CHAR; c.lineWidth = 2; c.beginPath(); c.moveTo(1352, 880); c.lineTo(1352, 840); c.stroke();
    c.fillStyle = RED; poly(c, [[1353, 840], [1376, 846], [1353, 852]]); c.fill();
  }, { t: 4.3, d: 0.8, reveal: 'fade' });
  p.group('victoria', { x: 960, y: 1000, w: 640, h: 270 }, (c) => {
    for (const [x, y, wall, roof] of homes) {
      c.fillStyle = wall; c.fillRect(x, y - 9, 14, 9);
      c.fillStyle = roof; poly(c, [[x - 2, y - 9], [x + 7, y - 15], [x + 16, y - 9]]); c.fill();
      c.fillStyle = CHAR; c.fillRect(x + 3, y - 6, 3, 3);
    }
  }, { t: 4.5, d: 0.8, reveal: 'drop', dy: 10 });
  // Oriental Bay: the beach's curve, white apartments, Norfolk pines and the boatsheds
  p.group('victoria', { x: 960, y: 1180, w: 640, h: 140 }, (c) => {
    c.fillStyle = SAND; poly(c, [[1000, 1262], [1200, 1270], [1420, 1262], [W, 1258], [W, 1282], [1000, 1286]]); c.fill();
    for (let k = 0; k < 9; k++) { const x = 1150 + k * 46, h = 30 + (k % 3) * 10; c.fillStyle = k % 4 === 1 ? MUST : WHITE; c.fillRect(x, 1258 - h, 38, h); c.fillStyle = CHAR; for (let y = 1258 - h + 6; y < 1252; y += 9) c.fillRect(x + 4, y, 30, 2.4); }
    // Norfolk pines: a straight stem and level tiers
    c.strokeStyle = OLIVE_D; c.lineWidth = 2.4;
    for (let k = 0; k < 8; k++) {
      const x = 1130 + k * 58, b = 1268;
      c.beginPath(); c.moveTo(x, b); c.lineTo(x, b - 64); for (let t = 0; t < 6; t++) { const yy = b - 18 - t * 9, w = 14 - t * 2; c.moveTo(x - w, yy + 3); c.lineTo(x, yy); c.lineTo(x + w, yy + 3); } c.stroke();
    }
    // the boatsheds on their piles at the water, each a different color
    const cols = [RED, MUST, TEAL_L, WHITE, RED, MUST];
    for (let k = 0; k < 6; k++) { const x = 1000 + k * 24; c.fillStyle = cols[k]; c.fillRect(x, 1268, 20, 14); c.fillStyle = CHAR; poly(c, [[x - 1, 1268], [x + 10, 1260], [x + 21, 1268]]); c.fill(); c.fillRect(x + 6, 1273, 8, 9); }
    c.strokeStyle = CHAR; c.lineWidth = 2; c.beginPath(); c.moveTo(996, 1283); c.lineTo(W, 1278); c.stroke();
  }, { t: 4.8, d: 0.9, reveal: 'wipeL' });
}

// ---------------------------------------------------------------- the city at the water
function town(p, r) {
  // the reclaimed flat along the waterfront
  const flat = [[300, 1290], [600, 1282], [1000, 1286], [1600, 1290]];
  for (let x = 1600; x >= 300; x -= 20) flat.push([x, Math.max(1300, crest(x) + 60)]);
  p.group('town', bbox(flat, 4), (c) => {
    c.fillStyle = '#d8cdb5'; poly(c, flat); c.fill();
    c.strokeStyle = CHAR; c.lineWidth = 2.4; c.beginPath(); c.moveTo(296, 1287); c.lineTo(1000, 1283); c.lineTo(1600, 1287); c.stroke();
    // wharves
    c.fillStyle = '#c9bea4'; for (const [x, w] of [[560, 70], [820, 50]]) c.fillRect(x, 1262, w, 24);
  }, { t: 4.4, d: 0.8, reveal: 'wipe' });
  // the towers: mid-century slabs with grid windows, hatched on their shaded side
  const rr = rng(51), blocks = [];
  const spots = [[1050, 70, 190], [1120, 54, 250], [1190, 66, 160], [1010, 48, 120], [1250, 60, 120], [940, 56, 110], [1160, 44, 100], [980, 60, 80], [1300, 70, 70], [1090, 70, 70], [880, 50, 60]];
  for (const [x, w, h] of spots) blocks.push({ x, w, h, col: rr.pick([WHITE, '#d9d6cc', MUST, '#cdd8d6', WHITE, PINK]), b: 1300 });
  blocks.sort((a, b) => b.h - a.h);
  const draw = (c, o) => {
    const { x, w, h, col, b } = o, top = b - h, pts = [[x, b], [x, top], [x + w, top], [x + w, b]];
    c.fillStyle = col; poly(c, pts); c.fill();
    hatch(c, [[x + w * 0.65, b], [x + w * 0.65, top], [x + w, top], [x + w, b]], 0.8, 5, shade(col, 0.7), 1.2);
    c.fillStyle = CHAR;
    for (let y = top + 8; y < b - 6; y += 10) for (let xx = x + 5; xx < x + w * 0.62; xx += 9) c.fillRect(xx, y, 5, 5);
    keyline(c, pts, true, 2.2);
  };
  for (let i = 0; i < blocks.length; i += 3) {
    const set = blocks.slice(i, i + 3);
    p.group('town', { x: 820, y: 1000, w: 580, h: 310 }, (c) => { for (const o of set) draw(c, o); }, { t: 4.7 + i * 0.1, d: 0.9, reveal: 'rise' });
  }
  // the low blocks of the flat behind the waterfront, row on row down to the hill
  const lr = rng(53), rows = [];
  for (let y = 1328; y < 1720; y += 38) {
    const row = [];
    for (let x = 300 + lr.range(0, 30); x < W - 20; x += lr.range(50, 96)) {
      if (crest(x) < y - 60) continue;
      row.push([x, y, lr.range(40, 84), lr.range(22, 46), lr.pick([WHITE, '#d9d6cc', PINK, MUST, '#cdd8d6', WHITE, '#e6d3b4'])]);
    }
    rows.push(row);
  }
  for (let i = 0; i < rows.length; i += 2) {
    const set = rows.slice(i, i + 2).flat();
    if (!set.length) continue;
    p.group('town', { x: 280, y: set[0][1] - 60, w: W - 280, h: 120 }, (c) => {
      for (const [x, y, w, h, col] of set) {
        const pts = [[x, y], [x, y - h], [x + w, y - h], [x + w, y]];
        c.fillStyle = col; poly(c, pts); c.fill();
        c.fillStyle = CHAR; for (let yy = y - h + 7; yy < y - 8; yy += 10) for (let xx = x + 5; xx < x + w - 8; xx += 9) c.fillRect(xx, yy, 4, 5);
        keyline(c, pts, true, 1.8);
      }
    }, { t: 4.5 + i * 0.05, d: 0.7, reveal: 'rise' });
  }
  // Parliament House: gray stone, a row of columns and a heavy cornice
  p.group('town', { x: 770, y: 1190, w: 170, h: 120 }, (c) => {
    const x = 780, b = 1300, w = 150, h = 64;
    c.fillStyle = '#c8c4ba'; c.fillRect(x, b - h, w, h);
    c.fillStyle = '#a9a59c'; c.fillRect(x, b - h, w, 8); c.fillRect(x, b - 14, w, 14);
    c.fillStyle = CHAR; for (let k = 0; k < 12; k++) c.fillRect(x + 8 + k * 12, b - h + 14, 3, 34);
    keyline(c, [[x, b], [x, b - h], [x + w, b - h], [x + w, b]], true, 2.2);
  }, { t: 5.2, d: 0.8, reveal: 'rise' });
  // the Beehive: a round tower of tiers, each a white ledge over a dark band of fins
  p.group('town', { x: 600, y: 1100, w: 200, h: 210 }, (c) => {
    const cx = 690, b = 1300;
    for (let k = 0; k < 10; k++) {
      const w = 140 - k * 4.2, y = b - 12 - k * 15;
      c.fillStyle = '#8a5a3c'; c.fillRect(cx - w / 2, y - 11, w, 11);
      c.fillStyle = CHAR; for (let xx = cx - w / 2 + 3; xx < cx + w / 2 - 2; xx += 5) c.fillRect(xx, y - 10, 1.6, 9);
      c.fillStyle = WHITE; c.beginPath(); c.ellipse(cx, y, w / 2 + 3, 4, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = CHAR; c.lineWidth = 1.6; c.beginPath(); c.ellipse(cx - 3, y - 2, w / 2 + 3, 4, 0, 0, Math.PI); c.stroke();
    }
    c.fillStyle = WHITE; c.fillRect(cx - 80, b - 12, 160, 12); keyline(c, [[cx - 80, b], [cx - 80, b - 12], [cx + 80, b - 12], [cx + 80, b]], true, 2);
    c.fillStyle = '#b07a50'; c.beginPath(); c.ellipse(cx, b - 162, 44, 10, 0, Math.PI, 0); c.fill();
    c.strokeStyle = CHAR; c.lineWidth = 2; c.beginPath(); c.ellipse(cx - 4, b - 165, 44, 10, 0, Math.PI, 0); c.stroke();
    c.beginPath(); c.moveTo(cx - 4, b - 175); c.lineTo(cx - 4, b - 186); c.stroke();
  }, { t: 5.4, d: 1.0, reveal: 'rise', ease: 'out' });
}

// ---------------------------------------------------------------- the Kelburn hillside
function hill(p, r) {
  const pts = [[M - 10, H]];
  for (let x = M - 10; x <= W + 10; x += 10) pts.push([x, crest(x)]);
  pts.push([W + 10, H]);
  const ticks = [], rr = rng(61);
  for (let i = 0; i < 900; i++) { const x = rr.range(M, W - M), y = rr.range(crest(x) + 10, H - M); ticks.push([[x, y], [x + 4, y - 7]]); }
  p.group('hill', { x: 0, y: 980, w: W, h: H - 980 }, (c) => {
    c.fillStyle = HILL; poly(c, pts); c.fill();
  }, { t: 5.8, d: 1.0, reveal: 'rise', ease: 'out' });
  p.strokes('hill', ticks, HILL_D, 1.6, { t: 6.3, d: 0.8, reveal: 'fade', box: { x: 0, y: 980, w: W, h: H - 980 } });
  p.pen('hill', pts.slice(1, -1).map(([x, y]) => [x - 4, y - 3]), CHAR, 2.8, { t: 6.0, d: 1.4 });
}

// ---------------------------------------------------------------- the track and its viaducts
function track(p, r) {
  // the viaducts: trestles of steel legs and cross braces under the rails
  const legs = [];
  for (const [u0, u1] of VIADUCTS) {
    for (let k = 0; k <= 6; k++) {
      const u = lerp(u0, u1, k / 6), [x, y] = onTrack(u), depth = 110 * Math.sin((k / 6) * Math.PI) + 24;
      legs.push([[x, y + 4], [x, y + depth]]);
      if (k < 6) { const [x2, y2] = onTrack(lerp(u0, u1, (k + 1) / 6)), d2 = 110 * Math.sin(((k + 1) / 6) * Math.PI) + 24; legs.push([[x, y + depth * 0.5], [x2, y2 + 4]], [[x, y + 4], [x2, y2 + d2 * 0.5]]); }
    }
  }
  p.strokes('track', legs, CHAR, 3.2, { t: 6.4, d: 0.9, reveal: 'fall', box: bbox(legs.flat(), 10) });
  // the bed, the rails and the sleepers, laid from the bottom up
  const bed = [onTrack(0), onTrack(1)];
  p.pen('track', bed, '#8b8577', 16, { t: 6.6, d: 1.4, cap: 'butt' });
  const ca = Math.cos(TRACK_ANG + Math.PI / 2), sa = Math.sin(TRACK_ANG + Math.PI / 2);
  const rail = (k) => [[A[0] + ca * k, A[1] + sa * k], [B[0] + ca * k, B[1] + sa * k]];
  const sleepers = [];
  for (let u = 0.005; u < 1; u += 0.012) { const [x, y] = onTrack(u); sleepers.push([[x - ca * 9, y - sa * 9], [x + ca * 9, y + sa * 9]]); }
  p.strokes('track', sleepers, CHAR, 2, { t: 7.0, d: 1.2, reveal: 'wipeL', box: bbox([A, B], 20) });
  p.pen('track', rail(-5), CHAR, 2, { t: 7.2, d: 1.2 });
  p.pen('track', rail(5), CHAR, 2, { t: 7.3, d: 1.2 });
  // the passing loop halfway up
  const loop = [];
  for (let k = 0; k <= 20; k++) { const u = lerp(0.44, 0.56, k / 20), [x, y] = onTrack(u), b = Math.sin((k / 20) * Math.PI) * 18; loop.push([x - ca * b, y - sa * b]); }
  p.pen('track', loop, CHAR, 2, { t: 7.6, d: 0.6 });
  // the top station at Kelburn
  p.group('track', { x: 140, y: 1100, w: 140, h: 110 }, (c) => {
    const x = 170, y = 1192;
    const pts = [[x - 30, y + 6], [x - 30, y - 50], [x + 50, y - 70], [x + 50, y - 6]];
    c.fillStyle = WHITE; poly(c, pts); c.fill();
    c.fillStyle = RED; poly(c, [[x - 36, y - 48], [x + 56, y - 72], [x + 56, y - 62], [x - 36, y - 40]]); c.fill();
    c.fillStyle = CHAR; c.fillRect(x - 18, y - 36, 14, 22); c.fillRect(x + 8, y - 44, 14, 22); c.fillRect(x + 30, y - 50, 12, 22);
    keyline(c, pts, true, 2.2);
  }, { t: 8.0, d: 0.7, reveal: 'rise' });
}

// ---------------------------------------------------------------- the houses on the hill
// wooden houses on poles: a weatherboard box, a gable of corrugated iron, a
// window or two and a porch, the posts going down to the slope below
function houses(p, r) {
  const rr = rng(71), list = [];
  for (let i = 0; i < 2400 && list.length < 170; i++) {
    const x = rr.range(M - 20, W - M + 10), y = rr.range(crest(x) + 40, H - 40);
    const tc = trackCoord(x, y);
    if (tc.d < 70 && tc.u > -0.05 && tc.u < 1.05) continue; // keep the track clear
    if (tc.side > 0 && tc.u > TUNNEL[0] - 0.05 && tc.u < TUNNEL[1] + 0.03 && tc.d < 120) continue;
    if (x > 380 && x < 790 && y > 1690 && y < 1960) continue; // the yard with the washing
    const s = 0.55 + (y - 1100) / 1300;
    if (list.some((h) => Math.abs(h.x - x) < 58 * Math.max(s, h.s) && Math.abs(h.y - y) < 48 * Math.max(s, h.s))) continue;
    list.push({ x, y, s, wall: rr.pick(WALLS), roof: rr.pick(ROOFS), w: rr.range(46, 66), h: rr.range(28, 40), gable: rr.chance(0.6), win: rr.int(1, 3), posts: rr.range(8, 26), deck: rr.chance(0.35), flip: rr.chance(0.5) });
  }
  list.sort((a, b) => a.y - b.y);
  const draw = (c, o) => {
    const { x, y, s } = o, w = o.w * s, h = o.h * s, pw = o.posts * s;
    // the posts down to the slope
    c.strokeStyle = CHAR; c.lineWidth = 2;
    c.beginPath(); for (let k = 0; k < 3; k++) { const px = x + 4 + k * (w - 8) / 2; c.moveTo(px, y); c.lineTo(px, y + pw + k * 4 * s); } c.stroke();
    const body = [[x, y], [x, y - h], [x + w, y - h], [x + w, y]];
    c.fillStyle = o.wall; poly(c, body); c.fill();
    // weatherboards
    c.strokeStyle = shade(o.wall, 0.82); c.lineWidth = 1; c.beginPath(); for (let yy = y - 4 * s; yy > y - h; yy -= 4 * s) { c.moveTo(x, yy); c.lineTo(x + w, yy); } c.stroke();
    let roof;
    if (o.gable) roof = o.flip ? [[x - 5 * s, y - h], [x + w * 0.3, y - h - 20 * s], [x + w * 0.62, y - h]] : [[x + w * 0.38, y - h], [x + w * 0.7, y - h - 20 * s], [x + w + 5 * s, y - h]];
    else roof = [[x - 4 * s, y - h], [x + 6 * s, y - h - 13 * s], [x + w - 6 * s, y - h - 13 * s], [x + w + 4 * s, y - h]];
    if (o.gable) { // the long roof behind the gable
      const back = o.flip ? [[x + w * 0.3, y - h - 20 * s], [x + w, y - h - 14 * s], [x + w + 3 * s, y - h], [x + w * 0.6, y - h]] : [[x - 3 * s, y - h], [x, y - h - 14 * s], [x + w * 0.7, y - h - 20 * s], [x + w * 0.4, y - h]];
      c.fillStyle = shade(o.roof, 0.78); poly(c, back); c.fill();
      keyline(c, back, true, 1.6);
    }
    c.fillStyle = o.roof; poly(c, roof); c.fill();
    // windows, a door
    c.fillStyle = CHAR;
    for (let k = 0; k < o.win; k++) c.fillRect(x + w * (0.14 + k * 0.28), y - h * 0.7, 8 * s, 10 * s);
    c.fillStyle = shade(o.wall, 0.6); c.fillRect(x + w * 0.78, y - h * 0.62, 7 * s, h * 0.62);
    keyline(c, body, true, 2);
    keyline(c, roof, true, 2);
    if (o.deck) { c.strokeStyle = CHAR; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 10 * s, y - 2); c.lineTo(x, y - 2); for (let k = 0; k < 4; k++) { c.moveTo(x - 10 * s + k * 3 * s, y - 2); c.lineTo(x - 10 * s + k * 3 * s, y - 9 * s); } c.moveTo(x - 10 * s, y - 9 * s); c.lineTo(x, y - 9 * s); c.stroke(); }
  };
  // trees between them: wind-bent macrocarpa, cabbage trees, a few pines
  const trees = [];
  for (let i = 0; i < 600 && trees.length < 46; i++) {
    const x = rr.range(M, W - M), y = rr.range(crest(x) + 30, H - 60), tc = trackCoord(x, y);
    if (tc.d < 50 && tc.u > -0.05 && tc.u < 1.05) continue;
    if (x > 360 && x < 800 && y > 1660) continue;
    if (list.some((h) => x > h.x - 20 && x < h.x + h.w * h.s + 20 && y > h.y - 60 * h.s && y < h.y + 30)) continue;
    trees.push({ x, y, s: 0.6 + (y - 1100) / 1300, kind: rr.pick(['mac', 'mac', 'cab', 'pine']) });
  }
  const bent = (c, o) => {
    const { x, y, s } = o;
    if (o.kind === 'mac') {
      // a macrocarpa pushed over by the northerly: a leaning trunk and flat,
      // layered foliage streaming away to the right
      c.strokeStyle = CHAR; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 4 * s, y - 20 * s, x + 18 * s, y - 34 * s); c.stroke();
      const lobes = [[x + 4 * s, y - 30 * s, 26 * s, 11 * s], [x + 26 * s, y - 40 * s, 34 * s, 12 * s], [x + 22 * s, y - 56 * s, 28 * s, 10 * s], [x + 44 * s, y - 50 * s, 22 * s, 8 * s]];
      c.fillStyle = OLIVE; c.beginPath(); for (const [lx, ly, rx, ry] of lobes) { c.moveTo(lx + rx, ly); c.ellipse(lx, ly, rx, ry, -0.08, 0, Math.PI * 2); } c.fill();
      c.fillStyle = OLIVE_D; c.beginPath(); for (const [lx, ly, rx, ry] of lobes) { c.moveTo(lx + rx, ly + ry * 0.3); c.ellipse(lx + 2 * s, ly + ry * 0.35, rx * 0.9, ry * 0.5, -0.08, 0, Math.PI); } c.fill();
      c.strokeStyle = CHAR; c.lineWidth = 1.8; c.beginPath(); for (const [lx, ly, rx, ry] of lobes) { c.moveTo(lx - rx - 4, ly - 3); c.ellipse(lx - 4, ly - 3, rx, ry, -0.08, Math.PI, Math.PI * 2); } c.stroke();
    } else if (o.kind === 'cab') {
      c.strokeStyle = CHAR; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6 * s, y - 50 * s); c.stroke();
      c.strokeStyle = OLIVE_D; c.lineWidth = 2;
      c.beginPath(); for (let k = 0; k < 11; k++) { const a = -Math.PI * 0.95 + (k / 10) * Math.PI * 0.9 + 0.35; c.moveTo(x + 6 * s, y - 50 * s); c.lineTo(x + 6 * s + Math.cos(a) * 24 * s + 8 * s, y - 50 * s + Math.sin(a) * 18 * s); } c.stroke();
    } else {
      const pts = [[x, y - 70 * s], [x - 16 * s, y - 4 * s], [x + 16 * s, y - 4 * s]];
      c.fillStyle = OLIVE_D; poly(c, pts); c.fill();
      c.strokeStyle = SAGE; c.lineWidth = 1.2; c.beginPath(); for (let k = 1; k < 6; k++) { const yy = y - 4 * s - k * 11 * s, ww = 16 * s * (1 - k / 6.5); c.moveTo(x - ww, yy + 4 * s); c.lineTo(x, yy); c.lineTo(x + ww, yy + 4 * s); } c.stroke();
      keyline(c, pts, true, 1.8);
    }
  };
  // steps and paths zigzagging up between the houses
  const steps = [];
  for (const [x0, y0] of [[360, 1960], [980, 1960], [1450, 1900]]) {
    let x = x0, y = y0;
    const line = [[x, y]];
    for (let k = 0; k < 7; k++) { x += (k % 2 ? -1 : 1) * 70; y -= 80; if (y < crest(x) + 30) break; line.push([x, y]); }
    steps.push(line);
  }
  const all = list.map((h) => ({ ...h, t: 'h' })).concat(trees.map((t) => ({ ...t, t: 't' }))).sort((a, b) => a.y - b.y);
  p.strokes('houses', steps, '#f3ecdc', 5, { t: 6.8, d: 1.0, reveal: 'rise', box: { x: 200, y: 1300, w: 1400, h: 700 } });
  const per = 6;
  for (let i = 0; i < all.length; i += per) {
    const set = all.slice(i, i + per);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const o of set) { x0 = Math.min(x0, o.x - 40); x1 = Math.max(x1, o.x + 120 * o.s); y0 = Math.min(y0, o.y - 100 * o.s); y1 = Math.max(y1, o.y + 40 * o.s); }
    p.group('houses', { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, (c) => { for (const o of set) (o.t === 'h' ? draw : bent)(c, o); }, { t: 7.2 + (i / per) * 0.11, d: 0.7, reveal: 'drop', dy: 18 });
  }
}

// the crest: the Botanic Garden's trees and the Carter Observatory's dome
function crestTop(p, r) {
  p.group('houses', { x: 240, y: 980, w: 220, h: 170 }, (c) => {
    const x = 330, b = crest(330) + 8;
    const body = [[x - 50, b], [x - 50, b - 34], [x + 50, b - 34], [x + 50, b]];
    c.fillStyle = WHITE; poly(c, body); c.fill();
    c.fillStyle = CHAR; for (let k = 0; k < 5; k++) c.fillRect(x - 40 + k * 18, b - 26, 8, 12);
    keyline(c, body, true, 2.2);
    c.fillStyle = '#c9c6bd'; c.beginPath(); c.arc(x, b - 34, 30, Math.PI, 0); c.fill();
    hatch(c, [[x, b - 64], [x + 30, b - 34], [x, b - 34]], 0.9, 4, '#8e8b84', 1.2);
    c.strokeStyle = CHAR; c.lineWidth = 2.2; c.beginPath(); c.arc(x - 4, b - 37, 30, Math.PI, 0); c.stroke();
    c.beginPath(); c.moveTo(x - 4, b - 67); c.lineTo(x + 6, b - 40); c.stroke();
  }, { t: 8.4, d: 0.7, reveal: 'rise' });
  // a stand of garden trees round it
  const rr = rng(81), crowns = [];
  for (let i = 0; i < 16; i++) { const x = rr.range(M, 560); if (Math.abs(x - 330) < 70) continue; crowns.push([x, crest(x) + rr.range(4, 30), rr.range(18, 30)]); }
  p.group('houses', { x: 0, y: 900, w: 620, h: 200 }, (c) => {
    c.fillStyle = OLIVE; c.beginPath(); for (const [x, y, s] of crowns) { c.moveTo(x + s, y - s); c.ellipse(x, y - s, s * 1.2, s, -0.2, 0, Math.PI * 2); } c.fill();
    c.strokeStyle = CHAR; c.lineWidth = 2; c.beginPath(); for (const [x, y, s] of crowns) { c.moveTo(x - 4 + s * 1.2, y - s - 3); c.ellipse(x - 4, y - s - 3, s * 1.2, s, -0.2, Math.PI * 1.0, Math.PI * 2.0); } c.stroke();
  }, { t: 8.7, d: 0.7, reveal: 'pop' });
}

// the tunnel near the top: the hill closes over the track, an arch at each end
function tunnel(p, r) {
  const [x0, y0] = onTrack(TUNNEL[0]), [x1, y1] = onTrack(TUNNEL[1]);
  const ca = Math.cos(TRACK_ANG + Math.PI / 2), sa = Math.sin(TRACK_ANG + Math.PI / 2);
  const cover = [[x0 - ca * 30, y0 - sa * 30], [x1 - ca * 30, y1 - sa * 30], [x1 + ca * 120, y1 + sa * 120], [x0 + ca * 120, y0 + sa * 120]];
  p.group('front', bbox(cover, 40), (c) => {
    c.fillStyle = HILL; poly(c, cover); c.fill();
    c.strokeStyle = HILL_D; c.lineWidth = 1.6; c.beginPath();
    for (let k = 1; k < 8; k++) { const u = k / 8, xa = lerp(cover[0][0], cover[1][0], u), ya = lerp(cover[0][1], cover[1][1], u); c.moveTo(xa + ca * 50, ya + sa * 50); c.lineTo(xa + ca * 50 + 4, ya + sa * 50 - 7); } c.stroke();
    // the portals: dark mouths in a concrete face
    for (const [x, y] of [[x0, y0], [x1, y1]]) {
      c.save(); c.translate(x, y); c.rotate(TRACK_ANG + Math.PI / 2);
      c.fillStyle = '#cfc8b8'; c.fillRect(-34, -8, 68, 16);
      c.restore();
      c.fillStyle = CHAR; c.beginPath(); c.ellipse(x, y - 8, 16, 22, 0, Math.PI, 0); c.lineTo(x + 16, y + 6); c.lineTo(x - 16, y + 6); c.fill();
    }
  }, { t: 8.9, d: 0.7, reveal: 'fade' });
}

// ---------------------------------------------------------------- the foreground
function front(p, r) {
  // the yard with the washing line, and a walker whose umbrella has turned inside out
  p.group('front', { x: 380, y: 1660, w: 420, h: 320 }, (c) => {
    c.strokeStyle = CHAR; c.lineWidth = 3;
    c.beginPath(); c.moveTo(570, 1940); c.lineTo(570, 1790); c.moveTo(750, 1920); c.lineTo(750, 1770); c.stroke();
    c.beginPath(); c.moveTo(558, 1792); c.lineTo(582, 1788); c.moveTo(738, 1772); c.lineTo(762, 1768); c.stroke();
    // the walker on the steps
    c.save(); c.translate(450, 1950); c.scale(1.35, 1.35); c.translate(-450, -1950);
    const x = 450, f = 1950;
    c.fillStyle = CHAR; c.fillRect(x - 8, f - 40, 6, 40); c.fillRect(x + 3, f - 40, 6, 36);
    c.fillStyle = MUST; poly(c, [[x - 14, f - 38], [x - 10, f - 92], [x + 12, f - 92], [x + 18, f - 38]]); c.fill();
    keyline(c, [[x - 14, f - 38], [x - 10, f - 92], [x + 12, f - 92], [x + 18, f - 38]], true, 2);
    c.fillStyle = PINK; c.beginPath(); c.arc(x, f - 102, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = CHAR; c.fillRect(x - 10, f - 112, 18, 4);
    c.strokeStyle = CHAR; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x + 10, f - 84); c.lineTo(x + 34, f - 132); c.stroke();
    // the umbrella blown inside out: a red cup on its handle
    c.fillStyle = RED; poly(c, [[x + 34, f - 132], [x + 8, f - 176], [x + 30, f - 166], [x + 48, f - 182], [x + 66, f - 162], [x + 34, f - 132]]); c.fill();
    keyline(c, [[x + 34, f - 132], [x + 8, f - 176], [x + 30, f - 166], [x + 48, f - 182], [x + 66, f - 162]], true, 2);
    c.restore();
  }, { t: 9.4, d: 0.7, reveal: 'rise' });
}

// ---------------------------------------------------------------- what moves
function life(p, r) {
  // the two cable cars, counterbalanced: one climbs as the other comes down,
  // and they pass on the loop halfway
  const ca = Math.cos(TRACK_ANG + Math.PI / 2), sa = Math.sin(TRACK_ANG + Math.PI / 2);
  const drawCar = (c, u, side, label) => {
    const [x, y] = onTrack(u), bump = Math.max(0, 1 - Math.abs(u - 0.5) / 0.06) * 14 * side;
    const cx = x - ca * bump, cy = y - sa * bump;
    const dx = Math.cos(TRACK_ANG), dy = Math.sin(TRACK_ANG), L = 62, Hh = 58;
    // vertical ends, roof and floor along the slope
    const p0 = [cx - dx * L, cy - dy * L - 6], p1 = [cx + dx * L, cy + dy * L - 6];
    const body = [p0, p1, [p1[0], p1[1] - Hh], [p0[0], p0[1] - Hh]];
    c.fillStyle = RED; poly(c, body); c.fill();
    c.fillStyle = RED_D; poly(c, [p0, p1, [p1[0], p1[1] - 12], [p0[0], p0[1] - 12]]); c.fill();
    // windows: a row of panes along the side
    c.fillStyle = '#f2e6c8';
    for (let k = 0; k < 5; k++) {
      const a = -0.86 + k * 0.36, b = a + 0.28;
      const q0 = [lerp(p0[0], p1[0], (a + 1) / 2), lerp(p0[1], p1[1], (a + 1) / 2)], q1 = [lerp(p0[0], p1[0], (b + 1) / 2), lerp(p0[1], p1[1], (b + 1) / 2)];
      poly(c, [[q0[0], q0[1] - 20], [q1[0], q1[1] - 20], [q1[0], q1[1] - 44], [q0[0], q0[1] - 44]]); c.fill();
    }
    c.fillStyle = WHITE; poly(c, [[p0[0], p0[1] - Hh], [p1[0], p1[1] - Hh], [p1[0], p1[1] - Hh - 5], [p0[0], p0[1] - Hh - 5]]); c.fill();
    c.strokeStyle = CHAR; c.lineWidth = 2.4; c.lineJoin = 'round';
    c.beginPath(); for (let i = 0; i < 4; i++) { const [bx, by] = body[i]; i ? c.lineTo(bx - 3, by - 2) : c.moveTo(bx - 3, by - 2); } c.closePath(); c.stroke();
    c.fillStyle = CHAR; c.beginPath(); c.arc(p0[0] + dx * 18, p0[1] + dy * 18 + 4, 5, 0, Math.PI * 2); c.arc(p1[0] - dx * 18, p1[1] - dy * 18 + 4, 5, 0, Math.PI * 2); c.fill();
  };
  p.live('car', {
    t: 8.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      // a run takes about twenty seconds, eased at each end
      const ph = (time - 8.2) / 22, k = ph - Math.floor(ph), up = k < 0.5 ? k * 2 : 2 - k * 2;
      const u = 0.06 + 0.86 * (0.5 - 0.5 * Math.cos(up * Math.PI));
      drawCar(c, 1 - u, -1); drawCar(c, u, 1);
    },
  });
  // the wind's things: the ferry pushing up the harbor, a yacht heeled hard
  // over, gulls thrown about, washing streaming off the line, a kite
  const gulls = [[700, 900, 0.5, 0.9], [860, 960, 0.4, 0.75], [1200, 820, 0.45, 0.85], [400, 760, 0.6, 1.0], [1000, 700, 0.35, 0.7]];
  const wash = [[0.12, MUST, 26, 34], [0.3, WHITE, 30, 26], [0.48, RED, 22, 30], [0.66, TEAL_L, 30, 34], [0.84, WHITE, 24, 22]];
  p.live('air', {
    t: 4.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      // the interisland ferry, sailing out past the island
      const fx = 820 - ((time * 9) % 900), fy = 900;
      if (fx > 100) {
        c.fillStyle = WHITE; poly(c, [[fx - 70, fy - 10], [fx + 62, fy - 10], [fx + 54, fy + 4], [fx - 64, fy + 4]]); c.fill();
        c.fillStyle = TEAL_D; c.fillRect(fx - 64, fy - 2, 118, 6);
        c.fillStyle = WHITE; c.fillRect(fx - 40, fy - 24, 80, 14); c.fillRect(fx - 20, fy - 34, 44, 10);
        c.fillStyle = RED; c.fillRect(fx + 6, fy - 44, 10, 10);
        c.strokeStyle = CHAR; c.lineWidth = 1.8; c.strokeRect(fx - 43, fy - 27, 80, 14);
        c.strokeStyle = WHITE; c.lineWidth = 2; c.beginPath(); c.moveTo(fx + 60, fy + 4); c.lineTo(fx + 120, fy + 8); c.stroke();
      }
      // the yacht, heeling and bobbing
      const yx = 720 + Math.sin(time * 0.2) * 40, yy = 1010, heel = 0.42 + Math.sin(time * 1.3) * 0.07;
      c.save(); c.translate(yx, yy);
      c.fillStyle = CHAR; poly(c, [[-30, 0], [30, 0], [22, 9], [-24, 9]]); c.fill();
      c.rotate(heel);
      c.fillStyle = WHITE; poly(c, [[2, -2], [2, -84], [44, -4]]); c.fill(); poly(c, [[-2, -4], [-2, -70], [-28, -4]]); c.fill();
      c.strokeStyle = CHAR; c.lineWidth = 2; poly(c, [[2, -2], [2, -84], [44, -4]]); c.stroke();
      c.restore();
      c.strokeStyle = WHITE; c.lineWidth = 2.4; c.beginPath(); c.moveTo(yx - 50, yy + 10); c.lineTo(yx - 26, yy + 8); c.stroke();
      // gulls, tumbling
      c.strokeStyle = CHAR; c.lineCap = 'round'; c.lineJoin = 'round';
      for (const [x0, y0, w, s] of gulls) {
        const x = x0 + Math.sin(time * w * 0.6 + x0) * 150, y = y0 + Math.sin(time * w * 3 + x0) * 30, f = Math.sin(time * 5 + x0) * 8 * s, tilt = Math.sin(time * 1.7 + y0) * 0.4;
        c.save(); c.translate(x, y); c.rotate(tilt);
        c.lineWidth = 3 * s; c.beginPath(); c.moveTo(-26 * s, -2 * s + f); c.quadraticCurveTo(-12 * s, -14 * s, 0, 0); c.quadraticCurveTo(12 * s, -14 * s, 26 * s, -2 * s + f); c.stroke();
        c.restore();
      }
      // the washing and the kite wait for the hill to be built
      const late = clamp((time - 9.8) / 0.6);
      if (late <= 0) return;
      c.globalAlpha *= late;
      // the washing, streaming toward the right
      const ax = 570, ay = 1790, bx = 750, by = 1770;
      c.strokeStyle = CHAR; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo((ax + bx) / 2, ay + 8, bx, by); c.stroke();
      for (let i = 0; i < wash.length; i++) {
        const [u, col, w, h] = wash[i], x = lerp(ax, bx, u), y = lerp(ay, by, u) + Math.sin(u * Math.PI) * 4;
        const fl = Math.sin(time * 7 + i * 1.7) * 0.25 + 0.75, sw = Math.sin(time * 9 + i) * 4;
        const pts = [[x, y], [x + w * 0.5, y + sw * 0.5], [x + w, y + sw], [x + w * (0.4 + fl * 0.6) + 10, y + h * (1 - fl * 0.6) + sw], [x + 4, y + h]];
        c.fillStyle = col; poly(c, pts); c.fill();
        c.strokeStyle = CHAR; c.lineWidth = 1.6; poly(c, pts); c.stroke();
      }
      // a kite pulling hard over the crest
      const kx = 470 + Math.sin(time * 0.9) * 40, ky = 870 + Math.sin(time * 1.4) * 24;
      c.strokeStyle = CHAR; c.lineWidth = 1.2; c.beginPath(); c.moveTo(380, 1080); c.quadraticCurveTo(430, 980, kx, ky + 22); c.stroke();
      c.save(); c.translate(kx, ky); c.rotate(Math.sin(time * 1.1) * 0.3);
      c.fillStyle = MUST; poly(c, [[0, -26], [16, 0], [0, 26], [-16, 0]]); c.fill();
      c.fillStyle = RED; poly(c, [[0, -26], [16, 0], [0, 0]]); c.fill(); poly(c, [[0, 26], [-16, 0], [0, 0]]); c.fill();
      c.strokeStyle = CHAR; c.lineWidth = 1.8; poly(c, [[0, -26], [16, 0], [0, 26], [-16, 0]]); c.stroke();
      c.beginPath(); c.moveTo(0, 26); for (let k = 1; k <= 5; k++) c.lineTo(Math.sin(time * 4 + k) * 8 - k * 6, 26 + k * 12); c.stroke();
      c.restore();
    },
  });
}

// ---------------------------------------------------------------- the title
// the name blown in from the left, a letter at a time, each settling a little
// askew on a baseline that rises with the wind; red printed under the charcoal
function title(p) {
  const size = 186, font = `400 ${size}px ${FACE}`;
  const m = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  m.font = font;
  const str = 'WELLINGTON', track = size * 0.02;
  const wAt = (k) => m.measureText(str.slice(0, k)).width + track * k;
  let total = wAt(str.length) - track, k = 1;
  if (total > 1360) { k = 1360 / total; total = 1360; }
  const ang = -0.07, cx = W / 2, cy = 600;
  const tilt = [-0.05, 0.04, -0.02, 0.05, -0.04, 0.02, -0.05, 0.03, -0.02, 0.05];
  const bob = [0, -6, 4, -3, 6, -4, 2, -6, 4, 0];
  for (let i = 0; i < str.length; i++) {
    const ch = str[i], gw = m.measureText(ch).width * k, gx = (wAt(i + 1) - track) * k - gw;
    const along = gx + gw / 2 - total / 2;
    const px = cx + along * Math.cos(ang), py = cy + along * Math.sin(ang) + bob[i];
    const f = `400 ${size * k}px ${FACE}`;
    p.mark('title', {
      t: 10.4 + i * 0.12, d: 0.9, reveal: 'slide', dx: -160, dy: -30, ease: 'back',
      box: { x: px - gw, y: py - size * k * 1.1, w: gw * 2, h: size * k * 1.5 },
      draw: (c) => {
        c.save(); c.translate(px, py); c.rotate(ang + tilt[i]);
        c.font = f; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.fillStyle = RED; c.fillText(ch, 7, 5);
        c.fillStyle = CHAR; c.fillText(ch, 0, 0);
        c.restore();
      },
    });
  }
  p.type('title', 'NEW ZEALAND', 170, 440, { family: FACE, size: 44, color: CHAR, track: 0.3, t: 12.2, gap: 0.05, d: 0.5, reveal: 'fade' });
  p.type('title', 'THE HARBOR CAPITAL', W - 170, 742, { family: FACE, size: 44, color: CHAR, align: 'right', track: 0.16, t: 12.6, gap: 0.04, d: 0.5, reveal: 'fade' });
}
