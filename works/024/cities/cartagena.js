// Cartagena: the side of a painted chiva, the open-sided country bus of the
// Caribbean coast. Under a loaded roof rack the name board is lettered by a sign
// painter; through five open windows between striped posts the walled city goes
// by: the Castillo San Felipe on its hill, colonial houses with wooden balconies
// under bougainvillea, the Torre del Reloj over its three-arched gate, the
// cathedral's tower, the walls with their sentry boxes and the sea, and in the
// street palenqueras carrying bowls of fruit on their heads. Below, the body is
// painted in bands of color with pinstripes, over the wheels.

import { Plate, W, H, boxOf } from '../print.js';
import { poly } from '../kit.js';

const INK = '#22160f', CREAM = '#fbf1da';
const RED = '#df2f2a', YEL = '#f7c51e', BLUE = '#1f56b0', GREEN = '#1f9a58', ORANGE = '#f57d1f', PINK = '#e2307a', SKY = '#71d0dc';
const FACE = '"Lemon", serif';
const TITLE = 'CARTAGENA';

export const city = {
  id: 'cartagena', name: 'Cartagena', wall: '#1b2a24',
  alt: "The painted side of a chiva bus: a roof rack loaded with plantains, sacks, baskets, suitcases, a crate of hens and a bicycle, the name lettered on a yellow board with scrolls, and through five open windows between striped posts the walled city: the Castillo San Felipe on its hill flying the Colombian flag, colonial houses with wooden balconies and bougainvillea, the Torre del Reloj over its three-arched gate, the cathedral's tower, the city wall with its sentry boxes, the sea with a sailboat, palenqueras carrying bowls of fruit on their heads and pigeons on the square, above a body painted in bands of red, yellow, green, orange and blue with flowers, diamonds and zigzags over two wheels, with pelicans gliding overhead",
  google: 'family=Lemon',
  fonts: [['400 100px "Lemon"', 'CARTAGENA La Heroica COLOMBIA · 1533']],
  build,
};

// the bus side: the window row and the body below it
const BX0 = 40, BX1 = W - 40;
const WY0 = 640, WY1 = 1300;          // the open windows
const PX = [70, 362, 654, 946, 1238, 1530]; // the window posts' centers, the ends included
const PW = 46;
const STREET = 1218;                  // the street's line in the windows

function build() {
  const p = new Plate({ paper: CREAM, seed: 1533 });
  const r = p.r;
  p.stack('sky', 'cargo', 'body', 'stripes', 'board', 'scene', 'town', 'front', 'posts', 'letters', 'life');
  sky(p, r);
  body(p, r);
  board(p, r);
  scene(p, r);
  town(p, r);
  people(p, r);
  posts(p, r);
  cargo(p, r);
  title(p);
  life(p, r);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

// a filled shape with the painter's dark outline
function paint(c, pts, fill, lw = 2.2, line = INK) {
  c.fillStyle = fill; poly(c, pts); c.fill();
  if (lw) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }
}
function lines(c, ls) { c.beginPath(); for (const l of ls) { c.moveTo(l[0][0], l[0][1]); for (let i = 1; i < l.length; i++) c.lineTo(l[i][0], l[i][1]); } }
function disc(c, x, y, rr, fill, lw = 0) { c.fillStyle = fill; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill(); if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); } }
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

// ================================================================ sky over the roof
function sky(p, r) {
  p.group('sky', { x: 0, y: 0, w: W, h: 1840 }, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 1840);
    g.addColorStop(0, '#3fb6cf'); g.addColorStop(0.2, '#a8e4e0'); g.addColorStop(1, '#f3e6c2');
    c.fillStyle = g; c.fillRect(0, 0, W, 1840);
  }, { t: 0, d: 0.8, reveal: 'fade' });
  // a hot sun in the corner, its rays painted as wedges
  p.group('sky', { x: 1330, y: -10, w: 290, h: 250 }, (c) => {
    c.fillStyle = '#ffd94a';
    for (let k = 0; k < 16; k++) {
      const a = Math.PI * 0.5 + k * Math.PI / 15;
      poly(c, [[1480 + Math.cos(a - 0.06) * 80, 70 + Math.sin(a - 0.06) * 80], [1480 + Math.cos(a) * 150, 70 + Math.sin(a) * 150], [1480 + Math.cos(a + 0.06) * 80, 70 + Math.sin(a + 0.06) * 80]]); c.fill();
    }
    disc(c, 1480, 70, 72, '#ffc22a', 2.4); disc(c, 1480, 70, 54, '#ffdb5a');
  }, { t: 0.4, d: 0.8, reveal: 'pop' });
}

// ================================================================ the body
function body(p, r) {
  // the painted wood of the whole side, and the black wheel arches
  p.group('body', { x: 0, y: 300, w: W, h: H - 300 }, (c) => {
    c.fillStyle = BLUE; c.fillRect(BX0, 300, BX1 - BX0, 1520);
    // the ground under the bus and its shadow
    c.fillStyle = '#d9b27a'; c.fillRect(0, 1830, W, 170);
    c.fillStyle = 'rgba(60,30,10,.35)'; c.fillRect(BX0 + 20, 1830, BX1 - BX0 - 40, 26);
  }, { t: 0.2, d: 0.8, reveal: 'fade' });
  // the bands of color, each brushed on left to right
  const bands = [
    [1330, 34, RED], [1364, 10, CREAM], [1374, 56, YEL], [1430, 10, INK], [1440, 46, GREEN], [1486, 10, CREAM], [1496, 92, RED],
    [1588, 10, CREAM], [1598, 46, ORANGE], [1644, 10, INK], [1654, 60, YEL], [1714, 12, CREAM], [1726, 94, BLUE],
  ];
  bands.forEach(([y, h, col], i) => p.group('stripes', { x: BX0, y, w: BX1 - BX0, h }, (c) => { c.fillStyle = col; c.fillRect(BX0, y, BX1 - BX0, h); },
    { t: 0.5 + i * 0.12, d: 0.7, reveal: 'wipe', ease: 'soft' }));
  // painted ornaments on the red band: diamonds and flowers turn about
  const orn = [];
  for (let x = BX0 + 60, k = 0; x < BX1 - 30; x += 92, k++) orn.push([x, 1542, k % 2]);
  p.group('stripes', { x: BX0, y: 1496, w: BX1 - BX0, h: 92 }, (c) => {
    for (const [x, y, k] of orn) {
      if (k) {
        paint(c, [[x, y - 34], [x + 26, y], [x, y + 34], [x - 26, y]], YEL, 2);
        paint(c, [[x, y - 18], [x + 13, y], [x, y + 18], [x - 13, y]], GREEN, 1.6);
      } else {
        for (let j = 0; j < 6; j++) { const a = j * Math.PI / 3; disc(c, x + Math.cos(a) * 15, y + Math.sin(a) * 15, 11, j % 2 ? PINK : CREAM, 1.6); }
        disc(c, x, y, 9, YEL, 1.6);
      }
    }
  }, { t: 2.2, d: 1.0, reveal: 'wipe' });
  // a running scallop on the yellow band, and dots on the green
  const scal = [], dots = [];
  for (let x = BX0; x < BX1; x += 28) scal.push([[x, 1376], [x + 14, 1414], [x + 28, 1376]]);
  for (let x = BX0 + 14; x < BX1; x += 24) dots.push([x, 1463]);
  p.group('stripes', { x: BX0, y: 1370, w: BX1 - BX0, h: 100 }, (c) => {
    c.strokeStyle = RED; c.lineWidth = 5; c.lineJoin = 'round'; lines(c, scal); c.stroke();
    for (const [x, y] of dots) disc(c, x, y, 6, YEL);
    for (const [x, y] of dots) disc(c, x, y, 2.4, RED);
  }, { t: 2.5, d: 1.0, reveal: 'wipe' });
  // zigzags on the yellow lower band
  const zig = [];
  for (let x = BX0; x < BX1; x += 40) zig.push([x, 1700], [x + 20, 1668]);
  p.group('stripes', { x: BX0, y: 1650, w: BX1 - BX0, h: 70 }, (c) => {
    c.strokeStyle = RED; c.lineWidth = 7; c.lineJoin = 'miter'; c.beginPath(); zig.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    c.strokeStyle = BLUE; c.lineWidth = 3; c.beginPath(); zig.forEach(([x, y], i) => (i ? c.lineTo(x, y + 12) : c.moveTo(x, y + 12))); c.stroke();
  }, { t: 2.8, d: 1.0, reveal: 'wipe' });
  // the wheels, under black arches
  for (const [wx, t] of [[330, 3.0], [1270, 3.2]]) {
    p.group('front', { x: wx - 190, y: 1640, w: 380, h: 360 }, (c) => {
      c.fillStyle = INK; c.beginPath(); c.arc(wx, 1830, 170, Math.PI, 0); c.fill();
      disc(c, wx, 1840, 138, '#1a1512');
      c.strokeStyle = '#3a312a'; c.lineWidth = 3; for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12; c.beginPath(); c.moveTo(wx + Math.cos(a) * 112, 1840 + Math.sin(a) * 112); c.lineTo(wx + Math.cos(a) * 136, 1840 + Math.sin(a) * 136); c.stroke(); }
      disc(c, wx, 1840, 92, RED, 3);
      c.fillStyle = YEL;
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; poly(c, [[wx + Math.cos(a - 0.18) * 30, 1840 + Math.sin(a - 0.18) * 30], [wx + Math.cos(a) * 84, 1840 + Math.sin(a) * 84], [wx + Math.cos(a + 0.18) * 30, 1840 + Math.sin(a + 0.18) * 30]]); c.fill(); }
      disc(c, wx, 1840, 30, '#d8d8d0', 2.4); disc(c, wx, 1840, 10, INK);
      // the fender's painted edge
      c.strokeStyle = YEL; c.lineWidth = 8; c.beginPath(); c.arc(wx, 1830, 174, Math.PI, 0); c.stroke();
      c.strokeStyle = RED; c.lineWidth = 3; c.beginPath(); c.arc(wx, 1830, 181, Math.PI, 0); c.stroke();
    }, { t, d: 0.8, reveal: 'rise' });
  }
  // the bumper-end of the bus: pinstripes framing the whole side
  p.group('front', { x: BX0 - 4, y: 296, w: BX1 - BX0 + 8, h: 1530 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(BX0, 300, BX1 - BX0, 1526);
    c.strokeStyle = YEL; c.lineWidth = 3; c.strokeRect(BX0 + 10, 310, BX1 - BX0 - 20, 1506);
  }, { t: 3.4, d: 0.9, reveal: 'fade' });
}

// ================================================================ the name board
function board(p, r) {
  const y0 = 320, y1 = 600;
  p.group('board', { x: BX0, y: y0, w: BX1 - BX0, h: y1 - y0 }, (c) => {
    c.fillStyle = YEL; c.fillRect(BX0 + 16, y0, BX1 - BX0 - 32, y1 - y0);
    c.strokeStyle = RED; c.lineWidth = 8; c.strokeRect(BX0 + 30, y0 + 14, BX1 - BX0 - 60, y1 - y0 - 28);
    c.strokeStyle = GREEN; c.lineWidth = 3; c.strokeRect(BX0 + 44, y0 + 28, BX1 - BX0 - 88, y1 - y0 - 56);
  }, { t: 1.4, d: 1.0, reveal: 'wipe' });
  // sign painter's scrolls in the corners, drawn with a long brush
  const scroll = (x, y, s, dir) => {
    const pts = [];
    for (let k = 0; k <= 40; k++) { const t = k / 40, a = t * Math.PI * 3.2, rr = 34 * s * (1 - t * 0.8); pts.push([x + dir * (t * 120 * s + Math.cos(a) * rr), y + Math.sin(a) * rr - t * 10 * s]); }
    return pts;
  };
  const sc = [scroll(120, 400, 1, 1), scroll(120, 520, 0.8, 1), scroll(W - 120, 400, 1, -1), scroll(W - 120, 520, 0.8, -1)];
  sc.forEach((pts, i) => p.pen('board', pts, i % 2 ? GREEN : RED, 6, { t: 2.0 + i * 0.12, d: 0.9 }));
  // little leaves on the scrolls
  const leaves = [];
  for (const pts of sc) for (let k = 8; k < 40; k += 9) leaves.push(pts[k]);
  p.group('board', { x: BX0, y: y0, w: BX1 - BX0, h: y1 - y0 }, (c) => {
    for (const [x, y] of leaves) { c.fillStyle = GREEN; c.beginPath(); c.ellipse(x, y - 10, 5, 10, 0.4, 0, Math.PI * 2); c.fill(); disc(c, x + 6, y + 6, 4.5, PINK); }
  }, { t: 2.8, d: 0.7, reveal: 'pop' });
  // the roof's edge above it: a painted valance of scallops
  const val = [];
  for (let x = BX0; x < BX1; x += 40) val.push([x, x + 40]);
  p.group('board', { x: BX0 - 4, y: 286, w: BX1 - BX0 + 8, h: 40 }, (c) => {
    c.fillStyle = RED; c.fillRect(BX0, 290, BX1 - BX0, 14);
    for (const [a, b] of val) { c.fillStyle = RED; c.beginPath(); c.arc((a + b) / 2, 304, 20, 0, Math.PI); c.fill(); c.strokeStyle = YEL; c.lineWidth = 2.4; c.beginPath(); c.arc((a + b) / 2, 304, 13, 0, Math.PI); c.stroke(); }
  }, { t: 1.2, d: 0.8, reveal: 'wipe' });
}

// ================================================================ the scene through the windows
function scene(p, r) {
  p.group('scene', { x: BX0, y: WY0, w: BX1 - BX0, h: WY1 - WY0 }, (c) => {
    const g = c.createLinearGradient(0, WY0, 0, 950);
    g.addColorStop(0, '#4cc1d6'); g.addColorStop(1, '#c6efe6');
    c.fillStyle = g; c.fillRect(BX0, WY0, BX1 - BX0, WY1 - WY0);
  }, { t: 3.2, d: 1.0, reveal: 'fall' });
  // round painted clouds
  const cls = [[200, 700, 1], [560, 690, 0.8], [1100, 705, 0.9], [1420, 690, 1.1]];
  p.group('scene', { x: BX0, y: WY0, w: BX1 - BX0, h: 120 }, (c) => {
    for (const [x, y, s] of cls) {
      c.fillStyle = CREAM; c.strokeStyle = '#7ab9c6'; c.lineWidth = 2;
      for (const [dx, dy, rr] of [[-36, 6, 20], [-12, -8, 26], [16, -4, 24], [40, 6, 18]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, rr * s, 0, Math.PI * 2); c.fill(); }
      c.fillRect(x - 52 * s, y + 6 * s, 104 * s, 18 * s);
    }
  }, { t: 3.6, d: 0.8, reveal: 'pop' });
  // the sea, both sides of the old town
  p.group('scene', { x: BX0, y: 930, w: BX1 - BX0, h: 160 }, (c) => {
    c.fillStyle = '#1aa0bc'; c.fillRect(BX0, 940, BX1 - BX0, 150);
    c.fillStyle = '#0f7f9e'; c.fillRect(BX0, 940, BX1 - BX0, 6);
    c.strokeStyle = CREAM; c.lineWidth = 2.4; c.lineCap = 'round';
    c.beginPath();
    for (let y = 958; y < 1080; y += 16) for (let x = BX0 + ((y / 16) % 2) * 30; x < BX1; x += 60) { c.moveTo(x, y); c.quadraticCurveTo(x + 8, y - 5, x + 16, y); }
    c.stroke();
  }, { t: 3.8, d: 0.9, reveal: 'wipe' });
  // a sailboat and a fishing boat
  p.group('scene', { x: 1340, y: 880, w: 200, h: 120 }, (c) => {
    paint(c, [[1380, 990], [1470, 990], [1458, 1004], [1392, 1004]], RED, 2);
    paint(c, [[1424, 900], [1424, 986], [1478, 986]], CREAM, 2);
    paint(c, [[1418, 912], [1418, 986], [1384, 986]], YEL, 2);
  }, { t: 4.6, d: 0.6, reveal: 'pop' });
  // the Castillo San Felipe on its hill: stepped walls of stone, garitas, a flag
  const hill = [[BX0, 1030], [100, 960], [180, 900], [300, 880], [390, 905], [470, 980], [520, 1030]];
  p.group('scene', { x: BX0, y: 760, w: 500, h: 290 }, (c) => {
    paint(c, hill, '#4fa04a', 2.2);
    // three terraces of wall, each narrower and higher
    const tiers = [[120, 440, 900, 40], [170, 390, 860, 40], [220, 340, 826, 34]];
    for (const [x0, x1, y, h] of tiers) {
      paint(c, [[x0, y + h], [x0 + 8, y], [x1 - 8, y], [x1, y + h]], '#c9ad74', 2.2);
      c.strokeStyle = 'rgba(80,60,30,.5)'; c.lineWidth = 1.2; c.beginPath();
      for (let yy = y + 10; yy < y + h; yy += 10) { c.moveTo(x0 + 6, yy); c.lineTo(x1 - 6, yy); }
      c.stroke();
      // garitas at the corners: sentry boxes with domed caps
      for (const gx of [x0 + 10, x1 - 10]) { paint(c, rect(gx - 8, y - 20, 16, 22), '#e6d2a0', 1.6); c.fillStyle = '#c9ad74'; c.beginPath(); c.arc(gx, y - 20, 9, Math.PI, 0); c.fill(); c.stroke(); c.fillStyle = INK; c.fillRect(gx - 2, y - 14, 4, 8); }
    }
    // the flag of Colombia on its pole
    c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(280, 826); c.lineTo(280, 770); c.stroke();
  }, { t: 4.2, d: 1.2, reveal: 'rise' });
}

// ================================================================ the walled town
const FACADES = ['#f2b632', '#e66a3a', '#ef8fb0', '#3f8fd0', '#46b08a', '#f4e1b0', '#c94a8a', '#f59a2c', '#7fc8e0'];
function house(r, x, w, h, col) {
  const top = STREET - h;
  const floors = h > 220 ? 3 : 2;
  const fh = (h - 20) / floors;
  const wins = [], bals = [], bougs = [];
  const n = Math.max(2, Math.round(w / 70));
  for (let f = 0; f < floors; f++) {
    for (let k = 0; k < n; k++) {
      const wx = x + (k + 0.5) * w / n, wy = STREET - (f + 1) * fh;
      wins.push([wx - 13, wy + 18, 26, fh - 30, f]);
    }
    // the upper floors carry a long wooden balcony with a little roof
    if (f > 0 && r() < 0.8) {
      const by = STREET - f * fh - 6;
      bals.push([x + 8, by, w - 16, f]);
      if (r() < 0.75) {
        // bougainvillea falls from its rail: a heap of blossoms, set now
        const side = r() < 0.5 ? x + 10 : x + w - 10;
        const blos = [];
        for (let i = 0; i < 46; i++) { const t = r(); blos.push([side + r.range(-30, 30) * (1 - t * 0.5), by - 40 + t * 90 + r.range(-8, 8), r.range(3.5, 7), r.pick(['#d81b7a', '#e8388e', '#b01468', '#f25aa6'])]); }
        bougs.push(blos);
      }
    }
  }
  const roof = r() < 0.6;
  return { x, w, h, top, col, wins, bals, bougs, roof, door: [x + w / 2 - 18, STREET - 70, 36, 70] };
}
function drawHouse(c, o) {
  const { x, w, top, col } = o;
  paint(c, rect(x, top, w, STREET - top), col, 2.2);
  // the cornice, and a strip of tiled roof above it
  c.fillStyle = CREAM; c.fillRect(x - 4, top, w + 8, 10); c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(x - 4, top, w + 8, 10);
  if (o.roof) { paint(c, [[x - 2, top], [x + 10, top - 16], [x + w - 10, top - 16], [x + w + 2, top]], '#c4532e', 1.8); c.strokeStyle = 'rgba(60,20,10,.5)'; c.lineWidth = 1; c.beginPath(); for (let xx = x + 12; xx < x + w - 8; xx += 7) { c.moveTo(xx, top - 15); c.lineTo(xx - 2, top - 1); } c.stroke(); }
  // tall windows with green shutters, white frames
  for (const [wx, wy, ww, wh] of o.wins) {
    c.fillStyle = CREAM; c.fillRect(wx - 4, wy - 4, ww + 8, wh + 6);
    c.fillStyle = '#2d7a55'; c.fillRect(wx, wy, ww, wh);
    c.strokeStyle = '#1c4a34'; c.lineWidth = 1; c.beginPath(); for (let yy = wy + 4; yy < wy + wh; yy += 5) { c.moveTo(wx, yy); c.lineTo(wx + ww, yy); } c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.stroke();
  }
  // balconies of dark wood: floor, posts, rail of turned bars and a roof of tiles
  for (const [bx, by, bw] of o.bals) {
    c.fillStyle = '#6a3a1c'; c.fillRect(bx, by, bw, 8);
    c.fillStyle = '#8a4e26'; c.fillRect(bx, by - 30, bw, 4);
    c.strokeStyle = '#5a2e14'; c.lineWidth = 2; c.beginPath(); for (let xx = bx + 4; xx < bx + bw; xx += 7) { c.moveTo(xx, by - 28); c.lineTo(xx, by); } c.stroke();
    c.fillStyle = '#5a2e14'; c.fillRect(bx, by - 72, 4, 72); c.fillRect(bx + bw - 4, by - 72, 4, 72);
    paint(c, [[bx - 8, by - 66], [bx + bw + 8, by - 66], [bx + bw - 2, by - 78], [bx + 2, by - 78]], '#b8482a', 1.6);
    // brackets under the floor
    c.fillStyle = '#5a2e14'; for (let xx = bx + 10; xx < bx + bw; xx += 40) poly(c, [[xx, by + 8], [xx + 10, by + 8], [xx + 2, by + 20]]), c.fill();
  }
  // an iron lantern on its bracket, and a pot of flowers by the door
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 6, STREET - 120); c.lineTo(x + 22, STREET - 120); c.stroke();
  paint(c, [[x + 16, STREET - 120], [x + 28, STREET - 120], [x + 30, STREET - 104], [x + 14, STREET - 104]], '#ffe08a', 1.6);
  paint(c, [[x + w - 34, STREET], [x + w - 38, STREET - 18], [x + w - 14, STREET - 18], [x + w - 18, STREET]], '#c4532e', 1.4);
  for (const [fx, fy, col] of [[-30, -24, '#e8388e'], [-22, -30, YEL], [-14, -24, '#e8388e']]) disc(c, x + w + fx, STREET + fy, 5, col, 1);
  // the door
  const [dx, dy, dw, dh] = o.door;
  paint(c, rect(dx - 6, dy - 6, dw + 12, dh + 6), CREAM, 1.6);
  paint(c, rect(dx, dy, dw, dh), '#7a3a1a', 1.6);
  c.strokeStyle = '#4a200c'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(dx + dw / 2, dy); c.lineTo(dx + dw / 2, dy + dh); c.stroke();
}
function drawBoug(c, o) {
  for (const blos of o.bougs) {
    c.fillStyle = '#2f7a3a';
    for (const [x, y, s] of blos) { c.beginPath(); c.arc(x + 2, y + 3, s * 0.8, 0, Math.PI * 2); c.fill(); }
    for (const [x, y, s, col] of blos) { c.fillStyle = col; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); }
  }
}
function town(p, r) {
  // the city wall along the sea on the right, with its garitas
  p.group('town', { x: 1240, y: 1000, w: 300, h: STREET - 1000 + 4 }, (c) => {
    paint(c, [[1240, STREET], [1250, 1060], [BX1, 1060], [BX1, STREET]], '#d8bf86', 2.2);
    c.strokeStyle = 'rgba(80,60,30,.45)'; c.lineWidth = 1.2; c.beginPath();
    for (let y = 1074; y < STREET; y += 14) for (let x = 1254 + ((y / 14) % 2) * 14; x < BX1; x += 28) { c.moveTo(x, y); c.lineTo(x + 24, y); }
    c.stroke();
    for (const gx of [1330, 1480]) {
      paint(c, rect(gx - 16, 1018, 32, 44), '#efdcae', 2);
      c.fillStyle = '#d8bf86'; c.beginPath(); c.arc(gx, 1018, 18, Math.PI, 0); c.fill(); c.stroke();
      disc(c, gx, 998, 4, '#d8bf86', 1.4);
      c.fillStyle = INK; c.fillRect(gx - 3, 1030, 6, 16);
    }
  }, { t: 4.8, d: 1.0, reveal: 'rise' });
  // the houses, in the four outer panes
  const runs = [[480, 640, 5.2], [962, 1240, 5.5], [76, 480, 5.8]];
  const houses = [];
  for (const [x0, x1, t] of runs) {
    let x = x0;
    const hs = [];
    while (x < x1 - 40) {
      const w = Math.min(x1 - x, r.range(110, 170));
      const o = house(r, x, w, r.range(190, 260), FACADES[houses.length % FACADES.length]);
      hs.push(o); houses.push(o); x += w;
    }
    p.group('town', boxOf([[x0 - 20, STREET + 4], [x1 + 20, 900]], 0), (c) => { for (const o of hs) drawHouse(c, o); }, { t, d: 1.0, reveal: 'rise' });
    p.group('town', boxOf([[x0 - 40, STREET + 30], [x1 + 40, 900]], 0), (c) => { for (const o of hs) drawBoug(c, o); }, { t: t + 2.0, d: 0.9, reveal: 'fall' });
  }
  // the cathedral's tower behind the right-hand houses
  const cx = 1090;
  p.group('scene', { x: cx - 60, y: 716, w: 120, h: 450 }, (c) => {
    paint(c, rect(cx - 36, 860, 72, 300), '#f0d9a4', 2.2);
    c.fillStyle = INK; c.fillRect(cx - 5, 900, 10, 26);
    paint(c, rect(cx - 30, 806, 60, 56), '#e9a23a', 2.2);
    c.fillStyle = INK; c.fillRect(cx - 18, 818, 12, 30); c.fillRect(cx + 6, 818, 12, 30);
    paint(c, [[cx - 34, 806], [cx + 34, 806], [cx + 30, 798], [cx - 30, 798]], CREAM, 1.6);
    // its cupola: a ribbed dome and a lantern
    c.fillStyle = '#e66a3a'; c.beginPath(); c.moveTo(cx - 28, 798); c.quadraticCurveTo(cx - 28, 760, cx, 756); c.quadraticCurveTo(cx + 28, 760, cx + 28, 798); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.moveTo(cx, 758); c.lineTo(cx, 798); c.moveTo(cx - 14, 764); c.quadraticCurveTo(cx - 16, 780, cx - 14, 798); c.moveTo(cx + 14, 764); c.quadraticCurveTo(cx + 16, 780, cx + 14, 798); c.lineWidth = 1.3; c.stroke();
    paint(c, rect(cx - 6, 740, 12, 18), CREAM, 1.4);
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, 740); c.lineTo(cx, 722); c.moveTo(cx - 7, 730); c.lineTo(cx + 7, 730); c.stroke();
  }, { t: 4.4, d: 1.0, reveal: 'rise' });
  // the Torre del Reloj: the gate of three arches, the clock tower, its belfry
  const X = 800;
  p.group('town', { x: X - 140, y: 640, w: 280, h: STREET - 640 + 4 }, (c) => {
    // the gate's wide front
    paint(c, rect(X - 124, 1010, 248, STREET - 1010), '#f2c14e', 2.4);
    c.fillStyle = CREAM; c.fillRect(X - 128, 1000, 256, 14); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(X - 128, 1000, 256, 14);
    // three arches, the middle one tall
    const arch = (ax, aw, ah) => { c.beginPath(); c.moveTo(ax - aw / 2, STREET); c.lineTo(ax - aw / 2, STREET - ah + aw / 2); c.arc(ax, STREET - ah + aw / 2, aw / 2, Math.PI, 0); c.lineTo(ax + aw / 2, STREET); c.closePath(); };
    for (const [ax, aw, ah] of [[X - 80, 42, 120], [X, 64, 168], [X + 80, 42, 120]]) {
      c.fillStyle = CREAM; arch(ax, aw + 12, ah + 6); c.fill(); c.stroke();
      c.fillStyle = '#3a2418'; arch(ax, aw, ah); c.fill();
    }
    // pilasters
    c.fillStyle = CREAM; for (const px of [X - 120, X - 46, X + 38, X + 112]) { c.fillRect(px, 1014, 8, STREET - 1014); c.strokeRect(px, 1014, 8, STREET - 1014); }
    // the tower: a square shaft with the clock
    paint(c, rect(X - 46, 800, 92, 200), '#f5cf62', 2.4);
    c.fillStyle = CREAM; c.fillRect(X - 52, 792, 104, 12); c.strokeRect(X - 52, 792, 104, 12);
    disc(c, X, 880, 34, CREAM, 2.4);
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath();
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; c.moveTo(X + Math.cos(a) * 26, 880 + Math.sin(a) * 26); c.lineTo(X + Math.cos(a) * 31, 880 + Math.sin(a) * 31); }
    c.stroke();
    c.fillStyle = INK; c.fillRect(X - 24, 950, 14, 30); c.fillRect(X + 10, 950, 14, 30);
    // the belfry: an open stage of arches and a small dome with a vane
    paint(c, rect(X - 36, 730, 72, 64), '#f2c14e', 2.2);
    c.fillStyle = '#3a2418'; for (const ax of [X - 18, X + 18]) { c.beginPath(); c.moveTo(ax - 10, 790); c.lineTo(ax - 10, 754); c.arc(ax, 754, 10, Math.PI, 0); c.lineTo(ax + 10, 790); c.fill(); }
    c.fillStyle = CREAM; c.fillRect(X - 42, 724, 84, 10); c.strokeRect(X - 42, 724, 84, 10);
    c.fillStyle = '#f2c14e'; c.beginPath(); c.moveTo(X - 32, 724); c.quadraticCurveTo(X - 30, 690, X, 684); c.quadraticCurveTo(X + 30, 690, X + 32, 724); c.fill(); c.stroke();
    paint(c, rect(X - 6, 668, 12, 18), CREAM, 1.4);
    c.beginPath(); c.moveTo(X, 668); c.lineTo(X, 646); c.stroke();
  }, { t: 6.2, d: 1.4, reveal: 'rise' });
  // pigeons on the square before the gate
  const pig = [];
  for (let i = 0; i < 9; i++) pig.push([r.range(690, 910), r.range(STREET + 20, WY1 - 12), r() < 0.5 ? 1 : -1, r() < 0.3]);
  p.group('front', { x: 680, y: STREET, w: 240, h: WY1 - STREET }, (c) => {
    for (const [x, y, d, peck] of pig) {
      c.fillStyle = '#8a8f9a'; c.beginPath(); c.ellipse(x, y, 9, 5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5a6070'; c.beginPath(); c.arc(x + d * 8, y - (peck ? 0 : 5), 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e8902a'; c.fillRect(x + d * 12 - (d < 0 ? 3 : 0), y - (peck ? 0 : 5), 3, 1.6);
      c.fillStyle = '#4a4f5a'; c.beginPath(); c.moveTo(x - d * 8, y); c.lineTo(x - d * 15, y - 3); c.lineTo(x - d * 14, y + 3); c.fill();
    }
  }, { t: 8.9, d: 0.6, reveal: 'fade' });
  // the street: cobbles in the sun
  p.group('front', { x: BX0, y: STREET - 2, w: BX1 - BX0, h: WY1 - STREET + 4 }, (c) => {
    c.fillStyle = '#e2c79a'; c.fillRect(BX0, STREET, BX1 - BX0, WY1 - STREET);
    c.fillStyle = '#c8a874';
    for (let y = STREET + 8; y < WY1; y += 14) for (let x = BX0 + ((y / 14) % 2) * 10; x < BX1; x += 22) { c.beginPath(); c.ellipse(x, y, 8, 4, 0, 0, Math.PI * 2); c.fill(); }
  }, { t: 5.0, d: 0.8, reveal: 'wipe' });
}

// ================================================================ the palenqueras
function palenquera(r, x, dress, scale) {
  const fruit = [];
  // the bowl's heap: bananas, a pineapple, mangoes, papaya, limes, grapes
  for (let i = 0; i < 16; i++) fruit.push([r.range(-36, 36), r.range(-30, -4) - (1 - Math.abs(r.range(-1, 1))) * 14, r.range(7, 12), r.pick(['#f6d23a', '#f58a24', '#e23a2a', '#7fc13a', '#9a2a7a', '#ffb04a'])]);
  return { x, dress, s: scale, fruit, flip: r() < 0.5 ? -1 : 1 };
}
function drawPalenquera(c, o) {
  const { x, s, dress } = o, y = STREET + 70;
  c.save(); c.translate(x, y); c.scale(s * o.flip, s);
  // the long flounced skirt, in three tiers
  const tiers = [[-44, -150, 34], [-52, -116, 40], [-60, -76, 48]];
  tiers.forEach(([hw, ty, th], i) => {
    c.fillStyle = dress[i % dress.length];
    c.beginPath(); c.moveTo(hw * 0.7, ty); c.lineTo(-hw * 0.7, ty);
    c.lineTo(-hw, ty + th);
    for (let k = 0; k <= 8; k++) c.quadraticCurveTo(-hw + (k + 0.5) * (2 * hw / 9), ty + th + 8, -hw + (k + 1) * (2 * hw / 9), ty + th);
    c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.fillStyle = CREAM; c.fillRect(-hw * 0.7, ty + 3, hw * 1.4, 3);
  });
  // feet
  c.fillStyle = '#5a3018'; c.fillRect(-16, -28, 10, 8); c.fillRect(6, -28, 10, 8);
  // the bodice and arms raised to the bowl
  paint(c, [[-22, -150], [-24, -200], [24, -200], [22, -150]], dress[1], 2);
  c.fillStyle = '#5a3018'; c.strokeStyle = INK; c.lineWidth = 2;
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 20, -196); c.quadraticCurveTo(sd * 46, -220, sd * 36, -246); c.lineTo(sd * 28, -244); c.quadraticCurveTo(sd * 34, -220, sd * 14, -190); c.fill(); }
  // the head and its knotted scarf
  disc(c, 0, -214, 16, '#5a3018', 1.6);
  paint(c, [[-17, -218], [-12, -236], [12, -236], [17, -218], [0, -226]], dress[2], 1.6);
  // the bowl, and the fruit heaped in it
  for (const [fx, fy, fr, col] of o.fruit) disc(c, fx, -252 + fy, fr, col, 1.4);
  paint(c, [[-38, -246], [-48, -256], [48, -256], [38, -246], [26, -236], [-26, -236]], '#c9ccd2', 2);
  c.strokeStyle = '#8a8e96'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-36, -250); c.lineTo(36, -250); c.stroke();
  // a pineapple's crown sticking up
  c.fillStyle = '#3a8a3a'; for (const a of [-0.5, 0, 0.5]) { c.beginPath(); c.moveTo(6, -272); c.lineTo(6 + Math.sin(a) * 22, -300); c.lineTo(10, -272); c.fill(); }
  c.restore();
}
function people(p, r) {
  const ps = [
    palenquera(r, 220, [YEL, BLUE, RED], 0.82), palenquera(r, 520, [RED, YEL, BLUE], 0.86), palenquera(r, 1100, [BLUE, RED, YEL], 0.84), palenquera(r, 1390, [GREEN, ORANGE, PINK], 0.8),
  ];
  ps.forEach((o, i) => p.group('front', { x: o.x - 70, y: STREET - 220, w: 140, h: WY1 - STREET + 220 }, (c) => drawPalenquera(c, o), { t: 8.0 + i * 0.3, d: 0.8, reveal: 'drop', dy: 40 }));
}

// ================================================================ the window posts and fringe
function posts(p, r) {
  // the frame of the windows: a top rail and the bench backs below
  p.group('posts', { x: BX0, y: WY0 - 44, w: BX1 - BX0, h: 50 }, (c) => {
    c.fillStyle = GREEN; c.fillRect(BX0, WY0 - 40, BX1 - BX0, 40);
    c.fillStyle = YEL; c.fillRect(BX0, WY0 - 28, BX1 - BX0, 6); c.fillRect(BX0, WY0 - 12, BX1 - BX0, 3);
  }, { t: 2.9, d: 0.8, reveal: 'wipe' });
  p.group('posts', { x: BX0, y: WY1 - 4, w: BX1 - BX0, h: 40 }, (c) => {
    c.fillStyle = '#7a4520'; c.fillRect(BX0, WY1, BX1 - BX0, 30);
    c.fillStyle = '#5a3018'; for (let x = BX0; x < BX1; x += 18) c.fillRect(x, WY1 + 4, 3, 24);
  }, { t: 3.0, d: 0.8, reveal: 'wipe' });
  // each post painted red with yellow diamonds and white lines
  PX.forEach((x, i) => {
    const w = i === 0 || i === PX.length - 1 ? 60 : PW;
    const xl = i === 0 ? BX0 : i === PX.length - 1 ? BX1 - w : x - w / 2;
    p.group('posts', { x: xl - 4, y: WY0 - 4, w: w + 8, h: WY1 - WY0 + 8 }, (c) => {
      c.fillStyle = RED; c.fillRect(xl, WY0, w, WY1 - WY0);
      c.fillStyle = CREAM; c.fillRect(xl + 5, WY0, 3, WY1 - WY0); c.fillRect(xl + w - 8, WY0, 3, WY1 - WY0);
      for (let y = WY0 + 30; y < WY1 - 20; y += 56) { paint(c, [[xl + w / 2, y - 20], [xl + w / 2 + 12, y], [xl + w / 2, y + 20], [xl + w / 2 - 12, y]], YEL, 1.6); disc(c, xl + w / 2, y, 4, BLUE); }
      c.strokeStyle = INK; c.lineWidth = 2.4; c.strokeRect(xl, WY0, w, WY1 - WY0);
    }, { t: 2.2 + Math.abs(i - 2.5) * 0.12, d: 0.9, reveal: 'fall' });
  });
}

// ================================================================ the load on the roof
function cargo(p, r) {
  // the rack: rails and stanchions
  p.group('cargo', { x: BX0, y: 160, w: BX1 - BX0, h: 140 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(BX0 + 30, 220); c.lineTo(BX1 - 30, 220); c.moveTo(BX0 + 30, 260); c.lineTo(BX1 - 30, 260); c.stroke();
    c.lineWidth = 5; c.beginPath(); for (let x = BX0 + 30; x <= BX1 - 30; x += 76) { c.moveTo(x, 214); c.lineTo(x, 290); } c.stroke();
    c.strokeStyle = YEL; c.lineWidth = 2; c.beginPath(); for (let x = BX0 + 30; x <= BX1 - 30; x += 76) { c.moveTo(x - 1.5, 222); c.lineTo(x - 1.5, 286); } c.stroke();
  }, { t: 1.0, d: 0.8, reveal: 'wipe' });
  // things tied on: plantains, sacks, a crate of hens, a suitcase, baskets, a bicycle
  const items = [];
  let x = BX0 + 50;
  const kinds = ['plantains', 'sack', 'crate', 'case', 'basket', 'bike', 'sack', 'plantains', 'barrel', 'case', 'basket', 'sack', 'crate'];
  for (const k of kinds) {
    const w = { plantains: 120, sack: 90, crate: 110, case: 100, basket: 90, bike: 150, barrel: 70 }[k];
    if (x + w > BX1 - 40) break;
    items.push([k, x, w, r.pick([RED, ORANGE, BLUE, GREEN, PINK, '#7a5a2a'])]);
    x += w + r.range(4, 22);
  }
  items.forEach(([k, x0, w, col], i) => {
    const y = 262;
    p.group('cargo', { x: x0 - 10, y: 110, w: w + 20, h: 160 }, (c) => {
      if (k === 'plantains') {
        for (let j = 0; j < 9; j++) {
          const bx = x0 + 12 + (j % 5) * 22, by = y - 20 - Math.floor(j / 5) * 26;
          c.fillStyle = j % 3 ? '#9ac83a' : '#f3d23a'; c.strokeStyle = INK; c.lineWidth = 1.6;
          c.beginPath(); c.moveTo(bx, by + 18); c.quadraticCurveTo(bx - 10, by - 10, bx + 6, by - 30); c.quadraticCurveTo(bx + 2, by - 6, bx + 12, by + 18); c.closePath(); c.fill(); c.stroke();
        }
      } else if (k === 'sack') {
        paint(c, [[x0 + 6, y], [x0, y - 40], [x0 + 14, y - 66], [x0 + w - 14, y - 66], [x0 + w, y - 40], [x0 + w - 6, y]], '#d8c08a', 2);
        c.strokeStyle = '#a88a50'; c.lineWidth = 1; c.beginPath(); for (let yy = y - 56; yy < y; yy += 8) { c.moveTo(x0 + 8, yy); c.lineTo(x0 + w - 8, yy); } c.stroke();
        c.strokeStyle = RED; c.lineWidth = 3; c.beginPath(); c.moveTo(x0 + 10, y - 48); c.lineTo(x0 + w - 10, y - 48); c.stroke();
      } else if (k === 'crate') {
        paint(c, rect(x0, y - 70, w, 70), '#c8904a', 2);
        c.strokeStyle = '#7a4a1a'; c.lineWidth = 3; c.beginPath(); for (let xx = x0 + 14; xx < x0 + w; xx += 14) { c.moveTo(xx, y - 68); c.lineTo(xx, y - 2); } c.stroke();
        // hens peering out
        for (const hx of [x0 + 30, x0 + 72]) { disc(c, hx, y - 40, 12, CREAM, 1.4); c.fillStyle = RED; c.beginPath(); c.arc(hx - 2, y - 54, 5, 0, Math.PI * 2); c.fill(); c.fillStyle = YEL; poly(c, [[hx + 10, y - 42], [hx + 18, y - 38], [hx + 10, y - 36]]); c.fill(); disc(c, hx + 4, y - 43, 1.6, INK); }
      } else if (k === 'case') {
        paint(c, rect(x0, y - 52, w, 52), col, 2);
        c.fillStyle = '#e8c070'; c.fillRect(x0 + 18, y - 52, 6, 52); c.fillRect(x0 + w - 24, y - 52, 6, 52);
        c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(x0 + w / 2 - 14, y - 52); c.lineTo(x0 + w / 2 - 14, y - 62); c.lineTo(x0 + w / 2 + 14, y - 62); c.lineTo(x0 + w / 2 + 14, y - 52); c.stroke();
      } else if (k === 'basket') {
        paint(c, [[x0 + 8, y], [x0, y - 54], [x0 + w, y - 54], [x0 + w - 8, y]], '#d49a4a', 2);
        c.strokeStyle = '#8a5a22'; c.lineWidth = 1.4; c.beginPath(); for (let yy = y - 46; yy < y; yy += 7) { c.moveTo(x0 + 4, yy); c.lineTo(x0 + w - 4, yy); } for (let xx = x0 + 10; xx < x0 + w; xx += 10) { c.moveTo(xx, y - 54); c.lineTo(xx, y); } c.stroke();
        for (let j = 0; j < 5; j++) disc(c, x0 + 16 + j * 15, y - 60, 10, j % 2 ? '#7fc13a' : ORANGE, 1.4);
      } else if (k === 'bike') {
        c.strokeStyle = INK; c.lineWidth = 3;
        for (const wx of [x0 + 30, x0 + w - 30]) { c.beginPath(); c.arc(wx, y - 34, 28, 0, Math.PI * 2); c.stroke(); }
        c.strokeStyle = RED; c.lineWidth = 4; c.beginPath(); c.moveTo(x0 + 30, y - 34); c.lineTo(x0 + 66, y - 34); c.lineTo(x0 + 92, y - 70); c.lineTo(x0 + 56, y - 70); c.lineTo(x0 + 30, y - 34); c.moveTo(x0 + 66, y - 34); c.lineTo(x0 + 52, y - 78); c.moveTo(x0 + 92, y - 70); c.lineTo(x0 + w - 30, y - 34); c.stroke();
        c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(x0 + 44, y - 80); c.lineTo(x0 + 60, y - 80); c.moveTo(x0 + 92, y - 70); c.lineTo(x0 + 96, y - 86); c.lineTo(x0 + 108, y - 86); c.stroke();
      } else {
        paint(c, rect(x0, y - 74, w, 74), BLUE, 2);
        c.fillStyle = YEL; c.fillRect(x0, y - 56, w, 6); c.fillRect(x0, y - 22, w, 6);
      }
    }, { t: 9.0 + i * 0.14, d: 0.6, reveal: 'drop', dy: 60, ease: 'back' });
  });
  // the ropes over it all
  const ropes = [];
  for (let k = 0; k < 5; k++) { const xa = BX0 + 70 + k * 290; ropes.push([[xa, 262], [xa + 60, 188], [xa + 230, 186], [xa + 290, 262]]); }
  p.strokes('cargo', ropes, '#e8d8a8', 2.4, { t: 11.0, d: 0.8, reveal: 'wipe' });
}

// ================================================================ the name, sign-painted
function title(p) {
  const y = 548, size = 200;
  // the shadow, the outline and the letter, each letter brushed on in turn
  p.type('letters', TITLE, W / 2, y, { family: FACE, size, align: 'center', track: 0.02, fit: 1240, t: 10.4, gap: 0.14, d: 0.7, reveal: 'press', color: RED, stroke: INK, lw: 4, shadow: INK, sx: 9, sy: 9 });
  const sub = (text, x, t) => p.group('letters', { x: x - 300, y: 340, w: 600, h: 70 }, (c) => {
    c.font = `400 40px ${FACE}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = BLUE; c.fillText(text, x, 392);
  }, { t, d: 0.7, reveal: 'wipe' });
  sub('La Heroica', W / 2, 12.2);
  p.group('letters', { x: BX0 + 40, y: 1760, w: BX1 - BX0 - 80, h: 60 }, (c) => {
    c.font = `400 34px ${FACE}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = CREAM;
    if (c.letterSpacing !== undefined) c.letterSpacing = '8px';
    c.fillText('COLOMBIA · 1533', W / 2, 1790);
  }, { t: 12.6, d: 0.8, reveal: 'wipe' });
}

// ================================================================ what moves
function life(p, r) {
  // pelicans gliding over the roof
  const birds = [[0, 0, 0], [-70, 18, 1.2], [-140, 6, 2.1]];
  p.live('life', {
    t: 5.0, d: 1, box: { x: 0, y: 30, w: W, h: 150 },
    draw: (c, time) => {
      const u = time - 5;
      c.strokeStyle = INK; c.fillStyle = '#6a5a4a'; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
      for (const [dx, dy, ph] of birds) {
        const x = -60 + u * 70 + dx, y = 90 + dy + Math.sin(u * 0.9 + ph) * 6, f = Math.sin(u * 2 + ph) * 5;
        c.beginPath(); c.moveTo(x - 34, y - 4 - f); c.quadraticCurveTo(x - 14, y - 12 - f, x, y); c.quadraticCurveTo(x + 14, y - 12 - f, x + 34, y - 4 - f); c.stroke();
        c.beginPath(); c.ellipse(x + 2, y + 1, 10, 4, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.moveTo(x + 10, y - 1); c.lineTo(x + 26, y + 3); c.stroke();
      }
    },
  });
  // the clock's hands going round
  p.live('life', {
    t: 7.6, d: 0.6, box: { x: 770, y: 850, w: 60, h: 60 },
    draw: (c, time) => {
      const a = time * 0.5, b = time * 0.05;
      c.strokeStyle = INK; c.lineCap = 'round';
      c.lineWidth = 3; c.beginPath(); c.moveTo(800, 880); c.lineTo(800 + Math.sin(b) * 15, 880 - Math.cos(b) * 15); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.moveTo(800, 880); c.lineTo(800 + Math.sin(a) * 24, 880 - Math.cos(a) * 24); c.stroke();
      disc(c, 800, 880, 3, INK);
    },
  });
  // the flag on the castle
  p.live('life', {
    t: 5.6, d: 0.8, box: { x: 276, y: 760, w: 70, h: 50 },
    draw: (c, time) => {
      const pts = (y0, y1) => { const top = [], bot = []; for (let k = 0; k <= 8; k++) { const x = 281 + k * 6, w = Math.sin(time * 4 - k * 0.7) * 2.6 * (k / 8); top.push([x, y0 + w]); bot.push([x, y1 + w]); } return [...top, ...bot.reverse()]; };
      c.fillStyle = YEL; poly(c, pts(772, 784)); c.fill();
      c.fillStyle = '#2a4ea8'; poly(c, pts(784, 790)); c.fill();
      c.fillStyle = '#d42a2a'; poly(c, pts(790, 796)); c.fill();
    },
  });
  // the fringe hung along the top of the windows, swinging with the road
  const tass = [];
  for (let x = BX0 + 70; x < BX1 - 60; x += 22) if (!PX.some((px) => Math.abs(px - x) < PW / 2 + 8)) tass.push([x, r.pick([RED, YEL, GREEN, PINK, BLUE, ORANGE])]);
  p.live('life', {
    t: 3.6, d: 0.8, box: { x: BX0, y: WY0 - 6, w: BX1 - BX0, h: 60 },
    draw: (c, time) => {
      const sw = Math.sin(time * 2.2) * 5;
      for (const [x, col] of tass) {
        c.fillStyle = col; c.beginPath(); c.moveTo(x - 7, WY0); c.lineTo(x + 7, WY0); c.lineTo(x + 4 + sw, WY0 + 34); c.lineTo(x - 4 + sw, WY0 + 34); c.fill();
        c.fillStyle = INK; c.beginPath(); c.arc(x + sw * 1.1, WY0 + 38, 4, 0, Math.PI * 2); c.fill();
      }
    },
  });
}
