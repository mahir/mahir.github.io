// classes/monowheel.js: small odd personal vehicles, where the person standing beside it is
// a big part of the picture. One huge wheel ring with the rider's carriage inside it, a
// two-wheel cabin car with a framed bubble and outrigger wheels, a three-wheeler with a
// pusher propeller in a guard ring, a motor sled on skis with a track. Details at this
// size: seat, steering wheel seen through the canopy frame, headlamp, mudguards, luggage
// rack with the load of the job, exhaust, a number plate with the designation.

import * as G from './parts-ground.js';

const { K, D2R, clamp, lerp } = G;

const PLACES = {
  VILLAGE: 'the villages', ISLAND: 'the island', CANAL: 'the canal towns', HILL: 'the hill farms',
  COAST: 'the coast', DESERT: 'the desert posts', CITY: 'the old town', MARSH: 'the marsh farms',
};
const SNOW = { POLAR: 'the polar stations', ALPINE: 'the alpine huts', TUNDRA: 'the tundra camps', GLACIER: 'the glacier huts' };

export default {
  id: 'monowheel',
  family: 'ground',
  weight: 0.6,
  build(M) {
    const kind = M.wpick([[2.2, 'mono'], [1.6, 'bubble'], [1.4, 'trike'], [1.4, 'sled']]);
    const job = M.wpick([[3, 'POST'], [2, 'DOCTOR'], [1.6, 'INSPECTOR'], [1.6, 'MESSENGER']]);
    const place = kind === 'sled' ? M.pick(Object.keys(SNOW)) : M.pick(Object.keys(PLACES));
    const sv = M.pick([1, -1]);
    const az = sv * M.r(34, 56) + (M.chance(0.15) ? sv * 90 : 0);
    const el = M.r(20, 28);
    const Rw = M.r(1.0, 1.3);
    const tw = M.r(0.3, 0.42);
    const L = M.r(2.4, 3.0);
    const Wb = M.r(1.0, 1.2);
    const r1 = M.r(0.28, 0.36);
    const propR = M.r(0.65, 0.85);
    const seats = M.pick([1, 1, 2]);
    const loadK = M.pick(['bag', 'box', 'box']);
    const lampN = M.pick([1, 2]);
    const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
    const desig = `${M.pick(LET.split(''))}${M.pick(LET.split(''))}-${M.ri(10, 99)}`;
    const speed = { mono: M.ri(40, 70), bubble: M.ri(60, 90), trike: M.ri(50, 80), sled: M.ri(40, 60) }[kind];
    M.setView(az, el);
    const e = M.view.e;
    const sy = e[1] >= 0 ? 1 : -1, sx = e[0] >= 0 ? 1 : -1;
    const loadWord = { POST: 'MAIL', DOCTOR: 'DOCTOR', INSPECTOR: 'INSPECTOR', MESSENGER: 'EXPRESS' }[job];
    let figure = null;
    const centers = [];

    // the load on a luggage rack: at the local origin, on z = 0, along x
    const load = (len, w) => {
      G.rack(M, { len, w, h: 0.12, r: 0.012, z0: 0.05 });
      if (loadK === 'bag' && job === 'POST') {
        const S = M.at(0, 0, 0.06 + w * 0.32, () => M.scale(len * 0.42, w * 0.38, w * 0.32, () => M.sphere(1, { rings: 10 })));
        if (M.decorOn) { S.lat.ring(0.5, { w: 1 }); S.lat.shade({ gap: 1.6 }); }
        M.at(len * 0.38, 0, 0.06 + w * 0.32, () => M.ry(90, () => M.cone(w * 0.12, w * 0.04, 0, w * 0.18, { isect: false })));
      } else {
        M.at(0, 0, 0.06, () => {
          const C = M.box([-len * 0.42, -w * 0.42, 0], [len * 0.42, w * 0.42, w * 0.55]);
          for (const k of ['+y', '-y']) { const f = C.f(k); if (f.on) { f.rect(-f.w / 2 + f.mOf(3), -f.h / 2 + f.mOf(3), f.w / 2 - f.mOf(3), f.h / 2 - f.mOf(3), { w: 1 }); K.stencil(f, loadWord, 0, 0, Math.min(f.h * 0.32, f.w / loadWord.length * 1.25)); } }
          const tp = C.f('+z'); if (tp.on) { tp.line(-tp.w / 2, 0, tp.w / 2, 0, { w: 1 }); tp.rect(-tp.w * 0.1, -tp.h * 0.1, tp.w * 0.1, tp.h * 0.1, { w: 1 }); }
        });
      }
    };
    const plate = (x, y, z, dir) => M.at(x, y, z, () => M.rz(dir > 0 ? 0 : 180, () => {
      const P = M.box([0, -0.2, -0.06], [0.015, 0.2, 0.06], { isect: false });
      const f = P.f('+x'); if (f.on) { f.rect(-f.w / 2 + f.mOf(1.2), -f.h / 2 + f.mOf(1.2), f.w / 2 - f.mOf(1.2), f.h / 2 - f.mOf(1.2), { w: 1 }); K.stencil(f, desig, 0, 0, f.h * 0.55); }
    }));
    const seat = (x, z, w, back = true) => {
      const S = M.box([x - 0.22, -w / 2, z], [x + 0.22, w / 2, z + 0.1], { chamfer: 0.04 });
      const t = S.f('+z'); if (t.on) for (let i = 1; i < 4; i++) t.line(-t.w / 2 + t.w * i / 4, -t.h / 2 + t.mOf(2), -t.w / 2 + t.w * i / 4, t.h / 2 - t.mOf(2), { w: 0 });
      if (back) M.at(x - 0.22, 0, z + 0.08, () => M.ry(-14, () => { const B = M.box([-0.08, -w / 2, 0], [0, w / 2, 0.55], { chamfer: 0.03 }); const f = B.f('+x'); if (f.on) for (let i = 1; i < 4; i++) f.line(-f.w / 2 + f.mOf(2), -f.h / 2 + f.h * i / 4, f.w / 2 - f.mOf(2), -f.h / 2 + f.h * i / 4, { w: 0 }); }));
    };
    const steering = (p, tilt, r = 0.17) => M.at(p[0], p[1], p[2], () => M.ry(-90 + tilt, () => {
      M.torus(r, 0.015, { isect: false });
      for (let i = 0; i < 3; i++) M.rz(i * 120 + 90, () => M.tube([0, 0, 0], [r, 0, 0], 0.01, { isect: false }));
      M.cyl(0.025, -0.45, 0, { isect: false });
    }));

    let job2 = job, form = 'MONOWHEEL', massKg = 0;
    if (kind === 'mono') {
      const zc = Rw;
      M.part('WHEEL RING', () => {
        M.at(0, 0, zc, () => G.bigWheel(M, { r: Rw, w: tw, hub: Rw * 0.84, hubs: false, tread: 'chevron' }));
        // the inner rail on both edges of the ring
        for (const s of [1, -1]) M.at(0, s * tw * 0.3, zc, () => M.rx(90, () => M.torus(Rw * 0.82, 0.025, { isect: false })));
        co(M, 'WHEEL RING', 1, [Rw * 0.7, sy * tw * 0.5, zc + Rw * 0.7], 2.8);
        co(M, 'INNER RAIL', 1, [-Rw * 0.82 * 0.7, sy * tw * 0.3, zc + Rw * 0.82 * 0.7], 1.2);
        centers.push([[0, -tw - 0.6, zc], [0, tw + 0.6, zc]]);
      });
      M.part('CARRIAGE', () => {
        const ri = Rw * 0.82;
        // three rollers on the rail: top, front low, back low
        const rollers = [90, -35, 215].map((a) => [Math.cos(a * D2R) * (ri - 0.07), 0, zc + Math.sin(a * D2R) * (ri - 0.07)]);
        for (const p of rollers) M.at(p[0], 0, p[2], () => K.wheel(M, { r: 0.07, w: 0.08, hub: 0.035, hubs: 'seen' }));
        // the carriage frame: a cradle under the seat, arms up to the rollers
        const cz = zc - ri * 0.45;
        const C = M.box([-0.45, -0.32, cz], [0.42, 0.32, cz + 0.32], { chamfer: 0.08 });
        for (const k of ['+y', '-y']) { const f = C.f(k); if (f.on) { K.louver(f, [-f.w * 0.42, -f.h * 0.35, -f.w * 0.05, f.h * 0.35]); for (let i = 0; i < 5; i++) f.line(f.w * 0.05 + i * f.w * 0.07, -f.h * 0.38, f.w * 0.05 + i * f.w * 0.07, f.h * 0.38, { w: 1 }); } }
        for (const p of rollers) for (const s of [1, -1]) M.tube([clamp(p[0], -0.4, 0.38), s * 0.28, cz + 0.3], [p[0], s * 0.06, p[2]], 0.02, { isect: false });
        seat(-0.05, cz + 0.32, 0.5, true);
        // tiller and bars
        M.tube([0.35, 0, cz + 0.3], [0.5, 0, cz + 0.85], 0.025, {});
        M.pipe([[0.5, -0.32, cz + 0.92], [0.52, -0.25, cz + 0.85], [0.52, 0.25, cz + 0.85], [0.5, 0.32, cz + 0.92]], 0.016, { isect: false });
        // small windscreen and headlamp
        M.at(0.55, 0, cz + 0.75, () => M.ry(-25, () => M.plate([[0, -0.28, 0], [0, 0.28, 0], [0, 0.22, 0.35], [0, -0.22, 0.35]])));
        M.at(0.58, 0, cz + 0.55, () => K.lamp(M, { r: 0.07 }));
        // exhaust out the side
        K.pipeRun(M, [[0.1, -sy * 0.3, cz + 0.08], [-0.2, -sy * 0.42, cz + 0.05], [-0.7, -sy * 0.42, cz + 0.1]], 0.025, { flanges: false });
        M.at(-0.7, -sy * 0.42, cz + 0.1, () => M.ry(90, () => M.cyl(0.04, -0.2, 0)));
        // luggage rack behind the seat
        M.at(-0.55, 0, cz + 0.3, () => M.ry(-35, () => load(0.42, 0.42)));
        plate(-0.45, 0, cz + 0.1, -1);
        co(M, 'CARRIAGE', 1, [0.0, sy * 0.32, cz + 0.16], 2.2);
        for (const r of rollers) co(M, 'RAIL ROLLER', 3, [r[0], sy * 0.05, r[2]], 1.4);
        co(M, 'SEAT', 1, [-0.05, sy * 0.2, cz + 0.45], 1.6);
        co(M, 'SEAT', 1, [-0.05, 0, cz + 0.43], 1.6);
        co(M, 'SEAT', 1, [-0.3, 0, cz + 0.85], 1.6);
        co(M, 'HEADLAMP', 1, [0.68, 0, cz + 0.55], 1.3);
        co(M, 'LUGGAGE RACK', 1, [-0.6, sy * 0.2, cz + 0.45], 1.7);
        co(M, 'EXHAUST', 1, [-0.6, -sy * 0.42, cz + 0.1], 0.9);
        co(M, 'TILLER', 1, [0.45, sy * 0.25, cz + 0.87], 1.1);
      });
      // a kick stand
      M.part('STAND', () => { M.tube([-0.3, sy * 0.3, Rw * 0.4], [-0.75, sy * 0.55, 0.02], 0.02, {}); M.at(-0.75, sy * 0.55, 0, () => M.cyl(0.07, 0, 0.02)); });
      M.info.mass = [-Rw, -tw / 2, 0, Rw, tw / 2, 2 * Rw];
      form = 'MONOWHEEL'; massKg = Math.round(Rw * 200 / 10) * 10;
      figure = [sx * 0.3, sy * (Rw * 0.6 + 0.9)];
    } else if (kind === 'bubble') {
      const zb = r1 * 1.05, zw = zb + 0.5, H = zb + 1.3;
      const hx = L / 2;
      M.part('BODY TUB', () => {
        const prof = [];
        for (let i = 0; i <= 16; i++) {
          const t = i / 16, a = Math.PI * t;
          const x = -Math.cos(a) * hx;
          const zl = zb + (1 - Math.pow(Math.sin(a), 0.5)) * 0.25;
          prof.push([x, zl]);
        }
        const top = prof.slice().reverse().map(([x]) => [x, zw - (Math.abs(x) > hx * 0.85 ? (Math.abs(x) - hx * 0.85) * 0.8 : 0)]);
        const T = M.extrude([...prof, ...top], -Wb / 2, Wb / 2, { plane: 'xz', smoothDeg: 25 });
        for (const s of [1, -1]) {
          const f = T.f(s > 0 ? '+y' : '-y');
          if (!f.on) continue;
          f.path(G.inset(f.poly, 0.04), { closed: true, w: 1 });
          const yd = zb + 0.3 - f.o[2];
          f.line(-f.w * 0.15, yd - 0.2, -f.w * 0.15, yd + 0.24, { w: 1 });
          f.line(f.w * 0.2, yd - 0.2, f.w * 0.2, yd + 0.24, { w: 1 });
          f.rect(f.w * 0.1, yd + 0.05, f.w * 0.16, yd + 0.09, { w: 1 });
          K.stencil(f, loadWord, -f.w * 0.0 + f.w * 0.02, yd, 0.09);
          const yb = zb + 0.46 - f.o[2];
          G.hline(f, zb + 0.46, { w: 1 }); G.hline(f, zb + 0.5, { w: 1 });
          f.hatch([-f.w, yb, f.w, yb + 0.04], { angle: 45, gap: 1.4, w: 0 });
          f.rivets(-f.w * 0.42, yb - 0.04, f.w * 0.42, yb - 0.04, { pitch: 8 });
          if (f.tone > 0.3) f.hatch(f.box, { angle: 90, gap: 3.2 - 1.6 * f.tone, w: 0 });
        }
        co(M, 'BODY TUB', 1, [0, sy * Wb / 2, zb + 0.3], 2);
      });
      M.part('CANOPY FRAME', () => {
        // hoops and bows of thin tube; glass shown by a few glints
        const cl = L * 0.62, x0 = -cl * 0.55, x1 = cl * 0.45, ch = H - 0.55;
        const bow = (y, k) => { const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20, a = Math.PI * t; pts.push([x0 + (x1 - x0) * t, y, zw + Math.sin(a) * ch * k]); } return pts; };
        for (const y of [-Wb * 0.46, Wb * 0.46]) M.pipe(bow(y, 0.82), 0.014, { isect: false, smoothBends: true });
        M.pipe(bow(0, 1.0), 0.016, { isect: false, smoothBends: true });
        for (const t of [0.2, 0.5, 0.8]) {
          const x = x0 + (x1 - x0) * t;
          const hz = Math.sin(Math.PI * t) * ch;
          const pts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * i / 14; pts.push([x, -Math.cos(a) * Wb * 0.46, zw + hz * (0.82 + 0.18 * Math.sin(a))]); }
          M.pipe(pts, 0.014, { isect: false, smoothBends: true });
        }
        // glints
        for (const s of [1, -1]) for (const q of [0.3, 0.38]) M.line([[x0 + (x1 - x0) * q, s * Wb * 0.47, zw + ch * 0.25], [x0 + (x1 - x0) * (q + 0.12), s * Wb * 0.47, zw + ch * 0.62]], { w: 0, pass: 3 });
        co(M, 'CANOPY FRAME', 1, [(x0 + x1) / 2, sy * Wb * 0.46, zw + ch * 0.7], 2.2);
      });
      M.part('COCKPIT', () => {
        for (let i = 0; i < seats; i++) seat(-0.25 - i * 0.62, zw - 0.25, 0.5, true);
        M.box([0.4, -Wb * 0.4, zw - 0.15], [0.62, Wb * 0.4, zw + 0.12]);
        steering([0.28, 0, zw + 0.28], -40);
        co(M, 'STEERING WHEEL', 1, [0.3, sy * 0.12, zw + 0.42], 1.6);
        co(M, 'STEERING WHEEL', 1, [0.22, 0, zw + 0.44], 1.6);
        co(M, 'STEERING WHEEL', 1, [0.34, -sy * 0.15, zw + 0.3], 1.6);
        co(M, 'SEAT', seats, [-0.25, sy * 0.2, zw - 0.1], 1.2);
      });
      M.part('WHEEL', () => {
        for (const x of [hx * 0.62, -hx * 0.62]) { M.at(x, 0, r1, () => G.bigWheel(M, { r: r1, w: r1 * 0.55, tread: 'ribs' })); centers.push([[x, -0.4, r1], [x, 0.4, r1]]); }
        M.at(hx * 0.62, 0, r1, () => G.fender(M, { r: r1, w: r1 * 0.7, a0: 10, a1: 150 }));
        // outrigger wheels on struts
        for (const s of [1, -1]) {
          const x = -hx * 0.1, y = s * (Wb / 2 + 0.38);
          M.tube([x + 0.15, s * Wb * 0.45, zb + 0.15], [x, y, 0.16], 0.02, {});
          M.at(x, y, 0.12, () => K.wheel(M, { r: 0.12, w: 0.06, hub: 0.05, hubs: 'seen' }));
        }
        co(M, 'WHEEL', 2, [hx * 0.62, sy * r1 * 0.3, r1 * 1.6], 1.6);
        co(M, 'OUTRIGGER WHEEL', 2, [-hx * 0.1, sy * (Wb / 2 + 0.38), 0.25], 1.8);
        co(M, 'MUDGUARD', 1, [hx * 0.62 + r1 * 0.5, sy * r1 * 0.3, r1 * 1.95], 0.9);
      });
      M.part('LAMPS', () => {
        for (let i = 0; i < lampN; i++) M.at(hx - 0.05, lampN === 1 ? 0 : (i ? 1 : -1) * Wb * 0.3, zb + 0.38, () => K.lamp(M, { r: 0.07 }));
        co(M, 'HEADLAMP', lampN, [hx + 0.05, 0, zb + 0.38], 1.3);
        plate(-hx - 0.02, 0, zb + 0.32, -1);
        co(M, 'NUMBER PLATE', 1, [-hx - 0.05, sy * 0.1, zb + 0.32], 1.1);
      });
      M.part('LUGGAGE RACK', () => {
        M.at(-hx * 0.78, 0, zw - 0.03, () => load(0.5, 0.6));
        co(M, 'LUGGAGE RACK', 1, [-hx * 0.78, sy * 0.3, zw + 0.15], 1.6);
        K.pipeRun(M, [[-hx * 0.3, -sy * 0.3, zb], [-hx * 0.9, -sy * 0.3, zb - 0.02], [-hx - 0.1, -sy * 0.3, zb + 0.05]], 0.022, { flanges: false });
      });
      M.info.mass = [-hx, -Wb / 2, 0, hx, Wb / 2, H];
      form = 'BUBBLE CAR'; massKg = 380 + seats * 60;
    } else if (kind === 'trike') {
      const zs = 0.42, hx = L / 2;
      M.part('NACELLE', () => {
        const prof = [[0, -hx], [0.18, -hx + 0.08], [0.36, -hx + 0.4], [0.42, -hx + 0.9], [0.42, hx - 0.7], [0.3, hx - 0.2], [0, hx]];
        const N = M.at(0, 0, zs + 0.3, () => M.scale(1, Wb / 0.84 / 1.0 * 0.5 / 0.5, 1, () => M.lathe(prof, { axis: 'x' })));
        if (M.decorOn) {
          const Lt = N.lat;
          Lt.ring(0.42, { w: 1 }); Lt.ring(0.72, { w: 1 });
          Lt.shade({ t0: 0.05, t1: 0.95, gap: 1.6, gapMax: 4 });
          Lt.text(desig, sy > 0 ? 100 : 260, 0.6, 0.11, { along: true });
          Lt.text(loadWord, sy > 0 ? 110 : 250, 0.3, 0.08, { along: true });
        }
        // the open cockpit: a coaming ring with a windscreen
        M.at(0.05, 0, zs + 0.68, () => M.scale(0.55, 0.38, 1, () => M.torus(1, 0.045, { isect: false })));
        M.at(0.62, 0, zs + 0.7, () => M.ry(-30, () => M.plate([[0, -0.36, 0], [0, 0.36, 0], [0, 0.28, 0.38], [0, -0.28, 0.38]])));
        seat(-0.1, zs + 0.45, 0.48, true);
        steering([0.38, 0, zs + 0.92], -50, 0.15);
        co(M, 'NACELLE', 1, [-hx * 0.3, sy * 0.4, zs + 0.45], 2);
        co(M, 'WINDSCREEN', 1, [0.68, sy * 0.1, zs + 0.85], 1.3);
        co(M, 'STEERING WHEEL', 1, [0.35, sy * 0.12, zs + 1.0], 1.2);
      });
      M.part('WHEEL', () => {
        // front wheel on a fork, two rear wheels on an axle
        const xf = hx * 0.78;
        M.at(xf, 0, r1, () => G.bigWheel(M, { r: r1, w: r1 * 0.45, tread: 'ribs' }));
        for (const s of [1, -1]) M.tube([xf, s * r1 * 0.3, r1], [xf - 0.12, s * 0.12, zs + 0.3], 0.025, {});
        M.at(xf, 0, r1, () => G.fender(M, { r: r1, w: r1 * 0.55, a0: 0, a1: 150 }));
        const xr = -hx * 0.42, yr = Wb * 0.62;
        for (const s of [1, -1]) {
          M.at(xr, s * yr, r1, () => G.bigWheel(M, { r: r1, w: r1 * 0.5, tread: 'ribs' }));
          M.at(xr, s * yr, r1, () => G.fender(M, { r: r1, w: r1 * 0.62, a0: 20, a1: 175 }));
          M.tube([xr, s * (yr - r1 * 0.3), r1 + r1 * 1.12], [xr, s * 0.3, zs + 0.3], 0.018, { isect: false });
        }
        M.tube([xr, -yr + r1 * 0.25, r1], [xr, yr - r1 * 0.25, r1], 0.03, {});
        centers.push([[xr, -yr - 0.4, r1], [xr, yr + 0.4, r1]]);
        co(M, 'WHEEL', 3, [xr, sy * (yr + r1 * 0.25), r1 * 1.4], 1.6);
        co(M, 'MUDGUARD', 3, [xr + r1 * 0.4, sy * yr, r1 * 2.05], 1.0);
      });
      M.part('PROPELLER', () => {
        const xp = -hx - 0.35, zp = zs + 0.3 + 0.05;
        // engine pod and pusher propeller in a guard ring on stays
        M.at(-hx + 0.1, 0, zp, () => M.ry(-90, () => { const C = M.cyl(0.18, 0, 0.35); if (M.decorOn) for (let i = 1; i < 6; i++) C.lat.ring(i / 6, { w: 0 }); }));
        M.at(xp, 0, zp, () => M.rz(180, () => K.propeller(M, { r: propR, blades: 2 })));
        M.at(xp + 0.05, 0, zp, () => M.ry(90, () => M.torus(propR + 0.06, 0.025, { isect: false })));
        for (let i = 0; i < 4; i++) { const a = (i + 0.5) * Math.PI / 2; M.tube([xp + 0.05, Math.cos(a) * (propR + 0.06), zp + Math.sin(a) * (propR + 0.06)], [-hx + 0.35, Math.cos(a) * 0.25, zp + Math.sin(a) * 0.25], 0.012, { isect: false }); }
        co(M, 'PUSHER PROPELLER', 1, [xp, sy * propR * 0.5, zp + propR * 0.5], 2.4);
        co(M, 'PROPELLER GUARD', 1, [xp + 0.05, sy * (propR + 0.06), zp], 1.4);
      });
      M.part('LAMPS', () => {
        for (let i = 0; i < lampN; i++) M.at(hx - 0.25, lampN === 1 ? 0 : (i ? 1 : -1) * 0.18, zs + 0.52, () => K.lamp(M, { r: 0.06 }));
        co(M, 'HEADLAMP', lampN, [hx - 0.12, 0, zs + 0.55], 1.2);
        plate(hx * 0.78 + r1 * 0.95, 0, r1 * 1.45, 1);
        M.at(-hx * 0.42, 0, zs + 0.72, () => load(0.42, 0.45));
        co(M, 'LUGGAGE RACK', 1, [-hx * 0.42, sy * 0.22, zs + 0.85], 1.5);
      });
      M.info.mass = [-hx - 0.35, -Wb / 2, 0, hx, Wb / 2, zs + 1.0];
      form = M.pick(['PROPELLER TRIKE', 'AEROCAR']); massKg = 300;
    } else {
      // motor sled: two skis, a rear track, a cowled front, long seat, rack
      const hx = L / 2, zs = 0.42;
      M.part('TRACK', () => {
        M.at(-hx * 0.35, 0, 0, () => K.track(M, { len: L * 0.55, r: 0.17, w: 0.4, pitch: 0.09 }));
        co(M, 'TRACK', 1, [-hx * 0.35, sy * 0.2, 0.2], 2.2);
      });
      M.part('SKI', () => {
        for (const s of [1, -1]) {
          const y = s * Wb * 0.42;
          const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([hx * 0.2 + t * hx * 0.8, t < 0.7 ? 0.02 : 0.02 + Math.pow((t - 0.7) / 0.3, 2) * 0.22]); }
          const prof = [...pts.map(([x, z]) => [x, z + 0.035]), ...pts.slice().reverse()];
          M.extrude(prof, y - 0.07, y + 0.07, { plane: 'xz', smoothDeg: 25 });
          M.tube([hx * 0.6, y, 0.05], [hx * 0.55, s * Wb * 0.25, zs + 0.05], 0.025, {});
          G.springStrut(M, [hx * 0.65, y, 0.06], [hx * 0.48, s * Wb * 0.22, zs + 0.2], 0.035);
        }
        co(M, 'SKI', 2, [hx * 0.7, sy * Wb * 0.42, 0.06], 2.2);
        co(M, 'SKI STRUT', 2, [hx * 0.56, sy * Wb * 0.35, zs * 0.5], 1.2);
      });
      M.part('COWLING', () => {
        const C = M.loft([[hx * 0.05, -Wb * 0.38, zs], [hx * 0.05, Wb * 0.38, zs], [hx * 0.05, Wb * 0.34, zs + 0.5], [hx * 0.05, -Wb * 0.34, zs + 0.5]],
          [[hx * 0.95, -Wb * 0.2, zs + 0.02], [hx * 0.95, Wb * 0.2, zs + 0.02], [hx * 0.95, Wb * 0.12, zs + 0.18], [hx * 0.95, -Wb * 0.12, zs + 0.18]], {});
        for (const nm of ['s1', 's3', 's1b', 's3b']) { const f = C.f(nm); if (f.on) { f.hatch(f.box, { angle: 90, gap: 3.4 - 1.6 * f.tone, w: 0 }); } }
        const tp = C.f('s2'); if (tp.on) { tp.line(0, -tp.h / 2, 0, tp.h / 2, { w: 1 }); K.louver(tp, [-tp.w * 0.3, -tp.h * 0.15, tp.w * 0.05, tp.h * 0.35]); }
        M.at(hx * 0.93, 0, zs + 0.12, () => K.lamp(M, { r: 0.06 }));
        M.at(hx * 0.12, 0, zs + 0.5, () => M.ry(-35, () => M.plate([[0, -0.32, 0], [0, 0.32, 0], [0, 0.25, 0.4], [0, -0.25, 0.4]])));
        M.pipe([[hx * 0.02, -0.38, zs + 0.72], [hx * 0.0, -0.3, zs + 0.62], [hx * 0.0, 0.3, zs + 0.62], [hx * 0.02, 0.38, zs + 0.72]], 0.016, { isect: false });
        co(M, 'ENGINE COWLING', 1, [hx * 0.5, sy * Wb * 0.3, zs + 0.25], 2);
        co(M, 'HEADLAMP', 1, [hx * 0.98, 0, zs + 0.12], 1.2);
        co(M, 'WINDSCREEN', 1, [hx * 0.08, sy * 0.15, zs + 0.75], 1.2);
      });
      M.part('SEAT', () => {
        const B = M.box([-hx * 0.95, -Wb * 0.38, zs - 0.15], [hx * 0.05, Wb * 0.38, zs], {});
        for (const k of ['+y', '-y']) { const f = B.f(k); if (f.on) { f.rivets(-f.w / 2 + 0.05, 0, f.w / 2 - 0.05, 0, { pitch: 8 }); K.stencil(f, desig, f.w * 0.25, 0, f.h * 0.5); } }
        M.box([-hx * 0.55, -0.22, zs], [hx * 0.0, 0.22, zs + 0.14], { chamfer: 0.05 });
        for (const s of [1, -1]) M.box([-hx * 0.3, s * Wb * 0.38, zs - 0.12], [hx * 0.05, s * (Wb * 0.38 + 0.12), zs - 0.1], { isect: false });
        M.at(-hx * 0.78, 0, zs, () => load(0.55, 0.6));
        plate(-hx * 0.96, 0, zs - 0.06, -1);
        K.pipeRun(M, [[hx * 0.1, -sy * Wb * 0.38, zs + 0.05], [-hx * 0.5, -sy * (Wb * 0.38 + 0.04), zs - 0.02], [-hx * 0.98, -sy * (Wb * 0.38 + 0.04), zs - 0.02]], 0.02, { flanges: false });
        co(M, 'SEAT', 1, [-hx * 0.3, sy * 0.15, zs + 0.14], 1.5);
        co(M, 'LUGGAGE RACK', 1, [-hx * 0.78, sy * 0.3, zs + 0.2], 1.7);
        co(M, 'FOOTBOARD', 2, [-hx * 0.1, sy * (Wb * 0.38 + 0.08), zs - 0.1], 0.8);
        co(M, 'NUMBER PLATE', 1, [-hx * 0.98, 0, zs - 0.06], 1.0);
      });
      M.info.mass = [-hx, -Wb / 2, 0, hx, Wb / 2, zs + 0.6];
      form = 'MOTOR SLED'; massKg = 260;
    }
    M.info.centers = centers;
    // the person stands at the far end, and is drawn here too so the fit counts them
    // (the fleet draws its scale figure on the same spot, the same lines)
    if (!figure) {
      const mb = M.info.mass;
      const xe = sx > 0 ? mb[0] - 0.55 : mb[3] + 0.55;
      figure = [xe, sy * 0.25];
    }
    M.part('PERSON', () => M.with({ at: [figure[0], figure[1], 0], rz: M.view.az + 90 }, () => M.line(PERSON, { w: 1, pass: 2 })));

    // ------------------------------------------------ vocabulary
    const where = (PLACES[place] || SNOW[place]);
    const what = { POST: 'letters and parcels', DOCTOR: 'the doctor and her bag', INSPECTOR: 'the line inspector', MESSENGER: 'urgent messages' }[job];
    const how = { mono: 'inside one wheel', bubble: 'on two wheels', trike: 'behind a propeller', sled: 'on skis' }[kind];
    let brief = `Takes ${what} to ${where} ${how}.`;
    if (brief.length > 78) brief = `Takes ${what} to ${where}.`;
    const jw = { POST: 'POST', DOCTOR: "DOCTOR'S", INSPECTOR: "INSPECTOR'S", MESSENGER: 'MESSENGER' }[job2];
    return {
      place, job: jw, form,
      designation: desig,
      brief,
      specs: [['MASS', `${massKg} KG`], ['SEATS', String(kind === 'bubble' ? seats : 1)], ['SPEED', `${speed} KM/H`], ['POWER', `${Math.round(massKg / 30)} KW`]],
      figure,
    };
  },
};

// the outline of the fleet's scale figure (kit.js figure), in its own frame
const OUT = [[0.0, 1.75], [0.07, 1.735], [0.105, 1.68], [0.105, 1.6], [0.075, 1.53], [0.06, 1.5], [0.2, 1.46], [0.24, 1.38], [0.26, 1.05],
  [0.27, 0.86], [0.22, 0.86], [0.205, 1.02], [0.19, 1.25], [0.17, 0.95], [0.16, 0.5], [0.15, 0.06], [0.2, 0.0], [0.04, 0.0],
  [0.04, 0.07], [0.02, 0.78], [0, 0.82]];
const PERSON = (() => { const f = [...OUT, ...OUT.slice(1, -1).reverse().map(([x, y]) => [-x, y])].map(([x, y]) => [x, 0, y]); f.push(f[0]); return f; })();

function co(M, label, qty, p, prio) {
  const w = M.W(p), e = M.view.e, k = (M.px || 0) * 4;
  M.world(() => M.callout(label, qty, [w[0] + e[0] * k, w[1] + e[1] * k, w[2] + e[2] * k], prio));
}
