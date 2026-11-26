// Boston: a colonial copper engraving of the town from above its harbor, colored
// by hand in thin washes. Long Wharf runs straight out of the town at the middle,
// lined with warehouses and ships; behind it the brick town climbs to Beacon
// Hill and the State House's gilded dome, with the steeples of Old North and Old
// South and the cupola of Faneuil Hall above the roofs, the Common, the Charles,
// and Bunker Hill's obelisk over Charlestown. A sky ruled in fine lines, a
// compass rose throwing rhumb lines over the water, a scrolled cartouche, and a
// graduated border and lettered key, as a map would have.

import { Plate, W, H } from '../print.js';
import { poly, lerp, cloudPuffs, drawCloud, cloudBox, rng, gull } from '../kit.js';

const PAPER = '#eee4cb', INK = '#2b2118', INK2 = 'rgba(43,33,24,.55)', INK3 = 'rgba(43,33,24,.3)';
const SEA = '#b9ccc0', LAND = '#e3d3a4', LAND_D = '#cdb983', GREEN = '#b3bd86', GREEN_D = '#8f9c64';
const BRICK = '#d4a083', BRICK_D = '#b97c60', WHITE = '#f1e9d6', ROOF = '#a99f97', ROOF_R = '#c58a74', GOLD = '#d7a539', GOLD_L = '#f0cf72';
const SAIL = '#f3ecda', HULL = '#3a2e25';
const FELL = '"IM Fell English", serif';

const KEY = [
  ['A', 'The State House'], ['B', 'Old North Church'], ['C', 'Faneuil Hall'], ['D', 'Long Wharf'],
  ['E', 'Old South Meeting House'], ['F', 'Bunker Hill Monument'], ['G', 'The Common'], ['H', 'Charles River'], ['I', 'Castle William'], ['K', 'The Old State House'],
];
const WORDS = 'BOSTON A VIEW OF THE TOWN & HARBOR in New England References Scale of Half a Mile Miles Quarter N S E W 0123456789 ' + KEY.flat().join(' ') + ' .,';

export const city = {
  id: 'boston', name: 'Boston', wall: '#2a2620',
  alt: "A hand-colored copper engraving of Boston from above its harbor: Long Wharf running out of the town lined with warehouses and moored ships, a frigate under sail, the State House's gilded dome on Beacon Hill above the Common, the steeples of Old North Church and Old South Meeting House, Faneuil Hall's cupola and the Old State House, the Charles River and Bunker Hill's obelisk beyond, Castle William's star fort on its island, a compass rose with rhumb lines across the water, the name in a scrolled cartouche, and a lettered key in a graduated border",
  google: 'family=IM+Fell+English:ital@0;1',
  fonts: [['400 100px "IM Fell English"', WORDS], ['italic 400 100px "IM Fell English"', WORDS]],
  build,
};

// the picture inside the border, and the key's strip under it
const PX0 = 62, PX1 = W - 62, PY0 = 62, PY1 = 1772;
// the view: the eye above the harbor looking west. u across, v away, z up.
const CX = 800, HY = 520, Y0 = 1780, U = 1500;
const sv = (v) => 1 / (1 + v);
const P = (u, v, z = 0) => { const s = sv(v); return [CX + u * U * s, HY + (Y0 - HY) * s - z * s]; };

// the peninsula's shore in (u, v), and the Common on it
const TOWN = [[-0.78, 2.3], [-0.6, 1.5], [-0.34, 1.2], [-0.05, 1.12], [0.22, 1.13], [0.46, 1.28], [0.66, 1.75], [0.8, 2.6], [0.74, 3.8], [0.52, 5.0], [0.22, 6.4], [-0.3, 6.6], [-0.66, 5.6], [-0.92, 4.2], [-0.95, 3.0]];
const COMMON = [[-0.66, 3.3], [-0.36, 3.05], [-0.3, 4.3], [-0.6, 4.7]];
// Charlestown across the Charles, the mainland reached by the Neck, Cambridge beyond
const CHARLESTOWN = [[0.42, 7.2], [0.9, 6.7], [1.8, 6.9], [3.0, 7.8], [4.2, 9.5], [4.2, 13], [0.7, 13], [0.5, 10]];
const MAIN = [[-0.84, 5.0], [-1.15, 4.5], [-1.6, 3.7], [-3.2, 3.2], [-3.2, 13], [-0.5, 13], [-0.62, 9.5], [-0.78, 6.6]];
// Beacon Hill and Bunker Hill: their heights over the ground
const hill = (u, v) => 80 * Math.exp(-((u + 0.24) ** 2) / 0.05 - ((v - 3.9) ** 2) / 1.6);
const hillC = (u, v) => 60 * Math.exp(-((u - 1.5) ** 2) / 0.4 - ((v - 9.4) ** 2) / 5);
const elev = (u, v) => hill(u, v) + hillC(u, v);

function inside(pts, x, y) {
  let k = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) k = !k;
  }
  return k;
}
const toScreen = (pts) => pts.map(([u, v]) => P(u, v));

// the landmarks, where they stand on the ground
const SH = { u: -0.24, v: 3.9 }, NORTH = { u: 0.47, v: 2.3 }, SOUTH = { u: -0.2, v: 2.05 }, FAN = { u: 0.12, v: 1.3 };
const BUNKER = { u: 1.5, v: 9.4 };

function build() {
  const p = new Plate({ paper: PAPER, seed: 1630 });
  const r = p.r;
  p.clip = { x: PX0, y: PY0, w: PX1 - PX0, h: PY1 - PY0 };
  p.stack('sky', 'clouds', 'water', 'far', 'land', 'town', 'marks', 'wharf', 'rose', 'ships', 'live', 'cartouche', 'frame', 'key');
  for (const n of ['frame', 'key']) p.layer(n, { clip: false });

  sky(p, r);
  water(p, r);
  far(p, r);
  land(p, r);
  town(p, r);
  landmarks(p);
  wharf(p, r);
  castle(p);
  rose(p);
  ships(p, r);
  life(p, r);
  cartouche(p);
  frame(p);
  key(p);
  return p;
}

// ================================================================ the sky
function sky(p, r) {
  // the engraver's ruled sky: fine level lines, closer and darker toward the top
  const lines = [], faint = [];
  for (let y = PY0 + 2, k = 0; y < HY; k++) {
    const t = (y - PY0) / (HY - PY0);
    (t < 0.55 ? lines : faint).push([[PX0, y], [PX1, y]]);
    y += 3.2 + t * 4.5;
  }
  p.strokes('sky', lines, 'rgba(43,33,24,.42)', 0.9, { t: 0.4, d: 1.4, reveal: 'fall', ease: 'inOut', box: { x: PX0, y: PY0, w: PX1 - PX0, h: HY - PY0 } });
  p.strokes('sky', faint, 'rgba(43,33,24,.24)', 0.8, { t: 0.9, d: 1.2, reveal: 'fall', ease: 'inOut', box: { x: PX0, y: PY0, w: PX1 - PX0, h: HY - PY0 } });
  // a wash of blue at the top of the sky
  p.group('sky', { x: PX0, y: PY0, w: PX1 - PX0, h: 260 }, (c) => {
    const g = c.createLinearGradient(0, PY0, 0, PY0 + 260);
    g.addColorStop(0, 'rgba(150,178,190,.42)'); g.addColorStop(1, 'rgba(150,178,190,0)');
    c.fillStyle = g; c.fillRect(PX0, PY0, PX1 - PX0, 260);
  }, { t: 0.2, d: 1.2, reveal: 'fade' });
  // engraved clouds, white where the ruling stops
  const cl = [[180, 270, 360, 90], [1020, 220, 420, 110], [640, 400, 260, 60], [1300, 420, 220, 50]];
  cl.forEach(([x, y, w, h], i) => {
    const cs = cloudPuffs(rng(31 + i), x, y, w, h);
    p.group('clouds', cloudBox(cs), (c) => drawCloud(c, cs, { fill: PAPER, line: INK2, lw: 0.8, hatch: INK3, hlw: 0.8, step: 4.5, cover: 0.5 }),
      { t: 1.4 + i * 0.25, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  });
}

// ================================================================ the water
function water(p, r) {
  // the wash, laid on loosely
  p.group('water', { x: PX0, y: HY - 4, w: PX1 - PX0, h: PY1 - HY + 4 }, (c) => {
    c.fillStyle = SEA; c.fillRect(PX0, HY, PX1 - PX0, PY1 - HY);
    const g = c.createLinearGradient(0, HY, 0, 1200);
    g.addColorStop(0, 'rgba(238,228,203,.7)'); g.addColorStop(1, 'rgba(238,228,203,0)');
    c.fillStyle = g; c.fillRect(PX0, HY, PX1 - PX0, 700);
  }, { t: 1.6, d: 1.3, reveal: 'fall', ease: 'inOut' });
  // ruled water: level lines closer together with distance, a little broken
  const near = [], far = [];
  for (let y = HY + 2; y < PY1; ) {
    const s = (y - HY) / (Y0 - HY);
    const seg = [];
    let x = PX0;
    while (x < PX1) { const L = r.range(60, 260) * (0.4 + s); seg.push([[x, y], [Math.min(PX1, x + L), y]]); x += L + r.range(4, 14) * (0.3 + s); }
    (y > 1100 ? near : far).push(...seg);
    y += 2.2 + s * 6.5;
  }
  p.strokes('water', far, 'rgba(43,33,24,.4)', 0.7, { t: 2.0, d: 1.0, reveal: 'fall', box: { x: PX0, y: HY, w: PX1 - PX0, h: 1100 - HY } });
  p.strokes('water', near, 'rgba(43,33,24,.45)', 0.9, { t: 2.3, d: 1.2, reveal: 'fall', box: { x: PX0, y: 1090, w: PX1 - PX0, h: PY1 - 1090 } });
}

// ================================================================ far shores
function far(p, r) {
  // the country to the horizon: Cambridge, Charlestown, and the mainland past the Neck
  const ridge = [];
  for (let x = PX0; x <= PX1; x += 16) ridge.push([x, HY - 4 - 12 * Math.sin(x / 190) ** 2 - 22 * Math.exp(-((x - 300) ** 2) / 26000) - 10 * Math.exp(-((x - 1350) ** 2) / 20000)]);
  const shapes = [MAIN, CHARLESTOWN].map(toScreen);
  const FAR = 646; // the far shore of the Charles
  p.group('far', { x: PX0, y: HY - 50, w: PX1 - PX0, h: 1000 }, (c) => {
    c.fillStyle = LAND;
    poly(c, [...ridge, [PX1, FAR], [PX0, FAR]].map(([x, y]) => [x + 3, y + 2])); c.fill();
    for (const sh of shapes) { poly(c, sh.map(([x, y]) => [x + 4, y + 3])); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 1;
    c.beginPath(); c.moveTo(ridge[0][0], ridge[0][1]); for (const q of ridge) c.lineTo(q[0], q[1]); c.stroke();
    // only the shores, not the edges where the land runs on into the distance
    c.beginPath();
    for (const src of [MAIN, CHARLESTOWN]) {
      for (let i = 0; i < src.length; i++) {
        const a = src[i], b = src[(i + 1) % src.length];
        if (a[1] > 12.5 || b[1] > 12.5 || a[0] < -3 || b[0] > 4) continue;
        const pa = P(a[0], a[1]), pb = P(b[0], b[1]); c.moveTo(pa[0], pa[1]); c.lineTo(pb[0], pb[1]);
      }
    }
    c.stroke();
    c.beginPath(); c.moveTo(PX0, FAR); c.lineTo(PX1, FAR); c.stroke();
  }, { t: 2.6, d: 1.3, reveal: 'fall', ease: 'inOut' });
  // fields in short hatches, hedges, and hachures on Bunker Hill
  p.group('far', { x: PX0, y: HY - 40, w: PX1 - PX0, h: 400 }, (c) => {
    c.save();
    c.beginPath(); poly(c, [...ridge, [PX1, 640], [PX0, 640]]); c.clip();
    c.strokeStyle = INK3; c.lineWidth = 0.7; c.beginPath();
    for (let y = HY - 30; y < 640; y += 6) for (let x = PX0 + ((y / 6) % 2) * 6; x < PX1; x += 12) { c.moveTo(x, y); c.lineTo(x + 6, y + 1); }
    c.stroke();
    c.restore();
    const [bx, by] = P(BUNKER.u, BUNKER.v, 60);
    c.strokeStyle = INK3; c.lineWidth = 0.7; c.beginPath();
    for (let a = 0.1; a < Math.PI - 0.1; a += 0.08) { c.moveTo(bx + Math.cos(a) * 30, by + 8 + Math.sin(a) * 4); c.lineTo(bx + Math.cos(a) * 110, by + 22 + Math.sin(a) * 22); }
    c.stroke();
  }, { t: 3.0, d: 0.9, reveal: 'fade' });
  // little trees over the country
  const tr = [];
  // hedgerows: lines of trees along the field edges
  for (let i = 0; i < 26; i++) {
    const y0 = r.range(HY + 2, FAR - 6), x0 = r.range(PX0, PX1), L = r.range(80, 260), a = r.range(-0.12, 0.12);
    for (let d = 0; d < L; d += r.range(4, 7)) tr.push([x0 + Math.cos(a) * d, y0 + Math.sin(a) * d, r.range(1.6, 2.6)]);
  }
  for (let i = 0; i < 1400; i++) {
    const x = r.range(PX0 + 6, PX1 - 6), y = r.range(HY - 10, 1000);
    const v = (Y0 - HY) / (y - HY) - 1, u = (x - CX) / (U * sv(v));
    const ok = (inside(MAIN, u, v) && r() < 0.35) || (y < FAR - 4 && r() < 0.12) || (inside(CHARLESTOWN, u, v) && r() < 0.3);
    if (ok && !inside(TOWN, u, v)) tr.push([x, y, 1.5 + 4 * sv(v) * 2]);
  }
  // villages in the distance: clusters of small roofs
  const vil = [];
  for (let i = 0; i < 14; i++) {
    const x0 = r.range(PX0 + 40, PX1 - 40), y0 = r.range(HY + 8, FAR - 10);
    for (let k = 0; k < r.int(4, 9); k++) vil.push([x0 + r.range(-30, 30), y0 + r.range(-6, 6), r.range(5, 9), r() < 0.5]);
  }
  vil.sort((a, b) => a[1] - b[1]);
  p.group('far', { x: PX0, y: HY - 10, w: PX1 - PX0, h: FAR - HY + 20 }, (c) => {
    c.strokeStyle = INK2; c.lineWidth = 0.6;
    for (const [x, y, w, br] of vil) {
      c.fillStyle = br ? BRICK : WHITE; c.fillRect(x, y - 4, w, 4); c.strokeRect(x, y - 4, w, 4);
      c.fillStyle = ROOF; poly(c, [[x - 1, y - 4], [x + w + 1, y - 4], [x + w - 1, y - 7], [x + 1, y - 7]]); c.fill(); c.stroke();
    }
    // a distant steeple or two
    for (const x of [420, 1060]) { c.fillStyle = WHITE; poly(c, [[x - 3, FAR - 22], [x + 3, FAR - 22], [x, FAR - 44]]); c.fill(); c.stroke(); c.fillRect(x - 3, FAR - 22, 6, 12); c.strokeRect(x - 3, FAR - 22, 6, 12); }
  }, { t: 3.5, d: 0.8, reveal: 'fade' });
  tr.sort((a, b) => a[1] - b[1]);
  p.group('far', { x: PX0, y: HY - 30, w: PX1 - PX0, h: 600 }, (c) => {
    for (const [x, y, s] of tr) {
      c.fillStyle = GREEN_D; c.beginPath(); c.arc(x, y - s, s, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK2; c.lineWidth = 0.6; c.beginPath(); c.arc(x, y - s, s, Math.PI * 0.8, Math.PI * 2.2); c.stroke();
    }
  }, { t: 3.3, d: 0.9, reveal: 'fade' });
}

// ================================================================ the town's ground
function land(p, r) {
  const shore = toScreen(TOWN);
  p.group('land', { x: PX0, y: 560, w: PX1 - PX0, h: 600 }, (c) => {
    c.fillStyle = LAND; poly(c, shore.map(([x, y]) => [x + 4, y + 3])); c.fill();
    // the Common, green, with its paths crossing
    const cm = toScreen(COMMON);
    c.fillStyle = GREEN; poly(c, cm.map(([x, y]) => [x + 3, y + 2])); c.fill();
    c.strokeStyle = INK2; c.lineWidth = 0.8; poly(c, cm); c.stroke();
    c.beginPath(); c.moveTo(cm[0][0], cm[0][1]); c.lineTo(cm[2][0], cm[2][1]); c.moveTo(cm[1][0], cm[1][1]); c.lineTo(cm[3][0], cm[3][1]); c.stroke();
    // Beacon Hill's slopes in hachures
    c.strokeStyle = INK3; c.lineWidth = 0.7; c.beginPath();
    const [hx, hy] = P(SH.u, SH.v, 60);
    for (let a = 0; a < Math.PI; a += 0.09) { const x0 = hx + Math.cos(a) * 60, y0 = hy + 30 + Math.sin(a) * 10; c.moveTo(x0, y0); c.lineTo(hx + Math.cos(a) * 140, hy + 50 + Math.sin(a) * 40); }
    c.stroke();
  }, { t: 2.9, d: 1.2, reveal: 'fall', ease: 'inOut' });
  p.pen('land', [...shore, shore[0]], INK, 1.4, { t: 3.1, d: 1.6 });
  // a second line just off the shore, as engravers drew the water's edge
  p.pen('land', toScreen(TOWN.map(([u, v]) => [u * 1.03, v * 0.97])).concat([P(TOWN[0][0] * 1.03, TOWN[0][1] * 0.97)]), INK2, 0.8, { t: 3.4, d: 1.6 });
  // trees on the Common: rows along the mall and clumps
  const trees = [];
  for (let i = 0; i < 46; i++) {
    const u = r.range(-0.66, -0.3), v = r.range(3.05, 4.7);
    if (!inside(COMMON, u, v)) continue;
    trees.push([...P(u, v), 2.5 + 3 * sv(v) * 2]);
  }
  for (let k = 0; k < 10; k++) trees.push([...P(lerp(-0.36, -0.3, k / 9), lerp(3.05, 4.3, k / 9)), 4]);
  trees.sort((a, b) => a[1] - b[1]);
  p.group('land', { x: 300, y: 640, w: 360, h: 140 }, (c) => {
    for (const [x, y, s] of trees) {
      c.fillStyle = GREEN_D; c.beginPath(); c.arc(x, y - s, s, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.7; c.beginPath(); c.arc(x, y - s, s, Math.PI * 0.8, Math.PI * 2.2); c.moveTo(x, y); c.lineTo(x, y - s * 0.3); c.stroke();
    }
  }, { t: 4.2, d: 0.8, reveal: 'fade' });
}

// ================================================================ the town
// a house seen from above the harbor: front wall, the side that faces the middle,
// a pitched roof with its ridge along the front, a chimney
function house(c, o) {
  const { u0, u1, v0, v1, z0, z1, wall, roof } = o;
  const vm = (v0 + v1) / 2, zr = z1 + o.pitch;
  const s = sv(v0), lw = Math.max(0.5, 1.3 * s);
  c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = INK;
  // back slope, side wall with its gable, front slope, front wall
  const back = [P(u0, vm, zr), P(u1, vm, zr), P(u1, v1, z1), P(u0, v1, z1)];
  c.fillStyle = o.roofD; poly(c, back); c.fill(); c.stroke();
  const su = u1 < 0 ? u1 : u0 > 0 ? u0 : null;
  if (su !== null) {
    const side = [P(su, v0, z0), P(su, v1, z0), P(su, v1, z1), P(su, vm, zr), P(su, v0, z1)];
    c.fillStyle = o.wallD; poly(c, side); c.fill(); c.stroke();
    // hatching in the shadow
    const [a, b] = [P(su, v0, z0), P(su, v1, z0)];
    c.strokeStyle = INK3; c.beginPath();
    for (let k = 1; k < 4; k++) { const t = k / 4; const x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t); c.moveTo(x, y); c.lineTo(x, y - (z1 - z0) * sv(lerp(v0, v1, t))); }
    c.stroke(); c.strokeStyle = INK;
  }
  const front = [P(u0, v0, z0), P(u1, v0, z0), P(u1, v0, z1), P(u0, v0, z1)];
  c.fillStyle = wall; poly(c, front); c.fill(); c.stroke();
  const slope = [P(u0, v0, z1), P(u1, v0, z1), P(u1, vm, zr), P(u0, vm, zr)];
  c.fillStyle = roof; poly(c, slope); c.fill(); c.stroke();
  // windows: a row or two of small dark squares
  const [fx0, fy0] = P(u0, v0, z0), [fx1] = P(u1, v0, z0);
  const fh = (z1 - z0) * s, fw = fx1 - fx0;
  if (fh > 7 && fw > 7) {
    c.fillStyle = INK; c.beginPath();
    const n = Math.max(1, Math.floor(fw / 6)), rows = fh > 14 ? 2 : 1;
    for (let rI = 0; rI < rows; rI++) for (let k = 0; k < n; k++) {
      const x = fx0 + (k + 0.5) * fw / n - 0.9, y = fy0 - fh * (0.32 + rI * 0.36);
      c.rect(x, y - 1.6, 1.8, 2.4);
    }
    c.fill();
  }
  if (o.chimney) {
    const [cx0, cy0] = P(lerp(u0, u1, o.chimney), vm, zr);
    c.fillStyle = BRICK_D; c.fillRect(cx0 - 1.5, cy0 - 5 * s * 2, 3, 5 * s * 2); c.strokeRect(cx0 - 1.5, cy0 - 5 * s * 2, 3, 5 * s * 2);
  }
}

function town(p, r) {
  // keep the houses off the landmarks' feet
  const clear = [[BUNKER.u, BUNKER.v, 0.1, 1.2], [SH.u, SH.v, 0.12, 0.5], [NORTH.u, NORTH.v, 0.05, 0.18], [SOUTH.u, SOUTH.v, 0.05, 0.16], [FAN.u, FAN.v, 0.07, 0.1], [0.0, 1.55, 0.04, 0.12]];
  const free = (u, v) => !clear.some(([a, b, du, dv]) => Math.abs(u - a) < du && Math.abs(v - b) < dv);
  const rows = [];
  let v = 13, row = 0;
  while (v > 1.16) {
    const dv = (14 * (1 + v) ** 2) / (Y0 - HY);
    if (row % 4 !== 3) { // every fourth row is a street
      const lots = [];
      let u = -3.0;
      while (u < 2.2) {
        const du = (r.range(14, 26) * (1 + v)) / U;
        const uc = u + du / 2;
        // the long street from Long Wharf up to the Old State House is left open
        const lane = Math.abs(uc - 0.005) < 0.022 && v < 1.7;
        const inTown = inside(TOWN, uc, v + dv * 0.3) && inside(TOWN, uc, v) && !inside(COMMON, uc, v);
        const inC = inside(CHARLESTOWN, uc, v) && inside(CHARLESTOWN, uc, v + dv * 0.3) && r() < 0.9;
        if (!lane && r() > 0.08 && (inTown || inC) && free(uc, v)) {
          const brick = r() < 0.55;
          const z0 = elev(uc, v);
          const tall = v < 1.5 ? 1.35 : 1 + Math.max(0, v - 6) * 0.3;
          lots.push({
            u0: u + du * 0.04, u1: u + du * 0.96, v0: v, v1: v + dv * 0.9, z0, z1: z0 + r.range(26, 44) * tall,
            pitch: r.range(8, 16) * Math.min(tall, 2), wall: brick ? BRICK : WHITE, wallD: brick ? BRICK_D : '#d6ccb4',
            roof: r() < 0.6 ? ROOF : ROOF_R, roofD: '#8a8078', chimney: r() < 0.6 ? r.range(0.2, 0.8) : 0,
          });
        }
        u += du;
      }
      lots.sort((a, b) => Math.abs(b.u0 + b.u1) - Math.abs(a.u0 + a.u1));
      rows.push({ v, lots });
    }
    v -= dv; row++;
  }
  // the rows from far to near, in bands, each rising into place
  const bands = 11, per = Math.ceil(rows.length / bands);
  for (let b = 0; b < bands; b++) {
    const part = rows.slice(b * per, (b + 1) * per);
    if (!part.length) continue;
    const vNear = part[part.length - 1].v, vFar = part[0].v;
    const y0 = P(0, vFar, 160)[1] - 30, y1 = P(0, vNear)[1] + 6;
    p.group('town', { x: PX0, y: y0, w: PX1 - PX0, h: y1 - y0 }, (c) => {
      for (const rw of part) for (const o of rw.lots) house(c, o);
    }, { t: 3.6 + b * 0.32, d: 0.9, reveal: 'rise', ease: 'out' });
  }
  // finger wharves along the shore, either side of Long Wharf
  const piers = [];
  for (const [u, v1] of [[-0.5, 1.3], [-0.38, 1.22], [-0.24, 1.17], [-0.12, 1.14], [0.18, 1.14], [0.3, 1.17], [0.42, 1.25], [0.56, 1.5]]) piers.push([u, v1]);
  p.group('town', { x: PX0, y: 1080, w: PX1 - PX0, h: 140 }, (c) => {
    for (const [u, v1] of piers) {
      const v0 = v1 - 0.16, w = 0.018;
      const top = [P(u - w, v0, 6), P(u + w, v0, 6), P(u + w, v1, 6), P(u - w, v1, 6)];
      c.fillStyle = LAND_D; poly(c, top); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
      const fr = [P(u - w, v0, 0), P(u + w, v0, 0), P(u + w, v0, 6), P(u - w, v0, 6)];
      c.fillStyle = '#8b7558'; poly(c, fr); c.fill(); c.stroke();
    }
  }, { t: 7.2, d: 0.7, reveal: 'fade' });
}

// ================================================================ the landmarks
function landmarks(p) {
  // F. Bunker Hill Monument: a granite obelisk on Charlestown's hill
  {
    const [bx, by] = P(BUNKER.u, BUNKER.v, 60);
    p.group('marks', { x: bx - 16, y: by - 130, w: 32, h: 136 }, (c) => {
      c.fillStyle = WHITE; poly(c, [[bx - 9, by], [bx + 9, by], [bx + 6, by - 108], [bx, by - 120], [bx - 6, by - 108]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
      c.strokeStyle = INK2; c.lineWidth = 0.6; c.beginPath();
      for (let x = bx + 1; x < bx + 8; x += 2) { c.moveTo(x, by - 2); c.lineTo(x - (x - bx) * 0.3, by - 108); }
      c.stroke();
    }, { t: 5.6, d: 0.9, reveal: 'rise', ease: 'inOut' });
  }
  // A. the State House on Beacon Hill: red brick, a white arcade and colonnade, the gilded dome
  {
    const [x, y] = P(SH.u, SH.v, hill(SH.u, SH.v));
    const w = 120;
    p.group('marks', { x: x - w / 2 - 10, y: y - 150, w: w + 20, h: 156 }, (c) => {
      c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 1;
      // the side wings and the main block
      c.fillStyle = BRICK; c.fillRect(x - w / 2, y - 44, w, 44); c.strokeRect(x - w / 2, y - 44, w, 44);
      c.fillStyle = BRICK_D; c.fillRect(x + w / 2 - 12, y - 44, 12, 44);
      c.fillStyle = INK; c.beginPath();
      for (let k = 0; k < 10; k++) { const xx = x - w / 2 + 6 + k * 11.5; if (Math.abs(xx - x) < 26) continue; c.rect(xx, y - 38, 3, 6); c.rect(xx, y - 24, 3, 7); }
      c.fill();
      // the arcade below and the colonnade above it, in white
      c.fillStyle = WHITE; c.fillRect(x - 28, y - 22, 56, 22); c.strokeRect(x - 28, y - 22, 56, 22);
      c.fillStyle = INK; c.beginPath();
      for (let k = 0; k < 7; k++) { const xx = x - 25 + k * 8; c.moveTo(xx, y); c.lineTo(xx, y - 12); c.arc(xx + 3, y - 12, 3, Math.PI, 0); c.lineTo(xx + 6, y); }
      c.fill();
      c.fillStyle = WHITE; c.fillRect(x - 28, y - 46, 56, 24); c.strokeRect(x - 28, y - 46, 56, 24);
      c.strokeStyle = INK; c.beginPath(); for (let k = 0; k < 6; k++) { const xx = x - 23 + k * 9.2; c.moveTo(xx, y - 22); c.lineTo(xx, y - 44); } c.stroke();
      // the pediment
      c.fillStyle = WHITE; poly(c, [[x - 30, y - 46], [x + 30, y - 46], [x, y - 60]]); c.fill(); c.stroke();
      // the drum and the dome
      c.fillStyle = WHITE; c.fillRect(x - 22, y - 74, 44, 14); c.strokeRect(x - 22, y - 74, 44, 14);
      c.fillStyle = GOLD; c.beginPath(); c.moveTo(x - 24, y - 74); c.bezierCurveTo(x - 24, y - 112, x + 24, y - 112, x + 24, y - 74); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = GOLD_L; c.beginPath(); c.moveTo(x - 16, y - 76); c.bezierCurveTo(x - 16, y - 100, x - 2, y - 104, x - 2, y - 104); c.lineTo(x - 6, y - 76); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(120,80,20,.6)'; c.lineWidth = 0.7; c.beginPath();
      for (let k = 1; k < 6; k++) { const xx = x - 24 + k * 8; c.moveTo(xx, y - 74); c.quadraticCurveTo(xx + (x - xx) * 0.3, y - 100, x, y - 102); }
      c.stroke();
      // the lantern and its pine cone
      c.strokeStyle = INK; c.lineWidth = 1;
      c.fillStyle = WHITE; c.fillRect(x - 5, y - 116, 10, 12); c.strokeRect(x - 5, y - 116, 10, 12);
      c.fillStyle = GOLD; c.beginPath(); c.arc(x, y - 120, 4, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x, y - 124); c.lineTo(x, y - 132); c.stroke();
    }, { t: 5.2, d: 1.2, reveal: 'rise', ease: 'inOut' });
  }
  // E. Old South Meeting House: a brick box and a tall white spire
  steeple(p, P(SOUTH.u, SOUTH.v)[0], P(SOUTH.u, SOUTH.v)[1], { body: 58, bh: 42, tower: 17, levels: [40, 20, 15], spire: 80, color: BRICK, t: 5.8 });
  // B. Old North Church: the tallest steeple in the North End
  steeple(p, P(NORTH.u, NORTH.v)[0], P(NORTH.u, NORTH.v)[1], { body: 44, bh: 44, tower: 20, levels: [66, 26, 19, 14], spire: 104, color: BRICK, t: 6.2 });
  // the Old State House at the head of State Street, its tower over the street
  steeple(p, P(0.005, 1.55)[0], P(0.005, 1.55)[1], { body: 34, bh: 34, tower: 12, levels: [16, 12], spire: 14, color: BRICK, t: 6.6, cupola: true });
  // C. Faneuil Hall: a long brick hall with a cupola and its grasshopper vane
  {
    const [x, y] = P(FAN.u, FAN.v);
    p.group('marks', { x: x - 52, y: y - 104, w: 104, h: 108 }, (c) => {
      c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 1;
      c.fillStyle = BRICK_D; poly(c, [[x + 34, y], [x + 46, y - 8], [x + 46, y - 38], [x + 34, y - 30]]); c.fill(); c.stroke();
      c.fillStyle = BRICK; c.fillRect(x - 34, y - 30, 68, 30); c.strokeRect(x - 34, y - 30, 68, 30);
      c.fillStyle = ROOF; poly(c, [[x - 34, y - 30], [x + 34, y - 30], [x + 46, y - 38], [x + 40, y - 46], [x - 28, y - 46]]); c.fill(); c.stroke();
      c.fillStyle = INK; c.beginPath();
      for (let k = 0; k < 7; k++) { const xx = x - 30 + k * 9.5; c.moveTo(xx + 5, y - 20); c.arc(xx + 2.5, y - 20, 2.5, Math.PI, 0, true); c.rect(xx, y - 20, 5, 6); c.rect(xx, y - 10, 5, 8); }
      c.fill();
      // the cupola
      c.fillStyle = WHITE; c.fillRect(x - 7, y - 66, 14, 22); c.strokeRect(x - 7, y - 66, 14, 22);
      c.fillStyle = INK; c.fillRect(x - 3, y - 62, 6, 10);
      c.fillStyle = WHITE; c.beginPath(); c.moveTo(x - 8, y - 66); c.quadraticCurveTo(x, y - 82, x + 8, y - 66); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x, y - 80); c.lineTo(x, y - 92); c.stroke();
      // the grasshopper
      c.fillStyle = GOLD; c.beginPath(); c.ellipse(x + 1, y - 94, 6, 2, -0.1, 0, Math.PI * 2); c.fill();
      c.strokeStyle = GOLD; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 2, y - 94); c.lineTo(x - 3, y - 99); c.lineTo(x - 6, y - 93); c.stroke();
    }, { t: 6.9, d: 0.9, reveal: 'rise', ease: 'inOut' });
  }
}

// a meeting house and its steeple: a body with a pitched roof, a square tower of
// stacked stages, and a spire. (x, y) is the foot of the tower's front.
function steeple(p, x, y, o) {
  const total = o.bh + o.levels.reduce((a, b) => a + b, 0) + o.spire + 20;
  p.group('marks', { x: x - o.body - 6, y: y - total - 6, w: 2 * o.body + 12, h: total + 12 }, (c) => {
    c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 1;
    // the body behind the tower, seen end on, with its roof
    c.fillStyle = o.color; c.fillRect(x - o.body / 2, y - o.bh, o.body, o.bh); c.strokeRect(x - o.body / 2, y - o.bh, o.body, o.bh);
    c.fillStyle = ROOF; poly(c, [[x - o.body / 2 - 2, y - o.bh], [x + o.body / 2 + 2, y - o.bh], [x + o.body / 2 - 6, y - o.bh - 10], [x - o.body / 2 + 6, y - o.bh - 10]]); c.fill(); c.stroke();
    c.fillStyle = INK; c.beginPath();
    for (let k = 0; k < 4; k++) { const xx = x - o.body / 2 + 5 + k * (o.body - 10) / 3; c.rect(xx - 1.5, y - o.bh + 8, 3, 10); }
    c.fill();
    // the tower stages, narrowing
    let yy = y, w = o.tower;
    o.levels.forEach((h, i) => {
      const col = i === 0 ? o.color : WHITE;
      c.fillStyle = col; c.fillRect(x - w / 2, yy - h, w, h); c.strokeRect(x - w / 2, yy - h, w, h);
      c.fillStyle = INK; c.beginPath();
      if (i === 0) { c.rect(x - 2, yy - h * 0.7, 4, h * 0.25); c.rect(x - 2, yy - h * 0.25, 4, h * 0.2); }
      else { c.moveTo(x - w * 0.22, yy - 2); c.lineTo(x - w * 0.22, yy - h * 0.6); c.arc(x, yy - h * 0.6, w * 0.22, Math.PI, 0); c.lineTo(x + w * 0.22, yy - 2); }
      c.fill();
      c.fillStyle = WHITE; c.fillRect(x - w / 2 - 2, yy - h - 2, w + 4, 3); c.strokeRect(x - w / 2 - 2, yy - h - 2, w + 4, 3);
      yy -= h + 2; w *= 0.8;
    });
    if (o.cupola) {
      c.fillStyle = WHITE; c.beginPath(); c.moveTo(x - w / 2, yy); c.quadraticCurveTo(x, yy - 14, x + w / 2, yy); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x, yy - 7); c.lineTo(x, yy - o.spire); c.stroke();
    } else {
      // the spire, shaded on one side
      c.fillStyle = WHITE; poly(c, [[x - w / 2, yy], [x + w / 2, yy], [x, yy - o.spire]]); c.fill(); c.stroke();
      c.strokeStyle = INK3; c.lineWidth = 0.7; c.beginPath();
      for (let k = 1; k < 4; k++) { const t = k / 4; c.moveTo(x + w / 2 * (1 - t * 0.2) - 1, yy - 1); c.lineTo(x + 0.5, yy - o.spire * (0.6 + t * 0.1)); }
      c.stroke();
      c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x, yy - o.spire); c.lineTo(x, yy - o.spire - 12); c.moveTo(x - 4, yy - o.spire - 8); c.lineTo(x + 5, yy - o.spire - 8); c.stroke();
    }
  }, { t: o.t, d: 1.1, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ Long Wharf
function wharf(p, r) {
  const u0 = -0.022, u1 = 0.024, vEnd = 0.24, vHead = 1.14;
  const deck = [P(u0, vHead, 8), P(u1, vHead, 8), P(u1, vEnd, 8), P(u0, vEnd, 8)];
  const face = [P(u0, vEnd, 0), P(u1, vEnd, 0), P(u1, vEnd, 8), P(u0, vEnd, 8)];
  const side = [P(u0, vHead, 0), P(u0, vEnd, 0), P(u0, vEnd, 8), P(u0, vHead, 8)];
  const top = P(0, vHead, 8)[1], bot = P(0, vEnd)[1];
  p.group('wharf', { x: 740, y: top - 6, w: 120, h: bot - top + 14 }, (c) => {
    c.fillStyle = '#8b7558'; poly(c, side); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; poly(c, side); c.stroke();
    // the piles along its side
    c.strokeStyle = INK2; c.lineWidth = 0.8; c.beginPath();
    for (let v = vEnd + 0.02; v < vHead; v += 0.03) { const [x, y] = P(u0, v, 0); c.moveTo(x, y); c.lineTo(x, y - 8 * sv(v)); }
    c.stroke();
    c.fillStyle = LAND_D; poly(c, deck); c.fill(); c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#8b7558'; poly(c, face); c.fill(); c.stroke();
    // planks across
    c.strokeStyle = INK3; c.lineWidth = 0.6; c.beginPath();
    for (let v = vEnd; v < vHead; v += 0.02) { c.moveTo(...P(u0, v, 8)); c.lineTo(...P(u1, v, 8)); }
    c.stroke();
  }, { t: 6.4, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // the row of warehouses down its north side
  const sheds = [];
  for (let v = vEnd + 0.04; v < vHead - 0.02;) {
    const dv = r.range(0.035, 0.055) * (1 + v) * 0.9;
    sheds.unshift({ u0: 0.004, u1: 0.024, v0: v, v1: v + dv * 0.92, z0: 8, z1: 8 + r.range(20, 30), pitch: 8, wall: r() < 0.6 ? BRICK : WHITE, wallD: BRICK_D, roof: ROOF, roofD: '#8a8078', chimney: r() < 0.4 ? 0.5 : 0 });
    v += dv;
  }
  const n = 3;
  for (let k = 0; k < n; k++) {
    const part = sheds.slice(Math.floor(k * sheds.length / n), Math.floor((k + 1) * sheds.length / n));
    const y0 = P(0, part[0].v1, 60)[1] - 10, y1 = P(0, part[part.length - 1].v0)[1] + 4;
    p.group('wharf', { x: 760, y: y0, w: 120, h: y1 - y0 }, (c) => { for (const o of part) house(c, o); }, { t: 7.2 + k * 0.3, d: 0.7, reveal: 'rise' });
  }
  // casks and bales on the open side
  const goods = [];
  for (let i = 0; i < 30; i++) { const v = r.range(vEnd + 0.03, vHead - 0.05); goods.push([...P(r.range(u0 + 0.004, -0.002), v, 8), sv(v)]); }
  goods.sort((a, b) => a[1] - b[1]);
  p.group('wharf', { x: 740, y: top, w: 100, h: bot - top }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 0.6;
    for (const [x, y, s] of goods) { c.fillStyle = '#9a7a55'; c.beginPath(); c.ellipse(x, y - 3 * s, 3.5 * s + 0.6, 3 * s + 0.5, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
  }, { t: 8.2, d: 0.5, reveal: 'fade' });
}

// ================================================================ Castle Island
// Castle William on its island in the outer harbor: a star of bastions seen from above
function castle(p) {
  const cx = 250, cy = 1236, R = 86, k = 0.42;
  const star = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, rr = i % 2 ? R * 0.62 : R; star.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * k]); }
  const H0 = 14;
  p.group('wharf', { x: cx - R - 60, y: cy - R * k - 40, w: 2 * R + 120, h: 2 * R * k + 70 }, (c) => {
    // the island
    c.fillStyle = LAND; c.beginPath(); c.ellipse(cx + 3, cy + 10, R + 48, R * k + 26, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.ellipse(cx, cy + 8, R + 48, R * k + 26, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = INK2; c.lineWidth = 0.7; c.beginPath(); c.ellipse(cx, cy + 9, R + 58, R * k + 32, 0, 0, Math.PI * 2); c.stroke();
    // the walls: their faces toward us, then the top
    c.lineJoin = 'miter';
    for (let i = 0; i < star.length; i++) {
      const a = star[i], b = star[(i + 1) % star.length];
      if (a[0] === b[0] || (a[1] + b[1]) / 2 < cy) continue;
      const face = [a, b, [b[0], b[1] + H0], [a[0], a[1] + H0]];
      c.fillStyle = b[0] > a[0] ? '#c9b48a' : '#b39c72'; poly(c, face); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
    }
    c.fillStyle = '#dccaa0'; poly(c, star); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
    // the parade ground, the barracks and the flag
    c.fillStyle = GREEN; c.beginPath(); c.ellipse(cx, cy, R * 0.45, R * 0.45 * k, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK2; c.stroke();
    c.fillStyle = WHITE; c.fillRect(cx - 34, cy - 22, 68, 14); c.strokeStyle = INK; c.lineWidth = 0.9; c.strokeRect(cx - 34, cy - 22, 68, 14);
    c.fillStyle = ROOF; poly(c, [[cx - 36, cy - 22], [cx + 36, cy - 22], [cx + 30, cy - 30], [cx - 30, cy - 30]]); c.fill(); c.stroke();
    c.fillStyle = INK; c.beginPath(); for (let x = cx - 30; x < cx + 30; x += 7) c.rect(x, cy - 18, 2.4, 4); c.fill();
    c.beginPath(); c.moveTo(cx + 20, cy + 4); c.lineTo(cx + 20, cy - 52); c.stroke();
    c.fillStyle = '#b4513b'; poly(c, [[cx + 20, cy - 52], [cx + 42, cy - 48], [cx + 20, cy - 42]]); c.fill();
    // guns on the bastions, as small dark marks
    c.fillStyle = INK; c.beginPath();
    for (let i = 0; i < 10; i += 2) { const [x, y] = star[i]; c.rect(x - 3, y - 1.5, 6, 3); }
    c.fill();
  }, { t: 7.8, d: 1.0, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the compass rose
const ROSE = [1340, 1500], RR = 104;
function rose(p) {
  const [x, y] = ROSE;
  // rhumb lines over the harbor from the rose's points
  const rays = [];
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    rays.push([[x + Math.cos(a) * RR * 1.05, y + Math.sin(a) * RR * 1.05], [x + Math.cos(a) * 2600, y + Math.sin(a) * 2600]]);
  }
  p.group('rose', { x: PX0, y: 1100, w: PX1 - PX0, h: PY1 - 1100 }, (c) => {
    c.save(); c.beginPath(); c.rect(PX0, vAtY(), PX1 - PX0, PY1 - vAtY()); poly(c, toScreen(TOWN)); c.clip('evenodd');
    c.strokeStyle = 'rgba(43,33,24,.5)'; c.lineWidth = 0.8; c.beginPath();
    for (const [a, b] of rays) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke(); c.restore();
  }, { t: 8.1, d: 1.3, reveal: 'iris', ease: 'inOut' });
  p.group('rose', { x: x - RR - 30, y: y - RR - 40, w: 2 * RR + 60, h: 2 * RR + 70 }, (c) => {
    c.lineJoin = 'miter';
    c.fillStyle = PAPER; c.beginPath(); c.arc(x, y, RR, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, RR, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 0.8; c.beginPath(); c.arc(x, y, RR - 10, 0, Math.PI * 2); c.stroke();
    // the degree ring
    c.beginPath();
    for (let k = 0; k < 64; k++) { const a = (k / 64) * Math.PI * 2, l = k % 4 ? 4 : 9; c.moveTo(x + Math.cos(a) * (RR - 10), y + Math.sin(a) * (RR - 10)); c.lineTo(x + Math.cos(a) * (RR - 10 + l), y + Math.sin(a) * (RR - 10 + l)); }
    c.stroke();
    // the points: eight long, eight short, each half dark and half light
    const pt = (a, L, w) => {
      const tip = [x + Math.cos(a) * L, y + Math.sin(a) * L];
      const l = [x + Math.cos(a - Math.PI / 2) * w, y + Math.sin(a - Math.PI / 2) * w], rr = [x + Math.cos(a + Math.PI / 2) * w, y + Math.sin(a + Math.PI / 2) * w];
      c.fillStyle = INK; poly(c, [[x, y], l, tip]); c.fill();
      c.fillStyle = PAPER; poly(c, [[x, y], rr, tip]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.9; poly(c, [l, tip, rr]); c.stroke();
    };
    for (let k = 0; k < 8; k++) pt((k / 8) * Math.PI * 2 + Math.PI / 8, RR * 0.55, 8);
    for (let k = 0; k < 8; k++) pt((k / 8) * Math.PI * 2, k % 2 ? RR * 0.75 : RR - 12, k % 2 ? 10 : 14);
    c.fillStyle = GOLD; c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.stroke();
    // a fleur-de-lis for north, a cross for east, as the old charts mark them
    const ny = y - RR - 6;
    c.fillStyle = INK; c.beginPath();
    c.moveTo(x, ny - 24); c.quadraticCurveTo(x + 7, ny - 12, x + 2, ny); c.lineTo(x - 2, ny); c.quadraticCurveTo(x - 7, ny - 12, x, ny - 24);
    c.moveTo(x + 2, ny - 6); c.quadraticCurveTo(x + 14, ny - 20, x + 13, ny - 8); c.quadraticCurveTo(x + 10, ny - 2, x + 2, ny - 2);
    c.moveTo(x - 2, ny - 6); c.quadraticCurveTo(x - 14, ny - 20, x - 13, ny - 8); c.quadraticCurveTo(x - 10, ny - 2, x - 2, ny - 2);
    c.fill();
    c.fillRect(x - 8, ny - 1, 16, 3);
    c.font = `italic 400 20px ${FELL}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('S', x, y + RR + 14); c.fillText('E', x + RR + 14, y); c.fillText('W', x - RR - 16, y);
  }, { t: 8.4, d: 1.2, reveal: 'iris', ease: 'out' });
}
// the top of the open harbor, below the town's shore
function vAtY() { return 1110; }

// ================================================================ ships
// a ship at anchor or under sail: (x, y) the middle of its waterline, s its scale,
// dir 1 bow to the right. o.sails: 'set' or 'furled'; o.masts 1 to 3
function ship(c, x, y, s, dir, o = {}) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.lineJoin = 'round'; c.lineCap = 'round';
  const masts = o.masts || 3;
  const L = masts === 3 ? 130 : masts === 2 ? 95 : 60;
  const mx = masts === 3 ? [-62, 0, 52] : masts === 2 ? [-30, 26] : [6];
  const mh = masts === 3 ? [175, 205, 165] : masts === 2 ? [140, 150] : [120];
  // hull: a sheer line rising to the bow, the stern a little high
  c.fillStyle = o.hull || HULL;
  c.beginPath(); c.moveTo(-L, -26); c.quadraticCurveTo(0, -18, L + 10, -30); c.quadraticCurveTo(L - 4, -4, L - 20, 4); c.lineTo(-L + 12, 4); c.quadraticCurveTo(-L - 2, -6, -L, -26); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.2 / s; c.stroke();
  if (o.ports) {
    c.fillStyle = WHITE; c.beginPath(); c.moveTo(-L + 4, -18); c.quadraticCurveTo(0, -12, L, -22); c.lineTo(L - 4, -16); c.quadraticCurveTo(0, -6, -L + 6, -12); c.fill();
    c.fillStyle = INK; c.beginPath();
    for (let k = 0; k < 13; k++) { const xx = -L + 18 + k * (2 * L - 30) / 13, yy = -15 + Math.abs(xx) * 0.0 - (xx > 0 ? xx * 0.03 : 0); c.rect(xx, yy - 3, 5, 4.5); }
    c.fill();
  }
  // the hull's shading
  c.strokeStyle = 'rgba(240,230,210,.25)'; c.lineWidth = 0.7 / s; c.beginPath();
  for (let k = 0; k < 4; k++) { c.moveTo(-L + 14, -2 - k * 3); c.lineTo(L - 22, -2 - k * 3 - 1); }
  c.stroke();
  // bowsprit
  c.strokeStyle = INK; c.lineWidth = 2 / s; c.beginPath(); c.moveTo(L, -28); c.lineTo(L + 52, -54); c.stroke();
  // masts and yards
  c.lineWidth = 2.2 / s; c.beginPath();
  mx.forEach((m, i) => { c.moveTo(m, -22); c.lineTo(m, -22 - mh[i]); });
  c.stroke();
  // rigging to the bow and stern
  c.strokeStyle = INK2; c.lineWidth = 0.7 / s; c.beginPath();
  mx.forEach((m, i) => { c.moveTo(m, -22 - mh[i]); c.lineTo(i === mx.length - 1 ? L + 50 : mx[i + 1], i === mx.length - 1 ? -54 : -30); c.moveTo(m, -22 - mh[i]); c.lineTo(m - 30, -24); c.moveTo(m, -22 - mh[i] * 0.6); c.lineTo(m + 26, -26); });
  c.stroke();
  mx.forEach((m, i) => {
    const top = -22 - mh[i];
    const yards = [0.25, 0.48, 0.7, 0.88].map((f) => top + mh[i] * (1 - f) * 0.92 + 6);
    const wid = [44, 38, 30, 22].map((w) => w * (masts === 1 ? 0.8 : 1));
    if (o.sails === 'set') {
      for (let k = 0; k < 3; k++) {
        const ya = top + mh[i] * (k * 0.27) + 10, yb = ya + mh[i] * 0.25, wa = wid[3 - k] , wb = wid[2 - k];
        const sail = [[m - wa, ya], [m + wa, ya], [m + wb + 3, yb], [m - wb + 3, yb]];
        c.fillStyle = SAIL; c.beginPath(); c.moveTo(sail[0][0], sail[0][1]); c.lineTo(sail[1][0], sail[1][1]);
        c.quadraticCurveTo(m + wb + 10, (ya + yb) / 2, sail[2][0], sail[2][1]); c.quadraticCurveTo(m, yb + 8, sail[3][0], sail[3][1]); c.quadraticCurveTo(m - wb - 2, (ya + yb) / 2, sail[0][0], sail[0][1]); c.fill();
        c.strokeStyle = INK; c.lineWidth = 0.9 / s; c.stroke();
        // shading on the far side of each sail
        c.strokeStyle = INK3; c.lineWidth = 0.7 / s; c.beginPath();
        for (let j = 1; j < 6; j++) { const yy = lerp(ya, yb, j / 6); c.moveTo(m + wa * 0.2, yy); c.lineTo(m + lerp(wa, wb, j / 6) + 2, yy + 2); }
        c.stroke();
        c.strokeStyle = INK; c.lineWidth = 1.4 / s; c.beginPath(); c.moveTo(m - wa - 3, ya); c.lineTo(m + wa + 3, ya); c.stroke();
      }
    } else {
      c.strokeStyle = INK; c.lineWidth = 1.4 / s; c.beginPath();
      yards.forEach((yy, k) => { c.moveTo(m - wid[k], yy); c.lineTo(m + wid[k], yy); });
      c.stroke();
      c.fillStyle = SAIL; c.beginPath();
      yards.forEach((yy, k) => { c.rect(m - wid[k] * 0.85, yy, wid[k] * 1.7, 2.6); });
      c.fill();
    }
  });
  // jibs from the foremast to the bowsprit
  if (o.sails === 'set') {
    const fm = mx[mx.length - 1], fh = mh[mh.length - 1];
    c.fillStyle = SAIL; c.strokeStyle = INK; c.lineWidth = 0.9 / s;
    poly(c, [[fm + 3, -22 - fh * 0.85], [L + 48, -52], [fm + 10, -40]]); c.fill(); c.stroke();
    poly(c, [[fm + 3, -22 - fh * 0.62], [L + 28, -44], [fm + 8, -38]]); c.fill(); c.stroke();
    // the spanker aft
    const am = mx[0], ah = mh[0];
    poly(c, [[am - 2, -22 - ah * 0.55], [am - 2, -34], [am - 56, -36], [am - 44, -22 - ah * 0.5]]); c.fill(); c.stroke();
  }
  // the ensign at the stern
  c.fillStyle = o.flag || '#b4513b'; poly(c, [[-L - 2, -40], [-L - 26, -42], [-L - 24, -30], [-L - 2, -30]]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.8 / s; c.stroke();
  c.beginPath(); c.moveTo(-L - 2, -26); c.lineTo(-L - 2, -46); c.stroke();
  c.restore();
}

function ships(p, r) {
  // moored along Long Wharf, both sides, and anchored about the harbor
  const list = [
    [700, 1240, 0.42, 1, {}], [905, 1270, 0.46, -1, { masts: 2 }], [690, 1340, 0.55, 1, { masts: 2 }],
    [930, 1380, 0.6, -1, {}], [420, 1190, 0.36, 1, {}], [1180, 1200, 0.38, -1, { masts: 2 }],
    [540, 1440, 0.45, -1, { masts: 1, sails: 'set' }], [1250, 1300, 0.48, 1, { masts: 1 }],
    [560, 1160, 0.3, 1, { masts: 1 }], [1080, 1150, 0.3, -1, {}],
    [1390, 1090, 0.32, -1, { masts: 2 }], [1440, 1240, 0.42, 1, {}], [150, 1060, 0.3, 1, { masts: 1 }],
  ];
  list.sort((a, b) => a[1] - b[1]);
  list.forEach(([x, y, s, dir, o], i) => {
    const h = 250 * s, w = 260 * s;
    p.group('ships', { x: x - w, y: y - h, w: 2 * w, h: h + 12 }, (c) => {
      // its shadow and reflection, ruled
      c.strokeStyle = 'rgba(43,33,24,.35)'; c.lineWidth = 1; c.beginPath();
      for (let k = 1; k < 5; k++) { c.moveTo(x - 110 * s, y + k * 2.4); c.lineTo(x + 110 * s, y + k * 2.4); }
      c.stroke();
      ship(c, x, y, s, dir, { sails: 'furled', ...o });
    }, { t: 8.6 + i * 0.12, d: 0.8, reveal: 'rise', ease: 'out' });
  });
  // the frigate under sail in the foreground, with her gun ports
  p.group('ships', { x: 760, y: 1360, w: 500, h: 360 }, (c) => {
    c.strokeStyle = 'rgba(43,33,24,.45)'; c.lineWidth = 1.2; c.beginPath();
    for (let k = 1; k < 6; k++) { c.moveTo(830, 1702 + k * 3); c.lineTo(1170 - k * 8, 1702 + k * 3); }
    // the bow wave
    for (let k = 0; k < 4; k++) { c.moveTo(1150 + k * 6, 1700 - k * 2); c.quadraticCurveTo(1190 + k * 10, 1706, 1230 + k * 14, 1710 + k * 3); }
    c.stroke();
    ship(c, 1000, 1702, 1.0, 1, { sails: 'set', ports: true, hull: '#2c2520', flag: '#b4513b' });
  }, { t: 9.6, d: 1.0, reveal: 'slide', dx: -90 });
}

// ================================================================ what moves
function life(p, r) {
  // a rowboat pulling across from the wharf
  p.live('live', {
    t: 10.2, d: 0.8, reveal: 'fade', box: { x: PX0, y: 1400, w: PX1 - PX0, h: 80 },
    draw: (c, time) => {
      const T = time - 10.2, x = 760 - ((T * 14) % 520), y = 1452, st = Math.sin(time * 2.6);
      c.save(); c.beginPath(); c.rect(PX0, 1400, PX1 - PX0, 80); c.clip();
      c.strokeStyle = 'rgba(43,33,24,.4)'; c.lineWidth = 0.9; c.beginPath();
      for (let k = 0; k < 3; k++) { c.moveTo(x + 22 + k * 10, y + 3 + k); c.lineTo(x + 46 + k * 18, y + 3 + k); }
      c.stroke();
      c.fillStyle = '#6d5236'; c.beginPath(); c.moveTo(x - 20, y - 6); c.lineTo(x + 20, y - 6); c.quadraticCurveTo(x + 18, y + 2, x + 10, y + 2); c.lineTo(x - 14, y + 2); c.closePath(); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
      c.fillStyle = INK; c.beginPath(); c.arc(x - 2, y - 13, 2.6, 0, Math.PI * 2); c.arc(x + 9, y - 12, 2.4, 0, Math.PI * 2); c.fill();
      c.fillRect(x - 4, y - 11, 4, 6); c.fillRect(x + 7, y - 10, 4, 5);
      c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 2, y - 7); c.lineTo(x - 2 - 14 * st, y + 4); c.moveTo(x - 2, y - 7); c.lineTo(x - 2 + 4 * st, y + 6); c.stroke();
      c.restore();
    },
  });
  // a sloop beating across the outer harbor
  p.live('live', {
    t: 10.5, d: 0.8, reveal: 'fade', box: { x: PX0, y: 1460, w: PX1 - PX0, h: 140 },
    draw: (c, time) => {
      const T = time - 10.5, x = 560 + T * 9, y = 1580 + Math.sin(time * 1.3) * 1.5;
      c.save(); c.beginPath(); c.rect(PX0, 1440, PX1 - PX0, 160); c.clip();
      c.strokeStyle = 'rgba(43,33,24,.4)'; c.lineWidth = 1; c.beginPath();
      for (let k = 1; k < 4; k++) { c.moveTo(x - 40, y + k * 2.5); c.lineTo(x + 30, y + k * 2.5); }
      c.stroke();
      c.translate(x, y); c.rotate(Math.sin(time * 1.1) * 0.02); ship(c, 0, 0, 0.55, 1, { masts: 1, sails: 'set' });
      c.restore();
    },
  });
  // gulls over the water
  const gl = [];
  for (let i = 0; i < 5; i++) gl.push([r.range(500, 1300), r.range(820, 1050), r() * 6, r.range(0.15, 0.3)]);
  p.live('live', {
    t: 10.8, d: 0.8, reveal: 'fade', box: { x: PX0, y: 700, w: PX1 - PX0, h: 450 },
    draw: (c, time) => {
      for (const [x0, y0, ph, sp] of gl) { const a = time * sp + ph; gull(c, x0 + Math.cos(a) * 70, y0 + Math.sin(a * 1.3) * 18, 0.9, (Math.sin(time * 5 + ph) + 1) / 2, INK); }
    },
  });
  // the frigate's pennant streaming from the mainmast
  p.live('live', {
    t: 11.0, d: 0.6, reveal: 'fade', box: { x: 990, y: 1450, w: 90, h: 40 },
    draw: (c, time) => {
      const x = 1000, y = 1475;
      c.fillStyle = '#b4513b'; c.beginPath(); c.moveTo(x, y - 3);
      for (let k = 0; k <= 8; k++) c.lineTo(x + k * 8, y - 3 + Math.sin(time * 4 - k * 0.7) * 2.5 + k * 0.2);
      for (let k = 8; k >= 0; k--) c.lineTo(x + k * 8, y + 2 - k * 0.3 + Math.sin(time * 4 - k * 0.7) * 2.5);
      c.fill();
    },
  });
}

// ================================================================ the cartouche
function cartouche(p) {
  const x0 = 104, x1 = 640, y0 = 1490, y1 = 1730, cx = (x0 + x1) / 2;
  p.group('cartouche', { x: x0 - 40, y: y0 - 40, w: x1 - x0 + 80, h: y1 - y0 + 80 }, (c) => {
    // the scrolled sheet: rolled ends left and right
    c.fillStyle = PAPER; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(x0, y0, x1 - x0, y1 - y0);
    c.lineWidth = 0.8; c.strokeRect(x0 + 8, y0 + 8, x1 - x0 - 16, y1 - y0 - 16);
    for (const [x, s] of [[x0, -1], [x1, 1]]) {
      c.fillStyle = '#e2d3ad'; c.beginPath(); c.ellipse(x + s * 6, (y0 + y1) / 2, 16, (y1 - y0) / 2 + 14, 0, 0, Math.PI * 2); c.fill();
      c.lineWidth = 1.3; c.stroke();
      c.beginPath(); c.ellipse(x + s * 6, (y0 + y1) / 2, 8, (y1 - y0) / 2 + 4, 0, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = INK3; c.lineWidth = 0.7; c.beginPath();
      for (let yy = y0 - 6; yy < y1 + 6; yy += 5) { c.moveTo(x + s * 14, yy); c.lineTo(x + s * 20, yy + 2); }
      c.stroke(); c.strokeStyle = INK;
    }
    // acanthus curls at the top and bottom middle
    c.lineWidth = 1.2;
    for (const [yy, s] of [[y0, -1], [y1, 1]]) {
      c.beginPath();
      for (const d of [-1, 1]) {
        c.moveTo(cx, yy); c.bezierCurveTo(cx + d * 30, yy + s * 30, cx + d * 80, yy + s * 6, cx + d * 110, yy + s * 22);
        c.moveTo(cx + d * 110, yy + s * 22); c.arc(cx + d * 104, yy + s * 22, 6, d > 0 ? 0 : Math.PI, d > 0 ? Math.PI * 1.6 : Math.PI * 2.6, d < 0);
        c.moveTo(cx + d * 40, yy + s * 16); c.quadraticCurveTo(cx + d * 60, yy + s * 30, cx + d * 76, yy + s * 20);
      }
      c.stroke();
      c.fillStyle = PAPER; c.beginPath(); c.ellipse(cx, yy, 14, 9, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = GOLD; c.beginPath(); c.arc(cx, yy, 4, 0, Math.PI * 2); c.fill();
    }
  }, { t: 10.0, d: 1.0, reveal: 'iris', ease: 'inOut' });
  p.type('cartouche', 'A VIEW OF THE TOWN & HARBOR OF', cx, y0 + 46, { family: FELL, size: 21, color: INK, align: 'center', track: 0.16, t: 10.6, gap: 0.02, d: 0.4, reveal: 'fade' });
  p.type('cartouche', 'BOSTON', cx, y0 + 168, { family: FELL, size: 142, color: INK, align: 'center', track: 0.06, fit: x1 - x0 - 80, t: 11.1, gap: 0.2, d: 0.9 });
  p.type('cartouche', 'in New England', cx, y0 + 212, { family: FELL, style: 'italic', size: 30, color: INK, align: 'center', t: 12.4, gap: 0.03, d: 0.5, reveal: 'fade' });
  p.group('cartouche', { x: cx - 160, y: y0 + 176, w: 320, h: 12 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 150, y0 + 182); c.lineTo(cx - 12, y0 + 182); c.moveTo(cx + 12, y0 + 182); c.lineTo(cx + 150, y0 + 182); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.moveTo(cx - 8, y0 + 182); c.lineTo(cx, y0 + 177); c.lineTo(cx + 8, y0 + 182); c.lineTo(cx, y0 + 187); c.fill();
  }, { t: 12.2, d: 0.6, reveal: 'wipe' });
}

// ================================================================ border and key
function frame(p) {
  // a graduated neat line: two rules with a band of alternate black and white between
  const a = 40, b = 54;
  const rect = (i, j = i) => [[i, j], [W - i, j], [W - i, H - j], [i, H - j], [i, j]];
  p.pen('frame', rect(a), INK, 1.8, { t: 0.1, d: 1.4, cap: 'square' });
  p.pen('frame', rect(b), INK, 1.1, { t: 0.3, d: 1.4, cap: 'square' });
  p.pen('frame', [[PX0, PY0], [PX1, PY0], [PX1, PY1], [PX0, PY1], [PX0, PY0]], INK, 1.4, { t: 0.5, d: 1.4, cap: 'square' });
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = INK; c.beginPath();
    const step = 40, m = a + 2.5, t = b - a - 5;
    for (let x = a, k = 0; x < W - a; x += step, k++) if (k % 2) { c.rect(x, m, Math.min(step, W - a - x), t); c.rect(x, H - b + 2.5, Math.min(step, W - a - x), t); }
    for (let y = a, k = 0; y < H - a; y += step, k++) if (k % 2) { c.rect(m, y, t, Math.min(step, H - a - y)); c.rect(W - b + 2.5, y, t, Math.min(step, H - a - y)); }
    c.fill();
  }, { t: 1.2, d: 1.0, reveal: 'fade' });
  // the rule between the picture and the key
  p.pen('frame', [[PX0, PY1 + 6], [PX1, PY1 + 6]], INK, 0.8, { t: 1.0, d: 1.0 });
}

function key(p) {
  // letters on the view
  const at = [
    ['A', ...P(SH.u, SH.v, hill(SH.u, SH.v)), 72, -80], ['K', ...P(0.005, 1.55), -24, -60], ['B', ...P(NORTH.u, NORTH.v), 22, -150], ['C', ...P(FAN.u, FAN.v), 30, -72],
    ['D', ...P(-0.022, 0.5), -18, -4], ['E', ...P(SOUTH.u, SOUTH.v), -32, -120], ['F', ...P(BUNKER.u, BUNKER.v, 60), 18, -70],
    ['G', ...P(-0.5, 4.0), 0, -4], ['I', 250, 1236, 0, -70], ['H', ...P(0.28, 7.2), 0, 6],
  ];
  at.forEach(([L, x, y, dx, dy], i) => {
    p.group('key', { x: x + dx - 14, y: y + dy - 22, w: 28, h: 30 }, (c) => {
      c.font = `italic 400 24px ${FELL}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.lineWidth = 4; c.strokeStyle = 'rgba(238,228,203,.85)'; c.strokeText(L, x + dx, y + dy);
      c.fillStyle = INK; c.fillText(L, x + dx, y + dy);
    }, { t: 9.9 + i * 0.1, d: 0.4, reveal: 'fade' });
  });
  // the references under the picture, in four columns
  p.type('key', 'References', PX0 + 8, 1818, { family: FELL, style: 'italic', size: 24, color: INK, t: 12.6, gap: 0.03, d: 0.4, reveal: 'fade' });
  const cw = 290;
  KEY.forEach(([L, name], i) => {
    const x = PX0 + 190 + Math.floor(i / 3) * cw, y = 1822 + (i % 3) * 30;
    p.group('key', { x: x - 4, y: y - 22, w: cw - 10, h: 30 }, (c) => {
      c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = INK;
      c.font = `italic 400 22px ${FELL}`; c.fillText(L + '.', x, y);
      c.font = `400 20px ${FELL}`; c.fillText(name, x + 26, y);
    }, { t: 12.7 + i * 0.08, d: 0.5, reveal: 'wipe' });
  });
  // a scale of half a mile at the right
  const sx = PX1 - 250, sy = 1912;
  p.group('key', { x: PX0, y: sy - 40, w: PX1 - PX0, h: 50 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(sx, sy - 8, 220, 7);
    c.fillStyle = INK; c.beginPath(); for (let k = 0; k < 4; k += 2) c.rect(sx + k * 55, sy - 8, 55, 7); c.fill();
    c.font = `italic 400 18px ${FELL}`; c.textAlign = 'center';
    c.fillText('Scale of Half a Mile', sx + 110, sy - 16);
    c.font = `400 14px ${FELL}`;
    c.fillText('0', sx, sy + 14); c.fillText('Quarter', sx + 110, sy + 14); c.fillText('Half', sx + 220, sy + 14);
    c.font = `italic 400 18px ${FELL}`; c.textAlign = 'left'; c.fillText('Boston in New England', PX0 + 8, sy + 2);
  }, { t: 13.3, d: 0.6, reveal: 'fade' });
}

