// classes/hauler.js: a tractor unit and one to three trailers on many wheels. Cab from a
// pool (cab-over box, bonneted, bubble canopy, raised crow's-nest cab); loads from a pool
// (containers, a long tank, ore bins, logs or pipes, a house section, a small vehicle on a
// flatbed, and as single oversize loads on a many-axle platform: a rocket stage or a
// telescope tube in lattice cradles). Seen from the side and front so the train fills the
// sheet.

import * as G from './parts-ground.js';
import { word, thou } from '../words.js';

const { K, D2R, clamp } = G;

const PLACES = {
  OUTBACK: 'the outback', DESERT: 'the desert', TUNDRA: 'the tundra', COASTAL: 'the coast road',
  HIGHLAND: 'the highlands', 'SALT FLAT': 'the salt flats', STEPPE: 'the steppe', ARCTIC: 'the arctic',
  MARTIAN: 'Mars', LUNAR: 'the moon',
};

export default {
  id: 'hauler',
  family: 'ground',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const cab = M.wpick([[3, 'cabover'], [3, 'bonnet'], [1.4, 'bubble'], [1.4, 'crow']]);
    const load0 = M.wpick([[2.2, 'container'], [1.8, 'tank'], [1.6, 'ore'], [1.4, 'logs'], [1.0, 'pipes'], [1.1, 'house'], [1.0, 'vehicle'], [1.1, 'stage'], [0.9, 'telescope']]);
    const oversize = load0 === 'stage' || load0 === 'telescope' || load0 === 'house';
    const nTr = oversize ? 1 : M.wpick([[2, 1], [3, 2], [2, 3]]);
    const mixed = !oversize && nTr > 1 && M.chance(0.3);
    const altLoad = M.pick(['container', 'tank', 'vehicle', 'logs']);
    const place = M.pick(Object.keys(PLACES));
    const woodPlace = M.pick(['HIGHLAND', 'COASTAL', 'TUNDRA', 'STEPPE']);
    const sv = M.pick([1, -1]);
    const azK = M.r(0, 1), el = M.r(22, 28);
    const R = M.r(0.52, 0.62);
    const Rt = R * M.r(0.88, 0.98);
    const Rp = M.r(0.4, 0.46);
    const trLens = Array.from({ length: 3 }, () => M.r(0, 1));
    const axN = Array.from({ length: 3 }, () => M.pick([2, 3, 3]));
    const platAx = M.ri(6, 9);
    const cabSeed = Array.from({ length: 24 }, () => M.rng());
    const bullbar = M.chance(0.55);
    const stacks = M.pick([1, 2]);
    const beacon = M.chance(0.6);
    const cont40 = M.chance(0.5);
    const tankR = M.r(1.0, 1.2);
    const stageR = M.r(1.4, 1.9), stageL = M.r(13, 19);
    const scopeR = M.r(1.3, 1.8);
    const logR = Array.from({ length: 40 }, () => M.r(0.17, 0.3));
    const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
    const desig = M.chance(0.5) ? `${M.pick(LET.split(''))}${M.pick(LET.split(''))}-${M.ri(100, 999)}` : `TYPE ${M.ri(4, 60)}-${M.pick(LET.split(''))}`;
    const fleetNo = String(M.ri(1, 99));

    const az = sv * (nTr >= 2 ? 63 + azK * 8 : 54 + azK * 10);
    M.setView(az, el);
    const e = M.view.e;
    const sy = e[1] >= 0 ? 1 : -1;

    // ------------------------------------------------ layout along x (front at +x)
    const lcab = { cabover: 2.3, bonnet: 4.2, bubble: 2.6, crow: 3.0 }[cab];
    const Wd = oversize ? 3.0 : 2.5;
    const trailers = [];
    for (let i = 0; i < nTr; i++) {
      let kind = i === 0 ? 'semi' : 'full';
      let load = mixed && i > 0 && i % 2 === 1 ? altLoad : load0;
      if (load === 'stage' || load === 'telescope') kind = 'platform';
      let len;
      if (kind === 'platform') len = (load === 'stage' ? stageL : scopeR * 7) + 2.5;
      else if (load === 'container') len = cont40 ? 12.9 : 7.6;
      else if (load === 'house') len = 11 + trLens[i] * 2;
      else len = 8.5 + trLens[i] * 4;
      if (load === 'container' && !cont40 && i === 0 && nTr === 1) len = 13.0;
      trailers.push({ kind, load, len, nAx: kind === 'platform' ? platAx : axN[i] });
    }
    let total = lcab + 2.2 + 1.6;
    trailers.forEach((t, i) => { total += i === 0 ? t.len - 2.8 : t.len + 2.4; });
    const xF = total / 2;
    const xcb = xF - lcab;
    const xfw = xcb - 2.2;
    const zr0 = R * 0.95, zr1 = zr0 + 0.32;
    const zfw = zr1 + 0.38;

    const massBox = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    const grow = (b) => { for (let i = 0; i < 3; i++) { massBox[i] = Math.min(massBox[i], b[i]); massBox[i + 3] = Math.max(massBox[i + 3], b[i + 3]); } };
    const centers = [];
    let nWheels = 0;

    const axle = (x, r, yw, twin, label) => {
      for (const s of [1, -1]) {
        if (twin) { for (const d of [-1, 1]) M.at(x, s * yw + d * r * 0.36, r, () => G.bigWheel(M, { r, w: r * 0.62, tread: 'ribs' })); nWheels += 2; }
        else { M.at(x, s * yw, r, () => G.bigWheel(M, { r, w: r * 0.7, tread: 'ribs' })); nWheels++; }
      }
      M.tube([x, -yw + 0.15, r], [x, yw - 0.15, r], r * 0.14, { isect: false });
      centers.push([[x, -yw - 0.9, r], [x, yw + 0.9, r]]);
      const yo = sy * (yw + (twin ? r * 0.36 + r * 0.31 : r * 0.35));
      co(M, label, 0, [x, yo, r + r * 0.62], 2);
    };

    // ------------------------------------------------ tractor
    const xRearT = xfw - 1.6;
    const xa = cab === 'bonnet' ? xF - 1.2 : xF - 1.3;
    M.part('CHASSIS', () => {
      for (const s of [1, -1]) M.box([xRearT, s * 0.35, zr0], [xF - 0.3, s * 0.55, zr1], { isect: false });
      for (const x of [xRearT + 0.2, xfw, xcb - 0.2, xa]) M.box([x - 0.08, -0.55, zr0 + 0.05], [x + 0.08, 0.55, zr1 - 0.05], { isect: false });
      // fifth wheel
      M.box([xfw - 0.6, -0.6, zr1], [xfw + 0.6, 0.6, zfw - 0.12]);
      M.at(xfw, 0, zfw - 0.12, () => M.cyl(0.62, 0, 0.1));
      co(M, 'FIFTH WHEEL', 1, [xfw + 0.5, sy * 0.3, zfw], 0.8);
    });
    M.part('WHEEL', () => {
      axle(xa, R, 1.08, false, 'WHEEL');
      const xr = xfw - 0.25;
      axle(xr + 0.68, R, 0.92, true, 'WHEEL');
      axle(xr - 0.68, R, 0.92, true, 'WHEEL');
      // mudguards over the drive axles and the steer axle
      for (const s of [1, -1]) {
        M.box([xr - 1.4, s * 0.55, 2 * R + 0.12], [xr + 1.4, s * (0.92 + R * 0.75), 2 * R + 0.17], { isect: false });
        M.at(xa, s * 1.08, R, () => G.fender(M, { r: R, w: R * 0.85, a0: 20, a1: 160 }));
        M.box([xr - 1.42, s * (0.92 + R * 0.6), 0.35], [xr - 1.38, s * (0.92 + R * 0.75 - 0.0), 2 * R + 0.12], { isect: false });
      }
    });
    // fuel tank, air tanks, battery box under the cab
    M.part('FUEL TANK', () => {
      const ft0 = xcb - 0.1, ft1 = xa + R + 0.25;
      const fx1 = Math.min(ft0 + 0.2, xfw - 0.8), fx0 = xfw + 0.9;
      void ft1;
      const tl = Math.max(1.1, Math.min(2.0, (xa - R - 0.3) - fx0));
      for (const s of [1, -1]) {
        M.at(xa - R - 0.3 - tl / 2, s * 0.85, zr0 + 0.05, () => K.tankCapsule(M, { r: 0.32, len: tl, bands: true }));
        for (const dx of [-tl * 0.3, tl * 0.3]) M.box([xa - R - 0.3 - tl / 2 + dx - 0.04, s * 0.55, zr0 - 0.3], [xa - R - 0.3 - tl / 2 + dx + 0.04, s * 0.95, zr0 + 0.4], { isect: false });
      }
      void fx1;
      co(M, 'FUEL TANK', 2, [xa - R - 0.3 - tl / 2, sy * 1.15, zr0 + 0.1], 1.4);
    });

    let cabTop = 3.5;
    M.part('CAB', () => {
      const cw = 2.45;
      if (cab === 'cabover' || cab === 'bonnet') {
        const x1 = cab === 'cabover' ? xF : xF - 1.9;
        const x0 = xcb;
        const z0 = cab === 'cabover' ? zr1 + 0.35 : zr1 + 0.25;
        const h = cab === 'cabover' ? 2.25 : 1.95;
        const rake = cab === 'cabover' ? 0.18 : 0.45;
        const prof = [[x0, z0], [x1, z0], [x1, z0 + h * 0.48], [x1 - rake, z0 + h], [x0, z0 + h]];
        const C = M.extrude(prof, -cw / 2, cw / 2, { plane: 'xz' });
        grow(C.bbox);
        cabTop = z0 + h;
        // windscreen on s2, grille and lamps on s1
        const ws = C.f('s2');
        if (ws.on) G.glazing(ws, [-ws.w / 2 + 0.12, -ws.h / 2 + 0.08, ws.w / 2 - 0.12, ws.h / 2 - 0.12], 2, 1);
        const fr = C.f('s1');
        if (fr.on) {
          if (cab === 'cabover') { K.louver(fr, [-fr.w * 0.3, -fr.h / 2 + 0.1, fr.w * 0.3, fr.h / 2 - 0.12]); K.stencil(fr, fleetNo, fr.w * 0.38, 0, fr.h * 0.3); }
          else K.corrugated(fr, [-fr.w / 2 + 0.1, -fr.h / 2 + 0.1, fr.w / 2 - 0.1, fr.h / 2 - 0.1]);
        }
        for (const s of [1, -1]) {
          const f = C.f(s > 0 ? '+y' : '-y');
          if (!f.on) continue;
          const yWin = z0 + h * 0.5 - f.o[2];
          const top = G.clipY(f.poly, yWin, true);
          if (top.length >= 3) G.pane(f, G.inset(top, 0.12), {});
          // door
          const dx0 = f.poly.reduce((a, p) => Math.min(a, p[0]), 0), dx1 = f.poly.reduce((a, p) => Math.max(a, p[0]), 0);
          const dl = (dx1 - dx0) * 0.55, dc = (dx0 + dx1) / 2 + (s * sy > 0 ? 0 : 0);
          f.rect(dc - dl / 2, -f.h / 2 + 0.1, dc + dl / 2, yWin + f.mOf(1.5), { w: 1 });
          f.rect(dc + dl * 0.28, yWin - 0.35, dc + dl * 0.4, yWin - 0.28, { w: 1 });
          f.hatch([dx0 + 0.05, -f.h / 2 + 0.05, dx1 - 0.05, yWin - f.mOf(3)], { angle: 0, gap: 3.4 - f.tone, w: 0, holes: [[dc - dl / 2, -f.h / 2, dc + dl / 2, yWin]] });
          K.stencil(f, desig, dc, -f.h * 0.18, Math.min(0.16, dl / desig.length * 1.2));
        }
        const rf = C.f('s3'); if (rf.on) for (const r of rf.grid(2, 2)) K.plain(rf, r, { shade: false });
        const bk = C.f('s4'); if (bk.on) G.skin(bk, { cell: 0.9, rows: 2 });
        // steps under the doors, mirrors, sun visor
        for (const s of [1, -1]) {
          for (const z of [z0 - 0.45, z0 - 0.05]) M.box([(x0 + x1) / 2 - 0.35, s * (cw / 2 - 0.05), z - 0.04], [(x0 + x1) / 2 + 0.35, s * (cw / 2 + 0.22), z], { isect: false });
          M.tube([x1 - rake - 0.05, s * cw / 2, z0 + h * 0.75], [x1 - rake + 0.1, s * (cw / 2 + 0.45), z0 + h * 0.75], 0.025, { isect: false });
          M.box([x1 - rake + 0.05, s * (cw / 2 + 0.4), z0 + h * 0.55], [x1 - rake + 0.12, s * (cw / 2 + 0.6), z0 + h * 0.9], { isect: false });
        }
        M.box([x1 - rake - 0.1, -cw / 2, z0 + h - 0.02], [x1 - rake + 0.35, cw / 2, z0 + h + 0.05], { isect: false });
        // air deflector or roof lamps
        if (beacon) for (const y of [-0.8, -0.3, 0.3, 0.8]) M.at(x1 - rake - 0.3, y, z0 + h, () => M.at(0, 0, 0.12, () => K.lamp(M, { r: 0.08 })));
        if (cab === 'bonnet') {
          // the hood
          const hz1 = z0 + h * 0.48;
          const Hd = M.extrude([[x1, zr1], [xF, zr1], [xF, hz1 - 0.25], [xF - 0.3, hz1], [x1, hz1]], -0.85, 0.85, { plane: 'xz' });
          for (const s of [1, -1]) { const f = Hd.f(s > 0 ? '+y' : '-y'); if (f.on) { f.grid(3, 1, { gap: 2.4, rect: [-f.w / 2 + 0.1, -f.h / 2 + 0.12, f.w / 2 - 0.1, f.h / 2 - 0.12] }).forEach((r, i) => (i === 1 ? K.louver(f, r) : K.plain(f, r))); } }
          const g = Hd.f('s1'); if (g.on) { K.louver(g, [-g.w / 2 + 0.1, -g.h / 2 + 0.08, g.w / 2 - 0.1, g.h / 2 - 0.08]); }
          const tp = Hd.f('s3'); if (tp.on) { tp.line(0, -tp.h / 2, 0, tp.h / 2, { w: 1 }); tp.rivets(-tp.w * 0.4, 0, tp.w * 0.4, 0, { pitch: 8 }); }
          co(M, 'ENGINE HOOD', 1, [(x1 + xF) / 2, sy * 0.85, (zr1 + hz1) / 2], 1.6);
        }
        co(M, 'CAB', 1, [(x0 + x1) / 2, sy * cw / 2, z0 + h * 0.3], 2.4);
        co(M, 'WINDSCREEN', 1, ws.ok ? ws.P(0, 0) : [x1, 0, z0 + h * 0.7], 1.5);
      } else if (cab === 'bubble') {
        // low pod with a bubble canopy over the front axle
        const z0 = zr1 + 0.05, h = 1.0;
        const P = M.box([xcb, -cw / 2, z0], [xF - 0.2, cw / 2, z0 + h], { chamfer: 0.5 });
        grow(P.bbox);
        for (const k of ['+y', '-y', '+x', 'c1', 'c0', '-x', 'c2', 'c3']) G.skin(P.f(k), { cell: 0.8, rows: 1, kind: (r) => (k === '+x' ? 'louver' : 'corrugated') });
        M.at((xcb + xF - 0.2) / 2 + 0.1, 0, z0 + h, () => K.canopy(M, { len: lcab - 0.4, w: cw - 0.3, h: 1.35 }));
        cabTop = z0 + h + 1.35;
        co(M, 'BUBBLE CANOPY', 1, [(xcb + xF) / 2 + 0.3, sy * 0.4, z0 + h + 1.1], 2.4);
        co(M, 'CAB POD', 1, [(xcb + xF) / 2, sy * cw / 2, z0 + h * 0.5], 1.4);
      } else {
        // crow's nest: an engine box, four posts and a glazed cab high up, a ladder
        const z0 = zr1;
        const E = M.box([xcb, -1.05, z0], [xF - 0.25, 1.05, z0 + 1.5]);
        grow(E.bbox);
        for (const k of ['+y', '-y', '+x']) G.skin(E.f(k), { cell: 0.8, rows: 2, kind: (r) => (r.j === 1 ? 'louver' : 'corrugated') });
        const zc = z0 + 1.5 + 2.1;
        const c0 = xcb + 0.1, c1 = xF - 0.15;
        for (const x of [c0 + 0.1, c1 - 0.3]) for (const s of [1, -1]) K.strut(M, [x, s * 0.9, z0 + 1.5], [x, s * 0.9, zc], 0.08, {});
        for (const s of [1, -1]) M.tube([c0 + 0.1, s * 0.9, z0 + 1.6], [c1 - 0.3, s * 0.9, zc - 0.1], 0.05, { isect: false });
        const C = M.box([c0 - 0.1, -1.1, zc], [c1 + 0.05, 1.1, zc + 1.8]);
        for (const k of ['+x', '+y', '-y', '-x']) { const f = C.f(k); if (f.on) { G.glazing(f, [-f.w / 2 + 0.08, -0.05, f.w / 2 - 0.08, f.h / 2 - 0.1], Math.max(2, Math.round(f.w / 0.8)), 1); K.corrugated(f, [-f.w / 2 + 0.05, -f.h / 2 + 0.05, f.w / 2 - 0.05, -0.15]); } }
        M.box([c0 - 0.25, -1.25, zc + 1.8], [c1 + 0.25, 1.25, zc + 1.9]);
        K.railing(M, [[c1 + 0.05, -1.1, zc], [c1 + 0.6, -1.1, zc], [c1 + 0.6, 1.1, zc], [c1 + 0.05, 1.1, zc]], { h: 0.95, posts: 0.8 });
        M.box([c1 + 0.05, -1.1, zc - 0.08], [c1 + 0.6, 1.1, zc]);
        M.at(c0 + 0.6, sy * 1.15, 0.45, () => M.rz(90, () => K.ladder(M, { h: zc - 0.45, w: 0.45 })));
        cabTop = zc + 1.9;
        co(M, "CROW'S NEST CAB", 1, [(c0 + c1) / 2, sy * 1.1, zc + 1.2], 2.6);
        co(M, 'CAB LADDER', 1, [c0 + 0.6, sy * 1.2, zc * 0.5], 1.4);
        co(M, 'ENGINE HOUSE', 1, [(xcb + xF) / 2, sy * 1.05, z0 + 0.7], 1.3);
      }
      // bumper, lamps, bull bar
      const zb = zr0 - 0.05;
      M.box([xF - 0.25, -1.2, zb], [xF + 0.05, 1.2, zb + 0.42]);
      for (const s of [1, -1]) M.at(xF + 0.05, s * 0.9, zb + 0.25, () => K.lamp(M, { r: 0.11 }));
      co(M, 'HEADLAMP', 2, [xF + 0.2, sy * 0.9, zb + 0.25], 0.9);
      if (bullbar) {
        const bx = xF + 0.35, top = zb + 1.25;
        M.pipe([[xF + 0.05, -1.15, zb + 0.1], [bx, -1.15, zb + 0.25], [bx, -1.1, top], [bx, 1.1, top], [bx, 1.15, zb + 0.25], [xF + 0.05, 1.15, zb + 0.1]], 0.05, { isect: false });
        for (const y of [-0.45, 0.45]) M.tube([bx, y, zb + 0.2], [bx, y, top], 0.045, { isect: false });
        M.tube([bx, -1.12, zb + 0.75], [bx, 1.12, zb + 0.75], 0.04, { isect: false });
        co(M, 'BULL BAR', 1, [bx, sy * 0.8, top], 1.5);
      }
      // stacks and air intake behind the cab
      for (let i = 0; i < stacks; i++) {
        const s = i === 0 ? -sy : sy;
        M.at(xcb - 0.3, s * 0.95, zr1, () => K.stack(M, { r: 0.13, h: Math.max(2.6, cabTop - zr1 + 0.4) }));
      }
      co(M, 'EXHAUST STACK', stacks, [xcb - 0.3, -sy * 0.95, cabTop], 1.2);
      // horn
      M.at(xcb - 0.1, sy * 0.4, cabTop - 0.05, () => K.horn(M, { r: 0.09 }));
    });

    // ------------------------------------------------ trailers
    let prevRear = xRearT, prevKind = 'tractor';
    let firstLoadAnchor = null;
    let cargoUnits = 0, cargoText = '';
    trailers.forEach((t, i) => {
      const rt = t.kind === 'platform' ? Rp : Rt;
      let xfront, zd;
      if (i === 0) { xfront = xfw + 1.2; }
      else xfront = prevRear - 2.4;
      const xrear = xfront - t.len;
      zd = t.kind === 'platform' ? 2 * rt + 0.38 : zfw + 0.4;
      const yw = t.kind === 'platform' ? Wd / 2 - rt * 0.75 : Wd / 2 - 0.42;
      const label = t.kind === 'platform' ? 'PLATFORM TRAILER' : i === 0 ? 'SEMI-TRAILER' : 'TRAILER';
      let loadX0 = xrear + 0.25, loadX1 = xfront - 0.25;
      M.part(label, () => {
        // the deck
        let D;
        if (t.kind === 'platform') {
          const xn = xfw - 1.6;
          const prof = [[xrear, zd - 0.42], [xn, zd - 0.42], [xn + 0.9, zfw], [xfront, zfw], [xfront, zfw + 0.5], [xn + 0.7, zfw + 0.5], [xn - 0.25, zd], [xrear, zd]];
          D = M.extrude(prof, -Wd / 2, Wd / 2, { plane: 'xz' });
          loadX1 = xn - 0.5;
          for (const s of [1, -1]) { const f = D.f(s > 0 ? '+y' : '-y'); if (f.on) { f.path(G.inset(f.poly, 0.06), { closed: true, w: 1 }); } }
          const tp = D.f('s6'); if (tp.on) tp.grid(Math.max(4, Math.round(tp.w / 1.2)), 1, { gap: 2.2 }).forEach((r) => { tp.rect(r, { w: 1 }); tp.hatch(r, { angle: 90, gap: 2.8, w: 0 }); });
          const nt = D.f('s4'); if (nt.on) nt.hatch(nt.box, { angle: 0, gap: 2.8, w: 0 });
          // gooseneck kingpin plate
          co(M, 'GOOSENECK', 1, [xfront - 0.8, sy * Wd / 2, zfw + 0.25], 1.5);
        } else {
          D = M.box([xrear, -Wd / 2, zd - 0.38], [xfront, Wd / 2, zd]);
          const tp = D.f('+z'); if (tp.on) tp.grid(Math.max(3, Math.round(t.len / 1.2)), 1, { gap: 2.2 }).forEach((r) => { tp.rect(r, { w: 1 }); tp.hatch(r, { angle: 90, gap: 3.0, w: 0 }); });
        }
        grow(D.bbox);
        for (const s of [1, -1]) {
          const f = D.f(s > 0 ? '+y' : '-y');
          if (!f.on) continue;
          const yb = t.kind === 'platform' ? (zd - 0.21 - f.o[2]) : 0;
          f.rivets(-f.w / 2 + 0.2, yb, f.w / 2 - 0.2, yb, { pitch: 9 });
          if (i === 0 || t.kind === 'platform') K.stencil(f, desig, (s > 0 ? -1 : 1) * f.w * 0.0 - (t.kind === 'platform' ? f.w * 0.2 * (s > 0 ? -1 : 1) : 0), yb + 0.0, 0.2);
        }
        for (const k of ['+x', '-x']) { const f = D.f(k); if (f.on) f.hatch(f.box, { angle: 0, gap: 3, w: 0 }); }
        // rear lamps and a bumper bar
        M.box([xrear - 0.12, -Wd / 2 + 0.15, zd - 0.75], [xrear + 0.05, Wd / 2 - 0.15, zd - 0.62], { isect: false });
        for (const s of [1, -1]) M.box([xrear - 0.16, s * Wd * 0.38 - 0.12, zd - 0.6], [xrear - 0.04, s * Wd * 0.38 + 0.12, zd - 0.45], { isect: false });
        // wheels
        if (t.kind === 'platform') {
          const pitch = 1.35;
          for (let k = 0; k < t.nAx; k++) {
            const x = xrear + 1.0 + k * pitch;
            if (x > xfw - 2.4) break;
            axle(x, rt, yw, true, 'WHEEL');
            for (const s of [1, -1]) M.box([x - 0.12, s * yw - 0.12, rt], [x + 0.12, s * yw + 0.12, zd - 0.4], { isect: false });
          }
        } else {
          const pitch = 2 * rt + 0.25;
          for (let k = 0; k < t.nAx; k++) {
            const x = xrear + 1.3 + k * pitch;
            axle(x, rt, yw, true, 'WHEEL');
            for (const s of [1, -1]) M.at(x, s * (yw - 0.55), rt + rt * 0.14, () => G.leafSpring(M, { len: rt * 1.6, n: 3, t: 0.04, w: 0.1 }));
          }
          for (const s of [1, -1]) M.box([xrear + 0.6, s * (yw - rt * 0.3), 2 * rt + 0.1], [xrear + 1.3 + (t.nAx - 1) * pitch + rt + 0.6, s * (yw + rt * 1.05), 2 * rt + 0.15], { isect: false });
          if (t.kind === 'semi') {
            // landing legs
            const xl = xfront - 2.2;
            for (const s of [1, -1]) { M.box([xl - 0.1, s * (Wd / 2 - 0.45) - 0.1, 0.35], [xl + 0.1, s * (Wd / 2 - 0.45) + 0.1, zd - 0.38]); M.box([xl - 0.25, s * (Wd / 2 - 0.45) - 0.2, 0.25], [xl + 0.25, s * (Wd / 2 - 0.45) + 0.2, 0.33], { isect: false }); }
            M.tube([xl, -Wd / 2 + 0.45, zd - 0.9], [xl, Wd / 2 - 0.45, zd - 0.9], 0.04, { isect: false });
            co(M, 'LANDING LEG', 2, [xl, sy * (Wd / 2 - 0.35), zd * 0.45], 1.1);
          } else {
            // the dolly and the drawbar
            for (let k = 0; k < 2; k++) {
              const x = xfront - 1.1 - k * (2 * rt + 0.25);
              axle(x, rt, yw, true, 'WHEEL');
            }
            const xd = xfront - 1.1 - (rt + 0.12);
            M.at(xd, 0, 2 * rt + 0.12, () => M.cyl(0.9, 0, zd - 0.38 - 2 * rt - 0.12));
            M.box([xfront - 2.4 - 2 * rt, -yw + 0.3, 2 * rt + 0.05], [xfront - 0.6, yw - 0.3, 2 * rt + 0.2]);
            const hz = 0.95;
            for (const s of [1, -1]) M.tube([xfront - 0.9, s * 0.7, 2 * rt + 0.1], [prevRear - 0.05, 0, hz], 0.06, {});
            M.at(prevRear - 0.05, 0, hz, () => M.sphere(0.1));
            co(M, 'DRAWBAR', nTr - 1, [(xfront + prevRear) / 2, sy * 0.3, (hz + 2 * rt) / 2], 1.3);
            co(M, 'CONVERTER DOLLY', nTr - 1, [xd, sy * yw, 2 * rt + 0.15], 1.4);
          }
        }
        co(M, label, nTr > 1 && t.kind !== 'platform' ? nTr : 1, [(xrear + xfront) / 2, sy * Wd / 2, zd - 0.2], i === 0 ? 2.2 : 1.3);
        // rear hitch for the next one
        M.box([xrear - 0.35, -0.2, 0.85], [xrear + 0.2, 0.2, zd - 0.38], { isect: false });
      });
      // ------------------------------------ the load
      const lx0 = loadX0, lx1 = loadX1, ll = lx1 - lx0, lc = (lx0 + lx1) / 2;
      const lname = { container: 'CONTAINER', tank: 'WATER TANK', ore: 'ORE BIN', logs: 'LOG BUNDLE', pipes: 'PIPE BUNDLE', house: 'HOUSE SECTION', vehicle: 'SCOUT BUGGY', stage: 'ROCKET STAGE', telescope: 'TELESCOPE TUBE' }[t.load];
      M.part(lname, () => {
        if (t.load === 'container') {
          const cl = ll > 11.9 && cont40 ? 12.19 : 6.06;
          const n = Math.max(1, Math.min(2, Math.floor(ll / (cl + 0.15))));
          for (let k = 0; k < n; k++) {
            const x = lx1 - (k + 0.5) * (ll / n);
            M.at(x, 0, zd, () => K.container(M, { len: cl, label: k === 0 && i === 0 ? 'MAIL' : desig }));
            for (const dx of [-cl / 2 + 0.1, cl / 2 - 0.1]) for (const s of [1, -1]) M.box([x + dx - 0.08, s * 1.22 - 0.08, zd - 0.02], [x + dx + 0.08, s * 1.22 + 0.08, zd + 0.1], { isect: false });
          }
          cargoUnits += n;
          co(M, 'CONTAINER', 0, [lx1 - ll / (2 * n), sy * 1.22, zd + 1.3], 2.4);
          co(M, 'TWIST LOCK', 0, [lx1 - 0.1, sy * 1.22, zd + 0.08], 0.7);
        } else if (t.load === 'tank') {
          const r = tankR;
          const tl = ll - 0.2;
          const T = M.at(lc, 0, zd + r + 0.25, () => K.tankCapsule(M, { r, len: tl }));
          if (M.decorOn && T && T.lat) { T.lat.text('WATER', sy > 0 ? 120 : 240, 0.5, r * 0.32, { along: true }); T.lat.text(desig, sy > 0 ? 110 : 250, 0.78, r * 0.16, { along: true }); }
          for (let k = 0; k < 3; k++) { const x = lx0 + 1.2 + (tl - 2.4) * k / 2; M.at(0, 0, zd, () => M.extrude([[-r * 0.85, 0], [r * 0.85, 0], [r * 0.85, 0.35], [-r * 0.85, 0.35]], x - 0.12, x + 0.12, { plane: 'yz' })); }
          // walkway, manholes, ladder
          const zt = zd + 2 * r + 0.25;
          M.box([lx0 + r, -0.3, zt], [lx1 - r, 0.3, zt + 0.06]);
          K.railing(M, [[lx0 + r + 0.1, sy * 0.3, zt + 0.06], [lx1 - r - 0.1, sy * 0.3, zt + 0.06]], { h: 0.8, posts: 1.5 });
          for (let k = 0; k < 3; k++) M.at(lx0 + r + 0.6 + (ll - 2 * r - 1.2) * (k + 0.5) / 3, -sy * 0.0, zt - 0.08, () => M.cyl(0.28, 0, 0.3));
          M.at(lx0 - 0.12, sy * 0.5, zd, () => K.ladder(M, { h: 2 * r + 0.3, w: 0.42 }));
          cargoUnits += Math.round(Math.PI * r * r * tl);
          co(M, 'WATER TANK', 0, [lc, sy * r * 0.7, zd + r * 1.6], 2.4);
          co(M, 'MANHOLE', 0, [lx0 + r + 0.6 + (ll - 2 * r - 1.2) / 6, 0, zt + 0.25], 0.8);
        } else if (t.load === 'ore') {
          const nb = ll > 9 ? 2 : 1;
          const bl = ll / nb - 0.25;
          for (let k = 0; k < nb; k++) {
            const x = lx0 + (k + 0.5) * (ll / nb);
            const hb = 1.6, wt = Wd / 2 + 0.15, wb = Wd / 2 - 0.25;
            const B = M.extrude([[-wb, zd + 0.05], [wb, zd + 0.05], [wt, zd + hb], [-wt, zd + hb]], x - bl / 2, x + bl / 2, { plane: 'yz' });
            for (const nm of ['s1', 's3']) {
              const f = B.f(nm); if (!f.on) continue;
              const n = Math.max(3, Math.round(bl / 0.9));
              for (let q = 1; q < n; q++) { const u = -f.w / 2 + f.w * q / n; f.line(u, -f.h / 2, u, f.h / 2, { w: 1 }); f.line(u + f.mOf(1.6), -f.h / 2, u + f.mOf(1.6), f.h / 2, { w: 1 }); }
              f.hatch(f.box, { angle: 90, gap: 3.6 - 1.6 * f.tone, w: 0 });
              if (k === 0) K.stencil(f, 'ORE', -f.w * 0.3, 0, 0.35);
            }
            for (const nm of ['-x', '+x']) { const f = B.f(nm); if (f.on) f.hatch(f.box, { angle: 0, gap: 3, w: 0 }); }
            // the heap
            const zt = zd + hb;
            const H = M.loft([[x - bl / 2 + 0.1, -wt + 0.1, zt], [x + bl / 2 - 0.1, -wt + 0.1, zt], [x + bl / 2 - 0.1, wt - 0.1, zt], [x - bl / 2 + 0.1, wt - 0.1, zt]],
              [[x - bl * 0.25, -0.3, zt + 0.75], [x + bl * 0.25, -0.3, zt + 0.75], [x + bl * 0.25, 0.3, zt + 0.75], [x - bl * 0.25, 0.3, zt + 0.75]], { caps: true });
            for (const nm of ['s0', 's1', 's2', 's3', 'b', 's0b', 's1b', 's2b', 's3b']) { const f = H.f(nm); if (f.on) f.hatch(f.box, { angle: 20 + f.tone * 30, gap: 4.5 - 2.5 * f.tone, w: 0 }); }
            // tipping ram under the bin
            M.tube([x, sy * 0.0, zd], [x - 0.2, 0, zd + 0.05], 0.1, { isect: false });
          }
          cargoUnits += Math.round(ll * Wd * 1.6 * 2.2);
          co(M, 'ORE BIN', 0, [lc, sy * (Wd / 2), zd + 1.0], 2.4);
          co(M, 'ORE LOAD', 0, [lc, 0, zd + 2.2], 1.0);
        } else if (t.load === 'logs' || t.load === 'pipes') {
          const isLog = t.load === 'logs';
          const r0 = isLog ? 0.24 : 0.28;
          const rows = [4, 3, 2];
          let q = 0;
          const bl = ll - 0.4;
          rows.forEach((n, j) => {
            for (let k = 0; k < n; k++) {
              const r = isLog ? logR[(q++) % 40] : r0;
              const y = (k - (n - 1) / 2) * r0 * 2.05;
              const z = zd + r0 + j * r0 * 1.78;
              const dx = isLog ? (logR[(q + 7) % 40] - 0.23) * 3 : 0;
              const C = M.at(lc + dx, y, z, () => M.cyl(r, -bl / 2, bl / 2, { axis: 'x', isect: false }));
              for (const fc of [C.top, C.bottom]) if (fc.on) {
                if (isLog) { fc.circle(0, 0, r * 0.65, { w: 0 }); fc.circle(0, 0, r * 0.33, { w: 0 }); }
                else { fc.circle(0, 0, r * 0.82, { w: 1 }); fc.hatch(G.circlePts(0, 0, r * 0.8, r * 0.8, 16), { angle: 45, gap: 1.2, w: 0 }); }
              }
              if (M.decorOn && isLog) C.lat.shade({ gap: 2.0, gapMax: 5 });
            }
          });
          // stakes and chains
          const ns = Math.max(3, Math.round(bl / 2.4));
          for (let k = 0; k < ns; k++) {
            const x = lx0 + 0.3 + (ll - 0.6) * k / (ns - 1);
            for (const s of [1, -1]) M.box([x - 0.06, s * (Wd / 2 - 0.08) - 0.06, zd], [x + 0.06, s * (Wd / 2 - 0.08) + 0.06, zd + r0 * 5.2], { isect: false });
            if (k > 0 && k < ns - 1) M.line([[x, -Wd / 2, zd + 0.1], [x, -r0 * 2.2, zd + r0 * 4.6], [x, r0 * 2.2, zd + r0 * 4.6], [x, Wd / 2, zd + 0.1]], { w: 1, pass: 2 });
          }
          cargoUnits += 9;
          co(M, isLog ? 'LOG BUNDLE' : 'PIPE BUNDLE', 0, [lc, sy * r0 * 2, zd + r0 * 4], 2.4);
          co(M, 'STAKE', ns * 2, [lx0 + 0.3, sy * (Wd / 2 - 0.02), zd + r0 * 4], 0.9);
        } else if (t.load === 'house') {
          const hl = ll - 0.4, hw = Wd + 1.6;
          M.at(lc, 0, zd + 0.15, () => G.hut(M, { len: hl, w: hw, h: 2.5, rise: hw * 0.22, porch: false, doorSide: sy }));
          for (let k = 0; k < 3; k++) M.box([lx0 + 0.6 + (ll - 1.2) * k / 2 - 0.15, -hw / 2 - 0.1, zd], [lx0 + 0.6 + (ll - 1.2) * k / 2 + 0.15, hw / 2 + 0.1, zd + 0.15], { isect: false });
          // oversize boards: at the back of the trailer and above the cab
          signBoard(M, [xrear - 0.25, 0, zd + 0.15], 'OVERSIZE LOAD', 2.4, 0.5, [-1, 0]);
          signBoard(M, [xcb + 0.4, 0, cabTop + 0.4], 'OVERSIZE LOAD', 2.2, 0.45, [1, 0]);
          M.tube([xcb + 0.4, -0.8, cabTop], [xcb + 0.4, -0.8, cabTop + 0.2], 0.03, { isect: false });
          M.tube([xcb + 0.4, 0.8, cabTop], [xcb + 0.4, 0.8, cabTop + 0.2], 0.03, { isect: false });
          co(M, 'HOUSE SECTION', 1, [lc, sy * hw / 2, zd + 1.6], 2.6);
          co(M, 'OVERSIZE SIGN', 2, [xcb + 0.45, 0, cabTop + 0.4], 1.0);
        } else if (t.load === 'vehicle') {
          const bl = Math.min(ll * 0.8, 3.6);
          M.at(lc, 0, zd, () => G.buggy(M, bl, desig));
          for (const s of [1, -1]) for (const dx of [-bl * 0.45, bl * 0.45]) M.line([[lc + dx * 1.15, s * Wd * 0.48, zd], [lc + dx * 0.75, s * bl * 0.3, zd + bl * 0.17]], { w: 1, pass: 2 });
          cargoUnits += 1;
          co(M, 'SCOUT BUGGY', 1, [lc, sy * bl * 0.2, zd + bl * 0.3], 2.4);
          co(M, 'TIE-DOWN CHAIN', 4, [lc + bl * 0.5, sy * Wd * 0.45, zd + 0.05], 0.8);
        } else {
          // stage or telescope tube in lattice cradles
          const isStage = t.load === 'stage';
          const r = isStage ? stageR : scopeR;
          const tl = isStage ? stageL : scopeR * 7;
          const zc = zd + r + 0.55;
          const xc = (lx0 + lx1) / 2;
          for (const u of [-0.32, 0.3]) {
            const x = xc + u * tl;
            for (const s of [1, -1]) {
              const a = [x, s * (Wd / 2 - 0.1), zd], b = [x, s * r * 0.72, zc - r * 0.72];
              K.girder(M, a, b, { w: 0.3, sec: 3 });
              K.girder(M, [x, s * (Wd / 2 - 0.1), zd], [x, 0, zd + 0.4], { w: 0.25, sec: 3 });
            }
            M.box([x - 0.2, -Wd / 2, zd], [x + 0.2, Wd / 2, zd + 0.15]);
            // strap
            M.at(x, 0, zc, () => M.ry(90, () => M.cyl(r + 0.03, -0.08, 0.08, { isect: false })));
          }
          if (isStage) {
            const prof = [[0, -tl / 2], [r * 0.7, -tl / 2], [r, -tl / 2 + 0.3], [r, tl / 2 - 0.1], [r * 0.97, tl / 2]];
            prof.push([0, tl / 2]);
            const S = M.at(xc, 0, zc, () => M.lathe(prof, { axis: 'x' }));
            if (M.decorOn) {
              const Lt = S.lat;
              const t0 = Lt.cum[2] / Lt.total, t1 = Lt.cum[3] / Lt.total;
              for (const q of [0.12, 0.45, 0.48, 0.8]) Lt.ring(t0 + (t1 - t0) * q, { w: 1 });
              for (let k = 0; k < 12; k++) Lt.meridian(k * 30 + 15, t0, t1, { w: 0 });
              Lt.shade({ t0, t1, gap: 1.8, gapMax: 5 });
              Lt.text(desig, 180 - 90 * sy * 0 + (sy > 0 ? -60 : 60) + 0, t0 + (t1 - t0) * 0.3, r * 0.35, { along: true });
              Lt.text('STAGE 1', sy > 0 ? 120 : 240, t0 + (t1 - t0) * 0.66, r * 0.22, { along: true });
            }
            // engines at the back
            M.at(xc - tl / 2, 0, zc, () => M.ry(-90, () => K.nozzles(M, { n: r > 1.65 ? 5 : 4, r: r * 0.28, len: r * 0.55 })));
            // protective end cover at the front
            M.at(xc + tl / 2, 0, zc, () => M.ry(90, () => M.cyl(r * 0.98, 0, 0.12)));
            co(M, 'ROCKET STAGE', 1, [xc, sy * r * 0.7, zc + r * 0.7], 2.7);
            co(M, 'ENGINE BELL', r > 1.65 ? 5 : 4, [xc - tl / 2 - r * 0.4, sy * r * 0.4, zc], 1.4);
          } else {
            const prof = [[r * 0.9, -tl / 2], [r * 1.05, -tl / 2], [r * 1.05, -tl / 2 + 0.6], [r, -tl / 2 + 0.6], [r, tl / 2 - 1.0], [r * 1.08, tl / 2 - 1.0], [r * 1.08, tl / 2], [r * 1.02, tl / 2]];
            const S = M.at(xc, 0, zc, () => M.lathe(prof, { axis: 'x', open: true }));
            if (M.decorOn) {
              const Lt = S.lat;
              const t0 = Lt.cum[3] / Lt.total, t1 = Lt.cum[4] / Lt.total;
              for (let k = 1; k < 6; k++) Lt.ring(t0 + (t1 - t0) * k / 6, { w: 1 });
              Lt.shade({ t0, t1, gap: 1.8, gapMax: 5 });
            }
            // the open end: dark inside, spider vanes
            M.at(xc + tl / 2, 0, zc, () => M.ry(90, () => {
              const C = M.cyl(r * 0.99, -0.4, -0.38, { isect: false });
              if (C.top.on) { C.top.hatch(G.circlePts(0, 0, r * 0.95, r * 0.95, 32), { angle: 60, gap: 1.0, gap2: 2.4, w: 0 }); C.top.line(-r * 0.95, 0, r * 0.95, 0, { w: 1 }); C.top.line(0, -r * 0.95, 0, r * 0.95, { w: 1 }); C.top.circle(0, 0, r * 0.25, { w: 1 }); }
            }));
            // mirror cell at the back
            M.at(xc - tl / 2, 0, zc, () => M.ry(-90, () => { M.cyl(r * 0.92, 0, 0.35); for (let k = 0; k < 6; k++) M.rz(k * 60, () => M.box([0, -0.05, 0.35], [r * 0.85, 0.05, 0.6], { isect: false })); }));
            co(M, 'TELESCOPE TUBE', 1, [xc, sy * r * 0.7, zc + r * 0.7], 2.7);
            co(M, 'MIRROR CELL', 1, [xc - tl / 2 - 0.4, sy * r * 0.4, zc], 1.4);
          }
          co(M, 'LATTICE CRADLE', 2, [xc - 0.32 * tl, sy * (Wd / 2 - 0.2), zd + 0.5], 1.6);
          signBoard(M, [xrear - 0.25, 0, zd + 0.1], 'OVERSIZE LOAD', 2.4, 0.5, [-1, 0]);
          signBoard(M, [xcb + 0.4, 0, cabTop + 0.4], 'OVERSIZE LOAD', 2.2, 0.45, [1, 0]);
          co(M, 'OVERSIZE SIGN', 2, [xcb + 0.45, 0, cabTop + 0.4], 1.0);
        }
      });
      if (!firstLoadAnchor) firstLoadAnchor = lc;
      prevRear = xrear; prevKind = t.kind;
    });
    void prevKind; void firstLoadAnchor;

    // escort beacons on the cab roof for oversize loads, whip antenna
    M.part('WHIP ANTENNA', () => {
      M.at(xcb + 0.25, sy * 1.0, cabTop, () => K.whip(M, { h: 2.2, lean: 12 }));
    });

    // ------------------------------------------------ vocabulary
    for (const c of M.callouts) if (c.label === 'WHEEL') c.qty = nWheels;
    const cont = M.callouts.find((c) => c.label === 'CONTAINER'); if (cont) cont.qty = trailers.filter((t) => t.load === 'container').length * (cont40 ? 1 : 2) || 1;
    for (const lb of ['WATER TANK', 'ORE BIN', 'LOG BUNDLE', 'PIPE BUNDLE', 'TWIST LOCK', 'ORE LOAD']) { const c = M.callouts.find((q) => q.label === lb); if (c) c.qty = lb === 'TWIST LOCK' ? 4 * trailers.length : trailers.filter((t) => ({ 'WATER TANK': 'tank', 'ORE BIN': 'ore', 'ORE LOAD': 'ore', 'LOG BUNDLE': 'logs', 'PIPE BUNDLE': 'pipes' })[lb] === t.load).length * (lb.startsWith('ORE') ? 1 : 1); }
    for (const c of M.callouts) if (c.label === 'MANHOLE') c.qty = 3 * trailers.filter((t) => t.load === 'tank').length;
    for (const c of M.callouts) if (!c.qty) c.qty = 1;
    M.info.mass = massBox;
    M.info.centers = centers;
    const place2 = load0 === 'logs' ? woodPlace : place;
    const where = PLACES[place2];
    const n = nTr;
    const jobs = { container: 'MAIL', tank: 'WATER', ore: 'ORE', logs: 'TIMBER', pipes: 'PIPELINE', house: 'HOUSE', vehicle: 'RECOVERY', stage: 'ROCKET STAGE', telescope: 'TELESCOPE' };
    let job = jobs[load0];
    let form = n >= 2 ? 'ROAD TRAIN' : M.pick(['HAULER', 'TRUCK']);
    if (oversize && load0 !== 'house') form = 'TRANSPORTER';
    if (load0 === 'house') form = 'HAULER';
    if (load0 === 'container' && n === 1) job = M.pick(['MAIL', 'FREIGHT']);
    const kl = Math.round(trailers.filter((t) => t.load === 'tank').reduce((a, t) => a + Math.PI * tankR * tankR * (t.len - 0.7) * 1000, 0) / 1000) * 1000;
    let brief;
    if (mixed) brief = `Pulls ${word(n)} trailers of ${load0 === 'tank' ? 'water' : load0 === 'ore' ? 'ore' : 'stores'} and mixed loads across ${where}.`;
    else if (load0 === 'container') brief = n > 1 ? `Pulls ${word(n)} trailers of mail containers across ${where}.` : `Carries mail containers between towns on ${where}.`;
    else if (load0 === 'tank') brief = `Carries ${thou(kl)} liters of water to stations on ${where}.`;
    else if (load0 === 'ore') brief = `Hauls ore from the pit to the railhead in ${word(n * (trailers[0].len - 0.5 > 9 ? 2 : 1))} bins.`;
    else if (load0 === 'logs') brief = `Hauls logs out of ${where} on ${word(n)} trailer${n > 1 ? 's' : ''}.`;
    else if (load0 === 'pipes') brief = `Brings pipe sections to the line camps on ${where}.`;
    else if (load0 === 'house') brief = `Moves prefabricated houses to new camps on ${where}.`;
    else if (load0 === 'vehicle') brief = `Recovers broken vehicles from ${where} on low flatbeds.`;
    else if (load0 === 'stage') brief = `Carries a ${Math.round(stageL)} m rocket stage from the works to the launch pad.`;
    else brief = `Carries a telescope tube from the works up to the mountain.`;
    if (brief.length > 78) brief = brief.replace(/ (across|on|out of|from) the [a-z ]+/, '').slice(0, 78);
    const len = massBox[3] - massBox[0];
    const tons = Math.round(len * 3.2 + nWheels * 0.8);
    return {
      place: oversize && load0 !== 'house' ? null : place2, job, form,
      designation: desig,
      brief,
      specs: [['GROSS MASS', `${tons} T`], ['AXLES', String(Math.round(nWheels / 3.6))], ['WHEELS', String(nWheels)], ['POWER', `${Math.round(len * 12 / 10) * 10 + 200} KW`]],
    };
  },
};

// a sign board in a frame: at p (local), facing dir [dx, dy] (horizontal), lettered text
function signBoard(M, p, text, w, h, dir) {
  const ang = Math.atan2(dir[1], dir[0]) / D2R;
  M.at(p[0], p[1], p[2], () => M.rz(ang, () => {
    const B = M.box([0, -w / 2, 0], [0.05, w / 2, h], { isect: false });
    const f = B.f('+x');
    if (f.on) { f.rect(-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2), { w: 1 }); K.stencil(f, text, 0, 0, Math.min(h * 0.45, w / text.length * 1.3)); }
  }));
}

function co(M, label, qty, p, prio) {
  const w = M.W(p), e = M.view.e, k = (M.px || 0) * 4;
  M.world(() => M.callout(label, qty, [w[0] + e[0] * k, w[1] + e[1] * k, w[2] + e[2] * k], prio));
}
