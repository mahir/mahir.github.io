// Beijing: a red paper cut on cream rice paper, laid down and cut while you
// watch. One red sheet: a border of coins and sawteeth; above, a red sky with
// a round window cut in it where the Temple of Heaven's Hall of Prayer stands on
// its three white terraces, clouds and cranes cut in the sky, the Great Wall cut
// along the ridges below; under it, standing free on the cream, the Meridian
// Gate of the Forbidden City with its wings, a corner tower, the White Dagoba of
// Beihai on its hill, the moat in cut waves. The title brushed in black ink.

import { Plate, W, H } from '../print.js';
import { lerp, rng } from '../kit.js';

const PAPER = '#f2e8d1', RED = '#c5171f', RED_D = '#a30f17', INK = '#1d1917';
const SHADOW = 'rgba(70,16,10,0.30)', SHADOW_IN = 'rgba(70,16,10,0.42)';
const F = '"Ma Shan Zheng", serif';

export const city = {
  id: 'beijing', name: 'Beijing', wall: '#4a1214',
  alt: "A red paper cut on cream: the Temple of Heaven's Hall of Prayer for Good Harvests on its three terraces inside a round window cut in a red sky of clouds and cranes, the Great Wall along the ridges, and below the Meridian Gate of the Forbidden City with its wings, a corner tower, the White Dagoba of Beihai and the moat, with lanterns, pigeons and a swallow kite, the name brushed in ink as 北京",
  google: 'family=Ma+Shan+Zheng',
  fonts: [['400 300px "Ma Shan Zheng"', '北京'], ['400 40px "Ma Shan Zheng"', 'BEIJING'], ['400 34px "Ma Shan Zheng"', '天坛午门角楼白塔长城·'], ['400 40px "Ma Shan Zheng"', '北京']],
  build,
};

// the frame of the sheet, the red sky, the round window
const FX0 = 96, FY0 = 96, FX1 = W - 96, FY1 = 1564, BW = 60;
const IX0 = FX0 + BW, IY0 = FY0 + BW, IX1 = FX1 - BW, IY1 = FY1 - BW;
const SKY1 = 1012; // the red sky's lower edge
const CX = 800, CY = 592, CR = 390; // the round window
const GROUND = 1400; // the moat strip

function build() {
  const p = new Plate({ paper: PAPER, seed: 1420 });
  const r = p.r;
  p.stack('sheet', 'cut', 'temple', 'tcut', 'city', 'ccut', 'kite', 'lanterns', 'pigeons', 'title');

  frame(p, r);
  sky(p, r);
  temple(p, r);
  moat(p, r);
  cornerTower(p);
  gate(p, r);
  dagoba(p, r);
  life(p, r);
  title(p);
  return p;
}

// ================================================================ paper-cut helpers
// a shape built into a Path2D once; its red with the shadow it throws on the paper below
function shape(fn) { const P = new Path2D(); fn(P); return P; }
function red(c, P, col = RED) {
  c.save(); c.translate(4, 5); c.fillStyle = SHADOW; c.fill(P); c.restore();
  c.fillStyle = col; c.fill(P);
}
// holes cut through the red: the paper shows, shadowed along the top and left edge
function holes(c, P) {
  c.save(); c.clip(P);
  c.fillStyle = SHADOW_IN; c.fill(P);
  c.translate(2.2, 2.8); c.fillStyle = PAPER; c.fill(P);
  c.restore();
}
// a line cut with the knife: a slit of paper, shadowed on one side
function slits(c, P, w) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = SHADOW_IN; c.lineWidth = w; c.stroke(P);
  c.save(); c.translate(1.1, 1.4); c.strokeStyle = PAPER; c.lineWidth = w * 0.82; c.stroke(P); c.restore();
}
function polyTo(P, pts, close = true) { pts.forEach(([x, y], i) => (i ? P.lineTo(x, y) : P.moveTo(x, y))); if (close) P.closePath(); }
function lineTo(P, pts) { pts.forEach(([x, y], i) => (i ? P.lineTo(x, y) : P.moveTo(x, y))); }
// a knife line drawn along a polyline while it is cut
function knife(p, layer, pts, w, o) {
  let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const P = shape((P) => lineTo(P, pts));
  return p.mark(layer, {
    reveal: 'draw', ease: 'inOut', ...o, box: { x: x0 - w - 4, y: y0 - w - 4, w: x1 - x0 + 2 * w + 8, h: y1 - y0 + 2 * w + 8 },
    draw: (c, q) => {
      if (q < 1) { c.setLineDash([len, len + 1]); c.lineDashOffset = len * (1 - q); }
      slits(c, P, w);
    },
  });
}
// sawteeth: a row of small triangles from a to b, pointing to one side
function teeth(P, ax, ay, bx, by, size, side = 1) {
  const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.floor(L / size));
  const ux = (bx - ax) / L, uy = (by - ay) / L, nx = -uy * side, ny = ux * side;
  const st = L / n;
  for (let i = 0; i < n; i++) {
    const x = ax + ux * i * st, y = ay + uy * i * st;
    P.moveTo(x + ux * 1.2, y + uy * 1.2); P.lineTo(x + ux * (st - 1.2), y + uy * (st - 1.2)); P.lineTo(x + ux * st / 2 + nx * size * 0.8, y + uy * st / 2 + ny * size * 0.8); P.closePath();
  }
}
// crescents, the paper cutter's moon-shaped stroke, as holes
function crescent(P, x, y, rad, ang = 0) {
  const a0 = ang + Math.PI * 0.15, a1 = ang + Math.PI * 0.85;
  P.moveTo(x + Math.cos(a0) * rad, y + Math.sin(a0) * rad);
  P.arc(x, y, rad, a0, a1);
  P.quadraticCurveTo(x, y + Math.sin(ang + Math.PI / 2) * rad * 0.35, x + Math.cos(a0) * rad, y + Math.sin(a0) * rad);
  P.closePath();
}
// a spiral for a cloud's curl
function swirl(cx, cy, r0, turns, dir = 1, a0 = 0) {
  const pts = [], n = Math.round(turns * 28);
  for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + dir * t * turns * Math.PI * 2, rr = r0 * (0.18 + 0.82 * t); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return pts;
}

// ================================================================ the frame: coins and sawteeth
function frame(p, r) {
  const band = shape((P) => { P.rect(FX0, FY0, FX1 - FX0, FY1 - FY0); P.rect(IX1, IY0, IX0 - IX1, IY1 - IY0); });
  const cut = shape((P) => {
    teeth(P, IX0, IY0, IX1, IY0, 13, -1); teeth(P, IX1, IY1, IX0, IY1, 13, -1);
    teeth(P, IX0, IY1, IX0, IY0, 13, -1); teeth(P, IX1, IY0, IX1, IY1, 13, -1);
    teeth(P, FX0 + 10, FY0 + 6, FX1 - 10, FY0 + 6, 9, 1);
    teeth(P, FX1 - 10, FY1 - 6, FX0 + 10, FY1 - 6, 9, 1);
  });
  // coins along the band: a ring and a square hole, cut as slits
  const coins = shape((P) => {
    const m = BW / 2;
    const put = (x, y) => { P.moveTo(x + 14, y); P.arc(x, y, 14, 0, Math.PI * 2); P.moveTo(x - 5, y - 5); P.lineTo(x + 5, y - 5); P.lineTo(x + 5, y + 5); P.lineTo(x - 5, y + 5); P.closePath(); };
    for (let x = FX0 + m + 40; x < FX1 - m - 20; x += 64) { put(x, FY0 + m + 4); put(x, FY1 - m - 4); }
    for (let y = FY0 + m + 72; y < FY1 - m - 40; y += 64) { put(FX0 + m + 2, y); put(FX1 - m - 2, y); }
  });
  const corners = shape((P) => {
    for (const [x, y] of [[FX0 + BW / 2, FY0 + BW / 2], [FX1 - BW / 2, FY0 + BW / 2], [FX0 + BW / 2, FY1 - BW / 2], [FX1 - BW / 2, FY1 - BW / 2]]) {
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; P.moveTo(x, y); P.ellipse(x + Math.cos(a) * 11, y + Math.sin(a) * 11, 8, 5, a, 0, Math.PI * 2); }
    }
  });
  const all = { x: FX0 - 4, y: FY0 - 4, w: FX1 - FX0 + 16, h: FY1 - FY0 + 16 };
  p.group('sheet', all, (c) => red(c, band), { t: 0.2, d: 1.2, reveal: 'fall', ease: 'inOut' });
  p.group('cut', all, (c) => holes(c, cut), { t: 1.2, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  p.group('cut', all, (c) => slits(c, coins, 3.2), { t: 1.6, d: 1.4, reveal: 'wipeL', ease: 'inOut' });
  p.group('cut', all, (c) => holes(c, corners), { t: 2.6, d: 0.6, reveal: 'fade' });
}

// ================================================================ the red sky and its window
const crane = (x, y, s, flip) => (P) => {
  // a crane flying: a long neck and beak ahead, long legs trailing, wings raised with fingered tips
  const f = flip ? -1 : 1, X = (u) => x + u * s * f, Y = (v) => y + v * s;
  P.moveTo(X(30), Y(0)); P.ellipse(X(0), Y(0), 30 * s, 11 * s, 0, 0, Math.PI * 2);
  P.moveTo(X(22), Y(-6)); P.quadraticCurveTo(X(44), Y(-16), X(66), Y(-14)); P.lineTo(X(66), Y(-8)); P.quadraticCurveTo(X(44), Y(-8), X(24), Y(4)); P.closePath();
  P.moveTo(X(76), Y(-12)); P.arc(X(70), Y(-12), 6.5 * s, 0, Math.PI * 2);
  P.moveTo(X(74), Y(-15)); P.lineTo(X(100), Y(-10)); P.lineTo(X(74), Y(-8)); P.closePath();
  P.moveTo(X(-26), Y(2)); P.lineTo(X(-84), Y(10)); P.lineTo(X(-84), Y(13)); P.lineTo(X(-26), Y(7)); P.closePath();
  P.moveTo(X(-26), Y(5)); P.lineTo(X(-80), Y(18)); P.lineTo(X(-80), Y(21)); P.lineTo(X(-24), Y(9)); P.closePath();
  P.moveTo(X(-28), Y(-2)); P.lineTo(X(-46), Y(-10)); P.lineTo(X(-40), Y(0)); P.lineTo(X(-48), Y(6)); P.closePath();
  // the near wing, up, with five fingers
  P.moveTo(X(10), Y(-8)); P.quadraticCurveTo(X(0), Y(-50), X(-34), Y(-84)); P.lineTo(X(-28), Y(-70)); P.lineTo(X(-50), Y(-86)); P.lineTo(X(-38), Y(-66)); P.lineTo(X(-62), Y(-78));
  P.lineTo(X(-44), Y(-56)); P.lineTo(X(-66), Y(-64)); P.lineTo(X(-44), Y(-44)); P.lineTo(X(-62), Y(-46)); P.quadraticCurveTo(X(-24), Y(-28), X(-16), Y(-6)); P.closePath();
  // the far wing, lower and narrower
  P.moveTo(X(16), Y(-8)); P.quadraticCurveTo(X(26), Y(-44), X(4), Y(-68)); P.lineTo(X(12), Y(-62)); P.lineTo(X(8), Y(-76)); P.quadraticCurveTo(X(36), Y(-44), X(26), Y(-6)); P.closePath();
};
function cloud(x, y, s, dir) {
  // three curls, the big one in the middle, and a tail that streams away
  const out = [];
  out.push(swirl(x, y, 30 * s, 1.6, dir, Math.PI));
  out.push(swirl(x - 44 * s * dir, y + 8 * s, 20 * s, 1.4, -dir, 0));
  out.push(swirl(x + 40 * s * dir, y + 6 * s, 22 * s, 1.4, dir, Math.PI * 0.5));
  out.push([[x - 66 * s * dir, y + 26 * s], [x - 10 * s * dir, y + 32 * s], [x + 50 * s * dir, y + 28 * s], [x + 110 * s * dir, y + 34 * s], [x + 160 * s * dir, y + 24 * s]]);
  return out;
}
function sky(p, r) {
  const field = shape((P) => P.rect(IX0, IY0, IX1 - IX0, SKY1 - IY0));
  const box = { x: IX0 - 4, y: IY0 - 4, w: IX1 - IX0 + 12, h: SKY1 - IY0 + 12 };
  p.group('sheet', box, (c) => red(c, field), { t: 1.4, d: 1.0, reveal: 'drop', dy: 40 });
  // the round window is cut out, and a ring of teeth around it
  const win = shape((P) => P.arc(CX, CY, CR, 0, Math.PI * 2));
  p.group('cut', { x: CX - CR - 6, y: CY - CR - 6, w: 2 * CR + 12, h: 2 * CR + 12 }, (c) => {
    c.save(); c.beginPath(); c.rect(IX0, IY0, IX1 - IX0, SKY1 - IY0); c.clip(); holes(c, win); c.restore();
  }, { t: 2.3, d: 1.3, reveal: 'iris', ease: 'inOut' });
  const ring = shape((P) => {
    const n = 120;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
      const r0 = CR + 12, r1 = CR + 26;
      if (CY + Math.sin(am) * r1 > SKY1 - 16) continue;
      P.moveTo(CX + Math.cos(a0 + 0.004) * r0, CY + Math.sin(a0 + 0.004) * r0); P.lineTo(CX + Math.cos(am) * r1, CY + Math.sin(am) * r1); P.lineTo(CX + Math.cos(a1 - 0.004) * r0, CY + Math.sin(a1 - 0.004) * r0); P.closePath();
    }
  });
  p.group('cut', { x: CX - CR - 40, y: CY - CR - 40, w: 2 * CR + 80, h: 2 * CR + 80 }, (c) => holes(c, ring), { t: 3.4, d: 1.0, reveal: 'iris' });
  // a second ring: round holes, like a string of pearls
  const ring2 = shape((P) => { for (let i = 0; i < 96; i++) { const a = (i / 96) * Math.PI * 2, rr = CR + 44; const x = CX + Math.cos(a) * rr, y = CY + Math.sin(a) * rr; if (y > SKY1 - 22) continue; P.moveTo(x + 4.5, y); P.arc(x, y, 4.5, 0, Math.PI * 2); } });
  p.group('cut', { x: CX - CR - 70, y: CY - CR - 70, w: 2 * CR + 140, h: 2 * CR + 140 }, (c) => holes(c, ring2), { t: 3.8, d: 1.0, reveal: 'iris' });

  // clouds cut into the sky in the corners, knife line by knife line
  const clouds = [[270, 290, 1.25, 1], [1326, 276, 1.25, -1], [1300, 560, 0.85, -1], [290, 600, 0.85, 1], [800, 166 + 22, 0.42, 1]];
  let t = 4.2;
  for (const [x, y, s, dir] of clouds) {
    for (const ln of cloud(x, y, s, dir)) {
      knife(p, 'cut', ln, 4.2 * Math.max(0.8, s), { t, d: 0.7 });
      t += 0.12;
    }
  }
  // two cranes cut out, flying toward the window
  for (const [x, y, s, flip, tt] of [[310, 452, 1.0, false, 5.8], [1288, 430, 1.0, true, 6.0]]) {
    const P = shape(crane(x, y, s, flip));
    p.group('cut', { x: x - 110, y: y - 100, w: 220, h: 140 }, (c) => holes(c, P), { t: tt, d: 0.7, reveal: flip ? 'wipeL' : 'wipe' });
  }
  // the Great Wall along the ridges in the lower corners, its towers, and the hills' crescents
  const ridgeL = [[IX0, 760], [210, 724], [262, 690], [300, 706], [330, 780], [368, 846], [404, 830], [440, 900], [480, 962]];
  const ridgeR = [[IX1, 780], [1396, 744], [1350, 700], [1300, 742], [1262, 820], [1224, 880], [1188, 860], [1150, 930], [1120, 980]];
  for (const [ridge, tt] of [[ridgeL, 6.2], [ridgeR, 6.4]]) {
    const pts = [];
    for (let i = 0; i < ridge.length - 1; i++) for (let k = 0; k < 6; k++) pts.push([lerp(ridge[i][0], ridge[i + 1][0], k / 6), lerp(ridge[i][1], ridge[i + 1][1], k / 6)]);
    pts.push(ridge[ridge.length - 1]);
    // the wall: a slit with merlons on top, cut in one go
    const wall = shape((P) => {
      lineTo(P, pts);
      for (let i = 1; i < pts.length - 1; i += 1) { const [x, y] = pts[i]; P.moveTo(x - 3, y - 8); P.lineTo(x + 3, y - 8); }
    });
    p.group('cut', { x: Math.min(...pts.map((q) => q[0])) - 20, y: Math.min(...pts.map((q) => q[1])) - 60, w: 380, h: 340 }, (c) => slits(c, wall, 7), { t: tt, d: 1.4, reveal: ridge === ridgeL ? 'wipe' : 'wipeL', ease: 'inOut' });
    // the watchtowers on the high points, and the slope of the hill under the wall
    const towers = shape((P) => {
      for (const i of [2, 5, 7]) {
        const [x, y] = ridge[i];
        P.rect(x - 14, y - 30, 28, 24);
        for (let k = 0; k < 4; k++) P.rect(x - 14 + k * 8, y - 36, 5, 7);
      }
      // under the wall, the hillside in rows of crescents that follow the slope
      for (let row = 1; row <= 6; row++) {
        for (let i = 0; i < ridge.length - 1; i++) {
          for (let k = 0; k < 2; k++) {
            const t2 = (k + (row % 2) * 0.5 + 0.25) / 2;
            const x = lerp(ridge[i][0], ridge[i + 1][0], t2), y = lerp(ridge[i][1], ridge[i + 1][1], t2) + row * 26;
            if (y < SKY1 - 26 && Math.hypot(x - CX, y - CY) > CR + 64) crescent(P, x, y, 7, Math.PI * 0.5);
          }
        }
      }
    });
    p.group('cut', { x: Math.min(...ridge.map((q) => q[0])) - 20, y: Math.min(...ridge.map((q) => q[1])) - 50, w: 380, h: SKY1 - Math.min(...ridge.map((q) => q[1])) + 40 }, (c) => holes(c, towers), { t: tt + 0.9, d: 0.7, reveal: 'pop' });
  }
  // the sky's lower edge: a row of teeth
  const edge = shape((P) => teeth(P, IX0 + 6, SKY1 - 10, IX1 - 6, SKY1 - 10, 12, -1));
  p.group('cut', { x: IX0, y: SKY1 - 30, w: IX1 - IX0, h: 34 }, (c) => holes(c, edge), { t: 6.8, d: 1.0, reveal: 'wipe' });
}

// ================================================================ the Temple of Heaven
// a roof tier: a flared cone in elevation, from eave half-width a at y1 to b at y0
function roofTier(P, x, y0, y1, a, b, lift = 10) {
  P.moveTo(x - b, y0);
  P.lineTo(x + b, y0);
  P.quadraticCurveTo(x + (a + b) / 2 + 6, y1 - (y1 - y0) * 0.25, x + a + 8, y1 - lift);
  P.lineTo(x + a - 6, y1);
  P.lineTo(x - a + 6, y1);
  P.lineTo(x - a - 8, y1 - lift);
  P.quadraticCurveTo(x - (a + b) / 2 - 6, y1 - (y1 - y0) * 0.25, x - b, y0);
  P.closePath();
}
function temple(p, r) {
  // three white marble terraces with their balustrades, the stair up the middle
  const tiers = [[330, 908, 962], [270, 858, 908], [214, 810, 858]];
  tiers.forEach(([hw, y0, y1], k) => {
    const body = shape((P) => { P.rect(CX - hw, y0, 2 * hw, y1 - y0); });
    const cut = shape((P) => {
      // balusters: a row of slots, then the slab under them
      for (let x = CX - hw + 8; x < CX + hw - 14; x += 14) { if (Math.abs(x + 5 - CX) < 34) continue; P.rect(x, y0 + 8, 7, (y1 - y0) * 0.42); }
      P.rect(CX - hw + 6, y1 - 10, 2 * hw - 12, 3);
    });
    p.group('temple', { x: CX - hw - 4, y: y0 - 4, w: 2 * hw + 12, h: y1 - y0 + 12 }, (c) => { red(c, body); holes(c, cut); }, { t: 3.2 + k * 0.3, d: 0.7, reveal: 'rise' });
  });
  const stair = shape((P) => { for (let y = 816; y < 958; y += 7) P.rect(CX - 26, y, 52, 3); });
  p.group('tcut', { x: CX - 32, y: 810, w: 64, h: 154 }, (c) => holes(c, stair), { t: 4.2, d: 0.8, reveal: 'fall' });

  // the round hall: its drum of lattice doors, three blue roofs (red here), the gilt top
  const hall = shape((P) => {
    P.rect(CX - 152, 692, 304, 118);
    roofTier(P, CX, 644, 700, 214, 140, 12);
    P.rect(CX - 128, 604, 256, 42);
    roofTier(P, CX, 552, 608, 172, 104, 10);
    P.rect(CX - 92, 516, 184, 38);
    // the top roof rises to a point
    P.moveTo(CX - 134, 520); P.lineTo(CX - 120, 510); P.quadraticCurveTo(CX - 60, 488, CX - 24, 444); P.lineTo(CX - 10, 422);
    P.lineTo(CX + 10, 422); P.lineTo(CX + 24, 444); P.quadraticCurveTo(CX + 60, 488, CX + 120, 510); P.lineTo(CX + 134, 520); P.closePath();
    P.rect(CX - 8, 404, 16, 20); P.moveTo(CX + 16, 392); P.arc(CX, 392, 16, 0, Math.PI * 2); P.rect(CX - 3, 360, 6, 18); P.moveTo(CX + 7, 370); P.arc(CX, 370, 7, 0, Math.PI * 2);
  });
  p.group('temple', { x: CX - 240, y: 350, w: 480, h: 462 }, (c) => red(c, hall), { t: 4.0, d: 1.6, reveal: 'rise', ease: 'soft' });
  // the cuts: door lattices in the drum, tile lines on each roof, the bracket rows, the plaque
  const lat = shape((P) => {
    for (let i = 0; i < 10; i++) {
      const x = CX - 146 + i * 29.6;
      for (let row = 0; row < 6; row++) for (let col = 0; col < 3; col++) P.rect(x + 4 + col * 7.2, 712 + row * 12, 5, 8);
      P.rect(x + 3, 790, 22, 10);
    }
  });
  const tiles = shape((P) => {
    for (const [y0, y1, a, b] of [[644, 700, 214, 140], [552, 608, 172, 104]]) {
      const n = Math.round(a / 9);
      for (let i = -n + 1; i < n; i++) { const t = i / n; P.moveTo(CX + t * b, y0 + 6); P.lineTo(CX + t * a * 0.98, y1 - 8); }
    }
    for (let i = -10; i <= 10; i++) { const t = i / 11; P.moveTo(CX + t * 18, 432); P.lineTo(CX + t * 118, 510); }
  });
  const brackets = shape((P) => {
    for (const [y, hw] of [[612, 124], [524, 88]]) {
      for (let x = CX - hw + 6; x < CX + hw - 10; x += 12) { P.rect(x, y, 7, 6); P.rect(x + 3, y + 10, 4, 6); }
      P.rect(CX - hw + 6, y + 22, 2 * hw - 12, 3);
    }
    // the name board under the top roof, on its frame
    P.rect(CX - 14, 556 - 46, 28, 30);
  });
  p.group('tcut', { x: CX - 160, y: 700, w: 320, h: 110 }, (c) => holes(c, lat), { t: 5.4, d: 0.9, reveal: 'wipe' });
  p.group('tcut', { x: CX - 230, y: 420, w: 460, h: 290 }, (c) => slits(c, tiles, 2.6), { t: 5.8, d: 1.0, reveal: 'fall' });
  p.group('tcut', { x: CX - 130, y: 500, w: 260, h: 150 }, (c) => holes(c, brackets), { t: 6.4, d: 0.6, reveal: 'fade' });
  // a red board with a cut border in the hole: the plaque
  p.group('tcut', { x: CX - 12, y: 512, w: 24, h: 26 }, (c) => { c.fillStyle = RED; c.fillRect(CX - 9, 514, 18, 22); c.fillStyle = PAPER; c.fillRect(CX - 5, 518, 10, 14); c.fillStyle = RED; c.fillRect(CX - 2, 520, 4, 10); }, { t: 6.8, d: 0.4, reveal: 'pop' });
}

// ================================================================ the moat and the bridges
function moat(p, r) {
  const strip = shape((P) => P.rect(IX0, GROUND, IX1 - IX0, IY1 - GROUND));
  const box = { x: IX0 - 4, y: GROUND - 6, w: IX1 - IX0 + 12, h: IY1 - GROUND + 14 };
  p.group('city', box, (c) => red(c, strip), { t: 6.6, d: 0.9, reveal: 'rise' });
  // the water: rows of scalloped waves cut as slits, a sawtooth line under the bank
  const waves = shape((P) => {
    let row = 0;
    for (let y = GROUND + 34; y < IY1 - 8; y += 16, row++) {
      for (let x = IX0 + 6 + (row % 2) * 14; x < IX1 - 30; x += 28) { P.moveTo(x, y); P.arc(x + 14, y, 14, Math.PI, Math.PI * 2); }
    }
  });
  const bank = shape((P) => teeth(P, IX0 + 4, GROUND + 8, IX1 - 4, GROUND + 8, 10, 1));
  p.group('ccut', box, (c) => holes(c, bank), { t: 7.2, d: 0.8, reveal: 'wipe' });
  p.group('ccut', box, (c) => slits(c, waves, 3), { t: 7.4, d: 1.4, reveal: 'wipe', ease: 'inOut' });
  // five marble bridges over the inner stream before the gate
  const br = shape((P) => {
    P.rect(560, 1370, 480, 30);
    P.rect(560, 1356, 480, 8);
    for (let x = 564; x < 1040; x += 16) P.rect(x, 1346, 5, 12);
  });
  const brH = shape((P) => { for (const x of [640, 720, 800, 880, 960]) { P.moveTo(x - 26, 1400); P.arc(x, 1400, 26, Math.PI, 0); P.closePath(); } });
  p.group('city', { x: 552, y: 1340, w: 500, h: 66 }, (c) => { red(c, br); holes(c, brH); }, { t: 7.0, d: 0.8, reveal: 'rise' });
}

// ================================================================ the Forbidden City's gate
// a hip roof with upturned corners, a ridge and its two end beasts
function hipRoof(P, x, y0, y1, a, b, lift = 12) {
  P.moveTo(x - b, y0); P.lineTo(x + b, y0);
  P.quadraticCurveTo(x + b + (a - b) * 0.6, y1 - 6, x + a + 10, y1 - lift);
  P.lineTo(x + a - 4, y1); P.lineTo(x - a + 4, y1); P.lineTo(x - a - 10, y1 - lift);
  P.quadraticCurveTo(x - b - (a - b) * 0.6, y1 - 6, x - b, y0); P.closePath();
  // the ridge beasts at each end, curling up
  for (const s of [-1, 1]) { P.moveTo(x + s * b, y0 + 2); P.lineTo(x + s * (b - 4), y0 - 14); P.quadraticCurveTo(x + s * (b + 10), y0 - 18, x + s * (b + 8), y0 - 4); P.closePath(); }
}
function roofCuts(P, x, y0, y1, a, b, step = 9) {
  const n = Math.round(a / step);
  for (let i = -n + 1; i < n; i++) { const t = i / n; P.moveTo(x + t * b, y0 + 5); P.lineTo(x + t * (a - 6), y1 - 6); }
}
function gate(p, r) {
  // the great wall of the gate with three arched passages; the wings with their pavilions
  const wall = shape((P) => {
    P.rect(560, 1180, 480, 180);
    P.rect(380, 1244, 184, 116); P.rect(1036, 1244, 184, 116);
    for (let x = 384; x < 560; x += 16) P.rect(x, 1236, 9, 9);
    for (let x = 1040; x < 1216; x += 16) P.rect(x, 1236, 9, 9);
  });
  p.group('city', { x: 374, y: 1226, w: 852, h: 140 }, (c) => red(c, wall), { t: 7.2, d: 1.0, reveal: 'rise' });
  const wallC = shape((P) => {
    for (const [x, w, h] of [[800, 62, 96], [690, 44, 72], [910, 44, 72]]) { P.moveTo(x - w / 2, 1360); P.lineTo(x - w / 2, 1360 - h + w / 2); P.arc(x, 1360 - h + w / 2, w / 2, Math.PI, 0); P.lineTo(x + w / 2, 1360); P.closePath(); }
    teeth(P, 566, 1196, 1034, 1196, 11, 1);
    for (const [x0, x1] of [[384, 560], [1040, 1216]]) teeth(P, x0, 1258, x1, 1258, 11, 1);
    // courses of brick, as short dashes
    for (let row = 0; row < 6; row++) {
      const y = 1220 + row * 22;
      for (let x = 572 + (row % 2) * 18; x < 1030; x += 36) { if (Math.abs(x - 800) < 46 || Math.abs(x - 690) < 34 || Math.abs(x - 910) < 34) continue; P.rect(x, y, 22, 3); }
    }
    for (const x0 of [394, 1050]) for (let row = 0; row < 4; row++) for (let x = x0 + (row % 2) * 14; x < x0 + 160; x += 28) P.rect(x, 1280 + row * 20, 18, 3);
  });
  p.group('ccut', { x: 374, y: 1180, w: 852, h: 184 }, (c) => holes(c, wallC), { t: 8.2, d: 1.0, reveal: 'wipe' });

  // the hall on top: a terrace with balusters, nine bays, two roofs
  const hall = shape((P) => {
    P.rect(612, 1164, 376, 16);
    P.rect(642, 1100, 316, 66);
    hipRoof(P, 800, 1064, 1108, 206, 150, 14);
    P.rect(668, 1060, 264, 8);
    hipRoof(P, 800, 1018, 1064, 172, 98, 14);
    P.rect(700, SKY1 - 4, 200, 20); // the ridge meets the sky above: one sheet
  });
  p.group('city', { x: 570, y: SKY1 - 8, w: 460, h: 176 }, (c) => red(c, hall), { t: 7.8, d: 0.8, reveal: 'drop', dy: 30 });
  const hallC = shape((P) => {
    for (let i = 0; i < 9; i++) { const x = 650 + i * 34.4; P.rect(x + 4, 1110, 24, 14); for (let k = 0; k < 5; k++) P.rect(x + 5 + k * 4.6, 1130, 2.6, 28); }
    for (let x = 616; x < 984; x += 12) P.rect(x, 1167, 5, 9);
    roofCuts(P, 800, 1064, 1108, 206, 150);
    roofCuts(P, 800, 1018, 1064, 172, 98);
  });
  p.group('ccut', { x: 570, y: 1016, w: 460, h: 168 }, (c) => holes(c, hallC), { t: 8.6, d: 0.8, reveal: 'fall' });
  // the two pavilions on the wings
  for (const [x, tt] of [[472, 8.0], [1128, 8.2]]) {
    const pav = shape((P) => { P.rect(x - 56, 1196, 112, 42); hipRoof(P, x, 1170, 1200, 78, 48, 10); P.rect(x - 40, 1164, 80, 8); hipRoof(P, x, 1138, 1166, 60, 26, 9); });
    p.group('city', { x: x - 96, y: 1112, w: 192, h: 130 }, (c) => red(c, pav), { t: tt, d: 0.7, reveal: 'rise' });
    const pavC = shape((P) => { for (let i = 0; i < 5; i++) P.rect(x - 50 + i * 21, 1206, 14, 24); roofCuts(P, x, 1170, 1200, 78, 48, 8); roofCuts(P, x, 1138, 1166, 60, 26, 8); });
    p.group('ccut', { x: x - 96, y: 1130, w: 192, h: 110 }, (c) => holes(c, pavC), { t: tt + 0.8, d: 0.6, reveal: 'fade' });
  }
}

// ================================================================ the corner tower, on its wall over the moat
function cornerTower(p) {
  const x = 266;
  const tw = shape((P) => {
    P.rect(IX0, 1300, 212, 100); // the wall's corner
    for (let k = 0; k < 13; k++) P.rect(IX0 + 2 + k * 16, 1290, 9, 11);
    P.rect(x - 70, 1246, 140, 56);
    hipRoof(P, x, 1214, 1250, 116, 84, 12);
    // the middle story: three gables facing out under a skirt roof
    P.rect(x - 64, 1186, 128, 30);
    for (const dx of [-62, 0, 62]) { P.moveTo(x + dx - 30, 1190); P.lineTo(x + dx, 1158); P.lineTo(x + dx + 30, 1190); P.closePath(); }
    hipRoof(P, x, 1176, 1196, 96, 72, 10);
    // the top: a crossed roof, gables to the front and sides, a gilt ball
    P.rect(x - 44, 1130, 88, 30);
    hipRoof(P, x, 1102, 1134, 72, 30, 12);
    P.moveTo(x - 24, 1110); P.lineTo(x, 1078); P.lineTo(x + 24, 1110); P.closePath();
    P.moveTo(x + 8, 1070); P.arc(x, 1070, 8, 0, Math.PI * 2);
  });
  p.group('city', { x: IX0 - 4, y: 1056, w: 240, h: 350 }, (c) => red(c, tw), { t: 7.4, d: 1.2, reveal: 'rise' });
  const twC = shape((P) => {
    for (let row = 0; row < 4; row++) for (let x0 = IX0 + 8 + (row % 2) * 14; x0 < IX0 + 200; x0 += 28) P.rect(x0, 1318 + row * 20, 18, 3);
    for (let i = 0; i < 5; i++) P.rect(x - 62 + i * 25.6, 1256, 16, 38);
    for (const dx of [-62, 0, 62]) { P.moveTo(x + dx - 14, 1186); P.lineTo(x + dx, 1170); P.lineTo(x + dx + 14, 1186); P.closePath(); }
    for (let i = 0; i < 4; i++) P.rect(x - 36 + i * 20, 1138, 12, 18);
    roofCuts(P, x, 1214, 1250, 116, 84, 8);
    P.moveTo(x - 10, 1104); P.lineTo(x, 1092); P.lineTo(x + 10, 1104); P.closePath();
  });
  p.group('ccut', { x: IX0, y: 1080, w: 240, h: 320 }, (c) => holes(c, twC), { t: 8.4, d: 0.8, reveal: 'fall' });
}

// ================================================================ the White Dagoba of Beihai on its island
function dagoba(p, r) {
  const x = 1338;
  const hill = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; hill.push([lerp(1220, IX1, t), GROUND - Math.sin(t * Math.PI) ** 0.7 * 92 + (i % 3) * 2]); }
  const dg = shape((P) => {
    polyTo(P, [[1220, GROUND + 2], ...hill, [IX1, GROUND + 2]]);
    // the square base in two steps, the bulb, the neck and its rings, the canopy and the top
    P.rect(x - 58, 1286, 116, 24); P.rect(x - 46, 1266, 92, 22);
    P.moveTo(x - 46, 1268); P.bezierCurveTo(x - 64, 1222, x - 40, 1176, x, 1174); P.bezierCurveTo(x + 40, 1176, x + 64, 1222, x + 46, 1268); P.closePath();
    P.rect(x - 22, 1162, 44, 14);
    P.moveTo(x - 20, 1164); P.lineTo(x - 9, 1078); P.lineTo(x + 9, 1078); P.lineTo(x + 20, 1164); P.closePath();
    P.moveTo(x - 30, 1078); P.quadraticCurveTo(x, 1064, x + 30, 1078); P.lineTo(x + 26, 1084); P.lineTo(x - 26, 1084); P.closePath();
    P.rect(x - 3, 1046, 6, 22); P.moveTo(x + 7, 1046); P.arc(x, 1046, 7, 0, Math.PI * 2);
  });
  p.group('city', { x: 1214, y: 1030, w: IX1 - 1210, h: GROUND - 1020 }, (c) => red(c, dg), { t: 7.6, d: 1.2, reveal: 'rise' });
  const dgC = shape((P) => {
    // the niche on the bulb, the rings of the spire, the base's panels, the hill's trees
    P.moveTo(x - 14, 1252); P.lineTo(x - 14, 1232); P.arc(x, 1232, 14, Math.PI, 0); P.lineTo(x + 14, 1252); P.closePath();
    for (let k = 0; k < 11; k++) { const y = 1086 + k * 7; const hw = lerp(9, 18, k / 11); P.rect(x - hw + 2, y, 2 * hw - 4, 2.4); }
    for (let i = 0; i < 5; i++) P.rect(x - 52 + i * 22, 1292, 14, 12);
    for (let i = 0; i < 4; i++) P.rect(x - 40 + i * 22, 1272, 14, 10);
    for (let k = 0; k < 16; k++) { const tx = 1236 + ((k * 61) % 190), ty = GROUND - 14 - ((k * 37) % 4) * 14; if (Math.abs(tx - x) < 66 && ty < GROUND - 8) continue; crescent(P, tx, ty, 8, Math.PI * 0.5); }
  });
  p.group('ccut', { x: 1214, y: 1060, w: IX1 - 1210, h: GROUND - 1050 }, (c) => holes(c, dgC), { t: 8.8, d: 0.8, reveal: 'fade' });
  // a red mark left in the niche
  p.group('ccut', { x: x - 8, y: 1236, w: 16, h: 16 }, (c) => { c.fillStyle = RED; c.beginPath(); c.arc(x, 1242, 5, 0, Math.PI * 2); c.fill(); }, { t: 9.4, d: 0.4, reveal: 'pop' });
}

// ================================================================ lanterns, pigeons, a swallow kite
function life(p, r) {
  // two lanterns hanging from the gate's eaves, swinging a little
  for (const [x, y, ph, tt] of [[606, 1098, 0, 9.6], [994, 1098, 1.7, 9.8]]) {
    p.live('lanterns', {
      t: tt, d: 0.8, reveal: 'drop', dy: 20, box: { x: x - 40, y: y - 6, w: 80, h: 130 },
      draw: (c, time) => {
        const a = Math.sin(time * 1.1 + ph) * 0.07;
        c.save(); c.translate(x, y); c.rotate(a);
        c.strokeStyle = RED_D; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 18); c.stroke();
        c.fillStyle = SHADOW; c.beginPath(); c.ellipse(4, 50, 24, 28, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = RED; c.fillRect(-12, 18, 24, 6); c.fillRect(-12, 76, 24, 6);
        c.beginPath(); c.ellipse(0, 48, 24, 28, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = PAPER; c.lineWidth = 1.6; c.beginPath();
        for (const k of [-0.6, 0, 0.6]) { c.moveTo(k * 24, 22); c.quadraticCurveTo(k * 34, 48, k * 24, 74); }
        c.stroke();
        c.fillStyle = PAPER; c.beginPath(); c.arc(0, 48, 7, 0, Math.PI * 2); c.fill();
        c.fillStyle = RED; c.beginPath(); c.arc(0, 48, 3, 0, Math.PI * 2); c.fill();
        // the tassel
        const sw = Math.sin(time * 1.6 + ph) * 3;
        c.strokeStyle = RED; c.lineWidth = 1.4; c.beginPath();
        for (let k = -3; k <= 3; k++) { c.moveTo(k * 1.4, 82); c.lineTo(k * 2 + sw, 110); }
        c.stroke();
        c.restore();
      },
    });
  }
  // pigeons wheeling over the roofs, a flock of red paper birds
  const flock = [];
  const rr = rng(9);
  for (let i = 0; i < 9; i++) flock.push([rr.range(0, Math.PI * 2), rr.range(-26, 26), rr.range(-16, 16), rr.range(0.75, 1.1)]);
  p.live('pigeons', {
    t: 9.2, d: 1.2, reveal: 'fade', box: { x: IX0, y: SKY1, w: IX1 - IX0, h: 200 },
    draw: (c, time) => {
      const a = time * 0.32;
      const fx = 800 + Math.cos(a) * 470, fy = 1090 + Math.sin(a * 2) * 34, dir = -Math.sin(a) > 0 ? 1 : -1;
      c.fillStyle = RED;
      for (const [ph, dx, dy, s] of flock) {
        const x = fx + dx * 2.2 + Math.cos(ph + time) * 6, y = fy + dy * 1.6 + Math.sin(ph + time * 1.3) * 4;
        if (x > 600 && x < 1000 && y > 1040) continue;
        const f = Math.sin(time * 10 + ph);
        c.save(); c.translate(x, y); c.scale(s * dir, s);
        c.beginPath(); c.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(8, -2, 3.2, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.moveTo(-7, -1); c.lineTo(-15, -4); c.lineTo(-15, 4); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(3, -1); c.quadraticCurveTo(-2, -10 * f - 2, -10, -14 * f); c.lineTo(-3, 0); c.closePath(); c.fill();
        c.restore();
      }
    },
  });
  // a swallow kite flying in the round window, its string trailing down
  const kx = 590, ky = 360;
  p.live('kite', {
    t: 10.0, d: 1.0, reveal: 'fade', box: { x: kx - 70, y: ky - 70, w: 240, h: 500 },
    draw: (c, time) => {
      const x = kx + Math.sin(time * 0.7) * 10, y = ky + Math.sin(time * 1.1) * 7, a = Math.sin(time * 0.9) * 0.08;
      c.save(); c.beginPath(); c.arc(CX, CY, CR - 2, 0, Math.PI * 2); c.clip();
      c.strokeStyle = RED_D; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y + 16); c.quadraticCurveTo(x - 30, y + 200, x - 120, y + 400); c.stroke();
      c.translate(x, y); c.rotate(a);
      c.fillStyle = SHADOW; c.save(); c.translate(3, 4);
      kite(c); c.fill(); c.restore();
      c.fillStyle = RED; kite(c); c.fill();
      c.fillStyle = PAPER; c.beginPath();
      c.arc(0, -16, 4, 0, Math.PI * 2);
      for (const s of [-1, 1]) { crescentC(c, s * 26, 2, 7); crescentC(c, s * 42, 6, 6); }
      c.fill();
      c.restore();
    },
  });
}
function kite(c) {
  // a swallow kite: round head, wide swept wings, a forked tail
  c.beginPath();
  c.moveTo(0, -30); c.quadraticCurveTo(14, -30, 12, -14); c.lineTo(60, -6); c.quadraticCurveTo(66, 10, 48, 16); c.lineTo(12, 10);
  c.lineTo(16, 46); c.lineTo(4, 30); c.lineTo(0, 36); c.lineTo(-4, 30); c.lineTo(-16, 46); c.lineTo(-12, 10);
  c.lineTo(-48, 16); c.quadraticCurveTo(-66, 10, -60, -6); c.lineTo(-12, -14); c.quadraticCurveTo(-14, -30, 0, -30); c.closePath();
}
function crescentC(c, x, y, rad) { c.moveTo(x + rad, y); c.arc(x, y, rad, 0, Math.PI); c.quadraticCurveTo(x, y + rad * 0.4, x + rad, y); }

// ================================================================ the title, brushed in ink, and a seal
function title(p) {
  p.type('title', '北京', 640, 1880, { family: F, size: 300, color: INK, align: 'center', t: 11.0, gap: 0.6, d: 1.0, reveal: 'fade', ease: 'soft' });
  // the seal: carved so the characters are paper and the ground red
  const sx = 1040, sy = 1640;
  p.group('title', { x: sx - 6, y: sy - 6, w: 120, h: 120 }, (c) => {
    c.fillStyle = RED; c.beginPath(); c.roundRect(sx, sy, 104, 104, 6); c.fill();
    c.strokeStyle = PAPER; c.lineWidth = 3; c.beginPath(); c.roundRect(sx + 7, sy + 7, 90, 90, 3); c.stroke();
    c.fillStyle = PAPER; c.font = `400 40px ${F}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText('北', sx + 52, sy + 48); c.fillText('京', sx + 52, sy + 90);
  }, { t: 12.4, d: 0.5, reveal: 'press' });
  p.type('title', 'BEIJING', 1040, 1822, { family: F, size: 50, color: RED, align: 'left', track: 0.14, t: 12.6, gap: 0.07, d: 0.5, reveal: 'fade' });
  p.type('title', '天坛·午门·角楼·白塔·长城', 1040, 1876, { family: F, size: 28, color: INK, align: 'left', track: 0.08, t: 12.9, gap: 0.04, d: 0.4, reveal: 'fade' });
}
