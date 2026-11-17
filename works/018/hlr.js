// hlr.js: orthographic projection and exact hidden-line removal, to 2D strokes.
//
// render(M, ppm) projects every solid of the Model at ppm px per meter (origin at the world
// origin, x right, y down on paper) and returns visible polylines:
//   edges     crease edges where a neighboring face looks at the viewer (portion-exact on
//             smooth surfaces), boundary edges of open surfaces
//   contours  silhouettes of smooth surfaces, interpolated across faces from vertex normals
//             (no stair steps on spheres and tori)
//   seams     face-face intersections between interpenetrating solids
//   decor     face decoration, owned by its face (never tested against it)
//   lines     free 3D polylines
// Every segment is clipped against every front-facing convex polygon that covers it in
// screen space: the parameter interval inside the polygon (Cyrus-Beck), then the part of
// that interval where the polygon is nearer (depths are linear in screen space, so the
// split is one division). A depth bias that grows with the polygon's slope keeps coplanar
// things (decor on its face, a drum standing flush on a deck) visible. A grid over the
// sheet holds the occluders. Surviving pieces are joined back into polylines.

const CELL = 18;          // grid cell, px
const EXPAND = 0.06;      // occluder polygons grown by this, px (no leaks along shared edges)
const MINPIECE = 0.12;    // drop visible pieces shorter than this, px

export function render(M, ppm, opt = {}) {
  const { r, u, e } = M.view;
  const k = ppm;
  const R0 = r[0] * k, R1 = r[1] * k, R2 = r[2] * k;
  const U0 = -u[0] * k, U1 = -u[1] * k, U2 = -u[2] * k;
  const E0 = -e[0] * k, E1 = -e[1] * k, E2 = -e[2] * k;
  const solids = M.solids;
  const t0 = performance.now();

  // ---------------------------------------------------------- project
  const nFaces = M.nFaces;
  const front = new Uint8Array(nFaces);
  for (const S of solids) {
    const V = S.V, n = V.length / 3;
    const P = new Float64Array(n * 3);
    for (let i = 0; i < n; i++) {
      const x = V[i * 3], y = V[i * 3 + 1], z = V[i * 3 + 2];
      P[i * 3] = x * R0 + y * R1 + z * R2;
      P[i * 3 + 1] = x * U0 + y * U1 + z * U2;
      P[i * 3 + 2] = x * E0 + y * E1 + z * E2;
    }
    S.P = P;
    for (const f of S.F) {
      const ne = f.n[0] * e[0] + f.n[1] * e[1] + f.n[2] * e[2];
      f.ne = ne;
      front[f.gid] = S.two || ne > 1e-9 ? 1 : 0;
    }
  }

  // ---------------------------------------------------------- occluders
  const oGid = [], oBox = [], oPl = [], oE0 = [], oNE = [], oZmin = [];
  const edges = [];
  const addOcc = (S, idx, gid) => {
    const P = S.P, n = idx.length;
    let area = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, zmin = Infinity;
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < n; i++) {
      const a = idx[i] * 3, b = idx[(i + 1) % n] * 3;
      const ax = P[a], ay = P[a + 1], az = P[a + 2], bx = P[b], by = P[b + 1], bz = P[b + 2];
      area += ax * by - bx * ay;
      nx += (ay - by) * (az + bz); ny += (az - bz) * (ax + bx); nz += (ax - bx) * (ay + by);
      if (ax < x0) x0 = ax; if (ax > x1) x1 = ax; if (ay < y0) y0 = ay; if (ay > y1) y1 = ay; if (az < zmin) zmin = az;
    }
    if (Math.abs(area) < 0.02) return;
    const nl = Math.hypot(nx, ny, nz);
    if (Math.abs(nz) < 1e-4 * nl) return;
    const p0 = idx[0] * 3;
    const A = -nx / nz, B = -ny / nz, C = (nx * P[p0] + ny * P[p0 + 1] + nz * P[p0 + 2]) / nz;
    const sgn = area > 0 ? 1 : -1;
    const e0 = edges.length;
    for (let i = 0; i < n; i++) {
      const a = idx[i] * 3, b = idx[(i + 1) % n] * 3;
      let ex = -(P[b + 1] - P[a + 1]) * sgn, ey = (P[b] - P[a]) * sgn;
      const l = Math.hypot(ex, ey);
      if (l < 1e-9) continue;
      ex /= l; ey /= l;
      edges.push(ex, ey, -(ex * P[a] + ey * P[a + 1]) + EXPAND);
    }
    oGid.push(gid); oBox.push(x0 - EXPAND, y0 - EXPAND, x1 + EXPAND, y1 + EXPAND);
    const slope = Math.hypot(A, B);
    oPl.push(A, B, C, Math.min(4, 0.35 + 0.45 * slope));
    oE0.push(e0 / 3); oNE.push((edges.length - e0) / 3); oZmin.push(zmin);
  };
  for (const S of solids) {
    if (S.noOcclude) continue;
    for (const f of S.F) {
      if (!front[f.gid]) continue;
      if (f.tris) for (const t of f.tris) addOcc(S, t, f.gid);
      else addOcc(S, f.v, f.gid);
    }
  }
  const nOcc = oGid.length;
  const OG = Int32Array.from(oGid), OB = Float64Array.from(oBox), OP = Float64Array.from(oPl);
  const OE = Int32Array.from(oE0), ON = Int32Array.from(oNE), OZ = Float64Array.from(oZmin);
  const ED = Float64Array.from(edges);

  // grid
  let gx0 = Infinity, gy0 = Infinity, gx1 = -Infinity, gy1 = -Infinity;
  for (let i = 0; i < nOcc; i++) {
    if (OB[i * 4] < gx0) gx0 = OB[i * 4]; if (OB[i * 4 + 1] < gy0) gy0 = OB[i * 4 + 1];
    if (OB[i * 4 + 2] > gx1) gx1 = OB[i * 4 + 2]; if (OB[i * 4 + 3] > gy1) gy1 = OB[i * 4 + 3];
  }
  if (!nOcc) { gx0 = gy0 = 0; gx1 = gy1 = 1; }
  const GW = Math.max(1, Math.ceil((gx1 - gx0) / CELL)), GH = Math.max(1, Math.ceil((gy1 - gy0) / CELL));
  const cnt = new Int32Array(GW * GH + 1);
  const cellRange = (i) => {
    const cx0 = Math.max(0, Math.floor((OB[i * 4] - gx0) / CELL)), cy0 = Math.max(0, Math.floor((OB[i * 4 + 1] - gy0) / CELL));
    const cx1 = Math.min(GW - 1, Math.floor((OB[i * 4 + 2] - gx0) / CELL)), cy1 = Math.min(GH - 1, Math.floor((OB[i * 4 + 3] - gy0) / CELL));
    return [cx0, cy0, cx1, cy1];
  };
  for (let i = 0; i < nOcc; i++) {
    const [cx0, cy0, cx1, cy1] = cellRange(i);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) cnt[cy * GW + cx + 1]++;
  }
  for (let i = 1; i <= GW * GH; i++) cnt[i] += cnt[i - 1];
  const cellStart = cnt.slice();
  const fill = cnt.slice();
  const cellList = new Int32Array(cnt[GW * GH]);
  for (let i = 0; i < nOcc; i++) {
    const [cx0, cy0, cx1, cy1] = cellRange(i);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) cellList[fill[cy * GW + cx]++] = i;
  }
  const stamp = new Int32Array(nOcc);
  let curStamp = 0;
  const t1 = performance.now();

  // ---------------------------------------------------------- output (joiner)
  const attrIds = new Map(), attrs = [];
  const attrOf = (w, pass, part, dash, nofit = false) => {
    const key = w + '|' + pass + '|' + part + '|' + (dash || '') + (nofit ? '|n' : '');
    let id = attrIds.get(key);
    if (id == null) { id = attrs.length; attrs.push({ w, pass, part, dash: dash || null, nofit }); attrIds.set(key, id); }
    return id;
  };
  const chains = []; // {attr, pts: []}
  const endMaps = [], startMaps = [];
  const Q = 16;
  const kxy = (x, y) => (Math.round(x * Q) + 1048576) * 2097152 + (Math.round(y * Q) + 1048576);
  let nPieces = 0;
  const emit = (a, x0, y0, x1, y1) => {
    nPieces++;
    let endMap = endMaps[a], startMap = startMaps[a];
    if (!endMap) { endMap = endMaps[a] = new Map(); startMap = startMaps[a] = new Map(); }
    const ks = kxy(x0, y0), ke = kxy(x1, y1);
    let ci = endMap.get(ks);
    if (ci != null) {
      const c = chains[ci];
      endMap.delete(ks);
      c.pts.push(x1, y1);
      if (!endMap.has(ke)) endMap.set(ke, ci);
      return;
    }
    ci = startMap.get(ke);
    if (ci != null) {
      const c = chains[ci];
      startMap.delete(ke);
      c.pts.unshift(x0, y0);
      if (!startMap.has(ks)) startMap.set(ks, ci);
      return;
    }
    ci = chains.length;
    chains.push({ attr: a, pts: [x0, y0, x1, y1] });
    if (!endMap.has(ke)) endMap.set(ke, ci);
    if (!startMap.has(ks)) startMap.set(ks, ci);
  };

  // ---------------------------------------------------------- the clipper
  const hid = new Float64Array(4096);
  let nSegIn = 0, nTests = 0;
  const skipBuf = [];
  // test one segment (screen coords with depth) against all occluders; emit visible parts
  const clip = (x0, y0, z0, x1, y1, z1, skip, a) => {
    nSegIn++;
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (L < 1e-6) return;
    if (L > CELL * 1.5) { // split long segments so each touches few cells
      const n = Math.ceil(L / (CELL * 1.5));
      for (let i = 0; i < n; i++) {
        const ta = i / n, tb = (i + 1) / n;
        clip1(x0 + (x1 - x0) * ta, y0 + (y1 - y0) * ta, z0 + (z1 - z0) * ta,
          x0 + (x1 - x0) * tb, y0 + (y1 - y0) * tb, z0 + (z1 - z0) * tb, skip, a);
      }
    } else clip1(x0, y0, z0, x1, y1, z1, skip, a);
  };
  const clip1 = (x0, y0, z0, x1, y1, z1, skip, a) => {
    let nh = 0;
    const bx0 = Math.min(x0, x1), bx1 = Math.max(x0, x1), by0 = Math.min(y0, y1), by1 = Math.max(y0, y1);
    const zmax = Math.max(z0, z1);
    const cx0 = Math.max(0, Math.floor((bx0 - gx0) / CELL)), cy0 = Math.max(0, Math.floor((by0 - gy0) / CELL));
    const cx1 = Math.min(GW - 1, Math.floor((bx1 - gx0) / CELL)), cy1 = Math.min(GH - 1, Math.floor((by1 - gy0) / CELL));
    curStamp++;
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
    let full = false;
    outer:
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const c = cy * GW + cx;
        for (let q = cellStart[c], qe = cellStart[c + 1]; q < qe; q++) {
          const o = cellList[q];
          if (stamp[o] === curStamp) continue;
          stamp[o] = curStamp;
          const b4 = o * 4;
          if (OZ[o] + OP[b4 + 3] >= zmax) continue;            // entirely behind
          if (OB[b4] > bx1 || OB[b4 + 2] < bx0 || OB[b4 + 1] > by1 || OB[b4 + 3] < by0) continue;
          const g = OG[o];
          if (skip !== null) {
            if (typeof skip === 'number') { if (g === skip) continue; }
            else { let s = false; for (let i = 0; i < skip.length; i++) if (skip[i] === g) { s = true; break; } if (s) continue; }
          }
          nTests++;
          // Cyrus-Beck
          let ta = 0, tb = 1;
          const e0 = OE[o], ne = ON[o];
          let ok = true;
          for (let i = 0; i < ne; i++) {
            const ei = (e0 + i) * 3;
            const nx = ED[ei], ny = ED[ei + 1], cc = ED[ei + 2];
            const f0 = nx * x0 + ny * y0 + cc, f1 = nx * x1 + ny * y1 + cc;
            if (f0 < 0) {
              if (f1 < 0) { ok = false; break; }
              const t = f0 / (f0 - f1); if (t > ta) ta = t;
            } else if (f1 < 0) {
              const t = f0 / (f0 - f1); if (t < tb) tb = t;
            }
            if (ta >= tb) { ok = false; break; }
          }
          if (!ok) continue;
          // depth: h(t) = seg z - plane z - bias; hidden where h > 0
          const A = OP[b4], B = OP[b4 + 1], C = OP[b4 + 2], bias = OP[b4 + 3];
          const h0 = z0 - (A * x0 + B * y0 + C) - bias;
          const hd = dz - (A * dx + B * dy);
          const ha = h0 + hd * ta, hb = h0 + hd * tb;
          if (ha <= 0 && hb <= 0) continue;
          let s0 = ta, s1 = tb;
          if (ha <= 0) s0 = ta + (tb - ta) * (ha / (ha - hb));
          else if (hb <= 0) s1 = ta + (tb - ta) * (ha / (ha - hb));
          if (s1 - s0 < 1e-9) continue;
          if (s0 <= 1e-9 && s1 >= 1 - 1e-9) { full = true; break outer; }
          if (nh < 4094) { hid[nh++] = s0; hid[nh++] = s1; }
        }
      }
    }
    if (full) return;
    const L = Math.hypot(dx, dy);
    if (nh === 0) { if (L >= MINPIECE) emit(a, x0, y0, x1, y1); return; }
    // sort intervals by start (insertion sort, few items)
    for (let i = 2; i < nh; i += 2) {
      const s = hid[i], t = hid[i + 1];
      let j = i - 2;
      while (j >= 0 && hid[j] > s) { hid[j + 2] = hid[j]; hid[j + 3] = hid[j + 1]; j -= 2; }
      hid[j + 2] = s; hid[j + 3] = t;
    }
    let cur = 0;
    for (let i = 0; i < nh; i += 2) {
      const s = hid[i], t = hid[i + 1];
      if (s > cur && (s - cur) * L >= MINPIECE) emit(a, x0 + dx * cur, y0 + dy * cur, x0 + dx * s, y0 + dy * s);
      if (t > cur) cur = t;
    }
    if (cur < 1 && (1 - cur) * L >= MINPIECE) emit(a, x0 + dx * cur, y0 + dy * cur, x1, y1);
  };
  const clipWorld = (ax, ay, az, bx, by, bz, skip, a) => {
    clip(ax * R0 + ay * R1 + az * R2, ax * U0 + ay * U1 + az * U2, ax * E0 + ay * E1 + az * E2,
      bx * R0 + by * R1 + bz * R2, bx * U0 + by * U1 + bz * U2, bx * E0 + by * E1 + bz * E2, skip, a);
  };
  const emitDirect = (ax, ay, az, bx, by, bz, a) => {
    emit(a, ax * R0 + ay * R1 + az * R2, ax * U0 + ay * U1 + az * U2, bx * R0 + by * R1 + bz * R2, bx * U0 + by * U1 + bz * U2);
  };

  // weight of a solid's line kinds, demoted on thin solids
  const weightFor = (S, w) => {
    const gp = S.girth * k;
    if (gp < 1.8) w = Math.min(w, 1);
    else if (gp < 4) w = Math.min(w, w === 3 ? 2 : 1);
    return Math.min(w, S.w);
  };

  // ---------------------------------------------------------- edges and contours
  let nEdges = 0, nCont = 0;
  for (const S of solids) {
    const V = S.V, F = S.F, nv = V.length / 3;
    // corner g values (vertex normal . e) per smooth group
    const acc = new Map();
    for (const f of F) {
      if (f.g < 0) continue;
      for (const vi of f.v) {
        const kk = vi * 4096 + (f.g & 4095);
        let s = acc.get(kk);
        if (!s) { s = [0, 0, 0]; acc.set(kk, s); }
        s[0] += f.n[0] * f.area; s[1] += f.n[1] * f.area; s[2] += f.n[2] * f.area;
      }
    }
    const cg = (f, vi) => {
      if (f.g < 0) return S.two ? 1 : f.ne;
      const s = acc.get(vi * 4096 + (f.g & 4095));
      const l = Math.hypot(s[0], s[1], s[2]) || 1;
      return (s[0] * e[0] + s[1] * e[1] + s[2] * e[2]) / l;
    };
    // vertex -> faces (for 1-ring skip sets)
    let vfaces = null;
    const ring1 = (fi) => {
      if (!vfaces) {
        vfaces = Array.from({ length: nv }, () => []);
        F.forEach((f, i) => { for (const v of f.v) vfaces[v].push(i); });
      }
      const set = new Set();
      for (const v of F[fi].v) for (const j of vfaces[v]) set.add(F[j].gid);
      return Array.from(set);
    };
    // edges
    const emap = new Map();
    for (let fi = 0; fi < F.length; fi++) {
      const f = F[fi], n = f.v.length;
      for (let i = 0; i < n; i++) {
        const a = f.v[i], b = f.v[(i + 1) % n];
        const kk = a < b ? a * nv + b : b * nv + a;
        const ex = emap.get(kk);
        if (ex) ex.push(fi); else emap.set(kk, [a < b ? a : b, a < b ? b : a, fi]);
      }
    }
    const aW3 = attrOf(weightFor(S, 3), S.pass, S.part, null, !!S.noFit);
    const aW2 = attrOf(weightFor(S, 2), S.pass, S.part, null, !!S.noFit);
    for (const ed of emap.values()) {
      const va = ed[0], vb = ed[1];
      const fa = F[ed[2]], fb = ed.length > 3 ? F[ed[3]] : null;
      if (fb && fa.g >= 0 && fa.g === fb.g) continue; // smooth: contour handles it
      const ax = V[va * 3], ay = V[va * 3 + 1], az = V[va * 3 + 2];
      const bx = V[vb * 3], by = V[vb * 3 + 1], bz = V[vb * 3 + 2];
      if (!fb) { // boundary
        nEdges++;
        clipWorld(ax, ay, az, bx, by, bz, fa.gid, aW3);
        continue;
      }
      // visible interval on each side
      const iv = [];
      for (const f of [fa, fb]) {
        if (S.two) { iv.push(0, 1); continue; }
        const ga = cg(f, va), gb = cg(f, vb);
        if (ga > 0 && gb > 0) iv.push(0, 1);
        else if (ga > 0) iv.push(0, ga / (ga - gb));
        else if (gb > 0) iv.push(ga / (ga - gb), 1);
      }
      if (!iv.length) continue;
      const sil = !S.two && ((fa.ne > 0) !== (fb.ne > 0));
      const att = sil ? aW3 : aW2;
      // union
      let s0 = iv[0], s1 = iv[1];
      if (iv.length > 2) {
        const p0 = iv[2], p1 = iv[3];
        if (p0 <= s1 + 1e-9 && p1 >= s0 - 1e-9) { s0 = Math.min(s0, p0); s1 = Math.max(s1, p1); }
        else {
          nEdges++;
          clipWorld(ax + (bx - ax) * p0, ay + (by - ay) * p0, az + (bz - az) * p0, ax + (bx - ax) * p1, ay + (by - ay) * p1, az + (bz - az) * p1, [fa.gid, fb.gid], att);
        }
      }
      if (s1 - s0 < 1e-9) continue;
      nEdges++;
      clipWorld(ax + (bx - ax) * s0, ay + (by - ay) * s0, az + (bz - az) * s0, ax + (bx - ax) * s1, ay + (by - ay) * s1, az + (bz - az) * s1, [fa.gid, fb.gid], att);
    }
    // contours on smooth groups
    const aC = attrOf(weightFor(S, 3), S.pass, S.part, null, !!S.noFit);
    for (let fi = 0; fi < F.length; fi++) {
      const f = F[fi];
      if (f.g < 0) continue;
      const n = f.v.length;
      let pos = 0, neg = 0;
      const gs = new Array(n);
      for (let i = 0; i < n; i++) { const g = cg(f, f.v[i]); gs[i] = g; if (g > 0) pos++; else neg++; }
      if (!pos || !neg) continue;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const g0 = gs[i], g1 = gs[(i + 1) % n];
        if ((g0 > 0) === (g1 > 0)) continue;
        const t = g0 / (g0 - g1);
        const a = f.v[i] * 3, b = f.v[(i + 1) % n] * 3;
        pts.push(V[a] + (V[b] - V[a]) * t, V[a + 1] + (V[b + 1] - V[a + 1]) * t, V[a + 2] + (V[b + 2] - V[a + 2]) * t);
      }
      if (pts.length < 6) continue;
      const skip = ring1(fi);
      for (let q = 0; q + 5 < pts.length; q += 6) {
        nCont++;
        clipWorld(pts[q], pts[q + 1], pts[q + 2], pts[q + 3], pts[q + 4], pts[q + 5], skip, aC);
      }
    }
  }

  // ---------------------------------------------------------- intersections
  let nSeam = 0;
  if (opt.seams !== false) {
    const cand = solids.filter((S) => S.isect && S.closed !== undefined);
    const order = cand.slice().sort((a, b) => a.bbox[0] - b.bbox[0]);
    for (const S of cand) {
      if (!S.fb) {
        S.fb = new Float64Array(S.F.length * 6);
        S.F.forEach((f, i) => {
          let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
          for (const v of f.v) {
            const x = S.V[v * 3], y = S.V[v * 3 + 1], z = S.V[v * 3 + 2];
            if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
          }
          S.fb.set([x0, y0, z0, x1, y1, z1], i * 6);
        });
      }
    }
    const ov = (a, b, ea = 1e-7) => a[0] <= b[3] + ea && a[3] >= b[0] - ea && a[1] <= b[4] + ea && a[4] >= b[1] - ea && a[2] <= b[5] + ea && a[5] >= b[2] - ea;
    for (let i = 0; i < order.length; i++) {
      const A = order[i];
      for (let j = i + 1; j < order.length; j++) {
        const B = order[j];
        if (B.bbox[0] > A.bbox[3]) break;
        if (!ov(A.bbox, B.bbox)) continue;
        if (A.noSeamWith && A.noSeamWith === B.noSeamWith) continue;
        const later = A.id > B.id ? A : B;
        const wA = Math.min(weightFor(A, 2), weightFor(B, 2));
        const att = attrOf(Math.max(1, wA), 1, later.part, null);
        nSeam += seams(A, B, front, (p, q, ga, gb) => clipWorld(p[0], p[1], p[2], q[0], q[1], q[2], [ga, gb], att));
      }
    }
  }

  // ---------------------------------------------------------- decor
  let nDecor = 0;
  for (const d of M.decor) {
    const pts = d.pts, n = pts.length / 3;
    const a = attrOf(d.w, d.pass, d.part, d.dash);
    const gid = d.gid;
    if (!d.nrm && gid >= 0 && !front[gid]) continue;
    for (let i = 0; i + 1 < n; i++) {
      let ax = pts[i * 3], ay = pts[i * 3 + 1], az = pts[i * 3 + 2];
      let bx = pts[i * 3 + 3], by = pts[i * 3 + 4], bz = pts[i * 3 + 5];
      if (d.nrm) {
        const N = d.nrm;
        const ga = N[i * 3] * e[0] + N[i * 3 + 1] * e[1] + N[i * 3 + 2] * e[2];
        const gb = N[i * 3 + 3] * e[0] + N[i * 3 + 4] * e[1] + N[i * 3 + 5] * e[2];
        if (ga <= 0 && gb <= 0) continue;
        if (ga <= 0) { const t = ga / (ga - gb); ax += (bx - ax) * t; ay += (by - ay) * t; az += (bz - az) * t; }
        else if (gb <= 0) { const t = ga / (ga - gb); bx = ax + (bx - ax) * t; by = ay + (by - ay) * t; bz = az + (bz - az) * t; }
      }
      nDecor++;
      clipWorld(ax, ay, az, bx, by, bz, gid >= 0 ? gid : null, a);
    }
  }
  // ---------------------------------------------------------- free lines
  for (const l of M.lines) {
    const pts = l.pts, n = pts.length / 3;
    const a = attrOf(l.w, l.pass, l.part, l.dash, !l.fit);
    for (let i = 0; i + 1 < n; i++) {
      if (l.occlude) clipWorld(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], pts[i * 3 + 3], pts[i * 3 + 4], pts[i * 3 + 5], l.skip, a);
      else emitDirect(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], pts[i * 3 + 3], pts[i * 3 + 4], pts[i * 3 + 5], a);
    }
  }
  const t2 = performance.now();

  // ---------------------------------------------------------- strokes
  const strokes = [];
  for (const c of chains) {
    const at = attrs[c.attr];
    const p = c.pts;
    let L = 0;
    for (let i = 2; i < p.length; i += 2) L += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]);
    const st = { pts: Float32Array.from(p), w: at.w, pass: at.pass, part: at.part, dash: at.dash, len: L };
    if (at.nofit) st.nofit = true;
    strokes.push(st);
  }

  // point visibility (callout anchors), in world coordinates
  const visible = (p, margin = 0.6) => {
    const x = p[0] * R0 + p[1] * R1 + p[2] * R2, y = p[0] * U0 + p[1] * U1 + p[2] * U2, z = p[0] * E0 + p[1] * E1 + p[2] * E2;
    const cx = Math.floor((x - gx0) / CELL), cy = Math.floor((y - gy0) / CELL);
    if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) return true;
    const c = cy * GW + cx;
    for (let q = cellStart[c]; q < cellStart[c + 1]; q++) {
      const o = cellList[q], b4 = o * 4;
      let inside = true;
      for (let i = 0; i < ON[o]; i++) {
        const ei = (OE[o] + i) * 3;
        if (ED[ei] * x + ED[ei + 1] * y + ED[ei + 2] < margin) { inside = false; break; }
      }
      if (!inside) continue;
      if (OP[b4] * x + OP[b4 + 1] * y + OP[b4 + 2] < z - OP[b4 + 3] - margin) return false;
    }
    return true;
  };
  const project = (p) => [p[0] * R0 + p[1] * R1 + p[2] * R2, p[0] * U0 + p[1] * U1 + p[2] * U2];

  return {
    strokes, visible, project,
    stats: {
      occluders: nOcc, segIn: nSegIn, tests: nTests, pieces: nPieces, edges: nEdges, contours: nCont, seams: nSeam,
      decor: nDecor, msSetup: t1 - t0, msClip: t2 - t1, msTotal: performance.now() - t0,
    },
  };
}

// face-face intersections between two solids; calls out(p, q, gidA, gidB) per segment
function seams(A, B, front, out) {
  let n = 0;
  const bb = B.bbox, ab = A.bbox;
  const fa = [], fbs = [];
  const ovb = (fb, i, box) => fb[i * 6] <= box[3] + 1e-7 && fb[i * 6 + 3] >= box[0] - 1e-7 && fb[i * 6 + 1] <= box[4] + 1e-7 && fb[i * 6 + 4] >= box[1] - 1e-7 && fb[i * 6 + 2] <= box[5] + 1e-7 && fb[i * 6 + 5] >= box[2] - 1e-7;
  for (let i = 0; i < A.F.length; i++) if ((A.two || front[A.F[i].gid]) && ovb(A.fb, i, bb)) fa.push(i);
  if (!fa.length) return 0;
  for (let i = 0; i < B.F.length; i++) if ((B.two || front[B.F[i].gid]) && ovb(B.fb, i, ab)) fbs.push(i);
  if (!fbs.length) return 0;
  const pieces = (S, f) => f.tris || [f.v];
  for (const i of fa) {
    const f = A.F[i];
    const bi = A.fb.subarray(i * 6, i * 6 + 6);
    for (const j of fbs) {
      const bj = B.fb;
      if (bj[j * 6] > bi[3] + 1e-7 || bj[j * 6 + 3] < bi[0] - 1e-7 || bj[j * 6 + 1] > bi[4] + 1e-7 || bj[j * 6 + 4] < bi[1] - 1e-7 || bj[j * 6 + 2] > bi[5] + 1e-7 || bj[j * 6 + 5] < bi[2] - 1e-7) continue;
      const g = B.F[j];
      // parallel planes: no seam
      const cx = f.n[1] * g.n[2] - f.n[2] * g.n[1], cy = f.n[2] * g.n[0] - f.n[0] * g.n[2], cz = f.n[0] * g.n[1] - f.n[1] * g.n[0];
      const cl = Math.hypot(cx, cy, cz);
      if (cl < 1e-6) continue;
      const dir = [cx / cl, cy / cl, cz / cl];
      for (const pa of pieces(A, f)) {
        const sa = cut(A.V, pa, g.n, g.d, dir);
        if (!sa) continue;
        for (const pb of pieces(B, g)) {
          const sb = cut(B.V, pb, f.n, f.d, dir);
          if (!sb) continue;
          const lo = Math.max(sa[0], sb[0]), hi = Math.min(sa[1], sb[1]);
          if (hi - lo < 1e-6) continue;
          // points on the line: use sa's parametrization
          const p = lerpLine(sa, lo), q = lerpLine(sa, hi);
          out(p, q, f.gid, g.gid);
          n++;
        }
      }
    }
  }
  return n;
}
// where a convex polygon crosses a plane: [tmin, tmax, P0, dir] along dir, or null if it
// only touches (all vertices on one side within eps)
function cut(V, idx, n, d, dir) {
  const m = idx.length;
  let pos = 0, neg = 0;
  const ds = new Array(m);
  for (let i = 0; i < m; i++) {
    const v = idx[i] * 3;
    const s = V[v] * n[0] + V[v + 1] * n[1] + V[v + 2] * n[2] - d;
    ds[i] = s;
    if (s > 1e-7) pos++; else if (s < -1e-7) neg++;
  }
  if (!pos || !neg) return null;
  let tmin = Infinity, tmax = -Infinity, base = null;
  for (let i = 0; i < m; i++) {
    const s0 = ds[i], s1 = ds[(i + 1) % m];
    if ((s0 > 0) === (s1 > 0)) continue;
    const t = s0 / (s0 - s1);
    const a = idx[i] * 3, b = idx[(i + 1) % m] * 3;
    const p = [V[a] + (V[b] - V[a]) * t, V[a + 1] + (V[b + 1] - V[a + 1]) * t, V[a + 2] + (V[b + 2] - V[a + 2]) * t];
    if (!base) base = p;
    const tt = (p[0] - base[0]) * dir[0] + (p[1] - base[1]) * dir[1] + (p[2] - base[2]) * dir[2];
    if (tt < tmin) tmin = tt; if (tt > tmax) tmax = tt;
  }
  if (!base) return null;
  // parametrize on a common origin: project base onto the line through origin? Use absolute
  // coordinate along dir so both polygons share it.
  const off = base[0] * dir[0] + base[1] * dir[1] + base[2] * dir[2];
  return [tmin + off, tmax + off, base, dir, off];
}
function lerpLine(s, t) {
  const [, , base, dir, off] = s;
  const d = t - off;
  return [base[0] + dir[0] * d, base[1] + dir[1] * d, base[2] + dir[2] * d];
}

// projected bounds of all solids and lines, at 1 px per meter
export function bounds(M) {
  const { r, u } = M.view;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y, z) => {
    const sx = x * r[0] + y * r[1] + z * r[2], sy = -(x * u[0] + y * u[1] + z * u[2]);
    if (sx < x0) x0 = sx; if (sx > x1) x1 = sx; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy;
  };
  for (const S of M.solids) { const V = S.V; for (let i = 0; i < V.length; i += 3) add(V[i], V[i + 1], V[i + 2]); }
  for (const l of M.lines) { if (l.pass === 0 || l.pass === 4 || !l.fit) continue; const p = l.pts; for (let i = 0; i < p.length; i += 3) add(p[i], p[i + 1], p[i + 2]); }
  return { x0, y0, x1, y1 };
}
