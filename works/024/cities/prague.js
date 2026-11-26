// Prague: an Art Nouveau poster. A great round halo, its ring set with a mosaic
// of gold and sage, holds the city seen from the Vltava: the Charles Bridge
// running across with its statues on the piers, the Malá Strana bridge towers at
// one end and the Old Town Bridge Tower at the other, standing out of the ring;
// above them the roofs of Malá Strana with St. Nicholas's green dome, and the
// castle on its hill with the palace front and St. Vitus's spires and great tower.
// Petřín hill with its lookout tower on the left. Whiplash vines with leaves and
// poppies coil around the halo, and the name sits in a green tablet below.
// Muted greens and golds, everything drawn with a warm brown contour.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, mix, poly } from '../kit.js';

const PAPER = '#efe4c6', PANEL = '#d3c69c', PANEL_D = '#c3b487', INK = '#3b2a1f', INK_S = 'rgba(59,42,31,.55)';
const GOLD = '#c79f45', GOLD_L = '#e4ca7f', GOLD_D = '#9c7a30';
const SAGE = '#9aa67c', SAGE_L = '#b9c29b', OLIVE = '#62704a', OLIVE_D = '#475436', DEEP = '#34452f';
const ROSE = '#c98b77', ROSE_D = '#a8634f', TERRA = '#a9583f', TERRA_L = '#c47a5c';
const SKY = '#f1e6c3', SKY_B = '#e8d9ad', CREAM = '#f6edd3', OCHRE = '#dcc08a', OCHRE_D = '#c3a26a';
const STONE = '#8e816a', STONE_D = '#6e6352', STONE_L = '#ab9e84', SLATE = '#4e5a55', SLATE_L = '#6b7871';
const COPPER = '#7fa58e', COPPER_D = '#5b8270', WATER = '#86a097', WATER_D = '#66807a', WATER_L = '#b3c5b4';
const FACE = '"Federant", serif';

export const city = {
  id: 'prague', name: 'Prague', wall: '#28301f',
  alt: 'An Art Nouveau poster of Prague in muted greens and golds: inside a great round halo with a mosaic ring, the Charles Bridge crosses the Vltava with statues on its piers and lamps along its parapet, between the Malá Strana bridge towers and the Old Town Bridge Tower, which stands out over the ring; above are the red roofs of Malá Strana with the green dome and bell tower of St. Nicholas, Prague Castle\'s long palace front on its hill with St. Vitus Cathedral\'s twin spires and great tower, Petřín hill with its lookout tower, and swans on the river; whiplash vines with leaves and poppies coil around the halo, over a green tablet with the name PRAHA',
  google: 'family=Federant',
  fonts: [['400 100px "Federant"', 'PRAHA PRAŽSKÝ HRAD · MALÁ STRANA · STARÉ MĚSTO']],
  build,
};

// the halo: the scene disc, the mosaic ring, the outer rays
const CX = 800, CY = 790, R = 560, R1 = 604, R2 = 660;
const WL = 1112;          // the water line under the bridge
const DECK = 1004;        // the bridge's parapet top
const TAB = { x: 230, y: 1500, w: 1140, h: 360 };

const disc = (c, r = R) => { c.beginPath(); c.arc(CX, CY, r, 0, Math.PI * 2); c.clip(); };

function build() {
  const p = new Plate({ paper: PAPER, seed: 1357 });
  const r = p.r;
  p.stack('panel', 'halo', 'sky', 'far', 'castle', 'town', 'river', 'bridge', 'front', 'vines', 'live', 'title');
  for (const n of p.order) p.layer(n, { clip: false });
  panel(p, r);
  halo(p, r);
  sky(p, r);
  petrin(p, r);
  castle(p, r);
  town(p, r);
  river(p, r);
  bridge(p, r);
  bridgeTower(p);
  vines(p, r);
  life(p, r);
  title(p, r);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

// ================================================================ helpers
function fillPoly(c, pts, fill, line, lw = 2.4) {
  poly(c, pts); c.fillStyle = fill; c.fill();
  if (line) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }
}
function pointed(c, x, y, w, h) {
  // two arcs meeting at the top
  const s = y + w * 0.75;
  c.moveTo(x, y + h); c.lineTo(x, s);
  c.quadraticCurveTo(x, y + w * 0.15, x + w / 2, y);
  c.quadraticCurveTo(x + w, y + w * 0.15, x + w, s);
  c.lineTo(x + w, y + h); c.closePath();
}
function round(c, x, y, w, h) {
  c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath();
}
// a smooth curve through points (Catmull-Rom), sampled
function spline(pts, n = 10) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// a spiral that carries on from the end of a path, turning one way
function curl(path, turns, shrink, dir) {
  const n = path.length, [x, y] = path[n - 1], [px, py] = path[n - 2];
  let a = Math.atan2(y - py, x - px), step = Math.hypot(x - px, y - py), cx = x, cy = y;
  const out = [];
  const N = Math.round(turns * 40);
  for (let i = 0; i < N; i++) {
    a += dir * (Math.PI * 2 / 40) * (1 + i / N * 0.6);
    step *= shrink;
    cx += Math.cos(a) * step; cy += Math.sin(a) * step;
    out.push([cx, cy]);
  }
  return path.concat(out);
}
function leaf(c, x, y, a, L, wd) {
  const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
  c.moveTo(x, y);
  c.quadraticCurveTo(x + ca * L * 0.5 + nx * wd, y + sa * L * 0.5 + ny * wd, x + ca * L, y + sa * L);
  c.quadraticCurveTo(x + ca * L * 0.5 - nx * wd, y + sa * L * 0.5 - ny * wd, x, y);
}

// ================================================================ the sheet and its panel
function panel(p) {
  p.group('panel', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = PANEL; c.fillRect(56, 56, W - 112, H - 112);
    // a faint second tone toward the foot
    c.fillStyle = PANEL_D; c.fillRect(56, 1440, W - 112, H - 56 - 1440);
    c.strokeStyle = INK; c.lineWidth = 7; c.strokeRect(56, 56, W - 112, H - 112);
    c.lineWidth = 2; c.strokeRect(74, 74, W - 148, H - 148);
  }, { t: 0, d: 0.9, reveal: 'fade' });
  // a gold rule with little squares along the inner edge
  p.group('panel', { x: 60, y: 60, w: W - 120, h: H - 120 }, (c) => {
    c.strokeStyle = GOLD_D; c.lineWidth = 3; c.strokeRect(86, 86, W - 172, H - 172);
    c.fillStyle = GOLD;
    for (let x = 110; x < W - 100; x += 40) { c.fillRect(x - 3, 83, 6, 6); c.fillRect(x - 3, H - 89, 6, 6); }
    for (let y = 110; y < H - 100; y += 40) { c.fillRect(83, y - 3, 6, 6); c.fillRect(W - 89, y - 3, 6, 6); }
  }, { t: 0.4, d: 1.0, reveal: 'iris', ease: 'inOut' });
  // the band under the halo, where the tablet sits: fine vertical lines
  const lines = [];
  for (let x = 100; x < W - 96; x += 9) lines.push([[x, 1446], [x, 1470]]);
  p.strokes('panel', lines, INK_S, 1.2, { t: 1.0, d: 0.8, reveal: 'wipe' });
}

// ================================================================ the halo
function halo(p) {
  // the outer rays, as fine lines
  const rays = [];
  for (let i = 0; i < 180; i++) {
    const a = (i / 180) * Math.PI * 2, r0 = R1 + 10, r1 = R2 + (i % 2 ? 0 : 22) + (i % 6 === 0 ? 30 : 0);
    rays.push([[CX + Math.cos(a) * r0, CY + Math.sin(a) * r0], [CX + Math.cos(a) * r1, CY + Math.sin(a) * r1]]);
  }
  p.group('halo', { x: CX - R2 - 40, y: CY - R2 - 40, w: 2 * R2 + 80, h: 2 * R2 + 80 }, (c) => {
    c.fillStyle = GOLD_L; c.beginPath(); c.arc(CX, CY, R2 - 6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD_D; c.lineWidth = 2; c.beginPath(); c.arc(CX, CY, R2 - 6, 0, Math.PI * 2); c.stroke();
  }, { t: 0.5, d: 1.2, reveal: 'iris', ease: 'inOut' });
  p.strokes('halo', rays, GOLD_D, 2, { t: 1.1, d: 1.0, reveal: 'iris', box: { x: CX - R2 - 40, y: CY - R2 - 40, w: 2 * R2 + 80, h: 2 * R2 + 80 } });
  // the mosaic ring: gold ground, sage and rose tesserae, brown rules
  const tiles = [];
  const N = 120;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    tiles.push([CX + Math.cos(a) * (R + 22), CY + Math.sin(a) * (R + 22), a, i % 4]);
  }
  p.group('halo', { x: CX - R1 - 10, y: CY - R1 - 10, w: 2 * R1 + 20, h: 2 * R1 + 20 }, (c) => {
    c.fillStyle = GOLD; c.beginPath(); c.arc(CX, CY, R1, 0, Math.PI * 2); c.arc(CX, CY, R - 2, 0, Math.PI * 2, true); c.fill();
    for (const [x, y, a, k] of tiles) {
      c.save(); c.translate(x, y); c.rotate(a + Math.PI / 4);
      c.fillStyle = k === 0 ? ROSE : k === 2 ? OLIVE : SAGE_L;
      if (k % 2) { c.beginPath(); c.arc(0, 0, 6.5, 0, Math.PI * 2); c.fill(); }
      else { c.fillRect(-8, -8, 16, 16); c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(-8, -8, 16, 16); }
      c.restore();
    }
    c.strokeStyle = INK; c.lineWidth = 4;
    for (const rr of [R1, R - 2]) { c.beginPath(); c.arc(CX, CY, rr, 0, Math.PI * 2); c.stroke(); }
    c.lineWidth = 1.5;
    for (const rr of [R1 - 7, R + 6]) { c.beginPath(); c.arc(CX, CY, rr, 0, Math.PI * 2); c.stroke(); }
    // little dots outside the ring
    c.fillStyle = INK;
    for (let i = 0; i < 240; i++) { const a = (i / 240) * Math.PI * 2; c.beginPath(); c.arc(CX + Math.cos(a) * (R1 + 7), CY + Math.sin(a) * (R1 + 7), 1.8, 0, Math.PI * 2); c.fill(); }
  }, { t: 1.3, d: 1.2, reveal: 'iris', ease: 'inOut' });
}

// ================================================================ the sky inside the halo
function sky(p, r) {
  p.group('sky', { x: CX - R, y: CY - R, w: 2 * R, h: 2 * R }, (c) => {
    c.save(); disc(c);
    c.fillStyle = SKY; c.fillRect(CX - R, CY - R, 2 * R, 2 * R);
    // soft rings, the Art Nouveau way of shading a sky
    c.strokeStyle = SKY_B; c.lineWidth = 7;
    for (let rr = 60; rr < R; rr += 22) { c.beginPath(); c.arc(CX, CY + 160, rr, Math.PI, Math.PI * 2); c.stroke(); }
    c.restore();
  }, { t: 1.6, d: 1.0, reveal: 'iris', ease: 'soft' });
  // clouds: rows of round lobes on a flat foot, with a curl at one end
  const clouds = [[420, 400, 210, 1], [1060, 340, 250, -1], [1180, 520, 150, 1]];
  clouds.forEach(([x, y, w, dir], i) => {
    const lobes = [];
    const n = Math.round(w / 34);
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; lobes.push([x + t * w, y - Math.sin(t * Math.PI) * 18 - 4, 14 + Math.sin(t * Math.PI) * 16 + r.range(-2, 3)]); }
    const tail = curl([[x + (dir > 0 ? w : 0), y], [x + (dir > 0 ? w + 10 : -10), y - 2]], 1.1, 0.93, -dir);
    p.group('sky', { x: x - 60, y: y - 80, w: w + 120, h: 100 }, (c) => {
      c.save(); disc(c);
      c.beginPath(); c.rect(x - 60, y - 80, w + 120, 80); c.clip();
      c.strokeStyle = INK; c.lineWidth = 5;
      for (const [lx, ly, lr] of lobes) { c.beginPath(); c.arc(lx, ly, lr, 0, Math.PI * 2); c.stroke(); }
      c.fillStyle = CREAM;
      for (const [lx, ly, lr] of lobes) { c.beginPath(); c.arc(lx, ly, lr, 0, Math.PI * 2); c.fill(); }
      c.restore();
      c.save(); disc(c);
      c.strokeStyle = INK; c.lineWidth = 2.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x + w + 10, y); c.stroke();
      c.beginPath(); c.moveTo(tail[0][0], tail[0][1]); for (const q of tail) c.lineTo(q[0], q[1]); c.stroke();
      c.strokeStyle = SKY_B; c.lineWidth = 2; c.beginPath();
      for (let k = 1; k < 4; k++) { c.moveTo(x + 14 * k, y - 6 * k); c.lineTo(x + w - 14 * k, y - 6 * k); }
      c.stroke();
      c.restore();
    }, { t: 2.0 + i * 0.25, d: 0.9, reveal: dir > 0 ? 'wipe' : 'wipeL' });
  });
}

// ================================================================ Petřín hill and the far ridge
function petrin(p, r) {
  // the far ridge on the right, pale
  const ridge = [[CX - R, 900], [700, 860], [900, 830], [1100, 800], [1240, 790], [CX + R, 810], [CX + R, 1000], [CX - R, 1000]];
  p.group('far', boxOf(ridge, 6), (c) => {
    c.save(); disc(c); fillPoly(c, ridge, SAGE_L, INK, 2.5); c.restore();
  }, { t: 2.3, d: 0.9, reveal: 'rise' });
  // Petřín: a wooded hill rising on the left
  const hill = spline([[CX - R - 10, 760], [300, 650], [380, 612], [450, 640], [540, 720], [640, 800], [700, 860]], 8).concat([[700, 1000], [CX - R - 10, 1000]]);
  const trees = [];
  for (let i = 0; i < 70; i++) {
    const x = r.range(240, 680), top = hillY(x);
    if (x > 345 && x < 395 && r.chance(0.8)) continue;
    trees.push([x, top + r.range(8, 140), r.range(9, 15), r.chance(0.5)]);
  }
  trees.sort((a, b) => a[1] - b[1]);
  p.group('far', boxOf(hill, 6), (c) => {
    c.save(); disc(c); fillPoly(c, hill, SAGE, INK, 3); c.restore();
  }, { t: 2.5, d: 1.0, reveal: 'rise' });
  p.group('far', { x: CX - R, y: 590, w: 500, h: 420 }, (c) => {
    c.save(); disc(c); poly(c, hill); c.clip();
    for (const [x, y, rr, dark] of trees) {
      c.fillStyle = dark ? OLIVE : mix(SAGE, OLIVE, 0.45); c.strokeStyle = INK; c.lineWidth = 1.6;
      c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill(); c.stroke();
      c.strokeStyle = SAGE_L; c.lineWidth = 1.4; c.beginPath(); c.arc(x - rr * 0.2, y - rr * 0.2, rr * 0.55, Math.PI * 1.1, Math.PI * 1.7); c.stroke();
    }
    c.restore();
  }, { t: 3.0, d: 1.0, reveal: 'rise' });
  // the lookout tower: a tapering iron lattice with a gallery on top
  const tx = 372, ty0 = 622, ty1 = 470;
  p.group('far', { x: tx - 40, y: ty1 - 40, w: 80, h: ty0 - ty1 + 50 }, (c) => {
    c.save(); disc(c);
    const bw = 22, tw = 7;
    const L = (t) => tx - lerp(bw, tw, t), Rr = (t) => tx + lerp(bw, tw, t), Y = (t) => lerp(ty0, ty1, t);
    c.strokeStyle = INK; c.lineWidth = 2.6; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(L(0), Y(0)); c.lineTo(L(1), Y(1)); c.moveTo(Rr(0), Y(0)); c.lineTo(Rr(1), Y(1)); c.stroke();
    c.lineWidth = 1.2; c.beginPath();
    for (let k = 0; k < 9; k++) {
      const a = k / 9, b = (k + 1) / 9;
      c.moveTo(L(a), Y(a)); c.lineTo(Rr(b), Y(b)); c.moveTo(Rr(a), Y(a)); c.lineTo(L(b), Y(b));
      c.moveTo(L(a), Y(a)); c.lineTo(Rr(a), Y(a));
    }
    c.stroke();
    // the gallery and the cap
    c.fillStyle = STONE_D; c.fillRect(tx - 13, ty1 - 6, 26, 7); c.strokeRect(tx - 13, ty1 - 6, 26, 7);
    fillPoly(c, [[tx - 8, ty1 - 6], [tx - 8, ty1 - 20], [tx + 8, ty1 - 20], [tx + 8, ty1 - 6]], STONE, INK, 1.5);
    fillPoly(c, [[tx - 10, ty1 - 20], [tx, ty1 - 34], [tx + 10, ty1 - 20]], COPPER_D, INK, 1.5);
    c.beginPath(); c.moveTo(tx, ty1 - 34); c.lineTo(tx, ty1 - 44); c.stroke();
    c.restore();
  }, { t: 3.4, d: 1.1, reveal: 'rise', ease: 'inOut' });
}
function hillY(x) {
  // the hill's top edge, roughly, for placing trees
  const pts = [[200, 780], [300, 650], [380, 612], [450, 640], [540, 720], [640, 800], [700, 860]];
  for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
  return 860;
}

// ================================================================ the castle and St. Vitus
const PAL = { x0: 600, x1: 1210, y0: 742, y1: 832 }; // the palace front
function castle(p, r) {
  // the castle rock: a green slope under the walls
  const rock = [[540, 860], [600, 828], [1220, 828], [1300, 860], [1360, 900], [1360, 1000], [540, 1000]];
  p.group('castle', boxOf(rock, 4), (c) => { c.save(); disc(c); fillPoly(c, rock, mix(SAGE, OLIVE, 0.3), INK, 2.5); c.restore(); }, { t: 2.8, d: 0.8, reveal: 'rise' });

  // St. Vitus, behind the palace
  const vitus = [];
  // the nave's steep roof
  vitus.push(['roof', [[770, 668], [1076, 668], [1054, 604], [792, 604]]]);
  p.group('castle', { x: 700, y: 300, w: 460, h: 460 }, (c) => {
    c.save(); disc(c);
    // the clerestory wall with its tall windows
    fillPoly(c, [[770, 668], [1076, 668], [1076, 750], [770, 750]], OCHRE_D, INK, 2.4);
    c.fillStyle = SLATE; c.beginPath();
    for (let x = 842; x < 1060; x += 26) pointed(c, x, 680, 12, 50);
    c.fill();
    // the roof, its seams
    fillPoly(c, [[770, 668], [1076, 668], [1054, 604], [792, 604]], SLATE, INK, 2.6);
    c.strokeStyle = SLATE_L; c.lineWidth = 1.2; c.beginPath();
    for (let x = 800; x < 1060; x += 9) { c.moveTo(x, 606); c.lineTo(x - 4 + (x - 920) * 0.06, 666); }
    c.stroke();
    // the buttresses' pinnacles along the nave
    c.strokeStyle = INK; c.fillStyle = OCHRE; c.lineWidth = 1.6;
    for (let x = 850; x < 1080; x += 26) { fillPoly(c, [[x - 4, 690], [x - 4, 650], [x, 628], [x + 4, 650], [x + 4, 690]], OCHRE, INK, 1.4); }
    // the ridge turret over the crossing, gold-tipped
    fillPoly(c, [[1004, 606], [1004, 570], [1010, 560], [1016, 570], [1016, 606]], COPPER, INK, 1.6);
    fillPoly(c, [[1006, 562], [1010, 516], [1014, 562]], COPPER_D, INK, 1.4);
    c.fillStyle = GOLD; c.beginPath(); c.arc(1010, 514, 3.5, 0, Math.PI * 2); c.fill();
    // the apse at the east end, with flying buttresses
    fillPoly(c, [[1076, 750], [1076, 640], [1100, 650], [1118, 676], [1118, 750]], OCHRE_D, INK, 2);
    c.beginPath(); c.strokeStyle = INK; c.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const x = 1090 + k * 14; c.moveTo(x, 700 + k * 6); c.quadraticCurveTo(x + 18, 690 + k * 6, x + 26, 720 + k * 8); }
    c.stroke();
    c.restore();
  }, { t: 3.2, d: 1.2, reveal: 'rise', ease: 'inOut' });

  // the west front: two spires and the rose window
  p.group('castle', { x: 730, y: 360, w: 120, h: 400 }, (c) => {
    c.save(); disc(c);
    fillPoly(c, [[748, 750], [748, 560], [840, 560], [840, 750]], OCHRE, INK, 2.4);
    for (const sx of [764, 824]) {
      fillPoly(c, [[sx - 18, 750], [sx - 18, 520], [sx + 18, 520], [sx + 18, 750]], OCHRE, INK, 2.4);
      // the spire with its crockets
      fillPoly(c, [[sx - 20, 522], [sx, 398], [sx + 20, 522]], SLATE, INK, 2.4);
      c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath();
      for (let k = 1; k < 8; k++) { const t = k / 8, y = lerp(522, 398, t), w = lerp(20, 0, t); c.moveTo(sx - w, y); c.lineTo(sx - w - 5, y - 3); c.moveTo(sx + w, y); c.lineTo(sx + w + 5, y - 3); }
      c.stroke();
      // pinnacles at the spire's foot
      for (const dx of [-18, 18]) fillPoly(c, [[sx + dx - 3, 524], [sx + dx, 500], [sx + dx + 3, 524]], OCHRE_D, INK, 1.2);
      c.fillStyle = GOLD; c.beginPath(); c.arc(sx, 396, 3.5, 0, Math.PI * 2); c.fill();
      // tall windows
      c.fillStyle = SLATE; c.beginPath(); pointed(c, sx - 6, 540, 12, 46); pointed(c, sx - 6, 610, 12, 50); c.fill();
    }
    // the rose window
    c.fillStyle = SLATE; c.beginPath(); c.arc(794, 590, 14, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD_L; c.lineWidth = 1.2; c.beginPath();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.moveTo(794, 590); c.lineTo(794 + Math.cos(a) * 13, 590 + Math.sin(a) * 13); }
    c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(794, 590, 15, 0, Math.PI * 2); c.stroke();
    // the gable over the portal
    fillPoly(c, [[776, 560], [794, 526], [812, 560]], OCHRE_D, INK, 1.8);
    c.restore();
  }, { t: 3.7, d: 1.1, reveal: 'rise', ease: 'inOut' });

  // the great south tower with its Renaissance cap
  const gx = 936;
  p.group('castle', { x: gx - 60, y: 300, w: 120, h: 460 }, (c) => {
    c.save(); disc(c);
    fillPoly(c, [[gx - 32, 750], [gx - 32, 478], [gx + 32, 478], [gx + 32, 750]], OCHRE, INK, 2.6);
    // buttress lines and tall windows
    c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath();
    c.moveTo(gx - 24, 750); c.lineTo(gx - 24, 486); c.moveTo(gx + 24, 750); c.lineTo(gx + 24, 486);
    c.moveTo(gx - 32, 600); c.lineTo(gx + 32, 600); c.stroke();
    c.fillStyle = SLATE; c.beginPath(); pointed(c, gx - 9, 620, 18, 90); pointed(c, gx - 7, 500, 14, 30); c.fill();
    // the clock faces, in gold
    c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 1.6;
    c.beginPath(); c.arc(gx, 572, 13, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(gx, 572); c.lineTo(gx, 563); c.moveTo(gx, 572); c.lineTo(gx + 7, 575); c.stroke();
    // the gallery
    c.fillStyle = STONE_L; c.fillRect(gx - 38, 468, 76, 12); c.strokeRect(gx - 38, 468, 76, 12);
    c.beginPath(); for (let x = gx - 34; x < gx + 36; x += 7) { c.moveTo(x, 469); c.lineTo(x, 479); } c.stroke();
    // the bell cap, the lantern, the small onion and the needle
    c.beginPath();
    c.moveTo(gx - 34, 468); c.bezierCurveTo(gx - 34, 440, gx - 14, 438, gx - 10, 420); c.lineTo(gx + 10, 420); c.bezierCurveTo(gx + 14, 438, gx + 34, 440, gx + 34, 468); c.closePath();
    c.fillStyle = COPPER; c.fill(); c.lineWidth = 2.4; c.stroke();
    c.strokeStyle = COPPER_D; c.lineWidth = 1.4; c.beginPath();
    for (const dx of [-20, -8, 4, 16]) { c.moveTo(gx + dx * 1.4 * 0.7, 466); c.quadraticCurveTo(gx + dx * 0.6, 440, gx + dx * 0.4, 422); }
    c.stroke();
    fillPoly(c, [[gx - 9, 420], [gx - 9, 400], [gx + 9, 400], [gx + 9, 420]], STONE_L, INK, 1.8);
    c.fillStyle = INK; c.fillRect(gx - 5, 404, 3, 12); c.fillRect(gx + 2, 404, 3, 12);
    c.beginPath(); c.moveTo(gx - 12, 400); c.bezierCurveTo(gx - 14, 386, gx - 2, 384, gx, 372); c.bezierCurveTo(gx + 2, 384, gx + 14, 386, gx + 12, 400); c.closePath();
    c.fillStyle = COPPER; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.moveTo(gx, 372); c.lineTo(gx, 338); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.arc(gx, 360, 4, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(gx, 338, 3, 0, Math.PI * 2); c.fill();
    c.restore();
  }, { t: 4.1, d: 1.2, reveal: 'rise', ease: 'inOut' });

  // the palace front: a long wall of windows under a red roof
  const { x0, x1, y0, y1 } = PAL;
  p.group('castle', { x: x0 - 10, y: y0 - 40, w: x1 - x0 + 20, h: y1 - y0 + 50 }, (c) => {
    c.save(); disc(c);
    fillPoly(c, [[x0 - 4, y0 + 2], [x0 + 10, y0 - 26], [x1 - 10, y0 - 26], [x1 + 4, y0 + 2]], TERRA, INK, 2.4);
    c.strokeStyle = TERRA_L; c.lineWidth = 1.2; c.beginPath();
    for (let x = x0 + 14; x < x1 - 8; x += 8) { c.moveTo(x, y0 - 24); c.lineTo(x, y0); } c.stroke();
    // dormers
    c.fillStyle = CREAM; c.strokeStyle = INK; c.lineWidth = 1.4;
    for (let x = x0 + 30; x < x1 - 20; x += 46) { c.beginPath(); c.rect(x, y0 - 18, 9, 12); c.fill(); c.stroke(); }
    fillPoly(c, [[x0, y1], [x0, y0], [x1, y0], [x1, y1]], CREAM, INK, 2.6);
    c.restore();
  }, { t: 4.5, d: 1.0, reveal: 'rise' });
  // its windows, four rows, and the cornices
  p.group('castle', { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, (c) => {
    c.save(); disc(c);
    c.fillStyle = OLIVE_D; c.beginPath();
    for (let row = 0; row < 4; row++) {
      const wy = y0 + 10 + row * 20, wh = row === 1 ? 13 : 10;
      for (let x = x0 + 10; x < x1 - 10; x += 14) {
        if (Math.abs(x - 905) < 26 && row > 1) continue;
        c.rect(x, wy, 6, wh);
      }
    }
    c.fill();
    // the gate in the middle
    c.fillStyle = INK; c.beginPath(); round(c, 893, y1 - 30, 24, 30); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath();
    c.moveTo(x0, y0 + 28); c.lineTo(x1, y0 + 28); c.moveTo(x0, y1 - 6); c.lineTo(x1, y1 - 6);
    for (const x of [x0 + 150, x0 + 300, x1 - 150]) { c.moveTo(x, y0); c.lineTo(x, y1); }
    c.stroke();
    c.restore();
  }, { t: 5.0, d: 0.9, reveal: 'wipe' });
  // St. George's: two pale towers behind the palace's east end
  p.group('castle', { x: 1140, y: 640, w: 90, h: 110 }, (c) => {
    c.save(); disc(c);
    for (const sx of [1158, 1196]) {
      fillPoly(c, [[sx - 11, 718], [sx - 11, 676], [sx + 11, 676], [sx + 11, 718]], CREAM, INK, 2);
      fillPoly(c, [[sx - 13, 678], [sx, 650], [sx + 13, 678]], TERRA, INK, 2);
      c.fillStyle = OLIVE_D; c.beginPath(); round(c, sx - 3, 684, 6, 12); c.fill();
    }
    c.restore();
  }, { t: 4.3, d: 0.8, reveal: 'rise' });
}

// ================================================================ Malá Strana
function town(p, r) {
  // rows of houses stepping down from the castle to the river
  const rows = [
    { y: 880, x0: 540, x1: 1350, h: 46, s: 1.0 },
    { y: 930, x0: 260, x1: 1350, h: 50, s: 1.05 },
    { y: 980, x0: 250, x1: 1350, h: 56, s: 1.1 },
  ];
  const walls = [CREAM, OCHRE, '#e6d3a4', '#d9b8a0', CREAM, SAGE_L];
  rows.forEach((row, ri) => {
    const houses = [];
    for (let x = row.x0; x < row.x1;) {
      const w = r.range(40, 74) * row.s, h = row.h * r.range(0.8, 1.15);
      if (!(ri === 0 && x > 560 && x < 720)) houses.push({ x, w, h, wall: r.pick(walls), roof: r.chance(0.8) ? TERRA : TERRA_L, gable: r.chance(0.35), cols: Math.max(2, Math.round(w / 15)), rows: h > 50 ? 3 : 2 });
      x += w - 2;
    }
    // trees between some of them
    const trees = [];
    for (let k = 0; k < 12; k++) trees.push([r.range(row.x0, row.x1), row.y - row.h * r.range(0.1, 0.4), r.range(12, 20)]);
    const box = { x: row.x0 - 30, y: row.y - row.h - 70, w: row.x1 - row.x0 + 60, h: row.h + 76 };
    p.group('town', box, (c) => {
      c.save(); disc(c);
      for (const [tx, ty, tr] of trees) {
        c.fillStyle = OLIVE; c.strokeStyle = INK; c.lineWidth = 1.8;
        c.beginPath(); c.arc(tx, ty, tr, 0, Math.PI * 2); c.fill(); c.stroke();
      }
      for (const hs of houses) {
        const top = row.y - hs.h, rh = hs.gable ? hs.w * 0.55 : hs.w * 0.32;
        fillPoly(c, [[hs.x, row.y], [hs.x, top], [hs.x + hs.w, top], [hs.x + hs.w, row.y]], hs.wall, INK, 1.8);
        if (hs.gable) fillPoly(c, [[hs.x - 2, top + 1], [hs.x + hs.w / 2, top - rh], [hs.x + hs.w + 2, top + 1]], hs.roof, INK, 1.8);
        else fillPoly(c, [[hs.x - 3, top + 1], [hs.x + hs.w * 0.22, top - rh], [hs.x + hs.w * 0.78, top - rh], [hs.x + hs.w + 3, top + 1]], hs.roof, INK, 1.8);
        // windows
        c.fillStyle = OLIVE_D; c.beginPath();
        const du = (hs.w - 10) / hs.cols;
        for (let k = 0; k < hs.rows; k++) for (let j = 0; j < hs.cols; j++) c.rect(hs.x + 5 + j * du + du * 0.3, top + 8 + k * 15, du * 0.4, 8);
        c.fill();
      }
      c.restore();
    }, { t: 5.2 + ri * 0.45, d: 1.0, reveal: 'rise' });
  });
  // St. Nicholas: the green dome on its drum and the bell tower beside it
  const nx = 640, ny = 880;
  p.group('town', { x: nx - 90, y: 600, w: 230, h: ny - 590 }, (c) => {
    c.save(); disc(c);
    // the church body
    fillPoly(c, [[nx - 80, ny], [nx - 80, 790], [nx + 80, 790], [nx + 80, ny]], CREAM, INK, 2.4);
    fillPoly(c, [[nx - 86, 792], [nx - 60, 770], [nx + 60, 770], [nx + 86, 792]], COPPER_D, INK, 2);
    c.fillStyle = OLIVE_D; c.beginPath(); for (let x = nx - 64; x < nx + 70; x += 22) round(c, x, 806, 9, 26); c.fill();
    // the drum
    fillPoly(c, [[nx - 42, 772], [nx - 42, 730], [nx + 42, 730], [nx + 42, 772]], CREAM, INK, 2.2);
    c.fillStyle = OLIVE_D; c.beginPath(); for (let x = nx - 34; x < nx + 36; x += 16) round(c, x, 740, 7, 20); c.fill();
    // the dome and its ribs
    c.beginPath(); c.moveTo(nx - 48, 732); c.bezierCurveTo(nx - 48, 676, nx - 18, 660, nx, 658); c.bezierCurveTo(nx + 18, 660, nx + 48, 676, nx + 48, 732); c.closePath();
    c.fillStyle = COPPER; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
    c.strokeStyle = COPPER_D; c.lineWidth = 1.6; c.beginPath();
    for (const k of [-0.66, -0.33, 0, 0.33, 0.66]) { c.moveTo(nx + k * 48, 730); c.quadraticCurveTo(nx + k * 40, 672, nx, 660); }
    c.stroke();
    // the lantern
    fillPoly(c, [[nx - 9, 660], [nx - 9, 636], [nx + 9, 636], [nx + 9, 660]], CREAM, INK, 1.8);
    c.beginPath(); c.moveTo(nx - 12, 637); c.quadraticCurveTo(nx, 616, nx + 12, 637); c.closePath(); c.fillStyle = COPPER; c.fill(); c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.moveTo(nx, 622); c.lineTo(nx, 606); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.arc(nx, 606, 3.5, 0, Math.PI * 2); c.fill();
    // the bell tower
    const bx = nx + 112;
    fillPoly(c, [[bx - 20, ny], [bx - 20, 700], [bx + 20, 700], [bx + 20, ny]], CREAM, INK, 2.2);
    c.fillStyle = OLIVE_D; c.beginPath(); round(c, bx - 7, 714, 14, 28); round(c, bx - 5, 770, 10, 20); c.fill();
    c.beginPath(); c.moveTo(bx - 24, 702); c.bezierCurveTo(bx - 24, 672, bx - 6, 676, bx - 4, 652); c.lineTo(bx + 4, 652); c.bezierCurveTo(bx + 6, 676, bx + 24, 672, bx + 24, 702); c.closePath();
    c.fillStyle = COPPER; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
    c.beginPath(); c.moveTo(bx - 8, 652); c.quadraticCurveTo(bx, 630, bx + 8, 652); c.closePath(); c.fillStyle = COPPER_D; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(bx, 636); c.lineTo(bx, 618); c.stroke();
    c.restore();
  }, { t: 5.6, d: 1.2, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the Vltava
function river(p, r) {
  p.group('river', { x: CX - R, y: WL - 20, w: 2 * R, h: CY + R - WL + 20 }, (c) => {
    c.save(); disc(c);
    c.fillStyle = WATER; c.fillRect(CX - R, WL - 10, 2 * R, CY + R - WL + 10);
    // the bridge's shadow on the water
    c.fillStyle = WATER_D; c.beginPath(); c.moveTo(CX - R, WL - 4);
    for (let x = CX - R; x <= CX + R; x += 20) c.lineTo(x, WL + 46 + Math.sin(x * 0.05) * 8);
    c.lineTo(CX + R, WL - 4); c.fill();
    c.restore();
  }, { t: 6.0, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // flowing whiplash lines across the water, in two tones
  const light = [], dark = [];
  for (let y = WL + 30; y < CY + R - 6; y += 15) {
    for (let x = CX - R + r.range(-40, 40); x < CX + R; x += r.range(140, 230)) {
      const L = r.range(80, 170), a = r.range(4, 8), pts = [];
      for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push([x + t * L, y + Math.sin(t * Math.PI * 2) * a * (1 - t * 0.4)]); }
      (y < WL + 60 ? dark : r.chance(0.65) ? light : dark).push(pts);
    }
  }
  const half = (arr, lo, hi) => arr.filter((l) => l[0][1] >= lo && l[0][1] < hi);
  const box = { x: CX - R, y: WL, w: 2 * R, h: CY + R - WL };
  const mid = WL + 130;
  for (const [lines, col, w, t0] of [[dark, WATER_D, 2.6, 6.5], [light, WATER_L, 2.6, 6.8]]) {
    for (const [lo, hi, dt] of [[0, mid, 0], [mid, 2000, 0.3]]) {
      const set = half(lines, lo, hi);
      if (!set.length) continue;
      p.group('river', box, (c) => {
        c.save(); disc(c);
        c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath();
        for (const l of set) { c.moveTo(l[0][0], l[0][1]); for (const q of l) c.lineTo(q[0], q[1]); }
        c.stroke(); c.restore();
      }, { t: t0 + dt, d: 0.9, reveal: 'wipe' });
    }
  }
}

// ================================================================ the Charles Bridge
const BX0 = 300, BX1 = 1262;            // from the Malá Strana towers to the Old Town tower
const PIERS = [];
for (let k = 0; k <= 9; k++) PIERS.push(lerp(BX0 + 40, BX1 - 20, k / 9));
function bridge(p, r) {
  // the spandrel wall and arches, one shape with the openings cut out
  p.group('bridge', { x: BX0 - 10, y: DECK - 10, w: BX1 - BX0 + 20, h: WL - DECK + 30 }, (c) => {
    c.save(); disc(c);
    // the shadowed water seen through the arches
    c.fillStyle = '#4c625c'; c.fillRect(BX0, DECK + 20, BX1 - BX0, WL - DECK - 18);
    c.strokeStyle = WATER_L; c.lineWidth = 2.4; c.beginPath();
    for (let x = BX0 + 10; x < BX1; x += 26) { c.moveTo(x, WL - 8); c.lineTo(x + 14, WL - 8); c.moveTo(x + 8, WL - 18); c.lineTo(x + 18, WL - 18); }
    c.stroke();
    c.beginPath(); c.rect(BX0, DECK + 10, BX1 - BX0, WL - DECK);
    for (let k = 0; k < PIERS.length - 1; k++) {
      const a = PIERS[k] + 13, b = PIERS[k + 1] - 13, mid = (a + b) / 2, hw = (b - a) / 2;
      c.moveTo(a, WL + 1); c.lineTo(a, DECK + 66); c.ellipse(mid, DECK + 66, hw, 40, 0, Math.PI, 0); c.lineTo(b, WL + 1); c.closePath();
    }
    c.fillStyle = STONE; c.fill('evenodd');
    c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
    // the cornice and the parapet
    c.fillStyle = STONE_D; c.fillRect(BX0, DECK, BX1 - BX0, 12); c.strokeRect(BX0, DECK, BX1 - BX0, 12);
    // coursing in the stone
    c.strokeStyle = STONE_D; c.lineWidth = 1; c.beginPath();
    for (let y = DECK + 22; y < WL; y += 11) { c.moveTo(BX0, y); c.lineTo(BX1, y); }
    c.stroke();
    // the cutwaters, pointed toward us
    for (const x of PIERS) fillPoly(c, [[x - 16, WL + 2], [x - 16, DECK + 62], [x, DECK + 50], [x + 16, DECK + 62], [x + 16, WL + 2]], STONE_L, INK, 2);
    // the arches' voussoirs
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath();
    for (let k = 0; k < PIERS.length - 1; k++) {
      const a = PIERS[k] + 13, b = PIERS[k + 1] - 13, mid = (a + b) / 2, hw = (b - a) / 2;
      for (let j = 1; j < 10; j++) { const t = Math.PI + (j / 10) * Math.PI; c.moveTo(mid + Math.cos(t) * hw, DECK + 66 + Math.sin(t) * 40); c.lineTo(mid + Math.cos(t) * (hw + 9), DECK + 66 + Math.sin(t) * 49); }
    }
    c.stroke();
    c.restore();
  }, { t: 6.4, d: 1.3, reveal: 'wipe', ease: 'inOut' });
  // the reflections of the arches
  p.group('bridge', { x: BX0, y: WL, w: BX1 - BX0, h: 70 }, (c) => {
    c.save(); disc(c);
    c.strokeStyle = WATER_L; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
    for (let k = 0; k < PIERS.length - 1; k++) {
      const mid = (PIERS[k] + PIERS[k + 1]) / 2;
      for (let j = 0; j < 4; j++) { const y = WL + 12 + j * 12, w = 40 - j * 7; c.moveTo(mid - w, y); c.lineTo(mid + w, y); }
    }
    c.stroke(); c.restore();
  }, { t: 7.2, d: 0.8, reveal: 'wipe' });

  // the statues on the piers, dark bronze on pale pedestals, and lamps between
  const figs = PIERS.slice(1, -1).map((x, i) => ({ x, h: 46 + (i % 3) * 6, lean: (i % 2 ? 1 : -1) * 0.12, kind: i % 3 }));
  figs.forEach((f, i) => {
    p.group('bridge', { x: f.x - 26, y: DECK - 90, w: 52, h: 96 }, (c) => {
      c.save(); disc(c);
      fillPoly(c, [[f.x - 11, DECK], [f.x - 11, DECK - 22], [f.x + 11, DECK - 22], [f.x + 11, DECK]], STONE_L, INK, 1.8);
      fillPoly(c, [[f.x - 14, DECK - 22], [f.x - 14, DECK - 27], [f.x + 14, DECK - 27], [f.x + 14, DECK - 22]], STONE, INK, 1.4);
      // a robed figure: a long tapered body, a head, perhaps an arm raised or a group of two
      const b = DECK - 27, h = f.h, lx = f.lean * h;
      c.fillStyle = '#3f3a31'; c.beginPath();
      c.moveTo(f.x - 10, b); c.quadraticCurveTo(f.x - 9 + lx * 0.4, b - h * 0.5, f.x - 5 + lx, b - h * 0.82);
      c.lineTo(f.x + 5 + lx, b - h * 0.82); c.quadraticCurveTo(f.x + 9 + lx * 0.4, b - h * 0.5, f.x + 10, b); c.closePath(); c.fill();
      c.beginPath(); c.arc(f.x + lx * 1.05, b - h * 0.9, 5, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#3f3a31'; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath();
      if (f.kind === 0) { c.moveTo(f.x + 4 + lx, b - h * 0.72); c.lineTo(f.x + 14 + lx, b - h * 0.95); }
      else if (f.kind === 1) { c.moveTo(f.x - 4 + lx, b - h * 0.7); c.lineTo(f.x - 13, b - h * 0.55); }
      else { c.moveTo(f.x + 9, b); c.quadraticCurveTo(f.x + 16, b - h * 0.3, f.x + 13, b - h * 0.55); }
      c.stroke();
      c.restore();
    }, { t: 7.4 + i * 0.12, d: 0.6, reveal: 'rise' });
  });
  // the lamps
  const lamps = [];
  for (let k = 0; k < PIERS.length - 1; k++) lamps.push((PIERS[k] + PIERS[k + 1]) / 2);
  p.group('bridge', { x: BX0, y: DECK - 60, w: BX1 - BX0, h: 64 }, (c) => {
    c.save(); disc(c);
    c.strokeStyle = INK; c.lineWidth = 2.4;
    for (const x of lamps) {
      c.beginPath(); c.moveTo(x, DECK); c.lineTo(x, DECK - 40); c.stroke();
      fillPoly(c, [[x - 6, DECK - 40], [x - 4, DECK - 52], [x + 4, DECK - 52], [x + 6, DECK - 40]], GOLD_L, INK, 1.6);
      fillPoly(c, [[x - 7, DECK - 52], [x, DECK - 58], [x + 7, DECK - 52]], INK);
    }
    c.restore();
  }, { t: 8.6, d: 0.6, reveal: 'fade' });

  // the Malá Strana bridge towers at the left end: the tall gothic one and the lower Judith tower
  p.group('bridge', { x: 236, y: 740, w: 150, h: WL - 730 }, (c) => {
    c.save(); disc(c);
    const tx = 318;
    fillPoly(c, [[tx - 36, WL], [tx - 36, 848], [tx + 36, 848], [tx + 36, WL]], STONE_D, INK, 2.4);
    fillPoly(c, [[tx - 40, 850], [tx - 30, 830], [tx + 30, 830], [tx + 40, 850]], STONE, INK, 2);
    fillPoly(c, [[tx - 30, 832], [tx, 750], [tx + 30, 832]], SLATE, INK, 2.4);
    for (const dx of [-34, 34]) fillPoly(c, [[tx + dx - 4, 834], [tx + dx, 806], [tx + dx + 4, 834]], SLATE, INK, 1.4);
    c.fillStyle = INK; c.beginPath(); pointed(c, tx - 16, DECK - 34, 32, 50); c.fill();
    c.fillStyle = OLIVE_D; c.beginPath(); pointed(c, tx - 7, 870, 14, 26); pointed(c, tx - 7, 916, 14, 26); c.fill();
    // the Judith tower, older and lower, to the left
    const jx = 262;
    fillPoly(c, [[jx - 24, WL], [jx - 24, 900], [jx + 22, 900], [jx + 22, WL]], STONE, INK, 2.2);
    fillPoly(c, [[jx - 28, 902], [jx - 4, 872], [jx + 26, 902]], TERRA, INK, 2);
    c.fillStyle = OLIVE_D; c.beginPath(); round(c, jx - 6, 920, 10, 16); c.fill();
    c.restore();
  }, { t: 7.0, d: 1.1, reveal: 'rise', ease: 'inOut' });
}

// the Old Town Bridge Tower, near and large, standing out over the ring
function bridgeTower(p) {
  const x0 = 1250, x1 = 1392, top = 700, foot = WL + 30, mx = (x0 + x1) / 2;
  // above the deck it is free of the halo; below, it stays inside the disc
  const clipTower = (c) => { c.beginPath(); c.arc(CX, CY, R, 0, Math.PI * 2); c.rect(x0 - 60, 400, x1 - x0 + 120, DECK + 20 - 400); c.clip(); };
  p.group('front', { x: x0 - 50, y: 470, w: x1 - x0 + 100, h: foot - 460 }, (c) => {
    c.save(); clipTower(c);
    // the body
    fillPoly(c, [[x0, foot], [x0, top], [x1, top], [x1, foot]], STONE_D, INK, 3);
    // buttress lines at the corners
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath();
    c.moveTo(x0 + 12, top + 6); c.lineTo(x0 + 12, foot); c.moveTo(x1 - 12, top + 6); c.lineTo(x1 - 12, foot); c.stroke();
    // the gallery
    fillPoly(c, [[x0 - 10, top + 4], [x0 - 10, top - 10], [x1 + 10, top - 10], [x1 + 10, top + 4]], STONE, INK, 2.2);
    // the steep slate roof, its sides slightly drawn in
    c.beginPath(); c.moveTo(x0 + 4, top - 10); c.quadraticCurveTo(mx - 30, top - 80, mx, top - 210); c.quadraticCurveTo(mx + 30, top - 80, x1 - 4, top - 10); c.closePath();
    c.fillStyle = SLATE; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.strokeStyle = SLATE_L; c.lineWidth = 1.2; c.beginPath();
    for (let k = 1; k < 7; k++) { const x = lerp(x0 + 10, x1 - 10, k / 7); c.moveTo(x, top - 12); c.quadraticCurveTo(lerp(x, mx, 0.6), top - 90, mx, top - 200); }
    c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.arc(mx, top - 212, 5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(mx, top - 210); c.lineTo(mx, top - 232); c.stroke();
    // the corner turrets
    for (const x of [x0 - 4, mx, x1 + 4]) {
      fillPoly(c, [[x - 7, top - 8], [x - 7, top - 30], [x + 7, top - 30], [x + 7, top - 8]], STONE, INK, 1.8);
      fillPoly(c, [[x - 9, top - 30], [x, top - 62], [x + 9, top - 30]], SLATE, INK, 1.8);
    }
    // the tracery band of niches and the sculpture zone
    c.fillStyle = STONE; c.fillRect(x0 + 14, top + 30, x1 - x0 - 28, 54); c.strokeRect(x0 + 14, top + 30, x1 - x0 - 28, 54);
    c.fillStyle = INK; c.beginPath();
    for (let x = x0 + 22; x < x1 - 24; x += 20) pointed(c, x, top + 38, 12, 38);
    c.fill();
    c.fillStyle = STONE_L; c.beginPath(); pointed(c, mx - 28, top + 110, 56, 90); c.fill(); c.stroke();
    c.fillStyle = GOLD_D; c.beginPath(); c.moveTo(mx - 14, top + 140); c.lineTo(mx + 14, top + 140); c.lineTo(mx + 14, top + 160); c.quadraticCurveTo(mx, top + 178, mx - 14, top + 160); c.closePath(); c.fill(); c.stroke();
    // blind windows
    c.fillStyle = INK; c.beginPath(); pointed(c, x0 + 22, top + 120, 16, 60); pointed(c, x1 - 38, top + 120, 16, 60); c.fill();
    // the gate arch where the bridge passes through
    c.fillStyle = INK; c.beginPath(); pointed(c, mx - 30, DECK - 90, 60, 100); c.fill();
    c.strokeStyle = STONE_L; c.lineWidth = 2; c.beginPath(); pointed(c, mx - 36, DECK - 96, 72, 106); c.stroke();
    // a strip of quay below
    c.restore();
  }, { t: 7.6, d: 1.4, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ whiplash vines
function vines(p, r) {
  // each vine: a stem hugging the halo from one angle to another, ending in curls
  const specs = [
    { a0: 178, a1: 262, rr: 692, amp: 34, k: 3, curlA: -1, curlB: 1, t: 2.2 },
    { a0: 362, a1: 278, rr: 692, amp: 34, k: 3, curlA: 1, curlB: -1, t: 2.6 },
    { a0: 182, a1: 116, rr: 690, amp: 30, k: 3, curlA: 1, curlB: -1, t: 3.0 },
    { a0: 358, a1: 64, rr: 690, amp: 30, k: 3, curlA: -1, curlB: 1, t: 3.4 },
  ];
  const leaves = [], flowers = [];
  specs.forEach((s, vi) => {
    const pts = [];
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = lerp(s.a0, s.a1, t) * Math.PI / 180, rad = s.rr + Math.sin(t * Math.PI * s.k) * s.amp;
      pts.push([CX + Math.cos(a) * rad, CY + Math.sin(a) * rad]);
    }
    const stem = curl(spline(pts, 6), 1.6, 0.955, s.curlB);
    // a tendril that leaves the stem toward the corner and coils
    const j = Math.floor(stem.length * 0.45), [sx, sy] = stem[j];
    const ca = Math.atan2(sy - CY, sx - CX);
    const tend = curl(spline([[sx, sy], [sx + Math.cos(ca) * 50 + Math.cos(ca + 1.2) * 20, sy + Math.sin(ca) * 50 + Math.sin(ca + 1.2) * 20], [sx + Math.cos(ca) * 110, sy + Math.sin(ca) * 110]], 8), 1.4, 0.94, s.curlA);
    for (const path of [stem, tend]) {
      p.pen('vines', path, INK, path === stem ? 15 : 10, { t: s.t + (path === stem ? 0 : 1.0), d: 1.8 });
      p.pen('vines', path, path === stem ? OLIVE : SAGE, path === stem ? 8 : 5, { t: s.t + 0.15 + (path === stem ? 0 : 1.0), d: 1.8 });
    }
    // leaves along the stem, alternating sides
    for (let i = 6; i < stem.length - 50; i += 9) {
      const [x, y] = stem[i], [x2, y2] = stem[i + 1];
      const a = Math.atan2(y2 - y, x2 - x) + (i % 18 < 9 ? 1 : -1) * 0.9;
      leaves.push([x, y, a, r.range(38, 54), r.range(11, 15), vi]);
    }
    // a poppy on the tendril's turn and one on the stem
    const fpt = tend[Math.floor(tend.length * 0.35)];
    flowers.push([fpt[0], fpt[1], 26, vi]);
    const fp2 = stem[Math.floor(stem.length * 0.72)];
    flowers.push([fp2[0], fp2[1], 20, vi]);
  });
  // leaves, by vine, as one mark each
  for (let vi = 0; vi < 4; vi++) {
    const mine = leaves.filter((l) => l[5] === vi);
    const all = mine.flatMap(([x, y, a, L]) => [[x, y], [x + Math.cos(a) * L, y + Math.sin(a) * L]]);
    p.group('vines', boxOf(all, 30), (c) => {
      c.beginPath(); for (const [x, y, a, L, w] of mine) leaf(c, x, y, a, L, w);
      c.fillStyle = SAGE; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
      c.strokeStyle = OLIVE_D; c.lineWidth = 1.4; c.beginPath();
      for (const [x, y, a, L] of mine) { c.moveTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4); c.lineTo(x + Math.cos(a) * L * 0.8, y + Math.sin(a) * L * 0.8); }
      c.stroke();
    }, { t: 5.4 + vi * 0.3, d: 0.9, reveal: 'fade' });
  }
  // poppies: round petals around a gold heart
  flowers.forEach(([x, y, s], i) => {
    p.group('vines', { x: x - s * 1.8, y: y - s * 1.8, w: s * 3.6, h: s * 3.6 }, (c) => {
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + i;
        c.beginPath(); c.arc(x + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.62, s * 0.66, 0, Math.PI * 2);
        c.fillStyle = k % 2 ? ROSE : ROSE_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
      }
      c.beginPath(); c.arc(x, y, s * 0.42, 0, Math.PI * 2); c.fillStyle = GOLD; c.fill(); c.stroke();
      c.fillStyle = INK; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; c.beginPath(); c.arc(x + Math.cos(a) * s * 0.22, y + Math.sin(a) * s * 0.22, 1.8, 0, Math.PI * 2); c.fill(); }
    }, { t: 8.8 + i * 0.12, d: 0.7, reveal: 'pop', ease: 'back' });
  });
}

// ================================================================ live things
function life(p) {
  // swans gliding on the river, inside the halo
  p.live('live', {
    t: 9.0, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      c.save(); disc(c);
      for (const [x0, y, sp, ph, s] of [[520, 1236, 9, 0, 1], [960, 1292, -7, 1.4, 1.15], [700, 1316, 6, 2.2, 0.9]]) {
        const x = x0 + Math.sin(time * 0.05 * Math.abs(sp) / 7 + ph) * 120 * Math.sign(sp), dir = Math.cos(time * 0.05 * Math.abs(sp) / 7 + ph) * Math.sign(sp) >= 0 ? 1 : -1;
        c.save(); c.translate(x, y + Math.sin(time * 1.4 + ph) * 1.2); c.scale(dir * s, s);
        c.fillStyle = CREAM; c.strokeStyle = INK; c.lineWidth = 2; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(-26, 0); c.quadraticCurveTo(-30, -14, -14, -14); c.lineTo(8, -10); c.quadraticCurveTo(18, -8, 20, 0); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(12, -6); c.quadraticCurveTo(22, -16, 16, -30); c.quadraticCurveTo(14, -38, 22, -38); c.lineTo(28, -35); c.stroke();
        c.fillStyle = TERRA; c.fillRect(24, -37, 6, 3);
        c.strokeStyle = WATER_L; c.lineWidth = 2; c.beginPath(); c.moveTo(-40, 4); c.lineTo(-24, 4); c.moveTo(-50, 9); c.lineTo(-30, 9); c.stroke();
        c.restore();
      }
      c.restore();
    },
  });
  // swifts wheeling around the spires
  p.live('live', {
    t: 9.4, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      c.save(); disc(c);
      c.strokeStyle = INK; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();
      for (let i = 0; i < 7; i++) {
        const a = time * (0.32 + i * 0.03) + i * 0.9, x = 880 + Math.cos(a) * (150 + i * 22), y = 430 + Math.sin(a) * (44 + i * 8);
        const f = Math.sin(time * 7 + i) * 3, s = 7;
        c.moveTo(x - s, y - 2 - f); c.quadraticCurveTo(x - s * 0.4, y - 2, x, y + 1); c.quadraticCurveTo(x + s * 0.4, y - 2, x + s, y - 2 - f);
      }
      c.stroke(); c.restore();
    },
  });
  // a little boat drifting under the arches
  p.live('live', {
    t: 9.8, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      c.save(); disc(c);
      const x = 380 + ((time * 14) % 900), y = 1170;
      c.fillStyle = TERRA; c.strokeStyle = INK; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - 30, y - 8); c.lineTo(x + 34, y - 8); c.quadraticCurveTo(x + 28, y + 4, x + 18, y + 4); c.lineTo(x - 22, y + 4); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = INK; c.beginPath(); c.arc(x + 2, y - 20, 5, 0, Math.PI * 2); c.fill(); c.fillRect(x - 3, y - 16, 10, 9);
      c.beginPath(); c.moveTo(x - 14, y - 12); c.lineTo(x + 20, y - 4); c.stroke();
      c.restore();
    },
  });
  // a glint that runs round the mosaic ring
  p.live('live', {
    t: 13.0, d: 1, reveal: 'fade',
    draw: (c, time) => {
      const a = time * 0.4, m = ((a + 0.08) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      // the Old Town tower stands over the ring between about -45 and 25 degrees: no glint there
      if (m > Math.PI * 2 - 0.8 || m < 0.45) return;
      c.strokeStyle = 'rgba(255,246,214,.55)'; c.lineWidth = 10; c.lineCap = 'round';
      c.beginPath(); c.arc(CX, CY, R + 22, a, a + 0.16); c.stroke();
    },
  });
}

// ================================================================ the tablet and the name
function title(p) {
  const { x, y, w, h } = TAB;
  // the tablet: its top dips under the halo, its corners cut in quarter circles
  const shape = (c, k = 0) => {
    c.beginPath();
    c.moveTo(x + 36 - k, y + 40 - k);
    c.quadraticCurveTo(x + w / 2, y - 20 - k, x + w - 36 + k, y + 40 - k);
    c.arc(x + w + k, y + 40 - k, 36, Math.PI, Math.PI / 2, true);
    c.lineTo(x + w + k, y + h - 36 + k);
    c.arc(x + w + k, y + h + k, 36, -Math.PI / 2, Math.PI, true);
    c.lineTo(x + 36 - k, y + h + k);
    c.arc(x - k, y + h + k, 36, 0, -Math.PI / 2, true);
    c.lineTo(x - k, y + 76 - k);
    c.arc(x - k, y + 40 - k, 36, Math.PI / 2, 0, true);
    c.closePath();
  };
  p.group('title', { x: x - 30, y: y - 60, w: w + 60, h: h + 90 }, (c) => {
    shape(c, 10); c.fillStyle = GOLD; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.stroke();
    shape(c, 0); c.fillStyle = OLIVE_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    shape(c, -12); c.strokeStyle = GOLD_L; c.lineWidth = 2; c.stroke();
  }, { t: 9.6, d: 1.0, reveal: 'iris', ease: 'inOut' });
  // narrow panels either side of the tablet: three rings stacked on a sage ground
  for (const [px, i] of [[112, 0], [W - 112 - 86, 1]]) {
    p.group('title', { x: px - 6, y: y + 20, w: 98, h: h - 10 }, (c) => {
      const top = y + 30, bot = y + h;
      c.beginPath(); c.moveTo(px, bot); c.lineTo(px, top + 43); c.arc(px + 43, top + 43, 43, Math.PI, 0); c.lineTo(px + 86, bot); c.closePath();
      c.fillStyle = SAGE; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      for (let k = 0; k < 3; k++) {
        const cy = top + 60 + k * 100;
        c.beginPath(); c.arc(px + 43, cy, 30, 0, Math.PI * 2); c.fillStyle = GOLD; c.fill(); c.stroke();
        c.beginPath(); c.arc(px + 43, cy, 19, 0, Math.PI * 2); c.fillStyle = k === 1 ? ROSE : OLIVE; c.fill(); c.lineWidth = 2; c.stroke();
        c.beginPath(); c.arc(px + 43, cy, 7, 0, Math.PI * 2); c.fillStyle = GOLD_L; c.fill(); c.stroke(); c.lineWidth = 3;
      }
      c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath();
      for (let k = 0; k < 2; k++) { const yy = top + 110 + k * 100; c.moveTo(px + 20, yy); c.lineTo(px + 66, yy); }
      c.stroke();
    }, { t: 10.0 + i * 0.2, d: 0.8, reveal: 'rise' });
  }
  // a scatter of gold dots inside, along the bottom
  p.group('title', { x: x + 40, y: y + h - 70, w: w - 80, h: 50 }, (c) => {
    c.fillStyle = GOLD;
    for (let k = 0; k < 41; k++) { const xx = x + 70 + k * ((w - 140) / 40), s = k % 5 === 0 ? 5 : 2.5; c.beginPath(); c.arc(xx, y + h - 44, s, 0, Math.PI * 2); c.fill(); }
  }, { t: 10.2, d: 0.8, reveal: 'wipe' });
  // PRAHA
  p.type('title', 'PRAHA', W / 2, y + 240, {
    family: FACE, size: 250, color: GOLD_L, stroke: INK, lw: 4, track: 0.1, align: 'center',
    shadow: INK, sx: 7, sy: 7, t: 10.7, gap: 0.32, d: 1.0, reveal: 'press', fit: 940,
  });
  // the sights under the name
  p.type('title', 'PRAŽSKÝ HRAD · MALÁ STRANA · STARÉ MĚSTO', W / 2, y + h - 74, {
    family: FACE, size: 38, color: CREAM, track: 0.14, align: 'center', t: 12.6, gap: 0.025, d: 0.5, reveal: 'fade',
  });
  // small poppies at the tablet's top corners
  for (const [fx, i] of [[x + 50, 0], [x + w - 50, 1]]) {
    p.group('title', { x: fx - 34, y: y + 6, w: 68, h: 68 }, (c) => {
      const fy = y + 40, s = 18;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + 0.3;
        c.beginPath(); c.arc(fx + Math.cos(a) * s * 0.62, fy + Math.sin(a) * s * 0.62, s * 0.66, 0, Math.PI * 2);
        c.fillStyle = k % 2 ? ROSE : ROSE_D; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      }
      c.beginPath(); c.arc(fx, fy, s * 0.42, 0, Math.PI * 2); c.fillStyle = GOLD; c.fill(); c.stroke();
    }, { t: 13.2 + i * 0.15, d: 0.6, reveal: 'pop', ease: 'back' });
  }
}
