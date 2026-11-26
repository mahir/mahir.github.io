// Vienna: a Secession poster. A square picture in a gold border of spirals and
// checkerboards, the name above it in Federo. In the picture, on a ground of
// gold leaf with curling tendrils: the Karlskirche between its two columns, its
// green dome over the portico, the Secession's gilded laurel dome to the left,
// Otto Wagner's Stadtbahn pavilion to the right under dotted Klimt trees, the
// spire and zigzag roof of St. Stephen's and the Riesenrad turning far off, the
// rooftops of the city, the pool on the Karlsplatz and a meadow of flowers.

import { Plate, W, H } from '../print.js';
import { mix, lerp, poly, rng } from '../kit.js';

const INK = '#1b1a17', PAPER = '#efe6d1', CREAM = '#f6efdd';
const GOLD = ['#bd8f34', '#c69a3d', '#cfa346', '#d7ae52', '#dfb95f'], GOLD_D = '#8a6420', GOLD_L = '#f0d488';
const STONE = '#f1e9d4', STONE_S = '#d8cbab', STONE_D = '#b3a27c';
const COPPER = '#5d9a86', COPPER_D = '#3a6c5d', COPPER_L = '#8cc0aa';
const ROOFS = ['#e8dcbe', '#d6c8a2', '#c9b98e', '#b7bd9d', '#e0cfa8', '#cdb68a'];
const SLATE = '#6f7c74', SLATE_D = '#4e5a53';
const WATER = '#2c5f68', WATER_D = '#1f4850', WATER_L = '#6fa3a2';
const MEADOW = '#2f4a32', MEADOW_D = '#22382a';
const FLOWERS = ['#f4eedb', '#e3bf4a', '#d8705f', '#9db8d8', '#e7a3b4', '#c9d36a'];
const RED = '#b5342a', GREEN = '#3f6b4f', WAGNER = '#4c7a5c';

export const city = {
  id: 'vienna', name: 'Vienna', wall: '#1f231d',
  alt: 'A Secession poster in a square gold border of spirals and checkerboards: the Karlskirche with its green dome and its two columns over the pool on the Karlsplatz, the gilded laurel dome of the Secession building, a Stadtbahn pavilion by Otto Wagner under dotted trees, the spire of St. Stephen’s Cathedral and the Riesenrad on a ground of gold leaf, a meadow of flowers, and the name WIEN',
  google: 'family=Federo',
  fonts: [['400 300px "Federo"', 'WIEN'], ['400 36px "Federo"', 'DER ZEIT IHRE KUNST DER KUNST IHRE FREIHEIT']],
  build,
};

const FONT = '"Federo", serif';
// the frame: a square, its gold band, the picture inside
const FX = 160, FY = 440, FS = 1280, B = 64;
const IX0 = FX + B, IY0 = FY + B, IX1 = FX + FS - B, IY1 = FY + FS - B;
const CX = W / 2, GY = 1262; // the axis of the church and the line of the square
const POOL0 = 1270, POOL1 = 1388, WALK1 = 1414;

function build() {
  const p = new Plate({ paper: PAPER, seed: 1897 });
  p.clip = { x: IX0, y: IY0, w: IX1 - IX0, h: IY1 - IY0 };
  p.stack('sheet', 'sky', 'wheel', 'far', 'church', 'mid', 'water', 'meadow', 'people', 'frame', 'title', 'glint');
  for (const n of ['sheet', 'frame', 'title', 'glint']) p.layer(n, { clip: false });

  sheet(p);
  frame(p);
  sky(p);
  tendrils(p);
  wheel(p);
  stephansdom(p);
  rooftops(p);
  karlskirche(p);
  secession(p);
  trees(p);
  pavilion(p);
  pool(p);
  meadow(p);
  people(p);
  title(p);
  life(p);
  return p;
}

// ================================================================ the sheet and the frame
function sheet(p) {
  // a fine double rule round the sheet
  const R1 = 64, R2 = 76;
  p.pen('sheet', [[R1, R1], [W - R1, R1], [W - R1, H - R1], [R1, H - R1], [R1, R1]], INK, 3, { t: 0.0, d: 1.4, cap: 'square' });
  p.pen('sheet', [[W - R2, H - R2], [R2, H - R2], [R2, R2], [W - R2, R2], [W - R2, H - R2]], INK, 1.2, { t: 0.3, d: 1.4, cap: 'square' });
}

// the gold band: leaf, black rules either side, a running spiral and checkered
// squares along it, a checkerboard in each corner
function bandLeaf(seed) {
  const rr = rng(seed), cells = [];
  for (let y = FY; y < FY + FS; y += 32) for (let x = FX; x < FX + FS; x += 32) {
    if (x >= IX0 && x < IX1 && y >= IY0 && y < IY1) continue;
    cells.push([x, y, rr.int(0, GOLD.length - 1)]);
  }
  return cells;
}
function frame(p) {
  const cells = bandLeaf(55);
  const sides = [
    { b: { x: FX, y: FY, w: FS, h: B }, reveal: 'wipe' },
    { b: { x: IX1, y: FY, w: B, h: FS }, reveal: 'fall' },
    { b: { x: FX, y: IY1, w: FS, h: B }, reveal: 'wipeL' },
    { b: { x: FX, y: FY, w: B, h: FS }, reveal: 'rise' },
  ];
  sides.forEach((s, i) => {
    const { x, y, w, h } = s.b;
    const mine = cells.filter(([cx, cy]) => cx >= x && cx < x + w && cy >= y && cy < y + h);
    p.group('frame', { x: x - 4, y: y - 4, w: w + 8, h: h + 8 }, (c) => {
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      leafCells(c, mine, 32);
      c.restore();
    }, { t: 0.4 + i * 0.35, d: 0.9, reveal: s.reveal, ease: 'inOut' });
  });
  // the rules: thick outside, thin inside
  p.pen('frame', [[FX, FY], [FX + FS, FY], [FX + FS, FY + FS], [FX, FY + FS], [FX, FY]], INK, 5, { t: 1.2, d: 1.4, cap: 'square' });
  p.pen('frame', [[IX0, IY0], [IX0, IY1], [IX1, IY1], [IX1, IY0], [IX0, IY0]], INK, 4, { t: 1.4, d: 1.4, cap: 'square' });
  // the motifs along each side: a spiral, then a square of nine checks, by turns
  const n = Math.round((FS - 2 * B) / B);
  const step = (FS - 2 * B) / n;
  const pts = [];
  for (let k = 0; k < n; k++) {
    pts.push([IX0 + step * (k + 0.5), FY + B / 2, k % 2]);
    pts.push([IX1 + B / 2, IY0 + step * (k + 0.5), k % 2]);
    pts.push([IX1 - step * (k + 0.5), IY1 + B / 2, k % 2]);
    pts.push([FX + B / 2, IY1 - step * (k + 0.5), k % 2]);
  }
  // four marks, one per side, each set as the pen goes round
  for (let side = 0; side < 4; side++) {
    const mine = pts.filter((_, i) => i % 4 === side);
    const xs = mine.map((m) => m[0]), ys = mine.map((m) => m[1]);
    const bx = Math.min(...xs) - 34, by = Math.min(...ys) - 34;
    p.group('frame', { x: bx, y: by, w: Math.max(...xs) - bx + 34, h: Math.max(...ys) - by + 34 }, (c) => {
      for (const [x, y, k] of mine) (k ? checks(c, x, y, 34) : bandSpiral(c, x, y, 20));
    }, { t: 2.0 + side * 0.3, d: 0.9, reveal: ['wipe', 'fall', 'wipeL', 'rise'][side], ease: 'inOut' });
  }
  // the corners: a checkerboard of five by five
  [[FX, FY], [IX1, FY], [IX1, IY1], [FX, IY1]].forEach(([x, y], i) => {
    p.group('frame', { x: x - 3, y: y - 3, w: B + 6, h: B + 6 }, (c) => {
      const s = B / 5;
      c.fillStyle = CREAM; c.fillRect(x, y, B, B);
      c.fillStyle = INK;
      for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) if ((a + b) % 2 === 0) c.fillRect(x + a * s, y + b * s, s, s);
      c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(x, y, B, B);
    }, { t: 3.2 + i * 0.12, d: 0.5, reveal: 'pop' });
  });
  // a narrow strip of small checks just inside the picture's edge
  p.group('frame', { x: IX0 - 2, y: IY0 - 2, w: IX1 - IX0 + 4, h: IY1 - IY0 + 4 }, (c) => {
    c.fillStyle = INK;
    const s = 8;
    c.beginPath();
    for (let x = IX0; x < IX1; x += s) { if ((x - IX0) / s % 2 === 0) { c.rect(x, IY0, s, s); c.rect(x, IY1 - s, s, s); } else { c.rect(x, IY0 + s, s, s); c.rect(x, IY1 - 2 * s, s, s); } }
    c.fill();
    c.fillStyle = CREAM;
    c.beginPath();
    for (let x = IX0; x < IX1; x += s) { if ((x - IX0) / s % 2 === 1) { c.rect(x, IY0, s, s); c.rect(x, IY1 - s, s, s); } else { c.rect(x, IY0 + s, s, s); c.rect(x, IY1 - 2 * s, s, s); } }
    c.fill();
  }, { t: 12.4, d: 1.0, reveal: 'wipe', ease: 'inOut' });
}
// a square of nine checks on the gold
function checks(c, x, y, s) {
  const k = s / 3;
  c.fillStyle = CREAM; c.fillRect(x - s / 2, y - s / 2, s, s);
  c.fillStyle = INK;
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if ((a + b) % 2 === 0) c.fillRect(x - s / 2 + a * k, y - s / 2 + b * k, k, k);
  c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x - s / 2, y - s / 2, s, s);
}
// a black spiral with a ring round it
function bandSpiral(c, x, y, rad) {
  c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = 'round';
  c.beginPath();
  for (let k = 0; k <= 60; k++) {
    const t = k / 60, a = t * Math.PI * 5.2, rr = rad * 0.86 * (1 - t) + 1.5;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    k ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.stroke();
  c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(x, y, 2.4, 0, Math.PI * 2); c.fill();
}
// gold leaf laid square by square: the tones in one path each, then the seams
function leafCells(c, cells, s) {
  for (let k = 0; k < GOLD.length; k++) {
    c.beginPath();
    for (const [x, y, t] of cells) if (t === k) c.rect(x, y, s + 0.5, s + 0.5);
    c.fillStyle = GOLD[k]; c.fill();
  }
  c.strokeStyle = 'rgba(120,82,20,.28)'; c.lineWidth = 0.8;
  c.beginPath(); for (const [x, y] of cells) c.rect(x + 0.5, y + 0.5, s, s); c.stroke();
}

// ================================================================ the gold ground
function sky(p) {
  const rr = rng(808), s = 38, cells = [];
  for (let y = IY0; y < GY; y += s) for (let x = IX0; x < IX1; x += s) cells.push([x, y, rr.int(0, GOLD.length - 1)]);
  // flakes where the leaf overlaps and the edge tore, fixed now
  const flakes = [];
  for (let i = 0; i < 160; i++) flakes.push([rr.range(IX0, IX1), rr.range(IY0, GY), rr.range(2, 7), rr.range(0, Math.PI)]);
  // laid in diagonal bands from the top left
  const bands = 9;
  for (let b = 0; b < bands; b++) {
    const mine = cells.filter(([x, y]) => Math.floor(((x - IX0) + (y - IY0)) / ((IX1 - IX0 + GY - IY0) / bands)) === b);
    if (!mine.length) continue;
    const xs = mine.map((m) => m[0]), ys = mine.map((m) => m[1]);
    const bx = Math.min(...xs), by = Math.min(...ys);
    const fl = flakes.filter(([x, y]) => x >= bx && y >= by && x < Math.max(...xs) + s && y < Math.max(...ys) + s);
    p.group('sky', { x: bx - 2, y: by - 2, w: Math.max(...xs) + s - bx + 4, h: Math.max(...ys) + s - by + 4 }, (c) => {
      leafCells(c, mine, s);
      // a sheen across the whole ground, the same wherever a band falls
      const g = c.createLinearGradient(IX0, IY0, IX1, GY);
      g.addColorStop(0, 'rgba(255,236,170,.0)'); g.addColorStop(0.42, 'rgba(255,236,170,.32)'); g.addColorStop(0.55, 'rgba(255,236,170,.0)'); g.addColorStop(1, 'rgba(90,60,10,.18)');
      c.save(); c.beginPath(); for (const [x, y] of mine) c.rect(x, y, s + 0.5, s + 0.5); c.clip();
      c.fillStyle = g; c.fillRect(bx, by, Math.max(...xs) + s - bx, Math.max(...ys) + s - by);
      c.restore();
      c.fillStyle = 'rgba(250,226,150,.55)';
      for (const [x, y, z, a] of fl) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * z, y + Math.sin(a) * z); c.lineTo(x + z * 0.6, y + z * 0.9); c.closePath(); c.fill(); }
    }, { t: 0.6 + b * 0.16, d: 0.8, reveal: 'fade' });
  }
}

// tendrils curling in from the top corners, as on Klimt's tree of life
function spiral(x0, y0, cx, cy, rad, turns, dir) {
  // a stem from (x0, y0) bending into a spiral round (cx, cy)
  const pts = [];
  const a0 = Math.atan2(y0 - cy, x0 - cx);
  const rs = Math.hypot(x0 - cx, y0 - cy);
  const n = Math.round(30 + turns * 40);
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const a = a0 + dir * t * turns * Math.PI * 2;
    const rr = t < 0.25 ? lerp(rs, rad, t / 0.25) : rad * (1 - (t - 0.25) / 0.75) ** 1.15 + 2;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return pts;
}
function tendrils(p) {
  const specs = [
    // [stem start, spiral center, radius, turns, direction]
    [IX0 - 10, 700, 330, 640, 46, 2.2, 1], [IX0 - 10, 640, 300, 790, 30, 1.8, -1], [520, IY0 - 10, 470, 590, 38, 2.0, -1],
    [IX0 + 40, IY0 - 10, 250, 560, 22, 1.6, 1], [600, IY0 - 10, 640, 630, 24, 1.6, 1],
    [IX1 + 10, 640, 1300, 600, 40, 2.1, -1], [1080, IY0 - 10, 1080, 610, 30, 1.8, 1], [IX1 + 10, 760, 1320, 1060, 26, 1.7, 1],
    [930, IY0 - 10, 950, 570, 20, 1.5, -1], [IX1 - 30, IY0 - 10, 1250, 560, 22, 1.6, -1],
  ];
  specs.forEach(([x0, y0, cx, cy, rad, turns, dir], i) => {
    const pts = spiral(x0, y0, cx, cy, rad, turns, dir);
    p.pen('sky', pts, GOLD_D, 3.2, { t: 2.4 + i * 0.16, d: 1.4 });
    // a ring of dots round the curl, set after the line
    const dots = [];
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; dots.push([cx + Math.cos(a) * (rad + 9), cy + Math.sin(a) * (rad + 9)]); }
    p.group('sky', { x: cx - rad - 16, y: cy - rad - 16, w: 2 * rad + 32, h: 2 * rad + 32 }, (c) => {
      c.fillStyle = GOLD_D; c.beginPath(); for (const [x, y] of dots) { c.moveTo(x + 2.4, y); c.arc(x, y, 2.4, 0, Math.PI * 2); } c.fill();
      c.fillStyle = INK; c.beginPath(); c.arc(cx, cy, 3, 0, Math.PI * 2); c.fill();
    }, { t: 3.8 + i * 0.16, d: 0.5, reveal: 'pop' });
  });
}

// ================================================================ far off
// the Riesenrad, turning: drawn every frame, so only lines and small boxes
const RX = 1196, RY = 846, RR = 162;
function wheel(p) {
  // its legs and the trusses that carry the hub
  p.group('wheel', { x: RX - 170, y: RY - 20, w: 340, h: 1170 - RY + 20 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 3;
    const legs = [[-130, 1160], [-70, 1160], [70, 1160], [130, 1160]];
    c.beginPath(); for (const [dx, y] of legs) { c.moveTo(RX, RY); c.lineTo(RX + dx, y); } c.stroke();
    c.lineWidth = 1.2; c.beginPath();
    for (let k = 1; k < 9; k++) {
      const t = k / 9, y = lerp(RY, 1160, t);
      c.moveTo(RX - 130 * t, y); c.lineTo(RX - 70 * t, y); c.moveTo(RX + 70 * t, y); c.lineTo(RX + 130 * t, y);
      const t2 = (k + 1) / 9, y2 = lerp(RY, 1160, t2);
      c.moveTo(RX - 130 * t, y); c.lineTo(RX - 70 * t2, y2); c.moveTo(RX + 130 * t, y); c.lineTo(RX + 70 * t2, y2);
    }
    c.stroke();
  }, { t: 3.0, d: 1.0, reveal: 'rise' });
  p.live('wheel', {
    t: 3.4, d: 1.6, reveal: 'iris', ease: 'inOut', box: { x: RX - RR - 30, y: RY - RR - 30, w: 2 * RR + 60, h: 2 * RR + 60 },
    draw: (c, time) => {
      const turn = time * 0.045;
      c.strokeStyle = INK; c.lineCap = 'round';
      // the spokes, in pairs from either side of the hub
      c.lineWidth = 0.9; c.beginPath();
      for (let k = 0; k < 36; k++) {
        const a = turn + (k / 36) * Math.PI * 2, off = k % 2 ? 6 : -6;
        c.moveTo(RX + Math.cos(a + Math.PI / 2) * off * 0.4, RY + Math.sin(a + Math.PI / 2) * off * 0.4);
        c.lineTo(RX + Math.cos(a) * (RR - 12), RY + Math.sin(a) * (RR - 12));
      }
      c.stroke();
      // the two rims and the lattice between them
      c.lineWidth = 3; c.beginPath(); c.arc(RX, RY, RR, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.arc(RX, RY, RR - 12, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 1; c.beginPath();
      for (let k = 0; k < 72; k++) {
        const a = turn + (k / 72) * Math.PI * 2, b = turn + ((k + 1) / 72) * Math.PI * 2;
        c.moveTo(RX + Math.cos(a) * RR, RY + Math.sin(a) * RR); c.lineTo(RX + Math.cos(b) * (RR - 12), RY + Math.sin(b) * (RR - 12));
      }
      c.stroke();
      c.fillStyle = INK; c.beginPath(); c.arc(RX, RY, 9, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD_L; c.beginPath(); c.arc(RX, RY, 4, 0, Math.PI * 2); c.fill();
      // the red cabins, hanging level
      for (let k = 0; k < 15; k++) {
        const a = turn + (k / 15) * Math.PI * 2, x = RX + Math.cos(a) * RR, y = RY + Math.sin(a) * RR;
        c.fillStyle = RED; c.fillRect(x - 12, y + 3, 24, 15);
        c.fillStyle = CREAM; c.fillRect(x - 13, y, 26, 4); c.fillRect(x - 9, y + 7, 18, 5);
        c.fillStyle = INK; c.fillRect(x - 1, y - 2, 2, 3);
      }
    },
  });
}

// St. Stephen's: the south tower's spire and the steep roof of glazed tiles in zigzags
function stephansdom(p) {
  const sx = 312, base = 1180, top = 600;
  p.group('far', { x: sx - 70, y: top - 10, w: 140, h: base - top + 20 }, (c) => {
    // the tower: stages narrowing up to the spire
    const stages = [[base, 980, 52], [980, 860, 44], [860, 770, 36]];
    for (const [y0, y1, hw] of stages) {
      c.fillStyle = STONE_S; c.fillRect(sx - hw, y1, 2 * hw, y0 - y1);
      c.fillStyle = STONE_D; c.fillRect(sx - hw, y1, hw * 0.5, y0 - y1);
      // tall lancet windows
      c.fillStyle = INK;
      for (const dx of [-hw * 0.45, hw * 0.25]) { c.beginPath(); c.moveTo(sx + dx, y0 - 12); c.lineTo(sx + dx, y1 + 30); c.lineTo(sx + dx + 6, y1 + 16); c.lineTo(sx + dx + 12, y1 + 30); c.lineTo(sx + dx + 12, y0 - 12); c.fill(); }
      // a gable over each stage, pointed
      c.fillStyle = STONE_S; poly(c, [[sx - hw, y1], [sx - hw * 0.4, y1 - 34], [sx + hw * 0.2, y1]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(sx - hw, y1, 2 * hw, y0 - y1);
    }
    // the spire, with crockets up its edges
    c.fillStyle = STONE_S; poly(c, [[sx - 30, 772], [sx, top], [sx + 30, 772]]); c.fill();
    c.fillStyle = STONE_D; poly(c, [[sx - 30, 772], [sx, top], [sx - 8, 772]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; poly(c, [[sx - 30, 772], [sx, top], [sx + 30, 772]]); c.stroke();
    c.beginPath();
    for (let y = 760; y > top + 20; y -= 16) {
      const hw = 30 * (y - top) / (772 - top);
      c.moveTo(sx - hw, y); c.lineTo(sx - hw - 5, y - 4); c.moveTo(sx + hw, y); c.lineTo(sx + hw + 5, y - 4);
      c.moveTo(sx - hw * 0.6, y); c.lineTo(sx + hw * 0.6, y);
    }
    c.stroke();
    c.fillStyle = GOLD_L; c.beginPath(); c.arc(sx, top - 4, 4, 0, Math.PI * 2); c.fill();
  }, { t: 3.1, d: 1.4, reveal: 'rise', ease: 'inOut' });
  // the roof: chevrons of yellow, green and black tiles
  const roof = [[350, 1180], [408, 1000], [560, 1000], [580, 1180]];
  p.group('far', { x: 340, y: 990, w: 250, h: 200 }, (c) => {
    c.save(); poly(c, roof); c.clip();
    c.fillStyle = '#e1c25a'; c.fillRect(340, 990, 250, 200);
    const cols = [GREEN, INK, '#e1c25a', '#f4eedb'];
    for (let row = 0; row < 12; row++) {
      const y = 1004 + row * 16;
      c.fillStyle = cols[row % 4];
      c.beginPath();
      for (let x = 340; x < 600; x += 24) { c.moveTo(x, y); c.lineTo(x + 12, y + 9); c.lineTo(x + 24, y); c.lineTo(x + 24, y + 7); c.lineTo(x + 12, y + 16); c.lineTo(x, y + 7); c.closePath(); }
      c.fill();
    }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 2; poly(c, roof); c.stroke();
  }, { t: 3.6, d: 0.9, reveal: 'fall', ease: 'inOut' });
}

// the city's roofs behind the square: two rows of houses with mansards and chimneys
function rooftops(p) {
  [[1092, 0.8, 41], [1140, 1, 42]].forEach(([top, s, seed], ri) => {
    const rr = rng(seed), houses = [];
    for (let x = IX0 - 20; x < IX1 + 20;) {
      const w = rr.range(70, 140) * s, h = rr.range(0, 46) * s;
      houses.push({ x, w, y: top + h * (rr.chance(0.5) ? 1 : -0.4), col: rr.pick(ROOFS), mans: rr.chance(0.6), dome: rr.chance(0.08), chim: rr.int(0, 3), rows: 0, ph: rr() });
      x += w;
    }
    for (let part = 0; part < 3; part++) {
      const a = IX0 + ((IX1 - IX0) * part) / 3 - 20, b = IX0 + ((IX1 - IX0) * (part + 1)) / 3 + 20;
      const list = houses.filter((hh) => hh.x >= a - 1 && hh.x < b - 20);
      p.group('far', { x: a - 160, y: top - 90, w: b - a + 320, h: GY - top + 100 }, (c) => {
        for (const hh of list) house(c, hh, s);
      }, { t: 4.0 + ri * 0.45 + part * 0.15, d: 0.7, reveal: 'rise' });
    }
  });
}
function house(c, hh, s) {
  const { x, w, y, col } = hh;
  c.fillStyle = col; c.fillRect(x, y, w, GY - y + 10);
  c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(x, y, w, GY - y + 10);
  // a cornice
  c.fillStyle = mix(col, '#ffffff', 0.35); c.fillRect(x - 2, y - 4, w + 4, 5);
  // windows: a grid of tall black panes
  c.fillStyle = INK; c.beginPath();
  for (let yy = y + 16 * s; yy < GY - 8; yy += 26 * s) for (let xx = x + 10 * s; xx < x + w - 10 * s; xx += 20 * s) c.rect(xx, yy, 7 * s, 14 * s);
  c.fill();
  if (hh.mans) {
    // a slate mansard with dormers
    const mh = 22 * s;
    c.fillStyle = SLATE; poly(c, [[x, y - 3], [x + 10 * s, y - mh], [x + w - 10 * s, y - mh], [x + w, y - 3]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = CREAM;
    for (let xx = x + 18 * s; xx < x + w - 18 * s; xx += 26 * s) { c.fillRect(xx, y - mh + 6 * s, 8 * s, 11 * s); c.fillStyle = SLATE_D; poly(c, [[xx - 2, y - mh + 7 * s], [xx + 4 * s, y - mh + 1], [xx + 8 * s + 2, y - mh + 7 * s]]); c.fill(); c.fillStyle = CREAM; }
  }
  if (hh.dome) {
    c.fillStyle = COPPER; c.beginPath(); c.ellipse(x + w / 2, y - 18 * s, 18 * s, 22 * s, 0, Math.PI, 0); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.fillRect(x + w / 2 - 1, y - 52 * s, 2, 14 * s);
  }
  c.fillStyle = mix(col, INK, 0.4);
  for (let k = 0; k < hh.chim; k++) { const cx = x + w * (0.2 + 0.6 * ((k + hh.ph) % 1)); c.fillRect(cx, y - (hh.mans ? 34 : 14) * s, 7 * s, 14 * s); }
}

// ================================================================ the Karlskirche
function karlskirche(p) {
  const L = 'church';
  // the steps across the front
  p.group(L, { x: 500, y: 1228, w: 600, h: 40 }, (c) => {
    for (let k = 0; k < 3; k++) { const y = 1236 + k * 9, hw = 250 + k * 22; c.fillStyle = k % 2 ? STONE_S : STONE; c.fillRect(CX - hw, y, 2 * hw, 10); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(CX - hw, y, 2 * hw, 10); }
  }, { t: 4.6, d: 0.6, reveal: 'wipe', ease: 'inOut' });
  // the body behind the portico, and the wings out to the towers
  p.group(L, { x: 420, y: 960, w: 760, h: 300 }, (c) => {
    c.fillStyle = STONE; c.fillRect(546, 1046, 508, 196);
    c.fillStyle = STONE_S; c.fillRect(546, 1046, 508, 14);
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(546, 1046, 508, 196);
    // the wall behind the portico, rising to the drum
    c.fillStyle = STONE_S; c.fillRect(660, 968, 280, 80);
    c.strokeRect(660, 968, 280, 80);
    // blind windows in the wings
    c.fillStyle = INK;
    for (const x of [556, 1024]) { c.fillRect(x, 1110, 20, 46); c.beginPath(); c.arc(x + 10, 1110, 10, Math.PI, 0); c.fill(); c.fillRect(x, 1180, 20, 30); }
  }, { t: 4.8, d: 0.9, reveal: 'rise' });
  towers(p, L);
  dome(p, L);
  portico(p, L);
  columns(p, L);
}
// the two bell towers at the ends, each over an open gateway
function towers(p, L) {
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? 424 : 1066, w = 110, x1 = x0 + w, mx = x0 + w / 2;
    p.group(L, { x: x0 - 20, y: 860, w: w + 40, h: GY - 860 + 6 }, (c) => {
      c.fillStyle = STONE; c.fillRect(x0, 960, w, GY - 960);
      c.fillStyle = STONE_S; c.fillRect(s < 0 ? x0 : x1 - 16, 960, 16, GY - 960);
      // rusticated courses on the ground story
      c.strokeStyle = STONE_D; c.lineWidth = 1; c.beginPath();
      for (let y = 1110; y < GY; y += 14) { c.moveTo(x0, y); c.lineTo(x1, y); }
      c.stroke();
      // the gateway, open through to the gold
      c.fillStyle = INK; c.beginPath(); c.moveTo(mx - 30, GY); c.lineTo(mx - 30, 1166); c.arc(mx, 1166, 30, Math.PI, 0); c.lineTo(mx + 30, GY); c.fill();
      c.fillStyle = GOLD[2]; c.beginPath(); c.moveTo(mx - 22, GY); c.lineTo(mx - 22, 1170); c.arc(mx, 1170, 22, Math.PI, 0); c.lineTo(mx + 22, GY); c.fill();
      // the upper story: a round window and a cornice
      c.fillStyle = STONE_S; c.fillRect(x0 - 6, 1096, w + 12, 12);
      c.fillStyle = INK; c.beginPath(); c.arc(mx, 1040, 17, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD_L; c.beginPath(); c.arc(mx, 1040, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = STONE_S; c.fillRect(x0 - 8, 956, w + 16, 12);
      // the cap: a low ogee roof in copper with a small lantern
      c.fillStyle = COPPER; c.beginPath(); c.moveTo(x0 - 4, 956); c.bezierCurveTo(x0 + 10, 916, mx - 20, 930, mx - 8, 896); c.lineTo(mx + 8, 896); c.bezierCurveTo(mx + 20, 930, x1 - 10, 916, x1 + 4, 956); c.closePath(); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();
      c.strokeStyle = COPPER_D; c.lineWidth = 1; c.beginPath(); for (let k = 1; k < 6; k++) { const x = lerp(x0 + 6, x1 - 6, k / 6); c.moveTo(x, 954); c.quadraticCurveTo(lerp(x, mx, 0.6), 930, lerp(x, mx, 0.9), 900); } c.stroke();
      c.fillStyle = STONE; c.fillRect(mx - 9, 872, 18, 26); c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(mx - 9, 872, 18, 26);
      c.fillStyle = COPPER; c.beginPath(); c.ellipse(mx, 872, 11, 9, 0, Math.PI, 0); c.fill(); c.stroke();
      c.fillStyle = GOLD_L; c.beginPath(); c.arc(mx, 860, 3.4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x0, 960, w, GY - 960);
    }, { t: 5.0 + (s > 0 ? 0.25 : 0), d: 1.1, reveal: 'rise', ease: 'inOut' });
  }
}
// the drum and the tall oval dome, its ribs and windows, the lantern
function dome(p, L) {
  const dy0 = 976, dy1 = 892, hw = 124, top = 716;
  p.group(L, { x: CX - hw - 20, y: dy1 - 4, w: 2 * hw + 40, h: dy0 - dy1 + 12 }, (c) => {
    c.fillStyle = STONE; c.fillRect(CX - hw, dy1, 2 * hw, dy0 - dy1);
    c.fillStyle = STONE_S; c.fillRect(CX - hw, dy1, 2 * hw, 10); c.fillRect(CX - hw - 8, dy0 - 10, 2 * hw + 16, 10);
    // paired pilasters and arched windows round the drum
    for (let k = -3; k <= 3; k++) {
      const x = CX + k * 34;
      c.fillStyle = STONE_S; c.fillRect(x - 17, dy1 + 10, 4, dy0 - dy1 - 20);
      if (Math.abs(k) < 3) { c.fillStyle = INK; c.beginPath(); c.moveTo(x - 8, dy0 - 18); c.lineTo(x - 8, dy1 + 30); c.arc(x, dy1 + 30, 8, Math.PI, 0); c.lineTo(x + 8, dy0 - 18); c.fill(); }
    }
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(CX - hw, dy1, 2 * hw, dy0 - dy1);
  }, { t: 5.6, d: 0.8, reveal: 'rise' });
  // the dome: a tall curve, ribbed, with oval windows low down
  const shell = (c) => { c.beginPath(); c.moveTo(CX - hw + 6, dy1); c.bezierCurveTo(CX - hw + 4, dy1 - 110, CX - 60, top + 4, CX, top); c.bezierCurveTo(CX + 60, top + 4, CX + hw - 4, dy1 - 110, CX + hw - 6, dy1); c.closePath(); };
  p.group(L, { x: CX - hw - 6, y: top - 6, w: 2 * hw + 12, h: dy1 - top + 12 }, (c) => {
    shell(c); c.fillStyle = COPPER; c.fill();
    c.save(); shell(c); c.clip();
    // the light from the right, in flat bands
    c.fillStyle = COPPER_L; c.beginPath(); c.ellipse(CX + 52, dy1 - 60, 40, 150, -0.1, 0, Math.PI * 2); c.fill();
    c.fillStyle = COPPER_D; c.beginPath(); c.ellipse(CX - 108, dy1 - 40, 36, 170, 0.05, 0, Math.PI * 2); c.fill();
    // the ribs
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath();
    for (let k = -4; k <= 4; k++) { const x = CX + k * 28; c.moveTo(x, dy1); c.quadraticCurveTo(x * 0.9 + CX * 0.1 + k * 2, dy1 - 120, CX + k * 3, top + 4); }
    c.stroke();
    // oval windows with gilt frames
    for (let k = -3; k <= 3; k += 2) {
      const x = CX + k * 30, y = dy1 - 34;
      c.fillStyle = GOLD[3]; c.beginPath(); c.ellipse(x, y, 11, 15, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = INK; c.beginPath(); c.ellipse(x, y, 7, 10, 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    shell(c); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
  }, { t: 6.1, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the lantern, its cap and a gilt ball and cross
  p.group(L, { x: CX - 40, y: top - 110, w: 80, h: 118 }, (c) => {
    c.fillStyle = STONE; c.fillRect(CX - 20, top - 58, 40, 60);
    c.fillStyle = INK; for (const dx of [-11, 3]) { c.fillRect(CX + dx, top - 46, 8, 30); }
    c.strokeStyle = INK; c.lineWidth = 1.8; c.strokeRect(CX - 20, top - 58, 40, 60);
    c.fillStyle = STONE_S; c.fillRect(CX - 24, top - 62, 48, 7); c.strokeRect(CX - 24, top - 62, 48, 7);
    c.fillStyle = COPPER; c.beginPath(); c.moveTo(CX - 22, top - 62); c.quadraticCurveTo(CX - 18, top - 88, CX, top - 92); c.quadraticCurveTo(CX + 18, top - 88, CX + 22, top - 62); c.fill(); c.stroke();
    c.fillStyle = GOLD[4]; c.beginPath(); c.arc(CX, top - 96, 5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD_D; c.lineWidth = 2.4; c.beginPath(); c.moveTo(CX, top - 100); c.lineTo(CX, top - 122 + 14); c.stroke();
  }, { t: 7.0, d: 0.7, reveal: 'drop', dy: 40 });
}
// the portico: six columns, the entablature and the pediment
function portico(p, L) {
  const x0 = 652, x1 = 948, top = 1070, base = 1236;
  p.group(L, { x: x0 - 20, y: 980, w: x1 - x0 + 40, h: base - 980 + 4 }, (c) => {
    // the dark of the porch behind the columns, with the door
    c.fillStyle = mix(STONE_D, INK, 0.35); c.fillRect(x0 + 10, top, x1 - x0 - 20, base - top);
    c.fillStyle = INK; c.beginPath(); c.moveTo(CX - 26, base); c.lineTo(CX - 26, top + 70); c.arc(CX, top + 70, 26, Math.PI, 0); c.lineTo(CX + 26, base); c.fill();
    c.fillStyle = GOLD[1]; c.fillRect(CX - 18, top + 76, 36, 4);
    // the columns, fluted
    for (let k = 0; k < 6; k++) {
      const x = lerp(x0 + 18, x1 - 18, k / 5);
      c.fillStyle = STONE; c.fillRect(x - 13, top + 18, 26, base - top - 26);
      c.fillStyle = STONE_S; c.fillRect(x - 13, top + 18, 7, base - top - 26);
      c.strokeStyle = STONE_D; c.lineWidth = 1; c.beginPath(); for (const dx of [-4, 1, 6]) { c.moveTo(x + dx, top + 20); c.lineTo(x + dx, base - 10); } c.stroke();
      c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(x - 13, top + 18, 26, base - top - 26);
      // the capital and the base
      c.fillStyle = STONE; c.fillRect(x - 17, top + 6, 34, 12); c.fillRect(x - 16, base - 10, 32, 10);
      c.strokeRect(x - 17, top + 6, 34, 12); c.strokeRect(x - 16, base - 10, 32, 10);
      c.fillStyle = INK; c.beginPath(); c.arc(x - 12, top + 12, 2.6, 0, Math.PI * 2); c.arc(x + 12, top + 12, 2.6, 0, Math.PI * 2); c.fill();
    }
    // the entablature and the pediment
    c.fillStyle = STONE; c.fillRect(x0 - 6, top - 16, x1 - x0 + 12, 24);
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x0 - 6, top - 16, x1 - x0 + 12, 24);
    c.fillStyle = INK; c.beginPath(); for (let x = x0; x < x1; x += 14) c.rect(x, top - 4, 6, 4); c.fill();
    const ped = [[x0 - 14, top - 16], [CX, 990], [x1 + 14, top - 16]];
    c.fillStyle = STONE; poly(c, ped); c.fill();
    // the tympanum with a sunburst in gold where a relief would be
    c.fillStyle = STONE_S; poly(c, [[x0 + 12, top - 22], [CX, 1004], [x1 - 12, top - 22]]); c.fill();
    c.save(); poly(c, [[x0 + 12, top - 22], [CX, 1004], [x1 - 12, top - 22]]); c.clip();
    c.strokeStyle = GOLD[0]; c.lineWidth = 3; c.beginPath();
    for (let k = 0; k < 15; k++) { const a = Math.PI + (k + 0.5) * Math.PI / 15; c.moveTo(CX, top - 22); c.lineTo(CX + Math.cos(a) * 160, top - 22 + Math.sin(a) * 160); }
    c.stroke();
    c.fillStyle = GOLD[4]; c.beginPath(); c.arc(CX, top - 22, 16, Math.PI, 0); c.fill();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 2.2; poly(c, ped); c.stroke();
  }, { t: 6.6, d: 1.0, reveal: 'rise', ease: 'inOut' });
}
// the two great columns, a band of relief winding up each
function columns(p, L) {
  for (const s of [-1, 1]) {
    const x = CX + s * 196, hw = 26, y0 = 1200, y1 = 810;
    p.group(L, { x: x - 50, y: 700, w: 100, h: GY - 700 + 4 }, (c) => {
      // the pedestal
      c.fillStyle = STONE; c.fillRect(x - 42, y0, 84, GY - y0 - 22);
      c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x - 42, y0, 84, GY - y0 - 22);
      c.fillStyle = STONE_S; c.fillRect(x - 46, y0 - 8, 92, 10); c.strokeRect(x - 46, y0 - 8, 92, 10);
      c.fillStyle = INK; c.fillRect(x - 26, y0 + 10, 52, 3);
      // the shaft
      c.fillStyle = STONE; c.fillRect(x - hw, y1, 2 * hw, y0 - y1 - 8);
      c.save(); c.beginPath(); c.rect(x - hw, y1, 2 * hw, y0 - y1 - 8); c.clip();
      // the spiral band: slanting strips, light and dark by turns, with tiny figures as ticks
      for (let y = y0 + 40, k = 0; y > y1 - 60; y -= 26, k++) {
        c.fillStyle = k % 2 ? STONE_S : STONE;
        poly(c, [[x - hw, y], [x + hw, y - 18], [x + hw, y - 18 - 26], [x - hw, y - 26]]); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - hw, y); c.lineTo(x + hw, y - 18); c.stroke();
        c.strokeStyle = STONE_D; c.lineWidth = 1; c.beginPath();
        for (let t = 0.1; t < 1; t += 0.13) { const xx = x - hw + 2 * hw * t, yy = y - 18 * t - 6; c.moveTo(xx, yy); c.lineTo(xx + 1, yy - 12); }
        c.stroke();
      }
      c.fillStyle = 'rgba(80,60,30,.22)'; c.fillRect(s < 0 ? x - hw : x + hw - 12, y1, 12, y0 - y1);
      c.restore();
      c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x - hw, y1, 2 * hw, y0 - y1 - 8);
      // the capital: a broad block, then a small drum and dome with a gilt crown
      c.fillStyle = STONE; c.fillRect(x - 38, y1 - 16, 76, 16); c.strokeRect(x - 38, y1 - 16, 76, 16);
      c.fillStyle = STONE_S; c.fillRect(x - 22, y1 - 48, 44, 32); c.strokeRect(x - 22, y1 - 48, 44, 32);
      c.fillStyle = INK; c.fillRect(x - 4, y1 - 42, 8, 18);
      c.fillStyle = COPPER; c.beginPath(); c.ellipse(x, y1 - 48, 24, 26, 0, Math.PI, 0); c.fill(); c.stroke();
      c.fillStyle = GOLD[4]; poly(c, [[x - 12, y1 - 74], [x - 12, y1 - 88], [x - 6, y1 - 80], [x, y1 - 94], [x + 6, y1 - 80], [x + 12, y1 - 88], [x + 12, y1 - 74]]); c.fill();
      c.strokeStyle = GOLD_D; c.lineWidth = 1.2; c.stroke();
    }, { t: 5.5 + (s > 0 ? 0.3 : 0), d: 1.5, reveal: 'rise', ease: 'inOut' });
  }
}

// ================================================================ near the square
// the Secession: a white block, four pylons, and between them the dome of gilt laurel
function secession(p) {
  const x0 = 236, x1 = 432, mx = (x0 + x1) / 2, top = 1150;
  p.group('mid', { x: x0 - 10, y: 1000, w: x1 - x0 + 20, h: GY - 1000 + 6 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(x0, top, x1 - x0, GY - top);
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x0, top, x1 - x0, GY - top);
    // the pylons round the dome
    for (const px of [mx - 58, mx - 34, mx + 22, mx + 46]) {
      c.fillStyle = CREAM; c.fillRect(px, 1086, 12, top - 1086 + 2);
      c.strokeRect(px, 1086, 12, top - 1086 + 2);
      c.fillStyle = INK; c.fillRect(px, 1092, 12, 3);
    }
    // the entrance, with gold leaves above it
    c.fillStyle = INK; c.fillRect(mx - 20, 1196, 40, GY - 1196);
    c.fillStyle = GOLD[3]; c.fillRect(mx - 26, 1186, 52, 6);
    c.fillStyle = GOLD[1];
    for (let k = 0; k < 9; k++) { c.beginPath(); c.ellipse(mx - 24 + k * 6, 1178, 3, 6, 0.4, 0, Math.PI * 2); c.fill(); }
    // the band of lettering under the cornice, too small to read
    c.fillStyle = GOLD_D; for (let x = mx - 60; x < mx + 60; x += 6) c.fillRect(x, 1162, 3, 6);
    // the laurel trees in relief on the side walls
    for (const tx of [x0 + 26, x1 - 26]) {
      c.strokeStyle = GOLD_D; c.lineWidth = 1.6; c.beginPath(); c.moveTo(tx, GY - 6); c.lineTo(tx, 1180); c.stroke();
      c.fillStyle = GOLD[2]; c.beginPath(); c.arc(tx, 1180, 15, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD_D; c.beginPath(); for (let k = 0; k < 8; k++) { const a = k * 0.8; c.moveTo(tx + Math.cos(a) * 8 + 2, 1180 + Math.sin(a) * 8); c.arc(tx + Math.cos(a) * 8, 1180 + Math.sin(a) * 8, 2, 0, Math.PI * 2); } c.fill();
    }
  }, { t: 7.0, d: 0.9, reveal: 'rise' });
  // the dome: an openwork ball of gilt laurel leaves on its drum
  const rr = rng(1898), leaves = [];
  const dx = mx - 6, dy = 1084, dr = 48;
  for (let i = 0; i < 220; i++) {
    const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * (dr - 5);
    leaves.push([dx + Math.cos(a) * d, dy + Math.sin(a) * d, a + rr.range(-0.5, 0.5), rr.int(0, 4)]);
  }
  leaves.sort((a, b) => a[1] - b[1]);
  p.group('mid', { x: dx - dr - 10, y: dy - dr - 10, w: 2 * dr + 20, h: 2 * dr + 30 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(dx - 30, dy + 20, 60, 30);
    c.save(); c.beginPath(); c.arc(dx, dy, dr, 0, Math.PI * 2); c.clip();
    c.fillStyle = GOLD_D; c.fillRect(dx - dr, dy - dr, 2 * dr, 2 * dr);
    for (const [x, y, a, k] of leaves) {
      c.fillStyle = GOLD[k]; c.beginPath(); c.ellipse(x, y, 7.5, 3.4, a, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(90,60,10,.55)'; c.lineWidth = 0.6; c.stroke();
    }
    // the light on its upper right
    c.fillStyle = 'rgba(255,240,190,.3)'; c.beginPath(); c.arc(dx + 14, dy - 14, 22, 0, Math.PI * 2); c.fill();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(dx, dy, dr, 0, Math.PI * 2); c.stroke();
    c.strokeRect(dx - 30, dy + 20, 60, 30);
  }, { t: 7.6, d: 0.8, reveal: 'iris' });
}

// Klimt's trees: round crowns packed with small dots of color, thin trunks
function trees(p) {
  const specs = [[1140, 1110, 70], [1250, 1090, 82], [1350, 1112, 66], [474, 1140, 46], [1060, 1170, 40]];
  specs.forEach(([x, y, rad], i) => {
    const rr = rng(300 + i), dots = [];
    for (let k = 0; k < rad * 4.4; k++) {
      const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * (rad - 4);
      dots.push([x + Math.cos(a) * d, y + Math.sin(a) * d, rr.range(2.2, 5.2), rr.int(0, 3)]);
    }
    const tones = ['#5f8c4c', '#87a95a', '#c9c46a', '#e7d9a2'];
    p.group('mid', { x: x - rad - 6, y: y - rad - 6, w: 2 * rad + 12, h: GY - y + rad + 12 }, (c) => {
      c.fillStyle = INK; c.fillRect(x - 3, y + rad - 10, 6, GY - y - rad + 10);
      c.fillStyle = GREEN; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
      for (let k = 0; k < tones.length; k++) {
        c.fillStyle = tones[k]; c.beginPath();
        for (const [dx, dy, s, t] of dots) if (t === k) { c.moveTo(dx + s, dy); c.arc(dx, dy, s, 0, Math.PI * 2); }
        c.fill();
      }
      c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.stroke();
    }, { t: 7.3 + i * 0.18, d: 0.7, reveal: 'pop' });
  });
}

// Otto Wagner's Stadtbahn pavilion: white marble slabs in a green iron frame,
// gilt sunflowers, a curved roof
function pavilion(p) {
  const x0 = 1150, x1 = 1336, mx = (x0 + x1) / 2, top = 1150;
  p.group('mid', { x: x0 - 16, y: 1080, w: x1 - x0 + 32, h: GY - 1080 + 6 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(x0, top, x1 - x0, GY - top);
    // the iron frame: posts and a band, in green
    c.fillStyle = WAGNER;
    for (let x = x0; x <= x1 - 8; x += (x1 - x0 - 8) / 4) c.fillRect(x, top, 8, GY - top);
    c.fillRect(x0, top, x1 - x0, 10); c.fillRect(x0, GY - 30, x1 - x0, 6);
    // the sunflowers in the slabs: gold discs with dots
    for (let k = 0; k < 4; k++) {
      const sx = x0 + 4 + (k + 0.5) * (x1 - x0 - 8) / 4, sy = top + 32;
      c.fillStyle = GOLD[3]; c.beginPath(); for (let a = 0; a < 12; a++) { const aa = a * Math.PI / 6; c.moveTo(sx, sy); c.ellipse(sx + Math.cos(aa) * 8, sy + Math.sin(aa) * 8, 6, 2.4, aa, 0, Math.PI * 2); } c.fill();
      c.fillStyle = INK; c.beginPath(); c.arc(sx, sy, 4.5, 0, Math.PI * 2); c.fill();
      // the gilt lines falling from it
      c.strokeStyle = GOLD[1]; c.lineWidth = 1.4; c.beginPath(); for (const dx of [-6, 0, 6]) { c.moveTo(sx + dx, sy + 14); c.lineTo(sx + dx, sy + 52 - Math.abs(dx) * 2); } c.stroke();
    }
    // the curved roof, with its gilt crest
    c.fillStyle = WAGNER; c.beginPath(); c.moveTo(x0 - 10, top + 2); c.quadraticCurveTo(mx, top - 66, x1 + 10, top + 2); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.fillStyle = CREAM; c.beginPath(); c.moveTo(mx - 50, top - 2); c.quadraticCurveTo(mx, top - 40, mx + 50, top - 2); c.closePath(); c.fill();
    c.fillStyle = GOLD[3]; c.beginPath(); for (let k = -3; k <= 3; k++) { c.moveTo(mx + k * 12 + 4, top - 14); c.arc(mx + k * 12, top - 14, 4, 0, Math.PI * 2); } c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x0, top, x1 - x0, GY - top);
    // the opening
    c.fillStyle = INK; c.beginPath(); c.moveTo(mx - 18, GY); c.lineTo(mx - 18, 1214); c.arc(mx, 1214, 18, Math.PI, 0); c.lineTo(mx + 18, GY); c.fill();
  }, { t: 7.9, d: 0.9, reveal: 'rise' });
}

// ================================================================ the pool and the meadow
function pool(p) {
  // the water, and the church upside down in it, broken by ripples
  p.group('water', { x: IX0, y: POOL0 - 4, w: IX1 - IX0, h: WALK1 - POOL0 + 8 }, (c) => {
    c.fillStyle = WATER; c.fillRect(IX0, POOL0, IX1 - IX0, POOL1 - POOL0);
    c.save(); c.beginPath(); c.rect(IX0, POOL0, IX1 - IX0, POOL1 - POOL0); c.clip();
    c.translate(0, POOL0); c.scale(1, -0.36); c.translate(0, -GY);
    c.fillStyle = 'rgba(241,233,212,.4)';
    c.fillRect(546, 1046, 508, 200); c.fillRect(424, 960, 110, 300); c.fillRect(1066, 960, 110, 300);
    c.fillRect(CX - 124, 892, 248, 90); c.fillRect(CX - 222, 810, 52, 400); c.fillRect(CX + 170, 810, 52, 400);
    c.fillStyle = 'rgba(93,154,134,.6)'; c.beginPath(); c.ellipse(CX, 892, 120, 170, 0, Math.PI, 0); c.fill();
    c.fillStyle = 'rgba(214,176,85,.5)'; c.fillRect(IX0, 900, IX1 - IX0, 160);
    c.restore();
    // ripples: dark bands across the reflection
    c.fillStyle = WATER_D;
    for (let y = POOL0 + 6, k = 0; y < POOL1; y += 9 + k * 0.6, k++) c.fillRect(IX0, y, IX1 - IX0, 2 + k * 0.25);
    // the stone rim and the walk
    c.fillStyle = STONE; c.fillRect(IX0, POOL0 - 4, IX1 - IX0, 6); c.fillRect(IX0, POOL1, IX1 - IX0, 8);
    c.fillStyle = '#d9cba4'; c.fillRect(IX0, POOL1 + 8, IX1 - IX0, WALK1 - POOL1 - 8);
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(IX0, POOL1); c.lineTo(IX1, POOL1); c.moveTo(IX0, POOL1 + 8); c.lineTo(IX1, POOL1 + 8); c.moveTo(IX0, WALK1); c.lineTo(IX1, WALK1); c.stroke();
  }, { t: 8.3, d: 1.1, reveal: 'wipe', ease: 'inOut' });
  // Wagner's lamps along the walk: green posts, gilt globes
  const lamps = [300, 560, 1040, 1300];
  p.group('people', { x: IX0, y: POOL1 - 110, w: IX1 - IX0, h: 130 }, (c) => {
    for (const x of lamps) {
      c.fillStyle = WAGNER; c.fillRect(x - 3, POOL1 - 92, 6, 96);
      c.fillRect(x - 9, POOL1 - 4, 18, 8);
      c.fillStyle = INK; c.fillRect(x - 14, POOL1 - 96, 28, 4);
      for (const dx of [-12, 12]) { c.fillStyle = GOLD[4]; c.beginPath(); c.arc(x + dx, POOL1 - 104, 7, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); }
    }
  }, { t: 9.2, d: 0.6, reveal: 'rise' });
}
function meadow(p) {
  const rr = rng(1900), dots = [];
  // more and smaller far off, larger close
  for (let i = 0; i < 1700; i++) {
    const t = rr() ** 0.8, y = lerp(WALK1 + 6, IY1 - 12, t), s = lerp(2.2, 7.5, t) * rr.range(0.7, 1.2);
    dots.push([rr.range(IX0, IX1), y, s, rr.int(0, FLOWERS.length - 1), rr.chance(0.35)]);
  }
  // tall stems with round heads here and there, like Klimt's sunflowers and poppies
  const stems = [];
  for (let i = 0; i < 26; i++) {
    const x = rr.range(IX0 + 20, IX1 - 20), y = rr.range(1520, IY1 - 10), h = rr.range(40, 110);
    stems.push([x, y, h, rr.int(1, 4), rr.range(8, 15)]);
  }
  const parts = 5;
  for (let part = 0; part < parts; part++) {
    const a = IX0 + ((IX1 - IX0) * part) / parts, b = IX0 + ((IX1 - IX0) * (part + 1)) / parts;
    const mine = dots.filter(([x]) => x >= a && x < b);
    const st = stems.filter(([x]) => x >= a && x < b);
    p.group('meadow', { x: a - 20, y: WALK1 - 130, w: b - a + 40, h: IY1 - WALK1 + 130 }, (c) => {
      c.fillStyle = MEADOW; c.fillRect(a - 1, WALK1, b - a + 2, IY1 - WALK1);
      c.fillStyle = MEADOW_D; for (let y = WALK1 + 14; y < IY1; y += 22) c.fillRect(a - 1, y, b - a + 2, 3);
      for (let k = 0; k < FLOWERS.length; k++) {
        c.fillStyle = FLOWERS[k]; c.beginPath();
        for (const [x, y, s, t] of mine) if (t === k) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); }
        c.fill();
      }
      // a dark heart in some
      c.fillStyle = INK; c.beginPath();
      for (const [x, y, s, , ring] of mine) if (ring && s > 3.4) { c.moveTo(x + s * 0.35, y); c.arc(x, y, s * 0.35, 0, Math.PI * 2); }
      c.fill();
      for (const [x, y, h, k, rad] of st) {
        c.strokeStyle = '#6f8f4c'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 6, y - h / 2, x, y - h); c.stroke();
        c.fillStyle = FLOWERS[k]; c.beginPath(); c.arc(x, y - h, rad, 0, Math.PI * 2); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
        c.fillStyle = INK; c.beginPath(); c.arc(x, y - h, rad * 0.4, 0, Math.PI * 2); c.fill();
        c.fillStyle = GOLD[4]; c.beginPath(); c.arc(x, y - h, rad * 0.16, 0, Math.PI * 2); c.fill();
      }
    }, { t: 8.8 + part * 0.22, d: 0.9, reveal: 'rise' });
  }
}

// strollers on the walk: ladies in long checkered or black dresses, gentlemen in hats
function people(p) {
  const rr = rng(1905), folk = [];
  for (let x = IX0 + 40; x < IX1 - 30; x += rr.range(40, 120)) folk.push([x, rr.int(0, 3), rr.chance(0.5) ? 1 : -1, rr.range(0.9, 1.1)]);
  folk.forEach(([x, kind, dir, s], i) => {
    const y = WALK1 - 2;
    p.group('people', { x: x - 26, y: y - 70 * s, w: 52, h: 74 * s }, (c) => figure(c, x, y, s, kind, dir), { t: 9.6 + i * 0.07, d: 0.5, reveal: 'drop', dy: 14 });
  });
}
function figure(c, x, y, s, kind, dir) {
  c.save(); c.translate(x, y); c.scale(s * dir, s);
  if (kind < 2) {
    // a lady: a long bell of a dress, a fitted jacket, a wide hat
    const dress = [[-14, 0], [14, 0], [6, -30], [5, -40], [-5, -40], [-6, -30]];
    c.fillStyle = kind ? INK : CREAM; poly(c, dress); c.fill();
    if (!kind) {
      c.save(); poly(c, dress); c.clip();
      c.fillStyle = INK; for (let yy = -40; yy < 0; yy += 5) for (let xx = -16 + ((yy / 5) % 2 ? 5 : 0); xx < 16; xx += 10) c.fillRect(xx, yy, 5, 5);
      c.restore();
    }
    c.strokeStyle = INK; c.lineWidth = 1.2; poly(c, dress); c.stroke();
    c.fillStyle = '#e9cfb4'; c.beginPath(); c.arc(0, -45, 4.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; c.beginPath(); c.ellipse(0, -49, 11, 3, 0, 0, Math.PI * 2); c.fill(); c.fillRect(-4, -55, 8, 6);
    if (kind) { c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(6, -34); c.lineTo(10, -60); c.stroke(); c.fillStyle = RED; c.beginPath(); c.moveTo(-6, -60); c.quadraticCurveTo(10, -76, 26, -60); c.closePath(); c.fill(); }
  } else {
    // a gentleman: a dark coat, a bowler or a boater, a cane
    c.fillStyle = INK; c.fillRect(-3, -16, 2.5, 16); c.fillRect(1, -16, 2.5, 16);
    c.fillStyle = kind === 2 ? INK : '#4a4f5a'; poly(c, [[-7, -16], [7, -16], [6, -40], [-6, -40]]); c.fill();
    c.fillStyle = '#e9cfb4'; c.beginPath(); c.arc(0, -45, 4.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = kind === 2 ? INK : '#e8d9a8'; c.fillRect(-7, -50, 14, 2.4); c.fillRect(-4.5, -56, 9, 6);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(8, -26); c.lineTo(11, 0); c.stroke();
  }
  c.restore();
}

// ================================================================ the title
function title(p) {
  // WIEN, wide, gold with a black shadow, over a rule of small checks
  p.type('title', 'WIEN', CX, 372, {
    family: FONT, size: 300, color: GOLD[2], shadow: INK, sx: 9, sy: 9, align: 'center', track: 0.36, t: 10.6, gap: 0.28, d: 0.9, reveal: 'press',
  });
  // the checks either side of it, set before the letters
  p.group('title', { x: FX - 4, y: 392, w: FS + 8, h: 26 }, (c) => {
    const s = 10;
    c.fillStyle = INK;
    for (let x = FX, k = 0; x < FX + FS; x += s, k++) { c.fillRect(x, k % 2 ? 396 : 406, s, s); }
    c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(FX, 396, FS, 20);
  }, { t: 10.2, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // the Secession's motto under the picture, either side of a small gold square
  const y = 1806;
  // the two halves differ in length: shift the pair so the whole line is centered
  const m = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  m.font = `400 31px ${FONT}`;
  const wl = m.measureText('DER ZEIT IHRE KUNST').width + 0.2 * 31 * 18, wr = m.measureText('DER KUNST IHRE FREIHEIT').width + 0.2 * 31 * 22;
  const mx = CX + (wl - wr) / 2;
  p.type('title', 'DER ZEIT IHRE KUNST', mx - 34, y, { family: FONT, size: 31, color: INK, align: 'right', track: 0.2, t: 12.2, gap: 0.03, d: 0.5 });
  p.type('title', 'DER KUNST IHRE FREIHEIT', mx + 34, y, { family: FONT, size: 31, color: INK, align: 'left', track: 0.2, t: 12.3, gap: 0.03, d: 0.5 });
  p.group('title', { x: mx - 20, y: y - 34, w: 40, h: 40 }, (c) => {
    c.save(); c.translate(mx, y - 13); c.rotate(Math.PI / 4);
    c.fillStyle = GOLD[3]; c.fillRect(-11, -11, 22, 22); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(-11, -11, 22, 22);
    c.fillStyle = INK; c.fillRect(-3.5, -3.5, 7, 7);
    c.restore();
  }, { t: 12.1, d: 0.5, reveal: 'pop' });
  // a line of small black and gold squares below
  p.group('title', { x: FX - 4, y: 1856, w: FS + 8, h: 22 }, (c) => {
    for (let k = 0; k < 39; k++) {
      const x = CX + (k - 19) * 32;
      c.fillStyle = k % 2 ? GOLD[2] : INK; c.fillRect(x - 6, 1860, 12, 12);
    }
  }, { t: 13.0, d: 0.9, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ life
function life(p) {
  // swallows over the square
  const birds = [];
  const rr = rng(1910);
  for (let i = 0; i < 6; i++) birds.push([rr.range(500, 1100), rr.range(620, 820), rr.range(50, 140), rr.range(0.35, 0.7) * (rr.chance(0.5) ? 1 : -1), rr() * 7]);
  p.live('glint', {
    t: 9.8, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = INK;
      for (const [x0, y0, rad, w, ph] of birds) {
        const a = time * w + ph, x = x0 + Math.cos(a) * rad, y = y0 + Math.sin(a * 1.4) * rad * 0.3;
        const f = 0.5 + 0.5 * Math.sin(time * 11 + ph * 3);
        c.beginPath(); c.moveTo(x - 10, y - 4 * f); c.quadraticCurveTo(x - 3, y - 1, x, y); c.quadraticCurveTo(x + 3, y - 1, x + 10, y - 4 * f); c.quadraticCurveTo(x + 3, y + 1.5, x, y + 2); c.quadraticCurveTo(x - 3, y + 1.5, x - 10, y - 4 * f); c.fill();
      }
    },
  });
  // the pool shimmering
  const sh = [];
  for (let i = 0; i < 30; i++) sh.push([rr.range(IX0 + 10, IX1 - 30), rr.range(POOL0 + 6, POOL1 - 6), rr() * 7, rr.range(10, 34)]);
  p.live('water', {
    t: 9.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#f3ead0';
      for (const [x, y, ph, L] of sh) {
        const a = Math.sin(time * 1.2 + ph * 2);
        if (a < 0.25) continue;
        c.globalAlpha = (a - 0.25) * 0.9; c.fillRect(x + Math.sin(time * 0.4 + ph) * 6, y, L, 1.8);
      }
      c.globalAlpha = 1;
    },
  });
  // the gold catching the light: small four-pointed glints that come and go
  const gl = [];
  for (let i = 0; i < 14; i++) {
    const side = i % 4, t = rr();
    const pt = side === 0 ? [lerp(FX, FX + FS, t), FY + B / 2] : side === 1 ? [IX1 + B / 2, lerp(FY, FY + FS, t)] : side === 2 ? [lerp(FX, FX + FS, t), IY1 + B / 2] : [FX + B / 2, lerp(FY, FY + FS, t)];
    gl.push([...pt, rr() * 9, rr.range(0.5, 0.9)]);
  }
  for (let i = 0; i < 8; i++) gl.push([rr.range(IX0 + 30, IX1 - 30), rr.range(IY0 + 30, 760), rr() * 9, rr.range(0.4, 0.8)]);
  p.live('glint', {
    t: 13.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#fff6d6';
      for (const [x, y, ph, sp] of gl) {
        const a = Math.sin(time * sp + ph);
        if (a < 0.6) continue;
        const s = (a - 0.6) / 0.4 * 9;
        c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.22, y - s * 0.22); c.lineTo(x + s, y); c.lineTo(x + s * 0.22, y + s * 0.22); c.lineTo(x, y + s); c.lineTo(x - s * 0.22, y + s * 0.22); c.lineTo(x - s, y); c.lineTo(x - s * 0.22, y - s * 0.22); c.closePath(); c.fill();
      }
    },
  });
}
