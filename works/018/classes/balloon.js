// classes/balloon.js: lighter-than-air oddities. A gas balloon with net, crow's feet and a
// load ring over a wicker basket or a sealed gondola sphere; a cluster of balloons lifting
// a platform or a small house; or a kite balloon with stabilizing lobes on a tether to a
// winch truck. Ropes as thin lines; ballast, a trail rope on the ground, an anchor,
// instruments, a lantern.

import * as A from './parts-air.js';
import { K, D2R, lerp } from './parts-air.js';
import { word, thou } from '../words.js';

const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';

// net over a sphere of radius r at c: crossing loxodromes from the crown down to phiEnd
// (degrees from the top), then crow's feet to the load ring points. Lines lie just outside
// the surface so they hide behind it like the envelope's own decor.
function net(M, c, r, n, phiEnd, ringR, ringZ, nFeet) {
  const k = 1.006;
  const P = (phi, th) => [c[0] + Math.sin(phi * D2R) * Math.cos(th * D2R) * r * k, c[1] + Math.sin(phi * D2R) * Math.sin(th * D2R) * r * k, c[2] + Math.cos(phi * D2R) * r * k];
  const twist = 360 / n * 1.0;
  for (let i = 0; i < n; i++) for (const sg of [1, -1]) {
    const pts = [];
    for (let j = 0; j <= 14; j++) { const phi = 12 + (phiEnd - 12) * j / 14; pts.push(P(phi, i * 360 / n + sg * twist * (phi - 12) / 30)); }
    M.line(pts, { w: 0, pass: 3 });
  }
  M.line(Array.from({ length: 49 }, (_, j) => P(12, j * 7.5)), { w: 1, pass: 2 });
  // crow's feet: groups of net ends gathered to a point below the equator, a rope to the ring
  const feet = [];
  for (let f = 0; f < nFeet; f++) {
    const th = f * 360 / nFeet;
    const phiF = phiEnd + 16;
    const foot = [c[0] + Math.sin(phiF * D2R) * Math.cos(th * D2R) * r * 1.015, c[1] + Math.sin(phiF * D2R) * Math.sin(th * D2R) * r * 1.015, c[2] + Math.cos(phiF * D2R) * r * 1.015];
    for (const d of [-1, 0, 1]) M.line([P(phiEnd, th + d * 360 / nFeet * 0.33), foot], { w: 0, pass: 2 });
    const ringP = [c[0] + Math.cos(th * D2R) * ringR, c[1] + Math.sin(th * D2R) * ringR, ringZ];
    M.line([foot, ringP], { w: 1, pass: 2 });
    feet.push(foot);
  }
  return feet;
}

// wicker basket, floor at z = 0: weave on the sides, a padded rim, rope handles
function basket(M, s, h) {
  const B = M.box([-s / 2, -s / 2, 0], [s / 2, s / 2, h], { chamfer: s * 0.08 });
  for (const k of ['+x', '-x', '+y', '-y', 'c0', 'c1', 'c2', 'c3']) {
    const f = B.f(k);
    if (!f.on || !f.front) continue;
    f.hatch(f.box, { angle: 60, gap: 2.0, w: 0 });
    f.hatch(f.box, { angle: -60, gap: 2.0, w: 0 });
    for (const y of [-f.h * 0.3, f.h * 0.1]) f.line(-f.w / 2, y, f.w / 2, y, { w: 0 });
  }
  const top = B.f('+z');
  if (top.on) { const g = top.mOf(3); top.rect(-top.w / 2 + g, -top.h / 2 + g, top.w / 2 - g, top.h / 2 - g, { w: 1 }); top.hatch([-top.w / 2 + g, -top.h / 2 + g, top.w / 2 - g, top.h / 2 - g], { angle: 30, gap: 1.2, w: 0 }); }
  const rim = [];
  for (let i = 0; i <= 16; i++) { const a = (i / 16) * 2 * Math.PI; const c = Math.cos(a), sn = Math.sin(a); const m = Math.max(Math.abs(c), Math.abs(sn)); rim.push([c / m * s * 0.5, sn / m * s * 0.5, h]); }
  M.pipe(rim, s * 0.035, { isect: false });
  return B;
}

export default {
  id: 'balloon',
  family: 'air',
  weight: 0.7,
  build(M) {
    // ------------------------------------------------ choices
    const form = M.wpick([[4, 'gas'], [2.5, 'cluster'], [2.5, 'kite']]);
    const sealed = form === 'gas' && M.chance(0.4);
    const r = form === 'gas' ? M.r(5.5, 8.5) : M.r(1.8, 3.2);
    const nB = form === 'cluster' ? M.ri(4, 8) : 1;
    const cargo = form === 'cluster' ? M.wpick([[2, 'house'], [2, 'platform'], [1.5, 'lantern']]) : null;
    const pool = [[3, 'ballast'], [3, 'trail'], [2, 'anchor'], [2.5, 'instruments'], [2, 'radio'], [1.5, 'lamp'], [1.5, 'camera']];
    const eq = new Set();
    const nEq = M.ri(2, 4);
    for (let k = 0; k < 14 && eq.size < nEq; k++) eq.add(M.wpick(pool));
    const crew = sealed ? 2 : form === 'kite' ? M.ri(1, 2) : form === 'cluster' ? (cargo === 'lantern' ? 0 : M.ri(1, 2)) : M.ri(2, 3);
    const hover = M.r(2.2, 4.5);
    const az = M.pick([1, -1]) * M.r(35, 55) + M.pick([0, 0, 180]);
    const el = M.r(20, 28);
    const reg = `${LET[M.ri(0, 22)]}-${LET[M.ri(0, 22)]}${LET[M.ri(0, 22)]}${LET[M.ri(0, 22)]}${LET[M.ri(0, 22)]}`;
    const place = M.pick(['ALPINE', 'POLAR', 'DESERT', 'COASTAL', 'PRAIRIE', 'HIGH-ALTITUDE', 'MOORLAND', 'HARBOR']);
    const clusterSeed = Array.from({ length: 24 }, () => M.rng());
    const truckYaw = M.r(-30, 30);
    const gores = M.pick([12, 16, 20, 24]);
    const lobeKind = M.pick([3, 3, 4]);
    M.setView(az, el);
    const e = M.view.e;
    const sideS = e[1] >= 0 ? 1 : -1;
    const toV = (p, d) => A.toward(M, p, d);
    let drops = [], figure, volume = 0, topZ = 0, ground = null;

    if (form === 'gas') {
      // ------------------------------------------------ gas balloon
      const bs = sealed ? 2.7 : M.r(1.3, 1.7), bh = sealed ? 2.7 : 1.1;
      const z0 = hover;                                   // basket floor / gondola bottom
      const zRing = z0 + bh + M.r(2.6, 3.4);
      const zc = zRing + r * 1.25 + 1.0;                   // envelope center
      topZ = zc + r;
      volume = 4 / 3 * Math.PI * r ** 3;
      M.part('ENVELOPE', () => {
        M.at(0, 0, zc, () => {
          const S = M.lathe(Array.from({ length: 19 }, (_, i) => { const a = -90 + 180 * i / 18; const k = a < 0 ? 1 - 0.12 * Math.sin(-a * D2R) : 1; return [i === 0 || i === 18 ? 0 : Math.cos(a * D2R) * r * k, Math.sin(a * D2R) * r * (a < 0 ? 1.06 : 1)]; }), { segMul: 1.1 });
          if (M.decorOn) { for (let i = 0; i < gores; i++) S.lat.meridian(i * 360 / gores, 0.05, 0.95, { w: 0 }); S.lat.shade({ gap: 1.6, gapMax: 6, threshold: 0.3 }); S.lat.text(reg, 0, 0.55, r * 0.22); }
          // valve at the crown and the appendix below
          M.at(0, 0, r - 0.05, () => { M.cyl(r * 0.09, 0, r * 0.05); M.cyl(r * 0.05, r * 0.05, r * 0.08); });
          M.at(0, 0, -r * 1.06, () => { const N = M.lathe([[r * 0.08, 0.1], [r * 0.07, -r * 0.35], [r * 0.09, -r * 0.42]], { open: true }); if (M.decorOn) N.lat.shade({ gap: 1.3, gapMax: 3 }); });
        });
        M.line([[0, 0, zc + r * 0.9], [0, 0, z0 + bh + 0.3]], { w: 0, pass: 2 });
        M.info.mass = [-r, -r, zc - r, r, r, zc + r];
        M.info.centers = [[[0, 0, z0 - 1], [0, 0, zc + r + 1.5]]];
        M.callout('ENVELOPE', 1, toV([0, 0, zc], r * 1.0), 3);
        M.callout('CROWN VALVE', 1, [0, 0, zc + r + r * 0.07], 1.2);
        M.callout('APPENDIX', 1, toV([0, 0, zc - r * 1.06 - r * 0.25], r * 0.08), 1);
      });
      M.part('NET', () => {
        const ringR = 0.55;
        net(M, [0, 0, zc], r, 20, 112, ringR, zRing, 10);
        M.at(0, 0, zRing, () => M.torus(ringR, 0.06, {}));
        M.callout('NET', 1, toV([0, 0, zc + r * 0.55], r * 0.85), 1.6);
        M.callout('LOAD RING', 1, toV([0, 0, zRing], ringR), 2);
        // suspension lines to the basket
        for (let i = 0; i < 4; i++) { const a = (45 + 90 * i) * D2R; A.wire(M, [Math.cos(a) * ringR, Math.sin(a) * ringR, zRing], [Math.cos(a) * bs * 0.68, Math.sin(a) * bs * 0.68, z0 + bh], { w: 1 }); }
      });
      M.part(sealed ? 'GONDOLA' : 'BASKET', () => {
        if (sealed) {
          const gr = bs / 2;
          M.at(0, 0, z0 + gr, () => {
            const G = M.sphere(gr);
            if (M.decorOn) { G.lat.ring(0.5, { w: 1 }); G.lat.ring(0.47, { w: 1 }); for (const a of [0, 120, 240]) G.lat.port(a + 30, 0.56, gr * 0.12); G.lat.shade({ gap: 1.4, gapMax: 4 }); G.lat.text(reg, Math.atan2(e[1], e[0]) / D2R, 0.35, gr * 0.14); }
            M.at(0, 0, gr * 0.85, () => { M.cyl(gr * 0.32, 0, gr * 0.22); M.at(0, 0, gr * 0.22, () => M.cyl(gr * 0.36, 0, gr * 0.05)); });
            // crash frame and ballast hopper
            for (let i = 0; i < 4; i++) { const a = (45 + 90 * i) * D2R; M.pipe([[Math.cos(a) * gr * 0.9, Math.sin(a) * gr * 0.9, -gr * 0.4], [Math.cos(a) * gr * 1.15, Math.sin(a) * gr * 1.15, -gr * 0.8], [Math.cos(a) * gr * 0.5, Math.sin(a) * gr * 0.5, -gr * 1.05]], gr * 0.03, { isect: false }); }
            M.cone(gr * 0.08, gr * 0.3, -gr * 1.25, -gr * 0.85);
          });
          M.callout('PRESSURE GONDOLA', 1, toV([0, 0, z0 + gr], gr), 2.6);
          M.callout('ENTRY HATCH', 1, [0, 0, z0 + gr * 2.1], 1.2);
          M.callout('BALLAST HOPPER', 1, toV([0, 0, z0 - gr * 0.05], gr * 0.3), 1.2);
          drops = [[0, 0, z0 - bs * 0.15]];
        } else {
          M.at(0, 0, z0, () => basket(M, bs, bh));
          for (let i = 0; i < crew; i++) M.at(bs * (i - (crew - 1) / 2) * 0.32, bs * 0.1 * (i % 2 ? 1 : -1), z0, () => M.rz(i * 70 + 20, () => A.pilot(M, { seated: false, arms: i === 0 ? 'bar' : 'side' })));
          M.callout('WICKER BASKET', 1, toV([0, 0, z0 + bh * 0.5], bs * 0.5), 2.6);
          M.callout('AERONAUT', crew, toV([0, 0, z0 + bh + 0.5], 0.3), 1.4);
          drops = [[bs / 2, bs / 2, z0], [-bs / 2, bs / 2, z0], [-bs / 2, -bs / 2, z0], [bs / 2, -bs / 2, z0]];
        }
      });
      equipment(M, eq, { z0, bh, bs, sealed, sideS, zc, r, toV });
      figure = A.figSpot(M, r * 0.9);
    } else if (form === 'cluster') {
      // ------------------------------------------------ cluster of balloons
      const zCargo = hover;
      const cargoH = cargo === 'house' ? 2.8 + 4.4 * 0.38 : cargo === 'platform' ? 1.2 : 4.3;
      const zHub = zCargo + cargoH + M.r(3.5, 5);
      const balls = [];
      for (let i = 0; i < nB; i++) {
        const q = clusterSeed;
        const rr = r * (0.75 + q[i] * 0.5);
        const a = i * 137.5 * D2R, d = (i === 0 ? 0 : (r * 1.4) * Math.sqrt(i) * 0.75);
        balls.push({ r: rr, c: [Math.cos(a) * d, Math.sin(a) * d, zHub + r * 2.2 + q[i + 8] * r * 1.8 + rr] });
      }
      topZ = Math.max(...balls.map((b) => b.c[2] + b.r));
      volume = balls.reduce((s, b) => s + 4 / 3 * Math.PI * b.r ** 3, 0);
      M.part('BALLOON', () => {
        balls.forEach((b, i) => {
          M.at(b.c[0], b.c[1], b.c[2], () => {
            const S = M.sphere(b.r);
            if (M.decorOn) { for (let k = 0; k < 12; k++) S.lat.meridian(k * 30, 0.06, 0.94, { w: 0 }); S.lat.shade({ gap: 1.5, gapMax: 5, threshold: 0.3 }); }
            M.at(0, 0, -b.r, () => { M.cone(b.r * 0.08, b.r * 0.14, -b.r * 0.15, 0.05); });
          });
          A.rope(M, [b.c[0], b.c[1], b.c[2] - b.r * 1.15], [0, 0, zHub], 0, { w: 1 });
          void i;
        });
        const top = balls.reduce((p, b) => (b.c[0] * e[0] + b.c[1] * e[1] > p.c[0] * e[0] + p.c[1] * e[1] ? b : p), balls[0]);
        M.callout('GAS BALLOON', nB, toV(top.c, top.r), 3);
        M.at(0, 0, zHub, () => M.torus(0.35, 0.05, {}));
        M.callout('SPREADER RING', 1, toV([0, 0, zHub], 0.35), 1.4);
        M.info.mass = [Math.min(...balls.map((b) => b.c[0] - b.r)), Math.min(...balls.map((b) => b.c[1] - b.r)), Math.min(...balls.map((b) => b.c[2] - b.r)), Math.max(...balls.map((b) => b.c[0] + b.r)), Math.max(...balls.map((b) => b.c[1] + b.r)), topZ];
        M.info.centers = [[[0, 0, zCargo - 1], [0, 0, zHub + 1]]];
      });
      M.part(cargo === 'house' ? 'HOUSE' : cargo === 'platform' ? 'PLATFORM' : 'LANTERN', () => {
        let corners;
        if (cargo === 'house') {
          M.at(0, 0, zCargo, () => A.house(M, { len: 5.5, w: 4.4, h: 2.8 }));
          corners = [[2.75, 2.2], [-2.75, 2.2], [-2.75, -2.2], [2.75, -2.2]].map(([x, y]) => [x, y, zCargo + 2.8]);
          M.callout('HOUSE', 1, toV([0, 0, zCargo + 1.4], 3.6), 2.6);
          M.callout('GABLE ROOF', 1, toV([0, 0, zCargo + 2.8 + 0.8], 2.2), 1.2);
          M.callout('CHIMNEY', 1, [5.5 * 0.2 + 0.25, 4.4 * 0.1 + 0.25, zCargo + 2.8 + 4.4 * 0.38 * 1.05], 0.9);
        } else if (cargo === 'platform') {
          const R = 1.8;
          M.at(0, 0, zCargo, () => {
            const D = M.cyl(R, -0.12, 0);
            if (D.top.on) { D.top.hatch(A.circlePts(0, 0, R * 0.95, R * 0.95, 32), { angle: 0, gap: 2.2, w: 0 }); D.top.hatch(A.circlePts(0, 0, R * 0.95, R * 0.95, 32), { angle: 90, gap: 2.2, w: 0 }); }
            const ring = []; for (let i = 0; i <= 24; i++) { const a = i * 2 * Math.PI / 24; ring.push([Math.cos(a) * R * 0.97, Math.sin(a) * R * 0.97, 0]); }
            K.railing(M, ring, { h: 1.0, posts: 1.2 });
            for (let i = 0; i < crew; i++) M.at((i - 0.5) * 0.7, 0.3, 0, () => M.rz(30 + i * 90, () => A.pilot(M, { seated: false, arms: 'side' })));
          });
          corners = [0, 1, 2, 3].map((i) => { const a = (45 + 90 * i) * D2R; return [Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, zCargo + 1.0]; });
          M.callout('PLATFORM', 1, toV([0, 0, zCargo - 0.05], R), 2.4);
          M.callout('RAILING', 1, toV([0, 0, zCargo + 1.0], R), 1);
        } else {
          M.at(0, 0, zCargo, () => M.scale(1.7, 1.7, 1.7, () => {
            M.cyl(0.8, 0, 0.25);
            const G = M.cyl(0.6, 0.25, 1.6);
            if (M.decorOn) { for (let k = 0; k < 8; k++) G.lat.meridian(k * 45, 0, 1, { w: 1 }); G.lat.hatch(0, 360, 0.1, 0.9, { gap: 2.4 }); }
            M.cone(0.85, 0.15, 1.6, 2.3);
            M.at(0, 0, 2.3, () => M.sphere(0.15));
            for (let k = 0; k < 4; k++) { const a = (45 + 90 * k) * D2R; M.tube([Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0.25], [Math.cos(a) * 0.7, Math.sin(a) * 0.7, 1.6], 0.04, {}); }
            const ring = []; for (let i = 0; i <= 20; i++) { const a = i * 2 * Math.PI / 20; ring.push([Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0.25]); }
            K.railing(M, ring, { h: 0.45, posts: 0.5, r: 0.015 });
          }));
          corners = [[0, 0, zCargo + 2.45 * 1.7]];
          M.callout('LANTERN', 1, toV([0, 0, zCargo + 1.7], 1.0), 2.6);
          M.callout('LENS GALLERY', 1, toV([0, 0, zCargo + 0.6], 1.3), 1);
          eq.add('anchor');
        }
        for (const c of corners) A.wire(M, c, [0, 0, zHub], { w: 1 });
        drops = corners.map((c) => [c[0], c[1], zCargo]);
      });
      equipment(M, eq, { z0: zCargo, bh: cargoH * 0.6, bs: cargo === 'house' ? 4.4 : 3, sealed: false, sideS, zc: zHub, r: 0.5, toV, cluster: true });
      figure = A.figSpot(M, r * 2.2 + 3);
    } else {
      // ------------------------------------------------ kite balloon on a tether
      const Lk = r * M.r(4.2, 5.2), Rk = Lk / 4.4;
      const zc = hover + Rk * 2.2 + 6;
      const E = A.envProfile(Lk, Rk, 'blunt');
      topZ = zc + Rk;
      volume = 0; for (let i = 0; i < 40; i++) { const x = -Lk / 2 + Lk * (i + 0.5) / 40; volume += Math.PI * E.rAt(x) ** 2 * Lk / 40; }
      const tilt = 8;
      let conf;
      M.part('ENVELOPE', () => {
        M.at(0, 0, zc, () => M.ry(-tilt, () => {
          A.envelope(M, { L: Lk, R: Rk, form: 'blunt', gores: gores, rings: [-Lk * 0.25, 0, Lk * 0.22], text: reg, textSide: sideS, textH: Rk * 0.3 });
          // stabilizing lobes at the tail
          for (let k = 0; k < lobeKind; k++) {
            const th = lobeKind === 3 ? 180 + (k - 1) * 120 : 45 + 90 * k;
            M.rx(th - 180, () => M.at(-Lk * 0.36, 0, E.rAt(-Lk * 0.36) * 0.85, () => M.ry(-6, () => {
              const S = M.scale(1, 0.55, 1, () => M.lathe([[0, -Lk * 0.13], [Rk * 0.32, -Lk * 0.08], [Rk * 0.42, 0], [Rk * 0.3, Lk * 0.08], [0, Lk * 0.12]], { axis: 'x' }));
              if (M.decorOn) { S.lat.ring(0.5, { w: 0 }); S.lat.shade({ gap: 1.4, gapMax: 4 }); }
            })));
          }
          conf = M.W([Lk * 0.05, 0, -Rk - Rk * 1.6]);
          // rigging: patches along the belly to the confluence
          for (let i = 0; i < 6; i++) for (const s of [1, -1]) {
            const x = -Lk * 0.25 + Lk * 0.5 * i / 5, a = s * 35 * D2R, rr = E.rAt(x);
            const p = [x, Math.sin(a) * rr, -Math.cos(a) * rr];
            M.line([p, [Lk * 0.05, 0, -Rk - Rk * 1.6]], { w: 0, pass: 2 });
          }
        }));
        M.at(conf[0], conf[1], conf[2], () => M.torus(0.25, 0.04, {}));
        M.info.mass = [-Lk / 2, -Rk, zc - Rk, Lk / 2, Rk, zc + Rk];
        M.info.centers = [[[-Lk / 2 - 1, 0, zc], [Lk / 2 + 1, 0, zc]]];
        M.callout('KITE BALLOON', 1, toV([Lk * 0.15, 0, zc + Lk * 0.15 * Math.sin(tilt * D2R)], Rk * 1.12), 3);
        M.callout('KITE BALLOON', 1, [Lk * 0.25, 0, zc + Rk * 1.04 + Lk * 0.25 * Math.sin(tilt * D2R)], 3);
        M.callout('KITE BALLOON', 1, [Lk * 0.5 + 0.3, 0, zc + Lk * 0.5 * Math.sin(tilt * D2R)], 3);
        M.callout('ENVELOPE GORE', 1, toV([-Lk * 0.1, 0, zc - Lk * 0.1 * Math.sin(tilt * D2R)], Rk * 1.1), 0.8);
        M.callout('STABILIZING LOBE', lobeKind, toV([-Lk * 0.36, 0, zc + Rk * 0.9], Rk * 0.4), 2);
        M.callout('RIGGING', 1, toV(lerp([0, 0, zc - Rk], conf, 0.5), 0.2), 1.1);
      });
      // observation basket below the confluence
      const zb = conf[2] - 3.2 - 1.1;
      M.part('BASKET', () => {
        A.wire(M, conf, [conf[0], 0, zb + 1.1 + 0.2], { w: 1 });
        for (let i = 0; i < 4; i++) { const a = (45 + 90 * i) * D2R; A.wire(M, [conf[0], 0, zb + 1.3], [conf[0] + Math.cos(a) * 0.55, Math.sin(a) * 0.55, zb + 1.1], { w: 0 }); }
        M.at(conf[0], 0, zb, () => basket(M, 1.1, 1.1));
        for (let i = 0; i < crew; i++) M.at(conf[0] + (i - 0.5) * 0.3, 0, zb, () => M.rz(i * 90, () => A.pilot(M, { seated: false, arms: 'bar' })));
        M.callout('OBSERVER BASKET', 1, toV([conf[0], 0, zb + 0.55], 0.6), 2.4);
      });
      // tether to a winch truck
      M.part('WINCH TRUCK', () => {
        const tx = conf[0] + zc * 0.45 * Math.cos(truckYaw * D2R), ty = sideS * zc * 0.3;
        M.with({ at: [tx, ty, 0], rz: truckYaw + 180 }, () => truck(M));
        const drum = M.with({ at: [tx, ty, 0], rz: truckYaw + 180 }, () => M.W([-1.2, 0, 2.0]));
        M.line([conf, drum], { w: 1, pass: 1 });
        M.callout('WINCH TRUCK', 1, toV([tx, ty, 1.4], 1.2), 2.4);
        M.callout('TETHER', 1, lerp(conf, drum, 0.55), 1.4);
        ground = [tx, ty];
      });
      drops = [[-Lk / 2, 0, zc], [Lk / 2, 0, zc], [0, Rk, zc], [0, -Rk, zc], [conf[0], 0, zb]];
      equipment(M, eq, { z0: zb, bh: 1.1, bs: 1.1, sealed: false, sideS, zc, r: Rk, toV, kite: true, x0: conf[0] });
      figure = [ground[0] + 3, ground[1] + sideS * 2.5];
    }

    // ------------------------------------------------ vocabulary
    let job;
    if (sealed) job = 'COSMIC RAY';
    else if (form === 'cluster' && cargo === 'lantern') job = 'AERIAL LIGHTHOUSE';
    else if (form === 'cluster' && cargo === 'house') job = 'HOUSE-MOVING';
    else if (form === 'kite') job = 'OBSERVATION';
    else if (eq.has('instruments') || eq.has('radio')) job = 'WEATHER';
    else if (eq.has('camera')) job = 'SURVEY';
    else job = 'SPORT';
    const where = { ALPINE: 'the Alps', POLAR: 'the ice cap', DESERT: 'the desert', COASTAL: 'the coast', PRAIRIE: 'the prairie', 'HIGH-ALTITUDE': 'the clouds', MOORLAND: 'the moors', HARBOR: 'the harbor' }[place];
    const briefs = {
      'COSMIC RAY': `Lifts two observers in a sealed sphere to count cosmic rays.`,
      'AERIAL LIGHTHOUSE': `Holds a lantern over ${where} on ${word(nB)} balloons to mark the channel.`,
      'HOUSE-MOVING': `Carries a small house over ${where} on ${word(nB)} gas balloons.`,
      OBSERVATION: `Raises ${word(crew)} observer${crew > 1 ? 's' : ''} above ${where} on a tether from a winch truck.`,
      WEATHER: `Carries ${word(crew)} aeronauts and weather instruments over ${where}.`,
      SURVEY: `Drifts over ${where} with ${word(crew)} aeronauts and a survey camera.`,
      SPORT: `Carries ${word(crew)} aeronauts on long drifts over ${where}.`,
    };
    if (form === 'cluster' && cargo === 'platform') { job = eq.has('instruments') ? 'WEATHER' : 'SURVEY'; briefs[job] = `Lifts a platform and ${word(crew)} crew over ${where} on ${word(nB)} balloons.`; }
    let brief = briefs[job];
    if (brief.length > 78) brief = brief.replace(/ over [a-z ]+| above [a-zA-Z ]+/, '');
    const fname = form === 'kite' ? 'KITE BALLOON' : form === 'cluster' ? 'BALLOON CLUSTER' : 'GAS BALLOON';
    let pl = place;
    if ((pl + ' ' + job + ' ' + fname).length > 34) pl = place.length > 7 ? '' : place;
    if ((pl + ' ' + job + ' ' + fname).length > 34) pl = '';
    return {
      place: pl, job, form: fname, brief, designation: reg,
      specs: [['VOLUME', `${thou(Math.round(volume / 10) * 10)} M3`], ['CREW', String(crew)], [form === 'kite' ? 'TETHER' : 'CEILING', form === 'kite' ? `${thou(Math.round(topZ * 12 / 50) * 50)} M` : `${thou(sealed ? 16000 : 6000)} M`], ['GAS', 'HYDROGEN']],
      float: true,
      drops,
      figure,
    };
  },
};

// ballast, trail rope, anchor, instruments hung from the basket (z0 floor, bh height)
function equipment(M, eq, o) {
  const { z0, bh, bs, sideS, toV } = o;
  const x0 = o.x0 || 0;
  const side = (k) => [x0 + bs * 0.5 * (k === 1 ? 1 : -1), 0, z0 + bh * 0.8];
  if (eq.has('ballast')) {
    M.part('BALLAST BAG', () => {
      const n = o.sealed ? 0 : 4;
      for (let i = 0; i < n; i++) {
        const y = (i - 1.5) * bs * 0.28;
        const p = [x0 + (i % 2 ? 1 : -1) * bs * 0.52, sideS * Math.abs(y), z0 + bh * 0.85];
        M.at(p[0], p[1], p[2], () => A.bag(M, { r: 0.13 }));
      }
      if (n) M.callout('BALLAST BAG', n, toV([x0 + bs * 0.52, sideS * bs * 0.2, z0 + bh * 0.6], 0.15), 1.4);
    });
  }
  if (eq.has('trail') && !o.kite) {
    M.part('TRAIL ROPE', () => {
      const a = [x0 - bs * 0.4, -sideS * bs * 0.3, z0 + 0.2];
      const pts = [a];
      for (let i = 1; i <= 8; i++) { const t = i / 8; pts.push([a[0] - t * z0 * 0.9, a[1] - sideS * t * 0.4, z0 * (1 - t) ** 1.6]); }
      for (let i = 1; i <= 5; i++) pts.push([a[0] - z0 * 0.9 - i * 1.2, a[1] - sideS * 0.4 + Math.sin(i * 1.7) * 0.4, 0.03]);
      M.line(pts, { w: 1, pass: 2, fit: false });
      M.callout('TRAIL ROPE', 1, pts[4], 1.4);
    });
  }
  if (eq.has('anchor')) {
    M.part('ANCHOR', () => {
      const a = [x0 + bs * 0.45, sideS * bs * 0.2, z0 + 0.1];
      const g = [a[0] + 0.4, a[1], Math.max(0.6, z0 * 0.45)];
      M.line([a, g], { w: 1, pass: 2 });
      M.at(g[0], g[1], g[2], () => {
        M.tube([0, 0, 0], [0, 0, -0.6], 0.025, {});
        for (let k = 0; k < 4; k++) M.rz(k * 90, () => M.pipe([[0, 0, -0.6], [0.18, 0, -0.55], [0.26, 0, -0.35]], 0.02, { isect: false }));
      });
      M.callout('GRAPNEL ANCHOR', 1, [g[0] + 0.25, g[1], g[2] - 0.45], 1.2);
    });
  }
  if (eq.has('instruments')) {
    M.part('INSTRUMENT BOOM', () => {
      const a = [x0, -sideS * bs * 0.5, z0 + bh * 0.9], b = [x0, -sideS * (bs * 0.5 + 1.1), z0 + bh * 1.0];
      M.tube(a, b, 0.025, {});
      M.at(b[0], b[1], b[2] - 0.1, () => { const C = M.box([-0.15, -0.1, -0.15], [0.15, 0.1, 0.1]); const f = C.f(sideS > 0 ? '-y' : '+y'); if (f.on && f.front) K.louver(f, f.box); });
      M.callout('INSTRUMENT BOX', 1, toV([b[0], b[1], b[2] - 0.02], 0.3), 1.5);
    });
  }
  if (eq.has('radio')) {
    M.part('AERIAL', () => {
      const a = [x0 - bs * 0.3, sideS * bs * 0.3, z0];
      M.line([a, [a[0] - 1.0, a[1], a[2] - Math.min(6, z0 * 0.8)]], { w: 0, pass: 2, fit: false });
      M.at(a[0] - 1.0, a[1], a[2] - Math.min(6, z0 * 0.8), () => M.sphere(0.06));
      M.callout('TRAILING AERIAL', 1, [a[0] - 0.5, a[1], a[2] - Math.min(3, z0 * 0.4)], 1);
    });
  }
  if (eq.has('lamp')) {
    M.part('LAMP', () => {
      const p = side(1);
      M.at(p[0], p[1], z0 + bh + 0.1, () => { M.tube([0, 0, -0.2], [0.3, 0, 0.2], 0.02, {}); M.at(0.3, 0, 0.2, () => K.lamp(M, { r: 0.08 })); });
      M.callout('SIGNAL LAMP', 1, [p[0] + 0.35, p[1], z0 + bh + 0.3], 1);
    });
  }
  if (eq.has('camera')) {
    M.part('CAMERA', () => {
      M.at(x0, 0, z0 - 0.02, () => { M.box([-0.2, -0.15, -0.35], [0.2, 0.15, 0]); M.cyl(0.08, -0.55, -0.35); });
      M.callout('SURVEY CAMERA', 1, toV([x0, 0, z0 - 0.2], 0.2), 1.5);
    });
  }
  void lerp;
}

// winch truck: cab at +x, bed with a winch drum and a guide pulley, wheels on z = 0
function truck(M) {
  const wr = 0.5;
  for (const x of [1.8, -1.2, -2.3]) for (const y of [0.95, -0.95]) M.at(x, y, wr, () => K.wheel(M, { r: wr, w: 0.32 }));
  const ch = M.box([-3.0, -1.0, wr * 0.9], [2.6, 1.0, wr * 0.9 + 0.35]);
  void ch;
  const cab = M.box([1.2, -1.05, wr * 0.9 + 0.35], [2.7, 1.05, wr * 0.9 + 1.9], { chamfer: 0.15 });
  for (const k of ['+y', '-y', '+x']) { const f = cab.f(k); if (f.on && f.front) { A.window2(f, [-f.w * 0.4, f.h * 0.0, f.w * 0.4, f.h * 0.4], { frame: 0.08, mullion: k === '+x' }); f.line(-f.w / 2, -f.h * 0.15, f.w / 2, -f.h * 0.15, { w: 0 }); } }
  const hood = M.box([2.7, -0.9, wr * 0.9 + 0.35], [3.3, 0.9, wr * 0.9 + 1.0]);
  const fh = hood.f('+x'); if (fh.on && fh.front) K.louver(fh, fh.box);
  K.winch(M, { r: 0.45, w: 1.3, at: [-1.2, 0, 2.0] });
  for (const s of [1, -1]) M.box([-1.4, s * 0.75, wr * 0.9 + 0.35], [-1.0, s * 0.85, 2.0], {});
  M.box([-2.9, -1.0, wr * 0.9 + 0.35], [0.9, -0.95, wr * 0.9 + 0.8]);
  M.box([-2.9, 0.95, wr * 0.9 + 0.35], [0.9, 1.0, wr * 0.9 + 0.8]);
  K.girder(M, [-2.6, 0, wr * 0.9 + 0.35], [-2.6, 0, 3.0], { w: 0.4, sec: 3 });
  M.at(-2.6, 0, 3.05, () => M.cyl(0.18, -0.06, 0.06, { axis: 'y' }));
}
