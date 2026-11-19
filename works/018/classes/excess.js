// classes/excess.js: an ordinary, sober vehicle with far too much of one thing. Plain base
// vehicles (a small 1970s saloon, a van, a single-deck bus, a bicycle, a flying boat, a light
// helicopter, a motorcycle) carry one excess each, picked from the seed with even weights:
//   speakers   PUBLIC ADDRESS CAR, 34 HORNS: the rear half under a cluster of horn speakers
//   lamps      CAR WITH 40 HEADLAMPS: a lamp frame on the bumper, roof bars, batteries
//   limo       LIMOUSINE, ELEVEN AXLES: a saloon stretched over n axles and n doors a side
//   decks      FIVE-DECK BUS: a single-deck bus with decks stacked on it, an outside stair
//   tandem     TANDEM BICYCLE FOR TWELVE: one frame, twelve saddles, twelve cranks, one chain
//   wings      NINE-WING FLYING BOAT: three triplane sets on one hull (after the Caproni Ca.60)
//   rotors     HELICOPTER WITH FIVE ROTORS: rotors stacked on one mast
//   caravans   CAR WITH THREE CARAVANS AND A BOAT: a car towing caravans towing a boat
//   chimney    PICKUP WITH A 14 M CHIMNEY: a brick stack three times its height, guyed
// Each excess has its own parameters (counts, sizes, layout, the base car's style), so two
// sheets of one excess differ. The counts in the title, brief and parts list are the ones built.
// ?variant=<name> on a test page forces one.

import * as K from '../kit.js';
import * as X from './extras.js';
import * as O from './parts-odd.js';
import * as A from './parts-air.js';
import { D2R } from '../geom.js';
import * as SEA from './parts-sea.js';

const NUM = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN'];
const num = (n) => NUM[n] || String(n);
const low = (n) => (NUM[n] ? NUM[n].toLowerCase() : String(n));
const thou = (n) => (n >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n));
const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';

const KINDS = ['speakers', 'lamps', 'limo', 'decks', 'tandem', 'wings', 'rotors', 'caravans', 'chimney'];
const forced = () => {
  try { const v = new URLSearchParams(globalThis.location?.search || '').get('variant'); return KINDS.includes(v) ? v : null; } catch (e) { return null; }
};

export default {
  id: 'excess',
  family: 'ground',
  weight: 2,
  build(M) {
    const pick = M.pick(KINDS.filter((k) => BUILD[k]));
    const kind = forced() || pick;
    const plate = `${M.pick(LET.split(''))}${M.pick(LET.split(''))} ${M.ri(100, 999)}`;
    return BUILD[kind](M, { plate });
  },
};

// view helpers: long things from the side, the near side chosen from the seed
function sideView(M, azMin, azMax, elMin = 22, elMax = 30) {
  const s = M.pick([1, -1]), back = M.chance(0.3);
  const az = s * M.r(azMin, azMax) + (back ? 180 : 0);
  M.setView(az, M.r(elMin, elMax));
  const e = M.view.e;
  return { sy: e[1] >= 0 ? 1 : -1, sx: e[0] >= 0 ? 1 : -1, az };
}
function figAt(M, x, sy, W, ext) { return A.figSpot(M, ext ?? 3); }
function carStyle(M) {
  return { style: M.wpick([[3, 'notch'], [1, 'fast']]), len: M.r(3.7, 4.2), wid: M.r(1.55, 1.68), hgt: M.r(1.32, 1.42), r: M.r(0.27, 0.31) };
}

const BUILD = {
  // ================================================================= the speaker car
  speakers(M, ctx) {
    const cs = carStyle(M);
    const want = M.ri(18, 46);
    const hK = M.r(1.0, 1.65);              // block height over the car's height
    const wK = M.r(1.12, 1.35);
    const over = M.r(0.1, 0.55);            // overhang behind the bumper
    const depthK = M.r(0.7, 1.0);
    const roofHorns = M.chance(0.55);
    const trailer = M.chance(0.4);
    const mast = M.chance(0.5);
    const wpe = M.ri(150, 900);
    const event = M.pick(['ELECTION', 'FAIRGROUND', 'STADIUM', 'BEACH', 'MARKET', 'RALLY']);
    const v = sideView(M, 32, 52, 22, 30);
    let c, sp;
    M.part('CAR', () => {
      // the cabin keeps only the front seats; a bulkhead behind them
      const L = cs.len;
      const cut = (L / 2 - Math.min(0.82, L * 0.21) - 0.2) - M.r(1.0, 1.2);
      c = O.car(M, { ...cs, cut, plate: ctx.plate, windows: 1 });
    });
    const W = c.W;
    const bw = W * wK, bh = c.zRoof * hK + 0.3;
    const xFace = c.rear - over;
    const depth = (c.xCab0 - 0.06 - xFace) * depthK;
    M.part('LOUDSPEAKER', () => {
      // a deck on the rear body for the cluster
      const D = M.box([c.rear + 0.05, -W / 2 + 0.03, c.zBelt - 0.04], [c.xCab0 - 0.02, W / 2 - 0.03, c.zBelt + 0.04]);
      void D;
      M.at(xFace, 0, c.zBelt + 0.04, () => M.rz(180, () => { sp = X.speakers(M, { w: bw, h: bh, n: want, depth }); }));
      M.callout('HORN LOUDSPEAKER', sp.n, [xFace - 0.05, v.sy * bw * 0.25, c.zBelt + bh * 0.35], 3);
      M.callout('SPEAKER CRADLE', 1, [c.xCab0 - 0.1, v.sy * (bw / 2 + 0.03), c.zBelt + bh * 0.5], 1.2);
    });
    M.info.mass = [Math.min(c.rear, xFace) - 0.1, -Math.max(W, bw) / 2, 0, c.front, Math.max(W, bw) / 2, Math.max(c.zRoof, c.zBelt + bh)];
    // cable loom from the cabin roof to the cradle, amplifier box on the roof
    M.part('AMPLIFIER', () => {
      const ax = (c.xCab0 + c.xCab1) / 2 - 0.1;
      const Bx = M.box([ax - 0.3, -0.35, c.zRoof], [ax + 0.25, 0.35, c.zRoof + 0.26]);
      for (const k of ['+x', '-x', '+y', '-y']) { const f = Bx.f(k); if (f.on) K.louver(f, [-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2)]); }
      K.pipeRun(M, [[ax - 0.3, 0.2, c.zRoof + 0.12], [c.xCab0 - 0.12, 0.2, c.zRoof + 0.12], [c.xCab0 - 0.12, 0.2, c.zBelt + 0.05]], 0.035);
      M.callout('AMPLIFIER', 1, [ax, v.sy * 0.35, c.zRoof + 0.13], 1.5);
      M.callout('CABLE LOOM', 1, [c.xCab0 - 0.15, 0.2, c.zRoof + 0.12], 0.8);
      if (roofHorns) {
        for (const s of [1, -1]) M.at(c.xCab1 - 0.25, s * 0.42, c.zRoof + 0.02, () => { M.box([-0.05, -0.04, 0], [0.05, 0.04, 0.12]); M.at(0, 0, 0.2, () => K.horn(M, { r: 0.13 })); });
        M.callout('ROOF SIREN', 2, [c.xCab1 - 0.1, 0.42, c.zRoof + 0.2], 1.1);
      }
      if (mast) {
        M.at(c.xCab1 - 0.3, -v.sy * 0.55, c.zRoof, () => K.whip(M, { h: 1.6, lean: 12 }));
        M.callout('RADIO AERIAL', 1, [c.xCab1 - 0.3, -v.sy * 0.55, c.zRoof + 0.3], 0.6);
      }
    });
    M.callout('BULKHEAD', 1, [c.xCab0, v.sy * 0.4, (c.zBelt + c.zRoof) / 2], 1.0);
    M.callout('DRIVER\'S CAB', 1, [(c.xCab0 + c.xCab1) / 2, v.sy * c.W / 2, (c.zBelt + c.zRoof) / 2], 1.4);
    let tx = 0;
    if (trailer) {
      M.part('GENERATOR TRAILER', () => {
        const tL = 1.6, tw = 1.25, th = 1.0, r = 0.26;
        tx = xFace - 1.1 - tL / 2;
        M.at(tx, 0, 0, () => {
          const B = M.box([-tL / 2, -tw / 2, r * 1.5], [tL / 2, tw / 2, r * 1.5 + th]);
          for (const k of ['+x', '-x', '+y', '-y']) { const f = B.f(k); if (!f.on) continue; const g = f.grid(Math.max(1, Math.round(f.w / 0.55)), 1, { gap: 2.2 }); g.forEach((q, i) => (i % 2 ? K.plain(f, q) : K.louver(f, q))); }
          for (const s of [1, -1]) M.at(0, s * (tw / 2 + 0.06), r, () => K.wheel(M, { r, w: 0.14, hub: 0.14, hubs: 'seen' }));
          M.at(-0.4, 0.3, r * 1.5 + th, () => K.stack(M, { r: 0.05, h: 0.45 }));
          M.tube([tL / 2, 0, r * 1.5], [tL / 2 + 0.75, 0, r * 1.6], 0.035, {});
        });
        M.callout('GENERATOR TRAILER', 1, [tx, v.sy * 0.62, 0.26 * 1.5 + 0.5], 1.6);
      });
    }
    const crowd = thou(Math.round(sp.n * wpe * M.r(1.8, 2.6) / 100) * 100);
    const kw = Math.max(1, Math.round(sp.n * wpe / 1000));
    const brief = M.pick([
      `Addresses ${crowd} people at a time from the back of a family car.`,
      `Carries ${sp.n} horns and their amplifier to ${event.toLowerCase()} meetings.`,
      `Announces the ${event.toLowerCase()} to every street within 3 km.`,
    ]);
    return {
      klass: `PUBLIC ADDRESS CAR, ${sp.n} HORNS`, family: 'ground', brief,
      specs: [['MASS', `${(1.1 + sp.n * 0.03).toFixed(1)} T`], ['HORNS', String(sp.n)], ['OUTPUT', `${kw} KW`], ['CREW', '2']],
      figure: figAt(M, 0, v.sy, W, c.L / 2 + 1.4),
    };
  },

  // ================================================================= forty headlamps
  lamps(M, ctx) {
    const cs = carStyle(M);
    const rows = M.ri(2, 4), cols = M.ri(4, 7);
    const lr = M.r(0.075, 0.1);
    const roofRows = M.ri(1, 3), roofCols = M.ri(4, 7);
    const sideBars = M.chance(0.6);
    const bumperPairs = M.ri(0, 2);
    const batt = M.ri(2, 4);
    const v = sideView(M, 30, 45, 24, 32);
    let c;
    M.part('CAR', () => { c = O.car(M, { ...cs, plate: ctx.plate }); });
    const W = c.W;
    let n = 2;  // the car's own pair
    // lamp frame on the front bumper
    M.part('LAMP FRAME', () => {
      const fx = c.front + 0.22, z0 = c.zc + 0.32, pitch = lr * 2.5;
      const fw = cols * pitch, fh = rows * pitch;
      const y0 = -fw / 2 + pitch / 2;
      for (const s of [-1, 1]) M.box([fx - 0.03, s * fw / 2 - 0.02 + (s > 0 ? 0.03 : -0.03), z0 - 0.05], [fx + 0.03, s * fw / 2 + 0.02 + (s > 0 ? 0.03 : -0.03), z0 + fh + 0.04]);
      for (let j = 0; j <= rows; j++) M.box([fx - 0.025, -fw / 2 - 0.05, z0 + j * pitch - 0.015], [fx + 0.025, fw / 2 + 0.05, z0 + j * pitch + 0.015], { isect: false });
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) M.at(fx + 0.03, y0 + i * pitch, z0 + (j + 0.5) * pitch, () => O.lampUnit(M, lr, { depth: lr * 1.2 }));
      for (const s of [-1, 1]) M.tube([fx, s * fw * 0.3, z0 - 0.04], [c.front + 0.05, s * fw * 0.3, c.zc + 0.16], 0.03, {});
      n += rows * cols;
      M.callout('LAMP FRAME', 1, [fx, v.sy * fw / 2, z0 + fh * 0.5], 2);
    });
    M.part('ROOF LAMP BAR', () => {
      const z = c.zRoof + 0.12, pitch = lr * 2.5;
      const bw = roofCols * pitch;
      const xr = c.xCab1 - 0.42 - (c.xCab1 - c.xCab0) * 0.1;
      for (const s of [-1, 1]) for (const xx of [xr - 0.4, xr + 0.1]) M.tube([xx, s * (W / 2 - 0.2), c.zRoof], [xx, s * (W / 2 - 0.2), z + roofRows * pitch * 0.5], 0.025, {});
      for (let j = 0; j < roofRows; j++) {
        const zz = z + j * pitch, xx = xr + 0.12 - j * 0.12;
        M.box([xx - 0.06, -bw / 2 - 0.05, zz - 0.02], [xx, bw / 2 + 0.05, zz + 0.02], { isect: false });
        for (let i = 0; i < roofCols; i++) M.at(xx, -bw / 2 + pitch * (i + 0.5), zz + lr + 0.02, () => O.lampUnit(M, lr));
      }
      n += roofRows * roofCols;
      M.callout('ROOF LAMP BAR', roofRows, [xr, v.sy * bw / 2, z + lr], 1.6);
    });
    if (sideBars) {
      M.part('PILLAR LAMP', () => {
        for (const s of [1, -1]) {
          const P = [c.xCab1 - 0.1, s * (W / 2 + 0.08), c.zBelt + 0.12];
          M.tube([P[0], s * (W / 2 - 0.02), P[2]], P, 0.02, { isect: false });
          M.at(P[0], P[1], P[2] + lr, () => O.lampUnit(M, lr * 1.3));
        }
        n += 2;
        M.callout('SPOT LAMP', 2, [c.xCab1 - 0.05, v.sy * (W / 2 + 0.1), c.zBelt + 0.12 + lr], 1.0);
      });
    }
    if (bumperPairs) {
      M.part('FOG LAMP', () => {
        for (let k = 0; k < bumperPairs; k++) for (const s of [1, -1]) M.at(c.front + 0.1, s * (W * 0.42 - k * 0.24), c.zc + 0.06, () => O.lampUnit(M, lr * 0.85));
        n += bumperPairs * 2;
        M.callout('FOG LAMP', bumperPairs * 2, [c.front + 0.12, v.sy * W * 0.42, c.zc + 0.06], 0.9);
      });
    }
    M.part('BATTERY BOX', () => {
      const z = c.zBelt + 0.02;
      for (let i = 0; i < batt; i++) {
        const x = c.rear + 0.25 + i * 0.36;
        const B = M.box([x, -W * 0.32, z], [x + 0.3, W * 0.32, z + 0.26]);
        for (const k of ['+y', '-y', '+x', '-x']) { const f = B.f(k); if (f.on) K.corrugated(f, f.box, { dir: 'v', gap: 2.2 }); }
        M.at(x + 0.15, -W * 0.2, z + 0.26, () => M.cyl(0.035, 0, 0.05));
      }
      M.callout('BATTERY BOX', batt, [c.rear + 0.4, v.sy * W * 0.32, z + 0.15], 1.2);
      K.pipeRun(M, [[c.rear + 0.3, 0.1, c.zBelt + 0.28], [c.xCab0 + 0.1, 0.1, c.zRoof + 0.05], [c.xCab1 - 0.5, 0.1, c.zRoof + 0.05]], 0.03);
      M.callout('CABLE LOOM', 1, [c.xCab0 + 0.1, 0.1, c.zRoof + 0.06], 0.7);
    });
    M.callout('HEADLAMP', n, [c.front + 0.25, v.sy * 0.3, c.zc + 0.5], 3);
    M.info.mass = [c.rear, -W / 2, 0, c.front + 0.3, W / 2, c.zRoof];
    const kw = (n * M.r(0.055, 0.1)).toFixed(1);
    const km = M.ri(2, 6);
    const brief = M.pick([
      `Lights ${km} km of unlit mountain road for the cars that follow it.`,
      `Carries ${n} headlamps for night rallies across the salt flats.`,
      `Finds the road in fog with ${n} lamps and the batteries to run them.`,
    ]);
    return {
      klass: `CAR WITH ${n} HEADLAMPS`, family: 'ground', brief,
      specs: [['MASS', `${(1.05 + n * 0.006 + batt * 0.04).toFixed(2)} T`], ['LAMPS', String(n)], ['LOAD', `${kw} KW`], ['CREW', '2']],
      figure: figAt(M, 0, v.sy, W, c.L / 2 + 1.5),
    };
  },

  // ================================================================= the long limousine
  limo(M, ctx) {
    const n = M.ri(5, 12);
    const pitch = M.r(1.15, 1.45);
    const flags = M.chance(0.6);
    const style = M.wpick([[3, 'notch'], [1, 'fast']]);
    const v = sideView(M, 58, 70, 20, 27);
    const r = M.r(0.29, 0.32);
    const L = 1.6 + (n - 1) * pitch;
    let c;
    M.part('CAR', () => {
      const x1 = L / 2, xf = x1 - 0.82, xr = xf - (n - 1) * pitch;
      const wsBase = xf - 0.25, rearBase = xr - 0.15;
      const nd = n - 1;
      const doorsX = [];
      for (let i = 0; i < nd; i++) { const a = wsBase - (wsBase - rearBase - 0.25) * i / nd, b = wsBase - (wsBase - rearBase - 0.25) * (i + 1) / nd; doorsX.push([a - 0.03, b + 0.03]); }
      c = O.car(M, { len: L, wid: M.r(1.75, 1.9), hgt: M.r(1.38, 1.46), r, axles: n, rearAxle: xr, wsBase, rearBase, doorsX, windows: nd, style, plate: ctx.plate });
    });
    const W = c.W;
    M.callout('AXLE', n, [c.wheels[Math.floor(n / 2)], v.sy * W / 2, c.r], 2.5);
    M.callout('PASSENGER DOOR', (n - 1) * 2, [(c.wheels[0] + c.wheels[1]) / 2, v.sy * W / 2, c.zBelt * 0.7], 2);
    M.callout('BODY SHELL', 1, [0, v.sy * W / 2, c.zBelt * 0.45], 1);
    M.callout('ROOF', 1, [0, 0, c.zRoof], 0.8);
    if (flags) {
      M.part('PENNANT', () => {
        for (const s of [1, -1]) M.at(c.front - 0.35, s * (W / 2 - 0.12), c.zHood - 0.02, () => M.rz(180, () => X.flag(M, { h: 0.6, w: 0.32, fh: 0.2, stripes: 2 })));
        M.callout('PENNANT STAFF', 2, [c.front - 0.35, v.sy * (W / 2 - 0.12), c.zHood + 0.3], 1.2);
      });
    }
    M.part('SUSPENSION', () => {
      for (const x of c.wheels) for (const s of [1, -1]) M.box([x - 0.5, s * (W / 2 - 0.5) - 0.04, c.zc - 0.02], [x + 0.5, s * (W / 2 - 0.5) + 0.04, c.zc + 0.05], { isect: false });
    });
    const seats = (n - 1) * 3;
    const brief = M.pick([
      `Carries ${seats} delegates and their driver from the airport in one car.`,
      `Takes a wedding party of ${seats} to church on ${low(n)} axles.`,
      `Drives ${seats} guests to the ministry without anyone sitting apart.`,
    ]);
    return {
      klass: `LIMOUSINE, ${num(n)} AXLES`, family: 'ground', brief,
      specs: [['MASS', `${(1.4 + n * 0.42).toFixed(1)} T`], ['AXLES', String(n)], ['SEATS', String(seats + 1)], ['TURNING CIRCLE', `${Math.round(L * 2.6)} M`]],
      figure: figAt(M, 0, v.sy, W, L / 2 + 1.4),
    };
  },
  // ================================================================= the many-deck bus
  decks(M, ctx) {
    const n = M.ri(3, 6);
    const L = M.r(9, 11.5), dh = M.r(1.95, 2.15);
    const outr = M.chance(0.75);
    const route = String(M.ri(2, 98));
    const town = M.pick(['OLD TOWN', 'HARBOR', 'STATION', 'MARKET', 'CATHEDRAL', 'UNIVERSITY']);
    const livery = M.pick(['CITY TRANSPORT', 'MUNICIPAL BUSES', 'TRANSIT', 'OMNIBUS CO.']);
    const v = sideView(M, 34, 48, 22, 28);
    let b;
    M.part('BUS', () => { b = O.bus(M, { len: L, decks: n, deckH: dh, route: `${route} ${town}`, livery }); });
    const W = b.W, x0 = -L / 2;
    // outside stair at the rear: a landing at every upper deck and flights across the back
    M.part('OUTSIDE STAIR', () => {
      const lw = 1.0;
      for (let d = 1; d < n; d++) {
        const z = b.z1 + dh * (d - 1);
        const P = M.box([x0 - lw, -W / 2, z - 0.1], [x0, W / 2, z]);
        const f = P.f('+z'); if (f.on) { f.hatch(f.box, { angle: 0, gap: 2.2, w: 0 }); f.hatch(f.box, { angle: 90, gap: 2.2, w: 0 }); }
        K.railing(M, [[x0, W / 2, z], [x0 - lw + 0.04, W / 2, z], [x0 - lw + 0.04, -W / 2, z], [x0, -W / 2, z]], { h: 0.95, posts: 0.8 });
        // the flight up to it from the landing below (or the road)
        const zl = d === 1 ? 0 : z - dh, dir = d % 2 ? 1 : -1;
        M.at(x0 - lw / 2, -dir * (W / 2 - 0.05), zl, () => M.rz(dir * 90, () => K.stairs(M, { len: W - 0.1, h: z - zl - 0.02, w: lw * 0.8, rail: false })));
        for (const s of [1, -1]) M.tube([x0 - lw + 0.06, s * (W / 2 - 0.06), zl], [x0 - lw + 0.06, s * (W / 2 - 0.06), z - 0.1], 0.035, { isect: false });
      }
      M.callout('OUTSIDE STAIR', 1, [x0 - 0.5, 0, b.z1 * 0.6], 2);
      M.callout('LANDING', n - 1, [x0 - 0.5, v.sy * W / 2, b.z1], 1.2);
    });
    if (outr) {
      M.part('OUTRIGGER', () => {
        for (const x of [b.wheels[0] + 0.9, b.wheels[1] - 0.6]) for (const s of [1, -1]) {
          const foot = [x, s * (W / 2 + 1.6), 0.25];
          M.tube([x, s * W / 2, b.z1 - 0.3], [foot[0], foot[1], foot[2] + 0.25], 0.07, {});
          M.tube([x, s * W / 2, b.zc + 0.3], [foot[0], foot[1], foot[2] + 0.2], 0.06, {});
          M.at(foot[0], foot[1], 0.25, () => K.wheel(M, { r: 0.25, w: 0.14, hub: 0.12, hubs: 'seen' }));
          M.at(foot[0], foot[1], foot[2] + 0.25, () => M.sphere(0.1));
        }
        M.callout('OUTRIGGER WHEEL', 4, [b.wheels[0] + 0.9, v.sy * (W / 2 + 1.6), 0.4], 1.6);
      });
    }
    M.callout('UPPER DECK', n - 1, [0, v.sy * W / 2, b.z1 + dh * (n - 1.5)], 2.6);
    M.callout('LOWER DECK', 1, [0.5, v.sy * W / 2, b.z1 - dh * 0.4], 1.4);
    M.callout('ROUTE BOARD', 1, [L / 2, 0, b.H - dh * 0.06], 1.2);
    M.callout('ROAD WHEEL', 4, [b.wheels[0], v.sy * W / 2, b.r], 0.9);
    M.callout('ENTRANCE DOOR', 1, [L / 2 - 0.9, -W / 2, b.z1 * 0.5], 1.0);
    const seats = Math.round(L * 3.3) * n;
    const brief = M.pick([
      `Carries ${seats} passengers on route ${route} without taking a second lane.`,
      `Takes ${seats} people to the ${town.toLowerCase()} on one set of wheels.`,
      `Seats ${seats} on ${low(n)} decks for the ${town.toLowerCase()} service.`,
    ]);
    return {
      klass: `${num(n)}-DECK BUS`, family: 'ground', brief,
      specs: [['MASS', `${Math.round(9 + n * 4.5)} T`], ['DECKS', String(n)], ['SEATS', String(seats)], ['CREW', String(n)]],
      figure: figAt(M, 0, v.sy, W, L / 2 + 1.6),
    };
  },

  // ================================================================= the long tandem
  tandem(M, ctx) {
    const n = M.ri(7, 14);
    const pitch = M.r(0.74, 0.86);
    const R = M.r(0.33, 0.36);
    const truss = M.chance(0.6);
    const mid = n >= 10 && M.chance(0.6);
    const bags = M.chance(0.5);
    const v = sideView(M, 58, 68, 20, 26);
    const zBB = 0.3, zTop = 0.86, zS = 0.98;
    const xs = [];
    for (let i = 0; i < n; i++) xs.push((n - 1) / 2 * pitch - i * pitch);    // seat posts, front first
    const xF = xs[0] + 0.62, xR = xs[n - 1] - 0.48;                         // front and rear axles
    const xMid = mid ? (xs[Math.floor(n / 2) - 1] + xs[Math.floor(n / 2)]) / 2 : null;
    M.info.mass = [xR - R, -0.3, 0, xF + R, 0.3, zS + 0.1];
    M.part('FRAME', () => {
      const r = 0.018;
      M.tube([xs[0] + 0.12, 0, zTop + 0.02], [xs[n - 1], 0, zTop], r, {});
      M.tube([xs[0], 0, zBB], [xs[n - 1], 0, zBB], r, {});
      if (truss) {
        M.tube([xs[0], 0, zBB - 0.1], [xs[n - 1], 0, zBB - 0.1], r * 0.8, {});
        for (let i = 0; i < n; i++) M.tube([xs[i], 0, zBB], [xs[i], 0, zBB - 0.1], r * 0.7, { isect: false });
      }
      for (let i = 0; i < n; i++) {
        M.tube([xs[i], 0, zBB], [xs[i] - 0.02, 0, zS - 0.08], r * 1.1, {});            // seat tube
        if (i + 1 < n) M.tube([xs[i], 0, zTop], [xs[i + 1], 0, zBB], r * 0.85, {});      // diagonal
      }
      // head tube and fork, rear stays
      M.tube([xs[0] + 0.2, 0, zTop + 0.12], [xs[0] + 0.26, 0, zTop - 0.2], r * 1.5, {});
      M.tube([xs[0], 0, zBB], [xs[0] + 0.25, 0, zTop - 0.18], r * 1.1, {});
      for (const s of [1, -1]) {
        M.tube([xs[0] + 0.26, s * 0.03, zTop - 0.2], [xF, s * 0.05, R], r * 0.8, { isect: false });
        M.tube([xs[n - 1], s * 0.02, zBB], [xR, s * 0.06, R], r * 0.7, { isect: false });
        M.tube([xs[n - 1], s * 0.02, zTop - 0.04], [xR, s * 0.06, R], r * 0.6, { isect: false });
      }
      M.callout('FRAME', 1, [(xs[1] + xs[2]) / 2, 0, (zTop + zBB) / 2], 1.6);
    });
    M.part('WHEEL', () => {
      for (const x of [xF, xR, ...(mid ? [xMid] : [])]) M.at(x, 0, R, () => O.bikeWheel(M, { r: R, spokes: 28 }));
      if (mid) for (const s of [1, -1]) M.tube([xMid, s * 0.04, R], [xMid + s * 0, s * 0.02, zBB - 0.1], 0.012, { isect: false });
      M.callout('WHEEL', mid ? 3 : 2, [xF, v.sy * 0.02, R * 1.85], 1.4);
      M.info.centers = (M.info.centers || []).concat([xF, xR].map((x) => [[x, -0.4, R], [x, 0.4, R]]));
    });
    M.part('SADDLE', () => {
      for (let i = 0; i < n; i++) M.at(xs[i] - 0.03, 0, zS, () => {
        M.extrude([[-0.13, 0.0], [0.13, 0.0], [0.15, 0.025], [-0.12, 0.06], [-0.13, 0.05]], -0.08, 0.08, { plane: 'xz' });
        M.extrude([[0.0, 0.0], [0.15, 0.0], [0.15, 0.03], [0.0, 0.05]], -0.04, 0.04, { plane: 'xz', isect: false });
        for (const s of [1, -1]) M.tube([-0.1, s * 0.05, 0], [-0.1, s * 0.05, -0.06], 0.006, { isect: false });
      });
      M.callout('SADDLE', n, [xs[Math.floor(n / 2)], 0, zS + 0.05], 3);
    });
    M.part('HANDLEBAR', () => {
      const bar = (x, z, w) => { M.tube([x, -w, z], [x, w, z], 0.012, { isect: false }); for (const s of [1, -1]) M.cyl(0.018, 0, 0.1, { axis: 'y' }) && null; };
      M.tube([xs[0] + 0.21, 0, zTop + 0.12], [xs[0] + 0.2, 0, zTop + 0.24], 0.016, {});
      M.tube([xs[0] + 0.2, 0, zTop + 0.24], [xs[0] + 0.12, 0, zTop + 0.26], 0.014, {});
      bar(xs[0] + 0.1, zTop + 0.26, 0.24);
      for (let i = 1; i < n; i++) { const x = xs[i - 1] - 0.04; M.tube([x, 0, zS - 0.12], [x - 0.22, 0, zS + 0.02], 0.012, { isect: false }); bar(x - 0.22, zS + 0.02, 0.2); }
      M.callout('STOKER BAR', n - 1, [xs[2] - 0.26, v.sy * 0.2, zS + 0.02], 1.4);
    });
    // cranks on every bottom bracket, one chain on the +y side through all the rings
    const sy = 0.08;
    M.part('CRANKSET', () => {
      for (let i = 0; i < n; i++) M.at(xs[i], 0, zBB, () => {
        const ring = M.cyl(0.1, sy - 0.004, sy + 0.004, { axis: 'y', isect: false });
        if (ring.top.on) { ring.top.circle(0, 0, 0.088, { w: 0 }); for (let k = 0; k < 5; k++) { const a = k * 2 * Math.PI / 5 + i; ring.top.line(0, 0, Math.cos(a) * 0.088, Math.sin(a) * 0.088, { w: 1 }); } }
        if (ring.bottom.on) ring.bottom.circle(0, 0, 0.088, { w: 0 });
        M.cyl(0.03, -0.07, 0.07, { axis: 'y', isect: false });
        const a = (i * 47 % 360) * D2R;
        for (const s of [1, -1]) {
          const c = s > 0 ? [Math.cos(a) * 0.17, Math.sin(a) * 0.17] : [-Math.cos(a) * 0.17, -Math.sin(a) * 0.17];
          M.tube([0, s * (sy + 0.015), 0], [c[0], s * (sy + 0.015), c[1]], 0.01, { isect: false });
          M.boxc([c[0], s * (sy + 0.06), c[1]], [0.09, 0.08, 0.025], { isect: false });
        }
      });
      M.callout('CRANKSET', n, [xs[1], v.sy * 0.1, zBB], 2.2);
      // the chain: over the tops of all the rings to the rear cog, back under the bottoms
      const top = [[xR, sy, R + 0.04], ...xs.slice().reverse().map((x) => [x, sy, zBB + 0.1])], bot = xs.map((x) => [x, sy, zBB - 0.1]);
      M.line([...top, [xs[0] + 0.1, sy, zBB], ...bot, [xR, sy, R - 0.04], [xR, sy, R + 0.04]], { w: 1, pass: 2 });
      M.at(xR, sy, R, () => M.cyl(0.04, -0.004, 0.004, { axis: 'y', isect: false }));
      M.callout('DRIVE CHAIN', 1, [(xs[n - 2] + xs[n - 1]) / 2, sy, zBB + 0.1], 1.8);
    });
    if (bags) {
      M.part('PANNIER', () => {
        for (const s of [1, -1]) M.boxc([xR + 0.05, s * 0.2, R + 0.18], [0.34, 0.14, 0.3]);
        M.box([xR - 0.2, -0.16, R + 0.33], [xR + 0.25, 0.16, R + 0.35]);
        M.callout('PANNIER', 2, [xR + 0.05, v.sy * 0.27, R + 0.2], 0.9);
      });
    }
    const brief = M.pick([
      `Takes a club of ${n} riders to the coast with one chain between them.`,
      `Carries ${n} riders and no passengers along the canal towpath.`,
      `Moves a ${low(n)}-man team of postal sorters to the depot every morning.`,
    ]);
    return {
      klass: `TANDEM BICYCLE FOR ${num(n)}`, family: 'ground', brief,
      specs: [['MASS', `${Math.round(14 + n * 6.5)} KG`], ['RIDERS', String(n)], ['SADDLES', String(n)], ['SPEED', `${M.ri(28, 42)} KM/H`]],
      figure: figAt(M, 0, v.sy, 0.5, (xF - xR) / 2 + 1.0),
    };
  },

  // ================================================================= the many-wing flying boat
  wings(M, ctx) {
    const sets = M.wpick([[4, 3], [1.5, 2], [1, 4]]);
    const per = M.wpick([[4, 3], [1, 4], [1, 2]]);
    const nW = sets * per;
    const L = 8 + sets * M.r(5.5, 7);
    const B = M.r(2.2, 2.8), Hh = M.r(1.9, 2.4);
    const span = M.r(18, 30), chord = M.r(2.2, 3.0), gap = chord * M.r(0.85, 1.05);
    const enginesPerSet = M.pick([2, 2, 3]);
    const pusher = M.chance(0.5);
    const v = sideView(M, 34, 50, 24, 32);
    const x0 = -L / 2, x1 = L / 2;
    // hull: lofted between stations, a houseboat cabin with windows
    const sec = (k, b, h) => [[0, -b * 0.25 * k, 0], [0, b * 0.25 * k, 0], [0, b * 0.5 * k, h * 0.3], [0, b * 0.5 * k, h * 0.9], [0, b * 0.38 * k, h], [0, -b * 0.38 * k, h], [0, -b * 0.5 * k, h * 0.9], [0, -b * 0.5 * k, h * 0.3]];
    const st = [[x1, 0.12, 0.65], [x1 - 1.2, 0.62, 0.95], [x1 - 3.2, 1, 1], [x0 + 4, 1, 1], [x0 + 1.2, 0.7, 0.92], [x0, 0.3, 0.78]];
    const shells = [];
    let windows = 0;
    M.part('HULL', () => {
      for (let i = 0; i + 1 < st.length; i++) {
        const a = sec(st[i][1], B, Hh * st[i][2]).map((p) => [st[i][0], p[1], p[2]]);
        const b = sec(st[i + 1][1], B, Hh * st[i + 1][2]).map((p) => [st[i + 1][0], p[1], p[2]]);
        shells.push(M.loft(a, b, {}));
      }
      M.info.mass = [x0, -B / 2, 0, x1, B / 2, Hh];
    });
    if (M.decorOn) {
      const S = shells[2];
      for (const [k, s] of [['s3', 1], ['s6', -1]]) {
        const f = S.f(k);
        if (!f.on || !f.front) continue;
        const ys = s * B * 0.5;
        const P = (x, z) => O.faceUV(f, M.W([x, ys, z]));
        const xa = x1 - 3.0, xb = x0 + 4.2, nwin = Math.round((xa - xb) / 0.9);
        for (let i = 0; i < nwin; i++) {
          const u0 = xb + (xa - xb) * i / nwin + 0.15, u1 = xb + (xa - xb) * (i + 1) / nwin - 0.15;
          const p = P(u0, Hh * 0.45), q = P(u1, Hh * 0.75);
          K.glass(f, [[p[0], p[1]], [q[0], p[1]], [q[0], q[1]], [p[0], q[1]]], { gap: 1.0, gap2: 2.4, flip: i % 2 });
        }
        windows = Math.max(windows, nwin);
        const t0 = P(x0 + 4.1, Hh * 0.38), t1 = P(x1 - 3.1, Hh * 0.38);
        f.line(t0[0], t0[1], t1[0], t1[1], { w: 1 });
        if (ctx.plate) { const c = P(0, Hh * 0.16); f.text(`I-${ctx.plate.replace(' ', '')}`, c[0], c[1], 0.32, { w: 1 }); }
      }
      for (const S2 of shells) for (const k of ['s1', 's7', 's2']) { const f = S2.f(k); if (f.on && f.front) f.hatch(f.poly, { angle: 0, gap: 3.2 - f.tone, w: 0 }); }
    }
    M.part('CABIN', () => {
      M.at(x1 - 2.6, 0, Hh, () => {
        const C = M.extrude([[0.0, 0], [1.6, 0], [1.1, 0.75], [0, 0.75]], -0.6, 0.6, { plane: 'xz' });
        const f = C.f('s1'); if (f.on) K.glass(f, f.poly.map(([u, v]) => [u * 0.8, v * 0.7]), { gap: 1.1, gap2: 2.6 });
      });
      M.callout('PILOT\'S CABIN', 1, [x1 - 1.6, 0, Hh + 0.6], 1.2);
    });
    // the wing sets: each `per` planes stacked with struts, engines between them
    const setX = [];
    for (let k = 0; k < sets; k++) setX.push(sets === 1 ? 0 : (x1 - 4.5) - (L - 8) * k / (sets - 1));
    const zw0 = Hh + 0.9;
    M.part('WING', () => {
      for (const xs of setX) {
        for (let j = 0; j < per; j++) {
          const z = zw0 + j * gap, sp = span * (1 - j * 0.04);
          M.at(xs, 0, z, () => M.mirrorY(() => M.rx(-90, () => A.foil(M, { root: { x: chord / 2, h: 0, c: chord, t: chord * 0.09 }, tip: { x: chord / 2 - 0.1, h: sp / 2, c: chord * 0.92, t: 0 }, ribs: Math.round(sp / 1.6), cs: [{ s0: 0.55, s1: 0.95 }], spar: false }))));
        }
        // interplane struts at three span stations a side, cabane struts to the hull
        for (const s of [1, -1]) for (const yk of [0.17, 0.5, 0.85]) for (const dx of [chord * 0.3, -chord * 0.3]) M.tube([xs + dx, s * span / 2 * yk, zw0], [xs + dx, s * span / 2 * yk, zw0 + (per - 1) * gap], 0.06, { isect: false });
        for (const s of [1, -1]) for (const dx of [chord * 0.3, -chord * 0.3]) M.tube([xs + dx, s * B * 0.38, Hh - 0.02], [xs + dx, s * B * 0.9, zw0], 0.07, {});
        for (const s of [1, -1]) A.wire(M, [xs, s * span / 2 * 0.85, zw0], [xs, s * span / 2 * 0.17, zw0 + (per - 1) * gap], { w: 0 });
      }
      M.callout('MAIN PLANE', nW, [setX[0], v.sy * span * 0.35, zw0 + (per - 1) * gap], 3);
      M.callout('INTERPLANE STRUT', sets * 12, [setX[0] - chord * 0.3, v.sy * span / 2 * 0.85, zw0 + gap * 0.5], 1.6);
    });
    let engines = 0;
    M.part('ENGINE', () => {
      for (const xs of setX) for (let e = 0; e < enginesPerSet; e++) {
        const y = enginesPerSet === 3 ? (e - 1) * span * 0.17 : (e ? 1 : -1) * span * 0.12;
        const z = zw0 + gap * (per > 2 ? 1 : 0.5);
        M.at(xs + (pusher ? -chord * 0.4 : chord * 0.5), y, z, () => A.nacelle(M, { len: 2.0, r: 0.38, prop: pusher ? 'rear' : 'front', propR: Math.min(1.5, gap * 0.45), blades: 2 }));
        engines++;
      }
      M.callout('ENGINE', sets * enginesPerSet, [setX[0] + chord * 0.5, v.sy * span * 0.12, zw0 + gap], 2);
    });
    M.part('WING FLOAT', () => {
      for (const s of [1, -1]) {
        const y = s * span * 0.42;
        M.at(setX[0], y, 0, () => A.pontoon(M, { len: 2.6, w: 0.6, h: 0.5 }));
        for (const dx of [0.6, -0.6]) M.tube([setX[0] + dx, y, 0.48], [setX[0] + dx * 0.3, y, zw0], 0.05, { isect: false });
      }
      M.callout('WING FLOAT', 2, [setX[0], v.sy * span * 0.42, 0.5], 1);
    });
    M.part('TAIL', () => {
      M.at(x0 + 0.4, 0, Hh * 0.78, () => {
        M.mirrorY(() => M.rx(-90, () => A.foil(M, { root: { x: 1.6, h: 0, c: 1.6, t: 0.14 }, tip: { x: 1.4, h: 3.2, c: 1.2, t: 0 }, cs: [{ s0: 0.1, s1: 0.95 }], spar: false })));
        A.foil(M, { root: { x: 1.8, h: 0, c: 1.8, t: 0.16 }, tip: { x: 1.4, h: 2.4, c: 1.2, t: 0 }, cs: [{ s0: 0.1, s1: 0.95 }], spar: false });
      });
      M.callout('TAIL PLANE', 1, [x0 + 1.0, v.sy * 2.5, Hh * 0.78], 1);
    });
    M.part('WATER', () => A.waves(M, x0 - 4, x1 + 4, -span / 2, span / 2, 2.2, 13));
    const sp = A.figSpot(M, L / 2 + 3);
    const ls = SEA.landingStage(M, { at: sp, rz: v.az + 90 });
    const stage = (ls && ls.spot) || sp;
    M.callout('HULL', 1, [0, v.sy * B / 2, Hh * 0.2], 1.4);
    const pax = windows * 4 || 100;
    const brief = M.pick([
      `Carries ${pax} passengers across the lakes in one hull under ${low(nW)} wings.`,
      `Flies ${pax} passengers between lake ports on ${low(engines)} engines.`,
      `Takes ${pax} tourists over the lakes from a houseboat with ${low(nW)} wings.`,
    ]);
    return {
      klass: `${num(nW)}-WING FLYING BOAT`, family: 'air', brief,
      specs: [['SPAN', `${Math.round(span * 1000).toLocaleString('en-US').replace(/,/g, ' ')} MM`], ['MASS', `${Math.round(10 + nW * 1.6)} T`], ['ENGINES', String(engines)], ['PASSENGERS', String(pax)]],
      figure: stage,
    };
  },

  // ================================================================= the many-rotor helicopter
  rotors(M, ctx) {
    const n = M.ri(3, 7);
    const len = M.r(9, 12), s = len / 8;
    const gapK = M.r(0.45, 0.7);
    const taper = M.chance(0.5);
    const counter = M.chance(0.5);
    const blades = M.pick([2, 3, 4]);
    const v = sideView(M, 32, 48, 22, 30);
    const reg = `${M.pick(LET.split(''))}-${M.pick(LET.split(''))}${M.pick(LET.split(''))}${M.pick(LET.split(''))}`;
    M.part('HELICOPTER', () => { K.miniHeli(M, { len, reg, blades, phase: 20 }); });
    const z0 = 2.05 * s, gap = 4 * s * gapK * 0.35 + 0.4;
    M.info.mass = [-4.9 * s, -0.9 * s, 0, 1.8 * s, 0.9 * s, 2.1 * s];
    M.part('ROTOR MAST', () => {
      const top = z0 + gap * (n - 1);
      const T = M.cyl(0.11 * s, z0, top + 0.12 * s);
      if (M.decorOn) T.lat.shade({ gap: 1.6 });
      for (let i = 1; i < n; i++) M.cyl(0.18 * s, z0 + gap * i - 0.3 * s, z0 + gap * i - 0.12 * s, { isect: false });
      // stays from the cabin roof to the mast bearing halfway up
      const zb = z0 + gap * Math.floor((n - 1) / 2) - 0.2 * s;
      for (const [x, y] of [[0.4, 0.4], [0.4, -0.4], [-0.9, 0.4], [-0.9, -0.4]]) M.tube([x * s, y * s, 1.7 * s], [0, 0, zb], 0.025 * s, { isect: false });
      M.callout('ROTOR MAST', 1, [0, 0, z0 + gap * 0.5], 1.6);
      M.callout('MAST STAY', 4, [-0.45 * s, v.sy * 0.2 * s, (1.7 * s + zb) / 2], 1);
    });
    M.part('MAIN ROTOR', () => {
      for (let i = 1; i < n; i++) {
        const r = 4 * s * (taper ? 1 - i * 0.07 : 1);
        M.at(0, 0, z0 + gap * i, () => K.rotor(M, { r, blades, chord: 0.22 * s, phase: 20 + i * (counter ? 37 : 23), swash: true }));
      }
      M.callout('MAIN ROTOR', n, [0, 0, z0 + gap * (n - 1)], 3);
      M.callout('SWASHPLATE', n - 1, [0, v.sy * 0.25 * s, z0 + gap * (n - 1) - 0.4 * s], 1.2);
    });
    M.callout('TAIL ROTOR', 1, [-4.75 * s, 0.1 * s, 1.75 * s], 1.1);
    M.callout('CABIN', 1, [0.3 * s, v.sy * 0.8 * s, 0.8 * s], 1.4);
    M.callout('SKID', 2, [0, v.sy * 0.85 * s, 0.05 * s], 0.8);
    const t = (n * M.r(0.7, 1.1)).toFixed(1);
    const brief = M.pick([
      `Lifts ${t} t of timber out of valleys too steep for one rotor.`,
      `Carries a ${t} t sling load to mountain huts with ${low(n)} rotors on one mast.`,
      `Sets ${t} t bridge sections in place where a crane cannot stand.`,
    ]);
    return {
      klass: `HELICOPTER WITH ${num(n)} MAIN ROTORS`, family: 'air', brief,
      specs: [['MASS', `${(2 + n * 0.8).toFixed(1)} T`], ['ROTORS', String(n)], ['LIFT', `${t} T`], ['CREW', '2']],
      figure: figAt(M, 0, v.sy, 2, len * 0.75),
    };
  },

  // ================================================================= caravans and a boat
  caravans(M, ctx) {
    const k = M.ri(2, 4);
    const cs = carStyle(M);
    const sizes = Array.from({ length: k }, () => ({ len: M.r(3.4, 4.8), hgt: M.r(2.2, 2.6), windows: M.ri(1, 3) }));
    const boatL = M.r(4, 5.5);
    const cabinBoat = M.chance(0.4);
    const names = ['', 'SUNSEEKER', 'WANDERER', 'SEAVIEW', 'ROVER', 'NOMAD'];
    const v = sideView(M, 60, 70, 22, 28);
    let c;
    M.part('CAR', () => { c = O.car(M, { ...cs, plate: ctx.plate }); });
    // towbar on the car, then each caravan hitched to the one in front
    let hx = c.rear - 0.25, hz = c.zc + 0.12;
    M.box([c.rear - 0.28, -0.05, hz - 0.04], [c.rear, 0.05, hz + 0.02]);
    const xs = [];
    sizes.forEach((sz, i) => {
      M.part('CARAVAN', () => {
        // the caravan's own hitch sits on the ball in front of it
        const back = sz.len / 2 + 1.1;
        const cx = hx - back;
        M.at(cx, 0, 0, () => {
          const cv = O.caravan(M, { ...sz, label: names[(i + 1) % names.length] });
          M.box([-sz.len / 2 - 0.3, -0.05, cv.zb - 0.12], [-sz.len / 2, 0.05, cv.zb - 0.05]);
          xs.push(cx);
          hx = cx - sz.len / 2 - 0.28; hz = cv.zb - 0.08;
        });
      });
    });
    M.part('BOAT TRAILER', () => {
      const back = boatL / 2 + 1.0, bx = hx - back, r = 0.24;
      M.at(bx, 0, 0, () => {
        for (const s of [1, -1]) { M.box([-boatL * 0.45, s * 0.55 - 0.04, 0.42], [boatL * 0.42, s * 0.55 + 0.04, 0.5]); M.at(0, s * 0.72, r, () => K.wheel(M, { r, w: 0.13, hub: 0.12, hubs: 'seen' })); }
        for (const s of [1, -1]) M.tube([boatL * 0.42, s * 0.55, 0.46], [boatL / 2 + 0.95, 0, 0.46], 0.035, {});
        for (const x of [-boatL * 0.3, boatL * 0.15]) M.box([x - 0.08, -0.6, 0.5], [x + 0.08, 0.6, 0.6]);
        M.at(0, 0, 0.6, () => A.boat(M, { len: boatL, cabin: cabinBoat }));
        M.at(boatL / 2 + 0.3, 0, 0.5, () => M.box([-0.05, -0.05, 0], [0.05, 0.05, 0.4]));
      });
      M.callout('BOAT', 1, [bx, v.sy * boatL * 0.16, 0.6 + boatL * 0.1], 2.2);
      M.callout('BOAT TRAILER', 1, [bx, v.sy * 0.6, 0.45], 1);
      M.info.mass = [bx - boatL / 2, -1.0, 0, c.front, 1.0, Math.max(...sizes.map((z) => z.hgt))];
    });
    M.callout('CARAVAN', k, [xs[0], v.sy * 1.0, sizes[0].hgt * 0.6], 3);
    M.callout('DRAWBAR', k + 1, [xs[0] + sizes[0].len / 2 + 0.6, 0, 0.5], 1.6);
    M.callout('JOCKEY WHEEL', k, [xs[0] + sizes[0].len / 2 + 0.7, 0.12, 0.1], 0.8);
    M.callout('TOW BALL', k + 1, [c.rear - 0.25, 0, c.zc + 0.14], 1.0);
    M.callout('SALOON CAR', 1, [0, v.sy * c.W / 2, c.zBelt * 0.6], 1.4);
    const people = 4 + k * M.ri(2, 4);
    const brief = M.pick([
      `Takes ${people} holidaymakers and their boat to the coast in one run.`,
      `Moves a family of ${people} and a rowing boat to the lakes each August.`,
      `Tows ${low(k)} caravans and a boat with the family car on a 1.6 l engine.`,
    ]);
    return {
      klass: `CAR WITH ${num(k)} CARAVANS AND A BOAT`, family: 'ground', brief,
      specs: [['MASS', `${(1 + k * 1.1 + 0.6).toFixed(1)} T`], ['CARAVANS', String(k)], ['BERTHS', String(people)], ['SPEED', `${M.ri(35, 55)} KM/H`]],
      figure: figAt(M, 0, v.sy, 2, 8),
    };
  },

  // ================================================================= the chimney on a pickup
  chimney(M, ctx) {
    const L = M.r(4.6, 5.2), W = M.r(1.75, 1.9), r = M.r(0.34, 0.38);
    const k = M.r(2.6, 3.4);
    const guys = M.chance(0.7);
    const cabH = M.r(1.75, 1.95);
    const v = sideView(M, 36, 50, 22, 30);
    const x1 = L / 2, zf = r * 2 + 0.08;
    const xf = x1 - 0.95, xr = -L / 2 + 1.1;
    let cb;
    M.part('PICKUP', () => {
      M.box([-L / 2 + 0.2, -0.45, r * 0.9], [x1 - 0.3, 0.45, r * 1.3]);
      cb = O.cab(M, { x1, len: 1.95, wid: W, hgt: cabH, zf, text: ctx.plate });
      for (const x of [xf, xr]) for (const s of [1, -1]) M.at(x, s * (W / 2 - 0.15), r, () => K.wheel(M, { r, w: 0.24, hub: r * 0.55, hubs: 'seen' }));
      for (const x of [xf, xr]) for (const s of [1, -1]) {
        M.box([x - r - 0.12, s * (W / 2 - 0.02) - 0.28, 2 * r + 0.02], [x + r + 0.12, s * (W / 2 - 0.02) + 0.02, 2 * r + 0.06], { isect: false });
        M.box([x - 0.06, s * (W / 2 - 0.3) - 0.03, r * 0.9], [x + 0.06, s * (W / 2 - 0.3) + 0.03, zf], { isect: false });
      }
      M.box([-L / 2 + 0.2, -0.5, r * 1.3], [x1 - 0.3, 0.5, zf], { isect: false });
      M.info.centers = [xf, xr].map((x) => [[x, -W / 2 - 0.3, r], [x, W / 2 + 0.3, r]]);
    });
    const bx0 = -L / 2, bx1 = cb.x0 - 0.08;
    M.part('LOAD BED', () => {
      M.box([bx0, -W / 2, zf], [bx1, W / 2, zf + 0.08]);
      for (const s of [1, -1]) {
        const S = M.box([bx0, s * W / 2 - (s > 0 ? 0.05 : 0), zf + 0.08], [bx1, s * W / 2 + (s > 0 ? 0 : 0.05), zf + 0.55]);
        const f = S.f(s > 0 ? '+y' : '-y'); if (f.on) for (const r2 of f.grid(3, 1, { gap: 2 })) K.corrugated(f, r2, { dir: 'h', gap: 2.6 });
      }
      const T = M.box([bx0, -W / 2, zf + 0.08], [bx0 + 0.05, W / 2, zf + 0.55]);
      const tf = T.f('-x'); if (tf.on) K.stencil(tf, 'BRICKWORKS', 0, 0, 0.14);
      M.callout('LOAD BED', 1, [(bx0 + bx1) / 2, v.sy * W / 2, zf + 0.4], 1.2);
    });
    const Hc = (cabH + 0.1) * k;
    const cw = Math.min(1.35, (bx1 - bx0) * 0.55);
    const cx = (bx0 + bx1) / 2;
    let top;
    M.part('CHIMNEY STACK', () => {
      M.at(cx, 0, zf + 0.08, () => {
        // a steel base frame the stack is bolted into
        M.box([-cw / 2 - 0.12, -cw / 2 - 0.12, 0], [cw / 2 + 0.12, cw / 2 + 0.12, 0.25]);
        top = X.chimney(M, { h: Hc, w: cw, d: cw, pots: M.decorOn ? 2 : 2 }).top + zf + 0.08;
        for (const z of [Hc * 0.33, Hc * 0.66]) M.box([-cw / 2 - 0.04, -cw / 2 - 0.04, z], [cw / 2 + 0.04, cw / 2 + 0.04, z + 0.1], { isect: false });
      });
      M.callout('CHIMNEY STACK', 1, [cx, v.sy * cw / 2, zf + Hc * 0.5], 3);
      M.callout('CHIMNEY POT', 2, [cx, 0, zf + Hc + 0.3], 1.4);
      M.callout('IRON BAND', 2, [cx, v.sy * (cw / 2 + 0.04), zf + Hc * 0.66], 1);
      M.callout('BASE FRAME', 1, [cx, v.sy * (cw / 2 + 0.12), zf + 0.2], 1);
    });
    if (guys) {
      M.part('GUY WIRE', () => {
        const zg = zf + Hc * 0.6;
        for (const [x, y] of [[bx0 + 0.05, W / 2], [bx0 + 0.05, -W / 2], [bx1 - 0.05, W / 2], [bx1 - 0.05, -W / 2]]) {
          A.wire(M, [cx + Math.sign(x - cx) * cw / 2, Math.sign(y) * cw / 2, zg], [x, y, zf + 0.55], { w: 1 });
          M.at(x, y, zf + 0.55, () => M.cyl(0.04, 0, 0.08, { isect: false }));
        }
        M.callout('GUY WIRE', 4, [bx0 + 0.3, v.sy * W / 2 * 0.9, zf + 0.55 + (Hc * 0.6 - 0.55) * 0.15], 1.2);
      });
    }
    M.callout('CAB', 1, [(cb.x0 + cb.x1) / 2, v.sy * W / 2, cabH * 0.8], 1.2);
    M.callout('ROAD WHEEL', 4, [xf, v.sy * W / 2, r], 0.8);
    M.info.mass = [-L / 2, -W / 2, 0, x1, W / 2, cabH];
    const hm = Math.round(Hc + zf);
    const brief = M.pick([
      `Delivers a ${hm} m factory chimney to the brickworks in one piece.`,
      `Carries a ${hm} m chimney stack, its pots and its cowl to a new kiln.`,
      `Moves a ${hm} m chimney from the old bakery to the new one.`,
    ]);
    return {
      klass: `PICKUP WITH A ${hm} M CHIMNEY`, family: 'ground', brief,
      specs: [['MASS', `${(2.2 + Hc * cw * cw * 0.35).toFixed(1)} T`], ['CHIMNEY', `${hm} M`], ['PAYLOAD', `${(Hc * cw * cw * 0.35).toFixed(1)} T`], ['CREW', '2']],
      figure: figAt(M, 0, v.sy, W, L / 2 + 1.4),
      _top: top,
    };
  },
};
