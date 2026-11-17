// classes/hydrofoil.js: a fast passenger or patrol craft risen on its foils. A slim V hull
// held clear of the water by a front foil (surface-piercing V or submerged T on struts) and a
// rear foil; a long glazed cabin with a raked windscreen; propellers on inclined shafts, a
// water jet, or an air propeller on a pylon. The parts under the water are drawn dashed;
// spray and wake where the struts cut the surface.

import * as K from '../kit.js';
import * as S from './parts-sea.js';
import { add, sub, mul, norm, cross, lerp } from '../geom.js';

const X = [1, 0, 0];

// a foil or strut of diamond section from a to b, chord along x; the part under the water is
// drawn as a dashed outline
function foil(M, a, b, c, t, o = {}) {
  const d = sub(b, a);
  let n = cross(d, X);
  n = norm(n[0] * n[0] + n[1] * n[1] + n[2] * n[2] < 1e-9 ? [0, 0, 1] : n);
  const sec = (p) => [add(p, mul(X, c * 0.45)), add(p, mul(n, t / 2)), add(p, mul(X, -c * 0.55)), add(p, mul(n, -t / 2))];
  const W = S.WZ;
  const za = a[2], zb = b[2];
  let a1 = a, b1 = b, under = null;
  if (za >= W && zb >= W) { /* all above */ } else if (za < W && zb < W) { under = [a, b]; a1 = null; } else {
    const q = (W - za) / (zb - za);
    const m = lerp(a, b, q);
    if (za >= W) { b1 = m; under = [m, b]; } else { a1 = m; under = [a, m]; }
  }
  let solid = null;
  if (a1) solid = M.loft(sec(a1), sec(b1), { isect: o.isect ?? false, w: o.w ?? 3 });
  if (under) {
    const [p, q] = under;
    const P = sec(p), Q = sec(q);
    const lines = [[P[0], Q[0]], [P[2], Q[2]]];
    if (o.endB !== false) lines.push([Q[0], Q[1], Q[2], Q[3], Q[0]]);
    S.underwater(M, lines);
  }
  return solid;
}

export default {
  id: 'hydrofoil',
  family: 'sea',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const job = M.wpick([[3, 'express'], [2, 'mail'], [1.5, 'customs'], [1.5, 'ambulance']]);
    const L = M.r(17, 32);
    const B = L * M.r(0.19, 0.23);
    const Fh = M.r(1.8, 2.4) * Math.sqrt(L / 24);
    const hk = M.r(1.0, 1.6) * Math.sqrt(L / 24);
    const front = M.wpick([[3, 'V'], [2, 'T']]);
    const rear = M.wpick([[3, 'flat'], [1, 'V']]);
    const drive = M.wpick([[3, 'props'], [1.5, 'jet'], [1.5, 'air']]);
    const nose = M.ri(3, 5);
    const ck = M.r(0.8, 0.9);
    const cabH = M.r(2.0, 2.5);
    const cab0 = -L * M.r(0.3, 0.38), cab1 = L * M.r(0.12, 0.22);
    const cabW = B * M.r(0.4, 0.46);
    const hump = M.chance(0.5);
    const winStyle = M.wpick([[2, 'band'], [2, 'single']]);
    const pane = M.r(0.9, 1.3);
    const side = M.pick([1, -1]);
    const endV = M.wpick([[3, 1], [2, -1]]);
    M.setView(endV > 0 ? side * M.r(50, 62) : side * (180 - M.r(50, 62)), M.r(17, 24));
    const near = side;
    const pool = [[2, 'radar'], [2, 'rails'], [2, 'rafts'], [1.5, 'bowLamp'], [2, 'steps'], [1.2, 'searchlight'], [1, 'flag'], [0.6, 'dinghy']];
    const nEq = M.ri(3, 5);
    const eq = new Set();
    let g = 0;
    while (eq.size < nEq && g++ < 40) eq.add(M.wpick(pool));
    if (job === 'customs') eq.add('searchlight');
    const ffx = L * M.r(0.18, 0.26), rfx = -L * M.r(0.3, 0.36);
    const vSpan = B * M.r(0.85, 1.15), vDip = M.r(0.9, 1.5);
    const tDepth = M.r(1.0, 1.6);
    const rafts = M.ri(2, 4);
    const pax = Math.round(L * L * M.r(0.12, 0.18) / 5) * 5;
    const knots = M.ri(32, 44);
    const kw = Math.round(L * L * M.r(2.6, 3.6) / 10) * 10;
    const mass = Math.round(L * B * Fh * M.r(0.35, 0.5));
    const place = M.pick({ express: ['LAKE', 'RIVER', 'STRAIT', 'LAGOON', 'BAY'], mail: ['ISLAND', 'ARCHIPELAGO', 'FJORD', 'COASTAL', 'LAKE'], customs: ['COASTAL', 'BORDER', 'STRAIT', 'HARBOR', 'ESTUARY'], ambulance: ['ISLAND', 'COASTAL', 'LAGOON', 'LAKE', 'DELTA'] }[job]);
    const unit = String(M.ri(3, 88));
    const stageX = -endV * L * M.r(0.15, 0.3), stageGap = M.r(5, 8);
    const rng = M.rng;

    const z0 = S.WZ + hk;
    // ------------------------------------------------ hull
    const H = S.hull(M, {
      L, B, F: Fh, z0, rake: L * M.r(0.07, 0.1), over: L * 0.015, stemA: M.r(1.3, 1.7), pb: M.r(1.5, 1.9), sb0: 0.4,
      stern: 'transom', ss0: 0.12, kt: 0.86, ktw: 0.9, wl: 0.1, wlk: 1, flare: 0.25, bulge: M.r(0.08, 0.14), tumble: 0,
      sheerBow: Fh * M.r(0.2, 0.35), sheerStern: Fh * 0.04, sm: 0.4, n: 30, m: 7,
    });
    M.info.mass = H.solid.bbox.slice();
    M.part('HULL', () => {
      S.plating(M, H, { rows: [0.32, 0.66], boot: false, frame: 2.6 });
      for (const sd of [1, -1]) S.runS(M, H, 0.3, 0.02, 0.96, sd, { w: 1 });  // spray rail line
      S.deckLines(M, H, { n: 5, pitch: 2.0 });
      S.hullText(M, H, unit, 0.8, 0.6, near, Fh * 0.26);
      M.callout('PLANING HULL', 1, H.P(0.6, 0.45, near), 0.6);
    });
    M.part('RUBBING STRAKE', () => S.strake(M, H, { t: 0.94, r: 0.07, s0: 0.0, s1: 0.96 }));

    // ------------------------------------------------ cabin
    const zc = H.deckMin(cab0, cab1) - 0.04;
    const xs = cab1 - cabW * 1.1;
    const plan = [[cab0, -cabW], [xs, -cabW]];
    for (let k = 1; k < nose; k++) { const a = -Math.PI / 2 + Math.PI * k / nose; plan.push([xs + Math.cos(a) * (cab1 - xs), Math.sin(a) * cabW]); }
    plan.push([xs, cabW], [cab0, cabW]);
    const cc = [(cab0 + cab1) / 2 - L * 0.04, 0];
    const top = plan.map(([x, y]) => [cc[0] + (x - cc[0]) * ck, cc[1] + y * (1 - (1 - ck) * 0.9)]);
    let CAB;
    M.part('PASSENGER CABIN', () => {
      CAB = M.frustum(plan, zc, top, zc + cabH, {});
      const nP = plan.length;
      for (let i = 0; i < nP; i++) {
        const f = CAB.f('s' + i);
        if (!f.on) continue;
        const isSide = i === 0 || i === nP - 2, isBack = i === nP - 1;
        const band = [-f.w / 2 + f.mOf(3), f.h * 0.0, f.w / 2 - f.mOf(3), f.h / 2 - f.mOf(3)];
        if (isSide) {
          // long side: a band of windows, a door near the stern, lettering under
          const doorX = f.w / 2 - 1.2;
          const xr = (i === 0) ? [-f.w / 2 + f.mOf(3), doorX - 0.7] : [-doorX + 0.7, f.w / 2 - f.mOf(3)];
          const dX = (i === 0) ? doorX : -doorX;
          const n = Math.max(2, Math.round((xr[1] - xr[0]) / pane));
          const pw = (xr[1] - xr[0]) / n;
          if (winStyle === 'band') {
            f.rect(xr[0], band[1], xr[1], band[3], { w: 1 });
            for (let k = 0; k < n; k++) {
              const r = [xr[0] + pw * k + f.mOf(1.5), band[1] + f.mOf(1.5), xr[0] + pw * (k + 1) - f.mOf(1.5), band[3] - f.mOf(1.5)];
              K.glass(f, [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]], { gap: 1.0, gap2: 2.2, flip: k % 2 === 1 });
            }
          } else {
            for (let k = 0; k < n; k++) {
              const r = [xr[0] + pw * k + pw * 0.12, band[1] + 0.05, xr[0] + pw * (k + 1) - pw * 0.12, band[3] - 0.05];
              const rad = Math.min(r[2] - r[0], r[3] - r[1]) * 0.25;
              const poly = [];
              for (const [cx, cy, a0] of [[r[2] - rad, r[1] + rad, -90], [r[2] - rad, r[3] - rad, 0], [r[0] + rad, r[3] - rad, 90], [r[0] + rad, r[1] + rad, 180]]) for (let q = 0; q <= 3; q++) { const a = (a0 + 30 * q) * Math.PI / 180; poly.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); }
              f.path(poly, { closed: true, w: 1 });
              K.glass(f, poly.map(([x, y]) => [x + (x < (r[0] + r[2]) / 2 ? 1 : -1) * f.mOf(1.4), y + (y < (r[1] + r[3]) / 2 ? 1 : -1) * f.mOf(1.4)]), { gap: 1.0, gap2: 2.2 });
            }
          }
          K.door(M, f, dX, -f.h / 2 + Math.min(1.9, f.h * 0.86) / 2 + 0.03, 0.75, Math.min(1.9, f.h * 0.86), {});
          // a belt line and shading under the windows
          f.line(-f.w / 2, band[1] - f.mOf(4), f.w / 2, band[1] - f.mOf(4), { w: 1 });
          if (f.tone > 0.2) f.hatch([-f.w / 2, -f.h / 2 + f.mOf(2), f.w / 2, band[1] - f.mOf(6)], { angle: 0, gap: 3.8 - 2 * f.tone, w: 0, holes: [[dX - 0.5, -f.h / 2, dX + 0.5, f.h / 2]] });
          const word0 = { express: 'EXPRESS', mail: 'ROYAL MAIL', customs: 'CUSTOMS', ambulance: 'AMBULANCE' }[job];
          K.stencil(f, word0, (xr[0] + xr[1]) / 2, -f.h * 0.28, Math.min(f.h * 0.16, (xr[1] - xr[0]) / f.textWidth(word0, 1) * 0.6));
        } else if (isBack) {
          f.rect(-f.w / 2 + f.mOf(3), -f.h / 2 + f.mOf(3), f.w / 2 - f.mOf(3), f.h / 2 - f.mOf(3), { w: 0 });
          K.door(M, f, 0, -f.h / 2 + Math.min(1.9, f.h * 0.86) / 2 + 0.03, 0.9, Math.min(1.9, f.h * 0.86), {});
          for (const sx of [-1, 1]) { const r = [sx * f.w * 0.3 - f.w * 0.1, 0, sx * f.w * 0.3 + f.w * 0.1, f.h * 0.35]; f.rect(r, { w: 1 }); K.glass(f, [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]], { gap: 1.0, gap2: 2.4 }); }
        } else {
          // nose facets: windscreen panes, frame bars
          const r = [-f.w / 2 + f.mOf(2.5), -f.h * 0.1, f.w / 2 - f.mOf(2.5), f.h / 2 - f.mOf(2.5)];
          f.rect(r, { w: 1 });
          K.glass(f, [[r[0] + f.mOf(1.5), r[1] + f.mOf(1.5)], [r[2] - f.mOf(1.5), r[1] + f.mOf(1.5)], [r[2] - f.mOf(1.5), r[3] - f.mOf(1.5)], [r[0] + f.mOf(1.5), r[3] - f.mOf(1.5)]], { gap: 0.9, gap2: 1.9, flip: i % 2 === 1 });
          if (f.tone > 0.2) f.hatch([-f.w / 2, -f.h / 2 + f.mOf(2), f.w / 2, r[1] - f.mOf(3)], { angle: 0, gap: 3.8 - 2 * f.tone, w: 0 });
        }
      }
      const rt = CAB.f('b');
      if (rt.on) {
        rt.path(rt.poly.map(([x, y]) => [x * 0.94, y * 0.86]), { closed: true, w: 0 });
        const n = Math.max(3, Math.round(rt.w / 1.2));
        for (let k = 1; k < n; k++) { const x = -rt.w / 2 + rt.w * k / n; if (rt.contains(x, 0)) rt.line(x, -rt.h * 0.43, x, rt.h * 0.43, { w: 0 }); }
        if (job === 'ambulance') {
          const c = -rt.w * 0.1, q = rt.h * 0.1, Q = rt.h * 0.3;
          const cr = [[c - q, -Q], [c + q, -Q], [c + q, -q], [c + Q, -q], [c + Q, q], [c + q, q], [c + q, Q], [c - q, Q], [c - q, q], [c - Q, q], [c - Q, -q], [c - q, -q]];
          rt.path(cr, { closed: true, w: 1 }); rt.hatch(cr, { angle: 45, gap: 1.3, w: 0 });
        }
      }
      M.callout('PASSENGER CABIN', 1, [cab0 + (cab1 - cab0) * 0.35, near * cabW, zc + cabH * 0.4], 2.4);
      M.callout('WINDSCREEN', 1, [cab1 - 0.2, 0, zc + cabH * 0.75], 1.4);
    });
    const roofZ = zc + cabH;
    const topX = (x) => cc[0] + (x - cc[0]) * ck; // roof x of a plan x
    const roofX0 = topX(cab0), roofX1 = topX(cab1);
    const roofW = cabW * (1 - (1 - ck) * 0.9);
    let bridgeTop = roofZ;
    if (hump) {
      M.part('WHEELHOUSE', () => {
        const bx1 = roofX1 - 0.5, bx0 = bx1 - Math.min(3.2, (roofX1 - roofX0) * 0.3);
        const bw = roofW * 0.7, bh = 1.2;
        const WH = S.wheelhouse(M, { x0: bx0, x1: bx1, hw: bw, z: roofZ - 0.05, h: bh, front: 'facet', lean: 0.15, facet: 0.7, pane: 0.8, overhang: 0.12 });
        bridgeTop = WH.roofZ;
        M.callout('WHEELHOUSE', 1, [bx1, 0, roofZ + bh * 0.7], 2);
      });
    }

    // ------------------------------------------------ foils
    const keelAt = (x) => { const s = H.sOf(x); return H.P(s, 0, 1); };
    const hullSide = (x, t, sd) => { const s = H.sOf(x - (H.xD(H.sOf(x)) - H.xW(H.sOf(x))) * t); return H.P(s, t, sd); };
    const W = S.WZ;
    const chord = Math.max(0.5, L * 0.03);
    const pierce = [];
    M.part('FRONT FOIL', () => {
      if (front === 'V') {
        const zc2 = W - vDip, tipY = vSpan, tipZ = W + 0.55;
        for (const sd of [1, -1]) {
          const tip = [ffx, sd * tipY, tipZ], ctr = [ffx, 0, zc2];
          foil(M, tip, ctr, chord, chord * 0.12);
          // the tip strut up to the hull side
          const hp = hullSide(ffx, 0.35, sd);
          foil(M, [ffx, sd * tipY * 0.98, tipZ - 0.05], [hp[0], hp[1] * 0.96, hp[2]], chord * 0.8, chord * 0.14, { isect: true });
          // a brace from the arm to the keel
          const mid = lerp(tip, ctr, 0.35);
          if (mid[2] > W) foil(M, mid, [ffx, sd * 0.1, z0 + 0.05], chord * 0.5, chord * 0.1, { isect: true });
          // where the arm cuts the water
          const q = (W - tipZ) / (zc2 - tipZ);
          pierce.push(lerp(tip, ctr, q));
        }
        // the center strut, mostly under water
        foil(M, [ffx, 0, z0 + 0.05], [ffx, 0, zc2], chord * 0.8, chord * 0.12, { isect: true });
        pierce.push([ffx, 0, W]);
      } else {
        const zf = W - tDepth;
        for (const sd of [1, -1]) {
          const hp = hullSide(ffx, 0.12, sd);
          foil(M, [ffx, hp[1] * 0.9, hp[2] + 0.1], [ffx, sd * B * 0.28, zf], chord, chord * 0.14, { isect: true, endB: false });
          pierce.push([ffx, sd * (B * 0.28 + (hp[1] * 0.9 - sd * B * 0.28) * (zf - W) / (zf - hp[2])), W]);
        }
        foil(M, [ffx, -B * 0.55, zf], [ffx, B * 0.55, zf], chord * 1.1, chord * 0.12);
      }
      M.callout('FRONT FOIL', 1, pierce[0], 2.6);
      M.callout('FOIL STRUT', 4, lerp(hullSide(ffx, 0.3, near), [ffx, near * B * 0.3, W], 0.5), 2);
    });
    M.part('REAR FOIL', () => {
      const zf = W - tDepth * 0.9;
      if (rear === 'flat') {
        for (const sd of [1, -1]) {
          const hp = hullSide(rfx, 0.1, sd);
          foil(M, [rfx, hp[1] * 0.85, hp[2] + 0.1], [rfx, sd * B * 0.36, zf], chord, chord * 0.14, { isect: true, endB: false });
          pierce.push([rfx, sd * B * 0.33, W]);
        }
        foil(M, [rfx, -B * 0.48, zf], [rfx, B * 0.48, zf], chord, chord * 0.12);
      } else {
        for (const sd of [1, -1]) {
          const tip = [rfx, sd * B * 0.62, W + 0.4], ctr = [rfx, 0, zf];
          foil(M, tip, ctr, chord, chord * 0.12);
          const hp = hullSide(rfx, 0.35, sd);
          foil(M, [rfx, sd * B * 0.6, W + 0.35], [hp[0], hp[1] * 0.95, hp[2]], chord * 0.8, chord * 0.14, { isect: true });
          pierce.push(lerp(tip, ctr, (W - tip[2]) / (zf - tip[2])));
        }
      }
      M.callout('REAR FOIL', 1, [rfx, near * B * 0.36, W + 0.3], 2.2);
    });
    // ------------------------------------------------ drive
    M.part(drive === 'air' ? 'AIR PROPELLER' : drive === 'jet' ? 'WATER JET' : 'PROPELLER SHAFT', () => {
      if (drive === 'props') {
        for (const sd of [1, -1]) {
          const a = [rfx + L * 0.16, sd * B * 0.12, z0 + 0.1], b = [rfx - L * 0.06, sd * B * 0.2, W - tDepth * 0.95];
          const q = (W - a[2]) / (b[2] - a[2]);
          const m = lerp(a, b, q);
          M.tube(a, m, 0.07, { isect: true });
          S.underwater(M, [[m, b]]);
          // propeller disk under water: a dashed ellipse
          const pr = 0.45 * Math.sqrt(L / 24), c = b;
          const ring = [];
          for (let k = 0; k <= 16; k++) { const t = 2 * Math.PI * k / 16; ring.push([c[0], c[1] + Math.cos(t) * pr, c[2] + Math.sin(t) * pr]); }
          S.underwater(M, [ring]);
          pierce.push([m[0], m[1], W]);
        }
        M.callout('PROPELLER SHAFT', 2, [rfx + L * 0.12, near * B * 0.13, z0 - 0.2], 1.6);
      } else if (drive === 'jet') {
        const x = H.xaD;
        for (const sd of [1, -1]) {
          const p = H.P(0.0, 0.2, sd);
          M.at(x + 0.05, sd * Math.min(Math.abs(p[1]) * 0.5, 0.6), p[2], () => M.ry(-90, () => { M.cone(0.3, 0.22, 0, 0.6); M.cone(0.24, 0.18, 0.6, 0.75, { isect: false }); }));
          // the jet: a fan of lines falling to the water
          for (let j = 0; j < 4; j++) {
            const pts = [];
            for (let k = 0; k <= 10; k++) { const q = k / 10; pts.push([x - 0.7 - q * 4.5, sd * (0.4 + q * (0.2 + j * 0.25)), p[2] + q * 0.6 * (1 - q) * 2 - q * q * (p[2] - W)]); }
            M.line(pts, { w: j ? 0 : 1, pass: 2, fit: false });
          }
        }
        M.callout('WATER JET', 2, [x - 0.2, near * 0.4, H.P(0, 0.2, 1)[2]], 1.6);
      } else {
        const x = H.xaD + L * 0.1, z = H.deckZ(x);
        const ph = Math.max(2.4, bridgeTop - z + 0.6);
        for (const sd of [1, -1]) foil(M, [x + 0.4, sd * B * 0.18, z - 0.05], [x, sd * 0.15, z + ph], 0.9, 0.12, { isect: true });
        M.at(x - 0.2, 0, z + ph + 0.35, () => {
          const N = M.ry(90, () => M.capsule(0.42, -1.8, 0.9));
          if (M.decorOn) { N.lat.shade({ gap: 1.6 }); N.lat.ring(0.4, { w: 1 }); }
          M.at(-1.95, 0, 0, () => M.rz(180, () => K.propeller(M, { r: Math.min(1.9, B * 0.45), blades: 4 })));
          M.at(0.95, 0, 0, () => M.sphere(0.2));
        });
        M.callout('AIR PROPELLER', 1, [x - 2.2, near * 0.5, z + ph + 0.8], 2.4);
        M.callout('ENGINE PYLON', 1, [x + 0.2, near * B * 0.12, z + ph * 0.5], 1.2);
      }
    });

    // ------------------------------------------------ roof and deck gear
    const mastX = hump ? roofX1 - 1.0 - Math.min(3.2, (roofX1 - roofX0) * 0.3) * 0.5 : roofX1 - 1.4;
    if (eq.has('radar') || !hump) {
      M.part('SIGNAL MAST', () => {
        M.at(mastX, 0, bridgeTop - 0.02, () => S.mast(M, { h: 2.6 + L * 0.06, r: 0.07, radar: eq.has('radar') ? 1.3 : 0, radarAt: 0.42, lamps: 2, yard: 0.9, stays: [] }));
        M.callout('SIGNAL MAST', 1, [mastX, 0, bridgeTop + 2 + L * 0.04], 1.2);
        if (eq.has('radar')) M.callout('RADAR SCANNER', 1, [mastX, 0, bridgeTop + (2.6 + L * 0.06) * 0.42 + 0.2], 1.6);
      });
    }
    if (eq.has('rafts')) {
      M.part('LIFE RAFT', () => {
        for (let k = 0; k < rafts; k++) for (const sd of [1, -1]) {
          const x = roofX0 + 0.6 + k * 0.85;
          M.box([x - 0.32, sd * roofW * 0.6 - 0.3, roofZ - 0.02], [x + 0.32, sd * roofW * 0.6 + 0.3, roofZ + 0.1], { isect: false });
          M.at(x, sd * roofW * 0.6, roofZ + 0.38, () => K.tankCapsule(M, { r: 0.28, len: 1.0, axis: 'y', bands: false }));
        }
        M.callout('LIFE RAFT', rafts * 2, [roofX0 + 0.6, near * roofW * 0.6, roofZ + 0.6], 1.4);
      });
    }
    M.part('EXHAUST STACK', () => {
      const x = roofX0 + (eq.has('rafts') ? rafts * 0.85 + 0.9 : 0.8);
      for (const sd of [1, -1]) M.at(x, sd * roofW * 0.3, roofZ - 0.05, () => K.stack(M, { r: 0.16, h: 0.9 }));
      M.box([x - 0.9, -roofW * 0.5, roofZ - 0.05], [x - 0.3, roofW * 0.5, roofZ + 0.35]);
      M.callout('ENGINE EXHAUST', 2, [x, near * roofW * 0.3, roofZ + 0.8], 0.9);
    });
    if (eq.has('searchlight')) {
      M.part('SEARCHLIGHT', () => {
        M.at(mastX + 0.8, 0, bridgeTop - 0.02, () => K.searchlight(M, { r: 0.25 }));
        M.callout('SEARCHLIGHT', 1, [mastX + 0.8, 0, bridgeTop + 0.5], 1.3);
      });
    }
    if (eq.has('rails')) {
      M.part('DECK RAIL', () => {
        for (const sd of [1, -1]) {
          const pts = [];
          for (let k = 0; k <= 8; k++) { const s = H.sOf(cab1 + 0.3) + (0.97 - H.sOf(cab1 + 0.3)) * k / 8; const p = H.P(s, 1, sd); pts.push([p[0], p[1] - sd * 0.12, p[2]]); }
          K.railing(M, pts, { h: 0.8, posts: 1.0, r: 0.025 });
          const pa = [];
          for (let k = 0; k <= 4; k++) { const s = 0.02 + (H.sOf(cab0 - 0.4) - 0.02) * k / 4; const p = H.P(s, 1, sd); pa.push([p[0], p[1] - sd * 0.12, p[2]]); }
          K.railing(M, pa, { h: 0.8, posts: 1.0, r: 0.025 });
        }
        M.callout('DECK RAIL', 1, H.P(0.85, 1, near), 0.9);
      });
    }
    if (eq.has('bowLamp')) {
      M.part('BOW LAMP', () => {
        const p = H.P(0.985, 1, 1);
        M.at(p[0] - 0.25, 0, p[2], () => { M.cyl(0.05, 0, 0.6); M.at(0, 0, 0.6, () => K.lamp(M, { r: 0.11 })); });
        M.callout('BOW LAMP', 1, [p[0] - 0.2, 0, p[2] + 0.65], 1);
      });
    }
    if (eq.has('flag')) {
      M.part('FLAGSTAFF', () => {
        const p = H.P(0.02, 1, 1);
        M.tube([p[0] + 0.25, 0, p[2]], [p[0] - 0.2, 0, p[2] + 2.2], 0.03, { isect: false });
        M.plate([[p[0] - 0.19, 0, p[2] + 2.15], [p[0] - 1.2, 0, p[2] + 1.95], [p[0] - 1.1, 0, p[2] + 1.4], [p[0] - 0.12, 0, p[2] + 1.55]], { isect: false });
      });
    }
    if (eq.has('steps')) {
      M.part('BOARDING STEPS', () => {
        // folding steps down the side at the cabin door, toward the water
        const x = cab0 + 1.2;
        const s = H.sOf(x);
        const top = H.P(s, 1, near);
        M.with({ at: [x - 0.4, top[1] + near * 0.05, top[2]], rz: near > 0 ? 0 : 180 }, () => {
          const n = 4;
          for (let k = 0; k < n; k++) M.box([0, 0.05 + k * 0.28, -0.3 - k * 0.32], [0.8, 0.35 + k * 0.28, -0.26 - k * 0.32], { isect: false });
          for (const xx of [0, 0.8]) M.tube([xx, 0.05, 0], [xx, 0.35 + (n - 1) * 0.28, -0.3 - (n - 1) * 0.32], 0.03, { isect: false });
          K.railing(M, [[0.8, 0.1, -0.1], [0.8, 0.35 + (n - 1) * 0.28, -0.3 - (n - 1) * 0.32]], { h: 0.8, posts: 3 });
        });
        M.callout('BOARDING STEPS', 1, [x, top[1] + near * 0.6, top[2] - 0.6], 1.5);
      });
    }
    if (eq.has('dinghy')) {
      M.part('DINGHY', () => {
        const x = H.xaD + L * 0.06 + (drive === 'air' ? 0 : 1.0), z = H.deckZ(x);
        const dl = 2.6;
        M.at(x, 0, z + 0.15, () => M.rz(90, () => {
          const D = S.hull(M, { L: dl, B: 1.2, F: 0.45, z0: 0, rake: 0.25, over: 0.05, stern: 'transom', ss0: 0.2, kt: 0.8, pb: 1.6, wl: 0.4, wlk: 1, flare: 0.2, bulge: 0.2, tumble: 0, sheerBow: 0.08, sheerStern: 0, n: 14, m: 3, part: 'DINGHY', isect: false });
          S.runS(M, D, 0.6, 0.02, 0.97, 1, { w: 1 }); S.runS(M, D, 0.6, 0.02, 0.97, -1, { w: 1 });
        }));
        M.callout('DINGHY', 1, [x, 0, z + 0.6], 1.6);
      });
    }

    // ------------------------------------------------ water
    M.part('WATERLINE', () => {
      // a wake only from the outermost strut of each foil
      const minX = Math.min(...pierce.map((p) => p[0]));
      for (const p of pierce) {
        const outer = !pierce.some((q) => Math.abs(q[0] - p[0]) < 1 && Math.abs(q[1]) > Math.abs(p[1]) + 0.1);
        S.spray(M, p, { len: L * 0.22, h: 0.6 + hk * 0.5, wake: outer && p[0] - minX < 2 });
      }
    });
    S.waterStrokes(M, 0, 0, L * 0.65, B * 2.2, 12, rng);
    const stg = S.landingStage(M, { at: [stageX, near * (B / 2 + stageGap + 1.2)], rz: near > 0 ? 180 : 0 });

    // ------------------------------------------------ vocabulary
    const briefs = {
      express: `Carries ${pax} passengers across the water at ${knots} knots on its foils.`,
      mail: `Runs mail bags and ${pax} passengers out to the islands at ${knots} knots.`,
      customs: `Patrols the coast at ${knots} knots and stops boats with a searchlight.`,
      ambulance: `Takes patients from the islands to hospital at ${knots} knots.`,
    };
    let brief = briefs[job];
    if (brief.length > 78) brief = brief.replace(' on its foils', '');
    const form = drive === 'air' ? 'AIR HYDROFOIL' : 'HYDROFOIL';
    return {
      place, job: { express: 'EXPRESS', mail: 'MAIL', customs: 'CUSTOMS', ambulance: 'AMBULANCE' }[job], form,
      brief,
      specs: [['MASS', `${mass} T`], [job === 'customs' ? 'CREW' : 'PASSENGERS', job === 'customs' ? '6' : String(pax)], ['SPEED', `${knots} KN`], ['POWER', `${drive === 'props' ? '2 X ' + Math.round(kw / 20) * 10 : kw} KW`]],
      figure: stg.spot,
    };
  },
};
