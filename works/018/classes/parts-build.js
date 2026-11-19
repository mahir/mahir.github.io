// classes/parts-build.js: shared parts for buildings at their true size (tower, pavilion).
// Wall treatments with courses of brick, stone or boards; sash windows and panelled doors
// drawn on faces (planar or lathe); faceted towers and roofs built as one solid of planar
// facets; gable, tented, bell and domed roofs with tiles, slates or seams; balustrades,
// steps, gutters, finials, scalloped valances; and the fittings that make a building
// travel: a steel base deck, tie-down straps, lamps, a number plate, a driving cab and a
// ship's wheel. Every 3D part builds in the current frame (+z up) and returns something.

import * as K from '../kit.js';
import { dot, sub, add, mul, lerp, len, norm, D2R, circlePts } from '../geom.js';

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const seen = (M, n) => dot(n, M.view.e) > 0;
// the azimuth (deg) in the ground plane toward the viewer
export const viewAz = (M) => Math.atan2(M.view.e[1], M.view.e[0]) / D2R;

// ------------------------------------------------------------------ face helpers
// x range of a convex face outline at height y (face coordinates)
export function spanAt(poly, y) {
  let x0 = Infinity, x1 = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if ((a[1] - y) * (b[1] - y) > 0) continue;
    if (Math.abs(b[1] - a[1]) < 1e-12) { x0 = Math.min(x0, a[0], b[0]); x1 = Math.max(x1, a[0], b[0]); continue; }
    const x = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
  }
  return x0 <= x1 ? [x0, x1] : null;
}
// a horizontal line from x0 to x1 at y with the hole rects cut out
function hline(f, x0, x1, y, holes, o) {
  let segs = [[x0, x1]];
  for (const h of holes) {
    if (y <= h[1] || y >= h[3]) continue;
    const out = [];
    for (const [a, b] of segs) {
      if (h[2] <= a || h[0] >= b) { out.push([a, b]); continue; }
      if (h[0] > a) out.push([a, h[0]]);
      if (h[2] < b) out.push([h[2], b]);
    }
    segs = out;
  }
  for (const [a, b] of segs) if (b - a > 1e-4) f.line(a, y, b, y, o);
}
const inHoles = (x, y, holes) => holes.some((h) => x > h[0] && x < h[2] && y > h[1] && y < h[3]);

// ------------------------------------------------------------------ wall treatments
// courses on a wall region r (face coordinates). kind: 'brick' | 'stone' | 'boards' (lapped
// weatherboard) | 'battens' (vertical boards) | 'shingle' | 'block' | 'render'. Detail follows
// the paper: course pitch is a whole number of real courses no finer than about 3 px.
// o.holes: rects left clear (windows, doors). o.shade: add tone hatching on dark faces.
const COURSE = { brick: [0.075, 0.225], stone: [0.42, 0.85], boards: [0.17, 0], battens: [0.16, 0], shingle: [0.19, 0.24], block: [0.25, 0.5], render: [0, 0] };
export function courses(f, r, o = {}) {
  if (!f.on || !f.front) return f;
  const kind = o.kind || 'brick';
  const R = r || f.box;
  const holes = o.holes || [];
  const tone = f.tone;
  const shade = () => { if (o.shade !== false && tone > 0.4) f.hatch(R, { angle: 50, gap: 5.5 - 3.2 * tone, holes, w: 0 }); };
  if (kind === 'render') { shade(); return f; }
  const [p0, l0] = COURSE[kind] || COURSE.brick;
  let k = 1;
  const minPx = o.minPx ?? (kind === 'brick' ? 3.1 : 2.8);
  while (f.pxOf(p0 * k) < minPx && k < 80) k++;
  const pitch = p0 * k;
  const lo = { w: 0, pass: 3 };
  if (kind === 'battens') {
    f.hatch(R, { angle: 90, gap: Math.max(2.4, f.pxOf(pitch)) * (1 - tone * 0.25), holes, w: 0 });
    return f;
  }
  const rows = Math.min(400, Math.floor((R[3] - R[1]) / pitch));
  // perpends: brick, stone, shingle and block joints, staggered row by row
  let lp = l0;
  if (l0) { let m = 1; while (f.pxOf(l0 * m) < 7 && m < 40) m++; lp = l0 * m; }
  const perps = l0 && f.pxOf(pitch) >= (kind === 'brick' ? 4.2 : 3.2);
  let nPerp = 0;
  for (let i = 1; i <= rows; i++) {
    const y = R[1] + pitch * i;
    if (y >= R[3] - 1e-6) break;
    const sp = spanAt(f.poly, y);
    if (!sp) continue;
    const x0 = Math.max(R[0], sp[0]), x1 = Math.min(R[2], sp[1]);
    if (x1 <= x0) continue;
    hline(f, x0, x1, y, holes, lo);
    if (kind === 'boards' && f.pxOf(pitch) > 6) hline(f, x0, x1, y - pitch * 0.16, holes, lo);
    if (perps && nPerp < 2400) {
      const yb = y - pitch;
      const off = (i % 2) * lp / 2;
      for (let x = R[0] + off + lp; x < R[2] - 1e-6; x += lp) {
        if (x <= x0 || x >= x1 || inHoles(x, y - pitch / 2, holes)) continue;
        f.line(x, Math.max(yb, R[1]), x, y, lo); nPerp++;
      }
    }
  }
  shade();
  return f;
}

// quoins: alternating long and short stones up both edges of a wall face
export function quoins(f, o = {}) {
  if (!f.on || !f.front) return f;
  const h = o.h ?? 0.32, L1 = o.long ?? 0.75, L2 = o.short ?? 0.42;
  let k = 1; while (f.pxOf(h * k) < 4 && k < 20) k++;
  const hh = h * k;
  const y0 = o.y0 ?? -f.h / 2, y1 = o.y1 ?? f.h / 2;
  for (const s of [-1, 1]) {
    const x = s * f.w / 2;
    let i = 0;
    for (let y = y0; y + hh <= y1 + 1e-6; y += hh, i++) {
      const L = i % 2 ? L2 : L1;
      f.rect(s < 0 ? x : x - L, y, s < 0 ? x + L : x, y + hh, { w: 0 });
    }
  }
  return f;
}

// ------------------------------------------------------------------ windows and doors
// sash window centered at (cx, cy), w by h: frame, sill, head, two sashes with glazing bars
// and dark glass. o.panes [cols, rows] per sash (default [2, 2]); o.arch round head;
// o.casement: one sash (cols x rows panes); o.shutters: louvered shutters to the sides.
// Returns the hole rect to keep clear of courses.
export function sash(f, cx, cy, w, h, o = {}) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const sillH = Math.min(0.1, h * 0.08), sillO = Math.min(0.08, w * 0.1);
  const hole = [x0 - sillO, y0 - sillH, x1 + sillO, y1 + (o.arch ? 0 : Math.min(0.16, h * 0.1))];
  if (o.shutters) { hole[0] -= w * 0.5; hole[2] += w * 0.5; }
  if (!f.on || !f.front) return hole;
  if (f.pxOf(Math.min(w, h)) < 3.5) { f.rect(x0, y0, x1, y1, { w: 1 }); return hole; }
  const top = o.arch ? archPts(x0, x1, y1 - w / 2, 10) : [[x1, y1], [x0, y1]];
  f.path([[x0, y0], [x1, y0], ...top], { closed: true, w: 1 });
  f.rect(x0 - sillO, y0 - sillH, x1 + sillO, y0, { w: 1 });
  if (!o.arch) f.rect(x0 - sillO * 0.5, y1, x1 + sillO * 0.5, y1 + Math.min(0.16, h * 0.1), { w: 0 });
  const fr = Math.min(w, h) * 0.09;
  const ix0 = x0 + fr, ix1 = x1 - fr, iy0 = y0 + fr, iy1 = y1 - fr;
  const sashes = o.casement ? [[iy0, iy1]] : [[iy0, (iy0 + iy1) / 2 - fr * 0.25], [(iy0 + iy1) / 2 + fr * 0.25, iy1]];
  const [pc, pr] = o.panes || [2, 2];
  const small = f.pxOf((ix1 - ix0) / pc) < 5;
  sashes.forEach(([a, b], si) => {
    const archTop = o.arch && si === sashes.length - 1;
    const poly = archTop ? [[ix0, a], [ix1, a], ...archPts(ix0, ix1, iy1 - (ix1 - ix0) / 2, 10)] : [[ix0, a], [ix1, a], [ix1, b], [ix0, b]];
    f.path(poly, { closed: true, w: 1 });
    K.glass(f, poly, { gap: small ? 1.0 : 1.15, gap2: small ? 2.0 : 2.6, angle: 64, flip: si === 1, cross: false });
    if (small) return;
    for (let i = 1; i < pc; i++) { const x = ix0 + (ix1 - ix0) * i / pc; f.line(x, a, x, archTop ? b : b, { w: 1 }); }
    for (let j = 1; j < pr; j++) { const y = a + (b - a) * j / pr; f.line(ix0, y, ix1, y, { w: 1 }); }
  });
  if (o.shutters && f.pxOf(w) > 9) {
    for (const s of [-1, 1]) {
      const sx0 = s < 0 ? x0 - w * 0.48 : x1 + w * 0.02, sx1 = sx0 + w * 0.46;
      f.rect(sx0, y0, sx1, y1, { w: 1 });
      const n = Math.max(3, Math.min(14, Math.floor(f.pxOf(h) / 4)));
      for (let i = 1; i < n; i++) f.line(sx0, y0 + h * i / n, sx1, y0 + h * i / n, { w: 0 });
    }
  }
  return hole;
}
function archPts(x0, x1, yc, n) {
  const r = (x1 - x0) / 2, cx = (x0 + x1) / 2, out = [];
  for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; out.push([cx + Math.cos(a) * r, yc + Math.sin(a) * r]); }
  return out;
}
export { archPts };

// panelled door on a face: sill at y0, w by h; architrave, leaf with panels, knob, a
// fanlight (o.fan: 'rect' | 'arch' | null), o.glazed: glass in the upper panels, o.ledged:
// a boarded shed door with a Z brace. Returns the hole rect.
export function doorway(f, cx, y0, w, h, o = {}) {
  const ar = Math.min(0.12, w * 0.1);
  const fanH = o.fan === 'rect' ? Math.min(0.5, h * 0.18) : o.fan === 'arch' ? w / 2 : 0;
  const x0 = cx - w / 2, x1 = cx + w / 2, y1 = y0 + h;
  const hole = [x0 - ar, y0, x1 + ar, y1 + fanH + ar];
  if (!f.on || !f.front) return hole;
  if (o.fan === 'arch') {
    const P = archPts(x0 - ar, x1 + ar, y1, 12);
    f.path([[x0 - ar, y0], [x0 - ar, y1], ...P.slice().reverse(), [x1 + ar, y1], [x1 + ar, y0]], { w: 1 });
    const Q = archPts(x0, x1, y1, 12);
    f.path(Q, { w: 1 });
    K.glass(f, [[x0, y1], ...Q.slice().reverse().slice(0, -1), [x1, y1]].reverse(), { gap: 1.2, gap2: 2.6, cross: false });
    if (f.pxOf(w) > 10) for (let i = 1; i < 5; i++) { const a = Math.PI * i / 5; f.line(cx, y1, cx + Math.cos(a) * w / 2, y1 + Math.sin(a) * w / 2, { w: 1 }); }
  } else {
    f.path([[x0 - ar, y0], [x0 - ar, y1 + fanH + ar], [x1 + ar, y1 + fanH + ar], [x1 + ar, y0]], { w: 1 });
    if (fanH) { const g = [[x0, y1 + 0.04], [x1, y1 + 0.04], [x1, y1 + fanH], [x0, y1 + fanH]]; f.path(g, { closed: true, w: 1 }); K.glass(f, g, { gap: 1.2, gap2: 2.6, cross: false }); }
  }
  f.rect(x0, y0, x1, y1, { w: 1 });
  if (f.pxOf(w) < 6) return hole;
  if (o.ledged) {
    const n = Math.max(3, Math.round(w / 0.12));
    for (let i = 1; i < n; i++) f.line(x0 + w * i / n, y0, x0 + w * i / n, y1, { w: 0 });
    const b = h * 0.06;
    for (const t of [0.15, 0.82]) f.rect(x0 + w * 0.04, y0 + h * t - b / 2, x1 - w * 0.04, y0 + h * t + b / 2, { w: 1 });
    f.path([[x0 + w * 0.08, y0 + h * 0.15 + b / 2], [x1 - w * 0.08, y0 + h * 0.82 - b / 2]], { w: 1 });
  } else {
    const m = w * 0.13, pw = (w - 3 * m) / 2;
    const rowsH = o.glazed ? [[0.08, 0.46], [0.52, 0.92]] : [[0.07, 0.33], [0.38, 0.6], [0.65, 0.93]];
    rowsH.forEach(([a, b], j) => {
      for (let i = 0; i < 2; i++) {
        const px0 = x0 + m + i * (pw + m), py0 = y0 + h * a, py1 = y0 + h * b;
        const g = [[px0, py0], [px0 + pw, py0], [px0 + pw, py1], [px0, py1]];
        f.path(g, { closed: true, w: 1 });
        if (o.glazed && j === rowsH.length - 1) K.glass(f, g, { gap: 1.1, gap2: 2.4, cross: false });
        else if (f.pxOf(pw) > 8) f.path([[px0 + pw * 0.15, py0 + (py1 - py0) * 0.08], [px0 + pw * 0.85, py0 + (py1 - py0) * 0.08], [px0 + pw * 0.85, py1 - (py1 - py0) * 0.08], [px0 + pw * 0.15, py1 - (py1 - py0) * 0.08]], { closed: true, w: 0 });
      }
    });
  }
  f.circle(x1 - w * 0.14, y0 + h * 0.48, Math.max(w * 0.035, f.mOf(0.8)), { n: 8, w: 1 });
  if (f.tone > 0.3) f.hatch([x0, y0, x1, y1], { angle: 90, gap: 4.6 - 2.4 * f.tone, w: 0 });
  return hole;
}

// a sash window on a lathe surface (round towers): at angle a, height t, w by h meters
export function latheWindow(L, a, t, w, h, o = {}) {
  if (!L.on) return;
  const r = latheR(L, t) || 1;
  L.shape(a, t, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], { closed: true, w: 1 });
  const fr = Math.min(w, h) * 0.12;
  L.shape(a, t, [[-w / 2 + fr, -h / 2 + fr], [w / 2 - fr, -h / 2 + fr], [w / 2 - fr, h / 2 - fr], [-w / 2 + fr, h / 2 - fr]], { closed: true, w: 1 });
  L.shape(a, t, [[-w / 2 - 0.06, -h / 2 - 0.08], [w / 2 + 0.06, -h / 2 - 0.08]], { w: 1 });
  const da = (w / 2 - fr) / r / D2R, dt = (h / 2 - fr) / L.total;
  L.hatch(a - da, a + da, t - dt, t + dt, { gap: 1.15 });
  if (o.bars !== false && L.M.ppm * w > 8) { L.shape(a, t, [[0, -h / 2 + fr], [0, h / 2 - fr]], { w: 1 }); L.shape(a, t, [[-w / 2 + fr, 0], [w / 2 - fr, 0]], { w: 1 }); }
}
// radius of a lathe's profile at t
export function latheR(L, t) {
  const [j, ft] = L._j(t);
  const P = L.profile, q = P[(j + 1) % P.length];
  return Math.abs(P[j][0] + (q[0] - P[j][0]) * ft);
}
// a door on a lathe surface: sill at t0, w by h, arched head
export function latheDoor(L, a, t0, w, h) {
  if (!L.on) return;
  const r = latheR(L, t0) || 1;
  const P = [[-w / 2, 0], [w / 2, 0], ...archPts(-w / 2, w / 2, h - w / 2, 8).map(([x, y]) => [x, y])];
  L.shape(a, t0, P, { closed: true, w: 1 });
  const i = w * 0.12;
  L.shape(a, t0, [[-w / 2 + i, 0], [w / 2 - i, 0], ...archPts(-w / 2 + i, w / 2 - i, h - w / 2, 8)], { closed: true, w: 1 });
  L.shape(a, t0, [[0, 0], [0, h - w / 2]], { w: 1 });
  const da = (w / 2 - i) / r / D2R;
  L.hatch(a - da, a + da, t0 + 0.02 / L.total, t0 + (h - w / 2) / L.total, { gap: 2.2 });
}

// ------------------------------------------------------------------ faceted solids
// a solid of planar facets: the polygon of n sides swept through the profile [[r, z], ...]
// (r the circumradius; r = 0 closes to a point). rot: angle of the first vertex (deg; the
// default puts a flat face toward +x). Faces 'f<j>_<i>' (ring j, side i), caps 'bottom', 'top'.
// S.facet(j, i), S.ring(j) -> world-free local points, S.n
export function polyLathe(M, prof, n, o = {}) {
  const rot = (o.rot ?? 180 / n) * D2R;
  const verts = [], rings = [];
  for (const [r, z] of prof) {
    const row = [];
    if (r < 1e-9) { const k = verts.length; verts.push([0, 0, z]); for (let i = 0; i < n; i++) row.push(k); }
    else for (let i = 0; i < n; i++) { const a = rot + 2 * Math.PI * i / n; row.push(verts.length); verts.push([r * Math.cos(a), r * Math.sin(a), z]); }
    rings.push(row);
  }
  const faces = [];
  for (let j = 0; j + 1 < prof.length; j++) for (let i = 0; i < n; i++) {
    const i2 = (i + 1) % n;
    faces.push({ v: [rings[j][i], rings[j][i2], rings[j + 1][i2], rings[j + 1][i]], name: `f${j}_${i}`, g: o.smooth ? 400 + j : -1 });
  }
  if (prof[0][0] > 1e-9 && o.caps !== false) faces.push({ v: rings[0].slice().reverse(), name: 'bottom' });
  const last = prof.length - 1;
  if (prof[last][0] > 1e-9 && o.caps !== false) faces.push({ v: rings[last].slice(), name: 'top' });
  const S = M._solid(verts, faces, { closed: o.caps !== false, ...o });
  S.n = n;
  S.facet = (j, i) => S.f(`f${j}_${((i % n) + n) % n}`);
  S.vert = (j, i) => verts[rings[j][((i % n) + n) % n]];
  S.angle = (i) => (rot / D2R + (i + 0.5) * 360 / n);   // azimuth of the middle of side i
  return S;
}

// ------------------------------------------------------------------ roof coverings
// cover a sloped face: kind 'slate' | 'tile' | 'shingle' (courses and staggered joints),
// 'seam' (standing seams toward the ridge or apex), 'stripe' (canvas: o.dark hatches it),
// 'glass' (glazing bars). Works on trapezoids and triangles.
export function cover(f, kind, o = {}) {
  if (!f.on || !f.front) return f;
  // work in a frame whose y runs up the slope (face frames on shallow slopes follow the
  // solid's x instead): rotate the outline, draw, rotate back
  const up = [0, 0, 1];
  let dx = up[0] * f.u[0] + up[1] * f.u[1] + up[2] * f.u[2], dy = up[0] * f.v[0] + up[1] * f.v[1] + up[2] * f.v[2];
  const dl = Math.hypot(dx, dy);
  if (dl < 1e-3) { dx = 0; dy = 1; } else { dx /= dl; dy /= dl; }
  const P = f.poly.map(([x, y]) => [x * dy - y * dx, x * dx + y * dy]);
  const back = (x, y) => [x * dy + y * dx, -x * dx + y * dy];
  const ln = (x0, y0, x1, y1, oo) => { const a = back(x0, y0), b = back(x1, y1); f.line(a[0], a[1], b[0], b[1], oo); };
  let y0 = Infinity, y1 = -Infinity;
  for (const p of P) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const lo = { w: 0, pass: 3 };
  const slopeAng = Math.atan2(dy, dx) / D2R;   // up-slope direction in face coords
  if (kind === 'seam' || kind === 'stripe' || kind === 'glass') {
    const sb = spanAt(P, y0 + 1e-6), st = spanAt(P, y1 - 1e-6);
    if (!sb || !st) return f;
    const pitch = kind === 'glass' ? (o.pitch ?? 0.6) : (o.pitch ?? 0.45);
    let k = 1; while (f.pxOf(pitch * k) < 4 && k < 30) k++;
    const n = Math.max(2, Math.round((sb[1] - sb[0]) / (pitch * k)));
    if (kind === 'stripe') {
      if (o.dark) f.hatch(f.poly, { angle: slopeAng, gap: 1.6 + (1 - f.tone) * 0.8, w: 0 });
      else if (f.tone > 0.35) f.hatch(f.poly, { angle: slopeAng, gap: 5 - 2.4 * f.tone, w: 0 });
      return f;
    }
    for (let i = 1; i < n; i++) {
      const t = i / n;
      ln(sb[0] + (sb[1] - sb[0]) * t, y0, st[0] + (st[1] - st[0]) * t, y1, { w: kind === 'glass' ? 1 : 0, pass: kind === 'glass' ? 2 : 3 });
    }
    if (kind === 'glass') {
      const rows = Math.max(1, Math.round((y1 - y0) / (o.rowH ?? 0.7)));
      for (let j = 1; j < rows; j++) { const y = y0 + (y1 - y0) * j / rows; const s = spanAt(P, y); if (s) ln(s[0], y, s[1], y, { w: 0 }); }
    } else if (f.tone > 0.3) f.hatch(f.poly, { angle: slopeAng, gap: 4.6 - 2.2 * f.tone, w: 0 });
    return f;
  }
  const real = kind === 'slate' ? 0.24 : kind === 'shingle' ? 0.2 : 0.17;
  let k = 1; while (f.pxOf(real * k) < 3.0 && k < 60) k++;
  const pitch = real * k;
  const lp = Math.max(f.mOf(6.5), real * 1.6);
  let row = 0;
  for (let y = y0 + pitch; y < y1 - pitch * 0.3; y += pitch, row++) {
    const s = spanAt(P, y);
    if (!s) continue;
    ln(s[0], y, s[1], y, lo);
    if (f.pxOf(pitch) >= 4.2 && row < 200) {
      const off = (row % 2) * lp / 2;
      const s2 = spanAt(P, y - pitch);
      for (let x = s[0] + off + lp * 0.5; x < s[1]; x += lp) if (s2 && x > s2[0] && x < s2[1]) ln(x, y - pitch, x, y, lo);
    }
  }
  if (f.tone > 0.45) f.hatch(f.poly, { angle: slopeAng, gap: 7 - 3.4 * f.tone, w: 0 });
  return f;
}

// a faceted roof: plan polygon n sides, profile [[r, z], ...] from the eave up (r = 0 at the
// apex), covering kind; o.hips: rolls along the hips; o.stripes: alternate facets dark.
export function facetRoof(M, prof, n, kind, o = {}) {
  const S = polyLathe(M, prof, n, { rot: o.rot });
  if (M.decorOn) {
    for (let j = 0; j + 1 < prof.length; j++) for (let i = 0; i < n; i++) {
      const f = S.facet(j, i);
      if (!f.ok) continue;
      if (kind === 'stripe') cover(f, 'stripe', { dark: i % 2 === 0 });
      else cover(f, kind, o);
    }
  }
  if (o.hips) {
    const hr = o.hipR ?? 0.05;
    for (let i = 0; i < n; i++) {
      const pts = prof.map((_, j) => S.vert(j, i));
      M.pipe(pts.map((p) => [p[0], p[1], p[2] + hr * 0.5]), hr, { isect: false });
    }
  }
  return S;
}

// a lathe roof (round: domes, cones, bells): profile [[r, z], ...] from the eave up. ribs:
// meridians as standing seams or ribs; rings: courses.
export function roundRoof(M, prof, o = {}) {
  const S = M.lathe(prof, { sharpDeg: o.sharpDeg ?? 30 });
  if (M.decorOn) {
    const L = S.lat;
    const ribs = o.ribs ?? 16;
    for (let i = 0; i < ribs; i++) L.meridian(i * 360 / ribs + (o.ribPhase ?? 0), o.t0 ?? 0, o.t1 ?? 0.97, { w: o.ribW ?? 1 });
    for (const t of o.rings || []) L.ring(t, { w: 0 });
    if (o.stripes) for (let i = 0; i < ribs; i += 2) L.hatch(i * 360 / ribs, (i + 1) * 360 / ribs, o.t0 ?? 0, o.t1 ?? 0.97, { gap: 1.6 });
    L.shade({ t0: o.t0 ?? 0, t1: o.t1 ?? 0.97, gap: 1.6, gapMax: 5 });
  }
  return S;
}

// gable roof over a rectangle len (x) by w (y) at wall top z with rise; overhangs; kind as
// cover(). Returns { S, ridge: z of the ridge top, eave: z of the eave edge, slopes }
export function gableRoof(M, o = {}) {
  const L = o.len, w = o.w, z = o.z, rise = o.rise, ov = o.over ?? 0.3, ovE = o.overEnd ?? ov, t = o.t ?? 0.12;
  const s = rise / (w / 2);
  const W2 = w / 2 + ov, ze = z - ov * s, zr = z + rise;
  const S = M.extrude([[-W2, ze - t], [0, zr - t * 1.2], [W2, ze - t], [W2, ze], [0, zr], [-W2, ze]], -L / 2 - ovE, L / 2 + ovE, { plane: 'yz' });
  const slopes = [S.f('s3'), S.f('s4')];
  if (M.decorOn) for (const f of slopes) cover(f, o.kind || 'tile', o);
  if (o.ridgeRoll !== false) M.tube([-L / 2 - ovE, 0, zr - t * 0.1], [L / 2 + ovE, 0, zr - t * 0.1], Math.max(0.04, t * 0.45), { isect: false });
  if (M.decorOn) for (const k of ['+x', '-x']) { const f = S.f(k); if (f.on && f.front) f.hatch(f.poly, { angle: 0, gap: 1.6, w: 0 }); }
  return { S, ridge: zr, eave: ze, slope: s, W2 };
}
// the gable-end wall triangle above a box wall (fills the space under a gable roof)
export function gableWall(M, o = {}) {
  const L = o.len, w = o.w, z = o.z, rise = o.rise;
  return M.extrude([[-w / 2, z], [w / 2, z], [0, z + rise]], -L / 2, L / 2, { plane: 'yz' });
}

// a scalloped valance band around a polygon (n sides, circumradius R) hanging from z down by h
export function valance(M, R, n, z, h, o = {}) {
  const k = o.scallops ?? 3, rot = (o.rot ?? 180 / n) * D2R;
  const ap = R * Math.cos(Math.PI / n);
  for (let i = 0; i < n; i++) {
    const a0 = rot + 2 * Math.PI * i / n, a1 = a0 + 2 * Math.PI / n;
    const p0 = [Math.cos(a0) * R, Math.sin(a0) * R], p1 = [Math.cos(a1) * R, Math.sin(a1) * R];
    const pts = [[p0[0], p0[1], z], [p1[0], p1[1], z]];
    // bottom edge, scallops from p1 back to p0
    const m = 6;
    for (let q = k - 1; q >= 0; q--) {
      for (let s = m; s >= 0; s--) {
        const u = (q + s / m) / k;
        const x = p0[0] + (p1[0] - p0[0]) * u, y = p0[1] + (p1[1] - p0[1]) * u;
        const dip = Math.sin(Math.PI * s / m) * h * 0.38;
        pts.push([x, y, z - h * 0.62 - dip]);
      }
    }
    const P = M.plate(pts, { girth: 0.02, isect: false, w: 2 });
    if (M.decorOn && o.dark && i % 2 === 0) { const f = P.f('face'); if (f.ok) f.hatch(f.poly, { angle: 90, gap: 1.6, w: 0 }); }
    void ap;
  }
}

// ------------------------------------------------------------------ small 3D parts
// a flight of solid steps rising toward the origin from +x: n steps of rise and run, width w
export function steps(M, o = {}) {
  const n = o.n ?? 3, rise = o.rise ?? 0.17, run = o.run ?? 0.28, w = o.w ?? 1.2;
  for (let i = 0; i < n; i++) {
    const S = M.box([0, -w / 2, i * rise], [(n - i) * run, w / 2, (i + 1) * rise], { isect: false });
    const f = S.f('+x');
    if (f.on && f.front && f.pxOf(rise) > 4) f.hatch(f.box, { angle: 0, gap: 2.2, w: 0 });
  }
  if (o.cheeks) for (const s of [1, -1]) M.extrude([[0, 0], [n * run, 0], [n * run, rise], [run, n * rise + 0.05], [0, n * rise + 0.05]], s * w / 2, s * (w / 2 + 0.12), { plane: 'xz' });
  return { len: n * run, h: n * rise };
}

// a vase baluster between z0 and z1 (local), radius r
export function baluster(M, z0, z1, r, o = {}) {
  const h = z1 - z0;
  return M.lathe([[r * 0.8, z0], [r * 0.8, z0 + h * 0.08], [r * 0.45, z0 + h * 0.16], [r, z0 + h * 0.42], [r * 0.4, z0 + h * 0.78], [r * 0.6, z0 + h * 0.92], [r * 0.6, z1]], { seg: o.seg ?? 6, isect: false, sharpDeg: 60 });
}
// a balustrade along pts (local, at its foot): handrail, bottom rail and balusters (kind
// 'vase' | 'bar' | 'rail' (posts and three rails)), posts at the corners. o.closed.
export function balustrade(M, pts, o = {}) {
  const h = o.h ?? 1.0, kind = o.kind ?? 'vase', pitch0 = o.pitch ?? (kind === 'vase' ? 0.22 : kind === 'bar' ? 0.13 : 1.0);
  const tr = o.rail ?? 0.06;
  const P = o.closed ? [...pts, pts[0]] : pts;
  const pitch = M.decorOn ? Math.max(pitch0, M.px * (kind === 'vase' ? 4.5 : 3.2)) : pitch0 * 1.5;
  let n = 0;
  for (let i = 0; i + 1 < P.length; i++) {
    const a = P[i], b = P[i + 1];
    M.along(a, b, (L) => {
      M.box([0, -tr * 0.7, h - tr], [L, tr * 0.7, h], { isect: false });
      if (kind !== 'rail') M.box([0, -tr * 0.5, 0], [L, tr * 0.5, tr * 1.2], { isect: false });
      else { M.box([0, -tr * 0.35, h * 0.5 - tr * 0.3], [L, tr * 0.35, h * 0.5 + tr * 0.3], { isect: false }); M.box([0, -tr * 0.35, h * 0.12], [L, tr * 0.35, h * 0.12 + tr * 0.6], { isect: false }); }
      const m = Math.max(1, Math.round(L / pitch));
      for (let k = 1; k < m; k++) {
        const x = L * k / m;
        if (kind === 'vase') M.at(x, 0, 0, () => baluster(M, tr * 1.2, h - tr, o.br ?? 0.055));
        else if (kind === 'bar') M.box([x - 0.012, -0.012, tr * 1.2], [x + 0.012, 0.012, h - tr], { isect: false });
        else M.box([x - tr * 0.3, -tr * 0.3, 0], [x + tr * 0.3, tr * 0.3, h - tr], { isect: false });
        n++;
      }
    });
    if (i < P.length - 1 && !(o.closed === false && i === 0 && o.noFirstPost)) M.at(a[0], a[1], a[2], () => M.box([-tr * 1.1, -tr * 1.1, 0], [tr * 1.1, tr * 1.1, h + tr * 0.4], { isect: false }));
  }
  if (!o.closed) { const b = P[P.length - 1]; M.at(b[0], b[1], b[2], () => M.box([-tr * 1.1, -tr * 1.1, 0], [tr * 1.1, tr * 1.1, h + tr * 0.4], { isect: false })); }
  return n;
}
// a round railing: posts and rails (tori) on a circle of radius R at z
export function ringRail(M, R, z, o = {}) {
  const h = o.h ?? 1.0, r = o.r ?? 0.03, nP = o.posts ?? Math.max(8, Math.round(2 * Math.PI * R / (o.pitch ?? 0.9)));
  M.at(0, 0, z + h, () => M.torus(R, r * 1.3, { isect: false, rings: 6 }));
  M.at(0, 0, z + h * 0.5, () => M.torus(R, r, { isect: false, rings: 6 }));
  if (o.low !== false) M.at(0, 0, z + h * 0.12, () => M.torus(R, r * 0.8, { isect: false, rings: 6 }));
  for (let i = 0; i < nP; i++) {
    const a = 2 * Math.PI * (i + 0.5) / nP;
    M.tube([Math.cos(a) * R, Math.sin(a) * R, z], [Math.cos(a) * R, Math.sin(a) * R, z + h], r, { isect: false, seg: 6 });
  }
  return nP;
}

// a finial: collar, ball, spike. h total height, r ball radius
export function finial(M, o = {}) {
  const h = o.h ?? 1.2, r = o.r ?? h * 0.16;
  const P = [[r * 0.8, 0], [r * 0.8, h * 0.06], [r * 0.4, h * 0.12], [r * 0.4, h * 0.24]];
  const nb = 6;
  for (let i = 0; i <= nb; i++) { const a = -90 + 180 * i / nb; P.push([Math.max(r * 0.12, r * Math.cos(a * D2R)), h * 0.24 + r + r * Math.sin(a * D2R)]); }
  P.push([r * 0.1, h * 0.24 + 2 * r + h * 0.05], [0, h]);
  return M.lathe(P, { isect: false, sharpDeg: 50 });
}

// a gutter along a-b (half round, hung on brackets) and optionally a downpipe to the ground
export function gutter(M, a, b, o = {}) {
  const r = o.r ?? 0.07;
  M.tube(a, b, r, { isect: false });
  const L = len(sub(b, a)), n = Math.max(1, Math.round(L / 0.9));
  for (let i = 0; i <= n; i++) { const p = lerp(a, b, i / n); M.at(p[0], p[1], p[2], () => M.box([-0.015, -r * 1.1, -r * 1.05], [0.015, r * 1.1, -r * 0.8], { isect: false })); }
  if (o.down) {
    const d = o.down; // [x, y, z0 foot]
    const top = o.from === 'a' ? a : b;
    M.pipe([top, [top[0], top[1], top[2] - r * 2], [d[0], d[1], top[2] - r * 4], [d[0], d[1], d[2] + 0.25], [d[0] + (o.shoe ?? 0.18), d[1], d[2] + 0.06]], r * 0.75, { isect: false });
    // pipe clips
    for (let z = d[2] + 0.6; z < top[2] - 0.5; z += 1.0) M.at(d[0], d[1], z, () => M.cyl(r * 1.0, -0.03, 0.03, { isect: false, seg: 8 }));
  }
}

// a brick chimney stack from z0 (below the roof) to z1, w by d, with an oversailing cap and pots
export function chimneyStack(M, o = {}) {
  const w = o.w ?? 0.7, d = o.d ?? 0.55, z0 = o.z0 ?? 0, z1 = o.z1 ?? 1.5, pots = o.pots ?? 2;
  const S = M.box([-w / 2, -d / 2, z0], [w / 2, d / 2, z1]);
  if (M.decorOn) for (const k of ['+x', '-x', '+y', '-y']) { const f = S.f(k); courses(f, f.box, { kind: 'brick' }); }
  M.box([-w / 2 - 0.06, -d / 2 - 0.06, z1 - 0.16], [w / 2 + 0.06, d / 2 + 0.06, z1 - 0.06], { isect: false });
  M.box([-w / 2 - 0.03, -d / 2 - 0.03, z1 - 0.06], [w / 2 + 0.03, d / 2 + 0.03, z1], { isect: false });
  for (let i = 0; i < pots; i++) {
    const x = pots === 1 ? 0 : -w / 2 + w * (i + 0.5) / pots;
    M.at(x, 0, z1, () => M.lathe([[0.11, 0], [0.09, 0.3], [0.1, 0.34], [0.1, 0.38]], { open: true }));
  }
  return S;
}

// ------------------------------------------------------------------ fitted for travel
// a steel base deck: plan polygon (local 2D), from z = 0 to h. Diamond plate on top, a riveted
// edge girder with lightening holes on the sides. Returns the solid.
export function baseDeck(M, plan, h, o = {}) {
  const S = M.extrude(plan, 0, h);
  if (M.decorOn) {
    const top = S.f('+z');
    if (top.on && top.front) {
      const ins = top.mOf(3);
      const holes = o.holes || [];
      top.hatch(top.poly, { angle: 45, gap: 7.5, w: 0, holes });
      top.hatch(top.poly, { angle: -45, gap: 7.5, w: 0, holes });
      void ins;
    }
    for (let i = 0; i < plan.length; i++) {
      const f = S.f('s' + i);
      if (!f.on || !f.front || f.w < 0.3) continue;
      f.line(-f.w / 2, f.h * 0.28, f.w / 2, f.h * 0.28, { w: 0 });
      f.line(-f.w / 2, -f.h * 0.28, f.w / 2, -f.h * 0.28, { w: 0 });
      f.rivets(-f.w / 2 + f.mOf(4), f.h * 0.38, f.w / 2 - f.mOf(4), f.h * 0.38, { pitch: 8 });
      const nh = Math.floor(f.w / (h * 2.2));
      if (f.pxOf(h) > 9) for (let k = 0; k < nh; k++) { const x = -f.w / 2 + f.w * (k + 0.5) / nh; f.circle(x, 0, h * 0.17, { w: 1 }); }
      if (f.tone > 0.3) f.hatch(f.box, { angle: 0, gap: 3.6 - 1.6 * f.tone, w: 0 });
    }
  }
  return S;
}
// round base deck (a drum of plate with a rolled edge)
export function baseDrum(M, R, h) {
  const S = M.cyl(R, 0, h);
  if (M.decorOn) {
    const L = S.lat;
    L.ring(0.3, { w: 0 }); L.ring(0.7, { w: 0 });
    const n = Math.max(12, Math.round(2 * Math.PI * R / (h * 2.4)));
    for (let i = 0; i < n; i++) L.meridian(i * 360 / n, 0.3, 0.7, { w: 0 });
    L.shade({ gap: 1.8, gapMax: 5 });
    const top = S.top;
    if (top.on && top.front) { top.hatch(circlePts(0, 0, R * 0.97, R * 0.97, 32), { angle: 45, gap: 7.5, w: 0 }); top.hatch(circlePts(0, 0, R * 0.97, R * 0.97, 32), { angle: -45, gap: 7.5, w: 0 }); }
  }
  return S;
}

// a tie-down strap from a lug on the building (a, local) to an eye on the deck (b): two plates,
// the strap, a turnbuckle in the middle
export function tieDown(M, a, b, o = {}) {
  const r = o.r ?? 0.025;
  const m = lerp(a, b, 0.5), d = norm(sub(b, a));
  M.tube(a, lerp(a, b, 0.4), r, { isect: false, seg: 6 });
  M.tube(lerp(a, b, 0.6), b, r, { isect: false, seg: 6 });
  M.tube(sub(m, mul(d, len(sub(b, a)) * 0.12)), add(m, mul(d, len(sub(b, a)) * 0.12)), r * 2.3, { isect: false, seg: 8 });
  M.at(b[0], b[1], b[2], () => M.box([-0.08, -0.08, 0], [0.08, 0.08, 0.06], { isect: false }));
  M.at(a[0], a[1], a[2], () => M.sphere(r * 2.2, { isect: false, rings: 6 }));
}

// stays: struts from the deck (feet, local) to a collar on a round shaft (radius r at z)
export function stays(M, feet, r, z, o = {}) {
  const tr = o.r ?? 0.07;
  M.at(0, 0, z, () => M.cyl(r + tr * 1.4, -tr * 3, tr * 3, { isect: false }));
  for (const p of feet) {
    const a = Math.atan2(p[1], p[0]);
    const top = [Math.cos(a) * (r + tr * 1.4), Math.sin(a) * (r + tr * 1.4), z];
    K.strut(M, p, top, tr, { collars: true });
    M.at(p[0], p[1], p[2], () => M.box([-tr * 2, -tr * 2, 0], [tr * 2, tr * 2, tr * 1.5], { isect: false }));
  }
}

// a pair of headlamps looking along +x at the given points, and red tail lamps at -x
export function lamps(M, pts, o = {}) {
  for (const p of pts) M.at(p[0], p[1], p[2], () => M.rz(p[3] || 0, () => K.lamp(M, { r: o.r ?? 0.13 })));
}

// a number plate on a face: double frame and the designation, centered at (x, y), cap height h
export function numberPlate(f, text, x, y, h) {
  if (!f.on || !f.front) return;
  const tw = f.textWidth(text, h) + h * 0.9, th = h * 1.9;
  f.rect(x - tw / 2, y - th / 2, x + tw / 2, y + th / 2, { w: 1 });
  f.rect(x - tw / 2 + h * 0.15, y - th / 2 + h * 0.15, x + tw / 2 - h * 0.15, y + th / 2 - h * 0.15, { w: 0 });
  f.text(text, x, y, h);
}
// a small number plate as a 3D board standing out from a face point (frame at the face via onFace)
export function plateBoard(M, f, x, y, text, h) {
  const tw = (M.font ? M.font(text, { spacing: 0.18 }).width : text.length * 0.8) * h + h * 1.0, th = h * 2.0;
  return M.onFace(f, x, y, () => {
    const B = M.box([0, -tw / 2, -th / 2], [0.03, tw / 2, th / 2], { isect: false });
    const g = B.f('+x');
    if (g.on && g.front) { g.rect(-g.w / 2 + g.mOf(1.2), -g.h / 2 + g.mOf(1.2), g.w / 2 - g.mOf(1.2), g.h / 2 - g.mOf(1.2), { w: 0 }); g.text(text, 0, 0, h); }
    return B;
  });
}

// a small steel driving cab, floor at z = 0, front toward +x: w (y) by d (x) by h
export function driverCab(M, o = {}) {
  const w = o.w ?? 1.5, d = o.d ?? 1.4, h = o.h ?? 1.9;
  const B = M.box([-d / 2, -w / 2, 0], [d / 2, w / 2, h * 0.92], { chamfer: 0 });
  const R = M.box([-d / 2 - 0.08, -w / 2 - 0.08, h * 0.92], [d / 2 + 0.16, w / 2 + 0.08, h], {});
  if (M.decorOn) {
    for (const k of ['+x', '-x', '+y', '-y']) {
      const f = B.f(k);
      if (!f.on || !f.front) continue;
      const wy0 = f.h * 0.02, wy1 = f.h * 0.42;
      if (k === '+x') {
        for (const s of [-1, 1]) K.glass(f, [[s * f.w * 0.04, wy0], [s * f.w * 0.44, wy0], [s * f.w * 0.44, wy1], [s * f.w * 0.04, wy1]], { gap: 0.95, gap2: 2.2, flip: s < 0 });
        f.rivets(-f.w / 2 + f.mOf(3), -f.h * 0.3, f.w / 2 - f.mOf(3), -f.h * 0.3, { pitch: 7 });
      } else if (k === '+y' || k === '-y') {
        const g = [[-f.w * 0.44, wy0], [f.w * 0.1, wy0], [f.w * 0.1, wy1], [-f.w * 0.44, wy1]];
        if (k === '-y') for (const p of g) p[0] = -p[0];
        K.glass(f, g, { gap: 0.95, gap2: 2.2 });
        const dx = k === '+y' ? f.w * 0.28 : -f.w * 0.28;
        f.rect(dx - f.w * 0.15, -f.h / 2 + f.mOf(2), dx + f.w * 0.15, f.h * 0.45, { w: 1 });
        f.hatch([-f.w / 2, -f.h / 2, f.w / 2, -f.h * 0.05], { angle: 90, gap: 2.6 - f.tone, w: 0 });
      } else K.corrugated(f, f.box);
    }
    const t = R.f('+z'); if (t.on) t.rect(-t.w / 2 + t.mOf(3), -t.h / 2 + t.mOf(3), t.w / 2 - t.mOf(3), t.h / 2 - t.mOf(3), { w: 0 });
  }
  // wiper, roof lamp, horn
  M.at(d / 2 + 0.16, w * 0.3, h, () => K.lamp(M, { r: 0.08 }));
  M.at(-d * 0.2, 0, h, () => K.whip(M, { h: 1.4, lean: 12 }));
  return { B, top: h };
}

// a ship's wheel on a pedestal (binnacle), the wheel facing +x; deck at z = 0
export function shipWheel(M, o = {}) {
  const r = o.r ?? 0.45, hz = o.h ?? 1.05;
  M.lathe([[0.16, 0], [0.16, 0.06], [0.09, 0.12], [0.08, hz - 0.12], [0.12, hz - 0.06], [0.12, hz]], { isect: false });
  M.at(0.14, 0, hz, () => {
    M.ry(90, () => M.cyl(0.07, -0.08, 0.1, { isect: false }));
    M.rx(0, () => M.ry(90, () => M.torus(r, r * 0.06, { isect: false, rings: 6 })));
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = 2 * Math.PI * i / n + Math.PI / 8;
      const c = Math.cos(a), s = Math.sin(a);
      M.tube([0, 0, 0], [0, c * r * 1.28, s * r * 1.28], r * 0.035, { isect: false, seg: 6 });
    }
  });
  return { top: hz + r * 1.3 };
}

// the hanging part of a boarding ladder from z = 0 down to z = -h (local), at its foot a
// small landing plate; for ground gear h reaches the ground
export function boardingLadder(M, h, o = {}) {
  const w = o.w ?? 0.5;
  M.at(0, 0, -h, () => K.ladder(M, { h: h + 0.9, w }));
  for (const s of [1, -1]) M.box([-0.14, s * w / 2 - 0.03, -0.06], [0.03, s * w / 2 + 0.03, 0.0], { isect: false });
  return { foot: M.W([0.7, 0.9, -h]) };
}
