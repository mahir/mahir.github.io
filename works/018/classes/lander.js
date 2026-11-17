// classes/lander.js: a hull on truss legs with a topside. The first class, close to the
// reference drawing: cube, octagonal prism or drum; 3..4 legs with footpads; fold-down
// platforms and a ladder; a helipad with a small helicopter, a dish, a crane, a tank farm,
// a cupola or a lamp mast on the roof; a whip antenna.

import * as K from '../kit.js';
import { dot, D2R } from '../geom.js';

const WORD = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export default {
  id: 'lander',
  family: 'space',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices (all random draws up front)
    const form = M.wpick([[4, 'cube'], [3, 'oct'], [2, 'drum']]);
    const W = M.r(6.8, 10.5);                         // hull width (y)
    const Lx = form === 'drum' ? W : W * M.wpick([[3, 1], [1, M.r(1.08, 1.3)]]);
    const H = W * M.r(0.72, 1.0);
    const zb = M.r(3.4, 4.8);                         // hull bottom
    const zt = zb + H;
    const nLegs = form === 'drum' ? M.pick([3, 4, 4]) : 4;
    const legSpread = M.r(3.2, 5.0);
    const legHi = M.r(0.4, 0.55);
    const legR = M.r(0.17, 0.23) * (W / 9) ** 0.5;
    const az0 = M.pick([45, 45, 135, -45, -135]);
    const az = az0 + M.r(-14, 14);
    const el = M.r(27, 38);
    M.setView(az, el);
    const topKind = M.wpick([[3.2, 'helipad'], [1.3, 'dish'], [1.2, 'crane'], [1.2, 'tanks'], [1, 'cupola'], [1, 'mast']]);
    const tier = topKind !== 'helipad' && M.chance(0.45);
    const tierW = M.r(0.45, 0.62), tierH = M.r(0.28, 0.42), tierDrum = M.chance(0.4);
    const wings = M.chance(0.3);
    const wingLen = M.r(4, 7), wingTilt = M.r(-25, 25);
    const secondary = topKind === 'helipad' ? null : M.pick(['dish', 'mast', 'tanks', 'cupola', 'crane'].filter((k) => k !== topKind));
    const heli = topKind === 'helipad' && M.chance(0.85);
    const engine = M.chance(0.65);
    const rcs = M.chance(0.6);
    const winKind = M.wpick([[4, 'xWindow'], [2.5, 'octPort'], [1, 'porthole']]);
    const winKind2 = M.wpick([[2, 'octPort'], [2, 'xWindow'], [1, 'louver'], [1, 'hatch']]);
    const corrMode = M.wpick([[6, 'v'], [2, 'alt'], [1, 'h']]);
    const trims = M.chance(0.6);
    const cols = Math.max(3, Math.min(5, Math.round(W / M.r(2.3, 3.0))));
    const rows = Math.max(3, Math.min(4, Math.round(H / M.r(2.2, 2.8))));
    const winRow = rows >= 3 ? rows - 2 : 1;          // a window band (row index from the bottom)
    const pattern = M.rng();
    const platforms = M.wpick([[3, 2], [2, 1]]);
    const whipLean = M.r(8, 22);
    const crew = Math.max(2, Math.min(9, Math.round(W * H / 14 + M.r(-1, 1))));
    const mass = Math.round(Lx * W * H * M.r(0.045, 0.07));
    const days = M.pick([14, 21, 28, 40, 60, 90]);
    const powerKw = Math.round(M.r(80, 420) / 10) * 10;
    const place = M.pick(['LUNAR', 'CRATER', 'POLAR', 'MARTIAN', 'ASTEROID', 'ICE MOON', 'HIGHLAND', 'FAR SIDE', 'REGOLITH']);
    const cellSeed = Array.from({ length: 64 }, () => M.rng());
    const heliYaw = M.r(-50, 50) + M.pick([0, 180]);
    const heliOff = [M.r(-0.15, 0.15), M.r(-0.15, 0.15)];
    const dishEl = M.r(25, 65), dishAz = M.r(0, 360);
    const tankN = M.ri(2, 4), tankSph = M.chance(0.5);
    const craneRise = M.r(25, 50);
    const unitNo = String(M.ri(1, 99)).padStart(2, '0');

    const e = M.view.e;
    const seenN = (n) => dot(n, e) > 0;
    let windowCount = 0;

    // ------------------------------------------------ hull
    let hull;
    M.part('HULL', () => {
      if (form === 'drum') hull = M.cyl(W / 2, zb, zt, { segMul: 1 });
      else hull = M.box([-Lx / 2, -W / 2, zb], [Lx / 2, W / 2, zt], { chamfer: form === 'oct' ? W * M.r(0.2, 0.28) : 0 });
      M.callout('PRESSURE HULL', 1, [Lx / 2, 0, zb + H * 0.5], 2);
      M.info.mass = hull.bbox.slice();
      // corner posts and a top band
      if (trims && form === 'cube') {
        const t = Math.min(0.32, W * 0.03);
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) M.box([sx * Lx / 2 - t, sy * W / 2 - t, zb - 0.02], [sx * Lx / 2 + t, sy * W / 2 + t, zt + 0.02], { isect: false });
      }
    });
    // panels on the walls
    const corrOf = (fi) => (corrMode === 'v' ? 'corrugated' : corrMode === 'h' ? 'corrugatedH' : fi % 2 ? 'corrugatedH' : 'corrugated');
    let corrDir = 'corrugated';
    const faceKinds = (fi, i, j, n, m) => {
      const r = cellSeed[(fi * 13 + i * 5 + j * 3) % 64];
      corrDir = corrOf(fi);
      if (j === winRow) {
        if (pattern < 0.5) return (i + fi) % 2 === 0 ? winKind : (r < 0.5 ? winKind2 : corrDir);
        return r < 0.65 ? winKind : corrDir;
      }
      if (j === m - 1 && rows >= 3 && r < 0.18) return winKind2;
      if (r < 0.05) return 'hatch';
      if (r < 0.09) return 'louver';
      if (r < 0.12) return 'plain';
      return corrDir;
    };
    const doorFaces = [];
    let figSpot = null;
    if (form !== 'drum') {
      const names = form === 'oct' ? ['+x', 'c1', '+y', 'c2', '-x', 'c3', '-y', 'c0'] : ['+x', '+y', '-x', '-y'];
      const walls = names.map((n) => hull.f(n)).filter((f) => f.ok);
      const visible = walls.filter((f) => seenN(f.n));
      // platforms on the visible main faces
      const mains = visible.filter((f) => !/^c/.test(names[walls.indexOf(f)] || '')).sort((a, b) => dot(b.n, e) - dot(a.n, e));
      for (let q = 0; q < Math.min(platforms, mains.length); q++) doorFaces.push(mains[q]);
      walls.forEach((f, fi) => {
        if (!f.on) return;
        const isCh = f.w < W * 0.45;
        const n = isCh ? 1 : Math.max(1, Math.round(f.w / (W / cols)));
        const g = f.grid(n, rows, { gap: 2.4 });
        const door = doorFaces.indexOf(f);
        for (const r of g) {
          let kind = isCh ? (r.j === winRow ? 'porthole' : corrOf(fi)) : faceKinds(fi, r.i, r.j, n, rows);
          if (door >= 0 && r.j === 0 && r.i === Math.floor((n - 1) / 2 + (door ? 0.5 : 0))) continue;
          if (r.j === rows - 1 && r.i === 0 && fi === walls.indexOf(mains[0])) {
            // stencil panel: designation band
            K.frame(f, r, { inset: 1.6 });
            K.stencil(f, unitNo, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, (r[3] - r[1]) * 0.42);
            continue;
          }
          if (kind === 'xWindow' || kind === 'octPort' || kind === 'porthole') windowCount++;
          if (kind === 'corrugated' || kind === 'corrugatedH') kind = corrOf(fi);
          K.fill(f, r, kind, { flip: (r.i + r.j) % 2 === 1, mullion: M.decorOn ? (r.i % 2 ? 'h' : '+') : 'h' });
        }
      });
      // roof panels
      const roof = hull.f('+z');
      if (roof.on) {
        const g = roof.grid(cols, cols, { gap: 2.2 });
        g.forEach((r, k) => {
          if (!roof.holds(r)) return;
          const q = cellSeed[(k * 7) % 64];
          if (q < 0.18) K.accessHatch(roof, r);
          else if (q < 0.5) { K.frame(roof, r); roof.hatch([r[0] + roof.mOf(3), r[1] + roof.mOf(3), r[2] - roof.mOf(3), r[3] - roof.mOf(3)], { angle: 0, gap: 2.4, w: 0 }); roof.hatch([r[0] + roof.mOf(3), r[1] + roof.mOf(3), r[2] - roof.mOf(3), r[3] - roof.mOf(3)], { angle: 90, gap: 2.4, w: 0 }); }
          else K.plain(roof, r, { shade: false });
        });
      }
    } else {
      // drum: windows and ribs on the lathe surface
      const L = hull.lat;
      if (M.decorOn) {
        const nRib = cols * 4;
        for (let i = 0; i < nRib; i++) L.meridian(i * 360 / nRib, 0, 1, { w: 1 });
        for (let j = 1; j < rows; j++) L.ring(j / rows, { w: 1 });
        L.shade({ gap: 1.9, gapMax: 5 });
        const nw = nRib;
        const ww = Math.PI * W / nw * 0.55, wh = H / rows * 0.5;
        for (let i = 0; i < nw; i++) {
          if (i % 2) continue;
          const a = (i + 0.5) * 360 / nw;
          L.shape(a, (winRow + 0.5) / rows, [[-ww / 2, -wh / 2], [ww / 2, -wh / 2], [ww / 2, wh / 2], [-ww / 2, wh / 2]], { closed: true, w: 1 });
          const tm = (winRow + 0.5) / rows, dt = wh / H * 0.42, da = ww / (W / 2) / D2R * 0.42;
          L.shape(a, tm, [[-ww * 0.42, -wh * 0.42], [ww * 0.42, -wh * 0.42], [ww * 0.42, wh * 0.42], [-ww * 0.42, wh * 0.42]], { closed: true, w: 1 });
          L.hatch(a - da, a + da, tm - dt, tm + dt, { gap: 1.1 });
          L.shape(a, tm, [[0, -wh * 0.42], [0, wh * 0.42]], { w: 1 });
        }
        L.text(unitNo, az, (rows - 0.5) / rows, H / rows * 0.35);
      }
      windowCount = cols * 2;
      // a door and platform on the side toward the viewer, with the ladder
      const aE = Math.atan2(e[1], e[0]) / D2R;
      let aD = aE, best = -Infinity;
      for (let i = 0; i < nLegs; i++) {
        const m = (i + 1) * 360 / nLegs + 45; // halfway between legs i and i+1
        const sc = Math.cos((m - aE) * D2R);
        if (sc > best) { best = sc; aD = m; }
      }
      M.part('PLATFORM', () => {
        const R = W / 2, dh = Math.min(H / rows * 0.8, 2.1), dw = 1.2;
        const ar = aD * D2R;
        const tD = (0.25 + dh / 2) / H;
        if (M.decorOn) {
          L.shape(aD, tD, [[-dw / 2, -dh / 2], [dw / 2, -dh / 2], [dw / 2, dh / 2], [-dw / 2, dh / 2]], { closed: true, w: 1 });
          L.shape(aD, tD, [[-dw * 0.4, -dh * 0.4], [dw * 0.4, -dh * 0.4], [dw * 0.4, dh * 0.4], [-dw * 0.4, dh * 0.4]], { closed: true, w: 1 });
          L.hatch(aD - 12 * dw / R, aD + 12 * dw / R, tD + dh * 0.12 / H, tD + dh * 0.32 / H, { gap: 1.1 });
        }
        M.with({ at: [Math.cos(ar) * R, Math.sin(ar) * R, zb + 0.25], rz: aD }, () => {
          const d = 1.7;
          K.platform(M, { depth: d, width: 2.2, inset: 0.35, stayH: dh * 0.9, drop: 0.2 });
          M.part('LADDER', () => {
            M.at(d + 0.12, 0, -(zb + 0.25), () => K.ladder(M, { h: zb + 0.25 + 0.9, w: 0.55 }));
            M.callout('BOARDING LADDER', 1, [d + 0.12, 0, -(zb + 0.25) * 0.5], 1.8);
            const fp = M.W([d + 0.9, 1.5, -(zb + 0.25)]);
            figSpot = [fp[0], fp[1]];
          });
          M.callout('FOLD-DOWN PLATFORM', 1, [d * 0.6, 0, 0], 2);
        });
      });
      const roof = hull.top;
      if (roof.on) { roof.circle(0, 0, W * 0.42, { w: 1 }); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; roof.line(Math.cos(a) * W * 0.12, Math.sin(a) * W * 0.12, Math.cos(a) * W * 0.42, Math.sin(a) * W * 0.42, { w: 0 }); } }
    }
    if (windowCount) M.callout('VIEW PORT', windowCount, [Lx / 2, 0, zb + H * (winRow + 0.5) / rows], 1.5);

    // ------------------------------------------------ doors, platforms, ladder
    let ladderBuilt = false;
    doorFaces.forEach((f, q) => {
      M.part('PLATFORM', () => {
        const n = Math.max(1, Math.round(f.w / (W / cols)));
        const cw = f.w / n;
        const i = Math.floor((n - 1) / 2 + (q ? 0.5 : 0));
        const x = -f.w / 2 + cw * (i + 0.5);
        const ch = f.h / rows;
        const dw = Math.min(cw * 0.62, 1.4), dh = Math.min(ch * 0.82, 2.1);
        const y = -f.h / 2 + dh / 2 + 0.25;
        if (f.on) {
          const cell = [x - cw / 2 + f.mOf(1.2), -f.h / 2 + f.mOf(1.2), x + cw / 2 - f.mOf(1.2), -f.h / 2 + ch - f.mOf(1.2)];
          K.frame(f, cell);
          const ins = f.mOf(3.2), m = 0.12;
          f.hatch([cell[0] + ins, cell[1] + ins, cell[2] - ins, cell[3] - ins], { angle: corrMode === 'h' ? 0 : 90, gap: 2.7 - f.tone, w: 0, holes: [[x - dw / 2 - m, -f.h / 2, x + dw / 2 + m, y + dh / 2 + m]] });
        }
        const r = K.door(M, f, x, y, dw, dh, { platform: true, depth: Math.min(2.0, cw * 0.7), width: Math.min(cw * 0.92, 2.8), drop: (y - dh / 2) + f.h / 2 - 0.1 });
        M.callout('FOLD-DOWN PLATFORM', doorFaces.length, M.world(() => r.sill), 2);
        M.callout('AIRLOCK DOOR', doorFaces.length, f.P(x, y), 1.2);
        if (!ladderBuilt) {
          ladderBuilt = true;
          M.part('LADDER', () => {
            M.onFace(f, x, y - dh / 2, () => {
              const d = Math.min(2.0, cw * 0.7);
              const sill = M.W([0, 0, 0])[2];
              M.at(d + 0.12, 0, -sill, () => K.ladder(M, { h: sill + 0.9, w: 0.55 }));
              const fp = M.W([d + 0.9, 1.5, -sill]);
              figSpot = [fp[0], fp[1]];
            });
            M.callout('BOARDING LADDER', 1, M.world(() => f.P(x, y - dh / 2 - 1.2)), 1.8);
          });
        }
      });
    });

    // ------------------------------------------------ legs and footpads
    M.part('LANDING LEG', () => {
      for (let i = 0; i < nLegs; i++) {
        const a = (form === 'drum' ? (i + 0.5) * 360 / nLegs + 45 : 45 + 90 * i) * D2R;
        const ca = Math.cos(a), sa = Math.sin(a);
        // attach points on the hull near the corner
        let cx, cy;
        if (form === 'drum') { cx = ca * W / 2; cy = sa * W / 2; }
        else if (form === 'oct') { const ch = W * 0.24; cx = Math.sign(ca) * (Lx / 2 - ch / 2) * 0.98; cy = Math.sign(sa) * (W / 2 - ch / 2) * 0.98; }
        else { cx = Math.sign(ca) * Lx / 2; cy = Math.sign(sa) * W / 2; }
        const dir = [ca, sa];
        const pIn = 0.35; // pull the upper attach a little inside the corner
        const p = [cx - dir[0] * pIn, cy - dir[1] * pIn, zb + H * legHi];
        const q = [cx - dir[0] * pIn * 0.5, cy - dir[1] * pIn * 0.5, zb];
        const R = Math.hypot(cx, cy) + legSpread;
        const foot = [ca * R, sa * R, 0.62];
        const leg = K.leg(M, { top: [p, q], foot, r: legR, knee: 0.52 });
        for (const b of [p, q]) M.with({ at: b, rz: a / D2R }, () => M.box([-0.3, -legR * 1.5, -legR * 1.9], [pIn + 0.02, legR * 1.5, legR * 1.9], { isect: true }));
        // side struts from the hull bottom to the knee
        const sideD = Math.min(W * 0.22, 2.2);
        const sides = form === 'drum'
          ? [1, -1].map((s) => { const b = a + s * sideD / (W / 2); return [Math.cos(b) * W / 2 * 0.97, Math.sin(b) * W / 2 * 0.97, zb]; })
          : [[q[0] - Math.sign(ca) * sideD, q[1], zb], [q[0], q[1] - Math.sign(sa) * sideD, zb]];
        for (const side of sides) {
          K.strut(M, side, leg.knee, legR * 0.7, { collars: true });
          K.ball(M, side, legR * 0.95);
        }
        M.part('FOOTPAD', () => {
          M.at(foot[0], foot[1], 0, () => K.footpad(M, { r: 1.0 + W * 0.03 }));
          M.callout('FOOTPAD', nLegs, [foot[0], foot[1], 0.25], 1.2);
        });
        M.callout('LANDING LEG', nLegs, M.world(() => [(p[0] + foot[0]) / 2, (p[1] + foot[1]) / 2, (p[2] + foot[2]) / 2]), 3);
        if (rcs && form !== 'drum') {
          M.part('RCS QUAD', () => {
            M.at(cx * 0.995, cy * 0.995, zt - H * 0.12, () => M.rz(a / D2R, () => {
              M.boxc([0.25, 0, 0], [0.5, 0.6, 0.6]);
              for (const [y, z, ry, rz] of [[0.42, 0, 0, 90], [-0.42, 0, 0, -90], [0, 0.42, -90, 0], [0, -0.42, 90, 0]]) {
                M.at(0.3, y, z, () => M.rz(rz, () => M.ry(ry, () => M.cone(0.05, 0.13, 0.0, 0.25, { isect: false }))));
              }
            }));
            M.callout('THRUSTER QUAD', nLegs, [cx, cy, zt - H * 0.12], 0.8);
          });
        }
      }
    });

    // ------------------------------------------------ descent engine
    if (engine) {
      M.part('DESCENT ENGINE', () => {
        M.at(0, 0, zb, () => {
          M.cyl(W * 0.16, -0.25, 0.01);
          K.bell(M, { r: W * 0.13, len: Math.min(zb * 0.55, W * 0.24) });
        });
        M.callout('DESCENT ENGINE', 1, [0, 0, zb - 0.6], 1.6);
      });
    }

    // ------------------------------------------------ topside
    const roofR = form === 'drum' ? W / 2 : Math.min(Lx, W) / 2;
    if (topKind === 'helipad') {
      const R = roofR * M.r(1.12, 1.3) * (form === 'oct' ? 0.95 : 1);
      const gh = R * 0.11;
      const ph = gh + M.r(0.3, 0.8);
      M.part('HELIPAD', () => {
        // posts from the roof
        const np = form === 'drum' ? 6 : 4;
        for (let i = 0; i < np; i++) {
          const a = ((i + 0.5) * 360 / np) * D2R;
          const rr = roofR * 0.62;
          M.at(Math.cos(a) * rr, Math.sin(a) * rr, 0, () => M.cyl(0.18, zt, zt + ph - 0.2, { seg: 12 }));
        }
        for (let i = 0; i < np; i++) {
          const a = ((i + 0.5) * 360 / np) * D2R;
          const rr = roofR * 0.66;
          M.tube([Math.cos(a) * rr, Math.sin(a) * rr, zt], [Math.cos(a) * rr * 1.25, Math.sin(a) * rr * 1.25, zt + ph - 0.2], 0.12, {});
        }
        M.cyl(roofR * 0.35, zt, zt + ph - 0.2);
        M.at(0, 0, zt + ph, () => K.helipad(M, { r: R, t: 0.22, gh, markAngle: 0 }));
        M.callout('HELIPAD', 1, [R * 0.5, 0, zt + ph], 2.5);
        M.callout('RING GIRDER', 1, [R, 0, zt + ph - gh * 0.6], 1);
      });
      if (heli) {
        M.part('HELICOPTER', () => {
          const L = R * M.r(1.35, 1.6);
          M.with({ at: [heliOff[0] * R, heliOff[1] * R, zt + ph], rz: heliYaw }, () => K.miniHeli(M, { len: L, reg: designationFor(cellSeed) }));
          M.callout('UTILITY HELICOPTER', 1, [heliOff[0] * R, heliOff[1] * R, zt + ph + L * 0.12], 2.8);
        });
      }
    } else {
      // an upper module, then the main item at the center
      let zTop = zt, sizeTop = roofR;
      if (tier) {
        M.part('UPPER MODULE', () => {
          const tw = Math.min(Lx, W) * tierW, th = H * tierH;
          const T = tierDrum ? M.cyl(tw / 2, zt, zt + th) : M.box([-tw / 2, -tw / 2, zt], [tw / 2, tw / 2, zt + th], { chamfer: form === 'oct' ? tw * 0.2 : 0 });
          if (tierDrum) {
            if (M.decorOn) {
              const L = T.lat, n = 16;
              for (let i = 0; i < n; i++) L.meridian(i * 360 / n, 0, 1, { w: 1 });
              for (let i = 0; i < n; i += 2) { const a = (i + 0.5) * 360 / n, da = 360 / n * 0.3; L.shape(a, 0.55, [[-tw * 0.06, -th * 0.2], [tw * 0.06, -th * 0.2], [tw * 0.06, th * 0.2], [-tw * 0.06, th * 0.2]], { closed: true, w: 1 }); L.hatch(a - da * 0.5, a + da * 0.5, 0.42, 0.68, { gap: 1.1 }); }
              L.shade({ gap: 1.8 });
              if (T.top.on) { T.top.circle(0, 0, tw * 0.4, { w: 1 }); for (const r of T.top.grid(3, 3)) if (T.top.holds(r)) K.frame(T.top, r); }
            }
          } else {
            for (const k of ['+x', '-x', '+y', '-y']) { const f = T.f(k); if (f.on) f.grid(2, 1, { gap: 2.4 }).forEach((r, i) => K.fill(f, r, i % 2 ? winKind : corrOf(i), { flip: i % 2 === 1 })); }
            const tf = T.f('+z'); if (tf.on) for (const r of tf.grid(2, 2)) K.plain(tf, r, { shade: false });
          }
          M.callout('UPPER MODULE', 1, [0, 0, zt + th * 0.5], 1.4);
          zTop = zt + th; sizeTop = tw / 2 * 1.15;
        });
      }
      topItem(M, topKind, { x: 0, y: 0, z: zTop, size: sizeTop, dishEl, dishAz, tankN, tankSph, craneRise });
      if (secondary) {
        const corner = form === 'drum' ? [roofR * 0.55, -roofR * 0.4] : [-Lx / 2 * 0.62, -W / 2 * 0.62];
        topItem(M, secondary, { x: corner[0], y: corner[1], z: zt, size: roofR * 0.45, dishEl, dishAz: Math.atan2(corner[1], corner[0]) / D2R, tankN: 2, tankSph, craneRise, small: true });
      }
    }

    // ------------------------------------------------ solar wings
    if (wings) {
      M.part('SOLAR WING', () => {
        const half = (form === 'drum' ? W / 2 : W / 2);
        M.mirrorY(() => {
          M.tube([0, half * 0.9, zt - 0.6], [0, half + 1.2, zt - 0.6], 0.1, {});
          M.at(0, half + 1.2 + wingLen / 2, zt - 0.6, () => M.ry(wingTilt, () => M.rz(90, () => K.solar(M, { w: wingLen, h: Math.min(2.6, H * 0.4) }))));
          M.tube([0, half + 1.2, zt - 0.6], [0, half + 1.2 + wingLen, zt - 0.6], 0.05, { isect: false });
        });
        M.callout('SOLAR WING', 2, [0, half + 1.2 + wingLen / 2, zt - 0.6], 1.6);
      });
    }

    // ------------------------------------------------ whip antenna
    M.part('WHIP ANTENNA', () => {
      const cx = form === 'drum' ? -W / 2 * 0.7 : -Lx / 2 * 0.86, cy = form === 'drum' ? W / 2 * 0.7 : W / 2 * 0.86;
      M.at(cx, cy, zt, () => M.rz(135, () => K.whip(M, { h: H * M.r(0.75, 1.15), lean: whipLean })));
      M.callout('WHIP ANTENNA', 1, [cx, cy, zt + 0.3], 0.9);
    });

    // ------------------------------------------------ vocabulary
    const jobs = {
      helipad: heli ? ['SURVEY', 'RESCUE', 'SUPPLY'] : ['SUPPLY', 'TRANSFER'],
      dish: ['RELAY', 'SIGNAL'], crane: ['CARGO', 'MINING'], tanks: ['FUEL', 'TANKER'],
      cupola: ['OBSERVATION', 'SURVEY'], mast: ['BEACON', 'SURVEY'],
    }[topKind];
    const job = jobs[Math.floor(cellSeed[7] * jobs.length)];
    const where = { LUNAR: 'the moon', CRATER: 'crater floors', POLAR: 'the polar ice', MARTIAN: 'Mars', ASTEROID: 'small asteroids', 'ICE MOON': 'frozen moons', HIGHLAND: 'the highlands', 'FAR SIDE': 'the far side', REGOLITH: 'loose regolith' }[place];
    const crewW = WORD[crew] || String(crew);
    const briefs = {
      helipad: heli ? `Lands ${crewW} crew and a helicopter on ${where}.` : `Lands ${crewW} crew and a landing deck on ${where}.`,
      dish: `Lands ${crewW} crew and a relay dish on ${where}.`,
      crane: `Lands ${crewW} crew and lifts cargo on ${where}.`,
      tanks: `Carries fuel for other landers on ${where}.`,
      cupola: `Lands ${crewW} observers on ${where} for ${days} days.`,
      mast: `Marks a landing field on ${where} with lamps.`,
    };
    let brief = briefs[topKind];
    if (brief.length > 78) brief = brief.replace(/ on .*\./, '.');
    return {
      place, job, form: 'LANDER',
      brief,
      specs: [['MASS', `${mass} T`], ['CREW', String(crew)], ['ENDURANCE', `${days} DAYS`], ['POWER', `${M.decorOn || true ? (engine ? '2 X ' : '') : ''}${powerKw} KW`]],
      figure: figSpot,
    };
  },
};

function designationFor(seed) {
  const L = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const c = (i) => L[Math.floor(seed[i] * L.length)];
  return `${c(11)}${c(12)}-${c(13)}${c(14)}${c(15)}`;
}

function topItem(M, kind, o) {
  const { x, y, z, size } = o;
  if (kind === 'dish') {
    M.part('DISH ANTENNA', () => {
      M.at(x, y, z, () => K.dishMount(M, { r: size * 0.75, el: o.dishEl, az: o.dishAz }));
      M.callout('DISH ANTENNA', 1, [x, y, z + size * 1.1], 2.2);
    });
  } else if (kind === 'crane') {
    M.part('CRANE', () => {
      M.at(x, y, z, () => M.rz(o.dishAz, () => K.crane(M, { len: size * (o.small ? 2.2 : 1.7), rise: o.craneRise, r: size * 0.16 })));
      M.callout('CARGO CRANE', 1, [x, y, z + size * 0.3], 2.2);
    });
  } else if (kind === 'tanks') {
    M.part('PROPELLANT TANK', () => {
      const n = o.tankN;
      for (let i = 0; i < n; i++) {
        const a = (i + 0.5) * 2 * Math.PI / n;
        const rr = n === 1 ? 0 : size * (o.small ? 0.35 : 0.5);
        const r = size * (o.small ? 0.3 : 0.38) / Math.max(1, n / 2.5);
        M.at(x + Math.cos(a) * rr, y + Math.sin(a) * rr, z, () => (o.tankSph ? K.tankSphere(M, { r }) : M.at(0, 0, r * 1.3, () => K.tankCapsule(M, { r, len: r * 3.2, axis: 'z' }) && null)));
        if (!o.tankSph) M.at(x + Math.cos(a) * rr, y + Math.sin(a) * rr, z, () => M.cyl(r * 0.7, 0, r * 0.4));
      }
      M.callout('PROPELLANT TANK', n, [x, y, z + size * 0.5], 2);
    });
  } else if (kind === 'cupola') {
    M.part('CUPOLA', () => {
      M.at(x, y, z, () => K.cupola(M, { r: size * (o.small ? 0.6 : 0.42), h: size * 0.3 }));
      M.callout('OBSERVATION CUPOLA', 1, [x, y, z + size * 0.25], 2);
    });
  } else if (kind === 'mast') {
    M.part('LAMP MAST', () => {
      const h = size * (o.small ? 1.6 : 2.2);
      K.girder(M, [x, y, z], [x, y, z + h], { w: size * 0.14, sec: 3 });
      M.at(x, y, z + h, () => {
        M.cyl(size * 0.16, 0, 0.1);
        for (let i = 0; i < 3; i++) M.rz(i * 120 + 30, () => M.at(size * 0.18, 0, 0.25, () => K.lamp(M, { r: size * 0.06 })));
        M.at(0, 0, 0.1, () => K.radar(M, { len: size * 0.5 }));
      });
      M.callout('LAMP MAST', 1, [x, y, z + h * 0.6], 1.8);
    });
  }
}
