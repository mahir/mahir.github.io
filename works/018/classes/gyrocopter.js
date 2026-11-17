// classes/gyrocopter.js: small rotorcraft where the person is a big part of the picture.
// Four forms: a bubble helicopter (open truss tail boom, skids, saddle tanks), an autogyro
// (keel, pusher engine, tricycle wheels, free rotor), a twin-rotor (tandem or side by side)
// and a one-person flying platform on ducted fans. Equipment from a pool: litter pods, a
// mail box, a loudspeaker, a searchlight, floats, a camera boom, a second seat.

import * as A from './parts-air.js';
import { K, D2R, lerp } from './parts-air.js';
import { word } from '../words.js';

const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';

export default {
  id: 'gyrocopter',
  family: 'air',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const form = M.wpick([[3, 'bubble'], [3, 'gyro'], [1.6, 'twin'], [1.4, 'platform']]);
    const s = M.r(0.92, 1.12);                      // overall scale
    const twinKind = M.pick(['tandem', 'side']);
    const two = M.chance(form === 'platform' ? 0 : 0.45);   // second seat / passenger
    const podded = M.chance(0.5);                   // gyro: nose fairing
    const floats = form === 'bubble' && M.chance(0.3);
    const blades = form === 'gyro' ? 2 : M.pick([2, 2, 3]);
    const rotorR = s * (form === 'gyro' ? M.r(3.6, 4.3) : form === 'twin' ? M.r(2.9, 3.4) : M.r(4.6, 5.4));
    const pool = [[3, 'litter'], [2.5, 'mail'], [2, 'horn'], [2.5, 'light'], [1.5, 'camera'], [2, 'lamps'], [1.5, 'whip']];
    const eq = new Set();
    const nEq = M.ri(2, 3);
    for (let k = 0; k < 12 && eq.size < nEq; k++) eq.add(M.wpick(pool));
    if (form === 'platform') { eq.delete('litter'); eq.delete('camera'); }
    const nDuct = M.pick([1, 2, 2, 4]);
    const reg = `${LET[M.ri(0, 22)]}-${LET[M.ri(0, 22)]}${LET[M.ri(0, 22)]}${LET[M.ri(0, 22)]}${LET[M.ri(0, 22)]}`;
    const az = M.pick([1, -1]) * M.r(36, 52) + M.pick([0, 0, 180]);
    const el = M.r(24, 33);
    const phase = M.r(0, 90), phase2 = M.r(0, 90);
    const tilt = M.r(4, 10);
    const place = M.pick(['OUTBACK', 'HIGHLAND', 'DELTA', 'PRAIRIE', 'ISLAND', 'FOREST', 'COASTAL', 'MOUNTAIN', 'CITY']);
    const kw = Math.round(s * M.r(45, 150) / 5) * 5;
    const rangeK = Math.round(M.r(15, 45)) * 10;
    M.setView(az, el);
    const e = M.view.e;
    const sideS = e[1] >= 0 ? 1 : -1;
    const frontS = e[0] >= 0 ? 1 : -1;
    let figure;
    let crew = two ? 2 : 1;

    // ------------------------------------------------ the forms
    if (form === 'bubble') {
      const sk = 1.05 * s, zf = 0.8 * s;        // skid half-track, cabin floor
      // skids or floats
      M.part(floats ? 'FLOAT' : 'SKID', () => {
        for (const y of [sk, -sk]) {
          if (floats) {
            M.at(0.1 * s, y, 0.28 * s, () => {
              const F = M.capsule(0.26 * s, -1.6 * s, 1.7 * s, { axis: 'x', rings: 5 });
              if (M.decorOn) { for (const t of [0.3, 0.45, 0.6]) F.lat.ring(t, { w: 1 }); F.lat.shade({ gap: 1.3, gapMax: 3.5 }); }
            });
          } else {
            M.pipe([[-1.5 * s, y, 0.2 * s], [-1.4 * s, y, 0.05 * s], [1.45 * s, y, 0.05 * s], [1.8 * s, y, 0.3 * s]], 0.045 * s, {});
            for (const x of [-1.0 * s, 1.0 * s]) M.box([x - 0.06 * s, y - 0.035 * s, 0.0], [x + 0.06 * s, y + 0.035 * s, 0.05 * s], { isect: false });
          }
          for (const x of [-0.75 * s, 0.75 * s]) M.pipe([[x, y, floats ? 0.5 * s : 0.06 * s], [x, y * 0.85, zf * 0.75], [x, y * 0.45, zf]], 0.04 * s, { isect: false });
          // step
          if (!floats) {
            M.box([0.15 * s, y - Math.sign(y) * 0.14 * s, 0.32 * s], [0.45 * s, y - Math.sign(y) * 0.02 * s, 0.35 * s], { isect: false });
            for (const x of [0.2 * s, 0.4 * s]) M.tube([x, y - Math.sign(y) * 0.08 * s, 0.32 * s], [x, y - Math.sign(y) * 0.45 * s, zf - 0.12 * s], 0.018 * s, { isect: false });
          }
        }
        M.callout(floats ? 'FLOAT' : 'SKID', 2, [1.0 * s, sideS * sk, floats ? 0.5 * s : 0.06 * s], 1.8);
        if (!floats) M.callout('BOARDING STEP', 2, [0.3 * s, sideS * sk * 0.9, 0.35 * s], 0.7);
      });
      M.part('CABIN', () => {
        // floor tub
        const T = M.box([-0.7 * s, -0.62 * s, zf - 0.18 * s], [1.0 * s, 0.62 * s, zf], { chamfer: 0.1 * s });
        for (const k of ['+y', '-y', '+x']) { const f = T.f(k); if (f.on && f.front) { f.hatch(f.box, { angle: 0, gap: 2.8 - f.tone, w: 0 }); f.rivets(-f.w * 0.45, f.h * 0.3, f.w * 0.45, f.h * 0.3, { pitch: 6 }); } }
        // bench seat and the people
        M.at(-0.25 * s, 0, zf + 0.42 * s, () => { A.seat(M, { w: 1.0 * s }); });
        M.box([-0.5 * s, -0.55 * s, zf], [0.05 * s, 0.55 * s, zf + 0.36 * s]);
        const ys = two ? [0.27 * s, -0.27 * s] : [sideS * 0.27 * s];
        ys.forEach((y, i) => M.at(-0.25 * s, y, zf + 0.42 * s, () => A.pilot(M, { arms: i === 0 ? 'stick' : 'side' })));
        // cyclic, collective, pedals, panel
        M.tube([0.15 * s, ys[0], zf], [0.22 * s, ys[0], zf + 0.6 * s], 0.025 * s, {});
        M.at(0.22 * s, ys[0], zf + 0.6 * s, () => M.sphere(0.04 * s));
        M.at(0.75 * s, 0, zf + 0.42 * s, () => { M.tube([0, 0, -0.42 * s], [0, 0, -0.1 * s], 0.05 * s, {}); A.panel(M, { w: 0.55 * s, h: 0.22 * s }); });
        M.callout('INSTRUMENT PANEL', 1, [0.72 * s, 0, zf + 0.5 * s], 1.2);
        M.callout('PILOT', crew, A.toward(M, [-0.2 * s, ys[0], zf + 0.75 * s], 0.32 * s), 1.6);
        // bubble frame: hoops of tube; the glass itself does not hide what is behind it
        const cx = 0.25 * s, cz = zf, ax = 0.95 * s, ay = 0.72 * s, azz = 1.25 * s;
        const hoop = (fn, n = 18) => { const p = []; for (let i = 0; i <= n; i++) p.push(fn(i / n)); M.pipe(p, 0.025 * s, { isect: false, smoothBends: true }); return p; };
        hoop((t) => { const a = (t * 180 - 0) * D2R; return [cx + Math.cos(a) * ax, 0, cz + Math.sin(a) * azz]; });
        for (const yk of [0.55, -0.55]) hoop((t) => { const a = t * 90 * D2R; const yy = yk; const k = Math.sqrt(1 - yy * yy); return [cx + Math.cos(a) * ax * k, yy * ay, cz + Math.sin(a) * azz * k]; }, 10);
        hoop((t) => { const a = (t * 180 - 90) * D2R; return [cx + Math.cos(a) * ax, Math.sin(a) * ay, cz]; }, 16);
        hoop((t) => { const a = (t * 180) * D2R; return [cx, Math.cos(a) * ay, cz + Math.sin(a) * azz]; }, 14);
        // glints on the near front quarter
        const gp = (u, v) => { const a = u * D2R, b = v * D2R; return [cx + Math.cos(b) * Math.cos(a) * ax, sideS * Math.cos(b) * Math.sin(a) * ay, cz + Math.sin(b) * azz]; };
        for (let i = 0; i < 4; i++) M.line([gp(28 + i * 5, 25 + i * 3), gp(40 + i * 5, 55 + i * 3)], { w: 0, pass: 3 });
        M.callout('BUBBLE CANOPY', 1, gp(10, 70), 2.4);
      });
      M.part('TRANSMISSION', () => {
        const xt = -0.75 * s;
        M.box([xt - 0.35 * s, -0.3 * s, zf], [xt + 0.25 * s, 0.3 * s, zf + 0.9 * s], { chamfer: 0.08 * s });
        M.at(xt - 0.05 * s, 0, zf + 0.9 * s, () => { M.cone(0.22 * s, 0.12 * s, 0, 0.3 * s); M.cyl(0.06 * s, 0.3 * s, 1.15 * s); });
        // engine below and behind, finned cylinders
        M.at(xt - 0.55 * s, 0, zf + 0.25 * s, () => A.boxer(M, { s: 1.2 * s }));
        M.at(xt - 0.6 * s, 0, zf + 0.62 * s, () => M.cyl(0.25 * s, 0, 0.12 * s, { isect: false }));
        // saddle tanks
        for (const y of [0.42 * s, -0.42 * s]) M.at(xt - 0.1 * s, y, zf + 1.25 * s, () => K.tankCapsule(M, { r: 0.2 * s, len: 0.95 * s, axis: 'x' }));
        for (const y of [0.42 * s, -0.42 * s]) for (const x of [xt - 0.4 * s, xt + 0.2 * s]) M.tube([x, y * 0.6, zf + 0.9 * s], [x, y, zf + 1.07 * s], 0.025 * s, { isect: false });
        M.callout('SADDLE TANK', 2, [xt - 0.1 * s, sideS * 0.42 * s, zf + 1.45 * s], 1.3);
        M.callout('ENGINE', 1, [xt - 0.55 * s, sideS * 0.4 * s, zf + 0.25 * s], 1.5);
        M.at(xt - 0.05 * s, 0, zf + 2.1 * s, () => M.rz(phase, () => K.rotor(M, { r: rotorR, blades, chord: 0.24 * s, swash: true, bar: blades === 2 ? 0.9 * s : 0 })));
        M.callout('MAIN ROTOR', 1, [xt - 0.05 * s + rotorR * 0.6 * Math.cos((phase + 15) * D2R), rotorR * 0.6 * Math.sin((phase + 15) * D2R), zf + 2.1 * s + 0.03 * s], 2.2);
        M.callout('ROTOR HEAD', 1, [xt - 0.05 * s, 0, zf + 1.9 * s], 1.2);
      });
      M.part('TAIL BOOM', () => {
        const a = [-1.0 * s, 0, zf + 0.55 * s], b = [-5.3 * s, 0, zf + 0.85 * s];
        K.girder(M, a, b, { w: 0.42 * s, sec: 3, bay: 0.5 * s, battens: true });
        M.tube([a[0], 0, a[2] + 0.38 * s], [b[0] + 0.1 * s, 0, b[2] + 0.36 * s], 0.035 * s, {});
        // tail rotor, fin with registration, stabilizer, guard
        M.at(b[0] - 0.1 * s, 0, b[2], () => {
          const F = M.box([-0.5 * s, -0.02 * s, -0.25 * s], [0.25 * s, 0.02 * s, 0.6 * s], {});
          for (const k of ['+y', '-y']) { const f = F.f(k); if (f.on && f.front) { f.rect(-f.w * 0.42, -f.h * 0.4, f.w * 0.42, f.h * 0.4, { w: 0 }); K.stencil(f, reg, 0, f.h * 0.12, f.h * 0.14); } }
          M.at(-0.1 * s, -0.08 * s, 0.25 * s, () => M.rx(90, () => K.rotor(M, { r: 0.72 * s, blades: 2, chord: 0.09 * s, phase: phase2 })));
          M.pipe([[-0.1 * s, 0, -0.25 * s], [-0.25 * s, 0, -0.55 * s], [-0.6 * s, 0, -0.45 * s]], 0.025 * s, { isect: false });
          M.box([0.6 * s, -0.55 * s, 0.2 * s], [0.9 * s, 0.55 * s, 0.24 * s], {});
        });
        M.callout('TAIL ROTOR', 1, [b[0] - 0.2 * s, -0.08 * s, b[2] + 0.25 * s + 0.6 * s], 1.4);
        M.callout('TRUSS TAIL BOOM', 1, lerp(a, b, 0.45), 2);
        M.info.mass = [b[0] - 0.6 * s, -sk, 0, 1.25 * s, sk, zf + 1.3 * s];
        M.info.centers = [[[-0.8 * s, 0, zf - 0.1 * s], [-0.8 * s, 0, zf + 2.4 * s]]];
      });
      equipment(M, eq, { s, x: 0.0, y: sideS * sk, z: 0.1 * s, sideS, bubble: true, sk, zf, front: [1.2 * s, 0, zf], top: [-0.9 * s, 0, zf + 1.35 * s], tail: [-3.0 * s, 0, zf + 0.75 * s] });
      figure = A.figSpot(M, 3.6 * s, [-1.5 * s, 0]);
    } else if (form === 'gyro') {
      const zk = 0.5 * s, wr = 0.22 * s, track = 0.85 * s;
      M.part('KEEL', () => {
        M.box([-2.5 * s, -0.05 * s, zk - 0.05 * s], [1.3 * s, 0.05 * s, zk + 0.05 * s]);
        M.callout('KEEL TUBE', 1, [-1.8 * s, sideS * 0.05 * s, zk], 1.2);
      });
      M.part('UNDERCARRIAGE', () => {
        M.at(1.15 * s, 0, 0, () => A.gearLeg(M, { h: zk, wr: wr * 0.75, ww: 0.1 * s, r: 0.03 * s }));
        for (const y of [track, -track]) {
          M.at(-0.3 * s, y, wr, () => K.wheel(M, { r: wr, w: 0.12 * s }));
          M.pipe([[-0.3 * s, 0, zk - 0.05 * s], [-0.3 * s, y * 0.5, zk - 0.05 * s], [-0.3 * s, y * 0.92, wr]], 0.03 * s, {});
          M.tube([0.3 * s, 0, zk - 0.05 * s], [-0.3 * s, y * 0.9, wr + 0.05 * s], 0.02 * s, { isect: false });
        }
        M.callout('MAIN WHEEL', 2, [-0.3 * s, sideS * (track + 0.07 * s), wr], 1.3);
        M.callout('NOSE WHEEL', 1, [1.15 * s, sideS * 0.06 * s, wr * 0.75], 0.9);
      });
      const seats = two ? [0.25 * s, -0.45 * s] : [0.05 * s];
      M.part('COCKPIT', () => {
        if (podded) {
          // nose fairing: half shell open at the top
          M.at(-0.2 * s, 0, zk + 0.35 * s, () => {
            const P = M.scale(1, 0.85, 1, () => M.lathe([[0, 1.55 * s], [0.25 * s, 1.45 * s], [0.42 * s, 1.1 * s], [0.5 * s, 0.4 * s], [0.48 * s, -0.4 * s], [0.38 * s, -0.9 * s]], { axis: 'x', a0: -105, a1: 105, open: true }));
            if (M.decorOn) { P.lat.ring(0.55, { w: 1 }); P.lat.shade({ gap: 1.4, gapMax: 4 }); P.lat.text(reg, sideS * 75, 0.55, 0.16 * s, { along: true }); }
          });
          M.callout('NOSE FAIRING', 1, [0.9 * s, 0, zk + 0.1 * s], 1.6);
        }
        seats.forEach((x, i) => {
          M.at(x, 0, zk + 0.3 * s, () => { A.seat(M, { w: 0.45 * s }); A.pilot(M, { arms: i === 0 ? 'stick' : 'side' }); });
          M.tube([x, 0, zk + 0.05 * s], [x, 0, zk + 0.24 * s], 0.04 * s, {});
        });
        // stick, pedals, panel and windscreen
        M.tube([seats[0] + 0.35 * s, 0, zk + 0.05 * s], [seats[0] + 0.3 * s, 0, zk + 0.75 * s], 0.02 * s, {});
        M.at(seats[0] + 0.3 * s, 0, zk + 0.75 * s, () => M.sphere(0.035 * s));
        M.at(seats[0] + 0.85 * s, 0, zk + 0.75 * s, () => { A.panel(M, { w: 0.36 * s, h: 0.16 * s }); });
        M.tube([seats[0] + 0.9 * s, 0, zk + 0.05 * s], [seats[0] + 0.9 * s, 0, zk + 0.67 * s], 0.025 * s, {});
        const ws = [[seats[0] + 0.95 * s, -0.28 * s, zk + 0.82 * s], [seats[0] + 0.95 * s, 0.28 * s, zk + 0.82 * s], [seats[0] + 0.75 * s, 0.22 * s, zk + 1.25 * s], [seats[0] + 0.75 * s, -0.22 * s, zk + 1.25 * s]];
        M.plate(ws, { girth: 0.01 });
        M.pipe([...ws, ws[0]], 0.012 * s, { isect: false });
        for (let i = 0; i < 3; i++) M.line([lerp(lerp(ws[0], ws[1], 0.2 + i * 0.12), ws[3], 0.2), lerp(lerp(ws[0], ws[1], 0.32 + i * 0.12), ws[3], 0.7)], { w: 0, pass: 3 });
        M.callout('WINDSCREEN', 1, lerp(ws[2], ws[0], 0.5), 1.1);
        M.callout('PILOT', crew, A.toward(M, [seats[0] - 0.02 * s, 0, zk + 0.65 * s], 0.32 * s), 1.6);
      });
      const xm = seats[seats.length - 1] - 0.45 * s, zt = zk + 2.0 * s;
      M.part('ROTOR MAST', () => {
        for (const y of [0.06 * s, -0.06 * s]) M.box([xm - 0.06 * s, y - 0.02 * s, zk], [xm + 0.06 * s, y + 0.02 * s, zt], {});
        M.tube([xm + 0.6 * s, 0, zk], [xm, 0, zk + 0.9 * s], 0.03 * s, {});
        M.at(xm, 0, zt, () => {
          M.box([-0.12 * s, -0.1 * s, 0], [0.12 * s, 0.1 * s, 0.14 * s]);
          M.cyl(0.04 * s, 0.14 * s, 0.32 * s);
          M.at(0, 0, 0.36 * s, () => M.ry(-tilt, () => M.rz(phase, () => K.rotor(M, { r: rotorR, blades: 2, chord: 0.2 * s, t: 0.03 * s }))));
          // prerotator belt
          M.tube([-0.12 * s, 0.08 * s, 0.05 * s], [-0.25 * s, 0.08 * s, -0.75 * s], 0.015 * s, { isect: false });
        });
        M.callout('ROTOR MAST', 1, [xm, sideS * 0.08 * s, zk + 1.2 * s], 1.4);
        M.callout('FREE ROTOR', 1, [xm + rotorR * 0.65 * Math.cos((phase + 15) * D2R), rotorR * 0.65 * Math.sin((phase + 15) * D2R), zt + 0.36 * s + rotorR * 0.65 * Math.cos((phase + 15) * D2R) * Math.sin(tilt * D2R) * 0 + 0.03 * s], 2.2);
        M.callout('ROTOR HEAD', 1, [xm, sideS * 0.12 * s, zt + 0.07 * s], 1);
      });
      M.part('ENGINE', () => {
        const ze = zk + 1.15 * s, xe = xm - 0.35 * s;
        M.at(xe, 0, ze, () => A.boxer(M, { s: 1.1 * s }));
        M.tube([xe + 0.2 * s, 0, ze - 0.15 * s], [xm, 0, ze - 0.3 * s], 0.03 * s, {});
        M.at(xe - 0.3 * s, 0, ze, () => M.rz(180, () => K.propeller(M, { r: 0.85 * s, blades: M.decorOn || true ? 3 : 3 })));
        // fuel tank under the seat
        M.at(seats[0] - 0.15 * s, 0, zk - 0.2 * s, () => K.tankCapsule(M, { r: 0.13 * s, len: 0.6 * s, axis: 'x', bands: false }));
        M.callout('PUSHER PROPELLER', 1, [xe - 0.32 * s, sideS * 0.5 * s, ze + 0.4 * s], 2);
        M.callout('FLAT-TWIN ENGINE', 1, [xe, sideS * 0.3 * s, ze], 1.5);
        M.callout('FUEL TANK', 1, [seats[0] - 0.15 * s, sideS * 0.13 * s, zk - 0.2 * s], 0.8);
      });
      M.part('TAIL', () => {
        const xt = -2.5 * s;
        A.foil(M, { root: { x: xt + 0.75 * s, h: zk + 0.05 * s, c: 0.7 * s, t: 0.07 * s }, tip: { x: xt + 0.5 * s, h: zk + 1.05 * s, c: 0.45 * s }, ribs: 3, cs: [{ s0: 0.05, s1: 0.95 }], text: reg, textH: 0.12 * s });
        M.at(0, 0, zk + 0.05 * s, () => M.mirrorY(() => M.rx(-90, () => A.foil(M, { root: { x: xt + 0.65 * s, h: 0.03 * s, c: 0.45 * s, t: 0.045 * s }, tip: { x: xt + 0.55 * s, h: 0.6 * s, c: 0.33 * s }, ribs: 2 }))));
        M.tube([xt + 0.3 * s, 0, zk - 0.05 * s], [xt + 0.1 * s, 0, 0.12 * s], 0.025 * s, {});
        M.at(xt + 0.1 * s, 0, 0.1 * s, () => K.wheel(M, { r: 0.1 * s, w: 0.05 * s }));
        M.callout('RUDDER', 1, [xt + 0.2 * s, sideS * 0.03 * s, zk + 0.6 * s], 1.4);
        M.callout('TAIL WHEEL', 1, [xt + 0.1 * s, sideS * 0.03 * s, 0.1 * s], 0.6);
      });
      M.info.mass = [-2.5 * s, -track, 0, 1.3 * s, track, zk + 1.6 * s];
      M.info.centers = [[[xm, 0, zk - 0.2 * s], [xm, 0, zt + 0.7 * s]], [[-0.3 * s, -track - 0.2 * s, wr], [-0.3 * s, track + 0.2 * s, wr]]];
      equipment(M, eq, { s, x: seats[0] + 0.3 * s, y: sideS * 0.45 * s, z: zk, sideS, front: [1.3 * s, 0, zk + 0.05 * s], top: [xm + 0.1 * s, 0, zk + 1.4 * s], tail: [-1.6 * s, 0, zk], gyro: true });
      figure = A.figSpot(M, 2.8 * s, [-0.5 * s, 0]);
    } else if (form === 'twin') {
      const len = 3.8 * s, h = 1.55 * s, w = 1.35 * s, zb = 0.75 * s;
      let P;
      M.part('CABIN', () => {
        P = M.at(0, 0, zb, () => A.pod(M, { len, w, h, noseBot: 0.55, noseTop: 0.3 }));
        for (const sd of [1, -1]) M.at(0, 0, zb, () => A.podSide(M, P, sd, { door: 0.05, n: 3, text: reg }));
        M.callout('CABIN', 1, [-len * 0.25, sideS * w / 2, zb + h * 0.55], 2);
        M.callout('GLAZED NOSE', 1, [len / 2 - h * 0.2, 0, zb + h * 0.65], 1.4);
        M.info.mass = [-len / 2, -w / 2, zb, len / 2, w / 2, zb + h];
      });
      M.part('UNDERCARRIAGE', () => {
        for (const [x, y] of [[len * 0.32, 0], [-len * 0.25, w * 0.62], [-len * 0.25, -w * 0.62]]) {
          M.at(x, y, 0, () => A.gearLeg(M, { h: zb + 0.1 * s, wr: 0.22 * s, ww: 0.12 * s, r: 0.035 * s }));
          if (y) M.tube([x, y * 0.6, zb + 0.05 * s], [x, y, zb + 0.1 * s], 0.04 * s, {});
        }
        M.callout('NOSE WHEEL', 1, [len * 0.32, sideS * 0.1 * s, 0.22 * s], 0.8);
        M.callout('MAIN WHEEL', 2, [-len * 0.25, sideS * (w * 0.62 + 0.08 * s), 0.22 * s], 1.2);
      });
      M.part('ROTOR PYLON', () => {
        const heads = [];
        if (twinKind === 'tandem') {
          heads.push([len * 0.3, 0, zb + h + 0.35 * s], [-len * 0.5 - 0.3 * s, 0, zb + h + 1.0 * s]);
          M.frustum([[-0.3 * s, -0.25 * s], [0.3 * s, -0.25 * s], [0.3 * s, 0.25 * s], [-0.3 * s, 0.25 * s]].map(([x, y]) => [x + len * 0.3, y]), zb + h - 0.05 * s, [[-0.18 * s, -0.15 * s], [0.18 * s, -0.15 * s], [0.18 * s, 0.15 * s], [-0.18 * s, 0.15 * s]].map(([x, y]) => [x + len * 0.3, y]), zb + h + 0.3 * s, {});
          const R = M.frustum([[-0.9 * s, -0.4 * s], [0.4 * s, -0.4 * s], [0.4 * s, 0.4 * s], [-0.9 * s, 0.4 * s]].map(([x, y]) => [x - len * 0.35, y]), zb + 0.3 * s, [[-0.35 * s, -0.22 * s], [0.15 * s, -0.22 * s], [0.15 * s, 0.22 * s], [-0.35 * s, 0.22 * s]].map(([x, y]) => [x - len * 0.5 - 0.15 * s, y]), zb + h + 0.95 * s, {});
          for (const k of ['s1', 's3']) { const f = R.f(k); if (f.on && f.front) { K.louver(f, [-f.w * 0.3, -f.h * 0.1, f.w * 0.3, f.h * 0.3]); } }
        } else {
          for (const sd of [1, -1]) {
            const y = sd * (rotorR + 0.25 * s);
            heads.push([-0.1 * s, y, zb + h + 0.45 * s]);
            K.girder(M, [-0.1 * s, sd * w * 0.45, zb + h * 0.75], [-0.1 * s, y, zb + h * 0.75], { w: 0.3 * s, sec: 3, bay: 0.4 * s });
            M.at(-0.1 * s, y, zb + h * 0.5, () => {
              const N = M.lathe([[0, -0.2 * s], [0.18 * s, 0], [0.22 * s, 0.4 * s], [0.12 * s, 0.75 * s]], {});
              if (M.decorOn) N.lat.shade({ gap: 1.4, gapMax: 3.5 });
            });
            M.tube([-0.1 * s, sd * w * 0.45, zb + 0.15 * s], [-0.1 * s, y, zb + h * 0.6], 0.03 * s, {});
          }
        }
        heads.forEach((p, i) => {
          M.at(p[0], p[1], p[2] - 0.15 * s, () => M.cyl(0.05 * s, 0, 0.3 * s));
          M.at(p[0], p[1], p[2] + 0.15 * s, () => M.rz(i ? phase2 : phase, () => K.rotor(M, { r: rotorR, blades: 3, chord: 0.18 * s, swash: true })));
        });
        M.callout(twinKind === 'tandem' ? 'TANDEM ROTOR' : 'SIDE ROTOR', 2, [heads[0][0] + rotorR * 0.6 * Math.cos((phase + 15) * D2R), heads[0][1] + rotorR * 0.6 * Math.sin((phase + 15) * D2R), heads[0][2] + 0.15 * s + 0.02 * s], 2.2);
        M.callout(twinKind === 'tandem' ? 'AFT PYLON' : 'OUTRIGGER', twinKind === 'tandem' ? 1 : 2, twinKind === 'tandem' ? [-len * 0.5, sideS * 0.3 * s, zb + h + 0.3 * s] : [-0.1 * s, sideS * (w + rotorR) * 0.5, zb + h * 0.75], 1.5);
        M.callout('ROTOR HEAD', 2, [heads[0][0], heads[0][1], heads[0][2]], 1);
      });
      equipment(M, eq, { s, x: -len * 0.1, y: sideS * w * 0.62, z: zb + 0.1 * s, sideS, len, w, front: [len / 2, 0, zb + h * 0.3], top: [-0.2 * s, 0, zb + h], tail: [-len / 2, 0, zb + h * 0.5], twin: true });
      figure = A.figSpot(M, twinKind === 'side' ? rotorR * 1.2 + 1.5 * s : len * 0.75 + 1.2 * s);
      crew = two ? 4 : 2;
    } else {
      // one-person flying platform on ducted fans
      const dr = (nDuct === 1 ? 0.95 : nDuct === 2 ? 0.7 : 0.55) * s;
      const zf = 0.95 * s;                  // deck top
      const pos = nDuct === 1 ? [[0, 0]] : nDuct === 2 ? [[0, dr * 1.12], [0, -dr * 1.12]] : [[dr * 1.12, dr * 1.12], [dr * 1.12, -dr * 1.12], [-dr * 1.12, dr * 1.12], [-dr * 1.12, -dr * 1.12]];
      M.part('DUCTED FAN', () => {
        for (const [x, y] of pos) M.at(x, y, zf - dr * 0.45, () => M.ry(-90, () => K.ductedFan(M, { r: dr, blades: 6 })));
        const h = Math.hypot(e[0], e[1]);
        let best = pos[0], bd = -Infinity;
        for (const p of pos) { const d = p[0] * e[0] + p[1] * e[1]; if (d > bd) { bd = d; best = p; } }
        M.callout('DUCTED FAN', nDuct, [best[0] + e[0] / h * dr * 1.15, best[1] + e[1] / h * dr * 1.15, zf - dr * 0.45], 2.4);
      });
      M.part('DECK', () => {
        const ext = nDuct === 1 ? dr * 0.75 : nDuct === 2 ? dr * 0.5 : dr * 1.4;
        const D = M.box([-ext, -ext, zf - 0.08 * s], [ext, ext, zf], { chamfer: ext * 0.3 });
        const f = D.f('+z');
        if (f.on) { const g = f.mOf(2); f.hatch([-f.w / 2 + g, -f.h / 2 + g, f.w / 2 - g, f.h / 2 - g], { angle: 0, gap: 2.2, w: 0 }); f.hatch([-f.w / 2 + g, -f.h / 2 + g, f.w / 2 - g, f.h / 2 - g], { angle: 90, gap: 2.2, w: 0 }); }
        // engine box under the deck, fuel tank, legs with pads
        M.box([-0.3 * s, -0.25 * s, zf - 0.45 * s], [0.3 * s, 0.25 * s, zf - 0.08 * s], { chamfer: 0.06 * s });
        M.at(-0.45 * s, 0, zf - 0.25 * s, () => K.tankCapsule(M, { r: 0.12 * s, len: 0.5 * s, axis: 'y', bands: false }));
        const legR = Math.max(ext, dr * (nDuct === 1 ? 1.15 : 1.6));
        for (let i = 0; i < 4; i++) {
          const a = (45 + 90 * i) * D2R;
          const top = [Math.cos(a) * ext * 0.7, Math.sin(a) * ext * 0.7, zf - 0.1 * s], foot = [Math.cos(a) * legR * 1.05, Math.sin(a) * legR * 1.05, 0.06 * s];
          A.strut(M, top, foot, 0.035 * s, { collars: true });
          M.at(foot[0], foot[1], 0, () => K.footpad(M, { r: 0.16 * s }));
        }
        // handlebar ring on a post
        M.tube([0.25 * s, 0, zf], [0.3 * s, 0, zf + 0.95 * s], 0.03 * s, {});
        const ring = []; for (let i = 0; i <= 16; i++) { const a = (i / 16 * 200 - 100) * D2R; ring.push([0.3 * s + Math.cos(a) * 0.32 * s - 0.32 * s * 0.0, Math.sin(a) * 0.38 * s, zf + 1.05 * s]); }
        M.pipe(ring, 0.022 * s, { isect: false });
        M.tube([0.3 * s, 0, zf + 0.95 * s], [0.3 * s, 0, zf + 1.05 * s], 0.022 * s, {});
        M.at(0.62 * s, 0, zf + 1.05 * s, () => A.panel(M, { w: 0.22 * s, h: 0.12 * s }));
        M.at(-0.05 * s, 0, zf, () => A.pilot(M, { seated: false, arms: 'bar' }));
        M.callout('STANDING DECK', 1, [ext * 0.6 * frontS, sideS * ext * 0.6, zf], 1.6);
        M.callout('HANDLEBAR', 1, A.toward(M, [0.3 * s, sideS * 0.38 * s, zf + 1.05 * s], 0.05 * s), 1.4);
        M.callout('FUEL TANK', 1, A.toward(M, [-0.45 * s, 0, zf - 0.25 * s], 0.2 * s), 0.8);
        M.callout('PILOT', 1, A.toward(M, [-0.05 * s, 0, zf + 1.25 * s], 0.32 * s), 1.6);
        M.callout('LANDING LEG', 4, [Math.cos(45 * D2R) * legR * frontS * 0.9, sideS * Math.sin(45 * D2R) * legR * 0.9, 0.25 * s], 1.1);
        M.callout('ENGINE', 1, [0.3 * s * frontS, sideS * 0.25 * s, zf - 0.25 * s], 1);
        M.info.mass = [-legR, -legR, 0, legR, legR, zf];
      });
      equipment(M, eq, { s, x: 0, y: sideS * dr, z: zf - 0.1 * s, sideS, front: [0.45 * s, 0, zf + 0.6 * s], top: [-0.4 * s, 0, zf + 0.8 * s], tail: [-0.5 * s, 0, zf], platform: true });
      figure = A.figSpot(M, 2.6 * s);
    }

    // ------------------------------------------------ vocabulary
    let job = M.pick(['TAXI', 'INSPECTOR', 'MAIL']);
    if (eq.has('litter')) job = 'DOCTOR';
    else if (eq.has('mail')) job = 'MAIL';
    else if (eq.has('horn')) job = 'MUSTERING';
    else if (eq.has('camera') || eq.has('light')) job = 'INSPECTION';
    const where = { OUTBACK: 'the outback', HIGHLAND: 'the highlands', DELTA: 'the delta', PRAIRIE: 'the prairie', ISLAND: 'the islands', FOREST: 'the forest', COASTAL: 'the coast', MOUNTAIN: 'the mountains', CITY: 'the city' }[place];
    const stops = place === 'CITY' ? 'rooftops' : place === 'ISLAND' || place === 'COASTAL' ? 'lighthouses' : 'farms';
    const fname = { bubble: 'HELICOPTER', gyro: 'GYROCOPTER', twin: twinKind === 'tandem' ? 'TANDEM ROTORCRAFT' : 'TWIN-ROTOR', platform: 'FLYING PLATFORM' }[form];
    const who = form === 'platform' ? 'one person' : word(crew) + (crew > 1 ? ' people' : ' pilot');
    const briefs = {
      DOCTOR: `Takes a doctor to ${where} and brings a patient back on a litter.`,
      MAIL: `Drops and collects mail at ${stops} across ${where}.`,
      MUSTERING: place === 'CITY' ? `Calls out traffic over the city with a loudspeaker.` : `Musters cattle across ${where} with a loudspeaker and ${who}.`,
      INSPECTION: `Inspects power lines over ${where} with a searchlight and camera.`,
      INSPECTOR: `Takes an inspector along pipelines across ${where}.`,
      TAXI: `Carries ${who} between rooftops in ${where}.`,
    };
    let brief = briefs[job];
    if (job === 'INSPECTION' && !eq.has('camera')) brief = `Inspects power lines over ${where} at night with a searchlight.`;
    if (job === 'INSPECTION' && !eq.has('light')) brief = `Inspects power lines over ${where} with a camera on a boom.`;
    if (form === 'platform' && job === 'TAXI') brief = `Lifts one person over ${where} on ${word(nDuct)} ducted fan${nDuct > 1 ? 's' : ''}.`;
    if (brief.length > 78) brief = brief.replace(/ across [^.]*| over [^.]*| in the city/, '');
    let klPlace = place;
    if ((place + ' ' + job + ' ' + fname).length > 34) klPlace = '';
    return {
      place: klPlace, job, form: fname, brief, designation: reg,
      specs: [['ROTOR DIA', form === 'platform' ? `${nDuct} X ${Math.round(2000 * (nDuct === 1 ? 0.95 : nDuct === 2 ? 0.7 : 0.55) * s)} MM` : `${Math.round(rotorR * 2000)} MM`], ['CREW', String(form === 'platform' ? 1 : crew)], ['POWER', `${kw} KW`], ['RANGE', `${rangeK} KM`]],
      figure,
    };
  },
};

// equipment hung on the side, the nose, the top or the tail. o: anchor points
function equipment(M, eq, o) {
  const { s, sideS } = o;
  if (eq.has('litter') && !o.platform) {
    M.part('LITTER POD', () => {
      const y = o.bubble ? o.y : o.y + sideS * 0.3 * s, z = o.bubble ? 0.1 * s + 0.3 * s : o.z + (o.gyro ? 0.0 : 0.15 * s);
      M.at(o.x - 0.2 * s, y, z, () => {
        const P = M.capsule(0.3 * s, -1.1 * s, 1.1 * s, { axis: 'x', rings: 5 });
        if (M.decorOn) { P.lat.ring(0.3, { w: 1 }); P.lat.ring(0.7, { w: 1 }); P.lat.shape(sideS * 90 + 90, 0.5, [[-0.35 * s, -0.08 * s], [0.35 * s, -0.08 * s], [0.35 * s, 0.08 * s], [-0.35 * s, 0.08 * s]], { closed: true, w: 1 }); P.lat.shade({ gap: 1.3, gapMax: 3.5 }); }
        // a cross on the lid: two short bars
        M.at(0.5 * s, 0, 0.29 * s, () => { M.boxc([0, 0, 0], [0.2 * s, 0.06 * s, 0.02 * s], { isect: false }); M.boxc([0, 0, 0], [0.06 * s, 0.2 * s, 0.02 * s], { isect: false }); });
      });
      const ax = o.bubble ? [-0.75 * s, 0.75 * s] : [o.x - 0.6 * s, o.x + 0.3 * s];
      for (const x of ax) M.tube(o.bubble ? [x, y * 0.6, o.zf - 0.1 * s] : [x, o.y * 0.6, o.z + 0.1 * s], [x, y, z + 0.25 * s], 0.025 * s, {});
      M.callout('LITTER POD', 1, [o.x - 0.2 * s, y + sideS * 0.3 * s, z], 2.3);
    });
  }
  if (eq.has('mail')) {
    M.part('MAIL BOX', () => {
      let p;
      if (o.platform) p = [o.tail[0] - 0.2 * s, 0, o.tail[2] - 0.08 * s - 0.38 * s];
      else if (o.bubble) p = [-1.15 * s, o.y, 0.095 * s];
      else if (o.gyro) p = [o.x + 0.1 * s, sideS * 0.62 * s, o.z - 0.3 * s];
      else p = [-0.35 * o.len, sideS * (o.w / 2 + 0.24 * s), o.z + 0.2 * s];
      M.at(p[0], p[1], p[2], () => K.crate(M, { s: [0.55 * s, 0.4 * s, 0.38 * s] }));
      if (o.gyro || o.twin) for (const dx of [-0.18 * s, 0.18 * s]) M.tube([p[0] + dx, p[1], p[2] + 0.1 * s], [p[0] + dx, o.gyro ? 0 : sideS * o.w / 2, o.gyro ? o.z : p[2] + 0.1 * s], 0.02 * s, {});
      M.callout('MAIL BOX', 1, A.toward(M, [p[0], p[1], p[2] + 0.2 * s], 0.45 * s), 1.8);
    });
  }
  if (eq.has('horn')) {
    M.part('LOUDSPEAKER', () => {
      const p = o.platform ? [0.3 * o.s, 0, 0.95 * s + 1.2 * s] : [o.front[0] - 0.1 * s, -sideS * 0.25 * s, o.front[2] - 0.05 * s];
      M.at(p[0], p[1], p[2], () => K.horn(M, { r: 0.12 * s }));
      M.callout('LOUDSPEAKER', 1, A.toward(M, [p[0] + 0.2 * s, p[1], p[2]], 0.2 * s), 1.6);
    });
  }
  if (eq.has('light')) {
    M.part('SEARCHLIGHT', () => {
      const p = [o.front[0] - 0.05 * s, sideS * 0.25 * s, o.front[2] - 0.1 * s];
      M.at(p[0], p[1], p[2], () => M.rx(180, () => K.searchlight(M, { r: 0.12 * s })));
      M.callout('SEARCHLIGHT', 1, A.toward(M, [p[0], p[1], p[2] - 0.2 * s], 0.2 * s), 1.6);
    });
  }
  if (eq.has('camera') && !o.platform) {
    M.part('CAMERA BOOM', () => {
      const a = [o.front[0] - 0.2 * s, -sideS * 0.2 * s, o.front[2] - 0.1 * s], b = [a[0] + 0.9 * s, a[1] - sideS * 0.2 * s, a[2] - 0.15 * s];
      M.tube(a, b, 0.03 * s, {});
      M.at(b[0], b[1], b[2] - 0.12 * s, () => { M.boxc([0, 0, 0], [0.26 * s, 0.16 * s, 0.18 * s]); M.at(0.13 * s, 0, 0, () => M.cyl(0.05 * s, 0, 0.12 * s, { axis: 'x' })); });
      M.callout('CAMERA BOOM', 1, lerp(a, b, 0.6), 1.5);
    });
  }
  if (eq.has('lamps')) {
    M.part('LAMP', () => {
      const p = o.top;
      M.at(p[0], p[1], p[2], () => { M.cyl(0.05 * s, 0, 0.06 * s); M.at(0, 0, 0.06 * s, () => M.sphere(0.06 * s)); });
      M.at(o.front[0], 0, o.front[2] - 0.08 * s, () => K.lamp(M, { r: 0.06 * s }));
      M.callout('BEACON LAMP', 1, [p[0], p[1], p[2] + 0.1 * s], 0.9);
    });
  }
  if (eq.has('whip')) {
    M.part('WHIP ANTENNA', () => {
      M.at(o.tail[0], o.tail[1], o.tail[2], () => M.rz(180, () => K.whip(M, { h: 1.8 * s, lean: 15 })));
      M.callout('WHIP ANTENNA', 1, [o.tail[0], o.tail[1], o.tail[2] + 0.3 * s], 0.7);
    });
  }
}
