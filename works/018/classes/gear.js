// classes/gear.js: running gear for things that are not vehicles (round 2, the odd ones).
// The caller declares its object's box and mass; plan() picks a kind of running gear and
// sizes it; the caller builds its object inside M.at(0, 0, g.z, ...) centered in x/y with its
// lowest points on local z = 0, inside the declared box; then build() adds a chassis frame
// just under that plane and the gear, all clear of the box.
//
//   const g = G.plan(M, { len, wid, hgt, mass, kinds, round });
//   g.kind g.z g.family g.float g.form g.adj g.goes g.places g.variant
//   M.at(0, 0, g.z, () => buildObject());
//   const gi = g.build();   // { specs, figure }
//
// Test hooks: G.test.gear forces the kind, G.test.variant is for the object classes.

import * as K from '../kit.js';
import { word } from '../words.js';
import { add, sub, mul, norm, cross, lerp, len, D2R } from '../geom.js';
import * as A from './parts-air.js';
import * as SEA from './parts-sea.js';
import * as RL from './parts-rail.js';
import * as PG from './parts-ground.js';

export const test = { gear: null, variant: null, gearVariant: null };
// pick a variant from [[w, name], ...]; test.gearVariant forces one when it names one here
function vpick(M, list) { const v = M.wpick(list); return list.some((x) => x[1] === test.gearVariant) ? test.gearVariant : v; }

export const KINDS = ['wheels', 'trike', 'tracks', 'legs', 'rails', 'skis', 'hover', 'floats',
  'paddles', 'rotors', 'wings', 'ringwing', 'balloons', 'rockets', 'monowheel', 'sails'];

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const U = (s) => s.toUpperCase();

// ------------------------------------------------------------------ words per kind
const WORDS = {
  wheels: { family: 'ground', form: ['ON WHEELS'], adj: ['WHEELED'], places: ['ROAD', 'HARBOR', 'MARKET', 'DESERT', 'PRAIRIE', 'COUNTY', 'CITY', 'AIRFIELD'] },
  trike: { family: 'ground', form: ['TRICYCLE', 'ON 3 WHEELS'], adj: ['THREE-WHEELED'], places: ['CITY', 'PROMENADE', 'BOULEVARD', 'SUBURBAN', 'RIVIERA', 'MARKET', 'CAMPUS'] },
  tracks: { family: 'ground', form: ['ON TRACKS', 'CRAWLER'], adj: ['TRACKED'], places: ['TUNDRA', 'DUNE', 'MARSH', 'POLAR', 'QUARRY', 'MOOR', 'GLACIER', 'STEPPE'] },
  legs: { family: 'ground', form: ['ON LEGS', 'WALKER'], adj: ['WALKING'], places: ['FOREST', 'MOUNTAIN', 'SWAMP', 'BOULDER', 'HIGHLAND', 'CANYON', 'JUNGLE'] },
  rails: { family: 'rail', form: ['ON RAILS', 'RAILCAR'], adj: ['RAIL', 'RAILBORNE'], places: ['BRANCH LINE', 'MAIN LINE', 'MOUNTAIN', 'COLLIERY', 'DOCKYARD', 'SUBURBAN', 'NARROW-GAUGE'] },
  skis: { family: 'ground', form: ['ON SKIS', 'SLED', 'ON RUNNERS'], adj: ['SKI-BORNE', 'SLEDGE'], places: ['POLAR', 'ALPINE', 'GLACIER', 'TUNDRA', 'ICE SHELF', 'SNOWFIELD', 'ARCTIC'] },
  hover: { family: 'ground', form: ['HOVERCRAFT', 'ON AIR'], adj: ['HOVERING', 'AIR-CUSHION'], places: ['ESTUARY', 'MUDFLAT', 'DELTA', 'SALT PAN', 'LAGOON', 'ICE', 'TIDAL'] },
  floats: { family: 'sea', form: ['ON FLOATS', 'ON PONTOONS'], adj: ['FLOATING', 'PONTOON'], places: ['LAKE', 'HARBOR', 'LAGOON', 'CANAL', 'RIVER', 'BAY', 'FJORD'] },
  paddles: { family: 'sea', form: ['PADDLER', 'ON PADDLES'], adj: ['PADDLE', 'STEAM'], places: ['RIVER', 'CANAL', 'LAKE', 'DELTA', 'BAYOU', 'ESTUARY', 'BACKWATER'] },
  rotors: { family: 'air', form: ['UNDER ROTORS', 'ROTORCRAFT'], adj: ['FLYING', 'ROTOR'], places: ['MOUNTAIN', 'OFFSHORE', 'ISLAND', 'VALLEY', 'COASTAL', 'RIDGE', 'HIGHLAND'] },
  wings: { family: 'air', form: ['WITH WINGS', 'AIRPLANE'], adj: ['WINGED', 'FLYING'], places: ['AIRFIELD', 'COASTAL', 'MAIL ROUTE', 'ISLAND', 'TRANSIT', 'CHARTER'] },
  ringwing: { family: 'air', form: ['RING-WING', 'ON A RING'], adj: ['ANNULAR', 'RING-WING'], places: ['AIRFIELD', 'TRANSIT', 'EXPRESS', 'CHARTER', 'INTERCITY', 'MAIL ROUTE', 'ISLAND'] },
  balloons: { family: 'air', form: ['UNDER BALLOONS', 'AEROSTAT'], adj: ['FLOATING', 'BALLOON'], places: ['VALLEY', 'HIGH-ALTITUDE', 'FESTIVAL', 'CANYON', 'LAKESIDE', 'CLOUD', 'UPLAND'] },
  rockets: { family: 'space', form: ['ROCKET', 'ON ROCKETS'], adj: ['ROCKET', 'LUNAR'], places: ['LUNAR', 'ORBITAL', 'CRATER', 'MARTIAN', 'SUBORBITAL', 'ASTEROID', 'LAUNCH'] },
  monowheel: { family: 'ground', form: ['MONOWHEEL', 'IN A WHEEL'], adj: ['MONOWHEEL', 'ROLLING'], places: ['DESERT', 'SALT FLAT', 'PRAIRIE', 'STEPPE', 'BOULEVARD', 'DUNE', 'CAUSEWAY'] },
  sails: { family: 'ground', form: ['UNDER SAIL', 'LAND YACHT'], adj: ['SAILING'], places: ['BEACH', 'SALT FLAT', 'LAKE', 'COASTAL', 'DRY LAKE', 'LAGOON', 'ESTUARY'] },
};

// ------------------------------------------------------------------ helpers
function co(M, label, qty, p, prio = 0.6) {
  const w = M.W(p), e = M.view.e, k = (M.px || 0) * 4;
  M.world(() => M.callout(label, qty, [w[0] + e[0] * k, w[1] + e[1] * k, w[2] + e[2] * k], prio));
}
// which side of the current frame's y (x) axis faces the viewer
const seenAx = (M, ax) => { const a = M.W([0, 0, 0]), b = M.W(ax), e = M.view.e; return (b[0] - a[0]) * e[0] + (b[1] - a[1]) * e[1] + (b[2] - a[2]) * e[2] >= 0 ? 1 : -1; };
const seenY = (M) => seenAx(M, [0, 1, 0]);
const seenX = (M) => seenAx(M, [1, 0, 0]);

// default kind weights from the box's shape: unsuitable pairings become rare, never impossible
function shapeKinds(L, W, H) {
  const w = {};
  const tall = H > 2.2 * Math.max(L, W), low = L > 3 * H, small = Math.max(L, W, H) < 2.5;
  for (const k of KINDS) {
    let v = 1;
    if (tall && ['balloons', 'rotors', 'wings', 'ringwing', 'monowheel', 'sails'].includes(k)) v *= 0.08;
    if (low && ['monowheel', 'ringwing'].includes(k)) v *= 0.2;
    if (small && ['paddles', 'floats'].includes(k)) v *= 0.25;
    w[k] = v;
  }
  return w;
}
// `shape` (from shapeKinds) also thins the caller's own list: a chimney under balloons stays rare
function pickKind(M, kinds, shape) {
  let list;
  if (!kinds) list = KINDS.map((k) => [1, k]);
  else if (Array.isArray(kinds)) list = kinds.filter((k) => KINDS.includes(k)).map((k) => [1, k]);
  else list = Object.entries(kinds).filter(([k]) => KINDS.includes(k)).map(([k, w]) => [w, k]);
  if (!list.length) list = [[1, 'wheels']];
  if (shape) list = list.map(([w, k]) => [w * (shape[k] ?? 1), k]);
  return M.wpick(list);
}

// spread n values evenly over [a, b]
const spread = (n, a, b) => (n === 1 ? [(a + b) / 2] : Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1)));

// ------------------------------------------------------------------ the chassis frame
// Two side rails and cross members just under z = g.z, optional deck plate on top, optional
// outriggers (cross beams reaching out to y = +-o.out at the given xs).
function chassis(M, g, o = {}) {
  const z1 = g.z, fd = g.fd, z0 = z1 - fd, zt = z1 - g.dt, zm = (z0 + zt) / 2;
  const ry = o.ry ?? g.W * 0.34, bw = fd * 0.55;
  // a round object's frame stays inside the len x wid ellipse
  const rx0 = g.round ? g.L / 2 * Math.sqrt(Math.max(0.1, 1 - (ry / (g.W / 2)) ** 2)) * 0.95 : g.L * 0.44;
  const x1 = o.x1 ?? o.rx ?? rx0, x0 = o.x0 ?? -(o.rx ?? rx0);
  const rx = Math.max(x1, -x0);
  const sy = seenY(M);
  const fr = { z0, z1: zt, zm, x0, x1, rx, ry, bw, ends: [] };
  M.part('CHASSIS FRAME', () => {
    for (const s of [1, -1]) {
      const R = M.box([x0, s * ry - bw / 2, z0], [x1, s * ry + bw / 2, zt]);
      const f = R.f(s > 0 ? '+y' : '-y');
      if (f.on) {
        f.line(-f.w / 2, f.h * 0.3, f.w / 2, f.h * 0.3, { w: 0 });
        f.rivets(-f.w / 2 + f.mOf(4), -f.h * 0.2, f.w / 2 - f.mOf(4), -f.h * 0.2, { pitch: 9 });
        const n = Math.max(2, Math.round((x1 - x0) / (fd * 2.4)));
        if (f.pxOf(fd) > 7) for (let i = 1; i < n; i++) { const x = -f.w / 2 + f.w * i / n; f.circle(x, 0.02 * f.h, f.h * 0.16, { w: 1 }); }
        if (f.tone > 0.3) f.hatch([-f.w / 2, -f.h / 2, f.w / 2, f.h / 2], { angle: 0, gap: 3.4 - 1.6 * f.tone, w: 0 });
      }
    }
    const xs = o.cross ?? spread(Math.max(2, Math.round((x1 - x0) / Math.max(0.6, g.W * 0.45)) + 1), x0 + bw, x1 - bw);
    for (const x of xs) M.box([x - bw * 0.4, -ry, z0 + fd * 0.15], [x + bw * 0.4, ry, zt - fd * 0.1]);
    if (o.out) for (const x of o.outXs || xs) {
      M.box([x - bw * 0.45, -o.out, z0 + fd * 0.1], [x + bw * 0.45, o.out, zt - fd * 0.15]);
      for (const s of [1, -1]) M.box([x - bw * 0.6, s * o.out - bw * 0.1, z0], [x + bw * 0.6, s * o.out + bw * 0.1, zt - fd * 0.05], { isect: false });
    }
    // arms out to given points [x, y] (corners for posts, ropes, legs), from the nearest rail end
    for (const p of o.arms || []) {
      const a = [clamp(p[0], x0 + bw, x1 - bw), Math.sign(p[1] || 1) * ry, zm];
      if (Math.hypot(p[0] - a[0], p[1] - a[1]) < bw) { fr.ends.push([p[0], p[1], zm]); continue; }
      beam(M, a, [p[0], p[1], zm], bw * 0.8, fd * 0.7);
      M.at(p[0], p[1], zm, () => M.box([-bw * 0.7, -bw * 0.7, -fd * 0.5], [bw * 0.7, bw * 0.7, fd * 0.45], { isect: false }));
      fr.ends.push([p[0], p[1], zm]);
    }
    if (g.deck) {
      if (g.round) {
        const D = M.cyl(Math.min(g.L, g.W) * 0.45, zt, z1);
        if (D.top.on) { D.top.circle(0, 0, Math.min(g.L, g.W) * 0.38, { w: 0 }); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; D.top.line(0, 0, Math.cos(a) * Math.min(g.L, g.W) * 0.43, Math.sin(a) * Math.min(g.L, g.W) * 0.43, { w: 0 }); } }
      } else {
        const dx = g.L * 0.47, dy = g.W * 0.43;
        const D = M.box([-dx, -dy, zt], [dx, dy, z1]);
        const top = D.f('+z');
        if (top.on) {
          const n = Math.max(2, Math.round(dx * 2 / (dy * 0.9)));
          for (let i = 1; i < n; i++) { const x = -top.w / 2 + top.w * i / n; top.line(x, -top.h / 2, x, top.h / 2, { w: 0 }); }
        }
        for (const k of ['+x', '-x', '+y', '-y']) {
          const f = D.f(k);
          if (f.on && f.pxOf(f.h) > 4) f.rivets(-f.w / 2 + f.mOf(3), 0, f.w / 2 - f.mOf(3), 0, { pitch: 8 });
        }
        co(M, 'LOAD DECK', 1, [dx * 0.6 * seenX(M), dy * sy, z1 - g.dt / 2], 0.4);
      }
    }
    co(M, 'CHASSIS FRAME', 1, [x1 * 0.3, (ry + bw / 2) * sy, zm], 0.5);
  });
  return fr;
}
// a rectangular beam between two points
function beam(M, a, b, w, h, o = {}) {
  return M.along(a, b, (l) => M.box([0, -w / 2, -h / 2], [l, w / 2, h / 2], o));
}
// corner points just outside the box (or n radial points for round objects), at margin m
function cornerPts(g, m, n = 4) {
  if (g.round) {
    // radial points just outside the len x wid ellipse
    const A = g.L / 2, B = g.W / 2;
    const at = (a) => { const r = 1 / Math.hypot(Math.cos(a) / A, Math.sin(a) / B) + m * 1.2; return [Math.cos(a) * r, Math.sin(a) * r]; };
    if (n === 4) return [45, 135, 225, 315].map((d) => at(d * D2R));
    return Array.from({ length: n }, (_, i) => at((i + 0.5) * 2 * Math.PI / n));
  }
  return [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => [a * (g.L / 2 + m), b * (g.W / 2 + m)]);
}

// ------------------------------------------------------------------ kinds
const KIND = {};

// ---------------------------------------------------- wheels
KIND.wheels = {
  plan(M, g) {
    g.variant = vpick(M, [[3, 'truck'], [2, 'wagon'], [1.5, 'castor']]);
    const sz = Math.max(g.L, g.H * 0.8, 1.5);
    if (g.variant === 'truck') {
      g.r = clamp(sz * 0.085 + Math.sqrt(g.mass) * 0.04, 0.28, 2.0);
      g.n = clamp(Math.round(g.L / (g.r * 3.2)), 2, 5);
      g.n = clamp(g.n + M.ri(-1, 0), 2, 5);
      g.ww = g.r * M.r(0.5, 0.7);
      g.twin = g.mass > 12 && M.chance(0.5);
      g.guards = M.chance(0.6);
      g.z = g.r * M.r(1.2, 1.4) + g.fd;
    } else if (g.variant === 'wagon') {
      g.r = clamp(Math.max(g.H * 0.32, g.L * 0.16), 0.45, 2.6);
      g.n = 2;
      g.ww = g.r * 0.16;
      g.spokes = M.pick([10, 12, 14, 16]);
      g.guards = M.chance(0.25) && false;   // wagon wheels go without
      g.z = g.r + g.fd * M.r(1.1, 1.4);
    } else {
      g.r = clamp(sz * 0.035, 0.12, 0.45);
      g.n = clamp(Math.round(g.L / (g.r * 5)), 3, 7);
      g.rows = g.W > g.L * 0.7 && M.chance(0.6) ? 3 : 2;
      g.ww = g.r * 0.5;
      g.z = g.r * 2 + g.r * 1.1 + g.fd;
    }
    g.count = g.variant === 'castor' ? g.n * g.rows : g.n * 2 * (g.twin ? 2 : 1);
    g.goes = [`rolls on ${word(g.count)} wheels`, `runs on ${word(g.n)} axles`];
    if (g.variant === 'castor') g.goes = [`rolls on ${word(g.count)} castors`];
    if (g.variant === 'wagon') g.goes = [`rolls on ${word(g.count)} spoked wheels`, 'rolls on two axles'];
    g.specs = [['SPEED', `${Math.round(clamp(80 - g.mass * 1.2, 18, 90))} KM/H`], [g.variant === 'castor' ? 'CASTORS' : 'WHEELS', String(g.count)]];
  },
  build(M, g) {
    const sy = seenY(M);
    if (g.variant === 'castor') {
      const rx = g.L * 0.42, ry = g.W * 0.36;
      chassis(M, g, { rx, ry });
      const xs = spread(g.n, -rx * 0.92, rx * 0.92), ys = g.rows === 3 ? [-ry, 0, ry] : [-ry, ry];
      M.part('CASTOR', () => {
        for (const x of xs) for (const y of ys) M.at(x, y, 0, () => {
          const r = g.r, top = g.z - g.fd;
          M.cyl(r * 0.55, top - r * 0.28, top, { isect: false });            // swivel plate
          M.cyl(r * 0.22, top - r * 0.9, top - r * 0.28, { isect: false });  // kingpin
          for (const s of [1, -1]) M.box([-r * 0.5, s * g.ww * 0.62, r], [r * 0.15, s * (g.ww * 0.62 + r * 0.12), top - r * 0.8]);
          M.box([-r * 0.5, -g.ww * 0.75, top - r * 1.0], [r * 0.2, g.ww * 0.75, top - r * 0.8]);
          M.at(-r * 0.2, 0, r, () => K.wheel(M, { r, w: g.ww, hub: r * 0.5, hubs: 'seen' }));
        });
        co(M, 'CASTOR', g.count, [xs[xs.length - 1], ys[sy > 0 ? ys.length - 1 : 0] + sy * g.ww * 0.6, g.r], 0.7);
      });
      return;
    }
    const r = g.r, ww = g.ww * (g.twin ? 2.2 : 1);
    const yw = g.W / 2 + ww * 0.6 + g.gap;
    const xs = g.n === 2 ? [-g.L * 0.33, g.L * 0.33] : spread(g.n, -g.L * 0.38, g.L * 0.38);
    const fr = chassis(M, g, { out: g.W * 0.36 });
    M.part('AXLE', () => {
      for (const x of xs) {
        M.tube([x, -yw + ww * 0.3, r], [x, yw - ww * 0.3, r], Math.max(0.03, r * 0.09));
        for (const s of [1, -1]) {
          if (g.variant === 'truck') {
            // leaf spring from the rail down to the axle, hanger brackets
            const y = s * fr.ry;
            M.at(x, y, r + r * 0.09, () => { const ls = Math.min(r * 1.6, g.L * 0.18); leafSpringLite(M, ls, r * 0.06, fr.bw * 0.7, fr.z0 - r - r * 0.09); });
          } else {
            M.box([x - r * 0.12, s * fr.ry - fr.bw / 2, r], [x + r * 0.12, s * fr.ry + fr.bw / 2, fr.z0]);
          }
        }
      }
      co(M, g.variant === 'truck' ? 'SPRUNG AXLE' : 'AXLE', g.n, [xs[0], 0, r], 0.5);
    });
    M.part('WHEEL', () => {
      for (const x of xs) for (const s of [1, -1]) M.at(x, s * yw, r, () => {
        if (g.variant === 'wagon') spokedWheel(M, { r, w: g.ww, spokes: g.spokes });
        else if (g.twin) K.twinWheel(M, { r, w: g.ww, hubs: 'seen' });
        else K.wheel(M, { r, w: ww, hub: r * 0.55, hubs: 'seen' });
      });
      co(M, g.variant === 'wagon' ? 'SPOKED WHEEL' : 'WHEEL', g.count, [xs[xs.length - 1], sy * (yw + ww / 2), r * 1.4], 0.8);
    });
    if (g.guards) M.part('MUDGUARD', () => {
      for (const x of xs) for (const s of [1, -1]) M.at(x, s * yw, r, () => {
        guard(M, r, ww * 1.1);
        // stay from the guard's low end in to the frame, under the plane
        M.tube([r * 1.12, -s * ww * 0.4, r * 0.2], [r * 0.6, -s * (yw - fr.ry), fr.z0 - r + g.fd * 0.3], Math.max(0.02, r * 0.035), { isect: false });
      });
      co(M, 'MUDGUARD', g.count, [xs[0], sy * yw, r * 2.15], 0.4);
    });
  },
};

// ---------------------------------------------------- tracks
KIND.tracks = {
  plan(M, g) {
    g.variant = vpick(M, [[3, 'pair'], [2, 'corners']]);
    const sz = Math.max(g.L, 1.5);
    if (g.variant === 'pair') {
      g.tr = clamp(sz * 0.07 + Math.sqrt(g.mass) * 0.03, 0.22, 1.0);
      g.tl = g.L * M.r(0.85, 1.0);
      g.tw = clamp(g.W * M.r(0.2, 0.3), 0.25, 1.4);
      g.z = Math.max(g.tr * M.r(1.5, 1.8), g.tr * 1.4 + g.fd);
      g.count = 2;
    } else {
      g.tr = clamp(sz * 0.06, 0.16, 0.9);
      g.tl = clamp(g.L * 0.34, g.tr * 3.6, g.L * 0.45);
      g.tw = clamp(g.W * 0.18, 0.2, 1.3);
      g.z = g.tr * 2 + g.tr * 1.0 + g.fd * 0.5;
      g.count = 4;
    }
    g.goes = g.count === 2 ? ['crawls on two tracks', 'runs on two steel tracks'] : ['crawls on four track units', 'runs on four track trucks'];
    g.specs = [['SPEED', `${Math.round(clamp(40 - g.mass * 0.5, 6, 40))} KM/H`], ['TRACKS', String(g.count)]];
  },
  build(M, g) {
    const sy = seenY(M);
    const yt = g.W / 2 + g.tw / 2 + g.gap;
    if (g.variant === 'pair') {
      const fr = chassis(M, g, { out: yt - g.tw * 0.3, outXs: spread(3, -g.tl * 0.36, g.tl * 0.36) });
      M.part('TRACK UNIT', () => {
        for (const s of [1, -1]) M.at(0, s * yt, 0, () => K.track(M, { len: g.tl, r: g.tr, w: g.tw, pitch: Math.max(0.12, g.tr * 0.4) }));
        // track frame: a box beam inside the loop at wheel height, hung from the outriggers
        for (const s of [1, -1]) {
          M.box([-g.tl / 2 + g.tr, s * yt - g.tw * 0.2, g.tr * 1.05], [g.tl / 2 - g.tr, s * yt + g.tw * 0.2, g.tr * 1.35], { isect: false });
          for (const x of spread(3, -g.tl * 0.36, g.tl * 0.36)) M.box([x - g.tr * 0.15, s * (yt - g.tw * 0.32) - 0.02, g.tr * 1.3], [x + g.tr * 0.15, s * (yt - g.tw * 0.32) + 0.02, fr.z0 + g.fd * 0.2]);
        }
        co(M, 'TRACK UNIT', 2, [g.tl * 0.1, sy * (yt + g.tw / 2), g.tr * 1.9], 0.8);
        co(M, 'DRIVE SPROCKET', 2, [g.tl / 2 - g.tr, sy * (yt + g.tw * 0.4), g.tr], 0.5);
        co(M, 'ROAD WHEEL', 2 * Math.max(3, Math.round((g.tl - 2 * g.tr) / (g.tr * 1.1)) + 1), [0, sy * (yt + g.tw * 0.4), g.tr * 0.62], 0.4);
      });
      return;
    }
    // four track trucks at the corners, each on a pivot under an outrigger
    const xs = [-g.L * 0.5 + g.tl * 0.5, g.L * 0.5 - g.tl * 0.5];
    const fr = chassis(M, g, { out: yt, outXs: xs });
    M.part('TRACK TRUCK', () => {
      for (const x of xs) for (const s of [1, -1]) M.at(x, s * yt, 0, () => {
        K.track(M, { len: g.tl, r: g.tr, w: g.tw, pitch: Math.max(0.1, g.tr * 0.4) });
        M.box([-g.tl / 2 + g.tr, -g.tw * 0.25, g.tr * 2.05], [g.tl / 2 - g.tr, g.tw * 0.25, g.tr * 2.35]);
        M.cyl(g.tr * 0.4, g.tr * 2.35, fr.z0 + g.fd * 0.15);
        M.cyl(g.tr * 0.55, fr.z0 - g.tr * 0.25, fr.z0 + g.fd * 0.1, { isect: false });
      });
      co(M, 'TRACK TRUCK', 4, [xs[1], sy * (yt + g.tw / 2), g.tr * 1.5], 0.8);
      co(M, 'SLEWING PIVOT', 4, [xs[0], sy * yt, fr.z0 - g.tr * 0.1], 0.45);
    });
  },
};

// ---------------------------------------------------- legs
KIND.legs = {
  plan(M, g) {
    const low = g.L > 3 * g.H;
    g.variant = vpick(M, [[3, 'insect'], [low ? 0.15 : 1.2, 'bird']]);
    const sz = Math.max(g.L, g.W, 1.5), diag = Math.hypot(g.L, g.W);
    const small = Math.max(g.L, g.W, g.H) < 2.5;
    if (g.variant === 'insect') {
      g.n = M.wpick([[3, 4], [3, 6], [1.5, 8]]);
      if (g.L < g.W * 1.2 && g.n === 8 && !g.round) g.n = 6;
      g.reach = clamp(sz * M.r(0.32, 0.45), 0.6, 8);
      g.z = clamp(Math.min(sz * M.r(0.32, 0.45), g.H * 1.1 + 0.4), 0.8, 7);
      g.lr = clamp(sz * 0.02, 0.04, 0.5);
      // feet no farther out than 0.45 x the plan diagonal beyond the box
      g.reach = Math.min(g.reach, Math.max(0.3, (0.36 * diag - g.gap - g.lr * 3) / 0.75));
      // knees no higher than the lower third of the box, unless the object is small
      g.kr = small ? g.z * 0.35 : Math.min(g.z * 0.35, Math.max(0.05, g.H / 3 - g.fd * 0.5));
      g.foot = M.pick(['pad', 'claw']);
      g.goes = [`walks on ${word(g.n)} legs`, `steps on ${word(g.n)} legs`];
    } else {
      g.n = 2;
      g.z = clamp(Math.min(Math.max(g.H * 0.9, diag * 0.35), g.H * 1.4 + 0.8), 1.0, 8);
      g.lr = clamp(sz * 0.03, 0.06, 0.45);
      g.goes = ['walks on two legs', 'strides on two legs'];
    }
    g.specs = [['STRIDE', `${(g.z * 1.1).toFixed(1)} M`], ['LEGS', String(g.n)]];
  },
  build(M, g) {
    if (g.variant === 'bird') return birdLegs(M, g);
    const e = M.view.e;
    const fr = chassis(M, g, {});
    const legs = [];
    if (g.round) {
      for (let i = 0; i < g.n; i++) {
        const a = (i + 0.5) * 2 * Math.PI / g.n;
        const d = [Math.cos(a), Math.sin(a), 0];
        legs.push({ hip: [d[0] * fr.rx * 0.9, d[1] * fr.ry, fr.z0 + g.fd * 0.5], d });
      }
    } else {
      const m = g.n / 2;
      const xs = spread(m, -fr.rx * 0.85, fr.rx * 0.85);
      for (const s of [1, -1]) xs.forEach((x, i) => {
        const fan = m === 1 ? 0 : (i / (m - 1) - 0.5) * 50;
        const a = (90 * s - fan * s) * D2R;
        legs.push({ hip: [x, s * fr.ry, fr.z0 + g.fd * 0.5], d: [Math.cos(a), Math.sin(a), 0] });
      });
    }
    const lr = g.lr;
    M.part('WALKING LEG', () => {
      let best = null;
      for (const lg of legs) {
        const { d } = lg, hip0 = lg.hip;
        // distance from the hip to the box edge along d (an ellipse for round objects)
        let out;
        if (g.round) {
          const A = g.L / 2, B = g.W / 2;
          const qa = (d[0] / A) ** 2 + (d[1] / B) ** 2, qb = 2 * (hip0[0] * d[0] / A / A + hip0[1] * d[1] / B / B), qc = (hip0[0] / A) ** 2 + (hip0[1] / B) ** 2 - 1;
          out = (-qb + Math.sqrt(Math.max(0, qb * qb - 4 * qa * qc))) / (2 * qa);
          // the corner of the box is the honest limit when the object fills it
          const tx = Math.abs(d[0]) > 1e-3 ? (g.L / 2 - Math.abs(hip0[0])) / Math.abs(d[0]) : 1e9;
          const ty = Math.abs(d[1]) > 1e-3 ? (g.W / 2 - Math.abs(hip0[1])) / Math.abs(d[1]) : 1e9;
          out = Math.max(out, Math.min(tx, ty));
        } else {
          const tx = Math.abs(d[0]) > 1e-3 ? (g.L / 2 - Math.abs(hip0[0])) / Math.abs(d[0]) : 1e9;
          const ty = Math.abs(d[1]) > 1e-3 ? (g.W / 2 - Math.abs(hip0[1])) / Math.abs(d[1]) : 1e9;
          out = Math.min(tx, ty);
        }
        out += g.gap + lr * 3;
        // the hip stands just outside the box on an arm from the frame; the whole leg is outside
        const base = lg.hip, hip = add(base, mul(d, out));
        beam(M, base, hip, Math.max(lr * 2.2, g.fd * 0.45), g.fd * 0.6);
        const H = add(hip, mul(d, lr * 2.5));
        const Kn = add(hip, add(mul(d, g.reach * 0.3), [0, 0, g.fd * 0.5 + g.kr]));
        const F = add(hip, mul(d, g.reach * 0.75)); F[2] = 0;
        const A = [F[0], F[1], lr * 3];
        const n = norm(cross(d, [0, 0, 1]));
        M.with({ at: hip, rz: Math.atan2(d[1], d[0]) / D2R }, () => M.box([-lr * 2, -lr * 2.4, -g.fd * 0.5], [lr * 3.5, lr * 2.4, g.fd * 0.5]));
        const pin = (p, r, w) => M.at(p[0], p[1], p[2], () => M.with({ rz: Math.atan2(n[1], n[0]) / D2R }, () => M.ry(90, () => M.cyl(r, -w, w, { isect: false }))));
        pin(H, lr * 1.5, lr * 2.6);
        for (const o of [-1, 1]) K.strut(M, add(H, mul(n, o * lr * 1.4)), add(Kn, mul(n, o * lr * 1.1)), lr * 0.75, {});
        for (let q = 0; q < 3; q++) { const a = lerp(H, Kn, (q + 0.3) / 3), b = lerp(H, Kn, (q + 0.8) / 3); M.tube(add(a, mul(n, lr * 1.4)), add(b, mul(n, -lr * 1.25)), lr * 0.35, { isect: false }); }
        pin(Kn, lr * 1.6, lr * 2.3);
        const mid = lerp(Kn, A, 0.5);
        M.tube(Kn, mid, lr * 1.15, {});
        K.collar(M, Kn, A, 0.5, lr * 1.15, { len: lr * 1.2, k: 1.25 });
        M.tube(mid, A, lr * 0.8, {});
        K.ball(M, A, lr * 1.25);
        const hb = add(hip, [0, 0, -g.fd * 0.5 - lr * 2]);
        const ht = lerp(H, Kn, 0.45);
        M.tube(hb, lerp(hb, ht, 0.55), lr * 0.6, {});
        M.tube(lerp(hb, ht, 0.5), ht, lr * 0.36, { isect: false });
        M.at(F[0], F[1], 0, () => {
          if (g.foot === 'pad') K.footpad(M, { r: lr * 5 });
          else M.rz(Math.atan2(d[1], d[0]) / D2R, () => {
            M.box([-lr * 3, -lr * 2.4, 0], [lr * 3, lr * 2.4, lr * 1.1]);
            for (const a of [-35, 0, 35]) M.rz(a, () => M.loft([[lr * 2.4, -lr * 0.7, 0], [lr * 2.4, lr * 0.7, 0], [lr * 2.4, lr * 0.7, lr], [lr * 2.4, -lr * 0.7, lr]], [[lr * 6, -lr * 0.3, 0], [lr * 6, lr * 0.3, 0], [lr * 6, lr * 0.3, lr * 0.3], [lr * 6, -lr * 0.3, lr * 0.3]], { isect: false }));
            M.cyl(lr * 1.1, lr * 1.1, lr * 3, { isect: false });
          });
        });
        const facing = d[0] * e[0] + d[1] * e[1];
        if (!best || facing > best.f) best = { f: facing, Kn, A, F, H };
      }
      const ne = (p, k) => add(p, mul(e, lr * k));
      co(M, 'WALKING LEG', g.n, ne(lerp(best.Kn, best.A, 0.3), 1.3), 0.8);
      co(M, 'KNEE JOINT', g.n, ne(best.Kn, 2.4), 0.5);
      co(M, g.foot === 'pad' ? 'FOOTPAD' : 'CLAW FOOT', g.n, [best.F[0], best.F[1], lr * 1.5], 0.6);
      co(M, 'HIP RAM', g.n, ne(lerp(best.H, best.Kn, 0.3), 1), 0.35);
    });
  },
};

// two big bird legs under the middle and a balancing tail boom
function birdLegs(M, g) {
  const e = M.view.e, sy = seenY(M);
  const fr = chassis(M, g, { rx: g.L * 0.3 });
  const lr = g.lr, yl = g.W / 2 + g.gap + lr * 3;
  M.part('BIRD LEG', () => {
    for (const s of [1, -1]) {
      const hip = [0, s * yl, fr.z0 + g.fd * 0.5];
      M.box([-lr * 2.5, Math.min(s * fr.ry, s * (yl + lr * 1.5)), hip[2] - lr * 2], [lr * 2.5, Math.max(s * fr.ry, s * (yl + lr * 1.5)), Math.min(hip[2] + lr * 2, fr.z1)]);
      M.at(hip[0], hip[1], hip[2], () => M.rx(90, () => M.cyl(lr * 2.6, -lr * 1.8, lr * 1.8, { isect: false })));
      // the knee points back, the ankle forward, the toes under the hip
      const hz = hip[2];
      const knee = [-hz * 0.3, s * yl, hz * 0.58];
      const ankle = [hz * 0.16, s * yl, hz * 0.17];
      const foot = [hz * 0.03, s * yl, 0];
      M.tube(hip, knee, lr * 1.6, {});
      K.ball(M, knee, lr * 2);
      M.tube(knee, ankle, lr * 1.15, {});
      K.collar(M, knee, ankle, 0.5, lr * 1.15, { len: lr * 1.5 });
      K.ball(M, ankle, lr * 1.5);
      M.tube(ankle, add(foot, [0, 0, lr * 1.4]), lr * 1.0, {});
      // a ram in front of the thigh to the shin
      M.tube(add(hip, [lr * 3.5, 0, -lr * 1.5]), lerp(knee, ankle, 0.3), lr * 0.55, { isect: false });
      M.at(foot[0], foot[1], 0, () => {
        M.cyl(lr * 1.8, 0, lr * 1.6, { isect: false });
        for (const a of [-28, 0, 28, 180]) M.rz(a, () => {
          const tl = a === 180 ? lr * 5 : lr * 8;
          M.loft([[lr * 1.2, -lr * 0.8, 0], [lr * 1.2, lr * 0.8, 0], [lr * 1.2, lr * 0.8, lr * 1.2], [lr * 1.2, -lr * 0.8, lr * 1.2]],
            [[tl, -lr * 0.35, 0], [tl, lr * 0.35, 0], [tl, lr * 0.35, lr * 0.4], [tl, -lr * 0.35, lr * 0.4]], { isect: false });
        });
      });
      if (s === sy) {
        co(M, 'BIRD LEG', 2, add(lerp(knee, ankle, 0.4), mul(e, lr * 2)), 0.8);
        co(M, 'TOE', 6, [foot[0] + lr * 6, s * yl, lr * 0.6], 0.5);
        co(M, 'KNEE JOINT', 2, add(knee, mul(e, lr * 3)), 0.5);
      }
    }
    const diag = Math.hypot(g.L, g.W);
    const tw = Math.max(0.12, g.fd * 0.8);
    const t0 = [-(g.L / 2 + g.gap + tw), 0, fr.z0 + g.fd * 0.5], t1 = [t0[0] - Math.min(Math.max(1, g.L * 0.45), diag * 0.45), 0, fr.z0 + g.fd * 0.5 + g.L * 0.1];
    beam(M, [-fr.rx, 0, t0[2]], t0, fr.bw, g.fd * 0.7);
    K.girder(M, t0, t1, { w: tw, sec: 3 });
    M.at(t1[0], t1[1], t1[2], () => M.sphere(Math.max(0.12, g.fd * 0.9)));
    co(M, 'TAIL BOOM', 1, lerp(t0, t1, 0.6), 0.5);
  });
  g.figure = [g.L * 0.7, sy * (g.W / 2 + 2.2)];
}

// ---------------------------------------------------- trike
KIND.trike = {
  plan(M, g) {
    g.variant = vpick(M, [[3, 'delta'], [2, 'tadpole']]);   // delta: one steered wheel in front
    g.r = clamp(Math.max(g.L, g.H * 0.8) * 0.12, 0.25, 2.2);
    g.style = M.pick(['wire', 'wire', 'disc']);
    g.ww = g.r * (g.style === 'wire' ? 0.24 : 0.4);
    g.guards = M.chance(0.6);
    g.z = g.r + g.fd * 1.15;
    g.count = 3;
    g.goes = ['rolls on three wheels', 'runs on three wheels'];
    g.specs = [['SPEED', `${Math.round(clamp(70 - g.mass * 1.5, 20, 80))} KM/H`], ['WHEELS', '3']];
  },
  build(M, g) {
    const sy = seenY(M), r = g.r, ww = g.ww;
    const sg = g.variant === 'delta' ? 1 : -1;            // the side of the single wheel
    const xs = sg * (g.L / 2 + g.gap + r * 1.05);         // single wheel axle
    const xp = -sg * g.L * 0.3;                           // the pair
    const yp = g.W / 2 + ww * 0.7 + g.gap;
    const fr = chassis(M, g, { out: yp - ww * 0.4, outXs: [xp] });
    const wheel = (wl) => (g.style === 'wire' ? wireWheel(M, { r, w: ww, spokes: 16 }) : K.wheel(M, { r, w: ww, hub: r * 0.5, hubs: 'seen' }));
    M.part('WHEEL', () => {
      M.tube([xp, -yp + ww * 0.3, r], [xp, yp - ww * 0.3, r], Math.max(0.03, r * 0.08));
      for (const s of [1, -1]) {
        M.at(xp, s * yp, r, () => wheel());
        M.box([xp - r * 0.15, s * fr.ry - fr.bw * 0.4, r], [xp + r * 0.15, s * fr.ry + fr.bw * 0.4, fr.z0], { isect: false });
      }
      M.at(xs, 0, r, () => wheel());
      if (g.guards) for (const [x, y] of [[xp, yp], [xp, -yp], [xs, 0]]) M.at(x, y, r, () => guard(M, r, ww * 1.3));
      co(M, 'WHEEL', 3, [xp, sy * (yp + ww / 2), r * 1.3], 0.7);
    });
    M.part(sg > 0 ? 'STEERING FORK' : 'SWING ARM', () => {
      const zb = fr.zm, xe = sg * (g.L / 2 + g.gap * 0.6);
      if (sg > 0) {
        // nose beams out to the head, the fork down to the axle
        const hd = [xs - r * 0.35, 0, Math.max(r * 2.15, g.z + r * 0.3)];
        for (const s of [1, -1]) beam(M, [fr.x1, s * fr.ry, zb], [xe, s * ww, zb], fr.bw * 0.8, g.fd * 0.6);
        M.box([xe - fr.bw * 0.4, -ww - fr.bw * 0.4, zb - g.fd * 0.3], [xe + fr.bw * 0.4, ww + fr.bw * 0.4, zb + g.fd * 0.3]);
        K.strut(M, [xe, 0, zb], hd, Math.max(0.03, r * 0.09), {});
        M.along(add(hd, [r * 0.12, 0, r * 0.35]), add(hd, [-r * 0.12, 0, -r * 0.35]), (l) => M.ry(90, () => M.cyl(r * 0.13, 0, l)));
        for (const s of [1, -1]) M.tube(add(hd, [0, s * ww * 0.85, -r * 0.1]), [xs, s * ww * 0.85, r], Math.max(0.02, r * 0.055), {});
        M.tube(add(hd, [0, -ww * 0.85, -r * 0.1]), add(hd, [0, ww * 0.85, -r * 0.1]), Math.max(0.02, r * 0.06), { isect: false });
        co(M, 'STEERING FORK', 1, [xs - r * 0.2, sy * ww, r * 1.7], 0.6);
        co(M, 'STEERING HEAD', 1, hd, 0.4);
      } else {
        for (const s of [1, -1]) M.tube([fr.x0 + fr.bw, s * fr.ry, fr.z0], [xs, s * ww * 0.9, r], Math.max(0.03, r * 0.08), {});
        M.tube([fr.x0 + fr.bw, -fr.ry, fr.z0], [fr.x0 + fr.bw, fr.ry, fr.z0], Math.max(0.03, r * 0.08), { isect: false });
        // a damper from the arm to a bracket on the frame end
        const a = lerp([fr.x0, sy * fr.ry, fr.z0], [xs, sy * ww * 0.9, r], 0.55);
        const b = [fr.x0 - g.gap * 0.5, sy * fr.ry, fr.zm + g.fd * 0.2];
        M.box([fr.x0 - g.gap * 0.7, sy * fr.ry - fr.bw * 0.4, fr.z0], [fr.x0, sy * fr.ry + fr.bw * 0.4, fr.z1], { isect: false });
        PG.springStrut(M, a, b, Math.max(0.025, r * 0.07));
        co(M, 'SWING ARM', 1, lerp([fr.x0, sy * fr.ry, fr.z0], [xs, sy * ww, r], 0.4), 0.6);
        co(M, 'DAMPER', 1, lerp(a, b, 0.5), 0.4);
      }
    });
  },
};

// ---------------------------------------------------- rails
KIND.rails = {
  plan(M, g) {
    g.gauge = g.W < 1.6 ? 0.6 : g.W < 2.6 ? 1.0 : g.W < 3.6 ? 1.435 : clamp(Math.round(g.W * 0.45 * 10) / 10, 1.6, 3.0);
    g.k = g.gauge / 1.435;
    g.R = M.r(0.42, 0.5);
    g.ballast = M.chance(0.5);
    const bogieLen = (2.1 + 2 * g.R + 0.7) * g.k;
    g.variant = vpick(M, g.L > bogieLen * 2.3 ? [[3, 'bogies'], [1.5, 'axles']] : [[1, 'axles']]);
    g.na = g.variant === 'bogies' ? 4 : clamp(Math.round(g.L / (3.2 * g.k)) + 1, 2, 3);
    const top = RL.trackTop(g.ballast);
    g.z = g.variant === 'bogies' ? g.k * (top + g.R + 0.36 + 0.5) + g.fd : g.k * (top + g.R + 0.5) + g.fd;
    g.count = g.na * 2;
    g.goes = g.variant === 'bogies' ? ['runs on two bogies', `rolls on ${word(g.count)} flanged wheels`] : [`runs on ${word(g.na)} axles`, `rolls on ${word(g.count)} flanged wheels`];
    g.specs = [['GAUGE', `${Math.round(g.gauge * 1000)} MM`], ['AXLES', String(g.na)]];
  },
  build(M, g) {
    const k = g.k, sy = seenY(M);
    const wy = RL.wheelY(1.435) * k;
    const fr = chassis(M, g, { ry: Math.max(g.W * 0.3, wy + 0.08 * k) });
    const tx = g.L / 2 + Math.max(g.L * 0.35, 2.5 * k);
    const top = RL.trackTop(g.ballast);
    M.scale(k, k, k, () => RL.track(M, { x0: -tx / k, x1: tx / k, gauge: 1.435, ballast: g.ballast }));
    M.part(g.variant === 'bogies' ? 'BOGIE' : 'WHEELSET', () => {
      if (g.variant === 'bogies') {
        const bx = g.L / 2 - (1.05 + g.R + 0.35) * k - g.L * 0.04;
        for (const x of [-bx, bx]) M.at(x, 0, top * k, () => M.scale(k, k, k, () => RL.bogie(M, { n: 2, pitch: 2.1, r: g.R, nearSide: sy })));
        co(M, 'BOGIE', 2, [bx, sy * (wy + 0.25 * k), (top + g.R) * k], 0.75);
      } else {
        const xs = spread(g.na, -g.L * 0.33, g.L * 0.33);
        for (const x of xs) M.at(x, 0, (top + g.R) * k, () => M.scale(k, k, k, () => {
          RL.wheelset(M, { r: g.R, gauge: 1.435, kind: 'spoke', nearSide: sy });
          for (const s of [1, -1]) {
            const y = s * (RL.wheelY(1.435) + 0.2);
            M.boxc([0, y, 0], [0.3, 0.16, 0.32]);
            M.at(0, y, 0.18, () => PG.leafSpring(M, { len: 1.3, n: 4, t: 0.035, w: 0.09 }));
            for (const q of [-1, 1]) M.box([q * 0.65 - 0.04, y - 0.05, 0.25], [q * 0.65 + 0.04, y + 0.05, (fr.z0 / k) - (top + g.R)], { isect: false });
          }
        }));
        co(M, 'WHEELSET', g.na, [xs[0], sy * (wy + 0.1 * k), (top + g.R) * k], 0.75);
        co(M, 'LEAF SPRING', g.na * 2, [xs[xs.length - 1], sy * (wy + 0.2 * k), (top + g.R + 0.3) * k], 0.4);
      }
      // buffer beams at both ends
      for (const s of [1, -1]) M.at(s * fr.rx, 0, 0, () => M.rz(s > 0 ? 0 : 180, () => M.scale(k, k, k, () => RL.bufferBeam(M, { zc: fr.zm / k }))));
      co(M, 'BUFFER BEAM', 2, [fr.rx * seenX(M), 0, fr.zm], 0.35);
    });
    co(M, 'RAIL TRACK', 1, [g.L * 0.5 + 1.5 * k, sy * RL.railY(1.435) * k, top * k], 0.3);
  },
};

// ---------------------------------------------------- skis
KIND.skis = {
  plan(M, g) {
    g.variant = vpick(M, [[3, 'sled'], [2, 'snow']]);
    const sz = Math.max(g.L, g.W, 1.5);
    if (g.variant === 'sled') {
      g.sh = clamp(sz * 0.1, 0.3, 1.3);
      g.z = g.sh + g.fd;
      g.Rp = clamp(Math.max(g.H * 0.42, sz * 0.2), 0.45, 3.2);
      g.blades = M.pick([2, 3, 4]);
      g.goes = ['slides on two skis', 'runs on two skis'];
      g.specs = [['SPEED', `${Math.round(clamp(110 - g.mass * 2, 30, 120))} KM/H`], ['SKIS', '2']];
    } else {
      g.tr = clamp(sz * 0.05, 0.16, 0.7);
      g.z = g.tr * 2 + g.fd * 1.3 + g.tr * 0.3;
      g.goes = ['runs on a track and two skis'];
      g.specs = [['SPEED', `${Math.round(clamp(70 - g.mass, 20, 70))} KM/H`], ['SKIS', '2']];
    }
  },
  build(M, g) {
    const sy = seenY(M);
    if (g.variant === 'sled') {
      const Rp = g.Rp, nl = Rp * 0.9, nr = Rp * 0.2;
      const xn = -(g.L / 2 + g.gap + nl * 0.5 + Rp * 0.08);
      const zc = Math.max(g.z + nr * 1.5 + g.gap, Rp * 1.1 + 0.15);
      const fr = chassis(M, g, { x0: xn - nl * 0.2 });
      const ys = Math.max(fr.ry, g.W * 0.4);
      const sl = g.L * 1.05, swd = clamp(g.W * 0.16, 0.12, 1.0), st = clamp(g.sh * 0.18, 0.05, 0.25);
      M.part('SKI', () => {
        for (const s of [1, -1]) {
          M.at(g.L * 0.04, s * ys, 0, () => ski(M, sl, swd, st));
          for (const x of [g.L * 0.32, -g.L * 0.24]) {
            K.strut(M, [x - g.sh * 0.35, s * ys, st], [x, s * fr.ry, fr.z0], Math.max(0.025, g.sh * 0.06), {});
            K.strut(M, [x + g.sh * 0.35, s * ys, st], [x, s * fr.ry, fr.z0], Math.max(0.025, g.sh * 0.06), {});
            M.at(x, s * ys, st, () => M.box([-g.sh * 0.45, -swd * 0.25, 0], [g.sh * 0.45, swd * 0.25, st * 0.8], { isect: false }));
          }
          if (Math.abs(ys - fr.ry) > 0.05) for (const x of [g.L * 0.32, -g.L * 0.24]) M.box([x - fr.bw * 0.4, Math.min(s * ys, s * fr.ry), fr.z0 - fr.bw * 0.3], [x + fr.bw * 0.4, Math.max(s * ys, s * fr.ry), fr.z0], { isect: false });
        }
        co(M, 'SKI', 2, [g.L * 0.2, sy * (ys + swd / 2), st], 0.75);
        co(M, 'SKI STRUT', 4, [g.L * 0.32, sy * (ys + fr.ry) / 2, (st + fr.z0) / 2], 0.4);
      });
      M.part('PUSHER PROPELLER', () => {
        M.at(xn, 0, zc, () => A.nacelle(M, { len: nl, r: nr, prop: 'rear', propR: Rp, blades: g.blades, exhaust: true }));
        // pylon from the frame extension
        for (const s of [1, -1]) K.strut(M, [xn + nl * 0.25, s * fr.ry, fr.z1], [xn + nl * 0.1, s * nr * 0.4, zc - nr * 0.8], Math.max(0.03, nr * 0.18), {});
        K.strut(M, [xn - nl * 0.15, 0, fr.z1], [xn - nl * 0.1, 0, zc - nr * 0.85], Math.max(0.03, nr * 0.18), {});
        // guard ring on four stays
        const xp = xn - nl / 2 - Rp * 0.08, rg = Rp * 1.08;
        M.at(xp, 0, zc, () => M.ry(90, () => M.torus(rg, Math.max(0.02, Rp * 0.025), { isect: false })));
        for (let i = 0; i < 4; i++) {
          const a = (i * 90 + 45) * D2R;
          M.tube([xp - Rp * 0.04, Math.cos(a) * rg, zc + Math.sin(a) * rg], [xn - nl * 0.2, Math.cos(a) * nr * 0.9, zc + Math.sin(a) * nr * 0.9], Math.max(0.012, Rp * 0.015), { isect: false });
        }
        co(M, 'PUSHER PROPELLER', 1, [xp - Rp * 0.1, sy * Rp * 0.5, zc + Rp * 0.5], 0.75);
        co(M, 'PROPELLER GUARD', 1, [xp, sy * rg * 0.7, zc - rg * 0.7], 0.45);
        co(M, 'ENGINE', 1, [xn, sy * nr, zc], 0.5);
      });
      g.figure = [g.L * 0.55 * seenX(M), sy * (g.W / 2 + 1.6)];
      return;
    }
    // snow: a rear track and two front skis
    const tl = g.L * 0.55, tw = clamp(g.W * 0.45, 0.25, 2.2), tx = -g.L * 0.18;
    const fr = chassis(M, g, {});
    M.part('TRACK UNIT', () => {
      M.at(tx, 0, 0, () => K.track(M, { len: tl, r: g.tr, w: tw, pitch: Math.max(0.1, g.tr * 0.4) }));
      for (const x of [tx - tl * 0.3, tx + tl * 0.3]) M.box([x - g.tr * 0.2, -tw * 0.3, g.tr * 1.2], [x + g.tr * 0.2, tw * 0.3, fr.z0], { isect: false });
      M.box([tx - tl / 2 + g.tr, -tw * 0.2, g.tr * 1.05], [tx + tl / 2 - g.tr, tw * 0.2, g.tr * 1.35], { isect: false });
      co(M, 'TRACK UNIT', 1, [tx, sy * tw / 2, g.tr * 1.5], 0.75);
    });
    M.part('SKI', () => {
      const ys = g.W * 0.42, sl = g.L * 0.42, swd = clamp(g.W * 0.14, 0.1, 0.9), st = clamp(g.tr * 0.25, 0.04, 0.2);
      for (const s of [1, -1]) {
        const xk = g.L * 0.3;
        M.at(xk, s * ys, 0, () => ski(M, sl, swd, st));
        PG.springStrut(M, [xk, s * ys, st * 1.6], [xk - g.tr * 0.6, s * fr.ry, fr.z0], Math.max(0.03, g.tr * 0.12));
        M.at(xk, s * ys, st, () => M.box([-g.tr * 0.4, -swd * 0.3, 0], [g.tr * 0.4, swd * 0.3, st * 1.2], { isect: false }));
        K.strut(M, [xk + g.tr * 0.4, s * ys, st * 1.6], [xk + g.tr * 0.6, s * fr.ry, fr.z0], Math.max(0.02, g.tr * 0.08), {});
      }
      co(M, 'STEERING SKI', 2, [g.L * 0.38, sy * (ys + swd / 2), st], 0.65);
    });
  },
};

// ---------------------------------------------------- hover
KIND.hover = {
  plan(M, g) {
    g.variant = vpick(M, [[2, 'ducts'], [1.5, 'props']]);
    const sz = Math.max(g.L, g.W, 1.5);
    g.rs = clamp(sz * 0.055, 0.18, 1.2);
    g.hr = clamp(sz * 0.045, 0.14, 0.6);
    g.z = g.rs * 1.75 + g.hr;
    g.rf = clamp(Math.min(g.H * 0.34, Math.max(g.L, g.W) * 0.14 + 0.1), 0.3, 2.6);
    g.ri = clamp(sz * 0.055, 0.15, 0.8);
    g.sp = M.r(3.2, 5);
    g.goes = ['rides on a cushion of air', 'hovers on an air cushion'];
    g.specs = [['SPEED', `${Math.round(clamp(80 - g.mass, 30, 90))} KNOTS`], [g.variant === 'ducts' ? 'DUCTED FANS' : 'PROPELLERS', '2']];
  },
  build(M, g) {
    const e = M.view.e, sy = seenY(M), sx = seenX(M);
    const rf = g.rf, rs = g.rs, ri = g.ri;
    const xe = -sx;                                       // the fans stand beside the box at the far end
    const yf = g.W / 2 + g.gap + rf * 1.08;
    const a = g.L / 2 + g.gap + ri * 0.4 + rs * 0.4;
    const b = Math.max(g.W / 2 + g.gap + ri * 2.6, yf + rf * 0.7 + rs * 0.4);
    const P = superPlan(a, b, g.sp, 48);
    const zsk = rs + 0.02, zr0 = rs * 1.75, zd = g.z;
    M.part('SKIRT', () => {
      let i0 = 0, bd = Infinity;
      P.forEach(([x, y], i) => { const d = x / a * e[0] + y / b * e[1]; if (d < bd) { bd = d; i0 = i; } });
      const ring = [...P.slice(i0), ...P.slice(0, i0)].map(([x, y]) => [x, y, zsk]);
      M.pipe([...ring, ring[0]], rs, { smoothBends: true, isect: false });
      if (M.decorOn) {
        const n = Math.min(200, Math.round(2 * Math.PI * Math.sqrt((a * a + b * b) / 2) / Math.max(M.px * 6, rs * 0.45)));
        for (let i = 0; i < n; i++) {
          const k0 = Math.round(i / n * P.length) % P.length, k1 = (k0 + 1) % P.length;
          const p = P[k0], q = P[k1];
          let nx = q[1] - p[1], ny = -(q[0] - p[0]);
          const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
          if (nx * p[0] + ny * p[1] < 0) { nx = -nx; ny = -ny; }
          if (nx * e[0] + ny * e[1] < -0.3) continue;
          const pts = [];
          for (let j = 0; j <= 6; j++) { const th = (-80 + 150 * j / 6) * D2R; const rr = rs * 1.015; pts.push([p[0] + nx * Math.cos(th) * rr, p[1] + ny * Math.cos(th) * rr, zsk + Math.sin(th) * rr]); }
          M.line(pts, { w: i % 2 ? 0 : 1, pass: i % 2 ? 3 : 2 });
        }
      }
      co(M, 'BAG SKIRT', 1, [0, sy * (b + rs), zsk + rs * 0.3], 0.75);
    });
    const xf = xe * Math.max(0, g.L / 2 - rf * 0.5);
    M.part('BUOYANCY RAFT', () => {
      const Pr = superPlan(a - rs * 0.5, b - rs * 0.5, g.sp, 48);
      const Rf = M.extrude(Pr, zr0, zd, {});
      const deck = Rf.f('+z');
      if (deck.on) {
        const n = Math.max(3, Math.round(2 * a / Math.max(0.8, b * 0.7)));
        for (let i = 1; i < n; i++) { const x = -deck.w / 2 + deck.w * i / n; deck.line(x, -deck.h * 0.45, x, deck.h * 0.45, { w: 0 }); }
        deck.line(-deck.w * 0.45, 0, deck.w * 0.45, 0, { w: 0 });
      }
      if (M.decorOn) for (let i = 0; i < Pr.length; i++) {
        const f = Rf.f('s' + i);
        if (f.on && f.front && f.tone > 0.3) f.hatch(f.box, { angle: 0, gap: 3.2 - 1.4 * f.tone, w: 0 });
      }
      // lift fan intakes beside the box, at the other end from the fans
      const ys = g.W / 2 + g.gap + ri * 1.2;
      const xs = [-xe * g.L * 0.3];
      if (Math.abs(xf - xs[0]) > rf * 2.5 + ri * 3) xs.push((xf + xs[0]) / 2);
      for (const s of [1, -1]) for (const x of xs) M.at(x, s * ys, zd, () => {
        const C = M.cyl(ri, 0, ri * 0.35);
        if (C.top.on) { C.top.circle(0, 0, ri * 0.8, { w: 1 }); for (let q = -2; q <= 2; q++) { const h = Math.sqrt(Math.max(0, 0.64 - (q * 0.3) ** 2)) * ri; C.top.line(q * ri * 0.3, -h, q * ri * 0.3, h, { w: 0 }); } C.top.circle(0, 0, ri * 0.15, { w: 1 }); }
        if (C.lat) C.lat.shade({ gap: 1.6 });
      });
      co(M, 'LIFT FAN INTAKE', xs.length * 2, [xs[0], sy * ys, zd + ri * 0.35], 0.5);
      co(M, 'BUOYANCY RAFT', 1, [-xe * g.L * 0.35, sy * (b - rs * 0.5), (zr0 + zd) / 2], 0.4);
    });
    M.part(g.variant === 'ducts' ? 'DUCTED FAN' : 'PROPELLER', () => {
      const zc = zd + rf * 1.12;
      for (const s of [1, -1]) {
        if (g.variant === 'ducts') {
          M.at(xf, s * yf, zc, () => M.rz(xe < 0 ? 180 : 0, () => K.ductedFan(M, { r: rf, blades: 5 })));
          M.box([xf - rf * 0.3, s * yf - rf * 0.25, zd], [xf + rf * 0.3, s * yf + rf * 0.25, zc - rf * 1.05]);
          // rudders on the outer face of the ducts
          for (const q of [-0.4, 0.4]) M.plate([[xf + xe * rf * 0.45, s * yf + q * rf, zc - rf * 0.8], [xf + xe * rf * 0.85, s * yf + q * rf, zc - rf * 0.8], [xf + xe * rf * 0.85, s * yf + q * rf, zc + rf * 0.8], [xf + xe * rf * 0.45, s * yf + q * rf, zc + rf * 0.8]]);
        } else {
          const nr = rf * 0.18;
          M.at(xf, s * yf, zc, () => M.rz(xe < 0 ? 0 : 180, () => A.nacelle(M, { len: rf * 0.9, r: nr, prop: 'rear', propR: rf * 0.95, blades: 4 })));
          M.box([xf - rf * 0.15, s * yf - nr * 0.5, zd], [xf + rf * 0.15, s * yf + nr * 0.5, zc - nr * 0.8]);
        }
      }
      co(M, g.variant === 'ducts' ? 'DUCTED FAN' : 'PROPELLER', 2, [xf, sy * (yf + rf * 0.7), zc + rf * 0.5], 0.75);
    });
  },
};

// ---------------------------------------------------- floats
KIND.floats = {
  plan(M, g) {
    g.variant = vpick(M, [[3, 'twin'], [1.5, 'three']]);
    const sz = Math.max(g.L, g.W, 1.5);
    g.ph = clamp(sz * 0.09, 0.25, 1.3);
    g.sh = clamp(sz * 0.08, 0.3, 1.6);
    g.z = SEA.WZ + g.ph + g.sh + g.fd;
    g.n = g.variant === 'twin' ? 2 : 3;
    g.goes = [`floats on ${word(g.n)} pontoons`, `rides on ${word(g.n)} floats`];
    g.specs = [['SPEED', `${Math.round(clamp(14 - g.mass * 0.1, 4, 14))} KNOTS`], ['FLOATS', String(g.n)]];
    g.family = 'sea';
  },
  build(M, g) {
    const sy = seenY(M), sx = seenX(M);
    const pl = g.L * 1.25, pw = g.ph * 1.15;
    const pts = g.variant === 'twin' ? [[g.W * 0.5 + pw * 0.2, pl, pw, g.ph]] : [[0, pl * 1.05, pw * 1.2, g.ph * 1.1], [g.W / 2 + pw * 1.0 + g.gap * 2, pl * 0.75, pw * 0.8, g.ph * 0.8]];
    const yo = pts[pts.length - 1][0];
    const fr = chassis(M, g, { out: yo, outXs: [-pl * 0.25, pl * 0.25] });
    M.part('PONTOON', () => {
      for (const [y, l, w, h] of pts) for (const s of y ? [1, -1] : [1]) {
        M.at(0, s * y, SEA.WZ, () => A.pontoon(M, { len: l, w, h }));
        for (const x of [-pl * 0.25, pl * 0.25]) {
          const top = SEA.WZ + h * 0.98;
          K.strut(M, [x - g.sh * 0.3, s * y, top], [x, s * y, fr.z0], Math.max(0.025, g.sh * 0.05), {});
          K.strut(M, [x + g.sh * 0.4, s * y, top], [x, s * y, fr.z0], Math.max(0.02, g.sh * 0.04), {});
        }
      }
      co(M, 'PONTOON', g.n, [pl * 0.1, sy * (yo + pts[pts.length - 1][2] / 2), SEA.WZ + g.ph * 0.5], 0.75);
      co(M, 'FLOAT STRUT', g.n * 4, [pl * 0.25, sy * yo, (SEA.WZ + g.ph + fr.z0) / 2], 0.4);
    });
    M.part('WATER', () => water(M, -pl * 0.9, pl * 0.9, -yo - 3, yo + 3, 1.4, pts.map(([y, l, w]) => [l, y, w])));
    const st = stage(M, g, { y: yo + pts[pts.length - 1][2] / 2, xpad: pl * 0.12 + 0.4 });
    g.figure = st.spot;
  },
};

// ---------------------------------------------------- paddles
KIND.paddles = {
  plan(M, g) {
    g.variant = vpick(M, [[2, 'side'], [1.2, 'stern']]);
    const sz = Math.max(g.L, g.W, 1.5);
    g.F = clamp(sz * 0.08, 0.3, 1.3);
    g.z = SEA.WZ + g.F;
    g.Rp = clamp(Math.max(g.H * 0.3, sz * 0.13), 0.4, 4);
    g.fr = clamp(sz * 0.05, 0.12, 0.8);
    g.goes = g.variant === 'side' ? ['paddles on two side wheels', 'is driven by paddle wheels'] : ['paddles on a stern wheel', 'is driven by a stern wheel'];
    g.specs = [['SPEED', `${Math.round(clamp(10 - g.mass * 0.05, 4, 10))} KNOTS`], ['PADDLE WHEELS', g.variant === 'side' ? '2' : '1']];
    g.family = 'sea';
  },
  build(M, g) {
    const sy = seenY(M), sx = seenX(M), Rp = g.Rp;
    const xf = -(g.L / 2 + g.gap + g.fr * 1.3);
    const sternRoom = g.variant === 'stern' ? Rp * 1.3 + g.gap : 0;
    const x1 = g.L / 2 + Math.max(g.L * 0.18, g.F * 1.6), x0 = xf - g.fr * 1.6 - g.gap;
    const b = g.W / 2 + g.gap + Math.max(0.12, g.W * 0.06);
    const hull = barge(M, x0, x1, b, SEA.WZ, g.z, 'scow');
    void hull;
    const pw = clamp(g.W * 0.22, 0.25, 2);
    const zc = SEA.WZ + Rp * 0.94;
    M.part('PADDLE WHEEL', () => {
      const wheelAt = (x, y, w) => M.at(x, y, zc, () => paddleWheel(M, Rp, w));
      if (g.variant === 'side') {
        for (const s of [1, -1]) {
          const y = s * (b + pw / 2 + 0.04);
          wheelAt(0, y, pw);
          M.at(0, y, zc, () => paddleBox(M, Rp * 1.1, pw * 1.25, s));
          // sponson deck
          M.box([-Rp * 1.15, Math.min(s * b, s * (b + pw * 1.2)), g.z - g.F * 0.25], [Rp * 1.15, Math.max(s * b, s * (b + pw * 1.2)), g.z], { isect: false });
        }
        co(M, 'PADDLE BOX', 2, [Rp * 0.3, sy * (b + pw * 1.25), zc + Rp * 0.9], 0.75);
        co(M, 'PADDLE WHEEL', 2, [Rp * 0.8, sy * (b + pw * 0.5), zc - Rp * 0.5], 0.5);
      } else {
        const xw = x0 - Rp * 1.05, w = b * 1.5;
        wheelAt(xw, 0, w);
        for (const s of [1, -1]) beam(M, [x0 + g.fr * 2, s * b * 0.8, g.z - g.F * 0.4], [xw, s * (w / 2 + 0.08), zc], Math.max(0.06, g.F * 0.2), Math.max(0.06, g.F * 0.25));
        co(M, 'STERN WHEEL', 1, [xw - Rp * 0.5 * sx, sy * w / 2, zc + Rp * 0.5], 0.75);
      }
    });
    M.part('FUNNEL', () => {
      M.at(xf, 0, g.z, () => SEA.funnel(M, { r: g.fr, h: clamp(g.H * 0.65, g.fr * 4, g.fr * 12), rake: 6, bands: 1, cowl: true, pipes: 1 }));
      co(M, 'FUNNEL', 1, [xf, sy * g.fr * 0.6, g.z + g.H * 0.4], 0.55);
    });
    if (b - g.W / 2 > 0.2) M.part('RAILING', () => {
      for (const s of [1, -1]) K.railing(M, [[x0 + 0.2, s * (b - 0.08), g.z], [x1 - g.F, s * (b - 0.08), g.z]], { h: clamp(g.F * 1.1, 0.4, 1.0), posts: clamp(g.L * 0.2, 0.8, 2.5) });
    });
    M.part('WATER', () => water(M, x0 - 3, x1 + 3, -b - 4, b + 4, 1.4, [[x1 - x0, 0, b * 2]], (x0 + x1) / 2));
    const st = stage(M, g, { y: b + (g.variant === 'side' ? pw * 1.3 : 0), xpad: Math.max(0.6, (x1 - g.L / 2) * 0.5, (-x0 - g.L / 2) * 0.5) + (g.variant === 'stern' ? Rp * 2.2 : 0) });
    g.figure = st.spot;
  },
};

// ---------------------------------------------------- rotors
KIND.rotors = {
  plan(M, g) {
    g.variant = vpick(M, [[3, 'single'], [1.5, 'tandem'], [2, 'quad']]);
    const sz = Math.max(g.L, g.W, 1.5);
    g.skids = M.chance(0.6);
    g.wr = clamp(sz * 0.045, 0.12, 0.5);
    g.z = (g.skids ? clamp(sz * 0.1, 0.3, 1.4) : g.wr * 2 + clamp(sz * 0.06, 0.2, 0.8)) + g.fd;
    g.blades = g.variant === 'tandem' ? M.pick([3, 3, 4, 5]) : M.pick([2, 3, 4, 5]);
    if (g.variant === 'single') g.Rm = clamp(Math.max(g.L, g.W) * 0.8 + 0.8, 2, 14);
    if (g.variant === 'tandem') g.Rm = clamp(g.L * 0.55 + g.W * 0.2 + 0.6, 1.8, 12);
    if (g.variant === 'quad') g.Rm = clamp(Math.min(Math.max(g.L, g.W) * 0.42, Math.min(g.L, g.W) * 0.85 + 0.5), 0.7, 6);
    g.n = g.variant === 'single' ? 1 : g.variant === 'tandem' ? 2 : 4;
    g.goes = g.n === 1 ? ['flies under one rotor', 'hangs under a main rotor'] : [`flies under ${word(g.n)} rotors`, `lifts on ${word(g.n)} rotors`];
    g.specs = [['ROTOR DIA', `${(g.Rm * 2).toFixed(1)} M`], ['ROTORS', String(g.n)]];
    g.family = 'air';
  },
  build(M, g) {
    const sy = seenY(M), sx = seenX(M), e = M.view.e, m = g.gap * 1.6;
    const zt = g.z + g.H + Math.max(g.gap * 2, 0.12 + g.H * 0.05);   // top of the gantry, clear of the box
    const pr = clamp(Math.max(g.L, g.W, g.H) * 0.012, 0.03, 0.2);
    let fr;
    const rotorAt = (p, R, blades) => M.at(p[0], p[1], p[2], () => {
      K.rotor(M, { r: R, blades, swash: true });
      if (M.decorOn) M.line(Array.from({ length: 65 }, (_, i) => [Math.cos(i * Math.PI / 32) * R, Math.sin(i * Math.PI / 32) * R, 0]), { w: 0, pass: 2, dash: 'dash', fit: false });
    });
    // gearbox standing on a deck at height z: nothing reaches below z
    const gearbox = (p, w) => {
      const B = M.box([p[0] - w, p[1] - w * 0.8, p[2]], [p[0] + w, p[1] + w * 0.8, p[2] + w * 0.9], { chamfer: w * 0.3 });
      for (const k of ['+y', '-y', '+x', '-x']) { const f = B.f(k); if (f.on) K.louver(f, [-f.w * 0.35, -f.h * 0.3, f.w * 0.35, f.h * 0.25]); }
      M.at(p[0], p[1], p[2] + w * 0.9, () => M.cyl(w * 0.25, 0, w * 1.4));
      return [p[0], p[1], p[2] + w * 0.9 + w * 1.4 + w * 0.2];
    };
    if (g.variant === 'single' || g.variant === 'quad') {
      const C4 = g.variant === 'single' ? cornerPts(g, m) : cornerPts({ ...g, round: false }, g.Rm * 0.62);
      // the single rotor's gantry leaves out the post at the corner nearest the viewer
      let near = 0;
      C4.forEach((p, i) => { if (p[0] * e[0] + p[1] * e[1] > C4[near][0] * e[0] + C4[near][1] * e[1]) near = i; });
      const C = g.variant === 'single' ? C4.filter((_, i) => i !== near) : C4;
      fr = chassis(M, g, { arms: C });
      M.part(g.variant === 'single' ? 'ROTOR GANTRY' : 'ROTOR MAST', () => {
        if (g.variant === 'single') {
          const gw = clamp(g.Rm * 0.07, 0.12, 0.8);
          // a ring deck above the box center carries the gearbox; beams from each post
          const deck = M.box([-gw * 1.4, -gw * 1.2, zt], [gw * 1.4, gw * 1.2, zt + gw * 0.25]);
          void deck;
          for (const p of C) K.strut(M, [p[0], p[1], fr.zm], [p[0], p[1], zt], pr, { mid: true });
          for (let i = 0; i < C.length; i++) { const p = C[i], q = C[(i + 1) % C.length]; M.tube([p[0], p[1], zt], [q[0], q[1], zt], pr * 0.9, { isect: false }); }
          for (const p of C) beam(M, [p[0], p[1], zt + pr * 1.1], [0, 0, zt + pr * 1.1], pr * 1.6, pr * 2.2);
          for (const p of C) K.ball(M, [p[0], p[1], zt], pr * 1.6);
          for (let i = 0; i < C.length; i++) { const p = C[i], q = C[(i + 1) % C.length]; if (Math.abs(p[0] - q[0]) > 1e-6 && Math.abs(p[1] - q[1]) > 1e-6) continue; const d = (zt - fr.zm) * 0.15; M.tube([p[0], p[1], zt - d], lerp([p[0], p[1], zt], [q[0], q[1], zt], 0.2), pr * 0.5, { isect: false }); M.tube([q[0], q[1], zt - d], lerp([q[0], q[1], zt], [p[0], p[1], zt], 0.2), pr * 0.5, { isect: false }); }
          const hub = gearbox([0, 0, zt + gw * 0.25], gw);
          rotorAt(hub, g.Rm, g.blades);
          // tail boom from the rear of the gantry, above the box
          const xb = -(g.L / 2 + m);
          const xt = -(g.Rm + g.Rm * 0.2 + 0.3);
          M.tube([0, 0, zt + pr], [xb, 0, zt + pr], pr * 0.9, { isect: false });
          for (const p of C) if (p[0] < 0) M.tube([p[0], p[1], zt], [xb, 0, zt], pr * 0.7, { isect: false });
          K.girder(M, [xb, 0, zt], [xt, 0, zt + g.Rm * 0.05], { w: clamp(g.Rm * 0.06, 0.1, 0.7), sec: 3 });
          const Rt = g.Rm * 0.18;
          M.at(xt, sy * g.Rm * 0.06, zt + g.Rm * 0.05, () => M.rx(90, () => K.rotor(M, { r: Rt, blades: Math.max(2, Math.min(4, g.blades)) })));
          M.at(xt, 0, zt + g.Rm * 0.05, () => A.foil(M, { root: { x: Rt * 0.5, h: -Rt * 0.6, c: Rt * 0.9, t: Rt * 0.08 }, tip: { x: Rt * 0.2, h: Rt * 0.9, c: Rt * 0.6 }, spar: false }));
          co(M, 'MAIN ROTOR', 1, [g.Rm * 0.6 * sx, sy * g.Rm * 0.3, hub[2]], 0.8);
          co(M, 'ROTOR GANTRY', 1, [C[0][0], C[0][1], (fr.zm + zt) / 2], 0.55);
          co(M, 'TAIL ROTOR', 1, [xt, sy * g.Rm * 0.06, zt + Rt * 0.5], 0.55);
          co(M, 'TAIL BOOM', 1, [lerp([xb, 0, zt], [xt, 0, zt], 0.5)[0], 0, zt], 0.4);
        } else {
          const zh = zt;
          for (const p of C) {
            K.strut(M, [p[0], p[1], fr.zm], [p[0], p[1], zh], pr * 1.2, { mid: true });
            M.tube([p[0], p[1], fr.zm + (zh - fr.zm) * 0.45], [p[0] * 0.7, p[1] * 0.7, fr.zm], pr * 0.6, { isect: false });
            const hub = gearbox([p[0], p[1], zh], clamp(g.Rm * 0.08, 0.1, 0.6));
            rotorAt(hub, g.Rm, g.blades);
          }
          for (let i = 0; i < 4; i++) { const p = C[i], q = C[(i + 1) % 4]; M.tube([p[0], p[1], zh - (zh - fr.zm) * 0.06], [q[0], q[1], zh - (zh - fr.zm) * 0.06], pr * 0.6, { isect: false }); }
          co(M, 'LIFT ROTOR', 4, [C[0][0] * 0.6, C[0][1], zh + g.Rm * 0.2], 0.8);
          co(M, 'ROTOR MAST', 4, [C[0][0], C[0][1], (fr.zm + zh) / 2], 0.5);
          co(M, 'GEARBOX', 4, [C[3][0], C[3][1], zh + 0.1], 0.35);
        }
      });
    } else {
      const tw = clamp(g.Rm * 0.08, 0.15, 0.9);
      const xT = g.L / 2 + m + tw / 2;
      fr = chassis(M, g, { x0: -xT - tw / 2, x1: xT + tw / 2 });
      M.part('ROTOR TOWER', () => {
        for (const s of [1, -1]) {
          const zh = zt + (s < 0 ? g.Rm * 0.12 : 0);
          K.girder(M, [s * xT, 0, fr.z1], [s * xT, 0, zh], { w: tw, sec: 4 });
          for (const q of [1, -1]) M.tube([s * xT, q * fr.ry, fr.z0], [s * xT, q * tw * 0.4, fr.z1 + (zh - fr.z1) * 0.3], pr * 0.7, { isect: false });
          const hub = gearbox([s * xT, 0, zh], clamp(g.Rm * 0.07, 0.12, 0.7));
          rotorAt(hub, g.Rm, g.blades);
        }
        co(M, 'ROTOR TOWER', 2, [xT * sx, sy * tw * 0.5, (fr.z1 + zt) / 2], 0.6);
        co(M, 'TANDEM ROTOR', 2, [xT * sx, sy * g.Rm * 0.5, zt], 0.8);
      });
    }
    M.part(g.skids ? 'LANDING SKID' : 'LANDING WHEEL', () => {
      const ys = Math.max(g.W * 0.45, fr.ry + 0.1), sr = Math.max(0.025, g.z * 0.05);
      if (g.skids) {
        const xa = g.L * 0.42;
        for (const s of [1, -1]) {
          M.pipe([[-xa, s * ys, sr], [xa, s * ys, sr], [xa + g.z * 0.3, s * ys, sr + g.z * 0.18]], sr, { isect: false });
          for (const x of [-g.L * 0.28, g.L * 0.28]) M.pipe([[x, s * ys, sr], [x, s * (ys - g.z * 0.08), g.z * 0.5], [x, s * fr.ry, fr.z0]], sr * 0.8, { isect: false });
        }
        co(M, 'LANDING SKID', 2, [g.L * 0.1, sy * ys, sr * 2], 0.45);
      } else {
        for (const [x, y] of [[g.L * 0.35, ys], [g.L * 0.35, -ys], [-g.L * 0.35, ys], [-g.L * 0.35, -ys]]) M.at(x, y, 0, () => A.gearLeg(M, { h: fr.z0, wr: g.wr, ww: g.wr * 0.6 }));
        co(M, 'LANDING WHEEL', 4, [g.L * 0.35, sy * ys, g.wr], 0.45);
      }
    });
  },
};

// ---------------------------------------------------- wings
KIND.wings = {
  plan(M, g) {
    g.variant = vpick(M, [[3, 'twin'], [2, 'four']]);
    const sz = Math.max(g.L, g.W, 1.5);
    g.ne = g.variant === 'twin' ? 2 : 4;
    g.wr = clamp(sz * 0.05, 0.15, 0.7);
    g.z = g.wr * 2 + clamp(sz * 0.08, 0.25, 1.2) + g.fd;
    g.Rp = clamp(sz * 0.12, 0.35, 2.4);
    g.blades = M.pick([2, 3, 3, 4]);
    g.taper = M.r(0.55, 0.85);
    g.goes = [`flies on ${word(g.ne)} engines`, 'flies on a parasol wing'];
    g.specs = [['SPAN', '-'], ['ENGINES', String(g.ne)]];
    g.family = 'air';
  },
  build(M, g) {
    const sy = seenY(M), sx = seenX(M), Rp = g.Rp;
    const m = Math.max(g.gap * 1.5, 0.08 + Math.max(g.L, g.W) * 0.02);
    const mz = Math.max(g.gap * 2, 0.12 + g.H * 0.05);
    const yc = g.W / 2 + m, xe0 = g.L / 2 + m;
    const ye = [yc + Rp * 1.15];
    if (g.ne === 4) ye.push(ye[0] + Rp * 2.3);
    const span = Math.max(g.W * 3, g.L * 1.6, 2 * (ye[ye.length - 1] + Rp * 1.3));
    const c = clamp(span / 6.5, Rp * 1.3, Math.max(g.L * 0.9, Rp * 1.3));
    const t = c * 0.13;
    const zw = g.z + g.H + mz + t * 0.5;               // the wing's underside clears the box top
    // the wing sits over the far end of the box, so the near side needs only one post, at the far corner
    const xw = -sx * Math.max(0, xe0 - c * 0.4);
    g.specs[0][1] = `${span.toFixed(1)} M`;
    const xt = -(g.L / 2 + Math.max(g.L * 0.55, span * 0.32));
    const posts = [[xw - c * 0.28, -sy * yc], [xw + c * 0.28, -sy * yc], [-sx * xe0, sy * yc]];
    const fr = chassis(M, g, { arms: posts });
    M.part('WING', () => {
      M.mirrorY(() => M.at(xw + c / 2, 0, zw, () => M.rx(-90, () => A.foil(M, {
        root: { x: 0, h: 0, c, t }, tip: { x: -c * (1 - g.taper) * 0.3, h: span / 2, c: c * g.taper }, ribs: 6, cs: [{ s0: 0.55, s1: 0.92, tab: true }],
      }))));
      const sr = Math.max(0.025, c * 0.02);
      for (const [x, y] of posts) {
        A.strut(M, [x, y, fr.zm], [x, y, zw - t * 0.45], sr, {});
        // lift strut out to the wing, away from the box
        A.strut(M, [x, y, fr.zm], [x, Math.sign(y) * span * 0.3, zw - t * 0.45], sr * 0.9, {});
      }
      M.tube([posts[0][0], posts[0][1], zw - t * 0.45], [posts[1][0], posts[1][1], fr.zm], Math.max(0.015, c * 0.01), { isect: false });
      co(M, 'PARASOL WING', 1, [xw, sy * span * 0.38, zw + t * 0.4], 0.75);
      co(M, 'CABANE STRUT', 3, [posts[2][0], posts[2][1], (fr.zm + zw) / 2], 0.5);
      co(M, 'AILERON', 2, [xw - c * 0.4, sy * span * 0.4, zw], 0.35);
    });
    M.part('ENGINE', () => {
      const nr = Rp * 0.24, nl = c * 0.9, zn = zw + t * 0.5 + nr * 0.95;
      for (const y of ye) for (const s of [1, -1]) {
        M.at(xw + c * 0.35, s * y, zn, () => A.nacelle(M, { len: nl, r: nr, prop: 'front', propR: Rp, blades: g.blades }));
        M.box([xw - c * 0.1, s * y - nr * 0.3, zw], [xw + c * 0.55, s * y + nr * 0.3, zn - nr * 0.6], { isect: false });
      }
      co(M, 'ENGINE', g.ne, [xw + c * 0.35, sy * ye[0], zn + nr], 0.6);
      co(M, 'PROPELLER', g.ne, [xw + c * 0.8, sy * (ye[0] + Rp * 0.5), zn + Rp * 0.4], 0.45);
    });
    tailOnBoom(M, g, fr, xt, Math.max(span * 0.3, g.W * 1.2), sy);
    tricycle(M, g, fr, yc, -g.L * 0.12, sy);
  },
};

// ---------------------------------------------------- ringwing
KIND.ringwing = {
  plan(M, g) {
    g.variant = vpick(M, [[2, 'twin'], [1.5, 'four']]);
    const sz = Math.max(g.L, g.W, 1.5);
    g.ne = g.variant === 'twin' ? 2 : 4;
    g.wr = clamp(sz * 0.05, 0.15, 0.7);
    const hyp = Math.hypot(g.W / 2, g.H / 2), mx = Math.max(g.W, g.H);
    g.c = clamp(g.L * 0.4, hyp * 0.4, hyp * 1.0);
    g.tr = g.c * 0.13;
    // the ring clears the box's cross-section, its diameter kept near 1.6 x max(wid, hgt)
    g.Rr = hyp + clamp(0.8 * mx - hyp - g.tr * 0.5, g.gap * 0.8, g.gap * 2.2);
    g.z = Math.max(g.Rr + g.tr - g.H / 2 + g.wr * 2.4 + 0.2, g.wr * 2 + g.fd + 0.3);
    g.goes = [`flies on ${word(g.ne)} engines`, 'flies on a ring wing'];
    g.specs = [['RING DIA', `${(g.Rr * 2).toFixed(1)} M`], ['ENGINES', String(g.ne)]];
    g.family = 'air';
  },
  build(M, g) {
    const sy = seenY(M), sx = seenX(M), m = g.gap * 1.5;
    const Rr = g.Rr, c = g.c, tr = g.tr, zc = g.z + g.H / 2, xr = -g.L * 0.05;
    const yc = g.W / 2 + m;
    const xn = Math.max(g.L * 0.4, xr + c / 2 + g.wr * 1.5 + 0.1), xmn = xr - c / 2 - g.wr * 1.6 - 0.1;
    const xt = Math.min(-g.L / 2 - Math.max(g.L * 0.3, c * 0.8), xmn - g.wr * 2 - c * 0.3);
    const fr = chassis(M, g, { x0: Math.min(-g.L * 0.44, xmn - 0.1), x1: Math.max(g.L * 0.44, xn + 0.1), out: yc, outXs: [xr] });
    M.part('RING WING', () => {
      const prof = [];
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a = 2 * Math.PI * i / n;
        const u = (1 - Math.cos(a)) / 2;                    // 0 trailing edge .. 1 leading edge
        const th = tr * 0.5 * Math.sin(a) * (1.25 - 0.5 * u) * (Math.sin(a) > 0 ? 1 : 0.6);
        prof.push([Rr + th, -c / 2 + c * u]);
      }
      const Rg = M.at(xr, 0, zc, () => M.lathe(prof, { loop: true, axis: 'x', sharpDeg: 70, seg: 72 }));
      if (M.decorOn && Rg.lat) {
        const L = Rg.lat;
        L.shade({ gap: 1.7, gapMax: 5, threshold: 0.3 });
        for (let i = 0; i < 24; i++) L.meridian(i * 15, 0.08, 0.45, { w: 0 });
        L.ring(0.06, { w: 1 }); L.ring(0.94, { w: 1 });
      }
      // struts: radial from the outrigger tips and the frame, posts up beside the box
      const zi = (y) => zc + Math.sqrt(Math.max(0, (Rr - tr * 0.3) ** 2 - y * y));
      const zb = (y) => zc - Math.sqrt(Math.max(0, (Rr - tr * 0.3) ** 2 - y * y));
      const sr = Math.max(0.03, c * 0.03);
      for (const s of [1, -1]) {
        A.strut(M, [xr, s * yc, fr.zm], [xr, s * yc, zi(yc)], sr, {});
        const d = norm([0, s * yc, fr.zm - zc]);
        A.strut(M, [xr, s * yc, fr.zm], [xr, d[1] * (Rr - tr * 0.3), zc + d[2] * (Rr - tr * 0.3)], sr, {});
      }
      A.strut(M, [xr, 0, fr.z0], [xr, 0, zb(0)], sr * 1.2, {});
      co(M, 'RING WING', 1, [xr + c * 0.3, sy * Rr * 0.7, zc + Rr * 0.72], 0.8);
      co(M, 'RING STRUT', 5, [xr, sy * yc, (fr.zm + zi(yc)) / 2], 0.45);
    });
    M.part('ENGINE', () => {
      const angs = g.ne === 2 ? [35] : [20, 62];
      const nr = clamp(Rr * 0.09, 0.12, 1.2), nl = Math.max(c * 0.85, nr * 5);
      for (const a of angs) for (const s of [1, -1]) {
        const ca = Math.cos(a * D2R), sa = Math.sin(a * D2R);
        const p0 = [xr, s * ca * (Rr + tr * 0.4), zc + sa * (Rr + tr * 0.4)];
        const p1 = [xr, s * ca * (Rr + tr * 0.5 + nr * 1.7), zc + sa * (Rr + tr * 0.5 + nr * 1.7)];
        M.at(p1[0] + c * 0.1, p1[1], p1[2], () => { A.nacelle(M, { len: nl, r: nr, prop: null, open: true, exhaust: false }); M.at(nl / 2, 0, 0, () => M.ry(90, () => M.cyl(nr * 0.5, -nr * 0.2, 0, { isect: false }))); });
        beam(M, p0, p1, nr * 0.35, c * 0.4);
      }
      const a = angs[0] * D2R;
      co(M, 'ENGINE', g.ne, [xr + c * 0.1, sy * Math.cos(a) * (Rr + nr * 2.7), zc + Math.sin(a) * (Rr + nr * 2.7)], 0.6);
      co(M, 'ENGINE PYLON', g.ne, [xr, sy * Math.cos(a) * (Rr + tr), zc + Math.sin(a) * (Rr + tr)], 0.35);
    });
    tailOnBoom(M, g, fr, xt, Math.max(g.W * 1.1, Rr * 0.8), sy);
    tricycle(M, g, fr, Math.max(fr.ry, g.W * 0.4), xmn, sy, xn);
  },
};

// ---------------------------------------------------- balloons
KIND.balloons = {
  plan(M, g) {
    g.variant = vpick(M, [[3, 'cluster'], [2, 'single']]);
    const diag = Math.hypot(g.L, g.W);
    g.z = clamp(Math.max(g.L, g.W) * 0.4, 1.5, 4) + g.fd;
    g.n = g.variant === 'cluster' ? M.ri(4, 9) : 1;
    g.m = g.gap * 1.4;
    g.C = cornerPts(g, g.m, g.round ? 6 : 4);
    g.Rs = Math.max(...g.C.map(([x, y]) => Math.hypot(x, y)));
    g.ropes = g.gap * 1.5 + Math.max(0.2, g.H * 0.06);   // box top to the spreader ring
    // the whole rig above the box: no more than about the larger of its height and plan diagonal
    const avail = Math.max(1.2, Math.min(1.1, 0.95) * Math.max(g.H, diag) - g.ropes);
    if (g.variant === 'single') {
      g.rb = clamp(Math.min((avail - 0.3 * g.Rs) / 2.35, Math.max(g.L, g.W) * 0.6 + g.H * 0.1), 0.6, 14);
    } else {
      const ring = g.n <= 4 ? g.n : g.n - 1;
      const k = g.n > 4 ? 2.2 + 2.6 : 2.2 + 1.0;
      g.rb = clamp(Math.min((avail - 0.25 * g.Rs) / k, Math.sqrt(g.L * g.W) * 0.4), 0.3, 7);
      void ring;
    }
    g.jit = Array.from({ length: g.n }, () => [M.r(-1, 1), M.r(-1, 1)]);
    g.trail = M.chance(0.5);
    g.goes = g.n === 1 ? ['hangs under a gas balloon', 'floats under one balloon'] : [`hangs under ${word(g.n)} balloons`, `floats under ${word(g.n)} balloons`];
    g.specs = [['GAS VOLUME', `${Math.round(g.n * 4.19 * g.rb ** 3)} M3`], ['BALLOONS', String(g.n)]];
    g.family = 'air';
    g.float = true;
  },
  build(M, g) {
    const sy = seenY(M), sx = seenX(M), m = g.m;
    const nr = g.round ? 6 : 4;
    const C = g.C;
    const fr = chassis(M, g, { arms: C });
    const Rs = g.Rs;
    const zs = g.z + g.H + g.ropes;
    const angs = C.map(([x, y]) => Math.atan2(y, x));
    M.part('SPREADER RING', () => {
      M.at(0, 0, zs, () => M.torus(Rs, Math.max(0.025, Rs * 0.018), { isect: false }));
      for (const a of angs) {
        const p = [Math.cos(a) * Rs, Math.sin(a) * Rs, zs];
        K.ball(M, p, Math.max(0.03, Rs * 0.03));
        M.line([p, [Math.cos(a) * Math.hypot(...C[0]) * 0 + C[angs.indexOf(a)][0], C[angs.indexOf(a)][1], fr.zm]], { w: 1, pass: 2 });
      }
      // mid-side ropes on a box
      if (!g.round) for (const [x, y] of [[0, g.W / 2 + m], [0, -g.W / 2 - m]]) {
        const a = Math.atan2(y, x);
        M.line([[Math.cos(a) * Rs, Math.sin(a) * Rs, zs], [x, y, fr.zm]], { w: 0, pass: 2 });
        M.box([-fr.bw, Math.min(y, Math.sign(y) * fr.ry), fr.zm - g.fd * 0.3], [fr.bw, Math.max(y, Math.sign(y) * fr.ry), fr.zm + g.fd * 0.3], { isect: false });
      }
      co(M, 'SPREADER RING', 1, [Rs * 0.7 * sx, Rs * 0.7 * sy, zs], 0.55);
      co(M, 'SUSPENSION ROPE', C.length, lerp([C[0][0], C[0][1], fr.zm], [C[0][0], C[0][1], zs], 0.6), 0.35);
    });
    M.part(g.n === 1 ? 'GAS BALLOON' : 'BALLOON', () => {
      if (g.n === 1) {
        const R = g.rb, cz = zs + R * 1.35 + Rs * 0.3;
        const B = M.at(0, 0, cz, () => M.sphere(R));
        if (M.decorOn && B.lat) { B.lat.shade({ gap: 1.8, gapMax: 6, threshold: 0.3 }); for (let i = 0; i < 16; i++) B.lat.meridian(i * 22.5, 0.02, 0.98, { w: 0 }); }
        M.at(0, 0, cz + R * 0.995, () => M.cyl(R * 0.1, 0, R * 0.04, { isect: false }));
        M.at(0, 0, cz - R * 0.98, () => M.cone(R * 0.12, R * 0.06, -R * 0.35, 0, { isect: false }));
        net(M, [0, 0, cz], R, 12, 118, Rs, zs, nr * 2);
        co(M, 'GAS BALLOON', 1, [R * 0.6 * sx, R * 0.6 * sy, cz + R * 0.3], 0.8);
        co(M, 'LOAD NET', 1, [R * 0.75 * sx, R * 0.4 * sy, cz - R * 0.5], 0.45);
        co(M, 'GAS VALVE', 1, [0, 0, cz + R * 1.04], 0.35);
      } else {
        const n = g.n, rb = g.rb;
        const ring = n <= 4 ? n : n - 1;
        const rho = ring === 1 ? 0 : Math.max(Rs * 0.5, rb * 1.12 / Math.sin(Math.PI / ring));
        const z0 = zs + rb * 2.2 + Rs * 0.25;
        const balls = [];
        for (let i = 0; i < ring; i++) {
          const a = (i + 0.5) * 2 * Math.PI / ring;
          balls.push([Math.cos(a) * rho, Math.sin(a) * rho, z0 + g.jit[i][0] * rb * 0.5]);
        }
        if (n > 4) balls.push([g.jit[n - 1][0] * rb * 0.2, g.jit[n - 1][1] * rb * 0.2, z0 + rb * 1.6]);
        balls.forEach((p, i) => {
          const r = rb * (0.9 + 0.12 * g.jit[i][1]);
          const B = M.at(p[0], p[1], p[2], () => M.sphere(r));
          if (M.decorOn && B.lat) { B.lat.shade({ gap: 1.8, gapMax: 6, threshold: 0.3 }); for (let q = 0; q < 12; q++) B.lat.meridian(q * 30, 0.03, 0.97, { w: 0 }); }
          M.at(p[0], p[1], p[2] - r * 0.98, () => M.cone(r * 0.1, r * 0.05, -r * 0.18, 0, { isect: false }));
          // tether to the nearest ring point
          const a = Math.atan2(p[1], p[0]);
          let best = 0, bd = 1e9;
          angs.forEach((b2, j) => { const d = Math.abs(Math.atan2(Math.sin(a - b2), Math.cos(a - b2))); if (d < bd) { bd = d; best = j; } });
          const q = [Math.cos(angs[best]) * Rs, Math.sin(angs[best]) * Rs, zs];
          M.line([[p[0], p[1], p[2] - r * 1.16], q], { w: 1, pass: 2 });
        });
        co(M, 'BALLOON', n, [balls[0][0] + rb * 0.6 * sx, balls[0][1] + rb * 0.5 * sy, balls[0][2]], 0.8);
        co(M, 'TETHER', n, lerp([balls[0][0], balls[0][1], balls[0][2] - rb], [Math.cos(angs[0]) * Rs, Math.sin(angs[0]) * Rs, zs], 0.5), 0.35);
      }
    });
    if (g.trail) M.part('TRAIL ROPE', () => {
      const p = [C[1][0], C[1][1], fr.zm];
      const q = [p[0] - g.z * 0.5, p[1] * 1.1, 0];
      const pts = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([p[0] + (q[0] - p[0]) * t * t, p[1] + (q[1] - p[1]) * t, p[2] * (1 - t)]); }
      pts.push([q[0] - g.z * 0.4, q[1], 0]);
      M.line(pts, { w: 1, pass: 2 });
      co(M, 'TRAIL ROPE', 1, pts[5], 0.3);
    });
    g.drops = C.map(([x, y]) => [x, y, fr.z0]);
    g.figure = [sx * g.L * 0.2, sy * (Math.max(g.W / 2 + 1.8, Rs * 0.7))];
  },
};

// ---------------------------------------------------- rockets
KIND.rockets = {
  plan(M, g) {
    g.variant = vpick(M, [[3, 'lander'], [2, 'pods']]);
    const sz = Math.max(g.L, g.W, 1.5);
    if (g.variant === 'lander') {
      g.ne = M.pick([1, 3, 4, 5]);
      g.re = clamp(Math.min(g.L, g.W) * (g.ne === 1 ? 0.22 : 0.13), 0.12, 1.6);
      g.le = g.re * 1.6;
      g.tp = clamp(sz * 0.03, 0.06, 0.4);
      g.z = g.fd + g.tp + g.le * 1.62;
      g.nl = g.round ? M.pick([3, 4]) : 4;
      g.goes = [`rises on ${word(g.ne)} rocket ${g.ne === 1 ? 'engine' : 'engines'}`, `lands on ${word(g.nl)} legs`];
      g.specs = [['THRUST', `${Math.round(g.mass * 1.6 * 9.8 + 5)} KN`], ['ENGINES', String(g.ne)]];
    } else {
      g.rp = clamp(g.H * 0.2, 0.15, 1.6);
      g.wr = clamp(sz * 0.04, 0.1, 0.5);
      g.z = Math.max(g.wr * 2.6 + g.fd, g.rp * 0.95 + 0.15);
      g.ne = 2;
      g.goes = ['rides on two rocket pods', 'is pushed by two rocket pods'];
      g.specs = [['THRUST', `${Math.round(g.mass * 2 * 9.8 + 5)} KN`], ['ROCKET PODS', '2']];
    }
    g.family = 'space';
  },
  build(M, g) {
    const sy = seenY(M), sx = seenX(M), m = g.gap * 1.4;
    if (g.variant === 'lander') {
      const C = g.round && g.nl === 3 ? cornerPts(g, m, 3) : cornerPts(g, m);
      const fr = chassis(M, g, { arms: C });
      M.part('LANDING LEG', () => {
        const lr = clamp(Math.max(g.L, g.W) * 0.02, 0.035, 0.4);
        let best = null;
        for (const [x, y] of C) {
          const d = norm([x, y, 0]);
          const foot = [x + d[0] * g.z * 0.55, y + d[1] * g.z * 0.55, lr * 4];
          const p = [x, y, fr.zm], q = [x - d[0] * g.z * 0.25, y - d[1] * g.z * 0.25, fr.z0];
          K.leg(M, { top: [p, q], foot, r: lr });
          M.at(foot[0], foot[1], 0, () => K.footpad(M, { r: lr * 6 }));
          const f = d[0] * M.view.e[0] + d[1] * M.view.e[1];
          if (!best || f > best.f) best = { f, foot, p };
        }
        co(M, 'LANDING LEG', C.length, lerp(best.p, best.foot, 0.5), 0.75);
        co(M, 'FOOTPAD', C.length, [best.foot[0], best.foot[1], lr * 1.5], 0.55);
      });
      M.part('ENGINE', () => {
        const pz = fr.z0 - g.tp;
        const T = g.round ? M.cyl(Math.min(g.L, g.W) * 0.3, pz, fr.z0) : M.box([-g.L * 0.3, -g.W * 0.3, pz], [g.L * 0.3, g.W * 0.3, fr.z0]);
        void T;
        M.at(0, 0, pz - g.le * 0.12, () => K.nozzles(M, { n: g.ne, r: g.re, len: g.le }));
        M.cyl(g.re * 0.5, pz - g.le * 0.12, pz, { isect: false });
        // two spherical tanks between the legs
        const tr = clamp(Math.min(g.L, g.W) * 0.14, 0.1, 1.2);
        if (pz - tr * 2.2 > g.le * 0.3) for (const s of [1, -1]) M.at(0, s * (g.W * 0.3 + tr * 0.4), pz - tr * 2.1, () => K.tankSphere(M, { r: tr, legs: false }));
        co(M, g.ne === 1 ? 'DESCENT ENGINE' : 'ENGINE CLUSTER', g.ne, [0, sy * g.re, pz - g.le * 0.7], 0.65);
        co(M, 'THRUST FRAME', 1, [sx * g.L * 0.3, sy * g.W * 0.3, pz + g.tp / 2], 0.35);
      });
      return;
    }
    // pods
    const rp = g.rp, lp = g.L * 0.85, yp = g.W / 2 + g.gap + rp * 1.3;   // the fins clear the box too
    const zp = g.z + rp * 0.2 + g.gap;
    const fr = chassis(M, g, { out: yp - rp * 0.5, outXs: [-lp * 0.25, lp * 0.25] });
    M.part('ROCKET POD', () => {
      for (const s of [1, -1]) {
        M.at(0, s * yp, zp, () => rocketPod(M, lp, rp));
        for (const x of [-lp * 0.25, lp * 0.25]) beam(M, [x, s * (yp - rp * 0.5), fr.zm], [x, s * yp, zp - rp * 0.9], rp * 0.35, rp * 0.25);
      }
      co(M, 'ROCKET POD', 2, [lp * 0.15, sy * (yp + rp), zp + rp * 0.3], 0.8);
      co(M, 'NOZZLE', 2, [-lp / 2 - rp * 0.6, sy * (yp + rp * 0.4), zp], 0.45);
    });
    M.part('LANDING WHEEL', () => {
      for (const [x, y] of [[g.L * 0.35, fr.ry], [g.L * 0.35, -fr.ry], [-g.L * 0.35, fr.ry], [-g.L * 0.35, -fr.ry]]) M.at(x, y, 0, () => A.gearLeg(M, { h: fr.z0, wr: g.wr, ww: g.wr * 0.6 }));
      co(M, 'LANDING WHEEL', 4, [g.L * 0.35, sy * fr.ry, g.wr], 0.4);
    });
  },
};

// ---------------------------------------------------- monowheel
KIND.monowheel = {
  plan(M, g) {
    g.variant = vpick(M, [[2, 'open'], [1.5, 'spoked']]);
    // the ring goes around the smaller cross-section: axis along the box's longer plan side
    g.axX = g.L > g.W * 1.15;
    const Lr = g.axX ? g.W : g.L;
    const hyp = Math.hypot(Lr / 2, g.H / 2 + g.fd), mx = Math.max(Lr, g.H);
    const tt = clamp(hyp * 0.07, 0.05, 0.8);
    const Ri = hyp + clamp(0.8 * mx - hyp - tt, g.gap * 0.8, g.gap * 2.2);
    g.Ri = Ri;
    g.tt = tt;
    g.Rw = Ri + g.tt;
    const Wr = g.axX ? g.L : g.W;
    g.tw = clamp(Math.min(Wr * 0.45, g.Rw * 0.25), 0.12, 2);
    g.z = g.Rw - g.H / 2;
    g.ro = clamp(g.Rw * 0.1, 0.1, 0.8);
    g.goes = ['rolls inside one great wheel', 'rolls in a single wheel'];
    g.specs = [['WHEEL DIA', `${(g.Rw * 2).toFixed(1)} M`], ['WHEELS', '1 + 2']];
  },
  build(M, g) {
    if (!g.axX) return monoBuild(M, g);
    // ring in the y-z plane: build turned a quarter about z with length and width swapped
    const h = { ...g, L: g.W, W: g.L, figure: null };
    M.rz(90, () => monoBuild(M, h));
    g.figure = null;
  },
};
function monoBuild(M, g) {
  {
    const sy = seenY(M), sx = seenX(M);
    const Rw = g.Rw, Ri = g.Ri, zc = Rw, tw = g.tw;
    const ri = Ri - g.tt * 0.2;
    const rr0 = clamp(Ri * 0.05, 0.05, 0.5);
    const sa = clamp((zc - (g.z - g.fd - rr0 * 1.3)) / (ri - rr0), 0.2, 0.97);   // rollers below the plane
    const al = Math.asin(sa);
    const rr = clamp(Ri * 0.05, 0.05, 0.5);
    const rol = [1, -1].map((s) => [s * Math.cos(al) * (ri - rr), 0, zc - Math.sin(al) * (ri - rr)]);
    const fr = chassis(M, g, { x0: Math.min(-g.L * 0.44, rol[1][0] + rr), x1: Math.max(g.L * 0.44, rol[0][0] - rr) });
    M.part('WHEEL RING', () => {
      M.at(0, 0, zc, () => PG.bigWheel(M, { r: Rw, w: tw, hub: Ri, hubs: false, tread: M.pick(['chevron', 'block']) }));
      for (const s of [1, -1]) M.at(0, s * tw * 0.3, zc, () => M.rx(90, () => M.torus(Ri - g.tt * 0.05, Math.max(0.015, g.tt * 0.12), { isect: false })));
      if (g.variant === 'spoked') {
        for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; for (const s of [1, -1]) M.tube([Math.cos(a) * Ri, s * tw * 0.5, zc + Math.sin(a) * Ri], [Math.cos(a + Math.PI / 12) * Ri, -s * tw * 0.5, zc + Math.sin(a + Math.PI / 12) * Ri], Math.max(0.01, g.tt * 0.08), { isect: false }); }
      }
      co(M, 'WHEEL RING', 1, [Rw * 0.7 * sx, sy * tw * 0.5, zc + Rw * 0.7], 0.8);
      co(M, 'INNER RAIL', 2, [-Ri * 0.7 * sx, sy * tw * 0.3, zc + Ri * 0.7], 0.4);
    });
    M.part('CARRIAGE', () => {
      for (const [i, p] of rol.entries()) {
        M.at(p[0], 0, p[2], () => K.wheel(M, { r: rr, w: tw * 0.4, hub: rr * 0.5, hubs: 'seen' }));
        const xe = i === 0 ? fr.x1 : fr.x0;
        for (const s of [1, -1]) M.tube([xe, s * fr.ry, fr.z0], [p[0], s * tw * 0.25, p[2]], Math.max(0.02, rr * 0.25), {});
        M.tube([p[0], -tw * 0.25, p[2]], [p[0], tw * 0.25, p[2]], Math.max(0.015, rr * 0.2), { isect: false });
      }
      // drive unit pressing a roller onto the bottom of the ring
      const zb = zc - ri + rr;
      const B = M.box([-g.L * 0.12, -tw * 0.4, zb + rr * 0.6], [g.L * 0.12, tw * 0.4, fr.z0]);
      for (const k of ['+y', '-y']) { const f = B.f(k); if (f.on) K.louver(f, [-f.w * 0.4, -f.h * 0.35, f.w * 0.1, f.h * 0.35]); }
      M.at(0, 0, zb, () => K.wheel(M, { r: rr, w: tw * 0.4, hub: rr * 0.5, hubs: 'seen' }));
      co(M, 'CARRIAGE', 1, [g.L * 0.3, sy * fr.ry, fr.z0], 0.6);
      co(M, 'DRIVE UNIT', 1, [g.L * 0.1, sy * tw * 0.4, (zb + fr.z0) / 2], 0.5);
      co(M, 'RAIL ROLLER', 2, [rol[0][0], sy * tw * 0.25, rol[0][2]], 0.35);
    });
    M.part('OUTRIGGER WHEEL', () => {
      const yo = g.W / 2 + g.gap + g.ro * 1.5, xo = -g.L * 0.15 * sx;
      for (const s of [1, -1]) {
        M.tube([xo, s * fr.ry, fr.z0], [xo, s * yo, g.ro], Math.max(0.025, g.ro * 0.15), {});
        M.tube([xo + g.L * 0.2, s * fr.ry, fr.z0], [xo, s * yo, g.ro * 1.3], Math.max(0.02, g.ro * 0.1), {});
        M.at(xo, s * (yo + g.ro * 0.3), g.ro, () => K.wheel(M, { r: g.ro, w: g.ro * 0.5, hub: g.ro * 0.5, hubs: 'seen' }));
      }
      co(M, 'OUTRIGGER WHEEL', 2, [xo, sy * (yo + g.ro * 0.6), g.ro], 0.55);
    });
    g.figure = [sx * (Rw + 1.2), sy * (g.W / 2 + 1.5)];
  }
}

// ---------------------------------------------------- sails
KIND.sails = {
  plan(M, g) {
    g.variant = vpick(M, [[3, 'yacht'], [2, 'boat']]);
    const sz = Math.max(g.L, g.W, 1.5);
    g.hs = clamp(Math.max(g.L * 0.9, g.H * 0.55), 1.4, 16);
    g.r = clamp(sz * 0.08, 0.2, 1.0);
    if (g.variant === 'yacht') {
      g.z = g.r + g.fd * 1.2;
      g.goes = ['sails on three wheels', 'is sailed on three wheels'];
      g.specs = [['SAIL AREA', `${Math.round(g.hs * g.L * 0.75)} M2`], ['WHEELS', '3']];
    } else {
      g.F = clamp(sz * 0.08, 0.3, 1.2);
      g.z = SEA.WZ + g.F;
      g.goes = ['sails on a shallow hull', 'sails under gaff and jib'];
      g.specs = [['SAIL AREA', `${Math.round(g.hs * g.L * 0.75)} M2`], ['MASTS', '1']];
      g.family = 'sea';
    }
  },
  build(M, g) {
    const sy = seenY(M), sx = seenX(M);
    const d = -sx;                                      // the bow and the mast are at the end away from the viewer
    const mr = clamp(g.hs * 0.018, 0.03, 0.3);
    const mg = Math.max(g.gap * 2, Math.max(g.L, g.W) * 0.05);
    const xm = d * (g.L / 2 + mg + mr * 2);
    const xb = xm + d * Math.max(g.L * 0.3, g.hs * 0.3);
    const zb = g.z + g.H + Math.max(g.gap * 2, 0.12 + g.H * 0.05);   // the boom clears the box top
    const top = zb + g.hs;
    const xc = -d * (g.L / 2 + mg + g.L * 0.08);       // clew, past the other end
    const yo = g.W / 2 + g.gap + g.r * 1.2;
    let fr, zbase;
    if (g.variant === 'yacht') {
      fr = chassis(M, g, { out: yo, outXs: [-d * g.L * 0.3] });
      const xr = d > 0 ? fr.x1 : fr.x0, xs = d > 0 ? fr.x0 : fr.x1;
      M.part('NOSE BEAM', () => {
        for (const s of [1, -1]) beam(M, [xr, s * fr.ry, fr.zm], [xm, s * fr.ry * 0.5, fr.zm], fr.bw * 0.8, g.fd * 0.7);
        beam(M, [xm, 0, fr.zm], [xb, 0, fr.zm], fr.bw, g.fd * 0.8);
        M.box([xm - fr.bw, -yo, fr.zm - g.fd * 0.3], [xm + fr.bw, yo, fr.zm + g.fd * 0.3]);
        M.box([xm - fr.bw * 0.5, -fr.ry * 0.5, fr.zm - g.fd * 0.3], [xm + fr.bw * 0.5, fr.ry * 0.5, fr.zm + g.fd * 0.3], { isect: false });
        // boomkin out past the other end for the sheet
        M.box([Math.min(xc, xs) - fr.bw * 0.5, -fr.bw * 0.6, fr.zm - g.fd * 0.3], [Math.max(xc, xs) + fr.bw * 0.5, fr.bw * 0.6, fr.zm + g.fd * 0.3], { isect: false });
        co(M, 'BOWSPRIT', 1, [lerp([xm, 0, 0], [xb, 0, 0], 0.6)[0], 0, fr.zm], 0.4);
      });
      M.part('WHEEL', () => {
        const r = g.r, ww = r * 0.35, xw = -d * g.L * 0.3;
        for (const s of [1, -1]) M.at(xw, s * (yo + ww * 0.6), r, () => K.wheel(M, { r, w: ww, hub: r * 0.5, hubs: 'seen' }));
        for (const s of [1, -1]) M.tube([xw, s * yo, fr.zm], [xw, s * (yo + ww * 0.2), r], Math.max(0.025, r * 0.1), {});
        const xf = xb - d * r * 1.1;
        M.at(xf, 0, r, () => K.wheel(M, { r, w: ww, hub: r * 0.5, hubs: 'seen' }));
        for (const s of [1, -1]) M.tube([xf + d * r * 0.1, s * ww * 0.8, fr.zm], [xf, s * ww * 0.8, r], Math.max(0.02, r * 0.07), {});
        co(M, 'WHEEL', 3, [xw, sy * (yo + ww), r * 1.3], 0.55);
      });
      zbase = fr.z1;
    } else {
      const xstern = -d * (g.L / 2 + g.gap + g.L * 0.15);
      const b = Math.max(g.W / 2 + g.gap, Math.abs(xb - xstern) * 0.16);
      barge(M, xstern, xb, b, SEA.WZ, g.z, 'pointed');
      fr = { z0: g.z - g.fd, z1: g.z, zm: g.z - g.fd / 2, x0: Math.min(xstern, xb), x1: Math.max(xstern, xb), rx: Math.abs(xb), ry: b, bw: g.fd * 0.5 };
      M.part('LEEBOARD', () => {
        const s = sy;
        const lb = g.F * 2.2, lw = Math.max(0.2, g.L * 0.12), x0 = d * g.L * 0.15;
        M.plate([[x0, s * (b + 0.03), g.z - g.F * 0.05], [x0 + d * lw, s * (b + 0.03), g.z - g.F * 0.05], [x0 + d * lw * 0.6, s * (b + 0.03 + lb * 0.15), SEA.WZ + 0.02], [x0 - d * lw * 0.4, s * (b + 0.03 + lb * 0.15), SEA.WZ + 0.02]]);
        co(M, 'LEEBOARD', 1, [x0 + d * lw * 0.3, s * (b + 0.05), (g.z + SEA.WZ) / 2], 0.55);
        M.plate([[xstern, 0, g.z], [xstern - d * g.F * 0.6, 0, g.z], [xstern - d * g.F * 0.7, 0, SEA.WZ + 0.02], [xstern - d * g.F * 0.1, 0, SEA.WZ + 0.02]]);
        M.tube([xstern - d * g.F * 0.3, 0, g.z + 0.05], [xstern + d * g.F * 1.2, 0, g.z + g.F * 0.3], Math.max(0.02, g.F * 0.04), { isect: false });
        co(M, 'RUDDER', 1, [xstern - d * g.F * 0.4, 0, (g.z + SEA.WZ) / 2], 0.35);
      });
      M.part('WATER', () => water(M, fr.x0 - 4, fr.x1 + 4, -b - 4, b + 4, 1.4, [[fr.x1 - fr.x0, 0, b * 2]], (fr.x0 + fr.x1) / 2));
      const st = stage(M, g, { y: b, xpad: Math.max(0.6, g.L * 0.2) });
      g.figure = st.spot;
      zbase = g.z;
    }
    M.part('MAST', () => {
      const Mst = M.at(xm, 0, zbase, () => M.cone(mr, mr * 0.65, 0, top - zbase));
      if (M.decorOn && Mst.lat) Mst.lat.shade({ gap: 1.6 });
      M.at(xm, 0, top, () => M.sphere(mr * 1.3, { isect: false }));
      const throat = [xm, 0, zb + g.hs * 0.74], peak = [xc + d * g.L * 0.1, 0, zb + g.hs * 0.98];
      M.tube([xm - d * mr, 0, zb], [xc, 0, zb + g.hs * 0.02], mr * 0.7, { isect: false });
      M.tube(throat, peak, mr * 0.6, { isect: false });
      M.line([[xm, 0, top], [xb, 0, zbase]], { w: 1, pass: 2 });
      for (const s of [1, -1]) M.line([[xm, 0, top * 0.98 + zbase * 0.02], [xm, s * (g.variant === 'yacht' ? yo : fr.ry), zbase]], { w: 1, pass: 2 });
      M.line([[xc, 0, zb + g.hs * 0.02], [xc, 0, zbase]], { w: 0, pass: 2 });
      co(M, 'MAST', 1, [xm, sy * mr, zb + g.hs * 0.4], 0.5);
      co(M, 'SHROUD', 2, [xm, sy * (g.variant === 'yacht' ? yo : fr.ry) * 0.5, (top + zbase) / 2], 0.3);
      const gs = [[xm - d * mr * 1.5, 0, zb + 0.03], [xc + d * 0.05, 0, zb + g.hs * 0.02 + 0.03], peak, throat];
      M.plate(gs);
      const jb = [[xm + d * mr * 2, 0, zb + g.hs * 0.7], [xb - d * 0.05, 0, zbase + g.fd], [xm + (xb - xm) * 0.25, 0, Math.max(zbase + g.fd, g.z + g.H * 0.35)]];
      M.plate(jb);
      if (M.decorOn) {
        const off = [0, sy * Math.max(0.01, mr * 0.2), 0];
        for (let i = 1; i < 7; i++) { const t = i / 7; M.line([add(lerp(gs[0], gs[3], t), off), add(lerp(gs[1], gs[2], t), off)], { w: 0, pass: 3 }); }
        for (let i = 1; i < 4; i++) { const t = i / 4; M.line([add(lerp(jb[1], jb[0], t), off), add(lerp(jb[2], jb[0], t), off)], { w: 0, pass: 3 }); }
      }
      co(M, 'GAFF SAIL', 1, [(xm + xc) / 2, sy * 0.05, zb + g.hs * 0.45], 0.75);
      co(M, 'JIB', 1, [xm + (xb - xm) * 0.4, sy * 0.05, (zb + zbase) / 2 + g.hs * 0.2], 0.5);
    });
    if (!g.figure) g.figure = [sx * g.L * 0.1, sy * (yo + 1.6)];
  },
};

// ------------------------------------------------------------------ shared builds
// tail on a boom from the frame rear: girder, tailplane, fin
function tailOnBoom(M, g, fr, xt, span, sy) {
  M.part('TAIL', () => {
    // the boom starts behind the box; a beam under the plane carries it from the frame
    const bw = clamp(g.fd * 1.2, 0.12, 0.8);
    const a = [Math.min(fr.x0, -(g.L / 2 + g.gap + bw * 0.8)), 0, fr.zm], b = [xt, 0, fr.zm + Math.abs(xt - a[0]) * 0.06];
    if (a[0] < fr.x0) beam(M, [fr.x0, 0, fr.zm], a, fr.bw, g.fd * 0.7);
    K.girder(M, a, b, { w: bw, sec: 3 });
    for (const s of [1, -1]) M.tube([fr.x0, s * fr.ry, fr.zm], a, Math.max(0.015, g.fd * 0.08), { isect: false });
    const ct = clamp(span * 0.28, 0.3, 4), t = ct * 0.12;
    M.mirrorY(() => M.at(b[0] + ct * 0.5, 0, b[2], () => M.rx(-90, () => A.foil(M, { root: { x: 0, h: 0, c: ct, t }, tip: { x: -ct * 0.25, h: span / 2, c: ct * 0.6 }, cs: [{ s0: 0.1, s1: 0.9 }], spar: false }))));
    A.foil(M, { root: { x: b[0] + ct * 0.55, h: b[2], c: ct * 1.1, t }, tip: { x: b[0] + ct * 0.05, h: b[2] + span * 0.42, c: ct * 0.6 }, cs: [{ s0: 0.1, s1: 0.85 }], spar: false });
    co(M, 'TAILPLANE', 1, [b[0], sy * span * 0.35, b[2]], 0.45);
    co(M, 'FIN', 1, [b[0] + ct * 0.2, 0, b[2] + span * 0.25], 0.4);
    co(M, 'TAIL BOOM', 1, lerp(a, b, 0.55), 0.35);
  });
}
// nose wheel and two main legs
function tricycle(M, g, fr, ym, xmain, sy, xnose) {
  M.part('UNDERCARRIAGE', () => {
    const xn = xnose ?? fr.x1 * 0.9;
    M.at(xn, 0, 0, () => A.gearLeg(M, { h: fr.z0, wr: g.wr * 0.85, ww: g.wr * 0.5 }));
    for (const s of [1, -1]) M.at(xmain, s * ym, 0, () => A.gearLeg(M, { h: fr.zm, wr: g.wr, ww: g.wr * 0.6 }));
    if (Math.abs(ym - fr.ry) > fr.bw) for (const s of [1, -1]) M.box([xmain - fr.bw * 0.5, Math.min(s * ym, s * fr.ry), fr.z0], [xmain + fr.bw * 0.5, Math.max(s * ym, s * fr.ry), fr.z1 - g.fd * 0.2], { isect: false });
    co(M, 'MAIN WHEEL', 2, [xmain, sy * (ym + g.wr * 0.4), g.wr], 0.45);
    co(M, 'NOSE WHEEL', 1, [xn, sy * g.wr * 0.3, g.wr], 0.35);
  });
}

// ------------------------------------------------------------------ small parts
// the sea family's landing stage for the scale figure, scaled down beside small craft
function stage(M, g, o) {
  const k = clamp(0.5 * Math.max(g.L, 1) / 4.2, 0.3, 1);   // no longer than half the box
  const sx = seenX(M), sy = seenY(M);
  const y = o.y ?? g.W / 2;
  const at = [-sx * (g.L / 2 + 2.1 * k + (o.xpad ?? 0.6)), sy * (y + 1.2 * k + 0.4)];
  return M.scale(k, k, k, () => SEA.landingStage(M, { at: at.map((v) => v / k), rz: 0 }));
}
// wire wheel about the local y axis: tire, rim, hub, laced spokes
function wireWheel(M, o) {
  const R = o.r, W = o.w, n = o.spokes ?? 16, tr = W * 0.42;
  const T = M.rx(90, () => M.torus(R - tr, tr, { isect: false }));
  if (M.decorOn && T.lat) T.lat.shade({ gap: 1.5, gapMax: 4, threshold: 0.4 });
  M.rx(90, () => M.torus(R - tr * 2.1, tr * 0.32, { isect: false }));
  M.rx(-90, () => M.cyl(R * 0.13, -W * 0.55, W * 0.55));
  M.rx(-90, () => M.cyl(R * 0.07, -W * 0.8, W * 0.8, { isect: false }));
  const sr = Math.max(0.006, R * 0.012), rr = R - tr * 2.2;
  for (let i = 0; i < n; i++) {
    const a = (i + 0.5) * 2 * Math.PI / n, a2 = a + (i % 2 ? 0.35 : -0.35);
    const s = i % 2 ? 1 : -1;
    M.tube([Math.cos(a2) * R * 0.11, s * W * 0.4, Math.sin(a2) * R * 0.11], [Math.cos(a) * rr, 0, Math.sin(a) * rr], sr, { isect: false, shade: false });
  }
  return T;
}
// a ski along x centered at the origin, bottom on z = 0, tip turned up at +x
function ski(M, l, w, t) {
  const tipL = Math.min(l * 0.22, w * 3 + l * 0.1), tipH = tipL * 0.55;
  const xa = l / 2 - tipL;
  const bot = [[-l / 2, t * 0.6], [-l / 2 + t * 2, 0]];
  for (let i = 0; i <= 6; i++) { const u = i / 6; bot.push([xa + tipL * u, tipH * u * u]); }
  const topP = bot.map(([x, z], i) => [x - (i > 1 ? t * 0.4 * ((x - xa) / tipL) : 0), z + t]).reverse();
  const S = M.extrude([...bot, ...topP], -w / 2, w / 2, { plane: 'xz', smoothDeg: 25 });
  const f = S.f('+z');
  void f;
  return S;
}
// superellipse plan: n points, half length a, half beam b, exponent p
function superPlan(a, b, p, n = 48) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = 2 * Math.PI * i / n, c = Math.cos(t), s = Math.sin(t);
    out.push([a * Math.sign(c) * Math.abs(c) ** (2 / p), b * Math.sign(s) * Math.abs(s) ** (2 / p)]);
  }
  return out;
}
// wave strokes on the water at z = WZ in a band, skipping the hulls; hulls: [[len, y, w], ...]
function water(M, x0, x1, y0, y1, k = 1, hulls = [], hx = 0) {
  let q = 9301;
  const rnd = () => { q = (q * 16807) % 2147483647; return q / 2147483647; };
  const n = Math.round(22 * k);
  const z = SEA.WZ;
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * rnd(), y = y0 + (y1 - y0) * rnd();
    const ln = 0.8 + rnd() * 1.8, amp = 0.08 + rnd() * 0.08;
    if (hulls.some(([l, hy, w]) => Math.abs(x - hx) < l / 2 + ln * 0.6 && Math.abs(Math.abs(y) - Math.abs(hy)) < w / 2 + 0.3)) continue;
    const pts = [];
    for (let j = 0; j <= 8; j++) { const u = j / 8; pts.push([x - ln / 2 + ln * u, y + Math.sin(u * Math.PI * 2) * amp, z]); }
    M.line(pts, { w: 0, pass: 2, fit: false });
  }
  // a waterline ripple close along each hull
  for (const [l, hy, w] of hulls) for (const s of hy ? [1, -1] : [1]) for (const side of [1, -1]) {
    const yy = s * hy + side * (w / 2 + 0.12);
    M.line([[hx - l * 0.42, yy, z], [hx + l * 0.3, yy + side * 0.05, z]], { w: 0, pass: 2, fit: false });
  }
}
// a shallow hull from x0 (stern) to x1 (bow), half beam b, waterline z0, deck z1.
// form 'scow' (raked square ends) or 'pointed' (a bow). The deck is the plane the object stands on.
function barge(M, xs, xbow, b, z0, z1, form) {
  // xs stern, xbow bow: either way along x. Built with the bow at +u and mapped x = dir * u.
  const dir = xbow >= xs ? 1 : -1, x0 = dir * xs, x1 = dir * xbow;
  let H;
  M.part('HULL', () => {
    const F = z1 - z0, rk = Math.min(F * 1.4, (x1 - x0) * 0.12);
    let deck = form === 'pointed'
      ? [[x1, 0], [x1 - (x1 - x0) * 0.12, b * 0.62], [x1 - (x1 - x0) * 0.3, b], [x0 + b * 0.2, b], [x0, b * 0.8], [x0, -b * 0.8], [x0 + b * 0.2, -b], [x1 - (x1 - x0) * 0.3, -b], [x1 - (x1 - x0) * 0.12, -b * 0.62]]
      : [[x1, b * 0.7], [x1 - b * 0.3, b], [x0 + b * 0.2, b], [x0, b * 0.8], [x0, -b * 0.8], [x0 + b * 0.2, -b], [x1 - b * 0.3, -b], [x1, -b * 0.7]];
    let wl = deck.map(([x, y]) => [x > (x0 + x1) / 2 ? x - rk : x + rk * 0.5, y * 0.94]);
    if (dir < 0) { deck = deck.map(([x, y]) => [-x, y]).reverse(); wl = wl.map(([x, y]) => [-x, y]).reverse(); }
    H = M.loft(wl.map(([x, y]) => [x, y, z0]), deck.map(([x, y]) => [x, y, z1]), {});
    const top = H.f('b');
    if (top.on) {
      const n = Math.max(3, Math.round(b * 2 / Math.max(0.2, F * 0.5)));
      for (let i = 1; i < n; i++) { const y = -top.h / 2 + top.h * i / n; top.line(-top.w * 0.44, y, top.w * 0.44, y, { w: 0 }); }
    }
    for (let i = 0; i < deck.length; i++) {
      const f = H.f('s' + i);
      if (!f.on || !f.front) continue;
      f.line(-f.w / 2, f.h * 0.28, f.w / 2, f.h * 0.28, { w: 1 });
      if (f.pxOf(f.h) > 10) f.rivets(-f.w / 2 + f.mOf(4), f.h * 0.38, f.w / 2 - f.mOf(4), f.h * 0.38, { pitch: 9 });
      const nf = Math.max(1, Math.round(f.w / Math.max(0.5, F * 1.2)));
      for (let j = 1; j < nf; j++) { const x = -f.w / 2 + f.w * j / nf; f.line(x, -f.h / 2, x, f.h * 0.28, { w: 0 }); }
      f.hatch([-f.w / 2, -f.h / 2, f.w / 2, f.h * 0.26], { angle: 0, gap: 3.2 - 1.2 * f.tone, w: 0 });
    }
    M.pipe([...deck, deck[0]].map(([x, y]) => [x, y, z1 - F * 0.05]), Math.max(0.02, F * 0.06), { isect: false });
    M.callout('HULL', 1, [(xs + xbow) / 2, seenY(M) * b, (z0 + z1) / 2], 0.5);
  });
  return H;
}
// paddle wheel about the local y axis, width w: two rims, spokes, floats
function paddleWheel(M, R, w) {
  for (const s of [1, -1]) M.at(0, s * w / 2, 0, () => M.rx(90, () => M.torus(R * 0.96, Math.max(0.015, R * 0.02), { isect: false })));
  M.rx(-90, () => M.cyl(R * 0.1, -w * 0.6, w * 0.6));
  const n = Math.max(8, Math.min(14, Math.round(R * 6)));
  for (let i = 0; i < n; i++) {
    const a = (i + 0.5) * 2 * Math.PI / n, c = Math.cos(a), s = Math.sin(a);
    for (const q of [1, -1]) M.tube([c * R * 0.1, q * w / 2, s * R * 0.1], [c * R * 0.95, q * w / 2, s * R * 0.95], Math.max(0.01, R * 0.015), { isect: false, shade: false });
    M.along([c * R * 0.72, -w / 2, s * R * 0.72], [c * R, -w / 2, s * R], (l) => M.box([0, -R * 0.02, 0], [l, R * 0.02, w]), [0, 1, 0]);
  }
}
// half-drum housing over a paddle wheel (center at origin, axis y), radial fan lines on the outside
function paddleBox(M, R, w, s) {
  const prof = [];
  for (let i = 0; i <= 14; i++) { const a = Math.PI * i / 14; prof.push([Math.cos(a) * R, Math.sin(a) * R]); }
  const B = M.extrude(prof, -w / 2, w / 2, { plane: 'xz', smoothDeg: 20 });
  const f = B.f(s > 0 ? '+y' : '-y');
  if (f.on) {
    for (let i = 1; i < 10; i++) { const a = Math.PI * i / 10; const c = [0, -f.h / 2]; f.line(c[0] + Math.cos(a) * R * 0.25, c[1] + Math.sin(a) * R * 0.25, c[0] + Math.cos(a) * R * 0.92, c[1] + Math.sin(a) * R * 0.92, { w: 1 }); }
    f.circle(0, -f.h / 2, R * 0.25, { a0: 0, a1: 180, w: 1 });
    f.circle(0, -f.h / 2, R * 0.92, { a0: 0, a1: 180, w: 0 });
  }
  return B;
}
// net over a sphere of radius r at c (balloon.js), crow's feet to the load ring
function net(M, c, r, n, phiEnd, ringR, ringZ, nFeet) {
  const k = 1.006;
  const P = (phi, th) => [c[0] + Math.sin(phi * D2R) * Math.cos(th * D2R) * r * k, c[1] + Math.sin(phi * D2R) * Math.sin(th * D2R) * r * k, c[2] + Math.cos(phi * D2R) * r * k];
  const twist = 360 / n;
  for (let i = 0; i < n; i++) for (const sg of [1, -1]) {
    const pts = [];
    for (let j = 0; j <= 14; j++) { const phi = 12 + (phiEnd - 12) * j / 14; pts.push(P(phi, i * 360 / n + sg * twist * (phi - 12) / 30)); }
    M.line(pts, { w: 0, pass: 3 });
  }
  M.line(Array.from({ length: 49 }, (_, j) => P(12, j * 7.5)), { w: 1, pass: 2 });
  for (let f = 0; f < nFeet; f++) {
    const th = (f + 0.5) * 360 / nFeet;
    const phiF = phiEnd + 16;
    const foot = [c[0] + Math.sin(phiF * D2R) * Math.cos(th * D2R) * r * 1.015, c[1] + Math.sin(phiF * D2R) * Math.sin(th * D2R) * r * 1.015, c[2] + Math.cos(phiF * D2R) * r * 1.015];
    for (const d of [-1, 0, 1]) M.line([P(phiEnd, th + d * 360 / nFeet * 0.33), foot], { w: 0, pass: 2 });
    M.line([foot, [c[0] + Math.cos(th * D2R) * ringR, c[1] + Math.sin(th * D2R) * ringR, ringZ]], { w: 1, pass: 2 });
  }
}
// rocket pod along x, centered: ogive nose at +x, a bell at -x, four small fins
function rocketPod(M, l, r) {
  const nose = r * 2.4;
  const prof = [[0, l / 2]];
  for (let i = 1; i <= 6; i++) { const u = i / 6; prof.push([r * Math.sqrt(1 - (1 - u) ** 2), l / 2 - nose * u]); }
  prof.push([r, -l / 2 + r * 0.2], [r * 0.8, -l / 2]);
  prof.reverse();
  const S = M.lathe(prof.map(([a, b]) => [a, b]), { axis: 'x', sharpDeg: 30 });
  if (M.decorOn && S.lat) { S.lat.shade({ gap: 1.6, gapMax: 4.5 }); S.lat.ring(0.3, { w: 1 }); S.lat.ring(0.62, { w: 1 }); }
  M.at(-l / 2, 0, 0, () => M.ry(90, () => K.bell(M, { r: r * 0.7, len: r * 1.2, pump: false })));
  for (let i = 0; i < 4; i++) M.rx(i * 90 + 45, () => M.plate([[-l / 2 + r * 0.1, 0, r * 0.95], [-l / 2 + r * 1.8, 0, r * 0.95], [-l / 2 + r * 0.6, 0, r * 1.7], [-l / 2 + r * 0.1, 0, r * 1.7]]));
  return S;
}


function leafSpringLite(M, L, t, w, rise) {
  for (let i = 0; i < 3; i++) {
    const l = L * (1 - i * 0.2), z = (2 - i) * t * 1.05;
    M.box([-l / 2, -w / 2, z], [l / 2, w / 2, z + t], { isect: false });
  }
  if (rise > t * 4) for (const s of [1, -1]) M.box([s * L / 2 - t, -w * 0.4, 0], [s * L / 2 + t, w * 0.4, rise], { isect: false });
}
function guard(M, r, w) {
  const a0 = 10, a1 = 170, n = 12, c = r * 0.12, t = Math.max(0.025, r * 0.05);
  const outer = [], inner = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + (a1 - a0) * i / n) * D2R;
    outer.push([Math.cos(a) * (r + c + t), Math.sin(a) * (r + c + t)]);
    inner.push([Math.cos(a) * (r + c), Math.sin(a) * (r + c)]);
  }
  return M.extrude([...outer, ...inner.reverse()], -w / 2, w / 2, { plane: 'xz', smoothDeg: 20, isect: false });
}
// wagon wheel about the local y axis: rim, hub, spokes
function spokedWheel(M, o) {
  const R = o.r, W = o.w, n = o.spokes ?? 12;
  const rim = M.rx(-90, () => M.lathe([[R, -W / 2], [R, W / 2], [R * 0.9, W / 2], [R * 0.9, -W / 2]], { loop: true, sharpDeg: 40 }));
  if (M.decorOn && rim.lat) rim.lat.ring(0.12, { w: 0 });
  M.rx(-90, () => M.cyl(R * 0.16, -W * 1.1, W * 1.1));
  M.rx(-90, () => M.cyl(R * 0.09, -W * 1.5, W * 1.5, { isect: false }));
  const sr = Math.max(0.012, R * 0.028);
  for (let i = 0; i < n; i++) {
    const a = (i + 0.5) * 2 * Math.PI / n;
    const c = Math.cos(a), s = Math.sin(a);
    M.tube([c * R * 0.15, (i % 2 ? 1 : -1) * W * 0.3, s * R * 0.15], [c * R * 0.9, 0, s * R * 0.9], sr, { isect: false, shade: false });
  }
  return rim;
}

// ------------------------------------------------------------------ plan
export function plan(M, o = {}) {
  const L = Math.max(0.4, o.len ?? 4), W = Math.max(0.3, o.wid ?? 2.5), H = Math.max(0.3, o.hgt ?? 2.5);
  const mass = Math.max(0.05, o.mass ?? L * W * H * 0.15);
  let kind = pickKind(M, o.kinds, shapeKinds(L, W, H));
  if (test.gear && KINDS.includes(test.gear)) kind = test.gear;
  if (!KIND[kind]) kind = 'wheels';
  const sz = Math.max(L, W, H);
  const g = {
    kind, L, W, H, mass, round: !!o.round,
    fd: clamp(sz * 0.045, 0.1, 0.55),       // frame depth
    gap: clamp(sz * 0.03, 0.06, 0.4),       // clearance to the declared box
    deck: false, figure: null, specs: [],
  };
  g.deck = M.chance(0.55) && !g.round;      // a round object gets no deck plate (it would show beside it)
  g.dt = g.deck ? g.fd * 0.28 : 0;
  KIND[kind].plan(M, g);
  const w = WORDS[kind];
  g.family = g.family || w.family;
  g.float = !!g.float;
  g.form = M.pick(w.form);
  g.adj = M.pick(w.adj);
  g.places = w.places.slice();
  g.goes = g.goes || ['travels'];
  // pick one phrasing as the default, keep the alternatives
  g.goesAll = g.goes;
  g.goes = M.pick(g.goes);
  let built = false;
  g.build = () => {
    if (!built) { built = true; KIND[kind].build(M, g); }
    return { specs: g.specs.slice(0, 2), figure: g.figure, drops: g.drops || null };
  };
  return g;
}
