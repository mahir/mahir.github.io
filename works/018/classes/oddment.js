// classes/oddment.js: other small everyday things at vehicle scale, built as machines and put
// on running gear from gear.js: an alarm clock, a light bulb (the glass is drawn clear, with
// the filament inside), a top hat or a bowler, an open umbrella, a birdcage, a chess rook,
// a padlock. Same treatment as tableware: plate seams, rivets, portholes, a door with a
// platform and a ladder, lamps, a stenciled number.

import * as K from '../kit.js';
import * as T from './parts-table.js';
import { dot, sub, add, mul, norm, cross, D2R } from '../geom.js';

const { clamp, wd, cap, thou, near, ladderZ, dress, crewDoor, sprof, sideY, doorAngle } = T;

// a door whose height runs along the ring (on a lathe lying along x): center (a, t)
function ringDoor(M, L, a, t, w, h) {
  if (!L.on) return;
  const Rc = (x, y) => [[-x, -y], [x, -y], [x, y], [-x, y]];
  L.shape(a, t, Rc(h / 2, w / 2), { closed: true, w: 1 });
  L.shape(a, t, Rc(h * 0.44, w * 0.4), { closed: true, w: 1 });
  const r = T.rT(L, t);
  const s = a >= 0 ? 1 : -1;
  L.shape(a + s * h * 0.2 / r / D2R, t, Rc(h * 0.12, w * 0.28), { closed: true, w: 1 });
}
// dark-glass hatch on a planar face polygon
const glassPoly = (f, poly) => K.glass(f, poly, { gap: 1.0, gap2: 2.2 });

// ================================================================== ALARM CLOCK
const clock = {
  plan(M) {
    const s = M.pick([1, -1]);
    M.setView(s * M.r(28, 42), M.r(18, 26));
    const R = M.r(1.2, 2.6);
    const P = {
      R, D: R * M.r(0.55, 0.75), footH: R * M.r(0.2, 0.3), bell: R * M.r(0.38, 0.48), bellAng: M.r(32, 42),
      handle: M.chance(0.5), hh: M.ri(1, 12), mm: M.ri(0, 11) * 5, ports: M.pick([10, 12, 14]), lamp: M.chance(0.6),
      numerals: M.pick(['arabic', 'arabic', 'roman']),
    };
    P.zc = P.footH + R;
    const hgt = P.zc + R + P.bell * 1.2 + (P.handle ? 0.35 * R : 0);
    return { ...P, len: P.D + 0.6 * R, wid: 2 * (R + P.bell * 0.6), hgt, round: false, mass: Math.round(R ** 3 * 1.2 * 10) / 10 };
  },
  build(M, P, ctx) { return buildClock(M, P, ctx); },
  words(P, ctx, res) {
    return {
      name: 'ALARM CLOCK',
      places: ['GARRISON', 'BARRACKS', 'MILL TOWN', 'DORMITORY', 'VILLAGE', 'HARBOR'],
      briefs: [
        (c) => `Wakes ${c.place} night shifts at ${P.hh} o'clock and can be heard ${res.km} km away.`,
        (c) => `${cap(c.goes)} through town at 5 a.m. ringing both bells.`,
        () => `Rings ${res.db} decibels for 40 seconds, then winds itself for the next day.`,
        (c) => `Carries ${wd(res.crew)} bell ringers and the correct time to ${c.place} stations.`,
      ],
      specs: [['BELLS', '2 X ' + res.bellKg + ' KG'], ['ALARM', `${res.db} DB`], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildClock(M, P, ctx) {
  const { R, D, zc } = P, g = ctx.g;
  const sy = sideY(M);
  const x0 = -D / 2;
  // profile along x (lathe axis x): back dome, band, bezel, recessed dial
  const prof = [[0, -0.12 * R], [0.6 * R, -0.1 * R], [0.92 * R, -0.04 * R], [R, 0.04 * R], [R, D - 0.06 * R], [1.05 * R, D - 0.03 * R], [1.05 * R, D + 0.05 * R], [0.93 * R, D + 0.08 * R], [0.9 * R, D + 0.04 * R]];
  let S;
  M.part('CLOCK CASE', () => {
    S = M.at(x0, 0, zc, () => M.lathe(prof, { axis: 'x', sharpDeg: 25 }));
    const L = S.lat;
    if (L.on) {
      const tb = T.tIdx(prof, 3), te = T.tIdx(prof, 4);
      for (const k of [0.3, 0.7]) { L.ring(tb + (te - tb) * k, { w: 1 }); T.rivetRing(M, L, tb + (te - tb) * k + 0.012, 60); }
      L.ring(T.tIdx(prof, 2), { w: 1 });
      for (let i = 0; i < 16; i++) L.meridian(i * 22.5 + 11, tb, te, { w: 1 });
      L.shade({ t0: 0.02, t1: T.tIdx(prof, 6), gap: 2.0, gapMax: 7, threshold: 0.38 });
      L.text(ctx.unit, sy * 120, tb + (te - tb) * 0.5, D * 0.18);
    }
    // a row of portholes on the band, top half
    const tp = T.tIdx(prof, 3) + (T.tIdx(prof, 4) - T.tIdx(prof, 3)) * 0.5;
    let n = 0;
    for (let i = 0; i < P.ports; i++) { const a = 180 + (i - (P.ports - 1) / 2) * (200 / P.ports); if (near(a, sy * 120, 14) || near(a, sy * 80, 18)) continue; T.latPort(M, L, a, tp, Math.min(0.07 * R, D * 0.12)); n++; }
    M.callout('CLOCK CASE', 1, [0, sy * R, zc + 0.5 * R], 2.2);
    M.callout('VIEW PORT', n, [0, 0, zc + R], 1.0);
    // the dial: the cap face at +x
    const f = S.top;
    if (f.on) {
      const rd = 0.9 * R;
      f.circle(0, 0, rd * 0.97, { w: 1 });
      f.circle(0, 0, rd * 0.8, { w: 0 });
      for (let i = 0; i < 60; i++) {
        const a = i * 6 * D2R, c = Math.cos(a), s = Math.sin(a), l = i % 5 ? 0.05 : 0.1;
        f.line(c * rd * 0.92, s * rd * 0.92, c * rd * (0.92 - l), s * rd * (0.92 - l), { w: i % 5 ? 0 : 1 });
      }
      const RN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      for (let k = 1; k <= 12; k++) {
        const a = (90 - 30 * k) * D2R;
        f.text(P.numerals === 'roman' ? RN[k % 12] : String(k), Math.cos(a) * rd * 0.68, Math.sin(a) * rd * 0.68, rd * (P.numerals === 'roman' ? 0.1 : 0.14), { w: 1, pass: 4 });
      }
      f.text(ctx.des, 0, rd * 0.3, rd * 0.06, { w: 1, pass: 4 });
      // hands
      const hand = (ang, l, w) => { const a = ang * D2R, c = Math.cos(a), s = Math.sin(a); const p = (u, v) => [c * u - s * v, s * u + c * v]; return [p(-0.12 * rd, 0), p(0, w), p(l, w * 0.25), p(l * 1.03, 0), p(l, -w * 0.25), p(0, -w)]; };
      const am = 90 - P.mm * 6, ah = 90 - (P.hh % 12) * 30 - P.mm * 0.5;
      const H1 = hand(ah, rd * 0.48, rd * 0.05), H2 = hand(am, rd * 0.74, rd * 0.035);
      f.path(H1, { closed: true, w: 1 }); f.hatch(H1, { angle: 45, gap: 1.2, w: 0 });
      f.path(H2, { closed: true, w: 1 }); f.hatch(H2, { angle: -45, gap: 1.4, w: 0 });
      const aa = (90 - (P.hh % 12 + 0.5) * 30) * D2R;
      f.line(0, 0, Math.cos(aa) * rd * 0.6, Math.sin(aa) * rd * 0.6, { w: 1 });
      f.circle(0, 0, rd * 0.05, { w: 1 });
    }
    M.callout('DIAL', 1, [x0 + D + 0.05 * R, 0, zc + 0.45 * R], 2.6);
    M.callout('BEZEL RING', 1, [x0 + D + 0.05 * R, 0, zc - 1.03 * R], 1.0);
  });
  // ---- door on the side band, with its platform
  let fig = null;
  {
    const zd = zc - 0.25 * R, ca = (zc - zd) / R;
    const a = sy * Math.acos(clamp(ca, -1, 1)) / D2R;
    const dh = clamp(0.75 * R, 0.9, 1.9), dw = clamp(D * 0.45, 0.5, 0.8);
    const tD = T.tIdx(prof, 3) + (T.tIdx(prof, 4) - T.tIdx(prof, 3)) * 0.35;
    M.part('CREW DOOR', () => {
      ringDoor(M, S.lat, a, tD, dw, dh);
      M.callout('CREW DOOR', 1, [x0 + D * 0.35 - 0.0, sy * R * Math.sin(Math.abs(a) * D2R), zd], 1.4);
    });
    const zs = zd - dh / 2 + 0.05;
    const yr = Math.sqrt(Math.max(0, R * R - (zc - zs) ** 2));
    const xd = x0 + (prof[3][1] + (prof[4][1] - prof[3][1]) * 0.35);
    const foot = T.boardingAt(M, [xd, sy * yr, zs], sy * 90, { depth: 1.0, width: 1.4, inset: 0.15, stayH: 1.3, zLadder: Math.min(0, ladderZ(g)) });
    if (ladderZ(g) < 0) fig = foot;
  }
  // ---- bells, hammer, handle
  M.part('ALARM BELL', () => {
    for (const s of [1, -1]) {
      const a = (90 - P.bellAng) * D2R;
      const c = [0, s * Math.cos(a) * (R + P.bell * 0.15), zc + Math.sin(a) * (R + P.bell * 0.15)];
      M.with({ at: c, rx: -s * P.bellAng * 0.8 }, () => {
        const b = P.bell;
        const B = M.lathe([[b, 0], [b * 1.02, 0.04 * b], [b * 0.96, 0.25 * b], ...Array.from({ length: 6 }, (_, i) => { const th = (i + 1) / 6 * Math.PI / 2; return [b * 0.96 * Math.cos(th), 0.25 * b + 0.55 * b * Math.sin(th)]; })], { open: true, sharpDeg: 30 });
        if (B.lat.on) { B.lat.ring(0.12, { w: 1 }); B.lat.shade({ t0: 0.05, t1: 0.95, gap: 1.8, gapMax: 5 }); }
        M.cyl(0.06 * b, 0.78 * b, 0.95 * b);
        M.at(0, 0, 0.98 * b, () => M.sphere(0.08 * b));
        M.tube([0, 0, 0.8 * b], [0, 0, -0.35 * b], 0.05 * b);
      });
    }
    M.callout('ALARM BELL', 2, [0, sy * (R + P.bell * 0.3) * Math.cos((90 - P.bellAng) * D2R), zc + (R + P.bell * 0.6) * Math.sin((90 - P.bellAng) * D2R)], 2.4);
  });
  M.part('BELL HAMMER', () => {
    const zt = zc + R;
    M.tube([-0.1 * R, 0, zt - 0.05 * R], [-0.1 * R, 0, zt + P.bell * 0.75], 0.03 * R);
    M.tube([-0.1 * R, -0.06 * R, zt + P.bell * 0.75], [-0.1 * R, 0.06 * R, zt + P.bell * 0.75], 0.03 * R);
    M.at(-0.1 * R, 0, zt + P.bell * 0.85, () => M.sphere(0.07 * R));
    M.callout('BELL HAMMER', 1, [-0.1 * R, 0, zt + P.bell * 0.85], 1.6);
  });
  if (P.handle) M.part('CARRYING RING', () => {
    const zt = zc + R, hR = 0.42 * R;
    const pts = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI * i / 16; pts.push([0.15 * R, Math.cos(a) * hR, zt - 0.02 * R + Math.sin(a) * hR * 1.2]); }
    T.sweep(M, pts, 0.035 * R);
    M.callout('CARRYING RING', 1, [0.15 * R, 0, zt + hR * 1.2], 1.4);
  });
  // ---- feet
  M.part('FOOT', () => {
    for (const s of [1, -1]) {
      const a = 38 * D2R;
      const top = [0.1 * D, s * Math.sin(a) * R * 0.9, zc - Math.cos(a) * R * 0.9];
      const ft = [0.1 * D, s * (Math.sin(a) * R * 0.9 + P.footH * 0.6), P.footH * 0.35];
      M.tube(top, ft, 0.08 * R);
      M.at(ft[0], ft[1], 0, () => M.lathe([[0, 0], [0.18 * R, 0], [0.2 * R, 0.08 * R], [0.12 * R, ft[2] + 0.06 * R], [0, ft[2] + 0.1 * R]]));
    }
    M.callout('FOOT', 2, [0.1 * D, sy * (Math.sin(38 * D2R) * R * 0.9 + P.footH * 0.6), P.footH * 0.3], 1.2);
  });
  // ---- winding key and the alarm set knob at the back
  M.part('WINDING KEY', () => {
    const xb = x0 - 0.12 * R;
    M.tube([xb + 0.05 * R, 0, zc], [xb - 0.3 * R, 0, zc], 0.05 * R);
    const k = 0.32 * R;
    const lobe = [[0, 0.05 * R], [0.25 * k, k * 0.5], [0.4 * k, k * 0.95], [0.1 * k, k * 1.05], [-0.1 * k, k * 1.05], [-0.4 * k, k * 0.95], [-0.25 * k, k * 0.5], [0, 0.05 * R]];
    const bow = [...lobe.map(([u, v]) => [u, v]), ...lobe.map(([u, v]) => [-u, -v])];
    M.at(xb - 0.3 * R, 0, zc, () => M.rx(25, () => M.extrude(bow.map(([u, v]) => [u, v]), -0.03 * R, 0.03 * R, { plane: 'yz' })));
    M.tube([xb + 0.05 * R, 0.4 * R, zc + 0.35 * R], [xb - 0.12 * R, 0.4 * R, zc + 0.35 * R], 0.04 * R);
    M.at(xb - 0.12 * R, 0.4 * R, zc + 0.35 * R, () => M.ry(-90, () => M.cyl(0.1 * R, 0, 0.05 * R)));
    M.callout('WINDING KEY', 1, [xb - 0.3 * R, 0, zc + k * 0.7], 2.0);
  });
  if (P.lamp) M.part('LAMP', () => {
    for (const s of [1, -1]) M.at(x0 + D + 0.02 * R, s * 0.75 * R, zc - 0.82 * R, () => K.lamp(M, { r: 0.05 * R }));
    M.callout('HEADLAMP', 2, [x0 + D + 0.05 * R, sy * 0.75 * R, zc - 0.82 * R], 0.8);
  });
  return { main: S.bbox, figure: fig, crew: clamp(Math.round(R * 1.4), 1, 4), km: Math.round(R * 3), db: 100 + Math.round(R * 8), bellKg: thou(Math.round(P.bell ** 3 * 900)) };
}

// ================================================================== LIGHT BULB
const bulb = {
  plan(M) {
    const s = M.pick([1, -1]);
    M.setView(s * M.r(30, 60) + (M.chance(0.5) ? 180 : 0), M.r(20, 28));
    const R = M.r(1.4, 3.0);
    const P = { R, shape: M.wpick([[3, 'pear'], [1.5, 'globe'], [1.2, 'tube']]), fil: M.wpick([[2, 'cage'], [1.5, 'coil'], [1, 'loop']]), cab: R > 1.9 && M.chance(0.65), tip: M.chance(0.6), threads: M.ri(4, 6) };
    P.rc = 0.42 * R; P.hc = (P.shape === 'tube' ? 0.6 : 0.75) * R; P.zg = 0.18 * R + P.hc;
    P.top = P.zg + (P.shape === 'globe' ? 2.3 * R : P.shape === 'tube' ? 3.0 * R : 2.4 * R);
    return { ...P, len: 2 * R, wid: 2 * R, hgt: P.top + (P.tip ? 0.12 * R : 0), mass: Math.round(R ** 3 * 0.4 * 10) / 10 };
  },
  build(M, P, ctx) { return buildBulb(M, P, ctx); },
  words(P, ctx, res) {
    return {
      name: 'LIGHT BULB',
      places: ['STREET', 'MINE', 'TUNNEL', 'FAIRGROUND', 'STATION', 'HARBOR'],
      briefs: [
        (c) => `Lights ${c.place} night work with ${thou(res.kw)} kW and carries its own generator.`,
        (c) => `${cap(c.goes)} to wherever the power has failed.`,
        () => `Gives ${thou(res.lm)} lumens; the crew sits inside the glass.`,
        (c) => `Lights a ${c.place} for one night and moves on before morning.`,
      ].filter((f, i) => i !== 2 || P.cab),
      specs: [['POWER', `${thou(res.kw)} KW`], ['LIGHT', `${thou(res.lm)} LM`], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildBulb(M, P, ctx) {
  const { R, rc, hc, zg } = P, g = ctx.g;
  const e = M.view.e;
  // ---- screw cap: insulator, contact, threaded shell
  const cp = [[0, 0], [0.1 * R, 0], [0.13 * R, 0.05 * R], [0.3 * R, 0.07 * R], [0.31 * R, 0.16 * R], [rc * 0.92, 0.18 * R]];
  const nt = P.threads * 2;
  for (let i = 0; i <= nt; i++) cp.push([i % 2 ? rc * 0.93 : rc, 0.18 * R + 0.05 * R + (hc - 0.12 * R) * i / nt]);
  cp.push([rc * 1.04, zg - 0.04 * R], [rc * 1.04, zg], [rc * 0.9, zg], [0, zg]);
  let C;
  const aD = doorAngle(M, [], 0);
  M.part('SCREW CAP', () => {
    C = M.lathe(cp, { sharpDeg: 20 });
    const L = C.lat;
    if (L.on) {
      L.hatch(0, 360, T.tIdx(cp, 3), T.tIdx(cp, 4), { gap: 1.2 });
      L.shade({ t0: T.tIdx(cp, 5), t1: T.tIdx(cp, cp.length - 3), gap: 1.8, gapMax: 5, threshold: 0.4 });
      T.rivetRing(M, L, T.tIdx(cp, cp.length - 4) + 0.01, 40);
    }
    M.callout('SCREW CAP', 1, [Math.cos((aD + 40) * D2R) * rc, Math.sin((aD + 40) * D2R) * rc, zg * 0.6], 2.2);
    M.callout('CONTACT', 1, [0, 0, 0.06 * R], 0.9);
    M.callout('INSULATOR', 1, [Math.cos(aD * D2R) * 0.3 * R, Math.sin(aD * D2R) * 0.3 * R, 0.12 * R], 0.8);
  });
  const fig = rc * 2 > 1.4 ? crewDoor(M, C, cp, aD, 0.25 * R, Math.min(hc * 0.7, 1.8), g, { depth: 0.9, inset: 0.1 }) : null;
  // ---- the glass envelope: drawn clear (it hides nothing)
  let gp;
  const zs = P.shape === 'globe' ? zg + 1.2 * R : P.shape === 'tube' ? zg + 1.6 * R : zg + 1.35 * R;
  if (P.shape === 'pear') gp = sprof([[rc * 0.92, zg], [0.5 * R, zg + 0.35 * R], [0.82 * R, zs - 0.55 * R], [R, zs], [0.82 * R, zs + 0.62 * R], [0.42 * R, zs + 0.94 * R], [0, zs + 1.05 * R]], 4);
  else if (P.shape === 'globe') gp = sprof([[rc * 0.92, zg], [0.55 * R, zg + 0.2 * R], [0.95 * R, zs - 0.45 * R], [R, zs], [0.85 * R, zs + 0.55 * R], [0.45 * R, zs + 0.92 * R], [0, zs + 1.1 * R]], 4);
  else gp = sprof([[rc * 0.92, zg], [0.6 * R, zg + 0.3 * R], [0.7 * R, zg + 0.8 * R], [0.72 * R, zs + 0.6 * R], [0.55 * R, zs + 1.2 * R], [0, zs + 1.4 * R]], 4);
  gp[gp.length - 1][0] = 0;
  M.part('GLASS ENVELOPE', () => {
    const Gl = M.lathe(gp, { sharpDeg: 40, isect: false });
    Gl.noOcclude = true;
    const L = Gl.lat;
    if (L.on) {
      // two highlights toward the light, a faint ring at the neck
      const aL = Math.atan2(M.light[1] + e[1], M.light[0] + e[0]) / D2R;
      L.meridian(aL + 8, 0.25, 0.75, { w: 0 }); L.meridian(aL + 14, 0.32, 0.62, { w: 0 });
      L.ring(0.05, { w: 0 });
    }
    M.callout('GLASS ENVELOPE', 1, [Math.cos(aD * D2R) * R * 0.97, Math.sin(aD * D2R) * R * 0.97, zs + 0.3 * R], 2.6);
  });
  const ztop = gp[gp.length - 1][1];
  if (P.tip) M.part('EXHAUST TIP', () => { M.at(0, 0, ztop - 0.01 * R, () => M.cone(0.06 * R, 0.01 * R, 0, 0.12 * R)); M.callout('EXHAUST TIP', 1, [0, 0, ztop + 0.06 * R], 0.9); });
  // ---- stem, lead-in wires, support wires, filament (lines inside the glass)
  M.part('FILAMENT', () => {
    const zf = zs + 0.15 * R, zst = zs - 0.25 * R;
    const St = M.lathe([[0.2 * R, zg + 0.02 * R], [0.12 * R, zg + 0.25 * R], [0.06 * R, zg + 0.45 * R], [0.05 * R, zst], [0, zst + 0.03 * R]], { isect: false });
    St.noOcclude = true;
    const ln = (pts, w = 1) => M.line(pts, { w, pass: 2 });
    const ends = [[-0.38 * R, 0, zf], [0.38 * R, 0, zf]];
    const rot = Math.atan2(e[1], e[0]) + Math.PI / 2;            // filament plane faces the viewer
    const R2 = (p) => [p[0] * Math.cos(rot) - p[1] * Math.sin(rot), p[0] * Math.sin(rot) + p[1] * Math.cos(rot), p[2]];
    for (const [i, s] of [[0, -1], [1, 1]]) ln([[s * 0.04 * R, 0, zg + 0.1 * R], [s * 0.04 * R, 0, zg + 0.5 * R], [s * 0.12 * R, 0, zst], R2(ends[i])].map((p, k) => (k < 2 ? p : p)));
    const coil = (a, b, n, rr) => { const pts = []; for (let i = 0; i <= n * 8; i++) { const t = i / (n * 8), q = add(a, mul(sub(b, a), t)); const ang = i / 8 * 2 * Math.PI; pts.push([q[0], q[1] + Math.cos(ang) * rr, q[2] + Math.sin(ang) * rr]); } return pts; };
    if (P.fil === 'cage') {
      // a zigzag of filament held by support wires from the rod top
      const n = 6, pts = [], hub = [0, 0, zst + 0.05 * R];
      for (let i = 0; i <= n; i++) { const a = Math.PI * (0.15 + 0.7 * i / n); pts.push([-Math.cos(a) * 0.42 * R, 0, zf + (i % 2 ? 0.28 * R : -0.02 * R) + Math.sin(a) * 0.1 * R]); }
      ln(pts.map(R2), 1);
      for (let i = 1; i < n; i += 1) ln([hub, R2(pts[i])], 0);
    } else if (P.fil === 'coil') {
      const pts = coil([-0.38 * R, 0, zf], [0.38 * R, 0, zf + 0.04 * R], 14, 0.035 * R);
      ln(pts.map((p) => R2([p[0], p[1], p[2] + 0.12 * R * Math.sin(Math.PI * (p[0] / (0.76 * R) + 0.5))])), 1);
      ln([[0, 0, zst], R2([0, 0, zf + 0.16 * R])], 0);
    } else {
      const pts = [];
      for (let i = 0; i <= 20; i++) { const a = Math.PI * i / 20; pts.push([-Math.cos(a) * 0.38 * R, 0, zf + Math.sin(a) * 0.55 * R]); }
      ln(pts.map(R2), 1);
      ln([[0, 0, zst], R2([0, 0, zf + 0.55 * R])], 0);
    }
    M.callout('FILAMENT', 1, R2([0, 0, zf + 0.12 * R]), 2.4);
    M.callout('GLASS STEM', 1, [0, 0, zg + 0.35 * R], 1.0);
  });
  // ---- the crew gondola on the stem, inside the glass
  if (P.cab) M.part('CREW GONDOLA', () => {
    const zc0 = zg + 0.42 * R, h = clamp(0.55 * R, 1.6, 2.1), r = clamp(0.34 * R, 0.8, 1.2);
    const Cb = M.cyl(r, zc0, zc0 + h);
    if (Cb.lat.on) {
      const L = Cb.lat;
      for (let i = 0; i < 8; i++) T.latWindow(M, L, i * 45 + 22.5, 0.62, 2 * Math.PI * r / 8 * 0.6, h * 0.35, {});
      L.ring(0.25, { w: 1 });
      L.shade({ gap: 1.8, gapMax: 5 });
    }
    M.at(0, 0, zc0 + h, () => M.cone(r * 1.05, r * 0.4, 0, 0.2 * r));
    M.callout('CREW GONDOLA', 1, [Math.cos(aD * D2R) * r, Math.sin(aD * D2R) * r, zc0 + h * 0.4], 2.0);
  });
  const kw = Math.round(R ** 2 * 40), lm = Math.round(kw * 14) * 1000;
  return { main: [-R, -R, g.z, R, R, g.z + ztop], figure: fig, crew: P.cab ? 2 : 1, kw, lm };
}

// ================================================================== HAT
const hat = {
  plan(M) {
    const s = M.pick([1, -1]);
    M.setView(s * M.r(30, 60) + (M.chance(0.5) ? 180 : 0), M.r(22, 30));
    const kind = M.pick(['top', 'bowler']);
    const R = M.r(1.3, 2.6);
    const P = { kind, R, H: kind === 'top' ? R * M.r(1.6, 2.1) : R * M.r(1.25, 1.5), rb: R * (kind === 'top' ? M.r(1.6, 1.8) : M.r(1.4, 1.55)), band: R * M.r(0.3, 0.45), ports: M.pick([10, 12, 14]), rail: M.chance(0.75), feather: kind === 'bowler' ? false : M.chance(0.35), whip: M.chance(0.5), lamps: M.chance(0.6), bow: M.chance(0.8) };
    return { ...P, len: 2 * P.rb, wid: 2 * P.rb, hgt: P.H + 0.1 * R, mass: Math.round(R ** 3 * 0.8 * 10) / 10 };
  },
  build(M, P, ctx) { return buildHat(M, P, ctx); },
  words(P, ctx, res) {
    const nm = P.kind === 'top' ? 'TOP HAT' : 'BOWLER HAT';
    return {
      name: nm,
      places: ['OPERA', 'PARADE', 'BOULEVARD', 'RACECOURSE', 'EMBASSY', 'CITY'],
      briefs: [
        (c) => `Takes ${wd(res.crew)} guests to the ${c.place} and back, under the hat.`,
        (c) => `${cap(c.goes)}; passengers stand on the brim behind the rail.`,
        () => `Carries ${res.pax} passengers on the brim and a band of ${P.ports} portholes.`,
        (c) => `Brings the mayor to ${c.place} openings and keeps the rain off ${res.pax} guests.`,
      ],
      specs: [['PASSENGERS', String(res.pax)], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildHat(M, P, ctx) {
  const { R, H, rb, band } = P, g = ctx.g;
  const zb = 0.14 * R;
  let prof;
  if (P.kind === 'top') prof = [[0, 0], [rb * 0.92, 0.0], [rb, 0.1 * R], [rb * 1.02, 0.2 * R], [rb * 0.98, 0.26 * R], [rb * 0.9, 0.2 * R], [rb * 0.7, 0.12 * R], [R * 1.02, zb], [R, zb + 0.02 * R], [R * 0.97, zb + band], [R * 1.06, H], [R * 1.05, H + 0.04 * R], [0, H + 0.04 * R]];
  else {
    prof = [[0, 0], [rb * 0.9, 0.0], [rb, 0.12 * R], [rb * 1.02, 0.24 * R], [rb * 0.96, 0.3 * R], [rb * 0.86, 0.22 * R], [rb * 0.72, 0.14 * R], [R * 1.02, zb], [R, zb + 0.02 * R], [R * 0.99, zb + band]];
    for (let i = 1; i <= 8; i++) { const th = i / 8 * Math.PI / 2; prof.push([R * 0.99 * Math.cos(th), zb + band + (H - zb - band) * Math.sin(th)]); }
    prof[prof.length - 1][0] = 0;
  }
  const aD = doorAngle(M, [], 0);
  let S;
  M.part('CROWN', () => {
    S = M.lathe(prof, { sharpDeg: 28 });
    const L = S.lat;
    const tq = (z) => T.tZ(prof, z, true);
    if (L.on) {
      const t0 = T.tIdx(prof, 8), t1 = T.tIdx(prof, 9);
      // the band: double lines and rivets
      L.ring(t0, { w: 1 }); L.ring(t1, { w: 1 }); L.ring(t1 + 0.004, { w: 0 });
      T.rivetRing(M, L, t1 + 0.01, 60);
      const tTop = P.kind === 'top' ? T.tIdx(prof, 10) : 0.98;
      for (let i = 0; i < 16; i++) { const a = i * 22.5 + 11; if (!near(a, aD, 14)) L.meridian(a, t1 + 0.01, tTop, { w: 1 }); }
      L.ring(t1 + (tTop - t1) * 0.5, { w: 1 });
      L.ring(T.tIdx(prof, 3), { w: 1 });
      L.shade({ t0: t1, t1: tTop, gap: 2.0, gapMax: 7, threshold: 0.38 });
      L.shade({ t0: T.tIdx(prof, 1), t1: T.tIdx(prof, 4), gap: 2.0, gapMax: 6, threshold: 0.4 });
      L.text(ctx.unit, aD + 40, t1 + (tTop - t1) * 0.28, 0.16 * R);
      if (P.kind === 'top' && S.top.on) { S.top.circle(0, 0, R * 0.9, { w: 1 }); K.stencil(S.top, ctx.des, 0, 0, 0.14 * R); }
    }
    const n = T.portRow(M, L, (T.tIdx(prof, 8) + T.tIdx(prof, 9)) / 2, P.ports, band * 0.3, { skip: (a) => near(a, aD + 90, 20) && P.bow });
    M.callout('CROWN', 1, [Math.cos((aD + 30) * D2R) * R, Math.sin((aD + 30) * D2R) * R, zb + band + (H - zb - band) * 0.5], 2.4);
    M.callout('HAT BAND', 1, [Math.cos((aD - 30) * D2R) * R, Math.sin((aD - 30) * D2R) * R, zb + band * 0.5], 2.0);
    M.callout('VIEW PORT', n, [Math.cos((aD + 15) * D2R) * R, Math.sin((aD + 15) * D2R) * R, zb + band * 0.5], 1.2);
    M.callout('BRIM DECK', 1, [Math.cos((aD - 60) * D2R) * (R + rb) / 2, Math.sin((aD - 60) * D2R) * (R + rb) / 2, 0.16 * R], 2.2);
    M.callout('CURLED BRIM', 1, [Math.cos((aD + 60) * D2R) * rb, Math.sin((aD + 60) * D2R) * rb, 0.22 * R], 1.4);
  });
  // door in the crown above the band, opening onto the brim
  const zS = zb + band + 0.05 * R;
  crewDoor(M, S, prof, aD, zS, Math.min(1.9, (H - zS) * 0.6), g, { platform: false });
  if (P.bow) M.part('BOW', () => {
    const a = (aD + 90) * D2R, r = R * 1.0, z = zb + band / 2;
    M.with({ at: [Math.cos(a) * r, Math.sin(a) * r, z], rz: (aD + 90) }, () => {
      for (const s of [1, -1]) M.at(0.02 * R, s * 0.2 * R, 0, () => M.scale(0.06 * R, 0.2 * R, band * 0.45, () => M.sphere(1)));
      M.boxc([0.04 * R, 0, 0], [0.1 * R, 0.1 * R, band * 0.7]);
    });
    M.callout('BOW', 1, [Math.cos(a) * r, Math.sin(a) * r, z], 1.0);
  });
  if (P.feather) M.part('PLUME', () => {
    const a = (aD + 110) * D2R;
    const p0 = [Math.cos(a) * R, Math.sin(a) * R, zb + band * 0.6];
    const pts = T.bezier(p0, add(p0, [Math.cos(a) * 0.3 * R, Math.sin(a) * 0.3 * R, 0.8 * R]), add(p0, [-Math.cos(a) * 0.1 * R, -Math.sin(a) * 0.1 * R, 1.4 * R]), add(p0, [-Math.cos(a) * 0.6 * R, -Math.sin(a) * 0.6 * R, 1.6 * R]), 12);
    T.sweep(M, pts, (t) => 0.03 * R * (1 - t * 0.6));
    for (let i = 2; i < pts.length; i++) { const q = pts[i], s = 0.25 * R * Math.sin(Math.PI * i / pts.length); M.line([q, [q[0] + s * 0.5, q[1] - s, q[2] - s * 0.6]], { w: 0 }); M.line([q, [q[0] - s * 0.5, q[1] + s, q[2] - s * 0.6]], { w: 0 }); }
    M.callout('PLUME', 1, pts[6], 0.9);
  });
  // rail around the brim edge, ladder down
  if (P.rail) M.part('BRIM RAIL', () => {
    const rr = rb * 0.86, z = 0.17 * R;
    T.railRing(M, rr, z, { h: 0.95, r: 0.03 });
    M.callout('BRIM RAIL', 1, [Math.cos(aD * D2R) * rr, Math.sin(aD * D2R) * rr, z + 0.9], 1.2);
  });
  let fig = null;
  M.part('ACCESS LADDER', () => {
    const a = aD - 35, ar = a * D2R, zl = ladderZ(g);
    if (zl < 0) {
      M.with({ at: [Math.cos(ar) * (rb + 0.2), Math.sin(ar) * (rb + 0.2), 0], rz: a }, () => { M.at(0, 0, zl, () => K.ladder(M, { h: 0.26 * R - zl + 0.9, w: 0.5 })); const f = M.W([0.9, 0.8, zl]); fig = [f[0], f[1]]; });
      M.callout('ACCESS LADDER', 1, [Math.cos(ar) * (rb + 0.2), Math.sin(ar) * (rb + 0.2), zl * 0.5], 1.2);
    }
  });
  if (P.whip) M.part('WHIP ANTENNA', () => { const a = (aD + 200) * D2R; M.at(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, H + 0.02 * R, () => K.whip(M, { h: R * 1.2, lean: 10 })); M.callout('WHIP ANTENNA', 1, [Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, H + 0.2 * R], 0.6); });
  if (P.lamps) M.part('LAMP', () => { for (const s of [1, -1]) { const a = s * 25; M.with({ at: [Math.cos(a * D2R) * rb * 0.95, Math.sin(a * D2R) * rb * 0.95, 0.25 * R], rz: a }, () => K.lamp(M, { r: 0.07 * R })); } M.callout('BRIM LAMP', 2, [rb * 0.95, 0, 0.25 * R], 0.8); });
  const pax = Math.round(Math.PI * (rb * rb - R * R) / 0.6 / 5) * 5;
  return { main: S.bbox, figure: fig, crew: clamp(Math.round(R * 1.2), 1, 3), pax };
}

// ================================================================== UMBRELLA
const umbrella = {
  plan(M) {
    const s = M.pick([1, -1]);
    M.setView(s * M.r(25, 60), M.r(18, 26));
    const Rc = M.r(3, 6);
    const P = { Rc, n: 8, drop: Rc * M.r(0.32, 0.44), sag: M.r(0.04, 0.08), scal: Rc * M.r(0.05, 0.09), shaft: Rc * M.r(1.45, 1.75), hook: Rc * M.r(0.12, 0.17), gondola: M.chance(0.75), stripes: M.chance(0.5), rot: M.r(0, 45) };
    const H = P.shaft + 0.2 * Rc;
    return { ...P, len: 2 * Rc, wid: 2 * Rc, hgt: H, kinds: { balloons: 3, rotors: 3, wheels: 1, legs: 1, rails: 1, floats: 1.5, sails: 1, skis: 1, tracks: 1, hover: 1 }, mass: Math.round(Rc ** 2 * 0.25 * 10) / 10 };
  },
  build(M, P, ctx) { return buildUmbrella(M, P, ctx); },
  words(P, ctx, res) {
    return {
      name: 'UMBRELLA',
      places: ['RAINY', 'MONSOON', 'SEASIDE', 'FESTIVAL', 'MARKET', 'PROMENADE'],
      briefs: [
        (c) => `Keeps the rain off ${thou(res.pax)} people at ${c.place} markets and moves with them.`,
        (c) => `${cap(c.goes)} and opens over queues that have no shelter.`,
        () => `Shelters ${thou(res.pax)} people; the crew rides in the gondola on the shaft.`,
        (c) => `Covers a ${c.place} square in 40 seconds and folds for the night.`,
      ].filter((f, i) => i !== 2 || P.gondola),
      specs: [['CANOPY', `${(P.Rc * 2).toFixed(1)} M`], ['SHELTER', `${thou(res.pax)} PERS`], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildUmbrella(M, P, ctx) {
  const { Rc, n, drop, sag, scal } = P;
  const zTop = P.shaft + 0.2 * Rc - 0.25 * Rc;   // canopy top (under the ferrule)
  // rib: circular arc from the top to the edge
  const th = 2 * Math.atan2(drop, Rc), Rs = Rc / Math.sin(th);
  const rib = (s) => [Rs * Math.sin(th * s), zTop - Rs * (1 - Math.cos(th * s))];
  const rows = 7, cols = 6;
  const A = (i) => (P.rot + i * 360 / n) * D2R;
  const pt = (i, u, s) => {
    const [r0, z0] = rib(s);
    const a = A(i) + u * 2 * Math.PI / n;
    const k = Math.sin(Math.PI * u);
    const r = r0 * (1 - sag * k * s);
    return [Math.cos(a) * r, Math.sin(a) * r, z0 + scal * k * Math.pow(s, 5) - sag * 0.3 * k * s * Rc * 0.1];
  };
  const L = M.light, e = M.view.e;
  M.part('CANOPY', () => {
    const verts = [], faces = [];
    const idx = (i, c, r) => i * (cols + 1) * (rows + 1) + c * (rows + 1) + r;
    for (let i = 0; i < n; i++) for (let c = 0; c <= cols; c++) for (let r = 0; r <= rows; r++) verts.push(pt(i, c / cols, r / rows));
    for (let i = 0; i < n; i++) for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const a = idx(i, c, r), b = idx(i, c + 1, r), cc = idx(i, c + 1, r + 1), d = idx(i, c, r + 1);
      faces.push({ v: [a, b, cc], g: 70 + i }); faces.push({ v: [a, cc, d], g: 70 + i });
    }
    M._solid(verts, faces, { two: true, girth: 0.05 });
    // seams on the ribs, hems, and shade lines on the panels turned from the light
    const off = (p, k = 1.006) => [p[0] * k, p[1] * k, (p[2] - zTop) * k + zTop + 0.01];
    for (let i = 0; i < n; i++) {
      const sl = []; for (let r = 0; r <= 16; r++) sl.push(off(pt(i, 0, r / 16)));
      M.line(sl, { w: 1, pass: 2 });
      const hem = []; for (let c = 0; c <= 12; c++) hem.push(off(pt(i, c / 12, 0.93)));
      M.line(hem, { w: 0, pass: 2 });
      const pc = pt(i, 0.5, 0.6), pa = pt(i, 0.2, 0.6), pb = pt(i, 0.5, 0.7);
      const nn = norm(cross(sub(pa, pc), sub(pb, pc)));
      const nf = dot(nn, [pc[0], pc[1], pc[2] - zTop + Rs]) < 0 ? mul(nn, -1) : nn;
      const dark = (1 - dot(nf, L)) / 2;
      const striped = P.stripes && i % 2 === 1;
      if (M.decorOn && dot(nf, e) > -0.2 && (dark > 0.42 || striped)) {
        const gpx = striped ? 2.2 : 3.4 - 2.6 * (dark - 0.42) / 0.58;
        const span = Math.PI * 2 / n * rib(0.7)[0];
        const m = Math.max(2, Math.min(40, Math.round(span / (gpx * M.px))));
        for (let k = 1; k < m; k++) { const u = k / m; const ln = []; for (let r = 1; r <= 12; r++) ln.push(off(pt(i, u, 0.22 + 0.74 * r / 12), 1.004)); M.line(ln, { w: 0, pass: 3 }); }
      }
    }
    M.callout('CANOPY PANEL', n, pt(1, 0.5, 0.55), 2.6);
  });
  M.part('RIB', () => {
    for (let i = 0; i < n; i++) {
      const tip = pt(i, 0, 1);
      M.at(tip[0], tip[1], tip[2], () => M.sphere(0.025 * Rc));
      // stretcher from the runner to the rib, under the canopy
      const rm = pt(i, 0, 0.55);
      M.tube([0, 0, zTop - 0.55 * Rc], [rm[0] * 0.99, rm[1] * 0.99, rm[2] - 0.03 * Rc], 0.012 * Rc, { isect: false, shade: false });
    }
    M.callout('RIB TIP', n, pt(0, 0, 1), 1.0);
    M.callout('STRETCHER', n, [0, 0, zTop - 0.45 * Rc], 0.8);
  });
  M.part('SHAFT', () => {
    M.tube([0, 0, P.hook * 2.2], [0, 0, zTop + 0.22 * Rc], 0.03 * Rc);
    M.cyl(0.05 * Rc, zTop - 0.6 * Rc, zTop - 0.5 * Rc);                    // runner
    M.at(0, 0, zTop - 0.02, () => { M.cyl(0.06 * Rc, 0, 0.06 * Rc); M.cone(0.035 * Rc, 0.008 * Rc, 0.06 * Rc, 0.22 * Rc); });
    M.callout('FERRULE', 1, [0, 0, zTop + 0.15 * Rc], 1.0);
    M.callout('RUNNER', 1, [0, 0, zTop - 0.55 * Rc], 0.7);
  });
  // the hooked handle: a thick wooden J at the bottom
  M.part('HOOKED HANDLE', () => {
    const h = P.hook, r = 0.05 * Rc;
    const P2 = [[0, 0, h * 3.2], [0, 0, h * 1.6]];
    for (let i = 0; i <= 10; i++) { const f = Math.PI * i / 10; P2.push([-h + h * Math.cos(f), 0, h - h * Math.sin(f)]); }
    P2.push([-2 * h, 0, h * 1.4]);
    const S = T.sweep(M, P2.map(([x, y, z]) => [x, y, z + r]), r);
    T.sweepBand(M, S, 0, 1.3, r * 1.2);
    M.callout('HOOKED HANDLE', 1, [-h, 0, r * 1.5], 2.0);
  });
  // gondola around the shaft
  let pax = Math.round(Math.PI * Rc * Rc / 0.5 / 10) * 10;
  if (P.gondola) M.part('CREW GONDOLA', () => {
    const r = clamp(0.2 * Rc, 0.9, 1.4), h = 1.9, z0 = Math.max(P.hook * 3.4, Math.min(P.shaft * 0.36, zTop - drop - h - 0.3));
    const G = M.lathe([[0.2, z0], [r * 0.9, z0 + 0.05], [r, z0 + 0.3], [r, z0 + h], [r * 0.6, z0 + h + 0.3], [0, z0 + h + 0.32]], { sharpDeg: 30 });
    if (G.lat.on) {
      const Lt = G.lat;
      for (let i = 0; i < 8; i++) T.latWindow(M, Lt, i * 45 + 22.5, T.tZ([[0.2, z0], [r * 0.9, z0 + 0.05], [r, z0 + 0.3], [r, z0 + h]], z0 + h * 0.7), 2 * Math.PI * r / 8 * 0.55, h * 0.3, {});
      Lt.ring(T.tZ([[0.2, z0], [r * 0.9, z0 + 0.05], [r, z0 + 0.3], [r, z0 + h]], z0 + 0.35), { w: 1 });
      Lt.shade({ gap: 1.8, gapMax: 5 });
      Lt.text(ctx.unit, Math.atan2(e[1], e[0]) / D2R, 0.35, 0.3);
    }
    M.callout('CREW GONDOLA', 1, [Math.cos(Math.atan2(e[1], e[0])) * r, Math.sin(Math.atan2(e[1], e[0])) * r, z0 + h * 0.5], 2.0);
    for (let i = 0; i < 3; i++) { const a = i * 2.094; M.at(Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0, z0 + 0.2, () => M.rz(a / D2R, () => K.lamp(M, { r: 0.1 }))); }
  });
  return { main: [-Rc, -Rc, ctx.g.z + rib(1)[1] - scal, Rc, Rc, ctx.g.z + zTop], crew: P.gondola ? 2 : 1, pax };
}

// ================================================================== BIRDCAGE
const birdcage = {
  plan(M) {
    const s = M.pick([1, -1]);
    M.setView(s * M.r(30, 60), M.r(20, 28));
    const R = M.r(1.6, 3.4);
    const P = { R, hc: R * M.r(1.0, 1.5), dome: R * M.r(0.5, 0.95), n: M.pick([16, 20, 24]), cab: M.chance(0.8), swing: M.chance(0.75), cups: M.chance(0.7), round: true, rot: M.r(0, 20) };
    return { ...P, len: 2.15 * R, wid: 2.15 * R, hgt: 0.18 * R + P.hc + P.dome + 0.45 * R, mass: Math.round(R ** 3 * 0.25 * 10) / 10 };
  },
  build(M, P, ctx) { return buildCage(M, P, ctx); },
  words(P, ctx, res) {
    return {
      name: 'BIRDCAGE',
      places: ['AVIARY', 'GARDEN', 'BAZAAR', 'ZOO', 'ORCHARD', 'PALACE'],
      briefs: [
        (c) => `Takes ${wd(res.crew)} ${res.crew > 1 ? 'keepers' : 'keeper'} and ${res.birds} canaries to ${c.place} shows.`,
        (c) => `${cap(c.goes)} with the driver sitting on the perch.`,
        () => `Moves an aviary of ${res.birds} birds without opening the door.`,
      ].filter((f, i) => i !== 1 || P.cab),
      specs: [['BARS', String(P.n)], ['BIRDS', String(res.birds)], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildCage(M, P, ctx) {
  const { R, hc, dome, n } = P, g = ctx.g;
  const zb = 0.2 * R, zw = zb + hc, zt = zw + dome;
  const rb = clamp(0.012 * R, 0.025, 0.05);
  const aD = doorAngle(M, [], 0);
  let base;
  M.part('BASE TRAY', () => {
    const bp = [[0, 0], [R * 1.02, 0], [R * 1.07, 0.06 * R], [R * 1.07, 0.12 * R], [R * 1.02, zb], [0, zb]];
    base = M.lathe(bp, { sharpDeg: 30 });
    if (base.lat.on) {
      base.lat.ring(T.tIdx(bp, 2) + 0.03, { w: 1 });
      T.rivetRing(M, base.lat, T.tIdx(bp, 3) - 0.03, 80);
      base.lat.text(ctx.unit, aD + 30, T.tIdx(bp, 2.5) || 0.4, 0.08 * R);
      base.lat.shade({ gap: 2, gapMax: 6 });
    }
    T.portRow(M, base.lat, (T.tIdx(bp, 2) + T.tIdx(bp, 3)) / 2, 16, 0.025 * R, { skip: (a) => near(a, aD, 14) || near(a, aD + 30, 10) });
    if (base.top.on) { base.top.circle(0, 0, R * 0.95, { w: 0 }); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; base.top.line(Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2, Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, { w: 0 }); } }
    M.callout('BASE TRAY', 1, [Math.cos((aD + 40) * D2R) * R, Math.sin((aD + 40) * D2R) * R, 0.1 * R], 2.0);
  });
  // bars: up the wall, then over the dome to the top boss
  const bar = (a) => {
    const pts = [];
    pts.push([Math.cos(a) * R, Math.sin(a) * R, zb - 0.02]);
    pts.push([Math.cos(a) * R, Math.sin(a) * R, zw]);
    const rt = 0.14 * R;
    for (let i = 1; i <= 7; i++) { const th = i / 7 * Math.PI / 2; const r = rt + (R - rt) * Math.cos(th); pts.push([Math.cos(a) * r, Math.sin(a) * r, zw + dome * Math.sin(th)]); }
    return pts;
  };
  M.part('CAGE BAR', () => {
    for (let i = 0; i < n; i++) M.pipe(bar((P.rot + i * 360 / n) * D2R), rb, { isect: false, smoothBends: true });
    const ring = (r, z, rr) => { const pts = []; for (let i = 0; i <= 48; i++) { const a = 2 * Math.PI * i / 48; pts.push([Math.cos(a) * r, Math.sin(a) * r, z]); } M.pipe(pts, rr, { isect: false, smoothBends: true }); };
    ring(R, zb + 0.08 * R, rb * 1.8); ring(R, zb + hc * 0.55, rb * 1.4); ring(R, zw, rb * 2.2);
    const th = 0.5; ring(0.14 * R + (R - 0.14 * R) * Math.cos(th), zw + dome * Math.sin(th), rb * 1.4);
    M.callout('CAGE BAR', n, [Math.cos(aD * D2R + 0.3) * R, Math.sin(aD * D2R + 0.3) * R, zb + hc * 0.75], 2.2);
    M.callout('HOOP', 3, [Math.cos(aD * D2R - 0.4) * R, Math.sin(aD * D2R - 0.4) * R, zw], 1.0);
  });
  M.part('HANGING RING', () => {
    M.cyl(0.15 * R, zt - 0.02, zt + 0.05 * R);
    M.at(0, 0, zt + 0.05 * R, () => M.cone(0.08 * R, 0.04 * R, 0, 0.1 * R));
    const ry = 0.2 * R;
    M.at(0, 0, zt + 0.15 * R + ry, () => M.rz(Math.atan2(M.view.e[1], M.view.e[0]) / D2R + 90, () => M.rx(90, () => M.torus(ry, 0.025 * R + 0.02))));
    M.callout('HANGING RING', 1, [0, 0, zt + 0.15 * R + 2 * ry], 1.8);
  });
  // perch across, with the cab on it; swing from the dome
  const zp = zb + hc * 0.42;
  M.part('PERCH', () => {
    M.tube([0, -R * 1.0, zp], [0, R * 1.0, zp], 0.04 * R + 0.02);
    M.callout('PERCH', 1, [0, sideY(M) * R * 0.6, zp], 1.6);
  });
  if (P.cab) M.part('DRIVING CAB', () => {
    const w = 1.3, l = 1.5, h = 1.45;
    const C = M.box([-l / 2, -w / 2, zp + 0.04 * R], [l / 2, w / 2, zp + 0.04 * R + h]);
    for (const k of ['+x', '-x', '+y', '-y']) { const f = C.f(k); if (f.on) f.grid(1, 2, { gap: 2 }).forEach((r) => (r.j === 1 ? K.xWindow(f, r) : K.corrugated(f, r))); }
    const tf = C.f('+z'); if (tf.on) K.plain(tf, tf.box);
    for (const s of [1, -1]) M.box([-l * 0.3, s * 0.1 - 0.05, zp - 0.02 * R], [l * 0.3, s * 0.1 + 0.05, zp + 0.04 * R]);
    M.at(l / 2, 0, zp + 0.04 * R + h * 0.3, () => K.lamp(M, { r: 0.08 }));
    M.callout('DRIVING CAB', 1, [0, 0, zp + 0.04 * R + h], 2.4);
  });
  if (P.swing) M.part('SWING', () => {
    const zs = zb + hc * 0.8, w = 0.35 * R, a = (aD + 90) * D2R, c = [Math.cos(a) * 0.45 * R, Math.sin(a) * 0.45 * R];
    const dx = -Math.sin(a) * w, dy = Math.cos(a) * w;
    M.tube([c[0] - dx, c[1] - dy, zs], [c[0] + dx, c[1] + dy, zs], 0.025 * R);
    for (const s of [1, -1]) M.line([[c[0] + s * dx, c[1] + s * dy, zs], [s * dx * 0.2, s * dy * 0.2, zt - 0.02 * R]], { w: 1, pass: 1 });
    M.callout('SWING', 1, [c[0], c[1], zs], 1.2);
  });
  if (P.cups) M.part('SEED CUP', () => {
    for (const s of [1, -1]) { const a = (aD + s * 55) * D2R; M.with({ at: [Math.cos(a) * (R + 0.18 * R), Math.sin(a) * (R + 0.18 * R), zb + 0.35 * R], rz: a / D2R }, () => { const B = M.box([-0.17 * R, -0.2 * R, 0], [0.17 * R, 0.2 * R, 0.22 * R]); const f = B.f('+x'); if (f.on) K.plain(f, f.box); }); }
    M.callout('SEED CUP', 2, [Math.cos((aD + 55) * D2R) * 1.2 * R, Math.sin((aD + 55) * D2R) * 1.2 * R, zb + 0.5 * R], 1.0);
  });
  // the cage door: a framed opening in the bars, and a ladder down from it
  let fig = null;
  M.part('CAGE DOOR', () => {
    const a = aD * D2R, dw = clamp(0.45 * R, 0.8, 1.2), dh = clamp(0.55 * hc, 1.2, 2.0);
    const c = [Math.cos(a) * R * 1.01, Math.sin(a) * R * 1.01];
    const tx = -Math.sin(a), ty = Math.cos(a);
    const P0 = (u, z) => [c[0] + tx * u, c[1] + ty * u, z];
    M.pipe([P0(-dw / 2, zb + 0.02), P0(-dw / 2, zb + dh), P0(dw / 2, zb + dh), P0(dw / 2, zb + 0.02)], rb * 1.6, { isect: false });
    M.tube(P0(-dw * 0.1, zb + dh), P0(-dw * 0.1, zb + dh + 0.25), rb * 1.2, { isect: false });
    const zl = ladderZ(g);
    if (zl < 0 || zb > 0.5) {
      M.with({ at: [Math.cos(a) * (R * 1.07 + 0.35), Math.sin(a) * (R * 1.07 + 0.35), 0], rz: aD }, () => { M.at(0, 0, zl, () => K.ladder(M, { h: zb - zl + 0.9, w: 0.5 })); const f = M.W([0.9, 0.8, zl]); if (zl < 0) fig = [f[0], f[1]]; });
    }
    M.callout('CAGE DOOR', 1, P0(0, zb + dh * 0.9), 1.5);
  });
  return { main: [-R, -R, g.z, R, R, g.z + zt], figure: fig, crew: P.cab ? 1 : 2, birds: Math.round(R * R * 6) };
}

// ================================================================== CHESS ROOK
const rook = {
  plan(M) {
    const s = M.pick([1, -1]);
    M.setView(s * M.r(30, 60), M.r(20, 28));
    const R = M.r(1.4, 3.0);
    const P = { R, H: R * M.r(2.4, 3.0), merlons: M.pick([4, 5, 6]), flag: M.chance(0.5), slits: M.pick([4, 6, 8]), color: M.pick(['white', 'black']) };
    return { ...P, len: 2.2 * R, wid: 2.2 * R, hgt: P.H + (P.flag ? 1.2 * R : 0.1), mass: Math.round(R ** 3 * 2 * 10) / 10 };
  },
  build(M, P, ctx) { return buildRook(M, P, ctx); },
  words(P, ctx, res) {
    return {
      name: 'CHESS ROOK',
      places: ['TOURNAMENT', 'CASTLE', 'PARK', 'CLUB', 'CHAMPIONSHIP', 'BORDER'],
      briefs: [
        (c) => `Moves in straight lines only and carries ${wd(res.crew)} archers to ${c.place} games.`,
        (c) => `${cap(c.goes)} and castles once per game, on request.`,
        () => `Guards a corner of the board with ${P.slits} arrow slits and a crew of ${res.crew}.`,
      ],
      specs: [['MOVE', 'ANY FILE'], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildRook(M, P, ctx) {
  const { R, H } = P, g = ctx.g;
  const rt = 0.92 * R;
  const prof = [[0, 0], [1.08 * R, 0], [1.1 * R, 0.08 * R], [1.02 * R, 0.14 * R], [1.04 * R, 0.24 * R], [0.9 * R, 0.32 * R], [0.82 * R, 0.4 * R],
    [0.72 * R, 0.55 * R], [0.62 * R, H * 0.68], [0.7 * R, H * 0.72], [0.66 * R, H * 0.75], [rt, H * 0.82], [rt, H * 0.93], [rt * 0.8, H * 0.93], [rt * 0.8, H * 0.88], [0, H * 0.88]];
  const aD = doorAngle(M, [], 0);
  let S;
  M.part('TOWER', () => {
    S = M.lathe(prof, { sharpDeg: 25 });
    const L = S.lat;
    if (L.on) {
      const tq = (z) => T.tZ(prof, z);
      for (const i of [2, 4, 6, 9, 11]) L.ring(T.tIdx(prof, i), { w: 1 });
      // ashlar courses
      const t0 = T.tIdx(prof, 7), t1 = T.tIdx(prof, 8);
      const nc = 7;
      for (let k = 1; k < nc; k++) L.ring(t0 + (t1 - t0) * k / nc, { w: 0 });
      for (let k = 0; k < nc; k++) for (let i = 0; i < 12; i++) { const a = i * 30 + (k % 2 ? 15 : 0); if (!near(a, aD, 14)) L.meridian(a, t0 + (t1 - t0) * k / nc, t0 + (t1 - t0) * (k + 1) / nc, { w: 0 }); }
      L.shade({ t0: 0.02, t1: T.tIdx(prof, 12), gap: P.color === 'black' ? 1.4 : 2.0, gapMax: P.color === 'black' ? 3 : 7, threshold: P.color === 'black' ? 0.1 : 0.38 });
      for (let i = 0; i < P.slits; i++) { const a = i * 360 / P.slits + 360 / P.slits / 2; if (near(a, aD, 25)) continue; T.latWindow(M, L, a, tq(H * 0.5), 0.1 * R, 0.4 * R, {}); }
      L.text(ctx.unit, aD + 360 / P.slits / 2 + 30, tq(H * 0.22), 0.13 * R);
    }
    M.callout('TOWER', 1, [Math.cos((aD + 30) * D2R) * 0.7 * R, Math.sin((aD + 30) * D2R) * 0.7 * R, H * 0.4], 2.4);
    M.callout('ARROW SLIT', P.slits, [Math.cos((aD + 60) * D2R) * 0.68 * R, Math.sin((aD + 60) * D2R) * 0.68 * R, H * 0.5], 1.4);
    M.callout('FOOT MOLDING', 1, [Math.cos(aD * D2R) * 1.08 * R, Math.sin(aD * D2R) * 1.08 * R, 0.1 * R], 1.0);
  });
  M.part('BATTLEMENT', () => {
    const nm = P.merlons, z0 = H * 0.93;
    for (let i = 0; i < nm; i++) {
      const a0 = i * 360 / nm + 360 / nm * 0.22, a1 = (i + 1) * 360 / nm - 360 / nm * 0.22;
      const B = M.at(0, 0, 0, () => M.lathe([[rt * 0.8, z0 - 0.01], [rt, z0 - 0.01], [rt, H], [rt * 0.8, H]], { a0, a1, loop: true, sharpDeg: 20 }));
      if (B.lat.on) B.lat.shade({ gap: 2, gapMax: 6 });
    }
    M.callout('BATTLEMENT', nm, [Math.cos(aD * D2R) * rt, Math.sin(aD * D2R) * rt, H * 0.97], 2.0);
  });
  if (P.flag) M.part('FLAG', () => {
    M.tube([0, 0, H * 0.88], [0, 0, H + 1.2 * R], 0.03 * R);
    const fz = H + 1.2 * R;
    const fl = [[0, 0, fz - 0.05 * R], [0.6 * R, 0, fz - 0.15 * R], [0.55 * R, 0, fz - 0.3 * R], [0, 0, fz - 0.4 * R]];
    const F = M.plate(fl, {});
    void F;
    M.callout('FLAG', 1, [0.3 * R, 0, fz - 0.2 * R], 0.9);
  });
  const fig = crewDoor(M, S, prof, aD, 0.62 * R, Math.min(1.9, H * 0.25), g, { depth: 1.0, inset: 0.2 });
  return { main: S.bbox, figure: fig, crew: clamp(Math.round(R * 2), 2, 6) };
}

// ================================================================== PADLOCK
const padlock = {
  plan(M) {
    const s = M.pick([1, -1]);
    M.setView(90 * s + M.pick([1, -1]) * M.r(28, 42) + (M.chance(0.3) ? 180 : 0), M.r(20, 28));
    const W = M.r(2.4, 5.0);
    const P = { W, Hb: W * M.r(0.8, 1.0), Tb: W * M.r(0.38, 0.48), sh: W * M.r(0.55, 0.75), open: M.chance(0.25), rad: W * M.r(0.08, 0.18), lamps: M.chance(0.6) };
    return { ...P, len: W, wid: P.Tb, hgt: P.Hb + P.sh + (P.open ? 0.15 * W : 0), round: false, mass: Math.round(W * P.Hb * P.Tb * 2.5 * 10) / 10 };
  },
  build(M, P, ctx) { return buildPadlock(M, P, ctx); },
  words(P, ctx, res) {
    return {
      name: 'PADLOCK',
      places: ['VAULT', 'BANK', 'DEPOT', 'ARMORY', 'TREASURY', 'BONDED'],
      briefs: [
        (c) => `Carries ${res.cash} million in coin between ${c.place} branches and locks itself.`,
        (c) => `${cap(c.goes)}; the crew enters by the keyhole.`,
        () => `Locks a gate of up to ${Math.round(P.sh * 1.6 * 10) / 10} meters and stays to guard it.`,
      ],
      specs: [['SHACKLE', `${Math.round(P.sh * 1000)} MM`], ['LEVERS', String(res.levers)], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildPadlock(M, P, ctx) {
  const { W, Hb, Tb, rad } = P, g = ctx.g;
  const sy = sideY(M);
  // body: rounded rectangle in xz, thick along y
  const rr = rad, pr = [];
  const corner = (cx, cz, a0) => { for (let i = 0; i <= 4; i++) { const a = (a0 + 90 * i / 4) * D2R; pr.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]); } };
  corner(W / 2 - rr, rr, -90); corner(W / 2 - rr, Hb - rr, 0); corner(-W / 2 + rr, Hb - rr, 90); corner(-W / 2 + rr, rr, 180);
  let B;
  M.part('LOCK BODY', () => {
    B = M.extrude(pr, -Tb / 2, Tb / 2, { plane: 'xz', smoothDeg: 25 });
    for (const k of ['-y', '+y']) {
      const f = B.f(k);
      if (!f.on) continue;
      const fw = f.w, fh = f.h, m = f.mOf(6);
      f.path(pr.map(([x, z]) => [x * (1 - 2 * m / fw), (z - Hb / 2) * (1 - 2 * m / fh)]), { closed: true, w: 1 });
      // rivets in the corners, plates
      const ins = Math.max(rr * 0.8, f.mOf(10));
      f.rivets(-fw / 2 + ins, -fh / 2 + ins, fw / 2 - ins, -fh / 2 + ins, { pitch: 10 });
      f.rivets(-fw / 2 + ins, fh / 2 - ins, fw / 2 - ins, fh / 2 - ins, { pitch: 10 });
      f.line(-fw / 2 + ins, fh * 0.12, fw / 2 - ins, fh * 0.12, { w: 1 });
      K.stencil(f, ctx.des, 0, fh * 0.3, fh * 0.08);
      K.stencil(f, ctx.unit, -fw * 0.32, -fh * 0.2, fh * 0.1);
      if (f.tone > 0.35) f.hatch([-fw / 2 + m, -fh / 2 + m, fw / 2 - m, fh / 2 - m], { angle: 90, gap: 3.2 - 1.6 * f.tone, w: 0 });
    }
    M.callout('LOCK BODY', 1, [W * 0.3, sy * Tb / 2, Hb * 0.25], 2.4);
  });
  // the keyhole is the crew door
  let fig = null;
  M.part('KEYHOLE DOOR', () => {
    const f = B.f(sy > 0 ? '+y' : '-y');
    const kh = clamp(Hb * 0.4, 1.0, 2.0), kr = kh * 0.28;
    const cx = 0, cy = -Hb / 2 + 0.12 * Hb + kh - kr;
    if (f.on) {
      const hole = [];
      for (let i = 0; i <= 20; i++) { const a = (-60 + 300 * i / 20) * D2R; hole.push([cx + Math.cos(a) * kr, cy + Math.sin(a) * kr]); }
      hole.push([cx + kr * 0.55, cy - kh + kr], [cx - kr * 0.55, cy - kh + kr]);
      const sh = hole.map(([x, y]) => [x * 1.25, cy + (y - cy) * 1.15]);
      f.path(sh, { closed: true, w: 1 });
      glassPoly(f, hole);
    }
    const zs = 0.12 * Hb + 0.02;
    const foot = T.boardingAt(M, [0, sy * Tb / 2, zs], sy * 90, { depth: 1.0, width: 1.4, inset: 0.05, stayH: 1.2, zLadder: ladderZ(g) });
    if (ladderZ(g) < 0) fig = foot;
    M.callout('KEYHOLE DOOR', 1, [0, sy * Tb / 2, zs + kh * 0.6], 2.2);
  });
  // shackle: a U of round bar out of the top, the left leg free when open
  M.part('SHACKLE', () => {
    const r = 0.085 * W, xs = W / 2 - 0.22 * W, zt = Hb + P.sh, lift = P.open ? 0.15 * W : 0;
    const pts = [[xs, 0, Hb - 0.12 * W + lift], [xs, 0, zt - xs + lift]];
    for (let i = 1; i < 12; i++) { const a = Math.PI * i / 12; pts.push([Math.cos(a) * xs, 0, zt - xs + Math.sin(a) * xs + lift]); }
    pts.push([-xs, 0, zt - xs + lift], [-xs, 0, (P.open ? Hb + 0.05 * W : Hb - 0.12 * W) + lift]);
    const S = T.sweep(M, pts, r);
    void S;
    for (const s of [1, -1]) M.at(s * xs, 0, Hb, () => M.cyl(r * 1.35, -0.02, 0.06 * W));
    M.callout('SHACKLE', 1, [0, 0, zt + lift], 2.4);
  });
  M.part('TOP PLATE', () => {
    const tf = B.f('s' + 3);
    void tf;
    M.callout('LEVER HOUSING', 1, [-W * 0.3, sy * Tb / 2, Hb * 0.75], 1.0);
  });
  if (P.lamps) M.part('LAMP', () => {
    for (const s of [1, -1]) M.at(s * (W / 2 - 0.12 * W), sy * (Tb / 2 + 0.02), Hb * 0.88, () => M.rz(sy * 90, () => K.lamp(M, { r: 0.04 * W })));
    M.callout('LAMP', 2, [W / 2 - 0.12 * W, sy * Tb / 2, Hb * 0.88], 0.8);
  });
  return { main: B.bbox, figure: fig, crew: clamp(Math.round(W * 0.6), 1, 4), cash: Math.round(W * Hb * Tb * 4), levers: 5 + Math.round(W) };
}

// ================================================================== the class
const OBJ = { clock, bulb, hat, umbrella, birdcage, rook, padlock };

export default {
  id: 'oddment',
  family: 'ground',
  weight: 2,
  build(M) { return T.run(M, OBJ); },
};
