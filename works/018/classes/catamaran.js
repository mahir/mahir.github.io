// classes/catamaran.js: platforms on two or more hulls. A deck spans twin hulls, three hulls
// or four round columns on submerged pontoons (drawn dashed under the water), and what
// stands on it says what it is: a drilling derrick, an observatory dome, a heavy crane, a
// helipad with its helicopter, a dock carrying a boat or a seaplane, a lighthouse, a keeper's
// house with a garden rail, or a rocket on its launch stand.

import * as K from '../kit.js';
import * as S from './parts-sea.js';
import { word } from '../words.js';
import { D2R, add } from '../geom.js';

const IDEAS = {
  derrick: { job: 'DRILLING', form: 'PLATFORM', places: ['SHELF', 'OFFSHORE', 'GULF', 'NORTH SEA'] },
  telescope: { job: 'OBSERVATORY', form: 'CATAMARAN', places: ['OPEN-SEA', 'EQUATORIAL', 'ATOLL', 'POLAR'] },
  crane: { job: 'RECOVERY', form: 'CRANE BARGE', places: ['HARBOR', 'OFFSHORE', 'ESTUARY', 'SHELF'] },
  helipad: { job: 'RESCUE', form: 'PLATFORM', places: ['OFFSHORE', 'OPEN-SEA', 'GULF', 'SHELF'] },
  dock: { job: 'RECOVERY', form: 'DOCK', places: ['LAGOON', 'HARBOR', 'COASTAL', 'ATOLL'] },
  lighthouse: { job: 'LIGHT', form: 'FLOAT', places: ['SHOAL', 'REEF', 'SANDBANK', 'CHANNEL'] },
  house: { job: 'WEATHER', form: 'STATION', places: ['OPEN-SEA', 'ATOLL', 'SHOAL', 'POLAR'] },
  rocket: { job: 'LAUNCH', form: 'PLATFORM', places: ['EQUATORIAL', 'OPEN-SEA', 'OFFSHORE'] },
};

export default {
  id: 'catamaran',
  family: 'sea',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const idea = M.wpick([[1.3, 'derrick'], [1, 'telescope'], [1.1, 'crane'], [1.2, 'helipad'], [1.2, 'dock'], [0.9, 'lighthouse'], [1, 'house'], [1, 'rocket']]);
    const I = IDEAS[idea];
    const base = M.wpick([[3, 'twin'], [1.5, 'tri'], [2, 'semi']]);
    const Ld = M.r(20, 34), Wd = Ld * M.r(0.5, 0.7);
    const deckD = M.r(1.3, 2.0);
    const hullL = Ld * M.r(1.05, 1.25), hullB = Wd * M.r(0.18, 0.24), hullF = M.r(1.6, 2.4);
    const colR = M.r(1.0, 1.6), colH = M.r(6, 9);
    const side = M.pick([1, -1]);
    const endV = M.pick([1, -1]);
    M.setView(endV > 0 ? side * M.r(40, 58) : side * (180 - M.r(40, 58)), M.r(25, 33));
    const near = side;
    const accEnd = M.pick([1, -1]);          // the end the accommodation block stands at
    const accTier = M.ri(1, 2);
    const accLen = Ld * M.r(0.18, 0.26);
    const skin = M.pick(['corrugated', 'plain']);
    const lifeboat = M.chance(0.6);
    const unit = String(M.ri(1, 40));
    const place = M.pick(I.places);
    const dockLoad = M.pick(['boat', 'seaplane']);
    const dH = M.r(16, 24), craneRise = M.r(30, 55), craneYaw = M.r(-25, 25);
    const rkH = M.r(12, 18), heliYaw = M.r(-40, 40);
    const rng = M.rng;
    const crew = Math.round(Ld * Wd / M.r(30, 45));
    const days = M.pick([20, 30, 45, 60, 90]);
    const mass = Math.round(Ld * Wd * deckD * M.r(2.0, 2.8) + (base === 'semi' ? 1500 : 0) * Ld / 30);

    // ------------------------------------------------ the floating base
    let z1;                                     // deck top
    const hullYs = base === 'tri' ? [-(Wd / 2 - hullB * 0.35), 0, Wd / 2 - hullB * 0.35] : base === 'twin' ? [-(Wd / 2 - hullB * 0.5), Wd / 2 - hullB * 0.5] : [];
    let anyH = null;
    if (base !== 'semi') {
      const z0 = S.WZ + hullF + M.r(0.4, 1.0);   // deck bottom
      z1 = z0 + deckD;
      const hullsBuilt = [];
      hullYs.forEach((y, k) => {
        const center = base === 'tri' && k === 1;
        const L = center ? hullL * 1.08 : hullL * (base === 'tri' ? 0.7 : 1);
        const B = center ? hullB * 1.3 : hullB * (base === 'tri' ? 0.7 : 1);
        M.at(0, y, 0, () => {
          const H = S.hull(M, { L, B, F: z0 - S.WZ + 0.3, rake: L * 0.06, over: L * 0.02, stemA: 1.4, pb: 1.8, sb0: 0.55, stern: 'transom', ss0: 0.12, kt: 0.8, wl: 0.95, flare: 0.2, bulge: 0.02, tumble: 0, sheerBow: 0.5, sheerStern: 0.05, sm: 0.4, n: 24, m: 5, part: 'HULL' });
          M.part('HULL', () => { S.plating(M, H, { rows: [0.5], frame: 3 }); S.hullText(M, H, unit, 0.82, 0.55, near, Math.min(1.0, hullF * 0.35)); });
          if (!anyH || y * near > 0) anyH = { H, y };
          hullsBuilt.push(H);
        });
      });
      for (const H of hullsBuilt) M.world(() => wavesW(M, H, rng));
      M.callout(base === 'tri' ? 'OUTRIGGER HULL' : 'HULL', hullYs.length, [0, hullYs[near > 0 ? hullYs.length - 1 : 0] + near * hullB * 0.4, S.WZ + hullF * 0.5], 2.5);
    } else {
      const z0 = S.WZ + colH;
      z1 = z0 + deckD;
      M.part('COLUMN', () => {
        const xs = [-Ld / 2 + colR * 1.4, Ld / 2 - colR * 1.4], ys = [-Wd / 2 + colR * 1.4, Wd / 2 - colR * 1.4];
        for (const x of xs) for (const y of ys) {
          const C = M.at(x, y, 0, () => M.cyl(colR, S.WZ, z0 + 0.2));
          if (M.decorOn) { C.lat.shade({ gap: 1.8, gapMax: 7 }); for (let k = 1; k < 5; k++) C.lat.ring(k / 5, { w: 0 }); C.lat.text(unit, M.view.az, 0.55, colR * 0.6); }
          // draft marks
          M.at(x, y, 0, () => { for (let k = 1; k < 4; k++) M.cyl(colR * 1.02, S.WZ + k * 1.2, S.WZ + k * 1.2 + 0.08, { isect: false }); });
          // pontoons under the water, dashed
          S.underwater(M, [[[x - colR, y, S.WZ], [x - colR, y, S.WZ - 3]], [[x + colR, y, S.WZ], [x + colR, y, S.WZ - 3]]]);
          S.spray(M, [x, y, S.WZ], { len: 0.1, h: 0, w: 0, wake: false });
        }
        for (const y of ys) {
          const pts = [[-Ld / 2 - 1, y - colR, S.WZ - 3], [Ld / 2 + 1, y - colR, S.WZ - 3], [Ld / 2 + 1, y + colR, S.WZ - 3], [-Ld / 2 - 1, y + colR, S.WZ - 3], [-Ld / 2 - 1, y - colR, S.WZ - 3]];
          S.underwater(M, [pts, [[Ld / 2 + 1, y - colR, S.WZ - 3], [Ld / 2 + 1, y - colR, S.WZ - 5], [-Ld / 2 - 1, y - colR, S.WZ - 5], [-Ld / 2 - 1, y - colR, S.WZ - 3]]]);
        }
        // bracing between the columns
        const zb = S.WZ + colH * 0.35;
        for (const x of xs) K.strut(M, [x, ys[0] + colR * 0.9, zb], [x, ys[1] - colR * 0.9, zb], 0.25, {});
        for (const y of ys) K.strut(M, [xs[0] + colR * 0.9, y, zb], [xs[1] - colR * 0.9, y, zb], 0.25, {});
        K.strut(M, [xs[0] + colR * 0.7, ys[0] + colR * 0.7, zb], [xs[1] - colR * 0.7, ys[1] - colR * 0.7, zb], 0.2, {});
        M.callout('STABILITY COLUMN', 4, [xs[1], ys[near > 0 ? 1 : 0] + near * colR * 1.02, S.WZ + colH * 0.6], 2.6);
        M.callout('SUBMERGED PONTOON', 2, [xs[1] + colR * 0.7, ys[near > 0 ? 1 : 0], S.WZ - 0.1], 1.6);
        M.callout('CROSS BRACE', 4, [0, ys[near > 0 ? 1 : 0] + near * 0.27, zb + 0.2], 1.2);
      });
      S.waterStrokes(M, 0, 0, Ld * 0.75, Wd * 0.8, 14, rng);
    }

    // ------------------------------------------------ the deck box
    const z0d = z1 - deckD;
    M.part('DECK', () => {
      const D = M.box([-Ld / 2, -Wd / 2, z0d], [Ld / 2, Wd / 2, z1]);
      for (const k of ['+x', '-x', '+y', '-y']) {
        const f = D.f(k);
        if (!f.on) continue;
        const n = Math.max(2, Math.round(f.w / 2.4));
        for (const r of f.grid(n, 1, { gap: 2.2 })) K.fill(f, r, skin === 'corrugated' ? 'corrugated' : 'plain');
      }
      const tp = D.f('+z');
      if (tp.on) {
        const n = Math.round(tp.w / 2.4), m = Math.round(tp.h / 2.4);
        for (let i = 1; i < n; i++) { const x = -tp.w / 2 + tp.w * i / n; tp.line(x, -tp.h / 2, x, tp.h / 2, { w: 0 }); }
        for (let j = 1; j < m; j++) { const y = -tp.h / 2 + tp.h * j / m; tp.line(-tp.w / 2, y, tp.w / 2, y, { w: 0 }); }
        tp.rect(-tp.w / 2 + tp.mOf(3), -tp.h / 2 + tp.mOf(3), tp.w / 2 - tp.mOf(3), tp.h / 2 - tp.mOf(3), { w: 0 });
      }
      // railing round the deck edge
      const e = 0.12;
      K.railing(M, [[-Ld / 2 + e, -Wd / 2 + e, z1], [Ld / 2 - e, -Wd / 2 + e, z1], [Ld / 2 - e, Wd / 2 - e, z1], [-Ld / 2 + e, Wd / 2 - e, z1], [-Ld / 2 + e, -Wd / 2 + e, z1]], { h: 1.0, posts: 1.6 });
      // bitts and a ladder down to the water
      for (const x of [-Ld * 0.3, Ld * 0.3]) M.at(x, near * (Wd / 2 - 0.7), z1, () => S.bitt(M, { r: 0.13 }));
      M.at(Ld * 0.1, near * (Wd / 2 + 0.03), 0, () => M.rz(near > 0 ? 90 : -90, () => M.at(0, 0, S.WZ, () => K.ladder(M, { h: z1 - S.WZ + 0.9, w: 0.5 }))));
      M.callout('MAIN DECK', 1, [0, 0, z1], 1.6);
      M.callout('DECK RAILING', 1, [Ld * 0.2, near * (Wd / 2 - e), z1 + 1.0], 0.6);
      M.callout('BOARDING LADDER', 1, [Ld * 0.1, near * (Wd / 2 + 0.05), (z1 + S.WZ) / 2], 1.0);
      M.info.mass = [-Ld / 2, -Wd / 2, z0d, Ld / 2, Wd / 2, z1];
    });

    // ------------------------------------------------ accommodation block
    const ax1 = accEnd * Ld / 2 - accEnd * 0.6, ax0 = ax1 - accEnd * accLen;
    const axA = Math.min(ax0, ax1), axB = Math.max(ax0, ax1);
    const aw = Wd * 0.38;
    let accTop = z1;
    M.part('ACCOMMODATION', () => {
      for (let t = 0; t < accTier; t++) {
        const shrink = t * accLen * 0.2;
        S.house(M, { x0: axA + (accEnd < 0 ? 0 : shrink), x1: axB - (accEnd > 0 ? 0 : shrink), hw: aw - t * 0.6, z: accTop - 0.02, h: 2.6, doors: true, windows: t ? 'band' : 'ports', pitch: 1.8, doorPos: 0.4 });
        accTop += 2.6;
      }
      M.callout('ACCOMMODATION BLOCK', 1, [(axA + axB) / 2, near * aw, z1 + 1.3], 1.8);
    });
    M.part('SIGNAL MAST', () => {
      M.at((axA + axB) / 2, -near * aw * 0.4, accTop, () => S.mast(M, { h: 5, radar: 1.6, lamps: 2, stays: [] }));
      M.callout('RADAR MAST', 1, [(axA + axB) / 2, -near * aw * 0.4, accTop + 3], 1.2);
    });
    if (lifeboat) {
      M.part('LIFEBOAT', () => {
        M.with({ at: [(axA + axB) / 2, near * (aw + 0.05), z1 + 2.6], rz: near > 0 ? 0 : 180 }, () => S.lifeboat(M, { len: Math.min(5, accLen * 0.8), hz: 0.9 }));
        M.callout('LIFEBOAT', 1, [(axA + axB) / 2, near * (aw + 1.2), z1 + 4.4], 1.5);
      });
    }

    // ------------------------------------------------ the idea
    const fx = -accEnd * Ld * 0.12;              // center of the free deck
    const free = Ld - accLen - 1.2;
    let briefBit = '';
    if (idea === 'derrick') {
      M.part('DERRICK', () => {
        const b = Math.min(free * 0.32, Wd * 0.3), t = b * 0.25, zf = z1 + 2.2;
        M.box([fx - b * 0.8, -b * 0.8, z1], [fx + b * 0.8, b * 0.8, zf]);
        const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        for (const [sx, sy] of legs) K.girder(M, [fx + sx * b / 2, sy * b / 2, zf], [fx + sx * t / 2, sy * t / 2, zf + dH], { w: 0.45, sec: 3 });
        const nB = Math.round(dH / 3.5);
        for (let k = 1; k <= nB; k++) {
          const q = k / (nB + 0.4), h = zf + dH * q, w = b / 2 + (t / 2 - b / 2) * q;
          const pts = legs.map(([sx, sy]) => [fx + sx * w, sy * w, h]);
          for (let i = 0; i < 4; i++) M.tube(pts[i], pts[(i + 1) % 4], 0.06, { isect: false });
          if (k % 2) for (let i = 0; i < 4; i++) { const q2 = (k - 1) / (nB + 0.4), h2 = zf + dH * q2, w2 = b / 2 + (t / 2 - b / 2) * q2; const p0 = [fx + legs[i][0] * w2, legs[i][1] * w2, h2]; M.tube(p0, pts[(i + 1) % 4], 0.05, { isect: false }); }
        }
        M.boxc([fx, 0, zf + dH + 0.5], [t * 1.6, t * 1.6, 1.0]);
        M.at(fx, 0, zf + dH + 1.0, () => K.whip(M, { h: 2 }));
        // travelling block and drill pipe
        M.line([[fx, 0, zf + dH], [fx, 0, zf + 3]], { w: 1, pass: 1 });
        M.boxc([fx, 0, zf + 2.6], [0.5, 0.4, 0.8]);
        M.cyl(0.12, zf, zf + 2.2);
        // pipe rack
        const px = fx + accEnd * b * 1.2;
        for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) M.at(px, -Wd * 0.25 + i * 0.32 + j * 0.16, z1 + 0.2 + j * 0.28, () => M.ry(90, () => M.cyl(0.14, -free * 0.18, free * 0.18, { isect: false })));
        for (const dx of [-free * 0.15, free * 0.15]) M.box([px + dx - 0.15, -Wd * 0.3, z1], [px + dx + 0.15, -Wd * 0.25 + 6 * 0.32, z1 + 0.2]);
        // draw-works house
        S.house(M, { x0: fx - b * 1.6, x1: fx - b * 0.85, hw: b * 0.6, z: z1 - 0.02, h: 2.4, windows: 'ports', doors: true, pitch: 1.4 });
        M.callout('DRILLING DERRICK', 1, [fx + b * 0.3, near * b * 0.3, zf + dH * 0.5], 3);
        M.callout('DRILL FLOOR', 1, [fx, near * b * 0.8, z1 + 1.6], 1.6);
        M.callout('PIPE RACK', 1, [px, -Wd * 0.25 + 3 * 0.32, z1 + 0.6], 1.4);
        M.callout('CROWN BLOCK', 1, [fx, near * t * 0.8, zf + dH + 0.5], 1.2);
      });
      briefBit = 'drills test wells';
    } else if (idea === 'telescope') {
      M.part('OBSERVATORY DOME', () => {
        const R = Math.min(free * 0.22, Wd * 0.28), hb = 3.2;
        S.house(M, { x0: fx - R * 1.3, x1: fx + R * 1.3, hw: R * 1.3, z: z1 - 0.02, h: hb, windows: 'ports', doors: true, pitch: 1.8 });
        const Dr = M.at(fx, 0, z1 + hb, () => M.cyl(R, 0, 1.2));
        if (M.decorOn) { Dr.lat.shade({ gap: 1.8 }); for (let k = 0; k < 16; k++) Dr.lat.meridian(k * 22.5, 0, 1, { w: 0 }); }
        const Dm = M.at(fx, 0, z1 + hb + 1.2, () => M.sphere(R * 1.02, { }));
        const az = M.view.az + 30;
        if (M.decorOn) {
          const Lt = Dm.lat;
          for (const a of [az - 9, az + 9]) Lt.meridian(a, 0.5, 0.98, { w: 1 });
          Lt.hatch(az - 9, az + 9, 0.52, 0.97, { gap: 1.2 });
          for (let k = 0; k < 12; k++) Lt.meridian(k * 30 + 15, 0.5, 0.95, { w: 0 });
          Lt.shade({ t0: 0.5, t1: 0.98, gap: 1.8 });
          Lt.ring(0.52, { w: 1 });
        }
        K.railing(M, Array.from({ length: 21 }, (_, i) => { const a = i / 20 * 2 * Math.PI; return [fx + Math.cos(a) * R * 1.25, Math.sin(a) * R * 1.25, z1 + hb]; }), { h: 0.9, posts: 1.4 });
        const dX = Math.max(-Ld / 2 + 2.2, Math.min(Ld / 2 - 2.2, fx - accEnd * R * 2.4));
        M.at(dX, near * Wd * 0.2, z1, () => K.dishMount(M, { r: Math.min(2.2, R * 0.6), el: 50, az: M.view.az + 150 }));
        M.callout('OBSERVATORY DOME', 1, [fx, near * R * 0.56, z1 + hb + 1.2 + R * 0.87], 3);
        M.callout('DOME SHUTTER', 1, [fx + Math.cos(az * D2R) * R * 0.7, Math.sin(az * D2R) * R * 0.7, z1 + hb + 1.2 + R * 0.72], 1.4);
        M.callout('TRACKING DISH', 1, [dX, near * Wd * 0.2, z1 + Math.min(2.2, R * 0.6) * 1.2], 1.5);
      });
      briefBit = 'keeps a telescope over steady water';
    } else if (idea === 'crane') {
      M.part('HEAVY CRANE', () => {
        const r = Math.min(Wd * 0.12, 2.0);
        M.at(fx - accEnd * free * 0.2, 0, z1, () => M.rz((accEnd > 0 ? 180 : 0) + craneYaw, () => K.crane(M, { len: Ld * 0.75, rise: craneRise, r, drop: 6 })));
        M.callout('HEAVY CRANE', 1, [fx - accEnd * free * 0.2, near * r, z1 + r * 1.6], 3);
        // the lifted load: a container hanging is not drawn; a stack of salvage bags and a winch on deck
        M.at(fx + accEnd * free * 0.1, -near * Wd * 0.25, z1, () => K.container(M, { len: 6.06, label: 'SALVAGE' }));
        M.at(fx + accEnd * free * 0.1, near * Wd * 0.2, z1, () => K.winch(M, { r: 0.5, w: 1.6, at: [0, 0, 0.8] }));
        M.callout('CARGO CONTAINER', 1, [fx + accEnd * free * 0.1, -near * Wd * 0.25, z1 + 2.7], 1.2);
        M.callout('MOORING WINCH', 1, [fx + accEnd * free * 0.1, near * Wd * 0.2, z1 + 1.3], 1.1);
      });
      briefBit = 'lifts sunken craft with a heavy crane';
    } else if (idea === 'helipad') {
      M.part('HELIPAD', () => {
        const R = Math.min(Wd * 0.5, free * 0.42), hp = 3.2;
        for (let k = 0; k < 6; k++) { const a = (k + 0.5) * Math.PI / 3; M.tube([fx + Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, z1], [fx + Math.cos(a) * R * 0.7, Math.sin(a) * R * 0.7, z1 + hp - 0.2], 0.12, {}); }
        M.at(fx, 0, z1 + hp, () => K.helipad(M, { r: R, t: 0.22, gh: R * 0.09 }));
        M.with({ at: [fx, 0, z1 + hp], rz: heliYaw }, () => K.miniHeli(M, { len: R * 1.4, reg: unit + '-H' }));
        M.callout('HELIPAD', 1, [fx + R * 0.6, 0, z1 + hp], 2.5);
        M.callout('RESCUE HELICOPTER', 1, [fx, 0, z1 + hp + R * 0.25], 3);
        M.callout('HELIPAD STRUT', 6, [fx + R * 0.6, near * R * 0.2, z1 + hp * 0.5], 1);
      });
      briefBit = 'carries a rescue helicopter far out at sea';
    } else if (idea === 'dock') {
      M.part(dockLoad === 'boat' ? 'LAUNCH' : 'SEAPLANE', () => {
        if (dockLoad === 'boat') {
          const bl = Math.min(free * 0.6, 9), bx = fx;
          for (const k of [-0.3, 0.1, 0.35]) M.box([bx + k * bl - 0.15, -1.0, z1], [bx + k * bl + 0.15, 1.0, z1 + 0.5]);
          M.at(bx, 0, z1 + 0.35, () => {
            const BH = S.hull(M, { L: bl, B: bl * 0.33, F: bl * 0.16, z0: 0, rake: bl * 0.08, over: bl * 0.03, stern: 'transom', ss0: 0.15, kt: 0.8, pb: 1.9, wl: 0.25, wlk: 1, flare: 0.3, bulge: 0.2, tumble: 0, sheerBow: bl * 0.04, sheerStern: 0.02, n: 20, m: 5, part: 'LAUNCH', isect: false });
            S.plating(M, BH, { rows: [0.5], boot: false, frame: 1.4 });
            S.runS(M, BH, 0.82, 0.02, 0.97, 1, { w: 1 }); S.runS(M, BH, 0.82, 0.02, 0.97, -1, { w: 1 });
            const zt = BH.deckZ(0) - 0.05;
            S.house(M, { x0: -bl * 0.1, x1: bl * 0.15, hw: bl * 0.12, z: zt, h: bl * 0.12, windows: 'band', pitch: 0.7 });
          });
          M.callout('SURVEY LAUNCH', 1, [bx, near * bl * 0.15, z1 + 0.35 + bl * 0.12], 3);
          M.callout('BOAT CRADLE', 3, [bx + 0.35 * bl, near * 1.0, z1 + 0.25], 1.2);
        } else {
          seaplane(M, fx, z1, Math.min(free * 0.8, 11), near);
        }
        // a gantry over the dock to lift it
        const gx = fx + accEnd * free * 0.3;
        for (const sy of [-1, 1]) K.girder(M, [gx, sy * (Wd / 2 - 0.6), z1], [gx, sy * (Wd / 2 - 0.6), z1 + 7], { w: 0.6, sec: 4 });
        K.girder(M, [gx, -(Wd / 2 - 0.3), z1 + 7.3], [gx, Wd / 2 - 0.3, z1 + 7.3], { w: 0.7, sec: 4 });
        M.boxc([gx, -near * Wd * 0.1, z1 + 6.7], [0.8, 0.8, 0.5]);
        M.line([[gx, -near * Wd * 0.1, z1 + 6.4], [gx, -near * Wd * 0.1, z1 + 3.4]], { w: 1, pass: 1 });
        M.callout('LIFTING GANTRY', 1, [gx, near * (Wd / 2 - 0.6), z1 + 4], 1.8);
      });
      briefBit = dockLoad === 'boat' ? 'lifts a survey launch in and out' : 'lifts a seaplane out of the water';
    } else if (idea === 'lighthouse') {
      M.part('LIGHT TOWER', () => {
        const R = Math.min(Wd * 0.18, 2.4);
        const th = Ld * 0.6;
        const T = M.at(fx, 0, z1, () => M.cone(R, R * 0.6, 0, th));
        if (M.decorOn) { const Lt = T.lat; for (let k = 1; k < 6; k++) Lt.ring(k / 6, { w: 1 }); for (let k = 0; k < 6; k += 2) Lt.hatch(0, 360, k / 6, (k + 1) / 6, { gap: 1.6 }); for (let k = 0; k < 4; k++) Lt.port(M.view.az, (k + 0.5) / 4.5, R * 0.12); }
        const zt = z1 + th;
        M.at(fx, 0, zt, () => {
          M.cyl(R * 0.9, 0, 0.25);
          K.railing(M, Array.from({ length: 17 }, (_, i) => { const a = i / 16 * 2 * Math.PI; return [Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85, 0.25]; }), { h: 0.9, posts: 0.8 });
          const G = M.cyl(R * 0.5, 0.25, 0.25 + R * 0.8);
          if (M.decorOn) { for (let k = 0; k < 10; k++) G.lat.meridian(k * 36, 0, 1, { w: 1 }); G.lat.hatch(0, 360, 0.1, 0.9, { gap: 1.3 }); }
          const D = M.at(0, 0, 0.25 + R * 0.8, () => M.lathe([[R * 0.58, 0], [R * 0.4, R * 0.25], [R * 0.15, R * 0.45], [0, R * 0.48]]));
          if (M.decorOn) D.lat.shade({ gap: 1.6 });
          M.cyl(0.04, 0.25 + R * 1.25, 0.25 + R * 1.8);
        });
        M.at(fx + accEnd * R * 2, near * Wd * 0.22, z1, () => { M.cyl(0.15, 0, 1.6); M.at(0, 0, 1.6, () => K.horn(M, { r: 0.4 })); });
        M.callout('LIGHT TOWER', 1, [fx, near * R * 0.85, z1 + th * 0.4], 3);
        M.callout('LANTERN', 1, [fx, near * R * 0.5, zt + 0.25 + R * 0.4], 2.6);
        M.callout('FOG HORN', 1, [fx + accEnd * R * 2, near * Wd * 0.22, z1 + 1.8], 1.2);
      });
      briefBit = 'marks a shoal with a light and a fog horn';
    } else if (idea === 'house') {
      M.part('KEEPER HOUSE', () => {
        const hl = Math.min(free * 0.4, 8), hw2 = Math.min(Wd * 0.25, 3.5), wh = 2.8, rh = hw2 * 0.9;
        const hx = fx;
        const Hs = M.box([hx - hl / 2, -hw2, z1 - 0.02], [hx + hl / 2, hw2, z1 + wh]);
        for (const k of ['+x', '-x', '+y', '-y']) {
          const f = Hs.f(k);
          if (!f.on) continue;
          const n = Math.max(1, Math.round(f.w / 2.2));
          for (let i = 0; i < n; i++) {
            const cx = -f.w / 2 + f.w * (i + 0.5) / n;
            if (i === Math.floor(n / 2) && (k === '+y' || k === '-y')) { K.door(M, f, cx, -f.h / 2 + 1.0, 0.85, 1.95, {}); continue; }
            const r = [cx - 0.5, -0.1, cx + 0.5, f.h * 0.35];
            f.rect(r, { w: 1 }); f.line(cx, r[1], cx, r[3], { w: 1 }); f.line(r[0], (r[1] + r[3]) / 2, r[2], (r[1] + r[3]) / 2, { w: 1 });
            K.glass(f, [[r[0] + 0.05, r[1] + 0.05], [r[2] - 0.05, r[1] + 0.05], [r[2] - 0.05, r[3] - 0.05], [r[0] + 0.05, r[3] - 0.05]], { gap: 1.3, gap2: 3, cross: false });
            f.rect(r[0] - 0.25, r[1], r[0] - 0.05, r[3], { w: 0 }); f.rect(r[2] + 0.05, r[1], r[2] + 0.25, r[3], { w: 0 });
          }
          // clapboard
          const nb = Math.round(f.h / 0.25);
          for (let j = 1; j < nb; j++) f.line(-f.w / 2, -f.h / 2 + f.h * j / nb, f.w / 2, -f.h / 2 + f.h * j / nb, { w: 0 });
        }
        // gable roof: two sloped slabs and gable ends
        const zr = z1 + wh, ov = 0.4;
        M.extrude([[-hw2 - ov, zr - 0.2], [0, zr + rh], [hw2 + ov, zr - 0.2], [hw2 + ov, zr - 0.05], [0, zr + rh + 0.2], [-hw2 - ov, zr - 0.05]], hx - hl / 2 - ov, hx + hl / 2 + ov, { plane: 'yz' });
        const G = M.extrude([[-hw2, zr], [hw2, zr], [0, zr + rh - 0.05]], hx - hl / 2, hx + hl / 2, { plane: 'yz' });
        for (const k of ['+x', '-x']) { const f = G.f(k); if (f.on) { f.circle(0, -f.h * 0.05, 0.25, { w: 1 }); f.hatch(f.poly, { angle: 90, gap: 3, w: 0 }); } }
        // roof tiles: lines along the slabs
        if (M.decorOn) for (const sy of [-1, 1]) for (let k = 1; k < 8; k++) { const q = k / 8; M.line([[hx - hl / 2 - ov, sy * (hw2 + ov) * (1 - q), zr - 0.05 + (rh + 0.15) * q + 0.02], [hx + hl / 2 + ov, sy * (hw2 + ov) * (1 - q), zr - 0.05 + (rh + 0.15) * q + 0.02]], { w: 0, pass: 3 }); }
        M.box([hx + hl * 0.25 - 0.3, -hw2 * 0.4 - 0.3, zr], [hx + hl * 0.25 + 0.3, -hw2 * 0.4 + 0.3, zr + rh + 0.8]);
        M.at(hx + hl * 0.25, -hw2 * 0.4, zr + rh + 0.8, () => M.cyl(0.12, 0, 0.4));
        // garden fence
        const gx0 = hx - hl / 2 - 2.5, gx1 = hx + hl / 2 + 2.5, gy = hw2 + 2.0;
        K.railing(M, [[gx0, -gy, z1], [gx1, -gy, z1], [gx1, gy, z1], [gx0, gy, z1], [gx0, -gy, z1]], { h: 0.8, posts: 0.25, r: 0.02 });
        // a tree and a wind vane, an anemometer on the roof ridge
        M.at(gx1 - 1.0, near * (gy - 1.0), z1, () => { M.cyl(0.12, 0, 1.4); const T = M.cone(1.1, 0.05, 1.2, 4.2); if (M.decorOn) T.lat.shade({ gap: 1.6 }); });
        M.at(hx - hl * 0.25, 0, zr + rh + 0.1, () => { M.cyl(0.04, 0, 1.4); M.at(0, 0, 1.4, () => { for (let k = 0; k < 3; k++) M.rz(k * 120, () => { M.tube([0, 0, 0], [0.45, 0, 0], 0.015, { isect: false }); M.at(0.45, 0, 0, () => M.sphere(0.09)); }); }); });
        // Stevenson screen
        M.at(gx0 + 1.2, -near * (gy - 1.0), z1, () => { for (const [x, y] of [[-0.3, -0.25], [0.3, -0.25], [0.3, 0.25], [-0.3, 0.25]]) M.tube([x, y, 0], [x, y, 1.1], 0.03, { isect: false }); const Bx = M.box([-0.4, -0.35, 1.1], [0.4, 0.35, 1.8]); for (const k of ['+x', '-x', '+y', '-y']) { const f = Bx.f(k); if (f.on) K.louver(f, f.box); } });
        M.callout('KEEPER HOUSE', 1, [hx, near * hw2, z1 + wh * 0.6], 3);
        M.callout('GARDEN FENCE', 1, [gx1, near * gy, z1 + 0.6], 1.4);
        M.callout('ANEMOMETER', 1, [hx - hl * 0.25, 0, zr + rh + 1.5], 1.2);
        M.callout('WEATHER SCREEN', 1, [gx0 + 1.2, -near * (gy - 1.0) + near * 0.36, z1 + 1.5], 1.2);
      });
      briefBit = 'houses a weather keeper and a garden far out at sea';
    } else {
      M.part('LAUNCH STAND', () => {
        const R = Math.min(1.1, Wd * 0.06), rx = fx, zs = z1 + 2.2;
        // flame deflector and stand
        M.box([rx - R * 2.2, -R * 2.2, z1], [rx + R * 2.2, R * 2.2, z1 + 0.6]);
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.strut(M, [rx + sx * R * 1.9, sy * R * 1.9, z1 + 0.6], [rx + sx * R * 1.0, sy * R * 1.0, zs], 0.12, {});
        M.at(rx, 0, zs - 0.15, () => M.torus(R * 1.15, 0.1, { rings: 8 }));
        // the rocket
        const prof = [[R * 0.8, 0], [R, 0.4], [R, rkH * 0.62], [R * 0.82, rkH * 0.66], [R * 0.82, rkH * 0.78], [R * 0.6, rkH * 0.9], [R * 0.25, rkH * 0.98], [0, rkH]];
        const Rk = M.at(rx, 0, zs, () => M.lathe(prof, { sharpDeg: 25 }));
        if (M.decorOn) { const Lt = Rk.lat; for (const t of [0.2, 0.4, 0.55]) Lt.ring(t, { w: 1 }); Lt.hatch(0, 360, 0.42, 0.47, { gap: 1.3 }); Lt.shade({ gap: 1.8 }); Lt.text(unit, M.view.az, 0.3, R * 0.8, { along: true }); }
        for (let k = 0; k < 4; k++) M.at(rx, 0, zs, () => M.rz(k * 90 + 45, () => M.plate([[R * 0.95, 0, 0.3], [R * 2.0, 0, -0.1], [R * 2.0, 0, 0.7], [R * 0.95, 0, R * 2.6]], { girth: 0.05 })));
        M.at(rx, 0, zs, () => K.bell(M, { r: R * 0.7, len: R * 1.3 }));
        // service tower with arms
        const gx = rx - accEnd * R * 3.5;
        K.girder(M, [gx, 0, z1], [gx, 0, zs + rkH * 0.85], { w: 1.4, sec: 4 });
        for (const q of [0.35, 0.6]) M.tube([gx, 0, zs + rkH * q], [rx - accEnd * R * 1.02, 0, zs + rkH * q], 0.1, {});
        M.callout('ROCKET', 1, [rx, near * R, zs + rkH * 0.4], 3);
        M.callout('SERVICE TOWER', 1, [gx, near * 0.7, zs + rkH * 0.5], 2);
        M.callout('FLAME DEFLECTOR', 1, [rx, near * R * 2.2, z1 + 0.3], 1.4);
        M.callout('LAUNCH STAND', 1, [rx + R * 1.5, near * R * 1.5, z1 + 1.4], 1.6);
      });
      briefBit = 'launches a sounding rocket from the open sea';
    }

    // ------------------------------------------------ landing stage and figure
    const stageX = -endV * Ld * 0.35;
    const stg = S.landingStage(M, { at: [stageX, near * (Wd / 2 + (base === 'semi' ? 3 : 2.6) + 1.2)], rz: near > 0 ? 180 : 0 });

    // ------------------------------------------------ vocabulary
    const hullsW = base === 'semi' ? 'four columns' : base === 'tri' ? 'three hulls' : 'two hulls';
    let brief = `Stands on ${hullsW} and ${briefBit}.`;
    if (brief.length > 78) brief = `${briefBit[0].toUpperCase()}${briefBit.slice(1)}.`;
    void word; void add;
    return {
      place, job: I.job, form: base === 'semi' && I.form !== 'PLATFORM' ? 'SEMI-SUBMERSIBLE' : base === 'tri' && I.form === 'CATAMARAN' ? 'TRIMARAN' : I.form,
      brief,
      specs: [['DISPLACEMENT', `${mass} T`], ['CREW', String(Math.max(3, crew))], ['DECK', `${Math.round(Ld)} X ${Math.round(Wd)} M`], ['ENDURANCE', `${days} DAYS`]],
      figure: stg.spot,
    };
  },
};

// a small high-wing seaplane on two floats, standing on the deck at (x, z)
function seaplane(M, x, z, span, near) {
  const s = span / 11;
  M.at(x, 0, z, () => {
    // floats on chocks
    for (const sy of [-1, 1]) {
      M.at(0, sy * 1.4 * s, 0.55 * s, () => K.tankCapsule(M, { r: 0.32 * s, len: 6.2 * s, axis: 'x', bands: false }));
      for (const k of [-1.6, 1.4]) M.box([k * s - 0.15, sy * 1.4 * s - 0.4 * s, 0], [k * s + 0.15, sy * 1.4 * s + 0.4 * s, 0.3 * s]);
      for (const k of [-0.9, 0.9]) M.tube([k * s, sy * 1.4 * s, 0.8 * s], [k * s * 0.6, sy * 0.4 * s, 1.75 * s], 0.05 * s, { isect: false });
    }
    // fuselage
    const F = M.at(0, 0, 2.2 * s, () => M.lathe([[0, -5.2 * s], [0.25 * s, -4.4 * s], [0.5 * s, -1.6 * s], [0.6 * s, 0.6 * s], [0.55 * s, 1.6 * s], [0.4 * s, 2.0 * s], [0, 2.1 * s]], { axis: 'x' }));
    if (M.decorOn) { F.lat.shade({ gap: 1.8 }); F.lat.ring(0.62, { w: 1 }); F.lat.text('SEA', near * 90, 0.45, 0.35 * s, { along: true }); }
    // wing on top with struts, tail surfaces
    const Wg = M.box([-0.4 * s, -span / 2, 2.85 * s], [1.3 * s, span / 2, 3.0 * s]);
    const wt = Wg.f('+z'); if (wt.on) { for (let k = 1; k < 10; k++) wt.line(-wt.w / 2, -wt.h / 2 + wt.h * k / 10, wt.w / 2, -wt.h / 2 + wt.h * k / 10, { w: 0 }); }
    for (const sy of [-1, 1]) M.tube([0.3 * s, sy * 0.5 * s, 1.9 * s], [0.4 * s, sy * span * 0.3, 2.85 * s], 0.04 * s, { isect: false });
    M.plate([[-4.4 * s, 0, 2.4 * s], [-5.2 * s, 0, 2.3 * s], [-5.4 * s, 0, 3.6 * s], [-4.9 * s, 0, 3.6 * s]], { girth: 0.05 });
    M.box([-5.2 * s, -1.6 * s, 2.3 * s], [-4.5 * s, 1.6 * s, 2.36 * s]);
    // cockpit glass and the propeller
    M.at(1.2 * s, 0, 2.7 * s, () => K.canopy(M, { len: 1.6 * s, w: 0.9 * s, h: 0.35 * s }));
    M.at(2.15 * s, 0, 2.2 * s, () => K.propeller(M, { r: 1.0 * s, blades: 2 }));
  });
  M.callout('SEAPLANE', 1, [x, near * 0.6 * s, z + 2.4 * s], 3);
  M.callout('PONTOON FLOAT', 2, [x, near * 1.7 * s, z + 0.55 * s], 1.4);
}

// ripples and strokes around a hull whose P() is already in world coordinates
function wavesW(M, H, rng) {
  M.part('WATERLINE', () => {
    for (const sd of [1, -1]) {
      let run = [];
      for (let i = 0; i <= 40; i++) {
        const s = 0.04 + 0.92 * i / 40;
        const p = H.P(s, 0, sd), n = H.N(s, 0.02, sd);
        const l = Math.hypot(n[0], n[1]) || 1;
        if (Math.sin(i * 1.7 + sd) > -0.35) run.push([p[0] + n[0] / l * 0.4, p[1] + n[1] / l * 0.4, S.WZ + 0.002]);
        else { if (run.length > 1) M.line(run, { w: 1, pass: 2 }); run = []; }
      }
      if (run.length > 1) M.line(run, { w: 1, pass: 2 });
    }
  });
  const c = H.P(0.5, 0, 1), c2 = H.P(0.5, 0, -1);
  S.waterStrokes(M, (c[0] + c2[0]) / 2, (c[1] + c2[1]) / 2, H.L * 0.6, H.B * 1.6, 5, rng);
}
