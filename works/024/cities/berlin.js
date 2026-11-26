// Berlin: a Bauhaus poster. Everything is a circle, a bar or a square, set square
// to a grid of thin rules on cream. The Fernsehturm is a gray bar with a ball on
// it, standing in a great yellow disc; the Brandenburg Gate is six columns and two
// bars in front of a red square; the Reichstag's glass dome is a blue half circle
// ruled like a diagram, with a slab of prefab flats behind it. The Siegessäule is
// a black rod with gold rings. Under it all the Oberbaumbrücke crosses a blue
// band of Spree on its red arches, and the yellow U-Bahn runs along its top.
// Small numbers key the landmarks to a list under the name, like a type specimen.

import { Plate, W } from '../print.js';
import { poly } from '../kit.js';

const PAPER = '#ece5d2', INK = '#1a1918', RED = '#cf2e1f', RED_D = '#a3231a', YEL = '#f0b72a', YEL_D = '#d99c18';
const BLUE = '#1f4f9b', BLUE_D = '#173c78', GRAY = '#9d998d', GRAY_L = '#c9c3b2', GRAY_D = '#6f6b62', CREAM = '#f6f1e3';
const F = 'Syne, sans-serif';

const LIST = [
  ['1', 'Fernsehturm', '368 m · 1969'],
  ['2', 'Brandenburger Tor', '1791'],
  ['3', 'Reichstag', 'Kuppel 1999'],
  ['4', 'Siegessäule', '67 m · 1873'],
  ['5', 'Oberbaumbrücke', 'U1 · 1896'],
];
const WORDS = 'BERLIN Berlin 52°31′N 13°24′E Spree Mitte Kreuzberg Friedrichshain Tiergarten Plattenbau U-Bahn Linie' +
  LIST.flat().join(' ') + ' 0123456789·—–';

export const city = {
  id: 'berlin', name: 'Berlin', wall: '#1d2a44',
  alt: 'A Bauhaus poster of circles, bars and squares on a grid of thin rules: the Fernsehturm in a great yellow disc, the Brandenburg Gate with its quadriga in front of a red square, the Siegessäule, the Reichstag with its glass dome before a slab of prefab flats, linden trees and small walking figures, and the Oberbaumbrücke over a blue band of the Spree with a yellow U-Bahn train on top, the landmarks numbered and listed under the name',
  google: 'family=Syne:wght@400;600;800',
  fonts: [['800 100px Syne', WORDS], ['600 100px Syne', WORDS], ['400 100px Syne', WORDS]],
  build,
};

// the grid: twelve columns between the margins, rules every 120 down
const ML = 90, MR = W - 90, COL = (MR - ML) / 12;
const GROUND = 1180; // the top of the black ground bar
// the Fernsehturm's axis and its ball
const TX = 1010, BY = 594, BR = 74;

function build() {
  const p = new Plate({ paper: PAPER, seed: 1919 });
  const r = p.r;
  p.stack('fields', 'grid', 'back', 'tower', 'gate', 'right', 'bridge', 'street', 'keys', 'live', 'title');

  fields(p);
  grid(p);
  tower(p);
  gate(p);
  victory(p);
  reichstag(p, r);
  bridge(p, r);
  street(p, r);
  keys(p);
  life(p);
  title(p);
  return p;
}

const rect = (c, x, y, w, h) => { c.rect(x, y, w, h); };
const disc = (c, x, y, rr) => { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); };

// ================================================================ fields of color
function fields(p) {
  // the yellow disc behind the tower's ball
  const D = 330;
  p.group('fields', { x: TX - D - 6, y: BY - D - 6, w: 2 * D + 12, h: 2 * D + 12 }, (c) => {
    c.fillStyle = YEL; c.beginPath(); disc(c, TX, BY, D); c.fill();
    // a second, thin ring outside it, printed a little off
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.arc(TX, BY, D + 22, 0, Math.PI * 2); c.stroke();
  }, { t: 1.0, d: 1.5, reveal: 'iris', ease: 'inOut' });
  // the red square behind the gate
  p.group('fields', { x: 260, y: 700, w: 480, h: 480 }, (c) => {
    c.fillStyle = RED; c.fillRect(260, 700, 480, 480);
  }, { t: 1.7, d: 1.0, reveal: 'rise', ease: 'inOut' });
  // the Spree: a blue band under the bridge
  p.group('fields', { x: ML, y: 1330, w: MR - ML, h: 236 }, (c) => {
    c.fillStyle = BLUE; c.fillRect(ML, 1330, MR - ML, 230);
    // the water ruled in cream hairlines, thinning toward the bottom
    c.strokeStyle = 'rgba(246,241,227,.55)'; c.beginPath();
    for (let y = 1446, k = 0; y < 1556; y += 6 + k * 0.5, k++) { c.lineWidth = Math.max(0.5, 1.6 - k * 0.07); c.moveTo(ML + 10, y); c.lineTo(MR - 10, y); }
    c.stroke();
  }, { t: 2.0, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // the header bar and a short blue one
  p.group('fields', { x: ML, y: 150, w: 640, h: 22 }, (c) => {
    c.fillStyle = INK; c.fillRect(ML, 150, 620, 18);
  }, { t: 0.7, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  p.group('fields', { x: MR - 160, y: 150, w: 160, h: 22 }, (c) => {
    c.fillStyle = BLUE; c.fillRect(MR - 150, 150, 150, 18);
  }, { t: 1.0, d: 0.7, reveal: 'wipeL', ease: 'inOut' });
  // the ground bar
  p.group('fields', { x: ML, y: GROUND - 4, w: MR - ML, h: 24 }, (c) => {
    c.fillStyle = INK; c.fillRect(ML, GROUND, MR - ML, 14);
  }, { t: 2.4, d: 1.1, reveal: 'wipe', ease: 'inOut' });
  // the bar under the title
  p.group('fields', { x: ML, y: 1842, w: MR - ML, h: 14 }, (c) => {
    c.fillStyle = INK; c.fillRect(ML, 1844, MR - ML, 6);
  }, { t: 2.7, d: 1.2, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ the grid
function grid(p) {
  const v = [], h = [];
  for (let i = 0; i <= 12; i++) v.push([[ML + i * COL, 60], [ML + i * COL, 1940]]);
  for (let y = 120; y <= 1920; y += 120) h.push([[40, y], [W - 40, y]]);
  p.strokes('grid', v, 'rgba(26,25,24,.16)', 1, { t: 0.15, d: 1.3, reveal: 'fall', ease: 'inOut', box: { x: 0, y: 0, w: W, h: 2000 } });
  p.strokes('grid', h, 'rgba(26,25,24,.12)', 1, { t: 0.4, d: 1.3, reveal: 'wipe', ease: 'inOut', box: { x: 0, y: 0, w: W, h: 2000 } });
  // crop and register marks at the corners, as on a proof
  const ticks = [];
  for (const [x, y] of [[ML, 60], [MR, 60], [ML, 1940], [MR, 1940]]) {
    ticks.push([[x - 30, y], [x - 10, y]], [[x + 10, y], [x + 30, y]], [[x, y - 30], [x, y - 10]], [[x, y + 10], [x, y + 30]]);
  }
  p.strokes('grid', ticks, INK, 1.2, { t: 0.9, d: 0.5, reveal: 'fade' });
  p.group('grid', { x: 0, y: 0, w: W, h: 2000 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 1.1;
    for (const [x, y] of [[W / 2, 60], [W / 2, 1940]]) {
      c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.moveTo(x - 16, y); c.lineTo(x + 16, y); c.moveTo(x, y - 16); c.lineTo(x, y + 16); c.stroke();
    }
  }, { t: 1.1, d: 0.5, reveal: 'fade' });
  // the header line
  p.type('grid', 'BERLIN — MITTE · TIERGARTEN · FRIEDRICHSHAIN', ML, 132, { family: F, weight: 600, size: 19, color: INK, track: 0.18, t: 1.2, gap: 0.012, d: 0.4, reveal: 'fade' });
  p.type('grid', '52°31′N  13°24′E', MR, 132, { family: F, weight: 600, size: 19, color: INK, track: 0.14, align: 'right', t: 1.5, gap: 0.02, d: 0.4, reveal: 'fade' });
}

// ================================================================ the Fernsehturm
function tower(p) {
  const top = 140, neck = 470, ballTop = BY - BR, ballBot = BY + BR;
  // the folded roofs of the pavilion round its foot
  p.group('tower', { x: TX - 150, y: GROUND - 60, w: 300, h: 64 }, (c) => {
    c.fillStyle = GRAY_L; c.beginPath();
    for (let i = 0; i < 6; i++) { const x = TX - 140 + i * 47; c.moveTo(x, GROUND); c.lineTo(x + 23.5, GROUND - 40); c.lineTo(x + 47, GROUND); }
    c.fill();
    c.fillStyle = GRAY_D; c.beginPath();
    for (let i = 0; i < 6; i++) { const x = TX - 140 + i * 47; c.moveTo(x + 23.5, GROUND); c.lineTo(x + 23.5, GROUND - 40); c.lineTo(x + 47, GROUND); }
    c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath();
    for (let i = 0; i < 6; i++) { const x = TX - 140 + i * 47; c.moveTo(x, GROUND); c.lineTo(x + 23.5, GROUND - 40); c.lineTo(x + 47, GROUND); }
    c.stroke();
  }, { t: 3.0, d: 0.8, reveal: 'rise' });
  // the shaft: a long tapering bar with a shadow side and joints
  const shaft = [[TX - 31, GROUND], [TX + 31, GROUND], [TX + 17, ballBot - 6], [TX - 17, ballBot - 6]];
  p.group('tower', { x: TX - 40, y: ballBot - 12, w: 80, h: GROUND - ballBot + 16 }, (c) => {
    c.fillStyle = GRAY_L; poly(c, shaft); c.fill();
    c.fillStyle = GRAY; poly(c, [[TX + 4, GROUND], [TX + 31, GROUND], [TX + 17, ballBot - 6], [TX + 2, ballBot - 6]]); c.fill();
    c.strokeStyle = 'rgba(26,25,24,.35)'; c.lineWidth = 1; c.beginPath();
    for (let y = GROUND - 40; y > ballBot; y -= 46) { const k = (GROUND - y) / (GROUND - ballBot); const w = 31 - 14 * k; c.moveTo(TX - w, y); c.lineTo(TX + w, y); }
    c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.6; poly(c, shaft); c.stroke();
  }, { t: 3.3, d: 1.6, reveal: 'rise', ease: 'inOut' });
  // the stem above the ball and the antenna, in red and white bands
  p.group('tower', { x: TX - 20, y: neck - 4, w: 40, h: ballTop - neck + 10 }, (c) => {
    c.fillStyle = GRAY_L; c.fillRect(TX - 12, neck, 24, ballTop - neck + 4);
    c.fillStyle = GRAY; c.fillRect(TX + 1, neck, 11, ballTop - neck + 4);
    c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(TX - 12, neck, 24, ballTop - neck + 4);
  }, { t: 4.6, d: 0.6, reveal: 'rise' });
  const bands = 12, bh = (neck - top) / bands;
  for (let i = 0; i < bands; i++) {
    const y1 = neck - i * bh, y0 = y1 - bh, w = 8 - i * 0.35;
    p.group('tower', { x: TX - 12, y: y0 - 4, w: 24, h: bh + 8 }, (c) => {
      c.fillStyle = i % 2 ? CREAM : RED; c.fillRect(TX - w, y0, 2 * w, bh + 0.5);
      c.strokeStyle = INK; c.lineWidth = 1.1; c.strokeRect(TX - w, y0, 2 * w, bh + 0.5);
    }, { t: 5.0 + i * 0.07, d: 0.35, reveal: 'rise' });
  }
  p.group('tower', { x: TX - 4, y: top - 26, w: 8, h: 30 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(TX, top); c.lineTo(TX, top - 22); c.stroke();
  }, { t: 5.9, d: 0.3, reveal: 'rise' });
  // the ball: gray, with its steel facets as a net of latitude and longitude
  p.group('tower', { x: TX - BR - 8, y: BY - BR - 8, w: 2 * BR + 16, h: 2 * BR + 16 }, (c) => {
    c.fillStyle = GRAY_L; c.beginPath(); disc(c, TX, BY, BR); c.fill();
    c.save(); c.beginPath(); disc(c, TX, BY, BR); c.clip();
    c.fillStyle = GRAY; c.beginPath(); c.arc(TX + BR * 0.55, BY + BR * 0.1, BR * 1.05, 0, Math.PI * 2); c.fill();
    c.fillStyle = GRAY_L; c.beginPath(); c.arc(TX - BR * 0.25, BY - BR * 0.05, BR * 0.92, 0, Math.PI * 2); c.fill();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); disc(c, TX, BY, BR); c.stroke();
  }, { t: 4.2, d: 0.9, reveal: 'iris', ease: 'out' });
  p.group('tower', { x: TX - BR - 4, y: BY - BR - 4, w: 2 * BR + 8, h: 2 * BR + 8 }, (c) => {
    c.save(); c.beginPath(); disc(c, TX, BY, BR - 1); c.clip();
    c.strokeStyle = 'rgba(26,25,24,.5)'; c.lineWidth = 0.9; c.beginPath();
    for (let k = -5; k <= 5; k++) { const y = BY + (k / 6) * BR; const w = Math.sqrt(BR * BR - (y - BY) ** 2); c.moveTo(TX - w, y); c.lineTo(TX + w, y); }
    for (let k = -5; k <= 5; k++) { const rx = Math.abs(k / 6) * BR; c.moveTo(TX + (k < 0 ? -rx : rx), BY - BR); c.ellipse(TX, BY, rx || 0.01, BR, 0, -Math.PI / 2, Math.PI / 2, k < 0); }
    c.stroke();
    // the window band of the café, a little under the middle
    c.fillStyle = INK; c.fillRect(TX - BR, BY + 6, 2 * BR, 16);
    c.fillStyle = YEL; c.beginPath();
    for (let x = TX - BR + 4; x < TX + BR - 6; x += 9) c.rect(x, BY + 9, 5, 10);
    c.fill();
    c.fillStyle = INK; c.fillRect(TX - BR, BY - 6, 2 * BR, 4);
    c.restore();
  }, { t: 5.0, d: 0.8, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ the Brandenburg Gate
function gate(p) {
  const x0 = 230, x1 = 770, cx = 500, foot = GROUND, colTop = foot - 196, archY = colTop - 34, atticY = archY - 40;
  // the low wings at either side
  p.group('gate', { x: x0 - 8, y: foot - 120, w: x1 - x0 + 16, h: 124 }, (c) => {
    for (const [a, b] of [[x0, x0 + 70], [x1 - 70, x1]]) {
      c.fillStyle = CREAM; c.fillRect(a, foot - 104, b - a, 104);
      c.fillStyle = INK; c.fillRect(a - 4, foot - 116, b - a + 8, 14);
      c.fillStyle = GRAY; c.beginPath();
      for (let x = a + 10; x < b - 10; x += 16) c.rect(x, foot - 92, 6, 92);
      c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(a, foot - 104, b - a, 104);
    }
  }, { t: 3.6, d: 0.8, reveal: 'rise' });
  // the six columns, fluted, the middle passage widest
  const xs = [300, 368, 436, 564, 632, 700];
  xs.forEach((x, i) => {
    p.group('gate', { x: x - 20, y: colTop - 6, w: 40, h: foot - colTop + 8 }, (c) => {
      c.fillStyle = CREAM; c.fillRect(x - 15, colTop, 30, foot - colTop);
      c.fillStyle = GRAY_L; c.fillRect(x + 4, colTop, 11, foot - colTop);
      c.strokeStyle = 'rgba(26,25,24,.45)'; c.lineWidth = 0.9; c.beginPath();
      for (let k = -2; k <= 2; k++) { c.moveTo(x + k * 5.5, colTop + 8); c.lineTo(x + k * 5.5, foot - 10); }
      c.stroke();
      c.fillStyle = INK; c.fillRect(x - 19, foot - 10, 38, 10); c.fillRect(x - 19, colTop, 38, 7);
      c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(x - 15, colTop, 30, foot - colTop);
    }, { t: 3.9 + i * 0.16, d: 0.8, reveal: 'rise', ease: 'inOut' });
  });
  // the entablature, its triglyphs as a row of small bars, and the attic
  p.group('gate', { x: x0 + 30, y: atticY - 6, w: x1 - x0 - 60, h: colTop - atticY + 10 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(270, archY, 460, 34);
    c.fillStyle = INK; c.fillRect(266, archY + 22, 468, 3);
    c.beginPath(); for (let x = 276; x < 724; x += 17) c.rect(x, archY + 4, 7, 16); c.fill();
    c.fillRect(262, archY - 5, 476, 6);
    c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(270, archY, 460, 34);
    // the attic, stepped up in the middle, with its relief panel as a band of short strokes
    c.fillStyle = CREAM; c.fillRect(300, atticY, 400, 40 - 5); c.fillRect(410, atticY - 18, 180, 18);
    c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(300, atticY, 400, 35); c.strokeRect(410, atticY - 18, 180, 18);
    c.fillStyle = GRAY; c.fillRect(322, atticY + 9, 356, 16);
    c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath();
    for (let x = 326; x < 676; x += 6) { c.moveTo(x, atticY + 11); c.lineTo(x + 3, atticY + 23); }
    c.stroke();
  }, { t: 5.0, d: 0.7, reveal: 'drop', dy: 30 });
  // the quadriga seen from the front: four horses, the outer two turning their heads
  // out, the chariot behind them and Victoria holding up her standard with its wreath
  const qy = atticY - 18;
  p.group('gate', { x: cx - 100, y: qy - 130, w: 200, h: 134 }, (c) => {
    c.fillStyle = INK;
    c.fillRect(cx - 70, qy - 7, 140, 7);
    // the chariot box and its wheel
    c.fillRect(cx - 26, qy - 46, 52, 22);
    // Victoria: robe, head, the wings spread behind
    poly(c, [[cx - 11, qy - 44], [cx + 11, qy - 44], [cx + 6, qy - 86], [cx - 6, qy - 86]]); c.fill();
    c.beginPath(); c.arc(cx, qy - 94, 7.5, 0, Math.PI * 2); c.fill();
    poly(c, [[cx - 6, qy - 82], [cx - 40, qy - 108], [cx - 34, qy - 92], [cx - 8, qy - 70]]); c.fill();
    poly(c, [[cx + 6, qy - 82], [cx + 34, qy - 104], [cx + 30, qy - 90], [cx + 8, qy - 70]]); c.fill();
    c.fillRect(cx + 17, qy - 126, 3.5, 84);
    c.fillRect(cx + 4, qy - 84, 14, 4);
    c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.arc(cx + 18.75, qy - 120, 9, 0, Math.PI * 2); c.stroke();
    // the horses: a round chest, two forelegs, the neck and head as a slanting wedge
    const hs = [[-58, -1, 1.25], [-22, -1, 0.35], [22, 1, 0.35], [58, 1, 1.25]];
    for (const [ox, dir, turn] of hs) {
      const hx = cx + ox;
      c.fillStyle = INK;
      c.beginPath(); c.ellipse(hx, qy - 30, 11, 14, 0, 0, Math.PI * 2); c.fill();
      c.fillRect(hx - 8, qy - 22, 4, 16); c.fillRect(hx + 4, qy - 26, 4, 12);
      // a raised foreleg, bent
      poly(c, [[hx + dir * 2, qy - 24], [hx + dir * 14, qy - 30], [hx + dir * 16, qy - 20], [hx + dir * 12, qy - 18], [hx + dir * 11, qy - 25], [hx + dir * 2, qy - 19]]); c.fill();
      const nx = hx + dir * 10 * turn, top = qy - 66;
      poly(c, [[hx - 7, qy - 36], [hx + 7, qy - 36], [nx + 5 * dir + 4, top + 8], [nx + dir * 6, top], [nx - 4, top + 2], [nx - 6, top + 14]]); c.fill();
      // the mane as a cream notch line
      c.strokeStyle = RED; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hx - dir * 3, qy - 40); c.lineTo(nx - dir * 1, top + 8); c.stroke();
    }
  }, { t: 5.5, d: 0.8, reveal: 'pop', ease: 'back' });
}

// ================================================================ the Siegessäule
function victory(p) {
  const x = 150, foot = GROUND;
  p.group('back', { x: x - 60, y: foot - 140, w: 120, h: 144 }, (c) => {
    // the square base and the round hall of columns
    c.fillStyle = GRAY_L; c.fillRect(x - 52, foot - 60, 104, 60);
    c.fillStyle = INK; c.fillRect(x - 56, foot - 66, 112, 8);
    c.fillStyle = CREAM; c.fillRect(x - 40, foot - 118, 80, 52);
    c.fillStyle = INK; c.beginPath();
    for (let k = 0; k < 7; k++) c.rect(x - 38 + k * 12, foot - 116, 4, 50);
    c.fill();
    c.fillRect(x - 44, foot - 126, 88, 9);
    c.strokeStyle = INK; c.lineWidth = 1.3; c.strokeRect(x - 52, foot - 60, 104, 60); c.strokeRect(x - 40, foot - 118, 80, 52);
    c.strokeStyle = 'rgba(26,25,24,.35)'; c.lineWidth = 0.9; c.beginPath();
    for (let y = foot - 48; y < foot; y += 12) { c.moveTo(x - 52, y); c.lineTo(x + 52, y); }
    c.stroke();
  }, { t: 6.2, d: 0.8, reveal: 'rise' });
  const c0 = foot - 126, c1 = 640;
  p.group('back', { x: x - 26, y: c1 - 30, w: 52, h: c0 - c1 + 34 }, (c) => {
    c.fillStyle = INK; c.fillRect(x - 11, c1, 22, c0 - c1);
    // the three gilded rings of cannon barrels
    for (const y of [c0 - 130, c0 - 230, c0 - 330]) {
      c.fillStyle = YEL; c.fillRect(x - 17, y, 34, 26);
      c.fillStyle = YEL_D; c.beginPath(); for (let k = 0; k < 6; k++) c.rect(x - 15 + k * 5.4, y + 3, 2.4, 20); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x - 17, y, 34, 26);
    }
    c.fillStyle = INK; c.fillRect(x - 18, c1, 36, 12); c.fillRect(x - 14, c1 - 16, 28, 16);
  }, { t: 6.6, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the gilded figure: a triangle of robe, a disc of head, a wing and a raised wreath
  p.group('back', { x: x - 50, y: c1 - 120, w: 100, h: 106 }, (c) => {
    c.fillStyle = YEL; c.strokeStyle = INK; c.lineWidth = 1.3;
    poly(c, [[x - 12, c1 - 16], [x + 12, c1 - 16], [x + 4, c1 - 66], [x - 4, c1 - 66]]); c.fill(); c.stroke();
    c.beginPath(); c.arc(x, c1 - 74, 7, 0, Math.PI * 2); c.fill(); c.stroke();
    poly(c, [[x - 2, c1 - 62], [x - 40, c1 - 98], [x - 30, c1 - 60], [x - 4, c1 - 48]]); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x + 4, c1 - 60); c.lineTo(x + 24, c1 - 94); c.stroke();
    c.beginPath(); c.arc(x + 26, c1 - 102, 8, 0, Math.PI * 2); c.lineWidth = 3; c.strokeStyle = YEL_D; c.stroke();
  }, { t: 7.7, d: 0.7, reveal: 'pop', ease: 'back' });
}

// ================================================================ the Reichstag and the slab
function reichstag(p, r) {
  // a slab of prefab flats, ten stories of windows and balconies, behind
  const sx0 = 1250, sx1 = 1505, sy = 770;
  p.group('back', { x: sx0 - 4, y: sy - 4, w: sx1 - sx0 + 8, h: GROUND - sy + 8 }, (c) => {
    c.fillStyle = GRAY_L; c.fillRect(sx0, sy, sx1 - sx0, GROUND - sy);
    c.fillStyle = GRAY; c.fillRect(sx0, sy, 18, GROUND - sy);
    c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(sx0, sy, sx1 - sx0, GROUND - sy);
    c.fillStyle = INK; c.fillRect(sx0 - 4, sy - 8, sx1 - sx0 + 8, 8);
  }, { t: 2.9, d: 1.0, reveal: 'rise', ease: 'inOut' });
  // windows, a few lit yellow or hung with a blue blind, set row by row
  const rows = 16, cols = 11;
  const lit = [], blind = [];
  for (let i = 0; i < rows * cols; i++) { const u = r(); lit.push(u < 0.1); blind.push(u > 0.86); }
  for (let g = 0; g < 4; g++) {
    p.group('back', { x: sx0, y: sy, w: sx1 - sx0, h: GROUND - sy }, (c) => {
      const pane = (fill, test) => {
        c.fillStyle = fill; c.beginPath();
        for (let row = g * 4; row < g * 4 + 4; row++) for (let k = 0; k < cols; k++) {
          if (!test(row * cols + k)) continue;
          c.rect(sx0 + 26 + k * 21.5, GROUND - 30 - row * 25.5, 12, 15);
        }
        c.fill();
      };
      pane(INK, (i) => !lit[i] && !blind[i]);
      pane(YEL, (i) => lit[i]);
      pane(BLUE, (i) => blind[i]);
      // the joints between the panels
      c.strokeStyle = 'rgba(26,25,24,.3)'; c.lineWidth = 0.8; c.beginPath();
      for (let row = g * 4; row < g * 4 + 4; row++) { const y = GROUND - 9 - row * 25.5; c.moveTo(sx0 + 18, y); c.lineTo(sx1, y); }
      c.stroke();
    }, { t: 3.6 + g * 0.3, d: 0.6, reveal: 'rise' });
  }

  // the Reichstag: a long block with four corner towers and a portico of six columns
  const x0 = 1110, x1 = 1500, top = 1040, foot = GROUND;
  p.group('right', { x: x0 - 6, y: top - 40, w: x1 - x0 + 12, h: foot - top + 44 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(x0, top, x1 - x0, foot - top);
    for (const a of [x0, x1 - 58]) {
      c.fillStyle = CREAM; c.fillRect(a, top - 30, 58, foot - top + 30);
      c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(a, top - 30, 58, foot - top + 30);
      c.fillStyle = INK; c.fillRect(a - 3, top - 36, 64, 7);
    }
    c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(x0, top, x1 - x0, foot - top);
    c.fillStyle = INK; c.fillRect(x0, top - 6, x1 - x0, 6);
    // the rusticated base and two rows of windows
    c.fillStyle = GRAY_L; c.fillRect(x0 + 1, foot - 46, x1 - x0 - 2, 45);
    c.strokeStyle = 'rgba(26,25,24,.35)'; c.lineWidth = 0.8; c.beginPath();
    for (let y = foot - 36; y < foot; y += 10) { c.moveTo(x0, y); c.lineTo(x1, y); }
    c.stroke();
    c.fillStyle = INK; c.beginPath();
    for (let x = x0 + 10; x < x1 - 10; x += 16) {
      if (x > 1255 && x < 1355) continue;
      c.rect(x, top + 16, 7, 26); c.rect(x, foot - 36, 7, 18);
    }
    c.fill();
  }, { t: 6.0, d: 1.0, reveal: 'rise', ease: 'inOut' });
  // the portico and its pediment, inscribed in tiny capitals
  p.group('right', { x: 1240, y: top - 64, w: 130, h: foot - top + 66 }, (c) => {
    c.fillStyle = CREAM; poly(c, [[1248, top - 6], [1362, top - 6], [1305, top - 52]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    c.fillStyle = CREAM; c.fillRect(1250, top - 6, 110, 18); c.strokeRect(1250, top - 6, 110, 18);
    c.fillStyle = INK; c.font = `600 7px ${F}`; c.textAlign = 'center'; c.fillText('DEM DEUTSCHEN VOLKE', 1305, top + 7);
    c.fillStyle = CREAM; c.fillRect(1250, top + 12, 110, foot - top - 12);
    c.fillStyle = INK; c.fillRect(1250, top + 12, 110, foot - top - 12);
    c.fillStyle = CREAM; c.beginPath(); for (let k = 0; k < 6; k++) c.rect(1254 + k * 19.5, top + 12, 9, foot - top - 22); c.fill();
    c.fillStyle = GRAY_L; c.fillRect(1250, foot - 10, 110, 10);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(1250, top + 12, 110, foot - top - 12);
  }, { t: 6.5, d: 0.7, reveal: 'rise' });
  // the glass dome: a blue half disc ruled with ribs and its spiral ramp
  const dx = 1305, dy = top - 36, dr = 60;
  p.group('right', { x: dx - dr - 6, y: dy - dr - 6, w: 2 * dr + 12, h: dr + 12 }, (c) => {
    c.fillStyle = '#c4d0e0'; c.beginPath(); c.arc(dx, dy, dr, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = '#8fa5c8'; c.beginPath(); c.arc(dx, dy, dr, Math.PI * 1.55, 0); c.lineTo(dx, dy); c.closePath(); c.fill();
    c.strokeStyle = BLUE_D; c.lineWidth = 1; c.beginPath();
    for (let k = 1; k < 12; k++) { const rx = Math.abs(Math.cos((k / 12) * Math.PI)) * dr; c.moveTo(dx + (k < 6 ? -rx : rx), dy); c.ellipse(dx, dy, rx || 0.01, dr, 0, k < 6 ? Math.PI : 0, Math.PI * 1.5, k >= 6); }
    for (let k = 1; k < 6; k++) { const y = dy - (k / 6) * dr; const w = Math.sqrt(dr * dr - (y - dy) ** 2); c.moveTo(dx - w, y); c.lineTo(dx + w, y); }
    c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.arc(dx, dy, dr, Math.PI, 0); c.stroke();
    c.fillStyle = INK; c.fillRect(dx - dr - 4, dy - 2, 2 * dr + 8, 6); c.fillRect(dx - 9, dy - dr - 4, 18, 6);
  }, { t: 7.0, d: 0.9, reveal: 'iris' });
  p.group('right', { x: dx - dr, y: dy - dr, w: 2 * dr, h: dr }, (c) => {
    // the mirrored cone inside, and the ramp crossing it
    c.fillStyle = 'rgba(26,25,24,.55)'; poly(c, [[dx - 22, dy - dr + 6], [dx + 22, dy - dr + 6], [dx + 5, dy], [dx - 5, dy]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath();
    for (let k = 0; k < 4; k++) { const y = dy - 8 - k * 12; const w = Math.sqrt(dr * dr - (y - dy) ** 2) - 3; c.moveTo(dx - w, y + 4); c.lineTo(dx + w, y - 4); }
    c.stroke();
  }, { t: 7.6, d: 0.6, reveal: 'fall' });
}

// ================================================================ the Oberbaumbrücke
function bridge(p, r) {
  const y0 = 1262, deck = 1308, road = 1332, water = 1330, foot = 1446;
  // the big arches: a red wall with half round openings onto the water
  const spans = 7, sw = (MR - ML) / spans;
  p.group('bridge', { x: ML - 4, y: road - 4, w: MR - ML + 8, h: foot - road + 8 }, (c) => {
    c.fillStyle = RED; c.beginPath(); c.rect(ML, road, MR - ML, foot - road);
    for (let i = 0; i < spans; i++) {
      const a = ML + i * sw + 22, b = ML + (i + 1) * sw - 22, m = (a + b) / 2, rr = (b - a) / 2;
      c.moveTo(a, foot); c.lineTo(a, road + 40 + rr); c.arc(m, road + 40 + rr, rr, Math.PI, 0); c.lineTo(b, foot); c.closePath();
    }
    c.fill('evenodd');
    // the brick courses on the piers and the spandrels
    c.save(); c.clip('evenodd');
    c.strokeStyle = RED_D; c.lineWidth = 1; c.beginPath();
    for (let y = road + 10; y < foot; y += 8) { c.moveTo(ML, y); c.lineTo(MR, y); }
    c.stroke();
    c.restore();
    // the arch rings in black
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i < spans; i++) {
      const a = ML + i * sw + 22, b = ML + (i + 1) * sw - 22, m = (a + b) / 2, rr = (b - a) / 2;
      c.moveTo(a, foot); c.lineTo(a, road + 40 + rr); c.arc(m, road + 40 + rr, rr, Math.PI, 0); c.lineTo(b, foot);
    }
    c.stroke();
    c.fillStyle = INK; c.fillRect(ML, foot, MR - ML, 4);
  }, { t: 7.8, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // reflections of the arches in the water, as cream dashes
  const dash = [];
  for (let i = 0; i < spans; i++) {
    const m = ML + (i + 0.5) * sw;
    for (let k = 0; k < 4; k++) { const y = foot + 10 + k * 9, w = 40 - k * 8 + r.range(-4, 4); dash.push([[m - w, y], [m + w, y]]); }
  }
  p.strokes('bridge', dash, 'rgba(207,46,31,.75)', 2.2, { t: 8.6, d: 0.6, reveal: 'fade', cap: 'butt' });
  // the road deck and the viaduct of small arches that carries the U-Bahn
  p.group('bridge', { x: ML - 4, y: y0 - 4, w: MR - ML + 8, h: road - y0 + 10 }, (c) => {
    c.fillStyle = RED_D; c.fillRect(ML, deck, MR - ML, road - deck + 2);
    c.fillStyle = RED; c.beginPath(); c.rect(ML, y0, MR - ML, deck - y0);
    for (let x = ML + 10; x < MR - 30; x += 33) { c.moveTo(x, deck); c.lineTo(x, y0 + 26); c.arc(x + 11, y0 + 26, 11, Math.PI, 0); c.lineTo(x + 22, deck); c.closePath(); }
    c.fill('evenodd');
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath();
    for (let x = ML + 10; x < MR - 30; x += 33) { c.moveTo(x, deck); c.lineTo(x, y0 + 26); c.arc(x + 11, y0 + 26, 11, Math.PI, 0); c.lineTo(x + 22, deck); }
    c.stroke();
    c.fillStyle = INK; c.fillRect(ML, y0 - 4, MR - ML, 5); c.fillRect(ML, deck - 2, MR - ML, 4); c.fillRect(ML, road - 2, MR - ML, 4);
  }, { t: 8.3, d: 1.1, reveal: 'wipe', ease: 'inOut' });
  // the two towers in the middle, with battlements and steep caps
  for (const [x, k] of [[760, 0], [880, 1]]) {
    p.group('bridge', { x: x - 34, y: 1060, w: 68, h: road - 1056 }, (c) => {
      c.fillStyle = RED; c.fillRect(x - 24, 1150, 48, road - 1150);
      c.fillStyle = RED_D; c.fillRect(x + 8, 1150, 16, road - 1150);
      c.fillStyle = INK; c.beginPath();
      for (let j = 0; j < 4; j++) c.rect(x - 24 + j * 14, 1138, 8, 12);
      c.fill();
      c.fillRect(x - 28, 1148, 56, 5);
      c.fillStyle = INK; poly(c, [[x - 14, 1138], [x + 14, 1138], [x, 1068]]); c.fill();
      c.fillStyle = YEL; c.beginPath(); c.arc(x, 1068, 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = INK; c.beginPath();
      c.rect(x - 6, 1170, 12, 22); c.rect(x - 6, 1210, 12, 22); c.rect(x - 4, 1250, 8, 16);
      c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(x - 24, 1150, 48, road - 1150);
    }, { t: 9.0 + k * 0.25, d: 0.9, reveal: 'rise', ease: 'inOut' });
  }
}

// ================================================================ trees and people
function street(p, r) {
  // linden trees: discs on thin stems, in rows along the ground
  const trees = [];
  for (const x of [205, 790, 836, 1080, 1135, 1180, 1225]) trees.push([x + r.range(-3, 3), r.range(16, 22), r.pick([INK, GRAY_D, BLUE])]);
  trees.forEach(([x, rr, col], i) => {
    p.group('street', { x: x - rr - 4, y: GROUND - 70 - rr, w: 2 * rr + 8, h: rr + 74 }, (c) => {
      c.fillStyle = INK; c.fillRect(x - 1.5, GROUND - 46, 3, 46);
      c.fillStyle = col; c.beginPath(); c.arc(x, GROUND - 50 - rr * 0.6, rr, 0, Math.PI * 2); c.fill();
      c.strokeStyle = CREAM; c.lineWidth = 1.2; c.beginPath(); c.arc(x, GROUND - 50 - rr * 0.6, rr * 0.55, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
    }, { t: 9.4 + i * 0.1, d: 0.6, reveal: 'pop', ease: 'back' });
  });
  // small standing figures on the strip under the ground bar: a disc, a wedge, two legs
  const people = [];
  for (let i = 0; i < 14; i++) people.push([ML + 30 + i * 100 + r.range(-20, 20), r.pick([RED, BLUE, INK, YEL, INK]), r.chance(0.5), r.range(0.85, 1.1)]);
  for (let g = 0; g < 2; g++) {
    p.group('street', { x: ML, y: GROUND + 12, w: MR - ML, h: 52 }, (c) => {
      people.forEach(([x, col, skirt, s], i) => {
        if (i % 2 !== g) return;
        figure(c, x, 1258, s, col, skirt);
      });
    }, { t: 9.8 + g * 0.3, d: 0.6, reveal: 'drop', dy: 14 });
  }
}

// a Schlemmer figure: disc head, wedge torso, bar legs; its feet at (x, y)
function figure(c, x, y, s, col, skirt, step = 0) {
  c.fillStyle = INK;
  c.fillRect(x - 4 * s + step, y - 16 * s, 2.6 * s, 16 * s);
  c.fillRect(x + 1.4 * s - step, y - 16 * s, 2.6 * s, 16 * s);
  c.fillStyle = col;
  if (skirt) poly(c, [[x - 4 * s, y - 34 * s], [x + 4 * s, y - 34 * s], [x + 9 * s, y - 13 * s], [x - 9 * s, y - 13 * s]]);
  else poly(c, [[x - 8 * s, y - 34 * s], [x + 8 * s, y - 34 * s], [x + 4 * s, y - 15 * s], [x - 4 * s, y - 15 * s]]);
  c.fill();
  c.fillStyle = INK; c.beginPath(); c.arc(x, y - 40 * s, 5 * s, 0, Math.PI * 2); c.fill();
}

// ================================================================ the key
function keys(p) {
  // numbered discs beside each landmark
  const at = [[TX + 104, 360], [712, 728], [1092, 976], [196, 590], [1000, 1290]];
  at.forEach(([x, y], i) => {
    p.group('keys', { x: x - 20, y: y - 20, w: 40, h: 40 }, (c) => {
      c.fillStyle = i === 1 ? CREAM : INK; c.beginPath(); c.arc(x, y, 15, 0, Math.PI * 2); c.fill();
      c.fillStyle = i === 1 ? INK : CREAM; c.font = `600 17px ${F}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), x, y + 1);
    }, { t: 10.0 + i * 0.12, d: 0.5, reveal: 'pop', ease: 'back' });
  });
  // a thin leader from the tower's number to the ball
  p.pen('keys', [[TX + 89, 360], [TX + 30, 360], [TX + 30, BY - BR - 10]], INK, 1.2, { t: 10.3, d: 0.6, cap: 'butt' });
  // the list under the name, in five columns
  const cw = (MR - ML) / 5;
  LIST.forEach(([n, name, note], i) => {
    const x = ML + i * cw;
    p.group('keys', { x: x - 2, y: 1868, w: 30, h: 30 }, (c) => {
      c.fillStyle = i === 0 ? RED : INK; c.beginPath(); c.arc(x + 11, 1885, 11, 0, Math.PI * 2); c.fill();
      c.fillStyle = CREAM; c.font = `600 14px ${F}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, x + 11, 1886);
    }, { t: 12.4 + i * 0.12, d: 0.4, reveal: 'pop' });
    p.group('keys', { x: x + 26, y: 1868, w: cw - 30, h: 56 }, (c) => {
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.fillStyle = INK; c.font = `600 17px ${F}`; c.fillText(name, x + 30, 1892);
      c.fillStyle = GRAY_D; c.font = `400 15px ${F}`; c.fillText(note, x + 30, 1916);
    }, { t: 12.5 + i * 0.12, d: 0.5, reveal: 'wipe' });
  });
}

// ================================================================ what moves
function life(p) {
  // the U-Bahn: yellow cars running along the viaduct, out one side and in the other
  const L = 420, span = MR - ML + L;
  p.live('live', {
    t: 10.2, d: 0.8, reveal: 'fade', box: { x: ML, y: 1220, w: MR - ML, h: 50 },
    draw: (c, time) => {
      const x = ML - L + ((time - 10.2) * 95 + 520) % span;
      c.save(); c.beginPath(); c.rect(ML, 1200, MR - ML, 70); c.clip();
      for (let k = 0; k < 3; k++) {
        const a = x + k * 140;
        c.fillStyle = YEL; c.fillRect(a, 1228, 134, 30);
        c.fillStyle = INK; c.fillRect(a, 1250, 134, 4);
        c.beginPath(); for (let w = 0; w < 6; w++) c.rect(a + 10 + w * 20, 1234, 12, 10); c.fill();
      }
      c.restore();
    },
  });
  // a red light winking on the antenna's tip
  p.live('live', {
    t: 10.4, d: 0.5, reveal: 'fade', box: { x: TX - 10, y: 104, w: 20, h: 20 },
    draw: (c, time) => {
      const on = (Math.sin(time * 3) + 1) / 2;
      c.fillStyle = `rgba(207,46,31,${0.25 + 0.75 * on})`; c.beginPath(); c.arc(TX, 114, 5, 0, Math.PI * 2); c.fill();
    },
  });
  // a little excursion boat on the Spree
  p.live('live', {
    t: 10.6, d: 0.8, reveal: 'fade', box: { x: ML, y: 1440, w: MR - ML, h: 120 },
    draw: (c, time) => {
      const x = 1400 - ((time - 10.6) * 22) % 1250;
      c.save(); c.beginPath(); c.rect(ML, 1440, MR - ML, 120); c.clip(); c.translate(0, 40);
      c.fillStyle = CREAM; c.fillRect(x, 1474, 120, 12);
      c.fillStyle = INK; c.fillRect(x, 1484, 120, 4);
      c.fillStyle = CREAM; c.fillRect(x + 20, 1460, 76, 14);
      c.fillStyle = INK; c.beginPath(); for (let w = 0; w < 6; w++) c.rect(x + 24 + w * 12, 1463, 7, 7); c.fill();
      c.fillStyle = RED; c.fillRect(x + 100, 1452, 3, 22); c.fillRect(x + 103, 1452, 10, 6);
      c.restore();
    },
  });
  // two figures walking along the strip
  [[0, RED, false, 26], [1, BLUE, true, -18]].forEach(([i, col, skirt, v]) => {
    p.live('live', {
      t: 10.8 + i * 0.2, d: 0.6, reveal: 'fade', box: { x: ML, y: 1200, w: MR - ML, h: 60 },
      draw: (c, time) => {
        const run = MR - ML - 40, s = (time - 10.8) * v + (i ? 900 : 200);
        const x = ML + 20 + (((s % run) + run) % run);
        figure(c, x, 1258, 1, col, skirt, Math.sin(time * 6 + i) * 1.6);
      },
    });
  });
}

// ================================================================ the name
function title(p) {
  const t = p.type('title', 'BERLIN', W / 2, 1808, { family: F, weight: 800, size: 360, color: INK, align: 'center', fit: MR - ML, track: -0.01, t: 11.0, gap: 0.16, d: 0.8, reveal: 'press' });
  return t;
}
