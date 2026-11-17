// classes/parts-air.js: shared parts for the air family (airship, gyrocopter, tiltrotor,
// hovercraft, balloon). Envelopes, lifting surfaces with ribs and control surfaces,
// fuselage sections, engine nacelles, undercarriage legs, floats, struts and wires.
// Every part builds in the current frame and returns something useful.

import * as K from '../kit.js';
import { dot, sub, add, mul, lerp, len, norm, cross, D2R, circlePts } from '../geom.js';

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ------------------------------------------------------------------ face helpers
// world point -> 2D coordinates on a planar face
export function toFace(f, P) {
  const d = sub(P, f.o);
  return [dot(d, f.u), dot(d, f.v)];
}
// a line between two world points, drawn on face f (both points should lie on it)
export function fLine(f, A, B, o = {}) {
  if (!f.on || !f.front) return;
  const a = toFace(f, A), b = toFace(f, B);
  f.line(a[0], a[1], b[0], b[1], o);
}
export function fPath(f, pts, o = {}) {
  if (!f.on || !f.front) return;
  f.path(pts.map((p) => toFace(f, p)), o);
}

// framed window in a face rect: frame, inner rounded opening, dark glass
export function window2(f, r, o = {}) {
  if (!f.on) return;
  const W = r[2] - r[0], H = r[3] - r[1];
  if (f.pxOf(Math.min(W, H)) < 3) return;
  const fr = Math.min(W, H) * (o.frame ?? 0.14);
  if (f.pxOf(fr) > 1.2) f.rect(r, { w: 1 });
  const g = [[r[0] + fr, r[1] + fr], [r[2] - fr, r[1] + fr], [r[2] - fr, r[3] - fr], [r[0] + fr, r[3] - fr]];
  K.glass(f, g, { gap: 0.95, gap2: 2.2, angle: o.angle ?? 62, flip: o.flip, cross: o.cross });
  if (o.mullion && f.pxOf(W) > 9) f.line((r[0] + r[2]) / 2, r[1] + fr, (r[0] + r[2]) / 2, r[3] - fr, { w: 1 });
}
// a row of n windows between x0..x1 at heights y0..y1 on face f
export function windowRow(f, x0, x1, y0, y1, n, o = {}) {
  if (!f.on || n < 1) return 0;
  const pitch = (x1 - x0) / n, ww = pitch * (o.fill ?? 0.66);
  for (let i = 0; i < n; i++) {
    const cx = x0 + pitch * (i + 0.5);
    window2(f, [cx - ww / 2, y0, cx + ww / 2, y1], { flip: i % 2 === 1, ...o });
  }
  return n;
}

// ------------------------------------------------------------------ envelope
// body of revolution along local x from -L/2 (tail) to +L/2 (nose), max radius R.
// form: 'classic' | 'rigid' (parallel middle) | 'blunt'. Returns {prof, rAt, tOf}.
export function envProfile(L, R, form = 'classic') {
  const xm = form === 'rigid' ? L * 0.12 : form === 'blunt' ? L * 0.16 : L * 0.1;
  const x2 = form === 'rigid' ? -L * 0.18 : xm;   // aft end of the parallel middle
  const nose = L / 2 - xm, tail = x2 + L / 2;
  const rAt = (x) => {
    if (x >= xm) { const u = clamp((x - xm) / nose, 0, 1); return R * Math.sqrt(Math.max(0, 1 - u ** (form === 'blunt' ? 2.4 : 2))); }
    if (x >= x2) return R;
    const u = clamp((x2 - x) / tail, 0, 1);
    return R * Math.max(0, 1 - u ** 1.8) ** 0.62;
  };
  const prof = [];
  const n = 30;
  for (let i = 0; i <= n; i++) {
    const s = (1 - Math.cos(Math.PI * i / n)) / 2;
    const x = -L / 2 + L * s;
    prof.push([i === 0 || i === n ? 0 : rAt(x), x]);
  }
  if (form === 'rigid') { prof.push([R, x2], [R, xm]); prof.sort((a, b) => a[1] - b[1]); }
  // arc length t along the profile
  const cum = [0];
  for (let i = 1; i < prof.length; i++) cum.push(cum[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
  const total = cum[cum.length - 1];
  const tOf = (x) => {
    for (let i = 1; i < prof.length; i++) {
      if (prof[i][1] >= x) { const f = (x - prof[i - 1][1]) / ((prof[i][1] - prof[i - 1][1]) || 1); return (cum[i - 1] + f * (cum[i] - cum[i - 1])) / total; }
    }
    return 1;
  };
  return { prof, rAt, tOf, L, R };
}

// the envelope along +x (lathe about x). Angles on S.lat: 0 bottom, 90 +y, 180 top, 270 -y.
// o: L, R, form, gores, rings (x positions), battens (nose stiffeners), text, textSide (+1|-1)
export function envelope(M, o) {
  const E = envProfile(o.L, o.R, o.form);
  const S = M.lathe(E.prof, { axis: 'x', segMul: 1.1, maxSeg: 120, sharpDeg: 60, seg: o.poly || undefined });
  S.env = E;
  if (M.decorOn) {
    const Lt = S.lat;
    const g = o.poly || (o.gores ?? 24);
    // gores (fabric seams) or, on a polygonal rigid hull, the longitudinal girders
    for (let i = 0; i < g; i++) Lt.meridian(i * 360 / g + (o.poly ? 0.2 : 7.5), E.tOf(-o.L / 2 * 0.97), E.tOf(o.L / 2 * 0.93), { w: o.poly ? 1 : 0 });
    if (o.poly) for (let i = 0; i < g; i++) Lt.meridian((i + 0.5) * 360 / g, E.tOf(-o.L / 2 * 0.8), E.tOf(o.L / 2 * 0.85), { w: 0 });
    const rs = o.rings || [];
    for (const x of rs) Lt.ring(E.tOf(x), { w: 1 });
    if (o.poly) for (let i = 0; i + 1 < rs.length; i++) Lt.ring(E.tOf((rs[i] + rs[i + 1]) / 2), { w: 0 });
    if (o.battens) {
      const nb = o.battens;
      for (let i = 0; i < nb; i++) Lt.meridian(i * 360 / nb, E.tOf(o.L / 2 - o.R * 1.1), 0.995, { w: 1 });
      Lt.ring(E.tOf(o.L / 2 - o.R * 1.1), { w: 1 });
    }
    Lt.shade({ t0: E.tOf(-o.L / 2 * 0.9), t1: E.tOf(o.L / 2 * 0.9), gap: 1.6, gapMax: 6, threshold: 0.28 });
    if (o.text) Lt.text(o.text, o.textSide > 0 ? 112 : 248, E.tOf(o.textX ?? -o.L * 0.02), o.textH ?? o.R * 0.34, { along: true });
  }
  return S;
}

// ------------------------------------------------------------------ lifting surfaces
// A tapered surface with an airfoil section. Local frame: chord along x (leading edge at the
// larger x), span along +z, thickness along y. root/tip: {x: leading edge x, h: span
// position (z), c: chord, t: thickness, y: offset}. Control surface: cs {u: 0.7, s0, s1}
// (span fractions) gets a hinge line, end gaps and light hatching. ribs: count.
const FOIL = [[0, 0], [0.05, 0.4], [0.22, 0.5], [0.7, 0.3], [1, 0.03], [1, -0.03], [0.7, -0.3], [0.22, -0.5], [0.05, -0.4]];
export function foil(M, o) {
  const sec = (s) => FOIL.map(([u, v]) => [s.x - s.c * u, (s.y || 0) + v * s.t, s.h]);
  // the tip section is a scaled copy of the root (keeps the side faces planar)
  const tip = { ...o.tip, t: o.root.t * o.tip.c / o.root.c };
  const A = sec(o.root), B = sec(tip);
  const S = M.loft(A, B, { smoothDeg: 30, isect: o.isect });
  const WA = A.map((p) => M.W(p)), WB = B.map((p) => M.W(p));
  const faces = FOIL.map((_, i) => S.f('s' + i));
  const P = (i, s) => lerp(WA[i], WB[i], s);
  const out = { S, WA, WB, P };
  // point on the surface at chord fraction u (0..1) on the upper (+y) side, span s
  out.at = (u, s, side = 1) => {
    const idx = side > 0 ? [0, 1, 2, 3, 4] : [0, 8, 7, 6, 5];
    for (let k = 0; k < 4; k++) {
      const u0 = FOIL[idx[k]][0], u1 = FOIL[idx[k + 1]][0];
      if (u <= u1 || k === 3) return lerp(P(idx[k], s), P(idx[k + 1], s), clamp((u - u0) / ((u1 - u0) || 1), 0, 1));
    }
  };
  if (!M.decorOn) { out.decor = () => out; return out; }
  const sideFaces = [[0, 1, 2, 3], [5, 6, 7, 8]];  // face i spans FOIL[i]..FOIL[i+1]
  const rib = (s, w = 1) => {
    for (const set of sideFaces) for (const i of set) fLine(faces[i], P(i, s), P((i + 1) % 9, s), { w });
  };
  const ribs = o.ribs ?? 0;
  for (let k = 1; k <= ribs; k++) rib(k / (ribs + 1), 0);
  // spar line at 25 % chord
  if (o.spar !== false) for (const i of [2, 7]) { const u = 0.25; const f = FOIL; const k = (u - f[2][0]) / (f[3][0] - f[2][0]); fLine(faces[i], lerp(P(i, 0), P(i + 1, 0), i === 2 ? k : 1 - k), lerp(P(i, 1), P(i + 1, 1), i === 2 ? k : 1 - k), { w: 0 }); }
  // control surfaces: the faces 3 (upper) and 5 (lower) span u 0.7..1
  for (const cs of o.cs || []) {
    for (const i of [3, 5]) {
      const f = faces[i];
      if (!f.on || !f.front) continue;
      const a0 = P(i, cs.s0), a1 = P(i, cs.s1), b0 = P(i + 1, cs.s0), b1 = P(i + 1, cs.s1);
      fLine(f, a0, a1, { w: 1 });
      fLine(f, a0, b0, { w: 1 });
      fLine(f, a1, b1, { w: 1 });
      f.hatch([a0, a1, b1, b0].map((p) => toFace(f, p)), { angle: 90, gap: 2.4 + 1.2 * (1 - f.tone), w: 0 });
      if (cs.tab) { const t0 = lerp(b0, b1, 0.15), t1 = lerp(b0, b1, 0.4); fLine(f, lerp(t0, lerp(a0, a1, 0.15), 0.35), lerp(t1, lerp(a0, a1, 0.4), 0.35), { w: 0 }); }
    }
  }
  if (o.text) {
    const f = faces[2].front ? faces[2] : faces[7];
    if (f.on && f.front) {
      const i = f === faces[2] ? 2 : 7;
      const c0 = lerp(P(i, 0.5), P(i + 1, 0.5), 0.5);
      const d0 = toFace(f, P(i + 1, 0.5)), d1 = toFace(f, P(i, 0.5));
      const ang = Math.atan2(d1[1] - d0[1], d1[0] - d0[0]) / D2R;
      const q = toFace(f, c0);
      const room = Math.hypot(d1[0] - d0[0], d1[1] - d0[1]) * 0.8;
      const th = Math.min(o.textH, room / Math.max(0.1, f.textWidth(o.text, 1)));
      f.text(o.text, q[0], q[1], th, { angle: ang, upright: true });
    }
  }
  return out;
}

// ------------------------------------------------------------------ nacelle and engine car
// along +x, centered at the origin. o: len, r, prop ('front' | 'rear' | null), blades, intake
export function nacelle(M, o = {}) {
  const L = o.len ?? 2.4, r = o.r ?? 0.45;
  const prof = [[0, -L / 2], [r * 0.45, -L / 2 + r * 0.05], [r * 0.7, -L / 2 + L * 0.12], [r * 0.95, -L * 0.15], [r, L * 0.15], [r * 0.95, L / 2 - L * 0.12], [r * 0.82, L / 2 - r * 0.15], [r * 0.6, L / 2]];
  if (o.open !== false) prof.push([r * 0.45, L / 2 - r * 0.1]);
  const S = M.lathe(prof, { axis: 'x', sharpDeg: 40 });
  if (M.decorOn) {
    const Lt = S.lat;
    Lt.ring(0.42, { w: 1 }); Lt.ring(0.62, { w: 1 });
    for (const a of [45, 135, 225, 315]) Lt.meridian(a, 0.42, 0.62, { w: 0 });
    Lt.shade({ t0: 0.1, t1: 0.9, gap: 1.5, gapMax: 4.5 });
    if (o.vents) for (let k = 0; k < 4; k++) Lt.shape(o.vents, 0.47 + k * 0.03, [[-r * 0.25, 0], [r * 0.25, 0]], { w: 0 });
  }
  if (o.exhaust !== false) {
    // stub exhausts on both sides
    for (const s of [1, -1]) M.tube([L * 0.05, s * r * 0.8, -r * 0.35], [-L * 0.22, s * r * 1.05, -r * 0.4], r * 0.09, { isect: true });
  }
  if (o.prop === 'front') M.at(L / 2 + r * 0.05, 0, 0, () => K.propeller(M, { r: o.propR ?? r * 3, blades: o.blades ?? 3 }));
  if (o.prop === 'rear') M.at(-L / 2 - r * 0.1, 0, 0, () => M.rz(180, () => K.propeller(M, { r: o.propR ?? r * 3, blades: o.blades ?? 3 })));
  return S;
}

// ------------------------------------------------------------------ cabin pod
// a car with a slanted glazed nose, extruded side profile. Bottom at z = 0, nose +x.
// Returns {S, side(s): the side face, windows: count}
export function pod(M, o = {}) {
  const L = o.len ?? 6, W = o.w ?? 2.2, H = o.h ?? 2.2;
  const nb = o.noseBot ?? 0.35, nt = o.noseTop ?? 0.18;
  const prof = [[-L / 2 + H * 0.18, 0], [L / 2 - H * nb, 0], [L / 2, H * 0.38], [L / 2 - H * nt, H], [-L / 2, H], [-L / 2, H * 0.3]];
  const S = M.extrude(prof, -W / 2, W / 2, { plane: 'xz' });
  // glazing on the slanted nose faces: s1 (lower nose) and s2 (windscreen)
  const res = { S, windows: 0 };
  if (M.decorOn) {
    for (const k of ['s2', 's1']) {
      const f = S.f(k);
      if (!f.on || !f.front) continue;
      const b = f.box, m = f.mOf(2.4);
      const n = Math.max(2, Math.round(f.w / (H * 0.45)));
      const gw = (f.w - m * 2) / n;
      for (let i = 0; i < n; i++) {
        const x0 = b[0] + m + gw * i;
        if (k === 's2') window2(f, [x0 + m * 0.3, b[1] + m, x0 + gw - m * 0.3, b[3] - m], { frame: 0.08, flip: i % 2 === 1 });
        else if (i % 2 === 0) window2(f, [x0 + m * 0.3, b[1] + f.h * 0.35, x0 + gw - m * 0.3, b[3] - m], { frame: 0.1 });
      }
    }
    // roof and floor seams
    for (const k of ['s3', 's0']) {
      const f = S.f(k);
      if (!f.on || !f.front) continue;
      const n = Math.max(2, Math.round(f.w / (H * 0.7)));
      for (const r of f.grid(n, 1, { gap: 2 })) {
        if (k === 's3' && r.i === Math.floor(n / 2) && f.pxOf(r[2] - r[0]) > 18) { K.louver(f, r); continue; }
        if (k === 's3' && r.i === 0 && f.pxOf(r[2] - r[0]) > 14) { K.accessHatch(f, r); continue; }
        K.frame(f, r, { inset: 1.4 }); if (k === 's0') f.hatch(r, { angle: 90, gap: 2.8 - f.tone, w: 0 });
      }
    }
  }
  res.side = (s) => S.f(s > 0 ? '+y' : '-y');
  return res;
}
// windows, door and seams on a pod side face. o: n windows, door (x fraction), text
export function podSide(M, P, s, o = {}) {
  const f = P.side(s);
  if (!f.on || !f.front) return 0;
  const H = f.h, Lf = f.w;
  const sx = (x) => x * (f.u[0] >= 0 ? 1 : -1);   // face u runs along +x or -x
  const y0 = -H / 2;
  // belt line and skin seams
  f.line(-Lf / 2, y0 + H * 0.3, Lf / 2, y0 + H * 0.3, { w: 1 });
  const ns = Math.max(2, Math.round(Lf / (H * 0.8)));
  for (let i = 1; i < ns; i++) { const x = -Lf / 2 + Lf * i / ns; f.line(x, y0 + 0.02, x, y0 + H * 0.3, { w: 0 }); }
  f.rivets(-Lf / 2 + f.mOf(5), y0 + H * 0.3 - f.mOf(3), Lf / 2 - f.mOf(5), y0 + H * 0.3 - f.mOf(3), { pitch: 8 });
  f.hatch([-Lf / 2, y0 + 0.01, Lf / 2, y0 + H * 0.3 - f.mOf(5)], { angle: 0, gap: 3.2 - f.tone, w: 0, holes: o.door != null ? [[sx(o.door * Lf / 2) - H * 0.22, y0, sx(o.door * Lf / 2) + H * 0.22, y0 + H]] : [] });
  // windows
  const n = o.n ?? Math.max(2, Math.round(Lf / (H * 0.55)));
  let doorX = null;
  if (o.door != null) doorX = sx(o.door * Lf / 2);
  const x0 = -Lf / 2 + H * 0.25, x1 = Lf / 2 - H * 0.35;
  const pitch = (x1 - x0) / n, ww = pitch * 0.62;
  let count = 0;
  for (let i = 0; i < n; i++) {
    const cx = x0 + pitch * (i + 0.5);
    if (doorX != null && Math.abs(cx - doorX) < H * 0.3) continue;
    window2(f, [cx - ww / 2, y0 + H * 0.4, cx + ww / 2, y0 + H * 0.82], { flip: i % 2 === 1 });
    count++;
  }
  if (doorX != null) {
    const dw = H * 0.34, dh = H * 0.86;
    const r = [doorX - dw / 2, y0 + H * 0.04, doorX + dw / 2, y0 + H * 0.04 + dh];
    f.rect(r, { w: 1 });
    f.rect(r[0] + f.mOf(1.6), r[1] + f.mOf(1.6), r[2] - f.mOf(1.6), r[3] - f.mOf(1.6), { w: 0 });
    window2(f, [doorX - dw * 0.3, y0 + H * 0.52, doorX + dw * 0.3, y0 + H * 0.78], { frame: 0.1 });
    f.rect(doorX + dw * 0.28, y0 + H * 0.4, doorX + dw * 0.36, y0 + H * 0.48, { w: 1 });
  }
  if (o.text) K.stencil(f, o.text, sx(-Lf * 0.22), y0 + H * 0.16, H * 0.12);
  // roof gutter line and a rivet row above the windows
  f.line(-Lf / 2, y0 + H * 0.9, Lf / 2, y0 + H * 0.9, { w: 0 });
  f.rivets(-Lf / 2 + f.mOf(5), y0 + H * 0.86, Lf / 2 - f.mOf(5), y0 + H * 0.86, { pitch: 9 });
  return count;
}

// ------------------------------------------------------------------ undercarriage
// a leg from (0,0,h) down to an axle at z = wr, wheel of radius wr touching z = 0.
// o: h, wr, ww, fork ('side' | 'fork'), r (strut radius), drag (x offset of the wheel)
export function gearLeg(M, o = {}) {
  const wr = o.wr ?? 0.35, h = o.h ?? 1.2, r = o.r ?? wr * 0.18, ww = o.ww ?? wr * 0.6, dx = o.drag ?? 0;
  const axle = [dx, 0, wr];
  const mid = [dx * 0.4, 0, wr + (h - wr) * 0.45];
  // oleo: upper cylinder and the sliding lower tube
  M.tube([0, 0, h], mid, r * 1.25, {});
  M.tube(mid, [dx, 0, wr + wr * 0.9], r * 0.85, { isect: false });
  K.collar(M, [0, 0, h], mid, 0.92, r * 1.25, { len: r * 1.2, k: 1.25 });
  // fork
  for (const s of [1, -1]) M.tube([dx, s * (ww / 2 + r * 0.6), wr + wr * 0.95], [dx, s * (ww / 2 + r * 0.6), wr], r * 0.5, { isect: false });
  M.tube([dx, -(ww / 2 + r * 0.6), wr + wr * 0.95], [dx, ww / 2 + r * 0.6, wr + wr * 0.95], r * 0.6, { isect: false });
  // torque link
  M.tube([dx * 0.4 + r * 1.3, 0, wr + (h - wr) * 0.55], [dx + r * 1.4, 0, wr + wr * 1.05], r * 0.3, { isect: false });
  M.at(axle[0], 0, axle[2], () => K.wheel(M, { r: wr, w: ww, hub: wr * 0.55 }));
  return { axle: [dx, 0, wr] };
}

// float / pontoon along x, keel at z = 0. o: len, w, h. Returns the solid
export function pontoon(M, o = {}) {
  const L = o.len ?? 6, W = o.w ?? 0.8, H = o.h ?? 0.7;
  const deck = [[L * 0.5, 0], [L * 0.42, W * 0.35], [L * 0.25, W / 2], [-L * 0.38, W / 2], [-L / 2, W * 0.2], [-L / 2, -W * 0.2], [-L * 0.38, -W / 2], [L * 0.25, -W / 2], [L * 0.42, -W * 0.35]];
  const keel = deck.map(([x, y]) => [x * 0.88 - L * 0.04, y * 0.35]);
  const S = M.loft(keel.map(([x, y]) => [x, y, 0]), deck.map(([x, y]) => [x, y, H]), { smoothDeg: 40 });
  if (M.decorOn) {
    const top = S.f('b');
    if (top.on && top.front) {
      const n = Math.max(3, Math.round(L / (W * 1.2)));
      for (let i = 1; i < n; i++) { const x = -L * 0.38 + (L * 0.63) * i / n; top.line(x, -W * 0.45, x, W * 0.45, { w: 0 }); }
      top.line(-L * 0.45, 0, L * 0.4, 0, { w: 0 });
      for (let i = 0; i < 3; i++) top.circle(-L * 0.3 + L * 0.25 * i, W * 0.22, W * 0.06, { w: 1 });
    }
    // chine stripes on the sides
    for (let i = 0; i < deck.length; i++) {
      const f = S.f('s' + i);
      if (!f.on || !f.front || f.w < W * 0.8) continue;
      f.line(-f.w / 2, f.h * 0.15, f.w / 2, f.h * 0.15, { w: 0 });
      f.hatch([-f.w / 2, -f.h / 2, f.w / 2, f.h * 0.15], { angle: 0, gap: 3.0 - f.tone, w: 0 });
    }
  }
  return S;
}

// ------------------------------------------------------------------ struts and wires
export function wire(M, a, b, o = {}) { M.line([a, b], { w: o.w ?? 0, pass: o.pass ?? 2, fit: o.fit }); }
// a sagging rope through n points
export function rope(M, a, b, sag = 0, o = {}) {
  const pts = [];
  const n = sag ? 8 : 1;
  for (let i = 0; i <= n; i++) { const t = i / n; const p = lerp(a, b, t); p[2] -= sag * 4 * t * (1 - t); pts.push(p); }
  M.line(pts, { w: o.w ?? 0, pass: o.pass ?? 2, fit: o.fit });
}
export function strut(M, a, b, r, o = {}) {
  K.strut(M, a, b, r, { collars: o.collars ?? true });
  if (o.balls !== false) { K.ball(M, a, r * 1.4); K.ball(M, b, r * 1.4); }
}

// ------------------------------------------------------------------ small things
// teardrop ballast bag hanging with its top at the origin
export function bag(M, o = {}) {
  const r = o.r ?? 0.35;
  const S = M.lathe([[0, -r * 2.2], [r * 0.7, -r * 1.9], [r, -r * 1.3], [r * 0.85, -r * 0.6], [r * 0.35, -r * 0.15], [r * 0.18, 0]]);
  if (M.decorOn) { S.lat.ring(0.75, { w: 1 }); S.lat.shade({ gap: 1.4, gapMax: 3.5 }); for (const a of [0, 90, 180, 270]) S.lat.meridian(a + 45, 0.15, 0.8, { w: 0 }); }
  return S;
}

// a small low-wing monoplane, nose +x, centered on the wing; o.span
export function miniPlane(M, o = {}) {
  const sp = o.span ?? 6, s = sp / 6;
  const F = M.lathe([[0, -2.6 * s], [0.18 * s, -2.4 * s], [0.42 * s, -0.6 * s], [0.48 * s, 0.6 * s], [0.42 * s, 1.5 * s], [0.25 * s, 1.75 * s]], { axis: 'x', sharpDeg: 50 });
  if (M.decorOn) { F.lat.ring(0.62, { w: 1 }); F.lat.ring(0.42, { w: 1 }); F.lat.shade({ gap: 1.4, gapMax: 3.5 }); }
  M.at(0.2 * s, 0, 0.32 * s, () => K.canopy(M, { len: 1.1 * s, w: 0.55 * s, h: 0.38 * s }));
  M.mirrorY(() => M.rx(-90, () => foil(M, { root: { x: 0.9 * s, h: 0.3 * s, c: 1.25 * s, t: 0.16 * s, y: 0.15 * s }, tip: { x: 0.65 * s, h: sp / 2, c: 0.75 * s, t: 0.09 * s, y: 0.3 * s }, ribs: 3, cs: [{ s0: 0.45, s1: 0.95 }], spar: false })));
  M.mirrorY(() => M.rx(-90, () => foil(M, { root: { x: -1.85 * s, h: 0.1 * s, c: 0.6 * s, t: 0.06 * s }, tip: { x: -2.05 * s, h: 1.1 * s, c: 0.4 * s, t: 0.04 * s }, cs: [{ s0: 0.1, s1: 0.95 }], spar: false })));
  foil(M, { root: { x: -1.9 * s, h: 0.1 * s, c: 0.75 * s, t: 0.06 * s }, tip: { x: -2.3 * s, h: 1.0 * s, c: 0.45 * s, t: 0.04 * s }, cs: [{ s0: 0.1, s1: 0.95 }], spar: false });
  M.at(1.78 * s, 0, 0, () => K.propeller(M, { r: 0.75 * s, blades: 2 }));
  return F;
}

// small boat hull with a wheelhouse, keel at z = 0, bow +x
export function boat(M, o = {}) {
  const L = o.len ?? 7, W = L * 0.32, H = L * 0.14;
  const deck = [[L / 2, 0], [L * 0.3, W * 0.42], [-L * 0.1, W / 2], [-L / 2, W * 0.42], [-L / 2, -W * 0.42], [-L * 0.1, -W / 2], [L * 0.3, -W * 0.42]];
  const keel = deck.map(([x, y]) => [x * 0.8 - L * 0.05, y * 0.35]);
  const S = M.loft(keel.map(([x, y]) => [x, y, 0]), deck.map(([x, y]) => [x, y, H]), {});
  if (M.decorOn) for (let i = 0; i < deck.length; i++) {
    const f = S.f('s' + i);
    if (!f.on || !f.front) continue;
    f.hatch(f.poly, { angle: 0, gap: 3.6 - f.tone * 1.2, w: 0 });
    if (o.text && f.w > L * 0.35) K.stencil(f, o.text, 0, f.h * 0.15, H * 0.3);
  }
  if (o.cabin === false) {
    // thwarts and an outboard motor
    for (const x of [-L * 0.2, L * 0.12]) M.box([x - L * 0.04, -W * 0.4, H * 0.6], [x + L * 0.04, W * 0.4, H * 0.72], { isect: false });
    M.at(-L / 2 - 0.1, 0, H * 0.4, () => { M.boxc([0, 0, H * 0.6], [L * 0.08, W * 0.18, H * 0.6]); M.tube([0, 0, H * 0.3], [0, 0, -H * 0.8], L * 0.015, {}); });
    return S;
  }
  const C = M.box([-L * 0.25, -W * 0.3, H], [L * 0.05, W * 0.3, H + H * 1.1]);
  for (const k of ['+x', '+y', '-y', '-x']) { const f = C.f(k); if (f.on && f.front) windowRow(f, -f.w / 2 + f.mOf(2), f.w / 2 - f.mOf(2), 0, f.h * 0.35, k[1] === 'x' ? 2 : 3); }
  M.at(-L * 0.1, 0, H * 2.1, () => K.whip(M, { h: H * 1.5 }));
  return S;
}

// a small house with a gable roof, a door, windows and a chimney; floor at z = 0, ridge along x
export function house(M, o = {}) {
  const L = o.len ?? 6, W = o.w ?? 4.5, H = o.h ?? 2.8, R = W * 0.38;
  const B = M.box([-L / 2, -W / 2, 0], [L / 2, W / 2, H]);
  const roof = M.extrude([[-W / 2 - 0.25, H - 0.1], [W / 2 + 0.25, H - 0.1], [0, H + R]], -L / 2 - 0.25, L / 2 + 0.25, { plane: 'yz' });
  if (M.decorOn) {
    for (const k of ['+y', '-y']) {
      const f = B.f(k);
      if (!f.on || !f.front) continue;
      f.hatch(f.box, { angle: 0, gap: 3.4 - f.tone, w: 0, holes: [[-L * 0.35, -H * 0.15, -L * 0.1, H * 0.25], [L * 0.1, -H * 0.15, L * 0.35, H * 0.25], [-L * 0.03, -H / 2, L * 0.08 + 0.4, H * 0.32]] });
      window2(f, [-L * 0.35, -H * 0.15, -L * 0.1, H * 0.25], { mullion: true });
      window2(f, [L * 0.1, -H * 0.15, L * 0.35, H * 0.25], { mullion: true });
      f.rect(-L * 0.03, -H / 2, L * 0.08 + 0.4, H * 0.32, { w: 1 });
    }
    for (const k of ['+x', '-x']) { const f = B.f(k); if (f.on && f.front) { f.hatch(f.box, { angle: 0, gap: 3.4 - f.tone, w: 0, holes: [[-W * 0.15, -H * 0.1, W * 0.15, H * 0.25]] }); window2(f, [-W * 0.15, -H * 0.1, W * 0.15, H * 0.25], { mullion: true }); } }
    for (const k of ['s0', 's1', 's2']) { const f = roof.f(k); if (f.on && f.front && f.h > R * 0.5) { f.hatch(f.poly, { angle: 90, gap: 2.6 - f.tone * 0.8, w: 0 }); for (let i = 1; i < 6; i++) f.line(-f.w / 2, -f.h / 2 + f.h * i / 6, f.w / 2, -f.h / 2 + f.h * i / 6, { w: 0 }); } }
  }
  M.box([L * 0.2, W * 0.1, H + R * 0.3], [L * 0.2 + 0.5, W * 0.1 + 0.5, H + R * 1.05]);
  return B;
}

// a ground spot for the scale figure: off to the left of the vehicle on paper, ext meters
// from the center (the fleet's default can land in front of a small vehicle)
export function figSpot(M, ext, c = [0, 0]) {
  const r = M.view.r, e = M.view.e;
  const h = Math.hypot(e[0], e[1]) || 1;
  return [c[0] - r[0] * ext + e[0] / h * ext * 0.15, c[1] - r[1] * ext + e[1] / h * ext * 0.15];
}
// a point moved toward the viewer by d meters (callout anchors in front of round things)
export function toward(M, p, d) { const e = M.view.e; return [p[0] + e[0] * d, p[1] + e[1] * d, p[2] + e[2] * d]; }

// ------------------------------------------------------------------ people and cockpit
// a person facing +x. seated: hip at the origin, feet forward; standing: feet on z = 0.
// o.arms: 'stick' (hands forward and low), 'bar' (hands forward at chest height), 'side'
export function pilot(M, o = {}) {
  const seated = o.seated !== false;
  const hip = seated ? [0, 0, 0] : [0, 0, 0.92];
  const sh = add(hip, seated ? [-0.06, 0, 0.56] : [0, 0, 0.52]);
  const leg = 0.07, arm = 0.05;
  for (const s of [1, -1]) {
    const h = add(hip, [0, s * 0.1, 0]);
    if (seated) {
      const knee = add(hip, [0.45, s * 0.13, 0.08]), foot = add(hip, [0.62, s * 0.14, -0.38]);
      M.tube(h, knee, leg, { isect: false }); M.tube(knee, foot, leg * 0.85, { isect: false });
      M.boxc(add(foot, [0.06, 0, -0.04]), [0.24, 0.1, 0.08], { isect: false });
    } else {
      const knee = [0.04, s * 0.11, 0.48], foot = [0, s * 0.12, 0.05];
      M.tube(h, knee, leg, { isect: false }); M.tube(knee, foot, leg * 0.85, { isect: false });
      M.boxc([0.06, s * 0.12, 0.04], [0.24, 0.1, 0.08], { isect: false });
    }
    const shoulder = add(sh, [0, s * 0.2, -0.02]);
    const arms = o.arms || 'stick';
    const elbow = add(shoulder, arms === 'side' ? [0, s * 0.06, -0.28] : [0.2, s * 0.05, -0.22]);
    const hand = arms === 'side' ? add(elbow, [0.05, 0, -0.26]) : arms === 'bar' ? add(elbow, [0.3, -s * 0.02, 0.12]) : add(elbow, [0.26, -s * 0.06, -0.02]);
    M.tube(shoulder, elbow, arm, { isect: false }); M.tube(elbow, hand, arm * 0.85, { isect: false });
    M.at(hand[0], hand[1], hand[2], () => M.sphere(0.05, { isect: false }));
  }
  // torso and head with a helmet
  const T = M.at(...add(hip, [0, 0, -0.04]), () => M.scale(1, 1.25, 1, () => M.lathe([[0.08, 0], [0.15, 0.08], [0.16, 0.42], [0.12, 0.6], [0.05, 0.64]], {})));
  if (M.decorOn) T.lat.shade({ gap: 1.2, gapMax: 3 });
  const head = add(sh, [0.02, 0, 0.2]);
  M.at(head[0], head[1], head[2], () => {
    M.sphere(0.11, { isect: false });
    const H = M.lathe([[0.125, -0.02], [0.13, 0.04], [0.11, 0.1], [0.06, 0.135], [0, 0.145]], { isect: false });
    if (M.decorOn) H.lat.shade({ gap: 1.1, gapMax: 2.6, threshold: 0.2 });
    if (o.goggles !== false) M.at(0.1, 0, 0.03, () => M.boxc([0, 0, 0], [0.04, 0.17, 0.05], { isect: false }));
  });
  return { hip, head };
}
// a bucket seat at the origin (seat pan top at z = 0), facing +x
export function seat(M, o = {}) {
  const w = o.w ?? 0.5;
  const P = M.box([-0.22, -w / 2, -0.06], [0.28, w / 2, 0]);
  const B = M.loft([[-0.22, -w / 2, -0.02], [-0.16, -w / 2, -0.02], [-0.16, w / 2, -0.02], [-0.22, w / 2, -0.02]], [[-0.36, -w / 2, 0.62], [-0.3, -w / 2, 0.62], [-0.3, w / 2, 0.62], [-0.36, w / 2, 0.62]], {});
  void P; void B;
  return P;
}
// instrument pod with dials on its face toward +x... (the face toward the pilot is -x)
export function panel(M, o = {}) {
  const w = o.w ?? 0.5, h = o.h ?? 0.26;
  const S = M.box([-0.06, -w / 2, -h / 2], [0.06, w / 2, h / 2]);
  for (const k of ['-x', '+z']) {
    const f = S.f(k);
    if (!f.on || !f.front) continue;
    if (k === '+z') { f.hatch(f.box, { angle: 0, gap: 2.4, w: 0 }); continue; }
    const n = Math.max(2, Math.round(w / (h * 0.55)));
    for (let i = 0; i < n; i++) { const x = -f.w / 2 + f.w * (i + 0.5) / n; f.circle(x, f.h * 0.08, Math.min(f.w / n, f.h) * 0.32, { w: 1 }); f.line(x, f.h * 0.08, x + f.h * 0.12, f.h * 0.2, { w: 0 }); }
  }
  return S;
}
// a cylinder with cooling fins along local z, z0..z1
export function finned(M, r, z0, z1, o = {}) {
  const n = Math.max(3, Math.round((z1 - z0) / (r * 0.28)));
  const prof = [[r * 0.7, z0]];
  for (let i = 0; i < n; i++) {
    const a = z0 + (z1 - z0) * i / n, b = z0 + (z1 - z0) * (i + 0.5) / n;
    prof.push([r, a + (z1 - z0) / n * 0.1], [r, b - (z1 - z0) / n * 0.1], [r * 0.78, b], [r * 0.78, a + (z1 - z0) / n]);
  }
  prof.push([r * 0.5, z1 + r * 0.25]);
  return M.lathe(prof, { isect: false, sharpDeg: 30, seg: o.seg });
}
// a flat-twin engine: crankcase and two finned cylinders along y, prop shaft along -x
export function boxer(M, o = {}) {
  const s = o.s ?? 1;
  const C = M.boxc([0, 0, 0], [0.42 * s, 0.32 * s, 0.34 * s], { chamfer: 0.06 * s });
  for (const k of ['+y', '-y', '+z']) { const f = C.f(k); if (f.on && f.front) { f.rivets(-f.w * 0.4, f.h * 0.35, f.w * 0.4, f.h * 0.35, { pitch: 5 }); } }
  for (const sy of [1, -1]) M.rx(sy * -90, () => finned(M, 0.11 * s, 0.14 * s, 0.42 * s));
  // carburetor, exhaust stubs
  M.at(0.12 * s, 0, 0.17 * s, () => M.cyl(0.05 * s, 0, 0.12 * s, { isect: false }));
  for (const sy of [1, -1]) M.pipe([[0, sy * 0.3 * s, -0.08 * s], [-0.05 * s, sy * 0.3 * s, -0.2 * s], [-0.3 * s, sy * 0.2 * s, -0.22 * s]], 0.025 * s, { isect: false });
  return C;
}
// glints: a few short parallel strokes on glass, given three world points of a patch
export function glints(M, a, b, c, n = 3) {
  for (let i = 0; i < n; i++) {
    const t = 0.25 + i * 0.12;
    M.line([lerp(lerp(a, b, t), c, 0.15), lerp(lerp(a, b, t + 0.15), c, 0.5)], { w: 0, pass: 3 });
  }
}

// a small car, nose +x, wheels on z = 0. kind: 'car' | 'jeep' | 'cart' | 'van'
export function car(M, kind = 'car') {
  const wr = 0.3, L = kind === 'cart' ? 2.2 : kind === 'van' ? 4.2 : 3.6, W = 1.55;
  for (const x of [L * 0.32, -L * 0.32]) for (const y of [W / 2 - 0.12, -W / 2 + 0.12]) M.at(x, y, wr, () => K.wheel(M, { r: wr, w: 0.2 }));
  const B = M.box([-L / 2, -W / 2, wr * 0.8], [L / 2, W / 2, wr * 0.8 + 0.55], { chamfer: 0.08 });
  for (const k of ['+y', '-y']) { const f = B.f(k); if (f.on && f.front) { f.line(-f.w / 2, f.h * 0.1, f.w / 2, f.h * 0.1, { w: 0 }); if (kind !== 'cart') f.line(-f.w * 0.05, -f.h / 2, -f.w * 0.05, f.h / 2, { w: 0 }); } }
  if (kind === 'cart') { M.at(-0.2, 0, wr * 0.8 + 0.55, () => K.crate(M, { s: [1.2, 1.0, 0.7] })); return B; }
  const zr = wr * 0.8 + 0.55, hr = kind === 'van' ? 1.0 : kind === 'jeep' ? 0.6 : 0.5;
  const top = kind === 'van' ? [[-L / 2, 0], [L * 0.3, 0], [L * 0.22, hr], [-L / 2, hr]] : kind === 'jeep' ? [[-L * 0.45, 0], [L * 0.05, 0], [L * 0.1, hr], [-L * 0.45, hr]] : [[-L * 0.35, 0], [L * 0.2, 0], [L * 0.05, hr], [-L * 0.25, hr]];
  const C = M.at(0, 0, zr, () => M.extrude(top, -W / 2 + 0.08, W / 2 - 0.08, { plane: 'xz' }));
  for (const k of ['+y', '-y']) { const f = C.f(k); if (f.on && f.front) { if (kind === 'van') A_window(f, [f.w * 0.1, -f.h * 0.0, f.w * 0.42, f.h * 0.38]); else A_window(f, [-f.w * 0.42, -f.h * 0.25, f.w * 0.42, f.h * 0.38], true); } }
  return B;
}
function A_window(f, r, m) { window2(f, r, { mullion: m, frame: 0.1 }); }

// wave strokes on the water in a band around a craft: x0..x1, y0..y1, density k
export function waves(M, x0, x1, y0, y1, k = 1, seed = 7) {
  let q = seed;
  const rnd = () => { q = (q * 16807) % 2147483647; return q / 2147483647; };
  const n = Math.round(14 * k);
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * rnd(), y = y0 + (y1 - y0) * rnd();
    const len = 1.2 + rnd() * 2.2, amp = 0.12 + rnd() * 0.1;
    const pts = [];
    for (let j = 0; j <= 8; j++) { const u = j / 8; pts.push([x - len / 2 + len * u, y + Math.sin(u * Math.PI * 2) * amp, 0]); }
    M.line(pts, { w: 0, pass: 2, fit: false });
  }
}

export { K, dot, sub, add, mul, lerp, len, norm, cross, D2R, circlePts };
