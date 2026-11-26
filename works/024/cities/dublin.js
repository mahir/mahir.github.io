// Dublin: a page of an illuminated manuscript. A border of knotwork panels with
// spiral roundels at the corners, and a great initial D whose bowl and stem are
// filled with interlace; inside the D, the Ha'penny Bridge over the Liffey on a
// ground of gold leaf, the quay houses, the Custom House dome and the Spire.
// Below, an arcade like a gospel book's canon tables, and in each arch a
// Georgian door. The rest of the name follows the initial, smaller, as the
// scribes did it, under a rubric in red: Baile Átha Cliath.

import { Plate, W, H } from '../print.js';
import { mix, shade, poly, rng, gull } from '../kit.js';

// the scribe's colors: vellum, oak-gall ink, orpiment, red lead, lapis, verdigris, folium
const VEL = '#efe0bd', VEL_D = '#d9c49a', INK = '#2a1c14', INK_L = '#5a4030';
const GOLD = '#d4a63c', GOLD_L = '#f0cd6c', GOLD_D = '#a87c22';
const ORP = '#e9c24e', RED = '#b3302a', RED_D = '#7f1f1c', LAP = '#21408f', LAP_D = '#162c66', LAP_L = '#4f6fc0';
const VER = '#2f6e57', VER_D = '#1f4d3c', FOL = '#5e2f5c', WHITE = '#f6efdc';

export const city = {
  id: 'dublin', name: 'Dublin', wall: '#1e2d27',
  alt: "An illuminated manuscript page: a great initial D filled with knotwork, and inside it the Ha'penny Bridge over the Liffey with walkers and gulls, the quay houses, the Custom House dome and the Spire against gold leaf; below, an arcade of five Georgian doors with fanlights, all in a border of interlace panels and spiral roundels, under the rubric Baile Átha Cliath",
  google: 'family=Uncial+Antiqua',
  fonts: [['400 190px "Uncial Antiqua"', 'ublinBaileÁthaCliath'], ['400 30px "Uncial Antiqua"', "iv.theLiffeyHa'pennyBridgeCustomHouseSpireGeorgiandoors1246802"]],
  build,
};

const FACE = '"Uncial Antiqua", serif';

// the page: the border band, and inside it the text block
const B0 = 66, B1 = 156; // the band runs from B0 to B1 in from every edge
// the initial D: a stem and a bowl around a half-oval counter
const SX0 = 196, SX = 330, DCY = 690, ORX = 662, ORY = 482, IRX = 534, IRY = 360;
// the arcade below
const AY = 1392, AR = 122, AB = 1772; // the arches' centers, radius, and where the doors stand

function counterPath(c) {
  c.beginPath();
  c.moveTo(SX, DCY - IRY);
  c.ellipse(SX, DCY, IRX, IRY, 0, -Math.PI / 2, Math.PI / 2);
  c.closePath();
}
function letterPath(c) {
  c.beginPath();
  c.moveTo(SX0, DCY - ORY); c.lineTo(SX, DCY - ORY);
  c.ellipse(SX, DCY, ORX, ORY, 0, -Math.PI / 2, Math.PI / 2);
  c.lineTo(SX0, DCY + ORY); c.closePath();
}

function build() {
  const p = new Plate({ paper: VEL, seed: 1759 });
  const r = p.r;
  p.stack('gild', 'rule', 'sky', 'town', 'bridge', 'birds', 'letter', 'knots', 'arcade', 'arch', 'dots', 'text');
  ruling(p, r);
  border(p, r);
  sky(p, r);
  town(p, r);
  bridge(p, r);
  letter(p, r);
  arcade(p, r);
  dots(p, r);
  life(p, r);
  words(p, r);
  return p;
}

// ================================================================ interlace
// A plait of n strands in a band, in band coordinates (u along, v across, 0 to
// wd), mapped onto the sheet by M. At every crossing the strand that should be
// on top is drawn again over the other, so they weave over, under, over.
function plait(M, len, wd, o) {
  const n = o.n || 4, sw = o.sw || 9, P = o.period || wd * 1.45, ol = o.ol ?? 2;
  const A = wd / 2 - sw / 2 - (o.margin ?? 4);
  const vAt = (k, u) => wd / 2 + A * (2 / Math.PI) * Math.asin(0.94 * Math.sin((2 * Math.PI * u) / P + (2 * Math.PI * k) / n));
  const step = Math.max(1, len / 900);
  const strands = [];
  for (let k = 0; k < n; k++) {
    const pts = [];
    for (let u = -P / 2; u <= len + P / 2; u += step) pts.push(M(u, vAt(k, u)));
    strands.push(pts);
  }
  // the crossings, and which strand goes over at each
  const s = P / (2 * n), ink = [], col = [];
  const cI = (sw / 2 + ol + 1.5) / 1.15, cC = cI + ol * 1.6;
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      let prev = vAt(a, -P / 2) - vAt(b, -P / 2);
      for (let u = -P / 2 + 0.5; u <= len + P / 2; u += 0.5) {
        const d = vAt(a, u) - vAt(b, u);
        if (prev !== 0 && Math.sign(d) !== Math.sign(prev)) {
          const uc = u - 0.5 * (d / (d - prev));
          const ci = ((Math.round(uc / s) % 2) + 2) % 2;
          const upA = vAt(a, uc + 0.3) > vAt(a, uc - 0.3);
          const k = upA !== (ci === 1) ? a : b;
          const piece = (c0) => { const pts = []; for (let w = uc - c0; w <= uc + c0 + 0.01; w += Math.max(0.5, c0 / 6)) pts.push(M(w, vAt(k, w))); return pts; };
          ink.push(piece(cI)); col.push(piece(cC));
        }
        prev = d;
      }
    }
  }
  return { strands, ink, col, sw, ol };
}
function drawPlait(c, pl, color, inkc = INK) {
  const line = (pts) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); };
  c.lineJoin = 'round';
  for (const s of pl.strands) {
    c.lineCap = 'round';
    c.beginPath(); line(s); c.strokeStyle = inkc; c.lineWidth = pl.sw + 2 * pl.ol; c.stroke();
    c.beginPath(); line(s); c.strokeStyle = color; c.lineWidth = pl.sw; c.stroke();
  }
  c.lineCap = 'butt';
  c.beginPath(); for (const s of pl.ink) line(s); c.strokeStyle = inkc; c.lineWidth = pl.sw + 2 * pl.ol; c.stroke();
  c.beginPath(); for (const s of pl.col) line(s); c.strokeStyle = color; c.lineWidth = pl.sw; c.stroke();
  // a fine highlight down the middle of every strand
  c.lineCap = 'round';
  c.beginPath(); for (const s of pl.strands) line(s); c.strokeStyle = 'rgba(255,250,225,.0)'; c.stroke();
}
// a straight band from (x, y) along (ax, ay), its width toward the left-hand normal
function straight(x, y, ax, ay) { return (u, v) => [x + ax * u - ay * v, y + ay * u + ax * v]; }

// a triple spiral in a roundel
function triskele(c, x, y, R, ground, line = INK) {
  c.fillStyle = GOLD_D; c.beginPath(); c.arc(x + 1.5, y + 2, R + 5, 0, Math.PI * 2); c.fill();
  c.fillStyle = GOLD; c.beginPath(); c.arc(x, y, R + 4, 0, Math.PI * 2); c.fill();
  c.fillStyle = ground; c.beginPath(); c.arc(x, y, R - 3, 0, Math.PI * 2); c.fill();
  c.strokeStyle = line; c.lineWidth = Math.max(1.4, R * 0.05);
  c.beginPath(); c.arc(x, y, R + 4, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(x, y, R - 3, 0, Math.PI * 2); c.stroke();
  const turns = 1.7, r0 = R * 0.38;
  c.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 3, cx = x + Math.cos(a) * R * 0.42, cy = y + Math.sin(a) * R * 0.42;
    // the spiral, wound out from its eye, its tail swept toward the middle
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60, th = a + Math.PI + t * turns * 2 * Math.PI, rr = r0 * t;
      pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]);
    }
    const [ex, ey] = pts[pts.length - 1];
    c.strokeStyle = ORP; c.lineWidth = R * 0.11;
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts) c.lineTo(q[0], q[1]);
    c.quadraticCurveTo(x + Math.cos(a + 1.2) * R * 0.2, y + Math.sin(a + 1.2) * R * 0.2, x, y);
    c.stroke();
    c.strokeStyle = line; c.lineWidth = Math.max(1, R * 0.035);
    c.stroke();
    c.fillStyle = RED; c.beginPath(); c.arc(cx, cy, R * 0.06, 0, Math.PI * 2); c.fill();
    void ex; void ey;
  }
  c.fillStyle = GOLD_L; c.beginPath(); c.arc(x, y, R * 0.09, 0, Math.PI * 2); c.fill();
  c.strokeStyle = line; c.lineWidth = 1.2; c.stroke();
}

// ================================================================ the page
function ruling(p, r) {
  // prickings down the margins and the drypoint lines ruled between them, faint
  const lines = [];
  for (let y = 236; y < 1160; y += 46) lines.push([[1010, y], [1420, y]]);
  p.strokes('rule', lines, 'rgba(120,90,60,.22)', 1, { t: 0.2, d: 1.4, reveal: 'wipe', ease: 'inOut' });
  const pricks = [];
  for (let y = 236; y < 1160; y += 46) pricks.push([[1000, y - 2], [1002, y + 2]], [[1428, y - 2], [1430, y + 2]]);
  p.strokes('rule', pricks, 'rgba(90,60,40,.45)', 1.6, { t: 0.3, d: 1.2, reveal: 'fall' });
}

function border(p, r) {
  const wd = B1 - B0;
  const grounds = [LAP, RED, VER, FOL];
  const colors = [ORP, ORP, ORP, WHITE];
  // the gold rules along both edges of the band, drawn by a pen
  const rect = (k) => [[k, k], [W - k, k], [W - k, H - k], [k, H - k], [k, k]];
  p.pen('gild', rect(B0 - 4), GOLD_D, 9, { t: 0.5, d: 1.9, cap: 'butt' });
  p.pen('gild', rect(B1 + 4), GOLD_D, 9, { t: 0.7, d: 1.9, cap: 'butt' });
  // the panels: three along the top and the foot, four down each side
  const panels = [];
  const side = (x0, y0, ax, ay, L, np, gap) => {
    const pl = (L - gap * (np - 1)) / np;
    for (let i = 0; i < np; i++) panels.push([x0 + ax * i * (pl + gap), y0 + ay * i * (pl + gap), ax, ay, pl]);
  };
  side(B1, B0, 1, 0, W - 2 * B1, 3, 44);
  side(W - B0, B1, 0, 1, H - 2 * B1, 4, 44);
  side(W - B1, H - B0, -1, 0, W - 2 * B1, 3, 44);
  side(B0, H - B1, 0, -1, H - 2 * B1, 4, 44);
  panels.forEach(([x, y, ax, ay, L], i) => {
    const M = straight(x, y, ax, ay);
    const pl = plait(M, L, wd, { n: 4, sw: 9, period: 118 });
    const quad = [M(0, 0), M(L, 0), M(L, wd), M(0, wd)];
    const gr = grounds[i % 4], st = colors[i % 4];
    const xs = quad.map((q) => q[0]), ys = quad.map((q) => q[1]);
    const box = { x: Math.min(...xs) - 4, y: Math.min(...ys) - 4, w: Math.max(...xs) - Math.min(...xs) + 8, h: Math.max(...ys) - Math.min(...ys) + 8 };
    p.group('rule', box, (c) => {
      c.save(); poly(c, quad); c.fillStyle = gr; c.fill(); c.clip();
      // the ground is dotted, as the scribes filled the gaps
      drawPlait(c, pl, st);
      c.restore();
      poly(c, quad); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
    }, { t: 1.0 + i * 0.16, d: 0.9, reveal: ax > 0 ? 'wipe' : ax < 0 ? 'wipeL' : ay > 0 ? 'fall' : 'rise', ease: 'inOut' });
  });
  // the spacers between panels: gold squares with a red lozenge
  const spacers = [];
  const sp = (x0, y0, ax, ay, L, np, gap) => {
    const pl = (L - gap * (np - 1)) / np;
    for (let i = 1; i < np; i++) { const u = i * (pl + gap) - gap / 2; spacers.push([x0 + ax * u - ay * wd / 2, y0 + ay * u + ax * wd / 2]); }
  };
  sp(B1, B0, 1, 0, W - 2 * B1, 3, 44); sp(W - B0, B1, 0, 1, H - 2 * B1, 4, 44); sp(W - B1, H - B0, -1, 0, W - 2 * B1, 3, 44); sp(B0, H - B1, 0, -1, H - 2 * B1, 4, 44);
  p.group('rule', { x: 0, y: 0, w: W, h: H }, (c) => {
    for (const [x, y] of spacers) {
      const ax = Math.abs(x - B0 - wd / 2) < 2 || Math.abs(x - (W - B0 - wd / 2)) < 2;
      const w = ax ? wd : 44, h = ax ? 44 : wd;
      c.fillStyle = GOLD; c.fillRect(x - w / 2, y - h / 2, w, h);
      c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x - w / 2, y - h / 2, w, h);
      c.fillStyle = RED; poly(c, [[x, y - 20], [x + 14, y], [x, y + 20], [x - 14, y]]); c.fill(); c.stroke();
      c.fillStyle = GOLD_L; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); c.stroke();
    }
  }, { t: 3.4, d: 0.6, reveal: 'fade' });
  // the corners: spiral roundels on squares of gold
  [[B0 + wd / 2, B0 + wd / 2], [W - B0 - wd / 2, B0 + wd / 2], [W - B0 - wd / 2, H - B0 - wd / 2], [B0 + wd / 2, H - B0 - wd / 2]].forEach(([x, y], i) => {
    p.group('rule', { x: x - 64, y: y - 64, w: 128, h: 128 }, (c) => {
      c.fillStyle = LAP_D; c.fillRect(x - wd / 2 - 6, y - wd / 2 - 6, wd + 12, wd + 12);
      c.strokeStyle = INK; c.lineWidth = 2.4; c.strokeRect(x - wd / 2 - 6, y - wd / 2 - 6, wd + 12, wd + 12);
      triskele(c, x, y, 46, [RED, VER, FOL, LAP][i]);
    }, { t: 3.0 + i * 0.12, d: 0.7, reveal: 'pop', ease: 'back' });
  });
}

// ================================================================ the miniature in the D
function sky(p, r) {
  // gold leaf, tooled in a diaper of lozenges with a dot in each
  p.group('sky', { x: SX - 10, y: DCY - IRY - 10, w: IRX + 20, h: 2 * IRY + 20 }, (c) => {
    c.save(); counterPath(c); c.clip();
    const g = c.createLinearGradient(SX, DCY - IRY, SX + IRX, DCY + 200);
    g.addColorStop(0, GOLD_L); g.addColorStop(0.45, GOLD); g.addColorStop(1, GOLD_D);
    c.fillStyle = g; c.fillRect(SX, DCY - IRY, IRX, 2 * IRY);
    c.strokeStyle = 'rgba(140,96,24,.55)'; c.lineWidth = 1.3; c.beginPath();
    for (let k = -900; k < 900; k += 34) { c.moveTo(SX + k, DCY - IRY); c.lineTo(SX + k + 720, DCY + IRY); c.moveTo(SX + k, DCY + IRY); c.lineTo(SX + k + 720, DCY - IRY); }
    c.stroke();
    c.fillStyle = 'rgba(255,240,180,.7)'; c.beginPath();
    for (let i = -30; i < 40; i++) for (let j = -20; j < 30; j++) {
      const x = SX + i * 34 + 17, y = DCY - IRY + j * 34 * 1 + (i % 2 ? 0 : 0);
      c.moveTo(x + 2, y); c.arc(x, y, 2, 0, Math.PI * 2);
    }
    c.fill();
    c.restore();
  }, { t: 2.6, d: 1.2, reveal: 'iris', ease: 'inOut' });
  // two curling clouds, as a scribe draws them
  for (const [x, y, s, t] of [[520, 470, 1, 3.4], [760, 560, 0.7, 3.7]]) {
    p.group('sky', { x: x - 110 * s, y: y - 60 * s, w: 220 * s, h: 90 * s }, (c) => {
      c.save(); counterPath(c); c.clip();
      const bumps = [[-70, 0, 26], [-38, -18, 32], [0, -26, 36], [40, -16, 30], [72, 0, 24]];
      c.fillStyle = WHITE; c.strokeStyle = INK; c.lineWidth = 2;
      c.beginPath(); for (const [bx, by, br] of bumps) { c.moveTo(x + bx * s + br * s, y + by * s); c.arc(x + bx * s, y + by * s, br * s, 0, Math.PI * 2); }
      c.rect(x - 96 * s, y - 2 * s, 192 * s, 22 * s);
      c.stroke(); c.fill();
      // curls along the foot
      c.lineWidth = 1.3; c.strokeStyle = INK_L;
      for (const [bx, by, br] of bumps) { c.beginPath(); c.arc(x + bx * s + br * 0.2 * s, y + by * s + br * 0.2 * s, br * 0.55 * s, Math.PI * 1.05, Math.PI * 1.7); c.stroke(); }
      c.fillStyle = WHITE; c.fillRect(x - 94 * s, y + 1, 188 * s, 17 * s);
      c.restore();
    }, { t, d: 0.8, reveal: 'pop' });
  }
}

const QUAY = 884; // the top of the quay wall, where the houses stand
function town(p, r) {
  // the Spire: a steel needle over the roofs
  p.group('town', { x: 560, y: 330, w: 40, h: 560 }, (c) => {
    c.save(); counterPath(c); c.clip();
    c.fillStyle = '#c9ccc8'; poly(c, [[580, 340], [571, 860], [589, 860]]); c.fill();
    c.fillStyle = '#9ea3a2'; poly(c, [[580, 340], [580, 860], [589, 860]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; poly(c, [[580, 340], [571, 860], [589, 860]]); c.stroke();
    c.fillStyle = WHITE; c.fillRect(579, 344, 2, 60);
    c.restore();
  }, { t: 4.0, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the Custom House: its copper dome on a drum of columns, a figure on top
  p.group('town', { x: 620, y: 560, w: 250, h: 330 }, (c) => {
    c.save(); counterPath(c); c.clip();
    const x = 740;
    // the long front, its pediment and balustrade
    c.fillStyle = '#e3d6b6'; c.fillRect(620, 760, 260, 130);
    c.fillStyle = '#cbbb95'; c.fillRect(620, 752, 260, 10);
    c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(620, 752, 260, 140);
    c.fillStyle = '#e3d6b6'; poly(c, [[x - 60, 760], [x, 728], [x + 60, 760]]); c.fill(); c.stroke();
    // the drum with its columns, the dome, the lantern and the statue
    c.fillStyle = '#e8dcbc'; c.fillRect(x - 34, 672, 68, 60); c.strokeRect(x - 34, 672, 68, 60);
    c.fillStyle = INK_L; for (let k = -3; k <= 3; k++) c.fillRect(x + k * 9.5 - 1.5, 678, 3, 50);
    c.fillStyle = '#e8dcbc'; c.fillRect(x - 40, 664, 80, 10); c.strokeRect(x - 40, 664, 80, 10);
    c.fillStyle = '#5f9c86'; c.beginPath(); c.ellipse(x, 664, 34, 40, 0, Math.PI, 0); c.fill(); c.stroke();
    c.strokeStyle = '#3f7262'; c.lineWidth = 1.2; for (let k = -2; k <= 2; k++) { c.beginPath(); c.ellipse(x, 664, Math.abs(k) * 12, 40, 0, Math.PI, 0); c.stroke(); }
    c.fillStyle = '#5f9c86'; c.fillRect(x - 6, 612, 12, 14); c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(x - 6, 612, 12, 14);
    c.fillStyle = INK_L; c.fillRect(x - 2.5, 592, 5, 20); c.beginPath(); c.arc(x, 589, 4, 0, Math.PI * 2); c.fill();
    c.restore();
  }, { t: 4.4, d: 1.0, reveal: 'rise' });
  // the quay houses: tall and narrow, each a color, rows of white sashes
  const hues = ['#a04a33', '#c7a24a', '#3e6191', '#b65d3d', '#e4d3a6', '#4c7b58', '#c57779', '#8d3b2d', '#d8b257', '#56709a'];
  let x = SX - 6;
  const houses = [];
  while (x < SX + IRX) {
    const w = r.range(40, 56), h = r.range(118, 176);
    houses.push({ x, w, h, col: hues[houses.length % hues.length], rows: Math.floor((h - 40) / 30), cols: w > 48 ? 3 : 2, chim: r.chance(0.7) ? r.range(0.2, 0.8) : -1, shop: r.pick([RED, VER, LAP_D, INK, FOL]) });
    x += w;
  }
  houses.forEach((hh, i) => {
    const { x, w, h } = hh, top = QUAY - h;
    p.group('town', { x: x - 4, y: top - 30, w: w + 8, h: h + 34 }, (c) => {
      c.save(); counterPath(c); c.clip();
      c.fillStyle = hh.col; c.fillRect(x, top, w, h);
      // parapet and chimney stack with its pots
      c.fillStyle = shade(hh.col, 0.8); c.fillRect(x, top, w, 6);
      if (hh.chim > 0) {
        const cx = x + w * hh.chim;
        c.fillStyle = shade(hh.col, 0.85); c.fillRect(cx - 8, top - 20, 16, 20);
        c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(cx - 8, top - 20, 16, 20);
        c.fillStyle = '#b4583a'; c.fillRect(cx - 6, top - 27, 4, 7); c.fillRect(cx + 2, top - 27, 4, 7);
      }
      // the sashes
      const cw = (w - 10) / hh.cols;
      for (let rr = 0; rr < hh.rows; rr++) {
        const y = top + 16 + rr * 30;
        for (let k = 0; k < hh.cols; k++) {
          const wx = x + 5 + k * cw + cw * 0.2, ww = cw * 0.6;
          c.fillStyle = WHITE; c.fillRect(wx - 1.5, y - 1.5, ww + 3, 21);
          c.fillStyle = '#2c3346'; c.fillRect(wx, y, ww, 18);
          c.fillStyle = WHITE; c.fillRect(wx, y + 8, ww, 1.5); c.fillRect(wx + ww / 2 - 0.75, y, 1.5, 18);
        }
      }
      // the shop at the foot: a fascia and a window
      c.fillStyle = hh.shop; c.fillRect(x, QUAY - 32, w, 32);
      c.fillStyle = GOLD; c.fillRect(x + 3, QUAY - 30, w - 6, 6);
      c.fillStyle = 'rgba(255,240,200,.55)'; c.fillRect(x + 5, QUAY - 20, w - 18, 18);
      c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(x, top, w, h);
      c.restore();
    }, { t: 4.9 + i * 0.13, d: 0.7, reveal: 'rise', ease: 'out' });
  });
}

function bridge(p, r) {
  // the quay wall and the river
  p.group('bridge', { x: SX - 4, y: QUAY - 4, w: IRX + 8, h: DCY + IRY - QUAY + 8 }, (c) => {
    c.save(); counterPath(c); c.clip();
    c.fillStyle = '#9b958a'; c.fillRect(SX, QUAY, IRX, 24);
    c.strokeStyle = INK_L; c.lineWidth = 1; c.beginPath();
    for (let x = SX; x < SX + IRX; x += 22) { c.moveTo(x, QUAY + 12); c.lineTo(x, QUAY + 24); c.moveTo(x + 11, QUAY); c.lineTo(x + 11, QUAY + 12); }
    c.moveTo(SX, QUAY + 12); c.lineTo(SX + IRX, QUAY + 12); c.stroke();
    c.fillStyle = LAP; c.fillRect(SX, QUAY + 24, IRX, 300);
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(SX, QUAY); c.lineTo(SX + IRX, QUAY); c.moveTo(SX, QUAY + 24); c.lineTo(SX + IRX, QUAY + 24); c.stroke();
    c.restore();
  }, { t: 5.9, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // the water: rows of scallops, white on lapis, as manuscripts draw it
  const rows = [];
  const rr = rng(31);
  for (let y = QUAY + 44, k = 0; y < DCY + IRY; y += 15, k++) {
    const row = [];
    for (let x = SX + (k % 2) * 13 + rr.range(-3, 3); x < SX + IRX; x += 26) row.push([x, y]);
    rows.push(row);
  }
  p.group('bridge', { x: SX - 4, y: QUAY + 20, w: IRX + 8, h: DCY + IRY - QUAY }, (c) => {
    c.save(); counterPath(c); c.clip();
    c.strokeStyle = LAP_L; c.lineWidth = 2; c.beginPath();
    rows.forEach((row, k) => { for (const [x, y] of row) { c.moveTo(x - 10, y); c.arc(x, y, 10, Math.PI, Math.PI * 2); } });
    c.stroke();
    c.strokeStyle = WHITE; c.lineWidth = 1.4; c.beginPath();
    rows.forEach((row, k) => { if (k % 2) return; for (const [x, y] of row) { c.moveTo(x - 6, y - 1); c.arc(x, y - 1, 6, Math.PI, Math.PI * 1.8); } });
    c.stroke();
    c.restore();
  }, { t: 6.3, d: 1.0, reveal: 'fall', ease: 'inOut' });

  // the Ha'penny Bridge: one shallow iron arch, white, its spandrels full of rings
  const x0 = SX - 20, x1 = 808, xm = (x0 + x1) / 2;
  const arc = (y0, rise) => (x) => y0 - rise * (1 - ((x - xm) / ((x1 - x0) / 2)) ** 2);
  const under = arc(QUAY + 50, 62), deck = arc(QUAY + 8, 58), rail = arc(QUAY - 26, 58);
  const span = (f, a = x0, b = x1) => { const pts = []; for (let x = a; x <= b; x += 6) pts.push([x, f(x)]); return pts; };
  // the ribs, drawn by the pen
  p.pen('bridge', span(under), INK, 11, { t: 7.0, d: 1.0 });
  p.pen('bridge', span(under), WHITE, 7, { t: 7.1, d: 1.0 });
  p.group('bridge', { x: x0 - 4, y: rail(xm) - 10, w: x1 - x0 + 8, h: under(x0) - rail(xm) + 20 }, (c) => {
    c.save(); counterPath(c); c.clip();
    // the spandrel: between the rib and the deck, a row of iron rings
    c.fillStyle = 'rgba(30,40,80,.0)';
    c.strokeStyle = WHITE; c.lineWidth = 2.4;
    for (let x = x0 + 10; x < x1; x += 16) {
      const top = deck(x) + 4, bot = under(x) - 4;
      if (bot - top < 6) continue;
      const rad = Math.min(7, (bot - top) / 2);
      c.beginPath(); c.arc(x, (top + bot) / 2, rad, 0, Math.PI * 2); c.stroke();
    }
    // the deck and the rib's ink edges
    c.strokeStyle = INK; c.lineWidth = 1.4;
    for (const f of [under, deck]) { c.beginPath(); span(f).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
    c.strokeStyle = WHITE; c.lineWidth = 5; c.beginPath(); span(deck).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    // the railing: a top rail and fine balusters with a looped pattern
    c.lineWidth = 3.4; c.beginPath(); span(rail).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    c.lineWidth = 1.3; c.beginPath();
    for (let x = x0 + 4; x < x1; x += 7) { c.moveTo(x, rail(x)); c.lineTo(x, deck(x)); }
    c.stroke();
    c.lineWidth = 1.2; c.beginPath();
    for (let x = x0 + 14; x < x1; x += 28) { const y = (rail(x) + deck(x)) / 2; c.moveTo(x + 9, y); c.ellipse(x, y, 9, 11, 0, 0, Math.PI * 2); }
    c.stroke();
    c.restore();
  }, { t: 7.6, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // three lamp arches over the walk, a lantern hung in each
  [xm - 140, xm, xm + 140].forEach((x, i) => {
    const y = rail(x);
    p.group('bridge', { x: x - 30, y: y - 74, w: 60, h: 80 }, (c) => {
      c.save(); counterPath(c); c.clip();
      c.strokeStyle = WHITE; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x - 20, y); c.lineTo(x - 20, y - 36); c.arc(x, y - 36, 20, Math.PI, 0); c.lineTo(x + 20, y); c.stroke();
      c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 20, y - 20); c.lineTo(x + 20, y - 20); c.arc(x, y - 36, 12, Math.PI, 0); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 22, y); c.lineTo(x - 22, y - 36); c.arc(x, y - 36, 22, Math.PI, 0); c.lineTo(x + 22, y); c.stroke();
      // the lantern on top
      c.fillStyle = INK; c.fillRect(x - 6, y - 70, 12, 14);
      c.fillStyle = '#f7d77a'; c.fillRect(x - 4, y - 68, 8, 10);
      c.fillStyle = INK; poly(c, [[x - 8, y - 70], [x, y - 78], [x + 8, y - 70]]); c.fill();
      c.restore();
    }, { t: 8.2 + i * 0.18, d: 0.6, reveal: 'drop', dy: 16 });
  });
  // walkers crossing, small and bright, in hooded cloaks
  const walkers = [];
  for (let i = 0; i < 9; i++) walkers.push([x0 + 40 + i * 50 + r.range(-12, 12), r.pick([RED, VER, LAP_D, FOL, ORP, INK_L]), r.range(0.85, 1.1)]);
  p.group('bridge', { x: x0, y: rail(xm) - 40, w: x1 - x0, h: 80 }, (c) => {
    c.save(); counterPath(c); c.clip();
    for (const [x, col, s] of walkers) {
      const y = deck(x) - 3;
      c.fillStyle = col; poly(c, [[x - 6 * s, y], [x - 3 * s, y - 22 * s], [x + 3 * s, y - 22 * s], [x + 6 * s, y]]); c.fill();
      c.fillStyle = '#e8c4a0'; c.beginPath(); c.arc(x, y - 26 * s, 4 * s, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
      poly(c, [[x - 6 * s, y], [x - 3 * s, y - 22 * s], [x + 3 * s, y - 22 * s], [x + 6 * s, y]]); c.stroke();
    }
    c.restore();
  }, { t: 8.9, d: 0.8, reveal: 'fade' });
}

// ================================================================ the initial
function letter(p, r) {
  const box = { x: SX0 - 30, y: DCY - ORY - 30, w: ORX + SX - SX0 + 60, h: 2 * ORY + 60 };
  // the ink outline, drawn by the pen: down the stem, round the bowl
  const outer = [[SX, DCY - ORY], [SX0, DCY - ORY], [SX0, DCY + ORY], [SX, DCY + ORY]];
  p.pen('letter', outer, INK, 3, { t: 1.6, d: 1.0 });
  const bowl = (rx, ry) => { const pts = []; for (let i = 0; i <= 80; i++) { const a = -Math.PI / 2 + (i / 80) * Math.PI; pts.push([SX + Math.cos(a) * rx, DCY + Math.sin(a) * ry]); } return pts; };
  p.pen('letter', bowl(ORX, ORY), INK, 3, { t: 1.9, d: 1.4 });
  p.pen('letter', bowl(IRX, IRY), INK, 3, { t: 2.2, d: 1.4 });
  // the grounds: a red stem, a bowl of lapis and folium in three compartments
  const cuts = [-Math.PI / 2, -0.55, 0.55, Math.PI / 2];
  const gr = [LAP, FOL, LAP];
  const sect = (c, a0, a1) => {
    c.beginPath();
    c.ellipse(SX, DCY, ORX, ORY, 0, a0, a1);
    c.ellipse(SX, DCY, IRX, IRY, 0, a1, a0, true);
    c.closePath();
  };
  p.group('letter', box, (c) => {
    c.fillStyle = RED; c.fillRect(SX0, DCY - ORY, SX - SX0, 2 * ORY);
    for (let k = 0; k < 3; k++) { sect(c, cuts[k], cuts[k + 1]); c.fillStyle = gr[k]; c.fill(); }
  }, { t: 3.0, d: 1.0, reveal: 'fall', ease: 'inOut' });

  // interlace in the stem and round the bowl
  const sw = SX - SX0 - 22;
  const stem = plait(straight(SX0 + 11 + sw, DCY - ORY + 70, 0, 1), 2 * ORY - 140, sw, { n: 4, sw: 11, period: 150 });
  // round the bowl: u is the arc length along the middle of the band
  const MRX = (ORX + IRX) / 2, MRY = (ORY + IRY) / 2, BW = 104;
  const tab = [];
  let L = 0;
  for (let i = 0; i <= 2000; i++) {
    const a = -Math.PI / 2 + (i / 2000) * Math.PI;
    if (i) { const pa = -Math.PI / 2 + ((i - 1) / 2000) * Math.PI; L += Math.hypot(MRX * (Math.cos(a) - Math.cos(pa)), MRY * (Math.sin(a) - Math.sin(pa))); }
    tab.push([L, a]);
  }
  const angleAt = (u) => {
    if (u <= 0) return -Math.PI / 2 + u / MRY;
    if (u >= L) return Math.PI / 2 + (u - L) / MRY;
    let lo = 0, hi = tab.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m][0] < u) lo = m; else hi = m; }
    const f = (u - tab[lo][0]) / (tab[hi][0] - tab[lo][0] || 1);
    return tab[lo][1] + f * (tab[hi][1] - tab[lo][1]);
  };
  const Mb = (u, v) => { const a = angleAt(u), k = (v - BW / 2); return [SX + Math.cos(a) * (MRX + k * 1.06), DCY + Math.sin(a) * (MRY + k)]; };
  const ring = plait(Mb, L, BW, { n: 4, sw: 11, period: 152 });
  p.group('knots', { x: SX0 - 4, y: DCY - ORY - 4, w: SX - SX0 + 8, h: 2 * ORY + 8 }, (c) => {
    c.save(); c.beginPath(); c.rect(SX0 + 8, DCY - ORY + 8, SX - SX0 - 16, 2 * ORY - 16); c.clip();
    drawPlait(c, stem, ORP);
    c.restore();
  }, { t: 3.8, d: 1.6, reveal: 'fall', ease: 'inOut' });
  p.group('knots', box, (c) => {
    c.save();
    c.beginPath(); c.ellipse(SX, DCY, ORX - 9, ORY - 9, 0, -Math.PI / 2, Math.PI / 2); c.ellipse(SX, DCY, IRX + 9, IRY + 9, 0, Math.PI / 2, -Math.PI / 2, true); c.closePath(); c.clip();
    drawPlait(c, ring, ORP);
    c.restore();
  }, { t: 4.4, d: 1.8, reveal: 'wipe', ease: 'inOut' });
  // gold rules round the letter, bars between the compartments
  p.group('knots', box, (c) => {
    c.lineJoin = 'round';
    for (const [w, col] of [[14, INK], [9, GOLD]]) {
      c.strokeStyle = col; c.lineWidth = w;
      letterPath(c); c.stroke();
      counterPath(c); c.stroke();
      c.beginPath(); c.moveTo(SX, DCY - ORY); c.lineTo(SX, DCY + ORY); c.stroke();
      for (const a of [-0.55, 0.55]) { c.beginPath(); c.moveTo(SX + Math.cos(a) * IRX, DCY + Math.sin(a) * IRY); c.lineTo(SX + Math.cos(a) * ORX, DCY + Math.sin(a) * ORY); c.stroke(); }
    }
    c.strokeStyle = GOLD_L; c.lineWidth = 2;
    letterPath(c); c.stroke();
  }, { t: 5.8, d: 0.8, reveal: 'fade' });
  // the bars carry small gold bosses
  const bosses = [];
  for (const a of [-0.55, 0.55]) bosses.push([SX + Math.cos(a) * (MRX + 2), DCY + Math.sin(a) * MRY]);
  // the terminals: spiral roundels at the stem's head and foot, and where the bowl ends
  [[SX0 + 66, DCY - ORY + 64, 56, VER, 6.2], [SX0 + 66, DCY + ORY - 64, 56, VER, 6.4], [...bosses[0], 30, RED, 6.6], [...bosses[1], 30, RED, 6.7], [SX + ORX - 60, DCY, 44, RED, 6.8]].forEach(([x, y, R, g, t]) => {
    p.group('knots', { x: x - R - 12, y: y - R - 12, w: 2 * R + 24, h: 2 * R + 24 }, (c) => triskele(c, x, y, R, g), { t, d: 0.6, reveal: 'pop', ease: 'back' });
  });
}

// ================================================================ the arcade of doors
const BAYS = 5, AX0 = 196, AX1 = W - 196, BW_ = (AX1 - AX0) / BAYS;
function bayPath(c, i, k = 0) {
  const x0 = AX0 + i * BW_ + 14 - k, x1 = AX0 + (i + 1) * BW_ - 14 + k, cx = (x0 + x1) / 2;
  c.beginPath(); c.moveTo(x0, AB + 30); c.lineTo(x0, AY); c.arc(cx, AY, (x1 - x0) / 2, Math.PI, 0); c.lineTo(x1, AB + 30); c.closePath();
}
function arcade(p, r) {
  const doors = [RED, VER, ORP, LAP, FOL];
  // a narrow plait across the page above the arcade
  const band = plait(straight(AX0, 1218, 1, 0), AX1 - AX0, 32, { n: 2, sw: 7, period: 54, margin: 3 });
  p.group('arcade', { x: AX0 - 6, y: 1212, w: AX1 - AX0 + 12, h: 44 }, (c) => {
    c.fillStyle = RED_D; c.fillRect(AX0, 1218, AX1 - AX0, 32);
    c.save(); c.beginPath(); c.rect(AX0, 1218, AX1 - AX0, 32); c.clip(); drawPlait(c, band, ORP); c.restore();
    c.strokeStyle = GOLD; c.lineWidth = 5; c.strokeRect(AX0, 1218, AX1 - AX0, 32);
    c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(AX0 - 3, 1215, AX1 - AX0 + 6, 38); c.strokeRect(AX0 + 3, 1221, AX1 - AX0 - 6, 26);
  }, { t: 6.0, d: 1.4, reveal: 'wipe', ease: 'inOut' });

  for (let i = 0; i < BAYS; i++) {
    const x0 = AX0 + i * BW_ + 14, x1 = AX0 + (i + 1) * BW_ - 14, cx = (x0 + x1) / 2, t0 = 6.6 + i * 0.3;
    const col = doors[i];
    const dw = 96, dh = 196, dy = AB - dh; // the door
    const fr = dw / 2 + 6; // the fanlight's radius
    // brick: mortar courses, the bricks in two reds
    const bricks = [];
    const rr = rng(400 + i);
    for (let y = AY - AR; y < AB; y += 9) for (let x = x0 - ((y / 9) % 2 ? 0 : 11); x < x1; x += 22) if (rr.chance(0.18)) bricks.push([x, y]);
    p.group('arcade', { x: x0 - 4, y: AY - AR - 4, w: x1 - x0 + 8, h: AB - AY + AR + 40 }, (c) => {
      c.save(); bayPath(c, i); c.clip();
      c.fillStyle = '#a3492f'; c.fillRect(x0, AY - AR, x1 - x0, AB - AY + AR + 30);
      c.fillStyle = '#8b3a25'; for (const [x, y] of bricks) c.fillRect(x + 1, y + 1, 20, 7);
      c.strokeStyle = 'rgba(232,214,180,.55)'; c.lineWidth = 1; c.beginPath();
      for (let y = AY - AR, k = 0; y < AB; y += 9, k++) { c.moveTo(x0, y); c.lineTo(x1, y); for (let x = x0 - (k % 2 ? 0 : 11); x < x1; x += 22) { c.moveTo(x, y); c.lineTo(x, y + 9); } }
      c.stroke();
      c.restore();
    }, { t: t0, d: 0.9, reveal: 'rise', ease: 'inOut' });
    // the window upstairs: a six-over-six sash
    const wy = AY - 86, ww = 70, wh = 104;
    p.group('arcade', { x: cx - ww / 2 - 12, y: wy - 10, w: ww + 24, h: wh + 30 }, (c) => {
      c.fillStyle = '#e8dcc0'; c.fillRect(cx - ww / 2 - 6, wy + wh, ww + 12, 7);
      c.fillStyle = WHITE; c.fillRect(cx - ww / 2 - 3, wy - 3, ww + 6, wh + 6);
      c.fillStyle = '#28304a'; c.fillRect(cx - ww / 2, wy, ww, wh);
      // curtains drawn back, a different stuff in every house
      c.fillStyle = [ORP, '#c9787a', WHITE, '#e2b04a', '#9fb8a0'][i];
      for (const s of [-1, 1]) poly(c, [[cx + s * ww / 2, wy], [cx + s * (ww / 2 - 16), wy], [cx + s * (ww / 2 - 6), wy + wh * 0.45], [cx + s * ww / 2, wy + wh * 0.5]]), c.fill();
      c.fillStyle = WHITE;
      for (const fx of [1 / 3, 2 / 3]) c.fillRect(cx - ww / 2 + ww * fx - 1, wy, 2, wh);
      for (const fy of [1 / 4, 1 / 2, 3 / 4]) c.fillRect(cx - ww / 2, wy + wh * fy - (fy === 0.5 ? 2 : 1), ww, fy === 0.5 ? 4 : 2);
      c.fillStyle = 'rgba(255,255,255,.18)'; poly(c, [[cx - ww / 2, wy], [cx - ww / 2 + 20, wy], [cx - ww / 2, wy + 30]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.3; c.strokeRect(cx - ww / 2 - 3, wy - 3, ww + 6, wh + 6);
      // a window box of geraniums on some
      if (i !== 1 && i !== 4) {
        c.fillStyle = VER_D; c.fillRect(cx - ww / 2 - 4, wy + wh + 2, ww + 8, 12); c.strokeRect(cx - ww / 2 - 4, wy + wh + 2, ww + 8, 12);
        c.fillStyle = '#4f7d3e'; c.beginPath(); for (let k = 0; k < 8; k++) { const x = cx - ww / 2 + 2 + k * 9.5; c.moveTo(x + 6, wy + wh + 2); c.arc(x, wy + wh + 1, 6, 0, Math.PI * 2); } c.fill();
        c.fillStyle = i === 2 ? WHITE : RED; c.beginPath(); for (let k = 0; k < 7; k++) { const x = cx - ww / 2 + 6 + k * 10, y = wy + wh - 5 - (k % 2) * 3; c.moveTo(x + 3.5, y); c.arc(x, y, 3.5, 0, Math.PI * 2); } c.fill();
      }
    }, { t: t0 + 0.5, d: 0.5, reveal: 'fade' });
    // the doorcase: stone columns, an entablature, the fanlight in a brick arch
    const fy = dy - 14;
    p.group('arcade', { x: cx - dw / 2 - 30, y: fy - fr - 20, w: dw + 60, h: AB - fy + fr + 24 }, (c) => {
      // the brick arch round the fanlight: voussoirs
      c.fillStyle = '#c56a4a'; c.beginPath(); c.arc(cx, fy, fr + 14, Math.PI, 0); c.fill();
      c.strokeStyle = 'rgba(232,214,180,.7)'; c.lineWidth = 1; c.beginPath();
      for (let k = 0; k <= 14; k++) { const a = Math.PI + (k / 14) * Math.PI; c.moveTo(cx + Math.cos(a) * fr, fy + Math.sin(a) * fr); c.lineTo(cx + Math.cos(a) * (fr + 14), fy + Math.sin(a) * (fr + 14)); }
      c.stroke();
      // the fanlight: glass behind a sunburst of glazing bars
      c.fillStyle = '#26304a'; c.beginPath(); c.arc(cx, fy, fr, Math.PI, 0); c.closePath(); c.fill();
      c.strokeStyle = WHITE; c.lineWidth = 1.6; c.beginPath();
      for (let k = 1; k < 10; k++) { const a = Math.PI + (k / 10) * Math.PI; c.moveTo(cx + Math.cos(a) * 12, fy + Math.sin(a) * 12); c.lineTo(cx + Math.cos(a) * fr, fy + Math.sin(a) * fr); }
      c.stroke();
      c.lineWidth = 2; c.beginPath(); c.arc(cx, fy, 12, Math.PI, 0); c.stroke(); c.beginPath(); c.arc(cx, fy, fr * 0.66, Math.PI, 0); c.stroke();
      c.beginPath(); for (let k = 0; k < 10; k++) { const a = Math.PI + ((k + 0.5) / 10) * Math.PI; c.moveTo(cx + Math.cos(a) * fr * 0.82 + 3, fy + Math.sin(a) * fr * 0.82); c.arc(cx + Math.cos(a) * fr * 0.82, fy + Math.sin(a) * fr * 0.82, 3, 0, Math.PI * 2); } c.stroke();
      c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.arc(cx, fy, fr + 14, Math.PI, 0); c.stroke();
      c.font = `400 17px ${FACE}`; c.textAlign = 'center'; c.fillStyle = GOLD_L; c.fillText(String([12, 14, 16, 18, 20][i]), cx, fy - 17);
      // the entablature and the columns
      c.fillStyle = '#ece2c8'; c.fillRect(cx - dw / 2 - 22, fy, dw + 44, 14);
      c.fillRect(cx - dw / 2 - 20, dy, 14, dh); c.fillRect(cx + dw / 2 + 6, dy, 14, dh);
      c.fillStyle = '#cdbf9e'; c.fillRect(cx - dw / 2 - 20, dy, 4, dh); c.fillRect(cx + dw / 2 + 6, dy, 4, dh);
      c.fillStyle = '#ece2c8'; c.fillRect(cx - dw / 2 - 23, dy, 20, 6); c.fillRect(cx + dw / 2 + 3, dy, 20, 6);
      c.strokeStyle = INK; c.lineWidth = 1.2;
      c.strokeRect(cx - dw / 2 - 22, fy, dw + 44, 14); c.strokeRect(cx - dw / 2 - 20, dy, 14, dh); c.strokeRect(cx + dw / 2 + 6, dy, 14, dh);
    }, { t: t0 + 0.7, d: 0.6, reveal: 'iris' });
    // the door: six fielded panels, a knocker, a letter plate, a knob
    p.group('arcade', { x: cx - dw / 2 - 4, y: dy - 4, w: dw + 8, h: dh + 8 }, (c) => {
      c.fillStyle = col; c.fillRect(cx - dw / 2, dy, dw, dh);
      const pw = dw / 2 - 16;
      for (let k = 0; k < 6; k++) {
        const px = cx - dw / 2 + 10 + (k % 2) * (pw + 12), ph = k < 2 ? 40 : k < 4 ? 62 : 52, py = dy + 12 + (k < 2 ? 0 : k < 4 ? 52 : 126);
        c.fillStyle = shade(col, 0.78); c.fillRect(px, py, pw, ph);
        c.fillStyle = mix(col, '#ffffff', 0.18); c.fillRect(px + 4, py + 4, pw - 8, ph - 8);
        c.fillStyle = col; c.fillRect(px + 6, py + 6, pw - 12, ph - 12);
      }
      c.fillStyle = GOLD; c.fillRect(cx - 14, dy + 112, 28, 7);
      c.strokeStyle = GOLD; c.lineWidth = 2.6; c.beginPath(); c.arc(cx, dy + 76, 8, 0, Math.PI * 2); c.stroke();
      c.fillStyle = GOLD; c.beginPath(); c.arc(cx + dw / 2 - 12, dy + 112, 4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(cx - dw / 2, dy, dw, dh);
    }, { t: t0 + 1.0, d: 0.6, reveal: 'wipe', ease: 'inOut' });
    // granite steps and the area railings
    p.group('arcade', { x: x0 - 4, y: AB - 40, w: x1 - x0 + 8, h: 76 }, (c) => {
      c.save(); bayPath(c, i); c.clip();
      for (let k = 0; k < 3; k++) {
        const sw = dw + 30 + k * 18, y = AB + k * 9;
        c.fillStyle = k % 2 ? '#a7a196' : '#bdb6a8'; c.fillRect(cx - sw / 2, y, sw, 9);
        c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(cx - sw / 2, y, sw, 9);
      }
      c.strokeStyle = INK; c.lineWidth = 2; c.beginPath();
      for (const s of [-1, 1]) {
        const a = cx + s * (dw / 2 + 30), b = s < 0 ? x0 : x1;
        for (let x = Math.min(a, b); x <= Math.max(a, b); x += 8) { c.moveTo(x, AB + 26); c.lineTo(x, AB - 30); }
        c.moveTo(Math.min(a, b), AB - 24); c.lineTo(Math.max(a, b), AB - 24);
        c.moveTo(Math.min(a, b), AB + 14); c.lineTo(Math.max(a, b), AB + 14);
      }
      c.stroke();
      c.fillStyle = INK; c.beginPath();
      for (const s of [-1, 1]) { const a = cx + s * (dw / 2 + 30), b = s < 0 ? x0 : x1; for (let x = Math.min(a, b); x <= Math.max(a, b); x += 8) { c.moveTo(x - 3, AB - 30); c.lineTo(x, AB - 38); c.lineTo(x + 3, AB - 30); } }
      c.fill();
      if (i === 1) { // two milk bottles by the door
        for (const x of [cx + 30, cx + 40]) { c.fillStyle = WHITE; c.fillRect(x - 3.5, AB - 14, 7, 14); c.fillRect(x - 2, AB - 18, 4, 4); c.fillStyle = '#c9c4b4'; c.fillRect(x - 2, AB - 19, 4, 2); c.strokeStyle = INK; c.lineWidth = 0.8; c.strokeRect(x - 3.5, AB - 14, 7, 14); }
      }
      if (i === 3) { // a black cat on the top step, its tail curled
        const x = cx - 34, y = AB;
        c.fillStyle = INK; c.beginPath(); c.ellipse(x, y - 8, 9, 8, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(x - 2, y - 19, 5.5, 0, Math.PI * 2); c.fill();
        poly(c, [[x - 7, y - 21], [x - 6, y - 28], [x - 3, y - 23]]); c.fill(); poly(c, [[x + 3, y - 21], [x + 2, y - 28], [x - 1, y - 23]]); c.fill();
        c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 8, y - 3); c.quadraticCurveTo(x + 20, y - 2, x + 16, y - 14); c.stroke();
        c.fillStyle = ORP; c.fillRect(x - 5, y - 20, 1.6, 1.6); c.fillRect(x - 1, y - 20, 1.6, 1.6);
      }
      if (i === 4) { // a bicycle against the railings
        const x = x0 + 34, y = AB + 22;
        c.strokeStyle = INK; c.lineWidth = 2;
        c.beginPath(); c.arc(x, y - 12, 12, 0, Math.PI * 2); c.moveTo(x + 50, y - 12); c.arc(x + 38, y - 12, 12, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = RED; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x + 16, y - 30); c.lineTo(x + 34, y - 30); c.lineTo(x + 38, y - 12); c.moveTo(x + 16, y - 30); c.lineTo(x + 20, y - 12); c.lineTo(x + 34, y - 30); c.moveTo(x, y - 12); c.lineTo(x + 20, y - 12); c.stroke();
        c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 14, y - 34); c.lineTo(x + 20, y - 34); c.moveTo(x + 34, y - 30); c.lineTo(x + 33, y - 38); c.lineTo(x + 28, y - 39); c.stroke();
      }
      c.restore();
    }, { t: t0 + 1.2, d: 0.6, reveal: 'rise' });
  }
  // the columns: knotwork shafts, square capitals and bases, gold arches over the bays
  for (let i = 0; i <= BAYS; i++) {
    const x = AX0 + i * BW_, t0 = 7.2 + i * 0.16;
    const shaft = plait(straight(x + 12, AY, 0, 1), AB + 30 - AY, 24, { n: 2, sw: 6, period: 40, margin: 2 });
    p.group('arch', { x: x - 30, y: AY - 30, w: 60, h: AB - AY + 70 }, (c) => {
      c.fillStyle = VER_D; c.fillRect(x - 14, AY, 28, AB + 30 - AY);
      c.save(); c.beginPath(); c.rect(x - 14, AY, 28, AB + 30 - AY); c.clip(); drawPlait(c, shaft, ORP); c.restore();
      c.strokeStyle = GOLD; c.lineWidth = 4; c.strokeRect(x - 14, AY, 28, AB + 30 - AY);
      c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x - 16, AY - 2, 32, AB + 34 - AY);
      for (const [y, h] of [[AY - 26, 26], [AB + 30, 12]]) {
        c.fillStyle = GOLD; c.fillRect(x - 24, y, 48, h); c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(x - 24, y, 48, h);
      }
      c.fillStyle = RED; c.beginPath(); c.arc(x, AY - 13, 7, 0, Math.PI * 2); c.fill(); c.stroke();
    }, { t: t0, d: 0.9, reveal: 'rise', ease: 'inOut' });
  }
  // the base the arcade stands on
  p.group('arch', { x: AX0 - 30, y: AB + 38, w: AX1 - AX0 + 60, h: 30 }, (c) => {
    c.fillStyle = GOLD; c.fillRect(AX0 - 24, AB + 42, AX1 - AX0 + 48, 14);
    c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(AX0 - 24, AB + 42, AX1 - AX0 + 48, 14);
    c.fillStyle = RED; c.beginPath(); for (let x = AX0 - 14; x < AX1 + 20; x += 16) { c.moveTo(x + 2.5, AB + 49); c.arc(x, AB + 49, 2.5, 0, Math.PI * 2); } c.fill();
  }, { t: 7.0, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  for (let i = 0; i < BAYS; i++) {
    const cx = AX0 + (i + 0.5) * BW_, R0 = BW_ / 2;
    const pts = []; for (let k = 0; k <= 40; k++) { const a = Math.PI + (k / 40) * Math.PI; pts.push([cx + Math.cos(a) * (R0 - 2), AY - 26 + Math.sin(a) * (R0 - 2)]); }
    p.pen('arch', pts, INK, 22, { t: 8.0 + i * 0.16, d: 0.8, cap: 'butt' });
    p.group('arch', { x: cx - R0 - 14, y: AY - 26 - R0 - 14, w: 2 * R0 + 28, h: R0 + 30 }, (c) => {
      c.strokeStyle = GOLD; c.lineWidth = 17; c.beginPath(); c.arc(cx, AY - 26, R0 - 2, Math.PI, 0); c.stroke();
      c.fillStyle = RED; c.beginPath();
      for (let k = 1; k < 18; k++) { const a = Math.PI + (k / 18) * Math.PI, x = cx + Math.cos(a) * (R0 - 2), y = AY - 26 + Math.sin(a) * (R0 - 2); c.moveTo(x + 3, y); c.arc(x, y, 3, 0, Math.PI * 2); }
      c.fill();
    }, { t: 8.6 + i * 0.16, d: 0.6, reveal: 'fade' });
  }
}

// ================================================================ red dots
function dots(p, r) {
  // the scribe's red dots, a row round the outside of the initial, in four runs
  const pts = [];
  const off = 20, step = 15;
  for (let y = DCY - ORY - off; y <= DCY + ORY + off; y += step) pts.push([SX0 - off, y]);
  for (let x = SX0 - off + step; x <= SX; x += step) pts.push([x, DCY + ORY + off]);
  const ell = [];
  let a = Math.PI / 2;
  while (a > -Math.PI / 2) {
    ell.push([SX + Math.cos(a) * (ORX + off), DCY + Math.sin(a) * (ORY + off)]);
    const dx = -Math.sin(a) * (ORX + off), dy = Math.cos(a) * (ORY + off);
    a -= step / Math.hypot(dx, dy);
  }
  pts.push(...ell);
  for (let x = SX; x >= SX0 - off; x -= step) pts.push([x, DCY - ORY - off]);
  // and a second, inner row of triads in the spandrels above the arches
  const tri = [];
  for (let i = 0; i <= BAYS; i++) { const x = AX0 + i * BW_, y = 1282; if (i > 0 && i < BAYS) tri.push([x, y]); }
  const runs = 5, per = Math.ceil(pts.length / runs);
  for (let k = 0; k < runs; k++) {
    const run = pts.slice(k * per, (k + 1) * per);
    if (!run.length) continue;
    const xs = run.map((q) => q[0]), ys = run.map((q) => q[1]);
    p.group('dots', { x: Math.min(...xs) - 8, y: Math.min(...ys) - 8, w: Math.max(...xs) - Math.min(...xs) + 16, h: Math.max(...ys) - Math.min(...ys) + 16 }, (c) => {
      c.fillStyle = RED; c.beginPath();
      for (const [x, y] of run) { c.moveTo(x + 3.6, y); c.arc(x, y, 3.6, 0, Math.PI * 2); }
      c.fill();
    }, { t: 9.2 + k * 0.22, d: 0.5, reveal: 'fade' });
  }
  p.group('dots', { x: AX0, y: 1250, w: AX1 - AX0, h: 70 }, (c) => {
    c.fillStyle = RED; c.beginPath();
    for (const [x, y] of tri) for (const [dx, dy] of [[0, -9], [-8, 5], [8, 5]]) { c.moveTo(x + dx + 4, y + dy); c.arc(x + dx, y + dy, 4, 0, Math.PI * 2); }
    c.fill();
  }, { t: 10.2, d: 0.5, reveal: 'pop' });
}

// ================================================================ live
function life(p, r) {
  // gulls wheeling over the river, inside the letter
  const gs = [];
  for (let i = 0; i < 4; i++) gs.push([r.range(440, 760), r.range(430, 560), r.range(30, 70), r.range(0.4, 0.7) * (i % 2 ? 1 : -1), r() * 6, r.range(0.9, 1.3)]);
  p.live('birds', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.save(); counterPath(c); c.clip();
      for (const [x0, y0, rad, w, ph, s] of gs) {
        const a = time * w + ph;
        gull(c, x0 + Math.cos(a) * rad * 1.6, y0 + Math.sin(a) * rad * 0.4, s * 1.4, 0.5 + 0.5 * Math.sin(time * 5 + ph), INK);
      }
      c.restore();
    },
  });
  // the light running on the water
  const sh = [];
  for (let i = 0; i < 22; i++) sh.push([r.range(SX + 10, SX + IRX * 0.75), r.range(QUAY + 50, DCY + IRY - 10), r() * 6, r.range(6, 16)]);
  p.live('birds', {
    t: 9.8, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.save(); counterPath(c); c.clip();
      c.fillStyle = WHITE;
      for (const [x, y, ph, L] of sh) {
        const a = Math.sin(time * 1.4 + ph * 2);
        if (a < 0.25) continue;
        c.globalAlpha = a * 0.85; c.fillRect(x - L / 2 + Math.sin(time * 0.6 + ph) * 5, y, L, 2);
      }
      c.restore();
    },
  });
  // the bridge lamps, lit
  p.live('bridge', {
    t: 10.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const xm = (SX - 20 + 808) / 2;
      [xm - 140, xm, xm + 140].forEach((x, i) => {
        const y = QUAY - 26 - 58 * (1 - ((x - xm) / ((808 - SX + 20) / 2)) ** 2) - 63;
        c.globalAlpha = 0.35 + 0.15 * Math.sin(time * 2.3 + i * 2);
        c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2); c.fill();
      });
      c.globalAlpha = 1;
    },
  });
}

// ================================================================ the words
function words(p, r) {
  const m = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  // the rubric, in red: the city's own name
  ['Baile', 'Átha', 'Cliath'].forEach((w, i) => {
    p.type('text', w, 1216, 312 + i * 92, { family: FACE, size: 82, color: RED, align: 'center', t: 10.4 + i * 0.45, gap: 0.07, d: 0.5 });
  });
  // a little line of red and gold under it
  p.group('text', { x: 1040, y: 560, w: 350, h: 24 }, (c) => {
    c.fillStyle = RED; c.beginPath(); for (let x = 1060; x < 1380; x += 20) { c.moveTo(x + 3.5, 572); c.arc(x, 572, 3.5, 0, Math.PI * 2); } c.fill();
  }, { t: 11.6, d: 0.6, reveal: 'wipe' });
  // the key, in brown ink, each line with a colored numeral
  const key = [['i', 'the Liffey'], ['ii', "Ha'penny Bridge"], ['iii', 'Custom House'], ['iv', 'the Spire'], ['v', 'Georgian doors']];
  key.forEach(([n, w], i) => {
    const y = 650 + i * 46;
    p.mark('text', {
      t: 12.0 + i * 0.22, d: 0.6, reveal: 'wipe', ease: 'inOut', box: { x: 1040, y: y - 34, w: 380, h: 46 },
      draw: (c) => {
        c.font = `400 30px ${FACE}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
        c.fillStyle = [RED, LAP, VER, FOL, RED][i]; c.fillText(n + '.', 1050, y);
        c.fillStyle = INK; c.fillText(w, 1120, y);
      },
    });
  });
  // the rest of the name, after the initial: each letter its own color, outlined
  const size = 196, base = 1150;
  m.font = `400 ${size}px ${FACE}`;
  const word = 'ublin', total = m.measureText(word).width;
  const fit = 1420 - 1030;
  const s = Math.min(size, size * fit / total);
  m.font = `400 ${s}px ${FACE}`;
  const x0 = 1030 + (fit - m.measureText(word).width) / 2;
  const fills = [LAP, RED, VER, FOL, LAP];
  for (let i = 0; i < word.length; i++) {
    const x = x0 + m.measureText(word.slice(0, i)).width;
    p.type('text', word[i], x, base, { family: FACE, size: s, color: fills[i], stroke: INK, lw: 3.5, shadow: GOLD, sx: 5, sy: 5, t: 10.9 + i * 0.16, d: 0.7 });
  }
  // a row of red dots under the word
  p.group('text', { x: 1020, y: base + 10, w: 400, h: 24 }, (c) => {
    c.fillStyle = RED; c.beginPath(); for (let x = 1040; x < 1410; x += 15) { c.moveTo(x + 3.6, base + 22); c.arc(x, base + 22, 3.6, 0, Math.PI * 2); } c.fill();
  }, { t: 12.2, d: 0.6, reveal: 'wipe' });
}
