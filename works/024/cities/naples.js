// Naples: a 1950s Italian tourism poster in gouache. We stand at the top of a
// stepped alley in the old town, its two walls running away from us, one in hot
// sun and one in violet shade, laundry strung between them; at the bottom the
// alley opens on the bay: the roofs falling to the shore, Castel Sant'Elmo and the
// Certosa di San Martino on the hill, Castel dell'Ovo on its rock, the port with
// the Lanterna del Molo and Castel Nuovo, and Vesuvius smoking over the water.
// Lemons grow along the margin; the name is brushed in a script across the sky.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, rng, mix } from '../kit.js';

const PAPER = '#f3e8cf';
const SKY0 = '#2f7fc1', SKY1 = '#8cc3e3', SKY2 = '#f4e9c2';
const SEA0 = '#9cc6df', SEA1 = '#2867a8', SEA2 = '#174a8c';
const VES = '#8c7aa8', VES_D = '#6c5b8c', VES_L = '#b7a3c4';
const OCHRE = '#eba33e', CORAL = '#e0663f', ROSE = '#e98c7b', SUNW = '#f6c25a', CREAM = '#f7ecd2';
const SHADE = '#8e4a68', SHADE_D = '#6a3352', SHADE_L = '#b06a7d';
const GREEN = '#2f7d5b', GREEN_D = '#1f5a40', IRON = '#2a2030';
const TUFA = '#dcb57a', TUFA_D = '#a97f52';
const LEMON = '#f5d02a', LEMON_D = '#d9a514', LEAF = '#3d7a3a', LEAF_D = '#255a2a';
const INK = '#3a1f2e', RED = '#c8362c';

export const city = {
  id: 'naples', name: 'Naples',
  alt: "A 1950s gouache poster of Naples seen down a stepped alley hung with laundry, one wall in hot sun and one in violet shade, opening on the bay with Castel Sant'Elmo and the Certosa di San Martino on the hill, Castel dell'Ovo on its rock, the Lanterna del Molo and Castel Nuovo by the port, fishing boats and Vesuvius smoking beyond, lemons along the margin and the name Napoli in a brushed script",
  google: 'family=Kaushan+Script&family=Josefin+Sans:wght@600',
  wall: '#2a1d33',
  fonts: [['400 100px "Kaushan Script"', 'Napoli Golfo di'], ['600 30px "Josefin Sans"', 'ITALIA · CAMPANIA · VESUVIO']],
  build,
};

const M = 50, PB = 1700; // margin; the picture's foot
// the alley in one-point perspective: a point on the near plane (x, y) seen at depth d
const VX = 800, VY = 900, KD = 1 / 0.55 - 1;
const sOf = (d) => 1 / (1 + KD * d);
const P = (x, y, d) => { const s = sOf(d); return [VX + (x - VX) * s, VY + (y - VY) * s]; };
const TOPN = -200, FLOORN = PB; // the walls' cornice and foot, on the near plane
const XL = M, XR = W - M;
const HOR = VY, SHORE = 1150;
const FAR_L = P(XL, 0, 1)[0], FAR_R = P(XR, 0, 1)[0], FLOOR_FAR = P(0, FLOORN, 1)[1];

function build() {
  const p = new Plate({ paper: PAPER, seed: 1953 });
  const r = p.r;
  p.clip = { x: M, y: M, w: W - 2 * M, h: PB - M };
  p.stack('sky', 'far', 'sea', 'hill', 'roofs', 'lwall', 'rwall', 'wdetail', 'floor', 'people', 'lines', 'live', 'title', 'margin');
  p.layer('margin', { clip: false }); p.layer('title', { clip: false });

  sky(p, r);
  vesuvius(p, r);
  sea(p, r);
  hill(p, r);
  port(p, r);
  roofs(p, r);
  walls(p, r);
  floor(p, r);
  lives(p, r);
  laundry(p, r);
  title(p, r);
  margin(p, r);
  return p;
}

function path(c, pts, close = true) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}
// gouache: short soft brush daubs of a lighter or darker paint, decided at build time
function daubs(r, x0, y0, x1, y1, n, len, wid, ang = 0) {
  const out = [];
  for (let i = 0; i < n; i++) out.push([r.range(x0, x1), r.range(y0, y1), len * r.range(0.5, 1.2), wid * r.range(0.6, 1.2), ang + r.range(-0.15, 0.15)]);
  return out;
}
function drawDaubs(c, list, color) {
  c.strokeStyle = color; c.lineCap = 'round';
  for (const [x, y, l, w, a] of list) {
    c.lineWidth = w; c.beginPath(); c.moveTo(x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2); c.lineTo(x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2); c.stroke();
  }
}

// ================================================================ the sky and the sun
function sky(p, r) {
  const y0 = M, y1 = HOR + 4;
  const bands = daubs(r, M, y0, W - M, y1 - 40, 220, 160, 14);
  const pale = daubs(r, M, 600, W - M, y1, 90, 200, 10);
  p.group('sky', { x: M, y: y0, w: W - 2 * M, h: y1 - y0 }, (c) => {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, SKY0); g.addColorStop(0.55, SKY1); g.addColorStop(1, SKY2);
    c.fillStyle = g; c.fillRect(M, y0, W - 2 * M, y1 - y0);
  }, { t: 0.2, d: 1.0, reveal: 'fall', ease: 'inOut' });
  p.group('sky', { x: M, y: y0, w: W - 2 * M, h: y1 - y0 }, (c) => {
    c.globalAlpha = 0.16; drawDaubs(c, bands, '#ffffff');
    c.globalAlpha = 0.22; drawDaubs(c, pale, SKY2);
  }, { t: 0.9, d: 1.0, reveal: 'fall' });
  // the sun, high on the right: a hot white disc in rings of light
  const sx = 1190, sy = 120;
  p.group('sky', { x: sx - 190, y: sy - 190, w: 380, h: 380 }, (c) => {
    for (let k = 4; k >= 1; k--) { c.fillStyle = `rgba(255,244,200,${0.1 + 0.05 * (4 - k)})`; c.beginPath(); c.arc(sx, sy, 50 + k * 32, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(sx, sy, 56, 0, Math.PI * 2); c.fill();
  }, { t: 1.2, d: 1.0, reveal: 'iris' });
  // a few flat summer clouds over the hill
  const clouds = [[520, 560, 150], [700, 600, 90], [420, 640, 70]];
  p.group('sky', { x: 330, y: 500, w: 560, h: 180 }, (c) => {
    c.fillStyle = 'rgba(255,250,236,0.85)';
    for (const [x, y, w] of clouds) {
      c.beginPath(); c.ellipse(x, y, w, w * 0.16, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x - w * 0.2, y - w * 0.12, w * 0.45, w * 0.17, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x + w * 0.25, y - w * 0.08, w * 0.35, w * 0.14, 0, 0, Math.PI * 2); c.fill();
    }
  }, { t: 1.6, d: 1.0, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ Vesuvius, its plume, the far shore
const VES_PTS = [[560, HOR + 4], [640, 860], [720, 800], [780, 752], [812, 730], [828, 712], [846, 722], [862, 706], [884, 716], [904, 738], [934, 744],
  [968, 700], [1002, 664], [1022, 654], [1060, 650], [1092, 656], [1120, 682], [1160, 740], [1210, 812], [1280, 870], [1340, HOR + 4]];
function vesuvius(p, r) {
  // the mountain: lilac, its sunny flank lighter, gullies down the cone
  const gullies = [];
  for (let k = 0; k < 16; k++) {
    const x = lerp(1010, 1110, k / 15), y = 660 + Math.abs(k - 7) * 1.2;
    const ex = x + (x - 1060) * 2.6 + r.range(-12, 12);
    gullies.push([[x, y], [lerp(x, ex, 0.5) + r.range(-6, 6), lerp(y, HOR - 10, 0.5)], [ex, HOR - 6 - r.range(0, 30)]]);
  }
  const somma = [];
  for (let k = 0; k < 12; k++) { const x = r.range(700, 920); somma.push([[x, 760 + r.range(-20, 10)], [x - r.range(10, 40), HOR - r.range(10, 60)]]); }
  p.group('far', boxOf(VES_PTS, 8), (c) => {
    c.fillStyle = VES; path(c, VES_PTS); c.fill();
    // the shade on the left of the cone and the Somma
    c.fillStyle = VES_D; path(c, [[968, 700], [1002, 664], [1022, 654], [1040, 652], [1010, 760], [990, 900], [560, HOR + 4], [640, 860], [720, 800], [780, 752], [812, 730], [828, 712], [846, 722], [862, 706], [884, 716], [904, 738], [934, 744]]); c.globalAlpha = 0.55; c.fill(); c.globalAlpha = 1;
    c.strokeStyle = VES_L; c.lineWidth = 3; c.globalAlpha = 0.7;
    c.beginPath(); for (const g of gullies) { c.moveTo(g[0][0], g[0][1]); c.quadraticCurveTo(g[1][0], g[1][1], g[2][0], g[2][1]); } c.stroke();
    c.strokeStyle = VES_D; c.lineWidth = 2.5; c.beginPath(); for (const g of somma) { c.moveTo(g[0][0], g[0][1]); c.lineTo(g[1][0], g[1][1]); } c.stroke();
    c.globalAlpha = 1;
    // a green skirt of vineyards at the foot
    c.fillStyle = mix(VES, '#5d8a5a', 0.45);
    c.beginPath(); c.moveTo(560, HOR + 4); c.quadraticCurveTo(900, 856, 1340, HOR + 4); c.fill();
  }, { t: 1.6, d: 1.4, reveal: 'rise' });
  // the plume, a soft column drifting left, painted in creamy puffs
  const puffs = [];
  for (let i = 0; i < 26; i++) {
    const u = i / 25;
    puffs.push([1060 - u * 300 - u * u * 120 + r.range(-14, 14), 640 - u * 330 + r.range(-10, 10), 26 + u * 58 + r.range(-6, 6)]);
  }
  p.group('far', { x: 560, y: 220, w: 600, h: 450 }, (c) => {
    c.fillStyle = 'rgba(214,196,214,0.55)';
    c.beginPath(); for (const [x, y, s] of puffs) { c.moveTo(x + s + 8, y + 8); c.arc(x + 6, y + 8, s, 0, Math.PI * 2); } c.fill();
    c.fillStyle = 'rgba(250,242,236,0.8)';
    c.beginPath(); for (const [x, y, s] of puffs) { c.moveTo(x + s * 0.8, y); c.arc(x, y, s * 0.8, 0, Math.PI * 2); } c.fill();
  }, { t: 2.4, d: 1.6, reveal: 'rise', ease: 'soft' });
  // the towns along the far shore: white cubes on the water's edge
  const towns = [];
  for (let x = 600; x < 1320; x += r.range(5, 11)) towns.push([x, HOR - r.range(2, 12), r.range(4, 9), r.chance(0.3)]);
  p.group('far', { x: 580, y: HOR - 30, w: 760, h: 40 }, (c) => {
    for (const [x, y, w, pink] of towns) { c.fillStyle = pink ? '#f1c6b4' : '#fbf3e4'; c.fillRect(x, y, w, HOR + 2 - y); }
    c.fillStyle = 'rgba(90,70,110,0.5)'; for (const [x, y, w] of towns) c.fillRect(x + w * 0.6, y, w * 0.4, HOR + 2 - y);
  }, { t: 2.9, d: 0.8, reveal: 'wipe' });
}

// ================================================================ the bay
function sea(p, r) {
  const y0 = HOR, y1 = SHORE + 10;
  const glints = [];
  for (let i = 0; i < 260; i++) {
    const y = r.range(y0 + 6, y1), k = (y - y0) / (y1 - y0);
    glints.push([r.range(FAR_L - 20, FAR_R + 20), y, 6 + k * 34 * r.range(0.4, 1), 1 + k * 2.2]);
  }
  p.group('sea', { x: M, y: y0 - 2, w: W - 2 * M, h: y1 - y0 + 6 }, (c) => {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, SEA0); g.addColorStop(0.25, SEA1); g.addColorStop(1, SEA2);
    c.fillStyle = g; c.fillRect(M, y0, W - 2 * M, y1 - y0);
  }, { t: 2.2, d: 1.0, reveal: 'fall', ease: 'inOut' });
  p.group('sea', { x: M, y: y0, w: W - 2 * M, h: y1 - y0 + 6 }, (c) => {
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    for (const [x, y, l, w] of glints) { c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y); c.stroke(); }
  }, { t: 2.8, d: 1.2, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ the hill: houses climbing to Sant'Elmo and the Certosa
const HILL = [[FAR_L - 60, 640], [430, 646], [470, 664], [560, 676], [600, 700], [640, 760], [690, 850], [740, 940], [780, 1010], [800, 1060], [790, SHORE + 20], [FAR_L - 60, SHORE + 20]];
function hillEdge(y) { // the hill's right edge at a height
  for (let i = 1; i < HILL.length; i++) {
    const [x0, y0] = HILL[i - 1], [x1, y1] = HILL[i];
    if (y >= y0 && y <= y1 && y1 !== y0) return lerp(x0, x1, (y - y0) / (y1 - y0));
  }
  return 800;
}
const HOUSE = [CREAM, '#f2c9a0', ROSE, OCHRE, '#f5dca0', '#e7b0a2', '#f8f0dc', '#d9905e'];
function hill(p, r) {
  p.group('hill', boxOf(HILL, 4), (c) => {
    c.fillStyle = '#5f8a4f'; path(c, HILL); c.fill();
    c.fillStyle = '#4b7342'; path(c, [[FAR_L - 60, 640], [430, 646], [470, 664], [560, 676], [600, 700], [520, 760], [FAR_L - 60, 800]]); c.fill();
  }, { t: 3.0, d: 1.0, reveal: 'rise' });
  // Castel Sant'Elmo: a low star fort of tufa on the crown of the hill
  const fx = 470, fy = 650;
  p.group('hill', { x: fx - 120, y: fy - 50, w: 260, h: 110 }, (c) => {
    c.fillStyle = TUFA; path(c, [[fx - 104, fy + 24], [fx - 86, fy - 14], [fx - 40, fy - 22], [fx - 20, fy - 34], [fx + 40, fy - 30], [fx + 66, fy - 16], [fx + 110, fy - 10], [fx + 124, fy + 30]]); c.fill();
    c.fillStyle = TUFA_D; path(c, [[fx - 104, fy + 24], [fx - 86, fy - 14], [fx - 60, fy - 16], [fx - 70, fy + 26]]); c.fill();
    path(c, [[fx + 40, fy - 30], [fx + 66, fy - 16], [fx + 56, fy + 24], [fx + 30, fy + 24]]); c.fill();
    c.fillStyle = '#efd6a3'; c.fillRect(fx - 86, fy - 18, 210, 5);
    c.fillStyle = IRON; c.globalAlpha = 0.5; for (let k = 0; k < 7; k++) c.fillRect(fx - 50 + k * 22, fy + 2, 4, 8); c.globalAlpha = 1;
    c.fillStyle = '#c0392b'; c.fillRect(fx + 8, fy - 66, 2, 34); c.fillStyle = '#2e8b57'; c.fillRect(fx + 10, fy - 66, 8, 6); c.fillStyle = '#fff'; c.fillRect(fx + 10, fy - 60, 8, 5); c.fillStyle = '#c0392b'; c.fillRect(fx + 10, fy - 55, 8, 5);
  }, { t: 3.5, d: 0.9, reveal: 'rise' });
  // the Certosa di San Martino just below: long white ranges, a church front, a bell tower
  const cx = 560, cy = 720;
  p.group('hill', { x: cx - 120, y: cy - 70, w: 260, h: 110 }, (c) => {
    c.fillStyle = '#f7efdd'; c.fillRect(cx - 110, cy - 14, 220, 40);
    c.fillStyle = '#e9d6b2'; c.fillRect(cx - 110, cy + 14, 220, 12);
    c.fillStyle = '#f7efdd'; c.fillRect(cx - 20, cy - 40, 50, 30);
    c.beginPath(); c.moveTo(cx - 24, cy - 40); c.lineTo(cx + 5, cy - 58); c.lineTo(cx + 34, cy - 40); c.fill();
    c.fillRect(cx + 50, cy - 58, 16, 46); c.fillStyle = '#b0574a'; c.beginPath(); c.moveTo(cx + 48, cy - 58); c.lineTo(cx + 58, cy - 72); c.lineTo(cx + 68, cy - 58); c.fill();
    c.fillStyle = '#8a6a6a'; for (let k = 0; k < 14; k++) c.fillRect(cx - 104 + k * 15, cy - 6, 5, 9);
    for (let k = 0; k < 14; k++) c.fillRect(cx - 104 + k * 15, cy + 16, 4, 6);
  }, { t: 3.9, d: 0.8, reveal: 'rise' });
  // umbrella pines on the slope
  const pines = [[640, 790, 34], [668, 812, 26], [600, 760, 22], [720, 900, 30], [430, 700, 26]];
  p.group('hill', { x: 380, y: 700, w: 400, h: 240 }, (c) => {
    for (const [x, y, s] of pines) {
      c.strokeStyle = '#5b3b2b'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y + s * 1.4); c.lineTo(x + 2, y); c.stroke();
      c.fillStyle = '#2e5a35'; c.beginPath(); c.ellipse(x, y, s, s * 0.42, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#467a45'; c.beginPath(); c.ellipse(x - s * 0.15, y - s * 0.08, s * 0.7, s * 0.25, 0, Math.PI, 0); c.fill();
    }
  }, { t: 4.2, d: 0.7, reveal: 'fade' });
  // the houses, stacked down the hill in bands
  const bands = [];
  for (let y = 760; y < SHORE + 10; y += 22) {
    const row = [];
    const xe = hillEdge(y) - 6;
    for (let x = FAR_L - 40 + r.range(-10, 10); x < xe;) {
      const w = r.range(16, 34), h = r.range(18, 32);
      if (x + w > xe) break;
      if (!(y < 740 && x > 500)) row.push([x, y - h + r.range(-3, 3), w, h, r.pick(HOUSE), r.int(1, 3)]);
      x += w + r.range(-2, 3);
    }
    bands.push(row);
  }
  for (let b = 0; b < bands.length; b += 4) {
    const rows = bands.slice(b, b + 4);
    const all = rows.flat();
    if (!all.length) continue;
    const bx = boxOf(all.flatMap(([x, y, w, h]) => [[x, y], [x + w, y + h]]), 6);
    p.group('hill', bx, (c) => {
      for (const [x, y, w, h, col, n] of all) {
        c.fillStyle = col; c.fillRect(x, y, w, h);
        c.fillStyle = 'rgba(110,60,90,0.32)'; c.fillRect(x, y, w * 0.28, h);
        c.fillStyle = 'rgba(80,50,60,0.55)'; for (let k = 0; k < n; k++) c.fillRect(x + w * 0.4 + k * 6, y + 6, 3, 5);
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x, y, w, 2);
      }
    }, { t: 4.0 + b * 0.09, d: 0.8, reveal: 'rise' });
  }
}

// ================================================================ the port: Castel dell'Ovo, Castel Nuovo, the Lanterna, the boats moored
function port(p, r) {
  // the harbor's far shore under Vesuvius, with Castel Nuovo's round towers and the Lanterna on its mole
  const nx = 1040, ny = HOR + 34;
  p.group('roofs', { x: 900, y: HOR - 40, w: 320, h: 90 }, (c) => {
    c.fillStyle = '#d9c8b0'; c.fillRect(890, ny - 8, 330, 14);
    c.fillStyle = TUFA_D; c.fillRect(nx - 40, ny - 30, 80, 24);
    for (const tx of [nx - 44, nx - 14, nx + 16, nx + 44]) { c.fillStyle = TUFA; c.fillRect(tx - 9, ny - 44, 18, 38); c.fillStyle = TUFA_D; c.fillRect(tx + 3, ny - 44, 6, 38); c.fillStyle = '#7a5a3e'; c.fillRect(tx - 10, ny - 47, 20, 4); }
    c.fillStyle = '#efe4cf'; c.fillRect(nx - 10, ny - 30, 20, 20);
    // the mole and the lighthouse
    c.fillStyle = '#cdbb9d'; c.fillRect(1120, ny + 2, 100, 5);
    c.fillStyle = '#f4ecdc'; c.fillRect(1160, ny - 40, 10, 42); c.fillStyle = RED; c.fillRect(1158, ny - 46, 14, 7);
    c.fillStyle = INK; c.fillRect(1162, ny - 52, 6, 6);
  }, { t: 3.4, d: 0.8, reveal: 'rise' });
  // Castel dell'Ovo on its rock, the causeway back to the shore
  const ox = 870, oy = 1080;
  p.group('roofs', { x: 760, y: oy - 90, w: 300, h: 120 }, (c) => {
    c.fillStyle = '#8a7360'; path(c, [[780, oy + 14], [800, oy - 2], [1020, oy - 6], [1046, oy + 16]]); c.fill();
    c.fillStyle = '#cdbfa6'; c.fillRect(770, oy + 4, 40, 8);
    // the great block and the stepped keep
    c.fillStyle = TUFA; c.fillRect(ox - 70, oy - 40, 210, 42);
    c.fillStyle = TUFA_D; c.fillRect(ox - 70, oy - 40, 40, 42);
    c.fillStyle = TUFA; c.fillRect(ox - 20, oy - 66, 110, 28); c.fillStyle = TUFA_D; c.fillRect(ox - 20, oy - 66, 22, 28);
    c.fillStyle = '#e8cf9a'; c.fillRect(ox + 70, oy - 82, 34, 44); c.fillStyle = TUFA_D; c.fillRect(ox + 70, oy - 82, 10, 44);
    c.fillStyle = '#efd9ae'; c.fillRect(ox - 70, oy - 42, 210, 4); c.fillRect(ox - 20, oy - 68, 110, 4);
    c.fillStyle = '#6e5242';
    for (let k = 0; k < 9; k++) c.fillRect(ox - 60 + k * 22, oy - 26, 4, 7);
    for (let k = 0; k < 5; k++) c.fillRect(ox - 10 + k * 18, oy - 58, 3, 6);
    // the curtain wall bending round the rock
    c.fillStyle = '#c9a56d'; path(c, [[ox + 140, oy - 26], [ox + 168, oy - 14], [ox + 176, oy + 4], [ox + 140, oy + 4]]); c.fill();
  }, { t: 3.8, d: 1.0, reveal: 'rise' });
  // boats moored by the Borgo Marinari
  const moored = [];
  for (let i = 0; i < 9; i++) moored.push([780 + i * 14 + r.range(-3, 3), oy + 26 + r.range(-2, 4), r.pick(['#fbf4e6', '#2a6bb0', RED])]);
  p.group('roofs', { x: 760, y: oy + 10, w: 160, h: 40 }, (c) => {
    for (const [x, y, col] of moored) { c.fillStyle = col; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.lineTo(x + 4, y + 4); c.lineTo(x - 4, y + 4); c.fill(); c.fillStyle = INK; c.fillRect(x, y - 12, 1, 12); }
  }, { t: 4.4, d: 0.6, reveal: 'fade' });
}

// ================================================================ the roofs of Chiaia, between the alley's end and the shore
function roofs(p, r) {
  const y0 = SHORE, y1 = FLOOR_FAR + 30;
  // the shore road and its trees
  p.group('roofs', { x: M, y: y0 - 20, w: W - 2 * M, h: 50 }, (c) => {
    c.fillStyle = '#e9dcc0'; c.fillRect(M, y0 - 6, W - 2 * M, 12);
    c.fillStyle = '#3f6b3b'; for (let x = FAR_L - 20; x < FAR_R + 20; x += 26) { c.beginPath(); c.arc(x, y0 - 8, 11, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#5a8a4c'; for (let x = FAR_L - 14; x < FAR_R + 20; x += 26) { c.beginPath(); c.arc(x, y0 - 11, 6, 0, Math.PI * 2); c.fill(); }
  }, { t: 4.6, d: 0.8, reveal: 'wipe' });
  // rows of facades, larger as they come nearer, each with its windows and shutters
  const rows = [];
  for (let k = 0, y = y0 + 4; y < y1; k++) {
    const h = 34 + k * 14, row = [];
    for (let x = FAR_L - 40 + r.range(-20, 0); x < FAR_R + 30;) {
      const w = r.range(44, 90) * (1 + k * 0.25);
      row.push({ x, y: y + r.range(-6, 6), w, h: h + r.range(-6, 10), col: r.pick(HOUSE), n: Math.max(2, Math.round(w / 22)), f: Math.max(1, Math.round(h / 30)), sh: r.chance(0.5), roof: r.int(0, 3) });
      x += w - 1;
    }
    rows.push(row);
    y += 22 + k * 10;
  }
  rows.forEach((row, k) => {
    const bx = { x: M, y: Math.min(...row.map((b) => b.y)) - 40, w: W - 2 * M, h: 260 };
    p.group('roofs', bx, (c) => {
      for (const b of row) {
        const { x, y, w, h, col, n, f, sh, roof } = b;
        c.fillStyle = col; c.fillRect(x, y, w, h + 120);
        c.fillStyle = 'rgba(120,60,90,0.28)'; c.fillRect(x, y, w * 0.18, h + 120);
        // the roof: a terrace with a parapet, a tiled pitch, or a little loggia
        if (roof === 1) { c.fillStyle = '#c55a3c'; path(c, [[x - 2, y], [x + w * 0.5, y - h * 0.22], [x + w + 2, y]]); c.fill(); }
        else if (roof === 2) { c.fillStyle = col; c.fillRect(x + w * 0.55, y - 14, w * 0.35, 14); c.fillStyle = 'rgba(60,30,50,0.6)'; c.fillRect(x + w * 0.6, y - 10, w * 0.25, 8); }
        c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(x, y, w, 3);
        const ww = w / n * 0.42, wh = Math.min(16 + k * 5, (h + 120) / (f + 1) * 0.5);
        for (let j = 0; j < f + 2; j++) for (let i = 0; i < n; i++) {
          const wx = x + (i + 0.5) * w / n - ww / 2, wy = y + 10 + k * 2 + j * (wh * 1.9);
          c.fillStyle = sh ? GREEN : 'rgba(60,30,45,0.75)'; c.fillRect(wx, wy, ww, wh);
          if (sh) { c.fillStyle = GREEN_D; c.fillRect(wx + ww / 2 - 0.5, wy, 1, wh); }
        }
      }
    }, { t: 4.8 + k * 0.3, d: 0.9, reveal: 'rise' });
  });
  // a majolica dome in yellow and green tile among the roofs
  const dx = 1010, dy = y0 + 60;
  p.group('roofs', { x: dx - 70, y: dy - 120, w: 140, h: 150 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(dx - 44, dy - 30, 88, 50);
    c.fillStyle = 'rgba(60,30,45,0.6)'; for (let k = 0; k < 6; k++) c.fillRect(dx - 38 + k * 14, dy - 22, 6, 12);
    c.fillStyle = '#e5b82c'; c.beginPath(); c.ellipse(dx, dy - 30, 46, 56, 0, Math.PI, 0); c.fill();
    c.strokeStyle = '#2e7d5e'; c.lineWidth = 5; c.beginPath();
    for (let k = -3; k <= 3; k++) { c.moveTo(dx + k * 13, dy - 30); c.quadraticCurveTo(dx + k * 9, dy - 70, dx, dy - 86); }
    c.stroke();
    c.fillStyle = CREAM; c.fillRect(dx - 6, dy - 106, 12, 22); c.fillStyle = '#e5b82c'; c.beginPath(); c.arc(dx, dy - 108, 8, Math.PI, 0); c.fill();
  }, { t: 5.6, d: 0.8, reveal: 'rise' });
}

// ================================================================ the walls of the alley
// a quad on a side wall, from depth d0 to d1 and near-plane height y0 to y1; out pushes it off the wall
function wq(side, d0, d1, y0, y1, out = 0) {
  const x = (side < 0 ? XL : XR) - side * out;
  return [P(x, y0, d0), P(x, y0, d1), P(x, y1, d1), P(x, y1, d0)];
}
const COLS = [0.06, 0.2, 0.36, 0.53, 0.7, 0.86];
const FLOORS = [-60, 300, 660, 1020];
function walls(p, r) {
  for (const side of [-1, 1]) {
    const L = side < 0 ? 'lwall' : 'rwall';
    const base = side < 0 ? OCHRE : SHADE, dark = side < 0 ? CORAL : SHADE_D, light = side < 0 ? SUNW : SHADE_L;
    const x = side < 0 ? XL : XR;
    const face = [[x, TOPN], P(x, TOPN, 1), P(x, FLOORN, 1), [x, FLOORN]];
    const plaster = [];
    for (let i = 0; i < 320; i++) {
      const d = r() ** 1.3, y = r.range(TOPN, FLOORN);
      plaster.push([...P(x, y, d), 40 * sOf(d) * r.range(0.6, 1.4), 9 * sOf(d) * r.range(0.6, 1.2), (y - VY) / (x - VX) * 1 + r.range(-0.05, 0.05)]);
    }
    // the face arrives sliding in from its side, then a coat of brushed paint
    p.mark(L, {
      t: side < 0 ? 5.0 : 5.4, d: 1.4, reveal: 'slide', dx: side * 420, ease: 'out', box: boxOf(face, 10),
      draw: (c) => {
        c.fillStyle = base; path(c, face); c.fill();
        // the cornice: a band and a row of corbels under the eave
        const top = wq(side, 0, 1, TOPN, TOPN + 70, 0);
        c.fillStyle = dark; path(c, top); c.fill();
        const eave = wq(side, 0, 1, TOPN - 40, TOPN, 50);
        c.fillStyle = side < 0 ? '#c9512f' : '#5a2a45'; path(c, [P(x, TOPN, 0), P(x, TOPN, 1), eave[1], eave[0]]); c.fill();
        // a plinth of grey stone at the foot
        c.fillStyle = side < 0 ? '#c99b75' : '#6c4560'; path(c, wq(side, 0, 1, FLOORN - 140, FLOORN)); c.fill();
      },
    });
    p.group(L, boxOf(face, 10), (c) => {
      c.save(); path(c, face); c.clip();
      c.globalAlpha = 0.28; drawDaubs(c, plaster.slice(0, 200), light);
      c.globalAlpha = 0.22; drawDaubs(c, plaster.slice(200), dark);
      c.restore();
    }, { t: side < 0 ? 6.0 : 6.3, d: 0.9, reveal: 'fade' });
    // the sun's shadow from the cornice opposite, slanting across the sunny wall
    if (side < 0) {
      const sh = [P(x, 560, 0), P(x, 160, 1), P(x, FLOORN, 1), P(x, FLOORN, 0)];
      p.group(L, boxOf(sh, 8), (c) => { c.fillStyle = 'rgba(150,60,110,0.42)'; path(c, sh); c.fill(); }, { t: 6.6, d: 1.0, reveal: 'fall', ease: 'inOut' });
    } else {
      // warm light bounced up from the sunny wall onto the shaded one
      const bl = [P(x, 900, 0), P(x, 700, 1), P(x, FLOORN, 1), P(x, FLOORN, 0)];
      p.group(L, boxOf(bl, 8), (c) => {
        const g = c.createLinearGradient(0, 700, 0, FLOORN); g.addColorStop(0, 'rgba(240,150,110,0)'); g.addColorStop(1, 'rgba(240,150,110,0.35)');
        c.fillStyle = g; path(c, bl); c.fill();
      }, { t: 6.8, d: 1.0, reveal: 'fade' });
    }
    windowsOn(p, r, side);
  }
}
function windowsOn(p, r, side) {
  const x = side < 0 ? XL : XR;
  const sunny = side < 0;
  const frame = sunny ? CREAM : '#c98ea0', hole = sunny ? '#3b1d2a' : '#2a1426';
  const shut = sunny ? GREEN : GREEN_D, slat = sunny ? GREEN_D : '#123726';
  COLS.forEach((d, ci) => {
    const s0 = d - 0.045, s1 = d + 0.045;
    const wins = [];
    FLOORS.forEach((y, fi) => {
      wins.push({ y, open: r.chance(0.45), bal: fi > 0 && r.chance(0.65), pots: r.int(0, 3), sheet: r.chance(0.25) ? r.pick(['#fbf7ee', '#f2b9c8', '#9fc6e8']) : null, lamp: r.chance(0.2) });
    });
    const quads = [wq(side, s0 - 0.03, s1 + 0.03, TOPN, FLOORN, 120)];
    const bx = boxOf([...quads[0], ...wq(side, s0 - 0.03, s1 + 0.03, TOPN, FLOORN, 0)], 30);
    // windows with their frames and shutters
    p.group('wdetail', bx, (c) => {
      for (const w of wins) {
        const y0 = w.y, y1 = w.y + 220;
        c.fillStyle = frame; path(c, wq(side, s0 - 0.012, s1 + 0.012, y0 - 26, y1 + 10)); c.fill();
        // a little pediment over each window
        const ped = wq(side, s0 - 0.018, s1 + 0.018, y0 - 44, y0 - 26, 8);
        c.fillStyle = sunny ? '#f9e2b0' : '#a8667e'; path(c, ped); c.fill();
        if (w.open) {
          c.fillStyle = hole; path(c, wq(side, s0, s1, y0, y1)); c.fill();
          // the leaves folded back against the wall
          c.fillStyle = shut; path(c, wq(side, s0 - 0.04, s0 - 0.012, y0, y1)); c.fill(); path(c, wq(side, s1 + 0.012, s1 + 0.04, y0, y1)); c.fill();
          if (w.lamp) { c.fillStyle = 'rgba(255,214,140,0.65)'; path(c, wq(side, s0 + 0.01, s1 - 0.01, y0 + 30, y0 + 90)); c.fill(); }
        } else {
          c.fillStyle = shut; path(c, wq(side, s0, s1, y0, y1)); c.fill();
          c.strokeStyle = slat; c.lineWidth = 1.6 * sOf(d); c.beginPath();
          for (let yy = y0 + 10; yy < y1; yy += 14) { const a = P(x, yy, s0), b = P(x, yy, s1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
          const m0 = P(x, y0, d), m1 = P(x, y1, d); c.moveTo(m0[0], m0[1]); c.lineTo(m1[0], m1[1]);
          c.stroke();
        }
      }
      // the doors of the bassi at the foot: arched, dark, a curtain or a lantern
      const dy0 = FLOORN - 360, dy1 = FLOORN - 10;
      c.fillStyle = frame; path(c, wq(side, s0 - 0.015, s1 + 0.015, dy0 - 20, dy1)); c.fill();
      c.fillStyle = hole; path(c, wq(side, s0, s1, dy0, dy1)); c.fill();
      c.fillStyle = ci % 2 ? '#e7d3a4' : '#c44a3c'; c.globalAlpha = 0.85; path(c, wq(side, s0 + 0.008, d - 0.004, dy0 + 40, dy1 - 60)); c.fill(); c.globalAlpha = 1;
    }, { t: 6.5 + ci * 0.22 + (side > 0 ? 0.11 : 0), d: 0.8, reveal: 'fade' });
    // balconies: a slab on brackets, an iron rail, pots of geraniums, a sheet aired over the rail
    p.group('wdetail', bx, (c) => {
      for (const w of wins) {
        if (!w.bal) continue;
        const yb = w.y + 220, out = 90;
        const slab = [P(x, yb, s0 - 0.04), P(x, yb, s1 + 0.04), P(x - side * out, yb, s1 + 0.04), P(x - side * out, yb, s0 - 0.04)];
        c.fillStyle = sunny ? '#f3dfb8' : '#9c6378'; path(c, slab); c.fill();
        const under = [slab[0], slab[1], P(x, yb + 18, s1 + 0.04), P(x, yb + 18, s0 - 0.04)];
        c.fillStyle = sunny ? '#b65a3a' : '#4a2238'; path(c, [slab[3], slab[2], P(x - side * out, yb + 16, s1 + 0.04), P(x - side * out, yb + 16, s0 - 0.04)]); c.fill();
        c.globalAlpha = 0.5; path(c, under); c.fill(); c.globalAlpha = 1;
        // the rail, its bars and the corner posts
        c.strokeStyle = IRON; c.lineWidth = Math.max(1, 3 * sOf(d));
        const a = P(x - side * out, yb - 100, s0 - 0.04), b = P(x - side * out, yb - 100, s1 + 0.04);
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
        const a2 = P(x, yb - 100, s1 + 0.04); c.lineTo(a2[0], a2[1]);
        for (let k = 0; k <= 9; k++) {
          const dd = lerp(s0 - 0.04, s1 + 0.04, k / 9), t0 = P(x - side * out, yb - 100, dd), t1 = P(x - side * out, yb, dd);
          c.moveTo(t0[0], t0[1]); c.lineTo(t1[0], t1[1]);
        }
        for (let k = 1; k <= 3; k++) { const o = out * k / 4, t0 = P(x - side * o, yb - 100, s1 + 0.04), t1 = P(x - side * o, yb, s1 + 0.04); c.moveTo(t0[0], t0[1]); c.lineTo(t1[0], t1[1]); }
        c.stroke();
        for (let k = 0; k < w.pots; k++) {
          const [px, py] = P(x - side * out * 0.85, yb - 100, lerp(s0, s1, (k + 0.5) / 3)), s = sOf(d);
          c.fillStyle = '#b8552f'; c.fillRect(px - 9 * s, py - 18 * s, 18 * s, 18 * s);
          c.fillStyle = LEAF; c.beginPath(); c.arc(px, py - 24 * s, 14 * s, 0, Math.PI * 2); c.fill();
          c.fillStyle = RED; for (let q = 0; q < 4; q++) { c.beginPath(); c.arc(px + (q - 1.5) * 7 * s, py - (30 + (q % 2) * 6) * s, 4.5 * s, 0, Math.PI * 2); c.fill(); }
        }
        if (w.sheet) {
          c.fillStyle = w.sheet; path(c, [P(x - side * out, yb - 100, s0), P(x - side * out, yb - 100, d + 0.01), P(x - side * out, yb + 60, d + 0.008), P(x - side * out, yb + 70, s0 + 0.004)]); c.fill();
        }
      }
    }, { t: 7.3 + ci * 0.2 + (side > 0 ? 0.1 : 0), d: 0.7, reveal: 'drop', dy: 16 });
  });
}

// ================================================================ the steps, the pots at their sides, the people
function floor(p, r) {
  const quad = [[XL, FLOORN], [XR, FLOORN], P(XR, FLOORN, 1), P(XL, FLOORN, 1)];
  const steps = [];
  for (let k = 1; k < 22; k++) { const d = (k / 22) ** 1.35; steps.push([P(XL, FLOORN, d), P(XR, FLOORN, d), d]); }
  p.group('floor', boxOf(quad, 6), (c) => {
    c.fillStyle = '#a6908a'; path(c, quad); c.fill();
    // a band of sun down the middle, the shade of the right wall over the rest
    c.fillStyle = 'rgba(250,220,170,0.45)'; path(c, [[XL, FLOORN], [700, FLOORN], P(900, FLOORN, 1), P(XL, FLOORN, 1)]); c.fill();
  }, { t: 7.6, d: 1.0, reveal: 'fall' });
  const cob = [];
  for (const [a, b, d] of steps) for (let x = a[0]; x < b[0] - 20; x += r.range(30, 90) * sOf(d)) cob.push([x, a[1] - r.range(14, 26) * sOf(d), r.range(10, 40) * sOf(d)]);
  p.group('floor', boxOf(quad, 6), (c) => {
    for (const [a, b, d] of steps) {
      const s = sOf(d);
      c.fillStyle = 'rgba(70,40,60,0.45)'; c.fillRect(a[0], a[1] - 10 * s, b[0] - a[0], 10 * s);
      c.fillStyle = 'rgba(255,240,220,0.5)'; c.fillRect(a[0], a[1] - 12 * s, b[0] - a[0], 2.5 * s);
    }
    // the worn edges of the paving: short dashes along each tread
    c.strokeStyle = 'rgba(70,40,60,0.18)'; c.lineWidth = 1.5; c.beginPath();
    for (let i = 0; i < cob.length; i++) { const [x, y, l] = cob[i]; c.moveTo(x, y); c.lineTo(x + l, y); }
    c.stroke();
    // a gutter running down the middle
    const g0 = P(VX, FLOORN, 0), g1 = P(VX, FLOORN, 1);
    c.strokeStyle = 'rgba(70,40,60,0.35)'; c.lineWidth = 6; c.beginPath(); c.moveTo(g0[0], g0[1]); c.lineTo(g1[0], g1[1]); c.stroke();
  }, { t: 8.0, d: 1.0, reveal: 'fall' });
  // pots along the walls: geraniums, a lemon tree
  const pots = [];
  for (const side of [-1, 1]) for (const d of [0.12, 0.3, 0.48, 0.66]) pots.push([side, d + r.range(-0.03, 0.03), r.chance(0.3)]);
  p.group('floor', boxOf(quad, 200), (c) => {
    for (const [side, d, lemon] of pots) {
      const [px, py] = P((side < 0 ? XL : XR) - side * 70, FLOORN, d), s = sOf(d);
      c.fillStyle = '#b8552f'; poly(c, [[px - 22 * s, py - 40 * s], [px + 22 * s, py - 40 * s], [px + 16 * s, py], [px - 16 * s, py]]); c.fill();
      c.fillStyle = '#d97a4f'; c.fillRect(px - 24 * s, py - 44 * s, 48 * s, 7 * s);
      if (lemon) {
        c.fillStyle = '#5a3b2a'; c.fillRect(px - 2 * s, py - 110 * s, 4 * s, 70 * s);
        c.fillStyle = LEAF_D; c.beginPath(); c.arc(px, py - 130 * s, 44 * s, 0, Math.PI * 2); c.fill();
        c.fillStyle = LEAF; c.beginPath(); c.arc(px - 10 * s, py - 140 * s, 30 * s, 0, Math.PI * 2); c.fill();
        c.fillStyle = LEMON; for (let q = 0; q < 6; q++) { c.beginPath(); c.ellipse(px + Math.cos(q * 1.9) * 28 * s, py - 130 * s + Math.sin(q * 1.9) * 26 * s, 7 * s, 5 * s, 0.4, 0, Math.PI * 2); c.fill(); }
      } else {
        c.fillStyle = LEAF; c.beginPath(); c.arc(px, py - 58 * s, 26 * s, 0, Math.PI * 2); c.fill();
        c.fillStyle = RED; for (let q = 0; q < 7; q++) { c.beginPath(); c.arc(px + Math.cos(q * 2.3) * 18 * s, py - 62 * s + Math.sin(q * 2.3) * 14 * s, 6 * s, 0, Math.PI * 2); c.fill(); }
      }
    }
  }, { t: 8.4, d: 0.8, reveal: 'drop', dy: 20 });
}

// a figure standing on the steps, (x, y) at the feet; s its scale
function figure(c, x, y, s, o) {
  c.fillStyle = o.legs || INK;
  c.fillRect(x - 7 * s, y - 50 * s, 5 * s, 50 * s); c.fillRect(x + 2 * s, y - 50 * s, 5 * s, 50 * s);
  c.fillStyle = o.body; poly(c, [[x - 14 * s, y - (o.skirt ? 20 : 48) * s], [x + 14 * s, y - (o.skirt ? 20 : 48) * s], [x + 11 * s, y - 104 * s], [x - 11 * s, y - 104 * s]]); c.fill();
  c.fillStyle = o.skin || '#a8674a'; c.beginPath(); c.arc(x, y - 116 * s, 11 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = o.hair || INK; c.beginPath(); c.arc(x, y - 120 * s, 11 * s, Math.PI, 0); c.fill();
  if (o.basket) { c.fillStyle = '#c99a4a'; c.beginPath(); c.ellipse(x, y - 134 * s, 22 * s, 8 * s, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = LEMON; for (let k = -2; k <= 2; k++) { c.beginPath(); c.arc(x + k * 7 * s, y - 140 * s, 5 * s, 0, Math.PI * 2); c.fill(); } }
  if (o.arm) { c.strokeStyle = o.body; c.lineWidth = 5 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 10 * s, y - 98 * s); c.lineTo(x + 26 * s, y - 70 * s); c.stroke(); }
}
function lives(p, r) {
  // people on the steps
  const folk = [
    [P(620, FLOORN, 0.55), { body: '#2b5fa3', skirt: true, basket: true }],
    [P(700, FLOORN, 0.62), { body: '#fbf3e2', legs: '#4a3a5a', arm: true }],
    [P(1020, FLOORN, 0.4), { body: RED, skirt: true, hair: '#4a2a1a' }],
    [P(1080, FLOORN, 0.42), { body: '#f2c64a', legs: '#2a4a6a' }],
    [P(880, FLOORN, 0.78), { body: '#f3e7d1', legs: INK }],
    [P(500, FLOORN, 0.2), { body: '#d0603b', skirt: true, basket: true, hair: '#2a1a1a' }],
    [P(760, FLOORN, 0.07), { body: '#f4ead6', legs: '#2b3f66', arm: true }],
    [P(830, FLOORN, 0.09), { body: '#7a3048', skirt: true, hair: '#2a1a1a' }],
    [P(960, FLOORN, 0.66), { body: '#2b5fa3', legs: INK }],
  ];
  const fb = boxOf(folk.map(([a]) => a), 150);
  p.group('people', fb, (c) => {
    for (const [[x, y], o] of folk) {
      const d = (1 / ((y - VY) / (FLOORN - VY)) - 1) / KD, s = sOf(d) * 1.1;
      c.fillStyle = 'rgba(60,30,50,0.3)'; c.beginPath(); c.ellipse(x + 8 * s, y, 18 * s, 4 * s, 0, 0, Math.PI * 2); c.fill();
      figure(c, x, y, s, o);
    }
  }, { t: 9.6, d: 0.8, reveal: 'drop', dy: 18 });
  // pigeons pecking on the steps
  const birds = [];
  for (let i = 0; i < 14; i++) { const d = r.range(0.05, 0.5); birds.push([...P(r.range(300, 1300), FLOORN, d), sOf(d), r.chance(0.5) ? 1 : -1]); }
  p.group('people', boxOf(birds.map(([x, y]) => [x, y]), 30), (c) => {
    for (const [x, y, s, f] of birds) {
      c.fillStyle = '#8a8a96'; c.beginPath(); c.ellipse(x, y - 9 * s, 13 * s, 7 * s, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5c5c6a'; c.beginPath(); c.arc(x + f * 11 * s, y - 15 * s, 5 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c8362c'; c.fillRect(x - 2 * s, y - 3 * s, 1.5 * s, 3 * s); c.fillRect(x + 2 * s, y - 3 * s, 1.5 * s, 3 * s);
    }
  }, { t: 10.2, d: 0.6, reveal: 'drop', dy: 12 });
  // a cat asleep on a step
  const [kx, ky] = P(1260, FLOORN, 0.15);
  p.group('people', { x: kx - 40, y: ky - 40, w: 80, h: 50 }, (c) => {
    c.fillStyle = '#2a1a22'; c.beginPath(); c.ellipse(kx, ky - 12, 26, 12, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(kx + 22, ky - 20, 9, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(kx + 16, ky - 26); c.lineTo(kx + 18, ky - 36); c.lineTo(kx + 23, ky - 28); c.lineTo(kx + 28, ky - 36); c.lineTo(kx + 30, ky - 24); c.fill();
    c.strokeStyle = '#2a1a22'; c.lineWidth = 5; c.beginPath(); c.moveTo(kx - 24, ky - 8); c.quadraticCurveTo(kx - 40, ky, kx - 20, ky + 2); c.stroke();
  }, { t: 10.0, d: 0.5, reveal: 'fade' });

  // the plume keeps rising: soft puffs born at the crater, drifting up and left
  const pf = [];
  for (let i = 0; i < 7; i++) pf.push([i / 7, r.range(-8, 8)]);
  p.live('live', {
    t: 4.0, d: 1.5,
    draw: (c, time) => {
      c.fillStyle = 'rgba(252,246,240,0.5)';
      c.beginPath();
      for (const [ph, j] of pf) {
        const u = (time * 0.05 + ph) % 1;
        const x = 1060 - u * 300 - u * u * 120 + j, y = 640 - u * 330, s = (22 + u * 50) * Math.sin(Math.PI * Math.min(1, u * 1.2 + 0.05));
        if (s > 1) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); }
      }
      c.fill();
    },
  });
  // boats on the bay: rocking gozzi and a steamer going out to Capri
  const boats = [[700, 1110, 1.0, '#fbf4e6', RED], [960, 1124, 1.2, '#2a6bb0', '#fbf4e6'], [1120, 1096, 0.8, '#fbf4e6', '#2a6bb0'], [560, 1136, 1.3, '#f2c64a', '#2a6bb0']];
  p.live('live', {
    t: 9.0, d: 1.0,
    draw: (c, time) => {
      for (let i = 0; i < boats.length; i++) {
        const [x, y, s, hull, trim] = boats[i];
        const rock = Math.sin(time * 1.3 + i * 1.7) * 0.06, bob = Math.sin(time * 1.1 + i) * 1.5;
        c.save(); c.translate(x, y + bob); c.rotate(rock); c.scale(s, s);
        c.fillStyle = 'rgba(20,50,100,0.35)'; c.fillRect(-26, 4, 52, 3);
        c.fillStyle = hull; c.beginPath(); c.moveTo(-28, -10); c.quadraticCurveTo(0, -4, 28, -12); c.lineTo(20, 2); c.lineTo(-20, 2); c.closePath(); c.fill();
        c.fillStyle = trim; c.fillRect(-24, -8, 46, 3);
        c.fillStyle = INK; c.beginPath(); c.arc(-4, -16, 3.5, 0, Math.PI * 2); c.fill(); c.fillRect(-7, -14, 6, 7);
        c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-2, -12); c.lineTo(16, -24); c.stroke();
        c.restore();
      }
      // the steamer
      const sx = 1150 - ((time - 9) * 6) % 400, sy = HOR + 26;
      c.fillStyle = '#fbf4e6'; c.fillRect(sx - 26, sy - 6, 52, 6); c.fillRect(sx - 14, sy - 12, 26, 6);
      c.fillStyle = INK; c.fillRect(sx - 26, sy, 52, 3); c.fillStyle = RED; c.fillRect(sx - 2, sy - 22, 7, 10);
      c.fillStyle = 'rgba(240,236,232,0.6)'; c.beginPath(); c.arc(sx + 12, sy - 28, 6, 0, Math.PI * 2); c.arc(sx + 22, sy - 32, 8, 0, Math.PI * 2); c.fill();
    },
  });
  // gulls over the bay
  const gulls = [];
  for (let i = 0; i < 5; i++) gulls.push([r.range(500, 1150), r.range(760, 880), r() * 6, r.range(0.8, 1.3)]);
  p.live('live', {
    t: 10.2, d: 1.0,
    draw: (c, time) => {
      c.strokeStyle = '#fbf7ee'; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
      for (const [x, y, ph, s] of gulls) {
        const bx = x + Math.sin(time * 0.2 + ph) * 50, by = y + Math.sin(time * 0.5 + ph) * 10, f = Math.sin(time * 3 + ph) * 5 * s;
        c.moveTo(bx - 16 * s, by - f); c.quadraticCurveTo(bx - 7 * s, by - 8 * s, bx, by); c.quadraticCurveTo(bx + 7 * s, by - 8 * s, bx + 16 * s, by - f);
      }
      c.stroke();
    },
  });
}

// ================================================================ the laundry: lines across the alley, washing swaying on them
function laundry(p, r) {
  // [depth, near-plane height, sag]
  const lines = [[0.94, 40, 20], [0.7, 240, 30]];
  const COLS = ['#fbf7ee', '#fbf7ee', '#f2b9c8', '#9fc6e8', '#f5d34a', '#e9674a', '#fbf7ee', '#8fd0b8', '#ffffff'];
  const wash = [];
  lines.forEach(([d, y, sag], li) => {
    const a = P(XL, y, d), b = P(XR, y, d), s = sOf(d);
    const pts = [];
    for (let k = 0; k <= 30; k++) { const u = k / 30; pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) + sag * s * 4 * u * (1 - u)]); }
    p.pen('lines', pts, '#3a2a35', 2.4 * s, { t: 8.4 + li * 0.35, d: 1.0 });
    // the washing along it: shirts, sheets, towels, socks, a dress
    for (let u = 0.06; u < 0.94;) {
      const kind = r.pick(['sheet', 'shirt', 'shirt', 'towel', 'sock', 'dress', 'sheet']);
      const w = { sheet: 0.11, shirt: 0.05, towel: 0.05, sock: 0.018, dress: 0.045 }[kind] * r.range(0.9, 1.15);
      if (u + w > 0.95) break;
      const k = Math.round((u + w / 2) * 30);
      const hang = { sheet: 150, shirt: 80, towel: 70, sock: 34, dress: 120 }[kind] * s * r.range(0.9, 1.1);
      wash.push({ li, u, w, kind, hang, s, col: r.pick(COLS), x0: lerp(a[0], b[0], u), x1: lerp(a[0], b[0], u + w), y0: lerp(a[1], b[1], u) + sag * s * 4 * u * (1 - u), y1: lerp(a[1], b[1], u + w) + sag * s * 4 * (u + w) * (1 - u - w), ph: r() * 6, t: 8.8 + li * 0.35 + u * 1.2 });
      u += w + r.range(0.004, 0.03);
    }
  });
  // drawn every frame: each piece sways a little on its pegs
  p.live('live', {
    t: 8.8, d: 1.6,
    draw: (c, time) => {
      for (const w of wash) {
        const k = clamp((time - w.t) / 0.5);
        if (k <= 0) continue;
        const sway = Math.sin(time * 1.6 + w.ph) * 0.12 * w.hang, h = w.hang * (0.4 + 0.6 * k);
        const { x0, x1, y0, y1, col, kind } = w;
        c.fillStyle = col;
        c.beginPath();
        if (kind === 'shirt') {
          const m = (x0 + x1) / 2, ww = x1 - x0;
          c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1 + ww * 0.25 + sway * 0.4, y1 + h * 0.35); c.lineTo(x1 - ww * 0.1 + sway * 0.6, y1 + h * 0.3);
          c.lineTo(x1 - ww * 0.12 + sway, y1 + h); c.lineTo(x0 + ww * 0.12 + sway, y0 + h); c.lineTo(x0 + ww * 0.1 + sway * 0.6, y0 + h * 0.3); c.lineTo(x0 - ww * 0.25 + sway * 0.4, y0 + h * 0.35);
          c.closePath(); c.fill();
          c.fillStyle = 'rgba(80,40,60,0.18)'; c.fillRect(m - 1, y0, 2, h * 0.9);
        } else if (kind === 'dress') {
          const ww = x1 - x0;
          c.moveTo(x0 + ww * 0.2, y0); c.lineTo(x1 - ww * 0.2, y1); c.lineTo(x1 + ww * 0.3 + sway, y1 + h); c.lineTo(x0 - ww * 0.3 + sway, y0 + h); c.closePath(); c.fill();
        } else {
          c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1 + sway, y1 + h); c.quadraticCurveTo((x0 + x1) / 2 + sway, (y0 + y1) / 2 + h + 6 * w.s, x0 + sway, y0 + h); c.closePath(); c.fill();
          if (kind === 'towel') { c.fillStyle = 'rgba(200,60,60,0.6)'; c.fillRect(x0 + sway * 0.8, y0 + h * 0.75, x1 - x0, 4 * w.s); }
        }
        // a fold of shadow and the pegs
        c.fillStyle = 'rgba(90,50,80,0.16)'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (x1 - x0) * 0.3, y0); c.lineTo(x0 + (x1 - x0) * 0.3 + sway, y0 + h); c.lineTo(x0 + sway, y0 + h); c.fill();
        c.fillStyle = '#6a4a3a'; c.fillRect(x0 - 1, y0 - 4 * w.s, 3 * w.s, 8 * w.s); c.fillRect(x1 - 2, y1 - 4 * w.s, 3 * w.s, 8 * w.s);
      }
    },
  });
}

// ================================================================ the name, brushed across the sky
function title(p, r) {
  const fam = '"Kaushan Script"';
  p.type('title', 'Napoli', 770, 300, { size: 270, family: fam, color: '#fffaf0', shadow: '#a8293a', sx: 8, sy: 9, align: 'center', t: 11.0, gap: 0.2, d: 0.8, reveal: 'press' });
}

// ================================================================ the margin: lemons on their branches, the credit line
function margin(p, r) {
  const y0 = PB, y1 = H;
  // a thin painted keyline round the picture
  p.group('margin', { x: M - 8, y: M - 8, w: W - 2 * M + 16, h: PB - M + 16 }, (c) => {
    c.strokeStyle = '#a8293a'; c.lineWidth = 4; c.strokeRect(M - 1, M - 1, W - 2 * M + 2, PB - M + 2);
  }, { t: 0.4, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // two lemon boughs growing in from the lower corners
  const boughs = [];
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? 20 : W - 20, pts = [];
    for (let k = 0; k <= 20; k++) { const u = k / 20; pts.push([x0 - side * u * 520, y1 - 70 - Math.sin(u * Math.PI) * 120 + u * 40]); }
    const leaves = [], fruits = [];
    for (let k = 2; k < 20; k++) {
      const [x, y] = pts[k], up = k % 2 ? -1 : 1;
      leaves.push([x, y, up * (0.7 + r.range(-0.3, 0.3)) - side * 0.4, r.range(36, 54)]);
      if (k % 4 === 1) fruits.push([x + r.range(-8, 8), y + 34 + r.range(0, 12), r.range(22, 28), r.range(-0.5, 0.5)]);
    }
    boughs.push({ side, pts, leaves, fruits });
  }
  boughs.forEach(({ side, pts, leaves, fruits }, bi) => {
    const bx = boxOf(pts, 90);
    p.pen('margin', pts, '#5a3b2a', 6, { t: 12.0 + bi * 0.3, d: 1.0 });
    p.group('margin', bx, (c) => {
      for (const [x, y, a, l] of leaves) {
        c.save(); c.translate(x, y); c.rotate(a);
        c.fillStyle = LEAF; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(l * 0.5, -l * 0.3, l, 0); c.quadraticCurveTo(l * 0.5, l * 0.3, 0, 0); c.fill();
        c.fillStyle = LEAF_D; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(l * 0.5, l * 0.3, l, 0); c.lineTo(0, 0); c.fill();
        c.restore();
      }
    }, { t: 12.5 + bi * 0.3, d: 0.8, reveal: 'pop' });
    p.group('margin', bx, (c) => {
      for (const [x, y, s, a] of fruits) {
        c.save(); c.translate(x, y); c.rotate(a);
        c.fillStyle = LEMON_D; c.beginPath(); c.ellipse(2, 2, s, s * 0.74, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = LEMON; c.beginPath(); c.ellipse(0, 0, s, s * 0.74, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(s, 0, 6, 4, 0, 0, Math.PI * 2); c.ellipse(-s, 0, 5, 4, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,230,0.7)'; c.beginPath(); c.ellipse(-s * 0.3, -s * 0.3, s * 0.35, s * 0.18, -0.3, 0, Math.PI * 2); c.fill();
        c.restore();
      }
    }, { t: 13.0 + bi * 0.3, d: 0.7, reveal: 'drop', dy: 20 });
  });
  p.type('title', 'ITALIA', W / 2, y0 + 120, { size: 64, family: '"Josefin Sans"', weight: 600, color: '#a8293a', align: 'center', track: 0.5, t: 12.2, gap: 0.12, d: 0.5 });
  p.type('title', 'CAMPANIA · VESUVIO', W / 2, y0 + 190, { size: 26, family: '"Josefin Sans"', weight: 600, color: '#3a2a35', align: 'center', track: 0.4, t: 12.9, gap: 0.03, d: 0.3, reveal: 'fade' });
}
