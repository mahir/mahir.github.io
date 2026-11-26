// Oslo: a color woodcut in Munch's manner, seen from the Ekeberg hill at a long
// sunset. The sky is cut in undulating bands that bend around a low sun; its
// pillar of light runs down the fjord. Across the water: Akershus Fortress on its
// point, City Hall's twin brick towers, the town and the hills with the Holmenkollen
// ski jump. Below: the Opera House's white slope, the leaning Munch Museum and the
// Barcode towers; then the dark slope of firs and wooden houses with a railed road.
// Every color is a block of wood: grain runs through it, and thin lines of paper
// show where the blocks meet. The name is cut out of the sky, so the paper shows.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, shade, mix } from '../kit.js';

const PAPER = '#efe5cf', INK = '#1c1a22', GRAPHITE = '#6e6862';
const FACE = '"Vollkorn SC", serif';

export const city = {
  id: 'oslo', name: 'Oslo', wall: '#1f2638',
  alt: 'A color woodcut of Oslo at a long sunset, seen from the Ekeberg hill: bands of red and orange sky bending around a low sun and its pillar of light on the fjord, Akershus Fortress on its point, City Hall\'s twin brick towers, the cathedral\'s green spire and the town, the Holmenkollen ski jump on the ridge, the Opera House\'s white sloping roof with people walking on it, the leaning Munch Museum and the Barcode towers, sailboats and a ferry, and below, firs, painted wooden houses and a road with a railing, the name cut out of the sky',
  google: 'family=Vollkorn+SC:wght@400;600;900',
  fonts: [['900 100px "Vollkorn SC"', 'OSLO'], ['600 100px "Vollkorn SC"', 'OSLOFJORDEN · NORGE'], ['400 100px "Vollkorn SC"', 'Oslofjorden, solnedgang · tresnitt · 7/40']],
  build,
};

// the printed image on the sheet, and the lines of the view
const X0 = 86, Y0 = 86, X1 = W - 86, Y1 = 1780;
const HZ = 832;      // the horizon over the open fjord
const SHORE = 1012;  // the far shore, under the town
const NEAR = 1296;   // the near shore, the Opera's foot
const SUN = { x: 430, y: 806, r: 76 };
const roadTop = (x) => lerp(1690, 1468, (x - X0) / (X1 - X0));
const roadBot = (x) => lerp(1790, 1548, (x - X0) / (X1 - X0));
// how wide the sun's pillar is at a height on the water
const pillarW = (y) => { const k = clamp((y - HZ) / (NEAR - HZ)); return 34 + 44 * Math.sin(Math.min(1, k * 1.25) * Math.PI * 0.62) - 22 * k * k; };

function build() {
  const p = new Plate({ paper: PAPER, seed: 1905 });
  const r = p.r;
  p.clip = { x: X0 - 6, y: Y0 - 6, w: X1 - X0 + 12, h: Y1 - Y0 + 12 };
  p.stack('sky', 'far', 'water', 'gouge', 'town', 'boats', 'opera', 'slope', 'near', 'title', 'frame', 'margin');
  p.layer('frame', { clip: false });
  p.layer('margin', { clip: false });

  frame(p, r);
  sky(p, r);
  hills(p, r);
  water(p, r);
  town(p, r);
  akershus(p, r);
  cityHall(p, r);
  bjorvika(p, r);
  opera(p, r);
  slope(p, r);
  firs(p, r);
  houses(p, r);
  boats(p, r);
  life(p, r);
  title(p, r);
  margin(p);
  // print each layer's blocks in the order they arrive
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

// ================================================================ the woodcut
// an edge cut by hand: long sides broken into short, slightly wandering cuts
function rough(r, pts, step = 16, amp = 1.8) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, n = Math.max(1, Math.round(L / step));
    const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    for (let k = 0; k < n; k++) {
      const j = k === 0 ? 0 : r.range(-amp, amp);
      out.push([lerp(a[0], b[0], k / n) + nx * j, lerp(a[1], b[1], k / n) + ny * j]);
    }
  }
  return out;
}

// the grain of a plank across a box: long wavy lines that bend around knots,
// broken into streaks, plus rings round each knot
function grainIn(r, b, o = {}) {
  const sp = o.sp ?? 9, amp = o.amp ?? 2.5, tilt = o.tilt ?? 0;
  const knots = [];
  const nk = o.knots ?? Math.round((b.w * b.h) / 70000);
  for (let i = 0; i < nk; i++) knots.push({ x: r.range(b.x, b.x + b.w), y: r.range(b.y, b.y + b.h), rx: r.range(26, 80), ry: r.range(6, 16) });
  const lines = [];
  for (let y0 = b.y - sp * 2; y0 < b.y + b.h + sp * 2; y0 += sp * r.range(0.55, 1.45)) {
    const f = r.range(0.003, 0.011), ph = r() * 7, a2 = r.range(0.3, 1) * amp;
    let line = [];
    for (let x = b.x - 14; x <= b.x + b.w + 14; x += 12) {
      let y = y0 + Math.sin(x * f + ph) * a2 + (x - b.x) * tilt;
      for (const k of knots) {
        const dy = y - k.y, dx = (x - k.x) / k.rx;
        if (Math.abs(dy) < k.ry * 5) y += Math.sign(dy || 1) * k.ry * 1.5 * Math.exp(-dx * dx) * Math.exp(-((dy / (k.ry * 2.4)) ** 2));
      }
      line.push([x, y]);
      if (line.length > 3 && r.chance(o.brk ?? 0.05)) { lines.push(line); line = []; x += r.range(0, 36); }
    }
    if (line.length > 1) lines.push(line);
  }
  for (const k of knots) {
    for (let j = 1; j <= 3; j++) {
      const ring = [];
      for (let a = 0; a <= 24; a++) ring.push([k.x + Math.cos(a / 24 * Math.PI * 2) * k.rx * 0.16 * j, k.y + Math.sin(a / 24 * Math.PI * 2) * k.ry * 0.33 * j]);
      lines.push(ring);
    }
  }
  return lines;
}

// a block of color: its cut outline, its grain (light streaks where the ink did
// not take, dark ones where it pooled), an ink edge and a paper gap if asked
function slab(r, pts, fill, o = {}) {
  const pr = o.smooth ? pts : rough(r, pts, o.step ?? 16, o.amp ?? 1.8);
  const b = boxOf(pr, 0);
  const grain = [];
  if (o.grain !== false) {
    const lt = [], dk = [];
    for (const l of grainIn(r, b, o)) (r.chance(o.light ?? 0.6) ? lt : dk).push(l);
    grain.push([lt, o.lc || 'rgba(239,229,207,.3)', o.lw ?? 1.6], [dk, o.dc || shade(fill, 0.8), o.dw ?? 1.2]);
  }
  return { pts: pr, fill, grain, ink: o.ink || 0, cut: o.cut || 0, box: boxOf(pr, 6 + (o.ink || 0) + (o.cut || 0)) };
}
function lines(c, ls) {
  c.beginPath();
  for (const l of ls) { c.moveTo(l[0][0], l[0][1]); for (let i = 1; i < l.length; i++) c.lineTo(l[i][0], l[i][1]); }
}
function drawSlab(c, s) {
  poly(c, s.pts); c.fillStyle = s.fill; c.fill();
  if (s.grain.length) {
    c.save(); poly(c, s.pts); c.clip();
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [ls, col, lw] of s.grain) { c.strokeStyle = col; c.lineWidth = lw; lines(c, ls); c.stroke(); }
    c.restore();
  }
  if (s.ink) { c.strokeStyle = INK; c.lineWidth = s.ink; c.lineJoin = 'round'; poly(c, s.pts); c.stroke(); }
  if (s.cut) { c.strokeStyle = PAPER; c.lineWidth = s.cut; c.lineJoin = 'round'; poly(c, s.pts); c.stroke(); }
}
function block(p, layer, s, o) { return p.group(layer, s.box, (c) => drawSlab(c, s), o); }
function blocks(p, layer, list, o) {
  const b = boxOf(list.flatMap((s) => [[s.box.x, s.box.y], [s.box.x + s.box.w, s.box.y + s.box.h]]), 0);
  return p.group(layer, b, (c) => { for (const s of list) drawSlab(c, s); }, o);
}
// a gouge: the lens a V-tool leaves, as part of a path
function gouge(c, x, y, L, w, bend = 0) {
  c.moveTo(x, y);
  c.quadraticCurveTo(x + L * 0.5, y - w + bend, x + L, y + bend * 0.4);
  c.quadraticCurveTo(x + L * 0.5, y + w + bend, x, y);
}
function fillGouges(c, gs, color) {
  c.fillStyle = color; c.beginPath();
  for (const g of gs) gouge(c, g[0], g[1], g[2], g[3], g[4] || 0);
  c.fill();
}
// a curve sampled across the image
function across(f, step = 16) { const pts = []; for (let x = X0 - 20; x <= X1 + 20; x += step) pts.push([x, f(x)]); return pts; }

// ================================================================ the sheet's edge
// the printed image ends in a ragged edge on the bare sheet
function frame(p, r) {
  const hole = rough(r, [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], 9, 2.6);
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.beginPath(); c.rect(0, 0, W, H); c.moveTo(hole[0][0], hole[0][1]); for (const q of hole) c.lineTo(q[0], q[1]); c.closePath();
    c.fillStyle = PAPER; c.fill('evenodd');
  }, { t: 0, d: 0.05, reveal: 'none' });
}

// ================================================================ the sky
const SKY = ['#1f2850', '#2c3263', '#4c3268', '#83304f', '#b52f2c', '#d4502a', '#e57b2e', '#efa53b', '#f5cc67'];
function sky(p, r) {
  const n = SKY.length, xs = [];
  for (let x = X0 - 20; x <= X1 + 20; x += 14) xs.push(x);
  // the band edges: waves, and arcs that rise over the sun
  const base = [Y0 - 40, 180, 282, 378, 468, 552, 630, 700, 760, HZ + 50];
  const edges = base.map((y0, i) => {
    if (i === 0 || i === n) return xs.map(() => y0);
    const a = r.range(10, 22), f = r.range(0.004, 0.008), ph = r() * 6, a2 = r.range(4, 10), f2 = r.range(0.012, 0.02), ph2 = r() * 6;
    const h = lerp(20, 95, i / n), sg = lerp(560, 380, i / n);
    return xs.map((x) => { const d = x - SUN.x; return y0 + a * Math.sin(x * f + ph) + a2 * Math.sin(x * f2 + ph2) + h * (1 - Math.exp(-(d * d) / (2 * sg * sg))) - h * 0.5; });
  });
  for (let i = 1; i < edges.length; i++) edges[i] = edges[i].map((y, j) => Math.max(y, edges[i - 1][j] + 18));
  for (let i = 0; i < n; i++) {
    const top = edges[i], bot = edges[i + 1];
    const pts = [...xs.map((x, j) => [x, top[j]]), ...xs.map((x, j) => [x, bot[j]]).reverse()];
    // grain that follows the band
    const lt = [], dk = [];
    const hmean = bot.reduce((s, y, j) => s + y - top[j], 0) / xs.length;
    const k = Math.max(3, Math.round(hmean / 6.5));
    for (let q = 0; q < k; q++) {
      const s = (q + 0.5) / k + r.range(-0.03, 0.03), ph = r() * 9, wob = r.range(0.6, 2.2);
      let line = [];
      for (let j = 0; j < xs.length; j++) {
        line.push([xs[j], lerp(top[j], bot[j], s) + Math.sin(xs[j] * 0.021 + ph) * wob]);
        if (line.length > 4 && r.chance(0.07)) { (r.chance(0.62) ? lt : dk).push(line); line = []; j += r.int(0, 3); }
      }
      if (line.length > 1) (r.chance(0.62) ? lt : dk).push(line);
    }
    // the thin paper line where this block meets the one above
    const seam = xs.map((x, j) => [x, top[j] + r.range(-0.8, 0.8)]);
    const col = SKY[i];
    p.group('sky', boxOf(pts, 8), (c) => {
      c.fillStyle = col; poly(c, pts); c.fill();
      c.lineCap = 'round';
      c.strokeStyle = i < 3 ? 'rgba(239,229,207,.16)' : 'rgba(250,236,200,.3)'; c.lineWidth = 1.7; lines(c, lt); c.stroke();
      c.strokeStyle = shade(col, 0.78); c.lineWidth = 1.3; lines(c, dk); c.stroke();
      if (i) { c.strokeStyle = PAPER; c.lineWidth = 2.6; lines(c, [seam]); c.stroke(); }
    }, { t: 0.3 + i * 0.2, d: 1.1, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  }
  // the sun: a pale disc whose rings are a knot in the wood
  const rings = [];
  for (let j = 1; j <= 6; j++) {
    const ring = [], ph = r() * 6;
    for (let a = 0; a <= 40; a++) { const t = (a / 40) * Math.PI * 2, rr = SUN.r * (j / 6.6) * (1 + 0.04 * Math.sin(t * 3 + ph)); ring.push([SUN.x + Math.cos(t) * rr, SUN.y + Math.sin(t) * rr * 0.94]); }
    rings.push(ring);
  }
  p.group('sky', { x: SUN.x - SUN.r - 10, y: SUN.y - SUN.r - 10, w: SUN.r * 2 + 20, h: SUN.r * 2 + 20 }, (c) => {
    c.fillStyle = PAPER; c.beginPath(); c.ellipse(SUN.x, SUN.y, SUN.r + 4, SUN.r * 0.94 + 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f8df92'; c.beginPath(); c.ellipse(SUN.x, SUN.y, SUN.r, SUN.r * 0.94, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(226,150,52,.55)'; c.lineWidth = 2; lines(c, rings); c.stroke();
  }, { t: 2.2, d: 1.0, reveal: 'iris', ease: 'soft' });
}

// ================================================================ the hills across the fjord
function hills(p, r) {
  // islands low on the open fjord
  const isl = [[X0 - 20, HZ + 6], [X0 - 20, HZ - 12], [150, HZ - 20], [240, HZ - 30], [300, HZ - 24], [360, HZ - 14], [420, HZ - 8], [470, HZ + 6]];
  const isl2 = [[560, HZ + 6], [590, HZ - 10], [650, HZ - 22], [700, HZ - 16], [740, HZ + 6]];
  block(p, 'far', slab(r, isl, '#43355f', { sp: 6, step: 10 }), { t: 2.4, d: 0.9, reveal: 'wipe' });
  block(p, 'far', slab(r, isl2, '#4a3a66', { sp: 6, step: 10 }), { t: 2.55, d: 0.8, reveal: 'wipeL' });
  // the high ridge behind the town, Holmenkollen on it
  const ridge = [[640, HZ + 6], [700, 812], [790, 786], [900, 760], [1000, 744], [1100, 730], [1200, 714], [1290, 700], [1350, 694], [1420, 702], [X1 + 20, 712], [X1 + 20, 960], [640, 960]];
  block(p, 'far', slab(r, ridge, '#363f6b', { sp: 8, dc: '#2b335a' }), { t: 2.6, d: 1.0, reveal: 'rise' });
  // the forest on the ridge's edge: a row of small spruce points
  const tips = [];
  const ridgeY = (x) => { for (let i = 1; i < 10; i++) if (x <= ridge[i + 1][0]) return lerp(ridge[i][1], ridge[i + 1][1], (x - ridge[i][0]) / (ridge[i + 1][0] - ridge[i][0])); return 712; };
  for (let x = 700; x < X1 + 10; x += r.range(5, 11)) {
    if (x > 1250 && x < 1370) continue;
    const y = ridgeY(x) + 3, h = r.range(7, 15);
    tips.push([x - h * 0.3, y, x, y - h, x + h * 0.3, y]);
  }
  p.group('far', { x: 690, y: 660, w: X1 - 670, h: 160 }, (c) => {
    c.fillStyle = '#2a3157'; c.beginPath();
    for (const t of tips) { c.moveTo(t[0], t[1]); c.lineTo(t[2], t[3]); c.lineTo(t[4], t[5]); }
    c.fill();
  }, { t: 3.1, d: 1.0, reveal: 'wipe' });
  // the ski jump: a slim tower, the long inrun curving down to the ridge, the landing hill below
  const inrun = [];
  for (let k = 0; k <= 12; k++) { const t = k / 12; inrun.push([lerp(1352, 1296, t), lerp(642, 694, t) - Math.sin(t * Math.PI) * 4]); }
  p.group('far', { x: 1230, y: 626, w: 140, h: 120 }, (c) => {
    c.fillStyle = '#b9b4c4';
    poly(c, [[1294, 698], [1252, 736], [1262, 740], [1306, 700]]); c.fill();
    c.fillStyle = '#4a4f78'; c.beginPath(); c.moveTo(inrun[0][0], inrun[0][1]);
    for (const q of inrun) c.lineTo(q[0], q[1] + 2);
    c.lineTo(1346, 700); c.closePath(); c.fill();
    c.strokeStyle = '#e8e2d6'; c.lineWidth = 2.6; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(inrun[0][0], inrun[0][1]); for (const q of inrun) c.lineTo(q[0], q[1]); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath();
    for (let k = 2; k < 12; k += 2) { c.moveTo(inrun[k][0], inrun[k][1] + 2); c.lineTo(inrun[k][0], 700); }
    c.moveTo(1349, 636); c.lineTo(1349, 700); c.moveTo(1356, 636); c.lineTo(1356, 700);
    c.stroke();
    c.fillStyle = INK; c.fillRect(1346, 632, 13, 7);
  }, { t: 3.5, d: 0.9, reveal: 'rise' });
  // the nearer hill the town stands on
  const near = [[700, 960], [700, 900], [780, 866], [900, 842], [1050, 828], [1200, 834], [1350, 812], [X1 + 20, 822], [X1 + 20, 960]];
  block(p, 'far', slab(r, near, '#2b4a4c', { sp: 7, dc: '#203c3e', cut: 2.2 }), { t: 3.3, d: 0.9, reveal: 'wipeL' });
}

// ================================================================ the fjord
function water(p, r) {
  const bands = [
    ['#5d6a98', HZ - 4, 892], ['#3d5c8c', 892, 1010], ['#24466f', 1010, NEAR + 60],
  ];
  bands.forEach(([col, ya, yb], i) => {
    const wa = (x) => ya + (i ? Math.sin(x * 0.006 + i) * 8 : 0), wb = (x) => yb + (i < 2 ? Math.sin(x * 0.005 + i * 2) * 10 : 0);
    const pts = [...across(wa, 24), ...across(wb, 24).reverse()];
    block(p, 'water', slab(r, pts, col, { smooth: true, sp: lerp(5, 8, i / 2), amp: 1.2, brk: 0.08, knots: 1, cut: i ? 2.2 : 0 }), { t: 2.8 + i * 0.3, d: 1.0, reveal: 'fall', ease: 'inOut' });
  });
  // the sun's pillar down the water, wavering at its sides
  const L = [], R = [];
  for (let y = HZ - 2; y <= NEAR + 10; y += 10) {
    const w = pillarW(y), wob = Math.sin(y * 0.07) * 5 + Math.sin(y * 0.19) * 3;
    L.push([SUN.x - w + wob, y]); R.push([SUN.x + w + wob * 0.6, y]);
  }
  const pil = slab(r, [...L, ...R.reverse()], '#f2c25a', { smooth: true, sp: 6, dc: '#e29a3a', lc: 'rgba(250,236,200,.4)', knots: 2 });
  block(p, 'water', pil, { t: 3.9, d: 1.2, reveal: 'fall', ease: 'inOut' });
  // the gouges: lenses cut across the water, short far off, long near
  const sets = [[], [], [], [], [], []], warm = [];
  for (let y = HZ + 3; y < NEAR + 40; y += 0) {
    const k = clamp((y - HZ) / (NEAR - HZ));
    const n = Math.round(lerp(14, 9, k));
    for (let i = 0; i < n; i++) {
      const x = r.range(X0 - 30, X1), Lg = lerp(10, 80, k) * r.range(0.5, 1.3), w = lerp(0.9, 3.4, k) * r.range(0.6, 1.2);
      const g = [x, y + r.range(-2, 2), Lg, w, r.range(-1, 1) * k * 3];
      if (Math.abs(x + Lg / 2 - SUN.x) < pillarW(y) - 6) warm.push(g);
      else sets[Math.min(5, Math.floor(k * 6))].push(g);
    }
    y += lerp(4, 13, k) * r.range(0.7, 1.3);
  }
  sets.forEach((gs, i) => {
    const b = boxOf(gs.flatMap((g) => [[g[0], g[1] - 6], [g[0] + g[2], g[1] + 6]]), 4);
    p.group('gouge', b, (c) => fillGouges(c, gs, 'rgba(239,229,207,.78)'), { t: 4.3 + i * 0.22, d: 1.0, reveal: i % 2 ? 'wipeL' : 'wipe' });
  });
  const wb = boxOf(warm.flatMap((g) => [[g[0], g[1] - 6], [g[0] + g[2], g[1] + 6]]), 4);
  p.group('gouge', wb, (c) => fillGouges(c, warm, 'rgba(196,76,36,.75)'), { t: 5.6, d: 1.0, reveal: 'fall' });
}

// ================================================================ the town across the water
const WALLS = ['#d9a441', '#c46a3c', '#e8dcc0', '#b9b3a2', '#8f4a35', '#d8c48e', '#a8b2a6', '#e3b98a'];
function town(p, r) {
  // the land the town stands on, down to the shore
  const land = [[500, SHORE + 8], [520, 990], [600, 968], [760, 950], [900, 930], [1100, 926], [1300, 930], [X1 + 20, 924], [X1 + 20, SHORE + 8]];
  block(p, 'town', slab(r, land, '#3d5a46', { sp: 6, cut: 2 }), { t: 3.8, d: 0.9, reveal: 'wipeL' });
  // the cathedral's tower and green spire, behind the town
  p.group('town', { x: 800, y: 790, w: 70, h: 180 }, (c) => {
    shape(c, [[818, 960], [818, 880], [846, 880], [846, 960]], '#b77a50', 1.6);
    shape(c, [[814, 880], [832, 800], [850, 880]], '#5f9c86', 1.6);
    c.fillStyle = INK; c.fillRect(826, 892, 4, 10); c.fillRect(834, 892, 4, 10);
    c.beginPath(); c.arc(832, 914, 5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(832, 800); c.lineTo(832, 790); c.stroke();
  }, { t: 4.1, d: 0.8, reveal: 'rise' });
  // three rows of houses and blocks, the far row first
  const rows = [{ base: 950, h: [24, 56], s: 0.66 }, { base: 980, h: [22, 50], s: 0.8 }, { base: 1010, h: [18, 40], s: 1 }];
  const all = [];
  rows.forEach((row, ri) => {
    for (let x = 770 + ri * 8; x < X1 + 10;) {
      const w = r.range(22, 46) * row.s;
      const skip = ri > 0 && x > 860 && x < 1112;
      if (!skip) {
        const h = r.range(row.h[0], row.h[1]), y = row.base + r.range(-2, 2);
        all.push({ x, y, w, h, col: r.pick(WALLS), roof: r.pick(['flat', 'gable', 'gable', 'hip']), rh: r.range(6, 14) * row.s, ri, win: r.range(0, 1) });
      }
      x += w + r.range(0, 3);
    }
  });
  // in chunks, so the town fills in from the left
  const chunks = 10;
  for (let k = 0; k < chunks; k++) {
    const set = all.filter((b) => Math.floor(((b.x - 770) / (X1 - 760)) * chunks) === k).sort((a, b) => a.ri - b.ri);
    if (!set.length) continue;
    const bx = boxOf(set.flatMap((b) => [[b.x - 4, b.y - b.h - b.rh - 6], [b.x + b.w + 4, b.y + 4]]), 2);
    p.group('town', bx, (c) => { for (const b of set) building(c, b); }, { t: 4.3 + k * 0.16, d: 0.8, reveal: 'rise' });
  }
  // round trees in front of the town, by the shore
  const trees = [];
  for (let i = 0; i < 26; i++) { const x = r.range(780, X1); if (x > 870 && x < 1110) continue; trees.push([x, SHORE - r.range(0, 8), r.range(6, 11)]); }
  p.group('town', { x: 760, y: SHORE - 40, w: X1 - 740, h: 50 }, (c) => {
    c.fillStyle = '#24402f';
    c.beginPath(); for (const [x, y, rr] of trees) { c.moveTo(x + rr, y - rr); c.arc(x, y - rr, rr, 0, Math.PI * 2); } c.fill();
    c.strokeStyle = 'rgba(160,190,120,.6)'; c.lineWidth = 1.4;
    c.beginPath(); for (const [x, y, rr] of trees) { c.moveTo(x + rr * 0.1, y - rr * 1.6); c.lineTo(x + rr * 0.6, y - rr * 1.1); } c.stroke();
  }, { t: 6.0, d: 0.7, reveal: 'fade' });
  // the quay at the foot of the town
  p.group('town', { x: 500, y: SHORE - 6, w: X1 - 480, h: 16 }, (c) => {
    c.fillStyle = '#9b927e'; c.fillRect(700, SHORE - 3, X1 - 680, 6);
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(700, SHORE + 3); c.lineTo(X1 + 20, SHORE + 3); c.stroke();
  }, { t: 6.2, d: 0.6, reveal: 'wipe' });
}
function shape(c, pts, fill, lw = 0, line = INK) {
  poly(c, pts); if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }
}
function building(c, b) {
  const { x, y, w, h, col } = b, top = y - h;
  c.fillStyle = col; c.fillRect(x, top, w, h);
  c.fillStyle = shade(col, 0.78); c.fillRect(x + w * 0.82, top, w * 0.18, h);
  // a roof
  c.fillStyle = b.roof === 'flat' ? '#3b3436' : b.ri === 2 && b.win > 0.5 ? '#8c3326' : '#2e2a30';
  if (b.roof === 'flat') c.fillRect(x - 1, top - 3, w + 2, 4);
  else if (b.roof === 'gable') { poly(c, [[x - 2, top], [x + w / 2, top - b.rh], [x + w + 2, top]]); c.fill(); }
  else { poly(c, [[x - 2, top], [x + w * 0.25, top - b.rh * 0.8], [x + w * 0.75, top - b.rh * 0.8], [x + w + 2, top]]); c.fill(); }
  // windows in rows
  c.fillStyle = INK; c.beginPath();
  const cols = Math.max(1, Math.floor(w / 8)), rowsN = Math.max(1, Math.floor((h - 6) / 9));
  for (let i = 0; i < rowsN; i++) for (let k = 0; k < cols; k++) c.rect(x + 3 + k * ((w - 5) / cols), top + 5 + i * 9, 2.4, 4);
  c.fill();
  c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x, top, w, h);
}

// ================================================================ Akershus on its point
function akershus(p, r) {
  const point = [[470, SHORE + 12], [500, 998], [560, 984], [640, 976], [740, 972], [800, 984], [820, SHORE + 12]];
  block(p, 'town', slab(r, point, '#4a5e3f', { sp: 6 }), { t: 4.8, d: 0.7, reveal: 'rise' });
  // the bastions: angled walls stepping down to the water
  const bast = [[478, SHORE + 10], [520, 996], [590, 990], [610, 1002], [700, 998], [720, 986], [790, 990], [812, SHORE + 10]];
  const stones = [];
  for (let y = 994; y < SHORE + 8; y += 5) stones.push([[480, y], [812, y]]);
  for (let i = 0; i < 70; i++) { const x = r.range(490, 806), y = r.range(994, SHORE + 6); stones.push([[x, y], [x, y + 4]]); }
  p.group('town', boxOf(bast, 6), (c) => {
    shape(c, bast, '#9a7c5e');
    c.save(); poly(c, bast); c.clip(); c.strokeStyle = 'rgba(60,40,30,.45)'; c.lineWidth = 0.9; lines(c, stones); c.stroke(); c.restore();
    shape(c, bast, null, 1.8);
  }, { t: 5.0, d: 0.7, reveal: 'rise' });
  // the castle: a pale hall under steep copper roofs, its towers with spires
  const COP = '#5f9c86', STONE = '#ece0c6';
  p.group('town', { x: 570, y: 820, w: 200, h: 180 }, (c) => {
    shape(c, [[590, 990], [590, 930], [738, 930], [738, 990]], STONE, 1.6);
    shape(c, [[586, 930], [604, 902], [722, 902], [742, 930]], COP, 1.6);
    // the towers
    shape(c, [[596, 990], [596, 888], [626, 888], [626, 990]], STONE, 1.6);
    shape(c, [[592, 888], [611, 842], [630, 888]], COP, 1.6);
    shape(c, [[690, 990], [690, 878], [716, 878], [716, 990]], STONE, 1.6);
    shape(c, [[686, 878], [703, 836], [720, 878]], COP, 1.6);
    shape(c, [[652, 930], [652, 892], [668, 892], [668, 930]], STONE, 1.4);
    shape(c, [[649, 892], [660, 864], [671, 892]], COP, 1.4);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(611, 842); c.lineTo(611, 830); c.moveTo(703, 836); c.lineTo(703, 824); c.stroke();
    // windows and the roofs' standing seams
    c.fillStyle = INK; c.beginPath();
    for (let x = 632; x < 686; x += 9) { c.rect(x, 942, 3, 7); c.rect(x, 962, 3, 7); }
    for (const tx of [604, 614, 698, 706]) { c.rect(tx, 900, 3, 7); c.rect(tx, 922, 3, 7); c.rect(tx, 950, 3, 7); }
    c.fill();
    c.strokeStyle = 'rgba(30,50,40,.5)'; c.lineWidth = 1; c.beginPath();
    for (let x = 610; x < 720; x += 7) { c.moveTo(x, 928); c.lineTo(x + (x - 664) * 0.12, 905); }
    c.stroke();
  }, { t: 5.3, d: 0.9, reveal: 'rise' });
}

// ================================================================ City Hall
function cityHall(p, r) {
  const BRICK = '#a5513a', base = SHORE - 4;
  // the low wings and the middle block between the towers
  const wing = slab(r, [[872, base], [872, 962], [1110, 962], [1110, base]], BRICK, { sp: 5, ink: 1.6, amp: 0.8, step: 30, knots: 0 });
  block(p, 'town', wing, { t: 5.5, d: 0.6, reveal: 'rise' });
  const mid = slab(r, [[946, base], [946, 922], [1036, 922], [1036, base]], '#b25d42', { sp: 5, ink: 1.6, amp: 0.8, step: 30, knots: 0 });
  block(p, 'town', mid, { t: 5.7, d: 0.6, reveal: 'rise' });
  p.group('town', { x: 868, y: 916, w: 248, h: 96 }, (c) => {
    c.fillStyle = '#2a2328'; c.beginPath();
    for (let x = 880; x < 940; x += 10) { c.rect(x, 970, 4, 9); c.rect(x, 986, 4, 9); }
    for (let x = 1044; x < 1104; x += 10) { c.rect(x, 970, 4, 9); c.rect(x, 986, 4, 9); }
    for (let x = 954; x < 1030; x += 12) c.rect(x, 934, 6, 52);
    c.fill();
    c.fillStyle = '#e8d8b6'; c.fillRect(946, 920, 90, 4); c.fillRect(872, 960, 238, 3);
  }, { t: 6.1, d: 0.5, reveal: 'fade' });
  // the two towers, the east one a little taller and carrying the clock
  [[892, 950, 772], [1032, 1090, 760]].forEach(([xa, xb, top], i) => {
    const tw = slab(r, [[xa, base], [xa, top], [xb, top], [xb, base]], BRICK, { sp: 5, ink: 2, amp: 0.9, step: 26, knots: 1, dc: '#87402d' });
    block(p, 'town', tw, { t: 5.8 + i * 0.3, d: 1.0, reveal: 'rise', ease: 'inOut' });
    p.group('town', { x: xa - 6, y: top - 16, w: xb - xa + 12, h: base - top + 20 }, (c) => {
      // the stone crown and its set-back cap
      shape(c, [[xa - 2, top + 8], [xa - 2, top - 2], [xb + 2, top - 2], [xb + 2, top + 8]], '#e3d1ad', 1.4);
      shape(c, [[xa + 6, top - 2], [xa + 6, top - 12], [xb - 6, top - 12], [xb - 6, top - 2]], '#c9b48e', 1.4);
      // tall slits of windows
      c.fillStyle = '#2a2328'; c.beginPath();
      for (let k = 0; k < 4; k++) for (let y = top + (i ? 70 : 30); y < base - 70; y += 22) c.rect(xa + 8 + k * ((xb - xa - 16) / 3.4), y, 4.5, 14);
      c.fill();
      if (i) {
        c.fillStyle = '#e8b64a'; c.beginPath(); c.arc((xa + xb) / 2, top + 36, 15, 0, Math.PI * 2); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
        c.beginPath(); c.moveTo((xa + xb) / 2, top + 36); c.lineTo((xa + xb) / 2 + 6, top + 29); c.moveTo((xa + xb) / 2, top + 36); c.lineTo((xa + xb) / 2 - 1, top + 26); c.stroke();
      }
    }, { t: 6.5 + i * 0.25, d: 0.6, reveal: 'fade' });
  });
}

// ================================================================ Bjørvika: the quay, the Barcode, the Munch Museum
function bjorvika(p, r) {
  const quay = [[960, NEAR + 4], [960, 1270], [X1 + 20, 1262], [X1 + 20, NEAR + 10]];
  block(p, 'opera', slab(r, quay, '#8e877a', { sp: 4, ink: 1.6, knots: 0 }), { t: 6.0, d: 0.7, reveal: 'wipe' });
  // the Barcode: a row of slim towers, each striped its own way
  const tows = [];
  for (let x = 1300; x < X1 + 10;) {
    const w = r.range(30, 48), h = r.range(120, 210);
    tows.push({ x, w, top: 1268 - h, col: ['#ebe6da', '#2d3038', '#c9a46a', '#9aa3a6', '#5e6a72', '#e2d6bc', '#7d3b2e'][tows.length % 7], kind: r.int(0, 2) });
    x += w + r.range(8, 16);
  }
  tows.forEach((tw, i) => {
    p.group('opera', { x: tw.x - 4, y: tw.top - 6, w: tw.w + 8, h: 1272 - tw.top + 8 }, (c) => {
      c.fillStyle = tw.col; c.fillRect(tw.x, tw.top, tw.w, 1268 - tw.top);
      const dark = ['#2d3038', '#5e6a72', '#7d3b2e'].includes(tw.col);
      c.strokeStyle = dark ? 'rgba(230,220,200,.6)' : 'rgba(40,40,50,.6)'; c.lineWidth = 1.5; c.beginPath();
      if (tw.kind === 0) for (let y = tw.top + 6; y < 1266; y += 8) { c.moveTo(tw.x, y); c.lineTo(tw.x + tw.w, y); }
      else if (tw.kind === 1) for (let x = tw.x + 4; x < tw.x + tw.w; x += 5) { c.moveTo(x, tw.top + 4); c.lineTo(x, 1266); }
      else for (let y = tw.top + 8; y < 1266; y += 12) for (let x = tw.x + 3; x < tw.x + tw.w - 3; x += 7) { c.moveTo(x, y); c.lineTo(x + 4, y); }
      c.stroke();
      c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(tw.x, tw.top, tw.w, 1268 - tw.top);
    }, { t: 6.2 + i * 0.1, d: 0.8, reveal: 'rise' });
  });
  // the Munch Museum: a tall pale tower whose top bows forward over the water
  const mm = [[1190, 1270], [1190, 1060], [1172, 990], [1236, 990], [1254, 1060], [1254, 1270]];
  const ribs = [];
  for (let k = 1; k < 9; k++) {
    const t = k / 9;
    ribs.push([[lerp(1190, 1254, t), 1268], [lerp(1190, 1254, t), 1060], [lerp(1172, 1236, t), 992]]);
  }
  p.group('opera', boxOf(mm, 10), (c) => {
    shape(c, mm, '#c8cdcb');
    shape(c, [[1254, 1270], [1254, 1060], [1236, 990], [1250, 996], [1268, 1064], [1268, 1270]], '#8f9796');
    c.strokeStyle = 'rgba(70,80,86,.55)'; c.lineWidth = 1.2; lines(c, ribs); c.stroke();
    c.fillStyle = '#3c4a56'; c.fillRect(1190, 1232, 64, 12);
    c.strokeStyle = INK; c.lineWidth = 2; poly(c, mm); c.stroke();
  }, { t: 6.6, d: 1.1, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the Opera House
function opera(p, r) {
  const WHITE = '#f3eee2', GRAY = '#d3d4cf', FY = 1162;
  // the long slope rising out of the water, the high roof, the front wall below it
  const slope = slab(r, [[256, NEAR], [640, FY], [700, FY + 8], [700, NEAR]], WHITE, { sp: 7, dc: '#c9c8c0', lc: 'rgba(255,255,255,.4)', amp: 1, step: 22, knots: 0, ink: 2 });
  block(p, 'opera', slab(r, [[640, FY], [1004, FY], [1004, NEAR], [640, NEAR]], GRAY, { sp: 6, dc: '#b8bab6', step: 22, amp: 1, knots: 0, ink: 2 }), { t: 6.9, d: 0.9, reveal: 'rise' });
  block(p, 'opera', slope, { t: 7.1, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // the fly tower over the stage, clad in ribbed panels
  const fly = [[704, FY + 2], [704, 1072], [884, 1072], [884, FY + 2]];
  p.group('opera', { x: 696, y: 1062, w: 210, h: 110 }, (c) => {
    shape(c, fly, '#ebe8e0');
    shape(c, [[884, FY + 2], [884, 1072], [904, 1080], [904, FY + 2]], '#a9aeae');
    c.strokeStyle = 'rgba(80,84,90,.45)'; c.lineWidth = 1; c.beginPath();
    for (let x = 710; x < 882; x += 6) { c.moveTo(x, 1076); c.lineTo(x, FY); }
    for (let y = 1090; y < FY; y += 22) for (let x = 712; x < 880; x += 24) { c.moveTo(x, y); c.lineTo(x + 10, y + 6); }
    c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2; poly(c, fly); c.stroke();
  }, { t: 7.6, d: 0.9, reveal: 'rise' });
  // the glass wall of the foyer, leaning back under the roof's edge
  const glass = [[664, FY + 6], [900, FY + 6], [886, NEAR - 6], [684, NEAR - 6]];
  p.group('opera', boxOf(glass, 6), (c) => {
    shape(c, glass, '#2f4b5e');
    c.save(); poly(c, glass); c.clip();
    c.fillStyle = 'rgba(242,194,90,.28)'; poly(c, [[700, FY], [760, FY], [700, NEAR], [660, NEAR]]); c.fill();
    c.strokeStyle = 'rgba(220,226,222,.6)'; c.lineWidth = 1.2; c.beginPath();
    for (let k = 0; k <= 14; k++) { const t = k / 14; c.moveTo(lerp(664, 900, t), FY + 6); c.lineTo(lerp(684, 886, t), NEAR - 6); }
    for (let y = FY + 30; y < NEAR - 6; y += 26) { c.moveTo(640, y); c.lineTo(920, y); }
    c.stroke(); c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.8; poly(c, glass); c.stroke();
  }, { t: 7.9, d: 0.8, reveal: 'fall' });
  // the marble's joints down the slope, and the white plinth at the water
  const joints = [];
  for (let k = 1; k < 16; k++) { const t = k / 16; joints.push([[lerp(256, 700, t), NEAR - 2], [lerp(256, 700, t) + (700 - lerp(256, 700, t)) * 0.0 + lerp(0, 0, t), NEAR - 2 - (lerp(256, 700, t) - 256) * 0.35]]); }
  p.group('opera', { x: 250, y: FY - 10, w: 460, h: NEAR - FY + 14 }, (c) => {
    c.strokeStyle = 'rgba(120,124,128,.45)'; c.lineWidth = 1; lines(c, joints); c.stroke();
    c.beginPath(); for (let k = 1; k < 8; k++) { const t = k / 8; c.moveTo(lerp(256, 640, t), lerp(NEAR, FY, t) + 3); c.lineTo(700, lerp(NEAR, FY, t) + 3 + (700 - lerp(256, 640, t)) * 0); } c.stroke();
  }, { t: 8.2, d: 0.7, reveal: 'wipe' });
  // people strolling up the roof
  const folk = [];
  for (let i = 0; i < 16; i++) {
    const onTop = i > 11, t = r.range(0.15, 0.95);
    const x = onTop ? r.pick([r.range(646, 698), r.range(912, 996)]) : lerp(256, 640, t);
    const y = onTop ? FY - 1 : lerp(NEAR, FY, t) - 1 + r.range(0, 6);
    folk.push([x, y, r.range(0.8, 1.15), r.pick([INK, '#8c2e26', '#26466e'])]);
  }
  p.group('opera', { x: 240, y: FY - 30, w: 780, h: NEAR - FY + 40 }, (c) => {
    for (const [x, y, s, col] of folk) {
      c.fillStyle = col; c.fillRect(x - 1.8 * s, y - 11 * s, 3.6 * s, 7 * s);
      c.fillStyle = INK; c.beginPath(); c.arc(x, y - 13 * s, 2.2 * s, 0, Math.PI * 2); c.fill();
      c.fillRect(x - 1.6 * s, y - 4.5 * s, 1.2 * s, 4.5 * s); c.fillRect(x + 0.4 * s, y - 4.5 * s, 1.2 * s, 4.5 * s);
    }
  }, { t: 8.5, d: 0.6, reveal: 'fade' });
}

// ================================================================ the slope of Ekeberg
function slope(p, r) {
  const top = (x) => 1326 - (x - X0) * 0.02 + Math.sin(x * 0.009) * 10 + Math.sin(x * 0.023) * 4;
  const hill = [...across(top, 20), [X1 + 20, Y1 + 20], [X0 - 20, Y1 + 20]];
  block(p, 'slope', slab(r, hill, '#2c4630', { smooth: true, sp: 8, dc: '#22392a', lc: 'rgba(160,190,110,.22)', knots: 4, cut: 2.4 }), { t: 8.0, d: 1.0, reveal: 'rise', ease: 'inOut' });
  // meadows of yellow-green between the trees
  const fields = [
    [[100, 1400], [260, 1380], [420, 1396], [520, 1450], [380, 1480], [180, 1470]],
    [[620, 1370], [820, 1352], [1000, 1366], [960, 1420], [760, 1430], [640, 1410]],
    [[1120, 1350], [1360, 1336], [1500, 1346], [1500, 1400], [1300, 1420], [1140, 1396]],
    [[140, 1540], [360, 1520], [520, 1556], [480, 1600], [260, 1610], [120, 1590]],
  ];
  fields.forEach((f, i) => block(p, 'slope', slab(r, f, i % 2 ? '#6f8a3e' : '#7f9445', { sp: 5, dc: '#5b7433', step: 18, amp: 3, knots: 0, cut: 2 }), { t: 8.3 + i * 0.12, d: 0.7, reveal: 'fade' }));
  // grass cut with a small gouge, the cuts running along the hill
  const grass = [];
  for (let i = 0; i < 420; i++) {
    const x = r.range(X0 - 10, X1), y = r.range(1340, Y1 + 10);
    if (y > roadTop(x) - 6 && y < roadBot(x) + 6) continue;
    const k = clamp((y - 1340) / 440);
    grass.push([x, y, lerp(10, 34, k) * r.range(0.6, 1.3), lerp(1, 2.2, k), r.range(-2, 2)]);
  }
  const gb = { x: X0 - 20, y: 1320, w: X1 - X0 + 40, h: Y1 - 1300 };
  p.group('slope', gb, (c) => fillGouges(c, grass, 'rgba(176,204,120,.42)'), { t: 8.6, d: 0.9, reveal: 'wipe' });
  // the road, slanting up across the foot of the print
  const road = [...across(roadTop, 30), ...across(roadBot, 30).reverse()];
  const rl = [];
  for (let k = 1; k < 9; k++) { const s = k / 9; rl.push(across((x) => lerp(roadTop(x), roadBot(x), s) + Math.sin(x * 0.03 + k) * 1.2, 24)); }
  p.group('slope', { x: X0 - 30, y: 1440, w: X1 - X0 + 60, h: 380 }, (c) => {
    c.fillStyle = '#c99a5c'; poly(c, road); c.fill();
    c.strokeStyle = 'rgba(140,96,50,.55)'; c.lineWidth = 1.4; lines(c, rl.map((l, i) => l.filter((q, j) => (j + i * 3) % 7 < 5))); c.stroke();
    c.strokeStyle = PAPER; c.lineWidth = 2.4; lines(c, [across(roadTop, 30)]); c.stroke();
  }, { t: 8.8, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // the railing along the road, its posts and two rails
  const posts = [];
  for (let x = X0 + 10; x < X1; x += 46) posts.push([[x, roadTop(x) + 2], [x, roadTop(x) - 44]]);
  const rails = [across((x) => roadTop(x) - 44, 30), across((x) => roadTop(x) - 22, 30)];
  p.strokes('slope', [...rails, ...posts], INK, 4, { t: 9.4, d: 1.0, reveal: 'wipe', ease: 'inOut', cap: 'butt' });
}

// ================================================================ firs
function firShape(x, y, h, r) {
  const n = Math.max(3, Math.round(h / 26)), w = h * 0.34;
  const R = [], L = [];
  for (let k = 0; k < n; k++) {
    const yb = y - h * 0.08 - (h * 0.9) * (1 - (k + 1) / n) * 0.98, ww = w * (0.35 + 0.65 * ((k + 1) / n));
    R.push([x + ww, yb + 2], [x + ww * 0.42, yb - h * 0.06]);
    L.push([x - ww * 0.42, yb - h * 0.06], [x - ww, yb + 2]);
  }
  const pts = [[x, y - h], ...R, [x + 3, y - h * 0.08], [x + 3, y], [x - 3, y], [x - 3, y - h * 0.08], ...L.reverse()];
  // light cuts on the side the sun is on
  const cuts = [];
  for (let k = 0; k < n * 3; k++) {
    const t = r.range(0.15, 0.95), yy = y - h + t * h * 0.88, ww = w * t * 0.8;
    const x0 = x - ww * r.range(0.2, 0.9);
    cuts.push([[x0, yy], [x0 - ww * 0.3, yy + h * 0.035]]);
  }
  return { pts, cuts, box: { x: x - w - 4, y: y - h - 4, w: 2 * w + 8, h: h + 8 } };
}
function firs(p, r) {
  const list = [];
  // a row along the brow of the hill, dark against the water
  for (let x = X0 + 10; x < X1; x += r.range(18, 48)) {
    if (x > 250 && x < 1010 && r.chance(0.55)) continue;
    list.push([x, 1336 + r.range(0, 30), r.range(50, 110)]);
  }
  // scattered on the slope above the road, missing the houses
  for (let i = 0; i < 70; i++) {
    const x = r.range(X0, X1), y = r.range(1380, roadTop(x) - 46);
    if (y < 1370 || HOUSES.some((h) => Math.abs(x - h[0]) < h[2] * 0.6 + 20 && y > h[1] - 120 && y < h[1] + 40)) continue;
    list.push([x, y, r.range(46, 100)]);
  }
  // big ones below the road
  for (let i = 0; i < 30; i++) {
    const x = r.range(X0 + 300, X1 + 30), y = roadBot(x) + r.range(90, 260);
    if (y > Y1 + 80) continue;
    list.push([x, y, r.range(130, 230)]);
  }
  list.sort((a, b) => a[1] - b[1]);
  const shapes = list.map(([x, y, h]) => ({ y, ...firShape(x, y, h, r) }));
  const chunk = 9;
  for (let i = 0; i < shapes.length; i += chunk) {
    const set = shapes.slice(i, i + chunk);
    const b = boxOf(set.flatMap((s) => [[s.box.x, s.box.y], [s.box.x + s.box.w, s.box.y + s.box.h]]), 2);
    const t = set[0].y > 1700 ? 9.9 + (i / chunk) * 0.05 : 8.6 + (i / chunk) * 0.14;
    p.group('near', b, (c) => {
      for (const s of set) {
        c.fillStyle = '#1b2e22'; poly(c, s.pts); c.fill();
        c.strokeStyle = 'rgba(138,176,104,.75)'; c.lineWidth = 1.8; c.lineCap = 'round'; lines(c, s.cuts); c.stroke();
      }
    }, { t, d: 0.8, reveal: 'rise' });
  }
}

// ================================================================ wooden houses
// [x, foot, width, kind, color]
const HOUSES = [
  [150, 1470, 118, 'gable', '#a3352a'], [310, 1446, 150, 'long', '#d79b3a'], [486, 1424, 100, 'gable', '#ece3cc'],
  [210, 1604, 160, 'long', '#ece3cc'], [410, 1584, 116, 'gable', '#8e2f27'], [590, 1556, 146, 'long', '#e5c870'],
  [770, 1520, 108, 'gable', '#d79b3a'], [790, 1410, 92, 'gable', '#7d93a0'], [940, 1430, 136, 'long', '#a3352a'],
  [1110, 1408, 100, 'gable', '#ece3cc'], [1270, 1396, 132, 'long', '#d79b3a'], [1440, 1400, 92, 'gable', '#a3352a'],
];
function house(c, hs) {
  const { x, y, w, h, rh, kind, col, wins, boards, chim } = hs, x0 = x - w / 2, x1 = x + w / 2, top = y - h;
  const ROOF = '#2a2426', TRIM = '#f3ecdc';
  c.lineJoin = 'round';
  if (kind === 'gable') {
    shape(c, hs.wall, col);
    c.strokeStyle = shade(col, 0.74); c.lineWidth = 1.1; lines(c, boards); c.stroke();
    if (chim) shape(c, [[x + w * 0.18, top - rh * 0.5], [x + w * 0.18, top - rh - 8], [x + w * 0.3, top - rh - 8], [x + w * 0.3, top - rh * 0.3]], '#6e2c22', 1.4);
    // the roof's two eaves, deep and dark
    c.strokeStyle = ROOF; c.lineWidth = 11; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(x0 - 10, top + 6); c.lineTo(x, top - rh); c.lineTo(x1 + 10, top + 6); c.stroke();
    c.strokeStyle = TRIM; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(x0 - 4, top + 8); c.lineTo(x, top - rh + 9); c.lineTo(x1 + 4, top + 8); c.stroke();
  } else {
    shape(c, hs.wall, col);
    c.strokeStyle = shade(col, 0.74); c.lineWidth = 1.1; lines(c, boards); c.stroke();
    shape(c, [[x0 - 10, top + 2], [x0 + 16, top - rh], [x1 - 16, top - rh], [x1 + 10, top + 2]], ROOF, 1.6);
    c.strokeStyle = 'rgba(239,229,207,.25)'; c.lineWidth = 1; c.beginPath();
    for (let yy = top - rh + 5; yy < top; yy += 5) { c.moveTo(x0 + 10, yy); c.lineTo(x1 - 10, yy); }
    c.stroke();
    if (chim) shape(c, [[x1 - 34, top - rh + 1], [x1 - 34, top - rh - 14], [x1 - 22, top - rh - 14], [x1 - 22, top - rh + 1]], '#6e2c22', 1.4);
  }
  // corner boards
  c.fillStyle = TRIM; c.fillRect(x0, top, 4, h); c.fillRect(x1 - 4, top, 4, h);
  // windows with white frames and crossbars; a door
  for (const [wx, wy, ww, wh, door] of wins) {
    c.fillStyle = TRIM; c.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
    c.fillStyle = door ? shade(col, 0.6) : '#26303a'; c.fillRect(wx, wy, ww, wh);
    if (!door) { c.fillStyle = TRIM; c.fillRect(wx + ww / 2 - 1, wy, 2, wh); c.fillRect(wx, wy + wh / 2 - 1, ww, 2); }
  }
  c.strokeStyle = INK; c.lineWidth = 1.8;
  poly(c, hs.wall);
  c.stroke();
}
function houses(p, r) {
  const list = HOUSES.map(([x, y, w, kind, col], i) => {
    const h = kind === 'gable' ? w * 0.62 : w * 0.42, rh = kind === 'gable' ? w * 0.42 : w * 0.24, top = y - h;
    const boards = [];
    for (let yy = top + 5; yy < y; yy += 5) boards.push([[x - w / 2, yy], [x + w / 2, yy]]);
    const wins = [];
    if (kind === 'gable') {
      wins.push([x - w * 0.32, top + h * 0.22, w * 0.18, h * 0.3], [x + w * 0.14, top + h * 0.22, w * 0.18, h * 0.3]);
      wins.push([x - w * 0.07, y - h * 0.42, w * 0.14, h * 0.42, true]);
      wins.push([x - w * 0.06, top - rh * 0.55, w * 0.12, rh * 0.3]);
    } else {
      const n = Math.round(w / 46);
      for (let k = 0; k < n; k++) wins.push([x - w / 2 + 14 + k * ((w - 28) / n), top + h * 0.22, w * 0.11, h * 0.42]);
      wins.push([x + w / 2 - 22, y - h * 0.62, 12, h * 0.62, true]);
    }
    return { x, y, w, h, rh, kind, col, wins, boards, chim: i % 3 !== 2, i, wall: rough(r, kind === 'gable' ? [[x - w / 2, y], [x - w / 2, top], [x, top - rh + 6], [x + w / 2, top], [x + w / 2, y]] : [[x - w / 2, y], [x - w / 2, top], [x + w / 2, top], [x + w / 2, y]], 10, 1.3) };
  });
  list.sort((a, b) => a.y - b.y).forEach((hs, k) => {
    p.group('near', { x: hs.x - hs.w / 2 - 16, y: hs.y - hs.h - hs.rh - 24, w: hs.w + 32, h: hs.h + hs.rh + 30 }, (c) => house(c, hs),
      { t: 9.0 + k * 0.1, d: 0.7, reveal: 'drop', dy: 20 });
  });
}

// ================================================================ boats
function sailboat(c, x, y, s, sail = '#efe5cf', hull = INK) {
  c.fillStyle = hull; poly(c, [[x - 22 * s, y - 6 * s], [x + 24 * s, y - 6 * s], [x + 16 * s, y + 2 * s], [x - 16 * s, y + 2 * s]]); c.fill();
  c.fillStyle = sail;
  poly(c, [[x + 1 * s, y - 64 * s], [x + 1 * s, y - 9 * s], [x + 24 * s, y - 9 * s]]); c.fill();
  poly(c, [[x - 2 * s, y - 54 * s], [x - 2 * s, y - 9 * s], [x - 20 * s, y - 9 * s]]); c.fill();
  c.strokeStyle = hull; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(x, y - 68 * s); c.lineTo(x, y - 6 * s); c.stroke();
}
function boats(p, r) {
  const fleet = [[200, 1000, 0.7, PAPER], [300, 1160, 1.0, PAPER], [436, 1046, 0.85, INK], [130, 1230, 1.1, '#e7c27a']];
  fleet.forEach(([x, y, s, sail], i) => {
    p.group('boats', { x: x - 30 * s, y: y - 74 * s, w: 60 * s, h: 82 * s }, (c) => {
      sailboat(c, x, y, s, sail, sail === INK ? '#1c1a22' : INK);
      c.fillStyle = 'rgba(239,229,207,.75)'; c.beginPath(); gouge(c, x - 30 * s, y + 6 * s, 60 * s, 2 * s); c.fill();
    }, { t: 9.9 + i * 0.12, d: 0.6, reveal: 'rise' });
  });
}

// ================================================================ the live things
function life(p, r) {
  // a ferry crossing slowly from the right, passing behind the Munch Museum
  p.live('boats', {
    t: 10.3, d: 1, reveal: 'fade',
    draw: (c, time) => {
      const x = 1470 - (time - 10.3) * 11, y = 1052;
      c.fillStyle = INK; poly(c, [[x - 46, y - 10], [x + 50, y - 10], [x + 40, y + 2], [x - 40, y + 2]]); c.fill();
      c.fillStyle = PAPER; c.fillRect(x - 32, y - 22, 64, 12); c.fillRect(x - 18, y - 30, 34, 8);
      c.fillStyle = INK; c.beginPath(); for (let k = 0; k < 7; k++) c.rect(x - 28 + k * 9, y - 19, 4, 4); c.fill();
      c.fillStyle = '#b52f2c'; c.fillRect(x + 4, y - 40, 9, 10);
      c.fillStyle = 'rgba(239,229,207,.8)'; c.beginPath(); gouge(c, x + 40, y + 4, 70, 2.2); c.fill();
    },
  });
  // a sailboat drifting on the open water
  p.live('boats', {
    t: 10.6, d: 1, reveal: 'fade',
    draw: (c, time) => {
      const x = 140 + (time - 10.6) * 4, y = 1212 + Math.sin(time * 1.3) * 1.2;
      sailboat(c, x, y, 0.9, '#efe5cf', INK);
    },
  });
  // light moving on the sun's pillar
  const glints = [];
  for (let i = 0; i < 9; i++) glints.push([r.range(HZ + 30, NEAR - 10), r() * 6, r.range(0.5, 1.1)]);
  p.live('gouge', {
    t: 10.5, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = 'rgba(250,236,200,.85)'; c.beginPath();
      for (const [y, ph, sp] of glints) {
        const w = pillarW(y), L = lerp(14, 50, (y - HZ) / (NEAR - HZ));
        const x = SUN.x - L / 2 + Math.sin(time * sp + ph) * (w - L / 2 - 6);
        gouge(c, x, y, L, lerp(1, 2.6, (y - HZ) / (NEAR - HZ)));
      }
      c.fill();
    },
  });
  // gulls wheeling over the fjord
  const gulls = [[760, 790, 0], [830, 820, 1.7], [690, 840, 3.1]];
  p.live('far', {
    t: 10.8, d: 1, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath();
      for (const [x0, y0, ph] of gulls) {
        const x = x0 + Math.sin(time * 0.25 + ph) * 120, y = y0 - 120 + Math.cos(time * 0.31 + ph) * 30, f = Math.sin(time * 5 + ph) * 4;
        c.moveTo(x - 11, y - 2 - f); c.quadraticCurveTo(x - 5, y - 6 - f, x, y); c.quadraticCurveTo(x + 5, y - 6 - f, x + 11, y - 2 - f);
      }
      c.stroke();
    },
  });
  // smoke from a chimney, cut as a wavering line
  p.live('near', {
    t: 11.0, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      const x = 310 + 75 - 28, y = 1446 - 63 - 36 - 16;
      c.strokeStyle = 'rgba(239,229,207,.7)'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
      for (let k = 0; k <= 16; k++) { const yy = y - k * 6, xx = x + Math.sin(k * 0.6 - time * 1.6) * (2 + k * 0.6) + k * 1.2; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
      c.stroke();
    },
  });
}

// ================================================================ the title
// OSLO cut out of the sky: the letters are bare paper with the wood's grain in them
function title(p, r) {
  const y = 470, size = 400;
  const res = p.type('title', 'OSLO', W / 2, y, { family: FACE, weight: 900, size, color: PAPER, align: 'center', track: 0.07, t: 11.0, gap: 0.3, d: 0.9, reveal: 'press' });
  res.glyphs.forEach((m, i) => {
    const ch = 'OSLO'.replace(/ /g, '')[i], b = m.box, f = `normal 900 ${res.size}px ${FACE}`, gx = b.x + res.size * 0.15;
    // the grain in the letter, made now so it is the same every frame
    const gl = grainIn(r, { x: b.x, y: b.y + size * 0.2, w: b.w, h: b.h * 0.8 }, { sp: 6.5, amp: 3, knots: 1, brk: 0.1 });
    const red = gl.filter(() => r.chance(0.18)), tan = gl.filter((l) => !red.includes(l));
    let img = null;
    m.draw = (c) => {
      if (!img) img = carve(ch, f, b, gx, y, tan, red);
      c.drawImage(img, b.x, b.y, b.w, b.h);
    };
  });
  p.type('title', 'OSLOFJORDEN · NORGE', W / 2, 560, { family: FACE, weight: 600, size: 40, color: PAPER, align: 'center', track: 0.42, t: 12.4, gap: 0.035, d: 0.5, reveal: 'fade' });
}
// a letter printed into its own small canvas: paper, then grain only where the letter is
function carve(ch, f, b, gx, y, tan, red) {
  const S = 2, cv = document.createElement('canvas');
  cv.width = Math.ceil(b.w * S); cv.height = Math.ceil(b.h * S);
  const c = cv.getContext('2d');
  c.scale(S, S); c.translate(-b.x, -b.y);
  c.font = f; c.textBaseline = 'alphabetic'; c.fillStyle = PAPER; c.fillText(ch, gx, y);
  c.globalCompositeOperation = 'source-atop';
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(150,112,74,.32)'; c.lineWidth = 1.5; lines(c, tan); c.stroke();
  c.strokeStyle = 'rgba(181,47,44,.32)'; c.lineWidth = 2.6; lines(c, red); c.stroke();
  return cv;
}

// ================================================================ the margin
// written in pencil under the print, as an artist numbers an edition
function margin(p) {
  const y = Y1 + 70;
  const note = (text, x, align, t) => p.group('margin', { x: align === 'right' ? x - 520 : align === 'center' ? x - 260 : x - 10, y: y - 40, w: 540, h: 60 }, (c) => {
    c.font = `normal 400 30px ${FACE}`; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillStyle = GRAPHITE; c.fillText(text, x, y);
  }, { t, d: 0.9, reveal: align === 'right' ? 'wipeL' : 'wipe' });
  note('Oslofjorden, solnedgang', X0 + 6, 'left', 12.9);
  note('tresnitt', W / 2, 'center', 13.2);
  note('7/40', X1 - 6, 'right', 13.4);
}
