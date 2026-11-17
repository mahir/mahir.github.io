// classes/crawler.js: a heavy tracked machine. Two long track units under a hull, or four
// track trucks on pylons under a deck. The topside makes it what it is: an observatory
// dome with a slit, a drilling derrick, a crane, a hut with a chimney and porch, a radar
// tower, a tank farm, a boat in a cradle, a helipad. Control cabs, an engine house with
// stacks, stairs, railings, floodlights. A person stands small beside it.

import * as G from './parts-ground.js';
import { word } from '../words.js';

const { K, D2R, clamp } = G;

const PLACES = {
  POLAR: 'the polar plateau', TUNDRA: 'the tundra', GLACIER: 'the glacier', 'ICE SHELF': 'the ice shelf',
  'SALT FLAT': 'the salt flats', DESERT: 'the desert', LUNAR: 'the moon', MARTIAN: 'Mars',
  PERMAFROST: 'the permafrost', STEPPE: 'the steppe',
};

export default {
  id: 'crawler',
  family: 'ground',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const top = M.wpick([[2, 'dome'], [2, 'derrick'], [1.4, 'crane'], [2, 'hut'], [1.2, 'radar'], [1.2, 'tanks'], [1.3, 'boat'], [1.1, 'helipad']]);
    const gear = M.wpick([[1, 'twin'], [1.2, 'quad']]);
    const place = M.pick(Object.keys(PLACES));
    const Lk = M.r(0, 1), Wk = M.r(0, 1);
    const R = M.r(0.75, 1.15);
    const tw = M.r(1.3, 2.0);
    const dbl = M.chance(0.5);
    const pylonH = M.r(1.6, 3.4);
    const sv = M.pick([1, -1]), front = M.chance(0.8);
    const az = (front ? 1 : -1) * 0 + sv * M.r(38, 56) + (front ? 0 : sv * 90);
    const el = M.r(26, 34);
    const corr = M.wpick([[4, 'corrugated'], [1.5, 'corrugatedH']]);
    const cellSeed = Array.from({ length: 40 }, () => M.rng());
    const lights = M.chance(0.6);
    const cabs = M.wpick([[2, 1], [1, 2]]);
    const slit = M.r(0, 360);
    const domeK = M.r(0.26, 0.34);
    const derrickK = M.r(1.3, 1.9);
    const craneRise = M.r(28, 50), craneYaw = M.r(-70, 70);
    const tankN = M.ri(2, 4), tankSph = M.chance(0.35);
    const boatK = M.r(0.7, 0.92);
    const heliOn = M.chance(0.8), heliYaw = M.r(-40, 40);
    const radarH = M.r(4, 7);
    const hutK = M.r(0, 1);
    const crew = M.ri(3, 14);
    const speed = (M.r(2, 9)).toFixed(0);
    const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
    const des = M.wpick([[1, 'mk'], [1, 'type'], [1, 'reg']]);
    const desig = des === 'mk' ? `MK ${['II', 'III', 'IV', 'V', 'VI', 'VII'][M.ri(0, 5)]}` : des === 'type' ? `TYPE ${M.ri(3, 60)}-${M.pick(LET.split(''))}` : `${M.pick(LET.split(''))}${M.pick(LET.split(''))}-${M.ri(100, 999)}`;
    const unitNo = String(M.ri(1, 9));

    M.setView(az, el);
    const e = M.view.e;
    const sy = e[1] >= 0 ? 1 : -1, sx = e[0] >= 0 ? 1 : -1;

    // ------------------------------------------------ sizes
    const big = top === 'boat' || top === 'derrick' || top === 'helipad' || top === 'dome';
    let L, W;
    if (gear === 'twin') { L = 12 + Lk * 7 + (big ? 2 : 0); W = 7.5 + Wk * 3; }
    else { L = 15 + Lk * 10 + (big ? 2 : 0); W = 11 + Wk * 6; }
    if (top === 'boat') L = Math.max(L, W * 1.6);
    const massBox = [];
    const centers = [];
    let zTop, deckH;
    let figure = null;

    // ------------------------------------------------ running gear and hull
    if (gear === 'twin') {
      const tl = L * 0.88;
      const yt = W / 2 - tw / 2 - 0.15;
      M.part('TRACK UNIT', () => {
        for (const s of [1, -1]) {
          M.at(0, s * yt, 0, () => K.track(M, { len: tl, r: R, w: tw, pitch: R * 0.36 }));
          co(M, 'TRACK UNIT', 2, [0, s * (yt + tw / 2), R * 0.7], 2.6);
          co(M, 'TRACK UNIT', 2, [tl * 0.3, s * (yt + tw / 2), 0.3], 2.6);
        }
        centers.push([[tl / 2 - R, -W / 2 - 0.5, R], [tl / 2 - R, W / 2 + 0.5, R]]);
        centers.push([[-tl / 2 + R, -W / 2 - 0.5, R], [-tl / 2 + R, W / 2 + 0.5, R]]);
      });
      const zb = 2 * R + 0.25;
      deckH = M.r(1.6, 2.4);
      zTop = zb + deckH;
      M.part('HULL', () => {
        // belly between the tracks
        M.box([-tl / 2 + R, -yt + tw / 2 + 0.1, R * 0.8], [tl / 2 - R, yt - tw / 2 - 0.1, zb]);
        const x0 = -L / 2, x1 = L / 2;
        const H = M.extrude([[x0 + 0.4, zb], [x1 - 1.2, zb], [x1, zb + deckH * 0.55], [x1, zTop], [x0, zTop], [x0, zb + 0.5]], -W / 2, W / 2, { plane: 'xz' });
        massBox.push(...H.bbox);
        for (const s of [1, -1]) {
          const f = H.f(s > 0 ? '+y' : '-y');
          if (f.on) {
            const g = f.grid(Math.max(3, Math.round(L / 1.6)), 2, { gap: 2.4, rect: [-f.w / 2 + 1.25, -f.h / 2 + 0.05, f.w / 2 - 1.25, f.h / 2 - 0.05] });
            g.forEach((r) => (r.j === 1 && r.i === 1 ? (K.frame(f, r), K.stencil(f, desig, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, (r[3] - r[1]) * 0.4)) : K.fill(f, r, cellSeed[(r.i * 3 + r.j) % 40] < 0.12 ? 'louver' : cellSeed[(r.i * 3 + r.j + 7) % 40] < 0.08 ? 'hatch' : corr)));
            const poly = f.poly;
            G.corrPoly(f, G.inset(G.clipX(poly, -f.w / 2 + 1.15, false), 0.05));
            G.corrPoly(f, G.inset(G.clipX(poly, f.w / 2 - 1.15, true), 0.05));
          }
        }
        for (const k of ['s1', 's2', 's4', 's5']) { const f = H.f(k); if (f.on) G.skin(f, { cell: 1.3, rows: k === 's2' || k === 's4' ? 2 : 1, kind: (r, n, m) => (k === 's2' && r.j === m - 1 && r.i % 2 === 0 ? 'xWindow' : k === 's4' && r.j === 0 && r.i === 1 ? 'hatch' : k === 's1' || k === 's5' ? 'plain' : corr) }); }
        const d = H.f('s3');
        if (d.on) for (const r of d.grid(Math.max(3, Math.round(L / 2.2)), 3, { gap: 2.2 })) (cellSeed[(r.i + r.j * 5) % 40] < 0.12 ? K.accessHatch(d, r) : K.plain(d, r, { shade: false }));
        // track guards along the top runs
        for (const s of [1, -1]) M.box([-tl / 2 + 0.2, s * (W / 2 - 0.02), zb - 0.12], [tl / 2 - 0.2, s * (W / 2 + 0.18), zb + 0.08], { isect: false });
        co(M, 'HULL', 1, [0, sy * W / 2, zb + deckH * 0.5], 1.8);
        // lamps on the front slope
        for (const s of [1, -1]) M.at(x1 + 0.05, s * W * 0.36, zb + deckH * 0.75, () => K.lamp(M, { r: 0.22 }));
        co(M, 'HEADLAMP', 2, [x1 + 0.3, sy * W * 0.36, zb + deckH * 0.75], 0.9);
      });
    } else {
      const tl = clamp(L * 0.34, 5.5, 9);
      const nt = dbl ? 2 : 1;
      const tW = nt * tw + (nt - 1) * 0.35;
      const xt = L / 2 - tl / 2 - 0.4, yt = W / 2 - tW / 2 - 0.2;
      const zf = 2 * R + 0.2;          // truck frame top
      const zu = zf + 0.6 + pylonH;    // deck underside
      deckH = M.r(1.4, 2.2);
      zTop = zu + deckH;
      M.part('TRACK TRUCK', () => {
        for (const sx2 of [1, -1]) for (const s of [1, -1]) {
          M.at(sx2 * xt, s * yt, 0, () => {
            for (let k = 0; k < nt; k++) { const y = -tW / 2 + tw / 2 + k * (tw + 0.35); M.at(0, y, 0, () => K.track(M, { len: tl, r: R, w: tw, pitch: R * 0.36 })); }
            // truck frame and the pylon
            const F = M.box([-tl / 2 + R * 0.6, -tW / 2 - 0.1, 2 * R + 0.02], [tl / 2 - R * 0.6, tW / 2 + 0.1, zf + 0.6]);
            for (const k of ['+y', '-y', '+x', '-x']) { const f = F.f(k); if (f.on) f.grid(Math.max(1, Math.round(f.w / 1.4)), 1, { gap: 2.4 }).forEach((r) => K.plain(f, r)); }
            const pr = Math.min(tW, tl) * 0.22;
            const P = M.cyl(pr, zf + 0.6, zu);
            if (M.decorOn) { P.lat.shade({ gap: 1.7 }); P.lat.ring(0.15, { w: 1 }); P.lat.ring(0.85, { w: 1 }); }
            M.cyl(pr * 1.35, zf + 0.6, zf + 0.85);
            // four jacks around the pylon
            for (let i = 0; i < 4; i++) {
              const a = (i + 0.5) * Math.PI / 2;
              const p0 = [Math.cos(a) * pr * 1.8, Math.sin(a) * pr * 1.8, zf + 0.6];
              const p1 = [Math.cos(a) * pr * 1.8, Math.sin(a) * pr * 1.8, zu];
              M.tube(p0, G.lerp(p0, p1, 0.6), 0.16, {});
              M.tube(G.lerp(p0, p1, 0.55), p1, 0.1, { isect: false });
              M.boxc([p0[0], p0[1], zf + 0.66], [0.45, 0.45, 0.12], { isect: false });
            }
          });
          co(M, 'TRACK TRUCK', 4, [sx2 * xt + tl * 0.2, s * (yt + tW / 2), R * 0.8], 2.6);
          co(M, 'PYLON', 4, [sx2 * xt, s * yt + sy * Math.min(tW, tl) * 0.22, (zf + zu) / 2], 2);
          co(M, 'LIFT JACK', 16, [sx2 * xt + sx * Math.min(tW, tl) * 0.28, s * yt + sy * Math.min(tW, tl) * 0.28, (zf + zu) / 2 + 0.3], 1.2);
          centers.push([[sx2 * xt, 0, zu - 0.2], [sx2 * xt, 0, 0.0]]);
          centers.push([[sx2 * xt, s * yt, zf + 1], [sx2 * xt, s * yt, zu + 0.3]]);
        }
      });
      M.part('DECK', () => {
        const D = M.box([-L / 2, -W / 2, zu], [L / 2, W / 2, zTop]);
        massBox.push(...D.bbox);
        for (const k of ['+y', '-y', '+x', '-x']) {
          const f = D.f(k);
          G.skin(f, { cell: 1.6, rows: deckH > 1.8 ? 2 : 1, kind: (r, n, m) => (r.j === m - 1 && r.i === 1 && (k === '+y' || k === '-y') ? ['stencil', desig] : r.j === m - 1 && r.i === n - 2 && (k === '+x' || k === '-x') ? ['stencil', unitNo] : cellSeed[(r.i * 5 + r.j) % 40] < 0.12 ? 'louver' : cellSeed[(r.i * 5 + r.j + 11) % 40] < 0.07 ? 'hatch' : corr) });
        }
        const d = D.f('+z');
        if (d.on) for (const r of d.grid(Math.max(3, Math.round(L / 2.4)), Math.max(3, Math.round(W / 2.4)), { gap: 2.2 })) (cellSeed[(r.i + r.j * 5) % 40] < 0.1 ? K.accessHatch(d, r) : K.plain(d, r, { shade: false }));
        // a girder skirt under the deck edge between the trucks
        co(M, 'DECK', 1, [0, sy * W / 2, zu + deckH * 0.5], 1.8);
      });
      // stairs up the near side between the trucks
      M.part('STAIRS', () => {
        const sh = zTop;
        const sl = sh * 0.95;
        const xs0 = -sl / 2 - 0.6;
        const yS = sy * (W / 2 + 0.55);
        M.at(xs0, yS, 0, () => K.stairs(M, { len: sl, h: sh, w: 1.0 }));
        co(M, 'STAIRWAY', 1, [xs0 + sl * 0.5, yS, sh * 0.5 + 0.3], 1.6);
        figure = [xs0 - 1.6, yS + sy * 1.4];
      });
    }

    // ------------------------------------------------ deck fittings
    const deckX0 = -L / 2, deckX1 = L / 2;
    M.part('RAILING', () => {
      const z = zTop, m = 0.15;
      const rx0 = deckX0 + m, rx1 = deckX1 - m, ry = W / 2 - m;
      K.railing(M, [[rx1, ry, z], [rx0, ry, z], [rx0, -ry, z], [rx1, -ry, z]], { h: 1.0, posts: 1.6 });
      co(M, 'HANDRAIL', 1, [rx0 + 2, sy * ry, z + 1.0], 0.6);
    });
    // control cabs at the front corners
    M.part('CONTROL CAB', () => {
      for (let i = 0; i < cabs; i++) {
        const s = i === 0 ? sy : -sy;
        const x = deckX1 - 1.5, y = s * (W / 2 - 1.6);
        M.at(x, y, zTop, () => G.controlCab(M, { w: 2.4, d: 2.2, h: 2.3, front: '+x' }));
        co(M, 'CONTROL CAB', cabs, [x + 1.1, y, zTop + 1.7], 2.2);
      }
    });
    // engine house at the back
    let ehL = 0;
    if (top !== 'boat') {
      M.part('ENGINE HOUSE', () => {
        ehL = Math.min(5, L * 0.22);
        const x = deckX0 + ehL / 2 + 0.6;
        M.at(x, -sy * W * 0.12, zTop, () => G.engineHouse(M, { len: ehL, w: Math.min(3.2, W * 0.35), h: 2.3, stacks: 2 }));
        co(M, 'ENGINE HOUSE', 1, [x, -sy * W * 0.12 + sy * Math.min(3.2, W * 0.35) / 2, zTop + 1.2], 1.6);
        co(M, 'EXHAUST STACK', 2, [x - ehL / 4, -sy * W * 0.12 + Math.min(3.2, W * 0.35) * 0.22, zTop + 3.3], 1.3);
      });
    }
    if (lights) {
      M.part('FLOODLIGHT MAST', () => {
        const x = deckX0 + 0.8, y = sy * (W / 2 - 0.8);
        const h = 4 + W * 0.15;
        K.girder(M, [x, y, zTop], [x, y, zTop + h], { w: 0.45, sec: 3 });
        M.at(x, y, zTop + h, () => { M.cyl(0.35, 0, 0.08); for (let i = 0; i < 3; i++) M.rz(i * 120 + 20, () => M.at(0.35, 0, 0.25, () => K.lamp(M, { r: 0.13 }))); });
        co(M, 'FLOODLIGHT MAST', 1, [x, y, zTop + h * 0.6], 1.1);
      });
    }
    // whip antennas
    M.part('WHIP ANTENNA', () => {
      const x = deckX1 - 1.5, y = sy * (W / 2 - 1.6);
      M.at(x - 0.6, y - sy * 0.7, zTop + 2.4, () => K.whip(M, { h: 4, lean: 8 }));
    });

    // ------------------------------------------------ the topside
    const fx0 = deckX0 + (ehL ? ehL + 1.4 : 1), fx1 = deckX1 - 3.2;
    const cx = (fx0 + fx1) / 2, room = fx1 - fx0;
    let job, brief, form = 'CRAWLER';
    const where = PLACES[place];
    if (top === 'hut') {
      const hl = clamp(room * 0.8, 4, 8.5), hw = clamp(W * 0.48, 3, 5.2);
      M.part('HUT', () => {
        const r = M.at(cx, 0, zTop, () => G.hut(M, { len: hl, w: hw, h: 2.6, rise: hw * (0.25 + hutK * 0.15), doorSide: sy }));
        co(M, 'LIVING HUT', 1, [cx, sy * hw / 2, zTop + 1.8], 2.6);
        co(M, 'STOVE CHIMNEY', 1, [cx - hl * 0.3, -sy * hw * 0.22, zTop + r.ridge + 0.6], 1.6);
        co(M, 'PORCH', 1, [cx + 0.4, sy * (hw / 2 + 1.2), zTop + 0.3], 1.2);
      });
      job = 'STATION'; brief = `Carries a heated hut for ${word(crew)} winter staff across ${where}.`;
      form = M.pick(['CRAWLER', 'TRACKED HOUSE']);
    } else if (top === 'dome') {
      const r = Math.min(W, room) * domeK * 1.1;
      M.part('OBSERVATORY DOME', () => {
        M.at(cx, 0, zTop, () => G.observatory(M, { r, h: r * 0.9, slit: slit }));
        co(M, 'OBSERVATORY DOME', 1, [cx, 0, zTop + r * 0.9 + r * 0.8], 2.6);
        co(M, 'WALKWAY', 1, [cx, sy * (r + 0.6), zTop + r * 0.9 * 0.45], 1.2);
      });
      job = 'TELESCOPE'; brief = `Moves a telescope under a dome to dark sites on ${where}.`;
      form = M.pick(['CRAWLER', 'CRAWLER']);
    } else if (top === 'derrick') {
      const h = W * derrickK, b = Math.min(W, room) * 0.36;
      M.part('DERRICK', () => {
        M.at(cx + room * 0.12, 0, zTop, () => G.derrick(M, { h, base: b, r: 0.08 + b * 0.012 }));
        co(M, 'DERRICK', 1, [cx + room * 0.12, sy * b * 0.3, zTop + h * 0.4], 2.6);
        co(M, 'CROWN BLOCK', 1, [cx + room * 0.12, 0, zTop + h + 0.4], 1.4);
      });
      M.part('PIPE RACK', () => {
        const pl = room * 0.5, x = cx - room * 0.2;
        for (const dx of [-pl * 0.4, pl * 0.4]) M.box([x + dx - 0.12, -sy * W * 0.25 - 1.0, zTop], [x + dx + 0.12, -sy * W * 0.25 + 1.0, zTop + 0.5]);
        for (let i = 0; i < 9; i++) { const yy = -sy * W * 0.25 - 0.8 + (i % 5) * 0.4, zz = zTop + 0.62 + Math.floor(i / 5) * 0.25; M.tube([x - pl / 2, yy + (i >= 5 ? 0.2 : 0), zz], [x + pl / 2, yy + (i >= 5 ? 0.2 : 0), zz], 0.11, { isect: false }); }
        co(M, 'DRILL PIPE', 9, [x, -sy * W * 0.25, zTop + 0.9], 1.4);
      });
      job = 'DRILLING'; brief = `Moves a drilling derrick from hole to hole across ${where}.`;
    } else if (top === 'crane') {
      M.part('CRANE', () => {
        const r = Math.min(W, room) * 0.14;
        const c = M.at(cx, 0, zTop, () => M.rz(craneYaw, () => K.crane(M, { len: L * 0.62, rise: craneRise, r })));
        void c;
        co(M, 'CRANE', 1, [cx, 0, zTop + r * 2], 2.6);
      });
      job = 'SALVAGE'; brief = `Lifts wrecks and stranded vehicles off ${where}.`;
    } else if (top === 'radar') {
      M.part('RADAR TOWER', () => {
        const b = Math.min(W, room) * 0.28;
        M.at(cx, 0, zTop, () => {
          G.derrick(M, { h: radarH, base: b, top: b * 0.6, r: 0.07, block: false });
          M.at(0, 0, radarH + 0.6, () => { M.cyl(b * 0.3, 0, 0.5); M.at(0, 0, 0.5, () => K.radar(M, { len: W * 0.62 })); });
        });
        M.at(cx - room * 0.32, sy * W * 0.2, zTop, () => K.dishMount(M, { r: W * 0.13, el: 35, az: 160 }));
        co(M, 'RADAR ANTENNA', 1, [cx, 0, zTop + radarH + 1.3], 2.6);
        co(M, 'RADAR TOWER', 1, [cx, 0, zTop + radarH * 0.5], 1.6);
        co(M, 'DISH ANTENNA', 1, [cx - room * 0.32, sy * W * 0.2, zTop + W * 0.2], 1.5);
      });
      job = 'WEATHER'; brief = `Moves a weather radar along ${where} ahead of storms.`;
    } else if (top === 'tanks') {
      M.part('TANK FARM', () => {
        const n = tankN;
        if (tankSph) {
          const r = Math.min(W * 0.22, room / (2 * n) * 0.85);
          for (let i = 0; i < n; i++) { M.at(fx0 + room * (i + 0.5) / n, 0, zTop, () => K.tankSphere(M, { r })); co(M, 'FUEL TANK', n, [fx0 + room * (i + 0.5) / n, 0, zTop + r * 2.35], 2.6); }
        } else {
          const r = Math.min(W * 0.16, 1.6);
          for (let i = 0; i < n; i++) {
            const y = (i - (n - 1) / 2) * r * 2.5;
            M.at(cx, y, zTop + r + 0.35, () => K.tankCapsule(M, { r, len: room * 0.9 }));
            co(M, 'FUEL TANK', n, [cx, y, zTop + 2 * r + 0.35], 2.6);
            for (const dx of [-room * 0.3, room * 0.3]) M.at(0, y, zTop, () => M.extrude([[-r * 0.9, 0], [r * 0.9, 0], [r * 0.9, r * 0.6], [-r * 0.9, r * 0.6]], cx + dx - 0.15, cx + dx + 0.15, { plane: 'yz' }));
          }
        }
        K.pipeRun(M, [[fx0, -sy * (W / 2 - 0.6), zTop + 0.3], [fx1, -sy * (W / 2 - 0.6), zTop + 0.3], [fx1, -sy * (W / 2 - 0.6), zTop + 1.4]], 0.12);
        co(M, 'FUEL TANK', n, [cx, 0, zTop + 2.0], 2.6);
        co(M, 'FILL PIPE', 1, [cx, -sy * (W / 2 - 0.6), zTop + 0.3], 1);
      });
      job = 'FUEL'; brief = `Hauls fuel to stations on ${where} in ${word(tankN)} tanks.`; form = M.pick(['CRAWLER', 'TANK CRAWLER']);
    } else if (top === 'boat') {
      const bl = L * boatK, bb = Math.min(W * 0.5, bl * 0.34), bd = bb * 0.62;
      M.part('BOAT CRADLE', () => {
        const nC = 3;
        for (let i = 0; i < nC; i++) {
          const x = -bl * 0.32 + bl * 0.64 * i / (nC - 1);
          const hb = bb * 0.5 * (i === nC - 1 ? 0.75 : 1);
          M.at(0, 0, zTop, () => M.extrude([[-hb - 0.3, 0], [hb + 0.3, 0], [hb + 0.3, 0.9], [hb * 0.35, 0.45], [-hb * 0.35, 0.45], [-hb - 0.3, 0.9]], x - 0.18, x + 0.18, { plane: 'yz' }));
        }
        co(M, 'BOAT CRADLE', 3, [-bl * 0.32, sy * bb * 0.5, zTop + 0.6], 1.3);
      });
      M.part('SURVEY BOAT', () => {
        // the cradles were built at z = 0; move them up by building the boat at the deck
        M.at(0, 0, zTop + 0.42, () => G.boat(M, { len: bl, beam: bb, depth: bd }));
        co(M, 'SURVEY BOAT', 1, [0, sy * bb * 0.45, zTop + 0.42 + bd * 0.8], 2.8);
      });
      job = 'BOAT'; form = M.pick(['TRANSPORTER', 'CRAWLER']);
      brief = `Carries a ${Math.round(bl)} m survey boat across ${where} to open water.`;
    } else {
      const R2 = Math.min(W, room) * 0.48;
      const ph = 1.8;
      M.part('HELIPAD', () => {
        for (let i = 0; i < 6; i++) { const a = (i + 0.5) * Math.PI / 3; M.tube([cx + Math.cos(a) * R2 * 0.5, Math.sin(a) * R2 * 0.5, zTop], [cx + Math.cos(a) * R2 * 0.62, Math.sin(a) * R2 * 0.62, zTop + ph - 0.2], 0.12, {}); }
        M.at(cx, 0, zTop, () => M.cyl(R2 * 0.18, 0, ph - 0.2));
        M.at(cx, 0, zTop + ph, () => K.helipad(M, { r: R2, t: 0.2, gh: R2 * 0.09 }));
        co(M, 'HELIPAD', 1, [cx + R2 * 0.4, 0, zTop + ph], 2.6);
      });
      if (heliOn) {
        M.part('HELICOPTER', () => {
          M.with({ at: [cx, 0, zTop + ph], rz: heliYaw }, () => K.miniHeli(M, { len: R2 * 1.4, reg: desig.replace(/^TYPE /, '') }));
          co(M, 'UTILITY HELICOPTER', 1, [cx, 0, zTop + ph + R2 * 0.16], 2.7);
        });
      }
      job = 'RESCUE'; brief = heliOn ? `Carries a landing deck and a helicopter across ${where}.` : `Carries a landing deck for supply flights across ${where}.`;
    }

    // ------------------------------------------------ the boat cradles must sit on the deck
    M.info.mass = massBox.length ? massBox : null;
    M.info.centers = centers;
    if (brief.length > 78) brief = brief.replace(/ (across|on|along|off) the [a-z ]+/, '').slice(0, 78);
    const tons = Math.round(L * W * (zTop) * 0.55 / 10) * 10;
    return {
      place, job, form,
      designation: desig,
      brief,
      specs: [['MASS', `${tons} T`], ['CREW', String(crew)], ['TRACKS', gear === 'twin' ? '2' : String(4 * (dbl ? 2 : 1))], ['SPEED', `${speed} KM/H`]],
      figure,
    };
  },
};

function co(M, label, qty, p, prio) {
  const w = M.W(p), e = M.view.e, k = (M.px || 0) * 4;
  M.world(() => M.callout(label, qty, [w[0] + e[0] * k, w[1] + e[1] * k, w[2] + e[2] * k], prio));
}
