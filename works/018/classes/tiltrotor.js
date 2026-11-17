// classes/tiltrotor.js: a transport on tilting rotors. Three forms: a high-wing fuselage
// with two or four tilting nacelles, a flying boat hull with wing floats on the water, and
// a twin-boom freighter with a cargo pod. Fuselage built from rounded sections (cabin
// extrusion, nose and tail lofts); glazed nose, windows, doors, a cargo ramp. Equipment
// from a pool: radome, ramp down with a small vehicle on it, belly hook with a load,
// fire tank with scoops, rescue hoist, side radar, air stairs, antenna wires.

import * as A from './parts-air.js';
import { K, D2R, lerp } from './parts-air.js';
import { word, thou } from '../words.js';

const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';

// rounded-rectangle section in the plane x = const: 12 points, CCW seen from +x
function sec(x, W, H, zb, k = 0.32) {
  const rc = Math.min(W, H) * k;
  const cs = [[W / 2 - rc, zb + rc, -90], [W / 2 - rc, zb + H - rc, 0], [-W / 2 + rc, zb + H - rc, 90], [-W / 2 + rc, zb + rc, 180]];
  const out = [];
  for (const [cy, cz, a0] of cs) for (let i = 0; i < 3; i++) { const a = (a0 + 45 * i) * D2R; out.push([x, cy + Math.cos(a) * rc, cz + Math.sin(a) * rc]); }
  return out;
}
const prof2 = (s) => s.map((p) => [p[1], p[2]]);
// face index of each part of the section: right side 2, top 5, left side 8, bottom 11
const SIDE_R = 2, TOP = 5, SIDE_L = 8, BOT = 11;

export default {
  id: 'tiltrotor',
  family: 'air',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const form = M.wpick([[4, 'tilt'], [2, 'boat'], [2, 'boom']]);
    const L = M.r(14, 21);                           // fuselage length
    const W = M.r(2.4, 3.2), H = W * M.r(1.0, 1.15);
    const quad = form === 'tilt' && M.chance(0.3);
    const Rr = L * (quad ? M.r(0.14, 0.17) : M.r(0.21, 0.26));
    const tilt = M.wpick([[3, 90], [2, M.r(60, 82)], [1, M.r(15, 35)]]);
    const blades = M.pick([3, 3, 4]);
    const wr = M.r(0.4, 0.55);
    const zb = form === 'boat' ? 0.0 : wr + M.r(0.45, 0.75);
    const c = L * M.r(0.15, 0.19);                    // wing chord
    const xw = L * M.r(-0.02, 0.08);                  // wing leading edge offset from center
    const tailKind = form === 'boom' ? 'twin' : M.pick(['T', 'cross', 'H']);
    const pool = [[2, 'radome'], [3, 'ramp'], [2, 'hook'], [2, 'tank'], [2, 'hoist'], [1.5, 'slar'], [2, 'stairs'], [2, 'wires']];
    const eq = new Set();
    const nEq = M.ri(2, 4);
    for (let k = 0; k < 14 && eq.size < nEq; k++) eq.add(M.wpick(pool));
    if (form === 'boat') { eq.delete('ramp'); eq.delete('stairs'); eq.delete('hook'); }
    const carKind = M.pick(['car', 'jeep', 'cart']);
    const nWin = M.ri(6, 10);
    const az = M.pick([1, -1]) * M.r(42, 58) + M.pick([0, 0, 180]);
    const el = M.r(24, 32);
    const reg = `${LET[M.ri(0, 22)]}${LET[M.ri(0, 22)]}-${LET[M.ri(0, 22)]}${LET[M.ri(0, 22)]}${LET[M.ri(0, 22)]}`;
    const place = M.pick(['ISLAND', 'COASTAL', 'ARCTIC', 'FJORD', 'DESERT', 'LAKE', 'MOUNTAIN', 'ARCHIPELAGO']);
    const kwEach = Math.round(M.r(900, 2400) / 50) * 50;
    const rangeK = Math.round(M.r(6, 18)) * 100;
    const phases = [M.r(0, 120), M.r(0, 120), M.r(0, 120), M.r(0, 120)];
    M.setView(az, el);
    const e = M.view.e;
    const sideS = e[1] >= 0 ? 1 : -1;
    const seenS = (n) => n[0] * e[0] + n[1] * e[1] + n[2] * e[2] > 0;

    // ------------------------------------------------ fuselage
    const Lc = form === 'boom' ? L * 0.42 : L * 0.5;   // parallel cabin
    const xb = Lc / 2, xa = -Lc / 2 + (form === 'boom' ? 0 : -L * 0.05);
    const Ln = L * 0.2, Lt = form === 'boom' ? L * 0.12 : L - Lc - Ln + L * 0.05;
    const zTop = zb + H;
    let cabin, noseA;
    const quadP = (P, i, u, v) => { // bilinear point on loft face i: u across, v along
      const a = lerp(P.A[i], P.A[(i + 1) % 12], u), b = lerp(P.B[i], P.B[(i + 1) % 12], u);
      return lerp(a, b, v);
    };
    const glassOn = (S, P, i, u0, u1, v0, v1) => {
      const f = S.f('s' + i);
      if (!f.on || !f.front) return;
      const poly = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => A.toFace(f, quadP(P, i, u, v)));
      K.glass(f, poly, { gap: 0.9, gap2: 2.0 });
    };
    M.part('FUSELAGE', () => {
      cabin = M.extrude(prof2(sec(0, W, H, zb)), xa, xb, { plane: 'yz', smoothDeg: 50 });
      // nose: two lofts
      const n0 = sec(xb, W, H, zb), n1 = sec(xb + Ln * 0.55, W * 0.86, H * 0.8, zb + H * 0.08), n2 = sec(xb + Ln, W * 0.42, H * 0.42, zb + H * 0.22, 0.45);
      noseA = { S: M.loft(n0, n1, { smoothDeg: 50 }), A: n0, B: n1 };
      const noseB = { S: M.loft(n1, n2, { smoothDeg: 50 }), A: n1, B: n2 };
      // tail: upswept loft
      const t0 = sec(xa, W, H, zb), t1 = sec(xa - Lt, W * 0.32, H * 0.36, zb + H * (form === 'boom' ? 0.2 : 0.6), 0.45);
      const tail = { S: M.loft(t0, t1, { smoothDeg: 50 }), A: t0, B: t1 };
      // glazing: windscreen panes and side windows on the nose
      if (M.decorOn) {
        for (const i of [3, 4, 6, 7]) glassOn(noseB.S, noseB, i, 0.12, 0.88, 0.05, 0.7);
        for (const i of [3, 4, 6, 7]) glassOn(noseA.S, noseA, i, 0.12, 0.88, 0.55, 0.95);
        for (const i of [SIDE_R, SIDE_L]) glassOn(noseA.S, noseA, i, i === SIDE_R ? 0.55 : 0.08, i === SIDE_R ? 0.92 : 0.45, 0.55, 0.92);
        // chin windows
        for (const i of [1, 9]) glassOn(noseB.S, noseB, i, 0.2, 0.8, 0.1, 0.5);
      }
      // cabin sides: frames, windows, doors
      for (const [fi, sy] of [[SIDE_R, 1], [SIDE_L, -1]]) {
        const f = cabin.f('s' + fi);
        if (!f.on || !f.front) continue;
        const dirX = f.u[0] >= 0 ? 1 : -1;       // face u along +x or -x
        const X = (x) => (x - (xa + xb) / 2) * dirX;
        const Lf = xb - xa, hh = f.h;
        const nf = Math.max(4, Math.round(Lf / 0.9));
        for (let i = 1; i < nf; i++) f.line(X(xa + Lf * i / nf), -hh / 2, X(xa + Lf * i / nf), hh / 2, { w: 0 });
        f.rivets(X(xa + 0.2), hh * 0.38, X(xb - 0.2), hh * 0.38, { pitch: 8 });
        f.rivets(X(xa + 0.2), -hh * 0.35, X(xb - 0.2), -hh * 0.35, { pitch: 8 });
        // crew door at the front, cargo door aft on the near side
        const dw = 0.8, dh = Math.min(1.75, hh * 0.85);
        const dx = xb - 0.7;
        const door = [X(dx) - dw / 2, -hh / 2 + 0.06, X(dx) + dw / 2, -hh / 2 + 0.06 + dh];
        f.rect(door, { w: 1 });
        f.rect(door[0] + f.mOf(1.6), door[1] + f.mOf(1.6), door[2] - f.mOf(1.6), door[3] - f.mOf(1.6), { w: 0 });
        A.window2(f, [X(dx) - dw * 0.3, -hh / 2 + dh * 0.6, X(dx) + dw * 0.3, -hh / 2 + dh * 0.85], { frame: 0.12 });
        // window row
        const x0 = xa + 0.8, x1 = dx - dw;
        const n = Math.max(2, Math.min(nWin, Math.floor((x1 - x0) / 0.75)));
        // cheat line: a painted band along the cabin, broken at the door
        f.hatch([Math.min(X(xa), X(xb)), -hh * 0.14, Math.max(X(xa), X(xb)), -hh * 0.04], { angle: 0, gap: 1.1, w: 0, holes: [door] });
        f.line(Math.min(X(xa), X(xb)), -hh * 0.14, Math.max(X(xa), X(xb)), -hh * 0.14, { w: 0 });
        f.line(Math.min(X(xa), X(xb)), -hh * 0.04, Math.max(X(xa), X(xb)), -hh * 0.04, { w: 0 });
        for (let i = 0; i < n; i++) {
          const x = x0 + (x1 - x0) * (i + 0.5) / n;
          if (eq.has('slar') && sy === sideS && i < n * 0.6) continue;
          A.window2(f, [X(x) - 0.22, hh * 0.02, X(x) + 0.22, hh * 0.28], { frame: 0.18, flip: i % 2 === 1 });
        }
        if (sy === sideS) K.stencil(f, reg, X(xa + Lf * 0.35), -hh * 0.2, hh * 0.13);
        if (sy === sideS) K.stencil(f, String(thou(Math.round(L * 10)) % 90 + 10), X(xb - 2.0), hh * 0.15, hh * 0.12);
      }
      // roof and belly panels
      for (const fi of [TOP, BOT]) {
        const f = cabin.f('s' + fi);
        if (!f.on || !f.front) continue;
        const n = Math.max(3, Math.round(f.w / 1.6));
        for (const r of f.grid(n, 1, { gap: 2.2 })) K.frame(f, r, { inset: 1.6 });
      }
      // tail cone panels and a ramp seam
      if (M.decorOn) {
        for (const i of [SIDE_R, SIDE_L]) {
          const f = tail.S.f('s' + i);
          if (!f.on || !f.front) continue;
          for (const v of [0.3, 0.6]) A.fLine(f, quadP(tail, i, 0, v), quadP(tail, i, 1, v), { w: 0 });
          f.hatch(f.poly, { angle: 0, gap: 3.4 - f.tone * 1.2, w: 0 });
        }
      }
      M.info.mass = [xa - Lt, -W / 2, zb, xb + Ln, W / 2, zTop];
      M.info.centers = [[[xa - Lt - 0.5, 0, zb + H / 2], [xb + Ln + 0.8, 0, zb + H / 2]]];
      M.callout('FUSELAGE', 1, [xa + Lc * 0.3, sideS * W / 2, zb + H * 0.6], 2.6);
      M.callout('COCKPIT GLAZING', 1, A.toward(M, quadP(noseB, sideS > 0 ? 3 : 7, 0.5, 0.35), 0.05), 1.6);
      M.callout('CREW DOOR', 1, [xb - 0.7, sideS * W / 2, zb + 1.0], 0.9);
    });

    // ------------------------------------------------ wing, nacelles, rotors
    const zw = zTop + c * 0.06;
    const nPer = quad ? 2 : 1;
    const span2 = W / 2 + nPer * Rr * 2.1 - Rr * 1.0 + 0.4;   // half span to the outer nacelle
    const boomY = form === 'boom' ? W / 2 + Rr * 1.08 + 0.2 : 0;
    const nacY = form === 'boom' ? [boomY] : quad ? [W / 2 + Rr * 1.08 + 0.25, W / 2 + Rr * 3.25 + 0.4] : [span2];
    const halfSpan = form === 'boom' ? boomY + Rr * 0.5 : nacY[nacY.length - 1];
    const xLE = xw + c * 0.55;
    M.part('WING', () => {
      M.at(0, 0, zw, () => M.mirrorY(() => M.rx(-90, () => A.foil(M, {
        root: { x: xLE, h: 0, c, t: c * 0.17 }, tip: { x: xLE - c * 0.05, h: halfSpan, c: c * 0.85 },
        ribs: Math.round(halfSpan / 1.2), cs: [{ s0: 0.55, s1: 0.95, tab: true }, { s0: 0.12, s1: 0.5 }],
      }))));
      // wing-to-fuselage fairing
      M.box([xLE - c * 1.02, -W * 0.36, zTop - 0.1], [xLE + 0.1, W * 0.36, zw], { chamfer: 0.2 });
      M.callout('WING', 1, [xLE - c * 0.4, sideS * halfSpan * 0.55, zw + c * 0.08], 2.2);
      M.callout('FLAPERON', 2, [xLE - c * 0.9, sideS * halfSpan * 0.3, zw + c * 0.03], 1.1);
    });
    const hubs = [];
    M.part('TILTING NACELLE', () => {
      let k = 0;
      for (const y0 of nacY) for (const sy of [1, -1]) {
        const y = sy * y0;
        const nl = c * 1.15, nr = c * 0.17;
        const piv = [xLE - c * 0.45, y, zw];
        M.at(piv[0], piv[1], piv[2], () => {
          M.cyl(nr * 1.05, -nr * 0.2, nr * 0.3, { axis: 'y', isect: false });
          M.ry(-tilt, () => {
            M.at(nl * 0.2, 0, 0, () => A.nacelle(M, { len: nl, r: nr, prop: null, exhaust: true, vents: sy > 0 ? 90 : 270 }));
            M.at(nl * 0.7 + nr * 0.1, 0, 0, () => M.rx(phases[k % 4], () => K.propeller(M, { r: Rr, blades })));
            const hub = M.W([nl * 0.7 + nr * 0.3, 0, 0]);
            hubs.push(hub);
          });
        });
        k++;
        {
          M.callout('TILTING NACELLE', nacY.length * 2, A.toward(M, [piv[0], y, zw + Math.sin(tilt * D2R) * nl * 0.3], nr), 2.4);
          const hb = hubs[hubs.length - 1];
          M.callout('PROPROTOR', nacY.length * 2, A.toward(M, hb, nr * 1.2), 2);
        }
      }
    });

    // ------------------------------------------------ booms (twin-boom form)
    if (form === 'boom') {
      M.part('TAIL BOOM', () => {
        const x0 = xLE - c * 0.2, x1 = xa - L * 0.45;
        for (const sy of [1, -1]) {
          M.at(0, sy * boomY, zw - c * 0.02, () => {
            const B = M.lathe([[0, x1 - 0.3], [c * 0.09, x1], [c * 0.14, x1 + 1.5], [c * 0.16, x0 - 1], [c * 0.12, x0], [0, x0 + 0.3]], { axis: 'x' });
            if (M.decorOn) { for (const t of [0.3, 0.5, 0.7]) B.lat.ring(t, { w: 0 }); B.lat.shade({ gap: 1.5, gapMax: 4 }); }
          });
          M.at(0, sy * boomY, zw, () => A.foil(M, { root: { x: x1 + c * 0.65, h: c * 0.1, c: c * 0.7, t: c * 0.07 }, tip: { x: x1 + c * 0.35, h: c * 1.15, c: c * 0.45 }, ribs: 3, cs: [{ s0: 0.08, s1: 0.92 }], text: sy === sideS ? reg : null, textH: c * 0.12 }));
        }
        const tc = c * 0.55;
        M.at(0, 0, zw + c * 0.95, () => M.rx(-90, () => A.foil(M, { root: { x: x1 + tc + 0.1, h: -boomY - 0.05, c: tc, t: tc * 0.1 }, tip: { x: x1 + tc + 0.1, h: boomY + 0.05, c: tc }, ribs: 5, cs: [{ s0: 0.1, s1: 0.9, tab: true }] })));
        M.callout('TAIL BOOM', 2, [x1 + 3, sideS * (boomY + c * 0.15), zw], 1.8);
        M.callout('TWIN FIN', 2, [x1 + c * 0.2, sideS * (boomY + c * 0.05), zw + c * 0.6], 1.6);
        M.callout('TAILPLANE', 1, [x1 + tc * 0.5, 0, zw + c * 0.95 + tc * 0.06], 1.2);
        M.info.mass[0] = Math.min(M.info.mass[0], x1);
      });
    } else {
      // ---------------------------------------------- tail surfaces
      M.part('TAIL', () => {
        const xt = xa - Lt, zt = zb + H * 0.6 + H * 0.36 * 0.5;
        const fc = c * 0.95, fh = H * 1.35;
        const x0 = xt + fc * 1.05;
        A.foil(M, { root: { x: x0, h: zt - 0.2, c: fc, t: fc * 0.12 }, tip: { x: x0 - fc * 0.45, h: zt + fh, c: fc * 0.65 }, ribs: 4, cs: [{ s0: 0.1, s1: tailKind === 'T' ? 0.85 : 0.95, tab: true }], text: reg, textH: fc * 0.14 });
        const zs = tailKind === 'T' ? zt + fh : zt + 0.1;
        const xs = tailKind === 'T' ? x0 - fc * 0.4 : x0 - fc * 0.05;
        const sc = c * 0.62, ss = tailKind === 'H' ? c * 1.7 : c * 1.5;
        M.at(0, 0, zs, () => M.mirrorY(() => M.rx(-90, () => A.foil(M, { root: { x: xs, h: 0, c: sc, t: sc * 0.11 }, tip: { x: xs - sc * 0.25, h: ss, c: sc * 0.6 }, ribs: 3, cs: [{ s0: 0.15, s1: 0.95, tab: true }] }))));
        if (tailKind === 'H') M.mirrorY(() => M.at(0, ss, 0, () => A.foil(M, { root: { x: xs - sc * 0.15, h: zs - 0.5, c: sc * 0.62, t: sc * 0.08 }, tip: { x: xs - sc * 0.2, h: zs + fh * 0.35, c: sc * 0.5 }, cs: [{ s0: 0.1, s1: 0.9 }] })));
        M.callout('TAIL FIN', 1, [x0 - fc * 0.4, 0, zt + fh * 0.5], 2);
        M.callout('RUDDER', 1, [x0 - fc * 0.95, sideS * 0.05, zt + fh * 0.4], 1.2);
        M.callout('ELEVATOR', 2, [xs - sc * 0.9, sideS * ss * 0.5, zs], 1.2);
      });
    }

    // ------------------------------------------------ undercarriage or floats
    if (form === 'boat') {
      M.part('WINGTIP FLOAT', () => {
        for (const sy of [1, -1]) {
          const y = sy * halfSpan * 0.82, fl = c * 1.4;
          M.at(xLE - c * 0.5, y, 0, () => A.pontoon(M, { len: fl, w: fl * 0.2, h: fl * 0.16 }));
          A.strut(M, [xLE - c * 0.25, y, fl * 0.16], [xLE - c * 0.35, y, zw - c * 0.05], c * 0.035);
          A.strut(M, [xLE - c * 0.75, y, fl * 0.16], [xLE - c * 0.65, y * 0.92, zw - c * 0.05], c * 0.03);
          A.wire(M, [xLE - c * 0.25, y, fl * 0.16], [xLE - c * 0.65, y * 0.92, zw - c * 0.05], { w: 0 });
        }
        M.callout('WINGTIP FLOAT', 2, [xLE - c * 0.5, sideS * halfSpan * 0.82, c * 0.22], 2);
        // hull keel and step
        M.box([xa - Lt * 0.4, -0.06, zb - 0.18], [xb + Ln * 0.6, 0.06, zb + 0.02], {});
        M.box([xa + 0.2, -W * 0.45, zb - 0.06], [xa + 0.9, W * 0.45, zb + 0.05], {});
        // sponson stubs for water stability
        for (const sy of [1, -1]) M.box([xa + Lc * 0.25, sy * W / 2 - sy * 0.2, zb + 0.15], [xa + Lc * 0.65, sy * (W / 2 + 0.9), zb + 0.45], { chamfer: 0.12 });
        M.callout('HULL STEP', 1, [xa + 0.5, sideS * W * 0.45, zb], 1);
        M.callout('SPONSON', 2, [xa + Lc * 0.45, sideS * (W / 2 + 0.9), zb + 0.3], 1.2);
        // waves
        A.waves(M, xa - Lt - 2, xb + Ln + 2, -halfSpan - 2, halfSpan + 2, 1);
      });
    } else {
      M.part('UNDERCARRIAGE', () => {
        const xm = xa + Lc * 0.42;
        for (const sy of [1, -1]) {
          const sp = M.box([xm - 1.6, sy * (W / 2 - 0.3), zb + 0.05], [xm + 1.6, sy * (W / 2 + 0.55), zb + 1.05], { chamfer: 0.25 });
          const f = sp.f(sy > 0 ? '+y' : '-y');
          if (f.on && f.front) { f.rect(-f.w * 0.3, -f.h * 0.3, f.w * 0.3, f.h * 0.3, { w: 1 }); f.hatch([-f.w * 0.3, -f.h * 0.3, f.w * 0.3, f.h * 0.3], { angle: 0, gap: 2.6, w: 0 }); }
          for (const dx of [-0.8, 0.8]) M.at(xm + dx, sy * (W / 2 + 0.2), 0, () => A.gearLeg(M, { h: zb + 0.1, wr, ww: wr * 0.55, r: wr * 0.15 }));
        }
        M.at(xb + Ln * 0.35, 0, 0, () => { A.gearLeg(M, { h: zb + H * 0.08 + 0.05, wr: wr * 0.75, ww: wr * 0.4, r: wr * 0.12 }); });
        M.callout('MAIN GEAR', 4, [xm + 0.8, sideS * (W / 2 + 0.2 + wr * 0.3), wr], 1.8);
        M.callout('GEAR SPONSON', 2, [xm, sideS * (W / 2 + 0.55), zb + 0.6], 1.2);
        M.callout('NOSE GEAR', 1, [xb + Ln * 0.35, sideS * wr * 0.25, wr * 0.75], 1.2);
      });
    }

    // ------------------------------------------------ equipment
    let carried = null;
    if (eq.has('radome')) {
      M.part('RADOME', () => {
        const p = [xb + Ln, 0, zb + H * 0.22 + H * 0.21];
        M.at(p[0] - 0.05, 0, p[2], () => {
          const R = M.lathe([[W * 0.2, 0], [W * 0.19, W * 0.18], [W * 0.13, W * 0.36], [0, W * 0.45]], { axis: 'x' });
          if (M.decorOn) { R.lat.ring(0.15, { w: 1 }); R.lat.shade({ gap: 1.4, gapMax: 4 }); }
        });
        M.callout('RADOME', 1, [p[0] + W * 0.25, sideS * W * 0.12, p[2] + W * 0.05], 1.6);
      });
    }
    if (eq.has('ramp') && form !== 'boat') {
      M.part('CARGO RAMP', () => {
        const hz = zb + (form === 'boom' ? 0.1 : 0.15), hx = xa - (form === 'boom' ? 0 : 0.3);
        const len = hz / Math.sin(16 * D2R);
        const gx = hx - Math.cos(16 * D2R) * len;
        const rw = W * 0.72;
        const R = M.along([hx, 0, hz], [gx, 0, 0.0], (l) => M.box([0, -rw / 2, 0], [l, rw / 2, 0.12]));
        const f = R.f('+z');
        if (f.on) { const n = Math.max(4, Math.round(f.w / 0.35)); for (let i = 1; i < n; i++) { const x = -f.w / 2 + f.w * i / n; f.line(x, -f.h * 0.45, x, f.h * 0.45, { w: 0 }); } f.rect(-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2), { w: 1 }); }
        for (const sy of [1, -1]) M.tube([hx - 0.4, sy * rw * 0.45, hz + 0.6], [hx - len * 0.4, sy * rw * 0.45, hz * 0.6 + 0.12], 0.04, {});
        // dark opening in the tail
        const oh = H * 0.7;
        const O = M.plate([[hx - 0.06, -rw / 2, hz + 0.12], [hx - 0.06, rw / 2, hz + 0.12], [hx - 0.06, rw / 2, hz + oh], [hx - 0.06, -rw / 2, hz + oh]], { isect: false });
        const of = O.f('face');
        if (of.on) of.hatch(of.box, { angle: 70, gap: 1.0, w: 0 });
        M.callout('CARGO RAMP', 1, [gx + (hx - gx) * 0.4, sideS * rw * 0.45, hz * 0.4 + 0.1], 2.2);
        // a small vehicle on the ramp
        if (carKind !== 'cart' || M.decorOn || true) {
          const cx = gx + (hx - gx) * 0.45, cz = hz * 0.45 + 0.12;
          M.with({ at: [cx, 0, cz], ry: 16 }, () => A.car(M, carKind));
          carried = carKind;
          M.callout(carKind === 'cart' ? 'BAGGAGE CART' : carKind === 'jeep' ? 'FIELD CAR' : 'SALOON CAR', 1, [cx, sideS * 0.7, cz + 0.9], 2);
        }
      });
    }
    if (eq.has('hook') && form !== 'boat' && !eq.has('ramp')) {
      M.part('BELLY HOOK', () => {
        const x = xa + Lc * 0.5;
        M.box([x - 0.3, -0.2, zb - 0.15], [x + 0.3, 0.2, zb], {});
        const z1 = 0.1 + 2.3;
        for (const sy of [1, -1]) A.wire(M, [x, 0, zb - 0.15], [x, sy * 0.9, z1], { w: 1 });
        M.at(x, 0, 0.1, () => K.container(M, { len: 4.5, h: 2.3, label: reg }));
        M.callout('BELLY HOOK', 1, [x, 0, zb - 0.1], 1.4);
        M.callout('SLUNG CONTAINER', 1, [x, sideS * 1.22, 1.3], 2);
        carried = 'container';
      });
    }
    if (eq.has('tank')) {
      M.part('WATER TANK', () => {
        const x = xa + Lc * 0.5, tl = Lc * 0.55;
        const zt = form === 'boat' ? zb + 0.25 : zb - 0.05;
        if (form === 'boat') {
          for (const sy of [1, -1]) M.at(x, sy * (W / 2 + 0.25), zb + H * 0.35, () => K.tankCapsule(M, { r: 0.35, len: tl, axis: 'x' }));
          for (const sy of [1, -1]) for (const dx of [-tl * 0.3, tl * 0.3]) M.tube([x + dx, sy * W / 2, zb + H * 0.35], [x + dx, sy * (W / 2 + 0.25), zb + H * 0.35], 0.05, {});
        } else {
          M.at(x, 0, zt - 0.42, () => K.tankCapsule(M, { r: 0.42, len: tl, axis: 'x' }));
          for (const dx of [-tl * 0.3, tl * 0.3]) M.tube([x + dx, 0, zt - 0.1], [x + dx, 0, zb + 0.05], 0.06, {});
        }
        // scoop probes
        for (const sy of [1, -1]) M.pipe([[x + tl * 0.2, sy * 0.3, form === 'boat' ? zb : zt - 0.6], [x + tl * 0.25, sy * 0.3, form === 'boat' ? zb - 0.3 : zt - 0.95], [x + tl * 0.4, sy * 0.3, form === 'boat' ? zb - 0.35 : zt - 1.0]], 0.05, { isect: false });
        M.callout('WATER TANK', form === 'boat' ? 2 : 1, form === 'boat' ? [x, sideS * (W / 2 + 0.6), zb + H * 0.35] : [x, sideS * 0.42, zt - 0.42], 2.3);
        M.callout('SCOOP PROBE', 2, [x + tl * 0.25, sideS * 0.35, form === 'boat' ? zb - 0.3 : zt - 0.95], 1.1);
      });
    }
    if (eq.has('hoist')) {
      M.part('RESCUE HOIST', () => {
        const x = xb - 0.7, y = sideS * W / 2, z = zTop - 0.25;
        M.pipe([[x - 0.4, y, z], [x - 0.4, y + sideS * 0.6, z + 0.15], [x + 0.1, y + sideS * 0.75, z + 0.15]], 0.06, {});
        M.at(x + 0.1, y + sideS * 0.75, z + 0.05, () => { M.cyl(0.14, -0.2, 0.12); });
        M.line([[x + 0.1, y + sideS * 0.75, z - 0.2], [x + 0.1, y + sideS * 0.75, Math.max(0.6, zb * 0.5)]], { w: 1, pass: 1 });
        M.at(x + 0.1, y + sideS * 0.75, Math.max(0.6, zb * 0.5) - 0.4, () => A.bag(M, { r: 0.18 }));
        M.callout('RESCUE HOIST', 1, [x + 0.1, y + sideS * 0.75, z + 0.1], 1.9);
      });
    }
    if (eq.has('slar')) {
      M.part('SIDE RADAR', () => {
        const x0 = xa + 0.6, x1 = xa + Lc * 0.55;
        M.at(0, sideS * (W / 2 + 0.05), zb + H * 0.55, () => {
          const S = M.box([x0, -0.15, -0.35], [x1, 0.15, 0.35], { chamfer: 0.12 });
          for (const k of ['+y', '-y']) { const f = S.f(k); if (f.on && f.front) { const n = Math.max(6, Math.round(f.w / 0.3)); for (let i = 1; i < n; i++) f.line(-f.w / 2 + f.w * i / n, -f.h * 0.3, -f.w / 2 + f.w * i / n, f.h * 0.3, { w: 0 }); } }
        });
        M.callout('SIDE RADAR', 1, [(x0 + x1) / 2, sideS * (W / 2 + 0.2), zb + H * 0.55], 1.9);
      });
    }
    if (eq.has('stairs') && form !== 'boat') {
      M.part('AIR STAIRS', () => {
        const x = xb - 0.7, y = sideS * W / 2;
        const len = zb * 1.3 + 0.2;
        M.with({ at: [x, y + sideS * (len + 0.05), 0], rz: sideS > 0 ? -90 : 90 }, () => K.stairs(M, { len, h: zb + 0.05, w: 0.7 }));
        M.callout('AIR STAIRS', 1, [x, y + sideS * len * 0.5, zb * 0.5 + 0.2], 1.6);
      });
    }
    if (eq.has('wires')) {
      M.part('ANTENNA WIRE', () => {
        const a = [xb - 1.5, 0, zTop + 0.05];
        M.at(a[0], 0, zTop - 0.02, () => M.cyl(0.05, 0, 0.4));
        const tip = form === 'boom' ? [xa - L * 0.45 + c * 0.3, sideS * boomY, zw + c * 1.1] : [xa - Lt + c * 0.9, 0, zb + H * 0.78 + H * 1.2];
        A.wire(M, [a[0], 0, zTop + 0.38], tip, { w: 1 });
        if (form !== 'boom') A.wire(M, [a[0], 0, zTop + 0.38], [a[0] - c * 1.2, sideS * halfSpan * 0.7, zw + c * 0.05], { w: 0 });
        M.callout('ANTENNA WIRE', 1, lerp([a[0], 0, zTop + 0.38], tip, 0.3), 0.8);
      });
    }
    // wingtip lamps
    M.part('WINGTIP LAMP', () => {
      for (const sy of [1, -1]) M.at(xLE - c * 0.2, sy * (halfSpan + 0.02), zw, () => M.rz(sy * 90, () => K.lamp(M, { r: c * 0.04 })));
      M.callout('WINGTIP LAMP', 2, [xLE - c * 0.2, sideS * (halfSpan + c * 0.08), zw + c * 0.05], 0.6);
    });

    // ------------------------------------------------ vocabulary
    let job;
    if (eq.has('tank')) job = 'FIREFIGHTING';
    else if (eq.has('hoist')) job = 'AMBULANCE';
    else if (carried === 'car' || carried === 'jeep') job = 'CAR FERRY';
    else if (eq.has('slar') || eq.has('radome')) job = place === 'ARCTIC' || place === 'FJORD' ? 'ICE PATROL' : 'SURVEY';
    else if (carried === 'container') job = 'FREIGHT';
    else job = 'MAIL';
    const pax = Math.max(6, Math.round(Lc * 1.4));
    const where = { ISLAND: 'the islands', COASTAL: 'the coast', ARCTIC: 'the Arctic', FJORD: 'the fjords', DESERT: 'the desert', LAKE: 'the lakes', MOUNTAIN: 'mountain towns', ARCHIPELAGO: 'the archipelago' }[place];
    const briefs = {
      FIREFIGHTING: form === 'boat' ? `Scoops water from ${place === 'DESERT' ? 'reservoirs' : 'the sea'} in passing and drops it on fires.` : `Fills its belly tank from lakes and drops water on fires in ${where}.`,
      AMBULANCE: `Lands beside accidents in ${where} and lifts patients on a hoist.`,
      'CAR FERRY': `Carries one car and ${word(Math.min(12, pax))} passengers between ${where}.`,
      'ICE PATROL': `Watches the ice in ${where} with a ${eq.has('slar') ? 'side radar' : 'nose radar'}.`,
      SURVEY: `Maps ${where} with a ${eq.has('slar') ? 'side-looking radar' : 'radar in the nose'}.`,
      FREIGHT: `Lifts a container from ship to shore along ${where}.`,
      MAIL: `Carries mail and ${word(Math.min(12, pax))} passengers between ${where}.`,
    };
    let brief = briefs[job];
    if (brief.length > 78) brief = brief.replace(/ in [a-z ]+\.$| between [a-z ]+\.$| along [a-z ]+\.$/, '.');
    const fname = form === 'boat' ? 'TILT-ROTOR BOAT' : form === 'boom' ? 'TILT-ROTOR FREIGHTER' : 'TILT-ROTOR';
    let pl = place;
    if ((place + ' ' + job + ' ' + fname).length > 34) pl = place.length > 7 ? 'COASTAL' : place;
    if ((pl + ' ' + job + ' ' + fname).length > 34) pl = '';
    return {
      place: pl, job, form: fname, brief, designation: reg,
      specs: [['ROTOR DIA', `${thou(Math.round(Rr * 2000))} MM`], ['PASSENGERS', String(pax)], ['POWER', `${nacY.length * 2} X ${thou(kwEach)} KW`], ['RANGE', `${thou(rangeK)} KM`]],
      figure: A.figSpot(M, L * 0.55 + 2),
    };
  },
};


