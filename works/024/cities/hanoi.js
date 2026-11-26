// Hanoi: a lacquer painting (sơn mài) on a black ground, worked in gold leaf,
// crushed eggshell and cinnabar, in two panels like a lacquer screen. Above, a
// street of the old quarter: narrow tube houses with shutters, balconies,
// bougainvillea and tangled wires, a flower seller's bicycle, a vendor with her
// shoulder pole, tea on low red stools. Below, Hoàn Kiếm lake at dusk: the Pen
// Tower on the shore, the red Thê Húc bridge arching out to the Ngọc Sơn temple
// under its banyans, the Turtle Tower on its islet, gold light on black water.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, mix } from '../kit.js';

const BLACK = '#120c0a', LAC = '#1f1511', LAC2 = '#2c1b14', BROWN = '#4d2416', UMBER = '#6b3a1f';
const CIN = '#b5301d', CIN_D = '#7c1e12', CIN_L = '#d2563a';
const GOLD = '#c99a44', GOLD_L = '#e9c879', GOLD_D = '#8c6426', GOLD_DD = '#5e4219';
const EGG = '#ece1c6', EGG_D = '#c7b791', LEAF = '#33402a', LEAF_L = '#4f5d36';

export const city = {
  id: 'hanoi', name: 'Hanoi', wall: '#2a1410',
  alt: 'A lacquer painting in gold leaf, eggshell and cinnabar on black, in two panels: above, a street of narrow tube houses in the old quarter with shutters, balconies, bougainvillea and tangled wires, a flower seller pushing her bicycle, a vendor with a shoulder pole and people drinking tea on low red stools; below, Hoàn Kiếm lake under a gold moon, the Pen Tower and two gate pillars on the shore, the red Thê Húc bridge arching out to Ngọc Sơn temple under banyan trees on its islet, the Turtle Tower on its own islet, and long gold streaks and reflections on the still dark water, under the name HÀ NỘI',
  google: 'family=Anton',
  fonts: [['400 220px "Anton"', 'HÀ NỘI'], ['400 34px "Anton"', 'PHỐ CỔ · HỒ HOÀN KIẾM · VIỆT NAM · SƠN MÀI']],
  build,
};

const FACE = '"Anton"';
const PX0 = 76, PX1 = W - 76;
const UP0 = 360, UP1 = 1090;   // the street panel
const LO0 = 1124, LO1 = 1920;  // the lake panel
const STREET = 1000;            // the houses' foot
const SHORE = 1400;             // the far shore of the lake

function build() {
  const p = new Plate({ paper: BLACK, seed: 1010 });
  const r = p.r;
  p.clip = { x: PX0, y: UP0, w: PX1 - PX0, h: LO1 - UP0 };
  p.stack('ground', 'leaf', 'houses', 'facade', 'street', 'far', 'lake', 'temple', 'bridge', 'tower', 'front', 'live', 'frame');
  p.layer('frame', { clip: false });

  frame(p, r);
  upperSky(p, r);
  houses(p, r);
  street(p, r);
  lowerSky(p, r);
  lake(p, r);
  temple(p, r);
  bridge(p, r);
  penTower(p, r);
  front(p, r);
  live(p, r);
  title(p);
  return p;
}

// reads build-time numbers in turn, with the range helpers the draws use
function drawn(nums) {
  let i = 0;
  const f = () => nums[i++ % nums.length];
  f.range = (a, b) => a + (b - a) * f();
  return f;
}
function path(c, pts, close = true) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}
function inside(pts, x, y) {
  let k = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) k = !k;
  }
  return k;
}
// crushed eggshell: a crackle of small chips over a shape, black showing between them
function crackle(r, pts, cell = 12, gap = 1.4) {
  const b = boxOf(pts);
  const nx = Math.ceil(b.w / cell) + 1, ny = Math.ceil(b.h / cell) + 1;
  const G = [];
  for (let j = 0; j <= ny; j++) { G.push([]); for (let i = 0; i <= nx; i++) G[j].push([b.x + i * cell + r.range(-0.32, 0.32) * cell, b.y + j * cell + r.range(-0.32, 0.32) * cell]); }
  const out = [[], []];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const q = [G[j][i], G[j][i + 1], G[j + 1][i + 1], G[j + 1][i]];
    const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
    if (!inside(pts, cx, cy)) continue;
    // split some chips in two along a diagonal, then pull every chip in from its neighbors
    const pieces = r() < 0.45 ? [[q[0], q[1], q[2]], [q[0], q[2], q[3]]] : [q];
    for (const pc of pieces) {
      const mx = pc.reduce((s, v) => s + v[0], 0) / pc.length, my = pc.reduce((s, v) => s + v[1], 0) / pc.length;
      out[r() < 0.72 ? 0 : 1].push(pc.map(([x, y]) => { const d = Math.hypot(x - mx, y - my) || 1; return [x + ((mx - x) / d) * gap, y + ((my - y) / d) * gap]; }));
    }
  }
  return out;
}
function chips(c, list) { c.beginPath(); for (const pc of list) { c.moveTo(pc[0][0], pc[0][1]); for (let i = 1; i < pc.length; i++) c.lineTo(pc[i][0], pc[i][1]); c.closePath(); } }
function drawEgg(c, eg, a = EGG, b = EGG_D) { c.fillStyle = a; chips(c, eg[0]); c.fill(); c.fillStyle = b; chips(c, eg[1]); c.fill(); }
// gold leaf laid in squares, its tone falling off by a function of the square's place (0..1)
function leaf(r, x0, y0, x1, y1, s, f) {
  const tones = [[], [], [], []];
  for (let y = y0; y < y1; y += s) for (let x = x0; x < x1; x += s) {
    const k = clamp(f(x + s / 2, y + s / 2) + r.range(-0.07, 0.07));
    if (k < 0.08) continue;
    tones[k > 0.72 ? 0 : k > 0.46 ? 1 : k > 0.22 ? 2 : 3].push([x + 0.6, y + 0.6, Math.min(s, x1 - x) - 1.2, Math.min(s, y1 - y) - 1.2]);
  }
  return tones;
}
const LEAFC = ['#e2bf6f', '#d3ab58', '#b98e40', '#8c6628'];
function drawLeaf(c, tones) { tones.forEach((list, i) => { c.fillStyle = LEAFC[i]; c.beginPath(); for (const [x, y, w, h] of list) c.rect(x, y, w, h); c.fill(); }); }

// ================================================================ the frame: two panels in gold rules on lacquer
function frame(p, r) {
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = GOLD; c.lineWidth = 3; c.strokeRect(40, 40, W - 80, H - 80);
    c.strokeStyle = GOLD_D; c.lineWidth = 1.4; c.strokeRect(52, 52, W - 104, H - 104);
    for (const [y0, y1] of [[UP0, UP1], [LO0, LO1]]) {
      c.strokeStyle = GOLD; c.lineWidth = 2.4; c.strokeRect(PX0 - 8, y0 - 8, PX1 - PX0 + 16, y1 - y0 + 16);
    }
  }, { t: 0.1, d: 0.8, reveal: 'fade' });
  // cinnabar squares with a gold lozenge at the panel corners
  const corners = [];
  for (const [y0, y1] of [[UP0, UP1], [LO0, LO1]]) for (const x of [PX0 - 8, PX1 + 8]) for (const y of [y0 - 8, y1 + 8]) corners.push([x, y]);
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    for (const [x, y] of corners) {
      c.fillStyle = CIN; c.fillRect(x - 13, y - 13, 26, 26);
      c.fillStyle = GOLD; path(c, [[x, y - 9], [x + 9, y], [x, y + 9], [x - 9, y]]); c.fill();
    }
  }, { t: 0.5, d: 0.6, reveal: 'pop' });
  // the two panels' black, a shade lifted from the ground, as if polished
  for (const [y0, y1] of [[UP0, UP1], [LO0, LO1]]) {
    p.group('ground', { x: PX0, y: y0, w: PX1 - PX0, h: y1 - y0 }, (c) => {
      c.fillStyle = LAC; c.fillRect(PX0, y0, PX1 - PX0, y1 - y0);
    }, { t: 0.2, d: 0.6, reveal: 'fade' });
  }
}

// ================================================================ upper panel: a gold-leaf sky over the roofs
function upperSky(p, r) {
  const tones = leaf(r, PX0, UP0, PX1, 760, 34, (x, y) => 1 - (y - UP0) / 380);
  p.group('leaf', { x: PX0, y: UP0, w: PX1 - PX0, h: 420 }, (c) => {
    c.save(); c.beginPath(); c.rect(PX0, UP0, PX1 - PX0, UP1 - UP0); c.clip(); drawLeaf(c, tones); c.restore();
  }, { t: 0.7, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // a low cinnabar sun pressed into the leaf
  p.group('leaf', { x: 1080, y: 380, w: 200, h: 200 }, (c) => {
    c.fillStyle = CIN; c.beginPath(); c.arc(1180, 480, 70, 0, Math.PI * 2); c.fill();
    c.fillStyle = CIN_L; c.beginPath(); c.arc(1166, 466, 46, 0, Math.PI * 2); c.fill();
  }, { t: 1.6, d: 0.8, reveal: 'iris' });
}

// ================================================================ the tube houses
const WALLS = ['gold', 'egg', 'cin', 'umber', 'gold', 'egg', 'brown', 'cin'];
function houses(p, r) {
  const list = [];
  let x = PX0 - 20, i = 0;
  while (x < PX1) {
    const w = r.range(168, 222);
    list.push({ x, w: Math.min(w, PX1 + 30 - x), top: r.range(430, 570), kind: WALLS[(i * 3 + 1) % WALLS.length], i });
    x += w; i++;
  }
  // far roofs and a water tank or two, between the house tops, in umber
  p.group('houses', { x: PX0, y: 400, w: PX1 - PX0, h: 260 }, (c) => {
    c.fillStyle = LAC2;
    for (let k = 0; k < 14; k++) { const xx = PX0 + k * 108 + (k % 3) * 20; c.fillRect(xx, 500 + (k % 4) * 26, 90, 300); }
    c.fillStyle = GOLD_DD;
    for (let k = 0; k < 6; k++) { const xx = PX0 + 60 + k * 240; c.fillRect(xx, 486 + (k % 2) * 30, 40, 18); c.fillRect(xx + 6, 504 + (k % 2) * 30, 3, 14); c.fillRect(xx + 31, 504 + (k % 2) * 30, 3, 14); }
  }, { t: 1.5, d: 0.8, reveal: 'rise' });

  list.forEach((h, k) => {
    const { x, w, top, kind } = h;
    const wall = kind === 'gold' ? GOLD : kind === 'cin' ? CIN : kind === 'umber' ? UMBER : kind === 'brown' ? BROWN : EGG;
    const trim = kind === 'egg' ? GOLD_D : kind === 'gold' ? GOLD_L : GOLD;
    const floors = [];
    for (let y = 830; y - 130 > top + 30; y -= 130) floors.push(y - 130);
    h.floors = floors; h.wall = wall;
    const roofKind = r.int(0, 2);
    const plants = [];
    for (let j = 0; j < 12; j++) plants.push([r.range(0.1, 0.9), r.range(0, 1), r.range(3, 7)]);
    const shut = r.pick([LEAF, LEAF_L, BROWN, GOLD_D]);
    // numbers for the draw, made now so the draw never rolls a die
    const bloomNums = Array.from({ length: 300 }, () => r()), goodsNums = Array.from({ length: 300 }, () => r());
    const eg = kind === 'egg' ? crackle(r, [[x + 2, top + 2], [x + w - 4, top + 2], [x + w - 4, 830], [x + 2, 830]], 13, 1.3) : null;
    p.group('houses', { x: x - 20, y: top - 70, w: w + 40, h: STREET - top + 80 }, (c) => {
      // the wall, with its darker side strip where it meets the next house
      c.fillStyle = kind === 'egg' ? LAC2 : wall; c.fillRect(x, top, w, STREET - top);
      if (eg) drawEgg(c, eg);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + w - 10, top, 10, STREET - top);
      // the roof: a gable of cinnabar tiles, a flat roof with a little garden, or a stepped parapet
      if (roofKind === 0) {
        c.fillStyle = CIN_D; path(c, [[x - 6, top + 8], [x + w + 6, top + 8], [x + w * 0.5, top - 50]]); c.fill();
        c.strokeStyle = CIN; c.lineWidth = 2; c.beginPath();
        for (let t = 0.1; t < 1; t += 0.1) { c.moveTo(x + w * 0.5, top - 50); c.lineTo(lerp(x - 6, x + w + 6, t), top + 8); }
        c.stroke();
        c.fillStyle = GOLD; c.fillRect(x - 8, top + 6, w + 16, 5);
      } else if (roofKind === 1) {
        c.fillStyle = trim; c.fillRect(x - 4, top - 4, w + 8, 12);
        c.fillStyle = LEAF; for (const [u, , s] of plants.slice(0, 6)) { c.beginPath(); c.arc(x + u * w, top - 10, s * 2.2, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = LEAF_L; for (const [u, , s] of plants.slice(0, 6)) { c.beginPath(); c.arc(x + u * w - 2, top - 13, s * 1.2, 0, Math.PI * 2); c.fill(); }
      } else {
        c.fillStyle = trim; path(c, [[x, top + 6], [x, top - 16], [x + w * 0.3, top - 16], [x + w * 0.3, top - 34], [x + w * 0.7, top - 34], [x + w * 0.7, top - 16], [x + w, top - 16], [x + w, top + 6]]); c.fill();
        c.fillStyle = wall === GOLD ? CIN : GOLD; c.beginPath(); c.arc(x + w / 2, top - 14, 9, 0, Math.PI * 2); c.fill();
      }
    }, { t: 1.9 + k * 0.17, d: 0.9, reveal: 'rise' });

    // the facade's floors: French windows with louvered shutters, balconies, pots, a cascade of bougainvillea
    p.group('facade', { x: x - 20, y: top - 10, w: w + 40, h: STREET - top + 20 }, (c) => {
      floors.forEach((fy, fi) => {
        const n = w > 196 ? 2 : (fi % 2 ? 1 : 2);
        const ww = n === 2 ? w * 0.28 : w * 0.38;
        for (let m = 0; m < n; m++) {
          const wx = n === 2 ? x + w * (m ? 0.6 : 0.12) : x + (w - ww) / 2;
          const wy = fy + 22, wh = 84;
          // the opening, an arch on some floors
          c.fillStyle = BLACK;
          if (fi % 2 === 0) { c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx, wy + ww / 2); c.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); c.lineTo(wx + ww, wy + wh); c.closePath(); c.fill(); }
          else c.fillRect(wx, wy, ww, wh);
          // a lit lamp inside, or the shutters swung open
          if ((k + fi + m) % 3 === 0) { c.fillStyle = GOLD_L; c.fillRect(wx + ww * 0.2, wy + ww * 0.5, ww * 0.6, wh - ww * 0.5 - 4); }
          c.fillStyle = shut;
          c.fillRect(wx - ww * 0.32, wy + 6, ww * 0.3, wh - 6); c.fillRect(wx + ww + 2, wy + 6, ww * 0.3, wh - 6);
          c.strokeStyle = BLACK; c.lineWidth = 1.2; c.beginPath();
          for (let yy = wy + 12; yy < wy + wh; yy += 6) { c.moveTo(wx - ww * 0.3, yy); c.lineTo(wx - 2, yy); c.moveTo(wx + ww + 3, yy); c.lineTo(wx + ww * 1.3, yy); }
          c.stroke();
        }
        // a cornice line and the balcony with its railing
        c.fillStyle = trim; c.fillRect(x + 2, fy + 110, w - 4, 6);
        c.strokeStyle = trim; c.lineWidth = 1.6; c.beginPath();
        c.moveTo(x + 8, fy + 88); c.lineTo(x + w - 8, fy + 88);
        for (let xx = x + 12; xx < x + w - 8; xx += 7) { c.moveTo(xx, fy + 88); c.lineTo(xx, fy + 110); }
        c.stroke();
        // pots on the rail
        for (const [u, v, s] of plants.slice(fi * 3, fi * 3 + 3)) {
          const px = x + 14 + u * (w - 28);
          c.fillStyle = CIN_D; c.fillRect(px - s, fy + 80, s * 2, 8);
          c.fillStyle = v > 0.5 ? LEAF_L : LEAF; c.beginPath(); c.arc(px, fy + 74, s * 1.6, 0, Math.PI * 2); c.fill();
        }
      });
      // bougainvillea spilling down one side
      if (k % 2 === 0 && floors.length) {
        const bx = x + (k % 4 ? w - 24 : 20), by = floors[floors.length - 1] + 86;
        const flowers = [];
        const rr = drawn(bloomNums);
        for (let j = 0; j < 70; j++) { const t = rr(); flowers.push([bx + rr.range(-20, 20) * (1 - t * 0.5) + Math.sin(t * 7) * 8, by + t * Math.min(260, 830 - by), rr.range(2.5, 5.5), rr() < 0.3]); }
        c.fillStyle = LEAF; c.beginPath(); for (const [fx, fy2, s] of flowers) { c.moveTo(fx + s * 1.2, fy2 + 3); c.arc(fx, fy2 + 3, s * 1.2, 0, Math.PI * 2); } c.fill();
        c.fillStyle = CIN_L; c.beginPath(); for (const [fx, fy2, s, pale] of flowers) if (!pale) { c.moveTo(fx + s, fy2); c.arc(fx, fy2, s, 0, Math.PI * 2); } c.fill();
        c.fillStyle = '#e07a8c'; c.beginPath(); for (const [fx, fy2, s, pale] of flowers) if (pale) { c.moveTo(fx + s, fy2); c.arc(fx, fy2, s, 0, Math.PI * 2); } c.fill();
      }
      // the shop floor: open to the street, goods stacked inside, a cinnabar awning, red lanterns
      c.fillStyle = BLACK; c.fillRect(x + 8, 836, w - 16, STREET - 836);
      const goods = drawn(goodsNums), shop = k % 4;
      if (shop === 0) {
        // lanterns hanging in rows: silk, red and gold
        for (let yy = 870; yy < 980; yy += 46) for (let xx = x + 26; xx < x + w - 20; xx += 30) {
          const col = goods() < 0.5 ? CIN : goods() < 0.5 ? GOLD : CIN_L;
          c.fillStyle = GOLD_D; c.fillRect(xx - 0.6, yy - 18, 1.2, 10);
          c.fillStyle = col; c.beginPath(); c.ellipse(xx, yy, 10, 14, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = GOLD_D; c.fillRect(xx - 5, yy - 15, 10, 3); c.fillRect(xx - 5, yy + 12, 10, 3);
        }
      } else if (shop === 1) {
        // bolts of silk standing on shelves
        const cols = [CIN, GOLD, EGG_D, LEAF_L, CIN_L, UMBER];
        for (let yy = 870; yy < 990; yy += 40) { for (let xx = x + 18; xx < x + w - 26; xx += 13) { c.fillStyle = cols[Math.floor(goods() * cols.length)]; c.fillRect(xx, yy, 10, 34); } c.fillStyle = GOLD_D; c.fillRect(x + 14, yy + 34, w - 28, 3); }
      } else if (shop === 2) {
        // a lit room: a table, a seated figure, an altar shelf
        c.fillStyle = mix(GOLD, BLACK, 0.55); c.fillRect(x + 16, 846, w - 32, 140);
        c.fillStyle = CIN_D; c.fillRect(x + 24, 860, w - 48, 8);
        c.fillStyle = GOLD_L; c.fillRect(x + w / 2 - 6, 846, 12, 14);
        c.fillStyle = BLACK; c.fillRect(x + w * 0.3, 950, w * 0.4, 6); c.fillRect(x + w * 0.32, 956, 4, 30); c.fillRect(x + w * 0.66, 956, 4, 30);
        c.beginPath(); c.arc(x + w * 0.42, 914, 8, 0, Math.PI * 2); c.fill(); c.fillRect(x + w * 0.42 - 8, 922, 16, 28);
      } else {
        // baskets and sacks spilling out to the walk
        for (let xx = x + 22; xx < x + w - 22; xx += 34) {
          c.fillStyle = GOLD_D; c.beginPath(); c.ellipse(xx, 984, 15, 9, 0, 0, Math.PI * 2); c.fill(); c.fillRect(xx - 15, 962, 30, 22);
          c.fillStyle = [CIN_L, LEAF_L, GOLD_L, EGG][Math.floor(goods() * 4)]; c.beginPath(); c.ellipse(xx, 962, 14, 6, 0, 0, Math.PI * 2); c.fill();
        }
        c.fillStyle = GOLD_DD; for (let xx = x + 20; xx < x + w - 20; xx += 22) c.fillRect(xx, 856, 3, 60 + goods() * 30);
      }
      c.fillStyle = CIN; path(c, [[x + 2, 826], [x + w - 2, 826], [x + w + 6, 856], [x - 6, 856]]); c.fill();
      c.fillStyle = CIN_L; for (let xx = x + 4; xx < x + w - 6; xx += 24) path(c, [[xx, 826], [xx + 12, 826], [xx + 14, 856], [xx + 2, 856]]), c.fill();
      // a blank shop board over the awning
      c.fillStyle = kind === 'gold' ? CIN_D : GOLD; c.fillRect(x + w * 0.18, 796, w * 0.64, 26);
      c.fillStyle = kind === 'gold' ? GOLD : CIN_D; c.fillRect(x + w * 0.24, 806, w * 0.52, 5);
    }, { t: 3.4 + k * 0.18, d: 1.0, reveal: 'rise' });
  });

  // wires: sagging bundles across the facades, and a pole
  const wires = [];
  for (let k = 0; k < 9; k++) {
    const y0 = r.range(700, 790), y1 = r.range(700, 790), sag = r.range(20, 60);
    const pts = [];
    for (let t = 0; t <= 1.0001; t += 0.05) pts.push([lerp(PX0 - 10, PX1 + 10, t), lerp(y0, y1, t) + sag * 4 * t * (1 - t) + Math.sin(t * 20 + k) * 4]);
    wires.push(pts);
  }
  p.strokes('facade', wires, BLACK, 2.2, { t: 6.6, d: 1.0, reveal: 'wipe', ease: 'inOut', box: { x: PX0 - 20, y: 680, w: PX1 - PX0 + 40, h: 180 } });
  p.group('facade', { x: 560, y: 650, w: 50, h: 360 }, (c) => {
    c.fillStyle = BLACK; c.fillRect(578, 660, 9, STREET - 660); c.fillRect(566, 690, 34, 5); c.fillRect(570, 720, 26, 4);
    c.fillStyle = GOLD; c.fillRect(569, 684, 4, 6); c.fillRect(593, 684, 4, 6);
  }, { t: 6.9, d: 0.5, reveal: 'rise' });
}

// ================================================================ the street: the walk, stools and tea, the flower seller, the vendor
function hat(c, x, y, s, col = EGG) {
  c.fillStyle = col; path(c, [[x - 15 * s, y], [x + 15 * s, y], [x, y - 13 * s]]); c.fill();
  c.strokeStyle = EGG_D; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 8 * s, y - 6 * s); c.lineTo(x + 8 * s, y - 6 * s); c.stroke();
}
function bike(c, x, y, s, col = GOLD) {
  c.strokeStyle = col; c.lineWidth = 2.2 * s; c.beginPath();
  c.arc(x - 22 * s, y - 13 * s, 13 * s, 0, Math.PI * 2); c.moveTo(x + 35 * s, y - 13 * s); c.arc(x + 22 * s, y - 13 * s, 13 * s, 0, Math.PI * 2);
  c.moveTo(x - 22 * s, y - 13 * s); c.lineTo(x - 4 * s, y - 13 * s); c.lineTo(x + 12 * s, y - 34 * s); c.lineTo(x - 10 * s, y - 34 * s); c.lineTo(x - 4 * s, y - 13 * s);
  c.moveTo(x - 10 * s, y - 34 * s); c.lineTo(x - 22 * s, y - 13 * s); c.moveTo(x + 12 * s, y - 34 * s); c.lineTo(x + 22 * s, y - 13 * s);
  c.moveTo(x + 12 * s, y - 34 * s); c.lineTo(x + 14 * s, y - 42 * s); c.lineTo(x + 6 * s, y - 44 * s);
  c.stroke();
}
function street(p, r) {
  p.group('street', { x: PX0, y: STREET - 4, w: PX1 - PX0, h: UP1 - STREET + 4 }, (c) => {
    c.fillStyle = LAC2; c.fillRect(PX0, STREET, PX1 - PX0, UP1 - STREET);
    c.fillStyle = GOLD_DD; c.fillRect(PX0, STREET, PX1 - PX0, 4);
    c.strokeStyle = 'rgba(201,154,68,0.25)'; c.lineWidth = 1; c.beginPath();
    for (let x = PX0; x < PX1; x += 46) { c.moveTo(x, STREET + 4); c.lineTo(x - 10, UP1); }
    c.stroke();
  }, { t: 5.6, d: 0.7, reveal: 'wipe', ease: 'inOut' });

  // tea on low red stools: a group of sitters
  const sitters = [[260, 1], [300, -1], [340, 1], [1020, -1], [1060, 1], [1100, 1]];
  p.group('street', { x: 200, y: 960, w: 960, h: 130 }, (c) => {
    for (const [x, d] of sitters) {
      const y = 1060;
      c.fillStyle = CIN; c.fillRect(x - 11, y - 16, 22, 5); c.fillRect(x - 10, y - 12, 3, 12); c.fillRect(x + 7, y - 12, 3, 12);
      c.fillStyle = EGG_D; path(c, [[x - 9, y - 16], [x + 9, y - 16], [x + 7, y - 46], [x - 6, y - 46]]); c.fill();
      c.fillStyle = BROWN; path(c, [[x - 6, y - 18], [x + d * 24, y - 22], [x + d * 26, y - 4], [x + d * 20, y - 4], [x + d * 18, y - 14], [x - 4, y - 10]]); c.fill();
      c.fillStyle = BLACK; c.beginPath(); c.arc(x + d * 2, y - 54, 8, 0, Math.PI * 2); c.fill();
    }
    // the tea table and cups
    for (const x of [300, 1060]) {
      c.fillStyle = CIN_D; c.fillRect(x - 16, 1050, 32, 4); c.fillRect(x - 3, 1054, 6, 18);
      c.fillStyle = EGG; for (const dx of [-10, 0, 10]) c.fillRect(x + dx - 2, 1043, 5, 7);
    }
  }, { t: 7.2, d: 0.7, reveal: 'fade' });

  // the flower seller walking her bicycle, its basket heaped with flowers
  const fx = 640, fy = 1078;
  const bloom = [];
  for (let k = 0; k < 60; k++) bloom.push([fx + r.range(-64, 10), fy - 46 - r.range(0, 40) * (1 - Math.abs(r.gauss()) * 0.5), r.range(3, 6), r.int(0, 3)]);
  p.group('street', { x: fx - 120, y: fy - 140, w: 220, h: 150 }, (c) => {
    bike(c, fx, fy, 1.1, GOLD);
    c.fillStyle = GOLD_D; c.fillRect(fx - 64, fy - 50, 74, 14);
    const cols = [CIN_L, EGG, GOLD_L, '#e07a8c'];
    cols.forEach((col, i) => { c.fillStyle = col; c.beginPath(); for (const [x, y, s, k] of bloom) if (k === i) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill(); });
    // the woman beside it, her hat
    const wx = fx + 46;
    c.fillStyle = EGG_D; path(c, [[wx - 10, fy - 70], [wx + 10, fy - 70], [wx + 14, fy - 30], [wx - 12, fy - 30]]); c.fill();
    c.fillStyle = BLACK; c.fillRect(wx - 9, fy - 30, 7, 30); c.fillRect(wx + 3, fy - 30, 7, 28);
    c.fillStyle = EGG_D; path(c, [[wx - 8, fy - 64], [wx - 30, fy - 46], [wx - 26, fy - 42], [wx - 4, fy - 58]]); c.fill();
    c.fillStyle = BLACK; c.beginPath(); c.arc(wx, fy - 78, 8, 0, Math.PI * 2); c.fill();
    hat(c, wx, fy - 80, 1.25);
  }, { t: 7.6, d: 0.7, reveal: 'pop' });

  // the vendor with her shoulder pole and two baskets
  const vx = 860, vy = 1078;
  p.group('street', { x: vx - 80, y: vy - 120, w: 160, h: 126 }, (c) => {
    c.fillStyle = CIN_D; path(c, [[vx - 9, vy - 70], [vx + 9, vy - 70], [vx + 12, vy - 28], [vx - 12, vy - 28]]); c.fill();
    c.fillStyle = BLACK; c.fillRect(vx - 8, vy - 28, 6, 28); c.fillRect(vx + 3, vy - 28, 6, 28);
    c.beginPath(); c.arc(vx, vy - 78, 8, 0, Math.PI * 2); c.fill();
    hat(c, vx, vy - 80, 1.25);
    c.strokeStyle = GOLD_D; c.lineWidth = 3; c.beginPath(); c.moveTo(vx - 66, vy - 74); c.quadraticCurveTo(vx, vy - 64, vx + 66, vy - 74); c.stroke();
    c.lineWidth = 1.2; c.beginPath();
    for (const s of [-1, 1]) { c.moveTo(vx + s * 62, vy - 72); c.lineTo(vx + s * 50, vy - 26); c.moveTo(vx + s * 62, vy - 72); c.lineTo(vx + s * 74, vy - 26); }
    c.stroke();
    for (const s of [-1, 1]) {
      c.fillStyle = GOLD; c.beginPath(); c.ellipse(vx + s * 62, vy - 20, 20, 10, 0, 0, Math.PI); c.fill(); c.fillRect(vx + s * 62 - 20, vy - 28, 40, 8);
      c.fillStyle = s < 0 ? CIN_L : LEAF_L; c.beginPath(); c.arc(vx + s * 62 - 8, vy - 30, 7, 0, Math.PI * 2); c.arc(vx + s * 62 + 6, vy - 31, 7, 0, Math.PI * 2); c.fill();
    }
  }, { t: 7.9, d: 0.6, reveal: 'pop' });

  // parked bicycles leaning along the walk
  p.group('street', { x: PX0, y: 1000, w: PX1 - PX0, h: 90 }, (c) => {
    for (const x of [140, 470, 1220, 1360]) bike(c, x, 1050, 0.82, x % 2 ? EGG_D : GOLD_D);
  }, { t: 8.2, d: 0.6, reveal: 'fade' });
}

// ================================================================ lower panel: gold dusk over the far shore, a gold moon
const WL = 1592; // the waterline at the near banks
function lowerSky(p, r) {
  const tones = leaf(r, PX0, LO0, PX1, SHORE + 10, 34, (x, y) => 0.15 + 0.85 * clamp((y - LO0) / (SHORE - LO0)) ** 1.3 * (1 - 0.3 * Math.abs(x - 800) / 800));
  p.group('far', { x: PX0, y: LO0, w: PX1 - PX0, h: SHORE - LO0 + 12 }, (c) => {
    c.save(); c.beginPath(); c.rect(PX0, LO0, PX1 - PX0, SHORE - LO0 + 10); c.clip(); drawLeaf(c, tones); c.restore();
  }, { t: 1.2, d: 1.2, reveal: 'fall', ease: 'inOut' });
  // the moon: a disc of pale gold leaf, its seams showing, ringed in black lacquer
  const mx = 360, my = 1214, mr = 42;
  p.group('far', { x: mx - 56, y: my - 56, w: 112, h: 112 }, (c) => {
    c.fillStyle = LAC; c.beginPath(); c.arc(mx, my, mr + 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD_L; c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.clip();
    c.fillStyle = '#f3dc9c'; c.fillRect(mx - mr, my - mr, 28, 28); c.fillRect(mx + 2, my + 2, 28, 28);
    c.strokeStyle = GOLD; c.lineWidth = 1; c.beginPath();
    for (let k = -2; k <= 2; k++) { c.moveTo(mx + k * 28 + 2, my - mr); c.lineTo(mx + k * 28 + 2, my + mr); c.moveTo(mx - mr, my + k * 28 + 2); c.lineTo(mx + mr, my + k * 28 + 2); }
    c.stroke(); c.restore();
  }, { t: 2.2, d: 0.8, reveal: 'iris' });
  // the far shore: trees and low roofs in lacquer brown and black
  const crowns = [];
  for (let x = PX0 - 20; x < PX1 + 20; x += r.range(26, 50)) crowns.push([x, SHORE - r.range(12, 40), r.range(16, 30)]);
  p.group('far', { x: PX0, y: SHORE - 80, w: PX1 - PX0, h: 96 }, (c) => {
    c.fillStyle = BROWN; for (const [x, y, s] of crowns) { c.beginPath(); c.ellipse(x, y, s * 1.2, s, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = LAC2; for (let x = PX0; x < PX1; x += 70) c.fillRect(x + 10, SHORE - 26, 50, 30);
    c.fillStyle = GOLD; for (let x = PX0; x < PX1; x += 70) if (x % 3 === 1) c.fillRect(x + 22, SHORE - 18, 6, 8);
  }, { t: 2.6, d: 0.9, reveal: 'rise' });
}

// ================================================================ the lake: still black water, a few long gold streaks, reflections
// a streak of gold leaf laid along the water in small squares, thinning at both ends
function streak(r, x0, y, L, th) {
  const segs = [];
  for (let x = x0; x < x0 + L;) {
    const w = r.range(16, 34), t = (x - x0) / L, h = Math.max(1.4, th * Math.sin(Math.PI * clamp(t)) ** 0.6);
    segs.push([x, y - h / 2, Math.min(w, x0 + L - x) - 1.4, h, r.int(0, 2)]);
    x += w;
  }
  return segs;
}
function lake(p, r) {
  p.group('lake', { x: PX0, y: SHORE, w: PX1 - PX0, h: LO1 - SHORE }, (c) => {
    c.fillStyle = BLACK; c.fillRect(PX0, SHORE + 4, PX1 - PX0, LO1 - SHORE - 4);
  }, { t: 2.8, d: 0.6, reveal: 'fade' });
  // a few long streaks of gold: two far out, six on the near water
  const lines = [[440, 1430, 520, 3], [980, 1470, 380, 2.5], [180, 1650, 760, 5], [820, 1700, 560, 4], [300, 1748, 900, 6], [1000, 1790, 420, 4], [140, 1836, 620, 5], [760, 1868, 700, 4]];
  const segs = [];
  lines.forEach(([x, y, L, th]) => segs.push(...streak(r, x, y, L, th)));
  p.group('lake', { x: PX0, y: SHORE, w: PX1 - PX0, h: LO1 - SHORE }, (c) => {
    for (let i = 0; i < 3; i++) { c.fillStyle = LEAFC[i]; c.beginPath(); for (const [x, y, w, h, k] of segs) if (k === i) c.rect(x, y, w, h); c.fill(); }
  }, { t: 3.0, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // the Turtle Tower on its own islet: three tiers, arched openings, eggshell walls inlaid tight
  const tx = 600, ty = 1426, S = 1.1;
  const body = [[-40, -4], [40, -4], [40, -50], [30, -50], [30, -84], [20, -84], [20, -108], [-20, -108], [-20, -84], [-30, -84], [-30, -50], [-40, -50]].map(([x, y]) => [tx + x * S, ty + y * S]);
  const tEgg = crackle(r, body, 4.5, 0.55);
  p.group('tower', { x: tx - 100, y: ty - 170, w: 200, h: 230 }, (c) => {
    // the islet with its tree
    c.fillStyle = LEAF; c.beginPath(); c.arc(tx + 66, ty - 34, 24, 0, Math.PI * 2); c.arc(tx + 82, ty - 18, 17, 0, Math.PI * 2); c.arc(tx - 70, ty - 16, 15, 0, Math.PI * 2); c.fill();
    c.fillStyle = UMBER; c.beginPath(); c.ellipse(tx, ty, 96, 10, 0, Math.PI, 0); c.fill();
    c.fillStyle = BROWN; c.fillRect(tx - 96, ty, 192, 8);
    c.fillStyle = BLACK; poly(c, body); c.fill();
    drawEgg(c, tEgg);
    c.strokeStyle = GOLD_D; c.lineWidth = 1.6; poly(c, body); c.stroke();
    c.fillStyle = BLACK;
    for (const [y, n, w] of [[-10, 3, 9], [-56, 3, 7], [-90, 2, 6]]) for (let i = 0; i < n; i++) {
      const x = tx + (i - (n - 1) / 2) * w * 2.6 * S, yy = ty + y * S, ww = w * S;
      c.beginPath(); c.moveTo(x - ww / 2, yy); c.lineTo(x - ww / 2, yy - ww * 1.6); c.arc(x, yy - ww * 1.6, ww / 2, Math.PI, 0); c.lineTo(x + ww / 2, yy); c.fill();
    }
    c.fillStyle = GOLD;
    c.fillRect(tx - 46 * S, ty - 54 * S, 92 * S, 4); c.fillRect(tx - 36 * S, ty - 88 * S, 72 * S, 4); c.fillRect(tx - 26 * S, ty - 112 * S, 52 * S, 4);
    path(c, [[tx - 14, ty - 112 * S], [tx + 14, ty - 112 * S], [tx + 8, ty - 125 * S], [tx, ty - 138 * S], [tx - 8, ty - 125 * S]]); c.fill();
    // its reflection: a few soft vertical strokes of eggshell and gold
    c.globalAlpha = 0.6;
    for (let k = -3; k <= 3; k++) { c.fillStyle = k % 2 ? GOLD_D : EGG_D; c.fillRect(tx + k * 11 - 1.5, ty + 12, 3, 40 - Math.abs(k) * 6); }
    c.globalAlpha = 1;
  }, { t: 4.4, d: 0.8, reveal: 'rise' });
}

// ================================================================ the banks: the shore at left, Ngọc Sơn's islet at right
// a bank's front: brown lacquer with a thin inlaid band of eggshell between two gold rules
function bank(c, x0, x1, top, egg) {
  c.fillStyle = UMBER; c.fillRect(x0, top, x1 - x0, 6);
  c.fillStyle = BROWN; c.fillRect(x0, top + 6, x1 - x0, WL - top - 6);
  c.fillStyle = GOLD; c.fillRect(x0, top + 10, x1 - x0, 2); c.fillRect(x0, top + 24, x1 - x0, 2);
  c.fillStyle = BLACK; c.fillRect(x0, top + 12, x1 - x0, 12);
  drawEgg(c, egg);
}
const BANK_L = 1548, BANK_R = 1544, ISLE0 = 1150;
function roof(c, x, y, w, h, col = CIN_D) {
  // a curved roof with its corners swept up, a gold ridge and ridge ends
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x - w / 2 - 16, y - h - 10); c.quadraticCurveTo(x - w / 2 - 4, y - 4, x - w / 2 + 12, y); c.lineTo(x + w / 2 - 12, y); c.quadraticCurveTo(x + w / 2 + 4, y - 4, x + w / 2 + 16, y - h - 10); c.quadraticCurveTo(x + w / 2 - 6, y - h * 0.8, x + w / 2 - 20, y - h); c.lineTo(x - w / 2 + 20, y - h); c.quadraticCurveTo(x - w / 2 + 6, y - h * 0.8, x - w / 2 - 16, y - h - 10); c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1; c.beginPath();
  for (let t = 0.08; t < 1; t += 0.06) { const xx = lerp(x - w / 2 + 10, x + w / 2 - 10, t); c.moveTo(xx, y - h + 2); c.lineTo(xx + (xx - x) * 0.05, y - 2); }
  c.stroke();
  c.fillStyle = GOLD; c.fillRect(x - w / 2 + 16, y - h - 4, w - 32, 5);
  c.beginPath(); c.moveTo(x - w / 2 + 16, y - h - 4); c.quadraticCurveTo(x - w / 2 + 8, y - h - 14, x - w / 2 + 14, y - h - 20); c.lineTo(x - w / 2 + 20, y - h - 4); c.fill();
  c.beginPath(); c.moveTo(x + w / 2 - 16, y - h - 4); c.quadraticCurveTo(x + w / 2 - 8, y - h - 14, x + w / 2 - 14, y - h - 20); c.lineTo(x + w / 2 - 20, y - h - 4); c.fill();
}
function temple(p, r) {
  const DY = 170; // the temple sits on its islet, its edge at BANK_R
  // banyans: great dark crowns over the islet, picked out with gold leaf
  const crowns = [];
  for (let k = 0; k < 30; k++) crowns.push([r.range(1180, 1560), r.range(1150, 1300) + DY, r.range(24, 52)]);
  crowns.sort((a, b) => a[1] - b[1]);
  const flecks = [];
  for (const [x, y, s] of crowns) for (let j = 0; j < 6; j++) flecks.push([x + r.range(-s, s * 0.4), y + r.range(-s, 0) * 0.8, r.range(3, 7)]);
  p.group('temple', { x: 1130, y: 1250, w: PX1 - 1130 + 20, h: 300 }, (c) => {
    c.fillStyle = LEAF; for (const [x, y, s] of crowns) { c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = LEAF_L; for (const [x, y, s] of crowns) { c.beginPath(); c.arc(x - s * 0.2, y - s * 0.25, s * 0.6, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = GOLD_D; c.beginPath(); for (const [x, y, s] of flecks) c.rect(x, y, s, s); c.fill();
    c.strokeStyle = BROWN; c.lineWidth = 2; c.beginPath();
    for (let x = 1200; x < 1540; x += 13) { c.moveTo(x, 1270 + DY); c.lineTo(x + Math.sin(x) * 6, BANK_R); }
    c.stroke();
  }, { t: 5.0, d: 1.0, reveal: 'rise' });
  // the islet's bank, and the shore's bank at left with the Pen Tower's terrace
  const eggR = crackle(r, [[ISLE0, BANK_R + 12], [PX1, BANK_R + 12], [PX1, BANK_R + 24], [ISLE0, BANK_R + 24]], 4.5, 0.5);
  const eggL = crackle(r, [[PX0, BANK_L + 12], [438, BANK_L + 12], [438, BANK_L + 24], [PX0, BANK_L + 24]], 4.5, 0.5);
  p.group('temple', { x: PX0, y: BANK_R - 10, w: PX1 - PX0, h: WL - BANK_R + 14 }, (c) => {
    bank(c, ISLE0, PX1, BANK_R, eggR);
    bank(c, PX0, 440, BANK_L, eggL);
  }, { t: 4.8, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // the buildings on the islet
  p.group('temple', { x: 1130, y: 1370, w: PX1 - 1130 + 20, h: 190 }, (c) => {
    c.save(); c.translate(0, DY);
    c.fillStyle = CIN; c.fillRect(1290, 1318, 220, 56);
    c.fillStyle = BLACK; for (let x = 1302; x < 1500; x += 30) c.fillRect(x, 1334, 16, 40);
    c.fillStyle = GOLD; for (let x = 1296; x < 1510; x += 30) c.fillRect(x, 1318, 4, 56);
    roof(c, 1400, 1320, 250, 40);
    roof(c, 1400, 1276, 160, 26);
    // the gate pavilion where the bridge lands, two tiers
    c.fillStyle = CIN_D; c.fillRect(1180, 1300, 76, 74);
    c.fillStyle = BLACK; c.beginPath(); c.moveTo(1202, 1374); c.lineTo(1202, 1336); c.arc(1218, 1336, 16, Math.PI, 0); c.lineTo(1234, 1374); c.fill();
    c.fillStyle = GOLD; c.fillRect(1184, 1312, 68, 4);
    roof(c, 1218, 1304, 120, 30);
    c.fillStyle = CIN_D; c.fillRect(1194, 1240, 48, 34);
    c.fillStyle = GOLD; c.fillRect(1202, 1250, 32, 14);
    roof(c, 1218, 1244, 90, 24);
    c.restore();
  }, { t: 5.6, d: 1.0, reveal: 'rise' });
  // the islet's reflection: soft vertical strokes, cinnabar under the halls, green under the trees
  const refl = [];
  for (let x = ISLE0 + 6; x < PX1 - 4; x += 9) refl.push([x, r.range(50, 150), x > 1180 && x < 1520 && r() < 0.6 ? 0 : 1]);
  p.group('lake', { x: ISLE0, y: WL, w: PX1 - ISLE0, h: 170 }, (c) => {
    c.globalAlpha = 0.6;
    [CIN_D, LEAF].forEach((col, i) => { c.fillStyle = col; c.beginPath(); for (const [x, L, k] of refl) if (k === i) { c.rect(x, WL + 4, 3, L * 0.55); c.rect(x, WL + 8 + L * 0.6, 3, L * 0.3); } c.fill(); });
    c.globalAlpha = 1;
  }, { t: 5.8, d: 0.8, reveal: 'fall' });
}

// ================================================================ the Thê Húc bridge: one red arch from the shore to the islet
const BA = [440, 1560], BC = [795, 1372], BB = [ISLE0, 1544];
const bz = (t) => [(1 - t) ** 2 * BA[0] + 2 * t * (1 - t) * BC[0] + t * t * BB[0], (1 - t) ** 2 * BA[1] + 2 * t * (1 - t) * BC[1] + t * t * BB[1]];
function bridge(p, r) {
  const N = 72;
  const deck = [], under = [], rail = [];
  for (let i = 0; i <= N; i++) { const [x, y] = bz(i / N); deck.push([x, y]); under.push([x, y + 14]); rail.push([x, y - 30]); }
  const face = [...deck, ...under.slice().reverse()];
  const piers = [];
  for (let i = 1; i < 16; i++) { const [x, y] = bz(i / 16); piers.push([x, y + 14]); }
  // the reflection, laid first: the arch mirrored in soft vertical cinnabar strokes
  const refl = [];
  for (let i = 1; i < N; i += 2) { const [x, y] = deck[i]; refl.push([x, 2 * WL - y]); }
  p.group('lake', { x: BA[0] - 10, y: WL, w: BB[0] - BA[0] + 20, h: 280 }, (c) => {
    c.globalAlpha = 0.55; c.fillStyle = CIN_D; c.beginPath();
    for (const [x, y] of refl) { c.rect(x - 1.5, WL + 4, 3, (y - WL) * 0.5); c.rect(x - 1.5, WL + 6 + (y - WL) * 0.56, 3, (y - WL) * 0.34); }
    c.fill();
    c.globalAlpha = 0.8; c.fillStyle = CIN; c.beginPath();
    for (let i = 0; i < refl.length; i += 2) { const [x, y] = refl[i]; c.rect(x - 4, y - 2, 8, 3); }
    c.fill(); c.globalAlpha = 1;
  }, { t: 6.2, d: 0.9, reveal: 'fall' });
  p.group('bridge', boxOf([...rail, ...piers.map(([x]) => [x, WL + 4])], 12), (c) => {
    // slender piers down to the water
    c.fillStyle = CIN_D;
    for (const [x, y] of piers) c.fillRect(x - 3, y, 6, WL - y);
    c.fillStyle = CIN; path(c, face); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 2.6; path(c, deck, false); c.stroke();
    c.strokeStyle = CIN_D; c.lineWidth = 1.4; c.beginPath();
    for (let i = 0; i <= N; i += 3) { const [x, y] = deck[i]; c.moveTo(x, y + 3); c.lineTo(x, y + 12); }
    c.stroke();
  }, { t: 6.4, d: 1.3, reveal: 'wipe', ease: 'inOut' });
  // the railing: posts and two bars, drawn from the shore outward
  const posts = [];
  for (let i = 0; i <= N; i += 3) posts.push([deck[i], rail[i]]);
  p.strokes('bridge', posts, CIN_L, 2.4, { t: 7.4, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  p.pen('bridge', rail, CIN_L, 4, { t: 7.5, d: 1.2 });
  p.pen('bridge', deck.map(([x, y]) => [x, y - 15]), CIN_L, 2, { t: 7.7, d: 1.2 });
  p.pen('bridge', rail.map(([x, y]) => [x, y - 2]), GOLD, 1.2, { t: 7.9, d: 1.2 });
}

// ================================================================ the shore: the Pen Tower on its terrace, the gate at the bridge's foot
function penTower(p, r) {
  const x = 236, base = BANK_L;
  // the terrace: two stone steps edged in gold
  p.group('tower', { x: x - 60, y: base - 40, w: 120, h: 44 }, (c) => {
    c.fillStyle = UMBER; c.fillRect(x - 50, base - 16, 100, 16); c.fillRect(x - 38, base - 30, 76, 14);
    c.fillStyle = GOLD; c.fillRect(x - 50, base - 17, 100, 2); c.fillRect(x - 38, base - 31, 76, 2);
  }, { t: 5.2, d: 0.6, reveal: 'rise' });
  // the tower: a square stone shaft in five stories, its tip a writing brush, and its reflection
  const k = 0.8, b0 = base - 30;
  const tiers = [[0, 46], [84, 40], [160, 34], [228, 29], [288, 24], [338, 19]].map(([h, w]) => [b0 - h * k, w * 0.9]);
  p.group('tower', { x: x - 50, y: b0 - 420 * k, w: 100, h: 420 * k + 4 }, (c) => {
    for (let i = 0; i < tiers.length - 1; i++) {
      const [y0, w0] = tiers[i], [y1, w1] = tiers[i + 1];
      c.fillStyle = UMBER; path(c, [[x - w0 / 2, y0], [x + w0 / 2, y0], [x + w1 / 2, y1 + 5], [x - w1 / 2, y1 + 5]]); c.fill();
      c.fillStyle = GOLD_D; path(c, [[x - w0 / 2, y0], [x - w0 / 2 + 7, y0], [x - w1 / 2 + 6, y1 + 5], [x - w1 / 2, y1 + 5]]); c.fill();
      c.fillStyle = GOLD; c.fillRect(x - w1 / 2 - 5, y1, w1 + 10, 5);
      c.fillStyle = BLACK; c.beginPath(); c.arc(x + 2, (y0 + y1) / 2 - 3, 3.5, 0, Math.PI * 2); c.fill();
    }
    const [yt, wt] = tiers[tiers.length - 1];
    c.fillStyle = GOLD; c.fillRect(x - wt / 2 - 2, yt - 8, wt + 4, 8);
    c.fillStyle = UMBER; c.beginPath(); c.moveTo(x - 8, yt - 8); c.quadraticCurveTo(x - 9, yt - 38, x, yt - 64); c.quadraticCurveTo(x + 9, yt - 38, x + 8, yt - 8); c.fill();
    c.fillStyle = GOLD_L; c.beginPath(); c.moveTo(x - 3, yt - 12); c.quadraticCurveTo(x - 4, yt - 36, x, yt - 58); c.lineTo(x - 1, yt - 12); c.fill();
  }, { t: 5.4, d: 1.0, reveal: 'rise' });
  p.group('lake', { x: x - 40, y: WL, w: 80, h: 300 }, (c) => {
    c.globalAlpha = 0.6; c.fillStyle = GOLD_D; c.beginPath();
    for (let j = -2; j <= 2; j++) { const L = 260 - Math.abs(j) * 60; c.rect(x + j * 8 - 1.5, WL + 6, 3, L * 0.6); c.rect(x + j * 8 - 1.5, WL + 10 + L * 0.66, 3, L * 0.26); }
    c.fill(); c.globalAlpha = 1;
  }, { t: 6.6, d: 0.6, reveal: 'fall' });
  // two gate pillars at the bridge's foot, square and tall, each crowned with a lotus bud
  const g0 = 366, g1 = 426;
  p.group('tower', { x: g0 - 24, y: base - 150, w: g1 - g0 + 48, h: 152 }, (c) => {
    for (const gx of [g0, g1]) {
      c.fillStyle = UMBER; c.fillRect(gx - 12, base - 8, 24, 8);
      c.fillStyle = CIN; c.fillRect(gx - 8, base - 104, 16, 96);
      c.fillStyle = CIN_D; c.fillRect(gx + 2, base - 104, 6, 96);
      c.fillStyle = GOLD; c.fillRect(gx - 10, base - 108, 20, 5); c.fillRect(gx - 6, base - 90, 12, 3); c.fillRect(gx - 6, base - 30, 12, 3);
      // a little lantern box and the bud on top
      c.fillStyle = CIN_D; c.fillRect(gx - 9, base - 124, 18, 16);
      c.fillStyle = GOLD_L; c.fillRect(gx - 5, base - 120, 10, 8);
      c.fillStyle = GOLD; c.fillRect(gx - 11, base - 128, 22, 4);
      c.beginPath(); c.moveTo(gx - 7, base - 128); c.quadraticCurveTo(gx - 8, base - 140, gx, base - 148); c.quadraticCurveTo(gx + 8, base - 140, gx + 7, base - 128); c.fill();
    }
  }, { t: 5.6, d: 0.6, reveal: 'rise' });
}

// ================================================================ the near shore: a willow on the bank, a kerb along the foot
function front(p, r) {
  p.pen('front', [[104, BANK_L], [96, 1420], [116, 1300], [130, LO0]], LAC2, 14, { t: 8.6, d: 0.6 });
  const fronds = [];
  for (let k = 0; k < 26; k++) {
    const x = PX0 + r.range(10, 110), y0 = LO0, L = r.range(120, 320);
    const pts = []; for (let t = 0; t <= 1.0001; t += 0.1) pts.push([x + Math.sin(t * 2 + k) * 8 + t * 18, y0 + t * L]);
    fronds.push(pts);
  }
  p.strokes('front', fronds, LEAF_L, 2.4, { t: 9.0, d: 0.9, reveal: 'fall', box: { x: PX0 - 20, y: LO0 - 4, w: 180, h: 340 } });
  p.group('front', { x: PX0, y: LO1 - 40, w: PX1 - PX0, h: 44 }, (c) => {
    c.fillStyle = LAC2; c.fillRect(PX0, LO1 - 26, PX1 - PX0, 26);
    c.fillStyle = GOLD_D; for (let x = PX0 + 10; x < PX1; x += 60) c.fillRect(x, LO1 - 16, 34, 3);
  }, { t: 8.6, d: 0.6, reveal: 'wipe' });
}

// ================================================================ live: riders on the street, light shivering on the lake, a rowboat
function live(p, r) {
  const riders = [[0, 1, 0.9, CIN_D], [0.45, -1, 0.85, BROWN], [0.75, 1, 0.95, LEAF]];
  const span = PX1 - PX0 + 200;
  p.live('live', {
    t: 9.6, d: 1.0, reveal: 'fade',
    box: { x: PX0, y: 960, w: PX1 - PX0, h: 130 },
    draw: (c, time) => {
      c.save(); c.beginPath(); c.rect(PX0, UP0, PX1 - PX0, UP1 - UP0); c.clip();
      for (const [ph, dir, s, col] of riders) {
        const u = (ph * span + time * 60 * s) % span;
        const x = dir > 0 ? PX0 - 100 + u : PX1 + 100 - u, y = 1086;
        c.save(); c.translate(x, y); c.scale(dir, 1);
        bike(c, 0, 0, 0.95, GOLD_L);
        const pedal = Math.sin(time * 5 + ph * 6) * 6;
        c.fillStyle = col; path(c, [[-10, -40], [6, -40], [10, -70], [-4, -74]]); c.fill();
        c.strokeStyle = BLACK; c.lineWidth = 4; c.beginPath(); c.moveTo(-4, -40); c.lineTo(-2 + pedal, -18); c.moveTo(2, -40); c.lineTo(2 - pedal, -18); c.moveTo(4, -64); c.lineTo(12, -42); c.stroke();
        c.fillStyle = BLACK; c.beginPath(); c.arc(0, -80, 7, 0, Math.PI * 2); c.fill();
        hat(c, 0, -82, 1.1);
        c.restore();
      }
      c.restore();
    },
  });
  // gold glints drifting slowly on the water
  const glints = [[560, 1650, 0.6], [1040, 1700, 0.9], [700, 1748, 0.5], [1140, 1790, 0.8], [420, 1836, 0.7], [1100, 1868, 0.4], [600, 1430, 1.0], [1120, 1470, 0.6]];
  p.live('live', {
    t: 9.8, d: 1.0, reveal: 'fade',
    box: { x: PX0, y: SHORE, w: PX1 - PX0, h: LO1 - SHORE },
    draw: (c, time) => {
      c.fillStyle = '#f6e2a6'; c.beginPath();
      for (const [x, y, ph] of glints) {
        const a = Math.sin(time * 0.9 + ph * 7);
        if (a < 0.2) continue;
        const w = 60 * a;
        c.rect(x + Math.sin(time * 0.25 + ph * 3) * 40 - w / 2, y - 1, w, 2);
      }
      c.fill();
    },
  });
  // a small rowboat crossing far out
  p.live('live', {
    t: 10.2, d: 1.0, reveal: 'fade',
    box: { x: PX0, y: 1760, w: PX1 - PX0, h: 80 },
    draw: (c, time) => {
      const x = 560 + ((time * 9) % 360), y = 1812, row = Math.sin(time * 2.2);
      c.fillStyle = BROWN; path(c, [[x - 30, y - 6], [x + 30, y - 6], [x + 22, y + 2], [x - 22, y + 2]]); c.fill();
      c.fillStyle = BLACK; c.fillRect(x - 3, y - 22, 7, 16); c.beginPath(); c.arc(x, y - 26, 4.5, 0, Math.PI * 2); c.fill();
      hat(c, x, y - 27, 0.7);
      c.strokeStyle = GOLD_D; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 2, y - 14); c.lineTo(x - 26 - row * 6, y + 6); c.moveTo(x + 4, y - 14); c.lineTo(x + 28 + row * 6, y + 6); c.stroke();
      c.fillStyle = GOLD_D; c.fillRect(x - 24, y + 6, 48, 2);
    },
  });
}

// ================================================================ the name
function title(p) {
  p.type('frame', 'HÀ NỘI', W / 2, 296, { size: 212, family: FACE, color: GOLD, align: 'center', track: 0.06, t: 10.6, gap: 0.26, d: 0.9, reveal: 'press' });
  p.group('frame', { x: 60, y: 130, w: W - 120, h: 200 }, (c) => {
    c.fillStyle = CIN; c.fillRect(120, 230, 300, 4); c.fillRect(W - 420, 230, 300, 4);
    c.fillStyle = GOLD; for (const x of [120, W - 124]) c.fillRect(x, 224, 4, 16);
  }, { t: 12.2, d: 0.7, reveal: 'fade' });
  p.type('frame', 'PHỐ CỔ', 270, 206, { size: 40, family: FACE, color: EGG, align: 'center', track: 0.24, t: 12.4, gap: 0.06, d: 0.4, reveal: 'fade' });
  p.type('frame', 'HỒ HOÀN KIẾM', W - 270, 206, { size: 40, family: FACE, color: EGG, align: 'center', track: 0.16, t: 12.6, gap: 0.05, d: 0.4, reveal: 'fade' });
  p.type('frame', 'VIỆT NAM', 270, 286, { size: 30, family: FACE, color: GOLD_D, align: 'center', track: 0.4, t: 12.9, gap: 0.05, d: 0.4, reveal: 'fade' });
  p.type('frame', 'SƠN MÀI', W - 270, 286, { size: 30, family: FACE, color: GOLD_D, align: 'center', track: 0.4, t: 13.0, gap: 0.05, d: 0.4, reveal: 'fade' });
  // a red seal
  p.group('frame', { x: W - 150, y: H - 150, w: 80, h: 80 }, (c) => {
    c.fillStyle = CIN; c.fillRect(W - 140, H - 140, 56, 56);
    c.strokeStyle = GOLD_L; c.lineWidth = 3; c.strokeRect(W - 134, H - 134, 44, 44);
    c.beginPath(); c.moveTo(W - 112, H - 128); c.lineTo(W - 98, H - 112); c.lineTo(W - 112, H - 96); c.lineTo(W - 126, H - 112); c.closePath(); c.stroke();
    c.fillStyle = GOLD_L; c.beginPath(); c.arc(W - 112, H - 112, 4, 0, Math.PI * 2); c.fill();
  }, { t: 13.3, d: 0.5, reveal: 'press' });
}
