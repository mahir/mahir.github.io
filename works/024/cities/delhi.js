// Delhi: a Mughal album page. On a lapis page with gold rules, a painting in
// the manner of the imperial workshops: Humayun's Tomb on its arcaded plinth in
// the middle of its charbagh, the garden seen from above, cut in four by water
// channels and each quarter in nine beds of cypress, fruit trees and flowers,
// the walls and gateways standing up from the plan. Beyond the far wall the
// Qutub Minar, the Nila Gumbad, the Yamuna with a boat and, drawn on its far bank, the
// Red Fort and the Jama Masjid (in life on the tomb's side of the river), under a blue sky of ribbon clouds. The painting
// sits in a madder border of gold vines; the name is gilded above it.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, shade, mix, rng } from '../kit.js';

const LAPIS = '#1a2c66', LAPIS_D = '#111d48', LAPIS_L = '#2c4a9c';
const GOLD = '#d4a945', GOLD_D = '#94701f', GOLD_L = '#f1d585';
const MADDER = '#7c1f1c', MADDER_D = '#5a1412';
const SAND = '#b5573a', SAND_D = '#843a27', SAND_L = '#d27c55';
const MARBLE = '#f3ebd9', MARBLE_D = '#cfc2a5';
const GREEN = '#2f5c35', GREEN_L = '#4d8743', GREEN_D = '#1d3d24', CYP = '#1b4329';
const PATH = '#e2cf9e', PATH_D = '#c4ad78', WATER = '#7ea6d8', WATER_D = '#4470ae', WATER_L = '#c9dcf2';
const SKY0 = '#284aa0', SKY1 = '#7f9fd6', SKY2 = '#e9e3c8';
const INK = '#2a1a14', SKIN = '#c58d64', GROUNDC = '#a7a76a', GROUND_D = '#87894f';
const BLOSSOM = ['#f4c7cf', '#ffffff', '#e8475a', '#f2c43e'];

const DEV = '"Rozha One", serif';

export const city = {
  id: 'delhi', name: 'Delhi', wall: '#141c36',
  alt: 'A Mughal miniature on a lapis album page: Humayun\'s Tomb with its white marble dome on an arcaded plinth in the middle of its charbagh, the garden seen from above, cut in four by water channels with fountains and laid out in beds of cypress, fruit trees and flowers, with gardeners, strollers and peacocks, the walls and gateway standing up around it; beyond the far wall the Qutub Minar, the blue dome of the Nila Gumbad, the Yamuna with a boat, the Red Fort and the Jama Masjid under a blue sky of ribbon clouds and flying cranes, all in a madder border of gold vines with the name दिल्ली gilded above and DELHI below',
  google: 'family=Rozha+One',
  fonts: [['400 210px "Rozha One"', 'दिल्ली'], ['400 64px "Rozha One"', 'DELHI']],
  build,
};

// the painting and its border
const PX0 = 150, PX1 = 1450, PY0 = 370, PY1 = 1790;
const BW = 46; // the madder border
// the garden
const GX0 = 200, GX1 = 1400, GY0 = 790, GY1 = 1740, WT = 20;
const CX = 800, CY = 1265, CH = 17; // the main channels' middle and half width
const HZ = 640; // the horizon

function build() {
  const p = new Plate({ paper: LAPIS, seed: 1570 });
  const r = p.r;
  p.stack('page', 'sky', 'far', 'minar', 'garden', 'beds', 'trees', 'walls', 'tomb', 'people', 'live', 'title');
  page(p, r);
  sky(p, r);
  far(p, r);
  minar(p, r);
  garden(p, r);
  beds(p, r);
  trees(p, r);
  walls(p, r);
  tomb(p, r);
  people(p, r);
  live(p, r);
  title(p, r);
  return p;
}

const rect = (c, x, y, w, h) => { c.beginPath(); c.rect(x, y, w, h); };
function path(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }

// ================================================================ the page: rules, the madder border and its vine
function page(p, r) {
  // gold rules round the page, drawn by the pen
  const rules = [[30, 30, W - 60, H - 60, 4], [44, 44, W - 88, H - 88, 1.6], [PX0 - BW - 12, PY0 - BW - 12, PX1 - PX0 + 2 * BW + 24, PY1 - PY0 + 2 * BW + 24, 2]];
  rules.forEach(([x, y, w, h, lw], i) => p.pen('page', [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], GOLD, lw, { t: 0.15 + i * 0.25, d: 1.2, cap: 'square' }));
  // the madder band
  const bx0 = PX0 - BW, by0 = PY0 - BW, bx1 = PX1 + BW, by1 = PY1 + BW;
  p.group('page', { x: bx0 - 4, y: by0 - 4, w: bx1 - bx0 + 8, h: by1 - by0 + 8 }, (c) => {
    c.fillStyle = MADDER; c.beginPath(); c.rect(bx0, by0, bx1 - bx0, by1 - by0); c.rect(PX1, PY0, PX0 - PX1, PY1 - PY0); c.fill('evenodd');
    c.strokeStyle = GOLD; c.lineWidth = 3; c.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);
    c.lineWidth = 2; c.strokeRect(PX0 - 6, PY0 - 6, PX1 - PX0 + 12, PY1 - PY0 + 12);
    c.strokeStyle = LAPIS_D; c.lineWidth = 3; c.strokeRect(PX0 - 2, PY0 - 2, PX1 - PX0 + 4, PY1 - PY0 + 4);
  }, { t: 0.9, d: 0.8, reveal: 'fade' });
  // the vine: a wave round the band, leaves and flowers on alternate sides
  const mid = BW / 2 + 3;
  const loop = [[PX0 - mid, PY0 - mid], [PX1 + mid, PY0 - mid], [PX1 + mid, PY1 + mid], [PX0 - mid, PY1 + mid], [PX0 - mid, PY0 - mid]];
  const wave = [], leaves = [], flowers = [];
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = loop[i], [bx, by] = loop[i + 1];
    const L = Math.hypot(bx - ax, by - ay), tx = (bx - ax) / L, ty = (by - ay) / L, nx = -ty, ny = tx;
    const n = Math.round(L / 62);
    for (let k = 0; k <= n * 12; k++) {
      const u = k / (n * 12), ph = u * n * Math.PI * 2;
      wave.push([ax + tx * L * u + nx * Math.sin(ph) * 10, ay + ty * L * u + ny * Math.sin(ph) * 10]);
    }
    for (let k = 0; k < n * 2; k++) {
      const u = (k + 0.5) / (n * 2), side = k % 2 ? 1 : -1;
      const x = ax + tx * L * u, y = ay + ty * L * u;
      leaves.push([x + nx * side * 4 - tx * 8, y + ny * side * 4 - ty * 8, Math.atan2(ty, tx) + side * 0.8]);
      flowers.push([x + nx * side * 12 + tx * 6, y + ny * side * 12 + ty * 6, (k + i) % 3]);
    }
    s += L;
  }
  p.group('page', { x: PX0 - BW - 4, y: PY0 - BW - 4, w: PX1 - PX0 + 2 * BW + 8, h: PY1 - PY0 + 2 * BW + 8 }, (c) => {
    c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); path(c, wave); c.stroke();
    c.fillStyle = GOLD; for (const [x, y, a] of leaves) { c.beginPath(); c.ellipse(x, y, 8, 3.4, a, 0, Math.PI * 2); c.fill(); }
    for (const [x, y, k] of flowers) {
      c.fillStyle = k === 0 ? '#f2ead8' : k === 1 ? GOLD_L : '#e98a7a';
      c.beginPath(); for (let j = 0; j < 5; j++) { const a = (j / 5) * Math.PI * 2; c.moveTo(x + Math.cos(a) * 4.5 + 2.6, y + Math.sin(a) * 4.5); c.arc(x + Math.cos(a) * 4.5, y + Math.sin(a) * 4.5, 2.6, 0, Math.PI * 2); } c.fill();
      c.fillStyle = GOLD_D; c.beginPath(); c.arc(x, y, 2, 0, Math.PI * 2); c.fill();
    }
  }, { t: 1.4, d: 1.6, reveal: 'iris', ease: 'inOut' });
  // gold flowering sprays scattered on the lapis margins
  const sprays = [];
  for (let i = 0; i < 6; i++) {
    for (const x of [62 + 10, W - 72]) sprays.push([x, PY0 + 60 + i * 240 + r.range(-20, 20), r.range(0.8, 1.05)]);
  }
  const sprayLines = [], sprayDots = [];
  for (const [x, y, s] of sprays) {
    sprayLines.push([[x, y + 40 * s], [x + 2, y + 10 * s], [x - 1, y - 28 * s]]);
    for (let k = 0; k < 3; k++) { const yy = y + (10 - k * 16) * s, side = k % 2 ? 1 : -1; sprayLines.push([[x, yy], [x + side * 9 * s, yy - 9 * s], [x + side * 13 * s, yy - 8 * s]]); sprayDots.push([x + side * 14 * s, yy - 9 * s]); }
    sprayDots.push([x - 1, y - 31 * s]);
  }
  p.strokes('page', sprayLines, GOLD, 1.5, { t: 2.0, d: 1.0, reveal: 'fade' });
  p.group('page', boxOf(sprayDots, 8), (c) => { c.fillStyle = GOLD_L; for (const [x, y] of sprayDots) { c.beginPath(); c.arc(x, y, 3.4, 0, Math.PI * 2); c.fill(); } }, { t: 2.4, d: 0.8, reveal: 'fade' });
}

// ================================================================ the sky: lapis to cream, ribbon clouds
function sky(p, r) {
  p.group('sky', { x: PX0, y: PY0, w: PX1 - PX0, h: HZ + 40 - PY0 }, (c) => {
    const g = c.createLinearGradient(0, PY0, 0, HZ + 30);
    g.addColorStop(0, SKY0); g.addColorStop(0.55, SKY1); g.addColorStop(0.92, SKY2); g.addColorStop(1, '#f1e6c0');
    c.fillStyle = g; c.fillRect(PX0, PY0, PX1 - PX0, HZ + 40 - PY0);
    // a band of gold where the sky meets the earth
    c.strokeStyle = 'rgba(232,192,96,.55)'; c.lineWidth = 3; c.beginPath();
    for (let y = HZ - 40; y < HZ + 10; y += 9) { c.moveTo(PX0, y); c.lineTo(PX1, y); }
    c.stroke();
  }, { t: 1.2, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // ribbon clouds, Chinese in their curl, white with gold edges
  const clouds = [[360, 470, 1.0], [700, 420, 0.8], [1060, 480, 1.1], [1300, 410, 0.7], [560, 560, 0.6], [1240, 570, 0.65]];
  const shapes = clouds.map(([x, y, s]) => {
    const pts = [];
    const n = 5;
    for (let k = 0; k <= 40; k++) {
      const u = k / 40, a = u * Math.PI * 2;
      const lobes = 1 + 0.28 * Math.abs(Math.sin(a * n * 0.5));
      pts.push([x + Math.cos(a) * 90 * s * lobes, y + Math.sin(a) * 22 * s * lobes]);
    }
    const curls = [[x - 90 * s, y + 4, 14 * s], [x + 92 * s, y - 2, 12 * s]];
    return { pts, curls, x, y, s };
  });
  shapes.forEach((cl, i) => {
    p.group('sky', boxOf(cl.pts, 26), (c) => {
      c.fillStyle = '#f7f2e4'; poly(c, cl.pts); c.fill();
      c.strokeStyle = GOLD; c.lineWidth = 2; c.stroke();
      c.strokeStyle = 'rgba(150,170,210,.8)'; c.lineWidth = 1.4; c.beginPath();
      c.moveTo(cl.x - 60 * cl.s, cl.y + 6); c.bezierCurveTo(cl.x - 20 * cl.s, cl.y - 10, cl.x + 20 * cl.s, cl.y + 14, cl.x + 60 * cl.s, cl.y);
      c.stroke();
      c.strokeStyle = GOLD; c.lineWidth = 2;
      for (const [x, y, rr] of cl.curls) { c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 1.6); c.arc(x + rr * 0.3, y - rr * 0.2, rr * 0.5, Math.PI * 1.6, Math.PI * 3); c.stroke(); }
    }, { t: 2.0 + i * 0.12, d: 0.6, reveal: 'wipe', ease: 'inOut' });
  });
}

// ================================================================ beyond the wall: the far bank, the Yamuna, the near bank
function far(p, r) {
  // low blue hills of the ridge
  const hills = [[PX0, HZ + 20]];
  for (let x = PX0; x <= PX1; x += 20) hills.push([x, HZ - 8 - 26 * Math.sin(x * 0.006 + 1) - 14 * Math.sin(x * 0.017)]);
  hills.push([PX1, HZ + 20]);
  p.fill('far', hills, '#9cb2b8', { t: 2.2, d: 0.7, reveal: 'rise' });
  // the far bank: the Red Fort's ramparts and the Jama Masjid among trees
  const farTrees = [];
  for (let x = PX0 + 10; x < PX1; x += r.range(16, 30)) farTrees.push([x, HZ + 26 + r.range(-4, 4), r.range(8, 14)]);
  p.group('far', { x: PX0, y: HZ - 120, w: PX1 - PX0, h: 180 }, (c) => {
    c.fillStyle = '#8fa56c'; c.fillRect(PX0, HZ + 8, PX1 - PX0, 34);
    c.fillStyle = '#5f7f4c'; c.beginPath(); for (const [x, y, s] of farTrees) { c.moveTo(x + s, y); c.arc(x, y, s, Math.PI, 0); } c.fill();
    // the Red Fort: battlemented red walls with round bastions and the Lahori Gate's pavilions
    const fx0 = 860, fx1 = 1110, fy = HZ + 30;
    c.fillStyle = SAND; c.fillRect(fx0, fy - 34, fx1 - fx0, 34);
    for (let x = fx0; x < fx1; x += 9) c.fillRect(x, fy - 39, 5, 5);
    for (const x of [fx0, fx0 + 80, fx1 - 80, fx1]) { c.fillStyle = SAND_L; c.beginPath(); c.ellipse(x, fy - 20, 11, 22, 0, Math.PI, 0); c.lineTo(x + 11, fy); c.lineTo(x - 11, fy); c.closePath(); c.fill(); c.fillStyle = MARBLE; c.beginPath(); c.arc(x, fy - 42, 7, Math.PI, 0); c.fill(); }
    const gx = (fx0 + fx1) / 2;
    c.fillStyle = SAND_L; c.fillRect(gx - 26, fy - 66, 52, 66);
    c.fillStyle = SAND_D; c.beginPath(); c.moveTo(gx - 9, fy); c.lineTo(gx - 9, fy - 24); c.quadraticCurveTo(gx, fy - 38, gx + 9, fy - 24); c.lineTo(gx + 9, fy); c.fill();
    c.fillStyle = MARBLE; for (let k = -2; k <= 2; k++) { c.beginPath(); c.arc(gx + k * 10, fy - 68, 4.5, Math.PI, 0); c.fill(); }
    c.fillStyle = MARBLE; c.beginPath(); c.arc(gx - 22, fy - 76, 7, Math.PI, 0); c.arc(gx + 22, fy - 76, 7, Math.PI, 0); c.fill();
    c.strokeStyle = INK; c.lineWidth = 0.8; c.strokeRect(fx0, fy - 34, fx1 - fx0, 34);
    // the Jama Masjid: three white domes striped in black, two tall minarets, the red front
    const jx = 1250, jy = HZ + 30;
    c.fillStyle = SAND; c.fillRect(jx - 90, jy - 40, 180, 40);
    c.fillStyle = SAND_L; c.fillRect(jx - 30, jy - 62, 60, 62);
    c.fillStyle = MARBLE; c.beginPath(); c.moveTo(jx - 14, jy); c.lineTo(jx - 14, jy - 34); c.quadraticCurveTo(jx, jy - 54, jx + 14, jy - 34); c.lineTo(jx + 14, jy); c.fill();
    for (const [dx, rr] of [[-56, 20], [0, 30], [56, 20]]) {
      c.fillStyle = MARBLE; c.beginPath(); c.moveTo(jx + dx - rr * 0.8, jy - 62); c.bezierCurveTo(jx + dx - rr * 1.25, jy - 62 - rr * 0.9, jx + dx - rr * 0.5, jy - 62 - rr * 1.5, jx + dx, jy - 62 - rr * 1.6); c.bezierCurveTo(jx + dx + rr * 0.5, jy - 62 - rr * 1.5, jx + dx + rr * 1.25, jy - 62 - rr * 0.9, jx + dx + rr * 0.8, jy - 62); c.closePath(); c.fill();
      c.save(); c.clip(); c.strokeStyle = '#6a5a52'; c.lineWidth = 1; c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(jx + dx + k * rr * 0.3, jy - 62); c.quadraticCurveTo(jx + dx + k * rr * 0.45, jy - 62 - rr, jx + dx, jy - 62 - rr * 1.6); } c.stroke(); c.restore();
      c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(jx + dx, jy - 62 - rr * 1.6); c.lineTo(jx + dx, jy - 72 - rr * 1.6); c.stroke();
    }
    for (const dx of [-100, 100]) {
      c.fillStyle = MARBLE; c.fillRect(jx + dx - 5, jy - 118, 10, 118);
      c.fillStyle = SAND; for (let y = jy - 110; y < jy; y += 16) c.fillRect(jx + dx - 5, y, 10, 7);
      c.fillStyle = MARBLE; c.fillRect(jx + dx - 8, jy - 84, 16, 3); c.fillRect(jx + dx - 8, jy - 52, 16, 3);
      c.beginPath(); c.arc(jx + dx, jy - 120, 8, Math.PI, 0); c.fill();
    }
  }, { t: 2.6, d: 0.9, reveal: 'rise', ease: 'out' });
  // the Yamuna, silver lines on blue
  const ry0 = HZ + 42, ry1 = HZ + 84;
  const ripples = [];
  for (let y = ry0 + 6; y < ry1 - 4; y += 7) for (let x = PX0 + r.range(0, 40); x < PX1; x += r.range(40, 80)) ripples.push([[x, y], [x + 7, y - 2.4], [x + 14, y], [x + 21, y - 2.4], [x + 28, y]]);
  p.group('far', { x: PX0, y: ry0 - 2, w: PX1 - PX0, h: ry1 - ry0 + 4 }, (c) => {
    c.fillStyle = WATER; c.fillRect(PX0, ry0, PX1 - PX0, ry1 - ry0);
    c.strokeStyle = WATER_L; c.lineWidth = 1.4; c.beginPath(); for (const l of ripples) path(c, l); c.stroke();
  }, { t: 3.0, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // the near bank: fields and groves up to the garden wall, the Nila Gumbad's blue dome
  const grove = [];
  for (let x = PX0 + 6; x < PX1; x += r.range(14, 26)) grove.push([x, ry1 + r.range(18, 40), r.range(9, 16), r() < 0.25]);
  p.group('far', { x: PX0, y: ry1 - 30, w: PX1 - PX0, h: PY1 - ry1 + 30 }, (c) => {
    c.fillStyle = GROUNDC; c.fillRect(PX0, ry1, PX1 - PX0, PY1 - ry1);
    c.fillStyle = GROUND_D; c.beginPath(); for (let y = ry1 + 8; y < PY1; y += 22) for (let x = PX0 + ((y / 22) % 2) * 11; x < PX1; x += 22) { c.moveTo(x, y); c.lineTo(x + 4, y - 6); c.lineTo(x + 8, y); } c.fill();
    for (const [x, y, s, cyp] of grove) {
      c.fillStyle = cyp ? CYP : '#46703d';
      c.beginPath(); if (cyp) c.ellipse(x, y - s, s * 0.35, s * 1.2, 0, 0, Math.PI * 2); else c.arc(x, y - s * 0.6, s * 0.8, 0, Math.PI * 2); c.fill();
    }
    // the Nila Gumbad
    const nx = 1330, ny = ry1 + 52;
    c.fillStyle = SAND_L; c.fillRect(nx - 30, ny - 30, 60, 30);
    c.fillStyle = SAND_D; c.beginPath(); c.moveTo(nx - 9, ny); c.lineTo(nx - 9, ny - 16); c.quadraticCurveTo(nx, ny - 26, nx + 9, ny - 16); c.lineTo(nx + 9, ny); c.fill();
    c.fillStyle = '#2f73b8'; c.beginPath(); c.moveTo(nx - 22, ny - 30); c.bezierCurveTo(nx - 24, ny - 62, nx - 4, ny - 70, nx, ny - 72); c.bezierCurveTo(nx + 4, ny - 70, nx + 24, ny - 62, nx + 22, ny - 30); c.closePath(); c.fill();
    c.fillStyle = '#7fb4e8'; c.beginPath(); c.ellipse(nx - 8, ny - 52, 4, 10, 0.3, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(nx, ny - 72); c.lineTo(nx, ny - 84); c.stroke();
  }, { t: 3.3, d: 0.8, reveal: 'fall', ease: 'inOut' });
}

// ================================================================ the Qutub Minar, rising past the clouds
function minar(p, r) {
  const x = 330, base = HZ + 110, top = 400;
  const stories = [[base, 0.27, SAND], [0.27, 0.48, SAND], [0.48, 0.66, SAND_L], [0.66, 0.82, MARBLE], [0.82, 0.93, SAND_L]];
  const h = base - top;
  const wAt = (f) => lerp(36, 15, f);
  // the ruined screen of arches at its foot
  p.group('minar', { x: x + 30, y: base - 120, w: 230, h: 124 }, (c) => {
    c.fillStyle = MARBLE_D; c.fillRect(x + 50, base - 70, 200, 70);
    c.fillStyle = '#d6c7a5'; c.beginPath(); c.moveTo(x + 110, base - 70); c.lineTo(x + 110, base - 112); c.quadraticCurveTo(x + 150, base - 138, x + 190, base - 112); c.lineTo(x + 190, base - 70); c.fill();
    c.fillStyle = '#7c6a50'; c.beginPath(); c.moveTo(x + 128, base); c.lineTo(x + 128, base - 70); c.quadraticCurveTo(x + 150, base - 104, x + 172, base - 70); c.lineTo(x + 172, base); c.fill();
    c.beginPath(); for (const ax of [x + 72, x + 220]) { c.moveTo(ax - 12, base); c.lineTo(ax - 12, base - 36); c.quadraticCurveTo(ax, base - 52, ax + 12, base - 36); c.lineTo(ax + 12, base); } c.fill();
    c.strokeStyle = INK; c.lineWidth = 0.8; c.strokeRect(x + 50, base - 70, 200, 70);
  }, { t: 3.0, d: 0.7, reveal: 'rise' });
  p.group('minar', { x: x - 60, y: top - 50, w: 120, h: h + 54 }, (c) => {
    let f0 = 0;
    stories.forEach(([a, b, col], i) => {
      const fa = i === 0 ? 0 : a, fb = i === 0 ? b : b;
      const ya = base - fa * h, yb = base - fb * h, wa = wAt(fa), wb = wAt(fb);
      c.fillStyle = col; poly(c, [[x - wa, ya], [x + wa, ya], [x + wb, yb], [x - wb, yb]]); c.fill();
      // the flutes: alternately round and angular
      c.strokeStyle = shade(col, 0.72); c.lineWidth = 1.4; c.beginPath();
      const n = 9;
      for (let k = 1; k < n; k++) { const u = k / n * 2 - 1; c.moveTo(x + u * wa * 0.96, ya); c.lineTo(x + u * wb * 0.96, yb); }
      c.stroke();
      c.fillStyle = shade(col, 0.82); poly(c, [[x + wa * 0.35, ya], [x + wa, ya], [x + wb, yb], [x + wb * 0.35, yb]]); c.fill();
      // bands of inscription
      c.fillStyle = shade(col, 0.66); for (const g of [0.25, 0.55]) { const yy = lerp(ya, yb, g), ww = lerp(wa, wb, g); c.fillRect(x - ww, yy, ww * 2, 3); }
      // the balcony on its brackets
      c.fillStyle = SAND_D; poly(c, [[x - wb - 10, yb - 4], [x + wb + 10, yb - 4], [x + wb, yb + 9], [x - wb, yb + 9]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); for (let k = -wb - 8; k <= wb + 8; k += 4) { c.moveTo(x + k, yb - 4); c.lineTo(x + k, yb - 11); } c.moveTo(x - wb - 10, yb - 11); c.lineTo(x + wb + 10, yb - 11); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 0.9; poly(c, [[x - wa, ya], [x + wa, ya], [x + wb, yb], [x - wb, yb]]); c.stroke();
      f0 = fb;
    });
    // the little cupola at the top
    const yt = base - 0.93 * h, wt = wAt(0.93);
    c.fillStyle = MARBLE; c.fillRect(x - wt * 0.7, yt - 30, wt * 1.4, 30);
    c.fillStyle = INK; c.fillRect(x - 3, yt - 24, 6, 16);
    c.fillStyle = MARBLE; c.beginPath(); c.arc(x, yt - 30, wt * 0.8, Math.PI, 0); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(x, yt - 30 - wt * 0.8); c.lineTo(x, yt - 52); c.stroke();
  }, { t: 3.4, d: 1.6, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the garden: walls' plan, lawns, channels, paths
// the nine beds of each quarter
const QX = [[GX0 + WT, CX - CH], [CX + CH, GX1 - WT]], QY = [[GY0 + WT, CY - CH], [CY + CH, GY1 - WT]];
const PW = 16; // a path between beds
function bedsOf() {
  const out = [];
  for (const [x0, x1] of QX) for (const [y0, y1] of QY) {
    const cw = (x1 - x0 - 2 * PW) / 3, chh = (y1 - y0 - 2 * PW) / 3;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const bx = x0 + i * (cw + PW), by = y0 + j * (chh + PW);
      out.push({ x: bx, y: by, w: cw, h: chh, d: Math.hypot(bx + cw / 2 - CX, by + chh / 2 - CY) });
    }
  }
  return out.sort((a, b) => a.d - b.d);
}
const BEDS = bedsOf();
// where the tomb stands, so no tree is planted behind it
const TOMB = { x0: 470, x1: 1130, y0: 1060, y1: 1450 };
const behindTomb = (x, y) => x > TOMB.x0 && x < TOMB.x1 && y > TOMB.y0 && y < TOMB.y1 || (Math.abs(x - CX) < 150 && y > 840 && y < TOMB.y1);

function garden(p, r) {
  // the ground inside the walls: paths of sand
  p.group('garden', { x: GX0, y: GY0, w: GX1 - GX0, h: GY1 - GY0 }, (c) => {
    c.fillStyle = PATH; c.fillRect(GX0, GY0, GX1 - GX0, GY1 - GY0);
  }, { t: 3.8, d: 0.8, reveal: 'iris', ease: 'inOut' });
  // the four main channels, flowing out from the middle, with marble edges
  const chan = (x, y, w, h, reveal, t) => p.group('garden', { x: x - 8, y: y - 8, w: w + 16, h: h + 16 }, (c) => {
    c.fillStyle = MARBLE; c.fillRect(x - 6, y - 6, w + 12, h + 12);
    c.fillStyle = WATER_D; c.fillRect(x, y, w, h);
    c.strokeStyle = WATER_L; c.lineWidth = 1.6; c.beginPath();
    if (w > h) for (let yy = y + 6; yy < y + h; yy += 8) for (let xx = x + ((yy / 8) % 2) * 12; xx < x + w - 20; xx += 24) { c.moveTo(xx, yy); c.quadraticCurveTo(xx + 6, yy - 4, xx + 12, yy); }
    else for (let xx = x + 6; xx < x + w; xx += 9) for (let yy = y + ((xx / 9) % 2) * 10; yy < y + h - 14; yy += 22) { c.moveTo(xx, yy); c.quadraticCurveTo(xx + 3.5, yy + 5, xx, yy + 10); }
    c.stroke();
  }, { t, d: 0.9, reveal, ease: 'inOut' });
  chan(GX0 + WT, CY - CH, CX - GX0 - WT, 2 * CH, 'wipeL', 4.4);
  chan(CX, CY - CH, GX1 - WT - CX, 2 * CH, 'wipe', 4.4);
  chan(CX - CH, GY0 + WT, 2 * CH, CY - GY0 - WT, 'rise', 4.5);
  chan(CX - CH, CY, 2 * CH, GY1 - WT - CY, 'fall', 4.5);
  // square pools where the channels cross the quarters' middle paths
  const pools = [[CX, 1600], [CX, 920], [400, CY], [1200, CY]];
  p.group('garden', boxOf(pools.map(([x, y]) => [x, y]), 50), (c) => {
    for (const [x, y] of pools) {
      c.fillStyle = MARBLE; c.fillRect(x - 40, y - 40, 80, 80);
      c.fillStyle = WATER_D; c.fillRect(x - 32, y - 32, 64, 64);
      c.strokeStyle = MARBLE_D; c.lineWidth = 1.4; c.strokeRect(x - 40, y - 40, 80, 80);
      c.strokeStyle = WATER_L; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, 18, 0, Math.PI * 2); c.moveTo(x + 9, y); c.arc(x, y, 9, 0, Math.PI * 2); c.stroke();
      c.fillStyle = MARBLE; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill();
    }
  }, { t: 5.0, d: 0.6, reveal: 'pop', ease: 'back' });
}

// ================================================================ the beds: lawns edged with flowers
function beds(p, r) {
  const groups = [[], [], [], []];
  BEDS.forEach((b, i) => groups[Math.min(3, Math.floor(i / 9))].push(b));
  groups.forEach((set, gi) => {
    // flowers as tiny squares along each bed's edge, and short strokes of grass inside
    const dots = [[], [], [], []], grass = [];
    for (const b of set) {
      const inset = 6, step = 7;
      for (let x = b.x + inset; x < b.x + b.w - inset; x += step) { dots[r.int(0, 3)].push([x, b.y + inset]); dots[r.int(0, 3)].push([x, b.y + b.h - inset]); }
      for (let y = b.y + inset + step; y < b.y + b.h - inset; y += step) { dots[r.int(0, 3)].push([b.x + inset, y]); dots[r.int(0, 3)].push([b.x + b.w - inset, y]); }
      for (let k = 0; k < (b.w * b.h) / 260; k++) { const x = r.range(b.x + 14, b.x + b.w - 14), y = r.range(b.y + 16, b.y + b.h - 10); grass.push([[x, y], [x + r.range(-2, 2), y - r.range(5, 9)]]); }
    }
    const box = boxOf(set.flatMap((b) => [[b.x, b.y], [b.x + b.w, b.y + b.h]]), 4);
    p.group('beds', box, (c) => {
      for (const b of set) {
        c.fillStyle = GREEN; c.fillRect(b.x, b.y, b.w, b.h);
        c.strokeStyle = PATH_D; c.lineWidth = 1.2; c.strokeRect(b.x, b.y, b.w, b.h);
      }
      c.strokeStyle = GREEN_L; c.lineWidth = 1.3; c.beginPath(); for (const g of grass) path(c, g); c.stroke();
      BLOSSOM.forEach((col, k) => { c.fillStyle = col; c.beginPath(); for (const [x, y] of dots[k]) c.rect(x - 1.8, y - 1.8, 3.6, 3.6); c.fill(); });
    }, { t: 5.2 + gi * 0.35, d: 0.7, reveal: 'iris', ease: 'out' });
  });
}

// ================================================================ the trees: cypress and fruit trees in blossom, set in the beds
function trees(p, r) {
  const list = [];
  for (const b of BEDS) {
    // a cypress at each corner, a fruit tree between, a big plane in the middle of some
    const pts = [[b.x + 16, b.y + 50, 'c'], [b.x + b.w - 16, b.y + 50, 'c'], [b.x + 16, b.y + b.h - 6, 'c'], [b.x + b.w - 16, b.y + b.h - 6, 'c'],
      [b.x + b.w / 2, b.y + b.h / 2 + 30, r() < 0.35 ? 'p' : 'f'], [b.x + b.w * 0.3, b.y + 40, 'f'], [b.x + b.w * 0.7, b.y + 40, 'f'],
      [b.x + b.w * 0.27, b.y + b.h - 18, 's'], [b.x + b.w * 0.73, b.y + b.h - 18, 's'], [b.x + b.w * 0.5, b.y + 30, 's']];
    for (const [x, y, k] of pts) {
      if (behindTomb(x, y)) continue;
      list.push({ x, y, k, s: k === 's' ? r.range(0.8, 1) : r.range(1.25, 1.5), d: b.d, bl: Array.from({ length: 9 }, () => [r.range(-1, 1), r.range(-1, 1), r.int(0, 3)]) });
    }
  }
  list.sort((a, b) => a.y - b.y);
  // planted in four rings out from the tomb, each ring drawn back to front
  const rings = [[], [], [], []];
  const ds = list.map((t) => t.d).sort((a, b) => a - b), q = (f) => ds[Math.floor(f * (ds.length - 1))];
  const cut = [q(0.25), q(0.5), q(0.75), Infinity];
  for (const t of list) rings[cut.findIndex((c) => t.d <= c)].push(t);
  rings.forEach((set, i) => {
    const box = boxOf(set.flatMap((t) => [[t.x - 44, t.y - 100], [t.x + 44, t.y + 10]]), 4);
    p.group('trees', box, (c) => {
      for (const t of set) {
        const { x, y, s } = t;
        // a shadow on the grass
        c.fillStyle = 'rgba(16,40,22,.45)'; c.beginPath(); c.ellipse(x + 4, y, 12 * s, 4 * s, 0, 0, Math.PI * 2); c.fill();
        if (t.k === 'c') {
          c.fillStyle = CYP; c.beginPath(); c.moveTo(x, y - 62 * s); c.bezierCurveTo(x + 11 * s, y - 40 * s, x + 10 * s, y - 10 * s, x, y); c.bezierCurveTo(x - 10 * s, y - 10 * s, x - 11 * s, y - 40 * s, x, y - 62 * s); c.fill();
          c.strokeStyle = '#3f7a4a'; c.lineWidth = 1.3; c.beginPath(); for (let k = 1; k < 7; k++) { const yy = y - 6 * s - k * 8 * s, ww = 6 * s * Math.sin((k / 7) * Math.PI) + 2; c.moveTo(x - ww, yy + 3); c.lineTo(x, yy); } c.stroke();
        } else if (t.k === 's') {
          c.fillStyle = '#3f7a3e'; c.beginPath(); c.ellipse(x, y - 7 * s, 13 * s, 8 * s, 0, 0, Math.PI * 2); c.fill();
          for (const [u, v, k] of t.bl) { c.fillStyle = BLOSSOM[k]; c.beginPath(); c.arc(x + u * 10 * s, y - 8 * s + v * 5 * s, 2.2, 0, Math.PI * 2); c.fill(); }
        } else {
          const R = (t.k === 'p' ? 24 : 16) * s, cy = y - (t.k === 'p' ? 34 : 24) * s;
          c.fillStyle = '#6a4630'; c.fillRect(x - 2, cy, 4, y - cy);
          c.fillStyle = t.k === 'p' ? '#2a5b30' : '#3c7040'; c.beginPath(); c.arc(x, cy, R, 0, Math.PI * 2); c.fill();
          c.fillStyle = t.k === 'p' ? '#3f7a3e' : '#5a9450'; c.beginPath(); c.arc(x - R * 0.25, cy - R * 0.25, R * 0.62, 0, Math.PI * 2); c.fill();
          if (t.k === 'f') for (const [u, v, k] of t.bl) { c.fillStyle = BLOSSOM[k]; c.beginPath(); c.arc(x + u * R * 0.8, cy + v * R * 0.8, 2.3, 0, Math.PI * 2); c.fill(); }
          c.strokeStyle = INK; c.lineWidth = 0.6; c.beginPath(); c.arc(x, cy, R, 0, Math.PI * 2); c.stroke();
        }
      }
    }, { t: 5.9 + i * 0.4, d: 0.8, reveal: 'pop', ease: 'out' });
  });
}

// ================================================================ the walls stand up from the plan: towers, the far wall, the gateway
function walls(p, r) {
  // the wall in plan: a red band edged in white
  p.group('walls', { x: GX0 - 4, y: GY0 - 4, w: GX1 - GX0 + 8, h: GY1 - GY0 + 8 }, (c) => {
    c.fillStyle = SAND; c.beginPath(); c.rect(GX0, GY0, GX1 - GX0, GY1 - GY0); c.rect(GX1 - WT, GY0 + WT, -(GX1 - GX0 - 2 * WT), GY1 - GY0 - 2 * WT); c.fill('evenodd');
    c.strokeStyle = MARBLE; c.lineWidth = 2; c.strokeRect(GX0 + 3, GY0 + 3, GX1 - GX0 - 6, GY1 - GY0 - 6);
    c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(GX0, GY0, GX1 - GX0, GY1 - GY0); c.strokeRect(GX0 + WT, GY0 + WT, GX1 - GX0 - 2 * WT, GY1 - GY0 - 2 * WT);
    // niches along it
    c.fillStyle = SAND_D; c.beginPath();
    for (let x = GX0 + 40; x < GX1 - 30; x += 30) { c.rect(x, GY0 + 6, 12, 8); c.rect(x, GY1 - 14, 12, 8); }
    for (let y = GY0 + 40; y < GY1 - 30; y += 30) { c.rect(GX0 + 6, y, 8, 12); c.rect(GX1 - 14, y, 8, 12); }
    c.fill();
  }, { t: 4.0, d: 1.0, reveal: 'iris', ease: 'inOut' });
  // the far wall, upright: battlements along its top
  p.group('walls', { x: GX0, y: GY0 - 40, w: GX1 - GX0, h: 44 }, (c) => {
    c.fillStyle = SAND; c.fillRect(GX0, GY0 - 26, GX1 - GX0, 28);
    c.fillStyle = SAND_D; c.beginPath(); for (let x = GX0 + 10; x < GX1 - 10; x += 24) { c.moveTo(x, GY0 - 2); c.lineTo(x, GY0 - 16); c.quadraticCurveTo(x + 7, GY0 - 24, x + 14, GY0 - 16); c.lineTo(x + 14, GY0 - 2); } c.fill();
    c.fillStyle = SAND_L; for (let x = GX0; x < GX1; x += 14) c.fillRect(x, GY0 - 34, 8, 8);
    c.strokeStyle = INK; c.lineWidth = 0.8; c.strokeRect(GX0, GY0 - 26, GX1 - GX0, 28);
  }, { t: 4.6, d: 0.7, reveal: 'rise', ease: 'out' });
  // a domed tower at each corner and halfway down the sides
  const kiosk = (c, x, y, s) => {
    c.fillStyle = SAND; c.fillRect(x - 16 * s, y - 40 * s, 32 * s, 40 * s);
    c.fillStyle = SAND_D; c.beginPath(); c.moveTo(x - 7 * s, y); c.lineTo(x - 7 * s, y - 22 * s); c.quadraticCurveTo(x, y - 32 * s, x + 7 * s, y - 22 * s); c.lineTo(x + 7 * s, y); c.fill();
    c.fillStyle = MARBLE; c.fillRect(x - 20 * s, y - 46 * s, 40 * s, 6 * s);
    c.fillStyle = SAND_L; c.fillRect(x - 15 * s, y - 64 * s, 4 * s, 18 * s); c.fillRect(x + 11 * s, y - 64 * s, 4 * s, 18 * s);
    c.fillStyle = MARBLE; c.beginPath(); c.moveTo(x - 17 * s, y - 64 * s); c.bezierCurveTo(x - 18 * s, y - 84 * s, x - 3 * s, y - 88 * s, x, y - 92 * s); c.bezierCurveTo(x + 3 * s, y - 88 * s, x + 18 * s, y - 84 * s, x + 17 * s, y - 64 * s); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke(); c.strokeRect(x - 16 * s, y - 40 * s, 32 * s, 40 * s);
    c.strokeStyle = GOLD; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y - 92 * s); c.lineTo(x, y - 100 * s); c.stroke();
  };
  const towers = [[GX0 + 10, GY0 + 10, 1], [GX1 - 10, GY0 + 10, 1], [GX0 + 10, GY1 + 4, 1.1], [GX1 - 10, GY1 + 4, 1.1], [GX0 + 10, CY + 10, 0.9], [GX1 - 10, CY + 10, 0.9]];
  towers.forEach(([x, y, s], i) => p.group('walls', { x: x - 26 * s, y: y - 106 * s, w: 52 * s, h: 110 * s }, (c) => kiosk(c, x, y, s), { t: 4.9 + i * 0.1, d: 0.5, reveal: 'rise', ease: 'out' }));
  // the west gateway, standing up on the near wall: a tall arch, two stories, kiosks on its roof
  const gx = CX, gy = GY1 + 10;
  p.group('walls', { x: gx - 130, y: gy - 230, w: 260, h: 236 }, (c) => {
    c.fillStyle = SAND; c.fillRect(gx - 110, gy - 150, 220, 150);
    c.fillStyle = SAND_L; c.fillRect(gx - 48, gy - 172, 96, 172);
    c.fillStyle = MARBLE; c.fillRect(gx - 40, gy - 160, 80, 4); c.fillRect(gx - 44, gy - 166, 4, 166); c.fillRect(gx + 40, gy - 166, 4, 166);
    c.fillStyle = '#4a2a20'; c.beginPath(); c.moveTo(gx - 28, gy); c.lineTo(gx - 28, gy - 90); c.quadraticCurveTo(gx - 26, gy - 128, gx, gy - 140); c.quadraticCurveTo(gx + 26, gy - 128, gx + 28, gy - 90); c.lineTo(gx + 28, gy); c.fill();
    c.strokeStyle = MARBLE; c.lineWidth = 2.4; c.stroke();
    c.fillStyle = SAND_D; for (const dx of [-82, 82]) for (const dy of [0, -70]) { c.beginPath(); c.moveTo(gx + dx - 14, gy + dy - 8); c.lineTo(gx + dx - 14, gy + dy - 40); c.quadraticCurveTo(gx + dx, gy + dy - 58, gx + dx + 14, gy + dy - 40); c.lineTo(gx + dx + 14, gy + dy - 8); c.fill(); }
    c.strokeStyle = MARBLE; c.lineWidth = 1.6; c.beginPath(); c.moveTo(gx - 110, gy - 75); c.lineTo(gx - 48, gy - 75); c.moveTo(gx + 48, gy - 75); c.lineTo(gx + 110, gy - 75); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(gx - 110, gy - 150, 220, 150); c.strokeRect(gx - 48, gy - 172, 96, 172);
    // its parapet and roof kiosks
    c.fillStyle = MARBLE; for (let x = gx - 46; x < gx + 46; x += 10) c.fillRect(x, gy - 178, 6, 6);
    kiosk(c, gx - 90, gy - 150, 0.6); kiosk(c, gx + 90, gy - 150, 0.6); kiosk(c, gx, gy - 172, 0.55);
  }, { t: 5.4, d: 0.9, reveal: 'rise', ease: 'out' });
}

// ================================================================ Humayun's Tomb: the plinth's arcade, the facade, the chhatris, the dome
function tomb(p, r) {
  const x0 = 480, x1 = 1120, py = 1440, ph = 104; // the plinth, seen from the front
  // the terrace on top, seen from above, and the arcade of cells on its face
  p.group('tomb', { x: x0 - 6, y: py - ph - 50, w: x1 - x0 + 12, h: ph + 56 }, (c) => {
    c.fillStyle = MARBLE_D; c.beginPath(); c.moveTo(x0 + 30, py - ph - 40); c.lineTo(x1 - 30, py - ph - 40); c.lineTo(x1, py - ph); c.lineTo(x0, py - ph); c.closePath(); c.fill();
    c.strokeStyle = SAND; c.lineWidth = 1.2; c.beginPath(); for (let k = 1; k < 6; k++) { const y = py - ph - k * 7; const inset = 30 * (k * 7) / 40; c.moveTo(x0 + inset, y); c.lineTo(x1 - inset, y); } c.stroke();
    c.fillStyle = SAND; c.fillRect(x0, py - ph, x1 - x0, ph);
    const n = 17, cw = (x1 - x0) / n;
    c.fillStyle = MARBLE; for (let k = 0; k <= n; k++) c.fillRect(x0 + k * cw - 2, py - ph, 4, ph);
    c.fillRect(x0, py - ph, x1 - x0, 5); c.fillRect(x0, py - 6, x1 - x0, 6);
    for (let k = 0; k < n; k++) {
      const ax = x0 + (k + 0.5) * cw, big = k === 8;
      c.fillStyle = MARBLE; c.fillRect(ax - cw * 0.36, py - ph + 14, cw * 0.72, ph - 20);
      c.fillStyle = big ? '#2e1a14' : '#5a2e22';
      c.beginPath(); c.moveTo(ax - cw * 0.26, py - 6); c.lineTo(ax - cw * 0.26, py - ph * 0.62); c.quadraticCurveTo(ax - cw * 0.24, py - ph * 0.82, ax, py - ph * 0.86); c.quadraticCurveTo(ax + cw * 0.24, py - ph * 0.82, ax + cw * 0.26, py - ph * 0.62); c.lineTo(ax + cw * 0.26, py - 6); c.fill();
    }
    c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x0, py - ph, x1 - x0, ph);
    // the steps up the middle
    c.fillStyle = MARBLE; c.fillRect(CX - 26, py - 4, 52, 12);
  }, { t: 7.0, d: 0.9, reveal: 'rise', ease: 'out' });
  // the facade: red sandstone framed in white marble, a great arch, smaller arches on two stories, chamfered wings
  const fy = py - ph - 34, fx0 = 590, fx1 = 1010, fh = 196, ch = 46; // ch: the chamfered corners
  p.group('tomb', { x: fx0 - 10, y: fy - fh - 30, w: fx1 - fx0 + 20, h: fh + 36 }, (c) => {
    // the angled corners, darker
    c.fillStyle = SAND_D; c.fillRect(fx0, fy - fh, ch, fh); c.fillRect(fx1 - ch, fy - fh, ch, fh);
    c.fillStyle = SAND; c.fillRect(fx0 + ch, fy - fh, fx1 - fx0 - 2 * ch, fh);
    // white marble frames
    c.strokeStyle = MARBLE; c.lineWidth = 4;
    c.strokeRect(fx0 + ch + 6, fy - fh + 6, fx1 - fx0 - 2 * ch - 12, fh - 6);
    // the great central arch in its pishtaq
    const pw = 150;
    c.fillStyle = SAND_L; c.fillRect(CX - pw / 2, fy - fh - 14, pw, fh + 14);
    c.strokeStyle = MARBLE; c.lineWidth = 5; c.strokeRect(CX - pw / 2 + 6, fy - fh - 8, pw - 12, fh + 8);
    c.fillStyle = '#3a1f18'; c.beginPath(); c.moveTo(CX - 46, fy); c.lineTo(CX - 46, fy - 110); c.quadraticCurveTo(CX - 44, fy - 160, CX, fy - 172); c.quadraticCurveTo(CX + 44, fy - 160, CX + 46, fy - 110); c.lineTo(CX + 46, fy); c.fill();
    c.strokeStyle = MARBLE; c.lineWidth = 3; c.stroke();
    // a lattice screen in the arch
    c.strokeStyle = 'rgba(243,235,217,.55)'; c.lineWidth = 1; c.beginPath();
    for (let k = -40; k <= 40; k += 8) { c.moveTo(CX + k, fy - 2); c.lineTo(CX + k, fy - 96); }
    for (let y = fy - 8; y > fy - 98; y -= 8) { c.moveTo(CX - 44, y); c.lineTo(CX + 44, y); }
    c.stroke();
    // marble star-inlay in the spandrels
    c.fillStyle = MARBLE; for (const dx of [-56, 56]) { c.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; c.lineTo(CX + dx + Math.cos(a) * 8, fy - 176 + Math.sin(a) * 8); } c.fill(); }
    // smaller arches: two stories on each wing
    c.fillStyle = '#4a2a20';
    for (const sx of [-1, 1]) for (const dy of [0, -96]) {
      const ax = CX + sx * 128;
      c.beginPath(); c.moveTo(ax - 22, fy + dy - 6); c.lineTo(ax - 22, fy + dy - 52); c.quadraticCurveTo(ax - 20, fy + dy - 76, ax, fy + dy - 84); c.quadraticCurveTo(ax + 20, fy + dy - 76, ax + 22, fy + dy - 52); c.lineTo(ax + 22, fy + dy - 6); c.fill();
      c.strokeStyle = MARBLE; c.lineWidth = 2; c.stroke();
      const bx = fx0 + ch / 2 + (sx > 0 ? fx1 - fx0 - ch : 0);
      c.beginPath(); c.moveTo(bx - 12, fy + dy - 8); c.lineTo(bx - 12, fy + dy - 48); c.quadraticCurveTo(bx, fy + dy - 70, bx + 12, fy + dy - 48); c.lineTo(bx + 12, fy + dy - 8); c.fill(); c.stroke();
    }
    c.strokeStyle = INK; c.lineWidth = 1.1; c.strokeRect(fx0, fy - fh, fx1 - fx0, fh); c.strokeRect(CX - pw / 2, fy - fh - 14, pw, fh + 14);
    // the parapet
    c.fillStyle = MARBLE; c.fillRect(fx0, fy - fh - 4, fx1 - fx0, 5);
    c.fillStyle = SAND_L; for (let x = fx0 + 4; x < fx1; x += 12) c.fillRect(x, fy - fh - 12, 7, 8);
  }, { t: 7.5, d: 1.0, reveal: 'rise', ease: 'out' });
  // the drum and the double dome of white marble, its brass finial
  const dy = fy - fh - 14, dw = 116;
  p.group('tomb', { x: CX - dw - 20, y: dy - 300, w: 2 * dw + 40, h: 306 }, (c) => {
    c.fillStyle = MARBLE_D; c.fillRect(CX - dw * 0.8, dy - 70, dw * 1.6, 70);
    c.fillStyle = MARBLE; c.fillRect(CX - dw * 0.8, dy - 70, dw * 1.0, 70);
    c.fillStyle = SAND; for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(CX + k * 26 - 7, dy - 10); c.lineTo(CX + k * 26 - 7, dy - 40); c.quadraticCurveTo(CX + k * 26, dy - 54, CX + k * 26 + 7, dy - 40); c.lineTo(CX + k * 26 + 7, dy - 10); c.fill(); }
    c.fillStyle = SAND_D; c.fillRect(CX - dw * 0.8, dy - 74, dw * 1.6, 5);
    // the dome: a little more than a half sphere, swelling, then tapering into its neck
    const db = dy - 74;
    c.fillStyle = MARBLE; c.beginPath(); c.moveTo(CX - dw * 0.78, db);
    c.bezierCurveTo(CX - dw * 1.08, db - 110, CX - dw * 0.5, db - 190, CX, db - 196);
    c.bezierCurveTo(CX + dw * 0.5, db - 190, CX + dw * 1.08, db - 110, CX + dw * 0.78, db); c.closePath(); c.fill();
    c.save(); c.clip();
    c.fillStyle = 'rgba(190,176,146,.55)'; c.fillRect(CX + dw * 0.25, db - 210, dw, 220);
    c.fillStyle = 'rgba(190,176,146,.4)'; c.fillRect(CX + dw * 0.55, db - 210, dw, 220);
    c.strokeStyle = 'rgba(160,140,110,.5)'; c.lineWidth = 1.2; c.beginPath();
    for (const k of [-0.7, -0.45, -0.2, 0.05, 0.3, 0.55, 0.8]) { c.moveTo(CX + k * dw * 0.82, db); c.quadraticCurveTo(CX + k * dw * 0.95, db - 150, CX, db - 196); }
    c.stroke();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(CX - dw * 0.78, db);
    c.bezierCurveTo(CX - dw * 1.08, db - 110, CX - dw * 0.5, db - 190, CX, db - 196);
    c.bezierCurveTo(CX + dw * 0.5, db - 190, CX + dw * 1.08, db - 110, CX + dw * 0.78, db); c.stroke();
    // the finial: stacked brass bulbs
    c.fillStyle = GOLD; c.strokeStyle = GOLD_D; c.lineWidth = 1;
    const fy0 = db - 196;
    c.beginPath(); c.ellipse(CX, fy0 - 6, 14, 8, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(CX, fy0 - 22, 9, 9, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(CX, fy0 - 36, 6, 6, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillRect(CX - 2, fy0 - 70, 4, 34);
    c.beginPath(); c.moveTo(CX - 6, fy0 - 70); c.lineTo(CX, fy0 - 84); c.lineTo(CX + 6, fy0 - 70); c.closePath(); c.fill();
  }, { t: 8.2, d: 1.1, reveal: 'rise', ease: 'out' });
  // the chhatris on the roof: kiosks of red stone with white domes on slender pillars
  const chh = [[fx0 + 40, 0.9], [fx1 - 40, 0.9], [CX - 112, 0.7], [CX + 112, 0.7]];
  chh.forEach(([x, s], i) => p.group('tomb', { x: x - 40 * s, y: fy - fh - 120 * s, w: 80 * s, h: 116 * s }, (c) => {
    const y = fy - fh - 8;
    c.fillStyle = SAND_D; c.fillRect(x - 30 * s, y - 8 * s, 60 * s, 8 * s);
    c.fillStyle = SAND; for (const dx of [-24, -8, 8, 24]) c.fillRect(x + dx * s - 2.5 * s, y - 44 * s, 5 * s, 36 * s);
    c.fillStyle = SAND_L; c.fillRect(x - 32 * s, y - 50 * s, 64 * s, 7 * s);
    c.fillStyle = MARBLE; c.beginPath(); c.moveTo(x - 26 * s, y - 50 * s); c.bezierCurveTo(x - 30 * s, y - 84 * s, x - 6 * s, y - 92 * s, x, y - 96 * s); c.bezierCurveTo(x + 6 * s, y - 92 * s, x + 30 * s, y - 84 * s, x + 26 * s, y - 50 * s); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 96 * s); c.lineTo(x, y - 108 * s); c.stroke();
  }, { t: 9.0 + i * 0.12, d: 0.5, reveal: 'pop', ease: 'back' }));
}

// ================================================================ the people: gardeners, strollers, a water carrier, peacocks, ducks
function figure(c, x, y, s, robe, turban, o = {}) {
  // a man in a jama, its skirt flared, a sash, a turban
  c.fillStyle = '#3b2a20'; c.fillRect(x - 3 * s, y - 6 * s, 2.4 * s, 6 * s); c.fillRect(x + 0.8 * s, y - 6 * s, 2.4 * s, 6 * s);
  c.fillStyle = robe; c.beginPath(); c.moveTo(x - 9 * s, y - 5 * s); c.lineTo(x - 4 * s, y - 24 * s); c.lineTo(x + 4 * s, y - 24 * s); c.lineTo(x + 9 * s, y - 5 * s); c.closePath(); c.fill();
  c.fillRect(x - 4 * s, y - 32 * s, 8 * s, 9 * s);
  c.fillStyle = o.sash || GOLD; c.fillRect(x - 4.5 * s, y - 24 * s, 9 * s, 2.4 * s);
  c.fillStyle = SKIN; c.beginPath(); c.arc(x, y - 35 * s, 3.4 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = turban; c.beginPath(); c.ellipse(x, y - 38.5 * s, 4.2 * s, 2.8 * s, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 9 * s, y - 5 * s); c.lineTo(x - 4 * s, y - 24 * s); c.lineTo(x + 4 * s, y - 24 * s); c.lineTo(x + 9 * s, y - 5 * s); c.closePath(); c.stroke();
  if (o.spade) { c.strokeStyle = '#6a4630'; c.lineWidth = 1.4 * s; c.beginPath(); c.moveTo(x + 6 * s, y - 30 * s); c.lineTo(x + 10 * s, y + 2 * s); c.stroke(); c.fillStyle = '#888'; c.fillRect(x + 8 * s, y - 1 * s, 5 * s, 5 * s); }
  if (o.pot) { c.fillStyle = '#b8743a'; c.beginPath(); c.arc(x, y - 44 * s, 4.4 * s, 0, Math.PI * 2); c.fill(); }
  if (o.basket) { c.fillStyle = '#c99a4a'; c.beginPath(); c.ellipse(x, y - 43 * s, 7 * s, 3 * s, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#e8475a'; c.beginPath(); c.arc(x - 2 * s, y - 46 * s, 2 * s, 0, Math.PI * 2); c.arc(x + 2.5 * s, y - 46 * s, 2 * s, 0, Math.PI * 2); c.fill(); }
}
function peacock(c, x, y, s, dir = 1) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.fillStyle = '#2b6b4a'; c.beginPath(); c.moveTo(-4, -8); c.quadraticCurveTo(-30, -6, -44, 2); c.quadraticCurveTo(-26, 4, -2, 0); c.closePath(); c.fill();
  c.fillStyle = GOLD; for (const [u, v] of [[-14, -2], [-24, -2], [-34, 0]]) { c.beginPath(); c.arc(u, v, 2.4, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#1f4fa0'; c.beginPath(); c.ellipse(2, -9, 7, 5, -0.3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(5, -12); c.quadraticCurveTo(8, -20, 7, -24); c.lineTo(10, -24); c.quadraticCurveTo(11, -18, 9, -10); c.fill();
  c.fillStyle = INK; c.fillRect(1, -4, 1.2, 5); c.fillRect(4, -4, 1.2, 5);
  c.strokeStyle = '#1f4fa0'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(8, -24); c.lineTo(7, -28); c.moveTo(9, -24); c.lineTo(10, -28); c.stroke();
  c.restore();
}
function people(p, r) {
  const folk = [
    [CX - 60, 1680, 1, '#e9e2cf', '#e8475a', {}], [CX + 50, 1660, 1, '#c84b3a', '#f3ebd9', { sash: '#2f73b8' }],
    [400, CY + 34, 0.95, '#f3ebd9', '#2f73b8', { spade: true }], [1200, CY - 22, 0.95, '#e0b850', '#f3ebd9', { basket: true }],
    [CX + 70, 1520, 0.9, '#8a5aa8', '#f3ebd9', { pot: true }], [560, 1220, 0.85, '#f3ebd9', '#c84b3a', {}], [1050, 980, 0.85, '#d27c55', '#f3ebd9', { spade: true }],
    [700, 1305, 0.8, '#2f73b8', '#f3ebd9', {}], [905, 1305, 0.8, '#f3ebd9', '#e0b850', {}], [300, 1470, 0.85, '#e8475a', '#f3ebd9', { basket: true }],
  ];
  p.group('people', { x: GX0, y: 900, w: GX1 - GX0, h: 820 }, (c) => {
    for (const [x, y, s, robe, turban, o] of folk) figure(c, x, y, s, robe, turban, o);
  }, { t: 9.4, d: 0.8, reveal: 'fade' });
  p.group('people', { x: 300, y: 1000, w: 1000, h: 560 }, (c) => {
    peacock(c, 470, 1030, 1.1, 1); peacock(c, 1140, 1500, 1.1, -1); peacock(c, 1240, 1060, 0.9, -1);
    // ducks on the channel
    for (const [x, y] of [[290, CY + 4], [318, CY + 6], [CX + 2, 1500]]) {
      c.fillStyle = MARBLE; c.beginPath(); c.ellipse(x, y, 7, 4, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2b6b4a'; c.beginPath(); c.arc(x - 6, y - 4, 3, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD; c.fillRect(x - 11, y - 4, 3, 1.6);
    }
  }, { t: 9.8, d: 0.6, reveal: 'pop' });
  // a gold hairline round the painting, as the gilder's last touch
  p.pen('people', [[PX0 + 3, PY0 + 3], [PX1 - 3, PY0 + 3], [PX1 - 3, PY1 - 3], [PX0 + 3, PY1 - 3], [PX0 + 3, PY0 + 3]], GOLD, 1.4, { t: 10.0, d: 0.9, cap: 'square' });
}

// ================================================================ what moves: fountains, cranes, a boat, a kite
function live(p, r) {
  const jets = [[CX, 1600], [400, CY], [1200, CY]];
  p.live('live', {
    t: 9.0, d: 0.8, box: { x: 330, y: 860, w: 940, h: 760 },
    draw: (c, time) => {
      c.strokeStyle = 'rgba(240,248,255,.9)'; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath();
      jets.forEach(([x, y], i) => {
        const h = 26 + 4 * Math.sin(time * 6 + i * 1.7);
        c.moveTo(x, y); c.lineTo(x, y - h);
        for (const s of [-1, 1]) { c.moveTo(x, y - h); c.quadraticCurveTo(x + s * 10, y - h - 4, x + s * 14, y - h * 0.4); }
      });
      c.stroke();
      c.fillStyle = 'rgba(240,248,255,.8)';
      jets.forEach(([x, y], i) => { for (let k = 0; k < 3; k++) { const u = (time * 1.4 + k / 3 + i * 0.2) % 1; c.fillRect(x - 16 + k * 14, y - 10 - u * 8, 2, 2); } });
    },
  });
  // cranes flying in a line across the sky
  const cranes = Array.from({ length: 5 }, (_, i) => ({ dx: i * 46, dy: (i % 2) * 14 + i * 6, ph: r() * 6 }));
  p.live('live', {
    t: 11.2, d: 1.0, box: { x: PX0, y: PY0, w: PX1 - PX0, h: 260 },
    draw: (c, time) => {
      c.save(); c.beginPath(); c.rect(PX0, PY0, PX1 - PX0, 260); c.clip();
      const L = PX1 - PX0 + 400, base = PX1 + 60 - (((time - 11.2) * 26 + PX1 + 60 - 1100) % L);
      c.strokeStyle = '#f7f2e4'; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath();
      for (const b of cranes) {
        const x = base + b.dx, y = 470 + b.dy, f = Math.sin(time * 4 + b.ph) * 7;
        c.moveTo(x - 12, y - f); c.lineTo(x, y); c.lineTo(x + 12, y - f);
        c.moveTo(x - 12, y); c.lineTo(x + 6, y);
      }
      c.stroke(); c.restore();
    },
  });
  // a boat with a square sail on the Yamuna
  p.live('live', {
    t: 9.6, d: 0.8, box: { x: PX0, y: HZ + 10, w: PX1 - PX0, h: 80 },
    draw: (c, time) => {
      const x = PX0 - 40 + (410 + (time - 9.6) * 14) % (PX1 - PX0 + 80), y = HZ + 70 + Math.sin(time * 2) * 1.2;
      c.save(); c.beginPath(); c.rect(PX0, PY0, PX1 - PX0, PY1 - PY0); c.clip();
      c.fillStyle = '#6a4630'; c.beginPath(); c.moveTo(x - 24, y - 4); c.quadraticCurveTo(x, y + 6, x + 26, y - 6); c.lineTo(x + 20, y - 2); c.lineTo(x - 18, y); c.closePath(); c.fill();
      c.fillStyle = '#f3ebd9'; c.fillRect(x - 4, y - 34, 18, 26);
      c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 5, y - 36); c.lineTo(x - 5, y - 2); c.stroke();
      c.restore();
    },
  });
  // a kite on a long string
  p.live('live', {
    t: 11.6, d: 0.8, box: { x: 1080, y: PY0, w: 340, h: 360 },
    draw: (c, time) => {
      const kx = 1250 + Math.sin(time * 0.9) * 18, ky = 470 + Math.sin(time * 1.3) * 10, a = Math.sin(time * 1.1) * 0.15;
      c.strokeStyle = 'rgba(60,40,30,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(kx, ky + 22); c.quadraticCurveTo(kx + 40, ky + 140, 1400, HZ - 10); c.stroke();
      c.save(); c.translate(kx, ky); c.rotate(Math.PI / 4 + a);
      c.fillStyle = '#e8475a'; c.fillRect(-15, -15, 30, 30);
      c.fillStyle = GOLD_L; c.beginPath(); c.moveTo(-15, -15); c.lineTo(15, -15); c.lineTo(-15, 15); c.closePath(); c.fill();
      c.restore();
    },
  });
}

// ================================================================ the name: gilded above, DELHI below
function title(p, r) {
  // the Devanagari set whole (its letters join under the headline), wiped in from the left
  const ty = 280;
  p.mark('title', {
    t: 10.6, d: 1.3, reveal: 'wipe', ease: 'inOut', box: { x: 360, y: 40, w: 880, h: 300 },
    draw: (c) => {
      c.font = `400 210px ${DEV}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillStyle = LAPIS_D; c.fillText('दिल्ली', CX + 5, ty + 6);
      c.fillStyle = GOLD; c.fillText('दिल्ली', CX, ty);
      c.strokeStyle = GOLD_D; c.lineWidth = 2; c.strokeText('दिल्ली', CX, ty);
    },
  });
  // illuminated rosettes to either side
  for (const [x, t] of [[380, 11.3], [1220, 11.4]]) {
    p.group('title', { x: x - 60, y: 160, w: 120, h: 120 }, (c) => {
      const y = 218;
      c.fillStyle = GOLD; c.beginPath();
      for (let k = 0; k < 32; k++) { const a = (k / 32) * Math.PI * 2, R = k % 2 ? 34 : 50; c.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); }
      c.closePath(); c.fill();
      c.fillStyle = LAPIS_L; c.beginPath(); c.arc(x, y, 28, 0, Math.PI * 2); c.fill();
      c.strokeStyle = GOLD_L; c.lineWidth = 2; c.stroke();
      c.fillStyle = MADDER; c.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.moveTo(x + Math.cos(a) * 15 + 6, y + Math.sin(a) * 15); c.arc(x + Math.cos(a) * 15, y + Math.sin(a) * 15, 6, 0, Math.PI * 2); } c.fill();
      c.fillStyle = GOLD_L; c.beginPath(); c.arc(x, y, 8, 0, Math.PI * 2); c.fill();
    }, { t, d: 0.6, reveal: 'pop', ease: 'back' });
  }
  // DELHI under the painting, between gold rules
  p.type('title', 'DELHI', CX, 1926, { family: DEV, size: 64, color: GOLD, track: 0.32, align: 'center', t: 11.8, gap: 0.12, d: 0.6, reveal: 'press' });
  p.group('title', { x: 300, y: 1880, w: 1000, h: 40 }, (c) => {
    c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath();
    c.moveTo(330, 1904); c.lineTo(620, 1904); c.moveTo(980, 1904); c.lineTo(1270, 1904); c.stroke();
    c.fillStyle = GOLD; for (const x of [330, 1270, 640, 960]) { c.beginPath(); c.moveTo(x, 1896); c.lineTo(x + 8, 1904); c.lineTo(x, 1912); c.lineTo(x - 8, 1904); c.closePath(); c.fill(); }
  }, { t: 12.4, d: 0.7, reveal: 'iris', ease: 'out' });
}
