// classes/appliance.js: household machines at vehicle scale. Each is built from its real
// profile (extrusions, lofts, lathes), then made a machine: seams and rivets, hatches,
// portholes, a cab or a driver's position, a ladder, lamps, the designation stenciled on.
// It stands on running gear from gear.js.
//
// Objects: iron, typewriter, telephone (rotary), sewing machine, gramophone, toaster.

import * as G from './gear.js';
import { word, fitBrief } from '../words.js';
import { curve, steps, mesh, Surf, seatUnit, steering, windshield, clamp, smooth, mix, K, D2R, add, sub, mul, norm, cross, dot, len, lerp, circlePts } from './parts-wear.js';

const OBJECTS = ['iron', 'typewriter', 'telephone', 'sewing', 'gramophone', 'toaster'];

export default {
  id: 'appliance',
  family: 'ground',
  weight: 2,
  build(M) {
    const objs = OBJECTS.filter((k) => BUILD[k]);
    let obj = M.pick(objs);
    if (G.test.variant && BUILD[G.test.variant]) obj = G.test.variant;
    return BUILD[obj](M);
  },
};

// ------------------------------------------------------------------ helpers
function co(M, label, qty, p, prio = 1) {
  const w = M.W(p), e = M.view.e, k = (M.px || 0) * 3;
  M.world(() => M.callout(label, qty, [w[0] + e[0] * k, w[1] + e[1] * k, w[2] + e[2] * k], prio));
}
function pickKlass(M, list) { const ok = list.filter((k) => k.length <= 34); const k = M.pick(list); return ok.length ? (ok.includes(k) ? k : ok[0]) : k.slice(0, 34); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function fit(s) { return fitBrief(s); }
// face coordinates of a world point
const fxy = (f, p) => [dot(sub(p, f.o), f.u), dot(sub(p, f.o), f.v)];
const view = (M, base, a0, a1, el0, el1) => {
  const s = M.pick([1, -1]);
  M.setView(base + s * M.r(a0, a1), M.r(el0, el1));
  return { sy: M.view.e[1] >= 0 ? 1 : -1, sx: M.view.e[0] >= 0 ? 1 : -1 };
};
// a lamp at local point p shining along d
function lamp(M, p, d, r) {
  M.along(p, add(p, d), () => {
    M.ry(90, () => M.cyl(r * 0.8, -r * 0.3, r * 0.9));
    const R = M.ry(90, () => M.cyl(r, r * 0.9, r * 1.2, { isect: false }));
    if (R.top.ok) { R.top.circle(0, 0, r * 0.7, { w: 1 }); R.top.hatch(circlePts(0, 0, r * 0.66, r * 0.66, 16), { angle: 60, gap: 1.4, w: 0 }); }
  });
}
// panel a planar face: grid of plates, some with ports or hatches
function plates(f, n, m, kinds, o = {}) {
  if (!f.on) return [];
  const g = f.grid(n, m, { gap: 2.2, ...(o.rect ? { rect: o.rect } : {}) });
  g.forEach((r, k) => { if (!f.holds(r)) return; K.fill(f, r, typeof kinds === 'function' ? kinds(r, k) : kinds); });
  return g;
}
// ladder from the ground plane (local z = 0 of the current frame) up to z at (x, y), facing out
function ladderUp(M, x, y, z, rz, w = 0.5) {
  M.at(x, y, 0, () => M.rz(rz, () => K.ladder(M, { h: z, w, gap: 0.3 })));
}
function seenFace(S, names) { return names.map((k) => S.f(k)).filter((f) => f.on); }

// round the corners of a closed 2D polygon: fillet radius r (or per-vertex array), n steps
function fillet(pts, r, n = 4) {
  const out = [], m = pts.length;
  for (let i = 0; i < m; i++) {
    const p = pts[i], a = pts[(i + m - 1) % m], b = pts[(i + 1) % m];
    const rr = Array.isArray(r) ? r[i] : r;
    const da = [a[0] - p[0], a[1] - p[1]], db = [b[0] - p[0], b[1] - p[1]];
    const la = Math.hypot(...da), lb = Math.hypot(...db);
    const ua = [da[0] / la, da[1] / la], ub = [db[0] / lb, db[1] / lb];
    const cosT = clamp(ua[0] * ub[0] + ua[1] * ub[1], -1, 1), th = Math.acos(cosT);
    if (!rr || th < 1e-3 || Math.PI - th < 1e-3) { out.push(p); continue; }
    let d = rr / Math.tan(th / 2);
    d = Math.min(d, la * 0.45, lb * 0.45);
    const p0 = [p[0] + ua[0] * d, p[1] + ua[1] * d], p1 = [p[0] + ub[0] * d, p[1] + ub[1] * d];
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      // quadratic Bezier through the corner
      out.push([(1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * p[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * p[1] + t * t * p1[1]]);
    }
  }
  return out;
}

const BUILD = {};

// ---------------------------------------------------------------- clothes iron
BUILD.iron = (M) => {
  const L = M.wpick([[2, M.r(3.2, 4.5)], [2, M.r(5, 7)], [1, M.r(8, 10)]]);
  const W = L * M.r(0.5, 0.56);
  const tP = L * 0.055, hB = L * M.r(0.15, 0.19), hH = L * M.r(0.4, 0.48);
  const tip = M.r(1.6, 2.4);                  // nose sharpness
  const vw = view(M, 0, 50, 64, 22, 30);
  const unit = String(M.ri(1, 99)).padStart(2, '0');
  const tank = M.chance(0.7), cord = M.chance(0.85);
  // plan half width along x: square back, pointed nose
  const hw = (x) => { const s = (x + L / 2) / L; return W / 2 * (s < 0.03 ? 0.93 + s / 0.03 * 0.07 : s < 0.45 ? 1 : Math.pow(Math.max(0, 1 - Math.pow((s - 0.45) / 0.55, tip)), 0.75)); };
  const plan = (k, n, inset = 0) => {
    // perimeter: k 0..n-1, port side from back to nose, then starboard back
    const h = n / 2, out = [];
    void k;
    for (let i = 0; i <= h; i++) { const t = i / h; const x = -L / 2 + inset + (L - 2 * inset) * (1 - Math.pow(1 - t, 1.3)); out.push([x, Math.max(0, hw(x) - inset)]); }
    for (let i = h - 1; i >= 1; i--) { const p = out[i]; out.push([p[0], -p[1]]); }
    // back corners: round them a little
    return out;
  };
  const NP = 40;
  const g = G.plan(M, { len: L, wid: W, hgt: hH, mass: L * W * hH * 0.2, kinds: { wheels: 2, tracks: 1.5, skis: 1.5, hover: 1.5, floats: 1, rails: 1, legs: 1, rotors: 1, balloons: 0.8, wings: 0.6, rockets: 0.5, sails: 0.6 } });
  let crew = L < 5 ? 1 : L < 8 ? 2 : 4;
  M.at(0, 0, g.z, () => {
    // ------------------------------------------- sole plate: chamfered slab
    let sole;
    M.part('SOLE PLATE', () => {
      const a = plan(0, NP, L * 0.012).map(([x, y]) => [x, y, 0]);
      const b = plan(0, NP, 0).map(([x, y]) => [x, y, tP]);
      sole = M.loft(a, b, {});
      const top = sole.f('b');
      if (top.on) {
        // steam ports round the margin outside the body
        const n = Math.round(L / 0.25);
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const x = -L / 2 + L * 0.04 + (L * 0.9) * t;
          for (const s of [1, -1]) { const y = s * (hw(x) - L * 0.022); if (Math.abs(y) < L * 0.01) continue; const q = fxy(top, M.W([x, y, tP])); top.circle(q[0], q[1], L * 0.006, { w: 1, n: 8 }); }
        }
        const q = fxy(top, M.W([L * 0.44, 0, tP]));
        top.circle(q[0], q[1], L * 0.01, { w: 1 });
      }
      for (const k of ['s5', 's10', 's15', 's25', 's30']) { const f = sole.f(k); if (f.on) f.hatch(f.poly, { angle: 0, gap: 2.2 + (1 - f.tone) * 2, w: 0 }); }
      co(M, 'SOLE PLATE', 1, [-L * 0.1, vw.sy * W / 2, tP * 0.5], 2.2);
      co(M, 'STEAM PORT', Math.round(L / 0.25) * 2, [L * 0.1, vw.sy * (hw(L * 0.1) - L * 0.022), tP], 1.2);
    });
    // ------------------------------------------- body shell: lofted through shrinking plans
    let body, BS;
    M.part('BODY SHELL', () => {
      const shrink = (t) => 1 - 0.2 * t * t;
      const base = plan(0, NP, L * 0.03);
      const cx = (t) => -L * 0.02 * t;
      const fn = (t, a) => {
        const n = base.length, q = ((a % 1) + 1) % 1 * n, k = Math.floor(q) % n, f = q - Math.floor(q);
        const p = lerp(base[k], base[(k + 1) % n], f);
        return [cx(t) + (p[0] - cx(t)) * shrink(t) + L * 0.01 * t, p[1] * shrink(t) * (1 - 0.15 * t), tP + hB * (1 - Math.pow(1 - t, 1.6))];
      };
      const U = base.map((_, k) => k / base.length);
      const top = base.map((_, k) => fn(1, k / base.length));
      const bot = base.map((_, k) => fn(0, k / base.length));
      body = mesh(M, [{ fn, S: steps(0, 1, 7, false), U, wrapU: true, g: 1, caps: [Object.assign(top.slice(), { name: 'top' }), bot] }], { closed: true, orient: true });
      BS = new Surf(M, (t, a) => fn(t, (a % 1 + 1) % 1), { inside: () => [0, 0, tP + hB * 0.5] });
      M.info.mass = body.bbox.slice();
      if (M.decorOn) {
        // seams: a ring at mid height, and plate butts
        BS.runU(0.5, 0, 1, { w: 1, k: 160 });
        BS.rowU(0.42, 0, 1, { pitch: 7, r: 0.8 });
        for (const a of [0.12, 0.3, 0.42, 0.58, 0.7, 0.88]) BS.runS(a, 0.05, 0.98, { w: 1 });
        BS.shade({ gap: 2.2, s: [0.02, 0.98], u: [0, 1], k: 200, dir: 'u' });
        // portholes along the seen side
        const side = vw.sy;
        for (const a of side > 0 ? [0.16, 0.22, 0.34] : [0.66, 0.78, 0.84]) BS.port(0.55, a, hB * 0.16);
        BS.text(unit, 0.25, side > 0 ? 0.28 : 0.72, hB * 0.2);
      }
      co(M, 'BODY SHELL', 1, fn(0.6, vw.sy > 0 ? 0.25 : 0.75), 1.6);
      co(M, 'PORTHOLE', 6, fn(0.5, vw.sy > 0 ? 0.24 : 0.76), 1.1);
    });
    const zTop = tP + hB;
    // ------------------------------------------- handle arch: the bridge is in the grip
    const tw = W * 0.22;
    const xF = L * 0.2, xR = -L * 0.38;
    let hand;
    M.part('HANDLE BRIDGE', () => {
      const z0 = zTop - L * 0.02, zt = hH, th = L * 0.075;
      const prof = [
        [xF + L * 0.06, z0], [xF - L * 0.04, zt - th * 0.7], [xF - L * 0.1, zt], [xR + L * 0.02, zt], [xR - L * 0.015, zt - th * 0.4], [xR - L * 0.01, z0],
        [xR + L * 0.07, z0], [xR + L * 0.075, zt - th * 1.1], [xF - L * 0.1, zt - th], [xF - L * 0.06, zt - th * 1.4], [xF - L * 0.01, z0],
      ];
      hand = M.extrude(prof, -tw / 2, tw / 2, { plane: 'xz', smoothDeg: 40 });
      const f = hand.f(vw.sy > 0 ? '+y' : '-y');
      if (f.on) {
        // windows along the grip: the bridge
        const n = Math.max(3, Math.round((xF - xR) / (th * 1.4)));
        for (let i = 0; i < n; i++) {
          const x = xR + L * 0.09 + (xF - xR - L * 0.22) * (i + 0.5) / n;
          const q = fxy(f, M.W([x, vw.sy * tw / 2, zt - th * 0.5]));
          const ww = (xF - xR - L * 0.22) / n * 0.78, wh = th * 0.62;
          K.xWindow(f, [q[0] - ww / 2, q[1] - wh / 2, q[0] + ww / 2, q[1] + wh / 2], { flip: i % 2 === 1 });
        }
        const q0 = fxy(f, M.W([xF - L * 0.02, vw.sy * tw / 2, z0 + (zt - z0) * 0.45]));
        f.text('MAX', q0[0], q0[1], th * 0.22, { w: 1, pass: 4 });
        // rivets along the edges of the grip
        const a = fxy(f, M.W([xR + L * 0.08, 0, zt - th * 0.08])), b = fxy(f, M.W([xF - L * 0.12, 0, zt - th * 0.08]));
        f.rivets(a[0], a[1], b[0], b[1], { pitch: 6 });
      }
      for (const k of ['s2', 's8']) { const ff = hand.f(k); if (ff.on) ff.hatch(ff.poly, { angle: 90, gap: 2.4, w: 0 }); }
      co(M, 'HANDLE BRIDGE', 1, [(xF + xR) / 2, vw.sy * tw / 2, zt - th * 0.5], 2.5);
      co(M, 'BRIDGE WINDOW', 4, [(xF + xR) / 2 - L * 0.08, vw.sy * tw / 2, zt - th * 0.5], 1.4);
      // a windshield at the front of the grip and a seat behind it
      const a3 = [xF - L * 0.08, tw / 2 * 0.9, zt + 0.01], b3 = [xF - L * 0.08, -tw / 2 * 0.9, zt + 0.01];
      windshield(M, a3, b3, Math.min(0.5, L * 0.08), { rake: 30, post: false });
      M.at(xF - L * 0.08 - 0.75, 0, zt + 0.08, () => seatUnit(M, { w: Math.min(0.5, tw * 0.8), d: 0.45, h: 0.5, pedestal: 0.06 }));
      M.at(xF - L * 0.08 - 0.3, 0, zt + 0.45, () => steering(M, { r: 0.16, rake: 40, base: [0.15, 0, -0.4] }));
      co(M, 'DRIVER SEAT', 1, [xF - L * 0.08 - 0.75, 0, zt + 0.3], 1.0);
      // grab rails along the top
      for (const s of [1, -1]) K.railing(M, [[xR + L * 0.03, s * tw * 0.42, zt], [xF - L * 0.16, s * tw * 0.42, zt]], { h: 0.6, posts: 1.2, r: 0.02 });
    });
    // ------------------------------------------- temperature dial at the front post
    M.part('TEMPERATURE DIAL', () => {
      const x = xF + L * 0.07, r = Math.min(W * 0.14, L * 0.06);
      const z = zTop - L * 0.012;
      M.at(x, 0, z, () => {
        const D = M.cyl(r, 0, L * 0.025);
        const C = M.cyl(r * 0.25, L * 0.025, L * 0.045, { isect: false });
        M.boxc([0, 0, L * 0.033], [r * 1.6, r * 0.25, L * 0.02], { isect: false });
        if (D.top.ok) {
          const f = D.top;
          f.circle(0, 0, r * 0.92, { w: 1 });
          for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; f.line(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, { w: i % 3 ? 0 : 1 }); }
          const lab = ['NYLON', 'SILK', 'WOOL', 'COTTON', 'LINEN'];
          lab.forEach((t, i) => { const a = (-60 + i * 30) * D2R; f.text(t, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.09, { w: 1, pass: 4 }); });
        }
        void C;
      });
      co(M, 'TEMPERATURE DIAL', 1, [x, 0, z + L * 0.03], 1.8);
    });
    // ------------------------------------------- water tank window, filler cap
    if (tank) M.part('WATER TANK', () => {
      const x = xF + L * 0.17;
      M.at(x, 0, zTop - L * 0.03, () => { M.cyl(W * 0.06, 0, L * 0.035); M.cyl(W * 0.07, L * 0.035, L * 0.045, { isect: false }); });
      if (M.decorOn) { const a = 0.5 + vw.sy * 0.0; void a; }
      co(M, 'WATER FILLER', 1, [x, 0, zTop + L * 0.03], 1.2);
    });
    // ------------------------------------------- cord socket and cable
    if (cord) M.part('CORD SOCKET', () => {
      const p = [xR - L * 0.03, 0, zTop + L * 0.04];
      M.along(p, add(p, [-1, 0, -0.35]), () => { M.ry(90, () => { M.cone(L * 0.04, L * 0.028, 0, L * 0.09); for (let i = 1; i < 4; i++) M.cyl(L * 0.042 - i * L * 0.004, L * 0.022 * i, L * 0.022 * i + L * 0.006, { isect: false }); }); });
      const s = vw.sy;
      const e = add(p, [-L * 0.085, 0, -L * 0.03]);
      const pts = [e, add(e, [-L * 0.08, s * L * 0.02, -L * 0.05]), add(e, [-L * 0.14, s * L * 0.1, -L * 0.1]), add(e, [-L * 0.12, s * L * 0.22, -L * 0.14])];
      const zg = -(M.W([0, 0, 0])[2]) * 0 + 0;
      void zg;
      M.pipe(pts, L * 0.012, { isect: false, smoothBends: true });
      const q = pts[pts.length - 1];
      M.at(q[0], q[1], q[2], () => { M.boxc([0, 0, 0], [L * 0.05, L * 0.035, L * 0.03]); M.tube([0, L * 0.008, -L * 0.015], [0, L * 0.008, -L * 0.04], L * 0.003); M.tube([0, -L * 0.008, -L * 0.015], [0, -L * 0.008, -L * 0.04], L * 0.003); });
      co(M, 'CORD SOCKET', 1, p, 1.5);
      co(M, 'POWER CABLE', 1, pts[2], 0.9);
    });
    // ------------------------------------------- lamps on the nose, ladder at the heel
    M.part('HEADLAMP', () => {
      for (const s of [1, -1]) lamp(M, [L * 0.3, s * hw(L * 0.3) * 0.8, tP + hB * 0.4], [1, s * 0.4, 0], Math.max(0.06, L * 0.018));
      co(M, 'HEADLAMP', 2, [L * 0.32, vw.sy * hw(L * 0.32) * 0.8, tP + hB * 0.4], 1.2);
    });
    M.part('ACCESS LADDER', () => {
      const y = vw.sy * W * 0.22, x = -L / 2 + L * 0.014;
      M.at(x, y, tP, () => K.ladder(M, { h: hH - tP + 0.9, w: 0.45, gap: 0.3 }));
      for (const d of [-0.22, 0.22]) M.tube([x, y + d, hH - 0.15], [xR, y + d, hH - 0.15], 0.025, { isect: false });
      co(M, 'ACCESS LADDER', 1, [x, y, hH * 0.6], 1.3);
    });
  });
  const gi = g.build();
  const place = M.pick(g.places);
  const klass = pickKlass(M, [`${place} STEAM IRON ${g.form}`, `${g.adj} STEAM IRON`, `${place} CLOTHES IRON ${g.form}`, `${g.adj} CLOTHES IRON`]);
  const briefs = [`Presses the canvas of 12 circus tents in one working day.`, `${cap(g.goes)} and presses sails for the harbor fleet.`, `Takes ${word(crew)} ${crew === 1 ? 'presser' : 'pressers'} to the laundry and keeps the plate at 200 degrees.`, `Irons the town's flags before the national holiday.`];
  return {
    klass, family: g.family, float: g.float,
    brief: fit(M.pick(briefs)),
    specs: [['PLATE', '200 DEG C'], ...gi.specs, ['CREW', String(crew)], ['STEAM', `${Math.round(L * 40)} KG/H`]].slice(0, 4),
    figure: gi.figure,
  };
};

// ---------------------------------------------------------------- typewriter
BUILD.typewriter = (M) => {
  const Wd = M.wpick([[2, M.r(3.4, 4.6)], [2, M.r(5, 7)], [1, M.r(8, 10)]]);
  const D = Wd * M.r(0.8, 0.9), Hb = Wd * M.r(0.26, 0.31);
  const vw = view(M, 0, 30, 44, 32, 40);
  const unit = String(M.ri(1, 99)).padStart(2, '0');
  const lamps = M.chance(0.8);
  const g = G.plan(M, { len: D * 1.05, wid: Wd * 1.25, hgt: Hb * 2, mass: Wd * D * Hb * 0.3, kinds: { wheels: 2, tracks: 2, legs: 1.5, rails: 1.2, skis: 1, hover: 1, floats: 1, rotors: 1, balloons: 1, wings: 0.6, rockets: 0.5 } });
  const crew = Wd < 5 ? 2 : Wd < 8 ? 4 : 7;
  M.at(0, 0, g.z, () => {
    const xf = D / 2, xk0 = D / 2 - D * 0.07, zk0 = Hb * 0.22, xk1 = D / 2 - D * 0.46, zk1 = Hb * 0.72;
    const xb = -D / 2;
    const prof = [[xf, 0], [xf, zk0 * 0.75], [xk0, zk0], [xk1, zk1], [xk1 - D * 0.04, Hb * 0.85], [xb + D * 0.12, Hb], [xb, Hb * 0.95], [xb, 0]];
    let B;
    M.part('TYPEWRITER BODY', () => {
      B = M.extrude(prof, -Wd / 2, Wd / 2, { plane: 'xz', smoothDeg: 25 });
      M.info.mass = B.bbox.slice();
      // side frames
      for (const k of ['+y', '-y']) {
        const f = B.f(k);
        if (!f.on) continue;
        const a = fxy(f, M.W([xb + D * 0.08, 0, Hb * 0.15])), b = fxy(f, M.W([xk1 + D * 0.05, 0, Hb * 0.75]));
        plates(f, 3, 2, (r) => (r.j === 1 && r.i > 0 ? 'xWindow' : r.i === 0 && r.j === 0 ? 'hatch' : 'plain'), { rect: [Math.min(a[0], b[0]), a[1], Math.max(a[0], b[0]), b[1]] });
        const q = fxy(f, M.W([xf - D * 0.15, 0, Hb * 0.12]));
        K.stencil(f, unit, q[0], q[1], Hb * 0.1);
        f.rivets(...fxy(f, M.W([xb + D * 0.03, 0, Hb * 0.04])), ...fxy(f, M.W([xf - D * 0.03, 0, Hb * 0.04])), { pitch: 7 });
      }
      // front lip: a grille and a name band
      const front = B.f('s0');
      if (front.on) { const g2 = front.grid(5, 1, { gap: 2.2 }); g2.forEach((r, i) => K.fill(front, r, i === 2 ? 'plain' : 'louver')); }
      const deck = B.f('s4');
      if (deck.on) plates(deck, 4, 2, 'plain');
      const back = B.f('s6');
      if (back.on) plates(back, 5, 2, (r) => (r.j === 0 ? 'corrugated' : 'louver'));
      for (const k of ['s5', 's6']) { const f = B.f(k); if (f.on && f.tone > 0.3) f.hatch(f.poly, { angle: 0, gap: 3.2 - f.tone * 1.4, w: 0 }); }
      co(M, 'FRAME', 1, [xb + D * 0.3, vw.sy * Wd / 2, Hb * 0.5], 1.4);
      co(M, 'CREW CABIN', 1, [xb + D * 0.45, vw.sy * Wd / 2, Hb * 0.55], 1.2);
    });
    // keyboard: four stepped rows of round keys
    M.part('KEYBOARD', () => {
      const rows = [11, 11, 10, 9];
      const letters = ['1234567890-', 'QWERTYUIOP/', 'ASDFGHJKL;', 'ZXCVBNM,.'];
      const pitch = Wd * 0.074, rk = pitch * 0.36;
      const nrm = norm([zk1 - zk0, 0, xk0 - xk1]);
      for (let r = 0; r < 4; r++) {
        const t = 0.16 + 0.7 * (3 - r) / 3;
        const base = [mix(xk0, xk1, t), 0, mix(zk0, zk1, t)];
        const stem = Hb * 0.11 + r * Hb * 0.035;
        const n = rows[r], off = (r % 2) * pitch * 0.3;
        for (let i = 0; i < n; i++) {
          const y = (i - (n - 1) / 2) * pitch + off;
          const p = [base[0], y, base[2]];
          const top = [p[0] + nrm[0] * 0.02, y, p[2] + stem];
          M.tube(p, top, rk * 0.18, { isect: false, shade: false });
          const C = M.at(top[0], top[1], top[2], () => { M.cyl(rk * 1.06, -rk * 0.12, 0, { isect: false }); return M.cyl(rk, 0, rk * 0.38, { isect: false }); });
          if (C.top.ok) { const ch = letters[r][i % letters[r].length]; C.top.circle(0, 0, rk * 0.78, { w: 0 }); C.top.text(ch, 0, 0, rk * 0.75, { w: 1, pass: 4, upright: true }); }
        }
      }
      // space bar
      const tS = 0.05, bs = [mix(xk0, xk1, tS), 0, mix(zk0, zk1, tS)];
      M.boxc([bs[0], 0, bs[2] + Hb * 0.08], [rk * 1.3, pitch * 6, rk * 0.45], { isect: false });
      for (const s of [-2.4, 2.4]) M.tube([bs[0], s * pitch, bs[2]], [bs[0], s * pitch, bs[2] + Hb * 0.07], rk * 0.15, { isect: false });
      co(M, 'KEYBOARD', 41, [mix(xk0, xk1, 0.5), vw.sy * Wd * 0.2, mix(zk0, zk1, 0.5) + Hb * 0.15], 2.5);
      co(M, 'SPACE BAR', 1, [bs[0], vw.sy * pitch * 2, bs[2] + Hb * 0.1], 1.1);
    });
    // type basket: a fan of type bars in a half-round well
    const zD = Hb * 0.86, xP = xb + D * 0.2, zP = Hb + Wd * 0.07;
    M.part('TYPE BASKET', () => {
      const R = Wd * 0.22, cx = xk1 - D * 0.04;
      const well = [];
      for (let i = 0; i <= 16; i++) { const a = Math.PI * i / 16; well.push([cx - Math.sin(a) * R * 0.45, Math.cos(a) * R, zD + 0.01]); }
      const Wp = M.plate(well, { isect: false });
      if (Wp.f('face').on) { const f = Wp.f('face'); f.hatch(f.poly, { angle: 30, gap: 1.2, gap2: 3, w: 0 }); }
      const hit = [xP + Wd * 0.06, 0, zP - Wd * 0.02];
      for (let i = 0; i <= 28; i++) {
        const a = Math.PI * (0.06 + 0.88 * i / 28);
        const p = [cx - Math.sin(a) * R * 0.4, Math.cos(a) * R * 0.95, zD + 0.02];
        const q = lerp(p, hit, 0.45);
        M.line([p, [q[0], q[1], q[2] + Wd * 0.015], lerp(p, hit, 0.6)], { w: 1 });
      }
      co(M, 'TYPE BASKET', 28, [cx - R * 0.2, 0, zD + 0.1], 1.9);
    });
    // ribbon spools
    M.part('RIBBON SPOOL', () => {
      for (const s of [1, -1]) M.at(xk1 - D * 0.03, s * Wd * 0.34, zD - 0.02, () => { const S = M.cyl(Wd * 0.06, 0, Wd * 0.025); M.cyl(Wd * 0.045, Wd * 0.025, Wd * 0.03, { isect: false }); if (S.top.ok) { S.top.circle(0, 0, Wd * 0.02, { w: 1 }); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; S.top.line(Math.cos(a) * Wd * 0.02, Math.sin(a) * Wd * 0.02, Math.cos(a) * Wd * 0.055, Math.sin(a) * Wd * 0.055, { w: 0 }); } } });
      M.line([[xk1 - D * 0.03, Wd * 0.28, zD + Wd * 0.012], [xP + Wd * 0.07, 0, zP - Wd * 0.03], [xk1 - D * 0.03, -Wd * 0.28, zD + Wd * 0.012]], { w: 1 });
      co(M, 'RIBBON SPOOL', 2, [xk1 - D * 0.03, vw.sy * Wd * 0.34, zD + Wd * 0.03], 1.1);
    });
    // carriage, platen and knobs
    const rP = Wd * 0.06, LP = Wd * 1.04;
    M.part('CARRIAGE', () => {
      M.box([xb + D * 0.05, -LP / 2 - Wd * 0.04, Hb - 0.02], [xb + D * 0.32, LP / 2 + Wd * 0.04, Hb + Wd * 0.02]);
      for (const s of [1, -1]) M.box([xb + D * 0.05, s * (LP / 2 + Wd * 0.04) - Wd * 0.02, Hb], [xb + D * 0.34, s * (LP / 2 + Wd * 0.04) + Wd * 0.02, zP + rP * 0.3]);
      co(M, 'CARRIAGE', 1, [xb + D * 0.3, vw.sy * LP * 0.3, Hb + Wd * 0.02], 1.4);
    });
    M.part('PLATEN ROLLER', () => {
      const P = M.at(xP, 0, zP, () => M.cyl(rP, -LP / 2, LP / 2, { axis: 'y' }));
      if (M.decorOn) P.lat.shade({ gap: 1.8, gapMax: 4.5 });
      for (const s of [1, -1]) {
        const Kn = M.at(xP, s * (LP / 2 + Wd * 0.04), zP, () => M.cyl(rP * 1.25, -Wd * 0.03, Wd * 0.03, { axis: 'y' }));
        if (M.decorOn) { for (let i = 0; i < 24; i++) Kn.lat.meridian(i * 15, 0.1, 0.9, { w: 0 }); }
        M.at(xP, s * (LP / 2 + Wd * 0.075), zP, () => M.cyl(rP * 0.35, -Wd * 0.006, Wd * 0.006, { axis: 'y', isect: false }));
      }
      co(M, 'PLATEN ROLLER', 1, [xP, vw.sy * LP * 0.42, zP + rP], 2.2);
      co(M, 'PLATEN KNOB', 2, [xP, vw.sy * (LP / 2 + Wd * 0.07), zP + rP], 1.2);
    });
    // a sheet of paper standing in the platen, with lines typed on it
    M.part('PAPER SHEET', () => {
      const pw = Wd * 0.62, ph = Wd * 0.5;
      const fn = (t, u) => [xP - rP * 0.2 - ph * 0.22 * t * t, u * pw / 2, zP + rP * 0.9 + ph * t];
      mesh(M, [{ fn, S: steps(0, 1, 6, false), U: steps(-1, 1, 2, false) }], { two: true, g: 20, isect: false });
      const F = new Surf(M, fn, { inside: (t) => [xP - 1, 0, zP + ph * t], ur: [-1, 1] });
      if (M.decorOn) {
        const nL = 14;
        for (let i = 0; i < nL; i++) {
          const t = 0.82 - i * 0.045;
          const len2 = i === 0 ? 0.35 : i === 1 || i === 6 ? 0.55 : 0.82 - ((i * 0.37) % 0.3);
          const x0 = i === 0 ? -0.15 : -0.8;
          // words: short dashes
          let u = x0;
          let k = 0;
          while (u < x0 + len2 * 2 - 0.05) { const wl = 0.06 + ((i * 7 + k * 3) % 5) * 0.03; F.line([[t, u], [t, Math.min(u + wl, 0.85)]], { w: 0, lift: 1.4 }); u += wl + 0.04; k++; }
        }
      }
      co(M, 'PAPER SHEET', 1, fn(0.7, vw.sy * 0.3), 2.0);
    });
    // carriage return lever on the left end
    M.part('CARRIAGE RETURN', () => {
      const y = LP / 2 + Wd * 0.06;
      const a = [xb + D * 0.3, y, zP + rP * 0.4];
      const pts = [a, add(a, [D * 0.04, Wd * 0.03, Wd * 0.05]), add(a, [D * 0.2, Wd * 0.05, Wd * 0.07]), add(a, [D * 0.3, Wd * 0.02, Wd * 0.06])];
      M.pipe(pts, Wd * 0.01, { isect: false });
      const e = pts[3];
      M.at(e[0], e[1], e[2], () => M.boxc([Wd * 0.02, 0, 0], [Wd * 0.06, Wd * 0.012, Wd * 0.03]));
      co(M, 'CARRIAGE RETURN', 1, pts[2], 1.6);
    });
    // the driver sits at the right end of the deck behind a windshield
    M.part('DRIVER SEAT', () => {
      const y = -vw.sy * Wd * 0.0;
      void y;
      const x = xb + D * 0.5, z = Hb * 0.88;
      const ys = -Wd * 0.38;
      M.at(x, ys, z + 0.05, () => seatUnit(M, { w: 0.5, d: 0.45, h: 0.5, pedestal: 0.05 }));
      M.at(x + 0.42, ys, z + 0.45, () => steering(M, { r: 0.16, rake: 40, base: [0.15, 0, -0.42] }));
      co(M, 'DRIVER SEAT', 1, [x, ys, z + 0.3], 1.0);
    });
    if (lamps) M.part('HEADLAMP', () => {
      for (const s of [1, -1]) lamp(M, [xf + 0.02, s * Wd * 0.44, zk0 * 0.45], [1, 0, 0], Math.max(0.07, Wd * 0.025));
      co(M, 'HEADLAMP', 2, [xf, vw.sy * Wd * 0.44, zk0 * 0.45], 1.1);
    });
    M.part('ACCESS LADDER', () => {
      const y = vw.sy * (Wd / 2 + 0.25);
      M.at(xb + D * 0.62, y, 0, () => M.rz(0, () => K.ladder(M, { h: Hb * 0.88 + 0.9, w: 0.45, gap: 0.3 })));
      co(M, 'ACCESS LADDER', 1, [xb + D * 0.62, y, Hb * 0.5], 1.2);
    });
  });
  const gi = g.build();
  const place = M.pick(g.places);
  const klass = pickKlass(M, [`${place} TYPEWRITER ${g.form}`, `${g.adj} TYPEWRITER`, `TYPEWRITER ${g.form}`, `${g.adj} WRITING MACHINE`]);
  const briefs = [`Types the minutes of ${word(crew)} village councils in one round trip.`, `${cap(g.goes)} and types 60 words a minute for the county clerk.`, `Takes ${word(crew)} clerks to the inquiry and the record back.`, `Writes out 400 summonses a day and delivers them.`];
  return {
    klass, family: g.family, float: g.float,
    brief: fit(M.pick(briefs)),
    specs: [['KEYS', '41'], ...gi.specs, ['CREW', String(crew)], ['PITCH', '10 CPI']].slice(0, 4),
    figure: gi.figure,
  };
};

// ---------------------------------------------------------------- rotary telephone
BUILD.telephone = (M) => {
  const D = M.wpick([[2, M.r(3, 4.2)], [2, M.r(4.6, 6.5)], [1, M.r(7, 9)]]);
  const B = D * M.r(0.85, 0.95), H = D * M.r(0.46, 0.54);
  const vw = view(M, 0, 30, 42, 30, 38);
  const unit = String(M.ri(1, 99)).padStart(2, '0');
  const g = G.plan(M, { len: D * 1.05, wid: B * 1.15, hgt: H * 1.35, mass: D * B * H * 0.25, kinds: { wheels: 2, tracks: 1.5, legs: 1.5, rails: 1, skis: 1, hover: 1, floats: 1, rotors: 1.2, balloons: 1.2, wings: 0.6, rockets: 0.6, monowheel: 0.3 } });
  const crew = D < 4.5 ? 2 : D < 7 ? 3 : 5;
  M.at(0, 0, g.z, () => {
    const xf = D / 2, zs0 = H * 0.16, xs1 = -D * 0.02, zs1 = H * 0.82, xb = -D / 2;
    const prof = [[xf, 0], [xf, zs0 * 0.6], [xf - D * 0.03, zs0], [xs1 + D * 0.03, zs1 - H * 0.04], [xs1 - D * 0.05, zs1 + H * 0.02], [xb + D * 0.16, H], [xb + D * 0.04, H * 0.92], [xb, H * 0.7], [xb, 0]];
    let Bd;
    M.part('TELEPHONE BODY', () => {
      Bd = M.extrude(prof, -B / 2, B / 2, { plane: 'xz', smoothDeg: 30 });
      M.box([xb - D * 0.02, -B / 2 - D * 0.02, -0.01], [xf + D * 0.02, B / 2 + D * 0.02, H * 0.05], { chamfer: D * 0.03 });
      M.info.mass = Bd.bbox.slice();
      for (const k of ['+y', '-y']) {
        const f = Bd.f(k);
        if (!f.on) continue;
        // portholes in a row, a door, plates
        for (let i = 0; i < 3; i++) { const q = fxy(f, M.W([xb + D * (0.18 + i * 0.16), 0, H * 0.55])); K.porthole(f, q[0], q[1], H * 0.08); }
        const qd = fxy(f, M.W([xf - D * 0.2, 0, H * 0.25]));
        f.rect(qd[0] - H * 0.09, qd[1] - H * 0.16, qd[0] + H * 0.09, qd[1] + H * 0.16, { w: 1 });
        f.rect(qd[0] - H * 0.075, qd[1] - H * 0.145, qd[0] + H * 0.075, qd[1] + H * 0.145, { w: 0 });
        f.circle(qd[0] + H * 0.05 * (k === '+y' ? -1 : 1), qd[1], H * 0.012, { w: 1 });
        const qs = fxy(f, M.W([xb + D * 0.34, 0, H * 0.25]));
        K.stencil(f, unit, qs[0], qs[1], H * 0.12);
        f.rivets(...fxy(f, M.W([xb + D * 0.04, 0, H * 0.4])), ...fxy(f, M.W([xf - D * 0.05, 0, H * 0.4])), { pitch: 7 });
        f.line(...fxy(f, M.W([xb, 0, H * 0.4])), ...fxy(f, M.W([xf, 0, H * 0.4])), { w: 1 });
        if (f.tone > 0.3) f.hatch(f.poly, { angle: 0, gap: 3.4 - f.tone * 1.5, w: 0 });
      }
      const top = Bd.f('s5');
      if (top.on) plates(top, 3, 2, (r, k) => (k === 1 ? 'hatch' : 'plain'));
      for (const k of ['s6', 's7']) { const f = Bd.f(k); if (f.on) f.hatch(f.poly, { angle: 0, gap: 3, w: 0 }); }
      co(M, 'BODY', 1, [xb + D * 0.3, vw.sy * B / 2, H * 0.4], 1.3);
      co(M, 'PORTHOLE', 6, [xb + D * 0.34, vw.sy * B / 2, H * 0.55], 1.2);
      co(M, 'SIDE DOOR', 2, [xf - D * 0.2, vw.sy * B / 2, H * 0.25], 1.0);
    });
    // the dial on the sloped front
    M.part('ROTARY DIAL', () => {
      const t = 0.5;
      const c = [mix(xf - D * 0.03, xs1 + D * 0.03, t), 0, mix(zs0, zs1 - H * 0.04, t)];
      const n = norm([zs1 - zs0, 0, (xf - D * 0.03) - (xs1 + D * 0.03)]);
      const R = Math.min(B * 0.3, D * 0.27);
      M.along(c, add(c, n), () => {
        const Pl = M.cyl(R * 1.04, 0, R * 0.05, { axis: 'x' });
        const Wh = M.cyl(R * 0.98, R * 0.05, R * 0.12, { axis: 'x' });
        const Ct = M.cyl(R * 0.34, R * 0.12, R * 0.15, { axis: 'x', isect: false });
        const f = Wh.top, fp = Pl.top;
        if (f.ok) {
          const holes = [];
          for (let i = 0; i < 10; i++) {
            const a = (-50 - i * 30) * D2R;
            const p = M.W([R * 0.12, Math.cos(a) * R * 0.7, -Math.sin(a) * R * 0.7]);
            const q = fxy(f, p);
            holes.push(q);
            f.circle(q[0], q[1], R * 0.13, { w: 1 });
            f.circle(q[0], q[1], R * 0.1, { w: 0 });
            f.text(String((i + 1) % 10), q[0], q[1], R * 0.1, { w: 1, pass: 4, upright: true });
          }
          f.circle(0, 0, R * 0.92, { w: 0 });
        }
        if (Ct.top.ok) { Ct.top.circle(0, 0, R * 0.28, { w: 1 }); Ct.top.text(unit, 0, R * 0.05, R * 0.12, { w: 1, pass: 4, upright: true }); Ct.top.line(-R * 0.2, -R * 0.1, R * 0.2, -R * 0.1, { w: 0 }); }
        void fp;
        // finger stop
        const a0 = (-50 + 32) * D2R;
        M.pipe([[R * 0.13, Math.cos(a0) * R * 0.55, -Math.sin(a0) * R * 0.55], [R * 0.2, Math.cos(a0) * R * 0.95, -Math.sin(a0) * R * 0.95], [R * 0.13, Math.cos(a0 - 0.15) * R * 1.03, -Math.sin(a0 - 0.15) * R * 1.03]], R * 0.025, { isect: false });
      });
      co(M, 'ROTARY DIAL', 1, add(c, mul(n, R * 0.15)), 2.6);
      co(M, 'FINGER STOP', 1, add(c, add(mul(n, R * 0.2), [0, R * 0.6, -R * 0.3])), 0.9);
    });
    // cradle and handset on top
    const xc = xb + D * 0.4, zt = H;
    let hEnd;
    M.part('CRADLE', () => {
      for (const s of [1, -1]) {
        M.box([xc - D * 0.07, s * B * 0.31 - B * 0.05, zt - 0.02], [xc + D * 0.07, s * B * 0.31 + B * 0.05, zt + H * 0.12], { chamfer: B * 0.02 });
      }
      M.box([xc - D * 0.03, -B * 0.06, zt - 0.02], [xc + D * 0.03, B * 0.06, zt + H * 0.06]);
      co(M, 'CRADLE PRONG', 2, [xc, vw.sy * B * 0.31, zt + H * 0.12], 1.2);
    });
    M.part('HANDSET', () => {
      const zc = zt + H * 0.16, rh = B * 0.055, y0 = B * 0.46;
      const pts = [[xc, -y0, zc + rh], [xc, -y0 * 0.7, zc + rh * 2.6], [xc, y0 * 0.7, zc + rh * 2.6], [xc, y0, zc + rh]];
      const Hs = M.pipe(pts, rh, { smoothBends: true });
      void Hs;
      for (const s of [1, -1]) {
        M.at(xc, s * y0, zc + rh * 0.4, () => {
          const C = M.lathe([[rh * 0.9, rh * 1.2], [rh * 2.1, -rh * 0.4], [rh * 2.3, -rh * 0.8], [0, -rh * 0.8]], {});
          if (M.decorOn) C.lat.shade({ gap: 1.6, gapMax: 4 });
          if (C.bottom && C.bottom.ok) C.bottom.circle(0, 0, rh, { w: 1 });
        });
      }
      hEnd = [xc, y0, zc - rh * 0.4];
      co(M, 'HANDSET', 1, [xc, 0, zc + rh * 3.6], 2.4);
      co(M, 'EARPIECE', 1, [xc, -vw.sy * y0, zc + rh * 2], 0.9);
      co(M, 'MOUTHPIECE', 1, [xc, vw.sy * y0, zc + rh * 2], 0.9);
    });
    // coiled cord from the handset down to the back of the body
    M.part('COILED CORD', () => {
      const s = vw.sy;
      const a = [xc - D * 0.02, s * B * 0.5, H * 1.05], b = [xb - D * 0.03, s * B * 0.38, H * 0.18];
      void hEnd;
      const mid = [xb - D * 0.12, s * B * 0.62, H * 0.45];
      const turns = 26, rr = B * 0.035, pts = [];
      const N = turns * 10;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const p = add(add(mul(a, (1 - t) * (1 - t)), mul(mid, 2 * t * (1 - t))), mul(b, t * t));
        const dt = norm(add(mul(sub(mid, a), 2 * (1 - t)), mul(sub(b, mid), 2 * t)));
        const u1 = norm(cross(dt, [0, 0, 1])), u2 = cross(dt, u1);
        const ang = t * turns * 2 * Math.PI;
        pts.push(add(p, add(mul(u1, Math.cos(ang) * rr), mul(u2, Math.sin(ang) * rr))));
      }
      M.line(pts, { w: 1, pass: 2 });
      M.at(b[0], b[1], b[2], () => M.ry(-90, () => M.cyl(B * 0.03, 0, D * 0.04)));
      co(M, 'COILED CORD', 1, mid, 1.6);
    });
    M.part('HEADLAMP', () => {
      for (const s of [1, -1]) lamp(M, [xf + 0.02, s * B * 0.38, H * 0.08], [1, 0, 0.05], Math.max(0.07, D * 0.025));
      co(M, 'HEADLAMP', 2, [xf, vw.sy * B * 0.38, H * 0.08], 1.0);
    });
    M.part('ACCESS LADDER', () => {
      M.at(xb - 0.12, -vw.sy * B * 0.2, H * 0.05, () => K.ladder(M, { h: H * 0.95, w: 0.45, gap: 0.3 }));
      co(M, 'ACCESS LADDER', 1, [xb - 0.12, -vw.sy * B * 0.2, H * 0.5], 1.0);
    });
  });
  const gi = g.build();
  const place = M.pick(g.places);
  const klass = pickKlass(M, [`${place} ROTARY TELEPHONE ${g.form}`, `${g.adj} TELEPHONE`, `TELEPHONE ${g.form}`, `${g.adj} ROTARY TELEPHONE`]);
  const briefs = [`Carries the exchange to ${word(crew + 3)} farms that have no line.`, `${cap(g.goes)} and connects up to 10 calls at a time.`, `Takes ${word(crew)} operators to the flood and keeps the valley on the line.`, `Brings one telephone to each village for a week at a time.`];
  return {
    klass, family: g.family, float: g.float,
    brief: fit(M.pick(briefs)),
    specs: [['DIAL', '10 HOLES'], ...gi.specs, ['CREW', String(crew)], ['LINES', String(M.ri(4, 12))]].slice(0, 4),
    figure: gi.figure,
  };
};

// view from the +y side (the open side of a sewing machine, the crank of a gramophone)
function viewY(M, a0, a1, el0, el1) {
  const az = M.r(a0, a1), el = M.r(el0, el1), back = M.chance(0.3);
  M.setView(back ? 180 - az : az, el);
  if (M.view.e[1] < 0) M.setView(back ? -(180 - az) : -az, el);
  return { sy: 1, sx: M.view.e[0] >= 0 ? 1 : -1 };
}

// ---------------------------------------------------------------- sewing machine
BUILD.sewing = (M) => {
  const L = M.wpick([[2, M.r(3.5, 5)], [2, M.r(5.5, 7.5)], [1, M.r(8, 10)]]);
  const vw = viewY(M, 50, 66, 24, 32);
  const unit = String(M.ri(1, 99)).padStart(2, '0');
  const bW = L * 0.46, bT = L * 0.07, yc = -L * 0.1, aw = L * 0.075;
  const Hh = L * 0.52;
  const g = G.plan(M, { len: L * 1.02, wid: bW, hgt: Hh * 1.2, mass: L * bW * Hh * 0.2, kinds: { wheels: 2, tracks: 1.5, legs: 1.5, rails: 1.5, skis: 1, hover: 1, floats: 1.2, paddles: 1, rotors: 0.8, balloons: 0.8, wings: 0.5, sails: 0.6 } });
  const seats = L < 5 ? 1 : L < 8 ? 2 : 4;
  M.at(0, 0, g.z, () => {
    // bed plate: the deck
    M.part('BED PLATE', () => {
      const Bd = M.box([-L / 2, -bW / 2, 0], [L / 2, bW / 2, bT], { chamfer: L * 0.03 });
      const t = Bd.f('+z');
      if (t.on) {
        // needle plate and slide plate
        const q = fxy(t, M.W([L * 0.32, yc, bT]));
        t.rect(q[0] - L * 0.05, q[1] - L * 0.05, q[0] + L * 0.05, q[1] + L * 0.05, { w: 1 });
        for (let i = -1; i <= 1; i++) t.rect(q[0] - L * 0.03, q[1] + i * L * 0.012 - L * 0.003, q[0] + L * 0.03, q[1] + i * L * 0.012 + L * 0.003, { w: 0 });
        const q2 = fxy(t, M.W([L * 0.32, yc + L * 0.11, bT]));
        t.rect(q2[0] - L * 0.06, q2[1] - L * 0.05, q2[0] + L * 0.06, q2[1] + L * 0.05, { w: 1 });
        t.circle(q2[0] + L * 0.04, q2[1], L * 0.006, { w: 1 });
        // deck plates
        const a = fxy(t, M.W([-L * 0.45, bW * 0.42, bT])), b = fxy(t, M.W([L * 0.2, yc + aw + L * 0.02, bT]));
        plates(t, 4, 2, 'plain', { rect: [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])] });
      }
      for (const k of ['+y', '-y', '+x', '-x', 'c0', 'c1', 'c2', 'c3']) { const f = Bd.f(k); if (f.on) { f.rivets(-f.w / 2 + f.mOf(4), 0, f.w / 2 - f.mOf(4), 0, { pitch: 8 }); if (f.tone > 0.3) f.hatch(f.poly, { angle: 0, gap: 3 - f.tone, w: 0 }); } }
      const fs = Bd.f('+y');
      if (fs.on) K.stencil(fs, unit, -fs.w * 0.3, 0, fs.h * 0.5);
      M.info.mass = Bd.bbox.slice();
      co(M, 'BED PLATE', 1, [-L * 0.2, bW / 2, bT * 0.5], 1.8);
      co(M, 'NEEDLE PLATE', 1, [L * 0.32, yc, bT], 1.3);
      K.railing(M, [[-L * 0.44, bW / 2 - 0.1, bT], [L * 0.44, bW / 2 - 0.1, bT]], { h: 0.8, posts: 1.5, r: 0.025 });
    });
    // the arm: pillar, arm and head in one casting
    let A;
    M.part('ARM', () => {
      const p0 = [[-0.44, 0.07], [-0.41, 0.45], [-0.36, 0.52], [0.34, 0.52], [0.41, 0.48], [0.41, 0.21], [0.25, 0.21], [0.255, 0.38], [0.2, 0.41], [-0.17, 0.41], [-0.23, 0.36], [-0.24, 0.07]].map(([x, z]) => [x * L, z * L]);
      const p = fillet(p0, [0, L * 0.05, L * 0.04, L * 0.03, L * 0.03, L * 0.01, L * 0.01, L * 0.03, L * 0.04, L * 0.05, L * 0.04, 0], 4);
      A = M.extrude(p, yc - aw, yc + aw, { plane: 'xz', smoothDeg: 30 });
      const f = A.f('+y');
      if (f.on) {
        // the cab: windows in the arm, portholes in the pillar, a door in the head
        const n = 4;
        for (let i = 0; i < n; i++) {
          const x = -L * 0.14 + L * 0.34 * (i + 0.5) / n;
          const q = fxy(f, M.W([x, yc + aw, L * 0.465]));
          const ww = L * 0.34 / n * 0.72, wh = L * 0.065;
          K.xWindow(f, [q[0] - ww / 2, q[1] - wh / 2, q[0] + ww / 2, q[1] + wh / 2], { flip: i % 2 === 1 });
        }
        for (const z of [0.16, 0.26]) { const q = fxy(f, M.W([-L * 0.33, yc + aw, L * z])); K.porthole(f, q[0], q[1], L * 0.03); }
        const qd = fxy(f, M.W([L * 0.33, yc + aw, L * 0.34]));
        K.accessHatch(f, [qd[0] - L * 0.04, qd[1] - L * 0.08, qd[0] + L * 0.04, qd[1] + L * 0.08]);
        // decal: scroll lines along the arm
        const a = fxy(f, M.W([-L * 0.3, yc + aw, L * 0.425])), b = fxy(f, M.W([L * 0.2, yc + aw, L * 0.425]));
        f.line(a[0], a[1], b[0], b[1], { w: 1 });
        f.rivets(a[0], a[1] - f.mOf(4), b[0], b[1] - f.mOf(4), { pitch: 7 });
        const qn = fxy(f, M.W([-L * 0.33, yc + aw, L * 0.37]));
        f.text(unit, qn[0], qn[1], L * 0.035, { w: 1, pass: 4 });
      }
      
      co(M, 'ARM', 1, [0, yc + aw, L * 0.47], 2.0);
      co(M, 'CAB WINDOW', 4, [L * 0.05, yc + aw, L * 0.465], 1.4);
      co(M, 'PILLAR', 1, [-L * 0.33, yc + aw, L * 0.2], 1.2);
    });
    // needle bar, presser bar, needle, foot
    M.part('NEEDLE BAR', () => {
      const x = L * 0.33;
      M.tube([x, yc + aw * 0.3, L * 0.21], [x, yc + aw * 0.3, L * 0.115], L * 0.009, {});
      M.at(x, yc + aw * 0.3, L * 0.13, () => M.boxc([0, 0, 0], [L * 0.025, L * 0.02, L * 0.02], { isect: false }));
      M.tube([x, yc + aw * 0.3, L * 0.115], [x, yc + aw * 0.3, bT + L * 0.012], L * 0.003, { isect: false });
      M.tube([x - L * 0.03, yc - aw * 0.2, L * 0.21], [x - L * 0.03, yc - aw * 0.2, bT + L * 0.02], L * 0.008, {});
      M.box([x - L * 0.06, yc - aw * 0.6, bT], [x + L * 0.02, yc + aw * 0.5, bT + L * 0.012], { isect: false });
      co(M, 'NEEDLE BAR', 1, [x, yc + aw * 0.3, L * 0.16], 1.9);
      co(M, 'PRESSER FOOT', 1, [x - L * 0.02, yc + aw * 0.5, bT + L * 0.01], 1.1);
    });
    // handwheel at the pillar end
    M.part('HANDWHEEL', () => {
      const x = -L * 0.42, z = L * 0.4, R = L * 0.12, w = L * 0.035;
      M.at(x, yc, z, () => {
        M.ry(-90, () => {
          const Rim = M.lathe([[R * 0.8, 0], [R, 0], [R, w], [R * 0.8, w]], { loop: true });
          M.cyl(R * 0.2, -w * 0.2, w * 1.6);
          for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; M.tube([Math.cos(a) * R * 0.18, Math.sin(a) * R * 0.18, w * 0.5], [Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82, w * 0.5], R * 0.05, { isect: false }); }
          if (M.decorOn) for (let i = 0; i < 40; i++) Rim.lat.meridian(i * 9, 0.2, 0.3, { w: 0 });
        });
      });
      co(M, 'HANDWHEEL', 1, [x - w, yc + R * 0.7, z], 2.0);
      // bobbin winder
      M.at(-L * 0.36, yc + aw * 0.4, L * 0.52, () => { M.cyl(L * 0.02, 0, L * 0.02); M.at(0, 0, L * 0.03, () => M.cyl(L * 0.012, -L * 0.012, L * 0.012, { axis: 'x' })); });
    });
    // spool pin with its spool, thread over the guides to the needle
    M.part('THREAD SPOOL', () => {
      const x = -L * 0.08, z = L * 0.52;
      M.at(x, yc, z, () => {
        M.cyl(L * 0.004, 0, L * 0.1, { isect: false });
        const S = M.lathe([[L * 0.03, 0], [L * 0.03, L * 0.008], [L * 0.022, L * 0.012], [L * 0.022, L * 0.068], [L * 0.03, L * 0.072], [L * 0.03, L * 0.08], [0, L * 0.08]], { sharpDeg: 20 });
        if (M.decorOn) { for (let i = 0; i < 12; i++) S.lat.ring(0.3 + i * 0.03, { w: 0 }); S.lat.shade({ gap: 1.3, gapMax: 3 }); }
      });
      const t0 = [x, yc + L * 0.022, z + L * 0.05], gd = [L * 0.3, yc + aw * 0.6, z + L * 0.012], tn = [L * 0.4, yc + aw * 0.7, L * 0.4], nd = [L * 0.33, yc + aw * 0.4, L * 0.13];
      M.at(gd[0], gd[1], z, () => M.cyl(L * 0.006, 0, L * 0.014));
      M.at(tn[0], tn[1], tn[2], () => M.cyl(L * 0.018, -L * 0.004, L * 0.004, { axis: 'x' }));
      M.line([t0, gd, tn, [tn[0] - L * 0.02, tn[1], L * 0.25], nd], { w: 1 });
      co(M, 'THREAD SPOOL', 1, [x, yc, z + L * 0.06], 1.6);
      co(M, 'THREAD TENSION', 1, tn, 0.9);
    });
    // the operator's seats on the bed, a lamp under the head, headlamps, a ladder
    M.part('OPERATOR SEAT', () => {
      for (let i = 0; i < seats; i++) {
        const x = L * 0.12 - i * 0.85, y = bW * 0.26;
        M.at(x, y, bT + 0.32, () => M.rz(-90, () => seatUnit(M, { w: 0.5, d: 0.45, h: 0.5, pedestal: 0.27 })));
      }
      co(M, 'OPERATOR SEAT', seats, [L * 0.12, bW * 0.26, bT + 0.5], 1.2);
    });
    M.part('HEADLAMP', () => {
      for (const s of [1, -1]) lamp(M, [L / 2 + 0.02, s * bW * 0.36, bT * 0.5], [1, 0, 0], Math.max(0.06, L * 0.016));
      lamp(M, [L * 0.4, yc, L * 0.24], [0.3, 0, -1], L * 0.02);
      co(M, 'HEADLAMP', 2, [L / 2, bW * 0.36, bT * 0.5], 1.0);
    });
    M.part('ACCESS LADDER', () => {
      M.at(-L * 0.28, yc - aw - 0.15, bT, () => M.rz(180, () => K.ladder(M, { h: L * 0.45 + 0.9, w: 0.45, gap: 0.3 })));
      co(M, 'ACCESS LADDER', 1, [-L * 0.28, yc - aw - 0.15, L * 0.3], 0.9);
    });
  });
  const gi = g.build();
  const place = M.pick(g.places);
  const klass = pickKlass(M, [`${place} SEWING MACHINE ${g.form}`, `${g.adj} SEWING MACHINE`, `SEWING MACHINE ${g.form}`]);
  const briefs = [`Sews the sails of the harbor fleet with ${word(seats)} operators aboard.`, `${cap(g.goes)} and hems 4 kilometers of bunting a day.`, `Mends the circus tent wherever the circus is this week.`, `Stitches flood sandbags at 300 a minute.`];
  return {
    klass, family: g.family, float: g.float,
    brief: fit(M.pick(briefs)),
    specs: [['STITCH', `${(L * 0.6).toFixed(1)} MM`], ...gi.specs, ['CREW', String(seats)], ['SPEED', '300 SPM']].slice(0, 4),
    figure: gi.figure,
  };
};

// ---------------------------------------------------------------- gramophone
BUILD.gramophone = (M) => {
  const C = M.wpick([[2, M.r(2.4, 3.4)], [2, M.r(3.6, 5)], [1, M.r(5.5, 7)]]);
  const vw = viewY(M, 38, 52, 24, 32);
  const unit = String(M.ri(1, 99)).padStart(2, '0');
  const Hc = C * M.r(0.55, 0.65);
  const hornK = M.r(1.0, 1.25);
  const g = G.plan(M, { len: C * (1.2 + 0.6 * hornK), wid: C * Math.max(1.3, 1.35 * hornK + 0.2), hgt: Hc + C * (1.05 + 1.12 * hornK), mass: C * C * Hc * 0.25, kinds: { wheels: 2, tracks: 1.5, legs: 1.2, rails: 1, skis: 1, floats: 1.2, paddles: 1.2, balloons: 1, rotors: 0.8, hover: 0.8, sails: 0.6 } });
  const crew = C < 3.5 ? 2 : C < 5 ? 3 : 5;
  M.at(0, 0, g.z, () => {
    const x0 = -C * (0.1 + 0.25 * hornK);
    M.part('CABINET', () => {
      M.box([x0 - C / 2 - C * 0.03, -C / 2 - C * 0.03, 0], [x0 + C / 2 + C * 0.03, C / 2 + C * 0.03, Hc * 0.08]);
      const B = M.box([x0 - C / 2, -C / 2, Hc * 0.08], [x0 + C / 2, C / 2, Hc * 0.94]);
      M.box([x0 - C / 2 - C * 0.02, -C / 2 - C * 0.02, Hc * 0.94], [x0 + C / 2 + C * 0.02, C / 2 + C * 0.02, Hc]);
      for (const sx of [1, -1]) for (const sy of [1, -1]) M.box([x0 + sx * C / 2 - C * 0.03, sy * C / 2 - C * 0.03, Hc * 0.08], [x0 + sx * C / 2 + C * 0.03, sy * C / 2 + C * 0.03, Hc * 0.94], { isect: false });
      for (const k of ['+x', '-x', '+y', '-y']) {
        const f = B.f(k);
        if (!f.on) continue;
        const r = [-f.w / 2 + f.mOf(8), -f.h / 2 + f.mOf(8), f.w / 2 - f.mOf(8), f.h / 2 - f.mOf(8)];
        K.frame(f, r, { inset: 3 });
        const r2 = [r[0] + f.mOf(6), r[1] + f.mOf(6), r[2] - f.mOf(6), r[3] - f.mOf(6)];
        if (k === '+x') { K.louver(f, [r2[0], r2[1], r2[2], (r2[1] + r2[3]) / 2]); K.stencil(f, unit, 0, f.h * 0.22, f.h * 0.16); }
        else if (k === '+y' || k === '-y') { const n = 3; for (let i = 0; i < n; i++) K.porthole(f, r2[0] + (r2[2] - r2[0]) * (i + 0.5) / n, f.h * 0.12, f.h * 0.12); K.accessHatch(f, [r2[0] + (r2[2] - r2[0]) * 0.36, r2[1], r2[0] + (r2[2] - r2[0]) * 0.64, -f.h * 0.08]); }
        if (f.tone > 0.3) f.hatch(r2, { angle: 90, gap: 3.4 - f.tone * 1.4, w: 0 });
      }
      M.info.mass = B.bbox.slice();
      co(M, 'CABINET', 1, [x0, C / 2, Hc * 0.6], 1.8);
      co(M, 'PORTHOLE', 6, [x0 - C * 0.33, C / 2, Hc * 0.62], 1.2);
    });
    // turntable and record
    M.part('TURNTABLE', () => {
      M.at(x0, 0, Hc, () => {
        M.cyl(C * 0.43, 0, C * 0.025);
        const R = M.cyl(C * 0.41, C * 0.025, C * 0.035, { isect: false });
        M.cyl(C * 0.012, C * 0.035, C * 0.07, { isect: false });
        if (R.top.ok) {
          const f = R.top;
          for (let i = 0; i < 14; i++) f.circle(0, 0, C * (0.16 + i * 0.017), { w: 0 });
          f.circle(0, 0, C * 0.14, { w: 1 });
          f.text(unit, 0, C * 0.06, C * 0.035, { w: 1, pass: 4 });
          f.text('78', 0, -C * 0.06, C * 0.03, { w: 1, pass: 4 });
        }
      });
      co(M, 'RECORD', 1, [x0 + C * 0.25, 0, Hc + C * 0.035], 2.0);
      co(M, 'TURNTABLE', 1, [x0 + C * 0.42, 0, Hc + C * 0.015], 1.0);
    });
    // crank on the seen side
    M.part('WINDING CRANK', () => {
      const y = C / 2;
      const a = [x0 + C * 0.1, y, Hc * 0.55];
      M.pipe([a, add(a, [0, C * 0.12, 0]), add(a, [C * 0.14, C * 0.12, -C * 0.08]), add(a, [C * 0.14, C * 0.22, -C * 0.08])], C * 0.018, { isect: false });
      M.at(a[0] + C * 0.14, a[1] + C * 0.25, a[2] - C * 0.08, () => M.capsule(C * 0.03, -C * 0.03, C * 0.08, {}));
      M.at(a[0], a[1], a[2], () => M.cyl(C * 0.05, 0, C * 0.03, { axis: 'y' }));
      co(M, 'WINDING CRANK', 1, add(a, [C * 0.07, C * 0.12, -C * 0.04]), 1.8);
    });
    // tone arm, neck and horn
    const base = [x0 - C * 0.36, -C * 0.34, Hc];
    let throat, dir;
    M.part('TONE ARM', () => {
      M.at(base[0], base[1], base[2], () => { M.cyl(C * 0.06, 0, C * 0.05); M.cyl(C * 0.035, C * 0.05, C * 0.12); });
      const top = add(base, [0, 0, C * 0.12]);
      const sb = [x0 + C * 0.12, C * 0.08, Hc + C * 0.1];
      M.pipe([top, add(top, [C * 0.06, C * 0.05, C * 0.02]), sb], C * 0.025, { smoothBends: true });
      M.at(sb[0], sb[1], sb[2], () => { M.cyl(C * 0.05, -C * 0.012, C * 0.012, { axis: 'x' }); M.tube([0, 0, -C * 0.03], [0, 0, -C * 0.06], C * 0.004, { isect: false }); });
      co(M, 'TONE ARM', 1, lerp(top, sb, 0.5), 1.5);
      co(M, 'SOUND BOX', 1, sb, 1.2);
      // the neck: up from the tone arm base, bending forward into the horn
      const p1 = add(top, [-C * 0.05, 0, C * 0.25]);
      const p2 = add(top, [-C * 0.1, C * 0.05, C * 0.55]);
      const p3 = add(top, [C * 0.02, C * 0.1, C * 0.78]);
      throat = add(top, [C * 0.17, C * 0.14, C * 0.88]);
      dir = norm([1, 0.25, 0.55]);
      M.pipe([top, p1, p2, p3, throat], C * 0.045, { smoothBends: true });
      co(M, 'HORN NECK', 1, p2, 1.3);
    });
    M.part('HORN', () => {
      const Lh = C * hornK, R = C * 0.62 * hornK, r0 = C * 0.05;
      const prof = [];
      for (let i = 0; i <= 14; i++) { const t = i / 14; prof.push([r0 + (R - r0) * Math.pow(t, 3.2), Lh * t]); }
      prof.push([R * 1.04, Lh * 1.0]);
      M.along(throat, add(throat, dir), () => {
        const Hn = M.lathe(prof, { axis: 'x', open: true });
        if (M.decorOn) {
          const L2 = Hn.lat;
          for (let i = 0; i < 10; i++) L2.meridian(i * 36, 0.05, 0.98, { w: 1 });
          L2.ring(0.94, { w: 1 });
          L2.ring(0.5, { w: 0 });
          L2.shade({ gap: 1.8, gapMax: 4.5, t0: 0.05, t1: 0.93 });
        }
        M.lathe([[R * 1.04, Lh], [R * 1.06, Lh * 1.005]], { axis: 'x', open: true });
        // the petals and their seams seen inside the mouth
        const rin = (t) => (r0 + (R - r0) * Math.pow(t, 3.2)) * 0.985;
        for (let i = 0; i < 10; i++) {
          const a = (i * 36 + 18) * D2R, pts = [];
          for (let k = 0; k <= 16; k++) { const t = 0.2 + 0.8 * k / 16; pts.push([Lh * t, rin(t) * Math.sin(a), -rin(t) * Math.cos(a)]); }
          M.line(pts, { w: 1 });
        }
        for (const t of [0.55, 0.8]) { const pts = []; for (let k = 0; k <= 48; k++) { const a = k / 48 * 2 * Math.PI; pts.push([Lh * t, rin(t) * Math.sin(a), -rin(t) * Math.cos(a)]); } M.line(pts, { w: 0 }); }
        { const t = 0.35, pts = []; for (let k = 0; k <= 32; k++) { const a = k / 32 * 2 * Math.PI; pts.push([Lh * t, rin(t) * Math.sin(a), -rin(t) * Math.cos(a)]); } M.line(pts, { w: 1 }); }
      });
      co(M, 'HORN', 1, add(throat, mul(dir, Lh * 0.7)), 2.6);
      co(M, 'HORN PETAL', 10, add(throat, mul(dir, Lh * 0.4)), 0.8);
    });
    // a seat for the operator by the crank, headlamps, a ladder
    M.part('OPERATOR SEAT', () => {
      M.at(x0 - C * 0.2, C * 0.2, Hc + 0.06, () => M.rz(90, () => seatUnit(M, { w: 0.5, d: 0.45, h: 0.5, pedestal: 0.04 })));
      co(M, 'OPERATOR SEAT', 1, [x0 - C * 0.2, C * 0.2, Hc + 0.3], 0.9);
    });
    M.part('HEADLAMP', () => {
      for (const s of [1, -1]) lamp(M, [x0 + C / 2 + 0.03, s * C * 0.4, Hc * 0.2], [1, 0, 0], Math.max(0.06, C * 0.03));
      co(M, 'HEADLAMP', 2, [x0 + C / 2, C * 0.4, Hc * 0.2], 1.0);
    });
    M.part('ACCESS LADDER', () => {
      M.at(x0 - C / 2 - 0.15, C * 0.25, Hc * 0.08, () => M.rz(180, () => K.ladder(M, { h: Hc * 0.92 + 0.9, w: 0.45, gap: 0.3 })));
      co(M, 'ACCESS LADDER', 1, [x0 - C / 2 - 0.15, C * 0.25, Hc * 0.5], 0.9);
    });
  });
  const gi = g.build();
  const place = M.pick(g.places);
  const klass = pickKlass(M, [`${place} GRAMOPHONE ${g.form}`, `${g.adj} GRAMOPHONE`, `GRAMOPHONE ${g.form}`, `${g.adj} PHONOGRAPH`]);
  const briefs = [`Plays dance music to ${word(crew + 2)} villages a night at 78 turns a minute.`, `${cap(g.goes)} and plays the anthem at the county fair.`, `Takes ${word(crew)} operators and 300 records to the festival.`, `Announces the regatta results across 2 kilometers of water.`];
  return {
    klass, family: g.family, float: g.float,
    brief: fit(M.pick(briefs)),
    specs: [['SPEED', '78 RPM'], ...gi.specs, ['CREW', String(crew)], ['HORN', `${Math.round(C * 1240 * hornK)} MM`]].slice(0, 4),
    figure: gi.figure,
  };
};

// ---------------------------------------------------------------- toaster
BUILD.toaster = (M) => {
  const L = M.wpick([[2, M.r(3, 4.4)], [2, M.r(4.8, 6.5)], [1, M.r(7, 9)]]);
  const W = L * M.r(0.5, 0.58), H = L * M.r(0.55, 0.65);
  const vw = view(M, 0, 46, 60, 26, 34);
  const unit = String(M.ri(1, 99)).padStart(2, '0');
  const up = M.r(0.4, 0.55);
  const g = G.plan(M, { len: L, wid: W, hgt: H * (1 + up), mass: L * W * H * 0.15, kinds: { wheels: 2, tracks: 1.5, legs: 1.5, rails: 1.2, skis: 1, hover: 1, floats: 1, rotors: 1, balloons: 1, rockets: 0.6, wings: 0.5 } });
  const crew = L < 4.5 ? 1 : L < 7 ? 2 : 4;
  M.at(0, 0, g.z, () => {
    // body: a rounded section extruded along x
    const prof = [];
    const rt = W * 0.28, rb = W * 0.07;
    const arc = (cy, cz, r, a0, a1, n) => { for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D2R; prof.push([cy + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
    const z0 = H * 0.05;
    arc(W / 2 - rb, z0 + rb, rb, -90, 0, 3); arc(W / 2 - rt, H - rt, rt, 0, 90, 6); arc(-W / 2 + rt, H - rt, rt, 90, 180, 6); arc(-W / 2 + rb, z0 + rb, rb, 180, 270, 3);
    let B;
    const slotY = [W * 0.17, -W * 0.17], slotL = L * 0.72, slotW = W * 0.1;
    M.part('TOASTER BODY', () => {
      B = M.extrude(prof, -L / 2, L / 2, { plane: 'yz', smoothDeg: 40 });
      M.info.mass = B.bbox.slice();
      const cum = [0];
      for (let i = 1; i < prof.length; i++) cum.push(cum[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
      const tot = cum[cum.length - 1];
      const at = (a) => { const d = clamp(a, 0, 1) * tot; let k = 0; while (k + 2 < cum.length && cum[k + 1] < d) k++; const f = (d - cum[k]) / ((cum[k + 1] - cum[k]) || 1); return lerp(prof[k], prof[k + 1], clamp(f, 0, 1)); };
      const BS = new Surf(M, (t, a) => { const p = at(a); return [-L / 2 + L * t, p[0], p[1]]; }, { inside: (t) => [-L / 2 + L * t, 0, H * 0.5] });
      if (M.decorOn) {
        for (const t of [0.04, 0.96]) BS.runU(t, 0, 1, { w: 1, k: 80 });
        for (const t of [0.33, 0.66]) { BS.runU(t, 0, 1, { w: 1, k: 80 }); BS.rowU(t + 0.01, 0, 1, { pitch: 7, r: 0.75, k: 80 }); }
        BS.runS(0.08, 0, 1, { w: 1 });
        BS.shade({ gap: 2.3, s: [0, 1], u: [0, 1], k: 100 });
        // portholes along the seen side, a door
        const side = vw.sy;
        const u = side > 0 ? 0.16 : 0.84;
        for (const t of [0.18, 0.5, 0.82]) BS.port(t, u, H * 0.08);
        BS.text(unit, 0.34, side > 0 ? 0.07 : 0.93, H * 0.1);
        // the slots on top: dark openings
        for (const y of slotY) {
          const a = (side) => 0;
          void a;
        }
      }
      for (const k of ['+x', '-x']) {
        const f = B.f(k);
        if (!f.on) continue;
        K.frame(f, [-f.w * 0.42, -f.h * 0.42, f.w * 0.42, f.h * 0.3], { inset: 3 });
        if (k === '+x') { K.xWindow(f, [-f.w * 0.3, -f.h * 0.05, f.w * 0.3, f.h * 0.25]); }
        else { f.rect(-f.w * 0.04, -f.h * 0.38, f.w * 0.04, f.h * 0.2, { w: 1 }); f.circle(f.w * 0.25, -f.h * 0.15, f.h * 0.08, { w: 1 }); }
        if (f.tone > 0.3) f.hatch(f.poly, { angle: 90, gap: 3.4 - 1.4 * f.tone, w: 0 });
      }
      co(M, 'TOASTER BODY', 1, [0, vw.sy * W / 2, H * 0.4], 1.8);
      co(M, 'PORTHOLE', 6, [L * 0.0, vw.sy * W / 2, H * 0.3], 1.2);
      co(M, 'CAB WINDOW', 1, [L / 2, 0, H * 0.55], 1.6);
      // feet
      for (const sx of [1, -1]) for (const sy of [1, -1]) M.boxc([sx * L * 0.4, sy * W * 0.36, z0 / 2], [L * 0.08, W * 0.12, z0]);
    });
    // slot rims and the slices
    M.part('BREAD SLICE', () => {
      for (const y of slotY) {
        const rim = [[-slotL / 2, y - slotW / 2, H], [slotL / 2, y - slotW / 2, H], [slotL / 2, y + slotW / 2, H], [-slotL / 2, y + slotW / 2, H]].map((p) => [p[0], p[1], H - 0.005]);
        const R = M.plate(rim, { isect: false });
        const f = R.f('face');
        if (f.on) f.hatch(f.poly, { angle: 20, gap: 0.9, gap2: 2.4, w: 0 });
        // the slice: a bread outline in xz, thin along y
        const sw = slotL * 0.9, sh = H * up + H * 0.3, zb = H - H * 0.3;
        const out = [];
        out.push([-sw / 2, zb], [sw / 2, zb], [sw / 2, zb + sh * 0.72]);
        for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; const bump = 1 + 0.12 * Math.sin(a * 2) ** 2; out.push([sw / 2 * Math.cos(a) * (i === 0 || i === 12 ? 1 : 1.02 * bump), zb + sh * 0.72 + sh * 0.28 * Math.sin(a) * (0.9 + 0.1 * Math.cos(a * 2))]); }
        out.push([-sw / 2, zb + sh * 0.72]);
        const S = M.extrude(out.slice(0, -1), y - slotW * 0.3, y + slotW * 0.3, { plane: 'xz', smoothDeg: 25 });
        for (const k of ['+y', '-y']) {
          const fs = S.f(k);
          if (!fs.on) continue;
          // crust and crumb: an inset outline and holes
          const ins = fs.mOf(6);
          const poly = fs.poly;
          let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= poly.length; cy /= poly.length;
          fs.path(poly.map(([x, yy]) => [cx + (x - cx) * (1 - ins / (fs.w / 2)), cy + (yy - cy) * (1 - ins / (fs.h / 2))]), { closed: true, w: 1 });
          const n = Math.floor(fs.pxOf(fs.w) * fs.pxOf(fs.h) / 260);
          for (let i = 0; i < Math.min(n, 120); i++) {
            const hx = cx + (((i * 0.6180339) % 1) - 0.5) * fs.w * 0.8, hy = cy + (((i * 0.4142135) % 1) - 0.5) * fs.h * 0.8;
            if (!fs.contains(hx, hy) || hy < -fs.h / 2 + fs.h * 0.3) continue;
            fs.circle(hx, hy, fs.mOf(0.8 + (i % 3) * 0.5), { w: 0, n: 6 });
          }
          if (fs.tone > 0.25) fs.hatch(poly, { angle: 45, gap: 3.4 - fs.tone * 1.2, w: 0 });
        }
      }
      co(M, 'BREAD SLICE', 2, [0, slotY[vw.sy > 0 ? 0 : 1] + slotW * 0.3 * vw.sy, H + H * up * 0.6], 2.6);
      co(M, 'TOAST SLOT', 2, [slotL * 0.45, slotY[0], H], 1.2);
    });
    // lever and browning dial on the back end
    M.part('LEVER', () => {
      M.boxc([-L / 2 - L * 0.03, 0, H * 0.62], [L * 0.06, W * 0.18, H * 0.06]);
      M.at(-L / 2 - 0.01, W * 0.25, H * 0.35, () => M.cyl(W * 0.07, 0, L * 0.03, { axis: 'x' }));
      M.ry(0, () => M.cyl(W * 0.07, 0, 0.01, { isect: false }));
      co(M, 'LEVER', 1, [-L / 2 - L * 0.05, 0, H * 0.62], 1.4);
      co(M, 'BROWNING DIAL', 1, [-L / 2 - L * 0.03, W * 0.25, H * 0.35], 1.0);
    });
    M.part('HEADLAMP', () => {
      for (const s of [1, -1]) lamp(M, [L / 2 + 0.02, s * W * 0.3, H * 0.15], [1, 0, 0], Math.max(0.07, L * 0.02));
      co(M, 'HEADLAMP', 2, [L / 2, vw.sy * W * 0.3, H * 0.15], 1.0);
    });
    M.part('ACCESS LADDER', () => {
      M.at(-L * 0.25, vw.sy * (W / 2 + 0.2), 0, () => K.ladder(M, { h: H + 0.9, w: 0.45, gap: 0.3 }));
      co(M, 'ACCESS LADDER', 1, [-L * 0.25, vw.sy * (W / 2 + 0.2), H * 0.5], 1.0);
    });
    // a power cord to a plug
    M.part('POWER CABLE', () => {
      const a = [-L / 2, -vw.sy * W * 0.3, H * 0.15];
      const pts = [a, add(a, [-L * 0.1, 0, -H * 0.05]), add(a, [-L * 0.16, -vw.sy * W * 0.2, -H * 0.1]), add(a, [-L * 0.12, -vw.sy * W * 0.45, -H * 0.12])];
      M.pipe(pts, L * 0.01, { isect: false, smoothBends: true });
      M.at(pts[3][0], pts[3][1], pts[3][2], () => M.boxc([0, 0, 0], [L * 0.05, L * 0.04, L * 0.03]));
    });
  });
  const gi = g.build();
  const place = M.pick(g.places);
  const klass = pickKlass(M, [`${place} TOASTER ${g.form}`, `${g.adj} TOASTER`, `TOASTER ${g.form}`, `${g.adj} POP-UP TOASTER`]);
  const briefs = [`Toasts 2 slices at a time for a camp of 400 and keeps them warm.`, `${cap(g.goes)} with two slices ready on arrival.`, `Serves breakfast to ${word(crew + 10)} lighthouse keepers along the coast.`, `Takes the morning toast to the mine at the start of each shift.`];
  return {
    klass, family: g.family, float: g.float,
    brief: fit(M.pick(briefs)),
    specs: [['SLICES', '2'], ...gi.specs, ['CREW', String(crew)], ['POWER', `${Math.round(L * 120)} KW`]].slice(0, 4),
    figure: gi.figure,
  };
};
