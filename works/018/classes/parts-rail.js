// classes/parts-rail.js: shared parts for the rail family (locomotive, monorail, railcrane).
// Track with rails and ties, flanged wheels (spoked or disc), wheelsets, bogies with side
// frames, axle boxes and springs, buffers, couplers, pantographs, insulators, headlamps,
// handrails, steps, a handcar. Everything builds at the current frame's origin, +x forward
// (along the track), +z up, like the kit.
//
// Track geometry: ground z = 0, optional ballast bed, ties, rails. track() returns
// { top } the rail-top height; build running gear with its origin at z = top.
// Wheels: the wheel of the LEFT rail (+y) with its flange on the inner (-y) side; build the
// right one through M.mirrorY. wheelY(g) is the wheel's center plane for gauge g.

import * as K from '../kit.js';
import { D2R, circlePts } from '../geom.js';

export const WHEEL_W = 0.14;
export const wheelY = (g) => g / 2 - 0.035 + WHEEL_W / 2;     // center plane of the wheel
export const railY = (g) => g / 2 + 0.035;                    // center of the rail head

// arc-length parameter of a point inside segment j of a lathe profile (for ring decor)
export function tOf(prof, j, f, loop = false) {
  const n = loop ? prof.length : prof.length - 1;
  let tot = 0, at = 0;
  for (let i = 0; i < n; i++) {
    const p = prof[i], q = prof[(i + 1) % prof.length];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (i < j) at += l; else if (i === j) at += l * f;
    tot += l;
  }
  return at / (tot || 1);
}

// face coordinates of a world point on a planar face (any orientation)
export function fxz(f, P) {
  const d = [P[0] - f.o[0], P[1] - f.o[1], P[2] - f.o[2]];
  return [d[0] * f.u[0] + d[1] * f.u[1] + d[2] * f.u[2], d[0] * f.v[0] + d[1] * f.v[1] + d[2] * f.v[2]];
}

// face rect / point from local 3D points (in the current frame) on a planar face
export function frect(M, f, p0, p1) {
  const a = fxz(f, M.W(p0)), b = fxz(f, M.W(p1));
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
}
export function fpt(M, f, p) { return fxz(f, M.W(p)); }
// a window: frame and dark glass, optional center bar
export function windowAt(f, r, o = {}) {
  if (!f.on) return;
  f.rect(r, { w: 1 });
  const m = Math.min(r[2] - r[0], r[3] - r[1]) * (o.frame ?? 0.12);
  const g = [[r[0] + m, r[1] + m], [r[2] - m, r[1] + m], [r[2] - m, r[3] - m], [r[0] + m, r[3] - m]];
  K.glass(f, g, { angle: o.angle ?? 62, flip: o.flip });
  if (o.bar) f.line((r[0] + r[2]) / 2, r[1] + m, (r[0] + r[2]) / 2, r[3] - m, { w: 1 });
}
// rounded-roof car body section across (y, z), floor at z = 0, for extrude plane 'yz'
export function roofProfile(w, h, rr) {
  const p = [[-w / 2, 0], [w / 2, 0], [w / 2, h - rr]];
  for (let i = 1; i <= 4; i++) { const a = (90 * i / 4) * D2R; p.push([w / 2 - rr + Math.cos(a) * rr, h - rr + Math.sin(a) * rr]); }
  for (let i = 0; i <= 3; i++) { const a = (90 + 90 * i / 4) * D2R; p.push([-w / 2 + rr + Math.cos(a) * rr, h - rr + Math.sin(a) * rr]); }
  p.push([-w / 2, h - rr]);
  return p;   // sides: 's1' is +y, 's11' is -y
}

// ------------------------------------------------------------------ track
export const trackTop = (ballast) => (ballast ? 0.24 : 0) + 0.15 + 0.16;
// along x from x0 to x1, gauge g. o.ballast (bed under the ties), o.pitch (tie spacing),
// o.joint (x of a rail joint with fishplates). Returns { top, tieTop }.
export function track(M, o) {
  const g = o.gauge ?? 1.435, x0 = o.x0, x1 = o.x1;
  const bal = o.ballast ? 0.24 : 0;
  const tieH = 0.15, tieW = 0.25, tieL = g + 1.1, pitch = o.pitch ?? 0.64;
  const yR = railY(g);
  M.part('TRACK', () => {
    if (bal) {
      const hw = tieL / 2 + 0.25;
      const B = M.extrude([[-hw - 0.55, 0], [hw + 0.55, 0], [hw, bal], [-hw, bal]], x0 - 0.4, x1 + 0.4, { plane: 'yz' });
      for (const k of ['s1', 's3']) {
        const f = B.f(k);
        if (f.on) {
          // loose stone: short broken strokes across the shoulder
          const n = Math.floor(f.pxOf(f.w) / 9);
          for (let i = 0; i < n; i++) {
            const x = -f.w / 2 + (i + 0.5) * f.w / n;
            const yy = ((i * 37) % 11) / 11;
            f.line(x, -f.h / 2 + f.h * 0.15 * yy, x + f.w / n * 0.35, -f.h / 2 + f.h * (0.25 + 0.4 * yy), { w: 0 });
            f.circle(x + f.w / n * 0.55, -f.h / 2 + f.h * (0.6 - 0.3 * yy), f.mOf(1.1), { n: 5, w: 0 });
          }
        }
      }
      const ft = B.f('s2');
      if (ft.on) ft.hatch(ft.box, { angle: 0, gap: 7, w: 0 });
    }
    const n = Math.max(2, Math.floor((x1 - x0) / pitch));
    const off = ((x1 - x0) - (n - 1) * pitch) / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + off + i * pitch;
      const T = M.box([x - tieW / 2, -tieL / 2, bal], [x + tieW / 2, tieL / 2, bal + tieH], { isect: false });
      const f = T.f('+z');
      if (f.on) {
        // tie plates under the rails, grain along the tie
        for (const s of [1, -1]) {
          const y = s * yR;
          // face u runs along the tie (local x of the box is world x: on decks u follows x)
          f.rect(-tieW * 0.42, y - 0.13, tieW * 0.42, y + 0.13, { w: 0 });
          f.circle(-tieW * 0.3, y + s * 0.1, f.mOf(0.8), { n: 5, w: 0 });
          f.circle(tieW * 0.3, y - s * 0.1, f.mOf(0.8), { n: 5, w: 0 });
        }
        f.line(-tieW * 0.18, -tieL * 0.3, -tieW * 0.18, tieL * 0.3, { w: 0 });
      }
      for (const k of ['+x', '-x']) { const s = T.f(k); if (s.on && s.front && s.tone > 0.3) s.hatch(s.box, { angle: 0, gap: 2.4, w: 0 }); }
    }
    // rails: flat-bottom section, along x, in two lengths with a fishplate joint
    const rh = 0.16;
    const prof = [[-0.068, 0], [0.068, 0], [0.068, 0.012], [0.013, 0.03], [0.013, 0.108], [0.036, 0.12], [0.036, rh], [-0.036, rh], [-0.036, 0.12], [-0.013, 0.108], [-0.013, 0.03], [-0.068, 0.012]];
    const xj = o.joint ?? (x0 + (x1 - x0) * 0.37);
    for (const s of [1, -1]) {
      for (const [a, b] of [[x0, xj - 0.005], [xj + 0.005, x1]]) {
        M.at(0, s * yR, bal + tieH, () => M.extrude(prof, a, b, { plane: 'yz', isect: false }));
      }
      M.at(0, s * yR, bal + tieH, () => {
        for (const ss of [1, -1]) {
          const P = M.box([xj - 0.32, ss * 0.013, 0.035], [xj + 0.32, ss * 0.032, 0.105], { isect: false });
          const f = P.f(ss > 0 ? '+y' : '-y');
          if (f.on) for (const x of [-0.24, -0.08, 0.08, 0.24]) f.circle(x, 0, f.mOf(1.1), { n: 6, w: 1 });
        }
      });
    }
    M.callout('RAIL AND TIE', 1, [x1 - 0.5, yR, bal + tieH + 0.16], 0.6);
  });
  return { top: bal + tieH + 0.16, tieTop: bal + tieH, bal };
}

// ------------------------------------------------------------------ wheels
// flanged wheel about the local y axis at the origin, outer face toward +y, flange at -y.
// o: r, kind 'spoke' | 'disc', spokes, crank: {rc, ang} (crank pin on the outer face),
// cw (counterweight opposite the crank), simple (far side: fewer details)
export function railWheel(M, o = {}) {
  const R = o.r ?? 0.5, w = WHEEL_W, fl = Math.max(0.03, R * 0.055);
  const Ri = R - Math.max(0.065, R * 0.1);
  const prof = [[Ri, -w / 2], [R + fl, -w / 2], [R + fl, -w / 2 + 0.024], [R + 0.006, -w / 2 + 0.05], [R, -w / 2 + 0.065], [R * 0.992, w / 2], [Ri, w / 2]];
  const T = M.lathe(prof, { loop: true, axis: 'y', sharpDeg: 30 });
  if (M.decorOn) {
    T.lat.ring(tOf(prof, 5, 0.45, true), { w: 1 });         // tire / wheel-center joint
  }
  const rh = R * (o.kind === 'disc' ? 0.3 : 0.24);
  const hubOut = w / 2 + Math.min(0.1, R * 0.12);
  if (o.kind === 'disc') {
    const D = M.cyl(Ri + 0.004, -w * 0.18, w * 0.18, { axis: 'y', isect: false });
    const f = D.top;
    if (f.on) {
      f.circle(0, 0, (Ri + rh) / 2 + R * 0.04, { w: 0 });
      if (!o.simple && f.pxOf(R) > 14) for (let i = 0; i < 6; i++) { const a = (i + 0.5) * Math.PI / 3; f.circle(Math.cos(a) * (Ri + rh) / 2, Math.sin(a) * (Ri + rh) / 2, R * 0.075, { w: 1 }); }
      if (f.tone > 0.25) f.hatch(circlePts(0, 0, Ri * 0.98, Ri * 0.98, 32), { angle: 30, gap: 4.5 - 2 * f.tone, w: 0, holes: [circlePts(0, 0, rh * 1.05, rh * 1.05, 16)] });
    }
  } else {
    const n = o.spokes ?? Math.max(8, Math.min(20, Math.round(R * 16)));
    const sr = Math.max(0.018, R * 0.034);
    for (let i = 0; i < n; i++) {
      const a = (i + 0.5) * 2 * Math.PI / n;
      const c = Math.cos(a), s = Math.sin(a);
      M.tube([c * rh * 0.85, 0, s * rh * 0.85], [c * (Ri + 0.01), 0, s * (Ri + 0.01)], sr, { isect: false, seg: 6, shade: false });
    }
    // counterweight: a crescent between the spokes opposite the crank
    if (o.cw && o.crank) {
      const a0 = o.crank.ang + 180, span = o.cwSpan ?? 46;
      const pts = [];
      for (let i = 0; i <= 8; i++) { const a = (a0 - span + 2 * span * i / 8) * D2R; pts.push([Math.cos(a) * Ri * 0.99, Math.sin(a) * Ri * 0.99]); }
      for (let i = 8; i >= 0; i--) { const a = (a0 - span * 0.75 + 1.5 * span * i / 8) * D2R; pts.push([Math.cos(a) * R * 0.48, Math.sin(a) * R * 0.48]); }
      const C = M.extrude(pts, -w * 0.22, w * 0.22, { plane: 'xz', isect: false });
      const f = C.f('+y');
      if (f.on) { f.hatch(f.poly, { angle: 45, gap: 2.2, w: 0 }); }
    }
  }
  // hub and axle end
  const H = M.cyl(rh, -w * 0.45, hubOut, { axis: 'y', isect: false });
  if (H.top.on) {
    const f = H.top;
    f.circle(0, 0, rh * 0.55, { w: 1 });
    if (!o.simple && f.pxOf(rh) > 6) for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; f.circle(Math.cos(a) * rh * 0.78, Math.sin(a) * rh * 0.78, rh * 0.07, { n: 6, w: 1 }); }
  }
  let pin = null;
  if (o.crank) {
    const a = o.crank.ang * D2R, rc = o.crank.rc;
    const px = Math.cos(a) * rc, pz = Math.sin(a) * rc;
    // crank boss on the spokes and the pin through it
    M.at(px, 0, pz, () => {
      M.cyl(R * 0.13, -w * 0.3, hubOut * 0.9, { axis: 'y', isect: false });
      const P = M.cyl(R * 0.06, hubOut * 0.9, hubOut + 0.16, { axis: 'y', isect: false });
      if (P.top.on) P.top.circle(0, 0, R * 0.03, { n: 8, w: 1 });
    });
    pin = [px, hubOut + 0.02, pz];
  }
  return { pin, hubOut };
}

// two wheels and an axle, origin at the axle center (z = wheel center). o as railWheel + gauge
export function wheelset(M, o = {}) {
  const g = o.gauge ?? 1.435, R = o.r ?? 0.5, yW = wheelY(g);
  const pins = [];
  M.mirrorY((s) => M.at(0, yW, 0, () => { pins.push(railWheel(M, { ...o, simple: o.simple || (o.nearSide && s !== o.nearSide) }).pin); }));
  M.cyl(R * 0.13, -yW, yW, { axis: 'y', isect: false });
  return { pins, yW };
}

// ------------------------------------------------------------------ springs
// coil spring standing on the origin, along +z
export function coil(M, o = {}) {
  const r = o.r ?? 0.08, h = o.h ?? 0.3, turns = o.turns ?? 5, wr = o.wire ?? r * 0.18;
  const per = 7, n = Math.round(turns * per);
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = 2 * Math.PI * i / per; pts.push([Math.cos(a) * r, Math.sin(a) * r, wr + (h - 2 * wr) * i / n]); }
  M.pipe(pts, wr, { isect: false, seg: 5, smoothBends: true });
  M.cyl(r * 1.25, 0, wr * 0.8, { isect: false, seg: 10 });
  M.cyl(r * 1.25, h - wr * 0.8, h, { isect: false, seg: 10 });
}

// semi-elliptic leaf spring centered at the origin along x, top leaf at z = 0, arched up
export function leaf(M, o = {}) {
  const L = o.len ?? 1.1, n = o.n ?? 6, t = o.t ?? 0.022, w = o.w ?? 0.1;
  for (let i = 0; i < n; i++) {
    const l = L * (1 - i / (n + 0.6)), z = -i * t;
    // each leaf as a shallow V (two boxes meeting at the buckle) so the stack reads arched
    const sag = 0.06 * (l / L);
    M.loft([[-l / 2, -w / 2, z + sag], [-l / 2, w / 2, z + sag], [-l / 2, w / 2, z + sag - t], [-l / 2, -w / 2, z + sag - t]],
      [[0, -w / 2, z], [0, w / 2, z], [0, w / 2, z - t], [0, -w / 2, z - t]], { isect: false });
    M.loft([[0, -w / 2, z], [0, w / 2, z], [0, w / 2, z - t], [0, -w / 2, z - t]],
      [[l / 2, -w / 2, z + sag], [l / 2, w / 2, z + sag], [l / 2, w / 2, z + sag - t], [l / 2, -w / 2, z + sag - t]], { isect: false });
  }
  M.boxc([0, 0, -n * t / 2 + t / 2], [0.1, w * 1.3, n * t + 0.03], { isect: false });   // buckle
  // eyes at the ends
  for (const s of [1, -1]) M.at(s * L / 2, 0, 0.06 + t * 0.5, () => M.cyl(0.03, -w * 0.7, w * 0.7, { axis: 'y', isect: false, seg: 10 }));
}

// ------------------------------------------------------------------ bogie
// origin at rail top between the axles; n axles at pitch p, wheel radius r. o.kind 'coil' |
// 'leaf'; o.wheel 'disc' | 'spoke'; o.nearSide (+1 | -1) the side the viewer sees.
// Returns { top } the height of the bolster top above rail top, { len }.
export function bogie(M, o = {}) {
  const n = o.n ?? 2, p = o.pitch ?? 2.1, R = o.r ?? 0.5, g = o.gauge ?? 1.435;
  const yW = wheelY(g), yF = yW + WHEEL_W / 2 + 0.11, tF = 0.11;
  const xs = Array.from({ length: n }, (_, i) => -(n - 1) * p / 2 + i * p);
  const Lf = (n - 1) * p + 2 * R + 0.7;
  const kind = o.kind ?? 'coil';
  for (const x of xs) M.at(x, 0, R, () => wheelset(M, { r: R, gauge: g, kind: o.wheel ?? 'disc', nearSide: o.nearSide }));
  const z0 = R + (kind === 'coil' ? 0.36 : 0.2), z1 = z0 + 0.38, zj = R - 0.12;
  const top = z1 + 0.12;
  M.mirrorY((s) => {
    // side frame: a plate with pedestal jaws around each axle box and a fish-belly between
    const pr = [[-Lf / 2, z1 - 0.12], [-Lf / 2 + 0.2, z1], [Lf / 2 - 0.2, z1], [Lf / 2, z1 - 0.12], [Lf / 2, z0 + 0.04]];
    for (let i = n - 1; i >= 0; i--) {
      const x = xs[i];
      pr.push([x + 0.32, z0], [x + 0.32, zj], [x + 0.2, zj], [x + 0.2, z0], [x - 0.2, z0], [x - 0.2, zj], [x - 0.32, zj], [x - 0.32, z0]);
      if (i > 0) pr.push([(x + xs[i - 1]) / 2, z0 - 0.14]);
    }
    pr.push([-Lf / 2, z0 + 0.04]);
    const F = M.extrude(pr, yF, yF + tF, { plane: 'xz' });
    const f = F.f('+y');
    if (f.on && s === o.nearSide) {
      // rivet rows along the top flange, lightening holes between the axles, a plate
      const q = (X, Z) => fxz(f, M.W([X, 0, Z]));
      const zc = (z0 + z1) / 2;
      f.rivets(...q(-Lf / 2 + 0.3, z1 - 0.06), ...q(Lf / 2 - 0.3, z1 - 0.06), { pitch: 6 });
      f.line(...q(-Lf / 2 + 0.22, z1 - 0.12), ...q(Lf / 2 - 0.22, z1 - 0.12), { w: 0 });
      for (let i = 0; i + 1 < n; i++) {
        const xm = (xs[i] + xs[i + 1]) / 2;
        f.circle(...q(xm, zc - 0.03), 0.1, { w: 1 });
        if (p > 1.6) { f.circle(...q(xm - 0.34, zc - 0.03), 0.07, { w: 1 }); f.circle(...q(xm + 0.34, zc - 0.03), 0.07, { w: 1 }); }
      }
      if (f.tone > 0.3) f.hatch(f.poly, { angle: 90, gap: 4 - 1.6 * f.tone, w: 0 });
    }
    // axle boxes in the jaws, springs on them
    for (const x of xs) {
      const A = M.box([x - 0.19, yF - 0.06, R - 0.17], [x + 0.19, yF + tF + 0.1, R + 0.15], { isect: false });
      const fa = A.f('+y');
      if (fa.on) {
        fa.rect(-0.14, -0.12, 0.14, 0.12, { w: 1 });
        fa.circle(0, 0, 0.08, { w: 1 });
        for (const [cx, cy] of [[-0.11, -0.09], [0.11, -0.09], [0.11, 0.09], [-0.11, 0.09]]) fa.circle(cx, cy, fa.mOf(0.9), { n: 6, w: 1 });
      }
      if (kind === 'coil') {
        for (const dx of [-0.1, 0.1]) M.at(x + dx, yF + tF * 0.5 + 0.02, R + 0.15, () => coil(M, { r: 0.075, h: z0 - R - 0.15, turns: 4 }));
      } else {
        // leaf spring on the axle box with hangers to the frame
        M.at(x, yF + tF + 0.08, R + 0.27, () => leaf(M, { len: Math.min(1.2, p * 0.6), n: 6, w: 0.1 }));
        M.box([x - 0.06, yF + tF + 0.03, R + 0.14], [x + 0.06, yF + tF + 0.13, R + 0.2], { isect: false });
      }
      // brake shoes behind each wheel, hung from the frame
      for (const sx of [-1, 1]) {
        if (n > 2 && x !== xs[0] && x !== xs[n - 1] && sx === 1) continue;
        const bx = x + sx * (R + 0.05);
        M.box([bx - 0.035, yW - 0.06, R - 0.16], [bx + 0.035, yW + 0.06, R + 0.16], { isect: false });
        M.tube([bx, yW + 0.07, R + 0.1], [bx + sx * 0.08, yF - 0.02, z0], 0.018, { isect: false, seg: 6 });
      }
    }
    // brake cylinder on the frame end
    M.at(Lf / 2 - 0.45, yF + tF + 0.1, (z0 + z1) / 2, () => M.cyl(0.11, -0.12, 0.12, { axis: 'x', isect: false }));
  });
  // transoms and bolster
  for (const x of [-Lf / 2 + 0.35, Lf / 2 - 0.35]) M.box([x - 0.08, -yF, z0 + 0.06], [x + 0.08, yF, z1 - 0.04], { isect: false });
  const B = M.box([-0.35, -yF - 0.02, z1 - 0.18], [0.35, yF + 0.02, top], { isect: false });
  void B;
  return { top, len: Lf, xs, yF: yF + tF };
}

// ------------------------------------------------------------------ couplers and buffers
// side buffer at the origin, pointing +x (base plate on x = 0)
export function buffer(M, o = {}) {
  const r = o.r ?? 0.2, L = o.len ?? 0.45;
  M.box([0, -0.19, -0.19], [0.04, 0.19, 0.19], { isect: false });
  M.cyl(0.12, 0.04, L * 0.6, { axis: 'x', isect: false });
  M.cyl(0.13, L * 0.12, L * 0.2, { axis: 'x', isect: false });
  M.cyl(0.08, L * 0.6, L - 0.04, { axis: 'x', isect: false });
  const H = M.cyl(r, L - 0.04, L, { axis: 'x', isect: false });
  if (H.top.on) H.top.circle(0, 0, r * 0.6, { w: 0 });
}
// coupler at the origin pointing +x. kind 'hook' (screw link, with buffers) or 'knuckle'
export function coupler(M, o = {}) {
  if ((o.kind ?? 'hook') === 'knuckle') {
    M.box([0, -0.1, -0.08], [0.55, 0.1, 0.08], { isect: false });
    const K2 = M.extrude([[0.5, -0.17], [0.78, -0.17], [0.86, -0.06], [0.86, 0.12], [0.74, 0.18], [0.66, 0.1], [0.72, 0.02], [0.6, 0.0], [0.5, 0.1]], -0.14, 0.14, { plane: 'xy', isect: false });
    void K2;
    M.at(0.62, 0.05, 0.14, () => M.cyl(0.03, 0, 0.1, { isect: false, seg: 8 }));
    // uncoupling lever
    M.pipe([[0.4, 0, 0.12], [0.4, 0.3, 0.2], [0.35, 1.0, 0.2], [0.35, 1.05, 0.0]], 0.015, { isect: false });
    return;
  }
  M.box([0, -0.06, -0.12], [0.3, 0.06, 0.06], { isect: false });
  // the hook
  M.extrude([[0.28, -0.12], [0.44, -0.12], [0.48, 0.0], [0.42, 0.1], [0.36, 0.06], [0.4, -0.01], [0.28, -0.02]], -0.04, 0.04, { plane: 'xz', isect: false });
  // screw link hanging from the hook
  const pts = [[0.36, -0.1, 0.0], [0.62, -0.1, -0.22], [0.66, 0.1, -0.22], [0.4, 0.1, 0.0]];
  M.pipe(pts, 0.016, { isect: false });
  M.at(0.64, 0, -0.22, () => M.cyl(0.03, -0.12, 0.12, { axis: 'y', isect: false, seg: 8 }));
}
// a buffer beam across the end at x = 0 facing +x: beam, buffers, coupler, brake hoses.
// zc: center height of the buffers. Returns the beam solid.
export function bufferBeam(M, o = {}) {
  const W = o.w ?? 2.8, zc = o.z ?? 1.05, h = o.h ?? 0.42, d = o.d ?? 0.2;
  const B = M.box([-d, -W / 2, zc - h / 2], [0, W / 2, zc + h / 2]);
  const f = B.f('+x');
  if (f.on) {
    f.rivets(-f.w / 2 + 0.08, f.h / 2 - 0.06, f.w / 2 - 0.08, f.h / 2 - 0.06, { pitch: 6 });
    f.rivets(-f.w / 2 + 0.08, -f.h / 2 + 0.06, f.w / 2 - 0.08, -f.h / 2 + 0.06, { pitch: 6 });
    if (o.label) K.stencil(f, o.label, 0, 0, h * 0.34);
  }
  const knuckle = o.coupler === 'knuckle';
  if (!knuckle) for (const s of [1, -1]) M.at(0, s * 0.875, zc, () => buffer(M, {}));
  M.at(0, 0, zc - (knuckle ? 0.02 : 0), () => coupler(M, { kind: o.coupler }));
  // brake hoses
  for (const s of [1, -1]) M.pipe([[0, s * 0.35, zc - 0.05], [0.18, s * 0.38, zc - 0.15], [0.2, s * 0.4, zc - 0.35], [0.16, s * 0.42, zc - 0.42]], 0.025, { isect: false, seg: 6 });
  return B;
}

// ------------------------------------------------------------------ roof gear
// porcelain insulator standing on the origin: n sheds
export function insulator(M, o = {}) {
  const h = o.h ?? 0.4, r = o.r ?? 0.09, n = o.n ?? 4;
  const prof = [[r * 0.75, 0], [r * 0.75, h * 0.08]];
  for (let i = 0; i < n; i++) {
    const z = h * 0.1 + (h * 0.8) * i / n;
    prof.push([r * 1.35, z + h * 0.8 / n * 0.25], [r * 0.6, z + h * 0.8 / n * 0.55], [r * 0.6, z + h * 0.8 / n]);
  }
  prof.push([r * 0.7, h * 0.92], [r * 0.7, h], [0, h]);
  M.lathe(prof, { isect: false, sharpDeg: 25 });
}

// pantograph standing on the roof at the origin, collector head across y at height h.
// kind 'diamond' | 'single'. Returns the head height.
export function pantograph(M, o = {}) {
  const h = o.h ?? 1.6, w = o.w ?? 1.0, a = o.a ?? 0.9, kind = o.kind ?? 'diamond';
  const zb = 0.36;
  // base frame on four insulators
  for (const x of [-a, a]) for (const y of [-w * 0.45, w * 0.45]) M.at(x, y, 0, () => insulator(M, { h: zb, r: 0.07, n: 3 }));
  for (const y of [-w * 0.45, w * 0.45]) M.box([-a - 0.08, y - 0.05, zb], [a + 0.08, y + 0.05, zb + 0.08], { isect: false });
  for (const x of [-a, a]) M.box([x - 0.05, -w * 0.45, zb], [x + 0.05, w * 0.45, zb + 0.08], { isect: false });
  const z0 = zb + 0.1;
  const r = 0.03;
  const head = [];
  M.mirrorY(() => {
    const y = w * 0.4;
    if (kind === 'diamond') {
      const knee = [0, y, z0 + (h - z0) * 0.48], ha = a * 0.55;
      for (const sx of [-1, 1]) {
        M.tube([sx * a * 0.85, y, z0], knee, r, { isect: false, seg: 6 });
        M.tube(knee, [sx * ha, y, h - 0.12], r * 0.8, { isect: false, seg: 6 });
      }
      M.tube([-ha, y, h - 0.12], [ha, y, h - 0.12], r * 0.7, { isect: false, seg: 6 });
      M.at(knee[0], knee[1], knee[2], () => M.sphere(r * 1.8, { isect: false }));
    } else {
      const knee = [a * 0.95, y * 0.6, z0 + (h - z0) * 0.45];
      M.tube([-a * 0.7, y * 0.5, z0], knee, r * 1.2, { isect: false, seg: 6 });
      M.tube(knee, [0, y * 0.6, h - 0.12], r * 0.8, { isect: false, seg: 6 });
      M.at(knee[0], knee[1], knee[2], () => M.sphere(r * 2, { isect: false }));
    }
  });
  // spring box and the head: two contact strips with horns
  M.at(-a * 0.75, 0, z0, () => { M.cyl(0.07, 0, 0.35, { axis: 'x', isect: false }); });
  for (const x of [-0.13, 0.13]) {
    M.box([x - 0.03, -w * 0.62, h - 0.06], [x + 0.03, w * 0.62, h], { isect: false });
    M.mirrorY(() => M.pipe([[x, w * 0.6, h - 0.02], [x, w * 0.78, h - 0.08], [x, w * 0.86, h - 0.22]], 0.015, { isect: false, seg: 6 }));
    head.push(x);
  }
  M.box([-0.14, -w * 0.42, h - 0.14], [0.14, w * 0.42, h - 0.08], { isect: false });
  return h;
}

// ------------------------------------------------------------------ lamps, rails, steps
// headlamp at the origin, beam toward +x: body, rim with a ribbed lens, visor, bracket below
export function headlamp(M, o = {}) {
  const r = o.r ?? 0.14;
  M.cyl(r, -r * 1.3, 0, { axis: 'x' });
  const C = M.cyl(r * 1.12, 0, r * 0.18, { axis: 'x', isect: false });
  if (C.top.on) {
    const f = C.top;
    f.circle(0, 0, r * 0.85, { w: 1 });
    if (f.pxOf(r) > 4) f.hatch(circlePts(0, 0, r * 0.8, r * 0.8, 20), { angle: 70, gap: 1.2, gap2: 3, w: 0 });
  }
  if (o.visor !== false) M.at(r * 0.18, 0, 0, () => M.lathe([[r * 1.16, 0], [r * 1.16, r * 0.7]], { axis: 'x', open: true, a0: 180, a1: 360, isect: false }));
  M.boxc([-r * 0.7, 0, -r * 1.25], [r * 0.5, r * 0.4, r * 0.5], { isect: false });
}

// handrail from a to b on stanchions that reach back by `off` (a vector toward the wall)
export function handrail(M, a, b, off, o = {}) {
  const r = o.r ?? 0.02;
  M.tube(a, b, r, { isect: false, seg: 6, shade: false });
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const n = Math.max(1, Math.round(L / (o.pitch ?? 1.6)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    M.tube(p, [p[0] + off[0], p[1] + off[1], p[2] + off[2]], r * 0.8, { isect: false, seg: 6, shade: false });
    M.at(p[0], p[1], p[2], () => M.sphere(r * 1.5, { isect: false, rings: 4, seg: 6 }));
  }
}

// stirrup step hanging below the origin: n treads, width w, sides along y
export function steps(M, o = {}) {
  const n = o.n ?? 2, w = o.w ?? 0.45, gap = o.gap ?? 0.32, d = o.d ?? 0.2;
  for (const s of [1, -1]) M.box([-0.02, s * w / 2 - 0.02, -n * gap - 0.03], [0.02, s * w / 2 + 0.02, 0], { isect: false });
  for (let i = 1; i <= n; i++) {
    const T = M.box([-d / 2, -w / 2, -i * gap - 0.03], [d / 2, w / 2, -i * gap], { isect: false });
    const f = T.f('+z');
    if (f.on) f.hatch(f.box, { angle: 0, gap: 2.2, w: 0 });
  }
}

// a small handcar on its own wheels, origin on the rail top, for carrying on deck
export function handcar(M, o = {}) {
  const g = o.gauge ?? 1.0, R = 0.22;
  const yW = wheelY(g);
  for (const x of [-0.55, 0.55]) M.at(x, 0, R, () => wheelset(M, { r: R, gauge: g, kind: 'disc', simple: true }));
  const D = M.box([-0.85, -yW - 0.15, R + 0.05], [0.85, yW + 0.15, R + 0.12]);
  const f = D.f('+z');
  if (f.on) for (let i = 1; i < 8; i++) f.line(-f.w / 2 + f.w * i / 8, -f.h / 2, -f.w / 2 + f.w * i / 8, f.h / 2, { w: 0 });
  // pump stand and walking beam
  const zt = R + 0.12;
  M.loft([[-0.12, -0.12, zt], [0.12, -0.12, zt], [0.12, 0.12, zt], [-0.12, 0.12, zt]], [[-0.04, -0.04, zt + 0.75], [0.04, -0.04, zt + 0.75], [0.04, 0.04, zt + 0.75], [-0.04, 0.04, zt + 0.75]], { isect: false });
  const tilt = o.tilt ?? 12;
  M.at(0, 0, zt + 0.8, () => M.ry(tilt, () => {
    M.box([-0.7, -0.03, -0.03], [0.7, 0.03, 0.03], { isect: false });
    for (const s of [1, -1]) M.box([s * 0.7 - 0.02, -0.35, -0.02], [s * 0.7 + 0.02, 0.35, 0.02], { isect: false });
  }));
}
