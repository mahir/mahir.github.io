// Samarkand: the Registan at the last of the light, built around its three
// portals. Seen from the south steps: the Ulugh Beg madrasa on the left and the
// Sher-Dor on the right face each other across the square, the Tilya-Kori closes
// it at the far end with its turquoise dome. Brick laid in diamond lattices of
// glazed tile, pishtaq portals framed in lapis and turquoise bands with deep
// honeycombed niches, the striped tigers chasing deer under a rayed sun on the
// Sher-Dor, ribbed domes, corner minarets wound with tile. The view sits in a
// girih border of eight-pointed stars, the name set in classical capitals below.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, rng, shade, mix } from '../kit.js';

const PAPER = '#f1e8d4';
const LAPIS = '#1f3a8a', LAPIS_D = '#152866', LAPIS_L = '#3d5cb0', TURQ = '#2ea2a3', TURQ_L = '#86d2c6', TURQ_D = '#1d7478';
const BRICK = '#d29d5e', BRICK_L = '#e8bd82', BRICK_S = '#a7713f', BRICK_D = '#7d532f';
const WHITE = '#f7f0e0', GOLD = '#e4b24a', GOLD_D = '#b4822c', NICHE = '#2b2848', NICHE_L = '#4a4170';
const TIGER = '#e3862a', GREEN = '#3b7a55', INK = '#1b1a30';
const SKY = ['#202a63', '#38397a', '#6a4a86', '#b06478', '#e2905c', '#f3c27a'];

export const city = {
  id: 'samarkand', name: 'Samarkand',
  alt: 'The Registan at dusk in tile colors, inside a girih border of eight-pointed stars: the Ulugh Beg madrasa on the left and the Sher-Dor madrasa on the right facing each other across the square, each with a great portal framed in lapis and turquoise tile, honeycombed niches and corner minarets wound with tile lattice, the Sher-Dor with its tigers and rayed sun and its ribbed turquoise domes, and the Tilya-Kori with its turquoise dome closing the far end, people crossing the brick paving and swifts in the sky, the name SAMARKAND below',
  google: 'family=Cormorant+SC:wght@500;700',
  wall: '#16234f',
  fonts: [['700 170px "Cormorant SC"', 'SAMARKAND'], ['500 30px "Cormorant SC"', 'THE REGISTAN · ULUGH BEG · TILYA-KORI · SHER-DOR']],
  build,
};

// the sheet: a girih border, the picture, the title panel
const B0 = 24, BW = 86, PX0 = B0 + BW, PX1 = W - B0 - BW, PY0 = B0 + BW, PY1 = 1560, TY0 = 1592, TY1 = H - B0 - BW;

// the view: one-point perspective from the south steps
const VX = 800, VY = 1250, E = 8, F = 1292;
const P = (X, s, Z) => [VX + X * F / s, VY + (E - Z) * F / s];
const kAt = (s) => F / s;
const ST = 102.6; // the Tilya-Kori's front
// a facade: a vertical plane through A and B on the ground, u along it from A, v up
function plane(A, B) {
  const dx = B[0] - A[0], ds = B[1] - A[1], L = Math.hypot(dx, ds);
  const ux = dx / L, us = ds / L;
  return { L, map: (u, v) => P(A[0] + ux * u, A[1] + us * u, v), k: (u) => F / (A[1] + us * u) };
}
// a facade drawn to a chosen quad on the sheet (a homography): the side madrasas are
// turned a little toward us, so their portals read. Corners: near foot, far foot, far top, near top.
function hplane(L, Hm, q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den, h = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  const map = (u, v) => { const U = u / L, V = v / Hm, w = g * U + h * V + 1; return [(a * U + b * V + x0) / w, (d * U + e * V + y0) / w]; };
  return {
    L, map, q,
    k: (u) => (map(u, 0)[1] - map(u, Hm)[1]) / Hm,
    // the same facade moved toward the square's middle by dm meters
    offset: (dm, dir) => hplane(L, Hm, q.map(([x, y], i) => { const kk = (i === 0 || i === 3) ? (q[0][1] - q[3][1]) / Hm : (q[1][1] - q[2][1]) / Hm; return [x + dir * dm * kk * 0.55, y]; })),
  };
}
const pathOf = (c, pts, close = true) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath(); };
const quad = (pl, u0, u1, v0, v1) => [pl.map(u0, v0), pl.map(u1, v0), pl.map(u1, v1), pl.map(u0, v1)];
// draw in a plane's local meters (v up), by the plane's local affine at (u, v)
function local(c, pl, u, v) {
  const [x, y] = pl.map(u, v), [x1, y1] = pl.map(u + 0.01, v), [x2, y2] = pl.map(u, v + 0.01);
  c.transform((x1 - x) * 100, (y1 - y) * 100, -(x2 - x) * 100, -(y2 - y) * 100, x, y);
  c.scale(1, -1);
}
// a pointed arch's outline, in local (u, v): from the left foot up and over to the right foot
function archPts(u0, u1, v0, spring, apex, n = 14) {
  // two arcs, each struck from the opposite foot, meeting in a point
  const w = u1 - u0, rise = (apex - spring) / Math.sin(Math.PI / 3), pts = [[u0, v0], [u0, spring]];
  for (let i = 1; i <= n; i++) { const th = Math.PI - (i / n) * Math.PI / 3; pts.push([u1 + w * Math.cos(th), spring + rise * Math.sin(th)]); }
  for (let i = n - 1; i >= 1; i--) { const th = Math.PI - (i / n) * Math.PI / 3; pts.push([u0 - w * Math.cos(th), spring + rise * Math.sin(th)]); }
  pts.push([u1, spring], [u1, v0]);
  return pts;
}

// the three buildings, in the world
const SIDE_L = 50, SIDE_H = 36;
const sideQuad = (sg) => {
  const X = (x) => VX + sg * (x - VX), kn = 31, kf = 18, xn = 150, xf = 505;
  return [[X(xn), VY + E * kn], [X(xf), VY + E * kf], [X(xf), VY - (SIDE_H - E) * kf], [X(xn), VY - (SIDE_H - E) * kn]];
};
const UB = hplane(SIDE_L, SIDE_H, sideQuad(1));
const SD = hplane(SIDE_L, SIDE_H, sideQuad(-1));
const TK = plane([-25, ST], [25, ST]);

function build() {
  const p = new Plate({ paper: PAPER, seed: 1417 });
  const r = p.r;
  p.clip = { x: PX0, y: PY0, w: PX1 - PX0, h: PY1 - PY0 };
  p.stack('border', 'sky', 'stars', 'ground', 'tk', 'tkdet', 'domes', 'sides', 'sidedet', 'minarets', 'folk', 'live', 'title');
  p.layer('border', { clip: false });
  p.layer('title', { clip: false });

  border(p, r);
  sky(p, r);
  ground(p, r);
  tilyaKori(p, r);
  sherDorDomes(p, r);
  madrasa(p, r, UB, 'ub', 4.0);
  madrasa(p, r, SD, 'sd', 4.4);
  minarets(p, r);
  folk(p, r);
  lives(p, r);
  title(p);
  return p;
}

// ================================================================ the girih border: eight-pointed stars on lapis
function starPts(cx, cy, R, rr) {
  const pts = [];
  for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + i * Math.PI / 8; const q = i % 2 ? rr : R; pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); }
  return pts;
}
function girihTile(c, cx, cy, s) {
  // the star, its strapwork running out to the neighbors, little kites between
  c.fillStyle = TURQ; pathOf(c, starPts(cx, cy, s * 0.36, s * 0.24)); c.fill();
  c.fillStyle = WHITE; pathOf(c, starPts(cx, cy, s * 0.14, s * 0.09)); c.fill();
  c.strokeStyle = WHITE; c.lineWidth = s * 0.05; c.lineJoin = 'miter'; c.beginPath();
  const sp = starPts(cx, cy, s * 0.36, s * 0.24);
  for (let i = 0; i < 16; i++) { const [x, y] = sp[i]; i ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.closePath();
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 4;
    c.moveTo(cx + Math.cos(a) * s * 0.36, cy + Math.sin(a) * s * 0.36); c.lineTo(cx + Math.cos(a) * s * 0.5 * (i % 2 ? 1.41 : 1), cy + Math.sin(a) * s * 0.5 * (i % 2 ? 1.41 : 1));
  }
  c.stroke();
  c.fillStyle = GOLD;
  for (const [dx, dy] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) { c.beginPath(); c.arc(cx + dx * s, cy + dy * s, s * 0.07, 0, Math.PI * 2); c.fill(); }
}
function border(p, r) {
  // the lapis ground of the whole frame, the title panel included
  p.group('border', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = LAPIS_D;
    c.beginPath(); c.rect(B0, B0, W - 2 * B0, H - 2 * B0); c.rect(PX0, PY0, PX1 - PX0, PY1 - PY0); c.fill('evenodd');
    c.fillStyle = INK; c.fillRect(B0, B0, W - 2 * B0, 4); c.fillRect(B0, H - B0 - 4, W - 2 * B0, 4); c.fillRect(B0, B0, 4, H - 2 * B0); c.fillRect(W - B0 - 4, B0, 4, H - 2 * B0);
  }, { t: 0.05, d: 0.6, reveal: 'fade' });
  // the tiles, laid round the frame in four runs
  const s = BW, tiles = [];
  const nx = Math.round((W - 2 * B0) / s), ny = Math.round((H - 2 * B0) / s);
  const sx = (W - 2 * B0) / nx, sy = (H - 2 * B0) / ny;
  for (let i = 0; i < nx; i++) tiles.push(['top', B0 + (i + 0.5) * sx, B0 + BW / 2]);
  for (let j = 1; j < ny; j++) tiles.push(['right', W - B0 - BW / 2, B0 + (j + 0.5) * sy]);
  for (let i = nx - 2; i >= 0; i--) tiles.push(['bottom', B0 + (i + 0.5) * sx, H - B0 - BW / 2]);
  for (let j = ny - 2; j >= 1; j--) tiles.push(['left', B0 + BW / 2, B0 + (j + 0.5) * sy]);
  const runs = ['top', 'right', 'bottom', 'left'];
  runs.forEach((side, k) => {
    const list = tiles.filter((t) => t[0] === side);
    const b = boxOf(list.map((t) => [t[1], t[2]]), BW * 0.7);
    const rev = { top: 'wipe', right: 'fall', bottom: 'wipeL', left: 'rise' }[side];
    p.group('border', b, (c) => { for (const [, x, y] of list) girihTile(c, x, y, BW * 0.92); }, { t: 0.2 + k * 0.4, d: 0.8, reveal: rev, ease: 'inOut' });
  });
  // the inner fillet round the picture and the title panel: turquoise, a white cord
  p.group('border', { x: PX0 - 14, y: PY0 - 14, w: PX1 - PX0 + 28, h: TY1 - PY0 + 28 }, (c) => {
    c.strokeStyle = TURQ; c.lineWidth = 10; c.strokeRect(PX0 - 5, PY0 - 5, PX1 - PX0 + 10, PY1 - PY0 + 10);
    c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(PX0 - 5, PY0 - 5, PX1 - PX0 + 10, PY1 - PY0 + 10);
    c.strokeStyle = TURQ; c.lineWidth = 10; c.strokeRect(PX0 - 5, TY0 - 5, PX1 - PX0 + 10, TY1 - TY0 + 10);
    c.strokeStyle = WHITE; c.lineWidth = 2; c.strokeRect(PX0 - 5, TY0 - 5, PX1 - PX0 + 10, TY1 - TY0 + 10);
  }, { t: 1.7, d: 0.8, reveal: 'fade' });
}

// ================================================================ the dusk sky, stars, a thin cloud
function sky(p, r) {
  const ys = [PY0, 360, 560, 760, 960, 1120];
  p.group('sky', { x: PX0, y: PY0, w: PX1 - PX0, h: VY - PY0 + 10 }, (c) => {
    const g = c.createLinearGradient(0, PY0, 0, VY);
    SKY.forEach((col, i) => g.addColorStop(clamp((ys[i] - PY0) / (VY - PY0)), col));
    c.fillStyle = g; c.fillRect(PX0, PY0, PX1 - PX0, VY - PY0 + 10);
  }, { t: 0.5, d: 1.2, reveal: 'fall', ease: 'inOut' });
  // long thin clouds lit from below
  const clouds = [[240, 640, 420], [880, 560, 360], [1080, 720, 300], [420, 820, 260]];
  p.group('sky', { x: PX0, y: 520, w: PX1 - PX0, h: 340 }, (c) => {
    for (const [x, y, w] of clouds) {
      c.fillStyle = mix(SKY[3], SKY[4], 0.5); c.beginPath(); c.roundRect(x, y, w, 12, 6); c.fill();
      c.fillStyle = mix(SKY[4], SKY[5], 0.4); c.beginPath(); c.roundRect(x + w * 0.15, y + 9, w * 0.7, 6, 3); c.fill();
      c.fillStyle = mix(SKY[2], SKY[3], 0.5); c.beginPath(); c.roundRect(x + w * 0.3, y - 10, w * 0.4, 9, 4); c.fill();
    }
  }, { t: 1.3, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // the moon rising in the east, pale, with a ring of haze
  p.group('sky', { x: 1040, y: 150, w: 240, h: 240 }, (c) => {
    c.fillStyle = 'rgba(247,240,224,0.08)'; c.beginPath(); c.arc(1160, 270, 110, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(247,240,224,0.1)'; c.beginPath(); c.arc(1160, 270, 78, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#efe6d2'; c.beginPath(); c.arc(1160, 270, 52, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ddd2bd'; for (const [dx, dy, rr] of [[-16, -10, 11], [12, 8, 15], [-6, 22, 7], [20, -18, 6]]) { c.beginPath(); c.arc(1160 + dx, 270 + dy, rr, 0, Math.PI * 2); c.fill(); }
  }, { t: 1.5, d: 1.0, reveal: 'fade' });
  // the first stars
  const stars = [];
  for (let i = 0; i < 80; i++) stars.push([r.range(PX0, PX1), r.range(PY0 + 6, 520) , r.range(0.8, 2.2)]);
  p.group('stars', { x: PX0, y: PY0, w: PX1 - PX0, h: 420 }, (c) => {
    c.fillStyle = WHITE;
    for (const [x, y, s] of stars) { c.globalAlpha = 0.4 + s * 0.25; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  }, { t: 1.6, d: 1.0, reveal: 'fade' });
}

// ================================================================ the square: brick paving to the far end
function ground(p, r) {
  const g0 = P(-60, 30, 0)[1];
  p.group('ground', { x: PX0, y: VY - 4, w: PX1 - PX0, h: PY1 - VY + 8 }, (c) => {
    c.fillStyle = mix(BRICK, SKY[4], 0.25); c.fillRect(PX0, VY, PX1 - PX0, PY1 - VY);
    c.fillStyle = BRICK_L; pathOf(c, [P(-12, 30, 0), P(12, 30, 0), P(12, ST, 0), P(-12, ST, 0)]); c.fill();
  }, { t: 1.8, d: 0.9, reveal: 'rise' });
  void g0;
  // paving: lines running to the far end, and courses across
  const lines = [];
  for (let X = -30; X <= 30; X += 1.5) lines.push([P(X, 24, 0), P(X, ST, 0)]);
  for (let s = 24; s < ST; s *= 1.03) lines.push([P(-32, s, 0), P(32, s, 0)]);
  p.strokes('ground', lines, BRICK_S, 1.2, { t: 2.1, d: 1.0, reveal: 'rise', box: { x: PX0, y: VY, w: PX1 - PX0, h: PY1 - VY } });
  // a band of white marble at the foot of the steps
  p.group('ground', { x: PX0, y: 1500, w: PX1 - PX0, h: 64 }, (c) => {
    c.fillStyle = WHITE; c.fillRect(PX0, 1530, PX1 - PX0, 30);
    c.fillStyle = mix(WHITE, BRICK, 0.35); for (let y = 1528; y < 1560; y += 14) c.fillRect(PX0, y, PX1 - PX0, 3);
  }, { t: 2.4, d: 0.6, reveal: 'wipe' });
}

// ================================================================ tile work on a plane, in local meters
// a lattice of diamonds over a rectangle (banna'i: glazed bricks among plain ones)
function lattice(pl, u0, u1, v0, v1, step) {
  const lines = [];
  const w = u1 - u0, h = v1 - v0;
  for (let d = -h; d < w; d += step) {
    const a0 = Math.max(0, d), a1 = Math.min(w, d + h);
    if (a1 > a0) lines.push([pl.map(u0 + a0, v0 + a0 - d), pl.map(u0 + a1, v0 + a1 - d)]);
    const b0 = Math.max(0, d), b1 = Math.min(w, d + h);
    if (b1 > b0) lines.push([pl.map(u0 + b0, v1 - (b0 - d)), pl.map(u0 + b1, v1 - (b1 - d))]);
  }
  return lines;
}
const strokeLines = (c, lines) => { c.beginPath(); for (const [a, b] of lines) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke(); };
const mapPts = (pl, pts) => pts.map(([u, v]) => pl.map(u, v));

// a portal: frame bands, the spandrels, a deep honeycombed niche. o: { u0, u1, h, kind }
function pishtaq(c, pl, o, rr) {
  const { u0, u1, h } = o, w = u1 - u0;
  const kk = pl.k((u0 + u1) / 2);
  // the brick face and its lattice
  c.fillStyle = BRICK; pathOf(c, quad(pl, u0, u1, 0, h)); c.fill();
  c.strokeStyle = TURQ_D; c.lineWidth = Math.max(1, kk * 0.18); strokeLines(c, lattice(pl, u0, u1, 0, h, 1.6));
  // the outer frame: a lapis band with white cord on both edges, then turquoise
  const bands = [[0.0, 1.3, LAPIS], [1.3, 1.9, TURQ], [1.9, 2.3, WHITE]];
  for (const [a, b, col] of bands) {
    c.fillStyle = col;
    pathOf(c, [...quad(pl, u0 + a, u1 - a, h - a, h - b).slice(0, 2), ...quad(pl, u0 + a, u1 - a, h - b, h - a).slice(0, 0)]);
    c.beginPath();
    for (const q of [quad(pl, u0 + a, u0 + b, 0, h - a), quad(pl, u1 - b, u1 - a, 0, h - a), quad(pl, u0 + a, u1 - a, h - b, h - a)]) { c.moveTo(q[0][0], q[0][1]); for (const pt of q) c.lineTo(pt[0], pt[1]); c.closePath(); }
    c.fill();
  }
  // rosettes in the lapis band
  c.fillStyle = WHITE;
  for (let v = 1.2; v < h - 1; v += 1.6) for (const u of [u0 + 0.65, u1 - 0.65]) { const [x, y] = pl.map(u, v); c.beginPath(); c.arc(x, y, kk * 0.28, 0, Math.PI * 2); c.fill(); }
  for (let u = u0 + 1.4; u < u1 - 1; u += 1.6) { const [x, y] = pl.map(u, h - 0.65); c.beginPath(); c.arc(x, y, kk * 0.28, 0, Math.PI * 2); c.fill(); }
  // the arch: spandrels in lapis, the niche inside
  const nu0 = u0 + 3.6, nu1 = u1 - 3.6, spring = h * 0.5, apex = h - 4.2;
  const frame = [[nu0 - 0.8, 0], [nu0 - 0.8, apex + 0.8], [nu1 + 0.8, apex + 0.8], [nu1 + 0.8, 0]];
  c.fillStyle = LAPIS; pathOf(c, mapPts(pl, [[nu0 - 0.8, spring * 0.9], [nu0 - 0.8, apex + 0.8], [nu1 + 0.8, apex + 0.8], [nu1 + 0.8, spring * 0.9]])); c.fill();
  void frame;
  // spandrel ornament
  if (o.kind === 'sd') {
    for (const side of [-1, 1]) {
      const cu = side < 0 ? nu0 + (nu1 - nu0) * 0.12 : nu1 - (nu1 - nu0) * 0.12, cv = apex - 1.4;
      c.save(); local(c, pl, cu, cv); c.scale(1.25, 1.25); if (side > 0) c.scale(-1, 1); tigerSun(c); c.restore();
    }
  } else {
    // stars and knots
    for (const side of [-1, 1]) {
      const cu = side < 0 ? nu0 + 0.9 : nu1 - 0.9, cv = apex - 0.6;
      c.save(); local(c, pl, cu, cv);
      c.fillStyle = TURQ; pathOf(c, starPts(0, 0, 1.1, 0.72).map(([x, y]) => [x, -y])); c.fill();
      c.fillStyle = WHITE; pathOf(c, starPts(0, 0, 0.45, 0.3)); c.fill();
      c.strokeStyle = GOLD; c.lineWidth = 0.12; c.beginPath(); c.arc(0, 0, 1.4, 0, Math.PI * 2); c.stroke();
      c.restore();
    }
  }
  // the inscription band over the arch: a white panel with a run of strokes (not words)
  c.fillStyle = WHITE; pathOf(c, quad(pl, u0 + 2.3, u1 - 2.3, apex + 1.0, apex + 1.7)); c.fill();
  c.strokeStyle = LAPIS; c.lineWidth = Math.max(0.8, kk * 0.12); c.beginPath();
  for (let u = u0 + 2.6; u < u1 - 2.5; u += 0.3) { const a = pl.map(u, apex + 1.1), b = pl.map(u, apex + 1.1 + 0.35 + ((u * 7) % 1) * 0.2); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  // the niche: a turquoise arch band, then the dark hollow with its honeycomb
  const outer = archPts(nu0 - 0.5, nu1 + 0.5, 0, spring, apex + 0.5);
  const inner = archPts(nu0, nu1, 0, spring, apex);
  c.fillStyle = TURQ; pathOf(c, mapPts(pl, outer)); c.fill();
  c.fillStyle = NICHE; pathOf(c, mapPts(pl, inner)); c.fill();
  c.save(); pathOf(c, mapPts(pl, inner)); c.clip();
  // muqarnas: rows of little arches stepping down into the hollow
  c.strokeStyle = NICHE_L; c.lineWidth = Math.max(0.8, kk * 0.12);
  c.fillStyle = mix(NICHE, TURQ_D, 0.35);
  for (let row = 0; row < 6; row++) {
    const vv = apex - 0.8 - row * 1.15, n = 3 + row * 2, ww = (nu1 - nu0) / n;
    for (let i = 0; i < n; i++) {
      const a = nu0 + i * ww + (row % 2) * ww * 0.5;
      const pts = mapPts(pl, archPts(a + 0.1, a + ww - 0.1, vv - 1.1, vv - 0.6, vv, 4));
      if (row % 2) { pathOf(c, pts); c.fill(); }
      pathOf(c, pts, false); c.stroke();
    }
  }
  // the inner door, two stories of small arches, a lit lattice window
  const du0 = nu0 + (nu1 - nu0) * 0.28, du1 = nu1 - (nu1 - nu0) * 0.28;
  c.fillStyle = mix(NICHE, BRICK, 0.3); pathOf(c, mapPts(pl, archPts(nu0 + 0.6, nu1 - 0.6, 0, 5, 7.5))); c.fill();
  c.fillStyle = INK; pathOf(c, mapPts(pl, archPts(du0, du1, 0, 3.2, 4.6))); c.fill();
  c.fillStyle = GOLD; pathOf(c, mapPts(pl, archPts(du0 + 0.5, du1 - 0.5, 5.6, 6.6, 7.2))); c.fill();
  c.strokeStyle = INK; c.lineWidth = Math.max(0.8, kk * 0.07); c.beginPath();
  for (let u = du0 + 0.8; u < du1 - 0.5; u += 0.5) { const a = pl.map(u, 5.6), b = pl.map(u, 7.2); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  c.restore();
  void rr;
}
// the Sher-Dor's spandrel: a tiger leaping at a white deer under a rayed sun (in local meters, v up)
function tigerSun(c) {
  // the sun on the tiger's back, rayed
  c.fillStyle = GOLD;
  c.beginPath(); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, q = i % 2 ? 0.75 : 1.05; c.lineTo(0.9 + Math.cos(a) * q, 1.1 + Math.sin(a) * q); } c.closePath(); c.fill();
  c.fillStyle = '#f6d27a'; c.beginPath(); c.arc(0.9, 1.1, 0.52, 0, Math.PI * 2); c.fill();
  // the tiger, leaping to the left
  c.fillStyle = TIGER;
  c.beginPath();
  c.moveTo(1.9, 0.2); c.quadraticCurveTo(1.2, 0.7, 0.2, 0.5); c.quadraticCurveTo(-0.6, 0.6, -1.1, 0.3);
  c.lineTo(-1.5, 0.45); c.lineTo(-1.75, 0.15); c.lineTo(-1.45, -0.15); c.lineTo(-1.0, -0.15);
  c.lineTo(-0.8, -0.5); c.lineTo(-1.3, -0.95); c.lineTo(-1.05, -1.0); c.lineTo(-0.45, -0.45);
  c.quadraticCurveTo(0.4, -0.55, 1.0, -0.35); c.lineTo(1.5, -0.9); c.lineTo(1.75, -0.8); c.lineTo(1.45, -0.2);
  c.quadraticCurveTo(1.8, 0.0, 1.9, 0.2); c.closePath(); c.fill();
  // the tail, curling up
  c.strokeStyle = TIGER; c.lineWidth = 0.14; c.lineCap = 'round'; c.beginPath(); c.moveTo(1.85, 0.1); c.quadraticCurveTo(2.5, 0.2, 2.3, 0.9); c.stroke();
  // stripes
  c.strokeStyle = INK; c.lineWidth = 0.09; c.beginPath();
  for (let x = -0.7; x < 1.7; x += 0.28) { c.moveTo(x, 0.5); c.lineTo(x + 0.1, -0.15); }
  c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(-1.42, 0.22, 0.06, 0, Math.PI * 2); c.fill();
  // the deer it chases, small and white
  c.fillStyle = WHITE;
  c.beginPath(); c.moveTo(-2.3, -0.2); c.lineTo(-3.2, -0.1); c.lineTo(-3.4, 0.2); c.lineTo(-3.25, 0.25); c.lineTo(-3.1, 0.0); c.lineTo(-2.3, 0.05); c.closePath(); c.fill();
  c.fillRect(-3.15, -0.6, 0.08, 0.5); c.fillRect(-2.45, -0.6, 0.08, 0.5);
  c.strokeStyle = WHITE; c.lineWidth = 0.06; c.beginPath(); c.moveTo(-3.3, 0.22); c.lineTo(-3.45, 0.55); c.moveTo(-3.3, 0.22); c.lineTo(-3.15, 0.55); c.stroke();
}

// the wall either side of a portal: two stories of arched niches over a plinth
function wall(c, pl, u0, u1, h, bays) {
  const kk = pl.k((u0 + u1) / 2);
  c.fillStyle = BRICK; pathOf(c, quad(pl, u0, u1, 0, h)); c.fill();
  c.strokeStyle = mix(BRICK, TURQ_D, 0.55); c.lineWidth = Math.max(0.7, kk * 0.13); strokeLines(c, lattice(pl, u0, u1, 0, h, 1.4));
  c.fillStyle = WHITE; pathOf(c, quad(pl, u0, u1, 0, 0.9)); c.fill();
  c.fillStyle = LAPIS; pathOf(c, quad(pl, u0, u1, h - 0.9, h)); c.fill();
  c.fillStyle = TURQ; pathOf(c, quad(pl, u0, u1, h - 1.25, h - 0.9)); c.fill();
  const bw = (u1 - u0) / bays;
  for (let i = 0; i < bays; i++) {
    const a = u0 + i * bw + 0.55, b = u0 + (i + 1) * bw - 0.55;
    for (const [v0, v1] of [[1.2, h * 0.47], [h * 0.53, h - 1.6]]) {
      const spring = v0 + (v1 - v0) * 0.6;
      c.fillStyle = TURQ; pathOf(c, mapPts(pl, archPts(a - 0.25, b + 0.25, v0, spring, v1 + 0.2, 8))); c.fill();
      c.fillStyle = NICHE; pathOf(c, mapPts(pl, archPts(a, b, v0, spring, v1, 8))); c.fill();
      // a small grille window in the lower part
      c.fillStyle = mix(NICHE, BRICK, 0.4); pathOf(c, quad(pl, a + 0.6, b - 0.6, v0 + 0.4, spring - 0.6)); c.fill();
    }
  }
}

// ================================================================ the Tilya-Kori, at the far end
function tilyaKori(p, r) {
  const pl = TK, L = pl.L, h = 16, pu0 = 16, pu1 = 34, ph = 31;
  // the dome on the west side, behind the front: turquoise on a patterned drum
  const dc = P(-14, ST + 14, 0), kd = kAt(ST + 14);
  const [dx] = dc, drumTop = P(-14, ST + 14, 20)[1], drumBot = P(-14, ST + 14, 13)[1];
  const dr = 8.5 * kd;
  p.group('tk', { x: dx - dr - 10, y: drumTop - dr * 1.15 - 30, w: 2 * dr + 20, h: drumBot - drumTop + dr * 1.2 + 40 }, (c) => {
    c.fillStyle = BRICK_S; c.fillRect(dx - dr * 0.95, drumTop, dr * 1.9, drumBot - drumTop);
    c.fillStyle = LAPIS; c.fillRect(dx - dr * 0.95, drumTop + (drumBot - drumTop) * 0.25, dr * 1.9, (drumBot - drumTop) * 0.45);
    c.fillStyle = WHITE; c.font = `${Math.round(kd * 1.6)}px serif`;
    c.fillStyle = TURQ_L; for (let x = dx - dr * 0.9; x < dx + dr * 0.9; x += kd * 1.4) c.fillRect(x, drumTop + (drumBot - drumTop) * 0.36, kd * 0.6, (drumBot - drumTop) * 0.22);
    c.fillStyle = TURQ; c.beginPath(); c.moveTo(dx - dr, drumTop); c.bezierCurveTo(dx - dr * 1.02, drumTop - dr * 0.9, dx - dr * 0.3, drumTop - dr * 1.12, dx, drumTop - dr * 1.15);
    c.bezierCurveTo(dx + dr * 0.3, drumTop - dr * 1.12, dx + dr * 1.02, drumTop - dr * 0.9, dx + dr, drumTop); c.closePath(); c.fill();
    c.fillStyle = TURQ_D; c.beginPath(); c.moveTo(dx + dr * 0.15, drumTop - dr * 1.1); c.bezierCurveTo(dx + dr * 0.7, drumTop - dr * 1.0, dx + dr * 1.0, drumTop - dr * 0.6, dx + dr, drumTop); c.lineTo(dx + dr * 0.4, drumTop); c.closePath(); c.fill();
    c.fillStyle = GOLD_D; c.fillRect(dx - 1.2, drumTop - dr * 1.15 - 22, 2.4, 22);
  }, { t: 2.4, d: 1.0, reveal: 'rise' });
  // the long front: two stories of niches, little corner towers
  p.group('tk', boxOf(quad(pl, -1, L + 1, 0, 21), 6), (c) => {
    wall(c, pl, 0, pu0, h, 4);
    wall(c, pl, pu1, L, h, 4);
    // corner towers (guldasta), striped with tile, with a little ribbed cap
    for (const u of [0.9, L - 0.9]) {
      const [x, y0] = pl.map(u, 0), [, y1] = pl.map(u, h + 4), kk = pl.k(u);
      c.fillStyle = BRICK_L; c.fillRect(x - kk * 1.1, y1, kk * 2.2, y0 - y1);
      c.fillStyle = TURQ; for (let y = y1 + kk; y < y0 - kk; y += kk * 1.3) c.fillRect(x - kk * 1.1, y, kk * 2.2, kk * 0.4);
      c.fillStyle = LAPIS; c.fillRect(x - kk * 1.35, y1 - kk * 0.6, kk * 2.7, kk * 0.8);
      c.fillStyle = TURQ; c.beginPath(); c.arc(x, y1 - kk * 0.6, kk * 1.1, Math.PI, 0); c.fill();
    }
  }, { t: 2.8, d: 1.1, reveal: 'rise' });
  p.group('tkdet', boxOf(quad(pl, pu0 - 1, pu1 + 1, 0, ph + 2), 8), (c) => {
    pishtaq(c, pl, { u0: pu0, u1: pu1, h: ph, kind: 'tk' }, r);
    // the portal's own small corner minarets
    for (const u of [pu0 + 0.5, pu1 - 0.5]) {
      const [x, y0] = pl.map(u, 0), [, y1] = pl.map(u, ph + 3), kk = pl.k(u);
      c.fillStyle = BRICK_L; c.fillRect(x - kk * 0.7, y1, kk * 1.4, y0 - y1);
      c.strokeStyle = TURQ; c.lineWidth = kk * 0.3; c.beginPath(); for (let y = y1 + kk; y < y0; y += kk * 1.2) { c.moveTo(x - kk * 0.7, y); c.lineTo(x + kk * 0.7, y - kk * 0.6); } c.stroke();
      c.fillStyle = TURQ; c.beginPath(); c.arc(x, y1, kk * 0.8, Math.PI, 0); c.fill();
    }
  }, { t: 3.3, d: 1.2, reveal: 'rise', ease: 'out' });
}

// ================================================================ the Sher-Dor's two ribbed domes, behind its front
function sherDorDomes(p, r) {
  const ribbed = (c, x, top, dr, k) => {
    // a tall drum, then a melon dome of turquoise ribs
    c.fillStyle = BRICK_S; c.fillRect(x - dr * 0.85, top, dr * 1.7, k * 5);
    c.fillStyle = LAPIS; c.fillRect(x - dr * 0.85, top + k * 1.2, dr * 1.7, k * 2.4);
    c.fillStyle = WHITE; c.beginPath(); for (let xx = x - dr * 0.8; xx < x + dr * 0.8; xx += k * 1.1) { c.moveTo(xx + k * 0.5, top + k * 2.4); c.arc(xx + k * 0.25, top + k * 2.4, k * 0.25, 0, Math.PI * 2); } c.fill();
    const H2 = dr * 1.35;
    c.fillStyle = TURQ;
    c.beginPath(); c.moveTo(x - dr * 0.88, top); c.bezierCurveTo(x - dr * 1.15, top - H2 * 0.5, x - dr * 0.5, top - H2 * 0.95, x, top - H2);
    c.bezierCurveTo(x + dr * 0.5, top - H2 * 0.95, x + dr * 1.15, top - H2 * 0.5, x + dr * 0.88, top); c.closePath(); c.fill();
    c.save(); c.clip();
    c.fillStyle = TURQ_D; c.fillRect(x + dr * 0.25, top - H2, dr, H2);
    c.strokeStyle = TURQ_D; c.lineWidth = Math.max(1, k * 0.35); c.beginPath();
    for (let i = -5; i <= 5; i++) { const f = i / 6; c.moveTo(x + f * dr * 0.88, top); c.bezierCurveTo(x + f * dr * 1.15, top - H2 * 0.5, x + f * dr * 0.5, top - H2 * 0.95, x, top - H2); }
    c.stroke();
    c.strokeStyle = TURQ_L; c.lineWidth = Math.max(1, k * 0.2); c.beginPath();
    for (let i = -5; i <= -1; i++) { const f = i / 6 + 0.04; c.moveTo(x + f * dr * 0.88, top); c.bezierCurveTo(x + f * dr * 1.15, top - H2 * 0.5, x + f * dr * 0.5, top - H2 * 0.95, x, top - H2); }
    c.stroke();
    c.restore();
    c.fillStyle = GOLD_D; c.fillRect(x - 1.5, top - H2 - k * 2.5, 3, k * 2.5); c.beginPath(); c.arc(x, top - H2 - k * 2.5, k * 0.4, 0, Math.PI * 2); c.fill();
  };
  [[42, 5.5], [9, 5.8]].forEach(([u, t]) => {
    const kd = SD.k(u), [x0, top] = SD.map(u, 22), x = x0 + 7 * kd * 0.55, dr = 7 * kd;
    p.group('domes', { x: x - dr * 1.2, y: top - dr * 1.6 - kd * 4, w: dr * 2.4, h: dr * 1.7 + kd * 12 }, (c) => ribbed(c, x, top, dr, kd), { t, d: 1.2, reveal: 'rise', ease: 'out' });
  });
}

// ================================================================ the two madrasas facing each other
function madrasa(p, r, pl, kind, t0) {
  const L = pl.L, h = 17, pu0 = 15, pu1 = 35, ph = 34;
  const pp = pl.offset(1.6, kind === 'ub' ? 1 : -1); // the portal stands proud of the wall
  // the walls, far half then near half
  p.group('sides', boxOf(quad(pl, pu1 - 1, L, 0, h + 1), 6), (c) => wall(c, pl, pu1, L, h, 4), { t: t0, d: 1.0, reveal: 'rise' });
  p.group('sides', boxOf(quad(pl, 0, pu0 + 1, 0, h + 1), 6), (c) => wall(c, pl, 0, pu0, h, 4), { t: t0 + 0.4, d: 1.1, reveal: 'rise' });
  // the portal's near return, in shadow, then the portal
  const ret = [pl.map(pu0, 0), pp.map(pu0, 0), pp.map(pu0, ph), pl.map(pu0, ph)];
  p.group('sidedet', boxOf([...quad(pp, pu0 - 1, pu1 + 1, 0, ph + 2), ...ret], 8), (c) => {
    c.fillStyle = BRICK_D; pathOf(c, ret); c.fill();
    c.strokeStyle = TURQ_D; c.lineWidth = 1.5; c.beginPath();
    for (let v = 1; v < ph; v += 1.6) { const a = pl.map(pu0, v), b = pp.map(pu0, v + 0.8); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
    pishtaq(c, pp, { u0: pu0, u1: pu1, h: ph, kind }, r);
  }, { t: t0 + 1.4, d: 1.5, reveal: 'rise', ease: 'out' });
}

// ================================================================ the corner minarets, wound with tile
function minaret(c, x, y0, k, h, rad, lean = 0) {
  const y1 = y0 - h * k;
  const at = (Z) => [x + lean * Z * k, lerp(y0, y1, Z / h)];
  const wAt = (Z) => rad * k * lerp(1, 0.82, Z / h);
  // the shaft
  const left = [], right = [];
  for (let Z = 0; Z <= h; Z += h / 20) { const [cx, cy] = at(Z), w = wAt(Z); left.push([cx - w, cy]); right.push([cx + w, cy]); }
  const body = [...left, ...right.reverse()];
  c.fillStyle = BRICK; pathOf(c, body); c.fill();
  c.save(); pathOf(c, body); c.clip();
  // two families of helices make the diamond lattice; only the front halves show
  c.lineCap = 'round';
  for (const [dir, col, lw] of [[1, TURQ, 0.42], [-1, LAPIS, 0.32]]) {
    c.strokeStyle = col; c.lineWidth = Math.max(1, lw * k); c.beginPath();
    for (let j = 0; j < 10; j++) {
      let on = false;
      for (let Z = 1.2; Z <= h - 4; Z += 0.25) {
        const th = j * Math.PI / 5 + dir * Z * 0.42, [cx, cy] = at(Z), w = wAt(Z);
        if (Math.cos(th) > 0) { const px = cx + Math.sin(th) * w; on ? c.lineTo(px, cy) : c.moveTo(px, cy); on = true; } else on = false;
      }
    }
    c.stroke();
  }
  // shading: darker on the right, a lit edge on the left
  c.fillStyle = 'rgba(70,35,30,0.28)'; c.beginPath(); for (let Z = 0; Z <= h; Z += h / 20) { const [cx, cy] = at(Z), w = wAt(Z); c.rect(cx + w * 0.35, cy - h * k / 20 - 1, w * 0.7, h * k / 20 + 2); } c.fill();
  c.fillStyle = 'rgba(255,225,170,0.25)'; c.beginPath(); for (let Z = 0; Z <= h; Z += h / 20) { const [cx, cy] = at(Z), w = wAt(Z); c.rect(cx - w * 0.85, cy - h * k / 20 - 1, w * 0.25, h * k / 20 + 2); } c.fill();
  c.restore();
  // bands: a white marble foot, a lapis band low and one under the gallery
  const band = (Z0, Z1, col) => { const [ca, ya] = at(Z0), [cb, yb] = at(Z1); c.fillStyle = col; pathOf(c, [[ca - wAt(Z0), ya], [ca + wAt(Z0), ya], [cb + wAt(Z1), yb], [cb - wAt(Z1), yb]]); c.fill(); };
  band(0, 1.2, WHITE); band(h - 6, h - 4.6, LAPIS); band(h - 4.6, h - 4.2, WHITE);
  // the gallery: a ring of honeycomb corbels, then a short lantern with a cap
  const [gx, gy] = at(h - 4.2), gw = wAt(h - 4.2) * 1.3;
  c.fillStyle = BRICK_L; c.beginPath(); c.moveTo(gx - wAt(h - 4.2), gy); c.lineTo(gx - gw, gy - k * 1.6); c.lineTo(gx + gw, gy - k * 1.6); c.lineTo(gx + wAt(h - 4.2), gy); c.fill();
  c.fillStyle = TURQ; for (let i = -3; i <= 3; i++) { c.beginPath(); c.arc(gx + i * gw / 3.6, gy - k * 0.7, gw / 9, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = LAPIS; c.fillRect(gx - gw, gy - k * 2.0, gw * 2, k * 0.45);
  const [lx, ly] = at(h);
  const lw = wAt(h) * 0.85;
  c.fillStyle = BRICK_L; c.fillRect(lx - lw, ly, lw * 2, gy - k * 2.0 - ly);
  c.fillStyle = NICHE; for (let i = -1; i <= 1; i++) c.fillRect(lx + i * lw * 0.6 - lw * 0.15, ly + k * 0.5, lw * 0.3, (gy - k * 2.0 - ly) - k);
  c.fillStyle = TURQ; c.beginPath(); c.moveTo(lx - lw * 1.15, ly); c.quadraticCurveTo(lx - lw, ly - lw * 1.3, lx, ly - lw * 1.5); c.quadraticCurveTo(lx + lw, ly - lw * 1.3, lx + lw * 1.15, ly); c.closePath(); c.fill();
}
function minarets(p, r) {
  // far corners first, then the near ones; Ulugh Beg's near minaret leans a little
  const list = [
    [UB, SIDE_L, 30, 2.3, 0, 6.6],
    [SD, SIDE_L, 30, 2.3, 0, 6.9],
    [UB, 0, 33, 2.5, -0.006, 7.3],
    [SD, 0, 33, 2.5, 0, 7.7],
  ];
  list.forEach(([pl, u, h, rad, lean, t]) => {
    const k = pl.k(u), [x, y0] = pl.map(u, 0), y1 = y0 - (h + 2) * k - rad * k * 2;
    p.group('minarets', { x: x - rad * k * 1.6 - 40, y: y1 - 10, w: rad * k * 3.2 + 80, h: y0 - y1 + 20 }, (c) => minaret(c, x, y0, k, h, rad, lean), { t, d: 1.6, reveal: 'rise', ease: 'out' });
  });
}

// ================================================================ people crossing the square
function folk(p, r) {
  const people = [];
  for (let i = 0; i < 26; i++) {
    const s = Math.exp(r.range(Math.log(40), Math.log(98))), X = r.range(-14, 14);
    people.push([X, s, r.pick([LAPIS, TURQ, WHITE, TIGER, GREEN, '#8a3a4a', GOLD]), r.chance(0.5), r.chance(0.4)]);
  }
  people.sort((a, b) => b[1] - a[1]);
  p.group('folk', { x: 300, y: VY, w: 1000, h: 400 }, (c) => {
    for (const [X, s, col, robe, cap] of people) {
      const k = kAt(s), [x, y] = P(X, s, 0);
      c.save(); c.translate(x, y); c.scale(k, -k);
      // a figure 1.7 tall: a long striped robe or a short coat, a round cap
      c.fillStyle = INK; c.fillRect(-0.16, 0, 0.12, 0.6); c.fillRect(0.04, 0, 0.12, 0.6);
      c.fillStyle = col;
      if (robe) { c.beginPath(); c.moveTo(-0.22, 1.42); c.lineTo(0.22, 1.42); c.lineTo(0.32, 0.25); c.lineTo(-0.32, 0.25); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(-0.12, 0.3, 0.05, 1.1); c.fillRect(0.06, 0.3, 0.05, 1.1); }
      else { c.fillRect(-0.21, 0.6, 0.42, 0.84); }
      c.fillStyle = '#b07850'; c.beginPath(); c.arc(0, 1.56, 0.13, 0, Math.PI * 2); c.fill();
      if (cap) { c.fillStyle = INK; c.fillRect(-0.13, 1.6, 0.26, 0.1); }
      // a long shadow toward the east
      c.fillStyle = 'rgba(80,40,30,0.25)'; c.beginPath(); c.moveTo(-0.15, 0); c.lineTo(1.6, 0.05); c.lineTo(1.6, -0.05); c.lineTo(0.15, 0); c.fill();
      c.restore();
    }
  }, { t: 9.4, d: 0.9, reveal: 'fade' });
  // a row of young plane trees along each side of the square
  const trees = [];
  for (const sgn of [-1, 1]) for (let s = 38; s < 92; s += 9) trees.push([sgn * 15.5, s]);
  trees.sort((a, b) => b[1] - a[1]);
  p.group('folk', { x: PX0, y: 800, w: PX1 - PX0, h: 600 }, (c) => {
    for (const [X, s] of trees) {
      const k = kAt(s), [x, y] = P(X, s, 0);
      c.fillStyle = BRICK_D; c.fillRect(x - k * 0.15, y - k * 3, k * 0.3, k * 3);
      c.fillStyle = GREEN; c.beginPath(); c.ellipse(x, y - k * 4.2, k * 1.6, k * 1.9, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = shade(GREEN, 0.75); c.beginPath(); c.ellipse(x + k * 0.5, y - k * 3.9, k * 1.0, k * 1.5, 0, 0, Math.PI * 2); c.fill();
    }
  }, { t: 9.0, d: 0.8, reveal: 'rise' });
}

// ================================================================ what moves: swifts round the minarets, stars, lamps
function lives(p, r) {
  const swifts = [];
  for (let i = 0; i < 14; i++) swifts.push([r.range(260, 1340), r.range(220, 640), r() * 6, r.range(0.25, 0.6), r.range(0.7, 1.3)]);
  p.live('live', {
    t: 9.8, d: 0.8, reveal: 'fade', box: { x: PX0, y: PY0, w: PX1 - PX0, h: 700 },
    draw: (c, time) => {
      c.fillStyle = INK; c.beginPath();
      for (const [x, y, ph, sp, s] of swifts) {
        const a = time * sp + ph, bx = x + Math.cos(a) * 120, by = y + Math.sin(a * 1.4) * 40, f = Math.sin(time * 9 + ph * 4) * 3 * s;
        // a swift: two scythe wings and a forked tail
        c.moveTo(bx - 16 * s, by - 2 * s + f); c.quadraticCurveTo(bx - 6 * s, by - 3 * s, bx, by); c.quadraticCurveTo(bx + 6 * s, by - 3 * s, bx + 16 * s, by - 2 * s + f);
        c.quadraticCurveTo(bx + 6 * s, by + 1 * s, bx + 2 * s, by + 4 * s); c.lineTo(bx, by + 8 * s); c.lineTo(bx - 2 * s, by + 4 * s); c.quadraticCurveTo(bx - 6 * s, by + 1 * s, bx - 16 * s, by - 2 * s + f);
      }
      c.fill();
    },
  });
  const tw = [];
  for (let i = 0; i < 24; i++) tw.push([r.range(PX0, PX1), r.range(PY0 + 10, 460), r() * 6, r.range(1, 2.5)]);
  p.live('live', {
    t: 10.2, d: 0.8, reveal: 'fade', box: { x: PX0, y: PY0, w: PX1 - PX0, h: 380 },
    draw: (c, time) => {
      c.fillStyle = WHITE; c.beginPath();
      for (const [x, y, ph, sp] of tw) { const a = Math.sin(time * sp + ph); if (a < 0.4) continue; const s = 2 + 3 * a; c.moveTo(x - s, y); c.lineTo(x, y - 0.6); c.lineTo(x + s, y); c.lineTo(x, y + 0.6); c.closePath(); c.moveTo(x, y - s); c.lineTo(x + 0.6, y); c.lineTo(x, y + s); c.lineTo(x - 0.6, y); c.closePath(); }
      c.fill();
    },
  });
}

// ================================================================ the name, in classical capitals on the lapis panel
function title(p) {
  p.group('title', { x: PX0, y: TY0, w: PX1 - PX0, h: TY1 - TY0 }, (c) => {
    c.fillStyle = LAPIS; c.fillRect(PX0, TY0, PX1 - PX0, TY1 - TY0);
    // a scatter of small stars across the panel's ends
    c.fillStyle = mix(LAPIS, TURQ, 0.35);
    for (const x of [PX0 + 80, PX1 - 80]) { pathOf(c, starPts(x, (TY0 + TY1) / 2 - 20, 46, 30)); c.fill(); }
    c.fillStyle = GOLD;
    for (const x of [PX0 + 80, PX1 - 80]) { pathOf(c, starPts(x, (TY0 + TY1) / 2 - 20, 18, 12)); c.fill(); }
  }, { t: 10.6, d: 0.8, reveal: 'fade' });
  p.type('title', 'SAMARKAND', W / 2, TY0 + 182, { size: 170, family: '"Cormorant SC"', weight: 700, color: GOLD, shadow: LAPIS_D, sx: 4, sy: 5, track: 0.1, align: 'center', fit: PX1 - PX0 - 300, t: 11.0, gap: 0.13, d: 0.7, reveal: 'press' });
  p.group('title', { x: PX0 + 150, y: TY0 + 200, w: PX1 - PX0 - 300, h: 30 }, (c) => {
    c.fillStyle = TURQ; c.fillRect(PX0 + 200, TY0 + 212, PX1 - PX0 - 400, 3);
    c.fillStyle = GOLD; pathOf(c, [[W / 2, TY0 + 204], [W / 2 + 10, TY0 + 213.5], [W / 2, TY0 + 223], [W / 2 - 10, TY0 + 213.5]]); c.fill();
  }, { t: 12.2, d: 0.6, reveal: 'wipe' });
  p.type('title', 'THE REGISTAN · ULUGH BEG · TILYA-KORI · SHER-DOR', W / 2, TY0 + 262, { size: 30, family: '"Cormorant SC"', weight: 500, color: WHITE, track: 0.16, align: 'center', t: 12.5, gap: 0.02, d: 0.4, reveal: 'fade' });
}
