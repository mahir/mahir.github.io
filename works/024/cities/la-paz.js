// La Paz: the city as an aguayo, the striped cloth of the Andes. The whole
// sheet is woven, weft row by weft row, from the top: the title band with its
// stepped diamonds, a sky in bands of blue, Illimani's snows, the rim of El Alto,
// the canyon filled to its brim with brick houses, the towers of the center, the
// church of San Francisco and the spires of the Valle de la Luna. Every edge is
// stepped, as a weave makes it. Then, over the cloth, the cable cars' lines are
// stitched across the bowl in red, yellow and green, and their cabins run.

import { Plate, W, H } from '../print.js';
import { mix, lerp, clamp } from '../kit.js';

// the dyes
const CRIMSON = '#a3163a', MAGENTA = '#d42d6e', ORANGE = '#ee7f1c', GOLD = '#f3bd2e', GREEN = '#178a5a', DGREEN = '#0f5e40';
const PURPLE = '#3b1d58', COBALT = '#2649a8', NIGHT = '#1b2a6e', CREAM = '#f3e4c4', BLACK = '#24161c', ROSE = '#f08aa8';
const BRICK = '#b0503a', BRICK_D = '#8e3d2d', BRICK_L = '#c8694a', WIN = '#3a1d20', EARTH = '#c98b4e', EARTH_D = '#a86a3a';
const SNOW = '#f7f3ea', ICE = '#c9d4ec', ICE_D = '#98a9d6', ROCK = '#5c3d5c', ROCK_D = '#432c48';
const RED_LINE = '#e0262f', YEL_LINE = '#f6c51c', GRN_LINE = '#20a35a';
const FACE = '"Concert One", sans-serif';

export const city = {
  id: 'la-paz', name: 'La Paz', wall: '#2a1430',
  alt: 'La Paz woven as an Andean aguayo cloth, every edge stepped: Illimani snow-capped over a sky in bands of blue, the rim of El Alto, the canyon filled with brick houses, the towers of the center, the church of San Francisco with its bell tower and the clay spires of the Valle de la Luna, with the red, yellow and green cable car lines stitched across the bowl and their cabins running, between bands of stepped diamonds',
  google: 'family=Concert+One',
  fonts: [['400 100px "Concert One"', 'LA PAZ CHUQI YAPU MARKA · BOLIVIA ILLIMANI 6438 m 3640 m'], ['400 30px "Concert One"', 'LA PAZ']],
  build,
};

const ROW = 10; // a weft row
const Q = 6; // the warp step: edges move in steps of this
const qx = (x) => Math.round(x / Q) * Q;
// the bands
const TB0 = 36, TB1 = 330, PB0 = 330, PB1 = 390, PIC0 = 390, PIC1 = 1700, ZB0 = 1700, ZB1 = 1780;

// where a polygon crosses a horizontal line: pairs of x
function cross(pts, y) {
  const xs = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
  }
  return xs.sort((u, v) => u - v);
}

function build() {
  const p = new Plate({ paper: CREAM, seed: 1548 });
  const r = p.r;
  p.stack('weave', 'stitch', 'cabins', 'birds', 'shuttle', 'title', 'warp');

  const pieces = scene(r);
  const rows = weave(r, pieces);
  // weave the sheet from the top, a row at a time, the shuttle going back and forth
  const T0 = 0.15, GAP = 0.041, D = 0.42;
  rows.forEach((rects, i) => {
    const y = i * ROW;
    p.group('weave', { x: 0, y: y - 2, w: W, h: ROW + 4 }, (c) => {
      for (const [x, yy, w, h, col] of rects) { c.fillStyle = col; c.fillRect(x, yy, w, h); }
    }, { t: T0 + i * GAP, d: D, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'linear' });
  });
  const wEnd = T0 + rows.length * GAP + D;
  // the shuttle, riding the row being woven
  p.live('shuttle', {
    t: T0, d: 0.2, reveal: 'none',
    draw: (c, time) => {
      if (time > wEnd - 0.05) return;
      // the row last begun is where it rides; it crosses the sheet and back on its own beat
      const i = clamp(Math.floor((time - T0) / GAP), 0, rows.length - 1);
      const ph = ((time - T0) / 0.8) % 2, q = ph < 1 ? ph : 2 - ph;
      const x = 40 + q * (W - 80), y = i * ROW + ROW / 2;
      shuttle(c, x, y, ph < 1 ? 1 : -1);
    },
  });
  warp(p, r);
  cables(p, r, wEnd);
  birds(p, r);
  folk(p, r);
  title(p, r);
  return p;
}

// the warp: fine vertical threads over everything, and the ridges of each weft row
function warp(p, r) {
  p.group('warp', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = 'rgba(255,245,225,.07)';
    for (let x = 0; x < W; x += Q) c.fillRect(x, 0, 1.4, H);
    c.fillStyle = 'rgba(20,10,20,.09)';
    for (let y = ROW - 2; y < H; y += ROW) c.fillRect(0, y, W, 2);
    c.fillStyle = 'rgba(255,245,225,.06)';
    for (let y = 0; y < H; y += ROW) c.fillRect(0, y, W, 1.5);
  }, { t: 0, d: 0.4, reveal: 'fade' });
}

// a wooden shuttle with its bobbin and the weft trailing behind it
function shuttle(c, x, y, dir) {
  c.strokeStyle = 'rgba(243,228,196,.9)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x - dir * 60, y); c.lineTo(x, y); c.stroke();
  c.fillStyle = '#8a5a32';
  c.beginPath(); c.moveTo(x - 34, y); c.quadraticCurveTo(x - 20, y - 9, x, y - 9); c.quadraticCurveTo(x + 20, y - 9, x + 34, y); c.quadraticCurveTo(x + 20, y + 9, x, y + 9); c.quadraticCurveTo(x - 20, y + 9, x - 34, y); c.fill();
  c.fillStyle = '#e9c98a'; c.fillRect(x - 12, y - 4, 24, 8);
  c.strokeStyle = BLACK; c.lineWidth = 1.2; c.stroke();
}

// ---------------------------------------------------------------------------
// the scene, as pieces laid in order: each is a polygon (or a band) and a way
// to fill a stretch of one weft row

const solid = (col) => (out, x0, x1, y) => out.push([x0, y, x1 - x0, ROW, col]);
// a color that drifts a little from row to row, as hand-dyed yarn does
function abrash(r, col, k = 0.06) {
  const memo = {};
  return (out, x0, x1, y) => {
    memo[y] ??= mix(col, r.chance(0.5) ? '#ffffff' : '#000000', r.range(0, k));
    out.push([x0, y, x1 - x0, ROW, memo[y]]);
  };
}
// houses: brick rows with the dark stitches of windows and doors, some
// houses limewashed or painted, and terraces between
function houses(r, o = {}) {
  const memo = {};
  return (out, x0, x1, y) => {
    const row = Math.round(y / ROW);
    const street = row % (o.every || 4) === 0;
    const b1 = o.b1 || BRICK, b2 = o.b2 || BRICK_D;
    const base = street ? (o.st || EARTH_D) : row % 2 ? b1 : b2;
    out.push([x0, y, x1 - x0, ROW, base]);
    if (street) return;
    const off = (row * 7) % 12;
    for (let x = qx(x0) + off; x < x1 - 4; x += 12) {
      const key = `${x},${row}`;
      memo[key] ??= r();
      const v = memo[key];
      if (v < 0.035) out.push([x - 2, y, 12, ROW, o.paint || r.pick([CREAM, BRICK_L, '#e2c79c'])]);
      if (v < (o.dens || 0.6)) out.push([x + 2, y + 3, 4, 5, v < 0.035 ? b2 : (o.win || WIN)]);
      else if (v > 0.93) out.push([x, y, 6, 3, '#7a7472']); // a tin roof catching the light
    }
  };
}
// a tower block: pale concrete with rows of window stitches
function tower(col, win = '#2c3550') {
  return (out, x0, x1, y) => {
    out.push([x0, y, x1 - x0, ROW, col]);
    for (let x = qx(x0) + 6; x < x1 - 6; x += 9) out.push([x, y + 2, 5, 6, win]);
  };
}
function scene(r) {
  const P = [];
  const band = (y0, y1, fill) => P.push({ pts: [[0, y0], [W, y0], [W, y1], [0, y1]], fill });

  // the edge stripes and the title band
  band(0, 12, solid(BLACK)); band(12, 22, solid(GOLD)); band(22, 36, solid(GREEN));
  band(TB0, TB1, abrash(r, CRIMSON, 0.05));
  // big lozenges either side of the title
  band(70, 300, (out, x0, x1, y) => {
    const cy = 185, R = 112, d = Math.abs(y + ROW / 2 - cy);
    const cols = [MAGENTA, GOLD, GREEN, ORANGE, PURPLE, CREAM];
    for (const cx of [170, W - 170]) {
      cols.forEach((col, k) => {
        const half = R * (1 - k / cols.length) - d;
        if (half > 0) out.push([cx - qx(half), y, 2 * qx(half), ROW, col]);
      });
      // a hook at each point of the diamond
      if (d < 6) { out.push([cx - R - 30, y, 18, ROW, GOLD]); out.push([cx + R + 12, y, 18, ROW, GOLD]); }
    }
  });
  band(300, 312, solid(GOLD)); band(312, 322, solid(BLACK));
  // a band of small diamonds, many colors, on green
  P.push({ pts: [[0, PB0 - 8], [W, PB0 - 8], [W, PB1], [0, PB1]], fill: (out, x0, x1, y) => {
    out.push([x0, y, x1 - x0, ROW, DGREEN]);
    const cy = (PB0 + PB1) / 2 - 4, d = Math.abs(y + ROW / 2 - cy);
    const cols = [GOLD, MAGENTA, CREAM, ORANGE, ROSE];
    for (let i = 0, cx = 30; cx < W; cx += 60, i++) {
      const half = 26 - d;
      if (half > 0) out.push([cx - qx(half), y, 2 * qx(half), ROW, cols[i % cols.length]]);
      if (half - 12 > 0) out.push([cx - qx(half - 12), y, 2 * qx(half - 12), ROW, BLACK]);
    }
  } });

  // the sky, in bands of blue
  const skies = ['#1b2a6e', '#1e3282', '#233d96', '#2649a8', '#2e58b8', '#3a69c4', '#4a7fcf', '#5f96d8', '#7aaddf', '#97c2e3', '#b6d5e6', '#d2e4e3'];
  let y = PIC0;
  skies.forEach((col, i) => { const h = i < 4 ? 40 : 30; band(y, y + h, abrash(r, col, 0.035)); y += h; });
  band(y, 980, abrash(r, '#e3ebdf', 0.03));
  // thin lines of cloud across the sky: woven streaks
  const streaks = [];
  for (let i = 0; i < 9; i++) streaks.push([r.range(-100, W), r.int(48, 72) * ROW, r.range(80, 260)]);
  P.push({ pts: [[0, 460], [W, 460], [W, 760], [0, 760]], fill: (out, x0, x1, yy) => {
    for (const [sx, sy, sw] of streaks) if (yy === sy) out.push([qx(sx), yy + 2, qx(sw), 6, 'rgba(246,240,228,.85)']);
  } });

  // Illimani: the far ridge, then the snows with their shaded faces
  P.push({ pts: [[380, 900], [560, 760], [700, 700], [800, 640], [1000, 600], [1200, 640], [1400, 660], [1600, 720], [1600, 900]], fill: abrash(r, '#a7b3d8', 0.03) });
  const massif = [[460, 900], [560, 800], [650, 720], [740, 660], [800, 610], [846, 548], [880, 500], [918, 548], [960, 560], [1004, 512], [1050, 452], [1100, 508], [1146, 540], [1186, 528], [1228, 494], [1280, 552], [1330, 582], [1390, 600], [1430, 574], [1490, 630], [1560, 690], [1600, 712], [1600, 900]];
  P.push({ pts: massif, fill: solid(SNOW) });
  // shaded faces: the left flank of each summit
  const shade1 = [[880, 500], [846, 548], [800, 610], [740, 660], [690, 720], [760, 740], [840, 690], [880, 600]];
  const shade2 = [[1050, 452], [1004, 512], [960, 560], [930, 620], [990, 660], [1040, 560]];
  const shade3 = [[1228, 494], [1186, 528], [1160, 600], [1220, 640], [1230, 560]];
  const shade4 = [[1430, 574], [1390, 600], [1370, 660], [1430, 680], [1440, 620]];
  for (const s of [shade1, shade2, shade3, shade4]) P.push({ pts: s, fill: solid(ICE) });
  P.push({ pts: [[880, 520], [860, 600], [820, 680], [860, 700], [884, 600]], fill: solid(ICE_D) });
  P.push({ pts: [[1050, 470], [1030, 560], [1000, 640], [1040, 650], [1054, 560]], fill: solid(ICE_D) });
  // the glacier's crevasses, a few stitched lines
  P.push({ pts: [[600, 700], [1600, 700], [1600, 860], [600, 860]], fill: (out, x0, x1, yy) => {
    if ((yy / ROW) % 3 !== 1) return;
    for (let x = qx(x0) + ((yy / ROW) % 2) * 30; x < x1; x += 70) out.push([x, yy + 4, 24, 2, ICE_D]);
  } });
  // the rock below the snow line, with tongues of snow running down it
  const rockTop = [];
  for (let x = 440; x <= W; x += 30) rockTop.push([x, 790 + 30 * Math.sin(x / 70) + 20 * Math.sin(x / 23) + r.range(-6, 6)]);
  P.push({ pts: [...rockTop, [W, 940], [440, 940]], fill: (out, x0, x1, yy) => {
    out.push([x0, yy, x1 - x0, ROW, (yy / ROW) % 2 ? ROCK : ROCK_D]);
    for (let x = qx(x0) + 18; x < x1; x += 54) if ((x * 13 + yy) % 7 < 3) out.push([x, yy, 12, ROW, ICE]);
  } });
  // the brown foothills in front of the mountain
  const hills = [];
  for (let x = 380; x <= W; x += 30) hills.push([x, 880 + 26 * Math.sin(x / 120 + 1) + 14 * Math.sin(x / 41)]);
  P.push({ pts: [...hills, [W, 1000], [380, 1000]], fill: abrash(r, '#7c4a44', 0.05) });

  // the far reach of the valley, down toward the south: smaller, hazier houses
  P.push({ pts: [[300, 960], [1300, 960], [1300, 1320], [300, 1320]], fill: houses(r, { b1: '#a95a44', b2: '#9c4f3b', st: '#b07850', win: '#4a2420', dens: 0.5 }) });
  P.push({ pts: [[0, 1300], [W, 1300], [W, PIC1], [0, PIC1]], fill: houses(r, { every: 5 }) });

  // El Alto on the left: the flat altiplano and its edge of houses
  P.push({ pts: [[0, 700], [620, 712], [660, 760], [660, 1000], [0, 1000]], fill: abrash(r, EARTH, 0.05) });
  P.push({ pts: [[0, 690], [600, 700], [620, 740], [0, 740]], fill: houses(r, { every: 99 }) });
  // a few towers of El Alto
  for (const [x, w, top] of [[90, 30, 650], [260, 24, 664], [470, 36, 672]]) P.push({ pts: [[x, top], [x + w, top], [x + w, 700], [x, 700]], fill: tower('#d9cdb4') });
  // the cliff below El Alto: bare earth in bands
  P.push({ pts: [[0, 740], [620, 740], [700, 820], [760, 980], [0, 980]], fill: (out, x0, x1, yy) => {
    out.push([x0, yy, x1 - x0, ROW, (yy / ROW) % 3 === 0 ? EARTH_D : '#cf9558']);
  } });

  // the canyon, filled with houses from wall to wall
  const left = [[0, 790], [180, 800], [340, 820], [520, 860], [640, 920], [720, 1010], [790, 1140], [840, 1320], [860, 1480], [0, 1480]];
  P.push({ pts: left, fill: houses(r, { b1: '#bd5a3e', b2: '#a84c35' }) });
  const right = [[W, 900], [1460, 920], [1300, 950], [1160, 1010], [1060, 1090], [980, 1200], [920, 1340], [890, 1480], [W, 1480]];
  P.push({ pts: right, fill: houses(r, { b1: '#97422f', b2: '#853a2a', st: '#8a5634', win: '#2a1416' }) });
  // bare gullies of red earth that run down the walls
  const gullies = [[[300, 830], [340, 830], [380, 1000], [330, 1060], [310, 960]], [[1360, 940], [1400, 936], [1380, 1100], [1340, 1160], [1350, 1040]], [[560, 900], [590, 905], [620, 1030], [586, 1080]]];
  for (const g of gullies) P.push({ pts: g, fill: abrash(r, '#c4703f', 0.05) });

  // the center: towers rising from the bottom of the bowl
  const towers = [];
  let x = 620;
  while (x < 1100) {
    const w = qx(r.range(36, 66)), top = qx(r.range(1130, 1300));
    towers.push([x, w, top]);
    x += w + qx(r.range(6, 24));
  }
  towers.sort((a, b) => a[2] - b[2]);
  towers.forEach(([tx, tw, top], i) => P.push({ pts: [[tx, top], [tx + tw, top], [tx + tw, 1520], [tx, 1520]], fill: tower(['#e6dcc4', '#cbbfa8', '#d9cfbb', '#b9b2a6', '#e9e1cf'][i % 5], i % 3 ? '#2c3550' : '#3c5a7a') }));
  // a band of trees along the Prado
  P.push({ pts: [[560, 1500], [1180, 1500], [1180, 1540], [560, 1540]], fill: (out, x0, x1, yy) => {
    out.push([x0, yy, x1 - x0, ROW, DGREEN]);
    for (let xx = qx(x0); xx < x1; xx += 24) out.push([xx + 6, yy + 2, 10, 6, GREEN]);
  } });

  // the cable car stations: stepped boxes, banded in their line's color
  for (const [sx, sy, col] of STATIONS) {
    P.push({ pts: [[sx - 30, sy - 24], [sx + 30, sy - 24], [sx + 30, sy + 16], [sx - 30, sy + 16]], fill: (out, x0, x1, yy) => {
      out.push([x0, yy, x1 - x0, ROW, yy < sy - 10 ? col : '#ece3d0']);
      if (yy >= sy - 10) for (let xx = sx - 24; xx < sx + 24; xx += 10) out.push([xx, yy + 2, 6, 6, '#3c5a7a']);
    } });
  }

  // the church of San Francisco: pale stone, its portal, and the bell tower
  const cx0 = 210, cx1 = 430, cb = 1650;
  P.push({ pts: [[cx0, 1490], [cx1, 1490], [cx1, cb], [cx0, cb]], fill: solid('#b8a78c') });
  P.push({ pts: [[cx0 + 20, 1470], [cx1 - 20, 1470], [cx1 - 20, 1490], [cx0 + 20, 1490]], fill: solid('#a8977e') });
  P.push({ pts: [[cx0 + 60, 1470], [cx0 + 70, 1450], [cx0 + 100, 1440], [(cx0 + cx1) / 2, 1424], [cx1 - 100, 1440], [cx1 - 70, 1450], [cx1 - 60, 1470]], fill: solid('#b8a78c') });
  // the carved portal: an arch with stepped jambs
  P.push({ pts: [[300, 1650], [300, 1560], [312, 1534], [328, 1522], [340, 1534], [352, 1560], [352, 1650]], fill: solid('#4a3528') });
  P.push({ pts: [[284, 1650], [284, 1550], [300, 1520], [328, 1500], [356, 1520], [368, 1550], [368, 1650], [352, 1650], [352, 1560], [340, 1534], [328, 1522], [312, 1534], [300, 1560], [300, 1650]], fill: (out, x0, x1, yy) => {
    out.push([x0, yy, x1 - x0, ROW, '#bda77f']);
    for (let xx = qx(x0); xx < x1; xx += 12) out.push([xx, yy + 3, 4, 4, '#8e7a58']);
  } });
  // windows
  for (const wx of [236, 400]) P.push({ pts: [[wx, 1520], [wx + 14, 1520], [wx + 14, 1580], [wx, 1580]], fill: solid('#4a3528') });
  // the bell tower at the right of the front: two stages of arched openings
  // under a tall stone dome with a lantern
  const bt0 = 430, bt1 = 502, mid = (bt0 + bt1) / 2;
  P.push({ pts: [[bt0, 1350], [bt1, 1350], [bt1, cb], [bt0, cb]], fill: solid('#a8977e') });
  for (const [o0, o1] of [[1368, 1406], [1428, 1466]]) {
    for (const ox of [bt0 + 12, bt0 + 42]) P.push({ pts: [[ox, o1], [ox, o0 + 8], [ox + 9, o0], [ox + 18, o0 + 8], [ox + 18, o1]], fill: solid('#3a2a22') });
    P.push({ pts: [[bt0 - 6, o1 + 2], [bt1 + 6, o1 + 2], [bt1 + 6, o1 + 12], [bt0 - 6, o1 + 12]], fill: solid('#8e7c62') });
  }
  P.push({ pts: [[bt0 - 6, 1340], [bt1 + 6, 1340], [bt1 + 6, 1352], [bt0 - 6, 1352]], fill: solid('#8e7c62') });
  P.push({ pts: [[bt0 + 2, 1340], [bt0 + 4, 1310], [bt0 + 12, 1288], [bt0 + 24, 1274], [mid, 1268], [bt1 - 24, 1274], [bt1 - 12, 1288], [bt1 - 4, 1310], [bt1 - 2, 1340]], fill: (out, x0, x1, yy) => {
    const m = (x0 + x1) / 2;
    out.push([x0, yy, m - x0 + 6, ROW, '#bfae92']); out.push([m + 6, yy, x1 - m - 6, ROW, '#9a8870']);
  } });
  P.push({ pts: [[mid - 8, 1268], [mid + 8, 1268], [mid + 8, 1244], [mid - 8, 1244]], fill: solid('#a8977e') });
  P.push({ pts: [[mid - 2, 1244], [mid + 2, 1244], [mid + 2, 1222], [mid - 2, 1222]], fill: solid(BLACK) });
  P.push({ pts: [[mid - 8, 1232], [mid + 8, 1232], [mid + 8, 1236], [mid - 8, 1236]], fill: solid(BLACK) });

  // the Valle de la Luna: clay spires in ochre, stepped
  const spires = [];
  for (let i = 0; i < 11; i++) {
    const sx = lerp(1210, 1590, i / 10) + r.range(-14, 14), h = r.range(120, 260), w = r.range(40, 70);
    spires.push([sx, w, 1700 - h]);
  }
  spires.sort((a, b) => a[2] - b[2]);
  for (const [sx, w, top] of spires) {
    const pts = [[sx - w / 2, 1700], [sx - w * 0.32, top + 80], [sx - w * 0.16, top + 30], [sx, top], [sx + w * 0.16, top + 36], [sx + w * 0.34, top + 90], [sx + w / 2, 1700]];
    P.push({ pts, fill: (out, x0, x1, yy) => {
      const mid = (x0 + x1) / 2;
      out.push([x0, yy, mid - x0, ROW, (yy / ROW) % 4 === 0 ? '#c98a4e' : '#e0ab6a']);
      out.push([mid, yy, x1 - mid, ROW, (yy / ROW) % 4 === 0 ? '#9c6338' : '#b97c45']);
    } });
  }
  // the ground in front
  P.push({ pts: [[0, 1650], [1220, 1650], [1220, PIC1], [0, PIC1]], fill: abrash(r, '#6e3a38', 0.05) });

  // a band of stepped zigzag under the picture
  band(ZB0, ZB0 + 10, solid(BLACK));
  P.push({ pts: [[0, ZB0 + 10], [W, ZB0 + 10], [W, ZB1 - 10], [0, ZB1 - 10]], fill: (out, x0, x1, yy) => {
    out.push([x0, yy, x1 - x0, ROW, PURPLE]);
    const k = (yy - ZB0 - 10) / ROW; // 0..5
    for (let xx = 0; xx < W; xx += 60) {
      out.push([xx + k * 6, yy, 12, ROW, ORANGE]);
      out.push([xx + 60 - k * 6 - 12, yy, 12, ROW, GOLD]);
    }
  } });
  band(ZB1 - 10, ZB1, solid(BLACK));
  // the stripes below: many narrow colors and a cream band for the caption
  const stripes = [[GREEN, 20], [GOLD, 10], [MAGENTA, 20], [CREAM, 60], [MAGENTA, 20], [ORANGE, 10], [CRIMSON, 30], [GOLD, 10], [BLACK, 20], [GREEN, 20]];
  y = ZB1;
  for (const [col, h] of stripes) { band(y, y + h, col === CREAM ? abrash(r, CREAM, 0.03) : solid(col)); y += h; }
  if (y < H) band(y, H, solid(BLACK));
  return P;
}

// the stations: [x, y, line color]; the lines run between them
const STATIONS = [[150, 718, RED_LINE], [700, 1300, RED_LINE], [420, 730, YEL_LINE], [1330, 960, YEL_LINE], [880, 1440, GRN_LINE], [1460, 1250, GRN_LINE]];
const LINES = [[0, 1, RED_LINE], [2, 3, YEL_LINE], [4, 5, GRN_LINE]];

// every row of the sheet: the rectangles of yarn that make it
function weave(r, pieces) {
  const rows = [];
  for (let y = 0; y < H; y += ROW) {
    const out = [];
    for (const pc of pieces) {
      const xs = cross(pc.pts, y + ROW / 2);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const x0 = Math.max(0, qx(xs[i])), x1 = Math.min(W, qx(xs[i + 1]));
        if (x1 > x0) pc.fill(out, x0, x1, y);
      }
    }
    rows.push(out);
  }
  return rows;
}

// the cable car lines, stitched over the cloth in running stitches; two
// cables to each, sagging a little between the stations
function cables(p, r, t0) {
  LINES.forEach(([a, b, col], li) => {
    const [ax, ay] = STATIONS[a], [bx, by] = STATIONS[b];
    const sag = Math.hypot(bx - ax, by - ay) * 0.05;
    const path = (off) => {
      const pts = [];
      for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push([lerp(ax, bx, t), lerp(ay, by, t) - 20 + off + sag * 4 * t * (1 - t)]); }
      return pts;
    };
    for (const off of [0, 8]) {
      const pts = path(off);
      // cut the line into stitches
      const st = [];
      let acc = 0;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0);
        for (let s = 0; s < L; s += 1) { if ((acc + s) % 18 < 13 && s + 1 <= L) st.push([lerp(x0, x1, s / L), lerp(y0, y1, s / L), lerp(x0, x1, (s + 1) / L), lerp(y0, y1, (s + 1) / L), Math.floor((acc + s) / 18)]); }
        acc += L;
      }
      const n = Math.floor(acc / 18) + 1;
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const box = { x: Math.min(...xs) - 8, y: Math.min(...ys) - 8, w: Math.max(...xs) - Math.min(...xs) + 16, h: Math.max(...ys) - Math.min(...ys) + 16 };
      p.group('stitch', box, (c, q) => {
        const upto = q * n;
        c.lineCap = 'round';
        c.strokeStyle = 'rgba(30,15,20,.45)'; c.lineWidth = 4;
        c.beginPath(); for (const [x0, y0, x1, y1, k] of st) if (k < upto) { c.moveTo(x0 + 1.5, y0 + 2); c.lineTo(x1 + 1.5, y1 + 2); } c.stroke();
        c.strokeStyle = off ? mix(col, '#000000', 0.25) : col; c.lineWidth = 3.4;
        c.beginPath(); for (const [x0, y0, x1, y1, k] of st) if (k < upto) { c.moveTo(x0, y0); c.lineTo(x1, y1); } c.stroke();
      }, { t: t0 + 0.2 + li * 0.45 + off * 0.02, d: 1.2, reveal: 'draw', ease: 'inOut' });
    }
  });
  // the cabins, running along each line
  const lines = LINES.map(([a, b, col], li) => {
    const [ax, ay] = STATIONS[a], [bx, by] = STATIONS[b];
    return { ax, ay, bx, by, col, sag: Math.hypot(bx - ax, by - ay) * 0.05, n: 5, sp: 0.022 + li * 0.004 };
  });
  p.live('cabins', {
    t: t0 + 1.8, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      for (const L of lines) {
        for (let k = 0; k < L.n; k++) {
          for (const dir of [0, 1]) {
            let s = ((time * L.sp + k / L.n + dir * 0.5 / L.n) % 1);
            if (dir) s = 1 - s;
            if (s < 0.06 || s > 0.94) continue;
            const x = lerp(L.ax, L.bx, s), y = lerp(L.ay, L.by, s) - 20 + dir * 8 + L.sag * 4 * s * (1 - s);
            cabin(c, x, y, L.col);
          }
        }
      }
    },
  });
}

function cabin(c, x, y, col) {
  c.fillStyle = BLACK; c.fillRect(x - 1, y, 2, 9); c.fillRect(x - 5, y - 2, 10, 3);
  c.fillStyle = col; c.fillRect(x - 9, y + 9, 18, 15);
  c.fillStyle = '#e9eef0'; c.fillRect(x - 7, y + 12, 14, 6);
  c.fillStyle = '#3c5a7a'; c.fillRect(x - 6, y + 13, 5, 4); c.fillRect(x + 1, y + 13, 5, 4);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - 9, y + 21, 18, 3);
}

// two condors circling high over the city, as woven birds
function birds(p, r) {
  const cs = [[520, 540, 0, 1.1], [1260, 470, 2.4, 0.85]];
  p.live('birds', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const [x0, y0, ph, s] of cs) {
        const a = time * 0.18 + ph, x = x0 + Math.cos(a) * 80, y = y0 + Math.sin(a) * 26, tilt = Math.sin(a) * 0.12;
        c.save(); c.translate(x, y); c.rotate(tilt); c.scale(s * (Math.cos(a) > 0 ? 1 : -1), s);
        // stepped wings, fingered at the tips, a white collar
        c.fillStyle = BLACK;
        c.fillRect(-60, -4, 120, 8); c.fillRect(-48, -8, 96, 4); c.fillRect(-12, -12, 30, 8);
        for (let k = 0; k < 4; k++) { c.fillRect(-72 + k * 3, -2 + k * 3, 10, 2); c.fillRect(62 - k * 3, -2 + k * 3, 10, 2); }
        c.fillRect(-14, 4, 28, 6); c.fillRect(-8, 10, 16, 6);
        c.fillStyle = CREAM; c.fillRect(-40, 0, 80, 3); c.fillRect(14, -12, 8, 4);
        c.fillStyle = '#c9614a'; c.fillRect(22, -14, 8, 6);
        c.restore();
      }
    },
  });
}

// people of the city stitched along the street: women in bowler hats and wide
// skirts with bundles on their backs, men in ponchos, and a pair of llamas
function folk(p, r) {
  const fig = [];
  let x = 40;
  while (x < 1200) {
    if (x > 190 && x < 500) { x = 500; continue; }
    fig.push({ x, kind: r.chance(0.68) ? 'w' : 'm', skirt: r.pick([MAGENTA, GREEN, ORANGE, COBALT, PURPLE, CRIMSON]), shawl: r.pick([GOLD, ROSE, '#7a4a3a', CREAM, ORANGE]), bundle: r.pick([MAGENTA, ORANGE, GREEN, GOLD]) });
    x += r.range(34, 56);
  }
  p.group('stitch', { x: 0, y: 1600, w: 1240, h: 104 }, (c) => {
    for (const f of fig) {
      const x = f.x, y = 1696;
      if (f.kind === 'w') {
        c.fillStyle = f.skirt; c.beginPath(); c.moveTo(x - 14, y - 4); c.lineTo(x + 14, y - 4); c.lineTo(x + 8, y - 26); c.lineTo(x - 8, y - 26); c.fill();
        c.fillStyle = '#5a3426'; c.fillRect(x - 6, y - 4, 4, 4); c.fillRect(x + 2, y - 4, 4, 4);
        c.fillStyle = f.shawl; c.fillRect(x - 8, y - 40, 16, 15);
        c.fillStyle = f.bundle; c.fillRect(x - 15, y - 40, 9, 13);
        c.fillStyle = '#a86a4a'; c.fillRect(x - 4, y - 48, 8, 8);
        c.fillStyle = BLACK; c.fillRect(x - 7, y - 50, 14, 2); c.fillRect(x - 4, y - 56, 8, 6);
        c.fillRect(x + 3, y - 44, 2, 12);
      } else {
        c.fillStyle = '#3a2a2a'; c.fillRect(x - 5, y - 18, 4, 16); c.fillRect(x + 1, y - 18, 4, 16);
        c.fillStyle = f.skirt; c.beginPath(); c.moveTo(x - 12, y - 16); c.lineTo(x + 12, y - 16); c.lineTo(x + 4, y - 40); c.lineTo(x - 4, y - 40); c.fill();
        c.fillStyle = f.shawl; c.fillRect(x - 12, y - 22, 24, 3);
        c.fillStyle = '#a86a4a'; c.fillRect(x - 4, y - 48, 8, 8);
        c.fillStyle = f.bundle; c.fillRect(x - 5, y - 54, 10, 6); c.fillRect(x - 3, y - 58, 6, 4);
      }
    }
    // the llamas
    for (const [lx, col] of [[1110, CREAM], [1160, '#8a5a3a']]) {
      const y = 1696;
      c.fillStyle = col;
      c.fillRect(lx - 16, y - 30, 30, 14); c.fillRect(lx + 8, y - 52, 7, 24); c.fillRect(lx + 8, y - 56, 12, 6); c.fillRect(lx + 9, y - 62, 3, 6);
      for (const k of [-14, -6, 4, 10]) c.fillRect(lx + k, y - 16, 4, 16);
      c.fillStyle = MAGENTA; c.fillRect(lx + 7, y - 64, 3, 4); c.fillStyle = GOLD; c.fillRect(lx - 4, y - 34, 10, 4);
    }
  }, { t: 9.4, d: 1.2, reveal: 'wipe', ease: 'linear' });
}

// the name, set in the crimson band, and the caption on the cream stripe
function title(p, r) {
  p.type('title', 'LA PAZ', W / 2, 252, {
    family: FACE, size: 220, color: CREAM, shadow: BLACK, sx: 8, sy: 8, align: 'center', track: 0.06,
    t: 10.7, gap: 0.2, d: 0.8, fit: 900,
  });
  const capY = ZB1 + 20 + 10 + 20 + 44;
  p.type('title', 'CHUQI YAPU MARKA  ·  BOLIVIA  ·  3640 m', W / 2, capY, {
    family: FACE, size: 34, color: CRIMSON, align: 'center', track: 0.16, t: 12.3, gap: 0.03, d: 0.5, reveal: 'fade',
  });
}
