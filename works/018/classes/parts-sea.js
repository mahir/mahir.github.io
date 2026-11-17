// classes/parts-sea.js: shared parts for the sea family (tug, hydrofoil, bathyscaphe, catamaran).
//
// How vessels are shown: afloat, the water surface at z = WZ (a little below the sheet's
// ground plane z = 0). Hulls are built down to the waterline only and the waterline is their
// lower edge; a few wave strokes and ripple lines lie on the water around them. The scale
// figure stands on a small floating landing stage whose deck is at z = 0. Craft that need the
// whole hull (hydrofoil foils, a bathyscaphe on its cradle) build it in full.
//
//   hull(M, P)          lofted hull from stern (s = 0) to bow (s = 1), section t = 0 (waterline
//                       or keel) .. 1 (deck edge), with sheer, flare, a raked stem, a transom,
//                       round or pointed stern. Returns H with H.P(s, t, side), H.N(...),
//                       H.sOf(x), H.deckZ(x), H.halfB(x), H.solid.
//   bulwark(M, H, o)    thin wall standing on the sheer, flared like the hull, with stanchions
//   strake(M, H, o)     rubbing strake (half-round fender) along the side
//   plating(M, H, o)    strake and butt seams, boot-top band, shading, all on the hull surface
//   surfLine(M, H, st, side, o)   a line on the hull through [[s, t], ...]
//   waves(M, H, o)      ripple lines and wave strokes on the water around a hull
//   landingStage(M, o)  floating pontoon at z = 0 with piles and bollards; returns the figure spot
//   house(M, o)         deckhouse box with panels, portholes, doors
//   wheelhouse(M, o)    faceted wheelhouse with raked windows all round and a roof
//   funnel(M, o)        oval raked funnel with bands, cowl and exhaust pipes
//   mast(M, o)          pole mast with yard, lamps, radar and stays
//   bitt(M, o)          a pair of bollards on a base plate
//   anchor(M, H, o)     hawse pipe and a stockless anchor on the bow
//   lifeboat(M, o)      a covered boat in two davits
//   lifeRing(M, o)      a ring buoy on a bracket
//   tires(M, H, o)      tire fenders hanging over the side
//   bowFender(M, H, o)  the thick fender down the stem of a pusher tug

import * as K from '../kit.js';
import { D2R, add, sub, mul, cross, dot, norm, len, lerp, apply, applyDir, normalMat } from '../geom.js';

export const WZ = -0.45;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

// ------------------------------------------------------------------ hull
// P: { L, B, F (freeboard at the lowest point of the sheer), z0 (bottom, default WZ),
//      rake (stem head forward of the stem foot), over (stern overhang: deck aft of waterline),
//      stemA (stem curve exponent, 1 straight), pb (bow fullness), sb0 (s where the bow taper
//      starts), stern: 'transom'|'round'|'pointed', ss0, kt (transom width / beam), ps,
//      wl (waterline beam / deck beam), wlk (waterline bow exponent factor), flare, bulge,
//      tumble, sheerBow, sheerStern, sm (lowest point of the sheer), fcsle: {s, h},
//      n, m, deckStep }
export function hull(M, P) {
  const L = P.L, B = P.B, z0 = P.z0 ?? WZ;
  const rake = P.rake ?? L * 0.06, over = P.over ?? 0;
  const xaD = -L / 2, xfD = L / 2, xaW = -L / 2 + over, xfW = L / 2 - rake;
  const stemA = P.stemA ?? 1.6, pb = P.pb ?? 2, sb0 = P.sb0 ?? 0.55;
  const stern = P.stern || 'round', ss0 = P.ss0 ?? 0.22, kt = P.kt ?? 0.7, ps = P.ps ?? 2;
  const wl = P.wl ?? 0.92, wlk = P.wlk ?? 1.15;
  const flare = P.flare ?? 0.8, bulge = P.bulge ?? 0.03, tumble = P.tumble ?? 0.03;
  const F = P.F, sheerBow = P.sheerBow ?? F * 0.6, sheerStern = P.sheerStern ?? F * 0.15, sm = P.sm ?? 0.4;
  const fc = P.fcsle || null;
  const n = P.n ?? 34, m = P.m ?? 7;

  const shapeBow = (s, k) => { if (s <= sb0) return 1; const q = (s - sb0) / (1 - sb0); return Math.max(0, 1 - Math.pow(q, k)); };
  const shapeStern = (s, kw) => {
    if (s >= ss0) return 1;
    const q = (ss0 - s) / ss0;
    if (stern === 'transom') return 1 - (1 - kw) * Math.pow(q, ps);
    if (stern === 'round') return Math.sqrt(Math.max(0, 1 - Math.pow(q, ps)));
    return Math.max(0, 1 - Math.pow(q, ps));
  };
  const yD = (s) => B / 2 * shapeBow(s, pb) * shapeStern(s, kt);
  const yW = (s) => B / 2 * wl * shapeBow(s, pb * wlk) * shapeStern(s, kt * (P.ktw ?? 0.85));
  const xD = (s) => xaD + s * (xfD - xaD);
  const xW = (s) => xaW + s * (xfW - xaW);
  const fcAt = (s) => (fc ? fc.h * smooth((s - fc.s) / 0.012 + 0.5) : 0);
  const zS = (s) => z0 + F + sheerBow * Math.pow(Math.max(0, (s - sm) / (1 - sm)), 2) + sheerStern * Math.pow(Math.max(0, (sm - s) / sm), 2) + fcAt(s);
  const kOf = (s) => 1 + flare * Math.pow(Math.max(0, (s - 0.45) / 0.55), 1.3);
  const bulOf = (s) => (bulge + tumble * Math.max(0, (0.45 - s) / 0.45)) * shapeBow(s, pb) * (stern === 'transom' ? 1 : shapeStern(s, kt));
  const aOf = (s) => 1 + (stemA - 1) * s * s;

  const pt = (s, t, side = 1) => {
    const a = aOf(s);
    const x = xW(s) + (xD(s) - xW(s)) * Math.pow(t, a);
    const yw = yW(s), yd = yD(s);
    const y = yw + (yd - yw) * Math.pow(t, kOf(s)) + bulOf(s) * Math.sin(Math.PI * t) * B / 2;
    const z = z0 + (zS(s) - z0) * t;
    return [x, side * y, z];
  };
  const nrm = (s, t, side = 1) => {
    const e = 1e-3;
    const s0 = clamp(s - e, 0, 1), s1 = clamp(s + e, 0, 1), t0 = clamp(t - e, 0, 1), t1 = clamp(t + e, 0, 1);
    const ds = sub(pt(s1, t, 1), pt(s0, t, 1)), dt = sub(pt(s, t1, 1), pt(s, t0, 1));
    let nn = norm(cross(dt, ds)); // port side: outward +y
    if (nn[1] < 0 && Math.abs(nn[1]) > Math.abs(nn[0]) * 0.2) nn = mul(nn, -1);
    if (len(cross(dt, ds)) < 1e-12) nn = [s > 0.5 ? 1 : -1, 0, 0];
    return [nn[0], side * nn[1], nn[2]];
  };

  // stations: cosine spacing, the forecastle break as a pair
  let ss = [];
  for (let i = 0; i <= n; i++) ss.push(0.5 - 0.5 * Math.cos(Math.PI * i / n));
  if (fc) { ss = ss.filter((s) => Math.abs(s - fc.s) > 0.025); ss.push(fc.s - 0.009, fc.s + 0.009); ss.sort((a, b) => a - b); }
  const ts = [];
  for (let j = 0; j <= m; j++) ts.push(j / m);
  const NS = ss.length;
  const roundEnd = stern !== 'transom';
  const verts = [];
  const idxP = [], idxS = [];
  for (let i = 0; i < NS; i++) {
    const rp = [], rs = [];
    for (let j = 0; j <= m; j++) {
      const p = pt(ss[i], ts[j], 1);
      rp.push(verts.length); verts.push(p);
      if (i === 0 && stern === 'round') { rs.push(rp[j]); continue; }
      rs.push(verts.length); verts.push([p[0], -p[1], p[2]]);
    }
    idxP.push(rp); idxS.push(rs);
  }
  const faces = [];
  for (let i = 0; i + 1 < NS; i++) {
    for (let j = 0; j < m; j++) {
      const a = idxP[i][j], b = idxP[i + 1][j], c = idxP[i + 1][j + 1], d = idxP[i][j + 1];
      faces.push({ v: [a, d, c], g: 1 }, { v: [a, c, b], g: 1 });
      const a2 = idxS[i][j], b2 = idxS[i + 1][j], c2 = idxS[i + 1][j + 1], d2 = idxS[i][j + 1];
      faces.push({ v: [a2, b2, c2], g: 1 }, { v: [a2, c2, d2], g: 1 });
    }
    // deck strip
    const brk = fc && ss[i] < fc.s && ss[i + 1] > fc.s;
    faces.push({ v: [idxP[i][m], idxS[i][m], idxS[i + 1][m], idxP[i + 1][m]], g: brk ? 8 : 7, name: brk ? 'break' : 'deck' + i });
  }
  // bottom (waterplane or keel flat)
  const bot = [];
  for (let i = 0; i < NS; i++) bot.push(idxP[i][0]);
  for (let i = NS - 1; i >= 0; i--) bot.push(idxS[i][0]);
  faces.push({ v: bot, name: 'bottom' });
  if (stern === 'transom') {
    const tr = [idxP[0][0]];
    for (let j = 0; j <= m; j++) tr.push(idxS[0][j]);
    for (let j = m; j >= 1; j--) tr.push(idxP[0][j]);
    faces.push({ v: tr, name: 'transom' });
  }
  let solid;
  M.part(P.part || 'HULL', () => { solid = M._solid(verts, faces, { closed: true, isect: P.isect !== false, w: 3 }); });
  void roundEnd;

  // P and N give world points and normals (the hull may be built inside a transform)
  const T0 = M.T.slice(), NM0 = normalMat(T0);
  const H = {
    P: (s, t, side = 1) => apply(T0, pt(s, t, side)), N: (s, t, side = 1) => norm(applyDir(NM0, nrm(s, t, side))), solid, L, B, F, z0, stern, ss, m, xaD, xfD, xaW, xfW, rake, over,
    zS, yD, yW, xD, xW,
    sOf: (x) => clamp((x - xaD) / (xfD - xaD), 0, 1),
    deckZ: (x) => zS(clamp((x - xaD) / (xfD - xaD), 0, 1)),
    halfB: (x) => yD(clamp((x - xaD) / (xfD - xaD), 0, 1)),
    // lowest deck z over an x range (to seat a deckhouse)
    deckMin: (x0, x1) => { let z = Infinity; for (let k = 0; k <= 12; k++) z = Math.min(z, zS(clamp((x0 + (x1 - x0) * k / 12 - xaD) / (xfD - xaD), 0, 1))); return z; },
    deckMax: (x0, x1) => { let z = -Infinity; for (let k = 0; k <= 12; k++) z = Math.max(z, zS(clamp((x0 + (x1 - x0) * k / 12 - xaD) / (xfD - xaD), 0, 1))); return z; },
    transom: solid.f('transom'),
  };
  return H;
}

// ------------------------------------------------------------------ lines on the hull
// st: [[s, t], ...] on side (+1 port, -1 starboard). o: w, pass, lift (px), dash
export function surfLine(M, H, st, side, o = {}) {
  if (!M.decorOn || st.length < 2) return;
  const lift = (o.lift ?? 0.9) * M.px;
  const pts = [], nr = [];
  for (const [s, t] of st) {
    const p = H.P(s, t, side), q = H.N(s, t, side);
    pts.push(p[0] + q[0] * lift, p[1] + q[1] * lift, p[2] + q[2] * lift);
    nr.push(q[0], q[1], q[2]);
  }
  M.decor.push({ pts, gid: -1, w: o.w ?? 1, pass: o.pass ?? 2, dash: o.dash || null, part: M._part(), nrm: nr });
}
// a run along s at fixed t (dense)
export function runS(M, H, t, s0, s1, side, o = {}) {
  const k = Math.max(4, Math.ceil(Math.abs(s1 - s0) * 120));
  const st = [];
  for (let i = 0; i <= k; i++) st.push([s0 + (s1 - s0) * i / k, typeof t === 'function' ? t(s0 + (s1 - s0) * i / k) : t]);
  surfLine(M, H, st, side, o);
}
export function runT(M, H, s, t0, t1, side, o = {}) {
  const st = [];
  for (let i = 0; i <= 8; i++) st.push([s, t0 + (t1 - t0) * i / 8]);
  surfLine(M, H, st, side, o);
}
// local frame on the hull at (s, t): origin, outward normal n, along (toward bow) a, up u
export function frameAt(H, s, t, side) {
  const p = H.P(s, t, side), n = H.N(s, t, side);
  let a = sub(H.P(Math.min(1, s + 0.01), t, side), H.P(Math.max(0, s - 0.01), t, side));
  a = norm(sub(a, mul(n, dot(a, n))));
  const u = cross(n, a);
  return { p, n, a: side > 0 ? a : a, u: side > 0 ? mul(u, -1) : u };
}

// lettering that follows the hull surface, centered at (s, t), cap height h (meters)
export function hullText(M, H, str, s, t, side, h, o = {}) {
  if (!M.decorOn || !M.font || !str || h / M.px < 2.2) return;
  const T = M.font(String(str), { spacing: o.spacing ?? 0.2 });
  const e = 1e-3;
  const dS = len(sub(H.P(Math.min(1, s + e), t, side), H.P(Math.max(0, s - e), t, side))) / (2 * e);
  const dT = len(sub(H.P(s, Math.min(1, t + e), side), H.P(s, Math.max(0, t - e), side))) / (2 * e);
  const scr = dot(sub(H.P(Math.min(1, s + e), t, side), H.P(Math.max(0, s - e), t, side)), M.view.r);
  const dir = scr >= 0 ? 1 : -1;
  for (const p of T.paths) {
    const pts = [];
    for (let i = 0; i < p.length; i += 2) {
      const x = (p[i] - T.width / 2) * h, y = (p[i + 1] - 0.5) * h;
      if (i > 0) {
        const x0 = (p[i - 2] - T.width / 2) * h, y0 = (p[i - 1] - 0.5) * h;
        const k = Math.max(1, Math.ceil(Math.hypot(x - x0, y - y0) / (h * 0.2)));
        for (let q = 1; q < k; q++) pts.push([s + dir * (x0 + (x - x0) * q / k) / dS, t + (y0 + (y - y0) * q / k) / dT]);
      }
      pts.push([s + dir * x / dS, t + y / dT]);
    }
    if (pts.length === 1) pts.push([pts[0][0] + 1e-4, pts[0][1]]);
    surfLine(M, H, pts.map(([a, b]) => [clamp(a, 0, 1), clamp(b, 0, 1)]), side, { w: o.w ?? 1, pass: 4, lift: 1.2 });
  }
}

// lines on the deck along its length at fractions of the half breadth (planking or plating)
export function deckLines(M, H, o = {}) {
  if (!M.decorOn) return;
  const n = o.n ?? 8, s0 = o.s0 ?? 0.01, s1 = o.s1 ?? 0.97;
  const lift = M.px * 0.8;
  for (let k = -n + 1; k < n; k++) {
    const f = k / n;
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const s = s0 + (s1 - s0) * i / 60;
      const yd = H.yD(s) * f;
      if (Math.abs(yd) > H.yD(s) - 0.15) continue;
      pts.push([H.xD(s), yd, H.zS(s) + lift]);
    }
    if (pts.length > 1) M.line(pts, { w: 0, pass: 3 });
  }
  // butt lines across every few meters
  const pitch = o.pitch ?? 2.4;
  const nb = Math.round(H.L / pitch);
  for (let k = 1; k < nb; k++) {
    const s = k / nb;
    if (s < s0 || s > s1) continue;
    const y = H.yD(s) - 0.15;
    if (y < 0.3) continue;
    M.line([[H.xD(s), -y, H.zS(s) + lift], [H.xD(s), y, H.zS(s) + lift]], { w: 0, pass: 3 });
  }
}

// plating: seams, boot-top band, shading. o: rows [t...], frame (m), boot (t), shade
export function plating(M, H, o = {}) {
  if (!M.decorOn) return;
  const e = M.view.e;
  const lightV = M.light;
  const sides = [1, -1];
  const ends = (H.stern === 'transom') ? [0.0, 1] : [0.0, 1];
  for (const side of sides) {
    // only bother with a side that faces the viewer somewhere
    if (dot(H.N(0.5, 0.5, side), e) < -0.6) continue;
    for (const t of o.rows || [0.38, 0.7]) runS(M, H, t, ends[0], ends[1], side, { w: 0 });
    // butt seams every few meters
    const pitch = o.frame ?? 3.2;
    const nb = Math.max(2, Math.round(H.L / pitch));
    for (let k = 1; k < nb; k++) {
      const s = k / nb;
      const rows = [0, ...(o.rows || [0.38, 0.7]), 1];
      // stagger: butts of alternate strakes are offset
      for (let r = 0; r + 1 < rows.length; r++) {
        const sk = s + (r % 2 ? 0.5 / nb : 0);
        if (sk > 0.985) continue;
        runT(M, H, sk, rows[r] + 0.01, rows[r + 1] - 0.01, side, { w: 0 });
      }
    }
    // boot-top: a dark band just above the water
    if (o.boot !== false && H.z0 === WZ) {
      const tb = o.boot ?? Math.min(0.22, 0.32 / Math.max(0.5, H.F));
      runS(M, H, tb, 0, 1, side, { w: 1 });
      const rowsPx = (H.F * tb) / M.px / 1.5;
      const nr = Math.max(1, Math.min(8, Math.floor(rowsPx)));
      for (let r = 1; r < nr; r++) runS(M, H, tb * r / nr, 0, 1, side, { w: 0, pass: 3 });
    }
    // shading: rows of lines along the hull, kept where the side is turned from the light
    if (o.shade !== false) {
      const px = (H.F) / M.px;
      const nRows = Math.max(4, Math.min(70, Math.floor(px / 2.3)));
      const th = [0.18, 0.5, 0.32, 0.66, 0.24, 0.58, 0.4, 0.74];
      const t0 = o.boot === false ? 0.02 : 0.25;
      for (let r = 0; r < nRows; r++) {
        const t = t0 + (0.97 - t0) * (r + 0.5) / nRows;
        let run = null;
        const K = 160;
        for (let i = 0; i <= K; i++) {
          const s = i / K;
          const nn = H.N(s, t, side);
          const dk = clamp((1 - dot(nn, lightV)) / 2 * 1.5 - 0.25, 0, 1);
          const on = dk > th[r % th.length] && dot(nn, e) > 0.02;
          if (on) { if (!run) run = []; run.push([s, t]); }
          else if (run) { if (run.length > 1) surfLine(M, H, run, side, { w: 0, pass: 3 }); run = null; }
        }
        if (run && run.length > 1) surfLine(M, H, run, side, { w: 0, pass: 3 });
      }
    }
  }
  // transom: panel seams and a name board
  const tf = H.transom;
  if (tf.on) {
    tf.hatch(tf.box, { angle: 0, gap: 2.4 + 1.6 * (1 - tf.tone), w: 0 });
  }
}

// ------------------------------------------------------------------ bulwark and strake
// o: h (height or fn(s)), t (thickness), s0..s1 (range, default whole), posts (stanchion pitch)
export function bulwark(M, H, o = {}) {
  const hOf = typeof o.h === 'function' ? o.h : () => o.h ?? 1.0;
  const tk = o.t ?? 0.12;
  const s0 = o.s0 ?? 0, s1 = o.s1 ?? 1;
  const NS = 40;
  const sts = [];
  for (let i = 0; i <= NS; i++) sts.push(s0 + (s1 - s0) * (0.5 - 0.5 * Math.cos(Math.PI * i / NS)));
  // the sequence around: port from bow to stern, then starboard from stern to bow
  const seq = [];
  for (let i = NS; i >= 0; i--) seq.push([sts[i], 1]);
  const roundJoin = s0 === 0 && H.stern !== 'transom';
  for (let i = roundJoin ? 1 : 0; i <= NS; i++) seq.push([sts[i], -1]);
  const sec = (s, side) => {
    const p = H.P(s, 1, side);
    let d = sub(p, H.P(s, 0.88, side)); d = norm(d);
    const h = hOf(s);
    const top = add(p, mul(d, h / Math.max(0.3, d[2])));
    // inward horizontal normal
    const nn = H.N(s, 0.98, side);
    let inw = norm([-nn[0], -nn[1], 0]);
    if (s > 0.995 || s < 0.005) inw = [s > 0.5 ? -1 : 1, 0, 0];
    const dz = 0.06;
    return [[p[0], p[1], p[2] - dz], top, add(top, mul(inw, tk)), add([p[0], p[1], p[2] - dz], mul(inw, tk))];
  };
  const verts = [], faces = [];
  const rings = [];
  for (const [s, side] of seq) { const q = sec(s, side); const r = []; for (const v of q) { r.push(verts.length); verts.push(v); } rings.push(r); }
  // transom: the starboard run starts at the transom corner; between port and starboard stern
  // stations is the transom top (a straight run across)
  for (let k = 0; k + 1 < rings.length; k++) {
    const A = rings[k], Bq = rings[k + 1];
    const across = !roundJoin && seq[k][1] !== seq[k + 1][1];
    for (let e = 0; e < 4; e++) {
      const e2 = (e + 1) % 4;
      faces.push({ v: [A[e], A[e2], Bq[e2], Bq[e]], g: across ? 20 + e : 10 + e });
    }
  }
  const A0 = rings[0], A1 = rings[rings.length - 1];
  if (s1 >= 0.999) { faces.push({ v: [A0[3], A0[2], A0[1], A0[0]], name: 'capA' }); faces.push({ v: [A1[0], A1[1], A1[2], A1[3]], name: 'capB' }); }
  else { faces.push({ v: [A0[3], A0[2], A0[1], A0[0]], name: 'capA' }); faces.push({ v: [A1[0], A1[1], A1[2], A1[3]], name: 'capB' }); }
  const S = M._solid(verts, faces, { closed: true, isect: false, girth: tk * 1.5 });
  // stanchions (brackets) on the inner face and freeing ports on the outer face
  if (o.posts !== false) {
    const pitch = o.posts ?? 1.6;
    const nP = Math.max(3, Math.round(H.L * (s1 - s0) / pitch));
    for (const side of [1, -1]) {
      for (let k = 1; k < nP; k++) {
        const s = s0 + (s1 - s0) * k / nP;
        if (s > 0.93) continue;
        const q = sec(s, side);
        const inw = norm(sub(q[3], q[0]));
        const a = add(q[3], mul(inw, 0.04)), b = add(lerp(q[3], q[2], 0.96), mul(inw, 0.04));
        M.tube(a, b, Math.min(0.045, tk * 0.35), { isect: false, shade: false, caps: true });
      }
    }
  }
  if (M.decorOn && o.ports !== false) {
    // freeing ports: small dark slots along the bottom of the outer face
    for (const side of [1, -1]) {
      const nF = Math.max(2, Math.round(H.L * (s1 - s0) / 4.5));
      for (let k = 0; k < nF; k++) {
        const s = s0 + (s1 - s0) * (0.15 + 0.6 * (k + 0.5) / nF);
        const q = sec(s, side), q2 = sec(s + 0.025, side);
        const a = lerp(q[0], q[1], 0.08), b = lerp(q2[0], q2[1], 0.08), c = lerp(q2[0], q2[1], 0.36), d = lerp(q[0], q[1], 0.36);
        const nn = H.N(s, 0.99, side);
        const lift = mul(nn, M.px * 0.8);
        const P4 = [a, b, c, d, a].map((p) => add(p, lift));
        M.decor.push({ pts: P4.flat(), gid: -1, w: 1, pass: 2, dash: null, part: M._part(), nrm: P4.map(() => nn).flat() });
        for (let r = 1; r < 4; r++) {
          const y0 = lerp(a, d, r / 4), y1 = lerp(b, c, r / 4);
          M.decor.push({ pts: [...add(y0, lift), ...add(y1, lift)], gid: -1, w: 0, pass: 3, dash: null, part: M._part(), nrm: [...nn, ...nn] });
        }
      }
    }
  }
  return { solid: S, top: (s, side) => sec(s, side)[1], inner: (s, side) => sec(s, side)[2] };
}

// rubbing strake: a half-round fender along the side at section t, both sides
export function strake(M, H, o = {}) {
  const t = o.t ?? 0.93, r = o.r ?? 0.14;
  const s0 = o.s0 ?? 0.02, s1 = o.s1 ?? 0.97;
  const k = 30;
  const run = (side, a, b) => {
    const pts = [];
    for (let i = 0; i <= k; i++) {
      const s = a + (b - a) * (0.5 - 0.5 * Math.cos(Math.PI * i / k));
      const p = H.P(s, t, side), n = H.N(s, t, side);
      pts.push(add(p, mul(n, r * 0.35)));
    }
    return pts;
  };
  if (H.stern !== 'transom' && s0 < 0.05) {
    // round stern: one strake all the way around
    const a = run(-1, s1, 0), b = run(1, 0, s1);
    return M.pipe([...a, ...b.slice(1)], r, { isect: false, w: 2, smoothBends: true });
  }
  for (const side of [1, -1]) M.pipe(run(side, s0, s1), r, { isect: false, w: 2, smoothBends: true });
}

// ------------------------------------------------------------------ water
// o: speed 0..1 (bow wave and wake), extra [[x, y], ...] spots for short strokes
export function waves(M, H, o = {}) {
  const v = M.view;
  const rdir = norm([v.r[0], v.r[1], 0]);
  const z = WZ + 0.002;
  const sp = o.speed ?? 0;
  const lineO = { w: 1, pass: 2 };
  M.part('WATERLINE', () => {
    // ripple lines following the waterline, broken
    for (const side of [1, -1]) {
      for (const [d, s0, s1] of [[0.35 + sp * 0.4, 0.05, 0.97], [0.95 + sp * 1.2, 0.18, 0.8]]) {
        let run = [];
        const K = 46;
        for (let i = 0; i <= K; i++) {
          const s = s0 + (s1 - s0) * i / K;
          const p = H.P(s, 0, side), n = H.N(s, 0.02, side);
          const nh = norm([n[0], n[1], 0]);
          const gapOn = Math.sin(i * 1.7 + d * 5 + side) > -0.35;
          if (gapOn) run.push([p[0] + nh[0] * d, p[1] + nh[1] * d, z]);
          else { if (run.length > 1) M.line(run, { ...lineO, w: d > 0.6 ? 0 : 1 }); run = []; }
        }
        if (run.length > 1) M.line(run, { ...lineO, w: d > 0.6 ? 0 : 1 });
      }
    }
    // short wave strokes along the paper's horizontal, around the hull
    const L = H.L, B = H.B;
    const spots = o.spots || [];
    const rng = o.rng || (() => 0.5);
    const n = o.n ?? 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI + rng() * 0.4;
      const rx = L * (0.55 + 0.25 * rng()), ry = B * (0.9 + 1.1 * rng());
      spots.push([Math.cos(a) * rx, Math.sin(a) * ry, 0.6 + rng() * 1.6]);
    }
    for (const [x, y, l] of spots) {
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const u = (k / 6 - 0.5) * l;
        const w = Math.sin(k / 6 * Math.PI * 2) * l * 0.04;
        pts.push([x + rdir[0] * u, y + rdir[1] * u + w, z]);
      }
      M.line(pts, { w: 0, pass: 2 });
      M.line(pts.slice(2, 5).map((p) => [p[0] - rdir[1] * l * 0.1, p[1] + rdir[0] * l * 0.1, z]), { w: 0, pass: 2 });
    }
    // bow wave and wake when under way
    if (sp > 0) {
      const xs = H.xfW;
      for (const side of [1, -1]) {
        const pts = [];
        for (let k = 0; k <= 12; k++) {
          const q = k / 12;
          pts.push([xs - q * L * 0.55 * sp - 0.2, side * (B * 0.05 + q * B * (0.45 + 0.9 * sp)), z]);
        }
        M.line(pts, { w: 1, pass: 2 });
        const pts2 = pts.map((p, k) => [p[0] - 0.6, p[1] + side * 0.25 * Math.sin(k), z]).slice(2);
        M.line(pts2, { w: 0, pass: 2 });
        // wake
        const xa = H.xaW;
        for (const d of [0.3, 0.6]) {
          const w = [];
          for (let k = 0; k <= 10; k++) { const q = k / 10; w.push([xa - q * L * 0.5 * sp, side * (B * (0.25 + d * 0.3) + q * B * d), z]); }
          M.line(w, { w: 0, pass: 2 });
        }
      }
    }
  });
}

// ------------------------------------------------------------------ landing stage
// a pontoon with its deck at z = 0 floating at WZ, two piles, bollards, tire fenders. at: center,
// rz: heading of its long side. Returns the figure spot and a bollard top (for a mooring line).
export function landingStage(M, o = {}) {
  const Lp = o.len ?? 4.2, Wp = o.w ?? 2.4, at = o.at || [0, 0], rz = o.rz ?? 0;
  let spot = null, bollard = null;
  M.part('LANDING STAGE', () => {
    M.with({ at: [at[0], at[1], 0], rz }, () => {
      const S = M.box([-Lp / 2, -Wp / 2, WZ - 0.3], [Lp / 2, Wp / 2, 0]);
      const top = S.f('+z');
      if (top.on) {
        const n = Math.max(4, Math.round(Wp / 0.25));
        for (let i = 1; i < n; i++) { const y = -top.h / 2 + top.h * i / n; top.line(-top.w / 2 + top.mOf(1.5), y, top.w / 2 - top.mOf(1.5), y, { w: 0 }); }
        for (const x of [-top.w * 0.25, top.w * 0.25]) top.line(x, -top.h / 2, x, top.h / 2, { w: 0 });
      }
      for (const k of ['+x', '-x', '+y', '-y']) {
        const f = S.f(k);
        if (f.on) { f.hatch(f.box, { angle: 0, gap: 2.2 + 1.2 * (1 - f.tone), w: 0 }); f.line(-f.w / 2, f.h / 2 - f.mOf(2), f.w / 2, f.h / 2 - f.mOf(2), { w: 1 }); }
      }
      // piles in guide hoops on the outer side
      for (const sx of [-1, 1]) {
        const x = sx * (Lp / 2 + 0.3);
        const P = M.at(x, -Wp * 0.15, 0, () => M.cyl(0.2, WZ, 2.6));
        if (M.decorOn) { P.lat.shade({ gap: 1.6 }); P.lat.ring(0.92, { w: 1 }); }
        M.at(x, -Wp * 0.15, 2.6, () => M.cone(0.2, 0.05, 0, 0.12));
        M.box([Math.min(x - sx * 0.55, x + sx * 0.32), -Wp * 0.15 - 0.32, -0.1], [Math.max(x - sx * 0.55, x + sx * 0.32), -Wp * 0.15 + 0.32, 0.02], { isect: false });
      }
      // bollards
      for (const x of [-Lp * 0.36, Lp * 0.36]) M.at(x, Wp * 0.3, 0, () => bollard1(M, 0.13));
      bollard = M.W([Lp * 0.36, Wp * 0.3, 0.3]);
      // rail on the outer edge
      K.railing(M, [[-Lp * 0.2, -Wp / 2 + 0.06, 0], [Lp * 0.2, -Wp / 2 + 0.06, 0]], { h: 0.9, posts: 1.4 });
      // tires on the inner side
      for (const x of [-Lp * 0.3, 0, Lp * 0.3]) M.with({ at: [x, Wp / 2 + 0.12, WZ * 0.35], rz: 90, ry: 90 }, () => tire(M, 0.32));
      const sp = M.W([-Lp * 0.1, 0.1, 0]);
      spot = [sp[0], sp[1]];
      M.callout('LANDING STAGE', 1, [0, 0, 0], 0.6);
    });
  });
  return { spot, bollard };
}

function bollard1(M, r) {
  M.cyl(r * 1.5, 0, r * 0.25, { isect: false });
  const S = M.lathe([[r, r * 0.2], [r * 0.9, r * 1.6], [r * 1.25, r * 1.8], [r * 1.25, r * 2.1], [0, r * 2.1]]);
  if (M.decorOn) S.lat.shade({ gap: 1.6, t0: 0, t1: 0.5 });
  return S;
}

// a pair of bollards (bitt) on a base plate, along local x
export function bitt(M, o = {}) {
  const r = o.r ?? 0.14, gap = o.gap ?? r * 3.4;
  M.box([-gap / 2 - r * 1.6, -r * 1.5, 0], [gap / 2 + r * 1.6, r * 1.5, r * 0.3], { isect: false });
  for (const x of [-gap / 2, gap / 2]) M.at(x, 0, r * 0.3, () => bollard1(M, r));
}

export function tire(M, r) {
  const T = M.torus(r * 0.72, r * 0.28, { rings: 10, isect: false });
  if (M.decorOn) T.lat.shade({ gap: 1.4, gapMax: 3 });
  return T;
}

// tire fenders hanging from the bulwark top over the side
export function tires(M, H, B, o = {}) {
  const n = o.n ?? 5, s0 = o.s0 ?? 0.2, s1 = o.s1 ?? 0.8, r = o.r ?? 0.4;
  for (const side of [1, -1]) {
    for (let k = 0; k < n; k++) {
      const s = n === 1 ? (s0 + s1) / 2 : s0 + (s1 - s0) * k / (n - 1);
      const t = o.t ?? 0.62;
      const p = H.P(s, t, side), nn = H.N(s, t, side);
      const c = add(p, mul(nn, r * 0.3));
      const ang = Math.atan2(nn[1], nn[0]) / D2R;
      M.with({ at: c, rz: ang, ry: 90 - Math.asin(clamp(nn[2], -1, 1)) / D2R }, () => tire(M, r));
      const topP = B ? B.top(s, side) : H.P(s, 1, side);
      M.line([add(c, [0, 0, r * 0.7]), topP], { w: 1, pass: 2 });
    }
  }
}

// ------------------------------------------------------------------ houses
// deckhouse box x0..x1, half width hw, from z (seat) to z + h; o.chamfer front corners,
// o.ports (portholes per side), o.doors, o.windows: 'ports' | 'band' | 'x'
export function house(M, o) {
  const { x0, x1, hw, z, h } = o;
  const S = M.box([x0, -hw, z], [x1, hw, z + h], { chamfer: o.chamfer || 0 });
  const e = M.view.e;
  for (const k of ['+x', '-x', '+y', '-y', 'c0', 'c1', 'c2', 'c3']) {
    const f = S.f(k);
    if (!f.on) continue;
    const isEnd = k === '+x' || k === '-x';
    const isCh = k[0] === 'c';
    const r = [-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2)];
    const ntot = isCh ? 1 : Math.max(1, Math.round(f.w / (o.pitch ?? 1.6)));
    const g = f.grid(ntot, 1, { gap: 2.2 });
    const doorAt = !isCh && o.doors && ((k === '+y' || k === '-y') ? Math.floor(ntot * (o.doorPos ?? 0.3)) : (k === '-x' ? Math.floor(ntot / 2) : -1));
    for (const c of g) {
      const cw = c[2] - c[0], ch = c[3] - c[1];
      if (c.i === doorAt && cw > 0.6) {
        f.rect(c, { w: 0 });
        const dw = Math.min(0.85, cw * 0.7), dh = Math.min(1.9, ch * 0.88);
        K.door(M, f, (c[0] + c[2]) / 2, c[1] + dh / 2 + ch * 0.03, dw, dh, {});
        continue;
      }
      // panel frame, shade hatch and a window or port in the upper part
      K.frame(f, c, { inset: 1.6 });
      const kind = o.windows || 'ports';
      if (kind === 'band' || (kind === 'mix' && c.i % 2 === 0)) {
        const wr = [c[0] + cw * 0.14, c[1] + ch * 0.48, c[2] - cw * 0.14, c[1] + ch * 0.86];
        f.rect(wr, { w: 1 });
        K.glass(f, [[wr[0] + cw * 0.04, wr[1] + ch * 0.04], [wr[2] - cw * 0.04, wr[1] + ch * 0.04], [wr[2] - cw * 0.04, wr[3] - ch * 0.04], [wr[0] + cw * 0.04, wr[3] - ch * 0.04]], { gap: 1.0, gap2: 2.2, flip: c.i % 2 === 1 });
      } else if (kind === 'x' && !isEnd) {
        K.xWindow(f, [c[0] + cw * 0.12, c[1] + ch * 0.3, c[2] - cw * 0.12, c[1] + ch * 0.9], { flip: c.i % 2 === 1 });
      } else {
        const rad = Math.min(cw, ch) * 0.2;
        K.porthole(f, (c[0] + c[2]) / 2, c[1] + ch * 0.64, Math.min(rad, 0.22), { flip: c.i % 2 === 1 });
      }
      if (f.tone > 0.3) f.hatch([c[0] + f.mOf(3), c[1] + f.mOf(3), c[2] - f.mOf(3), c[1] + ch * 0.4], { angle: 90, gap: 3.6 - 1.8 * f.tone, w: 0 });
    }
    void e; void r;
  }
  const top = S.f('+z');
  if (top.on) {
    top.rect(-top.w / 2 + top.mOf(2.5), -top.h / 2 + top.mOf(2.5), top.w / 2 - top.mOf(2.5), top.h / 2 - top.mOf(2.5), { w: 0 });
    const ns = Math.max(2, Math.round(top.w / 0.6));
    for (let i = 1; i < ns; i++) { const x = -top.w / 2 + top.w * i / ns; top.line(x, -top.h / 2 + top.mOf(2.5), x, top.h / 2 - top.mOf(2.5), { w: 0 }); }
  }
  // a coaming strip around the roof edge
  M.box([x0 - 0.04, -hw - 0.04, z + h - 0.06], [x1 + 0.04, hw + 0.04, z + h + 0.05], { isect: false, chamfer: o.chamfer ? o.chamfer + 0.04 : 0, w: 2 });
  return S;
}

// wheelhouse: faceted front (toward +x), windows leaning out at the top, roof with visor
export function wheelhouse(M, o) {
  const { x0, x1, hw, z, h } = o;
  const lean = o.lean ?? h * 0.12;
  const fx = x1 - hw * (o.facet ?? 0.55);
  const kind = o.front || 'facet';
  let plan;
  if (kind === 'round') {
    plan = [[x0, -hw]];
    const N = 7;
    for (let i = 0; i <= N; i++) { const a = -90 + 180 * i / N; plan.push([fx + Math.cos(a * D2R) * (x1 - fx), Math.sin(a * D2R) * hw]); }
    plan.push([x0, hw]);
  } else plan = [[x0, -hw], [fx, -hw], [x1, -hw * 0.38], [x1, hw * 0.38], [fx, hw], [x0, hw]];
  const nP = plan.length;
  const top = plan.map(([x, y]) => [x > x0 + 1e-6 ? x + lean * (x - x0) / (x1 - x0) : x, y]);
  const S = M.frustum(plan, z, top, z + h, { smoothDeg: kind === 'round' ? 30 : 0 });
  // windows on every side face, a band in the upper part
  const fr = (sk, i, nWin) => {
    const f = S.f(sk);
    if (!f.on) return;
    const band = [-f.w / 2 + f.mOf(2), -f.h / 2 + f.h * 0.42, f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2.5)];
    f.rect(-f.w / 2, -f.h / 2, f.w / 2, f.h / 2 - f.mOf(0.1), { w: 0 });
    const n = nWin;
    const bw = (band[2] - band[0]) / n;
    for (let k = 0; k < n; k++) {
      const w0 = band[0] + bw * k + bw * 0.06, w1 = band[0] + bw * (k + 1) - bw * 0.06;
      const r = [w0, band[1], w1, band[3]];
      f.rect(r, { w: 1 });
      const q = f.mOf(1.6);
      K.glass(f, [[r[0] + q, r[1] + q], [r[2] - q, r[1] + q], [r[2] - q, r[3] - q], [r[0] + q, r[3] - q]], { gap: 0.95, gap2: 2.0, flip: (k + i) % 2 === 1 });
      // a wiper on front windows
      if (o.wipers && sk === frontFace) f.line((w0 + w1) / 2, band[1] + q * 2, (w0 + w1) / 2 - (w1 - w0) * 0.3, band[3] - (band[3] - band[1]) * 0.35, { w: 1 });
    }
    // lower part: plate with a shade
    const low = [-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), band[1] - f.mOf(2.4)];
    if (f.tone > 0.25) f.hatch(low, { angle: 90, gap: 3.6 - 1.8 * f.tone, w: 0 });
    f.line(low[0], low[3] + f.mOf(1.2), low[2], low[3] + f.mOf(1.2), { w: 1 });
  };
  const frontFace = kind === 'round' ? null : 's2';
  for (let i = 0; i < nP; i++) {
    const a = plan[i], b = plan[(i + 1) % nP];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (i === nP - 1) { // back wall: a door and two windows
      const f = S.f('s' + i);
      if (f.on) {
        f.rect(-f.w / 2, -f.h / 2, f.w / 2, f.h / 2, { w: 0 });
        K.door(M, f, -f.w * 0.22, -f.h / 2 + Math.min(1.9, f.h * 0.82) / 2 + 0.05, Math.min(0.75, f.w * 0.3), Math.min(1.9, f.h * 0.82), {});
        const wr = [f.w * 0.05, f.h * 0.0, f.w * 0.4, f.h * 0.38];
        f.rect(wr, { w: 1 });
        K.glass(f, [[wr[0], wr[1]], [wr[2], wr[1]], [wr[2], wr[3]], [wr[0], wr[3]]], { gap: 1.0, gap2: 2.2 });
        if (f.tone > 0.25) f.hatch([-f.w / 2 + f.mOf(2), -f.h / 2 + f.mOf(2), f.w / 2 - f.mOf(2), f.h / 2 - f.mOf(2)], { angle: 90, gap: 3.8 - 1.8 * f.tone, w: 0, holes: [[-f.w * 0.22 - 0.45, -f.h / 2, -f.w * 0.22 + 0.45, f.h / 2], wr] });
      }
      continue;
    }
    fr('s' + i, i, Math.max(1, Math.round(L / (o.pane ?? 0.95))));
  }
  // roof slab with an overhang and visor at the front
  const ov = o.overhang ?? 0.22;
  const roofPlan = top.map(([x, y]) => [x + (x > x0 + 1e-6 ? ov + 0.05 : -ov * 0.4), y * (1 + ov / hw)]);
  const R = M.frustum(roofPlan, z + h, roofPlan, z + h + 0.16, {});
  const rt = R.f('b');
  if (rt.on) { rt.path(rt.poly.map(([x, y]) => [x * 0.9, y * 0.86]), { closed: true, w: 0 }); }
  return { solid: S, roofZ: z + h + 0.16, roofPlan, fx };
}

// funnel: oval lathe, raked aft, sits with its base at z (sunk into the roof); o: r, h,
// ratio (width / length), rake (deg), bands, cowl, twin pipes
export function funnel(M, o) {
  const r = o.r ?? 0.7, h = o.h ?? 2.5, ratio = o.ratio ?? 0.62, rake = o.rake ?? 10;
  let S;
  M.ry(-rake, () => M.scale(1, ratio, 1, () => {
    const prof = o.shape === 'taper'
      ? [[r * 1.06, -0.4], [r, h * 0.5], [r * 0.86, h]]
      : [[r, -0.4], [r, h * 0.82], [r * 1.02, h * 0.9], [r * 0.98, h]];
    S = M.lathe(prof, { caps: true, sharpDeg: 30 });
    if (M.decorOn) {
      const Lt = S.lat;
      const bands = o.bands ?? 2;
      for (let b = 0; b < bands; b++) {
        const t0 = 0.55 + b * 0.12;
        Lt.ring(t0, { w: 1 }); Lt.ring(t0 + 0.06, { w: 1 });
        Lt.hatch(0, 360, t0, t0 + 0.06, { gap: 1.6 });
      }
      Lt.shade({ t0: 0.02, t1: 0.98, gap: 1.7, gapMax: 6 });
      if (o.mark) Lt.text(o.mark, M.view.az + 180, 0.4, Math.min(h * 0.12, r * 0.5));
      if (S.top.on) { S.top.circle(0, 0, r * 0.85, { w: 1 }); S.top.hatch(S.top.poly, { angle: 45, gap: 1.0, w: 0 }); }
    }
    // exhaust pipes poking out of the top
    for (const y of o.pipes === 1 ? [0] : [-0.35, 0.35]) {
      M.at(r * 0.15, y * r, 0, () => {
        const p = M.cyl(r * 0.16, h - 0.3, h + 0.45, { isect: false });
        M.cyl(r * 0.2, h + 0.3, h + 0.38, { isect: false });
        return p;
      });
    }
  }));
  // cowl / cap ring
  if (o.cowl) M.ry(-rake, () => M.scale(1, ratio, 1, () => M.at(0, 0, h - 0.02, () => M.cone(r * 1.1, r * 0.95, 0, 0.18, { isect: false }))));
  return S;
}

// mast: pole from z0 to z0 + h at the current origin, yard, lamps, radar, stays.
// o.stays: [[x,y,z], ...] deck points the stays run to (world-local frame)
export function mast(M, o) {
  const h = o.h ?? 6, r = o.r ?? 0.1, z0 = o.z ?? 0;
  const P = M.cyl(r, z0, z0 + h);
  M.cone(r, r * 0.4, z0 + h, z0 + h + 0.4);
  if (M.decorOn) P.lat.shade({ gap: 1.4 });
  // yard
  const yz = z0 + h * (o.yardAt ?? 0.72), yw = o.yard ?? h * 0.32;
  M.boxc([0, 0, yz], [0.1, yw * 2, 0.1], { isect: false });
  for (const s of [1, -1]) M.tube([0, s * yw * 0.9, yz], [0, 0, yz - yw * 0.5], 0.03, { isect: false, shade: false });
  // signal lamps on the yard arms and the masthead
  for (const s of [1, -1]) M.at(0, s * yw * 0.75, yz + 0.05, () => M.lathe([[0.07, 0], [0.09, 0.08], [0.09, 0.22], [0.05, 0.28], [0, 0.3]]));
  for (let k = 0; k < (o.lamps ?? 2); k++) M.at(0.12, 0, z0 + h * (0.84 + k * 0.07), () => K.lamp(M, { r: 0.08 }));
  // radar on a platform
  if (o.radar) {
    const pz = z0 + h * (o.radarAt ?? 0.5);
    M.box([-0.45, -0.45, pz - 0.06], [0.45, 0.45, pz], { isect: false });
    K.railing(M, [[-0.42, -0.42, pz], [0.42, -0.42, pz], [0.42, 0.42, pz], [-0.42, 0.42, pz], [-0.42, -0.42, pz]], { h: 0.5, posts: 0.5, r: 0.02 });
    M.at(0.1, 0, pz, () => M.rz(o.radarYaw ?? 20, () => K.radar(M, { len: o.radar })));
  }
  // stays
  const tip = [0, 0, z0 + h * 0.95];
  for (const s of o.stays || []) M.line([tip, s], { w: 1, pass: 1 });
  return P;
}

// hawse pipe and a stockless anchor on the bow at (s, t), both sides
export function anchor(M, H, o = {}) {
  const s = o.s ?? 0.9, t = o.t ?? 0.78, sz = o.size ?? H.B * 0.1;
  for (const side of [1, -1]) {
    const F = frameAt(H, s, t, side);
    // hawse ring
    if (M.decorOn) {
      const ring = (rr, lift) => {
        const pts = [], nr = [];
        for (let k = 0; k <= 20; k++) {
          const a = 2 * Math.PI * k / 20;
          const p = add(add(F.p, mul(F.a, Math.cos(a) * rr * 1.25)), mul(F.u, Math.sin(a) * rr));
          const q = add(p, mul(F.n, M.px * lift));
          pts.push(...q); nr.push(...F.n);
        }
        M.decor.push({ pts, gid: -1, w: 1, pass: 2, dash: null, part: M._part(), nrm: nr });
      };
      ring(sz * 0.42, 1.5); ring(sz * 0.3, 1.5);
    }
    // anchor: shank down from the hawse, crown and flukes against the hull below
    const p0 = add(F.p, mul(F.n, sz * 0.12));
    const p1 = add(p0, mul(F.u, -sz * 1.3));
    M.tube(p0, p1, sz * 0.09, { isect: false, w: 2 });
    const c = add(p1, mul(F.n, sz * 0.05));
    const fl = (d) => add(add(c, mul(F.a, d * sz * 0.65)), mul(F.u, sz * 0.32));
    M.pipe([fl(-1), add(c, mul(F.a, -sz * 0.35)), add(c, mul(F.a, sz * 0.35)), fl(1)], sz * 0.1, { isect: false, w: 2 });
  }
  M.callout('BOWER ANCHOR', 2, H.P(s, t - 0.1, 1), 1.1);
}

// a covered boat on two davits; boat along local x, davits on the -y side bearing on z = 0
export function lifeboat(M, o = {}) {
  const L = o.len ?? 4.5, Bb = L * 0.36, hz = o.hz ?? 1.2;
  let boat;
  M.at(0, 0, hz, () => {
    boat = hull(M, { L, B: Bb, F: Bb * 0.5, z0: 0, rake: L * 0.06, over: L * 0.06, stern: 'pointed', ss0: 0.4, ps: 1.7, sb0: 0.55, pb: 1.8, wl: 0.25, wlk: 1, flare: 0.1, bulge: 0.28, tumble: 0, sheerBow: Bb * 0.12, sheerStern: Bb * 0.12, sm: 0.5, n: 18, m: 5, part: 'LIFEBOAT', isect: false });
    // canopy: half ellipsoid over the middle
    const C = M.at(0, 0, Bb * 0.5, () => M.scale(L * 0.36, Bb * 0.46, Bb * 0.42, () => M.lathe([[1, 0], [0.97, 0.25], [0.87, 0.5], [0.66, 0.76], [0.3, 0.96], [0, 1]], { isect: false })));
    if (M.decorOn) {
      const Lt = C.lat;
      Lt.ring(0.2, { w: 1 });
      for (let k = 0; k < 6; k++) Lt.port(k * 60 + 30, 0.35, Bb * 0.06);
      Lt.shade({ t0: 0.05, t1: 0.95, gap: 1.6 });
      surfLine(M, boat, Array.from({ length: 30 }, (_, i) => [0.03 + 0.94 * i / 29, 0.7]), 1, { w: 1 });
      surfLine(M, boat, Array.from({ length: 30 }, (_, i) => [0.03 + 0.94 * i / 29, 0.7]), -1, { w: 1 });
    }
  });
  // davits: curved arms from the deck to above the boat's ends
  for (const x of [-L * 0.32, L * 0.32]) {
    const base = [x, -Bb * 0.9, 0];
    const pts = [base, [x, -Bb * 0.9, hz + Bb * 0.6], [x, -Bb * 0.6, hz + Bb * 1.15], [x, -Bb * 0.05, hz + Bb * 1.3]];
    M.pipe(pts, 0.07, { isect: false, w: 2 });
    M.box([x - 0.18, -Bb * 0.9 - 0.18, 0], [x + 0.18, -Bb * 0.9 + 0.18, 0.12], { isect: false });
    M.line([[x, -Bb * 0.05, hz + Bb * 1.25], [x, 0, hz + Bb * 0.95]], { w: 1, pass: 1 });
    // the boat's keel chocks
  }
  return boat;
}

// ring buoy on a small bracket, ring in the local yz plane facing +x
export function lifeRing(M, o = {}) {
  const r = o.r ?? 0.36;
  const T = M.ry(90, () => M.torus(r * 0.75, r * 0.25, { rings: 10, isect: false }));
  if (M.decorOn) {
    for (let k = 0; k < 4; k++) T.lat.hatch(k * 90 + 20, k * 90 + 55, 0, 1, { gap: 1.2 });
  }
  M.box([-0.08, -0.05, r * 0.65], [0.02, 0.05, r * 1.05], { isect: false });
  return T;
}

// the thick fender down a pusher tug's stem
export function bowFender(M, H, o = {}) {
  const r = o.r ?? H.B * 0.06;
  const pts = [];
  for (let k = 0; k <= 10; k++) {
    const t = 0.12 + 0.86 * k / 10;
    const p = H.P(1, t, 1);
    const p2 = H.P(0.985, t, 1), p3 = H.P(0.985, t, -1);
    const n = norm(sub(p, lerp(p2, p3, 0.5)));
    pts.push(add(p, mul(n, r * 0.55)));
  }
  const S = M.pipe(pts, r, { isect: false, w: 3 });
  // and the fender running round the bow just below the sheer
  const ring = [];
  for (let k = 0; k <= 10; k++) {
    const s = 0.86 + 0.14 * k / 10;
    const p = H.P(s, 0.9, 1), n = H.N(s, 0.9, 1);
    ring.push(add(p, mul(n, r * 0.45)));
  }
  for (let k = 9; k >= 0; k--) {
    const s = 0.86 + 0.14 * k / 10;
    const p = H.P(s, 0.9, -1), n = H.N(s, 0.9, -1);
    ring.push(add(p, mul(n, r * 0.45)));
  }
  M.pipe(ring, r * 0.8, { isect: false, w: 3 });
  if (M.decorOn) {
    // short cross lines like the rope or rubber blocks
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k], b = pts[k + 1];
      const d = norm(sub(b, a));
      const sd = norm(cross(d, [0, 0, 1]));
      void sd;
    }
  }
  return S;
}

export { clamp, smooth };

// ------------------------------------------------------------------ water marks for craft
// short wave strokes on the water in an ellipse around (cx, cy), radii rx, ry
export function waterStrokes(M, cx, cy, rx, ry, n, rng, o = {}) {
  const v = M.view;
  const rdir = norm([v.r[0], v.r[1], 0]);
  const z = WZ + 0.002;
  M.part(o.part || 'WATERLINE', () => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI + rng() * 0.5;
      const k = 0.75 + 0.35 * rng();
      const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k, l = (0.6 + rng() * 1.6) * (o.scale ?? 1);
      const pts = [];
      for (let q = 0; q <= 6; q++) { const u = (q / 6 - 0.5) * l; pts.push([x + rdir[0] * u, y + rdir[1] * u + Math.sin(q / 6 * Math.PI * 2) * l * 0.04, z]); }
      M.line(pts, { w: 0, pass: 2, fit: o.fit !== false });
      M.line(pts.slice(2, 5).map((p) => [p[0] - rdir[1] * l * 0.1, p[1] + rdir[0] * l * 0.1, z]), { w: 0, pass: 2, fit: o.fit !== false });
    }
  });
}
// where a strut pierces the water at p (moving toward +x): a ripple, spray arcs and a wake
export function spray(M, p, o = {}) {
  const z = WZ + 0.002, h = o.h ?? 0.9, len = o.len ?? 8, wv = o.w ?? 0.25;
  const [x, y] = p;
  // ripple: a pointed oval around the strut
  const rp = [];
  for (let k = 0; k <= 16; k++) { const a = 2 * Math.PI * k / 16; rp.push([x - 0.15 + Math.cos(a) * 0.55, y + Math.sin(a) * 0.3 * (1 + 0.6 * Math.max(0, -Math.cos(a))), z]); }
  M.line(rp, { w: 1, pass: 2 });
  // spray sheets: arcs thrown aft and outward
  for (const s of [1, -1]) {
    for (let j = 0; j < 2; j++) {
      const d = len * (0.28 + 0.2 * j), w = wv + 0.4 + j * 0.7;
      const pts = [];
      for (let k = 0; k <= 10; k++) { const q = k / 10; pts.push([x - q * d, y + s * (0.15 + q * w), z + 4 * q * (1 - q) * h * (1 - j * 0.25)]); }
      M.line(pts, { w: j ? 0 : 1, pass: 2 });
    }
    // wake: two diverging lines
    if (o.wake !== false) for (const off of [0, 0.4]) {
      const pts = [];
      for (let k = 0; k <= 8; k++) { const q = k / 8; pts.push([x - 0.4 - q * len, y + s * (0.3 + off + q * len * 0.22), z]); }
      M.line(pts, { w: 0, pass: 2, fit: false });
    }
  }
}
// dashed outline of what lies under the water: a list of polylines
export function underwater(M, lines) {
  for (const l of lines) M.line(l, { w: 1, pass: 2, dash: 'dash' });
}
