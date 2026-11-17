// classes/rover.js: a pressurized exploration rover on big wheels. Body from a pool (a van
// with a glazed nose, a drum on its side on a chassis, two linked cabins), 4..8 wheels on
// rocker bogies, swing arms with coil struts or beam axles on leaf springs, and equipment
// tied to the job: camera mast, dish, sample arm, roof rack, solar wings, airlock with a
// ladder, winch, lamps, a towed sled, a cable drum, now and then a small buggy on a deck.

import * as G from './parts-ground.js';
import { word } from '../words.js';

const { K, D2R, dot, clamp } = G;

const PLACES = {
  LUNAR: 'the moon', MARTIAN: 'Mars', POLAR: 'the polar ice', CRATER: 'crater floors',
  DESERT: 'the desert', HIGHLAND: 'the highlands', 'SALT FLAT': 'the salt flats',
  'ICE MOON': 'the ice moons', DUNE: 'the dunes', 'FAR SIDE': 'the far side',
};

export default {
  id: 'rover',
  family: 'ground',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices (all draws up front)
    const body = M.wpick([[4, 'van'], [2.5, 'drum'], [2.2, 'twin']]);
    const job = M.wpick([[3, 'SURVEY'], [2.5, 'SAMPLE'], [1.6, 'MAIL'], [2, 'RESCUE'], [1.6, 'CABLE']]);
    const susp = M.wpick([[3, 'rocker'], [3, 'arm'], [2, 'axle']]);
    const tread = M.pick(['chevron', 'chevron', 'block', 'ribs']);
    const noseKind = M.pick(['slant', 'slant', 'bay', 'flat']);
    const place = M.pick(Object.keys(PLACES));
    const W = M.r(3.0, 3.9);
    const H = M.r(2.5, 3.2);
    const Rd = M.r(1.45, 1.85);
    const nPerA = M.wpick([[3, 2], [4, 3], [2, 4]]);
    const twinRear = M.wpick([[2, 'box'], [1.2, 'drum'], [1.5, 'flat']]);
    const nPerB = M.pick([1, 2, 2]);
    const Rk = M.r(0.36, 0.47);
    const wk = M.r(0.55, 0.75);
    const lenK = M.r(0, 1);
    const Ln0 = M.r(1.5, 2.2);
    const hasDeck0 = M.chance(0.3);
    const deckK = M.r(0.24, 0.33);
    const fenders = M.chance(0.6);
    const winKind = M.wpick([[4, 'xWindow'], [2.5, 'octPort'], [1.5, 'porthole']]);
    const corrDir = M.wpick([[5, 'corrugated'], [1.5, 'corrugatedH']]);
    const cellSeed = Array.from({ length: 48 }, () => M.rng());
    const rear = M.chance(0.15);
    const sv = M.pick([1, -1]);
    const azK = M.r(50, 63), el = M.r(26, 34);
    const extrasPool = M.shuffle(['dish', 'mast', 'rack', 'solar', 'lights', 'airlock', 'winch', 'sled', 'arm']);
    const nExtra = M.wpick([[3, 1], [2, 2]]);
    const armTool = M.pick(['scoop', 'drill', 'drill', 'claw']);
    const armA1 = M.r(30, 52), armA2 = M.r(-135, -105), armYaw = M.r(18, 42);
    const dishR = M.r(0.55, 0.85), dishEl = M.r(25, 70), dishAz = M.r(-60, 60);
    const mastH = M.r(1.8, 2.8), mastYaw = M.r(-40, 40);
    const solarTilt = M.r(2, 14), solarW = M.r(1.2, 1.8);
    const rackCargo = Array.from({ length: 8 }, () => M.rng());
    const sledKind = M.pick(['radar', 'mast', 'dish']);
    const buggy = M.chance(0.14);
    const cupolaOn = M.chance(0.55);
    const crew = M.ri(2, 6);
    const rangeKm = Math.round(M.r(4, 30)) * 100;
    const speed = Math.round(M.r(14, 40));
    const cableKm = M.pick([12, 20, 30, 40, 60]);
    const days = M.pick([10, 14, 21, 30, 45]);
    const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
    const des = M.wpick([[2, 'reg'], [1, 'type']]) === 'reg'
      ? `${M.pick(LET.split(''))}${M.pick(LET.split(''))}-${M.ri(1, 9)}${M.ri(0, 9)}`
      : `R-${M.ri(2, 19)}${M.pick(LET.split(''))}`;
    const unitNo = String(M.ri(1, 40)).padStart(2, '0');

    // ------------------------------------------------ equipment from the job
    const core = {
      SURVEY: ['mast', M.chance(0.5) ? 'dish' : 'sled'],
      SAMPLE: ['arm'],
      MAIL: ['rack'],
      RESCUE: ['lights', 'winch', 'airlock'],
      CABLE: ['cable'],
    }[job];
    const eq = new Set(core);
    for (const k of extrasPool) { if (eq.size >= core.length + nExtra || eq.size >= 4) break; if (!eq.has(k)) eq.add(k); }
    if (eq.has('sled') && eq.has('cable')) eq.delete('sled');
    const has = (k) => eq.has(k);

    // ------------------------------------------------ view
    const az = rear ? sv * (180 - azK) : sv * azK;
    M.setView(az, el);
    const e = M.view.e;
    const sy = e[1] >= 0 ? 1 : -1;     // the side we see

    // ------------------------------------------------ sizes and units
    const nPer0 = body === 'twin' ? 2 : nPerA;
    const R = H * Rk * (nPer0 >= 4 ? 0.88 : 1) * (body === 'drum' ? 1.1 : 1);
    const ww = R * wk;
    const pitch = 2 * R + 0.35;
    const doorGap = has('airlock') ? 1.9 : 0;
    const zbOf = () => (susp === 'axle' ? R + R * 0.17 + 0.34 : R * 0.95);
    const zb = zbOf();
    const units = [];
    const needDeck = has('cable') || (buggy && body !== 'twin');
    if (body === 'van') {
      const deck = (hasDeck0 || needDeck) ? 1 : 0;
      const Lmin = (nPer0 - 1) * pitch + 2.7 * R + doorGap;
      let L = Math.max(Lmin + 1.2, 7.2 + lenK * 3.6);
      const deckLen = deck ? Math.max(needDeck ? 3.0 : 2.2, L * deckK) : 0;
      if (deck) L += deckLen * 0.6;
      units.push({ kind: 'van', x0: -L / 2, x1: L / 2, W, H, zb, nPer: nPer0, Ln: noseKind === 'flat' ? Ln0 * 0.6 : Ln0, deck: deckLen });
    } else if (body === 'drum') {
      const deckLen = needDeck ? 3.0 : 0;
      const Lmin = (nPer0 - 1) * pitch + 2.6 * R + doorGap;
      const L = Math.max(Lmin + 0.8, 6.4 + lenK * 2.6) + deckLen;
      units.push({ kind: 'drum', x0: -L / 2, x1: L / 2, W: 2 * Rd, H: 2 * Rd, Rd, zb, nPer: nPer0, deck: deckLen });
    } else {
      const L1 = Math.max(pitch + 2.7 * R + 1.0, 4.6 + lenK * 1.4);
      const rk = needDeck ? 'flat' : twinRear;
      const L2 = Math.max((nPerB - 1) * pitch + 2.6 * R + (has('airlock') ? doorGap : 0) + 0.6, 4.4 + lenK * 1.6);
      const gap = 1.5;
      const tot = L1 + gap + L2;
      units.push({ kind: 'van', x0: tot / 2 - L1, x1: tot / 2, W, H, zb, nPer: 2, Ln: noseKind === 'flat' ? Ln0 * 0.6 : Ln0, deck: 0 });
      const u2 = { kind: rk, x0: -tot / 2, x1: -tot / 2 + L2, W: rk === 'drum' ? 2 * Rd : W, H: rk === 'drum' ? 2 * Rd : H * 0.92, Rd, zb, nPer: nPerB, deck: rk === 'flat' ? L2 : 0, door: true };
      units.push(u2);
    }
    const front = units[0], back = units[units.length - 1];
    // where the side airlock goes
    const doorUnit = body === 'twin' && units[1].kind !== 'flat' ? units[1] : units[0];

    // wheel x positions per unit, front to back; a gap for the door when there is one
    for (const u of units) {
      const xa = u.x1 - R * (u.kind === 'van' ? 1.45 : 1.35);
      const xb = u.x0 + R * 1.35;
      const n = u.nPer;
      const xs = [];
      if (n === 1) xs.push((u.x0 + u.x1) / 2 - R * 0.2);
      else if (doorGap && u === doorUnit) {
        const nf = Math.ceil(n / 2), nr = n - nf;
        for (let i = 0; i < nf; i++) xs.push(xa - i * pitch);
        for (let i = nr - 1; i >= 0; i--) xs.push(xb + i * pitch);
        u.doorX = ((xa - (nf - 1) * pitch) + (xb + (nr - 1) * pitch)) / 2;
      } else for (let i = 0; i < n; i++) xs.push(xa + (xb - xa) * i / (n - 1));
      u.wx = xs;
      u.yw = u.W / 2 + (susp === 'rocker' ? 0.5 : 0.32) + ww / 2;
    }

    let figure = null;
    const wheelAnchors = [];
    let nWheels = 0;
    const centers = [];
    const massBox = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    const grow = (b) => { for (let i = 0; i < 3; i++) { massBox[i] = Math.min(massBox[i], b[i]); massBox[i + 3] = Math.max(massBox[i + 3], b[i + 3]); } };
    const roofs = [];   // {x0, x1, z, w, zEdge(y)}
    const cellKind = (u) => (r, n, m) => {
      const q = cellSeed[(r.i * 7 + r.j * 3 + (u === front ? 0 : 5)) % 48];
      if (u.doorX != null && u === doorUnit && u._doorFace && r[0] < u._dx + 0.5 && r[2] > u._dx - 0.5 && r.j < m - 1) return 'skip';
      if (r.j === m - 1) {
        if (r.i === 0 && u === front) return ['stencil', des];
        return (r.i % 2 === 0 || q < 0.4) ? winKind : corrDir;
      }
      if (job === 'MAIL' && r.j === 0 && r.i === 1 && u === units[units.length - 1]) return ['stencil', 'MAIL'];
      if (r.j === 0 && r.i === n - 1) return ['stencil', unitNo];
      if (q < 0.08) return 'hatch';
      if (q < 0.15) return 'louver';
      if (q < 0.2) return 'plain';
      return corrDir;
    };

    // ------------------------------------------------ bodies
    for (const u of units) {
      const zt = u.zb + u.H;
      if (u.kind === 'van' || u.kind === 'box') {
        const xn = u.kind === 'van' ? u.x1 - u.Ln : u.x1;
        const xc0 = u.x0 + (u.deck || 0);
        u.attachTop = zt - 0.4; u.sideY = u.W / 2;
        M.part(u === front ? 'PRESSURE CABIN' : 'REAR CABIN', () => {
          const B = M.box([xc0, -u.W / 2, u.zb], [xn, u.W / 2, zt]);
          grow(B.bbox);
          const rows = u.H > 2.8 ? 3 : 2;
          for (const s of [1, -1]) {
            const f = B.f(s > 0 ? '+y' : '-y');
            if (u.doorX != null && u === doorUnit && s === sy) { u._doorFace = f; u._dx = G.fxy(f, [u.doorX, s * u.W / 2, u.zb])[0]; }
            G.skin(f, { cell: 1.25, rows, kind: cellKind(u) });
          }
          // rub rails along the sides and drip rails along the roof edges
          const zr = u.zb + u.H / rows;
          for (const s2 of [1, -1]) {
            M.box([xc0 + 0.05, s2 * u.W / 2 - 0.06, zr - 0.05], [xn - 0.05, s2 * u.W / 2 + 0.06, zr + 0.05], { isect: false });
            M.box([xc0, s2 * u.W / 2 - 0.05, zt - 0.02], [xn, s2 * u.W / 2 + 0.05, zt + 0.07], { isect: false });
          }
          // the rear wall and the front wall (twin rear unit)
          for (const k of ['-x', '+x']) {
            if (k === '+x' && u.kind === 'van') continue;
            const f = B.f(k);
            G.skin(f, { cell: 1.2, rows, kind: (r, n, m) => (r.j === m - 1 && r.i === Math.floor(n / 2) ? 'porthole' : r.j === 0 && r.i === 0 ? 'louver' : r.j === 0 && r.i === n - 1 ? 'hatch' : corrDir) });
          }
          const roof = B.f('+z');
          if (roof.on) roof.grid(Math.max(2, Math.round((xn - xc0) / 1.4)), 2, { gap: 2.2 }).forEach((r, i) => (cellSeed[i % 48] < 0.15 ? K.accessHatch(roof, r) : K.plain(roof, r, { shade: false })));
          co(M, u === front ? 'PRESSURE CABIN' : 'REAR CABIN', 1, [(xc0 + xn) / 2, sy * u.W / 2, u.zb + u.H * 0.55], u === front ? 2.2 : 1.4);
          roofs.push({ x0: xc0 + 0.25, x1: xn - 0.15, z: zt, w: u.W, zEdge: () => zt, u });
        });
        if (u.kind === 'van') buildNose(M, u, xn, zt);
        if (u.deck) buildDeck(M, u, u.x0, xc0, u.zb + 0.1);
      } else if (u.kind === 'drum') {
        const Rr = u.Rd;
        const hc = 0.42;
        const zch = u.zb + hc;
        const zc = zch + Rr + 0.05;
        const xd1 = u.x1, xd0 = u.x0 + (u.deck || 0);
        const Wc = Math.min(2.4, Rr * 1.5);
        u.attachTop = zch; u.sideY = Wc / 2; u.zc = zc;
        M.part('CHASSIS', () => {
          const C = M.box([u.x0 + 0.15, -Wc / 2, u.zb], [xd1 - 0.6, Wc / 2, zch]);
          for (const k of ['+y', '-y']) { const f = C.f(k); if (f.on) f.grid(Math.max(2, Math.round(f.w / 1.1)), 1, { gap: 2.4 }).forEach((r, i) => (i % 3 === 1 ? K.louver(f, r) : K.plain(f, r))); }
          // saddles
          const ns = Math.max(2, Math.round((xd1 - xd0) / 2.8));
          for (let i = 0; i < ns; i++) {
            const x = xd0 + 0.9 + (xd1 - xd0 - 2.2) * i / (ns - 1);
            const prof = [[Rr * 0.8, zch]];
            for (let k = 0; k <= 10; k++) { const a = (-36 - 108 * k / 10) * D2R; prof.push([Math.cos(a) * Rr, zc + Math.sin(a) * Rr]); }
            prof.push([-Rr * 0.8, zch]);
            M.extrude(prof, x - 0.14, x + 0.14, { plane: 'yz' });
          }
          co(M, 'CHASSIS FRAME', 1, [(u.x0 + xd1) / 2, sy * Wc / 2, u.zb + hc / 2], 0.8);
        });
        M.part('DRUM HULL', () => {
          const Rn = Rr * 0.7;
          const prof = [[0, xd0 + 0.02], [Rr * 0.9, xd0 + 0.02], [Rr, xd0 + 0.16], [Rr, xd1 - Rn]];
          for (let k = 1; k <= 7; k++) { const a = k / 7 * Math.PI / 2; prof.push([Math.cos(a) * Rr, xd1 - Rn + Math.sin(a) * Rn]); }
          prof[prof.length - 1][0] = 0;
          const D = M.at(0, 0, zc, () => M.lathe(prof, { axis: 'x', sharpDeg: 30 }));
          grow(D.bbox);
          const L = D.lat;
          if (M.decorOn) {
            const tCyl0 = L.cum[2] / L.total, tCyl1 = L.cum[3] / L.total;
            const nRing = Math.max(3, Math.round((xd1 - Rn - xd0) / 1.25));
            for (let i = 0; i <= nRing; i++) L.ring(tCyl0 + (tCyl1 - tCyl0) * i / nRing, { w: i === 0 || i === nRing ? 1 : 1 });
            for (let i = 0; i < 16; i++) L.meridian(i * 22.5 + 11.25, tCyl0, tCyl1, { w: 0 });
            L.shade({ t0: tCyl0, t1: tCyl1, gap: 1.8, gapMax: 5 });
            // a port band on each side, a stencil on the near side
            for (let i = 0; i < nRing; i++) {
              const t = tCyl0 + (tCyl1 - tCyl0) * (i + 0.5) / nRing;
              if (i === 0) { L.text(des, sy > 0 ? 112 : 248, t, Rr * 0.16); continue; }
              for (const a of [125, 235]) {
                if (u === doorUnit && u.doorX != null && Math.abs(xd0 + (xd1 - Rn - xd0) * (i + 0.5) / nRing - u.doorX) < 0.9) continue;
                L.port(a, t, Rr * 0.17, { w: 1 });
                L.port(a, t, Rr * 0.12, { w: 1 });
                L.hatch(a - 3.5, a + 3.5, t - Rr * 0.1 / L.total, t + Rr * 0.1 / L.total, { gap: 1.1 });
              }
            }
            // the glazed nose: frames and dark panes on the dome
            const tg0 = L.cum[3] / L.total + 0.012, tg1 = 1 - (1 - L.cum[3] / L.total) * 0.25;
            for (const a of [110, 145, 180, 215, 250]) L.meridian(a, tg0, tg1, { w: 1 });
            L.ring(tg0, { a0: 110, a1: 250, w: 1 });
            L.ring(tg1, { a0: 110, a1: 250, w: 1 });
            L.ring((tg0 + tg1) / 2, { a0: 110, a1: 250, w: 1 });
            for (let k = 0; k < 4; k++) L.hatch(112 + k * 35, 143 + k * 35, tg0 + 0.004, tg1 - 0.004, { gap: 1.0 });
            L.text(unitNo, 180, (tCyl0 + tCyl1) / 2, Rr * 0.32);
          }
          if (has('airlock') && u === doorUnit && u.doorX != null) {
            const tD = (L.cum[2] + (u.doorX - (xd0 + 0.16))) / L.total;
            const aD = sy > 0 ? 90 : 270;
            if (M.decorOn) {
              const rr = (a, b) => [[-a, -b], [a, -b], [a, b], [-a, b]];
              L.shape(aD, tD, rr(0.82, 0.5), { closed: true, w: 1 });
              L.shape(aD, tD, rr(0.74, 0.42), { closed: true, w: 1 });
              L.shape(aD, tD, rr(0.25, 0.22).map(([x, y]) => [x + 0.35, y]), { closed: true, w: 1 });
              const da = 0.25 / Rr / D2R;
              L.hatch(aD + (0.12 / Rr / D2R) * sy * 0 + 0.1 / Rr / D2R, aD + 0.6 / Rr / D2R, tD - 0.2 / L.total, tD + 0.2 / L.total, { gap: 1.1 });
              void da;
            }
            u._drumDoor = { z: zc - 0.82 };
          }
          if (D.bottom.on) { const f = D.bottom; f.circle(0, 0, Rr * 0.55, { w: 1 }); f.circle(0, 0, Rr * 0.48, { w: 1 }); f.line(-Rr * 0.48, 0, Rr * 0.48, 0, { w: 1 }); f.rivets(-Rr * 0.85, 0, Rr * 0.85, 0, { pitch: 9 }); }
          co(M, 'PRESSURE DRUM', 1, [(xd0 + xd1) / 2, sy * Rr * 0.7, zc + Rr * 0.7], 2.2);
          co(M, 'OBSERVATION NOSE', 1, [xd1 - Rn * 0.45, 0, zc + Rr * 0.75], 1.5);
          roofs.push({ x0: xd0 + 0.4, x1: xd1 - Rn * 0.9, z: zc + Rr, w: Rr * 1.3, zEdge: (y) => zc + Math.sqrt(Math.max(0, Rr * Rr - y * y)), u });
        });
        // bumper and lamps at the nose
        M.part('BUMPER', () => {
          M.box([xd1 - 0.75, -Wc / 2 - 0.1, u.zb + 0.05], [xd1 - 0.35, Wc / 2 + 0.1, zch + 0.05]);
          for (const s of [1, -1]) M.at(xd1 - 0.35, s * Wc * 0.4, zch + 0.15, () => K.lamp(M, { r: 0.13 }));
          co(M, 'HEADLAMP', 2, [xd1 - 0.2, sy * Wc * 0.4, zch + 0.15], 1);
        });
        if (u.deck) buildDeck(M, u, u.x0, xd0, zch);
      } else if (u.kind === 'flat') {
        const zch = u.zb + 0.45;
        u.attachTop = zch; u.sideY = u.W / 2 - 0.2;
        M.part('FLATBED', () => {
          const C = M.box([u.x0, -u.W / 2 + 0.2, u.zb], [u.x1, u.W / 2 - 0.2, zch - 0.12]);
          for (const k of ['+y', '-y', '-x', '+x']) { const f = C.f(k); if (f.on) f.grid(Math.max(1, Math.round(f.w / 1.2)), 1, { gap: 2.4 }).forEach((r) => K.plain(f, r)); }
          grow(C.bbox);
          co(M, 'FLATBED TRAILER', 1, [(u.x0 + u.x1) / 2, sy * (u.W / 2 - 0.2), u.zb + 0.2], 1.5);
        });
        buildDeck(M, u, u.x0, u.x1, zch - 0.12);
      }
    }

    // ------------------------------------------------ running gear
    for (const u of units) {
      const yw = u.yw;
      M.part('WHEEL', () => {
        for (const x of u.wx) for (const s of [1, -1]) {
          M.at(x, s * yw, R, () => G.bigWheel(M, { r: R, w: ww, tread }));
          nWheels++;
          centers.push([[x, -yw - ww / 2 - 0.3, R], [x, yw + ww / 2 + 0.3, R]]);
          if (s === sy) wheelAnchors.push([x, s * (yw + ww * 0.42), R + R * 0.62]);
        }
        for (const p of wheelAnchors) co(M, 'WHEEL', 2 * u.wx.length, p, 2.6);
      });
      if (fenders) {
        M.part('MUDGUARD', () => {
          for (const x of u.wx) for (const s of [1, -1]) {
            M.at(x, s * yw, R, () => G.fender(M, { r: R, w: ww + 0.14, a0: 12, a1: 168 }));
            const zf = R + R * 1.13;
            M.tube([x, s * (yw - ww / 2 - 0.05), zf], [x, s * u.sideY, Math.min(zf, u.attachTop)], 0.05, { isect: false });
            co(M, 'MUDGUARD', 2 * u.wx.length, [x + R * 0.35, s * (yw + ww * 0.3), R + R * 1.1], 0.9);
          }
        });
      }
      buildSuspension(M, u, R, ww, susp);
    }

    // twin: the bellows tunnel and the drawbar
    if (body === 'twin') {
      const u1 = units[0], u2 = units[1];
      M.part('BELLOWS TUNNEL', () => {
        if (u2.kind !== 'flat') {
          const zc = u2.kind === 'drum' ? u2.zc : u1.zb + Math.min(u1.H, u2.H) * 0.48;
          M.at(0, 0, zc, () => G.bellows(M, u2.x1 - 0.05, u1.x0 + 0.05, Math.min(u1.H, u2.H) * 0.28));
          co(M, 'BELLOWS TUNNEL', 1, [(u2.x1 + u1.x0) / 2, 0, zc + Math.min(u1.H, u2.H) * 0.28], 1.8);
        }
        G.drawbar(M, [u1.x0 + 0.1, 0, u1.zb + 0.15], [u2.x1 + 0.4, 0, u2.zb + 0.25], 0.08);
        co(M, 'DRAWBAR', 1, [(u2.x1 + u1.x0) / 2, 0, u1.zb + 0.2], 0.6);
      });
    }

    // ------------------------------------------------ equipment
    const nose = front;
    const roof = roofs[0];
    // roof slots, front to back over all roofs
    const slots = [];
    for (const rf of roofs) slots.push({ ...rf, at: rf.x1 });
    const take = (len) => {
      for (const s of slots) if (s.at - len >= s.x0) { const x = s.at - len / 2; s.at -= len + 0.2; return { x, s, len }; }
      return null;
    };

    if (has('lights')) {
      M.part('LAMP BAR', () => {
        const x = roof.x1 - 0.1;
        M.at(x, 0, roof.zEdge(0) + 0.45, () => G.lampBar(M, { w: Math.min(roof.w * 0.9, 3), n: 4, r: 0.13, post: 0.42 }));
        co(M, 'SEARCHLIGHT', 4, [x + 0.2, sy * 0.4, roof.zEdge(0) + 0.6], 1.6);
      });
      // and two searchlights on the far rear corners
      M.part('SEARCHLIGHT', () => {
        const rf = roofs[roofs.length - 1];
        M.at(rf.x0 + 0.1, -sy * rf.w * 0.32, rf.zEdge(rf.w * 0.32), () => K.searchlight(M, { r: 0.24 }));
      });
    }
    const mastSlot = has('mast') ? take(1.0) : null;
    if (mastSlot) {
      M.part('CAMERA MAST', () => {
        const y = -sy * roof.w * 0.3;
        const x = mastSlot.x;
        M.at(x, y, roof.zEdge(y) - 0.02, () => G.cameraMast(M, { h: mastH, s: 0.36, yaw: mastYaw }));
        co(M, 'CAMERA MAST', 1, [x, y, roof.zEdge(y) + mastH * 0.6], 2);
        co(M, 'STEREO CAMERA', 2, [x, y, roof.zEdge(y) + mastH + 0.2], 1.4);
      });
    }
    let dishSlot = null, rackSlot = null, solarSlot = null;
    if (has('dish')) dishSlot = take(dishR * 2.2);
    if (has('rack')) rackSlot = take(Math.min(3.6, Math.max(2.2, (slots[0].at - slots[0].x0) * 0.75)));
    if (has('solar')) solarSlot = take(2.4);
    if (has('dish') && !dishSlot) eq.delete('dish');
    if (has('rack') && !rackSlot) eq.delete('rack');
    if (has('solar') && !solarSlot) eq.delete('solar');
    if (dishSlot) {
      M.part('DISH ANTENNA', () => {
        const { x, s } = dishSlot;
        M.at(x, 0, s.z - 0.02, () => M.rz(dishAz, () => K.dishMount(M, { r: dishR, el: dishEl })));
        co(M, 'DISH ANTENNA', 1, [x, 0, s.z + dishR * 1.4], 2.1);
      });
    }
    if (rackSlot) {
      M.part('ROOF RACK', () => {
        const { x, s } = rackSlot;
        const L = rackSlot.len;
        const w = Math.min(s.w * 0.92, 3.2);
        const zEdge = s.zEdge(w / 2);
        const z0 = s.z - zEdge + 0.18;
        M.at(x, 0, zEdge, () => {
          const fz = G.rack(M, { len: L, w, z0, h: 0.4 });
          // cargo: crates, tanks, a spare wheel
          let cx = -L / 2 + 0.15;
          let k = 0;
          while (cx < L / 2 - 0.5 && k < 8) {
            const q = rackCargo[k++];
            if (q < 0.45) { const l = 0.55 + q * 0.6; if (cx + l > L / 2 - 0.1) break; M.at(cx + l / 2, (q - 0.2) * w * 0.3, fz, () => K.crate(M, { s: [l, Math.min(w * 0.55, 0.9), 0.5 + q * 0.4] })); cx += l + 0.12; }
            else if (q < 0.75) { const tr = 0.22; M.at(cx + tr, 0, fz + tr, () => M.rx(90, () => K.tankCapsule(M, { r: tr, len: w * 0.8, axis: 'z' }))); cx += tr * 2 + 0.12; }
            else { const wr = Math.min(R * 0.8, w * 0.35); if (cx + wr * 2 > L / 2) break; M.at(cx + wr, 0, fz + ww * 0.7 / 2, () => M.rx(90, () => G.bigWheel(M, { r: wr, w: ww * 0.7, tread }))); cx += wr * 2 + 0.12; }
          }
        });
        co(M, 'ROOF RACK', 1, [x + L * 0.3, sy * w / 2, s.z + 0.5], 1.7);
        if (job === 'MAIL') co(M, 'MAIL CRATE', 4, [x, 0, s.z + 0.8], 1.6);
        else co(M, 'STORES CRATE', 3, [x, 0, s.z + 0.8], 0.9);
      });
    }
    if (solarSlot) {
      M.part('SOLAR WING', () => {
        const { x, s } = solarSlot;
        const hy = s.w * 0.45;
        M.mirrorY(() => {
          const z = s.zEdge(hy) + 0.25;
          M.tube([x - 1.0, hy * 0.6, s.zEdge(hy * 0.6) - 0.02], [x - 1.0, hy, z], 0.05, { isect: false });
          M.tube([x + 1.0, hy * 0.6, s.zEdge(hy * 0.6) - 0.02], [x + 1.0, hy, z], 0.05, { isect: false });
          M.at(x, hy, z, () => M.rx(solarTilt, () => {
            M.cyl(0.06, -1.15, 1.15, { axis: 'x', isect: false });
            M.at(0, solarW / 2, 0, () => K.solar(M, { w: 2.3, h: solarW, t: 0.05 }));
          }));
        });
        co(M, 'SOLAR WING', 2, [x, sy * (hy + solarW * 0.5 * Math.cos(solarTilt * D2R)), s.zEdge(hy) + 0.25 + solarW * 0.5 * Math.sin(solarTilt * D2R)], 1.6);
      });
    }

    if (cupolaOn) {
      const c = take(1.5);
      if (c) M.part('CUPOLA', () => {
        M.at(c.x, 0, c.s.z - 0.03, () => K.cupola(M, { r: 0.6, h: 0.45, windows: 8 }));
        co(M, 'OBSERVATION CUPOLA', 1, [c.x, 0, c.s.z + 0.5], 1.2);
      });
    }

    // front-end gear: winch, arm
    const fx = nose.kind === 'drum' ? nose.x1 - 0.4 : nose.x1 + 0.3;
    if (has('winch')) {
      M.part('WINCH', () => {
        const z = nose.zb + 0.42;
        M.at(fx - 0.1, 0, z, () => K.winch(M, { r: 0.18, w: 0.7, at: [0, 0, 0] }));
        // fairlead, cable and a hook hanging under the bumper
        M.at(fx + 0.22, 0, z - 0.05, () => M.box([-0.08, -0.22, -0.12], [0.08, 0.22, 0.12], { isect: false }));
        const hz = Math.max(0.25, nose.zb - 0.55);
        M.line([[fx + 0.3, 0, z - 0.1], [fx + 0.3, 0, hz + 0.22]], { w: 1, pass: 1 });
        M.at(fx + 0.3, 0, hz, () => {
          M.box([-0.07, -0.05, 0.1], [0.07, 0.05, 0.24], { isect: false });
          const hp = [];
          for (let i = 0; i <= 8; i++) { const a = (-40 + 250 * i / 8) * D2R; hp.push([Math.sin(a) * 0.1, 0, 0.1 - Math.cos(a) * 0.1 - 0.0]); }
          M.pipe([[0, 0, 0.12], ...hp.slice(1)], 0.022, { isect: false });
        });
        co(M, 'WINCH', 1, [fx, 0.3 * sy, z + 0.15], 1.3);
      });
    }
    if (has('arm')) {
      M.part('SAMPLE ARM', () => {
        const y = sy * (nose.W / 2 - 0.55) * (nose.kind === 'drum' ? 0.55 : 1);
        const z = nose.kind === 'drum' ? nose.zb + 0.47 : nose.zb + 0.35;
        const r = 0.11;
        const l1 = 1.2 + R * 0.4;
        const zs = z + r * 3.4;
        const s1 = Math.sin(armA1 * D2R), s2 = Math.sin((armA1 + armA2) * D2R);
        const toolLen = armTool === 'drill' ? r * 9.6 : armTool === 'claw' ? r * 4 : r * 3;
        const zw = toolLen * Math.abs(s2) * (armTool === 'scoop' ? 0.3 : 1) + 0.12;
        const l2 = l1 * 0.92;
        const sAbs = clamp((zw - zs - l1 * s1) / l2, -1, -0.35);
        const a2r = Math.asin(sAbs) / D2R - armA1;
        void s2;
        M.at(fx + 0.05, y, z, () => {
          M.box([-0.4, -0.35, -0.12], [0.35, 0.35, 0.0]);
          M.rz(sy * armYaw, () => G.arm(M, { l1, l2, a1: armA1, a2: a2r, r, tool: armTool }));
        });
        co(M, 'SAMPLE ARM', 1, [fx + Math.cos(armA1 * D2R) * l1 * 0.5, y, zs + s1 * l1 * 0.5], 2.2);
        co(M, armTool === 'drill' ? 'CORE DRILL' : armTool === 'claw' ? 'GRAB' : 'SOIL SCOOP', 1, [fx + Math.cos(armA1 * D2R) * l1 + 0.2, y, Math.max(0.3, zw)], 1.5);
      });
    }

    // the airlock and its ladder on the near side
    if (has('airlock') && doorUnit._drumDoor) {
      const u = doorUnit, Rr = u.Rd, zs = u._drumDoor.z;
      M.part('AIRLOCK', () => {
        M.with({ at: [u.doorX, sy * Rr * 0.97, zs], rz: 90 * sy }, () => K.platform(M, { depth: 0.95, width: 1.4, inset: 0.3, stayH: 1.5, drop: 0.3 }));
        M.part('LADDER', () => {
          M.at(u.doorX, sy * (Rr * 0.97 + 0.9), 0, () => M.rz(90, () => M.ry(-6 * sy, () => K.ladder(M, { h: zs + 0.05, w: 0.5 }))));
          co(M, 'BOARDING LADDER', 1, [u.doorX, sy * (Rr + 0.9), zs * 0.45], 1.8);
        });
        figure = [u.doorX - 1.2, sy * (u.yw + ww / 2 + 1.1)];
        co(M, 'AIRLOCK DOOR', 1, [u.doorX, sy * Rr, zs + 0.9], 2);
        co(M, 'FOLD-DOWN PLATFORM', 1, [u.doorX, sy * (Rr + 0.5), zs], 1.2);
      });
    }
    if (has('airlock') && doorUnit._doorFace) {
      const u = doorUnit, f = u._doorFace;
      M.part('AIRLOCK', () => {
        const dw = 0.95, dh = Math.min(1.9, u.H * 0.66);
        const y = -f.h / 2 + dh / 2 + 0.18;
        if (f.on) { K.frame(f, [u._dx - dw * 0.85, -f.h / 2 + f.mOf(1.4), u._dx + dw * 0.85, y + dh / 2 + 0.2]); }
        const rr = K.door(M, f, u._dx, y, dw, dh, { platform: true, depth: 0.85, width: 1.35, drop: 0.05 });
        const sill = rr.sill;
        M.part('LADDER', () => {
          const zt = sill[2];
          M.at(u.doorX, sy * (u.W / 2 + 0.97), 0, () => M.rz(90, () => M.ry(-6 * sy, () => K.ladder(M, { h: zt + 0.05, w: 0.5 }))));
          co(M, 'BOARDING LADDER', 1, [u.doorX, sy * (u.W / 2 + 1.0), zt * 0.45], 1.8);
        });
        figure = [u.doorX - 1.2, sy * (u.yw + ww / 2 + 1.1)];
        co(M, 'AIRLOCK DOOR', 1, f.P(u._dx, y), 2);
        co(M, 'AIRLOCK DOOR', 1, f.P(u._dx, y + dh * 0.36), 2);
        co(M, 'AIRLOCK DOOR', 1, f.P(u._dx - dw * 0.3, y - dh * 0.1), 2);
      });
    }

    // towed sled behind
    if (has('sled')) {
      M.part('INSTRUMENT SLED', () => {
        const xr = back.x0;
        const sl = 2.6, sw = 1.5;
        const xs = xr - 1.6 - sl / 2;
        M.at(xs, 0, 0, () => {
          const sd = G.sled(M, { len: sl, w: sw, h: 0.35 });
          M.at(0, 0, sd.deck, () => {
            const B = M.box([-0.9, -0.5, 0], [0.5, 0.5, 0.55]);
            for (const k of ['+y', '-y', '+x', '-x']) { const f = B.f(k); if (f.on) f.grid(2, 1, { gap: 2.2 }).forEach((r, i) => (i ? K.louver(f, r) : K.plain(f, r))); }
            if (sledKind === 'radar') M.at(-0.2, 0, 0.55, () => K.radar(M, { len: 1.3 }));
            else if (sledKind === 'mast') { M.at(-0.6, 0.3, 0.55, () => K.whip(M, { h: 2.2, lean: 12 })); M.at(-0.1, 0, 0.55, () => K.searchlight(M, { r: 0.16 })); }
            else M.at(-0.2, 0, 0.55, () => K.dishMount(M, { r: 0.42, el: 50 }));
          });
          G.drawbar(M, [sl / 2, 0, 0.3], [1.6 + sl / 2 - 0.2, 0, back.zb + 0.2], 0.05);
        });
        M.at(xr - 0.05, 0, back.zb + 0.2, () => M.box([-0.15, -0.2, -0.12], [0.05, 0.2, 0.12], { isect: false }));
        co(M, 'INSTRUMENT SLED', 1, [xs, sy * 0.5, 0.9], 2);
        co(M, 'TOW BAR', 1, [xr - 0.8, 0, back.zb * 0.6], 0.7);
      });
    }

    // ------------------------------------------------ deck builders (closures)
    function buildDeck(M2, u, x0, x1, z) {
      M2.part('REAR DECK', () => {
        const dw = u.W - 0.1;
        const D = M2.box([x0, -dw / 2, z], [x1, dw / 2, z + 0.12]);
        grow([x0, -dw / 2, u.zb, x1, dw / 2, z + 0.12]);
        if (D.f('+z').on) { const f = D.f('+z'); f.grid(Math.max(2, Math.round((x1 - x0) / 0.8)), 1, { gap: 2.2 }).forEach((r) => { f.rect(r, { w: 1 }); f.hatch(r, { angle: 0, gap: 2.6, w: 0 }); }); }
        for (const k of ['+y', '-y', '-x']) { const f = D.f(k); if (f.on) f.hatch(f.box, { angle: 90, gap: 2.2, w: 0 }); }
        // a skirt under the deck down to the chassis line
        if (u.kind !== 'flat') M2.box([x0 + 0.1, -dw / 2 + 0.25, u.zb], [x1, dw / 2 - 0.25, z], { isect: false });
        const zd = z + 0.12;
        K.railing(M2, [[x1 - 0.05, dw / 2 - 0.05, zd], [x0 + 0.05, dw / 2 - 0.05, zd], [x0 + 0.05, -dw / 2 + 0.05, zd], [x1 - 0.05, -dw / 2 + 0.05, zd]], { h: 0.7, posts: 0.9 });
        co(M2, 'REAR DECK', 1, [(x0 + x1) / 2, sy * dw * 0.3, zd], 1.1);
        co(M2, 'REAR DECK', 1, [x0 + 0.3, sy * dw * 0.42, zd], 1.1);
        co(M2, 'REAR DECK', 1, [x1 - 0.3, -sy * dw * 0.4, zd], 1.1);
        // the cargo on the deck
        const xm = (x0 + x1) / 2, L = x1 - x0;
        if (has('cable')) {
          M2.part('CABLE DRUM', () => {
            const Rc = Math.min(1.0, L * 0.3, u.W * 0.3);
            const cw = Math.min(1.5, dw * 0.55);
            const cd = M2.at(xm + 0.2, 0, zd, () => G.cableDrum(M2, { r: Rc, w: cw }));
            // a guide arm off the back and the cable laid on the ground
            const g0 = [x0 + 0.15, 0, zd + 0.1], g1 = [x0 - 0.9, 0, zd * 0.45];
            K.strut(M2, g0, g1, 0.06, {});
            M2.at(g1[0], 0, g1[2], () => M2.rx(90, () => M2.cyl(0.14, -0.12, 0.12, { isect: false })));
            const top = [xm + 0.2, 0, zd + cd.zc + Rc * 0.5];
            M2.line([top, [g0[0], 0, g0[2] + 0.2], [g1[0], 0, g1[2] + 0.12], [g1[0] - 0.5, 0, 0.02], [g1[0] - 4.5, -0.3 * sy, 0.0], [g1[0] - 9, 0.2 * sy, 0.0]], { w: 1, pass: 1, fit: false });
            co(M2, 'CABLE DRUM', 1, [xm + 0.2, sy * cw / 2, zd + cd.zc], 2.4);
            co(M2, 'CABLE DRUM', 1, [xm + 0.2, 0, zd + cd.zc + Rc * 0.55], 2.4);
            co(M2, 'CABLE DRUM', 1, [xm + 0.2, sy * (cw / 2 + Rc * 0.06), zd + cd.zc + Rc * 0.75], 2.4);
            co(M2, 'CABLE GUIDE', 1, [(g0[0] + g1[0]) / 2, 0, (g0[2] + g1[2]) / 2], 1);
          });
        } else if (buggy) {
          M2.part('SCOUT BUGGY', () => {
            const bl = Math.min(L * 0.8, 2.8);
            M2.at(xm, 0, zd, () => G.buggy(M2, bl, des));
            co(M2, 'SCOUT BUGGY', 1, [xm, 0, zd + bl * 0.35], 2.4);
          });
        } else {
          M2.part('STORES CRATE', () => {
            const n = Math.max(1, Math.min(3, Math.floor(L / 1.1)));
            for (let i = 0; i < n; i++) M2.at(x0 + L * (i + 0.5) / n, (cellSeed[i] - 0.5) * dw * 0.3, zd, () => K.crate(M2, { s: [Math.min(0.95, L / n - 0.2), 0.9, 0.7 + cellSeed[i + 3] * 0.4] }));
            co(M2, 'STORES CRATE', n, [x0 + L * 0.5 / n, 0, zd + 0.8], 1);
          });
        }
      });
    }

    function buildNose(M2, u, xn, zt) {
      const Ln = u.x1 - xn, zb2 = u.zb, Hh = u.H, x1 = u.x1;
      let prof, glassFaces;
      if (noseKind === 'slant') {
        prof = [[xn, zb2], [x1, zb2], [x1, zb2 + Hh * 0.38], [xn + Ln * 0.28, zt], [xn, zt]];
        glassFaces = [['s2', 3, 1]];
      } else if (noseKind === 'bay') {
        const xb = x1 - Ln * 0.3;
        prof = [[xn, zb2], [xb, zb2], [xb, zb2 + Hh * 0.3], [x1, zb2 + Hh * 0.62], [xn + Ln * 0.3, zt], [xn, zt]];
        glassFaces = [['s2', 3, 1], ['s3', 3, 1]];
      } else {
        prof = [[xn, zb2], [x1, zb2], [x1 - Ln * 0.18, zt], [xn, zt]];
        glassFaces = [['s1', 3, 1]];
      }
      M2.part('CAB', () => {
        const N = M2.extrude(prof, -u.W / 2, u.W / 2, { plane: 'xz' });
        grow(N.bbox);
        for (const [nm, n] of glassFaces) {
          const f = N.f(nm);
          if (!f.ok) continue;
          const b = f.box;
          const m = 0.16;
          let r = [b[0] + m, b[1] + m, b[2] - m, b[3] - m];
          if (noseKind === 'flat') r = [b[0] + m, b[1] + f.h * 0.5, b[2] - m, b[3] - m];
          G.glazing(f, r, Math.max(2, Math.min(4, Math.round(f.w / 1.0))), 1, { flip: nm === 's3' });
          if (noseKind === 'flat' && f.on) { const g = f.grid(3, 1, { rect: [b[0] + m, b[1] + m, b[2] - m, b[1] + f.h * 0.5 - m] }); g.forEach((q, i) => (i === 1 ? K.louver(f, q) : K.plain(f, q))); }
        }
        // the lower front panel (slant, bay)
        const fl = N.f('s1');
        if (noseKind !== 'flat' && fl.on) { const g = fl.grid(3, 1, { gap: 2.4 }); g.forEach((q, i) => (i === 1 ? K.louver(fl, q) : K.plain(fl, q))); }
        // side windows and the cab door
        for (const s of [1, -1]) {
          const f = N.f(s > 0 ? '+y' : '-y');
          if (!f.on) continue;
          const yWin = zb2 + Hh * 0.5 - f.o[2];
          const top = G.clipY(f.poly, yWin, true);
          const bot = G.clipY(f.poly, yWin - f.mOf(3), false);
          if (top.length >= 3) G.pane(f, G.inset(top, 0.14), { frame: 2.4 });
          if (bot.length >= 3) G.corrPoly(f, G.inset(bot, 0.04), { dir: corrDir === 'corrugatedH' ? 'h' : 'v' });
          f.rivets(f.poly[0][0], yWin - f.mOf(1.5), f.poly[1][0], yWin - f.mOf(1.5), { pitch: 8 });
        }
        co(M2, 'CAB GLAZING', 1, N.f(glassFaces[0][0]).ok ? N.f(glassFaces[0][0]).P(0, 0) : [x1, 0, zt], 1.9);
        // visor over the glass
        if (noseKind !== 'flat') M2.box([xn + Ln * 0.28 - 0.05, -u.W / 2 - 0.04, zt - 0.03], [xn + Ln * 0.28 + 0.3, u.W / 2 + 0.04, zt + 0.04], { isect: false });
        // wiper arms
        const gf = N.f(glassFaces[glassFaces.length - 1][0]);
        if (gf.on) for (const x of [-gf.w * 0.25, gf.w * 0.15]) gf.line(x, -gf.h * 0.38, x - gf.w * 0.08, gf.h * 0.1, { w: 1, pass: 2 });
      });
      M2.part('BUMPER', () => {
        M2.box([x1 - 0.12, -u.W * 0.48, zb2 - 0.06], [x1 + 0.3, u.W * 0.48, zb2 + 0.3]);
        for (const s of [1, -1]) M2.at(x1 + 0.02, s * u.W * 0.36, zb2 + (noseKind === 'flat' ? 0.55 : Hh * 0.2), () => K.lamp(M2, { r: 0.14 }));
        co(M2, 'HEADLAMP', 2, [x1 + 0.15, sy * u.W * 0.36, zb2 + (noseKind === 'flat' ? 0.55 : Hh * 0.2)], 1);
      });
    }

    // ------------------------------------------------ whip antenna
    M.part('WHIP ANTENNA', () => {
      const rf = roofs[roofs.length - 1];
      const y = sy * rf.w * 0.38;
      const zE = rf.zEdge(rf.w * 0.38);
      M.at(rf.x0 + 0.15, y, zE, () => K.whip(M, { h: H * 0.8, lean: 10 }));
      co(M, 'WHIP ANTENNA', 1, [rf.x0 + 0.15, y, zE + 0.3], 0.7);
    });

    M.info.mass = massBox;
    M.info.centers = centers;

    // ------------------------------------------------ vocabulary
    const where = PLACES[place];
    const crewW = word(crew);
    const nW = nWheels;
    let brief;
    if (job === 'SURVEY') brief = has('sled') ? `Tows a sounding sled across ${where} for ${crewW} surveyors.` : has('dish') ? `Maps ${where} with a camera mast and sends the plates home by dish.` : `Maps ${where} from a camera mast with ${crewW} surveyors aboard.`;
    else if (job === 'SAMPLE') brief = armTool === 'drill' ? `Drills cores from ${where} and keeps them cold for the trip home.` : armTool === 'claw' ? `Picks up rocks on ${where} with an arm and a grab.` : `Scoops soil samples from ${where} for a crew of ${crewW}.`;
    else if (job === 'MAIL') brief = buggy && !has('cable') ? `Carries mail and a scout buggy between camps on ${where}.` : `Carries mail and stores between stations on ${where}.`;
    else if (job === 'RESCUE') brief = `Fetches stranded crews from ${where} with a winch and lamps.`;
    else brief = `Lays ${cableKm} km of signal cable across ${where} from a drum.`;
    if (brief.length > 78) brief = brief.replace(/ (across|on|from) the [a-z ]+/, '').slice(0, 78);
    const form = body === 'twin' ? M.pick(['TWIN ROVER', 'ROVER TRAIN']) : body === 'drum' ? M.pick(['DRUM ROVER', 'ROVER']) : M.pick(['ROVER', 'ROVER', 'CRUISER']);
    const L = massBox[3] - massBox[0];
    const mass = Math.round(L * W * H * (body === 'drum' ? 0.22 : 0.26) * (0.85 + cellSeed[9] * 0.3));
    return {
      place, job: job === 'CABLE' ? 'CABLE-LAYING' : job, form,
      designation: des,
      brief,
      specs: [['MASS', `${mass} T`], ['CREW', String(crew)], ['WHEELS', `${nW} X ${Math.round(R * 2000 / 10) * 10} MM`], ['RANGE', `${rangeKm} KM / ${days} DAYS`]],
      figure,
    };
  },
};

// ------------------------------------------------------------------ suspension
function buildSuspension(M, u, R, ww, kind) {
  const yw = u.yw, sideY = u.sideY;
  const xs = u.wx;
  if (kind === 'axle') {
    M.part('BEAM AXLE', () => {
      const ra = R * 0.17;
      for (const x of xs) {
        M.tube([x, -yw + ww * 0.3, R], [x, yw - ww * 0.3, R], ra, {});
        M.at(x, 0, R, () => M.sphere(ra * 2.1));
        M.at(x, 0, R, () => M.ry(90, () => M.cyl(ra * 1.1, 0, ra * 3.4, { isect: false })));
        for (const s of [1, -1]) {
          const ys = s * (Math.min(sideY, u.W / 2) - 0.3);
          M.at(x, ys, R + ra, () => G.leafSpring(M, { len: R * 1.5, n: 4, t: 0.045, w: 0.12 }));
          for (const dx of [-R * 0.75, R * 0.75]) M.box([x + dx - 0.06, ys - 0.08, R + ra + 0.12], [x + dx + 0.06, ys + 0.08, u.zb + 0.02], { isect: false });
          // damper
          M.tube([x + R * 0.25, s * (yw - ww / 2 - 0.12), R + ra * 0.5], [x + R * 0.55, s * (sideY + 0.02), Math.min(u.attachTop, u.zb + 0.5)], 0.05, { isect: false });
        }
        co(M, 'BEAM AXLE', xs.length, [x, sy0(M) * (yw - ww / 2 - 0.2), R], 1.4);
        co(M, 'LEAF SPRING', xs.length * 2, [x + R * 0.4, sy0(M) * (Math.min(sideY, u.W / 2) - 0.3), R + ra + 0.12], 1.5);
      }
    });
  } else if (kind === 'arm') {
    M.part('SWING ARM', () => {
      const xm = (u.x0 + u.x1) / 2;
      for (const x of xs) for (const s of [1, -1]) {
        const dir = x > xm ? -1 : 1;
        const pv = [x + dir * R * 1.05, s * (sideY - 0.05), u.zb + 0.15];
        const kn = [x, s * (yw - ww / 2 - 0.12), R];
        M.along(pv, kn, (L) => M.box([-0.08, -0.09, -0.11], [L + 0.05, 0.09, 0.11], { isect: false }), [0, 0, 1]);
        M.at(pv[0], pv[1], pv[2], () => M.rx(90, () => M.cyl(0.13, -0.16, 0.16, { isect: false })));
        M.at(kn[0], kn[1], kn[2], () => M.rx(90, () => M.cyl(R * 0.2, -0.1, 0.1, { isect: false })));
        // coil strut from near the knuckle to a bracket high on the side
        const lo = G.lerp(pv, kn, 0.78);
        const hi = [x + dir * R * 0.15, s * (sideY + 0.12), Math.min(u.attachTop, u.zb + R * 1.15)];
        G.springStrut(M, lo, hi, 0.075);
        M.box([hi[0] - 0.12, s * sideY, hi[2] - 0.1], [hi[0] + 0.12, s * (sideY + 0.18), hi[2] + 0.12], { isect: false });
        if (s === sy0(M)) {
          co(M, 'SWING ARM', xs.length * 2, G.lerp(pv, kn, 0.5), 1.4);
          co(M, 'SPRING STRUT', xs.length * 2, G.lerp(lo, hi, 0.5), 1.5);
        }
      }
    });
  } else {
    M.part('ROCKER BOGIE', () => {
      const yr = yw - ww / 2 - 0.28;
      const hk = R * 0.62, r = Math.max(0.07, R * 0.075);
      for (const s of [1, -1]) {
        const tops = xs.map((x) => [x, s * yr, R + hk]);
        // knuckles and stub axles
        for (const x of xs) {
          M.box([x - 0.11, s * yr - 0.11, R - 0.15], [x + 0.11, s * yr + 0.11, R + hk], { isect: false });
          M.tube([x, s * yr, R], [x, s * (yw - ww * 0.3), R], R * 0.09, { isect: false });
        }
        const piv = (p) => { M.at(p[0], p[1], p[2], () => M.rx(90, () => M.cyl(r * 1.6, -r * 1.4, r * 1.4, { isect: false }))); };
        const beam = (a, b) => K.strut(M, a, b, r, {});
        const main = (p) => {
          piv(p);
          // pivot pin into the body side
          M.tube([p[0], s * (sideY - 0.05), Math.min(p[2], u.attachTop)], p, r * 0.9, { isect: false });
          M.box([p[0] - 0.25, s * sideY, Math.min(p[2], u.attachTop) - 0.25], [p[0] + 0.25, s * (sideY + 0.06), Math.min(p[2], u.attachTop) + 0.25], { isect: false });
        };
        if (xs.length === 1) {
          const p = [xs[0], s * yr, R + hk + R * 0.25];
          beam(tops[0], p); main(p);
        } else if (xs.length === 2) {
          const p = [(xs[0] + xs[1]) / 2, s * yr, R + hk + R * 0.3];
          beam(p, tops[0]); beam(p, tops[1]); main(p);
        } else if (xs.length === 3) {
          const bp = [(xs[1] + xs[2]) / 2, s * yr, R + hk + R * 0.18];
          beam(bp, tops[1]); beam(bp, tops[2]); piv(bp);
          const p = [(xs[0] + bp[0]) / 2 + R * 0.2, s * yr, R + hk + R * 0.5];
          beam(p, tops[0]); beam(p, bp); main(p);
        } else {
          const b1 = [(xs[0] + xs[1]) / 2, s * yr, R + hk + R * 0.18];
          const b2 = [(xs[2] + xs[3]) / 2, s * yr, R + hk + R * 0.18];
          beam(b1, tops[0]); beam(b1, tops[1]); beam(b2, tops[2]); beam(b2, tops[3]); piv(b1); piv(b2);
          const p = [(b1[0] + b2[0]) / 2, s * yr, R + hk + R * 0.5];
          beam(p, b1); beam(p, b2); main(p);
        }
        if (s === sy0(M)) co(M, 'ROCKER BOGIE', 2, tops.length > 1 ? G.lerp(tops[0], tops[1], 0.5) : tops[0], 1.6);
      }
    });
  }
}
// a callout whose anchor is nudged a few px toward the viewer, so anchors on curved or
// faceted surfaces still count as visible (orthographic: the point stays put on paper)
function co(M, label, qty, p, prio) {
  const w = M.W(p), e = M.view.e, k = (M.px || 0) * 4;
  M.world(() => M.callout(label, qty, [w[0] + e[0] * k, w[1] + e[1] * k, w[2] + e[2] * k], prio));
}
function sy0(M) { return M.view.e[1] >= 0 ? 1 : -1; }
