// classes/parts-ground.js: shared parts for the ground family (rover, crawler, hauler, walker,
// monowheel). Everything builds at the current frame's origin like the kit, +x forward,
// +z up, and only draws decor in the drawing pass. No random draws in here unless the
// caller passes the values in, so both build passes stay in step.

import * as K from '../kit.js';
import { dot, sub, add, mul, norm, cross, len, lerp, D2R, circlePts } from '../geom.js';

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ------------------------------------------------------------------ 2D helpers
// world point -> 2D face coordinates (meters) of a planar face handle
export function fxy(f, P) {
  const d = sub(P, f.o);
  return [dot(d, f.u), dot(d, f.v)];
}
// inset a convex polygon by d (meters); keeps orientation
export function inset(poly, d) {
  const n = poly.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const sg = area > 0 ? 1 : -1;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const nx = -dy * sg, ny = dx * sg; // inward normal
    lines.push([a[0] + nx * d, a[1] + ny * d, dx, dy]);
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const A = lines[(i + n - 1) % n], B = lines[i];
    const den = A[2] * B[3] - A[3] * B[2];
    if (Math.abs(den) < 1e-9) { out.push([B[0], B[1]]); continue; }
    const t = ((B[0] - A[0]) * B[3] - (B[1] - A[1]) * B[2]) / den;
    out.push([A[0] + A[2] * t, A[1] + A[3] * t]);
  }
  return out;
}
// clip a polygon to the half plane y >= y0 (keep above) or y <= y0 (keep below)
export function clipY(poly, y0, keepAbove = true) {
  const out = [];
  const inside = (p) => (keepAbove ? p[1] >= y0 : p[1] <= y0);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if (inside(a)) out.push(a);
    if (inside(a) !== inside(b)) { const t = (y0 - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, y0]); }
  }
  return out;
}
export function clipX(poly, x0, keepRight = true) {
  return clipY(poly.map(([x, y]) => [y, x]), x0, keepRight).map(([y, x]) => [x, y]);
}

// ------------------------------------------------------------------ surfaces
// fill a rectangular wall with a panel grid. o: { cell (m), rows, kind(r) -> kind name or
// 'skip' or ['stencil', text], gap px, rect }
export function skin(f, o = {}) {
  if (!f.ok) return [];
  const R = o.rect || f.box;
  const W = R[2] - R[0], H = R[3] - R[1];
  const n = Math.max(1, Math.round(W / (o.cell ?? 1.3)));
  const m = o.rows ?? Math.max(1, Math.round(H / (o.cellH ?? 1.2)));
  const g = f.grid(n, m, { gap: o.gap ?? 2.4, rect: R });
  if (!f.on) return g;
  for (const r of g) {
    const k = o.kind ? o.kind(r, n, m) : 'corrugated';
    if (!k || k === 'skip') continue;
    if (Array.isArray(k) && k[0] === 'stencil') {
      K.frame(f, r, { inset: 1.6 });
      K.stencil(f, k[1], (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, Math.min((r[3] - r[1]) * 0.42, (r[2] - r[0]) * 0.8 / Math.max(1, k[1].length * 0.75)));
      continue;
    }
    K.fill(f, r, k, { flip: (r.i + r.j) % 2 === 1, mullion: r.i % 2 ? 'h' : '+' });
  }
  return g;
}

// glazed panes in a rect of a face: n x m panes with mullions and dark glass
export function glazing(f, r, n = 3, m = 1, o = {}) {
  if (!f.on) return;
  const fr = f.mOf(o.frame ?? 2.6);
  f.rect(r, { w: 1 });
  const ri = [r[0] + fr, r[1] + fr, r[2] - fr, r[3] - fr];
  if (ri[2] <= ri[0] || ri[3] <= ri[1]) return;
  const g = f.grid(n, m, { rect: ri, gap: o.mullion ?? 3.2, edge: 0 });
  for (const p of g) {
    const poly = [[p[0], p[1]], [p[2], p[1]], [p[2], p[3]], [p[0], p[3]]];
    K.glass(f, poly, { angle: o.angle ?? 62, flip: o.flip });
  }
}

// dark glass in an arbitrary polygon with an inset frame line
export function pane(f, poly, o = {}) {
  if (!f.on || poly.length < 3) return;
  f.path(poly, { closed: true, w: 1 });
  const p2 = inset(poly, f.mOf(o.frame ?? 2.2));
  K.glass(f, p2, { angle: o.angle ?? 62, flip: o.flip });
}

// corrugated region in an arbitrary polygon (frame line + clipped hatch)
export function corrPoly(f, poly, o = {}) {
  if (!f.on || poly.length < 3) return;
  f.path(poly, { closed: true, w: 1 });
  const p2 = inset(poly, f.mOf(1.8));
  f.hatch(p2, { angle: o.dir === 'h' ? 0 : 90, gap: o.gap ?? (2.7 - f.tone), w: 0 });
}

// ------------------------------------------------------------------ wheels
// a big rover tire on the kit wheel, with chevron or block tread and crown shading.
// o: { r, w, tread: 'chevron' | 'block' | 'ribs', hub }. Returns the kit wheel solid.
export function bigWheel(M, o = {}) {
  const R = o.r ?? 0.9, W = o.w ?? R * 0.6;
  const S = K.wheel(M, { r: R, w: W, hub: o.hub ?? R * 0.52, hubs: o.hubs ?? 'seen' });
  if (M.decorOn && S && S.lat) {
    const L = S.lat;
    const c0 = L.cum[4] / L.total, c1 = L.cum[5] / L.total, tm = (c0 + c1) / 2;
    const crown = (L.cum[7] - L.cum[2]);
    const n = Math.max(14, Math.min(40, Math.round(R * 2 * Math.PI / Math.max(0.16, R * 0.2))));
    const tread = o.tread || 'chevron';
    for (let i = 0; i < n; i++) {
      const a = (i + 0.5) * 360 / n;
      const d = R * 2 * Math.PI / n;
      if (tread === 'chevron') {
        L.shape(a, tm, [[-d * 0.35, -crown * 0.48], [d * 0.2, -crown * 0.05], [d * 0.2, crown * 0.05], [-d * 0.35, crown * 0.48]], { w: 1 });
      } else if (tread === 'block') {
        const s = i % 2 ? 1 : -1;
        L.shape(a, tm + s * crown * 0.22 / L.total, [[-d * 0.25, -crown * 0.2], [d * 0.25, -crown * 0.2], [d * 0.25, crown * 0.2], [-d * 0.25, crown * 0.2]], { closed: true, w: 1 });
      } else L.shape(a, tm, [[0, -crown * 0.5], [0, crown * 0.5]], { w: 1 });
    }
    L.shade({ t0: c0, t1: c1, gap: 1.6, gapMax: 4, threshold: 0.45 });
    // sidewall bead rings
    if (L.cum.length > 12) {
      L.ring((L.cum[9] * 0.55 + L.cum[10] * 0.45) / L.total, { w: 0 });
      L.ring((L.cum[11] * 0.45 + L.cum[12] * 0.55) / L.total, { w: 0 });
    }
  }
  return S;
}

// fender: an arc band over a wheel (local frame at the wheel center), from aA to aB degrees
// measured from +x toward +z, covering width w along y, clearance c
export function fender(M, o = {}) {
  const R = o.r ?? 0.9, w = o.w ?? 0.6, c = o.c ?? R * 0.12, t = o.t ?? Math.max(0.04, R * 0.05);
  const a0 = o.a0 ?? 15, a1 = o.a1 ?? 165, n = 12;
  const outer = [], inner = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + (a1 - a0) * i / n) * D2R;
    outer.push([Math.cos(a) * (R + c + t), Math.sin(a) * (R + c + t)]);
    inner.push([Math.cos(a) * (R + c), Math.sin(a) * (R + c)]);
  }
  const prof = [...outer, ...inner.reverse()];
  const S = M.extrude(prof, -w / 2, w / 2, { plane: 'xz', smoothDeg: 20, isect: false });
  return S;
}

// coil spring and damper between two local points (a lower, b upper)
export function springStrut(M, a, b, r, o = {}) {
  const d = sub(b, a), L = len(d);
  K.strut(M, a, lerp(a, b, 0.62), r * 0.45, { collars: false });
  M.tube(lerp(a, b, 0.5), b, r * 0.7, { isect: false });
  K.ball(M, a, r * 0.75);
  K.ball(M, b, r * 0.75);
  // the coil
  if (o.coil !== false && L > r * 6) {
    const turns = o.turns ?? Math.max(4, Math.round(L / (r * 1.3)));
    M.along(lerp(a, b, 0.12), lerp(a, b, 0.86), (l) => {
      const pts = [];
      const steps = turns * 8;
      for (let i = 0; i <= steps; i++) {
        const q = i / steps, ang = q * turns * 2 * Math.PI;
        pts.push([q * l, Math.cos(ang) * r * 1.25, Math.sin(ang) * r * 1.25]);
      }
      M.pipe(pts, r * 0.16, { isect: false, smoothBends: true, seg: 6 });
    });
  }
}

// leaf spring pack along x, centered, on top of an axle at z = 0, ends rising to eyes
export function leafSpring(M, o = {}) {
  const L = o.len ?? 1.6, n = o.n ?? 4, t = o.t ?? 0.035, w = o.w ?? 0.09;
  for (let i = 0; i < n; i++) {
    const l = L * (1 - i * 0.18);
    const z = (n - 1 - i) * t * 1.05;
    const sag = L * 0.06;
    const pts = [];
    const k = 6;
    for (let j = 0; j <= k; j++) { const x = -l / 2 + l * j / k; const u = x / (L / 2); pts.push([x, sag * u * u + z]); }
    const prof = [...pts.map(([x, z2]) => [x, z2 + t]), ...pts.slice().reverse()];
    M.extrude(prof, -w / 2, w / 2, { plane: 'xz', smoothDeg: 25, isect: false });
  }
  for (const s of [1, -1]) M.at(s * L / 2, 0, L * 0.06 + n * t + 0.02, () => M.rx(90, () => M.cyl(t * 1.6, -w * 0.7, w * 0.7, { isect: false })));
  // U bolts
  for (const s of [1, -1]) M.box([s * w * 0.9 - 0.02, -w * 0.7, -0.08], [s * w * 0.9 + 0.02, w * 0.7, n * t + 0.05], { isect: false });
}

// ------------------------------------------------------------------ equipment
// camera mast: a tube mast of height h with a pan-tilt head carrying two cameras
export function cameraMast(M, o = {}) {
  const h = o.h ?? 2.5, s = o.s ?? 0.35, yaw = o.yaw ?? 0;
  M.cyl(s * 0.45, 0, s * 0.18);
  K.strut(M, [0, 0, s * 0.18], [0, 0, h], s * 0.14, { mid: true });
  // fold hinge
  M.at(0, 0, h * 0.35, () => M.rx(90, () => M.cyl(s * 0.24, -s * 0.22, s * 0.22, { isect: false })));
  return M.at(0, 0, h, () => M.rz(yaw, () => {
    M.cyl(s * 0.3, 0, s * 0.25);
    const B = M.boxc([0, 0, s * 0.55], [s * 0.9, s * 1.9, s * 0.6]);
    for (const k of ['+x', '-x', '+y', '-y']) { const f = B.f(k); if (f.on) K.frame(f, f.box, { inset: 1.4 }); }
    for (const y of [-s * 0.62, s * 0.62]) {
      M.at(s * 0.45, y, s * 0.55, () => M.ry(90, () => {
        M.cyl(s * 0.2, 0, s * 0.28);
        const C = M.cyl(s * 0.24, s * 0.28, s * 0.36);
        if (C.top.on) { C.top.circle(0, 0, s * 0.15, { w: 1 }); C.top.hatch(circlePts(0, 0, s * 0.14, s * 0.14, 16), { angle: 60, gap: 1.0, w: 0 }); }
      }));
    }
    // a small sun shade on top
    M.box([-s * 0.5, -s * 1.05, s * 0.85], [s * 0.55, s * 1.05, s * 0.9], { isect: false });
    return [0, 0, s * 0.9];
  }));
}

// robotic arm: turret at the origin, shoulder, two links in the xz plane toward +x, tool
// o: { a1 (shoulder deg up from +x), a2 (elbow deg, relative, negative bends down), l1, l2,
// r (link half width), tool: 'scoop' | 'drill' | 'claw' }
export function arm(M, o = {}) {
  const l1 = o.l1 ?? 2, l2 = o.l2 ?? 1.8, r = o.r ?? 0.12;
  const a1 = (o.a1 ?? 50) * D2R, a2 = a1 + (o.a2 ?? -110) * D2R;
  M.cyl(r * 2.4, 0, r * 1.2);
  M.cyl(r * 2.0, r * 1.2, r * 2.4);
  const S = [0, 0, r * 3.4];
  for (const s of [1, -1]) M.box([-r * 1.3, s * r * 1.2, r * 2.2], [r * 1.3, s * r * 1.9, r * 4.4], { isect: false });
  M.at(S[0], S[1], S[2], () => M.rx(90, () => M.cyl(r * 1.1, -r * 2.0, r * 2.0, { isect: false })));
  const E = [S[0] + Math.cos(a1) * l1, 0, S[2] + Math.sin(a1) * l1];
  const T = [E[0] + Math.cos(a2) * l2, 0, E[2] + Math.sin(a2) * l2];
  // links: boxes along the bones
  const link = (a, b, w, h) => M.along(a, b, (L) => {
    const B = M.box([-r * 0.3, -w / 2, -h / 2], [L + r * 0.3, w / 2, h / 2], { isect: false });
    for (const k of ['+y', '-y']) { const f = B.f(k); if (f.on) { f.rect(-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2), { w: 0 }); f.rivets(-f.w / 2 + f.mOf(5), 0, f.w / 2 - f.mOf(5), 0, { pitch: 9 }); } }
    return B;
  }, [0, 1, 0]);
  link(S, E, r * 1.6, r * 1.8);
  link(E, T, r * 1.2, r * 1.3);
  M.at(E[0], E[1], E[2], () => M.rx(90, () => M.cyl(r * 0.95, -r * 1.1, r * 1.1, { isect: false })));
  // hydraulic ram from the turret to the upper arm
  const ra = [-r * 1.2, r * 1.0, r * 2.2];
  const rb = lerp(S, E, 0.55); rb[1] = r * 1.0;
  M.tube(ra, lerp(ra, rb, 0.6), r * 0.42, { isect: false });
  M.tube(lerp(ra, rb, 0.5), rb, r * 0.24, { isect: false });
  // tool at T, pointing along the forearm
  const dir = [Math.cos(a2), 0, Math.sin(a2)];
  const tool = o.tool || 'scoop';
  M.at(T[0], T[1], T[2], () => M.rx(90, () => M.cyl(r * 0.8, -r * 0.9, r * 0.9, { isect: false })));
  let tip = T;
  M.along(T, add(T, dir), () => {
    if (tool === 'drill') {
      M.box([0, -r * 0.9, -r * 0.9], [r * 3, r * 0.9, r * 0.9]);
      M.ry(90, () => {
        M.cyl(r * 0.55, r * 3, r * 3.6);
        const D = M.cyl(r * 0.22, r * 3.6, r * 9);
        if (M.decorOn) for (let i = 0; i < 9; i++) D.lat.shape(i * 40, 0.1 + i * 0.09, [[-r * 0.3, -r * 0.4], [r * 0.3, r * 0.4]], { w: 1 });
        M.cone(r * 0.22, 0.001, r * 9, r * 9.6);
      });
      tip = M.W([r * 9.6, 0, 0]);
    } else if (tool === 'claw') {
      M.box([0, -r * 0.8, -r * 0.8], [r * 1.8, r * 0.8, r * 0.8]);
      for (const s of [1, -1]) M.pipe([[r * 1.8, 0, s * r * 0.5], [r * 3, 0, s * r * 1.1], [r * 4, 0, s * r * 0.3]], r * 0.18, { isect: false });
      tip = M.W([r * 4, 0, 0]);
    } else {
      // scoop: an open box
      const w = r * 2.6, d = r * 3.2, h = r * 1.6;
      M.box([0, -r * 0.6, -r * 0.6], [r * 1.0, r * 0.6, r * 0.6]);
      M.box([r * 1.0, -w / 2, -h], [r * 1.0 + d, w / 2, -h + r * 0.15], { isect: false });
      M.box([r * 1.0, -w / 2, -h], [r * 1.0 + r * 0.15, w / 2, h * 0.4], { isect: false });
      for (const s of [1, -1]) M.extrude([[r * 1.0, -h], [r * 1.0 + d, -h], [r * 1.0, h * 0.4]], s * w / 2, s * (w / 2 - r * 0.12), { plane: 'xz', isect: false });
      for (let i = 0; i < 4; i++) { const y = -w / 2 + w * (i + 0.5) / 4; M.extrude([[r * 1.0 + d, -h], [r * 1.0 + d + r * 0.5, -h + r * 0.07], [r * 1.0 + d, -h + r * 0.15]], y - r * 0.12, y + r * 0.12, { plane: 'xz', isect: false }); }
      tip = M.W([r * 1.0 + d, 0, -h]);
    }
  }, [0, 0, 1]);
  return { shoulder: S, elbow: E, wrist: T, tip };
}

// roof rack: a tube frame len x wid at the origin (deck at z = 0), rails h high, with
// cargo placed by the caller. Returns the deck height of the rack floor.
export function rack(M, o = {}) {
  const L = o.len ?? 3, W = o.w ?? 2, h = o.h ?? 0.35, r = o.r ?? 0.04, z0 = o.z0 ?? 0.15;
  const x0 = -L / 2, x1 = L / 2, y0 = -W / 2, y1 = W / 2;
  // feet
  const nf = Math.max(2, Math.round(L / 1.2) + 1);
  for (let i = 0; i < nf; i++) for (const y of [y0, y1]) { const x = x0 + (x1 - x0) * i / (nf - 1); M.boxc([x, y, z0 / 2], [r * 3, r * 3, z0], { isect: false }); }
  // floor rails and slats
  M.pipe([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z0]], r, { isect: false });
  const ns = Math.max(2, Math.round(L / 0.5));
  for (let i = 1; i < ns; i++) { const x = x0 + (x1 - x0) * i / ns; M.tube([x, y0, z0], [x, y1, z0], r * 0.7, { isect: false }); }
  // side rails
  K.railing(M, [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], { h, r: r * 0.8, posts: 0.9 });
  return z0 + r;
}

// cable drum (spool) on an A-frame, axis along y, at the origin; o: { r, w }
export function cableDrum(M, o = {}) {
  const R = o.r ?? 0.9, W = o.w ?? 1.2;
  const zc = R * 1.15;
  M.at(0, 0, zc, () => {
    const C = M.rx(90, () => M.cyl(R * 0.55, -W / 2, W / 2, { isect: false }));
    if (M.decorOn) {
      // wound cable: rings along the drum and a dark side
      const nT = Math.max(4, Math.round(W / Math.max(0.05, M.px * 3)));
      for (let i = 1; i < Math.min(nT, 40); i++) C.lat.ring(i / Math.min(nT, 40), { w: 0 });
      C.lat.shade({ gap: 1.4, gapMax: 3 });
    }
    for (const s of [1, -1]) {
      const F = M.rx(90, () => M.cyl(R, s > 0 ? W / 2 : -W / 2 - R * 0.06, s > 0 ? W / 2 + R * 0.06 : -W / 2, { isect: false }));
      for (const fc of [F.top, F.bottom]) if (fc.on) { fc.circle(0, 0, R * 0.62, { w: 1 }); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; fc.line(Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2, Math.cos(a) * R * 0.88, Math.sin(a) * R * 0.88, { w: 1 }); } fc.circle(0, 0, R * 0.2, { w: 1 }); }
    }
    M.rx(90, () => M.cyl(R * 0.12, -W / 2 - R * 0.35, W / 2 + R * 0.35, { isect: false }));
  });
  // A-frames
  for (const s of [1, -1]) {
    const y = s * (W / 2 + R * 0.25);
    M.tube([-R * 0.9, y, 0], [0, y, zc], R * 0.07, {});
    M.tube([R * 0.9, y, 0], [0, y, zc], R * 0.07, {});
    M.box([-R, y - R * 0.08, 0], [R, y + R * 0.08, R * 0.08], { isect: false });
  }
  return { zc, top: [0, 0, zc + R * 0.55] };
}

// towed instrument sled on two skids, nose toward +x, at the origin on the ground
export function sled(M, o = {}) {
  const L = o.len ?? 2.4, W = o.w ?? 1.4, h = o.h ?? 0.35;
  for (const s of [1, -1]) {
    const y = s * W * 0.42;
    M.pipe([[-L / 2, y, 0.06], [L * 0.32, y, 0.06], [L * 0.45, y, 0.14], [L / 2, y, 0.3]], 0.05, { isect: false });
    for (const x of [-L * 0.3, L * 0.2]) M.tube([x, y, 0.08], [x, y, h], 0.035, { isect: false });
  }
  M.tube([L / 2, -W * 0.42, 0.3], [L / 2, W * 0.42, 0.3], 0.04, { isect: false });
  const D = M.box([-L * 0.42, -W / 2, h], [L * 0.32, W / 2, h + 0.06]);
  if (D.f('+z').on) { const f = D.f('+z'); f.hatch(f.box, { angle: 90, gap: 2.4, w: 0 }); }
  return { deck: h + 0.06, hitch: [L / 2, 0, 0.3] };
}

// accordion tunnel between two units along x from x0 to x1, radius r, centered (y 0, z 0)
export function bellows(M, x0, x1, r, o = {}) {
  const n = o.folds ?? Math.max(4, Math.round((x1 - x0) / (r * 0.18)));
  const prof = [];
  for (let i = 0; i <= n * 2; i++) prof.push([i % 2 ? r * 0.88 : r, x0 + (x1 - x0) * i / (n * 2)]);
  const S = M.lathe(prof, { axis: 'x', sharpDeg: 10, caps: true });
  if (M.decorOn) S.lat.shade({ gap: 1.6, gapMax: 4 });
  for (const x of [x0, x1]) M.at(x, 0, 0, () => M.ry(90, () => M.cyl(r * 1.08, -0.06, 0.06, { isect: false })));
  return S;
}

// drawbar between two points with eyes at both ends
export function drawbar(M, a, b, r = 0.06) {
  M.tube(a, b, r, { isect: false });
  K.ball(M, a, r * 1.6);
  K.ball(M, b, r * 1.6);
}

// a bar of n lamps along y at the origin, pointing +x
export function lampBar(M, o = {}) {
  const w = o.w ?? 2, n = o.n ?? 4, r = o.r ?? 0.1;
  M.tube([0, -w / 2, 0], [0, w / 2, 0], r * 0.35, { isect: false });
  for (const s of [1, -1]) M.tube([0, s * w * 0.45, 0], [0, s * w * 0.45, -(o.post ?? r * 2.5)], r * 0.3, { isect: false });
  for (let i = 0; i < n; i++) { const y = -w / 2 + w * (i + 0.5) / n; M.at(0, y, r * 1.4, () => K.lamp(M, { r })); }
}


// ------------------------------------------------------------------ buildings and cargo
// a small hut with a gable roof, door and windows on the +x end or the +y side, a chimney,
// a porch with posts and steps. At the origin, floor at z = 0, ridge along x.
// o: { len, w, h, rise, porch: true, doorSide: 1 | -1 (which y side gets the door), reg }
export function hut(M, o = {}) {
  const L = o.len ?? 5, W = o.w ?? 3.6, H = o.h ?? 2.6, rise = o.rise ?? W * 0.3, ds = o.doorSide ?? 1;
  const B = M.box([-L / 2, -W / 2, 0], [L / 2, W / 2, H]);
  const ev = 0.3, t = 0.12;
  const Rf = M.extrude([[-W / 2 - ev, H - 0.1], [W / 2 + ev, H - 0.1], [W / 2 + ev, H + t - 0.1], [0, H + rise + t], [-W / 2 - ev, H + t - 0.1]], -L / 2 - ev, L / 2 + ev, { plane: 'yz' });
  for (const k of ['s2', 's3']) { const f = Rf.f(k); if (f.on) { f.hatch(f.box, { angle: 90, gap: 2.4 - f.tone * 0.8, w: 0 }); const n = Math.max(2, Math.round(f.w / 1.0)); for (let i = 1; i < n; i++) f.line(-f.w / 2 + f.w * i / n, -f.h / 2, -f.w / 2 + f.w * i / n, f.h / 2, { w: 1 }); } }
  // gable ends: boards
  const doorFace = B.f(ds > 0 ? '+y' : '-y');
  for (const k of ['+x', '-x', '+y', '-y']) {
    const f = B.f(k);
    if (!f.on) continue;
    f.hatch(f.box, { angle: 0, gap: 3.2 - f.tone, w: 0 });
    const nWin = Math.max(1, Math.round(f.w / 2.2));
    for (let i = 0; i < nWin; i++) {
      const x = -f.w / 2 + f.w * (i + 0.5) / nWin;
      if (f === doorFace && i === Math.floor(nWin / 2)) continue;
      const ww = Math.min(0.9, f.w / nWin * 0.5), wh = 0.85;
      const r = [x - ww / 2, H * 0.12, x + ww / 2, H * 0.12 + wh];
      f.rect(r[0] - 0.08, r[1] - 0.08, r[2] + 0.08, r[3] + 0.08, { w: 1 });
      K.glass(f, [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]], { cross: false });
      f.line((r[0] + r[2]) / 2, r[1], (r[0] + r[2]) / 2, r[3], { w: 1 });
      f.line(r[0], (r[1] + r[3]) / 2, r[2], (r[1] + r[3]) / 2, { w: 1 });
    }
  }
  for (const k of ['+x', '-x']) { const f = Rf.f(k); if (f.on) f.hatch(f.box, { angle: 90, gap: 3, w: 0 }); }
  // door
  const dx = 0, dw = 0.9, dh = 2.0;
  if (doorFace.on) { const fx = 0; void fx; }
  K.door(M, doorFace, dx, -H / 2 + dh / 2 + 0.05, dw, dh, {});
  // chimney through the roof on the far slope
  const cx = -L * 0.3, cy = -ds * W * 0.22;
  M.at(cx, cy, H * 0.6, () => K.stack(M, { r: 0.16, h: rise + 1.4 }));
  M.at(cx, cy, H * 0.6 + rise + 1.4, () => M.cone(0.26, 0.05, 0.05, 0.3, { isect: false }));
  // porch
  let porch = null;
  if (o.porch !== false) {
    const pd = 1.4, pw = Math.min(L * 0.6, 3.2), ph = 0.25;
    const y0 = ds * W / 2;
    M.box([-pw / 2, ds > 0 ? y0 : y0 - pd, 0], [pw / 2, ds > 0 ? y0 + pd : y0, ph]);
    for (const x of [-pw / 2 + 0.1, pw / 2 - 0.1]) M.tube([x, y0 + ds * (pd - 0.1), ph], [x, y0 + ds * (pd - 0.1), H - 0.05], 0.05, {});
    M.plate([[-pw / 2 - 0.1, y0, H - 0.05], [pw / 2 + 0.1, y0, H - 0.05], [pw / 2 + 0.1, y0 + ds * (pd + 0.15), H - 0.3], [-pw / 2 - 0.1, y0 + ds * (pd + 0.15), H - 0.3]]);
    K.railing(M, [[-pw / 2 + 0.05, y0 + ds * 0.05, ph], [-pw / 2 + 0.05, y0 + ds * (pd - 0.05), ph], [-0.5, y0 + ds * (pd - 0.05), ph]], { h: 0.9, posts: 0.7 });
    porch = [0.4, y0 + ds * pd, ph];
  }
  return { body: B, roof: Rf, porch, ridge: H + rise + t };
}

// observatory: drum with ribs, a dome with an open slit, a ring walkway with railing
export function observatory(M, o = {}) {
  const r = o.r ?? 3, h = o.h ?? r * 0.8, slit = o.slit ?? 0;
  const D = M.cyl(r, 0, h);
  if (M.decorOn) {
    const L = D.lat;
    const n = Math.max(12, Math.round(2 * Math.PI * r / 1.0));
    for (let i = 0; i < n; i++) L.meridian(i * 360 / n, 0, 1, { w: 1 });
    L.ring(0.5, { w: 1 });
    L.shade({ gap: 1.8, gapMax: 5 });
  }
  M.at(0, 0, h, () => M.torus(r * 1.0, 0.07, { isect: false }));
  const S = M.at(0, 0, h + 0.07, () => {
    const prof = [];
    for (let i = 0; i <= 12; i++) { const a = 90 * i / 12 * D2R; prof.push([Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02]); }
    prof[12][0] = 0;
    return M.lathe(prof, { sharpDeg: 30 });
  });
  if (M.decorOn) {
    const L = S.lat;
    const sw = (r * 0.42) / (r * 1.02) / D2R; // slit half width in degrees at the base
    for (const a of [slit - sw, slit + sw]) L.meridian(a, 0.04, 0.97, { w: 2 });
    for (const a of [slit - sw * 1.35, slit + sw * 1.35]) L.meridian(a, 0.04, 0.95, { w: 1 });
    L.hatch(slit - sw * 0.92, slit + sw * 0.92, 0.05, 0.94, { gap: 0.9 });
    for (let i = 0; i < 16; i++) { const a = slit + 180 + (i - 7.5) * 18; L.meridian(a, 0.02, 0.85, { w: 0 }); }
    for (const t of [0.3, 0.6]) L.ring(t, { w: 0 });
    L.shade({ t0: 0.02, t1: 0.9, gap: 1.8, gapMax: 5 });
  }
  // the ring walkway at mid height
  const zw = h * 0.45, rw = r + 0.9;
  M.at(0, 0, zw, () => M.lathe([[r, -0.12], [rw, -0.12], [rw, 0], [r, 0]], { loop: true, isect: false }));
  const pts = [];
  for (let i = 0; i <= 32; i++) { const a = 2 * Math.PI * i / 32; pts.push([Math.cos(a) * (rw - 0.05), Math.sin(a) * (rw - 0.05), zw]); }
  K.railing(M, pts, { h: 0.9, posts: 1.2 });
  for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; M.tube([Math.cos(a) * rw * 0.98, Math.sin(a) * rw * 0.98, zw - 0.12], [Math.cos(a) * r, Math.sin(a) * r, zw - 1.0], 0.05, { isect: false }); }
  return { drum: D, dome: S, top: h + r };
}

// drilling derrick: tapered four-leg lattice tower, platforms, crown block, traveling block
export function derrick(M, o = {}) {
  const h = o.h ?? 18, b = o.base ?? 4, t = o.top ?? b * 0.28, r = o.r ?? 0.09;
  const n = Math.max(4, Math.round(h / (b * 0.7)));
  const c = (z) => { const q = b / 2 + (t / 2 - b / 2) * z / h; return [[q, q], [-q, q], [-q, -q], [q, -q]]; };
  for (let i = 0; i < 4; i++) { const a = c(0)[i], bb = c(h)[i]; M.tube([a[0], a[1], 0], [bb[0], bb[1], h], r, {}); }
  for (let k = 0; k <= n; k++) {
    const z0 = h * k / n, p0 = c(z0);
    for (let i = 0; i < 4; i++) {
      const a = p0[i], bb = p0[(i + 1) % 4];
      M.tube([a[0], a[1], z0], [bb[0], bb[1], z0], r * 0.6, { isect: false });
      if (k < n) {
        const z1 = h * (k + 1) / n, p1 = c(z1);
        const f = (k + i) % 2 === 0;
        M.tube([f ? a[0] : bb[0], f ? a[1] : bb[1], z0], [f ? p1[(i + 1) % 4][0] : p1[i][0], f ? p1[(i + 1) % 4][1] : p1[i][1], z1], r * 0.45, { isect: false });
      }
    }
  }
  // crown block and a gin pole
  M.box([-t * 0.8, -t * 0.8, h], [t * 0.8, t * 0.8, h + 0.6]);
  M.at(0, 0, h + 0.6, () => M.rx(90, () => M.cyl(t * 0.35, -t * 0.4, t * 0.4, { isect: false })));
  // monkey board
  const zm = h * 0.62, qm = b / 2 + (t / 2 - b / 2) * 0.62;
  M.box([qm, -qm, zm - 0.08], [qm + 1.0, qm, zm]);
  K.railing(M, [[qm, -qm, zm], [qm + 1.0, -qm, zm], [qm + 1.0, qm, zm], [qm, qm, zm]], { h: 0.9, posts: 1.0 });
  // traveling block and lines
  if (o.block === false) return { top: h + 0.6 };
  const zb = h * (o.blockAt ?? 0.45);
  M.box([-0.3, -0.25, zb], [0.3, 0.25, zb + 1.0]);
  for (const y of [-0.12, 0.0, 0.12]) M.line([[0, y, h], [0, y, zb + 1.0]], { w: 1, pass: 1 });
  M.tube([0, 0, zb], [0, 0, zb - 0.6], 0.08, { isect: false });
  M.tube([0, 0, zb - 0.6], [0, 0, 0.05], 0.06, { isect: false });
  return { top: h + 0.6, block: zb };
}

// a small boat on its keel (keel at z = 0), bow toward +x. o: { len, beam, depth, cabin }
export function boat(M, o = {}) {
  const L = o.len ?? 8, B = o.beam ?? L * 0.32, D = o.depth ?? B * 0.45;
  const N = 9, deck = [], keel = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N; // 0 stern .. 1 bow
    const x = -L / 2 + L * u;
    const hb = B / 2 * Math.min(1, 1.05 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, u - 0.45) / 0.55, 2)))) * (u < 0.05 ? 0.92 : 1);
    deck.push([x, Math.max(0.02, hb)]);
    const xk = -L / 2 + 0.06 * L + (L * 0.8) * u;
    keel.push([xk, Math.max(0.02, hb * 0.32)]);
  }
  const ring = (pts, z) => [...pts.map(([x, y]) => [x, -y, z]), ...pts.slice().reverse().map(([x, y]) => [x, y, z])];
  const H = M.loft(ring(keel, 0), ring(deck, D), { smoothDeg: 30 });
  // hull side decor: boot-top stripe, a sheer line, shading on the side away from the light
  if (M.decorOn) {
    for (const name of Object.keys(H.names)) {
      if (!/^s\d+b?$/.test(name)) continue;
      const f = H.f(name);
      if (!f.on || Math.abs(f.n[2]) > 0.9) continue;
      for (const z of [D * 0.38, D * 0.5, D * 0.86]) hline(f, z, { w: z === D * 0.86 ? 0 : 1 });
      if (f.tone > 0.3) f.hatch(f.box, { angle: 90, gap: 3.6 - 2.2 * f.tone, w: 0 });
      // stripe between the boot-top lines
      const ya = (D * 0.38 - f.o[2]) / (f.v[2] || 1), yb = (D * 0.5 - f.o[2]) / (f.v[2] || 1);
      f.hatch([-f.w, Math.min(ya, yb), f.w, Math.max(ya, yb)], { angle: 30, gap: 1.6, w: 0 });
    }
  }
  // rub rail and deck
  const rail = [...deck.map(([x, y]) => [x, -y, D]), ...deck.slice().reverse().map(([x, y]) => [x, y, D])];
  M.pipe([...rail, rail[0]], 0.05, { isect: false });
  const dk = H.f('b');
  if (dk.on) dk.hatch(dk.box, { angle: 0, gap: 2.8, w: 0 });
  // wheelhouse
  const cl = L * 0.26, cw = B * 0.62, ch = D * 1.1;
  const C = M.box([-L * 0.12 - cl / 2, -cw / 2, D], [-L * 0.12 + cl / 2, cw / 2, D + ch]);
  for (const k of ['+x', '+y', '-y', '-x']) {
    const f = C.f(k); if (!f.on) continue;
    const g = f.grid(k === '+x' ? 2 : 3, 1, { rect: [-f.w / 2 + 0.08, 0, f.w / 2 - 0.08, f.h / 2 - 0.1], gap: 3 });
    for (const r of g) K.glass(f, [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]]);
    f.hatch([-f.w / 2, -f.h / 2, f.w / 2, -0.05], { angle: 0, gap: 3, w: 0 });
  }
  M.box([-L * 0.12 - cl / 2 - 0.1, -cw / 2 - 0.1, D + ch], [-L * 0.12 + cl / 2 + 0.15, cw / 2 + 0.1, D + ch + 0.08]);
  M.at(-L * 0.12, 0, D + ch, () => K.whip(M, { h: ch * 1.6 }));
  M.at(-L * 0.12 - cl * 0.2, cw * 0.25, D + ch + 0.08, () => K.searchlight(M, { r: 0.12 }));
  return { hull: H, deckZ: D, beamAt: (u) => deck[Math.round(clamp(u, 0, 1) * N)][1] };
}

// a horizontal line at world height z across a convex planar face (clipped to its outline)
export function hline(f, z, o = {}) {
  if (!f.on || Math.abs(f.v[2]) < 1e-6) return;
  const y = (z - f.o[2]) / f.v[2];
  const xs = [];
  const p = f.poly;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) xs.push(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]));
  }
  if (xs.length < 2) return;
  f.line(Math.min(...xs), y, Math.max(...xs), y, o);
}

// control cab on a deck: a box with glazing on the upper half of three faces, a roof lip
export function controlCab(M, o = {}) {
  const w = o.w ?? 2.4, d = o.d ?? 2.2, h = o.h ?? 2.3, front = o.front ?? '+x';
  const C = M.box([-d / 2, -w / 2, 0], [d / 2, w / 2, h]);
  for (const k of ['+x', '-x', '+y', '-y']) {
    const f = C.f(k); if (!f.on) continue;
    const glazed = k === front || (k !== '-x' && k[0] !== front[0]) || o.allGlass;
    if (glazed) {
      glazing(f, [-f.w / 2 + 0.1, -f.h * 0.02, f.w / 2 - 0.1, f.h / 2 - 0.15], Math.max(2, Math.round(f.w / 0.8)), 1);
      K.corrugated(f, [-f.w / 2 + 0.05, -f.h / 2 + 0.05, f.w / 2 - 0.05, -f.h * 0.08]);
    } else skin(f, { cell: 1.1, rows: 2 });
  }
  M.box([-d / 2 - 0.15, -w / 2 - 0.15, h], [d / 2 + 0.2, w / 2 + 0.15, h + 0.1]);
  M.at(0, w * 0.3, h + 0.1, () => K.lamp(M, { r: 0.1 }));
  return C;
}

// engine house: a louvered box with exhaust stacks
export function engineHouse(M, o = {}) {
  const L = o.len ?? 4, W = o.w ?? 2.6, H = o.h ?? 2.2, n = o.stacks ?? 2;
  const E = M.box([-L / 2, -W / 2, 0], [L / 2, W / 2, H]);
  for (const k of ['+x', '-x', '+y', '-y']) skin(E.f(k), { cell: 1.0, rows: 2, kind: (r) => (r.j === 1 ? 'louver' : r.i % 3 === 1 ? 'hatch' : 'corrugated') });
  const tf = E.f('+z'); if (tf.on) for (const r of tf.grid(Math.max(2, Math.round(L / 1.2)), 2)) K.plain(tf, r, { shade: false });
  for (let i = 0; i < n; i++) M.at(-L / 2 + L * (i + 0.5) / n, W * 0.22, H - 0.3, () => K.stack(M, { r: 0.22, h: 1.8 + i * 0.25 }));
  return E;
}

// a small open buggy: chassis, four wheels, two seats, a roll bar, a little dish
export function buggy(M, L, reg = '') {
  const r = L * 0.15, w = L * 0.5, zf = r * 1.15;
  for (const x of [L * 0.32, -L * 0.32]) for (const s of [1, -1]) M.at(x, s * (w / 2 + r * 0.3), r, () => bigWheel(M, { r, w: r * 0.6, tread: 'chevron' }));
  const C = M.box([-L * 0.45, -w / 2 + 0.05, zf - 0.08], [L * 0.45, w / 2 - 0.05, zf]);
  if (C.f('+z').on) { const f = C.f('+z'); f.hatch(f.box, { angle: 0, gap: 2.4, w: 0 }); f.hatch(f.box, { angle: 90, gap: 2.4, w: 0 }); }
  for (const x of [L * 0.32, -L * 0.32]) for (const s of [1, -1]) M.box([x - r * 1.1, s * (w / 2 - 0.02), zf - 0.02], [x + r * 1.1, s * (w / 2 + r * 0.55), zf + 0.03], { isect: false });
  // seats
  for (const s of [1, -1]) {
    M.box([-L * 0.12, s * w * 0.22 - w * 0.15, zf], [L * 0.08, s * w * 0.22 + w * 0.15, zf + 0.12], { isect: false });
    M.box([-L * 0.14, s * w * 0.22 - w * 0.15, zf], [-L * 0.1, s * w * 0.22 + w * 0.15, zf + 0.45], { isect: false });
  }
  // roll bar and console
  M.pipe([[-L * 0.2, -w * 0.45, zf], [-L * 0.2, -w * 0.4, zf + 0.75], [-L * 0.2, w * 0.4, zf + 0.75], [-L * 0.2, w * 0.45, zf]], 0.03, { isect: false });
  M.box([L * 0.2, -w * 0.2, zf], [L * 0.32, w * 0.2, zf + 0.35], { isect: false });
  M.at(L * 0.38, 0, zf, () => K.dishMount(M, { r: L * 0.12, el: 60 }));
  const B = M.box([-L * 0.45, -w * 0.35, zf], [-L * 0.25, w * 0.35, zf + 0.3]);
  if (B.f('+y').on) K.stencil(B.f('+y'), reg.slice(0, 2), 0, 0, 0.12);
}

export { K, dot, sub, add, mul, norm, cross, len, lerp, D2R, circlePts };
