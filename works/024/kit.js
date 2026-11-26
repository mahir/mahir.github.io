// No. 024: the drawing kit the cities share. Plain geometry and small drawings
// in sheet units; each city file composes them and gives them their times.

import { W, H, rng, poly } from './print.js';

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// colors -------------------------------------------------------------------
export function hex(c) {
  if (c[0] !== '#') return c.match(/[\d.]+/g).slice(0, 3).map(Number);
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgb([r, g, b], a = 1) {
  return a >= 1 ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}
export function shade(c, k) { const v = hex(c); return rgb(v.map((x) => clamp(x * k, 0, 255))); }
export function mix(c1, c2, t) { const a = hex(c1), b = hex(c2); return rgb(a.map((x, i) => lerp(x, b[i], t))); }

// a ground seen from above at an angle -------------------------------------
// u runs across (0 straight ahead), v runs away from the viewer (0 nearest),
// z is height. Vertical lines stay vertical; everything else meets at (cx, hy).
export class Ground {
  constructor({ cx = W / 2, hy = 600, y0 = 1700, U = 1250, K = 1, eye = null } = {}) {
    Object.assign(this, { cx, hy, y0, U, K });
    this.eye = eye ?? y0 - hy; // the height (in z) at which roofs stop being seen from above
  }
  s(v) { return 1 / (1 + this.K * v); }
  y(v) { return this.hy + (this.y0 - this.hy) * this.s(v); }
  P(u, v, z = 0) { const s = this.s(v); return [this.cx + u * this.U * s, this.hy + (this.y0 - this.hy) * s - z * s]; }
  // the v at a screen y on the ground
  vAt(y) { const s = (y - this.hy) / (this.y0 - this.hy); return (1 / s - 1) / this.K; }
  uAt(x, v) { return (x - this.cx) / (this.U * this.s(v)); }
}

// a box on the ground: front face, the side that faces the middle, and the roof
// if the eye is above it. o: { u0, u1, v0, v1, z0, z1, color, side, roof, line, lw }
export function box(c, g, o) {
  const { u0, u1, v0, v1 } = o, z0 = o.z0 || 0, z1 = o.z1;
  const P = (u, v, z) => g.P(u, v, z);
  const s = g.s(v0);
  const lw = o.lw ?? Math.max(0.45, 1.3 * s);
  const line = o.line || '#1d2433';
  const faces = [];
  if (u1 < 0) faces.push([o.side || shade(o.color, 0.74), [P(u1, v0, z0), P(u1, v1, z0), P(u1, v1, z1), P(u1, v0, z1)], 'side']);
  else if (u0 > 0) faces.push([o.side || shade(o.color, 0.74), [P(u0, v0, z0), P(u0, v1, z0), P(u0, v1, z1), P(u0, v0, z1)], 'side']);
  if (z1 < g.eye) faces.push([o.roof || shade(o.color, 0.86), [P(u0, v0, z1), P(u1, v0, z1), P(u1, v1, z1), P(u0, v1, z1)], 'roof']);
  faces.push([o.color, [P(u0, v0, z0), P(u1, v0, z0), P(u1, v0, z1), P(u0, v0, z1)], 'front']);
  for (const [col, pts, kind] of faces) {
    c.fillStyle = col; poly(c, pts); c.fill();
    if (kind === 'side' && o.hatch !== false) hatchQuad(c, pts, Math.max(2.2, 4 * s), shade(col, 0.72), Math.max(0.35, 0.7 * s));
  }
  if (lw > 0) {
    c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round';
    for (const [, pts] of faces) { poly(c, pts); c.stroke(); }
  }
  return faces;
}

// vertical hatching inside a quad whose first two points are its foot
export function hatchQuad(c, q, step, color, lw) {
  const [a, b, cc, d] = q;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.floor(len / step);
  if (n < 1) return;
  c.strokeStyle = color; c.lineWidth = lw;
  c.beginPath();
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x0 = lerp(a[0], b[0], t), y0 = lerp(a[1], b[1], t);
    const x1 = lerp(d[0], cc[0], t), y1 = lerp(d[1], cc[1], t);
    c.moveTo(x0, y0); c.lineTo(x1, y1);
  }
  c.stroke();
}

// windows on a front face: a grid in (u, z), as one path
export function windows(c, g, o) {
  const { u0, u1, v0, z0 = 0, z1, color = '#2b3242' } = o;
  const s = g.s(v0);
  const story = o.story ?? 9;
  const rows = Math.floor((z1 - z0 - (o.top ?? story * 0.6)) / story);
  const wpx = (u1 - u0) * g.U * s;
  const cols = o.cols ?? Math.max(1, Math.round(wpx / Math.max(3, (o.pitch ?? 7) * s)));
  if (rows < 1 || wpx < 3) return;
  const fx = o.fx ?? 0.45, fz = o.fz ?? 0.55;
  const du = (u1 - u0) / cols, mu = du * (1 - fx) / 2;
  const [xa, ya] = g.P(u0, v0, 0);
  const sx = g.U * s;
  c.fillStyle = color;
  c.beginPath();
  const tiny = story * fz * s < 1.1 || du * fx * sx < 1.1;
  for (let r = 0; r < rows; r++) {
    const zb = z0 + (o.base ?? 0) + r * story + story * (1 - fz) / 2;
    if (zb + story * fz > z1 - 2) break;
    const y = ya - (zb + story * fz) * s, h = story * fz * s;
    if (tiny) { c.rect(xa + mu * sx, y, (u1 - u0 - 2 * mu) * sx, Math.max(0.6, h)); continue; }
    for (let k = 0; k < cols; k++) {
      if (o.skip && o.skip(r, k)) continue;
      c.rect(xa + (k * du + mu) * sx, y, du * fx * sx, h);
    }
  }
  c.fill();
}

// clouds --------------------------------------------------------------------
// an engraved cumulus: a row of bumps over a flat foot. Returns the outline.
export function cloudShape(r, x, y, w, h) {
  const pts = [];
  const n = Math.max(3, Math.round(w / (h * 0.75)));
  const centers = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const lift = Math.sin(t * Math.PI) ** 0.7;
    centers.push([x + t * w + r.range(-0.08, 0.08) * w / n, y - h * (0.25 + 0.55 * lift) * r.range(0.8, 1.1), (w / n) * r.range(0.55, 0.75) * (0.7 + 0.4 * lift)]);
  }
  pts.push([x, y]);
  // up the left, over the bumps, down the right
  for (let i = 0; i < n; i++) {
    const [cx, cy, rr] = centers[i];
    const a0 = i === 0 ? Math.PI * 0.95 : Math.PI * 1.08, a1 = i === n - 1 ? Math.PI * 2.05 : Math.PI * 1.92;
    for (let k = 0; k <= 10; k++) {
      const a = lerp(a0, a1, k / 10);
      pts.push([cx + Math.cos(a) * rr, Math.min(y, cy + Math.sin(a) * rr)]);
    }
  }
  pts.push([x + w, y]);
  return pts;
}

// a cloud as a heap of round puffs on a flat foot: stroke every puff, then fill
// them all, so only the outside edge keeps its line
export function cloudPuffs(r, x, y, w, h) {
  const n = Math.max(3, Math.round(w / (h * 0.7)));
  const puffs = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, lift = Math.sin(t * Math.PI) ** 0.8;
    const rad = (w / n) * r.range(0.62, 0.82) * (0.75 + 0.45 * lift);
    puffs.push([x + t * w + r.range(-0.1, 0.1) * w / n, y - h * 0.18 - (h * 0.55 * lift - rad * 0.2) * r.range(0.85, 1.1), rad]);
  }
  // a second, higher row in the middle
  for (let i = 0; i < Math.max(1, n - 3); i++) {
    const t = 0.3 + 0.4 * ((i + 0.5) / Math.max(1, n - 3));
    puffs.push([x + t * w, y - h * r.range(0.65, 0.85), (w / n) * r.range(0.6, 0.8)]);
  }
  return { puffs, x, y, w, h };
}
export function drawCloud(c, cl, o) {
  const { puffs, x, y, w } = cl;
  c.save();
  c.beginPath(); c.rect(x - w, y - cl.h * 3, w * 3, cl.h * 3); c.clip();
  c.strokeStyle = o.line; c.lineWidth = o.lw * 2;
  for (const [cx, cy, rr] of puffs) { c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.stroke(); }
  c.fillStyle = o.fill;
  for (const [cx, cy, rr] of puffs) { c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.fill(); }
  // the shading: lines across the lower part of the heap
  c.beginPath(); for (const [cx, cy, rr] of puffs) { c.moveTo(cx + rr, cy); c.arc(cx, cy, rr, 0, Math.PI * 2); } c.clip();
  c.strokeStyle = o.hatch; c.lineWidth = o.hlw || 1;
  c.beginPath();
  const top = y - cl.h * (o.cover ?? 0.45);
  for (let yy = y - 2; yy > top; yy -= o.step || 5.5) {
    const k = (y - yy) / (y - top);
    c.moveTo(x - w * 0.2 + k * w * 0.18, yy); c.lineTo(x + w * 1.2 - k * w * 0.22, yy);
  }
  c.stroke();
  c.restore();
  // the flat foot
  c.strokeStyle = o.line; c.lineWidth = o.lw;
  c.beginPath(); c.moveTo(puffs[0][0] - puffs[0][2] * 0.9, y); c.lineTo(puffs[puffs.length - 1][0] + puffs[puffs.length - 1][2], y);
  let x0 = Infinity, x1 = -Infinity;
  for (let i = 0; i < puffs.length; i++) { x0 = Math.min(x0, puffs[i][0] - puffs[i][2]); x1 = Math.max(x1, puffs[i][0] + puffs[i][2]); }
  c.beginPath(); c.moveTo(x0 + 4, y); c.lineTo(x1 - 4, y); c.stroke();
}
export function cloudBox(cl) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
  for (const [cx, cy, rr] of cl.puffs) { x0 = Math.min(x0, cx - rr); x1 = Math.max(x1, cx + rr); y0 = Math.min(y0, cy - rr); }
  return { x: x0 - 6, y: y0 - 6, w: x1 - x0 + 12, h: cl.y - y0 + 12 };
}

// lines inside a shape, made by clipping: horizontal hatching, denser low down
export function hatchIn(c, shape, o) {
  const b = shape.box;
  c.save();
  poly(c, shape.pts); c.clip();
  c.strokeStyle = o.color; c.lineWidth = o.lw || 1;
  c.beginPath();
  const r = rng(o.seed || 3);
  for (let y = b.y + b.h; y > b.y + b.h * (1 - (o.cover ?? 0.5)); y -= o.step || 6) {
    const k = (b.y + b.h - y) / (b.h * (o.cover ?? 0.5));
    const x0 = b.x + r() * b.w * 0.25 * k, x1 = b.x + b.w - r() * b.w * 0.25 * k;
    c.moveTo(x0, y); c.lineTo(x1, y);
  }
  c.stroke();
  c.restore();
}

// trees: a round crown from a few overlapping circles
export function tree(c, x, y, rad, o = {}) {
  const r = o.r || rng(Math.floor(x * 13 + y * 7));
  const col = o.color || '#5f8a4e', dark = o.dark || shade(col, 0.72);
  if (o.trunk !== false) { c.fillStyle = o.trunkColor || '#5a4636'; c.fillRect(x - rad * 0.1, y - rad * 0.4, rad * 0.2, rad * 0.5); }
  const blobs = [];
  const n = o.n || 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.6;
    blobs.push([x + Math.cos(a) * rad * 0.45, y - rad * 0.95 + Math.sin(a) * rad * 0.35, rad * r.range(0.45, 0.62)]);
  }
  blobs.push([x, y - rad * 1.05, rad * 0.6]);
  c.fillStyle = dark;
  for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx + br * 0.12, by + br * 0.14, br, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = col;
  for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx - br * 0.1, by - br * 0.08, br * 0.86, 0, Math.PI * 2); c.fill(); }
  if (o.line) {
    c.strokeStyle = o.line; c.lineWidth = o.lw || 0.8;
    for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx, by, br, Math.PI * 0.9, Math.PI * 2.1); c.stroke(); }
  }
}

// gulls: a small M
export function gull(c, x, y, s, flap = 0, color = '#1d2433') {
  const w = 9 * s, h = (2.6 + flap * 2.2) * s;
  c.strokeStyle = color; c.lineWidth = 1.3 * s; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - w, y - h * 0.2);
  c.quadraticCurveTo(x - w * 0.5, y - h * 1.2, x, y);
  c.quadraticCurveTo(x + w * 0.5, y - h * 1.2, x + w, y - h * 0.2);
  c.stroke();
}

// a sailboat, its foot on the water at (x, y)
export function sailboat(c, x, y, s, o = {}) {
  const ink = o.line || '#1d2433';
  c.lineJoin = 'round';
  c.fillStyle = o.hull || '#2c3446';
  poly(c, [[x - 26 * s, y - 7 * s], [x + 30 * s, y - 7 * s], [x + 20 * s, y + 2 * s], [x - 18 * s, y + 2 * s]]); c.fill();
  c.fillStyle = o.sail || '#f6efdc';
  poly(c, [[x + 2 * s, y - 72 * s], [x + 2 * s, y - 11 * s], [x + 30 * s, y - 11 * s]]); c.fill();
  poly(c, [[x - 2 * s, y - 62 * s], [x - 2 * s, y - 11 * s], [x - 24 * s, y - 11 * s]]); c.fill();
  c.strokeStyle = ink; c.lineWidth = 1.2 * s;
  poly(c, [[x + 2 * s, y - 72 * s], [x + 2 * s, y - 11 * s], [x + 30 * s, y - 11 * s]]); c.stroke();
  poly(c, [[x - 2 * s, y - 62 * s], [x - 2 * s, y - 11 * s], [x - 24 * s, y - 11 * s]]); c.stroke();
  c.beginPath(); c.moveTo(x, y - 76 * s); c.lineTo(x, y - 7 * s); c.stroke();
  // shading on the sails
  c.lineWidth = 0.7 * s; c.strokeStyle = o.shadeLine || 'rgba(29,36,51,.45)';
  c.beginPath();
  for (let i = 1; i < 6; i++) { const yy = y - 11 * s - i * 9 * s; c.moveTo(x - 2 * s - (i < 6 ? 22 - i * 3.6 : 0) * s, y - 11 * s - i * 8 * s); c.lineTo(x - 2 * s, yy); }
  c.stroke();
}

// short wave strokes across a band of water seen at an angle
export function waveLines(r, g, o) {
  const lines = [];
  const { y0, y1, x0 = 0, x1 = W, density = 1 } = o;
  for (let y = y0; y < y1;) {
    const v = g.vAt(y), s = g.s(v);
    const step = Math.max(3, 15 * s) / density;
    const n = Math.round(((x1 - x0) / (60 * s + 10)) * density * 1.4);
    for (let i = 0; i < n; i++) {
      const x = r.range(x0, x1);
      if (o.skip && o.skip(x, y)) continue;
      const L = r.range(10, 30) * s + 3;
      const a = r.range(1.2, 3.2) * s;
      const yy = y + r.range(-step * 0.4, step * 0.4);
      lines.push([[x - L, yy], [x - L * 0.5, yy - a], [x, yy], [x + L * 0.5, yy - a * 0.6], [x + L * 0.8, yy]]);
    }
    y += step;
  }
  return lines;
}

export { rng, poly, W, H };
