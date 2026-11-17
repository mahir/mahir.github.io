// geom.js: vectors, transforms, the Model and its solids, face decoration.
//
// World: meters, right-handed, +X forward, +Y left, +Z up, ground at z = 0.
// The public API of the Model is documented at the top of kit.js; this file holds the
// machinery. Everything is built in world space at creation time (the current transform
// is applied to every vertex), so the HLR pass in hlr.js only sees world geometry.

export const D2R = Math.PI / 180;

// ---------------------------------------------------------------- vectors (plain arrays)
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// ---------------------------------------------------------------- 3x4 affine matrices
// [a00 a01 a02 a10 a11 a12 a20 a21 a22 tx ty tz], p' = A p + t
export const IDENT = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
export function mmul(A, B) {
  const r = new Array(12);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) r[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
    r[9 + i] = A[i * 3] * B[9] + A[i * 3 + 1] * B[10] + A[i * 3 + 2] * B[11] + A[9 + i];
  }
  return r;
}
export const apply = (A, p) => [
  A[0] * p[0] + A[1] * p[1] + A[2] * p[2] + A[9],
  A[3] * p[0] + A[4] * p[1] + A[5] * p[2] + A[10],
  A[6] * p[0] + A[7] * p[1] + A[8] * p[2] + A[11],
];
export const applyDir = (A, p) => [
  A[0] * p[0] + A[1] * p[1] + A[2] * p[2],
  A[3] * p[0] + A[4] * p[1] + A[5] * p[2],
  A[6] * p[0] + A[7] * p[1] + A[8] * p[2],
];
export const det = (A) =>
  A[0] * (A[4] * A[8] - A[5] * A[7]) - A[1] * (A[3] * A[8] - A[5] * A[6]) + A[2] * (A[3] * A[7] - A[4] * A[6]);
// inverse transpose of the linear part, for normals
export function normalMat(A) {
  const d = det(A) || 1;
  const c = [
    (A[4] * A[8] - A[5] * A[7]), -(A[3] * A[8] - A[5] * A[6]), (A[3] * A[7] - A[4] * A[6]),
    -(A[1] * A[8] - A[2] * A[7]), (A[0] * A[8] - A[2] * A[6]), -(A[0] * A[7] - A[1] * A[6]),
    (A[1] * A[5] - A[2] * A[4]), -(A[0] * A[5] - A[2] * A[3]), (A[0] * A[4] - A[1] * A[3]),
  ];
  return [c[0] / d, c[1] / d, c[2] / d, c[3] / d, c[4] / d, c[5] / d, c[6] / d, c[7] / d, c[8] / d, 0, 0, 0];
}
export const mTranslate = (x, y, z) => [1, 0, 0, 0, 1, 0, 0, 0, 1, x, y, z];
export const mScale = (x, y, z) => [x, 0, 0, 0, y, 0, 0, 0, z, 0, 0, 0];
export function mRotate(axis, deg) {
  if (axis === 'x') axis = [1, 0, 0]; else if (axis === 'y') axis = [0, 1, 0]; else if (axis === 'z') axis = [0, 0, 1];
  const [x, y, z] = norm(axis), a = deg * D2R, c = Math.cos(a), s = Math.sin(a), t = 1 - c;
  return [t * x * x + c, t * x * y - s * z, t * x * z + s * y,
    t * x * y + s * z, t * y * y + c, t * y * z - s * x,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0, 0, 0];
}
// columns are the images of local x, y, z; origin o
export const mBasis = (o, X, Y, Z) => [X[0], Y[0], Z[0], X[1], Y[1], Z[1], X[2], Y[2], Z[2], o[0], o[1], o[2]];

// ---------------------------------------------------------------- seeded random
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(...xs) {
  let h = 2166136261 >>> 0;
  for (const x of xs) {
    const s = String(x);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    h ^= 0x9e37; h = Math.imul(h, 2246822519) >>> 0;
  }
  return h >>> 0;
}

// ---------------------------------------------------------------- view
// eye direction e (from the scene toward the viewer), screen right r, screen up u
export function viewBasis(az, el) {
  const a = az * D2R, b = el * D2R;
  const e = [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)];
  const r = norm(cross([0, 0, 1], e));
  const u = cross(e, r);
  return { e, r, u };
}

// ---------------------------------------------------------------- 2D helpers
export function polyArea2(p) { // p: [[x,y],...] signed area (CCW > 0)
  let a = 0;
  for (let i = 0, n = p.length; i < n; i++) { const q = p[i], w = p[(i + 1) % n]; a += q[0] * w[1] - w[0] * q[1]; }
  return a / 2;
}
// ear clipping, returns triangles as index triples into p (p is CCW or CW)
export function triangulate(p) {
  const n = p.length;
  if (n < 3) return [];
  const idx = [];
  for (let i = 0; i < n; i++) idx.push(i);
  if (polyArea2(p) < 0) idx.reverse();
  const tris = [];
  const isConvex = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 1e-12;
  const inTri = (q, a, b, c) => {
    const d1 = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
    const d2 = (c[0] - b[0]) * (q[1] - b[1]) - (c[1] - b[1]) * (q[0] - b[0]);
    const d3 = (a[0] - c[0]) * (q[1] - c[1]) - (a[1] - c[1]) * (q[0] - c[0]);
    return d1 >= -1e-12 && d2 >= -1e-12 && d3 >= -1e-12;
  };
  let guard = 0;
  while (idx.length > 3 && guard++ < 5000) {
    let cut = false;
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length];
      const a = p[i0], b = p[i1], c = p[i2];
      if (!isConvex(a, b, c)) continue;
      let ok = true;
      for (const j of idx) {
        if (j === i0 || j === i1 || j === i2) continue;
        if (inTri(p[j], a, b, c)) { ok = false; break; }
      }
      if (!ok) continue;
      tris.push([i0, i1, i2]);
      idx.splice(k, 1);
      cut = true;
      break;
    }
    if (!cut) { // degenerate: fan the rest
      for (let k = 1; k < idx.length - 1; k++) tris.push([idx[0], idx[k], idx[k + 1]]);
      return tris;
    }
  }
  if (idx.length === 3) tris.push([idx[0], idx[1], idx[2]]);
  return tris;
}

// Hatch lines clipped to a set of polygons (even-odd: the first is the region, the
// others are holes). polys: [[[x,y],...], ...]. angle in degrees (0 = along +x).
// gapAt(s, s0, s1) -> gap in the same units for the line at offset s.
// Returns flat [x0,y0,x1,y1, ...].
export function hatch2D(polys, angle, gapAt, maxLines = 600) {
  const A = angle * D2R, dx = Math.cos(A), dy = Math.sin(A);
  const mx = -dy, my = dx;
  const edges = [];
  let smin = Infinity, smax = -Infinity;
  for (const p of polys) {
    for (let i = 0, n = p.length; i < n; i++) {
      const a = p[i], b = p[(i + 1) % n];
      const sa = a[0] * mx + a[1] * my, sb = b[0] * mx + b[1] * my;
      const ta = a[0] * dx + a[1] * dy, tb = b[0] * dx + b[1] * dy;
      edges.push(sa, ta, sb, tb);
      if (sa < smin) smin = sa; if (sa > smax) smax = sa;
    }
  }
  const out = [];
  if (!(smax > smin)) return out;
  let s = smin + gapAt(smin, smin, smax) * 0.5;
  const xs = [];
  let count = 0;
  while (s < smax && count++ < maxLines) {
    xs.length = 0;
    for (let i = 0; i < edges.length; i += 4) {
      const sa = edges[i], ta = edges[i + 1], sb = edges[i + 2], tb = edges[i + 3];
      if ((sa <= s && sb > s) || (sb <= s && sa > s)) xs.push(ta + (tb - ta) * (s - sa) / (sb - sa));
    }
    if (xs.length >= 2) {
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const t0 = xs[k], t1 = xs[k + 1];
        if (t1 - t0 < 1e-9) continue;
        out.push(t0 * dx + s * mx, t0 * dy + s * my, t1 * dx + s * mx, t1 * dy + s * my);
      }
    }
    const g = gapAt(s, smin, smax);
    if (!(g > 0)) break;
    s += g;
  }
  return out;
}

// keep the parts of 2D segments (flat x0,y0,x1,y1,...) inside a simple polygon
export function clipSegsToPoly(segs, poly, outside = false) {
  const out = [];
  const n = poly.length;
  const ts = [];
  for (let k = 0; k < segs.length; k += 4) {
    const x0 = segs[k], y0 = segs[k + 1], x1 = segs[k + 2], y1 = segs[k + 3];
    const dx = x1 - x0, dy = y1 - y0;
    ts.length = 0;
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n];
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-14) continue;
      const t = ((a[0] - x0) * ey - (a[1] - y0) * ex) / den;
      const u = ((a[0] - x0) * dy - (a[1] - y0) * dx) / den;
      if (u >= 0 && u < 1 && t > 0 && t < 1) ts.push(t);
    }
    ts.push(0, 1);
    ts.sort((p, q) => p - q);
    for (let i = 0; i + 1 < ts.length; i++) {
      const ta = ts[i], tb = ts[i + 1];
      if (tb - ta < 1e-9) continue;
      const tm = (ta + tb) / 2;
      if (pointInPoly(x0 + dx * tm, y0 + dy * tm, poly) === outside) continue;
      out.push(x0 + dx * ta, y0 + dy * ta, x0 + dx * tb, y0 + dy * tb);
    }
  }
  return out;
}
export function pointInPoly(x, y, p) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
  }
  return c;
}

export function circlePts(cx, cy, rx, ry, n, rot = 0, a0 = 0, a1 = 360) {
  const out = [];
  const full = Math.abs(a1 - a0) >= 360 - 1e-9;
  const m = full ? n : n + 1;
  const cr = Math.cos(rot * D2R), sr = Math.sin(rot * D2R);
  for (let i = 0; i < m; i++) {
    const a = (a0 + (a1 - a0) * i / n) * D2R;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return out;
}

// rect [x0,y0,x1,y1] or polygon [[x,y],...] -> polygon
export function toPoly(r) {
  if (typeof r[0] === 'number') {
    const [x0, y0, x1, y1] = r;
    return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  }
  return r;
}

// ---------------------------------------------------------------- the Model
let FONT = null;
export function setFont(fn) { FONT = fn; }

export class Model {
  constructor({ rng, px = 0, font = null } = {}) {
    this.rng = rng || mulberry32(1);
    this.px = px;                 // meters per px on the sheet (0 in the measuring pass)
    this.decorOn = px > 0;
    this.font = font || FONT;
    this.T = IDENT.slice();
    this.solids = [];
    this.decor = [];              // {pts: Float64Array xyz, gid, w, pass, dash, nrm?}
    this.lines = [];              // free 3D polylines {pts, w, pass, dash, occlude, part}
    this.callouts = [];
    this.parts = [];
    this.curPart = -1;
    this.nFaces = 0;
    this.faceTable = [];          // gid -> [solid, faceIndex]
    this.info = {};               // free slot for classes and the fleet
    this.setView(45, 35);
  }
  get light() { const v = this.view; return norm(add(add(mul(v.r, -0.6), mul(v.u, 0.7)), mul(v.e, 0.4))); }

  // -------------------------------------------------- random helpers
  r(a = 0, b = 1) { return a + (b - a) * this.rng(); }
  ri(a, b) { return Math.floor(a + (b - a + 1) * this.rng()); }
  chance(p) { return this.rng() < p; }
  pick(arr) { return arr[Math.floor(this.rng() * arr.length)]; }
  wpick(pairs) { // [[weight, value], ...] or {value: weight}
    if (!Array.isArray(pairs)) pairs = Object.entries(pairs).map(([k, w]) => [w, k]);
    let t = 0;
    for (const p of pairs) t += p[0];
    let x = this.rng() * t;
    for (const p of pairs) { x -= p[0]; if (x <= 0) return p[1]; }
    return pairs[pairs.length - 1][1];
  }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // -------------------------------------------------- view and paper scale
  setView(az, el) {
    this.view = { az, el, ...viewBasis(az, el) };
    return this;
  }
  get ppm() { return this.px > 0 ? 1 / this.px : 0; }
  // true when a feature of this size (meters) would come out under minPx on paper
  tiny(m, minPx = 1.5) { return this.decorOn && m / this.px < minPx; }
  // screen vector (px) of a world direction, in the decor pass
  sv(d) { const v = this.view; const k = this.ppm; return [dot(d, v.r) * k, -dot(d, v.u) * k]; }

  // -------------------------------------------------- transforms
  push(M, fn) {
    const old = this.T;
    this.T = mmul(old, M);
    try { return fn(); } finally { this.T = old; }
  }
  at(x, y, z, fn) { return this.push(mTranslate(x, y, z), fn); }
  rot(axis, deg, fn) { return this.push(mRotate(axis, deg), fn); }
  rx(deg, fn) { return this.push(mRotate('x', deg), fn); }
  ry(deg, fn) { return this.push(mRotate('y', deg), fn); }
  rz(deg, fn) { return this.push(mRotate('z', deg), fn); }
  scale(sx, sy, sz, fn) { return this.push(mScale(sx, sy, sz), fn); }
  // {at:[x,y,z], rz, ry, rx, s:[sx,sy,sz] | s} applied as T * Rz * Ry * Rx * S
  with(o, fn) {
    let m = IDENT.slice();
    if (o.at) m = mmul(m, mTranslate(o.at[0], o.at[1], o.at[2] || 0));
    if (o.rz) m = mmul(m, mRotate('z', o.rz));
    if (o.ry) m = mmul(m, mRotate('y', o.ry));
    if (o.rx) m = mmul(m, mRotate('x', o.rx));
    if (o.s != null) { const s = typeof o.s === 'number' ? [o.s, o.s, o.s] : o.s; m = mmul(m, mScale(s[0], s[1], s[2])); }
    return this.push(m, fn);
  }
  // runs fn(1) as is and fn(-1) mirrored across the XZ plane (y -> -y)
  mirrorY(fn) {
    const a = fn(1);
    const b = this.push(mScale(1, -1, 1), () => fn(-1));
    return [a, b];
  }
  mirrorX(fn) {
    const a = fn(1);
    const b = this.push(mScale(-1, 1, 1), () => fn(-1));
    return [a, b];
  }
  // n copies rotated about local z: fn(i, angleDeg)
  around(n, fn, start = 0) {
    const out = [];
    for (let i = 0; i < n; i++) { const a = start + 360 * i / n; out.push(this.rz(a, () => fn(i, a))); }
    return out;
  }
  // local frame with origin a, +x toward b, +z as close to local up as possible; fn(length)
  along(a, b, fn, up = [0, 0, 1]) {
    const d = sub(b, a), L = len(d);
    const X = L > 0 ? mul(d, 1 / L) : [1, 0, 0];
    let Z = sub(up, mul(X, dot(up, X)));
    if (len(Z) < 1e-6) { const alt = Math.abs(X[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]; Z = sub(alt, mul(X, dot(alt, X))); }
    Z = norm(Z);
    const Y = cross(Z, X);
    return this.push(mBasis(a, X, Y, Z), () => fn(L));
  }
  // frame on a face: origin at face point (x, y), +x out of the face, +y along the face's
  // u (to the right seen from outside), +z along the face's v (up on walls)
  onFace(f, x, y, fn, lift = 0) {
    const o = f.P(x, y);
    const n = f.n;
    const W = mBasis(add(o, mul(n, lift)), n, f.u, f.v);
    const old = this.T;
    this.T = W;
    try { return fn(); } finally { this.T = old; }
  }
  // world point of a local point
  W(p) { return apply(this.T, p); }
  // run fn in world coordinates
  world(fn) { const old = this.T; this.T = IDENT.slice(); try { return fn(); } finally { this.T = old; } }

  // -------------------------------------------------- parts and callouts
  part(name, fn) {
    const idx = this.parts.length;
    this.parts.push({ name });
    const old = this.curPart;
    this.curPart = idx;
    try { return fn(); } finally { this.curPart = old; }
  }
  _part() {
    if (this.curPart < 0) { this.parts.push({ name: 'body' }); this.curPart = this.parts.length - 1; }
    return this.curPart;
  }
  // a candidate callout: label (caps, <= 22 chars), quantity, local anchor point, priority
  // (higher is more important). Same label again adds an alternative anchor.
  callout(label, qty = 1, p = [0, 0, 0], prio = 1) {
    const at = this.W(p);
    const c = this.callouts.find((c) => c.label === label);
    if (c) { c.at.push(at); c.qty = Math.max(c.qty, qty); return; }
    this.callouts.push({ label, qty, at: [at], prio, part: this._part() });
  }

  // -------------------------------------------------- free 3D lines
  // o: { w: 1, pass: 2, dash: null, occlude: true }
  line(pts, o = {}) {
    const flat = [];
    for (const p of pts) { const q = this.W(p); flat.push(q[0], q[1], q[2]); }
    this.lines.push({
      pts: flat, w: o.w ?? 1, pass: o.pass ?? 2, dash: o.dash || null,
      occlude: o.occlude !== false, part: this._part(), skip: o.skip || null, fit: o.fit !== false,
    });
  }

  // stroke text as free 3D lines: origin is the text's center (or left/right end, by align),
  // xdir the baseline direction, ydir the up direction (both local, unit), cap height h
  text3(str, origin, xdir, ydir, h, o = {}) {
    if (!this.decorOn || !this.font || !str) return;
    const t = this.font(String(str), { spacing: o.spacing ?? 0.18 });
    const align = o.align || 'center';
    const ox = align === 'left' ? 0 : align === 'right' ? -t.width : -t.width / 2;
    const oy = o.baseline ? 0 : -0.5;
    for (const p of t.paths) {
      const pts = [];
      for (let i = 0; i < p.length; i += 2) {
        const x = (p[i] + ox) * h, y = (p[i + 1] + oy) * h;
        pts.push([origin[0] + xdir[0] * x + ydir[0] * y, origin[1] + xdir[1] * x + ydir[1] * y, origin[2] + xdir[2] * x + ydir[2] * y]);
      }
      if (pts.length === 2 && dist(pts[0], pts[1]) < 1e-9) pts[1] = add(pts[1], mul(ydir, h * 0.01));
      this.line(pts, { w: o.w ?? 1, pass: o.pass ?? 4, occlude: o.occlude !== false });
    }
    return t.width * h;
  }

  // -------------------------------------------------- solids
  // verts: [[x,y,z]] local; faces: [{v:[i...], g, name}]; o: {two, isect, w, girth, closed}
  _solid(verts, faces, o = {}) {
    const T = this.T;
    const V = new Float64Array(verts.length * 3);
    let bx0 = Infinity, by0 = Infinity, bz0 = Infinity, bx1 = -Infinity, by1 = -Infinity, bz1 = -Infinity;
    for (let i = 0; i < verts.length; i++) {
      const p = apply(T, verts[i]);
      V[i * 3] = p[0]; V[i * 3 + 1] = p[1]; V[i * 3 + 2] = p[2];
      if (p[0] < bx0) bx0 = p[0]; if (p[0] > bx1) bx1 = p[0];
      if (p[1] < by0) by0 = p[1]; if (p[1] > by1) by1 = p[1];
      if (p[2] < bz0) bz0 = p[2]; if (p[2] > bz1) bz1 = p[2];
    }
    const two = !!o.two;
    const closed = !two && o.closed !== false;
    const flip = det(T) < 0;
    let F = [];
    const fmap = [];
    for (const f of faces) {
      fmap.push(-1);
      let v = f.v.slice();
      // drop consecutive duplicates (collapsed apex)
      const vv = [];
      for (let k = 0; k < v.length; k++) {
        const a = v[k], b = v[(k + 1) % v.length];
        if (a === b) continue;
        if (Math.abs(V[a * 3] - V[b * 3]) + Math.abs(V[a * 3 + 1] - V[b * 3 + 1]) + Math.abs(V[a * 3 + 2] - V[b * 3 + 2]) < 1e-12) continue;
        vv.push(a);
      }
      if (vv.length < 3) continue;
      if (flip && !closed) vv.reverse();
      fmap[fmap.length - 1] = F.length;
      F.push({ v: vv, g: f.g ?? -1, name: f.name || null, hide: f.hide || null });
    }
    // orientation of closed solids: outward by signed volume
    if (closed) {
      let vol = 0;
      for (const f of F) {
        const a = f.v[0];
        for (let k = 1; k + 1 < f.v.length; k++) {
          const b = f.v[k], c = f.v[k + 1];
          vol += V[a * 3] * (V[b * 3 + 1] * V[c * 3 + 2] - V[b * 3 + 2] * V[c * 3 + 1])
            - V[a * 3 + 1] * (V[b * 3] * V[c * 3 + 2] - V[b * 3 + 2] * V[c * 3])
            + V[a * 3 + 2] * (V[b * 3] * V[c * 3 + 1] - V[b * 3 + 1] * V[c * 3]);
        }
      }
      if (vol < 0) for (const f of F) f.v.reverse();
    }
    const S = {
      id: this.solids.length, V, F, two, closed, part: this._part(),
      isect: o.isect !== false, w: o.w ?? 3, girth: o.girth ?? (Math.min(bx1 - bx0, by1 - by0, bz1 - bz0) || 0.01),
      bbox: [bx0, by0, bz0, bx1, by1, bz1], ax: norm(applyDir(T, [1, 0, 0])), names: {}, model: this,
      pass: o.pass ?? 1, kind: o.kind || 'solid', hidden: o.hidden || null, decorOff: !!o.decorOff, fmap,
    };
    // normals, planes, convexity
    for (let fi = 0; fi < F.length; fi++) {
      const f = F[fi];
      let nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0;
      const n = f.v.length;
      for (let k = 0; k < n; k++) {
        const a = f.v[k] * 3, b = f.v[(k + 1) % n] * 3;
        nx += (V[a + 1] - V[b + 1]) * (V[a + 2] + V[b + 2]);
        ny += (V[a + 2] - V[b + 2]) * (V[a] + V[b]);
        nz += (V[a] - V[b]) * (V[a + 1] + V[b + 1]);
        cx += V[a]; cy += V[a + 1]; cz += V[a + 2];
      }
      const l = Math.hypot(nx, ny, nz) || 1;
      f.area = l / 2;
      f.n = [nx / l, ny / l, nz / l];
      f.c = [cx / n, cy / n, cz / n];
      f.d = dot(f.n, f.c);
      f.gid = this.nFaces++;
      this.faceTable.push([S, fi]);
      if (f.name) S.names[f.name] = fi;
      // convex?
      if (n > 3) {
        let convex = true, sgn = 0;
        for (let k = 0; k < n && convex; k++) {
          const a = f.v[k] * 3, b = f.v[(k + 1) % n] * 3, c = f.v[(k + 2) % n] * 3;
          const e1 = [V[b] - V[a], V[b + 1] - V[a + 1], V[b + 2] - V[a + 2]];
          const e2 = [V[c] - V[b], V[c + 1] - V[b + 1], V[c + 2] - V[b + 2]];
          const s = dot(cross(e1, e2), f.n);
          if (Math.abs(s) < 1e-14) continue;
          if (sgn === 0) sgn = Math.sign(s); else if (Math.sign(s) !== sgn) convex = false;
        }
        if (!convex) {
          // triangulate in the face plane
          const fr = faceFrame(f.n, S.ax);
          const p2 = f.v.map((i) => [V[i * 3] * fr.u[0] + V[i * 3 + 1] * fr.u[1] + V[i * 3 + 2] * fr.u[2],
            V[i * 3] * fr.v[0] + V[i * 3 + 1] * fr.v[1] + V[i * 3 + 2] * fr.v[2]]);
          f.tris = triangulate(p2).map((t) => t.map((k) => f.v[k]));
        }
      }
    }
    this.solids.push(S);
    S.f = (name) => this._face(S, typeof name === 'number' ? name : S.names[name]);
    return S;
  }

  _face(S, fi) {
    if (fi == null || !S.F[fi]) return NULLFACE;
    S._faces = S._faces || {};
    return S._faces[fi] || (S._faces[fi] = new Face(this, S, fi));
  }

  // prism of a plan polygon (CCW not required), z0..z1; names for sides optional
  _prism(plan, z0, z1, o = {}, sideNames = null, capNames = ['-z', '+z']) {
    const n = plan.length;
    const verts = [];
    for (const p of plan) verts.push([p[0], p[1], z0]);
    for (const p of plan) verts.push([p[0], p[1], z1]);
    const ccw = polyArea2(plan) > 0;
    const faces = [];
    const smooth = o.smoothDeg ?? 0;
    // smoothing groups along the sides by turning angle
    let g = 0;
    const gs = [];
    const dirs = plan.map((p, i) => { const q = plan[(i + 1) % n]; return Math.atan2(q[1] - p[1], q[0] - p[0]); });
    for (let i = 0; i < n; i++) {
      if (i > 0) {
        let t = Math.abs(dirs[i] - dirs[i - 1]); if (t > Math.PI) t = 2 * Math.PI - t;
        if (!(smooth > 0 && t < smooth * D2R)) g++;
      }
      gs.push(g);
    }
    if (smooth > 0 && n > 2) {
      let t = Math.abs(dirs[0] - dirs[n - 1]); if (t > Math.PI) t = 2 * Math.PI - t;
      if (t < smooth * D2R) { const last = gs[n - 1]; for (let i = 0; i < n; i++) if (gs[i] === 0) gs[i] = last; }
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const v = ccw ? [i, j, n + j, n + i] : [j, i, n + i, n + j];
      faces.push({ v, g: smooth > 0 ? 100 + gs[i] : -1, name: sideNames ? sideNames[i] : 's' + i });
    }
    const bot = [], top = [];
    for (let i = 0; i < n; i++) { bot.push(i); top.push(n + i); }
    if (ccw) bot.reverse(); else top.reverse();
    if (o.caps !== false) {
      faces.push({ v: bot, name: capNames[0] });
      faces.push({ v: top, name: capNames[1] });
    }
    return this._solid(verts, faces, { closed: o.caps !== false, ...o });
  }

  // axis-aligned box from min to max corner. o.chamfer: chamfer on the vertical edges
  // (octagonal plan). Faces: '+x' '-x' '+y' '-y' '+z' '-z' (and 'c0'..'c3' chamfers).
  box(min, max, o = {}) {
    const [x0, y0, z0] = min, [x1, y1, z1] = max;
    const c = Math.min(o.chamfer || 0, (x1 - x0) / 2 - 1e-6, (y1 - y0) / 2 - 1e-6);
    if (c > 0) {
      const plan = [[x0 + c, y0], [x1 - c, y0], [x1, y0 + c], [x1, y1 - c], [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c]];
      return this._prism(plan, z0, z1, o, ['-y', 'c0', '+x', 'c1', '+y', 'c2', '-x', 'c3']);
    }
    return this._prism([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], z0, z1, o, ['-y', '+x', '+y', '-x']);
  }
  // box by center and size
  boxc(c, s, o = {}) {
    return this.box([c[0] - s[0] / 2, c[1] - s[1] / 2, c[2] - s[2] / 2], [c[0] + s[0] / 2, c[1] + s[1] / 2, c[2] + s[2] / 2], o);
  }

  // extrude a simple 2D profile (may be concave).
  // plane 'xy': profile (x,y), extruded along z from a to b. Caps '-z' '+z'.
  // plane 'xz': profile (x,z), extruded along y from a to b. Caps '-y' '+y'.
  // plane 'yz': profile (y,z), extruded along x from a to b. Caps '-x' '+x'.
  // Sides are 's0'.. in profile order. o.smoothDeg: sides meeting at less than this turn are smooth.
  extrude(profile, a, b, o = {}) {
    const plane = o.plane || 'xy';
    if (plane === 'xy') return this._prism(profile, a, b, o, null, ['-z', '+z']);
    const M = plane === 'xz' ? mBasis([0, 0, 0], [1, 0, 0], [0, 0, 1], [0, 1, 0]) : mBasis([0, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0]);
    const caps = plane === 'xz' ? ['-y', '+y'] : ['-x', '+x'];
    return this.push(M, () => this._prism(profile, a, b, o, null, caps));
  }

  // loft between two 3D polygons of equal vertex count (a at one end, b at the other).
  // Points of b may coincide (pyramid). Caps 'a' and 'b', sides 's0'... o.smoothDeg as extrude.
  loft(a, b, o = {}) {
    const n = a.length;
    const verts = [...a, ...b];
    const faces = [];
    const smooth = o.smoothDeg ?? 0;
    const gid = (i) => smooth > 0 ? 200 : -1;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const q = [i, j, n + j, n + i];
      // planarity check
      const P = q.map((k) => verts[k]);
      const nrm = cross(sub(P[1], P[0]), sub(P[3], P[0]));
      const off = Math.abs(dot(norm(nrm), sub(P[2], P[0])));
      const size = dist(P[0], P[2]) + 1e-9;
      if (len(nrm) > 1e-12 && off / size > 1e-4) {
        faces.push({ v: [i, j, n + j], g: smooth > 0 ? 200 : 300 + i, name: 's' + i });
        faces.push({ v: [i, n + j, n + i], g: smooth > 0 ? 200 : 300 + i, name: 's' + i + 'b' });
      } else faces.push({ v: q, g: gid(i), name: 's' + i });
    }
    const ca = [], cb = [];
    for (let i = 0; i < n; i++) { ca.push(i); cb.push(n + i); }
    if (o.caps !== false) {
      faces.push({ v: ca.reverse(), name: 'a' });
      faces.push({ v: cb, name: 'b' });
    }
    return this._solid(verts, faces, { closed: o.caps !== false, ...o });
  }
  // frustum between two plan polygons (2D) at heights za and zb
  frustum(pa, za, pb, zb, o = {}) {
    return this.loft(pa.map((p) => [p[0], p[1], za]), pb.map((p) => [p[0], p[1], zb]), o);
  }

  // lathe of an (r, z) profile about local z. o: seg (auto), a0, a1 (degrees), axis
  // ('z' | 'x' | 'y': the axis the local z maps to), caps (default true), open (two-sided,
  // no caps), loop (profile is a closed loop: torus, tire), sharpDeg (35), sharp: [indices].
  // Returns a solid with .lat, a LatheSurface for decor in (angle, t).
  lathe(profile, o = {}) {
    if (o.axis === 'x') return this.push(mBasis([0, 0, 0], [0, 0, -1], [0, 1, 0], [1, 0, 0]), () => this.lathe(profile, { ...o, axis: 'z' }));
    if (o.axis === 'y') return this.push(mBasis([0, 0, 0], [1, 0, 0], [0, 0, -1], [0, 1, 0]), () => this.lathe(profile, { ...o, axis: 'z' }));
    const a0 = o.a0 ?? 0, a1 = o.a1 ?? 360;
    const full = Math.abs(a1 - a0) >= 360 - 1e-9;
    let rmax = 0;
    for (const p of profile) rmax = Math.max(rmax, Math.abs(p[0]));
    const sc = Math.max(len(applyDir(this.T, [1, 0, 0])), len(applyDir(this.T, [0, 1, 0])));
    let N = o.seg;
    if (!N) {
      if (this.decorOn) {
        const rpx = rmax * sc / this.px;
        N = Math.ceil(Math.PI * Math.sqrt(Math.max(rpx, 0.1) / 0.3) * (o.segMul || 1));
        N = Math.max(o.minSeg || 8, Math.min(o.maxSeg || 112, Math.ceil(N / 4) * 4));
      } else N = 24;
      if (!full) N = Math.max(3, Math.ceil(N * Math.abs(a1 - a0) / 360));
    }
    const nA = full ? N : N + 1;
    const angs = [];
    for (let i = 0; i < nA; i++) angs.push(a0 + (a1 - a0) * i / N);
    const loop = !!o.loop;
    const open = !!o.open || !full;
    const np = profile.length;
    // smoothing groups along the profile
    const sharpSet = new Set(o.sharp || []);
    const sharpDeg = o.sharpDeg ?? 35;
    const segG = [];
    let g = 0;
    const nseg = loop ? np : np - 1;
    const sdir = [];
    for (let j = 0; j < nseg; j++) {
      const p = profile[j], q = profile[(j + 1) % np];
      sdir.push(Math.atan2(q[1] - p[1], q[0] - p[0]));
    }
    for (let j = 0; j < nseg; j++) {
      if (j > 0) {
        let t = Math.abs(sdir[j] - sdir[j - 1]); if (t > Math.PI) t = 2 * Math.PI - t;
        if (t > sharpDeg * D2R || sharpSet.has(j)) g++;
      }
      segG.push(g);
    }
    if (loop && nseg > 1) {
      let t = Math.abs(sdir[0] - sdir[nseg - 1]); if (t > Math.PI) t = 2 * Math.PI - t;
      if (!(t > sharpDeg * D2R || sharpSet.has(0))) { const last = segG[nseg - 1]; for (let j = 0; j < nseg; j++) if (segG[j] === 0) segG[j] = last; }
    }
    // vertices
    const verts = [];
    const ring = []; // ring[j][i] -> vertex index
    for (let j = 0; j < np; j++) {
      const [r, z] = profile[j];
      const row = [];
      if (Math.abs(r) < 1e-9) {
        const k = verts.length; verts.push([0, 0, z]);
        for (let i = 0; i < nA; i++) row.push(k);
      } else {
        for (let i = 0; i < nA; i++) { const a = angs[i] * D2R; row.push(verts.length); verts.push([r * Math.cos(a), r * Math.sin(a), z]); }
      }
      ring.push(row);
    }
    const faces = [];
    const grid = []; // grid[j][i] -> index into faces (or -1)
    for (let j = 0; j < nseg; j++) {
      const j2 = (j + 1) % np;
      const row = [];
      for (let i = 0; i < N; i++) {
        const i2 = full ? (i + 1) % nA : i + 1;
        const v = [ring[j][i], ring[j][i2], ring[j2][i2], ring[j2][i]];
        row.push(faces.length);
        faces.push({ v, g: segG[j] });
      }
      grid.push(row);
    }
    const capsOn = !open && !loop && o.caps !== false;
    let capA = -1, capB = -1;
    if (capsOn && Math.abs(profile[0][0]) > 1e-9) { capA = faces.length; faces.push({ v: ring[0].slice(0, N).reverse(), name: 'capA' }); }
    if (capsOn && Math.abs(profile[np - 1][0]) > 1e-9) { capB = faces.length; faces.push({ v: ring[np - 1].slice(0, N), name: 'capB' }); }
    const closed = !open && (loop || capsOn || (Math.abs(profile[0][0]) < 1e-9 && Math.abs(profile[np - 1][0]) < 1e-9));
    let girth = o.girth;
    const S = this._solid(verts, faces, { ...o, two: open && !o.one, closed, girth, kind: 'lathe' });
    for (const row of grid) for (let i = 0; i < row.length; i++) row[i] = S.fmap[row[i]];
    S.lat = new LatheSurface(this, S, { profile, angs, N, full, rv: ring, grid, loop, nseg, T: this.T });
    S.top = S.names.capB != null ? S.f('capB') : NULLFACE;
    S.bottom = S.names.capA != null ? S.f('capA') : NULLFACE;
    return S;
  }
  cyl(r, z0, z1, o = {}) { return this.lathe([[r, z0], [r, z1]], o); }
  cone(r0, r1, z0, z1, o = {}) { return this.lathe([[r0, z0], [r1, z1]], o); }
  sphere(r, o = {}) {
    const n = o.rings || (this.decorOn ? Math.max(8, Math.min(40, Math.ceil(Math.PI * Math.sqrt(r / this.px / 0.3) / 2))) : 10);
    const p = [];
    for (let i = 0; i <= n; i++) { const a = -90 + 180 * i / n; p.push([r * Math.cos(a * D2R), r * Math.sin(a * D2R)]); }
    p[0][0] = 0; p[n][0] = 0;
    return this.lathe(p, o);
  }
  // capsule along local z from z0 to z1 (total length), radius r
  capsule(r, z0, z1, o = {}) {
    const n = o.rings || 6;
    const p = [];
    for (let i = 0; i <= n; i++) { const a = -90 + 90 * i / n; p.push([r * Math.cos(a * D2R), z0 + r + r * Math.sin(a * D2R)]); }
    for (let i = 0; i <= n; i++) { const a = 90 * i / n; p.push([r * Math.cos(a * D2R), z1 - r + r * Math.sin(a * D2R)]); }
    p[0][0] = 0; p[p.length - 1][0] = 0;
    return this.lathe(p, o);
  }
  // torus about local z
  torus(R, r, o = {}) {
    const n = o.rings || 12, p = [];
    for (let i = 0; i < n; i++) { const a = 360 * i / n * D2R; p.push([R + r * Math.cos(a), r * Math.sin(a)]); }
    return this.lathe(p, { ...o, loop: true });
  }

  // round tube (strut) between local points a and b, radius r. o.caps, o.seg
  tube(a, b, r, o = {}) {
    let seg = o.seg;
    if (!seg) {
      if (this.decorOn) { const rpx = r * len(applyDir(this.T, [1, 0, 0])) / this.px; seg = rpx < 1.6 ? 6 : rpx < 4 ? 8 : rpx < 9 ? 12 : Math.min(48, Math.ceil(Math.PI * Math.sqrt(rpx / 0.3) / 4) * 4); } else seg = 8;
    }
    return this.along(a, b, (L) => {
      const S = this.lathe([[r, 0], [r, L]], { seg, ...o, axis: 'x', girth: o.girth ?? 2 * r, kind: 'tube' });
      // shade lines along the side away from the light
      if (o.shade !== false && this.decorOn && r / this.px > 2.2 && L / this.px > 8) S.lat.shade({ gap: 1.5, gapMax: 3.2, threshold: 0.55, w: 0 });
      return S;
    });
  }
  // swept round pipe through local points, radius r, mitered at the joints
  pipe(pts, r, o = {}) {
    const n = pts.length;
    if (n < 2) return null;
    if (n === 2) return this.tube(pts[0], pts[1], r, o);
    let seg = o.seg;
    if (!seg) {
      if (this.decorOn) { const rpx = r / this.px; seg = rpx < 1.6 ? 6 : rpx < 4 ? 8 : rpx < 9 ? 12 : 16; } else seg = 8;
    }
    const dirs = [];
    for (let i = 0; i + 1 < n; i++) dirs.push(norm(sub(pts[i + 1], pts[i])));
    // frames per segment by parallel transport (rotation taking one direction to the next)
    const t0 = dirs[0];
    const ref = Math.abs(t0[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const NS = [norm(cross(ref, t0))];
    for (let s = 1; s < dirs.length; s++) {
      const a = dirs[s - 1], b = dirs[s];
      const ax = cross(a, b), sn = len(ax), cs = dot(a, b);
      let N = NS[s - 1];
      if (sn > 1e-9) {
        const k = mul(ax, 1 / sn), ang = Math.atan2(sn, cs);
        const c = Math.cos(ang), si = Math.sin(ang);
        N = add(add(mul(N, c), mul(cross(k, N), si)), mul(k, dot(k, N) * (1 - c)));
      }
      N = norm(sub(N, mul(b, dot(N, b))));
      NS.push(N);
    }
    const verts = [], rings = [];
    for (let i = 0; i < n; i++) {
      const s = i === 0 ? 0 : i - 1;
      const d = dirs[s], Nf = NS[s], Bf = cross(d, Nf);
      const miter = i > 0 && i < n - 1 ? norm(add(dirs[i - 1], dirs[i])) : null;
      const row = [];
      for (let k = 0; k < seg; k++) {
        const a = 2 * Math.PI * k / seg;
        const off = add(mul(Nf, r * Math.cos(a)), mul(Bf, r * Math.sin(a)));
        let p = add(pts[i], off);
        if (miter) {
          const den = dot(miter, d);
          p = add(p, mul(d, -dot(miter, off) / (Math.abs(den) > 1e-6 ? den : 1e-6)));
        }
        row.push(verts.length); verts.push(p);
      }
      rings.push(row);
    }
    const faces = [];
    for (let i = 0; i + 1 < n; i++) {
      const bend = i > 0 ? Math.acos(Math.max(-1, Math.min(1, dot(dirs[i - 1], dirs[i])))) / D2R : 0;
      for (let k = 0; k < seg; k++) {
        const k2 = (k + 1) % seg;
        faces.push({ v: [rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]], g: 50 + (o.smoothBends ? 0 : i) });
      }
      void bend;
    }
    if (o.caps !== false) {
      faces.push({ v: rings[0].slice().reverse(), name: 'capA' });
      faces.push({ v: rings[n - 1].slice(), name: 'capB' });
    }
    return this._solid(verts, faces, { ...o, closed: o.caps !== false, girth: o.girth ?? 2 * r, kind: 'tube' });
  }

  // flat two-sided plate from a local 3D polygon, or a 2D polygon at z = 0
  plate(poly, o = {}) {
    const pts = poly.map((p) => p.length === 2 ? [p[0], p[1], 0] : p);
    const v = pts.map((_, i) => i);
    return this._solid(pts, [{ v, name: 'face' }], { girth: 1, ...o, two: true });
  }
}


// u right (seen from outside), v up on walls; on decks u follows the solid's local x
export function faceFrame(n, ax) {
  let u, v;
  if (Math.abs(n[2]) < 0.9) {
    v = norm(sub([0, 0, 1], mul(n, n[2])));
    u = cross(v, n);
  } else {
    let a = sub(ax, mul(n, dot(ax, n)));
    if (len(a) < 1e-6) a = sub([1, 0, 0], mul(n, n[0]));
    u = norm(a);
    v = cross(n, u);
  }
  return { u, v };
}

// ---------------------------------------------------------------- decoration
// Common emitter: polylines in 3D world attached to an owner face gid.
function pushDecor(M, pts3, gid, o, closed, nrm) {
  if (pts3.length < 6) return;
  if (closed) pts3.push(pts3[0], pts3[1], pts3[2]);
  M.decor.push({
    pts: pts3, gid, w: o.w ?? 1, pass: o.pass ?? 2, dash: o.dash || null, part: o.part ?? M._part(),
    nrm: nrm || null,
  });
}

const NOOP = () => NULLFACE;
export const NULLFACE = new Proxy({}, { get: (t, k) => (k === 'ok' || k === 'on' || k === 'front' ? false : k === 'w' || k === 'h' ? 0 : NOOP) });

export class Face {
  constructor(M, S, fi) {
    this.M = M; this.S = S; this.fi = fi; this.ok = true;
    const f = S.F[fi];
    this.gid = f.gid;
    this.n = f.n;
    const fr = faceFrame(f.n, S.ax);
    this.u = fr.u; this.v = fr.v;
    const V = S.V;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const c = f.c;
    const p2 = f.v.map((i) => {
      const d = [V[i * 3] - c[0], V[i * 3 + 1] - c[1], V[i * 3 + 2] - c[2]];
      const x = dot(d, this.u), y = dot(d, this.v);
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      return [x, y];
    });
    const ox = (x0 + x1) / 2, oy = (y0 + y1) / 2;
    this.o = add(c, add(mul(this.u, ox), mul(this.v, oy)));
    this.poly = p2.map(([x, y]) => [x - ox, y - oy]);
    this.w = x1 - x0; this.h = y1 - y0;
    // px per meter along u and v on the sheet
    if (M.decorOn) { this.su = M.sv(this.u); this.sv = M.sv(this.v); }
    else { this.su = [0, 0]; this.sv = [0, 0]; }
  }
  // point inside the face outline (2D face coordinates)
  contains(x, y) {
    const p = this.poly;
    let c = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
    }
    return c;
  }
  // rect fully inside the outline
  holds(r) { const e = 1e-6; return this.contains(r[0] + e, r[1] + e) && this.contains(r[2] - e, r[1] + e) && this.contains(r[2] - e, r[3] - e) && this.contains(r[0] + e, r[3] - e); }
  get box() { return [-this.w / 2, -this.h / 2, this.w / 2, this.h / 2]; }
  get front() { return dot(this.n, this.M.view.e) > 0 || this.S.two; }
  // 0 lit .. 1 turned away from the light (light from the upper left of the sheet)
  get tone() { return Math.max(0, Math.min(1, (1 - dot(this.n, this.M.light)) / 2 * 1.4 - 0.2)); }
  P(x, y) { return add(this.o, add(mul(this.u, x), mul(this.v, y))); }
  // px on paper of a length in meters along the face (geometric mean of the two axes)
  pxOf(m) {
    const a = Math.abs(this.su[0] * this.sv[1] - this.su[1] * this.sv[0]);
    return m * Math.sqrt(a);
  }
  // meters on the face for a length in px on paper (isotropic estimate)
  mOf(px) {
    const a = Math.sqrt(Math.abs(this.su[0] * this.sv[1] - this.su[1] * this.sv[0]));
    return a > 1e-9 ? px / a : px * (this.M.px || 0.01);
  }
  get on() { return this.M.decorOn && !this.S.decorOff; }

  _emit(pts2, closed, o = {}) {
    if (!this.on) return this;
    const flat = [];
    for (const p of pts2) {
      const P = this.P(p[0], p[1]);
      flat.push(P[0], P[1], P[2]);
    }
    pushDecor(this.M, flat, this.gid, o, closed);
    return this;
  }
  line(x0, y0, x1, y1, o) { return this._emit([[x0, y0], [x1, y1]], false, o); }
  path(pts, o = {}) { return this._emit(pts, !!o.closed, o); }
  rect(x0, y0, x1, y1, o) {
    if (typeof x0 !== 'number') { o = y0; [x0, y0, x1, y1] = x0; }
    return this._emit([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], true, o);
  }
  // circle or arc (a0..a1 degrees), segment count from its size on paper
  circle(cx, cy, r, o = {}) {
    const n = o.n || Math.max(8, Math.min(72, Math.ceil(this.pxOf(r) * 1.2)));
    const full = o.a0 == null;
    return this._emit(circlePts(cx, cy, r, o.ry ?? r, n, o.rot || 0, o.a0 ?? 0, o.a1 ?? 360), full, o);
  }
  ngon(cx, cy, r, n, rot = 0, o) { return this._emit(circlePts(cx, cy, r, r, n, rot), true, o); }
  // hatch a rect or polygon region minus holes. o: angle (deg, 0 = along u), gap (px),
  // gap2 (px at the far side, for a gradient), holes [regions], w (0), pass (3)
  hatch(region, o = {}) {
    if (!this.on) return this;
    const polys = [toPoly(region)];
    const A = (o.angle ?? 90) * D2R;
    const ca = Math.cos(A), sa = Math.sin(A);
    // screen spacing per meter step perpendicular to the lines, in the face plane
    const Dx = ca * this.su[0] + sa * this.sv[0], Dy = ca * this.su[1] + sa * this.sv[1];
    const Nx = -sa * this.su[0] + ca * this.sv[0], Ny = -sa * this.su[1] + ca * this.sv[1];
    const dl = Math.hypot(Dx, Dy);
    const k = dl > 1e-6 ? Math.abs(Dx * Ny - Dy * Nx) / dl : Math.hypot(Nx, Ny);
    if (k < 0.08) return this; // edge-on: would be a smear
    const g0 = (o.gap ?? 2.6) / k, g1 = (o.gap2 ?? o.gap ?? 2.6) / k;
    const flipG = !!o.flip;
    const gapAt = g0 === g1 ? () => g0 : (s, s0, s1) => {
      let t = (s - s0) / (s1 - s0 || 1); if (flipG) t = 1 - t;
      return g0 + (g1 - g0) * Math.max(0, Math.min(1, t));
    };
    let segs = hatch2D(polys, o.angle ?? 90, gapAt, o.maxLines || 500);
    if (o.clip !== false) segs = clipSegsToPoly(segs, this.poly);
    for (const h of o.holes || []) segs = clipSegsToPoly(segs, toPoly(h), true);
    const oo = { w: o.w ?? 0, pass: o.pass ?? 3, dash: o.dash, part: o.part };
    for (let i = 0; i < segs.length; i += 4) this._emit([[segs[i], segs[i + 1]], [segs[i + 2], segs[i + 3]]], false, oo);
    return this;
  }
  // stroke text centered at (x, y) with cap height h (meters). o: align ('center' | 'left' |
  // 'right'), angle (deg), upright (turn so it reads upright on paper), spacing, w, pass (4)
  text(str, x, y, h, o = {}) {
    if (!this.on || !this.M.font || !str) return this;
    if (this.pxOf(h) < 2.2) return this;
    const t = this.M.font(String(str), { spacing: o.spacing ?? 0.18 });
    let ang = (o.angle || 0);
    if (o.upright) {
      // choose a quarter turn so the baseline runs left to right on paper and up is up
      let best = 0, bs = -Infinity;
      for (const q of [0, 90, 180, 270]) {
        const a = (ang + q) * D2R;
        const bx = Math.cos(a) * this.su[0] + Math.sin(a) * this.sv[0];
        const by = Math.cos(a) * this.su[1] + Math.sin(a) * this.sv[1];
        const ux = -Math.sin(a) * this.su[0] + Math.cos(a) * this.sv[0];
        const uy = -Math.sin(a) * this.su[1] + Math.cos(a) * this.sv[1];
        const score = bx / (Math.hypot(bx, by) || 1) - uy / (Math.hypot(ux, uy) || 1) * 0.8;
        if (score > bs) { bs = score; best = q; }
      }
      ang += best;
    }
    const a = ang * D2R, c = Math.cos(a), s = Math.sin(a);
    const align = o.align || 'center';
    const ox = align === 'left' ? 0 : align === 'right' ? -t.width : -t.width / 2;
    const oo = { w: o.w ?? 1, pass: o.pass ?? 4, part: o.part };
    for (const p of t.paths) {
      const pts = [];
      for (let i = 0; i < p.length; i += 2) {
        const lx = (p[i] + ox) * h, ly = (p[i + 1] - 0.5) * h;
        pts.push([x + lx * c - ly * s, y + lx * s + ly * c]);
      }
      if (pts.length === 1) pts.push([pts[0][0] + 0.001, pts[0][1]]);
      this._emit(pts, false, oo);
    }
    return this;
  }
  textWidth(str, h, o = {}) {
    if (!this.M.font) return str.length * h * 0.8;
    return this.M.font(String(str), { spacing: o.spacing ?? 0.18 }).width * h;
  }
  // rivets along a line at a pitch in px; drawn as tiny circles
  rivets(x0, y0, x1, y1, o = {}) {
    if (!this.on) return this;
    const L = Math.hypot(x1 - x0, y1 - y0);
    const pitch = this.mOf(o.pitch ?? 7);
    const r = o.r ?? this.mOf(0.55);
    if (this.pxOf(r) < 0.35) return this;
    const n = Math.min(200, Math.max(1, Math.floor(L / pitch)));
    for (let i = 0; i <= n; i++) {
      const t = n ? i / n : 0.5;
      this.circle(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, { n: 6, w: o.w ?? 1, pass: o.pass ?? 2 });
    }
    return this;
  }
  // an n x m grid of panel rects inside a rect, gap in px between them (so joints read
  // as double lines). Returns [[x0,y0,x1,y1], ...] each with .i (column), .j (row)
  grid(n, m, o = {}) {
    const R = o.rect || this.box;
    const gap = o.gapM ?? (this.M.decorOn ? this.mOf(o.gap ?? 2.2) : 0);
    const out = [];
    const xs = o.xs || null, ys = o.ys || null; // optional cut positions 0..1
    const cx = xs || Array.from({ length: n + 1 }, (_, i) => i / n);
    const cy = ys || Array.from({ length: m + 1 }, (_, j) => j / m);
    for (let j = 0; j < cy.length - 1; j++) {
      for (let i = 0; i < cx.length - 1; i++) {
        const r = [R[0] + (R[2] - R[0]) * cx[i] + gap / 2, R[1] + (R[3] - R[1]) * cy[j] + gap / 2,
          R[0] + (R[2] - R[0]) * cx[i + 1] - gap / 2, R[1] + (R[3] - R[1]) * cy[j + 1] - gap / 2];
        if (i === 0) r[0] = R[0] + gap / 2 * (o.edge ?? 1);
        if (j === 0) r[1] = R[1] + gap / 2 * (o.edge ?? 1);
        if (i === cx.length - 2) r[2] = R[2] - gap / 2 * (o.edge ?? 1);
        if (j === cy.length - 2) r[3] = R[3] - gap / 2 * (o.edge ?? 1);
        r.i = i; r.j = j;
        out.push(r);
      }
    }
    return out;
  }
}

// Decor on a lathe surface in (angle in degrees, t along the profile 0..1 by arc length).
export class LatheSurface {
  constructor(M, S, L) {
    this.M = M; this.S = S; Object.assign(this, L);
    const P = L.profile;
    const cum = [0];
    const nseg = L.nseg;
    for (let j = 0; j < nseg; j++) { const p = P[j], q = P[(j + 1) % P.length]; cum.push(cum[j] + Math.hypot(q[0] - p[0], q[1] - p[1])); }
    this.cum = cum; this.total = cum[nseg] || 1;
    this.NM = normalMat(L.T);
    // smooth profile normals at vertices (nr, nz), per segment end
    this.segN = [];
    for (let j = 0; j < nseg; j++) {
      const p = P[j], q = P[(j + 1) % P.length];
      const dr = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dr, dz) || 1;
      this.segN.push([dz / l, -dr / l]);
    }
  }
  get on() { return this.M.decorOn && !this.S.decorOff; }
  _j(t) {
    const s = Math.max(0, Math.min(1, t)) * this.total;
    let j = 0;
    while (j < this.nseg - 1 && this.cum[j + 1] < s) j++;
    const L = this.cum[j + 1] - this.cum[j];
    return [j, L > 0 ? (s - this.cum[j]) / L : 0];
  }
  _i(a) {
    const a0 = this.angs[0], span = this.full ? 360 : this.angs[this.angs.length - 1] - a0;
    let x = a - a0;
    if (this.full) x = ((x % 360) + 360) % 360;
    x = Math.max(0, Math.min(span, x));
    const f = x / span * this.N;
    const i = Math.min(this.N - 1, Math.floor(f));
    return [i, f - i];
  }
  // point on the mesh, owner face gid, smooth world normal
  at(a, t) {
    const [j, ft] = this._j(t), [i, fa] = this._i(a);
    const V = this.S.V;
    const j2 = (j + 1) % this.profile.length;
    const i2 = this.full ? (i + 1) % this.angs.length : i + 1;
    const q = (jj, ii) => { const k = this.rv[jj][ii] * 3; return [V[k], V[k + 1], V[k + 2]]; };
    const p00 = q(j, i), p01 = q(j, i2), p10 = q(j2, i), p11 = q(j2, i2);
    const pa = lerp(p00, p01, fa), pb = lerp(p10, p11, fa);
    const p = lerp(pa, pb, ft);
    const fidx = this.grid[j][i];
    const gid = fidx >= 0 ? this.S.F[fidx].gid : -1;
    // normal: blend segment normals near the profile vertices of the same group
    let [nr, nz] = this.segN[j];
    const ar = a * D2R;
    let n = applyDir(this.NM, [nr * Math.cos(ar), nr * Math.sin(ar), nz]);
    n = norm(n);
    if (fidx >= 0 && dot(n, this.S.F[fidx].n) < 0) n = mul(n, -1);
    return { p, gid, n };
  }
  _emit(samples, closed, o = {}) {
    if (!this.on || samples.length < 2) return this;
    // split runs by owner face so each piece is owned by the face it lies on
    const pts = [], nrm = [];
    let gid = null;
    const flush = () => {
      if (pts.length >= 6) pushDecor(this.M, pts.slice(), gid, o, false, nrm.slice());
    };
    const list = closed ? [...samples, samples[0]] : samples;
    for (let k = 0; k + 1 < list.length; k++) {
      const A = list[k], B = list[k + 1];
      const mid = this.at((A.a + B.a) / 2 + (Math.abs(B.a - A.a) > 180 ? 180 : 0), (A.t + B.t) / 2);
      const g = mid.gid;
      if (g !== gid) {
        flush(); pts.length = 0; nrm.length = 0; gid = g;
        pts.push(A.p[0], A.p[1], A.p[2]); nrm.push(A.n[0], A.n[1], A.n[2]);
      }
      pts.push(B.p[0], B.p[1], B.p[2]); nrm.push(B.n[0], B.n[1], B.n[2]);
    }
    flush();
    return this;
  }
  _sample(a, t) { const r = this.at(a, t); return { a, t, p: r.p, n: r.n }; }
  // ring at t (whole arc, or a0..a1)
  ring(t, o = {}) {
    const A0 = o.a0 ?? this.angs[0], A1 = o.a1 ?? (this.full ? A0 + 360 : this.angs[this.angs.length - 1]);
    const step = (this.full ? 360 : this.angs[this.angs.length - 1] - this.angs[0]) / this.N;
    const s = [];
    const n = Math.max(2, Math.ceil(Math.abs(A1 - A0) / step - 1e-9));
    for (let i = 0; i <= n; i++) s.push(this._sample(A0 + (A1 - A0) * i / n, t));
    const full = Math.abs(A1 - A0) >= 360 - 1e-9;
    if (full) s.pop();
    return this._emit(s, full, o);
  }
  meridian(a, t0 = 0, t1 = 1, o = {}) {
    const s = [];
    // sample at profile vertices inside [t0, t1]
    const ts = [t0];
    for (let j = 1; j < this.nseg; j++) { const tj = this.cum[j] / this.total; if (tj > t0 && tj < t1) ts.push(tj); }
    ts.push(t1);
    for (const t of ts) s.push(this._sample(a, t));
    return this._emit(s, false, o);
  }
  // a closed curve in (arc-length) coordinates around (a, t): pts2 in meters, x along the
  // ring (at that t), y along the profile
  shape(a, t, pts2, o = {}) {
    if (!this.on) return this;
    const [j, ft] = this._j(t);
    const P = this.profile, j2 = (j + 1) % P.length;
    const r = Math.abs(P[j][0] + (P[j2][0] - P[j][0]) * ft) || 1e-6;
    // densify so straight runs follow the surface (chords would sink under it)
    const step = Math.min(r * (this.full ? 360 : this.angs[this.angs.length - 1] - this.angs[0]) / this.N * D2R * 0.5, this.total / 24);
    const dense = [];
    const P2 = o.closed ? [...pts2, pts2[0]] : pts2;
    for (let i = 0; i < P2.length; i++) {
      if (i > 0) {
        const A = P2[i - 1], B = P2[i];
        const m = Math.min(64, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / step));
        for (let k = 1; k < m; k++) dense.push([A[0] + (B[0] - A[0]) * k / m, A[1] + (B[1] - A[1]) * k / m]);
      }
      if (!(o.closed && i === P2.length - 1)) dense.push(P2[i]);
    }
    const s = dense.map(([x, y]) => this._sample(a + x / r / D2R, t + y / this.total));
    return this._emit(s, !!o.closed, o);
  }
  port(a, t, rad, o = {}) {
    const n = 16, pts = [];
    for (let i = 0; i < n; i++) { const q = 2 * Math.PI * i / n; pts.push([Math.cos(q) * rad, Math.sin(q) * rad]); }
    return this.shape(a, t, pts, { ...o, closed: true });
  }
  text(str, a, t, h, o = {}) {
    if (!this.on || !this.M.font) return this;
    if (h / this.M.px < 2.2) return this;
    const tx = this.M.font(String(str), { spacing: o.spacing ?? 0.18 });
    const ox = -tx.width / 2;
    // read left to right on paper
    const p0 = this.at(a, t).p, p1 = o.along ? this.at(a, Math.min(1, t + 0.01)).p : this.at(a + 2, t).p;
    const v = this.M.view;
    const sx = dot(sub(p1, p0), v.r) * (o.along && t + 0.01 > 1 ? -1 : 1);
    if (o.flip == null) o = { ...o, flip: sx < 0 };
    const oo = { w: o.w ?? 1, pass: o.pass ?? 4 };
    for (const p of tx.paths) {
      const pts = [];
      for (let i = 0; i < p.length; i += 2) pts.push([(p[i] + ox) * h, (p[i + 1] - 0.5) * h]);
      if (pts.length === 1) pts.push([pts[0][0] + 0.001, pts[0][1]]);
      // dense sampling so letters follow the surface
      const dense = [];
      for (let k = 0; k < pts.length; k++) {
        if (k > 0) {
          const A = pts[k - 1], B = pts[k];
          const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
          const m = Math.min(8, Math.ceil(L / (h * 0.25)));
          for (let q = 1; q < m; q++) dense.push([A[0] + (B[0] - A[0]) * q / m, A[1] + (B[1] - A[1]) * q / m]);
        }
        dense.push(pts[k]);
      }
      let q = o.flip ? dense.map(([x, y]) => [-x, -y]) : dense;
      if (o.along) q = q.map(([x, y]) => [-y, x]);
      this.shape(a, t, q, oo);
    }
    return this;
  }
  // vertical hatch (short meridians) over an angle range and t range, gap in px on paper
  hatch(a0, a1, t0, t1, o = {}) {
    if (!this.on) return this;
    const [j] = this._j((t0 + t1) / 2);
    const P = this.profile, r = Math.abs(P[j][0]) || Math.abs(P[(j + 1) % P.length][0]) || 1;
    const stepDeg = (o.gap ?? 1.2) * this.M.px / r / D2R;
    const n = Math.min(300, Math.floor(Math.abs(a1 - a0) / stepDeg));
    for (let i = 1; i < n; i++) this.meridian(a0 + (a1 - a0) * i / n, t0, t1, { w: 0, pass: 3 });
    return this;
  }
  // shading by meridians, denser away from the light. o: t0, t1, gap (min px), gapMax,
  // light (world dir toward the light), w (0), pass (3)
  shade(o = {}) {
    if (!this.on) return this;
    const v = this.M.view;
    const L = o.light || norm(add(add(mul(v.r, -0.55), mul(v.u, 0.75)), mul(v.e, 0.45)));
    const t0 = o.t0 ?? 0, t1 = o.t1 ?? 1;
    const tm = (t0 + t1) / 2;
    const A0 = this.angs[0], span = this.full ? 360 : this.angs[this.angs.length - 1] - A0;
    const K = 720;
    const gmin = o.gap ?? 1.7, gmax = o.gapMax ?? 7;
    const thr = o.threshold ?? 0.32;
    // where the profile turns (spheres, domes, bells) each meridian keeps only the runs that
    // are dark where they are, and alternate meridians stop as the rings narrow toward a pole
    const P = this.profile, nP = P.length;
    let rMin = Infinity, rMax = 0;
    for (const p of P) { rMin = Math.min(rMin, Math.abs(p[0])); rMax = Math.max(rMax, Math.abs(p[0])); }
    const turns = this.segN.some((q) => Math.abs(q[1]) > 0.08) || rMin < rMax * 0.7;
    const rAt = (t) => { const [j, f] = this._j(t); const q = P[(j + 1) % nP]; return Math.abs(P[j][0] + (q[0] - P[j][0]) * f); };
    const rMid = rAt(tm) || rMax || 1;
    const ts = [];
    if (turns) {
      const nS = Math.max(8, Math.min(28, Math.ceil((t1 - t0) * 28)));
      for (let i = 0; i <= nS; i++) ts.push(t0 + (t1 - t0) * i / nS);
    }
    const darkOf = (n) => Math.max(0, Math.min(1, (1 - dot(n, L)) / 2 * 1.35 - 0.1));
    // the surface normal with neighboring profile segments blended in (at() gives one normal
    // per segment, which would end every shade line on a ring and leave a stepped edge)
    const smoothN = (a, t) => {
      const base = this.at(a, t).n;
      const [j, ft] = this._j(t);
      const nb = this.segN[ft < 0.5 ? j - 1 : j + 1];
      let [nr, nz] = this.segN[j];
      if (nb && nr * nb[0] + nz * nb[1] > 0.7) { const w = Math.abs(ft - 0.5); nr = nr * (1 - w) + nb[0] * w; nz = nz * (1 - w) + nb[1] * w; }
      const ar = a * D2R;
      const n = norm(applyDir(this.NM, [nr * Math.cos(ar), nr * Math.sin(ar), nz]));
      return dot(n, base) < 0 ? mul(n, -1) : n;
    };
    let count = 0;
    const draw = (a) => {
      const mo = { w: o.w ?? 0, pass: o.pass ?? 3 };
      count++;
      if (!turns) { this.meridian(a, t0, t1, mo); return; }
      // thinning: odd meridians stop where the ring is under half the middle radius, and so on
      const lim = count % 2 ? 0.5 : count % 4 ? 0.25 : 0.1;
      let run = null;
      let pt = null, pd = 0;
      const end = (t) => { if (run && t - run > 1e-4) this.meridian(a, run, t, mo); run = null; };
      for (const t of ts) {
        const d = darkOf(smoothN(a, t)) - thr * (0.8 + 0.2 * ((count * 0.618) % 1));
        const ok = d > 0 && rAt(t) >= rMid * lim;
        if (ok && run == null) run = pt == null || pd > 0 ? t : pt + (t - pt) * (-pd / (d - pd || 1));
        if (!ok && run != null) end(d <= 0 && pd > 0 ? pt + (t - pt) * (pd / (pd - d || 1)) : pt);
        pt = t; pd = d;
      }
      end(t1);
    };
    let acc = 0, prev = null;
    for (let k = 0; k <= K; k++) {
      const a = A0 + span * k / K;
      const r = this.at(a, tm);
      const ne = dot(r.n, v.e);
      const s = [dot(r.p, v.r) / this.M.px, -dot(r.p, v.u) / this.M.px];
      if (ne <= 0.02) { prev = null; continue; }
      const dark = darkOf(r.n);
      if (prev) {
        const ds = Math.hypot(s[0] - prev[0], s[1] - prev[1]);
        if (dark > thr) {
          const gap = gmin + (gmax - gmin) * (1 - (dark - thr) / (1 - thr)) ** 1.6;
          acc += ds / gap;
          if (acc >= 1) { acc -= 1; draw(a); }
        } else acc = 0;
      }
      prev = s;
    }
    return this;
  }
}
