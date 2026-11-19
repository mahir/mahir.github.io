// classes/instrument.js: musical instruments at vehicle scale, on running gear from gear.js.
// Pool: cello or double bass (lying on its back or standing on its end pin), tuba, accordion
// (the bellows are the articulation between two halves), bass drum or a drum kit, concert
// harp. Each is built as a machine: plate seams, rivet rows, hatches, a number, lamps,
// ladders, a cab or a driver's seat.

import * as F from './parts-furn.js';
import { inset } from './parts-ground.js';
import { word } from '../words.js';
import { D2R } from '../geom.js';

const { K, clamp } = F;
const sideOf = (M) => ({ sy: M.view.e[1] >= 0 ? 1 : -1, sx: M.view.e[0] >= 0 ? 1 : -1 });

// Catmull-Rom through points, nPer samples per span (end points included once)
function cr(pts, nPer = 6) {
  const out = [];
  const P = (i) => pts[clamp(i, 0, pts.length - 1)];
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let s = 0; s < nPer; s++) {
      const t = s / nPer, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}
function spiral(f, r, turns = 2.2) {
  if (!f.on || f.pxOf(r) < 3) return;
  const pts = [];
  const n = Math.ceil(turns * 24);
  for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * 2 * Math.PI, rr = r * (0.92 - 0.75 * t); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  f.path(pts, { w: 1 });
}

// ===================================================================== cello / double bass
function celloHalf(bass) {
  const lower = bass
    ? [[0, 0], [0.015, 0.13], [0.06, 0.22], [0.15, 0.29], [0.25, 0.305], [0.33, 0.285], [0.38, 0.255], [0.4, 0.258]]
    : [[0, 0], [0.015, 0.12], [0.06, 0.21], [0.15, 0.275], [0.25, 0.29], [0.33, 0.27], [0.375, 0.245], [0.395, 0.25]];
  const cb = bass ? [[0.4, 0.258], [0.43, 0.2], [0.5, 0.18], [0.57, 0.19], [0.6, 0.225]] : [[0.395, 0.25], [0.43, 0.19], [0.5, 0.163], [0.57, 0.18], [0.605, 0.228]];
  const upper = bass
    ? [[0.6, 0.225], [0.63, 0.21], [0.7, 0.215], [0.77, 0.205], [0.85, 0.165], [0.92, 0.11], [0.97, 0.07], [1, 0.04], [1, 0]]
    : [[0.605, 0.228], [0.63, 0.215], [0.7, 0.228], [0.78, 0.232], [0.86, 0.21], [0.93, 0.16], [0.975, 0.1], [1, 0.03], [1, 0]];
  const a = cr(lower, 4), b = cr(cb, 4), c = cr(upper, 4);
  return [...a, ...b.slice(1), ...c.slice(1)];
}

const cello = {
  id: 'cello', aka: ['bass', 'doublebass'],
  plan(M) {
    let bass = M.chance(0.4);
    if (M.info.variant === 'bass' || M.info.variant === 'doublebass') bass = true;
    const stand = M.chance(0.38);
    const Lb = stand ? M.r(1.6, 3.6) : M.r(2.6, 6.5);
    const rh = (bass ? 0.18 : 0.16) * Lb;
    const sv = M.pick([1, -1]);
    const view = stand ? [180 + sv * M.r(28, 44), M.r(22, 30)] : [sv * M.r(36, 56) + (M.chance(0.3) ? 180 : 0), M.r(36, 40)];
    const des = F.desig(M), unit = String(M.ri(1, 40)).padStart(2, '0');
    const lamps = M.chance(0.8), hatch = M.chance(0.6), door = Lb > 3.4 && M.chance(0.7);
    const ep = (stand ? 0.42 : 0.3) * Lb;
    const lean = M.r(6, 14);
    const total = Lb * (bass ? 1.75 : 1.66) + ep;
    const crew = Math.max(1, Math.round(Lb / 1.6));
    return {
      len: stand ? rh * 1.9 + Lb * 0.25 : total, wid: Lb * 0.62, hgt: stand ? total * 0.98 : Lb * 0.38,
      mass: Lb * Lb * Lb * 0.06 + 0.2, view, bass, stand, Lb, rh, des, unit, lamps, hatch, door, ep, lean, crew,
    };
  },
  build(M, p) {
    const { Lb, rh, bass, stand } = p;
    const u = Lb;
    const arch = 0.035 * u, zt = rh + arch;
    const half = celloHalf(bass).map(([x, y]) => [x * u - u / 2, y * u]);
    const outline = [...half.map(([x, y]) => [x, -y]), ...half.slice(1, -1).reverse()];
    const out = {};
    const xn = u / 2 + (bass ? 0.42 : 0.36) * u, xb = -0.04 * u, xe = 0.09 * u;
    const zb = zt + 0.13 * u, zn = zt + 0.045 * u;
    const strZ = (x) => zn + (zb - zn) * (xn - x) / (xn - xb);
    const body = () => {
      let rib;
      M.part('RIBS', () => {
        rib = M.extrude(outline, 0, rh, { smoothDeg: 35 });
        F.planRivets(M, rib, outline, { rows: [rh * 0.12, rh * 0.88], seam: u * 0.16, z0: 0, z1: rh, shade: true });
        M.callout('RIBS', 1, [-0.25 * u, -0.29 * u, rh / 2], 1.6);
      });
      M.part('TOP PLATE', () => {
        const sc = outline.map(([x, y]) => [x * 0.94, y * 0.8, zt]);
        const T = M.loft(outline.map(([x, y]) => [x, y, rh]), sc, { smoothDeg: 50 });
        const f = T.f('b');
        if (f.on) {
          const L = (x, y) => F.fl(M, f, [x, y, zt]);
          f.path(inset(sc.map(([x, y]) => [x, y]), 0.012 * u).map(([x, y]) => L(x, y)), { closed: true, w: 0 });
          // f-holes
          for (const s of [1, -1]) {
            const c = [];
            for (let i = 0; i <= 16; i++) { const t = i / 16; c.push([(-0.12 + 0.2 * t) * u, s * (0.1 - 0.035 * t + 0.012 * Math.sin(t * Math.PI * 2)) * u]); }
            const w = 0.006 * u;
            const poly = [...c.map(([x, y]) => [x, y + w]), ...c.slice().reverse().map(([x, y]) => [x, y - w])].map(([x, y]) => L(x, y));
            f.path(poly, { closed: true, w: 1 });
            f.hatch(poly, { angle: 70, gap: 0.9, w: 0 });
            for (const q of [c[0], c[16]]) { const cc = L(q[0], q[1]); f.circle(cc[0], cc[1], 0.013 * u, { w: 1 }); }
            const m = L(-0.03 * u, s * 0.085 * u); f.line(m[0] - 0.012 * u, m[1], m[0] + 0.012 * u, m[1], { w: 1 });
          }
          K.stencil(f, p.unit, ...L(-0.3 * u, 0), 0.1 * u, { upright: true });
          K.stencil(f, p.des, ...L(-0.38 * u, -0.17 * u), 0.03 * u, { upright: true });
          if (p.hatch) { const h = L(0.33 * u, 0.1 * u); K.accessHatch(f, [h[0] - 0.05 * u, h[1] - 0.04 * u, h[0] + 0.05 * u, h[1] + 0.04 * u]); }
          f.rivets(...L(-0.42 * u, 0.12 * u), ...L(-0.42 * u, -0.12 * u), { pitch: 7 });
        }
        M.callout('F-HOLE', 2, [-0.02 * u, 0.085 * u, zt], 1.6);
        M.callout('ARCHED TOP PLATE', 1, [-0.22 * u, 0.14 * u, zt], 1.8);
      });
      M.part('BRIDGE', () => {
        const bw = 0.13 * u, bh = 0.13 * u - 0.008 * u;
        const pr = [[-bw / 2, 0], [-bw * 0.36, 0], [-bw * 0.3, bh * 0.2], [bw * 0.3, bh * 0.2], [bw * 0.36, 0], [bw / 2, 0], [bw * 0.42, bh * 0.6], [bw * 0.3, bh * 0.92], [0, bh], [-bw * 0.3, bh * 0.92], [-bw * 0.42, bh * 0.6]];
        const B = M.at(xb, 0, zt, () => M.extrude(pr, -0.006 * u, 0.006 * u, { plane: 'yz' }));
        for (const nm of ['+x', '-x']) { const f = B.f(nm); if (f.on) { f.circle(0, bh * 0.08, bw * 0.06, { w: 1 }); f.circle(-bw * 0.17, bh * 0.15, bw * 0.04, { w: 0 }); f.circle(bw * 0.17, bh * 0.15, bw * 0.04, { w: 0 }); } }
        M.callout('BRIDGE', 1, [xb, 0, zt + bh * 0.7], 2);
      });
      M.part('TAILPIECE', () => {
        const x0 = -u / 2 + 0.05 * u, x1 = -0.2 * u;
        const z0 = zt + 0.012 * u, z1 = zt + 0.05 * u, t = 0.012 * u;
        const A = [[x0, -0.02 * u, z0], [x0, 0.02 * u, z0], [x0, 0.02 * u, z0 + t], [x0, -0.02 * u, z0 + t]];
        const B = [[x1, -0.04 * u, z1], [x1, 0.04 * u, z1], [x1, 0.04 * u, z1 + t], [x1, -0.04 * u, z1 + t]];
        M.loft(A, B);
        for (let i = 0; i < 4; i++) M.at(x1 - 0.02 * u, (-0.027 + 0.018 * i) * u, z1 + t, () => M.cyl(0.004 * u, 0, 0.012 * u, { isect: false }));
        M.tube([-u / 2, 0, rh], [x0, 0, z0 + t * 0.5], 0.005 * u, { isect: false });
        M.callout('TAILPIECE', 1, [(x0 + x1) / 2, 0, z1 + t], 1.4);
      });
      M.part('FINGERBOARD', () => {
        const t = 0.018 * u;
        const zA = strZ(xn) - 0.006 * u, zB = strZ(xe) - 0.012 * u;
        const A = [[xn, -0.017 * u, zA - t], [xn, 0.017 * u, zA - t], [xn, 0.017 * u, zA], [xn, -0.017 * u, zA]];
        const B = [[xe, -0.03 * u, zB - t], [xe, 0.03 * u, zB - t], [xe, 0.03 * u, zB], [xe, -0.03 * u, zB]];
        const S = M.loft(A, B);
        const f = S.f('s2'); if (f.on) f.hatch(f.box, { angle: 0, gap: 3.6, w: 0 });
        // neck under it, from the body to the nut
        const zr = strZ(u / 2) - 0.012 * u - t;
        M.loft([[u / 2 - 0.02 * u, -0.035 * u, zt - 0.02 * u], [u / 2 - 0.02 * u, 0.035 * u, zt - 0.02 * u], [u / 2 - 0.02 * u, 0.035 * u, zr], [u / 2 - 0.02 * u, -0.035 * u, zr]],
          [[xn, -0.022 * u, zA - t - 0.035 * u], [xn, 0.022 * u, zA - t - 0.035 * u], [xn, 0.022 * u, zA - t], [xn, -0.022 * u, zA - t]], { smoothDeg: 60 });
        M.callout('FINGERBOARD', 1, [(xn + xe) / 2, 0, (zA + zB) / 2], 2);
      });
      M.part('PEGBOX AND SCROLL', () => {
        const z1 = zn - 0.012 * u, z0 = z1 - 0.06 * u, x1 = xn + 0.13 * u;
        const Pb = M.box([xn, -0.024 * u, z0], [x1, 0.024 * u, z1]);
        const tf = Pb.f('+z'); if (tf.on) { tf.rect(-tf.w / 2 + tf.mOf(2), -tf.h / 2 + tf.mOf(2), tf.w / 2 - tf.mOf(2), tf.h / 2 - tf.mOf(2), { w: 1 }); tf.hatch(tf.box, { angle: 30, gap: 1.2, w: 0 }); }
        for (let i = 0; i < 4; i++) {
          const x = xn + (0.025 + 0.027 * i) * u, s = i % 2 ? 1 : -1;
          M.at(x, 0, (z0 + z1) / 2, () => {
            M.cyl(0.006 * u, -0.06 * u, 0.06 * u, { axis: 'y', isect: false });
            M.boxc([0, s * 0.07 * u, 0], [0.025 * u, 0.012 * u, 0.03 * u], { isect: false });
          });
        }
        const Sc = M.at(x1 + 0.035 * u, 0, (z0 + z1) / 2 + 0.01 * u, () => M.cyl(0.04 * u, -0.026 * u, 0.026 * u, { axis: 'y' }));
        spiral(Sc.top, 0.04 * u); spiral(Sc.bottom, 0.04 * u);
        M.callout('SCROLL', 1, [x1 + 0.035 * u, 0.026 * u, (z0 + z1) / 2], 1.8);
        M.callout('TUNING PEG', 4, [xn + 0.05 * u, 0.07 * u, (z0 + z1) / 2], 1);
      });
      M.part('STRINGS', () => {
        for (let i = 0; i < 4; i++) {
          const y = (-0.027 + 0.018 * i) * u;
          M.line([[-0.22 * u, y, zt + 0.064 * u], [xb, y * 0.95, zb], [xn, y * 0.55, zn], [xn + 0.03 * u + 0.027 * u * i, 0, zn - 0.03 * u]], { w: 1, pass: 2 });
        }
        M.callout('STRINGS', 4, [xe + 0.1 * u, 0.01 * u, strZ(xe + 0.1 * u)], 1.5);
      });
      M.part('CAB', () => {
        const ch = strZ(xe) - 0.03 * u - zt - 0.01 * u, x0 = xe + 0.01 * u, x1 = u / 2 - 0.06 * u, w = 0.06 * u;
        const C = M.box([x0, -w, zt], [x1, w, zt + ch], { chamfer: 0.015 * u });
        for (const nm of ['+x', '+y', '-y', '-x']) {
          const f = C.f(nm);
          if (!f.on) continue;
          const m = f.mOf(2.5);
          const r = [-f.w / 2 + m, -f.h / 2 + f.h * 0.35, f.w / 2 - m, f.h / 2 - m];
          if (nm === '+x' || nm === '-x') K.xWindow(f, r); else { const g = f.grid(2, 1, { rect: r, gap: 3 }); for (const q of g) K.glass(f, [[q[0], q[1]], [q[2], q[1]], [q[2], q[3]], [q[0], q[3]]]); }
        }
        const tf = C.f('+z'); if (tf.on) tf.hatch(tf.box, { angle: 0, gap: 1.8, w: 0 });
        M.callout('CAB UNDER FINGERBOARD', 1, [(x0 + x1) / 2, w, zt + ch * 0.6], 2.6);
      });
      M.part('END PIN', () => {
        const a = [-u / 2, 0, rh * 0.5];
        const b = stand ? [-u / 2 - p.ep, 0, rh * 0.5] : [-u / 2 - p.ep, 0, rh * 0.5 - p.ep * 0.0];
        M.at(-u / 2, 0, rh * 0.5, () => M.cyl(0.02 * u, -0.025 * u, 0, { axis: 'x' }));
        K.strut(M, [a[0] - 0.02 * u, 0, a[2]], b, 0.009 * u, { collars: true });
        M.at(b[0], b[1], b[2], () => M.sphere(0.016 * u));
        M.callout('END PIN STRUT', 1, [(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2], 1.8);
      });
      if (p.lamps) M.part('HEADLAMP', () => {
        for (const s of [1, -1]) M.at(0.42 * u, s * 0.13 * u, rh * 0.6, () => M.rz(s * 25, () => K.lamp(M, { r: 0.022 * u })));
        M.callout('HEADLAMP', 2, [0.44 * u, 0.13 * u, rh * 0.6], 1.1);
      });
      if (p.door) M.part('SIDE DOOR', () => {
        // a door in the flat stretch of the ribs at the lower bout, on the side seen
        const sy = sideOf(M).sy;
        let best = null, bd = -1;
        for (let i = 0; i < outline.length; i++) { const f = rib.f('s' + i); if (f.ok && f.w > bd && Math.abs(outline[i][0]) > 0.15 * u && Math.sign(outline[i][1]) === sy) { bd = f.w; best = f; } }
        if (best && best.on) {
          const dh = rh * 0.8;
          K.door(M, best, 0, -best.h / 2 + dh / 2 + rh * 0.08, Math.min(best.w * 0.8, 0.8), dh, {});
        }
        M.callout('SIDE DOOR', 1, [-0.25 * u, sy * 0.29 * u, rh * 0.5], 1.2);
      });
    };
    if (stand) {
      // standing on the end pin, leaning back on two stays; the front faces -x
      const th = -90 + p.lean;
      const tip = [-u / 2 - p.ep, rh * 0.5];
      // world z and x of a local (x, z) under ry(th)
      const wz = (x, z) => -x * Math.sin(th * D2R) + z * Math.cos(th * D2R);
      const wx = (x, z) => x * Math.cos(th * D2R) + z * Math.sin(th * D2R);
      const lift = -wz(tip[0], tip[1]);
      const xs = -(wx(tip[0], tip[1]) + wx(xn + 0.2 * u, zt)) / 2;
      M.at(xs, 0, lift, () => M.ry(th, body));
      // stays from the frame to the back plate
      M.part('BACK STAY', () => {
        for (const sg of [1, -1]) {
          const lx = -0.15 * u, ly = sg * 0.18 * u;
          const top = [xs + wx(lx, 0), ly, lift + wz(lx, 0)];
          K.strut(M, [top[0] + top[2] * 0.45, ly * 1.3, 0], top, 0.012 * u, { collars: true });
          M.at(top[0] + top[2] * 0.45, ly * 1.3, 0, () => M.box([-0.03 * u, -0.03 * u, 0], [0.03 * u, 0.03 * u, 0.02 * u]));
        }
        M.callout('BACK STAY', 2, [xs + wx(-0.15 * u, 0) + 0.1 * u, 0.2 * u, lift + wz(-0.15 * u, 0) * 0.5], 1);
      });
      M.info.mass = null;
      out.fig = F.figSpot(M, u * 0.5 + 0.6);
    } else {
      const x0 = -u / 2 - p.ep, x1 = xn + 0.2 * u;
      const xs = -(x0 + x1) / 2;
      M.at(xs, 0, 0, () => {
        body();
        M.part('TAIL SKID', () => { M.at(-u / 2 - p.ep, 0, 0, () => M.box([-0.03 * u, -0.05 * u, 0], [0.03 * u, 0.05 * u, rh * 0.5 - 0.012 * u])); });
      });
      M.info.mass = [-u / 2 + xs, -0.3 * u, 0, u / 2 + xs, 0.3 * u, zt];
      out.fig = F.figSpot(M, u * 0.75 + 0.6);
    }
    return out;
  },
  vocab(M, p, g) {
    const nm = p.bass ? 'DOUBLE BASS' : 'CELLO';
    const klass = M.pick([`${g.adj} ${nm}`, `${nm} ${g.form}`, `${M.pick(['ORCHESTRA', 'QUARTET', 'TOURING', 'CONSERVATORY'])} ${nm} ${g.form}`].filter((s) => s.length <= 34));
    const brief = F.fit(M.pick([
      `Carries ${word(p.crew)} crew in the cab under the fingerboard to the next concert.`,
      `Takes an orchestra's ${p.bass ? 'double bass' : 'cello'} and ${word(p.crew)} crew to the festival.`,
      `${p.bass ? 'A double bass' : 'A cello'} that ${g.goes} with ${word(p.crew)} crew under its fingerboard.`,
    ]), `Carries ${word(p.crew)} crew under its fingerboard.`);
    return { klass, brief, specs: [['MASS', `${Math.max(1, Math.round(p.mass))} T`], ['CREW', String(p.crew)], ['STRINGS', '4']] };
  },
};

// ===================================================================== tuba
const tuba = {
  id: 'tuba', aka: [],
  plan(M) {
    const k = M.r(2.4, 6.5);
    const nv = M.pick([3, 4]);
    const sv = M.pick([1, -1]);
    const view = [180 - sv * M.r(32, 52), M.r(28, 36)];
    const des = F.desig(M), unit = String(M.ri(1, 40)).padStart(2, '0');
    const lamps = M.chance(0.7);
    return { len: 0.9 * k + 0.7, wid: 0.6 * k, hgt: 0.98 * k, mass: 0.12 * k * k * k, view, k, nv, des, unit, lamps };
  },
  build(M, p) {
    const { k } = p;
    const out = {};
    const xc = 0.18 * k;
    M.at(xc, 0, 0, () => {
      const zl = 0.002 * k;
      M.part('BELL', () => {
        const pr = [];
        for (let i = 0; i <= 14; i++) { const s = i / 14; pr.push([(0.072 + 0.185 * s ** 3.1) * k, (0.6 + 0.36 * s) * k]); }
        const inner = pr.slice(2).reverse().map(([r, z]) => [r - 0.008 * k, z]);
        const B = M.lathe([...pr, ...inner], { sharpDeg: 60 });
        if (B.top.on) B.top.hatch(B.top.box, { angle: 60, gap: 1.2, w: 0 });
        M.at(0, 0, 0.96 * k, () => M.torus(0.255 * k, 0.008 * k, { isect: false }));
        if (M.decorOn) {
          const L = B.lat;
          L.shade({ gap: 1.5, gapMax: 5 });
          for (const t of [0.1, 0.22, 0.34, 0.43, 0.6, 0.72, 0.84]) L.ring(t, { w: 1 });
          for (let i = 0; i < 12; i++) L.meridian(i * 30, 0.0, 0.92, { w: 1 });
          for (let i = 0; i < 48; i++) { L.port(i * 7.5, 0.465, 0.005 * k, { w: 1 }); L.port(i * 7.5 + 3.75, 0.39, 0.004 * k, { w: 1 }); }
          const ae = Math.atan2(M.view.e[1], M.view.e[0]) / D2R;
          L.hatch(ae + 120, ae + 240, 0.55, 0.9, { gap: 2.8 });
          const az = Math.atan2(M.view.e[1], M.view.e[0]) / D2R;
          L.text(p.unit, az, 0.36, 0.06 * k);
        }
        M.callout('EXHAUST BELL', 1, [0.25 * k, 0, 0.94 * k], 3);
      });
      M.part('BOTTOM BOW', () => {
        const S = F.sweep(M, [[0, 0, 0.62 * k], [0, 0, 0.18 * k], [0, 0, 0.11 * k], [-0.04 * k, 0, 0.055 * k], [-0.1 * k, 0, 0.046 * k + zl], [-0.165 * k, 0, 0.06 * k], [-0.2 * k, 0, 0.12 * k], [-0.205 * k, 0, 0.42 * k]],
          [0.072, 0.06, 0.056, 0.053, 0.05, 0.047, 0.044, 0.04].map((r) => r * k), { g: 4 });
        if (M.decorOn) { S.gs.shade({ gap: 1.4, gapMax: 4 }); for (const i of [0.5, 1, 2, 4, 6.5]) S.gs.lineJ(i, 0, S.gs.nJ, { w: 1 }); }
        M.callout('BOTTOM BOW', 1, [-0.1 * k, 0.045 * k, 0.05 * k], 2);
        // cradle pads under the bow
        for (const x of [-0.03, -0.17]) M.box([x * k - 0.03 * k, -0.05 * k, 0], [x * k + 0.03 * k, 0.05 * k, 0.03 * k]);
      });
      M.part('VALVE', () => {
        const vx = (i) => (-0.27 - 0.045 * i) * k, vy = 0.02 * k;
        for (let i = 0; i < p.nv; i++) {
          M.at(vx(i), vy, 0, () => {
            const V = M.cyl(0.022 * k, 0.37 * k, 0.53 * k);
            if (M.decorOn) { V.lat.ring(0.1, { w: 1 }); V.lat.ring(0.9, { w: 1 }); V.lat.shade({ gap: 1.4, gapMax: 3.5 }); }
            M.cyl(0.026 * k, 0.53 * k, 0.545 * k);
            M.cyl(0.005 * k, 0.545 * k, 0.59 * k, { isect: false });
            M.cyl(0.016 * k, 0.59 * k, 0.6 * k, { isect: false });
          });
          M.pipe([[vx(i), vy, 0.44 * k], [vx(i), -0.09 * k, 0.44 * k], [vx(i), -0.09 * k, 0.33 * k], [vx(i), vy, 0.33 * k], [vx(i), vy, 0.37 * k]], 0.009 * k, { isect: false });
        }
        M.pipe([[-0.205 * k, 0, 0.42 * k], [-0.205 * k, 0.01 * k, 0.47 * k], [vx(0) + 0.02 * k, vy, 0.47 * k]], 0.026 * k, { isect: false });
        M.callout('PISTON VALVE', p.nv, [vx(1), vy + 0.022 * k, 0.45 * k], 2.2);
        M.callout('VALVE SLIDE', p.nv, [vx(1), -0.09 * k, 0.39 * k], 1);
      });
      M.part('UPPER BOW', () => {
        const xl = (-0.27 - 0.045 * (p.nv - 1)) * k;
        const S = F.sweep(M, [[xl, 0.02 * k, 0.5 * k], [xl - 0.01 * k, 0.03 * k, 0.64 * k], [xl + 0.06 * k, 0.05 * k, 0.72 * k], [-0.12 * k, 0.055 * k, 0.72 * k], [-0.05 * k, 0.03 * k, 0.64 * k], [-0.03 * k, 0.0, 0.55 * k]],
          [0.022, 0.025, 0.028, 0.032, 0.036, 0.04].map((r) => r * k), { g: 5 });
        if (M.decorOn) S.gs.shade({ gap: 1.4, gapMax: 4 });
        for (const [sg, za, zb2, ext] of [[1, 0.46, 0.3, 0.17], [-1, 0.56, 0.38, 0.14]]) {
          const pts = [[0, sg * 0.05 * k, za * k]];
          for (let q = 0; q <= 8; q++) { const a = -Math.PI / 2 + Math.PI * q / 8; pts.push([0, sg * (ext - 0.04 + 0.04 * Math.cos(a)) * k, ((za + zb2) / 2 - (za - zb2) / 2 * Math.sin(a)) * k]); }
          pts.push([0, sg * 0.05 * k, zb2 * k]);
          M.pipe(pts, 0.02 * k, { isect: false });
        }
        M.tube([0, 0, 0.32 * k], [-0.205 * k, 0, 0.32 * k], 0.006 * k, { isect: false });
        M.tube([0, 0, 0.5 * k], [-0.205 * k, 0, 0.4 * k], 0.006 * k, { isect: false });
        M.callout('TUNING SLIDE', 1, [0, 0.17 * k, 0.38 * k], 1.2);
      });
      // leadpipe, mouthpiece, driver on a stand
      const mp = [-0.58 * k, 0.06 * k, 0.64 * k];
      M.part('LEADPIPE', () => {
        M.pipe([[-0.31 * k, 0.04 * k, 0.5 * k], [-0.36 * k, 0.06 * k, 0.56 * k], [-0.48 * k, 0.06 * k, 0.62 * k], mp], 0.01 * k, { isect: false });
        M.at(...mp, () => M.lathe([[0.01 * k, 0], [0.012 * k, -0.03 * k], [0.022 * k, -0.05 * k], [0.022 * k, -0.055 * k]], { axis: 'x', open: true, isect: false }));
        M.callout('MOUTHPIECE', 1, mp, 1.4);
      });
      M.part("DRIVER'S STAND", () => {
        const zs = Math.max(0.2, mp[2] - 0.72);
        const x = mp[0] - 0.05 * k - 0.35;
        const x0 = x - 0.35, x1 = x + 0.25, y0 = mp[1] - 0.35, y1 = mp[1] + 0.35;
        const Pl = M.box([x0, y0, zs - 0.06], [x1, y1, zs]);
        const tf = Pl.f('+z'); if (tf.on) { tf.hatch(tf.box, { angle: 0, gap: 2.4, w: 0 }); tf.hatch(tf.box, { angle: 90, gap: 2.4, w: 0 }); }
        for (const [a, b] of [[x0 + 0.03, y0 + 0.03], [x1 - 0.03, y0 + 0.03], [x1 - 0.03, y1 - 0.03], [x0 + 0.03, y1 - 0.03]]) M.tube([a, b, 0], [a, b, zs - 0.06], 0.03, {});
        const nb = Math.max(1, Math.round(zs / 0.9));
        for (let i = 0; i < nb; i++) {
          const za = zs * i / nb + 0.05, zb2 = zs * (i + 1) / nb - 0.08;
          for (const [a, b, c, d] of [[x0, y0, x1, y0], [x0, y1, x1, y1], [x0, y0, x0, y1], [x1, y0, x1, y1]]) M.tube([a, b, za], [c, d, zb2], 0.012, { isect: false, shade: false });
        }
        if (zs > 1.0) {
          K.railing(M, [[x0 + 0.02, y0 + 0.02, zs], [x0 + 0.02, y1 - 0.02, zs], [x1 - 0.02, y1 - 0.02, zs]], { h: 0.9 });
          M.at(x0 - 0.06, mp[1], 0, () => K.ladder(M, { h: zs + 0.9, w: 0.45 }));
          M.callout('ACCESS LADDER', 1, [x0 - 0.06, mp[1], zs * 0.5], 1.2);
        }
        M.at(x, mp[1], zs, () => F.driver(M, { arms: 'bar' }));
        M.callout("DRIVER'S STAND", 1, [x, mp[1] + 0.35, zs * 0.6], 1.4);
        M.callout('TUBIST', 1, [x, mp[1], zs + 0.8], 1);
      });
      if (p.lamps) M.part('HEADLAMP', () => {
        for (const s of [1, -1]) F.lampAt(M, [0.055 * k, s * 0.03 * k, 0.2 * k], s * 20, 0.025 * k);
        M.callout('HEADLAMP', 2, [0.06 * k, 0.03 * k, 0.2 * k], 1);
      });
      M.info.mass = [-0.45 * k + xc, -0.26 * k, 0, 0.26 * k + xc, 0.26 * k, 0.97 * k];
    });
    out.fig = F.figSpot(M, 0.6 * k + 0.6);
    return out;
  },
  vocab(M, p, g) {
    const klass = M.pick([`${g.adj} TUBA`, `TUBA ${g.form}`, `${M.pick(['BRASS BAND', 'PARADE', 'MILITARY BAND', 'COLLIERY BAND'])} TUBA ${g.form}`].filter((s) => s.length <= 34));
    const brief = F.fit(M.pick([
      `Leads the brass band at the head of the parade and exhausts through its bell.`,
      `Plays the bass line for 40 bandsmen and ${g.goes} to the bandstand.`,
      `Carries one tubist and plays a low B flat at 80 decibels.`,
    ]), 'Carries one tubist to the bandstand.');
    return { klass, brief, specs: [['MASS', `${Math.max(1, Math.round(p.mass))} T`], ['VALVES', String(p.nv)], ['BELL', `${Math.round(0.51 * p.k * 1000)} MM`]] };
  },
};

// ===================================================================== accordion
const accordion = {
  id: 'accordion', aka: [],
  plan(M) {
    const H = M.r(2.4, 4.4), D = H * M.r(0.42, 0.5), bt = H * M.r(0.24, 0.3);
    const Lbw = H * M.r(0.6, 1.2), fan = M.chance(0.65) ? M.r(0.25, 0.75) : 0;
    const nF = M.ri(9, 15);
    const sv = M.pick([1, -1]);
    const view = [sv * M.r(42, 58), M.r(24, 32)];
    const des = F.desig(M), unit = String(M.ri(1, 40)).padStart(2, '0');
    const nRow = M.ri(5, 6), nCol = M.ri(12, 18);
    const door = M.chance(0.7);
    const crew = Math.max(2, Math.round(H * 2));
    return { len: Lbw * (1 + fan * 0.6) + 2 * bt + 0.2, wid: D + 0.3, hgt: H + 0.1, mass: H * H * D * 0.8, view, H, D, bt, Lbw, fan, nF, des, unit, nRow, nCol, door, crew };
  },
  build(M, p) {
    const { H, D, bt, Lbw, fan } = p;
    const { sy } = sideOf(M);
    const out = {};
    // fan: sections lie in planes through an axis below the bottom
    const phi = fan > 0.02 ? Lbw * fan / H : 0;
    const R0 = phi ? H / fan : 0;
    const zLift = phi ? R0 * (1 - Math.cos(phi / 2)) : 0;
    const frame = (t, fn) => {
      if (!phi) return M.at(-Lbw / 2 + Lbw * t, 0, 0, fn);
      const th = phi * (t - 0.5);
      return M.at(0, 0, -R0 + zLift, () => M.ry(th / D2R, () => M.at(0, 0, R0, fn)));
    };
    M.part('BELLOWS', () => {
      const n = p.nF * 2;
      const dF = H * 0.055, ch = H * 0.05;
      const rows = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, dd = i % 2 ? dF : 0;
        const pts = [];
        frame(t, () => {
          const y0 = -D / 2 + dd, y1 = D / 2 - dd, z0 = dd + 0.02, z1 = H - dd - 0.02, c = ch;
          for (const [y, z] of [[y0 + c, z0], [y1 - c, z0], [y1, z0 + c], [y1, z1 - c], [y1 - c, z1], [y0 + c, z1], [y0, z1 - c], [y0, z0 + c]]) pts.push(M.W([0, y, z]));
        });
        rows.push(pts);
      }
      const S = M.world(() => F.gridSolid(M, rows, { caps: false, flat: true, solid: { isect: false } }));
      // corner guards: a rivet at each fold corner
      if (M.decorOn) for (let i = 0; i <= n; i += 2) for (let j = 0.5; j < 8; j += 2) S.gs.dot(i, j, 1.0);
      M.callout('PLEATED BELLOWS', 1, [0, sy * D / 2, H * 0.6], 3);
      M.callout('BELLOWS STRAP', 1, [0, 0, H], 0.5);
    });
    const boxFaces = (S, outer) => {
      for (const nm of ['+y', '-y']) {
        const f = S.f(nm);
        if (!f.on) continue;
        const m = f.mOf(3);
        f.rect(-f.w / 2 + m, -f.h / 2 + m, f.w / 2 - m, f.h / 2 - m, { w: 1 });
        f.rivets(-f.w / 2 + m * 1.6, -f.h / 2 + m * 1.6, f.w / 2 - m * 1.6, -f.h / 2 + m * 1.6, { pitch: 7 });
        f.rivets(-f.w / 2 + m * 1.6, f.h / 2 - m * 1.6, f.w / 2 - m * 1.6, f.h / 2 - m * 1.6, { pitch: 7 });
        void outer;
      }
    };
    // treble box: keyboard and grille on the side seen, windshield on the outer end
    M.part('TREBLE BOX', () => frame(1, () => {
      const T = M.box([0, -D / 2, 0], [bt, D / 2, H], { chamfer: 0.0 });
      boxFaces(T, 1);
      const f = T.f(sy > 0 ? '+y' : '-y');
      if (f.on) {
        // grille: fretwork slots in the upper part, the designation across it
        const L = (x, z) => F.fl(M, f, [x, sy * D / 2, z]);
        const a = L(bt * 0.42, H * 0.55), b = L(bt * 0.9, H * 0.93);
        const r = [Math.min(a[0], b[0]), a[1], Math.max(a[0], b[0]), b[1]];
        f.rect(r, { w: 1 });
        const nsl = 7;
        for (let i = 0; i < nsl; i++) { const y = r[1] + (r[3] - r[1]) * (i + 0.5) / nsl; f.rect(r[0] + (r[2] - r[0]) * 0.15, y - (r[3] - r[1]) * 0.02, r[2] - (r[2] - r[0]) * 0.15, y + (r[3] - r[1]) * 0.02, { w: 0 }); }
        const c = L(bt * 0.66, H * 0.4);
        K.stencil(f, p.unit, c[0], c[1], Math.min(bt * 0.32, H * 0.1), { angle: 0 });
      }
      // keyboard strip on the side seen, near the bellows
      const kw = bt * 0.32, kz0 = H * 0.08, kz1 = H * 0.92;
      const KB = M.box([0.02 * H, sy > 0 ? D / 2 : -D / 2 - 0.035 * H, kz0], [0.02 * H + kw, sy > 0 ? D / 2 + 0.035 * H : -D / 2, kz1]);
      const kf = KB.f(sy > 0 ? '+y' : '-y');
      const nW = 24;
      if (kf.on) for (let i = 1; i < nW; i++) { const z = kz0 + (kz1 - kz0) * i / nW; const q0 = F.fl(M, kf, [0.02 * H, sy * (D / 2 + 0.035 * H), z]), q1 = F.fl(M, kf, [0.02 * H + kw, sy * (D / 2 + 0.035 * H), z]); kf.line(q0[0], q0[1], q1[0], q1[1], { w: 0 }); }
      const blacks = [1, 2, 4, 5, 6];
      for (let i = 1; i < nW; i++) {
        if (!blacks.includes(i % 7)) continue;
        const z = kz0 + (kz1 - kz0) * i / nW;
        const y0 = sy * (D / 2 + 0.035 * H), y1 = sy * (D / 2 + 0.05 * H);
        M.box([0.02 * H + kw * 0.45, Math.min(y0, y1), z - (kz1 - kz0) / nW * 0.3], [0.02 * H + kw, Math.max(y0, y1), z + (kz1 - kz0) / nW * 0.3], { isect: false });
      }
      // windshield on the end
      const ef = T.f('+x');
      if (ef.on) {
        const g = ef.grid(2, 1, { rect: [-ef.w / 2 + ef.mOf(4), ef.h * 0.12, ef.w / 2 - ef.mOf(4), ef.h / 2 - ef.mOf(5)], gap: 4 });
        for (const r of g) K.xWindow(ef, r, { flip: r.i === 1 });
        F.seams(ef, [-ef.w / 2 + ef.mOf(3), -ef.h / 2 + ef.mOf(3), ef.w / 2 - ef.mOf(3), ef.h * 0.08], { n: 2, m: 2, shade: true });
      }
      // register switches on top
      for (let i = 0; i < 5; i++) M.box([bt * 0.2 + bt * 0.12 * i, -0.02 * H, H], [bt * 0.26 + bt * 0.12 * i, 0.02 * H, H + 0.025 * H], { isect: false });
      for (const s of [1, -1]) M.at(bt, s * D * 0.3, H * 0.12, () => K.lamp(M, { r: 0.035 * H }));
      M.callout('TREBLE KEYBOARD', 1, [0.02 * H + kw / 2, sy * (D / 2 + 0.04 * H), H * 0.5], 2.6);
      M.callout('WINDSHIELD', 1, [bt, 0, H * 0.75], 1.6);
      M.callout('REGISTER SWITCH', 5, [bt * 0.5, 0, H + 0.02 * H], 0.8);
      M.callout('HEADLAMP', 2, [bt + 0.035 * H, D * 0.3, H * 0.12], 1);
    }));
    M.part('BASS BOX', () => frame(0, () => {
      const B = M.box([-bt, -D / 2, 0], [0, D / 2, H]);
      boxFaces(B, -1);
      const f = B.f(sy > 0 ? '+y' : '-y');
      if (f.on) {
        const L = (x, z) => F.fl(M, f, [x, sy * D / 2, z]);
        // bass buttons in slanted rows
        for (let r = 0; r < p.nRow; r++) for (let c = 0; c < p.nCol; c++) {
          const z = H * (0.18 + 0.7 * c / (p.nCol - 1)), x = -bt * (0.2 + 0.6 * r / (p.nRow - 1)) + (c % 2) * bt * 0.03;
          const q = L(x, z);
          f.circle(q[0], q[1], Math.min(bt * 0.045, H * 0.016), { w: 1, n: 8 });
        }
        if (p.door) { const q = L(-bt * 0.5, H * 0.3); void q; }
        const c = L(-bt * 0.5, H * 0.08);
        K.stencil(f, p.des, c[0], c[1], H * 0.035, {});
      }
      // the hand strap across the outer end
      const ef = B.f('-x');
      if (ef.on) F.seams(ef, ef.box, { n: 1, m: 3, shade: true });
      M.box([-bt - 0.02 * H, -D * 0.2, H * 0.2], [-bt, D * 0.2, H * 0.85], { isect: false });
      M.callout('BASS BUTTONS', p.nRow * p.nCol, [-bt * 0.5, sy * D / 2, H * 0.5], 2.4);
      M.callout('HAND STRAP', 1, [-bt - 0.02 * H, 0, H * 0.5], 0.9);
      if (p.door) {
        M.at(-bt * 0.5, sy * (D / 2 + 0.03), 0, () => M.rz(sy > 0 ? 90 : -90, () => K.ladder(M, { h: H * 0.3 + 0.9, w: Math.min(0.5, bt * 0.5) })));
        M.callout('BOARDING LADDER', 1, [-bt * 0.5, sy * (D / 2 + 0.03), H * 0.15], 1);
      }
    }));
    M.info.mass = [-Lbw / 2 - bt, -D / 2, 0, Lbw / 2 + bt, D / 2, H];
    out.fig = F.figSpot(M, (Lbw / 2 + bt) * 1.1 + 0.6);
    return out;
  },
  vocab(M, p, g) {
    const klass = M.pick([`${g.adj} ACCORDION`, `ACCORDION ${g.form}`, `${M.pick(['DANCE HALL', 'TANGO', 'HARBOR', 'WEDDING', 'VILLAGE FAIR'])} ACCORDION ${g.form}`].filter((s) => s.length <= 34));
    const brief = F.fit(M.pick([
      `Plays at weddings in ${word(p.nF)} villages a week and carries the band inside.`,
      `Seats ${word(p.crew)} musicians and bends in the middle on narrow streets.`,
      `An accordion that ${g.goes} to the dance hall with ${word(p.crew)} crew.`,
    ]), `Seats ${word(p.crew)} musicians.`);
    return { klass, brief, specs: [['MASS', `${Math.max(1, Math.round(p.mass))} T`], ['FOLDS', String(p.nF)], ['BUTTONS', String(p.nRow * p.nCol)]] };
  },
};

// ===================================================================== drums
// a drum along local z from 0 to d, radius r: shell, two hoops, rods and lugs
function drum(M, r, d, o = {}) {
  const S = M.cyl(r, 0, d);
  const n = o.n ?? 10;
  const L = S.lat;
  if (M.decorOn) { L.shade({ gap: 1.6, gapMax: 5 }); if (o.rings !== false) { L.ring(0.5, { w: 1 }); } }
  const hr = r * 1.045, hw = Math.max(r * 0.07, d * 0.08);
  for (const [z0, z1] of [[-r * 0.02, hw], [d - hw, d + r * 0.02]]) M.lathe([[r * 0.99, z0], [hr, z0], [hr, z1], [r * 0.99, z1]], { loop: true, isect: false });
  const rodR = Math.max(r * 0.012, 0.003);
  if (!o.noRods) for (let i = 0; i < n; i++) {
    const a = (i + 0.5) * 2 * Math.PI / n, c = Math.cos(a), s = Math.sin(a);
    const rr = r * 1.07;
    M.boxc([c * r * 1.03, s * r * 1.03, d / 2], [r * 0.06, r * 0.06, d * 0.22], { isect: false });
    M.tube([c * rr, s * rr, hw * 0.5], [c * rr, s * rr, d / 2 - d * 0.11], rodR, { isect: false, shade: false });
    M.tube([c * rr, s * rr, d - hw * 0.5], [c * rr, s * rr, d / 2 + d * 0.11], rodR, { isect: false, shade: false });
    if (o.rivets !== false && M.decorOn) L.port(a / D2R, 0.5, r * 0.012, { w: 1 });
  }
  return S;
}
function cymbal(M, r) {
  const h = r * 0.12;
  const C = M.lathe([[0.001, h], [r * 0.16, h * 0.9], [r * 0.22, h * 0.45], [r, 0]], { open: true, isect: false });
  if (M.decorOn) { C.lat.ring(0.55, { w: 0 }); C.lat.ring(0.8, { w: 0 }); C.lat.ring(0.35, { w: 1 }); }
  return C;
}
function tripod(M, h, r) {
  M.tube([0, 0, h * 0.25], [0, 0, h], r * 0.05, { isect: false });
  for (let i = 0; i < 3; i++) { const a = i * 2 * Math.PI / 3 + 0.5; M.tube([0, 0, h * 0.3], [Math.cos(a) * r, Math.sin(a) * r, 0], r * 0.04, { isect: false }); }
}

const drums = {
  id: 'drum', aka: ['bassdrum', 'kit', 'drumkit'],
  plan(M) {
    let kit = M.chance(0.5);
    if (M.info.variant === 'kit' || M.info.variant === 'drumkit') kit = true;
    if (M.info.variant === 'bassdrum') kit = false;
    const des = F.desig(M), unit = String(M.ri(1, 40)).padStart(2, '0');
    if (kit) {
      const k = M.chance(0.5) ? M.r(1.0, 1.1) : M.r(1.8, 2.6);
      const view = [M.pick([1, -1]) * M.r(30, 48), M.r(28, 36)];
      return { kit, k, len: 2.0 * k, wid: 1.8 * k, hgt: 1.5 * k, mass: 0.5 * k * k, view, des, unit, toms: M.ri(1, 2), lamps: M.chance(0.7) };
    }
    const Dd = M.r(2.4, 5.6), w = Dd * M.r(0.36, 0.46);
    const sv = M.pick([1, -1]);
    const view = [sv * M.r(48, 62), M.r(20, 28)];
    const nl = M.pick([10, 12, 14, 16]);
    return { kit, Dd, w, len: Dd * 1.2 + 1.2, wid: w + Dd * 0.55, hgt: Dd + 0.1, mass: Dd * Dd * w * 0.25, view, des, unit, nl, lamps: M.chance(0.8), door: Dd > 3 && M.chance(0.7) };
  },
  build(M, p) {
    return p.kit ? this.buildKit(M, p) : this.buildBass(M, p);
  },
  buildBass(M, p) {
    const R = p.Dd / 2, w = p.w;
    const { sy } = sideOf(M);
    const out = {};
    const xs = -0.3;
    M.at(xs, 0, 0, () => {
      let S;
      M.part('DRUM SHELL', () => {
        S = M.at(0, -w / 2, R, () => M.rx(-90, () => drum(M, R, w, { n: p.nl })));
        // lettered head, the one seen
        const f = sy > 0 ? S.top : S.bottom;
        if (f.on) {
          f.circle(0, 0, R * 0.86, { w: 1 });
          f.circle(0, 0, R * 0.84, { w: 0 });
          K.stencil(f, p.des, 0, R * 0.12, Math.min(R * 0.22, R * 1.4 / (p.des.length * 0.78)), { upright: true });
          K.stencil(f, `NO. ${p.unit}`, 0, -R * 0.32, R * 0.1, { upright: true });
          f.circle(R * 0.45, -R * 0.45, R * 0.09, { w: 1 }); f.circle(R * 0.45, -R * 0.45, R * 0.11, { w: 1 });
        }
        if (M.decorOn) {
          const L = S.lat;
          for (let i = 0; i < 24; i++) { L.port(i * 15 + 7.5, 0.15, R * 0.01, { w: 1 }); L.port(i * 15 + 7.5, 0.85, R * 0.01, { w: 1 }); }
          if (p.door) {
            const a = 90 + 0;
            const dh = Math.min(2.0, w * 0.7), dw = Math.min(0.9, R * 0.4);
            void a; void dh; void dw;
          }
        }
        M.callout('BASS DRUM SHELL', 1, [R, 0, R], 2.4);
        M.callout('LETTERED HEAD', 1, [0, sy * (w / 2 + 0.01), R * 1.3], 2.6);
        M.callout('TENSION ROD', p.nl * 2, [R * 1.07, sy * w * 0.3, R], 1.4);
        M.callout('HOOP', 2, [0, sy * w / 2, R * 2.04], 1.2);
      });
      M.part('CRADLE', () => {
        for (const x of [-0.45 * R, 0.45 * R]) {
          const zt = R - Math.sqrt(R * R - x * x) + 0.08 * R;
          M.box([x - 0.08 * R, -w * 0.4, 0], [x + 0.08 * R, w * 0.4, zt]);
        }
        M.callout('CRADLE', 2, [0.45 * R, sy * w * 0.4, 0.05 * R], 0.9);
      });
      M.part('BEATER', () => {
        // a marching drum is struck on both heads: the near beater on a ram
        const yb = sy * (w / 2 + 0.04 * R);
        const ball = [-0.05 * R, yb + sy * 0.1 * R, R * 0.62];
        const piv = [-0.05 * R, yb + sy * 0.45 * R, 0.1 * R];
        M.box([piv[0] - 0.08 * R, piv[1] - 0.06 * R, 0], [piv[0] + 0.08 * R, piv[1] + 0.06 * R, piv[2] + 0.04 * R]);
        M.tube(piv, ball, 0.018 * R);
        M.at(...ball, () => M.sphere(0.1 * R));
        const mid = [(piv[0] + ball[0]) / 2, (piv[1] + ball[1]) / 2, (piv[2] + ball[2]) / 2];
        const base = [piv[0] + 0.3 * R, piv[1] + sy * 0.12 * R, 0];
        M.box([base[0] - 0.05 * R, base[1] - 0.05 * R, 0], [base[0] + 0.05 * R, base[1] + 0.05 * R, 0.05 * R]);
        M.tube([base[0], base[1], 0.05 * R], [(base[0] + mid[0]) / 2, (base[1] + mid[1]) / 2, (0.05 * R + mid[2]) / 2], 0.04 * R);
        M.tube([(base[0] + mid[0]) / 2, (base[1] + mid[1]) / 2, (0.05 * R + mid[2]) / 2], mid, 0.022 * R);
        M.callout('BEATER', 1, ball, 2);
        M.callout('BEATER RAM', 1, base, 1);
      });
      M.part("DRIVER'S THRONE", () => {
        const x = R + 0.55;
        M.at(x, 0, 0, () => { tripod(M, 0.5, 0.3); M.cyl(0.2, 0.5, 0.58); });
        M.at(x, 0, 0.58, () => F.driver(M, { arms: 'bar' }));
        F.steering(M, [x + 0.62, 0, 0], [x + 0.46, 0, 0.92], { r: 0.17 });
        M.callout("DRIVER'S THRONE", 1, [x, 0.2, 0.55], 1.3);
      });
      if (p.lamps) M.part('HEADLAMP', () => {
        for (const s of [1, -1]) F.lampAt(M, [R * 1.02, s * w * 0.3, R * 0.5], 0, 0.06 * R);
        M.callout('HEADLAMP', 2, [R * 1.05, sy * w * 0.3, R * 0.5], 1);
      });
      if (p.door) M.part('ROOF HATCH', () => {
        M.at(0, 0, 2 * R, () => { M.cyl(0.25, -0.05, 0.12); M.cyl(0.3, 0.12, 0.16); });
        K.railing(M, [[-0.5, -w * 0.35, 2 * R - 0.03], [0.5, -w * 0.35, 2 * R - 0.03]], { h: 0.9 });
        M.at(-R * 0.98 - 0.1, 0, 0, () => M.rz(90, () => K.ladder(M, { h: R * 1.2, w: 0.5 })));
        M.callout('ROOF HATCH', 1, [0, 0, 2 * R + 0.16], 1);
      });
      M.info.mass = [-R + xs, -w / 2, 0, R + xs, w / 2, 2 * R];
    });
    out.fig = F.figSpot(M, R * 1.3 + 0.6);
    return out;
  },
  buildKit(M, p) {
    const { k } = p;
    const { sy } = sideOf(M);
    const out = {};
    const zp = 0.22 * k;
    M.part('DRUM RISER', () => {
      const S = M.box([-1.0 * k, -0.9 * k, 0], [1.0 * k, 0.9 * k, zp]);
      for (const nm of ['+x', '+y', '-y', '-x']) {
        const f = S.f(nm);
        if (!f.on) continue;
        F.seams(f, f.box, { n: nm === '+x' || nm === '-x' ? 3 : 3, m: 1, shade: true });
        if (nm === '+x') K.stencil(f, p.des, 0, 0, f.h * 0.4, {});
      }
      const tf = S.f('+z'); if (tf.on) { for (const r of tf.grid(4, 4, { gap: 1.5 })) tf.rect(r, { w: 0 }); }
      M.callout('DRUM RISER', 1, [1.0 * k, 0.5 * k, zp / 2], 1.2);
    });
    M.at(0, 0, zp, () => {
      const Rb = 0.28 * k, wb = 0.4 * k;
      M.part('BASS DRUM', () => {
        const S = M.at(0.15 * k, 0, Rb, () => M.ry(90, () => drum(M, Rb, wb, { n: 10 })));
        const f = S.top;
        if (f.on) { f.circle(0, 0, Rb * 0.8, { w: 1 }); K.stencil(f, p.unit, 0, 0, Rb * 0.42, { upright: true }); }
        for (const s of [1, -1]) M.tube([0.15 * k + wb * 0.9, s * Rb * 0.7, Rb * 0.3], [0.15 * k + wb * 1.15, s * Rb * 1.1, 0], 0.012 * k, { isect: false });
        M.callout('BASS DRUM', 1, [0.15 * k + wb, 0, Rb * 1.4], 2.5);
      });
      M.part('TOM', () => {
        for (let i = 0; i < p.toms; i++) {
          const y = p.toms === 1 ? 0.0 : (i ? 1 : -1) * 0.17 * k;
          M.at(0.2 * k, y, 2 * Rb + 0.12 * k, () => M.ry(-38, () => drum(M, 0.13 * k, 0.17 * k, { n: 6, rivets: false })));
        }
        M.tube([0.3 * k, 0, 2 * Rb], [0.24 * k, 0, 2 * Rb + 0.12 * k], 0.012 * k, { isect: false });
        M.at(-0.45 * k, -0.42 * k, 0, () => { for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4; M.tube([Math.cos(a) * 0.19 * k, Math.sin(a) * 0.19 * k, 0.2 * k], [Math.cos(a) * 0.24 * k, Math.sin(a) * 0.24 * k, 0], 0.01 * k, { isect: false }); } M.at(0, 0, 0.12 * k, () => drum(M, 0.19 * k, 0.36 * k, { n: 8, rivets: false })); });
        M.callout('TOM-TOM', p.toms + 1, [0.2 * k, 0, 2 * Rb + 0.3 * k], 1.8);
      });
      M.part('SNARE DRUM', () => {
        M.at(-0.3 * k, sy * 0.34 * k, 0, () => { tripod(M, 0.5 * k, 0.22 * k); M.at(0, 0, 0.5 * k, () => drum(M, 0.17 * k, 0.13 * k, { n: 8, rivets: false })); });
        M.callout('SNARE DRUM', 1, [-0.3 * k, sy * 0.34 * k, 0.63 * k], 1.8);
      });
      M.part('CYMBAL', () => {
        const hh = [-0.12 * k, sy * 0.62 * k];
        M.at(hh[0], hh[1], 0, () => { tripod(M, 0.9 * k, 0.22 * k); M.at(0, 0, 0.86 * k, () => M.rx(180, () => cymbal(M, 0.18 * k))); M.at(0, 0, 0.88 * k, () => cymbal(M, 0.18 * k)); });
        for (const [x, y, h, r, tl] of [[0.45 * k, sy * 0.5 * k, 1.35 * k, 0.24 * k, 18], [0.35 * k, -sy * 0.62 * k, 1.2 * k, 0.28 * k, -14]]) {
          M.at(x, y, 0, () => { tripod(M, h * 0.8, 0.25 * k); M.tube([0, 0, h * 0.8], [-0.12 * k, 0, h], 0.012 * k, { isect: false }); M.at(-0.12 * k, 0, h, () => M.rx(tl, () => cymbal(M, r))); });
        }
        M.callout('CYMBAL', 4, [0.45 * k - 0.12 * k, sy * 0.5 * k, 1.36 * k], 2.2);
        M.callout('HI-HAT', 1, [hh[0], hh[1], 0.9 * k], 1.2);
      });
      M.part('DRUMMER', () => {
        const x = -0.72 * k;
        M.at(x, 0, 0, () => { tripod(M, 0.48, 0.26); M.cyl(0.18, 0.48, 0.56); });
        const hip = [x + 0.02, 0, 0.56];
        M.at(...hip, () => F.driver(M, { arms: 'bar' }));
        for (const s of [1, -1]) M.line([[hip[0] + 0.48, s * 0.17, hip[2] + 0.46], [hip[0] + 0.82, s * 0.12, hip[2] + 0.28]], { w: 2, pass: 1 });
        F.steering(M, [x, -0.42, 0], [x + 0.2, -0.36, 0.75], { r: 0.12 });
        M.callout('DRUMMER', 1, [hip[0], 0, hip[2] + 0.75], 1.2);
        M.callout('THRONE', 1, [x, 0.18, 0.5], 1);
      });
      if (p.lamps) M.part('FOOTLIGHT', () => {
        for (const y of [-0.5, 0, 0.5]) M.at(0.9 * k, y * k, 0, () => M.ry(-25, () => K.lamp(M, { r: 0.05 * k })));
        M.callout('FOOTLIGHT', 3, [0.9 * k, 0.5 * k, 0.05 * k], 1);
      });
    });
    M.info.mass = [-1.0 * k, -0.9 * k, 0, 1.0 * k, 0.9 * k, zp];
    out.fig = F.figSpot(M, 1.1 * k + 0.6);
    return out;
  },
  vocab(M, p, g) {
    if (p.kit) {
      const klass = M.pick([`${g.adj} DRUM KIT`, `DRUM KIT ${g.form}`, `${M.pick(['DANCE BAND', 'JAZZ CLUB', 'CABARET', 'SESSION'])} DRUM KIT ${g.form}`].filter((s) => s.length <= 34));
      const brief = F.fit(M.pick(['Keeps time for a dance band and drives it to the next engagement.', `A drum kit that ${g.goes} with its drummer at 120 beats a minute.`, 'Carries a drummer and five drums between three clubs a night.']), 'Keeps time for a dance band.');
      return { klass, brief, specs: [['MASS', `${(Math.round(p.mass * 10) / 10).toFixed(1)} T`], ['DRUMS', String(p.toms + 3)]] };
    }
    const klass = M.pick([`${g.adj} BASS DRUM`, `BASS DRUM ${g.form}`, `${M.pick(['MARCHING', 'REGIMENTAL', 'CARNIVAL', 'PARADE'])} BASS DRUM ${g.form}`].filter((s) => s.length <= 34));
    const brief = F.fit(M.pick([`Marches at the head of the carnival and beats 96 times a minute.`, `Keeps step for a regiment of 600 and ${g.goes} between parades.`, `Leads the parade and can be heard ${Math.round(p.Dd * 3)} kilometers away.`]), 'Leads the parade.');
    return { klass, brief, specs: [['MASS', `${Math.max(1, Math.round(p.mass))} T`], ['HEAD', `${Math.round(p.Dd * 1000)} MM`], ['RODS', String(p.nl * 2)]] };
  },
};

// ===================================================================== harp
const harp = {
  id: 'harp', aka: [],
  plan(M) {
    const k = M.chance(0.4) ? M.r(1.0, 1.15) : M.r(2.4, 5);
    const sv = M.pick([1, -1]);
    const view = [sv * M.r(52, 64), M.r(22, 30)];
    const nS = M.ri(38, 46);
    const des = F.desig(M), unit = String(M.ri(1, 40)).padStart(2, '0');
    const lamps = M.chance(0.7);
    return { k, len: 1.0 * k + 0.9, wid: 0.5 * k, hgt: 1.86 * k, mass: 0.04 + 0.2 * k * k, view, nS, des, unit, lamps };
  },
  build(M, p) {
    const { k } = p;
    const { sy } = sideOf(M);
    const out = {};
    const xs = 0.2 * k;
    M.at(-xs + 0.3, 0, 0, () => {
      const zb = 0.13 * k;
      const sb0 = [0.16 * k, zb], sb1 = [-0.48 * k, 1.5 * k];           // soundboard line, bottom to top
      const colX = 0.34 * k, colTop = 1.62 * k;
      // neck: an S-curve from the top of the soundbox to the top of the column
      const neckC = (t) => { const x = sb1[0] + (colX - sb1[0]) * t; const z = 1.5 * k + 0.16 * k * Math.sin(Math.PI * t * 0.9) - 0.12 * k * Math.sin(Math.PI * 2 * t) * 0.6 + (colTop - 1.5 * k) * t; return [x, z]; };
      const nh = 0.07 * k;
      M.part('BASE', () => {
        const B = M.box([-0.16 * k, -0.2 * k, 0.03 * k], [0.42 * k, 0.2 * k, zb], { chamfer: 0.08 * k });
        for (const nm of ['+x', '+y', '-y', 'c0', 'c1']) { const f = B.f(nm); if (f.on) F.seams(f, f.box, { n: 1, m: 1, shade: true }); }
        const f = B.f(sy > 0 ? '+y' : '-y'); if (f.on) K.stencil(f, p.des, 0, 0, f.h * 0.4, {});
        for (const a of [1, -1]) for (const b of [1, -1]) M.at(a > 0 ? 0.36 * k : -0.1 * k, b * 0.15 * k, 0, () => F.turned(M, 0.03 * k, 0.03 * k, 'bun'));
        // seven pedals in their slots
        for (let i = 0; i < 7; i++) {
          const s = i < 3 ? 1 : -1, j = i < 3 ? i : i - 3;
          const x = 0.0 * k + j * 0.08 * k;
          M.box([x - 0.012 * k, s * 0.2 * k, 0.05 * k], [x + 0.012 * k, s * 0.27 * k, 0.065 * k], { isect: false });
        }
        M.callout('PEDAL', 7, [0.08 * k, sy * 0.25 * k, 0.06 * k], 1.6);
        M.callout('BASE', 1, [0.3 * k, sy * 0.2 * k, 0.08 * k], 1);
      });
      M.part('SOUNDBOX', () => {
        const a = [sb0[0], 0, sb0[1]], b = [sb1[0], 0, sb1[1]];
        M.along(a, b, (L) => {
          // local x along the soundboard, local z out of the soundboard toward the strings (+x side)
          const sec = (t) => { const w = (0.19 - 0.13 * t) * k, d = (0.3 - 0.2 * t) * k; return [[0, -w, 0], [0, w, 0], [0, w * 0.75, -d * 0.7], [0, w * 0.35, -d], [0, -w * 0.35, -d], [0, -w * 0.75, -d * 0.7]].map(([x, y, z]) => [x + L * t, y, z]); };
          const S = M.loft(sec(0), sec(1), { smoothDeg: 50 });
          void S;
        }, [1, 0, 0.0001]);
        M.callout('SOUNDBOX', 1, [(sb0[0] + sb1[0]) / 2 - 0.1 * k, sy * 0.12 * k, (sb0[1] + sb1[1]) / 2], 2);
      });
      M.part('COLUMN', () => {
        M.at(colX, 0, zb, () => F.turned(M, colTop - zb - 0.12 * k, 0.045 * k, 'column'));
        M.at(colX, 0, colTop - 0.12 * k, () => {
          const C = M.lathe([[0.05 * k, 0], [0.07 * k, 0.03 * k], [0.06 * k, 0.06 * k], [0.09 * k, 0.11 * k], [0.1 * k, 0.15 * k], [0.06 * k, 0.18 * k], [0.03 * k, 0.22 * k], [0, 0.23 * k]], { sharpDeg: 30 });
          if (M.decorOn) { C.lat.shade({ gap: 1.4, gapMax: 3.6 }); for (let i = 0; i < 12; i++) C.lat.meridian(i * 30, 0.35, 0.75, { w: 0 }); }
        });
        M.callout('COLUMN', 1, [colX + 0.04 * k, 0, 0.9 * k], 2);
        M.callout('CROWN', 1, [colX, 0, colTop + 0.05 * k], 1.4);
      });
      M.part('NECK', () => {
        const n = 20, pr = [];
        for (let i = 0; i <= n; i++) { const [x, z] = neckC(i / n); pr.push([x, z + nh / 2]); }
        for (let i = n; i >= 0; i--) { const [x, z] = neckC(i / n); pr.push([x, z - nh / 2]); }
        const N = M.extrude(pr, -0.03 * k, 0.03 * k, { plane: 'xz', smoothDeg: 30 });
        const f = N.f(sy > 0 ? '+y' : '-y');
        if (f.on) for (let i = 0; i < p.nS; i++) { const t = 0.06 + 0.86 * i / p.nS; const [x, z] = neckC(t); const q = F.fl(M, f, [x, sy * 0.03 * k, z - nh * 0.2]); f.circle(q[0], q[1], 0.006 * k, { n: 6 }); const q2 = F.fl(M, f, [x, sy * 0.03 * k, z + nh * 0.2]); f.circle(q2[0], q2[1], 0.004 * k, { n: 5 }); }
        M.callout('NECK', 1, [neckC(0.5)[0], 0.03 * k, neckC(0.5)[1]], 1.8);
      });
      M.part('STRINGS', () => {
        for (let i = 0; i < p.nS; i++) {
          const t = 0.06 + 0.86 * i / p.nS;
          const [x, z] = neckC(t);
          // soundboard height at this x
          const u = (x - sb0[0]) / (sb1[0] - sb0[0]);
          if (u < 0.02 || u > 0.98) continue;
          const zs = sb0[1] + (sb1[1] - sb0[1]) * u;
          M.line([[x, 0, z - nh / 2], [x, 0, zs]], { w: i % 7 === 0 ? 1 : 0, pass: 2 });
        }
        M.callout('STRINGS', p.nS, [neckC(0.55)[0], 0, (neckC(0.55)[1] + 0.6 * k) / 2], 2.2);
      });
      if (p.lamps) M.part('HEADLAMP', () => {
        for (const s of [1, -1]) M.at(colX + 0.04 * k, s * 0.05 * k, 0.4 * k, () => K.lamp(M, { r: 0.03 * k }));
        M.callout('HEADLAMP', 2, [colX + 0.07 * k, 0.05 * k, 0.4 * k], 1);
      });
      M.part("HARPIST'S STOOL", () => {
        const x = sb0[0] - 0.75 - 0.15 * k;
        M.at(x, 0, 0, () => { tripod(M, 0.5, 0.25); M.cyl(0.17, 0.5, 0.56); });
        M.at(x + 0.02, 0, 0.56, () => F.driver(M, { arms: 'bar' }));
        if (k > 1.6) F.steering(M, [x + 0.62, 0.0, 0], [x + 0.47, 0, 0.92], { r: 0.15 });
        M.callout('HARPIST', 1, [x, 0, 1.3], 1.2);
      });
      if (k > 1.6) M.part('ACCESS LADDER', () => {
        M.at(colX + 0.12 * k, 0, 0, () => K.ladder(M, { h: colTop * 0.8, w: 0.45 }));
        M.callout('ACCESS LADDER', 1, [colX + 0.12 * k, 0, colTop * 0.4], 1.2);
      });
      M.info.mass = [-0.5 * k - xs + 0.3, -0.2 * k, 0, 0.42 * k - xs + 0.3, 0.2 * k, 1.86 * k];
    });
    out.fig = F.figSpot(M, 0.9 * k + 0.7);
    return out;
  },
  vocab(M, p, g) {
    const klass = M.pick([`${g.adj} CONCERT HARP`, `CONCERT HARP ${g.form}`, `${M.pick(['CATHEDRAL', 'ORCHESTRA', 'CHAPEL', 'SALON'])} HARP ${g.form}`].filter((s) => s.length <= 34));
    const brief = F.fit(M.pick([`Takes a pedal harp of ${p.nS} strings and its harpist to the cathedral.`, `A concert harp that ${g.goes} with its harpist on the stool.`, `Carries ${p.nS} strings, seven pedals and one harpist to evening service.`]), 'Takes a pedal harp and its harpist to the cathedral.');
    return { klass, brief, specs: [['MASS', `${(Math.round(p.mass * 10) / 10).toFixed(1)} T`], ['STRINGS', String(p.nS)], ['PEDALS', '7']] };
  },
};

// ===================================================================== the class
const OBJECTS = [cello, tuba, accordion, drums, harp];

export default {
  id: 'instrument',
  family: 'ground',
  weight: 2,
  build(M) {
    return F.runObject(M, F.pickObject(M, OBJECTS), 'ground');
  },
};
