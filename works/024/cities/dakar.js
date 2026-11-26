// Dakar: a Senegalese reverse glass painting, a souwère. On glass the black line
// is painted first and the flat colors behind it, so here every shape is inked,
// then filled in under its line. The Mamelles above the sea: the African
// Renaissance Monument in bronze on the nearer hill, the lighthouse on the other;
// Gorée's houses, its fort and its baobab out on the water; painted pirogues
// fishing; and on the beach in front, the big pirogues drawn up, women carrying
// basins of fish, a fisherman with his catch and a baobab hung with fruit. A
// border of painted triangles round it all, the title in the same bright enamel,
// and at the last the light on the glass.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, poly, rng } from '../kit.js';

// the enamels
const K = '#16110f', WHITE = '#fbf7ec', CREAM = '#f6ecd0';
const BLUE = '#1f4fb8', BLUE_D = '#173b8c', BLUE_L = '#3d86d8', TURQ = '#2fb3c6', SKY = '#57b6e6', SKY_L = '#9fd8ef';
const RED = '#d8282b', RED_D = '#a51c22', YEL = '#f6c51b', ORA = '#ef7d1a', GRN = '#169a4f', GRN_D = '#0f6e3a', GRN_L = '#7cc24a';
const PINK = '#ec5f9b', PURP = '#6b3fa0', SAND = '#f0c66e', SAND_D = '#d9a24a', BRONZE = '#6b4524', BRONZE_L = '#a06a35';
const SKIN = '#5b3420', SKIN_D = '#432414', OCHRE = '#e3a23a', BRICK = '#b8452f', BARK = '#8a6a55', BARK_D = '#6a4e3e';

export const city = {
  id: 'dakar', name: 'Dakar', wall: '#1d1a2e',
  alt: "Dakar as a Senegalese reverse glass painting: the African Renaissance Monument in bronze on one of the Mamelles hills and the lighthouse on the other, Gorée island's colored houses, fort and baobab out on the sea, painted pirogues fishing, and on the beach the big pirogues drawn up, women carrying basins of fish on their heads, a fisherman with his catch and a baobab hung with fruit, in a border of painted triangles",
  google: 'family=Shrikhand',
  fonts: [['400 230px "Shrikhand"', 'DAKAR'], ['400 46px "Shrikhand"', 'Ndakaaru · Sénégal']],
  build,
};

// the picture, the band under it and the title panel, all inside the painted border
const PX0 = 130, PY0 = 130, PX1 = W - 130, PY1 = 1530;
const TY0 = 1610, TY1 = H - 130;
const HZ = 852; // the horizon
const SHORE = 1236; // where the beach begins

function build() {
  const p = new Plate({ paper: CREAM, seed: 1960 });
  const r = p.r;
  p.clip = { x: PX0, y: PY0, w: PX1 - PX0, h: PY1 - PY0 };
  p.stack('p0', 'l0', 'p1', 'l1', 'p2', 'l2', 'boats', 'p3', 'l3', 'p4', 'l4', 'border', 'title', 'glass');
  for (const n of ['border', 'title', 'glass']) p.layer(n, { clip: false });

  border(p, r);
  sky(p, r);
  mamelles(p, r);
  sea(p, r);
  goree(p, r);
  fishing(p, r);
  beach(p, r);
  people(p, r);
  life(p, r);
  title(p, r);
  glass(p);
  return p;
}

// inked, then filled: the black line wipes in, then its colors come up under it
function ink(p, k, t, box, line, fill, o = {}) {
  p.mark(`l${k}`, { t, d: o.ld ?? 0.6, reveal: o.lr || 'wipe', ease: 'inOut', box, draw: line });
  p.mark(`p${k}`, { t: t + (o.lag ?? 0.4), d: o.fd ?? 0.6, reveal: 'fade', box, draw: fill });
}
function stroke(c, lw = 4) { c.strokeStyle = K; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }

// ================================================================ the border
function framePath(c) {
  c.beginPath(); c.rect(0, 0, W, H);
  c.rect(PX0, PY0, PX1 - PX0, PY1 - PY0);
  c.rect(PX0, TY0, PX1 - PX0, TY1 - TY0);
}
// a band of triangles, pointing in and out by turns, colors running round
const TRI = [RED, YEL, GRN, BLUE_L, ORA, PINK];
function triBand(x0, y0, x1, y1, T, step, k0 = 0) {
  // along the segment from (x0, y0) to (x1, y1), across a band T wide to its left
  const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = uy, ny = -ux;
  const n = Math.round(L / step), s = L / n, tris = [];
  for (let i = 0; i < n; i++) {
    const a = i * s, b = a + s, m = a + s / 2;
    const P = (d, h) => [x0 + ux * d + nx * h, y0 + uy * d + ny * h];
    tris.push({ pts: [P(a, 0), P(b, 0), P(m, T)], col: TRI[(i + k0) % TRI.length] });
    tris.push({ pts: [P(m, T), P(b, 0), P(b + s / 2, T)], col: null, dot: P(b, T * 0.72) });
  }
  return tris;
}
function border(p, r) {
  const ALL = { x: 0, y: 0, w: W, h: H };
  p.mark('border', { t: 0, d: 0.7, reveal: 'fade', box: ALL, draw: (c) => { framePath(c); c.fillStyle = K; c.fill('evenodd'); } });
  // the triangles round the outside, and along the band between picture and title
  const T = 46, S = 54, m = 64;
  const runs = [
    triBand(m, m, W - m, m, -T, S, 0).map((q) => ({ ...q, pts: q.pts })),
    triBand(W - m, m, W - m, H - m, -T, S, 2),
    triBand(W - m, H - m, m, H - m, -T, S, 4),
    triBand(m, H - m, m, m, -T, S, 1),
  ];
  // the segments run clockwise; with the band on the inner side
  runs.forEach((tris, i) => {
    p.group('border', ALL, (c) => {
      for (const q of tris) if (q.col) { c.fillStyle = q.col; poly(c, q.pts); c.fill(); }
      c.fillStyle = WHITE;
      for (const q of tris) if (q.dot) { c.beginPath(); c.arc(q.dot[0], q.dot[1], 4.5, 0, Math.PI * 2); c.fill(); }
    }, { t: 0.4 + i * 0.25, d: 0.8, reveal: i === 0 ? 'wipe' : i === 1 ? 'fall' : i === 2 ? 'wipeL' : 'rise', ease: 'inOut' });
  });
  // the middle band: a red and yellow zigzag between white rules
  const zig = [];
  for (let x = PX0; x <= PX1; x += 40) zig.push([x, (x - PX0) % 80 === 0 ? PY1 + 22 : PY1 + 58]);
  p.group('border', { x: PX0 - 10, y: PY1, w: PX1 - PX0 + 20, h: TY0 - PY1 }, (c) => {
    c.fillStyle = RED; c.fillRect(PX0, PY1 + 16, PX1 - PX0, 48);
    c.fillStyle = YEL; c.beginPath(); c.moveTo(PX0, PY1 + 64); for (const [x, y] of zig) c.lineTo(x, y); c.lineTo(PX1, PY1 + 64); c.fill();
    c.beginPath(); for (const [x, y] of zig) c.lineTo(x, y); stroke(c, 3);
    c.fillStyle = WHITE; c.fillRect(PX0, PY1 + 10, PX1 - PX0, 5); c.fillRect(PX0, PY1 + 65, PX1 - PX0, 5);
  }, { t: 1.3, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // the white rules that edge the picture and the panel, and the rosettes at the corners
  p.group('border', ALL, (c) => {
    c.strokeStyle = WHITE; c.lineWidth = 4;
    c.strokeRect(PX0 - 9, PY0 - 9, PX1 - PX0 + 18, PY1 - PY0 + 18);
    c.strokeRect(PX0 - 9, TY0 - 9, PX1 - PX0 + 18, TY1 - TY0 + 18);
    c.strokeStyle = YEL; c.lineWidth = 2; c.strokeRect(20, 20, W - 40, H - 40);
    for (const [x, y] of [[m - 24, m - 24], [W - m + 24, m - 24], [m - 24, H - m + 24], [W - m + 24, H - m + 24]]) flower(c, x, y, 26, RED, YEL);
  }, { t: 1.6, d: 0.6, reveal: 'fade' });
}
function flower(c, x, y, rr, petal, heart) {
  c.fillStyle = petal;
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; c.beginPath(); c.ellipse(x + Math.cos(a) * rr * 0.55, y + Math.sin(a) * rr * 0.55, rr * 0.45, rr * 0.28, a, 0, Math.PI * 2); c.fill(); c.lineWidth = 2; c.strokeStyle = K; c.stroke(); }
  c.fillStyle = heart; c.beginPath(); c.arc(x, y, rr * 0.3, 0, Math.PI * 2); c.fill(); c.lineWidth = 2.5; c.strokeStyle = K; c.stroke();
}

// ================================================================ the sky
function sky(p, r) {
  // the flat sky, deeper at the top in two painted bands
  p.group('p0', { x: PX0, y: PY0, w: PX1 - PX0, h: HZ - PY0 + 20 }, (c) => {
    c.fillStyle = SKY; c.fillRect(PX0, PY0, PX1 - PX0, HZ - PY0 + 20);
    c.fillStyle = SKY_L; c.beginPath(); c.moveTo(PX0, 640);
    for (let x = PX0; x <= PX1; x += 20) c.lineTo(x, 640 + Math.sin(x / 70) * 8);
    c.lineTo(PX1, HZ + 20); c.lineTo(PX0, HZ + 20); c.fill();
    c.fillStyle = '#3f9ad6'; c.beginPath(); c.moveTo(PX0, 330);
    for (let x = PX0; x <= PX1; x += 20) c.lineTo(x, 330 + Math.sin(x / 80 + 1) * 8);
    c.lineTo(PX1, PY0); c.lineTo(PX0, PY0); c.fill();
  }, { t: 0.8, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // the sun: a disc in rings, its rays flames round it
  const SX = 380, SY = 360;
  const rays = [];
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; rays.push([[SX + Math.cos(a - 0.12) * 104, SY + Math.sin(a - 0.12) * 104], [SX + Math.cos(a) * (k % 2 ? 150 : 176), SY + Math.sin(a) * (k % 2 ? 150 : 176)], [SX + Math.cos(a + 0.12) * 104, SY + Math.sin(a + 0.12) * 104]]); }
  const sunBox = { x: SX - 185, y: SY - 185, w: 370, h: 370 };
  ink(p, 0, 1.8, sunBox,
    (c) => { for (const q of rays) { poly(c, q); stroke(c, 3.5); } c.beginPath(); c.arc(SX, SY, 100, 0, Math.PI * 2); stroke(c, 5); c.beginPath(); c.arc(SX, SY, 70, 0, Math.PI * 2); stroke(c, 3); },
    (c) => {
      for (let i = 0; i < rays.length; i++) { c.fillStyle = i % 2 ? ORA : YEL; poly(c, rays[i]); c.fill(); }
      c.fillStyle = ORA; c.beginPath(); c.arc(SX, SY, 100, 0, Math.PI * 2); c.fill();
      c.fillStyle = YEL; c.beginPath(); c.arc(SX, SY, 70, 0, Math.PI * 2); c.fill();
      c.fillStyle = RED; for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; c.beginPath(); c.arc(SX + Math.cos(a) * 85, SY + Math.sin(a) * 85, 4, 0, Math.PI * 2); c.fill(); }
    }, { lr: 'iris', ld: 0.8 });
  // clouds, scalloped, white
  const clouds = [[760, 240, 1.1], [1000, 470, 0.7], [600, 560, 0.75]];
  clouds.forEach(([x, y, s], i) => {
    const bumps = [];
    const n = 5;
    for (let k = 0; k < n; k++) { const u = k / (n - 1); bumps.push([x + (u - 0.5) * 200 * s, y - Math.sin(u * Math.PI) * 26 * s, (30 + Math.sin(u * Math.PI) * 18) * s]); }
    const path = (c, g) => {
      c.beginPath();
      for (const [bx, by, br] of bumps) { c.moveTo(bx + br + g, by); c.arc(bx, by, br + g, 0, Math.PI * 2); }
      c.rect(x - 128 * s - g, y - 10 * s - g, 256 * s + 2 * g, 26 * s + 2 * g);
    };
    const box = { x: x - 160 * s, y: y - 100 * s, w: 320 * s, h: 140 * s };
    p.mark('l0', { t: 2.3 + i * 0.2, d: 0.5, reveal: 'wipe', ease: 'inOut', box, draw: (c) => { path(c, 4); c.fillStyle = K; c.fill(); } });
    p.mark('l0', {
      t: 2.6 + i * 0.2, d: 0.5, reveal: 'fade', box,
      draw: (c) => {
        path(c, 0); c.fillStyle = WHITE; c.fill();
        c.fillStyle = SKY_L; c.fillRect(x - 128 * s, y + 4 * s, 256 * s, 12 * s);
        c.beginPath(); for (const [bx, by, br] of bumps.slice(1, -1)) { c.moveTo(bx - br * 0.6, by + br * 0.45); c.quadraticCurveTo(bx, by + br * 0.15, bx + br * 0.6, by + br * 0.45); } stroke(c, 2.5);
      },
    });
  });
}

// ================================================================ the Mamelles, the monument and the lighthouse
function hillPts(x0, x1, peak, foot) {
  const pts = [];
  for (let i = 0; i <= 30; i++) { const u = i / 30, x = lerp(x0, x1, u); pts.push([x, foot - (foot - peak) * Math.sin(u * Math.PI) ** 0.75]); }
  return pts;
}
function mamelles(p, r) {
  // the far hill with the lighthouse, the nearer one with the monument drawn taller
  // (in life the lighthouse's hill is the higher)
  const h1 = hillPts(780, 1180, 700, HZ + 40), h2 = hillPts(1000, PX1 + 140, 648, HZ + 40);
  const tufts = [];
  for (let i = 0; i < 160; i++) { const x = r.range(800, PX1), y = r.range(620, HZ + 20); tufts.push([x, y, r.pick([GRN_D, '#c98b2e', GRN])]); }
  const inHill = (x, y, h) => { for (let i = 1; i < h.length; i++) if (h[i][0] >= x) return y > lerp(h[i - 1][1], h[i][1], (x - h[i - 1][0]) / (h[i][0] - h[i - 1][0])) + 8; return false; };
  const t1 = tufts.filter(([x, y]) => inHill(x, y, h1) && !inHill(x, y, h2)), t2 = tufts.filter(([x, y]) => inHill(x, y, h2));
  ink(p, 0, 3.3, boxOf(h1, 6), (c) => { c.beginPath(); for (const q of h1) c.lineTo(q[0], q[1]); stroke(c, 5); },
    (c) => { c.fillStyle = '#9cc456'; poly(c, h1); c.fill(); dots(c, t1); });
  ink(p, 0, 3.5, boxOf(h2, 6), (c) => { c.beginPath(); for (const q of h2) c.lineTo(q[0], q[1]); stroke(c, 5); },
    (c) => { c.fillStyle = '#d7a64b'; poly(c, h2); c.fill(); c.fillStyle = '#c7913a'; c.beginPath(); c.moveTo(1000, HZ + 40); for (const q of h2) c.lineTo(q[0], Math.max(q[1] + 70, q[1] + (HZ - q[1]) * 0.5)); c.lineTo(PX1 + 140, HZ + 40); c.fill(); dots(c, t2); });
  lighthouse(p, 970, 704);
  monument(p, 1262, 652);
}
function dots(c, pts) {
  for (const [x, y, col] of pts) { c.fillStyle = col; c.beginPath(); c.moveTo(x - 5, y + 3); c.lineTo(x, y - 7); c.lineTo(x + 5, y + 3); c.fill(); }
}
function lighthouse(p, x, y) {
  // the white house along the crest, its tower in the middle, a red lantern on top
  const box = { x: x - 90, y: y - 150, w: 180, h: 160 };
  const shapes = (c, f) => {
    const rect = (a, b, w, h, col) => { c.beginPath(); c.rect(a, b, w, h); if (f) { c.fillStyle = col; c.fill(); } else stroke(c, 3); };
    rect(x - 80, y - 46, 160, 46, WHITE);
    rect(x - 22, y - 112, 44, 66, WHITE);
    rect(x - 30, y - 118, 60, 8, RED);
    rect(x - 14, y - 140, 28, 22, YEL);
    c.beginPath(); c.moveTo(x - 18, y - 140); c.quadraticCurveTo(x, y - 162, x + 18, y - 140); c.closePath();
    if (f) { c.fillStyle = RED; c.fill(); } else stroke(c, 3);
  };
  ink(p, 0, 3.8, box, (c) => {
    shapes(c, false);
    for (let k = 0; k < 6; k++) { c.beginPath(); c.rect(x - 70 + k * 24 + (k > 2 ? 24 : 0), y - 34, 10, 18); stroke(c, 2); }
    c.beginPath(); c.moveTo(x, y - 140); c.lineTo(x, y - 118); stroke(c, 2);
  }, (c) => {
    shapes(c, true);
    c.fillStyle = BLUE; for (let k = 0; k < 6; k++) c.fillRect(x - 70 + k * 24 + (k > 2 ? 24 : 0), y - 34, 10, 18);
    c.fillStyle = BLUE; c.fillRect(x - 8, y - 96, 16, 22);
  });
}
// the monument, facing the sea: a man striding forward with a child held high on
// his raised arm, the child pointing out to sea, and a woman behind him, her arm
// and her cloth swept back. Painted as the souwère painter would: flat bronze in
// two tones, each body inked round, a few lights along the limbs.
function monument(p, x, y) {
  const s = 1.12;
  const BR_D = '#4e3019', BR_K = '#3a2312';
  // the woman, behind: her dress flaring back, her head thrown back, a bun
  const dress = [[22, -240], [48, -236], [56, -196], [60, -168], [96, -82], [132, -8], [92, 0], [18, 0], [16, -92], [26, -170]];
  const cloth = [[42, -246], [88, -268], [136, -262], [164, -240], [128, -242], [94, -232], [52, -226]];
  // the man: two striding legs, a broad leaning torso, a waistcloth
  const legB = [[-22, -152], [6, -152], [32, -6], [40, 0], [14, 0], [-6, -88]];
  const legF = [[-34, -152], [-6, -146], [-44, -82], [-72, -6], [-102, 0], [-88, -12], [-68, -88]];
  const torso = [[-38, -150], [0, -150], [8, -200], [4, -250], [-18, -264], [-58, -260], [-66, -236], [-50, -198]];
  const waist = [[-42, -160], [4, -160], [8, -140], [-6, -120], [-30, -124], [-46, -136]];
  // the child, sitting on the man's hand
  const child = [[-74, -336], [-48, -336], [-46, -372], [-70, -378]];
  // limbs as thick strokes: [points, width]
  const wArm = [[[46, -232], [86, -214], [124, -196]], 14];
  const mBack = [[[-4, -248], [26, -214], [40, -180]], 19];
  const mUp = [[[-56, -252], [-74, -300], [-62, -338]], 22];
  const cArm = [[[-64, -368], [-88, -384], [-114, -396]], 10];
  const cLegs = [[[-72, -340], [-94, -338], [-98, -318]], 10];
  const P = (q) => [x + q[0] * s, y - 26 + q[1] * s];
  const limb = (c, [pts, w], grow) => { const [a, b, d] = pts.map(P); c.lineWidth = w * s + grow; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(b[0], b[1], d[0], d[1]); c.stroke(); };
  const head = (c, hx, hy, hr, grow) => { const Q = P([hx, hy]); c.beginPath(); c.arc(Q[0], Q[1], hr * s + grow, 0, Math.PI * 2); c.fill(); };
  const shape = (c, pts, grow) => { poly(c, pts.map(P)); c.fill(); if (grow) { c.lineWidth = grow; c.lineJoin = 'round'; c.stroke(); } };
  // each body in turn, back to front: black outline, then its bronze, so a line parts them
  const body = (c, col, parts) => {
    c.fillStyle = K; c.strokeStyle = K;
    for (const pt of parts) pt(c, 8);
    c.fillStyle = col; c.strokeStyle = col;
    for (const pt of parts) pt(c, 0);
  };
  const woman = [(c, g) => shape(c, cloth, g), (c, g) => limb(c, wArm, g), (c, g) => shape(c, dress, g), (c, g) => head(c, 40, -262, 16, g / 2), (c, g) => head(c, 56, -270, 9, g / 2)];
  const man = [(c, g) => limb(c, mBack, g), (c, g) => shape(c, legB, g), (c, g) => shape(c, legF, g), (c, g) => shape(c, torso, g), (c, g) => { const a = P([-36, -262]); c.fillRect(a[0] - 9 * s - g / 2, a[1] - 10 * s - g / 2, 18 * s + g, 14 * s + g); }, (c, g) => head(c, -38, -284, 20, g / 2), (c, g) => limb(c, mUp, g)];
  const kid = [(c, g) => limb(c, cLegs, g), (c, g) => shape(c, child, g), (c, g) => limb(c, cArm, g), (c, g) => head(c, -60, -392, 14, g / 2)];
  const lights = (c) => {
    // the lights down the lit (left) edges, and a few lines of muscle and fold
    c.strokeStyle = BRONZE_L; c.lineCap = 'round'; c.lineWidth = 5;
    const line = (pts) => { c.beginPath(); pts.map(P).forEach(([a, b], i) => (i ? c.lineTo(a, b) : c.moveTo(a, b))); c.stroke(); };
    line([[-90, -10], [-64, -86], [-30, -146]]); line([[-58, -250], [-62, -234], [-48, -200], [-36, -160]]);
    line([[-64, -258], [-78, -300], [-70, -330]]); line([[22, -80], [24, -168], [28, -230]]); line([[-70, -340], [-68, -372]]);
    c.lineWidth = 3; c.strokeStyle = BR_K;
    line([[-46, -214], [-30, -222], [-12, -214]]); line([[-36, -236], [-22, -238]]);
    line([[40, -150], [70, -60], [96, -6]]); line([[34, -140], [46, -60], [56, -2]]);
    line([[70, -248], [110, -252], [146, -244]]);
    c.fillStyle = BRONZE_L; for (const [hx, hy, hr] of [[-38, -284, 20], [-60, -392, 14], [40, -262, 16]]) { const Q = P([hx - hr * 0.35, hy - hr * 0.25]); c.beginPath(); c.arc(Q[0], Q[1], hr * s * 0.38, 0, Math.PI * 2); c.fill(); }
    // the waistcloth, darker
    c.fillStyle = BR_K; poly(c, waist.map(P)); c.fill();
  };
  const base = [[-130, 0], [150, 0], [172, 26], [-152, 26]];
  const bx = { x: x - 180, y: y - 500, w: 420, h: 510 };
  // the base first, inked then filled
  ink(p, 0, 4.0, { x: x - 190, y: y - 36, w: 400, h: 70 },
    (c) => { poly(c, base.map(P)); stroke(c, 4); c.beginPath(); c.moveTo(x - 140 * s, y - 12); c.lineTo(x + 160 * s, y - 12); stroke(c, 2.5); },
    (c) => { c.fillStyle = WHITE; poly(c, base.map(P)); c.fill(); c.fillStyle = '#d8d2c0'; c.fillRect(x - 140 * s, y - 12, 300 * s, 12); });
  // the black silhouette rises, then the bronze is laid inside it, body by body
  p.mark('l0', { t: 4.3, d: 1.2, reveal: 'rise', ease: 'out', box: bx, draw: (c) => { c.fillStyle = K; c.strokeStyle = K; for (const pt of [...woman, ...man, ...kid]) pt(c, 10); } });
  p.mark('l0', {
    t: 4.9, d: 0.8, reveal: 'fade', box: bx,
    draw: (c) => { body(c, BR_D, woman); body(c, BRONZE, man); body(c, '#7a5030', kid); lights(c); },
  });
}

// ================================================================ the sea
function sea(p, r) {
  const bands = [[HZ, BLUE_D], [960, BLUE], [1080, BLUE_L], [1170, TURQ]];
  const edge = (y0, k) => { const pts = []; for (let x = PX0 - 10; x <= PX1 + 10; x += 24) pts.push([x, y0 + Math.sin(x / 60 + k) * 6]); return pts; };
  p.group('p1', { x: PX0, y: HZ - 4, w: PX1 - PX0, h: SHORE - HZ + 40 }, (c) => {
    bands.forEach(([y0, col], i) => { c.fillStyle = col; const e = i ? edge(y0, i) : [[PX0, y0], [PX1, y0]]; c.beginPath(); for (const q of e) c.lineTo(q[0], q[1]); c.lineTo(PX1 + 10, SHORE + 40); c.lineTo(PX0 - 10, SHORE + 40); c.fill(); });
  }, { t: 4.6, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // the waves: rows of white scallops, and the black line of the horizon
  const waves = [];
  for (let y = HZ + 24; y < SHORE; y += 22) {
    const k = (y - HZ) / (SHORE - HZ), w = lerp(12, 34, k);
    for (let x = PX0 + r.range(0, w * 2); x < PX1; x += w * r.range(2.4, 4)) waves.push([x, y + r.range(-4, 4), w]);
  }
  p.group('l1', { x: PX0, y: HZ - 6, w: PX1 - PX0, h: SHORE - HZ + 12 }, (c) => {
    c.beginPath(); c.moveTo(PX0, HZ); c.lineTo(PX1, HZ); stroke(c, 4);
    c.strokeStyle = WHITE; c.lineWidth = 2.6; c.lineCap = 'round';
    c.beginPath(); for (const [x, y, w] of waves) { c.moveTo(x - w, y); c.quadraticCurveTo(x - w / 2, y - w * 0.45, x, y); c.quadraticCurveTo(x + w / 2, y - w * 0.45, x + w, y); } c.stroke();
  }, { t: 5.0, d: 0.9, reveal: 'fall', ease: 'inOut' });
}

// ================================================================ Gorée
function goree(p, r) {
  const isl = [[PX0 - 10, 990], [PX0 - 10, 900], [190, 880], [250, 836], [300, 828], [350, 850], [420, 905], [560, 915], [700, 928], [760, 960], [780, 994]];
  ink(p, 1, 5.4, boxOf(isl, 6), (c) => { c.beginPath(); for (const q of isl) c.lineTo(q[0], q[1]); stroke(c, 4.5); },
    (c) => { c.fillStyle = OCHRE; poly(c, isl); c.fill(); c.fillStyle = SAND; c.fillRect(PX0, 976, 660, 18); });
  // the fort on the hill: a round bastion and its wall with cannon ports
  const fort = (c, f) => {
    c.beginPath(); c.rect(220, 806, 120, 34); if (f) { c.fillStyle = '#c9a36a'; c.fill(); } else stroke(c, 3.5);
    c.beginPath(); c.rect(242, 776, 80, 30); if (f) { c.fillStyle = '#d8b47a'; c.fill(); } else stroke(c, 3);
  };
  ink(p, 1, 5.7, { x: 200, y: 760, w: 160, h: 90 }, (c) => { fort(c, false); for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(240 + k * 26, 822, 4, 0, Math.PI * 2); stroke(c, 2); } },
    (c) => { fort(c, true); c.fillStyle = K; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(240 + k * 26, 822, 4, 0, Math.PI * 2); c.fill(); } });
  // the houses: tiled roofs and flat ones, balconies, shutters
  const hs = [];
  let x = 360;
  while (x < 740) {
    const w = r.range(36, 58), h = r.range(40, 74), base = 978;
    hs.push({ x, w, h, base, col: r.pick([OCHRE, BRICK, PINK, YEL, WHITE, '#e98a5a', '#c9e0f0']), roof: r.chance(0.6), bal: r.chance(0.6), sh: r.pick([GRN, BLUE, RED]) });
    x += w + r.range(-4, 6);
  }
  hs.sort((a, b) => b.h - a.h);
  const hb = { x: 340, y: 880, w: 420, h: 110 };
  ink(p, 1, 6.0, hb, (c) => {
    for (const h of hs) {
      c.beginPath(); c.rect(h.x, h.base - h.h, h.w, h.h); stroke(c, 3);
      if (h.roof) { c.beginPath(); c.moveTo(h.x - 4, h.base - h.h); c.lineTo(h.x + h.w / 2, h.base - h.h - 18); c.lineTo(h.x + h.w + 4, h.base - h.h); c.closePath(); stroke(c, 3); }
      if (h.bal) { c.beginPath(); c.moveTo(h.x - 3, h.base - h.h * 0.5); c.lineTo(h.x + h.w + 3, h.base - h.h * 0.5); stroke(c, 2.5); }
      for (let k = 0; k < Math.floor(h.w / 16); k++) { c.beginPath(); c.rect(h.x + 6 + k * 16, h.base - h.h * 0.85, 8, 12); stroke(c, 1.6); c.beginPath(); c.rect(h.x + 6 + k * 16, h.base - h.h * 0.42, 8, 12); stroke(c, 1.6); }
    }
  }, (c) => {
    for (const h of hs) {
      c.fillStyle = h.col; c.fillRect(h.x, h.base - h.h, h.w, h.h);
      if (h.roof) { c.fillStyle = RED_D; c.beginPath(); c.moveTo(h.x - 4, h.base - h.h); c.lineTo(h.x + h.w / 2, h.base - h.h - 18); c.lineTo(h.x + h.w + 4, h.base - h.h); c.fill(); }
      c.fillStyle = h.sh;
      for (let k = 0; k < Math.floor(h.w / 16); k++) { c.fillRect(h.x + 6 + k * 16, h.base - h.h * 0.85, 8, 12); c.fillRect(h.x + 6 + k * 16, h.base - h.h * 0.42, 8, 12); }
    }
  }, { lr: 'rise' });
  // the island's baobab and two palms
  const bt = [[192, 880], [180, 840], [166, 812]];
  ink(p, 1, 6.4, { x: 140, y: 760, w: 120, h: 130 }, (c) => {
    c.beginPath(); c.moveTo(178, 884); c.lineTo(182, 822); c.lineTo(160, 800); c.moveTo(182, 822); c.lineTo(200, 796); c.moveTo(181, 840); c.lineTo(214, 826); stroke(c, 10);
    c.beginPath(); c.ellipse(186, 792, 42, 18, 0, 0, Math.PI * 2); stroke(c, 3);
  }, (c) => {
    c.strokeStyle = BARK; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(178, 884); c.lineTo(182, 822); c.lineTo(160, 800); c.moveTo(182, 822); c.lineTo(200, 796); c.moveTo(181, 840); c.lineTo(214, 826); c.stroke();
    c.fillStyle = GRN; c.beginPath(); c.ellipse(186, 792, 42, 18, 0, 0, Math.PI * 2); c.fill();
  });
}

// ================================================================ the pirogues
// a pirogue on the water, (x, y) the middle of its keel; dir -1 points its bow left
function pirogueShape(L) {
  const H = 0.13 * L;
  return [[-0.6 * L, -H - 0.1 * L], [-0.5 * L, -H], [0.5 * L, -H], [0.58 * L, -H - 0.08 * L], [0.48 * L, -H * 0.3], [0.38 * L, 0], [-0.4 * L, 0], [-0.5 * L, -H * 0.35]];
}
function pirogue(c, x, y, L, dir, pal, tilt, mode) {
  c.save(); c.translate(x, y); c.rotate(tilt); c.scale(dir, 1);
  const pts = pirogueShape(L), H = 0.13 * L;
  if (mode !== 'line') {
    c.fillStyle = pal[0]; poly(c, pts); c.fill();
    c.save(); poly(c, pts); c.clip();
    // the painted bands: a stripe, a row of triangles, a wavy line, dots
    c.fillStyle = pal[1]; c.fillRect(-0.7 * L, -H * 0.75, 1.4 * L, H * 0.28);
    c.fillStyle = pal[2];
    for (let k = -0.6; k < 0.6; k += 0.045) { c.beginPath(); c.moveTo(k * L, -H * 0.47); c.lineTo((k + 0.0225) * L, -H * 0.12); c.lineTo((k + 0.045) * L, -H * 0.47); c.fill(); }
    c.fillStyle = pal[3]; c.fillRect(-0.7 * L, -H - 0.12 * L, 1.4 * L, 0.12 * L + H * 0.06);
    c.restore();
    // the eye at the bow
    c.fillStyle = WHITE; c.beginPath(); c.ellipse(-0.47 * L, -H * 0.62, H * 0.2, H * 0.13, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = K; c.beginPath(); c.arc(-0.47 * L, -H * 0.62, H * 0.08, 0, Math.PI * 2); c.fill();
  }
  if (mode !== 'fill') {
    poly(c, pts); stroke(c, Math.max(2.5, L * 0.008));
    c.beginPath(); c.moveTo(-0.5 * L, -H); c.lineTo(0.5 * L, -H); c.moveTo(-0.5 * L, -H * 0.75); c.lineTo(0.48 * L, -H * 0.75); stroke(c, Math.max(1.6, L * 0.004));
    // the bow's spike and a pennant on the stern
    c.beginPath(); c.moveTo(-0.6 * L, -H - 0.1 * L); c.lineTo(-0.66 * L, -H - 0.16 * L); stroke(c, Math.max(2.5, L * 0.01));
  }
  c.restore();
}
function fishing(p, r) {
  // out on the water, crews at their lines
  const boats = [[1000, 1000, 200, 1, [YEL, RED, GRN, BLUE], -0.02], [640, 1110, 260, -1, [GRN, YEL, RED, WHITE], 0.02], [1260, 1150, 300, -1, [BLUE_L, WHITE, RED, YEL], -0.01]];
  boats.forEach(([x, y, L, dir, pal, tilt], i) => {
    const crew = [];
    for (let k = 0; k < 3; k++) crew.push([x + (k - 1) * L * 0.22 * dir, y - 0.13 * L, r.pick([RED, YEL, WHITE, PINK, ORA]), L / 260]);
    const box = { x: x - L * 0.75, y: y - L * 0.55, w: L * 1.5, h: L * 0.6 };
    ink(p, 2, 6.6 + i * 0.3, box, (c) => { pirogue(c, x, y, L, dir, pal, tilt, 'line'); for (const f of crew) figure(c, ...f, 'line'); },
      (c) => { pirogue(c, x, y, L, dir, pal, tilt, 'fill'); for (const f of crew) figure(c, ...f, 'fill'); });
  });
}
// a fisherman standing in a boat: shirt, head, cap, arms out to his line
function figure(c, x, y, col, s, mode) {
  const body = () => { c.beginPath(); c.moveTo(x - 9 * s, y); c.lineTo(x - 7 * s, y - 30 * s); c.lineTo(x + 7 * s, y - 30 * s); c.lineTo(x + 9 * s, y); c.closePath(); };
  if (mode === 'fill') {
    c.fillStyle = col; body(); c.fill();
    c.fillStyle = SKIN; c.beginPath(); c.arc(x, y - 38 * s, 7 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = col === RED ? YEL : RED; c.fillRect(x - 7 * s, y - 47 * s, 14 * s, 5 * s);
    c.strokeStyle = SKIN; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(x - 6 * s, y - 26 * s); c.lineTo(x - 18 * s, y - 14 * s); c.stroke();
  } else {
    body(); stroke(c, 2.2);
    c.beginPath(); c.arc(x, y - 38 * s, 7 * s, 0, Math.PI * 2); stroke(c, 2.2);
    c.beginPath(); c.moveTo(x - 6 * s, y - 26 * s); c.lineTo(x - 18 * s, y - 14 * s); stroke(c, 6.5 * s);
    c.beginPath(); c.moveTo(x - 18 * s, y - 14 * s); c.lineTo(x - 30 * s, y + 18 * s); stroke(c, 1.2);
  }
}

// ================================================================ the beach
function beach(p, r) {
  const shore = []; for (let x = PX0 - 10; x <= PX1 + 10; x += 20) shore.push([x, SHORE + Math.sin(x / 90) * 10]);
  const sand = [...shore, [PX1 + 10, PY1 + 10], [PX0 - 10, PY1 + 10]];
  const speck = []; for (let i = 0; i < 500; i++) speck.push([r.range(PX0, PX1), r.range(SHORE + 30, PY1), r.pick([SAND_D, '#fbe3a0', ORA])]);
  p.group('p3', boxOf(sand, 4), (c) => {
    c.fillStyle = SAND; poly(c, sand); c.fill();
    // the wet sand along the water, darker
    c.fillStyle = '#e2ad55'; c.beginPath(); for (const q of shore) c.lineTo(q[0], q[1]); for (let i = shore.length - 1; i >= 0; i--) c.lineTo(shore[i][0], shore[i][1] + 22); c.fill();
    for (const [x, y, col] of speck) { c.fillStyle = col; c.fillRect(x, y, 3, 3); }
  }, { t: 7.3, d: 0.8, reveal: 'rise', ease: 'out' });
  // the foam: a white scalloped edge, inked
  p.group('l3', { x: PX0, y: SHORE - 30, w: PX1 - PX0, h: 60 }, (c) => {
    c.beginPath(); for (const q of shore) c.lineTo(q[0], q[1]); stroke(c, 4);
    c.fillStyle = WHITE;
    for (let x = PX0; x < PX1; x += 34) { const y = SHORE + Math.sin(x / 90) * 10; c.beginPath(); c.arc(x + 17, y - 2, 15, Math.PI, 0); c.fill(); c.lineWidth = 2.5; c.strokeStyle = K; c.stroke(); }
  }, { t: 7.5, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // the big pirogues, drawn up on the sand
  const big = [[560, 1350, 560, -1, [BLUE, YEL, RED, GRN], -0.05], [1110, 1314, 440, 1, [RED, WHITE, BLUE, YEL], 0.04], [1220, 1476, 600, -1, [GRN, YEL, BLUE_L, RED], 0.02]];
  big.forEach(([x, y, L, dir, pal, tilt], i) => {
    const box = { x: x - L * 0.75, y: y - L * 0.35, w: L * 1.5, h: L * 0.42 };
    ink(p, 3, 7.9 + i * 0.35, box, (c) => {
      pirogue(c, x, y, L, dir, pal, tilt, 'line');
      // the pennant on its pole at the stern
      const sx = x - dir * L * 0.42, sy = y - L * 0.13 - 4;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy - L * 0.22); stroke(c, 4);
      c.beginPath(); c.moveTo(sx, sy - L * 0.22); c.lineTo(sx - dir * L * 0.1, sy - L * 0.19); c.lineTo(sx, sy - L * 0.16); stroke(c, 3);
    }, (c) => {
      pirogue(c, x, y, L, dir, pal, tilt, 'fill');
      const sx = x - dir * L * 0.42, sy = y - L * 0.13 - 4;
      c.fillStyle = pal[1] === WHITE ? GRN : pal[1]; c.beginPath(); c.moveTo(sx, sy - L * 0.22); c.lineTo(sx - dir * L * 0.1, sy - L * 0.19); c.lineTo(sx, sy - L * 0.16); c.fill();
      // the shadow on the sand
      c.fillStyle = 'rgba(160,100,30,.4)'; c.beginPath(); c.ellipse(x, y + 6, L * 0.42, 10, tilt, 0, Math.PI * 2); c.fill();
    });
  });
}

// ================================================================ the people and the baobab
// a woman in a boubou with a basin of fish on her head
function woman(c, x, y, s, o, mode) {
  const dress = [[x - 34 * s, y], [x - 24 * s, y - 100 * s], [x - 44 * s, y - 92 * s], [x - 30 * s, y - 126 * s], [x + 30 * s, y - 126 * s], [x + 44 * s, y - 92 * s], [x + 24 * s, y - 100 * s], [x + 34 * s, y]];
  const wrap = [[x - 15 * s, y - 150 * s], [x - 20 * s, y - 172 * s], [x - 6 * s, y - 184 * s], [x + 16 * s, y - 180 * s], [x + 18 * s, y - 152 * s]];
  const bowl = [[x - 38 * s, y - 196 * s], [x + 38 * s, y - 196 * s], [x + 26 * s, y - 180 * s], [x - 26 * s, y - 180 * s]];
  if (mode === 'fill') {
    c.fillStyle = o.dress; poly(c, dress); c.fill();
    c.save(); poly(c, dress); c.clip();
    c.fillStyle = o.pat;
    for (const [dx, dy] of DRESSDOTS) { c.beginPath(); c.arc(x + dx * s, y + dy * s, 4 * s, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = o.hem; c.fillRect(x - 40 * s, y - 16 * s, 80 * s, 10 * s);
    c.restore();
    // arms up to steady the basin
    c.strokeStyle = SKIN; c.lineWidth = 9 * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - 30 * s, y - 118 * s); c.lineTo(x - 36 * s, y - 160 * s); c.lineTo(x - 30 * s, y - 186 * s); c.stroke();
    c.fillStyle = SKIN; c.beginPath(); c.ellipse(x, y - 140 * s, 15 * s, 18 * s, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = WHITE; c.beginPath(); c.arc(x - 6 * s, y - 142 * s, 2.6 * s, 0, Math.PI * 2); c.arc(x + 6 * s, y - 142 * s, 2.6 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = RED_D; c.fillRect(x - 5 * s, y - 131 * s, 10 * s, 3 * s);
    c.fillStyle = o.wrap; poly(c, wrap); c.fill();
    c.fillStyle = '#c9d3dc'; poly(c, bowl); c.fill();
    c.fillStyle = BLUE; c.fillRect(x - 30 * s, y - 191 * s, 60 * s, 4 * s);
    // the fish heaped in the basin, silver
    c.fillStyle = '#b9c7cf';
    for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x - 24 * s + k * 16 * s, y - 202 * s, 11 * s, 5 * s, k % 2 ? 0.3 : -0.3, 0, Math.PI * 2); c.fill(); }
  } else {
    poly(c, dress); stroke(c, 3);
    c.beginPath(); c.moveTo(x - 30 * s, y - 118 * s); c.lineTo(x - 36 * s, y - 160 * s); c.lineTo(x - 30 * s, y - 186 * s); stroke(c, 14 * s);
    c.beginPath(); c.ellipse(x, y - 140 * s, 15 * s, 18 * s, 0, 0, Math.PI * 2); stroke(c, 3);
    poly(c, wrap); stroke(c, 3);
    poly(c, bowl); stroke(c, 3);
    for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x - 24 * s + k * 16 * s, y - 202 * s, 11 * s, 5 * s, k % 2 ? 0.3 : -0.3, 0, Math.PI * 2); stroke(c, 2); }
  }
}
const DRESSDOTS = (() => { const r = rng(5); const a = []; for (let i = 0; i < 40; i++) a.push([r.range(-44, 44), r.range(-124, -18)]); return a; })();
// a fisherman carrying a big fish over his shoulder
function fisher(c, x, y, s, mode) {
  const shirt = [[x - 22 * s, y - 70 * s], [x - 24 * s, y - 140 * s], [x + 24 * s, y - 140 * s], [x + 22 * s, y - 70 * s]];
  const fish = (cc) => { cc.beginPath(); cc.ellipse(x + 34 * s, y - 120 * s, 46 * s, 14 * s, -0.5, 0, Math.PI * 2); };
  const tail = [[x + 70 * s, y - 146 * s], [x + 92 * s, y - 170 * s], [x + 96 * s, y - 140 * s]];
  if (mode === 'fill') {
    c.strokeStyle = '#2a3c6a'; c.lineWidth = 16 * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - 10 * s, y - 72 * s); c.lineTo(x - 14 * s, y - 4 * s); c.moveTo(x + 10 * s, y - 72 * s); c.lineTo(x + 16 * s, y - 4 * s); c.stroke();
    c.fillStyle = YEL; poly(c, shirt); c.fill();
    c.fillStyle = RED; for (let k = 0; k < 4; k++) c.fillRect(x - 22 * s, y - 130 * s + k * 16 * s, 44 * s, 6 * s);
    c.fillStyle = SKIN; c.beginPath(); c.ellipse(x, y - 158 * s, 14 * s, 17 * s, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = WHITE; c.beginPath(); c.arc(x - 5 * s, y - 160 * s, 2.4 * s, 0, Math.PI * 2); c.arc(x + 6 * s, y - 160 * s, 2.4 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = GRN; c.beginPath(); c.ellipse(x, y - 172 * s, 16 * s, 7 * s, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#9fb2bd'; fish(c); c.fill(); poly(c, tail); c.fill();
    c.fillStyle = WHITE; c.beginPath(); c.arc(x - 2 * s, y - 100 * s, 3 * s, 0, Math.PI * 2); c.fill();
    c.strokeStyle = SKIN; c.lineWidth = 9 * s; c.beginPath(); c.moveTo(x + 20 * s, y - 132 * s); c.lineTo(x + 34 * s, y - 112 * s); c.lineTo(x + 18 * s, y - 104 * s); c.stroke();
  } else {
    c.beginPath(); c.moveTo(x - 10 * s, y - 72 * s); c.lineTo(x - 14 * s, y - 4 * s); c.moveTo(x + 10 * s, y - 72 * s); c.lineTo(x + 16 * s, y - 4 * s); stroke(c, 22 * s);
    poly(c, shirt); stroke(c, 3);
    c.beginPath(); c.ellipse(x, y - 158 * s, 14 * s, 17 * s, 0, 0, Math.PI * 2); stroke(c, 3);
    fish(c); stroke(c, 3); poly(c, tail); stroke(c, 3);
    c.beginPath(); c.moveTo(x + 20 * s, y - 132 * s); c.lineTo(x + 34 * s, y - 112 * s); c.lineTo(x + 18 * s, y - 104 * s); stroke(c, 14 * s);
  }
}
function people(p, r) {
  // the baobab at the left: a swollen trunk, short crooked arms, a few leaves and hanging fruit
  const bx = 250, by = PY1 - 30;
  const trunk = [[bx - 110, by], [bx - 70, by - 120], [bx - 64, by - 290], [bx - 120, by - 400], [bx - 150, by - 440], [bx - 104, by - 430], [bx - 40, by - 330], [bx - 10, by - 470], [bx + 4, by - 520], [bx + 30, by - 470], [bx + 24, by - 340], [bx + 80, by - 420], [bx + 150, by - 450], [bx + 110, by - 400], [bx + 60, by - 290], [bx + 70, by - 120], [bx + 120, by]];
  const leaves = [[bx - 140, by - 450, 54], [bx - 10, by - 530, 60], [bx + 150, by - 460, 56], [bx + 70, by - 500, 40], [bx - 80, by - 500, 38]];
  const fruit = [[bx - 130, by - 400], [bx - 104, by - 396], [bx + 130, by - 410], [bx + 100, by - 380], [bx + 20, by - 470], [bx - 30, by - 476]];
  const lines = []; const rr = rng(33);
  for (let k = 0; k < 9; k++) { const x0 = bx + rr.range(-60, 60); lines.push([[x0, by - 10], [x0 + rr.range(-10, 10), by - 160], [x0 + rr.range(-20, 20), by - 280]]); }
  const tb = { x: bx - 210, y: by - 600, w: 430, h: 620 };
  ink(p, 4, 8.9, tb, (c) => {
    poly(c, trunk); stroke(c, 5);
    for (const l of lines) { c.beginPath(); c.moveTo(l[0][0], l[0][1]); c.quadraticCurveTo(l[1][0], l[1][1], l[2][0], l[2][1]); stroke(c, 2); }
    for (const [x, y, rr2] of leaves) { leafy(c, x, y, rr2); stroke(c, 3.5); }
    for (const [x, y] of fruit) { c.beginPath(); c.moveTo(x, y - 30); c.lineTo(x, y); stroke(c, 1.6); c.beginPath(); c.ellipse(x, y + 12, 7, 15, 0, 0, Math.PI * 2); stroke(c, 2.5); }
  }, (c) => {
    c.fillStyle = BARK; poly(c, trunk); c.fill();
    c.fillStyle = BARK_D; c.save(); poly(c, trunk); c.clip(); c.fillRect(bx + 20, by - 600, 200, 620); c.restore();
    for (const [x, y, rr2] of leaves) { c.fillStyle = GRN; leafy(c, x, y, rr2); c.fill(); c.fillStyle = GRN_L; c.beginPath(); c.arc(x - rr2 * 0.3, y - rr2 * 0.25, rr2 * 0.35, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#b8a06a'; for (const [x, y] of fruit) { c.beginPath(); c.ellipse(x, y + 12, 7, 15, 0, 0, Math.PI * 2); c.fill(); }
  }, { lr: 'rise', ld: 0.9 });
  // fish drying on a mat, and two baskets
  const mat = [[340, 1500], [560, 1488], [580, 1520], [350, 1530]];
  const fishes = []; for (let k = 0; k < 7; k++) fishes.push([370 + k * 28, 1500 + (k % 2) * 8 + k * -1.5]);
  ink(p, 4, 9.2, { x: 320, y: 1440, w: 300, h: 100 }, (c) => {
    poly(c, mat); stroke(c, 3);
    for (const [fx, fy] of fishes) { c.beginPath(); c.ellipse(fx, fy, 6, 15, 0.2, 0, Math.PI * 2); stroke(c, 2); }
    for (const bx of [740, 900]) { c.beginPath(); c.moveTo(bx - 26, 1470); c.lineTo(bx + 26, 1470); c.lineTo(bx + 20, 1500); c.lineTo(bx - 20, 1500); c.closePath(); stroke(c, 3); }
  }, (c) => {
    c.fillStyle = '#e8c27a'; poly(c, mat); c.fill();
    c.strokeStyle = '#c49b52'; c.lineWidth = 2; c.beginPath(); for (let k = 0; k < 8; k++) { c.moveTo(345 + k * 29, 1492 - k * 1.5); c.lineTo(352 + k * 29, 1528 - k * 1.5); } c.stroke();
    c.fillStyle = '#a7b8c2'; for (const [fx, fy] of fishes) { c.beginPath(); c.ellipse(fx, fy, 6, 15, 0.2, 0, Math.PI * 2); c.fill(); }
    for (const [bx, col] of [[740, ORA], [900, GRN]]) {
      c.fillStyle = col; c.beginPath(); c.moveTo(bx - 26, 1470); c.lineTo(bx + 26, 1470); c.lineTo(bx + 20, 1500); c.lineTo(bx - 20, 1500); c.fill();
      c.fillStyle = YEL; c.fillRect(bx - 23, 1480, 46, 5);
      c.fillStyle = '#b9c7cf'; c.beginPath(); c.ellipse(bx - 8, 1466, 12, 5, 0.3, 0, Math.PI * 2); c.ellipse(bx + 9, 1465, 12, 5, -0.3, 0, Math.PI * 2); c.fill();
    }
  });
  // the women and the fisherman, coming up from the boats
  const folk = [
    ['w', 640, 1496, 1.0, { dress: PURP, pat: YEL, hem: GRN, wrap: ORA }],
    ['w', 820, 1478, 0.92, { dress: RED, pat: WHITE, hem: YEL, wrap: GRN }],
    ['f', 980, 1514, 1.0],
    ['w', 1380, 1350, 0.7, { dress: GRN, pat: PINK, hem: RED, wrap: YEL }],
    ['w', 470, 1436, 0.62, { dress: BLUE, pat: WHITE, hem: ORA, wrap: PINK }],
  ];
  folk.forEach(([kind, x, y, s, o], i) => {
    const box = { x: x - 60 * s, y: y - 220 * s, w: 170 * s, h: 230 * s };
    ink(p, 4, 9.5 + i * 0.3, box,
      (c) => (kind === 'w' ? woman(c, x, y, s, o, 'line') : fisher(c, x, y, s, 'line')),
      (c) => (kind === 'w' ? woman(c, x, y, s, o, 'fill') : fisher(c, x, y, s, 'fill')),
      { lr: 'rise', ld: 0.6 });
  });
}
function leafy(c, x, y, rr) {
  c.beginPath();
  for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI * 2, d = rr * (k % 2 ? 0.75 : 1); c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6); }
  c.closePath();
}

// ================================================================ life
function life(p, r) {
  // two pirogues under sail, crossing slowly, rocking
  p.live('boats', {
    t: 10.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const k = time - 10.6;
      for (const [x0, y, L, v, pal, sail] of SAILS) {
        const x = PX0 - 200 + ((x0 + k * v) % (PX1 - PX0 + 400));
        const tilt = Math.sin(time * 1.3 + x0) * 0.03, yy = y + Math.sin(time * 1.1 + x0) * 2;
        // the sail: a tall triangle, patched
        c.fillStyle = sail; c.beginPath(); c.moveTo(x - L * 0.05, yy - L * 0.15); c.lineTo(x - L * 0.05, yy - L * 0.6); c.lineTo(x + L * 0.3, yy - L * 0.15); c.closePath(); c.fill();
        stroke(c, 2.5);
        c.beginPath(); c.moveTo(x - L * 0.05, yy - L * 0.32); c.lineTo(x + L * 0.14, yy - L * 0.24); stroke(c, 1.5);
        pirogue(c, x, yy, L, 1, pal, tilt, 'fill'); pirogue(c, x, yy, L, 1, pal, tilt, 'line');
      }
    },
  });
  // gulls and terns over the water
  const gs = [];
  for (let i = 0; i < 8; i++) gs.push([r.range(500, 1300), r.range(440, 780), r.range(40, 110), r.range(0.2, 0.4) * (r.chance(0.5) ? 1 : -1), r() * 7, r.range(1, 1.5)]);
  p.live('boats', {
    t: 10.9, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const [x0, y0, rx, w, ph, s] of gs) {
        const a = time * w + ph, x = x0 + Math.cos(a) * rx, y = y0 + Math.sin(a) * rx * 0.3, fl = Math.sin(time * 5 + ph * 3);
        c.beginPath(); c.moveTo(x - 14 * s, y - (4 + fl * 6) * s); c.quadraticCurveTo(x - 6 * s, y - 6 * s, x, y); c.quadraticCurveTo(x + 6 * s, y - 6 * s, x + 14 * s, y - (4 + fl * 6) * s);
        c.strokeStyle = WHITE; c.lineWidth = 5 * s; c.lineCap = 'round'; c.stroke(); stroke(c, 1.6 * s);
      }
    },
  });
  // the sun's rays, turning a little, and the foam coming and going at the shore
  p.live('boats', {
    t: 10.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = 'rgba(251,247,236,.85)'; c.lineWidth = 3; c.lineCap = 'round';
      const u = Math.sin(time * 0.9) * 0.5 + 0.5;
      c.beginPath();
      for (let x = PX0 + 10; x < PX1; x += 68) { const y = SHORE - 14 - u * 10 + Math.sin(x / 90) * 10; c.moveTo(x, y); c.quadraticCurveTo(x + 14, y - 6, x + 28, y); }
      c.stroke();
    },
  });
}
const SAILS = [[200, 1048, 120, 14, [RED, YEL, GRN, WHITE], WHITE], [900, 1196, 150, 10, [GRN, RED, YEL, BLUE_L], YEL]];

// ================================================================ the title
function title(p, r) {
  // the panel: white enamel with a ring of dots
  p.group('title', { x: PX0 - 4, y: TY0 - 4, w: PX1 - PX0 + 8, h: TY1 - TY0 + 8 }, (c) => {
    c.fillStyle = WHITE; c.fillRect(PX0, TY0, PX1 - PX0, TY1 - TY0);
    c.fillStyle = '#ffe7a8'; c.fillRect(PX0 + 14, TY0 + 14, PX1 - PX0 - 28, TY1 - TY0 - 28);
    c.fillStyle = RED; for (let x = PX0 + 30; x < PX1 - 20; x += 30) { c.beginPath(); c.arc(x, TY0 + 28, 5, 0, Math.PI * 2); c.fill(); }
    for (const x of [PX0 + 110, PX1 - 110]) flower(c, x, (TY0 + TY1) / 2, 44, GRN, YEL);
  }, { t: 10.6, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // DAKAR: each letter its own enamel, outlined thick in black, set down one by one
  const str = 'DAKAR', size = 196, font = `400 ${size}px "Shrikhand"`, base = 1786;
  const m = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  m.font = font;
  const track = 0.04 * size, total = m.measureText(str).width + track * (str.length - 1), x0 = W / 2 - total / 2;
  const cols = [RED, GRN, BLUE, ORA, PINK];
  for (let i = 0; i < str.length; i++) {
    const ch = str[i], gw = m.measureText(ch).width, gx = x0 + m.measureText(str.slice(0, i + 1)).width + track * i - gw;
    p.mark('title', {
      t: 11.1 + i * 0.22, d: 0.7, reveal: 'drop', dy: 40, ease: 'back', box: { x: gx - 30, y: base - size, w: gw + 60, h: size * 1.3 },
      draw: (c) => {
        c.font = font; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
        c.fillStyle = K; c.fillText(ch, gx + 9, base + 9);
        c.strokeStyle = K; c.lineWidth = 14; c.strokeText(ch, gx, base);
        c.fillStyle = cols[i]; c.fillText(ch, gx, base);
        // a white glint on each letter, as the painter's last touch
        c.save(); c.beginPath(); c.rect(gx, base - size * 0.72, gw, size * 0.16); c.clip(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillText(ch, gx, base); c.restore();
      },
    });
  }
  p.type('title', 'Ndakaaru  ·  Sénégal', W / 2, 1846, {
    family: '"Shrikhand", cursive', size: 36, color: RED_D, align: 'center', track: 0.06, t: 12.5, gap: 0.04, d: 0.5, reveal: 'fade',
  });
}

// ================================================================ the glass
function glass(p) {
  // the light on the glass: two broad diagonal reflections, and a cooler edge
  p.group('glass', { x: 0, y: 0, w: W, h: H }, (c) => {
    const band = (x, w, a) => {
      const g = c.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.save(); c.translate(0, 0); c.transform(1, 0, -0.45, 1, 0, 0); c.fillStyle = g; c.fillRect(x, 0, w, H); c.restore();
    };
    band(1100, 260, 0.16); band(1420, 90, 0.2); band(260, 140, 0.08);
  }, { t: 13.3, d: 1.1, reveal: 'wipe', ease: 'inOut' });
}
