// Beirut: a 1960s Mediterranean tourism poster in blue and coral. From a hotel
// terrace above the corniche: the white balustrade and its palms, strollers and
// a ka'ak seller, 1960s cars on the road below; across the blue the Pigeon Rocks
// stand out of a turquoise shallow with the sea showing through the arch; the
// city of white modern blocks and red-roofed houses with triple-arched windows
// runs along the shore to the Manara lighthouse, under the snows of Mount
// Lebanon. A coral sky; the name in Arabic and Latin across it; a water-skier.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, rng, shade, mix } from '../kit.js';

const PAPER = '#f6eddc';
const CORAL = '#ee7659', CORAL_L = '#f39a7c', PEACH = '#f7c4a2', BLUSH = '#f9dcc0', SUNC = '#fdf0dc';
const SAND = '#efd5ab', CREAM = '#fbf2e2', WHITE = '#fdf8ef';
const ULTRA = '#1f52a3', DEEP = '#163c80', NAVY = '#14264f', HAZE = '#6b8fcb', TURQ = '#38a9b8', TURQ_L = '#8fd0cf';
const MTN1 = '#b2bce0', MTN2 = '#8193cc', MTN3 = '#5a72b4', SNOW = '#fbf6f0';
const ROCK = '#e9b083', ROCK_S = '#ad624a', ROCK_D = '#7f3f31', ROCK_L = '#f5d0a8';
const PALM = '#1f5b59', PALM_L = '#2f7a6c', TRUNK = '#8a5b3e', ROOF = '#c9533b', ROAD = '#7d7496', ROAD_L = '#958cab';

export const city = {
  id: 'beirut', name: 'Beirut',
  alt: "A 1960s tourism poster in blue and coral: from above the corniche, its white balustrade and palms, strollers, a ka'ak seller and 1960s cars on the road, the Pigeon Rocks rising from the sea with the water showing through their arch, the city's white modern blocks and red-roofed houses with triple-arched windows along the shore to the Manara lighthouse, the snow of Mount Lebanon behind, sailboats and a water-skier, under a coral sky with the name in Arabic and Latin",
  google: 'family=Changa:wght@500;800',
  wall: '#13254d',
  fonts: [['800 300px "Changa"', 'بيروت'], ['500 100px "Changa"', 'BEIRUT'], ['500 28px "Changa"', 'LIBAN · LEBANON · 1965']],
  build,
};

const M = 56, X0 = M, X1 = W - M, Y0 = M, Y1 = H - M;
const HY = 872;           // the sea's horizon
const SHORE = 968;        // where the city meets the water
const RAIL = 1436;        // the balustrade's top
const PROM = 1500, ROAD0 = 1600, ROAD1 = 1782;

const pathOf = (c, pts, close = true) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath(); };

function build() {
  const p = new Plate({ paper: PAPER, seed: 1965 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'mtn', 'city', 'sea', 'rocks', 'boats', 'corniche', 'road', 'palms', 'folk', 'live', 'title');

  sky(p, r);
  mountains(p, r);
  town(p, r);
  sea(p, r);
  rocks(p, r);
  boats(p, r);
  corniche(p, r);
  road(p, r);
  palms(p, r);
  folk(p, r);
  lives(p, r);
  title(p);
  return p;
}

// ================================================================ the coral sky and a pale sun
function sky(p, r) {
  const bands = [[Y0, CORAL], [300, mix(CORAL, CORAL_L, 0.5)], [470, CORAL_L], [600, mix(CORAL_L, PEACH, 0.5)], [700, PEACH], [790, BLUSH]];
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: HY - Y0 + 40 }, (c) => {
    bands.forEach(([y, col], i) => { c.fillStyle = col; c.fillRect(X0, y, X1 - X0, (bands[i + 1] ? bands[i + 1][0] : HY + 40) - y + 1); });
  }, { t: 0.1, d: 1.1, reveal: 'fall', ease: 'inOut' });
  // dry-brush streaks in the gouache
  const streaks = [];
  for (let i = 0; i < 140; i++) { const y = r.range(Y0 + 10, HY - 20), x = r.range(X0, X1), L = r.range(60, 260); streaks.push([[x, y], [x + L, y + r.range(-1.5, 1.5)]]); }
  p.strokes('sky', streaks, 'rgba(255,240,225,0.22)', 2.2, { t: 1.0, d: 0.9, reveal: 'wipe', box: { x: X0, y: Y0, w: X1 - X0, h: HY - Y0 } });
  // the sun, with lines across its foot
  const sx = 1262, sy = 318, sr = 124;
  p.group('sky', { x: sx - sr - 10, y: sy - sr - 10, w: 2 * sr + 20, h: 2 * sr + 20 }, (c) => {
    c.fillStyle = SUNC; c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
    c.fillStyle = mix(CORAL, CORAL_L, 0.5);
    for (let k = 0; k < 4; k++) c.fillRect(sx - sr, sy + 34 + k * 24, 2 * sr, 6 + k * 2.5);
  }, { t: 1.2, d: 1.0, reveal: 'iris' });
}

// ================================================================ Mount Lebanon: three ridges, snow on the highest
function ridge(r, x0, x1, base, peaks, rough) {
  const pts = [[x0, base]];
  for (let x = x0; x <= x1; x += 10) {
    let y = base;
    for (const [px, py, pw] of peaks) y = Math.min(y, py + ((x - px) / pw) ** 2 * (base - py));
    pts.push([x, y + Math.sin(x * 0.05) * rough + r.range(-rough, rough) * 0.4]);
  }
  pts.push([x1, base]);
  return pts;
}
function mountains(p, r) {
  const far = ridge(r, X0, 1280, 900, [[360, 560, 420], [720, 532, 360], [1040, 640, 300]], 3);
  const mid = ridge(r, X0, 1140, 920, [[180, 690, 300], [560, 668, 320], [930, 720, 260]], 4);
  const near = ridge(r, X0, 1060, 940, [[300, 790, 330], [760, 806, 300]], 3);
  // the snow: the far ridge above a wavering line, gullies running down
  const gullies = [];
  for (let x = 160; x < 1220; x += r.range(40, 90)) gullies.push([x, r.range(10, 40), r.range(8, 18)]);
  const snowLine = (x) => 640 + Math.sin(x * 0.03) * 16 + Math.sin(x * 0.11) * 7;
  p.group('mtn', boxOf(far, 4), (c) => { c.fillStyle = MTN1; pathOf(c, far); c.fill(); }, { t: 1.5, d: 0.9, reveal: 'rise' });
  p.group('mtn', boxOf(far, 4), (c) => {
    c.save(); pathOf(c, far); c.clip();
    c.fillStyle = SNOW; c.beginPath(); c.moveTo(X0, Y0);
    for (let x = X0; x <= 1290; x += 8) c.lineTo(x, snowLine(x));
    c.lineTo(1290, Y0); c.closePath(); c.fill();
    // the snow's shaded flanks: tongues of lilac running down the gullies
    c.fillStyle = mix(SNOW, MTN1, 0.55);
    for (const [x, d, w] of gullies) { c.beginPath(); c.moveTo(x - w, snowLine(x - w) - 30 - d * 0.6); c.lineTo(x, snowLine(x) + d); c.lineTo(x + w * 0.6, snowLine(x) - 4); c.lineTo(x + w * 0.2, snowLine(x) - 40 - d); c.closePath(); c.fill(); }
    c.restore();
  }, { t: 2.0, d: 0.9, reveal: 'fall' });
  p.group('mtn', boxOf(mid, 4), (c) => { c.fillStyle = MTN2; pathOf(c, mid); c.fill(); }, { t: 2.2, d: 0.8, reveal: 'rise' });
  // villages on the near hills: white cubes with red roofs, and pines
  const vil = [], pines = [];
  for (let i = 0; i < 90; i++) {
    const x = r.range(X0 + 10, 1040);
    let top = 940; for (const [px, py] of near) if (Math.abs(px - x) < 6) top = Math.min(top, py);
    const y = r.range(top + 14, 940);
    if (r.chance(0.55)) vil.push([x, y, r.range(6, 11)]); else pines.push([x, y, r.range(5, 9)]);
  }
  vil.sort((a, b) => a[1] - b[1]);
  p.group('mtn', boxOf(near, 4), (c) => {
    c.fillStyle = MTN3; pathOf(c, near); c.fill();
    c.save(); pathOf(c, near); c.clip();
    c.fillStyle = shade(MTN3, 0.82);
    for (const [x, y, s] of pines) { c.beginPath(); c.ellipse(x, y, s * 0.9, s * 0.6, 0, 0, Math.PI * 2); c.fill(); }
    for (const [x, y, s] of vil) {
      c.fillStyle = WHITE; c.fillRect(x - s / 2, y - s * 0.7, s, s * 0.7);
      c.fillStyle = ROOF; c.beginPath(); c.moveTo(x - s * 0.62, y - s * 0.68); c.lineTo(x, y - s * 1.05); c.lineTo(x + s * 0.62, y - s * 0.68); c.fill();
    }
    c.restore();
  }, { t: 2.5, d: 0.9, reveal: 'rise' });
}

// ================================================================ the city along the shore
function town(p, r) {
  // three rows, back to front; each building: x, width, height, kind
  const rows = [
    { base: 916, s: 0.55, x1: 1010 },
    { base: 944, s: 0.75, x1: 990 },
    { base: SHORE, s: 1.0, x1: 940 },
  ];
  let tt = 3.0;
  rows.forEach((row, ri) => {
    const list = [];
    for (let x = X0 - 20; x < row.x1;) {
      const kind = r.pick(['block', 'block', 'house', 'house', 'tower', 'old']);
      const w = (kind === 'tower' ? r.range(46, 64) : kind === 'house' ? r.range(50, 70) : r.range(60, 110)) * row.s;
      let h = (kind === 'tower' ? r.range(170, 240) : kind === 'house' ? r.range(50, 70) : kind === 'old' ? r.range(60, 90) : r.range(80, 150)) * row.s;
      if (ri === 2 && x > 600 && x < 720 && kind !== 'house') { h = 300 * row.s; list.push({ x, w: 80, h, kind: 'tower', seed: r.int(1, 1e6) }); x += 84; continue; } // the tall hotel by the bay
      list.push({ x, w, h, kind, seed: r.int(1, 1e6) });
      x += w + r.range(-4, 6) * row.s;
    }
    // draw in chunks of six, so they rise one after another
    for (let n = 0; n < list.length; n += 6) {
      const chunk = list.slice(n, n + 6);
      const xs = chunk[0].x, xe = chunk[chunk.length - 1].x + chunk[chunk.length - 1].w;
      const top = Math.min(...chunk.map((b) => row.base - b.h)) - 40 * row.s;
      p.group('city', { x: xs - 8, y: top, w: xe - xs + 16, h: row.base - top + 6 }, (c) => {
        for (const b of chunk) building(c, b, row.base, row.s);
      }, { t: tt, d: 0.8, reveal: 'rise' });
      tt += 0.13;
    }
  });
  // trees along the waterfront
  const trees = [];
  for (let x = X0 + 10; x < 900; x += r.range(24, 60)) trees.push([x, SHORE + 2, r.range(10, 18)]);
  p.group('city', { x: X0, y: SHORE - 40, w: 900, h: 48 }, (c) => {
    c.fillStyle = PALM;
    for (const [x, y, s] of trees) { c.beginPath(); c.ellipse(x, y - s * 0.8, s, s * 0.85, 0, 0, Math.PI * 2); c.fill(); }
    // the sea wall
    c.fillStyle = SAND; c.fillRect(X0, SHORE - 4, 940 - X0, 8);
  }, { t: tt + 0.1, d: 0.6, reveal: 'wipe' });
  // the Manara lighthouse on its point, striped black and white
  const lx = 780, lb = SHORE - 2, lh = 196;
  p.group('city', { x: lx - 50, y: lb - lh - 50, w: 100, h: lh + 56 }, (c) => {
    c.fillStyle = SAND; c.beginPath(); c.moveTo(lx - 46, lb + 4); c.lineTo(lx - 36, lb - 16); c.lineTo(lx + 36, lb - 16); c.lineTo(lx + 46, lb + 4); c.fill();
    const tw = (y) => lerp(17, 11, (lb - 16 - y) / lh);
    for (let k = 0; k < 7; k++) {
      const ya = lb - 16 - k * (lh - 16) / 7, yb = ya - (lh - 16) / 7;
      c.fillStyle = k % 2 ? NAVY : WHITE;
      c.beginPath(); c.moveTo(lx - tw(ya), ya); c.lineTo(lx + tw(ya), ya); c.lineTo(lx + tw(yb), yb); c.lineTo(lx - tw(yb), yb); c.fill();
    }
    const ty = lb - lh;
    c.fillStyle = NAVY; c.fillRect(lx - 18, ty - 4, 36, 6);
    c.fillStyle = '#ffe2a0'; c.fillRect(lx - 9, ty - 26, 18, 22);
    c.fillStyle = NAVY; c.fillRect(lx - 9, ty - 26, 2, 22); c.fillRect(lx + 7, ty - 26, 2, 22);
    c.beginPath(); c.moveTo(lx - 13, ty - 26); c.lineTo(lx, ty - 40); c.lineTo(lx + 13, ty - 26); c.fill();
    c.fillRect(lx - 1, ty - 50, 2, 12);
  }, { t: tt + 0.3, d: 1.0, reveal: 'rise' });
}

function building(c, b, base, s) {
  const rr = rng(b.seed);
  const { x, w, h, kind } = b, top = base - h;
  if (kind === 'block' || kind === 'tower') {
    // white modern: strip balconies, a shaded side
    c.fillStyle = WHITE; c.fillRect(x, top, w, h);
    c.fillStyle = mix(WHITE, HAZE, 0.32); c.fillRect(x + w * 0.72, top, w * 0.28, h);
    const fl = 13 * s;
    c.fillStyle = mix(NAVY, HAZE, 0.25);
    for (let y = top + fl * 0.8; y < base - fl * 0.6; y += fl) c.fillRect(x + 2 * s, y, w * 0.72 - 4 * s, fl * 0.4);
    c.fillStyle = WHITE;
    for (let y = top + fl * 0.8 + fl * 0.4; y < base - fl * 0.6; y += fl) c.fillRect(x - 1.5 * s, y - 1.6 * s, w * 0.72 + 1.5 * s, 2.4 * s);
    // fins between the bays
    c.fillStyle = mix(WHITE, HAZE, 0.18);
    for (let xx = x + w * 0.24; xx < x + w * 0.7; xx += w * 0.24) c.fillRect(xx, top + 2, 2 * s, h - 2);
    if (kind === 'tower') { c.fillStyle = CORAL; c.fillRect(x, top - 6 * s, w, 6 * s); }
    else if (rr.chance(0.4)) { c.fillStyle = TURQ; c.fillRect(x + w * 0.1, top - 10 * s, w * 0.25, 10 * s); }
  } else if (kind === 'house') {
    // the Lebanese house: sandstone, a red pyramid roof, a triple arch in the middle
    const col = rr.pick([SAND, CREAM, PEACH, '#f2e0c4']);
    c.fillStyle = col; c.fillRect(x, top, w, h);
    c.fillStyle = ROOF; c.beginPath(); c.moveTo(x - 3 * s, top); c.lineTo(x + w * 0.5, top - h * 0.42); c.lineTo(x + w + 3 * s, top); c.fill();
    c.fillStyle = shade(ROOF, 0.78); c.beginPath(); c.moveTo(x + w * 0.5, top - h * 0.42); c.lineTo(x + w + 3 * s, top); c.lineTo(x + w * 0.62, top); c.fill();
    const aw = w * 0.13, ah = h * 0.34, ay = top + h * 0.16;
    c.fillStyle = NAVY;
    for (let k = -1; k <= 1; k++) { const ax = x + w / 2 + k * aw * 1.25 - aw / 2; c.beginPath(); c.moveTo(ax, ay + ah); c.lineTo(ax, ay + aw / 2); c.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0); c.lineTo(ax + aw, ay + ah); c.fill(); }
    for (const fx of [0.14, 0.78]) { c.fillRect(x + w * fx, ay + ah * 0.2, aw * 0.8, ah * 0.8); c.fillRect(x + w * fx, ay + ah * 1.5, aw * 0.8, ah * 0.7); }
    c.fillRect(x + w / 2 - aw / 2, ay + ah * 1.45, aw, ah * 0.9);
    c.fillStyle = shade(col, 0.88); c.fillRect(x, ay + ah + 2 * s, w, 2.5 * s);
  } else {
    // an older house, ochre, with green shutters
    c.fillStyle = '#e7b977'; c.fillRect(x, top, w, h);
    c.fillStyle = shade('#e7b977', 0.85); c.fillRect(x + w * 0.8, top, w * 0.2, h);
    const n = Math.max(2, Math.round(w / (16 * s)));
    for (let f = 0; f < 3; f++) for (let k = 0; k < n; k++) {
      const wx = x + (k + 0.3) * w / n, wy = top + 8 * s + f * h / 3.2;
      if (wy > base - 12 * s) continue;
      c.fillStyle = PALM_L; c.fillRect(wx, wy, w / n * 0.42, h / 6);
    }
    c.fillStyle = shade('#e7b977', 0.7); c.fillRect(x - 2 * s, top - 3 * s, w + 4 * s, 4 * s);
  }
}

// ================================================================ the sea, the shallows, the waves
function sea(p, r) {
  const bands = [[HY, mix(HAZE, PEACH, 0.25)], [HY + 10, HAZE], [HY + 40, mix(HAZE, ULTRA, 0.5)], [HY + 110, ULTRA], [1180, mix(ULTRA, DEEP, 0.5)], [1290, DEEP]];
  p.group('sea', { x: X0, y: HY - 2, w: X1 - X0, h: RAIL - HY + 40 }, (c) => {
    bands.forEach(([y, col], i) => { c.fillStyle = col; c.fillRect(X0, y, X1 - X0, (bands[i + 1] ? bands[i + 1][0] : RAIL + 40) - y + 1); });
  }, { t: 2.8, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // the city's reflection along the shore
  p.group('sea', { x: X0, y: SHORE, w: 950, h: 40 }, (c) => {
    c.fillStyle = mix(HAZE, WHITE, 0.35);
    for (let y = SHORE + 4, k = 0; y < SHORE + 36; y += 6, k++) for (let x = X0 + (k % 2) * 20; x < 930 - k * 10; x += 40 + k * 6) c.fillRect(x, y, 22 - k * 2, 2);
  }, { t: 3.5, d: 0.7, reveal: 'wipe' });
  // waves: little open curves, small and close far off, larger near
  const waves = [];
  for (let y = HY + 30; y < RAIL; y += 6 + (y - HY) * 0.03) {
    const s = 0.3 + (y - HY) / (RAIL - HY) * 1.4;
    for (let x = X0 + r.range(0, 60); x < X1; x += r.range(50, 130) * s) {
      if (x > 830 && y < 1240 && y > 520 && x < X1) continue; // behind the rocks
      const L = 12 * s;
      waves.push([[x - L, y + 3 * s], [x - L * 0.4, y - 2 * s], [x, y], [x + L * 0.4, y - 2 * s], [x + L, y + 3 * s]]);
    }
  }
  p.strokes('sea', waves, 'rgba(205,225,245,0.55)', 2.2, { t: 3.3, d: 1.2, reveal: 'fall', ease: 'inOut', box: { x: X0, y: HY, w: X1 - X0, h: RAIL - HY } });
}

// ================================================================ the Pigeon Rocks
const BIG = [[960, 1214], [966, 1100], [978, 980], [994, 880], [1018, 790], [1058, 722], [1116, 676], [1196, 652], [1290, 644], [1372, 656], [1440, 694], [1490, 762], [1520, 860], [1536, 980], [1548, 1100], [1556, 1214]];
const ARCH = [[1030, 1216], [1034, 1130], [1050, 1074], [1082, 1042], [1120, 1030], [1158, 1040], [1186, 1072], [1202, 1128], [1206, 1216]];
const SMALL = [[836, 1216], [844, 1100], [854, 990], [866, 900], [882, 842], [902, 814], [924, 826], [938, 880], [950, 980], [960, 1100], [966, 1216]];
function rocks(p, r) {
  // the turquoise shallows round their feet
  const shallow = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; shallow.push([lerp(800, X1 + 20, t), 1196 + Math.sin(t * 9) * 5 - 18 * Math.sin(t * Math.PI)]); }
  for (let i = 40; i >= 0; i--) { const t = i / 40; shallow.push([lerp(800, X1 + 20, t), 1262 + Math.sin(t * 7 + 1) * 8 + 10 * Math.sin(t * Math.PI)]); }
  p.group('rocks', boxOf(shallow, 4), (c) => {
    c.fillStyle = TURQ; pathOf(c, shallow); c.fill();
    c.fillStyle = TURQ_L; pathOf(c, shallow.slice(0, 41).map(([x, y]) => [x, y + 10]).concat(shallow.slice(0, 41).reverse().map(([x, y]) => [x, y + 22]))); c.fill();
  }, { t: 5.0, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // the lit face: the right side of each rock
  const litBig = [[1150, 1214], [1236, 1060], [1250, 900], [1232, 760], [1262, 645], [1290, 644], [1372, 656], [1440, 694], [1490, 762], [1520, 860], [1536, 980], [1548, 1100], [1556, 1214]];
  const litSmall = [[906, 1216], [902, 814], [924, 826], [938, 880], [950, 980], [960, 1100], [966, 1216]];
  // limestone beds: wavy lines across, and a stipple
  const beds = [];
  for (let y = 600; y < 1210; y += r.range(26, 44)) {
    const l = []; for (let x = 840; x < X1 + 10; x += 14) l.push([x, y + Math.sin(x * 0.02 + y) * 4 + (x - 1200) * 0.04]); beds.push(l);
  }
  const dots = [];
  for (let i = 0; i < 1400; i++) dots.push([r.range(850, X1), r.range(540, 1214), r.range(1, 2.6)]);
  const draw = (c, outline, lit, hole) => {
    c.beginPath(); outline.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
    if (hole) { hole.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }
    c.save(); c.fillStyle = ROCK_S; c.fill('evenodd'); c.clip('evenodd');
    c.fillStyle = ROCK; pathOf(c, lit); c.fill();
    c.fillStyle = ROCK_L; pathOf(c, lit.map(([x, y]) => [x + 40, y + 20])); c.fill();
    c.strokeStyle = ROCK_D; c.lineWidth = 2.2; c.globalAlpha = 0.55; c.beginPath();
    for (const l of beds) { c.moveTo(l[0][0], l[0][1]); for (const q of l) c.lineTo(q[0], q[1]); } c.stroke();
    c.globalAlpha = 0.5; c.fillStyle = ROCK_D; c.beginPath();
    for (const [x, y, s] of dots) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
    c.globalAlpha = 1;
    // the dark wet foot
    c.fillStyle = ROCK_D; c.fillRect(800, 1186, 800, 40);
    c.restore();
  };
  p.group('rocks', boxOf(SMALL, 8), (c) => draw(c, SMALL, litSmall), { t: 5.4, d: 1.2, reveal: 'rise' });
  p.group('rocks', boxOf(BIG, 8), (c) => draw(c, BIG, litBig, ARCH), { t: 5.8, d: 1.7, reveal: 'rise', ease: 'out' });
  // the arch's inner shadow, and the tufts of green on top
  p.group('rocks', { x: 1040, y: 990, w: 200, h: 230 }, (c) => {
    c.fillStyle = ROCK_D;
    c.beginPath(); c.moveTo(1062, 1216); for (const [x, y] of ARCH) c.lineTo(x, y); c.lineTo(1226, 1216); c.lineTo(1212, 1216);
    for (let i = ARCH.length - 2; i > 0; i--) c.lineTo(ARCH[i][0] - 10, ARCH[i][1] + 16); c.closePath(); c.fill();
  }, { t: 7.2, d: 0.6, reveal: 'fade' });
  const tufts = [];
  for (let i = 0; i < 26; i++) { const t = r.range(0.2, 0.9); const k = Math.floor(t * (BIG.length - 1)); const a = BIG[k], b = BIG[k + 1]; const u = r(); if (a[1] > 760) continue; tufts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) + 4, r.range(6, 14)]); }
  for (let i = 0; i < 6; i++) tufts.push([r.range(890, 925), r.range(818, 832), r.range(5, 9)]);
  p.group('rocks', { x: 880, y: 520, w: 640, h: 400 }, (c) => {
    c.fillStyle = PALM_L;
    for (const [x, y, s] of tufts) { c.beginPath(); c.ellipse(x, y, s, s * 0.55, 0, Math.PI, 0); c.fill(); }
  }, { t: 7.4, d: 0.6, reveal: 'fade' });
  // the foam where the sea breaks on them
  const foam = [];
  for (let i = 0; i < 46; i++) foam.push([r.range(850, X1), r.range(1204, 1226), r.range(6, 18)]);
  p.group('rocks', { x: 830, y: 1180, w: X1 - 830, h: 60 }, (c) => {
    c.fillStyle = WHITE;
    for (const [x, y, s] of foam) { c.beginPath(); c.ellipse(x, y, s, s * 0.38, 0, 0, Math.PI * 2); c.fill(); }
  }, { t: 7.6, d: 0.7, reveal: 'wipe' });
}

// ================================================================ sailboats and a fishing boat
function boats(p, r) {
  const sails = [[560, 1012, 0.55], [700, 1064, 0.7], [380, 1040, 0.5], [1480, 1300, 1.05]];
  sails.forEach(([x, y, s], i) => {
    p.group('boats', { x: x - 60 * s, y: y - 130 * s, w: 120 * s, h: 145 * s }, (c) => {
      c.fillStyle = NAVY; c.beginPath(); c.moveTo(x - 40 * s, y - 8 * s); c.lineTo(x + 44 * s, y - 8 * s); c.lineTo(x + 32 * s, y + 4 * s); c.lineTo(x - 32 * s, y + 4 * s); c.fill();
      c.fillStyle = WHITE; c.beginPath(); c.moveTo(x, y - 120 * s); c.lineTo(x, y - 14 * s); c.lineTo(x + 40 * s, y - 14 * s); c.fill();
      c.fillStyle = i % 2 ? CORAL : WHITE; c.beginPath(); c.moveTo(x - 4 * s, y - 100 * s); c.lineTo(x - 4 * s, y - 14 * s); c.lineTo(x - 36 * s, y - 14 * s); c.fill();
      c.fillStyle = 'rgba(220,235,250,0.6)'; c.fillRect(x - 30 * s, y + 6 * s, 64 * s, 2.5 * s);
    }, { t: 6.6 + i * 0.25, d: 0.7, reveal: 'drop', dy: 18 });
  });
  // a fisherman's flouka, blue and white, nearer
  const fx = 640, fy = 1340;
  p.group('boats', { x: fx - 120, y: fy - 110, w: 240, h: 130 }, (c) => {
    c.fillStyle = WHITE; c.beginPath(); c.moveTo(fx - 100, fy - 34); c.quadraticCurveTo(fx, fy - 18, fx + 104, fy - 40); c.lineTo(fx + 80, fy); c.lineTo(fx - 80, fy); c.closePath(); c.fill();
    c.fillStyle = TURQ; c.fillRect(fx - 88, fy - 18, 176, 8);
    c.fillStyle = CORAL; c.fillRect(fx - 82, fy - 8, 164, 8);
    // the fisherman in his cap, and his rod
    c.fillStyle = NAVY; c.beginPath(); c.arc(fx + 18, fy - 76, 9, 0, Math.PI * 2); c.fill(); c.fillRect(fx + 8, fy - 66, 20, 34);
    c.fillStyle = WHITE; c.fillRect(fx + 9, fy - 87, 18, 5);
    c.strokeStyle = NAVY; c.lineWidth = 2.4; c.beginPath(); c.moveTo(fx + 24, fy - 56); c.lineTo(fx - 70, fy - 106); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.moveTo(fx - 70, fy - 106); c.lineTo(fx - 96, fy + 6); c.stroke();
    c.fillStyle = 'rgba(220,235,250,0.55)'; c.fillRect(fx - 90, fy + 6, 190, 3); c.fillRect(fx - 60, fy + 14, 120, 2.5);
  }, { t: 7.6, d: 0.7, reveal: 'drop', dy: 16 });
}

// ================================================================ the corniche: balustrade, promenade
function corniche(p, r) {
  // the coast below the balustrade, then the rail
  p.group('corniche', { x: X0, y: RAIL - 6, w: X1 - X0, h: PROM - RAIL + 20 }, (c) => {
    c.fillStyle = WHITE; c.fillRect(X0, RAIL, X1 - X0, 14);
    c.fillStyle = mix(WHITE, HAZE, 0.3); c.fillRect(X0, RAIL + 14, X1 - X0, 4);
    // balusters: turned, all as one path
    c.fillStyle = WHITE; c.beginPath();
    for (let x = X0 + 6; x < X1; x += 22) {
      const y0 = RAIL + 18, y1 = PROM - 10;
      c.moveTo(x - 5, y0); c.lineTo(x + 5, y0); c.quadraticCurveTo(x + 2, y0 + 12, x + 7, (y0 + y1) / 2 + 6); c.quadraticCurveTo(x + 9, y1 - 8, x + 5, y1); c.lineTo(x - 5, y1); c.quadraticCurveTo(x - 9, y1 - 8, x - 7, (y0 + y1) / 2 + 6); c.quadraticCurveTo(x - 2, y0 + 12, x - 5, y0); c.closePath();
    }
    c.fill();
    c.fillStyle = mix(WHITE, HAZE, 0.35); c.beginPath();
    for (let x = X0 + 6; x < X1; x += 22) { c.rect(x + 2, RAIL + 22, 3, PROM - RAIL - 34); } c.fill();
    c.fillStyle = WHITE; c.fillRect(X0, PROM - 12, X1 - X0, 12);
    // pillars every so often, with a coral cap
    for (let x = X0 + 150; x < X1; x += 330) { c.fillStyle = WHITE; c.fillRect(x - 13, RAIL - 8, 26, PROM - RAIL + 8); c.fillStyle = CORAL; c.fillRect(x - 16, RAIL - 14, 32, 8); }
  }, { t: 8.0, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // the promenade, paved in coral and cream
  p.group('corniche', { x: X0, y: PROM - 2, w: X1 - X0, h: ROAD0 - PROM + 4 }, (c) => {
    c.fillStyle = SAND; c.fillRect(X0, PROM, X1 - X0, ROAD0 - PROM);
    c.fillStyle = mix(SAND, CORAL, 0.35);
    for (let y = PROM + 6, k = 0; y < ROAD0 - 18; y += 22, k++) for (let x = X0 + (k % 2) * 22; x < X1; x += 44) { c.beginPath(); c.moveTo(x, y + 9); c.lineTo(x + 11, y); c.lineTo(x + 22, y + 9); c.lineTo(x + 11, y + 18); c.fill(); }
    c.fillStyle = WHITE; c.fillRect(X0, ROAD0 - 14, X1 - X0, 10);
    c.fillStyle = shade(SAND, 0.72); c.fillRect(X0, ROAD0 - 4, X1 - X0, 6);
  }, { t: 8.4, d: 0.9, reveal: 'wipeL', ease: 'inOut' });
}

// ================================================================ the road and its cars, the near sidewalk
function car(c, x, y, s, col, roof, open, dir) {
  c.save(); c.translate(x, y); c.scale(s * dir, s);
  c.fillStyle = 'rgba(30,30,60,0.25)'; c.fillRect(-110, -4, 220, 8);
  c.fillStyle = col;
  c.beginPath(); c.moveTo(-118, -20); c.lineTo(-120, -52); c.lineTo(-96, -60); c.lineTo(-40, -62);
  if (open) { c.lineTo(-20, -64); c.lineTo(30, -64); }
  else { c.lineTo(-24, -98); c.lineTo(42, -98); c.lineTo(62, -62); }
  c.lineTo(110, -58); c.quadraticCurveTo(124, -52, 122, -22); c.closePath(); c.fill();
  if (!open) { c.fillStyle = roof; c.beginPath(); c.moveTo(-24, -98); c.lineTo(42, -98); c.lineTo(46, -92); c.lineTo(-27, -92); c.fill(); c.fillStyle = NAVY; c.beginPath(); c.moveTo(-18, -90); c.lineTo(8, -90); c.lineTo(8, -64); c.lineTo(-32, -64); c.fill(); c.beginPath(); c.moveTo(14, -90); c.lineTo(38, -90); c.lineTo(54, -64); c.lineTo(14, -64); c.fill(); }
  else {
    // a windshield, and two in the front seats
    c.fillStyle = NAVY; c.fillRect(34, -84, 4, 22);
    c.beginPath(); c.arc(-4, -80, 9, 0, Math.PI * 2); c.arc(22, -80, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = CORAL; c.fillRect(-14, -92, 20, 7);
    c.fillStyle = roof; c.fillRect(-60, -70, 90, 8);
  }
  c.fillStyle = WHITE; c.fillRect(-116, -40, 236, 4); c.fillRect(116, -36, 10, 10); c.fillRect(-126, -36, 10, 10);
  c.fillStyle = '#ffe9a6'; c.beginPath(); c.arc(118, -46, 5, 0, Math.PI * 2); c.fill();
  for (const wx of [-74, 74]) { c.fillStyle = NAVY; c.beginPath(); c.arc(wx, -18, 20, 0, Math.PI * 2); c.fill(); c.fillStyle = WHITE; c.beginPath(); c.arc(wx, -18, 10, 0, Math.PI * 2); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(wx, -18, 4, 0, Math.PI * 2); c.fill(); }
  c.restore();
}
function road(p, r) {
  p.group('road', { x: X0, y: ROAD0 - 2, w: X1 - X0, h: Y1 - ROAD0 + 4 }, (c) => {
    c.fillStyle = ROAD; c.fillRect(X0, ROAD0, X1 - X0, ROAD1 - ROAD0);
    c.fillStyle = ROAD_L; for (let y = ROAD0 + 8; y < ROAD1; y += 12) c.fillRect(X0, y, X1 - X0, 2);
    c.fillStyle = WHITE; for (let x = X0 + 20; x < X1; x += 120) c.fillRect(x, (ROAD0 + ROAD1) / 2 - 3, 64, 6);
    // the near curb and sidewalk, in coral and cream tiles
    c.fillStyle = WHITE; c.fillRect(X0, ROAD1, X1 - X0, 12);
    c.fillStyle = CORAL_L; c.fillRect(X0, ROAD1 + 12, X1 - X0, Y1 - ROAD1);
    c.fillStyle = PEACH;
    for (let y = ROAD1 + 22, k = 0; y < Y1; y += 30, k++) for (let x = X0 + (k % 2) * 30; x < X1; x += 60) c.fillRect(x, y, 30, 30);
  }, { t: 8.6, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  const cars = [
    { x: 410, y: ROAD0 + 76, s: 0.92, col: CORAL, roof: WHITE, open: true, dir: 1, dx: -400 },
    { x: 1090, y: ROAD0 + 80, s: 0.9, col: WHITE, roof: TURQ, open: false, dir: 1, dx: -400 },
    { x: 760, y: ROAD1 - 6, s: 1.0, col: TURQ, roof: WHITE, open: false, dir: -1, dx: 400 },
  ];
  cars.forEach((o, i) => p.mark('road', {
    t: 9.4 + i * 0.3, d: 1.2, reveal: 'slide', dx: o.dx, ease: 'out', box: { x: o.x - 140 * o.s - 10, y: o.y - 110 * o.s, w: 280 * o.s + 20, h: 120 * o.s },
    draw: (c) => car(c, o.x, o.y, o.s, o.col, o.roof, o.open, o.dir),
  }));
}

// ================================================================ the palms and lamps of the corniche
function palm(c, f) {
  const { x, y, h, lean } = f;
  const tx = x + lean, ty = y - h;
  // the trunk: a slim curve, ringed
  c.fillStyle = TRUNK;
  c.beginPath(); c.moveTo(x - 13, y); c.quadraticCurveTo(x + lean * 0.3 - 9, y - h * 0.55, tx - 6, ty); c.lineTo(tx + 6, ty); c.quadraticCurveTo(x + lean * 0.3 + 9, y - h * 0.55, x + 13, y); c.closePath(); c.fill();
  c.strokeStyle = shade(TRUNK, 0.72); c.lineWidth = 2; c.beginPath();
  for (let t = 0.04; t < 0.98; t += 0.035) {
    const px = lerp(x, tx, t) + lean * 0.3 * 4 * t * (1 - t) * 0.3, py = lerp(y, ty, t), w = lerp(13, 6, t);
    c.moveTo(px - w, py); c.quadraticCurveTo(px, py + 4, px + w, py - 1);
  }
  c.stroke();
  // the old fronds hanging, a skirt
  c.fillStyle = '#a98055'; c.beginPath(); c.moveTo(tx - 18, ty + 6); c.lineTo(tx + 18, ty + 6); c.lineTo(tx + 12, ty + 36); c.lineTo(tx - 12, ty + 36); c.fill();
  // the crown: long fronds, each a blade with a saw edge of leaflets hanging from it
  for (const fr of f.fronds) {
    const [a, L, droop, col] = fr;
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L + droop;
    const mx = tx + Math.cos(a) * L * 0.55, my = ty + Math.sin(a) * L * 0.55 - Math.abs(Math.cos(a)) * 26;
    const at = (t) => [(1 - t) ** 2 * tx + 2 * t * (1 - t) * mx + t * t * ex, (1 - t) ** 2 * ty + 2 * t * (1 - t) * my + t * t * ey];
    const top = [], bot = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const t = i / n, [bx, by] = at(t), w = 34 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.7 + 2;
      top.push([bx, by - 3]);
      bot.push([bx - Math.cos(a) * 4, by + w * (i % 2 ? 0.55 : 1)]);
    }
    c.fillStyle = col; c.beginPath(); c.moveTo(tx, ty);
    for (const q of top) c.lineTo(q[0], q[1]);
    for (let i = bot.length - 1; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]);
    c.closePath(); c.fill();
    c.strokeStyle = shade(col, 0.7); c.lineWidth = 2; c.beginPath(); c.moveTo(tx, ty); for (const q of top) c.lineTo(q[0], q[1] + 1); c.stroke();
  }
  c.fillStyle = '#6f4a30'; c.beginPath(); c.arc(tx + 4, ty + 10, 9, 0, Math.PI * 2); c.arc(tx - 8, ty + 12, 8, 0, Math.PI * 2); c.fill();
}
function palms(p, r) {
  const list = [
    { x: 236, y: ROAD0 - 4, h: 870, lean: 40 },
    { x: 1290, y: ROAD0 - 4, h: 1060, lean: -40 },
  ];
  list.forEach((f) => {
    f.fronds = [];
    for (let i = 0; i < 16; i++) {
      if (i === 7 || i === 8) continue; // none straight up
      const a = -Math.PI / 2 + (i / 15 - 0.5) * Math.PI * 1.9 + r.range(-0.08, 0.08);
      const side = Math.abs(Math.cos(a));
      f.fronds.push([a, r.range(170, 230) * (0.8 + side * 0.4), side * r.range(60, 120), i % 3 === 0 ? PALM_L : PALM]);
    }
    f.fronds.sort((a, b) => (a[3] === PALM ? -1 : 1) - (b[3] === PALM ? -1 : 1));
  });
  list.forEach((f, i) => {
    const tx = f.x + f.lean, ty = f.y - f.h;
    p.group('palms', { x: Math.min(f.x, tx) - 300, y: ty - 260, w: Math.abs(f.lean) + 600, h: f.h + 270 }, (c) => palm(c, f), { t: 9.0 + i * 0.3, d: 1.4, reveal: 'rise', ease: 'out' });
  });
  // lamps: a slim post with two globes
  const lamps = [520, 1000, 60 + 1480 * 0.0 + 1370];
  p.group('palms', { x: X0, y: ROAD0 - 330, w: X1 - X0, h: 340 }, (c) => {
    for (const x of lamps) {
      c.fillStyle = NAVY; c.fillRect(x - 3, ROAD0 - 290, 6, 290); c.fillRect(x - 9, ROAD0 - 30, 18, 30);
      c.fillRect(x - 34, ROAD0 - 286, 68, 4);
      for (const sgn of [-1, 1]) { c.fillStyle = WHITE; c.beginPath(); c.arc(x + sgn * 34, ROAD0 - 300, 13, 0, Math.PI * 2); c.fill(); c.fillStyle = NAVY; c.fillRect(x + sgn * 34 - 4, ROAD0 - 288, 8, 6); }
    }
  }, { t: 10.0, d: 0.7, reveal: 'rise' });
}

// ================================================================ strollers, a ka'ak seller, a fisherman at the rail
function person(c, x, y, s, o) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const { col, skin = '#a5694c', dress, hat, legs = NAVY, dir = 1 } = o;
  c.fillStyle = legs; c.fillRect(-6, -36, 5, 36); c.fillRect(2, -36, 5, 36);
  c.fillStyle = col;
  if (dress) { c.beginPath(); c.moveTo(-9, -72); c.lineTo(9, -72); c.lineTo(17, -30); c.lineTo(-17, -30); c.closePath(); c.fill(); }
  else { c.fillRect(-10, -72, 20, 38); }
  c.fillStyle = skin; c.beginPath(); c.arc(0, -82, 9, 0, Math.PI * 2); c.fill();
  if (hat === 'sun') { c.fillStyle = WHITE; c.beginPath(); c.ellipse(0, -88, 16, 4, 0, 0, Math.PI * 2); c.fill(); c.fillRect(-7, -96, 14, 8); }
  if (hat === 'hair') { c.fillStyle = NAVY; c.beginPath(); c.arc(0, -85, 10, Math.PI, 0); c.fill(); c.fillRect(-10 * dir, -86, 4, 14); }
  if (o.bag) { c.fillStyle = o.bag; c.fillRect(10 * dir, -56, 10 * dir, 14); }
  c.restore();
}
function folk(p, r) {
  const walkers = [];
  const cols = [WHITE, CORAL, TURQ, NAVY, '#e7b977', ULTRA, PEACH, WHITE];
  for (let x = 110; x < 1500; x += r.range(70, 160)) {
    if (Math.abs(x - 980) < 90) continue;
    walkers.push([x, PROM + r.range(26, 82), r.range(0.82, 1.0), { col: r.pick(cols), dress: r.chance(0.45), hat: r.pick([null, 'sun', 'hair']), dir: r.chance(0.5) ? 1 : -1, bag: r.chance(0.2) ? CORAL : null }]);
  }
  walkers.sort((a, b) => a[1] - b[1]);
  p.group('folk', { x: X0, y: PROM - 70, w: X1 - X0, h: ROAD0 - PROM + 80 }, (c) => {
    for (const [x, y, s, o] of walkers) person(c, x, y, s, o);
  }, { t: 10.2, d: 0.8, reveal: 'fade' });
  // the ka'ak seller: a cart with a coral parasol and a stack of sesame rings
  const kx = 980, ky = PROM + 84;
  p.group('folk', { x: kx - 110, y: ky - 190, w: 220, h: 200 }, (c) => {
    c.fillStyle = CORAL; c.beginPath(); c.moveTo(kx - 92, ky - 128); c.quadraticCurveTo(kx, ky - 186, kx + 92, ky - 128); c.closePath(); c.fill();
    c.fillStyle = WHITE; for (let k = -3; k <= 3; k += 2) { c.beginPath(); c.moveTo(kx, ky - 160); c.lineTo(kx + k * 13 - 6, ky - 128); c.lineTo(kx + k * 13 + 6, ky - 128); c.fill(); }
    c.fillStyle = NAVY; c.fillRect(kx - 2, ky - 160, 4, 110);
    c.fillStyle = TURQ; c.fillRect(kx - 54, ky - 58, 108, 34);
    c.fillStyle = WHITE; c.fillRect(kx - 58, ky - 62, 116, 6);
    for (const wx of [-36, 36]) { c.fillStyle = NAVY; c.beginPath(); c.arc(kx + wx, ky - 14, 14, 0, Math.PI * 2); c.fill(); c.fillStyle = WHITE; c.beginPath(); c.arc(kx + wx, ky - 14, 5, 0, Math.PI * 2); c.fill(); }
    // the ka'ak: purse-shaped rings of bread, stacked on a pole
    c.strokeStyle = '#c9864a'; c.lineWidth = 5;
    for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(kx - 30 + k * 15, ky - 74 - (k % 2) * 8, 9, 12, 0, 0, Math.PI * 2); c.stroke(); }
    person(c, kx + 72, ky - 4, 0.92, { col: WHITE, hat: 'sun', dir: -1 });
  }, { t: 10.5, d: 0.6, reveal: 'drop', dy: 14 });
  // a fisherman leaning on the rail, his line over the sea
  const fx = 470;
  p.group('folk', { x: fx - 40, y: RAIL - 260, w: 220, h: 340 }, (c) => {
    person(c, fx, PROM + 30, 0.95, { col: '#e7b977', hat: 'sun', dir: 1 });
    c.strokeStyle = NAVY; c.lineWidth = 2.6; c.beginPath(); c.moveTo(fx + 8, PROM - 30); c.lineTo(fx + 150, RAIL - 230); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.moveTo(fx + 150, RAIL - 230); c.quadraticCurveTo(fx + 170, RAIL - 100, fx + 162, RAIL - 4); c.stroke();
  }, { t: 10.7, d: 0.6, reveal: 'fade' });
  // bougainvillea spilling into the bottom corners
  const flowers = [];
  for (const [cx, cy, n] of [[X0 + 40, Y1 - 10, 180], [X1 - 30, Y1 - 20, 150]]) {
    for (let i = 0; i < n; i++) { const a = r.range(Math.PI, Math.PI * 2), d = Math.sqrt(r()) * 180; flowers.push([cx + Math.cos(a) * d * 1.3, cy + Math.sin(a) * d * 0.75, r.range(4, 9), r.chance(0.7) ? CORAL : '#d94a6a']); }
  }
  const leaves = flowers.map(([x, y, s]) => [x + 6, y + 4, s * 1.2]);
  p.group('folk', { x: X0 - 10, y: Y1 - 170, w: X1 - X0 + 20, h: 180 }, (c) => {
    c.fillStyle = PALM; for (const [x, y, s] of leaves) { c.beginPath(); c.ellipse(x, y, s, s * 0.6, 0.6, 0, Math.PI * 2); c.fill(); }
    for (const [x, y, s, col] of flowers) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.9, y + s * 0.6); c.lineTo(x - s * 0.9, y + s * 0.6); c.closePath(); c.fill(); }
  }, { t: 10.9, d: 0.7, reveal: 'pop' });
}

// ================================================================ what moves: a water-skier, pigeons round the rocks, glints
function lives(p, r) {
  p.live('live', {
    t: 10.2, d: 0.6, reveal: 'fade', box: { x: X0, y: 1180, w: X1 - X0, h: 250 },
    draw: (c, time) => {
      // the boat crosses from left to right, pulling a skier; then again
      const u = ((time - 10.2) / 18) % 1;
      const bx = lerp(X0 - 200, X1 + 260, u), by = 1384 - u * 18;
      const fade = clamp(Math.min(u * 10, (1 - u) * 10));
      c.globalAlpha *= fade;
      // wake: two white lines spreading behind
      c.strokeStyle = 'rgba(240,248,255,0.8)'; c.lineWidth = 3; c.beginPath();
      c.moveTo(bx - 20, by); c.lineTo(bx - 260, by - 16); c.moveTo(bx - 20, by + 4); c.lineTo(bx - 260, by + 22); c.stroke();
      c.fillStyle = WHITE; c.beginPath(); c.moveTo(bx - 50, by - 16); c.lineTo(bx + 34, by - 16); c.lineTo(bx + 52, by - 22); c.lineTo(bx + 30, by + 2); c.lineTo(bx - 50, by + 2); c.fill();
      c.fillStyle = CORAL; c.fillRect(bx - 50, by - 6, 80, 5);
      c.fillStyle = NAVY; c.beginPath(); c.arc(bx - 10, by - 28, 7, 0, Math.PI * 2); c.fill(); c.fillRect(bx - 16, by - 22, 12, 8);
      // the rope and the skier, leaning back, a plume of spray
      const sx = bx - 210, sy = by + 10 + Math.sin(time * 2.2) * 6;
      c.strokeStyle = NAVY; c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx - 46, by - 10); c.lineTo(sx + 14, sy - 46); c.stroke();
      c.fillStyle = WHITE; c.beginPath();
      for (let k = 0; k < 8; k++) { const a = k * 0.5 + time * 3; c.moveTo(sx - 18 - k * 9, sy - 4); c.arc(sx - 18 - k * 9, sy - 4 - Math.abs(Math.sin(a)) * 10 - k * 1.5, 6 + k * 0.8, 0, Math.PI * 2); }
      c.fill();
      c.fillStyle = CORAL; c.fillRect(sx - 18, sy - 2, 40, 4);
      c.fillStyle = NAVY; c.lineWidth = 5; c.strokeStyle = NAVY; c.lineCap = 'round';
      c.beginPath(); c.moveTo(sx - 4, sy - 2); c.lineTo(sx + 2, sy - 22); c.lineTo(sx - 6, sy - 44); c.moveTo(sx + 6, sy - 2); c.lineTo(sx + 8, sy - 22); c.stroke();
      c.beginPath(); c.moveTo(sx - 6, sy - 40); c.lineTo(sx + 14, sy - 46); c.stroke();
      c.fillStyle = '#a5694c'; c.beginPath(); c.arc(sx - 9, sy - 54, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = WHITE; c.fillRect(sx - 12, sy - 40, 12, 14);
    },
  });
  // the pigeons the rocks are named for, wheeling round them
  const birds = [];
  for (let i = 0; i < 12; i++) birds.push([r.range(0, Math.PI * 2), r.range(120, 300), r.range(0.25, 0.45) * (r.chance(0.5) ? 1 : -1), r.range(0.7, 1.2), r.range(560, 860)]);
  p.live('live', {
    t: 10.8, d: 0.8, reveal: 'fade', box: { x: 820, y: 380, w: X1 - 820, h: 640 },
    draw: (c, time) => {
      c.strokeStyle = WHITE; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath();
      for (const [a0, rad, sp, s, cy] of birds) {
        const a = a0 + time * sp, x = 1270 + Math.cos(a) * rad, y = cy + Math.sin(a) * rad * 0.28, f = Math.sin(time * 6 + a0 * 3) * 5 * s;
        c.moveTo(x - 12 * s, y + f * 0.4); c.quadraticCurveTo(x - 5 * s, y - 6 * s - f, x, y); c.quadraticCurveTo(x + 5 * s, y - 6 * s - f, x + 12 * s, y + f * 0.4);
      }
      c.stroke();
    },
  });
  // glints on the open sea
  const gl = [];
  for (let i = 0; i < 46; i++) { const y = r.range(HY + 20, 1180); gl.push([r.range(X0, 840), y, (y - HY) / 300 + 0.3, r() * 6, r.range(0.6, 1.4)]); }
  p.live('live', {
    t: 11.0, d: 0.8, reveal: 'fade', box: { x: X0, y: HY, w: 800, h: 320 },
    draw: (c, time) => {
      c.fillStyle = 'rgba(255,240,225,0.85)'; c.beginPath();
      for (const [x, y, s, ph, sp] of gl) { const a = Math.sin(time * sp + ph); if (a < 0.3) continue; c.rect(x, y, 16 * s * a, 2 * s); }
      c.fill();
    },
  });
}

// ================================================================ the name: بيروت across the sky, BEIRUT under it
function title(p) {
  const cx = 560, ay = 326;
  const f = '800 300px "Changa"';
  // set whole so the letters join, wiped in from the right as it is read
  p.mark('title', {
    t: 11.2, d: 1.4, reveal: 'wipeL', ease: 'inOut', box: { x: cx - 420, y: ay - 300, w: 840, h: 420 },
    draw: (c) => {
      c.font = f; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillStyle = mix(CORAL, '#b54a3a', 0.6); c.fillText('بيروت', cx + 8, ay + 8);
      c.fillStyle = WHITE; c.fillText('بيروت', cx, ay);
    },
  });
  p.type('title', 'BEIRUT', cx, 498, { size: 100, family: '"Changa"', weight: 500, color: NAVY, track: 0.42, align: 'center', t: 12.2, gap: 0.1, d: 0.5, reveal: 'press' });
  p.group('title', { x: cx - 300, y: 512, w: 600, h: 60 }, (c) => {
    c.fillStyle = NAVY; c.fillRect(cx - 340, 538, 120, 3); c.fillRect(cx + 220, 538, 120, 3);
  }, { t: 12.8, d: 0.6, reveal: 'wipe' });
  p.type('title', 'LIBAN · LEBANON · 1965', cx, 548, { size: 26, family: '"Changa"', weight: 500, color: NAVY, track: 0.18, align: 'center', t: 12.9, gap: 0.02, d: 0.3, reveal: 'fade' });
}
