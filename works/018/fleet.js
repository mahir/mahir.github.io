// fleet.js: seed -> vehicle. Seeded randomness, the class registry, naming, the two-pass
// build, hidden-line removal and the finished Drawing (see the brief's contract):
//
//   make(seed, box, opts) -> { seed, strokes, bbox, pxPerMeter, parts, callouts, meta, stats }
//     seed: integer 0..99999. box: { w, h } CSS px. opts.klass: restrict to one class id.
//     opts.dims: false leaves out the two dimension lines (phones).
//   classes: the registry [{ id, family, weight, build }]
//   makeScene(fn, box, opts): draw any fn(M) with the same engine (kit tests)

import { Model, mulberry32, hashSeed, setFont, D2R } from './geom.js';
import { render, bounds } from './hlr.js';
import * as K from './kit.js';
import { word, thou, mm } from './words.js';
export { word, thou, mm };

let strokeText = null;
try { ({ strokeText } = await import('./font.js')); } catch (e) { strokeText = null; }
setFont(strokeText ? (s, o) => strokeText(s, o) : null);

// The classes. A file that is missing or throws is skipped with a warning, so the fleet
// keeps running while classes are being written.
const CLASS_FILES = ['lander',
  'rover', 'crawler', 'hauler', 'walker', 'monowheel',
  'locomotive', 'monorail', 'railcrane',
  'airship', 'gyrocopter', 'tiltrotor', 'hovercraft', 'balloon',
  'tug', 'hydrofoil', 'bathyscaphe', 'catamaran',
  'rocket', 'station', 'spaceplane'];
export const classes = (await Promise.all(CLASS_FILES.map((id) =>
  import(`./classes/${id}.js`).then((m) => m.default, (e) => { console.warn(`class ${id} did not load`, e); return null; })))).filter(Boolean);

// ------------------------------------------------------------------ naming
const NAMES = `KESTREL HARRIER OSPREY MERLIN SHRIKE PLOVER PETREL FULMAR GANNET TERN SKUA CURLEW DUNLIN
LAPWING HERON EGRET IBIS STORK SWIFT MARTIN WREN SISKIN LINNET BUNTING PIPIT WAGTAIL DIPPER NUTHATCH KITE
BUZZARD FALCON HOBBY CONDOR ALBATROSS PELICAN CORMORANT PUFFIN AUK RAVEN ROOK JACKDAW MAGPIE ORIOLE
STARLING GODWIT AVOCET KINGFISHER HOOPOE NIGHTJAR MISTRAL SIROCCO BORA FOEHN CHINOOK ZONDA HABOOB
KHAMSIN SIMOOM LEVANTER TRAMONTANE PAMPERO WILLIWAW HARMATTAN ETESIAN GREGALE LIBECCIO BURAN ZEPHYR
BOREAS NOTUS EURUS LODOS POYRAZ MELTEM IMBAT KARAYEL KESISLEME GUNDOGDU VOLGA DANUBE RHONE LOIRE TAGUS
EBRO ODER VISTULA INDUS MEKONG YUKON ORINOCO PARANA NIGER ZAMBEZI CONGO TIGRIS MURRAY FRASER COLUMBIA
HUDSON SEVERN SHANNON SAKARYA MENDERES CEYHAN ARAS LENA AMUR YENISEI ELBRUS ARARAT ERCIYES DENALI
KAMET MAKALU LHOTSE EIGER RAINIER SHASTA TEIDE ETNA HEKLA OLYMPUS TABOR VEGA ALTAIR DENEB RIGEL SIRIUS
CANOPUS ARCTURUS CAPELLA POLLUX CASTOR SPICA ANTARES ALDEBARAN MIRA ALGOL MIZAR ALCOR MERAK DUBHE
ALNILAM BELLATRIX FOMALHAUT ACHERNAR HADAR REGULUS PROCYON SHAULA ANVIL CHISEL AUGER GIMLET TROWEL
SPANNER CALIPER PLUMB SEXTANT ASTROLABE COMPASS VISE MALLET ADZE AWL RASP SCRIBE BEVEL GAUGE CLAMP
CAPSTAN SHACKLE BOLLARD WINDLASS TILLER`.split(/\s+/).filter(Boolean);

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';

function designation(r) {
  const L = () => LET[Math.floor(r() * LET.length)];
  const k = r();
  if (k < 0.35) return `${L()}${L()}-${L()}${L()}${L()}`;
  if (k < 0.55) return `MK ${ROMAN[Math.floor(r() * ROMAN.length)]}`;
  if (k < 0.8) return `TYPE ${2 + Math.floor(r() * 60)}-${L()}`;
  return `${L()}${L()}-${1 + Math.floor(r() * 19)}`;
}

// ------------------------------------------------------------------ the pipeline
function newModel(seed, px, classSalt) {
  return new Model({ rng: mulberry32(hashSeed('geom', classSalt, seed)), px });
}

export function pickClass(seed, only) {
  const pool = only ? classes.filter((c) => c.id === only) : classes;
  const list = pool.length ? pool : classes;
  const r = mulberry32(hashSeed('class', seed));
  let t = 0;
  for (const c of list) t += c.weight ?? 1;
  let x = r() * t;
  for (const c of list) { x -= c.weight ?? 1; if (x <= 0) return c; }
  return list[list.length - 1];
}

export function make(seed, box, opts = {}) {
  const t0 = performance.now();
  const cls = pickClass(seed, opts.klass || opts.class);
  const d = draw((M) => cls.build(M), seed, box, { ...opts, salt: cls.id, family: cls.family });
  // naming
  const nr = mulberry32(hashSeed('name', seed));
  const name = NAMES[Math.floor(nr() * NAMES.length)];
  const des = d.vocab.designation || designation(nr);
  const v = d.vocab;
  let klass = [v.place, v.job, v.form].filter(Boolean).join(' ');
  if (klass.length > 34) klass = [v.job, v.form].filter(Boolean).join(' ');
  const specs = [['LENGTH', mm(d.size.length) + ' MM'], ['HEIGHT', mm(d.size.height) + ' MM'], ...(v.specs || [])].slice(0, 6);
  d.meta = {
    name, designation: des, klass: klass.slice(0, 34), brief: (v.brief || '').slice(0, 78), specs,
    family: cls.family, klassId: cls.id,
  };
  d.stats.msMake = performance.now() - t0;
  delete d.vocab; delete d.size;
  return d;
}

// draw any build function: two passes, extras, HLR, fit. Returns a Drawing without meta.
export function makeScene(build, box, opts = {}) {
  const t0 = performance.now();
  const d = draw(build, opts.seed ?? 1, box, { extras: false, ...opts });
  d.stats.msMake = performance.now() - t0;
  return d;
}

function draw(build, seed, box, opts) {
  const salt = opts.salt || 'scene';
  // pass 1: measure
  const M1 = newModel(seed, 0, salt);
  const v1 = build(M1) || {};
  const b1 = bounds(M1);
  const extras = opts.extras !== false;
  const FILL = opts.fill ?? 0.92;
  const fx = FILL, fy = FILL;
  const bw = Math.max(1e-3, b1.x1 - b1.x0), bh = Math.max(1e-3, b1.y1 - b1.y0);
  let ppm = Math.min(box.w * fx / bw, box.h * fy / bh);
  // pass 2: draw
  const M = newModel(seed, 1 / ppm, salt);
  M.info.seed = seed;
  const vocab = build(M) || {};
  void v1;
  const W = worldBox(M);
  if (extras) addExtras(M, W, vocab, opts);
  const out = render(M, ppm, opts);
  // fit the vehicle's own ink (passes 1..3, without wires and the figure) to the box
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of out.strokes) {
    if (s.pass < 1 || s.pass > 3 || s.nofit) continue;
    const p = s.pts;
    for (let i = 0; i < p.length; i += 2) {
      if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i];
      if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1];
    }
  }
  if (!isFinite(x0)) { x0 = y0 = -1; x1 = y1 = 1; }
  const s = Math.max(0.5, Math.min(box.w * FILL / (x1 - x0), box.h * FILL / (y1 - y0), 2));
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let ix0 = Infinity, iy0 = Infinity, ix1 = -Infinity, iy1 = -Infinity;
  let nSeg = 0;
  for (const st of out.strokes) {
    const p = st.pts;
    for (let i = 0; i < p.length; i += 2) {
      p[i] = (p[i] - cx) * s; p[i + 1] = (p[i + 1] - cy) * s;
      if (st.pass >= 1 && st.pass <= 3 && !st.nofit) {
        if (p[i] < ix0) ix0 = p[i]; if (p[i] > ix1) ix1 = p[i];
        if (p[i + 1] < iy0) iy0 = p[i + 1]; if (p[i + 1] > iy1) iy1 = p[i + 1];
      }
    }
    st.len *= s;
    nSeg += p.length / 2 - 1;
  }
  out.strokes.sort((a, b) => a.pass - b.pass || a.part - b.part);
  // callouts: highest priority first, a visible anchor each
  // (a candidate with a non-finite anchor is dropped: it would break the sheet's lettering)
  const cands = M.callouts.filter((c) => c.at.length && c.at.every((p) => p.every(Number.isFinite)))
    .sort((a, b) => b.prio - a.prio);
  const callouts = [];
  for (const c of cands) {
    if (callouts.length >= 9) break;
    const at = c.at.find((p) => out.visible(p));
    if (!at) continue;
    const q = out.project(at);
    callouts.push({ label: c.label, qty: c.qty, x: (q[0] - cx) * s, y: (q[1] - cy) * s, part: c.part });
  }
  for (const c of cands) {
    if (callouts.length >= 5) break;
    if (callouts.find((k) => k.label === c.label)) continue;
    const q = out.project(c.at[0]);
    callouts.push({ label: c.label, qty: c.qty, x: (q[0] - cx) * s, y: (q[1] - cy) * s, part: c.part, hidden: true });
  }
  return {
    seed,
    strokes: out.strokes,
    bbox: { x0: ix0, y0: iy0, x1: ix1, y1: iy1 },
    pxPerMeter: ppm * s,
    parts: M.parts.map((p) => ({ name: p.name })),
    callouts,
    vocab,
    size: { length: W[3] - W[0], width: W[4] - W[1], height: W[5] },
    stats: { ...out.stats, strokes: out.strokes.length, segments: nSeg, solids: M.solids.length, faces: M.nFaces },
  };
}

// world bounds of the solids (lines excluded)
function worldBox(M) {
  const b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (const S of M.solids) {
    if (S.noMeasure) continue;
    for (let i = 0; i < 3; i++) { b[i] = Math.min(b[i], S.bbox[i]); b[i + 3] = Math.max(b[i + 3], S.bbox[i + 3]); }
  }
  b[2] = Math.min(b[2], 0);
  return b;
}

// the biggest solid by bounding volume: the main mass when the class names none
function mainMass(M) {
  let best = null, bv = 0;
  for (const S of M.solids) {
    const b = S.bbox, v = (b[3] - b[0]) * (b[4] - b[1]) * (b[5] - b[2]);
    if (v > bv) { bv = v; best = b; }
  }
  return best;
}

// ------------------------------------------------------------------ dimensions, figure, construction
function addExtras(M, B, vocab, opts = {}) {
  const k = M.px, v = M.view, e = v.e;
  const scr = (d) => [d[0] * v.r[0] + d[1] * v.r[1] + d[2] * v.r[2], -(d[0] * v.u[0] + d[1] * v.u[1] + d[2] * v.u[2])];
  const sy = e[1] >= 0 ? 1 : -1, sx = e[0] >= 0 ? 1 : -1;
  const yN = sy > 0 ? B[4] : B[1];
  const xN = sx > 0 ? B[3] : B[0], xF = sx > 0 ? B[0] : B[3];
  const th = 7.5 * k, tick = 3.2 * k;
  const ZT = B[5];
  const ln = (a, b, o = {}) => M.line([a, b], { w: 1, pass: 4, ...o });
  // scale figure first: it is ink the dimensions must clear
  const spot = vocab.figure || [xN - sx * (B[3] - B[0]) * 0.18, yN + sy * 1.5];
  M.part('SCALE FIGURE', () => {
    const F = M.with({ at: [spot[0], spot[1], 0], rz: v.az + 90 }, () => K.figure(M));
    F.noMeasure = true; F.noFit = true;
  });
  // all ink points (solid vertices) in world and on paper (px)
  const W = [];
  // (points of the scale figure are marked nm: the dimensions clear them but do not measure them)
  for (const S of M.solids) { const V = S.V; for (let i = 0; i < V.length; i += 3) { const w = [V[i], V[i + 1], V[i + 2]]; if (S.noMeasure) w.nm = true; W.push(w); } }
  const P = (p) => [(p[0] * v.r[0] + p[1] * v.r[1] + p[2] * v.r[2]) / k, -(p[0] * v.u[0] + p[1] * v.u[1] + p[2] * v.u[2]) / k];
  const CLEAR = 26, GAP = 3, OVER = 5;
  const twOf = (str) => (M.font ? M.font(str, { spacing: 0.18 }).width * th : str.length * th * 0.7);
  M.part('DIMENSIONS', () => {
    if (opts.dims === false) return; // narrow sheets leave the dimensions out, for a larger drawing
    // ---- overall length: along x on the ground, on the near side, CLEAR px beyond the ink
    const X = P([1, 0, 0]), Yv = P([0, sy, 0]);
    let nx = -X[1], ny = X[0];
    const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    if (nx * Yv[0] + ny * Yv[1] < 0) { nx = -nx; ny = -ny; }
    const perM = nx * Yv[0] + ny * Yv[1]; // px outward per meter of y
    let smax = -Infinity, xmin = Infinity, xmax = -Infinity, pmin = null, pmax = null;
    for (const w of W) {
      const q = P(w), sv = nx * q[0] + ny * q[1];
      if (sv > smax) smax = sv;
      if (w.nm) continue;
      if (w[0] < xmin) { xmin = w[0]; pmin = w; }
      if (w[0] > xmax) { xmax = w[0]; pmax = w; }
    }
    if (perM > 0.05 && pmin) {
      const base = P([0, 0, 0]), s0 = nx * base[0] + ny * base[1];
      const yL = sy * (smax + CLEAR - s0) / perM;
      const g = GAP / perM, o2 = OVER / perM;
      for (const pe of [pmin, pmax]) {
        const y0 = pe[1] + sy * g;
        if ((yL - y0) * sy > 0) ln([pe[0], y0, 0], [pe[0], yL + sy * o2, 0]);
      }
      const str = mm(xmax - xmin);
      const xdir = scr([1, 0, 0])[0] >= 0 ? [1, 0, 0] : [-1, 0, 0];
      const ydir = scr([0, 1, 0])[1] < 0 ? [0, 1, 0] : [0, -1, 0];
      const half = twOf(str) / 2 + 4 * k;
      const xm = (xmin + xmax) / 2;
      if (xmax - xmin > 2 * half + 8 * k) { ln([xmin, yL, 0], [xm - half, yL, 0]); ln([xm + half, yL, 0], [xmax, yL, 0]); }
      else ln([xmin, yL, 0], [xmax, yL, 0]);
      M.text3(str, [xm, yL, 0], xdir, ydir, th, { w: 1, pass: 4 });
      for (const x of [xmin, xmax]) ln([x - tick, yL - sy * tick, 0], [x + tick, yL + sy * tick, 0], { w: 2 });
    }
    // ---- overall height: a vertical line CLEAR px beyond the ink on the side that sticks out less
    let top = W.find((w) => !w.nm) || W[0];
    for (const w of W) if (!w.nm && w[2] > top[2]) top = w;
    const ZT2 = top[2];
    const mb = M.info.mass || mainMass(M) || B;
    const corners = [];
    for (const x of [mb[0], mb[3]]) for (const y of [mb[1], mb[4]]) for (const z of [mb[2], mb[5]]) corners.push(P([x, y, z])[0]);
    const hullL = Math.min(...corners), hullR = Math.max(...corners);
    let inkL = Infinity, inkR = -Infinity;
    for (const w of W) { const q = P(w)[0]; if (q < inkL) inkL = q; if (q > inkR) inkR = q; }
    const right = (inkR - hullR) <= (hullL - inkL);
    const target = right ? inkR + CLEAR : inkL - CLEAR;
    // anchor: the outermost ink point on that side (keeps the extension lines short)
    let E = W[0], eb = -Infinity;
    for (const w of W) { const q = P(w)[0] * (right ? 1 : -1); if (q > eb) { eb = q; E = w; } }
    // move along the axis that runs most sideways on paper, in the plane through the top point
    // pick the axis whose outward run on paper climbs least (extension lines stay low)
    let ax = 0, bestDy = -Infinity;
    for (const c of [0, 1]) {
      if (Math.abs(v.r[c]) < 0.25) continue;
      const dy = (-v.u[c]) * (right ? 1 : -1) / v.r[c];
      if (dy > bestDy) { bestDy = dy; ax = c; }
    }
    const D = ax === 0 ? [1, 0, 0] : [0, 1, 0];
    const rD = v.r[ax] / k; // px per meter along D
    const base = [E[0], E[1], 0];
    base[ax] = 0;
    const cD = (target - P(base)[0]) / rD;     // coordinate along D of the dim line
    const at = (z) => { const p = [E[0], E[1], z]; p[ax] = cD; return p; };
    const dirOut = Math.sign(cD - E[ax]) || 1;
    const g = GAP / Math.abs(rD), o2 = OVER / Math.abs(rD);
    const ext = (z) => {
      const p0 = [E[0], E[1], z]; p0[ax] += dirOut * g;
      const p1 = at(z); p1[ax] += dirOut * o2;
      if ((p1[ax] - p0[ax]) * dirOut > 0) ln(p0, p1);
    };
    ext(ZT2);
    ext(0);
    const hs = mm(ZT2);
    const zm = ZT2 / 2, hh = twOf(hs) / 2 + 4 * k;
    if (ZT2 > 2 * hh + 8 * k) { ln(at(0), at(zm - hh)); ln(at(zm + hh), at(ZT2)); } else ln(at(0), at(ZT2));
    const up = scr(D)[0] < 0 ? D : D.map((c) => -c);
    M.text3(hs, at(zm), [0, 0, 1], up, th, { w: 1, pass: 4 });
    for (const z of [0, ZT2]) { const c = at(z); const d = D.map((q) => q * tick); ln([c[0] - d[0], c[1] - d[1], z - tick], [c[0] + d[0], c[1] + d[1], z + tick], { w: 2 }); }
  });
  // construction box (faint) and the vertical center line
  M.part('CONSTRUCTION', () => {
    const o = { w: 0, pass: 0, occlude: true };
    const ov = 6 * k;
    const mb = M.info.mass || mainMass(M) || B;
    const X = [mb[0], mb[3]], Y = [mb[1], mb[4]], Z = [mb[2], mb[5]];
    for (const y of Y) for (const z of Z) M.line([[X[0] - ov, y, z], [X[1] + ov, y, z]], o);
    for (const x of X) for (const z of Z) M.line([[x, Y[0] - ov, z], [x, Y[1] + ov, z]], o);
    for (const x of X) for (const y of Y) M.line([[x, y, Z[0] - ov], [x, y, Z[1] + ov]], o);
    const cx = (mb[0] + mb[3]) / 2, cy = (mb[1] + mb[4]) / 2;
    M.line([[cx, cy, -10 * k], [cx, cy, ZT + 14 * k]], { w: 0, pass: 0, dash: 'chain', occlude: false });
    for (const c of M.info.centers || []) M.line(c, { w: 0, pass: 0, dash: 'chain', occlude: false });
  });
  if (vocab.float) {
    M.part('DROP LINES', () => {
      const pts = [[B[0], B[1], B[2]], [B[3], B[1], B[2]], [B[3], B[4], B[2]], [B[0], B[4], B[2]]];
      K.dropLines(M, vocab.drops || pts);
    });
  }
  void D2R;
}
