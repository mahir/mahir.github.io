// classes/parts-furn.js: shared parts for the furniture and instrument classes (things that
// are not vehicles, built as vehicles). Everything builds at the current frame's origin like
// the kit, +x forward, +z up, and draws decor only in the drawing pass. No random draws in
// here: callers pass the values in, so both build passes stay in step.
//
//   gridSolid(M, rows, o)   a mesh through rows of points (sections). rows[i][j], every row the
//                           same count; j runs around (closed by default). o.caps (true),
//                           o.two (open, two-sided), o.g (smoothing group), o.sharp (set of row
//                           indices where the surface creases). Returns a solid with S.gs, a
//                           surface for decor in (i, j) row/column coordinates (both continuous):
//                           gs.lineI(j, i0, i1, o), gs.lineJ(i, j0, j1, o), gs.path([[i, j]...]),
//                           gs.shade(o), gs.at(i, j) -> {p, n}
//   sweep(M, path, radii, o) round tube of varying radius along a polyline (tubing, bells on
//                           a bend). Returns the gridSolid (i along the path, j around).
//   ringPts(c, X, Y, r, n)  n points of a circle about center c in the plane of X, Y
//   turned(M, h, r, style)  a turned leg or post from z = 0 to h (lathe), styles 'vase',
//                           'bead', 'column', 'bun', 'finial'
//   castor(M, r)            a swivel castor: socket, fork, wheel; wheel bottom at z = 0,
//                           socket top at z = 2.6 r. Returns the top z.
//   tufting(f, r, n, m)     buttoned upholstery: a diamond grid with a button at each node
//   seams(f, r, o)          plate seams and rivet rows on a planar face
//   planRivets(M, S, plan, z, o)  rivets and seams along the side faces of an extruded plan
//   driver(M, o)            a seated driver facing +x, hip at the origin
//   steering(M, base, hub, o)    a column from base to hub and a wheel facing back along it
//   lampAt(M, p, dir, r)    a lamp at p pointing along the horizontal direction dir (deg)
//   fl(M, f, p)             local point -> 2D coordinates on face f; fpath(M, f, pts, o)

import { fitBrief } from '../words.js';
import * as K from '../kit.js';
import * as P from './parts-air.js';
import * as G from './gear.js';
import { D2R, add, sub, mul, cross, dot, norm, len, apply, applyDir, normalMat } from '../geom.js';

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

// ------------------------------------------------------------------ face helpers
export function fl(M, f, p) {
  const w = M.W(p);
  const d = sub(w, f.o);
  return [dot(d, f.u), dot(d, f.v)];
}
export function fpath(M, f, pts, o = {}) {
  if (!f.on) return;
  f.path(pts.map((p) => fl(M, f, p)), o);
}

// ------------------------------------------------------------------ grid surfaces
export function ringPts(c, X, Y, r, n, a0 = 0) {
  const out = [];
  for (let j = 0; j < n; j++) {
    const a = a0 + 2 * Math.PI * j / n;
    const ca = Math.cos(a) * r, sa = Math.sin(a) * r;
    out.push([c[0] + X[0] * ca + Y[0] * sa, c[1] + X[1] * ca + Y[1] * sa, c[2] + X[2] * ca + Y[2] * sa]);
  }
  return out;
}

export function gridSolid(M, rows, o = {}) {
  const nI = rows.length, nJ = rows[0].length;
  const closedJ = o.closedJ !== false;
  const verts = [];
  const idx = [];
  for (let i = 0; i < nI; i++) { const r = []; for (let j = 0; j < nJ; j++) { r.push(verts.length); verts.push(rows[i][j]); } idx.push(r); }
  const faces = [];
  const fgrid = [];
  const sharp = o.sharp || new Set();
  let band = 0;
  const g0 = o.g ?? 1;
  const nJs = closedJ ? nJ : nJ - 1;
  for (let i = 0; i + 1 < nI; i++) {
    if (i > 0 && sharp.has(i)) band++;
    const row = [];
    for (let j = 0; j < nJs; j++) {
      const j2 = (j + 1) % nJ;
      const a = idx[i][j], b = idx[i][j2], c = idx[i + 1][j2], d = idx[i + 1][j];
      const PA = verts[a], PB = verts[b], PC = verts[c], PD = verts[d];
      const g = o.flat ? -1 : g0 * 16 + band;
      const nrm = cross(sub(PB, PA), sub(PD, PA));
      const off = Math.abs(dot(norm(nrm), sub(PC, PA)));
      const size = len(sub(PC, PA)) + 1e-9;
      row.push(faces.length);
      if (len(nrm) > 1e-14 && off / size > 1e-4) {
        faces.push({ v: [a, b, c], g }, { v: [a, c, d], g });
      } else faces.push({ v: [a, b, c, d], g });
    }
    fgrid.push(row);
  }
  const caps = o.caps !== false && !o.two && closedJ;
  if (caps && o.capA !== false) faces.push({ v: idx[0].slice().reverse(), name: 'a' });
  if (caps && o.capB !== false) faces.push({ v: idx[nI - 1].slice(), name: 'b' });
  const S = M._solid(verts, faces, { closed: caps && o.capA !== false && o.capB !== false, two: !!o.two, ...o.solid });
  for (const row of fgrid) for (let j = 0; j < row.length; j++) row[j] = S.fmap[row[j]];
  S.gs = new GridSurf(M, S, { nI, nJ, closedJ, idx, fgrid });
  return S;
}

class GridSurf {
  constructor(M, S, g) {
    this.M = M; this.S = S; Object.assign(this, g);
    // smooth world normals per vertex
    const V = S.V, n = V.length / 3;
    const acc = new Float64Array(n * 3);
    for (const f of S.F) {
      if (f.name === 'a' || f.name === 'b') continue;
      for (const v of f.v) { acc[v * 3] += f.n[0] * f.area; acc[v * 3 + 1] += f.n[1] * f.area; acc[v * 3 + 2] += f.n[2] * f.area; }
    }
    this.N = acc;
    for (let v = 0; v < n; v++) { const l = Math.hypot(acc[v * 3], acc[v * 3 + 1], acc[v * 3 + 2]) || 1; acc[v * 3] /= l; acc[v * 3 + 1] /= l; acc[v * 3 + 2] /= l; }
  }
  get on() { return this.M.decorOn && !this.S.decorOff; }
  _v(i, j) { const k = this.idx[i][j] * 3; return [this.S.V[k], this.S.V[k + 1], this.S.V[k + 2]]; }
  _n(i, j) { const k = this.idx[i][j] * 3; return [this.N[k], this.N[k + 1], this.N[k + 2]]; }
  _wrap(j) { return this.closedJ ? ((j % this.nJ) + this.nJ) % this.nJ : clamp(j, 0, this.nJ - 1); }
  at(i, j) {
    i = clamp(i, 0, this.nI - 1);
    const i0 = Math.min(this.nI - 2, Math.floor(i)), fi = i - i0;
    let jj = this._wrap(j);
    const maxJ = this.closedJ ? this.nJ : this.nJ - 1;
    let j0 = Math.min(maxJ - 1, Math.floor(jj)); const fj = jj - j0;
    const j1 = (j0 + 1) % this.nJ;
    const L = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const p = L(L(this._v(i0, j0), this._v(i0, j1), fj), L(this._v(i0 + 1, j0), this._v(i0 + 1, j1), fj), fi);
    const n = norm(L(L(this._n(i0, j0), this._n(i0, j1), fj), L(this._n(i0 + 1, j0), this._n(i0 + 1, j1), fj), fi));
    const fidx = this.fgrid[i0][j0];
    const gid = fidx >= 0 ? this.S.F[fidx].gid : -1;
    return { p, n, gid };
  }
  _emit(samples, o = {}) {
    if (!this.on || samples.length < 2) return this;
    const lift = (o.lift ?? 0.6) * this.M.px;
    let pts = [], nr = [];
    const flush = () => {
      if (pts.length >= 6) this.M.decor.push({ pts: pts.slice(), gid: -1, w: o.w ?? 1, pass: o.pass ?? 2, dash: o.dash || null, part: this.M._part(), nrm: nr.slice() });
      pts = []; nr = [];
    };
    for (const s of samples) {
      const r = this.at(s[0], s[1]);
      pts.push(r.p[0] + r.n[0] * lift, r.p[1] + r.n[1] * lift, r.p[2] + r.n[2] * lift);
      nr.push(r.n[0], r.n[1], r.n[2]);
    }
    flush();
    return this;
  }
  lineI(j, i0 = 0, i1 = this.nI - 1, o = {}) {
    const n = Math.max(2, Math.ceil(Math.abs(i1 - i0) * (o.dens ?? 3)) + 1);
    const s = [];
    for (let k = 0; k < n; k++) s.push([i0 + (i1 - i0) * k / (n - 1), j]);
    return this._emit(s, o);
  }
  lineJ(i, j0 = 0, j1 = this.closedJ ? this.nJ : this.nJ - 1, o = {}) {
    const n = Math.max(2, Math.ceil(Math.abs(j1 - j0) * (o.dens ?? 2)) + 1);
    const s = [];
    for (let k = 0; k < n; k++) s.push([i, j0 + (j1 - j0) * k / (n - 1)]);
    return this._emit(s, o);
  }
  path(ij, o = {}) {
    const s = [];
    for (let k = 0; k < ij.length; k++) {
      if (k > 0) {
        const A = ij[k - 1], B = ij[k];
        const m = Math.max(1, Math.ceil(Math.max(Math.abs(B[0] - A[0]) * 3, Math.abs(B[1] - A[1]) * 2)));
        for (let q = 1; q < m; q++) s.push([A[0] + (B[0] - A[0]) * q / m, A[1] + (B[1] - A[1]) * q / m]);
      }
      s.push(ij[k]);
    }
    if (o.closed) s.push(ij[0]);
    return this._emit(s, o);
  }
  // a rivet head: a small circle (radius in px) lying on the surface at (i, j)
  dot(i, j, rpx = 0.6, o = {}) {
    if (!this.on) return this;
    const M = this.M;
    const c = this.at(i, j);
    if (dot(c.n, M.view.e) <= 0.05) return this;
    const a0 = this.at(Math.min(this.nI - 1, i + 0.02), j).p, a1 = this.at(Math.max(0, i - 0.02), j).p;
    let A = norm(sub(a0, a1));
    if (!isFinite(A[0]) || len(sub(a0, a1)) < 1e-9) A = norm(cross(c.n, [0, 0, 1]));
    const B = norm(cross(c.n, A));
    const r = rpx * M.px, lift = 0.6 * M.px;
    const pts = [], nr = [];
    for (let k = 0; k <= 6; k++) {
      const q = 2 * Math.PI * k / 6;
      pts.push(c.p[0] + (A[0] * Math.cos(q) + B[0] * Math.sin(q)) * r + c.n[0] * lift, c.p[1] + (A[1] * Math.cos(q) + B[1] * Math.sin(q)) * r + c.n[1] * lift, c.p[2] + (A[2] * Math.cos(q) + B[2] * Math.sin(q)) * r + c.n[2] * lift);
      nr.push(c.n[0], c.n[1], c.n[2]);
    }
    M.decor.push({ pts, gid: -1, w: o.w ?? 1, pass: o.pass ?? 2, dash: null, part: M._part(), nrm: nr });
    return this;
  }
  // a row of rivets along j at fixed i, pitch in px on paper (approximate)
  rivetsJ(i, j0, j1, o = {}) {
    if (!this.on) return this;
    const M = this.M, pitch = (o.pitch ?? 7) * M.px;
    const n = Math.max(2, Math.ceil(Math.abs(j1 - j0) * 8));
    let acc = 0, prev = this.at(i, j0).p;
    for (let k = 1; k <= n; k++) {
      const j = j0 + (j1 - j0) * k / n;
      const p = this.at(i, j).p;
      acc += len(sub(p, prev)); prev = p;
      while (acc >= pitch) { acc -= pitch; this.dot(i, j, o.r ?? 0.6); }
    }
    return this;
  }
  // shade lines along i (at fixed j), denser where the surface turns from the light
  shade(o = {}) {
    if (!this.on) return this;
    const M = this.M, v = M.view;
    const Lt = norm(add(add(mul(v.r, -0.55), mul(v.u, 0.75)), mul(v.e, 0.45)));
    const i0 = o.i0 ?? 0, i1 = o.i1 ?? this.nI - 1, im = o.im ?? (i0 + i1) / 2;
    const gmin = o.gap ?? 1.6, gmax = o.gapMax ?? 6, thr = o.threshold ?? 0.32;
    const J = this.closedJ ? this.nJ : this.nJ - 1;
    const K = Math.min(900, J * 24);
    let acc = 0, prev = null;
    const dark = (n) => Math.max(0, Math.min(1, (1 - dot(n, Lt)) / 2 * 1.35 - 0.1));
    for (let k = 0; k <= K; k++) {
      const j = J * k / K;
      const r = this.at(im, j);
      if (dot(r.n, v.e) <= 0.02) { prev = null; continue; }
      const s = [dot(r.p, v.r) / M.px, -dot(r.p, v.u) / M.px];
      const d = dark(r.n);
      if (prev && d > thr) {
        const gap = gmin + (gmax - gmin) * (1 - (d - thr) / (1 - thr)) ** 1.6;
        acc += Math.hypot(s[0] - prev[0], s[1] - prev[1]) / gap;
        if (acc >= 1) {
          acc -= 1;
          // the run along i where it stays dark
          const n = Math.max(4, Math.ceil((i1 - i0) * 3));
          let run = [];
          for (let q = 0; q <= n; q++) {
            const ii = i0 + (i1 - i0) * q / n;
            const rr = this.at(ii, j);
            if (dark(rr.n) > thr * 0.85 && dot(rr.n, v.e) > 0) run.push([ii, j]);
            else { if (run.length > 1) this._emit(run, { w: 0, pass: 3 }); run = []; }
          }
          if (run.length > 1) this._emit(run, { w: 0, pass: 3 });
        }
      } else if (d <= thr) acc = 0;
      prev = s;
    }
    return this;
  }
}

// ------------------------------------------------------------------ swept tube, varying radius
export function sweep(M, path, radii, o = {}) {
  const n = path.length;
  const seg = o.seg || (M.decorOn ? clamp(Math.ceil(Math.PI * Math.sqrt(Math.max(...radii) / M.px / 0.3) / 4) * 4, 8, 40) : 12);
  const dirs = [];
  for (let i = 0; i + 1 < n; i++) dirs.push(norm(sub(path[i + 1], path[i])));
  const tan = [];
  for (let i = 0; i < n; i++) tan.push(i === 0 ? dirs[0] : i === n - 1 ? dirs[n - 2] : norm(add(dirs[i - 1], dirs[i])));
  const ref = o.up || (Math.abs(tan[0][2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]);
  let N = norm(cross(ref, tan[0]));
  const rows = [];
  for (let i = 0; i < n; i++) {
    if (i > 0) {
      const a = tan[i - 1], b = tan[i];
      const ax = cross(a, b), sn = len(ax), cs = dot(a, b);
      if (sn > 1e-9) {
        const k = mul(ax, 1 / sn), ang = Math.atan2(sn, cs), c = Math.cos(ang), si = Math.sin(ang);
        N = add(add(mul(N, c), mul(cross(k, N), si)), mul(k, dot(k, N) * (1 - c)));
      }
      N = norm(sub(N, mul(b, dot(N, b))));
    }
    const B = cross(tan[i], N);
    rows.push(ringPts(path[i], N, B, radii[i], seg));
  }
  return gridSolid(M, rows, { caps: o.caps !== false, g: o.g ?? 3, solid: { isect: o.isect, girth: o.girth ?? 2 * Math.min(...radii) } });
}

// ------------------------------------------------------------------ turned work
export function turnedProfile(h, r, style = 'vase') {
  const P = {
    vase: [[0.62, 0], [0.62, 0.04], [0.5, 0.06], [0.48, 0.1], [0.8, 0.16], [1, 0.26], [0.92, 0.38], [0.6, 0.5], [0.44, 0.6], [0.4, 0.78], [0.5, 0.84], [0.62, 0.86], [0.5, 0.88], [0.5, 0.94], [0.9, 0.96], [0.9, 1]],
    bead: [[0.7, 0], [0.7, 0.05], [0.45, 0.08], [0.45, 0.25], [0.75, 0.3], [0.45, 0.35], [0.4, 0.62], [0.72, 0.68], [0.45, 0.74], [0.5, 0.9], [0.8, 0.94], [0.8, 1]],
    column: [[1, 0], [1, 0.03], [0.8, 0.05], [0.8, 0.07], [0.62, 0.09], [0.55, 0.5], [0.5, 0.88], [0.62, 0.9], [0.72, 0.94], [0.72, 0.97], [0.9, 1]],
    bun: [[0.55, 0], [0.85, 0.12], [1, 0.4], [0.9, 0.72], [0.6, 0.9], [0.62, 1]],
    finial: [[0.55, 0], [0.55, 0.12], [0.85, 0.2], [0.55, 0.28], [0.4, 0.34], [0.85, 0.52], [0.95, 0.62], [0.7, 0.8], [0.25, 0.92], [0, 1]],
    cabriole: [[0.5, 0], [0.75, 0.04], [0.55, 0.1], [0.35, 0.3], [0.38, 0.6], [0.6, 0.85], [0.8, 1]],
  }[style] || [[1, 0], [1, 1]];
  return P.map(([a, b]) => [a * r, b * h]);
}
export function turned(M, h, r, style = 'vase', o = {}) {
  const S = M.lathe(turnedProfile(h, r, style), { sharpDeg: 28, ...o });
  if (M.decorOn && r / M.px > 2.5 && o.shade !== false) S.lat.shade({ gap: 1.4, gapMax: 3.6 });
  return S;
}

// a swivel castor under a leg: socket at the top (z = 2.6 r), fork, wheel touching z = 0
export function castor(M, r, o = {}) {
  const top = r * 2.6;
  M.cyl(r * 0.62, top - r * 0.5, top, { isect: false });
  M.cyl(r * 0.2, top - r * 0.75, top - r * 0.5, { isect: false });
  const off = r * 0.35;
  for (const s of [1, -1]) M.box([-r * 0.25 - off, s * r * 0.36 - r * 0.06, r * 0.9], [r * 0.25, s * r * 0.36 + r * 0.06, top - r * 0.72], { isect: false });
  M.box([-r * 0.25 - off, -r * 0.42, top - r * 0.85], [r * 0.25, r * 0.42, top - r * 0.72], { isect: false });
  const W = M.at(-off, 0, r, () => M.lathe([[r * 0.25, -r * 0.3], [r * 0.85, -r * 0.3], [r, -r * 0.18], [r, r * 0.18], [r * 0.85, r * 0.3], [r * 0.25, r * 0.3]], { axis: 'y', sharpDeg: 50 }));
  if (W.bottom && W.bottom.ok) { const f = W.bottom; if (f.on) f.circle(0, 0, r * 0.3, { w: 1 }); }
  if (W.top && W.top.ok) { const f = W.top; if (f.on) f.circle(0, 0, r * 0.3, { w: 1 }); }
  void o;
  return top;
}

// ------------------------------------------------------------------ surfaces
// buttoned upholstery: diamond lattice with buttons (rivet buttons) at the nodes
export function tufting(f, r, n, m, o = {}) {
  if (!f.on) return;
  const W = r[2] - r[0], H = r[3] - r[1];
  const dx = W / n, dy = H / m;
  const lines = [];
  // diagonals through the nodes of a staggered grid
  for (let k = -m; k <= n + m; k++) {
    // lines x = r0 + (k + t) dx, y = r1 + t dy  and the mirrored family
    for (const sg of [1, -1]) {
      const pts = [];
      for (let t = 0; t <= m * 2; t++) {
        const x = r[0] + (k + sg * t / 2) * dx, y = r[1] + t / 2 * dy;
        if (x >= r[0] - 1e-6 && x <= r[2] + 1e-6 && y <= r[3] + 1e-6) pts.push([x, y]);
      }
      if (pts.length > 1) lines.push(pts);
    }
  }
  for (const p of lines) f.path(p, { w: 0 });
  const br = Math.min(dx, dy) * (o.button ?? 0.09);
  for (let j = 0; j <= m * 2; j++) {
    for (let i = 0; i <= n * 2; i++) {
      if ((i + j) % 2) continue;
      const x = r[0] + i * dx / 2, y = r[1] + j * dy / 2;
      if (i === 0 || i === n * 2 || j === 0 || j === m * 2) continue;
      if (f.pxOf(br) > 0.6) f.circle(x, y, br, { n: 6, w: 1 });
      // the pleats run out from each button
      if (o.pleats !== false && f.pxOf(dx) > 14) {
        f.line(x - br, y, x - dx * 0.22, y, { w: 0 });
        f.line(x + br, y, x + dx * 0.22, y, { w: 0 });
      }
    }
  }
  if (f.tone > 0.3) f.hatch(r, { angle: 45, gap: 4.8 - 2.6 * f.tone, w: 0 });
}

// plate seams (n x m plates) with rivet rows along the seams
export function seams(f, r, o = {}) {
  if (!f.on) return;
  const n = o.n ?? 2, m = o.m ?? 1;
  const g = f.grid(n, m, { rect: r, gap: o.gap ?? 2.0 });
  for (const q of g) {
    f.rect(q, { w: o.w ?? 1 });
    const d = f.mOf(2.6);
    if (o.rivets !== false && f.pxOf(q[2] - q[0]) > 16) {
      f.rivets(q[0] + d, q[3] - d, q[2] - d, q[3] - d, { pitch: o.pitch ?? 6.5 });
      f.rivets(q[0] + d, q[1] + d, q[2] - d, q[1] + d, { pitch: o.pitch ?? 6.5 });
    }
    if (o.shade && f.tone > 0.3) f.hatch([q[0] + d, q[1] + d, q[2] - d, q[3] - d], { angle: o.angle ?? 90, gap: 4.4 - 2.4 * f.tone, w: 0 });
  }
  return g;
}

// rivet rows and vertical plate seams along the side faces of a plan extruded from z0 to z1.
// S: the extrude (sides 's0'..), plan the profile used. o: rows: [z...], seam (m), pitch (px)
export function planRivets(M, S, plan, o = {}) {
  if (!M.decorOn) return;
  const n = plan.length;
  const rows = o.rows || [];
  const pitchM = (o.pitch ?? 7) * M.px;
  const seam = o.seam ?? 0;
  let acc = 0, accS = 0;
  for (let i = 0; i < n; i++) {
    const a = plan[i], b = plan[(i + 1) % n];
    if (o.skip && o.skip(i)) { continue; }
    const f = S.f('s' + i);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!f.on || !f.front || L < 1e-6) { acc = (acc + L) % pitchM; if (seam) accS = (accS + L) % seam; continue; }
    // rivets
    let t = (pitchM - acc) % pitchM;
    for (; t < L; t += pitchM) {
      const p = [a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L];
      for (const z of rows) {
        const q = fl(M, f, [p[0], p[1], z]);
        f.circle(q[0], q[1], f.mOf(0.55), { n: 6, w: 1 });
      }
    }
    acc = (acc + L) % pitchM;
    if (seam) {
      let ts = (seam - accS) % seam;
      for (; ts < L; ts += seam) {
        const p = [a[0] + (b[0] - a[0]) * ts / L, a[1] + (b[1] - a[1]) * ts / L];
        const q0 = fl(M, f, [p[0], p[1], o.z0]), q1 = fl(M, f, [p[0], p[1], o.z1]);
        f.line(q0[0], q0[1], q1[0], q1[1], { w: 1 });
      }
      accS = (accS + L) % seam;
    }
    if (o.shade && f.tone > 0.32) {
      const q0 = fl(M, f, [a[0], a[1], o.z0]), q1 = fl(M, f, [b[0], b[1], o.z1]);
      f.hatch([Math.min(q0[0], q1[0]), Math.min(q0[1], q1[1]), Math.max(q0[0], q1[0]), Math.max(q0[1], q1[1])], { angle: 90, gap: 4.6 - 2.6 * f.tone, w: 0 });
    }
  }
}

// ------------------------------------------------------------------ people and controls
export function driver(M, o = {}) {
  return P.pilot(M, { goggles: false, arms: o.arms || 'stick', ...o });
}
// steering column from base to hub (local points); the wheel faces back along the column
export function steering(M, base, hub, o = {}) {
  const r = o.r ?? 0.19;
  M.tube(base, hub, o.col ?? 0.025, { isect: false });
  const d = norm(sub(hub, base));
  M.along(hub, add(hub, d), () => M.ry(90, () => {
    const T = M.torus(r, r * 0.08, { isect: false, rings: 8 });
    void T;
    for (let k = 0; k < 3; k++) { const a = (90 + k * 120) * D2R; M.tube([0, 0, 0], [Math.cos(a) * r, Math.sin(a) * r, 0], r * 0.05, { isect: false, shade: false }); }
    M.cyl(r * 0.16, -r * 0.08, r * 0.08, { isect: false });
  }));
}
export function lampAt(M, p, deg, r) {
  M.at(p[0], p[1], p[2], () => M.rz(deg, () => K.lamp(M, { r })));
}

// a pair of headlamps and a whip, mounted on a face-normal direction: small conveniences
export function whipAt(M, p, h, lean = 12) {
  M.at(p[0], p[1], p[2], () => M.rz(135, () => K.whip(M, { h, lean })));
}

// world-up text on a vertical face, reading left to right on paper
export function label(f, str, x, y, h, o = {}) {
  if (!f.on) return;
  K.stencil(f, str, x, y, h, { upright: true, ...o });
}

// a rounded-rectangle (superellipse) section of half sizes a, b at height z, n points, CCW
export function sePts(a, b, z, n = 32, e = 3, cx = 0) {
  const out = [];
  for (let j = 0; j < n; j++) {
    const t = 2 * Math.PI * j / n, c = Math.cos(t), s = Math.sin(t);
    out.push([cx + a * Math.sign(c) * Math.abs(c) ** (2 / e), b * Math.sign(s) * Math.abs(s) ** (2 / e), z]);
  }
  return out;
}
// the first candidate sentence that fits the title block (<= 78 chars)
export function fit(...c) {
  for (const s of c) if (s && s.length <= 78) return s;
  const s = c[c.length - 1] || '';
  return fitBrief(s);
}
// a spot for the scale figure off to the left of the object on paper
export const figSpot = P.figSpot;

// ------------------------------------------------------------------ the object runner
const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
export function desig(M) {
  const L = () => LET[Math.floor(M.rng() * LET.length)];
  const k = M.rng();
  if (k < 0.4) return `${L()}${L()}-${M.ri(1, 9)}${M.ri(0, 9)}`;
  if (k < 0.7) return `TYPE ${M.ri(2, 60)}-${L()}`;
  return `MK ${['II', 'III', 'IV', 'V', 'VI', 'VII'][M.ri(0, 5)]}`;
}
// pick an object from a pool (G.test.variant forces one), plan its gear, build it at g.z,
// build the gear, and return the class vocabulary. An object is
// { id, aka, plan(M) -> p {len, wid, hgt, mass, kinds, round, view: [az, el], des, ...},
//   build(M, p, g) -> {fig}, vocab(M, p, g, gi) -> {klass, brief, specs} }
export function pickObject(M, pool) {
  let obj = M.pick(pool);
  const want = G.test && G.test.variant;
  if (want) { const o = pool.find((q) => q.id === want || (q.aka || []).includes(want)); if (o) obj = o; }
  M.info.variant = want && obj.aka && obj.aka.includes(want) ? want : null;
  return obj;
}
export function runObject(M, obj, family) {
  const p = obj.plan(M);
  M.setView(p.view[0], p.view[1]);
  const g = G.plan(M, { len: p.len, wid: p.wid, hgt: p.hgt, mass: p.mass, kinds: p.kinds, round: p.round });
  let r = {};
  M.at(0, 0, g.z, () => { r = obj.build(M, p, g) || {}; });
  if (M.info.mass) { M.info.mass[2] += g.z; M.info.mass[5] += g.z; }
  const gi = g.build();
  const v = obj.vocab(M, p, g, gi);
  const specs = [...(v.specs || []), ...((gi && gi.specs) || [])].slice(0, 4);
  return {
    klass: v.klass.slice(0, 34), brief: fit(v.brief), specs,
    family: g.family || family, float: !!g.float, drops: gi && gi.drops ? gi.drops : undefined,
    figure: (g.family === 'sea' && gi && gi.figure) ? gi.figure : r.fig ? [r.fig[0], r.fig[1]] : (gi && gi.figure) || undefined,
    designation: p.des,
  };
}

export { K, P, G, apply, applyDir, normalMat };
