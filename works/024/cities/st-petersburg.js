// St Petersburg: a page from a fairy-tale book, in Bilibin's manner. Flat
// decorative color inside a fine, even black line; a sky of banded color and
// curled clouds; water as rows of scalloped waves. Down the Griboyedov Canal to
// the Church of the Savior on Spilled Blood, its patterned onion domes and its
// gilded bell tower; the Admiralty's needle and St Isaac's gold dome over the
// roofs on the left, the spire of Peter and Paul on the right, the Mikhailovsky
// Garden, a footbridge with lanterns and a boat. The page is set in a frame of
// folk flowers on a vine, the title in Ruslan Display above.

import { Plate, W, H } from '../print.js';
import { mix, lerp, poly, rng } from '../kit.js';

// the inks of the page
const PAPER = '#efe3c4', INK = '#221a15', CREAM = '#f7efd9';
const RED = '#a8372a', RED_D = '#7e2519', OCHRE = '#c9933a', GOLD = '#d9a93c', GOLD_L = '#f0cf6e', GOLD_D = '#a87a26';
const GREEN = '#4d6a3c', GREEN_D = '#33492b', GREEN_L = '#7f9a5a', TEAL = '#3f6f6a', TEAL_D = '#2b4f4e', TEAL_L = '#6d9a8f';
const BLUE = '#45628f', BLUE_D = '#2f4568', BLUE_L = '#8aa6c4', SKY_T = '#a9c4bf', SKY_H = '#f2ddae';
const BRICK = '#a6513a', BRICK_D = '#7f3826', STONE = '#e9dcc0', STONE_D = '#c9b58f', GRANITE = '#9b8676', GRANITE_D = '#6f5b4e';
const YEL = '#e3bc62', PINK = '#d99a83', MINT = '#a9c2a0', SAND = '#ddc79a', ROOF = '#55665c';
const FIELD = '#ead8a4';

export const city = {
  id: 'st-petersburg', name: 'St Petersburg', wall: '#4a1d18',
  alt: "A fairy-tale book page in Bilibin's manner: the Church of the Savior on Spilled Blood with its patterned onion domes and gilded bell tower at the end of the Griboyedov Canal, the Admiralty's golden needle and St Isaac's dome over the roofs, the spire of Peter and Paul, the trees of the Mikhailovsky Garden, a footbridge with lanterns, a rowing boat and gulls, in a frame of folk flowers on a vine",
  google: 'family=Ruslan+Display',
  fonts: [['400 150px "Ruslan Display"', 'САНКТ-ПЕТЕРБУРГ SAINT PETERSBURG СПАСНАКРОВИ·АДМИРАЛТЕЙСТВОКАНАЛГРИБОЕДОВА1703']],
  build,
};

// the page: the frame's rules, the title panel, the picture and the foot panel
const OX = 34, F0 = 58, F1 = 150; // outer rule; the flower field between F0 and F1
const PX0 = F1 + 8, PX1 = W - F1 - 8, PY0 = 372, PY1 = 1632;
const TY0 = F0, TY1 = 340, BY0 = 1664, BY1 = H - F0;
const CX = 800, GY = 1262; // the church's middle and its foot

// pen lines are all INK; a helper to outline the current path
const ink = (c, w = 2) => { c.strokeStyle = INK; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
const fillInk = (c, col, w = 2) => { c.fillStyle = col; c.fill(); ink(c, w); };

function build() {
  const p = new Plate({ paper: PAPER, seed: 1703 });
  const r = p.r;
  p.clip = { x: PX0, y: PY0, w: PX1 - PX0, h: PY1 - PY0 };
  p.stack('sky', 'clouds', 'far', 'wings', 'church', 'domes', 'garden', 'water', 'near', 'life', 'frame', 'title');
  p.layer('frame', { clip: false });
  p.layer('title', { clip: false });

  frame(p, r);
  sky(p, r);
  skyline(p, r);
  wings(p, r);
  church(p, r);
  garden(p, r);
  canal(p, r);
  bridge(p, r);
  life(p, r);
  title(p, r);
  return p;
}

// ================================================================ the frame
function frame(p, r) {
  // the paper around the picture, and the panels
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = PAPER;
    c.beginPath(); c.rect(0, 0, W, H); c.rect(PX0, PY0, PX1 - PX0, PY1 - PY0); c.fill('evenodd');
  }, { t: 0, d: 0.1, reveal: 'none' });
  // the rules, drawn by the pen round the sheet
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
  p.pen('frame', rect(OX, OX, W - OX, H - OX), INK, 4, { t: 0.15, d: 1.3, cap: 'square' });
  p.pen('frame', rect(F0 - 6, F0 - 6, W - F0 + 6, H - F0 + 6), INK, 1.6, { t: 0.35, d: 1.3, cap: 'square' });
  // the red band between them, with cream pearls
  const band = (x, y, w, h, o, t) => p.group('frame', { x: x - 2, y: y - 2, w: w + 4, h: h + 4 }, (c) => {
    c.fillStyle = RED; c.fillRect(x, y, w, h);
    c.fillStyle = CREAM; c.beginPath();
    const L = o === 'h' ? w : h, n = Math.floor(L / 22);
    for (let i = 0; i < n; i++) {
      const s = (i + 0.5) * (L / n), px = o === 'h' ? x + s : x + w / 2, py = o === 'h' ? y + h / 2 : y + s;
      c.moveTo(px, py - 4.5); c.lineTo(px + 3.2, py); c.lineTo(px, py + 4.5); c.lineTo(px - 3.2, py); c.closePath();
    }
    c.fill();
  }, { t, d: 0.9, reveal: o === 'h' ? 'wipe' : 'fall', ease: 'inOut' });
  const bw = F0 - 6 - OX - 4;
  band(OX + 2, OX + 2, W - 2 * OX - 4, bw, 'h', 0.6);
  band(OX + 2, OX + 2 + bw, bw, H - 2 * OX - 4 - 2 * bw, 'v', 0.8);
  band(W - OX - 2 - bw, OX + 2 + bw, bw, H - 2 * OX - 4 - 2 * bw, 'v', 0.8);
  band(OX + 2, H - OX - 2 - bw, W - 2 * OX - 4, bw, 'h', 1.0);
  // the flower fields down both sides of the picture
  for (const side of [0, 1]) {
    const x0 = side ? PX1 + 8 : F0, x1 = side ? W - F0 : F1;
    p.group('frame', { x: x0 - 2, y: PY0 - 40, w: x1 - x0 + 4, h: PY1 - PY0 + 80 }, (c) => {
      c.fillStyle = FIELD; c.fillRect(x0, PY0 - 32, x1 - x0, PY1 - PY0 + 64);
      c.beginPath(); c.rect(x0, PY0 - 32, x1 - x0, PY1 - PY0 + 64); ink(c, 2);
    }, { t: 0.9, d: 0.8, reveal: 'fall', ease: 'inOut' });
  }
  // the title and foot panels
  for (const [y0, y1, t] of [[TY0, TY1, 1.0], [BY0, BY1, 1.2]]) {
    p.group('frame', { x: F0 - 2, y: y0 - 2, w: W - 2 * F0 + 4, h: y1 - y0 + 4 }, (c) => {
      c.fillStyle = CREAM; c.fillRect(F0, y0, W - 2 * F0, y1 - y0);
      c.beginPath(); c.rect(F0, y0, W - 2 * F0, y1 - y0); ink(c, 2);
      c.beginPath(); c.rect(F0 + 12, y0 + 12, W - 2 * F0 - 24, y1 - y0 - 24); ink(c, 1);
    }, { t, d: 0.9, reveal: 'iris', ease: 'inOut' });
  }
  // the vine: a stem that winds down each side, drawn by the pen
  const vines = [];
  for (const side of [0, 1]) {
    const mx = side ? (PX1 + 8 + W - F0) / 2 : (F0 + F1) / 2;
    const pts = [];
    const y0 = PY0 - 20, y1 = PY1 + 20, per = 150;
    for (let y = y0; y <= y1; y += 4) pts.push([mx + Math.sin(((y - y0) / per) * Math.PI * 2 + side * Math.PI) * 22, y]);
    vines.push({ mx, pts, per, y0, side });
    p.pen('frame', pts, GREEN_D, 4, { t: 1.4 + side * 0.15, d: 1.8, ease: 'inOut' });
  }
  // leaves and flowers along the vine: at each turn a tulip, between them leaves
  for (const v of vines) {
    const items = [];
    for (let k = 0; k * v.per / 2 + v.y0 <= v.pts[v.pts.length - 1][1] - 20; k++) {
      const y = v.y0 + v.per / 4 + k * v.per / 2;
      if (y > PY1 + 10) break;
      const dir = (k % 2 ? -1 : 1) * (v.side ? -1 : 1);
      items.push({ x: v.mx + dir * 22, y, dir, kind: k % 3 });
    }
    // grouped by threes, so the side fills in a few beats
    for (let g = 0; g < items.length; g += 3) {
      const set = items.slice(g, g + 3);
      const ys = set.map((s) => s.y);
      p.group('frame', { x: v.mx - 60, y: Math.min(...ys) - 70, w: 120, h: Math.max(...ys) - Math.min(...ys) + 140 }, (c) => {
        for (const s of set) folkFlower(c, s.x, s.y, s.dir, s.kind);
      }, { t: 2.0 + g * 0.09 + v.side * 0.1, d: 0.6, reveal: 'pop' });
    }
  }
  // the corners where the side fields meet the panels: a rosette in a square
  const corners = [[(F0 + F1) / 2, PY0 - 16], [(PX1 + 8 + W - F0) / 2, PY0 - 16], [(F0 + F1) / 2, PY1 + 16], [(PX1 + 8 + W - F0) / 2, PY1 + 16]];
  corners.forEach(([x, y], i) => {
    p.group('frame', { x: x - 50, y: y - 50, w: 100, h: 100 }, (c) => rosette(c, x, y, 34), { t: 3.0 + i * 0.12, d: 0.6, reveal: 'pop' });
  });
  // the gold rule round the picture itself
  p.group('frame', { x: PX0 - 10, y: PY0 - 10, w: PX1 - PX0 + 20, h: PY1 - PY0 + 20 }, (c) => {
    c.beginPath(); c.rect(PX0 - 4, PY0 - 4, PX1 - PX0 + 8, PY1 - PY0 + 8);
    c.strokeStyle = GOLD; c.lineWidth = 7; c.stroke();
    c.beginPath(); c.rect(PX0 - 8, PY0 - 8, PX1 - PX0 + 16, PY1 - PY0 + 16); ink(c, 1.6);
    c.beginPath(); c.rect(PX0, PY0, PX1 - PX0, PY1 - PY0); ink(c, 2.4);
    // twisted-rope ticks on the gold
    c.beginPath();
    for (let x = PX0; x < PX1; x += 9) { c.moveTo(x, PY0 - 7); c.lineTo(x + 5, PY0 - 1); c.moveTo(x, PY1 + 1); c.lineTo(x + 5, PY1 + 7); }
    for (let y = PY0; y < PY1; y += 9) { c.moveTo(PX0 - 7, y); c.lineTo(PX0 - 1, y + 5); c.moveTo(PX1 + 1, y); c.lineTo(PX1 + 7, y + 5); }
    c.strokeStyle = GOLD_D; c.lineWidth = 1.2; c.stroke();
  }, { t: 1.6, d: 1.2, reveal: 'iris', ease: 'inOut' });
}

// a folk tulip with two leaves, leaning off the vine
function folkFlower(c, x, y, dir, kind) {
  c.save(); c.translate(x, y); c.scale(dir * 1.25, 1.25);
  // the leaves: long, pointed, with a vein
  for (const [a, l] of [[-0.6, 30], [0.9, 26]]) {
    c.save(); c.rotate(a);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(l * 0.5, -10, l, 0); c.quadraticCurveTo(l * 0.5, 10, 0, 0);
    fillInk(c, kind === 1 ? GREEN_L : GREEN, 1.4);
    c.beginPath(); c.moveTo(3, 0); c.lineTo(l - 6, 0); ink(c, 0.8);
    c.restore();
  }
  // the flower on a short stalk
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -4, 16, -14); ink(c, 2.4);
  c.translate(18, -18); c.rotate(0.5);
  const col = [RED, BLUE, OCHRE][kind], hi = [GOLD_L, CREAM, RED][kind];
  // three petals, the middle one tallest
  c.beginPath();
  c.moveTo(-12, 6); c.bezierCurveTo(-20, -6, -16, -18, -8, -20); c.quadraticCurveTo(-6, -8, 0, -4);
  c.quadraticCurveTo(6, -8, 8, -20); c.bezierCurveTo(16, -18, 20, -6, 12, 6); c.closePath();
  fillInk(c, col, 1.5);
  c.beginPath(); c.moveTo(-6, 4); c.bezierCurveTo(-8, -10, -3, -22, 0, -26); c.bezierCurveTo(3, -22, 8, -10, 6, 4); c.closePath();
  fillInk(c, hi, 1.4);
  c.beginPath(); c.arc(0, 4, 3, 0, Math.PI * 2); fillInk(c, INK === col ? RED : GREEN_D, 1);
  // little dots down the middle petal, a Bilibin habit
  c.fillStyle = INK; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, -4 - i * 6, 1.1, 0, Math.PI * 2); c.fill(); }
  c.restore();
}

function rosette(c, x, y, rad) {
  c.beginPath(); c.rect(x - rad - 6, y - rad - 6, 2 * rad + 12, 2 * rad + 12); fillInk(c, RED, 2);
  c.beginPath(); c.rect(x - rad, y - rad, 2 * rad, 2 * rad); fillInk(c, CREAM, 1.2);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    c.save(); c.translate(x, y); c.rotate(a);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(rad * 0.38, -rad * 0.3, 0, -rad * 0.92); c.quadraticCurveTo(-rad * 0.38, -rad * 0.3, 0, 0);
    fillInk(c, k % 2 ? OCHRE : GREEN, 1.1);
    c.restore();
  }
  c.beginPath(); c.arc(x, y, rad * 0.28, 0, Math.PI * 2); fillInk(c, RED, 1.2);
  c.beginPath(); c.arc(x, y, rad * 0.1, 0, Math.PI * 2); c.fillStyle = GOLD_L; c.fill();
}

// ================================================================ the sky
function sky(p, r) {
  // banded, as if laid in flat washes one above the other
  const n = 9, y0 = PY0, y1 = 1150;
  for (let i = 0; i < n; i++) {
    const a = y0 + (i / n) * (y1 - y0), b = y0 + ((i + 1) / n) * (y1 - y0);
    const col = mix(SKY_T, SKY_H, (i / (n - 1)) ** 1.1);
    p.group('sky', { x: PX0, y: a - 2, w: PX1 - PX0, h: (i === n - 1 ? 520 : b - a) + 4 }, (c) => {
      c.fillStyle = col; c.fillRect(PX0, a, PX1 - PX0, i === n - 1 ? 520 : b - a + 1);
      // fine ruled lines in each band, closer near the horizon
      c.strokeStyle = mix(col, INK, 0.12); c.lineWidth = 0.8; c.beginPath();
      const step = lerp(18, 7, i / n);
      for (let y = a + step / 2; y < b; y += step) { c.moveTo(PX0, y); c.lineTo(PX1, y); }
      c.stroke();
    }, { t: 0.5 + i * 0.12, d: 0.7, reveal: 'fall', ease: 'inOut' });
  }
  // curled clouds: long flat rolls with spiral ends
  const clouds = [[330, 520, 360, 1], [1120, 470, 420, -1], [620, 700, 300, 1], [1290, 760, 260, -1], [260, 860, 220, 1]];
  clouds.forEach(([x, y, w, dir], i) => {
    p.group('clouds', { x: x - w / 2 - 60, y: y - 100, w: w + 120, h: 150 }, (c) => curlCloud(c, x, y, w, dir),
      { t: 1.5 + i * 0.22, d: 1.0, reveal: dir > 0 ? 'wipe' : 'wipeL', ease: 'inOut' });
  });
}

// a Bilibin cloud: a stack of three rolls, each ending in a curl
function curlCloud(c, x, y, w, dir) {
  c.save(); c.translate(x, y); c.scale(dir, 1);
  const rolls = [[-w * 0.5, 0, w, 30], [-w * 0.34, -30, w * 0.72, 27], [-w * 0.12, -56, w * 0.42, 23]];
  for (const [rx, ry, rw, rh] of rolls) {
    c.beginPath();
    c.moveTo(rx, ry + rh * 0.5);
    c.lineTo(rx + rw - rh * 0.5, ry + rh * 0.5);
    c.arc(rx + rw - rh * 0.5, ry, rh * 0.5, Math.PI / 2, -Math.PI / 2, true);
    c.lineTo(rx + rh * 0.6, ry - rh * 0.5);
    c.arc(rx + rh * 0.6, ry, rh * 0.5, -Math.PI / 2, Math.PI / 2, true);
    c.closePath();
    fillInk(c, CREAM, 1.6);
    // the curl at the right end
    c.beginPath();
    const cx = rx + rw - rh * 0.5, cy = ry;
    for (let k = 0; k <= 24; k++) { const a = -Math.PI / 2 + (k / 24) * Math.PI * 1.7, rr = rh * 0.45 * (1 - k / 32); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; k ? c.lineTo(px, py) : c.moveTo(px, py); }
    ink(c, 1.2);
    // a shadow line along the foot of each roll
    c.beginPath(); c.moveTo(rx + rh, ry + rh * 0.2); c.lineTo(rx + rw - rh * 1.1, ry + rh * 0.2);
    c.strokeStyle = BLUE_L; c.lineWidth = 4; c.stroke();
    c.beginPath(); c.moveTo(rx + rh * 1.6, ry - rh * 0.05); c.lineTo(rx + rw * 0.6, ry - rh * 0.05); c.strokeStyle = SKY_T; c.lineWidth = 1.6; c.stroke();
  }
  c.restore();
}

// ================================================================ far spires
function skyline(p, r) {
  // the Admiralty: a tower with a colonnade, a little dome and the golden needle
  const ax = 440, ab = 980;
  p.group('far', { x: ax - 70, y: 380, w: 140, h: ab - 380 + 10 }, (c) => {
    c.beginPath(); c.rect(ax - 52, ab - 140, 104, 140); fillInk(c, YEL, 1.6);
    c.beginPath(); c.rect(ax - 58, ab - 150, 116, 12); fillInk(c, STONE, 1.4);
    // the colonnade: white columns over a dark loggia
    c.beginPath(); c.rect(ax - 40, ab - 250, 80, 100); fillInk(c, YEL, 1.6);
    c.fillStyle = BRICK_D; c.fillRect(ax - 34, ab - 236, 68, 80);
    c.fillStyle = CREAM; for (let k = 0; k < 7; k++) c.fillRect(ax - 34 + k * 10.6, ab - 236, 4.5, 80);
    c.beginPath(); c.rect(ax - 46, ab - 262, 92, 14); fillInk(c, STONE, 1.3);
    // the arch below with its keystone
    c.beginPath(); c.moveTo(ax - 22, ab); c.lineTo(ax - 22, ab - 70); c.arc(ax, ab - 70, 22, Math.PI, 0); c.lineTo(ax + 22, ab); fillInk(c, BRICK_D, 1.4);
    // drum and small gold dome
    c.beginPath(); c.rect(ax - 26, ab - 300, 52, 38); fillInk(c, YEL, 1.4);
    c.beginPath(); c.moveTo(ax - 28, ab - 300); c.quadraticCurveTo(ax, ab - 352, ax + 28, ab - 300); c.closePath(); fillInk(c, GOLD, 1.4);
    // the needle
    c.beginPath(); c.moveTo(ax - 8, ab - 340); c.lineTo(ax, 430); c.lineTo(ax + 8, ab - 340); c.closePath(); fillInk(c, GOLD, 1.4);
    c.beginPath(); c.moveTo(ax - 2, ab - 345); c.lineTo(ax, 450); ink(c, 0.7);
    // the little ship that sails on top
    c.beginPath(); c.moveTo(ax - 16, 424); c.lineTo(ax + 16, 424); c.lineTo(ax + 11, 432); c.lineTo(ax - 11, 432); c.closePath(); fillInk(c, GOLD, 1.2);
    c.beginPath(); c.moveTo(ax, 424); c.lineTo(ax, 396); c.moveTo(ax - 9, 420); c.lineTo(ax - 9, 404); c.moveTo(ax + 9, 420); c.lineTo(ax + 9, 404); ink(c, 1.2);
    c.beginPath(); c.moveTo(ax + 1, 398); c.lineTo(ax + 11, 410); c.lineTo(ax + 1, 414); c.closePath(); fillInk(c, GOLD_L, 0.9);
  }, { t: 2.2, d: 1.4, reveal: 'rise', ease: 'inOut' });
  // St Isaac's: a gold dome on a ring of columns, a small belfry at its corner
  const ix = 255, ib = 900;
  p.group('far', { x: ix - 120, y: 540, w: 240, h: ib - 540 + 20 }, (c) => {
    c.beginPath(); c.rect(ix - 110, ib - 40, 220, 60); fillInk(c, STONE_D, 1.4);
    c.beginPath(); c.rect(ix - 74, ib - 120, 148, 80); fillInk(c, STONE, 1.5);
    c.fillStyle = GRANITE; for (let k = 0; k < 12; k++) c.fillRect(ix - 68 + k * 12, ib - 112, 5, 66);
    c.beginPath(); c.rect(ix - 80, ib - 132, 160, 14); fillInk(c, STONE_D, 1.2);
    c.beginPath(); c.rect(ix - 58, ib - 166, 116, 34); fillInk(c, STONE, 1.2);
    c.fillStyle = BLUE_D; for (let k = 0; k < 8; k++) c.fillRect(ix - 50 + k * 14, ib - 158, 6, 18);
    c.beginPath(); c.moveTo(ix - 60, ib - 166); c.bezierCurveTo(ix - 60, ib - 250, ix + 60, ib - 250, ix + 60, ib - 166); c.closePath(); fillInk(c, GOLD, 1.6);
    c.beginPath(); for (let k = -3; k <= 3; k++) { c.moveTo(ix + k * 16, ib - 168); c.quadraticCurveTo(ix + k * 10, ib - 220, ix + k * 2, ib - 228); } ink(c, 0.8);
    c.beginPath(); c.rect(ix - 10, ib - 262, 20, 34); fillInk(c, GOLD_L, 1.2);
    c.beginPath(); c.moveTo(ix - 12, ib - 262); c.quadraticCurveTo(ix, ib - 290, ix + 12, ib - 262); c.closePath(); fillInk(c, GOLD, 1.2);
    c.beginPath(); c.moveTo(ix, ib - 288); c.lineTo(ix, ib - 330); c.moveTo(ix - 9, ib - 318); c.lineTo(ix + 9, ib - 318); ink(c, 2);
    // a corner belfry
    for (const s of [-1, 1]) {
      const bx = ix + s * 98;
      c.beginPath(); c.rect(bx - 12, ib - 90, 24, 50); fillInk(c, STONE, 1.2);
      c.beginPath(); c.moveTo(bx - 13, ib - 90); c.quadraticCurveTo(bx, ib - 118, bx + 13, ib - 90); c.closePath(); fillInk(c, GOLD, 1.1);
    }
  }, { t: 2.0, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // Peter and Paul: a stepped baroque belfry and the tallest needle in the city
  const px = 1300, pb = 960;
  p.group('far', { x: px - 70, y: 400, w: 140, h: pb - 400 + 10 }, (c) => {
    const tiers = [[60, 80, YEL], [46, 60, YEL], [34, 48, CREAM]];
    let y = pb;
    for (const [hw, h, col] of tiers) {
      c.beginPath(); c.rect(px - hw, y - h, 2 * hw, h); fillInk(c, col, 1.5);
      c.fillStyle = INK; c.fillRect(px - 7, y - h + 14, 14, h * 0.45);
      c.beginPath(); c.moveTo(px - 7, y - h + 14); c.arc(px, y - h + 14, 7, Math.PI, 0); c.fill();
      for (const s of [-1, 1]) { c.fillStyle = CREAM; c.fillRect(px + s * (hw - 8) - 3, y - h + 6, 6, h - 10); }
      y -= h;
      c.beginPath(); c.moveTo(px - hw - 4, y); c.lineTo(px + hw + 4, y); c.lineTo(px + hw - 4, y - 8); c.lineTo(px - hw + 4, y - 8); c.closePath(); fillInk(c, STONE_D, 1.2);
      y -= 8;
    }
    // the gilded cap and the needle
    c.beginPath(); c.moveTo(px - 22, y); c.quadraticCurveTo(px - 22, y - 40, px - 6, y - 52); c.lineTo(px + 6, y - 52); c.quadraticCurveTo(px + 22, y - 40, px + 22, y); c.closePath(); fillInk(c, GOLD, 1.4);
    c.beginPath(); c.moveTo(px - 6, y - 52); c.lineTo(px, 430); c.lineTo(px + 6, y - 52); c.closePath(); fillInk(c, GOLD, 1.3);
    c.beginPath(); c.moveTo(px, 432); c.lineTo(px, 404); c.moveTo(px - 8, 414); c.lineTo(px + 8, 414); ink(c, 1.8);
  }, { t: 2.4, d: 1.4, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the houses along the canal
// flat facades set one behind the other like the wings of a stage, stepping in to the church
const WINGS = [
  // [x0, x1, foot, top, color, roof]
  [520, 640, 1300, 1030, SAND, ROOF], [1000, 1110, 1300, 1050, PINK, ROOF],
  [380, 540, 1390, 960, MINT, GREEN_D], [1080, 1250, 1390, 990, YEL, ROOF],
  [PX0 - 4, 410, 1500, 820, PINK, ROOF], [1220, PX1 + 4, 1500, 880, BLUE_L, BLUE_D],
];
function wings(p, r) {
  // the pavement along both banks, under the houses' feet
  p.group('wings', { x: PX0 - 10, y: GY - 20, w: PX1 - PX0 + 20, h: PY1 - GY + 30 }, (c) => {
    c.fillStyle = SAND; c.fillRect(PX0, GY - 10, PX1 - PX0, PY1 - GY + 14);
    // the paving: lines that run to the church, and courses across
    c.beginPath();
    for (let k = -14; k <= 14; k++) { c.moveTo(CX + k * 12, GY - 10); c.lineTo(CX + k * 170, PY1 + 4); }
    for (let y = GY + 6, h = 6; y < PY1; y += h, h *= 1.18) { c.moveTo(PX0, y); c.lineTo(PX1, y); }
    c.strokeStyle = STONE_D; c.lineWidth = 0.8; c.stroke();
  }, { t: 2.3, d: 0.8, reveal: 'fall', ease: 'inOut' });
  WINGS.forEach(([x0, x1, foot, top, col, roof], i) => {
    const rr = rng(40 + i);
    const floors = Math.max(3, Math.round((foot - top) / 120));
    const bays = Math.max(3, Math.round((x1 - x0) / 46));
    // per-house details, fixed now
    const chim = []; for (let k = 0; k < 3; k++) chim.push([rr.range(x0 + 20, x1 - 30), rr.range(18, 30)]);
    const lit = []; for (let f = 0; f < floors; f++) for (let b = 0; b < bays; b++) lit.push(rr.chance(0.2));
    p.group('wings', { x: x0 - 10, y: top - 60, w: x1 - x0 + 20, h: foot - top + 70 }, (c) => {
      // the roof: a dark band with a few chimneys
      c.beginPath(); c.moveTo(x0, top); c.lineTo(x0 + 12, top - 26); c.lineTo(x1 - 12, top - 26); c.lineTo(x1, top); c.closePath(); fillInk(c, roof, 1.6);
      for (const [cx, ch] of chim) { c.beginPath(); c.rect(cx, top - 26 - ch, 14, ch); fillInk(c, BRICK, 1.2); c.beginPath(); c.rect(cx - 2, top - 30 - ch, 18, 5); fillInk(c, INK, 1); }
      c.beginPath(); c.rect(x0, top, x1 - x0, foot - top); fillInk(c, col, 1.8);
      // a rusticated ground floor and a cornice
      const g = foot - (foot - top) / floors;
      c.beginPath(); c.rect(x0, g, x1 - x0, foot - g); fillInk(c, mix(col, '#ffffff', 0.25), 1.4);
      c.beginPath(); for (let y = g + 12; y < foot; y += 12) { c.moveTo(x0, y); c.lineTo(x1, y); } ink(c, 0.6);
      c.beginPath(); c.rect(x0 - 3, top, x1 - x0 + 6, 10); fillInk(c, CREAM, 1.2);
      c.beginPath(); c.rect(x0 - 2, g - 6, x1 - x0 + 4, 6); fillInk(c, CREAM, 1);
      // windows: cream frames, dark panes, little pediments on the main floor
      const fw = (x1 - x0) / bays, fh = (g - top - 10) / (floors - 1);
      for (let f = 0; f < floors - 1; f++) {
        for (let b = 0; b < bays; b++) {
          const wx = x0 + b * fw + fw * 0.28, ww = fw * 0.44, wy = top + 10 + f * fh + fh * 0.22, wh = fh * 0.56;
          c.beginPath(); c.rect(wx - 3, wy - 3, ww + 6, wh + 6); fillInk(c, CREAM, 1);
          c.fillStyle = lit[f * bays + b] ? GOLD_L : BLUE_D; c.fillRect(wx, wy, ww, wh);
          c.strokeStyle = CREAM; c.lineWidth = 1.2; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh * 0.38); c.lineTo(wx + ww, wy + wh * 0.38); c.stroke();
          if (f === 1) { c.beginPath(); c.moveTo(wx - 5, wy - 5); c.lineTo(wx + ww / 2, wy - 14); c.lineTo(wx + ww + 5, wy - 5); c.closePath(); fillInk(c, CREAM, 1); }
        }
      }
      // doors in the ground floor
      for (let b = 1; b < bays; b += 2) {
        const dx = x0 + b * fw + fw * 0.25;
        c.beginPath(); c.moveTo(dx, foot); c.lineTo(dx, g + 18); c.arc(dx + fw * 0.25, g + 18, fw * 0.25, Math.PI, 0); c.lineTo(dx + fw * 0.5, foot); fillInk(c, BRICK_D, 1.1);
      }
    }, { t: 2.6 + i * 0.28, d: 1.1, reveal: 'rise', ease: 'inOut' });
  });
}

// ================================================================ the church
// an onion dome: its foot at (cx, by), width w and height h, outlined into the path
function onion(c, cx, by, w, h) {
  c.beginPath();
  c.moveTo(cx - w * 0.36, by);
  c.bezierCurveTo(cx - w * 0.66, by - h * 0.22, cx - w * 0.6, by - h * 0.58, cx - w * 0.2, by - h * 0.78);
  c.quadraticCurveTo(cx - w * 0.05, by - h * 0.86, cx, by - h);
  c.quadraticCurveTo(cx + w * 0.05, by - h * 0.86, cx + w * 0.2, by - h * 0.78);
  c.bezierCurveTo(cx + w * 0.6, by - h * 0.58, cx + w * 0.66, by - h * 0.22, cx + w * 0.36, by);
  c.closePath();
}
// the dome's pattern, clipped to it: spiral twist, zigzag, scales or gilded ribs
function domePattern(c, cx, by, w, h, kind, a, b) {
  c.save();
  onion(c, cx, by, w, h); c.fillStyle = a; c.fill(); c.clip();
  c.fillStyle = b; c.strokeStyle = b;
  if (kind === 'twist') {
    c.lineWidth = w * 0.11;
    for (let k = -6; k <= 6; k++) {
      c.beginPath();
      for (let s = 0; s <= 20; s++) { const t = s / 20, y = by - t * h, x = cx + k * w * 0.16 + Math.sin(t * 2.6) * w * 0.55 * (1 - t * 0.3); s ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
  } else if (kind === 'zigzag') {
    for (let y = by - 4; y > by - h; y -= h / 7) {
      c.beginPath(); c.moveTo(cx - w, y);
      for (let x = cx - w, k = 0; x <= cx + w; x += w / 7, k++) c.lineTo(x, y - (k % 2 ? h / 16 : 0));
      for (let x = cx + w, k = 0; x >= cx - w; x -= w / 7, k++) c.lineTo(x, y - h / 28 - (k % 2 ? h / 16 : 0));
      c.closePath(); c.fill();
    }
  } else if (kind === 'scales') {
    for (let j = 0, y = by; y > by - h; y -= h / 9, j++) {
      for (let x = cx - w + (j % 2) * w / 10; x < cx + w; x += w / 5) {
        c.beginPath(); c.arc(x, y, w / 10, Math.PI, 0); c.lineWidth = 1.6; c.stroke();
        c.beginPath(); c.arc(x, y - w / 30, w / 30, 0, Math.PI * 2); c.fill();
      }
    }
  } else if (kind === 'stripes') {
    c.lineWidth = w * 0.07;
    for (let k = -4; k <= 4; k++) { c.beginPath(); c.moveTo(cx + k * w * 0.14, by); c.quadraticCurveTo(cx + k * w * 0.26, by - h * 0.45, cx, by - h); c.stroke(); }
  } else { // gilded ribs and a shine
    c.lineWidth = 1.2; c.strokeStyle = GOLD_D;
    for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(cx + k * w * 0.12, by); c.quadraticCurveTo(cx + k * w * 0.24, by - h * 0.45, cx, by - h); c.stroke(); }
    c.fillStyle = GOLD_L; c.beginPath(); c.ellipse(cx - w * 0.18, by - h * 0.42, w * 0.07, h * 0.18, 0.3, 0, Math.PI * 2); c.fill();
  }
  c.restore();
  onion(c, cx, by, w, h); ink(c, 2);
}
// a cross on top: the Orthodox one, with its slanting foot bar
function cross(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y); c.lineTo(x, y - 46 * s);
  c.moveTo(x - 6 * s, y - 38 * s); c.lineTo(x + 6 * s, y - 38 * s);
  c.moveTo(x - 12 * s, y - 28 * s); c.lineTo(x + 12 * s, y - 28 * s);
  c.moveTo(x - 8 * s, y - 10 * s); c.lineTo(x + 8 * s, y - 16 * s);
  c.strokeStyle = GOLD_D; c.lineWidth = 5 * s; c.lineCap = 'round'; c.stroke();
  c.strokeStyle = GOLD_L; c.lineWidth = 2.4 * s; c.stroke();
}
// a row of kokoshnik gables: round-topped, ogee-pointed, along y from x0 to x1
function kokoshniks(c, x0, x1, y, n, h, col, inner) {
  const w = (x1 - x0) / n;
  for (let k = 0; k < n; k++) {
    const a = x0 + k * w, m = a + w / 2;
    c.beginPath(); c.moveTo(a, y);
    c.bezierCurveTo(a, y - h * 0.75, m - w * 0.25, y - h * 0.8, m, y - h);
    c.bezierCurveTo(m + w * 0.25, y - h * 0.8, a + w, y - h * 0.75, a + w, y);
    c.closePath(); fillInk(c, col, 1.4);
    c.beginPath(); c.moveTo(a + w * 0.18, y);
    c.bezierCurveTo(a + w * 0.18, y - h * 0.55, m - w * 0.15, y - h * 0.6, m, y - h * 0.72);
    c.bezierCurveTo(m + w * 0.15, y - h * 0.6, a + w * 0.82, y - h * 0.55, a + w * 0.82, y);
    c.closePath(); fillInk(c, inner, 1);
  }
}
// a drum with arched windows between two cornices
function drum(c, cx, by, w, h, col) {
  c.beginPath(); c.rect(cx - w / 2, by - h, w, h); fillInk(c, col, 1.6);
  const n = Math.max(3, Math.round(w / 20));
  for (let k = 0; k < n; k++) {
    const x = cx - w / 2 + (k + 0.5) * (w / n), ww = (w / n) * 0.42;
    c.beginPath(); c.moveTo(x - ww / 2, by - 8); c.lineTo(x - ww / 2, by - h * 0.62); c.arc(x, by - h * 0.62, ww / 2, Math.PI, 0); c.lineTo(x + ww / 2, by - 8); fillInk(c, BLUE_D, 1);
  }
  c.beginPath(); c.rect(cx - w / 2 - 4, by - h - 5, w + 8, 8); fillInk(c, CREAM, 1.2);
  c.beginPath(); c.rect(cx - w / 2 - 3, by - 4, w + 6, 6); fillInk(c, CREAM, 1);
}

function church(p, r) {
  // the body: red brick banded with pale stone, its windows and mosaic panels
  const x0 = 590, x1 = 1010, top = 930;
  p.group('church', { x: x0 - 20, y: top - 120, w: x1 - x0 + 40, h: GY - top + 140 }, (c) => {
    c.beginPath(); c.rect(x0, top, x1 - x0, GY - top); fillInk(c, BRICK, 2);
    // the stone bands and the brick coursing between them
    c.fillStyle = STONE; for (const y of [top + 60, top + 150, top + 250]) c.fillRect(x0 + 1, y, x1 - x0 - 2, 10);
    c.beginPath(); for (let y = top + 6; y < GY; y += 7) { c.moveTo(x0, y); c.lineTo(x1, y); } c.strokeStyle = BRICK_D; c.lineWidth = 0.6; c.stroke();
    c.beginPath(); for (const y of [top + 60, top + 70, top + 150, top + 160, top + 250, top + 260]) { c.moveTo(x0, y); c.lineTo(x1, y); } ink(c, 0.9);
    // a band of glazed tiles: little colored diamonds
    for (let x = x0 + 8, k = 0; x < x1 - 4; x += 14, k++) {
      c.beginPath(); c.moveTo(x, top + 108); c.lineTo(x + 6, top + 100); c.lineTo(x + 12, top + 108); c.lineTo(x + 6, top + 116); c.closePath();
      fillInk(c, [TEAL_L, GOLD, GREEN_L, BLUE_L][k % 4], 0.8);
    }
    // tall arched windows in pairs
    for (let x = x0 + 30; x < x1 - 30; x += 56) {
      for (const dx of [0, 18]) {
        c.beginPath(); c.moveTo(x + dx, top + 240); c.lineTo(x + dx, top + 180); c.arc(x + dx + 7, top + 180, 7, Math.PI, 0); c.lineTo(x + dx + 14, top + 240); fillInk(c, BLUE_D, 1.2);
      }
      c.beginPath(); c.moveTo(x - 5, top + 180); c.bezierCurveTo(x - 5, top + 150, x + 16, top + 148, x + 16, top + 138); c.bezierCurveTo(x + 16, top + 148, x + 37, top + 150, x + 37, top + 180); ink(c, 1.4);
    }
    // the mosaic panels over the portals: gold grounds with a pattern of dots
    for (const mx of [x0 + 70, x1 - 70]) {
      c.beginPath(); c.moveTo(mx - 34, top + 52); c.lineTo(mx - 34, top + 16); c.arc(mx, top + 16, 34, Math.PI, 0); c.lineTo(mx + 34, top + 52); c.closePath(); fillInk(c, GOLD, 1.4);
      c.fillStyle = TEAL_D; for (let k = 0; k < 16; k++) { const a = Math.PI + (k / 15) * Math.PI; c.beginPath(); c.arc(mx + Math.cos(a) * 24, top + 18 + Math.sin(a) * 24, 2.2, 0, Math.PI * 2); c.fill(); }
      c.beginPath(); c.arc(mx, top + 22, 11, 0, Math.PI * 2); fillInk(c, RED, 1);
    }
    // the plinth of pink granite and the portals
    c.beginPath(); c.rect(x0 - 6, GY - 54, x1 - x0 + 12, 54); fillInk(c, GRANITE, 1.8);
    c.beginPath(); for (let x = x0; x < x1; x += 30) { c.moveTo(x, GY - 54); c.lineTo(x, GY); } c.moveTo(x0 - 6, GY - 27); c.lineTo(x1 + 6, GY - 27); ink(c, 0.8);
    for (const dx of [x0 + 70, x1 - 70]) {
      c.beginPath(); c.moveTo(dx - 20, GY); c.lineTo(dx - 20, GY - 70); c.arc(dx, GY - 70, 20, Math.PI, 0); c.lineTo(dx + 20, GY); fillInk(c, INK, 1);
      c.beginPath(); c.moveTo(dx - 30, GY - 70); c.bezierCurveTo(dx - 30, GY - 104, dx, GY - 106, dx, GY - 122); c.bezierCurveTo(dx, GY - 106, dx + 30, GY - 104, dx + 30, GY - 70); c.closePath(); fillInk(c, TEAL, 1.4);
    }
  }, { t: 3.6, d: 1.4, reveal: 'rise', ease: 'inOut' });
  // the gables along the roof, in two tiers
  p.group('church', { x: x0 - 10, y: top - 110, w: x1 - x0 + 20, h: 120 }, (c) => {
    kokoshniks(c, x0 + 30, x1 - 30, top - 40, 8, 56, STONE, TEAL);
    kokoshniks(c, x0, x1, top + 2, 10, 50, CREAM, GREEN);
  }, { t: 4.6, d: 0.9, reveal: 'rise', ease: 'out' });

  // the central tent: an octagonal spire in colored enamel tiles, rising to the right of the bell tower
  const tx = 872, tb = 860, tt = 500;
  p.group('church', { x: tx - 120, y: tt - 140, w: 240, h: tb - tt + 160 }, (c) => {
    // its foot: a ring of gables over a drum of windows
    c.beginPath(); c.rect(tx - 96, tb - 50, 192, 70); fillInk(c, BRICK, 1.6);
    c.fillStyle = BLUE_D; for (let k = 0; k < 7; k++) c.fillRect(tx - 86 + k * 26, tb - 40, 10, 36);
    kokoshniks(c, tx - 106, tx + 106, tb - 40, 6, 40, STONE, BLUE);
    // three facets, each tiled in its own colors: a lattice of diamonds
    const facets = [[-92, -34, CREAM, GREEN], [-34, 34, GOLD_L, RED], [34, 92, CREAM, BLUE]];
    for (const [a, b, ground, tile] of facets) {
      c.save();
      c.beginPath(); c.moveTo(tx + a, tb - 76); c.lineTo(tx + a * 0.1, tt); c.lineTo(tx + b * 0.1, tt); c.lineTo(tx + b, tb - 76); c.closePath();
      c.fillStyle = ground; c.fill(); c.clip();
      c.fillStyle = tile;
      for (let y = tb - 80, j = 0; y > tt; y -= 16, j++) {
        const k = (y - tt) / (tb - 76 - tt), x0 = tx + lerp(a * 0.1, a, k), x1 = tx + lerp(b * 0.1, b, k), step = Math.max(6, (x1 - x0) / 4);
        for (let x = x0 + (j % 2) * step / 2; x < x1; x += step) { c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 3.5, y); c.lineTo(x, y + 6); c.lineTo(x - 3.5, y); c.closePath(); c.fill(); }
      }
      c.restore();
      c.beginPath(); c.moveTo(tx + a, tb - 76); c.lineTo(tx + a * 0.1, tt); c.lineTo(tx + b * 0.1, tt); c.lineTo(tx + b, tb - 76); c.closePath(); ink(c, 1.6);
    }
    // gold bands across the tent
    for (const k of [0.3, 0.62]) { const y = lerp(tb - 76, tt, k), hw = lerp(92, 9.2, k); c.beginPath(); c.rect(tx - hw, y - 4, 2 * hw, 8); fillInk(c, GOLD, 1); }
    // the little lantern and its gold onion
    c.beginPath(); c.rect(tx - 12, tt - 30, 24, 30); fillInk(c, CREAM, 1.3);
    c.fillStyle = BLUE_D; c.fillRect(tx - 4, tt - 24, 8, 18);
    domePattern(c, tx, tt - 30, 42, 50, 'gold', GOLD, GOLD_L);
    cross(c, tx, tt - 78, 0.85);
  }, { t: 4.2, d: 1.3, reveal: 'rise', ease: 'inOut' });

  // the four patterned domes, each on its drum over a ring of gables
  const domes = [
    { x: 612, b: 790, w: 86, h: 104, kind: 'zigzag', a: GOLD, bb: GREEN, dr: 60, dh: 62 },
    { x: 690, b: 742, w: 104, h: 124, kind: 'twist', a: CREAM, bb: BLUE, dr: 70, dh: 76 },
    { x: 980, b: 748, w: 100, h: 120, kind: 'twist', a: GOLD_L, bb: GREEN, dr: 68, dh: 74 },
    { x: 1052, b: 820, w: 78, h: 94, kind: 'scales', a: BLUE_L, bb: BLUE_D, dr: 54, dh: 56 },
  ];
  domes.forEach((d, i) => {
    const foot = top - 6;
    p.group('domes', { x: d.x - d.w, y: d.b - d.h - 80, w: d.w * 2, h: foot - (d.b - d.h - 80) + 10 }, (c) => {
      c.beginPath(); c.rect(d.x - d.dr / 2 - 4, d.b + d.dh, d.dr + 8, foot - d.b - d.dh); fillInk(c, BRICK, 1.4);
      c.beginPath(); for (let y = d.b + d.dh + 32; y < foot; y += 7) { c.moveTo(d.x - d.dr / 2 - 4, y); c.lineTo(d.x + d.dr / 2 + 4, y); } c.strokeStyle = BRICK_D; c.lineWidth = 0.6; c.stroke();
      c.fillStyle = STONE; c.fillRect(d.x - d.dr / 2 - 4, foot - 26, d.dr + 8, 6);
      c.beginPath(); c.moveTo(d.x - 7, foot - 30); c.lineTo(d.x - 7, d.b + d.dh + 52); c.arc(d.x, d.b + d.dh + 52, 7, Math.PI, 0); c.lineTo(d.x + 7, foot - 30); fillInk(c, BLUE_D, 1);
      kokoshniks(c, d.x - d.dr / 2 - 10, d.x + d.dr / 2 + 10, d.b + d.dh + 26, 3, 30, STONE, RED);
      drum(c, d.x, d.b + d.dh, d.dr, d.dh, i % 2 ? STONE : YEL);
      domePattern(c, d.x, d.b, d.w, d.h, d.kind, d.a, d.bb);
      cross(c, d.x, d.b - d.h + 4, 0.75);
    }, { t: 5.2 + i * 0.35, d: 1.1, reveal: 'rise', ease: 'out' });
  });

  // the bell tower in front, on the very spot: tiers of gables, a mosaic, the gilded onion
  const bx = 800, bw = 128, bTop = 742;
  p.group('domes', { x: bx - 110, y: bTop - 290, w: 220, h: GY - bTop + 300 }, (c) => {
    // the shaft
    c.beginPath(); c.rect(bx - bw / 2, bTop, bw, GY - bTop); fillInk(c, BRICK, 2);
    c.beginPath(); for (let y = bTop + 6; y < GY; y += 7) { c.moveTo(bx - bw / 2, y); c.lineTo(bx + bw / 2, y); } c.strokeStyle = BRICK_D; c.lineWidth = 0.6; c.stroke();
    // corner shafts of pale stone
    for (const s of [-1, 1]) { c.beginPath(); c.rect(bx + s * (bw / 2 - 7) - 7, bTop, 14, GY - bTop); fillInk(c, STONE, 1.2); c.beginPath(); for (let y = bTop + 16; y < GY; y += 16) { c.moveTo(bx + s * (bw / 2 - 7) - 7, y); c.lineTo(bx + s * (bw / 2 - 7) + 7, y); } ink(c, 0.7); }
    // the porch at its foot: an arch under a tented canopy
    c.beginPath(); c.moveTo(bx - 34, GY); c.lineTo(bx - 34, GY - 100); c.arc(bx, GY - 100, 34, Math.PI, 0); c.lineTo(bx + 34, GY); fillInk(c, INK, 1.4);
    c.beginPath(); c.moveTo(bx - 52, GY - 130); c.lineTo(bx, GY - 190); c.lineTo(bx + 52, GY - 130); c.closePath(); fillInk(c, TEAL, 1.6);
    c.beginPath(); for (let k = 1; k < 5; k++) { c.moveTo(bx - 52 + k * 10.4, GY - 130); c.lineTo(bx, GY - 190); c.moveTo(bx + 52 - k * 10.4, GY - 130); c.lineTo(bx, GY - 190); } ink(c, 0.7);
    c.beginPath(); c.rect(bx - 50, GY - 132, 100, 6); fillInk(c, GOLD, 1);
    // the mosaic panel high on the tower: gold ground, a border of red and blue
    const my = bTop + 150;
    c.beginPath(); c.moveTo(bx - 40, my + 120); c.lineTo(bx - 40, my + 30); c.arc(bx, my + 30, 40, Math.PI, 0); c.lineTo(bx + 40, my + 120); c.closePath(); fillInk(c, RED, 1.6);
    c.beginPath(); c.moveTo(bx - 32, my + 114); c.lineTo(bx - 32, my + 32); c.arc(bx, my + 32, 32, Math.PI, 0); c.lineTo(bx + 32, my + 114); c.closePath(); fillInk(c, GOLD, 1.2);
    c.fillStyle = GOLD_D; for (let y = my + 10; y < my + 110; y += 6) for (let x = bx - 28 + ((y / 6) % 2) * 3; x < bx + 28; x += 6) { if (Math.hypot(x - bx, Math.min(0, y - my - 32)) < 30) c.fillRect(x, y, 1.6, 1.6); }
    c.beginPath(); c.arc(bx, my + 60, 15, 0, Math.PI * 2); fillInk(c, BLUE, 1.2);
    c.beginPath(); c.arc(bx, my + 60, 7, 0, Math.PI * 2); fillInk(c, CREAM, 1);
    // the bell openings and the clock-like roundels
    for (const y of [bTop + 30, bTop + 290]) {
      for (const dx of [-26, 0, 26]) { c.beginPath(); c.moveTo(bx + dx - 8, y + 50); c.lineTo(bx + dx - 8, y + 12); c.arc(bx + dx, y + 12, 8, Math.PI, 0); c.lineTo(bx + dx + 8, y + 50); fillInk(c, BLUE_D, 1); }
    }
    c.beginPath(); c.rect(bx - bw / 2 - 4, bTop + 270, bw + 8, 10); fillInk(c, STONE, 1.2);
    c.beginPath(); c.rect(bx - bw / 2 - 4, bTop + 130, bw + 8, 10); fillInk(c, STONE, 1.2);
    // the crown: tiers of gables narrowing upward
    kokoshniks(c, bx - bw / 2 - 6, bx + bw / 2 + 6, bTop + 6, 3, 52, CREAM, TEAL);
    kokoshniks(c, bx - bw / 2 + 12, bx + bw / 2 - 12, bTop - 32, 3, 40, STONE, RED);
    c.beginPath(); c.rect(bx - 40, bTop - 92, 80, 60); fillInk(c, BRICK, 1.4);
    c.fillStyle = BLUE_D; for (const dx of [-22, -4, 14]) { c.fillRect(bx + dx, bTop - 82, 8, 36); }
    kokoshniks(c, bx - 44, bx + 44, bTop - 88, 4, 22, CREAM, GOLD);
    drum(c, bx, bTop - 110, 62, 28, YEL);
    // the gilded onion
    domePattern(c, bx, bTop - 138, 128, 136, 'gold', GOLD, GOLD_L);
    cross(c, bx, bTop - 270, 1.0);
  }, { t: 6.4, d: 1.6, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the Mikhailovsky Garden
// Bilibin's trees: a trunk and a crown of stacked, outlined, patterned lobes
function folkTree(c, x, y, h, col, seed) {
  const rr = rng(seed);
  c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 3, y - h * 0.45); c.lineTo(x + 3, y - h * 0.45); c.lineTo(x + 6, y); c.closePath(); fillInk(c, BRICK_D, 1.2);
  const lobes = [];
  const n = 5 + rr.int(0, 2);
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1);
    lobes.push([x + rr.range(-0.25, 0.25) * h * 0.4, y - h * (0.42 + 0.5 * t), h * lerp(0.26, 0.14, t)]);
  }
  for (const [lx, ly, lr] of lobes) {
    c.beginPath(); c.arc(lx, ly, lr, 0, Math.PI * 2); fillInk(c, col, 1.4);
    // a crescent of dark under each lobe and a few leaf ticks
    c.beginPath(); c.arc(lx, ly, lr * 0.75, 0.3, Math.PI - 0.3); c.strokeStyle = GREEN_D; c.lineWidth = 2; c.stroke();
  }
  c.fillStyle = GREEN_D;
  for (const [lx, ly, lr] of lobes) for (let k = 0; k < 5; k++) { const a = rr() * Math.PI * 2, d = rr() * lr * 0.6; c.beginPath(); c.ellipse(lx + Math.cos(a) * d, ly + Math.sin(a) * d, 2.4, 1.2, a, 0, Math.PI * 2); c.fill(); }
}
function garden(p, r) {
  // to the right of the church: the trees of the garden behind its railing
  const trees = [[1118, 1300, 210, GREEN], [1170, 1310, 260, GREEN_L], [1060, 1290, 170, TEAL], [530, 1300, 150, GREEN_L], [560, 1310, 120, GREEN]];
  trees.forEach(([x, y, h, col], i) => {
    p.group('garden', { x: x - h * 0.45, y: y - h - 20, w: h * 0.9, h: h + 30 }, (c) => folkTree(c, x, y, h, col, 300 + i),
      { t: 7.0 + i * 0.18, d: 0.8, reveal: 'rise', ease: 'out' });
  });
}

// ================================================================ the canal
// the water runs from the church's foot down to the bottom of the picture
const WL0 = 712, WR0 = 888, WL1 = 300, WR1 = 1300; // its edges at GY+8 and at PY1
const edgeAt = (y, side) => { const t = (y - (GY + 8)) / (PY1 - GY - 8); return side ? lerp(WR0, WR1, t) : lerp(WL0, WL1, t); };
function canal(p, r) {
  // rows of scalloped waves with curls, smaller as they go away
  const rows = [];
  for (let y = GY + 12, h = 6; y < PY1 + 20; y += h * 0.82, h *= 1.085) rows.push([y, Math.min(h, 34)]);
  rows.forEach(([y, h], i) => {
    const x0 = edgeAt(Math.min(PY1, y + h), 0) - 40, x1 = edgeAt(Math.min(PY1, y + h), 1) + 40;
    const col = i % 2 ? TEAL : TEAL_D, light = i % 2 ? TEAL_L : TEAL;
    p.group('water', { x: x0 - 10, y: y - h * 1.2, w: x1 - x0 + 20, h: h * 3 }, (c) => {
      c.save();
      // only inside the canal
      c.beginPath(); c.moveTo(WL0, GY + 8); c.lineTo(WR0, GY + 8); c.lineTo(WR1, PY1 + 40); c.lineTo(WL1, PY1 + 40); c.closePath(); c.clip();
      const w = h * 2.4;
      c.beginPath(); c.moveTo(x0, y + h * 2);
      for (let x = x0; x < x1; x += w) c.arc(x + w / 2, y + h * 0.6, w / 2, Math.PI, 0);
      c.lineTo(x1, y + h * 2); c.closePath();
      c.fillStyle = col; c.fill();
      c.beginPath(); for (let x = x0; x < x1; x += w) { c.moveTo(x, y + h * 0.6); c.arc(x + w / 2, y + h * 0.6, w / 2, Math.PI, 0); } ink(c, Math.max(0.7, h * 0.06));
      // the curls: a little spiral at each crest, and a light inner line
      c.beginPath();
      for (let x = x0; x < x1; x += w) {
        const cx = x + w * 0.62, cy = y + h * 0.35;
        for (let k = 0; k <= 10; k++) { const a = -Math.PI * 0.2 + k * 0.5, rr = h * 0.32 * (1 - k / 13); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; k ? c.lineTo(px, py) : c.moveTo(px, py); }
      }
      c.strokeStyle = CREAM; c.lineWidth = Math.max(0.8, h * 0.1); c.stroke();
      c.beginPath(); for (let x = x0; x < x1; x += w) { c.moveTo(x + w * 0.12, y + h * 1.0); c.arc(x + w / 2, y + h * 1.05, w * 0.38, Math.PI * 1.1, Math.PI * 1.6); }
      c.strokeStyle = light; c.lineWidth = Math.max(0.8, h * 0.14); c.stroke();
      c.restore();
    }, { t: 7.2 + i * 0.06, d: 0.7, reveal: i % 2 ? 'wipe' : 'wipeL', ease: 'inOut' });
  });
  // the granite walls and the railings along both banks, drawn by the pen
  for (const side of [0, 1]) {
    const a = [edgeAt(GY + 8, side), GY + 8], b = [edgeAt(PY1, side), PY1 + 4];
    p.group('near', { x: Math.min(a[0], b[0]) - 40, y: GY - 30, w: Math.abs(b[0] - a[0]) + 80, h: PY1 - GY + 40 }, (c) => {
      // the granite coping
      const k = side ? 1 : -1;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b[0] + k * 22, b[1]); c.lineTo(a[0] + k * 4, a[1]); c.closePath(); fillInk(c, GRANITE, 1.4);
      c.beginPath(); for (let t = 0.04; t < 1; t += 0.06) { const t2 = t * t; c.moveTo(lerp(a[0], b[0], t2), lerp(a[1], b[1], t2)); c.lineTo(lerp(a[0] + k * 4, b[0] + k * 22, t2), lerp(a[1], b[1], t2)); } ink(c, 0.6);
    }, { t: 8.0 + side * 0.1, d: 0.8, reveal: 'fade' });
    // the iron railing: posts and a lattice of rings between them, from near to far
    const posts = [];
    for (let t = 0; t <= 1.001; t += 0.035) { const t2 = t * t; posts.push([lerp(a[0], b[0], t2) + (side ? 14 : -14) * t2, lerp(a[1], b[1], t2), lerp(14, 70, t2)]); }
    p.group('near', { x: Math.min(a[0], b[0]) - 60, y: GY - 60, w: Math.abs(b[0] - a[0]) + 120, h: PY1 - GY + 70 }, (c) => {
      c.strokeStyle = INK; c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i < posts.length; i++) {
        const [x, y, h] = posts[i];
        c.moveTo(x, y); c.lineTo(x, y - h);
        if (i) { const [px, py, ph] = posts[i - 1]; c.moveTo(px, py - ph); c.lineTo(x, y - h); c.moveTo(px, py - ph * 0.15); c.lineTo(x, y - h * 0.15); }
      }
      c.lineWidth = 1.8; c.stroke();
      // rings between the posts, the Griboyedov pattern
      c.beginPath();
      for (let i = 1; i < posts.length; i++) {
        const [x, y, h] = posts[i], [px, py, ph] = posts[i - 1];
        const mx = (x + px) / 2, my = (y + py) / 2, mh = (h + ph) / 2, rr = Math.min(Math.abs(x - px) * 0.42, mh * 0.3);
        if (rr < 1.2) continue;
        c.moveTo(mx + rr, my - mh * 0.55); c.arc(mx, my - mh * 0.55, rr, 0, Math.PI * 2);
      }
      c.lineWidth = 1.1; c.stroke();
      // post tops
      c.fillStyle = INK; for (const [x, y, h] of posts) { c.beginPath(); c.arc(x, y - h, Math.max(1, h * 0.05), 0, Math.PI * 2); c.fill(); }
    }, { t: 8.3 + side * 0.2, d: 1.2, reveal: side ? 'wipeL' : 'wipe', ease: 'inOut' });
  }
  // lamp posts along the banks, and people walking
  const lamps = [[[edgeAt(1580, 0) - 60, 1580, 1.25]], [[edgeAt(1580, 1) + 60, 1580, 1.25]], [[edgeAt(1380, 0) - 30, 1380, 0.75]], [[edgeAt(1380, 1) + 30, 1380, 0.75]]];
  lamps.forEach(([[x, y, s]], i) => {
    p.group('near', { x: x - 30 * s, y: y - 260 * s, w: 60 * s, h: 270 * s }, (c) => lamp(c, x, y, s), { t: 8.9 + i * 0.12, d: 0.6, reveal: 'rise' });
  });
  const folk = [];
  for (let i = 0; i < 16; i++) {
    const side = i % 2, y = lerp(GY + 30, PY1 - 10, (i / 16) ** 1.4 + r.range(-0.03, 0.03));
    const s = lerp(0.35, 1.2, (y - GY) / (PY1 - GY));
    const x = side ? edgeAt(y, 1) + r.range(40, 120) * s + 30 * s : edgeAt(y, 0) - r.range(40, 120) * s - 30 * s;
    folk.push([x, y, s, r.pick([RED, BLUE, GREEN, OCHRE, INK, TEAL]), r.pick([RED, GOLD, CREAM, GREEN_D]), r.chance(0.5)]);
  }
  folk.sort((a, b) => a[1] - b[1]);
  folk.push([245, 1606, 1.9, BLUE_D, RED, true], [1355, 1600, 1.85, RED, GOLD, false], [300, 1612, 1.6, GREEN_D, CREAM, false]);
  for (let g = 0; g < folk.length; g += 4) {
    const set = folk.slice(g, g + 4);
    p.group('near', { x: PX0, y: GY - 20, w: PX1 - PX0, h: PY1 - GY + 30 }, (c) => { for (const f of set) person(c, ...f); }, { t: 9.3 + g * 0.06, d: 0.6, reveal: 'fade' });
  }
}
function lamp(c, x, y, s) {
  c.beginPath(); c.rect(x - 7 * s, y - 16 * s, 14 * s, 16 * s); fillInk(c, INK, 1);
  c.beginPath(); c.moveTo(x, y - 16 * s); c.lineTo(x, y - 200 * s); ink(c, 4 * s);
  c.beginPath(); c.moveTo(x - 26 * s, y - 196 * s); c.quadraticCurveTo(x, y - 222 * s, x + 26 * s, y - 196 * s); ink(c, 2.4 * s);
  for (const dx of [-26, 0, 26]) {
    const lx = x + dx * s, ly = dx ? y - 196 * s : y - 222 * s;
    c.beginPath(); c.moveTo(lx - 7 * s, ly); c.lineTo(lx - 9 * s, ly - 22 * s); c.lineTo(lx + 9 * s, ly - 22 * s); c.lineTo(lx + 7 * s, ly); c.closePath(); fillInk(c, GOLD_L, 1.2 * s);
    c.beginPath(); c.moveTo(lx - 10 * s, ly - 22 * s); c.lineTo(lx, ly - 30 * s); c.lineTo(lx + 10 * s, ly - 22 * s); c.closePath(); fillInk(c, INK, 1);
  }
}
// a little figure in a long coat and a hat or a shawl
function person(c, x, y, s, coat, scarf, hat) {
  c.beginPath(); c.moveTo(x - 7 * s, y); c.lineTo(x - 5 * s, y - 26 * s); c.lineTo(x + 5 * s, y - 26 * s); c.lineTo(x + 7 * s, y); c.closePath(); fillInk(c, coat, 1);
  c.beginPath(); c.rect(x - 5 * s, y - 30 * s, 10 * s, 5 * s); fillInk(c, scarf, 0.8);
  c.beginPath(); c.arc(x, y - 34 * s, 4.2 * s, 0, Math.PI * 2); fillInk(c, '#e7c8a5', 0.8);
  if (hat) { c.beginPath(); c.rect(x - 4.5 * s, y - 42 * s, 9 * s, 5 * s); fillInk(c, INK, 0.8); }
  else { c.beginPath(); c.arc(x, y - 35 * s, 5.2 * s, Math.PI, 0); fillInk(c, scarf, 0.8); }
}

// ================================================================ the footbridge
function bridge(p, r) {
  // a low iron bridge across the canal, near the middle distance
  const y = 1366, x0 = edgeAt(y, 0) - 40, x1 = edgeAt(y, 1) + 40, mx = (x0 + x1) / 2;
  p.group('near', { x: x0 - 20, y: y - 120, w: x1 - x0 + 40, h: 150 }, (c) => {
    // the arch beneath, and the shadow in it
    c.beginPath(); c.moveTo(x0 + 40, y + 16); c.quadraticCurveTo(mx, y - 34, x1 - 40, y + 16); c.lineTo(x1 - 40, y + 22); c.lineTo(x0 + 40, y + 22); c.closePath(); fillInk(c, TEAL_D, 1);
    c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo(mx, y - 46, x1, y); c.lineTo(x1, y + 12); c.quadraticCurveTo(mx, y - 30, x0, y + 12); c.closePath(); fillInk(c, BLUE_D, 1.6);
    // the deck, and its railing of crossed bars
    c.beginPath(); c.moveTo(x0, y - 4); c.quadraticCurveTo(mx, y - 50, x1, y - 4); ink(c, 2.4);
    const at = (t) => [lerp(x0, x1, t), y - 4 - Math.sin(t * Math.PI) * 23];
    c.beginPath();
    for (let t = 0; t < 1; t += 0.04) { const [a, b] = at(t), [a2, b2] = at(t + 0.04); c.moveTo(a, b); c.lineTo(a2, b2 - 30); c.moveTo(a, b - 30); c.lineTo(a2, b2); }
    c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
    c.beginPath(); for (let t = 0; t <= 1.001; t += 0.04) { const [a, b] = at(t); c.moveTo(a, b); c.lineTo(a, b - 30); } ink(c, 1.4);
    c.beginPath(); for (let t = 0; t <= 1.001; t += 0.02) { const [a, b] = at(t); t ? c.lineTo(a, b - 30) : c.moveTo(a, b - 30); } ink(c, 2.4);
    // the gold medallions on its side
    for (const t of [0.25, 0.5, 0.75]) { const [a] = at(t); const b = y - Math.sin(t * Math.PI) * 17 + 2; c.beginPath(); c.arc(a, b, 5, 0, Math.PI * 2); fillInk(c, GOLD, 0.8); }
  }, { t: 8.6, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // its four lanterns
  for (const [t, k] of [[0.04, 0], [0.96, 1]]) {
    const x = lerp(x0, x1, t), yy = y - 4 - Math.sin(t * Math.PI) * 23;
    p.group('near', { x: x - 20, y: yy - 110, w: 40, h: 116 }, (c) => {
      c.beginPath(); c.moveTo(x, yy); c.lineTo(x, yy - 80); ink(c, 3);
      c.beginPath(); c.moveTo(x - 8, yy - 80); c.lineTo(x - 10, yy - 104); c.lineTo(x + 10, yy - 104); c.lineTo(x + 8, yy - 80); c.closePath(); fillInk(c, GOLD_L, 1.2);
      c.beginPath(); c.moveTo(x - 11, yy - 104); c.lineTo(x, yy - 112); c.lineTo(x + 11, yy - 104); c.closePath(); fillInk(c, INK, 1);
    }, { t: 9.1 + k * 0.15, d: 0.5, reveal: 'rise' });
  }
}

// ================================================================ what moves
function life(p, r) {
  // a rowing boat that drifts up the canal, an oarsman at the oars
  p.live('life', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const k = ((time - 9.6) * 0.012) % 1; // slowly away, then round again
      const y = lerp(1560, 1420, k), s = lerp(1.2, 0.75, k);
      const x = 790 + Math.sin(time * 0.4) * 10;
      c.globalAlpha *= Math.min(1, k * 12, (1 - k) * 8);
      boat(c, x, y + Math.sin(time * 1.6) * 1.5 * s, s, Math.sin(time * 2.2));
    },
  });
  // gulls, wheeling over the domes
  const gs = [];
  for (let i = 0; i < 7; i++) gs.push([r.range(350, 1250), r.range(470, 760), r.range(40, 110), r.range(14, 30), r.range(0.2, 0.4) * (r.chance(0.5) ? 1 : -1), r() * 7, r.range(0.9, 1.5)]);
  p.live('life', {
    t: 9.8, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      for (const [x, y, rx, ry, w, ph, s] of gs) {
        const a = time * w + ph, gx = x + Math.cos(a) * rx, gy = y + Math.sin(a) * ry;
        const f = Math.sin(time * 6 + ph * 3);
        c.beginPath(); c.moveTo(gx - 12 * s, gy - (2 + f * 4) * s); c.quadraticCurveTo(gx - 5 * s, gy - (6 + f * 3) * s, gx, gy);
        c.quadraticCurveTo(gx + 5 * s, gy - (6 + f * 3) * s, gx + 12 * s, gy - (2 + f * 4) * s);
        c.strokeStyle = INK; c.lineWidth = 2 * s; c.lineCap = 'round'; c.stroke();
      }
    },
  });
  // a pennant on the Admiralty's ship, and the light in the lanterns breathing
  p.live('life', {
    t: 10.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const f = Math.sin(time * 3.1);
      c.beginPath(); c.moveTo(440, 397); c.quadraticCurveTo(452, 392 + f * 3, 464, 396 + f * 4); c.lineTo(440, 403); c.closePath();
      c.fillStyle = RED; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    },
  });
}
// a little wooden boat, seen from behind and the side, a rower in a red shirt
function boat(c, x, y, s, oar) {
  c.beginPath(); c.moveTo(x - 46 * s, y - 12 * s); c.quadraticCurveTo(x, y + 14 * s, x + 46 * s, y - 12 * s); c.lineTo(x + 40 * s, y - 4 * s); c.quadraticCurveTo(x, y + 18 * s, x - 40 * s, y - 4 * s); c.closePath();
  c.fillStyle = RED_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6 * s; c.stroke();
  c.beginPath(); c.moveTo(x - 46 * s, y - 12 * s); c.quadraticCurveTo(x, y + 4 * s, x + 46 * s, y - 12 * s); c.lineTo(x + 46 * s, y - 16 * s); c.quadraticCurveTo(x, y, x - 46 * s, y - 16 * s); c.closePath();
  c.fillStyle = GOLD; c.fill(); c.stroke();
  // the rower
  c.beginPath(); c.moveTo(x - 9 * s, y - 6 * s); c.lineTo(x - 7 * s, y - 30 * s); c.lineTo(x + 7 * s, y - 30 * s); c.lineTo(x + 9 * s, y - 6 * s); c.closePath(); c.fillStyle = RED; c.fill(); c.stroke();
  c.beginPath(); c.arc(x, y - 35 * s, 5 * s, 0, Math.PI * 2); c.fillStyle = '#e7c8a5'; c.fill(); c.stroke();
  c.beginPath(); c.rect(x - 5 * s, y - 44 * s, 10 * s, 5 * s); c.fillStyle = INK; c.fill();
  // the oars, dipping
  c.beginPath();
  c.moveTo(x - 6 * s, y - 20 * s); c.lineTo(x - 56 * s, y + (2 + oar * 6) * s);
  c.moveTo(x + 6 * s, y - 20 * s); c.lineTo(x + 56 * s, y + (2 + oar * 6) * s);
  c.lineWidth = 2 * s; c.stroke();
  // ripples behind
  c.beginPath(); c.moveTo(x - 30 * s, y + 14 * s); c.quadraticCurveTo(x, y + 20 * s, x + 30 * s, y + 14 * s); c.strokeStyle = CREAM; c.lineWidth = 1.6 * s; c.stroke();
}

// ================================================================ the lettering
function title(p, r) {
  const cx = W / 2;
  // a small ornament line under the panel's top rule
  p.group('title', { x: F0 + 20, y: TY0 + 18, w: W - 2 * F0 - 40, h: 30 }, (c) => {
    c.fillStyle = RED;
    for (let x = F0 + 40; x < W - F0 - 40; x += 26) { c.beginPath(); c.moveTo(x, TY0 + 32); c.lineTo(x + 6, TY0 + 26); c.lineTo(x + 12, TY0 + 32); c.lineTo(x + 6, TY0 + 38); c.closePath(); c.fill(); }
  }, { t: 3.4, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // САНКТ-ПЕТЕРБУРГ: red with a black outline and an ochre shadow, a letter at a time
  p.type('title', 'САНКТ-ПЕТЕРБУРГ', cx, 236, {
    family: '"Ruslan Display"', size: 172, color: RED, stroke: INK, lw: 3, shadow: OCHRE, sx: 6, sy: 6,
    align: 'center', fit: W - 2 * F0 - 120, track: 0.01, t: 10.4, gap: 0.12, d: 0.7,
  });
  // the flourishes either side of the small line beneath
  p.type('title', 'SAINT PETERSBURG', cx, 304, {
    family: '"Ruslan Display"', size: 36, color: INK, align: 'center', track: 0.32, t: 12.3, gap: 0.04, d: 0.5,
  });
  for (const s of [-1, 1]) {
    const x = cx + s * 440, L = 90;
    p.group('title', { x: x - 150, y: 266, w: 300, h: 50 }, (c) => {
      c.beginPath(); c.moveTo(x - s * L, 292); c.lineTo(x + s * L, 292); ink(c, 1.6);
      c.beginPath(); c.moveTo(x + s * L, 292); c.lineTo(x + s * (L + 8), 286); c.lineTo(x + s * (L + 16), 292); c.lineTo(x + s * (L + 8), 298); c.closePath(); fillInk(c, RED, 1);
      c.beginPath(); c.arc(x - s * (L + 6), 292, 4, 0, Math.PI * 2); fillInk(c, GOLD, 1);
    }, { t: 12.8, d: 0.6, reveal: s > 0 ? 'wipe' : 'wipeL', ease: 'inOut' });
  }
  // the foot panel: a frieze of Bilibin waves and the names of what is drawn
  const fy0 = BY0 + 24, fy1 = BY0 + 112;
  p.group('title', { x: F0 + 20, y: fy0 - 10, w: W - 2 * F0 - 40, h: fy1 - fy0 + 20 }, (c) => {
    c.save(); c.beginPath(); c.rect(F0 + 24, fy0, W - 2 * F0 - 48, fy1 - fy0); c.clip();
    c.fillStyle = TEAL_D; c.fillRect(F0 + 24, fy0, W - 2 * F0 - 48, fy1 - fy0);
    // big curling waves, each a hook of cream with dark scallops under it
    const w = 96;
    for (let x = F0 + 24 - 20, k = 0; x < W - F0; x += w, k++) {
      const y = fy1 - 14;
      c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + w * 0.1, y - 70, x + w * 0.75, y - 78, x + w * 0.8, y - 40);
      c.bezierCurveTo(x + w * 0.82, y - 18, x + w * 0.56, y - 18, x + w * 0.56, y - 36);
      c.bezierCurveTo(x + w * 0.56, y - 48, x + w * 0.7, y - 50, x + w * 0.7, y - 40);
      c.bezierCurveTo(x + w * 0.62, y - 56, x + w * 0.3, y - 50, x + w * 0.3, y);
      c.closePath(); fillInk(c, k % 2 ? TEAL_L : TEAL, 1.6);
      c.beginPath(); c.moveTo(x + w * 0.12, y - 10); c.bezierCurveTo(x + w * 0.18, y - 52, x + w * 0.62, y - 64, x + w * 0.76, y - 46); c.strokeStyle = CREAM; c.lineWidth = 2.4; c.stroke();
      // foam dots
      c.fillStyle = CREAM; for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(x + w * (0.82 + j * 0.05), y - 44 + j * 7, 2.6 - j * 0.4, 0, Math.PI * 2); c.fill(); }
    }
    c.fillStyle = TEAL_D; c.fillRect(F0 + 24, fy1 - 14, W - 2 * F0 - 48, 14);
    c.restore();
    c.beginPath(); c.rect(F0 + 24, fy0, W - 2 * F0 - 48, fy1 - fy0); ink(c, 2);
  }, { t: 3.6, d: 1.4, reveal: 'wipe', ease: 'inOut' });
  p.type('title', 'СПАС НА КРОВИ · АДМИРАЛТЕЙСТВО · КАНАЛ ГРИБОЕДОВА', cx, BY0 + 176, {
    family: '"Ruslan Display"', size: 34, color: RED_D, align: 'center', track: 0.14, t: 12.9, gap: 0.018, d: 0.4, fit: W - 2 * F0 - 160,
  });
  p.type('title', '1703', cx, BY0 + 236, { family: '"Ruslan Display"', size: 40, color: INK, align: 'center', track: 0.3, t: 13.6, gap: 0.08, d: 0.5 });
  for (const s of [-1, 1]) {
    const x = cx + s * 172, y = BY0 + 222;
    p.group('title', { x: x - 60, y: y - 20, w: 120, h: 40 }, (c) => {
      c.beginPath(); c.moveTo(x - s * 50, y); c.lineTo(x + s * 50, y); ink(c, 1.4);
      for (const dx of [-50, 0, 50]) { c.beginPath(); c.arc(x + dx, y, 4.5, 0, Math.PI * 2); fillInk(c, dx ? GOLD : RED, 1); }
    }, { t: 13.8, d: 0.5, reveal: 'pop' });
  }
}
