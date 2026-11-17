// kit.js: the shared parts kit and surface treatments. Every vehicle class draws from it,
// so the fleet reads as one hand. This comment is the whole API for writing a class.
//
// ============================================================== WRITING A VEHICLE CLASS
//
// A class is a module in classes/ that default-exports
//
//   export default {
//     id: 'lander', family: 'space',       // family: 'space' | 'ground' | 'rail' | 'air' | 'sea'
//     weight: 1,                           // how often fleet.js picks it
//     build(M) {                           // build the vehicle into the Model M, return its vocabulary
//       M.setView(M.pick([40, -40, 140, -140]) , 32);   // FIRST: azimuth (deg about Z), elevation
//       ...geometry and decor...
//       return {
//         place: 'LUNAR', job: 'SURVEY', form: 'LANDER',   // klass = PLACE JOB FORM (caps, <= 34 chars)
//         brief: 'Lands six crew and a helicopter on crater floors.',   // <= 78 chars, plain
//         specs: [['MASS', '38 T'], ['CREW', '6'], ['RANGE', '1 200 KM']],  // length/height added
//         float: false,          // true: fleet draws dashed drop lines and a ground footprint
//         figure: [x, y],        // optional ground spot for the scale figure (else automatic)
//         drops: [[x,y,z], ...], // with float: the points to drop lines from (else bbox corners)
//       };
//     },
//   };
//
// and is listed in fleet.js `classes`. build() runs twice per drawing with the same seed: a
// measuring pass (M.px === 0, decor off) and the drawing pass (M.px = meters per px on the
// sheet). Rules that follow from that:
//   - All randomness comes from M (M.r, M.ri, M.pick, M.chance, M.wpick, M.shuffle, M.rng).
//     Never Math.random. Draw the same random numbers in both passes: never call M.r etc.
//     inside `if (M.decorOn)` or `if (!M.tiny(...))` branches.
//   - Decor calls are free to make in both passes; they do nothing while M.decorOn is false.
//
// World: meters, +X forward (length), +Y left, +Z up, ground z = 0. Keep the vehicle
// roughly centered on the origin in x and y; it stands on z = 0 (or floats above it).
//
// ------------------------------------------------------------------ the Model M
// Random:     M.r(a, b) float, M.ri(a, b) int inclusive, M.chance(p), M.pick(arr),
//             M.wpick([[w, v], ...] | {v: w}), M.shuffle(arr), M.rng() raw [0, 1)
// View:       M.setView(az, el): az 25..65 either side of an axis (e.g. 40, -40, 140, 220),
//             el 22..40. The reference is about (45, 35). M.view.e is the unit vector toward
//             the viewer. Decide with it which sides are seen (dot(n, M.view.e) > 0).
// Paper:      M.px meters per px (0 in the measuring pass), M.ppm px per meter,
//             M.tiny(m, minPx = 1.5) true if a size in meters is under minPx on paper.
// Info:       M.info.mass = [x0,y0,z0,x1,y1,z1] world: the main mass (construction box, dims)
//             M.info.centers = [[a, b], ...] world: extra center lines (chain, pass 0), e.g. axles
// Transforms (all nest; fn's return value is passed through):
//             M.at(x, y, z, fn)         translate
//             M.rx/ry/rz(deg, fn)       rotate about a local axis; M.rot(axis | [x,y,z], deg, fn)
//             M.scale(sx, sy, sz, fn)   non-uniform scale (ellipsoids, oval hulls)
//             M.with({at, rz, ry, rx, s}, fn)  all at once, applied T * Rz * Ry * Rx * S
//             M.mirrorY(fn)             fn(+1) as is, then fn(-1) mirrored y -> -y (winding fixed)
//             M.mirrorX(fn)             same across the YZ plane
//             M.around(n, fn(i, deg))   n copies rotated about local z
//             M.along(a, b, fn(len))    frame at a with +x toward b, +z as near up as possible
//             M.onFace(face, x, y, fn)  frame at a face point: +x OUT of the face, +y along the
//                                       face's u (right seen from outside), +z along v (up on walls)
//             M.W([x,y,z])              local point -> world
// Parts:      M.part('LANDING LEG', fn) groups everything built inside (draw order, callouts)
// Callouts:   M.callout(label, qty, [x,y,z] local anchor on a visible surface, prio = 1)
//             label caps <= 22 chars. Same label again only adds an alternative anchor, so it
//             is safe inside mirrorY / around. The fleet keeps 5..9 with visible anchors,
//             highest prio first. Register 7..12 candidates.
// Solids (local frame; all return a solid S, see below):
//             M.box([x0,y0,z0], [x1,y1,z1], {chamfer})   faces '+x' '-x' '+y' '-y' '+z' '-z'
//             M.boxc([cx,cy,cz], [sx,sy,sz], o)          by center and size
//             M.extrude(profile2D, a, b, {plane})        concave ok. plane 'xy' (default, along z,
//                                                        caps '-z' '+z'), 'xz' (profile (x,z),
//                                                        along y, caps '-y' '+y'), 'yz' (profile
//                                                        (y,z), along x). sides 's0'..; {smoothDeg}
//                                                        makes sides meeting under that turn smooth
//             M.loft(polyA3D, polyB3D, o)                equal counts; B may collapse to a point
//             M.frustum(planA2D, zA, planB2D, zB, o)     loft between two plan polygons
//             M.lathe([[r,z], ...], {seg, a0, a1, axis: 'z'|'x'|'y', caps, open, loop, sharpDeg})
//                                                        open: two-sided, no caps (dish).
//                                                        loop: closed profile (torus, tire).
//             M.cyl(r, z0, z1, o), M.cone(r0, r1, z0, z1, o), M.sphere(r, o), M.capsule(r, z0, z1),
//             M.torus(R, r)                              (all lathes about local z; use o.axis)
//             M.tube(a, b, r, o)                         strut between two local points; shade
//                                                        lines on its dark side ({shade: false})
//             M.pipe([p0, p1, ...], r, o)                swept, mitered round pipe
//             M.plate(poly, o)                           flat two-sided polygon (2D at z=0 or 3D)
//   options on every solid: {isect: false} no seam lines where it cuts other solids;
//             {w: 2} cap its line weight; {girth} its thickness for weight (auto);
//             {decorOff: true}
// Lines:      M.line([[x,y,z], ...], {w: 1, pass: 2, dash: null|'dash'|'chain', occlude: true, fit: true})
//             fit: false for long wires (whip antennas) so they do not shrink the drawing
//             M.text3(str, origin, xdir, ydir, capHeight, {align, w, pass})  3D lettering as lines
//
// ------------------------------------------------------------------ a solid S
// S.f(name)   a planar face handle (or a no-op handle when the name does not exist):
//   box faces '+x' ..., extrude caps and 's0'..., loft 'a' 'b' 's0'..., lathe caps S.top S.bottom
// S.lat       on lathes: the surface in (angle deg, t 0..1 along the profile by arc length)
// S.V, S.F    raw vertices and faces, S.bbox [x0,y0,z0,x1,y1,z1] world
//
// ------------------------------------------------------------------ a face f (planar)
// 2D coordinates on the face in meters, origin at the center of the face's bounding box,
// u to the right as seen from outside, v up on walls (on decks u follows the solid's local x).
// f.w, f.h, f.box = [-w/2, -h/2, w/2, h/2], f.poly (outline), f.n f.u f.v (world), f.P(x, y)
// f.front: faces the viewer. f.tone: 0 lit .. 1 turned from the light (thin the hatch gaps
// with it). f.contains(x, y), f.holds(rect): inside the outline (chamfered or odd faces).
// f.pxOf(m) / f.mOf(px): paper size of a length and back.
// Face frames are world-based so text reads right on both sides of mirrorY; mirror x
// positions yourself with the side sign when placement must be symmetric.
// Decor (all chain, all no-ops in the measuring pass; o.w weight 0..3, o.pass):
//   f.line(x0,y0,x1,y1,o)  f.path([[x,y],...], {closed})  f.rect(x0,y0,x1,y1,o) or f.rect(r,o)
//   f.circle(cx,cy,r,{ry, rot, a0, a1})  f.ngon(cx,cy,r,n,rot,o)
//   f.hatch(rectOrPoly, {angle: 90, gap: 2.6 px, gap2: px at the far side, flip, holes: [...]})
//                          (always clipped to the face outline)
//   f.text(str, x, y, capH, {align, angle, upright})   stroke lettering lying in the face
//   f.rivets(x0,y0,x1,y1, {pitch: 7 px})
//   f.grid(n, m, {rect, gap: 2.2 px, xs: [cuts 0..1], ys})  -> panel rects [x0,y0,x1,y1] (.i .j)
// Surface on a lathe (S.lat): L.ring(t, {a0, a1}), L.meridian(a, t0, t1), L.shade({t0, t1,
//   gap, gapMax}) meridian shading denser away from the light, L.hatch(a0, a1, t0, t1, {gap})
//   dark glass of short meridians, L.port(a, t, radius),
//   L.shape(a, t, [[x,y],...], {closed}) a curve in meters around (a, t),
//   L.text(str, a, t, capH, {along}) (along: runs along the profile, e.g. on a tail boom),
//   L.at(a, t) -> {p, n}
//
// Line weights: 0 hairline (hatching), 1 fine (detail), 2 edge, 3 contour. Passes: 0
// construction, 1 structure (solid edges), 2 detail (decor), 3 hatching, 4 lettering and
// dimensions. Decor defaults: w 1 pass 2; hatch w 0 pass 3; text w 1 pass 4.
// Detail follows the paper: give gaps and pitches in px; skip what M.tiny() says is too small.
//
// ============================================================== THE KIT (import * as K)
// Every 3D part builds at the current frame's origin, +z up, and returns something useful.
// Surface treatments take (f, rect) and fill one panel.
//
// Treatments:  K.frame(f, r, {inset})      double-line panel frame
//              K.corrugated(f, r, {dir: 'v'|'h', gap})
//              K.plain(f, r)               plate with corner rivets
//              K.xWindow(f, r)             frame, X of flat bars, four dark triangular panes
//              K.octPort(f, r, {mullion: 'h'|'v'|'+'})   octagonal port, mullions, dark glass
//              K.porthole(f, cx, cy, rad)  round port with a bolt ring
//              K.louver(f, r)              short horizontal slats
//              K.accessHatch(f, r)         hatch with hinges and a handle
//              K.glass(f, poly, {gap, gap2, angle})       dark glass in any polygon
//              K.stencil(f, text, x, y, h, o)             stenciled lettering
//              K.fill(f, r, kind)          any of the above by name: 'corrugated', 'corrugatedH',
//                                          'plain', 'xWindow', 'octPort', 'porthole', 'louver',
//                                          'hatch', 'blank'
//              K.door(M, f, x, y, w, h, {platform, rail, side})  door on a face, sill at y - h/2;
//                                          platform: a fold-down 3D slab with railing and stays.
//                                          Returns {sill: [x,y,z] world of the platform's outer
//                                          edge center, or the door's sill}
// Structure:   K.collar(M, a, b, t, r)     ring around the strut a-b at t
//              K.ball(M, p, r)             ball joint
//              K.strut(M, a, b, r, {collars})  tube with collars near both ends
//              K.leg(M, {top: [p, q], foot, r, brace})  truss leg: two struts from hull points to
//                                          a foot, X bracing, collars, ball joint. Returns {foot}
//              K.footpad(M, {r})           disk with rim and radial ribs (at origin, on ground)
//              K.platform(M, {depth, width, stayH, inset})  the fold-down slab alone (+x out)
//              K.ladder(M, {h, w, gap})    rails and rungs from z = 0 up to h, in the local x = 0
//                                          plane, width along y. K.ladderAlong(M, a, b, {w})
//              K.railing(M, pts, {h, posts})  posts and two rails along a polyline
//              K.catwalk(M, {len, w, rail})   grating along +x with railing
//              K.stairs(M, {len, h, w})    a flight rising along +x
//              K.girder(M, a, b, {w, sec: 3|4, bay})   lattice boom between two points
//              K.ringGirder(M, {r, h, n})  ring truss around a round deck (z 0..h)
// Wheels:      K.wheel(M, {r, w, hub})     tire on local y axis, tread ticks, hub, bolt circle
//              (o.hubs: 'seen' builds the hub only on the side facing the viewer, false none)
//              K.twinWheel(M, {r, w})      K.bogie(M, {n, pitch, r})   K.rocker(M, {len, r})
//              K.track(M, {len, r, w})     stadium belt of links with grousers, road wheels and
//                                          drive sprocket; runs along x, centered, bottom at z = 0
// Equipment:   K.dish(M, {r, depth})  K.whip(M, {h})  K.radar(M, {len})  K.lamp(M, {r})
//              K.searchlight(M, {r})  K.horn(M, {r})
//              K.tankCapsule(M, {r, len, axis: 'x'})  K.tankSphere(M, {r, legs})
//              K.pipeRun(M, pts, r)   K.stack(M, {r, h})   K.bell(M, {r, len})
//              K.nozzles(M, {n, r, len})  K.solar(M, {w, h, cols, rows})  (panel with cell grid)
//              K.crane(M, {len, rise})  K.winch(M, {r, w})  K.crate(M, {s: [x,y,z]})
//              K.container(M, {len})  K.cupola(M, {r, h})  K.canopy(M, {len, w, h})
//              K.rotor(M, {r, blades})  K.propeller(M, {r, blades})  K.ductedFan(M, {r})
//              K.helipad(M, {r, t, mark})  deck disk with seams, a big H, edge lights and a ring
//                                          girder under the rim (top of deck at z = 0)
//              K.miniHeli(M, {len, reg})   small helicopter, skids at z = 0, nose toward +x
//              K.figure(M)                 the 1.75 m scale figure (the fleet places it)
//              K.dropLines(M, pts)         dashed drop lines to the ground for things that fly
// ======================================================================================

import { dot, norm, sub, add, mul, cross, lerp, len, D2R, circlePts } from './geom.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ------------------------------------------------------------------ surface treatments
export function frame(f, r, o = {}) {
  if (!f.on) return f;
  const ins = f.mOf(o.inset ?? 2.0);
  f.rect(r, { w: o.w ?? 1 });
  if (r[2] - r[0] > ins * 4 && r[3] - r[1] > ins * 4) f.rect(r[0] + ins, r[1] + ins, r[2] - ins, r[3] - ins, { w: o.w2 ?? 0 });
  return f;
}

export function corrugated(f, r, o = {}) {
  if (!f.on) return f;
  f.rect(r, { w: 1 });
  const ins = f.mOf(o.inset ?? 1.6);
  const inner = [r[0] + ins, r[1] + ins, r[2] - ins, r[3] - ins];
  if (inner[2] <= inner[0] || inner[3] <= inner[1]) return f;
  f.hatch(inner, { angle: o.dir === 'h' ? 0 : 90, gap: o.gap ?? (2.7 - 1.0 * f.tone), w: 0 });
  return f;
}

export function plain(f, r, o = {}) {
  if (!f.on) return f;
  frame(f, r, { inset: 1.8 });
  const d = f.mOf(4.2);
  const rr = f.mOf(0.6);
  if (f.pxOf(r[2] - r[0]) > 14) for (const [x, y] of [[r[0] + d, r[1] + d], [r[2] - d, r[1] + d], [r[2] - d, r[3] - d], [r[0] + d, r[3] - d]]) f.circle(x, y, rr, { n: 6 });
  if (o.diag) f.line(r[0], r[1], r[2], r[3], { w: 0 });
  if (f.tone > 0.35 && o.shade !== false) f.hatch([r[0] + f.mOf(2.5), r[1] + f.mOf(2.5), r[2] - f.mOf(2.5), r[3] - f.mOf(2.5)], { angle: 45, gap: 4.2 - 2.4 * f.tone, w: 0 });
  return f;
}

// dark glass in a polygon: dense hatch getting sparser toward one side
export function glass(f, poly, o = {}) {
  if (!f.on) return f;
  f.path(poly, { closed: true, w: 1 });
  f.hatch(poly, { angle: o.angle ?? 62, gap: o.gap ?? 0.85, gap2: o.gap2 ?? 1.9, flip: o.flip, w: 0 });
  if (o.cross !== false) f.hatch(poly, { angle: (o.angle ?? 62) - 75, gap: 1.6, gap2: 5, flip: o.flip, w: 0 });
  return f;
}

function insetTri(a, b, c, d) {
  const la = Math.hypot(b[0] - c[0], b[1] - c[1]), lb = Math.hypot(a[0] - c[0], a[1] - c[1]), lc = Math.hypot(a[0] - b[0], a[1] - b[1]);
  const p = la + lb + lc;
  const ix = (la * a[0] + lb * b[0] + lc * c[0]) / p, iy = (la * a[1] + lb * b[1] + lc * c[1]) / p;
  const s = p / 2;
  const area = Math.sqrt(Math.max(0, s * (s - la) * (s - lb) * (s - lc)));
  const rin = area / s;
  if (rin <= d) return null;
  const k = (rin - d) / rin;
  return [a, b, c].map((q) => [ix + (q[0] - ix) * k, iy + (q[1] - iy) * k]);
}

function roundRect(x0, y0, x1, y1, rad, n = 3) {
  const out = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = (a0 + 90 * i / n) * D2R; out.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } };
  corner(x1 - rad, y0 + rad, -90); corner(x1 - rad, y1 - rad, 0); corner(x0 + rad, y1 - rad, 90); corner(x0 + rad, y0 + rad, 180);
  return out;
}

export function xWindow(f, r, o = {}) {
  if (!f.on) return f;
  const W = r[2] - r[0], H = r[3] - r[1];
  if (f.pxOf(Math.min(W, H)) < 10) return corrugated(f, r);
  f.rect(r, { w: 1 });
  const fr = Math.min(W, H) * 0.12;
  const x0 = r[0] + fr, y0 = r[1] + fr, x1 = r[2] - fr, y1 = r[3] - fr;
  const rad = Math.min(W, H) * 0.07;
  f.path(roundRect(x0, y0, x1, y1, rad), { closed: true, w: 1 });
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const bar = Math.min(W, H) * 0.075;
  const tris = [
    [[x0, y1], [x1, y1], [cx, cy]], [[x1, y1], [x1, y0], [cx, cy]],
    [[x1, y0], [x0, y0], [cx, cy]], [[x0, y0], [x0, y1], [cx, cy]],
  ];
  const flip = !!o.flip;
  tris.forEach((t, i) => {
    const q = insetTri(t[0], t[1], t[2], bar);
    if (!q) return;
    glass(f, q, { angle: i % 2 ? 20 : 70, flip: i >= 2 !== flip });
  });
  // bolts at the X crossing and the bar ends
  if (f.pxOf(bar) > 2.5) f.circle(cx, cy, bar * 0.35, { n: 8 });
  return f;
}

export function octPort(f, r, o = {}) {
  if (!f.on) return f;
  const W = r[2] - r[0], H = r[3] - r[1];
  if (f.pxOf(Math.min(W, H)) < 10) return plain(f, r);
  f.rect(r, { w: 1 });
  const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
  const hw = W * 0.4, hh = H * 0.42, c = Math.min(hw, hh) * 0.42;
  const oct = (a, b, cc) => [[cx - a + cc, cy - b], [cx + a - cc, cy - b], [cx + a, cy - b + cc], [cx + a, cy + b - cc], [cx + a - cc, cy + b], [cx - a + cc, cy + b], [cx - a, cy + b - cc], [cx - a, cy - b + cc]];
  f.path(oct(hw, hh, c), { closed: true, w: 1 });
  const fr = Math.min(W, H) * 0.07;
  const ia = hw - fr, ib = hh - fr, ic = c * 0.8;
  const inner = oct(ia, ib, ic);
  f.path(inner, { closed: true, w: 1 });
  const m = o.mullion || 'h';
  const bw = Math.min(W, H) * 0.035;
  // panes: split the inner octagon by mullions, hatch each pane (clip by holes = bars)
  const holes = [];
  if (m === 'h' || m === '+') holes.push([cx - ia - 1, cy - bw, cx + ia + 1, cy + bw]);
  if (m === 'v' || m === '+' || m === 'h') holes.push([cx - bw, m === 'h' ? cy - ib - 1 : cy - ib - 1, cx + bw, m === 'h' ? cy + bw : cy + ib + 1]);
  for (const h of holes) {
    const hr = [Math.max(h[0], cx - ia), Math.max(h[1], cy - ib), Math.min(h[2], cx + ia), Math.min(h[3], cy + ib)];
    f.rect(hr, { w: 1 });
  }
  f.hatch(inner, { angle: 68, gap: 0.85, gap2: 2.0, holes, w: 0, flip: o.flip });
  f.hatch(inner, { angle: -10, gap: 1.6, gap2: 5, holes, w: 0, flip: o.flip });
  return f;
}

export function porthole(f, cx, cy, rad, o = {}) {
  if (!f.on) return f;
  if (f.pxOf(rad) < 3) return f;
  f.circle(cx, cy, rad, { w: 1 });
  const ri = rad * 0.72;
  f.circle(cx, cy, ri, { w: 1 });
  const nb = f.pxOf(rad) > 9 ? 8 : 0;
  for (let i = 0; i < nb; i++) { const a = (i + 0.5) * 2 * Math.PI / nb; f.circle(cx + Math.cos(a) * rad * 0.86, cy + Math.sin(a) * rad * 0.86, rad * 0.05, { n: 5 }); }
  const g = circlePts(cx, cy, ri * 0.93, ri * 0.93, 24);
  f.hatch(g, { angle: 60, gap: 0.85, gap2: 2.0, w: 0, flip: o.flip });
  f.hatch(g, { angle: -15, gap: 1.6, gap2: 5, w: 0, flip: o.flip });
  return f;
}

export function louver(f, r, o = {}) {
  if (!f.on) return f;
  frame(f, r, { inset: 1.6 });
  const ins = f.mOf(3.5);
  const x0 = r[0] + ins, x1 = r[2] - ins;
  const pitch = Math.max(f.mOf(4.5), (r[3] - r[1]) / 40);
  const sl = f.mOf(1.6);
  for (let y = r[3] - ins - sl; y > r[1] + ins; y -= pitch) {
    f.line(x0, y, x1, y, { w: 1 });
    f.hatch([x0, y - sl, x1, y], { angle: 0, gap: 0.9, w: 0 });
  }
  return f;
}

export function accessHatch(f, r, o = {}) {
  if (!f.on) return f;
  const W = r[2] - r[0], H = r[3] - r[1];
  f.rect(r, { w: 1 });
  const m = Math.min(W, H) * 0.12;
  const rr = [r[0] + m, r[1] + m, r[2] - m, r[3] - m];
  f.path(roundRect(rr[0], rr[1], rr[2], rr[3], Math.min(W, H) * 0.08), { closed: true, w: 1 });
  const hx = rr[0] + (rr[2] - rr[0]) * 0.04;
  const hl = H * 0.12, hw = W * 0.06;
  for (const t of [0.22, 0.78]) { const y = rr[1] + (rr[3] - rr[1]) * t; f.rect(hx - hw, y - hl / 2, hx + hw, y + hl / 2, { w: 1 }); }
  const kx = rr[2] - W * 0.12, ky = (rr[1] + rr[3]) / 2;
  f.rect(kx - W * 0.025, ky - H * 0.12, kx + W * 0.025, ky + H * 0.12, { w: 1 });
  if (!o.noRivets) f.rivets(rr[0] + m * 0.5, rr[1] + m * 0.5, rr[2] - m * 0.5, rr[1] + m * 0.5, { pitch: 6 });
  return f;
}

export function stencil(f, text, x, y, h, o = {}) {
  return f.text(text, x, y, h, { w: 1, pass: 4, ...o });
}

export function fill(f, r, kind, o = {}) {
  switch (kind) {
    case 'corrugated': return corrugated(f, r, { dir: 'v' });
    case 'corrugatedH': return corrugated(f, r, { dir: 'h' });
    case 'plain': return plain(f, r);
    case 'xWindow': return xWindow(f, r, o);
    case 'octPort': return octPort(f, r, o);
    case 'porthole': { frame(f, r, { inset: 1.6 }); return porthole(f, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, Math.min(r[2] - r[0], r[3] - r[1]) * 0.32, o); }
    case 'louver': return louver(f, r);
    case 'hatch': return accessHatch(f, r);
    case 'blank': return f.rect(r, { w: 1 });
    default: return f;
  }
}

// ------------------------------------------------------------------ structure
export function collar(M, a, b, t, r, o = {}) {
  const d = sub(b, a), L = len(d);
  if (!L) return;
  const l = o.len ?? r * 2.4;
  const c = lerp(a, b, t);
  const u = mul(d, 1 / L);
  return M.tube(sub(c, mul(u, l / 2)), add(c, mul(u, l / 2)), r * (o.k ?? 1.45), { isect: false });
}

export function ball(M, p, r) {
  return M.at(p[0], p[1], p[2], () => M.sphere(r, { isect: false }));
}

export function strut(M, a, b, r, o = {}) {
  const S = M.tube(a, b, r, o);
  const L = len(sub(b, a));
  if (o.collars !== false && L > r * 10) {
    const t = Math.min(0.3, (r * 5) / L);
    collar(M, a, b, t, r);
    collar(M, a, b, 1 - t, r);
    if (o.mid) collar(M, a, b, 0.5, r);
  }
  return S;
}

// truss leg from two hull points (top: [p, q]) to a foot point; X bracing between
export function leg(M, o) {
  const [p, q] = o.top, foot = o.foot, r = o.r ?? 0.14;
  const knee = o.knee ?? 0.55;
  const k = lerp(p, foot, knee);
  strut(M, p, foot, r * 1.15, { collars: true, mid: true });
  strut(M, q, k, r, { collars: false });
  if (o.brace !== false) {
    // X bracing in the triangle p, q, k
    const a1 = lerp(p, k, 0.12), b1 = lerp(q, k, 0.7), a2 = lerp(p, k, 0.7), b2 = lerp(q, k, 0.12);
    M.tube(a1, b1, r * 0.5, { isect: false });
    M.tube(a2, b2, r * 0.5, { isect: false });
    collar(M, a1, b1, 0.5, r * 0.5, { len: r * 1.4 });
  }
  // knee and top joints
  ball(M, k, r * 1.45);
  for (const t of [p, q]) M.at(t[0], t[1], t[2], () => M.sphere(r * 1.35, { isect: true }));
  return { foot, knee: k };
}

export function footpad(M, o = {}) {
  const R = o.r ?? 1.1, t = R * 0.12;
  const S = M.lathe([[R * 0.82, 0], [R, t * 0.35], [R, t * 0.75], [R * 0.86, t], [R * 0.3, t * 1.6], [R * 0.12, t * 2.5]], { sharpDeg: 20 });
  if (M.decorOn) {
    const L = S.lat;
    L.ring(0.5, { w: 1 });
    // radial ribs as lines on the cone
    const ribs = 8;
    for (let i = 0; i < ribs; i++) L.meridian(i * 360 / ribs + 22.5, 0.45, 0.92, { w: 1 });
  }
  // center socket and ball
  M.cyl(R * 0.2, t * 1.6, t * 4.2, { isect: false });
  M.at(0, 0, t * 4.6, () => M.sphere(R * 0.17));
  return S;
}

export function ladder(M, o = {}) {
  const h = o.h ?? 3, w = o.w ?? 0.5, gap = o.gap ?? 0.32, r = o.r ?? 0.035;
  M.tube([0, -w / 2, 0], [0, -w / 2, h], r, { isect: false });
  M.tube([0, w / 2, 0], [0, w / 2, h], r, { isect: false });
  for (let z = gap; z < h - 0.05; z += gap) M.tube([0, -w / 2, z], [0, w / 2, z], r * 0.7, { isect: false, caps: true });
}
export function ladderAlong(M, a, b, o = {}) {
  return M.along(a, b, (L) => M.ry(90, () => ladder(M, { ...o, h: L })));
}

export function railing(M, pts, o = {}) {
  const h = o.h ?? 1.0, r = o.r ?? 0.03;
  const top = pts.map((p) => [p[0], p[1], p[2] + h]);
  const mid = pts.map((p) => [p[0], p[1], p[2] + h * 0.5]);
  M.pipe(top, r, { isect: false });
  M.pipe(mid, r * 0.8, { isect: false });
  const pitch = o.posts ?? 1.4;
  for (let i = 0; i < pts.length; i++) {
    M.tube(pts[i], top[i], r, { isect: false });
    if (i + 1 < pts.length) {
      const L = len(sub(pts[i + 1], pts[i]));
      const n = Math.floor(L / pitch);
      for (let k = 1; k < n; k++) { const p = lerp(pts[i], pts[i + 1], k / n); M.tube(p, [p[0], p[1], p[2] + h], r * 0.9, { isect: false }); }
    }
  }
}

function grating(f, r) {
  if (!f.on) return;
  f.hatch(r, { angle: 0, gap: 2.4, w: 0 });
  f.hatch(r, { angle: 90, gap: 2.4, w: 0 });
}

export function catwalk(M, o = {}) {
  const L = o.len ?? 4, w = o.w ?? 1, t = o.t ?? 0.08;
  const S = M.box([0, -w / 2, -t], [L, w / 2, 0]);
  const f = S.f('+z');
  if (f.on) { const ins = f.mOf(2); grating(f, [-f.w / 2 + ins, -f.h / 2 + ins, f.w / 2 - ins, f.h / 2 - ins]); }
  if (o.rail !== false) for (const s of o.sides || [1, -1]) railing(M, [[0, s * w / 2, 0], [L, s * w / 2, 0]], { h: 0.9 });
  return S;
}

export function stairs(M, o = {}) {
  const L = o.len ?? 3, h = o.h ?? 2, w = o.w ?? 0.8;
  const n = Math.max(3, Math.round(h / 0.22));
  for (let i = 0; i < n; i++) {
    const x = L * i / n, z = h * (i + 1) / n;
    M.box([x, -w / 2, z - 0.04], [x + L / n + 0.05, w / 2, z], { isect: false });
  }
  for (const s of [-1, 1]) {
    M.extrude([[0, 0], [L, h - 0.18], [L, h + 0.06], [0, 0.24]], s * w / 2, s * (w / 2 + 0.05), { plane: 'xz' });
  }
  if (o.rail !== false) railing(M, [[0, w / 2 + 0.03, 0.2], [L, w / 2 + 0.03, h]], { h: 0.9 });
}

// lattice boom between a and b; section 3 (triangle) or 4 (square), width w
export function girder(M, a, b, o = {}) {
  const w = o.w ?? 0.6, sec = o.sec ?? 4, r = o.r ?? w * 0.06;
  return M.along(a, b, (L) => {
    const corners = [];
    for (let i = 0; i < sec; i++) {
      const ang = (i + 0.5) * 2 * Math.PI / sec + (sec === 3 ? Math.PI / 6 : 0);
      corners.push([Math.cos(ang) * w / Math.SQRT2, Math.sin(ang) * w / Math.SQRT2]);
    }
    for (const c of corners) M.tube([0, c[0], c[1]], [L, c[0], c[1]], r, { isect: false });
    const bay = o.bay ?? w * 1.1;
    const n = Math.max(1, Math.round(L / bay));
    for (let k = 0; k < n; k++) {
      const x0 = L * k / n, x1 = L * (k + 1) / n;
      for (let i = 0; i < sec; i++) {
        const c0 = corners[i], c1 = corners[(i + 1) % sec];
        const flip = (k + i) % 2 === 0;
        M.tube([flip ? x0 : x1, c0[0], c0[1]], [flip ? x1 : x0, c1[0], c1[1]], r * 0.6, { isect: false });
        if (k === 0 || o.battens) M.tube([x0, c0[0], c0[1]], [x0, c1[0], c1[1]], r * 0.6, { isect: false });
      }
    }
    for (let i = 0; i < sec; i++) { const c0 = corners[i], c1 = corners[(i + 1) % sec]; M.tube([L, c0[0], c0[1]], [L, c1[0], c1[1]], r * 0.6, { isect: false }); }
    return L;
  });
}

// ring truss: top and bottom polygonal chords at radius r, zigzag diagonals, z 0..h
export function ringGirder(M, o = {}) {
  const R = o.r ?? 5, h = o.h ?? 0.6, n = o.n ?? 32, rr = o.tr ?? h * 0.07;
  const inner = o.inner ?? R - h * 0.8;
  const top = [], bot = [], bin = [];
  for (let i = 0; i <= n; i++) {
    const a = 2 * Math.PI * i / n;
    top.push([Math.cos(a) * R, Math.sin(a) * R, 0]);
    bot.push([Math.cos(a) * R, Math.sin(a) * R, -h]);
    bin.push([Math.cos(a) * inner, Math.sin(a) * inner, -h * 0.98]);
  }
  M.pipe(top, rr, { isect: false, smoothBends: true });
  M.pipe(bot, rr, { isect: false, smoothBends: true });
  for (let i = 0; i < n; i++) {
    const a = i % 2 ? top[i] : bot[i], b = i % 2 ? bot[i + 1] : top[i + 1];
    M.tube(a, b, rr * 0.7, { isect: false });
    M.tube(top[i], bot[i], rr * 0.7, { isect: false });
    M.tube(bot[i], bin[i], rr * 0.6, { isect: false });
    M.tube(top[i], bin[i], rr * 0.6, { isect: false });
  }
}

// ------------------------------------------------------------------ wheels and tracks
// tire about the local y axis, centered at the origin
export function wheel(M, o = {}) {
  const R = o.r ?? 0.6, W = o.w ?? R * 0.6, hub = o.hub ?? R * 0.55;
  const rr = W * 0.22;
  const prof = [];
  const steps = 4;
  // rounded rectangle profile (r, z) for the tire, loop
  const add2 = (cr, cz, a0) => { for (let i = 0; i <= steps; i++) { const a = (a0 + 90 * i / steps) * D2R; prof.push([cr + Math.cos(a) * rr, cz + Math.sin(a) * rr]); } };
  add2(R - rr, -W / 2 + rr, -90); add2(R - rr, W / 2 - rr, 0);
  prof.push([hub, W / 2 * 0.86], [hub, -W / 2 * 0.86]);
  const S = M.rx(-90, () => M.lathe(prof, { loop: true, sharpDeg: 50 }));
  if (M.decorOn) {
    const L = S.lat;
    const n = Math.max(12, Math.min(48, Math.round(M.ppm * R * 2 * Math.PI / 7)));
    // tread ticks across the crown
    const t0 = (steps + 1) / prof.length * 0.6, t1 = t0 + (1 / prof.length) * 1.6;
    for (let i = 0; i < n; i++) L.meridian(i * 360 / n, 0.12, 0.26, { w: 1 });
    void t1;
    // sidewall ring
    L.ring(0.62, { w: 1 });
  }
  // hub: a disk on each side with bolt circle (o.hubs 'seen': only on the side facing the viewer)
  const ya = sub(M.W([0, 1, 0]), M.W([0, 0, 0]));
  const seenS = dot(ya, M.view.e) >= 0 ? 1 : -1;
  for (const s of [1, -1]) {
    if ((o.hubs === 'seen' && s !== seenS) || o.hubs === false) continue;
    const H = M.rx(-90 * s, () => M.cyl(hub * 0.92, W / 2 * 0.86 - 0.01, W / 2 * 0.86 + R * 0.06, { isect: false }));
    const cap = M.rx(-90 * s, () => M.cyl(hub * 0.38, W / 2 * 0.86, W / 2 * 0.86 + R * 0.14, { isect: false }));
    if (M.decorOn) {
      const f = H.top;
      if (f.ok) {
        f.circle(0, 0, hub * 0.7, { w: 1 });
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; f.circle(Math.cos(a) * hub * 0.55, Math.sin(a) * hub * 0.55, hub * 0.05, { n: 6 }); }
      }
      if (cap.top.ok) cap.top.circle(0, 0, hub * 0.2, { w: 1 });
    }
  }
  return S;
}
export function twinWheel(M, o = {}) {
  const W = o.w ?? 0.4;
  M.at(0, W * 0.56, 0, () => wheel(M, { ...o, w: W }));
  M.at(0, -W * 0.56, 0, () => wheel(M, { ...o, w: W }));
}
// a bogie along x: n wheels on both sides (track gauge g), side frames
export function bogie(M, o = {}) {
  const n = o.n ?? 2, p = o.pitch ?? 1.8, R = o.r ?? 0.45, g = o.gauge ?? 1.5;
  const x0 = -(n - 1) * p / 2;
  for (const s of [1, -1]) {
    for (let i = 0; i < n; i++) M.at(x0 + i * p, s * g / 2, 0, () => wheel(M, { r: R, w: R * 0.35, hub: R * 0.5 }));
    const fy = s * (g / 2 + R * 0.35);
    M.extrude([[x0 - R * 0.9, -R * 0.15], [-x0 + R * 0.9, -R * 0.15], [-x0 + R * 0.7, R * 0.45], [x0 - R * 0.7, R * 0.45]], fy, fy + s * R * 0.14, { plane: 'xz' });
    for (let i = 0; i < n; i++) M.boxc([x0 + i * p, fy + s * R * 0.16, 0], [R * 0.5, R * 0.18, R * 0.5]);
    // springs
    for (let i = 0; i < n; i++) M.cyl(R * 0.12, R * 0.3, R * 0.75, {}) && null;
  }
  M.boxc([0, 0, R * 0.55], [Math.max(0.6, (n - 1) * p * 0.4), g + R * 0.5, R * 0.3]);
}
export function rocker(M, o = {}) {
  const L = o.len ?? 2, R = o.r ?? 0.45;
  M.mirrorX(() => M.at(L / 2, 0, 0, () => wheel(M, { r: R, w: R * 0.6 })));
  M.extrude([[-L / 2, -R * 0.12], [L / 2, -R * 0.12], [L * 0.15, R * 0.9], [-L * 0.15, R * 0.9]], R * 0.5, R * 0.62, { plane: 'xz' });
  M.at(0, R * 0.62, R * 0.6, () => M.rx(-90, () => M.cyl(R * 0.2, 0, R * 0.12)));
}
// tracked running gear along x, centered at the origin, ground at z = 0, belt width w (y)
export function track(M, o = {}) {
  const L = o.len ?? 4.5, R = o.r ?? 0.55, W = o.w ?? 0.5, t = o.t ?? 0.07;
  const x0 = -L / 2 + R, x1 = L / 2 - R;
  // stadium path at the belt's center line
  const path = [];
  const nA = 10;
  for (let i = 0; i <= nA; i++) { const a = (-90 + 180 * i / nA) * D2R; path.push([x1 + Math.cos(a) * R, R + Math.sin(a) * R]); }
  for (let i = 0; i <= nA; i++) { const a = (90 + 180 * i / nA) * D2R; path.push([x0 + Math.cos(a) * R, R + Math.sin(a) * R]); }
  // links: thin boxes along the path
  const per = [];
  let total = 0;
  for (let i = 0; i < path.length; i++) { const a = path[i], b = path[(i + 1) % path.length]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); per.push(l); total += l; }
  const pitch = o.pitch ?? 0.22;
  const n = Math.round(total / pitch);
  const at = (s) => {
    s = ((s % total) + total) % total;
    for (let i = 0; i < path.length; i++) { if (s <= per[i]) { const a = path[i], b = path[(i + 1) % path.length]; const f = s / per[i]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; } s -= per[i]; }
    return path[0];
  };
  for (let i = 0; i < n; i++) {
    const a = at(total * i / n + 0.005), b = at(total * (i + 1) / n - 0.005);
    M.along([a[0], 0, a[1]], [b[0], 0, b[1]], (l) => {
      const S = M.box([0, -t / 2, -W / 2], [l, t / 2, W / 2], { isect: false });
      // grouser on the outside (local -z after along? outside is to the right of travel)
      return S;
    }, [0, 1, 0]);
  }
  // road wheels, idler, sprocket inside the loop
  const nw = Math.max(3, Math.round((x1 - x0) / (R * 1.1)) + 1);
  for (let i = 0; i < nw; i++) M.at(x0 + (x1 - x0) * i / (nw - 1), 0, R * 0.62, () => wheel(M, { r: R * 0.55, w: W * 0.8, hub: R * 0.3, hubs: 'seen' }));
  M.at(x1, 0, R, () => sprocket(M, R * 0.86, W * 0.7));
  M.at(x0, 0, R, () => wheel(M, { r: R * 0.82, w: W * 0.8, hub: R * 0.4, hubs: 'seen' }));
  for (let i = 1; i < 3; i++) M.at(x0 + (x1 - x0) * i / 3, 0, 2 * R - t * 1.5, () => wheel(M, { r: R * 0.2, w: W * 0.4, hub: R * 0.1, hubs: 'seen' }));
}
function sprocket(M, R, W) {
  const n = 12, prof = [];
  for (let i = 0; i < n * 2; i++) { const a = Math.PI * i / n; const r = i % 2 ? R : R * 0.84; prof.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const S = M.extrude(prof, -W / 2, W / 2, { plane: 'xz' });
  for (const s of [1, -1]) M.at(0, s * W / 2, 0, () => M.rx(-90 * s, () => M.cyl(R * 0.4, 0, R * 0.12)));
  return S;
}

// ------------------------------------------------------------------ equipment
export function dish(M, o = {}) {
  const R = o.r ?? 1.2, D = o.depth ?? R * 0.32;
  const prof = [];
  const n = 8;
  for (let i = 0; i <= n; i++) { const r = R * i / n; prof.push([r, D * (r / R) ** 2]); }
  prof[0][0] = 0;
  const S = M.lathe(prof, { open: true, minSeg: 20 });
  if (M.decorOn) { const L = S.lat; L.ring(0.55, { w: 0 }); L.ring(0.85, { w: 0 }); L.shade({ t0: 0.05, t1: 0.98, gap: 1.8 }); }
  M.at(0, 0, D, () => M.torus(R, R * 0.025, { isect: false }));
  // feed: three struts to the horn
  const fz = R * 0.75;
  for (let i = 0; i < 3; i++) { const a = i * 2 * Math.PI / 3; M.tube([Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, D * 0.92], [0, 0, fz], R * 0.018, { isect: false }); }
  M.cone(R * 0.05, R * 0.1, fz - R * 0.12, fz + 0.02);
  // back structure
  M.cone(R * 0.25, R * 0.08, -R * 0.2, D * 0.06);
  return S;
}
// dish on an az-el mount; returns nothing. el in degrees (0 = looking at horizon)
export function dishMount(M, o = {}) {
  const R = o.r ?? 1.2, el = o.el ?? 45, az = o.az ?? 0;
  M.cyl(R * 0.3, 0, R * 0.25);
  M.rz(az, () => {
    for (const s of [1, -1]) M.boxc([0, s * R * 0.42, R * 0.6], [R * 0.25, R * 0.08, R * 0.8]);
    M.at(0, 0, R * 0.9, () => M.ry(90 - el, () => dish(M, o)));
  });
}
export function whip(M, o = {}) {
  const h = o.h ?? 4;
  M.cyl(0.06, 0, 0.18);
  M.cyl(0.035, 0.18, 0.5);
  const tip = o.lean ? [h * Math.sin(o.lean * D2R), 0, h * Math.cos(o.lean * D2R)] : [0, 0, h];
  M.line([[0, 0, 0.5], tip], { w: 1, pass: 1, fit: false });
  return tip;
}
export function radar(M, o = {}) {
  const L = o.len ?? 2.4, h = L * 0.12;
  M.cyl(L * 0.06, 0, L * 0.14);
  const S = M.boxc([0, 0, L * 0.14 + h / 2 + 0.05], [L * 0.1, L, h]);
  for (const k of ['+x', '-x']) {
    const f = S.f(k);
    if (f.on) { const n = Math.max(4, Math.floor(f.pxOf(f.w) / 5)); for (let i = 1; i < n; i++) { const x = -f.w / 2 + f.w * i / n; f.line(x, -f.h * 0.3, x, f.h * 0.3, { w: 0 }); } }
  }
  M.boxc([0, 0, L * 0.14 + 0.025], [L * 0.08, L * 0.25, 0.05]);
}
export function lamp(M, o = {}) {
  const r = o.r ?? 0.12;
  M.ry(90, () => {
    const S = M.cyl(r, 0, r * 1.4);
    const C = M.cyl(r * 1.1, r * 1.4, r * 1.6);
    if (C.top.ok) { C.top.circle(0, 0, r * 0.75, { w: 1 }); C.top.hatch(circlePts(0, 0, r * 0.7, r * 0.7, 16), { angle: 60, gap: 1.6, w: 0 }); }
    return S;
  });
  M.boxc([-r * 0.6, 0, -r * 1.2], [r * 0.3, r * 0.3, r * 1.4]);
}
export function searchlight(M, o = {}) {
  const r = o.r ?? 0.3;
  M.cyl(r * 0.5, 0, r * 0.3);
  for (const s of [1, -1]) M.boxc([0, s * r * 1.15, r * 0.9], [r * 0.3, r * 0.1, r * 1.3]);
  M.at(0, 0, r * 1.3, () => M.ry(80, () => {
    M.cyl(r, -r * 0.8, r * 0.6);
    const C = M.cyl(r * 1.08, r * 0.6, r * 0.72);
    if (C.top.ok) { const f = C.top; f.circle(0, 0, r * 0.85, { w: 1 }); for (let i = -2; i <= 2; i++) f.line(-r * 0.8, i * r * 0.3, r * 0.8, i * r * 0.3, { w: 0 }); }
  }));
}
export function horn(M, o = {}) {
  const r = o.r ?? 0.12;
  M.ry(90, () => M.lathe([[r * 0.25, 0], [r * 0.35, r * 1.2], [r, r * 2.2]], { open: true }));
  M.at(-r * 0.2, 0, 0, () => M.ry(90, () => M.cyl(r * 0.35, -r * 0.6, 0.0)));
}
export function tankCapsule(M, o = {}) {
  const r = o.r ?? 0.8, L = o.len ?? 3;
  const run = () => {
    const S = M.capsule(r, -L / 2, L / 2, { rings: 6 });
    if (M.decorOn) {
      const Lt = S.lat;
      const t1 = (Math.PI / 2 * r) / (Math.PI * r + (L - 2 * r));
      Lt.ring(t1 + 0.02); Lt.ring(1 - t1 - 0.02);
      // weld seams: light rings along the barrel, a few meridian seams, strap bands
      const nr = Math.max(2, Math.round((L - 2 * r) / (r * 0.9)));
      for (let i = 1; i < nr; i++) Lt.ring(t1 + 0.02 + (1 - 2 * t1 - 0.04) * i / nr, { w: 0 });
      for (let i = 0; i < 6; i++) Lt.meridian(i * 60 + 30, 0.04, 0.96, { w: 0 });
      if (o.bands !== false) for (const t of [0.3, 0.7]) { Lt.ring(t - 0.012, { w: 1 }); Lt.ring(t + 0.012, { w: 1 }); }
      Lt.shade({ t0: 0.02, t1: 0.98, gap: 1.6, gapMax: 6 });
    }
    return S;
  };
  if ((o.axis ?? 'x') === 'x') return M.ry(90, run);
  if (o.axis === 'y') return M.rx(90, run);
  return run();
}
export function tankSphere(M, o = {}) {
  const r = o.r ?? 1;
  const S = M.at(0, 0, o.legs === false ? r : r * 1.35, () => {
    const s = M.sphere(r);
    if (M.decorOn) { s.lat.ring(0.5, { w: 1 }); s.lat.ring(0.47, { w: 1 }); s.lat.shade({ t0: 0.03, t1: 0.97, gap: 1.8 }); }
    return s;
  });
  if (o.legs !== false) {
    for (let i = 0; i < 4; i++) {
      const a = (i + 0.5) * Math.PI / 2;
      const top = [Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98, r * 1.35];
      const bot = [Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0, 0];
      M.tube(bot, top, r * 0.06, {});
      M.boxc([bot[0], bot[1], 0.03], [r * 0.25, r * 0.25, 0.06]);
    }
  }
  return S;
}
export function pipeRun(M, pts, r = 0.08, o = {}) {
  M.pipe(pts, r, { isect: false });
  if (o.flanges !== false) {
    for (let i = 0; i + 1 < pts.length; i++) {
      const L = len(sub(pts[i + 1], pts[i]));
      if (L > r * 12) { collar(M, pts[i], pts[i + 1], 0.5, r, { len: r * 0.5, k: 1.6 }); }
    }
  }
}
export function stack(M, o = {}) {
  const r = o.r ?? 0.25, h = o.h ?? 2;
  const S = M.cyl(r, 0, h);
  M.cyl(r * 1.15, h - r * 0.5, h - r * 0.3, { isect: false });
  M.cyl(r * 1.12, h * 0.3, h * 0.3 + r * 0.2, { isect: false });
  if (M.decorOn && S.top.ok) S.top.hatch(circlePts(0, 0, r * 0.85, r * 0.85, 16), { angle: 45, gap: 1.0, w: 0 });
  if (M.decorOn) S.lat.shade({ gap: 1.8 });
  return S;
}
// engine bell hanging down from z = 0 to -len
export function bell(M, o = {}) {
  // chamber, throat, then a convex bell (fast flare at the throat, nearly straight at the
  // exit); a lip ring, stiffener bands, cooling-tube lines, a turbopump with its exhaust
  const r = o.r ?? 0.8, L = o.len ?? r * 1.6;
  const rc = r * 0.36, rt = r * 0.24, zc = -L * 0.2, zt = -L * 0.3;
  const prof = [[rc * 1.05, 0], [rc, -L * 0.03], [rc, zc], [rt, zt]];
  const n = 9;
  for (let i = 1; i <= n; i++) { const t = i / n; prof.push([rt + (r - rt) * (1 - (1 - t) ** 1.45), zt - (L + zt) * t]); }
  const S = M.lathe(prof.reverse(), { open: true, sharpDeg: 28 });
  const tb = (L + zt) / (L + zt + Math.hypot(rc - rt, zc - zt) + (-zc));   // t where the bell meets the throat
  if (M.decorOn) {
    const Lt = S.lat;
    Lt.ring(0.02, { w: 1 });
    for (const k of [0.4, 0.72]) Lt.ring(tb * k, { w: 1 });
    // cooling tubes on the bell, in front only
    const nt = r / M.px > 36 ? Math.min(64, Math.round(2 * Math.PI * r / M.px / 7)) : 0;
    for (let i = 0; i < nt; i++) { const a = i * 360 / nt; if (dot(Lt.at(a, tb * 0.5).n, M.view.e) > 0.25) Lt.meridian(a, 0.03, tb * 0.97, { w: 0 }); }
    Lt.shade({ t0: 0.03, t1: 0.97, gap: 1.6 });
  }
  M.at(0, 0, -L, () => M.torus(r * 1.0, Math.max(r * 0.022, 0.012), { isect: false, rings: 8 }));
  M.cyl(r * 0.5, 0, L * 0.1);
  if (o.pump !== false && L > 0.6) {
    const pr = r * 0.13, px = rc + pr * 1.3;
    M.at(px, 0, -L * 0.05, () => M.cyl(pr, -L * 0.17, 0, { isect: false }));
    M.pipe([[px, 0, -L * 0.2], [px, 0, -L * 0.26], [rt + (r - rt) * 0.45, 0, zt - (L + zt) * 0.28]], pr * 0.45, { isect: false });
  }
  return S;
}
export function nozzles(M, o = {}) {
  const n = o.n ?? 4, r = o.r ?? 0.5;
  if (n === 1) return bell(M, { r, len: o.len });
  const ring = r * (n <= 4 ? 1.25 : 1.6);
  M.around(n, () => M.at(ring, 0, 0, () => bell(M, { r, len: o.len })), 45);
  if (n >= 5) bell(M, { r, len: o.len });
}
// flat panel with a cell grid, in the local xy plane, centered, thickness t
export function solar(M, o = {}) {
  const w = o.w ?? 3, h = o.h ?? 1.5, t = o.t ?? 0.05;
  const S = M.box([-w / 2, -h / 2, -t / 2], [w / 2, h / 2, t / 2]);
  for (const k of ['+z', '-z']) {
    const f = S.f(k);
    if (!f.on) continue;
    const cols = o.cols ?? Math.max(2, Math.round(w / 0.4)), rows = o.rows ?? Math.max(2, Math.round(h / 0.4));
    const g = f.grid(cols, rows, { gap: 1.4 });
    for (const r of g) { f.rect(r, { w: 0 }); if (k === '+z' && f.pxOf(r[2] - r[0]) > 6) f.hatch(r, { angle: 90, gap: 2.0, w: 0 }); }
  }
  return S;
}
// crane: pedestal, slewing house, lattice boom rising along +x, cable and hook
export function crane(M, o = {}) {
  const L = o.len ?? 6, rise = o.rise ?? 35, r = o.r ?? 0.5;
  M.cyl(r, 0, r * 0.8);
  M.cyl(r * 1.1, r * 0.8, r * 0.95);
  M.boxc([-r * 0.3, 0, r * 0.95 + r * 0.6], [r * 2.2, r * 1.6, r * 1.2]);
  winch(M, { r: r * 0.35, w: r * 1.2, at: [-r * 0.9, 0, r * 0.95 + r * 1.45] });
  const base = [r * 0.6, 0, r * 1.4];
  const tip = add(base, [Math.cos(rise * D2R) * L, 0, Math.sin(rise * D2R) * L]);
  girder(M, base, tip, { w: r * 0.7, sec: 4 });
  M.at(tip[0], tip[1], tip[2], () => M.rx(90, () => M.cyl(r * 0.3, -r * 0.2, r * 0.2)));
  const drop = o.drop ?? tip[2] * 0.6;
  const hk = [tip[0], 0, tip[2] - drop];
  M.line([[tip[0], -0.05, tip[2] - r * 0.3], [hk[0], -0.05, hk[2] + 0.4]], { w: 1, pass: 1 });
  M.line([[tip[0], 0.05, tip[2] - r * 0.3], [hk[0], 0.05, hk[2] + 0.4]], { w: 1, pass: 1 });
  M.boxc([hk[0], 0, hk[2] + 0.25], [0.25, 0.3, 0.35]);
  // hook
  const hp = [];
  for (let i = 0; i <= 8; i++) { const a = (-30 + 240 * i / 8) * D2R; hp.push([hk[0] + Math.sin(a) * 0.14, 0, hk[2] - 0.12 - Math.cos(a) * 0.14 + 0.12]); }
  M.pipe([[hk[0], 0, hk[2] + 0.08], ...hp.slice(1)], 0.03, { isect: false });
  return { tip, hook: hk };
}
export function winch(M, o = {}) {
  const r = o.r ?? 0.3, w = o.w ?? 0.8, at = o.at || [0, 0, r * 1.2];
  M.at(at[0], at[1], at[2], () => {
    const D = M.rx(90, () => M.cyl(r, -w / 2, w / 2, { isect: false }));
    if (M.decorOn) for (let i = 1; i < 8; i++) D.lat.ring(i / 8, { w: 0 }); // wire turns on the drum
    if (M.decorOn) D.lat.shade({ gap: 1.5, gapMax: 3 });
    for (const s of [1, -1]) M.rx(90, () => M.cyl(r * 1.35, s * w / 2, s * (w / 2 + 0.06), { isect: false }));
  });
}
export function crate(M, o = {}) {
  const s = o.s || [1.2, 1, 0.9];
  const S = M.box([-s[0] / 2, -s[1] / 2, 0], [s[0] / 2, s[1] / 2, s[2]]);
  for (const k of ['+x', '-x', '+y', '-y', '+z']) {
    const f = S.f(k);
    if (!f.on) continue;
    const b = f.mOf(3);
    const r = f.box;
    f.rect(r[0] + b, r[1] + b, r[2] - b, r[3] - b, { w: 1 });
    f.line(r[0] + b, r[1] + b, r[2] - b, r[3] - b, { w: 1 });
    const n = Math.max(2, Math.round(f.h / 0.25));
    for (let i = 1; i < n; i++) { const y = r[1] + f.h * i / n; f.line(r[0] + b, y, r[2] - b, y, { w: 0 }); }
  }
  return S;
}
export function container(M, o = {}) {
  const L = o.len ?? 6.06, W = 2.44, H = o.h ?? 2.59;
  const S = M.box([-L / 2, -W / 2, 0], [L / 2, W / 2, H]);
  for (const k of ['+y', '-y', '+x', '-x', '+z']) {
    const f = S.f(k);
    if (!f.on) continue;
    const b = f.mOf(3);
    const r = [-f.w / 2 + b, -f.h / 2 + b, f.w / 2 - b, f.h / 2 - b];
    if (k === '+z') { f.rect(r, { w: 1 }); continue; }
    corrugated(f, r, { dir: 'v', gap: 3.2 });
    if (k === '+x' || k === '-x') { f.line(0, r[1], 0, r[3], { w: 1 }); for (const x of [-f.w * 0.25, f.w * 0.25]) f.line(x, r[1] + b, x, r[3] - b, { w: 1 }); }
    if (o.label && (k === '+y' || k === '-y')) stencil(f, o.label, 0, f.h * 0.2, f.h * 0.14);
  }
  return S;
}
export function cupola(M, o = {}) {
  const r = o.r ?? 1, h = o.h ?? r * 0.7;
  const S = M.cyl(r, 0, h);
  if (M.decorOn) {
    const n = o.windows ?? 8;
    for (let i = 0; i < n; i++) {
      const a = i * 360 / n;
      const w = 2 * Math.PI * r / n * 0.55, hh = h * 0.42;
      S.lat.shape(a, 0.55, [[-w / 2, -hh / 2], [w / 2, -hh / 2], [w / 2, hh / 2], [-w / 2, hh / 2]], { closed: true, w: 1 });
    }
  }
  const D = M.at(0, 0, h, () => M.lathe([[r * 1.04, 0], [r * 1.04, r * 0.06], ...Array.from({ length: 7 }, (_, i) => { const a = (i + 1) / 7 * 90 * D2R; return [Math.cos(a) * r * 0.98, r * 0.06 + Math.sin(a) * r * 0.55]; })]));
  if (M.decorOn) { D.lat.ring(0.4, { w: 1 }); D.lat.shade({ t0: 0.15, t1: 0.95, gap: 1.8 }); }
  return S;
}
// bubble canopy, ellipsoid, front toward +x, sits on z = 0
export function canopy(M, o = {}) {
  const L = o.len ?? 2, W = o.w ?? 1.2, H = o.h ?? 0.9;
  const S = M.scale(L / 2, W / 2, H, () => {
    const prof = [];
    const n = 8;
    for (let i = 0; i <= n; i++) { const a = 90 * i / n * D2R; prof.push([Math.cos(a), Math.sin(a)]); }
    prof[n][0] = 0;
    return M.lathe(prof);
  });
  if (M.decorOn) {
    const Lt = S.lat;
    for (const a of [30, 150, 210, 330]) Lt.meridian(a, 0, 0.82, { w: 1 });
    Lt.ring(0.42, { w: 1 });
    Lt.shade({ t0: 0.02, t1: 0.85, gap: 1.6, gapMax: 4.5, threshold: 0.3 });
  }
  return S;
}
// rotor in the local xy plane at z = 0: hub, n blades
export function rotor(M, o = {}) {
  const R = o.r ?? 4, n = o.blades ?? 3, c = o.chord ?? R * 0.07, t = o.t ?? c * 0.12;
  M.cyl(c * 0.9, -c * 0.4, c * 0.4);
  M.around(n, () => {
    M.box([c * 0.7, -c / 2, -t / 2], [R, c / 2, t / 2], { isect: false });
    M.boxc([c * 1.2, 0, 0], [c * 0.8, c * 0.6, t * 3], { isect: false });
  }, o.phase ?? 15);
  M.cyl(c * 0.35, -c * 2.5, -c * 0.4);
  // o.swash: swashplate on the mast with a pitch link to each blade grip
  if (o.swash) {
    M.cyl(c * 1.25, -c * 1.9, -c * 1.6, { isect: false });
    M.cyl(c * 0.95, -c * 1.6, -c * 1.4, { isect: false });
    M.around(n, () => M.tube([c * 1.1, c * 0.45, -c * 1.45], [c * 1.25, c * 0.45, -t], c * 0.07, { isect: false }), o.phase ?? 15);
  }
  // o.bar: stabilizer bar across the blades with weights at the ends
  if (o.bar) {
    const b = o.bar;
    M.rz((o.phase ?? 15) + 90, () => {
      M.tube([-b, 0, c * 0.5], [b, 0, c * 0.5], c * 0.06, { isect: false });
      for (const s of [1, -1]) M.at(s * b, 0, c * 0.5, () => M.ry(90, () => M.capsule(c * 0.2, -c * 0.7, c * 0.7, { isect: false })));
    });
    M.cyl(c * 0.3, c * 0.2, c * 0.8, { isect: false });
  }
}
// propeller on the local x axis (thrust along +x)
export function propeller(M, o = {}) {
  const R = o.r ?? 1.2, n = o.blades ?? 3;
  M.ry(90, () => {
    M.lathe([[R * 0.16, -R * 0.15], [R * 0.16, R * 0.05], [R * 0.12, R * 0.2], [0, R * 0.3]]);
    M.around(n, () => {
      const root = [[-R * 0.06, R * 0.1, -0.02], [R * 0.06, R * 0.1, 0.02]];
      void root;
      M.loft([[R * 0.12, -R * 0.06, -R * 0.03], [R * 0.12, R * 0.06, R * 0.03], [R * 0.12, R * 0.05, R * 0.05], [R * 0.12, -R * 0.07, -R * 0.01]],
        [[R, -R * 0.03, -R * 0.0], [R, R * 0.03, R * 0.01], [R, R * 0.025, R * 0.02], [R, -R * 0.035, R * 0.005]], { isect: false });
    }, 20);
  });
}
export function ductedFan(M, o = {}) {
  const R = o.r ?? 1, d = R * 0.6;
  // duct: closed airfoil ring about local x
  const prof = [];
  const n = 10;
  for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n; prof.push([R + Math.sin(a) * R * 0.08 + R * 0.06, -Math.cos(a) * d / 2]); }
  const S = M.lathe(prof, { loop: true, axis: 'x', sharpDeg: 60 });
  if (M.decorOn) S.lat.shade({ gap: 1.8 });
  M.at(-d * 0.1, 0, 0, () => propeller(M, { r: R * 0.98, blades: o.blades ?? 5 }));
  for (let i = 0; i < 3; i++) M.rx(i * 120 + 90, () => M.boxc([d * 0.3, 0, R * 0.55], [d * 0.3, 0.04, R * 0.9], { isect: false }));
  return S;
}
// round deck with its top at z = 0
export function helipad(M, o = {}) {
  const R = o.r ?? 5, t = o.t ?? 0.25;
  const S = M.cyl(R, -t, 0);
  const f = S.top;
  if (f.on) {
    f.circle(0, 0, R * 0.97, { w: 1 });
    const n = o.seams ?? 8;
    for (let i = 0; i < n; i++) { const a = (i + 0.5) * 2 * Math.PI / n; f.line(Math.cos(a) * R * 0.08, Math.sin(a) * R * 0.08, Math.cos(a) * R * 0.97, Math.sin(a) * R * 0.97, { w: 0 }); }
    f.circle(0, 0, R * 0.08, { w: 0 });
    f.circle(0, 0, R * 0.55, { w: 0 });
    // the H
    if (o.mark !== false) {
      const hh = R * 0.42, hw = R * 0.3, sw = R * 0.07;
      const ang = o.markAngle ?? 0;
      const c = Math.cos(ang * D2R), s = Math.sin(ang * D2R);
      const rot = (p) => p.map(([x, y]) => [x * c - y * s, x * s + y * c]);
      const H = rot([[-hw, -hh], [-hw + sw * 1.4, -hh], [-hw + sw * 1.4, -sw], [hw - sw * 1.4, -sw], [hw - sw * 1.4, -hh], [hw, -hh],
        [hw, hh], [hw - sw * 1.4, hh], [hw - sw * 1.4, sw], [-hw + sw * 1.4, sw], [-hw + sw * 1.4, hh], [-hw, hh]]);
      f.path(H, { closed: true, w: 1 });
      f.hatch(H, { angle: 45, gap: 1.6, w: 0 });
    }
    // tie-down points
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; f.circle(Math.cos(a) * R * 0.75, Math.sin(a) * R * 0.75, R * 0.012, { n: 6 }); }
  }
  // deck edge lights
  const nl = o.lights ?? 12;
  for (let i = 0; i < nl; i++) { const a = (i + 0.5) * 2 * Math.PI / nl; M.at(Math.cos(a) * R * 0.99, Math.sin(a) * R * 0.99, 0, () => M.cyl(R * 0.022, 0, R * 0.02, { isect: false, seg: 8 })); }
  if (o.girder !== false) M.at(0, 0, -t, () => ringGirder(M, { r: R * 1.0, h: o.gh ?? R * 0.1, n: Math.round(o.gn ?? 36) }));
  return S;
}

// small helicopter, nose +x, skids on z = 0
export function miniHeli(M, o = {}) {
  const L = o.len ?? 8, s = L / 8;
  const reg = o.reg ?? '';
  M.at(0, 0, 0, () => {
    // skids
    for (const y of [-0.85 * s, 0.85 * s]) {
      M.pipe([[-1.6 * s, y, 0.22 * s], [-1.5 * s, y, 0.05 * s], [1.4 * s, y, 0.05 * s], [1.75 * s, y, 0.25 * s]], 0.05 * s, { isect: false });
      M.tube([-0.8 * s, y, 0.05 * s], [-0.6 * s, y * 0.55, 0.85 * s], 0.045 * s, { isect: false });
      M.tube([0.8 * s, y, 0.05 * s], [0.6 * s, y * 0.55, 0.85 * s], 0.045 * s, { isect: false });
    }
    // cabin: bubble (front) and body
    M.at(0.3 * s, 0, 0.75 * s, () => {
      const B = M.scale(1.45 * s, 0.82 * s, 0.85 * s, () => M.sphere(1, { rings: 12 }));
      if (M.decorOn) {
        const Lt = B.lat;
        Lt.ring(0.42, { a0: -60, a1: 60, w: 1 });
        Lt.ring(0.62, { a0: -75, a1: 75, w: 1 });
        for (const a of [-60, -25, 25, 60]) Lt.meridian(a, 0.3, 0.86, { w: 1 });
        Lt.shade({ t0: 0.32, t1: 0.88, gap: 1.6, gapMax: 4.5, threshold: 0.3 });
        if (reg) Lt.text(reg, 180, 0.5, 0.2 * s);
      }
    });
    // tail boom
    M.along([-0.7 * s, 0, 1.25 * s], [-4.6 * s, 0, 1.5 * s], (l) => {
      const T = M.lathe([[0.28 * s, 0], [0.09 * s, l]], { axis: 'x' });
      if (M.decorOn && reg) { T.lat.text(reg, 90, 0.3, 0.17 * s, { along: true }); T.lat.text(reg, -90, 0.3, 0.17 * s, { along: true }); }
    });
    // fin and stabilizer
    M.extrude([[-4.3 * s, 1.3 * s], [-4.65 * s, 1.35 * s], [-4.95 * s, 2.3 * s], [-4.75 * s, 2.3 * s]], -0.03 * s, 0.03 * s, { plane: 'xz' });
    M.box([-4.25 * s, -0.55 * s, 1.43 * s], [-3.95 * s, 0.55 * s, 1.48 * s]);
    M.at(-4.75 * s, 0.1 * s, 1.75 * s, () => M.rx(-90, () => rotor(M, { r: 0.55 * s, blades: 2, chord: 0.08 * s })));
    // engine fairing and mast
    M.boxc([-0.5 * s, 0, 1.55 * s], [1.3 * s, 0.7 * s, 0.4 * s], { chamfer: 0.15 * s });
    M.cyl(0.08 * s, 1.75 * s, 2.05 * s);
    M.at(0, 0, 2.05 * s, () => rotor(M, { r: 4 * s, blades: o.blades ?? 4, chord: 0.22 * s, phase: o.phase ?? 20 }));
  });
}

// the scale figure: a flat 1.75 m outline in the local xz plane, facing local -y
export function figure(M, o = {}) {
  const h = o.h ?? 1.75, k = h / 1.75;
  const out = [
    [0.0, 1.75], [0.07, 1.735], [0.105, 1.68], [0.105, 1.6], [0.075, 1.53], [0.06, 1.5], [0.2, 1.46], [0.24, 1.38], [0.26, 1.05],
    [0.27, 0.86], [0.22, 0.86], [0.205, 1.02], [0.19, 1.25], [0.17, 0.95], [0.16, 0.5], [0.15, 0.06], [0.2, 0.0], [0.04, 0.0],
    [0.04, 0.07], [0.02, 0.78], [0, 0.82],
  ];
  const full = [...out, ...out.slice(1, -1).reverse().map(([x, y]) => [-x, y])].map(([x, y]) => [x * k, 0, y * k]);
  const S = M.plate(full, { w: 1, isect: false, pass: 2, girth: 0.01 });
  return S;
}

// dashed drop lines from points to the ground and the footprint (convex hull) on it
export function dropLines(M, pts, o = {}) {
  for (const p of pts) M.line([p, [p[0], p[1], 0]], { w: 0, pass: 0, dash: 'dash', occlude: true });
  const hull = convexHull(pts.map((p) => [p[0], p[1]]));
  if (hull.length > 2 && o.footprint !== false) M.line([...hull, hull[0]].map(([x, y]) => [x, y, 0]), { w: 0, pass: 0, dash: 'dash', occlude: true });
}
export function convexHull(P) {
  const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

// ------------------------------------------------------------------ doors and platforms
// door on face f centered at x, sill at y - h/2. o.platform: fold-down slab; o.rail
export function door(M, f, x, y, w, h, o = {}) {
  if (f.on) {
    const r = [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
    f.rect(r, { w: 1 });
    const fr = Math.min(w, h) * 0.08;
    f.path(roundRect(r[0] + fr, r[1] + fr, r[2] - fr, r[3] - fr, fr), { closed: true, w: 1 });
    const gw = w * 0.5, gy = y + h * 0.18;
    const g = roundRect(x - gw / 2, gy, x + gw / 2, gy + h * 0.2, w * 0.06);
    glass(f, g, { gap: 1.2, gap2: 2.4 });
    f.rect(x + w * 0.28, y - h * 0.08, x + w * 0.36, y + h * 0.02, { w: 1 });
    f.line(r[0] + fr, y - h * 0.25, r[2] - fr, y - h * 0.25, { w: 0 });
  }
  let sill = f.P(x, y - h / 2);
  if (o.platform) {
    const d = o.depth ?? w * 1.1, t = o.t ?? 0.12;
    M.onFace(f, x, y - h / 2, () => platform(M, { ...o, depth: d, width: o.width ?? w * 1.5, t, stayH: h * 0.9 }));
    sill = M.onFace(f, x, y - h / 2, () => M.W([d, 0, -t]));
  }
  return { sill };
}

// fold-down platform in the current frame: +x out from the wall, top at z = 0, wall at
// x = 0. o: depth, width, t, stayH (stays to the wall at this height), drop (room under
// the slab for struts), rail, inset (slab starts this far inside the wall, for round hulls)
export function platform(M, o = {}) {
  const d = o.depth ?? 1.6, pw = o.width ?? 2, t = o.t ?? 0.12, x0 = -(o.inset ?? 0);
  const P = M.box([x0, -pw / 2, -t], [d, pw / 2, 0]);
  const top = P.f('+z');
  if (top.on) { const ins = top.mOf(2.2); grating(top, [-top.w / 2 + ins, -top.h / 2 + ins, top.w / 2 - ins, top.h / 2 - ins]); top.rect(-top.w / 2 + ins, -top.h / 2 + ins, top.w / 2 - ins, top.h / 2 - ins, { w: 1 }); }
  for (const k of ['+x', '+y', '-y']) { const sf = P.f(k); if (sf.on) sf.hatch(sf.box, { angle: 90, gap: 2.0, w: 0 }); }
  for (const s of [1, -1]) {
    M.tube([d * 0.96, s * pw * 0.48, 0.02], [0.02 + x0, s * pw * 0.48, o.stayH ?? 1.8], 0.02, { isect: false });
    const drop = Math.min(d * 0.7, o.drop ?? d * 0.7);
    if (drop > 0.3) M.tube([d * 0.85, s * pw * 0.42, -t], [x0, s * pw * 0.42, -t - drop], 0.035, {});
  }
  if (o.rail !== false) {
    const pts = [[0.05, pw / 2, 0], [d - 0.05, pw / 2, 0], [d - 0.05, -pw / 2, 0], [0.05, -pw / 2, 0]];
    railing(M, pts, { h: 0.95 });
  }
  return P;
}

// a construction helper: the outward normal side test for a face direction
export function seen(M, n) { return dot(norm(n), M.view.e) > 0; }
export { cross, norm };
