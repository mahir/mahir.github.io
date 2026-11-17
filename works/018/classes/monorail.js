// classes/monorail.js: a car on a single beam, with a segment of the beam and one or two
// pylons. Either straddling a concrete or steel beam (load tires on top, guide and
// stabilizing tires on the sides, under bogie fairings) or hanging below a slotted box
// girder or a lattice truss from bogie hangers (then it floats: drop lines and footprint).
// Cabins: a glazed streamlined pod, a boxy tram, two short linked cars, an open inspection
// platform. Jobs: harbor shuttle, canyon crossing, factory, orchard, airport.

import * as K from '../kit.js';
import { D2R, circlePts } from '../geom.js';
import { word, thou } from '../words.js';
import * as R from './parts-rail.js';

const JOBS = {
  HARBOR: { places: ['HARBOR', 'DOCKYARD', 'FERRY PIER'], job: 'SHUTTLE' },
  CANYON: { places: ['CANYON', 'GORGE', 'RAVINE'], job: 'CROSSING' },
  FACTORY: { places: ['FACTORY', 'STEELWORKS', 'MILL'], job: 'PARTS' },
  ORCHARD: { places: ['ORCHARD', 'VINEYARD', 'PLANTATION'], job: 'PICKING' },
  AIRPORT: { places: ['AIRPORT', 'AIRFIELD', 'SEAPLANE BASE'], job: 'TERMINAL' },
};

export default {
  id: 'monorail',
  family: 'rail',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const jobKey = M.pick(Object.keys(JOBS));
    const place = M.pick(JOBS[jobKey].places);
    const hang = jobKey === 'CANYON' ? M.chance(0.75) : M.chance(0.45);
    const cabin = jobKey === 'FACTORY' || jobKey === 'ORCHARD'
      ? M.wpick([[3, 'platform'], [1.5, 'tram'], [1, 'twin']])
      : M.wpick([[3, 'pod'], [2.5, 'tram'], [2, 'twin'], [0.6, 'platform']]);
    const Wc = cabin === 'platform' ? M.r(2.2, 2.8) : M.r(2.5, 3.1);
    const Hc = cabin === 'platform' ? 2.3 : M.r(2.5, 2.9);
    const Lc = cabin === 'twin' ? M.r(13, 16) : cabin === 'pod' ? M.r(9, 13) : cabin === 'platform' ? M.r(7, 9.5) : M.r(10, 14);
    const beam = hang ? M.wpick([[3, 'box'], [2, 'truss']]) : M.wpick([[3, 'concrete'], [1.5, 'steel']]);
    const pylon = hang ? M.wpick([[3, 'gamma'], [2, 'gantry'], [1.5, 'aframe']]) : M.wpick([[3, 'column'], [1.5, 'portal'], [1.5, 'lattice']]);
    const nP = M.pick([1, 2, 2]);
    const boarding = M.chance(0.45);
    const extras = M.shuffle(['aircon', 'scoop', 'antenna', 'horn', 'searchlight', 'board']).slice(0, M.ri(2, 4));
    const hoist = (jobKey === 'FACTORY' || jobKey === 'ORCHARD') && M.chance(0.35);
    const trolley = !hoist && M.chance(0.14);
    const clear = jobKey === 'CANYON' ? M.r(4.5, 7) : M.r(2.8, 4.5);
    const zTop = M.r(5.5, 8.0);
    const side = M.chance(0.5) ? 1 : -1;
    const rearV = M.chance(0.15);
    M.setView((rearV ? 180 - M.r(50, 62) : M.r(48, 62)) * side, M.r(24, 32));
    const ns = M.view.e[1] >= 0 ? 1 : -1;
    const unitNo = String(M.ri(1, 40)).padStart(2, '0');
    const glassKind = M.pick(['band', 'panes']);
    const carGap = M.r(0.9, 1.3);
    const beamExtra = M.r(7, 11);
    const seats = Math.round(Lc * Wc * (cabin === 'platform' ? 0.4 : 1.6));
    const crew = M.ri(2, 4);
    const P = { M, ns, Wc, Hc, Lc, cabin, unitNo, extras, glassKind, carGap, hang };

    const Lb = Lc + beamExtra;
    const xP = nP === 1 ? [Lc / 2 + beamExtra * 0.3] : [-Lb / 2 + 1.8, Lb / 2 - 1.8];
    if (nP === 1 && rearV) xP[0] = -xP[0];
    let zFloor, zBeamB, zBeamT;
    let figure = null;
    const yPyl = hang ? (boarding ? ns : -ns) * (Wc / 2 + 1.1) : 0;

    // ------------------------------------------------ beam
    M.part('BEAM', () => {
      if (!hang) {
        const bw = beam === 'concrete' ? 0.85 : 0.75, bh = beam === 'concrete' ? 1.5 : 1.35;
        zBeamT = zTop; zBeamB = zTop - bh;
        if (beam === 'concrete') {
          const B = M.extrude([[-bw / 2, zBeamB], [bw / 2, zBeamB], [bw / 2, zBeamT], [-bw / 2, zBeamT]], -Lb / 2, Lb / 2, { plane: 'yz' });
          for (const k of ['s1', 's3']) {
            const f = B.f(k);
            if (!f.on) continue;
            for (const x of [-Lb * 0.18, Lb * 0.22]) f.line(...R.fpt(M, f, [x, 0, zBeamB]), ...R.fpt(M, f, [x, 0, zBeamT]), { w: 1 });
            for (let x = -Lb / 2 + 0.6; x < Lb / 2; x += 1.2) for (const z of [zBeamB + 0.35, zBeamT - 0.35]) f.circle(...R.fpt(M, f, [x, 0, z]), f.mOf(0.9), { n: 6, w: 0 });
            if (f.tone > 0.2) f.hatch(f.box, { angle: 0, gap: 4.5 - 2 * f.tone, w: 0 });
          }
          const e = B.f('+x'); if (e.on) e.hatch(e.box, { angle: 45, gap: 2.4, w: 0 });
          const e2 = B.f('-x'); if (e2.on) e2.hatch(e2.box, { angle: 45, gap: 2.4, w: 0 });
        } else {
          // steel box girder with web stiffeners
          const B = M.extrude([[-bw / 2, zBeamB], [bw / 2, zBeamB], [bw / 2, zBeamT], [-bw / 2, zBeamT]], -Lb / 2, Lb / 2, { plane: 'yz' });
          for (const k of ['s1', 's3']) {
            const f = B.f(k);
            if (!f.on) continue;
            for (let x = -Lb / 2 + 0.75; x < Lb / 2; x += 1.5) f.line(...R.fpt(M, f, [x, 0, zBeamB + 0.06]), ...R.fpt(M, f, [x, 0, zBeamT - 0.06]), { w: 1 });
            f.rivets(...R.fpt(M, f, [-Lb / 2 + 0.1, 0, zBeamT - 0.05]), ...R.fpt(M, f, [Lb / 2 - 0.1, 0, zBeamT - 0.05]), { pitch: 7 });
            f.rivets(...R.fpt(M, f, [-Lb / 2 + 0.1, 0, zBeamB + 0.05]), ...R.fpt(M, f, [Lb / 2 - 0.1, 0, zBeamB + 0.05]), { pitch: 7 });
          }
          for (const s of [1, -1]) M.box([-Lb / 2, s * (bw / 2) - 0.12, zBeamT - 0.04], [Lb / 2, s * (bw / 2) + 0.12, zBeamT], { isect: false });
        }
        // power rail on insulator brackets along one side
        M.box([-Lb / 2, ns * (bw / 2 + 0.06), zBeamT - 0.75], [Lb / 2, ns * (bw / 2 + 0.1), zBeamT - 0.65], { isect: false });
        for (let x = -Lb / 2 + 1; x < Lb / 2; x += 2) M.box([x - 0.04, ns * bw / 2, zBeamT - 0.74], [x + 0.04, ns * (bw / 2 + 0.06), zBeamT - 0.66], { isect: false });
        M.callout('POWER RAIL', 1, [-Lb / 2 + 1.2, ns * (bw / 2 + 0.1), zBeamT - 0.7], 0.8);
        M.callout(beam === 'concrete' ? 'CONCRETE BEAM' : 'BOX GIRDER', 1, [Lb / 2 - 1.2, ns * bw / 2, zBeamT - bh / 2], 2.6);
        P.bw = bw;
        zFloor = zBeamT + 0.35;
      } else {
        zFloor = clear;
        const zr = zFloor + Hc;
        zBeamB = zr + 0.95;
        if (beam === 'box') {
          const h = 1.15, w = 1.1;
          zBeamT = zBeamB + h;
          const B = M.extrude([[-w / 2, zBeamB], [-0.13, zBeamB], [-0.13, zBeamB + 0.12], [-w / 2 + 0.08, zBeamB + 0.12], [-w / 2 + 0.08, zBeamT - 0.08], [w / 2 - 0.08, zBeamT - 0.08], [w / 2 - 0.08, zBeamB + 0.12], [0.13, zBeamB + 0.12], [0.13, zBeamB], [w / 2, zBeamB], [w / 2, zBeamT], [-w / 2, zBeamT]], -Lb / 2, Lb / 2, { plane: 'yz' });
          for (const k of ['s9', 's11', 's10']) {
            const f = B.f(k);
            if (!f.on || f.w < 1) continue;
            for (let x = -Lb / 2 + 0.75; x < Lb / 2; x += 1.5) f.line(...R.fpt(M, f, [x, 0, zBeamB + 0.06]), ...R.fpt(M, f, [x, 0, zBeamT - 0.06]), { w: 1 });
            f.rivets(...R.fpt(M, f, [-Lb / 2 + 0.1, 0, zBeamT - 0.05]), ...R.fpt(M, f, [Lb / 2 - 0.1, 0, zBeamT - 0.05]), { pitch: 7 });
            if (f.tone > 0.3) f.hatch(f.box, { angle: 90, gap: 4.5 - 2 * f.tone, w: 0 });
          }
          for (const k of ['s0']) { const f = B.f(k); if (f.on) f.hatch(f.box, { angle: 0, gap: 3, w: 0 }); }
          M.callout('SLOTTED BOX GIRDER', 1, [Lb / 2 - 1.2, ns * w / 2, zBeamB + h / 2], 2.6);
        } else {
          const w = 1.3;
          zBeamT = zBeamB + 0.35 + w;
          K.girder(M, [-Lb / 2, 0, zBeamB + 0.35 + w / 2], [Lb / 2, 0, zBeamB + 0.35 + w / 2], { w, sec: 4, bay: 1.4 });
          // running rail hung under the truss
          M.box([-Lb / 2, -0.08, zBeamB + 0.12], [Lb / 2, 0.08, zBeamB + 0.22], { isect: false });
          M.box([-Lb / 2, -0.03, zBeamB + 0.22], [Lb / 2, 0.03, zBeamB + 0.35], { isect: false });
          M.box([-Lb / 2, -0.12, zBeamB], [Lb / 2, 0.12, zBeamB + 0.12], { isect: false });
          M.callout('LATTICE GIRDER', 1, [Lb / 2 - 1.5, ns * w / 2, zBeamB + 0.35 + w], 2.6);
          M.callout('RUNNING RAIL', 1, [Lb / 2 - 1.0, ns * 0.12, zBeamB + 0.1], 0.8);
        }
      }
      M.info.centers = [[[-Lb / 2 - 0.6, 0, (zBeamB + zBeamT) / 2], [Lb / 2 + 0.6, 0, (zBeamB + zBeamT) / 2]]];
    });

    // ------------------------------------------------ pylons
    M.part('PYLON', () => {
      for (const x of xP) M.at(x, 0, 0, () => buildPylon(M, P, { kind: pylon, zB: zBeamB, zT: zBeamT, y: yPyl, hang }));
      M.callout('PYLON', nP, [xP[0], hang ? yPyl : ns * 0.5, zBeamB * 0.45], 2.4);
      for (const x of xP) M.info.centers.push([[x, hang ? yPyl : 0, -0.3], [x, hang ? yPyl : 0, 1.2]]);
    });

    // ------------------------------------------------ boarding platform on the first pylon
    if (boarding) {
      M.part('BOARDING PLATFORM', () => {
        const xq = xP[0];
        const x = xq - Math.sign(xq || 1) * 2.0;
        const y0 = ns * (Wc / 2 + 0.12), y1 = ns * (Wc / 2 + 1.7);
        const zp = zFloor;
        const D = M.box([x - 2.2, Math.min(y0, y1), zp - 0.18], [x + 2.2, Math.max(y0, y1), zp]);
        const f = D.f('+z');
        if (f.on) { f.hatch(f.box, { angle: 0, gap: 2.4, w: 0 }); f.hatch(f.box, { angle: 90, gap: 2.4, w: 0 }); }
        K.railing(M, [[x - 2.15, y0, zp], [x - 2.15, y1, zp], [x + 2.15, y1, zp], [x + 2.15, y0, zp]], { h: 1.0, posts: 1.1 });
        // stays down to the pylon or posts to the ground
        const yc = hang ? yPyl : 0;
        for (const dy of [0.3, 0.8]) M.tube([x - Math.sign(xq || 1) * 1.6, y0 + ns * dy, zp - 0.18], [xq - Math.sign(xq || 1) * 0.3, yc + ns * 0.3, zp - 1.9], 0.06, {});
        if (hang) M.box([Math.min(x, xq) - 0.1, Math.min(y0, yc) - 0.1, zp - 0.4], [Math.max(x, xq) + 0.1, Math.max(y0, yc) + 0.1, zp - 0.18], { isect: false });
        // ladder down to the ground at the outer edge
        M.at(x + 1.2, y1 + ns * 0.12, 0, () => M.rz(ns > 0 ? 0 : 180, () => M.rz(-90, () => K.ladder(M, { h: zp + 0.9, w: 0.5 }))));
        figure = [x - Math.sign(xq || 1) * 3.0, y1 + ns * 0.8];
        M.callout('BOARDING PLATFORM', 1, [x, (y0 + y1) / 2, zp], 2.2);
        M.callout('ACCESS LADDER', 1, [x + 1.2, y1 + ns * 0.12, zp * 0.5], 1.2);
      });
    }

    // ------------------------------------------------ the car(s)
    const cars = cabin === 'twin' ? [[-(Lc + carGap) / 4, (Lc - carGap) / 2], [(Lc + carGap) / 4, (Lc - carGap) / 2]] : [[0, Lc]];
    M.part('CAR BODY', () => {
      cars.forEach(([xc, lc], i) => M.at(xc, 0, zFloor, () => carBody(M, P, { len: lc, front: i === cars.length - 1, rear: i === 0, idx: i, n: cars.length })));
      if (cars.length === 2) {
        // bellows between the cars
        const xg = 0, g = carGap + 0.1;
        const Bl = M.at(xg, 0, zFloor + 0.15, () => M.box([-g / 2, -Wc * 0.36, 0], [g / 2, Wc * 0.36, Hc - 0.45], { isect: false }));
        for (const k of ['+y', '-y']) { const f = Bl.f(k); if (f.on) { const n = Math.max(3, Math.round(f.pxOf(f.w) / 3)); for (let j = 1; j < n; j++) { const xx = -f.w / 2 + f.w * j / n; f.line(xx, -f.h / 2, xx, f.h / 2, { w: j % 2 ? 0 : 1 }); } } }
        M.callout('BELLOWS', 1, [xg, ns * Wc * 0.36, zFloor + Hc / 2], 1.2);
      }
      M.callout(cabin === 'platform' ? 'INSPECTION DECK' : 'CABIN', cars.length, [cars[cars.length - 1][0], ns * Wc / 2, zFloor + Hc * 0.4], 2.4);
    });
    M.info.mass = [-Lc / 2, -Wc / 2, zFloor, Lc / 2, Wc / 2, zFloor + Hc];

    // ------------------------------------------------ running gear
    M.part(hang ? 'HANGER BOGIE' : 'BOGIE FAIRING', () => {
      const xb = [];
      for (const [xc, lc] of cars) { xb.push(xc - lc * 0.28, xc + lc * 0.28); }
      if (cars.length === 2) xb.splice(1, 2, cars[0][0] + cars[0][1] * 0.32, cars[1][0] - cars[1][1] * 0.32);
      for (const x of xb) M.at(x, 0, 0, () => (hang ? hanger(M, P, { zr: zFloor + Hc, zB: zBeamB, beam }) : straddle(M, P, { zT: zBeamT, zF: zFloor })));
      if (hang) {
        M.callout('HANGER', xb.length, [xb[0], 0, (zFloor + Hc + zBeamB) / 2], 2);
        M.callout('BOGIE FAIRING', xb.length, [xb[xb.length - 1], ns * 0.6, zFloor + Hc + 0.25], 1.4);
      } else {
        M.callout('BOGIE FAIRING', xb.length, [xb[xb.length - 1], ns * (P.bw / 2 + 0.34), zFloor - 0.6], 2);
        M.callout('GUIDE WHEEL', xb.length * 4, [xb[0] + 0.45, ns * (P.bw / 2 + 0.2), zBeamT - 1.25], 1.4);
      }
    });

    // ------------------------------------------------ roof and end equipment
    roofGear(M, P, { z: zFloor + Hc, hang });
    if (hoist) M.part('CHAIN HOIST', () => {
      const z0 = zFloor - 0.05;
      M.box([-Lc * 0.3, -0.08, z0 - 0.25], [Lc * 0.3, 0.08, z0], { isect: false });
      const xh = Lc * 0.12;
      M.box([xh - 0.2, -0.15, z0 - 0.5], [xh + 0.2, 0.15, z0 - 0.25], { isect: false });
      const zc = Math.max(0.6, z0 - (hang ? 1.6 : 0.6) - 1.0);
      M.line([[xh - 0.05, 0, z0 - 0.5], [xh - 0.05, 0, zc + 0.95]], { w: 1, pass: 1 });
      M.line([[xh + 0.05, 0, z0 - 0.5], [xh + 0.05, 0, zc + 0.95]], { w: 1, pass: 1 });
      if (hang) M.at(xh, 0, zc, () => K.crate(M, { s: [1.2, 1.0, 0.9] }));
      M.callout('CHAIN HOIST', 1, [xh, 0, z0 - 0.4], 1.4);
    });
    if (trolley) M.part('MAINTENANCE TROLLEY', () => {
      const x = Lb / 2 - 1.6;
      if (!hang) {
        M.at(x, 0, zBeamT, () => {
          for (const dx of [-0.5, 0.5]) M.at(dx, 0, 0.22, () => K.wheel(M, { r: 0.22, w: 0.16, hub: 0.1 }));
          const D = M.box([-0.8, -0.65, 0.4], [0.8, 0.65, 0.5]);
          const f = D.f('+z'); if (f.on) f.hatch(f.box, { angle: 90, gap: 2.4, w: 0 });
          K.railing(M, [[-0.75, -0.6, 0.5], [0.75, -0.6, 0.5], [0.75, 0.6, 0.5], [-0.75, 0.6, 0.5], [-0.75, -0.6, 0.5]], { h: 0.9, posts: 0.75 });
          M.box([-0.5, -0.3, 0.5], [-0.1, 0.3, 0.9]);
        });
      } else {
        M.at(x, 0, zBeamB, () => {
          M.box([-0.6, -0.1, -0.25], [0.6, 0.1, 0.05], { isect: false });
          M.tube([0, 0, -0.25], [0, 0, -1.6], 0.04, { isect: false });
          const D = M.box([-0.9, -0.6, -1.75], [0.9, 0.6, -1.6]);
          const f = D.f('+z'); if (f.on) f.hatch(f.box, { angle: 90, gap: 2.4, w: 0 });
          K.railing(M, [[-0.85, -0.55, -1.6], [0.85, -0.55, -1.6], [0.85, 0.55, -1.6], [-0.85, 0.55, -1.6], [-0.85, -0.55, -1.6]], { h: 0.95, posts: 0.85 });
        });
      }
      M.callout('MAINTENANCE TROLLEY', 1, [x, 0, hang ? zBeamB - 1.2 : zBeamT + 0.7], 2.2);
    });

    // ------------------------------------------------ vocabulary
    const formW = hang ? M.pick(['SUSPENDED MONORAIL', 'HANGING CAR']) : M.pick(['MONORAIL', 'MONORAIL CAR']);
    const jw = JOBS[jobKey].job;
    const hTxt = `${thou(zFloor)} m`;
    void hTxt;
    const seatsW = seats <= 12 ? word(seats) : String(seats);
    const briefs = {
      HARBOR: [`Carries ${seatsW} passengers between the ferry pier and the town.`, `Shuttles ${seatsW} passengers over the harbor cranes.`],
      CANYON: hang ? [`Hangs ${seatsW} passengers ${Math.round(zFloor)} m above the canyon floor.`, `Crosses the canyon below a single beam with ${seatsW} aboard.`] : [`Crosses the canyon on a single beam with ${seatsW} aboard.`],
      FACTORY: cabin === 'platform' ? [`Carries parts and ${word(crew)} fitters between the workshops.`] : [`Moves ${seatsW} workers between the shops above the yard.`],
      ORCHARD: cabin === 'platform' ? [`Carries ${word(crew)} pickers and fruit crates along the rows.`] : [`Takes ${seatsW} pickers along the rows at harvest.`],
      AIRPORT: [`Runs ${seatsW} travelers between the terminal and the car park.`, `Links the terminal and the hangars for ${seatsW} passengers.`],
    }[jobKey];
    let brief = briefs[M.ri(0, briefs.length - 1)];
    if (hoist && brief.length < 60) brief = brief.replace(/\.$/, ', with a chain hoist.');
    if (trolley && brief.length < 55) brief = brief.replace(/\.$/, '. A trolley rides behind.');
    brief = brief.charAt(0).toUpperCase() + brief.slice(1);
    const mass = Math.round(Lc * Wc * (cabin === 'platform' ? 0.45 : 0.75));
    return {
      place, job: jw, form: formW,
      brief: brief.slice(0, 78),
      specs: [['MASS', `${mass} T`], [cabin === 'platform' ? 'CREW' : 'SEATS', cabin === 'platform' ? String(crew) : String(seats)], ['SPEED', `${M.ri(5, 12) * 10} KM/H`], ['BEAM HEIGHT', `${thou(Math.round(zBeamB * 100) * 10)} MM`]],
      float: hang,
      drops: hang ? [[-Lc / 2, -Wc / 2, zFloor], [Lc / 2, -Wc / 2, zFloor], [Lc / 2, Wc / 2, zFloor], [-Lc / 2, Wc / 2, zFloor]] : undefined,
      figure: figure || [xP[0] + 2.5, ns * (Wc / 2 + 1.6)],
    };
  },
};

// ====================================================================== pylons
function buildPylon(M, P, o) {
  const { kind, zB, zT, hang } = o;
  const ns = P.ns;
  const footing = (x, y, s) => { const F = M.box([x - s / 2, y - s / 2, 0], [x + s / 2, y + s / 2, 0.35]); const f = F.f('+z'); if (f.on) for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) f.circle(a * s * 0.35, b * s * 0.35, s * 0.04, { n: 6, w: 1 }); };
  const concrete = (S) => { for (const k of ['+x', '-x', '+y', '-y', 's0', 's1', 's2', 's3']) { const f = S.f(k); if (!f.on || !f.front) continue; const n = Math.floor(f.h / 1.2); for (let j = 1; j <= n; j++) f.line(-f.w / 2, -f.h / 2 + j * 1.2, f.w / 2, -f.h / 2 + j * 1.2, { w: 0 }); if (f.tone > 0.25) f.hatch(f.poly, { angle: 90, gap: 4.6 - 2.2 * f.tone, w: 0 }); } };
  if (!hang) {
    const top = zB - 0.08;
    if (kind === 'column') {
      footing(0, 0, 2.4);
      const C = M.frustum([[-0.5, -0.65], [0.5, -0.65], [0.5, 0.65], [-0.5, 0.65]], 0.35, [[-0.38, -0.45], [0.38, -0.45], [0.38, 0.45], [-0.38, 0.45]], top - 0.7);
      concrete(C);
      const H = M.loft([[-0.42, -0.5, top - 0.7], [0.42, -0.5, top - 0.7], [0.42, 0.5, top - 0.7], [-0.42, 0.5, top - 0.7]], [[-0.6, -1.15, top], [0.6, -1.15, top], [0.6, 1.15, top], [-0.6, 1.15, top]]);
      concrete(H);
    } else if (kind === 'portal') {
      for (const s of [1, -1]) { footing(0, s * 1.6, 1.6); const C = M.box([-0.35, s * 1.6 - 0.35, 0.35], [0.35, s * 1.6 + 0.35, top - 0.6]); concrete(C); }
      const H = M.box([-0.45, -2.0, top - 0.6], [0.45, 2.0, top]); concrete(H);
    } else {
      for (const s of [1, -1]) {
        footing(0, s * 2.2, 1.0);
        K.girder(M, [0, s * 2.2, 0.35], [0, s * 0.45, top - 0.5], { w: 0.5, sec: 4, bay: 0.8 });
      }
      M.box([-0.35, -1.0, top - 0.5], [0.35, 1.0, top], {});
      M.tube([0, -1.6, top * 0.45], [0, 1.6, top * 0.45], 0.06, {});
    }
    // bearings under the beam
    for (const dx of [-0.3, 0.3]) M.box([dx - 0.15, -0.3, zB - 0.08], [dx + 0.15, 0.3, zB], { isect: false });
    return;
  }
  // hanging: the beam hangs from the top of the pylon by a short block
  const y = o.y;
  const yz = Math.sign(y) || 1;
  const zA = zT + 0.35;            // underside of the arm
  M.box([-0.3, -0.3, zT], [0.3, 0.3, zA], { isect: false });
  if (kind === 'gamma') {
    footing(0, y, 2.0);
    const C = M.frustum([[-0.45, y - 0.45], [0.45, y - 0.45], [0.45, y + 0.45], [-0.45, y + 0.45]], 0.35, [[-0.32, y - 0.32], [0.32, y - 0.32], [0.32, y + 0.32], [-0.32, y + 0.32]], zA + 0.6);
    concrete(C);
    const A = M.box([-0.35, Math.min(y, -yz * 0.6) - 0.3 * (yz > 0 ? 0 : 1), zA], [0.35, Math.max(y, -yz * 0.6) + 0.3 * (yz > 0 ? 1 : 0), zA + 0.6]);
    concrete(A);
    M.tube([0, y * 0.95, zA - 1.6], [0, y * 0.45, zA], 0.12, {});
  } else if (kind === 'gantry') {
    const yy = Math.abs(y);
    for (const s of [1, -1]) {
      footing(0, s * yy, 1.4);
      const C = M.box([-0.3, s * yy - 0.3, 0.35], [0.3, s * yy + 0.3, zA]);
      concrete(C);
    }
    const A = M.box([-0.4, -yy - 0.35, zA], [0.4, yy + 0.35, zA + 0.65]); concrete(A);
    for (const s of [1, -1]) M.tube([0, s * yy, zA - 1.4], [0, s * (yy - 1.2), zA], 0.1, {});
  } else {
    const yy = Math.abs(y) + 0.6;
    for (const s of [1, -1]) {
      footing(0, s * (yy + 1.2), 1.0);
      K.girder(M, [0, s * (yy + 1.2), 0.35], [0, s * (yy - 0.3), zA], { w: 0.55, sec: 4, bay: 0.85 });
    }
    K.girder(M, [0, -yy - 0.2, zA + 0.3], [0, yy + 0.2, zA + 0.3], { w: 0.55, sec: 4, bay: 0.8 });
  }
  void ns;
}

// ====================================================================== cars
// one car body at the origin (floor z = 0), along x, length len
function carBody(M, P, o) {
  const { Wc, Hc, cabin, ns } = P;
  const L = o.len;
  const isFront = o.front, isRear = o.rear;
  if (cabin === 'platform') return platformCar(M, P, o);
  if (cabin === 'pod') {
    // glazed streamlined pod: an oval lathe about x, floor flattened by a plinth
    const H = Hc * 1.05;
    const nose = Math.min(L * 0.28, 3.2);
    const pr = [];
    const n = 6;
    for (let i = 0; i <= n; i++) { const a = (i / n) * 90 * D2R; pr.push([Math.sin(a), -L / 2 + nose * (1 - Math.cos(a))]); }
    for (let i = 0; i <= n; i++) { const a = (i / n) * 90 * D2R; pr.push([Math.cos(a), L / 2 - nose + nose * Math.sin(a)]); }
    pr[0][0] = 0; pr[pr.length - 1][0] = 0;
    const S = M.at(0, 0, H / 2, () => M.scale(1, Wc / 2, H / 2, () => M.lathe(pr, { axis: 'x', sharpDeg: 30 })));
    if (M.decorOn) {
      const Lt = S.lat;
      Lt.shade({ t0: 0.02, t1: 0.98, gap: 1.8, gapMax: 7 });
      const tN = (x) => { // arc-length t of an x (approximate through the profile)
        let tot = 0; const cum = [0];
        for (let i = 1; i < pr.length; i++) { tot += Math.hypot(pr[i][0] - pr[i - 1][0], pr[i][1] - pr[i - 1][1]); cum.push(tot); }
        for (let i = 1; i < pr.length; i++) if (x <= pr[i][1]) { const f = (x - pr[i - 1][1]) / (pr[i][1] - pr[i - 1][1] || 1); return (cum[i - 1] + (cum[i] - cum[i - 1]) * f) / tot; }
        return 1;
      };
      for (const sd of [1, -1]) {
        const a0 = sd > 0 ? 100 : 260, a1 = sd > 0 ? 155 : 205;
        const ta = tN(-L / 2 + nose * 0.75), tb = tN(L / 2 - nose * 0.75);
        // glazed band: frame lines, mullions, dark glass
        Lt.meridian(a0, ta, tb, { w: 1 }); Lt.meridian(a1, ta, tb, { w: 1 });
        const nm = Math.max(4, Math.round((L - nose * 1.5) / 1.3));
        for (let i = 0; i <= nm; i++) { const t = ta + (tb - ta) * i / nm; Lt.shape((a0 + a1) / 2, t, [[-(a1 - a0) / 2 * D2R * 1.0, 0], [(a1 - a0) / 2 * D2R * 1.0, 0]], { w: 1 }); }
        if (P.glassKind === 'band') Lt.hatch(Math.min(a0, a1) + 2, Math.max(a0, a1) - 2, ta + 0.005, tb - 0.005, { gap: 1.25 });
        else for (let i = 0; i < nm; i++) { const t0 = ta + (tb - ta) * i / nm, t1 = ta + (tb - ta) * (i + 1) / nm; Lt.hatch(Math.min(a0, a1) + 3, Math.max(a0, a1) - 3, t0 + 0.006, t1 - 0.006, { gap: 1.1 }); }
        // belt line and a skirt line
        Lt.meridian(sd > 0 ? 92 : 268, tN(-L / 2 + nose * 0.4), tN(L / 2 - nose * 0.4), { w: 1 });
        Lt.meridian(sd > 0 ? 60 : 300, tN(-L / 2 + nose * 0.5), tN(L / 2 - nose * 0.5), { w: 0 });
      }
      // nose glazing at the ends
      if (isFront) Lt.hatch(135, 225, tN(L / 2 - nose * 0.62), tN(L / 2 - nose * 0.22), { gap: 1.1 });
      if (isRear) Lt.hatch(135, 225, tN(-L / 2 + nose * 0.22), tN(-L / 2 + nose * 0.62), { gap: 1.1 });
      for (const a of [135, 225]) { if (isFront) Lt.meridian(a, tN(L / 2 - nose * 0.62), tN(L / 2 - nose * 0.22), { w: 1 }); }
      // doors on the seen side
      const ad = ns > 0 ? 70 : 290;
      for (const dx of [-L * 0.12, L * 0.12]) Lt.shape(ad + (ns > 0 ? 18 : -18), tN(dx), [[-0.95, -0.5], [0.95, -0.5], [0.95, 0.5], [-0.95, 0.5]], { closed: true, w: 1 });
      Lt.text(P.unitNo, ns > 0 ? 80 : 280, tN(-L * 0.32), 0.35, { along: true });
    }
    // flat floor plinth (where the bogies fix)
    M.box([-L / 2 + nose * 0.6, -Wc * 0.32, -0.05], [L / 2 - nose * 0.6, Wc * 0.32, H * 0.2], { isect: false });
    if (isFront) M.at(L / 2 - 0.08, 0, H * 0.3, () => R.headlamp(M, { r: 0.13, visor: false }));
    if (isRear) M.at(-L / 2 + 0.08, 0, H * 0.3, () => M.rz(180, () => R.headlamp(M, { r: 0.11, visor: false })));
    return;
  }
  // boxy tram: rounded roof, slanted or flat ends, window row, doors, numbers
  const rr = 0.45;
  const S = M.extrude(R.roofProfile(Wc, Hc, rr), -L / 2, L / 2, { plane: 'yz', smoothDeg: 30 });
  const f = S.f(ns > 0 ? 's1' : 's11');
  if (f.on) {
    const n = Math.max(3, Math.round(L / 1.6));
    const dx = L / n;
    const doors = new Set([1, n - 2]);
    for (let i = 0; i < n; i++) {
      const a = -L / 2 + i * dx + 0.06, b = a + dx - 0.12;
      if (doors.has(i)) {
        const dr = R.frect(M, f, [a + 0.05, 0, 0.12], [b - 0.05, 0, Hc - rr - 0.2]);
        f.rect(dr, { w: 1 }); f.line((dr[0] + dr[2]) / 2, dr[1], (dr[0] + dr[2]) / 2, dr[3], { w: 1 });
        for (const s of [0, 1]) R.windowAt(f, [dr[0] + (dr[2] - dr[0]) * (s ? 0.56 : 0.08), dr[1] + (dr[3] - dr[1]) * 0.45, dr[0] + (dr[2] - dr[0]) * (s ? 0.92 : 0.44), dr[3] - (dr[3] - dr[1]) * 0.06], { frame: 0.08 });
        continue;
      }
      R.windowAt(f, R.frect(M, f, [a, 0, Hc * 0.42], [b, 0, Hc - rr - 0.15]), { bar: i % 2 === 0, frame: 0.1 });
      const lr = R.frect(M, f, [a, 0, 0.12], [b, 0, Hc * 0.38]);
      K.frame(f, lr, { inset: 1.4 });
      if (f.tone > 0.25) f.hatch([lr[0] + f.mOf(2.5), lr[1] + f.mOf(2.5), lr[2] - f.mOf(2.5), lr[3] - f.mOf(2.5)], { angle: 90, gap: 4.2 - 2 * f.tone, w: 0 });
      if (i === Math.floor(n / 2)) K.stencil(f, P.unitNo, (lr[0] + lr[2]) / 2, (lr[1] + lr[3]) / 2, Math.min(0.32, (lr[3] - lr[1]) * 0.5));
    }
    f.line(...R.fpt(M, f, [-L / 2, 0, Hc * 0.4]), ...R.fpt(M, f, [L / 2, 0, Hc * 0.4]), { w: 1 });
  }
  for (const [k, isEnd] of [['+x', isFront], ['-x', isRear]]) {
    const e = S.f(k);
    if (!e.on) continue;
    const xe = k === '+x' ? L / 2 : -L / 2;
    if (isEnd) {
      for (const s of [1, -1]) R.windowAt(e, R.frect(M, e, [xe, s * 0.05, Hc * 0.42], [xe, s * Wc * 0.42, Hc - rr * 0.7]), { angle: 40 });
      const br = R.frect(M, e, [xe, -Wc * 0.25, Hc - rr * 0.6], [xe, Wc * 0.25, Hc - 0.12]);
      if (P.extras.includes('board')) { K.frame(e, br, { inset: 1.2 }); K.stencil(e, P.unitNo, (br[0] + br[2]) / 2, (br[1] + br[3]) / 2, (br[3] - br[1]) * 0.5); }
    } else {
      // inner end: gangway door
      const dr = R.frect(M, e, [xe, -0.45, 0.1], [xe, 0.45, Hc - rr - 0.1]);
      e.rect(dr, { w: 1 });
      R.windowAt(e, [dr[0] + 0.1, dr[1] + (dr[3] - dr[1]) * 0.55, dr[2] - 0.1, dr[3] - 0.1]);
    }
  }
  if (isFront) {
    M.at(L / 2, 0, Hc * 0.25, () => { for (const s of [1, -1]) M.at(0, s * Wc * 0.33, 0, () => R.headlamp(M, { r: 0.12, visor: false })); });
    M.at(L / 2 + 0.05, 0, Hc * 0.18, () => M.box([0, -Wc * 0.45, -0.1], [0.12, Wc * 0.45, 0.1], { isect: false }));
  }
  if (isRear) M.at(-L / 2, 0, Hc * 0.25, () => M.rz(180, () => { for (const s of [1, -1]) M.at(0, s * Wc * 0.33, 0, () => R.headlamp(M, { r: 0.1, visor: false })); }));
  // side grab rails by the doors
  M.mirrorY(() => { for (const x of [-L / 2 + L / Math.max(3, Math.round(L / 1.6)) * 1 - 0.05, L / 2 - L / Math.max(3, Math.round(L / 1.6)) * 1 + 0.05]) R.handrail(M, [x, Wc / 2 + 0.06, 0.3], [x, Wc / 2 + 0.06, 1.6], [0, -0.06, 0], { pitch: 3 }); });
}

// open inspection platform: grated deck, railing, a cab hut at the front, tool chests
function platformCar(M, P, o) {
  const { Wc, ns } = P;
  const L = o.len;
  const D = M.box([-L / 2, -Wc / 2, 0], [L / 2, Wc / 2, 0.3]);
  const top = D.f('+z');
  if (top.on) { const r = [-top.w / 2 + top.mOf(2), -top.h / 2 + top.mOf(2), top.w / 2 - top.mOf(2), top.h / 2 - top.mOf(2)]; top.hatch(r, { angle: 0, gap: 2.4, w: 0 }); top.hatch(r, { angle: 90, gap: 2.4, w: 0 }); top.rect(r, { w: 1 }); }
  for (const k of ['+y', '-y', '+x', '-x']) { const f = D.f(k); if (f.on) f.rivets(-f.w / 2 + 0.08, 0, f.w / 2 - 0.08, 0, { pitch: 7 }); }
  const hl = Math.min(2.2, L * 0.3);
  const H = M.box([L / 2 - hl, -Wc * 0.46, 0.3], [L / 2 - 0.05, Wc * 0.46, 2.4]);
  for (const k of ['+y', '-y', '+x', '-x']) {
    const f = H.f(k);
    if (!f.on) continue;
    R.windowAt(f, [-f.w * 0.38, f.h * 0.05, f.w * 0.38, f.h * 0.4], { bar: k === '+x' });
    K.corrugated(f, [-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), -f.h * 0.02]);
  }
  M.box([L / 2 - hl - 0.12, -Wc * 0.5, 2.4], [L / 2 + 0.1, Wc * 0.5, 2.5], { isect: false });
  M.at(L / 2 - hl * 0.5, -ns * Wc * 0.25, 2.5, () => K.stack(M, { r: 0.07, h: 0.6 }));
  M.at(L / 2 + 0.02, 0, 1.0, () => R.headlamp(M, { r: 0.13 }));
  const x1 = L / 2 - hl - 0.15;
  K.railing(M, [[x1, Wc / 2 - 0.05, 0.3], [-L / 2 + 0.05, Wc / 2 - 0.05, 0.3], [-L / 2 + 0.05, -Wc / 2 + 0.05, 0.3], [x1, -Wc / 2 + 0.05, 0.3]], { h: 1.0, posts: 1.2 });
  // tool chests and a cable drum or fruit crates on the deck
  const T = M.box([-L / 2 + 0.3, ns * (Wc / 2 - 0.55) - 0.3, 0.3], [-L / 2 + 1.5, ns * (Wc / 2 - 0.55) + 0.3, 0.85]);
  for (const k of ['+y', '-y', '+x']) { const f = T.f(k); if (f.on) K.accessHatch(f, [-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2)], { noRivets: true }); }
  for (let i = 0; i < 3; i++) M.at(-L / 2 + 2.2 + i * 0.95, -ns * 0.35, 0.3, () => K.crate(M, { s: [0.8, 0.6, 0.55 + (i % 2) * 0.25] }));
  M.at(x1 - 0.8, ns * 0.5, 0.3, () => K.winch(M, { r: 0.3, w: 0.7, at: [0, 0, 0.42] }));
  M.callout('CAB HUT', 1, [L / 2 - hl / 2, ns * Wc * 0.46, 1.4], 1.6);
  M.callout('TOOL CHEST', 1, [-L / 2 + 0.9, ns * (Wc / 2 - 0.25), 0.6], 0.9);
  M.callout('CRATE', 3, [-L / 2 + 2.2, -ns * 0.05, 0.9], 1);
}

// straddle bogie: load tires on the beam top, guide and stabilizing tires on its sides, a
// fairing around it hanging below the car floor
function straddle(M, P, o) {
  const { zT, zF } = o;
  const bw = P.bw, ns = P.ns;
  const lf = 2.2;
  // load tires (mostly inside the fairing)
  for (const dx of [-0.55, 0.55]) M.at(dx, 0, zT + 0.42, () => K.wheel(M, { r: 0.42, w: 0.3, hub: 0.2 }));
  // guide wheels (upper) and stabilizing wheels (lower) on vertical axles
  for (const s of [1, -1]) for (const dx of [-0.45, 0.45]) for (const [z, r] of [[zT - 0.35, 0.24], [zT - 1.25, 0.2]]) {
    M.at(dx, s * (bw / 2 + r), z, () => M.rx(90, () => K.wheel(M, { r, w: 0.16, hub: r * 0.5 })));
  }
  // fairing: two side skirts and a top, with access hatches
  const yo = bw / 2 + 0.55, zb = zT - 1.0;
  for (const s of [1, -1]) {
    const S = M.box([-lf / 2, s * yo - (s > 0 ? 0.06 : 0), zb], [lf / 2, s * yo + (s > 0 ? 0 : 0.06), zF + 0.02]);
    const f = S.f(s > 0 ? '+y' : '-y');
    if (f.on && s === ns) { K.accessHatch(f, [-f.w * 0.3, -f.h * 0.35, f.w * 0.3, f.h * 0.15]); f.rivets(-f.w / 2 + 0.05, -f.h / 2 + 0.05, f.w / 2 - 0.05, -f.h / 2 + 0.05, { pitch: 6 }); }
    M.box([-lf / 2, s * (bw / 2 + 0.05), zT - 0.6], [lf / 2, s * yo, zT - 0.5], { isect: false });
  }
  for (const s of [1, -1]) M.loft([[s * lf / 2, -yo, zb], [s * lf / 2, yo, zb], [s * lf / 2, yo, zF], [s * lf / 2, -yo, zF]], [[s * (lf / 2 + 0.35), -yo, zF - 0.25], [s * (lf / 2 + 0.35), yo, zF - 0.25], [s * (lf / 2 + 0.35), yo, zF], [s * (lf / 2 + 0.35), -yo, zF]], { isect: false });
  // a collector shoe on the power rail side
  M.box([-0.15, ns * (bw / 2 + 0.1), zT - 0.78], [0.15, ns * (bw / 2 + 0.22), zT - 0.62], { isect: false });
}

// hanger bogie: a carriage running inside the beam (or on the rail under the truss), a
// neck plate down to the car roof, a pivot and a fairing on the roof
function hanger(M, P, o) {
  const { zr, zB, beam } = o;
  const ns = P.ns;
  if (beam === 'truss') {
    for (const dx of [-0.45, 0.45]) M.at(dx, 0, zB + 0.35 + 0.22, () => K.wheel(M, { r: 0.22, w: 0.12, hub: 0.1 }));
    M.box([-0.8, -0.18, zB + 0.25], [0.8, 0.18, zB + 0.4], { isect: false });
    for (const s of [1, -1]) M.box([-0.7, s * 0.1 - 0.03, zB - 0.25], [0.7, s * 0.1 + 0.03, zB + 0.55], { isect: false });
  }
  // neck plate through the slot
  const N = M.extrude([[-0.45, zB + 0.25], [0.45, zB + 0.25], [0.3, zr + 0.55], [-0.3, zr + 0.55]], -0.06, 0.06, { plane: 'xz' });
  const f = N.f(ns > 0 ? '+y' : '-y');
  if (f.on) { f.circle(...R.fpt(M, f, [0, 0, (zB + zr) / 2 + 0.2]), 0.12, { w: 1 }); f.rivets(...R.fpt(M, f, [-0.25, 0, zr + 0.65]), ...R.fpt(M, f, [0.25, 0, zr + 0.65]), { pitch: 5 }); }
  // pivot and the roof fairing
  M.at(0, 0, zr + 0.5, () => M.cyl(0.16, -0.25, 0.1, { axis: 'y', isect: false }));
  const Fa = M.loft([[-1.3, -0.75, zr - 0.05], [1.3, -0.75, zr - 0.05], [1.3, 0.75, zr - 0.05], [-1.3, 0.75, zr - 0.05]], [[-0.8, -0.4, zr + 0.4], [0.8, -0.4, zr + 0.4], [0.8, 0.4, zr + 0.4], [-0.8, 0.4, zr + 0.4]]);
  for (let i = 0; i < Fa.F.length; i++) { const g = Fa.f(i); if (g.on && g.front && g.tone > 0.35) g.hatch(g.poly, { angle: 90, gap: 4.4 - 2 * g.tone, w: 0 }); }
  // swing dampers to the roof
  for (const s of [1, -1]) M.tube([s * 0.35, 0, zr + 0.55], [s * 1.1, 0.0, zr + 0.1], 0.04, { isect: false });
}

// roof gear: air conditioners, scoops, antenna, horn, searchlight
function roofGear(M, P, o) {
  const { Lc, Wc, ns, extras, cabin } = P;
  const z = o.z;
  if (cabin === 'platform') return;
  const zr = z - (cabin === 'pod' ? 0.05 : 0);
  M.part('ROOF EQUIPMENT', () => {
    if (extras.includes('aircon')) {
      const x = o.hang ? 0 : Lc * 0.1;
      const B = M.box([x - 1.0, -Wc * 0.25, zr - 0.15], [x + 1.0, Wc * 0.25, zr + 0.35]);
      for (const k of ['+y', '-y', '+x', '-x']) { const f = B.f(k); if (f.on) K.louver(f, [-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2)]); }
      const t = B.f('+z'); if (t.on) { t.circle(-0.45, 0, 0.3, { w: 1 }); t.circle(0.45, 0, 0.3, { w: 1 }); t.hatch(circlePts(-0.45, 0, 0.28, 0.28, 16), { angle: 0, gap: 2.2, w: 0 }); t.hatch(circlePts(0.45, 0, 0.28, 0.28, 16), { angle: 0, gap: 2.2, w: 0 }); }
      M.callout('AIR CONDITIONER', 1, [x, 0, zr + 0.35], 1.2);
    }
    if (extras.includes('scoop')) {
      for (const x of [-Lc * 0.33, Lc * 0.33]) M.loft([[x - 0.6, -0.35, zr - 0.1], [x + 0.2, -0.35, zr - 0.1], [x + 0.2, 0.35, zr - 0.1], [x - 0.6, 0.35, zr - 0.1]], [[x - 0.6, -0.3, zr + 0.12], [x + 0.25, -0.3, zr + 0.3], [x + 0.25, 0.3, zr + 0.3], [x - 0.6, 0.3, zr + 0.12]]);
      M.callout('AIR SCOOP', 2, [Lc * 0.33, 0, zr + 0.25], 0.9);
    }
    if (extras.includes('antenna')) { M.at(-Lc * 0.2, -ns * Wc * 0.2, zr, () => K.whip(M, { h: 1.4, lean: 12 })); M.callout('RADIO ANTENNA', 1, [-Lc * 0.2, -ns * Wc * 0.2, zr + 0.3], 0.5); }
    if (extras.includes('horn')) { M.at(Lc * 0.4, ns * 0.4, zr, () => { M.box([-0.05, -0.12, -0.05], [0.05, 0.12, 0.12]); M.at(0, 0, 0.2, () => K.horn(M, { r: 0.1 })); }); M.callout('HORN', 1, [Lc * 0.4, ns * 0.4, zr + 0.2], 0.6); }
    if (extras.includes('searchlight')) { M.at(Lc * 0.36, -ns * 0.5, zr - 0.05, () => K.searchlight(M, { r: 0.22 })); M.callout('SEARCHLIGHT', 1, [Lc * 0.36, -ns * 0.5, zr + 0.4], 0.8); }
  });
}
