// classes/parts-wear.js: shared parts for the footwear and appliance classes (round 2).
//
//   curve([[s, v], ...])       smooth monotone spline through the points, clamped at the ends
//   mesh(M, grids, o)          one solid from parametric grids, vertices welded where they meet.
//                              grid: {fn(s, u) -> [x,y,z] local, S: [s...], U: [u...], wrapU, g}
//   Surf                       a parametric surface for decor: lines, rows of rivets, stitching,
//                              shapes, ports and lettering in (s, u), shading away from the light,
//                              and a mounting frame for 3D parts
//   shoe(M, P)                 a shoe lofted through cross-sections along the foot: sole, upper
//                              with its throat opening, optional shaft, heel, collar binding and
//                              insole. Returns the surfaces and the profile functions.
//   seatUnit, steering, windshield, porthole3, dial helpers shared by both classes

import * as K from '../kit.js';
import { D2R, add, sub, mul, cross, dot, norm, len, lerp, apply, applyDir, normalMat, circlePts } from '../geom.js';

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const mix = (a, b, t) => a + (b - a) * t;

// ------------------------------------------------------------------ curve
// monotone cubic (Fritsch-Carlson) through [[s, v], ...]
export function curve(pts) {
  const n = pts.length, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i + 1 < n; i++) d.push((ys[i + 1] - ys[i]) / ((xs[i + 1] - xs[i]) || 1e-9));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i + 1 < n; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i + 1 < n; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i + 2 < n && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// samples: n steps on [a, b], denser at both ends (cosine) or uniform
export function steps(a, b, n, cos = true) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n; out.push(a + (b - a) * (cos ? 0.5 - 0.5 * Math.cos(Math.PI * t) : t)); }
  return out;
}
// merge sorted sample lists and drop near duplicates
export function joinSteps(...lists) {
  const all = lists.flat().sort((a, b) => a - b), out = [];
  for (const x of all) if (!out.length || x - out[out.length - 1] > 1e-6) out.push(x);
  return out;
}

// ------------------------------------------------------------------ mesh from grids
// o: {two, closed, g (smoothing group, default 1), isect, w, name}
export function mesh(M, grids, o = {}) {
  const verts = [], keys = new Map(), faces = [];
  let eps = o.eps ?? 1e-5;
  const vid = (p) => {
    const k = `${Math.round(p[0] / eps)},${Math.round(p[1] / eps)},${Math.round(p[2] / eps)}`;
    let i = keys.get(k);
    if (i === undefined) { i = verts.length; verts.push(p); keys.set(k, i); }
    return i;
  };
  for (const G of grids) {
    const S = G.S, U = G.U, nU = U.length;
    const idx = S.map((s) => U.map((u) => vid(G.fn(s, u))));
    const g = G.g ?? o.g ?? 1;
    const uSeg = G.wrapU ? nU : nU - 1;
    for (let i = 0; i + 1 < S.length; i++) {
      for (let j = 0; j < uSeg; j++) {
        const j2 = (j + 1) % nU;
        if (G.mask && !G.mask(S[i], S[i + 1], U[j], U[j2])) continue;
        const q = [idx[i][j], idx[i + 1][j], idx[i + 1][j2], idx[i][j2]];
        const v = G.flip ? q.slice().reverse() : q;
        // split non-planar quads into triangles
        const P = v.map((k) => verts[k]);
        const uniq = new Set(v).size;
        if (uniq < 3) continue;
        if (uniq === 4) {
          const nn = cross(sub(P[1], P[0]), sub(P[3], P[0]));
          const off = Math.abs(dot(norm(nn), sub(P[2], P[0])));
          const size = len(sub(P[0], P[2])) + 1e-9;
          if (len(nn) > 1e-14 && off / size > 2e-4) {
            faces.push({ v: [v[0], v[1], v[2]], g }, { v: [v[0], v[2], v[3]], g });
            continue;
          }
        }
        faces.push({ v, g });
      }
    }
    if (G.caps) for (const c of G.caps) faces.push({ v: c.map((p) => vid(p)), name: c.name, g: -1, cap: true });
  }
  // orient caps (or every face with o.orient) away from the centroid
  let cx = 0, cy = 0, cz = 0;
  for (const p of verts) { cx += p[0]; cy += p[1]; cz += p[2]; }
  const C = [cx / verts.length, cy / verts.length, cz / verts.length];
  for (const f of faces) {
    if (!f.cap && !o.orient) continue;
    let n = [0, 0, 0], c = [0, 0, 0];
    for (let k = 0; k < f.v.length; k++) {
      const a = verts[f.v[k]], b = verts[f.v[(k + 1) % f.v.length]];
      n = add(n, [(a[1] - b[1]) * (a[2] + b[2]), (a[2] - b[2]) * (a[0] + b[0]), (a[0] - b[0]) * (a[1] + b[1])]);
      c = add(c, a);
    }
    c = mul(c, 1 / f.v.length);
    if (dot(n, sub(c, C)) < 0) f.v.reverse();
    delete f.cap;
  }
  return M._solid(verts, faces, { two: !!o.two, closed: o.closed ?? !o.two, isect: o.isect, w: o.w ?? 3, girth: o.girth });
}

// ------------------------------------------------------------------ Surf
// fn(s, u) local point; o.out(s, u) -> local point on the inside (to orient normals outward)
export class Surf {
  constructor(M, fn, o = {}) {
    this.M = M; this.fn = fn; this.o = o;
    this.T = M.T.slice(); this.NM = normalMat(this.T);
    this.sr = o.sr || [0, 1]; this.ur = o.ur || [0, 1];
  }
  P(s, u) { return apply(this.T, this.fn(s, u)); }
  N(s, u) {
    const e = 1e-3, [s0, s1] = this.sr, [u0, u1] = this.ur;
    const a = clamp(s - e, s0, s1), b = clamp(s + e, s0, s1), c = clamp(u - e, u0, u1), d = clamp(u + e, u0, u1);
    const ds = sub(this.fn(b, u), this.fn(a, u)), du = sub(this.fn(s, d), this.fn(s, c));
    let n = cross(ds, du);
    if (len(n) < 1e-14) {
      const b2 = clamp(s + 0.02, s0, s1), a2 = clamp(s - 0.02, s0, s1), d2 = clamp(u + 0.02, u0, u1), c2 = clamp(u - 0.02, u0, u1);
      n = cross(sub(this.fn(b2, u), this.fn(a2, u)), sub(this.fn(s, d2), this.fn(s, c2)));
    }
    n = norm(n);
    if (this.o.inside) { const p = this.fn(s, u), q = this.o.inside(s, u); if (dot(n, sub(p, q)) < 0) n = mul(n, -1); }
    if (this.o.flipN) n = mul(n, -1);
    return norm(applyDir(this.NM, n));
  }
  // meters per unit of s and of u at (s, u), in world
  dS(s, u) { const e = 1e-3; return len(sub(this.P(Math.min(this.sr[1], s + e), u), this.P(Math.max(this.sr[0], s - e), u))) / (Math.min(this.sr[1], s + e) - Math.max(this.sr[0], s - e)); }
  dU(s, u) { const e = 1e-3; return len(sub(this.P(s, Math.min(this.ur[1], u + e)), this.P(s, Math.max(this.ur[0], u - e)))) / (Math.min(this.ur[1], u + e) - Math.max(this.ur[0], u - e)); }
  // a line through [[s, u], ...]; o: w, pass, dash, lift (px), inner (draw on the inside face)
  line(su, o = {}) {
    const M = this.M;
    if (!M.decorOn || su.length < 2) return;
    const lift = (o.lift ?? 0.9) * M.px * (o.inner ? -1 : 1);
    const pts = [], nr = [];
    for (const [s, u] of su) {
      const p = this.P(s, u), q = this.N(s, u);
      if (!p.every(Number.isFinite) || !q.every(Number.isFinite)) continue;
      pts.push(p[0] + q[0] * lift, p[1] + q[1] * lift, p[2] + q[2] * lift);
      if (o.inner) nr.push(-q[0], -q[1], -q[2]); else nr.push(q[0], q[1], q[2]);
    }
    if (pts.length < 6) return;
    M.decor.push({ pts, gid: -1, w: o.w ?? 1, pass: o.pass ?? 2, dash: o.dash || null, part: M._part(), nrm: nr });
  }
  runS(u, s0, s1, o = {}) {
    const k = Math.max(4, Math.ceil(Math.abs(s1 - s0) * (o.k ?? 90)));
    const su = [];
    for (let i = 0; i <= k; i++) { const s = s0 + (s1 - s0) * i / k; su.push([s, typeof u === 'function' ? u(s) : u]); }
    this.line(su, o);
  }
  runU(s, u0, u1, o = {}) {
    const k = Math.max(4, Math.ceil(Math.abs(u1 - u0) * (o.k ?? 40)));
    const su = [];
    for (let i = 0; i <= k; i++) { const u = u0 + (u1 - u0) * i / k; su.push([typeof s === 'function' ? s(u) : s, u]); }
    this.line(su, o);
  }
  // local 2D (meters, x along s, y along u) around (s, u) -> [s, u]
  map(s, u, x, y) { return [s + x / (this.dS(s, u) || 1), u + y / (this.dU(s, u) || 1)]; }
  shape(s, u, pts, o = {}) {
    if (!this.M.decorOn) return;
    const ds = this.dS(s, u) || 1, du = this.dU(s, u) || 1;
    const P = o.closed ? [...pts, pts[0]] : pts;
    const dense = [];
    const step = this.M.px * 3;
    for (let i = 0; i < P.length; i++) {
      if (i > 0) {
        const a = P[i - 1], b = P[i], k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
        for (let q = 1; q < k; q++) dense.push([a[0] + (b[0] - a[0]) * q / k, a[1] + (b[1] - a[1]) * q / k]);
      }
      dense.push(P[i]);
    }
    this.line(dense.map(([x, y]) => [clamp(s + x / ds, this.sr[0], this.sr[1]), clamp(u + y / du, this.ur[0], this.ur[1])]), o);
  }
  circle(s, u, r, o = {}) {
    if (!this.M.decorOn || r / this.M.px < (o.min ?? 0.7)) return;
    const n = o.n ?? Math.max(6, Math.min(40, Math.ceil(r / this.M.px * 2)));
    const pts = [];
    for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n; pts.push([Math.cos(a) * r * (o.rx ?? 1), Math.sin(a) * r]); }
    this.shape(s, u, pts, { ...o, closed: true });
  }
  rect(s, u, w, h, o = {}) {
    const rr = Math.min(o.r ?? 0, w / 2, h / 2);
    let pts;
    if (rr > 0) {
      pts = [];
      const c = (cx, cy, a0) => { for (let i = 0; i <= 4; i++) { const a = (a0 + 90 * i / 4) * D2R; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } };
      c(w / 2 - rr, -h / 2 + rr, -90); c(w / 2 - rr, h / 2 - rr, 0); c(-w / 2 + rr, h / 2 - rr, 90); c(-w / 2 + rr, -h / 2 + rr, 180);
    } else pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
    this.shape(s, u, pts, { ...o, closed: true });
  }
  // dark glass inside a rect around (s, u): short strokes along u, denser on one side
  glass(s, u, w, h, o = {}) {
    if (!this.M.decorOn) return;
    const px = this.M.px, n = Math.max(2, Math.floor(w / px / (o.gap ?? 1.1)));
    const ds = this.dS(s, u) || 1, du = this.dU(s, u) || 1;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (o.fade && Math.pow(t, 1.6) * 0.8 > ((i * 0.618) % 1)) continue;
      const x = -w / 2 + w * t;
      this.line([[s + x / ds, u - h / 2 / du], [s + x / ds, u + h / 2 / du]], { w: 0, pass: 3, lift: 1.1 });
    }
  }
  // round port: rim, inner ring, bolt dots, dark glass clipped to the circle
  port(s, u, r, o = {}) {
    const M = this.M;
    if (!M.decorOn || r / M.px < 2.5) return;
    this.circle(s, u, r, { w: 1 });
    const ri = r * 0.74;
    this.circle(s, u, ri, { w: 1 });
    const ds = this.dS(s, u) || 1, du = this.dU(s, u) || 1;
    if (r / M.px > 8) for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; this.circle(s + Math.cos(a) * r * 0.87 / ds, u + Math.sin(a) * r * 0.87 / du, r * 0.05, { n: 5, min: 0.3 }); }
    const n = Math.max(3, Math.floor(ri * 2 / M.px / (o.gap ?? 1.15)));
    for (let i = 1; i < n; i++) {
      const x = -ri + 2 * ri * i / n;
      const t = (x + ri) / (2 * ri);
      if (t > 0.55 && ((i * 0.618) % 1) < (t - 0.55) * 1.6) continue;
      const hh = Math.sqrt(Math.max(0, ri * ri - x * x)) * 0.94;
      this.line([[s + x / ds, u - hh / du], [s + x / ds, u + hh / du]], { w: 0, pass: 3, lift: 1.1 });
    }
  }
  // framed window with dark glass, w x h meters around (s, u)
  window(s, u, w, h, o = {}) {
    if (!this.M.decorOn) return;
    this.rect(s, u, w, h, { r: Math.min(w, h) * 0.18, w: 1 });
    this.rect(s, u, w * 0.84, h * 0.8, { r: Math.min(w, h) * 0.12, w: 1 });
    this.glass(s, u, w * 0.8, h * 0.76, { fade: true });
    if (o.mullion) this.line([this.map(s, u, 0, -h * 0.4), this.map(s, u, 0, h * 0.4)], { w: 1 });
  }
  // a row of rivets or stitches along [[s, u], ...]: pitch px; kind 'rivet' | 'stitch'
  row(su, o = {}) {
    const M = this.M;
    if (!M.decorOn) return;
    const pitch = (o.pitch ?? 7) * M.px;
    // walk the path in world length
    const W = su.map(([s, u]) => this.P(s, u));
    let acc = pitch * 0.5;
    const out = [];
    for (let i = 0; i + 1 < su.length; i++) {
      const L = len(sub(W[i + 1], W[i]));
      while (acc <= L) {
        const t = acc / (L || 1);
        out.push([mix(su[i][0], su[i + 1][0], t), mix(su[i][1], su[i + 1][1], t), su[i], su[i + 1]]);
        acc += pitch;
      }
      acc -= L;
    }
    const r = (o.r ?? 0.7) * M.px;
    for (const [s, u, a, b] of out) {
      if (o.kind === 'stitch') {
        // a short dash along the path
        const k = 0.28;
        const ds = (b[0] - a[0]), du = (b[1] - a[1]);
        const l = Math.hypot(ds * this.dS(s, u), du * this.dU(s, u)) || 1;
        const h = pitch * k / l;
        this.line([[s - ds * h, u - du * h], [s + ds * h, u + du * h]], { w: 1, lift: 1.1 });
      } else this.circle(s, u, r, { n: 6, w: 1, min: 0.3 });
    }
  }
  rowS(u, s0, s1, o = {}) { const k = 40, su = []; for (let i = 0; i <= k; i++) { const s = s0 + (s1 - s0) * i / k; su.push([s, typeof u === 'function' ? u(s) : u]); } this.row(su, o); }
  rowU(s, u0, u1, o = {}) { const k = 30, su = []; for (let i = 0; i <= k; i++) { const u = u0 + (u1 - u0) * i / k; su.push([typeof s === 'function' ? s(u) : s, u]); } this.row(su, o); }
  // lettering centered at (s, u), cap height h (meters), reading left to right on paper
  text(str, s, u, h, o = {}) {
    const M = this.M;
    if (!M.decorOn || !M.font || !str || h / M.px < 2.2) return;
    const T = M.font(String(str), { spacing: o.spacing ?? 0.2 });
    const ds = this.dS(s, u) || 1, du = this.dU(s, u) || 1;
    const e = 1e-3;
    const scr = dot(sub(this.P(Math.min(this.sr[1], s + e), u), this.P(Math.max(this.sr[0], s - e), u)), M.view.r);
    const dir = (scr >= 0 ? 1 : -1) * (o.flip ? -1 : 1);
    const ud = o.down ? -1 : 1;
    for (const p of T.paths) {
      const su = [];
      for (let i = 0; i < p.length; i += 2) {
        const x = (p[i] - T.width / 2) * h, y = (p[i + 1] - 0.5) * h;
        if (i > 0) {
          const x0 = (p[i - 2] - T.width / 2) * h, y0 = (p[i - 1] - 0.5) * h;
          const k = Math.max(1, Math.ceil(Math.hypot(x - x0, y - y0) / (h * 0.25)));
          for (let q = 1; q < k; q++) su.push([s + dir * (x0 + (x - x0) * q / k) / ds, u + ud * (y0 + (y - y0) * q / k) / du]);
        }
        su.push([s + dir * x / ds, u + ud * y / du]);
      }
      if (su.length === 1) su.push([su[0][0] + 1e-4, su[0][1]]);
      this.line(su, { w: o.w ?? 1, pass: 4, lift: 1.2 });
    }
  }
  // shading: lines along s at rows of u, kept where turned from the light and seen
  shade(o = {}) {
    const M = this.M;
    if (!M.decorOn) return;
    const e = M.view.e, Lv = M.light;
    const [s0, s1] = o.s || this.sr, [u0, u1] = o.u || this.ur;
    const um = (u0 + u1) / 2, sm = (s0 + s1) / 2;
    const alongU = o.dir === 'u';
    const span = alongU ? this.dS(sm, um) * (s1 - s0) : this.dU(sm, um) * (u1 - u0);
    const nRows = Math.max(3, Math.min(o.max ?? 80, Math.floor(span / M.px / (o.gap ?? 2.4))));
    const th = [0.18, 0.5, 0.32, 0.66, 0.24, 0.58, 0.4, 0.74];
    const K = o.k ?? 120;
    const bias = o.bias ?? 0;
    for (let r = 0; r < nRows; r++) {
      const q = (r + 0.5) / nRows;
      let run = null;
      for (let i = 0; i <= K; i++) {
        const p = i / K;
        const s = alongU ? s0 + (s1 - s0) * q : s0 + (s1 - s0) * p;
        const u = alongU ? u0 + (u1 - u0) * p : u0 + (u1 - u0) * q;
        const n = this.N(s, u);
        const nn = o.inner ? mul(n, -1) : n;
        const dk = clamp((1 - dot(nn, Lv)) / 2 * 1.5 - 0.25 + bias, 0, 1);
        const on = dk > th[r % th.length] && dot(nn, e) > 0.02 && (!o.mask || o.mask(s, u));
        if (on) { if (!run) run = []; run.push([s, u]); } else if (run) { if (run.length > 1) this.line(run, { w: 0, pass: 3, inner: o.inner }); run = null; }
      }
      if (run && run.length > 1) this.line(run, { w: 0, pass: 3, inner: o.inner });
    }
  }
  // is the outside at (s, u) seen?
  seen(s, u) { return dot(this.N(s, u), this.M.view.e) > 0.05; }
  // run fn in a world frame at (s, u): +x out of the surface, +y along s, +z along u
  mount(s, u, fn, lift = 0) {
    const p = this.P(s, u), n = this.N(s, u);
    const a = sub(this.P(Math.min(this.sr[1], s + 1e-3), u), this.P(Math.max(this.sr[0], s - 1e-3), u));
    const o = add(p, mul(n, lift));
    return this.M.world(() => this.M.along(o, add(o, n), fn, a));
  }
}

// ------------------------------------------------------------------ the shoe
// A last in profile functions over s (0 heel .. 1 toe) and a section curve per side
// (v 0 at the sole edge .. 1 at the top line). P:
//   L, x0 (x of the heel back, default -L/2), w(s) half width, sole(s) z of the sole bottom,
//   tS sole thickness (or tS(s)), hV(s) vamp height above the insole, sT throat front,
//   sB (where the opening reaches full width), hC(s) collar height above the insole (s < sT),
//   open (opening half width as a fraction of w), throat ('round' | 'point' | 'square'),
//   bulge (side fullness), shaft: {h (z of the top), ax, ay, xc, rise, flare}
export function last(P) {
  const L = P.L, x0 = P.x0 ?? -L / 2;
  const X = (s) => x0 + s * L;
  const w = P.w, sole = P.sole;
  const tS = typeof P.tS === 'function' ? P.tS : () => P.tS ?? 0.03 * L;
  const zb = (s) => sole(s) + tS(s);
  const sT = P.sT, sB = P.sB ?? sT * 0.7, open = P.open ?? 0.9;
  const throat = P.throat || 'round';
  const yo = (s) => {
    if (s >= sT) return 0;
    const wo = w(s) * open;
    if (s <= sB) return wo;
    const q = (s - sB) / (sT - sB);
    const f = throat === 'point' ? Math.pow(1 - q, 0.85) : throat === 'square' ? Math.sqrt(Math.max(0, 1 - Math.pow(q, 5))) : Math.sqrt(Math.max(0, 1 - q * q));
    return wo * f;
  };
  // height of the top line above the insole
  const hTop = (s) => (s >= sT ? P.hV(s) : P.hC(s));
  const zE = (s) => zb(s) + hTop(s);
  const bulge = P.bulge ?? 0.04;
  // the section curve: cubic Bezier from the sole edge to the top line
  const sect = (s, v, side = 1) => {
    const ww = w(s), y3 = yo(s), z0 = zb(s), z3 = zE(s), h = z3 - z0;
    const q = ww > 1e-9 ? clamp(y3 / ww, 0, 1) : 0;
    const p0 = [ww * (P.inset ?? 0.97), z0];
    const p1 = [ww * (1 + bulge), z0 + h * 0.42];
    const p2 = [mix(ww * 0.58, y3 + (ww - y3) * 0.18, q), mix(z3, z3 - h * 0.3, q)];
    const p3 = [y3, z3];
    const t = v, it = 1 - t;
    const a = it * it * it, b = 3 * it * it * t, c = 3 * it * t * t, d = t * t * t;
    const y = a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0];
    const z = a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1];
    // the back of the heel counter swells a little aft
    const back = (P.backSwell ?? 0.012) * L * Math.sin(Math.PI * clamp(v * 1.1, 0, 1)) * Math.pow(Math.max(0, 1 - s / 0.12), 2);
    return [X(s) - back, side * y, z];
  };
  return { L, X, w, sole, tS, zb, sT, sB, yo, hTop, zE, sect, P, hV: P.hV, hC: P.hC };
}

// the shaft: rings from the foot's collar (t = 0) to a top ellipse (t = 1), theta 0..1 around
// (0 back, 0.5 front). sh: {h (z of the top at the back), ax, ay, xc, rake (top x shift),
// tilt (front lower than back by), flare (top radius factor), waist}
export function shaftFn(Ls, sh) {
  const rim = (th) => {
    // theta 0..0.5 port side back to front, 0.5..1 starboard front to back
    const side = th <= 0.5 ? 1 : -1;
    const q = th <= 0.5 ? th * 2 : (1 - th) * 2;
    const s = Ls.sT * q;
    return Ls.sect(s, 1, side);
  };
  return (t, th) => {
    const r = rim(th);
    const a = 2 * Math.PI * th;
    const fl = 1 + ((sh.flare ?? 1) - 1) * smooth((t - 0.6) / 0.4) - (sh.waist ?? 0) * Math.sin(Math.PI * clamp(t * 1.25, 0, 1));
    const xc = sh.xc + (sh.rake ?? 0) * t;
    const top = [xc - Math.cos(a) * sh.ax * fl, Math.sin(a) * sh.ay * fl * (th <= 0.5 ? 1 : 1), sh.h - (sh.tilt ?? 0) * (1 - Math.cos(a)) / 2];
    const bx = 1 - Math.pow(1 - clamp(t, 0, 1), sh.k ?? 3.2);
    const z = mix(r[2], top[2], t);
    return [mix(r[0], top[0], bx), mix(r[1], top[1], bx), z];
  };
}

// build the shoe: upper (+ shaft), sole, insole, binding. P as last() plus:
//   ns, nv (sample counts), solePlan (sole overhang m), soleR (edge rounding fraction),
//   binding (radius of the collar roll), shaft, heel: {kind 'stiletto'|'block'|'wedge'|'none', ...}
export function shoe(M, P) {
  const Ls = last(P);
  const { L, X, w, sole, tS, zb, sT, yo, sect } = Ls;
  const ns = P.ns ?? 44, nv = P.nv ?? 12;
  // s samples: dense at the heel, the throat and the toe
  const S = joinSteps(steps(0, sT, Math.round(ns * sT * 1.1)), steps(sT, 1, Math.round(ns * (1 - sT) * 1.1)), [sT - 0.004, sT + 0.004].filter((s) => s > 0 && s < 1));
  const V = steps(0, 1, nv, false);
  const out = { Ls, S };
  const inside = (s) => [X(s), 0, zb(s) + Ls.hTop(Math.min(s, sT)) * 0.35];
  // ------------------------------------------------ upper
  M.part(P.partUpper || 'UPPER', () => {
    const grids = [1, -1].map((side) => ({ fn: (s, v) => sect(s, v, side), S, U: V }));
    if (P.shaft) {
      const sf = shaftFn(Ls, P.shaft);
      const nth = P.nth ?? 40, nt = P.nt ?? 14;
      // theta samples must hit the rim samples: rebuild from S below sT
      const sIn = S.filter((s) => s <= sT + 1e-9);
      const th = [...sIn.map((s) => s / sT / 2), ...sIn.slice(0, -1).reverse().map((s) => 1 - s / sT / 2)];
      th.pop();
      void nth;
      grids.push({ fn: sf, S: steps(0, 1, nt, false).map((t) => t), U: th, wrapU: true });
      out.shaftFn = sf; out.shaftTh = th;
    }
    if (!P.noUpper) out.upper = mesh(M, grids, { two: true, g: 1 });
  });
  out.side = new Surf(M, (s, v) => sect(s, v, 1), { inside: (s) => inside(s) });
  out.sideR = new Surf(M, (s, v) => sect(s, v, -1), { inside: (s) => inside(s) });
  out.surf = (side) => (side > 0 ? out.side : out.sideR);
  if (P.shaft) {
    const sf = out.shaftFn;
    const sh = P.shaft;
    out.shaft = new Surf(M, (t, th) => sf(t, th), { inside: (t, th) => [sh.xc + (sh.rake ?? 0) * t, 0, sf(t, th)[2]] });
  }
  // ------------------------------------------------ sole
  if (P.sole !== false && P.soleKind !== 'none') {
    M.part(P.partSole || 'SOLE', () => {
      const over = P.solePlan ?? L * 0.008;
      const ring = [];
      const nR = 10;
      const sr = P.soleR ?? 0.35;
      for (let k = 0; k < nR; k++) ring.push(k / nR);
      const wsOf = (s) => (w(s) > 1e-9 ? w(s) * (P.inset ?? 0.97) + over * Math.min(1, w(s) / (L * 0.05)) : 0);
      const fn = (s, k) => {
        const ws = wsOf(s), z0 = sole(s), t = tS(s);
        // a rounded rectangle section: k 0..1 around (top port .. bottom .. top starboard)
        const a = k * 2 * Math.PI;
        const c = Math.cos(a), si = Math.sin(a);
        const pw = 1 / (sr + 0.08);
        const y = ws * Math.sign(c) * Math.pow(Math.abs(c), 1 / pw * 2) ;
        const z = z0 + t / 2 + t / 2 * Math.sign(si) * Math.pow(Math.abs(si), 1 / pw * 2);
        return [X(s), y, z];
      };
      const sS = joinSteps(S, steps(0, 0.03, 4));
      out.sole = mesh(M, [{ fn, S: sS, U: ring, wrapU: true, g: 2 }], { closed: true, g: 2 });
      out.soleSurf = new Surf(M, fn, { inside: (s) => [X(s), 0, sole(s) + tS(s) / 2] });
      out.wsOf = wsOf;
    });
  }
  // ------------------------------------------------ insole (the floor inside the opening)
  if (P.insole !== false) {
    M.part(P.partUpper || 'UPPER', () => {
      const s0 = 0.01, s1 = sT * 0.98;
      const fn = (s, u) => [X(s), u * Math.max(yo(s) * 0.96, 1e-4), zb(s) + L * 0.002];
      out.insole = mesh(M, [{ fn, S: steps(s0, s1, 16), U: steps(-1, 1, 6, false), g: 3 }], { two: true, isect: false });
      out.insoleFn = fn;
    });
  }
  // ------------------------------------------------ binding along the top line
  const rimPts = [];
  if (P.shaft) {
    const sf = out.shaftFn;
    for (let i = 0; i <= 48; i++) rimPts.push(sf(1, i / 48));
  } else {
    const sIn = S.filter((s) => s <= sT + 1e-9);
    for (const s of sIn) rimPts.push(sect(s, 1, 1));
    for (const s of sIn.slice(0, -1).reverse()) rimPts.push(sect(s, 1, -1));
    rimPts.push(rimPts[0]);
  }
  out.rim = rimPts;
  if (P.binding && !P.noUpper) M.part(P.partUpper || 'UPPER', () => { out.bind = M.pipe(rimPts, P.binding, { isect: false, smoothBends: true }); });
  return out;
}

// ------------------------------------------------------------------ cockpit parts
// seat at the origin, pan top at z = 0, facing +x
export function seatUnit(M, o = {}) {
  const w = o.w ?? 0.5, d = o.d ?? 0.5, h = o.h ?? 0.62, t = o.t ?? 0.07;
  M.box([-d * 0.45, -w / 2, -t], [d * 0.55, w / 2, 0], { chamfer: Math.min(w, d) * 0.08 });
  const bk = M.loft(
    [[-d * 0.45, -w / 2, -t * 0.3], [-d * 0.45 + t * 1.2, -w / 2, -t * 0.3], [-d * 0.45 + t * 1.2, w / 2, -t * 0.3], [-d * 0.45, w / 2, -t * 0.3]],
    [[-d * 0.45 - h * 0.22, -w * 0.46, h], [-d * 0.45 - h * 0.22 + t, -w * 0.46, h], [-d * 0.45 - h * 0.22 + t, w * 0.46, h], [-d * 0.45 - h * 0.22, w * 0.46, h]], {});
  if (o.pedestal) M.box([-d * 0.3, -w * 0.3, -o.pedestal], [d * 0.3, w * 0.3, -t], { isect: false });
  return bk;
}
// steering wheel at the origin, facing -x (toward the driver), rim radius r, column to base
export function steering(M, o = {}) {
  const r = o.r ?? 0.2, rake = o.rake ?? 30;
  M.ry(-90 + rake, () => {
    M.torus(r, r * 0.08, { isect: false });
    for (let i = 0; i < 3; i++) { const a = (90 + i * 120) * D2R; M.tube([0, 0, 0], [Math.cos(a) * r, Math.sin(a) * r, 0], r * 0.05, { isect: false }); }
    M.cyl(r * 0.18, -r * 0.05, r * 0.08, { isect: false });
  });
  if (o.base) M.tube([0, 0, 0], o.base, r * 0.07, { isect: false });
}
// windshield: framed glass from a bottom edge (two points) rising h, raked back by deg
export function windshield(M, a, b, h, o = {}) {
  const rake = (o.rake ?? 28) * D2R;
  const back = o.back ?? [-1, 0, 0];
  const up = [back[0] * Math.sin(rake), back[1] * Math.sin(rake), Math.cos(rake)];
  const k = o.narrow ?? 0.12;
  const ab = sub(b, a);
  const c = add(a, mul(up, h)), d = add(b, mul(up, h));
  const c2 = add(c, mul(ab, k)), d2 = sub(d, mul(ab, k));
  const poly = [a, b, d2, c2];
  const r = o.r ?? h * 0.035;
  const S = M.plate(poly, { isect: false });
  M.pipe([a, c2, d2, b], r, { isect: false });
  if (o.post !== false) { const m0 = lerp(a, b, 0.5), m1 = lerp(c2, d2, 0.5); M.tube(m0, m1, r * 0.7, { isect: false }); }
  // glass hatch
  const f = S.f('face');
  if (f.on) {
    const pts = f.poly;
    f.hatch(pts, { angle: 70, gap: 1.0, gap2: 3.4, w: 0 });
  }
  return S;
}
export { K, D2R, add, sub, mul, cross, dot, norm, len, lerp, circlePts, mix };
