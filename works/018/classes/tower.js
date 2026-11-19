// classes/tower.js: tall buildings that move. Each is built at its true size and complete as
// architecture (a lighthouse, a smock or tower windmill, a clock tower, a water tower, a fire
// lookout, a factory chimney), stood on a steel base deck with tie-downs, stays, lamps, a
// number plate and a place to drive it from, and then carried by running gear from gear.js.

import * as K from '../kit.js';
import * as B from './parts-build.js';
import { word, thou } from '../words.js';
import { D2R, circlePts } from '../geom.js';

let G = null;
try { G = await import('./gear.js'); } catch (e) { G = null; }
let X = null;
try { X = await import('./extras.js'); } catch (e) { X = null; }

const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const r1 = (x) => Math.round(x * 10) / 10;

// gear: the plan from gear.js, or standing on the ground when it is missing
function gearPlan(M, o) {
  if (G && G.plan) return G.plan(M, o);
  return { kind: 'none', z: 0, family: 'ground', float: false, form: 'ON A BASE', adj: 'MOBILE', goes: 'travels', places: ['COUNTY'], build: () => ({ specs: [], figure: null }) };
}

// a deck plan polygon: 'oct' | 'square' | 'round' (as a 24-gon) of half size R
function deckPlan(kind, R) {
  if (kind === 'square') return [[-R, -R], [R, -R], [R, R], [-R, R]];
  if (kind === 'oct') { const c = R * 0.38; return [[-R + c, -R], [R - c, -R], [R, -R + c], [R, R - c], [R - c, R], [-R + c, R], [-R, R - c], [-R, -R + c]]; }
  return circlePts(0, 0, R, R, 24);
}

// the common fit-out on the base deck: tie-downs from the building foot, lamps fore and aft,
// stays, a boarding ladder down to the ground (or stowed under air gear), the number plate
function fitOut(M, ctx, o) {
  const { g } = ctx;
  const dz = o.deckH;
  const R = o.deckR;
  // tie-downs: straps from lugs on the building foot to eyes on the deck
  M.part('TIE-DOWN STRAP', () => {
    const n = o.ties ?? 8;
    for (let i = 0; i < n; i++) {
      const a = (i + 0.5) * 2 * Math.PI / n + (o.tieRot ?? 0);
      const rf = o.footR(a);
      const top = [Math.cos(a) * rf, Math.sin(a) * rf, dz + (o.tieH ?? 0.5)];
      const rb = rf + (o.tieOut ?? 0.7);
      B.tieDown(M, top, [Math.cos(a) * rb, Math.sin(a) * rb, dz]);
    }
    M.callout('TIE-DOWN STRAP', n, [o.footR(0.4) + 0.3, 0, dz + 0.3], 1.1);
  });
  // lamps on the deck edge
  M.part('LAMP', () => {
    for (const s of [1, -1]) {
      M.at(R * 0.92, s * R * 0.55, dz, () => { M.cyl(0.05, 0, 0.45, { isect: false }); M.at(0, 0, 0.55, () => K.lamp(M, { r: 0.14 })); });
      M.at(-R * 0.92, s * R * 0.55, dz, () => { M.cyl(0.05, 0, 0.35, { isect: false }); M.at(0, 0, 0.42, () => M.rz(180, () => K.lamp(M, { r: 0.1 }))); });
    }
    M.callout('ROAD LAMP', 4, [R * 0.92, R * 0.55 * Math.sign(M.view.e[1] || 1), dz + 0.55], 0.9);
  });
  // stays to a collar on the shaft
  if (o.stays) {
    M.part('STAY', () => {
      const feet = [];
      const a0 = (B.viewAz(M) + 45) * D2R;
      for (let i = 0; i < 4; i++) { const a = a0 + i * Math.PI / 2; const k = o.stayK ? o.stayK(a) : 1; feet.push([Math.cos(a) * R * 0.86 * k, Math.sin(a) * R * 0.86 * k, dz]); }
      B.stays(M, feet, o.stays.r, o.stays.z, { r: Math.max(0.05, R * 0.012) });
      M.callout('STAY', 4, [feet[0][0] * 0.6, feet[0][1] * 0.6, dz + (o.stays.z - dz) * 0.4], 1.2);
    });
  }
  // boarding ladder on the door side
  let fig = null;
  if (g.family !== 'air' && g.z >= 0.7) M.part('BOARDING LADDER', () => {
    const a = o.ladderAz * D2R;
    const p = [Math.cos(a) * (R + 0.1), Math.sin(a) * (R + 0.1)];
    M.with({ at: [p[0], p[1], dz], rz: o.ladderAz }, () => { const r = B.boardingLadder(M, g.z + dz, { w: 0.55 }); fig = [r.foot[0], r.foot[1]]; });
    M.callout('BOARDING LADDER', 1, [p[0], p[1], dz * 0.5 - g.z * 0.4], 1.4);
  });
  return fig;
}

// ================================================================== LIGHTHOUSE
const lighthouse = {
  name: 'LIGHTHOUSE',
  plan(M) {
    const p = {};
    p.R0 = M.r(2.2, 3.2);
    p.R1 = p.R0 * M.r(0.56, 0.7);
    p.Hs = M.r(13, 21);
    p.curved = M.chance(0.45);
    p.paint = M.wpick([[3, 'bands'], [1.4, 'top'], [1, 'plain']]);
    p.nb = M.ri(2, 4);
    p.plinth = M.pick(['round', 'oct', 'square']);
    p.hp = M.r(0.8, 1.35);
    p.Rp = p.R0 + M.r(0.7, 1.2);
    p.gw = M.r(0.9, 1.3);
    p.nl = M.pick([10, 12, 14]);
    p.Rl = p.R1 * M.r(0.66, 0.78);
    p.hl = M.r(1.9, 2.6);
    p.diag = M.chance(0.65);
    p.roof = M.pick(['dome', 'cone', 'dome']);
    p.horn = M.chance(0.5);
    p.corbel = M.pick(['flare', 'brackets']);
    p.drive = M.pick(['wheel', 'cab']);
    p.stays = M.chance(0.55);
    p.deck = M.pick(['oct', 'round', 'square']);
    p.winStep = M.r(75, 115);
    p.flash = M.pick([5, 10, 12, 15, 20]);
    p.range = M.ri(12, 24);
    p.vaneDir = M.r(0, 360);
    p.nSteps = Math.max(4, Math.round(p.hp / 0.18));
    const stepLen = p.nSteps * 0.26;
    p.deckR = p.Rp + Math.max(stepLen + 0.5, p.drive === 'cab' ? 2.4 : 0) + M.r(0.3, 1.0);
    p.deckH = 0.5;
    p.zp = p.deckH + p.hp;
    p.zg = p.zp + p.Hs;
    p.Rg = p.R1 + p.gw;
    p.hr = p.Rl * M.r(0.75, 0.95);
    p.H = p.zg + 1.0 + p.hl + p.hr + 2.4;
    p.box = { len: p.deckR * 2, wid: p.deckR * 2, hgt: p.H, mass: Math.round(p.R0 * p.R0 * p.Hs * 2.2), round: true };
    return p;
  },
  build(M, p, ctx) {
    const aE = B.viewAz(M);
    const doorAz = Math.round(aE / 90) * 90;          // door on the axis facing the viewer most
    const zs0 = p.zp, zs1 = p.zg;
    const rAt = (z) => { const t = (z - zs0) / (zs1 - zs0); return p.curved ? p.R1 + (p.R0 - p.R1) * (1 - t) ** 1.7 : p.R0 + (p.R1 - p.R0) * t; };
    // ---------------- base deck
    M.part('BASE DECK', () => {
      const D = B.baseDeck(M, deckPlan(p.deck, p.deckR), p.deckH);
      const f = D.f(p.deck === 'square' ? 's1' : p.deck === 'oct' ? 's2' : 's0');
      void f;
      M.callout('BASE DECK', 1, [p.deckR * 0.95, 0, p.deckH * 0.5], 1.0);
    });
    // ---------------- plinth
    M.part('PLINTH', () => {
      let P;
      if (p.plinth === 'round') {
        P = M.cyl(p.Rp, p.deckH, p.zp);
        if (M.decorOn) { const L = P.lat; const n = Math.max(2, Math.round(p.hp / 0.4)); for (let i = 1; i < n; i++) L.ring(i / n, { w: 0 }); for (let i = 0; i < 32; i++) L.meridian(i * 360 / 32 + (i % 2) * 5, 0, 1 / n, { w: 0 }); L.shade({ gap: 1.8 }); }
      } else {
        const n = p.plinth === 'oct' ? 8 : 4;
        P = B.polyLathe(M, [[p.Rp / Math.cos(Math.PI / n), p.deckH], [p.Rp / Math.cos(Math.PI / n), p.zp]], n);
        if (M.decorOn) for (let i = 0; i < n; i++) { const f = P.facet(0, i); B.courses(f, f.box, { kind: 'stone' }); }
      }
      // coping
      M.at(0, 0, p.zp, () => M.cyl(p.Rp + 0.08, -0.12, 0.0, { isect: false }));
      // railing round the walk on the plinth
      B.ringRail(M, p.Rp - 0.12, p.zp, { h: 0.95, pitch: 1.1, r: 0.025 });
      M.callout('PLINTH', 1, [p.Rp, 0, p.deckH + p.hp * 0.5], 0.9);
    });
    // ---------------- steps up the plinth to the door
    M.part('ENTRANCE STEPS', () => {
      M.with({ at: [Math.cos(doorAz * D2R) * (p.Rp - 0.02), Math.sin(doorAz * D2R) * (p.Rp - 0.02), p.deckH], rz: doorAz }, () => {
        const st = B.steps(M, { n: p.nSteps, rise: p.hp / p.nSteps, run: 0.26, w: 1.3, cheeks: true });
        void st;
      });
      M.callout('ENTRANCE STEPS', 1, [Math.cos(doorAz * D2R) * (p.Rp + 0.6), Math.sin(doorAz * D2R) * (p.Rp + 0.6), p.deckH + p.hp * 0.5], 1.0);
    });
    // ---------------- shaft
    let shaft;
    M.part('TOWER', () => {
      const prof = [];
      const n = p.curved ? 8 : 1;
      for (let i = 0; i <= n; i++) { const z = zs0 + (zs1 - zs0) * i / n; prof.push([rAt(z), z]); }
      prof[0][1] = zs0 - 0.05;
      shaft = M.lathe(prof, { sharpDeg: 20 });
      const L = shaft.lat;
      if (M.decorOn) {
        const A0 = aE - 100, A1 = aE + 100;
        // masonry courses, faint
        const nc = Math.round(p.Hs / 0.7);
        if (p.Hs / nc / M.px > 5) for (let i = 1; i < nc; i++) L.ring(i / nc, { w: 0, a0: A0, a1: A1 });
        // painted bands
        const bands = [];
        if (p.paint === 'bands') { const m = p.nb * 2 + 1; for (let i = 1; i < m; i += 2) bands.push([i / m, (i + 1) / m]); }
        else if (p.paint === 'top') bands.push([0.62, 1]);
        for (const [t0, t1] of bands) {
          L.ring(t0, { w: 1, a0: A0, a1: A1 }); if (t1 < 1) L.ring(t1, { w: 1, a0: A0, a1: A1 });
          L.hatch(A0 + 8, A1 - 8, t0, t1, { gap: 1.35 });
        }
        L.shade({ gap: 1.7, gapMax: 6 });
        // stair windows spiraling up
        const nw = Math.max(3, Math.floor((p.Hs - 3) / 2.6));
        for (let i = 0; i < nw; i++) {
          const z = zs0 + 3.2 + i * (p.Hs - 4.2) / Math.max(1, nw - 1);
          const t = (z - zs0) / (zs1 - zs0);
          const a = doorAz + 50 + i * p.winStep;
          const inBand = bands.some(([t0, t1]) => t > t0 - 0.02 && t < t1 + 0.02);
          void inBand;
          B.latheWindow(L, a, t, 0.5, 0.85);
        }
        // the door at the foot
        B.latheDoor(L, doorAz, 0.05 / (zs1 - zs0 + 0.05), 1.0, 2.1);
      }
      M.callout('TOWER', 1, [rAt(zs0 + p.Hs * 0.35) * Math.cos(aE * D2R), rAt(zs0 + p.Hs * 0.35) * Math.sin(aE * D2R), zs0 + p.Hs * 0.35], 0.8);
      M.callout('ENTRANCE DOOR', 1, [Math.cos(doorAz * D2R) * p.R0, Math.sin(doorAz * D2R) * p.R0, zs0 + 1.2], 1.2);
      if (p.paint !== 'plain') M.callout('DAYMARK BAND', p.paint === 'bands' ? p.nb : 1, [Math.cos(aE * D2R) * rAt(zs0 + p.Hs * 0.7), Math.sin(aE * D2R) * rAt(zs0 + p.Hs * 0.7), zs0 + p.Hs * (p.paint === 'bands' ? (2 / (p.nb * 2 + 1) + 0.5 / (p.nb * 2 + 1)) : 0.8)], 1.3);
      M.callout('STAIR WINDOW', Math.max(3, Math.floor((p.Hs - 3) / 2.6)), [Math.cos((doorAz + 50) * D2R) * rAt(zs0 + 3.2), Math.sin((doorAz + 50) * D2R) * rAt(zs0 + 3.2), zs0 + 3.2], 0.7);
    });
    // a hood over the door
    M.with({ at: [Math.cos(doorAz * D2R) * (p.R0 - 0.1), Math.sin(doorAz * D2R) * (p.R0 - 0.1), zs0], rz: doorAz }, () => {
      M.box([0, -0.75, 2.25], [0.55, 0.75, 2.4], { isect: true });
      for (const s of [1, -1]) M.box([-0.3, s * 0.5 - 0.08, 0], [0.12, s * 0.5 + 0.08, 2.25], { isect: true });
      for (const s of [1, -1]) M.tube([0.5, s * 0.65, 2.25], [0.02, s * 0.65, 1.75], 0.03, { isect: false });
    });
    // ---------------- gallery: corbel, deck, railing
    M.part('GALLERY', () => {
      if (p.corbel === 'flare') {
        const C = M.lathe([[rAt(zs1 - 1.4) - 0.01, zs1 - 1.4], [p.R1 + (p.Rg - p.R1) * 0.22, zs1 - 0.75], [p.R1 + (p.Rg - p.R1) * 0.6, zs1 - 0.42], [p.Rg - 0.04, zs1 - 0.25]], { sharpDeg: 60 });
        if (M.decorOn) { C.lat.shade({ gap: 1.6, gapMax: 4 }); for (let i = 0; i < 24; i++) C.lat.meridian(i * 15, 0, 1, { w: 0 }); }
      } else {
        const n = Math.round(2 * Math.PI * p.R1 / 0.9);
        for (let i = 0; i < n; i++) {
          M.rz(i * 360 / n, () => M.extrude([[p.R1 - 0.05, zs1 - 1.2], [p.R1 + 0.1, zs1 - 1.2], [p.Rg - 0.1, zs1 - 0.3], [p.Rg - 0.1, zs1 - 0.25], [p.R1 - 0.05, zs1 - 0.25]], -0.1, 0.1, { plane: 'xz' }));
        }
      }
      const D = M.cyl(p.Rg, zs1 - 0.25, zs1);
      if (M.decorOn && D.top.on) { const f = D.top; f.circle(0, 0, p.Rg * 0.94, { w: 0 }); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; f.line(Math.cos(a) * p.R1, Math.sin(a) * p.R1, Math.cos(a) * p.Rg * 0.94, Math.sin(a) * p.Rg * 0.94, { w: 0 }); } }
      B.ringRail(M, p.Rg - 0.1, zs1, { h: 1.05, pitch: 0.75, r: 0.03 });
      M.callout('GALLERY RAILING', 1, [Math.cos(aE * D2R) * p.Rg, Math.sin(aE * D2R) * p.Rg, zs1 + 1.0], 1.6);
    });
    // ---------------- lantern
    const zl0 = zs1 + 1.0, zl1 = zl0 + p.hl;
    M.part('LANTERN ROOM', () => {
      const ped = B.polyLathe(M, [[p.Rl, zs1], [p.Rl, zl0]], p.nl);
      if (M.decorOn) for (let i = 0; i < p.nl; i++) { const f = ped.facet(0, i); if (f.on && f.front) { K.frame(f, [-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2)]); if (i % 2) f.circle(0, 0, Math.min(f.w, f.h) * 0.2, { w: 1 }); } }
      // glazing: mullions at the corners, rings, diagonal astragals
      const V = (i, z) => { const a = (180 / p.nl + i * 360 / p.nl) * D2R; return [Math.cos(a) * p.Rl, Math.sin(a) * p.Rl, z]; };
      const ring = (z) => { const pts = []; for (let i = 0; i <= p.nl; i++) pts.push(V(i, z)); return pts; };
      const br = 0.035;
      M.pipe(ring(zl0 + 0.04), br * 1.2, { isect: false });
      M.pipe(ring(zl1), br * 1.3, { isect: false });
      for (let i = 0; i < p.nl; i++) M.tube(V(i, zl0), V(i, zl1), br, { isect: false, seg: 6 });
      if (p.diag) {
        const tiers = p.hl > 2.3 ? 2 : 1;
        for (let k = 0; k < tiers; k++) {
          const za = zl0 + p.hl * k / tiers, zb = zl0 + p.hl * (k + 1) / tiers;
          for (let i = 0; i < p.nl; i++) { M.tube(V(i, za), V(i + 1, zb), br * 0.7, { isect: false, seg: 6 }); M.tube(V(i + 1, za), V(i, zb), br * 0.7, { isect: false, seg: 6 }); }
        }
      } else M.pipe(ring(zl0 + p.hl * 0.5), br, { isect: false });
      // the lens inside: a beehive of prism rings on a pedestal
      const rl = p.Rl * 0.55, hz = p.hl * 0.78, z0 = zl0 + 0.12;
      M.cyl(0.18, zs1, z0, { isect: false });
      const lens = M.lathe([[0.2, z0], [rl * 0.75, z0 + hz * 0.06], [rl, z0 + hz * 0.32], [rl, z0 + hz * 0.68], [rl * 0.75, z0 + hz * 0.94], [0.2, z0 + hz]], { sharpDeg: 50 });
      if (M.decorOn) {
        const L = lens.lat;
        const n = Math.max(6, Math.min(16, Math.round(hz / M.px / 4)));
        for (let i = 1; i < n; i++) L.ring(i / n, { w: i === Math.floor(n / 2) ? 1 : 0 });
        for (let i = 0; i < 8; i++) L.meridian(i * 45, 0.05, 0.95, { w: 0 });
        L.shade({ gap: 1.4, gapMax: 3.6 });
      }
      M.callout('LANTERN ROOM', 1, V(Math.round(p.nl * aE / 360), zl0 + p.hl * 0.85), 2.2);
      M.callout('FRESNEL LENS', 1, [0, 0, z0 + hz * 0.5], 1.9);
    });
    // ---------------- lantern roof, ventilator ball, rod and vane
    M.part('VENTILATOR', () => {
      const R = p.Rl * 1.12, h = p.hr;
      const prof = p.roof === 'dome'
        ? [[R, zl1], [R, zl1 + 0.12], [R * 0.95, zl1 + h * 0.28], [R * 0.78, zl1 + h * 0.6], [R * 0.48, zl1 + h * 0.87], [0.16, zl1 + h]]
        : [[R, zl1], [R, zl1 + 0.12], [0.16, zl1 + h]];
      const roof = B.roundRoof(M, prof, { ribs: p.nl, t0: 0.04, t1: 0.98 });
      void roof;
      const zb = zl1 + h;
      M.cyl(0.12, zb - 0.05, zb + 0.25, { isect: false });
      M.at(0, 0, zb + 0.55, () => { const S = M.sphere(0.34); if (M.decorOn) { S.lat.ring(0.5, { w: 1 }); for (let i = 0; i < 8; i++) S.lat.meridian(i * 45, 0.15, 0.85, { w: 0 }); S.lat.shade({ gap: 1.4 }); } });
      if (X && X.weathervane) M.at(0, 0, zb + 0.88, () => X.weathervane(M, { h: 1.5, dir: p.vaneDir }));
      else M.tube([0, 0, zb + 0.88], [0, 0, zb + 2.2], 0.02, { isect: false });
      M.callout('VENTILATOR BALL', 1, [0, 0, zb + 0.55], 1.5);
      M.callout('WEATHERVANE', 1, [0, 0, zb + 1.7], 0.9);
    });
    // ---------------- fog horns on the gallery
    if (p.horn) {
      M.part('FOG HORN', () => {
        const a = (doorAz + 140) * D2R, r = (p.Rl + p.Rg) / 2;
        M.at(Math.cos(a) * r, Math.sin(a) * r, zs1, () => M.rz(doorAz + 140, () => {
          M.box([-0.2, -0.25, 0], [0.2, 0.25, 0.5]);
          for (const s of [1, -1]) M.at(0.15, s * 0.14, 0.65, () => M.ry(-10, () => K.horn(M, { r: 0.22 })));
        }));
        M.callout('FOG HORN', 2, [Math.cos(a) * r, Math.sin(a) * r, zs1 + 0.7], 1.1);
      });
    }
    // ---------------- the driving position
    if (p.drive === 'wheel') {
      M.part("HELMSMAN'S WHEEL", () => {
        const r = (p.Rl + p.Rg) / 2 + 0.05;
        M.at(r, 0, zs1, () => B.shipWheel(M, { r: 0.42, h: 0.95 }));
        M.callout("HELMSMAN'S WHEEL", 1, [r + 0.14, 0, zs1 + 1.1], 1.7);
      });
    } else {
      M.part('DRIVING CAB', () => {
        M.at(p.Rp + 1.15, -p.Rp * 0.35, p.deckH, () => B.driverCab(M, { w: 1.5, d: 1.5, h: 2.0 }));
        M.callout('DRIVING CAB', 1, [p.Rp + 1.9, -p.Rp * 0.35, p.deckH + 1.2], 1.7);
      });
    }
    // ---------------- number plate on the plinth front
    M.part('NUMBER PLATE', () => {
      M.at(p.Rp + 0.02, p.Rp * 0.4, p.deckH + p.hp * 0.5, () => {
        const Bd = M.box([0, -0.55, -0.2], [0.04, 0.55, 0.2], { isect: false });
        const f = Bd.f('+x');
        if (f.on && f.front) { f.rect(-f.w / 2 + f.mOf(1.2), -f.h / 2 + f.mOf(1.2), f.w / 2 - f.mOf(1.2), f.h / 2 - f.mOf(1.2), { w: 0 }); f.text(ctx.des, 0, 0, 0.2); }
      });
      M.callout('NUMBER PLATE', 1, [p.Rp + 0.05, p.Rp * 0.4, p.deckH + p.hp * 0.5], 0.6);
    });
    const fig = fitOut(M, ctx, {
      deckH: p.deckH, deckR: p.deckR * (p.deck === 'round' ? 0.98 : 0.92), footR: () => p.Rp, tieH: p.hp * 0.55, tieOut: 0.55, ties: 8,
      stays: p.stays ? { r: rAt(zs0 + p.Hs * 0.3), z: zs0 + p.Hs * 0.3 } : null, ladderAz: doorAz + 35,
    });
    const job = M.pick(['herring', 'sandbank', 'reef', 'regatta', 'fog']);
    const where = {
      herring: 'Follows the herring north and lights the fleet home.',
      sandbank: 'Moves the light to wherever the sandbank is this year.',
      reef: `Takes its light out to the reef each winter: one flash every ${p.flash} seconds.`,
      regatta: `Marks the turning buoy for regattas; light seen at ${p.range} nautical miles.`,
      fog: p.horn ? 'Goes out to the shoal in fog and sounds two horns every 30 seconds.' : `Stands off the shoal in fog with a light of ${p.range} nautical miles.`,
    }[job];
    return {
      brief: where, fig,
      specs: [['LIGHT RANGE', `${p.range} NM`], ['CHARACTER', `FL ${p.flash} S`]],
      crew: M.ri(2, 3),
      mass: [-p.Rp, -p.Rp, 0, p.Rp, p.Rp, p.H - 2.2],
      places: ['HARBOR', 'COASTAL', 'ESTUARY', 'REEF', 'SHOAL', 'HARBOR'],
    };
  },
};

// square foot: radius of a square of half side h at azimuth a
const sqR = (h) => (a) => h / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
const axisToward = (M) => Math.round(B.viewAz(M) / 90) * 90;
function plate(M, at, rz, text, h = 0.2, w = 1.1) {
  M.with({ at, rz }, () => {
    const Bd = M.box([0, -w / 2, -h], [0.04, w / 2, h], { isect: false });
    const f = Bd.f('+x');
    if (f.on && f.front) { f.rect(-f.w / 2 + f.mOf(1.2), -f.h / 2 + f.mOf(1.2), f.w / 2 - f.mOf(1.2), f.h / 2 - f.mOf(1.2), { w: 0 }); f.text(text, 0, 0, h); }
  });
}
function driveCab(M, at) {
  M.part('DRIVING CAB', () => {
    M.at(at[0], at[1], at[2], () => B.driverCab(M, { w: 1.5, d: 1.5, h: 2.0 }));
    M.callout('DRIVING CAB', 1, [at[0] + 0.75, at[1], at[2] + 1.2], 1.7);
  });
}

// ================================================================== WINDMILL
const windmill = {
  name: 'WINDMILL',
  plan(M) {
    const p = {};
    p.type = M.pick(['smock', 'tower']);
    p.R0 = M.r(3.2, 4.4);
    p.R1 = p.R0 * M.r(0.55, 0.68);
    p.hb = p.type === 'smock' ? M.r(2.6, 4.2) : 0;     // brick base under the smock
    p.Ht = M.r(9, 13);
    p.sails = M.pick(['common', 'patent']);
    p.Rs = M.r(8, 10.5);
    p.phase = M.r(0, 90);
    p.stage = p.type === 'smock' || M.chance(0.6);
    p.capL = p.R1 * 2.5;
    p.deckH = 0.5;
    p.deck = M.pick(['oct', 'square']);
    p.deckR = p.R0 / Math.cos(Math.PI / 8) + M.r(1.6, 2.6);
    p.zb = p.deckH + p.hb;
    p.zt = p.zb + p.Ht;
    p.zh = p.zt + p.R1 * 0.8;
    p.Rs = Math.min(p.Rs, p.zh - 2.0);
    p.fan = M.ri(6, 8);
    p.hoist = M.chance(0.75);
    p.stays = false;
    p.boards = M.pick(['boards', 'battens']);
    p.vaneDir = M.r(0, 360);
    p.H = p.zh + p.Rs;
    p.box = { len: Math.max(p.deckR, p.capL * 0.5 + 2.6) * 2, wid: Math.max(p.deckR, p.Rs) * 2, hgt: p.H, mass: Math.round(p.R0 * p.R0 * p.Ht * 0.6 + 20) };
    return p;
  },
  build(M, p, ctx) {
    const aE = B.viewAz(M), doorAz = axisToward(M) === 0 ? 90 * Math.sign(M.view.e[1] || 1) : axisToward(M);
    const n = 8, kc = 1 / Math.cos(Math.PI / n);
    M.part('BASE DECK', () => { B.baseDeck(M, deckPlan(p.deck, p.deckR), p.deckH); M.callout('BASE DECK', 1, [p.deckR * 0.95, 0, p.deckH * 0.5], 1.0); });
    let body;
    M.part(p.type === 'smock' ? 'SMOCK TOWER' : 'TOWER', () => {
      if (p.type === 'smock') {
        const base = B.polyLathe(M, [[p.R0 * kc * 1.04, p.deckH], [p.R0 * kc * 1.04, p.zb]], n);
        body = B.polyLathe(M, [[p.R0 * kc, p.zb], [p.R1 * kc, p.zt]], n);
        for (let i = 0; i < n; i++) {
          const a = body.angle(i);
          const fb = base.facet(0, i), fs = body.facet(0, i);
          const isDoor = Math.abs(((a - doorAz + 540) % 360) - 180) < 1;
          const holes = [];
          if (isDoor) holes.push(B.doorway(fb, 0, -fb.h / 2, 1.1, Math.min(2.2, p.hb - 0.3), { fan: p.hb > 2.9 ? 'rect' : null }));
          else if (i % 2) holes.push(B.sash(fb, 0, fb.h * 0.08, 0.8, 1.0, { panes: [2, 1] }));
          B.courses(fb, fb.box, { kind: 'brick', holes });
          const h2 = [];
          if (i % 2 === 0) h2.push(B.sash(fs, 0, -fs.h * 0.15, 0.7, 0.9, { panes: [2, 1], casement: true }));
          else if (i % 4 === 1) h2.push(B.sash(fs, 0, fs.h * 0.2, 0.6, 0.8, { panes: [2, 1], casement: true }));
          B.courses(fs, fs.box, { kind: p.boards, holes: h2 });
        }
        M.at(0, 0, p.zb, () => B.polyLathe(M, [[p.R0 * kc * 1.08, -0.18], [p.R0 * kc * 1.08, 0]], n));
      } else {
        body = M.lathe([[p.R0, p.deckH], [p.R1, p.zt]], {});
        const L = body.lat;
        if (M.decorOn) {
          const nc = Math.round(p.Ht / 0.3);
          const step = Math.max(1, Math.ceil(3.2 * M.px / (p.Ht / nc)));
          for (let i = step; i < nc; i += step) L.ring(i / nc, { w: 0, a0: aE - 100, a1: aE + 100 });
          L.shade({ gap: 1.8, gapMax: 6 });
          for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) B.latheWindow(L, doorAz + 45 + j * 90 + k * 30, 0.3 + k * 0.22, 0.7, 0.95);
          B.latheDoor(L, doorAz, 0.01, 1.1, 2.1);
        }
      }
      M.callout(p.type === 'smock' ? 'SMOCK TOWER' : 'BRICK TOWER', 1, [Math.cos(aE * D2R) * (p.R0 + p.R1) / 2, Math.sin(aE * D2R) * (p.R0 + p.R1) / 2, (p.zb + p.zt) / 2], 1);
      M.callout('ENTRANCE DOOR', 1, [Math.cos(doorAz * D2R) * p.R0, Math.sin(doorAz * D2R) * p.R0, p.deckH + 1], 1.1);
    });
    // stage (gallery) round the tower
    if (p.stage) {
      M.part('STAGE', () => {
        const zs = p.type === 'smock' ? p.zb : p.deckH + p.Ht * 0.3;
        const rr = p.type === 'smock' ? p.R0 : p.R0 + (p.R1 - p.R0) * 0.3;
        const Rg = rr + 1.3;
        const pts = [];
        for (let i = 0; i < n; i++) { const a = (180 / n + i * 360 / n) * D2R; pts.push([Math.cos(a) * Rg * kc, Math.sin(a) * Rg * kc, zs]); }
        B.polyLathe(M, [[Rg * kc, zs - 0.2], [Rg * kc, zs]], n);
        if (M.decorOn) void 0;
        B.balustrade(M, pts, { closed: true, h: 1.0, kind: 'rail', pitch: 0.9 });
        for (let i = 0; i < n; i++) { const a = (180 / n + i * 360 / n) * D2R; M.tube([Math.cos(a) * (Rg - 0.1) * kc, Math.sin(a) * (Rg - 0.1) * kc, zs - 0.2], [Math.cos(a) * rr, Math.sin(a) * rr, zs - 1.6], 0.06, {}); }
        M.callout('STAGE', 1, [Math.cos(aE * D2R) * Rg, Math.sin(aE * D2R) * Rg, zs + 0.5], 1.3);
      });
    }
    // sack hoist: a lucam with a chain and a sack
    if (p.hoist) {
      M.part('SACK HOIST', () => {
        const a = doorAz + 45;
        const z = p.zt - 2.6, r = p.R1 + (p.R0 - p.R1) * 0.2;
        M.with({ at: [Math.cos(a * D2R) * (r - 0.3), Math.sin(a * D2R) * (r - 0.3), z], rz: a }, () => {
          const Lb = M.box([0, -0.7, 0], [1.2, 0.7, 1.9]);
          M.extrude([[0, 1.9], [1.35, 1.9], [0, 2.5]], -0.8, 0.8, { plane: 'xz' });
          for (const k of ['+y', '-y', '+x']) { const f = Lb.f(k); B.courses(f, f.box, { kind: 'boards' }); }
          M.line([[1.05, 0, 0.1], [1.05, 0, -3.2]], { w: 1, pass: 2 });
          M.at(1.05, 0, -3.9, () => M.scale(0.35, 0.3, 0.6, () => M.sphere(1, { rings: 8 })));
        });
        M.callout('SACK HOIST', 1, [Math.cos(a * D2R) * (r + 1), Math.sin(a * D2R) * (r + 1), z + 1.2], 1.2);
      });
    }
    // the cap, windshaft, sails, fantail
    const capL = p.capL, Rc = p.R1 * 1.15;
    M.part('CAP', () => {
      const prof = [];
      for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; prof.push([Math.cos(a) * Rc, p.zt + Math.sin(a) * Rc * 1.05]); }
      const C = M.extrude(prof, -capL / 2, capL / 2, { plane: 'yz', smoothDeg: 30 });
      if (M.decorOn) for (let i = 0; i < 8; i++) { const f = C.f('s' + i); if (f.on && f.front) B.courses(f, f.box, { kind: 'battens' }); }
      M.at(0, 0, p.zt, () => M.cyl(p.R1 * kc * 1.02, -0.3, 0, { isect: false }));
      M.callout('CAP', 1, [0, 0, p.zt + Rc], 1.4);
    });
    const tilt = 8;
    const xs = capL / 2 + 0.9;
    M.part('SAILS', () => {
      M.with({ at: [capL / 2 - 0.4, 0, p.zh], ry: -tilt }, () => {
        M.ry(90, () => M.cyl(0.25, 0, 1.4, { isect: false }));
        M.at(1.35, 0, 0, () => M.box([-0.3, -0.45, -0.45], [0.3, 0.45, 0.45]));
        for (let k = 0; k < 4; k++) {
          M.at(1.35, 0, 0, () => M.rx(p.phase + k * 90, () => {
            const Rs = p.Rs, ws = Rs * 0.22;
            M.box([-0.12, 0.3, -0.12], [0.12, Rs, 0.12]);                 // the whip
            const y0 = Rs * 0.2;
            M.box([-0.05, y0, ws * 0.72], [0.05, Rs, ws * 0.78], { isect: false });     // trailing rail
            M.box([-0.05, y0, -ws * 0.3], [0.05, Rs, -ws * 0.24], { isect: false });    // leading board edge
            const nb = Math.max(6, Math.round((Rs - y0) / (M.decorOn ? Math.max(0.95, M.px * 14) : 1.0)));
            for (let i = 0; i <= nb; i++) { const y = y0 + (Rs - y0) * i / nb; M.box([-0.04, y - 0.035, -ws * 0.3], [0.04, y + 0.035, ws * 0.78], { isect: false }); }
            if (p.sails === 'patent') {
              const Pl = M.box([-0.015, y0, 0.05], [0.015, Rs, ws * 0.7], { isect: false });
              if (M.decorOn) { const m = Math.max(4, nb * 2); for (const sx of [0.016, -0.016]) for (let i = 1; i < m; i++) { const yy = y0 + (Rs - y0) * i / m; M.line([[sx, yy, 0.05], [sx, yy, ws * 0.7]], { w: 0, pass: 2 }); } }
              for (const kk of ['+x', '-x']) { const f = Pl.f(kk); if (f.on && f.tone > 0.4) f.hatch(f.poly, { angle: 0, gap: 5 - f.tone * 2, w: 0 }); }
            } else {
              const Pl = M.box([-0.012, y0, -ws * 0.28], [0.012, Rs, -ws * 0.02], { isect: false });
              for (const kk of ['+x', '-x']) { const f = Pl.f(kk); if (f.on) f.hatch(f.box, { angle: 0, gap: 3.4, w: 0 }); }
            }
          }));
        }
      });
      M.callout('LATTICE SAIL', 4, [xs, Math.cos(p.phase * D2R) * p.Rs * 0.7, p.zh + Math.sin(p.phase * D2R) * p.Rs * 0.7], 2.5);
      M.callout('WINDSHAFT', 1, [capL / 2 + 0.5, 0, p.zh + 0.1], 1.0);
    });
    M.part('FANTAIL', () => {
      const Rf = Math.max(1.0, p.R1 * 0.55), xf = -capL / 2 - Rf * 0.9, zf = p.zt + Rc * 0.9 + Rf * 0.3;
      for (const s of [1, -1]) {
        M.tube([-capL * 0.3, s * Rc * 0.6, p.zt + Rc * 0.6], [xf, s * 0.25, zf], 0.06, {});
        M.tube([-capL * 0.48, s * Rc * 0.8, p.zt + 0.2], [xf, s * 0.25, zf], 0.06, {});
      }
      M.at(xf, 0, zf, () => {
        M.rx(90, () => M.cyl(0.18, -0.25, 0.25, { isect: false }));
        for (let i = 0; i < p.fan; i++) M.ry(i * 360 / p.fan, () => M.rz(0, () => M.box([0.2, -0.02, -0.12], [Rf, 0.02, 0.12], { isect: false })));
        M.ry(90, () => {}); 
        M.rx(90, () => M.torus(Rf, 0.03, { isect: false, rings: 6 }));
      });
      M.callout('FANTAIL', 1, [xf, 0, zf + Rf * 0.6], 1.5);
    });
    driveCab(M, [p.deckR * 0.62, -p.deckR * 0.55 * Math.sign(M.view.e[1] || 1), p.deckH]);
    M.part('NUMBER PLATE', () => { plate(M, [p.deckR * 0.92 + (p.deck === 'oct' ? -0.05 : 0.0), p.deckR * 0.3, p.deckH * 0.5], 0, ctx.des, 0.14, 1.0); M.callout('NUMBER PLATE', 1, [p.deckR, p.deckR * 0.3, p.deckH * 0.5], 0.5); });
    const fig = fitOut(M, ctx, { deckH: p.deckH, deckR: p.deckR * 0.92, footR: () => p.R0 * 1.05, tieH: 0.6, tieOut: 0.6, ties: 8, tieRot: Math.PI / 8, stays: null, ladderAz: doorAz + 30 });
    const tons = M.ri(2, 6);
    const brief = M.pick([
      `Goes to whichever village has the harvest in and grinds ${tons} tons a day.`,
      `Grinds the county's grain where it is grown, ${tons} tons on a good wind.`,
      'Follows the wind across the polder and pumps where it is needed.',
    ]);
    return {
      brief, fig,
      specs: [['SAILS', `4 X ${r1(p.Rs)} M`], ['OUTPUT', `${tons} T/DAY`]],
      crew: M.ri(2, 3),
      mass: [-p.R0, -p.R0, 0, p.R0, p.R0, p.zt + Rc],
      places: ['POLDER', 'COUNTY', 'FEN', 'PRAIRIE', 'VILLAGE', 'HARVEST'],
    };
  },
};

// ================================================================== CLOCK TOWER
const clocktower = {
  name: 'CLOCK TOWER',
  plan(M) {
    const p = {};
    p.a = M.r(4, 5.6);
    p.hb = M.r(4.5, 6);
    p.hs = M.r(8, 14);
    p.nStage = Math.max(2, Math.round(p.hs / 4.5));
    p.hc = p.a * M.r(0.95, 1.1);
    p.hbel = p.a * M.r(0.8, 1.0);
    p.roof = M.pick(['spire', 'spire', 'ogee', 'pyramid']);
    p.rr = p.roof === 'spire' ? p.a * M.r(1.4, 2.0) : p.roof === 'ogee' ? p.a * M.r(0.8, 1.1) : p.a * M.r(0.6, 0.8);
    p.cover = M.pick(['slate', 'seam']);
    p.wall = M.pick(['brick', 'stone']);
    p.hour = M.ri(0, 11); p.min = M.ri(0, 11) * 5;
    p.deckH = 0.5;
    p.deckR = p.a * 0.5 * Math.SQRT2 + M.r(2.2, 3.2);
    p.deck = M.pick(['square', 'oct']);
    p.z1 = p.deckH + p.hb; p.z2 = p.z1 + p.hs; p.z3 = p.z2 + p.hc; p.z4 = p.z3 + p.hbel;
    p.H = p.z4 + 0.5 + p.rr + 2.5;
    p.vaneDir = M.r(0, 360);
    p.stays = M.chance(0.5);
    p.bellR = p.a * M.r(0.15, 0.2);
    p.box = { len: p.deckR * 2, wid: p.deckR * 2, hgt: p.H, mass: Math.round(p.a * p.a * (p.H - p.rr) * 1.3) };
    return p;
  },
  build(M, p, ctx) {
    const aE = B.viewAz(M), dAz = axisToward(M);
    const a = p.a, h = a / 2;
    M.part('BASE DECK', () => { B.baseDeck(M, deckPlan(p.deck, p.deckR), p.deckH); M.callout('BASE DECK', 1, [p.deckR * 0.95, 0, p.deckH * 0.5], 1.0); });
    const faces = ['+x', '+y', '-x', '-y'];
    const faceAz = { '+x': 0, '+y': 90, '-x': 180, '-y': -90 };
    const isDoor = (k) => Math.abs(((faceAz[k] - dAz + 540) % 360) - 180) < 1;
    M.part('TOWER', () => {
      const b0 = M.box([-h - 0.25, -h - 0.25, p.deckH], [h + 0.25, h + 0.25, p.z1]);
      const b1 = M.box([-h, -h, p.z1], [h, h, p.z2]);
      for (const k of faces) {
        const f0 = b0.f(k), f1 = b1.f(k);
        const holes = [];
        if (isDoor(k)) holes.push(B.doorway(f0, 0, -f0.h / 2, 1.5, 2.6, { fan: 'arch' }));
        else holes.push(B.sash(f0, 0, f0.h * 0.1, 1.0, 1.7, { panes: [3, 2], arch: true }));
        B.courses(f0, f0.box, { kind: 'stone', holes });
        const h1 = [];
        for (let s = 0; s < p.nStage; s++) { const cy = -f1.h / 2 + f1.h * (s + 0.55) / p.nStage; h1.push(B.sash(f1, 0, cy, 0.9, Math.min(2.0, f1.h / p.nStage * 0.55), { panes: [2, 3], arch: s === p.nStage - 1 })); }
        B.courses(f1, f1.box, { kind: p.wall, holes: h1 });
        B.quoins(f1);
      }
      // string courses
      for (const z of [p.z1, p.z2]) M.box([-h - 0.35, -h - 0.35, z - 0.12], [h + 0.35, h + 0.35, z + 0.12], { isect: false });
      M.callout('ENTRANCE DOOR', 1, [Math.cos(dAz * D2R) * (h + 0.3), Math.sin(dAz * D2R) * (h + 0.3), p.deckH + 1.4], 1.2);
      M.callout('STRING COURSE', 2, [Math.cos(aE * D2R) * (h + 0.35), Math.sin(aE * D2R) * (h + 0.35), p.z2], 0.7);
    });
    M.part('ENTRANCE STEPS', () => {
      M.with({ at: [Math.cos(dAz * D2R) * (h + 0.25), Math.sin(dAz * D2R) * (h + 0.25), p.deckH], rz: dAz }, () => B.steps(M, { n: 2, rise: 0.17, run: 0.4, w: 2.4 }));
    });
    // clock stage with four dials
    M.part('CLOCK DIAL', () => {
      const c = 0.2;
      const C = M.box([-h - c, -h - c, p.z2], [h + c, h + c, p.z3]);
      M.box([-h - c - 0.12, -h - c - 0.12, p.z3 - 0.25], [h + c + 0.12, h + c + 0.12, p.z3], { isect: false });
      const R = a * 0.36;
      for (const k of faces) {
        const f = C.f(k);
        B.courses(f, f.box, { kind: 'stone', holes: [[-R * 1.1, -R * 1.1, R * 1.1, R * 1.1]] });
        B.quoins(f);
        M.onFace(f, 0, 0, () => M.ry(90, () => {
          const D = M.cyl(R, 0, 0.1, { isect: false });
          M.cyl(R * 1.08, 0, 0.05, { isect: false });
          const t = D.top;
          if (t.on && t.front) {
            t.circle(0, 0, R * 0.92, { w: 1 }); t.circle(0, 0, R * 0.7, { w: 0 });
            for (let i = 0; i < 60; i++) { const q = i * 6 * D2R, r0 = i % 5 ? R * 0.88 : R * 0.84; if (t.pxOf(R) > 25 || i % 5 === 0) t.line(Math.sin(q) * r0, Math.cos(q) * r0, Math.sin(q) * R * 0.92, Math.cos(q) * R * 0.92, { w: i % 5 ? 0 : 1 }); }
            const NUM = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
            for (let i = 0; i < 12; i++) { const q = i * 30 * D2R; t.text(NUM[i], Math.sin(q) * R * 0.77, Math.cos(q) * R * 0.77, R * 0.1, { angle: -i * 30 }); }
            // the face frame of a +x cap: u, v; draw hands in the dial's plane
            const hand = (ang, L, wd) => { const q = ang * D2R, s = Math.sin(q), co = Math.cos(q); t.path([[-co * wd, s * wd], [s * L, co * L], [co * wd, -s * wd], [-s * L * 0.18, -co * L * 0.18]], { closed: true, w: 2 }); };
            hand((p.hour + p.min / 60) * 30, R * 0.5, R * 0.05);
            hand(p.min * 6, R * 0.78, R * 0.035);
            t.circle(0, 0, R * 0.05, { w: 1 });
          }
        }));
      }
      M.callout('CLOCK DIAL', 4, [Math.cos(dAz * D2R) * (h + 0.35), Math.sin(dAz * D2R) * (h + 0.35), (p.z2 + p.z3) / 2 + a * 0.2], 2.4);
    });
    // belfry: corner piers, louvers, the bell
    M.part('BELFRY', () => {
      const pw = 0.55, z0 = p.z3, z1 = p.z4;
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const P = M.box([sx > 0 ? h - pw : -h, sy > 0 ? h - pw : -h, z0], [sx > 0 ? h : -h + pw, sy > 0 ? h : -h + pw, z1]);
        if (M.decorOn) for (const k of faces) { const f = P.f(k); B.courses(f, f.box, { kind: 'stone' }); }
      }
      const E = M.box([-h - 0.15, -h - 0.15, z1], [h + 0.15, h + 0.15, z1 + 0.5]);
      for (const k of faces) { const f = E.f(k); if (f.on && f.front) { f.line(-f.w / 2, 0, f.w / 2, 0, { w: 0 }); for (let i = 0; i < Math.round(f.w / 0.35); i++) f.rect(-f.w / 2 + i * 0.35 + 0.05, -f.h / 2 + 0.04, -f.w / 2 + i * 0.35 + 0.2, -0.04, { w: 0 }); } }
      // louver boards on the four sides, set in the openings
      const nL = 6, span = a - 2 * pw;
      for (let side = 0; side < 4; side++) M.rz(side * 90, () => {
        for (let i = 0; i < nL; i++) {
          const z = z0 + 0.4 + (z1 - z0 - 0.7) * (i + 0.5) / nL;
          M.with({ at: [h - pw * 0.5, 0, z], ry: 40 }, () => M.box([-0.22, -span / 2, -0.03], [0.22, span / 2, 0.03], { isect: false }));
        }
      });
      if (X && X.bell) M.at(0, 0, z0 + 0.1, () => X.bell(M, { r: p.bellR }));
      M.callout('BELFRY LOUVER', 4 * nL, [Math.cos(aE * D2R) * h * 1.02, Math.sin(aE * D2R) * h * 1.02, (z0 + z1) / 2], 1.4);
      M.callout('BELL', 1, [0, 0, z0 + p.bellR * 1.2], 0.8);
    });
    // roof, finial, vane
    M.part('ROOF', () => {
      const z = p.z4 + 0.5, R = (h + 0.2) * Math.SQRT2;
      const prof = p.roof === 'ogee'
        ? [[R, z], [R * 0.92, z + p.rr * 0.25], [R * 0.6, z + p.rr * 0.55], [R * 0.25, z + p.rr * 0.82], [R * 0.06, z + p.rr * 0.95], [0, z + p.rr]]
        : p.roof === 'spire' ? [[R, z], [R * 0.72, z + p.rr * 0.12], [0, z + p.rr]] : [[R, z], [0, z + p.rr]];
      B.facetRoof(M, prof, 4, p.roof === 'ogee' ? 'seam' : p.cover, { rot: 45, hips: true, hipR: 0.06 });
      M.at(0, 0, z + p.rr - 0.1, () => B.finial(M, { h: 1.2, r: 0.16 }));
      if (X && X.weathervane) M.at(0, 0, z + p.rr + 1.05, () => X.weathervane(M, { h: 1.6, dir: p.vaneDir }));
      M.callout('ROOF', 1, [Math.cos(aE * D2R) * R * 0.35, Math.sin(aE * D2R) * R * 0.35, z + p.rr * 0.4], 1.0);
      M.callout('FINIAL', 1, [0, 0, z + p.rr + 0.4], 0.7);
    });
    driveCab(M, [h + 1.3 + 0.4, -(h + 0.6) * Math.sign(M.view.e[1] || 1), p.deckH]);
    M.part('NUMBER PLATE', () => { plate(M, [h + 0.27, h * 0.5, p.deckH + 0.7], 0, ctx.des, 0.18, 1.1); M.callout('NUMBER PLATE', 1, [h + 0.3, h * 0.5, p.deckH + 0.7], 0.5); });
    const fig = fitOut(M, ctx, {
      deckH: p.deckH, deckR: p.deckR * 0.92, footR: sqR(h + 0.25), tieH: 0.8, tieOut: 0.6, ties: 8, tieRot: Math.PI / 8,
      stays: p.stays ? { r: h * 1.3, z: p.z1 + p.hs * 0.4 } : null, stayK: null, ladderAz: dAz + 40,
    });
    const towns = M.ri(3, 9);
    const brief = M.pick([
      `Keeps the time in ${word(towns)} market towns in turn, one week in each.`,
      'Goes to whichever square has the market and strikes the hours there.',
      `Brings the correct time to ${towns} villages and rings the quarters.`,
    ]);
    return {
      brief, fig,
      specs: [['DIALS', `4 X ${r1(a * 0.72)} M`], ['BELL', `${Math.round(p.bellR * p.bellR * p.bellR * 4000)} KG`]],
      crew: M.ri(2, 3),
      mass: [-h - 0.25, -h - 0.25, 0, h + 0.25, h + 0.25, p.z4 + 0.5],
      places: ['MARKET', 'TOWN HALL', 'COUNTY', 'CIVIC', 'BOROUGH', 'MUNICIPAL'],
    };
  },
};

// ================================================================== WATER TOWER
const watertower = {
  name: 'WATER TOWER',
  plan(M) {
    const p = {};
    p.stem = M.pick(['lattice', 'lattice', 'masonry']);
    p.Rt = M.r(3, 4.4);
    p.ht = p.Rt * M.r(0.9, 1.3);
    p.bottom = M.pick(['cone', 'bowl']);
    p.hstem = M.r(9, 15);
    p.legs = M.pick([4, 6]);
    p.deckH = 0.5;
    p.deckR = p.Rt * 1.05 + M.r(1.2, 2.2);
    p.deck = M.pick(['oct', 'round', 'square']);
    p.zb = p.deckH + p.hstem;             // bottom of the tank barrel
    p.hbot = p.bottom === 'cone' ? p.Rt * 0.55 : p.Rt * 0.45;
    p.zr = p.zb + p.ht;                     // top of the barrel
    p.hroof = p.Rt * M.r(0.3, 0.5);
    p.H = p.zr + p.hroof + 1.5;
    p.cap = Math.round(Math.PI * p.Rt * p.Rt * p.ht);
    p.box = { len: p.deckR * 2, wid: p.deckR * 2, hgt: p.H, mass: Math.round(p.cap * 0.25 + p.hstem * 3) };
    return p;
  },
  build(M, p, ctx) {
    const aE = B.viewAz(M), dAz = axisToward(M);
    const Rt = p.Rt;
    M.part('BASE DECK', () => { (p.deck === 'round' ? B.baseDrum(M, p.deckR, p.deckH) : B.baseDeck(M, deckPlan(p.deck, p.deckR), p.deckH)); M.callout('BASE DECK', 1, [p.deckR * 0.95, 0, p.deckH * 0.5], 1.0); });
    const Rl = Rt * 0.82;                   // leg circle at the top
    const Rf = Math.min(p.deckR * 0.82, Rt * 1.08);
    const footR = () => (p.stem === 'lattice' ? Rf : Rt * 0.72);
    M.part('STEM', () => {
      if (p.stem === 'lattice') {
        const n = p.legs;
        const top = (i) => { const q = (i + 0.5) * 2 * Math.PI / n; return [Math.cos(q) * Rl, Math.sin(q) * Rl, p.zb - p.hbot * 0.6]; };
        const bot = (i) => { const q = (i + 0.5) * 2 * Math.PI / n; return [Math.cos(q) * Rf, Math.sin(q) * Rf, p.deckH]; };
        const tiers = Math.max(3, Math.round(p.hstem / 3.6));
        const P = (i, t) => { const a = bot(i), b = top(i); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
        for (let i = 0; i < n; i++) {
          K.strut(M, bot(i), top(i), 0.16, { collars: false });
          M.at(bot(i)[0], bot(i)[1], p.deckH, () => M.box([-0.35, -0.35, 0], [0.35, 0.35, 0.2]));
          for (let k = 1; k <= tiers; k++) {
            const t0 = (k - 1) / tiers, t1 = k / tiers;
            if (k < tiers) M.tube(P(i, t1), P(i + 1, t1), 0.08, { isect: false });
            M.tube(P(i, t0), P(i + 1, t1), 0.035, { isect: false, seg: 6 });
            M.tube(P(i + 1, t0), P(i, t1), 0.035, { isect: false, seg: 6 });
          }
        }
        M.callout('LATTICE STEM', 1, P(Math.round(n * ((aE + 360) % 360) / 360) % n, 0.5), 1.2);
      } else {
        const S = M.lathe([[Rt * 0.72, p.deckH], [Rt * 0.5, p.zb - p.hbot * 0.3]], {});
        if (M.decorOn) {
          const L = S.lat;
          const nc = Math.round(p.hstem / 0.6);
          for (let i = 1; i < nc; i++) L.ring(i / nc, { w: 0, a0: aE - 100, a1: aE + 100 });
          L.shade({ gap: 1.8, gapMax: 6 });
          for (let k = 0; k < 3; k++) B.latheWindow(L, dAz + 40 + k * 70, 0.35 + k * 0.2, 0.6, 1.1);
          B.latheDoor(L, dAz, 0.01, 1.1, 2.2);
        }
        M.callout('MASONRY STEM', 1, [Math.cos(aE * D2R) * Rf * 0.95, Math.sin(aE * D2R) * Rf * 0.95, p.deckH + p.hstem * 0.4], 1.2);
      }
      // riser pipe
      M.tube([0, 0, p.deckH], [0, 0, p.zb - p.hbot + 0.1], 0.3, {});
      M.callout('RISER PIPE', 1, [0, 0, p.deckH + 2], 0.6);
    });
    M.part('TANK', () => {
      const zb = p.zb, zr = p.zr;
      const prof = p.bottom === 'cone'
        ? [[0.3, zb - p.hbot], [Rt, zb], [Rt, zr], [Rt * 1.02, zr], [0.5, zr + p.hroof], [0.001, zr + p.hroof]]
        : [[0.3, zb - p.hbot], [Rt * 0.6, zb - p.hbot * 0.8], [Rt * 0.9, zb - p.hbot * 0.4], [Rt, zb], [Rt, zr], [Rt * 1.02, zr], [0.5, zr + p.hroof], [0.001, zr + p.hroof]];
      const T = M.lathe(prof, { sharpDeg: 25 });
      if (M.decorOn) {
        const L = T.lat, tot = L.total;
        const tB = (L.cum[p.bottom === 'cone' ? 1 : 3]) / tot, tR = L.cum[p.bottom === 'cone' ? 2 : 4] / tot;
        const nr = Math.max(3, Math.round(p.ht / 1.2));
        for (let i = 0; i <= nr; i++) L.ring(tB + (tR - tB) * i / nr, { w: i % nr ? 0 : 1, a0: aE - 100, a1: aE + 100 });
        const nm = 24;
        for (let i = 0; i < nm; i++) for (let j = 0; j < nr; j++) L.meridian(i * 360 / nm + (j % 2) * 7.5, tB + (tR - tB) * j / nr, tB + (tR - tB) * (j + 1) / nr, { w: 0 });
        L.shade({ gap: 1.6, gapMax: 6 });
        L.text(ctx.des, aE, (tB + tR) / 2, Math.min(p.ht * 0.22, 1.1));
      }
      // balcony round the barrel foot
      const Rb = Rt + 0.9;
      M.at(0, 0, zb, () => M.lathe([[Rt * 0.98, -0.2], [Rb, -0.2], [Rb, 0], [Rt * 0.98, 0]], { loop: true, sharpDeg: 30 }));
      B.ringRail(M, Rb - 0.08, zb, { h: 1.0, pitch: 1.0 });
      M.callout('WATER TANK', 1, [Math.cos(aE * D2R) * Rt, Math.sin(aE * D2R) * Rt, (zb + zr) / 2 + p.ht * 0.25], 2.2);
      M.callout('BALCONY', 1, [Math.cos(aE * D2R) * Rb, Math.sin(aE * D2R) * Rb, zb + 0.8], 1.1);
      // roof vent and hatch
      M.at(0, 0, zr + p.hroof - 0.1, () => { M.cyl(0.35, 0, 0.5, { isect: false }); M.at(0, 0, 0.5, () => M.lathe([[0.6, 0], [0.5, 0.25], [0.001, 0.45]], { isect: false })); M.at(0, 0, 0.95, () => B.finial(M, { h: 0.7, r: 0.1 })); });
      M.callout('ROOF VENT', 1, [0, 0, zr + p.hroof + 0.6], 0.7);
    });
    // level gauge on the barrel, ladder with a cage
    M.part('LEVEL GAUGE', () => {
      const a = aE + 28, ca = Math.cos(a * D2R), sa = Math.sin(a * D2R);
      M.with({ at: [ca * Rt, sa * Rt, p.zb + 0.2], rz: a }, () => {
        const Bd = M.box([0, -0.25, 0], [0.12, 0.25, p.ht - 0.5]);
        const f = Bd.f('+x');
        if (f.on && f.front) { const n = Math.round(p.ht / 0.25); for (let i = 1; i < n; i++) f.line(-f.w / 2 + (i % 4 ? f.w * 0.55 : f.w * 0.2), -f.h / 2 + f.h * i / n, f.w / 2 - f.w * 0.1, -f.h / 2 + f.h * i / n, { w: 0 }); }
        M.at(0.12, 0, (p.ht - 0.5) * 0.62, () => M.extrude([[0, 0], [0.35, 0.15], [0.35, -0.15]], -0.32, 0.32, { plane: 'xz', isect: false }));
        M.line([[0.2, 0, p.ht - 0.5], [0.2, 0, p.ht + 0.3]], { w: 1, pass: 2 });
      });
      M.callout('LEVEL GAUGE', 1, [ca * (Rt + 0.15), sa * (Rt + 0.15), p.zb + p.ht * 0.6], 1.6);
    });
    M.part('LADDER CAGE', () => {
      const a = (p.stem === 'lattice' ? (Math.round(((aE - 30) / (360 / p.legs)) - 0.5) + 0.5) * 360 / p.legs : aE - 35);
      const ca = Math.cos(a * D2R), sa = Math.sin(a * D2R);
      const r0 = (p.stem === 'lattice' ? Rf : Rt * 0.72) + 0.4, r1 = p.stem === 'lattice' ? Rt + 0.95 : Rt + 0.5;
      const A = [ca * r0, sa * r0, p.deckH], Bp = [ca * r1, sa * r1, p.zb];
      K.ladderAlong(M, A, Bp, { w: 0.5 });
      const nh = Math.floor((p.zb - p.deckH - 2.5) / 0.9);
      for (let i = 0; i < nh; i++) {
        const t = (2.5 + i * 0.9) / (p.zb - p.deckH);
        const c = [A[0] + (Bp[0] - A[0]) * t, A[1] + (Bp[1] - A[1]) * t, A[2] + (Bp[2] - A[2]) * t];
        const pts = [];
        for (let k = 0; k <= 8; k++) { const q = (a + 90 + 180 * k / 8) * D2R; pts.push([c[0] + Math.cos(q) * 0.38 + ca * 0.32, c[1] + Math.sin(q) * 0.38 + sa * 0.32, c[2]]); }
        M.pipe(pts, 0.018, { isect: false, seg: 4 });
      }
      M.callout('LADDER CAGE', 1, [ca * (r0 + r1) / 2 + ca * 0.6, sa * (r0 + r1) / 2 + sa * 0.6, (p.deckH + p.zb) / 2], 1.3);
    });
    driveCab(M, [p.deckR * 0.55, -p.deckR * 0.55 * Math.sign(M.view.e[1] || 1), p.deckH]);
    const fig = fitOut(M, ctx, { deckH: p.deckH, deckR: p.deckR * (p.deck === 'round' ? 0.98 : 0.92), footR: () => footR() + (p.stem === 'lattice' ? 0.3 : 0), tieH: 0.25, tieOut: 0.4, ties: p.legs, tieRot: Math.PI / p.legs + 0.25, stays: null, ladderAz: dAz + 90 });
    const brief = M.pick([
      `Takes ${thou(p.cap)} cubic meters of water to whichever village has run dry.`,
      `Stands in at the fairground each summer and holds ${thou(p.cap)} cubic meters.`,
      'Follows the fire brigade with a full tank and gives it pressure on arrival.',
    ]);
    return {
      brief, fig,
      specs: [['CAPACITY', `${thou(p.cap)} M3`], ['HEAD', `${Math.round(p.zb)} M`]],
      crew: 2,
      mass: [-Rt, -Rt, p.zb - p.hbot, Rt, Rt, p.zr],
      places: ['MUNICIPAL', 'RURAL', 'VILLAGE', 'COUNTY', 'DISTRICT', 'PARISH'],
    };
  },
};

// ================================================================== FIRE LOOKOUT
const lookout = {
  name: 'FIRE LOOKOUT TOWER',
  plan(M) {
    const p = {};
    p.Ht = M.r(12, 18);
    p.b = M.r(2.8, 3.8);
    p.t = M.r(1.7, 2.1);
    p.ch = M.r(2.3, 2.7);
    p.roofH = M.r(0.9, 1.5);
    p.deckH = 0.5;
    p.deckR = p.b + M.r(1.6, 2.4);
    p.deck = M.pick(['square', 'oct']);
    p.tiers = Math.max(3, Math.round(p.Ht / 3.2));
    p.sock = M.chance(0.6);
    p.z1 = p.deckH + p.Ht;
    p.H = p.z1 + 0.3 + p.ch + p.roofH + 2;
    p.box = { len: p.deckR * 2, wid: p.deckR * 2, hgt: p.H, mass: Math.round(p.Ht * 1.4 + 6) };
    return p;
  },
  build(M, p, ctx) {
    const aE = B.viewAz(M), dAz = axisToward(M);
    M.part('BASE DECK', () => { B.baseDeck(M, deckPlan(p.deck, p.deckR), p.deckH); M.callout('BASE DECK', 1, [p.deckR * 0.95, 0, p.deckH * 0.5], 1.0); });
    const leg = (sx, sy, t) => [sx * (p.b + (p.t - p.b) * t), sy * (p.b + (p.t - p.b) * t), p.deckH + p.Ht * t];
    const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    M.part('STEEL TOWER', () => {
      for (const [sx, sy] of C) { K.strut(M, leg(sx, sy, 0), leg(sx, sy, 1), 0.1, { collars: false }); M.at(sx * p.b, sy * p.b, p.deckH, () => M.box([-0.3, -0.3, 0], [0.3, 0.3, 0.15])); }
      for (let k = 0; k < p.tiers; k++) {
        const t0 = k / p.tiers, t1 = (k + 1) / p.tiers;
        for (let i = 0; i < 4; i++) {
          const [ax, ay] = C[i], [bx, by] = C[(i + 1) % 4];
          M.tube(leg(ax, ay, t1), leg(bx, by, t1), 0.06, { isect: false });
          M.tube(leg(ax, ay, t0), leg(bx, by, t1), 0.03, { isect: false, seg: 6 });
          M.tube(leg(bx, by, t0), leg(ax, ay, t1), 0.03, { isect: false, seg: 6 });
        }
      }
      M.callout('STEEL TOWER', 1, leg(Math.sign(Math.cos(aE * D2R)), Math.sign(Math.sin(aE * D2R)), 0.4), 1.2);
    });
    M.part('STAIRS', () => {
      for (let k = 0; k < p.tiers; k++) {
        const t0 = k / p.tiers, t1 = (k + 1) / p.tiers;
        const z0 = p.deckH + p.Ht * t0, hh = p.Ht * (t1 - t0);
        const half = p.b + (p.t - p.b) * t1 - 0.3;
        const L = Math.min(half * 1.5, hh * 1.0);
        const dir = k % 2 ? 1 : -1;
        M.with({ at: [-dir * L / 2, (k % 2 ? 0.45 : -0.45), z0], rz: k % 2 ? 0 : 180 }, () => K.stairs(M, { len: L, h: hh, w: 0.75, rail: true }));
        M.at(dir * L / 2 + dir * 0.4, 0, z0 + hh, () => M.box([-0.5, -0.9, -0.08], [0.5, 0.9, 0], { isect: false }));
      }
      M.callout('STAIRS', p.tiers, [0, 0, p.deckH + p.Ht * 0.5], 1.0);
    });
    M.part('LOOKOUT CAB', () => {
      const t = p.t + 0.3, z = p.z1;
      const D = M.box([-t - 0.9, -t - 0.9, z], [t + 0.9, t + 0.9, z + 0.2]);
      const top = D.f('+z'); if (top.on) { top.hatch(top.box, { angle: 0, gap: 2.4, w: 0 }); }
      const pts = [[t + 0.85, t + 0.85, z + 0.2], [-t - 0.85, t + 0.85, z + 0.2], [-t - 0.85, -t - 0.85, z + 0.2], [t + 0.85, -t - 0.85, z + 0.2]];
      B.balustrade(M, pts, { closed: true, h: 1.0, kind: 'rail' });
      const Cb = M.box([-t, -t, z + 0.2], [t, t, z + 0.2 + p.ch]);
      for (const k of ['+x', '-x', '+y', '-y']) {
        const f = Cb.f(k);
        if (!f.on || !f.front) continue;
        const y0 = -f.h / 2 + f.h * 0.38, y1 = f.h / 2 - 0.12, n = 3;
        for (let i = 0; i < n; i++) { const x0 = -f.w / 2 + 0.12 + (f.w - 0.24) * i / n + 0.04, x1 = -f.w / 2 + 0.12 + (f.w - 0.24) * (i + 1) / n - 0.04; f.rect(x0, y0, x1, y1, { w: 1 }); K.glass(f, [[x0 + 0.05, y0 + 0.05], [x1 - 0.05, y0 + 0.05], [x1 - 0.05, y1 - 0.05], [x0 + 0.05, y1 - 0.05]], { gap: 1.0, gap2: 2.6, flip: i % 2 === 1, cross: false }); f.line(x0, (y0 + y1) / 2, x1, (y0 + y1) / 2, { w: 1 }); }
        B.courses(f, [-f.w / 2, -f.h / 2, f.w / 2, y0 - 0.05], { kind: 'boards' });
      }
      const zr = z + 0.2 + p.ch;
      B.facetRoof(M, [[(t + 0.45) * Math.SQRT2, zr], [0, zr + p.roofH]], 4, 'seam', { rot: 45 });
      M.at(0, 0, zr + p.roofH - 0.05, () => { M.cyl(0.02, 0, 1.8, { isect: false }); M.at(0, 0, 1.8, () => M.sphere(0.07)); });
      M.at(t * 0.7, -t * 0.7, zr + p.roofH * 0.3, () => K.whip(M, { h: 3.5, lean: 10 }));
      M.callout('LOOKOUT CAB', 1, [Math.cos(aE * D2R) * t * 1.3, Math.sin(aE * D2R) * t * 1.3, z + 1.6], 2.3);
      M.callout('CATWALK', 1, [Math.cos(aE * D2R) * (t + 0.9) * 1.2, Math.sin(aE * D2R) * (t + 0.9) * 1.2, z + 0.6], 1.2);
      M.callout('LIGHTNING ROD', 1, [0, 0, zr + p.roofH + 1.2], 0.6);
    });
    if (p.sock) M.part('WIND SOCK', () => {
      const s = -Math.sign(M.view.e[1] || 1), base = [-(p.t + 0.85), s * (p.t + 0.85), p.z1 + 0.2];
      M.tube(base, [base[0], base[1], base[2] + 3.2], 0.03, { isect: false });
      M.at(base[0], base[1], base[2] + 3.1, () => M.ry(95, () => { const S = M.cone(0.28, 0.12, 0, 1.4, { open: true }); if (M.decorOn) { S.lat.ring(0.33, { w: 1 }); S.lat.ring(0.66, { w: 1 }); } }));
      M.callout('WIND SOCK', 1, [base[0] - 0.7, base[1], base[2] + 3.1], 0.8);
    });
    driveCab(M, [p.b + 0.95, 0, p.deckH]);
    M.part('NUMBER PLATE', () => { plate(M, [p.deckR * 0.92, -p.deckR * 0.45, p.deckH * 0.5], 0, ctx.des, 0.14, 1.0); });
    const fig = fitOut(M, ctx, { deckH: p.deckH, deckR: p.deckR * 0.92, footR: () => p.b * Math.SQRT2 * 0.98, tieH: 0.0, tieOut: 0.01, ties: 0, stays: null, ladderAz: dAz + 50 });
    const ha = thou(M.ri(4, 30) * 1000);
    const brief = M.pick([
      `Moves with the dry season and watches ${ha} hectares of forest for smoke.`,
      'Goes up the valley after each lightning storm and looks for new fires.',
      `Watches the heath in August from whichever hill is highest that week.`,
    ]);
    return {
      brief, fig,
      specs: [['VIEW', `${M.ri(25, 50)} KM`], ['STAIRS', `${p.tiers} FLIGHTS`]],
      crew: M.ri(1, 2),
      mass: [-p.b, -p.b, 0, p.b, p.b, p.z1 + 0.2 + p.ch],
      places: ['FOREST', 'HEATH', 'VALLEY', 'COUNTY', 'NATIONAL PARK', 'RANGE'],
    };
  },
};

// ================================================================== FACTORY CHIMNEY
const chimney = {
  name: 'FACTORY CHIMNEY',
  plan(M) {
    const p = {};
    p.shape = M.pick(['round', 'oct', 'round']);
    p.R0 = M.r(1.5, 2.2);
    p.R1 = p.R0 * M.r(0.52, 0.64);
    p.hp = M.r(3.5, 5.5);
    p.Hs = M.r(20, 30);
    p.a = p.R0 * 2 + M.r(0.8, 1.4);
    p.deckH = 0.5;
    p.deckR = p.a / 2 + M.r(2.6, 3.6);
    p.deck = M.pick(['square', 'oct']);
    p.z1 = p.deckH + p.hp;
    p.z2 = p.z1 + p.Hs;
    p.bands = M.ri(4, 8);
    p.name = M.pick(['WORKS', 'MILL', 'GASWORKS', 'BRICKWORKS', 'DYEWORKS', 'TANNERY']);
    p.letters = M.chance(0.6);
    p.H = p.z2 + 2.6;
    p.box = { len: p.deckR * 2, wid: p.deckR * 2, hgt: p.H, mass: Math.round(p.R0 * p.R0 * p.Hs * 3.5) };
    return p;
  },
  build(M, p, ctx) {
    const aE = B.viewAz(M), dAz = axisToward(M);
    const a = p.a / 2;
    const rAt = (z) => p.R0 + (p.R1 - p.R0) * (z - p.z1) / p.Hs;
    M.part('BASE DECK', () => { B.baseDeck(M, deckPlan(p.deck, p.deckR), p.deckH); M.callout('BASE DECK', 1, [p.deckR * 0.95, 0, p.deckH * 0.5], 1.0); });
    M.part('PEDESTAL', () => {
      const P = M.box([-a, -a, p.deckH], [a, a, p.z1]);
      for (const k of ['+x', '-x', '+y', '-y']) {
        const f = P.f(k);
        const fa = { '+x': 0, '+y': 90, '-x': 180, '-y': -90 }[k];
        const holes = [];
        if (Math.abs(((fa - dAz + 540) % 360) - 180) < 1) holes.push(B.doorway(f, 0, -f.h / 2, 1.0, 2.0, { ledged: true, fan: 'arch' }));
        else holes.push(B.sash(f, 0, f.h * 0.12, 0.8, 1.2, { panes: [3, 2], arch: true }));
        B.courses(f, f.box, { kind: 'brick', holes });
        B.quoins(f, { h: 0.3 });
      }
      M.box([-a - 0.2, -a - 0.2, p.z1 - 0.3], [a + 0.2, a + 0.2, p.z1], { isect: false });
      M.box([-a - 0.1, -a - 0.1, p.deckH], [a + 0.1, a + 0.1, p.deckH + 0.4], { isect: false });
      M.callout('PEDESTAL', 1, [Math.cos(dAz * D2R) * a, Math.sin(dAz * D2R) * a, p.deckH + 2.6], 0.9);
      M.callout('FLUE DOOR', 1, [Math.cos(dAz * D2R) * a, Math.sin(dAz * D2R) * a, p.deckH + 1], 1.0);
    });
    let L;
    M.part('CHIMNEY SHAFT', () => {
      if (p.shape === 'round') {
        const S = M.lathe([[p.R0, p.z1 - 0.05], [p.R1, p.z2]], {});
        L = S.lat;
        if (M.decorOn) {
          const nc = Math.round(p.Hs / 0.075);
          const step = Math.max(1, Math.ceil(3.2 * M.px / (p.Hs / nc)));
          for (let i = step; i < nc; i += step) L.ring(i / nc, { w: 0, a0: aE - 100, a1: aE + 100 });
          L.shade({ gap: 1.6, gapMax: 6 });
          if (p.letters) { const s = p.name; for (let i = 0; i < s.length; i++) L.text(s[i], aE, 0.55 - i * 0.034 * 30 / p.Hs, Math.min(0.85, p.R1 * 0.7)); }
        }
      } else {
        const k8 = 1 / Math.cos(Math.PI / 8);
        const S = B.polyLathe(M, [[p.R0 * k8, p.z1 - 0.05], [p.R1 * k8, p.z2]], 8);
        if (M.decorOn) for (let i = 0; i < 8; i++) { const f = S.facet(0, i); B.courses(f, f.box, { kind: 'brick' }); }
      }
      // iron bands
      for (let i = 1; i <= p.bands; i++) { const z = p.z1 + p.Hs * i / (p.bands + 1); M.at(0, 0, z, () => M.torus(rAt(z) * (p.shape === 'oct' ? 1.06 : 1.0) + 0.02, 0.05, { isect: false, rings: 6 })); }
      M.callout('IRON BAND', p.bands, [Math.cos(aE * D2R) * rAt(p.z1 + p.Hs * 0.5), Math.sin(aE * D2R) * rAt(p.z1 + p.Hs * 0.5), p.z1 + p.Hs * (Math.round((p.bands + 1) / 2) / (p.bands + 1))], 1.3);
      M.callout('CHIMNEY SHAFT', 1, [Math.cos(aE * D2R) * rAt(p.z1 + p.Hs * 0.3), Math.sin(aE * D2R) * rAt(p.z1 + p.Hs * 0.3), p.z1 + p.Hs * 0.3], 1.5);
    });
    M.part('OVERSAILING CAP', () => {
      const z = p.z2, r = p.R1;
      M.at(0, 0, z, () => {
        M.lathe([[r * 0.98, -0.9], [r * 1.18, -0.5], [r * 1.18, -0.2], [r * 1.3, 0], [r * 1.3, 0.35], [r * 1.1, 0.5], [r * 0.85, 0.5]], { sharpDeg: 20 });
        M.cyl(r * 0.82, 0.3, 0.52, { isect: false, open: true });
      });
      M.tube([r * 1.25, 0, z + 0.5], [r * 1.25, 0, z + 2.4], 0.025, { isect: false });
      M.line([[r * 1.25, 0, z + 0.5], [rAt(p.z1) + 0.15, 0, p.z1]], { w: 1, pass: 2 });
      M.callout('OVERSAILING CAP', 1, [Math.cos(aE * D2R) * r * 1.3, Math.sin(aE * D2R) * r * 1.3, z + 0.2], 1.4);
      M.callout('LIGHTNING CONDUCTOR', 1, [r * 1.25, 0, z + 1.8], 0.6);
    });
    M.part('ACCESS LADDER', () => {
      const q = (aE - 25) * D2R, c = Math.cos(q), s = Math.sin(q);
      const A = [c * (p.R0 + 0.3), s * (p.R0 + 0.3), p.z1], Bp = [c * (p.R1 + 0.3), s * (p.R1 + 0.3), p.z2 - 0.9];
      M.with({}, () => K.ladderAlong(M, A, Bp, { w: 0.42 }));
      const n = Math.floor(p.Hs / 2.5);
      for (let i = 0; i <= n; i++) { const t = i / n, z = p.z1 + (p.z2 - 0.9 - p.z1) * t; M.tube([c * rAt(z), s * rAt(z), z], [c * (rAt(z) + 0.3), s * (rAt(z) + 0.3), z], 0.025, { isect: false, seg: 6 }); }
      M.callout('ACCESS LADDER', 1, [c * (rAt(p.z1 + p.Hs * 0.6) + 0.3), s * (rAt(p.z1 + p.Hs * 0.6) + 0.3), p.z1 + p.Hs * 0.6], 1.2);
    });
    driveCab(M, [a + 1.3, -(a - 0.2) * Math.sign(M.view.e[1] || 1), p.deckH]);
    M.part('NUMBER PLATE', () => { plate(M, [a + 0.21, a * 0.45, p.deckH + 0.75], 0, ctx.des, 0.17, 1.0); });
    const fig = fitOut(M, ctx, { deckH: p.deckH, deckR: p.deckR * 0.92, footR: sqR(a + 0.1), tieH: 0.6, tieOut: 0.6, ties: 8, tieRot: Math.PI / 8, stays: { r: rAt(p.z1 + p.Hs * 0.35), z: p.z1 + p.Hs * 0.35 }, ladderAz: dAz + 45 });
    const brief = M.pick([
      `Goes to whichever works is firing that week and draws for its ${M.ri(2, 6)} boilers.`,
      'Lends its draft to the brickworks in spring and the sugar mill in autumn.',
      `Raises the smoke of the ${p.name.toLowerCase()} ${Math.round(p.z2)} meters above the town.`,
    ]);
    return {
      brief, fig,
      specs: [['DRAFT', `${(M.r(1.5, 3.5)).toFixed(1)} MBAR`], ['FLUE', `${r1(p.R1 * 1.6)} M`]],
      crew: 2,
      mass: [-a, -a, 0, a, a, p.z2],
      places: ['INDUSTRIAL', 'MILL TOWN', 'WORKS', 'DOCKSIDE', 'COLLIERY', 'CANAL'],
    };
  },
};

const OBJECTS = { lighthouse, windmill, clocktower, watertower, lookout, chimney };

function designation(M) {
  const L = () => LET[Math.floor(M.rng() * LET.length)];
  const k = M.rng();
  const a = L(), b = L(), n = M.ri(2, 48), m = L();
  if (k < 0.4) return `${a}${b}-${String(n).padStart(2, '0')}`;
  if (k < 0.7) return `T-${n}${m}`;
  return `NO. ${n}`;
}

export default {
  id: 'tower',
  family: 'ground',
  weight: 2,
  build(M) {
    const names = Object.keys(OBJECTS);
    let v = M.pick(names);
    if (G && G.test && names.includes(G.test.variant)) v = G.test.variant;
    const O = OBJECTS[v];
    const p = O.plan(M);
    const des = designation(M);
    const az = M.pick([45, -45, 135, -135]) + M.r(-12, 12);
    M.setView(az, M.r(26, 33));
    const g = gearPlan(M, { ...p.box, kinds: p.kinds });
    const ctx = { g, des };
    let res;
    M.at(0, 0, g.z, () => { res = O.build(M, p, ctx); });
    const mb = res.mass;
    M.info.mass = [mb[0], mb[1], mb[2] + g.z, mb[3], mb[4], mb[5] + g.z];
    M.info.centers = [[[0, 0, g.z - 1], [0, 0, g.z + p.box.hgt + 1]]];
    const gi = g.build() || { specs: [], figure: null };
    const crew = res.crew;
    const mass = Math.round(p.box.mass + (gi.mass || 0));
    const specs = [...(gi.specs || []).slice(0, 1), ['MASS', `${mass} T`], ['CREW', String(crew)], ...res.specs].slice(0, 4);
    // the title line: plain and exact
    const place = M.pick(res.places);
    const opts = [`${g.adj} ${O.name}`, `${O.name} ${g.form}`, `${place} ${O.name} ${g.form}`];
    let klass = opts[M.ri(0, 2)];
    if (klass.length > 34) klass = opts[0].length <= 34 ? opts[0] : O.name;
    return {
      klass, brief: res.brief, specs, designation: des,
      family: g.family, float: g.float,
      figure: gi.figure || res.fig || null,
    };
  },
};
void word; void r1;
