// classes/bathyscaphe.js: deep-sea craft shown out of the water, on a cradle on the quay or
// lifted off it by a crane hook. A crew sphere with a thick viewport under a float tank, a
// cigar hull with a conning tower, a diving saucer, or a diving bell on legs. Manipulator
// arms, lamps on booms, ballast hoppers, thrusters in guards, sample baskets, lifting lugs
// and a stenciled depth rating.

import * as K from '../kit.js';
import * as S from './parts-sea.js';
import { word, thou } from '../words.js';
import { add, sub, mul, norm, lerp, D2R } from '../geom.js';

const JOBS = {
  survey: { job: 'SURVEY', places: ['TRENCH', 'ABYSSAL', 'CANYON', 'DEEP-SEA'] },
  cable: { job: 'CABLE REPAIR', places: ['ABYSSAL', 'OCEAN', 'SHELF'] },
  salvage: { job: 'SALVAGE', places: ['DEEP-SEA', 'SHELF', 'CANYON', 'OCEAN'] },
  pearl: { job: 'PEARL', places: ['REEF', 'LAGOON', 'ATOLL', 'GULF'] },
  sponge: { job: 'SPONGE', places: ['REEF', 'GULF', 'ATOLL', 'BAY'] },
  wreck: { job: 'WRECK SURVEY', places: ['SHELF', 'CHANNEL', 'DEEP-SEA', 'CAPE'] },
};

export default {
  id: 'bathyscaphe',
  family: 'sea',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const form = M.wpick([[2.4, 'trieste'], [2.5, 'cigar'], [2.1, 'saucer'], [1.8, 'bell']]);
    const jobKey = M.pick(form === 'trieste' ? ['survey', 'survey', 'wreck', 'cable'] : form === 'cigar' ? ['cable', 'salvage', 'wreck', 'survey'] : form === 'saucer' ? ['pearl', 'sponge', 'wreck', 'survey'] : ['salvage', 'pearl', 'sponge', 'cable']);
    const J = JOBS[jobKey];
    const place = M.pick(J.places);
    const hang = M.chance(form === 'bell' ? 0.5 : 0.3);
    const lift = hang ? M.r(0.9, 1.6) : 0;
    const side = M.pick([1, -1]);
    const long = form === 'trieste' || form === 'cigar';
    const az = long ? side * M.pick([M.r(48, 60), 180 - M.r(48, 60)]) : side * M.r(30, 55);
    M.setView(az, form === 'trieste' ? M.r(17, 23) : M.r(22, 32));
    const near = side;
    const depth = form === 'trieste' ? M.pick([6000, 8000, 11000]) : form === 'cigar' ? M.pick([2000, 3000, 4500, 6000]) : form === 'saucer' ? M.pick([300, 350, 500]) : M.pick([200, 300, 600, 900]);
    const crew = form === 'trieste' ? M.ri(2, 3) : form === 'cigar' ? M.ri(2, 4) : form === 'saucer' ? 2 : M.ri(1, 3);
    const nArms = jobKey === 'cable' || jobKey === 'salvage' ? 2 : M.wpick([[2, 1], [1, 2]]);
    const pool = [[2, 'lamps'], [1.5, 'basket'], [1.5, 'thrusters'], [1, 'sonar'], [1, 'camera'], [1, 'drill']];
    const eq = new Set(['lamps']);
    const nEq = M.ri(2, 4);
    let g = 0;
    while (eq.size < nEq && g++ < 30) eq.add(M.wpick(pool));
    if (jobKey === 'cable') eq.add('reel');
    if (jobKey === 'pearl' || jobKey === 'sponge') eq.add('basket');
    if (jobKey === 'survey') eq.add('drill');
    const armPose = [M.r(-25, 10), M.r(-60, -20), M.r(-40, 20)];
    const armPose2 = [M.r(-20, 15), M.r(-70, -30), M.r(-30, 30)];
    const unit = String(M.ri(1, 12));
    const rng = M.rng;
    // sizes
    const Lf = M.r(11, 17), Rf = M.r(1.5, 2.0), rs = M.r(0.95, 1.15);
    const Lc = M.r(7, 10.5), Rc = M.r(1.1, 1.45);
    const Rsau = M.r(1.6, 2.1), hsau = M.r(0.55, 0.7);
    const rb = M.r(0.95, 1.25), bellKind = M.pick(['sphere', 'bell']), nLegs = M.pick([3, 4]);
    const finK = M.r(0.8, 1.2);
    const noseP = M.r(0, 1), towerKind = M.pick(['trunk', 'sail']), walk = M.chance(0.7), tailProp = M.chance(0.5);
    const portN = M.ri(1, 3);

    const STAMP = `${thou(depth)} M`;
    let lugs = [], top = 0, info = null;
    const callTop = [];
    const L0 = { lamps: [], arms: [] };

    // ------------------------------------------------ the quay and cradle (ground z = 0)
    const quay = (len, farY) => {
      M.part('QUAY', () => {
        const o = { w: 1, pass: 2, fit: false };
        // the quay edge (coping) on the far side, water below it
        const y0 = -near * farY;
        M.line([[-len / 2, y0, 0], [len / 2, y0, 0]], { ...o, w: 2 });
        M.line([[-len / 2, y0 + near * 0.6, 0], [len / 2, y0 + near * 0.6, 0]], o);
        for (let k = 0; k <= Math.round(len / 1.5); k++) { const x = -len / 2 + k * 1.5; M.line([[x, y0, 0], [x, y0 + near * 0.6, 0]], { ...o, w: 0 }); }
        S.waterStrokes(M, 0, y0 - near * 3.5, len * 0.45, 2.4, 8, rng, { part: 'QUAY', fit: false });
        // the crane track rails
        for (const y of [-0.75, 0.75]) for (const d of [-0.04, 0.04]) M.line([[-len / 2, y + d, 0], [len / 2, y + d, 0]], o);
        // a mooring bollard on the edge
        M.at(len * 0.32, y0 + near * 0.3, 0, () => S.bitt(M, { r: 0.12, gap: 0.01 }));
      });
    };
    // trestle with a curved saddle at x for a body of radius R centered at height zc
    const saddle = (x, R, zc, w) => {
      const zt = zc - R * Math.cos(Math.asin(Math.min(0.95, (w * 0.42) / R)));
      const prof = [[-w / 2, zt - 0.3], [w / 2, zt - 0.3], [w / 2, zt + 0.02]];
      const N = 10, a = Math.asin(Math.min(0.95, (w * 0.42) / R));
      for (let k = 0; k <= N; k++) { const q = a - 2 * a * k / N; prof.push([Math.sin(q) * R, zc - Math.cos(q) * R]); }
      prof.push([-w / 2, zt + 0.02]);
      const Sd = M.extrude(prof, x - 0.14, x + 0.14, { plane: 'yz' });
      for (const k of ['+x', '-x']) { const f = Sd.f(k); if (f.on) f.hatch(f.poly, { angle: 90, gap: 2.4 + (1 - f.tone) * 1.5, w: 0 }); }
      // rubber pad on the saddle
      for (const sy of [-1, 1]) M.box([x - 0.12, sy * w * 0.3 - 0.15, zt - 0.32], [x + 0.12, sy * w * 0.3 + 0.15, zt - 0.3], { isect: false });
      const legH = zt - 0.3;
      if (legH > 0.15) {
        for (const sy of [-1, 1]) {
          M.box([x - 0.12, sy * w * 0.42 - 0.12, 0], [x + 0.12, sy * w * 0.42 + 0.12, legH]);
          M.tube([x, sy * w * 0.42, legH * 0.2], [x, -sy * w * 0.1, legH * 0.92], 0.05, { isect: false });
          M.box([x - 0.25, sy * w * 0.42 - 0.25, 0], [x + 0.25, sy * w * 0.42 + 0.25, 0.06], { isect: false });
        }
      }
      return zt;
    };
    const trolley = (len, w) => {
      M.part('CRADLE TROLLEY', () => {
        const S1 = M.box([-len / 2, -w / 2, 0.38], [len / 2, w / 2, 0.62]);
        for (const k of ['+y', '-y', '+x', '-x']) { const f = S1.f(k); if (f.on) { const n = Math.round(f.w / 0.6); for (let i = 1; i < n; i++) { const x = -f.w / 2 + f.w * i / n; f.line(x, -f.h / 2, x, f.h / 2, { w: 1 }); } if (f.tone > 0.3) f.hatch(f.box, { angle: 90, gap: 3 - f.tone, w: 0 }); } }
        for (const x of [-len * 0.36, len * 0.36]) for (const y of [-0.75, 0.75]) M.at(x, y, 0.3, () => K.wheel(M, { r: 0.3, w: 0.14, hub: 0.15 }));
        M.callout('CRADLE TROLLEY', 1, [len * 0.3, near * w / 2, 0.5], 1);
      });
      return 0.62;
    };

    // ------------------------------------------------ hanging gear
    const hookOver = (pts, zTop) => {
      M.part('LIFTING SLING', () => {
        const c = pts.reduce((a, p) => add(a, mul(p, 1 / pts.length)), [0, 0, 0]);
        const hz = zTop + 2.4;
        for (const p of pts) M.line([p, [c[0], c[1], hz]], { w: 1, pass: 1 });
        M.at(c[0], c[1], hz, () => {
          M.boxc([0, 0, 0.45], [0.5, 0.28, 0.7]);
          M.at(0, 0, 0.6, () => M.rx(90, () => M.cyl(0.22, -0.16, 0.16, { isect: false })));
          const hp = [];
          for (let k = 0; k <= 8; k++) { const a = (-40 + 240 * k / 8) * D2R; hp.push([Math.sin(a) * 0.18, 0, -0.1 - Math.cos(a) * 0.18 + 0.1]); }
          M.pipe([[0, 0, 0.12], ...hp], 0.05, { isect: false });
        });
        M.line([[c[0] - 0.08, c[1], hz + 0.8], [c[0] - 0.08, c[1], hz + 9]], { w: 1, pass: 1, fit: false });
        M.line([[c[0] + 0.08, c[1], hz + 0.8], [c[0] + 0.08, c[1], hz + 9]], { w: 1, pass: 1, fit: false });
        M.callout('CRANE HOOK', 1, [c[0], c[1], hz + 0.4], 1.6);
      });
    };
    const lug = (p, along = [1, 0, 0]) => {
      M.with({ at: p, rz: Math.atan2(along[1], along[0]) / D2R }, () => {
        const P = M.box([-0.18, -0.04, -0.1], [0.18, 0.04, 0.32]);
        for (const k of ['+y', '-y']) { const f = P.f(k); if (f.on) f.circle(0, f.h * 0.15, 0.07, { w: 1 }); }
        M.box([-0.3, -0.18, -0.12], [0.3, 0.18, -0.05], { isect: false });
      });
      lugs.push(add(p, [0, 0, 0.25]));
      M.callout('LIFTING LUG', lugs.length, add(p, [0, 0, 0.2]), 0.9);
    };

    // ------------------------------------------------ parts that every form can use
    const lampBoom = (from, to) => {
      M.tube(from, to, 0.05, { isect: false });
      const d = sub(to, from);
      M.with({ at: to, rz: Math.atan2(d[1], d[0]) / D2R, ry: 18 }, () => K.lamp(M, { r: 0.12 }));
      L0.lamps.push(to);
    };
    const arm = (base, yaw, pose, len) => {
      // shoulder, upper arm, forearm, wrist and a two-finger claw, reaching forward (+x)
      const c = Math.cos(yaw * D2R), s = Math.sin(yaw * D2R);
      const dir = (a) => [c * Math.cos(a * D2R), s * Math.cos(a * D2R), Math.sin(a * D2R)];
      const p1 = add(base, mul(dir(pose[0]), len * 0.45));
      const p2 = add(p1, mul(dir(pose[0] + pose[1] * 0.5), len * 0.4));
      const p3 = add(p2, mul(dir(pose[0] + pose[1] + pose[2] * 0.5), len * 0.18));
      M.at(base[0], base[1], base[2], () => M.rz(yaw, () => M.ry(90, () => M.cyl(0.13, -0.05, 0.18))));
      K.ball(M, base, 0.14);
      M.tube(base, p1, 0.07, { isect: false });
      M.tube(add(base, [0, 0, 0.12]), lerp(add(base, [0, 0, 0.12]), p1, 0.65), 0.04, { isect: false, shade: false });
      K.ball(M, p1, 0.1);
      M.tube(p1, p2, 0.055, { isect: false });
      K.ball(M, p2, 0.08);
      M.tube(p2, p3, 0.06, { isect: false });
      const d = norm(sub(p3, p2));
      const side = norm([-d[1], d[0], 0]);
      for (const sg of [1, -1]) M.pipe([p3, add(add(p3, mul(d, 0.12)), mul(side, sg * 0.1)), add(add(p3, mul(d, 0.26)), mul(side, sg * 0.03))], 0.025, { isect: false });
      L0.arms.push(add(lerp(p1, p2, 0.5), [0, 0, 0.08]));
    };
    const thruster = (p, yaw, r) => M.with({ at: p, rz: yaw }, () => {
      K.ductedFan(M, { r, blades: 4 });
      M.boxc([0, 0, r * 1.2], [r * 0.4, 0.06, r * 0.5], { isect: false });
    });
    const basket = (p, w) => M.at(p[0], p[1], p[2], () => {
      const Bk = M.box([-w / 2, -w * 0.6, -w * 0.5], [w / 2, w * 0.6, 0]);
      for (const k of ['+x', '-x', '+y', '-y', '+z']) { const f = Bk.f(k); if (!f.on) continue; f.rect(f.box, { w: 1 }); f.hatch(f.box, { angle: 45, gap: 2.2, w: 0 }); f.hatch(f.box, { angle: -45, gap: 2.2, w: 0 }); }
      return Bk;
    });
    const viewport = (p, dir, r) => {
      // a thick conical window boss with a bolt ring, sticking out along dir
      const yaw = Math.atan2(dir[1], dir[0]) / D2R, pitch = Math.asin(Math.max(-1, Math.min(1, dir[2]))) / D2R;
      M.with({ at: p, rz: yaw, ry: 90 - pitch }, () => {
        M.cyl(r * 1.35, -0.1, 0.06);
        const W = M.cone(r * 1.05, r * 0.72, 0.06, 0.24);
        if (M.decorOn) W.lat.ring(0.5, { w: 0 });
        const G = M.cyl(r * 0.62, 0.24, 0.26);
        if (G.top.on) { G.top.circle(0, 0, r * 0.56, { w: 1 }); K.glass(G.top, Array.from({ length: 16 }, (_, k) => [Math.cos(k * Math.PI / 8) * r * 0.55, Math.sin(k * Math.PI / 8) * r * 0.55]), { gap: 0.8, gap2: 1.8 }); }
        const Bt = M.cyl(r * 1.35, -0.1, 0.06, { decorOff: true });
        void Bt;
        if (M.decorOn) { const n = 10; for (let k = 0; k < n; k++) { const a = k * 2 * Math.PI / n; M.at(Math.cos(a) * r * 1.18, Math.sin(a) * r * 1.18, 0.06, () => M.cyl(0.035, 0, 0.05, { isect: false, seg: 6 })); } }
      });
    };

    // ------------------------------------------------ forms
    let nearPt = [0, 0, 1];
    if (form === 'trieste') {
      const zs = 0.62 + 0.55 + rs + lift;
      const zf = zs + rs + 0.4 + Rf;
      quay(Lf + 5, Rf + 3);
      // cradle: two trestles under the float
      M.part('CRADLE', () => {
        for (const x of [-Lf * 0.3, Lf * 0.3]) saddle(x, Rf, zf - lift, Rf * 1.6);
        M.callout('CRADLE', 2, [Lf * 0.3, near * Rf * 0.6, (zf - lift - Rf) * 0.5], 1.2);
      });
      M.part('FLOAT TANK', () => {
        const nb = 1 + noseP * 1.2;
        const prof = [[0, -Lf / 2], [Rf * 0.4, -Lf / 2 + Rf * 0.1], [Rf * 0.72, -Lf / 2 + Rf * 0.5], [Rf * 0.92, -Lf / 2 + Rf * 1.2], [Rf, -Lf / 2 + Rf * 2.2], ...Array.from({ length: 8 }, (_, k) => { const q = k / 8 * Math.PI / 2; return [Rf * Math.cos(q), Lf / 2 - Rf * nb + Rf * nb * Math.sin(q)]; }), [0, Lf / 2]];
        const T = M.at(0, 0, zf, () => M.lathe(prof, { axis: 'x' }));
        if (M.decorOn) {
          const Lt = T.lat;
          for (let k = 1; k < 12; k++) Lt.ring(k / 12, { w: k % 3 ? 0 : 1 });
          for (const a of [0, 45, 135, 225, 315]) Lt.meridian(a, 0.1, 0.9, { w: 0 });
          Lt.shade({ t0: 0.02, t1: 0.98, gap: 2.2, gapMax: 9 });
          const aN = near * 90 + near * 18;
          Lt.text(STAMP, aN, 0.36, Rf * 0.26, { along: true });
          Lt.text(unit, aN, 0.62, Rf * 0.6, { along: true });
        }
        info = T.bbox.slice();
        M.callout('FLOAT TANK', 1, [Lf * 0.1, near * Rf * 0.98, zf + Rf * 0.36], 3);
        // walkway on top, with a railing or open slats
        const WK = M.box([-Lf * 0.38, -0.45, zf + Rf - 0.08], [Lf * 0.38, 0.45, zf + Rf + 0.05]);
        const wt = WK.f('+z');
        if (wt.on) { const n = Math.round(wt.w / 0.3); for (let k = 1; k < n; k++) { const x = -wt.w / 2 + wt.w * k / n; wt.line(x, -wt.h / 2, x, wt.h / 2, { w: 0 }); } }
        if (walk) for (const sy of [-1, 1]) K.railing(M, [[-Lf * 0.36, sy * 0.42, zf + Rf + 0.05], [Lf * 0.36, sy * 0.42, zf + Rf + 0.05]], { h: 0.8, posts: 1.4, r: 0.025 });
        M.callout('WALKWAY', 1, [-Lf * 0.25, 0, zf + Rf + 0.06], 0.7);
        if (towerKind === 'trunk') {
          const Tr = M.cyl(0.45, zf + Rf - 0.1, zf + Rf + 1.1);
          if (M.decorOn) Tr.lat.shade({ gap: 1.6 });
          M.at(0, 0, zf + Rf + 1.1, () => { M.cyl(0.55, 0, 0.1); M.at(-0.5, 0, 0.1, () => M.ry(-55, () => M.cyl(0.45, 0, 0.06, { isect: false }))); });
          M.callout('ACCESS TRUNK', 1, [0, near * 0.47, zf + Rf + 0.7], 1.5);
        } else {
          const sail = [[-1.3, -0.35], [0.6, -0.35], [1.1, -0.2], [1.3, 0], [1.1, 0.2], [0.6, 0.35], [-1.3, 0.35], [-1.6, 0]];
          const C = M.extrude(sail, zf + Rf - 0.1, zf + Rf + 1.5, { smoothDeg: 40 });
          for (let k = 0; k < sail.length; k++) { const f = C.f('s' + k); if (f.on && f.w > 0.4) f.hatch(f.box, { angle: 90, gap: 3.8 - 1.8 * f.tone, w: 0 }); }
          const ct = C.f('+z'); if (ct.on) { ct.circle(0, 0, 0.3, { w: 1 }); ct.circle(0, 0, 0.24, { w: 1 }); }
          for (const sy of [1, -1]) M.with({ at: [0.9, sy * 0.3, zf + Rf + 1.05], rz: sy * 25 }, () => K.lamp(M, { r: 0.1 }));
          M.callout('CONNING TOWER', 1, [0, near * 0.37, zf + Rf + 0.9], 1.6);
        }
        if (tailProp) {
          M.at(-Lf / 2 - 0.25, 0, zf, () => M.rz(180, () => K.ductedFan(M, { r: Rf * 0.45, blades: 4 })));
          M.callout('STERN PROPELLER', 1, [-Lf / 2 - 0.25, near * Rf * 0.5, zf], 1.5);
        }
        // tail fin and stern propellers
        lugs = [];
        for (const x of [-Lf * 0.25, Lf * 0.25]) lug([x, 0, zf + Rf + 0.05]);
      });
      M.part('CREW SPHERE', () => {
        M.cyl(0.4, zs + rs * 0.7, zf - Rf * 0.8);
        const Sp = M.at(0, 0, zs, () => M.sphere(rs));
        if (M.decorOn) { Sp.lat.ring(0.5, { w: 1 }); Sp.lat.ring(0.47, { w: 1 }); for (let k = 0; k < 8; k++) Sp.lat.meridian(k * 45, 0.08, 0.92, { w: 0 }); Sp.lat.shade({ gap: 1.6 }); }
        const vd = norm([1, 0, -0.25]);
        viewport(add([0, 0, zs], mul(vd, rs * 0.97)), vd, 0.2);
        M.callout('CREW SPHERE', 1, [0, near * rs * 1.04, zs], 3);
        M.callout('VIEWPORT', 1, add([0, 0, zs], mul(vd, rs * 1.15)), 2.2);
        nearPt = [rs, 0, zs];
      });
      M.part('BALLAST HOPPER', () => {
        for (const x of [-(rs + 1.0), rs + 1.0]) {
          const H = M.at(x, 0, zf - Rf * 0.8, () => M.lathe([[0.12, -1.2], [0.2, -1.05], [0.75, -0.25], [0.8, 0.0]]));
          if (M.decorOn) { H.lat.shade({ gap: 1.6 }); H.lat.ring(0.75, { w: 1 }); }
          M.at(x, 0, zf - Rf * 0.8 - 1.2, () => M.cyl(0.14, -0.15, 0.02));
        }
        M.callout('BALLAST HOPPER', 2, [rs + 1.0, near * 0.6, zf - Rf * 0.8 - 0.5], 2);
      });
      if (eq.has('lamps')) M.part('LAMP BOOM', () => {
        for (const sy of [1, -1]) lampBoom([rs * 0.3, sy * 0.4, zf - Rf * 0.85], [rs + 1.7, sy * 1.2, zs - 0.2]);
        M.callout('LAMP BOOM', 2, [rs + 1.7, near * 1.2, zs - 0.1], 1.6);
      });
      M.part('MANIPULATOR ARM', () => {
        for (let k = 0; k < nArms; k++) arm([rs * 0.85, (k ? -1 : 1) * 0.4 * (nArms - 1), zs - rs * 0.5], (k ? -1 : 1) * 15 * (nArms - 1), k ? armPose2 : armPose, 2.0);
        M.callout('MANIPULATOR ARM', nArms, L0.arms[0], 2.2);
      });
      if (eq.has('thrusters')) M.part('THRUSTER', () => {
        for (const sy of [1, -1]) thruster([-Lf / 2 + Rf * 1.4, sy * Rf * 0.95, zf + Rf * 0.55], 0, 0.35);
        M.callout('STERN THRUSTER', 2, [-Lf / 2 + Rf * 1.4, near * Rf * 1.0, zf + Rf * 0.9], 1.4);
      });
      top = zf + Rf + 1.2;
    } else if (form === 'cigar') {
      const zt = 0.62;
      quay(Lc + 5, Rc + 2.8);
      trolley(Lc * 0.75, Rc * 1.6);
      const zc = zt + 0.35 + Rc + lift;
      M.part('CRADLE', () => {
        for (const x of [-Lc * 0.25, Lc * 0.22]) {
          const zt2 = zc - lift - Rc * Math.cos(Math.asin(0.6));
          M.box([x - 0.15, -Rc * 0.7, zt], [x + 0.15, Rc * 0.7, zt2 - 0.02]);
        }
        M.callout('CRADLE', 2, [Lc * 0.22, near * Rc * 0.7, zt + 0.2], 1);
      });
      M.part('PRESSURE HULL', () => {
        const prof = [[0, -Lc / 2], [Rc * 0.3, -Lc / 2 + 0.05], [Rc * 0.55, -Lc / 2 + Rc * 0.6], [Rc * 0.9, -Lc / 2 + Rc * 1.6], [Rc, -Lc / 2 + Rc * 2.4], [Rc, Lc / 2 - Rc * 0.9], [Rc * 0.92, Lc / 2 - Rc * 0.45], [Rc * 0.7, Lc / 2 - Rc * 0.12], [Rc * 0.5, Lc / 2]];
        const T = M.at(0, 0, zc, () => M.lathe(prof, { axis: 'x' }));
        if (M.decorOn) {
          const Lt = T.lat;
          for (let k = 1; k < 10; k++) Lt.ring(k / 10, { w: k % 3 ? 0 : 1 });
          Lt.shade({ t0: 0.02, t1: 0.98, gap: 2.2, gapMax: 9 });
          const aN = near * 90 + near * 20;
          Lt.text(STAMP, aN, 0.42, Rc * 0.24, { along: true });
        }
        info = T.bbox.slice();
        // acrylic bow dome
        const D = M.at(Lc / 2, 0, zc, () => M.ry(90, () => M.lathe([[Rc * 0.52, 0], [Rc * 0.45, Rc * 0.25], [Rc * 0.25, Rc * 0.42], [0, Rc * 0.48]])));
        if (M.decorOn) { D.lat.ring(0.4, { w: 1 }); for (const a of [0, 90, 180, 270]) D.lat.meridian(a, 0, 0.9, { w: 1 }); D.lat.hatch(near > 0 ? 20 : 200, near > 0 ? 160 : 340, 0.05, 0.85, { gap: 1.3 }); }
        M.callout('ACRYLIC BOW DOME', 1, [Lc / 2 + Rc * 0.25, near * Rc * 0.35, zc + Rc * 0.35], 2.6);
        M.callout('PRESSURE HULL', 1, [0, near * Rc * 0.99, zc + Rc * 0.26], 2.5);
        // side ports
        for (let k = 0; k < portN; k++) for (const sy of [1, -1]) viewport([Lc / 2 - Rc * (0.9 + k * 0.8), sy * Rc * 0.82, zc + Rc * 0.45], norm([0.15, sy, 0.55]), 0.11);
        // conning tower
        const ct = [[-0.9, -0.42], [0.6, -0.42], [0.95, -0.25], [1.05, 0], [0.95, 0.25], [0.6, 0.42], [-0.9, 0.42], [-1.1, 0]];
        const C = M.extrude(ct.map(([x, y]) => [x * Rc * 0.9, y * Rc * 0.9]), zc + Rc * 0.7, zc + Rc + 0.9, { smoothDeg: 40 });
        const ctf = C.f('+z');
        if (ctf.on) { ctf.circle(0, 0, Rc * 0.28, { w: 1 }); ctf.circle(0, 0, Rc * 0.22, { w: 1 }); }
        for (let k = 0; k < ct.length; k++) { const f = C.f('s' + k); if (f.on && f.w > 0.5) { f.hatch([-f.w / 2, -f.h / 2, f.w / 2, f.h / 2], { angle: 90, gap: 3.6 - 1.8 * f.tone, w: 0 }); } }
        M.at(-Rc * 0.3, 0, zc + Rc + 0.9, () => { M.cyl(0.04, 0, 1.1); M.at(0, 0, 1.1, () => K.lamp(M, { r: 0.07 })); });
        M.callout('CONNING TOWER', 1, [0, near * Rc * 0.38, zc + Rc + 0.6], 2);
        // cruciform tail with a ducted propeller
        for (const a of [0, 90, 180, 270]) M.at(0, 0, zc, () => M.rot([1, 0, 0], a + 45, () => M.plate([[-Lc / 2 + Rc * 1.7, 0, Rc * 0.5], [-Lc / 2 + Rc * 0.5, 0, Rc * (0.45 + 0.45 * finK)], [-Lc / 2 + Rc * 0.15, 0, Rc * (0.42 + 0.45 * finK)], [-Lc / 2 + Rc * 0.3, 0, Rc * 0.25]], { isect: true, girth: 0.05 })));
        M.at(-Lc / 2 - 0.3, 0, zc, () => M.rz(180, () => K.ductedFan(M, { r: Rc * 0.55, blades: 5 })));
        M.callout('STERN PROPELLER', 1, [-Lc / 2 - 0.3, near * Rc * 0.55, zc], 1.6);
        // skids
        for (const sy of [-1, 1]) {
          M.pipe([[-Lc * 0.35, sy * Rc * 0.62, zc - Rc - 0.25], [Lc * 0.3, sy * Rc * 0.62, zc - Rc - 0.25], [Lc * 0.38, sy * Rc * 0.62, zc - Rc * 0.7]], 0.07, { isect: false });
          for (const x of [-Lc * 0.25, Lc * 0.2]) M.tube([x, sy * Rc * 0.62, zc - Rc - 0.25], [x, sy * Rc * 0.5, zc - Rc * 0.82], 0.05, { isect: true });
        }
        lugs = [];
        for (const x of [-Lc * 0.25, Lc * 0.25]) lug([x, 0, zc + Rc * 0.98]);
        nearPt = [Lc / 2, 0, zc];
      });
      if (eq.has('lamps')) M.part('LAMP BOOM', () => {
        for (const sy of [1, -1]) lampBoom([Lc / 2 - Rc * 0.8, sy * Rc * 0.8, zc + Rc * 0.4], [Lc / 2 + 0.4, sy * Rc * 1.3, zc + Rc * 0.7]);
        M.callout('LAMP BOOM', 2, [Lc / 2 + 0.4, near * Rc * 1.3, zc + Rc * 0.8], 1.6);
      });
      M.part('MANIPULATOR ARM', () => {
        for (let k = 0; k < nArms; k++) { const sy = nArms === 1 ? near : (k ? -1 : 1); arm([Lc / 2 - Rc * 0.4, sy * Rc * 0.55, zc - Rc * 0.55], sy * 15, k ? armPose2 : armPose, 2.0); }
        M.callout('MANIPULATOR ARM', nArms, L0.arms[0], 2.2);
      });
      if (eq.has('thrusters')) M.part('THRUSTER', () => {
        for (const sy of [1, -1]) thruster([-Lc * 0.05, sy * (Rc + 0.45), zc + Rc * 0.1], 90, 0.3);
        for (const sy of [1, -1]) M.tube([-Lc * 0.05, sy * Rc * 0.9, zc + Rc * 0.1], [-Lc * 0.05, sy * (Rc + 0.2), zc + Rc * 0.1], 0.06, { isect: true });
        M.callout('SIDE THRUSTER', 2, [-Lc * 0.05, near * (Rc + 0.45), zc + Rc * 0.45], 1.4);
      });
      top = zc + Rc + 2.1;
    } else if (form === 'saucer') {
      quay(Rsau * 2 + 4, Rsau + 2);
      const zb = 0.62 + 0.15 + 0.35 + lift;
      const H = Rsau * hsau;
      const zc = zb + H * 0.5 + 0.35;
      M.part('CRADLE', () => {
        const T = M.torus(Rsau * 0.62, 0.08, { rings: 8 });
        void T;
        M.at(0, 0, 0.0, () => {
          for (let k = 0; k < 4; k++) { const a = (k * 90 + 45) * D2R; M.tube([Math.cos(a) * Rsau * 0.62, Math.sin(a) * Rsau * 0.62, 0], [Math.cos(a) * Rsau * 0.62, Math.sin(a) * Rsau * 0.62, 0.62 + 0.15], 0.08, {}); M.box([Math.cos(a) * Rsau * 0.62 - 0.22, Math.sin(a) * Rsau * 0.62 - 0.22, 0], [Math.cos(a) * Rsau * 0.62 + 0.22, Math.sin(a) * Rsau * 0.62 + 0.22, 0.06], { isect: false }); }
          M.at(0, 0, 0.62 + 0.15, () => M.torus(Rsau * 0.62, 0.09, { rings: 8 }));
        });
        M.callout('CRADLE RING', 1, [Rsau * 0.62 * near * 0.7, near * Rsau * 0.44, 0.77], 1);
      });
      M.part('HULL', () => {
        const B = M.at(0, 0, zc, () => M.scale(Rsau, Rsau, H * 0.5, () => M.lathe([[0, -1], [0.45, -0.94], [0.8, -0.65], [0.97, -0.25], [1, 0], [0.97, 0.25], [0.8, 0.6], [0.5, 0.88], [0, 1]], { sharpDeg: 60 })));
        if (M.decorOn) {
          const Lt = B.lat;
          Lt.ring(0.5, { w: 1 }); Lt.ring(0.53, { w: 1 }); Lt.ring(0.35, { w: 0 }); Lt.ring(0.7, { w: 0 });
          for (let k = 0; k < 12; k++) Lt.meridian(k * 30, 0.53, 0.92, { w: 0 });
          for (let k = 0; k < 12; k++) Lt.meridian(k * 30 + 15, 0.1, 0.47, { w: 0 });
          for (let k = 0; k < 24; k++) Lt.port(k * 15, 0.565, Rsau * 0.012);
          Lt.ring(0.8, { w: 1 });
          Lt.hatch(0, 360, 0.5, 0.53, { gap: 1.5 });
          Lt.shade({ gap: 1.6, t0: 0.05, t1: 0.95 });
          Lt.text(STAMP, near * 90, 0.62, H * 0.14);
        }
        info = B.bbox.slice();
        // a rubbing band round the rim
        M.at(0, 0, zc, () => M.torus(Rsau * 1.0, 0.07, { rings: 8 }));
        for (let k = 0; k < 8; k++) M.callout('RUBBING BAND', 1, [Math.cos(k * Math.PI / 4) * Rsau * 1.07, Math.sin(k * Math.PI / 4) * Rsau * 1.07, zc + 0.03], 0.8);
        // two forward viewports, hatch dome on top
        for (const sy of [1, -1]) { const vd = norm([0.9, sy * 0.3, 0.3]); viewport([Rsau * 0.86, sy * Rsau * 0.28, zc + H * 0.12], vd, 0.13); M.callout('VIEWPORT', 2, add([Rsau * 0.86, sy * Rsau * 0.28, zc + H * 0.12], mul(vd, 0.3)), 2.2); }
        const Dm = M.at(-Rsau * 0.15, 0, zc + H * 0.47, () => K.cupola(M, { r: Rsau * 0.25, h: 0.15, windows: 6 }));
        void Dm;
        // jet nozzles on the sides
        for (const sy of [1, -1]) M.with({ at: [-Rsau * 0.1, sy * Rsau * 0.98, zc], rz: sy * 90 + 180 }, () => { M.ry(90, () => { M.cyl(0.14, -0.2, 0.15); M.cone(0.16, 0.1, 0.15, 0.35); }); });
        // three legs with feet
        for (let k = 0; k < 3; k++) {
          const a = (k * 120 + 60) * D2R;
          const top0 = [Math.cos(a) * Rsau * 0.55, Math.sin(a) * Rsau * 0.55, zc - H * 0.4];
          const foot = [Math.cos(a) * Rsau * 0.7, Math.sin(a) * Rsau * 0.7, zb - 0.32];
          K.strut(M, top0, foot, 0.06, {});
          M.at(foot[0], foot[1], foot[2] - 0.06, () => M.cyl(0.2, 0, 0.06));
        }
        lugs = [];
        for (let k = 0; k < 3; k++) { const a = (k * 120) * D2R; lug([Math.cos(a) * Rsau * 0.5, Math.sin(a) * Rsau * 0.5, zc + H * 0.4], [-Math.sin(a), Math.cos(a), 0]); }
        M.callout('SAUCER HULL', 1, [Rsau * 0.3, near * Rsau * 0.62, zc + H * 0.38], 3);
        M.callout('WATER JET', 2, [-Rsau * 0.1, near * Rsau * 1.1, zc], 1.4);
        M.callout('HATCH DOME', 1, [-Rsau * 0.15, near * Rsau * 0.2, zc + H * 0.6], 1.3);
        nearPt = [Rsau, 0, zc];
      });
      if (eq.has('lamps')) M.part('LAMP BOOM', () => {
        for (const sy of [1, -1]) lampBoom([Rsau * 0.75, sy * Rsau * 0.55, zc + H * 0.25], [Rsau * 1.3, sy * Rsau * 0.7, zc + H * 0.5]);
        M.callout('LAMP BOOM', 2, [Rsau * 1.3, near * Rsau * 0.7, zc + H * 0.55], 1.6);
      });
      M.part('MANIPULATOR ARM', () => {
        arm([Rsau * 0.92, 0, zc - H * 0.15], 0, armPose, 1.5);
        M.callout('MANIPULATOR ARM', 1, L0.arms[0], 2.2);
      });
      top = zc + H * 0.7;
    } else {
      // diving bell on legs, standing on the quay or lifted off it
      quay(rb * 2 + 4.5, rb + 2.2);
      const legH = 1.1;
      const zc = legH + rb + lift;
      M.part('LEG', () => {
        for (let k = 0; k < nLegs; k++) {
          const a = (k * 360 / nLegs + 45) * D2R;
          const top0 = [Math.cos(a) * rb * 0.7, Math.sin(a) * rb * 0.7, zc - rb * 0.55];
          const foot = [Math.cos(a) * (rb * 1.15), Math.sin(a) * (rb * 1.15), lift + 0.15];
          K.strut(M, top0, foot, 0.08, {});
          const side = [Math.cos(a + 0.6) * rb * 0.85, Math.sin(a + 0.6) * rb * 0.85, zc - rb * 0.3];
          M.tube(side, lerp(top0, foot, 0.55), 0.045, { isect: true });
          M.at(foot[0], foot[1], lift, () => K.footpad(M, { r: 0.35 }));
        }
        M.callout('LANDING LEG', nLegs, [Math.cos(45 * D2R) * rb, near * Math.sin(45 * D2R) * rb, zc - rb], 1.8);
      });
      M.part('DIVING BELL', () => {
        let Bd;
        if (bellKind === 'sphere') Bd = M.at(0, 0, zc, () => M.sphere(rb));
        else Bd = M.at(0, 0, zc - rb, () => M.lathe([[rb * 0.95, 0], [rb, 0.15], [rb, rb * 0.9], [rb * 0.85, rb * 1.45], [rb * 0.5, rb * 1.8], [0, rb * 1.9]], { sharpDeg: 40 }));
        if (M.decorOn) {
          const Lt = Bd.lat;
          for (const t of [0.3, 0.5, 0.7]) Lt.ring(t, { w: t === 0.5 ? 1 : 0 });
          Lt.shade({ gap: 1.6 });
          Lt.text(STAMP, near * 90 + 30, 0.42, rb * 0.13);
        }
        info = Bd.bbox.slice();
        const zv = bellKind === 'sphere' ? zc : zc - rb * 0.3;
        for (let k = 0; k < 4; k++) {
          const a = (k * 90) * D2R;
          const d = norm([Math.cos(a), Math.sin(a), bellKind === 'sphere' ? 0.15 : 0]);
          viewport([d[0] * rb * 0.97, d[1] * rb * 0.97, zv + d[2] * rb], d, 0.13);
        }
        // collar, lugs and the umbilical
        const zTop = bellKind === 'sphere' ? zc + rb : zc - rb + rb * 1.9;
        M.at(0, 0, zTop - 0.12, () => { M.cyl(0.35, 0, 0.18); });
        lugs = [];
        for (let k = 0; k < 3; k++) { const a = (k * 120 + 30) * D2R; lug([Math.cos(a) * 0.3, Math.sin(a) * 0.3, zTop + 0.04], [-Math.sin(a), Math.cos(a), 0]); }
        K.pipeRun(M, [[0.3, 0, zTop + 0.06], [0.6, 0, zTop + 0.6], [0.4, 0.5, zTop + 2.2]], 0.05, { flanges: false });
        M.callout('DIVING BELL', 1, [0, near * rb * 1.1, zc + rb * 0.25], 3);
        for (let k = 0; k < 4; k++) M.callout('VIEWPORT', 4, [Math.cos(k * Math.PI / 2) * rb * 1.1, Math.sin(k * Math.PI / 2) * rb * 1.1, zv], 2.2);
        M.callout('UMBILICAL HOSE', 1, [0.55, 0.2, zTop + 0.9], 1.2);
        nearPt = [rb, 0, zc];
        top = zTop + 0.5;
      });
      if (eq.has('lamps')) M.part('LAMP BOOM', () => {
        for (const sy of [1, -1]) lampBoom([rb * 0.6, sy * rb * 0.65, zc - rb * 0.2], [rb * 1.5, sy * rb * 0.9, zc - rb * 0.6]);
        M.callout('LAMP BOOM', 2, [rb * 1.5, near * rb * 0.9, zc - rb * 0.5], 1.6);
      });
      M.part('MANIPULATOR ARM', () => {
        arm([rb * 0.75, -near * rb * 0.5, zc - rb * 0.5], -near * 20, armPose, 1.6);
        M.callout('MANIPULATOR ARM', 1, L0.arms[0], 2.2);
      });
    }

    // ------------------------------------------------ shared equipment
    const front = nearPt;
    if (eq.has('basket')) M.part('SAMPLE BASKET', () => {
      const p = add(front, [0.35, near * 0.55, -0.55]);
      basket(p, 0.6);
      M.tube([front[0] - 0.4, p[1], p[2] + 0.05], [p[0] - 0.3, p[1], p[2] - 0.1], 0.04, { isect: false });
      M.callout('SAMPLE BASKET', 1, add(p, [0, 0, 0.05]), 1.8);
    });
    if (eq.has('drill')) M.part('CORE SAMPLER', () => {
      const p = add(front, [-0.15, near * 0.5, -0.35]);
      M.at(p[0], p[1], p[2], () => M.ry(150, () => { M.cyl(0.11, 0, 0.45); M.cyl(0.05, 0.45, 0.9, { isect: false }); M.cone(0.05, 0.01, 0.9, 1.0, { isect: false }); }));
      M.callout('CORE SAMPLER', 1, add(p, [0.2, 0, -0.3]), 1.5);
    });
    if (eq.has('sonar')) M.part('SONAR', () => {
      M.at(info[0] + (info[3] - info[0]) * 0.75, 0, info[5] - 0.05, () => { M.cyl(0.06, 0, 0.4); M.at(0, 0, 0.4, () => M.ry(70, () => K.dish(M, { r: 0.24 }))); });
      M.callout('SONAR DISH', 1, [info[0] + (info[3] - info[0]) * 0.75, 0, info[5] + 0.5], 1.2);
    });
    if (eq.has('camera')) M.part('CAMERA', () => {
      const p = add(front, [0.2, near * 0.75, 0.35]);
      M.tube(add(front, [-0.3, near * 0.4, 0.2]), p, 0.04, { isect: false });
      M.at(p[0], p[1], p[2], () => { M.boxc([0, 0, 0], [0.38, 0.22, 0.24]); M.at(0.19, 0, 0, () => M.ry(90, () => M.cyl(0.07, 0, 0.12))); });
      M.callout('CAMERA', 1, p, 1.4);
    });
    if (eq.has('reel')) M.part('CABLE REEL', () => {
      const p = add(front, [-0.6, -near * 0.9, -0.3]);
      K.winch(M, { r: 0.28, w: 0.5, at: p });
      M.line([add(p, [0, 0, 0.28]), add(front, [1.3, -near * 0.4, -0.8]), add(front, [1.8, -near * 0.3, -front[2] + 0.02])], { w: 1, pass: 1 });
      M.callout('CABLE GRAB', 1, p, 1.6);
    });

    if (hang) hookOver(lugs, top);
    const e = M.view.e;
    const halfL = info ? (info[3] - info[0]) / 2 : 1, halfW = info ? (info[4] - info[1]) / 2 : 1;
    const figSpot = [-Math.sign(e[0] || 1) * halfL * (long ? 0.75 : 0.2), near * (halfW + (long ? 0.9 : 1.0))];
    if (info) M.info.mass = info;

    // ------------------------------------------------ vocabulary
    const formW = { trieste: 'BATHYSCAPHE', cigar: 'SUBMERSIBLE', saucer: 'DIVING SAUCER', bell: 'DIVING BELL' }[form];
    const deep = thou(depth);
    const briefs = {
      survey: `Takes ${word(crew)} observers ${deep} m down to map the trench floor.`,
      cable: `Finds broken sea cables ${deep} m down and grips them for repair.`,
      salvage: `Goes ${deep} m down to cut free and lift wreck cargo.`,
      pearl: `Takes ${word(crew)} divers to the oyster beds and fills a basket.`,
      sponge: `Cuts sponges from the reef wall and brings them up in a basket.`,
      wreck: `Takes ${word(crew)} crew ${deep} m down to look over sunken hulls.`,
    };
    const massT = Math.round((form === 'trieste' ? Lf * Rf * Rf * 3.1 : form === 'cigar' ? Lc * Rc * Rc * 2.4 : form === 'saucer' ? Rsau * Rsau * 2.2 : rb * rb * rb * 5) * 10) / 10;
    return {
      place, job: J.job, form: formW,
      brief: briefs[jobKey],
      figure: figSpot,
      specs: [['DEPTH RATING', `${deep} M`], ['CREW', String(crew)], ['MASS', `${massT >= 20 ? Math.round(massT) : massT} T`], ['ENDURANCE', `${form === 'bell' ? 8 : form === 'saucer' ? 5 : 12} H`]],
    };
  },
};
