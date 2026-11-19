// classes/graft.js: halves of two real vehicles that do not belong together, joined with
// proper engineering at the seam (a chassis frame, saddles, a pylon, cabane struts, rigging).
// Pool, picked from the seed with even weights:
//   tug        a tugboat (or a fishing boat) hull complete with deckhouse, wheelhouse and
//              funnel, out of the water on six (four, eight) walking legs, truck wheels,
//              tracks, or railway bogies on a track: TUGBOAT ON SIX LEGS, RAILWAY TUGBOAT
//   sub        a submarine on railway bogies (RAILWAY SUBMARINE) or tracks (TRACKED SUBMARINE)
//   loco       a steam locomotive boiler and cab under a high wing with two propellers, on
//              floats (STEAM LOCOMOTIVE, FLYING BOAT TYPE), or on its wheels under a rotor
//   ringwing   an airliner fuselage whose wing is one great ring, on its undercarriage
//   airship    an airship envelope whose gondola is a bus on its wheels, or a tram on a track
//   helibus    a single-deck bus under a helicopter rotor with a tail boom
// ?variant=<name> on a test page forces one.

import * as K from '../kit.js';
import * as O from './parts-odd.js';
import * as A from './parts-air.js';
import * as SEA from './parts-sea.js';
import * as R from './parts-rail.js';
import * as X from './extras.js';
import { D2R, lerp } from '../geom.js';

const NUM = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'];
const num = (n) => NUM[n] || String(n);
const low = (n) => (NUM[n] ? NUM[n].toLowerCase() : String(n));
const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const KINDS = ['tug', 'sub', 'loco', 'ringwing', 'airship', 'helibus'];
const forced = () => {
  try { const v = new URLSearchParams(globalThis.location?.search || '').get('variant'); return KINDS.includes(v) ? v : null; } catch (e) { return null; }
};

export default {
  id: 'graft',
  family: 'ground',
  weight: 2,
  build(M) {
    const pick = M.pick(KINDS);
    const kind = forced() || pick;
    const reg = `${M.pick(LET.split(''))}${M.pick(LET.split(''))}-${M.pick(LET.split(''))}${M.pick(LET.split(''))}${M.pick(LET.split(''))}`;
    return BUILD[kind](M, { reg });
  },
};

function sideView(M, azMin, azMax, elMin = 22, elMax = 30) {
  const s = M.pick([1, -1]), back = M.chance(0.3);
  M.setView(s * M.r(azMin, azMax) + (back ? 180 : 0), M.r(elMin, elMax));
  const e = M.view.e;
  return { sy: e[1] >= 0 ? 1 : -1, sx: e[0] >= 0 ? 1 : -1 };
}

// -------------------------------------------------------------------------- running gear
// a chassis frame from -Lf/2..Lf/2, width Wf, its top at the height the gear gives, and the
// gear under it. kind 'legs' | 'wheels' | 'tracks' | 'rails'. Returns { zTop, specs, form }.
function chassis(M, kind, o) {
  const { Lf, Wf, sy } = o;
  const fh = o.fh ?? 0.45;
  let zTop = 0, info = {};
  if (kind === 'legs') {
    const n = o.legs ?? 6, zHip = o.hip ?? 3.2, reach = o.reach ?? 3.6;
    zTop = zHip + fh * 0.5;
    M.part('LEG', () => {
      const per = n / 2;
      for (const s of [1, -1]) for (let i = 0; i < per; i++) {
        const x = per === 1 ? 0 : -Lf * 0.42 + Lf * 0.84 * i / (per - 1);
        const spl = per === 1 ? 0 : (i / (per - 1) - 0.5) * 0.8;
        const dl = Math.hypot(spl, 1);
        O.walkLeg(M, [x, s * Wf / 2, zHip], [spl / dl, s / dl, 0], { reach, up: o.up ?? 1.3, r: o.r ?? 0.15 });
      }
      M.callout('WALKING LEG', n, [-Lf * 0.42 + Lf * 0.84 / Math.max(1, per - 1) * 0.5 + reach * 0.2, sy * (Wf / 2 + reach * 0.35), zHip + 0.8], 3);
      M.callout('HYDRAULIC RAM', n, [-Lf * 0.42, sy * (Wf / 2 + 0.3), zHip - 0.3], 1.2);
      M.callout('FOOTPAD', n, [-Lf * 0.42, sy * (Wf / 2 + reach * 0.9), 0.2], 1.0);
    });
    info = { form: `ON ${num(n)} LEGS`, specs: [['LEGS', String(n)], ['SPEED', `${o.speed ?? 4} KM/H`]] };
  } else if (kind === 'wheels') {
    const r = o.wr ?? 0.55, nAx = Math.max(2, Math.round(Lf / 2.6));
    zTop = r * 2 + 0.35;
    M.part('ROAD WHEEL', () => {
      const xs = [];
      for (let i = 0; i < nAx; i++) xs.push(-Lf * 0.4 + Lf * 0.8 * i / (nAx - 1));
      for (const x of xs) for (const s of [1, -1]) {
        M.at(x, s * (Wf / 2 + 0.05), r, () => K.twinWheel(M, { r, w: r * 0.5 }));
        M.box([x - r * 1.3, s * (Wf / 2 - 0.12) - 0.05, r + 0.1], [x + r * 1.3, s * (Wf / 2 - 0.12) + 0.05, r + 0.22], { isect: false });
        M.box([x - r * 1.2, s * (Wf / 2 + 0.05) - r * 0.6, r * 2 + 0.08], [x + r * 1.2, s * (Wf / 2 + 0.05) + r * 0.6, r * 2 + 0.13], { isect: false });
      }
      for (const x of xs) M.at(x, 0, r, () => M.cyl(0.08, -Wf / 2, Wf / 2, { axis: 'y', isect: false }));
      M.info.centers = (M.info.centers || []).concat(xs.map((x) => [[x, -Wf / 2 - 1, r], [x, Wf / 2 + 1, r]]));
      M.callout('ROAD WHEEL', nAx * 4, [xs[0], sy * (Wf / 2 + 0.05 + r * 0.5), r], 2.5);
      M.callout('MUDGUARD', nAx * 2, [xs[1], sy * (Wf / 2 + 0.05 + r * 0.55), r * 2 + 0.12], 1);
    });
    info = { form: 'ON TRUCK WHEELS', specs: [['AXLES', String(nAx)], ['SPEED', `${o.speed ?? 25} KM/H`]] };
  } else if (kind === 'tracks') {
    const tr = o.tr ?? 0.7, tw = o.tw ?? 0.9, tl = Lf * 0.8;
    zTop = tr * 2 + 0.3;
    M.part('TRACK UNIT', () => {
      for (const s of [1, -1]) M.at(0, s * (Wf / 2 + tw / 2 - 0.1), 0, () => K.track(M, { len: tl, r: tr, w: tw }));
      for (const x of [-tl * 0.3, tl * 0.3]) M.box([x - 0.3, -Wf / 2 - 0.05, tr * 1.2], [x + 0.3, Wf / 2 + 0.05, zTop - fh], { isect: false });
      M.callout('TRACK UNIT', 2, [tl * 0.2, sy * (Wf / 2 + tw - 0.1), tr * 1.9], 2.5);
      M.callout('DRIVE SPROCKET', 2, [tl / 2 - tr, sy * (Wf / 2 + tw - 0.1), tr], 1.2);
    });
    info = { form: 'ON TRACKS', adj: 'TRACKED', specs: [['TRACKS', '2'], ['SPEED', `${o.speed ?? 12} KM/H`]] };
  } else {
    // a length of track and bogies
    let top = 0;
    M.part('TRACK', () => { top = R.track(M, { x0: -Lf / 2 - 3, x1: Lf / 2 + 3, ballast: true }).top; });
    let bt = 1;
    const nb = Lf > 14 ? 3 : 2;
    M.part('BOGIE', () => {
      for (let i = 0; i < nb; i++) {
        const x = -Lf * 0.36 + Lf * 0.72 * i / (nb - 1);
        M.at(x, 0, top, () => { bt = R.bogie(M, { n: 2, pitch: 1.9, r: 0.46, nearSide: sy }).top; });
      }
      M.callout('BOGIE', nb, [-Lf * 0.36, sy * 1.0, top + 0.6], 2.5);
      M.callout('TRACK', 1, [Lf / 2 + 1.5, sy * 0.8, top], 0.6);
    });
    zTop = top + bt + fh;
    M.part('BUFFER BEAM', () => {
      for (const [x, rz] of [[Lf / 2, 0], [-Lf / 2, 180]]) M.at(x, 0, 0, () => M.rz(rz, () => R.bufferBeam(M, { w: Math.min(2.8, Wf), z: zTop - fh * 0.5 })));
      M.callout('BUFFER BEAM', 2, [Lf / 2, sy * 0.8, zTop - fh * 0.5], 1);
    });
    info = { form: 'ON RAILWAY BOGIES', adj: 'RAILWAY', specs: [['BOGIES', String(nb)], ['GAUGE', '1 435 MM']] };
  }
  M.part('CHASSIS FRAME', () => {
    const F = M.box([-Lf / 2, -Wf / 2, zTop - fh], [Lf / 2, Wf / 2, zTop]);
    for (const k of ['+y', '-y', '+x', '-x']) {
      const f = F.f(k);
      if (!f.on || !f.front) continue;
      const n = Math.max(1, Math.round(f.w / 1.4));
      f.grid(n, 1, { gap: 2.4 }).forEach((r, i) => (i % 3 === 1 ? K.louver(f, r) : K.plain(f, r)));
    }
    M.callout('CHASSIS FRAME', 1, [Lf * 0.1, sy * Wf / 2, zTop - fh / 2], 1.8);
  });
  return { zTop, ...info };
}

// the z of a lofted sea hull's underside at (x, y): bisect along t on the hull surface
function hullUnder(H, x, y) {
  const s = H.sOf(x);
  if (!(s > 0.02 && s < 0.98)) return null;
  const side = y >= 0 ? 1 : -1, ay = Math.abs(y);
  let a = 0, b = 1;
  if (Math.abs(H.P(s, 1, side)[1]) < ay) return null;
  if (Math.abs(H.P(s, 0, side)[1]) >= ay) return H.P(s, 0, side)[2];
  for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (Math.abs(H.P(s, m, side)[1]) < ay) a = m; else b = m; }
  return H.P(s, (a + b) / 2, side)[2];
}

const BUILD = {
  // ================================================================= a tugboat out of the water
  tug(M, ctx) {
    const boat = M.wpick([[3, 'tug'], [2, 'fishing']]);
    const gear = M.pick(['legs', 'legs', 'wheels', 'tracks', 'rails']);
    const L = boat === 'tug' ? M.r(15, 21) : M.r(13, 18), B = L * M.r(0.3, 0.35), D = L * M.r(0.15, 0.18);
    const nLegs = M.pick([6, 6, 4, 8]);
    const funR = M.r(0.55, 0.8), funH = M.r(2.0, 3.0), funRake = M.r(4, 14);
    const whLen = M.r(2.4, 3.2), whH = M.r(1.9, 2.3), houseH = M.r(1.9, 2.3);
    const hullNo = String(M.ri(2, 48));
    const v = sideView(M, 34, 50, 22, 30);
    const near = v.sy;
    // gear first (it sets the keel height); frame narrower than the hull
    const Lf = L * 0.62, Wf = Math.min(B * 0.55, 3.2);
    const g = chassis(M, gear, { Lf, Wf, sy: v.sy, legs: nLegs, hip: M.r(2.6, 3.6), reach: B * M.r(0.75, 0.95), r: 0.13 + L * 0.004, wr: 0.55, tr: 0.75, speed: gear === 'legs' ? M.ri(3, 6) : M.ri(10, 25) });
    const zK = g.zTop + M.r(0.25, 0.5);
    let H;
    M.part('HULL', () => {
      H = SEA.hull(M, { L, B, F: D, z0: zK, rake: L * 0.07, over: L * 0.04, stern: boat === 'tug' ? 'round' : 'transom', ss0: 0.26, kt: 0.7, pb: 1.8, wl: 0.28, wlk: 1, flare: 0.35, bulge: 0.2, tumble: 0.02, sheerBow: D * 0.35, sheerStern: D * 0.08, sm: 0.38, n: 26, m: 6 });
      SEA.plating(M, H, { rows: [0.35, 0.62, 0.82] });
      SEA.deckLines(M, H, { n: Math.round(B / 0.9) });
      SEA.hullText(M, H, hullNo, 0.85, 0.62, near, D * 0.18);
      for (let k = 1; k <= 4; k++) SEA.hullText(M, H, String(k), 0.96, 0.15 + k * 0.14, near, D * 0.06);
      M.callout('HULL', 1, H.P(0.5, 0.5, near), 2);
    });
    M.info.mass = H.solid.bbox.slice();
    M.part('BULWARK', () => { SEA.bulwark(M, H, { h: 0.8, t: 0.1, posts: 1.4 }); });
    M.part('RUBBING STRAKE', () => { SEA.strake(M, H, { t: 0.9, r: 0.15 }); M.callout('RUBBING STRAKE', 1, H.P(0.4, 0.92, near), 0.8); });
    M.part('HULL CRADLE', () => {
      const xs = [];
      for (let i = 0; i < 5; i++) xs.push(-Lf * 0.42 + Lf * 0.84 * i / 4);
      O.cradle(M, (x, y) => hullUnder(H, x, y), xs, [Wf * 0.42, -Wf * 0.42], g.zTop, { r: 0.1 });
      M.box([-Lf * 0.45, -0.15, g.zTop], [Lf * 0.45, 0.15, zK + 0.02]);
      M.callout('HULL CRADLE', 10, [xs[1], near * Wf * 0.42, (g.zTop + zK) / 2 + 0.1], 2.2);
    });
    // superstructure
    const hx1 = boat === 'tug' ? L * 0.12 : -L * 0.12, hx0 = boat === 'tug' ? -L * 0.18 : -L * 0.38;
    const hw = Math.min(H.halfB(hx0), H.halfB(hx1)) * 0.72;
    const zd = H.deckMin(hx0, hx1) - 0.05;
    let roofZ = zd + houseH, WH;
    M.part('DECKHOUSE', () => {
      SEA.house(M, { x0: hx0, x1: hx1, hw, z: zd, h: houseH, chamfer: hw * 0.3, doors: true, windows: 'ports', doorPos: 0.25 });
      M.callout('DECKHOUSE', 1, [hx0 + (hx1 - hx0) * 0.3, near * hw, zd + houseH * 0.5], 1.2);
    });
    M.part('WHEELHOUSE', () => {
      WH = SEA.wheelhouse(M, { x0: hx1 - whLen - 0.1, x1: hx1 - 0.1, hw: hw * 0.9, z: roofZ, h: whH, front: 'facet', wipers: true });
      M.callout('WHEELHOUSE', 1, [hx1 - 0.2, 0, roofZ + whH * 0.6], 2.4);
      M.at(hx0 - 0.03, -near * hw * 0.55, 0, () => M.rz(180, () => M.at(0, 0, zd + 0.05, () => K.ladder(M, { h: roofZ - zd + 0.9, w: 0.45 }))));
    });
    M.part('FUNNEL', () => {
      const fx = Math.max(hx0 + funR + 0.2, hx1 - whLen - funR * 1.5);
      M.at(fx, 0, roofZ, () => SEA.funnel(M, { r: funR, h: Math.max(funH, whH + 0.6), rake: funRake, bands: 2, cowl: true, pipes: 2 }));
      M.callout('FUNNEL', 1, [fx, 0, roofZ + funH * 0.6], 2);
    });
    M.part('MAST', () => {
      const mx = boat === 'tug' ? hx1 - whLen * 0.5 : L * 0.22;
      const mz = boat === 'tug' ? WH.roofZ : H.deckZ(mx);
      M.at(mx, 0, mz, () => SEA.mast(M, { h: boat === 'tug' ? 4 : 7, radar: boat === 'tug' ? 1.6 : 0, lamps: 3, stays: [] }));
      M.callout(boat === 'tug' ? 'SIGNAL MAST' : 'DERRICK MAST', 1, [mx, 0, mz + 3], 1.2);
      if (boat === 'fishing') {
        // a derrick boom and a net drum on the after deck
        const bz = mz + 4.5;
        M.tube([mx, 0, mz + 0.5], [mx - L * 0.28, near * B * 0.15, bz - 2.5], 0.09, { isect: false });
        M.line([[mx, 0, bz], [mx - L * 0.28, near * B * 0.15, bz - 2.5]], { w: 1, pass: 1 });
        const dx = -L * 0.42;
        M.at(dx, 0, H.deckZ(dx), () => K.winch(M, { r: 0.45, w: B * 0.45, at: [0, 0, 0.7] }));
        M.callout('NET DRUM', 1, [dx, near * B * 0.2, H.deckZ(dx) + 0.8], 1.4);
      }
    });
    M.part('LIFE RING', () => {
      for (const sd of [1, -1]) M.with({ at: [hx0 + 0.6, sd * (hw + 0.03), zd + houseH * 0.5], rz: sd * 90 }, () => SEA.lifeRing(M, { r: 0.33 }));
      M.callout('LIFE RING', 2, [hx0 + 0.6, near * (hw + 0.1), zd + houseH * 0.5], 0.8);
    });
    if (boat === 'tug') M.part('TOWING HOOK', () => { const tx = hx0 - 1.2; M.at(tx, 0, H.deckZ(tx), () => SEA.bitt(M, { r: 0.18 })); M.callout('TOWING BITT', 1, [tx, 0, H.deckZ(tx) + 0.4], 0.8); });
    const name = boat === 'tug' ? 'TUGBOAT' : 'FISHING BOAT';
    const klass = gear === 'legs' ? `${name} ON ${num(nLegs)} LEGS` : gear === 'tracks' ? `TRACKED ${name}` : gear === 'rails' ? `RAILWAY ${name}` : `${name} ON TRUCK WHEELS`;
    const crew = M.ri(3, 7);
    const where = gear === 'legs' ? M.pick(['the mud flats', 'the salt marsh', 'the dry reservoir']) : gear === 'tracks' ? M.pick(['the ice', 'the shingle', 'the sand bar']) : gear === 'rails' ? M.pick(['the next canal', 'the inland port']) : M.pick(['the lake', 'the next harbor']);
    const brief = boat === 'tug'
      ? M.pick([`Tows barges off ${where} when the tide goes out; ${low(crew)} crew.`, `Walks its tow across ${where} at low water with ${low(crew)} crew.`])
      : M.pick([`Takes the catch and ${low(crew)} crew over ${where} to market.`, `Fishes the channel and comes home across ${where}.`]);
    return {
      klass, family: gear === 'rails' ? 'rail' : 'ground', brief: brief.replace('Walks its tow', gear === 'legs' ? 'Walks its tow' : 'Moves its tow'),
      specs: [['MASS', `${Math.round(L * B * D * 0.32)} T`], ...g.specs, ['CREW', String(crew)]],
      figure: A.figSpot(M, L / 2 + 2),
    };
  },

  // ================================================================= submarine on rails or tracks
  sub(M, ctx) {
    const gear = M.pick(['rails', 'rails', 'tracks']);
    const L = M.r(22, 34), Rr = M.r(1.5, 2.0);
    const sailL = M.r(4, 6), sailH = M.r(2.2, 3.0), sailX = M.r(0.05, 0.18) * L;
    const casing = M.chance(0.7);
    const no = `U ${M.ri(10, 99)}`;
    const v = sideView(M, 30, 44, 22, 30);
    const Lf = L * 0.66, Wf = Math.min(2.6, Rr * 1.2);
    const g = chassis(M, gear, { Lf, Wf, sy: v.sy, tr: 0.75, tw: 0.8, speed: gear === 'tracks' ? M.ri(8, 15) : 60 });
    const zc = g.zTop + Rr * 0.94;
    // pressure hull: a lathe along x, round bow, tapering stern to the propeller
    const prof = [];
    const xb = L / 2, xs = -L / 2;
    for (let i = 0; i <= 6; i++) { const a = (90 - 90 * i / 6) * D2R; prof.push([Rr * Math.cos(a), xb - Rr * 1.4 * (1 - Math.sin(a))]); }
    prof.reverse();
    prof.unshift([Rr, xs + L * 0.3]);
    prof.unshift([Rr * 0.45, xs + 1.2], [Rr * 0.75, xs + L * 0.14]);
    prof.unshift([Rr * 0.18, xs]);
    prof[prof.length - 1][0] = 0.0001;
    let S;
    M.part('PRESSURE HULL', () => {
      S = M.at(0, 0, zc, () => M.lathe(prof.map(([r, x]) => [r, x]), { axis: 'x', sharpDeg: 30 }));
      if (M.decorOn) {
        const Lt = S.lat;
        for (let i = 1; i < 14; i++) Lt.ring(i / 14, { w: 0 });
        Lt.shade({ t0: 0.02, t1: 0.98, gap: 1.6, gapMax: 5 });
        const a = v.sy > 0 ? 100 : 260;
        Lt.text(no, a, 0.62, Rr * 0.35, { along: true });
        for (let i = 0; i < 40; i++) Lt.port(v.sy > 0 ? 125 : 235, 0.2 + i * 0.015, Rr * 0.05);
      }
      M.info.mass = [xs, -Rr, zc - Rr, xb, Rr, zc + Rr];
      M.info.centers = [[[xs - 1, 0, zc], [xb + 1, 0, zc]]];
      M.callout('PRESSURE HULL', 1, [0, v.sy * Rr * 0.95, zc], 2);
    });
    if (casing) M.part('DECK CASING', () => {
      const C = M.box([xs + L * 0.18, -Rr * 0.32, zc + Rr * 0.88], [xb - Rr * 1.6, Rr * 0.32, zc + Rr * 1.08]);
      const f = C.f('+z'); if (f.on) { for (let i = 1; i < 30; i++) f.line(-f.w / 2 + f.w * i / 30, -f.h / 2, -f.w / 2 + f.w * i / 30, f.h / 2, { w: 0 }); }
      M.callout('DECK CASING', 1, [xb - Rr * 3, 0, zc + Rr * 1.08], 0.8);
    });
    let top;
    M.part('CONNING TOWER', () => {
      const plan = [];
      for (let i = 0; i <= 8; i++) { const a = (-90 + 180 * i / 8) * D2R; plan.push([sailL / 2 - sailL * 0.25 + Math.cos(a) * sailL * 0.25, Math.sin(a) * Rr * 0.32]); }
      for (let i = 0; i <= 8; i++) { const a = (90 + 180 * i / 8) * D2R; plan.push([-sailL / 2 + sailL * 0.15 + Math.cos(a) * sailL * 0.15, Math.sin(a) * Rr * 0.3]); }
      const T = M.at(sailX, 0, 0, () => M.extrude(plan, zc + Rr * 0.6, zc + Rr + sailH, { smoothDeg: 30 }));
      top = zc + Rr + sailH;
      if (M.decorOn) for (let i = 0; i < plan.length; i++) {
        const f = T.f('s' + i);
        if (f.on && f.front) { f.line(-f.w / 2, f.h * 0.38, f.w / 2, f.h * 0.38, { w: 0 }); if (i % 3 === 0) f.hatch([-f.w / 2, -f.h / 2, f.w / 2, f.h * 0.38], { angle: 90, gap: 3.2 - f.tone, w: 0 }); }
      }
      M.at(sailX + sailL * 0.15, 0, top, () => X.periscope(M, { h: 2.4, r: 0.12 }));
      M.at(sailX - sailL * 0.1, 0, top, () => { M.cyl(0.08, 0, 1.6); M.at(0, 0, 1.6, () => K.whip(M, { h: 1.8 })); });
      M.mirrorY(() => M.at(sailX + sailL * 0.1, Rr * 0.3, zc + Rr + sailH * 0.55, () => M.rx(-90, () => A.foil(M, { root: { x: 0.6, h: 0, c: 1.2, t: 0.14 }, tip: { x: 0.5, h: 1.3, c: 0.9, t: 0 }, spar: false }))));
      M.callout('CONNING TOWER', 1, [sailX, v.sy * Rr * 0.32, zc + Rr + sailH * 0.4], 2.4);
      M.callout('PERISCOPE', 1, [sailX + sailL * 0.15, 0, top + 1.5], 1.6);
      M.callout('SAIL PLANE', 2, [sailX + sailL * 0.1, v.sy * (Rr * 0.3 + 1), zc + Rr + sailH * 0.55], 1);
    });
    M.part('STERN GEAR', () => {
      const x = xs + 1.0;
      for (const rx of [0, 90]) M.at(x, 0, zc, () => M.rx(rx, () => M.mirrorY(() => M.rx(-90, () => A.foil(M, { root: { x: 0.9, h: Rr * 0.4, c: 1.6, t: 0.16 }, tip: { x: 0.6, h: Rr * 1.5, c: 1.1, t: 0 }, cs: [{ s0: 0.15, s1: 0.95 }], spar: false })))));
      M.at(xs - 0.1, 0, zc, () => M.rz(180, () => K.propeller(M, { r: Rr * 0.75, blades: 5 })));
      M.callout('STERN PLANE', 4, [x, v.sy * Rr * 1.2, zc], 1.2);
      M.callout('PROPELLER', 1, [xs - 0.2, v.sy * Rr * 0.5, zc], 1.4);
    });
    M.part('HULL CRADLE', () => {
      const xsS = [];
      for (let i = 0; i < 5; i++) xsS.push(-Lf * 0.42 + Lf * 0.84 * i / 4);
      O.cradle(M, (x, y) => (Math.abs(y) < Rr * 0.95 ? zc - Math.sqrt(Rr * Rr - y * y) : null), xsS, [Wf * 0.36, -Wf * 0.36], g.zTop, { r: 0.1 });
      M.callout('HULL SADDLE', 10, [xsS[1], v.sy * Wf * 0.36, g.zTop + 0.4], 1.6);
    });
    M.part('HATCH', () => {
      for (const x of [xb - Rr * 2.4, xs + L * 0.25]) M.at(x, 0, zc + Rr * (casing ? 1.08 : 0.98), () => { M.cyl(0.4, 0, 0.18); M.at(0, 0, 0.18, () => M.cyl(0.45, 0, 0.06)); });
    });
    const klass = gear === 'rails' ? 'RAILWAY SUBMARINE' : 'TRACKED SUBMARINE';
    const crew = M.ri(18, 44);
    const brief = gear === 'rails'
      ? M.pick([`Runs between two lakes on the branch line with ${crew} crew aboard.`, `Reaches the inland sea by rail and dives there; ${crew} crew.`])
      : M.pick([`Crosses the isthmus under its own power and dives on the far side.`, `Drives ${crew} crew from the dry dock to the water without a crane.`]);
    return {
      klass, family: gear === 'rails' ? 'rail' : 'ground', brief,
      specs: [['MASS', `${Math.round(L * Rr * Rr * 3.1)} T`], ...g.specs, ['CREW', String(crew)]],
      figure: A.figSpot(M, L / 2 + 2),
    };
  },

  // ================================================================= steam locomotive, other halves
  loco(M, ctx) {
    const form = M.pick(['flyingboat', 'flyingboat', 'heli']);
    const Lb = M.r(6.5, 8.5), Rb = M.r(0.75, 0.9);
    const domes = M.ri(1, 2);
    const cabL = M.r(2.2, 2.8), cabH = M.r(2.2, 2.5);
    const span = M.r(16, 22), chord = M.r(2.2, 2.8);
    const no = String(M.ri(1100, 9899));
    const v = sideView(M, 34, 50, 22, 30);
    const near = v.sy;
    // the base plane: on floats over water, or on a track
    let zf, top = 0;
    const xF = Lb / 2 + 0.6, xR = -Lb / 2 - cabL;
    const Wfp = 2.7;
    if (form === 'heli') {
      M.part('TRACK', () => { top = R.track(M, { x0: xR - 3, x1: xF + 3, ballast: true }).top; });
      const wr = M.r(0.75, 0.9);
      M.part('DRIVING WHEEL', () => {
        const xs = [Lb * 0.2, Lb * 0.2 - wr * 2.3, Lb * 0.2 - wr * 4.6];
        for (const x of xs) M.at(x, 0, top + wr, () => R.wheelset(M, { r: wr, kind: 'spoke', nearSide: near }));
        // coupling rods on both sides
        for (const s of [1, -1]) M.box([xs[2] - 0.1, s * 0.95 - 0.03, top + wr * 0.7 - 0.05], [xs[0] + 0.1, s * 0.95 + 0.03, top + wr * 0.7 + 0.05], { isect: false });
        M.callout('DRIVING WHEEL', 6, [xs[1], near * 0.9, top + wr], 2);
        M.callout('COUPLING ROD', 2, [xs[1], near * 0.95, top + wr * 0.7], 1);
        M.info.centers = xs.map((x) => [[x, -1.6, top + wr], [x, 1.6, top + wr]]);
      });
      zf = top + wr * 2 + 0.15;
      M.part('FRAMES', () => { for (const s of [1, -1]) M.box([xR, s * 0.62 - 0.05, top + wr * 0.5], [xF, s * 0.62 + 0.05, zf], { isect: false }); });
    } else {
      M.part('FLOAT', () => {
        for (const s of [1, -1]) {
          M.at(-0.5, s * span * 0.16, 0, () => A.pontoon(M, { len: Lb + 2.5, w: 1.1, h: 0.9 }));
          for (const x of [Lb * 0.25, -Lb * 0.35]) { M.tube([x, s * span * 0.16, 0.85], [x, s * 0.9, 2.1], 0.08, {}); M.tube([x, s * span * 0.16, 0.85], [x + 1.2, s * span * 0.16 * 0.6, 2.1], 0.06, {}); }
        }
        M.tube([Lb * 0.25, -span * 0.16, 0.85], [Lb * 0.25, span * 0.16, 0.85], 0.06, { isect: false });
        M.callout('FLOAT', 2, [-0.5, near * (span * 0.16 + 0.55), 0.5], 2);
        M.callout('FLOAT STRUT', 8, [Lb * 0.25, near * span * 0.12, 1.4], 1);
      });
      M.part('WATER', () => A.waves(M, xR - 6, xF + 6, -span / 2, span / 2, 1.8, 29));
      zf = 2.1;
    }
    // footplate, boiler, smokebox, chimney, domes, cab
    const zB = zf + 0.35 + Rb;
    M.part('FOOTPLATE', () => {
      const P = M.box([xR, -Wfp / 2, zf], [xF, Wfp / 2, zf + 0.14]);
      void P;
      M.at(xF, 0, 0, () => R.bufferBeam(M, { w: Wfp, z: zf - 0.1 }));
      M.callout('FOOTPLATE', 1, [xF - 0.5, near * Wfp / 2, zf + 0.07], 0.8);
    });
    M.part('BOILER', () => {
      const Bz = M.at(0, 0, zB, () => M.cyl(Rb, -Lb / 2, Lb / 2 - 1.2, { axis: 'x' }));
      if (M.decorOn) { const L2 = Bz.lat; for (let i = 1; i < 5; i++) L2.ring(i / 5, { w: 1 }); L2.shade({ gap: 1.6, gapMax: 4.5 }); }
      // smokebox
      const SB = M.at(0, 0, zB, () => M.cyl(Rb * 1.07, Lb / 2 - 1.2, Lb / 2, { axis: 'x' }));
      M.at(Lb / 2, 0, zB, () => {
        const D = M.cyl(Rb * 0.95, 0, 0.08, { axis: 'x', isect: false });
        if (D.top.on) { D.top.circle(0, 0, Rb * 0.8, { w: 1 }); for (const k of [-1, 1]) D.top.line(-Rb * 0.25, k * Rb * 0.12, Rb * 0.25, k * Rb * 0.12, { w: 1 }); D.top.text(no, 0, -Rb * 0.5, Rb * 0.18, { w: 1 }); }
        M.at(0.12, 0, Rb * 0.55, () => O.lampUnit(M, 0.16));
      });
      if (M.decorOn) SB.lat.shade({ gap: 1.4 });
      // chimney and domes
      M.at(Lb / 2 - 0.6, 0, zB + Rb * 0.9, () => M.lathe([[Rb * 0.42, 0], [Rb * 0.3, 0.2], [Rb * 0.28, 0.75], [Rb * 0.38, 0.95], [Rb * 0.4, 1.05]], { sharpDeg: 30 }));
      for (let i = 0; i < domes; i++) M.at(-0.6 - i * 1.8, 0, zB + Rb * 0.9, () => M.lathe([[Rb * 0.5, 0], [Rb * 0.42, 0.2], [Rb * 0.4, 0.45], [Rb * 0.25, 0.65], [0.0001, 0.72]], { sharpDeg: 30 }));
      for (const s of [1, -1]) K.pipeRun(M, [[Lb / 2 - 1.3, s * (Rb + 0.08), zB + 0.3], [-Lb / 2, s * (Rb + 0.08), zB + 0.3]], 0.025, { flanges: false });
      // cylinders and steam pipes
      for (const s of [1, -1]) M.at(Lb * 0.32, s * 1.05, zf - 0.05, () => M.cyl(0.32, -0.6, 0.6, { axis: 'x' }));
      M.callout('BOILER', 1, [0, near * Rb, zB], 2.6);
      M.callout('SMOKEBOX', 1, [Lb / 2 - 0.5, near * Rb, zB], 1.4);
      M.callout('CHIMNEY', 1, [Lb / 2 - 0.6, 0, zB + Rb + 0.8], 1.2);
      M.info.mass = [xR, -Wfp / 2, zf, xF, Wfp / 2, zB + Rb];
    });
    let cabTop;
    M.part('CAB', () => {
      const x0 = -Lb / 2 - cabL, x1 = -Lb / 2 + 0.1, z0 = zf + 0.14;
      const C = M.box([x0, -Wfp / 2 + 0.05, z0], [x1, Wfp / 2 - 0.05, z0 + cabH]);
      cabTop = z0 + cabH;
      for (const k of ['+y', '-y']) {
        const f = C.f(k);
        if (!f.on || !f.front) continue;
        const P = (x, z) => O.faceUV(f, M.W([x, k === '+y' ? Wfp / 2 - 0.05 : -Wfp / 2 + 0.05, z]));
        const a = P(x1 - 1.1, z0 + cabH * 0.55), b = P(x1 - 0.2, z0 + cabH * 0.9);
        K.glass(f, [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]], { gap: 1.0, gap2: 2.4 });
        const c = P(x0 + cabL * 0.4, z0 + cabH * 0.25);
        f.text(no, c[0], c[1], 0.22, { w: 1 });
        const d0 = P(x0 + 0.15, z0 + 0.05), d1 = P(x0 + 0.85, z0 + cabH * 0.5);
        f.rect(d0[0], d0[1], d1[0], d1[1], { w: 1 });
      }
      const fr = C.f('+x');
      if (fr.on) for (const s of [-1, 1]) K.porthole(fr, s * Wfp * 0.28, cabH * 0.3, 0.22);
      const rp = [[-Wfp / 2 - 0.1, 0], [Wfp / 2 + 0.1, 0]];
      for (let i = 0; i <= 6; i++) { const a = i * Math.PI / 6; rp.push([Math.cos(a) * (Wfp / 2 + 0.1), Math.sin(a) * 0.3]); }
      rp.splice(0, 2);
      M.extrude(rp.map(([y, z]) => [y, z + z0 + cabH]), x0 - 0.15, x1 + 0.1, { plane: 'yz', smoothDeg: 35 });
      cabTop = z0 + cabH + 0.3;
      M.callout('CAB', 1, [x0 + cabL * 0.5, near * Wfp / 2, z0 + cabH * 0.7], 1.6);
    });
    let brief, klass, specs;
    if (form === 'flyingboat') {
      const zW = cabTop + M.r(1.0, 1.5);
      M.part('WING', () => {
        const xw = -Lb * 0.12;
        M.at(xw, 0, zW, () => M.mirrorY(() => M.rx(-90, () => A.foil(M, { root: { x: chord / 2, h: 0, c: chord, t: chord * 0.12 }, tip: { x: chord * 0.4, h: span / 2, c: chord * 0.7, t: 0 }, ribs: Math.round(span / 1.5), cs: [{ s0: 0.6, s1: 0.95 }] }))));
        for (const s of [1, -1]) for (const dx of [chord * 0.25, -chord * 0.25]) {
          M.tube([xw + dx, s * 0.9, zB + Rb * 0.6], [xw + dx, s * 1.5, zW], 0.06, {});
          M.tube([xw + dx, s * Wfp / 2, zf + 0.1], [xw + dx, s * span * 0.3, zW], 0.07, {});
        }
        M.callout('HIGH WING', 1, [xw, near * span * 0.3, zW + 0.2], 3);
        M.callout('WING STRUT', 4, [xw + chord * 0.25, near * span * 0.2, (zf + zW) / 2 + 0.5], 1.2);
        // two engines on the wing
        for (const s of [1, -1]) M.at(xw + chord * 0.3, s * span * 0.2, zW - 0.15, () => A.nacelle(M, { len: 2.0, r: 0.42, prop: 'front', propR: 1.4, blades: 3 }));
        M.callout('ENGINE', 2, [xw + chord, near * span * 0.2, zW - 0.15], 2);
        // tail on a boom from the cab
        M.tube([xR, 0, cabTop - 0.3], [xR - 5.5, 0, cabTop + 0.4], 0.14, {});
        M.at(xR - 5.4, 0, cabTop + 0.4, () => {
          M.mirrorY(() => M.rx(-90, () => A.foil(M, { root: { x: 1.3, h: 0, c: 1.3, t: 0.12 }, tip: { x: 1.1, h: 2.6, c: 0.9, t: 0 }, cs: [{ s0: 0.1, s1: 0.95 }], spar: false })));
          A.foil(M, { root: { x: 1.5, h: 0, c: 1.5, t: 0.14 }, tip: { x: 1.1, h: 2.0, c: 0.9, t: 0 }, cs: [{ s0: 0.1, s1: 0.95 }], spar: false });
        });
        M.callout('TAIL BOOM', 1, [xR - 3, 0, cabTop + 0.1], 1);
      });
      const st = SEA.landingStage(M, { at: A.figSpot(M, Lb + 4), rz: 0 });
      klass = 'STEAM LOCOMOTIVE, FLYING BOAT TYPE';
      brief = M.pick([`Carries the island mail from the railhead and lands at the jetty.`, `Brings ${M.ri(8, 20)} t of coal to the lake steamers by air.`]);
      specs = [['SPAN', `${Math.round(span * 1000).toLocaleString('en-US').replace(/,/g, ' ')} MM`], ['MASS', `${Math.round(Lb * 7)} T`], ['ENGINES', '2 + 1 STEAM'], ['CREW', '3']];
      return { klass, family: 'air', brief, specs, figure: (st && st.spot) || A.figSpot(M, Lb + 4) };
    }
    // the helicopter half: a rotor pylon on the cab roof and a tail boom
    M.part('ROTOR', () => {
      const xr = -Lb * 0.2, zr = cabTop + 1.6, Rr = M.r(7, 9);
      for (const s of [1, -1]) for (const dx of [-0.8, 0.8]) M.tube([xr + dx, s * Rb * 0.9, zB + Rb * 0.4], [xr, 0, zr - 0.6], 0.07, {});
      M.boxc([xr, 0, zr - 0.45], [1.4, 0.9, 0.5], { chamfer: 0.2 });
      M.cyl(0.12, zr - 0.2, zr + 0.2);
      M.at(xr, 0, zr + 0.2, () => K.rotor(M, { r: Rr, blades: 4, chord: 0.45, swash: true }));
      M.callout('MAIN ROTOR', 1, [xr + Rr * 0.6, near * 0.3, zr + 0.2], 3);
      M.callout('ROTOR PYLON', 1, [xr, near * 0.5, zr - 0.5], 1.2);
      M.along([xR, 0, cabTop - 0.2], [xR - 7, 0, cabTop + 0.6], (l) => { const T = M.lathe([[0.4, 0], [0.14, l]], { axis: 'x' }); if (M.decorOn) T.lat.shade({ gap: 1.6 }); });
      M.at(xR - 6.8, near * 0.18, cabTop + 0.9, () => M.rx(-90, () => K.rotor(M, { r: 1.2, blades: 3, chord: 0.14 })));
      M.extrude([[xR - 6.2, cabTop + 0.5], [xR - 7.1, cabTop + 0.6], [xR - 7.6, cabTop + 2.0], [xR - 7.1, cabTop + 2.0]], -0.05, 0.05, { plane: 'xz' });
      M.callout('TAIL ROTOR', 1, [xR - 6.8, near * 0.2, cabTop + 0.9], 1.2);
    });
    klass = 'STEAM LOCOMOTIVE, HELICOPTER TYPE';
    brief = M.pick([`Lifts itself over the gap where the viaduct fell and runs on.`, `Hauls the mountain mail and flies the last 4 km to the summit.`]);
    specs = [['MASS', `${Math.round(Lb * 8)} T`], ['DRIVING WHEELS', '6'], ['ROTOR', '4 BLADES'], ['CREW', '2']];
    return { klass, family: 'rail', brief, specs, figure: A.figSpot(M, Lb + 3) };
  },

  // ================================================================= the ring-wing airliner
  ringwing(M, ctx) {
    const L = M.r(30, 44), Rf = L * M.r(0.05, 0.06);
    const Rr = L * M.r(0.27, 0.35), chord = Rr * M.r(0.32, 0.45), tk = chord * 0.11;
    const xr = -L * M.r(0.05, 0.15);
    const engines = M.pick([2, 2, 3]);
    const airline = M.pick(['TRANSCONTINENTAL', 'AIR ANATOLIA', 'NORTHERN AIRWAYS', 'LAKE AIR', 'AEROLINEA']);
    const v = sideView(M, 34, 52, 20, 30);
    const near = v.sy;
    const zc = Rf + 2.2;
    // fuselage: a lathe along x, ogive nose, parallel body, tail cone
    const prof = [];
    for (let i = 0; i <= 8; i++) { const a = (90 * i / 8) * D2R; prof.push([Rf * Math.sin(a), L / 2 - Rf * 2.2 * (1 - Math.cos(a)) - 0.0001 * i]); }
    prof.reverse();
    const pr2 = [[0.0001, -L / 2], [Rf * 0.25, -L / 2 + 0.3], [Rf * 0.75, -L / 2 + L * 0.14], [Rf, -L / 2 + L * 0.3], ...prof];
    pr2[pr2.length - 1] = [0.0001, L / 2];
    let F;
    M.part('FUSELAGE', () => {
      F = M.at(0, 0, zc, () => M.lathe(pr2.map(([r, x]) => [r, x]).sort((a, b) => a[1] - b[1]), { axis: 'x', sharpDeg: 40 }));
      if (M.decorOn) {
        const Lt = F.lat;
        Lt.shade({ t0: 0.02, t1: 0.98, gap: 1.6, gapMax: 6 });
        const side = near > 0 ? 1 : -1;
        const aw = side > 0 ? 100 : 260;
        for (const da of [-14, -10]) Lt.meridian(side > 0 ? 90 + da : 270 - da, 0.18, 0.95, { w: 1 });
        const nwin = Math.round(L * 0.9);
        for (let i = 0; i < nwin; i++) Lt.port(aw, 0.3 + 0.6 * i / nwin, Rf * 0.07);
        Lt.text(airline, aw + side * 18, 0.6, Rf * 0.32, { along: true });
        for (const t of [0.32, 0.86]) Lt.shape(side > 0 ? 95 : 265, t, [[-0.45, -0.9], [0.45, -0.9], [0.45, 0.9], [-0.45, 0.9]], { closed: true, w: 1 });
        // cockpit windows
        for (const a of [150, 165, 195, 210]) Lt.shape(a, 0.975, [[-0.25, -0.15], [0.25, -0.15], [0.2, 0.15], [-0.2, 0.15]], { closed: true, w: 1 });
      }
      M.info.mass = [-L / 2, -Rf, zc - Rf, L / 2, Rf, zc + Rf];
      M.info.centers = [[[-L / 2 - 2, 0, zc], [L / 2 + 2, 0, zc]]];
      M.callout('FUSELAGE', 1, [L * 0.2, near * Rf, zc], 2);
    });
    // the ring: an airfoil section swept about the flight axis; the fuselage runs through its foot
    const zr = zc + Rr - Rf * 0.4;
    M.part('RING WING', () => {
      const FOIL = [[0, 0], [0.05, 0.4], [0.22, 0.5], [0.7, 0.3], [1, 0.03], [1, -0.03], [0.7, -0.3], [0.22, -0.5], [0.05, -0.4]];
      const sec = FOIL.map(([u, w]) => [Rr + w * tk * 2, chord / 2 - u * chord]);
      const Rg = M.at(xr, 0, zr, () => M.lathe(sec, { axis: 'x', loop: true, sharpDeg: 50, minSeg: 64 }));
      if (M.decorOn) {
        const Lt = Rg.lat;
        for (let i = 0; i < 36; i++) Lt.meridian(i * 10 + 5, 0.03, 0.42, { w: 0 });
        Lt.shade({ gap: 1.8, gapMax: 5, threshold: 0.3 });
      }
      M.callout('RING WING', 1, [xr, near * Rr * 0.7, zr + Rr * 0.7], 3);
      // the root fairing where the ring meets the fuselage
      M.at(xr, 0, zc + Rf * 0.6, () => M.scale(chord * 0.75, Rf * 0.9, Rf * 0.7, () => M.sphere(1)));
      M.callout('ROOT FAIRING', 1, [xr, near * Rf * 0.8, zc + Rf * 0.8], 1.2);
    });
    M.part('ENGINE', () => {
      // two pods on short pylons on the rear fuselage, as in the drawing it came from; a third on the crown of the ring
      const xe = Math.max(-L / 2 + L * 0.2, xr - chord * 0.7);
      for (const s of [1, -1]) {
        const ye = s * (Rf * 1.75), ze = zc + Rf * 0.35;
        M.at(xe, ye, ze, () => A.nacelle(M, { len: Rf * 3, r: Rf * 0.5, prop: null, exhaust: false }));
        M.extrude([[xe - Rf * 0.6, -Rf * 0.08], [xe + Rf * 0.9, -Rf * 0.08], [xe + Rf * 0.5, Rf * 0.08], [xe - Rf * 0.6, Rf * 0.08]].map(([x, z]) => [x, z + ze]), s * Rf * 0.6, s * Rf * 1.3, { plane: 'xz' });
      }
      if (engines === 3) M.at(xr, 0, zr + Rr + tk + Rf * 0.6, () => A.nacelle(M, { len: Rf * 3.2, r: Rf * 0.45, prop: null, exhaust: false }));
      M.callout('ENGINE', engines, [xe + Rf * 1.5, near * Rf * 2.2, zc + Rf * 0.35], 2);
    });
    M.part('FIN', () => {
      M.at(-L / 2 + 1.5, 0, zc + Rf * 0.6, () => A.foil(M, { root: { x: L * 0.12, h: 0, c: L * 0.12, t: 0.4 }, tip: { x: L * 0.05, h: Rf * 2.2, c: L * 0.06, t: 0 }, cs: [{ s0: 0.1, s1: 0.9 }], spar: false }));
      M.callout('FIN', 1, [-L / 2 + 2.5, 0, zc + Rf * 2.2], 1);
    });
    M.part('UNDERCARRIAGE', () => {
      const h = zc - Rf * 0.8;
      M.at(L * 0.36, 0, 0, () => A.gearLeg(M, { h, wr: 0.45, ww: 0.3 }));
      for (const s of [1, -1]) M.at(xr - chord * 0.2, s * Rf * 0.7, 0, () => { A.gearLeg(M, { h, wr: 0.6, ww: 0.36 }); M.at(0, s * 0.5, 0.6, () => K.wheel(M, { r: 0.6, w: 0.36, hub: 0.3 })); });
      M.callout('MAIN UNDERCARRIAGE', 2, [xr - chord * 0.2, near * Rf * 0.9, 0.9], 1.4);
      M.callout('NOSE GEAR', 1, [L * 0.36, 0, 0.6], 1);
    });
    const pax = Math.round(L * 5.5 / 10) * 10;
    const brief = M.pick([`Carries ${pax} passengers between capitals on one ring in place of two wings.`, `Seats ${pax} and fits a gate meant for a smaller aircraft.`, `Flies ${pax} passengers ${M.ri(3, 6)} 000 km on a wing with no tips.`]);
    return {
      klass: 'RING-WING AIRLINER', family: 'air', brief,
      specs: [['RING DIAMETER', `${Math.round(Rr * 2000).toLocaleString('en-US').replace(/,/g, ' ')} MM`], ['MASS', `${Math.round(L * 3.4)} T`], ['ENGINES', String(engines)], ['PASSENGERS', String(pax)]],
      figure: A.figSpot(M, L / 2 + 3),
    };
  },

  // ================================================================= airship with a bus or a tram
  airship(M, ctx) {
    const tram = M.chance(0.45);
    const L = M.r(10, 12), dh = 2.1;
    const EL = L * M.r(2.1, 2.6), ER = EL * M.r(0.14, 0.17);
    const gapZ = M.r(2.4, 4.0);
    const form = M.pick(['classic', 'rigid']);
    const route = String(M.ri(2, 40));
    const v = sideView(M, 32, 46, 22, 30);
    const near = v.sy;
    let b, top = 0;
    if (tram) {
      M.part('TRACK', () => { top = R.track(M, { x0: -L / 2 - 4, x1: L / 2 + 4, ballast: false }).top; });
    }
    let zB = 0;
    M.part('GONDOLA', () => {
      if (tram) {
        let bt = 1;
        for (const x of [-L * 0.3, L * 0.3]) M.at(x, 0, top, () => { bt = R.bogie(M, { n: 2, pitch: 1.8, r: 0.38, nearSide: near }).top; });
        zB = top + bt;
        M.at(0, 0, zB, () => { b = O.bus(M, { len: L, decks: 1, deckH: dh, route: `${route} DEPOT`, livery: 'TRAMWAYS', wheels: [], r: 0.3 }); });
      } else b = O.bus(M, { len: L, decks: 1, deckH: dh, route: `${route} AIRFIELD`, livery: 'AIR COACH' });
      M.callout(tram ? 'TRAMCAR GONDOLA' : 'BUS GONDOLA', 1, [0, near * b.W / 2, zB + b.H * 0.5], 2.4);
    });
    const roof = zB + b.H + 0.2;
    const zE = roof + gapZ + ER;
    let E;
    M.part('ENVELOPE', () => {
      E = M.at(0, 0, zE, () => A.envelope(M, { L: EL, R: ER, form, gores: 24, rings: [-EL * 0.3, 0, EL * 0.3], text: tram ? 'TRAMWAYS' : 'AIR COACH', textSide: near, textH: ER * 0.25 }));
      M.callout('ENVELOPE', 1, [0, near * ER * 0.7, zE + ER * 0.7], 2.6);
      // fins
      M.at(-EL * 0.4, 0, zE, () => {
        for (const rx of [0, 90, 180, 270]) M.rx(rx, () => A.foil(M, { root: { x: EL * 0.08, h: ER * 0.35, c: EL * 0.12, t: ER * 0.06 }, tip: { x: EL * 0.02, h: ER * 1.1, c: EL * 0.07, t: 0 }, cs: [{ s0: 0.1, s1: 0.9 }], spar: false }));
      });
      M.callout('TAIL FIN', 4, [-EL * 0.42, near * ER * 0.9, zE], 1.2);
    });
    M.info.mass = [-EL / 2, -ER, zE - ER, EL / 2, ER, zE + ER];
    // rigging: a roof frame on the bus, lines up to a load band on the envelope
    M.part('RIGGING', () => {
      const xs = [-L * 0.4, -L * 0.13, L * 0.13, L * 0.4];
      for (const s of [1, -1]) M.box([-L * 0.45, s * (b.W / 2 - 0.2) - 0.06, roof - 0.05], [L * 0.45, s * (b.W / 2 - 0.2) + 0.06, roof + 0.07], { isect: false });
      for (const x of xs) M.box([x - 0.06, -b.W / 2 + 0.2, roof - 0.05], [x + 0.06, b.W / 2 - 0.2, roof + 0.07], { isect: false });
      for (const x of xs) for (const s of [1, -1]) {
        const p = [x, s * (b.W / 2 - 0.2), roof + 0.07];
        for (const dx of [-1.5, 1.5]) {
          const xe = x * 1.6 + dx;
          const rr = ER * 0.85;
          A.wire(M, p, [xe, s * rr * 0.5, zE - Math.sqrt(Math.max(0, rr * rr - (rr * 0.5) ** 2))], { w: 1 });
        }
      }
      M.callout('SUSPENSION LINE', 16, [xs[1], near * b.W / 2, roof + gapZ * 0.5], 1.6);
      M.callout('ROOF FRAME', 1, [xs[2], near * (b.W / 2 - 0.2), roof], 1);
      // two engines on outriggers from the roof frame
      for (const s of [1, -1]) {
        M.tube([0, s * (b.W / 2 - 0.2), roof + 0.07], [-0.5, s * (b.W / 2 + 2.2), roof + 0.8], 0.08, {});
        M.at(-0.5, s * (b.W / 2 + 2.2), roof + 0.8, () => A.nacelle(M, { len: 1.8, r: 0.38, prop: 'rear', propR: 1.2, blades: 3 }));
      }
      M.callout('ENGINE CAR', 2, [-0.5, near * (b.W / 2 + 2.2), roof + 1.1], 1.4);
    });
    const pax = Math.round(L * 3.2);
    const brief = tram
      ? M.pick([`Runs route ${route} on rails and lifts off where the line is flooded.`, `Carries ${pax} passengers along route ${route} with half its weight on gas.`])
      : M.pick([`Drives ${pax} passengers to the airfield and flies the rest of the way.`, `Carries ${pax} passengers over the river where there is no bridge.`]);
    return {
      klass: tram ? 'AIRSHIP WITH A TRAM FOR A GONDOLA' : 'AIRSHIP WITH A BUS FOR A GONDOLA', family: tram ? 'rail' : 'air', brief,
      specs: [['ENVELOPE', `${Math.round(Math.PI * ER * ER * EL * 0.6)} M3`], ['MASS', `${Math.round(9 + L * 0.6)} T`], ['PASSENGERS', String(pax)], ['CREW', '3']],
      figure: A.figSpot(M, EL / 2 + 2),
    };
  },

  // ================================================================= a bus under a rotor
  helibus(M, ctx) {
    const L = M.r(9, 11.5), Rr = L * M.r(0.62, 0.8), blades = M.pick([2, 3, 4, 5]);
    const boom = M.r(5, 7);
    const route = String(M.ri(2, 90));
    const v = sideView(M, 32, 48, 22, 30);
    const near = v.sy;
    let b;
    M.part('BUS', () => { b = O.bus(M, { len: L, decks: 1, route: `${route} HELIPORT`, livery: 'AIR SERVICE' }); M.callout('BUS BODY', 1, [0, near * b.W / 2, b.H * 0.5], 2); });
    const roof = b.H + 0.18;
    M.part('ROTOR PYLON', () => {
      const P = M.box([-L * 0.25, -b.W * 0.32, roof - 0.1], [L * 0.2, b.W * 0.32, roof + 0.9], { chamfer: 0.35 });
      for (const k of ['+y', '-y']) { const f = P.f(k); if (f.on) f.grid(3, 1, { gap: 2 }).forEach((r, i) => (i === 1 ? K.louver(f, r) : K.plain(f, r))); }
      for (const s of [1, -1]) for (const x of [-L * 0.3, L * 0.25]) M.tube([x, s * (b.W / 2 - 0.1), roof - 0.15], [x * 0.6, s * b.W * 0.3, roof + 0.4], 0.07, {});
      M.at(-L * 0.18, b.W * 0.2, roof + 0.9, () => K.stack(M, { r: 0.14, h: 0.8 }));
      M.cyl(0.18, roof + 0.9, roof + 1.6);
      M.at(0, 0, roof + 1.6, () => K.rotor(M, { r: Rr, blades, chord: L * 0.045, swash: true }));
      M.callout('MAIN ROTOR', 1, [Rr * 0.5, near * Rr * 0.3, roof + 1.6], 3);
      M.callout('ENGINE PYLON', 1, [0, near * b.W * 0.32, roof + 0.45], 1.6);
      M.callout('PYLON STRUT', 4, [L * 0.25, near * (b.W / 2 - 0.1), roof], 0.9);
    });
    M.part('TAIL BOOM', () => {
      const x0 = -L / 2 + 0.4, z0 = roof + 0.3;
      M.along([x0 + 0.5, 0, z0], [x0 - boom, 0, z0 + 0.6], (l) => { const T = M.lathe([[0.45, 0], [0.16, l]], { axis: 'x' }); if (M.decorOn) { T.lat.shade({ gap: 1.6 }); for (let i = 1; i < 6; i++) T.lat.ring(i / 6, { w: 0 }); } });
      for (const s of [1, -1]) M.tube([x0, s * (b.W / 2 - 0.2), roof - 0.2], [x0 - 1.4, 0, z0 + 0.05], 0.06, {});
      const xt = x0 - boom;
      M.extrude([[xt + 0.6, z0 + 0.4], [xt - 0.2, z0 + 0.6], [xt - 0.8, z0 + 2.2], [xt - 0.2, z0 + 2.2]], -0.05, 0.05, { plane: 'xz' });
      M.box([xt + 0.1, -1.0, z0 + 0.55], [xt + 0.8, 1.0, z0 + 0.62]);
      M.at(xt - 0.2, near * 0.2, z0 + 1.2, () => M.rx(-90, () => K.rotor(M, { r: 1.1, blades: 3, chord: 0.14 })));
      M.callout('TAIL BOOM', 1, [x0 - boom * 0.5, near * 0.3, z0 + 0.3], 1.8);
      M.callout('TAIL ROTOR', 1, [xt - 0.2, near * 0.3, z0 + 1.2], 1.2);
    });
    M.info.mass = [-L / 2, -b.W / 2, 0, L / 2, b.W / 2, b.H];
    const pax = Math.round(L * 3.6);
    const brief = M.pick([`Carries ${pax} passengers to the airport and skips the traffic.`, `Runs route ${route} by road and crosses the estuary by air.`, `Takes ${pax} commuters across the river where the ferry stopped.`]);
    return {
      klass: 'BUS WITH A HELICOPTER ROTOR', family: 'air', brief,
      specs: [['ROTOR DIAMETER', `${Math.round(Rr * 2000).toLocaleString('en-US').replace(/,/g, ' ')} MM`], ['MASS', `${Math.round(10 + L * 0.5)} T`], ['PASSENGERS', String(pax)], ['CREW', '2']],
      figure: A.figSpot(M, L / 2 + 2),
    };
  },
};
