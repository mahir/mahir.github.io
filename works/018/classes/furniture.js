// classes/furniture.js: furniture built as a vehicle, at vehicle scale or at its own size with
// the driver sitting in it, on running gear from gear.js. Pool: grand piano, wingback armchair
// or chesterfield sofa, four-poster bed, claw-foot bathtub, wardrobe, rocking chair. Every
// piece is made by engineers who took the order literally: plate seams where the joinery
// would be, rivet rows, hatches, a number, lamps, ladders, handrails, a door.

import * as F from './parts-furn.js';
import { inset, clipX } from './parts-ground.js';
import { word } from '../words.js';
import { D2R } from '../geom.js';

const { K, clamp, smooth } = F;

const desig = F.desig;

// ===================================================================== grand piano
function pianoPlan(L, W, wT, rT) {
  const xe = L - rT, xb = L * 0.2;
  const pts = [[0, -W / 2]];
  const nB = 16;
  for (let i = 0; i <= nB; i++) { const u = i / nB; pts.push([xb + (xe - xb) * u, -W / 2 + (W - wT) * smooth(u)]); }
  const nT = 12;
  for (let i = 1; i < nT; i++) { const a = -Math.PI / 2 + Math.PI * i / nT; pts.push([xe + rT * Math.cos(a), W / 2 - wT / 2 + wT / 2 * Math.sin(a)]); }
  pts.push([xe, W / 2]);
  pts.push([0, W / 2]);
  return pts;
}
// x extent of a plan polygon along the line y (max x)
function xMaxAt(plan, y) {
  let best = -Infinity;
  for (let i = 0; i < plan.length; i++) {
    const a = plan[i], b = plan[(i + 1) % plan.length];
    if ((a[1] - y) * (b[1] - y) > 0 || a[1] === b[1]) continue;
    const t = (y - a[1]) / (b[1] - a[1]);
    best = Math.max(best, a[0] + (b[0] - a[0]) * t);
  }
  return best;
}
function yMinAt(plan, x) {
  let best = Infinity;
  for (let i = 0; i < plan.length; i++) {
    const a = plan[i], b = plan[(i + 1) % plan.length];
    if ((a[0] - x) * (b[0] - x) > 0 || a[0] === b[0]) continue;
    const t = (x - a[0]) / (b[0] - a[0]);
    best = Math.min(best, a[1] + (b[1] - a[1]) * t);
  }
  return best;
}
// a ring profile (outer CCW, inner inset by t) as one simple polygon with a hairline slit
function ringProfile(outer, t) {
  const inner = inset(outer, t);
  const n = outer.length;
  const e = 1e-4;
  const nudge = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * e, p[1] + dy / l * e]; };
  const out = outer.slice();
  out.push(nudge(outer[0], outer[n - 1]));
  out.push(nudge(inner[0], inner[n - 1]));
  for (let i = n - 1; i >= 1; i--) out.push(inner[i]);
  out.push(inner[0]);
  return { prof: out, inner };
}

const piano = {
  id: 'piano',
  plan(M) {
    const big = M.chance(0.4);
    const k = big ? M.r(2.2, 3.4) : M.r(1.0, 1.12);
    const Lp = M.r(1.85, 2.75) * k;
    const Wp = 1.5 * k * M.r(0.97, 1.04);
    const wT = Wp * M.r(0.36, 0.44), rT = Wp * M.r(0.26, 0.34);
    const rimH = 0.3 * k, legH = 0.64 * k * M.r(0.95, 1.05);
    const lidA = M.r(26, 40);
    const az = -135 + M.r(-14, 14), el = M.r(37, 40);
    const des = desig(M);
    const unit = String(M.ri(1, 40));
    const legStyle = M.pick(['vase', 'bead', 'column']);
    const lamps = M.chance(big ? 0.85 : 0.6);
    const whip = M.chance(0.6);
    const hatchLid = M.chance(0.6);
    const kd = 0.17 * k;
    const benchD = 0.38 * k, benchGap = 0.2 * k;
    const xmin = -kd - benchGap - benchD, xmax = Lp;
    const lidRise = Wp * Math.sin(lidA * D2R);
    const crew = big ? M.ri(3, 6) : 1;
    return {
      len: xmax - xmin, wid: Wp, hgt: legH + rimH + lidRise, mass: big ? 6 * k * k : 0.5 + 0.3 * k,
      view: [az, el], k, big, Lp, Wp, wT, rT, rimH, legH, lidA, des, unit, legStyle, lamps, whip, hatchLid, kd, benchD, benchGap, xmin, xmax, crew,
    };
  },
  build(M, p) {
    const { k, Lp, Wp: W, wT, rT, rimH, legH, kd, big } = p;
    const cx = (p.xmin + p.xmax) / 2;
    const out = { fig: null };
    M.at(-cx, 0, 0, () => {
      const plan = pianoPlan(Lp, W, wT, rT);
      const zc0 = legH, zsb = legH + rimH * 0.5, zt = legH + rimH;
      const rimT = 0.05 * k;
      const xl = Lp * 0.13;
      let lower, ring;
      M.part('RIM CASE', () => {
        lower = M.extrude(plan, zc0, zsb, { smoothDeg: 32 });
        const R = ringProfile(plan, rimT);
        ring = M.extrude(R.prof, zsb, zt, { smoothDeg: 32, isect: false });
        F.planRivets(M, lower, plan, { rows: [zc0 + 0.035 * k], seam: big ? 0.9 * k : 0, z0: zc0, z1: zsb, shade: true, skip: (i) => i === plan.length - 1 });
        F.planRivets(M, ring, plan, { rows: [zt - 0.03 * k], seam: big ? 0.9 * k : 0, z0: zsb, z1: zt, shade: true, skip: (i) => i === plan.length - 1 });
        M.callout('RIM CASE', 1, [Lp * 0.55, yMinAt(plan, Lp * 0.55), (zc0 + zt) / 2], 2);
        M.info.mass = [p.xmin - cx, -W / 2, zc0, Lp - cx, W / 2, zt];
      });
      // ---- soundboard, iron frame, strings (on the case top inside the rim)
      M.part('STRING FRAME', () => {
        const f = lower.f('+z');
        if (!f.on) return;
        const L = (x, y) => F.fl(M, f, [x, y, zsb]);
        const inner = inset(plan, rimT + 0.03 * k);
        f.path(inner.map(([x, y]) => L(x, y)), { closed: true, w: 1 });
        const inner2 = inset(plan, rimT + 0.075 * k);
        f.path(inner2.filter(([x]) => x > xl * 0.9).map(([x, y]) => L(x, y)), { w: 1 });
        // strings
        const y0 = -W / 2 + rimT + 0.06 * k, y1 = W / 2 - rimT - 0.06 * k;
        const n = clamp(Math.round(f.pxOf(y1 - y0) / 2.6), 16, 110);
        const yBass = W / 2 - W * 0.3;
        for (let i = 0; i <= n; i++) {
          const y = y0 + (y1 - y0) * i / n;
          let ye = y, xs = xl + 0.02 * k;
          if (y > yBass) { ye = y - W * 0.16 * (y - yBass) / (y1 - yBass) - W * 0.04; xs += 0.08 * Lp; }
          const xe = xMaxAt(plan, ye) - rimT - 0.06 * k;
          if (xe - xs < 0.1 * k) continue;
          const a = L(xs, y), b = L(xe, ye);
          f.line(a[0], a[1], b[0], b[1], { w: 0 });
          // hitch pins
          if (f.pxOf(0.01 * k) > 0.4) f.circle(b[0], b[1], 0.006 * k, { n: 5, w: 0 });
        }
        // frame struts and holes
        for (const t of [0.2, 0.42, 0.62, 0.82]) {
          const y = y0 + (y1 - y0) * t;
          const ye = y > yBass ? y - W * 0.12 : y;
          const xe = xMaxAt(plan, ye) - rimT - 0.08 * k;
          for (const d of [-0.012, 0.012]) { const a = L(xl + 0.06 * k, y + d * k), b = L(xe, ye + d * k); f.line(a[0], a[1], b[0], b[1], { w: 1 }); }
        }
        for (const [tx, r] of [[0.34, 0.07], [0.5, 0.062], [0.66, 0.05]]) {
          const x = Lp * tx;
          const yb = yMinAt(plan, x);
          const ym = (yb + W / 2) / 2 - W * 0.06;
          const c = L(x, ym);
          f.circle(c[0], c[1], r * W, { w: 1 });
          f.circle(c[0], c[1], r * W * 0.8, { w: 0 });
        }
        // damper rail across the strings
        const xd = xl + Lp * 0.06;
        const a = L(xd, y0), b = L(xd + 0.05 * k, y1);
        f.rect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), { w: 1 });
        M.callout('STRING FRAME', 1, [Lp * 0.42, 0, zsb], 2.2);
      });
      // ---- music shelf and the music desk as a windshield
      M.part('WINDSHIELD', () => {
        const S = M.box([rimT * 0.6, -W / 2 + rimT, zt - 0.025 * k], [xl, W / 2 - rimT, zt], { isect: false });
        const tf = S.f('+z');
        if (tf.on) { tf.hatch(tf.box, { angle: 0, gap: 3, w: 0 }); }
        const dw = W * 0.7, dh = 0.34 * k;
        M.at(xl * 0.62, 0, zt, () => M.ry(15, () => {
          const D = M.box([-0.012 * k, -dw / 2, 0], [0.012 * k, dw / 2, dh]);
          for (const nm of ['-x', '+x']) {
            const f = D.f(nm);
            if (!f.on) continue;
            const m = f.mOf(3);
            f.rect(-f.w / 2 + m, -f.h / 2 + m, f.w / 2 - m, f.h / 2 - m, { w: 1 });
            const g = f.grid(2, 1, { rect: [-f.w / 2 + m * 2, -f.h / 2 + m * 2, f.w / 2 - m * 2, f.h / 2 - m * 2], gap: 4 });
            for (const r of g) K.glass(f, [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]], { flip: r.i === 1 });
            // wipers
            for (const r of g) { const c = (r[0] + r[2]) / 2; f.line(c, r[1] + m, c - (r[2] - r[0]) * 0.32, r[3] - m, { w: 1 }); }
          }
          // the ledge the music would rest on
          M.box([-0.05 * k, -dw / 2, -0.01 * k], [0.01 * k, dw / 2, 0.025 * k]);
        }));
        M.callout('MUSIC DESK WINDSHIELD', 1, [xl * 0.62, 0, zt + dh * 0.6], 2.4);
      });
      // ---- lid on its prop
      M.part('LID', () => {
        const lp = clipX(plan, xl, true);
        const th = p.lidA, lt = 0.03 * k;
        M.at(0, W / 2, zt, () => M.rx(-th, () => M.at(0, -W / 2, 0, () => {
          const S = M.extrude(lp, 0, lt);
          const f = S.f('+z');
          if (f.on) {
            const L = (x, y) => F.fl(M, f, [x, y, lt]);
            const ins = inset(lp, 0.04 * k);
            f.path(ins.map(([x, y]) => L(x, y)), { closed: true, w: 1 });
            // plate seams across the lid with rivets
            for (const xs of [0.36, 0.6, 0.82]) {
              const x = Lp * xs;
              const yb = yMinAt(lp, x) + 0.04 * k;
              const a = L(x, yb), b = L(x, W / 2 - 0.04 * k);
              f.line(a[0], a[1], b[0], b[1], { w: 1 });
              f.rivets(a[0] + f.mOf(2.5), a[1], b[0] + f.mOf(2.5), b[1], { pitch: 6.5 });
            }
            const c = L(Lp * 0.48, W * 0.15);
            K.stencil(f, p.unit.padStart(2, '0'), c[0], c[1], W * 0.22, { upright: true });
            const c2 = L(Lp * 0.48, -W * 0.06);
            K.stencil(f, p.des, c2[0], c2[1], W * 0.07, { upright: true });
            if (p.hatchLid) { const h = L(Lp * 0.71, W * 0.2); K.accessHatch(f, [h[0] - 0.2 * k, h[1] - 0.14 * k, h[0] + 0.2 * k, h[1] + 0.14 * k]); }
            f.hatch(f.box, { angle: 90, gap: 4.2 - 2 * f.tone, w: 0 });
          }
          if (p.whip && big) M.at(Lp * 0.78, W * 0.28, lt, () => K.whip(M, { h: W * 0.9, lean: 8 }));
        })));
        // hinges along the straight side
        for (const t of [0.3, 0.55, 0.8]) M.at(Lp * t, W / 2, zt, () => M.cyl(0.018 * k, -0.04 * k, 0.04 * k, { axis: 'x', isect: false }));
        // the prop stick
        const xs = Lp * 0.56;
        const yb = yMinAt(plan, xs);
        const ys = yb + rimT * 0.5;
        const yl = yb + W * 0.1;
        const c = Math.cos(th * D2R), s = Math.sin(th * D2R);
        const top = [xs, W / 2 - (W / 2 - yl) * c, zt + (W / 2 - yl) * s];
        M.tube([xs, ys, zt], top, 0.014 * k, { isect: false });
        M.callout('PROPPED LID', 1, [Lp * 0.6, W / 2 - (W * 0.45) * c, zt + W * 0.45 * s], 2.6);
        M.callout('LID PROP', 1, [xs, (ys + top[1]) / 2, (zt + top[2]) / 2], 1.6);
      });
      // ---- keyboard
      const zk = legH + 0.09 * k;
      const Wk = Math.min(W - 0.24 * k, 1.23 * k);
      M.part('KEYBOARD', () => {
        // keybed and cheeks
        M.box([-kd - 0.01 * k, -W / 2, zk - 0.11 * k], [0, W / 2, zk - 0.03 * k]);
        const cw = (W - Wk) / 2;
        for (const s of [1, -1]) {
          const C = M.box([-kd - 0.02 * k, s > 0 ? W / 2 - cw : -W / 2, zk - 0.03 * k], [0, s > 0 ? W / 2 : -W / 2 + cw, zk + 0.045 * k]);
          const f = C.f('-x');
          if (f.on) F.seams(f, f.box, { n: 1, m: 1, rivets: false });
        }
        const WK = M.box([-kd, -Wk / 2, zk - 0.03 * k], [-0.01 * k, Wk / 2, zk]);
        const wk = Wk / 52;
        let wi = 0;
        const blacks = [];
        for (let n = 0; n < 88; n++) { const pc = (n + 9) % 12; if ([1, 3, 6, 8, 10].includes(pc)) blacks.push(wi); else wi++; }
        const ft = WK.f('+z'), ff = WK.f('-x');
        for (let i = 1; i < 52; i++) {
          const y = Wk / 2 - i * wk;
          if (ft.on) { const a = F.fl(M, ft, [-kd, y, zk]), b = F.fl(M, ft, [-0.01 * k, y, zk]); ft.line(a[0], a[1], b[0], b[1], { w: 0 }); }
          if (ff.on) { const a = F.fl(M, ff, [-kd, y, zk - 0.03 * k]), b = F.fl(M, ff, [-kd, y, zk]); ff.line(a[0], a[1], b[0], b[1], { w: 0 }); }
        }
        for (const b of blacks) {
          const y = Wk / 2 - b * wk;
          M.box([-kd * 0.6, y - wk * 0.29, zk], [-0.012 * k, y + wk * 0.29, zk + 0.014 * k], { isect: false });
        }
        // name board above the keys: the designation
        const nb = lower.f('-x');
        void nb;
        const NB = M.box([-0.012 * k, -Wk / 2, zk], [0, Wk / 2, zt - 0.02 * k], { isect: false });
        const nf = NB.f('-x');
        if (nf.on) { K.stencil(nf, p.des, 0, nf.h * 0.12, nf.h * 0.22, {}); nf.rivets(-nf.w / 2 + nf.mOf(4), -nf.h / 2 + nf.mOf(3), nf.w / 2 - nf.mOf(4), -nf.h / 2 + nf.mOf(3), { pitch: 7 }); }
        M.callout('KEYBOARD', 88, [-kd * 0.5, Wk * 0.2, zk], 3);
      });
      // ---- legs on castors, pedal lyre
      M.part('TURNED LEG', () => {
        const cr = 0.04 * k;
        const spots = [[-kd * 0.45, W / 2 - 0.1 * k, zk - 0.11 * k], [-kd * 0.45, -W / 2 + 0.1 * k, zk - 0.11 * k], [Lp - rT - Lp * 0.06, W / 2 - wT / 2, zc0]];
        for (const [x, y, ztop] of spots) {
          M.at(x, y, 0, () => {
            const top = F.castor(M, cr);
            M.at(0, 0, top, () => F.turned(M, ztop - top, 0.075 * k, p.legStyle));
          });
          M.callout('TURNED LEG', 3, [x, y, ztop * 0.6], 2);
          M.callout('CASTOR', 3, [x, y, cr], 1.2);
        }
      });
      M.part('PEDAL LYRE', () => {
        const x = Lp * 0.06;
        const zb = 0.07 * k, zbt = 0.15 * k;
        M.box([x - 0.06 * k, -0.17 * k, zb], [x + 0.06 * k, 0.17 * k, zbt]);
        for (const s of [1, -1]) M.pipe([[x, s * 0.08 * k, zbt], [x, s * 0.15 * k, zbt + 0.12 * k], [x, s * 0.14 * k, zbt + 0.28 * k], [x, s * 0.07 * k, zc0]], 0.014 * k, { isect: false });
        for (const y of [-0.09, 0, 0.09]) M.box([x - 0.15 * k, y * k - 0.02 * k, zb + 0.02 * k], [x - 0.05 * k, y * k + 0.02 * k, zb + 0.04 * k], { isect: false });
        M.tube([x + 0.05 * k, 0, zbt - 0.02 * k], [x + 0.4 * k, 0, zc0], 0.012 * k, { isect: false });
        M.callout('PEDAL LYRE', 1, [x, 0.12 * k, zbt + 0.15 * k], 1.4);
      });
      // ---- bench and pianist
      M.part("DRIVER'S BENCH", () => {
        const x1 = -kd - p.benchGap, x0 = x1 - p.benchD;
        const zs = 0.47 * k, bw = 0.42 * k;
        for (const sx of [x0 + 0.04 * k, x1 - 0.04 * k]) for (const sy of [-bw + 0.05 * k, bw - 0.05 * k]) M.at(sx, sy, 0, () => F.turned(M, zs - 0.03 * k, 0.028 * k, 'column'));
        M.box([x0, -bw, zs - 0.035 * k], [x1, bw, zs]);
        const C = M.box([x0 + 0.01 * k, -bw + 0.01 * k, zs], [x1 - 0.01 * k, bw - 0.01 * k, zs + 0.05 * k], { chamfer: 0.01 * k });
        const f = C.f('+z');
        if (f.on) F.tufting(f, [-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2)], 5, 2);
        const hx = (x0 + x1) / 2 + 0.04;
        M.at(hx, 0, zs + 0.05 * k, () => F.driver(M, { arms: 'stick' }));
        if (big) F.steering(M, [x1 - 0.02 * k, 0, zs + 0.05 * k], [hx + 0.42, 0, zs + 0.05 * k + 0.32], { r: 0.17 });
        M.callout("DRIVER'S BENCH", 1, [x0, bw * 0.6, zs], 1.8);
        M.callout('PIANIST', 1, [hx, 0, zs + 0.05 * k + 0.4], 1.1);

      });
      // ---- lamps, ladder, door, portholes
      if (p.lamps) {
        M.part('HEADLAMP', () => {
          for (const a of [-30, 30]) {
            const ar = a * D2R;
            const xe = Lp - rT;
            const pnt = [xe + rT * Math.cos(ar) * 1.0, W / 2 - wT / 2 + wT / 2 * Math.sin(ar) * 1.0, zc0 + rimH * 0.3];
            F.lampAt(M, pnt, a * 0.6, 0.05 * k);
          }
          M.callout('HEADLAMP', 2, [Lp, W / 2 - wT / 2, zc0 + rimH * 0.3], 1.3);
        });
      }
      if (big) {
        M.part('BOARDING DOOR', () => {
          // the first, flat stretch of the bentside carries a door and a ladder down to the frame
          const f = ring.f('s0'), fL = lower.f('s0');
          void f;
          const dw = Math.min(Lp * 0.13, 0.9), xd = Lp * 0.1;
          const fl = fL;
          if (fl.on) {
            const a = F.fl(M, fl, [xd - dw / 2, -W / 2, zc0 + 0.02 * k]), b = F.fl(M, fl, [xd + dw / 2, -W / 2, zsb - 0.02 * k]);
            fl.rect(Math.min(a[0], b[0]), a[1], Math.max(a[0], b[0]), b[1], { w: 1 });
            fl.rect(Math.min(a[0], b[0]) + fl.mOf(2), a[1] + fl.mOf(2), Math.max(a[0], b[0]) - fl.mOf(2), b[1] - fl.mOf(2), { w: 0 });
          }
          M.at(xd, -W / 2 - 0.06, 0, () => M.rz(90, () => K.ladder(M, { h: zc0 + 0.05 * k, w: 0.5 })));
          M.callout('BOARDING DOOR', 1, [xd, -W / 2, (zc0 + zsb) / 2], 1.5);
          M.callout('ACCESS LADDER', 1, [xd, -W / 2 - 0.06, zc0 * 0.5], 1.5);
          // portholes along the bentside
          let np = 0;
          for (let i = 3; i < 17; i += 3) {
            const fs = ring.f('s' + i);
            if (!fs.on) { np++; continue; }
            const rad = Math.min(fs.w * 0.35, (zt - zsb) * 0.32);
            K.porthole(fs, 0, 0, rad);
            np++;
          }
          if (np) M.callout('PORTHOLE', np, [Lp * 0.45, yMinAt(plan, Lp * 0.45), (zsb + zt) / 2], 1.2);
        });
      }
    });
    out.fig = F.figSpot(M, p.len * 0.62 + 0.8);
    return out;
  },
  vocab(M, p, g) {
    const place = M.pick(['VILLAGE', 'TOURING', 'CONCERT', 'PARISH', 'FESTIVAL', 'PROVINCIAL']);
    const klass = M.pick([`${g.adj} GRAND PIANO`, `${place} GRAND PIANO ${g.form}`, `GRAND PIANO ${g.form}`].filter((s) => s.length <= 34));
    const where = M.pick(['villages without a hall', 'towns without a hall', 'summer festivals', 'mountain parishes', 'island schools']);
    const brief = p.big
      ? F.fit(`Carries a concert grand, its pianist and ${word(p.crew)} crew to ${where}.`, `Carries a concert grand and ${word(p.crew)} crew to ${where}.`)
      : M.pick([`Carries a concert grand and its pianist to ${where}.`, `A concert grand that ${g.goes} to ${where}.`, `Takes a grand piano and its pianist to ${where}.`]);
    return { klass, brief, specs: [['MASS', `${(p.big ? 2 : 0.6) * p.k * p.k < 10 ? (p.big ? 2 * p.k * p.k : 0.6 * p.k).toFixed(1) : Math.round(2 * p.k * p.k)} T`], ['CREW', String(p.crew)], ['KEYS', '88']] };
  },
};

const sideOf = (M) => ({ sy: M.view.e[1] >= 0 ? 1 : -1, sx: M.view.e[0] >= 0 ? 1 : -1 });
function spiral(f, r, turns = 2.2) {
  if (!f.on || f.pxOf(r) < 4) return;
  const pts = [];
  const n = Math.ceil(turns * 24);
  for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * 2 * Math.PI, rr = r * (0.88 - 0.7 * t); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  f.path(pts, { w: 1 });
}
function arched(W, h, rise, n = 12) {
  const pts = [[-W / 2, 0], [W / 2, 0]];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([W / 2 - W * t, h + rise * Math.sin(Math.PI * t)]); }
  return pts;
}

// ===================================================================== armchair / sofa
const chair = {
  id: 'chair', aka: ['armchair', 'sofa', 'wingback', 'chesterfield'],
  plan(M) {
    let sofa = M.chance(0.45);
    if (M.info.variant === 'sofa' || M.info.variant === 'chesterfield') sofa = true;
    if (M.info.variant === 'armchair' || M.info.variant === 'wingback') sofa = false;
    const big = M.chance(0.3);
    const k = big ? M.r(2.2, 3.1) : M.r(1.0, 1.1);
    const D = (sofa ? 0.92 : 0.86) * k, W = (sofa ? M.r(1.9, 2.4) : M.r(0.84, 0.94)) * k;
    const H = (sofa ? M.r(0.74, 0.8) : M.r(1.1, 1.22)) * k;
    const zs = 0.46 * k, hf = (sofa ? 0.1 : 0.14) * k;
    const ta = (sofa ? 0.2 : 0.16) * k, tb = (sofa ? 0.22 : 0.18) * k;
    const zA = sofa ? H - 0.02 * k : 0.66 * k;
    const nCush = sofa ? (W / k > 2.1 ? 3 : 2) : 1;
    const footStyle = sofa ? 'bun' : M.pick(['cabriole', 'bead', 'bun']);
    const castors = M.chance(0.4);
    const az = M.pick([1, -1]) * M.r(32, 50), el = M.r(29, 36);
    const passengers = sofa ? M.ri(0, nCush - 1) : 0;
    const lamps = M.chance(0.75), cushion = !sofa && M.chance(0.5);
    const des = desig(M), unit = String(M.ri(1, 30)).padStart(2, '0');
    return { len: D + 0.2 * k, wid: W, hgt: H, mass: big ? 1.2 * k * k : 0.35, view: [az, el], k, sofa, big, D, W, H, zs, hf, ta, tb, zA, nCush, footStyle, castors, passengers, lamps, cushion, des, unit };
  },
  build(M, p) {
    const { k, D, W, H, zs, hf, ta, tb, zA, sofa, big } = p;
    const { sy } = sideOf(M);
    const x0 = -D / 2, x1 = D / 2, zb = zs - 0.13 * k;
    const out = {};
    M.part('TURNED FOOT', () => {
      for (const sx of [1, -1]) for (const s of [1, -1]) {
        const x = sx * (D / 2 - 0.07 * k), y = s * (W / 2 - 0.07 * k);
        M.at(x, y, 0, () => { const top = p.castors ? F.castor(M, 0.028 * k) : 0; F.turned(M, hf - top, 0.055 * k, p.footStyle); });
        M.callout(p.castors ? 'FOOT ON CASTOR' : 'TURNED FOOT', 4, [x, y, hf * 0.5], 1);
      }
    });
    M.part('SEAT BASE', () => {
      const B = M.box([x0, -W / 2, hf], [x1, W / 2, zb]);
      for (const nm of ['+x', '+y', '-y']) {
        const f = B.f(nm);
        if (!f.on) continue;
        F.seams(f, f.box, { n: nm === '+x' ? p.nCush + (sofa ? 0 : 1) : 1, m: 1, shade: true });
        if (nm === '+x') K.stencil(f, p.unit, 0, 0, f.h * 0.42, {});
      }
      M.callout('SEAT BASE', 1, [x1, W * 0.3, (hf + zb) / 2], 1.2);
    });
    M.part('SEAT CUSHION', () => {
      const yi = W / 2 - ta, n = p.nCush;
      for (let i = 0; i < n; i++) {
        const ya = -yi + 2 * yi * i / n + 0.006 * k, yb = -yi + 2 * yi * (i + 1) / n - 0.006 * k;
        const C = M.box([x0 + tb * 0.8, ya, zb], [x1 + 0.015 * k, yb, zs], { chamfer: 0.035 * k });
        const f = C.f('+z');
        if (f.on) { const m = f.mOf(3); f.rect(-f.w / 2 + m, -f.h / 2 + m, f.w / 2 - m, f.h / 2 - m, { w: 0 }); }
        const ff = C.f('+x');
        if (ff.on) { ff.line(-ff.w / 2, 0, ff.w / 2, 0, { w: 0 }); if (ff.tone > 0.3) ff.hatch(ff.box, { angle: 90, gap: 3.6, w: 0 }); }
      }
      M.callout('SEAT CUSHION', n, [x1, 0, zs - 0.04 * k], 1.3);
    });
    M.part('BUTTONED BACK', () => {
      if (sofa) {
        const rb = tb * 0.55;
        const Bk = M.box([x0, -W / 2, zb], [x0 + tb, W / 2, H - rb]);
        const f = Bk.f('+x');
        if (f.on) F.tufting(f, [-f.w / 2 + ta, -f.h / 2 + (zs - zb) + 0.02 * k, f.w / 2 - ta, f.h / 2 - 0.02 * k], Math.round(W / (0.16 * k)), 2);
        const R = M.at(x0 + tb * 0.5, 0, H - rb, () => M.cyl(rb, -W / 2, W / 2, { axis: 'y' }));
        if (M.decorOn) R.lat.shade({ gap: 1.5, gapMax: 4 });
        const bf = Bk.f('-x'); if (bf.on) F.seams(bf, bf.box, { n: 3, m: 1 });
      } else {
        M.at(x0, 0, zb, () => M.ry(-8, () => {
          const Bk = M.extrude(arched(W - 0.01 * k, H - zb - 0.12 * k, 0.1 * k), 0, tb, { plane: 'yz' });
          const f = Bk.f('+x');
          if (f.on) F.tufting(f, [-f.w / 2 + ta * 0.9, -f.h / 2 + (zs - zb) + 0.03 * k, f.w / 2 - ta * 0.9, f.h / 2 - 0.16 * k], 4, 4);
          const bf = Bk.f('-x'); if (bf.on) { F.seams(bf, [-bf.w / 2 + bf.mOf(3), -bf.h / 2 + bf.mOf(3), bf.w / 2 - bf.mOf(3), bf.h / 2 - 0.14 * k], { n: 2, m: 2 }); }
        }));
        // wings
        M.part('WING', () => M.mirrorY((s) => {
          const xb = x0 + tb * 0.45, tw = 0.07 * k;
          const pr = [[xb + 0.2 * k, zA - 0.02 * k], [xb + 0.3 * k, zA + 0.06 * k], [xb + 0.36 * k, zA + 0.2 * k], [xb + 0.36 * k, H - 0.28 * k], [xb + 0.3 * k, H - 0.14 * k], [xb + 0.16 * k, H - 0.05 * k], [xb - 0.06 * k, H - 0.06 * k], [xb - 0.02 * k, zA - 0.02 * k]];
          const Wg = M.extrude(pr, W / 2 - tw, W / 2, { plane: 'xz', smoothDeg: 40 });
          const f = Wg.f('+y');
          if (f.on) { const m = f.mOf(3); F.fpath(M, f, inset(pr, 0.03 * k).map(([x, z]) => [x, W / 2, z]), { closed: true, w: 0 }); if (f.tone > 0.3) f.hatch(f.box, { angle: 90, gap: 4.4 - 2.4 * f.tone, w: 0 }); void m; }
          M.callout('WING', 2, [xb + 0.25 * k, W / 2, H - 0.25 * k], 1.5);
          void s;
        }));
      }
      M.callout('BUTTONED BACK', 1, [x0 + tb, 0, (zs + H) / 2], 2.4);
    });
    M.part('ROLLED ARM', () => M.mirrorY((s) => {
      const ra = ta * 0.62;
      const xa = x0 + tb * 0.5;
      const A = M.box([xa, W / 2 - ta, zb], [x1, W / 2, zA - ra]);
      const R = M.at(0, W / 2 - ta / 2, zA - ra, () => M.cyl(ra, xa, x1 + 0.03 * k, { axis: 'x' }));
      if (M.decorOn) R.lat.shade({ gap: 1.5, gapMax: 4 });
      spiral(R.top, ra);
      const f = A.f('+y');
      if (f.on) {
        F.seams(f, f.box, { n: 2, m: 1, shade: true });
        if (s * sy > 0) {
          if (big) { for (const t of [-0.22, 0.22]) K.porthole(f, f.w * t, f.h * 0.05, Math.min(f.h * 0.28, f.w * 0.16)); }
          K.stencil(f, p.des, 0, -f.h * 0.33, f.h * 0.12, {});
        }
      }
      const fi = A.f('-y');
      if (fi.on && sofa) F.tufting(fi, [-fi.w / 2 + tb * 0.3, -fi.h / 2 + (zs - zb), fi.w / 2 - 0.02 * k, fi.h / 2 - 0.02 * k], 3, 1);
      const ff = A.f('+x'); if (ff.on) { ff.line(0, -ff.h / 2, 0, ff.h / 2, { w: 0 }); ff.rivets(0, -ff.h / 2 + ff.mOf(3), 0, ff.h / 2 - ff.mOf(3), { pitch: 7 }); }
      M.callout('ROLLED ARM', 2, [x1 + 0.03 * k, W / 2 - ta / 2, zA - ra], 2);
      if (p.lamps) {
        F.lampAt(M, [x1 - 0.06 * k, W / 2 - ta / 2, zA + 0.07 * k], 0, 0.045 * k);
        M.callout('HEADLAMP', 2, [x1 - 0.02 * k, W / 2 - ta / 2, zA + 0.08 * k], 1.1);
      }
    }));
    if (p.cushion) M.part('CUSHION', () => {
      M.at(x0 + tb + 0.1 * k, -sy * (W / 2 - ta - 0.14 * k), zs + 0.16 * k, () => M.ry(-14, () => M.rz(sy * 18, () => {
        const C = M.box([-0.04 * k, -0.17 * k, -0.15 * k], [0.04 * k, 0.17 * k, 0.15 * k], { chamfer: 0.025 * k });
        const f = C.f('+x'); if (f.on) { f.circle(0, 0, f.mOf(1.2), { n: 6 }); f.line(-f.w / 2, -f.h / 2, f.w / 2, f.h / 2, { w: 0 }); f.line(-f.w / 2, f.h / 2, f.w / 2, -f.h / 2, { w: 0 }); }
      })));
    });
    // driver, passengers, steering
    const yD = sofa ? sy * (W / 2 - ta - 0.3 * k) : 0;
    const hipX = x1 - 0.48;
    M.part('DRIVER', () => {
      M.at(hipX, yD, zs + 0.01, () => F.driver(M, { arms: 'bar' }));
      M.callout('DRIVER', 1, [hipX, yD, zs + 0.7], 1.1);
      for (let i = 0; i < p.passengers; i++) {
        const yy = yD - sy * (i + 1) * (2 * (W / 2 - ta) / p.nCush);
        M.at(hipX, yy, zs + 0.01, () => F.driver(M, { arms: 'side' }));
      }
    });
    M.part('STEERING COLUMN', () => {
      const zc = zs - 0.22 * k;
      M.box([x1, yD - 0.04, zc - 0.05], [x1 + 0.09 * k, yD + 0.04, zc + 0.05]);
      F.steering(M, [x1 + 0.07 * k, yD, zc], [Math.max(hipX + 0.45, x1 + 0.05 * k), yD, zs + 0.34], { r: 0.17 });
      M.callout('STEERING COLUMN', 1, [x1 + 0.07 * k, yD, zs], 1.4);
    });
    if (big) M.part('ACCESS LADDER', () => {
      const y = sy * (W / 2 - 0.2 * k);
      M.at(x1 + 0.06, y, 0, () => K.ladder(M, { h: zs + 0.9, w: 0.5 }));
      M.callout('ACCESS LADDER', 1, [x1 + 0.06, y, zs * 0.5], 1.4);
    });
    out.fig = F.figSpot(M, Math.max(D, W) * 0.55 + 0.55);
    M.info.mass = [x0, -W / 2, hf, x1, W / 2, H];
    return out;
  },
  vocab(M, p, g) {
    const place = M.pick(['LIBRARY', 'ESTATE', 'CLUB', 'HOTEL', 'GARDEN', 'MUSEUM']);
    const nm = p.sofa ? 'CHESTERFIELD SOFA' : 'WINGBACK ARMCHAIR';
    const klass = [`${g.adj} ${nm}`, `${nm} ${g.form}`, p.sofa ? `CHESTERFIELD ${g.form}` : `ARMCHAIR ${g.form}`].filter((s) => s.length <= 34);
    const seats = p.nCush;
    const brief = p.sofa
      ? F.fit(M.pick([`Seats ${word(seats)} on a chesterfield and takes them to the station.`, `Carries ${word(seats)} club members from the reading room to the races.`, `Seats ${word(seats)} and ${g.goes} between the hotel and the pier.`]))
      : F.fit(M.pick([`Moves a reader and his armchair from the library to the garden.`, `Seats one driver in a wingback chair and ${g.goes}.`, `Takes the chair and the person in it wherever the chair is wanted.`]), 'Seats one driver in a wingback chair.');
    return { klass: M.pick(klass), brief, specs: [['MASS', `${p.big ? Math.round(1.2 * p.k * p.k) : 0.35} T`], ['SEATS', String(p.sofa ? seats : 1)]] };
  },
};

// ===================================================================== four-poster bed
const bed = {
  id: 'bed', aka: ['fourposter'],
  plan(M) {
    const big = M.chance(0.3);
    const k = big ? M.r(1.7, 2.4) : M.r(1.0, 1.08);
    const L = 2.1 * k, W = M.r(1.45, 1.8) * k, postH = M.r(2.1, 2.4) * k;
    let nS = big ? M.ri(3, 5) : (W / k > 1.55 ? 2 : 1);
    nS = Math.min(nS, Math.max(1, Math.floor((W - 0.3) / 0.62)));
    const caps = Array.from({ length: 6 }, () => M.chance(0.6));
    const castors = M.chance(0.5);
    const az = M.pick([1, -1]) * M.r(30, 48), el = M.r(32, 38);
    const des = desig(M), unit = String(M.ri(1, 30)).padStart(2, '0');
    const nq = M.ri(4, 6);
    const search = big || M.chance(0.3);
    return { len: L + 0.85, wid: W + 0.1, hgt: postH, mass: big ? 2 * k * k : 0.6, view: [az, el], k, big, L, W, postH, nS, caps, castors, des, unit, nq, search };
  },
  build(M, p) {
    const { k, L, W, postH, big } = p;
    const { sy } = sideOf(M);
    const cx = 0.4;
    const out = {};
    M.at(-cx, 0, 0, () => {
      const zr0 = 0.24 * k, zr1 = 0.44 * k, zm = 0.6 * k, zq = 0.66 * k;
      const pr = 0.055 * k;
      const fin = 0.2 * k;
      M.part('BED POST', () => {
        for (const sx of [1, -1]) for (const s of [1, -1]) {
          const x = sx * (L / 2), y = s * (W / 2);
          M.at(x, y, 0, () => {
            const top = p.castors ? F.castor(M, 0.035 * k) : 0;
            M.at(0, 0, top, () => F.turned(M, postH - fin - top, pr, 'column'));
          });
          M.boxc([x, y, (zr0 + zr1) / 2], [pr * 2.6, pr * 2.6, zr1 - zr0 + 0.05 * k]);
          M.at(x, y, postH - fin, () => F.turned(M, fin, pr * 1.3, 'finial'));
          M.callout('TURNED POST', 4, [x, y, postH * 0.55], 2);
          M.callout('FINIAL', 4, [x, y, postH - fin * 0.4], 1);
        }
      });
      M.part('SIDE RAIL', () => {
        for (const s of [1, -1]) {
          const R = M.box([-L / 2 + pr, s * W / 2 - 0.03 * k, zr0], [L / 2 - pr, s * W / 2 + 0.03 * k, zr1]);
          const f = R.f(s > 0 ? '+y' : '-y');
          if (f.on) F.seams(f, f.box, { n: 3, m: 1, shade: true });
        }
        M.callout('SIDE RAIL', 2, [0, sy * W / 2, (zr0 + zr1) / 2], 1.3);
      });
      M.part('HEADBOARD', () => {
        M.at(-L / 2, 0, zr1, () => {
          const Hb = M.extrude(arched(W - 2 * pr, 0.85 * k, 0.22 * k), 0, 0.05 * k, { plane: 'yz' });
          const f = Hb.f('+x');
          if (f.on) {
            const g = f.grid(3, 1, { rect: [-f.w / 2 + f.mOf(5), -f.h / 2 + 0.3 * k, f.w / 2 - f.mOf(5), f.h / 2 - 0.3 * k], gap: 5 });
            for (const r of g) { K.frame(f, r, { inset: 2.5 }); if (big) K.porthole(f, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, Math.min(r[2] - r[0], r[3] - r[1]) * 0.3); }
            f.rivets(-f.w / 2 + f.mOf(4), -f.h / 2 + f.mOf(4), f.w / 2 - f.mOf(4), -f.h / 2 + f.mOf(4), { pitch: 7 });
          }
        });
        M.callout('HEADBOARD', 1, [-L / 2 + 0.05 * k, 0, zr1 + 0.9 * k], 1.6);
      });
      M.part('FOOTBOARD', () => {
        const Fb = M.box([L / 2 - 0.05 * k, -W / 2 + pr, zr0], [L / 2, W / 2 - pr, zr1 + 0.4 * k]);
        const f = Fb.f('+x');
        if (f.on) {
          const g = f.grid(3, 1, { rect: [-f.w / 2 + f.mOf(4), -f.h / 2 + f.mOf(4), f.w / 2 - f.mOf(4), f.h / 2 - f.mOf(4)], gap: 4 });
          g.forEach((r, i) => { K.frame(f, r, { inset: 2.2 }); if (i === 1) { K.stencil(f, p.unit, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2 + (r[3] - r[1]) * 0.12, (r[3] - r[1]) * 0.42); K.stencil(f, p.des, (r[0] + r[2]) / 2, r[1] + (r[3] - r[1]) * 0.18, (r[3] - r[1]) * 0.13); } else if (f.tone > 0.2) f.hatch(r, { angle: 90, gap: 3.4, w: 0 }); });
        }
        M.callout('FOOTBOARD', 1, [L / 2, W * 0.3, zr1 + 0.2 * k], 1.4);
      });
      M.part('MATTRESS', () => {
        const Ms = M.box([-L / 2 + 0.05 * k, -W / 2 + 0.05 * k, zr1 - 0.05 * k], [L / 2 - 0.05 * k, W / 2 - 0.05 * k, zm], { isect: false });
        for (const nm of ['+y', '-y']) { const f = Ms.f(nm); if (f.on) f.hatch(f.box, { angle: 0, gap: 3.6, w: 0 }); }
      });
      // sleepers
      const ys = Array.from({ length: p.nS }, (_, i) => (p.nS === 1 ? 0 : -(W / 2 - 0.4) + (W - 0.8) * i / (p.nS - 1)));
      const xp = -L / 2 + 0.08 * k + 0.22;
      M.part('QUILT', () => {
        const xq0 = xp + 0.34;
        const Q = M.box([xq0, -W / 2 + 0.02 * k, zm - 0.12 * k], [L / 2 - 0.04 * k, W / 2 - 0.02 * k, zq], { isect: false });
        M.box([xq0, -W / 2 + 0.015 * k, zq], [xq0 + 0.14 * k, W / 2 - 0.015 * k, zq + 0.03 * k], { isect: false });
        for (const nm of ['+z', '+y', '-y', '+x']) {
          const f = Q.f(nm);
          if (!f.on) continue;
          const nx = nm === '+z' ? Math.round(p.nq * (L - xq0 - L / 2) / W) + 1 : nm === '+x' ? p.nq : Math.round(p.nq * (L / 2 - xq0) / W) + 1;
          const ny = nm === '+z' ? p.nq : 1;
          const g = f.grid(Math.max(1, nx), ny, { gap: 0.01 });
          for (const r of g) { f.rect(r, { w: 0 }); if ((r.i + r.j) % 2) f.hatch(r, { angle: 45, gap: 3.2, w: 0 }); }
        }
        for (const y of ys) M.at(xp + 0.95, y, zq - 0.02, () => M.scale(0.68, 0.22, 0.1, () => { const S = M.sphere(1, { isect: false }); if (M.decorOn) S.lat.shade({ gap: 1.6, gapMax: 4 }); }));
        M.callout('QUILT IN SQUARES', 1, [0.3 * L, 0, zq], 2.2);
      });
      M.part('PILLOW', () => {
        for (const y of ys) M.at(xp, y, zm + 0.06, () => M.scale(0.2, 0.3, 0.075, () => M.sphere(1, { isect: false })));
        M.callout('PILLOW', ys.length, [xp, ys[0], zm + 0.12], 1.2);
      });
      M.part('SLEEPING CREW', () => {
        ys.forEach((y, i) => {
          const h = [xp + 0.06, y, zm + 0.19];
          M.at(...h, () => M.sphere(0.1, { isect: false }));
          if (p.caps[i]) M.at(h[0] - 0.02, h[1], h[2] + 0.05, () => M.ry(-62, () => { M.cone(0.1, 0.0, 0, 0.3, { isect: false }); M.at(0, 0, 0.31, () => M.sphere(0.035, { isect: false })); }));
        });
        M.callout('SLEEPING CREW', ys.length, [xp + 0.1, ys[0], zm + 0.28], 1.6);
      });
      M.part('CANOPY FRAME', () => {
        const zc = postH - fin - 0.02 * k, ch = 0.07 * k;
        for (const s of [1, -1]) M.box([-L / 2, s * W / 2 - 0.025 * k, zc - ch], [L / 2, s * W / 2 + 0.025 * k, zc]);
        for (const s of [1, -1]) M.box([s * L / 2 - 0.025 * k, -W / 2, zc - ch], [s * L / 2 + 0.025 * k, W / 2, zc]);
        for (const t of [-0.25, 0.25]) M.box([t * L - 0.02 * k, -W / 2, zc - ch * 0.6], [t * L + 0.02 * k, W / 2, zc], { isect: false });
        // valance with a scalloped hem
        const vh = 0.28 * k, zt = zc - ch;
        const sides = [[[-L / 2, -W / 2], [L / 2, -W / 2]], [[L / 2, -W / 2], [L / 2, W / 2]], [[L / 2, W / 2], [-L / 2, W / 2]], [[-L / 2, W / 2], [-L / 2, -W / 2]]];
        for (const [a, b] of sides) {
          const Ls = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const n = Math.max(3, Math.round(Ls / (0.32 * k)));
          const poly = [[a[0], a[1], zt], [b[0], b[1], zt]];
          const m = n * 6;
          for (let i = m; i >= 0; i--) { const t = i / m; const sc = Math.abs(Math.sin(Math.PI * n * t)); poly.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, zt - vh * 0.7 - vh * 0.3 * sc]); }
          const V = M.plate(poly, { isect: false });
          const f = V.f('face');
          if (f.on) for (let i = 1; i < n * 2; i++) { const t = i / (n * 2); const q0 = F.fl(M, f, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, zt - 0.01]), q1 = F.fl(M, f, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, zt - vh * (i % 2 ? 1 : 0.72)]); f.line(q0[0], q0[1], q1[0], q1[1], { w: 0 }); }
        }
        M.callout('CANOPY VALANCE', 1, [L * 0.2, sy * W / 2, zt - vh * 0.5], 1.8);
        if (p.search) { M.at(L / 2 - 0.1 * k, 0, zc, () => M.rz(0, () => K.searchlight(M, { r: 0.12 * k }))); M.callout('SEARCHLIGHT', 1, [L / 2 - 0.1 * k, 0, zc + 0.2 * k], 1.2); }
        if (big) M.at(-L / 2, -sy * W / 2, postH, () => M.rz(135, () => K.whip(M, { h: postH * 0.5, lean: 10 })));
      });
      M.part('HEADLAMP', () => {
        for (const s of [1, -1]) F.lampAt(M, [L / 2 + pr, s * W / 2, zr1 + 0.5 * k], 0, 0.045 * k);
        M.callout('HEADLAMP', 2, [L / 2 + pr * 2, sy * W / 2, zr1 + 0.5 * k], 1.1);
      });
      // the driver's box at the foot
      M.part("DRIVER'S BOX", () => {
        const zp = 0.1 * k, x0 = L / 2 + 0.03 * k;
        const Pl = M.box([x0, -0.36, zp], [x0 + 0.78, 0.36, zp + 0.04]);
        const tf = Pl.f('+z'); if (tf.on) { tf.hatch(tf.box, { angle: 0, gap: 2.4, w: 0 }); tf.hatch(tf.box, { angle: 90, gap: 2.4, w: 0 }); }
        for (const s of [1, -1]) M.box([L / 2 - 0.05 * k, s * 0.3 - 0.025, zp], [x0 + 0.05, s * 0.3 + 0.025, zp + 0.06]);
        const zsx = zp + 0.47;
        M.box([x0, -0.26, zsx - 0.05], [x0 + 0.38, 0.26, zsx]);
        for (const s of [1, -1]) M.tube([x0 + 0.3, s * 0.2, zp + 0.04], [x0 + 0.3, s * 0.2, zsx - 0.05], 0.018);
        M.at(x0 + 0.2, 0, zsx, () => F.driver(M, { arms: 'bar' }));
        F.steering(M, [x0 + 0.7, 0, zp + 0.04], [x0 + 0.62, 0, zsx + 0.34], { r: 0.16 });
        M.callout("DRIVER'S BOX", 1, [x0 + 0.6, 0.3, zp + 0.04], 1.5);
        M.callout('NIGHT DRIVER', 1, [x0 + 0.2, 0, zsx + 0.7], 1.2);
      });
      if (big) M.part('ACCESS LADDER', () => {
        M.at(0, sy * (W / 2 + 0.12), 0, () => K.ladder(M, { h: zq + 0.9, w: 0.5 }));
        M.callout('ACCESS LADDER', 1, [0, sy * (W / 2 + 0.12), zq * 0.5], 1.3);
      });
      M.info.mass = [-L / 2 - cx, -W / 2, 0, L / 2 - cx, W / 2, postH];
    });
    out.fig = F.figSpot(M, Math.max(L, W) * 0.72 + 0.8);
    return out;
  },
  vocab(M, p, g) {
    const klass = M.pick([`${g.adj} FOUR-POSTER BED`, `FOUR-POSTER BED ${g.form}`, `${M.pick(['CREW', 'NIGHT', 'SLEEPER', 'DORMITORY'])} BED ${g.form}`].filter((s) => s.length <= 34));
    const n = p.nS;
    const brief = F.fit(M.pick([
      `Sleeps ${word(n)} crew on the way and is driven through the night.`,
      `Carries ${word(n)} sleeping crew between shifts and a driver who stays awake.`,
      `A four-poster bed that ${g.goes} while ${word(n)} crew sleep.`,
    ]), `Sleeps ${word(n)} crew on the way.`);
    return { klass, brief, specs: [['MASS', `${p.big ? Math.round(2 * p.k * p.k) : 0.6} T`], ['BERTHS', String(n)]] };
  },
};

// ===================================================================== claw-foot bathtub
const tub = {
  id: 'bathtub', aka: ['tub', 'clawfoot'],
  plan(M) {
    const big = M.chance(0.3);
    const k = big ? M.r(2.2, 3.2) : M.r(1.0, 1.1);
    const L = M.r(1.55, 1.8) * k, W = M.r(0.74, 0.82) * k;
    const hf = 0.15 * k, zr = hf + 0.5 * k;
    const ends = M.wpick([[2, 'roll'], [2, 'slipper'], [1.4, 'double']]);
    const riserH = 1.95 * k;
    const nB = big ? M.ri(3, 6) : 1;
    const az = M.pick([1, -1]) * M.r(34, 52), el = M.r(34, 40);
    const waves = Array.from({ length: 14 }, () => [M.r(-0.8, 0.8), M.r(-0.7, 0.7), M.r(0.06, 0.16)]);
    const des = desig(M), unit = String(M.ri(1, 30)).padStart(2, '0');
    const lamps = M.chance(0.8);
    return { len: L + 0.3 * k, wid: W * 1.25, hgt: riserH + 0.1 * k, mass: big ? 1.5 * k * k : 0.4, view: [az, el], k, big, L, W, hf, zr, ends, riserH, nB, waves, des, unit, lamps };
  },
  build(M, p) {
    const { k, L, W, hf, zr, big } = p;
    const { sy } = sideOf(M);
    const out = {};
    const cx = 0.1 * k;
    M.at(-cx, 0, 0, () => {
      const nJ = 40;
      const lift = (x) => {
        const u = x / (L / 2);
        const back = smooth((-u - 0.25) / 0.75), front = smooth((u - 0.25) / 0.75);
        return p.ends === 'roll' ? 0 : p.ends === 'slipper' ? 0.16 * k * back : 0.1 * k * (back + front);
      };
      const secs = [[0.01, 0.74, 0.66], [0.05, 0.84, 0.79], [0.13, 0.9, 0.88], [0.3, 0.96, 0.96], [0.5, 1, 1]];
      const rows = secs.map(([zz, a, b], i) => F.sePts(a * L / 2, b * W / 2, hf + zz * k, nJ, 3.2).map(([x, y, z]) => [x, y, z + (i === secs.length - 1 ? lift(x) : i === 3 ? lift(x) * 0.55 : 0)]));
      let S;
      M.part('TUB SHELL', () => {
        S = F.gridSolid(M, rows, { two: true, g: 2 });
        const gs = S.gs;
        gs.shade({ i0: 0, i1: 4, im: 3, gap: 1.5, gapMax: 5 });
        for (let j = 0; j < nJ; j += 5) gs.lineI(j + 2.5, 0.3, 4, { w: 1 });
        gs.rivetsJ(3.75, 0, nJ, { pitch: 7 });
        gs.rivetsJ(1.4, 0, nJ, { pitch: 8 });
        gs.lineJ(3.6, 0, nJ, { w: 1 });
        M.callout('TUB SHELL', 1, [0, sy * W / 2 * 0.96, hf + 0.3 * k], 2.4);
        M.info.mass = [-L / 2 - cx, -W / 2, hf, L / 2 - cx, W / 2, zr];
      });
      M.part('ROLLED RIM', () => {
        const top = rows[4];
        const j0 = nJ / 4;
        const path = [];
        for (let q = 0; q <= nJ; q++) path.push(top[(j0 + q) % nJ]);
        F.sweep(M, path, path.map(() => 0.028 * k), { caps: false, isect: false });
        M.callout('ROLLED RIM', 1, [0, sy * W / 2, zr + 0.03 * k], 1.8);
      });
      // water
      const zw = zr - 0.16 * k;
      M.part('BATH WATER', () => {
        const wpoly = F.sePts(0.975 * L / 2, 0.975 * W / 2, zw, 32, 3.2);
        const Wt = M.plate(wpoly, { isect: false });
        const f = Wt.f('face');
        if (f.on) for (const [u, v, l] of p.waves) {
          const pts = [];
          for (let q = 0; q <= 6; q++) { const t = q / 6; pts.push(F.fl(M, f, [u * L / 2 + (t - 0.5) * l * L, v * W / 2 + Math.sin(t * Math.PI) * 0.02 * k, zw])); }
          f.path(pts, { w: 0 });
        }
        M.callout('WATER LINE', 1, [L * 0.15, -sy * W * 0.2, zw], 1.2);
      });
      M.part('CLAW FOOT', () => {
        for (const sx of [1, -1]) for (const s of [1, -1]) {
          const x = sx * 0.32 * L, y = s * 0.28 * W;
          const b = [x * 1.1, y * 1.25, 0.034 * k];
          M.at(...b, () => M.sphere(0.034 * k, { isect: false }));
          const top = [x, y, hf + 0.04 * k], mid = [x * 1.07, y * 1.2, hf * 0.55];
          F.sweep(M, [[b[0], b[1], b[2] + 0.02 * k], mid, top], [0.02 * k, 0.03 * k, 0.045 * k], { isect: false });
          for (let t = 0; t < 3; t++) {
            const a = Math.atan2(y, x) + (t - 1) * 0.9;
            const c = Math.cos(a), sn = Math.sin(a), r = 0.04 * k;
            M.pipe([[b[0], b[1], b[2] + r * 0.8], [b[0] + c * r * 0.9, b[1] + sn * r * 0.9, b[2] + r * 0.45], [b[0] + c * r * 1.05, b[1] + sn * r * 1.05, b[2] - r * 0.3]], 0.009 * k, { isect: false });
          }
          M.callout('CLAW FOOT', 4, [b[0], b[1], b[2] + 0.04 * k], 1.4);
        }
      });
      const xr = L / 2 + 0.06 * k;
      M.part('SHOWER RISER', () => M.at(xr, 0, 0, () => {
        const rr = 0.022 * k, H = p.riserH;
        M.cyl(0.06 * k, 0, 0.03 * k);
        M.cyl(rr, 0, H - 0.1 * k);
        const zt = zr + 0.12 * k;
        M.pipe([[xr, 0, zt], [L / 2 - 0.1 * k, 0, zt], [L / 2 - 0.14 * k, 0, zt - 0.08 * k]].map(([x, y, z]) => [x - xr, y, z]), rr * 0.8, { isect: false });
        for (const s of [1, -1]) {
          M.tube([0, 0, zt + 0.06 * k], [-0.02 * k, s * 0.09 * k, zt + 0.06 * k], rr * 0.6, { isect: false });
          M.at(-0.02 * k, s * 0.09 * k, zt + 0.06 * k, () => { M.cyl(rr * 0.9, 0, 0.03 * k); for (const a of [0, 90]) M.rz(a, () => M.boxc([0, 0, 0.035 * k], [0.06 * k, 0.008 * k, 0.008 * k])); });
        }
        // goose neck and rose
        const xn = L / 2 - 0.35 * k;
        M.pipe([[0, 0, H - 0.12 * k], [0, 0, H], [-0.08 * k, 0, H + 0.05 * k], [xn - xr, 0, H + 0.02 * k], [xn - xr, 0, H - 0.08 * k]], rr * 0.85, { isect: false });
        M.at(xn - xr, 0, H - 0.08 * k, () => { const R = M.cone(0.025 * k, 0.09 * k, 0, -0.06 * k); if (R.bottom.ok && R.bottom.on) for (let i = 0; i < 7; i++) { const a = i * 2 * Math.PI / 7; R.bottom.circle(Math.cos(a) * 0.05 * k, Math.sin(a) * 0.05 * k, 0.005 * k, { n: 5 }); } });
      }));
      M.callout('SHOWER RISER', 1, [xr, 0, p.riserH * 0.6], 1.6);
      M.callout('TAPS', 2, [xr, 0.09 * k, zr + 0.2 * k], 1.3);
      M.part('CURTAIN RAIL RING', () => {
        const zc = p.riserH - 0.04 * k;
        const ring = F.sePts(L * 0.53, W * 0.62, zc, 36, 2.2);
        M.pipe([...ring, ring[0], ring[1]], 0.012 * k, { isect: false });
        M.tube([xr, 0, zc + 0.04 * k], [L * 0.53, 0, zc], 0.01 * k, { isect: false });
        for (let i = 0; i < 36; i += 2) M.at(...ring[i], () => M.torus(0.02 * k, 0.003 * k, { axis: 'x', isect: false, rings: 6 }));
        M.callout('CURTAIN RAIL RING', 1, [-L * 0.53, 0, zc], 1.4);
      });
      // bathers
      M.part('DRIVER', () => {
        const hipZ = zw - 0.06;
        const hx = -L / 2 + 0.12 * k + 0.2;
        M.at(hx, 0, hipZ, () => F.driver(M, { arms: 'bar' }));
        F.steering(M, [xr, 0, zr + 0.3 * k], [hx + 0.47, 0, hipZ + 0.36], { r: 0.16 });
        for (let i = 1; i < p.nB; i++) {
          const row = Math.floor((i - 1) / 2), s = (i - 1) % 2 ? 1 : -1;
          M.at(hx + 0.75 + row * 0.7, s * Math.min(W * 0.28, 0.45), hipZ, () => F.driver(M, { arms: 'side' }));
        }
        M.callout('DRIVER', 1, [hx, 0, hipZ + 0.7], 1.2);
        M.callout('STEERING COLUMN', 1, [(xr + hx) / 2 + 0.2, 0, zr + 0.3 * k], 1.3);
      });
      M.part('PLUG CHAIN', () => {
        const a = [L / 2 * 0.93, 0.02, zr - 0.06 * k], b = [L / 2 - 0.3 * k, 0.05 * k, zw + 0.002];
        const pts = [];
        for (let q = 0; q <= 10; q++) { const t = q / 10; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - Math.sin(t * Math.PI) * 0.03 * k]); }
        M.line(pts, { w: 1, pass: 2, dash: 'dash' });
        M.callout('PLUG CHAIN', 1, pts[5], 0.8);
      });
      M.part('NAMEPLATE', () => {
        const zz = hf + 0.3 * k;
        const Pl = M.box([-0.17 * k, sy * 0.9 * W / 2, zz - 0.05 * k], [0.17 * k, sy * (0.985 * W / 2 + 0.012 * k), zz + 0.05 * k]);
        const f = Pl.f(sy > 0 ? '+y' : '-y');
        if (f.on) { K.stencil(f, p.des, 0, 0, f.h * 0.42, {}); f.rect(-f.w / 2 + f.mOf(1.5), -f.h / 2 + f.mOf(1.5), f.w / 2 - f.mOf(1.5), f.h / 2 - f.mOf(1.5), { w: 0 }); }
      });
      if (p.lamps) M.part('HEADLAMP', () => {
        for (const s of [1, -1]) F.lampAt(M, [L / 2 * 0.97, s * W * 0.22, zr - 0.1 * k], 0, 0.04 * k);
        M.callout('HEADLAMP', 2, [L / 2, sy * W * 0.22, zr - 0.1 * k], 1.1);
      });
      if (big) M.part('BOARDING LADDER', () => {
        M.at(-L * 0.2, sy * (W / 2 + 0.25), 0, () => M.rz(90, () => K.ladder(M, { h: zr + 0.9, w: 0.5 })));
        M.callout('BOARDING LADDER', 1, [-L * 0.2, sy * (W / 2 + 0.25), zr * 0.5], 1.3);
      });
    });
    out.fig = F.figSpot(M, L * 0.75 + 0.6);
    return out;
  },
  vocab(M, p, g) {
    const klass = M.pick([`${g.adj} CLAW-FOOT BATHTUB`, `CLAW-FOOT BATHTUB ${g.form}`, `${M.pick(['SPA', 'HOTEL', 'PUBLIC', 'MINERS\''])} BATHTUB ${g.form}`].filter((s) => s.length <= 34));
    const brief = p.big
      ? F.fit(`Bathes ${word(p.nB)} at 38 degrees and ${g.goes} to the next town.`, `Bathes ${word(p.nB)} at 38 degrees on the way to work.`)
      : F.fit(M.pick([`Keeps one bath at 38 degrees and ${g.goes} to wherever the bather is due.`, 'Takes a hot bath and the person in it to the office.', 'Carries one bather and 180 liters of hot water at walking pace.']), 'Takes a hot bath and the person in it to the office.');
    return { klass, brief, specs: [['MASS', `${p.big ? Math.round(1.5 * p.k * p.k) : 0.4} T`], ['WATER', `${Math.round(180 * p.k ** 3)} L`]] };
  },
};

// ===================================================================== wardrobe
const wardrobe = {
  id: 'wardrobe', aka: [],
  plan(M) {
    const big = M.chance(0.4);
    const k = big ? M.r(3, 5) : M.r(1.0, 1.08);
    const Wd = M.r(1.1, 1.4) * k, D = M.r(0.55, 0.66) * k, H = M.r(1.95, 2.2) * k;
    const sx = M.pick([1, -1]);
    const az = sx > 0 ? M.r(34, 58) : 180 - M.r(34, 58), el = M.r(26, 34);
    const ang = M.r(38, 72), openRight = sx < 0;
    const mirror = M.wpick([[2, 'closed'], [1, 'both'], [1, 'none']]);
    const des = desig(M), unit = String(M.ri(1, 30)).padStart(2, '0');
    const nHang = M.ri(2, 3);
    return { len: Wd + 0.1 * k, wid: D + 0.1 * k + (Wd / 2) * Math.sin(ang * D2R), hgt: H, mass: big ? 1.4 * k * k : 0.25, view: [az, el], k, big, Wd, D, H, openRight, ang, mirror, des, unit, nHang };
  },
  build(M, p) {
    const { k, Wd: W, D, H, big } = p;
    const { sx } = sideOf(M);
    const t = 0.025 * k, zb = 0.18 * k, Hc = H - 0.16 * k;
    const yc = -(W / 2) * Math.sin(p.ang * D2R) / 2;
    const out = {};
    M.at(0, yc, 0, () => {
      M.part('BUN FOOT', () => {
        for (const a of [1, -1]) for (const b of [1, -1]) M.at(a * (W / 2 - 0.08 * k), b * (D / 2 - 0.07 * k), 0, () => F.turned(M, 0.08 * k, 0.06 * k, 'bun'));
        M.callout('BUN FOOT', 4, [sx * (W / 2 - 0.08 * k), D / 2 - 0.07 * k, 0.04 * k], 1);
      });
      M.part('PLINTH', () => {
        const P = M.box([-W / 2 - 0.01 * k, -D / 2 - 0.01 * k, 0.08 * k], [W / 2 + 0.01 * k, D / 2 + 0.035 * k, zb]);
        for (const nm of ['+y', '+x', '-x']) { const f = P.f(nm); if (f.on) { f.rivets(-f.w / 2 + f.mOf(4), 0, f.w / 2 - f.mOf(4), 0, { pitch: 7 }); f.line(-f.w / 2, f.h * 0.3, f.w / 2, f.h * 0.3, { w: 0 }); } }
      });
      let side;
      M.part('CARCASS', () => {
        M.box([-W / 2, -D / 2, zb], [W / 2, D / 2, zb + t]);
        M.box([-W / 2, -D / 2, Hc - t], [W / 2, D / 2, Hc]);
        const back = M.box([-W / 2, -D / 2, zb], [W / 2, -D / 2 + t, Hc]);
        const S1 = M.box([-W / 2, -D / 2, zb], [-W / 2 + t, D / 2, Hc]);
        const S2 = M.box([W / 2 - t, -D / 2, zb], [W / 2, D / 2, Hc]);
        side = sx > 0 ? S2 : S1;
        const f = side.f(sx > 0 ? '+x' : '-x');
        if (f.on) {
          const floors = big ? Math.max(2, Math.round((Hc - zb) / 2.4)) : 3;
          const g = F.seams(f, f.box, { n: 2, m: floors, shade: true });
          if (big) for (const r of g) K.porthole(f, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, Math.min(r[2] - r[0], r[3] - r[1]) * 0.26);
          else K.stencil(f, p.unit, 0, f.h * 0.18, f.w * 0.3, {});
        }
        const bi = back.f('+y');
        if (bi.on) bi.hatch(bi.box, { angle: 70, gap: 1.6, gap2: 3.2, w: 0 });
        for (const S of [S1, S2]) { const fi = S.f(S === S1 ? '+x' : '-x'); if (fi.on) fi.hatch(fi.box, { angle: 0, gap: 1.8, w: 0 }); }
        M.callout('CARCASS', 1, [sx * W / 2, 0, (zb + Hc) / 2], 1.6);
      });
      M.part('CORNICE', () => {
        M.box([-W / 2 - 0.015 * k, -D / 2 - 0.01 * k, Hc], [W / 2 + 0.015 * k, D / 2 + 0.04 * k, Hc + 0.035 * k]);
        const Fr = M.box([-W / 2 - 0.005 * k, -D / 2 - 0.005 * k, Hc + 0.035 * k], [W / 2 + 0.005 * k, D / 2 + 0.03 * k, H - 0.04 * k]);
        const C = M.box([-W / 2 - 0.05 * k, -D / 2 - 0.03 * k, H - 0.04 * k], [W / 2 + 0.05 * k, D / 2 + 0.075 * k, H]);
        const f = Fr.f('+y');
        if (f.on) {
          K.stencil(f, p.des, 0, 0, f.h * 0.45, {});
          f.rivets(-f.w / 2 + f.mOf(3), -f.h / 2 + f.mOf(2.5), f.w / 2 - f.mOf(3), -f.h / 2 + f.mOf(2.5), { pitch: 7 });
        }
        for (const nm of ['+y', '+x', '-x']) { const cf = C.f(nm); if (cf.on) cf.rivets(-cf.w / 2 + cf.mOf(3), 0, cf.w / 2 - cf.mOf(3), 0, { pitch: 6 }); }
        M.callout('CORNICE', 1, [0, D / 2 + 0.075 * k, H - 0.02 * k], 1.5);
      });
      // doors
      const dw = W / 2 - 0.004 * k, dz0 = zb + t, dz1 = Hc - t;
      const panel = (S, nm, mirror) => {
        const f = S.f(nm);
        if (!f.on) return;
        const m = f.mOf(4);
        if (mirror) {
          const r = [-f.w / 2 + m * 1.6, -f.h / 2 + f.h * 0.3, f.w / 2 - m * 1.6, f.h / 2 - m * 1.6];
          f.rect(r, { w: 1 }); f.rect(r[0] + m * 0.5, r[1] + m * 0.5, r[2] - m * 0.5, r[3] - m * 0.5, { w: 1 });
          const g = [[r[0] + m * 0.5, r[1] + m * 0.5], [r[2] - m * 0.5, r[1] + m * 0.5], [r[2] - m * 0.5, r[3] - m * 0.5], [r[0] + m * 0.5, r[3] - m * 0.5]];
          f.hatch(g, { angle: 60, gap: 2.4, gap2: 5, w: 0 });
          for (const q of [0.2, 0.32, 0.62]) f.line(r[0] + (r[2] - r[0]) * q, r[3] - m, r[0] + (r[2] - r[0]) * (q + 0.25), r[3] - (r[3] - r[1]) * 0.35, { w: 1 });
          K.frame(f, [-f.w / 2 + m * 1.6, -f.h / 2 + m * 1.6, f.w / 2 - m * 1.6, -f.h / 2 + f.h * 0.3 - m], { inset: 2.4 });
        } else {
          const g = f.grid(1, 2, { rect: [-f.w / 2 + m * 1.6, -f.h / 2 + m * 1.6, f.w / 2 - m * 1.6, f.h / 2 - m * 1.6], gap: 6, ys: [0, 0.32, 1] });
          for (const r of g) { K.frame(f, r, { inset: 3 }); f.rect(r[0] + m, r[1] + m, r[2] - m, r[3] - m, { w: 0 }); }
        }
        f.rivets(-f.w / 2 + f.mOf(2.5), -f.h / 2 + f.mOf(2.5), -f.w / 2 + f.mOf(2.5), f.h / 2 - f.mOf(2.5), { pitch: 8 });
      };
      M.part('PANELED DOOR', () => {
        // the closed door
        const cs = p.openRight ? -1 : 1; // the closed door's side of x
        const Dc = M.box(cs < 0 ? [-W / 2, D / 2, dz0] : [0.002 * k, D / 2, dz0], cs < 0 ? [-0.002 * k, D / 2 + t, dz1] : [W / 2, D / 2 + t, dz1]);
        panel(Dc, '+y', p.mirror !== 'none');
        M.at(cs * 0.06 * k, D / 2 + t, (dz0 + dz1) / 2, () => { M.sphere(0.018 * k, { isect: false }); });
        // the open door, on its hinge at the outer edge
        const os = -cs;
        M.at(os * W / 2, D / 2, 0, () => M.rz(os > 0 ? -p.ang : p.ang, () => {
          const Do = M.box(os > 0 ? [-dw, 0, dz0] : [0, 0, dz0], os > 0 ? [0, t, dz1] : [dw, t, dz1]);
          panel(Do, '+y', p.mirror === 'both');
          panel(Do, '-y', false);
          M.at(-os * (dw - 0.06 * k), t, (dz0 + dz1) / 2, () => M.sphere(0.018 * k, { isect: false }));
          for (const z of [dz0 + 0.15 * k, dz1 - 0.15 * k]) M.cyl(0.012 * k, z - 0.05 * k, z + 0.05 * k, { isect: false });
        }));
        M.callout('PANELED DOOR', 2, [cs * W / 4, D / 2 + t, (dz0 + dz1) * 0.55], 2.2);
        if (p.mirror !== 'none') M.callout('MIRROR', 1, [cs * W / 4, D / 2 + t, dz1 - 0.4 * k], 1.4);
        out.openX = os * W / 4;
      });
      M.part('INNER LADDER', () => {
        const xo = out.openX;
        const floors = big ? Math.max(2, Math.round((Hc - zb) / 2.4)) : 0;
        for (let i = 1; i < floors; i++) { const z = zb + (Hc - zb) * i / floors; M.box([xo - W / 4 + t, -D / 2 + t, z - 0.04], [xo + W / 4 - t, D / 2 - 0.02, z]); }
        M.at(xo + (big ? 0 : W * 0.06), -D / 2 + t + 0.1, zb + t, () => M.rz(90, () => K.ladder(M, { h: Hc - zb - t, w: Math.min(0.45, W * 0.3) })));
        M.callout('INNER LADDER', 1, [xo, -D / 2 + 0.1, (zb + Hc) * 0.5], 2);
        // hanging rail and coat hangers
        const zh = Hc - 0.16 * Math.min(k, 1.5);
        M.tube([-W / 2 + t, -0.02 * k, zh], [W / 2 - t, -0.02 * k, zh], 0.008 * k, { isect: false });
        for (let i = 0; i < p.nHang; i++) {
          const x = xo - W / 8 + W / 4 * (i + 0.5) / p.nHang;
          M.line([[x, -0.02 * k, zh + 0.03], [x + 0.02, -0.02 * k, zh], [x, -0.02 * k, zh - 0.04], [x - 0.2, -0.02 * k, zh - 0.15], [x + 0.2, -0.02 * k, zh - 0.15], [x, -0.02 * k, zh - 0.04]], { w: 1 });
        }
      });
      if (!big) M.part('DRIVER', () => {
        const xo = out.openX;
        M.box([xo - 0.18, -0.15, zb + t], [xo + 0.18, 0.1, zb + t + 0.42]);
        M.at(xo, -0.06, zb + t + 0.42, () => M.rz(90, () => F.driver(M, { arms: 'bar' })));
        F.steering(M, [xo, D / 2 - 0.02, zb + t], [xo, -0.06 + 0.46, zb + t + 0.78], { r: 0.15 });
        M.callout('DRIVER', 1, [xo, 0, zb + 1.1], 1.3);
      });
      M.part('HEADLAMP', () => {
        for (const b of [1, -1]) F.lampAt(M, [W / 2 + 0.01 * k, b * D * 0.3, 0.13 * k], 0, 0.04 * k);
        M.callout('HEADLAMP', 2, [W / 2 + 0.02 * k, D * 0.3, 0.13 * k], 1);
      });
      if (big) M.part('ROOF RAILING', () => {
        const m = 0.15;
        K.railing(M, [[-W / 2 + m, -D / 2 + m, H], [W / 2 - m, -D / 2 + m, H], [W / 2 - m, D / 2 - m, H], [-W / 2 + m, D / 2 - m, H], [-W / 2 + m, -D / 2 + m, H]], { h: 1.0 });
        M.at(-sx * W * 0.3, 0, H, () => M.rz(135, () => K.whip(M, { h: H * 0.4, lean: 10 })));
        M.at(sx * (W / 2 + 0.15), 0, 0, () => K.ladder(M, { h: H + 1, w: 0.5 }));
        M.callout('ROOF RAILING', 1, [0, D / 2 - m, H + 1], 1.2);
        M.callout('ACCESS LADDER', 1, [sx * (W / 2 + 0.15), 0, H * 0.4], 1.4);
      });
      M.info.mass = [-W / 2, -D / 2 + yc, 0, W / 2, D / 2 + yc, H];
    });
    out.fig = F.figSpot(M, W * 0.75 + 0.6);
    return out;
  },
  vocab(M, p, g) {
    const klass = M.pick([`${g.adj} WARDROBE`, `WARDROBE ${g.form}`, `${M.pick(['BOARDING', 'TOURING', 'COSTUME', 'THEATER'])} WARDROBE ${g.form}`].filter((s) => s.length <= 34));
    const floors = Math.max(2, Math.round((p.H - 0.3 * p.k) / 2.4));
    const brief = p.big
      ? F.fit(M.pick([`Houses a touring company on ${word(floors)} floors and its costumes.`, `Carries ${word(floors)} floors of costumes for a touring opera.`]))
      : F.fit(M.pick([`Takes the clothes to the person instead of the other way round.`, `Carries a week of clothes and one driver to the guest house.`, `A wardrobe that ${g.goes} with its driver inside.`]), 'A wardrobe with its driver inside.');
    return { klass, brief, specs: [['MASS', `${p.big ? Math.round(1.4 * p.k * p.k) : 0.25} T`], ['HANGERS', String(p.big ? 40 * floors : 24)]] };
  },
};

// ===================================================================== rocking chair
const rocker = {
  id: 'rocker', aka: ['rockingchair'],
  plan(M) {
    const big = M.chance(0.5);
    const k = big ? M.r(2.2, 3.2) : M.r(1.0, 1.1);
    const nSp = M.ri(5, 8), arms = M.chance(0.7);
    const az = M.pick([1, -1]) * M.r(54, 65), el = M.r(26, 32);
    const des = desig(M), unit = String(M.ri(1, 30)).padStart(2, '0');
    const H = M.r(1.0, 1.12) * k;
    const lamps = M.chance(0.7);
    return { len: 1.12 * k, wid: 0.6 * k, hgt: H + 0.05 * k, mass: big ? 0.6 * k * k : 0.15, view: [az, el], k, big, nSp, arms, des, unit, H, lamps };
  },
  build(M, p) {
    const { k, big, H } = p;
    const { sy } = sideOf(M);
    const R = 1.3 * k, xa = -0.55 * k, xb = 0.52 * k, bt = 0.055 * k;
    const zbot = (x) => R - Math.sqrt(R * R - x * x);
    const ztop = (x) => zbot(x) + bt;
    const zs = 0.44 * k, yl = 0.25 * k, tr = 0.03 * k;
    const out = {};
    M.part('ROCKER', () => M.mirrorY((s) => {
      const n = 20, pr = [];
      for (let i = 0; i <= n; i++) { const x = xa + (xb - xa) * i / n; pr.push([x, zbot(x) + (x > 0.4 * k ? (x - 0.4 * k) * 0.5 : 0)]); }
      for (let i = n; i >= 0; i--) { const x = xa + (xb - xa) * i / n; pr.push([x, ztop(x) + (x > 0.4 * k ? (x - 0.4 * k) * 0.5 : 0)]); }
      const Rk = M.extrude(pr, yl - tr / 2, yl + tr / 2, { plane: 'xz', smoothDeg: 20 });
      const f = Rk.f('+y');
      if (f.on) {
        for (let i = 1; i < n; i += 1) { const x = xa + (xb - xa) * i / n; const q = F.fl(M, f, [x, yl + tr / 2, (zbot(x) + ztop(x)) / 2]); f.circle(q[0], q[1], f.mOf(0.6), { n: 6 }); }
        if (s * sy > 0) { const q = F.fl(M, f, [-0.1 * k, yl + tr / 2, ztop(-0.1 * k) + 0.06 * k]); void q; }
      }
      M.callout('ROCKER', 2, [0, yl + tr / 2, bt / 2], 2.2);
    }));
    const legTop = [];
    M.part('TURNED LEG', () => {
      for (const s of [1, -1]) for (const x of [0.2 * k, -0.2 * k]) {
        const z0 = ztop(x);
        const top = x > 0 && p.arms ? 0.64 * k : zs - 0.03 * k;
        M.at(x, s * yl, z0, () => F.turned(M, top - z0, 0.028 * k, 'bead'));
        legTop.push([x, s * yl, top]);
      }
      M.callout('TURNED LEG', 4, [0.2 * k, sy * yl, 0.25 * k], 1.4);
      // stretchers
      for (const s of [1, -1]) M.tube([0.2 * k, s * yl, 0.16 * k], [-0.2 * k, s * yl, 0.16 * k], 0.013 * k, { isect: false });
      M.tube([0.2 * k, -yl, 0.18 * k], [0.2 * k, yl, 0.18 * k], 0.014 * k, { isect: false });
    });
    M.part('SEAT', () => {
      const S = M.box([-0.25 * k, -yl - 0.02 * k, zs - 0.045 * k], [0.25 * k, yl + 0.02 * k, zs], { chamfer: 0.04 * k });
      const f = S.f('+x'); if (f.on) { F.seams(f, f.box, { n: 1, m: 1, rivets: true }); K.stencil(f, p.unit, 0, 0, f.h * 0.5, {}); }
      const C = M.box([-0.2 * k, -yl + 0.02 * k, zs], [0.23 * k, yl - 0.02 * k, zs + 0.05 * k], { chamfer: 0.03 * k });
      const cf = C.f('+z'); if (cf.on) F.tufting(cf, [-cf.w / 2 + cf.mOf(3), -cf.h / 2 + cf.mOf(3), cf.w / 2 - cf.mOf(3), cf.h / 2 - cf.mOf(3)], 3, 3);
      M.callout('SEAT CUSHION', 1, [0, 0, zs + 0.05 * k], 1.3);
    });
    M.part('SPINDLE BACK', () => {
      const xt = -0.33 * k, zt = H - 0.06 * k;
      for (const s of [1, -1]) {
        M.tube([-0.2 * k, s * yl, zs - 0.03 * k], [xt, s * yl, H], 0.025 * k, {});
        M.at(xt, s * yl, H, () => F.turned(M, 0.07 * k, 0.03 * k, 'finial'));
      }
      const rail = [];
      for (let i = 0; i <= 10; i++) { const y = -yl + 2 * yl * i / 10; rail.push([xt - 0.04 * k * (1 - (y / yl) ** 2), y, zt]); }
      F.sweep(M, rail, rail.map(() => 0.03 * k), { isect: false });
      for (let i = 1; i <= p.nSp; i++) {
        const y = -yl + 2 * yl * i / (p.nSp + 1);
        const xr = xt - 0.04 * k * (1 - (y / yl) ** 2);
        M.tube([-0.22 * k, y, zs], [xr, y, zt], 0.011 * k, { isect: false });
      }
      M.callout('SPINDLE BACK', 1, [(xt - 0.2 * k) / 2, 0, (zs + H) / 2], 2);
      if (big) M.at(xt, -sy * yl, H + 0.07 * k, () => M.rz(135, () => K.whip(M, { h: H * 0.5, lean: 10 })));
    });
    if (p.arms) M.part('ARMREST', () => {
      for (const s of [1, -1]) {
        const a = [-0.27 * k, s * yl, 0.64 * k], b = [0.26 * k, s * yl, 0.64 * k];
        M.along(a, b, (l) => M.box([0, -0.03 * k, -0.012 * k], [l, 0.03 * k, 0.014 * k], { chamfer: 0.012 * k }));
      }
      M.callout('ARMREST', 2, [0.15 * k, sy * yl, 0.65 * k], 1.3);
    });
    M.part('DRIVER', () => {
      const hx = -0.14 * k;
      M.at(hx, 0, zs + 0.05 * k, () => F.driver(M, { arms: 'bar' }));
      F.steering(M, [0.2 * k, 0, 0.18 * k], [Math.max(hx + 0.45, 0.24 * k), 0, zs + 0.05 * k + 0.34], { r: 0.15 });
      M.callout('DRIVER', 1, [hx, 0, zs + 0.7], 1.2);
      M.callout('STEERING COLUMN', 1, [0.22 * k, 0, zs], 1.3);
    });
    if (p.lamps) M.part('HEADLAMP', () => {
      for (const s of [1, -1]) F.lampAt(M, [0.47 * k, s * yl, ztop(0.47 * k) + 0.06 * k], 0, 0.035 * k);
      M.callout('HEADLAMP', 2, [0.5 * k, sy * yl, ztop(0.47 * k) + 0.06 * k], 1);
    });
    if (big) M.part('ACCESS LADDER', () => {
      M.at(0.05 * k, sy * (yl + 0.18), 0, () => M.rz(90, () => K.ladder(M, { h: zs + 0.9, w: 0.5 })));
      M.callout('ACCESS LADDER', 1, [0.05 * k, sy * (yl + 0.18), zs * 0.5], 1.2);
    });
    M.info.mass = [xa, -yl - 0.02 * k, 0, xb, yl + 0.02 * k, H];
    out.fig = F.figSpot(M, 1.1 * k * 0.7 + 0.7);
    return out;
  },
  vocab(M, p, g) {
    const klass = M.pick([`${g.adj} ROCKING CHAIR`, `ROCKING CHAIR ${g.form}`, `PORCH ROCKING CHAIR ${g.form}`].filter((s) => s.length <= 34));
    const brief = F.fit(M.pick([`Rocks one driver at 40 strokes a minute and ${g.goes}.`, 'Takes a rocking chair and its sitter down to the end of the pier.', 'Carries one seated driver from the porch to the post office.']), 'Carries one seated driver from the porch to the post office.');
    return { klass, brief, specs: [['MASS', `${p.big ? Math.round(0.6 * p.k * p.k * 10) / 10 : 0.15} T`], ['SEATS', '1']] };
  },
};

// ===================================================================== the class
const OBJECTS = [piano, chair, bed, tub, wardrobe, rocker];

export default {
  id: 'furniture',
  family: 'ground',
  weight: 2,
  build(M) {
    return F.runObject(M, F.pickObject(M, OBJECTS), 'ground');
  },
};
