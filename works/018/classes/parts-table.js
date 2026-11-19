// classes/parts-table.js: what tableware.js and oddment.js share. Round household things at
// vehicle scale, mostly lathes: curves (spline, bezier), a swept pipe with a radius per point
// (spouts, handles), profile helpers (t at a height, radius at t), plate seams and rivet rows
// on lathes, rows of portholes with dark glass, a door drawn on a lathe with a fold-down
// platform and a ladder, a ring handrail, steam, and run(): the common flow (pick the
// object, plan the running gear from gear.js, build the object on it, word the sheet).

import * as K from '../kit.js';
import * as G from './gear.js';
import { dot, sub, add, mul, norm, cross, len, D2R } from '../geom.js';

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const wd = (n) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n));
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const thou = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ------------------------------------------------------------------ curves
// Catmull-Rom through control points (3D), n samples per span
export function spline(ctrl, n = 6) {
  const out = [];
  const P = (i) => ctrl[Math.max(0, Math.min(ctrl.length - 1, i))];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((c) => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(ctrl[ctrl.length - 1].slice());
  return out;
}
export function bezier(p0, p1, p2, p3, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([0, 1, 2].map((c) => u * u * u * p0[c] + 3 * u * u * t * p1[c] + 3 * u * t * t * p2[c] + t * t * t * p3[c]));
  }
  return out;
}

// ------------------------------------------------------------------ swept pipe, radius per point
// rad: number, array (one per point) or fn(t 0..1). Smooth along its length. Returns the
// solid with .rings [{p, r, d, N, B}] for collars and shade lines.
export function sweep(M, pts, rad, o = {}) {
  const n = pts.length;
  const R = pts.map((_, i) => (typeof rad === 'function' ? rad(i / (n - 1)) : Array.isArray(rad) ? rad[i] : rad));
  const rmax = Math.max(...R);
  let seg = o.seg;
  if (!seg) {
    if (M.decorOn) { const rpx = rmax / M.px; seg = rpx < 1.6 ? 6 : rpx < 4 ? 8 : rpx < 9 ? 12 : rpx < 20 ? 16 : 24; } else seg = 8;
  }
  const dirs = [];
  for (let i = 0; i + 1 < n; i++) dirs.push(norm(sub(pts[i + 1], pts[i])));
  const t0 = dirs[0];
  const ref = o.ref || (Math.abs(t0[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]);
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
  const verts = [], rings = [], info = [];
  for (let i = 0; i < n; i++) {
    // tangent at a point: the mean of the two segment directions (a smooth sweep)
    const s = i === 0 ? 0 : i - 1;
    const d = i > 0 && i < n - 1 ? norm(add(dirs[i - 1], dirs[i])) : dirs[s];
    let Nf = NS[i === 0 ? 0 : Math.min(i, NS.length - 1)];
    Nf = norm(sub(Nf, mul(d, dot(Nf, d))));
    const Bf = cross(d, Nf);
    const row = [];
    for (let k = 0; k < seg; k++) {
      const a = 2 * Math.PI * k / seg;
      row.push(verts.length);
      verts.push(add(pts[i], add(mul(Nf, R[i] * Math.cos(a)), mul(Bf, R[i] * Math.sin(a)))));
    }
    rings.push(row);
    info.push({ p: pts[i], r: R[i], d, N: Nf, B: Bf });
  }
  const faces = [];
  for (let i = 0; i + 1 < n; i++) {
    for (let k = 0; k < seg; k++) {
      const k2 = (k + 1) % seg;
      faces.push({ v: [rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]], g: 50 });
    }
  }
  if (o.caps !== false) {
    faces.push({ v: rings[0].slice().reverse(), name: 'capA' });
    faces.push({ v: rings[n - 1].slice(), name: 'capB' });
  }
  const S = M._solid(verts, faces, { ...o, closed: o.caps !== false, girth: o.girth ?? 2 * rmax, kind: 'tube' });
  S.rings = info;
  S.capB = S.names.capB != null ? S.f('capB') : null;
  if (o.shade !== false) sweepShade(M, S, o.shadeN ?? 4);
  return S;
}

// shade lines along a sweep on its dark side (free lines just outside the surface)
export function sweepShade(M, S, nl = 4) {
  if (!M.decorOn) return;
  const W = (p) => M.W(p);
  const e = M.view.e, Lw = M.light;
  // work in world space: ring points are local, map them
  const rings = S.rings.map((q) => {
    const p = W(q.p), d = norm(sub(W(add(q.p, q.d)), p));
    return { p, d, r: len(sub(W(add(q.p, mul(q.N, q.r))), p)) };
  });
  if (rings[0].r / M.px < 2) return;
  const fr = [0.5, 0.68, 0.82, 0.93, 0.6, 0.76].slice(0, nl);
  for (const f of fr) {
    let run = [];
    const flush = () => { if (run.length > 1) M.world(() => M.line(run, { w: 0, pass: 3 })); run = []; };
    for (const q of rings) {
      const u0 = sub(e, mul(q.d, dot(e, q.d)));
      const lu = len(u0);
      if (lu < 0.15) { flush(); continue; }
      const u = mul(u0, 1 / lu);
      let w = mul(Lw, -1);
      w = sub(w, mul(q.d, dot(w, q.d)));
      let s = sub(w, mul(u, dot(w, u)));
      if (len(s) < 1e-6) { flush(); continue; }
      s = norm(s);
      const th = f * Math.PI / 2;
      const dir = add(mul(u, Math.cos(th)), mul(s, Math.sin(th)));
      run.push(add(q.p, mul(dir, q.r * 1.004)));
    }
    flush();
  }
}

// a collar band around a sweep at ring index i
export function sweepBand(M, S, i, k = 1.18, l = null) {
  const q = S.rings[Math.max(0, Math.min(S.rings.length - 1, i))];
  const L = l ?? q.r * 0.5;
  const a = sub(q.p, mul(q.d, L / 2)), b = add(q.p, mul(q.d, L / 2));
  return M.tube(a, b, q.r * k, { isect: false, shade: false });
}

// ------------------------------------------------------------------ profiles
// arc-length parameter t of profile point index i
export function tIdx(prof, i) {
  let tot = 0, at = 0;
  for (let j = 0; j + 1 < prof.length; j++) {
    const l = Math.hypot(prof[j + 1][0] - prof[j][0], prof[j + 1][1] - prof[j][1]);
    if (j < i) at += l;
    tot += l;
  }
  return tot ? at / tot : 0;
}
// t where the profile first (or last) crosses height z
export function tZ(prof, z, last = false) {
  let tot = 0;
  const cum = [0];
  for (let j = 0; j + 1 < prof.length; j++) { tot += Math.hypot(prof[j + 1][0] - prof[j][0], prof[j + 1][1] - prof[j][1]); cum.push(tot); }
  let best = null;
  for (let j = 0; j + 1 < prof.length; j++) {
    const z0 = prof[j][1], z1 = prof[j + 1][1];
    if ((z - z0) * (z - z1) <= 0 && z0 !== z1) {
      const f = (z - z0) / (z1 - z0);
      const t = (cum[j] + (cum[j + 1] - cum[j]) * f) / tot;
      if (!last) return t;
      best = t;
    }
  }
  return best ?? (z <= prof[0][1] ? 0 : 1);
}
// radius of the profile at height z (outermost crossing)
export function rZ(prof, z) {
  let r = 0;
  for (let j = 0; j + 1 < prof.length; j++) {
    const z0 = prof[j][1], z1 = prof[j + 1][1];
    if ((z - z0) * (z - z1) <= 0 && z0 !== z1) r = Math.max(r, prof[j][0] + (prof[j + 1][0] - prof[j][0]) * (z - z0) / (z1 - z0));
  }
  return r;
}
// radius at t (arc length) on a lathe surface
export function rT(L, t) {
  const [j, f] = L._j(t);
  const P = L.profile, q = P[(j + 1) % P.length];
  return Math.abs(P[j][0] + (q[0] - P[j][0]) * f);
}
// an oval (two half-ellipses) from radius rb at z = zb up to radius rt at the top; the widest
// ring R at height zm. n points per half. Returns [[r, z], ...] bottom to top.
export function oval(R, zb, rb, zm, rt, zt, n = 8) {
  const out = [];
  // lower half: r = R cos(th), z = zm + B1 sin(th), th from -thb to 0 so that r(-thb) = rb
  const thb = Math.acos(clamp(rb / R, 0, 1)), B1 = (zm - zb) / Math.sin(thb || 1e-6);
  for (let i = 0; i <= n; i++) { const th = -thb + thb * i / n; out.push([R * Math.cos(th), zm + B1 * Math.sin(th)]); }
  const tht = Math.acos(clamp(rt / R, 0, 1)), B2 = (zt - zm) / Math.sin(tht || 1e-6);
  for (let i = 1; i <= n; i++) { const th = tht * i / n; out.push([R * Math.cos(th), zm + B2 * Math.sin(th)]); }
  return out;
}

// ------------------------------------------------------------------ decor on lathes
const facing = (M, L, a, t, k = 0.08) => dot(L.at(a, t).n, M.view.e) > k;

// a row of rivets along a ring (front side only)
export function rivetRing(M, L, t, n, o = {}) {
  if (!L.on) return;
  const rr = M.px * (o.px ?? 0.75);
  const pent = [0, 1, 2, 3, 4].map((i) => [Math.cos(i * 1.2566) * rr, Math.sin(i * 1.2566) * rr]);
  for (let i = 0; i < n; i++) {
    const a = (o.a0 ?? 0) + i * 360 / n;
    if (facing(M, L, a, t, 0.18)) L.shape(a, t, pent, { closed: true, w: 0 });
  }
}
// plate seams: double rings at ts with rivets, meridian seams (n), shading
export function plates(M, L, o = {}) {
  if (!L.on) return;
  const ts = o.rings || [];
  const total = L.total;
  const dbl = M.px * 1.6 / total;
  for (const t of ts) {
    L.ring(t, { w: 1 });
    if (o.double !== false) L.ring(t + dbl, { w: 0 });
    if (o.rivets !== false) {
      const r = rT(L, t);
      const n = Math.min(160, Math.max(8, Math.round(2 * Math.PI * r / (M.px * (o.pitch ?? 8)))));
      rivetRing(M, L, t + dbl * 2.6, n);
    }
  }
  const nm = o.seams ?? 0;
  const t0 = o.t0 ?? 0, t1 = o.t1 ?? 1;
  for (let i = 0; i < nm; i++) {
    const a = (o.a0 ?? 0) + (i + 0.5) * 360 / nm;
    if (o.skip && o.skip(a)) continue;
    // staggered seams: alternate bands are offset by half a plate
    if (o.stagger && ts.length > 1) {
      const bands = [t0, ...ts, t1];
      for (let b = 0; b + 1 < bands.length; b++) L.meridian(a + (b % 2 ? 180 / nm : 0), bands[b], bands[b + 1], { w: 1 });
    } else L.meridian(a, t0, t1, { w: 1 });
  }
  if (o.shade !== false) L.shade({ t0: o.st0 ?? t0, t1: o.st1 ?? t1, gap: o.gap ?? 2.0, gapMax: o.gapMax ?? 7, threshold: o.threshold ?? 0.38 });
}

// a porthole on a lathe at (a, t): bolt ring, inner ring, dark glass (short meridians)
export function latPort(M, L, a, t, rad, o = {}) {
  if (!L.on || rad / M.px < 2.2) return;
  if (!facing(M, L, a, t, 0.05)) return;
  L.port(a, t, rad, { w: 1 });
  const ri = rad * 0.74;
  L.port(a, t, ri, { w: 1 });
  const r = rT(L, t), tot = L.total;
  if (rad / M.px > 7) {
    const nb = 8;
    const tri = (rr) => [0, 1, 2].map((i) => [Math.cos(i * 2.094) * rr, Math.sin(i * 2.094) * rr]);
    for (let i = 0; i < nb; i++) { const q = (i + 0.5) * 2 * Math.PI / nb; L.shape(a + Math.cos(q) * rad * 0.87 / r / D2R, t + Math.sin(q) * rad * 0.87 / tot, tri(M.px * 0.6), { closed: true, w: 0 }); }
  }
  // glass: denser on one side
  const g0 = M.px * 0.95, g1 = M.px * 2.2;
  let x = -ri * 0.96;
  while (x < ri * 0.96) {
    const h = Math.sqrt(Math.max(0, ri * ri * 0.92 - x * x));
    if (h > M.px * 0.5) L.meridian(a + x / r / D2R, t - h / tot, t + h / tot, { w: 0, pass: 3 });
    const f = (x + ri) / (2 * ri);
    x += o.flip ? g1 + (g0 - g1) * f : g0 + (g1 - g0) * f;
  }
}
// the angle on a lathe surface at t most turned toward the viewer, away from avoid +-gap
export function bestAngle(M, L, t, avoid = [], gap = 30, k = 0) {
  let best = 0, bs = -Infinity;
  for (let a = 0; a < 360; a += 5) {
    if (avoid.some((b) => Math.abs((((a - b) % 360) + 540) % 360 - 180) < gap)) continue;
    const s = dot(L.at(a, t).n, M.view.e) - k * Math.abs(L.at(a, t).n[2]);
    if (s > bs) { bs = s; best = a; }
  }
  return best;
}
// a row of n portholes around the ring at t (skipping angles where o.skip(a) is true)
export function portRow(M, L, t, n, rad, o = {}) {
  let k = 0;
  for (let i = 0; i < n; i++) {
    const a = (o.a0 ?? 0) + (i + 0.5) * 360 / n;
    if (o.skip && o.skip(a)) continue;
    latPort(M, L, a, t, rad, { flip: i % 2 === 1 });
    k++;
  }
  return k;
}
// a rectangular window band on a lathe: frame + glass
export function latWindow(M, L, a, t, w, h, o = {}) {
  if (!L.on || !facing(M, L, a, t, 0.02)) return;
  const r = rT(L, t), tot = L.total;
  const R = (x, y) => [[-x, -y], [x, -y], [x, y], [-x, y]];
  L.shape(a, t, R(w / 2, h / 2), { closed: true, w: 1 });
  L.shape(a, t, R(w * 0.42, h * 0.4), { closed: true, w: 1 });
  const da = w * 0.42 / r / D2R, dt = h * 0.4 / tot;
  L.hatch(a - da, a + da, t - dt, t + dt, { gap: o.gap ?? 1.1 });
  if (o.bar) L.shape(a, t, [[0, -h * 0.4], [0, h * 0.4]], { w: 1 });
}
// a door drawn on a lathe at angle a, sill at t (bottom), w x h meters
export function latDoor(M, L, a, tSill, w, h) {
  if (!L.on) return;
  const tot = L.total, tm = tSill + h / 2 / tot;
  const R = (x, y) => [[-x, -y], [x, -y], [x, y], [-x, y]];
  L.shape(a, tm, R(w / 2, h / 2), { closed: true, w: 1 });
  L.shape(a, tm, R(w * 0.4, h * 0.44), { closed: true, w: 1 });
  // window in the upper part, handle, kick plate line
  const r = rT(L, tm);
  const wa = w * 0.28 / r / D2R;
  L.shape(a, tm + h * 0.22 / tot, R(w * 0.28, h * 0.12), { closed: true, w: 1 });
  L.hatch(a - wa, a + wa, tm + h * 0.1 / tot, tm + h * 0.34 / tot, { gap: 1.1 });
  L.shape(a, tm, [[w * 0.3, -h * 0.04], [w * 0.3, h * 0.04]], { w: 1 });
  L.shape(a, tm - h * 0.3 / tot, [[-w * 0.4, 0], [w * 0.4, 0]], { w: 0 });
}

// a fold-down platform at angle a on a lathe wall (radius r at height z, local frame of the
// object), with a ladder down to zLadder (local). Returns the ladder foot (world) for the figure.
export function boarding(M, a, r, z, o = {}) {
  const ar = a * D2R;
  return boardingAt(M, [Math.cos(ar) * r, Math.sin(ar) * r, z], a, o);
}
// the same at a local point p, facing out along azimuth a (deg)
export function boardingAt(M, p, a, o = {}) {
  let foot = null;
  const z = p[2];
  M.part('BOARDING PLATFORM', () => {
    M.with({ at: p, rz: a }, () => {
      const d = o.depth ?? 1.3, pw = o.width ?? 1.8;
      K.platform(M, { depth: d, width: pw, inset: o.inset ?? 0.3, stayH: o.stayH ?? 1.6, drop: o.drop ?? 0.2 });
      M.callout('BOARDING PLATFORM', 1, [d * 0.6, 0, 0], 1.6);
      const zl = o.zLadder ?? 0;
      if (z - zl > 0.6) {
        M.part('ACCESS LADDER', () => {
          M.at(d + 0.1, 0, zl - z, () => K.ladder(M, { h: z - zl + 0.9, w: 0.5 }));
          M.callout('ACCESS LADDER', 1, [d + 0.1, 0, (zl - z) * 0.5], 1.5);
        });
      }
      const fp = M.W([d + 1.0, pw * 0.9, zl - z]);
      foot = [fp[0], fp[1]];
    });
  });
  return foot;
}

// handrail ring at radius r, height z (local), posts every ~pitch; o.h rail height
export function railRing(M, r, z, o = {}) {
  const h = o.h ?? 0.9, rr = o.r ?? 0.03;
  const n = Math.max(12, Math.round(2 * Math.PI * r / (o.pitch ?? 0.5)));
  const top = [], mid = [];
  for (let i = 0; i <= 48; i++) { const a = 2 * Math.PI * i / 48; top.push([Math.cos(a) * r, Math.sin(a) * r, z + h]); mid.push([Math.cos(a) * r, Math.sin(a) * r, z + h * 0.5]); }
  M.pipe(top, rr, { isect: false, smoothBends: true });
  if (o.mid !== false) M.pipe(mid, rr * 0.8, { isect: false, smoothBends: true });
  const np = Math.max(6, Math.round(n / 2));
  for (let i = 0; i < np; i++) {
    const a = 2 * Math.PI * (i + 0.5) / np;
    const zz = o.zAt ? o.zAt(r) : z;
    M.tube([Math.cos(a) * r, Math.sin(a) * r, zz - 0.05], [Math.cos(a) * r, Math.sin(a) * r, z + h], rr, { isect: false, shade: false });
  }
}

// steam: n thin wavy lines rising from p (local), drifting along drift
export function steam(M, p, o = {}) {
  const n = o.n ?? 3, h = o.h ?? 2, amp = o.amp ?? h * 0.08;
  const dr = o.drift ?? [h * 0.25, 0, 0];
  for (let k = 0; k < n; k++) {
    const pts = [];
    const ph = k * 2.1 + (o.phase ?? 0), off = (k - (n - 1) / 2) * h * 0.06;
    const L = h * (0.75 + 0.25 * ((k * 0.618) % 1));
    for (let i = 0; i <= 24; i++) {
      const s = i / 24;
      const w = Math.sin(s * Math.PI * 2.4 + ph) * amp * (0.3 + s);
      pts.push([p[0] + dr[0] * s + off + w * 0.7, p[1] + dr[1] * s + w * 0.7, p[2] + L * s]);
    }
    M.line(pts, { w: k === 1 ? 1 : 0, pass: 2, fit: false, occlude: true });
  }
}

// a knob: neck and a ball (or a finial) at the local origin, standing up
export function knob(M, r, o = {}) {
  const kind = o.kind ?? 'ball';
  M.cyl(r * 0.45, 0, r * 0.7);
  M.cyl(r * 0.75, r * 0.0, r * 0.18);
  if (kind === 'ball') return M.at(0, 0, r * 1.35, () => M.sphere(r));
  if (kind === 'acorn') return M.lathe([[r * 0.5, r * 0.6], [r * 0.95, r * 0.9], [r * 1.0, r * 1.25], [r * 0.7, r * 1.75], [r * 0.25, r * 2.05], [0, r * 2.15]]);
  return M.lathe([[r * 0.6, r * 0.6], [r * 1.0, r * 0.75], [r * 1.0, r * 1.05], [r * 0.6, r * 1.2], [0, r * 1.25]]);
}

// a lamp pointing along the local +x on a short bracket
export function lampOn(M, r) { return K.lamp(M, { r }); }

// ------------------------------------------------------------------ standing lathes: view, door, dressing
// view: az measured from the spout axis (+x), so spout and handle show in profile
export function viewSide(M, lo = 58, hi = 74) {
  const s = M.pick([1, -1]), back = M.chance(0.3);
  const az = s * M.r(lo, hi) + (back ? 180 : 0);
  M.setView(az, M.r(20, 28));
  return az;
}
// the angle (deg, about z) on a lathe most turned toward the viewer, kept away from the
// angles in avoid (spout, handle) by at least gap degrees
export function doorAngle(M, avoid = [0, 180], gap = 40) {
  const e = M.view.e;
  let best = 90, bs = -Infinity;
  for (let a = 0; a < 360; a += 5) {
    if (avoid.some((b) => Math.abs((((a - b) % 360) + 540) % 360 - 180) < gap)) continue;
    const s = Math.cos(a * D2R) * e[0] + Math.sin(a * D2R) * e[1];
    if (s > bs) { bs = s; best = a; }
  }
  return best;
}
export const near = (a, b, d) => Math.abs((((a - b) % 360) + 540) % 360 - 180) < d;
// volume of a lathe profile in m3
export function volume(prof) {
  let v = 0;
  for (let i = 0; i + 1 < prof.length; i++) {
    const [r0, z0] = prof[i], [r1, z1] = prof[i + 1];
    v += Math.PI * (z1 - z0) * (r0 * r0 + r0 * r1 + r1 * r1) / 3;
  }
  return Math.abs(v);
}
// ladder target: to the ground for legs and skis, else to the object's own base
export const ladderZ = (g) => (g.kind === 'legs' || g.kind === 'skis' ? -g.z : 0);
export const waterKinds = (g) => g.family === 'sea' || ['floats', 'paddles', 'hover'].includes(g.kind);

// ================================================================== shared dressing
// plate rings at heights zs, staggered seams, a port row, the stenciled number
export function dress(M, S, prof, o) {
  const L = S.lat;
  const tq = (z) => tZ(prof, z);
  if (L.on) {
    plates(M, L, { rings: (o.rings || []).map(tq), seams: o.seams ?? 16, stagger: true, t0: o.t0 ?? 0.02, t1: o.t1 ?? tq(o.zTop), skip: o.skip, rivets: o.rivets, shade: o.shade });
    if (o.number) L.text(o.number.s, o.number.a, tq(o.number.z), o.number.h);
  }
  let n = 0;
  if (o.ports) n = portRow(M, L, tq(o.ports.z), o.ports.n, o.ports.r, { skip: o.ports.skip, a0: o.ports.a0 });
  return n;
}
// a door drawn on a standing lathe with its platform and ladder; returns a ground spot or null
export function crewDoor(M, S, prof, aD, zS, hMax, g, o = {}) {
  const dh = clamp(hMax, 0.8, 1.95), dw = clamp(dh * 0.45, 0.5, 0.85);
  M.part('CREW DOOR', () => {
    latDoor(M, S.lat, aD, tZ(prof, zS), dw, dh);
    const r = rZ(prof, zS + dh / 2);
    M.callout(o.label || 'CREW DOOR', 1, [Math.cos(aD * D2R) * r, Math.sin(aD * D2R) * r, zS + dh * 0.5], 1.4);
  });
  if (o.platform === false) return null;
  const zl = o.zLadder ?? ladderZ(g);
  const foot = boarding(M, aD, rZ(prof, zS), zS, { depth: o.depth ?? 1.2, width: clamp(dw * 2.2, 1.2, 1.9), inset: o.inset ?? 0.2, stayH: dh * 0.85, zLadder: zl });
  return zl < 0 || o.ground ? foot : null;
}
// smooth profile from control points (r, z) by Catmull-Rom
export const sprof = (pts, n = 4) => spline(pts.map(([r, z]) => [r, z, 0]), n).map(([r, z]) => [Math.max(0, r), z]);
// a loop handle between two points on a profile, bulging out to reach (local, in the xz plane at angle a)
export function loopHandle(M, a, pts, r, o = {}) {
  return M.rz(a, () => {
    const P = spline(pts, 5);
    const S = sweep(M, P, r);
    const n = S.rings.length;
    if (o.bands !== false) for (const i of [Math.round(n * 0.32), Math.round(n * 0.5), Math.round(n * 0.68)]) sweepBand(M, S, i, 1.15, r * 0.6);
    return { S, mid: M.W(P[Math.round(P.length * 0.45)]) };
  });
}
export const sideY = (M) => (M.view.e[1] >= 0 ? 1 : -1);


// ------------------------------------------------------------------ naming
const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
export function designation(M) {
  const L = () => LET[Math.floor(M.rng() * LET.length)];
  const k = M.rng(), a = L(), b = L(), c = L(), d = L(), e = L(), n = M.ri(2, 60);
  if (k < 0.4) return `${a}${b}-${c}${d}${e}`;
  if (k < 0.75) return `TYPE ${n}-${a}`;
  return `${a}${b}-${n}`;
}

// ------------------------------------------------------------------ the common flow
// OBJ: { key: { name: [..], plan(M) -> P, build(M, P, ctx) -> res, words(P, ctx) -> {...} } }
//   P: { len, wid, hgt, mass, kinds?, round? } and the object's own parameters
//   res: { mainS (main solid), figure, crew }
//   words: { places: [...], briefs: [fn(ctx) -> string], specs: [[k, v], ...] }
export function run(M, OBJ, o = {}) {
  const keys = Object.keys(OBJ);
  let key = keys[Math.floor(M.rng() * keys.length)];
  if (G.test.variant && OBJ[G.test.variant]) key = G.test.variant;
  const obj = OBJ[key];
  const P = obj.plan(M);
  const g = G.plan(M, { len: P.len, wid: P.wid, hgt: P.hgt, mass: P.mass, kinds: P.kinds, round: P.round ?? true });
  const des = designation(M);
  const unit = String(M.ri(1, 99)).padStart(2, '0');
  const wordR = Array.from({ length: 12 }, () => M.rng());
  const ctx = { g, des, unit, key, r: M.rng() };
  let res = {};
  M.at(0, 0, g.z, () => { res = obj.build(M, P, ctx) || {}; });
  if (res.main) M.info.mass = res.main.slice();
  const gi = g.build();
  // ---- words
  const W = obj.words(P, ctx, res);
  const NAME = W.name;
  const adj = g.adj === 'ROAD' ? 'WHEELED' : g.adj;
  const placeU = (W.places && wordR[0] < 0.5 ? W.places : g.places)[Math.floor(wordR[1] * (W.places && wordR[0] < 0.5 ? W.places : g.places).length)];
  const cands = [
    `${adj} ${NAME}`,
    `${placeU} ${NAME} ${g.form}`,
    `${NAME} ${g.form}`,
    `${placeU} ${adj} ${NAME}`,
  ].filter((s) => s.length <= 34 && /^[A-Z0-9 .,\-\/']+$/.test(s));
  const klass = cands.length ? cands[Math.floor(wordR[2] * cands.length)] : NAME;
  const bctx = { goes: g.goes, place: placeU.toLowerCase(), kind: g.kind, family: g.family, r: wordR };
  const briefs = (W.briefs || []).map((f) => f(bctx)).filter((s) => s && s.length <= 78);
  const brief = briefs.length ? briefs[Math.floor(wordR[3] * briefs.length)] : (W.fallback || `A ${NAME.toLowerCase()} that ${g.goes}.`).slice(0, 78);
  const specs = [...(W.specs || []).slice(0, 2), ...(gi.specs || []).slice(0, 1), ...(W.specs || []).slice(2), ...(gi.specs || []).slice(1)].slice(0, 4);
  return {
    klass, brief, specs, designation: des,
    family: g.family, float: g.float,
    figure: res.figure || gi.figure || undefined,
    drops: res.drops,
  };
}
