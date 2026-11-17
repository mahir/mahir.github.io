// classes/tug.js: small working ships. A lofted hull with real sheer, a bluff bow and flare,
// a bulwark and rubbing strake; a deckhouse with a wheelhouse on top (faceted or round
// front), one or two funnels, a mast with lamps and radar; towing gear aft. The variant sets
// the idea: harbor tug, salvage tug with a crane, fireboat with a monitor tower, pilot boat,
// icebreaking tug, paddle tug, lightship with a lantern tower, floating post office or clinic.

import * as K from '../kit.js';
import * as S from './parts-sea.js';
import { word } from '../words.js';
import { D2R } from '../geom.js';

const PLACES = {
  harbor: ['HARBOR', 'DOCKYARD', 'ESTUARY', 'PORT', 'CANAL', 'ROADSTEAD', 'BASIN'],
  salvage: ['COASTAL', 'DEEP-SEA', 'CHANNEL', 'ESTUARY', 'REEF'],
  fire: ['HARBOR', 'DOCKYARD', 'OIL PIER', 'RIVER', 'PORT'],
  pilot: ['HARBOR', 'BAR', 'CHANNEL', 'ROADSTEAD', 'ESTUARY'],
  ice: ['ARCTIC', 'POLAR', 'BALTIC', 'LAKE', 'RIVER'],
  paddle: ['RIVER', 'DELTA', 'CANAL', 'LAKE', 'ESTUARY'],
  light: ['SANDBANK', 'SHOAL', 'CHANNEL', 'ESTUARY', 'REEF'],
  post: ['RIVER', 'DELTA', 'ISLAND', 'LAKE', 'FJORD', 'LAGOON'],
};
const STATIONS = ['NORE', 'GULL', 'KISH', 'HAISBRO', 'TONGUE', 'SHAMBLES', 'BAR', 'OUTER', 'SPURN', 'DOWSING', 'CORTON', 'VARNE'];

export default {
  id: 'tug',
  family: 'sea',
  weight: 1,
  build(M) {
    // ------------------------------------------------ choices
    const v = M.wpick([[3, 'harbor'], [1.3, 'salvage'], [1.3, 'fire'], [1, 'pilot'], [1, 'ice'], [0.9, 'paddle'], [0.8, 'light'], [0.9, 'post']]);
    const clinic = v === 'post' && M.chance(0.5);
    const big = { harbor: [20, 30], salvage: [26, 36], fire: [22, 30], pilot: [15, 20], ice: [24, 34], paddle: [24, 34], light: [26, 36], post: [22, 32] }[v];
    const L = M.r(big[0], big[1]);
    const Bk = { harbor: M.r(0.33, 0.38), salvage: M.r(0.28, 0.32), fire: M.r(0.31, 0.36), pilot: M.r(0.28, 0.32), ice: M.r(0.28, 0.32), paddle: M.r(0.22, 0.26), light: M.r(0.27, 0.31), post: M.r(0.25, 0.29) }[v];
    const B = L * Bk;
    const F = { harbor: M.r(1.3, 1.8), salvage: M.r(1.6, 2.2), fire: M.r(1.3, 1.8), pilot: M.r(1.2, 1.5), ice: M.r(1.7, 2.3), paddle: M.r(1.0, 1.3), light: M.r(1.6, 2.1), post: M.r(1.0, 1.3) }[v];
    const stern = v === 'pilot' || v === 'post' ? 'transom' : v === 'salvage' ? M.pick(['transom', 'round']) : v === 'light' ? 'round' : M.wpick([[3, 'round'], [1, 'transom']]);
    const rake = v === 'ice' ? L * M.r(0.14, 0.18) : v === 'pilot' ? L * M.r(0.06, 0.08) : L * M.r(0.035, 0.06);
    const stemA = v === 'ice' ? M.r(0.55, 0.7) : M.r(1.5, 2.4);
    const pb = v === 'pilot' ? M.r(2.2, 2.7) : v === 'ice' ? M.r(2.4, 3.0) : M.r(2.7, 3.6);
    const flare = v === 'pilot' ? M.r(0.5, 0.8) : M.r(0.8, 1.3);
    const sheerBow = F * (v === 'paddle' || v === 'post' ? M.r(0.35, 0.55) : M.r(0.7, 1.1));
    const sheerStern = F * (v === 'light' ? M.r(0.5, 0.8) : M.r(0.1, 0.3));
    const fcsle = (v === 'harbor' || v === 'salvage' || v === 'fire' || v === 'ice') && M.chance(0.45) ? { s: M.r(0.6, 0.68), h: M.r(0.6, 0.9) } : null;
    const bulH = M.r(0.85, 1.05);
    const side = M.pick([1, -1]);
    const end = M.wpick([[3, 1], [2, -1]]);
    const az = end > 0 ? side * M.r(48, 60) : side * (180 - M.r(50, 62));
    M.setView(az, M.r(24, 31));
    const near = side; // the y side toward the viewer
    // superstructure
    const houseH = M.r(2.0, 2.4);
    let hx0, hx1;
    if (v === 'post') { hx0 = -L * M.r(0.3, 0.36); hx1 = L * M.r(0.16, 0.22); }
    else if (v === 'light') { hx0 = -L * M.r(0.36, 0.3); hx1 = -L * M.r(0.12, 0.08); }
    else if (v === 'pilot') { hx0 = -L * M.r(0.18, 0.1); hx1 = L * M.r(0.18, 0.24); }
    else if (v === 'paddle') { hx0 = -L * M.r(0.22, 0.16); hx1 = L * M.r(0.12, 0.18); }
    else { hx0 = -L * M.r(0.16, 0.1); hx1 = L * M.r(0.14, 0.2); }
    const hw = B * (v === 'post' ? M.r(0.36, 0.4) : M.r(0.28, 0.34));
    const chamf = M.chance(0.6) ? hw * M.r(0.2, 0.35) : 0;
    const winKind = v === 'post' ? 'band' : M.wpick([[3, 'ports'], [1, 'mix'], [1, 'band']]);
    const whFront = M.wpick([[2, 'facet'], [1, 'round']]);
    const whLen = Math.min(hx1 - hx0, L * M.r(0.13, 0.17));
    const whH = M.r(1.9, 2.3);
    const whLean = M.r(0.1, 0.35);
    const upper = v !== 'pilot' && v !== 'post' && v !== 'light' && M.chance(0.3); // a second tier
    const nFun = v === 'paddle' || v === 'light' || v === 'pilot' ? 1 : M.wpick([[3, 1], [1, 2]]);
    const funR = v === 'paddle' ? M.r(0.32, 0.42) : M.r(0.55, 0.8) * Math.sqrt(L / 25);
    const funH = v === 'paddle' ? M.r(4.5, 6) : M.r(2.2, 3.4);
    const funExtra = M.r(1.0, 2.0);
    const funRake = M.r(4, 14), funShape = M.pick(['oval', 'taper']), funBands = M.ri(1, 2);
    const funRatio = v === 'paddle' ? 1 : nFun === 2 ? M.r(0.75, 0.95) : M.r(0.55, 0.7);
    const funFlat = v === 'light' && M.chance(0.5);
    const mastH = M.r(4.5, 6.5) * Math.sqrt(L / 25);
    const radarLen = M.r(1.3, 2.0);
    const radarYaw = M.r(-40, 40);
    // equipment pool
    const pool = {
      harbor: [[3, 'winch'], [2, 'hook'], [2, 'arches'], [2.5, 'tires'], [1.4, 'bowFender'], [1.5, 'lifeboat'], [1, 'raft'], [1, 'windlass'], [0.6, 'workboat']],
      salvage: [[3, 'winch'], [1, 'hook'], [2, 'lifeboat'], [1.5, 'tires'], [1, 'windlass'], [1.5, 'pumps'], [0.7, 'workboat']],
      fire: [[2, 'reels'], [1, 'tires'], [1.5, 'lifeboat'], [1, 'raft'], [1, 'windlass'], [0.8, 'hook']],
      pilot: [[2, 'raft'], [1.5, 'tires'], [1, 'windlass']],
      ice: [[3, 'winch'], [1.5, 'lifeboat'], [1, 'windlass'], [1, 'raft'], [1, 'hook']],
      paddle: [[2, 'tires'], [1.5, 'raft'], [1, 'windlass'], [1.5, 'lifeboat']],
      light: [[2, 'lifeboat'], [1.5, 'windlass'], [1, 'raft']],
      post: [[2, 'tires'], [1.5, 'raft'], [1, 'windlass']],
    }[v];
    const nEq = M.ri(2, Math.min(4, pool.length));
    const eq = new Set();
    let guard = 0;
    while (eq.size < nEq && guard++ < 40) eq.add(M.wpick(pool));
    if (v === 'harbor' && !eq.has('winch') && !eq.has('hook')) eq.add('hook');
    if (v === 'salvage') eq.add('crane');
    const nTires = M.ri(3, 6);
    const lifeSide = M.pick([1, -1]);
    const craneRise = M.r(25, 45), craneYaw = M.r(-30, 30);
    const monitorH = M.r(4.5, 7);
    const lanternH = M.r(6, 9), lanternLattice = M.chance(0.6);
    const station = M.pick(STATIONS);
    const hullNo = String(M.ri(2, 48));
    const place = M.pick(PLACES[v]);
    const crew = { harbor: M.ri(3, 6), salvage: M.ri(8, 14), fire: M.ri(5, 9), pilot: M.ri(2, 4), ice: M.ri(8, 14), paddle: M.ri(4, 7), light: M.ri(5, 9), post: M.ri(3, 6) }[v];
    const kw = Math.round(L * L * M.r(1.6, 2.6) / 10) * 10;
    const mass = Math.round(L * B * F * M.r(0.9, 1.3));
    const pull = Math.round(kw / M.r(70, 90));
    const knots = v === 'pilot' ? M.ri(16, 22) : M.ri(9, 13);
    const stageX = -end * L * M.r(0.3, 0.4), stageGap = M.r(2.5, 3.6);
    const mastFwd = M.chance(0.5);
    const dummy = M.r(); void dummy;

    // ------------------------------------------------ hull
    const H = S.hull(M, {
      L, B, F, rake, over: stern === 'transom' ? L * M.r(0.02, 0.05) : L * M.r(0.03, 0.06), stemA, pb, sb0: v === 'pilot' ? 0.45 : 0.5,
      stern, ss0: stern === 'transom' ? 0.18 : M.r(0.24, 0.32), kt: M.r(0.6, 0.78), flare, bulge: 0.05, tumble: stern === 'round' ? 0.06 : 0.02,
      sheerBow, sheerStern, sm: M.r(0.32, 0.42), fcsle,
    });
    M.info.mass = H.solid.bbox.slice();
    M.callout('HULL', 1, H.P(0.5, 0.55, near), 0.5);
    let BW;
    M.part('BULWARK', () => {
      BW = S.bulwark(M, H, { h: (s) => bulH + 0.45 * Math.max(0, (s - 0.6) / 0.4), t: 0.12, posts: 1.5 });
      M.callout('BULWARK', 1, BW.top(0.3, near), 0.4);
    });
    M.part('RUBBING STRAKE', () => {
      S.strake(M, H, { t: 0.9, r: Math.min(0.2, 0.12 + L * 0.002) });
      if (v === 'ice') S.strake(M, H, { t: 0.42, r: 0.09, s0: 0.25, s1: 0.85 });
      M.callout('RUBBING STRAKE', 1, H.P(0.35, 0.93, near), 0.9);
    });
    M.part('HULL', () => {
      S.plating(M, H, { rows: v === 'ice' ? [0.3, 0.5, 0.72] : [0.4, 0.72] });
      S.deckLines(M, H, { n: Math.round(B / 0.9) });
      // hull lettering
      const tag = { fire: 'FIRE', pilot: 'PILOT', salvage: 'SALVAGE', light: station, post: clinic ? 'CLINIC' : 'POST' }[v];
      if (tag) S.hullText(M, H, tag, v === 'light' ? 0.5 : 0.36, 0.55, near, Math.min(F * (v === 'light' ? 0.55 : 0.4), 1.6));
      S.hullText(M, H, hullNo, 0.86, 0.62, near, F * 0.28);
      // draft marks at the stem
      for (let k = 1; k <= 3; k++) S.hullText(M, H, String(k * 2), 0.97, 0.12 + k * 0.17, near, F * 0.08);
      if (v === 'ice') {
        // ice belt: a dark band of thick plate
        for (const sd of [1, -1]) for (let k = 0; k < 4; k++) S.runS(M, H, 0.3 + k * 0.035, 0.1, 0.98, sd, { w: 0, pass: 3 });
      }
    });
    if (stern === 'transom' && H.transom.ok) M.part('HULL', () => { if (H.transom.on) K.stencil(H.transom, hullNo, 0, H.transom.h * 0.1, H.transom.h * 0.22); });

    const dz = (x) => H.deckZ(x);
    const hb = (x) => H.halfB(x);

    // ------------------------------------------------ deckhouse and wheelhouse
    const zd = H.deckMin(hx0, hx1) - 0.05;
    let roofZ = zd + houseH;
    M.part('DECKHOUSE', () => {
      S.house(M, { x0: hx0, x1: hx1, hw, z: zd, h: houseH + (zd < H.deckMax(hx0, hx1) - 0.4 ? 0.3 : 0), chamfer: chamf, doors: true, windows: winKind, doorPos: 0.25 });
      M.callout('DECKHOUSE', 1, [hx0 + (hx1 - hx0) * 0.3, near * hw, zd + houseH * 0.5], 1.2);
      if (zd < H.deckMax(hx0, hx1) - 0.4) roofZ += 0.3;
      // handrail around the roof
      const y = hw - 0.08;
      K.railing(M, [[hx0 + 0.1, -y, roofZ + 0.05], [hx0 + 0.1, y, roofZ + 0.05]], { h: 0.9, posts: 1.2 });
    });
    let tierTop = roofZ;
    let ux0 = hx0, ux1 = hx1;
    if (upper) {
      M.part('DECKHOUSE', () => {
        ux0 = hx0 + (hx1 - hx0) * 0.3; ux1 = hx1 - 0.1;
        S.house(M, { x0: ux0, x1: ux1, hw: hw * 0.85, z: roofZ, h: 2.0, chamfer: chamf * 0.8, doors: true, windows: 'ports', doorPos: 0.1 });
        tierTop = roofZ + 2.0;
      });
    }
    let WH;
    const wx1 = (upper ? ux1 : hx1) - 0.05, wx0 = wx1 - whLen;
    M.part('WHEELHOUSE', () => {
      WH = S.wheelhouse(M, { x0: wx0, x1: wx1, hw: hw * (upper ? 0.82 : 0.92), z: tierTop, h: whH, front: whFront, lean: whLean, wipers: true });
      M.callout('WHEELHOUSE', 1, [wx1, 0, tierTop + whH * 0.7], 2.5);
      // a ladder up the back of the house to the roof
      M.at(hx0 - 0.03, -near * hw * 0.55, 0, () => M.rz(180, () => M.at(0, 0, zd + 0.05, () => K.ladder(M, { h: roofZ - zd + 0.9, w: 0.45 }))));
    });
    // life rings on the wheelhouse sides (or on the house)
    M.part('LIFE RING', () => {
      const xr = (wx0 + WH.fx) / 2 - 0.2;
      for (const sd of [1, -1]) M.with({ at: [xr, sd * (hw * (upper ? 0.82 : 0.92) + 0.03), tierTop + whH * 0.3], rz: sd * 90 }, () => S.lifeRing(M, { r: 0.33 }));
      M.callout('LIFE RING', 2, [xr, near * (hw * 0.92 + 0.1), tierTop + whH * 0.3], 0.8);
    });
    // roof gear: mast, radar, searchlight, horn, whips
    const mastX = mastFwd ? WH.fx - 0.4 : wx0 + 0.5;
    M.part('MAST', () => {
      M.at(mastX, 0, WH.roofZ, () => S.mast(M, { h: mastH, radar: radarLen, radarYaw, lamps: 3, stays: [[-1.4, hw * 0.8, 0], [-1.4, -hw * 0.8, 0]].map((p) => [p[0], p[1], p[2]]) }));
      M.callout('SIGNAL MAST', 1, [mastX, 0, WH.roofZ + mastH * 0.82], 1.4);
      M.callout('RADAR SCANNER', 1, [mastX, 0, WH.roofZ + mastH * 0.5 + 0.2], 1.6);
      M.info.centers = [[[mastX, 0, WH.roofZ - 0.5], [mastX, 0, WH.roofZ + mastH + 1]]];
    });
    M.part('SEARCHLIGHT', () => {
      for (const sd of [1, -1]) M.at(wx1 - 0.3, sd * hw * 0.6, WH.roofZ, () => M.rz(sd * 20, () => K.searchlight(M, { r: 0.2 })));
      M.at(wx1 - 0.6, 0, WH.roofZ, () => K.horn(M, { r: 0.14 }));
      M.at(wx0 + 0.3, near * hw * 0.7, WH.roofZ, () => K.whip(M, { h: 4, lean: 8 }));
      M.callout('SEARCHLIGHT', 2, [wx1 - 0.3, near * hw * 0.6, WH.roofZ + 0.3], 0.9);
    });

    // ------------------------------------------------ funnels
    const fx = v === 'light' ? hx0 + (hx1 - hx0) * 0.35 : Math.max(hx0 + funR + 0.2, wx0 - funR * 1.3);
    if (!funFlat) {
      const funH2 = Math.max(funH, WH.roofZ - roofZ + funExtra);
      M.part('FUNNEL', () => {
        const ys = nFun === 2 ? [-hw * 0.5, hw * 0.5] : [0];
        for (const y of ys) M.at(fx, y, roofZ, () => S.funnel(M, { r: funR, h: funH2, ratio: funRatio, rake: funRake, shape: funShape, bands: funBands, cowl: v !== 'paddle', pipes: nFun === 2 ? 1 : 2 }));
        M.callout(nFun === 2 ? 'TWIN FUNNEL' : 'FUNNEL', nFun, [fx, ys[0], roofZ + funH2 * 0.6], 2);
      });
    }

    // ------------------------------------------------ the variant's idea
    const aftX = H.xaD + L * 0.1;
    const aftDeckX0 = H.xaD + L * 0.08, aftDeckX1 = hx0 - 0.4;
    if (v === 'fire') {
      M.part('MONITOR TOWER', () => {
        const tx = (wx0 + fx) / 2 > hx0 + 1 ? Math.min(wx0 - 0.8, fx - funR * 1.4 - 0.6) : wx0 - 0.8;
        const tw = Math.min(1.2, hw * 0.7);
        K.girder(M, [tx, 0, roofZ], [tx, 0, roofZ + monitorH], { w: tw, sec: 4 });
        const pz = roofZ + monitorH;
        M.box([tx - tw, -tw, pz], [tx + tw, tw, pz + 0.12], { isect: false });
        K.railing(M, [[tx - tw, -tw, pz + 0.12], [tx + tw, -tw, pz + 0.12], [tx + tw, tw, pz + 0.12], [tx - tw, tw, pz + 0.12], [tx - tw, -tw, pz + 0.12]], { h: 0.9, posts: 0.8 });
        for (const sd of [1, -1]) M.at(tx + tw * 0.4, sd * tw * 0.5, pz + 0.12, () => monitor(M, { r: 0.13, yaw: sd * 15, pitch: 25 }));
        // riser pipe up the tower
        K.pipeRun(M, [[tx + tw * 0.3, tw * 0.3, roofZ], [tx + tw * 0.3, tw * 0.3, pz]], 0.1);
        M.callout('MONITOR TOWER', 1, [tx, 0, roofZ + monitorH * 0.5], 2.6);
        M.callout('WATER MONITOR', 4, [tx + tw * 0.4, near * tw * 0.5, pz + 0.6], 2.2);
      });
      M.part('WATER MONITOR', () => {
        const x = H.xfD - L * 0.18;
        M.at(x, 0, dz(x), () => monitor(M, { r: 0.12, yaw: 0, pitch: 20 }));
        M.at(wx1 - 0.9, -near * hw * 0.5, WH.roofZ, () => monitor(M, { r: 0.1, yaw: -near * 20, pitch: 15 }));
      });
    }
    if (v === 'light') {
      M.part('LANTERN TOWER', () => {
        const tx = L * 0.08, z0 = dz(tx) - 0.05;
        let top;
        if (lanternLattice) { K.girder(M, [tx, 0, z0], [tx, 0, z0 + lanternH], { w: 1.2, sec: 4 }); top = z0 + lanternH; }
        else {
          const T = M.cone(0.55, 0.4, z0, z0 + lanternH);
          if (M.decorOn) { T.lat.shade({ gap: 1.6 }); for (let k = 1; k < 5; k++) T.lat.ring(k / 5, { w: 1 }); }
          K.ladderAlong(M, [tx + 0.5, 0, z0], [tx + 0.42, 0, z0 + lanternH], { w: 0.4 });
          top = z0 + lanternH;
        }
        lantern(M, tx, top, 0.9);
        M.callout('LANTERN TOWER', 1, [tx, 0, z0 + lanternH * 0.5], 3);
        M.callout('LANTERN', 1, [tx, near * 0.9, top + 0.9], 2.8);
        // fog signal and a daymark ball on the after mast
        M.at(tx - 1.6, 0, dz(tx - 1.6), () => { M.cyl(0.15, 0, 1.2); M.at(0, 0, 1.2, () => K.horn(M, { r: 0.35 })); });
        M.callout('FOG HORN', 1, [tx - 1.2, 0, dz(tx - 1.6) + 1.2], 1.2);
      });
    }
    if (v === 'post') {
      M.part('SIGN BOARD', () => {
        const sx0 = hx0 + (hx1 - hx0) * 0.15, sx1 = Math.min(wx0 - 0.4, hx0 + (hx1 - hx0) * 0.62);
        const sh = 1.3;
        for (const x of [sx0 + 0.3, sx1 - 0.3]) M.boxc([x, 0, roofZ + 0.5], [0.12, 0.12, 1.0], { isect: false });
        const SB = M.box([sx0, -0.08, roofZ + 1.0], [sx1, 0.08, roofZ + 1.0 + sh]);
        for (const k of ['+y', '-y']) {
          const f = SB.f(k);
          if (!f.on) continue;
          K.frame(f, f.box, { inset: 2.5 });
          const word = clinic ? 'CLINIC' : 'POST';
          const ch = f.h * 0.5;
          const tw = f.textWidth(word, ch);
          if (clinic) {
            const c = f.w / 2 - f.h * 0.55, q = f.h * 0.14, Q = f.h * 0.36;
            const cross = [[c - q, -Q], [c + q, -Q], [c + q, -q], [c + Q, -q], [c + Q, q], [c + q, q], [c + q, Q], [c - q, Q], [c - q, q], [c - Q, q], [c - Q, -q], [c - q, -q]];
            f.path(cross, { closed: true, w: 1 }); f.hatch(cross, { angle: 45, gap: 1.2, w: 0 });
            K.stencil(f, word, -f.h * 0.5, 0, Math.min(ch, (f.w - f.h * 1.4) / (tw / ch) * 0.9));
          } else K.stencil(f, word, 0, 0, Math.min(ch, f.w * 0.8 / (tw / ch)));
        }
        M.callout('SIGN BOARD', 1, [(sx0 + sx1) / 2, near * 0.1, roofZ + 1.0 + sh * 0.8], 2.6);
        // awning over the after deck
        const ax0 = H.xaD + L * 0.1, ax1 = hx0;
        const az0 = dz(ax0) + 2.2, az1 = roofZ;
        for (const x of [ax0, (ax0 + ax1) / 2]) for (const sd of [1, -1]) M.tube([x, sd * (hw - 0.1), dz(x)], [x, sd * (hw - 0.1), az0 + (az1 - az0) * (x - ax0) / (ax1 - ax0)], 0.05, { isect: false });
        const AW = M.loft([[ax0, -hw - 0.2, az0], [ax1, -hw - 0.2, az1], [ax1, hw + 0.2, az1], [ax0, hw + 0.2, az0]], [[ax0, -hw - 0.2, az0 + 0.06], [ax1, -hw - 0.2, az1 + 0.06], [ax1, hw + 0.2, az1 + 0.06], [ax0, hw + 0.2, az0 + 0.06]], { isect: false });
        const af = AW.f('b');
        if (af.on) { const n = 9; for (let k = 1; k < n; k++) { const y = -af.h / 2 + af.h * k / n; af.line(-af.w / 2, y, af.w / 2, y, { w: 0 }); } for (let k = 0; k < n; k += 2) af.hatch([-af.w / 2, -af.h / 2 + af.h * k / n, af.w / 2, -af.h / 2 + af.h * (k + 1) / n], { angle: 0, gap: 1.6, w: 0 }); }
        M.callout('AWNING', 1, [(ax0 + ax1) / 2, 0, (az0 + az1) / 2 + 0.1], 1.4);
      });
    }
    if (v === 'paddle') {
      M.part('PADDLE BOX', () => {
        const px = (hx0 + hx1) / 2 - L * 0.02;
        const R = Math.min(F + 1.6, B * 0.42);
        for (const sd of [1, -1]) paddleBox(M, H, px, sd, R, B * 0.32, near);
        M.callout('PADDLE BOX', 2, [px, near * (hb(px) + B * 0.32), dz(px) + R * 0.5], 3);
        M.callout('PADDLE WHEEL', 2, [px + R * 0.4, near * (hb(px) + B * 0.16), S.WZ + 0.2], 2);
      });
    }

    // ------------------------------------------------ equipment
    if (eq.has('winch')) {
      M.part('TOWING WINCH', () => {
        const x = Math.max(aftDeckX0 + 1.5, hx0 - 1.3), z = dz(x);
        const wr = Math.min(0.5, B * 0.06), ww = B * 0.36;
        M.box([x - wr * 1.4, -ww / 2 - 0.3, z - 0.05], [x + wr * 1.4, ww / 2 + 0.3, z + 0.18], {});
        for (const sd of [1, -1]) M.box([x - wr * 1.2, sd * (ww / 2 + 0.06), z], [x + wr * 1.2, sd * (ww / 2 + 0.24), z + wr * 2.8], {});
        K.winch(M, { r: wr, w: ww, at: [x, 0, z + wr * 1.6] });
        M.boxc([x, -near * (ww / 2 + 0.55), z + wr], [wr * 1.6, 0.5, wr * 1.6]);
        // the tow wire over the stern and down into the water
        const sx = H.xaD + 0.1, sz = dz(H.xaD + 0.3) + bulH + 0.1;
        M.line([[x, 0, z + wr * 2.6], [sx + 0.3, 0, sz], [sx - 3, 0, S.WZ + 0.6], [sx - 7, 0, S.WZ]], { w: 1, pass: 1, fit: false });
        M.callout('TOWING WINCH', 1, [x, near * ww * 0.3, z + wr * 2.6], 2.4);
      });
    }
    if (eq.has('hook')) {
      M.part('TOWING HOOK', () => {
        const x = (aftDeckX0 + aftDeckX1) / 2 + L * 0.03, z = dz(x);
        M.cyl(0.25, z - 0.05, z + 0.9);
        M.cyl(0.32, z + 0.9, z + 1.05);
        M.box([x - 1.1, -0.12, z + 0.95], [x, 0.12, z + 1.2]);
        const hp = [];
        for (let k = 0; k <= 8; k++) { const a = (-40 + 230 * k / 8) * D2R; hp.push([x - 1.25 + Math.sin(a) * 0.18, 0, z + 0.88 - Math.cos(a) * 0.18 + 0.1]); }
        M.pipe([[x - 1.05, 0, z + 1.05], ...hp], 0.05, { isect: false });
        M.callout('TOWING HOOK', 1, [x - 0.5, 0, z + 1.1], 2);
      });
    }
    if (eq.has('arches') || (v === 'harbor' && eq.has('hook') && eq.has('winch'))) {
      M.part('TOW ARCH', () => {
        const xs = [aftDeckX0 + (aftDeckX1 - aftDeckX0) * 0.25, aftDeckX0 + (aftDeckX1 - aftDeckX0) * 0.7];
        for (const x of xs) {
          const s = H.sOf(x);
          const yb = H.yD(s) - 0.15, z0 = H.zS(s);
          const pts = [];
          for (let k = 0; k <= 12; k++) { const a = Math.PI * k / 12; pts.push([x, Math.cos(a) * yb, z0 + bulH * 0.7 + Math.sin(a) * (bulH + 0.6)]); }
          M.pipe([[x, yb, z0], ...pts, [x, -yb, z0]], 0.09, { isect: false, smoothBends: true });
        }
        M.callout('TOW ARCH', xs.length, [xs[0], 0, H.zS(H.sOf(xs[0])) + bulH * 1.7 + 0.6], 1.8);
      });
    }
    M.part('BITT', () => {
      for (const x of [H.xaD + L * 0.07, H.xfD - L * 0.16]) for (const sd of [1, -1]) {
        const s = H.sOf(x);
        M.at(x, sd * (H.yD(s) - 0.6), H.zS(s) - 0.02, () => S.bitt(M, { r: 0.13 }));
      }
      M.callout('MOORING BITT', 4, [H.xaD + L * 0.07, near * (H.yD(0.07) - 0.6), H.zS(0.07) + 0.3], 1);
    });
    if (eq.has('tires') || v === 'harbor') {
      M.part('TIRE FENDER', () => {
        S.tires(M, H, BW, { n: nTires, s0: 0.15, s1: 0.82, r: Math.min(0.42, F * 0.22), t: 0.7 });
        M.callout('TIRE FENDER', nTires * 2, H.P(0.15, 0.7, near), 1.5);
      });
    }
    if (eq.has('bowFender')) {
      M.part('BOW FENDER', () => { S.bowFender(M, H, { r: Math.min(0.42, B * 0.05) }); M.callout('BOW FENDER', 1, H.P(1, 0.6, near), 2); });
    }
    if (eq.has('lifeboat')) {
      M.part('LIFEBOAT', () => {
        const lx = (hx0 + Math.min(fx - funR - 0.3, wx0)) / 2 + 0.3;
        const ll = Math.min(L * 0.18, Math.max(3, (wx0 - hx0) * 0.8), 5);
        M.with({ at: [lx, lifeSide * (hw + 0.05), roofZ], rz: lifeSide > 0 ? 0 : 180 }, () => S.lifeboat(M, { len: ll, hz: 1.0 }));
        M.callout('LIFEBOAT', 1, [lx, lifeSide * (hw + ll * 0.18), roofZ + 1.0 + ll * 0.3], 1.8);
      });
    } else if (eq.has('raft')) {
      M.part('LIFE RAFT', () => {
        const n = 2;
        for (let k = 0; k < n; k++) {
          const x = hx0 + 0.6 + k * 0.9;
          M.box([x - 0.35, near * (hw - 0.5) - 0.35, roofZ], [x + 0.35, near * (hw - 0.5) + 0.35, roofZ + 0.15], { isect: false });
          M.at(x, near * (hw - 0.5), roofZ + 0.5, () => K.tankCapsule(M, { r: 0.32, len: 1.2, axis: 'y' }));
        }
        M.callout('LIFE RAFT', n, [hx0 + 0.6, near * (hw - 0.5), roofZ + 0.8], 1.4);
      });
    }
    if (eq.has('raft') && eq.has('lifeboat')) {
      M.part('LIFE RAFT', () => {
        const x = hx1 - 0.6;
        M.at(x, -lifeSide * (hw - 0.45), roofZ + 0.45, () => K.tankCapsule(M, { r: 0.3, len: 1.1, axis: 'y' }));
        M.box([x - 0.3, -lifeSide * (hw - 0.45) - 0.4, roofZ], [x + 0.3, -lifeSide * (hw - 0.45) + 0.4, roofZ + 0.15], { isect: false });
        M.callout('LIFE RAFT', 1, [x, -lifeSide * (hw - 0.45), roofZ + 0.75], 1.3);
      });
    }
    if (eq.has('windlass') || v === 'light') {
      M.part('WINDLASS', () => {
        const x = H.xfD - L * 0.12 - rake * 0.3, z = dz(x);
        M.box([x - 0.5, -0.7, z - 0.05], [x + 0.4, 0.7, z + 0.35]);
        K.winch(M, { r: 0.22, w: 1.1, at: [x - 0.05, 0, z + 0.55] });
        for (const sd of [1, -1]) {
          const hz = H.P(0.9, 1, sd);
          M.line([[x + 0.2, sd * 0.55, z + 0.4], [hz[0] - 0.3, hz[1] * 0.8, hz[2] + 0.05]], { w: 1, pass: 1 });
          M.line([[x + 0.2, sd * 0.45, z + 0.4], [hz[0] - 0.3, hz[1] * 0.75, hz[2] + 0.05]], { w: 0, pass: 1 });
        }
        M.callout('ANCHOR WINDLASS', 1, [x, 0, z + 0.7], 1.3);
      });
    }
    M.part('BOWER ANCHOR', () => S.anchor(M, H, { s: 0.88, t: 0.76, size: Math.min(1.2, B * 0.11) }));
    if (eq.has('crane')) {
      M.part('SALVAGE CRANE', () => {
        const x = aftDeckX0 + (aftDeckX1 - aftDeckX0) * 0.45, z = dz(x);
        M.at(x, -near * B * 0.15, z, () => M.rz(180 + craneYaw, () => K.crane(M, { len: L * 0.3, rise: craneRise, r: B * 0.07 })));
        M.callout('SALVAGE CRANE', 1, [x, -near * B * 0.15, z + B * 0.12], 2.6);
      });
    }
    if (eq.has('pumps')) {
      M.part('SALVAGE PUMP', () => {
        const x = aftDeckX0 + 1.4, z = dz(x);
        for (const sd of [1, -1]) {
          M.at(x, sd * B * 0.22, z, () => { M.box([-0.6, -0.4, -0.05], [0.6, 0.4, 0.2]); M.at(0, 0, 0.6, () => K.tankCapsule(M, { r: 0.4, len: 1.4, axis: 'x' })); });
          K.pipeRun(M, [[x + 0.7, sd * B * 0.22, z + 0.6], [x + 1.4, sd * B * 0.22, z + 0.6], [x + 1.4, sd * B * 0.22, z + 1.3]], 0.08);
        }
        M.callout('SALVAGE PUMP', 2, [x, near * B * 0.22, z + 1.0], 1.5);
      });
    }
    if (eq.has('reels')) {
      M.part('HOSE REEL', () => {
        const x = aftDeckX0 + (aftDeckX1 - aftDeckX0) * 0.5, z = dz(x);
        for (const sd of [1, -1]) {
          M.box([x - 0.5, sd * B * 0.2 - 0.5, z - 0.05], [x + 0.5, sd * B * 0.2 + 0.5, z + 0.12]);
          K.winch(M, { r: 0.42, w: 0.6, at: [x, sd * B * 0.2, z + 0.6] });
        }
        M.callout('HOSE REEL', 2, [x, near * B * 0.2, z + 1.0], 1.4);
      });
    }
    if (eq.has('workboat')) {
      M.part('WORK BOAT', () => {
        const wl = Math.min(4.2, (aftDeckX1 - aftDeckX0) * 0.5);
        const x = aftDeckX0 + wl * 0.6 + 0.4, z = dz(x);
        for (const k of [-0.3, 0.3]) M.box([x + k * wl - 0.12, -0.55, z - 0.05], [x + k * wl + 0.12, 0.55, z + 0.35]);
        M.at(x, 0, z + 0.25, () => {
          const BH = S.hull(M, { L: wl, B: wl * 0.38, F: wl * 0.17, z0: 0, rake: wl * 0.08, over: wl * 0.05, stern: 'transom', ss0: 0.2, kt: 0.75, pb: 1.8, wl: 0.3, wlk: 1, flare: 0.3, bulge: 0.25, tumble: 0, sheerBow: wl * 0.06, sheerStern: 0.02, n: 16, m: 4, part: 'WORK BOAT', isect: false });
          S.runS(M, BH, 0.75, 0.02, 0.97, 1, { w: 1 }); S.runS(M, BH, 0.75, 0.02, 0.97, -1, { w: 1 });
          M.at(-wl * 0.38, 0, wl * 0.17 - 0.05, () => M.boxc([0, 0, 0.25], [0.35, 0.3, 0.5]));
        });
        M.callout('WORK BOAT', 1, [x, 0, z + 0.25 + wl * 0.17], 2.2);
      });
    }

    // ------------------------------------------------ water and landing stage
    S.waves(M, H, { rng: M.rng, n: 12 });
    const stg = S.landingStage(M, { at: [stageX, near * (H.halfB(stageX) + stageGap + 1.2)], rz: near > 0 ? 180 : 0 });
    // mooring line from the stage to the nearest bitt
    M.part('MOORING LINE', () => {
      const bx = stageX < 0 ? H.xaD + L * 0.07 : H.xfD - L * 0.16;
      const s = H.sOf(bx);
      const a = stg.bollard, b = [bx, near * (H.yD(s) - 0.6), H.zS(s) + 0.3];
      const pts = [];
      for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - Math.sin(Math.PI * t) * 0.6]); }
      M.line(pts, { w: 1, pass: 1 });
    });

    // ------------------------------------------------ vocabulary
    const W = word(crew);
    const has = (k) => eq.has(k);
    const gear = has('lifeboat') ? 'a lifeboat' : has('workboat') ? 'a work boat' : has('raft') ? 'two life rafts' : 'a radar mast';
    let job, form, brief;
    switch (v) {
      case 'harbor':
        job = 'TOWING'; form = has('bowFender') ? 'PUSHER TUG' : 'TUG';
        brief = has('bowFender') ? `Pushes ships into their berths and carries ${gear}.` : has('winch') ? `Tows ships off the quay with ${pull} t of pull and carries ${gear}.` : `Tows ships on a hook and carries ${gear}.`;
        break;
      case 'salvage': job = 'SALVAGE'; form = 'TUG'; brief = has('pumps') ? `Tows wrecks in, lifts with a crane and pumps out flooded holds.` : `Tows wrecks in and lifts wreckage with a deck crane.`; break;
      case 'fire': job = 'FIRE'; form = 'TUG'; brief = `Fights pier fires from a tower with ${has('reels') ? 'monitors and hose reels' : 'four water monitors'}.`; break;
      case 'pilot': job = 'PILOT'; form = 'BOAT'; brief = `Carries ${W} pilots out to ships at ${knots} knots.`; break;
      case 'ice': job = 'ICEBREAKING'; form = 'TUG'; brief = `Breaks harbor ice with a raked bow and tows ships through it.`; break;
      case 'paddle': job = 'TOWING'; form = 'PADDLE TUG'; brief = `Tows barges in shallow water on two side paddle wheels.`; break;
      case 'light': job = 'LIGHT'; form = 'VESSEL'; brief = `Marks the ${station} shoal with a lantern and a fog horn.`; break;
      default: job = clinic ? 'CLINIC' : 'MAIL'; form = 'BOAT'; brief = clinic ? `Carries a doctor and ${W} beds to villages along the water.` : `Sorts and delivers mail to landings along the water.`;
    }
    if (place.length + job.length + form.length + 2 > 34) form = 'TUG';
    return {
      place, job, form, brief,
      specs: [['DISPLACEMENT', `${mass} T`], ['CREW', String(crew)], ['POWER', `${kw} KW`], v === 'harbor' || v === 'salvage' || v === 'ice' ? ['BOLLARD PULL', `${pull} T`] : ['SPEED', `${knots} KN`]],
      figure: stg.spot,
    };
  },
};

// water monitor: swivel base, elbow and nozzle aimed along +x, raised by pitch
function monitor(M, o) {
  const r = o.r ?? 0.12;
  M.cyl(r * 1.5, 0, r * 0.8);
  M.rz(o.yaw || 0, () => {
    M.cyl(r, r * 0.8, r * 3);
    M.at(0, 0, r * 3, () => M.ry(-(o.pitch || 20), () => {
      M.sphere(r * 1.2);
      M.ry(90, () => { M.cyl(r, 0, r * 5); M.cone(r, r * 0.5, r * 5, r * 7.5); });
    }));
  });
}

// glazed lantern house with gallery and dome, on top of a tower at (x, 0, z)
function lantern(M, x, z, r) {
  M.at(x, 0, z, () => {
    M.cyl(r * 1.4, 0, 0.15);
    K.railing(M, Array.from({ length: 17 }, (_, i) => { const a = i / 16 * 2 * Math.PI; return [Math.cos(a) * r * 1.32, Math.sin(a) * r * 1.32, 0.15]; }), { h: 0.8, posts: 0.7 });
    const G = M.cyl(r, 0.15, 0.15 + r * 1.3);
    if (M.decorOn) {
      const Lt = G.lat;
      for (let k = 0; k < 10; k++) Lt.meridian(k * 36, 0, 1, { w: 1 });
      Lt.ring(0.15, { w: 1 }); Lt.ring(0.85, { w: 1 });
      Lt.hatch(0, 360, 0.18, 0.82, { gap: 1.3 });
    }
    const D = M.at(0, 0, 0.15 + r * 1.3, () => M.lathe([[r * 1.12, 0], [r * 1.1, r * 0.1], [r * 0.8, r * 0.5], [r * 0.3, r * 0.75], [0, r * 0.8]]));
    if (M.decorOn) D.lat.shade({ gap: 1.6 });
    M.cyl(0.04, 0.15 + r * 2.1, 0.15 + r * 2.8);
    M.at(0, 0, 0.15 + r * 2.9, () => M.sphere(0.12));
  });
}

// paddle box on one side at x: a half-round box outboard of the hull, vents on its face,
// the wheel's lower blades showing below it into the water
function paddleBox(M, H, x, sd, R, Wb, near) {
  const s = H.sOf(x);
  const y0 = H.yD(s) - 0.1, z0 = H.zS(s);
  const zc = z0 - 0.15;
  const prof = [];
  const N = 14;
  for (let k = 0; k <= N; k++) { const a = Math.PI * k / N; prof.push([x + Math.cos(a) * R, zc + Math.sin(a) * R]); }
  const ya = sd * y0, yb = sd * (y0 + Wb);
  const Bx = M.extrude(prof, Math.min(ya, yb), Math.max(ya, yb), { plane: 'xz', smoothDeg: 20 });
  const f = Bx.f(sd > 0 ? '+y' : '-y');
  if (f.on) {
    // radiating vents and a hub boss
    const cx = 0, cy = -f.h / 2;
    const fr = (r) => r;
    for (let k = 1; k < 8; k++) {
      const a = Math.PI * k / 8;
      const p = [cx + Math.cos(a) * R * 0.28, cy + Math.sin(a) * R * 0.28], q = [cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9];
      const d = [-Math.sin(a) * R * 0.05, Math.cos(a) * R * 0.05];
      const poly = [[p[0] - d[0], p[1] - d[1]], [q[0] - d[0] * 2, q[1] - d[1] * 2], [q[0] + d[0] * 2, q[1] + d[1] * 2], [p[0] + d[0], p[1] + d[1]]];
      f.path(poly, { closed: true, w: 1 });
      f.hatch(poly, { angle: 45, gap: 1.3, w: 0 });
    }
    f.circle(cx, cy, fr(R * 0.97), { a0: 0, a1: 180, w: 1 });
    f.circle(cx, cy, R * 0.22, { a0: 0, a1: 180, w: 1 });
  }
  // sponson deck under the box edge
  M.box([x - R * 1.15, Math.min(ya, yb), z0 - 0.35], [x + R * 1.15, Math.max(ya, yb) + 0.05 * sd, z0 - 0.15], {});
  // the lower part of the wheel below the box: two rims, spokes and floats down to the water
  const yc = sd * (y0 + Wb / 2);
  const r1 = R * 0.9;
  const a0 = Math.PI, a1 = 2 * Math.PI;
  for (const yy of [yc - sd * Wb * 0.4, yc + sd * Wb * 0.4]) {
    let run = [];
    for (let k = 0; k <= 24; k++) {
      const a = a0 + (a1 - a0) * k / 24;
      const p = [x + Math.cos(a) * r1, yy, zc + Math.sin(a) * r1];
      if (p[2] > S.WZ) run.push(p); else { if (run.length > 1) M.pipe(run, 0.05, { isect: false }); run = []; }
    }
    if (run.length > 1) M.pipe(run, 0.05, { isect: false });
  }
  const nb = 14;
  for (let k = 0; k < nb; k++) {
    const a = Math.PI + Math.PI * (k + 0.5) / nb;
    const p = [x + Math.cos(a) * r1, yc, zc + Math.sin(a) * r1];
    if (p[2] - 0.1 < S.WZ) continue;
    M.along([x + Math.cos(a) * r1 * 0.75, yc, zc + Math.sin(a) * r1 * 0.75], [x + Math.cos(a) * r1 * 1.02, yc, zc + Math.sin(a) * r1 * 1.02], (l) => M.box([0, -Wb * 0.42, -0.05], [l, Wb * 0.42, 0.05], { isect: false }));
    for (const yy of [yc - sd * Wb * 0.4, yc + sd * Wb * 0.4]) M.tube([x + Math.cos(a) * R * 0.25, yy, zc + Math.sin(a) * R * 0.25], [x + Math.cos(a) * r1, yy, zc + Math.sin(a) * r1], 0.035, { isect: false, shade: false });
  }
  void near;
}
