// Quito: the Basílica del Voto Nacional, huge and frontal, its stone lit gold by
// the late sun under a sky that carries a gilded lattice of eight-pointed stars,
// like the carved ceilings of the old churches. Its twin clock towers with
// their belfries, pinnacles and spires, the rose window, the portals and the
// gargoyles at the corners. Behind it Pichincha, Cotopaxi's snow cone far off and
// the round green hill of El Panecillo; below, the old town's white walls and red
// tiles with the twin towers of San Francisco and the cathedral's green-tiled
// domes. At the foot, a frieze of carved and gilded scrolls like the churches'
// altar work, with the equator's line along its top. The name in a gold script.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, shade, lerp, clamp, poly } from '../kit.js';

const NIGHT = '#1d3570', DUSK = '#3e5f9e', LILAC = '#9a9cc0', ROSE = '#e3ae8c', GLOW = '#f5d49e';
const STONE = '#c9b498', STONE_L = '#ead0a6', STONE_D = '#8c8296', STONE_S = '#5c5470', JOINT = 'rgba(70,52,60,.22)';
const GOLD = '#d9a93e', GOLD_L = '#f6dc8a', GOLD_D = '#9a6a1e', BOLE = '#6a1822', BOLE_D = '#4a0f18';
const WALL = '#efe5d2', WALL_S = '#c9bfb4', TILE = '#b44e36', TILE_D = '#8a3828', TILE_L = '#d06a4a';
const HILL = '#35574a', HILL_L = '#4d7560', MOUNT = '#38475e', MOUNT_L = '#56677e', INK = '#1d1830';
const SCRIPT = '"Pinyon Script", cursive', CAPS = '"Cinzel", serif';

export const city = {
  id: 'quito', name: 'Quito', wall: '#2a1018',
  alt: "The Basílica del Voto Nacional in late afternoon light, huge and seen from the front, its twin clock towers with belfries, pinnacles and spires, the rose window, the portals and gargoyles, over the old town's white walls and red tiles with the twin towers of San Francisco and the cathedral's green-tiled domes, Pichincha behind, Cotopaxi's snow far off and the green hill of El Panecillo, swifts round the towers, above a frieze of gilded carved scrolls with the equator's line along its top, the name in gold script under a gilded lattice of eight-pointed stars in the sky",
  google: 'family=Cinzel:wght@500;700&family=Pinyon+Script',
  fonts: [['400 100px "Pinyon Script"', 'Quito'], ['700 30px "Cinzel"', 'SAN FRANCISCO DE QUITO · ECUADOR LATITUD 0° 13\' S 2850 M'], ['500 20px "Cinzel"', 'LATITUD 0° 13\' S ALTITUD 2850 M']],
  build,
};

// the basilica's front
const CX = 1000, TW = 172, CW = 244;
const X0 = CX - CW / 2 - TW, X1 = CX + CW / 2 + TW; // 706 .. 1294
const LT = [X0, X0 + TW], RT = [X1 - TW, X1]; // the towers
const BY = 1478; // its foot
const FR = 1770; // the frieze's top

function build() {
  const p = new Plate({ paper: '#efe2c6', seed: 1534 });
  const r = p.r;
  p.stack('sky', 'far', 'hills', 'back', 'church', 'detail', 'town', 'birds', 'frieze', 'title');

  sky(p, r);
  mountains(p, r);
  panecillo(p, r);
  backTown(p, r);
  basilica(p, r);
  town(p, r);
  frieze(p, r);
  life(p, r);
  title(p, r);
  return p;
}

// ---------------------------------------------------------------------------
// the sky: deep blue overhead going down through lilac to a gold horizon

function sky(p, r) {
  p.group('sky', { x: 0, y: 0, w: W, h: FR }, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 1320);
    g.addColorStop(0, NIGHT); g.addColorStop(0.38, DUSK); g.addColorStop(0.66, LILAC); g.addColorStop(0.84, ROSE); g.addColorStop(1, GLOW);
    c.fillStyle = g; c.fillRect(0, 0, W, FR);
  }, { t: 0, d: 1.2, reveal: 'fade' });
  // up in the blue, a gilded lattice of eight-pointed stars, like the carved and
  // gilt ceilings of the old churches, fading out as it comes down the sky
  const S = 100, LB = 660;
  const nodes = [];
  for (let y = 40, j = 0; y < LB; y += S, j++) for (let x = (j % 2) * S / 2 - S / 2; x < W + S; x += S) nodes.push([x, y, 0.95 * Math.max(0, 1 - y / LB) ** 1.2]);
  const star = (c, x, y, R, r0) => { c.moveTo(x + R, y); for (let k = 1; k <= 16; k++) { const a = (k / 16) * Math.PI * 2, rr = k % 2 ? r0 : R; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } };
  p.group('sky', { x: 0, y: 0, w: W, h: LB + 40 }, (c) => {
    for (const [col, dx, dy, lw] of [['rgba(10,20,50,.5)', 1.5, 2, 3], [GOLD, 0, 0, 2.2]]) {
      c.strokeStyle = col; c.lineWidth = lw;
      for (const [x, y, a] of nodes) {
        if (a <= 0.02) continue;
        c.globalAlpha = a;
        c.beginPath(); star(c, x + dx, y + dy, 34, 22);
        // the ribbons that run from star to star, down to the two below
        for (const sx of [-1, 1]) {
          const ux = sx * S / 2, uy = S, L = Math.hypot(ux, uy), ex = ux / L, ey = uy / L;
          for (const o of [-4, 4]) {
            const ox = -ey * o, oy = ex * o;
            c.moveTo(x + dx + ex * 30 + ox, y + dy + ey * 30 + oy); c.lineTo(x + dx + ux - ex * 30 + ox, y + dy + uy - ey * 30 + oy);
          }
        }
        c.stroke();
      }
    }
    for (const [x, y, a] of nodes) {
      if (a <= 0.02) continue;
      c.globalAlpha = a;
      c.fillStyle = GOLD_L; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD; for (let k = 0; k < 8; k++) { const an = (k / 8) * Math.PI * 2; c.beginPath(); c.arc(x + Math.cos(an) * 13, y + Math.sin(an) * 13, 2.2, 0, Math.PI * 2); c.fill(); }
      c.beginPath(); c.arc(x, y + S * 0.55, 3, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  }, { t: 0.6, d: 1.6, reveal: 'fall', ease: 'inOut' });
  // long thin clouds lit from below, engraved with fine lines
  const clouds = [[-40, 960, 520, 18], [1040, 900, 600, 14], [260, 1060, 420, 12], [1180, 1040, 440, 16], [60, 700, 300, 10], [1260, 640, 360, 10]];
  clouds.forEach(([x, y, w, h], i) => {
    const lines = [];
    for (let k = 0; k < 4; k++) lines.push([[x + 20 + k * 14, y - h + k * (h / 2)], [x + w - 30 - k * 20, y - h + k * (h / 2)]]);
    p.group('sky', { x: x - 10, y: y - h - 12, w: w + 20, h: h * 2 + 20 }, (c) => {
      c.fillStyle = mix(ROSE, '#f8d7b0', y > 900 ? 0.5 : 0.1); c.globalAlpha = 0.7;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w * 0.2, y - h * 1.6, x + w * 0.5, y - h); c.quadraticCurveTo(x + w * 0.8, y - h * 1.4, x + w, y); c.closePath(); c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = 'rgba(122,106,158,.55)'; c.lineWidth = 1.1;
      c.beginPath(); for (const [a, b] of lines) { c.moveTo(a[0], a[1] + h * 0.9); c.lineTo(b[0], b[1] + h * 0.9); } c.stroke();
    }, { t: 0.8 + i * 0.12, d: 0.9, reveal: i % 2 ? 'wipeL' : 'wipe' });
  });
}

// ---------------------------------------------------------------------------
// Pichincha behind, Cotopaxi far off

function mountains(p, r) {
  // Cotopaxi: a perfect cone with snow, far to the south
  const cot = [[1180, 1190], [1330, 1000], [1352, 978], [1380, 972], [1408, 980], [1440, 1010], [1600, 1170], [1600, 1200], [1180, 1200]];
  const snow = [[1290, 1050], [1330, 1000], [1352, 978], [1380, 972], [1408, 980], [1440, 1010], [1480, 1052], [1450, 1060], [1430, 1046], [1410, 1066], [1390, 1050], [1372, 1072], [1352, 1052], [1330, 1070], [1312, 1056]];
  p.group('far', boxOf(cot, 4), (c) => {
    c.fillStyle = '#8a86aa'; poly(c, cot); c.fill();
    c.fillStyle = '#f7e6df'; poly(c, snow); c.fill();
    c.strokeStyle = 'rgba(122,106,158,.6)'; c.lineWidth = 1;
    c.beginPath(); for (let k = 0; k < 12; k++) { const x = 1300 + k * 12; c.moveTo(x, 1060 + Math.abs(x - 1380) * 0.3); c.lineTo(x - (1380 - x) * 0.4, 1180); } c.stroke();
  }, { t: 1.1, d: 0.9, reveal: 'rise' });
  // Pichincha: a broad dark massif, ridges and gullies hatched
  const pts = [[-20, 1400], [-20, 980], [80, 930], [200, 860], [300, 800], [380, 744], [420, 720], [462, 736], [520, 790], [580, 812], [640, 780], [690, 800], [760, 870], [860, 940], [980, 1000], [1120, 1060], [1240, 1140], [1240, 1400]];
  const hatch = [];
  for (let k = 0; k < 70; k++) {
    const x = lerp(20, 1200, k / 70) + r.range(-6, 6);
    let top = 1400;
    for (let i = 0; i + 1 < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; if ((ax - x) * (bx - x) <= 0 && ax !== bx) top = Math.min(top, ay + ((x - ax) / (bx - ax)) * (by - ay)); }
    const lean = x < 420 ? -0.35 : 0.45;
    hatch.push([[x, top + 8], [x + lean * 160, top + 8 + r.range(100, 260)]]);
  }
  p.group('far', boxOf(pts, 6), (c) => {
    const g = c.createLinearGradient(0, 720, 0, 1300);
    g.addColorStop(0, MOUNT_L); g.addColorStop(1, MOUNT);
    c.fillStyle = g; poly(c, pts); c.fill();
    // the ridge lit along its crest
    c.strokeStyle = '#c99a8a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(pts[1][0], pts[1][1]); for (let i = 2; i < pts.length - 1; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke();
    c.strokeStyle = 'rgba(25,30,50,.35)'; c.lineWidth = 1.4; c.beginPath(); for (const [a, b] of hatch) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
    // spurs running down from the summits, lit on one flank
    c.lineWidth = 2; c.strokeStyle = 'rgba(201,154,138,.45)';
    c.beginPath();
    for (const [x0, y0, x1, y1] of [[420, 724, 260, 1000], [420, 724, 520, 1060], [640, 784, 600, 1050], [640, 784, 820, 1080], [300, 800, 120, 1040], [880, 950, 940, 1140]]) { c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 30, (y0 + y1) / 2, x1, y1); }
    c.stroke();
    const fg = c.createLinearGradient(0, 1080, 0, 1300); fg.addColorStop(0, 'rgba(36,58,58,0)'); fg.addColorStop(1, 'rgba(36,58,58,.9)');
    c.fillStyle = fg; c.fillRect(-20, 1080, 1260, 320);
    // a little snow on the summit
    c.fillStyle = '#e9dfe6'; poly(c, [[392, 734], [420, 720], [452, 732], [440, 748], [424, 740], [408, 752]]); c.fill();
  }, { t: 1.4, d: 1.0, reveal: 'rise', ease: 'inOut' });
}

// El Panecillo: a round green hill, its top flat and bare, houses up its sides
function panecillo(p, r) {
  const pts = [[1120, 1480], [1180, 1360], [1250, 1270], [1330, 1214], [1390, 1196], [1470, 1196], [1530, 1214], [1600, 1250], [1640, 1300], [1640, 1480]];
  const trees = [];
  for (let i = 0; i < 160; i++) { const x = r.range(1180, 1620), yt = 1200 + Math.abs(x - 1430) ** 1.6 * 0.03; trees.push([x, r.range(Math.max(yt + 16, 1215), 1470), r.range(4, 9), r.pick(['#2c4a3e', '#47705a', '#3a5e4b'])]); }
  const homes = [];
  for (let i = 0; i < 60; i++) { const x = r.range(1170, 1620); const y = r.range(1330 + Math.abs(x - 1430) * 0.25, 1470); homes.push([x, y, r.range(10, 18), r.range(7, 11), r.pick(['#efe5d2', '#e4c9a0', '#d9b0a0', '#c9d2c8'])]); }
  homes.sort((a, b) => a[1] - b[1]);
  p.group('hills', boxOf(pts, 6), (c) => {
    const g = c.createLinearGradient(1180, 0, 1640, 0);
    g.addColorStop(0, HILL_L); g.addColorStop(1, HILL);
    c.fillStyle = g; poly(c, pts); c.fill();
    c.fillStyle = '#b79a72'; c.fillRect(1394, 1190, 72, 8); // the bare summit terrace
    for (const [x, y, s, col] of trees) { c.fillStyle = col; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); }
    for (const [x, y, w, h, col] of homes) { c.fillStyle = col; c.fillRect(x, y - h, w, h); c.fillStyle = TILE; c.fillRect(x - 1, y - h - 3, w + 2, 3); }
  }, { t: 1.8, d: 0.9, reveal: 'rise' });
}

// ---------------------------------------------------------------------------
// the town: rows of white houses with red tiled roofs, seen a little from above

function houseRow(r, y, h, x0, x1, skip) {
  const out = [];
  let x = x0;
  while (x < x1) {
    const w = r.range(0.9, 2.0) * h;
    if (!skip || !skip(x, x + w)) {
      const hh = h * r.range(0.65, 1.0);
      out.push({
        x, y, w, hh, roof: h * r.range(0.32, 0.5), wall: r.pick([WALL, WALL, WALL, '#f2dcc0', '#e8d2c8', '#dfe3da']),
        tile: r.pick([TILE, TILE, TILE_D, TILE_L]), floors: hh > h * 0.8 ? 2 : 1,
        wins: Array.from({ length: Math.max(1, Math.round(w / 22)) }, () => r()),
        balc: r.chance(0.4) ? r.pick(['#2f6a5a', '#3a5a8a', '#6a3a2a']) : null,
      });
    }
    x += w + r.range(0, 3);
  }
  return out;
}
function drawHouse(c, h) {
  const { x, y, w, hh, roof } = h;
  // wall with its sunless side
  c.fillStyle = h.wall; c.fillRect(x, y - hh, w, hh);
  c.fillStyle = 'rgba(90,70,100,.16)'; c.fillRect(x + w * 0.82, y - hh, w * 0.18, hh);
  // tiled roof seen from a little above, the courses drawn
  c.fillStyle = h.tile;
  c.beginPath(); c.moveTo(x - 3, y - hh); c.lineTo(x + w + 3, y - hh); c.lineTo(x + w - roof * 0.5, y - hh - roof); c.lineTo(x + roof * 0.5, y - hh - roof); c.closePath(); c.fill();
  c.strokeStyle = shade(h.tile, 0.72); c.lineWidth = 0.8; c.beginPath();
  for (let k = 1; k < 4; k++) { const yy = y - hh - roof * k / 4; c.moveTo(x + roof * 0.5 * k / 4, yy); c.lineTo(x + w - roof * 0.5 * k / 4, yy); }
  for (let xx = x + 3; xx < x + w; xx += 4) { c.moveTo(xx, y - hh); c.lineTo(xx + (x + w / 2 - xx) * 0.12, y - hh - roof); }
  c.stroke();
  c.fillStyle = 'rgba(40,20,20,.35)'; c.fillRect(x - 3, y - hh, w + 6, 2);
  // windows and doors; a few already lit
  const n = h.wins.length, step = w / n;
  for (let fl = 0; fl < h.floors; fl++) {
    const wy = y - hh + 6 + fl * (hh / h.floors);
    for (let k = 0; k < n; k++) {
      const v = h.wins[k];
      const lit = v < 0.08 && fl === 0; // a pane catching the sun
      c.fillStyle = lit ? GOLD_L : '#4a3a48';
      c.fillRect(x + step * k + step * 0.32, wy, step * 0.36, hh / h.floors * 0.5);
    }
  }
  if (h.balc && h.floors === 2) {
    c.fillStyle = h.balc; c.fillRect(x + w * 0.15, y - hh / 2 - 4, w * 0.7, 4);
    c.strokeStyle = h.balc; c.lineWidth = 1; c.beginPath(); for (let xx = x + w * 0.15; xx <= x + w * 0.85; xx += 3) { c.moveTo(xx, y - hh / 2); c.lineTo(xx, y - hh / 2 + 7); } c.stroke();
  }
  c.strokeStyle = 'rgba(60,40,50,.4)'; c.lineWidth = 0.8; c.strokeRect(x, y - hh, w, hh);
}

// the town behind the basilica, between the hills: small and in the dusk haze
function backTown(p, r) {
  const rows = [];
  for (let y = 1300, i = 0; y <= 1470; y += 22, i++) rows.push(houseRow(r, y, 16 + i * 1.6, -10, W + 10));
  rows.forEach((row, i) => {
    p.group('back', { x: 0, y: 1300 - 50 + i * 22, w: W, h: 70 }, (c) => {
      for (const h of row) drawHouse(c, h);
      c.fillStyle = `rgba(122,106,158,${0.28 - i * 0.03})`; c.fillRect(0, 1300 - 50 + i * 22, W, 70);
    }, { t: 2.2 + i * 0.16, d: 0.7, reveal: 'rise' });
  });
}

// the near town, in front of the basilica's foot, with San Francisco and the cathedral domes
function town(p, r) {
  const rows = [];
  for (let y = 1520, i = 0; y <= FR + 30; y += 42, i++) {
    const h = 34 + i * 6;
    rows.push({ y, row: houseRow(r, y, h, -20, W + 20, (a, b) => (y < 1620 && b > 100 && a < 560) || (i === 0 && b > 586 && a < 790)), h });
  }
  // San Francisco: a wide stone front with two short white bell towers capped by little domes, on its stepped platform
  sanFrancisco(p, r);
  rows.forEach((R, i) => {
    if (i === 1) domes(p, r);
    p.group('town', { x: -30, y: R.y - R.h * 1.6 - 10, w: W + 60, h: R.h * 1.6 + 20 }, (c) => { for (const h of R.row) drawHouse(c, h); }, { t: 4.2 + i * 0.28, d: 0.8, reveal: 'rise' });
  });
  // street lamps lit along the nearest row
  const lamps = [];
  for (let x = 60; x < W; x += r.range(120, 200)) lamps.push(x);
  p.group('town', { x: 0, y: FR - 80, w: W, h: 82 }, (c) => {
    for (const x of lamps) {
      c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, FR); c.lineTo(x, FR - 56); c.stroke();
      c.fillStyle = '#e9e0c8'; c.fillRect(x - 4, FR - 66, 8, 10);
      c.fillStyle = INK; c.beginPath(); c.moveTo(x - 6, FR - 66); c.lineTo(x + 6, FR - 66); c.lineTo(x, FR - 74); c.fill();
    }
  }, { t: 6.4, d: 0.8, reveal: 'fade' });
}

function sanFrancisco(p, r) {
  const x0 = 110, x1 = 560, base = 1640;
  p.group('town', { x: x0 - 30, y: 1290, w: x1 - x0 + 60, h: base - 1290 + 40 }, (c) => {
    // the stepped atrium in front
    for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? '#b9ad9c' : '#a89c8c'; c.fillRect(x0 - 20 + k * 6, base + k * 6 - 30, x1 - x0 + 40 - k * 12, 6); }
    // the church front: a gray stone center between white walls
    c.fillStyle = WALL; c.fillRect(x0, 1460, x1 - x0, base - 1460 - 30);
    c.fillStyle = '#b5ab9c'; c.fillRect(x0 + 150, 1420, 150, base - 1420 - 30);
    c.fillStyle = '#a19584'; poly(c, [[x0 + 140, 1422], [x0 + 310, 1422], [x0 + 225, 1380]]); c.fill();
    c.fillStyle = '#4a3a48'; c.beginPath(); c.moveTo(x0 + 200, base - 30); c.lineTo(x0 + 200, 1540); c.arc(x0 + 225, 1540, 25, Math.PI, 0); c.lineTo(x0 + 250, base - 30); c.fill();
    c.strokeStyle = '#857a6c'; c.lineWidth = 2; c.beginPath();
    for (const xx of [x0 + 168, x0 + 186, x0 + 264, x0 + 282]) { c.moveTo(xx, base - 30); c.lineTo(xx, 1450); }
    c.moveTo(x0 + 150, 1500); c.lineTo(x0 + 300, 1500); c.stroke();
    c.fillStyle = GOLD_L; c.beginPath(); c.arc(x0 + 225, 1470, 10, 0, Math.PI * 2); c.fill();
    // the two bell towers
    for (const tx of [x0 + 30, x0 + 360]) {
      c.fillStyle = WALL; c.fillRect(tx, 1350, 70, base - 1350 - 30);
      c.fillStyle = WALL_S; c.fillRect(tx + 56, 1350, 14, base - 1350 - 30);
      c.fillStyle = '#4a3a48';
      for (const ox of [12, 40]) { c.beginPath(); c.moveTo(tx + ox, 1410); c.lineTo(tx + ox, 1376); c.arc(tx + ox + 9, 1376, 9, Math.PI, 0); c.lineTo(tx + ox + 18, 1410); c.fill(); }
      c.fillStyle = '#d8cebf'; c.fillRect(tx - 4, 1344, 78, 8); c.fillRect(tx - 4, 1414, 78, 6);
      c.fillStyle = WALL; c.beginPath(); c.arc(tx + 35, 1344, 30, Math.PI, 0); c.fill();
      c.fillStyle = WALL_S; c.beginPath(); c.arc(tx + 35, 1344, 30, Math.PI * 1.6, 0); c.lineTo(tx + 35, 1344); c.fill();
      c.fillStyle = WALL; c.fillRect(tx + 30, 1300, 10, 16); c.beginPath(); c.arc(tx + 35, 1300, 7, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(60,40,50,.45)'; c.lineWidth = 1; c.strokeRect(tx, 1350, 70, base - 1350 - 30);
    }
    c.strokeStyle = 'rgba(60,40,50,.4)'; c.lineWidth = 1; c.strokeRect(x0, 1460, x1 - x0, base - 1460 - 30);
  }, { t: 3.4, d: 0.9, reveal: 'rise' });
}

// green-tiled domes with gold lanterns, between the roofs to the left of the basilica
function domes(p, r) {
  for (const [x, y, rad, t] of [[650, 1506, 50, 4.4], [744, 1516, 34, 4.5]]) {
    p.group('town', { x: x - rad - 10, y: y - rad * 2.3, w: rad * 2 + 20, h: rad * 2.4 + 40 }, (c) => {
      c.fillStyle = WALL; c.fillRect(x - rad * 0.95, y - 6, rad * 1.9, 40);
      c.fillStyle = '#2f7a5e'; c.beginPath(); c.arc(x, y - 6, rad, Math.PI, 0); c.fill();
      // the tiles: ribs and courses
      c.save(); c.beginPath(); c.arc(x, y - 6, rad, Math.PI, 0); c.clip();
      c.strokeStyle = '#1e5a44'; c.lineWidth = 1;
      c.beginPath(); for (let k = 1; k < 6; k++) { c.moveTo(x - rad, y - 6 - rad * k / 6); c.lineTo(x + rad, y - 6 - rad * k / 6); } c.stroke();
      c.strokeStyle = GOLD; c.lineWidth = 1.6;
      c.beginPath(); for (let k = -3; k <= 3; k++) { c.moveTo(x + k * rad / 3.5, y - 6); c.quadraticCurveTo(x + k * rad / 5, y - 6 - rad * 0.8, x, y - 6 - rad); } c.stroke();
      c.fillStyle = 'rgba(255,240,200,.25)'; c.beginPath(); c.arc(x - rad * 0.35, y - 6 - rad * 0.45, rad * 0.4, 0, Math.PI * 2); c.fill();
      c.restore();
      c.fillStyle = WALL; c.fillRect(x - 6, y - 6 - rad - 16, 12, 16);
      c.fillStyle = GOLD; c.beginPath(); c.arc(x, y - 6 - rad - 20, 5, 0, Math.PI * 2); c.fill();
    }, { t, d: 0.7, reveal: 'rise' });
  }
}

// ---------------------------------------------------------------------------
// the basilica

// a pointed (lancet) arch as a path: foot at y, springing at ys
function lancet(c, x0, x1, y, ys) {
  const w = x1 - x0, cx = (x0 + x1) / 2, rise = w * 0.85;
  c.moveTo(x0, y); c.lineTo(x0, ys);
  c.quadraticCurveTo(x0, ys - rise * 0.6, cx, ys - rise);
  c.quadraticCurveTo(x1, ys - rise * 0.6, x1, ys);
  c.lineTo(x1, y); c.closePath();
}
// stone coursing over a face
function ashlar(c, x0, x1, y0, y1, h = 16) {
  c.strokeStyle = JOINT; c.lineWidth = 1;
  c.beginPath();
  for (let y = y1 - h, k = 0; y > y0; y -= h, k++) {
    c.moveTo(x0, y); c.lineTo(x1, y);
    for (let x = x0 + (k % 2 ? 18 : 0) + 12; x < x1; x += 36) { c.moveTo(x, y); c.lineTo(x, y + h); }
  }
  c.stroke();
}
// a pinnacle: a slim shaft with a crocketed spike
function pinnacle(c, x, y, w, h, col = STONE) {
  c.fillStyle = col;
  c.fillRect(x - w / 2, y - h * 0.45, w, h * 0.45);
  c.beginPath(); c.moveTo(x - w / 2 - 2, y - h * 0.45); c.lineTo(x, y - h); c.lineTo(x + w / 2 + 2, y - h * 0.45); c.closePath(); c.fill();
  c.strokeStyle = STONE_S; c.lineWidth = 1.2;
  c.beginPath(); for (let k = 1; k < 5; k++) { const t = k / 5, yy = lerp(y - h * 0.45, y - h, t), hw = (w / 2 + 2) * (1 - t); c.moveTo(x - hw, yy); c.lineTo(x - hw - 3, yy - 3); c.moveTo(x + hw, yy); c.lineTo(x + hw + 3, yy - 3); } c.stroke();
  c.fillStyle = GOLD; c.beginPath(); c.arc(x, y - h - 2, 2.6, 0, Math.PI * 2); c.fill();
}

// the stages of a tower, from the foot up: [top y, kind]
const STAGES = [[1250, 'portal'], [1066, 'lancets'], [890, 'tall'], [730, 'clock'], [570, 'belfry'], [520, 'crown']];

function basilica(p, r) {
  const stone = (c, x0, x1, y0, y1) => {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, mix(STONE_L, GLOW, 0.3)); g.addColorStop(0.5, STONE); g.addColorStop(1, mix(STONE, STONE_D, 0.6));
    c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  };
  // side chapels with their flying buttresses, out beyond the towers
  for (const s of [-1, 1]) {
    const xa = s < 0 ? X0 - 120 : X1, xb = s < 0 ? X0 : X1 + 120;
    p.group('church', { x: xa - 30, y: 1120, w: 180, h: BY - 1120 + 6 }, (c) => {
      c.fillStyle = mix(STONE, STONE_D, 0.45); c.fillRect(xa, 1300, xb - xa, BY - 1300);
      c.fillStyle = '#7d6f80'; poly(c, [[xa, 1300], [xb, 1300], [s < 0 ? xb : xa, 1250]]); c.fill();
      ashlar(c, xa, xb, 1300, BY, 14);
      // a buttress pier with a pinnacle, an arch flying in to the wall
      const px = s < 0 ? xa + 26 : xb - 26;
      c.fillStyle = STONE; c.fillRect(px - 12, 1220, 24, BY - 1220);
      pinnacle(c, px, 1220, 16, 80);
      c.strokeStyle = STONE; c.lineWidth = 9; c.beginPath(); c.moveTo(px, 1250); c.quadraticCurveTo((px + (s < 0 ? xb : xa)) / 2, 1236, s < 0 ? xb : xa, 1200); c.stroke();
      c.fillStyle = '#4b3f58'; c.beginPath(); lancet(c, (xa + xb) / 2 - 12, (xa + xb) / 2 + 12, 1450, 1370); c.fill();
      c.fillStyle = GOLD_L; c.globalAlpha = 0.7; c.beginPath(); lancet(c, (xa + xb) / 2 - 7, (xa + xb) / 2 + 7, 1446, 1374); c.fill(); c.globalAlpha = 1;
    }, { t: 4.6, d: 0.8, reveal: 'rise' });
  }

  // the nave's gable wall, between the towers, built in stages
  const NX0 = LT[1], NX1 = RT[0];
  p.group('church', { x: NX0 - 4, y: 900, w: NX1 - NX0 + 8, h: BY - 900 + 6 }, (c) => {
    stone(c, NX0, NX1, 900, BY);
    ashlar(c, NX0, NX1, 900, BY);
  }, { t: 5.0, d: 1.4, reveal: 'rise', ease: 'inOut' });
  // the slender openwork spire over the crossing, seen above the gable
  p.group('church', { x: CX - 50, y: 480, w: 100, h: 260 }, (c) => {
    c.fillStyle = mix(STONE, STONE_D, 0.25); c.fillRect(CX - 24, 640, 48, 100);
    c.fillStyle = '#463a56'; for (const dx of [-16, 4]) { c.beginPath(); lancet(c, CX + dx, CX + dx + 12, 728, 664); c.fill(); }
    c.fillStyle = STONE_S; c.fillRect(CX - 28, 634, 56, 6);
    const g = c.createLinearGradient(CX - 22, 0, CX + 22, 0); g.addColorStop(0, mix(STONE_L, GLOW, 0.4)); g.addColorStop(0.5, STONE); g.addColorStop(0.51, STONE_D); g.addColorStop(1, STONE_S);
    c.fillStyle = g; poly(c, [[CX - 22, 636], [CX, 500], [CX + 22, 636]]); c.fill();
    c.fillStyle = '#463a56'; for (let k = 0; k < 4; k++) { const y = 616 - k * 26, hw = 3 + (3 - k) * 1.2; c.fillRect(CX - hw, y - 10, hw * 2, 12); }
    for (const px of [CX - 26, CX + 26]) pinnacle(c, px, 640, 8, 56);
    c.fillStyle = GOLD; c.beginPath(); c.arc(CX, 496, 4, 0, Math.PI * 2); c.fill();
  }, { t: 6.3, d: 0.6, reveal: 'rise' });
  // the gable: a steep triangle with pinnacles, the roof ridge behind
  p.group('church', { x: NX0 - 30, y: 640, w: NX1 - NX0 + 60, h: 280 }, (c) => {
    c.fillStyle = '#56607a'; poly(c, [[NX0 + 10, 902], [CX, 690], [NX1 - 10, 902]]); c.fill();
    const g = c.createLinearGradient(0, 700, 0, 910); g.addColorStop(0, mix(STONE_L, GLOW, 0.4)); g.addColorStop(1, STONE);
    c.fillStyle = g; poly(c, [[NX0, 910], [CX, 716], [NX1, 910]]); c.fill();
    // the trefoil window in the gable
    c.fillStyle = '#4b3f58';
    for (const [dx, dy] of [[0, -16], [-14, 8], [14, 8]]) { c.beginPath(); c.arc(CX + dx, 830 + dy, 14, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = GOLD; for (const [dx, dy] of [[0, -16], [-14, 8], [14, 8]]) { c.beginPath(); c.arc(CX + dx, 830 + dy, 8, 0, Math.PI * 2); c.fill(); }
    // crockets along the raking edges
    c.fillStyle = STONE_L;
    for (let k = 1; k < 9; k++) { const t = k / 9; for (const s of [-1, 1]) { const x = lerp(s < 0 ? NX0 : NX1, CX, t), y = lerp(910, 716, t); c.beginPath(); c.arc(x + s * 4, y - 4, 4.5, 0, Math.PI * 2); c.fill(); } }
    pinnacle(c, CX, 716, 14, 70, STONE_L);
    c.strokeStyle = STONE_S; c.lineWidth = 1.4; poly(c, [[NX0, 910], [CX, 716], [NX1, 910]]); c.stroke();
  }, { t: 6.4, d: 0.8, reveal: 'rise' });

  // the two towers, stage over stage
  [LT, RT].forEach(([ta, tb], ti) => {
    let yBot = BY;
    STAGES.forEach(([yTop, kind], si) => {
      const inset = si * 6, a = ta + inset, b = tb - inset;
      const t = 5.3 + si * 0.42 + ti * 0.1;
      const y0 = yTop, y1 = yBot;
      p.group('church', { x: a - 30, y: y0 - 52, w: b - a + 60, h: y1 - y0 + 56 }, (c) => towerStage(c, a, b, y0, y1, kind, ti, stone), { t, d: 0.7, reveal: 'rise' });
      yBot = yTop;
    });
    // the spire: a steep stone pyramid with crockets and a gold finial, four pinnacles round it
    const a = ta + 36, b = tb - 36, mid = (ta + tb) / 2;
    p.group('church', { x: ta - 10, y: 230, w: TW + 20, h: 300 }, (c) => {
      const g = c.createLinearGradient(a, 0, b, 0); g.addColorStop(0, mix(STONE_L, GLOW, 0.45)); g.addColorStop(0.55, STONE); g.addColorStop(0.56, STONE_D); g.addColorStop(1, mix(STONE_D, STONE_S, 0.4));
      c.fillStyle = g; poly(c, [[a, 520], [mid, 300], [b, 520]]); c.fill();
      c.strokeStyle = 'rgba(70,52,60,.35)'; c.lineWidth = 1; c.beginPath();
      for (let k = 1; k < 12; k++) { const t = k / 12, y = lerp(520, 300, t); c.moveTo(lerp(a, mid, t), y); c.lineTo(lerp(b, mid, t), y); } c.stroke();
      c.fillStyle = STONE_L;
      for (let k = 1; k < 9; k++) { const t = k / 9; for (const s of [-1, 1]) { const x = lerp(s < 0 ? a : b, mid, t), y = lerp(520, 300, t); c.beginPath(); c.arc(x + s * 4, y - 2, 3.6, 0, Math.PI * 2); c.fill(); } }
      for (const px of [ta + 14, tb - 14]) pinnacle(c, px, 524, 14, 110);
      for (const px of [ta + 50, tb - 50]) pinnacle(c, px, 524, 10, 70);
      c.strokeStyle = GOLD; c.lineWidth = 3; c.beginPath(); c.moveTo(mid, 300); c.lineTo(mid, 262); c.stroke();
      c.fillStyle = GOLD; c.beginPath(); c.arc(mid, 286, 5, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(mid, 248); c.lineTo(mid + 6, 262); c.lineTo(mid, 268); c.lineTo(mid - 6, 262); c.closePath(); c.fill();
    }, { t: 8.0 + ti * 0.2, d: 0.8, reveal: 'rise' });
  });

  // the central portal: deep pointed archivolts
  p.group('detail', { x: CX - 90, y: 1180, w: 180, h: BY - 1180 + 6 }, (c) => {
    for (let k = 0; k < 5; k++) {
      const w = 160 - k * 18;
      c.fillStyle = k % 2 ? STONE_D : mix(STONE, STONE_D, 0.35);
      c.beginPath(); lancet(c, CX - w / 2, CX + w / 2, BY, 1330 + k * 6); c.fill();
    }
    c.fillStyle = '#3c3046'; c.beginPath(); lancet(c, CX - 36, CX + 36, BY, 1360); c.fill();
    // the doors and the tympanum with tracery
    c.fillStyle = '#5a3a2a'; c.fillRect(CX - 34, 1386, 68, BY - 1386);
    c.strokeStyle = GOLD; c.lineWidth = 1.2; c.beginPath(); c.moveTo(CX, 1386); c.lineTo(CX, BY); for (let y = 1396; y < BY; y += 14) { c.moveTo(CX - 30, y); c.lineTo(CX + 30, y); } c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.arc(CX, 1352, 16, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3c3046'; for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; c.beginPath(); c.arc(CX + Math.cos(a) * 9, 1352 + Math.sin(a) * 9, 3.6, 0, Math.PI * 2); c.fill(); }
  }, { t: 6.0, d: 0.7, reveal: 'rise' });
  // a gallery of little pointed arches over the portal
  p.group('detail', { x: NX0, y: 1150, w: NX1 - NX0, h: 70 }, (c) => {
    c.fillStyle = mix(STONE, STONE_D, 0.3); c.fillRect(NX0 + 6, 1210, NX1 - NX0 - 12, 6);
    for (let k = 0; k < 9; k++) {
      const w = (NX1 - NX0 - 24) / 9, x = NX0 + 12 + k * w;
      c.fillStyle = '#4b3f58'; c.beginPath(); lancet(c, x + 4, x + w - 4, 1208, 1180); c.fill();
      c.fillStyle = STONE_L; c.fillRect(x + w - 3, 1166, 3, 44);
    }
  }, { t: 6.2, d: 0.7, reveal: 'wipe' });
  // the rose window: its wheel of tracery, the glass glowing
  const RY = 1035, RR = 92;
  p.group('detail', { x: CX - RR - 24, y: RY - RR - 24, w: RR * 2 + 48, h: RR * 2 + 48 }, (c) => {
    c.fillStyle = mix(STONE, STONE_D, 0.35); c.beginPath(); c.arc(CX, RY, RR + 16, 0, Math.PI * 2); c.fill();
    c.fillStyle = STONE_L; c.beginPath(); c.arc(CX, RY, RR + 6, 0, Math.PI * 2); c.fill();
    const g = c.createRadialGradient(CX, RY, 6, CX, RY, RR);
    g.addColorStop(0, GOLD_L); g.addColorStop(0.5, GOLD); g.addColorStop(0.8, '#b5482e'); g.addColorStop(1, '#3a3a7a');
    c.fillStyle = g; c.beginPath(); c.arc(CX, RY, RR, 0, Math.PI * 2); c.fill();
    c.strokeStyle = STONE_L; c.lineWidth = 4;
    c.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; c.moveTo(CX + Math.cos(a) * 20, RY + Math.sin(a) * 20); c.lineTo(CX + Math.cos(a) * RR, RY + Math.sin(a) * RR); } c.stroke();
    c.lineWidth = 3; c.beginPath(); c.arc(CX, RY, 20, 0, Math.PI * 2); c.moveTo(CX + RR * 0.6, RY); c.arc(CX, RY, RR * 0.6, 0, Math.PI * 2); c.stroke();
    c.beginPath(); for (let k = 0; k < 16; k++) { const a = ((k + 0.5) / 16) * Math.PI * 2; const x = CX + Math.cos(a) * RR * 0.8, y = RY + Math.sin(a) * RR * 0.8; c.moveTo(x + 9, y); c.arc(x, y, 9, 0, Math.PI * 2); } c.stroke();
  }, { t: 7.0, d: 1.0, reveal: 'iris', ease: 'inOut' });
  // gargoyles: beasts at the towers' corners, looking out over the town
  const garg = [];
  for (const [ta, tb] of [LT, RT]) for (const y of [1066, 890, 730]) { garg.push([ta + (STAGES.findIndex((s) => s[0] === y) + 1) * 6, y, -1]); garg.push([tb - (STAGES.findIndex((s) => s[0] === y) + 1) * 6, y, 1]); }
  garg.forEach(([x, y, s], i) => {
    p.group('detail', { x: x + (s < 0 ? -70 : -6), y: y - 30, w: 78, h: 50 }, (c) => gargoyle(c, x, y + 4, s, i), { t: 8.6 + i * 0.06, d: 0.5, reveal: 'pop' });
  });
}

// one stage of a tower
function towerStage(c, a, b, y0, y1, kind, ti, stone) {
  stone(c, a, b, y0, y1);
  ashlar(c, a, b, y0, y1);
  const w = b - a, mid = (a + b) / 2;
  // corner buttresses: lit on the left, in shade on the right
  c.fillStyle = mix(STONE_L, GLOW, 0.25); c.fillRect(a, y0, 14, y1 - y0);
  c.fillStyle = mix(STONE_D, STONE_S, 0.3); c.fillRect(b - 14, y0, 14, y1 - y0);
  // a string course at the top of the stage
  c.fillStyle = STONE_S; c.fillRect(a - 4, y0, w + 8, 5);
  c.fillStyle = STONE_L; c.fillRect(a - 4, y0 + 5, w + 8, 3);
  c.fillStyle = '#463a56';
  if (kind === 'portal') {
    for (let k = 0; k < 3; k++) { c.fillStyle = k % 2 ? STONE_D : mix(STONE, STONE_D, 0.4); c.beginPath(); lancet(c, mid - 44 + k * 10, mid + 44 - k * 10, y1, y1 - 120 + k * 4); c.fill(); }
    c.fillStyle = '#5a3a2a'; c.fillRect(mid - 22, y1 - 96, 44, 96);
    c.fillStyle = '#3c3046'; c.beginPath(); lancet(c, mid - 22, mid + 22, y1 - 96, y1 - 112); c.fill();
    c.fillStyle = GOLD; c.beginPath(); c.arc(mid, y1 - 120, 6, 0, Math.PI * 2); c.fill();
  } else if (kind === 'lancets' || kind === 'tall') {
    const ww = kind === 'tall' ? 22 : 18, top = y0 + 46, bot = y1 - 22;
    for (const dx of [-ww - 6, 6]) {
      c.fillStyle = '#463a56'; c.beginPath(); lancet(c, mid + dx, mid + dx + ww, bot, top); c.fill();
      c.fillStyle = 'rgba(246,220,138,.75)'; c.beginPath(); lancet(c, mid + dx + 4, mid + dx + ww - 4, bot - 4, top + 4); c.fill();
      c.strokeStyle = '#463a56'; c.lineWidth = 1.6; c.beginPath(); for (let y = top + 10; y < bot; y += 16) { c.moveTo(mid + dx, y); c.lineTo(mid + dx + ww, y); } c.stroke();
    }
    // a hood molding over the pair
    c.strokeStyle = STONE_L; c.lineWidth = 3; c.beginPath(); c.moveTo(mid - ww - 14, top + 4); c.quadraticCurveTo(mid - ww, top - 30, mid, top - 40); c.quadraticCurveTo(mid + ww, top - 30, mid + ww + 14, top + 4); c.stroke();
  } else if (kind === 'clock') {
    const cy = (y0 + y1) / 2 + 6, R = Math.min(w * 0.3, 44);
    c.fillStyle = STONE_S; c.beginPath(); c.arc(mid, cy, R + 8, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD; c.beginPath(); c.arc(mid, cy, R + 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1d2650'; c.beginPath(); c.arc(mid, cy, R, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD_L; c.lineWidth = 2;
    c.beginPath(); for (let k = 0; k < 12; k++) { const an = (k / 12) * Math.PI * 2; c.moveTo(mid + Math.cos(an) * R * 0.78, cy + Math.sin(an) * R * 0.78); c.lineTo(mid + Math.cos(an) * R * 0.94, cy + Math.sin(an) * R * 0.94); } c.stroke();
    // small gable over the clock
    c.fillStyle = STONE_L; poly(c, [[mid - R - 14, y0 + 30], [mid, y0 - 10], [mid + R + 14, y0 + 30]]); c.fill();
    c.fillStyle = STONE_S; poly(c, [[mid - R - 4, y0 + 30], [mid, y0 + 4], [mid + R + 4, y0 + 30]]); c.fill();
  } else if (kind === 'belfry') {
    for (const dx of [-30, 4]) {
      c.fillStyle = '#2c2440'; c.beginPath(); lancet(c, mid + dx, mid + dx + 26, y1 - 14, y0 + 44); c.fill();
      c.strokeStyle = mix(STONE, STONE_D, 0.5); c.lineWidth = 3; c.beginPath(); for (let y = y0 + 54; y < y1 - 14; y += 10) { c.moveTo(mid + dx + 2, y); c.lineTo(mid + dx + 24, y + 4); } c.stroke();
    }
  } else if (kind === 'crown') {
    // an openwork balustrade of quatrefoils
    c.fillStyle = '#463a56';
    for (let x = a + 18; x < b - 18; x += 14) { c.beginPath(); c.arc(x + 7, (y0 + y1) / 2 + 2, 4.4, 0, Math.PI * 2); c.fill(); }
  }
  c.strokeStyle = 'rgba(70,52,70,.45)'; c.lineWidth = 1.2; c.strokeRect(a, y0, w, y1 - y0);
  // the corner buttresses end in pinnacles at the top of each stage
  if (kind === 'lancets' || kind === 'tall' || kind === 'clock' || kind === 'belfry') { pinnacle(c, a + 7, y0, 10, 44); pinnacle(c, b - 7, y0, 10, 44); }
}

// a gargoyle: a stone beast (a condor, an iguana or a turtle) jutting from a corner
function gargoyle(c, x, y, s, i) {
  c.save(); c.translate(x, y); c.scale(s * 1.35, 1.35);
  c.fillStyle = mix(STONE, STONE_D, 0.4); c.strokeStyle = STONE_S; c.lineWidth = 1.2;
  const kind = i % 3;
  c.beginPath();
  if (kind === 0) { // a condor's head and neck
    c.moveTo(0, -6); c.lineTo(26, -8); c.quadraticCurveTo(38, -12, 42, -4); c.lineTo(46, 2); c.lineTo(38, 0); c.lineTo(30, 4); c.lineTo(0, 6);
  } else if (kind === 1) { // an iguana: long, with a crest
    c.moveTo(0, -4); c.lineTo(8, -10); c.lineTo(12, -6); c.lineTo(18, -12); c.lineTo(22, -6); c.lineTo(28, -11); c.lineTo(34, -5); c.quadraticCurveTo(46, -4, 46, 2); c.lineTo(30, 4); c.lineTo(0, 6);
  } else { // a turtle
    c.moveTo(0, -2); c.quadraticCurveTo(12, -16, 28, -8); c.lineTo(36, -6); c.quadraticCurveTo(44, -6, 44, 0); c.lineTo(34, 2); c.quadraticCurveTo(16, 8, 0, 6);
  }
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#2c2440'; c.beginPath(); c.arc(kind === 2 ? 38 : 36, -3, 1.6, 0, Math.PI * 2); c.fill();
  c.restore();
}

// ---------------------------------------------------------------------------
// the frieze: carved scrolls gilded on red bole, the equator's line along its top

function frieze(p, r) {
  p.group('frieze', { x: 0, y: FR - 4, w: W, h: H - FR + 4 }, (c) => {
    c.fillStyle = BOLE; c.fillRect(0, FR, W, H - FR);
    c.fillStyle = BOLE_D; c.fillRect(0, FR, W, 6); c.fillRect(0, H - 14, W, 14);
    // gilt moldings: a bead row and a fillet top and bottom
    c.fillStyle = GOLD; c.fillRect(0, FR + 6, W, 5); c.fillRect(0, H - 26, W, 5);
    c.fillStyle = GOLD_L; for (let x = 6; x < W; x += 12) { c.beginPath(); c.arc(x, H - 34, 3, 0, Math.PI * 2); c.fill(); }
  }, { t: 0.3, d: 0.8, reveal: 'rise' });
  // the scrolls: pairs of C-scrolls meeting at a rosette, with acanthus leaves
  const units = [];
  const UW = 220, cy = FR + 128;
  for (let ux = -UW / 2; ux < W + UW; ux += UW) units.push(ux);
  const scroll = (c, x, y, s, flip) => {
    c.save(); c.translate(x, y); c.scale(flip * s, s);
    c.beginPath(); c.moveTo(0, 0);
    c.bezierCurveTo(20, -48, 78, -48, 86, -8); c.bezierCurveTo(90, 14, 68, 22, 58, 8); c.bezierCurveTo(52, -2, 62, -12, 70, -6);
    c.stroke();
    // leaves along the scroll
    c.beginPath();
    for (const [lx, ly, a] of [[18, -26, -0.9], [38, -38, -0.3], [60, -36, 0.3]]) { c.save(); c.translate(lx, ly); c.rotate(a); c.moveTo(0, 0); c.quadraticCurveTo(6, -14, 0, -22); c.quadraticCurveTo(-6, -14, 0, 0); c.restore(); }
    c.fill();
    c.restore();
  };
  units.forEach((ux, i) => {
    const x = ux + UW / 2;
    p.group('frieze', { x: x - UW / 2 - 20, y: FR + 30, w: UW + 40, h: 170 }, (c) => {
      // the shadowed carving under the gilt
      for (const [col, dx, dy] of [[BOLE_D, 2, 3], [GOLD, 0, 0]]) {
        c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 7.5; c.lineCap = 'round';
        c.save(); c.translate(dx, dy);
        scroll(c, x - 14, cy + 10, 1.12, -1); scroll(c, x + 14, cy + 10, 1.12, 1);
        // the lower scrolls, small and turned the other way
        c.save(); c.translate(x, cy + 34); c.scale(1, -1); scroll(c, -10, 0, 0.55, -1); scroll(c, 10, 0, 0.55, 1); c.restore();
        c.restore();
      }
      // the rosette where they meet
      c.fillStyle = GOLD_L; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.beginPath(); c.ellipse(x + Math.cos(a) * 10, cy + 12 + Math.sin(a) * 10, 7, 4, a, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#b5482e'; c.beginPath(); c.arc(x, cy + 12, 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD_L; c.beginPath(); c.arc(x - 2, cy + 10, 2, 0, Math.PI * 2); c.fill();
      // highlights where the light catches the carving
      c.strokeStyle = 'rgba(255,240,190,.75)'; c.lineWidth = 1.6;
      c.beginPath(); c.arc(x - 72, cy + 2, 10, Math.PI * 1.1, Math.PI * 1.6); c.arc(x + 72, cy + 2, 10, Math.PI * 1.4, Math.PI * 1.9); c.stroke();
    }, { t: 1.6 + i * 0.16, d: 0.8, reveal: 'iris' });
  });
  // the equator's line along the top: a gilt rule with degree ticks
  const ticks = [];
  for (let x = 0; x <= W; x += 16) ticks.push([[x, FR + 16], [x, FR + 16 + (x % 160 === 0 ? 14 : x % 80 === 0 ? 9 : 5)]]);
  p.strokes('frieze', ticks, GOLD_L, 1.6, { t: 9.6, d: 1.0, reveal: 'wipe', ease: 'inOut', cap: 'butt' });
  p.pen('frieze', [[0, FR + 16], [W, FR + 16]], GOLD_L, 2.4, { t: 9.6, d: 1.0, cap: 'butt' });
}

// ---------------------------------------------------------------------------

function life(p, r) {
  // the clock hands, creeping
  const clocks = [LT, RT].map(([ta, tb]) => [(ta + tb) / 2, (730 + 890) / 2 + 6, Math.min((tb - ta - 18 * 2) * 0.3, 44)]);
  p.live('birds', {
    t: 9.2, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = GOLD_L; c.lineCap = 'round';
      for (const [x, y, R] of clocks) {
        const m = -Math.PI / 2 + (time * 0.25) % (Math.PI * 2) + 0.6, h = -Math.PI / 2 + 5.5 + time * 0.02;
        c.lineWidth = 3.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(h) * R * 0.5, y + Math.sin(h) * R * 0.5); c.stroke();
        c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(m) * R * 0.8, y + Math.sin(m) * R * 0.8); c.stroke();
        c.fillStyle = GOLD_L; c.beginPath(); c.arc(x, y, 3.4, 0, Math.PI * 2); c.fill();
      }
    },
  });
  // swifts wheeling round the towers
  const swifts = Array.from({ length: 12 }, (_, i) => [CX + r.range(-380, 380), r.range(380, 900), r.range(60, 200), r.range(0, 6), r.range(0.3, 0.6) * (i % 2 ? 1 : -1), r.range(0.7, 1.1)]);
  p.live('birds', {
    t: 9.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = INK;
      for (const [x0, y0, rad, ph, sp, s] of swifts) {
        const a = time * sp + ph, x = x0 + Math.cos(a) * rad, y = y0 + Math.sin(a) * rad * 0.3, f = Math.sin(time * 9 + ph) * 0.35;
        c.save(); c.translate(x, y); c.rotate(Math.cos(a) * 0.4 * Math.sign(sp)); c.scale(s, s);
        c.beginPath(); c.moveTo(-12, -2 - f * 6); c.quadraticCurveTo(-4, -2, 0, 0); c.quadraticCurveTo(4, -2, 12, -2 - f * 6); c.quadraticCurveTo(4, 2, 0, 3); c.quadraticCurveTo(-4, 2, -12, -2 - f * 6); c.fill();
        c.restore();
      }
    },
  });
}

// the name in gold script up in the blue, and the caption along the frieze
function title(p, r) {
  p.type('title', 'LATITUD 0° 13\' S', 40, FR + 58, { family: CAPS, weight: 500, size: 20, color: GOLD_L, track: 0.2, t: 10.4, gap: 0.03, d: 0.4, reveal: 'fade' });
  p.type('title', 'ALTITUD 2850 M', W - 40, FR + 58, { family: CAPS, weight: 500, size: 20, color: GOLD_L, align: 'right', track: 0.2, t: 10.6, gap: 0.03, d: 0.4, reveal: 'fade' });
  p.type('title', 'Quito', 372, 470, {
    family: SCRIPT, size: 300, color: GOLD, shadow: 'rgba(8,10,30,.6)', sx: 5, sy: 7, align: 'center',
    t: 10.6, gap: 0.26, d: 1.0, reveal: 'fade',
  });
  // a fine gilt hairline under it, and the country in spaced capitals
  p.pen('title', [[150, 540], [590, 540]], GOLD, 1.6, { t: 12.0, d: 0.7 });
  p.type('title', 'ECUADOR', 370, 590, { family: CAPS, weight: 700, size: 30, color: GOLD_L, align: 'center', track: 0.5, t: 12.3, gap: 0.05, d: 0.5, reveal: 'fade' });
  p.type('title', 'SAN FRANCISCO DE QUITO', W / 2, FR + 60, { family: CAPS, weight: 700, size: 24, color: GOLD_L, align: 'center', track: 0.4, t: 12.6, gap: 0.03, d: 0.5, reveal: 'fade' });
}
