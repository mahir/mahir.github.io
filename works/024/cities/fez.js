// Fez: the old medina straight from above, as a 1950s screen print in a few
// flat inks, chalk, sand, ochre, terracotta, cobalt and tile green, with every
// shadow laid in one transparent umber over them. A maze of roof terraces and
// courtyards packed wall to wall, cut by dark lanes. It is the end of the day:
// the hills' shadow, a second transparent ink, lies over the quarters, and the
// sun is left on two places only, the dye vats of the Chouara tannery as a grid
// of color and the green-tiled roofs and marble court of the Qarawiyyin, with
// two minarets standing up out of the shade. The city wall with Bab Bou
// Jeloud's green inner face and the olive groves beyond; over them the name on
// a block of Fez blue with a strip of zellige.

import { Plate, W, H } from '../print.js';
import { mix, shade, lerp, rng } from '../kit.js';

// the inks
const PAPER = '#efe4cc', CHALK = '#f3ecdc', SAND = '#e2cea2', OCHRE = '#d6a560', TERRA = '#c8714b', PINK = '#dba486';
const LANE = '#4d3222', LANE_D = '#3a2418', EARTH = '#b89366', MUTE = '#c7a27a';
const COBALT = '#1f4c9e', COBALT_D = '#153672', GREEN = '#2e7d5b', GREEN_D = '#1f5a40', GREEN_L = '#5aa27c';
const OLIVE = '#7b8a4a', OLIVE_D = '#56632f', LINE = '#4a3426', GOLD = '#e0b24a';
const SHADOW = 'rgba(52,28,18,0.52)';
// the dyes
const DYES = ['#f7f3e8', '#e6dfcc', '#d0342a', '#a3221c', '#f0b81c', '#e27a18', '#7a4526', '#2a3f86', '#3a6cb4', '#4f9e3a', '#b8683a'];

export const city = {
  id: 'fez', name: 'Fez', wall: '#3b2a1f',
  alt: "The old medina of Fez seen from high above as a screen print at the end of the day: a maze of roof terraces and courtyards cut by dark lanes in the evening shade, the last sun on the dye vats of the Chouara tannery set out as a grid of color and on the green-tiled roofs and marble court of the Qarawiyyin, its minaret and the minaret of the Bou Inania madrasa standing up into the light, carpets hung over parapets, laundry, pigeons, the city wall with Bab Bou Jeloud and olive groves beyond, and the name فاس with FEZ on a block of Fez blue over a strip of zellige",
  google: 'family=Lalezar',
  fonts: [['400 260px "Lalezar"', 'فاسFEZ'], ['400 40px "Lalezar"', 'FEZ FÈS EL BALI · THE OLD MEDINA']],
  build,
};

// the sheet
const M = 56, X0 = M, X1 = W - M, Y0 = M, Y1 = H - M;
const TOP = 404;    // the foot of the title block
const WALL_Y = 560; // the city wall's foot
const K = 0.62; // how far up a roof is drawn per unit of height (the slant of the view)
// the places kept out of the maze
const QAR = { x: 150, y: 820, w: 560, h: 380 };
const TAN = { x: 740, y: 1250, w: 720, h: 540 };
const RES = [QAR, TAN];
// where the eye goes: the tannery first, the Qarawiyyin second. Far from them the
// roofs are printed in fewer inks and with less on them, so the sheet has calm
const FOC = [[TAN.x + TAN.w / 2, TAN.y + TAN.h / 2, 330], [QAR.x + QAR.w / 2, QAR.y + QAR.h / 2, 250]];
const focus = (x, y) => Math.max(0, Math.min(1, Math.min(...FOC.map(([fx, fy, r0]) => (Math.hypot(x - fx, (y - fy) * 1.1) - r0) / 620))));
// a slow field over the sheet, so the roofs' colors come in quarters, not one by one
const field = (x, y) => Math.sin(x / 230 + 0.7) + Math.sin(y / 190 + 2.1) + 0.7 * Math.sin((x + y) / 140);

// a gentle warp, so the lanes wander as they do
const warp = (x, y) => [x + 9 * Math.sin(y / 160 + 1.3) + 5 * Math.sin((x + y) / 77), y + 7 * Math.sin(x / 140 + 0.4) + 4 * Math.sin((x - y) / 63)];

function build() {
  const p = new Plate({ paper: PAPER, seed: 808 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('ground', 'outside', 'houses', 'qar', 'tannery', 'dusk', 'over', 'minarets', 'life', 'frame', 'title');
  p.layer('frame', { clip: false });
  p.layer('title', { clip: false });

  const houses = maze(r);
  ground(p, r);
  outside(p, r);
  drawHouses(p, houses);
  qarawiyyin(p, r);
  tannery(p, r, houses);
  dusk(p);
  minarets(p, r);
  carpets(p, r, houses);
  life(p, r, houses);
  frame(p);
  title(p);
  return p;
}

// ================================================================ the maze, made once
function maze(r) {
  const leaves = [];
  const hits = (x, y, w, h, pad) => RES.some((q) => x < q.x + q.w + pad && x + w > q.x - pad && y < q.y + q.h + pad && y + h > q.y - pad);
  const split = (x, y, w, h, depth) => {
    if (w < 26 || h < 22) return;
    if ((w < 120 && h < 100 && r.chance(0.5)) || (w < 70 && h < 62)) { leaves.push({ x, y, w, h, depth }); return; }
    const across = w > h * r.range(0.8, 1.25);
    const gap = depth < 2 ? 18 : depth < 4 ? r.pick([9, 11]) : r.chance(0.55) ? 0 : r.pick([5, 6]);
    const f = r.range(0.32, 0.68);
    if (across) { const a = Math.round(w * f); split(x, y, a - gap / 2, h, depth + 1); split(x + a + gap / 2, y, w - a - gap / 2, h, depth + 1); }
    else { const a = Math.round(h * f); split(x, y, w, a - gap / 2, depth + 1); split(x, y + a + gap / 2, w, h - a - gap / 2, depth + 1); }
  };
  split(X0 - 30, WALL_Y + 34, X1 - X0 + 60, Y1 - WALL_Y + 10, 0);
  const houses = [];
  for (const L of leaves) {
    if (hits(L.x, L.y, L.w, L.h, 6)) continue;
    const plaza = r.chance(0.035);
    const stories = r.pick([1, 2, 2, 2, 3, 3, 4]);
    const hgt = stories * 16 + r.range(-3, 3);
    const f = focus(L.x + L.w / 2, L.y + L.h / 2), n = field(L.x + L.w / 2, L.y + L.h / 2) + r.range(-0.6, 0.6);
    // near the focus the roofs are lime-white with a few ochres; out in the quarters sand, ochre and pink in patches
    let color = n > 1.1 ? OCHRE : n > 0.2 ? SAND : n > -0.9 ? CHALK : n > -1.8 ? PINK : TERRA;
    if (f < 0.3 && r.chance(0.6 * (1 - f / 0.3))) color = CHALK;
    color = mix(color, MUTE, f * 0.7);
    const detail = r() > f * 1.15;
    // the footprint's four corners, each a little out of true, then warped
    const j = () => r.range(-3, 3);
    const pts = [[L.x + j(), L.y + j()], [L.x + L.w + j(), L.y + j()], [L.x + L.w + j(), L.y + L.h + j()], [L.x + j(), L.y + L.h + j()]].map(([a, b]) => warp(a, b));
    const h = { pts, hgt, color, plaza, f, cx: L.x + L.w / 2, cy: L.y + L.h / 2, w: L.w, d: L.h };
    // what is on the roof, chosen now
    h.court = detail && !plaza && L.w > 62 && L.h > 56 && r.chance(0.45) ? { fx: r.range(0.32, 0.42), fy: r.range(0.3, 0.42), floor: r.pick(['green', 'blue', 'white', 'tree', 'tree']) } : null;
    h.tank = detail && r.chance(0.22) ? [r.range(0.12, 0.7), r.range(0.1, 0.6)] : null;
    h.hatch = detail && r.chance(0.5) ? [r.range(0.1, 0.8), r.range(0.1, 0.8)] : null;
    h.rug = detail && !h.court && r.chance(0.07) ? { u: r.range(0.15, 0.5), v: r.range(0.15, 0.45), col: r.pick([TERRA, COBALT, '#9c2a3a', GOLD, GREEN]), band: r.pick([CHALK, GOLD, COBALT_D]) } : null;
    h.line = detail && f < 0.4 && r.chance(0.2) ? { v: r.range(0.2, 0.8), cols: [r.pick([COBALT, TERRA, GOLD, CHALK, GREEN_L]), r.pick([CHALK, PINK, COBALT, GOLD]), r.pick([TERRA, CHALK, GREEN])] } : null;
    h.pavilion = detail && !h.court && r.chance(0.05);
    h.tree = plaza || (h.court && h.court.floor === 'tree');
    houses.push(h);
  }
  // back to front, so a house's roof, raised by its height, covers the lane behind it
  houses.sort((a, b) => a.cy - b.cy);
  return houses;
}
const up = ([x, y], z) => [x, y - z * K];
const quad = (c, q) => { c.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) c.lineTo(q[i][0], q[i][1]); c.closePath(); };
// a point inside a roof, by its fractions across and down
const at = (q, u, v) => { const a = [lerp(q[0][0], q[1][0], u), lerp(q[0][1], q[1][1], u)], b = [lerp(q[3][0], q[2][0], u), lerp(q[3][1], q[2][1], u)]; return [lerp(a[0], b[0], v), lerp(a[1], b[1], v)]; };
const sub = (q, u0, v0, u1, v1) => [at(q, u0, v0), at(q, u1, v0), at(q, u1, v1), at(q, u0, v1)];

// ================================================================ the ground and the wall
function ground(p, r) {
  // the lanes: packed earth, warm and dark, with the shadow of the walls in them
  p.group('ground', { x: X0, y: WALL_Y - 40, w: X1 - X0, h: Y1 - WALL_Y + 40 }, (c) => {
    c.fillStyle = LANE; c.fillRect(X0, WALL_Y - 20, X1 - X0, Y1 - WALL_Y + 20);
  }, { t: 0.3, d: 0.9, reveal: 'fall', ease: 'inOut' });
  // a speckle in the earth, as the screen leaves it
  const dots = [];
  for (let i = 0; i < 2600; i++) dots.push([r.range(X0, X1), r.range(WALL_Y, Y1), r.range(0.6, 1.6)]);
  p.group('ground', { x: X0, y: WALL_Y, w: X1 - X0, h: Y1 - WALL_Y }, (c) => {
    c.fillStyle = LANE_D; c.beginPath(); for (const [x, y, s] of dots) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
  }, { t: 0.9, d: 0.8, reveal: 'fade' });
}

function outside(p, r) {
  // beyond the wall: olive groves on red earth, a road coming in to the gate
  p.group('outside', { x: X0, y: TOP, w: X1 - X0, h: WALL_Y - TOP + 10 }, (c) => {
    c.fillStyle = EARTH; c.fillRect(X0, TOP, X1 - X0, WALL_Y - TOP + 10);
    // furrows
    c.beginPath(); for (let y = TOP + 8; y < WALL_Y; y += 9) { c.moveTo(X0, y); c.lineTo(X1, y + 10); } c.strokeStyle = 'rgba(120,80,50,.35)'; c.lineWidth = 1.2; c.stroke();
    // the road
    c.beginPath(); c.moveTo(1060, WALL_Y); c.bezierCurveTo(1090, 500, 1250, 450, 1320, TOP - 10); c.lineTo(1380, TOP - 10); c.bezierCurveTo(1300, 470, 1140, 500, 1160, WALL_Y); c.closePath();
    c.fillStyle = SAND; c.fill();
  }, { t: 0.5, d: 0.9, reveal: 'fall', ease: 'inOut' });
  // olive trees in rows, each a dark round crown with its shadow
  const trees = [];
  for (let y = TOP + 14; y < WALL_Y - 26; y += 30) for (let x = X0 + 10 + ((y / 30) % 2) * 18; x < X1; x += 36) {
    if (x > 1040 && x < 1400 && y > TOP + (1200 - x) * 0.3) continue;
    if (r.chance(0.12)) continue;
    trees.push([x + r.range(-4, 4), y + r.range(-3, 3), r.range(8, 12)]);
  }
  for (let g = 0; g < 4; g++) {
    const set = trees.filter((_, i) => i % 4 === g);
    p.group('outside', { x: X0, y: TOP, w: X1 - X0, h: WALL_Y - TOP }, (c) => {
      c.fillStyle = SHADOW; c.beginPath(); for (const [x, y, s] of set) { c.moveTo(x + s + 5, y + 4); c.arc(x + 5, y + 4, s, 0, Math.PI * 2); } c.fill();
      c.fillStyle = OLIVE_D; c.beginPath(); for (const [x, y, s] of set) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
      c.fillStyle = OLIVE; c.beginPath(); for (const [x, y, s] of set) { c.moveTo(x + s * 0.6 - 2, y - 2); c.arc(x - 2, y - 2, s * 0.6, 0, Math.PI * 2); } c.fill();
    }, { t: 1.0 + g * 0.2, d: 0.6, reveal: 'fade' });
  }
  // the wall: rammed earth, crenellated, its inner face toward us; the gate in it
  const top = WALL_Y - 48, gx0 = 1030, gx1 = 1250;
  p.group('outside', { x: X0, y: top - 30, w: X1 - X0, h: 110 }, (c) => {
    c.fillStyle = SHADOW; c.fillRect(X0, WALL_Y, X1 - X0, 22);
    c.fillStyle = TERRA; c.fillRect(X0, top - 16, X1 - X0, 18);
    c.fillStyle = shade(TERRA, 0.78); c.fillRect(X0, top, X1 - X0, WALL_Y - top);
    // the merlons along its top, the putlog holes in its face
    c.fillStyle = shade(TERRA, 1.12); for (let x = X0; x < X1; x += 22) c.fillRect(x, top - 24, 13, 9);
    c.fillStyle = shade(TERRA, 0.55); for (let y = top + 12; y < WALL_Y - 4; y += 14) for (let x = X0 + ((y / 14) % 2) * 20; x < X1; x += 40) c.fillRect(x, y, 4, 3);
    // towers along it
    for (const tx of [180, 470, 760, 1420]) {
      c.fillStyle = TERRA; c.fillRect(tx - 26, top - 46, 52, 30);
      c.fillStyle = shade(TERRA, 0.72); c.fillRect(tx - 26, top - 16, 52, WALL_Y - top + 16);
      c.fillStyle = shade(TERRA, 1.12); for (let x = tx - 26; x < tx + 26; x += 13) c.fillRect(x, top - 54, 8, 8);
      c.fillStyle = SHADOW; c.fillRect(tx + 26, top - 16, 18, WALL_Y - top + 30);
    }
  }, { t: 1.4, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // Bab Bou Jeloud: three horseshoe arches in a face of green tile (blue on its far side)
  const gt = WALL_Y - 120;
  p.group('outside', { x: gx0 - 20, y: gt - 40, w: gx1 - gx0 + 60, h: 170 }, (c) => {
    c.fillStyle = COBALT; c.fillRect(gx0, gt - 22, gx1 - gx0, 24);
    c.fillStyle = CHALK; for (let x = gx0; x < gx1; x += 14) c.fillRect(x, gt - 30, 9, 9);
    c.fillStyle = GREEN; c.fillRect(gx0, gt, gx1 - gx0, WALL_Y - gt);
    // the tile pattern: small stars in a lattice
    c.save(); c.beginPath(); c.rect(gx0, gt, gx1 - gx0, WALL_Y - gt); c.clip();
    c.fillStyle = GREEN_L;
    for (let y = gt + 8; y < WALL_Y; y += 14) for (let x = gx0 + ((y - gt) / 14 % 2) * 7; x < gx1; x += 14) { c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 5, y); c.lineTo(x, y + 5); c.lineTo(x - 5, y); c.closePath(); c.fill(); }
    c.fillStyle = CHALK; for (let y = gt + 8; y < WALL_Y; y += 14) for (let x = gx0 + ((y - gt) / 14 % 2) * 7; x < gx1; x += 14) c.fillRect(x - 1, y - 1, 2, 2);
    c.restore();
    // the arches: an ochre frame, a carved band, and the dark way through
    for (const [ax, aw, ah] of [[gx0 + 38, 38, 76], [(gx0 + gx1) / 2, 50, 96], [gx1 - 38, 38, 76]]) {
      const foot = WALL_Y, cy = foot - ah + aw * 0.5;
      c.fillStyle = GOLD; c.fillRect(ax - aw * 0.75, foot - ah - aw * 0.3, aw * 1.5, ah + aw * 0.3);
      c.fillStyle = COBALT; c.fillRect(ax - aw * 0.66, foot - ah - aw * 0.22, aw * 1.32, ah + aw * 0.22);
      c.fillStyle = '#2a1a12';
      c.beginPath(); c.moveTo(ax - aw * 0.42, foot); c.lineTo(ax - aw * 0.42, cy + aw * 0.2); c.arc(ax, cy, aw * 0.5, Math.PI * 0.62, Math.PI * 2.38); c.lineTo(ax + aw * 0.42, foot); c.closePath(); c.fill();
    }
    c.fillStyle = SHADOW; c.fillRect(gx1, gt - 22, 30, WALL_Y - gt + 46);
  }, { t: 2.2, d: 1.0, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the houses
// one house: its cast shadow is drawn in an earlier pass; here its south wall and its roof
function wallAndRoof(c, h) {
  const z = h.hgt, roof = h.pts.map((q) => up(q, z));
  // the south wall, in shade: between the roof's front edge and the footprint's
  c.beginPath(); quad(c, [roof[3], roof[2], h.pts[2], h.pts[3]]); c.fillStyle = shade(h.color, 0.7); c.fill();
  // floor lines and small windows in it
  if (z > 20) {
    c.strokeStyle = shade(h.color, 0.58); c.lineWidth = 0.8; c.beginPath();
    for (let s = 16; s < z - 4; s += 16) { const a = up(h.pts[3], s), b = up(h.pts[2], s); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
  }
  c.beginPath(); quad(c, roof); c.fillStyle = h.color; c.fill();
  // the parapet: a light rim, and the shade it throws inside along its north and west
  const inner = sub(roof, 0.06, 0.07, 0.94, 0.93);
  c.beginPath(); quad(c, inner); c.strokeStyle = shade(h.color, 0.88); c.lineWidth = 1; c.stroke();
  c.beginPath(); c.moveTo(inner[3][0], inner[3][1]); c.lineTo(inner[0][0], inner[0][1]); c.lineTo(inner[1][0], inner[1][1]);
  c.strokeStyle = SHADOW; c.lineWidth = 3; c.stroke();
  return roof;
}
function roofThings(c, h, roof) {
  if (h.plaza) return;
  if (h.court) {
    const { fx, fy, floor } = h.court;
    const q = sub(roof, fx, fy, 1 - fx, 1 - fy);
    // the court is a hole down to the ground floor: its floor, and the deep shade along two sides
    c.beginPath(); quad(c, q);
    c.fillStyle = floor === 'green' ? GREEN : floor === 'blue' ? COBALT : floor === 'white' ? '#e9e3d4' : '#cdb38a'; c.fill();
    if (floor !== 'tree') {
      // a checker of tiles
      c.fillStyle = floor === 'white' ? '#b9c7c0' : CHALK;
      for (let u = 0; u < 6; u++) for (let v = 0; v < 6; v++) if ((u + v) % 2 === 0) { c.beginPath(); quad(c, sub(q, u / 6, v / 6, (u + 1) / 6, (v + 1) / 6)); c.fill(); }
      const m = at(q, 0.5, 0.5); c.fillStyle = CHALK; c.beginPath(); c.arc(m[0], m[1], 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#7fb9c9'; c.beginPath(); c.arc(m[0], m[1], 2.4, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = 'rgba(60,32,22,0.55)';
    c.beginPath(); quad(c, [q[0], q[1], at(q, 1, 0.42), at(q, 0.22, 0.42), at(q, 0.22, 1), q[3]]); c.fill();
    c.beginPath(); quad(c, q); c.strokeStyle = LINE; c.lineWidth = 0.8; c.stroke();
  }
  if (h.tank) {
    const [x, y] = at(roof, h.tank[0], h.tank[1]);
    c.fillStyle = SHADOW; c.fillRect(x + 3, y + 3, 12, 9);
    c.fillStyle = CHALK; c.fillRect(x, y, 11, 8); c.strokeStyle = LINE; c.lineWidth = 0.6; c.strokeRect(x, y, 11, 8);
  }
  if (h.hatch) {
    const [x, y] = at(roof, h.hatch[0], h.hatch[1]);
    c.fillStyle = shade(h.color, 0.66); c.fillRect(x, y, 9, 6); c.fillStyle = shade(h.color, 0.45); c.fillRect(x, y, 9, 2);
  }
  if (h.rug) {
    const q = sub(roof, h.rug.u, h.rug.v, h.rug.u + 0.36, h.rug.v + 0.42);
    c.beginPath(); quad(c, q); c.fillStyle = h.rug.col; c.fill();
    c.beginPath(); quad(c, sub(q, 0.14, 0.14, 0.86, 0.86)); c.strokeStyle = h.rug.band; c.lineWidth = 1.6; c.stroke();
    const m = at(q, 0.5, 0.5); c.fillStyle = h.rug.band; c.beginPath(); c.moveTo(m[0], m[1] - 4); c.lineTo(m[0] + 3, m[1]); c.lineTo(m[0], m[1] + 4); c.lineTo(m[0] - 3, m[1]); c.fill();
  }
  if (h.pavilion) {
    // a little green-tiled pyramid roof over a stair or a room on the terrace
    const q = sub(roof, 0.55, 0.15, 0.85, 0.5), m = at(q, 0.5, 0.5);
    c.fillStyle = SHADOW; c.beginPath(); quad(c, q.map(([x, y]) => [x + 6, y + 5])); c.fill();
    for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(q[k][0], q[k][1]); c.lineTo(q[(k + 1) % 4][0], q[(k + 1) % 4][1]); c.lineTo(m[0], m[1]); c.closePath(); c.fillStyle = [GREEN_L, GREEN, GREEN_D, GREEN][k]; c.fill(); }
    c.fillStyle = GOLD; c.beginPath(); c.arc(m[0], m[1], 1.6, 0, Math.PI * 2); c.fill();
  }
  if (h.line) {
    // a washing line across the terrace, with what hangs on it
    const a = at(roof, 0.12, h.line.v), b = at(roof, 0.88, h.line.v);
    c.strokeStyle = LINE; c.lineWidth = 0.6; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    h.line.cols.forEach((col, i) => { const t = 0.2 + i * 0.25, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t); c.fillStyle = col; c.fillRect(x - 4, y, 8, 6); });
  }
}
function treeTop(c, x, y, s) {
  c.fillStyle = SHADOW; c.beginPath(); c.arc(x + s * 0.5, y + s * 0.4, s, 0, Math.PI * 2); c.fill();
  c.fillStyle = GREEN_D; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  c.fillStyle = GREEN; c.beginPath(); c.arc(x - s * 0.2, y - s * 0.2, s * 0.72, 0, Math.PI * 2); c.fill();
  c.fillStyle = GREEN_L; c.beginPath(); c.arc(x - s * 0.35, y - s * 0.35, s * 0.36, 0, Math.PI * 2); c.fill();
  // oranges
  c.fillStyle = '#e8902a'; for (let k = 0; k < 4; k++) { const a = k * 1.7 + x; c.beginPath(); c.arc(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, 1.6, 0, Math.PI * 2); c.fill(); }
}
function drawHouses(p, houses) {
  // in bands from north to south, so every roof covers what lies behind it; each band in a few patches
  const rows = 13, cols = 4, bandH = (Y1 - WALL_Y) / rows;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const set = houses.filter((h) => Math.min(rows - 1, Math.floor((h.cy - WALL_Y) / bandH)) === j && Math.min(cols - 1, Math.max(0, Math.floor((h.cx - X0) / ((X1 - X0) / cols)))) === i);
      if (!set.length) continue;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const h of set) for (const [x, y] of h.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y - h.hgt * K); y1 = Math.max(y1, y); }
      const box = { x: x0 - 30, y: y0 - 20, w: x1 - x0 + 90, h: y1 - y0 + 70 };
      // first the shadows they cast, to the south-east
      p.group('houses', box, (c) => {
        c.fillStyle = SHADOW; c.beginPath();
        for (const h of set) {
          if (h.plaza) continue;
          const s = h.hgt * 0.75, roof = h.pts.map((q) => up(q, h.hgt));
          const sh = roof.map(([x, y]) => [x + s, y + s * 0.5 + h.hgt * K]);
          quad(c, [roof[1], sh[1], sh[2], sh[3], h.pts[3], h.pts[2]]);
        }
        c.fill();
        for (const h of set) {
          const roof = wallAndRoof(c, h.plaza ? { ...h, hgt: 0, color: SAND } : h);
          roofThings(c, h, roof);
        }
        for (const h of set) if (h.tree) { const q = h.pts.map((v) => up(v, h.plaza ? 0 : h.hgt)); const m = h.plaza ? at(q, 0.5, 0.5) : at(q, 0.5, 0.5); treeTop(c, m[0], m[1], Math.min(h.w, h.d) * (h.plaza ? 0.34 : 0.17)); }
      }, { t: 1.8 + j * 0.34 + Math.abs(i - 1.5) * 0.12, d: 0.7, reveal: 'drop', dy: 16 });
    }
  }
}

// ================================================================ the Qarawiyyin
function qarawiyyin(p, r) {
  const { x, y, w, h } = QAR, z = 34;
  const bx = x, by = y - z * K;
  // the shadow it casts, and its outer wall
  p.group('qar', { x: x - 10, y: by - 10, w: w + 60, h: h + 60 }, (c) => {
    c.fillStyle = SHADOW; c.fillRect(x + w, by + 10, 26, h + 10); c.fillRect(x + 20, y + h, w + 6, 14);
    c.fillStyle = shade(CHALK, 0.72); c.fillRect(x, by + h, w, z * K);
    c.fillStyle = CHALK; c.fillRect(x, by, w, h);
    c.strokeStyle = LINE; c.lineWidth = 1; c.strokeRect(x, by, w, h);
  }, { t: 5.2, d: 0.6, reveal: 'fade' });
  // the prayer hall: long ridged roofs of green tile, row on row, running east and west
  const hallW = w * 0.6, rows = 11, rh = (h - 20) / rows;
  for (let k = 0; k < rows; k++) {
    const ry = by + 10 + k * rh;
    p.group('qar', { x: x + 6, y: ry - 4, w: hallW + 8, h: rh + 8 }, (c) => {
      // the north slope in light, the south in shade, the ridge between
      c.fillStyle = mix(GREEN_L, k % 3 ? '#ffffff' : '#88a060', 0.12); c.fillRect(x + 10, ry, hallW, rh * 0.5);
      c.fillStyle = mix(GREEN_D, '#000000', k % 2 ? 0.08 : 0); c.fillRect(x + 10, ry + rh * 0.5, hallW, rh * 0.5);
      c.strokeStyle = 'rgba(20,50,35,.55)'; c.lineWidth = 0.8; c.beginPath();
      for (let tx = x + 14; tx < x + 10 + hallW; tx += 5) { c.moveTo(tx, ry + 1); c.lineTo(tx, ry + rh - 1); }
      c.stroke();
      c.fillStyle = CHALK; c.fillRect(x + 10, ry + rh * 0.5 - 1.2, hallW, 2.4);
      c.strokeStyle = LINE; c.lineWidth = 0.8; c.strokeRect(x + 10, ry, hallW, rh);
    }, { t: 5.5 + k * 0.08, d: 0.6, reveal: 'wipe', ease: 'inOut' });
  }
  // the nave that runs to the mihrab, across the rows: higher, its roof ridged the other way, three domes on it
  const nx = x + 10 + hallW * 0.5 - 26;
  p.group('qar', { x: nx - 10, y: by, w: 90, h: h + 10 }, (c) => {
    c.fillStyle = SHADOW; c.fillRect(nx + 52, by + 10, 14, h - 20);
    c.fillStyle = GREEN_L; c.fillRect(nx, by + 6, 26, h - 12); c.fillStyle = GREEN; c.fillRect(nx + 26, by + 6, 26, h - 12);
    c.strokeStyle = 'rgba(20,50,35,.5)'; c.lineWidth = 0.8; c.beginPath(); for (let yy = by + 10; yy < by + h - 6; yy += 5) { c.moveTo(nx + 1, yy); c.lineTo(nx + 51, yy); } c.stroke();
    c.fillStyle = CHALK; c.fillRect(nx + 25, by + 6, 2.4, h - 12);
    c.strokeStyle = LINE; c.strokeRect(nx, by + 6, 52, h - 12);
    for (const f of [0.18, 0.5, 0.82]) pyramid(c, nx + 26, by + h * f, 20, GREEN);
  }, { t: 6.3, d: 0.8, reveal: 'fall', ease: 'inOut' });
  // the court: white marble in a checker of tile, a pavilion at each end, a basin
  const cx0 = x + 10 + hallW + 12, cx1 = x + w - 12, cy0 = by + 54, cy1 = by + h - 54;
  p.group('qar', { x: cx0 - 6, y: cy0 - 6, w: cx1 - cx0 + 12, h: cy1 - cy0 + 12 }, (c) => {
    c.fillStyle = '#ece6d6'; c.fillRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
    c.fillStyle = '#c9d6cf';
    for (let yy = cy0, j = 0; yy < cy1; yy += 12, j++) for (let xx = cx0 + (j % 2) * 12; xx < cx1; xx += 24) c.fillRect(xx, yy, 12, Math.min(12, cy1 - yy));
    // arcades round it, their shade on the floor
    c.fillStyle = 'rgba(60,32,22,.5)'; c.fillRect(cx0, cy0, cx1 - cx0, 12); c.fillRect(cx0, cy0, 10, cy1 - cy0);
    // the basin in the middle
    const mx = (cx0 + cx1) / 2, my = (cy0 + cy1) / 2;
    c.fillStyle = CHALK; c.beginPath(); c.arc(mx, my, 16, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6fb3c8'; c.beginPath(); c.arc(mx, my, 11, 0, Math.PI * 2); c.fill();
    c.strokeStyle = LINE; c.lineWidth = 0.8; c.strokeRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
  }, { t: 6.4, d: 0.8, reveal: 'iris', ease: 'inOut' });
  // the two fountain pavilions on the court's short ends, and the galleries along its long sides
  for (const [px, py] of [[(cx0 + cx1) / 2, cy0 - 26], [(cx0 + cx1) / 2, cy1 + 26]]) {
    p.group('qar', { x: px - 40, y: py - 40, w: 90, h: 90 }, (c) => pyramid(c, px, py, 30, GREEN), { t: 6.9 + (py > cy0 ? 0.15 : 0), d: 0.5, reveal: 'pop' });
  }
  p.group('qar', { x: cx0 - 10, y: by + 4, w: cx1 - cx0 + 20, h: h }, (c) => {
    for (const yy of [by + 12, by + h - 30]) {
      c.fillStyle = GREEN_L; c.fillRect(cx0 - 4, yy, cx1 - cx0 + 8, 9); c.fillStyle = GREEN_D; c.fillRect(cx0 - 4, yy + 9, cx1 - cx0 + 8, 9);
      c.strokeStyle = LINE; c.lineWidth = 0.7; c.strokeRect(cx0 - 4, yy, cx1 - cx0 + 8, 18);
    }
  }, { t: 7.2, d: 0.6, reveal: 'wipe' });
}
// a square pyramid roof of green tile seen from above, its shadow to the south-east
function pyramid(c, x, y, s, col) {
  const q = [[x - s, y - s], [x + s, y - s], [x + s, y + s], [x - s, y + s]];
  c.fillStyle = SHADOW; c.beginPath(); quad(c, q.map(([a, b]) => [a + s * 0.6, b + s * 0.4])); c.fill();
  const tones = [mix(col, '#ffffff', 0.3), col, shade(col, 0.62), shade(col, 0.82)];
  for (let k = 0; k < 4; k++) {
    c.beginPath(); c.moveTo(q[k][0], q[k][1]); c.lineTo(q[(k + 1) % 4][0], q[(k + 1) % 4][1]); c.lineTo(x, y); c.closePath(); c.fillStyle = tones[k]; c.fill();
  }
  // tile courses
  c.strokeStyle = 'rgba(20,50,35,.45)'; c.lineWidth = 0.7; c.beginPath();
  for (let f = 0.25; f < 1; f += 0.25) { c.moveTo(x - s * f, y - s * f); c.lineTo(x + s * f, y - s * f); c.lineTo(x + s * f, y + s * f); c.lineTo(x - s * f, y + s * f); c.closePath(); }
  c.stroke();
  c.strokeStyle = LINE; c.lineWidth = 0.8; c.beginPath(); quad(c, q); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[2][0], q[2][1]); c.moveTo(q[1][0], q[1][1]); c.lineTo(q[3][0], q[3][1]); c.stroke();
  c.fillStyle = GOLD; c.beginPath(); c.arc(x, y, 2.4, 0, Math.PI * 2); c.fill();
}

// ================================================================ the tannery
const VATS = [];
function tannery(p, r, houses) {
  const { x, y, w, h } = TAN;
  // the terraces: an irregular yard of wet stone, closed in by the houses round it
  const cx = x + w / 2, cy = y + h / 2;
  const edge = [];
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2, n = 1 + 0.03 * Math.sin(a * 3 + 1) + 0.025 * Math.sin(a * 7 + 2);
    const ex = Math.cos(a), ey = Math.sin(a), sq = 1 / Math.max(Math.abs(ex) ** 9 + Math.abs(ey) ** 9, 1e-6) ** (1 / 9);
    edge.push([cx + ex * sq * (w / 2 - 8) * n, cy + ey * sq * (h / 2 - 8) * n]);
  }
  const inside = (px, py, pad) => { const a = Math.atan2((py - cy) / (h / 2), (px - cx) / (w / 2)); const k = Math.round(((a + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * 48) % 48; const [ex, ey] = edge[k]; return Math.hypot(px - cx, (py - cy) * w / h) < Math.hypot(ex - cx, (ey - cy) * w / h) - pad; };
  p.group('tannery', { x: x - 20, y: y - 20, w: w + 50, h: h + 50 }, (c) => {
    c.fillStyle = '#2e1b12'; c.beginPath(); quad(c, edge.map(([a, b2]) => [cx + (a - cx) * 1.035, cy + (b2 - cy) * 1.05 + 8])); c.fill();
    c.fillStyle = '#cdb48c'; c.beginPath(); quad(c, edge); c.fill();
    c.save(); c.beginPath(); quad(c, edge); c.clip();
    c.fillStyle = '#b89c74'; for (let k = 0; k < 9; k++) c.fillRect(x, y + k * h / 9 + 6, w, 3);
    c.fillStyle = 'rgba(60,32,22,.45)'; c.fillRect(x, y, w, 22); c.fillRect(x, y, 18, h);
    c.restore();
    c.strokeStyle = LINE; c.lineWidth = 1.2; c.beginPath(); quad(c, edge); c.stroke();
  }, { t: 6.0, d: 0.6, reveal: 'fade' });
  // the vats: a honeycomb of round pits, the dyes in patches, the lime whites to the north
  VATS.length = 0;
  const rad = 26, dx = 64, dy = 56;
  // the dyes come in blocks of a few vats each, neighbors never alike
  const order = [2, 4, 8, 5, 9, 3, 6, 4, 8, 2, 9, 5, 7, 2, 4, 8];
  for (let j = 0, yy = y + 34; yy < y + h - 20; yy += dy, j++) {
    for (let xx = x + 36 + (j % 2) * dx / 2; xx < x + w - 20; xx += dx) {
      const px = xx + r.range(-2, 2), py = yy + r.range(-2, 2);
      if (!inside(px, py, rad + 8)) continue;
      const u = (px - x) / w, v = (py - y) / h;
      let k;
      if (v < 0.2) k = r.chance(0.8) ? r.pick([0, 1]) : 10;
      else k = order[(Math.floor(u * 5) + Math.floor((v - 0.2) * 3.4) * 5) % order.length];
      if (k !== 0 && k !== 1 && r.chance(0.1)) k = r.pick([0, 10]);
      VATS.push([px, py, rad * r.range(0.92, 1.04), k]);
    }
  }
  // the vats fill in a sweep, grouped by row
  const byRow = new Map();
  for (const v of VATS) { const k = Math.round((v[1] - y - 22) / dy); if (!byRow.has(k)) byRow.set(k, []); byRow.get(k).push(v); }
  [...byRow.values()].forEach((set, i) => {
    p.group('tannery', { x: x, y: set[0][1] - 40, w: w, h: 80 }, (c) => {
      for (const [vx, vy, vr, k] of set) {
        c.fillStyle = '#ebdcc0'; c.beginPath(); c.arc(vx, vy, vr + 5, 0, Math.PI * 2); c.fill();
        c.fillStyle = DYES[k]; c.beginPath(); c.arc(vx, vy, vr, 0, Math.PI * 2); c.fill();
        // the rim's shade on the dye, a glint
        c.fillStyle = 'rgba(40,20,10,.32)'; c.beginPath(); c.arc(vx, vy, vr, Math.PI * 0.9, Math.PI * 1.9); c.arc(vx + 3, vy + 3, vr - 2, Math.PI * 1.9, Math.PI * 0.9, true); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.6; c.beginPath(); c.arc(vx, vy, vr - 3, Math.PI * 0.05, Math.PI * 0.45); c.stroke();
        c.strokeStyle = LINE; c.lineWidth = 0.7; c.beginPath(); c.arc(vx, vy, vr + 4, 0, Math.PI * 2); c.stroke();
      }
    }, { t: 6.4 + i * 0.2, d: 0.6, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
  // hides laid out to dry on the roofs nearby: pale, irregular, in rows
  const near = houses.filter((h) => !h.plaza && !h.court && Math.hypot(h.cx - (x + w / 2), (h.cy - (y + h / 2)) * 1.3) < 520);
  const hides = [];
  for (const hs of near) {
    const roof = hs.pts.map((q) => up(q, hs.hgt));
    for (let u = 0.15; u < 0.85; u += 0.24) for (let v = 0.18; v < 0.85; v += 0.3) if (r.chance(0.7)) hides.push([...at(roof, u, v), r.range(6, 9), r.range(4, 6), r.pick(['#e6cfa1', '#d7b47e', '#c99561', '#ead9b6'])]);
  }
  p.group('tannery', { x: x - 300, y: y - 400, w: w + 600, h: h + 800 }, (c) => {
    for (const [hx, hy, a, b, col] of hides) {
      c.fillStyle = col; c.beginPath(); c.moveTo(hx - a, hy - b * 0.6); c.lineTo(hx - a * 0.4, hy - b); c.lineTo(hx + a * 0.5, hy - b * 0.8); c.lineTo(hx + a, hy - b * 0.2); c.lineTo(hx + a * 0.8, hy + b); c.lineTo(hx - a * 0.6, hy + b * 0.8); c.closePath(); c.fill();
    }
  }, { t: 8.6, d: 0.8, reveal: 'fade' });
}

// ================================================================ evening
// the hills' shadow comes over the medina at the end of the day, a transparent
// umber ink laid over everything but the pool of sun on the tannery and the
// Qarawiyyin; the minarets stand up out of it into the light
function dusk(p) {
  const C = [820, 1260];
  const lit = (x, y) => ((x - 1100) / 590) ** 2 + ((y - 1500) / 420) ** 2 < 1 || ((x - 440) / 430) ** 2 + ((y - 1010) / 300) ** 2 < 1;
  const edge = [];
  for (let k = 0; k < 160; k++) {
    const a = (k / 160) * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
    let t = 0;
    for (let s = 0; s < 1400; s += 6) if (lit(C[0] + dx * s, C[1] + dy * s)) t = s;
    t += 14 * Math.sin(a * 7 + 1) + 8 * Math.sin(a * 13 + 4);
    edge.push([C[0] + dx * t, C[1] + dy * t]);
  }
  p.group('dusk', { x: X0, y: WALL_Y - 30, w: X1 - X0, h: Y1 - WALL_Y + 30 }, (c) => {
    c.fillStyle = 'rgba(64,30,44,0.40)';
    c.beginPath(); c.rect(X0, WALL_Y + 10, X1 - X0, Y1 - WALL_Y - 10); quad(c, edge); c.fill('evenodd');
  }, { t: 8.6, d: 1.6, reveal: 'fade', ease: 'inOut' });
}

// ================================================================ minarets
// a square tower from above: its tall south face hangs below its top; its shadow falls far
const MINARETS = [
  { x: 668, y: 760, s: 66, z: 330, face: '#fbf8f0', band: null, dome: true }, // the Qarawiyyin's: plain whitewash, a small dome on top
  { x: 880, y: 690, s: 62, z: 360, face: OCHRE, band: GREEN }, // Bou Inania's, near the gate
  { x: 300, y: 1560, s: 36, z: 150, face: mix(SAND, MUTE, 0.5), band: mix(GREEN, MUTE, 0.5) },
];
function minarets(p, r) {
  // the shadows first, laid over the roofs, long and slanting to the south-east
  MINARETS.forEach((m, i) => {
    const L = m.z * 0.85;
    const pts = [[m.x + m.s, m.y], [m.x + m.s + L, m.y + L * 0.5], [m.x + m.s + L, m.y + L * 0.5 + m.s], [m.x + m.s, m.y + m.s], [m.x, m.y + m.s], [m.x + L * 0.8, m.y + m.s + L * 0.5]];
    p.group('over', { x: m.x - 10, y: m.y - 10, w: L + m.s + 40, h: L * 0.6 + m.s + 30 }, (c) => {
      c.fillStyle = SHADOW; c.beginPath();
      c.moveTo(m.x + m.s, m.y); c.lineTo(m.x + m.s + L, m.y + L * 0.5); c.lineTo(m.x + m.s + L, m.y + L * 0.5 + m.s); c.lineTo(m.x + L, m.y + m.s + L * 0.5); c.lineTo(m.x, m.y + m.s); c.closePath(); c.fill();
    }, { t: 7.6 + i * 0.25, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  });
  MINARETS.forEach((m, i) => {
    const { x, y, s, z } = m, top = y - z * K;
    p.group('minarets', { x: x - 20, y: top - 40, w: s + 40, h: z * K + s + 60 }, (c) => {
      // the south face: bands of tile and blind arches
      c.fillStyle = m.dome ? '#ebe4d4' : mix(m.face, TERRA, 0.2); c.fillRect(x, top + s, s, y + s - (top + s));
      const fh = y - top;
      if (m.band) {
        c.fillStyle = m.band; c.fillRect(x, top + s + 6, s, fh * 0.16);
        c.fillStyle = CHALK; for (let k = 0; k < 4; k++) c.fillRect(x + 3 + k * (s - 6) / 4, top + s + 8, (s - 6) / 8, fh * 0.16 - 4);
      }
      c.fillStyle = shade(m.face, 0.55);
      for (const f of [0.34, 0.58]) {
        const ay = top + s + fh * f;
        for (const ax of [x + s * 0.3, x + s * 0.7]) { c.beginPath(); c.moveTo(ax - 4, ay + 18); c.lineTo(ax - 4, ay); c.arc(ax, ay, 4, Math.PI, 0); c.lineTo(ax + 4, ay + 18); c.fill(); }
      }
      // a panel of interlaced lozenges (sebka) on the upper face
      c.save(); c.beginPath(); c.rect(x + 5, top + s + fh * 0.2, s - 10, fh * 0.12); c.clip();
      c.strokeStyle = shade(m.face, 0.5); c.lineWidth = 1; c.beginPath();
      for (let k = -2; k < 8; k++) { const xx = x + 5 + k * 8; c.moveTo(xx, top + s + fh * 0.32); c.lineTo(xx + 8, top + s + fh * 0.2); c.moveTo(xx, top + s + fh * 0.2); c.lineTo(xx + 8, top + s + fh * 0.32); }
      c.stroke(); c.restore();
      c.strokeStyle = LINE; c.lineWidth = 0.8; c.strokeRect(x, top + s, s, y + s - (top + s));
      // the top: crenellations round a platform, the lantern in the middle with its green roof
      c.fillStyle = m.face; c.fillRect(x, top, s, s);
      c.fillStyle = shade(m.face, 0.85); for (let k = 0; k < s; k += 8) { c.fillRect(x + k, top, 5, 4); c.fillRect(x + k, top + s - 4, 5, 4); c.fillRect(x, top + k, 4, 5); c.fillRect(x + s - 4, top + k, 4, 5); }
      c.strokeStyle = LINE; c.strokeRect(x, top, s, s);
      const lx = x + s / 2, ly = top + s / 2 - 10, ls = s * 0.24;
      if (m.dome) {
        // a small whitewashed dome, lit on its north-west, with its shade to the south-east
        const dr = s * 0.26, dy = top + s / 2;
        c.fillStyle = SHADOW; c.beginPath(); c.arc(lx + 6, dy + 5, dr, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ddd5c2'; c.beginPath(); c.arc(lx, dy, dr, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(lx - dr * 0.3, dy - dr * 0.3, dr * 0.6, 0, Math.PI * 2); c.fill();
        c.fillStyle = GOLD; c.beginPath(); c.arc(lx, dy - 2, 2.6, 0, Math.PI * 2); c.fill();
        return;
      }
      c.fillStyle = shade(m.face, 0.75); c.fillRect(lx - ls, ly + ls, 2 * ls, 10);
      pyramid(c, lx, ly, ls, GREEN);
      // the finial: three gold balls on a rod, leaning toward us
      c.strokeStyle = GOLD; c.lineWidth = 1.6; c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx, ly - 14); c.stroke();
      c.fillStyle = GOLD; for (const [dy, rr] of [[-4, 3], [-8, 2.4], [-11.5, 1.8]]) { c.beginPath(); c.arc(lx, ly + dy, rr, 0, Math.PI * 2); c.fill(); }
    }, { t: 7.8 + i * 0.25, d: 1.1, reveal: 'rise', ease: 'inOut' });
  });
}

// ================================================================ carpets hung out
function carpets(p, r, houses) {
  // over the parapets along the lanes: draped down the south faces, bright against the shade
  const pick = houses.filter((h) => !h.plaza && h.hgt > 30 && h.f < 0.45 && r.chance(0.3));
  const rugs = pick.map((h) => {
    const roof = h.pts.map((q) => up(q, h.hgt));
    const u = r.range(0.15, 0.6), a = at([roof[3], roof[2], h.pts[2], h.pts[3]], u, 0), w = r.range(12, 22);
    return { x: a[0], y: a[1], w, l: Math.min(h.hgt * K - 4, r.range(16, 30)), col: r.pick(['#a8283a', TERRA, COBALT, GOLD, '#6b2a5a', GREEN, '#d4572e']), band: r.pick([CHALK, GOLD, COBALT_D, '#2a1a12']), fr: r.chance(0.5) };
  });
  for (let g = 0; g < 4; g++) {
    const set = rugs.filter((_, i) => i % 4 === g);
    p.group('over', { x: X0, y: WALL_Y, w: X1 - X0, h: Y1 - WALL_Y }, (c) => {
      for (const k of set) {
        c.fillStyle = k.col; c.fillRect(k.x, k.y, k.w, k.l);
        c.strokeStyle = k.band; c.lineWidth = 1.4; c.strokeRect(k.x + 2.5, k.y + 2.5, k.w - 5, k.l - 5);
        c.fillStyle = k.band; c.beginPath(); const mx = k.x + k.w / 2, my = k.y + k.l / 2; c.moveTo(mx, my - 4); c.lineTo(mx + 3, my); c.lineTo(mx, my + 4); c.lineTo(mx - 3, my); c.fill();
        if (k.fr) { c.fillRect(k.x + 2, k.y + k.l * 0.25, k.w - 4, 1.4); c.fillRect(k.x + 2, k.y + k.l * 0.72, k.w - 4, 1.4); }
        // the fringe and the rug's own shadow
        c.strokeStyle = CHALK; c.lineWidth = 0.7; c.beginPath(); for (let fx = k.x + 1; fx < k.x + k.w; fx += 2.4) { c.moveTo(fx, k.y + k.l); c.lineTo(fx, k.y + k.l + 3); } c.stroke();
        c.fillStyle = SHADOW; c.fillRect(k.x + k.w, k.y + 2, 4, k.l);
      }
    }, { t: 9.0 + g * 0.2, d: 0.6, reveal: 'drop', dy: 12 });
  }
}

// ================================================================ what moves
function life(p, r, houses) {
  // pigeons wheeling over the roofs, their shadows a little behind them on the terraces
  const flock = [];
  for (let i = 0; i < 26; i++) flock.push([r.gauss() * 70, r.gauss() * 46, r() * 7, r.range(0.8, 1.2)]);
  p.live('life', {
    t: 9.6, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      const a = time * 0.11, cx = 560 + Math.cos(a) * 380, cy = 1250 + Math.sin(a * 1.7) * 300;
      const dir = Math.atan2(Math.cos(a * 1.7) * 1.7 * 300, -Math.sin(a) * 380);
      for (const [dx, dy, ph, s] of flock) {
        const x = cx + dx + Math.sin(time * 0.8 + ph) * 12, y = cy + dy + Math.cos(time * 0.7 + ph) * 9;
        const f = Math.sin(time * 9 + ph * 4);
        for (const [ox, oy, col] of [[26, 22, SHADOW], [0, 0, '#f6f1e6']]) {
          c.save(); c.translate(x + ox, y + oy); c.rotate(dir); c.scale(s, s);
          c.fillStyle = col; c.beginPath();
          c.moveTo(6, 0); c.lineTo(1, -1.5); c.lineTo(-1, -8 - f * 2); c.lineTo(-3, -1.5); c.lineTo(-7, -2); c.lineTo(-7, 2); c.lineTo(-3, 1.5); c.lineTo(-1, 8 + f * 2); c.lineTo(1, 1.5); c.closePath(); c.fill();
          c.restore();
        }
      }
    },
  });
  // men at work on the stone between the vats, carrying hides along the walkways
  const work = VATS.filter((_, i) => i % 11 === 5).slice(0, 8).map((v, i) => [v[0] + 20, v[1] + 18, i * 1.3, i % 2 ? 1 : -1]);
  p.live('life', {
    t: 9.9, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const [x0, y, ph, dir] of work) {
        const x = x0 + Math.sin(time * 0.5 + ph) * 8 * dir;
        // a long shadow to the south-east tells a standing man from above
        c.fillStyle = SHADOW; c.beginPath(); c.moveTo(x - 4, y + 2); c.lineTo(x + 20, y + 14); c.lineTo(x + 22, y + 9); c.lineTo(x + 4, y - 2); c.closePath(); c.fill();
        c.fillStyle = '#9c4a2c'; c.beginPath(); c.roundRect(x - 7, y - 3.5, 14, 7, 3); c.fill();
        // the hide over his shoulder
        c.fillStyle = '#e6cfa1'; c.fillRect(x - 8, y - 5, 7, 9);
        c.fillStyle = '#2a1a12'; c.beginPath(); c.arc(x + 1.5, y, 2.6, 0, Math.PI * 2); c.fill();
      }
    },
  });
  // washing stirring on the lines
  const lines = houses.filter((h) => h.line).map((h) => { const roof = h.pts.map((q) => up(q, h.hgt)); return [at(roof, 0.12, h.line.v), at(roof, 0.88, h.line.v), h.line.cols, h.cx * 0.01]; });
  p.live('life', {
    t: 10.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const [a, b, cols, ph] of lines) cols.forEach((col, i) => {
        const t = 0.2 + i * 0.25, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t), f = Math.sin(time * 3 + ph + i) * 2.4;
        c.fillStyle = col; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.lineTo(x + 4 + f, y + 7); c.lineTo(x - 4 + f, y + 7); c.closePath(); c.fill();
      });
    },
  });
}

// ================================================================ frame and title
function frame(p) {
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = PAPER; c.beginPath(); c.rect(0, 0, W, H); c.rect(X0, Y0, X1 - X0, Y1 - Y0); c.fill('evenodd');
    c.strokeStyle = LINE; c.lineWidth = 2; c.strokeRect(X0 - 1, Y0 - 1, X1 - X0 + 2, Y1 - Y0 + 2);
    c.lineWidth = 0.8; c.strokeRect(X0 - 12, Y0 - 12, X1 - X0 + 24, Y1 - Y0 + 24);
  }, { t: 0, d: 0.6, reveal: 'fade' });
}
function title(p) {
  // a block of Fez blue across the head of the sheet, with a strip of zellige stars at its foot
  p.group('title', { x: X0, y: Y0, w: X1 - X0, h: TOP - Y0 + 4 }, (c) => {
    c.fillStyle = COBALT_D; c.fillRect(X0, Y0, X1 - X0, TOP - Y0);
    c.fillStyle = COBALT; c.fillRect(X0, Y0, X1 - X0, 10);
  }, { t: 0.2, d: 0.9, reveal: 'fall', ease: 'inOut' });
  const sy = TOP - 22;
  p.group('title', { x: X0, y: sy - 22, w: X1 - X0, h: 48 }, (c) => {
    c.fillStyle = CHALK; c.fillRect(X0, sy - 18, X1 - X0, 36);
    const S = 30;
    for (let k = 0, x = X0 + S / 2; x < X1; x += S, k++) {
      c.fillStyle = [GREEN, COBALT, GOLD, COBALT][k % 4];
      c.beginPath();
      for (let j = 0; j < 16; j++) { const a = (j / 16) * Math.PI * 2, rr = j % 2 ? 7 : 13; c.lineTo(x + Math.cos(a) * rr, sy + Math.sin(a) * rr); }
      c.closePath(); c.fill();
      c.fillStyle = CHALK; c.beginPath(); c.arc(x, sy, 3, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = COBALT_D; c.fillRect(X0, sy + 18, X1 - X0, 4);
  }, { t: 1.0, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // فاس, whole so its letters join, wiped in from the right as it is read
  const ax = 1150, ay = 262;
  p.mark('title', {
    t: 10.6, d: 1.3, reveal: 'wipeL', ease: 'inOut', box: { x: ax - 380, y: Y0 + 4, w: 760, h: TOP - Y0 - 30 },
    draw: (c) => {
      c.font = '400 290px "Lalezar"'; c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillStyle = '#0d2350'; c.fillText('فاس', ax + 10, ay + 9);
      c.fillStyle = CHALK; c.fillText('فاس', ax, ay);
      c.direction = 'ltr';
    },
  });
  p.type('title', 'FEZ', 120, 236, { family: '"Lalezar"', size: 170, color: GOLD, shadow: '#0d2350', sx: 6, sy: 6, align: 'left', track: 0.12, t: 11.8, gap: 0.18, d: 0.7 });
  p.type('title', 'FÈS EL BALI · THE OLD MEDINA', 126, 304, { family: '"Lalezar"', size: 30, color: CHALK, align: 'left', track: 0.22, t: 12.5, gap: 0.025, d: 0.4 });
}
