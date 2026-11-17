// classes/hovercraft.js: a craft on a bag skirt. Rounded plan, a bulging skirt drawn with
// pleats, a buoyancy raft and deck; a passenger cabin with wrap-around windows, or a car
// deck between side cabins with a bow ramp, or a small utility cabin with an open deck.
// Propulsion by ducted fans with rudders or by propellers on pylons. Equipment from a
// pool: radar, life raft canisters, mast with lamps, bollards, searchlight, cars on deck,
// a stretcher bay, a sounding boom, a dinghy.

import * as A from './parts-air.js';
import { K, D2R, lerp } from './parts-air.js';
import { word, thou } from '../words.js';

const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';

// superellipse plan: n points, half length a, half beam b, exponent p (2 oval .. 6 boxy)
function plan(a, b, p, n = 48, bow = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = 2 * Math.PI * i / n, c = Math.cos(t), s = Math.sin(t);
    const pp = c > 0 ? p / bow : p;
    out.push([a * Math.sign(c) * Math.abs(c) ** (2 / pp), b * Math.sign(s) * Math.abs(s) ** (2 / p)]);
  }
  return out;
}

export default {
  id: 'hovercraft',
  family: 'air',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const kind = M.wpick([[3, 'passenger'], [2.5, 'cardeck'], [2.5, 'utility']]);
    const L = kind === 'cardeck' ? M.r(24, 34) : kind === 'passenger' ? M.r(16, 26) : M.r(9, 14);
    const B = L * (kind === 'cardeck' ? M.r(0.45, 0.52) : M.r(0.42, 0.52));
    const sp = M.r(3.2, 5.5);                            // plan squareness
    const rs = Math.max(0.55, L * M.r(0.045, 0.06));     // skirt bag radius
    const hr = Math.max(0.5, L * 0.035);                 // raft depth
    const prop = M.wpick([[3, 'ducts'], [2, 'pylons']]);
    const nProp = prop === 'ducts' ? (L < 14 ? M.pick([1, 2]) : M.pick([2, 2, 3])) : M.pick([2, 2, 4]);
    const pool = [[3, 'radar'], [2.5, 'rafts'], [2, 'mast'], [2, 'bollards'], [2, 'light'], [1.5, 'dinghy'], [1.5, 'boom']];
    const eq = new Set();
    const nEq = M.ri(2, 4);
    for (let k = 0; k < 14 && eq.size < nEq; k++) eq.add(M.wpick(pool));
    const nCars = kind === 'cardeck' ? M.ri(3, 6) : 0;
    const carKinds = Array.from({ length: 8 }, () => M.pick(['car', 'car', 'van', 'jeep']));
    const water = M.chance(0.7);
    const stretcher = kind === 'utility' && M.chance(0.45);
    const az = M.pick([1, -1]) * M.r(42, 58) + M.pick([0, 0, 180]);
    const el = M.r(26, 34);
    const reg = `${M.pick(['SR', 'HM', 'VT', 'BH', 'CC', 'AP'])}.N${M.ri(1, 9)}-${M.ri(1, 199)}`;
    const place = M.pick(water ? ['CHANNEL', 'ESTUARY', 'ARCTIC', 'LAGOON', 'RIVER', 'ICE', 'MARSH'] : ['MUD-FLAT', 'MARSH', 'ICE', 'SALT-PAN', 'TUNDRA']);
    const kw = Math.round(L * M.r(60, 140) / 10) * 10;
    const knots = M.ri(35, 65);
    const glassKind = M.pick(['tall', 'band']);
    M.setView(az, el);
    const e = M.view.e;
    const sideS = e[1] >= 0 ? 1 : -1;
    const frontS = e[0] >= 0 ? 1 : -1;

    const a = L / 2, b = B / 2;
    const P = plan(a, b, sp, 56, 0.8);
    const zsk = rs + 0.06;                               // skirt tube center height
    const zr0 = rs * 1.75, zd = zr0 + hr;                // raft bottom, deck
    // ------------------------------------------------ skirt
    M.part('SKIRT', () => {
      // start the loop on the far side so its seam is hidden
      let i0 = 0, bd = Infinity;
      P.forEach(([x, y], i) => { const d = x / a * e[0] + y / b * e[1]; if (d < bd) { bd = d; i0 = i; } });
      const ring = [...P.slice(i0), ...P.slice(0, i0)].map(([x, y]) => [x, y, zsk]);
      M.pipe([...ring, ring[0]], rs, { smoothBends: true, isect: false });
      // pleats: lines over the bag on the outer side, a finger fringe at the bottom
      if (M.decorOn) {
        const per = [];
        let tot = 0;
        for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; const l = Math.hypot(q[0] - p[0], q[1] - p[1]); per.push(l); tot += l; }
        const pitch = Math.max(M.px * 6, rs * 0.45);
        const n = Math.min(260, Math.round(tot / pitch));
        let acc = 0, k = 0;
        for (let i = 0; i < n; i++) {
          let s = tot * i / n;
          k = 0; acc = 0;
          while (k < P.length - 1 && acc + per[k] < s) { acc += per[k]; k++; }
          const p = P[k], q = P[(k + 1) % P.length], t = (s - acc) / per[k];
          const x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t;
          let nx = q[1] - p[1], ny = -(q[0] - p[0]);
          const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
          if (nx * x + ny * y < 0) { nx = -nx; ny = -ny; }
          if (nx * e[0] + ny * e[1] < -0.3) continue;
          const pts = [];
          for (let j = 0; j <= 6; j++) {
            const th = (-80 + 150 * j / 6) * D2R;
            const rr = rs * 1.015;
            pts.push([x + nx * Math.cos(th) * rr, y + ny * Math.cos(th) * rr, zsk + Math.sin(th) * rr]);
          }
          M.line(pts, { w: i % 2 ? 0 : 1, pass: i % 2 ? 3 : 2 });
        }
      }
      M.callout('BAG SKIRT', 1, A.toward(M, [a * 0.15, sideS * (b + rs * 1.0), zsk + rs * 0.2], rs * 0.1), 2.6);
    });
    // ------------------------------------------------ raft and deck
    const inset = rs * 0.55;
    const Pr = plan(a - inset, b - inset, sp, 56, 0.8);
    let deck;
    M.part('BUOYANCY RAFT', () => {
      const R = M.extrude(Pr, zr0, zd, {});
      deck = R.f('+z');
      if (deck.on) {
        const n = Math.max(3, Math.round(L / 3)), m = Math.max(2, Math.round(B / 3));
        for (const r of deck.grid(n, m, { gap: 2.0 })) {
          if (!deck.holds(r)) continue;
          K.frame(deck, r, { inset: 1.4 });
          if ((r.i + r.j) % 3 === 0) deck.hatch([r[0] + deck.mOf(3), r[1] + deck.mOf(3), r[2] - deck.mOf(3), r[3] - deck.mOf(3)], { angle: 45, gap: 3.0, w: 0 });
        }
        deck.path(Pr.map(([x, y]) => [x * 0.97, y * 0.95]), { closed: true, w: 0 });
      }
      if (M.decorOn) {
        // rub rail and side stenciling on the raft faces facing the viewer
        for (let i = 0; i < Pr.length; i++) {
          const f = R.f('s' + i);
          if (!f.on || !f.front) continue;
          f.line(-f.w / 2, f.h * 0.15, f.w / 2, f.h * 0.15, { w: 0 });
          f.hatch([-f.w / 2, -f.h / 2, f.w / 2, f.h * 0.15], { angle: 90, gap: 2.6 - f.tone, w: 0 });
        }
      }
      const yS = sideS * (b - inset) + sideS * 0.02;
      M.text3(reg, [-a * 0.1, yS, zr0 + hr * 0.55], [M.view.r[0] >= 0 ? 1 : -1, 0, 0], [0, 0, 1], hr * 0.42, { pass: 4, w: 1 });
      M.info.mass = [-a, -b, 0, a, b, zd];
      M.info.centers = [[[-a - 1, 0, zd], [a + 1, 0, zd]]];
      M.callout('BUOYANCY RAFT', 1, [a * -0.3, sideS * (b - inset), zr0 + hr * 0.3], 1.4);
    });

    // deck plates and the lift fan intakes
    const fanX = [];
    M.part('LIFT FAN', () => {
      const nf = kind === 'utility' ? 1 : 2;
      for (let i = 0; i < nf; i++) fanX.push(nf === 1 ? -a * 0.55 : -a * 0.55 + i * 0);
      const fx = -a * 0.58, fr = Math.min(b * 0.32, 1.6);
      const pts = nf === 1 ? [[fx, 0]] : [[fx, b * 0.45], [fx, -b * 0.45]];
      for (const [x, y] of pts) {
        M.at(x, y, zd, () => {
          const C = M.cyl(fr, 0, 0.35, {});
          const f = C.top;
          if (f.on) { f.circle(0, 0, fr * 0.9, { w: 1 }); for (let k = 0; k < 12; k++) { const t = k * Math.PI / 6; f.line(Math.cos(t) * fr * 0.2, Math.sin(t) * fr * 0.2, Math.cos(t) * fr * 0.88, Math.sin(t) * fr * 0.88, { w: 0 }); } f.circle(0, 0, fr * 0.2, { w: 1 }); f.hatch(A.circlePts(0, 0, fr * 0.86, fr * 0.86, 24), { angle: 0, gap: 1.8, w: 0 }); }
        });
      }
      M.callout('LIFT FAN INTAKE', pts.length, [pts[0][0], pts[0][1] + sideS * fr * 0.5, zd + 0.35], 1.5);
    });

    // ------------------------------------------------ superstructure
    let zTopCab = zd;
    let windows = 0;
    const cabin = (x0, x1, hw, h, yc = 0, o = {}) => {
      const c = Math.min(hw * 0.7, (x1 - x0) * 0.25);
      const pl = o.square ? [[x0, -hw], [x1, -hw], [x1, hw], [x0, hw]] : [[x0, -hw], [x1 - c * 1.6, -hw], [x1 - c * 0.5, -hw * 0.75], [x1, -hw * 0.3], [x1, hw * 0.3], [x1 - c * 0.5, hw * 0.75], [x1 - c * 1.6, hw], [x0, hw]];
      const S = M.at(0, yc, 0, () => M.extrude(pl, zd, zd + h, {}));
      for (let i = 0; i < pl.length; i++) {
        const f = S.f('s' + i);
        if (!f.on || !f.front) continue;
        const rear = Math.abs(f.n[0] + 1) < 0.05;
        if (rear && !o.rearWin) { K.fill(f, [-f.w * 0.3, -f.h * 0.42, f.w * 0.3, f.h * 0.4], 'hatch'); continue; }
        const isFront = f.n[0] > 0.2;
        const n = Math.max(1, Math.round(f.w / (isFront ? 0.9 : 1.15)));
        const y0 = isFront ? -f.h * 0.05 : f.h * 0.0, y1 = f.h * 0.38;
        if (glassKind === 'band' || isFront) {
          const m = f.mOf(3);
          const pw = (f.w - 2 * m) / n;
          for (let k = 0; k < n; k++) A.window2(f, [-f.w / 2 + m + pw * k + f.mOf(1.2), y0, -f.w / 2 + m + pw * (k + 1) - f.mOf(1.2), y1], { frame: 0.06, flip: k % 2 === 1 });
        } else windows += A.windowRow(f, -f.w / 2 + 0.3, f.w / 2 - 0.3, y0, y1, n, { fill: 0.7 });
        windows += n;
        f.line(-f.w / 2, -f.h * 0.2, f.w / 2, -f.h * 0.2, { w: 0 });
        f.hatch([-f.w / 2, -f.h / 2, f.w / 2, -f.h * 0.2], { angle: 90, gap: 3.2 - f.tone, w: 0 });
      }
      const roof = S.f('+z');
      if (roof.on) {
        const n = Math.max(2, Math.round(roof.w / 2.2));
        for (const r of roof.grid(n, 2, { gap: 2.2 })) if (roof.holds(r)) K.plain(roof, r, { shade: false });
      }
      return S;
    };
    let wheel = null;                                      // wheelhouse roof point
    let deckFree = null;                                   // [x0, x1, y0, y1] open deck
    if (kind === 'passenger') {
      const x0 = -a * 0.42, x1 = a * 0.72, hw = b * 0.72, h = Math.max(2.3, L * 0.1);
      M.part('PASSENGER CABIN', () => {
        cabin(x0, x1, hw, h);
        M.callout('PASSENGER CABIN', 1, [x0 + (x1 - x0) * 0.4, sideS * hw, zd + h * 0.6], 2.4);
        M.callout('WRAP-AROUND WINDOWS', 1, [x1 - 0.1, sideS * hw * 0.25, zd + h * 0.65], 1.4);
      });
      zTopCab = zd + h;
      M.part('WHEELHOUSE', () => {
        const wl = Math.min(4, (x1 - x0) * 0.25), ww = hw * 0.55, wh = 1.6;
        const S = M.at(0, 0, h, () => cabin(x1 - wl - 1.2, x1 - 1.2, ww, wh, 0, { rearWin: true }));
        void S;
        wheel = [x1 - wl * 0.5 - 1.2, 0, zd + h + wh];
        M.callout('WHEELHOUSE', 1, A.toward(M, [x1 - 1.15, 0, zd + h + wh * 0.6], 0.1), 1.8);
        M.callout('WHEELHOUSE', 1, [x1 - wl * 0.5 - 1.2, 0, zd + h + wh + 0.05], 1.8);
      });
      deckFree = [-a * 0.85, x0 - 0.3, -b * 0.6, b * 0.6];
    } else if (kind === 'cardeck') {
      const x0 = -a * 0.62, x1 = a * 0.66, cw = b * 0.24, h = Math.max(2.4, L * 0.085);
      M.part('SIDE CABIN', () => {
        for (const sy of [1, -1]) cabin(x0, x1, cw / 2, h, sy * (b * 0.78 - cw / 2), { square: false });
        M.callout('SIDE CABIN', 2, [x0 + (x1 - x0) * 0.4, sideS * (b * 0.78), zd + h * 0.6], 2.2);
      });
      M.part('BRIDGE', () => {
        const bx0 = x1 - 3.0, bx1 = x1 - 0.4;
        const S = M.box([bx0, -b * 0.78, zd + h], [bx1, b * 0.78, zd + h + 1.8]);
        for (const k of ['+x', '+y', '-y']) { const f = S.f(k); if (f.on && f.front) { const n = Math.max(2, Math.round(f.w / 1.0)); for (let i = 0; i < n; i++) A.window2(f, [-f.w / 2 + f.w * i / n + f.mOf(2), -f.h * 0.05, -f.w / 2 + f.w * (i + 1) / n - f.mOf(2), f.h * 0.38], { frame: 0.06 }); } }
        const t = S.f('+z'); if (t.on) for (const r of t.grid(4, 1)) K.frame(t, r);
        // portal frame over the car deck
        for (const x of [x0 + 0.3, (x0 + x1) / 2]) M.box([x - 0.25, -b * 0.78 + cw, zd + h - 0.5], [x + 0.25, b * 0.78 - cw, zd + h], {});
        wheel = [(bx0 + bx1) / 2, 0, zd + h + 1.8];
        M.callout('BRIDGE', 1, [bx1, 0, zd + h + 1.0], 1.8);
      });
      zTopCab = zd + h;
      M.part('CAR', () => {
        const lane = [b * 0.28, -b * 0.28];
        let k = 0;
        for (let i = 0; i < 4 && k < nCars; i++) for (const y of lane) {
          if (k >= nCars) break;
          const x = x0 + 2.4 + i * 4.6;
          if (x > x1 - 3.5) break;
          M.at(x, y, zd, () => A.car(M, carKinds[k]));
          k++;
        }
        M.callout('CAR', k, [x0 + 2.4, lane[sideS > 0 ? 0 : 1], zd + 1.2], 2);
      });
      M.part('BOW RAMP', () => {
        const xr = a - inset * 0.5, hz = zd, len = Math.max(3.5, hz / Math.sin(22 * D2R));
        const gx = xr + Math.cos(22 * D2R) * len;
        const rw = b * 0.9;
        const R = M.along([xr, 0, hz], [gx, 0, 0.02], (l) => M.box([0, -rw / 2, 0], [l, rw / 2, 0.18]));
        const f = R.f('+z');
        if (f.on) { const n = Math.max(4, Math.round(f.w / 0.4)); for (let i = 1; i < n; i++) { const x = -f.w / 2 + f.w * i / n; f.line(x, -f.h * 0.45, x, f.h * 0.45, { w: 0 }); } }
        for (const sy of [1, -1]) M.line([[xr - 0.5, sy * rw * 0.45, zd + h * 0.9], [xr + len * 0.45, sy * rw * 0.45, hz * 0.55 + 0.18]], { w: 1, pass: 1 });
        M.callout('BOW RAMP', 1, [xr + len * 0.5, sideS * rw * 0.3, hz * 0.5], 2);
      });
    } else {
      const x0 = a * 0.05, x1 = a * 0.7, hw = b * 0.62, h = 2.2;
      M.part('CABIN', () => {
        cabin(x0, x1, hw, h);
        M.callout('CABIN', 1, [(x0 + x1) / 2, sideS * hw, zd + h * 0.6], 2.2);
      });
      zTopCab = zd + h;
      wheel = [(x0 + x1) / 2, 0, zd + h];
      deckFree = [-a * 0.75, x0 - 0.3, -b * 0.7, b * 0.7];
      if (stretcher) {
        M.part('STRETCHER BAY', () => {
          const x = (deckFree[0] + deckFree[1]) / 2;
          const S = M.box([x - 1.1, -0.35, zd + 0.35], [x + 1.1, 0.35, zd + 0.45]);
          for (const sx of [-1, 1]) for (const sy of [-1, 1]) M.tube([x + sx, sy * 0.3, zd], [x + sx, sy * 0.3, zd + 0.35], 0.03, {});
          M.at(x - 0.6, 0, zd + 0.45, () => M.scale(1, 1, 0.5, () => M.sphere(0.2)));
          // canopy hoop
          for (const sx of [-0.9, 0.9]) M.pipe([[x + sx, -0.55, zd], [x + sx, -0.55, zd + 1.0], [x + sx, 0.55, zd + 1.0], [x + sx, 0.55, zd]], 0.03, { isect: false });
          void S;
          M.callout('STRETCHER', 1, [x, sideS * 0.35, zd + 0.42], 2);
          deckFree = null;
        });
      }
    }

    // ------------------------------------------------ propulsion
    M.part(prop === 'ducts' ? 'DUCTED FAN' : 'PROPELLER PYLON', () => {
      const xs = -a + inset + 0.6;
      const ys = nProp === 1 ? [0] : nProp === 2 ? [b * 0.42, -b * 0.42] : nProp === 3 ? [b * 0.55, 0, -b * 0.55] : [b * 0.6, b * 0.22, -b * 0.22, -b * 0.6];
      if (prop === 'ducts') {
        const rf = Math.min(b / (nProp + 0.6) * 0.95, L * 0.09);
        const zc = zd + rf + 0.35;
        for (const y of ys) {
          M.at(xs + rf * 0.4, y, zc, () => K.ductedFan(M, { r: rf, blades: 5 }));
          M.box([xs + rf * 0.1, y - rf * 0.12, zd], [xs + rf * 0.7, y + rf * 0.12, zc - rf * 1.0], {});
          // rudders behind the duct
          for (const k of [-0.45, 0.45]) {
            const yr = y + k * rf;
            A.foil(M, { root: { x: xs - rf * 0.15, h: zc - rf * 0.9, c: rf * 0.55, t: rf * 0.06, y: yr }, tip: { x: xs - rf * 0.15, h: zc + rf * 0.9, c: rf * 0.55, y: yr }, cs: [{ s0: 0.05, s1: 0.95 }], spar: false });
          }
        }
        const yb = ys.reduce((p, q) => (q * sideS > p * sideS ? q : p), ys[0]);
        M.callout('DUCTED FAN', nProp, A.toward(M, [xs + rf * 0.4, yb, zc + rf * 0.6], rf * 0.3), 2.4);
        M.callout('RUDDER', nProp * 2, [xs - rf * 0.5, yb + sideS * 0.45 * rf, zc + rf * 0.5], 1.4);
        M.info.mass[5] = Math.max(M.info.mass[5], zd);
      } else {
        const pr = Math.min(L * 0.12, b / (nProp > 2 ? 2.4 : 1.4) * 0.9, 4.5);
        const ph = pr + 0.8;
        const pys = nProp === 4 ? [b * 0.62, -b * 0.62, b * 0.62, -b * 0.62] : [b * 0.5, -b * 0.5];
        const pxs = nProp === 4 ? [xs + 1, xs + 1, a * 0.45, a * 0.45] : [xs + 1, xs + 1];
        pys.forEach((y, i) => {
          const x = pxs[i];
          const zt = (nProp === 4 && i >= 2 ? zTopCab : zd) + ph;
          const z0 = nProp === 4 && i >= 2 ? zTopCab : zd;
          A.foil(M, { root: { x: x + 1.4, h: z0, c: 2.4, t: 0.4, y }, tip: { x: x + 0.6, h: zt, c: 1.5, y }, cs: [{ s0: 0.08, s1: 0.85 }], ribs: 2 });
          M.at(x, y, zt + 0.25, () => { A.nacelle(M, { len: 2.4, r: 0.38, prop: 'rear', propR: pr, blades: 4, exhaust: false }); });
        });
        M.callout('PROPELLER PYLON', nProp, [pxs[0] + 1, sideS * b * (nProp === 4 ? 0.62 : 0.5), zd + ph * 0.5], 2.4);
        M.callout('PUSHER PROPELLER', nProp, [pxs[0] - 1.35, sideS * b * (nProp === 4 ? 0.62 : 0.5), zd + ph + 0.25 + pr * 0.7], 1.6);
      }
    });

    // ------------------------------------------------ equipment
    if (eq.has('radar') && wheel) {
      M.part('RADAR', () => {
        M.at(wheel[0], wheel[1], wheel[2], () => { M.cyl(0.08, 0, 0.9); M.at(0, 0, 0.9, () => K.radar(M, { len: Math.min(2.6, B * 0.25) })); });
        M.callout('RADAR SCANNER', 1, [wheel[0], wheel[1], wheel[2] + 1.15], 1.8);
      });
    }
    if (eq.has('mast') && wheel) {
      M.part('MAST', () => {
        const x = wheel[0] - 1.2, h = Math.min(4, L * 0.15);
        M.tube([x, 0, wheel[2]], [x, 0, wheel[2] + h], 0.07, {});
        M.tube([x, -0.7, wheel[2] + h * 0.7], [x, 0.7, wheel[2] + h * 0.7], 0.04, {});
        for (const y of [0.7, -0.7]) M.at(x, y, wheel[2] + h * 0.7, () => M.sphere(0.09));
        M.at(x, 0, wheel[2] + h, () => K.lamp(M, { r: 0.1 }));
        M.at(x + 0.1, 0, wheel[2] + h * 0.45, () => K.horn(M, { r: 0.12 }));
        M.callout('SIGNAL MAST', 1, [x, 0, wheel[2] + h * 0.8], 1.3);
      });
    }
    if (eq.has('rafts')) {
      M.part('LIFE RAFT', () => {
        const n = Math.max(2, Math.min(6, Math.round(L / 6)));
        const zz = kind === 'cardeck' ? zTopCab : zTopCab;
        const yy = kind === 'cardeck' ? b * 0.78 - 0.3 : (kind === 'passenger' ? b * 0.72 : b * 0.62) - 0.45;
        const xr0 = kind === 'utility' ? a * 0.1 : -a * 0.35;
        for (const sy of [1, -1]) for (let i = 0; i < n; i++) {
          const x = xr0 + i * 1.3;
          M.at(x, sy * yy, zz + 0.32, () => {
            const C = K.tankCapsule(M, { r: 0.28, len: 1.1, axis: 'x', bands: true });
            void C;
          });
          M.box([x - 0.3, sy * yy - 0.25, zz], [x + 0.3, sy * yy + 0.25, zz + 0.06], { isect: false });
        }
        M.callout('LIFE RAFT CANISTER', n * 2, [xr0, sideS * yy, zTopCab + 0.6], 1.5);
      });
    }
    if (eq.has('bollards')) {
      M.part('BOLLARD', () => {
        const pts = [[a * 0.82, b * 0.5], [a * 0.82, -b * 0.5], [-a * 0.82, b * 0.62], [-a * 0.82, -b * 0.62]];
        for (const [x, y] of pts) for (const dx of [-0.25, 0.25]) M.at(x + dx, y, zd, () => { M.cyl(0.12, 0, 0.35); M.cyl(0.17, 0.35, 0.4); });
        M.callout('MOORING BOLLARD', 4, [a * 0.82, sideS * b * 0.5, zd + 0.4], 0.9);
      });
    }
    if (eq.has('light')) {
      M.part('SEARCHLIGHT', () => {
        const p = wheel ? [wheel[0] + 0.8, sideS * 0.6, wheel[2]] : [a * 0.7, 0, zd];
        M.at(p[0], p[1], p[2], () => K.searchlight(M, { r: 0.28 }));
        M.callout('SEARCHLIGHT', 1, [p[0], p[1], p[2] + 0.5], 1.4);
      });
    }
    if (eq.has('dinghy') && deckFree) {
      M.part('DINGHY', () => {
        const x = (deckFree[0] + deckFree[1]) / 2, len = Math.min(4, deckFree[1] - deckFree[0] - 0.4);
        if (len > 2.2) {
          M.at(x, sideS * -0.0, zd + 0.3, () => A.boat(M, { len, cabin: false }));
          for (const dx of [-len * 0.3, len * 0.3]) M.box([x + dx - 0.1, -len * 0.18, zd], [x + dx + 0.1, len * 0.18, zd + 0.32], {});
          M.callout('WORK DINGHY', 1, [x, sideS * len * 0.15, zd + 0.3 + len * 0.15], 1.8);
          deckFree = null;
        }
      });
    }
    if (eq.has('boom')) {
      M.part('SOUNDING BOOM', () => {
        const x = a * 0.3, y = sideS * (b - inset), z = zd;
        const out = rs * 1.6 + 0.8;
        M.tube([x, y, z + 0.2], [x, y + sideS * out, z + 0.6], 0.07, {});
        M.tube([x - 1.2, y, z + 0.1], [x, y + sideS * out, z + 0.6], 0.04, {});
        M.at(x, y + sideS * out, z + 0.6, () => { M.cyl(0.04, -z * 0.75, 0, {}); M.at(0, 0, -z * 0.75 - 0.2, () => M.capsule(0.16, -0.35, 0.35, { axis: 'x' })); });
        M.callout('SOUNDING BOOM', 1, [x, y + sideS * rs, z + 0.45], 1.8);
      });
    }
    if (deckFree && kind !== 'passenger') {
      M.part('DECK CARGO', () => {
        const x = (deckFree[0] + deckFree[1]) / 2;
        for (let i = 0; i < 3; i++) M.at(x - 0.8 + i * 0.85, (i % 2) * 0.6 - 0.3, zd, () => K.crate(M, { s: [0.8, 0.7, 0.6 + (i % 2) * 0.2] }));
        M.callout('MAIL CRATE', 3, [x, sideS * 0.4, zd + 0.7], 1.6);
      });
    }
    // waves or ground strokes
    if (water) A.waves(M, -a - 6, a + 6, -b - 5, b + 5, 1.4, 11);
    else A.waves(M, -a - 6, a + 6, -b - 5, b + 5, 0.7, 23);

    // ------------------------------------------------ vocabulary
    let job;
    if (kind === 'cardeck') job = 'FERRY';
    else if (stretcher) job = 'AMBULANCE';
    else if (eq.has('boom')) job = 'SURVEY';
    else if (kind === 'utility') job = place === 'ICE' || place === 'ARCTIC' ? 'ICE PATROL' : 'MAIL';
    else job = place === 'ICE' || place === 'ARCTIC' ? 'PATROL' : 'FERRY';
    const pax = kind === 'passenger' ? Math.round(L * B * 0.5) : kind === 'cardeck' ? Math.round(L * 2.5) : 4;
    const where = { CHANNEL: 'the channel', ESTUARY: 'the estuary', ARCTIC: 'the Arctic coast', LAGOON: 'the lagoon', RIVER: 'the river', ICE: 'the ice', MARSH: 'the marsh', 'MUD-FLAT': 'the mud flats', 'SALT-PAN': 'the salt pan', TUNDRA: 'the tundra' }[place];
    let brief;
    if (job === 'FERRY' && kind === 'cardeck') brief = `Carries ${word(nCars) || nCars} cars and ${pax} passengers across ${where} on a cushion of air.`;
    else if (job === 'FERRY') brief = `Carries ${pax} passengers across ${where} on a cushion of air.`;
    else if (job === 'AMBULANCE') brief = `Fetches patients from ${where} where boats run aground.`;
    else if (job === 'SURVEY') brief = `Measures the depth of ${where} with a sounding boom over the side.`;
    else if (job === 'ICE PATROL') brief = `Patrols ${where} and carries mail where the ice is too thin to walk.`;
    else if (job === 'PATROL') brief = `Patrols ${where} with ${pax} on board, on water and on ice alike.`;
    else brief = `Carries mail and stores across ${where} at ${knots} knots.`;
    if (brief.length > 78) brief = brief.replace(/ on a cushion of air| on water and on ice alike| where the ice is too thin to walk/, '');
    if (brief.length > 78) brief = brief.replace(/ across [a-z ]+/, '');
    let pl = place;
    if ((pl + ' ' + job + ' HOVERCRAFT').length > 34 || job.includes(pl)) pl = '';
    return {
      place: pl, job, form: 'HOVERCRAFT', brief, designation: reg,
      specs: [['BEAM', `${thou(Math.round(B * 1000))} MM`], [kind === 'cardeck' ? 'CARS' : 'PASSENGERS', String(kind === 'cardeck' ? nCars : pax)], ['POWER', `${thou(kw)} KW`], ['SPEED', `${knots} KN`]],
      figure: A.figSpot(M, a + 3),
    };
  },
};
