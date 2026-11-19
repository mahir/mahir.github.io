// classes/tableware.js: things from the table and the stove, built as machines at vehicle
// scale, on running gear from gear.js. Lathes, mostly: the art is in the profile and the
// attachments (spouts and handles are swept pipes). Objects: teapot, caydanlik (the Turkish
// double teapot), cezve, whistling kettle, bottle (standing or lying), samovar, tea glass on
// its saucer. Each has its own proportions and options; all get plate seams, rivet rows,
// portholes, a door with a platform and ladder, lamps and a stenciled number.

import * as K from '../kit.js';
import * as T from './parts-table.js';
import { dot, D2R } from '../geom.js';

// briefs quote round figures (two significant digits); the spec rows keep the exact ones
const r2 = (n) => Number(Number(n).toPrecision(2));
const sig = (n) => { const k = 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, n))) - 1); return Math.round(n / k) * k; };
const { clamp, wd, cap, thou, viewSide, doorAngle, near, volume, ladderZ, waterKinds, dress, crewDoor, sprof, loopHandle, sideY } = T;

// ------------------------------------------------------------------ shared bits
// ================================================================== TEAPOT
const teapot = {
  plan(M) {
    viewSide(M);
    const R = M.r(1.3, 3.1);
    const shape = M.wpick([[3, 'round'], [2, 'squat'], [2, 'tall']]);
    const spout = M.wpick([[4, 'S'], [1.5, 'straight'], [1.5, 'gooseneck']]);
    const handle = M.wpick([[4, 'loop'], [1.5, 'ear'], [1.3, 'bail']]);
    const knobK = M.pick(['ball', 'acorn', 'disk']);
    const lidH = M.r(0.22, 0.38);
    const nPorts = M.pick([10, 12, 14, 16]);
    const seams = M.pick([12, 16, 20, 24]);
    const rail = R > 1.8 && M.chance(0.7);
    const lamps = M.chance(0.75);
    const whip = M.chance(0.5);
    const cabWin = M.chance(0.6);
    const steam = M.chance(0.8);
    const sh = { round: [0.13, 0.62, 0.66, 1.38, 0.5], squat: [0.1, 0.66, 0.48, 1.02, 0.56], tall: [0.14, 0.7, 0.72, 1.55, 0.48] }[shape];
    const zb = sh[0] * R, rb = sh[1] * R, zm = sh[2] * R, zt = sh[3] * R, rt = sh[4] * R;
    const spoutReach = spout === 'gooseneck' ? 1.85 : spout === 'straight' ? 1.75 : 1.72;
    const handleReach = handle === 'bail' ? 1.0 : handle === 'ear' ? 1.42 : 1.5;
    const xMax = spoutReach * R, xMin = -handleReach * R;
    const H = zt + lidH * R + 0.45 * R + (handle === 'bail' ? 0.55 * R : 0);
    return {
      R, shape, spout, handle, knobK, lidH, nPorts, seams, rail, lamps, whip, cabWin, steam,
      zb, rb, zm, zt, rt, xMin, xMax, off: -(xMax + xMin) / 2,
      len: xMax - xMin, wid: 2 * R, hgt: H, mass: Math.round(R ** 3 * M.r(1.1, 1.6) * 10) / 10,
      spoutDz: M.r(-0.05, 0.08) * R, steamPh: M.r(0, 6),
    };
  },
  build(M, P, ctx) {
    const { R, zb, rb, zm, zt, rt } = P;
    let res = {};
    M.at(P.off, 0, 0, () => { res = buildTeapot(M, P, ctx); });
    return res;
  },
  words(P, ctx, res) {
    const lit = res.liters, cups = sig(lit / 0.2);
    const deg = 90 + Math.round(ctx.g.kind.length % 7);
    return {
      name: 'TEAPOT',
      places: ['HARBOR', 'MARKET', 'STATION', 'REGATTA', 'FERRY', 'DOCKYARD', 'PARADE'],
      briefs: [
        (c) => (waterKinds(ctx.g) ? `Serves tea for ${thou(cups)} at ${c.place} regattas and keeps it at ${deg} degrees.` : null),
        (c) => `Brings ${thou(r2(lit))} liters of tea to ${c.place} work crews twice a shift.`,
        (c) => `${cap(c.goes)} and pours ${thou(r2(cups / 6))} cups an hour.`,
        (c) => `Carries ${wd(res.crew)} stewards and tea for ${thou(cups)} to ${c.place} stations.`,
        (c) => `Keeps ${thou(r2(lit))} liters of tea at ${deg} degrees for ${c.place} night shifts.`,
      ],
      specs: [['CAPACITY', `${thou(lit)} L`], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};

function buildTeapot(M, P, ctx) {
  const { R, zb, rb, zm, zt, rt } = P;
  const g = ctx.g;
  const e = M.view.e;
  // ---- belly
  const prof = [[0, 0], [rb * 0.96, 0], [rb * 1.02, zb * 0.35], [rb * 0.97, zb], ...T.oval(R, zb, rb, zm, rt, zt, 9).slice(1)];
  let body;
  const aD = doorAngle(M, [0, 180], 42);
  const skip = (a) => near(a, 0, 20) || near(a, 180, 20) || near(a, aD, 16);
  M.part('BELLY TANK', () => {
    body = M.lathe(prof, { sharpDeg: 30 });
    const L = body.lat;
    const tFoot = T.tIdx(prof, 3), tTop = T.tIdx(prof, prof.length - 1);
    const tq = (z) => T.tZ(prof, z, z > zm);
    if (L.on) {
      L.ring(T.tIdx(prof, 2), { w: 1 });
      T.plates(M, L, {
        rings: [tq(zb + (zm - zb) * 0.45), tq(zm + (zt - zm) * 0.12), tq(zm + (zt - zm) * 0.62)],
        seams: P.seams, stagger: true, t0: tFoot, t1: tTop - 0.01, skip, st0: tFoot * 0.5,
      });
      L.text(ctx.unit, aD + (aD > 0 ? -38 : 38), tq(zm + (zt - zm) * 0.38), R * 0.13);
    }
    const nP = T.portRow(M, L, tq(zm + (zt - zm) * 0.37 - R * 0.02), P.nPorts, R * 0.075, { skip: (a) => near(a, 0, 26) || near(a, 180, 26) || near(a, aD, 22) || near(a, aD + (aD > 0 ? -38 : 38), 12) });
    if (top(body)) {
      const f = body.top;
      f.circle(0, 0, rt * 0.97, { w: 0 });
    }
    M.callout('BELLY TANK', 1, [R * Math.cos(aD * D2R + 0.5), R * Math.sin(aD * D2R + 0.5), zm * 0.8], 2.4);
    M.callout('VIEW PORT', P.nPorts, [R * 0.99 * Math.cos((aD + 30) * D2R), R * 0.99 * Math.sin((aD + 30) * D2R), zm + (zt - zm) * 0.35], 1.2);
    M.callout('FOOT RING', 1, [rb * Math.cos(aD * D2R), rb * Math.sin(aD * D2R), zb * 0.4], 0.9);
    void nP;
  });
  const capacity = Math.round(volume(prof) * 1000 * 0.8 / 10) * 10;

  // ---- door, platform, ladder
  const zS = zb + (zm - zb) * 0.25;
  const tS = T.tZ(prof, zS);
  const dh = clamp((zt - zS) * 0.55, 0.9, 1.95), dw = clamp(dh * 0.45, 0.55, 0.85);
  let figure = null;
  M.part('CREW DOOR', () => {
    T.latDoor(M, body.lat, aD, tS, dw, dh);
    M.callout('CREW DOOR', 1, [Math.cos(aD * D2R) * R, Math.sin(aD * D2R) * R, zS + dh * 0.5], 1.4);
  });
  {
    const r = T.rZ(prof, zS);
    const zl = ladderZ(g);
    const foot = T.boarding(M, aD, r, zS, { depth: clamp(R * 0.5, 0.9, 1.4), width: clamp(dw * 2.2, 1.2, 1.9), inset: R * 0.08, stayH: dh * 0.85, zLadder: zl });
    if (zl < 0) figure = foot;
  }

  // ---- lid: the crew hatch, with a cab band of windows and a knob
  const lidH = P.lidH * R;
  const lr = rt * 1.06;
  const zL = zt;
  M.part('LID HATCH', () => {
    const lp = [[lr, 0], [lr, 0.05 * R], [rt * 0.98, 0.07 * R]];
    const nL = 7;
    for (let i = 1; i <= nL; i++) { const th = i / nL * Math.PI / 2; lp.push([0.14 * R + (rt * 0.98 - 0.14 * R) * Math.cos(th), 0.07 * R + (lidH - 0.07 * R) * Math.sin(th)]); }
    lp.push([0, lidH]);
    const lid = M.at(0, 0, zL, () => M.lathe(lp, { sharpDeg: 32 }));
    const L = lid.lat;
    if (L.on) {
      L.ring(T.tIdx(lp, 1), { w: 1 });
      const tc = T.tIdx(lp, 4);
      if (P.cabWin) for (let i = 0; i < 10; i++) { const a = i * 36 + 18; if (!near(a, 180, 30)) T.latWindow(M, L, a, tc, rt * 0.3, lidH * 0.22, { bar: true }); }
      else for (let i = 0; i < 16; i++) L.meridian(i * 22.5, T.tIdx(lp, 2), 0.9, { w: 1 });
      T.rivetRing(M, L, T.tIdx(lp, 2) + 0.02, 28);
      L.shade({ t0: 0.02, t1: 0.95, gap: 1.6, gapMax: 5 });
    }
    // hinge at the handle side, grip at the spout side
    M.at(-lr, 0, zL + 0.03 * R, () => { M.boxc([0, 0, 0], [0.12 * R, 0.22 * R, 0.06 * R]); M.rx(90, () => M.cyl(0.03 * R, -0.13 * R, 0.13 * R, { isect: false })); });
    M.pipe([[lr * 0.92, -0.08 * R, zL + 0.06 * R], [lr * 1.08, -0.08 * R, zL + 0.06 * R], [lr * 1.08, 0.08 * R, zL + 0.06 * R], [lr * 0.92, 0.08 * R, zL + 0.06 * R]], 0.015 * R, { isect: false });
    M.callout('LID HATCH', 1, [0, 0, zL + lidH * 0.6], 2.2);
    if (P.cabWin) M.callout('CAB WINDOW', 8, [Math.cos(aD * D2R) * rt * 0.85, Math.sin(aD * D2R) * rt * 0.85, zL + lidH * 0.4], 1.3);
  });
  M.part('LID KNOB', () => {
    M.at(0, 0, zL + lidH - 0.01, () => T.knob(M, 0.11 * R, { kind: P.knobK }));
    M.callout('LID KNOB', 1, [0, 0, zL + lidH + 0.2 * R], 1.6);
  });
  if (P.whip) M.part('WHIP ANTENNA', () => {
    const a = (aD + 180 + 50) * D2R;
    M.at(Math.cos(a) * rt * 0.75, Math.sin(a) * rt * 0.75, zL + lidH * 0.45, () => K.whip(M, { h: R * 1.1, lean: 12 }));
    M.callout('WHIP ANTENNA', 1, [Math.cos(a) * rt * 0.75, Math.sin(a) * rt * 0.75, zL + lidH * 0.6], 0.6);
  });

  // ---- shoulder rail
  if (P.rail) M.part('SHOULDER RAIL', () => {
    const rr = rt + 0.22 * R;
    const z = zOn(prof, rr, zm);
    T.railRing(M, rr, z, { h: clamp(0.35 * R, 0.55, 1.0), r: 0.03, zAt: () => z });
    M.callout('SHOULDER RAIL', 1, [Math.cos(aD * D2R) * rr, Math.sin(aD * D2R) * rr, z + 0.5], 1.0);
  });

  // ---- spout
  let tip;
  M.part('SPOUT', () => {
    const zs = zb + (zm - zb) * 0.55 + P.spoutDz;
    let pts, r0 = 0.23 * R, r1 = 0.075 * R;
    if (P.spout === 'S') pts = T.bezier([0.72 * R, 0, zs], [1.38 * R, 0, zs + 0.22 * R], [1.2 * R, 0, zt - 0.12 * R], [1.72 * R, 0, zt + 0.16 * R], 16);
    else if (P.spout === 'straight') { pts = T.bezier([0.75 * R, 0, zs], [1.05 * R, 0, zs + 0.3 * R], [1.4 * R, 0, zt - 0.2 * R], [1.75 * R, 0, zt + 0.1 * R], 8); r0 = 0.2 * R; r1 = 0.09 * R; }
    else { pts = T.bezier([0.75 * R, 0, zs - 0.1 * R], [1.5 * R, 0, zs - 0.05 * R], [1.3 * R, 0, zt + 0.25 * R], [1.85 * R, 0, zt + 0.22 * R], 18); r0 = 0.17 * R; r1 = 0.06 * R; }
    const S = T.sweep(M, pts, (t) => r0 + (r1 - r0) * Math.pow(t, 0.7));
    T.sweepBand(M, S, S.rings.length - 1, 1.25, r1 * 1.2);
    T.sweepBand(M, S, Math.round(S.rings.length * 0.35), 1.12, r0 * 0.25);
    tip = pts[pts.length - 1];
    if (S.capB && S.capB.on) { S.capB.circle(0, 0, r1 * 0.6, { w: 1 }); S.capB.hatch(S.capB.poly, { angle: 45, gap: 1.2, w: 0 }); }
    M.callout('SPOUT EXHAUST', 1, pts[Math.round(pts.length * 0.6)], 2.0);
  });
  if (P.steam) M.part('STEAM', () => T.steam(M, [tip[0] + 0.05 * R, 0, tip[2] + 0.12 * R], { h: R * 1.3, drift: [0.45 * R, 0, 0], phase: P.steamPh, amp: R * 0.07 }));

  // ---- handle
  M.part('HANDLE', () => {
    let pts, r = 0.075 * R;
    const hx = (z) => -(T.rZ(prof, z) - 0.12 * R);
    if (P.handle === 'loop') pts = T.spline([[hx(zt - 0.06 * R), 0, zt - 0.06 * R], [-1.22 * R, 0, zt + 0.06 * R], [-1.5 * R, 0, zm + 0.12 * R], [-1.35 * R, 0, zb + 0.32 * R], [hx(zb + 0.25 * R), 0, zb + 0.25 * R]], 5);
    else if (P.handle === 'ear') pts = T.spline([[hx(zt - 0.09 * R), 0, zt - 0.09 * R], [-1.32 * R, 0, zt - 0.02 * R], [-1.42 * R, 0, zm], [-1.3 * R, 0, zb + 0.42 * R], [hx(zb + 0.36 * R), 0, zb + 0.36 * R]], 5);
    else {
      r = 0.05 * R;
      const zh = zt + P.lidH * R + 0.6 * R;
      pts = T.spline([[0, -rt * 1.2, zt - 0.06 * R], [0, -rt * 1.35, zt + 0.35 * R], [0, -rt * 0.8, zh - 0.05 * R], [0, 0, zh], [0, rt * 0.8, zh - 0.05 * R], [0, rt * 1.35, zt + 0.35 * R], [0, rt * 1.2, zt - 0.06 * R]], 5);
      for (const s of [1, -1]) M.at(0, s * rt * 1.2, zt - 0.1 * R, () => M.boxc([0, 0, 0], [0.12 * R, 0.1 * R, 0.16 * R]));
    }
    const S = T.sweep(M, pts, r);
    if (P.handle !== 'bail') {
      const n = S.rings.length;
      for (const i of [Math.round(n * 0.3), Math.round(n * 0.5), Math.round(n * 0.7)]) T.sweepBand(M, S, i, 1.15, r * 0.6);
      M.callout('HANDLE', 1, pts[Math.round(n * 0.45)], 1.7);
    } else M.callout('CARRYING BAIL', 1, pts[Math.round(pts.length * 0.5)], 1.7);
  });

  // ---- lamps flanking the spout
  if (P.lamps) M.part('HEADLAMP', () => {
    for (const s of [1, -1]) {
      const a = s * 32;
      const z = zm + (zt - zm) * 0.55, r = T.rZ(prof, z);
      M.with({ at: [Math.cos(a * D2R) * r * 0.98, Math.sin(a * D2R) * r * 0.98, z], rz: a }, () => K.lamp(M, { r: 0.07 * R }));
    }
    M.callout('HEADLAMP', 2, [Math.cos(32 * D2R) * R, Math.sin(32 * D2R) * (e[1] > 0 ? 1 : -1) * R, zm + (zt - zm) * 0.55], 1.1);
  });

  const crew = clamp(Math.round(R * 1.6 - 1), 1, 5);
  return { main: body.bbox, figure, crew, liters: capacity };
}
const top = (S) => S.top && S.top.on;
// height of the upper part of a profile at radius r (searching above zMin)
function zOn(prof, r, zMin) {
  for (let i = prof.length - 1; i > 0; i--) {
    const [r0, z0] = prof[i - 1], [r1, z1] = prof[i];
    if (z1 < zMin) break;
    if ((r - r0) * (r - r1) <= 0 && r0 !== r1) return z0 + (z1 - z0) * (r - r0) / (r1 - r0);
  }
  return prof[prof.length - 1][1];
}

// a dome lid with a band of cab windows, a hinge, a rivet ring, and a knob on top
function lidHatch(M, rt, R, zL, lidH, o = {}) {
  const lr = rt * 1.06;
  const lp = [[lr, 0], [lr, 0.05 * R], [rt * 0.98, 0.07 * R]];
  const k0 = Math.min(0.14 * R, rt * 0.3);
  for (let i = 1; i <= 7; i++) { const th = i / 7 * Math.PI / 2; lp.push([k0 + (rt * 0.98 - k0) * Math.cos(th), 0.07 * R + (lidH - 0.07 * R) * Math.sin(th)]); }
  lp.push([0, lidH]);
  M.part(o.part || 'LID HATCH', () => {
    const lid = M.at(0, 0, zL, () => M.lathe(lp, { sharpDeg: 32 }));
    const L = lid.lat;
    if (L.on) {
      L.ring(T.tIdx(lp, 1), { w: 1 });
      if (o.windows) for (let i = 0; i < o.windows; i++) { const a = (i + 0.5) * 360 / o.windows; if (!near(a, 180, 30)) T.latWindow(M, L, a, T.tIdx(lp, 4), rt * 0.28, lidH * 0.22, { bar: true }); }
      else for (let i = 0; i < 12; i++) L.meridian(i * 30, T.tIdx(lp, 2), 0.88, { w: 1 });
      T.rivetRing(M, L, T.tIdx(lp, 2) + 0.02, 24);
      L.shade({ t0: 0.02, t1: 0.95, gap: 1.8, gapMax: 6 });
    }
    M.at(-lr, 0, zL + 0.03 * R, () => M.boxc([0, 0, 0], [0.1 * R, 0.2 * R, 0.06 * R]));
    M.callout(o.label || 'LID HATCH', 1, [0, 0, zL + lidH * 0.6], 2.0);
  });
  M.part('LID KNOB', () => {
    M.at(0, 0, zL + lidH - 0.01, () => T.knob(M, Math.min(0.11 * R, rt * 0.25), { kind: o.knob || 'ball' }));
    M.callout('LID KNOB', 1, [0, 0, zL + lidH + 0.15 * R], 1.3);
  });
  return zL + lidH + Math.min(0.11 * R, rt * 0.25) * 2.4;
}
// ================================================================== CAYDANLIK
const caydanlik = {
  plan(M) {
    viewSide(M);
    const R1 = M.r(1.4, 2.7), H1 = R1 * M.r(0.95, 1.15), rn = R1 * M.r(0.52, 0.6);
    const R2 = rn * M.r(1.05, 1.25), H2 = R2 * M.r(1.05, 1.3);
    const lid = M.r(0.25, 0.38) * R2;
    const P = {
      R1, H1, rn, R2, H2, lid, knob: M.pick(['ball', 'acorn', 'disk']), ports: M.pick([12, 14, 16]),
      lamps: M.chance(0.7), rail: R1 > 1.8 && M.chance(0.65), steam: M.chance(0.85), steamPh: M.r(0, 6),
      win: M.chance(0.55), lowSpout: M.r(0.35, 0.5),
    };
    const z0u = H1 + 0.02 * R1;
    P.z0u = z0u;
    const xMax = 1.62 * R1, xMin = -1.42 * R1;
    P.off = -(xMax + xMin) / 2;
    return { ...P, len: xMax - xMin, wid: 2 * R1, hgt: z0u + H2 + lid + 0.3 * R2, mass: Math.round(R1 ** 3 * 1.6 * 10) / 10 };
  },
  build(M, P, ctx) { return M.at(P.off, 0, 0, () => buildCaydanlik(M, P, ctx)); },
  words(P, ctx, res) {
    const lit = res.liters, glasses = sig(res.brew / 0.1);
    return {
      name: ctx.r < 0.5 ? 'CAYDANLIK' : 'DOUBLE TEAPOT',
      places: ['FERRY', 'BAZAAR', 'BOSPHORUS', 'QUAYSIDE', 'MARKET', 'GARRISON', 'PIER'],
      briefs: [
        () => `Brews ${thou(r2(res.brew))} liters of tea upstairs and boils ${thou(r2(lit))} liters below.`,
        (c) => `Serves ${thou(r2(glasses))} tulip glasses a day to ${c.place} ferry passengers.`,
        (c) => `${cap(c.goes)} and keeps the brew strong for the 6 a.m. ferry.`,
        (c) => `Carries ${wd(res.crew)} tea makers and ${thou(r2(lit))} liters of water to ${c.place} crews.`,
      ],
      specs: [['CAPACITY', `${thou(lit)} + ${thou(res.brew)} L`], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildCaydanlik(M, P, ctx) {
  const { R1, H1, rn, R2, H2, z0u } = P, g = ctx.g;
  const aD = doorAngle(M, [0, 180], 42);
  // ---- the kettle below
  const sh = 0.7 * H1;
  const lower = [[0, 0], [0.9 * R1, 0], [0.97 * R1, 0.04 * R1], [R1, 0.14 * H1], [R1 * 1.01, 0.45 * H1], [0.99 * R1, sh]];
  for (let i = 1; i <= 6; i++) { const th = i / 6 * Math.PI / 2; lower.push([rn + (0.99 * R1 - rn) * Math.cos(th), sh + (H1 - sh) * Math.sin(th)]); }
  lower.push([rn, H1 + 0.1 * R1], [rn * 0.9, H1 + 0.1 * R1]);
  let S1, nP;
  M.part('BOILER KETTLE', () => {
    S1 = M.lathe(lower, { sharpDeg: 30 });
    nP = dress(M, S1, lower, {
      rings: [0.2 * H1, 0.48 * H1, sh + (H1 - sh) * 0.3], seams: 16, zTop: H1, t0: T.tIdx(lower, 2),
      skip: (a) => near(a, 0, 18) || near(a, 180, 18) || near(a, aD, 14),
      ports: { z: 0.62 * H1, n: P.ports, r: 0.07 * R1, skip: (a) => near(a, 0, 26) || near(a, 180, 26) || near(a, aD, 22) },
      number: { s: ctx.unit, a: aD + (aD > 0 ? -40 : 40), z: 0.34 * H1, h: 0.16 * R1 },
    });
    M.callout('BOILER KETTLE', 1, [Math.cos((aD + 25) * D2R) * R1, Math.sin((aD + 25) * D2R) * R1, 0.3 * H1], 2.4);
    M.callout('VIEW PORT', nP, [Math.cos((aD + 28) * D2R) * R1, Math.sin((aD + 28) * D2R) * R1, 0.62 * H1], 1.1);
  });
  const fig = crewDoor(M, S1, lower, aD, 0.08 * H1, 0.5 * H1, g, { depth: 1.1 });
  // ---- the teapot on top, sitting in the collar
  const upper = [[0, 0], [rn * 0.86, 0], [rn * 0.86, 0.1 * R1], ...T.oval(R2, 0.12 * R1, rn * 0.9, 0.12 * R1 + (H2 - 0.12 * R1) * 0.42, R2 * 0.52, H2, 8).slice(0)];
  let S2;
  M.part('BREWING POT', () => {
    S2 = M.at(0, 0, z0u, () => M.lathe(upper, { sharpDeg: 30 }));
    dress(M, S2, upper, {
      rings: [0.12 * R1 + (H2 - 0.12 * R1) * 0.42], seams: 12, zTop: H2, t0: T.tIdx(upper, 3),
      skip: (a) => near(a, 0, 20) || near(a, 180, 20),
      ports: P.win ? { z: 0.12 * R1 + (H2 - 0.12 * R1) * 0.55, n: 10, r: 0.06 * R2 * 1.3, skip: (a) => near(a, 0, 30) || near(a, 180, 30) } : null,
    });
    M.callout('BREWING POT', 1, [Math.cos(aD * D2R) * R2, Math.sin(aD * D2R) * R2, z0u + H2 * 0.45], 2.3);
  });
  const zTop = lidHatch(M, R2 * 0.52, R2, z0u + H2, P.lid, { knob: P.knob, windows: 0 });
  // ---- collar rail
  if (P.rail) M.part('SHOULDER RAIL', () => {
    const rr = rn + 0.3 * R1;
    const z = zOn(lower, rr, sh);
    T.railRing(M, rr, z, { h: 0.9, r: 0.03 });
    M.callout('SHOULDER RAIL', 1, [Math.cos(aD * D2R) * rr, Math.sin(aD * D2R) * rr, z + 0.6], 1.0);
  });
  // ---- spouts: a short straight one below, an S on the pot above
  let tip;
  M.part('SPOUT', () => {
    const z = P.lowSpout * H1;
    const pts = T.bezier([0.8 * R1, 0, z], [1.05 * R1, 0, z + 0.2 * R1], [1.3 * R1, 0, z + 0.42 * R1], [1.48 * R1, 0, z + 0.62 * R1], 6);
    const S = T.sweep(M, pts, (t) => 0.2 * R1 - 0.1 * R1 * t);
    T.sweepBand(M, S, S.rings.length - 1, 1.2, 0.08 * R1);
    M.callout('BOILER SPOUT', 1, pts[3], 1.4);
    const zs = z0u + 0.12 * R1 + (H2 - 0.12 * R1) * 0.3;
    const p2 = T.bezier([0.75 * R2, 0, zs], [1.35 * R2, 0, zs + 0.2 * R2], [1.15 * R2, 0, z0u + H2 - 0.1 * R2], [1.72 * R2, 0, z0u + H2 + 0.15 * R2], 14);
    const S2b = T.sweep(M, p2, (t) => 0.2 * R2 - 0.13 * R2 * Math.pow(t, 0.7));
    T.sweepBand(M, S2b, S2b.rings.length - 1, 1.25, 0.08 * R2);
    tip = p2[p2.length - 1];
    M.callout('BREW SPOUT', 1, p2[8], 1.6);
  });
  if (P.steam) M.part('STEAM', () => T.steam(M, [tip[0] + 0.05 * R2, 0, tip[2] + 0.1 * R2], { h: R2 * 1.4, drift: [0.4 * R2, 0, 0], phase: P.steamPh, amp: R2 * 0.08 }));
  // ---- one tall handle from the kettle up to the pot
  M.part('HANDLE', () => {
    const zA = 0.5 * H1, zB = z0u + H2 * 0.6;
    const hx1 = -(T.rZ(lower, zA) - 0.12 * R1), hx2 = -(T.rZ(upper, zB - z0u) - 0.28 * R2);
    const h = loopHandle(M, 0, [[hx1, 0, zA], [-1.25 * R1, 0, zA + 0.08 * R1], [-1.4 * R1, 0, H1 + 0.1 * R1], [-1.2 * R1, 0, zB + 0.2 * R2], [hx2 * 0.5 + (-R2 * 0.7) * 0.5, 0, zB + 0.04 * R2], [-R2 * 0.6, 0, zB]], 0.075 * R1);
    M.world(() => M.callout('HANDLE', 1, h.mid, 1.7));
  });
  if (P.lamps) M.part('HEADLAMP', () => {
    for (const s of [1, -1]) {
      const a = s * 34, z = 0.78 * H1, r = T.rZ(lower, z);
      M.with({ at: [Math.cos(a * D2R) * r * 0.98, Math.sin(a * D2R) * r * 0.98, z], rz: a }, () => K.lamp(M, { r: 0.07 * R1 }));
    }
    M.callout('HEADLAMP', 2, [Math.cos(34 * D2R) * R1, sideY(M) * Math.sin(34 * D2R) * R1, 0.78 * H1], 1.0);
  });
  void zTop;
  const liters = Math.round(volume(lower) * 800 / 10) * 10, brew = Math.round(volume(upper) * 800 / 10) * 10;
  return { main: S1.bbox.map((v, i) => (i === 5 ? Math.max(v, S2.bbox[5]) : v)), figure: fig, crew: clamp(Math.round(R1 * 1.5), 1, 5), liters, brew };
}

// ================================================================== CEZVE
const cezve = {
  plan(M) {
    viewSide(M, 60, 72);
    const R = M.r(1.0, 2.1), H = R * M.r(1.2, 1.45);
    const P = {
      R, H, rw: R * M.r(0.66, 0.76), zw: H * M.r(0.72, 0.8), lipK: M.r(1.1, 1.2),
      hl: R * M.r(2.3, 3.0), hAng: M.r(12, 22), cab: M.chance(0.5), steam: M.chance(0.7), steamPh: M.r(0, 6),
      ports: M.pick([10, 12, 14]), bands: M.ri(2, 3), rail: M.chance(0.7),
    };
    P.rl = P.rw * P.lipK;
    const xMax = P.rl + 0.5 * R, xMin = -(P.rw + P.hl * Math.cos(P.hAng * D2R) + (P.cab ? 0.8 : 0.3));
    P.off = -(xMax + xMin) / 2;
    const hgt = Math.max(H + 1.0, P.zw * 0.85 + P.hl * Math.sin(P.hAng * D2R) + (P.cab ? 1.2 : 0.3));
    return { ...P, len: xMax - xMin, wid: 2 * R, hgt, round: false, mass: Math.round(R ** 3 * 1.4 * 10) / 10 };
  },
  build(M, P, ctx) { return M.at(P.off, 0, 0, () => buildCezve(M, P, ctx)); },
  words(P, ctx, res) {
    const cups = sig(res.liters / 0.06);
    return {
      name: ctx.r < 0.55 ? 'CEZVE' : 'COFFEE POT',
      places: ['BAZAAR', 'CARAVAN', 'GALATA', 'HARBOR', 'MARKET', 'GARRISON'],
      briefs: [
        () => `Brews ${thou(r2(cups))} cups of Turkish coffee at once and serves them with foam.`,
        (c) => `Carries coffee for ${thou(cups)} to ${c.place} crews and pours it from the lip.`,
        (c) => `${cap(c.goes)}; the driver sits at the end of the handle.`,
        () => `Heats ${thou(r2(res.liters))} liters of coffee slowly so the foam rises once.`,
      ].filter((f, i) => i !== 2 || P.cab),
      specs: [['CAPACITY', `${thou(res.liters)} L`], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildCezve(M, P, ctx) {
  const { R, H, rw, zw, rl } = P, g = ctx.g;
  const t = 0.05 * R;
  const prof = [[0, 0], [R * 0.95, 0], [R, 0.05 * R]];
  for (let i = 1; i <= 8; i++) { const s = i / 8; prof.push([R - (R - rw) * Math.pow(s, 1.25), 0.05 * R + (zw - 0.05 * R) * s]); }
  for (let i = 1; i <= 5; i++) { const s = i / 5; prof.push([rw + (rl - rw) * s * s, zw + (H - zw) * s]); }
  const zf = H * 0.72;
  prof.push([rl - t, H + 0.01 * R], [rw * 1.02 - t, zw + (H - zw) * 0.3], [T.rZ(prof.slice(0, 12), zf) - t * 1.2, zf], [0, zf]);
  const aD = doorAngle(M, [0, 180], 40);
  let S;
  M.part('POT', () => {
    S = M.lathe(prof, { sharpDeg: 30 });
    const L = S.lat;
    if (L.on) {
      const tz = (z) => T.tZ(prof, z);
      // engraved bands and a hammered texture of rivet rings
      for (let b = 0; b < P.bands; b++) { const z = 0.18 * H + b * 0.17 * H; L.ring(tz(z), { w: 1 }); L.ring(tz(z + 0.03 * H), { w: 1 }); T.rivetRing(M, L, tz(z + 0.015 * H), 60, { px: 0.9 }); }
      L.ring(tz(zw), { w: 1 });
      for (let i = 0; i < 18; i++) { const a = (i + 0.5) * 20; if (!near(a, aD, 12) && !near(a, 180, 12)) L.meridian(a, tz(0.06 * R), tz(0.17 * H), { w: 1 }); }
      L.shade({ t0: 0.02, t1: tz(H) - 0.01, gap: 2.0, gapMax: 7, threshold: 0.38 });
      // the coffee: foam rings on the surface
      const n = prof.length;
      for (const k of [0.25, 0.5, 0.75]) L.ring(1 - (1 - T.tIdx(prof, n - 2)) * k, { w: 0 });
      L.text(ctx.unit, aD + (aD > 0 ? -45 : 45), tz(0.5 * H), 0.15 * R);
    }
    T.portRow(M, L, T.tZ(prof, 0.62 * H), P.ports, 0.065 * R, { skip: (a) => near(a, 180, 30) || near(a, 0, 20) || near(a, aD, 22) });
    M.callout('COPPER POT', 1, [Math.cos((aD + 30) * D2R) * R, Math.sin((aD + 30) * D2R) * R, 0.3 * H], 2.4);
    M.callout('COFFEE FOAM', 1, [0, 0, zf], 1.2);
    M.callout('ENGRAVED BAND', P.bands, [Math.cos((aD - 30) * D2R) * R * 0.95, Math.sin((aD - 30) * D2R) * R * 0.95, 0.19 * H], 0.8);
  });
  const fig = crewDoor(M, S, prof, aD, 0.06 * H, 0.42 * H, g, { depth: 1.0 });
  // ---- pouring lip: a V trough at +x
  M.part('POURING LIP', () => {
    const x0 = rl * 0.9, L = 0.42 * R, w = 0.3 * R;
    for (const s of [1, -1]) M.plate([[x0, s * w, H - 0.02 * R], [x0 + L, 0, H + 0.05 * R], [x0, 0, H - 0.2 * R]], { girth: 0.05 });
    M.callout('POURING LIP', 1, [x0 + L * 0.5, 0, H], 1.6);
  });
  if (P.rail) M.part('RIM RAIL', () => {
    T.railRing(M, rl * 0.96, H, { h: clamp(0.3 * R, 0.5, 0.9), r: 0.025 });
    M.callout('RIM RAIL', 1, [Math.cos(aD * D2R) * rl, Math.sin(aD * D2R) * rl, H + 0.4], 0.9);
  });
  if (P.steam) M.part('STEAM', () => T.steam(M, [0.2 * R, 0, zf + 0.2 * R], { h: R * 1.2, drift: [0.2 * R, 0, 0], phase: P.steamPh, amp: R * 0.07 }));
  // ---- the long handle: a riveted strap, then a wooden grip, the boom of the machine
  M.part('HANDLE BOOM', () => {
    const zh = zw * 0.88, a = P.hAng * D2R;
    const x0 = -(T.rZ(prof.slice(0, 12), zh) - 0.08 * R);
    const d = [-Math.cos(a), 0, Math.sin(a)];
    const at = (s) => [x0 + d[0] * s, 0, zh + d[2] * s];
    const sl = P.hl * 0.42;
    M.along(at(0), at(sl), (l) => {
      M.box([0, -0.09 * R, -0.03 * R], [l, 0.09 * R, 0.03 * R]);
      M.box([0, -0.16 * R, -0.18 * R], [0.12 * R, 0.16 * R, 0.18 * R]);
    });
    const grip = T.sweep(M, [at(sl - 0.1 * R), at(sl + (P.hl - sl) * 0.5), at(P.hl)], [0.1 * R, 0.12 * R, 0.13 * R]);
    T.sweepBand(M, grip, 0, 1.2, 0.18 * R);
    M.at(...at(P.hl), () => M.along([0, 0, 0], d, () => M.lathe([[0.13 * R, 0], [0.15 * R, 0.06 * R], [0.1 * R, 0.14 * R], [0, 0.16 * R]], { axis: 'x' })));
    M.callout('HANDLE BOOM', 1, at(sl * 0.6), 2.0);
    M.callout('WOODEN GRIP', 1, at(sl + (P.hl - sl) * 0.5), 1.2);
    const end = at(P.hl + 0.15 * R);
    if (P.cab) {
      M.part('DRIVING CAB', () => {
        const cw = 1.25, ch = 1.35, cl = 1.4;
        const C = M.box([end[0] - cl, -cw / 2, end[2] - 0.15], [end[0] + 0.1, cw / 2, end[2] - 0.15 + ch]);
        for (const k of ['+y', '-y', '-x']) { const f = C.f(k); if (f.on) { const gr = f.grid(k === '-x' ? 1 : 2, 2, { gap: 2 }); gr.forEach((r) => (r.j === 1 ? K.xWindow(f, r) : K.corrugated(f, r))); } }
        const tf = C.f('+z'); if (tf.on) K.plain(tf, tf.box);
        M.at(end[0] - cl / 2, 0, end[2] - 0.15 + ch, () => K.lamp(M, { r: 0.1 }));
        M.callout('DRIVING CAB', 1, [end[0] - cl / 2, 0, end[2] + ch * 0.5], 2.2);
      });
    } else {
      M.at(end[0], 0, end[2], () => M.ry(180, () => K.lamp(M, { r: 0.09 * R })));
    }
  });
  return { main: S.bbox, figure: fig, crew: P.cab ? 1 : clamp(Math.round(R * 1.4), 1, 3), liters: Math.round(volume(prof.slice(0, 12)) * 700 / 10) * 10 };
}

// ================================================================== WHISTLING KETTLE
const kettle = {
  plan(M) {
    viewSide(M);
    const R = M.r(1.3, 2.8), H = R * M.r(0.72, 0.95), rt = R * M.r(0.42, 0.52);
    const P = {
      R, H, rt, sAng: M.r(36, 50), sLen: R * M.r(0.85, 1.1), lid: R * M.r(0.12, 0.2), handleH: R * M.r(0.6, 0.85),
      ports: M.pick([12, 14, 16, 18]), lamps: M.chance(0.7), steam: M.chance(0.85), steamPh: M.r(0, 6), knob: M.pick(['ball', 'disk']),
      grip: M.chance(0.7),
    };
    const zs = H * 0.5, xs = R * 0.75;
    P.tip = [xs + Math.cos(P.sAng * D2R) * P.sLen + 0.2 * R, zs + Math.sin(P.sAng * D2R) * P.sLen];
    const xMax = Math.max(P.tip[0], R), xMin = -R;
    P.off = -(xMax + xMin) / 2;
    return { ...P, len: xMax - xMin, wid: 2 * R, hgt: Math.max(H + P.lid + P.handleH + 0.1 * R, P.tip[1] + 0.2 * R), mass: Math.round(R ** 3 * 1.0 * 10) / 10 };
  },
  build(M, P, ctx) { return M.at(P.off, 0, 0, () => buildKettle(M, P, ctx)); },
  words(P, ctx, res) {
    return {
      name: ctx.r < 0.6 ? 'WHISTLING KETTLE' : 'KETTLE',
      places: ['CAMP', 'DEPOT', 'SIDING', 'SHIPYARD', 'MILL', 'BARRACKS'],
      briefs: [
        (c) => `Boils ${thou(Number(res.liters.toPrecision(2)))} liters for ${c.place} canteens and whistles at the end of a shift.`,
        (c) => `${cap(c.goes)} and whistles at 100 degrees.`,
        (c) => `Brings boiling water to ${c.place} crews; the whistle is heard at ${res.km} km.`,
        () => `Boils ${thou(r2(res.liters))} liters in ${res.min} minutes and announces it.`,
      ],
      specs: [['CAPACITY', `${thou(res.liters)} L`], ['WHISTLE', `${res.db} DB`], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildKettle(M, P, ctx) {
  const { R, H, rt } = P, g = ctx.g;
  const zw = 0.22 * H;
  const prof = [[0, 0], [R * 0.88, 0], [R * 0.97, 0.025 * R], [R, 0.08 * R], [R, zw]];
  for (let i = 1; i <= 7; i++) { const s = i / 7; prof.push([R - (R - rt * 1.12) * s, zw + (0.93 * H - zw) * Math.sin(s * Math.PI / 2) ** 0.8]); }
  prof.push([rt * 1.05, H], [rt, H]);
  const aD = doorAngle(M, [0], 45);
  let S;
  M.part('BOILER', () => {
    S = M.lathe(prof, { sharpDeg: 30 });
    const n = dress(M, S, prof, {
      rings: [zw * 0.55, zw, zw + (H - zw) * 0.45], seams: 18, zTop: 0.96 * H, t0: T.tIdx(prof, 2),
      skip: (a) => near(a, 0, 16) || near(a, aD, 14),
      ports: { z: zw + (H - zw) * 0.25, n: P.ports, r: 0.06 * R, skip: (a) => near(a, 0, 26) || near(a, aD, 22) || near(a, 180, 14) },
      number: { s: ctx.unit, a: aD + (aD > 0 ? -45 : 45), z: zw * 0.55 + 0.02 * H, h: 0.11 * R },
    });
    M.callout('BOILER', 1, [Math.cos((aD + 30) * D2R) * R, Math.sin((aD + 30) * D2R) * R, zw * 0.5], 2.4);
    M.callout('VIEW PORT', n, [Math.cos((aD + 28) * D2R) * R * 0.85, Math.sin((aD + 28) * D2R) * R * 0.85, zw + (H - zw) * 0.25], 1.1);
  });
  const fig = crewDoor(M, S, prof, aD, 0.08 * R, Math.max(zw + (H - zw) * 0.15 - 0.1 * R, 0.9), g, { depth: 1.1 });
  lidHatch(M, rt * 0.95, R, H, P.lid, { knob: P.knob, windows: rt > 1 ? 8 : 0 });
  // ---- spout with the whistle cap
  let tip;
  M.part('SPOUT', () => {
    const zs = H * 0.5, a = P.sAng * D2R;
    const x0 = T.rZ(prof, zs) - 0.15 * R;
    const d = [Math.cos(a), 0, Math.sin(a)];
    const p0 = [x0, 0, zs], p1 = [x0 + d[0] * P.sLen, 0, zs + d[2] * P.sLen];
    const S1 = T.sweep(M, [p0, [(p0[0] + p1[0]) / 2, 0, (p0[2] + p1[2]) / 2], p1], [0.15 * R, 0.11 * R, 0.08 * R]);
    void S1;
    M.part('WHISTLE CAP', () => {
      M.along(p1, [p1[0] + d[0], 0, p1[2] + d[2]], () => {
        const C = M.lathe([[0.125 * R, -0.04 * R], [0.13 * R, 0.14 * R], [0.11 * R, 0.17 * R]], { axis: 'x', caps: true });
        if (C.top.on) { C.top.circle(0, 0, 0.03 * R, { w: 1 }); C.top.circle(0, 0, 0.06 * R, { w: 0 }); }
        M.box([-0.35 * R, -0.025 * R, 0.13 * R], [0.12 * R, 0.025 * R, 0.16 * R]);   // flip lever
        M.at(-0.35 * R, 0, 0.13 * R, () => M.box([-0.08 * R, -0.04 * R, 0], [0, 0.04 * R, 0.07 * R]));
      });
      tip = [p1[0] + d[0] * 0.18 * R, 0, p1[2] + d[2] * 0.18 * R];
      M.callout('WHISTLE CAP', 1, tip, 2.0);
    });
    M.callout('SPOUT', 1, [(p0[0] + p1[0]) / 2, 0, (p0[2] + p1[2]) / 2 + 0.1 * R], 1.5);
  });
  if (P.steam) M.part('STEAM', () => T.steam(M, [tip[0] + 0.1 * R, 0, tip[2] + 0.05 * R], { h: R * 1.0, drift: [0.5 * R, 0, 0.1 * R], phase: P.steamPh, amp: R * 0.06 }));
  // ---- arched top handle over the lid, front to back
  M.part('CARRYING HANDLE', () => {
    const rp = rt * 1.25, zp = zOn(prof, rp, zw), top = H + P.lid + P.handleH;
    const pts = T.spline([[-rp, 0, zp - 0.02 * R], [-rp * 1.05, 0, zp + 0.25 * R], [-rp * 0.7, 0, top - 0.06 * R], [0, 0, top], [rp * 0.7, 0, top - 0.06 * R], [rp * 1.05, 0, zp + 0.25 * R], [rp, 0, zp - 0.02 * R]], 5);
    const S2 = T.sweep(M, pts, 0.045 * R);
    void S2;
    if (P.grip) {
      const gp = T.spline([[-rp * 0.62, 0, top - 0.08 * R], [0, 0, top], [rp * 0.62, 0, top - 0.08 * R]], 6);
      const G2 = T.sweep(M, gp, 0.085 * R);
      for (const i of [0, 3, 6, 9, 12]) T.sweepBand(M, G2, i, 1.1, 0.03 * R);
    }
    for (const s of [1, -1]) M.at(s * rp, 0, zp - 0.05 * R, () => M.cone(0.1 * R, 0.06 * R, 0, 0.14 * R));
    M.callout('CARRYING HANDLE', 1, [0, 0, top + 0.05 * R], 1.8);
  });
  if (P.lamps) M.part('HEADLAMP', () => {
    for (const s of [1, -1]) {
      const a = s * 35, z = zw * 0.6, r = R;
      M.with({ at: [Math.cos(a * D2R) * r, Math.sin(a * D2R) * r, z], rz: a }, () => K.lamp(M, { r: 0.065 * R }));
    }
    M.callout('HEADLAMP', 2, [Math.cos(35 * D2R) * R, sideY(M) * Math.sin(35 * D2R) * R, zw * 0.6], 1.0);
  });
  const liters = Math.round(volume(prof) * 800 / 10) * 10;
  return { main: S.bbox, figure: fig, crew: clamp(Math.round(R * 1.3), 1, 4), liters, db: 90 + Math.round(R * 8), km: Math.round(R * 2), min: Math.round(6 + R * 4) };
}

// ================================================================== BOTTLE
const bottle = {
  plan(M) {
    const kind = M.wpick([[3, 'wine'], [2, 'milk']]);
    const lying = M.chance(kind === 'wine' ? 0.55 : 0.4);
    if (lying) { const s = M.pick([1, -1]); M.setView(s * M.r(55, 70) + (M.chance(0.4) ? 180 : 0), M.r(22, 30)); }
    else { const s = M.pick([1, -1]); M.setView(s * M.r(35, 55) + (M.chance(0.5) ? 180 : 0), M.r(22, 30)); }
    const R = kind === 'wine' ? M.r(0.8, 1.6) : M.r(0.9, 1.8);
    let prof;
    if (kind === 'wine') {
      const hb = R * M.r(2.1, 2.6), hs = R * M.r(0.8, 1.1), hn = R * M.r(1.2, 1.6), rn = R * M.r(0.3, 0.36);
      prof = [[0, 0], [R * 0.94, 0], [R, 0.06 * R], [R, hb]];
      for (let i = 1; i <= 7; i++) { const s = i / 7; prof.push([rn + (R - rn) * (1 + Math.cos(s * Math.PI)) / 2, hb + hs * s]); }
      const zn = hb + hs + hn;
      prof.push([rn * 0.94, zn], [rn * 1.12, zn + 0.02 * R], [rn * 1.12, zn + 0.12 * R], [rn * 0.85, zn + 0.13 * R]);
      var P = { hb, zn: zn + 0.13 * R, rn, cork: M.chance(0.6), capsule: M.chance(0.5) };
    } else {
      const hb = R * M.r(1.3, 1.7), hs = R * M.r(0.6, 0.8), rn = R * M.r(0.55, 0.65);
      prof = [[0, 0], [R * 0.9, 0], [R, 0.1 * R], [R * 0.97, hb]];
      for (let i = 1; i <= 6; i++) { const s = i / 6; prof.push([rn + (R * 0.97 - rn) * (1 + Math.cos(s * Math.PI)) / 2, hb + hs * s]); }
      const zn = hb + hs + 0.25 * R;
      prof.push([rn * 0.97, zn], [rn * 1.08, zn + 0.03 * R], [rn * 1.08, zn + 0.1 * R], [rn * 0.95, zn + 0.12 * R]);
      var P = { hb, zn: zn + 0.12 * R, rn, cork: false, capsule: false, crown: M.chance(0.5) };
    }
    const Ltot = P.zn + (P.cork ? 0.3 * R : 0.08 * R);
    Object.assign(P, { kind, lying, R, prof, Ltot, ports: M.ri(5, 9), lamps: M.chance(0.7), label: M.chance(0.85) ? 'big' : 'band' });
    const box = lying ? { len: Ltot, wid: 2 * R, hgt: 2 * R + 0.2 } : { len: 2 * R, wid: 2 * R, hgt: Ltot };
    return { ...P, ...box, round: !lying, kinds: lying ? { wings: 3, ringwing: 2, rockets: 2, wheels: 2, rails: 2, floats: 2, tracks: 1, balloons: 1, rotors: 1, skis: 1, legs: 1, hover: 1 } : undefined, mass: Math.round(R * R * Ltot * 0.9 * 10) / 10 };
  },
  build(M, P, ctx) { return buildBottle(M, P, ctx); },
  words(P, ctx, res) {
    const nm = P.kind === 'wine' ? 'WINE BOTTLE' : 'MILK BOTTLE';
    const L = res.liters;
    return {
      name: nm,
      places: P.kind === 'wine' ? ['VINEYARD', 'CELLAR', 'ESTATE', 'HARVEST', 'VALLEY'] : ['DAIRY', 'MORNING', 'DOORSTEP', 'VILLAGE', 'COUNTY'],
      briefs: P.kind === 'wine' ? [
        (c) => `Carries ${thou(r2(L))} liters of red and a sommelier to ${c.place} weddings.`,
        (c) => `${cap(c.goes)} with ${thou(r2(L))} liters of the year's vintage on board.`,
        () => `Takes the new vintage, ${thou(r2(L))} liters, from the press to the cellar in a day.`,
      ] : [
        (c) => `Delivers ${thou(Number(L.toPrecision(2)))} liters of milk to ${c.place} doorsteps before 6 a.m.`,
        (c) => `${cap(c.goes)} and returns the empties to the dairy.`,
        () => `Carries the morning milk, ${thou(r2(L))} liters, and ${wd(res.crew)} milkmen.`,
      ],
      specs: [['CAPACITY', `${thou(L)} L`], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildBottle(M, P, ctx) {
  const { R, prof, lying } = P, g = ctx.g;
  const e = M.view.e;
  let S, fig = null;
  // in the lathe's own frame: z along the bottle. Lying: the neck points +x, centered.
  const frame = (fn) => (lying ? M.at(-P.Ltot / 2, 0, R, () => M.ry(90, fn)) : fn());
  // angle on the lathe facing the viewer: standing about z; lying a = 0 is the bottom, 90 is +y
  const sy = e[1] >= 0 ? 1 : -1;
  const aFace = lying ? sy * (90 + Math.atan2(e[2], Math.abs(e[1])) / D2R * 0.4) : Math.atan2(e[1], e[0]) / D2R;
  const tz = (z) => T.tZ(prof, z);
  frame(() => M.part(P.kind === 'wine' ? 'BOTTLE HULL' : 'BOTTLE HULL', () => {
    S = M.lathe(prof, { sharpDeg: 28 });
    const L = S.lat;
    if (L.on) {
      L.ring(T.tIdx(prof, 2), { w: 1 });
      const rings = [0.12 * P.hb, P.hb * 0.98, P.hb + (P.zn - P.hb) * 0.25];
      T.plates(M, L, { rings: rings.map(tz), seams: lying ? 0 : 12, stagger: true, t0: T.tIdx(prof, 2), t1: tz(P.zn - 0.2 * R), skip: (a) => near(a, aFace, 50) });
      if (lying) for (let i = 0; i < 6; i++) { const a = 30 + i * 60; if (!near(a, aFace, 50)) L.meridian(a, T.tIdx(prof, 2), tz(P.hb), { w: 1 }); }
      // the label, lettered with the designation
      const lz0 = P.hb * (P.kind === 'wine' ? 0.32 : 0.28), lz1 = P.hb * (P.kind === 'wine' ? 0.8 : 0.78);
      const lw = Math.PI * R * (P.label === 'big' ? (lying ? 0.34 : 0.55) : 0.75), lh = lz1 - lz0, tm = tz((lz0 + lz1) / 2);
      const aL = lying ? aFace - sy * 14 : aFace;
      const Rc = (x, y) => [[-x, -y], [x, -y], [x, y], [-x, y]];
      if (P.label === 'big') {
        L.shape(aL, tm, Rc(lw / 2, lh / 2), { closed: true, w: 1 });
        L.shape(aL, tm, Rc(lw / 2 - M.px * 3, lh / 2 - M.px * 3), { closed: true, w: 0 });
        if (lying) {
          const dA = lw * 0.22 / R / D2R * sy;
          L.text(ctx.des, aL + dA * 0.3, tm, Math.min(lw * 0.3, lh * 0.14), { along: true });
          L.text(P.kind === 'wine' ? 'GRAND CRU' : 'PASTEURIZED', aL - dA * 1.2, tm, lw * 0.1, { along: true });
        } else {
          L.text(ctx.des, aL, tz(lz0 + lh * 0.58), lh * 0.16);
          L.text(P.kind === 'wine' ? 'GRAND CRU' : 'PASTEURIZED', aL, tz(lz0 + lh * 0.3), lh * 0.08);
          L.text(ctx.unit, aL, tz(lz0 + lh * 0.82), lh * 0.1);
        }
      } else {
        L.ring(tz(lz0), { w: 1 }); L.ring(tz(lz1), { w: 1 });
        L.text(ctx.des, aFace, tm, lh * 0.3);
      }
      // a row of windows (lying: along the fuselage, above the label) or a ring under the shoulder (standing)
      if (P.kind === 'wine' && P.capsule) { L.ring(tz(P.zn - 0.9 * R), { w: 1 }); L.hatch(aFace - 60, aFace + 60, tz(P.zn - 0.9 * R), 0.995, { gap: 2.4 }); }
      L.shade({ t0: 0.01, t1: 0.99, gap: 2.0, gapMax: 7, threshold: 0.38 });
    }
    // the cockpit / lantern windows on the shoulder
    const tw = tz(P.hb + (P.zn - P.hb) * 0.22);
    const nW = 4;
    for (let i = 0; i < nW; i++) T.latWindow(M, S.lat, (lying ? 180 : aFace) + (i - (nW - 1) / 2) * 26, tw, Math.PI * R * 0.12, R * 0.22, { bar: true });
    M.callout(lying ? 'COCKPIT GLAZING' : 'LANTERN WINDOW', nW, [0, 0, P.hb + (P.zn - P.hb) * 0.22], 1.6);
    M.callout(lying ? 'FUSELAGE' : 'BOTTLE HULL', 1, [0, 0, P.hb * 0.15], 2.0);
    M.callout('LABEL PANEL', 1, [0, 0, P.hb * 0.55], 2.3);
  }));
  // ports: lying, a line of cabin windows; standing, a ring
  frame(() => M.part('CABIN WINDOW', () => {
    if (lying) {
      const a = aFace + sy * 48;
      const n = P.ports;
      for (let i = 0; i < n; i++) T.latPort(M, S.lat, a, tz(P.hb * (0.12 + 0.82 * i / (n - 1))), 0.09 * R, {});
      M.callout('CABIN WINDOW', n, [0, 0, P.hb * 0.5], 1.2);
    } else {
      const k = T.portRow(M, S.lat, tz(P.hb * 0.9), 12, 0.07 * R, { skip: (a) => near(a, aFace, 40) });
      M.callout('VIEW PORT', k, [0, 0, P.hb * 0.9], 1.0);
    }
  }));
  // cork, foil or crown cap
  frame(() => M.part(P.cork ? 'CORK HATCH' : 'CAP HATCH', () => {
    const z = P.zn, rn = P.rn;
    if (P.cork) {
      const C = M.cyl(rn * 0.86, z - 0.1 * R, z + 0.3 * R);
      if (C.lat.on) { C.lat.ring(0.5, { w: 0 }); C.lat.shade({ gap: 1.6, gapMax: 4 }); }
      if (C.top.on) { C.top.circle(0, 0, rn * 0.55, { w: 1 }); K.stencil(C.top, ctx.unit, 0, 0, rn * 0.35); }
      M.callout('CORK HATCH', 1, [0, 0, z + 0.2 * R], 1.8);
    } else if (P.crown) {
      const n = 21, pr = [];
      const C = M.lathe([[rn * 1.12, z - 0.02 * R], [rn * 1.18, z + 0.08 * R], [rn * 1.0, z + 0.12 * R], [0, z + 0.13 * R]], { sharpDeg: 20 });
      if (C.lat.on) for (let i = 0; i < n; i++) C.lat.meridian(i * 360 / n, 0, 0.35, { w: 1 });
      void pr;
      M.callout('CROWN CAP', 1, [0, 0, z + 0.1 * R], 1.8);
    } else {
      const C = M.lathe([[rn * 1.14, z - 0.06 * R], [rn * 1.14, z + 0.04 * R], [rn * 1.05, z + 0.07 * R], [0, z + 0.07 * R]], { sharpDeg: 20 });
      if (C.lat.on) { for (let i = 0; i < 30; i++) C.lat.meridian(i * 12, 0, 0.3, { w: 0 }); }
      if (C.top.on) C.top.circle(0, 0, rn * 0.6, { w: 1 });
      M.callout('FOIL CAP', 1, [0, 0, z + 0.07 * R], 1.8);
    }
  }));
  // door and boarding
  if (lying) {
    const aDo = sy * 62, tD = tz(P.hb * 0.9);
    M.part('CREW DOOR', () => {
      if (S.lat.on) {
        const Rc = (x, y) => [[-x, -y], [x, -y], [x, y], [-x, y]];
        const dh = clamp(R * 0.9, 0.9, 1.9), dw = clamp(dh * 0.45, 0.5, 0.8);
        S.lat.shape(aDo, tD, Rc(dh / 2, dw / 2), { closed: true, w: 1 });
        S.lat.shape(aDo, tD, Rc(dh * 0.44, dw * 0.4), { closed: true, w: 1 });
        S.lat.shape(aDo + sy * dh * 0.22 / R / D2R, tD, Rc(dh * 0.12, dw * 0.28), { closed: true, w: 1 });
      }
      const pz = R - R * Math.cos(aDo * D2R) - 0.95 / 2 + 0.0;
      const xw = -P.Ltot / 2 + P.hb * 0.9;
      M.callout('CREW DOOR', 1, [xw, sy * R * Math.sin(Math.abs(aDo) * D2R), R - R * Math.cos(aDo * D2R)], 1.4);
      const zs = Math.max(0.15, pz - 0.2);
      const yr = Math.sqrt(Math.max(0, R * R - (R - zs) ** 2));
      const foot = T.boardingAt(M, [xw, sy * yr, zs], sy * 90, { depth: 1.1, width: 1.4, inset: 0.15, stayH: 1.4, zLadder: ladderZ(g) });
      if (ladderZ(g) < 0) fig = foot;
    });
  } else {
    fig = crewDoor(M, S, prof, ((aFace % 360) + 360) % 360, 0.12 * R, Math.min(0.85 * P.hb * 0.3, 1.9), g, { depth: 1.1 });
  }
  if (P.lamps) M.part('LAMP', () => {
    if (lying) { for (const s of [1, -1]) M.at(P.Ltot / 2 - (P.zn - P.hb) * 0.75, s * (P.rn + (R - P.rn) * 0.5) * 1.02, R, () => M.rz(s * 20, () => K.lamp(M, { r: 0.08 * R }))); }
    else M.at(0, 0, P.Ltot, () => { M.cyl(0.06 * R, 0, 0.3 * R); M.at(0, 0, 0.35 * R, () => M.sphere(0.09 * R)); });
    M.callout(lying ? 'LANDING LAMP' : 'MASTHEAD LAMP', lying ? 2 : 1, lying ? [P.Ltot / 2 - (P.zn - P.hb) * 0.75, sy * P.rn * 1.5, R] : [0, 0, P.Ltot + 0.35 * R], 0.9);
  });
  const liters = Math.round(volume(prof) * 850 / 100) * 100;
  return { main: S.bbox, figure: fig, crew: clamp(Math.round(R * 2), 1, 4), liters };
}

// ================================================================== SAMOVAR
const samovar = {
  plan(M) {
    viewSide(M, 50, 68);
    const R = M.r(1.0, 2.1);
    const P = { R, top: M.wpick([[3, 'teapot'], [2, 'chimney']]), base: M.r(0.6, 0.8), ports: M.pick([8, 10, 12]), feet: M.pick([3, 4]), steam: M.chance(0.85), steamPh: M.r(0, 6), shape: M.pick(['vase', 'barrel']) };
    P.z0 = P.base * R; P.zc = P.z0 + 1.72 * R;
    const hgt = P.zc + 0.3 * R + (P.top === 'teapot' ? 1.0 * R : 1.7 * R);
    const xMax = R + 0.9 * R, xMin = -R;
    P.off = -(xMax + xMin) / 2;
    return { ...P, len: xMax - xMin, wid: 2.7 * R, hgt, mass: Math.round(R ** 3 * 1.8 * 10) / 10 };
  },
  build(M, P, ctx) { return M.at(P.off, 0, 0, () => buildSamovar(M, P, ctx)); },
  words(P, ctx, res) {
    return {
      name: 'SAMOVAR',
      places: ['STATION', 'STEPPE', 'TRAIN', 'BAZAAR', 'GARDEN', 'WINTER'],
      briefs: [
        (c) => `Keeps ${thou(r2(res.liters))} liters hot for ${c.place} waiting rooms through the winter.`,
        (c) => `${cap(c.goes)} with ${thou(r2(res.liters))} liters of boiling water and a pot of tea on top.`,
        () => `Serves ${thou(Number((res.liters * 5).toPrecision(2)))} glasses of tea a day from one brass tap.`,
      ],
      specs: [['CAPACITY', `${thou(res.liters)} L`], ['FIREBOX', `${Math.round(P.R * 40)} KW`], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildSamovar(M, P, ctx) {
  const { R, z0, zc } = P, g = ctx.g;
  const fz = 0.12 * R;
  const base = [[0, fz], [0.8 * R, fz], [0.8 * R, fz + 0.06 * R], [0.7 * R, fz + 0.1 * R], [0.42 * R, fz + 0.2 * R], [0.3 * R, (fz + z0) * 0.55], [0.32 * R, z0 - 0.16 * R], [0.55 * R, z0 - 0.06 * R], [0.62 * R, z0]];
  const body = P.shape === 'vase'
    ? sprof([[0.62 * R, z0], [0.8 * R, z0 + 0.12 * R], [0.88 * R, z0 + 0.5 * R], [R, z0 + 1.05 * R], [0.95 * R, z0 + 1.38 * R], [0.62 * R, z0 + 1.6 * R], [0.42 * R, z0 + 1.68 * R]], 3)
    : [[0.62 * R, z0], [0.96 * R, z0 + 0.1 * R], [R, z0 + 0.3 * R], [R, z0 + 1.3 * R], [0.9 * R, z0 + 1.5 * R], [0.5 * R, z0 + 1.66 * R], [0.42 * R, z0 + 1.68 * R]];
  const prof = [...base, ...body.slice(1), [0.5 * R, zc - 0.05 * R], [0.56 * R, zc], [0.3 * R, zc], [0.3 * R, zc + 0.05 * R], [0, zc + 0.05 * R]];
  const aD = doorAngle(M, [0, 90, 270], 32);
  let S;
  M.part('URN', () => {
    S = M.lathe(prof, { sharpDeg: 30 });
    const tq = (z) => T.tZ(prof, z);
    const n = dress(M, S, prof, {
      rings: [z0 + 0.35 * R, z0 + 0.95 * R], seams: 16, t0: tq(z0 + 0.02 * R), zTop: z0 + 1.6 * R,
      skip: (a) => near(a, 0, 14) || near(a, 90, 14) || near(a, 270, 14) || near(a, aD, 14),
      ports: { z: z0 + 1.18 * R, n: P.ports, r: 0.085 * R, skip: (a) => near(a, 0, 20) || near(a, 90, 25) || near(a, 270, 25) },
      number: { s: ctx.unit, a: aD + (aD > 0 ? -40 : 40) + (near(aD + (aD > 0 ? -40 : 40), 90, 15) || near(aD + (aD > 0 ? -40 : 40), -90, 15) ? 20 : 0), z: z0 + 0.65 * R, h: 0.14 * R },
    });
    if (S.lat.on) { for (let i = 0; i < 24; i++) S.lat.meridian(i * 15, tq(fz + 0.07 * R), tq(fz + 0.2 * R), { w: 1 }); S.lat.ring(tq(z0 - 0.04 * R), { w: 1 }); }
    M.callout('URN', 1, [Math.cos((aD + 25) * D2R) * R, Math.sin((aD + 25) * D2R) * R, z0 + 0.6 * R], 2.4);
    M.callout('MEDAL PORT', n, [Math.cos((aD + 25) * D2R) * R * 0.9, Math.sin((aD + 25) * D2R) * R * 0.9, z0 + 1.18 * R], 1.1);
    M.callout('PEDESTAL', 1, [Math.cos(aD * D2R) * 0.4 * R, Math.sin(aD * D2R) * 0.4 * R, fz + 0.3 * R], 0.9);
  });
  M.part('FOOT', () => {
    for (let i = 0; i < P.feet; i++) { const a = (i + 0.5) * 2 * Math.PI / P.feet; M.at(Math.cos(a) * 0.66 * R, Math.sin(a) * 0.66 * R, 0, () => M.lathe([[0, 0], [0.09 * R, 0], [0.12 * R, 0.05 * R], [0.08 * R, fz + 0.01], [0, fz + 0.01]])); }
  });
  const fig = crewDoor(M, S, prof, aD, z0 + 0.05 * R, 0.9 * R, g, { depth: 1.0, inset: 0.25 });
  // ---- the tap
  M.part('BRASS TAP', () => {
    const z = z0 + 0.3 * R, x0 = T.rZ(prof, z) - 0.05 * R;
    M.tube([x0, 0, z], [x0 + 0.5 * R, 0, z], 0.085 * R);
    M.at(x0 + 0.08 * R, 0, z, () => M.ry(90, () => M.cyl(0.14 * R, 0, 0.06 * R)));
    M.at(x0 + 0.34 * R, 0, z, () => { M.sphere(0.13 * R); M.cyl(0.04 * R, 0.08 * R, 0.22 * R); M.boxc([0, 0, 0.26 * R], [0.06 * R, 0.34 * R, 0.08 * R]); });
    T.sweep(M, [[x0 + 0.48 * R, 0, z], [x0 + 0.62 * R, 0, z - 0.03 * R], [x0 + 0.7 * R, 0, z - 0.17 * R], [x0 + 0.7 * R, 0, z - 0.3 * R]], 0.06 * R);
    M.callout('BRASS TAP', 1, [x0 + 0.34 * R, 0, z + 0.12 * R], 2.0);
    M.at(x0 + 0.7 * R, 0, fz, () => M.cyl(0.2 * R, 0, 0.05 * R));
  });
  // ---- side handles
  M.part('SIDE HANDLE', () => {
    for (const s of [1, -1]) {
      const zA = z0 + 1.42 * R, zB = z0 + 1.05 * R;
      const h = loopHandle(M, s * 90, [[T.rZ(prof, zA) - 0.08 * R, 0, zA], [1.2 * R, 0, zA + 0.16 * R], [1.45 * R, 0, (zA + zB) / 2 + 0.08 * R], [1.3 * R, 0, zB + 0.02 * R], [T.rZ(prof, zB) - 0.06 * R, 0, zB]], 0.065 * R, { bands: true });
      if (s === sideY(M)) M.world(() => M.callout('SIDE HANDLE', 2, h.mid, 1.4));
    }
  });
  // ---- the crown: a teapot or a chimney
  let sp;
  if (P.top === 'teapot') {
    M.part('TEAPOT', () => {
      const r = 0.42 * R, z = zc + 0.05 * R;
      const tp = [[0, 0], [r * 0.6, 0], ...T.oval(r, 0.08 * r, r * 0.62, 0.5 * r, r * 0.5, 1.1 * r, 6).slice(0)];
      const Tp = M.at(0, 0, z, () => M.lathe(tp, { sharpDeg: 30 }));
      if (Tp.lat.on) { Tp.lat.ring(T.tZ(tp, 0.5 * r), { w: 1 }); Tp.lat.shade({ gap: 2, gapMax: 6, threshold: 0.38 }); }
      lidHatch(M, r * 0.5, r * 1.4, z + 1.1 * r, 0.3 * r, { part: 'TEAPOT LID', label: 'TEAPOT LID' });
      const sp0 = T.bezier([0.7 * r, 0, z + 0.35 * r], [1.3 * r, 0, z + 0.5 * r], [1.2 * r, 0, z + 1.0 * r], [1.65 * r, 0, z + 1.25 * r], 10);
      T.sweep(M, sp0, (t) => 0.2 * r - 0.12 * r * t);
      sp = sp0[sp0.length - 1];
      loopHandle(M, 180, [[-0.8 * r, 0, z + 0.95 * r], [-1.3 * r, 0, z + 1.0 * r], [-1.4 * r, 0, z + 0.5 * r], [-0.85 * r, 0, z + 0.25 * r]], 0.07 * r, { bands: false });
      M.callout('TEAPOT', 1, [0, 0, z + 0.6 * r], 1.9);
    });
  } else {
    M.part('CHIMNEY', () => {
      const z = zc + 0.05 * R, h = 1.5 * R;
      const C = M.cyl(0.2 * R, z, z + h);
      if (C.lat.on) { for (let i = 1; i < 4; i++) C.lat.ring(i / 4, { w: 1 }); C.lat.shade({ gap: 1.8, gapMax: 5 }); }
      M.at(0, 0, z + h, () => { M.cone(0.2 * R, 0.32 * R, 0, 0.12 * R); for (let i = 0; i < 4; i++) M.rz(i * 90 + 45, () => M.tube([0.28 * R, 0, 0.1 * R], [0.05 * R, 0, 0.32 * R], 0.02 * R)); M.at(0, 0, 0.3 * R, () => M.cone(0.42 * R, 0.05 * R, 0, 0.18 * R)); });
      sp = [0, 0, z + h + 0.55 * R];
      M.callout('CHIMNEY', 1, [0, 0, z + h * 0.6], 1.9);
    });
  }
  if (P.steam) M.part('STEAM', () => T.steam(M, [sp[0] + 0.04 * R, 0, sp[2] + 0.06 * R], { h: R * 1.1, drift: [0.35 * R, 0, 0], phase: P.steamPh, amp: R * 0.06 }));
  return { main: S.bbox, figure: fig, crew: clamp(Math.round(R * 1.6), 1, 4), liters: Math.round(volume(body) * 800 / 10) * 10 };
}

// ================================================================== TEA GLASS ON ITS SAUCER
const teaglass = {
  plan(M) {
    const s = M.pick([1, -1]);
    M.setView(s * M.r(30, 60) + (M.chance(0.5) ? 180 : 0), M.r(22, 28));
    const R = M.r(0.9, 1.9);
    const P = { R, H: R * M.r(2.1, 2.5), rs: R * M.r(1.9, 2.2), cubes: M.ri(0, 3), spoon: M.chance(0.8), steam: M.chance(0.8), steamPh: M.r(0, 6), tea: M.r(0.78, 0.86), rail: M.chance(0.8), spoonA: M.r(-40, 40) };
    return { ...P, len: 2 * P.rs * 1.04, wid: 2 * P.rs * 1.04, hgt: 0.16 * R + P.H, mass: Math.round(R ** 3 * 1.0 * 10) / 10 };
  },
  build(M, P, ctx) { return buildTeaGlass(M, P, ctx); },
  words(P, ctx, res) {
    return {
      name: ctx.r < 0.5 ? 'TEA GLASS' : 'TULIP TEA GLASS',
      places: ['BOSPHORUS', 'FERRY', 'BAZAAR', 'QUAYSIDE', 'COFFEEHOUSE', 'GARDEN'],
      briefs: [
        (c) => `Holds ${thou(r2(res.liters))} liters of tea, steeped dark, for ${c.place} passengers.`,
        (c) => `${cap(c.goes)}; the saucer is the deck and holds ${P.cubes ? wd(P.cubes) + ' sugar cubes' : 'the spoon'}.`,
        () => `Serves one glass of tea, ${thou(r2(res.liters))} liters, and refills it every 20 minutes.`,
      ],
      specs: [['CAPACITY', `${thou(res.liters)} L`], ['SUGAR', `${P.cubes} CUBES`], ['CREW', String(res.crew)], ['MASS', `${P.mass} T`]],
    };
  },
};
function buildTeaGlass(M, P, ctx) {
  const { R, H, rs } = P, g = ctx.g;
  const zs = 0.16 * R;
  // ---- saucer: the deck
  const sp = [[0, 0], [0.95 * R, 0], [1.0 * R, 0.05 * R], [1.15 * R, 0.09 * R], [1.8 * R, 0.2 * R], [rs, 0.3 * R], [rs * 1.02, 0.33 * R], [rs * 0.99, 0.35 * R], [rs * 0.92, 0.31 * R], [1.3 * R, zs + 0.02 * R], [1.1 * R, zs], [0, zs]];
  const e = M.view.e;
  const aF = Math.atan2(e[1], e[0]) / D2R;
  let Sd;
  M.part('SAUCER DECK', () => {
    Sd = M.lathe(sp, { sharpDeg: 25 });
    const L = Sd.lat;
    if (L.on) {
      L.ring(T.tIdx(sp, 3), { w: 1 });
      L.ring(T.tIdx(sp, 9) + 0.01, { w: 1 });
      L.ring(T.tIdx(sp, 10) + 0.005, { w: 1 });
      for (let i = 0; i < 32; i++) L.meridian(i * 360 / 32 + 5.6, T.tIdx(sp, 9) + 0.01, T.tIdx(sp, 10), { w: 0 });
      T.rivetRing(M, L, T.tIdx(sp, 4) + 0.01, 80);
      L.text(ctx.des, aF, (T.tIdx(sp, 4) + T.tIdx(sp, 5)) / 2, 0.06 * R);
      L.shade({ t0: T.tIdx(sp, 1), t1: T.tIdx(sp, 6), gap: 2.2, gapMax: 7, threshold: 0.4 });
    }
    T.portRow(M, L, (T.tIdx(sp, 3) + T.tIdx(sp, 4)) / 2 + 0.01, 14, 0.04 * R, { skip: (a) => near(a, aF, 12) });
    M.callout('SAUCER DECK', 1, [Math.cos((aF + 30) * D2R) * rs * 0.8, Math.sin((aF + 30) * D2R) * rs * 0.8, 0.26 * R], 2.2);
  });
  if (P.rail) M.part('DECK RAIL', () => {
    T.railRing(M, rs * 0.96, 0.33 * R, { h: clamp(0.25 * R, 0.5, 0.95), r: 0.025 });
    M.callout('DECK RAIL', 1, [Math.cos(aF * D2R) * rs, Math.sin(aF * D2R) * rs, 0.33 * R + 0.4], 1.0);
  });
  // boarding ladder up the saucer rim, in front
  let fig = null;
  M.part('ACCESS LADDER', () => {
    const a = aF + 35, ar = a * D2R;
    const top = 0.34 * R, zl = ladderZ(g);
    M.with({ at: [Math.cos(ar) * (rs + 0.25), Math.sin(ar) * (rs + 0.25), 0], rz: a }, () => {
      M.at(0, 0, zl, () => K.ladder(M, { h: top - zl + 0.9, w: 0.5 }));
      M.box([-0.3, -0.35, top - 0.06], [0.05, 0.35, top]);
      const f = M.W([0.9, 0.8, zl]); if (zl < 0) fig = [f[0], f[1]];
    });
    M.callout('ACCESS LADDER', 1, [Math.cos(ar) * (rs + 0.25), Math.sin(ar) * (rs + 0.25), top * 0.5 + zl * 0.5], 1.2);
  });
  // ---- the glass: tulip shaped, dark tea to near the rim
  const gp = sprof([[0.6 * R, 0], [0.66 * R, 0.07 * H], [0.9 * R, 0.19 * H], [R, 0.31 * H], [0.88 * R, 0.46 * H], [0.6 * R, 0.62 * H], [0.67 * R, 0.8 * H], [0.93 * R, H]], 3);
  const zt = P.tea * H, th = 0.035 * R;
  const outer = [[0, 0], ...gp];
  const inner = gp.filter((p) => p[1] > zt && p[1] < H).reverse().map(([r, z]) => [r - th, z]);
  const prof = [...outer, [0.93 * R - th, H], ...inner, [T.rZ(outer, zt) - th, zt], [0, zt]];
  let S;
  M.part('TEA GLASS', () => {
    S = M.at(0, 0, zs, () => M.lathe(prof, { sharpDeg: 30 }));
    const L = S.lat;
    if (L.on) {
      const tq = (z) => T.tZ(prof, z);
      L.ring(tq(0.07 * H), { w: 1 });
      L.ring(tq(zt), { w: 1 });
      // the tea seen through the glass: dense dark meridians, a highlight left clear
      const aL = Math.atan2(-M.light[1] + e[1] * 0, -M.light[0]) / D2R + 180;
      L.hatch(aL + 22, aL + 360 - 14, tq(0.075 * H), tq(zt), { gap: 1.25 });
      L.hatch(aL + 4, aL + 12, tq(0.075 * H), tq(zt), { gap: 2.6 });
      // empty glass above: two reflections
      for (const a of [aL + 8, aL + 16]) L.meridian(a, tq(zt) + 0.01, tq(H) - 0.01, { w: 0 });
      T.rivetRing(M, L, tq(0.62 * H), 40, { px: 0.8 });
      // the tea surface
      const n = prof.length;
      L.ring(1 - (1 - T.tIdx(prof, n - 2)) * 0.15, { w: 0 });
    }
    M.callout('TEA GLASS', 1, [Math.cos(aF * D2R) * R, Math.sin(aF * D2R) * R, zs + 0.3 * H], 2.6);
    M.callout('WAIST RING', 1, [Math.cos(aF * D2R) * 0.6 * R, Math.sin(aF * D2R) * 0.6 * R, zs + 0.62 * H], 1.0);
    M.callout('TEA', 1, [0, 0, zs + zt], 1.3);
  });
  if (P.steam) M.part('STEAM', () => T.steam(M, [0, 0, zs + zt + 0.3 * R], { h: R * 1.3, drift: [0.25 * R, 0.1 * R, 0], phase: P.steamPh, amp: R * 0.08 }));
  // ---- the spoon on the saucer, the sugar cubes
  if (P.spoon) M.part('TEASPOON', () => {
    const a = (aF + 75 * (P.spoonA > 0 ? 1 : -1) + P.spoonA * 0.3) * D2R, ca = Math.cos(a), sa = Math.sin(a);
    const pt = (r, z) => [ca * r, sa * r, z];
    const rb = 1.5 * R;
    M.at(...pt(rb, zs + 0.06 * R + 0.07 * R * 0.5), () => M.rz(a / D2R, () => M.scale(0.32 * R, 0.2 * R, 0.07 * R, () => M.sphere(1))));
    const zr = 0.36 * R;
    T.sweep(M, [pt(rb + 0.28 * R, zs + 0.1 * R), pt(1.85 * R, 0.27 * R), pt(rs * 0.98, zr + 0.03 * R), pt(rs * 1.25, zr + 0.08 * R)], [0.04 * R, 0.035 * R, 0.035 * R, 0.05 * R]);
    M.callout('TEASPOON', 1, pt(1.85 * R, 0.3 * R), 1.5);
  });
  if (P.cubes) M.part('SUGAR CUBE', () => {
    for (let i = 0; i < P.cubes; i++) {
      const a = (aF + 120 + i * 24) * D2R, c = 0.32 * R;
      const rr = 1.45 * R;
      M.with({ at: [Math.cos(a) * rr, Math.sin(a) * rr, zs + 0.03 * R + (T.rZ(sp, zs) ? 0 : 0)], rz: i * 17 + 10 }, () => {
        const B = M.box([-c / 2, -c / 2, 0], [c / 2, c / 2, c]);
        for (const k of ['+x', '-x', '+y', '-y', '+z']) { const f = B.f(k); if (f.on) { f.rivets(-c * 0.35, -c * 0.35, c * 0.35, c * 0.35, { pitch: 3 }); if (f.tone > 0.4) f.hatch(f.box, { angle: 45, gap: 3, w: 0 }); } }
      });
    }
    M.callout('SUGAR CUBE', P.cubes, [Math.cos((aF + 120) * D2R) * 1.45 * R, Math.sin((aF + 120) * D2R) * 1.45 * R, zs + 0.34 * R], 1.4);
  });
  return { main: [S.bbox[0], S.bbox[1], Sd.bbox[2], S.bbox[3], S.bbox[4], S.bbox[5]], figure: fig, crew: clamp(Math.round(R * 1.5), 1, 3), liters: Math.round(volume(outer.filter((p) => p[1] <= zt)) * 1000 / 10) * 10 };
}

// ================================================================== the class
const OBJ = { teapot, caydanlik, cezve, kettle, bottle, samovar, teaglass };

export default {
  id: 'tableware',
  family: 'ground',
  weight: 2,
  build(M) { return T.run(M, OBJ); },
};
