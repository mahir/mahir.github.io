// classes/extras.js: small absurd equipment any class may add (one or two per sheet). Each
// part is a kit-style function X.name(M, opts) that builds at the current frame's origin with
// +z up, sized by an option, draws its decor only in the drawing pass, and returns something
// useful. Random draws (where a part has any) happen in both passes in the same order, so a
// part may be called anywhere a solid may. import * as X from './extras.js'
//
//   X.speakers(M, {w, h, n, depth, front})  a cluster of horn loudspeakers of many sizes packed
//            into a w (y) by h (z) block standing on z = 0, facing +x: each a drum with a flared
//            rim, a dense grille with the cone's rings on it, a band clamp, saddles and a back
//            frame. n: how many to try for (default from the size). depth: the longest drum.
//            Returns {n (built), list: [{y, z, r, d}], depth} with depth the deepest drum (x < 0).
//   X.windupKey(M, {s})         butterfly key on a shaft along +x out of a wall at x = 0, with a
//            bearing collar and flange. s: span of the butterfly. Returns {tip: x of the key}.
//   X.organPipes(M, {n, h, w, shape}) a rank of n pipes on a wind chest, mouths toward +x.
//            h: tallest pipe, w: rank width along y. shape 'tower' | 'rise' | 'vee'. Returns {n}.
//   X.weathervane(M, {h})       post, N/E/S/W arms with letters, a ball and an arrow. Returns {top}.
//   X.flag(M, {h, w, stripes})  pole with finial and a flag flying toward -x in folds. {top}
//   X.streetLamp(M, {h, arms})  plinth, fluted column, scroll bracket(s), glazed lantern(s). {top}
//   X.bell(M, {r})              a bell in a yoke on two posts, with headstock, clapper and a rope
//            wheel; r: mouth radius. Returns {top}.
//   X.umbrella(M, {r, h})       pole, eight gores with scalloped hem, ribs, finial. {top}
//   X.chimney(M, {h, w})        brick stack with courses and a band, pots, a cowl on one. {top}
//   X.clothesline(M, {len, h, n}) two T posts along x and three lines of washing with pegs. {top}
//   X.birdhouse(M, {s, h})      on a post: box with a gable roof, round hole and perch. {top}
//   X.mailbox(M, {s, h})        a round-topped mailbox on a post, door, flag lever. {top}
//   X.periscope(M, {h, r})      tube with a head prism and window toward +x, training handles. {top}
//   X.awning(M, {w, d, drop})   striped canopy out of a wall at x = 0 (toward +x), from z = 0 down
//            and out, scalloped valance, folding arms. Returns {tip: [x, z] of the front edge}.

import { D2R, circlePts } from '../geom.js';

const TAU = Math.PI * 2;

// -------------------------------------------------------------------------- loudspeakers
// pack circles of the given radii (descending) into [-W/2, W/2] x [0, H], bottom first
function pack(radii, W, H, gap) {
  const out = [];
  const fits = (y, z, r) => {
    if (y - r < -W / 2 - 1e-6 || y + r > W / 2 + 1e-6 || z - r < -1e-6 || z + r > H + 1e-6) return false;
    for (const c of out) if (Math.hypot(c.y - y, c.z - z) < c.r + r + gap - 1e-6) return false;
    return true;
  };
  for (const r of radii) {
    const cand = [[-W / 2 + r, r], [W / 2 - r, r], [0, r]];
    for (const c of out) {
      const R = c.r + r + gap;
      // on the floor beside c, against a wall beside c
      for (const s of [-1, 1]) {
        const dz = c.z - r;
        if (Math.abs(dz) < R) cand.push([c.y + s * Math.sqrt(R * R - dz * dz), r]);
        for (const wy of [-W / 2 + r, W / 2 - r]) { const dy = wy - c.y; if (Math.abs(dy) < R) cand.push([wy, c.z + s * Math.sqrt(R * R - dy * dy)]); }
      }
      // resting on two circles
      for (const d of out) {
        if (d === c) continue;
        const R2 = d.r + r + gap;
        const dx = d.y - c.y, dz = d.z - c.z, L = Math.hypot(dx, dz);
        if (L > R + R2 || L < 1e-9) continue;
        const a = (R * R - R2 * R2 + L * L) / (2 * L), hh = Math.sqrt(Math.max(0, R * R - a * a));
        const mx = c.y + dx * a / L, mz = c.z + dz * a / L;
        cand.push([mx - dz * hh / L, mz + dx * hh / L], [mx + dz * hh / L, mz - dx * hh / L]);
      }
    }
    let best = null;
    for (const [y, z] of cand) {
      if (!fits(y, z, r)) continue;
      const score = z + Math.abs(y) * 0.08;
      if (!best || score < best[2]) best = [y, z, score];
    }
    if (best) out.push({ y: best[0], z: best[1], r });
  }
  return out;
}

export function speakers(M, o = {}) {
  const W = o.w ?? 2, H = o.h ?? 1.5;
  const want = o.n ?? Math.round(W * H / 0.12);
  const big = Math.min(W, H);
  // sizes: a few large, more medium, many small, scaled so that `want` of them fill the block
  // (all drawn in both passes; the packing then shrinks them until they all fit)
  const rel = [];
  for (let i = 0; i < want; i++) {
    const k = M.rng();
    rel.push(i < Math.max(1, Math.round(want / 14)) ? M.r(0.85, 1) : k < 0.3 ? M.r(0.45, 0.65) : M.r(0.22, 0.42));
  }
  const depthMax = o.depth ?? big * 0.9;
  const stagger = rel.map(() => M.r(-0.12, 0.08));
  const dk = rel.map(() => M.r(0.55, 1));
  rel.sort((a, b) => b - a);
  const lip = 1.13;
  const area = rel.reduce((t, x) => t + Math.PI * x * x, 0) * lip * lip;
  let k = Math.sqrt(W * H * 0.7 / area);
  k = Math.min(k, big * 0.42 / rel[0]);
  let list = [];
  for (let tries = 0; tries < 14; tries++, k *= 0.94) {
    list = pack(rel.map((x) => x * k * lip), W, H, big * 0.012);
    if (list.length >= want) break;
  }
  list = list.map((c, i) => ({ ...c, r: c.r / lip, i })).slice(0, want);
  list.forEach((c, i) => {
    c.d = c.r >= big * 0.13 ? depthMax * (0.72 + 0.28 * dk[i]) : Math.min(depthMax, c.r * (1.1 + 1.6 * dk[i]));
    c.x = stagger[i] * c.r;
  });
  const z0 = o.z0 ?? 0;
  let deepest = 0;
  for (const c of list) {
    M.at(c.x, c.y, z0 + c.z, () => speakerUnit(M, c.r, c.d));
    deepest = Math.max(deepest, c.d - c.x);
  }
  // saddles: each drum rests on the base or the drums below through a short strut
  for (const c of list) {
    const xm = c.x - c.d * 0.55;
    let sup = 0;
    for (const b of list) {
      if (b === c || b.z >= c.z) continue;
      if (Math.abs(b.y - c.y) < b.r * 0.7 && b.d - b.x > -xm) sup = Math.max(sup, b.z + Math.sqrt(Math.max(0, b.r * b.r - (b.y - c.y) ** 2)));
    }
    const zb = c.z - c.r;
    if (zb - sup > 0.02) M.tube([xm, c.y, z0 + sup], [xm, c.y, z0 + zb + c.r * 0.04], Math.max(0.012, c.r * 0.06), { isect: false });
    M.boxc([xm, c.y, z0 + zb + 0.0], [c.r * 0.35, c.r * 0.5, c.r * 0.08], { isect: false });
  }
  // cradle: base rails under the cluster, cross members, back posts and a top rail
  const pr = Math.max(0.02, big * 0.018);
  const xb = -deepest - pr * 2, hTop = Math.max(...list.map((c) => c.z + c.r));
  const ph = Math.min(hTop * 0.42, H * 0.45);
  for (const s of [-1, 1]) {
    const y = s * W * 0.42;
    M.box([xb, y - pr, z0 - pr * 2], [pr * 2, y + pr, z0]);
    M.box([xb - pr, y - pr, z0 - pr * 2], [xb + pr, y + pr, z0 + ph]);
    M.tube([xb + pr, y, z0 + ph * 0.92], [xb * 0.45, y, z0 - pr], pr * 0.7, { isect: false });
  }
  for (const x of [xb, xb / 2, 0]) M.box([x - pr * 0.8, -W * 0.42 - pr * 2.5, z0 - pr * 2], [x + pr * 0.8, W * 0.42 + pr * 2.5, z0 - pr * 0.4], { isect: false });
  M.box([xb - pr, -W * 0.42 - pr, z0 + ph - pr * 1.6], [xb + pr, W * 0.42 + pr, z0 + ph], { isect: false });
  return { n: list.length, list, depth: deepest, w: W, h: hTop };
}

// one unit: drum along -x from its face at x = 0, flared rim forward of it, grille, clamp
function speakerUnit(M, r, d) {
  const drum = M.lathe([[r * 0.55, -d], [r * 0.93, -d + r * 0.08], [r, -d + r * 0.2], [r, 0]], { axis: 'x', sharpDeg: 50 });
  // flared rim: a short trumpet lip
  const rim = M.lathe([[r * 1.0, -r * 0.02], [r * 1.04, r * 0.06], [r * 1.12, r * 0.12], [r * 1.13, r * 0.16], [r * 0.92, r * 0.1], [r * 0.86, r * 0.03]], { axis: 'x', loop: true, sharpDeg: 60, isect: false });
  // grille disk just behind the lip
  const G = M.cyl(r * 0.9, r * 0.02, r * 0.035, { axis: 'x', isect: false });
  // band clamp
  const bx = -d * 0.5;
  M.cyl(r * 1.04, bx - r * 0.05, bx + r * 0.05, { axis: 'x', isect: false });
  if (M.decorOn) {
    const L = drum.lat;
    L.shade({ t0: 0.05, t1: 0.98, gap: 1.7, gapMax: 4.5 });
    if (d > r * 1.8) L.ring(0.62, { w: 0 });
    rim.lat.ring(0.3, { w: 0 });
    const f = G.top;
    if (f.on && f.pxOf(r) > 2.5) {
      const ri = r * 0.86;
      const disk = circlePts(0, 0, ri, ri, 28);
      const g = Math.max(1.05, Math.min(1.6, f.pxOf(r) / 14));
      f.hatch(disk, { angle: 45, gap: g, w: 0 });
      f.hatch(disk, { angle: -45, gap: g, w: 0 });
      if (f.pxOf(r) > 9) {
        f.circle(0, 0, ri * 0.66, { w: 1 });
        f.circle(0, 0, ri * 0.3, { w: 1 });
        f.circle(0, 0, ri * 0.98, { w: 1 });
      }
      if (f.pxOf(r) > 18) for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + 0.3; f.circle(Math.cos(a) * r * 0.96, Math.sin(a) * r * 0.96, r * 0.025, { n: 6 }); }
    }
  }
  // magnet at the back
  M.cyl(r * 0.32, -d - r * 0.18, -d + 0.001, { axis: 'x', isect: false });
}

// -------------------------------------------------------------------------- windup key
export function windupKey(M, o = {}) {
  const s = o.s ?? 1.2, sr = s * 0.06, L = o.len ?? s * 0.55;
  // flange and bearing collar on the wall
  const F = M.cyl(sr * 3.2, 0, sr * 0.5, { axis: 'x' });
  M.cyl(sr * 2.1, sr * 0.5, sr * 1.9, { axis: 'x' });
  M.cyl(sr * 2.4, sr * 1.9, sr * 2.3, { axis: 'x', isect: false });
  if (M.decorOn && F.top.on) for (let i = 0; i < 6; i++) { const a = i * TAU / 6; F.top.circle(Math.cos(a) * sr * 2.7, Math.sin(a) * sr * 2.7, sr * 0.22, { n: 6 }); }
  // shaft
  const sh = M.cyl(sr, sr * 2.3, L, { axis: 'x' });
  if (M.decorOn) sh.lat.shade({ gap: 1.6 });
  // butterfly: a hub, a stem, two lobes in the yz plane, thickness along x
  const t = s * 0.05, x0 = L, x1 = L + t;
  M.cyl(sr * 1.8, L - sr * 0.8, x1 + t * 0.3, { axis: 'x' });
  const lobe = (sg) => {
    const pts = [];
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const a = -100 + 200 * i / n;
      const rr = s * 0.25 * (1 - 0.18 * Math.cos(a * D2R * 1.0));
      pts.push([sg * (s * 0.24 + Math.cos(a * D2R) * rr), s * 0.04 + Math.sin(a * D2R) * rr * 1.05]);
    }
    pts.push([sg * s * 0.06, -s * 0.04], [sg * s * 0.06, s * 0.08]);
    if (sg < 0) pts.reverse();
    return pts;
  };
  for (const sg of [-1, 1]) {
    const S = M.extrude(lobe(sg), x0, x1, { plane: 'yz', smoothDeg: 25 });
    for (const k of ['+x', '-x']) {
      const f = S.f(k);
      if (!f.on) continue;
      // a pierced hole and a stiffening bead inside the edge
      const xf = k === '+x' ? x1 : x0;
      const uv = (y, z) => { const P = M.W([xf, y, z]); const d = [P[0] - f.o[0], P[1] - f.o[1], P[2] - f.o[2]]; return [d[0] * f.u[0] + d[1] * f.u[1] + d[2] * f.u[2], d[0] * f.v[0] + d[1] * f.v[1] + d[2] * f.v[2]]; };
      const [hu, hv] = uv(sg * s * 0.3, s * 0.04);
      const P = circlePts(hu, hv, s * 0.085, s * 0.085, 18);
      f.path(P, { closed: true, w: 1 });
      f.hatch(P, { angle: 60, gap: 0.9, w: 0 });
      f.path(lobe(sg).slice(0, 23).map(([y, z]) => uv(sg * s * 0.3 + (y - sg * s * 0.3) * 0.84, s * 0.04 + (z - s * 0.04) * 0.84)), { w: 0 });
    }
  }
  M.cyl(sr * 1.2, x1, x1 + t * 1.2, { axis: 'x', isect: false });
  return { tip: x1 + t * 1.2, s };
}

// -------------------------------------------------------------------------- organ pipes
export function organPipes(M, o = {}) {
  const n = o.n ?? 9, Hm = o.h ?? 3, W = o.w ?? 2.4, shape = o.shape ?? 'tower';
  const pitch = W / n, rMax = pitch * 0.44;
  const chestH = Hm * 0.14, chestD = rMax * 3.2;
  // wind chest
  const C = M.box([-chestD / 2, -W / 2 - pitch * 0.2, 0], [chestD / 2, W / 2 + pitch * 0.2, chestH]);
  for (const k of ['+x', '-x', '+y', '-y']) {
    const f = C.f(k);
    if (!f.on) continue;
    const g = f.grid(Math.max(1, Math.round(f.w / (chestH * 1.4))), 1, { gap: 2.2 });
    for (const r of g) { f.rect(r, { w: 1 }); f.rect(r[0] + f.mOf(3), r[1] + f.mOf(3), r[2] - f.mOf(3), r[3] - f.mOf(3), { w: 0 }); }
  }
  const T = C.f('+z');
  if (T.on) T.rect(-T.w / 2 + T.mOf(2), -T.h / 2 + T.mOf(2), T.w / 2 - T.mOf(2), T.h / 2 - T.mOf(2), { w: 0 });
  // pipes
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0.5 : i / (n - 1);
    const k = shape === 'tower' ? 1 - Math.abs(u - 0.5) * 1.3 : shape === 'vee' ? 0.35 + Math.abs(u - 0.5) * 1.3 : 0.35 + 0.65 * u;
    const h = Hm * Math.max(0.3, Math.min(1, k)) - chestH;
    const r = rMax * (0.62 + 0.38 * Math.max(0.3, Math.min(1, k)));
    const y = -W / 2 + pitch * (i + 0.5);
    M.at(0, y, chestH, () => {
      const foot = h * 0.18;
      M.cone(r * 0.18, r, 0, foot, {});
      const P = M.cyl(r, foot, h, {});
      M.cyl(r * 1.06, h - r * 0.12, h, { isect: false });
      if (M.decorOn) {
        const L = P.lat;
        L.shade({ gap: 1.5, gapMax: 4 });
        // the mouth: the flat cut and the upper lip facing +x (lathe angle 0 is +x here)
        const mw = r * 1.1, mh = r * 0.9;
        L.shape(0, 0.035, [[-mw / 2, 0], [-mw / 2, mh * 0.5], [0, mh], [mw / 2, mh * 0.5], [mw / 2, 0]], { closed: true, w: 1 });
        L.shape(0, 0.035, [[-mw / 2, mh * 0.12], [mw / 2, mh * 0.12]], { w: 1 });
        L.hatch(-mw / r / D2R * 0.45, mw / r / D2R * 0.45, 0.035 + mh * 0.13 / (h - foot), 0.035 + mh * 0.48 / (h - foot), { gap: 1.0 });
      }
    });
  }
  return { n, h: Hm, top: Hm };
}

// -------------------------------------------------------------------------- weathervane
export function weathervane(M, o = {}) {
  const h = o.h ?? 2, r = h * 0.018;
  M.cone(r * 3, r * 1.5, 0, h * 0.06);
  M.cyl(r, h * 0.06, h * 0.92);
  const za = h * 0.62, arm = h * 0.22;
  for (const [dx, dy, L] of [[1, 0, 'N'], [0, 1, 'W'], [-1, 0, 'S'], [0, -1, 'E']]) {
    M.tube([0, 0, za], [dx * arm, dy * arm, za], r * 0.45, { isect: false });
    const p = [dx * arm * 1.18, dy * arm * 1.18, za];
    let xd = dx ? [0, dx, 0] : [-dy, 0, 0];
    const wx = M.W(xd), w0 = M.W([0, 0, 0]), vr = M.view.r;
    if ((wx[0] - w0[0]) * vr[0] + (wx[1] - w0[1]) * vr[1] + (wx[2] - w0[2]) * vr[2] < 0) xd = xd.map((c) => -c);
    M.text3(L, p, xd, [0, 0, 1], h * 0.07, { pass: 2 });
  }
  M.at(0, 0, za, () => M.sphere(r * 2.2));
  M.at(0, 0, h * 0.82, () => M.sphere(r * 2.6));
  // the arrow (turns on the spindle; points along local +x rotated by o.dir)
  const zA = h * 0.92, la = h * 0.46;
  M.rz(o.dir ?? 35, () => {
    M.tube([-la * 0.55, 0, zA], [la * 0.45, 0, zA], r * 0.5, { isect: false });
    M.extrude([[la * 0.45, zA - h * 0.05], [la * 0.62, zA], [la * 0.45, zA + h * 0.05]], -r * 0.3, r * 0.3, { plane: 'xz' });
    M.at(0, 0, zA, () => 0);
    const tail = M.extrude([[-la * 0.3, 0], [-la * 0.62, h * 0.12], [-la * 0.62, -h * 0.07], [-la * 0.45, -h * 0.02]].map(([x, z]) => [x, z + zA]), -r * 0.25, r * 0.25, { plane: 'xz' });
    for (const k of ['+y', '-y']) { const f = tail.f(k); if (f.on) f.hatch(f.box, { angle: 30, gap: 2.4, w: 0 }); }
  });
  M.cyl(r * 1.4, zA - r * 2, zA + r * 2, { isect: false });
  M.at(0, 0, zA + r * 2, () => M.cone(r * 1.2, 0.0001, 0, h * 0.06, { isect: false }));
  return { top: zA + h * 0.06 };
}

// -------------------------------------------------------------------------- flag
export function flag(M, o = {}) {
  const h = o.h ?? 3, w = o.w ?? h * 0.42, fh = o.fh ?? w * 0.62, r = h * 0.012;
  M.cone(r * 2.6, r * 1.6, 0, h * 0.04);
  M.cyl(r, 0, h, {});
  M.at(0, 0, h + r * 2, () => M.sphere(r * 2.2));
  M.cyl(r * 1.6, h - fh - r * 2, h - fh - r * 0.5, { isect: false });
  // the flag in four folds, flying toward -x
  const n = 4, top = h - r * 2, bot = top - fh;
  const xs = [], ys = [];
  for (let i = 0; i <= n; i++) { xs.push(-w * i / n); ys.push(i === 0 ? 0 : Math.sin(i * 1.7) * w * 0.07 * (i / n + 0.4)); }
  const stripes = o.stripes ?? 3;
  for (let i = 0; i < n; i++) {
    const droop = (j) => fh * 0.06 * (j / n) ** 1.5;
    const quad = [[xs[i], ys[i], bot - droop(i)], [xs[i + 1], ys[i + 1], bot - droop(i + 1)], [xs[i + 1], ys[i + 1], top - droop(i + 1) * 0.5], [xs[i], ys[i], top - droop(i) * 0.5]];
    const S = M.plate(quad, { w: 2 });
    const f = S.f('face');
    if (f.on) {
      for (let k = 1; k < stripes; k++) { const t = k / stripes; f.line(-f.w / 2, -f.h / 2 + f.h * t, f.w / 2, -f.h / 2 + f.h * t, { w: 1 }); }
      if (i % 2) f.hatch(f.box, { angle: 90, gap: 2.8, w: 0 });
    }
  }
  return { top: h + r * 4 };
}

// -------------------------------------------------------------------------- street lamp
export function streetLamp(M, o = {}) {
  const h = o.h ?? 4, r = h * 0.022, arms = o.arms ?? 1;
  M.box([-r * 3.2, -r * 3.2, 0], [r * 3.2, r * 3.2, h * 0.08], { chamfer: r * 1.1 });
  M.lathe([[r * 2.4, h * 0.08], [r * 2.4, h * 0.12], [r * 1.6, h * 0.16], [r * 1.4, h * 0.22], [r * 1.6, h * 0.24]], { sharpDeg: 30 });
  const C = M.cone(r * 1.25, r * 0.95, h * 0.24, h * 0.86);
  if (M.decorOn) { for (let i = 0; i < 8; i++) C.lat.meridian(i * 45 + 10, 0.02, 0.98, { w: 0 }); C.lat.shade({ gap: 1.5 }); }
  M.cyl(r * 1.4, h * 0.86, h * 0.88, { isect: false });
  M.cyl(r * 0.8, h * 0.88, h * 0.96);
  const lantern = (x, z) => M.at(x, 0, z, () => {
    const lr = h * 0.07, lh = h * 0.13;
    const plan = (k) => Array.from({ length: 6 }, (_, i) => [Math.cos(i * TAU / 6) * lr * k, Math.sin(i * TAU / 6) * lr * k]);
    M.frustum(plan(0.55), -lh * 0.12, plan(0.9), 0);
    const G = M.frustum(plan(0.9), 0, plan(1.15), lh);
    for (let i = 0; i < 6; i++) {
      const f = G.f('s' + i);
      if (!f.on) continue;
      const ins = Math.min(f.w, f.h) * 0.12;
      const q = f.poly.map(([u, v]) => [u * (1 - ins / (f.w / 2)), v * (1 - ins / (f.h / 2))]);
      f.path(q, { closed: true, w: 1 });
      f.hatch(q, { angle: 70, gap: 1.3, gap2: 3.2, w: 0 });
    }
    M.frustum(plan(1.3), lh, plan(0.15), lh * 1.45);
    M.at(0, 0, lh * 1.45, () => { M.cyl(lr * 0.12, 0, lh * 0.12); M.at(0, 0, lh * 0.2, () => M.sphere(lr * 0.14)); });
    return lh * 1.7;
  });
  if (arms === 0) return { top: h * 0.96 + lantern(0, h * 0.96) };
  // scroll bracket arms with a curl, lanterns hanging from them
  const ax = h * 0.2;
  for (let k = 0; k < arms; k++) {
    M.rz(k * 180, () => {
      const pts = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([t * ax, 0, h * 0.86 + Math.sin(t * Math.PI) * h * 0.035 + t * h * 0.01]); }
      M.pipe(pts, r * 0.45, { isect: false });
      const curl = [];
      for (let i = 0; i <= 12; i++) { const a = (200 + i * 28) * D2R, rr = h * 0.035 * (1 - i / 16); curl.push([ax * 0.55 + Math.cos(a) * rr, 0, h * 0.86 - h * 0.035 + Math.sin(a) * rr]); }
      M.pipe([[ax * 0.15, 0, h * 0.86], ...curl], r * 0.3, { isect: false });
      M.tube([ax, 0, h * 0.87], [ax, 0, h * 0.84], r * 0.3, { isect: false });
      lantern(ax, h * 0.84 - h * 0.13 * 1.45 - h * 0.01);
    });
  }
  M.at(0, 0, h * 0.96, () => M.sphere(r * 1.3));
  return { top: h * 0.98 };
}

// -------------------------------------------------------------------------- bell
export function bell(M, o = {}) {
  const r = o.r ?? 0.5, H = r * 1.25;
  const zb = r * 0.5;                       // the mouth's height above the base
  const zt = zb + H;
  // two posts on feet and a headstock beam
  for (const s of [-1, 1]) {
    M.box([-r * 0.12, s * r * 1.35 - r * 0.1, 0], [r * 0.12, s * r * 1.35 + r * 0.1, zt + r * 0.35]);
    M.box([-r * 0.45, s * r * 1.35 - r * 0.14, 0], [r * 0.45, s * r * 1.35 + r * 0.14, r * 0.1]);
    for (const sx of [-1, 1]) M.tube([sx * r * 0.4, s * r * 1.35, r * 0.1], [sx * r * 0.12, s * r * 1.35, r * 0.55], r * 0.035, { isect: false });
  }
  M.at(0, 0, zt + r * 0.18, () => M.cyl(r * 0.05, -r * 1.5, r * 1.5, { axis: 'y', isect: false }));
  M.box([-r * 0.22, -r * 0.55, zt], [r * 0.22, r * 0.55, zt + r * 0.3]);
  // the bell: waist, shoulder, crown, sound bow and lip
  const prof = [[r * 0.92, 0], [r, r * 0.05], [r * 0.95, r * 0.18], [r * 0.74, r * 0.42], [r * 0.6, r * 0.75], [r * 0.56, r * 1.0], [r * 0.48, r * 1.18], [r * 0.25, H], [0.0001, H]];
  const B = M.at(0, 0, zb, () => M.lathe(prof, { open: true, sharpDeg: 40 }));
  if (M.decorOn) { const L = B.lat; L.ring(0.1, { w: 1 }); L.ring(0.13, { w: 1 }); L.ring(0.72, { w: 1 }); L.shade({ t0: 0.02, t1: 0.95, gap: 1.5, gapMax: 4 }); }
  // clapper
  M.tube([0, 0, zb + H * 0.9], [0, 0, zb + r * 0.12], r * 0.03, { isect: false });
  M.at(0, 0, zb + r * 0.1, () => M.sphere(r * 0.1));
  // rope wheel on the end of the headstock, outside the post, and the rope
  const wr = r * 0.38, wy = r * 1.62;
  M.at(0, wy, zt + r * 0.18, () => {
    M.rot('x', 90, () => M.torus(wr, r * 0.025, { isect: false }));
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; M.tube([0, 0, 0], [Math.cos(a) * wr, 0, Math.sin(a) * wr], r * 0.018, { isect: false }); }
  });
  M.line([[wr, wy, zt + r * 0.18], [wr, wy, r * 0.25]], { w: 1, pass: 2 });
  return { top: zt + r * 0.35 };
}

// -------------------------------------------------------------------------- umbrella
export function umbrella(M, o = {}) {
  const R = o.r ?? 1.2, h = o.h ?? R * 1.8, n = 8, r = R * 0.018;
  M.cyl(r, 0, h + R * 0.05);
  const rise = R * 0.32;
  // eight gores: each a pair of triangles from the crown to the hem, dipping between ribs
  for (let i = 0; i < n; i++) {
    const a0 = i * TAU / n, a1 = (i + 1) * TAU / n, am = (a0 + a1) / 2;
    const top = [0, 0, h + rise];
    const P0 = [Math.cos(a0) * R, Math.sin(a0) * R, h];
    const P1 = [Math.cos(a1) * R, Math.sin(a1) * R, h];
    const Pm = [Math.cos(am) * R * 0.9, Math.sin(am) * R * 0.9, h + rise * 0.08];
    for (const [A, B] of [[P0, Pm], [Pm, P1]]) {
      const S = M.plate([top, A, B], { w: 2 });
      const f = S.f('face');
      if (f.on && i % 2 === 0) f.hatch(f.poly, { angle: 90, gap: 2.4, w: 0 });
    }
    // rib and stretcher
    M.line([top, P0], { w: 1, pass: 1 });
    M.tube([0, 0, h - R * 0.35], [Math.cos(a0) * R * 0.48, Math.sin(a0) * R * 0.48, h + rise * 0.5], r * 0.3, { isect: false });
    M.at(P0[0], P0[1], P0[2], () => M.sphere(r * 0.9, { isect: false }));
  }
  M.cyl(r * 2.2, h - R * 0.38, h - R * 0.3, { isect: false });
  M.at(0, 0, h + rise, () => M.cone(r * 1.4, r * 0.4, 0, R * 0.12, { isect: false }));
  return { top: h + rise + R * 0.12 };
}

// -------------------------------------------------------------------------- chimney
export function chimney(M, o = {}) {
  const h = o.h ?? 2.5, w = o.w ?? h * 0.32, d = o.d ?? w * 0.75;
  const S = M.box([-d / 2, -w / 2, 0], [d / 2, w / 2, h]);
  M.box([-d / 2 - w * 0.06, -w / 2 - w * 0.06, h - w * 0.16], [d / 2 + w * 0.06, w / 2 + w * 0.06, h - w * 0.06]);
  M.box([-d / 2 - w * 0.03, -w / 2 - w * 0.03, h - w * 0.06], [d / 2 + w * 0.03, w / 2 + w * 0.03, h]);
  for (const k of ['+x', '-x', '+y', '-y']) {
    const f = S.f(k);
    if (!f.on) continue;
    const course = Math.max(f.mOf(3.4), 0.075);
    const brick = course * 3.1;
    let row = 0;
    for (let y = -f.h / 2 + course; y < f.h / 2 - w * 0.2; y += course, row++) {
      f.line(-f.w / 2, y, f.w / 2, y, { w: 0 });
      for (let x = -f.w / 2 + (row % 2 ? brick / 2 : brick); x < f.w / 2; x += brick) f.line(x, y - course, x, y, { w: 0 });
    }
    if (f.tone > 0.3) f.hatch([-f.w / 2, -f.h / 2, f.w / 2, f.h / 2 - w * 0.2], { angle: 45, gap: 3.4 - f.tone * 1.4, w: 0 });
  }
  // pots: one or two, the first with a cowl
  const np = o.pots ?? (w > d * 1.2 ? 2 : 1);
  let top = h;
  for (let i = 0; i < np; i++) {
    const y = np === 1 ? 0 : (i ? 1 : -1) * w * 0.24;
    const pr = Math.min(d, w / np) * 0.32, ph = pr * 2.6;
    M.at(0, y, h, () => {
      const P = M.lathe([[pr * 1.15, 0], [pr * 1.15, pr * 0.25], [pr, pr * 0.4], [pr * 0.9, ph], [pr * 1.05, ph], [pr * 1.05, ph + pr * 0.15]], { sharpDeg: 30 });
      if (M.decorOn) P.lat.shade({ gap: 1.6 });
      if (i === 0) {
        // the cowl: a hooded elbow turning on a spindle, with a vane
        M.at(0, 0, ph + pr * 0.15, () => {
          M.cyl(pr * 0.75, 0, pr * 0.7);
          M.at(0, 0, pr * 0.7, () => M.lathe([[pr * 0.95, 0], [pr * 0.95, pr * 0.1], [pr * 0.7, pr * 0.6], [0.0001, pr * 0.75]], {}));
          M.at(pr * 0.2, 0, pr * 0.45, () => M.cyl(pr * 0.55, 0, pr * 1.0, { axis: 'x' }));
          const V = M.extrude([[-pr * 0.4, pr * 0.9], [-pr * 1.8, pr * 1.2], [-pr * 1.8, pr * 0.3], [-pr * 0.4, pr * 0.4]], -pr * 0.03, pr * 0.03, { plane: 'xz' });
          for (const k of ['+y', '-y']) { const f = V.f(k); if (f.on) f.hatch(f.box, { angle: 0, gap: 2.4, w: 0 }); }
        });
        top = Math.max(top, h + ph + pr * 1.6);
      } else top = Math.max(top, h + ph + pr * 0.15);
    });
  }
  return { top };
}

// -------------------------------------------------------------------------- clothesline
export function clothesline(M, o = {}) {
  const L = o.len ?? 4, h = o.h ?? 1.9, r = 0.035, n = o.n ?? 7, cw = 0.7;
  for (const x of [-L / 2, L / 2]) {
    M.box([x - r, -r, 0], [x + r, r, h]);
    M.box([x - r * 0.9, -cw / 2, h - r * 2], [x + r * 0.9, cw / 2, h]);
    M.tube([x, 0, h * 0.72], [x, -cw * 0.3, h - r * 2], r * 0.4, { isect: false });
    M.tube([x, 0, h * 0.72], [x, cw * 0.3, h - r * 2], r * 0.4, { isect: false });
  }
  const sag = (t) => Math.sin(Math.PI * t) * L * 0.025;
  const lines = [-cw * 0.4, 0, cw * 0.4];
  for (const y of lines) {
    const pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([-L / 2 + L * t, y, h - r * 2 - sag(t)]); }
    M.line(pts, { w: 1, pass: 1 });
  }
  // washing: shirts, sheets and socks hang from the lines with pegs
  const kinds = ['shirt', 'sheet', 'sock', 'shirt', 'towel', 'sock', 'sheet'];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.6) / (n + 0.2);
    const x = -L / 2 + L * t, y = lines[i % 3], z = h - r * 2 - sag(t);
    const k = kinds[(i * 3 + (o.mix ?? 0)) % kinds.length];
    const ww = k === 'sheet' ? L * 0.16 : k === 'sock' ? 0.12 : k === 'towel' ? 0.32 : 0.45;
    const hh = k === 'sheet' ? 0.9 : k === 'sock' ? 0.28 : k === 'towel' ? 0.5 : 0.6;
    let poly;
    if (k === 'shirt') poly = [[-ww / 2, 0], [ww / 2, 0], [ww * 0.62, -hh * 0.3], [ww * 0.36, -hh * 0.34], [ww * 0.33, -hh], [-ww * 0.33, -hh], [-ww * 0.36, -hh * 0.34], [-ww * 0.62, -hh * 0.3]];
    else if (k === 'sock') poly = [[-ww / 2, 0], [ww / 2, 0], [ww / 2, -hh * 0.75], [ww * 1.4, -hh * 0.85], [ww * 1.4, -hh], [-ww / 2, -hh]];
    else poly = [[-ww / 2, 0], [ww / 2, 0], [ww / 2 + ww * 0.03, -hh], [-ww / 2 - ww * 0.02, -hh * 0.97]];
    const S = M.plate(poly.map(([u, v]) => [x + u, y, z + v]), { w: 2, isect: false });
    const f = S.f('face');
    if (f.on) {
      if (k === 'sheet') for (let j = 1; j < 4; j++) f.line(-f.w / 2 + f.w * j / 4, f.h / 2, -f.w / 2 + f.w * j / 4 + f.w * 0.03, -f.h / 2, { w: 0 });
      if (k === 'towel') { f.line(-f.w / 2, -f.h * 0.3, f.w / 2, -f.h * 0.3, { w: 1 }); f.line(-f.w / 2, -f.h * 0.36, f.w / 2, -f.h * 0.36, { w: 1 }); }
      if (k === 'shirt') { f.line(0, f.h / 2, 0, -f.h / 2, { w: 0 }); f.hatch(f.poly, { angle: 90, gap: 3.0, w: 0 }); }
    }
    for (const u of k === 'sock' ? [0] : [-ww * 0.42, ww * 0.42]) M.boxc([x + u, y, z + 0.02], [0.025, 0.03, 0.09], { isect: false });
  }
  return { top: h };
}

// -------------------------------------------------------------------------- birdhouse
export function birdhouse(M, o = {}) {
  const s = o.s ?? 0.4, h = o.h ?? 1.6;
  const pr = s * 0.08;
  M.box([-pr, -pr, 0], [pr, pr, h]);
  M.box([-s * 0.4, -s * 0.4, h - s * 0.02], [s * 0.4, s * 0.4, h]);
  const B = M.extrude([[-s / 2, 0], [s / 2, 0], [s / 2, s * 0.8], [0, s * 1.15], [-s / 2, s * 0.8]].map(([y, z]) => [y, z + h]), -s * 0.45, s * 0.45, { plane: 'yz' });
  const f = B.f('+x');
  if (f.on) {
    const cy = -f.h / 2 + s * 0.6;
    const P = circlePts(0, cy, s * 0.12, s * 0.12, 18);
    f.path(P, { closed: true, w: 1 });
    f.hatch(P, { angle: 60, gap: 0.8, w: 0 });
    for (let y = -f.h / 2 + s * 0.12; y < -f.h / 2 + s * 0.78; y += s * 0.12) f.line(-f.w / 2, y, f.w / 2, y, { w: 0 });
  }
  for (const k of ['+y', '-y']) { const g = B.f(k); if (g.on) for (let y = -g.h / 2 + s * 0.12; y < g.h / 2; y += s * 0.12) g.line(-g.w / 2, y, g.w / 2, y, { w: 0 }); }
  // roof: two slabs overhanging
  for (const sg of [-1, 1]) {
    const a0 = [s * 0.55, 0, h + s * 1.17], a1 = [s * 0.55, sg * s * 0.62, h + s * 0.74];
    const S = M.loft([[-s * 0.55, 0, a0[2]], [-s * 0.55, a1[1], a1[2]], [a1[0], a1[1], a1[2]], [a0[0], 0, a0[2]]],
      [[-s * 0.55, 0, a0[2] + s * 0.05], [-s * 0.55, a1[1], a1[2] + s * 0.05], [a1[0], a1[1], a1[2] + s * 0.05], [a0[0], 0, a0[2] + s * 0.05]]);
    void S;
  }
  M.tube([s * 0.45, 0, h + s * 0.25], [s * 0.7, 0, h + s * 0.25], s * 0.02, { isect: false });
  return { top: h + s * 1.22 };
}

// -------------------------------------------------------------------------- mailbox
export function mailbox(M, o = {}) {
  const s = o.s ?? 0.5, h = o.h ?? 1.05, w = s * 0.45, L = s;
  const pr = s * 0.06;
  M.box([-pr, -pr, 0], [pr, pr, h]);
  M.box([-L * 0.45, -w * 0.4, h], [L * 0.45, w * 0.4, h + s * 0.04]);
  const prof = [[-w / 2, 0], [w / 2, 0]];
  for (let i = 0; i <= 8; i++) { const a = i * Math.PI / 8; prof.push([Math.cos(a) * w / 2, w * 0.55 + Math.sin(a) * w / 2]); }
  const B = M.extrude(prof.map(([y, z]) => [y, z + h + s * 0.04]), -L / 2, L / 2, { plane: 'yz', smoothDeg: 30 });
  const d = B.f('+x');
  if (d.on) { d.path(d.poly.map(([u, v]) => [u * 0.86, v * 0.88]), { closed: true, w: 1 }); d.rect(-w * 0.06, d.h * 0.1, w * 0.06, d.h * 0.2, { w: 1 }); }
  // flag lever on the +y side
  M.at(-L * 0.1, w / 2 + s * 0.02, h + s * 0.04 + w * 0.4, () => {
    M.cyl(s * 0.03, 0, s * 0.03, { axis: 'y' });
    M.box([-s * 0.03, 0.0, 0], [s * 0.03, s * 0.015, w * 0.75]);
    M.box([-s * 0.03, 0.0, w * 0.6], [s * 0.2, s * 0.015, w * 0.85]);
  });
  return { top: h + s * 0.04 + w };
}

// -------------------------------------------------------------------------- periscope
export function periscope(M, o = {}) {
  const h = o.h ?? 2, r = o.r ?? h * 0.05;
  M.cyl(r * 1.8, 0, r * 0.4);
  M.cyl(r * 1.3, r * 0.4, r * 1.0);
  const T = M.cyl(r, r, h);
  if (M.decorOn) { T.lat.shade({ gap: 1.6 }); for (const t of [0.3, 0.6]) T.lat.ring(t, { w: 1 }); }
  // head: a box with a sloped front and dark window toward +x
  const hh = r * 3.2;
  const Hd = M.extrude([[-r * 1.2, h], [r * 1.0, h], [r * 1.6, h + hh * 0.35], [r * 1.6, h + hh * 0.85], [-r * 1.2, h + hh]], -r * 1.15, r * 1.15, { plane: 'xz' });
  const f = Hd.f('s2');
  if (f.on) { const q = f.poly.map(([u, v]) => [u * 0.7, v * 0.65]); f.path(q, { closed: true, w: 1 }); f.hatch(q, { angle: 70, gap: 0.9, gap2: 2.2, w: 0 }); }
  // training handles
  for (const sg of [-1, 1]) {
    M.tube([0, sg * r, h * 0.25], [0, sg * r * 3.2, h * 0.25], r * 0.25, { isect: false });
    M.tube([0, sg * r * 3.2, h * 0.25], [-r * 0.6, sg * r * 3.2, h * 0.19], r * 0.32, { isect: false });
  }
  return { top: h + hh };
}

// -------------------------------------------------------------------------- awning
export function awning(M, o = {}) {
  const w = o.w ?? 3, d = o.d ?? 1.4, drop = o.drop ?? d * 0.45, n = o.stripes ?? Math.max(4, Math.round(w / 0.32));
  // the canopy from the wall (x = 0, z = 0) to the front edge, in n strips
  const xs = (u) => [d * u, -drop * u];
  const C = M.plate([[0, -w / 2, 0], [0, w / 2, 0], [d, w / 2, -drop], [d, -w / 2, -drop]], { w: 2 });
  const f = C.f('face');
  if (f.on) {
    for (let i = 1; i < n; i++) { const x = -f.w / 2 + f.w * i / n; f.line(x, -f.h / 2, x, f.h / 2, { w: 1 }); }
    for (let i = 0; i < n; i += 2) { const x = -f.w / 2 + f.w * i / n; f.hatch([x, -f.h / 2, x + f.w / n, f.h / 2], { angle: 90, gap: 1.6, w: 0 }); }
  }
  // scalloped valance hanging from the front edge
  const vh = Math.min(0.25, d * 0.15);
  const val = [[d, -w / 2, -drop], [d, w / 2, -drop]];
  const sc = [];
  for (let i = 0; i <= n * 4; i++) { const t = i / (n * 4); sc.push([d, w / 2 - w * t, -drop - vh * (0.6 + 0.4 * Math.abs(Math.sin(t * n * Math.PI)))]); }
  const V = M.plate([...val, ...sc.slice(0)].map((p) => p), { w: 2 });
  const fv = V.f('face');
  if (fv.on) for (let i = 1; i < n; i++) { const x = -fv.w / 2 + fv.w * i / n; fv.line(x, fv.h / 2, x, fv.h / 2 - fv.h * 0.55, { w: 1 }); }
  // folding arms and the front bar
  M.tube([d, -w / 2, -drop], [d, w / 2, -drop], 0.025, { isect: false });
  for (const s of [-1, 1]) {
    const y = s * (w / 2 - 0.08);
    const k = [d * 0.45, y, -drop * 0.45 - d * 0.25];
    M.tube([0.02, y, -d * 0.55], k, 0.02, { isect: false });
    M.tube(k, [d, y, -drop], 0.02, { isect: false });
    M.box([0, y - 0.05, -d * 0.62], [0.04, y + 0.05, -d * 0.48]);
  }
  M.tube([0.03, -w / 2, -0.03], [0.03, w / 2, -0.03], 0.04, { isect: false });
  void xs;
  return { tip: [d, -drop - vh] };
}
