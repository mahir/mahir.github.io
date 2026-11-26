// Kathmandu: the valley on a clear morning. The Himalaya stand white across the
// top of the sheet, the hills and the brick town fill the valley below them,
// and in its middle the great white dome of Boudhanath rises on its stepped
// terraces to a gilded spire, the eyes painted on the gilded cube beneath it
// looking out over the valley, strings of prayer flags fanning out from its top
// to every side and fluttering. In front, the tiered temples of Durbar Square
// on their stepped plinths: one with gilded roofs on the left, one with dark
// tile roofs and people sitting on its steps on the right, their carved struts
// and lattice windows cut in dark wood. Pigeons wheel over the square. The name
// hangs in the sky in dark carved wood, काठमाडौं with KATHMANDU, and a carved
// sill runs along the foot.

import { Plate, W, H } from '../print.js';
import { mix, shade, lerp } from '../kit.js';

const SKY0 = '#6fa7d6', SKY1 = '#b9d6ea', SKY2 = '#eef0e4';
const SNOW = '#fbfaf4', SNOW_S = '#a9bedb', SNOW_D = '#7f97bf', ROCK = '#5f6f8f';
const HILL0 = '#8ca5b4', HILL1 = '#6f8f86', HILL2 = '#557a5c', TERR = '#a3b46a';
const BRICK = '#b4533a', BRICK_L = '#cf7552', BRICK_D = '#7e3427', PLASTER = '#e9dcc2';
const WOOD = '#3a2316', WOOD_D = '#24150d', WOOD_L = '#6a4128', WOOD_H = '#9a6a42';
const GOLD = '#d9a83a', GOLD_L = '#f4d47a', GOLD_D = '#9c7020';
const WHITE = '#fbf7ee', WHITE_S = '#d9d4cc', SAFFRON = '#e8a137';
const TILE = '#4a3a36', TILE_L = '#6e5a52';
const PAVE = '#a48d76', PAVE_D = '#86705c';
const INK = '#20140e';
const FLAGS = ['#2f6fc0', '#f6f3ea', '#d23a2e', '#2e9a5a', '#f2c230'];

const DEV = '"Khand", sans-serif';

export const city = {
  id: 'kathmandu', name: 'Kathmandu', wall: '#1f2a3a',
  alt: 'The Kathmandu valley on a clear morning: the snowy Himalaya across the top, green hills with terraced fields and a town of brick houses below, the white dome of Boudhanath on its stepped terraces, the eyes painted on the gilded cube at its top looking out over the valley, its gilded spire and strings of prayer flags fanning out from its top, and in front the tiered temples of Durbar Square on their stepped plinths, one with gilded roofs and one with dark tile roofs and people sitting on its steps, with carved wooden struts and lattice windows, pigeons over the square, a flower seller, a cycle rickshaw and a cow in the square, and the name काठमाडौं with KATHMANDU in dark wood across the sky, over a carved wooden sill',
  google: 'family=Khand:wght@400;600;700',
  fonts: [['700 190px "Khand"', 'काठमाडौं'], ['600 70px "Khand"', 'KATHMANDU'], ['400 28px "Khand"', 'NEPAL · THE VALLEY · 1400 M']],
  build,
};

const SX = 860; // Boudhanath's middle
const APEX = [SX, 600]; // 13 steps above the harmika // the top of its spire, where the flags start
const LINTEL = 1884; // the carved sill at the foot

function build() {
  const p = new Plate({ paper: SKY2, seed: 1349 });
  const r = p.r;
  p.stack('sky', 'peaks', 'hills', 'town', 'stupa', 'flags', 'square', 'temples', 'roofs', 'life', 'lintel', 'title');
  sky(p, r);
  peaks(p, r);
  hills(p, r);
  town(p, r);
  stupa(p, r);
  flags(p, r);
  square(p, r);
  temples(p, r);
  life(p, r);
  lintel(p, r);
  title(p, r);
  // the two temples are built side by side: keep each layer's marks in time order
  for (const name of ['temples', 'roofs']) p.layers[name].marks.sort((a, b) => a.t - b.t);
  return p;
}

// ---------------------------------------------------------------- helpers
function path(c, pts, close = true) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  if (close) c.closePath();
}
function ink(c, fill, line, lw = 2) {
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (line) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }
}
const bx = (x0, y0, x1, y1, pad = 6) => ({ x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad });

// ---------------------------------------------------------------- the sky
function sky(p, r) {
  p.group('sky', bx(0, 0, W, 900, 0), (c) => {
    const g = c.createLinearGradient(0, 0, 0, 760);
    g.addColorStop(0, SKY0); g.addColorStop(0.55, SKY1); g.addColorStop(1, SKY2);
    c.fillStyle = g; c.fillRect(0, 0, W, 900);
  }, { t: 0, d: 1.2, reveal: 'fall', ease: 'inOut' });
  // thin bands of morning cloud, cut like a woodblock's lines
  const lines = [];
  for (const [x, y, w] of [[120, 150, 420], [980, 110, 460], [560, 230, 300], [1250, 250, 280]]) {
    for (let k = 0; k < 4; k++) lines.push([[x + k * 18, y + k * 9], [x + w - k * 26, y + k * 9]]);
  }
  p.strokes('sky', lines, 'rgba(255,255,255,.75)', 3, { t: 0.6, d: 1.2, reveal: 'wipe' });
}

// ---------------------------------------------------------------- the Himalaya: a long range of white peaks, lit from the left
function peaks(p, r) {
  // the far range, pale, and the near range, bright; each a line of peaks and
  // saddles, broken up between them so no two slopes are alike
  const ranges = [
    { base: 700, list: [[-40, 470], [130, 410], [330, 350], [560, 330], [760, 380], [1000, 320], [1180, 360], [1360, 330], [1640, 400]], fill: mix(SNOW, SKY1, 0.5), shade: mix(SNOW_S, SKY1, 0.45), t: 0.8 },
    { base: 720, list: [[-60, 540], [170, 430], [420, 500], [600, 380], [820, 470], [960, 410], [1140, 500], [1330, 370], [1520, 450], [1680, 420]], fill: SNOW, shade: SNOW_S, t: 1.5 },
  ];
  ranges.forEach((R, ri) => {
    const ctl = [];
    for (let i = 0; i < R.list.length; i++) {
      if (i > 0) { const [px, py] = R.list[i - 1], [x, y] = R.list[i]; ctl.push([(px + x) / 2 + r.range(-40, 40), Math.max(py, y) + r.range(60, 110), 'v']); }
      ctl.push([...R.list[i], 'p']);
    }
    // each segment between a peak and a saddle, broken by midpoint steps
    const segs = [];
    for (let i = 0; i < ctl.length - 1; i++) {
      let pts = [ctl[i], ctl[i + 1]];
      for (let lv = 0; lv < 4; lv++) {
        const out = [pts[0]];
        for (let k = 1; k < pts.length; k++) {
          const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], L = Math.hypot(x1 - x0, y1 - y0);
          out.push([(x0 + x1) / 2 + r.range(-0.08, 0.08) * L, (y0 + y1) / 2 + r.range(-0.22, 0.22) * L * (lv < 2 ? 0.7 : 0.4)], pts[k]);
        }
        pts = out;
      }
      segs.push({ pts, down: ctl[i][2] === 'p' });
    }
    const ridge = [[-80, R.base]];
    for (const sg of segs) ridge.push(...sg.pts);
    ridge.push([W + 80, R.base]);
    // shadow on every slope that falls away to the right
    const faces = segs.filter((sg) => sg.down).map((sg) => [...sg.pts, [sg.pts[sg.pts.length - 1][0] - 10, R.base], [sg.pts[0][0] + 30, R.base]]);
    // cut lines down the lit slopes, following the fall line
    const cuts = [];
    for (const sg of segs) {
      if (sg.down) continue;
      for (let k = 2; k < sg.pts.length - 1; k += 2) {
        const [x, y] = sg.pts[k];
        cuts.push([[x, y + 5], [x + 10, y + 30 + r.range(0, 50)]]);
      }
    }
    // snow gullies down the shadowed faces
    const gullies = [];
    for (const sg of segs) {
      if (!sg.down) continue;
      for (let k = 3; k < sg.pts.length - 2; k += 3) { const [x, y] = sg.pts[k]; gullies.push([[x, y + 4], [x - 8, y + 30], [x - 4, y + 60 + r.range(0, 40)]]); }
    }
    p.group('peaks', bx(-80, 220, W + 80, R.base + 10), (c) => {
      path(c, ridge); c.fillStyle = R.fill; c.fill();
      c.fillStyle = R.shade; for (const f of faces) { path(c, f); c.fill(); }
      // rock showing low down, where the snow gives out
      c.fillStyle = mix(ROCK, SKY1, ri ? 0.2 : 0.55);
      c.beginPath(); c.moveTo(-60, R.base);
      for (let x = -60; x <= W + 60; x += 30) c.lineTo(x, R.base - 40 - Math.abs(Math.sin(x / 47 + ri)) * 50);
      c.lineTo(W + 60, R.base); c.closePath(); c.fill();
    }, { t: R.t, d: 1.3, reveal: 'rise', ease: 'out' });
    p.strokes('peaks', cuts, ri ? SNOW_D : mix(SNOW_D, SKY1, 0.5), 1.5, { t: R.t + 0.9, d: 0.9, reveal: 'fall' });
    p.strokes('peaks', gullies, ri ? mix(SNOW, SNOW_S, 0.3) : mix(SNOW, SKY1, 0.3), 2.2, { t: R.t + 1.0, d: 0.9, reveal: 'fall' });
    p.pen('peaks', ridge.slice(1, -1), ri ? ROCK : mix(ROCK, SKY1, 0.5), 1.8, { t: R.t + 0.5, d: 1.4 });
  });
}

// ---------------------------------------------------------------- the hills round the valley, terraced
function hills(p, r) {
  const bands = [
    { y: 720, amp: 60, col: HILL0, t: 2.4, f: 210 },
    { y: 790, amp: 50, col: HILL1, t: 2.7, f: 160 },
    { y: 860, amp: 40, col: HILL2, t: 3.0, f: 130 },
  ];
  bands.forEach((b, bi) => {
    const top = [];
    for (let x = -20; x <= W + 20; x += 16) top.push([x, b.y - Math.abs(Math.sin(x / b.f + bi * 2)) * b.amp - Math.sin(x / 53) * 6]);
    const terr = [];
    // the terraces: lines that follow the hill's shape, stepping down it
    for (let k = 1; k < 6; k++) {
      const line = [];
      for (const [x, y] of top) line.push([x, y + k * 13 + Math.sin(x / 31 + k) * 2]);
      for (let i = 0; i < line.length - 1; i += 3) terr.push(line.slice(i, i + 3));
    }
    p.group('hills', bx(-20, b.y - b.amp - 20, W + 20, 1200), (c) => {
      path(c, [...top, [W + 20, 1200], [-20, 1200]]); c.fillStyle = b.col; c.fill();
      c.strokeStyle = shade(b.col, 1.18); c.lineWidth = 2;
      c.beginPath(); for (const l of terr) { c.moveTo(l[0][0], l[0][1]); for (const q of l) c.lineTo(q[0], q[1]); } c.stroke();
    }, { t: b.t, d: 1.0, reveal: 'rise' });
  });
  // the valley floor: fields in strips of ochre and green
  p.group('hills', bx(0, 880, W, 1200), (c) => {
    c.fillStyle = TERR; c.fillRect(0, 900, W, 300);
    for (let k = 0; k < 14; k++) { c.fillStyle = k % 2 ? mix(TERR, HILL2, 0.4) : mix(TERR, '#d8c27a', 0.4); c.fillRect(0, 900 + k * 12, W, 6); }
  }, { t: 3.2, d: 0.8, reveal: 'fall' });
}

// ---------------------------------------------------------------- the town: brick houses, close together, three and four stories
function town(p, r) {
  const rows = [
    { y: 930, n: 40, h: [26, 46], w: [26, 44], s: 0.7, t: 3.4 },
    { y: 990, n: 34, h: [34, 60], w: [34, 54], s: 0.85, t: 3.8 },
    { y: 1060, n: 28, h: [44, 74], w: [44, 66], s: 1.0, t: 4.2 },
  ];
  rows.forEach((row) => {
    const houses = [];
    let x = -20;
    while (x < W + 20) {
      const w = r.range(...row.w), h = r.range(...row.h);
      houses.push({ x, w, h, col: r.pick([BRICK, BRICK_L, BRICK, PLASTER, BRICK_D, mix(BRICK, PLASTER, 0.5)]), roof: r.chance(0.35), win: r.int(1, 3) });
      x += w - 2;
    }
    p.group('town', bx(-20, row.y - 100, W + 20, row.y + 4), (c) => {
      for (const h of houses) {
        const y0 = row.y - h.h;
        c.fillStyle = h.col; c.fillRect(h.x, y0, h.w, h.h);
        c.fillStyle = shade(h.col, 0.8); c.fillRect(h.x + h.w - 5, y0, 5, h.h);
        if (h.roof) { c.fillStyle = TILE; path(c, [[h.x - 3, y0 + 2], [h.x + h.w / 2, y0 - 10 * row.s], [h.x + h.w + 3, y0 + 2]]); c.fill(); }
        else { c.fillStyle = shade(h.col, 0.7); c.fillRect(h.x, y0, h.w, 3); }
        // windows: small dark wood frames, a row per floor
        c.fillStyle = WOOD;
        const fl = Math.floor(h.h / (16 * row.s));
        for (let f = 0; f < fl; f++) for (let k = 0; k < h.win; k++) {
          const wx = h.x + (k + 0.5) * (h.w / h.win) - 3 * row.s, wy = y0 + 6 * row.s + f * 16 * row.s;
          c.fillRect(wx, wy, 6 * row.s, 8 * row.s);
        }
      }
    }, { t: row.t, d: 1.0, reveal: 'rise' });
  });
}

// ---------------------------------------------------------------- Boudhanath: terraces, dome, harmika, spire
function stupa(p, r) {
  // the three terraces of the mandala, white, each stepped back at its corners
  const terr = [[1182, 1124, 440], [1124, 1084, 372], [1084, 1050, 312]];
  terr.forEach(([y1, y0, hw], i) => {
    p.group('stupa', bx(SX - hw - 10, y0 - 10, SX + hw + 10, y1 + 4), (c) => {
      // the outline: a long front, and two notches stepping in at each end
      const n = 14;
      const outline = [[SX - hw, y1], [SX - hw, y0 + 14], [SX - hw + n, y0 + 14], [SX - hw + n, y0 + 7], [SX - hw + 2 * n, y0 + 7], [SX - hw + 2 * n, y0],
        [SX + hw - 2 * n, y0], [SX + hw - 2 * n, y0 + 7], [SX + hw - n, y0 + 7], [SX + hw - n, y0 + 14], [SX + hw, y0 + 14], [SX + hw, y1]];
      path(c, outline); c.fillStyle = WHITE; c.fill();
      c.fillStyle = WHITE_S; c.fillRect(SX - hw, y1 - 7, 2 * hw, 7);
      c.fillStyle = BRICK; c.fillRect(SX - hw + 2 * n, y0 - 4, 2 * hw - 4 * n, 5);
      // little arched lamp niches along the face
      c.fillStyle = WOOD;
      for (let x = SX - hw + 40; x < SX + hw - 40; x += 30) { c.beginPath(); c.roundRect(x - 4, y0 + 16, 8, Math.min(16, (y1 - y0) * 0.4), [4, 4, 0, 0]); c.fill(); }
      c.fillStyle = '#f3c04a'; for (let x = SX - hw + 40; x < SX + hw - 40; x += 30) { c.beginPath(); c.arc(x, y0 + 28, 2, 0, 7); c.fill(); }
      c.strokeStyle = INK; c.lineWidth = 1.6; path(c, outline); c.stroke();
    }, { t: 4.6 + i * 0.25, d: 0.8, reveal: 'rise' });
  });
  // the dome
  const dy = 1052, rx = 290, ry = 206;
  p.group('stupa', bx(SX - rx - 10, dy - ry - 10, SX + rx + 10, dy + 6), (c) => {
    c.beginPath(); c.ellipse(SX, dy, rx, ry, 0, Math.PI, 0); c.closePath();
    const g = c.createLinearGradient(SX - rx, 0, SX + rx, 0);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, WHITE); g.addColorStop(1, WHITE_S);
    c.fillStyle = g; c.fill();
    // the saffron wash: a ring of petal-shaped arcs thrown over the dome's top
    c.save(); c.clip();
    c.strokeStyle = SAFFRON; c.lineCap = 'round'; c.globalAlpha = 0.85; c.lineWidth = 7;
    const ring = (u) => [SX + Math.cos(Math.PI + u * Math.PI) * rx * 0.42, dy - ry + 14 + Math.sin(u * Math.PI) * 6];
    for (let k = 0; k < 9; k++) {
      const [ax, ay] = ring(k / 9), [bx2, by2] = ring((k + 1) / 9);
      const mx = (ax + bx2) / 2, dist = (mx - SX) / (rx * 0.42);
      const low = ry * (0.62 - 0.22 * dist * dist);
      c.beginPath(); c.moveTo(ax, ay); c.bezierCurveTo(ax + (mx - ax) * 0.2 + dist * 30, ay + low, bx2 - (bx2 - mx) * 0.2 + dist * 30, by2 + low, bx2, by2); c.stroke();
    }
    c.lineWidth = 4; c.globalAlpha = 0.6;
    for (let k = 0; k < 18; k++) { const [ax, ay] = ring(k / 17); c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + (ax - SX) * 0.25, ay + 30); c.stroke(); }
    c.globalAlpha = 1;
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(SX, dy, rx, ry, 0, Math.PI, 0); c.stroke();
    c.fillStyle = BRICK; c.fillRect(SX - rx - 6, dy - 4, 2 * rx + 12, 8);
  }, { t: 5.4, d: 1.2, reveal: 'rise', ease: 'out' });
  // the harmika: a gilded cube with the eyes painted on its face, looking down
  // over the valley, the curl of the nose between them and the dot above
  const hb = dy - ry + 4;
  p.group('stupa', bx(SX - 60, hb - 58, SX + 60, hb + 2), (c) => {
    c.fillStyle = GOLD; c.fillRect(SX - 46, hb - 50, 92, 50);
    c.fillStyle = GOLD_L; c.fillRect(SX - 46, hb - 50, 9, 50);
    c.fillStyle = GOLD_D; c.fillRect(SX + 38, hb - 50, 8, 50);
    c.fillStyle = GOLD_D; c.fillRect(SX - 54, hb - 58, 108, 9);
    c.strokeStyle = INK; c.lineWidth = 1.8; c.strokeRect(SX - 46, hb - 50, 92, 50); c.strokeRect(SX - 54, hb - 58, 108, 9);
    // the eyes: heavy brows, lids half closed, the irises resting on the lower lids
    const ey = hb - 25;
    for (const s of [-1, 1]) {
      const ex = SX + s * 19;
      c.strokeStyle = INK; c.lineWidth = 3.2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(ex - 14, ey - 9); c.quadraticCurveTo(ex, ey - 19, ex + 14, ey - 9); c.stroke();
      const lid = () => { c.beginPath(); c.moveTo(ex - 13, ey); c.quadraticCurveTo(ex, ey - 5, ex + 13, ey); c.quadraticCurveTo(ex, ey + 9, ex - 13, ey); c.closePath(); };
      lid(); c.fillStyle = WHITE; c.fill();
      c.save(); lid(); c.clip();
      c.fillStyle = '#1d2a4a'; c.beginPath(); c.arc(ex - s * 1.5, ey + 2.5, 4.6, 0, 7); c.fill();
      c.restore();
      lid(); c.lineWidth = 1.6; c.stroke();
      c.lineWidth = 2.6; c.beginPath(); c.moveTo(ex - 13, ey); c.quadraticCurveTo(ex, ey - 5, ex + 13, ey); c.stroke();
    }
    // the nose, a curl like a question mark, and the dot between the brows
    c.strokeStyle = '#b8322a'; c.lineWidth = 2.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(SX - 4, ey - 4); c.bezierCurveTo(SX - 5, ey - 11, SX + 6, ey - 11, SX + 5, ey - 4);
    c.bezierCurveTo(SX + 4, ey + 1, SX - 1, ey + 3, SX, ey + 9); c.lineTo(SX, ey + 15); c.stroke();
    c.fillStyle = '#b8322a'; c.beginPath(); c.arc(SX, ey + 19, 2, 0, 7); c.fill();
    c.beginPath(); c.arc(SX, ey - 17, 2.6, 0, 7); c.fill();
  }, { t: 6.3, d: 0.6, reveal: 'rise' });
  // the spire: thirteen gilded steps narrowing upward, the parasol and the finial
  const sb = hb - 58;
  p.group('stupa', bx(SX - 70, APEX[1] - 50, SX + 70, sb + 2), (c) => {
    for (let k = 0; k < 13; k++) {
      const y = sb - k * 12.4, w = 40 - k * 2.2;
      c.fillStyle = k % 2 ? GOLD : GOLD_L; c.fillRect(SX - w, y - 11, 2 * w, 12);
      c.fillStyle = GOLD_D; c.fillRect(SX + w * 0.4, y - 11, w * 0.6, 12);
      c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(SX - w, y - 11, 2 * w, 12);
    }
    const py = APEX[1];
    path(c, [[SX - 54, py + 24], [SX, py], [SX + 54, py + 24], [SX + 44, py + 30], [SX - 44, py + 30]]); ink(c, GOLD, INK, 1.6);
    c.fillStyle = GOLD_L; c.beginPath(); c.ellipse(SX, py - 14, 9, 16, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = GOLD; c.fillRect(SX - 2, py - 40, 4, 12);
    // a fringe of silk under the parasol
    for (let k = -4; k <= 4; k++) { c.fillStyle = FLAGS[(k + 5) % 5]; c.fillRect(SX + k * 10 - 3, py + 30, 6, 14); }
  }, { t: 6.7, d: 0.9, reveal: 'rise' });
}

// ---------------------------------------------------------------- prayer flags: strings fanning from the spire, flags along them, stirring
function flags(p, r) {
  // where each string comes to rest: the poster's edges and the terraces' corners
  const ends = [[-20, 520], [-20, 760], [120, 1010], [380, 1130], [560, 1182], [1160, 1182], [1340, 1130], [1600 - 120, 1000], [W + 20, 780], [W + 20, 540], [-20, 400], [W + 20, 400]];
  const strings = ends.map(([ex, ey], i) => {
    const sag = 60 + Math.abs(ex - APEX[0]) * 0.12;
    const mx = (APEX[0] + ex) / 2, my = (APEX[1] + ey) / 2 + sag;
    const pts = [];
    const n = Math.round(Math.hypot(ex - APEX[0], ey - APEX[1]) / 30);
    for (let k = 1; k < n; k++) {
      const u = k / n;
      const x = (1 - u) * (1 - u) * APEX[0] + 2 * (1 - u) * u * mx + u * u * ex;
      const y = (1 - u) * (1 - u) * APEX[1] + 2 * (1 - u) * u * my + u * u * ey;
      pts.push([x, y, k]);
    }
    return { ex, ey, mx, my, pts, t: 7.2 + i * 0.12, ph: r() * 6.28 };
  });
  // the strings themselves, drawn out from the top
  strings.forEach((s) => {
    const line = [];
    for (let k = 0; k <= 30; k++) { const u = k / 30; line.push([(1 - u) * (1 - u) * APEX[0] + 2 * (1 - u) * u * s.mx + u * u * s.ex, (1 - u) * (1 - u) * APEX[1] + 2 * (1 - u) * u * s.my + u * u * s.ey]); }
    p.pen('flags', line, 'rgba(60,40,30,.7)', 1.6, { t: s.t - 0.3, d: 1.0 });
  });
  // the flags: hung along every string, coming out one by one, then stirring in the wind
  p.live('flags', {
    t: 7.0, d: 0.3, box: bx(-30, 300, W + 30, 1220),
    draw: (c, time) => {
      for (const s of strings) {
        const shown = Math.max(0, Math.min(1, (time - s.t) / 1.4)) * s.pts.length;
        for (let i = 0; i < shown; i++) {
          const [x, y, k] = s.pts[i];
          const sw = Math.sin(time * 3 + k * 0.7 + s.ph) * 5;
          const sc = 0.55 + 0.45 * Math.min(1, Math.hypot(x - APEX[0], y - APEX[1]) / 500);
          const fw = 20 * sc, fh = 26 * sc;
          c.fillStyle = FLAGS[k % 5];
          c.beginPath(); c.moveTo(x - fw / 2, y); c.lineTo(x + fw / 2, y); c.lineTo(x + fw / 2 + sw, y + fh); c.lineTo(x - fw / 2 + sw, y + fh); c.closePath(); c.fill();
        }
      }
    },
  });
}

// ---------------------------------------------------------------- the square: brick paving, a low wall, shrines' plinths
function square(p, r) {
  p.group('square', bx(0, 1150, W, LINTEL + 10, 0), (c) => {
    c.fillStyle = PAVE; c.fillRect(0, 1170, W, LINTEL - 1170 + 10);
    // the paving's courses, set in perspective toward the middle
    c.strokeStyle = PAVE_D; c.lineWidth = 1.6; c.beginPath();
    for (let y = 1176, k = 0; y < LINTEL; y += 8 + (y - 1170) * 0.03, k++) { c.moveTo(0, y); c.lineTo(W, y); }
    for (let k = -30; k <= 30; k++) { c.moveTo(SX + k * 30, 1170); c.lineTo(SX + k * 30 * 4.2, LINTEL + 10); }
    c.stroke();
    // the bricks laid in herringbone, a hint of it in every course
    c.strokeStyle = 'rgba(255,240,220,.16)'; c.lineWidth = 1.4; c.beginPath();
    for (let y = 1180, k = 0; y < LINTEL; y += 10 + (y - 1170) * 0.03, k++) {
      const s = 0.6 + (y - 1170) / 600;
      for (let x = (k % 2) * 8 * s; x < W; x += 16 * s) { c.moveTo(x, y); c.lineTo(x + 6 * s, y + 5 * s); }
    }
    c.stroke();
    // a low brick wall where the square meets the town
    c.fillStyle = BRICK_D; c.fillRect(0, 1162, W, 14);
    c.fillStyle = BRICK; for (let x = 0; x < W; x += 24) c.fillRect(x + 1, 1163, 22, 5);
  }, { t: 7.6, d: 0.9, reveal: 'fall' });
}

// ---------------------------------------------------------------- the temples of Durbar Square
// a Newar temple: a stepped plinth, then brick stories under tiered roofs held on
// carved wooden struts, latticed windows, a gilded finial. o: { cx, foot, steps, stepH, base, stories, roofs, roofCol }
function temple(p, r, o, t0) {
  const { cx, foot } = o;
  // the plinth: step after step, each a little narrower
  let y = foot, w = o.base;
  const stepList = [];
  for (let k = 0; k < o.steps; k++) { stepList.push([y - o.stepH, y, w]); y -= o.stepH; w -= o.stepIn; }
  const plinthTop = y;
  p.group('temples', bx(cx - o.base / 2 - 10, plinthTop - 10, cx + o.base / 2 + 10, foot + 6), (c) => {
    for (const [y0, y1, ww] of stepList) {
      c.fillStyle = BRICK; c.fillRect(cx - ww / 2, y0, ww, y1 - y0);
      c.fillStyle = BRICK_L; c.fillRect(cx - ww / 2, y0, ww, 4);
      c.fillStyle = BRICK_D; c.fillRect(cx - ww / 2, y1 - 3, ww, 3);
      // brick courses
      c.strokeStyle = BRICK_D; c.lineWidth = 0.8; c.beginPath();
      for (let yy = y0 + 8; yy < y1 - 2; yy += 6) { c.moveTo(cx - ww / 2, yy); c.lineTo(cx + ww / 2, yy); }
      c.stroke();
      c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(cx - ww / 2, y0, ww, y1 - y0);
    }
    // a flight of stone stairs up the middle of the plinth
    c.fillStyle = '#c9b89c'; c.fillRect(cx - o.stair / 2, plinthTop, o.stair, foot - plinthTop);
    c.strokeStyle = '#8c7a62'; c.lineWidth = 1.5; c.beginPath();
    for (let yy = plinthTop + 7; yy < foot; yy += 7) { c.moveTo(cx - o.stair / 2, yy); c.lineTo(cx + o.stair / 2, yy); }
    c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(cx - o.stair / 2, plinthTop, o.stair, foot - plinthTop);
  }, { t: t0, d: 1.2, reveal: 'rise' });

  // the stories, bottom to top, each under its roof
  let yy = plinthTop;
  o.stories.forEach(([bh, bw, rh, rw], i) => {
    const fy = yy; // this story's foot (yy moves on as the stories go up)
    const y0 = fy - bh;
    const t = t0 + 1.0 + i * 0.55;
    // the brick wall of the story, with its doors and lattice windows
    p.group('temples', bx(cx - bw / 2 - 6, y0 - 6, cx + bw / 2 + 6, fy + 4), (c) => {
      c.fillStyle = BRICK; c.fillRect(cx - bw / 2, y0, bw, bh);
      c.fillStyle = BRICK_D; c.fillRect(cx + bw / 2 - 12, y0, 12, bh);
      // a wooden band at the top and the foot
      c.fillStyle = WOOD; c.fillRect(cx - bw / 2, y0, bw, 8); c.fillRect(cx - bw / 2, fy - 8, bw, 8);
      c.fillStyle = WOOD_H; for (let x = cx - bw / 2 + 3; x < cx + bw / 2 - 3; x += 7) c.fillRect(x, y0 + 2, 3, 3);
      // openings: on the lowest story, doors in a row; above, latticed windows
      const n = i === 0 ? o.doors : Math.max(1, o.doors - 2 * i);
      const ow = Math.min(46, (bw - 30) / n - 10), oh = i === 0 ? bh * 0.44 : bh * 0.5;
      for (let k = 0; k < n; k++) {
        const ox = cx - (n * (ow + 10) - 10) / 2 + k * (ow + 10), oy = i === 0 ? fy - 8 - oh : y0 + (bh - oh) / 2;
        // the carved frame: an outer ledge wider than the opening, then the lattice
        c.fillStyle = WOOD_D; c.fillRect(ox - 5, oy - 6, ow + 10, oh + 10);
        c.fillStyle = WOOD_L; c.fillRect(ox - 9, oy - 9, ow + 18, 5);
        c.fillStyle = WOOD; c.fillRect(ox, oy, ow, oh);
        c.strokeStyle = WOOD_H; c.lineWidth = 1.2; c.beginPath();
        if (i === 0) { for (let q = 1; q < 4; q++) { c.moveTo(ox + (q * ow) / 4, oy + 2); c.lineTo(ox + (q * ow) / 4, oy + oh - 2); } c.moveTo(ox, oy + oh * 0.3); c.lineTo(ox + ow, oy + oh * 0.3); }
        else { for (let d = -oh; d < ow; d += 6) { c.moveTo(ox + Math.max(0, d), oy + Math.max(0, -d)); c.lineTo(ox + Math.min(ow, d + oh), oy + Math.min(oh, oh - (d + oh - Math.min(ow, d + oh)))); c.moveTo(ox + Math.max(0, d), oy + oh - Math.max(0, -d)); c.lineTo(ox + Math.min(ow, d + oh), oy + oh - Math.min(oh, oh - (d + oh - Math.min(ow, d + oh)))); } }
        c.stroke();
      }
      c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(cx - bw / 2, y0, bw, bh);
    }, { t, d: 0.6, reveal: 'rise' });
    // the struts: carved wooden brackets running out from the wall to the eave
    const ry1 = y0 + 4, eave = ry1 + 10; // the eave's lip sits a little below the wall top
    p.group('roofs', bx(cx - rw / 2 - 10, y0 - rh - 10, cx + rw / 2 + 10, fy - bh * 0.25), (c) => {
      const n = Math.round(bw / 34);
      for (let k = 0; k <= n; k++) {
        const u = k / n, x0 = cx - bw / 2 + 6 + u * (bw - 12), x1 = cx + (u - 0.5) * (rw - 30);
        const ya = y0 + bh * (i === 0 ? 0.4 : 0.55), yb = eave - 2;
        c.strokeStyle = WOOD_D; c.lineWidth = 9; c.beginPath(); c.moveTo(x0, ya); c.lineTo(x1, yb); c.stroke();
        c.strokeStyle = WOOD_H; c.lineWidth = 2; c.beginPath();
        // notches carved along the strut
        for (let q = 0.2; q < 0.95; q += 0.18) { const xx = lerp(x0, x1, q), yq = lerp(ya, yb, q); c.moveTo(xx - 3, yq); c.lineTo(xx + 3, yq); }
        c.stroke();
      }
    }, { t: t + 0.25, d: 0.5, reveal: 'fall' });
    // the roof: a wide hipped slope, its tiles in rows, a fringe of metal leaves at the eave
    const ry0 = y0 - rh;
    p.group('roofs', bx(cx - rw / 2 - 12, ry0 - 30, cx + rw / 2 + 12, eave + 26), (c) => {
      const top = i === o.stories.length - 1 ? 0.12 : 0.36;
      const pts = [[cx - rw / 2, eave], [cx + rw / 2, eave], [cx + (rw / 2) * top + bw * 0.02, ry0], [cx - (rw / 2) * top - bw * 0.02, ry0]];
      path(c, pts); c.fillStyle = o.roofCol; c.fill();
      c.save(); c.clip();
      // tile rows (or the gilt plates' ribs), and the light along the left
      c.strokeStyle = o.roofLine; c.lineWidth = 1.6; c.beginPath();
      for (let k = 1; k < 9; k++) { const yq = lerp(ry0, eave, k / 9); c.moveTo(cx - rw / 2, yq); c.lineTo(cx + rw / 2, yq); }
      for (let k = -14; k <= 14; k++) { c.moveTo(cx + k * 8 * (top + 0.2), ry0); c.lineTo(cx + k * rw / 28, eave); }
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,.18)'; path(c, [[cx - rw / 2, eave], [cx - rw * 0.15, eave], [cx - rw * top * 0.3, ry0], [cx - (rw / 2) * top, ry0]]); c.fill();
      c.fillStyle = 'rgba(0,0,0,.2)'; path(c, [[cx + rw * 0.2, eave], [cx + rw / 2, eave], [cx + (rw / 2) * top, ry0], [cx + rw * top * 0.3, ry0]]); c.fill();
      c.restore();
      path(c, pts); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      // the eave board, and the row of small hanging leaves of metal along it
      c.fillStyle = WOOD; c.fillRect(cx - rw / 2 - 4, eave - 2, rw + 8, 8);
      c.fillStyle = GOLD;
      for (let x = cx - rw / 2 + 4; x < cx + rw / 2; x += 11) { path(c, [[x - 3.5, eave + 6], [x + 3.5, eave + 6], [x, eave + 16]]); c.fill(); }
      // the flared corners, upturned a little
      for (const sd of [-1, 1]) { path(c, [[cx + sd * (rw / 2 + 4), eave + 4], [cx + sd * (rw / 2 + 18), eave - 10], [cx + sd * (rw / 2 - 10), eave - 4]]); ink(c, o.roofCol, INK, 1.4); }
    }, { t: t + 0.4, d: 0.6, reveal: 'drop', dy: 30 });
    yy = ry0;
    if (i === o.stories.length - 1) o.top = ry0;
  });
  // the finial: a gilded bell-shaped crown on the topmost roof
  const fy = o.top;
  p.group('roofs', bx(cx - 30, fy - 110, cx + 30, fy + 6), (c) => {
    c.fillStyle = GOLD; c.beginPath(); c.moveTo(cx - 26, fy + 2); c.quadraticCurveTo(cx - 24, fy - 26, cx, fy - 30); c.quadraticCurveTo(cx + 24, fy - 26, cx + 26, fy + 2); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
    for (let k = 0; k < 4; k++) { const y = fy - 34 - k * 14, w = 12 - k * 2.4; c.beginPath(); c.ellipse(cx, y, w, 7, 0, 0, 7); c.fillStyle = k % 2 ? GOLD : GOLD_L; c.fill(); c.stroke(); }
    c.fillStyle = GOLD_L; c.beginPath(); c.moveTo(cx, fy - 104); c.lineTo(cx + 5, fy - 88); c.lineTo(cx - 5, fy - 88); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = GOLD_D; c.fillRect(cx - 26, fy - 2, 52, 4);
  }, { t: t0 + 1.0 + o.stories.length * 0.55 + 0.5, d: 0.6, reveal: 'drop', dy: 40, ease: 'back' });
}
function temples(p, r) {
  // left: the tall temple with gilded roofs on a high plinth
  temple(p, r, {
    cx: 290, foot: 1860, steps: 8, stepH: 28, base: 640, stepIn: 14, stair: 80, doors: 3,
    stories: [[170, 340, 130, 620], [124, 256, 112, 480], [100, 176, 104, 356]],
    roofCol: GOLD, roofLine: GOLD_D,
  }, 8.0);
  // right: the wide one with dark tile roofs on its many steps
  temple(p, r, {
    cx: 1340, foot: 1870, steps: 7, stepH: 28, base: 620, stepIn: 16, stair: 84, doors: 5,
    stories: [[136, 300, 104, 530], [100, 220, 90, 404], [80, 150, 84, 292]],
    roofCol: TILE, roofLine: TILE_L,
  }, 8.4);
}

// ---------------------------------------------------------------- life: people on the steps and the square, pigeons, a cloud on the peaks
function life(p, r) {
  const folk = [];
  const cols = ['#c63d2f', '#2f6fc0', '#e7b33c', '#7a3e8e', '#f3ece0', '#2e8a5a', '#d6702f'];
  // people sitting on the right temple's steps, and walking the square
  for (let k = 0; k < 14; k++) {
    const step = r.int(0, 5), y = 1870 - step * 28, half = 310 - step * 16 - 24;
    let x = 1340 + r.range(-half, half);
    if (Math.abs(x - 1340) < 56) x += 100;
    folk.push([x, y, 0.75, r.pick(cols), true]);
  }
  for (let k = 0; k < 26; k++) {
    const y = r.range(1240, 1780), s = 0.6 + (y - 1200) / 900;
    folk.push([r.range(640, 1040), y, s, r.pick(cols), false]);
  }
  folk.sort((a, b) => a[1] - b[1]);
  p.group('life', bx(560, 1100, W, LINTEL), (c) => {
    for (const [x, y, s, col, sit] of folk) {
      c.fillStyle = INK; c.beginPath(); c.arc(x, y - (sit ? 30 : 46) * s, 6 * s, 0, 7); c.fill();
      c.fillStyle = col;
      if (sit) { path(c, [[x - 9 * s, y - 24 * s], [x + 9 * s, y - 24 * s], [x + 14 * s, y - 4 * s], [x - 14 * s, y - 4 * s]]); c.fill(); }
      else { path(c, [[x - 7 * s, y - 40 * s], [x + 7 * s, y - 40 * s], [x + 10 * s, y - 10 * s], [x - 10 * s, y - 10 * s]]); c.fill(); c.fillStyle = INK; c.fillRect(x - 5 * s, y - 10 * s, 3.5 * s, 10 * s); c.fillRect(x + 1.5 * s, y - 10 * s, 3.5 * s, 10 * s); }
    }
  }, { t: 10.2, d: 0.8, reveal: 'fade' });
  // a flower seller under a striped umbrella, a cycle rickshaw and a cow at rest
  const marigolds = [];
  for (let k = 0; k < 60; k++) { const a = r() * 6.28, d = Math.sqrt(r()); marigolds.push([k < 30 ? 712 : 848, 1662, Math.cos(a) * d * 40, Math.sin(a) * d * 12, r.pick(['#f29a1f', '#f6c02a', '#e2581e'])]); }
  p.group('life', bx(640, 1690, 930, 1890), (c) => {
    c.translate(0, 190);
    // the umbrella
    c.fillStyle = INK; c.fillRect(778, 1540, 4, 120);
    c.beginPath(); c.moveTo(680, 1560); c.quadraticCurveTo(780, 1470, 880, 1560); c.closePath();
    c.fillStyle = '#d23a2e'; c.fill();
    c.save(); c.clip(); c.fillStyle = '#f2c230';
    for (let k = -4; k <= 4; k += 2) { path(c, [[780, 1500], [780 + k * 26, 1570], [780 + (k + 1) * 26, 1570]]); c.fill(); }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(680, 1560); c.quadraticCurveTo(780, 1470, 880, 1560); c.closePath(); c.stroke();
    // the seller, sitting, and her two flat baskets heaped with marigolds
    c.fillStyle = INK; c.beginPath(); c.arc(780, 1610, 9, 0, 7); c.fill();
    c.fillStyle = '#2f6fc0'; path(c, [[766, 1620], [794, 1620], [806, 1660], [754, 1660]]); c.fill();
    for (const bxx of [712, 848]) { c.fillStyle = '#8a6a3a'; c.beginPath(); c.ellipse(bxx, 1668, 46, 13, 0, 0, 7); c.fill(); }
    for (const [bxx, by, dx, dy, col] of marigolds) { c.fillStyle = col; c.beginPath(); c.arc(bxx + dx, by + dy - 4, 4.5, 0, 7); c.fill(); }
  }, { t: 10.7, d: 0.6, reveal: 'pop', ease: 'back' });
  p.group('life', bx(850, 1680, 1000, 1850), (c) => {
    c.translate(-110, 160);
    // a cycle rickshaw: two big wheels, a hooded seat, painted red and blue
    c.strokeStyle = INK; c.lineWidth = 3;
    for (const [x, rad] of [[985, 30], [1080, 34]]) { c.beginPath(); c.arc(x, 1650, rad, 0, 7); c.stroke(); c.lineWidth = 1; c.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28; c.moveTo(x, 1650); c.lineTo(x + Math.cos(a) * rad, 1650 + Math.sin(a) * rad); } c.stroke(); c.lineWidth = 3; }
    c.fillStyle = '#2f6fc0'; c.fillRect(1040, 1590, 70, 30);
    c.fillStyle = '#d23a2e'; c.beginPath(); c.moveTo(1040, 1590); c.quadraticCurveTo(1050, 1530, 1110, 1540); c.lineTo(1110, 1590); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(985, 1650); c.lineTo(1010, 1600); c.lineTo(1050, 1620); c.moveTo(1010, 1600); c.lineTo(1000, 1585); c.stroke();
  }, { t: 10.9, d: 0.6, reveal: 'pop', ease: 'back' });
  p.group('life', bx(620, 1740, 760, 1840), (c) => {
    c.translate(120, 140);
    // a cow lying in the square, white with a dark hump line
    c.fillStyle = '#f1ebe0'; c.beginPath(); c.ellipse(570, 1670, 52, 20, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(522, 1652, 15, 11, -0.3, 0, 7); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(570, 1670, 52, 20, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(522, 1652, 15, 11, -0.3, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(514, 1642); c.lineTo(506, 1630); c.moveTo(526, 1640); c.lineTo(530, 1628); c.stroke();
    c.fillStyle = '#c9bfae'; c.beginPath(); c.ellipse(552, 1658, 16, 7, 0, 0, 7); c.fill();
  }, { t: 11.0, d: 0.5, reveal: 'fade' });
  // pigeons on the ground near the middle, a flock of them wheeling up
  const ground = [];
  for (let k = 0; k < 40; k++) ground.push([r.range(660, 1060), r.range(1560, 1760)]);
  p.group('life', bx(640, 1540, 1080, 1780), (c) => {
    for (const [x, y] of ground) { c.fillStyle = '#7d8590'; c.beginPath(); c.ellipse(x, y, 7, 4, 0, 0, 7); c.fill(); c.fillStyle = '#4b525c'; c.beginPath(); c.arc(x + 6, y - 3, 2.6, 0, 7); c.fill(); }
  }, { t: 10.5, d: 0.6, reveal: 'fade' });
  const flock = [];
  for (let k = 0; k < 16; k++) flock.push([r.range(0, 6.28), r.range(60, 200), r.range(0.35, 0.6), r.range(0.8, 1.2)]);
  p.live('life', {
    t: 9.2, d: 1, box: bx(300, 700, 1400, 1300),
    draw: (c, time) => {
      c.fillStyle = '#3e4450';
      for (const [ph, R, w, s] of flock) {
        const a = ph + time * w, x = SX + 40 + Math.cos(a) * R * 2.2, y = 980 + Math.sin(a) * R * 0.6 - 60, f = Math.sin(time * 10 * s + ph);
        c.beginPath(); c.moveTo(x - 10 * s, y - f * 6 * s); c.lineTo(x, y); c.lineTo(x + 10 * s, y - f * 6 * s); c.lineTo(x, y + 3 * s); c.closePath(); c.fill();
      }
    },
  });
  // a soft cloud that drifts along the foot of the peaks
  p.live('life', {
    t: 3.0, d: 1.2, box: bx(-200, 560, W + 200, 720),
    draw: (c, time) => {
      const x = ((time * 14) % (W + 600)) - 300;
      c.fillStyle = 'rgba(255,255,255,.7)';
      for (const [dx, dy, rx] of [[0, 0, 140], [120, -14, 90], [-120, 6, 80], [220, 4, 70]]) { c.beginPath(); c.ellipse(x + dx, 650 + dy, rx, 22, 0, 0, 7); c.fill(); }
    },
  });
}

// ---------------------------------------------------------------- the sill: a slim carved beam of dark wood at the foot
function lintel(p, r) {
  p.group('lintel', bx(0, LINTEL - 30, W, H, 0), (c) => {
    c.fillStyle = WOOD; c.fillRect(0, LINTEL, W, H - LINTEL);
    // a row of teeth along its upper edge, cut into the beam
    c.fillStyle = WOOD_D; c.fillRect(0, LINTEL - 22, W, 22);
    c.fillStyle = WOOD_L; for (let x = 0; x < W; x += 20) { path(c, [[x, LINTEL - 22], [x + 20, LINTEL - 22], [x + 10, LINTEL - 5]]); c.fill(); }
    c.fillStyle = WOOD_H; c.fillRect(0, LINTEL - 2, W, 3);
  }, { t: 10.6, d: 0.7, reveal: 'fall' });
  p.group('lintel', bx(0, LINTEL, W, H, 0), (c) => {
    // beads along the top
    for (let x = 12; x < W; x += 18) {
      c.fillStyle = WOOD_D; c.beginPath(); c.ellipse(x + 1.5, LINTEL + 19.5, 7, 5, 0, 0, 7); c.fill();
      c.fillStyle = WOOD_H; c.beginPath(); c.ellipse(x, LINTEL + 18, 6, 4, 0, 0, 7); c.fill();
    }
    // a band of small carved squares, each a sunk diamond, lit on its upper edges
    const y0 = LINTEL + 36, y1 = H - 14, sz = y1 - y0;
    for (let x = 6; x < W; x += sz + 6) {
      c.fillStyle = WOOD_D; c.fillRect(x, y0, sz, sz);
      c.fillStyle = WOOD_L; path(c, [[x + sz / 2, y0 + 6], [x + sz - 6, y0 + sz / 2], [x + sz / 2, y0 + sz - 6], [x + 6, y0 + sz / 2]]); c.fill();
      c.fillStyle = WOOD_H; path(c, [[x + sz / 2, y0 + 6], [x + sz - 6, y0 + sz / 2], [x + sz / 2, y0 + sz / 2 - 4], [x + 6, y0 + sz / 2]]); c.fill();
      c.fillStyle = WOOD_D; c.beginPath(); c.arc(x + sz / 2, y0 + sz / 2, 4, 0, 7); c.fill();
    }
  }, { t: 11.0, d: 0.9, reveal: 'wipe', ease: 'inOut' });
}

// ---------------------------------------------------------------- the name, gilded in the sunk panel
function title(p, r) {
  // cut in dark wood and hung in the sky: the name, lit along its upper edges
  const y = 206;
  p.group('title', bx(260, 20, 1340, 250), (c) => {
    c.font = `700 186px ${DEV}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = 'rgba(20,30,50,.25)'; c.fillText('काठमाडौं', 800 + 6, y + 8);
    c.fillStyle = WOOD_H; c.fillText('काठमाडौं', 800 - 3, y - 3);
    c.fillStyle = WOOD; c.fillText('काठमाडौं', 800, y);
  }, { t: 11.5, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  p.type('title', 'KATHMANDU', 800, 286, { family: DEV, weight: 600, size: 58, color: WOOD, shadow: WOOD_H, sx: -2, sy: -2, track: 0.34, align: 'center', t: 12.3, gap: 0.07, d: 0.5, reveal: 'press' });
  p.type('title', 'NEPAL · THE VALLEY · 1400 M', 800, 330, { family: DEV, weight: 400, size: 26, color: WOOD_L, track: 0.3, align: 'center', t: 13.0, gap: 0.02, d: 0.4, reveal: 'fade' });
}
