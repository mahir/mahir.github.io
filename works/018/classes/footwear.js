// classes/footwear.js: shoes at vehicle scale, built by engineers who took the order
// literally. Each shoe is lofted through cross-sections along the foot (parts-wear.js): sole,
// upper with its throat opening, heel. Then it is made a machine: a windshield across the
// throat, a seat and a steering wheel inside, headlamps on the toe, plate seams on the shoe's
// own seams, stitching as rivet rows, a number on the quarter, a door with a step, an exhaust
// out of the heel. It stands on running gear from gear.js.
//
// Objects: pump (stiletto), boot (laced work boot), clog, wellington (or riding boot),
// sandal (straps and a buckle).

import * as G from './gear.js';
import { word, fitBrief } from '../words.js';
import { curve, steps, mesh, Surf, shoe, seatUnit, steering, windshield, clamp, smooth, mix, K, D2R, add, sub, mul, norm, cross, dot, len, lerp } from './parts-wear.js';

const OBJECTS = ['pump', 'boot', 'clog', 'wellington', 'sandal'];
const U = (s) => s.toUpperCase();
const sc = (pts, k) => pts.map(([s, v]) => [s, v * k]);

export default {
  id: 'footwear',
  family: 'ground',
  weight: 2,
  build(M) {
    const objs = OBJECTS.filter((k) => BUILD[k]);
    let obj = M.pick(objs);
    if (G.test.variant && BUILD[G.test.variant]) obj = G.test.variant;
    return BUILD[obj](M);
  },
};

// ------------------------------------------------------------------ common helpers
function viewSide(M, el0 = 18, el1 = 26, a0 = 52, a1 = 68, pf = 0.8) {
  const side = M.pick([1, -1]);
  const front = M.chance(pf) ? 1 : -1;   // mostly see the toe end
  const az = (front > 0 ? 0 : 180) + side * front * M.r(a0, a1);
  M.setView(az, M.r(el0, el1));
  return { side: M.view.e[1] >= 0 ? 1 : -1, front: M.view.e[0] >= 0 ? 1 : -1 };
}
// callout anchor nudged toward the viewer
function co(M, label, qty, p, prio = 1) {
  const e = M.view.e, k = (M.px || 0) * 3;
  M.world(() => M.callout(label, qty, [p[0] + e[0] * k, p[1] + e[1] * k, p[2] + e[2] * k], prio));
}
const W = (M, p) => M.W(p);

// plate seams, stitching, rivets on one side of the upper
function dressUpper(M, sh, o) {
  const { Ls } = sh;
  for (const side of [1, -1]) {
    const F = sh.surf(side);
    if (!M.decorOn) continue;
    if (!F.seen(0.5, 0.4) && !F.seen(0.85, 0.4) && !F.seen(0.2, 0.4)) continue;
    // the sole welt: stitching just above the sole edge
    F.rowS(o.weltV ?? 0.05, 0.02, 0.985, { kind: 'stitch', pitch: 4.2 });
    // top line stitching
    if (o.topStitch !== false) F.rowS(0.93, 0.01, Ls.sT, { kind: 'stitch', pitch: 4.2 });
    // seams the shoe has: vamp seam, back seam, toe cap
    for (const sm of o.seams || []) {
      F.line(sm.pts, { w: 1 });
      if (sm.rivets) F.row(sm.pts.map(([s, v]) => [s + (sm.ds ?? -0.012), v]), { pitch: 6, r: 0.75 });
      if (sm.stitch) F.row(sm.pts.map(([s, v]) => [s + (sm.ds ?? 0.01), v]), { kind: 'stitch', pitch: 4 });
    }
    // plate butt seams: lines at constant s, rivets each side
    for (const s of o.butts || []) {
      const v1 = s < Ls.sT ? 0.93 : 0.985;
      F.runU(s, 0.06, v1, { w: 1 });
      F.rowU(s - 0.008, 0.08, v1 - 0.04, { pitch: 6.5, r: 0.7 });
      F.rowU(s + 0.008, 0.08, v1 - 0.04, { pitch: 6.5, r: 0.7 });
    }
    // longitudinal seam
    if (o.lseam) { F.runS(o.lseam, 0.03, 0.97, { w: 1 }); F.rowS(o.lseam + 0.03, 0.04, 0.95, { pitch: 6.5, r: 0.7 }); }
    F.shade({ gap: o.shadeGap ?? 2.3, u: [0.02, 0.985], k: 140 });
  }
}

// interior: the inside of the far wall in shadow, the insole floor
function dressInside(M, sh) {
  if (!M.decorOn) return;
  const { Ls } = sh;
  for (const side of [1, -1]) {
    const F = sh.surf(side);
    const n = 26;
    for (let i = 0; i < n; i++) {
      const v = 0.15 + 0.84 * (i + 0.5) / n;
      F.runS(v, 0.005, Ls.sT, { w: 0, pass: 3, inner: true, k: 70 });
    }
  }
  if (sh.insole && sh.insole.f) {
    // nothing: the insole gets plating lines below
  }
}

// a door on the quarter with a step under it
function quarterDoor(M, sh, side, s, v0, v1, o = {}) {
  const F = sh.surf(side);
  const sm = s, vm = (v0 + v1) / 2;
  const h = (v1 - v0) * F.dU(sm, vm), w = o.w ?? h * 0.62;
  F.rect(sm, vm, w, h, { r: w * 0.2, w: 1 });
  F.rect(sm, vm, w * 0.86, h * 0.9, { r: w * 0.16, w: 0 });
  // hinges and handle
  const ds = F.dS(sm, vm);
  for (const t of [-0.3, 0.3]) F.rect(sm - (w * 0.5) / ds * side * 0 - w * 0.46 / ds, vm + t * h / F.dU(sm, vm), w * 0.08, h * 0.08, { w: 1 });
  F.rect(sm + w * 0.36 / ds, vm, w * 0.06, h * 0.16, { w: 1 });
  if (o.window) { const wy = vm + h * 0.22 / F.dU(sm, vm); F.rect(sm, wy, w * 0.55, h * 0.24, { r: w * 0.1, w: 1 }); F.glass(sm, wy, w * 0.5, h * 0.2); }
  // the step: a short ladder from the sole edge down to the frame, a tread at the top
  const p = F.P(sm, 0.0), n = F.N(sm, 0.05);
  const out = norm([n[0], n[1], 0]);
  const tw = clamp(w * 0.8, 0.3, 0.6);
  const gz = o.groundZ ?? 0;
  M.part('BOARDING STEP', () => {
    M.world(() => {
      const along = norm(cross([0, 0, 1], out));
      const c = add(p, mul(out, 0.14));
      const h = c[2] - gz;
      M.at(c[0], c[1], gz, () => M.rz(Math.atan2(out[1], out[0]) / D2R, () => {
        if (h > 0.35) K.ladder(M, { h, w: tw, gap: 0.3 });
        M.box([-0.14, -tw / 2 - 0.03, h - 0.04], [0.12, tw / 2 + 0.03, h]);
      }));
      void along;
      co(M, h > 0.35 ? 'BOARDING LADDER' : 'BOARDING STEP', 1, [c[0], c[1], gz + h * 0.5], 1.0);
    });
  });
  co(M, o.label || 'QUARTER DOOR', 1, F.P(sm, vm), 1.6);
}

// headlamps on the toe, pointing forward and a little out
function headlamps(M, sh, s, v, r) {
  M.part('HEADLAMP', () => {
    for (const side of [1, -1]) {
      const F = sh.surf(side);
      const p = F.P(s, v), n = F.N(s, v);
      const d = norm(add(mul(n, 0.6), [1, 0, 0.05]));
      M.world(() => M.along(sub(p, mul(n, r * 0.4)), add(p, d), () => {
        M.ry(90, () => { M.cyl(r * 0.75, -r * 0.2, r * 0.9); });
        const R = M.ry(90, () => M.cyl(r, r * 0.9, r * 1.25, { isect: false }));
        if (R.top.ok) { R.top.circle(0, 0, r * 0.72, { w: 1 }); R.top.hatch(K.circlePts ? K.circlePts(0, 0, r * 0.7, r * 0.7, 16) : [[-r * 0.5, -r * 0.5], [r * 0.5, -r * 0.5], [r * 0.5, r * 0.5], [-r * 0.5, r * 0.5]], { angle: 60, gap: 1.4, w: 0 }); }
      }));
      co(M, 'HEADLAMP', 2, add(p, mul(d, r * 1.2)), 1.3);
    }
  });
}

// exhaust pipe out of the back of the heel
function exhaust(M, p0, dir, r, L) {
  M.part('EXHAUST', () => {
    const d = norm(dir);
    const p1 = add(p0, mul(d, L * 0.5));
    const p2 = add(p1, [d[0] * L * 0.5, d[1] * L * 0.5, -L * 0.18]);
    M.world(() => {
      M.pipe([sub(p0, mul(d, r * 2)), p1, p2], r, { isect: true });
      M.along(p2, add(p2, sub(p2, p1)), () => M.ry(90, () => M.cone(r * 1.1, r * 1.5, 0, r * 3, { isect: false })));
      M.callout('EXHAUST', 1, p1, 1.1);
    });
  });
}

// lettering on the side: the number and a designation band
function sideNumber(M, sh, side, s, v, h, str) {
  const F = sh.surf(side);
  if (F.seen(s, v)) F.text(str, s, v, h);
}

// the cabin in the throat: a windshield across the opening near its front, a steering wheel
// behind it, seats in rows further back on pedestals down to the insole
function cabin(M, Ls, o) {
  const { L } = o, sT = Ls.sT;
  let sw = sT - 0.015;
  while (sw > 0.2 && Ls.yo(sw) < Ls.w(sw) * (o.wsOpen ?? 0.7)) sw -= 0.004;
  const xw = Ls.X(sw);
  const rimZ = (s) => Ls.zE(s);
  const floor = (s) => Ls.zb(s);
  M.part('WINDSHIELD', () => {
    const a = Ls.sect(sw, 0.97, 1), b = Ls.sect(sw, 0.97, -1);
    const h = o.glassH;
    windshield(M, a, b, h, { rake: 30, r: Math.max(0.018, h * 0.045) });
    co(M, 'WINDSHIELD', 1, [a[0] - h * 0.3, a[1] * 0.4, a[2] + h * 0.6], 1.8);
  });
  const n = o.seats, perRow = n === 1 ? 1 : 2, rows = Math.ceil(n / perRow);
  const sx = (x) => clamp((x - Ls.X(0)) / L, 0, 1);
  const xr0 = xw - 0.8;
  const pitch = 0.85;
  M.part('DRIVER SEAT', () => {
    for (let r = 0; r < rows; r++) {
      let x = xr0 - r * pitch;
      x = Math.max(x, Ls.X(0.08) + 0.3);
      const s = sx(x);
      const halfW = Math.max(0.2, Ls.yo(s) * 0.85);
      const sw2 = Math.min(0.5, halfW * 2 / perRow * 0.85);
      const zSeat = Math.max(floor(s) + 0.12, rimZ(s) - 0.45 - (o.sink ?? 0));
      for (let c = 0; c < perRow; c++) {
        const y = perRow === 1 ? 0 : (c - 0.5) * halfW;
        M.at(x, y, zSeat, () => seatUnit(M, { w: sw2, d: 0.46, h: 0.5, pedestal: Math.max(0.04, zSeat - floor(s) - 0.05) }));
      }
      if (r === 0) co(M, n > 2 ? 'PASSENGER SEATS' : 'DRIVER SEAT', n, [x - 0.2, 0, zSeat + 0.3], 1.4);
      if (r === 0) o.zSeat = zSeat;
    }
  });
  M.part('STEERING WHEEL', () => {
    const p = [xr0 + 0.45, 0, o.zSeat + 0.36];
    const sb = Math.min(0.95, sT + 0.05);
    const base = [Ls.X(sb) - p[0], 0, Ls.zb(sb) + Ls.hV(sb) * 0.4 - p[2]];
    M.at(p[0], p[1], p[2], () => steering(M, { r: 0.17, rake: 35, base }));
    co(M, 'STEERING WHEEL', 1, p, 1.1);
  });
  return { sw, xw };
}

// ------------------------------------------------------------------ objects
const BUILD = {};

// ---------------------------------------------------------------- stiletto pump
BUILD.pump = (M) => {
  const size = M.wpick([[3, 'car'], [2, 'coupe'], [1.4, 'coach']]);
  const L = size === 'car' ? M.r(2.8, 3.6) : size === 'coupe' ? M.r(4.2, 5.4) : M.r(7, 9);
  const hhK = M.r(0.3, 0.38);           // heel height / length
  const toe = M.wpick([[3, 'point'], [1, 'almond']]);
  const throat = M.wpick([[2, 'round'], [2, 'point'], [1, 'square']]);
  const sT = M.r(0.54, 0.6);
  const wK = M.r(0.135, 0.16);
  const seats = size === 'car' ? 1 : size === 'coupe' ? 2 : M.ri(4, 8);
  const lamps = M.chance(0.85);
  const ex = M.chance(0.8);
  const unit = String(M.ri(1, 99));
  const vw = viewSide(M, 20, 28);
  const hh = hhK * L;
  const wCurve = toe === 'point'
    ? [[0, 0], [0.012, 0.42], [0.04, 0.62], [0.1, 0.74], [0.24, 0.76], [0.42, 0.72], [0.6, 0.94], [0.7, 1], [0.8, 0.86], [0.88, 0.58], [0.95, 0.27], [1, 0]]
    : [[0, 0], [0.012, 0.42], [0.04, 0.62], [0.1, 0.74], [0.24, 0.76], [0.42, 0.72], [0.6, 0.94], [0.7, 1], [0.82, 0.9], [0.9, 0.7], [0.96, 0.42], [1, 0]];
  const P = {
    L,
    w: curve(sc(wCurve, wK * L)),
    sole: curve([[0, hh], [0.2, hh * 0.98], [0.3, hh * 0.86], [0.42, hh * 0.52], [0.53, hh * 0.18], [0.63, 0], [0.9, 0], [1, L * 0.018]]),
    tS: L * 0.012,
    sT, sB: sT * M.r(0.62, 0.75), throat, open: 0.93,
    hV: curve(sc([[0.45, 0.24], [0.55, 0.19], [0.65, 0.14], [0.75, 0.105], [0.85, 0.075], [0.93, 0.045], [0.98, 0.022], [1, 0.006]], L)),
    hC: null,
    bulge: 0.05, binding: L * 0.008, solePlan: L * 0.006, soleR: 0.2,
    partUpper: 'SHOE BODY',
  };
  const hvT = P.hV(sT);
  const cb = M.r(0.2, 0.25), cs = M.r(0.085, 0.11);
  P.hC = curve(sc([[0, cb], [0.04, cb * 0.98], [0.16, cb * 0.62], [0.28, cs], [sT * 0.8, cs * 1.05], [sT, hvT / L]], L));
  const maxW = wK * L, Hmax = hh + cb * L;
  const g = G.plan(M, { len: L * 1.02, wid: maxW * 2.1, hgt: Hmax, mass: L * L * 0.08, kinds: { trike: 4, wheels: 2, rails: 1, skis: 1, rotors: 1, balloons: 1, floats: 1, legs: 1, wings: 1, hover: 1, monowheel: 0.5, tracks: 0.6, ringwing: 0.5, sails: 0.6 } });
  let sh;
  M.at(0, 0, g.z, () => {
    sh = shoe(M, P);
    const { Ls } = sh;
    M.info.mass = sh.upper.bbox.slice();
    // ------------------------------------------- the stiletto heel: a strut to the frame
    M.part('HEEL STRUT', () => {
      const sc0 = 0.1, sc1 = 0.072;
      const rings = steps(0, 1, 14, false);
      const ax0 = 0.088 * L, ay0 = Ls.w(0.1) * 0.86, r1 = L * 0.016;
      const fn = (t, k) => {
        const a = 2 * Math.PI * k;
        const ease = Math.pow(1 - t, 2.4);
        const ax = r1 + (ax0 - r1) * ease, ay = r1 * 0.95 + (ay0 - r1) * ease;
        const cx = mix(Ls.X(sc0), Ls.X(sc1), Math.pow(t, 0.7));
        const x = cx + Math.cos(a) * ax;
        const sx = clamp((x - Ls.X(0)) / L, 0, 1);
        const zTop = Ls.sole(sx) + L * 0.002;
        return [x, Math.sin(a) * ay, mix(zTop, L * 0.014, t)];
      };
      const S = mesh(M, [{ fn, S: rings, U: steps(0, 1, 20, false).slice(0, -1), wrapU: true }], { closed: true, g: 5 });
      // top lift
      M.at(Ls.X(sc1), 0, 0, () => { const T = M.cyl(r1 * 1.05, 0, L * 0.014, { seg: 16 }); if (T.lat && M.decorOn) T.lat.hatch(0, 360, 0, 1, { gap: 1.2 }); });
      const hs = new Surf(M, fn, { inside: (t) => [mix(Ls.X(sc0), Ls.X(sc1), t), 0, mix(hh, 0, t)] });
      if (M.decorOn) {
        hs.shade({ gap: 2.0, u: [0, 1], s: [0.02, 0.98], k: 40, bias: 0.1 });
        for (const t of [0.25, 0.55, 0.8]) hs.runU(t, 0, 1, { w: 1, k: 60 });
      }
      co(M, 'HEEL STRUT', 1, fn(0.5, vw.side > 0 ? 0.25 : 0.75), 2.6);
      void S;
    });
    // ------------------------------------------- dress the upper
    const vampSeam = [];
    for (let i = 0; i <= 10; i++) { const v = i / 10; vampSeam.push([sT - 0.02 + 0.06 * (1 - v) * 0, v]); }
    dressUpper(M, sh, {
      weltV: 0.035,
      butts: [0.3, 0.72, 0.86].filter((s) => s < 0.95),
      seams: [{ pts: steps(0, 1, 12, false).map((v) => [0.47 + 0.05 * v * v, 0.04 + v * 0.89]), rivets: true }],
      lseam: null,
    });
    dressInside(M, sh);
    // the heel cup band (the counter) and a toe cap line
    for (const side of [1, -1]) {
      const F = sh.surf(side);
      if (!M.decorOn) break;
      F.runS(0.5, 0.0, 0.16, { w: 1 });
      F.rowS(0.47, 0.0, 0.15, { pitch: 6, r: 0.7 });
    }
    // ------------------------------------------- the cabin inside the throat
    cabin(M, Ls, { seats, L, glassH: Math.min(0.5, L * 0.11) });
    // ------------------------------------------- lamps, number, door, exhaust
    if (lamps) headlamps(M, sh, 0.86, 0.42, Math.max(0.06, L * 0.022));
    const F = sh.surf(vw.side);
    sideNumber(M, sh, vw.side, 0.72, 0.42, Ls.hV(0.72) * 0.32, unit);
    if (size !== 'car') quarterDoor(M, sh, vw.side, 0.3, 0.12, 0.85, { label: 'QUARTER DOOR', w: Math.min(0.7, L * 0.09), groundZ: M.W([0, 0, 0])[2] });
    if (ex) exhaust(M, Ls.sect(0.0, 0.35, 1).map((x, i) => (i === 1 ? 0 : x)), [-1, 0, -0.1], Math.max(0.03, L * 0.012), L * 0.12);
    co(M, 'TOE CAP', 1, Ls.sect(0.9, 0.7, vw.side), 1.5);
    co(M, 'HEEL COUNTER', 1, Ls.sect(0.06, 0.5, vw.side), 1.4);
    co(M, 'THROAT OPENING', 1, Ls.sect(0.35, 1, -vw.side), 0.9);
    co(M, 'SOLE PLATE', 1, [Ls.X(0.78), vw.side * Ls.w(0.78), Ls.sole(0.78) + Ls.tS(0.78) * 0.5], 1.0);
    void F;
  });
  const gi = g.build();
  const crew = seats;
  const place = M.pick(g.places);
  const klass = pickKlass(M, [`${place} STILETTO PUMP ${g.form}`, `${g.adj} STILETTO PUMP`, `${place} HIGH-HEEL ${g.form}`, `${g.adj} HIGH-HEELED SHOE`, `${place} PUMP ${g.form}`]);
  const briefs = crew === 1
    ? [`Carries one driver to evening functions and parks in 4 meters.`, `Takes one passenger to the theater and waits outside.`, `${cap(g.goes)} with one driver seated in the heel.`]
    : [`Carries ${word(crew)} guests to the gala and back by midnight.`, `${cap(g.goes)} with ${word(crew)} seated under the windshield.`, `Takes ${word(crew)} dancers from the station to the ballroom.`];
  return {
    klass, family: g.family, float: g.float,
    brief: fit(M.pick(briefs)),
    specs: [['HEEL HEIGHT', `${Math.round(hh * 1000)} MM`], ...gi.specs, ['CREW', String(crew)], ['SIZE', `EU ${M.ri(36, 42)} X ${Math.round(L / 0.26)}`]].slice(0, 4),
    figure: gi.figure,
  };
};

function pickKlass(M, list) { const ok = list.filter((k) => k.length <= 34); const k = M.pick(list); return ok.length ? (ok.includes(k) ? k : ok[0]) : k.slice(0, 34); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function fit(s) { return fitBrief(s); }

// a heel block or wedge under the heel: rounded section, s0..s1, height from the ground to the sole
function heelBlock(M, Ls, o) {
  const s0 = o.s0 ?? 0, s1 = o.s1 ?? 0.26, inset = o.inset ?? 0.96;
  return M.part(o.part || 'HEEL BLOCK', () => {
    const fn = (s, k) => {
      const ws = Math.max(Ls.w(s) * inset, 1e-5), z1 = Ls.sole(s) + 0.002, a = k * 2 * Math.PI;
      const c = Math.cos(a), si = Math.sin(a);
      const y = ws * Math.sign(c) * Math.pow(Math.abs(c), 0.5);
      const zz = (z1 / 2) + (z1 / 2) * Math.sign(si) * Math.pow(Math.abs(si), 0.3);
      return [Ls.X(s) + (o.forward ?? 0) * (1 - (zz / z1)), y, zz];
    };
    const S = steps(s0, s1, 12);
    const sol = mesh(M, [{ fn, S, U: steps(0, 1, 16, false).slice(0, -1), wrapU: true, g: 6, caps: [] }], { closed: true });
    // the open end at s1: a flat breast face
    const breast = [];
    for (let k = 0; k < 16; k++) breast.push(fn(s1, k / 16));
    M.plate(breast, { isect: false });
    const F = new Surf(M, fn, { inside: (s) => [Ls.X(s), 0, Ls.sole(s) / 2] });
    if (M.decorOn) {
      const n = o.lifts ?? 3;
      for (let i = 1; i <= n; i++) for (const k0 of [0, 0.5]) F.runS(0.25 + k0 + 0 * i, s0, s1, { w: 0 });
      for (let i = 1; i < n + 1; i++) {
        const k = i / (n + 1);
        // lift lines: rings at constant height on both visible sides
        F.runS(0.75 - k * 0.5 + 0, s0, s1, { w: 0 });
      }
      F.shade({ gap: 2.2, s: [s0, s1], u: [0, 1], k: 40 });
    }
    return { sol, F };
  });
}

// lacing between two eyelet rows (world points): eyelets as rings, laces crossing as lines
function lacing(M, left, right, o = {}) {
  M.part('LACING', () => {
    const r = o.r ?? 0.03;
    for (const p of [...left, ...right]) {
      M.world(() => M.at(p.p[0], p.p[1], p.p[2], () => M.along([0, 0, 0], p.n, () => M.ry(90, () => M.cyl(r, -r * 0.3, r * 0.35, { isect: false, seg: 12 })))));
    }
    const lift = (q, k) => add(q.p, mul(q.n, r * k));
    const pts = [];
    for (let i = 0; i + 1 < left.length; i++) {
      M.world(() => M.line([lift(left[i], 0.5), lift(right[i + 1], 0.9)], { w: 1, pass: 2 }));
      M.world(() => M.line([lift(right[i], 0.5), lift(left[i + 1], 0.9)], { w: 1, pass: 2 }));
    }
    // a bow at the top
    const a = left[left.length - 1], b = right[right.length - 1];
    if (a && b) {
      const c = lerp(lift(a, 1), lift(b, 1), 0.5);
      const up = [0, 0, 1];
      for (const sg of [1, -1]) {
        const loop = [];
        for (let i = 0; i <= 10; i++) { const t = i / 10 * Math.PI * 2; loop.push(add(c, add(mul(norm(sub(b.p, a.p)), sg * (0.5 - 0.5 * Math.cos(t)) * (o.bow ?? 0.12)), mul(up, Math.sin(t) * (o.bow ?? 0.12) * 0.35)))); }
        M.world(() => M.line(loop, { w: 1 }));
        M.world(() => M.line([c, add(c, add(mul(norm(sub(b.p, a.p)), sg * (o.bow ?? 0.12) * 0.5), [0, 0, -(o.bow ?? 0.12) * 1.6]))], { w: 1 }));
      }
    }
    void pts;
    co(M, 'LACING', 1, lift(left[Math.floor(left.length / 2)], 1), 1.6);
    co(M, 'EYELET', left.length * 2, lift(left[1] || left[0], 1), 0.8);
  });
}

// ---------------------------------------------------------------- laced work boot
BUILD.boot = (M) => {
  const size = M.wpick([[2, 'small'], [2, 'mid'], [1.5, 'big']]);
  const L = size === 'small' ? M.r(2.6, 3.4) : size === 'mid' ? M.r(4, 5.5) : M.r(6.5, 8.5);
  const wK = M.r(0.16, 0.18);
  const shH = M.r(0.5, 0.66);         // shaft top above the ground / L
  const capToe = M.chance(0.7);
  const hooks = M.chance(0.5);
  const tread = M.wpick([[2, 'lug'], [1, 'wedge']]);
  const nE = size === 'small' ? 5 : 6;
  const lamps = M.chance(0.85), ex = M.chance(0.75);
  const unit = String(M.ri(1, 99)).padStart(2, '0');
  const vw = viewSide(M, 20, 28, 38, 52, 0.9);
  const hb = tread === 'wedge' ? 0.012 * L : M.r(0.04, 0.06) * L;
  const tS = M.r(0.035, 0.05) * L;
  const sT = M.r(0.42, 0.47);
  const P = {
    L, w: curve(sc([[0, 0], [0.012, 0.5], [0.04, 0.7], [0.1, 0.8], [0.25, 0.8], [0.42, 0.76], [0.6, 0.95], [0.7, 1], [0.82, 0.96], [0.9, 0.84], [0.96, 0.58], [0.99, 0.3], [1, 0]], wK * L)),
    sole: tread === 'wedge' ? curve([[0, hb], [0.6, 0], [0.92, 0], [1, 0.03 * L]]) : curve([[0, hb], [0.26, hb], [0.29, hb * 0.6], [0.4, hb * 0.35], [0.55, 0], [0.9, 0], [1, 0.035 * L]]),
    tS, sT, sB: sT * 0.6, throat: 'round', open: 0.88,
    hV: curve(sc([[0.38, 0.33], [0.48, 0.27], [0.6, 0.205], [0.7, 0.17], [0.8, 0.145], [0.88, 0.12], [0.95, 0.085], [0.99, 0.04], [1, 0.012]], L)),
    hC: null, bulge: 0.07, solePlan: L * 0.012, soleR: 0.3, partUpper: 'BOOT UPPER',
  };
  const hvT = P.hV(sT);
  P.hC = curve(sc([[0, 0.2], [0.15, 0.19], [0.3, 0.21], [sT, hvT / L]], L));
  const zb0 = P.sole(0.15) + tS;
  P.shaft = { h: shH * L, xc: -L / 2 + L * 0.2, ax: L * 0.2, ay: wK * L * 0.95, rake: L * 0.03, tilt: L * 0.03, flare: 1.04, k: 2.6 };
  P.binding = L * 0.014;
  P.nt = 12;
  const H = shH * L;
  const g = G.plan(M, { len: L * 1.03, wid: wK * L * 2.2, hgt: H, mass: L * L * L * 0.03, kinds: { wheels: 2, tracks: 2, trike: 1, legs: 1.5, skis: 1.2, rails: 1, rotors: 1, balloons: 1, floats: 1, hover: 1, paddles: 0.7, wings: 0.6, rockets: 0.5 } });
  let sh;
  M.at(0, 0, g.z, () => {
    sh = shoe(M, P);
    const { Ls } = sh;
    M.info.mass = sh.upper.bbox.slice();
    if (tread !== 'wedge') heelBlock(M, Ls, { s0: 0, s1: 0.27, lifts: 3 });
    // tongue: a rounded flap standing in the lace gap above the shaft top
    const sf = sh.shaftFn;
    M.part('TONGUE', () => {
      const tw = 0.05;
      const fn = (t, th) => {
        const p = sf(Math.min(t, 1), th), q = sf(Math.min(t, 1), 0.5);
        const ax = sub(p, [P.shaft.xc + P.shaft.rake * t, 0, p[2]]);
        const inP = sub(p, mul(norm([ax[0], ax[1], 0]), L * 0.012));
        const over = Math.max(0, t - 1) * H * 0.5;
        const k = Math.abs(th - 0.5) / tw;
        return [inP[0] - over * 0.25, inP[1], inP[2] + over * Math.sqrt(Math.max(0, 1 - k * k * k * k))];
        void q;
      };
      mesh(M, [{ fn, S: steps(0.55, 1.12, 8, false), U: steps(0.5 - tw, 0.5 + tw, 6, false) }], { two: true, g: 7 });
      co(M, 'TONGUE', 1, fn(1.06, 0.5), 1.2);
    });
    // pull tab at the back
    M.part('PULL TAB', () => {
      const p = sf(1, 0), q = sf(0.86, 0);
      const up = [0, 0, L * 0.06];
      M.pipe([q, add(p, [0, 0, L * 0.01]), add(p, up), add(add(p, up), [L * 0.025, 0, 0]), add(p, [L * 0.025, 0, L * 0.01])], L * 0.006, { isect: false });
      co(M, 'PULL TAB', 1, add(p, up), 1.0);
    });
    // lacing: eyelets down the front of the shaft and onto the instep
    const SF = sh.shaft;
    const left = [], right = [];
    const dth = 0.032;
    for (let i = 0; i < nE; i++) {
      const t = 0.08 + 0.84 * i / (nE - 1);
      left.push({ p: SF.P(t, 0.5 - dth), n: SF.N(t, 0.5 - dth) });
      right.push({ p: SF.P(t, 0.5 + dth), n: SF.N(t, 0.5 + dth) });
    }
    // two more on the instep
    for (const s of [sT + 0.09, sT + 0.045]) {
      left.unshift({ p: sh.side.P(s, 0.9), n: sh.side.N(s, 0.9) });
      right.unshift({ p: sh.sideR.P(s, 0.9), n: sh.sideR.N(s, 0.9) });
    }
    lacing(M, left, right, { r: L * 0.009, bow: L * 0.04 });
    if (M.decorOn) {
      // the lace stays: facings either side of the gap, stitched
      for (const d of [-1, 1]) {
        SF.runS(0.5 + d * dth * 1.9, 0, 1, { w: 1 });
        SF.rowS(0.5 + d * dth * 1.7, 0.02, 0.98, { kind: 'stitch', pitch: 4 });
        SF.runS(0.5 + d * dth * 0.55, 0.02, 1, { w: 1 });
      }
      // collar padding seam and quarter seams on the shaft
      SF.runU(0.86, 0, 1, { w: 1, k: 80 });
      SF.rowU(0.83, 0, 1, { kind: 'stitch', pitch: 4, k: 80 });
      SF.runU(0.35, 0.15, 0.85, { w: 0, k: 80 });
      SF.runS(0, 0.0, 1, { w: 1 });
      SF.rowS(0.012, 0.02, 0.98, { pitch: 6, r: 0.7 });
      SF.rowS(0.988, 0.02, 0.98, { pitch: 6, r: 0.7 });
      SF.shade({ gap: 2.3, s: [0, 1], u: [0, 1], k: 160 });
      // speed hooks
    }
    if (hooks) M.part('LACE HOOK', () => { for (const q of [left, right]) for (const e of q.slice(-2)) M.world(() => M.at(e.p[0], e.p[1], e.p[2], () => M.along([0, 0, 0], e.n, () => M.ry(90, () => M.torus(L * 0.008, L * 0.0025, { isect: false }))))); });
    // seams on the foot: toe cap, vamp, counter
    const seams = [];
    if (capToe) seams.push({ pts: steps(0, 1, 14, false).map((v) => [0.8 + 0.06 * Math.pow(v, 1.5), 0.02 + v * 0.97]), stitch: true, rivets: true });
    seams.push({ pts: steps(0, 1, 12, false).map((v) => [sT + 0.05 - 0.07 * (1 - v) * (1 - v), 0.03 + v * 0.86]), rivets: true });
    seams.push({ pts: steps(0, 1, 12, false).map((v) => [0.22 - 0.1 * v * v, 0.03 + v * 0.9]), stitch: true });
    dressUpper(M, sh, { weltV: 0.06, butts: [0.66], seams });
    dressInside(M, sh);
    if (M.decorOn && sh.soleSurf) {
      // lugs: notches along the sole edge
      const SS = sh.soleSurf;
      for (let i = 0; i < 46; i++) { const s = 0.02 + 0.96 * i / 45; for (const k of [0.62, 0.88]) SS.runU(s, k - 0.06, k + 0.06, { w: 1, k: 4 }); }
      SS.runS(0.75, 0, 1, { w: 1 }); SS.runS(0.25, 0, 1, { w: 1 });
    }
    // ------------------------------------------- the cab in the shaft: windows round the top band
    const SFc = sh.shaft;
    M.part('CAB WINDOW', () => {
      const n = size === 'small' ? 4 : 6;
      for (let i = 0; i < n; i++) {
        const th = 0.12 + 0.76 * i / (n - 1);
        if (Math.abs(th - 0.5) < 0.09) continue;
        const ww = L * 0.07, hh = L * 0.06;
        if (SFc.seen(0.68, th)) SFc.window(0.68, th, ww, hh, { mullion: size !== 'small' });
      }
      co(M, 'CAB WINDOW', n, SFc.P(0.68, vw.side > 0 ? 0.25 : 0.75), 1.5);
    });
    // a roof hatch and a seat in the collar: the driver sits in the shaft
    M.part('DRIVER SEAT', () => {
      const z = Math.max(zb0 + 0.15, sf(1, 0.5)[2] - 0.72);
      const x = P.shaft.xc + P.shaft.rake * 0.8;
      M.at(x - L * 0.03, 0, z, () => seatUnit(M, { w: Math.min(0.55, P.shaft.ay * 1.2), d: 0.45, h: 0.55, pedestal: z - zb0 - 0.05 }));
      M.at(x - L * 0.03 + 0.42, 0, z + 0.4, () => steering(M, { r: 0.16, rake: 40, base: [0.2, 0, -0.45] }));
      co(M, 'DRIVER SEAT', 1, [x - L * 0.03, 0, z + 0.25], 1.0);
    });
    if (lamps) headlamps(M, sh, 0.88, 0.45, Math.max(0.07, L * 0.025));
    sideNumber(M, sh, vw.side, 0.7, 0.5, Ls.hV(0.7) * 0.3, unit);
    if (size !== 'small') quarterDoor(M, sh, vw.side, 0.3, 0.1, 0.82, { label: 'QUARTER DOOR', w: Math.min(0.75, L * 0.08), window: true, groundZ: M.W([0, 0, 0])[2] });
    if (ex) exhaust(M, add(Ls.sect(0.0, 0.25, 1), [0, -Ls.sect(0.0, 0.25, 1)[1], 0]), [-1, 0, 0.6], Math.max(0.035, L * 0.012), L * 0.14);
    co(M, capToe ? 'STEEL TOE CAP' : 'TOE BOX', 1, Ls.sect(0.9, 0.6, vw.side), 1.7);
    co(M, 'LUG SOLE', 1, [Ls.X(0.75), vw.side * Ls.w(0.75), Ls.sole(0.75) + tS * 0.5], 1.2);
    co(M, 'HEEL COUNTER', 1, Ls.sect(0.08, 0.5, vw.side), 1.0);
    co(M, 'SHAFT', 1, sh.shaft.P(0.45, vw.side > 0 ? 0.3 : 0.7), 1.3);
  });
  const gi = g.build();
  const crew = size === 'small' ? 1 : size === 'mid' ? 2 : M.ri(3, 5);
  const place = M.pick(g.places);
  const what = M.pick(['WORK BOOT', 'LACED BOOT', 'ANKLE BOOT']);
  const klass = pickKlass(M, [`${place} ${what} ${g.form}`, `${g.adj} ${what}`, `${what} ${g.form}`]);
  const briefs = [
    `Carries a road crew of ${word(crew)} to the site and kicks the gate open.`,
    `${cap(g.goes)} with ${word(crew)} in the cab at the top of the shaft.`,
    `Takes ${word(crew)} surveyors over rough ground with the laces done up.`,
    `Delivers ${word(crew)} ${crew === 1 ? 'foreman' : 'foremen'} to the quarry by 7 in the morning.`,
  ];
  return {
    klass, family: g.family, float: g.float,
    brief: fit(M.pick(briefs)),
    specs: [...gi.specs, ['CREW', String(crew)], ['EYELETS', String(left_n(nE))], ['SIZE', `UK ${M.ri(6, 12)} X ${Math.round(L / 0.28)}`]].slice(0, 4),
    figure: gi.figure,
  };
};
function left_n(n) { return (n + 2) * 2; }

// ---------------------------------------------------------------- wellington or riding boot
BUILD.wellington = (M) => {
  const riding = M.chance(0.35);
  const size = M.wpick([[1.4, 'hut'], [2, 'house']]);
  const L = size === 'hut' ? M.r(2.8, 3.8) : M.r(4.4, 6.2);
  const wK = riding ? M.r(0.14, 0.155) : M.r(0.17, 0.19);
  const Hk = riding ? M.r(1.45, 1.65) : M.r(1.2, 1.42);
  const H = Hk * L;
  const unit = String(M.ri(1, 99)).padStart(2, '0');
  const vw = viewSide(M, 16, 24, 58, 72, 0.75);
  const hb = (riding ? M.r(0.05, 0.07) : M.r(0.025, 0.035)) * L;
  const tS = (riding ? 0.022 : 0.04) * L;
  const sT = M.r(0.4, 0.45);
  const lamps = M.chance(0.85), ex = M.chance(0.7), mast = M.chance(0.6), spur = riding && M.chance(0.8);
  const P = {
    L, w: curve(sc(riding
      ? [[0, 0], [0.012, 0.5], [0.04, 0.7], [0.1, 0.8], [0.25, 0.8], [0.42, 0.74], [0.6, 0.94], [0.7, 1], [0.82, 0.92], [0.9, 0.74], [0.96, 0.46], [1, 0]]
      : [[0, 0], [0.012, 0.52], [0.04, 0.72], [0.1, 0.82], [0.25, 0.82], [0.42, 0.8], [0.6, 0.96], [0.7, 1], [0.82, 0.97], [0.9, 0.86], [0.96, 0.62], [0.99, 0.32], [1, 0]], wK * L)),
    sole: curve([[0, hb], [0.25, hb], [0.28, hb * 0.6], [0.42, hb * 0.3], [0.55, 0], [0.9, 0], [1, 0.03 * L]]),
    tS, sT, sB: sT * 0.6, throat: 'round', open: 0.88,
    hV: curve(sc(riding ? [[0.38, 0.34], [0.5, 0.25], [0.62, 0.18], [0.75, 0.13], [0.86, 0.1], [0.95, 0.065], [1, 0.012]] : [[0.38, 0.34], [0.48, 0.28], [0.6, 0.215], [0.7, 0.18], [0.8, 0.155], [0.88, 0.13], [0.95, 0.095], [0.99, 0.045], [1, 0.014]], L)),
    hC: null, bulge: riding ? 0.04 : 0.08, solePlan: L * 0.01, soleR: 0.3, partUpper: riding ? 'RIDING BOOT' : 'WELLINGTON BOOT',
  };
  P.hC = curve(sc([[0, 0.22], [0.15, 0.21], [0.3, 0.23], [sT, P.hV(sT) / L]], L));
  P.shaft = riding
    ? { h: H, xc: -L / 2 + L * 0.2, ax: L * 0.165, ay: wK * L * 0.92, rake: L * 0.05, tilt: -L * 0.09, flare: 1.08, waist: 0.1, k: 2.4 }
    : { h: H, xc: -L / 2 + L * 0.22, ax: L * 0.2, ay: wK * L * 0.96, rake: L * 0.02, tilt: L * 0.04, flare: 1.14, waist: 0.05, k: 2.8 };
  P.binding = L * 0.012; P.nt = 18;
  const g = G.plan(M, { len: L * 1.03, wid: wK * L * 2.3, hgt: H * 1.05, mass: L * L * H * 0.05, kinds: { wheels: 2, tracks: 2, legs: 1.5, rails: 1.2, skis: 1, floats: 1, paddles: 1, rotors: 1, balloons: 1, hover: 0.8, rockets: 0.6, monowheel: 0.3 } });
  const floors = size === 'hut' ? 2 : clamp(Math.floor((H - 1.2) / 2.3), 2, 4);
  let sh, crew = 0;
  M.at(0, 0, g.z, () => {
    sh = shoe(M, P);
    const { Ls } = sh, SF = sh.shaft, sf = sh.shaftFn;
    M.info.mass = sh.upper.bbox.slice();
    heelBlock(M, Ls, { s0: 0, s1: 0.26, lifts: riding ? 4 : 2 });
    // foxing band and toe bumper
    dressUpper(M, sh, { weltV: 0.2, topStitch: false, butts: [0.62, 0.8], seams: [{ pts: steps(0, 1, 10, false).map((v) => [sT + 0.03 + 0.04 * v, 0.2 + v * 0.75]), rivets: true }] });
    if (M.decorOn) {
      for (const side of [1, -1]) { const F = sh.surf(side); F.runS(0.16, 0.0, 1, { w: 1 }); F.runS(0.22, 0.0, 1, { w: 1 }); F.rowS(0.19, 0.01, 0.99, { pitch: 6, r: 0.7 }); }
      // the shaft: rings of plate seams per floor, meridian seams, shading
      for (let f = 1; f <= floors; f++) SF.runU(f / (floors + 0.6), 0, 1, { w: 1, k: 90 });
      for (let i = 0; i < 12; i++) { const th = i / 12; SF.runS(th, 0.03, 0.98, { w: i % 3 ? 0 : 1 }); }
      for (let f = 1; f <= floors; f++) SF.rowU(f / (floors + 0.6) + 0.012, 0, 1, { pitch: 7, r: 0.7, k: 90 });
      SF.shade({ gap: 2.2, s: [0, 1], u: [0, 1], k: 180 });
      SF.runU(0.92, 0, 1, { w: 1, k: 90 });
    }
    dressInside(M, sh);
    // floors of portholes
    M.part('PORTHOLE', () => {
      let n = 0;
      for (let f = 0; f < floors; f++) {
        const t = (f + 0.55) / (floors + 0.6);
        const nP = size === 'hut' ? 5 : 7;
        for (let i = 0; i < nP; i++) {
          const th = (i + 0.5) / nP;
          if (SF.seen(t, th)) { SF.port(t, th, Math.min(L * 0.05, H / floors * 0.18)); n++; }
        }
      }
      co(M, 'PORTHOLE', floors * (size === 'hut' ? 5 : 7), SF.P((0.55) / (floors + 0.6), vw.side > 0 ? 0.3 : 0.7), 1.6);
    });
    // the bridge: windows round the top band, a deck inside the collar with a railing
    M.part('BRIDGE', () => {
      const t = 0.955 - 0.6 / (floors + 0.6) * 0.5;
      for (let i = 0; i < 8; i++) { const th = (i + 0.5) / 8; if (SF.seen(t, th)) SF.window(t, th, L * 0.08, H * 0.045, { mullion: true }); }
      const top = [];
      for (let i = 0; i < 32; i++) top.push(sf(0.97, i / 32));
      const zD = Math.min(...top.map((p) => p[2])) - 0.05;
      const deck = top.map((p) => [P.shaft.xc + P.shaft.rake + (p[0] - P.shaft.xc - P.shaft.rake) * 0.97, p[1] * 0.97, zD]);
      const D = M.plate(deck, { isect: false });
      const f = D.f('face');
      if (f.on) { f.hatch(f.poly, { angle: 0, gap: 2.6, w: 0 }); f.hatch(f.poly, { angle: 90, gap: 2.6, w: 0 }); }
      const rail = [];
      for (let i = 0; i <= 32; i++) { const p = sf(1, (i % 32) / 32); rail.push([p[0], p[1], p[2] + P.binding]); }
      K.railing(M, rail, { h: 0.9, posts: 2.6, r: 0.025 });
      co(M, 'BRIDGE DECK', 1, sf(1, vw.side > 0 ? 0.3 : 0.7), 1.8);
      co(M, 'BRIDGE WINDOW', 8, SF.P(t, vw.side > 0 ? 0.32 : 0.68), 1.4);
      if (mast) {
        const c = [P.shaft.xc + P.shaft.rake - P.shaft.ax * 0.4, 0, zD];
        M.at(c[0], c[1], c[2], () => { M.cyl(0.08, 0, 2.6); M.at(0, 0, 2.6, () => K.lamp(M, { r: 0.1 })); M.at(0, 0, 2.0, () => K.radar(M, { len: 1.1 })); K.whip(M, { h: 4, lean: 10 }); });
        co(M, 'SIGNAL MAST', 1, add(c, [0, 0, 1.6]), 0.9);
      }
    });
    // the ladder up the back
    M.part('ACCESS LADDER', () => {
      let back = Infinity;
      for (let k = 0; k <= 16; k++) back = Math.min(back, sf(k / 16, 0)[0]);
      for (let k = 0; k <= 10; k++) back = Math.min(back, Ls.sect(0, k / 10, 1)[0]);
      const x = back - 0.35, zt = sf(1, 0)[2] + 0.9;
      M.at(x, 0, 0, () => K.ladder(M, { h: zt, w: 0.5, gap: 0.3 }));
      for (let k = 1; k <= floors + 1; k++) {
        const t = Math.min(1, k / (floors + 0.6)), p = sf(t, 0);
        M.tube([x, -0.2, p[2]], [p[0] + 0.05, -0.2, p[2]], 0.03, { isect: false });
        M.tube([x, 0.2, p[2]], [p[0] + 0.05, 0.2, p[2]], 0.03, { isect: false });
      }
      co(M, 'ACCESS LADDER', 1, [x, 0, zt * 0.55], 1.5);
    });
    // a strap and buckle at the top of the seen side
    M.part('SIDE BUCKLE', () => {
      const th = vw.side > 0 ? 0.25 : 0.75;
      if (M.decorOn) { SF.rect(0.9, th, L * 0.05, H * 0.1, { r: L * 0.01, w: 1 }); SF.rect(0.86, th, L * 0.06, H * 0.035, { w: 1 }); SF.rect(0.86, th, L * 0.04, H * 0.02, { w: 1 }); }
      co(M, 'SIDE BUCKLE', 1, SF.P(0.86, th), 0.8);
    });
    if (spur) {
      M.part('SPUR', () => {
        const p = Ls.sect(0.0, 0.32, 1);
        const c = [p[0] - L * 0.07, 0, p[2] - L * 0.01];
        M.pipe([Ls.sect(0.06, 0.3, 1), [p[0] - L * 0.012, 0, p[2]], Ls.sect(0.06, 0.3, -1)], L * 0.006, { isect: false });
        M.tube([p[0] - L * 0.012, 0, p[2]], c, L * 0.006, { isect: false });
        M.at(c[0], c[1], c[2], () => { M.rx(90, () => M.cyl(L * 0.025, -L * 0.003, L * 0.003, { isect: false })); });
        co(M, 'SPUR', 1, c, 1.3);
      });
    }
    if (lamps) headlamps(M, sh, 0.9, 0.5, Math.max(0.08, L * 0.025));
    sideNumber(M, sh, vw.side, 0.72, 0.55, Ls.hV(0.72) * 0.3, unit);
    quarterDoor(M, sh, vw.side, 0.28, 0.24, 0.9, { label: 'QUARTER DOOR', w: Math.min(0.85, L * 0.12), window: true, groundZ: M.W([0, 0, 0])[2] });
    if (ex) exhaust(M, add(Ls.sect(0.0, 0.2, 1), [0, -Ls.sect(0.0, 0.2, 1)[1], 0]), [-1, vw.side * 0.3, 0.4], Math.max(0.05, L * 0.014), L * 0.13);
    co(M, riding ? 'SHAFT' : 'BOOT SHAFT', 1, SF.P(0.4, vw.side > 0 ? 0.25 : 0.75), 2);
    co(M, 'TOE BUMPER', 1, Ls.sect(0.92, 0.25, vw.side), 1.2);
    co(M, 'TREAD SOLE', 1, [Ls.X(0.75), vw.side * Ls.w(0.75), Ls.sole(0.75) + tS * 0.5], 1.0);
    co(M, 'HEEL', 1, [Ls.X(0.15), vw.side * Ls.w(0.15) * 0.9, Ls.sole(0.15) * 0.5], 0.9);
    crew = floors + M.ri(1, 3);
  });
  const gi = g.build();
  const place = M.pick(g.places);
  const what = riding ? 'RIDING BOOT' : M.pick(['WELLINGTON BOOT', 'RUBBER BOOT', 'WELLINGTON']);
  const klass = pickKlass(M, [`${place} ${what} ${g.form}`, `${g.adj} ${what}`, `${what} ${g.form}`]);
  const briefs = riding
    ? [`Carries the hunt master and ${word(crew - 1)} grooms across ${floors} counties.`, `${cap(g.goes)} with ${word(crew)} riders on ${word(floors)} floors.`, `Follows the steeplechase with ${word(crew)} stewards in the shaft.`]
    : [`Houses ${word(crew)} flood wardens on ${word(floors)} floors and wades the levels.`, `${cap(g.goes)} with ${word(crew)} crew on ${word(floors)} floors.`, `Takes ${word(crew)} marsh surveyors out at low water and back by dark.`, `Keeps ${word(crew)} lock keepers dry for 14 days at a time.`];
  return {
    klass, family: g.family, float: g.float,
    brief: fit(M.pick(briefs)),
    specs: [...gi.specs, ['CREW', String(crew)], ['FLOORS', String(floors)], ['SHAFT', `${Math.round(H * 1000)} MM`]].slice(0, 4),
    figure: gi.figure,
  };
};

// a small deckhouse standing on a level floor: box with windows, a roof, a door
function deckhouse(M, o) {
  const { x0, x1, w, z0, h } = o;
  return M.part('WHEELHOUSE', () => {
    const B = M.box([x0, -w / 2, z0], [x1, w / 2, z0 + h]);
    for (const k of ['+x', '-x', '+y', '-y']) {
      const f = B.f(k);
      if (!f.on) continue;
      const n = Math.max(1, Math.round(f.w / (h * 0.75)));
      const g = f.grid(n, 2, { gap: 2.2, ys: [0, 0.45, 1] });
      for (const r of g) K.fill(f, r, r.j === 1 ? 'xWindow' : (k === '+y' || k === '-y') && r.i === 0 ? 'hatch' : 'corrugated');
    }
    const R = M.box([x0 - h * 0.12, -w / 2 - h * 0.12, z0 + h], [x1 + h * 0.12, w / 2 + h * 0.12, z0 + h * 1.08]);
    const t = R.f('+z');
    if (t.on) K.plain(t, [-t.w / 2 + t.mOf(2), -t.h / 2 + t.mOf(2), t.w / 2 - t.mOf(2), t.h / 2 - t.mOf(2)], { shade: false });
    if (o.stack) M.at(x0 + (x1 - x0) * 0.25, w * 0.15, z0 + h * 1.08, () => K.stack(M, { r: Math.min(0.25, w * 0.1), h: h * 0.9 }));
    co(M, 'WHEELHOUSE', 1, [x1, 0, z0 + h * 0.7], 1.7);
    if (o.stack) co(M, 'STOVE CHIMNEY', 1, [x0 + (x1 - x0) * 0.25, w * 0.15, z0 + h * 1.6], 1.0);
    return B;
  });
}

// ---------------------------------------------------------------- wooden clog
BUILD.clog = (M) => {
  const size = M.wpick([[2, 'small'], [2, 'barge'], [1, 'big']]);
  const L = size === 'small' ? M.r(2.6, 3.4) : size === 'barge' ? M.r(4.5, 6) : M.r(7, 9.5);
  const wK = M.r(0.19, 0.22);
  const upturn = M.r(0.11, 0.17);
  const sT = M.r(0.47, 0.53);
  const unit = String(M.ri(1, 99)).padStart(2, '0');
  const tulip = M.chance(0.55);
  const lamps = M.chance(0.7);
  const vw = viewSide(M, 20, 28, 50, 66, 0.8);
  const P = {
    L, w: curve(sc([[0, 0], [0.012, 0.56], [0.04, 0.75], [0.1, 0.83], [0.25, 0.84], [0.42, 0.85], [0.6, 0.97], [0.7, 1], [0.8, 0.9], [0.88, 0.66], [0.94, 0.4], [0.98, 0.16], [1, 0]], wK * L)),
    sole: curve([[0, 0], [0.22, 0], [0.3, 0.035 * L], [0.5, 0.035 * L], [0.6, 0], [0.8, 0], [0.9, 0.035 * L], [1, upturn * L]]),
    tS: 0, sT, sB: sT * 0.55, throat: 'round', open: 0.74,
    hV: curve(sc([[0.4, 0.33], [0.5, 0.3], [0.62, 0.26], [0.75, 0.205], [0.85, 0.14], [0.92, 0.09], [0.97, 0.05], [1, 0.015]], L)),
    hC: null, bulge: 0.13, inset: 0.84, soleKind: 'none', binding: L * 0.022, partUpper: 'CLOG HULL',
  };
  P.hC = curve(sc([[0, 0.19], [0.12, 0.17], [0.3, 0.165], [sT, P.hV(sT) / L]], L));
  const H = 0.36 * L;
  const g = G.plan(M, { len: L * 1.02, wid: wK * L * 2.3, hgt: H, mass: L * L * L * 0.06, kinds: { floats: 2.5, paddles: 2.5, wheels: 1.5, skis: 1.5, tracks: 1, sails: 1.2, rails: 0.8, balloons: 0.8, legs: 0.6, rotors: 0.5 } });
  let crew = 1;
  M.at(0, 0, g.z, () => {
    const sh = shoe(M, P);
    const { Ls } = sh;
    M.info.mass = sh.upper.bbox.slice();
    // the flat underside, carved in one piece with the hull
    M.part('CLOG HULL', () => {
      const fn = (s, u) => [Ls.X(s), u * Ls.w(s) * P.inset, Ls.sole(s)];
      mesh(M, [{ fn, S: sh.S, U: steps(-1, 1, 6, false), g: 8 }], { two: true, isect: false });
    });
    if (M.decorOn) {
      for (const side of [1, -1]) {
        const F = sh.surf(side);
        if (!F.seen(0.6, 0.4) && !F.seen(0.2, 0.4)) continue;
        // wood grain along the hull, a few long wavering lines
        for (let i = 0; i < 9; i++) {
          const v0 = 0.08 + i * 0.1, ph = i * 1.7;
          F.runS((s) => v0 + 0.018 * Math.sin(s * 9 + ph) + 0.01 * Math.sin(s * 23 + ph * 2), 0.01, i > 6 ? sT : 0.99, { w: 0 });
        }
        // strakes: plank seams as plate seams with rivets
        for (const s of [0.24, 0.5, 0.76]) { F.runU(s, 0.02, s < sT ? 0.97 : 0.995, { w: 1 }); F.rowU(s + 0.01, 0.05, 0.93, { pitch: 6.5, r: 0.8 }); }
        F.runS(0.12, 0.0, 1, { w: 1 });
        F.rowS(0.15, 0.02, 0.98, { pitch: 6.5, r: 0.8 });
        F.shade({ gap: 2.5, u: [0.02, 0.99], k: 140, bias: 0.05 });
      }
      // tulip painted on the vamp
      if (tulip) {
        const F = sh.surf(vw.side);
        const s = 0.72, v = 0.82, h = Ls.hV(0.72) * 0.42;
        const pts = [[0, -h * 0.5], [0, h * 0.15]];
        F.shape(s, v, pts, { w: 1 });
        F.shape(s, v, [[-h * 0.2, h * 0.15], [-h * 0.22, h * 0.4], [-h * 0.1, h * 0.3], [0, h * 0.5], [h * 0.1, h * 0.3], [h * 0.22, h * 0.4], [h * 0.2, h * 0.15], [0, h * 0.05]], { closed: true, w: 1 });
        F.shape(s, v, [[0, -h * 0.25], [-h * 0.25, -h * 0.05], [-h * 0.05, -h * 0.35]], { closed: true, w: 1 });
        F.shape(s, v, [[0, -h * 0.3], [h * 0.25, -h * 0.12], [h * 0.06, -h * 0.4]], { closed: true, w: 1 });
      }
    }
    dressInside(M, sh);
    // the cabin
    if (size === 'small') {
      cabin(M, Ls, { seats: 1, L, glassH: Math.min(0.45, L * 0.1) });
    } else {
      const x0 = Ls.X(0.1), x1 = Ls.X(sT * 0.72);
      const zf = Ls.zE(0.25) - 0.2;
      const w = Ls.yo(0.25) * 1.5;
      M.part('CLOG HULL', () => {
        // a level floor inside the opening at the rim
        const fl = [];
        for (let i = 0; i <= 12; i++) { const s = 0.06 + (sT * 0.85 - 0.06) * i / 12; fl.push([Ls.X(s), Ls.yo(s) * 0.97, zf]); }
        for (let i = 12; i >= 0; i--) { const s = 0.06 + (sT * 0.85 - 0.06) * i / 12; fl.push([Ls.X(s), -Ls.yo(s) * 0.97, zf]); }
        const D = M.plate(fl, { isect: false });
        const f = D.f('face'); if (f.on) f.hatch(f.poly, { angle: 90, gap: 2.4, w: 0 });
      });
      deckhouse(M, { x0, x1, w: Math.min(w, (x1 - x0) * 0.9), z0: zf, h: Math.min(2.2, L * 0.22), stack: true });
      crew = size === 'barge' ? M.ri(2, 4) : M.ri(4, 8);
      if (M.chance(0.7)) M.part('MOORING BITT', () => { const p = Ls.sect(0.9, 1, 1); M.at(p[0] - L * 0.02, 0, p[2], () => { M.cyl(L * 0.012, 0, L * 0.03); M.at(0, 0, L * 0.03, () => M.cyl(L * 0.018, 0, L * 0.006)); }); co(M, 'MOORING BITT', 1, add(p, [0, 0, L * 0.03]), 0.8); });
    }
    if (lamps) headlamps(M, sh, 0.9, 0.55, Math.max(0.07, L * 0.02));
    sideNumber(M, sh, vw.side, 0.62, 0.45, Ls.hV(0.62) * 0.28, unit);
    if (size !== 'small') quarterDoor(M, sh, vw.side, 0.33, 0.2, 0.78, { label: 'SIDE HATCH', w: Math.min(0.8, L * 0.08), groundZ: M.W([0, 0, 0])[2] });
    co(M, 'UPTURNED TOE', 1, Ls.sect(0.96, 0.5, vw.side), 1.8);
    co(M, 'CARVED HULL', 1, Ls.sect(0.5, 0.35, vw.side), 2.0);
    co(M, 'RIM', 1, Ls.sect(0.2, 1, vw.side), 1.1);
    co(M, 'PLANK SEAM', 3, Ls.sect(0.76, 0.5, vw.side), 0.8);
  });
  const gi = g.build();
  const place = M.pick(g.places);
  const what = M.pick(['WOODEN CLOG', 'CLOG', 'WOODEN SHOE']);
  const klass = pickKlass(M, [`${place} ${what} ${g.form}`, `${g.adj} ${what}`, `${what} ${g.form}`]);
  const briefs = crew === 1
    ? [`Carries one cheese inspector between the market towns.`, `${cap(g.goes)} with one driver and 40 kilograms of bulbs.`, `Takes the dike warden along 12 kilometers of dike every morning.`]
    : [`Carries ${word(crew)} crew and 6 tons of cheese to the weigh house.`, `${cap(g.goes)} with ${word(crew)} crew and a stove in the wheelhouse.`, `Takes ${word(crew)} bulb growers and their crates to the auction.`];
  return {
    klass, family: g.family, float: g.float,
    brief: fit(M.pick(briefs)),
    specs: [...gi.specs, ['CREW', String(crew)], ['TIMBER', M.pick(['POPLAR', 'WILLOW', 'ALDER', 'BIRCH'])], ['SIZE', `EU ${M.ri(38, 46)} X ${Math.round(L / 0.27)}`]].slice(0, 4),
    figure: gi.figure,
  };
};

// ---------------------------------------------------------------- sandal with straps and a buckle
BUILD.sandal = (M) => {
  const size = M.wpick([[3, 'car'], [2, 'bus']]);
  const L = size === 'car' ? M.r(2.8, 3.6) : M.r(4.5, 6.5);
  const wK = M.r(0.155, 0.175);
  const wedge = M.r(0.06, 0.1);
  const unit = String(M.ri(1, 99)).padStart(2, '0');
  const lamps = M.chance(0.85), ex = M.chance(0.7);
  const nStrap = M.wpick([[2, 2], [1.5, 3]]);
  const vw = viewSide(M, 28, 36, 45, 62, 0.85);
  const sT = 0.5;
  const P = {
    L, w: curve(sc([[0, 0], [0.012, 0.52], [0.04, 0.72], [0.1, 0.82], [0.25, 0.82], [0.42, 0.8], [0.6, 0.96], [0.7, 1], [0.82, 0.96], [0.9, 0.84], [0.96, 0.6], [0.99, 0.3], [1, 0]], wK * L)),
    sole: curve([[0, 0], [0.85, 0], [1, 0.02 * L]]),
    tS: curve(sc([[0, wedge], [0.3, wedge * 0.92], [0.65, 0.045], [1, 0.04]], L)),
    sT, sB: 0.32, open: 0.9,
    hV: curve(sc([[0.4, 0.3], [0.5, 0.25], [0.6, 0.2], [0.7, 0.16], [0.8, 0.13], [0.88, 0.1], [0.95, 0.07], [1, 0.02]], L)),
    hC: null, bulge: 0.06, solePlan: L * 0.03, soleR: 0.06, partSole: 'FOOTBED',
  };
  P.hC = curve(sc([[0, 0.24], [0.2, 0.23], [0.35, 0.23], [sT, P.hV(sT) / L]], L));
  const g = G.plan(M, { len: L * 1.04, wid: wK * L * 2.4, hgt: 0.3 * L, mass: L * L * 0.1, kinds: { wheels: 2, trike: 2, hover: 1.5, skis: 1, floats: 1.2, rails: 1, wings: 0.7, rotors: 0.7, balloons: 0.7, sails: 1, legs: 0.6 } });
  const seats = size === 'car' ? M.ri(1, 2) : M.ri(4, 8);
  M.at(0, 0, g.z, () => {
    const Ls = { ...P };
    const sh = shoe(M, { ...P, insole: false, ns: 40, noUpper: true });
    const L2 = sh.Ls;
    // hide the upper: rebuild only the straps. shoe() built the upper as a solid; mark it
    M.info.mass = sh.sole.bbox.slice();
    const k = 1.04;
    const strapFn = (side) => (s, v) => { const p = L2.sect(s, v, side); const z0 = L2.zb(s); return [p[0], p[1] * k, z0 + (p[2] - z0) * k]; };
    const straps = [];
    M.part('STRAP', () => {
      const bands = nStrap === 2 ? [[0.62, 0.69], [0.79, 0.85]] : [[0.58, 0.63], [0.7, 0.75], [0.82, 0.87]];
      for (const [a, b] of bands) {
        straps.push([a, b]);
        mesh(M, [1, -1].map((side) => ({ fn: strapFn(side), S: steps(a, b, 3, false), U: steps(0, 1, 10, false) })), { two: true, g: 9 });
      }
      // ankle strap round the back, the heel strap, and the side posts
      mesh(M, [1, -1].map((side) => ({ fn: strapFn(side), S: steps(0, 0.34, 14), U: steps(0.72, 0.86, 2, false) })), { two: true, g: 10 });
      mesh(M, [1, -1].map((side) => ({ fn: strapFn(side), S: steps(0, 0.035, 3, false), U: steps(0, 0.74, 6, false) })), { two: true, g: 11 });
      mesh(M, [1, -1].map((side) => ({ fn: strapFn(side), S: steps(0.3, 0.34, 2, false), U: steps(0, 0.74, 6, false) })), { two: true, g: 12 });
      co(M, 'TOE STRAP', 1, strapFn(vw.side)(straps[straps.length - 1][0] * 0.5 + straps[straps.length - 1][1] * 0.5, 0.75), 1.6);
      co(M, 'ANKLE STRAP', 1, strapFn(vw.side)(0.15, 0.8), 1.5);
    });
    // strap decor: stitching along both edges
    if (M.decorOn) {
      for (const side of [1, -1]) {
        const F = new Surf(M, strapFn(side), { inside: (s) => [L2.X(s), 0, L2.zb(s) + 0.2] });
        for (const [a, b] of straps) { F.rowU(a + (b - a) * 0.2, 0.02, 0.98, { kind: 'stitch', pitch: 4 }); F.rowU(b - (b - a) * 0.2, 0.02, 0.98, { kind: 'stitch', pitch: 4 }); F.shade({ s: [a, b], u: [0, 1], gap: 2.2, k: 10 }); }
        F.rowS(0.79, 0.04, 0.3, { pitch: 6, r: 0.7 });
      }
    }
    // the buckle on the seen side
    M.part('BUCKLE', () => {
      const F = new Surf(M, strapFn(vw.side), { inside: (s) => [L2.X(s), 0, L2.zb(s) + 0.2] });
      const s = 0.32, v = 0.79;
      const p = F.P(s, v), n = F.N(s, v);
      const a = norm(sub(F.P(s + 0.01, v), F.P(s - 0.01, v)));
      const up = norm(cross(n, a));
      const bw = L * 0.04, bh = L * 0.035, lift = L * 0.006;
      const c = add(p, mul(n, lift));
      const q = (x, y) => add(c, add(mul(a, x), mul(up, y)));
      M.world(() => {
        M.pipe([q(-bw / 2, -bh / 2), q(bw / 2, -bh / 2), q(bw / 2, bh / 2), q(-bw / 2, bh / 2), q(-bw / 2, -bh / 2)], L * 0.004, { isect: false });
        M.tube(q(-bw / 2, 0), q(bw * 0.35, 0), L * 0.0025, { isect: false });
      });
      co(M, 'BUCKLE', 1, c, 1.4);
    });
    // the footbed: seams and a grid of grip plates
    if (M.decorOn && sh.soleSurf) {
      const SS = sh.soleSurf;
      SS.runS(0.5, 0, 1, { w: 1 });
      SS.rowS(0.62, 0.02, 0.98, { pitch: 6.5, r: 0.7 });
      SS.shade({ u: [0.5, 1], gap: 2.4, k: 100 });
      SS.shade({ u: [0, 0.5], gap: 2.4, k: 100 });
    }
    // cabin on the footbed: a windshield standing on the first strap, seats behind
    M.part('WINDSHIELD', () => {
      const s = straps[0][0] - 0.01;
      const a = strapFn(1)(s, 0.85), b = strapFn(-1)(s, 0.85);
      windshield(M, a, b, Math.min(0.5, L * 0.1), { rake: 30 });
      co(M, 'WINDSHIELD', 1, lerp(a, b, 0.3), 1.6);
    });
    const perRow = seats === 1 ? 1 : 2, rows = Math.ceil(seats / perRow);
    M.part('DRIVER SEAT', () => {
      for (let r = 0; r < rows; r++) {
        const x = L2.X(straps[0][0]) - 0.7 - r * 0.8;
        const s = clamp((x - L2.X(0)) / L, 0.05, 1);
        const zf = L2.zb(s);
        const hw = L2.w(s) * 0.7;
        for (let c = 0; c < perRow; c++) M.at(x, perRow === 1 ? 0 : (c - 0.5) * hw, zf + 0.34, () => seatUnit(M, { w: Math.min(0.5, hw * 0.85), d: 0.46, h: 0.5, pedestal: 0.28 }));
        if (r === 0) {
          M.at(x + 0.45, 0, zf + 0.7, () => steering(M, { r: 0.17, rake: 35, base: [0.25, 0, -0.68] }));
          co(M, 'STEERING WHEEL', 1, [x + 0.45, 0, zf + 0.7], 1.0);
        }
      }
      co(M, seats > 2 ? 'PASSENGER SEATS' : 'DRIVER SEAT', seats, [L2.X(straps[0][0]) - 0.7, 0, L2.zb(0.4) + 0.6], 1.3);
    });
    if (lamps) {
      M.part('HEADLAMP', () => {
        for (const side of [1, -1]) {
          const s = 0.93, p = [L2.X(s), side * L2.w(s) * 0.8, L2.sole(s) + L2.tS(s) * 0.5];
          const r = Math.max(0.06, L * 0.014);
          M.at(p[0], p[1], p[2] + r * 0.3, () => M.rz(side * 25, () => { M.ry(90, () => M.cyl(r, 0, r * 1.2)); const R = M.ry(90, () => M.cyl(r * 1.1, r * 1.2, r * 1.4, { isect: false })); if (R.top.ok) R.top.circle(0, 0, r * 0.7, { w: 1 }); }));
          co(M, 'HEADLAMP', 2, p, 1.2);
        }
      });
    }
    if (sh.soleSurf) { const SS = sh.soleSurf; if (M.decorOn) { const k = vw.side > 0 ? 0.25 : 0.75; if (SS.seen(0.5, k)) SS.text(unit, 0.45, k, L2.tS(0.45) * 0.55); } }
    if (ex) exhaust(M, [L2.X(0) - 0.02, 0, L2.tS(0) * 0.5], [-1, vw.side * 0.25, 0.2], Math.max(0.035, L * 0.01), L * 0.1);
    co(M, 'FOOTBED', 1, [L2.X(0.5), vw.side * L2.w(0.5) * 1.02, L2.tS(0.5) * 0.6], 1.8);
    co(M, 'HEEL STRAP', 1, strapFn(1)(0.0, 0.4), 0.8);
    void Ls;
  });
  const gi = g.build();
  const place = M.pick(g.places);
  const what = M.pick(['SANDAL', 'STRAP SANDAL', 'BEACH SANDAL']);
  const klass = pickKlass(M, [`${place} ${what} ${g.form}`, `${g.adj} ${what}`, `${what} ${g.form}`]);
  const briefs = seats <= 2
    ? [`Takes ${word(seats)} bathers to the beach with the top down.`, `${cap(g.goes)} with ${word(seats)} seated on the footbed.`, `Carries ${word(seats)} lifeguards along 8 kilometers of shore.`]
    : [`Takes ${word(seats)} tourists along the promenade in open air.`, `${cap(g.goes)} with ${word(seats)} seated on the footbed.`, `Carries ${word(seats)} pilgrims to the shrine and back in a day.`];
  return {
    klass, family: g.family, float: g.float,
    brief: fit(M.pick(briefs)),
    specs: [...gi.specs, ['SEATS', String(seats)], ['STRAPS', String(nStrap + 3)], ['SIZE', `EU ${M.ri(36, 45)} X ${Math.round(L / 0.27)}`]].slice(0, 4),
    figure: gi.figure,
  };
};
