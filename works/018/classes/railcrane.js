// classes/railcrane.js: working rail vehicles. A flat car on two bogies, standing on a short
// length of track, carrying the thing that gives it its job: a lattice crane on a slewing
// ring with counterweight and hook, a telescope on a fork mount, a radar dish with a weather
// mast, a searchlight battery, a drilling rig, a rocket on an erector cradle, or a small
// signal cabin with a stove pipe. Outriggers with jacks down to cribbing, tool lockers,
// cable drums, a ladder. Jobs: breakdown crane, track survey, eclipse observatory, weather
// station, launch car.

import * as K from '../kit.js';
import { D2R, circlePts } from '../geom.js';
import { word, thou } from '../words.js';
import * as R from './parts-rail.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const JOB = {
  BREAKDOWN: { main: [[1, 'crane']], word: 'BREAKDOWN', forms: ['CRANE', 'CRANE CAR'] },
  SURVEY: { main: [[2, 'drill'], [2, 'lights'], [1, 'theodolite']], word: 'TRACK SURVEY', forms: ['CAR', 'WAGON'] },
  ECLIPSE: { main: [[1, 'telescope']], word: 'ECLIPSE', forms: ['OBSERVATORY', 'OBSERVATORY CAR'] },
  WEATHER: { main: [[1, 'radar']], word: 'WEATHER', forms: ['STATION', 'STATION CAR'] },
  LAUNCH: { main: [[1, 'rocket']], word: 'LAUNCH', forms: ['CAR', 'WAGON'] },
};
const PLACES = ['MAIN LINE', 'MOUNTAIN', 'DESERT', 'COASTAL', 'PRAIRIE', 'POLAR', 'BRANCH LINE', 'FRONTIER'];

export default {
  id: 'railcrane',
  family: 'rail',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const job = M.wpick([[3, 'BREAKDOWN'], [2.2, 'SURVEY'], [1.6, 'ECLIPSE'], [1.6, 'WEATHER'], [1.6, 'LAUNCH']]);
    const main = M.wpick(JOB[job].main);
    const place = M.pick(PLACES);
    const gauge = place === 'MOUNTAIN' || place === 'BRANCH LINE' ? M.wpick([[2, 1.0], [1, 1.435]]) : M.wpick([[5, 1.435], [1, 1.676]]);
    const W = clamp(1.95 * gauge, 2.3, 3.1);
    const L = (main === 'crane' ? M.r(11, 14) : main === 'rocket' ? M.r(14, 17) : M.r(10, 14));
    const na = main === 'crane' && M.chance(0.5) ? 3 : 2;
    const fish = M.chance(0.6);
    const ballast = M.chance(0.6);
    const side = M.chance(0.5) ? 1 : -1;
    const rear = M.chance(0.15);
    M.setView((rear ? 180 - M.r(50, 62) : M.r(48, 62)) * side, M.r(24, 32));
    const ns = M.view.e[1] >= 0 ? 1 : -1;
    const outN = main === 'crane' || main === 'drill' || main === 'rocket' ? 4 : M.pick([0, 2, 4]);
    const pool = M.shuffle(['cabin', 'drums', 'lockers', 'generator', 'ladder', 'lamp', 'drums', 'lockers']).slice(0, M.ri(2, 4)).filter((v, i, a) => a.indexOf(v) === i);
    if (main === 'lights') { const i = pool.indexOf('generator'); if (i >= 0) pool.splice(i, 1); }
    const cabinKind = { roof: M.pick(['gable', 'arch', 'flat']), len: M.r(2.0, 3.0), h: M.r(1.9, 2.3), stove: M.chance(0.7) };
    if ((main === 'telescope' || main === 'radar') && !pool.includes('cabin') && M.chance(0.6)) pool[0] = 'cabin';
    const carry = M.chance(0.15);
    const filler = M.pick(['wheelset', 'rails', 'crates']);
    const unitNo = String(M.ri(100, 999));
    const crew = M.ri(2, 6);
    const P = { M, ns, W, L, gauge, unitNo, cabinKind };

    const RT = R.trackTop(ballast);
    let zd = 0;
    // deck layout: the main item takes a zone, the pool items fill the rest
    const zones = { main: main === 'rocket' ? [-L / 2 + 0.6, L / 2 - 0.3] : main === 'crane' ? [-L / 2 + 0.5, L * 0.18] : [-L * 0.1, L / 2 - 0.4] };
    let figure = null;
    const out = {};

    M.at(0, 0, 0, () => {
      R.track(M, { gauge, x0: -L / 2 - 2.2, x1: L / 2 + 2.2, ballast });
      // ---------------------------------------------- bogies and flat car
      let bt = 0;
      const Rw = 0.46;
      const pitch = na === 3 ? 1.7 : 1.9;
      const bl = (na - 1) * pitch + 2 * Rw + 0.7;
      const xb = [-L / 2 + bl / 2 + 0.8, L / 2 - bl / 2 - 0.8];
      M.part('BOGIE', () => {
        for (const x of xb) M.at(x, 0, RT, () => { bt = R.bogie(M, { n: na, pitch, r: Rw, gauge, kind: 'leaf', wheel: 'disc', nearSide: ns }).top; });
        M.callout('BOGIE', 2, [xb[1], ns * (R.wheelY(gauge) + 0.3), RT + Rw + 0.4], 1.6);
        M.info.centers = [];
        for (const x of xb) for (let i = 0; i < na; i++) { const ax = x - (na - 1) * pitch / 2 + i * pitch; M.info.centers.push([[ax, -1.2, RT + Rw], [ax, 1.2, RT + Rw]]); }
      });
      zd = RT + bt + 0.42;
      P.zd = zd;
      M.part('FLAT CAR', () => {
        const zs = zd - 0.42;
        M.mirrorY(() => {
          // side sill: plain or fish-belly between the bogies
          const pr = [[-L / 2, zd], [L / 2, zd], [L / 2, zs]];
          if (fish) { const a = xb[1] - bl / 2 - 0.3, b = xb[0] + bl / 2 + 0.3; pr.push([a, zs], [a - 1.0, zs - 0.38], [b + 1.0, zs - 0.38], [b, zs]); }
          pr.push([-L / 2, zs]);
          const S = M.extrude(pr, W / 2 - 0.14, W / 2, { plane: 'xz' });
          const f = S.f('+y');
          if (f.on) {
            f.rivets(...R.fpt(M, f, [-L / 2 + 0.1, 0, zd - 0.06]), ...R.fpt(M, f, [L / 2 - 0.1, 0, zd - 0.06]), { pitch: 6 });
            f.rivets(...R.fpt(M, f, [-L / 2 + 0.1, 0, zs + 0.06]), ...R.fpt(M, f, [L / 2 - 0.1, 0, zs + 0.06]), { pitch: 6 });
            for (let x = -L / 2 + 1.2; x < L / 2 - 1; x += 1.2) f.line(...R.fpt(M, f, [x, 0, zd - 0.1]), ...R.fpt(M, f, [x, 0, zs + 0.1]), { w: 0 });
            const pl = R.frect(M, f, [-0.7, 0, zs + 0.1], [0.7, 0, zd - 0.1]);
            K.frame(f, pl, { inset: 1.2 }); K.stencil(f, unitNo, (pl[0] + pl[2]) / 2, (pl[1] + pl[3]) / 2, Math.min(0.2, (pl[3] - pl[1]) * 0.55));
            if (f.tone > 0.3) f.hatch(f.poly, { angle: 90, gap: 4.6 - 2 * f.tone, w: 0 });
          }
          // stake pockets and tie-down rings
          for (let x = -L / 2 + 0.9; x < L / 2 - 0.6; x += 1.5) M.box([x - 0.08, W / 2, zd - 0.2], [x + 0.08, W / 2 + 0.08, zd - 0.02], { isect: false });
        });
        const D = M.box([-L / 2, -W / 2 + 0.14, zd - 0.12], [L / 2, W / 2 - 0.14, zd]);
        const top = D.f('+z');
        if (top.on) { const n = Math.round(L / 0.3); for (let i = 1; i < n; i++) { const x = -top.w / 2 + top.w * i / n; top.line(x, -top.h / 2, x, top.h / 2, { w: 0 }); } }
        // ends: buffer beams, a hand brake wheel at one end
        for (const e of [1, -1]) M.at(e * L / 2, 0, 0, () => M.rz(e > 0 ? 0 : 180, () => {
          R.bufferBeam(M, { w: W, z: zd - 0.3, h: 0.4, d: 0.12 });
          M.mirrorY(() => M.at(-0.35, W / 2 - 0.25, zd - 0.42, () => R.steps(M, { n: 2, w: 0.38, gap: 0.33 })));
        }));
        M.at(-L / 2 + 0.25, -ns * (W / 2 - 0.3), zd, () => { M.cyl(0.04, 0, 1.0, { isect: false }); const Wh = M.at(0, 0, 1.0, () => M.torus(0.25, 0.02, { isect: false })); void Wh; for (let i = 0; i < 4; i++) M.rz(i * 45, () => M.box([-0.24, -0.01, 0.99], [0.24, 0.01, 1.01], { isect: false })); });
        M.callout('FLAT CAR', 1, [L * 0.3, ns * W / 2, zd - 0.2], 1.6);
        M.callout('HAND BRAKE', 1, [-L / 2 + 0.25, -ns * (W / 2 - 0.3), zd + 1.0], 0.6);
        M.callout('BUFFER', 4, [L / 2 + 0.4, ns * 0.875, zd - 0.3], 0.7);
      });
      M.info.mass = [-L / 2, -W / 2, RT, L / 2, W / 2, zd];

      // ---------------------------------------------- outriggers
      if (outN) {
        M.part('OUTRIGGER', () => {
          const xs = outN === 4 ? [xb[0] - bl / 2 + 0.1, xb[1] + bl / 2 - 0.1] : [0];
          const reach = W / 2 + M.decorOn * 0 + 1.3;
          for (const x of xs) M.mirrorY(() => {
            const zb = zd - 0.3;
            M.box([x - 0.18, W / 2 - 0.6, zb - 0.16], [x + 0.18, reach + 0.2, zb + 0.08]);
            M.box([x - 0.22, W / 2 - 0.62, zb - 0.2], [x + 0.22, W / 2 + 0.05, zb + 0.12], { isect: false });
            M.at(x, reach, 0, () => {
              const Cy = M.cyl(0.14, zb - 0.9, zb - 0.16);
              if (M.decorOn) Cy.lat.shade({ gap: 1.6 });
              M.cyl(0.09, 0.42, zb - 0.9, { isect: false });
              M.cyl(0.32, 0.34, 0.42, { isect: false });
              // timber cribbing under the pad
              for (let k = 0; k < 2; k++) for (const d of [-0.22, 0, 0.22]) {
                const zz = k * 0.17;
                if (k === 0) M.box([-0.6, d - 0.08, zz], [0.6, d + 0.08, zz + 0.17], { isect: false });
                else M.box([d - 0.08, -0.6, zz], [d + 0.08, 0.6, zz + 0.17], { isect: false });
              }
            });
          });
          M.callout('OUTRIGGER', outN, [xs[0], ns * (W / 2 + 0.8), zd - 0.3], 2);
          M.callout('JACK AND CRIBBING', outN, [xs[xs.length - 1], ns * reach, 0.3], 1.4);
          figure = [xs[xs.length - 1] + 1.6, ns * (reach + 1.4)];
        });
      }

      // ---------------------------------------------- the main item
      const z0 = zd;
      if (main === 'crane') crane(M, P, { x: (zones.main[0] + zones.main[1]) / 2 + 0.3, z: z0, carry }, out);
      else if (main === 'telescope') telescope(M, P, { x: L * 0.22, z: z0 }, out);
      else if (main === 'radar') radar(M, P, { x: L * 0.2, z: z0 }, out);
      else if (main === 'lights') lights(M, P, { x: L * 0.18, z: z0 }, out);
      else if (main === 'drill') drill(M, P, { x: L * 0.28, z: z0 }, out);
      else if (main === 'theodolite') theodolite(M, P, { x: L * 0.2, z: z0 }, out);
      else rocket(M, P, { x0: -L / 2 + 0.7, x1: L / 2 - 0.4, z: z0 }, out);

      // ---------------------------------------------- pool items on the free part of the deck
      const freeA = main === 'crane' ? L * 0.22 : -L / 2 + 0.4;
      const freeB = main === 'crane' ? L / 2 - 0.4 : main === 'rocket' ? -L / 2 + 0.4 : -L * 0.05;
      let cursor = main === 'crane' ? freeA + 0.2 : freeB;
      const take = (len) => { if (main === 'crane') { const a = cursor; cursor += len + 0.3; return a + len / 2 <= freeB ? a + len / 2 : null; } const b = cursor; cursor -= len + 0.3; return b - len / 2 >= freeA ? b - len / 2 : null; };
      for (const item of pool) {
        if (main === 'rocket' && item !== 'lamp' && item !== 'ladder') {
          // under the rocket: lockers along the sill only
          if (item === 'lockers') lockers(M, P, { x0: -L / 2 + 1.0, x1: L / 2 - 1.0 });
          continue;
        }
        if (item === 'cabin') { const x = take(cabinKind.len + 0.2); if (x != null) cabin(M, P, { x, z: zd, len: cabinKind.len, stove: cabinKind.stove }); }
        if (item === 'drums') { const x = take(1.6); if (x != null) drums(M, P, { x, z: zd }); }
        if (item === 'generator') { const x = take(2.0); if (x != null) generator(M, P, { x, z: zd }); }
        if (item === 'lockers') lockers(M, P, { x0: -L / 2 + 1.0, x1: L / 2 - 1.0 });
        if (item === 'ladder') M.part('LADDER', () => { M.at(L / 2 - 1.2, ns * (W / 2 + 0.1), RT, () => M.rz(ns > 0 ? -90 : 90, () => K.ladder(M, { h: zd - RT + 1.0, w: 0.45 }))); M.callout('LADDER', 1, [L / 2 - 1.2, ns * (W / 2 + 0.1), (RT + zd) / 2], 0.6); });
        if (item === 'lamp') M.part('LAMP', () => { for (const e of [1, -1]) M.at(e * (L / 2 - 0.05), -ns * (W / 2 - 0.3), zd + 0.05, () => M.rz(e > 0 ? 0 : 180, () => { M.cyl(0.03, 0, 0.6, { isect: false }); M.at(0, 0, 0.75, () => R.headlamp(M, { r: 0.1 })); })); M.callout('TAIL LAMP', 2, [L / 2, -ns * (W / 2 - 0.3), zd + 0.75], 0.6); });
      }
      if (carry && main !== 'crane' && main !== 'rocket') {
        const x = take(1.9);
        if (x != null) M.part('HANDCAR', () => { M.at(x, 0, zd, () => R.handcar(M, { gauge: 1.0, tilt: -10 })); M.callout('HANDCAR', 1, [x, 0, zd + 0.6], 1.6); out.carried = true; });
      }
      // the front of the deck: a spare wheelset, a bundle of rails or crates
      const mainEnd = { telescope: L * 0.22 + 1.7, radar: L / 2, lights: L * 0.18 + 0.9, drill: L * 0.28 + 1.4, theodolite: L * 0.2 + 0.9 }[main];
      if (mainEnd != null && L / 2 - 0.4 - mainEnd > 1.4) {
        const a = mainEnd + 0.2, b = L / 2 - 0.4, xm = (a + b) / 2;
        M.part(filler === 'wheelset' ? 'SPARE WHEELSET' : filler === 'rails' ? 'SPARE RAILS' : 'CRATE', () => {
          if (filler === 'wheelset') {
            M.at(xm, 0, zd + 0.46, () => R.wheelset(M, { r: 0.46, gauge, kind: 'disc', nearSide: ns }));
            for (const dx of [-0.5, 0.5]) M.loft([[xm + dx * 0.95, -W * 0.42, zd], [xm + dx * 0.95, W * 0.42, zd], [xm + dx * 0.95, W * 0.42, zd + 0.06], [xm + dx * 0.95, -W * 0.42, zd + 0.06]], [[xm + dx * 0.95 - Math.sign(dx) * 0.25, -W * 0.42, zd], [xm + dx * 0.95 - Math.sign(dx) * 0.25, W * 0.42, zd], [xm + dx * 0.95 - Math.sign(dx) * 0.25, W * 0.42, zd + 0.22], [xm + dx * 0.95 - Math.sign(dx) * 0.25, -W * 0.42, zd + 0.22]], { isect: false });
            M.callout('SPARE WHEELSET', 1, [xm, ns * R.wheelY(gauge), zd + 0.6], 1);
          } else if (filler === 'rails') {
            for (const x of [a + 0.2, b - 0.2]) M.box([x - 0.1, -W * 0.4, zd], [x + 0.1, W * 0.4, zd + 0.12], { isect: false });
            const prof = [[-0.068, 0], [0.068, 0], [0.068, 0.012], [0.013, 0.03], [0.013, 0.108], [0.036, 0.12], [0.036, 0.16], [-0.036, 0.16], [-0.036, 0.12], [-0.013, 0.108], [-0.013, 0.03], [-0.068, 0.012]];
            for (let i = 0; i < 6; i++) M.at(0, -0.6 + i * 0.24, zd + 0.12 + (i % 2) * 0.0, () => M.extrude(prof, a, b, { plane: 'yz', isect: false }));
            M.callout('SPARE RAILS', 6, [xm, ns * 0.6, zd + 0.28], 1);
          } else {
            const n = Math.max(1, Math.floor((b - a) / 1.1));
            for (let i = 0; i < n; i++) M.at(a + 0.55 + i * 1.1, ns * 0.3 * (i % 2 ? 1 : -1), zd, () => K.crate(M, { s: [0.95, 0.9, 0.6 + (i % 3) * 0.2] }));
            M.callout('CRATE', n, [a + 0.55, ns * 0.3, zd + 0.6], 0.8);
          }
        });
      }
      // railing around the free deck for the observatory and weather cars
      if (main === 'telescope' || main === 'radar') M.mirrorY(() => K.railing(M, [[-L / 2 + 0.3, W / 2 - 0.1, zd], [L / 2 - 0.3, W / 2 - 0.1, zd]], { h: 0.95, posts: 1.5 }));
    });

    // ------------------------------------------------ vocabulary
    const formW = M.pick(JOB[job].forms);
    const jw = JOB[job].word;
    const crewW = word(crew);
    const brief = {
      crane: [`Lifts derailed wagons back onto the rails, up to ${out.lift} t.`, `Clears wrecks from the line with a ${out.lift} t crane.`],
      telescope: [`Takes a telescope and ${crewW} observers into the path of an eclipse.`, `Carries a ${out.ap} mm telescope to where the eclipse is total.`],
      radar: [`Tracks weather fronts with a radar dish and a wind mast.`, `Measures wind and cloud along the line for ${crewW} observers.`],
      lights: [`Lights the line at night for ${crewW} surveyors.`, `Carries ${word(out.n)} searchlights and a generator for night work.`],
      drill: [`Bores test holes beside the line to ${out.depth} m.`, `Drills the ground under the line before it is rebuilt.`],
      theodolite: [`Surveys the line from a mast with a theodolite.`, `Carries ${crewW} surveyors and a theodolite mast.`],
      rocket: [out.raised ? `Raises a sounding rocket and fires it from the track.` : `Carries a sounding rocket and raises it to fire.`, `Launches a ${thou(out.len * 1000)} mm sounding rocket from the track.`],
    }[main];
    let b = brief[M.ri(0, brief.length - 1)];
    if (out.carried && b.length < 58) b = b.replace(/\.$/, ', and a handcar.');
    if (out.carriedHook) b = 'Lifts a derailed handcar back onto the rails.';
    const keySpec = { crane: ['LIFT', `${out.lift} T`], telescope: ['APERTURE', `${out.ap} MM`], radar: ['DISH', `${thou(Math.round(out.dish * 100) * 10)} MM`], lights: ['LIGHTS', `${out.n} X ${out.kw} KW`], drill: ['DEPTH', `${out.depth} M`], theodolite: ['MAST', `${thou(Math.round(out.mast * 100) * 10)} MM`], rocket: ['ROCKET', `${thou(Math.round(out.len * 100) * 10)} MM`] }[main];
    const mass = Math.round(L * 2.2 + (main === 'crane' ? out.lift * 0.9 : 8));
    return {
      place, job: jw, form: formW,
      brief: b.slice(0, 78),
      specs: [['MASS', `${mass} T`], keySpec, ['AXLES', na === 3 ? 'CO-CO' : '2-2'], ['CREW', String(crew)]],
      figure,
    };
  },
};

// ====================================================================== items
// lattice crane: slewing ring, engine house with cab, counterweight, A-frame, jib, hook
function crane(M, P, o, out) {
  const { W, ns } = P;
  const lift = M.pick([25, 36, 45, 60, 75]);
  const jl = M.r(9, 13);
  const rise = M.r(18, 55);
  const slew = M.r(-35, 35) + (M.chance(0.3) ? 180 : 0);
  const hookDrop = M.r(0.35, 0.8);
  const hw = W * 0.92;
  out.lift = lift;
  const hookCar = o.carry;
  M.part('SLEWING RING', () => {
    M.at(o.x, 0, o.z, () => {
      const S = M.cyl(1.2, 0, 0.25);
      M.cyl(1.3, 0.25, 0.4, { isect: false });
      if (S.top.on) { /* ring top hidden by the house */ }
      if (M.decorOn) S.lat.shade({ gap: 1.6, gapMax: 4 });
    });
    M.callout('SLEWING RING', 1, [o.x + 1.2, 0, o.z + 0.2], 1.4);
  });
  M.at(o.x, 0, o.z + 0.4, () => M.rz(slew, () => {
    const hl = 4.2, hh = 2.4;
    M.part('ENGINE HOUSE', () => {
      const H = M.box([-hl * 0.6, -hw / 2, 0], [hl * 0.4, hw / 2, hh]);
      for (const k of ['+y', '-y', '-x']) {
        const f = H.f(k);
        if (!f.on) continue;
        const g = f.grid(k === '-x' ? 2 : 4, 2, { gap: 2.4 });
        g.forEach((r, i) => { if (r.j === 1 && i % 2) K.louver(f, r); else if (r.j === 1) R.windowAt(f, [r[0] + f.mOf(3), r[1] + f.mOf(3), r[2] - f.mOf(3), r[3] - f.mOf(3)]); else K.corrugated(f, r); });
      }
      const rf = M.extrude([[-hw / 2 - 0.1, hh], [hw / 2 + 0.1, hh], [hw / 2 + 0.1, hh + 0.08], [0, hh + 0.35], [-hw / 2 - 0.1, hh + 0.08]], -hl * 0.6 - 0.1, hl * 0.4 + 0.1, { plane: 'yz' });
      void rf;
      // cab at the front corner with its own windows
      const C = M.box([hl * 0.4, -hw / 2, 0], [hl * 0.4 + 1.3, -hw / 2 + 1.25, hh - 0.1]);
      for (const k of ['+x', '-y', '+y']) { const f = C.f(k); if (f.on) R.windowAt(f, [-f.w * 0.38, -f.h * 0.02, f.w * 0.38, f.h * 0.4], { bar: true }); }
      M.box([hl * 0.4 - 0.05, -hw / 2 - 0.08, hh - 0.1], [hl * 0.4 + 1.42, -hw / 2 + 1.33, hh - 0.02], { isect: false });
      // counterweight slab
      const Cw = M.box([-hl * 0.6 - 0.75, -hw / 2 + 0.1, 0.1], [-hl * 0.6, hw / 2 - 0.1, 1.6]);
      for (const k of ['-x', '+y', '-y', '+z']) { const f = Cw.f(k); if (f.on) { f.hatch(f.box, { angle: 45, gap: 2.6, w: 0 }); f.rect(-f.w / 2 + f.mOf(3), -f.h / 2 + f.mOf(3), f.w / 2 - f.mOf(3), f.h / 2 - f.mOf(3), { w: 1 }); } }
      // exhaust stack and a ladder to the roof
      M.at(-hl * 0.35, hw * 0.3, hh, () => K.stack(M, { r: 0.1, h: 0.9 }));
      M.at(-hl * 0.6 - 0.75, -hw * 0.25, 1.6, () => M.rz(180, () => K.ladder(M, { h: hh - 1.6 + 0.2, w: 0.4 })));
      M.callout('ENGINE HOUSE', 1, [0, ns * hw / 2, hh * 0.6], 2);
      M.callout('COUNTERWEIGHT', 1, [-hl * 0.6 - 0.4, ns * hw * 0.4, 1.0], 1.6);
      M.callout('CRANE CAB', 1, [hl * 0.4 + 1.3, -hw / 2 + 0.6, hh * 0.6], 1.2);
    });
    // A-frame gantry and the jib
    const foot = [hl * 0.4 + 0.2, 0.35, 0.55];
    const tip = [foot[0] + Math.cos(rise * D2R) * jl, foot[1], foot[2] + Math.sin(rise * D2R) * jl];
    const gtop = [-hl * 0.25, 0, hh + 2.0];
    M.part('JIB', () => {
      for (const s of [1, -1]) {
        M.tube([-hl * 0.55, s * hw * 0.38, hh], gtop.map((v, i) => (i === 1 ? s * 0.25 : v)), 0.07, {});
        M.tube([hl * 0.15, s * hw * 0.38, hh], gtop.map((v, i) => (i === 1 ? s * 0.25 : v)), 0.07, {});
        // jib foot pins
        M.at(foot[0], foot[1] + s * 0.55, foot[2], () => M.cyl(0.12, -0.1, 0.1, { axis: 'y', isect: false }));
        M.box([hl * 0.4, foot[1] + s * 0.55 - 0.06, 0], [foot[0] + 0.15, foot[1] + s * 0.55 + 0.06, foot[2] + 0.1], { isect: false });
      }
      M.box([gtop[0] - 0.12, -0.35, gtop[2] - 0.1], [gtop[0] + 0.12, 0.35, gtop[2] + 0.1], { isect: false });
      // lattice jib, tapering at the head
      const mid = [foot[0] + (tip[0] - foot[0]) * 0.75, foot[1], foot[2] + (tip[2] - foot[2]) * 0.75];
      K.girder(M, foot, mid, { w: 0.85, sec: 4, bay: 0.9 });
      K.girder(M, mid, tip, { w: 0.55, sec: 4, bay: 0.7 });
      M.at(tip[0], tip[1], tip[2], () => { M.cyl(0.32, -0.12, 0.12, { axis: 'y', isect: false }); M.cyl(0.08, -0.3, 0.3, { axis: 'y', isect: false }); });
      // pendants from the gantry top to the jib head, hoist ropes down to the block
      for (const s of [1, -1]) M.line([[gtop[0], s * 0.25, gtop[2]], [tip[0], tip[1] + s * 0.2, tip[2]]], { w: 1, pass: 1 });
      M.line([[gtop[0], 0, gtop[2] - 0.05], [foot[0] - 0.5, 0, hh + 0.2]], { w: 1, pass: 1 });
      const hz = Math.max(P.zd - o.z - 0.4 + 0.6, tip[2] * hookDrop);
      const hk = [tip[0], tip[1], hz];
      for (const s of [-0.06, 0.06]) M.line([[tip[0], tip[1] + s, tip[2] - 0.3], [hk[0], hk[1] + s, hk[2] + 0.45]], { w: 1, pass: 1 });
      M.boxc([hk[0], hk[1], hk[2] + 0.25], [0.35, 0.42, 0.5], { isect: false });
      M.at(hk[0], hk[1], hk[2] + 0.25, () => M.cyl(0.18, -0.24, 0.24, { axis: 'y', isect: false }));
      const hp = [];
      for (let i = 0; i <= 8; i++) { const a = (-40 + 250 * i / 8) * D2R; hp.push([hk[0] + Math.sin(a) * 0.18, hk[1], hk[2] - 0.2 - Math.cos(a) * 0.18]); }
      M.pipe([[hk[0], hk[1], hk[2]], ...hp], 0.04, { isect: false });
      if (hookCar) {
        // a derailed handcar on slings
        const zc = hk[2] - 1.4;
        for (const dx of [-0.6, 0.6]) M.line([[hk[0], hk[1], hk[2] - 0.35], [hk[0] + dx, hk[1], zc + 0.35]], { w: 1, pass: 1 });
        M.at(hk[0], hk[1], zc, () => M.rz(20, () => R.handcar(M, { gauge: 1.0, tilt: 8 })));
        out.carriedHook = true;
        M.callout('DERAILED HANDCAR', 1, [hk[0], 0, zc + 0.4], 2.4);
      }
      M.callout('LATTICE JIB', 1, [mid[0], 0.4, mid[2]], 3);
      M.callout('HOOK BLOCK', 1, [hk[0], 0.2, hk[2] + 0.25], 1.5);
      M.callout('A-FRAME', 1, [gtop[0], 0.3, gtop[2] - 0.3], 1);
    });
  }));
}

// telescope on a fork mount on a pier, with a dew cap and a finder
function telescope(M, P, o, out) {
  const ap = M.pick([300, 450, 600, 750]);
  out.ap = ap;
  const tr = ap / 1000 * 0.75 + 0.15, tl = tr * 10;
  const alt = M.r(25, 60), az = M.r(-60, 60) + 180;
  M.part('TELESCOPE', () => {
    M.at(o.x, 0, o.z, () => {
      const Pi = M.cyl(0.45, 0, 1.1);
      if (M.decorOn) Pi.lat.shade({ gap: 1.6 });
      M.cyl(0.6, 1.1, 1.25, { isect: false });
      M.rz(az, () => {
        M.cyl(0.55, 1.25, 1.45);
        const fh = tr + 0.6;
        for (const s of [1, -1]) M.loft([[-0.25, s * (tr + 0.12), 1.45], [0.25, s * (tr + 0.12), 1.45], [0.25, s * (tr + 0.3), 1.45], [-0.25, s * (tr + 0.3), 1.45]], [[-0.15, s * (tr + 0.12), 1.45 + fh], [0.15, s * (tr + 0.12), 1.45 + fh], [0.15, s * (tr + 0.26), 1.45 + fh], [-0.15, s * (tr + 0.26), 1.45 + fh]]);
        M.box([-0.3, -tr - 0.3, 1.45], [0.3, tr + 0.3, 1.6]);
        M.at(0, 0, 1.45 + fh, () => M.ry(-alt, () => {
          const T = M.cyl(tr, -tl * 0.35, tl * 0.65, { axis: 'x' });
          if (M.decorOn) { T.lat.shade({ gap: 1.6 }); for (const t of [0.15, 0.4, 0.62, 0.85]) T.lat.ring(t, { w: 1 }); }
          const Dc = M.cyl(tr * 1.08, tl * 0.5, tl * 0.65 + tr * 1.2, { axis: 'x', isect: false });
          if (Dc.top.on) { Dc.top.circle(0, 0, tr * 0.95, { w: 1 }); Dc.top.hatch(circlePts(0, 0, tr * 0.93, tr * 0.93, 28), { angle: 60, gap: 1.0, gap2: 2.6, w: 0 }); }
          if (M.decorOn) { Dc.lat.ring(0.08, { w: 1 }); Dc.lat.shade({ gap: 1.5 }); }
          const C = M.cyl(tr * 1.12, -tl * 0.35 - 0.12, -tl * 0.35 + 0.05, { axis: 'x', isect: false });
          void C;
          M.cyl(tr * 0.35, -0.12, 0.12, { axis: 'y', isect: false });
          M.at(0, 0, tr + 0.18, () => { M.cyl(0.09, 0, tl * 0.4, { axis: 'x', isect: false }); for (const x of [0.2, tl * 0.3]) M.box([x - 0.03, -0.03, -0.18], [x + 0.03, 0.03, 0], { isect: false }); });
          M.at(-tl * 0.35 - 0.12, 0, 0, () => M.cyl(0.12, -0.3, 0, { axis: 'x', isect: false }));
          M.callout('TELESCOPE TUBE', 1, [tl * 0.3, 0, tr], 3);
          M.callout('DEW CAP', 1, [tl * 0.6, 0, tr * 1.08], 1);
        }));
        M.callout('FORK MOUNT', 1, [0, tr + 0.2, 1.45 + fh * 0.5], 1.6);
      });
    });
    M.callout('PIER', 1, [o.x, P.ns * 0.45, o.z + 0.6], 1);
  });
}

// radar dish on a pedestal and a lattice wind mast with cups and a vane
function radar(M, P, o, out) {
  const dr = M.r(1.3, 2.0);
  out.dish = dr * 2;
  const el = M.r(15, 55), az = M.r(0, 360);
  M.part('RADAR DISH', () => {
    M.at(o.x - 0.6, 0, o.z, () => { M.box([-0.7, -0.7, 0], [0.7, 0.7, 0.6]); M.at(0, 0, 0.6, () => K.dishMount(M, { r: dr, el, az })); });
    M.callout('RADAR DISH', 1, [o.x, 0, o.z + 0.6 + dr * 1.3], 3);
  });
  const mx = Math.min(o.x + dr + 1.1, P.L / 2 - 0.8), mh = M.r(6, 9);
  M.part('WIND MAST', () => {
    K.girder(M, [mx, -P.ns * 0.6, o.z], [mx, -P.ns * 0.6, o.z + mh], { w: 0.4, sec: 3, bay: 0.6 });
    M.at(mx, -P.ns * 0.6, o.z + mh, () => {
      M.cyl(0.03, 0, 0.6, { isect: false });
      M.at(0, 0, 0.55, () => { for (let i = 0; i < 3; i++) M.rz(i * 120, () => { M.tube([0, 0, 0], [0.35, 0, 0], 0.012, { isect: false }); M.at(0.38, 0, 0, () => M.sphere(0.06, { isect: false })); }); });
      M.box([-0.6, -0.4, 0.15], [0.6, -0.38, 0.2], { isect: false });
      M.at(0, -0.4, 0.2, () => { M.tube([-0.4, 0, 0], [0.4, 0, 0], 0.015, { isect: false }); M.plate([[-0.4, 0, 0], [-0.62, 0, 0.12], [-0.62, 0, -0.12]], {}); M.cone(0.05, 0, 0.4, 0.55, { axis: 'x', isect: false }); });
    });
    for (const s of [1, -1]) M.line([[mx, -P.ns * 0.6, o.z + mh * 0.8], [mx + s * 1.8, -P.ns * (P.W / 2 - 0.1), o.z]], { w: 0, pass: 1 });
    M.callout('WIND MAST', 1, [mx, -P.ns * 0.6, o.z + mh * 0.6], 1.8);
    M.callout('ANEMOMETER', 1, [mx, -P.ns * 0.6, o.z + mh + 0.55], 1.2);
  });
}

// searchlight battery on a frame with a generator
function lights(M, P, o, out) {
  const cols = M.pick([2, 3]), rows = M.pick([2, 2, 3]);
  const r = 0.46;
  out.n = cols * rows; out.kw = M.pick([5, 8, 12]);
  M.part('SEARCHLIGHT BATTERY', () => {
    const fx = o.x, fz = o.z;
    const fw = cols * 1.15, fh = rows * 1.15;
    M.box([fx - 0.6, -fw / 2 - 0.2, fz], [fx + 0.6, fw / 2 + 0.2, fz + 0.6]);
    for (const s of [1, -1]) K.girder(M, [fx, s * (fw / 2 + 0.1), fz + 0.6], [fx, s * (fw / 2 + 0.1), fz + 0.9 + fh], { w: 0.25, sec: 4, bay: 0.4 });
    K.girder(M, [fx, -fw / 2 - 0.1, fz + 1.0 + fh], [fx, fw / 2 + 0.1, fz + 1.0 + fh], { w: 0.25, sec: 4, bay: 0.4 });
    for (let j = 0; j < rows; j++) {
      M.box([fx - 0.1, -fw / 2, fz + 0.75 + j * 1.15], [fx + 0.1, fw / 2, fz + 0.82 + j * 1.15], { isect: false });
      for (let i = 0; i < cols; i++) M.at(fx, -fw / 2 + 0.575 + i * 1.15, fz + 0.82 + j * 1.15, () => M.rz((M.view.e[0] > 0 ? 0 : 180) + P.ns * 25, () => K.searchlight(M, { r })));
    }
    M.callout('SEARCHLIGHT', out.n, [fx + 0.3, -fw / 2 + 0.575, fz + 0.82 + (rows - 1) * 1.15 + 0.5], 3);
    M.callout('LIGHT TOWER', 1, [fx, P.ns * (fw / 2 + 0.1), fz + 0.6 + fh / 2], 1.4);
  });
  generator(M, P, { x: o.x - 3.0, z: o.z });
}

// drilling rig: lattice mast over a side platform, crown block, drill string, draw works
function drill(M, P, o, out) {
  const { W, ns } = P;
  const mh = M.r(8, 11);
  out.depth = M.pick([20, 30, 40, 60, 80]);
  const yp = ns * (W / 2 + 0.9);
  M.part('DRILL MAST', () => {
    // platform cantilevered over the side
    const D = M.box([o.x - 1.2, Math.min(ns * (W / 2 - 0.2), yp + ns * 0.9), o.z - 0.12], [o.x + 1.2, Math.max(ns * (W / 2 - 0.2), yp + ns * 0.9), o.z]);
    const f = D.f('+z'); if (f.on) { f.hatch(f.box, { angle: 0, gap: 2.4, w: 0 }); f.hatch(f.box, { angle: 90, gap: 2.4, w: 0 }); }
    K.railing(M, [[o.x - 1.15, yp + ns * 0.85, o.z], [o.x + 1.15, yp + ns * 0.85, o.z]], { h: 1.0, posts: 1.1 });
    for (const dx of [-1, 1]) M.tube([o.x + dx, yp + ns * 0.8, o.z - 0.12], [o.x + dx * 0.6, ns * (W / 2 - 0.1), o.z - 0.9], 0.05, {});
    // mast: four-post lattice tapering to the crown
    const base = [[o.x - 0.7, yp - 0.7], [o.x + 0.7, yp - 0.7], [o.x + 0.7, yp + 0.7], [o.x - 0.7, yp + 0.7]];
    const top = base.map(([x, y]) => [o.x + (x - o.x) * 0.3, yp + (y - yp) * 0.3]);
    for (let i = 0; i < 4; i++) K.strut(M, [base[i][0], base[i][1], o.z], [top[i][0], top[i][1], o.z + mh], 0.05, { collars: false });
    const n = Math.round(mh / 1.1);
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n;
      for (let i = 0; i < 4; i++) {
        const a = base[i], b = top[i], c = base[(i + 1) % 4], d = top[(i + 1) % 4];
        const p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, o.z + mh * t0];
        const p1 = [c[0] + (d[0] - c[0]) * t1, c[1] + (d[1] - c[1]) * t1, o.z + mh * t1];
        const p2 = [c[0] + (d[0] - c[0]) * t0, c[1] + (d[1] - c[1]) * t0, o.z + mh * t0];
        M.tube(k % 2 ? p0 : p2, k % 2 ? p1 : [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1, o.z + mh * t1], 0.025, { isect: false, seg: 6 });
        M.tube(p0, p2, 0.025, { isect: false, seg: 6 });
      }
    }
    M.box([o.x - 0.35, yp - 0.35, o.z + mh], [o.x + 0.35, yp + 0.35, o.z + mh + 0.3]);
    for (const dx of [-0.12, 0.12]) M.at(o.x + dx, yp, o.z + mh + 0.45, () => M.cyl(0.22, -0.04, 0.04, { axis: 'x', isect: false }));
    // traveling block, kelly and drill string to the ground beside the track
    const zb = o.z + mh * 0.55;
    for (const s of [-0.05, 0.05]) M.line([[o.x + s, yp, o.z + mh], [o.x + s, yp, zb + 0.4]], { w: 1, pass: 1 });
    M.boxc([o.x, yp, zb + 0.2], [0.3, 0.3, 0.45], { isect: false });
    M.tube([o.x, yp, zb], [o.x, yp, -0.2], 0.08, {});
    M.at(o.x, yp, o.z, () => { M.cyl(0.45, 0, 0.18, { isect: false }); M.box([-0.12, -0.12, 0.18], [0.12, 0.12, 0.6], { isect: false }); });
    M.at(o.x, yp, 0, () => M.cyl(0.35, 0, 0.12, { isect: false }));
    M.callout('DRILL MAST', 1, [o.x, yp, o.z + mh * 0.75], 3);
    M.callout('DRILL STRING', 1, [o.x, yp, o.z * 0.5], 1.6);
    M.callout('ROTARY TABLE', 1, [o.x, yp + ns * 0.45, o.z + 0.1], 1.2);
    M.callout('CROWN BLOCK', 1, [o.x, yp, o.z + mh + 0.3], 0.9);
  });
  M.part('DRAW WORKS', () => {
    M.at(o.x - 2.0, 0, o.z, () => { M.box([-0.8, -0.7, 0], [0.8, 0.7, 0.45]); K.winch(M, { r: 0.3, w: 1.0, at: [0, 0, 0.8] }); });
    M.line([[o.x - 2.0, 0, o.z + 1.1], [o.x, yp, o.z + mh]], { w: 1, pass: 1 });
    // pipe rack
    for (let i = 0; i < 5; i++) M.tube([o.x - 5.2, -ns * 0.6 + i * 0.12 * ns - 0.0, o.z + 0.2 + (i % 2) * 0.1], [o.x - 3.2, -ns * 0.6 + i * 0.12 * ns, o.z + 0.2 + (i % 2) * 0.1], 0.06, { isect: false });
    for (const x of [o.x - 5.0, o.x - 3.4]) M.box([x - 0.08, -ns * 0.75 - 0.4, o.z], [x + 0.08, -ns * 0.75 + 0.6 * ns + 0.4, o.z + 0.15], { isect: false });
    M.callout('DRAW WORKS', 1, [o.x - 2.0, ns * 0.7, o.z + 0.3], 1.4);
    M.callout('PIPE RACK', 1, [o.x - 4.2, -ns * 0.6, o.z + 0.3], 1);
  });
}

// survey: a theodolite on a telescopic mast, guy lines
function theodolite(M, P, o, out) {
  const mh = M.r(5, 8);
  out.mast = mh;
  M.part('SURVEY MAST', () => {
    M.at(o.x, 0, o.z, () => {
      M.box([-0.6, -0.6, 0], [0.6, 0.6, 0.4]);
      const n = 3;
      for (let i = 0; i < n; i++) { const S = M.cyl(0.16 - i * 0.04, 0.4 + i * mh / n - (i ? 0.2 : 0), 0.4 + (i + 1) * mh / n); if (M.decorOn) S.lat.shade({ gap: 1.6 }); M.cyl(0.19 - i * 0.04, 0.4 + (i + 1) * mh / n - 0.12, 0.4 + (i + 1) * mh / n, { isect: false }); }
      const zt = 0.4 + mh;
      M.box([-0.4, -0.4, zt], [0.4, 0.4, zt + 0.08]);
      K.railing(M, [[-0.38, -0.38, zt + 0.08], [0.38, -0.38, zt + 0.08], [0.38, 0.38, zt + 0.08], [-0.38, 0.38, zt + 0.08], [-0.38, -0.38, zt + 0.08]], { h: 0.6, posts: 0.76 });
      M.at(0, 0, zt + 0.08, () => { M.cyl(0.12, 0, 0.18); for (const s of [1, -1]) M.box([-0.04, s * 0.12 - 0.02, 0.18], [0.04, s * 0.12 + 0.02, 0.42], { isect: false }); M.at(0, 0, 0.36, () => { M.cyl(0.07, -0.2, 0.25, { axis: 'x' }); M.cyl(0.09, 0.2, 0.28, { axis: 'x', isect: false }); }); });
      for (const [x, y] of [[2.2, 1.2], [-2.2, 1.2], [2.2, -1.2], [-2.2, -1.2]]) M.line([[0, 0, zt * 0.85], [x, y * P.W / 2.4, 0.05]], { w: 0, pass: 1 });
    });
    M.callout('SURVEY MAST', 1, [o.x, 0.16, o.z + mh * 0.5], 2.4);
    M.callout('THEODOLITE', 1, [o.x, 0, o.z + mh + 0.8], 2);
  });
}

// sounding rocket on an erector cradle hinged at the rear, rams, blast plate
function rocket(M, P, o, out) {
  const { ns } = P;
  const raised = M.chance(0.6);
  const ang = raised ? M.r(35, 70) : 0;
  const Lr = Math.min(o.x1 - o.x0 - 0.6, M.r(9, 12.5));
  const rr = M.r(0.38, 0.55);
  const stages = M.pick([1, 2, 2]);
  out.len = Lr; out.raised = raised;
  const hz = o.z + 0.55;
  const hinge = [o.x0 + 0.4, 0, hz];
  M.part('ERECTOR', () => {
    M.mirrorY(() => { M.box([hinge[0] - 0.3, 0.45, o.z], [hinge[0] + 0.3, 0.6, hz + 0.25]); M.at(hinge[0], 0.5, hz, () => M.cyl(0.14, -0.1, 0.18, { axis: 'y', isect: false })); });
    M.at(hinge[0], 0, hz, () => M.ry(-ang, () => {
      const cl = Lr * 0.92;
      for (const s of [1, -1]) K.girder(M, [0, s * 0.5, 0.15], [cl, s * 0.5, 0.15], { w: 0.28, sec: 4, bay: 0.55 });
      for (let i = 0; i <= 4; i++) M.box([cl * i / 4 - 0.06, -0.62, 0.0], [cl * i / 4 + 0.06, 0.62, 0.12], { isect: false });
      // saddles holding the rocket
      for (const t of [0.25, 0.7]) M.box([cl * t - 0.12, -rr - 0.15, 0.12], [cl * t + 0.12, rr + 0.15, 0.3 + rr * 0.45], { isect: false });
      // the rocket
      M.at(0.25, 0, 0.3 + rr, () => {
        const nose = rr * 3.2;
        const pr = [[rr * 0.7, 0], [rr, 0.25], [rr, Lr - nose]];
        for (let i = 1; i <= 6; i++) { const a = (i / 6) * 90 * D2R; pr.push([rr * Math.cos(a), Lr - nose + nose * Math.sin(a)]); }
        pr[pr.length - 1][0] = 0;
        const B = M.lathe(pr, { axis: 'x', sharpDeg: 30 });
        if (M.decorOn) {
          B.lat.shade({ gap: 1.6, t0: 0.02, t1: 0.95 });
          const tot = Lr + 0.3;
          if (stages === 2) { B.lat.ring(0.42, { w: 1 }); B.lat.ring(0.435, { w: 1 }); }
          for (const t of [0.15, 0.62, 0.78]) B.lat.ring(t, { w: 0 });
          B.lat.text(P.unitNo, ns > 0 ? 90 : 270, 0.55, rr * 0.55, { along: true });
          void tot;
        }
        // fins and nozzle
        for (let i = 0; i < 4; i++) M.rx(45 + i * 90, () => M.extrude([[0.05, rr * 0.95], [1.4 * rr + 0.4, rr * 0.95], [0.9 * rr + 0.25, rr * 2.3], [0.1, rr * 2.4]], -0.025, 0.025, { plane: 'xz', isect: false }));
        if (stages === 2) for (let i = 0; i < 4; i++) M.rx(i * 90, () => M.extrude([[Lr * 0.42 + 0.05, rr * 0.95], [Lr * 0.42 + 0.6, rr * 0.95], [Lr * 0.42 + 0.35, rr * 1.55], [Lr * 0.42 + 0.1, rr * 1.6]], -0.02, 0.02, { plane: 'xz', isect: false }));
        M.at(0, 0, 0, () => M.ry(180, () => M.lathe([[rr * 0.35, 0], [rr * 0.45, 0.15], [rr * 0.62, 0.45]], { axis: 'x', open: true })));
        M.callout('SOUNDING ROCKET', 1, [Lr * 0.55, 0, rr], 3);
        M.callout('TAIL FIN', 4, [0.6, 0, rr * 1.8], 1);
      });
      M.callout('ERECTOR CRADLE', 1, [cl * 0.45, ns * 0.5, 0.15], 2);
    }));
    // rams from the deck to the cradle
    const tr = Lr * 0.45;
    const att = [hinge[0] + Math.cos(ang * D2R) * tr, 0, hz + Math.sin(ang * D2R) * tr + 0.1];
    for (const s of [1, -1]) {
      const b = [att[0] + (raised ? 1.6 : 2.2), s * 0.62, o.z + 0.1];
      const t = [att[0], s * 0.62, att[2]];
      const m = [b[0] + (t[0] - b[0]) * 0.55, b[1], b[2] + (t[2] - b[2]) * 0.55];
      M.tube(b, m, 0.11, {});
      M.tube(m, t, 0.07, {});
    }
    M.callout('ERECTING RAM', 2, [att[0] + 1.0, ns * 0.62, (o.z + att[2]) / 2], 1.6);
    // blast plate at the rear end
    M.at(o.x0 - 0.25, 0, o.z, () => M.ry(-30, () => { const S = M.box([-0.05, -1.0, 0], [0.05, 1.0, 1.6]); const f = S.f('-x'); if (f.on) f.hatch(f.box, { angle: 45, gap: 2.4, w: 0 }); }));
    M.callout('BLAST PLATE', 1, [o.x0 - 0.3, ns * 0.5, o.z + 0.6], 1.2);
  });
  cabin(M, P, { x: o.x1 - 1.6, z: o.z, len: 2.4, stove: false, small: true });
}

// signal cabin: gable roof, windows, door with steps, stove pipe, nameboard
function cabin(M, P, o) {
  const { W, ns } = P;
  const L = o.len, cw = W * 0.9, ch = o.small ? 2.0 : P.cabinKind.h;
  const roofK = o.small ? 'flat' : P.cabinKind.roof;
  M.part('CABIN', () => {
    M.at(o.x, 0, o.z, () => {
      const C = M.box([-L / 2, -cw / 2, 0], [L / 2, cw / 2, ch]);
      for (const k of ['+y', '-y', '+x', '-x']) {
        const f = C.f(k);
        if (!f.on) continue;
        const r = f.box;
        // board siding, a window, and on the seen side a door
        const n = Math.floor(f.pxOf(f.h) / 3.2);
        for (let j = 1; j < n; j++) f.line(r[0], r[1] + f.h * j / n, r[2], r[1] + f.h * j / n, { w: 0 });
        if (k === (ns > 0 ? '+y' : '-y')) {
          R.windowAt(f, [r[0] + f.w * 0.1, f.h * 0.0, r[0] + f.w * 0.45, f.h * 0.38], { bar: true });
          K.door(M, f, r[2] - f.w * 0.25, -f.h * 0.08, Math.min(0.75, f.w * 0.3), ch * 0.82);
        } else if (k === '+x' || k === '-x') R.windowAt(f, [-f.w * 0.25, f.h * 0.0, f.w * 0.25, f.h * 0.35], { bar: true });
      }
      let rpp;
      if (roofK === 'gable') rpp = [[-cw / 2 - 0.2, ch - 0.05], [cw / 2 + 0.2, ch - 0.05], [0, ch + cw * 0.38]];
      else if (roofK === 'arch') { rpp = []; for (let i = 0; i <= 8; i++) { const t = -1 + i / 4; rpp.push([t * (cw / 2 + 0.15), ch - 0.05 + 0.4 * (1 - t * t)]); } rpp.push(...rpp.slice().reverse().map(([y, z]) => [y * 0.98, z - 0.07])); }
      else rpp = [[-cw / 2 - 0.15, ch - 0.05], [cw / 2 + 0.15, ch - 0.05], [cw / 2 + 0.15, ch + 0.08], [-cw / 2 - 0.15, ch + 0.08]];
      const rp = M.extrude(rpp, -L / 2 - 0.2, L / 2 + 0.2, { plane: 'yz', smoothDeg: roofK === 'arch' ? 25 : 0 });
      for (const k of ['s1', 's2']) { const f = rp.f(k); if (f.on && f.front) { const n = Math.floor(f.pxOf(f.w) / 4); for (let i = 1; i < n; i++) f.line(-f.w / 2 + f.w * i / n, -f.h / 2, -f.w / 2 + f.w * i / n, f.h / 2, { w: 0 }); } }
      const gb = rp.f('+x'); if (gb.on) gb.circle(0, -gb.h * 0.05, gb.h * 0.16, { w: 1 });
      if (o.stove) M.at(-L * 0.25, -ns * cw * 0.2, ch + (roofK === 'gable' ? cw * 0.1 : roofK === 'arch' ? 0.25 : 0.05), () => { M.cyl(0.07, 0, 1.0); const Cp = M.cone(0.16, 0.05, 1.0, 1.15, { isect: false }); void Cp; M.cyl(0.1, 0.95, 1.0, { isect: false }); });
      // steps to the door
      M.at(L / 2 - L * 0.25, ns * (P.W / 2 - 0.15), 0, () => R.steps(M, { n: 2, w: 0.5, gap: 0.32 }));
      R.handrail(M, [L / 2 - 0.05, ns * (cw / 2 + 0.06), 0.4], [L / 2 - 0.05, ns * (cw / 2 + 0.06), 1.7], [0, -ns * 0.06, 0], { pitch: 3 });
    });
    M.callout(o.small ? 'FIRING CABIN' : 'CABIN', 1, [o.x - L * 0.2, ns * cw / 2, o.z + 1.2], 1.6);
    if (o.stove) M.callout('STOVE PIPE', 1, [o.x - L * 0.25, -ns * cw * 0.2, o.z + ch + cw * 0.1 + 0.8], 0.8);
  });
}

function drums(M, P, o) {
  M.part('CABLE DRUM', () => {
    M.at(o.x, 0, o.z, () => {
      for (const s of [1, -1]) M.box([-0.5, s * 0.75 - 0.05, 0], [0.5, s * 0.75 + 0.05, 0.75], { isect: false });
      M.at(0, 0, 0.75, () => {
        const D = M.cyl(0.35, -0.6, 0.6, { axis: 'y', isect: false });
        if (M.decorOn) { for (let i = 1; i < 12; i++) D.lat.ring(i / 12, { w: 0 }); D.lat.shade({ gap: 1.4 }); }
        for (const s of [1, -1]) { const F = M.cyl(0.62, s > 0 ? 0.6 : -0.66, s > 0 ? 0.66 : -0.6, { axis: 'y', isect: false }); const f = s > 0 ? F.top : F.bottom; if (f.on) { f.circle(0, 0, 0.5, { w: 0 }); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; f.circle(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0.07, { w: 1 }); } } }
        M.cyl(0.06, -0.85, 0.85, { axis: 'y', isect: false });
      });
    });
    M.callout('CABLE DRUM', 1, [o.x, P.ns * 0.66, o.z + 0.75], 1.2);
  });
}

function generator(M, P, o) {
  M.part('GENERATOR', () => {
    M.at(o.x, 0, o.z, () => {
      const G = M.box([-0.95, -P.W * 0.36, 0], [0.95, P.W * 0.36, 1.5]);
      for (const k of ['+y', '-y', '+x', '-x']) { const f = G.f(k); if (!f.on) continue; const g = f.grid(k === '+x' || k === '-x' ? 1 : 2, 1, { gap: 2.4 }); g.forEach((r, i) => (i % 2 ? K.accessHatch(f, r) : K.louver(f, r))); }
      const t = G.f('+z'); if (t.on) K.plain(t, [-t.w / 2 + t.mOf(2), -t.h / 2 + t.mOf(2), t.w / 2 - t.mOf(2), t.h / 2 - t.mOf(2)]);
      M.at(-0.5, -P.ns * 0.3, 1.5, () => K.stack(M, { r: 0.09, h: 0.8 }));
    });
    M.callout('GENERATOR', 1, [o.x, P.ns * P.W * 0.36, o.z + 0.8], 1.2);
  });
}

function lockers(M, P, o) {
  M.part('TOOL LOCKER', () => {
    const n = Math.max(2, Math.floor((o.x1 - o.x0) / 2.4));
    const zl = P.zd - 0.42;
    for (let i = 0; i < n; i++) {
      const x = o.x0 + (o.x1 - o.x0) * (i + 0.5) / n;
      if (Math.abs(x) < 1.2) continue;
      const B = M.box([x - 0.55, P.ns * (P.W / 2 - 0.75), zl - 0.55], [x + 0.55, P.ns * (P.W / 2 - 0.16), zl], { isect: false });
      const f = B.f(P.ns > 0 ? '+y' : '-y');
      if (f.on) K.accessHatch(f, [-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2)], { noRivets: true });
    }
    M.callout('TOOL LOCKER', n, [o.x0 + (o.x1 - o.x0) * 0.5 / n, P.ns * (P.W / 2 - 0.16), zl - 0.3], 1);
  });
}
