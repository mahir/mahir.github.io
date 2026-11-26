// Melbourne: a plate from a Victorian illustrated book, a steel engraving colored
// by hand. First the plate is printed: every surface is cut in line, coursing on
// the lit walls, cross-hatching in the shade, contour lines round the dome, a ruled
// sky. Then the colorist washes it: ocher and brick on the station, copper on the
// dome, green and cream on the trams, a little blue in the sky. The view looks
// across the corner of Flinders and Swanston Streets to Flinders Street Station:
// the dome over the great arch with its row of clocks, the long front running off
// to the clock tower, trams under their wires, a hansom cab, people on the
// pavements. Below, the name in an engraved cartouche between two small round
// views, St Paul's Cathedral and the Exhibition Building, inside a rope border.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, poly, cloudPuffs, drawCloud, cloudBox } from '../kit.js';

const PAPER = '#f4ecd8', INK = '#211b17';
// the colorist's washes, laid on with multiply so the line shows through
const OCHRE = '#e9bd68', OCHRE_L = '#f1d79e', BRICK = '#cf7a5c', COPPER = '#86bfa2', GREEN = '#58a070', CREAM = '#f3e3b2';
const SKY = '#9cc0d6', STONE = '#dcc8a4', ROAD = '#cdbd9e', LEAF = '#9cbd7c', RED = '#d0644f', BLUE = '#7d9fc4', PLUM = '#a77a9a';
const DISPLAY = '"Libre Caslon Display", serif', TEXT = '"Libre Caslon Text", serif';

export const city = {
  id: 'melbourne', name: 'Melbourne', wall: '#22261f',
  alt: "A hand-colored steel engraving in the manner of a Victorian book plate, every surface cut in fine line: across the corner of Flinders and Swanston Streets, Flinders Street Station with its copper dome over the great arched entrance and the row of clocks beneath it, its long ocher and brick front of arched windows running down Flinders Street to the clock tower, green-and-cream trams under their wires, a hansom cab, gas lamps and people with parasols and top hats on the pavements, under a ruled sky with engraved clouds; below, the name MELBOURNE in an engraved cartouche between two round views of St Paul's Cathedral and the Royal Exhibition Building, inside a rope-twist border",
  google: 'family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital@0;1',
  fonts: [
    ['400 100px "Libre Caslon Display"', 'MELBOURNE'],
    ['italic 400 40px "Libre Caslon Text"', 'Flinders Street Station, from the corner of Swanston Street. St Paul’s Cathedral. The Exhibition Building.'],
    ['400 30px "Libre Caslon Text"', 'VICTORIA'],
  ],
  build,
};

// ================================================================ the view: a camera on the corner across from the station
const PIC = { x: 112, y: 112, w: W - 224, h: 1438 };
const CAM = { x: -26, y: 34, h: 5.5 };
const FX = 0.7, FY = -0.714, RX = 0.714, RY = 0.7, FOC = 1056, OX = 711, HY = 1127;
function P(X, Y, Z) {
  const dx = X - CAM.x, dy = Y - CAM.y, dep = dx * FX + dy * FY, lat = dx * RX + dy * RY;
  return [OX + (FOC * lat) / dep, HY - (FOC * (Z - CAM.h)) / dep];
}
const depthAt = (X, Y) => (X - CAM.x) * FX + (Y - CAM.y) * FY;
const kAt = (X, Y) => FOC / depthAt(X, Y);
const inPic = (c) => { c.beginPath(); c.rect(PIC.x, PIC.y, PIC.w, PIC.h); c.clip(); };
const PICBOX = { x: PIC.x - 2, y: PIC.y - 2, w: PIC.w + 4, h: PIC.h + 4 };

// a face in a plane: X fixed (the Swanston side) or Y fixed (the Flinders front)
const SW = { x: 0 }, FL = { y: 0 };
const Qf = (plane) => (plane.x != null ? (a, z) => P(plane.x, a, z) : (a, z) => P(a, plane.y, z));
function face(plane, a0, a1, z0, z1) { const Q = Qf(plane); return [Q(a0, z0), Q(a1, z0), Q(a1, z1), Q(a0, z1)]; }
function archIn(plane, a0, a1, z0, zs, n = 10) {
  const Q = Qf(plane), mid = (a0 + a1) / 2, rad = (a1 - a0) / 2, pts = [Q(a0, z0)];
  for (let k = 0; k <= n; k++) { const t = Math.PI - (k / n) * Math.PI; pts.push(Q(mid + Math.cos(t) * rad, zs + Math.sin(t) * Math.abs(rad) * 0.9)); }
  pts.push(Q(a1, z0));
  return pts;
}
// lines along a face at fixed heights (coursing), or up it at fixed places
function courses(plane, a0, a1, z0, z1, dz) { const Q = Qf(plane), out = []; for (let z = z0; z <= z1 + 1e-6; z += dz) out.push([Q(a0, z), Q(a1, z)]); return out; }
function uprights(plane, a0, a1, z0, z1, da) { const Q = Qf(plane), out = [], s = Math.sign(a1 - a0) || 1; for (let a = a0; s * (a1 - a) >= -1e-6; a += s * Math.abs(da)) out.push([Q(a, z0), Q(a, z1)]); return out; }

// ================================================================ the burin
// parallel cuts across a polygon at an angle, every so many units, as segments
// worked out once, at build time
function hatch(pts, ang, step, off = 0) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const rot = pts.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
  let v0 = Infinity, v1 = -Infinity;
  for (const [, v] of rot) { v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const out = [];
  for (let v = v0 + step * (0.5 + off); v < v1; v += step) {
    const xs = [];
    for (let i = 0, j = rot.length - 1; i < rot.length; j = i++) {
      const [ui, vi] = rot[i], [uj, vj] = rot[j];
      if ((vi > v) !== (vj > v)) xs.push(ui + ((v - vi) / (vj - vi)) * (uj - ui));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      out.push([[xs[k] * ca - v * sa, xs[k] * sa + v * ca], [xs[k + 1] * ca - v * sa, xs[k + 1] * sa + v * ca]]);
    }
  }
  return out;
}
function cut(c, segs, lw, col = INK) {
  c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath();
  for (const s of segs) { c.moveTo(s[0][0], s[0][1]); for (let i = 1; i < s.length; i++) c.lineTo(s[i][0], s[i][1]); }
  c.stroke();
}
function fillPts(c, pts, col) { c.fillStyle = col; poly(c, pts); c.fill(); }
function outline(c, pts, lw, close = true) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); if (close) c.closePath();
  c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke();
}
// the colorist: washes laid over the printed line, a little off register
const washes = [];
function wash(layer, shapes, color, alpha, box, t) { washes.push({ layer, shapes, color, alpha, box, t }); }
function laywashes(p) {
  washes.sort((a, b) => a.t - b.t);
  const path = (c, s, dx = 0, dy = 0) => { c.moveTo(s[0][0] + dx, s[0][1] + dy); for (let i = 1; i < s.length; i++) c.lineTo(s[i][0] + dx, s[i][1] + dy); c.closePath(); };
  for (const w of washes) {
    p.group(w.layer, w.box, (c) => {
      c.save(); inPic(c);
      c.globalCompositeOperation = 'multiply'; c.globalAlpha *= w.alpha; c.fillStyle = w.color;
      // each wash a little off register, but never off its own shape, and never over
      // what stands in front of it
      for (const item of w.shapes) {
        const s = item.pts || item;
        c.save();
        c.beginPath(); path(c, s); c.clip();
        if (item.ex && item.ex.length) { c.beginPath(); c.rect(0, 0, W, H); for (const e of item.ex) path(c, e); c.clip('evenodd'); }
        c.beginPath(); path(c, s, -2, 1.5); c.fill();
        c.restore();
      }
      c.restore();
    }, { t: w.t, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  }
  washes.length = 0;
}

function build() {
  const p = new Plate({ paper: PAPER, seed: 1854 });
  const r = p.r;
  p.stack('sheet', 'sky', 'clouds', 'far', 'swan', 'front', 'corner', 'dome', 'street', 'trams', 'people', 'wires', 'near', 'posts', 'live', 'title');
  for (const n of p.order) p.layer(n, { clip: false });
  border(p, r);
  sky(p, r);
  far(p, r);
  swanston(p, r);
  flinders(p, r);
  corner(p, r);
  dome(p, r);
  street(p, r);
  trams(p, r);
  people(p, r);
  wires(p, r);
  // the colorist's pass, plane by plane, once the plate is printed
  laywashes(p);
  cartouche(p, r);
  roundels(p, r);
  laywashes(p);
  title(p);
  life(p, r);
  return p;
}

// ================================================================ the border: rules and a rope twist
function border(p) {
  const rect = (i) => [[i, i], [W - i, i], [W - i, H - i], [i, H - i], [i, i - 1]];
  p.pen('sheet', rect(36), INK, 3.2, { t: 0, d: 1.2, cap: 'square' });
  p.pen('sheet', rect(46), INK, 1, { t: 0.2, d: 1.2, cap: 'square' });
  p.pen('sheet', rect(88), INK, 1, { t: 0.3, d: 1.2, cap: 'square' });
  // the rope: two twisted strands down each side, cut as crossing curves
  const sides = [[[46, 46], [W - 46, 46]], [[W - 46, 46], [W - 46, H - 46]], [[W - 46, H - 46], [46, H - 46]], [[46, H - 46], [46, 46]]];
  sides.forEach(([a, b], si) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len, nx = -uy, ny = ux;
    const strands = [], twists = [];
    const per = 26, amp = 15, mid = 21;
    for (const ph of [0, Math.PI]) {
      const L = [];
      for (let s = 0; s <= len; s += 3) { const o = mid + Math.sin((s / per) * Math.PI * 2 + ph) * amp * 0.85; L.push([a[0] + ux * s + nx * o, a[1] + uy * s + ny * o]); }
      strands.push(L);
    }
    // the twist's shading: short cuts across each lobe
    for (let s = 0; s < len; s += per / 2) for (let k = 2; k < 9; k += 2.2) {
      const ss = s + k, o0 = mid - amp * 0.7, o1 = mid + amp * 0.7;
      twists.push([[a[0] + ux * ss + nx * o0, a[1] + uy * ss + ny * o0], [a[0] + ux * (ss + 5) + nx * o1, a[1] + uy * (ss + 5) + ny * o1]]);
    }
    const bx = boxOf([a, b, [a[0] + nx * 44, a[1] + ny * 44], [b[0] + nx * 44, b[1] + ny * 44]], 4);
    p.group('sheet', bx, (c) => {
      c.save(); c.beginPath(); c.rect(46, 46, W - 92, H - 92); c.rect(88, 88, W - 176, H - 176); c.clip('evenodd');
      cut(c, twists, 0.8); cut(c, strands, 1.4);
      c.restore();
    }, { t: 0.5 + si * 0.3, d: 1.0, reveal: si % 2 ? 'fall' : 'wipe', ease: 'inOut' });
  });
  // corner blocks with a rosette
  [[46, 46], [W - 88, 46], [W - 88, H - 88], [46, H - 88]].forEach(([x, y], i) => {
    p.group('sheet', { x: x - 2, y: y - 2, w: 46, h: 46 }, (c) => {
      fillPts(c, [[x, y], [x + 42, y], [x + 42, y + 42], [x, y + 42]], PAPER);
      outline(c, [[x, y], [x + 42, y], [x + 42, y + 42], [x, y + 42]], 1.2);
      const cx = x + 21, cy = y + 21;
      c.strokeStyle = INK; c.lineWidth = 1;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.beginPath(); c.ellipse(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 7, 3.4, a, 0, Math.PI * 2); c.stroke(); }
      c.beginPath(); c.arc(cx, cy, 3.5, 0, Math.PI * 2); c.fillStyle = INK; c.fill();
    }, { t: 1.6 + i * 0.1, d: 0.6, reveal: 'pop' });
  });
  // the plate's own frame
  p.group('sheet', { x: PIC.x - 14, y: PIC.y - 14, w: PIC.w + 28, h: PIC.h + 28 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(PIC.x - 1, PIC.y - 1, PIC.w + 2, PIC.h + 2);
    c.lineWidth = 0.9; c.strokeRect(PIC.x - 8, PIC.y - 8, PIC.w + 16, PIC.h + 16);
  }, { t: 0.9, d: 1.0, reveal: 'fade' });
}

// ================================================================ the sky: ruled lines, closer at the top, engraved clouds
function sky(p, r) {
  const yTop = PIC.y, yBot = 1120;
  p.group('sky', PICBOX, (c) => { c.fillStyle = PAPER; c.fillRect(PIC.x, PIC.y, PIC.w, yBot - PIC.y + 40); }, { t: 0.6, d: 0.3, reveal: 'none' });
  const bands = [[], [], [], [], []];
  for (let y = yTop + 2, k = 0; y < yBot; k++) {
    const q = (y - yTop) / (yBot - yTop);
    bands[Math.min(4, Math.floor(q * 5))].push([[PIC.x, y], [PIC.x + PIC.w, y]]);
    y += lerp(3.4, 7.8, q ** 0.8);
  }
  bands.forEach((segs, i) => p.group('sky', { x: PIC.x, y: segs[0][0][1] - 3, w: PIC.w, h: segs[segs.length - 1][0][1] - segs[0][0][1] + 6 },
    (c) => cut(c, segs, lerp(1.05, 0.6, i / 4)), { t: 0.8 + i * 0.28, d: 0.7, reveal: 'fall' }));
  const clouds = [[150, 470, 430, 100], [930, 300, 480, 110], [1180, 610, 280, 62], [430, 690, 250, 52], [1260, 860, 200, 40]].map(([x, y, w, h]) => cloudPuffs(r, x, y, w, h));
  clouds.forEach((cl, i) => p.group('clouds', cloudBox(cl), (c) => {
    c.save(); inPic(c); drawCloud(c, cl, { line: INK, lw: 0.9, fill: PAPER, hatch: 'rgba(33,27,23,.75)', hlw: 0.7, step: 3.4, cover: 0.55 }); c.restore();
  }, { t: 2.1 + i * 0.2, d: 0.8, reveal: i % 2 ? 'wipeL' : 'wipe' }));
  // the wash: a pale blue, deeper overhead, gone by the rooftops
  const skyShapes = [];
  for (let k = 0; k < 6; k++) { const y0 = lerp(PIC.y, 1000, k / 6), y1 = lerp(PIC.y, 1000, (k + 1) / 6); skyShapes.push({ y0, y1, a: lerp(0.75, 0.15, k / 5) }); }
  skyShapes.forEach(({ y0, y1, a }, k) => wash('sky', [[[PIC.x + 2, y0], [PIC.x + PIC.w, y0], [PIC.x + PIC.w, y1 + 1], [PIC.x + 2, y1 + 1]]], SKY, a, { x: PIC.x, y: y0 - 4, w: PIC.w, h: y1 - y0 + 8 }, 9.6 + k * 0.08));
}

// ================================================================ far off: the gardens' elms beyond the Swanston side
function far(p, r) {
  const trees = [];
  for (let x = PIC.x - 30; x < 470; x += r.range(40, 70)) trees.push([x, r.range(820, 870), r.range(40, 64)]);
  const blobs = trees.map(([x, y, s]) => { const pts = []; for (let k = 0; k <= 22; k++) { const a = Math.PI + (k / 22) * Math.PI; const rr = s * (0.86 + 0.14 * Math.abs(Math.sin(k * 1.6 + x))); pts.push([x + Math.cos(a) * rr * 0.9, y + Math.sin(a) * rr * 1.1]); } pts.push([x + s * 0.9, 960], [x - s * 0.9, 960]); return pts; });
  const shade = blobs.flatMap((b, i) => hatch(b, 0.9, 2.6).filter((sg) => sg[0][0] + sg[1][0] > 2 * trees[i][0]));
  const curls = [];
  for (const [x, y, s] of trees) for (let i = 0; i < 18; i++) { const a = r.range(Math.PI, Math.PI * 2), d = r.range(0.2, 0.9) * s, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d; curls.push([[cx - 4, cy - 2], [cx - 2, cy + 1.5], [cx + 2, cy + 1.5], [cx + 4, cy - 2]]); }
  const box = { x: PIC.x, y: 720, w: 420, h: 250 };
  p.group('far', box, (c) => {
    c.save(); inPic(c);
    for (const b of blobs) fillPts(c, b, PAPER);
    cut(c, shade, 0.6); cut(c, curls, 0.9);
    for (const b of blobs) outline(c, b.slice(0, 23), 1, false);
    c.restore();
  }, { t: 2.6, d: 1.0, reveal: 'rise' });
  wash('far', blobs, LEAF, 0.7, box, 9.7);
}

// ================================================================ the station
const BANDS = [[7.4, 8.2], [13.6, 14.3], [19.2, 20.2]];
function swanston(p, r) {
  // the Swanston Street side: in shade, cut in close cross-hatching
  const a0 = -13, a1 = -110;
  const body = face(SW, a0, a1, 0, 21);
  const lines = [...courses(SW, a0, a1, 0.3, 21, 0.42), ...uprights(SW, a0, a1, 0, 21, 0.7)];
  const wins = [];
  for (let a = a0 - 3; a > a1 + 2; a -= 4.5) for (const [z0, zs] of [[1, 5.2], [9.2, 12.2], [15.2, 17.8]]) wins.push(archIn(SW, a, a - 2.2, z0, zs, 6));
  const box = boxOf(body, 6);
  p.group('swan', box, (c) => {
    c.save(); inPic(c);
    fillPts(c, body, PAPER);
    cut(c, lines, 0.75);
    c.fillStyle = INK; for (const w of wins) { poly(c, w); c.fill(); }
    cut(c, BANDS.flatMap(([z0, z1]) => [face(SW, a0, a1, z0, z0).slice(0, 2), face(SW, a0, a1, z1, z1).slice(0, 2)]), 1.3);
    outline(c, body, 1.6);
    c.restore();
  }, { t: 3.0, d: 1.3, reveal: 'rise', ease: 'inOut' });
  wash('swan', [body], OCHRE, 0.8, box, 9.8);
  wash('swan', BANDS.map(([z0, z1]) => face(SW, a0, a1, z0, z1)), BRICK, 0.8, box, 9.9);
}

const PAVS = [[54, 62], [104, 112]];
const TOWER = [150, 160];
function flinders(p, r) {
  // the long front along Flinders Street, in the sun: fine coursing, dark arches
  const sections = [[13, 40], [40, 80], [80, 130], [130, 200], [200, 330]];
  const allBody = [];
  sections.forEach(([a0, a1], si) => {
    const body = face(FL, a0, a1, 0, 21);
    allBody.push(body);
    const k = kAt((a0 + a1) / 2, 0);
    const dz = k > 14 ? 0.55 : k > 8 ? 0.9 : 1.6;
    const lines = courses(FL, a0, a1, 0.4, 21, dz);
    // the shade under each band and in the ground story's arcade
    const shadeL = [];
    for (const [zb] of BANDS) for (let z = zb - 0.12; z > zb - 1.1; z -= 0.2) shadeL.push(face(FL, a0, a1, z, z).slice(0, 2));
    const piers = uprights(FL, a0, a1, 0, 21, 6);
    const arches = [], wins = [];
    for (let a = a0 + 1.2; a + 3.6 < a1; a += 6) {
      arches.push(archIn(FL, a, a + 3.6, 0, 4.6, 8));
      wins.push(archIn(FL, a + 0.6, a + 1.6, 9.2, 12, 6), archIn(FL, a + 2.0, a + 3.0, 9.2, 12, 6), archIn(FL, a + 0.9, a + 2.7, 15.2, 17.6, 6));
    }
    const bal = uprights(FL, a0 + 0.35, a1, 20.2, 21, 0.7);
    const box = boxOf(body, 8);
    p.group('front', box, (c) => {
      c.save(); inPic(c);
      fillPts(c, body, PAPER);
      cut(c, lines, 0.6); cut(c, shadeL, 0.7);
      cut(c, piers, 1.1);
      cut(c, BANDS.flatMap(([z0, z1]) => [face(FL, a0, a1, z0, z0).slice(0, 2), face(FL, a0, a1, z1, z1).slice(0, 2)]), 1.2);
      c.fillStyle = INK; for (const w of [...arches, ...wins]) { poly(c, w); c.fill(); }
      if (k > 6) { c.strokeStyle = PAPER; c.lineWidth = 0.8; c.beginPath(); for (const a of arches) { const m = a[Math.floor(a.length / 2)]; c.moveTo(m[0], m[1] + 3); c.lineTo(m[0], a[0][1] - 2); } c.stroke(); }
      cut(c, bal, 0.8);
      outline(c, body, 1.4);
      c.restore();
    }, { t: 3.4 + si * 0.35, d: 1.1, reveal: 'rise', ease: 'inOut' });
    wash('front', [body], OCHRE, 0.75, box, 10.0 + si * 0.08);
    wash('front', BANDS.map(([z0, z1]) => face(FL, z0 === 7.4 ? a0 : a0, a1, z0, z1)), BRICK, 0.8, box, 10.05 + si * 0.08);
  });
  // the pavilions, taller, with small copper domes
  PAVS.forEach(([a0, a1], i) => {
    const body = face(FL, a0, a1, 0, 26.5);
    const mid = (a0 + a1) / 2, [mx, my] = P(mid, -0.5, 26.5), half = ((a1 - a0) / 2) * kAt(mid, -0.5) * 0.9;
    const dome = []; for (let k = 0; k <= 20; k++) { const t = Math.PI - (k / 20) * Math.PI; dome.push([mx + Math.cos(t) * half, my - Math.sin(t) ** 0.8 * half * 1.4]); }
    const ribs = []; for (let k = -3; k <= 3; k++) ribs.push([[mx + (k / 4) * half, my], [mx + (k / 4) * half * 0.6, my - half * 1.0], [mx, my - half * 1.4]]);
    const dshade = hatch(dome, Math.PI / 2, 2.2).filter((s) => s[0][0] > mx + half * 0.2);
    const box = { x: mx - half - 20, y: my - half * 1.6 - 30, w: 2 * half + 40, h: body[0][1] - my + half * 1.6 + 40 };
    p.group('front', box, (c) => {
      c.save(); inPic(c);
      fillPts(c, body, PAPER);
      cut(c, courses(FL, a0, a1, 0.4, 26.5, 0.7), 0.6);
      cut(c, BANDS.flatMap(([z0, z1]) => [face(FL, a0, a1, z0, z0).slice(0, 2), face(FL, a0, a1, z1, z1).slice(0, 2)]), 1.2);
      c.fillStyle = INK; poly(c, archIn(FL, a0 + 1.6, a1 - 1.6, 9, 16, 10)); c.fill(); poly(c, archIn(FL, a0 + 2.6, a1 - 2.6, 21.5, 23.8, 8)); c.fill();
      outline(c, body, 1.4);
      fillPts(c, dome, PAPER); cut(c, ribs, 0.8); cut(c, dshade, 0.7); outline(c, dome, 1.3);
      cut(c, [[[mx, my - half * 1.4], [mx, my - half * 1.4 - 14]]], 1.4);
      c.restore();
    }, { t: 4.8 + i * 0.3, d: 1.0, reveal: 'rise', ease: 'inOut' });
    wash('front', [body], OCHRE_L, 0.8, box, 10.3 + i * 0.1);
    wash('front', [dome], COPPER, 0.85, box, 10.35 + i * 0.1);
  });
  // the clock tower far along the front
  const [a0, a1] = TOWER;
  const tw = face(FL, a0, a1, 0, 40);
  const mid = (a0 + a1) / 2, k = kAt(mid, 0), [cx, cy] = P(mid, 0.6, 34), [tx, ty] = P(mid, 0.6, 40);
  const half = 5.6 * k;
  const cup = [[tx - half, ty], [tx - half, ty - half * 0.5], [tx - half * 0.7, ty - half * 1.2], [tx, ty - half * 1.6], [tx + half * 0.7, ty - half * 1.2], [tx + half, ty - half * 0.5], [tx + half, ty]];
  const box = { x: tx - 60, y: ty - 120, w: 120, h: tw[0][1] - ty + 130 };
  p.group('front', box, (c) => {
    c.save(); inPic(c);
    fillPts(c, tw, PAPER);
    cut(c, courses(FL, a0, a1, 0.4, 40, 0.8), 0.6);
    cut(c, [...BANDS, [26, 27]].flatMap(([z0, z1]) => [face(FL, a0, a1, z0, z0).slice(0, 2), face(FL, a0, a1, z1, z1).slice(0, 2)]), 1.1);
    c.fillStyle = INK; poly(c, archIn(FL, a0 + 2.5, a1 - 2.5, 28, 30, 6)); c.fill(); poly(c, archIn(FL, a0 + 3, a1 - 3, 14.6, 18, 6)); c.fill();
    outline(c, tw, 1.3);
    c.beginPath(); c.arc(cx, cy, 3.2 * k, 0, Math.PI * 2); c.fillStyle = PAPER; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    c.beginPath(); for (let h2 = 0; h2 < 12; h2++) { const a = (h2 / 12) * Math.PI * 2; c.moveTo(cx + Math.cos(a) * 2.5 * k, cy + Math.sin(a) * 2.5 * k); c.lineTo(cx + Math.cos(a) * 3 * k, cy + Math.sin(a) * 3 * k); } c.lineWidth = 1; c.stroke();
    c.lineWidth = 1.3; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - 2 * k); c.moveTo(cx, cy); c.lineTo(cx + 1.4 * k, cy + 0.6 * k); c.stroke();
    fillPts(c, cup, PAPER); cut(c, hatch(cup, Math.PI / 2, 2.2).filter((s) => s[0][0] > tx), 0.7); outline(c, cup, 1.3);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(tx, ty - half * 1.6); c.lineTo(tx, ty - half * 1.6 - 22); c.stroke();
    c.restore();
  }, { t: 5.4, d: 1.1, reveal: 'rise', ease: 'inOut' });
  wash('front', [tw], OCHRE_L, 0.8, box, 10.5);
  wash('front', [cup], COPPER, 0.85, box, 10.55);
}

// ================================================================ the corner: the great arch, the clocks, the twin turrets
const CH0 = [0, -13], CH1 = [13, 0];
const plane = (t, z) => P(lerp(CH0[0], CH1[0], t), lerp(CH0[1], CH1[1], t), z);
function corner(p, r) {
  const body = [plane(0, 0), plane(1, 0), plane(1, 26), plane(0, 26)];
  const arch = [plane(0.17, 0)];
  for (let k = 0; k <= 28; k++) { const a = Math.PI - (k / 28) * Math.PI; arch.push(plane(0.5 + Math.cos(a) * 0.33, 13 + Math.sin(a) * 8.6)); }
  arch.push(plane(0.83, 0));
  const band = [];
  for (let k = 0; k <= 28; k++) { const a = Math.PI - (k / 28) * Math.PI; band.push(plane(0.5 + Math.cos(a) * 0.33, 13 + Math.sin(a) * 8.6)); }
  for (let k = 28; k >= 0; k--) { const a = Math.PI - (k / 28) * Math.PI; band.push(plane(0.5 + Math.cos(a) * 0.38, 13 + Math.sin(a) * 9.9)); }
  const vous = [];
  for (let k = 1; k < 28; k++) { const a = Math.PI - (k / 28) * Math.PI; vous.push([plane(0.5 + Math.cos(a) * 0.33, 13 + Math.sin(a) * 8.6), plane(0.5 + Math.cos(a) * 0.38, 13 + Math.sin(a) * 9.9)]); }
  const win = [];
  for (let k = 0; k <= 18; k++) { const a = Math.PI - (k / 18) * Math.PI; win.push(plane(0.5 + Math.cos(a) * 0.26, 14.6 + Math.sin(a) * 5.4)); }
  const mull = [];
  for (let t = 0.28; t < 0.73; t += 0.045) mull.push([plane(t, 14.6), plane(t, 20.5)]);
  for (const z of [16.4, 18.3]) mull.push([plane(0.24, z), plane(0.76, z)]);
  const kk = kAt(6.5, -6.5);
  const clocks = []; for (let k = 0; k < 9; k++) clocks.push(plane(0.25 + (k / 8) * 0.5, 10.7));
  const board = [plane(0.21, 9.3), plane(0.79, 9.3), plane(0.79, 12.1), plane(0.21, 12.1)];
  const steps = []; for (let z = 0.3; z < 2.4; z += 0.4) steps.push([plane(0.18, z), plane(0.82, z)]);
  // the deep shade inside the arch: close verticals over close horizontals
  const inner = [...hatch(arch, Math.PI / 2, 2.2), ...hatch(arch, 0, 2.6)];
  const towers = [[0, 0.14], [0.86, 1]];
  const tBodies = towers.map(([t0, t1]) => [plane(t0, 0), plane(t1, 0), plane(t1, 29), plane(t0, 29)]);
  const tDomes = towers.map(([t0, t1]) => { const [mx, my] = plane((t0 + t1) / 2, 29), hw = Math.abs(plane(t1, 29)[0] - plane(t0, 29)[0]) / 2; const pts = []; for (let k = 0; k <= 16; k++) { const a = Math.PI - (k / 16) * Math.PI; pts.push([mx + Math.cos(a) * hw, my - Math.sin(a) ** 0.75 * hw * 1.5]); } return { pts, mx, my, hw }; });
  const box = boxOf([...body, ...tDomes.flatMap((d) => d.pts)], 30);
  p.group('corner', box, (c) => {
    c.save(); inPic(c);
    fillPts(c, body, PAPER);
    // the face between the turrets: horizontal coursing in the sun
    const cl = []; for (let z = 0.4; z < 26; z += 0.5) cl.push([plane(0, z), plane(1, z)]);
    cut(c, cl, 0.55);
    for (const [z0, z1] of [[7.4, 8.2], [19.2, 20.2], [24.5, 26]]) { const q = [plane(0, z0), plane(1, z0), plane(1, z1), plane(0, z1)]; fillPts(c, q, PAPER); cut(c, hatch(q, 0, 1.6), 0.6); outline(c, q, 1.1); }
    // the turrets
    tBodies.forEach((tb, i) => {
      const [t0, t1] = towers[i];
      fillPts(c, tb, PAPER);
      cut(c, hatch(tb, 0, i === 0 ? 1.5 : 2.2), 0.6);
      if (i === 0) cut(c, hatch(tb, Math.PI / 2, 2.4), 0.55);
      c.fillStyle = INK;
      poly(c, [plane(t0 + 0.035, 10), plane(t1 - 0.035, 10), plane(t1 - 0.035, 16), plane(t0 + 0.035, 16)]); c.fill();
      poly(c, [plane(t0 + 0.035, 22), plane(t1 - 0.035, 22), plane(t1 - 0.035, 26.5), plane(t0 + 0.035, 26.5)]); c.fill();
      outline(c, tb, 1.4);
      const d = tDomes[i];
      fillPts(c, d.pts, PAPER);
      const ribs = []; for (let k = -2; k <= 2; k++) ribs.push([[d.mx + (k / 3) * d.hw, d.my], [d.mx + (k / 3) * d.hw * 0.6, d.my - d.hw], [d.mx, d.my - d.hw * 1.5]]);
      cut(c, ribs, 0.8); cut(c, hatch(d.pts, Math.PI / 2, 2).filter((s) => s[0][0] > d.mx), 0.6); outline(c, d.pts, 1.3);
      cut(c, [[[d.mx, d.my - d.hw * 1.5], [d.mx, d.my - d.hw * 1.5 - 20]]], 1.4);
    });
    // the arch: shade, the archivolt's voussoirs, the great window, the clocks, the steps
    fillPts(c, arch, PAPER); cut(c, inner, 0.8);
    fillPts(c, band, PAPER); cut(c, vous, 0.9); cut(c, hatch(band, 0.3, 2.4), 0.5); outline(c, band, 1.1);
    outline(c, arch, 2, false);
    fillPts(c, win, PAPER); cut(c, hatch(win, 0.9, 3.6), 0.5); cut(c, mull, 1.1); outline(c, win, 1.4);
    fillPts(c, board, INK);
    for (const [x, y] of clocks) {
      c.beginPath(); c.arc(x, y, 0.85 * kk, 0, Math.PI * 2); c.fillStyle = PAPER; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
      c.beginPath(); c.arc(x, y, 0.68 * kk, 0, Math.PI * 2); c.lineWidth = 0.6; c.stroke();
    }
    cut(c, steps, 1);
    outline(c, body, 1.6);
    c.restore();
  }, { t: 5.9, d: 1.4, reveal: 'rise', ease: 'inOut' });
  // the clocks' hands, set at departure times
  const hands = clocks.map(([x, y], i) => { const a = (i * 1.7 + 0.4), b = (i * 0.9 + 2.1); return [[[x, y], [x + Math.cos(a) * 0.55 * kk, y + Math.sin(a) * 0.55 * kk]], [[x, y], [x + Math.cos(b) * 0.38 * kk, y + Math.sin(b) * 0.38 * kk]]]; }).flat();
  p.strokes('corner', hands, INK, 1.4, { t: 7.0, d: 0.6, reveal: 'fade' });
  wash('corner', [body, ...tBodies], OCHRE_L, 0.8, box, 10.2);
  wash('corner', [band, ...[[7.4, 8.2], [19.2, 20.2], [24.5, 26]].map(([z0, z1]) => ({ pts: [plane(0.14, z0), plane(0.86, z0), plane(0.86, z1), plane(0.14, z1)], ex: [arch, band] }))], BRICK, 0.85, box, 10.3);
  wash('corner', tDomes.map((d) => d.pts), COPPER, 0.85, box, 10.35);
  wash('corner', [win], '#c9d6cf', 0.7, box, 10.4);
}

// ================================================================ the dome
const DC = [11, -11];
function dome(p) {
  const k = kAt(DC[0], DC[1]), [cx] = P(DC[0], DC[1], 0);
  const Y = (z) => P(DC[0], DC[1], z)[1];
  const rd = 9.5 * k, yd0 = Y(26), yd1 = Y(31.5), ytop = Y(46);
  const drum = [[cx - rd, yd0], [cx + rd, yd0], [cx + rd, yd1], [cx - rd, yd1]];
  const cols = [];
  for (let k2 = -4; k2 <= 4; k2++) { const a = (k2 / 5) * (Math.PI / 2), x = cx + Math.sin(a) * rd * 0.94, w = Math.cos(a) * rd * 0.1; cols.push({ x, w }); }
  const dpts = [];
  for (let k2 = 0; k2 <= 48; k2++) { const t = k2 / 48, a = Math.PI - t * Math.PI; dpts.push([cx + Math.cos(a) * rd * (1 - 0.1 * Math.sin(t * Math.PI) ** 6), yd1 - 8 - Math.sin(a) ** 0.85 * (yd1 - 8 - ytop)]); }
  // the burin follows the form: ribs up the dome, rings round it, and the shade
  // down its far side cut along the ribs
  const ribs = [];
  for (let k2 = -9; k2 <= 9; k2++) { const s = Math.sin((k2 / 10) * Math.PI / 2); const L = []; for (let i = 0; i <= 20; i++) { const t = i / 20, y = lerp(yd1 - 8, ytop, t), w = Math.cos(t * Math.PI / 2) ** 0.75; L.push([cx + s * rd * w, y]); } ribs.push(L); }
  const rings = [];
  for (let i = 1; i < 9; i++) { const t = i / 9, y = lerp(yd1 - 8, ytop, t ** 0.9), w = rd * Math.cos(t * Math.PI / 2) ** 0.75, L = []; for (let j = 0; j <= 24; j++) { const a = Math.PI * (j / 24); L.push([cx - Math.cos(a) * w, y + Math.sin(a) * w * 0.12]); } rings.push(L); }
  const shadeL = [];
  for (let k2 = 0; k2 < 26; k2++) { const s = lerp(0.15, 1, k2 / 25); const L = []; for (let i = 0; i <= 20; i++) { const t = i / 20, y = lerp(yd1 - 8, ytop, t), w = Math.cos(t * Math.PI / 2) ** 0.75; L.push([cx + s * rd * w, y]); } shadeL.push(L); }
  const drumShade = hatch([[cx + rd * 0.3, yd0], [cx + rd, yd0], [cx + rd, yd1], [cx + rd * 0.3, yd1]], Math.PI / 2, 2.2);
  const drumLines = []; for (let y = yd1 + 3; y < yd0; y += 3) drumLines.push([[cx - rd, y], [cx + rd, y]]);
  const ly = ytop + 4, lw = rd * 0.16, lh = rd * 0.34;
  const lantern = [[cx - lw, ly], [cx + lw, ly], [cx + lw, ly - lh], [cx - lw, ly - lh]];
  const cap = [[cx - lw * 1.3, ly - lh], [cx - lw * 0.9, ly - lh * 1.6], [cx, ly - lh * 2.0], [cx + lw * 0.9, ly - lh * 1.6], [cx + lw * 1.3, ly - lh]];
  const box = { x: cx - rd - 40, y: ytop - 130, w: 2 * rd + 80, h: yd0 - ytop + 140 };
  p.group('dome', box, (c) => {
    c.save(); inPic(c);
    fillPts(c, drum, PAPER); cut(c, drumLines, 0.5); cut(c, drumShade, 0.6);
    c.fillStyle = INK;
    for (const { x, w } of cols) { c.beginPath(); c.moveTo(x - w, yd0 - 6); c.lineTo(x - w, yd1 + 16); c.arc(x, yd1 + 16, w, Math.PI, 0); c.lineTo(x + w, yd0 - 6); c.closePath(); c.fill(); }
    outline(c, drum, 1.4);
    const cornice = [[cx - rd - 7, yd1], [cx + rd + 7, yd1], [cx + rd + 7, yd1 - 8], [cx - rd - 7, yd1 - 8]];
    fillPts(c, cornice, PAPER); cut(c, hatch(cornice, 0, 1.8), 0.6); outline(c, cornice, 1.2);
    fillPts(c, dpts, PAPER);
    c.save(); poly(c, dpts); c.clip();
    cut(c, ribs, 0.9); cut(c, rings, 0.6); cut(c, shadeL, 0.6);
    c.restore();
    outline(c, dpts, 1.7);
    fillPts(c, lantern, PAPER); cut(c, hatch(lantern, Math.PI / 2, 2), 0.5);
    c.fillStyle = INK; for (const dx of [-0.55, 0.15]) c.fillRect(cx + dx * lw, ly - lh * 0.85, lw * 0.32, lh * 0.6);
    outline(c, lantern, 1.2);
    fillPts(c, cap, PAPER); cut(c, hatch(cap, Math.PI / 2, 1.8).filter((s) => s[0][0] > cx), 0.6); outline(c, cap, 1.2);
    cut(c, [[[cx, ly - lh * 2.0], [cx, ly - lh * 2.9]]], 2);
    c.beginPath(); c.arc(cx, ly - lh * 2.2, 3.5, 0, Math.PI * 2); c.fillStyle = PAPER; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
    c.restore();
  }, { t: 6.6, d: 1.4, reveal: 'rise', ease: 'inOut' });
  wash('dome', [dpts, cap], COPPER, 0.9, box, 10.45);
  wash('dome', [drum, lantern], OCHRE_L, 0.8, box, 10.5);
}

// ================================================================ the street: roadway, setts, rails, curbs, lamps
function street(p, r) {
  const bot = PIC.y + PIC.h;
  const road = [[PIC.x, P(-80, 3, 0)[1]], P(-80, 3, 0), P(0, 3, 0), P(500, 3, 0), [PIC.x + PIC.w, P(500, 3, 0)[1]], [PIC.x + PIC.w, bot], [PIC.x, bot]];
  const pave = [P(-3, -13, 0), P(-3, 3, 0), P(500, 3, 0), P(500, 0, 0), P(13, 0, 0), P(0, -13, 0), P(0, -140, 0), P(-3, -140, 0)];
  // the roadway ruled across, closer far off; the setts' joints along it
  const rule = [];
  for (let y = HY + 4, s = 2.2; y < bot; y += s, s *= 1.025) rule.push([[PIC.x, y], [PIC.x + PIC.w, y]]);
  // wheel ruts worn along the lanes
  const ruts = [];
  for (const Y of [6.5, 8.2, 21.5, 23.4, 26.8]) { const L = []; for (let X = -60; X <= 500; X += X < 60 ? 3 : 20) L.push(P(X, Y, 0)); ruts.push(L); }
  const flags = [];
  for (let X = 0; X < 500; X += 1.6) flags.push([P(X, 0, 0), P(X, 3, 0)]);
  for (let Y = -140; Y < -13; Y += 1.6) flags.push([P(0, Y, 0), P(-3, Y, 0)]);
  const box = { x: PIC.x, y: HY - 4, w: PIC.w, h: bot - HY + 6 };
  p.group('street', box, (c) => {
    c.save(); inPic(c);
    fillPts(c, road, PAPER);
    cut(c, rule, 0.5); cut(c, ruts, 0.45);
    fillPts(c, pave, PAPER); cut(c, flags, 0.7); outline(c, pave, 1.2);
    c.restore();
  }, { t: 7.0, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // the station's shadow over the Swanston pavement and the corner
  const shadow = [P(0, -140, 0), P(0, -13, 0), P(-6, -10, 0), P(-6, -140, 0)];
  p.group('street', boxOf(shadow, 6), (c) => { c.save(); inPic(c); cut(c, hatch(shadow, 0.25, 2.4), 0.8); c.restore(); }, { t: 7.5, d: 0.6, reveal: 'fade' });
  // the rails
  const rails = [];
  for (const y of [11.2, 12.6, 16.4, 17.8]) { const L = []; for (let X = -40; X <= 500; X += X < 40 ? 2 : 10) L.push(P(X, y, 0)); rails.push(L); }
  for (const x of [-12.2, -13.6, -16.4, -17.8]) { const L = []; for (let Y = -140; Y <= 32; Y += 2) L.push(P(x, Y, 0)); rails.push(L); }
  p.strokes('street', rails, INK, 1.5, { t: 7.6, d: 0.9, reveal: 'wipe', box });
  wash('street', [road], ROAD, 0.6, box, 10.6);
  wash('street', [pave], STONE, 0.6, box, 10.65);
}

// ================================================================ the trams: green and cream, engraved and washed
function tram(X0, Y0, len, alongY) {
  // returns the shapes of a tram running along Flinders (X) or Swanston (Y) Street
  const w = 1.35, zb = 0.45, zw0 = 1.6, zw1 = 2.7, zr = 3.2, zt = 3.6;
  let side, end, roof, k;
  if (!alongY) {
    const nearY = Y0 + w;
    side = (z0, z1) => face({ y: nearY }, X0, X0 + len, z0, z1);
    end = (z0, z1) => face({ x: X0 }, Y0 - w, nearY, z0, z1);
    roof = [P(X0, Y0 - w + 0.2, zr), P(X0, nearY - 0.2, zr), P(X0 + len, nearY - 0.2, zr), P(X0 + len, nearY - 0.2, zt), P(X0, nearY - 0.2, zt), P(X0, Y0 - w + 0.2, zt)];
    k = kAt(X0, nearY);
  } else {
    const sideX = X0 - w, endY = Y0 + len;
    side = (z0, z1) => face({ x: sideX }, Y0, endY, z0, z1);
    end = (z0, z1) => face({ y: endY }, X0 - w, X0 + w, z0, z1);
    roof = [P(sideX + 0.2, Y0, zr), P(sideX + 0.2, endY, zr), P(X0 + w - 0.2, endY, zr), P(X0 + w - 0.2, endY, zt), P(sideX + 0.2, endY, zt), P(sideX + 0.2, Y0, zt)];
    k = kAt(X0, endY);
  }
  const panes = [], A0 = alongY ? Y0 : X0, Q = alongY ? (a, z) => P(X0 - w, a, z) : (a, z) => P(a, Y0 + w, z);
  for (let a = A0 + 0.6; a < A0 + len - 1; a += 1.45) panes.push([Q(a, zw0 + 0.15), Q(a + 1.0, zw0 + 0.15), Q(a + 1.0, zw1 - 0.12), Q(a, zw1 - 0.12)]);
  const door = [Q(A0 + len * 0.42, zb + 0.1), Q(A0 + len * 0.58, zb + 0.1), Q(A0 + len * 0.58, zw1), Q(A0 + len * 0.42, zw1)];
  const pole = alongY ? [P(X0, Y0 + len * 0.4, zt), P(X0, Y0 + len * 0.4 - 4.5, 6.2)] : [P(X0 + len * 0.6, Y0, zt), P(X0 + len * 0.6 - 4.5, Y0, 6.2)];
  const shadowPts = alongY ? [P(X0 - w - 0.9, Y0, 0), P(X0 + w, Y0, 0), P(X0 + w, Y0 + len + 0.6, 0), P(X0 - w - 0.9, Y0 + len + 0.6, 0)]
    : [P(X0, Y0 - w, 0), P(X0 + len, Y0 - w, 0), P(X0 + len, Y0 + w + 0.9, 0), P(X0 - 0.6, Y0 + w + 0.9, 0)];
  return { side, end, roof, panes, door, pole, k, shadowPts, zb, zw0, zw1, zr, alongY };
}
function drawTram(c, t) {
  const { side, end, roof, zb, zw0, zw1, zr } = t;
  cut(c, hatch(t.shadowPts, 0, 2), 0.9);
  for (const f of [end, side]) {
    const all = f(zb, zr);
    fillPts(c, all, PAPER);
    const isEnd = f === (t.alongY ? side : end);
    cut(c, hatch(f(zb, zw0), Math.PI / 2, isEnd ? 1.6 : 2.4), 0.7);
    cut(c, hatch(f(zw1, zr), Math.PI / 2, isEnd ? 1.6 : 2.4), 0.7);
    if (isEnd) cut(c, hatch(f(zw0, zw1), 0, 2.2), 0.5);
    outline(c, all, 1.3);
    cut(c, [f(zw0, zw0).slice(0, 2), f(zw1, zw1).slice(0, 2)], 1);
  }
  fillPts(c, roof, PAPER); cut(c, hatch(roof, 0, 1.8), 0.6); outline(c, roof, 1.1);
  c.fillStyle = INK; for (const q of t.panes) { poly(c, q); c.fill(); }
  fillPts(c, t.door, INK);
  cut(c, [t.pole], Math.max(1.2, 0.08 * t.k));
}
function trams(p) {
  const list = [
    { t: tram(-14.8, -18, 15, true), at: 8.0, dy: 40 },
    { t: tram(-2, 17.1, 15, false), at: 8.3, dx: -60 },
    { t: tram(40, 11.9, 14, false), at: 8.5, dx: 60 },
  ];
  list.forEach(({ t, at, dx, dy }) => {
    const box = boxOf([...t.side(0, 7), ...t.end(0, 7), ...t.shadowPts, ...t.pole], 20);
    p.group('trams', box, (c) => { c.save(); inPic(c); drawTram(c, t); c.restore(); }, { t: at, d: 0.9, reveal: 'slide', dx: dx || 0, dy: dy || 0, ease: 'out' });
    wash('trams', [t.side(t.zb, t.zw0), t.side(t.zw1, t.zr), t.end(t.zb, t.zw0), t.end(t.zw1, t.zr)], GREEN, 0.85, box, 10.7);
    wash('trams', [t.side(t.zw0, t.zw1), t.end(t.zw0, t.zw1)], CREAM, 0.9, box, 10.75);
  });
}

// ================================================================ people, a cab and a dog
function figure(f) {
  // the shapes of one person, in sheet units, at (X, Y) on the ground
  const [x, y] = P(f.X, f.Y, 0), k = kAt(f.X, f.Y), h = 1.75 * k * f.size, w = h * 0.25;
  const parts = { x, y, h, w };
  if (f.skirt) parts.coat = [[x - w * 1.0, y], [x - w * 0.5, y - h * 0.5], [x - w * 0.42, y - h * 0.82], [x + w * 0.42, y - h * 0.82], [x + w * 0.5, y - h * 0.5], [x + w * 1.0, y]];
  else parts.coat = [[x - w * 0.55, y - h * 0.4], [x - w * 0.5, y - h * 0.82], [x + w * 0.5, y - h * 0.82], [x + w * 0.55, y - h * 0.4], [x + w * 0.3, y - h * 0.36], [x - w * 0.3, y - h * 0.36]];
  parts.legs = f.skirt ? null : [[[x - w * 0.22, y - h * 0.4], [x - w * 0.25, y]], [[x + w * 0.22, y - h * 0.4], [x + w * 0.3 * f.stride, y]]];
  return parts;
}
function drawFigure(c, f) {
  const { x, y, h, w, coat, legs } = figure(f);
  c.lineJoin = 'round';
  // the shadow at the feet
  cut(c, [[[x - w * 0.5, y + 1], [x + w * 2.2, y - h * 0.04]], [[x - w * 0.3, y + 2.5], [x + w * 1.6, y + 0.5]]], Math.max(0.7, h * 0.012));
  if (legs) cut(c, legs, Math.max(1, w * 0.32));
  fillPts(c, coat, PAPER);
  cut(c, hatch(coat, f.dark ? 0.3 : Math.PI / 2, f.dark ? 1.4 : 2.2), Math.max(0.5, h * 0.01));
  outline(c, coat, Math.max(0.8, h * 0.016));
  c.beginPath(); c.arc(x, y - h * 0.89, h * 0.075, 0, Math.PI * 2); c.fillStyle = PAPER; c.fill(); c.strokeStyle = INK; c.lineWidth = Math.max(0.7, h * 0.014); c.stroke();
  c.fillStyle = INK;
  if (f.hat === 0) { c.fillRect(x - h * 0.065, y - h * 1.07, h * 0.13, h * 0.13); c.fillRect(x - h * 0.11, y - h * 0.955, h * 0.22, h * 0.02); }
  else if (f.hat === 1) { c.beginPath(); c.arc(x, y - h * 0.945, h * 0.075, Math.PI, 0); c.fill(); c.fillRect(x - h * 0.11, y - h * 0.95, h * 0.22, h * 0.018); }
  else if (f.hat === 2) { c.beginPath(); c.ellipse(x, y - h * 0.955, h * 0.15, h * 0.028, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x, y - h * 0.96, h * 0.06, Math.PI, 0); c.fill(); }
  if (f.brella) {
    const top = [[x - h * 0.34, y - h * 1.04], [x - h * 0.2, y - h * 1.24], [x + h * 0.05, y - h * 1.32], [x + h * 0.28, y - h * 1.2], [x + h * 0.38, y - h * 1.04]];
    fillPts(c, [...top, [x + h * 0.02, y - h * 1.1]], PAPER);
    cut(c, hatch([...top, [x + h * 0.02, y - h * 1.1]], 1.2, 1.6), Math.max(0.5, h * 0.01));
    outline(c, top, Math.max(0.8, h * 0.015), false);
    cut(c, [[[x + h * 0.03, y - h * 1.3], [x + h * 0.1, y - h * 0.7]]], Math.max(0.7, h * 0.014));
  }
  if (f.cane) cut(c, [[[x + w * 0.6, y - h * 0.5], [x + w * 1.1, y]]], Math.max(0.7, h * 0.012));
}
function people(p, r) {
  const folk = [];
  const one = (X, Y, o = {}) => folk.push({ X, Y, size: r.range(0.92, 1.06), skirt: r.chance(0.42), hat: r.int(0, 2), brella: r.chance(0.24), cane: r.chance(0.2), dark: r.chance(0.45), stride: r.range(-1, 1), tint: r.pick([RED, BLUE, PLUM, GREEN, OCHRE, null, null]), ...o });
  for (let k = 0; k < 46; k++) one(r.range(14, 160), r.range(0.5, 2.7));
  for (let k = 0; k < 14; k++) one(r.range(-2.6, -0.5), r.range(-90, -14));
  for (let k = 0; k < 12; k++) one(r.range(-6, 30), r.range(20, 24));
  for (let k = 0; k < 14; k++) one(r.range(-10, 60), r.range(4, 19));
  for (let k = 0; k < 8; k++) one(r.range(-24, -8), r.range(0, 24));
  for (let k = 0; k < 16; k++) one(r.range(-6, 14), r.range(-12, -1), { size: r.range(0.85, 1) });
  for (let k = 0; k < 7; k++) one(r.range(-3, 6), r.range(19, 23), { size: r.range(0.9, 1.05) });
  // close in, on the near pavement: a lady with her parasol, a gentleman, a newsboy
  one(-12.5, 25.6, { skirt: true, brella: true, tint: PLUM, hat: 2, dark: false });
  one(-10.4, 25.2, { skirt: false, hat: 0, cane: true, tint: null, dark: true });
  one(-4.5, 25.9, { skirt: false, hat: 1, size: 0.72, tint: BLUE, brella: false, dark: false });
  one(-17.5, 24.4, { skirt: true, brella: false, tint: GREEN, hat: 2 });
  one(0.5, 25.4, { skirt: true, brella: true, tint: RED, hat: 2 });
  // nobody cut off by the plate's foot
  for (let i = folk.length - 1; i >= 0; i--) if (depthAt(folk[i].X, folk[i].Y) < 15.2) folk.splice(i, 1);
  folk.sort((a, b) => depthAt(b.X, b.Y) - depthAt(a.X, a.Y));
  const far = folk.filter((f) => depthAt(f.X, f.Y) > 48), near = folk.filter((f) => depthAt(f.X, f.Y) <= 48);
  [[far, 8.6, 'people'], [near, 9.0, 'near']].forEach(([set, t, layer]) => {
    const pts = set.flatMap((f) => { const q = figure(f); return [[q.x - q.h * 0.5, q.y + 4], [q.x + q.h * 0.5, q.y - q.h * 1.4]]; });
    const box = boxOf(pts, 10);
    p.group(layer, box, (c) => { c.save(); inPic(c); for (const f of set) drawFigure(c, f); c.restore(); }, { t, d: 0.8, reveal: 'rise' });
    const byTint = new Map();
    const sil = set.map((f) => { const q = figure(f); return [[q.x - q.h * 0.42, q.y + 3], [q.x + q.h * 0.42, q.y + 3], [q.x + q.h * 0.42, q.y - q.h * 1.36], [q.x - q.h * 0.42, q.y - q.h * 1.36]]; });
    set.forEach((f, i) => {
      if (!f.tint) return;
      if (!byTint.has(f.tint)) byTint.set(f.tint, []);
      const coat = figure(f).coat, cb = boxOf(coat);
      const ex = [...sil.slice(i + 1), ...(layer === 'people' ? [HANSOM()] : [])].filter((q) => q[0][0] < cb.x + cb.w && q[1][0] > cb.x && q[2][1] < cb.y + cb.h && q[0][1] > cb.y);
      byTint.get(f.tint).push({ pts: coat, ex });
    });
    let i = 0;
    for (const [col, shapes] of byTint) wash(layer, shapes, col, 0.75, box, 10.8 + 0.05 * i++);
  });
  hansom(p, r);
}
// the cab's outline, which the figures behind it must not be washed over
const HANSOM = () => { const k = kAt(-18, 16), [x, y] = P(-18, 16, 0), s = k / 30; return [[x - 60 * s, y + 6], [x + 104 * s, y + 6], [x + 104 * s, y - 148 * s], [x - 60 * s, y - 148 * s]]; };
// a hansom cab and its horse, coming up Swanston Street toward us
function hansom(p) {
  const X = -18, Y = 16, k = kAt(X, Y);
  const [x, y] = P(X, Y, 0), s = k / 30;
  const U = (pts) => pts.map(([u, v]) => [x + u * s, y + v * s]);
  // the horse in profile, walking; the cab behind on its big wheel; the driver up behind
  const horse = U([[0, -56], [14, -59], [38, -57], [54, -61], [62, -67], [70, -80], [78, -91], [81, -99], [84, -92], [90, -88], [98, -77], [101, -70], [97, -66], [88, -71], [78, -66], [68, -52], [62, -40], [52, -37], [24, -37], [10, -40], [2, -47]]);
  const legs = [U([[60, -40], [64, -20], [62, 0]]), U([[54, -40], [52, -22], [58, -10], [57, -1]]), U([[14, -42], [18, -22], [12, 0]]), U([[8, -42], [6, -24], [2, -14], [4, -1]])];
  const tail = U([[1, -55], [-6, -46], [-8, -30], [-4, -22]]);
  const mane = U([[56, -62], [64, -72], [72, -84], [78, -92]]);
  const body = U([[-50, -40], [-6, -40], [0, -62], [-4, -96], [-44, -100], [-52, -86]]);
  const roofCab = U([[-48, -100], [-2, -97], [-2, -103], [-46, -106]]);
  const wheel = { x: x - 26 * s, y: y - 30 * s, r: 30 * s };
  const shafts = [U([[-8, -46], [62, -50]]), U([[-6, -42], [66, -46]])];
  const harness = [U([[48, -56], [52, -40]]), U([[20, -58], [22, -38]])];
  const box = { x: x - 70 * s, y: y - 140 * s, w: 190 * s, h: 150 * s };
  p.group('people', box, (c) => {
    c.save(); inPic(c);
    // shadow under the cab and the horse
    cut(c, [U([[-60, 1], [100, 1]]), U([[-50, 3], [80, 3]]), U([[-40, 5], [60, 5]])], 1);
    cut(c, legs, 3.6 * s);
    fillPts(c, horse, PAPER); cut(c, hatch(horse, 0.5, 1.5), 0.7); cut(c, hatch(horse, -0.4, 2.2).filter((q) => q[0][1] > y - 50 * s), 0.6); outline(c, horse, 1.3);
    cut(c, [mane], 2.6 * s); cut(c, [tail], 3 * s);
    c.beginPath(); c.arc(x + 88 * s, y - 84 * s, 1.4 * s, 0, Math.PI * 2); c.fillStyle = PAPER; c.fill();
    cut(c, harness, 1.6 * s); cut(c, shafts, 1.4 * s);
    fillPts(c, body, PAPER); cut(c, hatch(body, Math.PI / 2, 1.6), 0.7); outline(c, body, 1.3);
    fillPts(c, U([[-40, -88], [-12, -88], [-12, -66], [-40, -66]]), INK);
    fillPts(c, roofCab, INK);
    // the driver up behind, in his topper, reins to the horse's head
    fillPts(c, U([[-58, -104], [-44, -104], [-44, -126], [-58, -126]]), INK);
    c.beginPath(); c.arc(x - 51 * s, y - 131 * s, 5 * s, 0, Math.PI * 2); c.fillStyle = PAPER; c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    fillPts(c, U([[-56, -135], [-46, -135], [-46, -146], [-56, -146]]), INK); fillPts(c, U([[-59, -135], [-43, -135], [-43, -137], [-59, -137]]), INK);
    cut(c, [U([[-46, -118], [20, -90], [86, -80]])], 0.8);
    c.beginPath(); c.arc(wheel.x, wheel.y, wheel.r, 0, Math.PI * 2); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
    c.lineWidth = 0.9; c.beginPath(); for (let a = 0; a < Math.PI * 2; a += Math.PI / 7) { c.moveTo(wheel.x, wheel.y); c.lineTo(wheel.x + Math.cos(a) * wheel.r, wheel.y + Math.sin(a) * wheel.r); } c.stroke();
    c.restore();
  }, { t: 8.8, d: 0.9, reveal: 'slide', dx: -50 });
  wash('people', [body], '#8a3e34', 0.6, box, 10.9);
  wash('people', [horse], '#a07450', 0.6, box, 10.95);
}

// ================================================================ the wires, poles and lamps
function wires(p) {
  const lines = [];
  for (const y of [11.9, 17.1]) { const L = []; for (let X = -60; X <= 500; X += X < 40 ? 2 : 10) L.push(P(X, y, 6.2)); lines.push(L); }
  for (const x of [-12.9, -17.1]) { const L = []; for (let Y = -140; Y <= 30; Y += 3) L.push(P(x, Y, 6.2)); lines.push(L); }
  const poles = [];
  for (let X = -6; X < 500; X += 24) { poles.push([X, 3.6]); lines.push([P(X, 3.6, 7.2), P(X, 28, 7.2)]); }
  for (let Y = -120; Y < 0; Y += 24) { poles.push([-3.6, Y]); lines.push([P(-3.6, Y, 7.2), P(-28, Y, 7.2)]); }
  p.strokes('wires', lines, INK, 1.1, { t: 9.4, d: 1.0, reveal: 'wipe', box: PICBOX });
  const drawPoles = (list) => (c) => {
    c.save(); inPic(c);
    for (const [X, Y, lamp] of list) {
      const [x0, y0] = P(X, Y, 0), [, y1] = P(X, Y, lamp ? 4.4 : 8), k = kAt(X, Y), w = (lamp ? 0.09 : 0.12) * k;
      const shaft = [[x0 - w, y0], [x0 + w, y0], [x0 + w * 0.7, y1], [x0 - w * 0.7, y1]];
      fillPts(c, shaft, PAPER); cut(c, hatch(shaft, Math.PI / 2, 1.5).filter((s) => s[0][0] > x0 - w * 0.2), 0.6); outline(c, shaft, 1);
      fillPts(c, [[x0 - w * 1.8, y0], [x0 + w * 1.8, y0], [x0 + w * 1.4, y0 - 0.5 * k], [x0 - w * 1.4, y0 - 0.5 * k]], INK);
      if (lamp) {
        // a gas lamp's lantern
        const lw = 0.22 * k, lh = 0.5 * k;
        const lan = [[x0 - lw * 0.6, y1], [x0 + lw * 0.6, y1], [x0 + lw, y1 - lh], [x0 - lw, y1 - lh]];
        fillPts(c, lan, PAPER); cut(c, hatch(lan, 0, 1.6), 0.4); outline(c, lan, 1);
        fillPts(c, [[x0 - lw * 1.2, y1 - lh], [x0 + lw * 1.2, y1 - lh], [x0, y1 - lh * 1.6]], INK);
      } else { c.fillStyle = INK; c.beginPath(); c.arc(x0, y1, 0.16 * k, 0, Math.PI * 2); c.fill(); }
    }
    c.restore();
  };
  const lamps = [[-3.2, 6, 1], [-3.2, -30, 1], [30, 2.6, 1], [70, 2.6, 1], [-25, 26, 1]];
  p.group('wires', PICBOX, drawPoles([...poles, ...lamps.slice(0, 4)]), { t: 9.2, d: 0.8, reveal: 'rise' });
  p.group('posts', PICBOX, drawPoles([[-8, 28], [20, 28], lamps[4]]), { t: 9.3, d: 0.8, reveal: 'rise' });
}

// ================================================================ the cartouche and the two round views
const CART = { x: 470, y: 1606, w: 660, h: 296 };
function cartouche(p, r) {
  // the ground of the lower panel: close ruled lines, so the cartouche stands out white
  const panel = [[96, 1564], [W - 96, 1564], [W - 96, H - 96], [96, H - 96]];
  const rule = []; for (let y = 1568; y < H - 96; y += 3.2) rule.push([[96, y], [W - 96, y]]);
  p.group('sheet', boxOf(panel, 2), (c) => cut(c, rule, 0.55), { t: 10.6, d: 1.0, reveal: 'fall' });
  // the cartouche: a tablet with cut corners, double ruled, scrolls curling off each side
  const { x, y, w, h } = CART, cc = 26;
  const tab = [[x + cc, y], [x + w - cc, y], [x + w, y + cc], [x + w, y + h - cc], [x + w - cc, y + h], [x + cc, y + h], [x, y + h - cc], [x, y + cc]];
  const tab2 = tab.map(([a, b]) => [a + (a < x + w / 2 ? 9 : -9), b + (b < y + h / 2 ? 9 : -9)]);
  const scroll = (cx, cy, dir) => { const L = []; for (let k = 0; k <= 60; k++) { const a = k * 0.2, rr = 34 * Math.exp(-a * 0.16); L.push([cx + dir * Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return L; };
  const scrolls = [scroll(x - 6, y + h * 0.3, -1), scroll(x - 6, y + h * 0.72, -1), scroll(x + w + 6, y + h * 0.3, 1), scroll(x + w + 6, y + h * 0.72, 1)];
  const leaves = [];
  for (const dir of [-1, 1]) for (let k = 0; k < 7; k++) {
    const bx = dir < 0 ? x - 8 : x + w + 8, by = y + h * 0.5, a = (k / 6 - 0.5) * 2.2, L = 34 + 18 * Math.cos(a);
    leaves.push([[bx, by], [bx + dir * Math.cos(a) * L * 0.6, by + Math.sin(a) * L * 0.5 - 6], [bx + dir * Math.cos(a) * L, by + Math.sin(a) * L * 0.7]]);
  }
  p.group('sheet', { x: x - 90, y: y - 20, w: w + 180, h: h + 40 }, (c) => {
    fillPts(c, tab, PAPER); outline(c, tab, 2.4); outline(c, tab2, 0.9);
    cut(c, leaves, 1.1);
    cut(c, scrolls, 1.5);
    // a shell at the top and the bottom
    for (const [sx, sy, d] of [[x + w / 2, y, -1], [x + w / 2, y + h, 1]]) {
      const shell = []; for (let k = 0; k <= 20; k++) { const a = Math.PI + (k / 20) * Math.PI; shell.push([sx + Math.cos(a) * 46, sy + d * Math.sin(a) * -26]); }
      fillPts(c, shell, PAPER); outline(c, shell, 1.4);
      const fl = []; for (let k = 1; k < 10; k++) { const a = Math.PI + (k / 10) * Math.PI; fl.push([[sx, sy + d * 4], [sx + Math.cos(a) * 44, sy + d * Math.sin(a) * -24]]); }
      cut(c, fl, 0.9);
    }
  }, { t: 11.0, d: 1.0, reveal: 'iris', ease: 'inOut' });
}
// the round views: St Paul's Cathedral at the left, the Exhibition Building at the right
const ROUND = [{ cx: 272, cy: 1720, rr: 118 }, { cx: W - 272, cy: 1720, rr: 118 }];
function roundels(p, r) {
  ROUND.forEach(({ cx, cy, rr }, i) => {
    const box = { x: cx - rr - 14, y: cy - rr - 14, w: 2 * rr + 28, h: 2 * rr + 28 };
    const clipR = (c) => { c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.clip(); };
    const skyR = []; for (let y = cy - rr; y < cy + rr; y += 3.2) skyR.push([[cx - rr, y], [cx + rr, y]]);
    const ground = cy + rr * 0.52;
    const shapes = i === 0 ? stPauls(cx, ground) : exhibition(cx, ground);
    p.group('sheet', box, (c) => {
      c.beginPath(); c.arc(cx, cy, rr + 9, 0, Math.PI * 2); c.fillStyle = PAPER; c.fill();
      c.save(); clipR(c);
      c.fillStyle = PAPER; c.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr);
      cut(c, skyR.filter((s) => s[0][1] < ground), 0.5);
      cut(c, hatch([[cx - rr, ground], [cx + rr, ground], [cx + rr, cy + rr], [cx - rr, cy + rr]], 0, 2.2), 0.6);
      for (const s of shapes.solids) { fillPts(c, s.pts, PAPER); cut(c, hatch(s.pts, s.ang ?? 0, s.step ?? 2.4), 0.6); outline(c, s.pts, 1.1); }
      c.fillStyle = INK; for (const d of shapes.dark) { poly(c, d); c.fill(); }
      cut(c, shapes.lines, 0.9);
      c.restore();
      c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 0.9; c.beginPath(); c.arc(cx, cy, rr + 8, 0, Math.PI * 2); c.stroke();
    }, { t: 11.2 + i * 0.3, d: 1.1, reveal: 'iris', ease: 'inOut' });
    wash('sheet', [circle(cx, cy - rr * 0.2, rr * 0.92).filter(([, y]) => y < ground)], SKY, 0.5, box, 12.0 + i * 0.2);
    wash('sheet', shapes.solids.filter((s) => s.tint).map((s) => s.pts), i === 0 ? '#d8b27e' : '#e0c79a', 0.7, box, 12.05 + i * 0.2);
    wash('sheet', shapes.roofs, i === 0 ? '#9aa3a6' : COPPER, 0.75, box, 12.1 + i * 0.2);
    // the caption under it
    const cap = i === 0 ? 'St Paul’s Cathedral.' : 'The Exhibition Building.';
    p.group('sheet', { x: cx - 160, y: cy + rr + 10, w: 320, h: 40 }, (c) => {
      c.fillStyle = PAPER; c.fillRect(cx - 120, cy + rr + 14, 240, 30);
      c.font = `italic 400 24px ${TEXT}`; c.textAlign = 'center'; c.fillStyle = INK; c.fillText(cap, cx, cy + rr + 37); c.textAlign = 'left';
    }, { t: 12.6 + i * 0.2, d: 0.6, reveal: 'fade' });
  });
}
const circle = (cx, cy, rr) => { const pts = []; for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return pts; };
// St Paul's, from the west: two spires on the west front, the tallest over the crossing, banded stone
function stPauls(cx, g) {
  const solids = [], dark = [], lines = [], roofs = [];
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const spire = (x, y0, w, h) => [[x - w, y0], [x, y0 - h], [x + w, y0]];
  // the nave running off right and the crossing tower behind
  const nave = rect(cx + 10, g - 70, cx + 120, g); solids.push({ pts: nave, tint: 1, ang: Math.PI / 2, step: 3.2 });
  const nroof = [[cx + 10, g - 70], [cx + 22, g - 92], [cx + 120, g - 88], [cx + 120, g - 70]]; solids.push({ pts: nroof, ang: 0.4, step: 2 }); roofs.push(nroof);
  const tower = rect(cx + 30, g - 150, cx + 70, g - 70); solids.push({ pts: tower, tint: 1, ang: Math.PI / 2, step: 2.6 });
  const sp = spire(cx + 50, g - 150, 22, 92); solids.push({ pts: sp, ang: 0.5, step: 1.8 }); roofs.push(sp);
  // the west front with its two towers and spires
  const front = rect(cx - 70, g - 96, cx + 10, g); solids.push({ pts: front, tint: 1, ang: 0, step: 3.4 });
  for (const tx of [cx - 84, cx - 4]) {
    const t = rect(tx, g - 132, tx + 26, g); solids.push({ pts: t, tint: 1, ang: 0, step: 3 });
    const s = spire(tx + 13, g - 132, 15, 62); solids.push({ pts: s, ang: 0.5, step: 1.8 }); roofs.push(s);
    dark.push(rect(tx + 9, g - 118, tx + 17, g - 98));
  }
  // the great west window and door
  const wn = []; for (let k = 0; k <= 12; k++) { const a = Math.PI - (k / 12) * Math.PI; wn.push([cx - 30 + Math.cos(a) * 16, g - 62 - Math.sin(a) * 18]); }
  dark.push([[cx - 46, g - 34], ...wn.map(([a, b]) => [a, b + 28]), [cx - 14, g - 34]]);
  dark.push([[cx - 40, g], [cx - 40, g - 22], [cx - 30, g - 30], [cx - 20, g - 22], [cx - 20, g]]);
  for (let x = cx + 22; x < cx + 116; x += 14) dark.push(rect(x, g - 56, x + 5, g - 30));
  // the bands of darker stone
  for (let y = g - 12; y > g - 130; y -= 14) lines.push([[cx - 84, y], [cx + 120, y]]);
  return { solids, dark, lines, roofs };
}
// the Exhibition Building: a long hall, a portal and towers, the great ribbed dome over its drum
function exhibition(cx, g) {
  const solids = [], dark = [], lines = [], roofs = [];
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const hall = rect(cx - 124, g - 50, cx + 124, g); solids.push({ pts: hall, tint: 1, ang: 0, step: 3.4 });
  const hroof = [[cx - 124, g - 50], [cx - 116, g - 62], [cx + 116, g - 62], [cx + 124, g - 50]]; solids.push({ pts: hroof, step: 2 }); roofs.push(hroof);
  for (let x = cx - 116; x < cx + 116; x += 16) if (Math.abs(x - cx) > 30) dark.push([[x, g - 8], [x, g - 30], [x + 4, g - 36], [x + 8, g - 30], [x + 8, g - 8]]);
  // the drum and the dome
  const drum = rect(cx - 40, g - 112, cx + 40, g - 62); solids.push({ pts: drum, tint: 1, ang: Math.PI / 2, step: 3 });
  for (let x = cx - 32; x < cx + 32; x += 12) dark.push(rect(x, g - 104, x + 5, g - 84));
  const dm = []; for (let k = 0; k <= 24; k++) { const a = Math.PI - (k / 24) * Math.PI; dm.push([cx + Math.cos(a) * 46, g - 114 - Math.sin(a) ** 0.8 * 62]); }
  solids.push({ pts: dm, ang: Math.PI / 2, step: 2.6 }); roofs.push(dm);
  for (let k = -3; k <= 3; k++) lines.push([[cx + k * 13, g - 114], [cx + k * 7, g - 160], [cx, g - 176]]);
  const lan = rect(cx - 8, g - 192, cx + 8, g - 174); solids.push({ pts: lan, tint: 1, ang: Math.PI / 2, step: 2 });
  lines.push([[cx, g - 192], [cx, g - 212]]);
  // the portal, a round arch under a pediment, between two square towers
  const portal = rect(cx - 30, g - 74, cx + 30, g); solids.push({ pts: portal, tint: 1, ang: 0, step: 3 });
  solids.push({ pts: [[cx - 36, g - 74], [cx, g - 96], [cx + 36, g - 74]], tint: 1, ang: 0, step: 2.4 });
  const ar = []; for (let k = 0; k <= 12; k++) { const a = Math.PI - (k / 12) * Math.PI; ar.push([cx + Math.cos(a) * 16, g - 40 - Math.sin(a) * 18]); }
  dark.push([[cx - 16, g], ...ar, [cx + 16, g]]);
  for (const tx of [cx - 64, cx + 42]) {
    const t = rect(tx, g - 100, tx + 22, g); solids.push({ pts: t, tint: 1, ang: 0, step: 3 });
    const cap = [[tx - 2, g - 100], [tx + 11, g - 120], [tx + 24, g - 100]]; solids.push({ pts: cap, step: 1.8, ang: 0.5 }); roofs.push(cap);
    dark.push(rect(tx + 8, g - 86, tx + 14, g - 66));
  }
  return { solids, dark, lines, roofs };
}

// ================================================================ the name
function title(p) {
  const { x, y, w } = CART;
  p.type('title', 'MELBOURNE', x + w / 2, y + 176, { family: DISPLAY, size: 120, color: INK, track: 0.06, align: 'center', fit: 560, t: 11.6, gap: 0.12, d: 0.8 });
  const small = (str, yy, font, t) => p.group('title', { x: x + 20, y: yy - 30, w: w - 40, h: 40 }, (c) => {
    c.font = font; c.fillStyle = INK; c.textAlign = 'center';
    if (c.letterSpacing !== undefined && font.startsWith('400')) c.letterSpacing = '5px';
    c.fillText(str, x + w / 2, yy);
    c.letterSpacing = '0px'; c.textAlign = 'left';
  }, { t, d: 0.7, reveal: 'fade' });
  small('VICTORIA', y + 74, `400 24px ${TEXT}`, 12.5);
  small('Flinders Street Station, from the corner of Swanston Street.', y + 222, `italic 400 21px ${TEXT}`, 12.8);
  p.group('title', { x: x + 60, y: y + 80, w: w - 120, h: 120 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x + 200, y + 86); c.lineTo(x + w - 200, y + 86); c.moveTo(x + 150, y + 196); c.lineTo(x + w - 150, y + 196); c.stroke();
    c.beginPath(); c.moveTo(x + w / 2 - 6, y + 196); c.lineTo(x + w / 2, y + 190); c.lineTo(x + w / 2 + 6, y + 196); c.lineTo(x + w / 2, y + 202); c.closePath(); c.fillStyle = INK; c.fill();
  }, { t: 12.6, d: 0.7, reveal: 'fade' });
}

// ================================================================ the things that move
function life(p, r) {
  // a tram running away down Flinders Street in the far lane, fading in and out at the ends of its run
  p.live('trams', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const run = (time * 2.2) % 150, X0 = 24 + run, Y0 = 17.1, len = 12, w = 1.35;
      const a = Math.min(1, run / 10, (150 - run) / 20);
      if (a <= 0) return;
      const side = face({ y: Y0 + w }, X0, X0 + len, 0.45, 3.2), band = face({ y: Y0 + w }, X0, X0 + len, 1.6, 2.7);
      const endF = face({ x: X0 }, Y0 - w, Y0 + w, 0.45, 3.2);
      c.save(); inPic(c); c.globalAlpha *= a;
      fillPts(c, endF, '#4f7f5e'); fillPts(c, side, '#6aa37a'); fillPts(c, band, '#efe0b0');
      c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath();
      for (let k = 1; k < 8; k++) { const [x0, y0] = P(X0 + (k / 8) * len, Y0 + w, 1.7), [, y1] = P(X0 + (k / 8) * len, Y0 + w, 2.6); c.moveTo(x0, y0); c.lineTo(x0, y1); }
      c.stroke(); poly(c, side); c.stroke(); poly(c, endF); c.stroke();
      const [px, py] = P(X0 + len * 0.6, Y0, 3.6), [qx, qy] = P(X0 + len * 0.6 - 4, Y0, 6.2);
      c.beginPath(); c.moveTo(px, py); c.lineTo(qx, qy); c.stroke();
      c.restore();
    },
  });
  // pigeons wheeling round the dome
  const [dx, dy] = P(DC[0], DC[1], 38);
  const birds = Array.from({ length: 7 }, () => ({ rx: r.range(120, 260), ry: r.range(30, 70), ph: r() * 6.28, sp: r.range(0.35, 0.6), s: r.range(0.9, 1.4) }));
  p.live('live', {
    t: 9.8, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineCap = 'round';
      c.beginPath();
      for (const b of birds) {
        const a = b.ph + time * b.sp, x = dx + Math.cos(a) * b.rx, y = dy - 60 + Math.sin(a) * b.ry;
        const f = Math.sin(time * 9 + b.ph) * 0.5 + 0.5, w = 8 * b.s, h = (1.5 + f * 4) * b.s;
        c.moveTo(x - w, y - h * 0.2); c.quadraticCurveTo(x - w * 0.5, y - h * 1.3, x, y); c.quadraticCurveTo(x + w * 0.5, y - h * 1.3, x + w, y - h * 0.2);
      }
      c.lineWidth = 1.4; c.stroke();
    },
  });
}
