// classes/parts-space.js: shared parts for the space family (rocket, station, spaceplane).
// Round bodies get their skin here: stringers, ring frames, roll-pattern panels, lettering
// that runs up the side, hatches, umbilical plates, handrails. Every part builds at the
// current frame's origin, +z along its axis unless noted.

import * as K from '../kit.js';
import { dot, D2R, sub, add, mul, norm, len, cross } from '../geom.js';

// ------------------------------------------------------------------ lathe helpers
export const facing = (M, L, a, t) => dot(L.at(a, t).n, M.view.e);

// the angle (deg) on a lathe whose surface looks most at the viewer at t
export function bestA(M, L, t = 0.5) {
  let best = 0, bs = -Infinity;
  for (let a = 0; a < 360; a += 5) { const s = facing(M, L, a, t); if (s > bs) { bs = s; best = a; } }
  return best;
}

// tangent ogive from radius r at z0 to a point h higher, n segments
export function ogive(r, h, z0 = 0, n = 9, blunt = 0) {
  const rho = (r * r + h * h) / (2 * r);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const z = h * i / n;
    let y = Math.sqrt(Math.max(0, rho * rho - z * z)) + r - rho;
    if (i === n) y = 0;
    out.push([Math.max(0, y), z0 + z]);
  }
  if (blunt > 0) {
    // round the tip: replace the last points by a small cap
    out.pop();
    const last = out[out.length - 1];
    out.push([last[0] * 0.45, last[1] + (z0 + h - last[1]) * 0.75], [0, z0 + h - (z0 + h - last[1]) * 0.05]);
  }
  return out;
}

// ------------------------------------------------------------------ the skin of a stage
// S: a lathe about local z (cylinder or cone), r its radius, Lz its length.
// o: { stringers: px gap or 0, sT: [t0, t1] range of stringers, frames: [t...], seams: n,
//      roll: { kind: 'checker'|'stripes'|'band', a0, bands: [[t0,t1],...] },
//      text: { str, t, h } lettering up the side toward the viewer (aT: angle),
//      hatches: [[a, t, w, h]], umbs: [[a, t, w, h]], shade }
export function skin(M, S, o = {}) {
  if (!M.decorOn) return;
  const L = S.lat, r = o.r, Lz = o.len;
  const e = M.view.e;
  // ring frames
  for (const f of o.frames || []) { const t = typeof f === 'number' ? f : f[0]; L.ring(t, { w: typeof f === 'number' ? 0 : f[1] }); }
  // stringers: a fine vertical hatch, front half only
  if (o.stringers) {
    const step = o.stringers * M.px / r / D2R;
    const [sa, sb] = o.sT || [0, 1];
    for (let a = (o.a0 || 0) % step; a < 360; a += step) if (facing(M, L, a, (sa + sb) / 2) > 0.03) L.meridian(a, sa, sb, { w: 0 });
  }
  // panel seams: meridians at a few angles, in weight 1
  if (o.seams) {
    const [sa, sb] = o.seamT || [0, 1];
    for (let i = 0; i < o.seams; i++) L.meridian((o.a0 || 0) + i * 360 / o.seams, sa, sb, { w: 1 });
  }
  // roll pattern
  if (o.roll) {
    const R = o.roll, a0 = R.a0 || 0;
    R.bands.forEach(([t0, t1], bi) => {
      const quads = R.kind === 'band' ? [[a0, a0 + 360]] : R.kind === 'stripes' ? [0, 1, 2, 3].map((q) => [a0 + q * 90, a0 + q * 90 + 30]) : [(bi % 2) * 90, (bi % 2) * 90 + 180].map((q) => [a0 + q, a0 + q + 90]);
      L.ring(t0, { w: 1 }); L.ring(t1, { w: 1 });
      for (const [qa, qb] of quads) {
        if (R.kind !== 'band') { L.meridian(qa, t0, t1, { w: 1 }); L.meridian(qb, t0, t1, { w: 1 }); }
        // only the half toward the viewer: hatch is costly and the back is culled anyway
        const mid = (t0 + t1) / 2;
        let lo = null;
        const N = Math.max(2, Math.ceil((qb - qa) / 6));
        for (let i = 0; i <= N; i++) {
          const a = qa + (qb - qa) * i / N;
          const vis = facing(M, L, a, mid) > -0.05;
          if (vis && lo == null) lo = a;
          if ((!vis || i === N) && lo != null) { const hi = vis ? a : a - (qb - qa) / N; if (hi > lo) L.hatch(lo, hi, t0, t1, { gap: 1.15 }); lo = null; }
        }
      }
    });
  }
  // lettering up the side
  if (o.text && o.text.str) {
    const T = o.text;
    const a = T.a ?? bestA(M, L, T.t);
    L.text(T.str, a, T.t, T.h, { along: true, w: 1 });
  }
  // access hatches and umbilical plates
  for (const [a, t, w, h] of o.hatches || []) latHatch(M, L, a, t, w, h, Lz);
  for (const [a, t, w, h] of o.umbs || []) latUmb(M, L, a, t, w, h, Lz);
  if (o.shade !== false) L.shade({ gap: o.shadeGap ?? 1.7, gapMax: 6, t0: o.shT ? o.shT[0] : 0, t1: o.shT ? o.shT[1] : 1 });
  void e;
}

const rectPts = (w, h) => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
function rrPts(w, h, c) { return [[-w / 2 + c, -h / 2], [w / 2 - c, -h / 2], [w / 2, -h / 2 + c], [w / 2, h / 2 - c], [w / 2 - c, h / 2], [-w / 2 + c, h / 2], [-w / 2, h / 2 - c], [-w / 2, -h / 2 + c]]; }

// an access hatch on a lathe at (a, t): frame, inner door, hinge marks, a handle
export function latHatch(M, L, a, t, w, h) {
  if (!M.decorOn || w / M.px < 5) return;
  L.shape(a, t, rectPts(w, h), { closed: true, w: 1 });
  L.shape(a, t, rrPts(w * 0.78, h * 0.78, Math.min(w, h) * 0.12), { closed: true, w: 1 });
  if (w / M.px > 10) {
    L.shape(a, t, [[-w * 0.39, h * 0.2], [-w * 0.3, h * 0.2]], { w: 1 });
    L.shape(a, t, [[-w * 0.39, -h * 0.2], [-w * 0.3, -h * 0.2]], { w: 1 });
    L.shape(a, t, [[w * 0.22, -h * 0.1], [w * 0.22, h * 0.1]], { w: 1 });
  }
}
// umbilical plate: a rounded plate with connector rings and a dark band
export function latUmb(M, L, a, t, w, h) {
  if (!M.decorOn || w / M.px < 5) return;
  L.shape(a, t, rrPts(w, h, Math.min(w, h) * 0.2), { closed: true, w: 1 });
  const n = w / M.px > 14 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const x = -w * 0.3 + w * 0.6 * i / (n - 1);
    L.shape(a, t, circ(x, h * 0.12, Math.min(w, h) * 0.14), { closed: true, w: 1 });
  }
  L.shape(a, t, [[-w * 0.38, -h * 0.28], [w * 0.38, -h * 0.28]], { w: 1 });
}
const circ = (cx, cy, r, n = 10) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i * 2 * Math.PI / n) * r, cy + Math.sin(i * 2 * Math.PI / n) * r]);

// a window on a lathe: frame and dark glass
export function latWindow(M, L, a, t, w, h, Ltot) {
  if (!M.decorOn || w / M.px < 3) return;
  const pts = rrPts(w, h, Math.min(w, h) * 0.25);
  L.shape(a, t, pts, { closed: true, w: 1 });
  const r = radiusAt(L, t) || 1;
  const da = w * 0.42 / r / D2R, dt = h * 0.42 / (Ltot || L.total);
  L.hatch(a - da, a + da, t - dt, t + dt, { gap: 1.0 });
}
export function radiusAt(L, t) {
  const [j, f] = L._j(t), P = L.profile, q = P[(j + 1) % P.length];
  return Math.abs(P[j][0] + (q[0] - P[j][0]) * f);
}

// ------------------------------------------------------------------ handrails
// a rail standing off a lathe surface along a meridian (t0..t1), posts at the ends and between
export function handrail(M, L, a, t0, t1, o = {}) {
  const h = o.h ?? 0.12, r = o.r ?? 0.025;
  const n = Math.max(2, o.posts ?? 3);
  M.world(() => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const s = L.at(a, t0 + (t1 - t0) * i / n);
      const top = add(s.p, mul(s.n, h));
      pts.push(top);
      M.tube(s.p, top, r * 0.8, { isect: false, shade: false });
    }
    M.pipe(pts, r, { isect: false });
  });
}
// a rail along a ring (a0..a1) at t
export function handrailRing(M, L, t, a0, a1, o = {}) {
  const h = o.h ?? 0.12, r = o.r ?? 0.025;
  const n = Math.max(2, o.posts ?? Math.ceil(Math.abs(a1 - a0) / 30));
  M.world(() => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const s = L.at(a0 + (a1 - a0) * i / n, t);
      const top = add(s.p, mul(s.n, h));
      pts.push(top);
      M.tube(s.p, top, r * 0.8, { isect: false, shade: false });
    }
    M.pipe(pts, r, { isect: false });
  });
}

// ------------------------------------------------------------------ engines
// positions of n engines inside a base of radius R, engine radius re
export function engineLayout(n, R, re) {
  const ring = (m, rr, a0 = 0) => Array.from({ length: m }, (_, i) => [Math.cos((a0 + i * 360 / m) * D2R) * rr, Math.sin((a0 + i * 360 / m) * D2R) * rr]);
  if (n === 1) return [[0, 0]];
  if (n === 2) return ring(2, re * 1.15, 90);
  if (n === 3) return ring(3, re * 1.25, 90);
  if (n === 4) return ring(4, re * 1.5, 45);
  if (n === 5) return [[0, 0], ...ring(4, Math.min(R * 0.62, re * 2.3), 45)];
  if (n === 7) return [[0, 0], ...ring(6, re * 2.1, 30)];
  return [[0, 0], ...ring(n - 1, Math.min(R * 0.68, re * 2.4), 22.5)];
}
// largest engine radius that fits n engines in a base of radius R
export function engineFit(n, R) {
  return R * ({ 1: 0.62, 2: 0.44, 3: 0.42, 4: 0.36, 5: 0.27, 7: 0.25, 9: 0.21 }[n] || 0.2);
}
// an engine cluster hanging from z = 0: a thrust plate, n bells, gimbal blocks
export function engines(M, o) {
  const R = o.R, n = o.n, re = o.re ?? engineFit(n, R), Le = o.len ?? re * 2.6;
  const pos = engineLayout(n, R, re);
  // heat shield / thrust plate
  const H = M.cyl(R * 0.985, -Math.max(0.06, R * 0.05), 0, { isect: false });
  if (M.decorOn && H.bottom.on) { /* the underside is not seen */ }
  for (const [x, y] of pos) {
    M.at(x, y, -Math.max(0.06, R * 0.05), () => {
      M.cyl(re * 0.3, -re * 0.25, 0.01, { isect: false });
      M.at(0, 0, -re * 0.25, () => K.bell(M, { r: re, len: Le - re * 0.25, pump: o.pump }));
    });
  }
  return { pos, re, len: Le + Math.max(0.06, R * 0.05) };
}

// ------------------------------------------------------------------ fins
// fin on the +x side of a body of radius R: root chord c0 from z0 up, span s, tip chord c1,
// tip trailing edge dropped by drop (fins reach below the base on many rockets)
export function fin(M, o) {
  const R = o.R, c0 = o.c0, c1 = o.c1, s = o.s, z0 = o.z0, drop = o.drop ?? 0, t = o.t ?? Math.max(0.04, c0 * 0.03);
  const sweep = o.sweep ?? (c0 - c1) * 0.8;
  const prof = [[R * 0.96, z0], [R + s, z0 - drop], [R + s, z0 - drop + c1], [R * 0.96, z0 + c0]];
  void sweep;
  const S = M.extrude(prof, -t / 2, t / 2, { plane: 'xz' });
  for (const k of ['+y', '-y']) {
    const f = S.f(k);
    if (!f.on) continue;
    f.path(insetPoly(f.poly, f.mOf(3)), { closed: true, w: 1 });
    // spar lines and rivets at the root
    const p = f.poly;
    if (f.pxOf(s) > 18) {
      for (const q of [0.35, 0.7]) {
        const a = lerpP(p[0], p[1], q), b = lerpP(p[3], p[2], q);
        f.line(a[0], a[1], b[0], b[1], { w: 0 });
      }
    }
    if (f.tone > 0.3) f.hatch(insetPoly(f.poly, f.mOf(3)), { angle: 90, gap: 3.6 - 1.6 * f.tone, w: 0 });
    if (o.mark && f.pxOf(s) > 24) {
      const c = [(p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4, (p[0][1] + p[1][1] + p[2][1] + p[3][1]) / 4];
      f.text(o.mark, c[0], c[1], Math.min(s, c1) * 0.28, { upright: true, pass: 4 });
    }
  }
  return S;
}
const lerpP = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
// inset a convex polygon (2D) by d (approximate: toward the centroid along bisectors)
export function insetPoly(p, d) {
  const n = p.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const a = p[i], b = p[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const s = area >= 0 ? 1 : -1;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = p[i], b = p[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l * s, ny = dx / l * s;
    lines.push([[a[0] + nx * d, a[1] + ny * d], [dx, dy]]);
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const [p1, d1] = lines[(i + n - 1) % n], [p2, d2] = lines[i];
    const den = d1[0] * d2[1] - d1[1] * d2[0];
    if (Math.abs(den) < 1e-12) { out.push(p2); continue; }
    const tt = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / den;
    out.push([p1[0] + d1[0] * tt, p1[1] + d1[1] * tt]);
  }
  return out;
}

// ------------------------------------------------------------------ interstages
// open truss between radius rA at z0 and rB at z1: two band rings, a zigzag of struts
export function trussInterstage(M, o) {
  const { rA, rB, z0, z1 } = o, n = o.n ?? 8;
  const band = Math.min(0.35, (z1 - z0) * 0.08);
  const A = M.cyl(rA, z0, z0 + band, { isect: false });
  const B = M.cyl(rB, z1 - band, z1, { isect: false });
  for (const S of [A, B]) if (M.decorOn) { S.lat.shade({ gap: 1.8 }); }
  const rs = Math.max(0.05, Math.min(rA, rB) * 0.035);
  const ra = rA * 0.96, rb = rB * 0.96;
  for (let i = 0; i < n; i++) {
    const a = (i * 360 / n) * D2R, b0 = ((i - 0.5) * 360 / n) * D2R, b1 = ((i + 0.5) * 360 / n) * D2R;
    const p = [Math.cos(a) * ra, Math.sin(a) * ra, z0 + band];
    for (const b of [b0, b1]) K.strut(M, p, [Math.cos(b) * rb, Math.sin(b) * rb, z1 - band], rs, {});
  }
}
// corrugated skirt (frustum) with rings
export function skirt(M, o) {
  const { rA, rB, z0, z1 } = o;
  const S = M.cone(rA, rB, z0, z1, { isect: o.isect });
  if (M.decorOn) {
    const L = S.lat, r = (rA + rB) / 2;
    L.ring(0.06, { w: 1 }); L.ring(0.94, { w: 1 });
    const step = (o.gap ?? 2.4) * M.px / r / D2R;
    for (let a = 0; a < 360; a += step) if (facing(M, L, a, 0.5) > 0.03) L.meridian(a, 0.06, 0.94, { w: 0 });
    for (const [a, t] of o.vents || []) L.port(a, t, Math.min(z1 - z0, r) * 0.08, { w: 1 });
    L.shade({ gap: 1.6 });
  }
  return S;
}
// a shallow dome on top of a tank at z0 (seen through an open truss)
export function dome(M, r, z0, k = 0.35) {
  const p = [];
  for (let i = 0; i <= 6; i++) { const a = i / 6 * 90 * D2R; p.push([Math.cos(a) * r, z0 + Math.sin(a) * r * k]); }
  p[6][0] = 0;
  const S = M.lathe(p, { isect: false });
  if (M.decorOn) { S.lat.ring(0.45, { w: 0 }); S.lat.shade({ gap: 1.8 }); }
  return S;
}

// ------------------------------------------------------------------ small parts
// RCS thruster quad on a hull: block with four little nozzles, +x out of the hull
export function rcsQuad(M, o = {}) {
  const s = o.s ?? 0.6;
  M.boxc([s * 0.35, 0, 0], [s * 0.7, s, s], { isect: false });
  for (const [y, z, ry, rz] of [[s * 0.55, 0, 0, 90], [-s * 0.55, 0, 0, -90], [0, s * 0.55, -90, 0], [0, -s * 0.55, 90, 0]]) {
    M.at(s * 0.45, y, z, () => M.rz(rz, () => M.ry(ry, () => M.cone(s * 0.08, s * 0.2, 0.0, s * 0.35, { isect: false }))));
  }
  M.at(s * 0.7, 0, 0, () => M.ry(90, () => M.cone(s * 0.08, s * 0.18, 0, s * 0.3, { isect: false })));
}

// docking port along +z from z = 0: collar, tunnel, flange, guide petals or a probe.
// Returns the face z of the port.
export function dockPort(M, o = {}) {
  const r = o.r ?? 0.8, Lt = o.len ?? r * 0.8, kind = o.kind ?? 'petals';
  const C = M.cyl(r * 1.25, 0, Lt * 0.25, { isect: false });
  const T = M.cyl(r, Lt * 0.25, Lt, { isect: false });
  M.cyl(r * 1.12, Lt - r * 0.12, Lt, { isect: false });
  if (M.decorOn) {
    C.lat.shade({ gap: 1.8 }); T.lat.shade({ gap: 1.8 });
    const n = 12;
    for (let i = 0; i < n; i++) C.lat.meridian(i * 360 / n, 0, 1, { w: 1 });
    T.lat.ring(0.5, { w: 1 });
  }
  if (kind === 'petals') {
    for (let i = 0; i < 3; i++) M.rz(i * 120 + 30, () => {
      const pa = [[r * 0.95, -r * 0.35, Lt], [r * 0.95, r * 0.35, Lt], [r * 0.7, r * 0.12, Lt + r * 0.45], [r * 0.7, -r * 0.12, Lt + r * 0.45]];
      M.plate(pa, { isect: false });
    });
  } else if (kind === 'probe') {
    M.cone(r * 0.25, r * 0.06, Lt, Lt + r * 0.9, { isect: false });
    for (let i = 0; i < 3; i++) M.rz(i * 120, () => M.tube([r * 0.2, 0, Lt + r * 0.1], [r * 0.05, 0, Lt + r * 0.7], r * 0.03, { isect: false }));
  } else if (kind === 'drogue') {
    M.lathe([[r * 0.9, Lt], [r * 0.3, Lt - r * 0.4]], { open: true, isect: false });
  }
  if (M.decorOn) {
    const top = M.cyl(r * 0.7, Lt, Lt + 0.01, { isect: false, decorOff: false });
    if (top.top.on) { top.top.circle(0, 0, r * 0.55, { w: 1 }); top.top.line(-r * 0.55, 0, r * 0.55, 0, { w: 0 }); }
  } else M.cyl(r * 0.7, Lt, Lt + 0.01, { isect: false });
  return Lt;
}

// solar or radiator wing along local +x from x0, width w (y), thickness in z; n panels.
// kind 'solar' (cell grid) or 'radiator' (fine tube lines). Returns the tip x.
export function wing(M, o = {}) {
  const x0 = o.x0 ?? 0, Lw = o.len ?? 8, w = o.w ?? 2.4, n = o.n ?? 4, kind = o.kind ?? 'solar', gap = o.gap ?? Math.min(0.25, Lw / n * 0.06);
  const pl = (Lw - gap * (n - 1)) / n;
  M.tube([x0 - (o.boom ?? 0), 0, 0], [x0 + Lw, 0, 0], o.boomR ?? Math.max(0.04, w * 0.025), { isect: false });
  for (let i = 0; i < n; i++) {
    const cx = x0 + pl / 2 + i * (pl + gap);
    M.at(cx, 0, 0, () => {
      if (kind === 'solar') K.solar(M, { w: pl, h: w, t: Math.max(0.03, w * 0.015), cols: Math.max(2, Math.round(pl / (w / 4))), rows: 4 });
      else radiator(M, { w: pl, h: w });
    });
  }
  return x0 + Lw;
}
export function radiator(M, o = {}) {
  const w = o.w ?? 3, h = o.h ?? 2, t = o.t ?? Math.max(0.04, h * 0.02);
  const S = M.box([-w / 2, -h / 2, -t / 2], [w / 2, h / 2, t / 2], { isect: false });
  for (const k of ['+z', '-z']) {
    const f = S.f(k);
    if (!f.on) continue;
    const ins = f.mOf(2);
    const r = [-f.w / 2 + ins, -f.h / 2 + ins, f.w / 2 - ins, f.h / 2 - ins];
    f.rect(r, { w: 1 });
    // tubes run across the width, a header along one edge
    const nT = Math.max(3, Math.round(f.pxOf(f.w) / 4.5));
    for (let i = 1; i < nT; i++) { const x = r[0] + (r[2] - r[0]) * i / nT; f.line(x, r[1] + ins, x, r[3], { w: 0 }); }
    f.line(r[0], r[1] + ins, r[2], r[1] + ins, { w: 1 });
  }
  return S;
}

// ------------------------------------------------------------------ lattice tower
// square lattice tower on z = 0, w wide, h high, bays of about b. Returns { levels: [z] }
export function latticeTower(M, o) {
  const w = o.w, h = o.h, nb = Math.max(2, Math.round(h / (o.bay ?? w))), b = h / nb, r = o.r ?? w * 0.035;
  const c = [[-w / 2, -w / 2], [w / 2, -w / 2], [w / 2, w / 2], [-w / 2, w / 2]];
  for (const [x, y] of c) M.box([x - r, y - r, 0], [x + r, y + r, h], { isect: false });
  const levels = [];
  for (let k = 0; k <= nb; k++) {
    const z = b * k;
    levels.push(z);
    for (let i = 0; i < 4; i++) {
      const p = c[i], q = c[(i + 1) % 4];
      if (k > 0) M.tube([p[0], p[1], z], [q[0], q[1], z], r * 0.7, { isect: false, shade: false });
      if (k < nb) {
        const z1 = z + b;
        M.tube([p[0], p[1], z], [q[0], q[1], z1], r * 0.5, { isect: false, shade: false });
        if (o.x !== false) M.tube([q[0], q[1], z], [p[0], p[1], z1], r * 0.5, { isect: false, shade: false });
      }
    }
  }
  return { levels, bay: b };
}

// deck slab with grating and an optional railing on given sides ('+x','-x','+y','-y')
export function deck(M, x0, y0, x1, y1, z, o = {}) {
  const t = o.t ?? 0.25;
  const S = M.box([x0, y0, z - t], [x1, y1, z], { isect: false });
  const f = S.f('+z');
  if (f.on) { const ins = f.mOf(2); f.hatch([-f.w / 2 + ins, -f.h / 2 + ins, f.w / 2 - ins, f.h / 2 - ins], { angle: 0, gap: 2.6, w: 0 }); f.hatch([-f.w / 2 + ins, -f.h / 2 + ins, f.w / 2 - ins, f.h / 2 - ins], { angle: 90, gap: 2.6, w: 0 }); }
  for (const k of ['+x', '-x', '+y', '-y']) { const sf = S.f(k); if (sf.on && sf.pxOf(t) > 2.5) sf.hatch(sf.box, { angle: 90, gap: 2.2, w: 0 }); }
  for (const s of o.rail || []) {
    const pts = s === '+x' ? [[x1, y0, z], [x1, y1, z]] : s === '-x' ? [[x0, y0, z], [x0, y1, z]] : s === '+y' ? [[x0, y1, z], [x1, y1, z]] : [[x0, y0, z], [x1, y0, z]];
    K.railing(M, pts, { h: 1.0, posts: 2.2 });
  }
  return S;
}

// a corrugated box (sheds, cabs, crawler bodies): panels on its visible walls
export function panelBox(M, a, b, o = {}) {
  const S = M.box(a, b, o);
  const kinds = o.kinds || ['corrugated'];
  for (const k of ['+x', '-x', '+y', '-y']) {
    const f = S.f(k);
    if (!f.on) continue;
    const n = Math.max(1, Math.round(f.w / (o.cell ?? 3))), m = Math.max(1, Math.round(f.h / (o.cell ?? 3)));
    f.grid(n, m, { gap: 2.2 }).forEach((r, i) => K.fill(f, r, kinds[(i * 7 + r.j * 3) % kinds.length]));
  }
  const top = S.f('+z');
  if (top.on && o.roof !== false) top.grid(Math.max(1, Math.round(top.w / 4)), Math.max(1, Math.round(top.h / 4)), { gap: 2 }).forEach((r) => K.plain(top, r, { shade: false }));
  return S;
}

// ------------------------------------------------------------------ the winged glider
// nose toward +x, centered at the origin (fuselage axis on local x), wing in the xy plane.
// o: len, span, form ('delta' | 'lifting'), fins ('tip' | 'tail' | 'both'), bells, reg,
// bay (cargo-bay door lines), glaze. Returns { tail: x of the tail plane, belly: z }
export function glider(M, o = {}) {
  const Lg = o.len ?? 12, span = o.span ?? Lg * 0.7, rf = o.rf ?? Lg * 0.085, flat = o.flat ?? 0.8;
  const form = o.form ?? 'delta';
  const xT = -Lg * 0.5, xN = Lg * 0.5;
  const out = { tail: xT, belly: -rf * flat };
  // fuselage: profile along local z of the lathe (maps to +x), tail at z = 0
  const prof = [[rf * 0.82, 0], [rf, Lg * 0.08], [rf, Lg * 0.62]];
  const nose = ogive(rf, Lg * 0.38, Lg * 0.62, 7, 0);
  prof.push(...nose.slice(1, -1), [rf * 0.12, Lg * 0.995], [0, Lg]);
  let F;
  M.at(xT, 0, 0, () => M.scale(1, 1, flat, () => { F = M.lathe(prof, { axis: 'x', sharpDeg: 30 }); }));
  if (M.decorOn) {
    const L = F.lat, tot = L.total;
    const tz = (z) => { let best = 0; for (let j = 0; j < L.nseg; j++) if (L.profile[j][1] <= z) best = j; const p = L.profile[best], q = L.profile[best + 1] || p; const f = q[1] > p[1] ? (z - p[1]) / (q[1] - p[1]) : 0; return (L.cum[best] + f * (L.cum[best + 1] - L.cum[best])) / tot; };
    // cargo bay doors: two hinge lines and the bay ends
    if (o.bay !== false) {
      const b0 = tz(Lg * 0.18), b1 = tz(Lg * 0.6);
      for (const a of [180 - 62, 180 + 62]) L.meridian(a, b0, b1, { w: 1 });
      L.meridian(180, b0, b1, { w: 1 });
      for (const t of [b0, b1]) L.ring(t, { a0: 118, a1: 242, w: 1 });
      for (let k = 1; k < 4; k++) L.ring(b0 + (b1 - b0) * k / 4, { a0: 120, a1: 240, w: 0 });
    }
    // glazed nose: a row of windows on the crown
    if (o.glaze !== false) {
      const tw = tz(Lg * 0.8);
      const ww = rf * 0.36, wh = Lg * 0.045;
      for (const a of [180 - 34, 180 - 11, 180 + 11, 180 + 34]) latWindow(M, L, a, tw, ww, wh, tot);
      L.ring(tz(Lg * 0.74), { a0: 130, a1: 230, w: 1 });
    }
    // tiles: a fine grid on the lower flanks
    const tl0 = tz(Lg * 0.04), tl1 = tz(Lg * 0.9);
    const nr = Math.max(4, Math.min(40, Math.round((Lg * 0.86) / M.px / 6)));
    for (let k = 0; k <= nr; k++) L.ring(tl0 + (tl1 - tl0) * k / nr, { a0: -70, a1: 70, w: 0 });
    for (let a = -70; a <= 70; a += 14) L.meridian(a, tl0, tl1, { w: 0 });
    L.meridian(-72, tl0, tl1, { w: 1 }); L.meridian(72, tl0, tl1, { w: 1 });
    // the black belly tiles and the nose cap, dense hatch below the chine line
    L.hatch(-72, 72, 0.01, 0.97, { gap: 1.35 });
    L.ring(tz(Lg * 0.93), { w: 1 });
    L.hatch(72, 288, tz(Lg * 0.93), 0.995, { gap: 1.2 });
    // panel joints on the upper body
    const np = Math.max(4, Math.round(Lg / (rf * 1.6)));
    for (let k = 1; k < np; k++) { const t = tz(Lg * (0.04 + 0.66 * k / np)); L.ring(t, { a0: 74, a1: 106, w: 0 }); L.ring(t, { a0: 254, a1: 286, w: 0 }); }
    for (const a of [100, 260]) L.meridian(a, tz(Lg * 0.04), tz(Lg * 0.7), { w: 0 });
    // crew hatches on both sides behind the glazing
    for (const a of [90, 270]) latHatch(M, L, a, tz(Lg * 0.7), rf * 0.5, Lg * 0.05);
    // RCS ports on the nose
    for (const a of [60, 90, 270, 300]) L.port(a, tz(Lg * 0.9), rf * 0.06, { w: 1 });
    if (o.reg) for (const a of [95, 265]) L.text(o.reg, a, tz(Lg * 0.42), rf * 0.32, { w: 1 });
    L.shade({ gap: 1.7, gapMax: 5 });
  }
  out.body = F;
  // wing
  const zw = -rf * flat * 0.45, tw = Math.max(0.05, Lg * 0.012);
  let plan;
  if (form === 'delta') {
    plan = [[xT + Lg * 0.04, -span / 2], [xT + Lg * 0.2, -span / 2], [xN - Lg * 0.42, -rf * 0.95], [xN - Lg * 0.3, -rf * 0.6],
      [xN - Lg * 0.3, rf * 0.6], [xN - Lg * 0.42, rf * 0.95], [xT + Lg * 0.2, span / 2], [xT + Lg * 0.04, span / 2]];
  } else {
    plan = [[xT, -span / 2], [xT + Lg * 0.32, -span / 2], [xN - Lg * 0.3, -rf * 1.05], [xN - Lg * 0.25, 0],
      [xN - Lg * 0.3, rf * 1.05], [xT + Lg * 0.32, span / 2], [xT, span / 2]];
  }
  const Wg = M.extrude(plan, zw - tw, zw + tw, { isect: true });
  const top = Wg.f('+z');
  if (top.on) {
    // elevons, a spar line, a leading-edge band of tiles
    const ev = Lg * 0.07;
    const cx = (xT + (form === 'delta' ? xN - Lg * 0.3 : xN - Lg * 0.25)) / 2;
    const xe = (form === 'delta' ? xT + Lg * 0.04 : xT) - cx;
    for (const s of [1, -1]) {
      const y0 = s * rf * 1.1, y1 = s * span * 0.46;
      top.path([[xe, y0], [xe + ev, y0], [xe + ev, y1], [xe, y1]], { w: 1 });
      top.line(xe + ev * 2.2, y0, xe + ev * 2.2, y1 * 0.92, { w: 0 });
    }
    // panel grid, a black band of tiles all round the edge, the registration on one wing
    const pg = top.pxOf(Math.max(rf * 0.8, Lg * 0.045));
    if (pg > 5) { top.hatch(top.box, { angle: 0, gap: pg, w: 0 }); top.hatch(top.box, { angle: 90, gap: pg * 1.3, w: 0 }); }
    const band = Math.max(top.mOf(2.5), Lg * 0.018);
    const inner = insetPoly(top.poly, band);
    top.path(inner, { closed: true, w: 1 });
    top.hatch(top.box, { angle: 60, gap: 1.2, w: 0, holes: [inner] });
    if (top.tone > 0.25) top.hatch(top.box, { angle: 0, gap: 3.4 - 1.4 * top.tone, w: 0 });
    if (o.reg && span > rf * 4) top.text(o.reg, xe + Lg * 0.2, span * 0.26, Math.min(span * 0.07, Lg * 0.05), { upright: true });
  }
  const bot = Wg.f('-z');
  if (bot.on) {
    // heat tiles: a fine grid, a band of larger tiles along the leading edge
    bot.hatch(bot.box, { angle: 0, gap: 3.2, w: 0 });
    bot.hatch(bot.box, { angle: 90, gap: 3.2, w: 0 });
    bot.path(insetPoly(bot.poly, bot.mOf(4)), { closed: true, w: 1 });
  }
  // fins
  const fins = o.fins ?? 'tip';
  const finH = Lg * 0.2;
  if (fins === 'tip' || fins === 'both') {
    for (const s of [1, -1]) {
      const y = s * span / 2;
      const fx0 = form === 'delta' ? xT + Lg * 0.04 : xT;
      const Fn = M.extrude([[fx0, zw], [fx0 + Lg * 0.17, zw], [fx0 + Lg * 0.06, zw + finH * 0.8], [fx0 - Lg * 0.01, zw + finH * 0.8]], y - s * tw * 0.8, y + s * tw * 0.8, { plane: 'xz' });
      for (const k of ['+y', '-y']) { const f = Fn.f(k); if (f.on) { const ip = insetPoly(f.poly, f.mOf(3)); f.path(ip, { closed: true, w: 1 }); f.hatch(f.box, { angle: 60, gap: 1.2, w: 0, holes: [ip] }); f.line(-f.w * 0.3, -f.h / 2 + f.mOf(3), -f.w * 0.42, f.h / 2 - f.mOf(3), { w: 1 }); if (f.tone > 0.25) f.hatch(ip, { angle: 90, gap: 3.4 - 1.4 * f.tone, w: 0 }); } }
    }
  }
  if (fins === 'tail' || fins === 'both') {
    const S = M.extrude([[xT, 0], [xT + Lg * 0.24, rf * 0.7], [xT + Lg * 0.08, rf + finH * 1.1], [xT - Lg * 0.02, rf + finH * 1.1]], -tw, tw, { plane: 'xz' });
    for (const k of ['+y', '-y']) { const f = S.f(k); if (f.on) { f.path(insetPoly(f.poly, f.mOf(3)), { closed: true, w: 1 }); if (o.reg && f.pxOf(finH) > 16) f.text(o.reg.split('-')[0], 0, -f.h * 0.05, finH * 0.22, { upright: true }); } }
  }
  // body flap
  M.box([xT - Lg * 0.035, -rf * 0.7, -rf * flat * 0.78], [xT + Lg * 0.03, rf * 0.7, -rf * flat * 0.66], { isect: false });
  // engine bells out of the tail plane
  const nb = o.bells ?? 3;
  const br = rf * (nb === 1 ? 0.5 : 0.32);
  const bpos = nb === 1 ? [[0, 0]] : nb === 2 ? [[-br * 1.1, 0], [br * 1.1, 0]] : [[0, br * 0.9], [-br * 1.15, -br * 0.6], [br * 1.15, -br * 0.6]];
  for (const [y, z] of bpos) M.at(xT, y, z * flat, () => M.ry(90, () => K.bell(M, { r: br, len: br * 1.7, pump: false })));
  out.bells = nb;
  out.span = span;
  return out;
}

// ------------------------------------------------------------------ crew capsule
// cone capsule on z = 0 (heat shield at the bottom), radius r. Returns the apex z.
export function capsule(M, o = {}) {
  const r = o.r ?? 2, h = o.h ?? r * 1.15, rt = r * 0.32;
  const prof = [[0, -r * 0.12], [r * 0.6, -r * 0.09], [r * 0.97, -r * 0.02], [r, 0.02], [r * 0.97, r * 0.06], [rt, h], [rt * 0.9, h + 0.02]];
  const S = M.lathe(prof, { sharpDeg: 25 });
  if (M.decorOn) {
    const L = S.lat;
    const tTop = 0.97, tBot = 0.16;
    for (const k of [0.3, 0.55, 0.8]) L.ring(tBot + (tTop - tBot) * k, { w: 0 });
    const a = o.aFace ?? bestA(M, L, 0.55);
    const n = 16;
    for (let i = 0; i < n; i++) L.meridian(i * 360 / n, tBot + 0.02, tTop - 0.02, { w: 0 });
    // windows and the hatch toward the viewer
    for (const da of [-38, 38]) latWindow(M, L, a + da, tBot + (tTop - tBot) * 0.62, r * 0.18, r * 0.16, null);
    latHatch(M, L, a, tBot + (tTop - tBot) * 0.42, r * 0.42, r * 0.38);
    for (const da of [-70, 70, 110, 250]) L.port(a + da, tBot + (tTop - tBot) * 0.75, r * 0.05, { w: 1 });
    L.shade({ gap: 1.6, gapMax: 5, t0: tBot, t1: tTop });
  }
  // docking tunnel
  M.cyl(rt * 0.7, h, h + r * 0.18, { isect: false });
  return h + r * 0.18;
}
// launch escape tower standing on z = 0 over a capsule of radius r: four legs, motor, nozzles
export function escapeTower(M, o = {}) {
  const r = o.r ?? 2, h = o.h ?? r * 2.2, rb = o.rb ?? r * 0.45, rm = o.rm ?? r * 0.2;
  const zt = h * 0.42;
  const legs = [];
  for (let i = 0; i < 4; i++) {
    const a = (45 + i * 90) * D2R;
    const p = [Math.cos(a) * rb, Math.sin(a) * rb, 0], q = [Math.cos(a) * rm * 0.9, Math.sin(a) * rm * 0.9, zt];
    legs.push([p, q]);
    K.strut(M, p, q, r * 0.025, { collars: false });
  }
  for (let i = 0; i < 4; i++) {
    const [p0, q0] = legs[i], [p1, q1] = legs[(i + 1) % 4];
    const m0 = [(p0[0] + q0[0]) / 2, (p0[1] + q0[1]) / 2, zt / 2], m1 = [(p1[0] + q1[0]) / 2, (p1[1] + q1[1]) / 2, zt / 2];
    M.tube(p0, m1, r * 0.014, { isect: false, shade: false });
    M.tube(m0, q1, r * 0.014, { isect: false, shade: false });
    M.tube(m0, m1, r * 0.014, { isect: false, shade: false });
  }
  // motor: nozzle skirt, case, ballast and canard section, nose spike
  const zs = zt;
  M.cyl(rm * 1.1, zs, zs + rm * 0.5, { isect: false });
  for (let i = 0; i < 4; i++) M.rz(i * 90, () => M.at(rm * 0.9, 0, zs + rm * 0.25, () => M.ry(-140, () => M.cone(rm * 0.1, rm * 0.32, 0, rm * 0.6, { isect: false }))));
  const C = M.cyl(rm, zs + rm * 0.5, zs + h * 0.42, {});
  if (M.decorOn) { C.lat.ring(0.3, { w: 1 }); C.lat.ring(0.75, { w: 1 }); C.lat.shade({ gap: 1.7 }); const L = C.lat; L.text(o.mark || '', bestA(M, L, 0.5), 0.52, rm * 0.9, { along: true }); }
  const zc = zs + h * 0.42;
  M.cone(rm, rm * 0.8, zc, zc + h * 0.1, {});
  M.cone(rm * 0.8, rm * 0.3, zc + h * 0.1, zc + h * 0.22, {});
  M.cyl(rm * 0.06, zc + h * 0.22, zc + h * 0.34, { isect: false });
  return zc + h * 0.34;
}

// ------------------------------------------------------------------ vehicles on the ground
// a plain truck: cab at +x, bed behind it, wheels on z = 0. Returns { hitch: [x,y,z] }
export function truck(M, o = {}) {
  const L = o.len ?? 7, W = o.w ?? 2.4, rw = o.r ?? 0.5, reg = o.reg || '';
  const zf = rw * 1.1;
  // chassis rails
  for (const s of [1, -1]) M.box([-L / 2, s * W * 0.32 - 0.08, zf - 0.12], [L / 2 - 0.2, s * W * 0.32 + 0.08, zf + 0.12], { isect: false });
  // cab
  const cl = Math.min(2.2, L * 0.3), ch = 2.0;
  const cab = M.box([L / 2 - cl, -W / 2, zf + 0.12], [L / 2, W / 2, zf + 0.12 + ch], { chamfer: 0.0 });
  const front = cab.f('+x');
  if (front.on) {
    const g = front.grid(2, 2, { gap: 2.4 });
    K.xWindow(front, g[2]); K.xWindow(front, g[3]);
    K.louver(front, [g[0][0], g[0][1], g[1][2], g[1][3]]);
  }
  for (const k of ['+y', '-y']) {
    const f = cab.f(k);
    if (!f.on) continue;
    const g = f.grid(2, 2, { gap: 2.4 });
    K.octPort(f, g[2], { mullion: 'v' }); K.corrugated(f, g[3]);
    K.accessHatch(f, [g[0][0], g[0][1], g[1][2], g[1][3]]);
  }
  const top = cab.f('+z');
  if (top.on) K.plain(top, top.box);
  // bed
  const bedL = L - cl - 0.2;
  const bed = M.box([-L / 2, -W / 2, zf + 0.12], [-L / 2 + bedL, W / 2, zf + 0.62]);
  for (const k of ['+y', '-y', '-x']) { const f = bed.f(k); if (f.on) { const n = Math.max(1, Math.round(f.w / 1.6)); f.grid(n, 1, { gap: 2 }).forEach((r) => K.corrugated(f, r, { dir: 'h' })); } }
  if (reg) { const f = bed.f('+y').on ? bed.f('+y') : bed.f('-y'); if (f.on) K.stencil(f, reg, 0, 0, f.h * 0.5); }
  // a box on the bed (generator)
  panelBox(M, [-L / 2 + 0.3, -W * 0.4, zf + 0.62], [-L / 2 + bedL * 0.55, W * 0.4, zf + 1.9], { cell: 1.2, kinds: ['louver', 'corrugated', 'plain'] });
  // wheels: front axle and a rear tandem
  for (const x of [L / 2 - cl * 0.55, -L / 2 + bedL * 0.25, -L / 2 + bedL * 0.25 + rw * 2.3]) {
    for (const s of [1, -1]) M.at(x, s * (W / 2 - rw * 0.3), rw, () => K.wheel(M, { r: rw, w: rw * 0.6 }));
    M.tube([x, -W / 2 + rw * 0.3, rw], [x, W / 2 - rw * 0.3, rw], rw * 0.12, { isect: false });
  }
  // fenders
  M.box([L / 2 - cl * 0.55 - rw * 1.2, -W / 2 - 0.02, rw * 2.05], [L / 2 - cl * 0.55 + rw * 1.2, W / 2 + 0.02, rw * 2.15], { isect: false });
  // lamps
  for (const s of [1, -1]) M.at(L / 2 + 0.02, s * W * 0.36, zf + 0.5, () => K.lamp(M, { r: 0.12 }));
  return { hitch: [-L / 2 - 0.3, 0, zf] };
}

// ------------------------------------------------------------------ station modules
// all along local z from 0 to L (the caller turns local z onto the station's axis)

// pressurized drum with end cones; skin 'quilt' | 'ribbed' | 'stringers'. o.aF: the angle
// toward the viewer; o.wins: window count; o.rails; o.text. Returns the solid.
export function drumModule(M, o) {
  const r = o.r, L = o.len, k = o.cone ?? 0.4, re = o.rEnd ?? r * 0.55;
  const S = M.lathe([[re, 0], [r, r * k], [r, L - r * k], [re, L]], { sharpDeg: 20 });
  if (!M.decorOn) return S;
  const Lt = S.lat, tot = Lt.total;
  const sl = Math.hypot(r - re, r * k);
  const tA = sl / tot, tB = 1 - sl / tot;
  const aF = o.aF ?? bestA(M, Lt, 0.5);
  Lt.ring(tA, { w: 1 }); Lt.ring(tB, { w: 1 });
  const style = o.style ?? 'quilt';
  const nR = Math.max(2, Math.round((L - 2 * r * k) / (style === 'ribbed' ? 0.7 : 1.4)));
  for (let i = 1; i < nR; i++) Lt.ring(tA + (tB - tA) * i / nR, { w: style === 'ribbed' ? 1 : 0 });
  if (style === 'quilt') { for (let a = 0; a < 360; a += 15) if (facing(M, Lt, a, 0.5) > 0) Lt.meridian(a, tA, tB, { w: 0 }); }
  else if (style === 'stringers') { const step = 3.2 * M.px / r / D2R; for (let a = 0; a < 360; a += step) if (facing(M, Lt, a, 0.5) > 0.03) Lt.meridian(a, tA, tB, { w: 0 }); }
  else for (let i = 0; i < 8; i++) Lt.meridian(aF + 22.5 + i * 45, tA, tB, { w: 1 });
  // end cones: radial seams
  for (let i = 0; i < 12; i++) { Lt.meridian(i * 30, 0.005, tA, { w: 0 }); Lt.meridian(i * 30, tB, 0.995, { w: 0 }); }
  // windows in a row, a hatch, a lettered band
  const nw = o.wins ?? 0;
  for (let i = 0; i < nw; i++) latWindow(M, Lt, aF + (o.winA ?? 0), tA + (tB - tA) * (i + 0.5) / nw, r * 0.22, Math.min(r * 0.3, (L - 2 * r * k) / nw * 0.45), tot);
  if (o.hatch) latHatch(M, Lt, aF + o.hatch[0], tA + (tB - tA) * o.hatch[1], r * 0.5, r * 0.55);
  if (o.text) Lt.text(o.text, aF - 35, (tA + tB) / 2, r * 0.32, { along: true });
  Lt.shade({ gap: 1.7, gapMax: 6 });
  S.tA = tA; S.tB = tB; S.aF = aF;
  return S;
}

// docking collar joining two modules: a short barrel between two bolted flanges
export function collarRing(M, r, L) {
  const S = M.lathe([[r * 1.18, 0], [r * 1.18, L * 0.18], [r, L * 0.18], [r, L * 0.82], [r * 1.18, L * 0.82], [r * 1.18, L]], { sharpDeg: 30 });
  if (M.decorOn) {
    const Lt = S.lat;
    const n = Math.max(6, Math.min(24, Math.round(r * 2 * Math.PI / M.px / 9)));
    for (let i = 0; i < n; i++) { Lt.meridian(i * 360 / n, 0.02, 0.12, { w: 1 }); Lt.meridian(i * 360 / n, 0.88, 0.98, { w: 1 }); }
    Lt.shade({ gap: 1.8 });
  }
  return S;
}

// manipulator arm from a base at p along world points: shoulder, elbow, wrist, effector
export function manipulator(M, pts, r) {
  M.world(() => {
    for (let i = 0; i + 1 < pts.length; i++) {
      M.tube(pts[i], pts[i + 1], r * (i === 0 ? 1.2 : 1), {});
      collarAt(M, pts[i], pts[i + 1], 0.5, r);
    }
    pts.forEach((p, i) => M.at(p[0], p[1], p[2], () => (i === 0 ? M.cyl(r * 2.2, -r * 1.2, r * 1.2, {}) : M.sphere(r * 1.7, {}))));
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    const d = sub(b, a), l = len(d) || 1;
    const tip = add(b, mul(d, r * 4 / l));
    M.tube(b, tip, r * 1.5, {});
    M.tube(tip, add(tip, mul(d, r * 1.2 / l)), r * 2.0, {});
  });
}
function collarAt(M, a, b, t, r) { K.collar(M, a, b, t, r, { len: r * 2 }); }

// generic designation for the family
export function designationOf(M) {
  const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const k = M.rng();
  const L = () => LET[Math.floor(M.rng() * LET.length)];
  const n = 1 + Math.floor(M.rng() * 19), m = 2 + Math.floor(M.rng() * 60);
  const R = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][Math.floor(M.rng() * 9)];
  const a = L(), b = L(), c = L();
  if (k < 0.4) return `${a}${b}-${n}`;
  if (k < 0.65) return `TYPE ${m}-${c}`;
  if (k < 0.85) return `MK ${R}`;
  return `${a}${b}-${c}${L()}${L()}`;
}

export { norm, sub, add, mul, len, cross, dot, D2R };
