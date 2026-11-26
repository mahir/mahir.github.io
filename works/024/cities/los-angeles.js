// Los Angeles: a painting in flat, sunlit acrylic on raw canvas. A stone
// terrace with a pool turned at an angle, its water netted with light; two
// striped loungers under a pink umbrella, agaves in terracotta pots, and a white
// wall heaped with bougainvillea, two tall palms behind it. Beyond the hedge, a
// row of palms; the hills to the left in patched fields of color, Mulholland
// winding over them, houses and their small blue pools, the Griffith
// Observatory on its shoulder; to the right the flat grid of the basin running
// to the towers of downtown and the lilac San Gabriels. The name below, in
// Pacifico, on the bare canvas.

import { Plate, W, H } from '../print.js';
import { mix, lerp, poly, rng } from '../kit.js';

const CANVAS = '#eee6d6', INK = '#23272e';
const SKY = '#82c3e8', SKY_L = '#c3e3f1', MOUNT = '#a698c9', MOUNT_L = '#c4b9de', MOUNT_D = '#8a7cb3';
const HILL = '#5f9c54', HILL_L = '#93bf62', HILL_D = '#3f7a43', OCHRE = '#e2aa3f', LILAC = '#b48ccb', PINK = '#f2a2b3', ORANGE = '#ef7c3c', RED = '#d84a39';
const WHITE = '#fbf8f1';
const POOL = '#35abdb', POOL_D = '#1f7dbd', POOL_L = '#9adbf2';
const DECK = '#edd9c3', DECK_D = '#d9bfa4', GLASS_D = '#4f84a6';
const HEDGE = '#2f7b46', HEDGE_L = '#4f9a58', PALM = '#24603c', PALM_L = '#3f8550', TRUNK = '#8d6c52', TRUNK_D = '#6a4e3b', SKIRT = '#a8865a';
const HAZE = '#b3bfd0', HAZE_L = '#d3dbe5', HAZE_D = '#94a2b8';
const BLOCKS = ['#e9c27a', '#f0b3a0', '#cfd58a', '#e8d3a8', '#d9b3d6', '#b9d38f', '#f2d28e', '#e6a77f'];

export const city = {
  id: 'los-angeles', name: 'Los Angeles', wall: '#173848',
  alt: 'A painting in flat bright color on raw canvas: a stone terrace with a swimming pool seen at an angle, its water netted with light, two striped loungers under a pink umbrella, agaves in terracotta pots and bougainvillea over a white wall with two tall palms behind it, a row of palms along a hedge, the Hollywood Hills in patched fields with Mulholland Drive winding over them and the Griffith Observatory on a shoulder, the grid of the basin running to the downtown towers and the San Gabriel Mountains, and the name Los Angeles in a looping script',
  google: 'family=Pacifico',
  fonts: [['400 200px "Pacifico"', 'Los Angeles'], ['400 54px "Pacifico"', 'California']],
  build,
};

const FONT = '"Pacifico", cursive';
// the painted part of the canvas; the rest is left bare
const X0 = 100, X1 = 1500, Y0 = 100, Y1 = 1540;
const HZ = 768; // where the basin meets the mountains
const TERR = 1110; // where the terrace meets the wall and the hedge

function build() {
  const p = new Plate({ paper: CANVAS, seed: 1964 });
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'far', 'basin', 'hills', 'palms', 'garden', 'terrace', 'pool', 'water', 'deck', 'title', 'air');
  p.layer('title', { clip: false });

  sky(p);
  mountains(p);
  basin(p);
  downtown(p);
  hills(p);
  observatory(p);
  palmRow(p);
  hedge(p);
  gardenWall(p);
  terrace(p);
  pool(p);
  furniture(p);
  title(p);
  life(p);
  return p;
}

// ================================================================ the sky and the mountains
function sky(p) {
  // flat blue, laid on with a roller: two bands and faint streaks where it overlapped
  const rr = rng(5), streaks = [];
  for (let i = 0; i < 46; i++) streaks.push([rr.range(X0, X1 - 200), rr.range(Y0, HZ), rr.range(160, 520), rr.range(2, 6), rr.chance(0.5)]);
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: HZ - Y0 + 20 }, (c) => {
    c.fillStyle = SKY; c.fillRect(X0, Y0, X1 - X0, HZ - Y0 + 20);
    const g = c.createLinearGradient(0, 420, 0, HZ);
    g.addColorStop(0, 'rgba(195,227,241,0)'); g.addColorStop(1, SKY_L);
    c.fillStyle = g; c.fillRect(X0, 420, X1 - X0, HZ - 400);
    for (const [x, y, w, h, light] of streaks) { c.fillStyle = light ? 'rgba(255,255,255,.07)' : 'rgba(40,90,140,.05)'; c.fillRect(x, y, w, h); }
  }, { t: 0.2, d: 1.5, reveal: 'fall', ease: 'inOut' });
}
function ridge(rr, x0, x1, y, amp, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([lerp(x0, x1, t), y - amp * (0.55 + 0.45 * Math.sin(t * 7.3 + 1.2) * Math.sin(t * 2.1 + 0.4)) + rr.range(-8, 8)]);
  }
  return pts;
}
function mountains(p) {
  const rr = rng(9);
  const far = ridge(rr, X0 - 20, X1 + 20, HZ - 20, 190, 40);
  const near = ridge(rr, X0 - 20, X1 + 20, HZ, 62, 34);
  [[far, MOUNT_L, 1.0], [near, MOUNT, 1.3]].forEach(([pts, col, t], i) => {
    const shape = pts.concat([[X1 + 20, HZ + 30], [X0 - 20, HZ + 30]]);
    p.group('far', { x: X0, y: HZ - 260, w: X1 - X0, h: 300 }, (c) => {
      c.fillStyle = col; poly(c, shape); c.fill();
      // the shaded flanks, flat
      c.fillStyle = i ? MOUNT_D : MOUNT;
      for (let k = 0; k < pts.length - 1; k++) if (pts[k + 1][1] > pts[k][1] + 3) { poly(c, [pts[k], pts[k + 1], [pts[k + 1][0] - 10, HZ + 30], [pts[k][0] - 30, HZ + 30]]); c.fill(); }
    }, { t, d: 0.9, reveal: 'rise' });
  });
}

// ================================================================ the basin
// the grid of the flats: streets running to a point on the horizon, blocks of color
const VP = [1060, HZ - 60];
function basin(p) {
  const yTop = HZ - 2, yBot = 1060, xs = [], ys = [];
  for (let k = 0; k <= 13; k++) ys.push(lerp(yTop, yBot, (k / 13) ** 1.7));
  for (let j = -16; j <= 16; j++) xs.push(1060 + j * 74);
  // where a street at the foot x meets a given y
  const at = (xf, y) => VP[0] + (xf - VP[0]) * (y - VP[1]) / (yBot - VP[1]);
  const rr = rng(33), blocks = [];
  for (let k = 0; k < ys.length - 1; k++) {
    for (let j = 0; j < xs.length - 1; j++) {
      const ya = ys[k] + 1.2, yb = ys[k + 1] - 1.2;
      const q = [[at(xs[j], ya) + 1.4, ya], [at(xs[j + 1], ya) - 1.4, ya], [at(xs[j + 1], yb) - 1.4, yb], [at(xs[j], yb) + 1.4, yb]];
      if (q[1][0] < 560 || q[0][0] > X1 + 20) continue;
      const s = (yb - VP[1]) / (yBot - VP[1]);
      // a few houses, trees and pools in each block, fixed now
      const bits = [];
      const nb = Math.round(3 + s * 6);
      for (let i = 0; i < nb; i++) {
        const u = rr(), v = rr();
        const x = lerp(lerp(q[0][0], q[1][0], u), lerp(q[3][0], q[2][0], u), v), y = lerp(ya, yb, v);
        bits.push([x, y, rr.int(0, 3), s]);
      }
      blocks.push({ q, col: rr.pick(BLOCKS), k, bits, s });
    }
  }
  // the streets first, as a pale ground
  p.group('basin', { x: 560, y: yTop - 4, w: X1 - 540, h: yBot - yTop + 8 }, (c) => {
    c.fillStyle = '#efe3cc'; c.fillRect(560, yTop, X1 - 540, yBot - yTop);
  }, { t: 1.7, d: 0.6, reveal: 'fade' });
  // then the blocks, row by row from the horizon toward us
  for (let k = 0; k < ys.length - 1; k += 2) {
    const mine = blocks.filter((b) => b.k === k || b.k === k + 1);
    p.group('basin', { x: 540, y: ys[k] - 10, w: X1 - 520, h: ys[Math.min(ys.length - 1, k + 2)] - ys[k] + 20 }, (c) => {
      for (const b of mine) { c.fillStyle = b.col; poly(c, b.q); c.fill(); }
      // the little things in them: white and pink houses, dark trees, blue pools
      for (const b of mine) {
        for (const [x, y, kind, s] of b.bits) {
          const z = 1 + s * 7;
          if (kind === 0) { c.fillStyle = HILL_D; c.beginPath(); c.arc(x, y, z * 0.55, 0, Math.PI * 2); c.fill(); }
          else if (kind === 1) { c.fillStyle = WHITE; c.fillRect(x - z * 0.7, y - z * 0.45, z * 1.4, z * 0.7); c.fillStyle = 'rgba(35,39,46,.35)'; c.fillRect(x - z * 0.7, y + z * 0.18, z * 1.4, z * 0.12); }
          else if (kind === 2) { c.fillStyle = POOL; c.fillRect(x - z * 0.45, y - z * 0.2, z * 0.9, z * 0.42); }
          else { c.fillStyle = PINK; c.fillRect(x - z * 0.5, y - z * 0.4, z, z * 0.6); }
        }
      }
    }, { t: 2.2 + k * 0.16, d: 0.7, reveal: 'fade' });
  }
  // the boulevards: palms along two of them, as dots on sticks
  const blvd = [];
  for (const xf of [xs[18], xs[22]]) {
    for (let k = 3; k < ys.length - 1; k++) {
      const y = ys[k], s = (y - VP[1]) / (yBot - VP[1]), x = at(xf, y) + 4;
      blvd.push([x, y, s]);
    }
  }
  p.group('basin', { x: 900, y: yTop, w: 600, h: yBot - yTop }, (c) => {
    for (const [x, y, s] of blvd) {
      const h = 6 + s * 40;
      c.strokeStyle = TRUNK; c.lineWidth = 0.6 + s * 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke();
      c.fillStyle = PALM; c.beginPath(); c.arc(x, y - h, 1.4 + s * 5, 0, Math.PI * 2); c.fill();
    }
  }, { t: 3.6, d: 0.6, reveal: 'rise' });
  // a haze over the far rows
  p.group('basin', { x: 540, y: HZ - 40, w: X1 - 520, h: 70 }, (c) => {
    const g = c.createLinearGradient(0, HZ - 10, 0, HZ + 40);
    g.addColorStop(0, 'rgba(211,219,229,.85)'); g.addColorStop(1, 'rgba(211,219,229,0)');
    c.fillStyle = g; c.fillRect(540, HZ - 10, X1 - 520, 50);
  }, { t: 3.8, d: 0.6, reveal: 'fade' });
}
// downtown in the haze: the round tower with its stepped crown, a sail-topped one, the rest
function downtown(p) {
  const base = HZ + 14;
  const towers = [
    [1150, 18, 690, 'flat'], [1172, 22, 660, 'bevel'], [1198, 22, 640, 'bevel'], [1262, 24, 680, 'flat'], [1318, 20, 700, 'flat'],
    [1236, 30, 590, 'round'], [1292, 30, 598, 'sail'], [1340, 16, 720, 'flat'], [1126, 14, 712, 'flat'],
  ];
  towers.sort((a, b) => a[2] - b[2]);
  towers.forEach(([x, hw, top, kind], i) => {
    p.group('basin', { x: x - hw - 6, y: top - 40, w: 2 * hw + 12, h: base - top + 44 }, (c) => {
      const lit = HAZE_L, dk = HAZE;
      if (kind === 'round') {
        // the round tower: setbacks up to a ring of glass at the crown
        for (const [y0, y1, w] of [[base, top + 60, hw], [top + 60, top + 26, hw * 0.86], [top + 26, top + 6, hw * 0.72]]) {
          c.fillStyle = dk; c.fillRect(x - w, y1, 2 * w, y0 - y1);
          c.fillStyle = lit; c.fillRect(x - w, y1, w * 0.8, y0 - y1);
        }
        c.fillStyle = HAZE_D; c.fillRect(x - hw * 0.72, top, hw * 1.44, 8);
        c.fillStyle = WHITE; c.fillRect(x - hw * 0.6, top + 8, hw * 1.2, 4);
      } else if (kind === 'sail') {
        c.fillStyle = dk; poly(c, [[x - hw, base], [x + hw, base], [x + hw, top + 30], [x - hw, top]]); c.fill();
        c.fillStyle = lit; poly(c, [[x - hw, base], [x, base], [x, top + 15], [x - hw, top]]); c.fill();
        c.strokeStyle = HAZE_D; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - hw + 2, top); c.lineTo(x - hw + 2, top - 30); c.stroke();
      } else {
        c.fillStyle = dk; c.fillRect(x - hw, top, 2 * hw, base - top);
        c.fillStyle = lit; c.fillRect(x - hw, top, hw * 0.9, base - top);
        if (kind === 'bevel') { c.fillStyle = HAZE_D; poly(c, [[x - hw, top], [x - hw + 6, top - 10], [x + hw - 6, top - 10], [x + hw, top]]); c.fill(); }
      }
      // the floors, faint
      c.fillStyle = 'rgba(120,135,160,.35)';
      for (let y = top + 10; y < base; y += 6) c.fillRect(x - hw, y, 2 * hw, 1);
    }, { t: 2.8 + i * 0.1, d: 0.8, reveal: 'rise' });
  });
}

// ================================================================ the hills
// the ridge of the Hollywood Hills, from the left edge down to the flats
const RIDGE = [[X0 - 30, 396], [180, 368], [300, 344], [400, 372], [470, 444], [560, 516], [660, 540], [760, 624], [880, 726], [980, 826], [1060, 920], [1110, 1060]];
const BACK = [[X0 - 30, 318], [200, 300], [330, 326], [450, 380], [600, 462], [740, 560], [860, 670], [1000, 810]];
function ridgeY(x, pts = RIDGE) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
  return pts[pts.length - 1][1];
}
// a smooth closed outline through the ridge points
function hillPath(c, pts, foot) {
  c.beginPath(); c.moveTo(pts[0][0], foot);
  c.lineTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    c.quadraticCurveTo(ax, ay, (ax + bx) / 2, (ay + by) / 2);
  }
  const last = pts[pts.length - 1];
  c.lineTo(last[0], last[1]); c.lineTo(last[0], foot); c.closePath();
}
// Mulholland Drive's line over the hills
const ROAD = [];
for (let i = 0; i <= 120; i++) {
  const t = i / 120, x = lerp(X0 - 20, 1080, t);
  ROAD.push([x, ridgeY(x) + 70 + Math.sin(t * Math.PI * 5) * 46 + t * 90]);
}
function hills(p) {
  const foot = 1180;
  // the farther ridge, cooler
  p.group('hills', { x: X0, y: 280, w: 920, h: foot - 280 }, (c) => {
    hillPath(c, BACK, foot); c.fillStyle = '#8fb08f'; c.fill();
    c.save(); hillPath(c, BACK, foot); c.clip();
    c.fillStyle = '#7a9f86'; c.beginPath(); for (let k = 0; k < 9; k++) { const x = 160 + k * 90; c.moveTo(x, 300); c.quadraticCurveTo(x + 40, 460, x - 10, 700); c.lineTo(x + 30, 700); c.quadraticCurveTo(x + 70, 460, x + 30, 300); } c.fill();
    c.restore();
  }, { t: 3.2, d: 1.0, reveal: 'rise' });
  // the near hills in bands of color following the ridge, each with its own marks
  const bands = [[HILL, 'dots'], [OCHRE, 'rows'], [HILL_L, 'dots'], [LILAC, 'dash'], [HILL, 'rows'], [ORANGE, 'dots'], [HILL_D, 'dash'], [OCHRE, 'rows']];
  const rr = rng(71);
  const bandPts = (k) => RIDGE.map(([x, y]) => [x, y + k * 74 + (k ? Math.sin(x * 0.012 + k) * 18 : 0)]);
  const marks = bands.map(() => []);
  for (let k = 0; k < bands.length; k++) {
    const top = bandPts(k), bot = bandPts(k + 1);
    for (let i = 0; i < 150; i++) {
      const x = rr.range(X0, 1100), y0 = ridgeY(x, top), y1 = ridgeY(x, bot);
      if (y1 <= y0 + 4) continue;
      marks[k].push([x, rr.range(y0 + 4, y1 - 4), rr()]);
    }
  }
  p.group('hills', { x: X0, y: 330, w: 1040, h: foot - 330 }, (c) => {
    hillPath(c, RIDGE, foot); c.fillStyle = HILL; c.fill();
  }, { t: 3.6, d: 0.9, reveal: 'rise' });
  bands.forEach(([col, kind], k) => {
    p.group('hills', { x: X0, y: 330, w: 1040, h: foot - 330 }, (c) => {
      c.save(); hillPath(c, RIDGE, foot); c.clip();
      const top = bandPts(k), bot = bandPts(k + 1);
      c.beginPath(); c.moveTo(top[0][0], top[0][1]);
      for (const pt of top) c.lineTo(pt[0], pt[1]);
      c.lineTo(X1, top[top.length - 1][1]); c.lineTo(X1, bot[bot.length - 1][1]);
      for (const pt of [...bot].reverse()) c.lineTo(pt[0], pt[1]);
      c.closePath(); c.fillStyle = col; c.fill();
      // the marks: dots of trees, rows of vines, dashes of brush
      const ink = mix(col, '#1d3a2a', 0.45);
      c.fillStyle = ink; c.strokeStyle = ink; c.lineWidth = 2.2; c.lineCap = 'round';
      c.beginPath();
      for (const [x, y, v] of marks[k]) {
        if (kind === 'dots') { const rad = 3 + v * 4; c.moveTo(x + rad, y); c.arc(x, y, rad, 0, Math.PI * 2); }
      }
      c.fill();
      c.beginPath();
      for (const [x, y, v] of marks[k]) {
        if (kind === 'rows') { c.moveTo(x - 9, y); c.lineTo(x + 9, y - 3); }
        if (kind === 'dash') { c.moveTo(x, y); c.lineTo(x + 4 + v * 5, y - 10); }
      }
      c.stroke();
      c.restore();
    }, { t: 4.0 + k * 0.17, d: 0.7, reveal: k % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
  // houses on the slopes, white and pink, each with a small blue pool
  const homes = [];
  for (let i = 0; i < 46; i++) {
    const x = rr.range(X0 + 20, 1040), ry = ridgeY(x);
    const y = rr.range(ry + 30, Math.min(1080, ry + 360));
    homes.push([x, y, rr.int(0, 2), rr.chance(0.6), rr.chance(0.5) ? 1 : -1]);
  }
  homes.sort((a, b) => a[1] - b[1]);
  for (let i = 0; i < homes.length; i += 12) {
    const set = homes.slice(i, i + 12);
    p.group('hills', { x: X0, y: 330, w: 1040, h: foot - 330 }, (c) => {
      for (const [x, y, k, pool, dir] of set) {
        const col = [WHITE, PINK, '#f5dd8f'][k];
        c.fillStyle = col; c.fillRect(x - 13, y - 9, 26, 12);
        c.fillStyle = INK; c.fillRect(x - 15, y - 11, 30, 3);
        c.fillStyle = GLASS_D; c.fillRect(x - 8, y - 6, 9, 5);
        if (pool) { c.fillStyle = POOL; c.fillRect(x + dir * 22 - 8, y - 2, 16, 7); c.fillStyle = POOL_L; c.fillRect(x + dir * 22 - 6, y, 8, 1.6); }
        // a pencil cypress or a palm beside some
        c.fillStyle = HILL_D; c.beginPath(); c.ellipse(x - dir * 20, y - 10, 4, 12, 0, 0, Math.PI * 2); c.fill();
      }
    }, { t: 5.4 + i * 0.03, d: 0.6, reveal: 'pop' });
  }
  // Mulholland: a red road winding along the hills, a white line down it
  const road = ROAD;
  p.pen('hills', road, RED, 11, { t: 5.0, d: 1.6 });
  p.mark('hills', {
    t: 5.3, d: 1.6, reveal: 'draw', ease: 'inOut', box: { x: X0 - 30, y: 330, w: 1140, h: 820 },
    draw: (c, q) => {
      c.strokeStyle = WHITE; c.lineWidth = 1.6; c.setLineDash([7, 7]);
      const n = Math.max(2, Math.round(road.length * q));
      c.beginPath(); c.moveTo(road[0][0], road[0][1]); for (let i = 1; i < n; i++) c.lineTo(road[i][0], road[i][1]); c.stroke();
      c.setLineDash([]);
    },
  });
}
// the Griffith Observatory: a white front, a great dome and two small ones
function observatory(p) {
  const x = 560, base = Math.round(ridgeY(560)) + 8;
  p.group('hills', { x: x - 110, y: base - 90, w: 220, h: 110 }, (c) => {
    // the lawn in front, and the monument
    c.fillStyle = HILL_L; c.beginPath(); c.ellipse(x, base + 6, 96, 10, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = WHITE; poly(c, [[x - 2, base + 4], [x + 2, base + 4], [x + 1, base - 14], [x - 1, base - 14]]); c.fill();
    // the long low front
    c.fillStyle = WHITE; c.fillRect(x - 86, base - 22, 172, 22);
    c.fillStyle = '#d8d2c2'; c.fillRect(x - 86, base - 4, 172, 4);
    c.fillStyle = GLASS_D; for (let k = -6; k <= 6; k++) if (Math.abs(k) > 1) c.fillRect(x + k * 12 - 2, base - 16, 4, 9);
    // the central block and the great dome
    c.fillStyle = WHITE; c.fillRect(x - 30, base - 44, 60, 24);
    c.fillStyle = INK; c.fillRect(x - 8, base - 18, 16, 14);
    c.fillStyle = '#3a4e4c'; c.beginPath(); c.arc(x, base - 44, 28, Math.PI, 0); c.fill();
    c.fillStyle = '#5d7470'; c.beginPath(); c.arc(x - 6, base - 46, 18, Math.PI * 1.1, Math.PI * 1.6); c.lineTo(x - 6, base - 46); c.fill();
    // the two side towers with their small domes
    for (const s of [-1, 1]) {
      const tx = x + s * 74;
      c.fillStyle = WHITE; c.fillRect(tx - 10, base - 40, 20, 20);
      c.fillStyle = '#3a4e4c'; c.beginPath(); c.arc(tx, base - 40, 10, Math.PI, 0); c.fill();
    }
  }, { t: 6.0, d: 0.8, reveal: 'rise' });
}

// ================================================================ palms
// a tall fan palm: a thin trunk with a slight bend, a skirt of dead fronds, a mop of green
function palmPts(x, base, h, lean) {
  const pts = [];
  for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push([x + lean * t * t * h, base - t * h]); }
  return pts;
}
function crown(c, x, y, s, sway = 0) {
  // the skirt
  c.fillStyle = SKIRT; c.beginPath(); c.moveTo(x - 9 * s, y + 4 * s); c.lineTo(x + 9 * s, y + 4 * s); c.lineTo(x + 6 * s, y + 26 * s); c.lineTo(x - 6 * s, y + 26 * s); c.fill();
  c.strokeStyle = TRUNK_D; c.lineWidth = 1; c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(x + k * 3 * s, y + 6 * s); c.lineTo(x + k * 2.4 * s, y + 25 * s); } c.stroke();
  // the fronds: stalks all round, the lower ones hanging, each ending in a fan of points
  c.strokeStyle = PALM; c.lineCap = 'round';
  for (let k = 0; k < 15; k++) {
    const a = -Math.PI - 0.55 + (k / 14) * (Math.PI + 1.1) + sway * (1 - Math.abs(k - 7) / 9);
    const hang = Math.max(0, Math.sin(a)) * 0.6 + Math.abs(Math.cos(a)) * 0.45;
    const ex = x + Math.cos(a) * 25 * s, ey = y + Math.sin(a) * 15 * s + hang * 20 * s;
    c.lineWidth = 2.2 * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * 16 * s, y + Math.sin(a) * 14 * s - 5 * s, ex, ey); c.stroke();
    c.lineWidth = 1.5 * s;
    c.beginPath();
    for (let j = -2; j <= 2; j++) { const b = a + j * 0.2 + hang * 0.9 * Math.sign(Math.cos(a)); c.moveTo(ex, ey); c.lineTo(ex + Math.cos(b) * 12 * s, ey + Math.sin(b) * 9 * s + 6 * s * hang); }
    c.stroke();
  }
  c.fillStyle = PALM_L; c.beginPath(); c.arc(x, y + 2 * s, 5 * s, 0, Math.PI * 2); c.fill();
}
function palmRow(p) {
  // along the street below the garden: tall, thin, of different heights
  const row = [[840, 1060, 540, 0.02], [930, 1066, 450, -0.03], [1020, 1060, 600, 0.03], [1112, 1064, 480, 0.0], [1205, 1062, 640, -0.02], [1300, 1066, 520, 0.04], [1392, 1062, 450, -0.03], [1470, 1064, 570, 0.02]];
  row.forEach(([x, base, h, lean], i) => {
    const pts = palmPts(x, base, h, lean);
    const [tx, ty] = pts[pts.length - 1];
    p.mark('palms', {
      t: 6.3 + i * 0.12, d: 1.0, reveal: 'rise', ease: 'out', box: { x: Math.min(x, tx) - 50, y: ty - 40, w: Math.abs(tx - x) + 100, h: base - ty + 46 },
      draw: (c) => {
        c.strokeStyle = TRUNK; c.lineWidth = 6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const pt of pts) c.lineTo(pt[0], pt[1]); c.stroke();
        c.strokeStyle = TRUNK_D; c.lineWidth = 2; c.beginPath(); c.moveTo(pts[0][0] + 2, pts[0][1]); for (const pt of pts) c.lineTo(pt[0] + 2, pt[1]); c.stroke();
        crown(c, tx, ty, 1.15);
      },
    });
  });
}

// ================================================================ the garden and the terrace
function hedge(p) {
  const y0 = 1000, y1 = TERR + 6;
  const rr = rng(17), dots = [];
  for (let i = 0; i < 300; i++) dots.push([rr.range(540, X1), rr.range(y0 + 8, y1 - 6), rr.range(2, 5)]);
  p.group('garden', { x: 520, y: y0 - 30, w: X1 - 500, h: y1 - y0 + 34 }, (c) => {
    c.fillStyle = HEDGE; c.beginPath(); c.moveTo(530, y1);
    for (let x = 530; x <= X1 + 30; x += 64) c.quadraticCurveTo(x + 32, y0 - 24, x + 64, y0);
    c.lineTo(X1 + 30, y1); c.closePath(); c.fill();
    c.fillStyle = HEDGE_L; c.beginPath(); for (const [x, y, s] of dots) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
  }, { t: 7.2, d: 0.9, reveal: 'wipe', ease: 'inOut' });
}
// a white garden wall on the left, a terracotta coping, bougainvillea pouring over it
const WX1 = 560, WTOP = 930;
function gardenWall(p) {
  p.group('garden', { x: X0, y: WTOP - 4, w: WX1 - X0 + 8, h: TERR - WTOP + 8 }, (c) => {
    c.fillStyle = WHITE; c.fillRect(X0, WTOP, WX1 - X0, TERR - WTOP);
    // the end of the wall, in shade, and the shadow under the coping
    c.fillStyle = '#ddd5c6'; c.fillRect(WX1 - 16, WTOP, 16, TERR - WTOP);
    c.fillStyle = 'rgba(120,150,190,.25)'; c.fillRect(X0, WTOP + 14, WX1 - X0, 10);
    c.fillStyle = '#d0714a'; c.fillRect(X0, WTOP, WX1 - X0 + 4, 14);
    c.fillStyle = '#b25a3a'; c.fillRect(X0, WTOP + 10, WX1 - X0 + 4, 4);
  }, { t: 7.5, d: 0.8, reveal: 'rise' });
  // the bougainvillea: dark leaves, then magenta bracts in three pinks, in two marks
  const rr = rng(2024), leaves = [], flowers = [];
  const spill = (x0, x1, y0, y1, n) => {
    for (let i = 0; i < n; i++) {
      const x = rr.range(x0, x1), y = rr.range(y0, y1);
      leaves.push([x + rr.range(-6, 6), y + rr.range(-4, 6), rr.range(4, 8), rr() * Math.PI]);
      flowers.push([x, y, rr.range(3.5, 8), rr.int(0, 2)]);
    }
  };
  spill(X0, WX1 - 10, WTOP - 40, WTOP + 20, 230);
  for (const [cx, len] of [[170, 120], [300, 70], [420, 150], [520, 90]]) spill(cx - 26, cx + 26, WTOP + 10, WTOP + len, Math.round(len * 0.7));
  const pinks = ['#d4307f', '#ec5aa2', '#f6a0c8'];
  [[X0, 340], [340, WX1 + 10]].forEach(([xa, xb], i) => {
    const lv = leaves.filter(([x]) => x >= xa && x < xb), fl = flowers.filter(([x]) => x >= xa && x < xb);
    p.group('garden', { x: xa - 20, y: WTOP - 60, w: xb - xa + 40, h: 260 }, (c) => {
      c.fillStyle = HEDGE; c.beginPath();
      for (const [x, y, s, a] of lv) { c.moveTo(x + s, y); c.ellipse(x, y, s, s * 0.5, a, 0, Math.PI * 2); }
      c.fill();
      for (let k = 0; k < 3; k++) {
        c.fillStyle = pinks[k]; c.beginPath();
        for (const [x, y, s, t] of fl) if (t === k) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); }
        c.fill();
      }
    }, { t: 8.1 + i * 0.25, d: 0.7, reveal: 'fall' });
  });
}
// the terrace: pale stone flags in perspective, running to a point over the hills
const TVP = [820, 620];
function terrace(p) {
  const lines = [];
  for (let x = -900; x <= 2600; x += 120) {
    const t = (TERR - TVP[1]) / (Y1 - TVP[1]);
    lines.push([[TVP[0] + (x - TVP[0]) * t, TERR], [x, Y1]]);
  }
  for (let k = 1; k <= 9; k++) { const y = TERR + (Y1 - TERR) * (k / 9) ** 1.5; lines.push([[X0, y], [X1, y]]); }
  p.group('terrace', { x: X0, y: TERR, w: X1 - X0, h: Y1 - TERR }, (c) => {
    c.fillStyle = DECK; c.fillRect(X0, TERR, X1 - X0, Y1 - TERR);
    c.strokeStyle = DECK_D; c.lineWidth = 1.6; c.beginPath();
    for (const [[xa, ya], [xb, yb]] of lines) { c.moveTo(xa, ya); c.lineTo(xb, yb); }
    c.stroke();
    // the wall's shadow along its foot
    c.fillStyle = 'rgba(110,140,185,.22)'; poly(c, [[X0, TERR], [WX1, TERR], [WX1 + 30, TERR + 22], [X0, TERR + 22]]); c.fill();
  }, { t: 8.5, d: 0.9, reveal: 'fall', ease: 'inOut' });
}

// ================================================================ the pool
// the pool, turned at an angle to us: a long rectangle in perspective
const PQ = [[660, 1152], [1470, 1198], [1382, 1522], [356, 1434]];
const PC = PQ.reduce((m, [x, y]) => [m[0] + x / 4, m[1] + y / 4], [0, 0]);
const grow = (k) => PQ.map(([x, y]) => [PC[0] + (x - PC[0]) * k, PC[1] + (y - PC[1]) * k]);
function pool(p) {
  // the white coping round it
  p.group('pool', { x: 300, y: 1110, w: 1220, h: 450 }, (c) => {
    c.fillStyle = WHITE; poly(c, grow(1.045)); c.fill();
    c.strokeStyle = DECK_D; c.lineWidth = 1.4; c.stroke();
  }, { t: 9.0, d: 0.7, reveal: 'wipe', ease: 'inOut' });
  // the water, paler at the far end, the far wall's tiles seen under the edge
  p.group('pool', { x: 340, y: 1140, w: 1140, h: 400 }, (c) => {
    const g = c.createLinearGradient(0, 1150, 0, 1520);
    g.addColorStop(0, '#62c4e6'); g.addColorStop(1, POOL);
    c.fillStyle = g; poly(c, PQ); c.fill();
    c.save(); poly(c, PQ); c.clip();
    const [a, b] = PQ;
    c.fillStyle = POOL_D; poly(c, [a, b, [b[0] - 3, b[1] + 24], [a[0] + 4, a[1] + 22]]); c.fill();
    c.fillStyle = '#e8f6fb'; c.beginPath();
    for (let k = 0; k < 34; k++) { const t = (k + 0.5) / 34, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t) + 4; c.rect(x - 4, y, 8, 4); }
    c.fill();
    c.restore();
  }, { t: 9.2, d: 0.9, reveal: 'fall', ease: 'inOut' });
  // the net of light: dark wobbling lines, still; the bright ones move (see life)
  const rr = rng(88), lines = [];
  for (let i = 0; i < 44; i++) {
    const y = rr.range(1170, 1520), s = lerp(0.6, 1.3, (y - 1150) / 370);
    const x = rr.range(240, 1440), L = rr.range(140, 300) * s, ph = rr() * 7;
    const pts = [];
    for (let k = 0; k <= 24; k++) { const t = k / 24; pts.push([x + t * L, y + t * L * 0.057 + Math.sin(t * Math.PI * 3 + ph) * 8 * s + Math.sin(t * Math.PI * 7 + ph * 2) * 2.5 * s]); }
    lines.push(pts);
  }
  p.mark('pool', {
    t: 9.5, d: 0.8, reveal: 'fade', box: { x: 340, y: 1140, w: 1140, h: 400 },
    draw: (c) => {
      c.save(); poly(c, PQ); c.clip();
      c.strokeStyle = POOL_D; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); for (const l of lines) { c.moveTo(l[0][0], l[0][1]); for (const pt of l) c.lineTo(pt[0], pt[1]); } c.stroke();
      c.restore();
    },
  });
  // a steel ladder at the far right corner
  p.group('pool', { x: 1380, y: 1150, w: 80, h: 90 }, (c) => {
    c.strokeStyle = '#c9d3dc'; c.lineWidth = 4; c.lineCap = 'round';
    for (const dx of [0, 34]) { c.beginPath(); c.moveTo(1392 + dx, 1222); c.lineTo(1392 + dx, 1180); c.quadraticCurveTo(1394 + dx, 1162, 1406 + dx, 1168); c.stroke(); }
    c.strokeStyle = 'rgba(31,125,189,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(1392, 1230); c.lineTo(1392, 1246); c.moveTo(1426, 1230); c.lineTo(1426, 1246); c.stroke();
  }, { t: 9.9, d: 0.5, reveal: 'rise' });
}
// on the terrace: the umbrella's shadow, two loungers, the umbrella, agaves in pots
function lounger(c, x, y, d, w, stripe) {
  const P = (u, v) => [x + d[0] * u + w[0] * v, y + d[1] * u + w[1] * v];
  // the shadow, then the legs, the frame, the cushion in stripes, the raised back
  c.fillStyle = 'rgba(90,120,170,.22)'; poly(c, [P(0, 0), P(220, 0), P(220, 1), P(0, 1)].map(([a, b]) => [a + 26, b + 16])); c.fill();
  c.strokeStyle = '#9a9488'; c.lineWidth = 3; c.beginPath();
  for (const [u, v] of [[78, 0], [78, 1], [214, 0], [214, 1]]) { const [a, b] = P(u, v); c.moveTo(a, b); c.lineTo(a, b + 14); }
  c.stroke();
  c.fillStyle = WHITE; poly(c, [P(70, -0.08), P(224, -0.08), P(224, 1.08), P(70, 1.08)]); c.fill();
  for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? WHITE : stripe; poly(c, [P(78 + k * 18, 0.08), P(96 + k * 18, 0.08), P(96 + k * 18, 0.92), P(78 + k * 18, 0.92)]); c.fill(); }
  // the back, propped up toward the wall
  const lift = [-6, -56];
  const up = (u, v) => { const [a, b] = P(u, v); return [a + lift[0] * (1 - u / 70), b + lift[1] * (1 - u / 70)]; };
  c.fillStyle = WHITE; poly(c, [up(-4, -0.08), up(74, -0.08), up(74, 1.08), up(-4, 1.08)]); c.fill();
  for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? WHITE : stripe; poly(c, [up(2 + k * 17, 0.08), up(19 + k * 17, 0.08), up(19 + k * 17, 0.92), up(2 + k * 17, 0.92)]); c.fill(); }
  c.strokeStyle = 'rgba(35,39,46,.25)'; c.lineWidth = 1.2; poly(c, [up(-4, -0.08), up(74, -0.08), up(74, 1.08), up(-4, 1.08)]); c.stroke();
}
function agave(c, x, y, s) {
  c.fillStyle = '#c96a44'; poly(c, [[x - 28 * s, y - 44 * s], [x + 28 * s, y - 44 * s], [x + 20 * s, y], [x - 20 * s, y]]); c.fill();
  c.fillStyle = '#a95233'; c.fillRect(x - 31 * s, y - 50 * s, 62 * s, 8 * s);
  c.fillStyle = 'rgba(90,120,170,.2)'; c.beginPath(); c.ellipse(x + 16 * s, y + 2, 34 * s, 8 * s, 0, 0, Math.PI * 2); c.fill();
  for (const [col, k0] of [['#4f8a72', 0], ['#7fb39a', 1]]) {
    c.fillStyle = col;
    for (let k = k0; k < 11; k += 2) { const a = -Math.PI + (k / 10) * Math.PI, L = (70 - Math.abs(k - 5) * 6) * s; poly(c, [[x - 6 * s, y - 50 * s], [x + Math.cos(a) * L, y - 50 * s + Math.sin(a) * L * 1.15], [x + 6 * s, y - 50 * s]]); c.fill(); }
  }
}
function furniture(p) {
  const d = [0.94, -0.33], w = [20, 46];
  p.group('deck', { x: X0 - 20, y: 1190, w: 520, h: 330 }, (c) => {
    // the umbrella's round shadow on the stone
    c.fillStyle = 'rgba(90,120,170,.2)'; c.beginPath(); c.ellipse(330, 1330, 190, 46, -0.2, 0, Math.PI * 2); c.fill();
    lounger(c, 120, 1300, d, w, ORANGE);
    lounger(c, 140, 1432, d, w, ORANGE);
    // a pink towel thrown over the near one
    c.fillStyle = PINK; poly(c, [[262, 1356], [300, 1342], [318, 1396], [280, 1410]]); c.fill();
    c.fillStyle = WHITE; poly(c, [[270, 1376], [306, 1363], [309, 1370], [273, 1383]]); c.fill();
  }, { t: 9.9, d: 0.7, reveal: 'pop' });
  // the umbrella: a tall pole, a canopy of pink and white panels with a fringe
  const ux = 352, apex = 1004, rimY = 1052, rx = 170, ry = 38;
  p.group('deck', { x: ux - rx - 10, y: apex - 10, w: 2 * rx + 20, h: 1330 - apex + 20 }, (c) => {
    c.fillStyle = '#e9e4d8'; c.fillRect(ux - 3, rimY - 10, 6, 1330 - rimY);
    c.fillStyle = '#b5457a'; c.beginPath(); c.ellipse(ux, rimY, rx, ry, 0, 0, Math.PI * 2); c.fill();
    const n = 12;
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
      const front = Math.sin((a0 + a1) / 2) > 0;
      c.fillStyle = k % 2 ? (front ? WHITE : '#e8dfd2') : (front ? PINK : '#d98aa0');
      poly(c, [[ux, apex], [ux + Math.cos(a0) * rx, rimY + Math.sin(a0) * ry], [ux + Math.cos(a1) * rx, rimY + Math.sin(a1) * ry]]); c.fill();
    }
    // the scalloped fringe along the front
    c.beginPath();
    for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI, x = ux + Math.cos(a) * rx, y = rimY + Math.sin(a) * ry; c.moveTo(x + 7, y); c.arc(x, y, 7, 0, Math.PI); }
    c.fillStyle = PINK; c.fill();
    c.fillStyle = WHITE; c.beginPath(); c.arc(ux, apex - 3, 5, 0, Math.PI * 2); c.fill();
  }, { t: 10.2, d: 0.8, reveal: 'pop', ease: 'back' });
  // agaves in terracotta pots: by the hedge, behind the pool, at the near right corner
  [[612, 1124, 0.75, 10.0], [1230, 1140, 0.65, 10.15], [1462, 1500, 1.05, 10.3]].forEach(([x, y, s, t]) => {
    p.group('deck', { x: x - 80 * s, y: y - 130 * s, w: 160 * s, h: 140 * s }, (c) => agave(c, x, y, s), { t, d: 0.6, reveal: 'pop' });
  });
}

// ================================================================ the title
function title(p) {
  p.type('title', 'Los Angeles', W / 2, 1782, {
    family: FONT, size: 196, color: '#1f6db6', shadow: PINK, sx: 7, sy: 7, align: 'center', t: 10.9, gap: 0.12, d: 0.7, reveal: 'press',
  });
  p.type('title', 'California', W / 2, 1902, { family: FONT, size: 54, color: ORANGE, align: 'center', t: 12.6, gap: 0.07, d: 0.6 });
  // two short strokes of paint either side of it, as if wiped off a brush
  for (const s of [-1, 1]) {
    const x = W / 2 + s * 250;
    p.group('title', { x: x - 90, y: 1868, w: 180, h: 30 }, (c) => {
      c.strokeStyle = s < 0 ? POOL : PINK; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - 70, 1886); c.quadraticCurveTo(x, 1878, x + 70, 1884); c.stroke();
    }, { t: 13.3 + (s > 0 ? 0.15 : 0), d: 0.6, reveal: s < 0 ? 'wipeL' : 'wipe' });
  }
}

// ================================================================ life
function life(p) {
  // the two palms behind the wall, their crowns stirring in the breeze
  const tall = [[250, TERR, 670, 0.05, 0], [440, TERR, 590, -0.04, 1.7]];
  tall.forEach(([x, base, h, lean, ph], i) => {
    const pts = palmPts(x, base, h, lean);
    const [tx, ty] = pts[pts.length - 1];
    p.mark('palms', {
      t: 6.9 + i * 0.2, d: 1.2, reveal: 'rise', box: { x: Math.min(x, tx) - 20, y: ty - 4, w: Math.abs(tx - x) + 40, h: base - ty + 8 },
      draw: (c) => {
        c.strokeStyle = TRUNK; c.lineWidth = 9; c.lineCap = 'round';
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const pt of pts) c.lineTo(pt[0], pt[1]); c.stroke();
        c.strokeStyle = TRUNK_D; c.lineWidth = 3; c.beginPath(); c.moveTo(pts[0][0] + 3, pts[0][1]); for (const pt of pts) c.lineTo(pt[0] + 3, pt[1]); c.stroke();
      },
    });
    p.live('palms', {
      t: 7.9 + i * 0.2, d: 0.7, reveal: 'pop', box: { x: tx - 70, y: ty - 50, w: 140, h: 100 },
      draw: (c, time) => crown(c, tx, ty, 1.7, Math.sin(time * 0.9 + ph) * 0.12),
    });
  });
  // the bright lines of the pool's net of light, wobbling
  const rr = rng(1966), net = [];
  for (let i = 0; i < 34; i++) {
    const y = rr.range(1170, 1520), s = lerp(0.6, 1.3, (y - 1150) / 370);
    net.push([rr.range(240, 1400), y, rr.range(90, 240) * s, s, rr() * 7, rr.chance(0.4)]);
  }
  p.live('water', {
    t: 9.6, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      c.save(); poly(c, PQ); c.clip();
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const [x0, y0, L, s, ph, white] of net) {
        c.strokeStyle = white ? 'rgba(251,248,241,.9)' : POOL_L; c.lineWidth = (white ? 2.6 : 3.4) * s;
        c.beginPath();
        const dx = Math.sin(time * 0.35 + ph) * 18 * s;
        for (let k = 0; k <= 16; k++) {
          const t = k / 16, x = x0 + dx + t * L, y = y0 + t * L * 0.057 + Math.sin(t * Math.PI * 3 + time * 1.1 + ph) * 7 * s + Math.sin(t * Math.PI * 7 - time * 0.8) * 2 * s;
          k ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.stroke();
      }
      c.restore();
    },
  });
  // a car on Mulholland, and a plane drawing its trail across the sky
  // on the hills' layer, so the palms, the wall and the hedge stand in front of it
  const road = ROAD;
  p.live('hills', {
    t: 7.0, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      const u = ((time - 7) * 0.035) % 1, f = u * (road.length - 1), i = Math.floor(f), k = f - i;
      const a = road[i], b = road[Math.min(road.length - 1, i + 1)];
      const x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k);
      c.save(); c.translate(x, y - 4); c.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
      c.fillStyle = '#f2e04a'; c.fillRect(-9, -5, 18, 8); c.fillStyle = INK; c.fillRect(-3, -8, 8, 4);
      c.restore();
    },
  });
  p.live('air', {
    t: 11.0, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      const u = (time - 11) * 26, x = 300 + u, y = 250 - u * 0.12;
      if (x > X1 + 40) return;
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(Math.max(X0, x - 600), y + Math.min(600, x - X0) * 0.12); c.lineTo(x - 14, y + 1.7); c.stroke();
      c.fillStyle = WHITE; c.beginPath(); c.moveTo(x + 10, y); c.lineTo(x - 12, y + 3); c.lineTo(x - 12, y - 2); c.closePath(); c.fill();
      c.fillRect(x - 4, y - 6, 3, 12);
    },
  });
}
