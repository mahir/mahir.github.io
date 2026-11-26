// Jaipur: a length of block-printed cotton. The Hawa Mahal's honeycomb front
// fills the cloth, column after column of little windows under curved eaves and
// domes, stepping up to its crown, printed the way Sanganer and Bagru print: one
// carved block per color, stamped tile by tile across the cloth, pink, then
// madder red, then indigo, then turmeric, and last the black outline block, a
// little out of register. Behind it the walls of Nahargarh run along the ridge,
// the Isarlat tower and Jantar Mantar's great sundial stand up, and kites fill
// the sky. Elephants, camels and people walk the street below in a frieze. The
// name is printed in the border: जयपुर with JAIPUR.

import { Plate, W, H } from '../print.js';
import { mix } from '../kit.js';

// the dyer's pots
const CLOTH = '#efe2c6', CLOTH_D = '#e3d2b0';
const PINK = '#e58b7b', RED = '#b4262b', INDIGO = '#25335f', INDIGO_L = '#8f9bb8', YELLOW = '#e2a72e', GREEN = '#5b7a46';
const KEY = '#2a1b1b', WALL = '#3b1a1d';

const DEV = '"Amita", serif';

export const city = {
  id: 'jaipur', name: 'Jaipur', wall: WALL,
  alt: 'A block-printed cotton cloth in pink, madder red, indigo, turmeric and black, slightly out of register: the Hawa Mahal\'s honeycomb front of little windows under curved eaves and domes, stepping up to its crown, with shops at its foot, the walls of Nahargarh Fort along the ridge behind, the Isarlat tower, the great triangular sundial of Jantar Mantar, kites over the roofs, and a frieze of elephants in painted cloths, camels, a camel cart and people walking the street, in printed borders with the name जयपुर and JAIPUR',
  google: 'family=Amita:wght@400;700',
  fonts: [['700 200px "Amita"', 'जयपुर'], ['700 90px "Amita"', 'JAIPUR'], ['400 30px "Amita"', 'THE PINK CITY · RAJASTHAN']],
  build,
};

// the cloth's layout
const FX0 = 150, FX1 = 1450; // the facade's sides
const GROUND = 1452; // the street line at the facade's foot
const ARC0 = 1300; // the top of the arcade
const FRIEZE = 1660; // the foot of the frieze
const TB = 1712; // the top of the title band

// each block is cut a hair off the others: where it lands on the cloth
const OFF = { pink: [0, 0], red: [3, -2], indigo: [-2, 2], yellow: [2, 3], key: [4, 3], cloth: [1, -1] };

function build() {
  const p = new Plate({ paper: CLOTH, seed: 1727 });
  const r = p.r;
  p.stack('cloth', 'border', 'hills', 'kites', 'print', 'key', 'white', 'frieze', 'title', 'specks');
  cloth(p, r);
  border(p, r);
  hills(p, r);
  facade(p, r);
  frieze(p, r);
  kites(p, r);
  title(p, r);
  specks(p, r);
  return p;
}

// ---------------------------------------------------------------- helpers
function path(c, pts, close = true) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  if (close) c.closePath();
}
const bx = (x0, y0, x1, y1, pad = 6) => ({ x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad });

// a block: the shapes one carved block prints in one color. Each shape is
// [box, draw(c)]; the block is stamped across a region tile by tile.
function block(color, off) { return { color, off: OFF[off], items: [] }; }
function stamp(p, layer, b, x0, y0, x1, y1, nx, ny, t0, dt, o = {}) {
  const tw = (x1 - x0) / nx, th = (y1 - y0) / ny;
  let k = 0;
  const order = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) order.push([i, j]);
  for (const [i, j] of order) {
    const tx = x0 + i * tw, ty = y0 + j * th;
    const list = b.items.filter(([q]) => q.x < tx + tw + 8 && q.x + q.w > tx - 8 && q.y < ty + th + 8 && q.y + q.h > ty - 8);
    if (!list.length) continue;
    p.group(layer, { x: tx - 4, y: ty - 4, w: tw + 8, h: th + 8 }, (c) => {
      // tiles meet on whole pixels, so no seam shows between them
      const k0 = c.getTransform().a;
      const sx0 = Math.round(tx * k0) / k0, sy0 = Math.round(ty * k0) / k0;
      const sx1 = Math.round((tx + tw) * k0) / k0, sy1 = Math.round((ty + th) * k0) / k0;
      c.save(); c.beginPath(); c.rect(sx0, sy0, sx1 - sx0, sy1 - sy0); c.clip();
      c.translate(b.off[0], b.off[1]);
      c.fillStyle = b.color; c.strokeStyle = b.color; c.lineJoin = 'round'; c.lineCap = 'round';
      for (const [, draw] of list) draw(c);
      c.restore();
    }, { t: t0 + k * dt, d: o.d ?? 0.32, reveal: 'fade', ease: 'out' });
    k++;
  }
  return t0 + k * dt;
}

// ---------------------------------------------------------------- the cloth: its weave and the fringe at either end
function cloth(p, r) {
  const threads = [];
  for (let y = 36; y < H - 36; y += 5) threads.push([[0, y + r.range(-0.6, 0.6)], [W, y + r.range(-0.6, 0.6)]]);
  p.strokes('cloth', threads, 'rgba(160,130,90,.10)', 1.1, { t: 0, d: 0.6, reveal: 'fade', box: bx(0, 0, W, H, 0) });
  const warp = [];
  for (let x = 2; x < W; x += 7) warp.push([[x + r.range(-0.8, 0.8), 36], [x + r.range(-0.8, 0.8), H - 36]]);
  p.strokes('cloth', warp, 'rgba(255,250,235,.22)', 1.2, { t: 0.1, d: 0.6, reveal: 'fade', box: bx(0, 0, W, H, 0) });
  // the fringe: the wall shows between loose threads at the top and the foot
  const fr = [];
  for (let x = 4; x < W; x += 9) {
    const l = r.range(18, 30);
    fr.push([x + r.range(-1.5, 1.5), l, r.range(-3, 3)]);
  }
  p.group('cloth', bx(0, 0, W, H, 0), (c) => {
    c.fillStyle = WALL; c.fillRect(0, 0, W, 34); c.fillRect(0, H - 34, W, 34);
    c.strokeStyle = CLOTH_D; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath();
    for (const [x, l, s] of fr) { c.moveTo(x, 36); c.lineTo(x + s, 36 - l); c.moveTo(x, H - 36); c.lineTo(x - s, H - 36 + l); }
    c.stroke();
    c.fillStyle = CLOTH; c.fillRect(0, 30, W, 8); c.fillRect(0, H - 38, W, 8);
  }, { t: 0.2, d: 0.7, reveal: 'fade' });
  // the field: little four-dot butis in a half-drop over the open cloth
  const dots = [];
  for (let y = 230, j = 0; y < 900; y += 56, j++) for (let x = 140 + (j % 2) * 40; x < W - 130; x += 80) dots.push([x, y]);
  p.group('cloth', bx(110, 200, W - 110, 900), (c) => {
    c.fillStyle = mix(PINK, CLOTH, 0.35);
    for (const [x, y] of dots) for (const [dx, dy] of [[0, -5], [5, 0], [0, 5], [-5, 0]]) { c.beginPath(); c.arc(x + dx, y + dy, 2.6, 0, 7); c.fill(); }
  }, { t: 0.9, d: 0.8, reveal: 'fade' });
}

// ---------------------------------------------------------------- the printed borders: rules, butis, a zigzag, a vine
function buti(c, x, y, s) {
  // a small flower of five petals on a stem with two leaves
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * Math.PI * 2) / 5;
    c.beginPath(); c.ellipse(x + Math.cos(a) * 7 * s, y - 10 * s + Math.sin(a) * 7 * s, 5 * s, 3.2 * s, a, 0, Math.PI * 2); c.fill();
  }
  c.fillRect(x - 1 * s, y - 4 * s, 2 * s, 14 * s);
  c.beginPath(); c.ellipse(x - 6 * s, y + 4 * s, 6 * s, 2.5 * s, -0.6, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(x + 6 * s, y + 4 * s, 6 * s, 2.5 * s, 0.6, 0, Math.PI * 2); c.fill();
}
function border(p, r) {
  // top band: two rules, a row of butis between scallops, a zigzag
  const red = block(RED, 'red'), ind = block(INDIGO, 'indigo'), yel = block(YELLOW, 'yellow'), key = block(KEY, 'key');
  const bands = [[44, 196], [TB, H - 44]];
  for (const [y0, y1] of bands) {
    red.items.push([bx(40, y0, W - 40, y0 + 12), (c) => { c.fillRect(40, y0, W - 80, 10); }]);
    red.items.push([bx(40, y1 - 12, W - 40, y1), (c) => { c.fillRect(40, y1 - 10, W - 80, 10); }]);
    ind.items.push([bx(40, y0 + 14, W - 40, y0 + 22), (c) => { c.fillRect(40, y0 + 15, W - 80, 4); }]);
    ind.items.push([bx(40, y1 - 22, W - 40, y1 - 14), (c) => { c.fillRect(40, y1 - 19, W - 80, 4); }]);
  }
  // the top band's motifs
  for (let x = 80; x < W - 60; x += 60) {
    const k = Math.round((x - 80) / 60);
    yel.items.push([bx(x - 26, 72, x + 26, 132), (c) => { c.beginPath(); c.arc(x, 120, 26, Math.PI, 0); c.fill(); }]);
    red.items.push([bx(x - 18, 80, x + 18, 128), (c) => buti(c, x, 112, 1.05)]);
    key.items.push([bx(x - 28, 90, x + 28, 124), (c) => { c.lineWidth = 2; c.beginPath(); c.arc(x, 120, 26, Math.PI, 0); c.stroke(); }]);
    if (k % 1 === 0) ind.items.push([bx(x - 30, 140, x + 30, 176), (c) => { path(c, [[x - 30, 168], [x, 142], [x + 30, 168], [x + 30, 174], [x, 150], [x - 30, 174]]); c.fill(); }]);
    red.items.push([bx(x + 26, 154, x + 34, 162), (c) => { c.beginPath(); c.arc(x + 30, 160, 4, 0, 7); c.fill(); }]);
  }
  // side selvedges: a vine of leaves and dots running down
  for (const sx of [72, W - 72]) {
    ind.items.push([bx(sx - 2, 200, sx + 2, TB), (c) => { c.fillRect(sx - 1.5, 200, 3, TB - 200); }]);
    for (let y = 220; y < TB - 20; y += 36) {
      const sd = (Math.round((y - 220) / 36) % 2) ? 1 : -1;
      red.items.push([bx(sx - 22, y - 8, sx + 22, y + 8), (c) => { c.beginPath(); c.ellipse(sx + sd * 12, y, 11, 5, sd * 0.5, 0, Math.PI * 2); c.fill(); }]);
      yel.items.push([bx(sx - 22, y + 10, sx + 22, y + 26), (c) => { c.beginPath(); c.arc(sx - sd * 12, y + 18, 4.5, 0, 7); c.fill(); }]);
    }
    for (const dx of [-30, 30]) red.items.push([bx(sx + dx - 2, 200, sx + dx + 2, TB), (c) => { c.fillRect(sx + dx - 1.5, 200, 3, TB - 200); }]);
  }
  // the blocks go down one after another across the whole sheet
  let t = 0.4;
  t = stamp(p, 'border', yel, 40, 40, W - 40, H - 40, 8, 1, 0.5, 0.06, { d: 0.3 });
  t = stamp(p, 'border', red, 40, 40, W - 40, H - 40, 8, 4, 0.8, 0.035, { d: 0.3 });
  t = stamp(p, 'border', ind, 40, 40, W - 40, H - 40, 8, 4, 1.6, 0.03, { d: 0.3 });
  stamp(p, 'border', key, 40, 40, W - 40, 200, 8, 1, 2.4, 0.05, { d: 0.3 });
}

// ---------------------------------------------------------------- behind: the ridge and Nahargarh's walls, the Isarlat, the Samrat Yantra
function ridge(x) { return 640 - Math.sin((x - 150) / 300) * 70 - Math.sin(x / 97) * 14 - (x > 1000 ? (x - 1000) * 0.05 : 0); }
function hills(p, r) {
  const hl = block(INDIGO_L, 'indigo'), red = block(RED, 'red'), yel = block(YELLOW, 'yellow'), key = block(KEY, 'key'), ind = block(INDIGO, 'indigo'), wht = block(CLOTH, 'cloth');
  const pts = [[110, 900]];
  for (let x = 110; x <= W - 110; x += 10) pts.push([x, ridge(x)]);
  pts.push([W - 110, 900]);
  hl.items.push([bx(110, 520, W - 110, 900), (c) => { path(c, pts); c.fill(); }]);
  // little dotted lines of scrub down the slopes, printed in indigo
  for (let k = 0; k < 90; k++) {
    const x = 130 + ((k * 137) % (W - 260)), y = ridge(x) + 30 + ((k * 61) % 200);
    ind.items.push([bx(x - 4, y - 4, x + 4, y + 4), (c) => { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }]);
  }
  // the fort wall along the crest: a crenellated line with round bastions
  const wall = [];
  for (let x = 120; x <= W - 120; x += 8) wall.push([x, ridge(x) - 6]);
  red.items.push([bx(110, 480, W - 110, 680), (c) => {
    c.lineWidth = 10; c.beginPath(); c.moveTo(wall[0][0], wall[0][1]); for (const q of wall) c.lineTo(q[0], q[1]); c.stroke();
    for (let i = 0; i < wall.length; i += 2) c.fillRect(wall[i][0] - 3, wall[i][1] - 14, 6, 8);
    for (const x of [230, 520, 820, 1130, 1380]) { const y = ridge(x); c.beginPath(); c.roundRect(x - 16, y - 40, 32, 40, [10, 10, 0, 0]); c.fill(); }
  }]);
  // Nahargarh's palace block on the high point, left of the crown
  const nx = 470, ny = ridge(470) - 4;
  red.items.push([bx(nx - 90, ny - 110, nx + 90, ny), (c) => { c.fillRect(nx - 85, ny - 70, 170, 70); for (const dx of [-60, 0, 60]) { c.beginPath(); c.arc(nx + dx, ny - 70, 18, Math.PI, 0); c.fill(); } }]);
  wht.items.push([bx(nx - 80, ny - 60, nx + 80, ny - 8), (c) => { for (let k = -3; k <= 3; k++) { c.beginPath(); c.roundRect(nx + k * 22 - 6, ny - 52, 12, 22, [6, 6, 0, 0]); c.fill(); } }]);
  key.items.push([bx(nx - 92, ny - 112, nx + 92, ny + 2), (c) => { c.lineWidth = 2.5; c.strokeRect(nx - 85, ny - 70, 170, 70); for (const dx of [-60, 0, 60]) { c.beginPath(); c.arc(nx + dx, ny - 70, 18, Math.PI, 0); c.stroke(); } }]);
  key.items.push([bx(110, 480, W - 110, 680), (c) => { c.lineWidth = 2.5; c.beginPath(); c.moveTo(pts[1][0], pts[1][1]); for (let i = 2; i < pts.length - 1; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }]);

  // the Isarlat: a tall tower of seven stages and an open pavilion on top
  const ix = 300, iy = 900;
  const stages = [];
  for (let k = 0; k < 7; k++) stages.push([iy - 70 - k * 62, 46 - k * 3]);
  yel.items.push([bx(ix - 50, 380, ix + 50, iy), (c) => { for (const [y, w] of stages) c.fillRect(ix - w / 2, y, w, 64); c.beginPath(); c.arc(ix, 450, 22, Math.PI, 0); c.fill(); c.fillRect(ix - 24, 450, 48, 18); }]);
  red.items.push([bx(ix - 50, 380, ix + 50, iy), (c) => { for (const [y, w] of stages) { c.fillRect(ix - w / 2 - 6, y - 4, w + 12, 7); c.beginPath(); c.roundRect(ix - 7, y + 14, 14, 30, [7, 7, 0, 0]); c.fill(); } }]);
  key.items.push([bx(ix - 52, 376, ix + 52, iy), (c) => { c.lineWidth = 2.2; for (const [y, w] of stages) c.strokeRect(ix - w / 2, y, w, 64); c.beginPath(); c.arc(ix, 450, 22, Math.PI, 0); c.stroke(); c.beginPath(); c.moveTo(ix, 428); c.lineTo(ix, 410); c.stroke(); }]);

  // the Samrat Yantra: a huge right triangle, its hypotenuse a stair to the sky
  const sx0 = 1130, sx1 = 1440, sy0 = 900, sy1 = 430;
  yel.items.push([bx(sx0, sy1 - 50, sx1, sy0), (c) => { path(c, [[sx0, sy0], [sx1, sy0], [sx1, sy1 + 40], [sx1 - 30, sy1 + 40]]); c.fill(); }]);
  red.items.push([bx(sx0, sy1 - 50, sx1, sy0), (c) => {
    // the stair's treads, and the quadrant's arc at the side
    c.lineWidth = 3; c.beginPath();
    for (let u = 0.04; u < 1; u += 0.035) { const x = sx0 + (sx1 - 30 - sx0) * u, y = sy0 + (sy1 + 40 - sy0) * u; c.moveTo(x, y); c.lineTo(x + 12, y); }
    c.stroke();
    c.beginPath(); c.arc(sx1, sy0, 160, Math.PI, Math.PI * 1.5); c.lineWidth = 8; c.stroke();
    // the little pavilion on its top
    c.beginPath(); c.arc(sx1 - 15, sy1 + 10, 20, Math.PI, 0); c.fill(); c.fillRect(sx1 - 35, sy1 + 10, 40, 30);
  }]);
  key.items.push([bx(sx0 - 2, sy1 - 52, sx1 + 2, sy0 + 2), (c) => { c.lineWidth = 2.5; path(c, [[sx0, sy0], [sx1, sy0], [sx1, sy1 + 40], [sx1 - 30, sy1 + 40]]); c.stroke(); c.beginPath(); c.arc(sx1 - 15, sy1 + 10, 20, Math.PI, 0); c.stroke(); }]);

  stamp(p, 'hills', hl, 110, 420, W - 110, 900, 6, 2, 2.2, 0.05);
  stamp(p, 'hills', yel, 110, 380, W - 110, 900, 6, 2, 2.8, 0.05);
  stamp(p, 'hills', red, 110, 380, W - 110, 900, 6, 2, 3.2, 0.05);
  stamp(p, 'hills', ind, 110, 380, W - 110, 900, 6, 2, 3.6, 0.04);
  stamp(p, 'hills', wht, 110, 380, W - 110, 900, 4, 1, 3.9, 0.05);
  stamp(p, 'hills', key, 110, 380, W - 110, 900, 6, 2, 4.0, 0.05);
}

// ---------------------------------------------------------------- the Hawa Mahal
const NC = 15, CW = (FX1 - FX0) / NC, BH = 92;
const TOPS = [860, 780, 700, 560, 640, 520, 430, 330, 430, 520, 640, 560, 700, 780, 860];
function facade(p, r) {
  const pink = block(PINK, 'pink'), red = block(RED, 'red'), ind = block(INDIGO, 'indigo'), yel = block(YELLOW, 'yellow'), key = block(KEY, 'key'), wht = block(CLOTH, 'cloth');
  for (let i = 0; i < NC; i++) {
    const x0 = FX0 + i * CW, x1 = x0 + CW, cx = (x0 + x1) / 2;
    const proj = i % 2 === 0; // every other column is a bay that stands forward
    // the bays from the arcade up, as many as fit under the column's top
    const bays = [];
    for (let y = ARC0 - BH; y >= TOPS[i]; y -= BH) bays.push(y);
    const top = bays[bays.length - 1];
    const ins = proj ? 2 : 8;
    // the column's body and its dome
    const domeH = i === 7 ? 90 : 50, dw = (CW - 2 * ins) * (i === 7 ? 0.62 : 0.42);
    const dome = (c) => {
      c.beginPath(); c.moveTo(cx - dw, top - 8);
      c.bezierCurveTo(cx - dw, top - domeH * 0.8, cx - dw * 0.2, top - domeH * 0.8, cx, top - domeH);
      c.bezierCurveTo(cx + dw * 0.2, top - domeH * 0.8, cx + dw, top - domeH * 0.8, cx + dw, top - 8);
      c.closePath();
    };
    pink.items.push([bx(x0, top - domeH - 4, x1, ARC0), (c) => { c.fillRect(x0 + ins, top, CW - 2 * ins, ARC0 - top); dome(c); c.fill(); c.fillRect(cx - dw - 4, top - 12, 2 * dw + 8, 12); }]);
    // the dome's ribs and the finial
    red.items.push([bx(cx - dw, top - domeH - 4, cx + dw, top), (c) => { c.lineWidth = 2; c.beginPath(); for (const k of [-0.5, 0, 0.5]) { c.moveTo(cx + k * dw, top - 10); c.quadraticCurveTo(cx + k * dw * 0.6, top - domeH * 0.7, cx, top - domeH + 2); } c.stroke(); }]);
    yel.items.push([bx(cx - 8, top - domeH - 24, cx + 8, top - domeH), (c) => { c.fillRect(cx - 1.5, top - domeH - 20, 3, 20); c.beginPath(); c.arc(cx, top - domeH - 16, 5, 0, 7); c.fill(); }]);
    key.items.push([bx(x0, top - domeH - 22, x1, ARC0 + 2), (c) => {
      c.lineWidth = 2.4; dome(c); c.stroke(); c.strokeRect(cx - dw - 4, top - 12, 2 * dw + 8, 12);
      c.beginPath(); c.moveTo(x0 + ins, top); c.lineTo(x0 + ins, ARC0); c.moveTo(x1 - ins, top); c.lineTo(x1 - ins, ARC0); c.stroke();
      c.beginPath(); c.moveTo(cx, top - domeH); c.lineTo(cx, top - domeH - 20); c.stroke();
    }]);
    // a bay: its eave, its sides, the arched window and its lattice
    for (const y of bays) {
      const wx0 = x0 + ins + 12, wx1 = x1 - ins - 12, wy0 = y + 30, wy1 = y + BH - 14, ww = wx1 - wx0;
      const arch = (c, g = 0) => {
        c.beginPath(); c.moveTo(wx0 - g, wy1 + g); c.lineTo(wx0 - g, wy0 + ww / 2);
        c.quadraticCurveTo(wx0 - g, wy0 - g, (wx0 + wx1) / 2, wy0 - 8 - g);
        c.quadraticCurveTo(wx1 + g, wy0 - g, wx1 + g, wy0 + ww / 2); c.lineTo(wx1 + g, wy1 + g); c.closePath();
      };
      const eave = (c) => {
        c.beginPath(); c.moveTo(x0 + ins - 6, y + 22); c.quadraticCurveTo(cx, y + 2, x1 - ins + 6, y + 22);
        c.lineTo(x1 - ins + 6, y + 14); c.quadraticCurveTo(cx, y - 6, x0 + ins - 6, y + 14); c.closePath();
      };
      red.items.push([bx(x0 - 8, y - 8, x1 + 8, y + BH), (c) => {
        eave(c); c.fill();
        if (proj) { c.fillRect(x0 + ins, y + 20, 8, BH - 20); c.fillRect(x1 - ins - 8, y + 20, 8, BH - 20); }
        // the balcony's ledge and its little brackets
        c.fillRect(x0 + ins, y + BH - 8, CW - 2 * ins, 8);
        for (const bxx of [x0 + ins + 10, cx, x1 - ins - 10]) { path(c, [[bxx - 5, y + BH], [bxx + 5, y + BH], [bxx, y + BH + 8]]); c.fill(); }
      }]);
      const row = Math.round((ARC0 - BH - y) / BH);
      if (proj) {
        // a projecting bay: three narrow arched lights side by side
        const nw = (ww - 8) / 3;
        const lights = (c, g = 0) => { c.beginPath(); for (let q = 0; q < 3; q++) { const lx = wx0 + q * (nw + 4); c.moveTo(lx - g, wy1 + g); c.lineTo(lx - g, wy0 + 8); c.arc(lx + nw / 2, wy0 + 8, nw / 2 + g, Math.PI, 0); c.lineTo(lx + nw + g, wy1 + g); c.closePath(); } };
        ind.items.push([bx(wx0, wy0 - 10, wx1, wy1), (c) => { lights(c); c.fill(); }]);
        wht.items.push([bx(wx0 - 6, wy0 - 14, wx1 + 6, wy1 + 6), (c) => {
          c.fillRect(wx0 - 4, wy1 - 12, ww + 8, 3);
          for (let q = 0; q < 3; q++) { const lx = wx0 + q * (nw + 4) + nw / 2; c.fillRect(lx - 1, wy0 + 8, 2, wy1 - wy0 - 22); }
        }]);
        key.items.push([bx(wx0 - 4, wy0 - 14, wx1 + 4, wy1 + 4), (c) => { c.lineWidth = 1.6; lights(c); c.stroke(); }]);
      } else {
        ind.items.push([bx(wx0, wy0 - 10, wx1, wy1), (c) => { arch(c); c.fill(); }]);
        // the jali: rows of little holes, where the cloth shows through
        const holes = [];
        for (let yy = wy0 + 6; yy < wy1 - 4; yy += 8) for (let xx = wx0 + 5; xx < wx1 - 3; xx += 8) holes.push([xx + ((yy / 8) % 2) * 2, yy]);
        wht.items.push([bx(wx0 - 6, wy0 - 14, wx1 + 6, wy1 + 6), (c) => {
          c.lineWidth = 2; arch(c, 5); c.stroke();
          for (const [hx, hy] of holes) c.fillRect(hx - 1.4, hy - 1.4, 2.8, 2.8);
        }]);
        key.items.push([bx(wx0 - 4, wy0 - 14, wx1 + 4, wy1 + 4), (c) => { c.lineWidth = 2; arch(c); c.stroke(); }]);
      }
      // every third floor a string course of little flowers runs across the bay
      if (row % 3 === 2) wht.items.push([bx(x0, y + BH - 8, x1, y + BH), (c) => { for (let xx = x0 + ins + 6; xx < x1 - ins - 2; xx += 9) { c.beginPath(); c.arc(xx, y + BH - 4, 2, 0, 7); c.fill(); } }]);
      yel.items.push([bx(x0, y, x1, y + 24), (c) => { for (let k = -2; k <= 2; k++) { c.beginPath(); c.arc(cx + k * (CW - 2 * ins) / 6, y + 16 + Math.abs(k) * 2, 2.6, 0, 7); c.fill(); } }]);
      key.items.push([bx(x0 - 8, y - 8, x1 + 8, y + BH + 10), (c) => {
        c.lineWidth = 2; eave(c); c.stroke();
        c.strokeRect(x0 + ins, y + BH - 8, CW - 2 * ins, 8);
      }]);
    }
  }
  // the arcade at street level: shopfronts under cusped arches
  const NA = 12, AW = (FX1 - FX0) / NA;
  pink.items.push([bx(FX0 - 20, ARC0 - 4, FX1 + 20, GROUND), (c) => { c.fillRect(FX0 - 20, ARC0, FX1 - FX0 + 40, GROUND - ARC0); }]);
  red.items.push([bx(FX0 - 20, ARC0 - 8, FX1 + 20, ARC0 + 20), (c) => { c.fillRect(FX0 - 20, ARC0, FX1 - FX0 + 40, 14); }]);
  for (let k = 0; k < NA; k++) {
    const a0 = FX0 + k * AW + 14, a1 = a0 + AW - 28, am = (a0 + a1) / 2;
    const opening = (c) => {
      c.beginPath(); c.moveTo(a0, GROUND); c.lineTo(a0, ARC0 + 70);
      // a cusped arch: three lobes
      c.quadraticCurveTo(a0, ARC0 + 46, a0 + (a1 - a0) * 0.25, ARC0 + 44);
      c.quadraticCurveTo(am - 8, ARC0 + 26, am, ARC0 + 30);
      c.quadraticCurveTo(am + 8, ARC0 + 26, a1 - (a1 - a0) * 0.25, ARC0 + 44);
      c.quadraticCurveTo(a1, ARC0 + 46, a1, ARC0 + 70); c.lineTo(a1, GROUND); c.closePath();
    };
    red.items.push([bx(a0, ARC0 + 20, a1, GROUND), (c) => { opening(c); c.fill(); }]);
    // goods in the shop: bolts of cloth and pots, in indigo and turmeric
    ind.items.push([bx(a0, GROUND - 60, a1, GROUND), (c) => { for (let q = 0; q < 3; q++) c.fillRect(a0 + 8 + q * (a1 - a0 - 16) / 3, GROUND - 52 + (q % 2) * 10, (a1 - a0 - 16) / 3 - 4, 52 - (q % 2) * 10); }]);
    yel.items.push([bx(a0, GROUND - 90, a1, GROUND - 40), (c) => { c.fillRect(a0 + 6, GROUND - 64, a1 - a0 - 12, 6); for (let q = 0; q < 4; q++) { c.beginPath(); c.arc(a0 + 14 + q * (a1 - a0 - 28) / 3, GROUND - 74, 8, 0, 7); c.fill(); } }]);
    key.items.push([bx(a0 - 4, ARC0 + 20, a1 + 4, GROUND + 2), (c) => { c.lineWidth = 2.4; opening(c); c.stroke(); }]);
    wht.items.push([bx(a0 - 10, ARC0 + 14, a1 + 10, GROUND), (c) => { c.lineWidth = 2; c.beginPath(); c.moveTo(a0 - 6, GROUND); c.lineTo(a0 - 6, ARC0 + 66); c.quadraticCurveTo(a0 - 6, ARC0 + 22, am, ARC0 + 20); c.quadraticCurveTo(a1 + 6, ARC0 + 22, a1 + 6, ARC0 + 66); c.lineTo(a1 + 6, GROUND); c.stroke(); }]);
  }
  key.items.push([bx(FX0 - 22, ARC0 - 2, FX1 + 22, GROUND + 4), (c) => { c.lineWidth = 3; c.strokeRect(FX0 - 20, ARC0, FX1 - FX0 + 40, GROUND - ARC0); c.beginPath(); c.moveTo(FX0 - 20, ARC0 + 14); c.lineTo(FX1 + 20, ARC0 + 14); c.stroke(); }]);

  // the blocks, one color after another, worked across the facade from its foot up
  const X0 = FX0 - 24, X1 = FX1 + 24, Y0 = 240, Y1 = GROUND + 6;
  stamp(p, 'print', pink, X0, Y0, X1, Y1, 5, 6, 4.4, 0.055, { d: 0.32 });
  stamp(p, 'print', red, X0, Y0, X1, Y1, 5, 6, 5.9, 0.05, { d: 0.3 });
  stamp(p, 'print', ind, X0, Y0, X1, Y1, 5, 6, 7.1, 0.045, { d: 0.3 });
  stamp(p, 'print', yel, X0, Y0, X1, Y1, 5, 6, 8.1, 0.04, { d: 0.3 });
  stamp(p, 'key', key, X0, Y0, X1, Y1, 5, 6, 8.9, 0.045, { d: 0.3 });
  stamp(p, 'white', wht, X0, Y0, X1, Y1, 5, 6, 10.0, 0.035, { d: 0.3 });
}

// ---------------------------------------------------------------- the street frieze: elephants, camels, a cart, people
// an elephant in a 200 by 160 box facing right, feet on the bottom
const ELE = [[22, 52], [34, 26], [62, 10], [104, 8], [132, 12], [154, 8], [172, 20], [182, 44], [184, 74], [182, 104], [178, 132],
  [172, 152], [164, 154], [168, 132], [168, 104], [160, 86], [152, 92], [152, 156], [128, 156], [126, 112], [100, 116], [74, 116],
  [66, 110], [64, 156], [40, 156], [38, 104], [28, 84], [18, 74]];
// a camel in a 200 by 170 box facing right
const CAM = [[18, 70], [30, 48], [54, 42], [70, 14], [90, 8], [108, 30], [128, 44], [148, 40], [160, 20], [172, 8], [194, 10], [196, 22],
  [180, 26], [170, 46], [152, 72], [142, 82], [144, 168], [132, 168], [128, 100], [120, 100], [122, 168], [110, 168], [106, 92],
  [72, 92], [64, 98], [66, 168], [54, 168], [50, 104], [44, 104], [46, 168], [34, 168], [30, 92], [24, 82]];
function shapeAt(pts, x, y, s, w0, h0, flip = false) { return pts.map(([u, v]) => [x + (flip ? -1 : 1) * (u - w0 / 2) * s, y - (h0 - v) * s]); }
function frieze(p, r) {
  // the street: a printed ground line with a row of small diamonds
  p.group('frieze', bx(FX0 - 60, GROUND - 2, FX1 + 60, FRIEZE + 20), (c) => {
    c.fillStyle = mix(YELLOW, CLOTH, 0.55); c.fillRect(110, GROUND, W - 220, FRIEZE - GROUND);
    c.fillStyle = RED; c.fillRect(110, FRIEZE, W - 220, 8);
    c.fillStyle = mix(RED, CLOTH, 0.45);
    for (let x = 150, k = 0; x < W - 140; x += 48, k++) buti(c, x, GROUND + 40 + (k % 2) * 30, 0.7);
    c.fillStyle = INDIGO; for (let x = 130; x < W - 120; x += 30) { path(c, [[x, FRIEZE + 12], [x + 6, FRIEZE + 18], [x, FRIEZE + 24], [x - 6, FRIEZE + 18]]); c.fill(); }
  }, { t: 4.6, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  const y = FRIEZE - 6;
  const walkers = [];
  // two elephants in painted cloths, each with a rider
  const ele = (x, s, t) => {
    const pts = shapeAt(ELE, x, y, s, 200, 156);
    const P = (u, v) => [x + (u - 100) * s, y - (156 - v) * s];
    p.group('frieze', bx(x - 110 * s, y - 220 * s, x + 110 * s, y + 4), (c) => {
      c.fillStyle = INDIGO_L; path(c, pts); c.fill();
      // the jhool, a cloth over its back, red with a turmeric border and white dots
      const cl = [P(52, 14), P(134, 14), P(138, 76), P(112, 90), P(80, 92), P(48, 76)];
      c.fillStyle = YELLOW; path(c, cl); c.fill();
      c.fillStyle = RED; path(c, [P(58, 18), P(128, 18), P(131, 70), P(110, 82), P(80, 84), P(54, 70)]); c.fill();
      c.fillStyle = CLOTH; for (let k = 0; k < 7; k++) for (let j = 0; j < 3; j++) { const [dx, dy] = P(66 + k * 10, 32 + j * 16); c.beginPath(); c.arc(dx, dy, 2.4 * s, 0, 7); c.fill(); }
      // a painted forehead in turmeric, an anklet on each foot
      c.fillStyle = YELLOW; path(c, [P(160, 14), P(178, 26), P(176, 54), P(168, 40)]); c.fill();
      c.fillStyle = RED; for (const u of [40, 64, 128, 152]) { const [ax, ay] = P(u - 12, 140); c.fillRect(ax, ay, 24 * s, 5 * s); }
      // the rider: a turban, a kurta, his legs over the neck
      const [hx, hy] = P(150, -12);
      c.fillStyle = CLOTH; c.fillRect(hx - 8 * s, hy, 16 * s, 26 * s);
      c.fillStyle = KEY; c.beginPath(); c.arc(hx, hy - 6 * s, 7 * s, 0, 7); c.fill();
      c.fillStyle = RED; c.beginPath(); c.ellipse(hx, hy - 12 * s, 10 * s, 6 * s, 0, 0, 7); c.fill();
      // the ear and the key line round it all, a hair off
      c.save(); c.translate(OFF.key[0], OFF.key[1]);
      c.strokeStyle = KEY; c.lineWidth = 2.6; path(c, pts); c.stroke();
      c.beginPath(); c.moveTo(...P(140, 22)); c.quadraticCurveTo(...P(120, 50), ...P(146, 78)); c.stroke();
      c.fillStyle = KEY; c.beginPath(); c.arc(...P(164, 36), 2.6 * s, 0, 7); c.fill();
      c.beginPath(); c.moveTo(...P(156, 88)); c.quadraticCurveTo(...P(170, 100), ...P(176, 90)); c.strokeStyle = CLOTH; c.lineWidth = 4 * s; c.stroke();
      c.restore();
    }, { t, d: 0.6, reveal: 'slide', ease: 'out', dx: -60 });
  };
  const camel = (x, s, t, cart) => {
    const pts = shapeAt(CAM, x, y, s, 200, 168);
    const P = (u, v) => [x + (u - 100) * s, y - (168 - v) * s];
    p.group('frieze', bx(x - 260 * s, y - 200 * s, x + 110 * s, y + 4), (c) => {
      if (cart) {
        // a flat cart behind, with its load of sacks and a big spoked wheel
        const [cx0, cy0] = P(-140, 80);
        c.fillStyle = RED; c.fillRect(cx0, cy0, 130 * s, 14 * s);
        c.fillStyle = YELLOW; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(cx0 + (18 + k * 30) * s, cy0 - 12 * s, 16 * s, 12 * s, 0, 0, 7); c.fill(); }
        c.strokeStyle = KEY; c.lineWidth = 3; c.beginPath(); c.moveTo(cx0 + 130 * s, cy0 + 6 * s); c.lineTo(...P(40, 70)); c.stroke();
        const [wx, wy] = P(-75, 128);
        c.lineWidth = 4 * s; c.beginPath(); c.arc(wx, wy, 38 * s, 0, 7); c.stroke();
        c.lineWidth = 2; c.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.moveTo(wx, wy); c.lineTo(wx + Math.cos(a) * 38 * s, wy + Math.sin(a) * 38 * s); } c.stroke();
      }
      c.fillStyle = mix(YELLOW, RED, 0.25); path(c, pts); c.fill();
      // its saddle cloth and a tasseled halter
      c.fillStyle = INDIGO; path(c, [P(58, 40), P(120, 40), P(118, 70), P(62, 70)]); c.fill();
      c.fillStyle = CLOTH; for (let k = 0; k < 6; k++) { const [dx, dy] = P(66 + k * 10, 56); c.beginPath(); c.arc(dx, dy, 2.4 * s, 0, 7); c.fill(); }
      c.fillStyle = RED; for (let k = 0; k < 5; k++) { const [dx, dy] = P(150 + k * 6, 44 - k * 6); c.beginPath(); c.arc(dx, dy, 3 * s, 0, 7); c.fill(); }
      c.save(); c.translate(OFF.key[0], OFF.key[1]);
      c.strokeStyle = KEY; c.lineWidth = 2.6; path(c, pts); c.stroke();
      c.fillStyle = KEY; c.beginPath(); c.arc(...P(184, 14), 2.4 * s, 0, 7); c.fill();
      c.restore();
    }, { t, d: 0.6, reveal: 'slide', ease: 'out', dx: -60 });
  };
  const person = (x, s, t, col, load) => {
    p.group('frieze', bx(x - 20 * s, y - 120 * s, x + 20 * s, y + 4), (c) => {
      c.fillStyle = col; path(c, [[x - 12 * s, y - 70 * s], [x + 12 * s, y - 70 * s], [x + 16 * s, y - 20 * s], [x - 16 * s, y - 20 * s]]); c.fill();
      c.fillStyle = CLOTH; c.fillRect(x - 10 * s, y - 22 * s, 8 * s, 22 * s); c.fillRect(x + 2 * s, y - 22 * s, 8 * s, 22 * s);
      c.fillStyle = KEY; c.beginPath(); c.arc(x, y - 80 * s, 8 * s, 0, 7); c.fill();
      c.fillStyle = load ? YELLOW : RED; c.beginPath(); c.ellipse(x, y - 88 * s, 11 * s, 7 * s, 0, 0, 7); c.fill();
      if (load) { c.fillStyle = INDIGO; c.beginPath(); c.ellipse(x, y - 102 * s, 14 * s, 9 * s, 0, 0, 7); c.fill(); }
      c.strokeStyle = KEY; c.lineWidth = 2; c.strokeRect(x - 12 * s + OFF.key[0], y - 70 * s + OFF.key[1], 24 * s, 50 * s);
    }, { t, d: 0.5, reveal: 'drop' });
  };
  ele(330, 0.95, 9.4);
  person(470, 1, 9.55, INDIGO, true);
  camel(700, 0.9, 9.7, true);
  person(800, 1, 9.85, YELLOW, false);
  person(845, 0.95, 9.9, RED, true);
  ele(1010, 0.85, 10.0);
  camel(1300, 0.85, 10.15, false);
  person(1400, 1, 10.3, INDIGO, false);
  person(210, 1, 10.35, RED, false);
}

// ---------------------------------------------------------------- kites: a sky full of them, some tugging on their strings
function kite(c, x, y, s, a, c1, c2) {
  c.save(); c.translate(x, y); c.rotate(a);
  c.fillStyle = c1; path(c, [[0, -30 * s], [24 * s, 0], [0, 32 * s]]); c.fill();
  c.fillStyle = c2; path(c, [[0, -30 * s], [-24 * s, 0], [0, 32 * s]]); c.fill();
  c.fillStyle = c1; path(c, [[0, 30 * s], [8 * s, 42 * s], [-8 * s, 42 * s]]); c.fill();
  c.strokeStyle = KEY; c.lineWidth = 1.6; path(c, [[2, -28 * s], [26 * s, 2], [2, 34 * s], [-22 * s, 2]]); c.stroke();
  c.beginPath(); c.moveTo(-22 * s, 2); c.quadraticCurveTo(2, -16 * s, 26 * s, 2); c.stroke();
  c.restore();
}
function kites(p, r) {
  const cols = [[PINK, YELLOW], [INDIGO, RED], [RED, YELLOW], [YELLOW, INDIGO], [GREEN, PINK], [RED, CLOTH]];
  const still = [[260, 300, 0.9], [560, 250, 0.7], [640, 340, 0.55], [1030, 290, 0.8], [1210, 380, 0.65], [880, 235, 0.55], [430, 420, 0.5], [1340, 250, 0.9], [180, 470, 0.5], [1080, 410, 0.45]];
  still.forEach(([x, y, s], i) => {
    const [c1, c2] = cols[i % cols.length];
    const a = r.range(-0.35, 0.35);
    // the string falls away in a long sag toward the roofs
    const ex = x + r.range(-200, 200), ey = 900;
    p.group('kites', bx(Math.min(x, ex) - 40, y - 40, Math.max(x, ex) + 40, ey), (c) => {
      c.strokeStyle = 'rgba(42,27,27,.55)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y + 30 * s); c.quadraticCurveTo(x + (ex - x) * 0.2, ey - 120, ex, ey); c.stroke();
      kite(c, x, y, s, a, c1, c2);
    }, { t: 6.8 + i * 0.12, d: 0.6, reveal: 'fall' });
  });
  // three that dance on the wind
  const dancers = [[380, 240, 1.0, 0.3], [1180, 230, 1.1, 2.1], [720, 245, 0.7, 4.2]];
  dancers.forEach(([x, y, s, ph], i) => {
    const [c1, c2] = cols[(i + 3) % cols.length];
    const ex = x + (i - 1) * 260, ey = 900;
    p.live('kites', {
      t: 8.2 + i * 0.3, d: 0.8, box: bx(Math.min(x, ex) - 80, y - 80, Math.max(x, ex) + 80, ey),
      draw: (c, time) => {
        const kx = x + Math.sin(time * 0.9 + ph) * 26, ky = y + Math.sin(time * 1.3 + ph * 2) * 14;
        c.strokeStyle = 'rgba(42,27,27,.55)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(kx, ky + 30 * s); c.quadraticCurveTo(kx + (ex - kx) * 0.2, ey - 140, ex, ey); c.stroke();
        kite(c, kx, ky, s, Math.sin(time * 1.7 + ph) * 0.3, c1, c2);
      },
    });
  });
  // pigeons over the crown, circling
  const birds = [];
  for (let k = 0; k < 7; k++) birds.push([r.range(0, 6.28), r.range(90, 180), r.range(0.4, 0.7)]);
  p.live('kites', {
    t: 7.6, d: 1, box: bx(500, 150, 1100, 460),
    draw: (c, time) => {
      c.strokeStyle = KEY; c.lineWidth = 2.2; c.lineCap = 'round';
      for (const [ph, R, w] of birds) {
        const a = ph + time * w, x = 800 + Math.cos(a) * R * 1.6, yy = 300 + Math.sin(a) * R * 0.4, f = Math.sin(time * 9 + ph) * 4;
        c.beginPath(); c.moveTo(x - 9, yy - f); c.quadraticCurveTo(x - 4, yy - 4, x, yy); c.quadraticCurveTo(x + 4, yy - 4, x + 9, yy - f); c.stroke();
      }
    },
  });
}

// ---------------------------------------------------------------- the name, printed in the border band
function title(p, r) {
  const y = 1858;
  // a cartouche in turmeric with a red edge, stamped first
  p.group('title', bx(150, TB + 30, W - 150, H - 70), (c) => {
    c.translate(OFF.yellow[0], OFF.yellow[1]);
    c.fillStyle = mix(YELLOW, CLOTH, 0.7);
    c.beginPath(); c.moveTo(200, TB + 40); c.lineTo(W - 200, TB + 40); c.quadraticCurveTo(W - 160, (TB + H - 70) / 2, W - 200, H - 70); c.lineTo(200, H - 70); c.quadraticCurveTo(160, (TB + H - 70) / 2, 200, TB + 40); c.fill();
  }, { t: 10.3, d: 0.4, reveal: 'fade' });
  p.group('title', bx(150, TB + 30, W - 150, H - 70), (c) => {
    c.translate(OFF.key[0], OFF.key[1]);
    c.strokeStyle = RED; c.lineWidth = 4;
    c.beginPath(); c.moveTo(200, TB + 40); c.lineTo(W - 200, TB + 40); c.quadraticCurveTo(W - 160, (TB + H - 70) / 2, W - 200, H - 70); c.lineTo(200, H - 70); c.quadraticCurveTo(160, (TB + H - 70) / 2, 200, TB + 40); c.stroke();
    c.fillStyle = RED; for (const x of [250, W - 250]) { buti(c, x, (TB + H - 40) / 2 + 6, 1.6); }
  }, { t: 10.6, d: 0.4, reveal: 'fade' });
  // जयपुर, whole, wiped in as the block is lifted
  p.group('title', bx(260, TB + 20, 900, H - 40), (c) => {
    c.font = `700 140px ${DEV}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = INDIGO; c.fillText('जयपुर', 590 + OFF.indigo[0] + 4, y + OFF.indigo[1] + 4);
    c.fillStyle = RED; c.fillText('जयपुर', 590, y);
  }, { t: 10.9, d: 1.1, reveal: 'wipe', ease: 'inOut' });
  // a red rule and the Latin name beside it
  p.group('title', bx(940, TB + 50, 950, H - 90), (c) => { c.fillStyle = RED; c.fillRect(942, TB + 60, 4, H - 150 - TB); }, { t: 11.6, d: 0.5, reveal: 'fall' });
  p.type('title', 'JAIPUR', 1000, 1840, { family: DEV, weight: 700, size: 92, color: INDIGO, track: 0.06, t: 11.8, gap: 0.1, d: 0.5, reveal: 'press' });
  p.type('title', 'THE PINK CITY · RAJASTHAN', 1002, 1890, { family: DEV, weight: 400, size: 25, color: RED, track: 0.06, t: 12.4, gap: 0.03, d: 0.4, reveal: 'fade' });
}

// ---------------------------------------------------------------- where the dye did not take: specks of bare cloth over the print
function specks(p, r) {
  const sp = [];
  for (let i = 0; i < 2600; i++) sp.push([r.range(110, W - 110), r.range(40, H - 40), r.range(0.8, 2.6)]);
  p.group('specks', bx(0, 0, W, H, 0), (c) => {
    c.fillStyle = 'rgba(239,226,198,.55)';
    for (const [x, y, s] of sp) c.fillRect(x, y, s, s * 0.7);
  }, { t: 12.8, d: 0.5, reveal: 'fade' });
}
