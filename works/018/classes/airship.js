// classes/airship.js: an envelope with gores, frame rings and tail fins; a gondola slung
// below on struts; engine cars on outriggers; and equipment from a pool: a mooring cone,
// an observation car lowered on a cable, a roof deck (sometimes with a helicopter), a
// trapeze with a small plane, slung cargo (a container, a boat or a house), ballast bags,
// a lookout shaft, handling lines, or a mooring mast on the ground.

import * as A from './parts-air.js';
import { K, D2R, lerp } from './parts-air.js';
import { word, thou } from '../words.js';

const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';

export default {
  id: 'airship',
  family: 'air',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices (all random draws up front)
    const form = M.wpick([[4, 'classic'], [2, 'rigid'], [1.6, 'twin'], [1.4, 'lifting']]);
    const L = form === 'rigid' ? M.r(85, 125) : form === 'twin' ? M.r(55, 80) : M.r(50, 90);
    const fine = form === 'rigid' ? M.r(6.2, 7.6) : form === 'lifting' ? M.r(3.3, 3.9) : M.r(3.7, 4.7);
    const R = L / (2 * fine);
    const sy = form === 'lifting' ? M.r(1.3, 1.5) : 1, sz = form === 'lifting' ? M.r(0.62, 0.75) : 1;
    const envForm = form === 'rigid' ? 'rigid' : form === 'lifting' ? 'blunt' : 'classic';
    const yo = form === 'twin' ? R * M.r(1.75, 2.05) : 0;
    const hulls = form === 'twin' ? [yo, -yo] : [0];
    const finCfg = form === 'twin' ? 'twin' : M.wpick([[3, '+'], [2, 'X'], [1.2, 'Y']]);
    const finSpan = M.r(0.85, 1.15), finChord = M.r(0.15, 0.21), finSweep = M.r(0.15, 0.4);
    const gores = M.pick([20, 24, 28, 32]);
    const polyN = M.pick([16, 18, 20, 24]);
    const nRings = form === 'rigid' ? M.ri(10, 15) : M.ri(3, 6);
    const battens = form === 'rigid' ? 0 : M.pick([12, 16, 20]);
    const gl = L * (form === 'rigid' ? M.r(0.14, 0.24) : M.r(0.2, 0.36));
    const gh = Math.min(4.2, R * M.r(0.32, 0.42)) * (form === 'twin' ? 1.15 : 1);
    const gw = gh * M.r(0.85, 1.05);
    const gx = L * M.r(-0.02, 0.1);
    const slung = M.chance(form === 'rigid' ? 0.35 : 0.6);
    const gap = slung ? R * M.r(0.22, 0.4) : R * 0.05;
    const engMode = form === 'twin' ? M.pick(['hull', 'wing']) : M.wpick([[3, 'hull'], [2, 'gondola'], [1, 'tail']]);
    const nEng = engMode === 'hull' ? (form === 'twin' ? 2 : M.pick([2, 2, 4])) : 2;
    const pusher = M.chance(0.55);
    const blades = M.pick([2, 3, 3, 4]);
    const engX = M.r(-0.1, 0.05);
    const pool = [[3, 'obscar'], [2.5, 'deck'], [2, 'hook'], [3, 'cargo'], [2, 'ballast'], [1.5, 'shaft'], [2, 'lines'], [1.5, 'mast']];
    const nEq = M.wpick([[2, 2], [2, 3], [1, 4]]);
    const eq = new Set();
    for (let k = 0; k < 12 && eq.size < nEq; k++) eq.add(M.wpick(pool));
    if (form === 'twin') { for (const k of ['shaft', 'mast', 'deck', 'hook']) eq.delete(k); if (eq.size < 2) eq.add('obscar'); }
    const cone = form !== 'twin' && (eq.has('mast') || M.chance(0.7));
    const cargoKind = M.wpick([[3, 'container'], [2, 'boat'], [1.5, 'house']]);
    const deckHeli = M.chance(0.6);
    const obsDrop = M.r(0.7, 1.3);
    const valves = M.ri(2, 4);
    const searchl = M.chance(0.6);
    const trail = M.chance(0.5);
    const az = M.pick([1, -1]) * (form === 'twin' ? M.r(30, 38) : M.r(48, 62)) + M.pick([0, 0, 180]);
    const el = form === 'twin' ? M.r(28, 36) : M.r(20, 30);
    const regA = LET[M.ri(0, 22)] + LET[M.ri(0, 22)], regB = LET[M.ri(0, 22)] + LET[M.ri(0, 22)] + LET[M.ri(0, 22)];
    const regKind = M.wpick([[3, 'reg'], [2, 'lz'], [1, 'num']]);
    const lzNo = M.ri(3, 140);
    const place = M.pick(['COASTAL', 'ARCTIC', 'ALPINE', 'DESERT', 'ISLAND', 'TROPICAL', 'RIVER', 'POLAR', 'VALLEY', 'NORTH SEA']);
    const sea = ['COASTAL', 'ISLAND', 'NORTH SEA', 'TROPICAL'].includes(place);
    const kwEach = Math.round(M.r(90, 400) / 10) * 10;
    const rangeK = Math.round(M.r(8, 30)) * 100;
    const days = M.pick([3, 5, 7, 10, 14]);
    const mastH0 = M.r(1.0, 1.25);
    const lineN = M.ri(2, 3);
    const houseLen = M.r(5, 7), boatLen = R * M.r(0.7, 0.95);
    const hookX = M.r(-0.22, -0.12);
    const bagN = M.ri(3, 5);
    M.setView(az, el);
    const e = M.view.e;
    const sideS = e[1] >= 0 ? 1 : -1;

    const designation = regKind === 'reg' ? `${regA}-${regB}` : regKind === 'lz' ? `${regA[0]}Z ${lzNo}` : `${regA}-${lzNo}`;

    // ------------------------------------------------ heights
    const E = A.envProfile(L, R, envForm);
    const rAt = (x) => E.rAt(x);
    let gMin = Infinity;
    for (let k = 0; k <= 8; k++) gMin = Math.min(gMin, rAt(gx - gl / 2 + gl * k / 8));
    const gTopOff = form === 'twin' ? R * 0.3 + R * 0.1 : gMin * sz + gap;   // gondola roof below the axis
    // the lowest hanging thing below the gondola bottom
    let hang = 0;
    if (eq.has('obscar')) hang = Math.max(hang, R * obsDrop + R * 0.25);
    if (eq.has('cargo')) hang = Math.max(hang, R * 0.9 + (cargoKind === 'house' ? 5 : 3));
    if (eq.has('hook')) hang = Math.max(hang, R * 0.6);
    const clear = Math.max(R * 0.35, 3);
    let zc = gTopOff + gh + hang + clear;
    const mast = eq.has('mast');
    if (mast) zc = Math.max(zc, R * 1.2 + gTopOff * 0.3) * mastH0;
    const gz = zc - gTopOff - gh;              // gondola bottom
    const gyc = 0;                             // gondola y center (twin: between hulls)

    // ------------------------------------------------ the envelope(s)
    const ringXs = [];
    if (form === 'rigid') for (let i = 1; i < nRings; i++) ringXs.push(-L / 2 + L * i / nRings);
    else for (let i = 0; i < nRings; i++) ringXs.push(-L * 0.32 + L * 0.6 * (i + 0.5) / nRings);
    const aView = Math.atan2(e[1] / sy, -e[2] / sz) / D2R;   // lathe angle facing the viewer
    const envPt = (x, a, yc = 0, k = 1) => { const r = rAt(x) * k; return [x, yc + r * Math.sin(a * D2R) * sy, zc - r * Math.cos(a * D2R) * sz]; };
    const lit = (n) => n;
    void lit;
    M.part('ENVELOPE', () => {
      for (const yc of hulls) {
        const S = M.at(0, yc, zc, () => M.scale(1, sy, sz, () => A.envelope(M, {
          L, R, form: envForm, gores, rings: ringXs, battens,
          text: (form !== 'twin' || yc * sideS > 0) ? designation : null, textSide: sideS, textH: R * (form === 'rigid' ? 0.42 : 0.32),
          poly: form === 'rigid' ? polyN : 0,
        })));
        void S;
        // gas valves along the top
        for (let i = 0; i < valves; i++) {
          const x = -L * 0.2 + L * 0.4 * i / Math.max(1, valves - 1);
          M.at(x, yc, zc + rAt(x) * sz - R * 0.02, () => { M.cyl(R * 0.06, 0, R * 0.05); M.at(0, 0, R * 0.05, () => M.sphere(R * 0.045, { isect: false })); });
          M.callout('GAS VALVE', valves * hulls.length, [x, yc, zc + rAt(x) * sz + R * 0.06], 0.7);
        }
      }
      M.info.mass = [-L / 2, -yo - R * sy, zc - R * sz, L / 2, yo + R * sy, zc + R * sz];
      M.info.centers = hulls.map((yc) => [[-L / 2 - R * 0.2, yc, zc], [L / 2 + R * 0.3, yc, zc]]);
      M.callout('ENVELOPE', hulls.length, envPt(-L * 0.05, aView, hulls.length > 1 ? sideS * yo : 0), 3);
      if (nRings && form === 'rigid') M.callout('FRAME RING', nRings - 1, envPt(ringXs[Math.floor(ringXs.length / 3)], aView, hulls.length > 1 ? sideS * yo : 0), 0.9);
    });

    // twin: the joining wing and the tailplane between the hulls
    if (form === 'twin') {
      M.part('CROSS GIRDER', () => {
        const zg = zc - R * 0.3, gwid = R * 0.2;
        for (const x of [gx + gl * 0.42, gx - gl * 0.42]) {
          K.girder(M, [x, -yo + rAt(x) * 0.9, zg], [x, yo - rAt(x) * 0.9, zg], { w: gwid, sec: 3, battens: true });
        }
        M.callout('CROSS GIRDER', 2, [gx + gl * 0.42, 0, zg + gwid * 0.35], 1.6);
        const tc = L * 0.1, tx = -L / 2 + L * 0.2;
        M.at(0, 0, zc, () => M.rx(-90, () => A.foil(M, { root: { x: tx, h: -yo, c: tc, t: tc * 0.1 }, tip: { x: tx, h: yo, c: tc, t: tc * 0.1 }, ribs: 6, cs: [{ s0: 0.25, s1: 0.75, tab: true }] })));
        M.callout('ELEVATOR', 1, [tx - tc * 0.85, 0, zc + tc * 0.03], 1.3);
      });
    }

    // ------------------------------------------------ tail fins
    M.part('TAIL FIN', () => {
      const xTE = -L / 2 + L * 0.035, c = L * finChord;
      const xLE = xTE + c;
      const hRoot = rAt(xTE + c * 0.25) * 0.9;
      const span = R * finSpan;
      for (const yc of hulls) {
        let angs;
        if (finCfg === '+') angs = [0, 90, 180, 270];
        else if (finCfg === 'X') angs = [45, 135, 225, 315];
        else if (finCfg === 'Y') angs = [0, 120, 240];
        else angs = [0, 180, yc > 0 ? 270 : 90];
        for (const th of angs) {
          // th: 0 = top fin, 180 = bottom fin; rx(th) turns local +z (span) toward -y for th = 90
          const dir = [0, -Math.sin(th * D2R), Math.cos(th * D2R)];
          const kk = Math.sqrt((dir[1] / sy) ** 2 + (dir[2] / sz) ** 2) || 1;   // envelope radius factor along dir
          const hr = hRoot / kk, ht = hr + span * (th === 180 ? 0.8 : 1);
          const vis = th === 0 ? designation : null;
          M.at(0, yc, zc, () => M.rx(th, () => A.foil(M, {
            root: { x: xLE, h: hr, c, t: c * 0.09 },
            tip: { x: xLE - c * finSweep, h: ht, c: c * 0.62, t: c * 0.05 },
            ribs: 5, cs: [{ s0: 0.08, s1: 0.94, tab: true }], text: finCfg === '+' || finCfg === 'Y' ? vis : null, textH: c * 0.14,
          })));
          const mid = lerp([xLE - c * 0.4, 0, hr + span * 0.2], [xLE - c * finSweep - c * 0.3, 0, ht], 0.5);
          const p = [mid[0], yc + dir[1] * mid[2] * 0.95, zc + dir[2] * mid[2] * 0.95];
          if (p[1] * e[1] + (p[2] - zc) * e[2] > -0.2 * R) {
            M.callout(th === 0 || th === 180 ? 'TAIL FIN' : finCfg === '+' ? 'STABILIZER' : 'TAIL FIN', angs.length * hulls.length, p, 2);
            const q = [xLE - c * finSweep * 0.5 - c * 0.85, yc + dir[1] * (hr + span * 0.55), zc + dir[2] * (hr + span * 0.55)];
            M.callout(th === 0 || th === 180 || finCfg !== '+' ? 'RUDDER' : 'ELEVATOR', angs.length * hulls.length, q, 1.3);
          }
        }
      }
    });

    // ------------------------------------------------ gondola
    let windows = 0;
    const gTop = gz + gh;
    M.part('GONDOLA', () => {
      const P = M.at(gx, gyc, gz, () => A.pod(M, { len: gl, w: gw, h: gh, noseBot: 0.4, noseTop: 0.2 }));
      for (const s of [1, -1]) windows += M.at(gx, gyc, gz, () => A.podSide(M, P, s, { door: -0.35, text: designation, n: Math.max(3, Math.round(gl / (gh * 0.6))) }));
      windows = Math.max(windows, Math.round(gl / (gh * 0.6)));
      M.callout('GONDOLA', 1, [gx, sideS * gw / 2, gz + gh * 0.6], 2.6);
      M.callout('CONTROL CAR GLAZING', 1, [gx + gl / 2 - gh * 0.12, 0, gz + gh * 0.6], 1.2);
      // bumper bag and step under the gondola
      M.at(gx - gl * 0.2, gyc, gz, () => { const B = M.scale(1, 1, 0.7, () => M.sphere(gh * 0.16, { isect: false })); if (M.decorOn) B.lat.shade({ gap: 1.4, gapMax: 3 }); });
      if (searchl) M.at(gx + gl * 0.32, gyc, gz, () => M.rx(180, () => K.searchlight(M, { r: gh * 0.1 })));
      // suspension: struts and wires up to the envelope
      const ycs = form === 'twin' ? [] : [0];
      const nSt = Math.max(2, Math.round(gl / (gh * 2.2)));
      for (const yc of ycs) for (const s of [1, -1]) for (let i = 0; i < nSt; i++) {
        const x = gx - gl * 0.38 + gl * 0.7 * i / (nSt - 1);
        const a = [x, s * gw * 0.42, gTop];
        const b = envPt(x - gap * 0.3, s > 0 ? 28 : -28, yc, 0.98);
        if (slung) A.strut(M, a, b, Math.max(0.05, gh * 0.025), { collars: true });
        else M.tube(a, b, gh * 0.03, {});
        A.wire(M, [x, s * gw * 0.5, gTop - gh * 0.05], envPt(x + gl * 0.12, s > 0 ? 55 : -55, yc, 0.99), { w: 0 });
      }
      if (form === 'twin') {
        // hang from the cross girders
        for (const sx of [1, -1]) for (const s of [1, -1]) A.strut(M, [gx + sx * gl * 0.38, s * gw * 0.42, gTop], [gx + sx * gl * 0.42, s * gw * 0.3, zc - R * 0.3 - R * 0.07], gh * 0.03);
        for (const s of [1, -1]) A.wire(M, [gx, s * gw * 0.5, gTop], [gx, s * (yo - R * 0.8), zc - R * 0.55], { w: 0 });
      }
      if (slung && form !== 'twin') M.callout('SUSPENSION STRUT', nSt * 2, [gx - gl * 0.38, sideS * gw * 0.42, gTop + gap * 0.5], 1);
      if (trail) {
        M.at(gx - gl / 2, 0, gz + gh * 0.5, () => { M.cyl(gh * 0.05, -gh * 0.1, 0, { axis: 'x' }); });
        M.line([[gx - gl / 2 - gh * 0.1, 0, gz + gh * 0.5], [gx - gl / 2 - L * 0.22, 0, gz - hang * 0.4 - R * 0.2]], { w: 0, pass: 2, fit: false });
      }
    });

    // ------------------------------------------------ engine cars
    M.part('ENGINE CAR', () => {
      const B = Math.max(R, L / 8);
      const nr = B * 0.13, nl = B * 0.66, pr = Math.min(B * 0.42, 3.6);
      const cars = [];
      if (engMode === 'hull') {
        const xs = nEng === 4 ? [L * (engX + 0.12), L * (engX - 0.12)] : [L * engX];
        for (const yc of hulls) for (const x of xs) for (const s of [1, -1]) {
          if (form === 'twin' && s * yc < 0) continue;
          cars.push({ x, y: yc + s * (rAt(x) * sy + pr * 0.95), z: zc - rAt(x) * sz * 0.35, s, yc, kind: 'hull' });
        }
      } else if (engMode === 'gondola') {
        for (const s of [1, -1]) cars.push({ x: gx - gl * 0.1, y: s * (gw / 2 + pr + R * 0.08), z: gz + gh * 0.75, s, kind: 'gondola' });
      } else if (engMode === 'wing') {
        for (const s of [1, -1]) cars.push({ x: gx + gl * 0.42, y: s * yo * 0.42, z: zc - R * 0.3 - R * 0.12 - nr * 1.3, s, kind: 'wing' });
      } else {
        for (const s of [1, -1]) cars.push({ x: L * engX, y: s * (rAt(L * engX) * sy + pr * 0.95), z: zc - rAt(L * engX) * sz * 0.35, s, yc: 0, kind: 'hull' });
      }
      for (const c of cars) {
        M.at(c.x, c.y, c.z, () => A.nacelle(M, { len: nl, r: nr, prop: pusher ? 'rear' : 'front', propR: pr, blades, vents: c.s > 0 ? 90 : 270 }));
        if (c.kind === 'hull') {
          const a1 = envPt(c.x + nl * 0.2, c.s * 80, c.yc, 0.97), a2 = envPt(c.x - nl * 0.2, c.s * 62, c.yc, 0.97);
          A.strut(M, a1, [c.x + nl * 0.2, c.y, c.z + nr * 0.6], nr * 0.22);
          A.strut(M, a2, [c.x - nl * 0.2, c.y, c.z + nr * 0.6], nr * 0.22);
          A.strut(M, envPt(c.x, c.s * 45, c.yc, 0.97), [c.x, c.y - c.s * nr * 0.4, c.z - nr * 0.7], nr * 0.18);
        } else if (c.kind === 'gondola') {
          const gy = c.s * gw / 2;
          A.strut(M, [c.x + nl * 0.25, gy, gz + gh * 0.9], [c.x + nl * 0.2, c.y - c.s * nr * 0.5, c.z + nr * 0.5], nr * 0.22);
          A.strut(M, [c.x - nl * 0.25, gy, gz + gh * 0.3], [c.x - nl * 0.1, c.y - c.s * nr * 0.5, c.z - nr * 0.5], nr * 0.22);
          A.wire(M, [c.x, c.y, c.z + nr], envPt(c.x, c.s * 60, 0, 0.99), { w: 0 });
        } else {
          M.box([c.x - nl * 0.25, c.y - nr * 0.12, c.z + nr * 0.6], [c.x + nl * 0.1, c.y + nr * 0.12, zc - R * 0.3], {});
        }
      }
      const c0 = cars.find((c) => c.s === sideS) || cars[0];
      M.callout('ENGINE CAR', cars.length, [c0.x, c0.y, c0.z + nr * 0.95], 2.2);
      M.callout('PROPELLER', cars.length, [c0.x + (pusher ? -1 : 1) * (nl / 2 + nr * 0.6), c0.y, c0.z + pr * 0.7], 1.5);
      if (engMode === 'tail' && form !== 'twin') {
        // a pusher on the tail cone
        const xt = -L / 2;
        M.at(xt - R * 0.02, 0, zc, () => { M.cone(R * 0.06, R * 0.11, 0, R * 0.25, { axis: 'x', isect: false }); });
        M.at(xt - R * 0.06, 0, zc, () => M.rz(180, () => K.propeller(M, { r: pr * 1.1, blades: 4 })));
        M.callout('TAIL PROPELLER', 1, [xt - R * 0.1, 0, zc + pr * 0.8], 1.4);
      }
    });

    // ------------------------------------------------ mooring cone and handling lines
    const xn = L / 2;
    if (cone) {
      M.part('MOORING CONE', () => {
        M.at(xn - R * 0.06, 0, zc, () => {
          M.cone(R * 0.16, R * 0.05, 0, R * 0.2, { axis: 'x', isect: false });
          M.cyl(R * 0.035, R * 0.2, R * 0.32, { axis: 'x' });
          M.at(R * 0.34, 0, 0, () => M.sphere(R * 0.045));
        });
        M.callout('MOORING CONE', 1, [xn + R * 0.1, 0, zc + R * 0.07], 1.6);
      });
    }
    if (eq.has('lines')) {
      M.part('HANDLING LINE', () => {
        for (let i = 0; i < lineN; i++) {
          const x = xn - R * (0.25 + 0.35 * i);
          const a = (i % 2 ? -1 : 1) * 25;
          const p = envPt(x, a, form === 'twin' ? sideS * yo : 0, 1.0);
          A.rope(M, p, [p[0] + R * 0.25, p[1], p[2] - R * (0.8 + 0.25 * i)], R * 0.08, { w: 1, fit: false });
        }
        const p = envPt(xn - R * 0.25, 25, form === 'twin' ? sideS * yo : 0);
        M.callout('HANDLING LINE', lineN, p, 0.8);
      });
    }

    // ------------------------------------------------ equipment
    let crewExtra = 0, briefKey = null;
    if (eq.has('obscar')) {
      M.part('OBSERVATION CAR', () => {
        const x = gx - gl * 0.28, z0 = gz, drop = R * obsDrop, cl = Math.max(R * 0.5, 4), cr = cl * 0.2;
        M.at(x, 0, z0, () => M.rx(180, () => K.winch(M, { r: gh * 0.08, w: gh * 0.3, at: [0, 0, gh * 0.1] })));
        const zc2 = z0 - drop;
        M.line([[x, 0, z0 - gh * 0.1], [x, 0, zc2 + cr]], { w: 1, pass: 1 });
        M.at(x, 0, zc2, () => {
          const S = M.lathe([[0, -cl / 2], [cr * 0.5, -cl * 0.42], [cr, -cl * 0.1], [cr, cl * 0.15], [cr * 0.7, cl * 0.38], [0, cl / 2]], { axis: 'x' });
          if (M.decorOn) { S.lat.ring(0.62, { w: 1 }); S.lat.ring(0.35, { w: 1 }); for (let k = 0; k < 3; k++) S.lat.port(aView, 0.4 + k * 0.08, cr * 0.18); S.lat.shade({ gap: 1.4, gapMax: 3.5 }); }
          for (const th of [0, 90, 180, 270]) M.rx(th, () => A.foil(M, { root: { x: -cl * 0.3, h: cr * 0.5, c: cl * 0.18, t: cl * 0.015 }, tip: { x: -cl * 0.38, h: cr * 1.4, c: cl * 0.1, t: cl * 0.01 }, spar: false }));
          M.cyl(cr * 0.15, cr * 0.9, cr * 1.15);
        });
        M.callout('OBSERVATION CAR', 1, [x, 0, zc2 + cr * 0.9], 2.4);
        M.callout('CABLE WINCH', 1, [x, 0, z0 - gh * 0.12], 0.9);
      });
      crewExtra += 1;
    }
    if (eq.has('deck')) {
      M.part('ROOF DECK', () => {
        const dl = Math.min(R * 1.3, L * 0.2), dw = Math.min(R * 0.95, dl * 0.8), x = L * 0.04;
        let rmin = Infinity; for (let k = 0; k <= 4; k++) rmin = Math.min(rmin, rAt(x - dl / 2 + dl * k / 4));
        const zt = zc + rAt(x) * sz + R * 0.12, t = R * 0.04;
        const D = M.box([x - dl / 2, -dw / 2, zt - t], [x + dl / 2, dw / 2, zt]);
        const f = D.f('+z');
        if (f.on) { f.rect(-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2), { w: 1 }); f.hatch([-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2)], { angle: 0, gap: 2.6, w: 0 }); }
        for (const k of ['+x', '-x', '+y', '-y']) { const sf = D.f(k); if (sf.on) sf.hatch(sf.box, { angle: 90, gap: 2.0, w: 0 }); }
        for (const sx of [-1, 1]) for (const s of [-1, 1]) {
          const px = x + sx * dl * 0.32, py = s * dw * 0.3;
          M.tube([px, py, zt - t], [px, py, zc + Math.sqrt(Math.max(0, (rAt(px) * sz) ** 2 - (py / sy * sz) ** 2)) - R * 0.02], R * 0.025, {});
        }
        K.railing(M, [[x - dl / 2 + 0.1, -dw / 2 + 0.1, zt], [x + dl / 2 - 0.1, -dw / 2 + 0.1, zt], [x + dl / 2 - 0.1, dw / 2 - 0.1, zt], [x - dl / 2 + 0.1, dw / 2 - 0.1, zt], [x - dl / 2 + 0.1, -dw / 2 + 0.1, zt]], { h: 1.0, posts: 1.6 });
        if (deckHeli && dl > 9) {
          M.with({ at: [x, 0, zt], rz: 15 }, () => K.miniHeli(M, { len: dl * 0.7, reg: `${regB}`, blades: 3 }));
          M.callout('SCOUT HELICOPTER', 1, [x, 0, zt + dl * 0.1], 2.4);
          briefKey = 'heli';
        }
        M.callout('ROOF DECK', 1, [x + dl * 0.3, 0, zt], 2);
        M.callout('DECK RAILING', 1, [x + dl / 2 - 0.1, sideS * dw * 0.3, zt + 1.0], 0.7);
      });
      crewExtra += 2;
    }
    if (eq.has('shaft') && !eq.has('deck')) {
      M.part('LOOKOUT', () => {
        const x = L * 0.12, rt = R * 0.07, ztop = zc + rAt(x) * sz;
        M.at(x, 0, ztop + R * 0.12, () => {
          const P = M.cyl(rt * 3, -R * 0.02, 0);
          if (P.top.on) { P.top.circle(0, 0, rt * 2.8, { w: 1 }); P.top.hatch(A.circlePts(0, 0, rt * 2.7, rt * 2.7, 24), { angle: 0, gap: 2.4, w: 0 }); }
          const ring = []; for (let i = 0; i <= 16; i++) { const a = i * 2 * Math.PI / 16; ring.push([Math.cos(a) * rt * 2.85, Math.sin(a) * rt * 2.85, 0]); }
          K.railing(M, ring, { h: 1.0, posts: 99 });
          K.cupola(M, { r: rt * 1.1, h: rt * 0.9 });
        });
        M.at(x, 0, 0, () => M.cyl(rt, ztop - R * 0.1, ztop + R * 0.1));
        M.callout('LOOKOUT PLATFORM', 1, [x + rt * 2.5, 0, ztop + R * 0.12], 1.6);
        M.callout('LADDER SHAFT', 1, [x, sideS * rt, ztop + R * 0.05], 0.9);
      });
    }
    if (eq.has('hook')) {
      M.part('TRAPEZE', () => {
        const x = L * hookX, zb = zc - rAt(x) * sz, drop = R * 0.42;
        const bar = zb - drop;
        for (const s of [1, -1]) {
          A.strut(M, envPt(x + R * 0.2, s * 15, form === 'twin' ? 0 : 0, 0.98), [x, s * R * 0.12, bar], R * 0.025);
          M.tube(envPt(x - R * 0.35, s * 15, 0, 0.98), [x, s * R * 0.12, bar], R * 0.015, {});
        }
        M.tube([x, -R * 0.15, bar], [x, R * 0.15, bar], R * 0.03, {});
        // hook and the plane under it
        M.pipe([[x, 0, bar], [x, 0, bar - R * 0.08], [x + R * 0.04, 0, bar - R * 0.1]], R * 0.012, { isect: false });
        const sp = Math.min(R * 0.95, 7);
        M.at(x - sp * 0.05, 0, bar - R * 0.1 - sp * 0.12, () => A.miniPlane(M, { span: sp }));
        M.tube([x, 0, bar - R * 0.1], [x - sp * 0.05, 0, bar - R * 0.1 - sp * 0.04], R * 0.012, {});
        M.callout('SKYHOOK TRAPEZE', 1, [x, sideS * R * 0.15, bar], 1.6);
        M.callout('MAIL PLANE', 1, [x - sp * 0.05, sideS * sp * 0.4, bar - R * 0.1 - sp * 0.12], 2.3);
      });
    }
    if (eq.has('cargo')) {
      M.part('CARGO SLING', () => {
        const x = engMode === 'gondola' || !eq.has('obscar') ? gx - gl * 0.05 : gx + gl * 0.2;
        const top = gz;
        const spread = top - R * 0.35;
        const sl = cargoKind === 'house' ? houseLen : cargoKind === 'boat' ? boatLen : 6.06;
        const zl = spread - R * 0.45 - (cargoKind === 'house' ? 0 : 0.3);
        M.at(x, 0, top, () => M.rx(180, () => K.winch(M, { r: gh * 0.07, w: gh * 0.35, at: [0, 0, gh * 0.08] })));
        M.line([[x, 0, top - gh * 0.1], [x, 0, spread]], { w: 1, pass: 1 });
        M.tube([x - sl * 0.45, 0, spread], [x + sl * 0.45, 0, spread], 0.1, {});
        const hw = cargoKind === 'house' ? 2.2 : cargoKind === 'boat' ? boatLen * 0.13 : 1.22;
        const hz = cargoKind === 'house' ? zl + 2.8 : cargoKind === 'boat' ? zl + boatLen * 0.14 : zl + 2.59;
        for (const sx of [-1, 1]) for (const s of [-1, 1]) A.wire(M, [x + sx * sl * 0.45, 0, spread], [x + sx * sl * 0.42, s * hw, hz], { w: 1 });
        if (cargoKind === 'container') { M.at(x, 0, zl, () => K.container(M, { label: designation })); M.callout('CARGO CONTAINER', 1, [x, sideS * 1.22, zl + 1.3], 2.2); }
        else if (cargoKind === 'boat') { M.at(x, 0, zl, () => A.boat(M, { len: boatLen, text: regB })); M.callout('LAUNCH', 1, [x, sideS * boatLen * 0.14, zl + boatLen * 0.1], 2.2); }
        else { M.at(x, 0, zl, () => A.house(M, { len: houseLen, w: 4.4, h: 2.8 })); M.callout('SLUNG HOUSE', 1, [x, sideS * 2.2, zl + 1.4], 2.2); }
        M.callout('SPREADER BAR', 1, [x + sl * 0.3, 0, spread], 1.1);
        M.callout('CARGO WINCH', 1, [x, 0, top - gh * 0.1], 0.8);
      });
    }
    if (eq.has('ballast')) {
      M.part('BALLAST BAG', () => {
        for (const s of [1, -1]) for (let i = 0; i < bagN; i++) {
          const x = gx - gl * 0.55 - R * 0.3 - i * R * 0.4;
          if (x < -L * 0.3) continue;
          const p = envPt(x, s * 38, form === 'twin' ? s * yo : 0, 0.995);
          const q = [p[0], p[1] + s * R * 0.04, p[2] - R * 0.22];
          A.wire(M, p, q, { w: 1 });
          M.at(q[0], q[1], q[2], () => A.bag(M, { r: R * 0.07 }));
          if (s === sideS && i === 0) M.callout('BALLAST BAG', bagN * 2, [q[0], q[1], q[2] - R * 0.08], 1.3);
        }
      });
    }
    let mastBase = null;
    if (mast) {
      M.part('MOORING MAST', () => {
        const xm = xn + R * 0.45, h = zc;
        K.girder(M, [xm, 0, 0.6], [xm, 0, h - R * 0.12], { w: Math.max(1.2, h * 0.07), sec: 4, battens: true });
        M.at(xm, 0, 0, () => { M.box([-1.2, -1.2, 0], [1.2, 1.2, 0.6]); });
        M.at(xm, 0, h - R * 0.12, () => {
          M.cyl(R * 0.1, 0, R * 0.06);
          M.cone(R * 0.05, R * 0.12, R * 0.06, R * 0.16);
          M.cyl(R * 0.04, R * 0.06, R * 0.12, {});
        });
        // arm to the cone
        M.tube([xm, 0, h - R * 0.02], [xn + R * 0.3, 0, zc], R * 0.03, {});
        for (const s of [1, -1]) A.wire(M, [xm, s * 0.6, h - R * 0.12], [xm + h * 0.5, s * h * 0.45, 0], { w: 0 });
        M.at(xm + Math.max(1.2, h * 0.07) * 0.75, 0, 0.6, () => K.ladder(M, { h: h - R * 0.2 - 0.6, w: 0.5 }));
        M.callout('MOORING MAST', 1, [xm, 0, h * 0.55], 2.3);
        mastBase = [xm, 0];
      });
    }

    // ------------------------------------------------ vocabulary
    const vol = envVolume(E, sy * sz) * hulls.length;
    const crew = Math.max(2, Math.min(12, Math.round(gl / 4) + crewExtra));
    const pax = Math.max(4, Math.min(60, Math.round(windows * 2 + gl * 0.3)));
    const cargoT = Math.max(1, Math.round(vol * 0.00045));
    const nEngT = (engMode === 'hull' ? nEng * (form === 'twin' ? 1 : 1) : 2) + (engMode === 'tail' && form !== 'twin' ? 1 : 0);
    let job, brief;
    const placeW = { COASTAL: 'the coast', ARCTIC: 'the Arctic', ALPINE: 'the Alps', DESERT: 'the desert', ISLAND: 'the islands', TROPICAL: 'the reefs', RIVER: 'the river', POLAR: 'the ice', VALLEY: 'the valleys', 'NORTH SEA': 'the North Sea' }[place];
    if (eq.has('cargo') && cargoKind === 'house') { job = 'CRANE'; brief = `Moves small houses to new sites across ${placeW} on a sling.`; }
    else if (eq.has('cargo') && cargoKind === 'boat') { job = sea ? 'WHALE-WATCHING' : 'RESCUE'; brief = sea ? `Takes ${word(pax)} passengers to whales and lowers a launch to the water.` : `Carries a launch on a sling for rescues on ${placeW}.`; }
    else if (eq.has('hook')) { job = 'MAIL'; brief = `Carries mail over ${placeW} and launches a small plane to deliver it.`; }
    else if (eq.has('obscar')) { job = sea ? 'WHALE-WATCHING' : 'SURVEY'; brief = sea ? `Takes ${word(pax)} passengers to whales and lowers a car below cloud.` : `Maps ${placeW} from a car lowered below the cloud on a cable.`; }
    else if (eq.has('deck')) { job = briefKey === 'heli' ? 'PATROL' : 'SANATORIUM'; brief = briefKey === 'heli' ? `Patrols ${placeW} for ${days} days with a helicopter on its roof.` : `Keeps ${word(Math.min(12, pax))} patients in clean air for ${days} days, with a roof deck.`; }
    else if (eq.has('cargo')) { job = 'CARGO'; brief = `Lifts ${cargoT} t containers over ${placeW} where there are no roads.`; }
    else if (eq.has('shaft')) { job = 'SURVEY'; brief = `Surveys ${placeW} with a lookout reached by a ladder shaft.`; }
    else { job = M.decorOn || true ? (cargoT > 8 ? 'CARGO' : 'MAIL') : 'MAIL'; brief = `Carries mail and ${word(Math.min(12, pax))} passengers across ${placeW}.`; }
    if (mast && brief.length < 60) brief = brief.replace(/\.$/, ', moored to a mast.');
    if (brief.length > 78) brief = brief.replace(/ across [^,.]*| over [^,.]*| to new sites/, '');
    const form2 = form === 'twin' ? 'TWIN AIRSHIP' : form === 'lifting' ? 'HYBRID AIRSHIP' : form === 'rigid' ? 'RIGID AIRSHIP' : 'AIRSHIP';
    const placeS = (place + ' ' + job + ' ' + form2).length > 34 ? (place.length > 6 ? 'HIGH' : place) : place;
    const drops = [];
    const bb = [L / 2, -L / 2];
    for (const x of bb) drops.push([x * 0.8, 0, zc - rAt(x * 0.8) * sz]);
    drops.push([gx + gl / 2, 0, gz], [gx - gl / 2, 0, gz]);
    for (const yc of hulls) drops.push([0, yc + sideS * R * sy, zc], [0, yc - sideS * R * sy, zc]);
    return {
      place: placeS, job, form: form2,
      brief,
      designation,
      specs: [['VOLUME', `${thou(Math.round(vol / 100) * 100)} M3`], ['CREW', String(crew)], ['POWER', `${nEngT} X ${kwEach} KW`], ['RANGE', `${thou(rangeK)} KM`]],
      float: !mast,
      drops: mast ? undefined : drops,
      figure: mastBase ? [mastBase[0] + 3, mastBase[1] + sideS * 4] : undefined,
    };
  },
};

function envVolume(E, k) {
  let v = 0;
  const n = 60;
  for (let i = 0; i < n; i++) { const x = -E.L / 2 + E.L * (i + 0.5) / n; v += Math.PI * E.rAt(x) ** 2 * (E.L / n); }
  return v * k;
}
