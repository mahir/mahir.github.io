// Barcelona: a modernista map. The Eixample seen from above in a parallel
// view, its chamfered blocks and green courtyards in a grid that runs down to
// the Sagrada Família, standing up out of the plan; the sea at the top, a
// trencadís sun in the corner and a border of broken tiles. Sepia line, warm
// stone, Gaudí's blues and greens.

import { Plate, W, H, boxOf } from '../print.js';
import { shade, mix, lerp, clamp, poly, rng } from '../kit.js';

const INK = '#3a2820', PAPER = '#efe3c8', CREAM = '#f7eedb';
const SEA = '#2f78a8', SEA_D = '#22608e', SEA_L = '#5fa9c6', SHALLOW = '#8cc7c6';
const STONE = '#e2cda2', STONE_D = '#b99c6f', STONE_L = '#efe0bf', WALL = '#dcc196', WALL_D = '#b5976a';
const TERRA = '#c4673f', TERRA_D = '#9b4a2c', ROOF = '#d6b383', ROOF2 = '#cfa178', OCHRE = '#dca63c';
const COBALT = '#2856a3', TURQ = '#38a39b', OLIVE = '#7d8a3c', GREEN = '#6f9147', GREEN_D = '#4c6e36', LEAF = '#9bb35a';
const ROSE = '#d98a78', GOLD = '#e0b13a', SAND = '#ecd39b', STREET = '#eadcbd';
const TITLE = '"Macondo Swash Caps", serif';

export const city = {
  id: 'barcelona', name: 'Barcelona', wall: '#4e2a20',
  alt: "A map-like bird's-eye view of the Eixample's cut-corner blocks, with the Sagrada Família, the Torre Glòries, Park Güell and the sea, in a border of broken-tile mosaic",
  google: 'family=Macondo+Swash+Caps',
  fonts: [['400 100px "Macondo Swash Caps"', 'BARCELONACATALUNYAMEDITERRÀNIA·']],
  build,
};

// ---------------------------------------------------------------- the plan
// a parallel view: the ground is squeezed a little in height, and a height z
// stands straight up the sheet. Nothing shrinks with distance.
const CY = 0.78, CZ = 0.55;
const BW = 132, PITCH = 164, CH = 26, DEPTH = 32; // a block, the grid's pitch, its chamfer, the depth of its ring
const GX = -44, GY = 515; // the grid's origin on the sheet
const IX = 64, IY = 64, IW = W - 128, IH = H - 128; // the picture, inside the tile border

const up = ([x, y], z) => [x, y - z * CZ];
const cellX = (col) => GX + col * PITCH;
const cellY = (row) => GY + row * PITCH * CY;

// the Diagonal: a broad avenue cutting the grid, from Glòries down to the west
const D0 = [-60, 700], D1 = [1660, 1720], DW = 30;
const diagY = (x) => lerp(D0[1], D1[1], (x - D0[0]) / (D1[0] - D0[0]));
// Passeig de Gràcia: the avenue between two columns, made wide
const PDG = 1081;
const SF = { x: 512, y: 1478 }; // the foot of the Sagrada Família's Nativity front

// the sea, the coast and what stands on it
const COAST = [[-40, 486], [200, 482], [420, 478], [610, 474], [676, 466], [742, 398], [800, 404], [856, 450], [904, 476], [948, 566], [1236, 566], [1268, 478], [1660, 478]];
const coastY = (x) => {
  for (let i = 1; i < COAST.length; i++) if (x <= COAST[i][0]) return lerp(COAST[i - 1][1], COAST[i][1], (x - COAST[i - 1][0]) / (COAST[i][0] - COAST[i - 1][0]));
  return 478;
};
const MONT = [[1250, 760], [1262, 640], [1290, 560], [1330, 500], [1380, 470], [1450, 460], [1520, 472], [1600, 470], [1620, 760]];
const OLDTOWN = [[880, 572], [940, 580], [1240, 580], [1262, 640], [1250, 760], [1170, 744], [1120, 728], [1040, 700], [960, 680], [900, 650], [870, 600]];
const GUELL = [[930, 1960], [960, 1800], [1010, 1720], [1100, 1668], [1230, 1640], [1360, 1636], [1470, 1654], [1560, 1690], [1560, 1960]];
const PAU = [[60, 1700], [250, 1690], [440, 1730], [470, 1960], [60, 1960]];
const PARK = [[560, 500], [790, 500], [880, 570], [870, 640], [800, 668], [560, 668]];

function inside(pt, poly0) {
  let c = false;
  for (let i = 0, j = poly0.length - 1; i < poly0.length; j = i++) {
    const [xi, yi] = poly0[i], [xj, yj] = poly0[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// clip a polygon to one side of a line (keep where f(x, y) >= 0)
function clipPoly(pts, f) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]); }
  }
  return out;
}

// an octagon: a square with its corners cut, on the sheet
function octagon(x0, y0, w, h, ch) {
  return [[x0 + ch, y0], [x0 + w - ch, y0], [x0 + w, y0 + ch * CY], [x0 + w, y0 + h - ch * CY], [x0 + w - ch, y0 + h], [x0 + ch, y0 + h], [x0, y0 + h - ch * CY], [x0, y0 + ch * CY]];
}

function build() {
  const p = new Plate({ paper: PAPER, seed: 1882 });
  GLINTS.length = 0;
  const r = p.r;
  p.clip = { x: IX, y: IY, w: IW, h: IH };
  p.stack('sea', 'waves', 'land', 'plan', 'ground', 'blocks', 'trees', 'pops', 'sf', 'air', 'sun', 'title', 'border');
  p.layer('border', { clip: false });

  sea(p, r);
  land(p, r);
  grid(p, r);
  pops(p, r);
  sagrada(p, r);
  air(p, r);
  sun(p, r);
  title(p);
  border(p, r);
  return p;
}

// ---------------------------------------------------------------- the sea
function sea(p, r) {
  p.group('sea', { x: 0, y: 0, w: W, h: 600 }, (c) => {
    c.fillStyle = SEA; c.fillRect(0, 0, W, 600);
    c.fillStyle = SEA_D; c.fillRect(0, 0, W, 150);
    c.fillStyle = mix(SEA, SEA_D, 0.5); c.fillRect(0, 150, W, 90);
  }, { t: 0.1, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // the shallows along the coast
  const sh = COAST.map(([x, y]) => [x, y - 26]).concat([[1660, 600], [-40, 600]]);
  p.fill('sea', sh, SHALLOW, { t: 1.0, d: 1.0, reveal: 'fade' });
  // waves as a modernista ornament: rows of curling crests
  const rows = [];
  for (let y = 120, k = 0; y < 470; y += 30 + k * 1.2, k++) rows.push([y, k]);
  rows.forEach(([y, k], i) => {
    const crests = [];
    const L = 64 + k * 2.2, a = 9 + k * 0.4;
    for (let x = -40 + ((k % 2) * L) / 2 + r.range(-8, 8); x < W + 40; x += L * r.range(0.95, 1.15)) {
      if (y > coastY(x) - 34) continue;
      crests.push(crest(x, y, L * 0.8, a));
    }
    if (!crests.length) return;
    const near = y > 380;
    p.strokes('waves', crests, near ? 'rgba(247,238,219,.75)' : i % 2 ? 'rgba(140,199,198,.7)' : 'rgba(95,169,198,.85)', 1.6 + k * 0.08, { t: 1.2 + i * 0.12, d: 0.9, reveal: i % 2 ? 'wipeL' : 'wipe' });
  });
}

// one crest: a long rise, then the top curling over into a small spiral
function crest(x, y, L, a) {
  const pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([x + t * L * 0.75, y - Math.sin(t * Math.PI * 0.5) ** 1.5 * a]); }
  const cx = x + L * 0.75, cy = y - a * 0.45, rr = a * 0.55;
  for (let i = 0; i <= 12; i++) { const ang = -Math.PI / 2 + (i / 12) * Math.PI * 1.6, rad = rr * (1 - i / 16); pts.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]); }
  return pts;
}

// ---------------------------------------------------------------- the land
function land(p, r) {
  const ground = COAST.concat([[1660, H + 40], [-40, H + 40]]);
  p.fill('land', ground, STREET, { t: 0.9, d: 1.2, reveal: 'fall', ease: 'inOut' });
  // the beach, its edge, and the promenade
  const beach = COAST.slice(0, 6).map(([x, y]) => [x, y - 2]).concat(COAST.slice(0, 6).reverse().map(([x, y]) => [x, y + 26]));
  p.fill('land', beach, SAND, { t: 1.6, d: 0.9, reveal: 'wipe' });
  p.pen('land', COAST, INK, 2, { t: 1.4, d: 1.8 });

  // Montjuïc: a hill raised in relief, with rings of hachures
  p.fill('ground', MONT, GREEN, { t: 2.0, d: 1.0, reveal: 'rise', line: INK, lw: 1.6 });
  p.group('ground', boxOf(MONT, 8), (c) => {
    c.save(); poly(c, MONT); c.clip();
    c.strokeStyle = 'rgba(58,40,32,.35)'; c.lineWidth = 1.2;
    for (let k = 1; k < 8; k++) {
      c.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.15) {
        const x = 1440 + Math.cos(a) * (40 + k * 30), y = 540 + Math.sin(a) * (24 + k * 22);
        a ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
    const rr = rng(5);
    for (let i = 0; i < 160; i++) {
      const x = rr.range(1250, 1600), y = rr.range(470, 760);
      if (!inside([x, y], MONT)) continue;
      c.fillStyle = rr.pick([GREEN_D, LEAF, OLIVE]); c.beginPath(); c.arc(x, y, rr.range(3, 6), 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }, { t: 2.4, d: 0.9, reveal: 'fade' });

  // the old town: a tangle of small blocks and lanes, the Rambla through it
  const old = [];
  for (let i = 0; i < 260; i++) {
    const x = r.range(880, 1260), y = r.range(580, 760);
    if (!inside([x, y], OLDTOWN)) continue;
    old.push([x, y, r.range(12, 26), r.range(9, 18), r.range(-0.3, 0.3), r.pick([ROOF, ROOF2, TERRA, STONE_L, ROOF])]);
  }
  old.sort((a, b) => a[1] - b[1]);
  p.group('ground', boxOf(OLDTOWN, 20), (c) => {
    c.save(); poly(c, OLDTOWN); c.clip();
    for (const [x, y, w, h, a, col] of old) {
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = WALL_D; c.fillRect(-w / 2, -h / 2 + 4, w, 6);
      c.fillStyle = col; c.fillRect(-w / 2, -h / 2 - 4, w, h);
      c.strokeStyle = 'rgba(58,40,32,.55)'; c.lineWidth = 0.8; c.strokeRect(-w / 2, -h / 2 - 4, w, h);
      c.restore();
    }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.4; poly(c, OLDTOWN); c.stroke();
  }, { t: 2.6, d: 1.0, reveal: 'rise' });
  // the Rambla, from the square to the port, under its trees
  const ramb = [[1081, 716], [1100, 680], [1130, 640], [1160, 600], [1186, 572]];
  p.pen('ground', ramb, STREET, 14, { t: 3.0, d: 0.8 });
  const rt = [];
  for (let i = 0; i < ramb.length - 1; i++) for (let f = 0; f < 1; f += 0.2) for (const sd of [-6, 6]) rt.push([lerp(ramb[i][0], ramb[i + 1][0], f) + sd, lerp(ramb[i][1], ramb[i + 1][1], f) + sd * 0.3]);
  p.group('ground', boxOf(rt, 8), (c) => { for (const [x, y] of rt) { c.fillStyle = GREEN_D; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); } }, { t: 3.4, d: 0.6, reveal: 'pop' });

  // the park: lawns, a lake, the cascade fountain, and trees
  p.fill('ground', PARK, LEAF, { t: 2.3, d: 0.9, reveal: 'fade', line: INK, lw: 1.3 });
  p.group('ground', boxOf(PARK, 20), (c) => {
    c.fillStyle = SEA_L; c.beginPath(); c.ellipse(700, 590, 46, 20, -0.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    // the cascade: a little temple-front of stone with a gilded group on top
    c.fillStyle = STONE; c.fillRect(612, 520, 56, 24); c.strokeRect(612, 520, 56, 24);
    c.fillStyle = INK; for (let i = 0; i < 4; i++) c.fillRect(618 + i * 13, 528, 6, 14);
    c.fillStyle = GOLD; poly(c, [[630, 520], [650, 520], [640, 506]]); c.fill();
    const rr = rng(8);
    for (let i = 0; i < 90; i++) {
      const x = rr.range(560, 880), y = rr.range(505, 668);
      if (!inside([x, y], PARK) || Math.hypot((x - 700) / 52, (y - 590) / 26) < 1 || (x > 605 && x < 675 && y < 550)) continue;
      c.fillStyle = 'rgba(58,40,32,.25)'; c.beginPath(); c.arc(x + 2, y + 3, 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = rr.pick([GREEN, GREEN_D, OLIVE]); c.beginPath(); c.arc(x, y, rr.range(4.5, 7), 0, Math.PI * 2); c.fill();
    }
  }, { t: 2.8, d: 0.9, reveal: 'fade' });

  // the port: quays into the basin, a long mole, boats at their moorings
  p.group('ground', { x: 900, y: 440, w: 380, h: 140 }, (c) => {
    c.fillStyle = STONE_L; c.strokeStyle = INK; c.lineWidth = 1.2;
    poly(c, [[1040, 566], [1060, 566], [1074, 488], [1160, 482], [1164, 496], [1086, 502], [1070, 566]]); c.fill(); c.stroke();
    poly(c, [[1236, 566], [1250, 520], [1150, 518], [1150, 528], [1236, 532]]); c.fill(); c.stroke();
    // yachts
    const rr = rng(12);
    for (let i = 0; i < 30; i++) {
      const x = 950 + (i % 10) * 9, y = 520 + Math.floor(i / 10) * 14;
      c.fillStyle = CREAM; poly(c, [[x, y], [x + 4, y - 3], [x + 8, y], [x + 4, y + 10]]); c.fill();
      c.strokeStyle = 'rgba(58,40,32,.6)'; c.lineWidth = 0.7; c.stroke();
    }
    for (let i = 0; i < 14; i++) {
      const x = 1090 + (i % 7) * 9 + rr.range(-1, 1), y = 520 + Math.floor(i / 7) * 16;
      c.fillStyle = CREAM; poly(c, [[x, y], [x + 4, y - 3], [x + 8, y], [x + 4, y + 10]]); c.fill(); c.stroke();
    }
  }, { t: 3.2, d: 0.8, reveal: 'fade' });

  // palms along the beach
  const palms = [];
  for (let x = 90; x < 640; x += r.range(26, 40)) palms.push([x, coastY(x) + 34]);
  for (let x = 700; x < 860; x += 30) palms.push([x, coastY(x) + 30]);
  p.group('ground', boxOf(palms, 34), (c) => { for (const [x, y] of palms) smallPalm(c, x, y, 1); }, { t: 3.6, d: 0.8, reveal: 'rise' });
  // bathers on the sand, a sprinkle of color
  const dots = [];
  for (let i = 0; i < 160; i++) { const x = r.range(70, 700); dots.push([x, coastY(x) + r.range(4, 22), r.pick([COBALT, TERRA, OCHRE, CREAM, TURQ, ROSE])]); }
  p.group('ground', { x: 60, y: 440, w: 660, h: 80 }, (c) => { for (const [x, y, col] of dots) { c.fillStyle = col; c.fillRect(x, y, 2.6, 2.6); } }, { t: 3.9, d: 0.6, reveal: 'fade' });
}

function smallPalm(c, x, y, s) {
  c.strokeStyle = '#7a5a3e'; c.lineWidth = 2.2 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 2 * s, y - 14 * s, x + 1 * s, y - 26 * s); c.stroke();
  c.strokeStyle = GREEN_D; c.lineWidth = 2.4 * s;
  c.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.5;
    c.moveTo(x + 1 * s, y - 26 * s);
    c.quadraticCurveTo(x + Math.cos(a) * 8 * s, y - 26 * s + Math.sin(a) * 8 * s - 3 * s, x + Math.cos(a) * 14 * s, y - 26 * s + Math.sin(a) * 6 * s + 5 * s);
  }
  c.stroke();
}

// ---------------------------------------------------------------- the grid
function grid(p, r) {
  // first the plan: the streets' axes drawn as if by Cerdà's pen
  const hl = [], vl = [];
  for (let row = 0; row <= 11; row++) { const y = cellY(row) - (PITCH - BW) * CY / 2; hl.push([[-20, y], [W + 20, y]]); }
  for (let col = 0; col <= 10; col++) { const x = cellX(col) - (PITCH - BW) / 2; vl.push([[x, 470], [x, H + 20]]); }
  hl.forEach((l, i) => p.pen('plan', l, 'rgba(58,40,32,.35)', 1, { t: 1.8 + i * 0.06, d: 1.0 }));
  vl.forEach((l, i) => p.pen('plan', l, 'rgba(58,40,32,.35)', 1, { t: 2.0 + i * 0.06, d: 1.0 }));
  // the Diagonal's edges
  const nx = -(D1[1] - D0[1]), ny = D1[0] - D0[0], nl = Math.hypot(nx, ny);
  const off = (pt, k) => [pt[0] + (nx / nl) * k, pt[1] + (ny / nl) * k];
  const band = [off(D0, -DW), off(D1, -DW), off(D1, DW), off(D0, DW)];
  p.fill('plan', band, '#f2e6cb', { t: 2.6, d: 1.0, reveal: 'wipe' });
  p.fill('plan', [off(D0, -6), off(D1, -6), off(D1, 6), off(D0, 6)], '#e3cfa6', { t: 2.8, d: 1.0, reveal: 'wipe' });
  p.pen('plan', [off(D0, -DW), off(D1, -DW)], 'rgba(58,40,32,.55)', 1.2, { t: 2.8, d: 1.0 });
  p.pen('plan', [off(D0, DW), off(D1, DW)], 'rgba(58,40,32,.55)', 1.2, { t: 2.9, d: 1.0 });

  // the blocks, rising from the edges in toward the church
  const blocks = [];
  for (let row = 0; row <= 11; row++) {
    for (let col = 0; col <= 10; col++) {
      let x0 = cellX(col), w = BW;
      // the blocks on either side of Passeig de Gràcia give way to the avenue
      if (Math.abs(x0 + BW - PDG) < 40) w -= 16;
      if (Math.abs(x0 - PDG) < 40) { x0 += 16; w -= 16; }
      const y0 = cellY(row), h = BW * CY;
      const cx = x0 + w / 2, cy = y0 + h / 2;
      if (cy < 520) continue;
      if (inside([cx, cy], MONT) || inside([cx, cy], OLDTOWN) || inside([cx, cy], PARK) || inside([cx, cy + h * 0.3], PAU) || inside([cx, cy + h * 0.4], GUELL) || inside([x0 + 10, y0 + h - 10], GUELL) || inside([x0 + w - 10, y0 + h - 10], GUELL)) continue;
      if (y0 < coastY(cx) + 40) continue;
      if (cx > 1060 && cx < 1260 && cy < 760) continue; // Plaça de Catalunya and the old town's edge
      if (Math.abs(cx - SF.x) < 60 && Math.abs(cy - (SF.y - 50)) < 70) continue; // the church's own block
      let outline = octagon(x0, y0, w, h, CH);
      // cut by the Diagonal
      const side = (pt) => pt[1] - diagY(pt[0]);
      const half = DW * Math.hypot(1, (D1[1] - D0[1]) / (D1[0] - D0[0]));
      const sides = outline.map(side);
      if (sides.some((v) => Math.abs(v) < half) || (Math.min(...sides) < 0 && Math.max(...sides) > 0)) {
        const above = sides.reduce((a, v) => a + v, 0) < 0;
        outline = clipPoly(outline, (pt) => (above ? -side(pt) - half : side(pt) - half));
        if (outline.length < 3) continue;
        const b = boxOf(outline);
        if (b.w * b.h < 1600) continue;
        blocks.push({ outline, solid: true, x0, y0, w, h, cx, cy });
      } else blocks.push({ outline, solid: false, x0, y0, w, h, cx, cy });
    }
  }
  const dmax = Math.max(...blocks.map((b) => Math.hypot(b.cx - SF.x, (b.cy - SF.y) * 1.2)));
  blocks.forEach((b) => {
    b.d = Math.hypot(b.cx - SF.x, (b.cy - SF.y) * 1.2);
    b.t = 3.4 + (1 - b.d / dmax) ** 1.2 * 3.6;
    b.seed = Math.floor(r() * 1e9);
    b.h0 = r.range(36, 46);
    b.pal = r.pick(PALS);
    b.yard = r.chance(0.5) ? 'garden' : r.chance(0.6) ? 'built' : 'mixed';
  });
  blocks.sort((a, b) => a.t - b.t);
  for (const b of blocks) {
    const bb = boxOf(b.outline.map((pt) => up(pt, b.h0 + 14)).concat(b.outline), 4);
    p.group('blocks', bb, (c) => block(c, b), { t: b.t, d: 0.7, reveal: 'rise' });
  }

  // Plaça de Catalunya: an open square with its round lawn and fountains
  p.group('trees', { x: 1080, y: 690, w: 180, h: 80 }, (c) => {
    c.fillStyle = STONE_L; c.fillRect(1090, 700, 150, 56);
    c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(1090, 700, 150, 56);
    c.fillStyle = LEAF; c.beginPath(); c.ellipse(1165, 728, 44, 18, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = CREAM; c.beginPath(); c.ellipse(1165, 728, 22, 9, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = SEA_L; for (const dx of [-60, 60]) { c.beginPath(); c.ellipse(1165 + dx, 728, 7, 4, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
  }, { t: 6.4, d: 0.6, reveal: 'pop' });

  // plane trees down every street, and the Diagonal's double row
  const trees = [];
  for (let row = 0; row <= 11; row++) {
    const y = cellY(row) - (PITCH - BW) * CY / 2;
    for (const dy of [-7, 7]) for (let x = r.range(-20, 0); x < W; x += 15) trees.push([x + r.range(-1.5, 1.5), y + dy * CY]);
  }
  for (let col = 0; col <= 10; col++) {
    const x = cellX(col) - (PITCH - BW) / 2;
    const wide = Math.abs(x - PDG) < 30;
    for (const dx of wide ? [-18, -8, 8, 18] : [-8, 8]) for (let y = 480; y < H; y += 12) trees.push([x + dx + r.range(-1, 1), y]);
  }
  const dk = DW * Math.hypot(1, (D1[1] - D0[1]) / (D1[0] - D0[0]));
  for (let x = D0[0]; x < D1[0]; x += 12) for (const k of [-0.62, 0.62]) trees.push([x, diagY(x) + k * dk]);
  const ok = trees.filter(([x, y]) => y > coastY(x) + 40 && !inside([x, y + 6], GUELL) && !inside([x, y + 6], PAU) && !inside([x, y], MONT) && !inside([x, y], OLDTOWN) && !inside([x, y], PARK) && !(x > 1060 && x < 1260 && y < 760));
  ok.sort((a, b) => a[1] - b[1]);
  const chunk = Math.ceil(ok.length / 8);
  for (let i = 0; i < 8; i++) {
    const part = ok.slice(i * chunk, (i + 1) * chunk);
    if (!part.length) continue;
    p.group('trees', boxOf(part, 8), (c) => {
      for (const [x, y] of part) { c.fillStyle = 'rgba(58,40,32,.2)'; c.beginPath(); c.arc(x + 1.4, y + 1.8, 3.4, 0, Math.PI * 2); c.fill(); }
      for (const [x, y] of part) { c.fillStyle = GREEN_D; c.beginPath(); c.arc(x, y, 3.4, 0, Math.PI * 2); c.fill(); }
      for (const [x, y] of part) { c.fillStyle = GREEN; c.beginPath(); c.arc(x - 0.9, y - 1.1, 1.8, 0, Math.PI * 2); c.fill(); }
    }, { t: 6.6 + i * 0.18, d: 0.7, reveal: 'fade' });
  }
}

// a block: courtyard, walls toward us, and the roof terrace on top
// roof palettes: each block is a little warmer, paler or redder than the next
const PALS = [
  [ROOF, ROOF2, ROOF, '#dcc29a', TERRA, '#c9ad86', ROOF],
  ['#e2cba3', '#ead9b8', '#d8bf94', ROOF, '#e2cba3', '#c9ad86'],
  [ROOF2, TERRA, '#c97a52', ROOF, '#b86a48', ROOF2],
  [ROOF, '#d9b98a', OCHRE, '#dcc29a', ROOF2, ROOF],
];

function block(c, b) {
  const rr = rng(b.seed);
  const h = b.h0, z = h * CZ;
  const O = b.outline;
  const cen = O.reduce((s, q) => [s[0] + q[0] / O.length, s[1] + q[1] / O.length], [0, 0]);
  c.lineJoin = 'round';
  let hole = null;
  if (!b.solid) {
    hole = octagon(b.x0 + DEPTH, b.y0 + DEPTH * CY, b.w - 2 * DEPTH, b.h - 2 * DEPTH * CY, CH * 0.7);
    // the courtyard
    c.fillStyle = b.yard === 'built' ? '#cdb592' : GREEN; poly(c, hole); c.fill();
    const hb = boxOf(hole);
    if (b.yard !== 'built') {
      for (let i = 0; i < 9; i++) {
        const x = rr.range(hb.x + 8, hb.x + hb.w - 8), y = rr.range(hb.y + 12, hb.y + hb.h - 4);
        c.fillStyle = 'rgba(40,30,20,.25)'; c.beginPath(); c.arc(x + 2, y + 2, 6, 0, Math.PI * 2); c.fill();
        c.fillStyle = rr.pick([GREEN_D, OLIVE, LEAF, GREEN_D]); c.beginPath(); c.arc(x, y, rr.range(4.5, 7.5), 0, Math.PI * 2); c.fill();
      }
    }
    if (b.yard !== 'garden') {
      // low workshops filling the yard
      const n = b.yard === 'built' ? 5 : 2;
      for (let i = 0; i < n; i++) {
        const w = rr.range(14, 30), hh = rr.range(10, 18);
        const x = rr.range(hb.x + 4, hb.x + hb.w - w - 4), y = rr.range(hb.y + 10, hb.y + hb.h - hh - 2);
        c.fillStyle = rr.pick([ROOF2, '#bfa889', STONE_L]); c.fillRect(x, y - 5, w, hh);
        c.fillStyle = WALL_D; c.fillRect(x, y - 5 + hh, w, 5);
        c.strokeStyle = 'rgba(58,40,32,.5)'; c.lineWidth = 0.7; c.strokeRect(x, y - 5, w, hh + 5);
      }
    }
    // the far walls of the yard, in shade
    const hc = hole.reduce((s, q) => [s[0] + q[0] / hole.length, s[1] + q[1] / hole.length], [0, 0]);
    for (let i = 0; i < hole.length; i++) {
      const a = hole[i], bb = hole[(i + 1) % hole.length];
      const mx = (a[0] + bb[0]) / 2, my = (a[1] + bb[1]) / 2;
      if (my < hc[1] - 1) wall(c, a, bb, z, WALL_D, rr, 0.5);
    }
  }
  // the walls that face us
  for (let i = 0; i < O.length; i++) {
    const a = O[i], bb = O[(i + 1) % O.length];
    const mx = (a[0] + bb[0]) / 2, my = (a[1] + bb[1]) / 2;
    if (my > cen[1] + 1) wall(c, a, bb, z, Math.abs(a[1] - bb[1]) > 2 ? WALL : STONE, rr, 1);
  }
  // the roof: terraces of different houses, light wells, chimneys
  const R = O.map((q) => up(q, h));
  c.fillStyle = b.pal[0];
  c.beginPath(); poly(c, R);
  if (hole) { const RH = hole.map((q) => up(q, h)); c.moveTo(RH[0][0], RH[0][1]); for (let i = RH.length - 1; i >= 0; i--) c.lineTo(RH[i][0], RH[i][1]); c.closePath(); }
  c.fill();
  c.save(); c.clip();
  // the houses: bands across the ring in varied roof colors
  const rb = boxOf(R);
  for (let x = rb.x; x < rb.x + rb.w; x += rr.range(14, 24)) {
    const w = rr.range(14, 24);
    c.fillStyle = rr.pick(b.pal);
    c.fillRect(x, rb.y, w, rb.h * 0.32);
    c.fillStyle = rr.pick(b.pal);
    c.fillRect(x, rb.y + rb.h * 0.68, w, rb.h * 0.4);
  }
  for (let y = rb.y; y < rb.y + rb.h; y += rr.range(12, 20)) {
    const hh = rr.range(12, 20);
    c.fillStyle = rr.pick(b.pal); c.fillRect(rb.x, y, rb.w * 0.24, hh);
    c.fillStyle = rr.pick(b.pal); c.fillRect(rb.x + rb.w * 0.76, y, rb.w * 0.26, hh);
  }
  // seams between the houses
  c.strokeStyle = 'rgba(58,40,32,.35)'; c.lineWidth = 0.7; c.beginPath();
  for (let x = rb.x + 18; x < rb.x + rb.w; x += 19) { c.moveTo(x, rb.y); c.lineTo(x, rb.y + rb.h * 0.3); c.moveTo(x, rb.y + rb.h * 0.7); c.lineTo(x, rb.y + rb.h); }
  c.stroke();
  // light wells and stair huts
  for (let i = 0; i < 10; i++) {
    const x = rr.range(rb.x + 4, rb.x + rb.w - 8), y = rr.range(rb.y + 3, rb.y + rb.h - 6);
    if (hole && inside([x, y + z], hole)) continue;
    if (rr.chance(0.5)) { c.fillStyle = '#6e5440'; c.fillRect(x, y, 4, 3); }
    else { c.fillStyle = CREAM; c.fillRect(x, y - 3, 6, 5); c.fillStyle = WALL_D; c.fillRect(x, y + 2, 6, 2); }
  }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.1;
  poly(c, R); c.stroke();
  if (hole) { poly(c, hole.map((q) => up(q, h))); c.stroke(); }
  // the corner balconies on the chamfers glint a little
  c.fillStyle = 'rgba(247,238,219,.6)';
  for (let i = 0; i < O.length; i++) {
    const a = O[i], bb = O[(i + 1) % O.length];
    if (Math.abs(a[0] - bb[0]) > 2 && Math.abs(a[1] - bb[1]) > 2 && (a[1] + bb[1]) / 2 > cen[1]) {
      const mx = (a[0] + bb[0]) / 2, my = (a[1] + bb[1]) / 2;
      c.fillRect(mx - 1, my - z + 4, 2, z - 8);
    }
  }
}

// a wall from a to b on the ground, z high, with rows of windows and balconies
function wall(c, a, b, z, col, rr, lit) {
  const q = [a, b, up(b, z / CZ), up(a, z / CZ)];
  c.fillStyle = col; poly(c, q); c.fill();
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.round(len / 7));
  const floors = 5;
  const P = (u, v) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - v * z];
  c.fillStyle = lit ? '#5a4234' : 'rgba(58,40,32,.55)';
  for (let f = 0; f < floors; f++) {
    const v0 = 0.12 + (f / floors) * 0.8, v1 = v0 + 0.09;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.3) / n, u1 = (i + 0.7) / n;
      const p0 = P(u, v0), p1 = P(u1, v0), p2 = P(u1, v1), p3 = P(u, v1);
      poly(c, [p0, p1, p2, p3]); c.fill();
    }
  }
  if (lit) {
    // the balconies' rails: a fine line under each floor
    c.strokeStyle = 'rgba(58,40,32,.45)'; c.lineWidth = 0.6; c.beginPath();
    for (let f = 1; f < floors; f++) { const v = 0.1 + (f / floors) * 0.8; const p0 = P(0.02, v), p1 = P(0.98, v); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); }
    c.stroke();
    // shops at the foot
    c.fillStyle = 'rgba(58,40,32,.3)'; poly(c, [P(0, 0), P(1, 0), P(1, 0.09), P(0, 0.09)]); c.fill();
  }
  c.strokeStyle = INK; c.lineWidth = 0.9; poly(c, q); c.stroke();
}

// ---------------------------------------------------------------- the buildings everyone knows
function pops(p, r) {
  arch(p, 846, 728, 8.0);
  colom(p, 1186, 566, 8.3);
  montjuic(p, 8.4);
  guell(p, 8.45);
  santPau(p, 8.7);
  glories(p, 214, 856, 8.8);
  pedrera(p, 1236, 1330, 9.0);
  batllo(p, 1000, 1030, 9.3);
  // the landmarks do not overlap, so set them in time order for the press
  p.layers.pops.marks.sort((a, b) => a.t - b.t);
}

// the bullet-shaped tower at Glòries, skinned in colored panes
function glories(p, x, y, t) {
  const w = 34, hgt = 300;
  p.group('pops', { x: x - w - 10, y: y - hgt - 20, w: 2 * w + 20, h: hgt + 30 }, (c) => {
    const shape = () => {
      c.beginPath(); c.moveTo(x - w, y);
      c.lineTo(x - w, y - hgt * 0.62);
      c.bezierCurveTo(x - w, y - hgt * 0.92, x - w * 0.45, y - hgt, x, y - hgt);
      c.bezierCurveTo(x + w * 0.45, y - hgt, x + w, y - hgt * 0.92, x + w, y - hgt * 0.62);
      c.lineTo(x + w, y); c.closePath();
    };
    shape();
    const g = c.createLinearGradient(0, y, 0, y - hgt);
    g.addColorStop(0, mix(TERRA, PAPER, 0.2)); g.addColorStop(0.4, mix(ROSE, PAPER, 0.2)); g.addColorStop(0.72, mix(SEA_L, PAPER, 0.15)); g.addColorStop(1, mix(COBALT, PAPER, 0.15));
    c.fillStyle = g; c.fill();
    c.save(); shape(); c.clip();
    c.fillStyle = 'rgba(58,40,32,.22)'; c.fillRect(x + w * 0.3, y - hgt, w, hgt);
    c.fillStyle = 'rgba(247,238,219,.55)';
    for (let yy = y - 8; yy > y - hgt; yy -= 7) for (let xx = x - w + 3; xx < x + w; xx += 6) if ((xx + yy) % 3 < 1.5) c.fillRect(xx, yy, 2.4, 2.4);
    c.restore();
    shape(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  }, { t, d: 1.2, reveal: 'rise', ease: 'inOut' });
}

// the red-brick triumphal arch at the head of the park
function arch(p, x, y, t) {
  p.group('pops', { x: x - 50, y: y - 110, w: 100, h: 116 }, (c) => {
    const brick = '#b9573a';
    c.fillStyle = brick; c.beginPath(); c.rect(x - 38, y - 84, 76, 84);
    c.moveTo(x - 16, y); c.lineTo(x - 16, y - 38); c.arc(x, y - 38, 16, Math.PI, 0); c.lineTo(x + 16, y); c.fill('evenodd');
    c.strokeStyle = 'rgba(58,40,32,.4)'; c.lineWidth = 0.7; c.beginPath();
    for (let yy = y - 80; yy < y; yy += 5) { c.moveTo(x - 38, yy); c.lineTo(x - 17, yy); c.moveTo(x + 17, yy); c.lineTo(x + 38, yy); }
    c.stroke();
    c.fillStyle = STONE_L; c.fillRect(x - 40, y - 92, 80, 10); c.fillRect(x - 30, y - 62, 60, 6);
    c.fillStyle = GOLD; for (const dx of [-34, 34]) { c.beginPath(); c.arc(x + dx, y - 98, 4, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x - 38, y - 84, 76, 84); c.strokeRect(x - 40, y - 92, 80, 10);
    c.beginPath(); c.moveTo(x - 16, y); c.lineTo(x - 16, y - 38); c.arc(x, y - 38, 16, Math.PI, 0); c.lineTo(x + 16, y); c.stroke();
  }, { t, d: 0.9, reveal: 'rise' });
}

// the column at the foot of the Rambla, its figure pointing out to sea
function colom(p, x, y, t) {
  p.group('pops', { x: x - 34, y: y - 236, w: 68, h: 244 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 1.1;
    c.fillStyle = STONE; c.fillRect(x - 24, y - 30, 48, 30); c.strokeRect(x - 24, y - 30, 48, 30);
    c.fillStyle = STONE_D; c.fillRect(x + 8, y - 30, 16, 30);
    c.fillStyle = '#8a7a5e'; c.fillRect(x - 16, y - 50, 32, 20); c.strokeRect(x - 16, y - 50, 32, 20);
    // the column, fluted, and its capital and globe
    c.fillStyle = '#9a8a6a'; c.fillRect(x - 6, y - 190, 12, 140); c.strokeRect(x - 6, y - 190, 12, 140);
    c.strokeStyle = 'rgba(58,40,32,.45)'; c.beginPath(); for (const dx of [-2.5, 0.5, 3.5]) { c.moveTo(x + dx, y - 188); c.lineTo(x + dx, y - 52); } c.stroke();
    c.strokeStyle = INK;
    c.fillStyle = GOLD; c.fillRect(x - 10, y - 198, 20, 9); c.strokeRect(x - 10, y - 198, 20, 9);
    c.beginPath(); c.arc(x, y - 205, 7, 0, Math.PI * 2); c.fill(); c.stroke();
    // the figure, arm out
    c.fillStyle = '#6d6a5a';
    poly(c, [[x - 3, y - 212], [x + 3, y - 212], [x + 2.5, y - 226], [x - 2.5, y - 226]]); c.fill();
    c.beginPath(); c.arc(x, y - 229, 2.6, 0, Math.PI * 2); c.fill();
    c.lineWidth = 2; c.strokeStyle = '#6d6a5a'; c.beginPath(); c.moveTo(x + 2, y - 223); c.lineTo(x + 11, y - 228); c.stroke();
  }, { t, d: 1.0, reveal: 'rise' });
}

// Park Güell on its hill at the foot of the sheet: the long serpentine bench
// in broken tile, the hall of columns under the terrace, the dragon on the
// stair and the two gatehouses with their iced roofs
function guell(p, t) {
  p.fill('pops', GUELL, GREEN, { t, d: 1.0, reveal: 'rise', line: INK, lw: 1.6 });
  p.group('pops', boxOf(GUELL, 4), (c) => {
    c.save(); poly(c, GUELL); c.clip();
    c.strokeStyle = 'rgba(58,40,32,.3)'; c.lineWidth = 1.1;
    for (let k = 1; k < 9; k++) {
      c.beginPath();
      for (let a = Math.PI; a <= Math.PI * 2 + 0.01; a += 0.12) { const x = 1250 + Math.cos(a) * (60 + k * 46), y = 1960 + Math.sin(a) * (40 + k * 36); a > Math.PI ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
    const rr = rng(77);
    for (let i = 0; i < 700; i++) {
      const x = rr.range(930, 1560), y = rr.range(1640, 1960);
      if (!inside([x, y], GUELL)) continue;
      if (rr.chance(0.2)) { // a pine: an umbrella of dark green
        c.fillStyle = 'rgba(40,30,20,.25)'; c.beginPath(); c.ellipse(x + 2, y + 3, 9, 4, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = GREEN_D; c.beginPath(); c.ellipse(x, y, 9, 4.5, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = LEAF; c.beginPath(); c.ellipse(x - 2, y - 1.5, 4, 1.6, 0, 0, Math.PI * 2); c.fill();
      } else {
        c.fillStyle = rr.pick([GREEN_D, OLIVE, GREEN_D, LEAF]); c.beginPath(); c.arc(x, y, rr.range(2.5, 5), 0, Math.PI * 2); c.fill();
      }
    }
    c.restore();
  }, { t: t + 0.3, d: 0.8, reveal: 'fade' });
  // the terrace and its hall of columns
  const tx = 1250, ty = 1770;
  p.group('pops', { x: tx - 200, y: ty - 60, w: 400, h: 120 }, (c) => {
    c.fillStyle = SAND; c.beginPath(); c.ellipse(tx, ty - 22, 170, 30, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = '#b89c70'; c.fillRect(tx - 120, ty + 8, 240, 46);
    c.fillStyle = '#4a382e'; c.fillRect(tx - 112, ty + 14, 224, 40);
    for (let i = 0; i < 13; i++) {
      const x = tx - 108 + i * 18;
      c.fillStyle = CREAM; c.fillRect(x, ty + 14, 8, 40);
      c.fillStyle = STONE_D; c.fillRect(x + 5, ty + 14, 3, 40);
      c.fillStyle = CREAM; c.fillRect(x - 2, ty + 12, 12, 4);
      c.strokeStyle = INK; c.lineWidth = 0.8; c.strokeRect(x, ty + 14, 8, 40);
    }
    c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(tx - 120, ty + 8, 240, 46);
    // the cornice with its little drips
    c.fillStyle = STONE_L; c.fillRect(tx - 126, ty + 2, 252, 8); c.strokeRect(tx - 126, ty + 2, 252, 8);
  }, { t: t + 0.5, d: 0.8, reveal: 'rise' });
  // the serpentine bench: a meander of broken tile round the terrace's rim
  const bench = [];
  for (let u = 0; u <= 1.0001; u += 0.004) {
    const a = Math.PI * (1 - u) + Math.PI * 0.0;
    const wob = Math.sin(u * Math.PI * 14) * 9;
    bench.push([tx + Math.cos(a) * (172 + wob), ty - 22 + Math.abs(Math.sin(a)) * (30 + wob * 0.3) * 1.0 + 0 * u]);
  }
  p.group('pops', { x: tx - 196, y: ty - 40, w: 392, h: 90 }, (c) => {
    const rr = rng(91);
    const cols = [COBALT, TURQ, CREAM, GOLD, ROSE, OLIVE, SEA_L, TERRA, CREAM];
    for (let i = 0; i < bench.length - 1; i++) {
      const [x, y] = bench[i];
      c.fillStyle = 'rgba(58,40,32,.35)'; c.fillRect(x - 2, y + 2, 4, 8);
    }
    for (let i = 0; i < bench.length - 1; i++) {
      const [x, y] = bench[i];
      c.fillStyle = cols[Math.floor(i / 6 + rr() * 1.5) % cols.length];
      poly(c, [[x - 2.4, y - 6 + rr.range(-1, 1)], [x + 2.4, y - 6 + rr.range(-1, 1)], [x + 2.4, y + 2], [x - 2.4, y + 2]]); c.fill();
    }
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath();
    bench.forEach(([x, y], i) => (i ? c.lineTo(x, y - 6.5) : c.moveTo(x, y - 6.5))); c.stroke();
    c.beginPath(); bench.forEach(([x, y], i) => (i ? c.lineTo(x, y + 2.5) : c.moveTo(x, y + 2.5))); c.stroke();
  }, { t: t + 0.8, d: 1.0, reveal: 'wipe' });
  // the stair and the tiled dragon on it
  p.group('pops', { x: tx - 50, y: ty + 50, w: 100, h: 90 }, (c) => {
    c.fillStyle = STONE_L; poly(c, [[tx - 30, ty + 54], [tx + 30, ty + 54], [tx + 44, ty + 130], [tx - 44, ty + 130]]); c.fill();
    c.strokeStyle = 'rgba(58,40,32,.45)'; c.lineWidth = 0.8; c.beginPath();
    for (let y = ty + 60; y < ty + 130; y += 5) { const k = (y - ty - 54) / 76; c.moveTo(tx - 30 - k * 14, y); c.lineTo(tx + 30 + k * 14, y); }
    c.stroke();
    const dy = ty + 96;
    c.fillStyle = TURQ; c.beginPath(); c.moveTo(tx - 18, dy + 6); c.bezierCurveTo(tx - 10, dy - 12, tx + 6, dy - 10, tx + 16, dy - 2); c.quadraticCurveTo(tx + 22, dy, tx + 18, dy + 4);
    c.bezierCurveTo(tx + 4, dy + 2, tx - 6, dy + 6, tx - 18, dy + 6); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    const rr = rng(5);
    for (let i = 0; i < 18; i++) { c.fillStyle = rr.pick([GOLD, COBALT, OCHRE, CREAM, TERRA]); c.fillRect(tx - 12 + i * 1.5, dy - 5 + rr.range(-2, 4), 2.4, 2.4); }
    c.fillStyle = INK; c.beginPath(); c.arc(tx + 15, dy - 2, 1.2, 0, Math.PI * 2); c.fill();
  }, { t: t + 1.1, d: 0.6, reveal: 'pop' });
  // the gatehouses: walls of rubble, roofs iced in white tile
  for (const [gx, tower] of [[tx - 140, true], [tx + 140, false]]) {
    const gy = 1918;
    p.group('pops', { x: gx - 50, y: gy - 130, w: 100, h: 140 }, (c) => {
      c.fillStyle = '#d3b98d'; c.fillRect(gx - 30, gy - 40, 60, 40);
      c.fillStyle = '#4a382e'; c.fillRect(gx - 6, gy - 22, 12, 22); c.fillRect(gx - 22, gy - 30, 7, 9); c.fillRect(gx + 15, gy - 30, 7, 9);
      c.strokeStyle = INK; c.lineWidth = 1.1; c.strokeRect(gx - 30, gy - 40, 60, 40);
      // the roof: a brown cap, iced at the edges with white waves
      c.fillStyle = '#8a5a3c'; c.beginPath(); c.moveTo(gx - 36, gy - 38); c.quadraticCurveTo(gx - 30, gy - 78, gx, gy - 84); c.quadraticCurveTo(gx + 30, gy - 78, gx + 36, gy - 38); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = CREAM; c.beginPath(); c.moveTo(gx - 36, gy - 38);
      for (let k = 0; k <= 12; k++) { const u = k / 12; c.lineTo(gx - 36 + u * 72, gy - 44 - (k % 2) * 5); }
      c.lineTo(gx + 36, gy - 38); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(gx - 14, gy - 76); c.quadraticCurveTo(gx, gy - 90, gx + 14, gy - 76); c.quadraticCurveTo(gx, gy - 80, gx - 14, gy - 76); c.fill(); c.stroke();
      if (tower) {
        // the tower with its checkered blue-and-white spire and cross
        const sx = gx + 22;
        c.fillStyle = '#d3b98d'; c.fillRect(sx - 6, gy - 96, 12, 60); c.strokeRect(sx - 6, gy - 96, 12, 60);
        for (let k = 0; k < 6; k++) for (let j = 0; j < 2; j++) { c.fillStyle = (k + j) % 2 ? COBALT : CREAM; c.fillRect(sx - 6 + j * 6, gy - 96 - (k + 1) * 4, 6, 4); }
        c.strokeRect(sx - 6, gy - 120, 12, 24);
        c.fillStyle = CREAM; c.fillRect(sx - 1.5, gy - 134, 3, 14); c.fillRect(sx - 6, gy - 129, 12, 3);
      } else {
        // a mushroom on top
        c.fillStyle = CREAM; c.fillRect(gx - 2, gy - 96, 4, 12);
        c.fillStyle = '#c4453a'; c.beginPath(); c.ellipse(gx, gy - 96, 10, 6, 0, Math.PI, 0); c.fill(); c.stroke();
        c.fillStyle = CREAM; for (const dx of [-5, 0, 5]) { c.beginPath(); c.arc(gx + dx, gy - 99, 1.4, 0, Math.PI * 2); c.fill(); }
      }
    }, { t: t + 1.2 + (tower ? 0 : 0.15), d: 0.8, reveal: 'rise' });
  }
}

// the hospital of Sant Pau: brick pavilions in a garden, their domes and
// spires glazed in green, ochre and blue
function santPau(p, t) {
  p.fill('pops', PAU, LEAF, { t: t - 0.1, d: 0.8, reveal: 'fade', line: INK, lw: 1.3 });
  p.group('pops', boxOf(PAU, 4), (c) => {
    c.save(); poly(c, PAU); c.clip();
    c.strokeStyle = STREET; c.lineWidth = 6; c.beginPath();
    c.moveTo(60, 1960); c.lineTo(440, 1720); c.moveTo(250, 1700); c.lineTo(250, 1960); c.stroke();
    const rr = rng(31);
    for (let i = 0; i < 160; i++) {
      const x = rr.range(60, 470), y = rr.range(1690, 1960);
      if (!inside([x, y], PAU)) continue;
      c.fillStyle = rr.pick([GREEN_D, GREEN, OLIVE]); c.beginPath(); c.arc(x, y, rr.range(2.5, 5), 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }, { t, d: 0.6, reveal: 'fade' });
  const brick = '#b9573a';
  // a pavilion: brick walls, stone bands, and a tiled dome with a lantern
  const pav = (c, x, y, w, h, dome, cols) => {
    c.fillStyle = brick; c.fillRect(x - w / 2, y - h, w, h);
    c.fillStyle = STONE_L; c.fillRect(x - w / 2, y - h, w, 4); c.fillRect(x - w / 2, y - h * 0.5, w, 3);
    c.fillStyle = '#4a382e'; for (let i = 0; i < Math.floor(w / 12); i++) { const xx = x - w / 2 + 5 + i * 12; c.fillRect(xx, y - h + 8, 5, h * 0.3); c.fillRect(xx, y - h * 0.45, 5, h * 0.3); }
    c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x - w / 2, y - h, w, h);
    c.save(); c.beginPath(); c.ellipse(x, y - h, w * 0.32, dome, 0, Math.PI, 0); c.closePath(); c.clip();
    for (let k = 0; k < 8; k++) { c.fillStyle = cols[k % cols.length]; c.fillRect(x - w, y - h - dome + k * (dome / 8) * 1.1, w * 2, dome / 8 + 1); }
    c.fillStyle = 'rgba(30,20,20,.2)'; c.fillRect(x + w * 0.08, y - h - dome, w, dome);
    c.restore();
    c.beginPath(); c.ellipse(x, y - h, w * 0.32, dome, 0, Math.PI, 0); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.arc(x, y - h - dome - 3, 3, 0, Math.PI * 2); c.fill(); c.stroke();
  };
  p.group('pops', { x: 70, y: 1700, w: 400, h: 200 }, (c) => {
    pav(c, 120, 1830, 60, 36, 24, [GREEN, OCHRE, GREEN_D, OCHRE]);
    pav(c, 400, 1820, 60, 36, 24, [COBALT, CREAM, COBALT, GOLD]);
    pav(c, 165, 1905, 70, 40, 26, [OCHRE, TERRA, GOLD, TERRA]);
    pav(c, 355, 1900, 70, 40, 26, [GREEN, CREAM, GREEN_D, GOLD]);
  }, { t: t + 0.2, d: 0.9, reveal: 'rise' });
  // the main house with its clock tower and pointed glazed spire
  p.group('pops', { x: 160, y: 1660, w: 180, h: 280 }, (c) => {
    const x = 260, y = 1930;
    c.fillStyle = brick; c.fillRect(x - 74, y - 70, 148, 70);
    c.fillStyle = STONE_L; for (const yy of [y - 70, y - 40]) c.fillRect(x - 74, yy, 148, 4);
    c.fillStyle = '#4a382e';
    for (let i = 0; i < 9; i++) { const xx = x - 66 + i * 16; c.beginPath(); c.moveTo(xx, y - 44); c.lineTo(xx, y - 58); c.arc(xx + 5, y - 58, 5, Math.PI, 0); c.lineTo(xx + 10, y - 44); c.fill(); }
    for (let i = 0; i < 3; i++) { const xx = x - 24 + i * 18; c.beginPath(); c.moveTo(xx, y); c.lineTo(xx, y - 22); c.arc(xx + 6, y - 22, 6, Math.PI, 0); c.lineTo(xx + 12, y); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 1.1; c.strokeRect(x - 74, y - 70, 148, 70);
    // gables at either end
    for (const dx of [-60, 60]) { c.fillStyle = brick; poly(c, [[x + dx - 14, y - 70], [x + dx + 14, y - 70], [x + dx, y - 92]]); c.fill(); c.stroke(); }
    // the tower
    c.fillStyle = brick; c.fillRect(x - 16, y - 170, 32, 100); c.strokeRect(x - 16, y - 170, 32, 100);
    c.fillStyle = CREAM; c.beginPath(); c.arc(x, y - 140, 9, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x, y - 140); c.lineTo(x, y - 146); c.moveTo(x, y - 140); c.lineTo(x + 4, y - 138); c.stroke();
    c.fillStyle = '#4a382e'; c.fillRect(x - 6, y - 118, 12, 30);
    // the spire: glazed scales in green and ochre
    const sp = [[x - 20, y - 170], [x + 20, y - 170], [x, y - 250]];
    c.save(); poly(c, sp); c.clip();
    for (let k = 0; k < 12; k++) for (let j = -4; j <= 4; j++) { c.fillStyle = (k + j) % 2 ? GREEN : OCHRE; c.beginPath(); c.arc(x + j * 7 + (k % 2) * 3.5, y - 172 - k * 7, 4, 0, Math.PI); c.fill(); }
    c.fillStyle = 'rgba(30,20,20,.2)'; c.fillRect(x, y - 250, 22, 80);
    c.restore();
    poly(c, sp); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.arc(x, y - 254, 3.5, 0, Math.PI * 2); c.fill(); c.stroke();
  }, { t: t + 0.4, d: 1.0, reveal: 'rise', ease: 'inOut' });
}

// the castle on Montjuïc and the domed palace on its slope
function montjuic(p, t) {
  p.group('pops', { x: 1300, y: 420, w: 260, h: 340 }, (c) => {
    // the castle: a star-shaped fort
    const cx = 1450, cy = 500;
    const star = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const rad = i % 2 ? 26 : 46; star.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * CY]); }
    c.fillStyle = WALL_D; poly(c, star.map(([x, y]) => [x, y + 8])); c.fill();
    c.fillStyle = STONE; poly(c, star); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = STONE_D; c.fillRect(cx - 14, cy - 12, 28, 18); c.strokeRect(cx - 14, cy - 12, 28, 18);
    c.fillStyle = TERRA; c.fillRect(cx - 1, cy - 30, 2, 18); poly(c, [[cx + 1, cy - 30], [cx + 12, cy - 26], [cx + 1, cy - 22]]); c.fill();
    // the palace: a long front, a big dome and four towers
    const px = 1370, py = 700;
    c.fillStyle = STONE_L; c.fillRect(px - 60, py - 34, 120, 34); c.strokeRect(px - 60, py - 34, 120, 34);
    c.fillStyle = INK; for (let i = 0; i < 12; i++) c.fillRect(px - 54 + i * 9.6, py - 26, 4, 16);
    c.fillStyle = STONE; c.beginPath(); c.arc(px, py - 34, 24, Math.PI, 0); c.fill(); c.stroke();
    c.fillStyle = STONE_D; c.beginPath(); c.arc(px, py - 34, 24, -Math.PI / 2, 0); c.lineTo(px, py - 34); c.fill();
    c.beginPath(); c.arc(px, py - 34, 24, Math.PI, 0); c.stroke();
    c.fillStyle = STONE_L; c.fillRect(px - 3, py - 66, 6, 10); c.strokeRect(px - 3, py - 66, 6, 10);
    for (const dx of [-50, -30, 30, 50]) { c.fillStyle = STONE_L; c.fillRect(px + dx - 4, py - 60, 8, 26); c.strokeRect(px + dx - 4, py - 60, 8, 26); poly(c, [[px + dx - 4, py - 60], [px + dx + 4, py - 60], [px + dx, py - 70]]); c.fill(); c.stroke(); }
    // the stairs and fountains down in front
    c.fillStyle = SEA_L; c.fillRect(px - 10, py + 4, 20, 40); c.strokeRect(px - 10, py + 4, 20, 40);
  }, { t, d: 1.1, reveal: 'rise' });
}

// La Pedrera: a quarry of rippling stone wrapped round its corner, tangled
// iron balconies, and the helmeted chimneys on the roof
function pedrera(p, x, y, t) {
  const w = 236, hgt = 132, F = 5;
  const x0 = x - w / 2;
  // each floor's lip swells in and out along the front
  const lip = (u, f) => y - 6 - (f / F) * (hgt - 14) + Math.sin(u * Math.PI * 4.2 + f * 0.9) * 4.5 + Math.sin(u * Math.PI * 9) * 1.5;
  const top = (u) => y - hgt + Math.sin(u * Math.PI * 4.2) * 6;
  p.group('pops', { x: x0 - 16, y: y - hgt - 60, w: w + 32, h: hgt + 70 }, (c) => {
    const outline = () => {
      c.beginPath(); c.moveTo(x0, y);
      for (let u = 0; u <= 1.0001; u += 0.02) c.lineTo(x0 + u * w, top(u));
      c.lineTo(x0 + w, y); c.closePath();
    };
    outline(); c.fillStyle = '#efe6d2'; c.fill();
    c.save(); outline(); c.clip();
    // the corner turns away from us: the right part in shade
    c.fillStyle = 'rgba(150,120,90,.22)'; c.fillRect(x0 + w * 0.62, y - hgt - 20, w, hgt + 20);
    for (let f = 0; f < F; f++) {
      // the recess of the floor: a dark band between two lips
      c.fillStyle = '#4a382e'; c.beginPath();
      for (let u = 0; u <= 1.0001; u += 0.02) { const xx = x0 + u * w, yy = lip(u, f + 1) + 9; u ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
      for (let u = 1; u >= -0.0001; u -= 0.02) c.lineTo(x0 + u * w, lip(u, f) - 1);
      c.closePath(); c.fill();
      // the stone piers between the openings, soft as dough
      const n = 10, piers = [];
      for (let i = 0; i <= n; i++) piers.push(x0 + (i / n) * w + Math.sin(i * 2.3 + f * 1.1) * 4);
      c.fillStyle = '#efe6d2';
      for (const px of piers) {
        const u = (px - x0) / w, yt = lip(u, f + 1) + 6, yb = lip(u, f) + 1;
        c.beginPath(); c.moveTo(px - 6, yb); c.quadraticCurveTo(px - 3, (yt + yb) / 2, px - 7, yt); c.lineTo(px + 7, yt); c.quadraticCurveTo(px + 3, (yt + yb) / 2, px + 6, yb); c.closePath(); c.fill();
      }
      // the iron balconies: a tangle along each lip, like seaweed
      if (f > 0) {
        c.strokeStyle = '#1e1613'; c.lineWidth = 1; c.beginPath();
        for (let i = 0; i < n; i++) {
          const a = piers[i] + 6, b = piers[i + 1] - 6;
          for (let xx = a; xx < b; xx += 2.2) {
            const u = (xx - x0) / w, yb = lip(u, f) - 1;
            const h = 4 + Math.abs(Math.sin(xx * 0.7 + f)) * 4;
            c.moveTo(xx, yb); c.quadraticCurveTo(xx + Math.sin(xx * 1.3) * 3, yb - h * 0.6, xx + Math.cos(xx) * 2, yb - h);
          }
        }
        c.stroke();
      }
      // the lip itself: a band of light stone with a shadow under it
      c.strokeStyle = 'rgba(130,100,72,.55)'; c.lineWidth = 3; c.beginPath();
      for (let u = 0; u <= 1.0001; u += 0.02) { const xx = x0 + u * w, yy = lip(u, f) + 2; u ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
      c.stroke();
      c.strokeStyle = '#f7f0e0'; c.lineWidth = 2; c.beginPath();
      for (let u = 0; u <= 1.0001; u += 0.02) { const xx = x0 + u * w, yy = lip(u, f); u ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
      c.stroke();
    }
    c.restore();
    outline(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
    // the chimneys and stair towers: warriors in helmets, two in broken tile
    const chim = [[0.08, 26, CREAM], [0.2, 34, '#d8cbb0'], [0.31, 22, TURQ], [0.45, 38, CREAM], [0.58, 28, '#d8cbb0'], [0.7, 34, OLIVE], [0.82, 24, CREAM], [0.92, 30, '#d8cbb0']];
    for (const [u, hh, col] of chim) {
      const xx = x0 + u * w, yb = top(u) + 3;
      c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1;
      c.beginPath(); c.moveTo(xx - 6, yb); c.bezierCurveTo(xx - 9, yb - hh * 0.4, xx - 2, yb - hh * 0.5, xx - 4, yb - hh * 0.78);
      c.lineTo(xx + 4, yb - hh * 0.78); c.bezierCurveTo(xx + 2, yb - hh * 0.5, xx + 9, yb - hh * 0.4, xx + 6, yb); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(xx, yb - hh * 0.84, 6.5, 5.5, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = INK; c.fillRect(xx - 4.5, yb - hh * 0.86, 9, 1.8);
      c.beginPath(); c.moveTo(xx, yb - hh * 0.84 - 5); c.lineTo(xx, yb - hh * 0.84 - 12); c.moveTo(xx - 3, yb - hh * 0.84 - 9); c.lineTo(xx + 3, yb - hh * 0.84 - 9); c.stroke();
    }
  }, { t, d: 1.2, reveal: 'rise', ease: 'inOut' });
}

// Casa Batlló: bone columns, a mosaic front, mask balconies, and the dragon's
// back for a roof with its turret and cross
function batllo(p, x, y, t) {
  const w = 150, hgt = 230;
  const x0 = x - w / 2, x1 = x + w / 2;
  p.group('pops', { x: x0 - 30, y: y - hgt - 100, w: w + 60, h: hgt + 110 }, (c) => {
    c.save(); c.translate(x, y); c.scale(0.8, 0.8); c.translate(-x, -y);
    // the walls on either side, plain, to frame it
    c.fillStyle = STONE; c.fillRect(x0 - 24, y - hgt + 30, 24, hgt - 30); c.fillRect(x1, y - hgt + 50, 24, hgt - 50);
    c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x0 - 24, y - hgt + 30, 24, hgt - 30); c.strokeRect(x1, y - hgt + 50, 24, hgt - 50);
    c.fillStyle = '#5a4234';
    for (let f = 0; f < 6; f++) for (const xx of [x0 - 18, x0 - 9, x1 + 5, x1 + 14]) c.fillRect(xx, y - 30 - f * 30, 5, 12);
    // the front: cream, strewn with broken tile in blues and greens
    c.fillStyle = '#d3e2d8'; c.fillRect(x0, y - hgt, w, hgt);
    const rr = rng(21);
    for (let i = 0; i < 1100; i++) {
      const px = rr.range(x0 + 1, x1 - 1), py = rr.range(y - hgt + 2, y - 72);
      const up0 = (y - 72 - py) / (hgt - 72);
      c.fillStyle = rr.chance(0.12) ? rr.pick([GOLD, ROSE, CREAM]) : rr.pick(up0 > 0.5 ? [COBALT, SEA_L, TURQ, COBALT] : [TURQ, SEA_L, OLIVE, '#9cc8b8']);
      c.fillRect(px, py, rr.range(1.2, 2.6), rr.range(1.2, 2.6));
    }
    // round ceramic discs scattered over it
    for (let i = 0; i < 26; i++) {
      const px = rr.range(x0 + 6, x1 - 6), py = rr.range(y - hgt + 8, y - 80);
      c.fillStyle = rr.pick([GOLD, OCHRE, CREAM, ROSE]); c.beginPath(); c.arc(px, py, rr.range(2.4, 3.6), 0, Math.PI * 2); c.fill();
    }
    // the main floor: bone-like columns and wide, rounded windows
    c.fillStyle = '#efe5cf'; c.fillRect(x0, y - 72, w, 72);
    c.fillStyle = '#4d3b31';
    for (let i = 0; i < 4; i++) {
      const wx = x0 + 10 + i * 34;
      c.beginPath(); c.moveTo(wx, y - 6); c.lineTo(wx, y - 44); c.quadraticCurveTo(wx + 14, y - 64, wx + 28, y - 44); c.lineTo(wx + 28, y - 6); c.closePath(); c.fill();
    }
    c.fillStyle = '#efe5cf'; c.strokeStyle = INK; c.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const bx = x0 + 6 + i * 34;
      // a bone: thin in the middle, knuckled at the ends
      c.beginPath(); c.moveTo(bx, y); c.quadraticCurveTo(bx + 4, y - 30, bx, y - 52); c.lineTo(bx + 8, y - 52); c.quadraticCurveTo(bx + 4, y - 30, bx + 8, y); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.arc(bx + 4, y - 30, 3, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    // the balconies: bone-white iron masks, wide and low, with two eye holes
    for (let f = 0; f < 4; f++) {
      for (let i = 0; i < 3; i++) {
        const bx = x0 + 28 + i * 47 + (f % 2) * 6, by = y - 96 - f * 32;
        c.fillStyle = '#4d3b31'; c.beginPath(); c.roundRect(bx - 8, by - 24, 16, 22, [8, 8, 0, 0]); c.fill();
        c.fillStyle = '#f1ead8';
        c.beginPath(); c.moveTo(bx - 15, by - 4); c.quadraticCurveTo(bx - 8, by - 13, bx, by - 8); c.quadraticCurveTo(bx + 8, by - 13, bx + 15, by - 4);
        c.lineTo(bx + 13, by + 4); c.quadraticCurveTo(bx, by + 1, bx - 13, by + 4); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#4d3b31';
        for (const dx of [-6, 6]) { c.beginPath(); c.ellipse(bx + dx, by - 3, 2.4, 1.3, dx * 0.03, 0, Math.PI * 2); c.fill(); }
      }
    }
    c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(x0, y - hgt, w, hgt);
    // the roof: the dragon's back, an arch of scales graded from green to rose
    const ry = y - hgt;
    // the back rises slowly from the left, peaks past the middle and drops away
  const hump = (u) => (u < 0.62 ? Math.sin((u / 0.62) * Math.PI / 2) ** 1.3 : Math.cos(((u - 0.62) / 0.38) * Math.PI / 2) ** 0.8);
  const spine = (u) => [x0 - 4 + u * (w + 8), ry - 8 - hump(u) * 54];
    c.save();
    c.beginPath(); c.moveTo(x0 - 4, ry + 2);
    for (let u = 0; u <= 1.0001; u += 0.02) { const [sx, sy] = spine(u); c.lineTo(sx, sy); }
    c.lineTo(x1 + 4, ry + 2); c.closePath();
    c.fillStyle = TURQ; c.fill(); c.clip();
    for (let row = 0; row < 9; row++) {
      for (let k = 0; k < 18; k++) {
        const u = (k + (row % 2) * 0.5) / 17;
        const [sx, sy] = spine(clamp(u, 0, 1));
        const yy = sy + 6 + row * 8.5, xx = sx;
        const col = mix(mix('#3f9a7e', '#4a78b8', clamp(u * 1.6, 0, 1)), '#d97a6a', clamp((u - 0.55) * 2.2, 0, 1));
        c.fillStyle = shade(col, 1 - row * 0.03);
        c.beginPath(); c.arc(xx, yy, 5.6, 0, Math.PI); c.lineTo(xx - 5.6, yy - 4); c.lineTo(xx + 5.6, yy - 4); c.fill();
        c.strokeStyle = 'rgba(40,30,25,.55)'; c.lineWidth = 0.7; c.beginPath(); c.arc(xx, yy, 5.6, 0, Math.PI); c.stroke();
      }
    }
    c.restore();
    // the spine: a row of rounded ceramic knuckles
    for (let u = 0.02; u < 1; u += 0.06) {
      const [sx, sy] = spine(u);
      c.fillStyle = mix(GOLD, ROSE, u); c.beginPath(); c.arc(sx, sy - 2, 4.4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    }
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath();
    for (let u = 0; u <= 1.0001; u += 0.02) { const [sx, sy] = spine(u); u ? c.lineTo(sx, sy) : c.moveTo(sx, sy); }
    c.stroke();
    // the turret with its bulb and four-armed cross
    const tx = x0 + 22, ty = ry - 6;
    c.fillStyle = '#efe5cf'; c.fillRect(tx - 7, ty - 46, 14, 46); c.strokeRect(tx - 7, ty - 46, 14, 46);
    c.fillStyle = COBALT; c.font = '700 9px serif'; c.textAlign = 'center';
    for (let i = 0; i < 4; i++) c.fillRect(tx - 3, ty - 40 + i * 10, 6, 5);
    c.fillStyle = GOLD; c.beginPath(); c.arc(tx, ty - 52, 8, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = CREAM; c.lineWidth = 1;
    c.fillRect(tx - 2.5, ty - 78, 5, 20); c.strokeRect(tx - 2.5, ty - 78, 5, 20);
    c.fillRect(tx - 10, ty - 70, 20, 5); c.strokeRect(tx - 10, ty - 70, 20, 5);
    // chimneys behind the ridge, capped in broken tile
    for (const [dx, hh, col] of [[w * 0.62, 26, COBALT], [w * 0.74, 34, TURQ], [w * 0.86, 22, GOLD]]) {
      const cx = x0 + dx, cy = spine(dx / w)[1] + 8;
      c.fillStyle = '#d8c8a6'; c.fillRect(cx - 4, cy - hh, 8, hh - 6); c.strokeRect(cx - 4, cy - hh, 8, hh - 6);
      c.fillStyle = col; c.beginPath(); c.ellipse(cx, cy - hh, 7, 6, 0, Math.PI, 0); c.fill(); c.stroke();
    }
    c.restore();
  }, { t, d: 1.3, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- the Sagrada Família
// seen from the Nativity side: the four bell towers in front with their
// mosaic pinnacles, the evangelists' towers, Mary's star and Jesus's cross
function sagrada(p, r) {
  const X = SF.x, Y = SF.y;
  // the body of the church: nave walls, buttresses and tracery windows
  p.group('sf', { x: X - 280, y: Y - 300, w: 560, h: 310 }, (c) => {
    c.fillStyle = STONE; c.fillRect(X - 255, Y - 190, 510, 190);
    c.fillStyle = STONE_D; c.fillRect(X + 120, Y - 190, 135, 190);
    // windows with tracery
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const wx = X + sx * (150 + i * 36), wy = Y - 70;
        c.fillStyle = '#4d3b31'; c.beginPath(); c.moveTo(wx - 11, wy); c.lineTo(wx - 11, wy - 70); c.quadraticCurveTo(wx, wy - 96, wx + 11, wy - 70); c.lineTo(wx + 11, wy); c.fill();
        c.strokeStyle = STONE_L; c.lineWidth = 1.2; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx, wy - 80); c.moveTo(wx - 11, wy - 40); c.lineTo(wx + 11, wy - 40); c.stroke();
        c.fillStyle = GOLD; c.beginPath(); c.arc(wx, wy - 72, 4, 0, Math.PI * 2); c.fill();
      }
    }
    // buttress pinnacles along the top
    c.strokeStyle = INK; c.lineWidth = 1.1;
    for (let i = 0; i < 11; i++) {
      const bx = X - 250 + i * 50;
      c.fillStyle = STONE_L; poly(c, [[bx - 6, Y - 188], [bx + 6, Y - 188], [bx, Y - 236]]); c.fill(); c.stroke();
      c.fillStyle = [GOLD, OLIVE, ROSE][i % 3]; c.beginPath(); c.arc(bx, Y - 238, 3.4, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    c.strokeRect(X - 255, Y - 190, 510, 190);
  }, { t: 6.9, d: 1.1, reveal: 'rise' });

  // the towers behind, tallest last: evangelists, Mary, Jesus
  const back = [
    { dx: -150, h: 600, w: 34, top: 'bull', t: 7.4 },
    { dx: 150, h: 600, w: 34, top: 'eagle', t: 7.55 },
    { dx: -86, h: 625, w: 36, top: 'man', t: 7.7 },
    { dx: 196, h: 640, w: 40, top: 'star', t: 7.85 },
    { dx: 86, h: 625, w: 36, top: 'lion', t: 8.0 },
    { dx: 0, h: 790, w: 52, top: 'cross', t: 8.2 },
  ];
  for (const tw of back) {
    const bx = X + tw.dx;
    p.group('sf', { x: bx - tw.w - 40, y: Y - 200 - tw.h - 70, w: tw.w * 2 + 80, h: tw.h + 90 }, (c) => bigTower(c, bx, Y - 180, tw.h, tw.w, tw.top), { t: tw.t, d: 1.4, reveal: 'rise', ease: 'inOut' });
  }
  // the Nativity front: three portals, the stone crawling with carving, and
  // the green cypress over the middle door
  p.group('sf', { x: X - 200, y: Y - 330, w: 400, h: 340 }, (c) => {
    c.fillStyle = STONE_L; poly(c, [[X - 190, Y], [X + 190, Y], [X + 170, Y - 200], [X + 60, Y - 250], [X, Y - 300], [X - 60, Y - 250], [X - 170, Y - 200]]); c.fill();
    const rr = rng(44);
    // the carving: a crust of small knobs and drips
    for (let i = 0; i < 700; i++) {
      const px = rr.range(X - 185, X + 185), py = rr.range(Y - 280, Y - 10);
      if (py < Y - 300 + Math.abs(px - X) * 0.55) continue;
      c.fillStyle = rr.pick(['rgba(150,120,85,.55)', 'rgba(120,95,70,.45)', 'rgba(247,238,219,.7)']);
      c.beginPath(); c.ellipse(px, py, rr.range(1.5, 4), rr.range(2, 5.5), 0, 0, Math.PI * 2); c.fill();
    }
    // the three doors
    for (const [dx, w, h] of [[-112, 30, 120], [0, 44, 170], [112, 30, 120]]) {
      c.fillStyle = '#4d3b31';
      c.beginPath(); c.moveTo(X + dx - w, Y); c.lineTo(X + dx - w, Y - h + w); c.quadraticCurveTo(X + dx, Y - h - w * 0.6, X + dx + w, Y - h + w); c.lineTo(X + dx + w, Y); c.fill();
      c.strokeStyle = STONE_D; c.lineWidth = 2; c.beginPath(); c.moveTo(X + dx, Y); c.lineTo(X + dx, Y - h + 8); c.stroke();
    }
    // the cypress, green, with its white doves
    const cy = Y - 250;
    c.fillStyle = GREEN; c.beginPath(); c.moveTo(X, cy - 60); c.quadraticCurveTo(X + 24, cy - 10, X + 18, cy + 30); c.lineTo(X - 18, cy + 30); c.quadraticCurveTo(X - 24, cy - 10, X, cy - 60); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    c.fillStyle = CREAM; for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(X + rr.range(-14, 14), cy + rr.range(-40, 24), 2.6, 1.8, rr.range(-1, 1), 0, Math.PI * 2); c.fill(); }
    c.fillStyle = ROSE; c.beginPath(); c.arc(X, cy - 64, 4, 0, Math.PI * 2); c.fill(); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.4;
    poly(c, [[X - 190, Y], [X + 190, Y], [X + 170, Y - 200], [X + 60, Y - 250], [X, Y - 300], [X - 60, Y - 250], [X - 170, Y - 200]]); c.stroke();
  }, { t: 8.5, d: 1.2, reveal: 'rise' });

  // the four bell towers in front, rising one by one
  const bells = [{ dx: -168, h: 520, t: 8.9 }, { dx: 168, h: 520, t: 9.05 }, { dx: -66, h: 560, t: 9.2 }, { dx: 66, h: 560, t: 9.35 }];
  for (const b of bells) {
    const bx = X + b.dx;
    p.group('sf', { x: bx - 40, y: Y - b.h - 20, w: 80, h: b.h + 30 }, (c) => bellTower(c, bx, Y - 90, b.h - 90, b.dx), { t: b.t, d: 1.3, reveal: 'rise', ease: 'inOut' });
  }
}

// one of the tall spindles behind the front, topped with its emblem
function bigTower(c, x, base, hgt, w, top) {
  const H0 = hgt - 40;
  const half = (f) => w * (1 - f ** 2.2 * 0.78);
  const L = [], R = [];
  for (let f = 0; f <= 1.0001; f += 0.04) { L.push([x - half(f), base - f * H0]); R.push([x + half(f), base - f * H0]); }
  const shape = L.concat(R.slice().reverse());
  c.fillStyle = STONE; poly(c, shape); c.fill();
  c.save(); poly(c, shape); c.clip();
  c.fillStyle = 'rgba(150,120,85,.4)'; c.fillRect(x + w * 0.15, base - H0, w * 2, H0);
  // ribs and slots
  c.strokeStyle = 'rgba(120,95,70,.55)'; c.lineWidth = 1.1; c.beginPath();
  for (let k = -3; k <= 3; k++) { for (let f = 0; f <= 1.0001; f += 0.05) { const xx = x + (k / 3.5) * half(f), yy = base - f * H0; f ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } }
  c.stroke();
  c.fillStyle = '#5a4234';
  for (let f = 0.08; f < 0.9; f += 0.045) for (const k of [-1.6, 0, 1.6]) { const xx = x + (k / 3.5) * half(f), yy = base - f * H0; c.fillRect(xx - 1.2, yy - 5, 2.4, 6); }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.3; poly(c, shape); c.stroke();
  const ty = base - H0;
  if (top === 'cross') {
    // Jesus's tower: a cross of four white arms with glass
    c.fillStyle = CREAM; c.strokeStyle = INK; c.lineWidth = 1.2;
    c.fillRect(x - 5, ty - 52, 10, 54); c.strokeRect(x - 5, ty - 52, 10, 54);
    c.fillRect(x - 22, ty - 36, 44, 10); c.strokeRect(x - 22, ty - 36, 44, 10);
    c.fillStyle = SEA_L; c.fillRect(x - 2, ty - 48, 4, 44); c.fillRect(x - 18, ty - 33, 36, 4);
    c.fillStyle = CREAM; for (const [dx, dy] of [[0, -56], [-25, -31], [25, -31]]) { c.beginPath(); c.arc(x + dx, ty + dy, 4, 0, Math.PI * 2); c.fill(); c.stroke(); }
  } else if (top === 'star') {
    // Mary's tower: a twelve-pointed star of glass
    c.fillStyle = CREAM; c.strokeStyle = INK; c.lineWidth = 1.1;
    c.beginPath();
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, rad = i % 2 ? 7 : 16; c.lineTo(x + Math.cos(a) * rad, ty - 18 + Math.sin(a) * rad); }
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = SEA_L; c.beginPath(); c.arc(x, ty - 18, 5, 0, Math.PI * 2); c.fill();
  } else {
    // the evangelists: a crown bearing the emblem in gold and white
    c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 1.1;
    c.beginPath(); c.ellipse(x, ty - 6, 12, 8, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = CREAM;
    if (top === 'eagle' || top === 'man') { poly(c, [[x - 18, ty - 12], [x, ty - 22], [x + 18, ty - 12], [x, ty - 16]]); c.fill(); c.stroke(); }
    else { c.beginPath(); c.arc(x, ty - 18, 7, 0, Math.PI * 2); c.fill(); c.stroke(); }
    if (top === 'bull') { c.beginPath(); c.moveTo(x - 6, ty - 22); c.quadraticCurveTo(x - 12, ty - 30, x - 8, ty - 34); c.moveTo(x + 6, ty - 22); c.quadraticCurveTo(x + 12, ty - 30, x + 8, ty - 34); c.stroke(); }
    if (top === 'lion') { c.fillStyle = GOLD; c.beginPath(); c.arc(x, ty - 18, 4, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = CREAM; c.beginPath(); c.arc(x, ty - 32, 3.4, 0, Math.PI * 2); c.fill(); c.stroke();
  }
}

// a bell tower of the Nativity front: square at the foot, then a spindle
// pierced with slots, then the mosaic pinnacle
function bellTower(c, x, base, hgt, seedish) {
  const shaft = hgt * 0.78, w0 = 30;
  const half = (f) => w0 * (1 - f ** 1.8 * 0.72);
  // the square foot with its openings
  c.fillStyle = STONE_L; c.fillRect(x - w0, base - 10, w0 * 2, 100);
  c.fillStyle = '#5a4234'; for (const dx of [-14, 6]) c.fillRect(x + dx - 4, base + 10, 8, 50);
  c.strokeStyle = INK; c.lineWidth = 1.1; c.strokeRect(x - w0, base - 10, w0 * 2, 100);
  const L = [], R = [];
  for (let f = 0; f <= 1.0001; f += 0.04) { L.push([x - half(f), base - f * shaft]); R.push([x + half(f), base - f * shaft]); }
  const shape = L.concat(R.slice().reverse());
  c.fillStyle = STONE_L; poly(c, shape); c.fill();
  c.save(); poly(c, shape); c.clip();
  c.fillStyle = 'rgba(150,120,85,.42)'; c.fillRect(x + w0 * 0.2, base - shaft, w0 * 2, shaft);
  // the slots in rising rows, like a spiral of louvers
  c.fillStyle = '#5a4234';
  for (let f = 0.04; f < 0.86; f += 0.032) {
    for (let k = -2; k <= 2; k++) {
      const off = (f * 40) % 1;
      const xx = x + ((k + off * 0.6) / 2.8) * half(f), yy = base - f * shaft;
      c.fillRect(xx - 1.6, yy - 8, 3.2, 8);
    }
  }
  // the words spiralling up near the top: a band of light letters
  c.fillStyle = 'rgba(247,238,219,.8)';
  for (let f = 0.86; f < 0.96; f += 0.025) c.fillRect(x - half(f) * 0.8, base - f * shaft - 2, half(f) * 1.6, 2);
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.2; poly(c, shape); c.stroke();
  pinnacle(c, x, base - shaft, hgt - shaft + 20, seedish);
}

// the pinnacle: a stem of mosaic, a mitre of red and gold lozenges studded
// with white balls, and a cross of balls on top
function pinnacle(c, x, y, hgt, seedish) {
  const s = hgt / 120;
  c.strokeStyle = INK; c.lineWidth = 1;
  // the stem
  c.fillStyle = OCHRE; poly(c, [[x - 6 * s, y], [x + 6 * s, y], [x + 4 * s, y - 30 * s], [x - 4 * s, y - 30 * s]]); c.fill(); c.stroke();
  c.fillStyle = TERRA; for (let k = 0; k < 4; k++) c.fillRect(x - 5 * s, y - 6 * s - k * 7 * s, 10 * s, 2.4 * s);
  // the mitre: a swelling hexagonal body
  const my = y - 30 * s;
  const mitre = [[x - 10 * s, my], [x - 15 * s, my - 22 * s], [x - 10 * s, my - 48 * s], [x, my - 58 * s], [x + 10 * s, my - 48 * s], [x + 15 * s, my - 22 * s], [x + 10 * s, my]];
  c.fillStyle = '#c4453a'; poly(c, mitre); c.fill();
  c.save(); poly(c, mitre); c.clip();
  // gold lozenges and a white diagonal lattice
  c.fillStyle = GOLD;
  for (let yy = my - 4 * s; yy > my - 60 * s; yy -= 9 * s) for (let xx = x - 16 * s + ((Math.round((my - yy) / (9 * s)) % 2) * 4.5 * s); xx < x + 16 * s; xx += 9 * s) poly(c, [[xx, yy - 4 * s], [xx + 3.2 * s, yy], [xx, yy + 4 * s], [xx - 3.2 * s, yy]]), c.fill();
  c.fillStyle = 'rgba(30,20,20,.25)'; c.fillRect(x + 4 * s, my - 60 * s, 20 * s, 62 * s);
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.1; poly(c, mitre); c.stroke();
  // white balls studding the edges
  c.fillStyle = CREAM;
  for (const [bx, by] of [[x - 15 * s, my - 22 * s], [x + 15 * s, my - 22 * s], [x - 10 * s, my - 48 * s], [x + 10 * s, my - 48 * s], [x - 10 * s, my], [x + 10 * s, my], [x, my - 22 * s]]) {
    c.beginPath(); c.arc(bx, by, 3.2 * s, 0, Math.PI * 2); c.fill(); c.stroke();
  }
  // the cross of balls
  const cy = my - 68 * s;
  c.fillStyle = CREAM; c.fillRect(x - 2 * s, my - 60 * s, 4 * s, 10 * s);
  for (const [dx, dy] of [[0, 0], [-8, 0], [8, 0], [0, -8], [0, 8]]) {
    c.beginPath(); c.arc(x + dx * s, cy + dy * s, 4 * s, 0, Math.PI * 2); c.fill(); c.stroke();
  }
  c.fillStyle = GOLD; c.beginPath(); c.arc(x, cy, 2 * s, 0, Math.PI * 2); c.fill();
}

// ---------------------------------------------------------------- life in the air and on the water
const GLINTS = [];
function air(p, r) {
  // sailboats on the sea
  const boats = [[330, 446, 0.8, 0.7], [1040, 470, 0.7, 1.0], [620, 128, 0.55, 1.2]];
  p.live('air', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      boats.forEach(([x0, y0, s, sp], i) => {
        const x = x0 + Math.sin(time * 0.07 * sp + i * 2) * 60, y = y0 + Math.sin(time * 1.1 + i) * 1.5;
        c.save(); c.translate(x, y); c.rotate(Math.sin(time * 0.8 + i) * 0.04);
        c.fillStyle = 'rgba(247,238,219,.6)'; c.fillRect(-46 * s, 4 * s, 36 * s, 2 * s);
        c.fillStyle = TERRA_D; poly(c, [[-24 * s, -4 * s], [26 * s, -4 * s], [18 * s, 4 * s], [-18 * s, 4 * s]]); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
        c.fillStyle = CREAM; poly(c, [[2 * s, -60 * s], [2 * s, -8 * s], [26 * s, -8 * s]]); c.fill(); c.stroke();
        c.fillStyle = i === 1 ? OCHRE : CREAM; poly(c, [[-2 * s, -50 * s], [-2 * s, -8 * s], [-22 * s, -8 * s]]); c.fill(); c.stroke();
        c.restore();
      });
    },
  });
  // swifts and gulls wheeling over the roofs and the sea
  const birds = [];
  for (let i = 0; i < 9; i++) birds.push({ x: r.range(150, 1450), y: r.range(380, 900), rad: r.range(40, 110), sp: r.range(0.2, 0.4) * (r.chance(0.5) ? 1 : -1), ph: r() * 6, s: r.range(0.8, 1.2) });
  p.live('air', {
    t: 10.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineCap = 'round';
      for (const b of birds) {
        const a = time * b.sp + b.ph, x = b.x + Math.cos(a) * b.rad, y = b.y + Math.sin(a) * b.rad * 0.45, s = b.s;
        const fl = Math.sin(time * 6 + b.ph) * 2.5;
        c.lineWidth = 1.8 * s; c.beginPath();
        c.moveTo(x - 10 * s, y - 1 + fl); c.quadraticCurveTo(x - 5 * s, y - 6 * s, x, y); c.quadraticCurveTo(x + 5 * s, y - 6 * s, x + 10 * s, y - 1 + fl); c.stroke();
      }
    },
  });
  // a tram gliding down the Diagonal
  p.live('trees', {
    t: 9.8, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      const f = (time * 0.018 + 0.38) % 1;
      const x = lerp(-60, 1660, f), y = diagY(x);
      const ang = Math.atan2(D1[1] - D0[1], D1[0] - D0[0]);
      c.save(); c.translate(x, y); c.rotate(ang);
      c.fillStyle = 'rgba(58,40,32,.3)'; c.fillRect(-40, -3, 80, 9);
      c.fillStyle = CREAM; c.fillRect(-42, -7, 84, 10);
      c.fillStyle = TERRA; c.fillRect(-42, 0, 84, 3);
      c.fillStyle = '#4d3b31'; for (let i = 0; i < 9; i++) c.fillRect(-38 + i * 9, -5, 6, 4);
      c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(-42, -7, 84, 10);
      c.restore();
    },
  });
  // glints on the tiles: the mosaic catching the sun now and then
  p.live('border', {
    t: 12.6, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      for (let i = 0; i < GLINTS.length; i++) {
        const g = GLINTS[i];
        const k = ((time * 0.35 + g.ph) % 1);
        if (k > 0.14) continue;
        const a = Math.sin((k / 0.14) * Math.PI), rad = g.s * (3 + a * 9);
        c.fillStyle = `rgba(255,252,240,${0.95 * a})`;
        c.beginPath();
        c.moveTo(g.x, g.y - rad); c.quadraticCurveTo(g.x, g.y, g.x + rad, g.y); c.quadraticCurveTo(g.x, g.y, g.x, g.y + rad);
        c.quadraticCurveTo(g.x, g.y, g.x - rad, g.y); c.quadraticCurveTo(g.x, g.y, g.x, g.y - rad); c.fill();
      }
    },
  });
}

// ---------------------------------------------------------------- the trencadís sun and border
// broken tile: a jittered grid of shards with grout between them
function shards(r, region, cell, jitter) {
  const out = [];
  const { x0, y0, x1, y1 } = region;
  const nx = Math.ceil((x1 - x0) / cell) + 1, ny = Math.ceil((y1 - y0) / cell) + 1;
  const V = [];
  for (let j = 0; j <= ny; j++) { V.push([]); for (let i = 0; i <= nx; i++) V[j].push([x0 + i * cell + (i && i < nx ? r.range(-jitter, jitter) : 0), y0 + j * cell + (j && j < ny ? r.range(-jitter, jitter) : 0)]); }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = V[j][i], b = V[j][i + 1], c2 = V[j + 1][i + 1], d = V[j + 1][i];
    if (r.chance(0.45)) { out.push([a, b, c2]); out.push([a, c2, d]); } else if (r.chance(0.3)) { out.push([a, b, d]); out.push([b, c2, d]); } else out.push([a, b, c2, d]);
  }
  // pull each shard in from its neighbors, leaving the grout
  return out.map((s) => {
    const cx = s.reduce((t, q) => t + q[0], 0) / s.length, cy = s.reduce((t, q) => t + q[1], 0) / s.length;
    return { pts: s.map(([x, y]) => [lerp(x, cx, 0.14), lerp(y, cy, 0.14)]), cx, cy };
  });
}

function sun(p, r) {
  const cx = IX + IW, cy = IY, R0 = 200, R1 = 340;
  const all = shards(r, { x0: cx - R1 - 20, y0: cy, x1: cx, y1: cy + R1 + 20 }, 20, 6);
  // the rays: pointed petals, long and short by turns, fanning across the corner
  const rays = [];
  const N = 11;
  for (let i = 0; i < N; i++) {
    const a = Math.PI / 2 + ((i + 0.5) / N) * (Math.PI / 2), hw = (Math.PI / 2 / N) * 0.36;
    const len = i % 2 ? R1 * 0.84 : R1;
    rays.push([[cx + Math.cos(a - hw) * (R0 - 6), cy + Math.sin(a - hw) * (R0 - 6)], [cx + Math.cos(a) * len, cy + Math.sin(a) * len], [cx + Math.cos(a + hw) * (R0 - 6), cy + Math.sin(a + hw) * (R0 - 6)]]);
  }
  const disc = [], rayShards = [];
  for (const s of all) {
    const d = Math.hypot(s.cx - cx, s.cy - cy);
    if (d < R0) disc.push({ ...s, col: d < R0 * 0.5 ? r.pick([GOLD, '#f0c64a', GOLD, CREAM, OCHRE]) : d < R0 * 0.78 ? r.pick([OCHRE, '#e8913a', GOLD, OCHRE]) : r.pick([TERRA, '#e8913a', TERRA, ROSE]) });
    else if (d < R1 + 10) rayShards.push({ ...s, col: r.pick([GOLD, CREAM, '#f0c64a', OCHRE, CREAM]) });
  }
  const grout = mix(PAPER, '#c9b48e', 0.55);
  const paint = (list, clip) => (c) => {
    c.save();
    if (clip) { c.beginPath(); for (const q of clip) { c.moveTo(q[0][0], q[0][1]); for (const pt of q.slice(1)) c.lineTo(pt[0], pt[1]); c.closePath(); } c.clip(); }
    c.fillStyle = grout; c.fillRect(cx - R1 - 20, cy, R1 + 20, R1 + 20);
    for (const s of list) { c.fillStyle = s.col; poly(c, s.pts); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.2)'; for (const s of list) { poly(c, [s.pts[0], s.pts[1], [s.cx, s.cy]]); c.fill(); }
    c.restore();
    if (clip) { c.strokeStyle = INK; c.lineWidth = 1.4; c.lineJoin = 'round'; for (const q of clip) { poly(c, q); c.stroke(); } }
  };
  const discShape = [[cx, cy]].concat(Array.from({ length: 31 }, (_, i) => { const a = Math.PI / 2 + (i / 30) * (Math.PI / 2); return [cx + Math.cos(a) * R0, cy + Math.sin(a) * R0]; }));
  p.group('sun', { x: cx - R1 - 20, y: cy, w: R1 + 20, h: R1 + 20 }, paint(rayShards, rays), { t: 1.6, d: 1.6, reveal: 'iris', ease: 'inOut' });
  p.group('sun', { x: cx - R0 - 10, y: cy, w: R0 + 10, h: R0 + 10 }, paint(disc, [discShape]), { t: 2.2, d: 1.4, reveal: 'iris', ease: 'inOut' });
  for (let i = 0; i < 6; i++) { const s = r.pick(disc); GLINTS.push({ x: s.cx, y: s.cy, s: 1.2, ph: r() }); }
}

function border(p, r) {
  const o0 = 18, o1 = 58; // the band between these insets
  const region = { x0: o0 - 10, y0: o0 - 10, x1: W - o0 + 10, y1: H - o0 + 10 };
  const all = shards(r, region, 21, 6).filter((s) => {
    const inner = s.cx > o1 && s.cx < W - o1 && s.cy > o1 && s.cy < H - o1;
    const outer = s.cx > o0 && s.cx < W - o0 && s.cy > o0 && s.cy < H - o0;
    return outer && !inner;
  });
  const COLS = [COBALT, COBALT, TURQ, CREAM, CREAM, OCHRE, OLIVE, TERRA, SEA_L, GOLD];
  // runs of color, the way the tiler worked from one broken plate at a time
  let run = r.pick(COLS), left = 0;
  // order the shards round the sheet, clockwise from the top left
  const angle = (s) => { const a = Math.atan2(s.cy - H / 2, (s.cx - W / 2) * (H / W)); return (a + Math.PI * 1.75) % (Math.PI * 2); };
  all.sort((a, b) => angle(a) - angle(b));
  for (const s of all) { if (left-- <= 0) { run = r.pick(COLS); left = r.int(2, 9); } s.col = r.chance(0.2) ? r.pick(COLS) : run; }
  const n = 16;
  for (let i = 0; i < n; i++) {
    const part = all.slice(Math.floor((i * all.length) / n), Math.floor(((i + 1) * all.length) / n));
    const box = boxOf(part.flatMap((s) => s.pts), 4);
    p.group('border', box, (c) => {
      c.fillStyle = mix(PAPER, '#c9b48e', 0.5); for (const s of part) { poly(c, s.pts.map(([x, y]) => [lerp(x, s.cx, -0.16), lerp(y, s.cy, -0.16)])); c.fill(); }
      for (const s of part) { c.fillStyle = s.col; poly(c, s.pts); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.2)'; for (const s of part) { poly(c, [s.pts[0], s.pts[1], [s.cx, s.cy]]); c.fill(); }
    }, { t: 11.9 + i * 0.1, d: 0.6, reveal: 'pop' });
  }
  for (let i = 0; i < 10; i++) { const s = r.pick(all); GLINTS.push({ x: s.cx, y: s.cy, s: 1, ph: r() }); }
  // keylines inside and out
  const rect = (i) => [[i, i], [W - i, i], [W - i, H - i], [i, H - i], [i, i]];
  p.pen('border', rect(IX - 2), INK, 2.4, { t: 11.6, d: 1.6, cap: 'square' });
  p.pen('border', rect(o0 - 4), INK, 1.2, { t: 12.2, d: 1.6, cap: 'square' });
  // the plaque at the foot with the region's name
  const px = W / 2, py = H - 38;
  p.group('border', { x: px - 200, y: py - 30, w: 400, h: 60 }, (c) => {
    c.fillStyle = COBALT; c.beginPath(); c.roundRect(px - 180, py - 24, 360, 48, 24); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 3; c.beginPath(); c.roundRect(px - 172, py - 17, 344, 34, 17); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.roundRect(px - 180, py - 24, 360, 48, 24); c.stroke();
  }, { t: 13.0, d: 0.5, reveal: 'pop' });
  p.type('border', 'CATALUNYA', px, py + 11, { family: TITLE, size: 30, color: CREAM, align: 'center', track: 0.35, t: 13.3, gap: 0.04, d: 0.5, reveal: 'fade' });
}

// ---------------------------------------------------------------- the title
function title(p) {
  const o = { family: TITLE, weight: 400, size: 250, color: CREAM, stroke: INK, lw: 4, shadow: COBALT, sx: 7, sy: 8, align: 'center', fit: 1150 };
  p.type('title', 'BARCELONA', 750, 358, { ...o, t: 10.4, gap: 0.16, d: 0.9 });
}
