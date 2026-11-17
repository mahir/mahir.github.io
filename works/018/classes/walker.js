// classes/walker.js: a legged vehicle. Four, six or eight jointed legs (hip bracket and
// swivel, thigh beam, knee pin with collar, a hydraulic ram to a lever above the knee,
// a telescopic shin, ankle ball, broad foot flat on the ground) on a hip frame carrying a
// cabin: a drum, a box, a sphere in a ring or a glazed pod. Equipment by job: boarding
// ladder, lamps, cargo slung under on a winch, a dish, a crane arm with a grapple, a
// railed deck.

import * as G from './parts-ground.js';
import { word } from '../words.js';

const { K, D2R, clamp, add, sub, mul, norm, cross, lerp, len } = G;

const PLACES = {
  MARSH: 'the marsh', 'TIDAL FLAT': 'the tidal flats', FOREST: 'the forest', MOUNTAIN: 'the mountain',
  BOG: 'the bog', TAIGA: 'the taiga', 'RAIN FOREST': 'the rain forest', DELTA: 'the delta', SCREE: 'the scree slopes', JUNGLE: 'the jungle', DUNE: 'the dunes',
};

export default {
  id: 'walker',
  family: 'ground',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const cabin = M.wpick([[2, 'drum'], [2, 'box'], [1.5, 'sphere'], [1.5, 'pod']]);
    const nLeg = M.wpick([[2.5, 4], [3, 6], [1.5, 8]]);
    const frameKind = nLeg === 4 ? M.pick(['rect', 'ring']) : M.wpick([[2, 'rect'], [1, 'ring']]);
    const style = M.wpick([[3, 'insect'], [2, 'strider']]);
    const job = M.wpick([[2, 'SURVEY'], [1.6, 'FORESTRY'], [1.6, 'TENDER'], [1.6, 'RESCUE'], [1.2, 'SUPPLY']]);
    const place0 = M.pick(Object.keys(PLACES));
    const S = M.r(0.85, 1.25);                 // overall size factor
    const zh0 = M.r(3.2, 4.6);
    const reachK = M.r(0.9, 1.35);
    const kneeUp = M.r(0.9, 2.2);
    const footKind = M.pick(['pad', 'pad', 'toes']);
    const thighKind = M.pick(['box', 'truss']);
    const sv = M.pick([1, -1]);
    const az = sv * M.r(34, 52) + (M.chance(0.2) ? 180 : 0);
    const el = M.r(26, 34);
    const winKind = M.wpick([[3, 'xWindow'], [2, 'octPort'], [1, 'porthole']]);
    const cellSeed = Array.from({ length: 32 }, () => M.rng());
    const crew = M.ri(2, 5);
    const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
    const desig = M.chance(0.5) ? `${M.pick(LET.split(''))}${M.pick(LET.split(''))}-${M.ri(1, 9)}${M.ri(0, 9)}` : `MK ${['II', 'III', 'IV', 'V', 'VI'][M.ri(0, 4)]}`;
    const deckOn = M.chance(0.5);
    const dishOn = M.chance(0.45);
    const lampsOn = M.chance(0.65);
    const craneYaw = M.r(-50, 50), craneRise = M.r(25, 45);
    const slungKind = M.pick(['crates', 'drums', 'net']);
    const extras = M.shuffle(['dish', 'deck', 'lamps']);
    void extras;

    M.setView(az, el);
    const e = M.view.e;
    const sy = e[1] >= 0 ? 1 : -1, sx = e[0] >= 0 ? 1 : -1;

    // job decides some equipment
    const slung = job === 'TENDER' || job === 'SUPPLY' || (job === 'FORESTRY' && M.chance(0.5));
    const crane = job === 'FORESTRY';
    const lamps = lampsOn || job === 'RESCUE';
    const dish = (dishOn || job === 'SURVEY') && !crane;
    const deck = deckOn && (cabin === 'drum' || cabin === 'box');
    const place = job === 'TENDER' ? 'TIDAL FLAT' : job === 'FORESTRY' ? M.pick(['TAIGA', 'JUNGLE', 'RAIN FOREST']) : job === 'RESCUE' ? M.pick(['MOUNTAIN', 'SCREE', 'MOUNTAIN']) : place0;

    // ------------------------------------------------ sizes
    const Lf = (nLeg === 4 ? 4.6 : nLeg === 6 ? 7 : 9) * S;
    const Wf = 3.6 * S;
    const Rf = (nLeg === 4 ? 2.8 : nLeg === 6 ? 3.4 : 4.0) * S;
    const zh = zh0 * S;            // hip height
    const reach = 3.2 * S * reachK;
    const fh = 0.28 * S;           // frame half height
    const legR = 0.13 * S;
    const centers = [];

    // hips and foot directions
    const legs = [];
    if (frameKind === 'rect') {
      const n = nLeg / 2;
      for (const s of [1, -1]) for (let i = 0; i < n; i++) {
        const x = n === 1 ? 0 : -Lf / 2 + Lf * i / (n - 1);
        const splay = n === 1 ? 0 : (i / (n - 1) - 0.5) * 0.9;
        const d = norm([splay, s, 0]);
        legs.push({ hip: [x, s * Wf / 2, zh], d, s });
      }
    } else {
      for (let i = 0; i < nLeg; i++) {
        const a = (i + 0.5) * 2 * Math.PI / nLeg + Math.PI / nLeg * (nLeg === 4 ? 0 : 0);
        const d = [Math.cos(a), Math.sin(a), 0];
        legs.push({ hip: [d[0] * Rf, d[1] * Rf, zh], d, s: Math.sign(d[1]) || 1 });
      }
    }

    // ------------------------------------------------ frame
    let frameTop = zh + fh;
    M.part('HIP FRAME', () => {
      if (frameKind === 'rect') {
        const F = M.box([-Lf / 2 - 0.5 * S, -Wf / 2, zh - fh], [Lf / 2 + 0.5 * S, Wf / 2, zh + fh], { chamfer: 0.4 * S });
        for (const k of ['+y', '-y', '+x', '-x', 'c0', 'c1', 'c2', 'c3']) {
          const f = F.f(k); if (!f.on) continue;
          const n = Math.max(1, Math.round(f.w / 1.2));
          f.grid(n, 1, { gap: 2.4 }).forEach((r, i) => (cellSeed[i % 32] < 0.25 ? K.louver(f, r) : K.plain(f, r)));
        }
        co(M, 'HIP FRAME', 1, [0, sy * Wf / 2, zh], 1.6);
      } else {
        const F = M.cyl(Rf + 0.3 * S, zh - fh, zh + fh);
        if (M.decorOn) { const L = F.lat; for (let i = 0; i < 36; i++) L.meridian(i * 10, 0, 1, { w: 0 }); L.ring(0.5, { w: 1 }); L.shade({ gap: 1.8 }); }
        if (F.top.on) { F.top.circle(0, 0, Rf * 0.85, { w: 1 }); for (let i = 0; i < nLeg; i++) { const a = (i + 0.5) * 2 * Math.PI / nLeg; F.top.line(Math.cos(a) * Rf * 0.3, Math.sin(a) * Rf * 0.3, Math.cos(a) * Rf * 0.85, Math.sin(a) * Rf * 0.85, { w: 1 }); } }
        co(M, 'HIP RING', 1, [0, sy * (Rf + 0.3 * S), zh], 1.6);
      }
    });

    // ------------------------------------------------ legs
    let footAnchor = null;
    M.part('LEG', () => {
      legs.forEach((lg, i) => {
        const { hip, d } = lg;
        const n = norm(cross(d, [0, 0, 1]));     // pin axis (horizontal, across the leg plane)
        const H = add(hip, mul(d, 0.35 * S));     // the hip pin, just outside the frame
        const F = [hip[0] + d[0] * reach, hip[1] + d[1] * reach, 0];
        const fz = (footKind === 'pad' ? 0.55 : 0.5) * S;
        const A = [F[0], F[1], fz];                 // ankle
        let Kn;
        if (style === 'insect') Kn = add(add(H, mul(d, reach * 0.42)), [0, 0, kneeUp * S]);
        else Kn = add(add(H, mul(d, reach * 0.82)), [0, 0, kneeUp * S * 0.25]);
        // hip bracket and swivel
        M.with({ at: hip, rz: Math.atan2(d[1], d[0]) / D2R }, () => {
          M.box([-0.1 * S, -0.42 * S, -fh * 1.4], [0.55 * S, 0.42 * S, fh * 1.4]);
          M.cyl(0.3 * S, -fh * 1.6, fh * 1.6, { isect: false });
        });
        const pin = (p, r, w) => M.at(p[0], p[1], p[2], () => M.with({ rz: Math.atan2(n[1], n[0]) / D2R }, () => M.ry(90, () => M.cyl(r, -w, w, { isect: false }))));
        pin(H, legR * 1.5, legR * 2.6);
        // thigh
        if (thighKind === 'box') {
          M.along(H, Kn, (L) => {
            const w0 = legR * 2.2, w1 = legR * 1.5, h0 = legR * 2.6, h1 = legR * 1.8;
            const T = M.loft([[0, -w0, -h0], [0, w0, -h0], [0, w0, h0], [0, -w0, h0]], [[L, -w1, -h1], [L, w1, -h1], [L, w1, h1], [L, -w1, h1]], {});
            for (const nm of ['s0', 's1', 's2', 's3']) {
              const f = T.f(nm); if (!f.on) continue;
              if (nm === 's1' || nm === 's3') {
                const nh = Math.max(1, Math.floor(f.w / (h0 * 2.6)));
                for (let q = 0; q < nh; q++) { const x = -f.w / 2 + f.w * (q + 0.5) / nh; f.circle(x, 0, f.h * 0.22, { w: 1 }); }
                f.rivets(-f.w / 2 + f.mOf(4), f.h * 0.38, f.w / 2 - f.mOf(4), f.h * 0.38, { pitch: 8 });
                f.rivets(-f.w / 2 + f.mOf(4), -f.h * 0.38, f.w / 2 - f.mOf(4), -f.h * 0.38, { pitch: 8 });
              }
              if (f.tone > 0.35) f.hatch(f.box, { angle: 90, gap: 3.6 - 2 * f.tone, w: 0 });
            }
            return T;
          }, [0, 0, 1]);
        } else {
          for (const o of [-1, 1]) K.strut(M, add(H, mul(n, o * legR * 1.4)), add(Kn, mul(n, o * legR * 1.1)), legR * 0.75, {});
          const nb = 3;
          for (let q = 0; q < nb; q++) { const a = lerp(H, Kn, (q + 0.3) / nb), b = lerp(H, Kn, (q + 0.8) / nb); M.tube(add(a, mul(n, legR * 1.4)), add(b, mul(n, -legR * 1.25)), legR * 0.35, { isect: false }); }
        }
        // knee
        pin(Kn, legR * 1.6, legR * 2.3);
        const u = norm(sub(Kn, A));                  // shin direction, ankle -> knee
        const horn = add(Kn, mul(u, 0.65 * S));
        M.tube(Kn, horn, legR * 1.05, {});
        pin(horn, legR * 0.8, legR * 1.6);
        // shin: outer sleeve and inner rod (telescopic)
        const mid = lerp(Kn, A, 0.5);
        M.tube(Kn, mid, legR * 1.15, {});
        K.collar(M, Kn, A, 0.5, legR * 1.15, { len: legR * 1.2, k: 1.25 });
        M.tube(mid, A, legR * 0.8, {});
        K.ball(M, A, legR * 1.25);
        // knee ram: from a lug on the thigh near the hip to the horn
        const lug = add(lerp(H, Kn, 0.22), [0, 0, legR * 2.4]);
        M.tube(lerp(H, Kn, 0.22), lug, legR * 0.5, { isect: false });
        const rm = lerp(lug, horn, 0.58);
        M.tube(lug, rm, legR * 0.7, {});
        M.tube(lerp(lug, horn, 0.5), horn, legR * 0.38, { isect: false });
        K.collar(M, lug, horn, 0.55, legR * 0.7, { len: legR * 0.9, k: 1.3 });
        // hip ram: from under the frame to the thigh
        const hb = [hip[0] - d[0] * 0.2 * S, hip[1] - d[1] * 0.2 * S, zh - fh - 0.05];
        const ht = lerp(H, Kn, 0.35);
        if (style === 'insect') { M.tube(hb, lerp(hb, ht, 0.55), legR * 0.6, {}); M.tube(lerp(hb, ht, 0.5), ht, legR * 0.35, { isect: false }); }
        // foot
        M.at(F[0], F[1], 0, () => {
          if (footKind === 'pad') K.footpad(M, { r: 0.75 * S });
          else M.rz(Math.atan2(d[1], d[0]) / D2R, () => {
            M.box([-0.55 * S, -0.4 * S, 0], [0.55 * S, 0.4 * S, 0.18 * S]);
            for (const a of [-35, 0, 35]) M.rz(a, () => M.loft([[0.4 * S, -0.12 * S, 0], [0.4 * S, 0.12 * S, 0], [0.4 * S, 0.12 * S, 0.16 * S], [0.4 * S, -0.12 * S, 0.16 * S]], [[1.05 * S, -0.06 * S, 0], [1.05 * S, 0.06 * S, 0], [1.05 * S, 0.06 * S, 0.05 * S], [1.05 * S, -0.06 * S, 0.05 * S]], { isect: false }));
            M.cyl(0.18 * S, 0.18 * S, fz, { isect: false });
          });
        });
        centers.push([[hip[0], hip[1], zh + 0.8], [hip[0], hip[1], zh - 1.2]]);
        if (lg.s === sy || frameKind === 'ring') {
          const ne = (p, k) => add(p, mul(e, legR * k));
          co(M, 'LEG', nLeg, ne(lerp(Kn, A, 0.3), 1.3), 2.8);
          co(M, 'KNEE RAM', nLeg, ne(lerp(lug, horn, 0.4), 0.9), 2.0);
          co(M, 'KNEE JOINT', nLeg, ne(Kn, 2.4), 1.6);
          co(M, 'HIP JOINT', nLeg, ne(H, 2.6), 1.4);
          co(M, footKind === 'pad' ? 'FOOTPAD' : 'FOOT', nLeg, [F[0], F[1], 0.25 * S], 2.2);
          co(M, 'TELESCOPIC SHIN', nLeg, ne(lerp(Kn, A, 0.65), 1.0), 1.2);
          if (!footAnchor || dotE(F, e) > dotE(footAnchor, e)) footAnchor = F;
        }
      });
    });

    // ------------------------------------------------ cabin
    let zTop = frameTop, cabR = 0, roofPts = [];
    const zc0 = frameTop;
    let doorSpot = null;
    M.part('CABIN', () => {
      if (cabin === 'drum') {
        const r = (frameKind === 'ring' ? Rf * 0.92 : Math.min(Wf, Lf) * 0.48) * 0.95, h = 2.6 * S;
        cabR = r;
        const D = M.cyl(r, zc0, zc0 + h);
        const Rf2 = M.at(0, 0, zc0 + h, () => M.lathe([[r * 1.06, 0], [r * 1.06, 0.12 * S], [r * 0.25, 0.6 * S], [r * 0.25, 0.75 * S]], { sharpDeg: 20 }));
        if (M.decorOn) {
          const L = D.lat;
          const n = Math.max(12, Math.round(2 * Math.PI * r / (0.9 * S)));
          for (let i = 0; i < n; i++) L.meridian(i * 360 / n, 0, 1, { w: 0 });
          L.ring(0.32, { w: 1 }); L.ring(0.82, { w: 1 });
          L.shade({ gap: 1.8, gapMax: 5 });
          const nw = Math.round(n / 2);
          for (let i = 0; i < nw; i++) {
            const a = (i + 0.5) * 360 / nw;
            const ww = 2 * Math.PI * r / nw * 0.55, wh = h * 0.3;
            L.shape(a, 0.57, [[-ww / 2, -wh / 2], [ww / 2, -wh / 2], [ww / 2, wh / 2], [-ww / 2, wh / 2]], { closed: true, w: 1 });
            const da = ww * 0.42 / r / D2R;
            L.hatch(a - da, a + da, 0.57 - wh * 0.4 / h, 0.57 + wh * 0.4 / h, { gap: 1.1 });
          }
          L.text(desig, Math.atan2(e[1], e[0]) / D2R, 0.18, h * 0.12);
          const RL = Rf2.lat; RL.shade({ t0: 0.2, t1: 0.95, gap: 1.8 }); for (let i = 0; i < 16; i++) RL.meridian(i * 22.5, 0.2, 0.9, { w: 0 });
        }
        zTop = zc0 + h + 0.12 * S;
        roofPts = [[0, 0, zc0 + h + 0.75 * S]];
        doorSpot = { a: Math.atan2(e[1], e[0]), r, z: zc0 };
        co(M, 'CABIN', 1, [Math.cos(doorSpot.a + 0.6) * r, Math.sin(doorSpot.a + 0.6) * r, zc0 + h * 0.57], 2.4);
      } else if (cabin === 'box') {
        const cl = (frameKind === 'ring' ? Rf * 1.6 : Lf * 0.9 + 1.0), cw = (frameKind === 'ring' ? Rf * 1.6 : Wf + 0.4), h = 2.5 * S;
        cabR = Math.max(cl, cw) / 2;
        const B = M.box([-cl / 2, -cw / 2, zc0], [cl / 2, cw / 2, zc0 + h], { chamfer: 0.35 * S });
        for (const k of ['+x', '-x', '+y', '-y']) G.skin(B.f(k), { cell: 1.2 * S, rows: 2, kind: (r, n, m) => (r.j === 1 ? (r.i % 2 === 0 || n < 3 ? winKind : 'corrugated') : k === (sy > 0 ? '+y' : '-y') && r.i === 0 ? ['stencil', desig] : cellSeed[(r.i * 3 + r.j) % 32] < 0.15 ? 'louver' : 'corrugated') });
        for (const k of ['c0', 'c1', 'c2', 'c3']) G.skin(B.f(k), { cell: 1, rows: 2, kind: (r) => (r.j === 1 ? 'porthole' : 'corrugated') });
        const tp = B.f('+z'); if (tp.on) for (const r of tp.grid(3, 2)) if (tp.holds(r)) K.plain(tp, r, { shade: false });
        zTop = zc0 + h;
        doorSpot = { face: B.f(sy > 0 ? '+y' : '-y'), cw };
        co(M, 'CABIN', 1, [cl * 0.25, sy * cw / 2, zc0 + h * 0.3], 2.4);
      } else if (cabin === 'sphere') {
        const r = 1.7 * S * (frameKind === 'ring' ? 1.15 : 1);
        cabR = r;
        const zc = zc0 + 0.6 * S + r * 0.85;
        // the ring and its struts
        M.at(0, 0, zc - r * 0.35, () => M.torus(r * 0.95, 0.12 * S));
        for (let i = 0; i < 6; i++) { const a = (i + 0.5) * Math.PI / 3; M.tube([Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, zc - r * 0.35], [Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0 * (frameKind === 'rect' ? Math.min(1, (Wf / 2) / r) : 1), zc0], 0.08 * S, {}); }
        const Sp = M.at(0, 0, zc, () => M.sphere(r));
        if (M.decorOn) {
          const L = Sp.lat;
          for (const t of [0.35, 0.68]) L.ring(t, { w: 1 });
          for (let i = 0; i < 16; i++) L.meridian(i * 22.5, 0.08, 0.92, { w: 0 });
          L.shade({ t0: 0.05, t1: 0.95, gap: 1.8, gapMax: 5 });
          // the glazed band toward the front
          const a0 = Math.atan2(e[1], e[0]) / D2R;
          for (let k = -2; k <= 2; k++) {
            const a = a0 + k * 28 - 20;
            L.shape(a, 0.56, [[-0.42 * S, -0.3 * S], [0.42 * S, -0.3 * S], [0.42 * S, 0.3 * S], [-0.42 * S, 0.3 * S]], { closed: true, w: 1 });
            L.hatch(a - 10, a + 10, 0.52, 0.6, { gap: 1.0 });
          }
          L.text(desig, a0 + 70, 0.42, r * 0.12);
        }
        zTop = zc + r;
        roofPts = [[0, 0, zc + r]];
        doorSpot = { sphere: true, zc, r };
        co(M, 'PRESSURE SPHERE', 1, [0, sy * r * 0.7, zc + r * 0.5], 2.4);
        co(M, 'SUPPORT RING', 1, [0, sy * r * 0.95, zc - r * 0.35], 1.4);
      } else {
        const pl = Math.min(7.2 * S, frameKind === 'ring' ? Rf * 2.1 : Lf * 0.9 + 1.4), pw = Math.min(pl * 0.75, frameKind === 'ring' ? Rf * 1.7 : Wf + 0.5), ph = 3.1 * S;
        cabR = pl / 2;
        const zc = zc0 + ph * 0.5;
        const P = M.at(0, 0, zc, () => M.scale(pl / 2, pw / 2, ph / 2, () => M.sphere(1, { rings: 14 })));
        if (M.decorOn) {
          const L = P.lat;
          for (const t of [0.3, 0.5, 0.7]) L.ring(t, { w: 1 });
          for (let i = 0; i < 12; i++) L.meridian(i * 30, 0.1, 0.9, { w: 0 });
          // glazed nose toward +x: panes between meridians -50..50 in the upper half
          for (const a of [-45, -15, 15, 45]) L.meridian(a, 0.5, 0.86, { w: 1 });
          for (const [a0, a1] of [[-43, -17], [-13, 13], [17, 43]]) L.hatch(a0, a1, 0.52, 0.84, { gap: 1.0 });
          L.shade({ t0: 0.08, t1: 0.92, gap: 1.8, gapMax: 5 });
          L.text(desig, sy > 0 ? 110 : 250, 0.42, ph * 0.1);
        }
        // a keel plate onto the frame
        M.box([-pl * 0.3, -pw * 0.2, zc0 - 0.05], [pl * 0.3, pw * 0.2, zc0 + ph * 0.2]);
        zTop = zc + ph / 2;
        roofPts = [[0, 0, zTop]];
        doorSpot = { pod: true, zc, pw, ph };
        co(M, 'GLAZED POD', 1, [pl * 0.35, 0, zc + ph * 0.3], 2.4);
      }
    });

    // ------------------------------------------------ boarding ladder and door
    M.part('BOARDING LADDER', () => {
      let top, outward;
      if (doorSpot.face) {
        const f = doorSpot.face;
        const dw = 0.9, dh = 1.9 * Math.min(1, S);
        const x = f.w * 0.15;
        K.door(M, f, x, -f.h / 2 + dh / 2 + 0.1, dw, dh, {});
        top = f.P(x, -f.h / 2 + 0.05); outward = f.n;
        co(M, 'CABIN DOOR', 1, f.P(x, -f.h / 2 + dh / 2 + 0.1), 1.5);
      } else if (doorSpot.r && !doorSpot.sphere) {
        const a = doorSpot.a + 0.35;
        top = [Math.cos(a) * doorSpot.r, Math.sin(a) * doorSpot.r, doorSpot.z]; outward = [Math.cos(a), Math.sin(a), 0];
      } else if (doorSpot.sphere) {
        top = [0, sy * doorSpot.r * 0.6, zc0 + 0.6 * S]; outward = [0, sy, 0];
      } else {
        top = [0, sy * doorSpot.pw * 0.45, zc0 + 0.1]; outward = [0, sy, 0];
      }
      // the ladder hangs from a platform at the door down to just above the ground
      const o = norm([outward[0], outward[1], 0]);
      const plat = add(top, mul(o, 0.6 * S));
      M.with({ at: [top[0], top[1], top[2]], rz: Math.atan2(o[1], o[0]) / D2R }, () => K.platform(M, { depth: 1.1 * S, width: 1.3 * S, stayH: 1.6 * S, drop: 0.2, inset: 0.3 }));
      const lb = add(top, mul(o, 1.2 * S));
      M.with({ at: [lb[0], lb[1], 0.6], rz: Math.atan2(o[1], o[0]) / D2R }, () => K.ladder(M, { h: top[2] - 0.6 + 0.9, w: 0.5 }));
      co(M, 'BOARDING LADDER', 1, [lb[0], lb[1], top[2] * 0.5], 1.9);
      void plat;
    });

    // ------------------------------------------------ equipment on top
    if (deck) {
      M.part('RAILED DECK', () => {
        const rr = Math.min(cabR, 3.2 * S) * 0.85;
        const pts = [];
        if (cabin === 'box') {
          const tp = [[rr, rr * 0.7], [-rr, rr * 0.7], [-rr, -rr * 0.7], [rr, -rr * 0.7], [rr, rr * 0.7]];
          for (const p of tp) pts.push([p[0], p[1], zTop]);
        } else {
          for (let i = 0; i <= 24; i++) { const a = 2 * Math.PI * i / 24; pts.push([Math.cos(a) * rr, Math.sin(a) * rr, zTop]); }
          M.at(0, 0, zTop - 0.1, () => M.cyl(rr + 0.1, 0, 0.1));
        }
        K.railing(M, pts, { h: 0.95, posts: 1.2 });
        co(M, 'RAILED DECK', 1, [rr * 0.5, sy * rr * 0.8, zTop + 0.95], 1.3);
      });
    }
    if (dish) {
      M.part('DISH ANTENNA', () => {
        const p = cabin === 'box' ? [-cabR * 0.45, -sy * 0.4, zTop] : [0, 0, roofPts[0][2]];
        M.at(p[0], p[1], p[2] - 0.02, () => K.dishMount(M, { r: 0.75 * S, el: 40, az: 150 }));
        co(M, 'DISH ANTENNA', 1, [p[0], p[1], p[2] + 1.0 * S], 2);
      });
    }
    if (lamps) {
      M.part('SEARCHLIGHT', () => {
        const n = 2;
        for (let i = 0; i < n; i++) {
          const a = Math.atan2(e[1], e[0]) + (i ? 0.9 : -0.9);
          const rr = cabin === 'box' ? cabR * 0.7 : cabR * 0.6;
          const p = cabin === 'box' ? [sx * cabR * 0.65, (i ? 1 : -1) * cabR * 0.3, zTop] : [Math.cos(a) * rr * 0.5, Math.sin(a) * rr * 0.5, cabin === 'drum' ? zTop + 0.25 * S : zTop - 0.25 * S];
          M.at(p[0], p[1], p[2], () => M.rz(Math.atan2(e[1], e[0]) / D2R + (i ? 25 : -25), () => K.searchlight(M, { r: 0.24 * S })));
          co(M, 'SEARCHLIGHT', n, [p[0], p[1], p[2] + 0.4 * S], 1.5);
        }
      });
    }
    if (crane) {
      M.part('CRANE ARM', () => {
        const p = cabin === 'box' ? [cabR * 0.5, sy * 0.3, zTop] : [0, 0, zTop - 0.1];
        const res = M.at(p[0], p[1], p[2], () => M.rz(craneYaw, () => K.crane(M, { len: 5.5 * S, rise: craneRise, r: 0.42 * S })));
        // a log grapple under the hook: two curved tines
        co(M, 'CRANE ARM', 1, [p[0], p[1], p[2] + 1.2 * S], 2.2);
        void res;
      });
    }
    if (slung) {
      M.part('SLUNG CARGO', () => {
        const zb = zh - fh;
        M.at(0, 0, zb, () => M.ry(0, () => M.rx(90, () => M.cyl(0.25 * S, -0.6 * S, 0.6 * S, { isect: false }))));
        const zc = Math.max(0.9, zb * 0.35);
        const cw = Math.min(Wf, 2.6 * S) * 0.8, cl = (frameKind === 'rect' ? Lf * 0.55 : Rf) * 0.8;
        M.at(0, 0, zc, () => {
          if (job === 'FORESTRY') {
            for (let k = 0; k < 5; k++) { const y = (k - 2) * 0.32 * S; const z = (k % 2) * 0.28 * S; M.at(0, y, 0.18 * S + z, () => M.cyl(0.17 * S, -cl / 2 - 0.4, cl / 2 + 0.4, { axis: 'x', isect: false })); }
          } else if (slungKind === 'drums') {
            for (let k = 0; k < 4; k++) M.at((k % 2 - 0.5) * 0.75 * S, (Math.floor(k / 2) - 0.5) * 0.75 * S, 0, () => { const C = M.cyl(0.3 * S, 0, 0.9 * S); if (M.decorOn) { C.lat.ring(0.33, { w: 1 }); C.lat.ring(0.66, { w: 1 }); C.lat.shade({ gap: 1.8 }); } });
            M.box([-0.8 * S, -0.8 * S, -0.08], [0.8 * S, 0.8 * S, 0]);
          } else K.crate(M, { s: [cl, cw, 1.1 * S] });
        });
        const top = zc + (job === 'FORESTRY' ? 0.8 * S : slungKind === 'drums' ? 0.9 * S : 1.1 * S);
        for (const [x, y] of [[-cl / 2, -cw / 2], [cl / 2, -cw / 2], [cl / 2, cw / 2], [-cl / 2, cw / 2]]) M.line([[x * 0.6, y * 0.6, top], [0, 0, zb - 0.25 * S]], { w: 1, pass: 1 });
        co(M, 'CARGO WINCH', 1, [0, sy * 0.3 * S, zb - 0.1], 1.4);
        co(M, job === 'FORESTRY' ? 'LOG BUNDLE' : slungKind === 'drums' ? 'OIL DRUM' : 'STORES CRATE', job === 'FORESTRY' ? 5 : slungKind === 'drums' ? 4 : 1, [0, sy * cw / 2, zc + 0.5], 1.8);
      });
    }
    M.part('WHIP ANTENNA', () => {
      const p = cabin === 'box' ? [-cabR * 0.7, sy * 0.5, zTop] : [roofPts[0][0] - 0.3, roofPts[0][1] + sy * 0.3, roofPts[0][2] - 0.3];
      M.at(p[0], p[1], p[2], () => K.whip(M, { h: 3 * S, lean: 10 }));
    });

    M.info.centers = centers;
    // the construction box: the cabin and frame
    const cb = cabin === 'sphere' ? cabR : cabR;
    M.info.mass = [-Math.max(cb, Lf / 2), -Math.max(cb, Wf / 2), zh - fh, Math.max(cb, Lf / 2), Math.max(cb, Wf / 2), zTop];

    // ------------------------------------------------ vocabulary
    const where = PLACES[place];
    const legW = word(nLeg);
    const briefs = {
      SURVEY: `Walks ${word(crew)} surveyors across ${where} where wheels would sink.`,
      FORESTRY: slung ? `Steps over fallen trees and lifts logs out of ${where}.` : `Steps over fallen trees and loads logs in ${where}.`,
      TENDER: `Carries oil and stores to lighthouses across the tidal flats.`,
      RESCUE: `Climbs ${where} on ${legW} legs to reach stranded climbers.`,
      SUPPLY: `Carries stores slung under its frame across ${where}.`,
    };
    let brief = briefs[job];
    if (brief.length > 78) brief = brief.replace(/ (across|in|out of) the [a-z ]+/, '').slice(0, 78);
    const form = M.pick(['WALKER', 'WALKER', nLeg === 4 ? 'STRIDER' : 'LEGGED CARRIER'].filter((f) => (place + job + f).length < 32));
    const tons = Math.round((nLeg * 2.2 + cabR * 6) * S * S);
    return {
      place, job, form,
      designation: desig,
      brief,
      specs: [['MASS', `${tons} T`], ['LEGS', String(nLeg)], ['CREW', String(crew)], ['STRIDE', `${(reach * 1.3).toFixed(1)} M`]],
      figure: footAnchor ? [footAnchor[0] + sx * 1.8, footAnchor[1] + sy * 1.2] : null,
    };
  },
};

function dotE(p, e) { return p[0] * e[0] + p[1] * e[1]; }

function co(M, label, qty, p, prio) {
  const w = M.W(p), e = M.view.e, k = (M.px || 0) * 4;
  M.world(() => M.callout(label, qty, [w[0] + e[0] * k, w[1] + e[1] * k, w[2] + e[2] * k], prio));
}
