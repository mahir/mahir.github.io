// classes/parts-odd.js: plain everyday vehicles for the excess and graft classes, drawn as
// carefully as the rest of the fleet so that what is added to them reads as too much. Every
// part builds at the current frame's origin, +x forward, +z up, ground z = 0, and draws decor
// only in the drawing pass. No random draws in here: the caller passes every choice in.
//
//   sideProfile(x0, x1, zc, top, arches)  a car side outline (x, z) with wheel arches cut out
//   faceUV(f, P)            world point -> face coordinates
//   quadPt(A, B, C, D, u, v) bilinear point on a quad (A rear-bottom, B front-bottom, C, D)
//   car(M, o)               a small 1970s saloon (or o.len long limousine with o.axles):
//                           returns { L, W, zBelt, zRoof, xCab0, xCab1, wheels: [x...], r, front, rear }
//   lampUnit(M, r, o)       a round headlamp in a chrome rim, lens toward +x
//   bus(M, o)               a single- or many-deck bus: returns { L, W, H, wheels, deckH, decks }
//   caravan(M, o)           a touring caravan on one axle with a drawbar toward +x: { L, H, hitch }
//   bikeWheel(M, o)         a spoked bicycle wheel about local y
//   cab(M, o)               a van/pickup cab with a raked windshield; returns { x0, x1, H }

import * as K from '../kit.js';
import { dot, sub, lerp, D2R, circlePts } from '../geom.js';

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function faceUV(f, P) {
  const d = sub(P, f.o);
  return [dot(d, f.u), dot(d, f.v)];
}
export function quadPt(A, B, C, D, u, v) {
  const lo = lerp(A, B, u), hi = lerp(D, C, u);
  return lerp(lo, hi, v);
}
// a polygon given in local 3D points, drawn on a face
function onFace(M, f, pts) { return pts.map((p) => faceUV(f, M.W(p))); }

// side outline from the front bottom, along the top (top: points from front to rear, x
// descending), down the rear, then along the bottom from rear to front with the arches
export function sideProfile(x0, x1, zc, top, arches) {
  const p = [[x1, zc], ...top, [x0, zc]];
  const sorted = arches.slice().sort((a, b) => a.x - b.x);
  for (const a of sorted) {
    const n = 9;
    p.push([a.x - a.R, zc]);
    for (let i = 0; i <= n; i++) { const t = Math.PI - Math.PI * i / n; p.push([a.x + Math.cos(t) * a.R, a.zc + Math.sin(t) * a.R]); }
    p.push([a.x + a.R, zc]);
  }
  return p;
}

// ---------------------------------------------------------------------------------- lamps
export function lampUnit(M, r, o = {}) {
  const d = o.depth ?? r * 0.9;
  M.cyl(r * 0.92, -d, 0, { axis: 'x' });
  const R = M.cyl(r, -r * 0.02, r * 0.12, { axis: 'x', isect: false });
  const L = M.cyl(r * 0.82, r * 0.12, r * 0.16, { axis: 'x', isect: false });
  if (M.decorOn) {
    const f = L.top;
    if (f.on && f.pxOf(r) > 2) {
      f.circle(0, 0, r * 0.78, { w: 1 });
      if (f.pxOf(r) > 5) {
        f.circle(0, 0, r * 0.25, { w: 0 });
        const P = circlePts(0, 0, r * 0.74, r * 0.74, 20);
        f.hatch(P, { angle: 0, gap: 1.8, w: 0 });
      }
    }
    void R;
  }
}

// ---------------------------------------------------------------------------------- car
// o: len (3.9), wid (1.6), hgt (1.38), r (wheel radius), axles (2), cut (x where the cabin
// ends in a flat bulkhead, for cars carrying something behind), doors (per side), style
// 'notch' | 'fast', text (stencil on the doors), plate
export function car(M, o = {}) {
  const L = o.len ?? 3.9, W = o.wid ?? 1.6, Hh = o.hgt ?? 1.38, r = o.r ?? 0.29;
  const zc = r * 0.75, zBelt = Hh * 0.64, zHood = zBelt - 0.06, zRoof = Hh;
  const x0 = -L / 2, x1 = L / 2;
  const xfA = x1 - Math.min(0.82, L * 0.21), nAx = o.axles ?? 2;
  const xrA = o.rearAxle ?? (x0 + Math.min(0.78, L * 0.2));
  const wheels = [];
  for (let i = 0; i < nAx; i++) wheels.push(nAx === 1 ? xfA : xfA + (xrA - xfA) * i / (nAx - 1));
  const R = r + 0.06;
  const arches = wheels.map((x) => ({ x, R, zc: r }));
  const wsBase = o.wsBase ?? (xfA - 0.2);                 // windshield foot
  const rearBase = o.rearBase ?? (o.style === 'fast' ? x0 + 0.35 : x0 + Math.min(0.95, L * 0.24));
  const top = [[x1, zHood * 0.62], [x1 - 0.06, zHood * 0.92], [x1 - 0.32, zHood], [wsBase, zBelt],
    [rearBase, zBelt], [x0 + 0.18, zBelt - 0.02], [x0 + 0.02, zBelt * 0.9], [x0, zBelt * 0.6]];
  const prof = sideProfile(x0 + 0.02, x1 - 0.02, zc, top, arches);
  let body;
  M.part('BODY SHELL', () => {
    body = M.extrude(prof, -W / 2, W / 2, { plane: 'xz' });
    M.info.mass = [x0, -W / 2, 0, x1, W / 2, zRoof];
  });
  // cabin: a loft from the beltline to the roof
  const cut = o.cut;
  const cb0 = cut ?? rearBase + 0.05, cb1 = wsBase;
  const rs = cut != null ? 0 : (o.style === 'fast' ? Math.min(0.9, (cb1 - cb0) * 0.4) : 0.32), ws = Math.min(0.62, (cb1 - cb0) * 0.3);
  const yb = W / 2 - 0.04, yt = W / 2 - 0.17;
  const A = [[cb0, -yb, zBelt], [cb1, -yb, zBelt], [cb1, yb, zBelt], [cb0, yb, zBelt]];
  const B = [[cb0 + rs, -yt, zRoof], [cb1 - ws, -yt, zRoof], [cb1 - ws, yt, zRoof], [cb0 + rs, yt, zRoof]];
  let cabin;
  M.part('CABIN', () => { cabin = M.loft(A, B, {}); });
  const e = M.view.e;
  if (M.decorOn) {
    // body sides: door lines, handles, a trim line, arch lips, sill
    for (const k of ['+y', '-y']) {
      const f = body.f(k);
      if (!f.on || !f.front) continue;
      const ys = k === '+y' ? W / 2 : -W / 2;
      const P = (x, z) => faceUV(f, M.W([x, ys, z]));
      const doorsX = o.doorsX ?? [[wsBase - 0.02, (wsBase + cb0) / 2 + 0.05], ...(o.doors === 1 ? [] : [[(wsBase + cb0) / 2 + 0.03, cb0 + 0.12]])];
      for (const [dx1, dx0] of doorsX) {
        const q = [P(dx0, zc + 0.12), P(dx1, zc + 0.12), P(dx1, zBelt - 0.01), P(dx0, zBelt - 0.01)];
        f.path(q, { closed: true, w: 1 });
        const hh = P(dx0 + 0.12, zBelt - 0.1), hh2 = P(dx0 + 0.26, zBelt - 0.1);
        f.line(hh[0], hh[1], hh2[0], hh2[1], { w: 1 });
      }
      const t0 = P(x0 + 0.1, zBelt * 0.72), t1 = P(x1 - 0.12, zBelt * 0.72);
      f.line(t0[0], t0[1], t1[0], t1[1], { w: 1 });
      const s0 = P(x0 + 0.2, zc + 0.08), s1 = P(x1 - 0.3, zc + 0.08);
      f.line(s0[0], s0[1], s1[0], s1[1], { w: 0 });
      for (const a of arches) f.path(Array.from({ length: 10 }, (_, i) => { const t = Math.PI * i / 9; return P(a.x + Math.cos(t) * (R + 0.04), r + Math.sin(t) * (R + 0.04)); }), { w: 1 });
      // shade the lower side
      f.hatch(prof.map(([x, z]) => P(x, Math.min(z, zBelt * 0.72))), { angle: 0, gap: 3.2 - 1.2 * f.tone, w: 0 });
      if (f.tone > 0.35) f.hatch(prof.map(([x, z]) => P(x, Math.max(z, zBelt * 0.72))), { angle: 0, gap: 4.6 - 2 * f.tone, w: 0 });
      if (o.text) {
        const c = P((wsBase + cb0) / 2, zBelt * 0.5);
        f.text(o.text, c[0], c[1], Math.min(0.14, (wsBase - cb0) / Math.max(1, o.text.length) * 1.2), { w: 1, pass: 4 });
      }
    }
    // hood and trunk lids
    // cabin glass: side windows with a B pillar, windshield, rear screen
    const sideQ = (s) => s > 0 ? [A[3], A[2], B[2], B[3]] : [A[0], A[1], B[1], B[0]];
    for (const [nm, s] of [['s2', 1], ['s0', -1]]) {
      const f = cabin.f(nm);
      if (!f.on || !f.front) continue;
      const [qa, qb, qc, qd] = sideQ(s);
      const Q = (u, v) => faceUV(f, M.W(quadPt(qa, qb, qc, qd, u, v)));
      const nW = o.windows ?? (cut != null ? 1 : 2);
      // windows by x: the bottom edge runs cb0..cb1, the top cb0 + rs .. cb1 - ws; the end
      // windows follow the pillars, the ones between have upright posts
      const ub = (x) => (x - cb0) / (cb1 - cb0);
      const t0 = cb0 + rs, t1 = cb1 - ws, gap = 0.07;
      const ut = (x) => (x - t0) / ((t1 - t0) || 1);
      const Pt = (x, v) => { const bot = quadPt(qa, qb, qc, qd, ub(x), 0), top = quadPt(qa, qb, qc, qd, clamp(ut(x), 0, 1), 1); return faceUV(f, M.W(lerp(bot, top, v))); };
      for (let i = 0; i < nW; i++) {
        const xa = t0 + (t1 - t0) * i / nW + (i ? gap : 0.05), xb = t0 + (t1 - t0) * (i + 1) / nW - (i < nW - 1 ? gap : 0.05);
        const v0 = 0.1, v1 = 0.88;
        const bot = (x) => Pt(x, v0), top = (x) => Pt(x, v1);
        const xa0 = i === 0 ? cb0 + (cut != null ? 0.05 : rs * 0.25 + 0.08) : xa, xb0 = i === nW - 1 ? cb1 - ws * 0.25 - 0.1 : xb;
        const g = [bot(xa0), bot(xb0), top(xb), top(xa)];
        K.glass(f, g, { gap: 1.0, gap2: 2.4, angle: 62, flip: i % 2 === 1 });
      }
    }
    const wf = cabin.f('s1');
    if (wf.on && wf.front) {
      const Q = (u, v) => faceUV(wf, M.W(quadPt(A[1], A[2], B[2], B[1], u, v)));
      const g = [Q(0.05, 0.06), Q(0.95, 0.06), Q(0.93, 0.92), Q(0.07, 0.92)];
      K.glass(wf, g, { gap: 1.1, gap2: 2.6, angle: 70 });
      for (const u of [0.28, 0.62]) { const a = Q(u, 0.07), b = Q(u - 0.18, 0.4); wf.line(a[0], a[1], b[0], b[1], { w: 1 }); }
    }
    const rf = cabin.f('s3');
    if (rf.on && rf.front && cut == null) {
      const Q = (u, v) => faceUV(rf, M.W(quadPt(A[3], A[0], B[0], B[3], u, v)));
      K.glass(rf, [Q(0.07, 0.08), Q(0.93, 0.08), Q(0.91, 0.9), Q(0.09, 0.9)], { gap: 1.1, gap2: 2.6, angle: 70 });
    }
    if (rf.on && rf.front && cut != null) { const Q = (u, v) => faceUV(rf, M.W(quadPt(A[3], A[0], B[0], B[3], u, v))); for (const v of [0.33, 0.66]) { const a = Q(0, v), b = Q(1, v); rf.line(a[0], a[1], b[0], b[1], { w: 0 }); } }
    const roof = cabin.f('b');
    if (roof.on && roof.front) { const Q = (u, v) => faceUV(roof, M.W(quadPt(B[0], B[1], B[2], B[3], u, v))); for (const v of [0.06, 0.94]) { const a = Q(0.02, v), b = Q(0.98, v); roof.line(a[0], a[1], b[0], b[1], { w: 1 }); } }
    // hood lines on the top faces of the body (the faces of the extrude toward +z)
  }
  // wheels
  M.part('ROAD WHEEL', () => {
    for (const x of wheels) for (const s of [1, -1]) M.at(x, s * (W / 2 - r * 0.42), r, () => K.wheel(M, { r, w: r * 0.62, hub: r * 0.58, hubs: 'seen' }));
    M.callout('ROAD WHEEL', wheels.length * 2, [wheels[0], (e[1] > 0 ? 1 : -1) * W / 2, r * 0.7], 0.9);
    M.info.centers = (M.info.centers || []).concat(wheels.map((x) => [[x, -W / 2 - 0.3, r], [x, W / 2 + 0.3, r]]));
  });
  // front: grille, headlamps, bumpers, plate
  M.part('BUMPER', () => {
    for (const [xb, sg] of [[x1, 1], [x0, -1]]) {
      const Bm = M.box([Math.min(xb, xb + sg * 0.1), -W / 2 - 0.02, zc + 0.1], [Math.max(xb, xb + sg * 0.1), W / 2 + 0.02, zc + 0.22], { chamfer: 0.04 });
      for (const s of [1, -1]) M.box([Math.min(xb + sg * 0.1, xb + sg * 0.16), s * W * 0.3 - 0.04, zc + 0.06], [Math.max(xb + sg * 0.1, xb + sg * 0.16), s * W * 0.3 + 0.04, zc + 0.3], { isect: false });
      const f = Bm.f(sg > 0 ? '+x' : '-x');
      if (f.on && o.plate) { f.rect(-0.26, -0.05, 0.26, 0.05, { w: 1 }); f.text(o.plate, 0, 0, 0.06, { w: 1 }); }
    }
  });
  if (o.lamps !== false) {
    M.part('HEADLAMP', () => {
      const zl = zHood * 0.72;
      for (const s of [1, -1]) M.at(x1 - 0.02, s * W * 0.33, zl, () => lampUnit(M, 0.09));
      // grille between the lamps
      const G = M.box([x1 - 0.04, -W * 0.22, zl - 0.09], [x1 + 0.005, W * 0.22, zl + 0.08], { isect: false });
      const f = G.f('+x');
      if (f.on) { f.rect(f.box, { w: 1 }); for (let i = 1; i < 6; i++) { const y = -f.h / 2 + f.h * i / 6; f.line(-f.w / 2 + f.mOf(1.5), y, f.w / 2 - f.mOf(1.5), y, { w: 0 }); } }
      // tail lamps
      for (const s of [1, -1]) {
        const T = M.box([x0 - 0.01, s * W * 0.36 - 0.12, zBelt * 0.68], [x0 + 0.02, s * W * 0.36 + 0.12, zBelt * 0.86], { isect: false });
        const tf = T.f('-x'); if (tf.on) { tf.rect(tf.box, { w: 1 }); tf.hatch(tf.box, { angle: 90, gap: 1.6, w: 0 }); }
      }
    });
  }
  // mirrors
  for (const s of [1, -1]) M.at(cb1 - 0.12, s * (W / 2 + 0.02), zBelt + 0.05, () => { M.tube([0, 0, 0], [0, s * 0.1, 0.06], 0.012, { isect: false }); M.boxc([0, s * 0.12, 0.08], [0.05, 0.08, 0.06], { isect: false }); });
  return { L, W, zBelt, zRoof, zHood, xCab0: cb0, xCab1: cb1, wheels, r, front: x1, rear: x0, zc, rearBase, wsBase, body, cabin };
}

// ---------------------------------------------------------------------------------- bus
// o: len, wid, decks, deckH, r, axles, livery (stencil), route, nWin (per deck per side)
export function bus(M, o = {}) {
  const L = o.len ?? 10, W = o.wid ?? 2.45, n = o.decks ?? 1, dh = o.deckH ?? 2.1, r = o.r ?? 0.5;
  const zc = r * 0.7, z1 = zc + dh + 0.35;          // lower deck top
  const x0 = -L / 2, x1 = L / 2;
  const wheels = o.wheels ?? [x1 - 2.2, x0 + 2.6];
  const arches = wheels.map((x) => ({ x, R: r + 0.08, zc: r }));
  const prof = sideProfile(x0, x1, zc, [[x1, z1 - 0.05], [x1 - 0.05, z1], [x0, z1]], arches);
  const e = M.view.e, sy = e[1] >= 0 ? 1 : -1, sx = e[0] >= 0 ? 1 : -1;
  const shells = [];
  M.part('LOWER DECK', () => { shells.push(M.extrude(prof, -W / 2, W / 2, { plane: 'xz' })); });
  M.part('UPPER DECK', () => {
    for (let i = 1; i < n; i++) shells.push(M.box([x0, -W / 2, z1 + dh * (i - 1)], [x1, W / 2, z1 + dh * i]));
  });
  const H = z1 + dh * (n - 1);
  M.part('ROOF', () => {
    const rp = [[-W / 2, 0], [W / 2, 0]];
    for (let i = 0; i <= 6; i++) { const a = i * Math.PI / 6; rp.push([Math.cos(a) * W / 2, 0.02 + Math.sin(a) * 0.16]); }
    rp.splice(0, 2); rp.unshift([-W / 2, 0]); rp.splice(1, 0, [W / 2, 0]);
    const Rf = M.extrude(rp.map(([y, z]) => [y, z + H]).slice(1), x0 + 0.05, x1 - 0.05, { plane: 'yz', smoothDeg: 35 });
    void Rf;
  });
  M.info.mass = [x0, -W / 2, 0, x1, W / 2, H];
  if (M.decorOn) {
    shells.forEach((S, d) => {
      const zb = d === 0 ? zc : z1 + dh * (d - 1), zt = d === 0 ? z1 : z1 + dh * d;
      const zw0 = d === 0 ? z1 - dh * 0.9 : zb + dh * 0.22, zw1 = zt - dh * 0.12;
      for (const k of ['+y', '-y']) {
        const f = S.f(k);
        if (!f.on || !f.front) continue;
        const ys = k === '+y' ? W / 2 : -W / 2;
        const P = (x, z) => faceUV(f, M.W([x, ys, z]));
        const nw = o.nWin ?? Math.max(3, Math.round(L / 1.25));
        const xa = x0 + 0.35, xb = x1 - (d === 0 ? 1.6 : 0.35);
        for (let i = 0; i < nw; i++) {
          const u0 = xa + (xb - xa) * i / nw + 0.06, u1 = xa + (xb - xa) * (i + 1) / nw - 0.06;
          const a = P(u0, zw0), b = P(u1, zw1);
          K.glass(f, [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]], { gap: 1.0, gap2: 2.4, flip: i % 2 === 1 });
        }
        // a belt line and a skirt band
        const t0 = P(x0 + 0.05, zw0 - 0.12), t1 = P(x1 - 0.05, zw0 - 0.12);
        f.line(t0[0], t0[1], t1[0], t1[1], { w: 1 });
        if (d === 0) {
          const s0 = P(x0 + 0.05, zc + 0.35), s1 = P(x1 - 0.05, zc + 0.35);
          f.line(s0[0], s0[1], s1[0], s1[1], { w: 1 });
          f.hatch(prof.map(([x, z]) => P(x, Math.min(z, zc + 0.35))), { angle: 0, gap: 2.6, w: 0 });
          for (const a of arches) f.path(Array.from({ length: 10 }, (_, i) => { const t = Math.PI * i / 9; return P(a.x + Math.cos(t) * (a.R + 0.05), r + Math.sin(t) * (a.R + 0.05)); }), { w: 1 });
          if (k === (sy > 0 ? '+y' : '-y') && o.livery) { const c = P(0, (zc + 0.35 + zw0 - 0.12) / 2); f.text(o.livery, c[0], c[1], 0.2, { w: 1 }); }
          // the entrance door near the front on the near side (the -y side, kerb side)
          if (k === '-y') {
            const dA = P(x1 - 1.45, zc + 0.12), dB = P(x1 - 0.35, z1 - 0.15);
            f.rect(dA[0], dA[1], dB[0], dB[1], { w: 1 });
            const mx = (dA[0] + dB[0]) / 2;
            f.line(mx, dA[1], mx, dB[1], { w: 1 });
            for (const [p0, p1] of [[dA[0], mx], [mx, dB[0]]]) K.glass(f, [[p0 + 0.06, dA[1] + 0.5], [p1 - 0.06, dA[1] + 0.5], [p1 - 0.06, dB[1] - 0.08], [p0 + 0.06, dB[1] - 0.08]], { gap: 1.1, gap2: 2.5 });
          }
        }
        // rivet seams between the window bays and the panels below
        f.rivets(t0[0], t0[1] - 0.05, t1[0], t1[1] - 0.05, { pitch: 9 });
      }
      for (const k of ['+x', '-x']) {
        const f = S.f(k);
        if (!f.on || !f.front) continue;
        const xs = k === '+x' ? x1 : x0;
        const P = (y, z) => faceUV(f, M.W([xs, y, z]));
        const rq = (ya, za, yb, zb2) => { const p = P(ya, za), q = P(yb, zb2); return [[p[0], p[1]], [q[0], p[1]], [q[0], q[1]], [p[0], q[1]]]; };
        const yi = W / 2 - 0.12;
        if (d === 0 && k === '+x') {
          K.glass(f, rq(-yi, zw0, yi, zw1), { gap: 1.0, gap2: 2.6, angle: 70 });
          f.line(...P(0, zw0), ...P(0, zw1), { w: 1 });
          const g = rq(-W * 0.3, zc + 0.15, W * 0.3, zc + 0.5);
          f.path(g, { closed: true, w: 1 });
          f.hatch(g, { angle: 0, gap: 1.8, w: 0 });
        } else {
          K.glass(f, rq(-yi, zw0, -0.06, zw1), { gap: 1.0, gap2: 2.4 });
          K.glass(f, rq(0.06, zw0, yi, zw1), { gap: 1.0, gap2: 2.4 });
        }
        if (d === n - 1 && k === '+x' && o.route) { const zr = zt - dh * 0.06; f.path(rq(-W * 0.35, zr - 0.09, W * 0.35, zr + 0.09), { closed: true, w: 1 }); const c = P(0, zr); f.text(o.route, c[0], c[1], 0.11, { w: 1 }); }
      }
    });
  }
  // the near-side mirrors, lamps, bumper
  M.part('HEADLAMP', () => {
    for (const s of [1, -1]) M.at(x1, s * W * 0.36, zc + 0.35, () => lampUnit(M, 0.12));
    M.box([x1, -W / 2, zc - 0.02], [x1 + 0.12, W / 2, zc + 0.16], { chamfer: 0.05 });
    M.box([x0 - 0.12, -W / 2, zc - 0.02], [x0, W / 2, zc + 0.16], { chamfer: 0.05 });
  });
  M.part('ROAD WHEEL', () => {
    for (const x of wheels) for (const s of [1, -1]) M.at(x, s * (W / 2 - r * 0.4), r, () => K.wheel(M, { r, w: r * 0.6, hub: r * 0.6, hubs: 'seen' }));
    M.info.centers = (M.info.centers || []).concat(wheels.map((x) => [[x, -W / 2 - 0.3, r], [x, W / 2 + 0.3, r]]));
  });
  void sx;
  return { L, W, H, wheels, deckH: dh, decks: n, z1, zc, r };
}

// ---------------------------------------------------------------------------------- caravan
// o: len, wid, hgt, r, windows, label. Drawbar toward +x, hitch at returned point (local)
export function caravan(M, o = {}) {
  const L = o.len ?? 4.2, W = o.wid ?? 2.0, H = o.hgt ?? 2.4, r = o.r ?? 0.3;
  const zb = r * 1.35;
  // side profile: rounded front and rear ends, a slight roof camber
  const top = [];
  const corner = (cx, cz, a0, a1, rad, n = 5) => { for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D2R; top.push([cx + Math.cos(a) * rad, cz + Math.sin(a) * rad]); } };
  const rr = Math.min(0.55, H * 0.25);
  const prof = [[L / 2 - 0.1, zb]];
  corner(L / 2 - rr, H - rr, -10, 90, rr);
  corner(-L / 2 + rr, H - rr, 90, 180, rr);
  prof.push(...top, [-L / 2, zb + 0.15], [-L / 2 + 0.12, zb]);
  const S = M.extrude(prof, -W / 2, W / 2, { plane: 'xz', smoothDeg: 30 });
  M.box([-L * 0.42, -W * 0.42, zb - 0.16], [L * 0.42, W * 0.42, zb], { isect: false });
  const e = M.view.e;
  if (M.decorOn) {
    for (const k of ['+y', '-y']) {
      const f = S.f(k);
      if (!f.on || !f.front) continue;
      const ys = k === '+y' ? W / 2 : -W / 2;
      const P = (x, z) => faceUV(f, M.W([x, ys, z]));
      // horizontal planking
      for (let z = zb + 0.18; z < H - 0.25; z += 0.16) { const a = P(-L / 2 + 0.05, z), b = P(L / 2 - 0.15, z); if (z < zb + 0.9 || z > H - 0.6) f.line(a[0], a[1], b[0], b[1], { w: 0 }); }
      const nw = o.windows ?? 2;
      for (let i = 0; i < nw; i++) {
        const cx = -L / 2 + L * (i + 0.7) / (nw + 0.6);
        const a = P(cx - 0.4, zb + 0.95), b = P(cx + 0.4, H - 0.65);
        f.rect(a[0] - 0.05, a[1] - 0.05, b[0] + 0.05, b[1] + 0.05, { w: 1 });
        K.glass(f, [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]], { gap: 1.0, gap2: 2.4, flip: i % 2 });
      }
      if (k === '-y') {
        const a = P(-0.05, zb + 0.12), b = P(0.62, H - 0.3);
        f.rect(a[0], a[1], b[0], b[1], { w: 1 });
        K.glass(f, [[a[0] + 0.1, b[1] - 0.6], [b[0] - 0.1, b[1] - 0.6], [b[0] - 0.1, b[1] - 0.12], [a[0] + 0.1, b[1] - 0.12]], { gap: 1.1, gap2: 2.4 });
      }
      if (o.label) { const c = P(-L * 0.05, zb + 0.55); f.text(o.label, c[0], c[1], 0.16, { w: 1 }); }
      f.line(...P(-L / 2 + 0.05, zb + 0.4), ...P(L / 2 - 0.12, zb + 0.4), { w: 1 });
    }
    // the front window on the nose (a flat panel set into the rounded end)
  }
  // roof light and front window frame as a small box
  M.boxc([L * 0.05, 0, H + 0.04], [0.6, 0.5, 0.1], { isect: false });
  // axle and wheels
  for (const s of [1, -1]) M.at(0, s * (W / 2 - r * 0.35), r, () => K.wheel(M, { r, w: r * 0.55, hub: r * 0.55, hubs: 'seen' }));
  for (const s of [1, -1]) M.extrude([[-r * 1.3, r * 0.6], [r * 1.3, r * 0.6], [r * 1.25, r + 0.18], [-r * 1.25, r + 0.18]].map(([x, z]) => [x, z + 0.0]), s * W / 2, s * (W / 2 + 0.03), { plane: 'xz', isect: false });
  // A-frame drawbar, jockey wheel, gas bottles box
  const hx = L / 2 + 1.0, hz = zb - 0.05;
  for (const s of [1, -1]) M.tube([L / 2 - 0.3, s * W * 0.38, zb - 0.1], [hx - 0.1, 0, hz], 0.04, {});
  M.at(hx - 0.05, 0, hz, () => { M.boxc([0, 0, 0], [0.22, 0.1, 0.1]); M.at(0.12, 0, 0, () => M.sphere(0.05)); });
  M.tube([hx - 0.4, 0.12, hz], [hx - 0.4, 0.12, 0.12], 0.025, { isect: false });
  M.at(hx - 0.4, 0.12, 0.08, () => K.wheel(M, { r: 0.08, w: 0.05, hub: 0.04 }));
  M.box([L / 2 - 0.05, -0.45, zb - 0.02], [L / 2 + 0.45, 0.45, zb + 0.45]);
  void e;
  return { L, W, H, hitch: [hx + 0.1, 0, hz], axle: 0, zb };
}

// ---------------------------------------------------------------------------------- bicycle wheel
export function bikeWheel(M, o = {}) {
  const R = o.r ?? 0.34, n = o.spokes ?? 24;
  M.rx(-90, () => M.torus(R - 0.018, 0.018, { isect: false, rings: 6 }));
  M.rx(-90, () => M.torus(R - 0.045, 0.008, { isect: false, rings: 4 }));
  M.cyl(0.025, -0.05, 0.05, { axis: 'y', isect: false });
  for (let i = 0; i < n; i++) {
    const a = i * 2 * Math.PI / n + (i % 2 ? 0.1 : 0);
    const s = i % 2 ? 0.035 : -0.035;
    M.line([[0, s, 0], [Math.cos(a) * (R - 0.05), 0, Math.sin(a) * (R - 0.05)]], { w: 0, pass: 2 });
  }
}

// ---------------------------------------------------------------------------------- van / pickup cab
// a cab from x0 to x1 (front), width W, height H, floor at zf; raked windshield
export function cab(M, o = {}) {
  const x1 = o.x1 ?? 2, len = o.len ?? 1.9, W = o.wid ?? 1.9, H = o.hgt ?? 2.1, zf = o.zf ?? 0.5;
  const x0 = x1 - len, zh = zf + (H - zf) * 0.42;
  const prof = [[x0, zf], [x1, zf], [x1, zh], [x1 - 0.45, zh + 0.1], [x1 - 0.85, H], [x0, H]];
  const S = M.extrude(prof, -W / 2, W / 2, { plane: 'xz' });
  if (M.decorOn) {
    for (const k of ['+y', '-y']) {
      const f = S.f(k);
      if (!f.on || !f.front) continue;
      const ys = k === '+y' ? W / 2 : -W / 2;
      const P = (x, z) => faceUV(f, M.W([x, ys, z]));
      const g = [P(x0 + 0.15, zh + 0.12), P(x1 - 0.5, zh + 0.12), P(x1 - 0.86, H - 0.1), P(x0 + 0.15, H - 0.1)];
      K.glass(f, g, { gap: 1.0, gap2: 2.4 });
      f.path([P(x0 + 0.08, zf + 0.15), P(x1 - 0.3, zf + 0.15), P(x1 - 0.3, zh + 0.05), P(x1 - 0.82, H - 0.04), P(x0 + 0.08, H - 0.04)], { closed: true, w: 1 });
      f.line(...P(x0 + 0.2, zh - 0.08), ...P(x0 + 0.4, zh - 0.08), { w: 1 });
      if (o.text) { const c = P((x0 + x1) / 2 - 0.1, (zf + zh) / 2); f.text(o.text, c[0], c[1], Math.min(0.16, len / o.text.length * 1.1), { w: 1 }); }
    }
    const w = S.f('s3');
    if (w.on && w.front) { const q = w.poly.map(([u, v]) => [u * 0.88, v * 0.8]); K.glass(w, q, { gap: 1.1, gap2: 2.6, angle: 70 }); }
    const fr = S.f('s1');
    if (fr.on && fr.front) { fr.rect(-fr.w * 0.25, -fr.h * 0.3, fr.w * 0.25, fr.h * 0.25, { w: 1 }); fr.hatch([-fr.w * 0.25, -fr.h * 0.3, fr.w * 0.25, fr.h * 0.25], { angle: 0, gap: 1.8, w: 0 }); }
  }
  for (const s of [1, -1]) M.at(x1, s * W * 0.36, (zf + zh) / 2 + 0.05, () => lampUnit(M, 0.1));
  M.box([x1, -W / 2, zf - 0.05], [x1 + 0.12, W / 2, zf + 0.12], { chamfer: 0.04 });
  for (const s of [1, -1]) M.at(x1 - 0.95, s * (W / 2 + 0.03), H - 0.45, () => { M.tube([0, 0, 0], [0, s * 0.18, 0], 0.015, { isect: false }); M.boxc([0, s * 0.2, -0.1], [0.04, 0.06, 0.28], { isect: false }); });
  return { x0, x1, H, zh, S };
}

// ---------------------------------------------------------------------------------- legs
// a jointed walking leg from a hip point on a frame, out along the unit plan direction d:
// hip bracket and pin, a box-section thigh rising to the knee, a hydraulic ram from below the
// hip to the thigh, a telescopic shin down to an ankle ball and a footpad on the ground.
// o: reach (plan distance hip to foot), up (knee height above the hip), r (beam half width)
export function walkLeg(M, hip, d, o = {}) {
  const R = o.reach ?? 3, up = o.up ?? 1.2, r = o.r ?? 0.14;
  const K2 = [hip[0] + d[0] * R * 0.48, hip[1] + d[1] * R * 0.48, hip[2] + up];
  const F = [hip[0] + d[0] * R, hip[1] + d[1] * R, 0];
  const fpR = o.foot ?? r * 4.5;
  const A2 = [F[0], F[1], fpR * 0.5 + r * 1.2];
  // hip bracket and pin
  M.with({ at: hip, rz: Math.atan2(d[1], d[0]) / D2R }, () => {
    M.box([-r * 0.2, -r * 1.6, -r * 1.8], [r * 1.2, r * 1.6, r * 1.8]);
    M.cyl(r * 0.55, -r * 2.0, r * 2.0, { axis: 'y', isect: false });
  });
  // thigh: a box beam
  M.along(hip, K2, (l) => {
    const S = M.box([0, -r, -r * 0.85], [l, r, r * 0.85]);
    for (const k of ['+y', '-y', '+z']) { const f = S.f(k); if (f.on) { f.rect(-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2), { w: 0 }); if (k !== '+z') f.rivets(-f.w / 2 + f.mOf(4), 0, f.w / 2 - f.mOf(4), 0, { pitch: 8 }); } }
  });
  // knee pin with collar
  M.with({ at: K2, rz: Math.atan2(d[1], d[0]) / D2R }, () => { M.cyl(r * 0.75, -r * 1.25, r * 1.25, { axis: 'y', isect: false }); M.cyl(r * 0.4, -r * 1.45, r * 1.45, { axis: 'y', isect: false }); });
  // ram
  const rb = [hip[0] - d[0] * r * 0.5, hip[1] - d[1] * r * 0.5, hip[2] - r * 4];
  const rt = lerp(hip, K2, 0.62);
  const rm = lerp(rb, rt, 0.55);
  M.tube(rb, rm, r * 0.42, {});
  M.tube(rm, rt, r * 0.24, { isect: false });
  K.collar(M, rb, rm, 0.95, r * 0.42, { len: r * 0.6, k: 1.2 });
  // shin: upper sleeve, lower rod
  const sm = lerp(K2, A2, 0.5);
  M.tube(K2, sm, r * 0.62, {});
  M.tube(sm, A2, r * 0.42, { isect: false });
  K.collar(M, K2, sm, 0.96, r * 0.62, { len: r * 0.8, k: 1.2 });
  M.at(A2[0], A2[1], A2[2], () => M.sphere(r * 0.75));
  M.at(F[0], F[1], 0, () => K.footpad(M, { r: fpR }));
  return { foot: F, knee: K2 };
}

// ---------------------------------------------------------------------------------- cradle
// saddle posts from a frame top at zTop up to a curved underside: under(x, y) -> z of the
// body's underside (or null where there is none). xs, ys: the post stations.
export function cradle(M, under, xs, ys, zTop, o = {}) {
  const r = o.r ?? 0.08;
  let n = 0;
  for (const x of xs) for (const y of ys) {
    const z = under(x, y);
    if (z == null || z <= zTop + 0.02) continue;
    M.box([x - r * 1.6, y - r * 1.6, zTop], [x + r * 1.6, y + r * 1.6, zTop + r * 0.5], { isect: false });
    M.box([x - r, y - r, zTop], [x + r, y + r, z + r * 0.2]);
    M.box([x - r * 2.2, y - r * 1.4, z - r * 0.4], [x + r * 2.2, y + r * 1.4, z + r * 0.15]);
    n++;
  }
  return n;
}
