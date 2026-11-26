// Kraków: a Polish School of Posters sheet. One painted image on a big empty
// ground: the Wawel dragon's head, made of the castle on Wawel Hill. Its crest
// is the cathedral's towers and the gold dome of the Sigismund Chapel, its scales
// are roofs of copper and tile, its snout the castle's arcaded wing, its eye a
// clock face, its lower jaw the brick walls with battlements for teeth, and its
// neck the limestone hill with the dragon's den. It breathes fire across the
// sheet. Everything is laid on with a loaded brush; the name is hand-lettered.

import { Plate, W, H, boxOf, lengthOf } from '../print.js';
import { lerp, clamp, poly, shade, mix } from '../kit.js';

const GROUND = '#a3c0c9', GROUND_L = '#aac5cd', GROUND_D = '#9cbac4';
const INK = '#1c1a1f', RED = '#d63d1e', ORANGE = '#ef8a25', YELLOW = '#f6d24c', WHITE = '#f5eedc';
const COPPER = '#3e8b72', COPPER_D = '#2a6452', COPPER_L = '#6fb294';
const TILE = '#b6462b', TILE_D = '#8a2f1e', TILE_L = '#d26a45';
const STONE = '#dcc69b', STONE_D = '#b49b70', STONE_L = '#efe0bd';
const BRICK = '#a2412c', BRICK_D = '#76291d', LIME = '#e4d8bb', LIME_D = '#b8aa8a';
const MOUTH = '#4b1116', GOLD = '#e4b23c', GOLD_D = '#a87a1c', RIVER = '#284c78', GRASS = '#5e8a4a';

const FACE = '"Permanent Marker", cursive';

export const city = {
  id: 'krakow', name: 'Kraków', wall: '#1f2f36',
  alt: 'A Polish School poster painted with a loaded brush on a pale blue ground: the Wawel dragon\'s head built from Wawel Castle, its crest the cathedral\'s Sigismund Tower, Clock Tower and Silver Bells Tower with the gold dome of the Sigismund Chapel, its scales copper and tiled roofs, its snout the castle\'s arcaded wing, its eye a clock face, its lower jaw the brick walls with battlements for teeth and its neck the limestone hill with the dragon\'s den above the Vistula, breathing a long red and yellow fire, with pigeons overhead and the name Kraków lettered by hand',
  google: 'family=Permanent+Marker',
  fonts: [['400 280px "Permanent Marker"', 'Kraków'], ['400 50px "Permanent Marker"', 'smok wawelski · WAWEL']],
  build,
};

// ================================================================ the brush
// a smooth line through control points, sampled every few units
function spline(ctrl, step = 5) {
  const out = [];
  const P = (i) => ctrl[Math.max(0, Math.min(ctrl.length - 1, i))];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const a = P(i - 1), b = P(i), c = P(i + 1), d = P(i + 2);
    const n = Math.max(1, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (p0, p1, p2, p3) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
      out.push([f(a[0], b[0], c[0], d[0]), f(a[1], b[1], c[1], d[1])]);
    }
  }
  out.push(ctrl[ctrl.length - 1].slice());
  return out;
}

// a stroke of a loaded brush: a ribbon that swells and wavers, runs dry toward
// its end into separate bristle marks, and shows the ground through a few
// streaks. All its randomness is drawn here, at build time.
function brushData(r, ctrl, o) {
  const pts = spline(ctrl, o.step || 5);
  const n = pts.length, total = Math.max(1, lengthOf(pts));
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28];
  const fq = [r.range(0.015, 0.03), r.range(0.06, 0.12)];
  const L = [], R = [], N = [], Wd = [];
  let s = 0;
  for (let i = 0; i < n; i++) {
    if (i) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const nx = -ty, ny = tx, u = s / total;
    const shape = Math.min(1, u / (o.in ?? 0.06)) ** 0.5 * (0.45 + 0.55 * Math.min(1, (1 - u) / (o.out ?? 0.3)));
    const w = o.w * Math.max(0.12, shape) * (1 + (o.waver ?? 0.12) * Math.sin(s * fq[0] + ph[0]) + 0.05 * Math.sin(s * fq[1] + ph[1]));
    const ej = o.edge ?? 0.07, el = (w / 2) * (1 + ej * Math.sin(s * 0.21 + ph[2])), er = (w / 2) * (1 + ej * Math.sin(s * 0.17 + ph[3]));
    L.push([pts[i][0] + nx * el, pts[i][1] + ny * el]);
    R.push([pts[i][0] - nx * er, pts[i][1] - ny * er]);
    N.push([nx, ny]); Wd.push(w);
  }
  const dry = Math.max(1, Math.floor((n - 1) * (o.dry ?? 0.8)));
  const line = (off) => pts.map((p, i) => [p[0] + N[i][0] * off * Wd[i] / 2, p[1] + N[i][1] * off * Wd[i] / 2]);
  const br = [];
  for (let k = 0; k < (o.nb ?? 9); k++) {
    const off = r.range(-0.92, 0.92);
    br.push({ pts: line(off), w: o.w * r.range(0.04, 0.11), a: r.range(0.55, 1), s: Math.floor(r() * dry * 0.3), e: Math.floor(lerp(dry, n - 1, r() ** 0.6)) });
  }
  const gaps = [];
  for (let k = 0; k < (o.ng ?? 3); k++) {
    const off = r.range(-0.75, 0.75), a = Math.floor(r() * dry * 0.7);
    gaps.push({ pts: line(off), w: o.w * r.range(0.02, 0.06), s: a, e: Math.min(dry, a + Math.floor(r.range(0.15, 0.5) * n)) });
  }
  return { pts, L, R, n, dry, br, gaps, box: boxOf(L.concat(R), 4) };
}
function drawBrush(c, B, color, gap, q) {
  const k = Math.max(1, Math.floor(q * (B.n - 1)));
  const m = Math.min(k, B.dry);
  const base = c.globalAlpha;
  c.fillStyle = color;
  c.beginPath(); c.moveTo(B.L[0][0], B.L[0][1]);
  for (let i = 1; i <= m; i++) c.lineTo(B.L[i][0], B.L[i][1]);
  for (let i = m; i >= 0; i--) c.lineTo(B.R[i][0], B.R[i][1]);
  c.closePath(); c.fill();
  c.strokeStyle = color; c.lineCap = 'round'; c.lineJoin = 'round';
  for (const b of B.br) {
    if (b.s >= k) continue;
    const e = Math.min(k, b.e);
    c.globalAlpha = base * b.a; c.lineWidth = b.w;
    c.beginPath(); c.moveTo(b.pts[b.s][0], b.pts[b.s][1]);
    for (let i = b.s + 1; i <= e; i++) c.lineTo(b.pts[i][0], b.pts[i][1]);
    c.stroke();
  }
  c.globalAlpha = base;
  if (gap) {
    c.strokeStyle = gap;
    for (const g of B.gaps) {
      if (g.s >= m) continue;
      const e = Math.min(m, g.e);
      c.lineWidth = g.w;
      c.beginPath(); c.moveTo(g.pts[g.s][0], g.pts[g.s][1]);
      for (let i = g.s + 1; i <= e; i++) c.lineTo(g.pts[i][0], g.pts[i][1]);
      c.stroke();
    }
  }
}
// one stroke as a mark, painted from its start
function brush(p, layer, ctrl, o) {
  const B = brushData(p.r, ctrl, o);
  return p.mark(layer, {
    t: o.t, d: o.d ?? 0.6, reveal: 'draw', ease: o.ease || 'soft', box: B.box,
    draw: (c, q) => drawBrush(c, B, o.color, o.gap, q),
  });
}
// many strokes laid down together, one after another within the mark
function brushes(p, layer, list, o) {
  const Bs = list.map((s) => ({ B: brushData(p.r, s.ctrl, { ...o, ...s }), color: s.color || o.color, gap: s.gap ?? o.gap }));
  const box = boxOf(Bs.flatMap(({ B }) => [[B.box.x, B.box.y], [B.box.x + B.box.w, B.box.y + B.box.h]]), 2);
  const N = Bs.length, lap = o.lap ?? 0.5;
  return p.mark(layer, {
    t: o.t, d: o.d ?? 1, reveal: 'draw', ease: o.ease || 'linear', box,
    draw: (c, q) => {
      for (let i = 0; i < N; i++) {
        const a = (i * (1 - lap)) / (N * (1 - lap) + lap), b = (i * (1 - lap) + 1) / (N * (1 - lap) + lap);
        const qi = clamp((q - a) / (b - a));
        if (qi > 0) drawBrush(c, Bs[i].B, Bs[i].color, Bs[i].gap, 1 - (1 - qi) ** 2);
      }
    },
  });
}

// a shape painted flat: its edge a little ragged, a few strokes of a lighter and
// a darker tint dragged through it
function ragged(r, pts, amp = 2.5, step = 9) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n) + r.range(-amp, amp), lerp(a[1], b[1], k / n) + r.range(-amp, amp)]);
  }
  return out;
}
function daubData(r, pts, color, o = {}) {
  const shape = ragged(r, pts, o.amp ?? 2.5);
  const b = boxOf(pts, 6);
  const ang = o.ang ?? 0, ca = Math.cos(ang), sa = Math.sin(ang);
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.hypot(b.w, b.h) / 2;
  const streaks = [];
  const lt = o.light || shade(color, 1.13), dk = o.dark || shade(color, 0.86);
  for (let y = -R; y < R; y += o.sp ?? 7) {
    if (r() > (o.fill ?? 0.55)) continue;
    const x0 = r.range(-R, R * 0.6), len = r.range(R * 0.2, R * 0.9);
    const yy = y + r.range(-2, 2);
    streaks.push([cx + ca * x0 - sa * yy, cy + sa * x0 + ca * yy, cx + ca * (x0 + len) - sa * (yy + r.range(-3, 3)), cy + sa * (x0 + len) + ca * (yy + r.range(-3, 3)), r.range(1.5, (o.sp ?? 7) * 0.7), r() < 0.5 ? lt : dk]);
  }
  return { shape, streaks, box: boxOf(shape, 4), color };
}
function drawDaub(c, D) {
  c.fillStyle = D.color; poly(c, D.shape); c.fill();
  c.save(); poly(c, D.shape); c.clip();
  c.lineCap = 'round';
  for (const col of new Set(D.streaks.map((s) => s[5]))) {
    c.strokeStyle = col;
    for (const s of D.streaks) if (s[5] === col) { c.lineWidth = s[4]; c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(s[2], s[3]); c.stroke(); }
  }
  c.restore();
}
function daub(p, layer, pts, color, o) {
  const D = daubData(p.r, pts, color, o);
  return p.mark(layer, { t: o.t, d: o.d ?? 0.9, reveal: o.reveal || 'wipe', ease: o.ease || 'inOut', box: D.box, draw: (c) => drawDaub(c, D) });
}

// a hand-drawn line: the points jittered a little, at build time
function wob(r, pts, amp = 1.4, step = 12) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n) + r.range(-amp, amp), lerp(a[1], b[1], k / n) + r.range(-amp, amp)]);
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}
function path(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }

// the outline of the head, facing left ----------------------------------------
const SNOUT = [[248, 818], [262, 790], [330, 752], [450, 712], [580, 676], [700, 646], [790, 632], [850, 680], [900, 800], [912, 905], [700, 893], [520, 878], [380, 864], [290, 852]];
const ROOF = [[255, 800], [330, 752], [450, 712], [580, 676], [700, 646], [790, 632], [812, 668], [800, 706], [700, 718], [580, 744], [450, 776], [340, 806], [272, 822]];
const SKULL = [[780, 640], [790, 560], [860, 510], [980, 478], [1120, 466], [1240, 482], [1330, 540], [1388, 640], [1414, 760], [1424, 880], [1404, 990], [1300, 1020], [1120, 1000], [980, 968], [912, 905], [900, 800], [850, 680]];
const JAW = [[318, 1000], [360, 984], [500, 966], [700, 948], [880, 932], [980, 960], [1070, 1010], [1100, 1100], [1050, 1160], [900, 1134], [700, 1112], [540, 1092], [420, 1062], [338, 1030]];
const NECK = [[1000, 1080], [1150, 1040], [1320, 990], [1404, 900], [1440, 1050], [1480, 1250], [1530, 1460], [1580, 1600], [1612, 1650], [1612, 1730], [1390, 1730], [1290, 1600], [1200, 1450], [1130, 1320], [1080, 1200]];
const MOUTHP = [[300, 852], [380, 864], [520, 878], [700, 893], [912, 905], [980, 960], [880, 932], [700, 948], [500, 966], [360, 984], [318, 1000], [262, 930]];
const EYE = [872, 612, 42];

function build() {
  const p = new Plate({ paper: GROUND, seed: 1038 });
  const r = p.r;
  p.stack('ground', 'mouth', 'flame', 'body', 'scales', 'towers', 'ink', 'teeth', 'live', 'title');

  ground(p, r);
  body(p, r);
  scales(p, r);
  towers(p, r);
  ink(p, r);
  teeth(p, r);
  flame(p, r);
  live(p, r);
  title(p, r);
  return p;
}

// ================================================================ the ground, laid in broad strokes
function ground(p, r) {
  const list = [];
  for (let i = 0; i < 7; i++) {
    const y = 60 + i * 320 + r.range(-40, 40), x0 = r.range(-200, -80), x1 = W + r.range(80, 200), tilt = r.range(-120, 120);
    list.push({ ctrl: [[x0, y - tilt], [W * 0.35, y - tilt * 0.3 + r.range(-30, 30)], [W * 0.7, y + tilt * 0.3 + r.range(-30, 30)], [x1, y + tilt]], color: i % 2 ? GROUND_L : GROUND_D, w: r.range(260, 360) });
  }
  // a few strokes per mark, so the sheet is painted top to bottom in a second and a half
  for (let i = 0; i < list.length; i += 2) {
    brushes(p, 'ground', list.slice(i, i + 2), { t: 0.1 + i * 0.2, d: 0.9, nb: 16, ng: 0, dry: 0.9, waver: 0.04, edge: 0.012, out: 0.1, lap: 0.6 });
  }
}

// ================================================================ the head's masses
function body(p, r) {
  // the inside of the open mouth, under everything
  daub(p, 'mouth', MOUTHP, MOUTH, { t: 1.9, d: 0.8, reveal: 'wipeL', sp: 9 });
  // the hill: limestone falling to the river, grass along the top
  daub(p, 'body', NECK, LIME, { t: 1.4, d: 1.3, reveal: 'fall', ang: 1.1, sp: 8, light: '#f2ecdc', dark: LIME_D });
  daub(p, 'body', [[1010, 1085], [1150, 1045], [1320, 995], [1404, 905], [1430, 1000], [1300, 1100], [1160, 1160], [1050, 1190]], GRASS, { t: 2.1, d: 0.8, reveal: 'wipe', ang: -0.3, sp: 6 });
  // the walls: the lower jaw
  daub(p, 'body', JAW, BRICK, { t: 2.5, d: 1.1, reveal: 'wipeL', ang: -0.06, sp: 6, light: '#b8553c', dark: BRICK_D });
  // the cathedral's copper: the skull
  daub(p, 'body', SKULL, COPPER, { t: 3.0, d: 1.2, reveal: 'rise', ang: -0.5, sp: 7, light: COPPER_L, dark: COPPER_D });
  // the castle's wing: the snout, its wall then its tiled roof
  daub(p, 'body', SNOUT, STONE, { t: 3.6, d: 1.1, reveal: 'wipeL', ang: -0.2, sp: 6, light: STONE_L, dark: STONE_D });
  daub(p, 'body', ROOF, TILE, { t: 4.1, d: 1.0, reveal: 'wipeL', ang: -0.27, sp: 5, light: TILE_L, dark: TILE_D });
  // a stone patch round the eye
  daub(p, 'body', [[800, 600], [830, 560], [900, 550], [950, 585], [960, 650], [920, 690], [850, 690], [805, 655]], STONE, { t: 4.4, d: 0.6, reveal: 'iris', sp: 6, light: STONE_L, dark: STONE_D });
}

// where the roof's lower edge and the jaw's underside run, for the windows
const roofFoot = (x) => lerp(822, 706, (x - 272) / (800 - 272));
const snoutFoot = (x) => lerp(852, 905, (x - 290) / (912 - 290));

// ================================================================ scales: roofs, windows, bricks, tiles
function scales(p, r) {
  // the snout's windows: three rows of stone-framed windows, an arcade along the gum
  {
    const frames = [], holes = [], arches = [];
    for (let x = 360; x < 880; x += 38) {
      const top = roofFoot(x) + 10, bot = snoutFoot(x) - 6, h = bot - top;
      if (h < 40) continue;
      const rows = h > 150 ? 3 : h > 90 ? 2 : 1;
      for (let k = 0; k < rows; k++) {
        const y = top + (h - 46) * ((k + 0.5) / (rows + 0.6)), wh = 22;
        frames.push([x - 9, y - 3, 18, wh + 6]); holes.push([x - 6, y, 12, wh]);
      }
      arches.push([x, bot - 4, 14, 24]);
    }
    p.group('scales', { x: 330, y: 690, w: 600, h: 230 }, (c) => {
      c.fillStyle = STONE_L; for (const f of frames) c.fillRect(f[0], f[1], f[2], f[3]);
      c.fillStyle = INK; for (const h of holes) c.fillRect(h[0], h[1], h[2], h[3]);
      c.fillStyle = MOUTH; c.beginPath();
      for (const [x, y, w, h] of arches) { c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h + w / 2); c.arc(x, y - h + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, y); c.closePath(); }
      c.fill();
      c.strokeStyle = STONE_D; c.lineWidth = 2; c.beginPath();
      for (const [x, y] of arches) { c.moveTo(x - 19, y - 26); c.lineTo(x + 19, y - 26); }
      c.stroke();
    }, { t: 4.7, d: 1.0, reveal: 'wipeL', ease: 'inOut' });
  }
  // tiles on the snout's roof: scalloped rows
  {
    const rows = [];
    for (let k = 0; k < 5; k++) {
      const row = [];
      for (let x = 280 + (k % 2) * 9; x < 800; x += 18) {
        const top = lerp(800, 640, (x - 255) / (790 - 255)), y = top + 12 + k * 13 + (x - 255) * 0.01;
        if (y > roofFoot(x) - 4) continue;
        row.push([x, y]);
      }
      rows.push(row);
    }
    p.group('scales', { x: 250, y: 620, w: 570, h: 210 }, (c) => {
      c.strokeStyle = TILE_D; c.lineWidth = 2.2; c.beginPath();
      for (const row of rows) for (const [x, y] of row) { c.moveTo(x - 9, y - 3); c.quadraticCurveTo(x, y + 7, x + 9, y - 3); }
      c.stroke();
      // three dormers
      c.fillStyle = STONE; c.strokeStyle = INK; c.lineWidth = 2.4;
      for (const x of [420, 560, 690]) {
        const y = roofFoot(x) - 36;
        c.beginPath(); c.moveTo(x - 14, y + 26); c.lineTo(x - 14, y); c.lineTo(x, y - 14); c.lineTo(x + 14, y); c.lineTo(x + 14, y + 26); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = INK; c.fillRect(x - 6, y + 2, 12, 16); c.fillStyle = STONE;
      }
    }, { t: 5.0, d: 0.9, reveal: 'wipeL', ease: 'inOut' });
  }
  // the lower jaw: courses of brick, buttresses, arrow slits
  {
    const top = (x) => lerp(1000, 932, (x - 318) / (880 - 318)), bot = (x) => lerp(1030, 1134, (x - 338) / (900 - 338));
    const lines = [];
    for (let k = 1; k < 9; k++) {
      const row = [];
      for (let x = 350; x <= 1060; x += 30) { const y0 = top(Math.min(x, 880)), y1 = bot(Math.min(x, 900)); const y = lerp(y0, y1, k / 9); row.push([x, y]); }
      lines.push(wob(r, row, 0.8));
    }
    const joints = [];
    for (let k = 0; k < 9; k++) for (let x = 360 + (k % 2) * 14; x < 1000; x += 28) {
      const xx = Math.min(x, 880), y0 = lerp(top(xx), bot(xx), k / 9), y1 = lerp(top(xx), bot(xx), (k + 1) / 9);
      joints.push([[x, y0], [x + 1, y1]]);
    }
    p.strokes('scales', lines.concat(joints), BRICK_D, 1.6, { t: 5.3, d: 0.9, reveal: 'wipeL', ease: 'inOut' });
    const butt = [];
    for (const x of [470, 620, 770]) butt.push([[x, top(x) + 8], [x - 10, bot(x) - 2], [x + 18, bot(x) - 2], [x + 22, top(x) + 8]]);
    p.group('scales', { x: 440, y: 920, w: 380, h: 220 }, (c) => {
      c.fillStyle = BRICK_D; for (const b of butt) { poly(c, b); c.fill(); }
      c.fillStyle = INK; for (const x of [545, 695, 830]) { const y = lerp(top(x), bot(x), 0.45); c.fillRect(x - 3, y - 12, 6, 24); }
    }, { t: 5.6, d: 0.6, reveal: 'wipeL' });
  }
  // the skull: the nave's copper roof with its seams, then rows of chapel roofs like scales
  {
    const nave = [[930, 530], [1080, 500], [1240, 508], [1330, 560], [1362, 650], [1210, 630], [1060, 640], [950, 660]];
    const D = daubData(r, nave, COPPER_L, { ang: 1.4, sp: 6, light: '#8cc6aa', dark: COPPER });
    const seams = [];
    for (let x = 950; x < 1350; x += 13) seams.push(wob(r, [[x, 520 + (x - 950) * 0.02], [x + 6, 650]], 0.6));
    p.group('scales', boxOf(nave, 8), (c) => {
      drawDaub(c, D);
      c.save(); poly(c, D.shape); c.clip();
      c.strokeStyle = COPPER; c.lineWidth = 2; c.beginPath(); for (const s of seams) path(c, s); c.stroke();
      c.restore();
    }, { t: 5.4, d: 0.9, reveal: 'wipe', ease: 'inOut' });
    // the gothic wall under it: buttresses and tall pointed windows
    const wall = [[950, 660], [1060, 640], [1210, 630], [1362, 650], [1395, 720], [1380, 740], [1230, 730], [1060, 740], [960, 745]];
    const Dw = daubData(r, wall, STONE, { ang: 0, sp: 6, light: STONE_L, dark: STONE_D });
    const wins = [];
    for (let x = 990; x < 1370; x += 46) wins.push([x, lerp(735, 735, 0), 44]);
    p.group('scales', boxOf(wall, 8), (c) => {
      drawDaub(c, Dw);
      c.fillStyle = INK; c.beginPath();
      for (const [x, y, h] of wins) { c.moveTo(x - 7, y - 8); c.lineTo(x - 7, y - h + 10); c.quadraticCurveTo(x - 7, y - h, x, y - h - 8); c.quadraticCurveTo(x + 7, y - h, x + 7, y - h + 10); c.lineTo(x + 7, y - 8); c.closePath(); }
      c.fill();
      c.fillStyle = STONE_D; for (const [x] of wins) c.fillRect(x + 18, 650, 7, 88);
    }, { t: 5.9, d: 0.8, reveal: 'wipe', ease: 'inOut' });
    // chapel roofs, three rows, alternating copper and tile: the dragon's scales
    const roofs = [];
    const rowsY = [[800, 965, 1405, 84], [848, 945, 1400, 80], [896, 935, 1380, 76], [944, 950, 1340, 72], [990, 990, 1300, 66]];
    rowsY.forEach(([y, x0, x1, w], k) => {
      for (let x = x0 + (k % 2) * w * 0.38; x + w * 0.3 < x1; x += w * 0.76) {
        if (!inside(SKULL, x, y - 6)) continue;
        roofs.push({ x, y, w, h: w * r.range(0.6, 0.7), col: r() < 0.36 ? COPPER_L : TILE, k });
      }
    });
    for (let k = 0; k < 5; k++) {
      const set = roofs.filter((f) => f.k === k);
      const box = boxOf(set.flatMap((f) => [[f.x - f.w / 2, f.y - f.h], [f.x + f.w / 2, f.y + f.w * 0.3]]), 6);
      // beaver-tail roof tiles, as Kraków's roofs are laid, made big: the dragon's scales
      p.group('scales', box, (c) => {
        c.lineJoin = 'round';
        for (const f of set) {
          const hw = f.w / 2, y0 = f.y - f.h, yb = f.y + f.w * 0.1;
          c.beginPath(); c.moveTo(f.x - hw, y0); c.lineTo(f.x - hw, yb - hw); c.arc(f.x, yb - hw, hw, Math.PI, 0, true); c.lineTo(f.x + hw, y0);
          c.fillStyle = f.col; c.fill();
          c.strokeStyle = INK; c.lineWidth = 2.8; c.stroke();
          c.strokeStyle = f.col === TILE ? TILE_L : '#9fd2b8'; c.lineWidth = 4; c.lineCap = 'round';
          c.beginPath(); c.moveTo(f.x - hw * 0.55, y0 + 10); c.lineTo(f.x - hw * 0.55, yb - hw); c.arc(f.x, yb - hw, hw * 0.55, Math.PI, Math.PI * 0.7, true); c.stroke();
          c.strokeStyle = f.col === TILE ? TILE_D : COPPER_D; c.lineWidth = 2;
          c.beginPath(); c.moveTo(f.x + hw * 0.35, y0 + 8); c.lineTo(f.x + hw * 0.35, yb - hw * 0.6); c.stroke();
        }
      }, { t: 6.2 + k * 0.24, d: 0.6, reveal: 'fall', ease: 'out' });
    }
  }
  // the hill: scales of stone in rows down the neck, tufts of trees, the den
  {
    const arcs = [];
    for (let k = 0; k < 12; k++) {
      const y = 1150 + k * 46;
      for (let x = 1080 + k * 22 + (k % 2) * 22; x < 1600; x += 44) {
        if (!inside(NECK, x, y + 10) || !inside(NECK, x - 20, y) || !inside(NECK, x + 20, y)) continue;
        if (Math.hypot(x - 1430, y - 1610) < 110) continue;
        arcs.push(wob(r, [[x - 20, y], [x - 12, y + 14], [x, y + 18], [x + 12, y + 14], [x + 20, y]], 0.7, 8));
      }
    }
    p.strokes('scales', arcs, '#9a917c', 3.4, { t: 6.4, d: 1.0, reveal: 'fall', ease: 'inOut' });
    // fissures in the limestone
    const cracks = [];
    for (let i = 0; i < 9; i++) {
      const x = r.range(1120, 1520), y = r.range(1200, 1620);
      if (!inside(NECK, x, y) || !inside(NECK, x + 10, y + 90) || Math.hypot(x - 1430, y - 1610) < 140) continue;
      cracks.push({ ctrl: [[x, y], [x + r.range(-10, 14), y + 40], [x + r.range(0, 24), y + r.range(80, 120)]], w: r.range(6, 11), color: '#8f8673' });
    }
    brushes(p, 'scales', cracks, { t: 6.6, d: 0.6, nb: 4, ng: 0, dry: 0.6, lap: 0.6 });
    const tufts = [];
    for (let i = 0; i < 26; i++) {
      const x = r.range(1060, 1420), y = r.range(1040, 1180);
      if (!inside(NECK, x, y)) continue;
      tufts.push([x, y, r.range(12, 22)]);
    }
    p.group('scales', { x: 1020, y: 990, w: 440, h: 230 }, (c) => {
      c.fillStyle = '#3d6a35'; c.beginPath(); for (const [x, y, s] of tufts) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
      c.fillStyle = '#7aa557'; c.beginPath(); for (const [x, y, s] of tufts) { c.moveTo(x - s * 0.2 + s * 0.55, y - s * 0.3); c.arc(x - s * 0.2, y - s * 0.3, s * 0.55, 0, Math.PI * 2); } c.fill();
    }, { t: 6.9, d: 0.7, reveal: 'pop' });
    // the dragon's den: a dark cave mouth in the rock
    p.group('scales', { x: 1330, y: 1500, w: 200, h: 180 }, (c) => {
      c.translate(130, 0);
      c.fillStyle = INK; c.beginPath(); c.moveTo(1222, 1672); c.bezierCurveTo(1222, 1560, 1290, 1520, 1320, 1530); c.bezierCurveTo(1370, 1545, 1384, 1610, 1382, 1672); c.closePath(); c.fill();
      c.strokeStyle = LIME_D; c.lineWidth = 3; c.beginPath(); c.moveTo(1208, 1676); c.bezierCurveTo(1210, 1550, 1290, 1505, 1324, 1515); c.bezierCurveTo(1380, 1530, 1398, 1610, 1396, 1676); c.stroke();
    }, { t: 7.2, d: 0.7, reveal: 'iris' });
  }
}

// is (x, y) inside the polygon
function inside(pts, x, y) {
  let s = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) s = !s;
  }
  return s;
}

// ================================================================ the crest: the cathedral's towers and domes
function towers(p, r) {
  const lean = 0.14; // swept back, like horns
  const at = (c, x, y) => { c.translate(x, y); c.transform(1, 0, -lean, 1, 0, 0); };
  const line = (c, w = 2.6) => { c.strokeStyle = INK; c.lineWidth = w; c.lineJoin = 'round'; c.stroke(); };
  // a baroque helmet: a bulb, a waist, a lantern, a smaller bulb, a needle
  const helmet = (c, w, y, h, col, dark) => {
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-w, y); c.bezierCurveTo(-w * 1.15, y - h * 0.4, -w * 0.2, y - h * 0.5, -w * 0.18, y - h * 0.62);
    c.lineTo(w * 0.18, y - h * 0.62); c.bezierCurveTo(w * 0.2, y - h * 0.5, w * 1.15, y - h * 0.4, w, y); c.closePath(); c.fill(); line(c);
    c.fillStyle = dark; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(w * 0.1, y - h * 0.3, w * 0.12, y - h * 0.5, w * 0.18, y - h * 0.62); c.bezierCurveTo(w * 0.2, y - h * 0.5, w * 1.15, y - h * 0.4, w, y); c.closePath(); c.globalAlpha = 0.5; c.fill(); c.globalAlpha = 1;
    // the lantern
    c.fillStyle = STONE; c.fillRect(-w * 0.22, y - h * 0.8, w * 0.44, h * 0.18); c.strokeRect(-w * 0.22, y - h * 0.8, w * 0.44, h * 0.18);
    c.fillStyle = INK; c.fillRect(-w * 0.08, y - h * 0.77, w * 0.16, h * 0.12);
    c.fillStyle = col; c.beginPath(); c.ellipse(0, y - h * 0.86, w * 0.3, h * 0.08, 0, 0, Math.PI * 2); c.fill(); line(c, 2);
    c.beginPath(); c.moveTo(0, y - h * 0.92); c.lineTo(0, y - h); line(c, 3);
    c.fillStyle = GOLD; c.beginPath(); c.arc(0, y - h - 4, 6, 0, Math.PI * 2); c.fill(); line(c, 1.6);
  };
  // the Sigismund Tower: a stone gothic tower with its baroque copper helmet
  p.group('towers', { x: 820, y: 180, w: 200, h: 370 }, (c) => {
    at(c, 905, 530);
    c.fillStyle = STONE; c.beginPath(); c.rect(-42, -210, 84, 210); c.fill(); line(c);
    c.fillStyle = STONE_D; c.fillRect(-42, -210, 14, 210); c.fillRect(28, -210, 14, 210);
    c.fillStyle = INK;
    for (const y of [-190, -120]) { c.beginPath(); c.moveTo(-14, y + 52); c.lineTo(-14, y + 10); c.quadraticCurveTo(-14, y, -5, y - 6); c.lineTo(-5, y + 52); c.fill(); c.beginPath(); c.moveTo(14, y + 52); c.lineTo(14, y + 10); c.quadraticCurveTo(14, y, 5, y - 6); c.lineTo(5, y + 52); c.fill(); }
    c.fillStyle = STONE_L; c.fillRect(-48, -218, 96, 10); c.strokeRect(-48, -218, 96, 10);
    helmet(c, 50, -218, 150, COPPER_L, COPPER_D);
  }, { t: 5.6, d: 1.1, reveal: 'rise', ease: 'out' });
  // the gold dome of the Sigismund Chapel, and the darker dome of the Vasa Chapel
  p.group('towers', { x: 980, y: 300, w: 230, h: 230 }, (c) => {
    at(c, 1150, 494);
    c.fillStyle = STONE; c.fillRect(-36, -40, 72, 40); c.strokeStyle = INK; c.lineWidth = 2.4; c.strokeRect(-36, -40, 72, 40);
    c.fillStyle = COPPER_D; c.beginPath(); c.arc(0, -40, 34, Math.PI, 0); c.closePath(); c.fill(); line(c, 2.4);
    c.fillStyle = COPPER; c.fillRect(-7, -94, 14, 22); c.strokeRect(-7, -94, 14, 22);
    c.beginPath(); c.arc(0, -94, 9, Math.PI, 0); c.fill(); line(c, 2);
  }, { t: 6.0, d: 0.8, reveal: 'rise', ease: 'out' });
  p.group('towers', { x: 960, y: 230, w: 190, h: 290 }, (c) => {
    at(c, 1050, 500);
    // the square chapel and its drum with round windows
    c.fillStyle = STONE_L; c.fillRect(-60, -60, 120, 60); c.strokeStyle = INK; c.lineWidth = 2.6; c.strokeRect(-60, -60, 120, 60);
    c.fillStyle = STONE; c.fillRect(-46, -104, 92, 44); c.strokeRect(-46, -104, 92, 44);
    c.fillStyle = INK; for (const x of [-28, 0, 28]) { c.beginPath(); c.arc(x, -82, 7, 0, Math.PI * 2); c.fill(); }
    // the dome, its gilded scales and ribs
    c.fillStyle = GOLD; c.beginPath(); c.moveTo(-50, -104); c.bezierCurveTo(-50, -170, -14, -186, 0, -190); c.bezierCurveTo(14, -186, 50, -170, 50, -104); c.closePath(); c.fill(); line(c, 2.6);
    c.save(); c.clip();
    c.strokeStyle = GOLD_D; c.lineWidth = 1.6; c.beginPath();
    for (let y = -112; y > -190; y -= 10) for (let x = -50 + ((y / 10) % 2 ? 6 : 0); x < 50; x += 12) { c.moveTo(x - 6, y); c.quadraticCurveTo(x, y + 6, x + 6, y); }
    c.stroke();
    c.fillStyle = 'rgba(255,240,190,.55)'; c.beginPath(); c.ellipse(-20, -150, 9, 26, 0.3, 0, Math.PI * 2); c.fill();
    c.restore();
    c.strokeStyle = GOLD_D; c.lineWidth = 2; c.beginPath();
    for (const k of [-0.6, -0.25, 0.25, 0.6]) { c.moveTo(k * 50, -104); c.quadraticCurveTo(k * 40, -170, 0, -190); }
    c.stroke();
    // its lantern and little gold cupola
    c.fillStyle = STONE_L; c.fillRect(-11, -222, 22, 32); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(-11, -222, 22, 32);
    c.fillStyle = INK; c.fillRect(-4, -216, 8, 20);
    c.fillStyle = GOLD; c.beginPath(); c.arc(0, -222, 14, Math.PI, 0); c.closePath(); c.fill(); line(c, 2);
    c.beginPath(); c.moveTo(0, -236); c.lineTo(0, -262); line(c, 3);
    c.beginPath(); c.arc(0, -266, 6, 0, Math.PI * 2); c.fillStyle = GOLD; c.fill(); line(c, 1.6);
  }, { t: 6.3, d: 0.9, reveal: 'rise', ease: 'out' });
  // the Clock Tower: brick with stone corners, a clock, a tall stepped copper spire
  p.group('towers', { x: 1150, y: 40, w: 230, h: 480 }, (c) => {
    at(c, 1250, 510);
    c.fillStyle = BRICK; c.beginPath(); c.rect(-38, -240, 76, 240); c.fill(); line(c);
    c.fillStyle = STONE; for (let y = -232; y < 0; y += 24) { c.fillRect(-38, y, 12, 12); c.fillRect(26, y + 12, 12, 12); }
    c.fillStyle = INK; c.fillRect(-9, -120, 18, 44); c.fillRect(-9, -60, 18, 34);
    c.fillStyle = STONE_L; c.beginPath(); c.arc(0, -184, 22, 0, Math.PI * 2); c.fill(); line(c, 2.4);
    c.beginPath(); c.moveTo(0, -184); c.lineTo(0, -199); c.moveTo(0, -184); c.lineTo(11, -180); line(c, 2.4);
    c.fillStyle = STONE_L; c.fillRect(-44, -248, 88, 10); c.strokeRect(-44, -248, 88, 10);
    // the spire: a bell, an open lantern with four pinnacles, a second bell, the needle
    c.fillStyle = COPPER_L;
    c.beginPath(); c.moveTo(-42, -248); c.bezierCurveTo(-44, -290, -18, -300, -16, -318); c.lineTo(16, -318); c.bezierCurveTo(18, -300, 44, -290, 42, -248); c.closePath(); c.fill(); line(c);
    c.fillStyle = STONE; c.fillRect(-18, -360, 36, 42); c.strokeRect(-18, -360, 36, 42);
    c.fillStyle = INK; c.fillRect(-8, -352, 6, 28); c.fillRect(2, -352, 6, 28);
    c.fillStyle = COPPER_L;
    for (const x of [-26, 26]) { c.beginPath(); c.moveTo(x - 5, -318); c.lineTo(x, -352); c.lineTo(x + 5, -318); c.closePath(); c.fill(); line(c, 1.8); }
    c.beginPath(); c.moveTo(-22, -360); c.bezierCurveTo(-24, -385, -8, -392, -6, -404); c.lineTo(6, -404); c.bezierCurveTo(8, -392, 24, -385, 22, -360); c.closePath(); c.fill(); line(c);
    c.beginPath(); c.moveTo(-6, -404); c.lineTo(0, -468); c.lineTo(6, -404); c.closePath(); c.fill(); line(c, 2.2);
    c.fillStyle = GOLD; c.beginPath(); c.arc(0, -472, 6, 0, Math.PI * 2); c.fill(); line(c, 1.6);
  }, { t: 6.6, d: 1.2, reveal: 'rise', ease: 'out' });
  // the Silver Bells Tower: lower, with a small helmet
  p.group('towers', { x: 1270, y: 300, w: 160, h: 270 }, (c) => {
    at(c, 1335, 560);
    c.fillStyle = STONE; c.beginPath(); c.rect(-30, -150, 60, 150); c.fill(); line(c);
    c.fillStyle = INK; c.fillRect(-12, -134, 8, 30); c.fillRect(4, -134, 8, 30); c.fillRect(-5, -80, 10, 26);
    c.fillStyle = STONE_L; c.fillRect(-35, -158, 70, 9); c.strokeRect(-35, -158, 70, 9);
    helmet(c, 36, -158, 100, COPPER_L, COPPER_D);
  }, { t: 7.0, d: 1.0, reveal: 'rise', ease: 'out' });
  // round turrets down the back of the neck, their tiled cones the dragon's spines
  const spines = [[1398, 690, 0.95], [1424, 860, 1.05], [1452, 1040, 1.0], [1488, 1230, 0.92], [1530, 1420, 0.85]];
  spines.forEach(([x, y, s], i) => {
    const ang = -0.95 + i * 0.07;
    p.group('towers', { x: x - 30, y: y - 150, w: 190, h: 190 }, (c) => {
      c.translate(x, y); c.rotate(ang + Math.PI / 2); c.scale(s, s);
      c.fillStyle = STONE; c.fillRect(-22, -46, 44, 50); c.strokeStyle = INK; c.lineWidth = 2.4; c.strokeRect(-22, -46, 44, 50);
      c.fillStyle = INK; c.fillRect(-4, -36, 8, 14);
      c.fillStyle = TILE; c.beginPath(); c.moveTo(-28, -46); c.lineTo(0, -118); c.lineTo(28, -46); c.closePath(); c.fill(); line(c);
      c.strokeStyle = TILE_D; c.lineWidth = 1.6; c.beginPath(); for (let k = 1; k < 6; k++) { const yy = -46 - k * 12, hw = 28 * (1 - k / 6); c.moveTo(-hw, yy); c.lineTo(hw, yy); } c.stroke();
      c.fillStyle = GOLD; c.beginPath(); c.arc(0, -122, 4, 0, Math.PI * 2); c.fill();
    }, { t: 7.3 + i * 0.14, d: 0.6, reveal: 'pop', ease: 'back' });
  });
}

// ================================================================ the black brush: contours, brow, eye
function ink(p, r) {
  const list = [
    { ctrl: [[244, 822], [262, 790], [330, 752], [450, 712], [580, 676], [700, 646], [780, 626]], w: 20 },
    { ctrl: [[290, 852], [380, 866], [520, 880], [700, 895], [900, 906]], w: 12 },
    { ctrl: [[318, 1000], [360, 984], [500, 966], [700, 948], [880, 932], [960, 950]], w: 12 },
    { ctrl: [[330, 1028], [420, 1064], [540, 1094], [700, 1114], [900, 1136], [1040, 1164]], w: 18 },
  ];
  brushes(p, 'ink', list, { t: 7.6, d: 1.3, color: INK, nb: 6, ng: 2, dry: 0.82, lap: 0.4 });
  brushes(p, 'ink', [
    { ctrl: [[1330, 540], [1388, 640], [1414, 760], [1424, 880], [1440, 1050], [1480, 1250], [1530, 1460], [1590, 1620], [1620, 1660]], w: 18 },
    { ctrl: [[1040, 1164], [1080, 1220], [1130, 1320], [1200, 1450], [1290, 1600], [1390, 1740]], w: 16 },
  ], { t: 8.0, d: 1.2, color: INK, nb: 6, ng: 2, dry: 0.85, lap: 0.3 });
  // the jaw's hinge and the cheek
  brushes(p, 'ink', [
    { ctrl: [[960, 950], [1010, 905], [1020, 830], [985, 770]], w: 11 },
    { ctrl: [[1070, 1006], [1120, 1000], [1240, 1020], [1350, 1000], [1404, 970]], w: 10 },
  ], { t: 8.3, d: 0.7, color: INK, nb: 5, ng: 1, dry: 0.8, lap: 0.3 });
  // the brow, angry and heavy
  brush(p, 'ink', [[784, 600], [820, 566], [880, 550], [950, 548], [990, 530]], { t: 8.6, d: 0.45, w: 30, color: INK, nb: 8, ng: 2, dry: 0.75, out: 0.5 });
  // the eye: the clock face, its hours, a red iris and a slit
  const [ex, ey, er] = EYE;
  const ticks = [];
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ticks.push([[ex + Math.cos(a) * er * 0.72, ey + Math.sin(a) * er * 0.72], [ex + Math.cos(a) * er * (k % 3 ? 0.84 : 0.9), ey + Math.sin(a) * er * (k % 3 ? 0.84 : 0.9)]]); }
  p.group('ink', { x: ex - er - 12, y: ey - er - 12, w: 2 * er + 24, h: 2 * er + 24 }, (c) => {
    c.fillStyle = WHITE; c.beginPath(); c.arc(ex, ey, er, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 7; c.stroke();
    c.strokeStyle = GOLD; c.lineWidth = 3; c.beginPath(); c.arc(ex, ey, er - 6, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); for (const t of ticks) path(c, t); c.stroke();
    c.fillStyle = RED; c.beginPath(); c.arc(ex - 4, ey, er * 0.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; c.beginPath(); c.ellipse(ex - 4, ey, 5.5, er * 0.44, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = WHITE; c.beginPath(); c.arc(ex - 12, ey - 9, 4.5, 0, Math.PI * 2); c.fill();
  }, { t: 8.8, d: 0.6, reveal: 'iris', ease: 'out' });
  // the nostril: a round window in the snout
  p.group('ink', { x: 280, y: 790, w: 50, h: 40 }, (c) => {
    c.fillStyle = INK; c.beginPath(); c.ellipse(302, 808, 13, 9, -0.4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = STONE_L; c.lineWidth = 2; c.stroke();
  }, { t: 9.0, d: 0.3, reveal: 'pop' });
}

// ================================================================ the teeth: fangs above, battlements below
function teeth(p, r) {
  const up = [], down = [];
  for (let x = 330; x < 880; x += 44) {
    const y = snoutFoot(x) - 2, L = x < 420 ? 66 : r.range(28, 44);
    up.push([[x - 11, y], [x + 11, y + 1], [x + r.range(-3, 3), y + L]]);
  }
  for (let x = 350; x < 860; x += 40) {
    const y = lerp(1000, 932, (x - 318) / (880 - 318)) + 3;
    down.push([[x - 11, y], [x - 11, y - 30], [x + 11, y - 32], [x + 11, y]]);
  }
  const draw = (set) => (c) => {
    c.fillStyle = WHITE; c.strokeStyle = INK; c.lineWidth = 3; c.lineJoin = 'round';
    for (const t of set) { poly(c, t); c.fill(); c.stroke(); }
  };
  p.group('teeth', boxOf(down.flat(), 6), draw(down), { t: 9.1, d: 0.6, reveal: 'wipeL', ease: 'out' });
  p.group('teeth', boxOf(up.flat(), 6), draw(up), { t: 9.3, d: 0.6, reveal: 'wipeL', ease: 'out' });
}

// ================================================================ the fire, poured out of the mouth across the sheet
function flame(p, r) {
  const tongues = (n, w0, spread, reach, color, gap) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const k = n === 1 ? 0.5 : i / (n - 1);
      const y0 = lerp(905, 955, r()), x0 = r.range(440, 640);
      const ty = lerp(930 - spread, 930 + spread * 0.7, k) + r.range(-20, 20), tx = reach + r.range(-30, 30);
      const curl = r.range(-60, -10) * (k < 0.5 ? 1.4 : 0.8);
      out.push({ ctrl: [[x0, y0], [lerp(x0, tx, 0.35), lerp(y0, ty, 0.25) + 6], [lerp(x0, tx, 0.7), lerp(y0, ty, 0.7) + curl * 0.3], [tx, ty + curl]], w: w0 * r.range(0.8, 1.15), color, gap });
    }
    return out;
  };
  brushes(p, 'flame', tongues(9, 170, 430, -40, RED, MOUTH), { t: 9.4, d: 1.0, nb: 12, ng: 2, dry: 0.7, lap: 0.85, out: 0.45 });
  brushes(p, 'flame', tongues(7, 110, 300, 40, ORANGE, RED), { t: 9.8, d: 0.9, nb: 10, ng: 2, dry: 0.72, lap: 0.85, out: 0.45 });
  brushes(p, 'flame', tongues(5, 60, 190, 120, YELLOW, ORANGE), { t: 10.1, d: 0.8, nb: 8, ng: 1, dry: 0.7, lap: 0.8, out: 0.5 });
  brushes(p, 'flame', tongues(3, 22, 100, 200, WHITE, null), { t: 10.4, d: 0.6, nb: 5, ng: 0, dry: 0.7, lap: 0.8, out: 0.6 });
  // sparks thrown off the fire
  const sparks = [];
  for (let i = 0; i < 40; i++) {
    const a = r.range(Math.PI * 0.75, Math.PI * 1.3), d = r.range(320, 660);
    sparks.push([640 + Math.cos(a) * d, 930 + Math.sin(a) * d * 0.9, r.range(3, 9), r() < 0.5 ? ORANGE : YELLOW]);
  }
  p.group('flame', boxOf(sparks.map((s) => [s[0], s[1]]), 12), (c) => {
    for (const [x, y, s, col] of sparks) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, s, s * 0.6, -0.5, 0, Math.PI * 2); c.fill(); }
  }, { t: 10.6, d: 0.6, reveal: 'pop' });
}

// ================================================================ what moves
function live(p, r) {
  // pigeons wheeling over the empty sky
  const birds = [];
  for (let i = 0; i < 7; i++) birds.push({ x: r.range(160, 760), y: r.range(160, 470), s: r.range(0.8, 1.4), ph: r() * 6.28, sp: r.range(5, 11), rr: r.range(20, 50) });
  p.live('live', {
    t: 11.4, d: 1.2, box: { x: 0, y: 0, w: W, h: 600 },
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath();
      for (const b of birds) {
        const tt = time * 0.25 + b.ph;
        const x = ((b.x + 100 + time * b.sp) % (W + 200)) - 100 + Math.cos(tt) * b.rr, y = b.y + Math.sin(tt * 1.3) * b.rr * 0.5;
        const f = Math.sin(time * 7 + b.ph) * 7 * b.s, w = 15 * b.s;
        c.moveTo(x - w, y - f); c.quadraticCurveTo(x - w * 0.4, y - 4 * b.s, x, y); c.quadraticCurveTo(x + w * 0.4, y - 4 * b.s, x + w, y - f);
      }
      c.lineWidth = 4.5; c.stroke();
    },
  });
  // smoke curling up from the nostril
  p.live('live', {
    t: 11.8, d: 1, box: { x: 180, y: 560, w: 200, h: 260 },
    draw: (c, time) => {
      for (let k = 0; k < 4; k++) {
        const u = ((time * 0.35 + k / 4) % 1);
        const x = 296 - u * 40 + Math.sin(u * 6 + k) * 14, y = 800 - u * 210, s = 8 + u * 26;
        c.fillStyle = `rgba(245,238,220,${(0.55 * (1 - u)).toFixed(3)})`;
        c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
      }
    },
  });
  // the fire's tips licking
  const tips = [];
  for (let i = 0; i < 5; i++) tips.push({ x: r.range(90, 260), y: lerp(640, 1150, i / 4) + r.range(-30, 30), s: r.range(0.7, 1.2), ph: r() * 6.28, col: i % 2 ? ORANGE : RED });
  p.live('live', {
    t: 11.0, d: 0.8, box: { x: 0, y: 520, w: 400, h: 760 },
    draw: (c, time) => {
      for (const f of tips) {
        const a = Math.sin(time * 5 + f.ph), b = Math.sin(time * 3.3 + f.ph * 2);
        const x = f.x, y = f.y, s = f.s;
        c.fillStyle = f.col;
        c.beginPath(); c.moveTo(x + 40 * s, y - 16 * s);
        c.quadraticCurveTo(x - 10 * s, y - 30 * s + a * 10, x - (60 + 14 * b) * s, y - (40 + a * 16) * s);
        c.quadraticCurveTo(x - 20 * s, y - 4 * s, x + 40 * s, y + 14 * s); c.closePath(); c.fill();
      }
    },
  });
  // the eye blinks now and then: a lid of copper
  const [ex, ey, er] = EYE;
  p.live('live', {
    t: 12.0, d: 0.4, reveal: 'none', box: { x: ex - er - 6, y: ey - er - 6, w: 2 * er + 12, h: 2 * er + 12 },
    draw: (c, time) => {
      const u = (time - 12.6) % 4.3;
      if (u < 0 || u > 0.26) return;
      const k = Math.sin((u / 0.26) * Math.PI);
      c.fillStyle = COPPER_D;
      c.beginPath(); c.arc(ex, ey, er + 3, Math.PI, 0); c.lineTo(ex + er + 3, ey - er - 3 + k * (2 * er + 6)); c.lineTo(ex - er - 3, ey - er - 3 + k * (2 * er + 6)); c.closePath();
      c.save(); c.beginPath(); c.arc(ex, ey, er + 3, 0, Math.PI * 2); c.clip();
      c.fillRect(ex - er - 4, ey - er - 4, 2 * er + 8, k * (2 * er + 8));
      c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(ex - er - 4, ey - er - 4 + k * (2 * er + 8)); c.lineTo(ex + er + 4, ey - er - 4 + k * (2 * er + 8)); c.stroke();
      c.restore();
    },
  });
}

// ================================================================ the name, lettered by hand
function title(p, r) {
  const size = 260, x0 = 100, y0 = 1850, tilt = -0.05;
  const ctx = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  const f = `400 ${size}px ${FACE}`;
  ctx.font = f;
  const word = 'Kraków';
  let x = x0;
  // the river first: a few strokes of blue under the hill
  brushes(p, 'title', [
    { ctrl: [[980, 1720], [1180, 1708], [1400, 1726], [1640, 1712]], w: 34, color: RIVER },
    { ctrl: [[1080, 1770], [1250, 1758], [1460, 1772], [1640, 1764]], w: 26, color: '#3c6a98' },
    { ctrl: [[1180, 1812], [1380, 1806], [1640, 1814]], w: 18, color: RIVER },
  ], { t: 10.4, d: 0.9, nb: 7, ng: 1, dry: 0.75, lap: 0.5, gap: GROUND_L });
  for (let i = 0; i < word.length; i++) {
    const ch = word[i], w = ctx.measureText(word.slice(0, i + 1)).width - ctx.measureText(word.slice(0, i)).width;
    const gx = x, gy = y0 + (gx - x0) * tilt + (i % 2 ? -6 : 4), rot = (i % 2 ? 0.04 : -0.03) + (i === 0 ? -0.05 : 0);
    p.mark('title', {
      t: 11.0 + i * 0.2, d: 0.45, reveal: 'wipe', ease: 'soft', box: { x: gx - 30, y: gy - size * 1.05, w: w + 60, h: size * 1.35 },
      draw: (c) => {
        c.save(); c.translate(gx, gy); c.rotate(rot);
        c.font = f; c.textBaseline = 'alphabetic';
        c.fillStyle = i === 4 ? RED : INK; c.fillText(ch, 0, 0);
        c.restore();
      },
    });
    x += w * 0.96;
  }
  // a red stroke under it
  brush(p, 'title', [[x0 + 10, y0 + 40], [x0 + 300, y0 + 22], [x0 + 620, y0 + 8], [x - 40, y0 - 30]], { t: 12.3, d: 0.5, w: 22, color: RED, nb: 8, ng: 1, dry: 0.7, out: 0.4 });
  // the small line in the corner
  p.mark('title', {
    t: 12.7, d: 0.6, reveal: 'wipe', ease: 'soft', box: { x: 90, y: 90, w: 700, h: 150 },
    draw: (c) => {
      c.save(); c.translate(110, 170); c.rotate(-0.04);
      c.font = `400 50px ${FACE}`; c.fillStyle = RED; c.fillText('smok wawelski', 0, 0);
      c.font = `400 30px ${FACE}`; c.fillStyle = INK; c.fillText('WAWEL', 4, 44);
      c.restore();
    },
  });
}
