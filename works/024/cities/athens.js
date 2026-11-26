// Athens: a black-figure vase painting. A panel of red clay reserved in black
// glaze, with tongues and a meander above, a palmette chain and a frieze of
// figures below, rays at the foot. In the panel the Acropolis rock in black with
// its walls and cracks scratched through to the clay: the Parthenon against a
// disk of added red, the Erechtheion's maidens in added white, the Propylaea,
// the little temple of Athena Nike on its bastion, the Odeon of Herodes Atticus
// at the foot, white houses of the Plaka, the columns of the Olympieion and
// Lycabettus with its chapel. Olive boughs from the corners, an owl, swallows.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, poly, rng } from '../kit.js';

// glaze, clay, the scratched line, and the two added colors
const GL = '#1c1410', GL2 = '#120d0a';
const TC = '#c86b39', TC_L = '#d98450', TC_D = '#a9552c';
const INC = '#d07a46';
const RED = '#7a2a1c', RED_L = '#8f3624';
const WHITE = '#efe2c6';

export const city = {
  id: 'athens', name: 'Athens', wall: '#2c1610',
  alt: "A black-figure vase painting of the Acropolis in black on terracotta: the Parthenon against a red disk, the Erechtheion's porch of maidens, the Propylaea, the temple of Athena Nike, the Odeon of Herodes Atticus, white houses of the Plaka, the columns of the Olympieion and Lycabettus with its chapel, framed by olive boughs with an owl and swallows, over a frieze of figures and a ship between meander and palmette borders",
  google: 'family=Noto+Serif+Display:wght@400;600;800',
  fonts: [['800 250px "Noto Serif Display"', 'ΑΘΗΝΑ'], ['400 44px "Noto Serif Display"', 'ATHENS'],
    ['600 22px "Noto Serif Display"', 'ΠΑΡΘΕΝΩΝΛΥΚΑΒΗΤΤΟΣΕΡΕΧΘΕΙΟΝ·']],
  build,
};

// the panel reserved in the glaze, and its bands
const PX0 = 140, PX1 = W - 140, PY0 = 130, PY1 = 1590;
const FY0 = 284, FY1 = 1150; // the main field and its ground line
const BY0 = 1170, BY1 = 1236; // the palmette band
const RY0 = 1248, RY1 = 1478; // the figure frieze; its ground at RG
const RG = 1466;
const SUN = [915, 640, 228];
const F = '"Noto Serif Display", serif';

function build() {
  const p = new Plate({ paper: GL, seed: 447 });
  const r = p.r;
  p.stack('panel', 'bands', 'sun', 'far', 'rock', 'build', 'incise', 'white', 'olive', 'frieze', 'fincise', 'owl', 'birds', 'ship', 'torch', 'title');

  panel(p, r);
  bands(p, r);
  sunDisk(p);
  lycabettus(p, r);
  rock(p, r);
  odeon(p);
  propylaea(p);
  nike(p);
  erechtheion(p);
  parthenon(p);
  plaka(p, r);
  olympieion(p);
  olives(p, r);
  frieze(p, r);
  life(p, r);
  title(p);
  return p;
}

// ================================================================ helpers
function path(c, pts, close = true) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}
function lines(c, segs) { c.beginPath(); for (const s of segs) { c.moveTo(s[0][0], s[0][1]); for (let i = 1; i < s.length; i++) c.lineTo(s[i][0], s[i][1]); } }
// a limb as an outline around a polyline, its width changing along it
function limb(pts, ws) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1;
    const nx = -dy / n, ny = dx / n, w = ws[i] / 2;
    L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); R.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  return L.concat(R.reverse());
}
// a smooth curve through points, sampled
function curve(ctrl, n = 8) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

// ================================================================ the panel: clay reserved in the glaze
function panel(p, r) {
  // the clay, a little lighter where the pot swells, with the wheel's faint rings
  const rings = [];
  const rr = rng(31);
  for (let y = PY0 + 6; y < PY1; y += rr.range(5, 15)) rings.push([y, rr.range(0.02, 0.07), rr.range(0.6, 2.2)]);
  p.group('panel', { x: PX0 - 4, y: PY0 - 4, w: PX1 - PX0 + 8, h: PY1 - PY0 + 8 }, (c) => {
    const g = c.createRadialGradient(W / 2, 760, 120, W / 2, 820, 1000);
    g.addColorStop(0, TC_L); g.addColorStop(0.55, TC); g.addColorStop(1, TC_D);
    c.fillStyle = g; c.fillRect(PX0, PY0, PX1 - PX0, PY1 - PY0);
    for (const [y, a, lw] of rings) { c.fillStyle = `rgba(90,38,14,${a})`; c.fillRect(PX0, y, PX1 - PX0, lw); }
  }, { t: 0, d: 1.2, reveal: 'iris', ease: 'soft' });
  // a fine reserved line around the panel, out in the glaze
  p.mark('panel', {
    t: 0.9, d: 1.0, reveal: 'fade', box: { x: PX0 - 30, y: PY0 - 30, w: PX1 - PX0 + 60, h: PY1 - PY0 + 60 },
    draw: (c) => { c.strokeStyle = TC_D; c.lineWidth = 2; c.strokeRect(PX0 - 18, PY0 - 18, PX1 - PX0 + 36, PY1 - PY0 + 36); },
  });
}

// ================================================================ the bands
function bands(p, r) {
  // tongues hanging from the lip, black and red by turns
  const n = 36, tw = (PX1 - PX0) / n;
  for (let g = 0; g < 12; g++) {
    const ids = [3 * g, 3 * g + 1, 3 * g + 2];
    p.group('bands', { x: PX0 + ids[0] * tw - 2, y: PY0, w: tw * 3 + 4, h: 80 }, (c) => {
      for (const i of ids) {
        const x = PX0 + i * tw + 3, w = tw - 6;
        c.fillStyle = i % 2 ? RED : GL;
        c.beginPath(); c.moveTo(x, PY0 + 12); c.lineTo(x, PY0 + 40); c.arc(x + w / 2, PY0 + 40, w / 2, Math.PI, 0, true); c.lineTo(x + w, PY0 + 12); c.closePath(); c.fill();
      }
    }, { t: 0.6 + g * 0.07, d: 0.45, reveal: 'fall' });
  }
  p.mark('bands', { t: 0.55, d: 0.8, reveal: 'wipe', box: { x: PX0, y: PY0, w: PX1 - PX0, h: 14 }, draw: (c) => { c.fillStyle = GL; c.fillRect(PX0, PY0, PX1 - PX0, 12); } });
  // the meander: a running key between two rules
  const my0 = 222, mh = 48, unit = 48;
  const key = [];
  const x0 = PX0 + 14;
  const units = Math.floor((PX1 - PX0 - 28) / unit);
  const ux = (PX1 - PX0 - units * unit) / 2 + PX0;
  for (let i = 0; i < units; i++) {
    const x = ux + i * unit, s = unit / 6;
    // one turn of the key, drawn as a single line
    const pts = [[x, my0 + mh - s * 0.5], [x, my0 + s * 0.5], [x + 4 * s, my0 + s * 0.5], [x + 4 * s, my0 + 4 * s - s * 0.5 + s * 0.5],
      [x + 2 * s, my0 + 3.5 * s], [x + 2 * s, my0 + 2.5 * s], [x + 3 * s, my0 + 2.5 * s]];
    key.push(pts);
    key.push([[x, my0 + mh - s * 0.5], [x + unit, my0 + mh - s * 0.5]]);
  }
  void x0;
  for (const [y, t] of [[my0 - 8, 1.2], [my0 + mh + 2, 1.3]]) {
    p.mark('bands', { t, d: 1.0, reveal: 'wipe', ease: 'inOut', box: { x: PX0, y: y - 2, w: PX1 - PX0, h: 10 }, draw: (c) => { c.fillStyle = GL; c.fillRect(PX0, y, PX1 - PX0, 5); } });
  }
  p.strokes('bands', key, GL, 5.5, { t: 1.4, d: 1.6, reveal: 'wipe', ease: 'inOut', cap: 'butt', box: { x: PX0, y: my0 - 4, w: PX1 - PX0, h: mh + 8 } });
  // the field's ground line
  p.mark('bands', { t: 1.6, d: 1.0, reveal: 'wipe', ease: 'inOut', box: { x: PX0, y: FY1 - 2, w: PX1 - PX0, h: 16 }, draw: (c) => { c.fillStyle = GL; c.fillRect(PX0, FY1, PX1 - PX0, 10); } });

  // the palmette chain: palmettes up and down on a running tendril
  const pn = 16, pw = (PX1 - PX0) / pn, pmy = (BY0 + BY1) / 2;
  const tend = [];
  for (let i = 0; i <= pn * 8; i++) { const x = PX0 + (i / 8) * pw; tend.push([x, pmy + Math.sin((i / 8) * Math.PI) * 13]); }
  for (const [y, t] of [[BY0 - 6, 1.8], [BY1, 1.9]]) {
    p.mark('bands', { t, d: 1.0, reveal: 'wipeL', ease: 'inOut', box: { x: PX0, y: y - 2, w: PX1 - PX0, h: 10 }, draw: (c) => { c.fillStyle = GL; c.fillRect(PX0, y, PX1 - PX0, 5); } });
  }
  p.pen('bands', tend, GL, 3, { t: 2.0, d: 1.6 });
  for (let g = 0; g < 8; g++) {
    p.group('bands', { x: PX0 + g * 2 * pw - 4, y: BY0 - 4, w: 2 * pw + 8, h: BY1 - BY0 + 8 }, (c) => {
      for (let k = 0; k < 2; k++) {
        const i = 2 * g + k, cx = PX0 + (i + 0.5) * pw, up = i % 2 === 0;
        const by = pmy + (up ? -2 : 2), dir = up ? -1 : 1;
        // a fan of seven petals and a heart
        c.fillStyle = up ? GL : RED;
        for (let j = -3; j <= 3; j++) {
          const a = -Math.PI / 2 * dir + j * 0.32 * (up ? 1 : -1), L = 26 - Math.abs(j) * 2.6;
          const ex = cx + Math.cos(a) * L, ey = by + Math.sin(a) * L * (up ? 1 : 1);
          c.beginPath(); c.ellipse((cx + ex) / 2, (by + ey) / 2, L / 2, 3.4, a, 0, Math.PI * 2); c.fill();
        }
        c.fillStyle = GL; c.beginPath(); c.arc(cx, by, 5.5, 0, Math.PI * 2); c.fill();
        // the little lotus bud between
        const bx = cx + pw / 2;
        if (i < pn - 1) { c.beginPath(); c.moveTo(bx, pmy - dir * 6); c.quadraticCurveTo(bx + 6, pmy + dir * 8, bx, pmy + dir * 18); c.quadraticCurveTo(bx - 6, pmy + dir * 8, bx, pmy - dir * 6); c.fill(); }
      }
    }, { t: 2.3 + g * 0.12, d: 0.5, reveal: 'pop' });
  }

  // the rays at the foot
  const rn = 30, rw = (PX1 - PX0) / rn;
  p.mark('bands', { t: 2.0, d: 0.8, reveal: 'wipe', box: { x: PX0, y: RY1 - 4, w: PX1 - PX0, h: 14 }, draw: (c) => { c.fillStyle = GL; c.fillRect(PX0, RY1, PX1 - PX0, 6); } });
  p.mark('bands', { t: 2.0, d: 0.8, reveal: 'wipeL', box: { x: PX0, y: RY0 - 8, w: PX1 - PX0, h: 14 }, draw: (c) => { c.fillStyle = GL; c.fillRect(PX0, RY0 - 6, PX1 - PX0, 6); } });
  for (let g = 0; g < 6; g++) {
    p.group('bands', { x: PX0 + g * 5 * rw - 2, y: RY1 + 6, w: 5 * rw + 4, h: PY1 - RY1 }, (c) => {
      c.fillStyle = GL; c.beginPath();
      for (let k = 0; k < 5; k++) {
        const x = PX0 + (g * 5 + k) * rw;
        c.moveTo(x + 4, PY1); c.lineTo(x + rw / 2, RY1 + 16); c.lineTo(x + rw - 4, PY1); c.closePath();
      }
      c.fill();
      c.strokeStyle = GL; c.lineWidth = 1.6; c.beginPath();
      for (let k = 0; k < 5; k++) { const x = PX0 + (g * 5 + k) * rw; c.moveTo(x, PY1); c.lineTo(x, RY1 + 50); }
      c.stroke();
    }, { t: 2.4 + g * 0.1, d: 0.7, reveal: 'rise' });
  }
}

// ================================================================ the red disk behind the temple
function sunDisk(p) {
  const [x, y, rad] = SUN;
  p.mark('sun', {
    t: 2.4, d: 1.4, reveal: 'iris', ease: 'soft', box: { x: x - rad - 4, y: y - rad - 4, w: 2 * rad + 8, h: 2 * rad + 8 },
    draw: (c) => {
      c.save(); c.beginPath(); c.rect(PX0, FY0, PX1 - PX0, FY1 - FY0); c.clip();
      c.fillStyle = RED; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
      c.strokeStyle = TC; c.lineWidth = 1.4;
      for (const k of [0.93, 0.89]) { c.beginPath(); c.arc(x, y, rad * k, 0, Math.PI * 2); c.stroke(); }
      c.restore();
    },
  });
}

// ================================================================ Lycabettus, in added red, its pines and chapel
function lycabettus(p, r) {
  const hill = curve([[1150, FY1], [1230, 1000], [1290, 820], [1330, 690], [1352, 612], [1376, 606], [1398, 660], [1432, 760], [PX1 + 10, 840], [PX1 + 10, FY1]], 10);
  p.fill('far', hill, RED_L, { t: 2.7, d: 1.4, reveal: 'rise', ease: 'soft' });
  // pines on its flanks: small black cones, many
  const pines = [];
  for (let i = 0; i < 70; i++) {
    const y = r.range(700, 1120), half = lerp(20, 150, (y - 610) / 520);
    const x = 1364 + r.range(-half, half) * (y > 900 ? 1 : 0.8);
    if (x > PX1 - 6) continue;
    pines.push([x, y, r.range(6, 11)]);
  }
  pines.sort((a, b) => a[1] - b[1]);
  p.group('far', { x: 1140, y: 640, w: PX1 - 1140, h: FY1 - 640 }, (c) => {
    c.fillStyle = GL; c.beginPath();
    for (const [x, y, s] of pines) { c.moveTo(x, y - s * 2.2); c.lineTo(x + s, y); c.lineTo(x - s, y); c.closePath(); }
    c.fill();
  }, { t: 4.0, d: 1.0, reveal: 'rise' });
  // the path winding up
  const zig = [[1300, 1100], [1420, 1040], [1310, 960], [1410, 890], [1330, 820], [1395, 760], [1352, 700], [1380, 650]];
  p.pen('far', zig, INC, 1.6, { t: 4.4, d: 1.4 });
  // St George's chapel, whitewashed, with its bell gable
  p.group('far', { x: 1336, y: 556, w: 60, h: 54 }, (c) => {
    c.fillStyle = WHITE;
    c.fillRect(1346, 584, 40, 22);
    c.beginPath(); c.moveTo(1342, 586); c.lineTo(1366, 572); c.lineTo(1390, 586); c.closePath(); c.fill();
    c.fillRect(1372, 562, 10, 16); c.beginPath(); c.moveTo(1370, 563); c.lineTo(1377, 556); c.lineTo(1384, 563); c.fill();
    c.fillStyle = GL; c.fillRect(1362, 594, 7, 12); c.fillRect(1375, 566, 4, 6); c.fillRect(1351, 590, 4, 6);
  }, { t: 5.4, d: 0.6, reveal: 'pop' });
}

// ================================================================ the rock
const ROCK = [
  [168, FY1], [200, 1120], [236, 1092], [262, 1052], [292, 1022], [314, 986], [330, 950], [342, 918], [350, 896],
  [352, 880], [412, 880], [416, 864], [422, 852], [545, 852], [552, 834], [562, 816], [1146, 812],
  [1156, 832], [1166, 880], [1174, 940], [1180, 994], [1196, 1036], [1212, 1080], [1232, 1120], [1252, FY1],
];
function rock(p, r) {
  p.fill('rock', ROCK, GL, { t: 3.0, d: 1.6, reveal: 'rise', ease: 'soft', box: boxOf(ROCK, 4) });
  // scratched through: the courses of the wall along the top, strata and cracks in the rock
  const wall = [];
  for (let y = 826; y < 876; y += 9) wall.push([[566, y], [1150, y + 1]]);
  for (let row = 0, y = 826; y < 868; y += 9, row++) for (let x = 570 + (row % 2) * 16; x < 1146; x += 32) wall.push([[x, y], [x, y + 9]]);
  const strata = [];
  const rr = rng(12);
  for (let i = 0; i < 26; i++) {
    const y = rr.range(890, 1130), x0 = rr.range(260, 1100), L = rr.range(40, 180);
    const pts = []; for (let k = 0; k <= 6; k++) pts.push([x0 + (k / 6) * L, y + Math.sin(k * 1.3 + i) * 3 + k * rr.range(-1, 1)]);
    strata.push(pts);
  }
  for (let i = 0; i < 16; i++) {
    const x = rr.range(300, 1180), y = rr.range(880, 1080), L = rr.range(30, 80);
    strata.push([[x, y], [x + rr.range(-6, 6), y + L * 0.5], [x + rr.range(-10, 10), y + L]]);
  }
  const inside = (pt) => pt[1] > 880 || (pt[0] > 560 && pt[0] < 1150);
  p.strokes('incise', wall, INC, 1.1, { t: 4.2, d: 1.2, reveal: 'wipe', ease: 'inOut', box: { x: 560, y: 820, w: 600, h: 60 } });
  p.strokes('incise', strata.filter((s) => s.every(inside)), INC, 1.2, { t: 4.6, d: 1.6, reveal: 'fall', ease: 'inOut', box: { x: 200, y: 870, w: 1060, h: 280 } });
  // the rock's own contour, scratched, so whatever stands before it reads
  p.pen('incise', ROCK.slice(1, -1), INC, 1.4, { t: 4.4, d: 1.8 });
}

// ================================================================ the temples
// a column, foot at (x, y), height h, width w; returns a path piece
function column(c, x, y, h, w, cap = 'doric') {
  const tw = w * 0.82;
  c.moveTo(x - w / 2, y); c.lineTo(x - tw / 2, y - h + w * 0.5); c.lineTo(x - w * 0.62, y - h + w * 0.3);
  c.lineTo(x - w * 0.62, y - h); c.lineTo(x + w * 0.62, y - h); c.lineTo(x + w * 0.62, y - h + w * 0.3);
  c.lineTo(x + tw / 2, y - h + w * 0.5); c.lineTo(x + w / 2, y); c.closePath();
  if (cap === 'ionic') { c.moveTo(x - w * 0.75, y - h + w * 0.25); c.arc(x - w * 0.62, y - h + w * 0.25, w * 0.22, 0, Math.PI * 2); c.moveTo(x + w * 0.84, y - h + w * 0.25); c.arc(x + w * 0.62, y - h + w * 0.25, w * 0.22, 0, Math.PI * 2); }
}
function flutes(segs, x, y, h, w) {
  for (const k of [-0.18, 0.18]) segs.push([[x + k * w, y - 2], [x + k * w * 0.85, y - h + w * 0.6]]);
}

function odeon(p) {
  // the Odeon's tall curved wall: three tiers of arches, ragged on top
  const x0 = 214, x1 = 470, yb = FY1, yt = 960;
  const top = [];
  for (let i = 0; i <= 16; i++) { const x = lerp(x0, x1, i / 16); top.push([x, yt + [0, 6, 2, 14, 8, 0, 4, 22, 30, 12, 4, 0, 10, 26, 18, 30, 46][i]]); }
  const shape = [[x0, yb], ...top, [x1, yb]];
  const arches = [];
  for (let tier = 0; tier < 3; tier++) {
    const ay = yb - 18 - tier * 60, ah = tier === 0 ? 46 : 36, n = 9;
    for (let i = 0; i < n; i++) {
      const ax = x0 + 14 + (i + 0.5) * ((x1 - x0 - 28) / n), aw = (x1 - x0 - 28) / n * 0.56;
      const topY = top[Math.min(16, Math.round(((ax - x0) / (x1 - x0)) * 16))][1];
      if (ay - ah - aw / 2 < topY + 8) continue;
      arches.push([ax, ay, aw, ah]);
    }
  }
  p.group('build', boxOf(shape, 4), (c) => {
    c.fillStyle = GL2; path(c, shape); c.fill();
    c.fillStyle = TC_D;
    c.beginPath();
    for (const [ax, ay, aw, ah] of arches) { c.moveTo(ax - aw / 2, ay); c.lineTo(ax - aw / 2, ay - ah); c.arc(ax, ay - ah, aw / 2, Math.PI, 0); c.lineTo(ax + aw / 2, ay); c.closePath(); }
    c.fill();
    c.strokeStyle = INC; c.lineWidth = 1.3;
    path(c, shape, false); c.stroke();
    c.beginPath(); for (let tier = 0; tier < 3; tier++) { const y = yb - 10 - tier * 60; c.moveTo(x0 + 4, y); c.lineTo(x1 - 4, y); } c.stroke();
  }, { t: 4.6, d: 1.2, reveal: 'rise' });
}

function propylaea(p) {
  const y = 852, segs = [];
  p.group('build', { x: 414, y: 740, w: 140, h: 116 }, (c) => {
    c.fillStyle = GL; c.beginPath();
    // the Pinakotheke wing, low, and the gate hall with its pediment
    c.rect(420, 800, 34, 52);
    c.rect(448, y - 6, 96, 6);
    for (let i = 0; i < 5; i++) column(c, 456 + i * 20, y - 6, 66, 11);
    c.rect(446, y - 6 - 66 - 14, 100, 14);
    c.moveTo(444, y - 86); c.lineTo(496, y - 108); c.lineTo(548, y - 86); c.closePath();
    c.fill();
    for (let i = 0; i < 5; i++) flutes(segs, 456 + i * 20, y - 6, 66, 11);
    c.strokeStyle = INC; c.lineWidth = 1; lines(c, segs); c.stroke();
    c.beginPath(); c.moveTo(454, y - 89); c.lineTo(496, y - 104 + 4); c.lineTo(538, y - 89); c.moveTo(447, y - 78); c.lineTo(545, y - 78); c.stroke();
    c.beginPath(); for (let x = 424; x < 452; x += 8) { c.moveTo(x, 812); c.lineTo(x, 846); } c.stroke();
  }, { t: 5.0, d: 1.0, reveal: 'rise' });
}

function nike(p) {
  const y = 880, segs = [];
  p.group('build', { x: 352, y: 824, w: 64, h: 60 }, (c) => {
    c.fillStyle = GL; c.beginPath();
    c.rect(358, y - 5, 50, 5);
    for (let i = 0; i < 4; i++) column(c, 364 + i * 12.6, y - 5, 34, 6.5, 'ionic');
    c.rect(357, y - 47, 52, 8);
    c.moveTo(356, y - 47); c.lineTo(383, y - 57); c.lineTo(410, y - 47); c.closePath();
    c.fill();
    c.strokeStyle = INC; c.lineWidth = 0.9; c.beginPath(); c.moveTo(358, y - 43); c.lineTo(408, y - 43); c.stroke();
  }, { t: 5.2, d: 0.8, reveal: 'rise' });
  void segs;
}

function erechtheion(p) {
  const y = 812;
  p.group('build', { x: 570, y: 700, w: 160, h: 116 }, (c) => {
    c.fillStyle = GL; c.beginPath();
    // the main hall behind, its east porch columns, the low gable
    c.rect(636, y - 82, 84, 82);
    c.moveTo(630, y - 82); c.lineTo(678, y - 100); c.lineTo(726, y - 82); c.closePath();
    // the maidens' podium and the roof they carry
    c.rect(582, y - 22, 64, 22);
    c.rect(578, y - 72, 72, 10);
    c.fill();
    c.strokeStyle = INC; c.lineWidth = 1; c.beginPath();
    for (const yy of [y - 8, y - 15]) { c.moveTo(584, yy); c.lineTo(644, yy); }
    for (let x = 646; x < 718; x += 12) { c.moveTo(x, y - 76); c.lineTo(x, y - 6); }
    c.moveTo(636, y - 78); c.lineTo(720, y - 78);
    c.moveTo(580, y - 66); c.lineTo(648, y - 66);
    c.stroke();
  }, { t: 5.4, d: 1.0, reveal: 'rise' });
  // the six maidens, in added white: four in front
  p.group('white', { x: 580, y: y - 66, w: 70, h: 46 }, (c) => {
    for (let i = 0; i < 4; i++) {
      const x = 590 + i * 16, yb = y - 22, h = 40;
      c.fillStyle = WHITE;
      c.beginPath(); c.moveTo(x - 5, yb); c.lineTo(x - 4.2, yb - h + 12); c.lineTo(x + 4.2, yb - h + 12); c.lineTo(x + 5, yb); c.closePath(); c.fill();
      c.beginPath(); c.arc(x, yb - h + 8, 3.6, 0, Math.PI * 2); c.fill();
      c.fillRect(x - 4.5, yb - h, 9, 3);
      c.strokeStyle = GL; c.lineWidth = 0.8; c.beginPath();
      for (const k of [-2, 0, 2]) { c.moveTo(x + k, yb - 2); c.lineTo(x + k * 0.8, yb - h + 16); }
      c.stroke();
    }
  }, { t: 6.4, d: 0.8, reveal: 'rise' });
}

function parthenon(p) {
  const y = 812, fx0 = 700, fx1 = 836, sx1 = 1122, ch = 128, cw = 14;
  const topC = y - 18 - ch;
  // three steps
  p.group('build', { x: fx0 - 10, y: y - 22, w: sx1 - fx0 + 24, h: 26 }, (c) => {
    c.fillStyle = GL;
    for (let k = 0; k < 3; k++) c.fillRect(fx0 - 8 + k * 4, y - 6 - k * 6, sx1 - fx0 + 16 - k * 8, 7);
  }, { t: 5.2, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // the columns, one by one: eight on the west front, sixteen more down the side,
  // a gap in the middle where they fell
  const cols = [];
  for (let i = 0; i < 8; i++) cols.push([fx0 + 8 + i * ((fx1 - fx0 - 16) / 7), ch, cw]);
  const sideBroken = { 6: 46, 7: 0, 8: 22, 9: 84 };
  for (let i = 1; i <= 16; i++) {
    const x = fx1 - 8 + i * ((sx1 - 8 - (fx1 - 8)) / 16);
    const h = sideBroken[i - 1] ?? ch - i * 0.6;
    if (h > 0) cols.push([x, h, cw - i * 0.12]);
  }
  const yb = y - 18;
  cols.forEach(([x, h, w], i) => {
    p.group('build', { x: x - w, y: yb - h - 4, w: 2 * w, h: h + 6 }, (c) => {
      c.fillStyle = GL; c.beginPath();
      if (h < ch - 20) { // a broken stump, ragged on top
        c.moveTo(x - w / 2, yb); c.lineTo(x - w * 0.46, yb - h + 3); c.lineTo(x - 1, yb - h - 2); c.lineTo(x + w * 0.2, yb - h + 4); c.lineTo(x + w * 0.46, yb - h); c.lineTo(x + w / 2, yb); c.closePath();
      } else column(c, x, yb, h, w);
      c.fill();
    }, { t: 5.5 + i * 0.07, d: 0.7, reveal: 'rise' });
  });
  // the entablature, the side broken where the columns fell, and the west pediment
  const sideX = (i) => fx1 - 8 + i * ((sx1 - 8 - (fx1 - 8)) / 16);
  const brk0 = sideX(5) + 6, brk1 = sideX(10) - 4;
  p.group('build', { x: fx0 - 12, y: topC - 80, w: sx1 - fx0 + 26, h: 86 }, (c) => {
    c.fillStyle = GL; c.beginPath();
    c.moveTo(fx0 - 6, topC); c.lineTo(fx0 - 6, topC - 32); c.lineTo(brk0, topC - 32); c.lineTo(brk0 + 8, topC - 22); c.lineTo(brk0 - 4, topC - 12); c.lineTo(brk0 + 6, topC); c.closePath();
    c.moveTo(brk1, topC); c.lineTo(brk1 - 6, topC - 16); c.lineTo(brk1 + 4, topC - 32); c.lineTo(sx1 + 6, topC - 32); c.lineTo(sx1 + 6, topC); c.closePath();
    // the pediment over the front
    c.moveTo(fx0 - 10, topC - 32); c.lineTo((fx0 + fx1) / 2, topC - 76); c.lineTo(fx1 + 8, topC - 32); c.closePath();
    c.fill();
  }, { t: 7.0, d: 0.7, reveal: 'drop', dy: 30 });
  // scratched details: flutes, the architrave, triglyphs, the pediment's frame and its figures
  const segs = [];
  for (const [x, h, w] of cols) if (h >= ch - 20) flutes(segs, x, yb, h, w);
  for (let k = 0; k < 3; k++) segs.push([[fx0 - 6 + k * 4, y - 6 - k * 6], [sx1 + 6 - k * 4, y - 6 - k * 6]]);
  segs.push([[fx0 - 4, topC - 14], [brk0 - 2, topC - 14]], [[brk1 + 2, topC - 14], [sx1 + 4, topC - 14]]);
  for (let x = fx0; x < sx1; x += 9) if (x < brk0 - 4 || x > brk1 + 6) segs.push([[x, topC - 30], [x, topC - 17]], [[x + 3, topC - 30], [x + 3, topC - 17]]);
  const mx = (fx0 + fx1) / 2;
  segs.push([[fx0 - 2, topC - 35], [mx, topC - 71], [fx1, topC - 35], [fx0 - 2, topC - 35]]);
  // a few reclining and standing figures in the pediment, as scratched strokes
  for (const [dx, h] of [[-44, 6], [-30, 12], [-16, 20], [-4, 26], [8, 24], [22, 16], [36, 9]]) segs.push([[mx + dx, topC - 38], [mx + dx + 2, topC - 38 - h]]);
  p.strokes('incise', segs, INC, 1.1, { t: 7.6, d: 1.0, reveal: 'wipe', ease: 'inOut', box: { x: fx0 - 14, y: topC - 80, w: sx1 - fx0 + 28, h: ch + 104 } });
}

// ================================================================ the Plaka: white houses with red roofs at the foot
function plaka(p, r) {
  const houses = [];
  const rr = rng(88);
  for (const [y0, xa, xb, s] of [[1110, 520, 1160, 0.8], [1150, 480, 1210, 1]]) {
    for (let x = xa; x < xb;) {
      const w = rr.range(26, 46) * s, h = rr.range(18, 32) * s;
      houses.push({ x, y: y0, w, h, roof: rr.chance(0.7), win: rr.int(1, 3), door: rr.chance(0.6), tree: rr.chance(0.28) });
      x += w + rr.range(2, 14) * s;
    }
  }
  const rows = [houses.filter((h) => h.y < 1140), houses.filter((h) => h.y >= 1140)];
  rows.forEach((row, k) => {
    const b = { x: 470, y: row[0].y - 60, w: 760, h: 64 };
    p.group('white', b, (c) => {
      // olive and cypress trees behind, black with a scratched edge
      for (const hh of row) if (hh.tree) {
        const tx = hh.x + hh.w + 4, ty = hh.y;
        c.fillStyle = GL2; c.beginPath(); c.ellipse(tx, ty - 22 * (k ? 1 : 0.8), 7, 22 * (k ? 1 : 0.8), 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = INC; c.lineWidth = 0.9; c.stroke();
      }
      c.fillStyle = WHITE; c.beginPath();
      for (const hh of row) c.rect(hh.x, hh.y - hh.h, hh.w, hh.h);
      c.fill();
      c.fillStyle = RED; c.beginPath();
      for (const hh of row) if (hh.roof) { c.moveTo(hh.x - 3, hh.y - hh.h + 1); c.lineTo(hh.x + hh.w * 0.5, hh.y - hh.h - hh.w * 0.28); c.lineTo(hh.x + hh.w + 3, hh.y - hh.h + 1); c.closePath(); }
      c.fill();
      c.fillStyle = GL; c.beginPath();
      for (const hh of row) {
        const ww = 4 * (k ? 1 : 0.8);
        for (let i = 0; i < hh.win; i++) c.rect(hh.x + (i + 0.5) * (hh.w / hh.win) - ww / 2, hh.y - hh.h * 0.72, ww, ww * 1.4);
        if (hh.door) c.rect(hh.x + hh.w * 0.7, hh.y - hh.h * 0.42, ww * 1.2, hh.h * 0.42);
      }
      c.fill();
    }, { t: 6.6 + k * 0.5, d: 0.9, reveal: 'rise' });
  });
}

// ================================================================ the Olympieion: tall columns, one fallen
function olympieion(p) {
  const yb = FY1, cols = [];
  for (let i = 0; i < 5; i++) cols.push([1262 + i * 30, yb, 250, 17]);
  for (let i = 0; i < 4; i++) cols.push([1277 + i * 30, yb - 12, 236, 15]);
  cols.push([1426, yb, 232, 16]);
  // the back row first, so the front row stands over it
  const order = [5, 6, 7, 8, 0, 1, 2, 3, 4, 9];
  order.forEach((ci, n) => {
    const [x, y, h, w] = cols[ci];
    p.group('build', { x: x - w * 1.2, y: y - h - 6, w: w * 2.4, h: h + 8 }, (c) => {
      c.fillStyle = ci >= 5 && ci <= 8 ? GL2 : GL;
      c.beginPath();
      c.moveTo(x - w / 2, y); c.lineTo(x - w * 0.42, y - h + 26);
      // the Corinthian bell, flaring
      c.lineTo(x - w * 0.8, y - h + 4); c.lineTo(x - w * 0.9, y - h); c.lineTo(x + w * 0.9, y - h); c.lineTo(x + w * 0.8, y - h + 4);
      c.lineTo(x + w * 0.42, y - h + 26); c.lineTo(x + w / 2, y); c.closePath(); c.fill();
      c.strokeStyle = INC; c.lineWidth = 1; c.beginPath();
      c.moveTo(x - w * 0.5, y - 1); c.lineTo(x - w * 0.42, y - h + 26); c.lineTo(x - w * 0.8, y - h + 4); c.lineTo(x - w * 0.9, y - h); c.lineTo(x + w * 0.9, y - h); c.lineTo(x + w * 0.8, y - h + 4); c.lineTo(x + w * 0.42, y - h + 26); c.lineTo(x + w * 0.5, y - 1);
      c.moveTo(x - w * 0.15, y - 4); c.lineTo(x - w * 0.12, y - h + 28); c.moveTo(x + w * 0.15, y - 4); c.lineTo(x + w * 0.12, y - h + 28);
      // acanthus curls on the bell
      c.moveTo(x - w * 0.5, y - h + 14); c.quadraticCurveTo(x - w * 0.8, y - h + 8, x - w * 0.6, y - h + 3);
      c.moveTo(x + w * 0.5, y - h + 14); c.quadraticCurveTo(x + w * 0.8, y - h + 8, x + w * 0.6, y - h + 3);
      c.moveTo(x, y - h + 22); c.lineTo(x, y - h + 8);
      c.stroke();
    }, { t: 5.8 + n * 0.09, d: 0.8, reveal: 'rise' });
  });
  // the architrave still lying across the corner group
  p.group('build', { x: 1240, y: yb - 274, w: 150, h: 28 }, (c) => {
    c.fillStyle = GL; c.fillRect(1246, yb - 268, 138, 18);
    c.strokeStyle = INC; c.lineWidth = 1; c.beginPath(); c.moveTo(1248, yb - 259); c.lineTo(1382, yb - 259); c.stroke();
  }, { t: 6.9, d: 0.6, reveal: 'drop' });
  // the fallen column: its drums in a row
  p.group('build', { x: 1340, y: yb - 26, w: 120, h: 28 }, (c) => {
    c.fillStyle = GL; c.strokeStyle = INC; c.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const x = 1346 + i * 18; c.beginPath(); c.ellipse(x + 8, yb - 11, 9, 11, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
  }, { t: 7.0, d: 0.6, reveal: 'pop' });
}

// ================================================================ the olive boughs from the top corners
function bough(r, root, ctrl, side) {
  const stem = curve([root, ...ctrl], 6);
  const leaves = [], twigs = [], olives = [];
  for (let i = 2; i < stem.length - 1; i += 2) {
    const [x, y] = stem[i], [nx, ny] = stem[i + 1];
    const a = Math.atan2(ny - y, nx - x);
    for (const sgn of [-1, 1]) {
      const la = a + sgn * r.range(0.5, 0.95), L = r.range(34, 52) * (1 - i / stem.length * 0.4);
      leaves.push([x + Math.cos(la) * L * 0.5, y + Math.sin(la) * L * 0.5, L / 2, L * 0.12, la, r.chance(0.35)]);
    }
    if (i % 6 === 0 && i > 3) {
      const ta = a + (i % 12 === 0 ? 1 : -1) * 0.8 * side, tl = r.range(50, 80);
      const tp = [[x, y], [x + Math.cos(ta) * tl * 0.5, y + Math.sin(ta) * tl * 0.5 + 4], [x + Math.cos(ta) * tl, y + Math.sin(ta) * tl]];
      twigs.push(tp);
      for (let k = 1; k <= 2; k++) {
        const [tx, ty] = tp[k];
        for (const sgn of [-1, 1]) { const la = ta + sgn * 0.8, L = r.range(26, 38); leaves.push([tx + Math.cos(la) * L * 0.5, ty + Math.sin(la) * L * 0.5, L / 2, L * 0.12, la, r.chance(0.3)]); }
        if (r.chance(0.7)) olives.push([tx + r.range(-6, 6), ty + r.range(6, 12), r.range(5, 6.5)]);
      }
    }
  }
  return { stem, leaves, twigs, olives };
}
function olives(p, r) {
  const L = bough(r, [PX0 - 4, 360], [[210, 400], [290, 432], [370, 470], [430, 520], [470, 582]], 1);
  const R = bough(r, [PX1 + 4, 330], [[1390, 372], [1320, 398], [1250, 410], [1196, 440]], -1);
  [L, R].forEach((b, k) => {
    const t0 = 8.0 + k * 0.4;
    p.mark('olive', {
      t: t0, d: 1.4, reveal: 'draw', ease: 'inOut', box: boxOf(b.stem, 12),
      draw: (c, q) => { const n = Math.max(2, Math.ceil(b.stem.length * q)); c.fillStyle = GL; c.beginPath(); limb(b.stem.slice(0, n), b.stem.slice(0, n).map((_, i) => lerp(12, 4, i / b.stem.length))).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); },
    });
    p.strokes('olive', b.twigs, GL, 3.5, { t: t0 + 0.6, d: 0.8, reveal: 'fade' });
    // leaves in a few batches along the stem, each a black lance with a scratched midrib
    const per = Math.ceil(b.leaves.length / 5);
    for (let g = 0; g < 5; g++) {
      const ls = b.leaves.slice(g * per, (g + 1) * per);
      if (!ls.length) continue;
      const pts = []; for (const [x, y, a] of ls) pts.push([x - a, y - a], [x + a, y + a]);
      p.group('olive', boxOf(pts, 10), (c) => {
        for (const [x, y, a, bb, ang, red] of ls) {
          c.fillStyle = red ? RED : GL; c.beginPath(); c.ellipse(x, y, a, bb, ang, 0, Math.PI * 2); c.fill();
        }
        c.strokeStyle = INC; c.lineWidth = 0.9; c.beginPath();
        for (const [x, y, a, , ang] of ls) { c.moveTo(x - Math.cos(ang) * a * 0.8, y - Math.sin(ang) * a * 0.8); c.lineTo(x + Math.cos(ang) * a * 0.75, y + Math.sin(ang) * a * 0.75); }
        c.stroke();
      }, { t: t0 + 0.3 + g * 0.2, d: 0.6, reveal: 'pop' });
    }
    p.group('olive', boxOf(b.olives.length ? b.olives.map(([x, y]) => [x, y]) : b.stem, 12), (c) => {
      for (const [x, y, s] of b.olives) {
        c.fillStyle = GL; c.beginPath(); c.ellipse(x, y, s, s * 1.3, 0.2, 0, Math.PI * 2); c.fill();
        c.fillStyle = WHITE; c.beginPath(); c.arc(x - s * 0.35, y - s * 0.4, 1.6, 0, Math.PI * 2); c.fill();
      }
    }, { t: t0 + 1.4, d: 0.5, reveal: 'pop' });
  });
  // labels written in the field, as vase painters named what they drew
  p.type('olive', 'ΠΑΡΘΕΝΩΝ', 915, 380, { family: F, weight: 600, size: 26, color: GL, align: 'center', track: 0.32, t: 9.6, gap: 0.06, d: 0.4, reveal: 'fade' });
  p.type('olive', 'ΛΥΚΑΒΗΤΤΟΣ', 1300, 530, { family: F, weight: 600, size: 19, color: GL, align: 'center', track: 0.24, t: 10.0, gap: 0.05, d: 0.4, reveal: 'fade' });
  p.type('olive', 'ΕΡΕΧΘΕΙΟΝ', 590, 686, { family: F, weight: 600, size: 19, color: GL, align: 'center', track: 0.24, t: 10.2, gap: 0.05, d: 0.4, reveal: 'fade' });
  // filler rosettes in the empty field, as the old painters scattered them
  const ros = [[214, 600, 15], [300, 704, 11], [196, 812, 12], [262, 896, 8], [600, 360, 10], [1222, 560, 9], [700, 470, 8], [1110, 352, 9]];
  p.group('olive', { x: 170, y: 330, w: 1080, h: 590 }, (c) => {
    for (const [x, y, rad] of ros) {
      c.fillStyle = GL; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INC; c.lineWidth = 1; c.beginPath();
      for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI; c.moveTo(x + Math.cos(a) * rad * 0.8, y + Math.sin(a) * rad * 0.8); c.lineTo(x - Math.cos(a) * rad * 0.8, y - Math.sin(a) * rad * 0.8); }
      c.moveTo(x + rad * 0.35, y); c.arc(x, y, rad * 0.35, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = RED; c.beginPath(); c.arc(x, y, rad * 0.2, 0, Math.PI * 2); c.fill();
    }
  }, { t: 10.9, d: 0.6, reveal: 'fade' });
}

// ================================================================ the frieze: figures walking to the right, then a ship
// a figure's limbs and body as outlines, facing right, its feet at (x, RG): the
// broad chest and thick thighs of the black-figure painters
function bodyParts(f) {
  const { x, s } = f;
  const P = ([px, py]) => [x + px * s, RG + py * s];
  const parts = [];
  for (const leg of f.legs) parts.push(limb(leg.map(P), [20, 13, 8, 6].map((w) => w * s)));
  for (const arm of f.arms) parts.push(limb(arm.map(P), [12, 9, 6.5].map((w) => w * s)));
  const [nx, ny] = f.neck, [hx, hy] = f.hip;
  parts.push([P([nx - 16, ny + 2]), P([nx + 15, ny + 6]), P([hx + 10, hy]), P([hx - 11, hy])]);
  return parts;
}
function frieze(p, r) {
  const figs = [];
  // a skirt shape: waist to hem, flared, with its folds
  const skirt = (hip, hem, w0, w1, lean = 0) => [[hip[0] - w0, hip[1] - 4], [hip[0] + w0, hip[1] - 4], [hip[0] + w1 + lean, hem], [hip[0] - w1 + lean, hem]];
  // 1. an evzone of the guard, high-stepping, rifle on his shoulder, in a pleated kilt
  figs.push({
    x: 236, s: 1.08, neck: [2, -128], hip: [0, -76], head: [6, -142], bonnet: true, white: 'kilt',
    legs: [[[0, -74], [-6, -42], [-12, -8], [-2, -2]], [[2, -74], [26, -60], [36, -34], [46, -34]]],
    arms: [[[-6, -124], [-16, -100], [-8, -82]], [[8, -124], [22, -104], [18, -118]]],
    skirt: skirt([0, -76], -42, 11, 30), pom: [[-2, -4], [48, -36]], rifle: [[20, -112], [-22, -206]],
  });
  // 2. a woman carrying a water jar on her head, in a long robe
  figs.push({
    x: 410, s: 1.08, female: true, neck: [2, -130], hip: [0, -78], head: [6, -144],
    legs: [[[0, -76], [-4, -42], [-8, -6], [2, -2]], [[2, -76], [12, -42], [18, -6], [28, -4]]],
    arms: [[[8, -124], [16, -144], [14, -172]], [[-4, -124], [8, -100], [22, -96]]],
    skirt: skirt([0, -78], -4, 12, 24, 6), jar: [8, -166],
  });
  // 3. a lyre player
  figs.push({
    x: 560, s: 1.08, neck: [2, -130], hip: [0, -78], head: [6, -144], beard: true,
    legs: [[[0, -76], [-8, -42], [-14, -6], [-4, -2]], [[2, -76], [18, -44], [22, -6], [32, -4]]],
    arms: [[[6, -124], [22, -106], [32, -118]], [[-4, -124], [-2, -100], [14, -110]]],
    skirt: skirt([0, -78], -36, 12, 22), lyre: [30, -110],
  });
  // 4. the torch runner, leaning in
  figs.push({
    x: 712, s: 1.08, neck: [14, -124], hip: [0, -76], head: [22, -138], torch: [46, -150],
    legs: [[[0, -74], [-22, -52], [-46, -36], [-40, -30]], [[2, -74], [24, -50], [14, -10], [26, -6]]],
    arms: [[[18, -120], [34, -134], [44, -146]], [[8, -120], [-10, -104], [-22, -112]]],
  });
  // 5. a rider on a walking horse
  figs.push({ x: 820, s: 1, horse: true });
  // 6. a seller of bread rings with a tray on his head
  figs.push({
    x: 1020, s: 1.08, neck: [2, -128], hip: [0, -76], head: [6, -142], beard: true,
    legs: [[[0, -74], [-8, -40], [-12, -6], [-2, -2]], [[2, -74], [16, -40], [22, -6], [32, -4]]],
    arms: [[[8, -124], [14, -146], [10, -162]], [[-6, -124], [-12, -104], [-2, -88]]],
    skirt: skirt([0, -76], -40, 11, 20), tray: [8, -162],
  });
  for (const f of figs) if (!f.horse) f.parts = bodyParts(f);
  figs.forEach((f, i) => {
    const bx = f.horse ? f.x - 10 : f.x - 70;
    const bw = f.horse ? 180 : 140;
    p.group('frieze', { x: bx, y: RY0, w: bw, h: RY1 - RY0 }, (c) => drawFigure(c, f), { t: 8.4 + i * 0.32, d: 0.9, reveal: 'slide', dx: -40, ease: 'out' });
    p.group('fincise', { x: bx, y: RY0, w: bw, h: RY1 - RY0 }, (c) => scratchFigure(c, f), { t: 9.0 + i * 0.32, d: 0.6, reveal: 'fade' });
  });
  // the sea at the end of the frieze: scratched waves under the ship
  const waves = [];
  for (let k = 0; k < 4; k++) for (let x = 1150; x < PX1 - 10; x += 26) waves.push([[x, RG - 4 - k * 9 + (k % 2) * 4], [x + 8, RG - 8 - k * 9 + (k % 2) * 4], [x + 16, RG - 4 - k * 9 + (k % 2) * 4]]);
  p.strokes('frieze', waves, GL, 2, { t: 9.6, d: 0.8, reveal: 'wipe', box: { x: 1140, y: RG - 50, w: PX1 - 1140, h: 50 } });
  // a dolphin leaping between rider and ship
  p.group('frieze', { x: 1090, y: RY0 + 60, w: 80, h: 70 }, (c) => {
    c.fillStyle = GL; c.beginPath();
    c.moveTo(1098, RY0 + 118); c.quadraticCurveTo(1112, RY0 + 72, 1150, RY0 + 76); c.lineTo(1164, RY0 + 70); c.lineTo(1158, RY0 + 82);
    c.quadraticCurveTo(1126, RY0 + 86, 1108, RY0 + 122); c.lineTo(1094, RY0 + 128); c.lineTo(1100, RY0 + 120); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(1124, RY0 + 82); c.lineTo(1128, RY0 + 66); c.lineTo(1136, RY0 + 80); c.fill();
    c.fillStyle = WHITE; c.beginPath(); c.arc(1148, RY0 + 79, 1.6, 0, Math.PI * 2); c.fill();
  }, { t: 10.2, d: 0.6, reveal: 'pop' });
}

function drawFigure(c, f) {
  if (f.horse) return drawHorse(c, f.x);
  const { x, s } = f;
  const P = ([px, py]) => [x + px * s, RG + py * s];
  const skin = f.female ? WHITE : GL;
  // the limbs and body, black (a woman's skin in added white, her robe black)
  c.fillStyle = skin;
  for (const part of f.parts) { path(c, part); c.fill(); }
  c.fillStyle = GL;
  if (f.skirt && f.female) { path(c, f.skirt.map(P)); c.fill(); }
  if (f.female) { c.fillStyle = GL; path(c, [P([f.neck[0] - 13, f.neck[1] + 4]), P([f.neck[0] + 13, f.neck[1] + 6]), P([f.hip[0] + 12, f.hip[1]]), P([f.hip[0] - 12, f.hip[1]])]); c.fill(); }
  // the head: round, a nose, a chin, hair behind
  const [hx, hy] = P(f.head);
  c.fillStyle = skin; c.beginPath(); c.arc(hx, hy, 11 * s, 0, Math.PI * 2); c.fill();
  path(c, [[hx + 8 * s, hy - 4 * s], [hx + 15 * s, hy + 2 * s], [hx + 8 * s, hy + 5 * s]]); c.fill();
  c.fillStyle = GL;
  c.beginPath(); c.arc(hx - 3 * s, hy - 3 * s, 10 * s, Math.PI * 0.75, Math.PI * 1.9); c.lineTo(hx - 4 * s, hy); c.closePath(); c.fill();
  if (f.female) { c.beginPath(); c.arc(hx - 10 * s, hy - 4 * s, 6 * s, 0, Math.PI * 2); c.fill(); }
  if (f.beard) { path(c, [[hx - 2 * s, hy + 4 * s], [hx + 10 * s, hy + 6 * s], [hx + 6 * s, hy + 18 * s], [hx - 4 * s, hy + 10 * s]]); c.fill(); }
  // the kilt of the evzone, in added white, and his fez with its long tassel
  if (f.skirt && !f.female) { c.fillStyle = f.white === 'kilt' ? WHITE : GL; path(c, f.skirt.map(P)); c.fill(); }
  if (f.bonnet) {
    c.fillStyle = RED; path(c, [[hx - 10 * s, hy - 6 * s], [hx + 8 * s, hy - 8 * s], [hx + 6 * s, hy - 16 * s], [hx - 8 * s, hy - 15 * s]]); c.fill();
    c.strokeStyle = GL; c.lineWidth = 2.4 * s; c.beginPath(); c.moveTo(hx - 6 * s, hy - 14 * s); c.quadraticCurveTo(hx - 22 * s, hy - 10 * s, hx - 18 * s, hy + 12 * s); c.stroke();
  }
  if (f.pom) { c.fillStyle = GL; for (const pt of f.pom) { const [px, py] = P(pt); c.beginPath(); c.arc(px + 4 * s, py, 5 * s, 0, Math.PI * 2); c.fill(); } }
  if (f.rifle) { const [a, b] = f.rifle.map(P); c.strokeStyle = GL; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.lineWidth = 7 * s; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(lerp(a[0], b[0], 0.3), lerp(a[1], b[1], 0.3)); c.stroke(); }
  if (f.jar) {
    // a hydria on her head: added red belly, black neck and lip
    const [jx, jy] = P(f.jar);
    c.fillStyle = GL; c.beginPath(); c.ellipse(jx, jy - 4, 20 * s, 16 * s, 0, 0, Math.PI * 2); c.fill();
    c.fillRect(jx - 6 * s, jy - 28 * s, 12 * s, 12 * s); c.fillRect(jx - 10 * s, jy - 30 * s, 20 * s, 4 * s);
    c.fillStyle = RED; c.fillRect(jx - 18 * s, jy - 6 * s, 36 * s, 4 * s);
  }
  if (f.lyre) {
    const [lx, ly] = P(f.lyre);
    c.strokeStyle = GL; c.lineWidth = 3 * s; c.beginPath();
    c.moveTo(lx - 10 * s, ly + 10 * s); c.quadraticCurveTo(lx - 22 * s, ly - 20 * s, lx - 6 * s, ly - 40 * s);
    c.moveTo(lx + 10 * s, ly + 10 * s); c.quadraticCurveTo(lx + 22 * s, ly - 20 * s, lx + 8 * s, ly - 40 * s);
    c.moveTo(lx - 12 * s, ly - 32 * s); c.lineTo(lx + 14 * s, ly - 32 * s); c.stroke();
    c.fillStyle = GL; c.beginPath(); c.ellipse(lx, ly + 10 * s, 13 * s, 8 * s, 0, 0, Math.PI * 2); c.fill();
    c.lineWidth = 0.8 * s; c.beginPath(); for (const k of [-6, -2, 2, 6]) { c.moveTo(lx + k * s, ly + 6 * s); c.lineTo(lx + k * s, ly - 32 * s); } c.stroke();
  }
  if (f.torch) { const [tx, ty] = P(f.torch); c.strokeStyle = GL; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(tx - 6 * s, ty + 16 * s); c.lineTo(tx, ty); c.stroke(); }
  if (f.tray) {
    const [tx, ty] = P(f.tray);
    c.fillStyle = GL; c.fillRect(tx - 34 * s, ty - 4 * s, 68 * s, 5 * s);
    c.strokeStyle = GL; c.lineWidth = 3.4 * s;
    for (const [dx, dy] of [[-22, -10], [-6, -10], [10, -10], [26, -10], [-14, -22], [2, -22], [18, -22], [-6, -33], [10, -33]]) { c.beginPath(); c.ellipse(tx + dx * s, ty + dy * s, 7.5 * s, 5 * s, 0, 0, Math.PI * 2); c.stroke(); }
  }
}
function scratchFigure(c, f) {
  if (f.horse) return scratchHorse(c, f.x);
  const { x, s } = f;
  const P = ([px, py]) => [x + px * s, RG + py * s];
  const [hx, hy] = P(f.head);
  c.strokeStyle = f.female ? GL : INC; c.lineWidth = 1 * s;
  // the eye, an almond; the ear and the line of the hair
  c.beginPath(); c.ellipse(hx + 4 * s, hy - 2 * s, 3 * s, 1.5 * s, 0, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = INC; c.beginPath();
  if (!f.female) { c.arc(hx - 3 * s, hy - 1 * s, 7 * s, -Math.PI * 0.4, Math.PI * 0.5); }
  // the chest and the knees
  const [nx, ny] = P(f.neck), [px, py] = P(f.hip);
  if (!f.female) { c.moveTo(nx - 6 * s, ny + 14 * s); c.quadraticCurveTo(nx + 4 * s, ny + 22 * s, nx + 10 * s, ny + 14 * s); c.moveTo(px - 8 * s, py - 6 * s); c.lineTo(px + 8 * s, py - 6 * s); }
  for (const leg of f.legs) { const [kx, ky] = P(leg[1]); c.moveTo(kx - 3 * s, ky); c.arc(kx, ky, 3 * s, Math.PI, Math.PI * 2); }
  c.stroke();
  // folds in the robe or the kilt
  if (f.skirt) {
    const [a, b, cc, d] = f.skirt.map(P);
    c.strokeStyle = f.white === 'kilt' ? GL : INC; c.lineWidth = 0.9 * s; c.beginPath();
    const n = f.white === 'kilt' ? 9 : 6;
    for (let i = 1; i < n; i++) { const t = i / n; c.moveTo(lerp(a[0], b[0], t), lerp(a[1], b[1], t) + 2); c.lineTo(lerp(d[0], cc[0], t), lerp(d[1], cc[1], t) - 2); }
    if (f.female) { c.moveTo(d[0] + 2, d[1] - 10 * s); c.lineTo(cc[0] - 2, cc[1] - 10 * s); }
    c.stroke();
    if (f.female) { c.fillStyle = RED; c.fillRect(Math.min(d[0], cc[0]) + 4, d[1] - 9 * s, Math.abs(cc[0] - d[0]) - 8, 4 * s); }
  }
}
// a horse walking right with its rider, x is the hind foot
function horseShape(x) {
  const y = RG;
  return [[x + 6, y], [x + 12, y - 40], [x + 4, y - 66], [x + 10, y - 88], [x + 30, y - 98], [x + 96, y - 100], [x + 118, y - 112], [x + 132, y - 142], [x + 142, y - 154], [x + 156, y - 150], [x + 168, y - 126], [x + 162, y - 120], [x + 146, y - 130], [x + 134, y - 104], [x + 122, y - 80], [x + 124, y - 40], [x + 134, y - 2], [x + 124, y - 2], [x + 112, y - 44], [x + 104, y - 66], [x + 90, y - 64], [x + 96, y - 30], [x + 100, y], [x + 90, y], [x + 82, y - 32], [x + 70, y - 64], [x + 40, y - 64], [x + 32, y - 40], [x + 20, y - 2], [x + 10, y - 2], [x + 22, y - 44], [x + 18, y - 64], [x + 18, y - 40], [x + 14, y]];
}
function drawHorse(c, x) {
  const y = RG;
  c.fillStyle = GL; path(c, horseShape(x)); c.fill();
  // the tail and mane
  c.strokeStyle = GL; c.lineWidth = 6; c.beginPath(); c.moveTo(x + 10, y - 86); c.quadraticCurveTo(x - 10, y - 70, x - 4, y - 34); c.stroke();
  // the rider: torso, head, a short cloak in added red, his leg along the flank
  c.fillStyle = GL;
  path(c, limb([[x + 62, y - 96], [x + 76, y - 76], [x + 80, y - 50], [x + 84, y - 44]], [13, 10, 7, 6])); c.fill();
  path(c, [[x + 54, y - 100], [x + 76, y - 100], [x + 78, y - 150], [x + 62, y - 154]]); c.fill();
  c.beginPath(); c.arc(x + 76, y - 166, 11, 0, Math.PI * 2); c.fill();
  path(c, [[x + 84, y - 170], [x + 91, y - 164], [x + 84, y - 161]]); c.fill();
  path(c, limb([[x + 72, y - 146], [x + 92, y - 128], [x + 120, y - 126]], [9, 7, 5])); c.fill();
  c.fillStyle = RED; path(c, [[x + 54, y - 150], [x + 70, y - 152], [x + 64, y - 112], [x + 42, y - 108]]); c.fill();
}
function scratchHorse(c, x) {
  const y = RG;
  c.strokeStyle = INC; c.lineWidth = 1.1; c.beginPath();
  // the bridle and rein, the mane's edge, the shoulder and haunch, the eye
  c.moveTo(x + 150, y - 146); c.lineTo(x + 160, y - 128); c.moveTo(x + 152, y - 134); c.lineTo(x + 120, y - 126);
  for (let i = 0; i < 6; i++) { c.moveTo(x + 122 + i * 4, y - 108 - i * 7); c.lineTo(x + 128 + i * 4, y - 112 - i * 7); }
  c.moveTo(x + 118, y - 70); c.quadraticCurveTo(x + 104, y - 92, x + 118, y - 100);
  c.moveTo(x + 30, y - 70); c.quadraticCurveTo(x + 18, y - 90, x + 40, y - 96);
  c.moveTo(x + 79, y - 168); c.ellipse(x + 80, y - 168, 3, 1.5, 0, 0, Math.PI * 2);
  c.moveTo(x + 152, y - 144); c.arc(x + 150, y - 144, 2, 0, Math.PI * 2);
  c.stroke();
}

// ================================================================ the living things
function life(p, r) {
  // an owl on the left bough: it blinks and turns its head
  const ox = 360, oy = 452;
  p.live('owl', {
    t: 9.4, d: 0.8, reveal: 'drop', dy: 26, box: { x: ox - 40, y: oy - 90, w: 80, h: 100 },
    draw: (c, time) => {
      const turn = Math.sin(time * 0.6) > 0.7 ? 1 : 0;
      const blink = (time % 3.7) < 0.14;
      c.fillStyle = GL;
      c.beginPath(); c.ellipse(ox, oy - 26, 19, 28, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(ox - 8, oy - 2); c.lineTo(ox, oy + 10); c.lineTo(ox + 8, oy - 2); c.fill();
      const hx = ox + (turn ? 4 : 0);
      c.beginPath(); c.arc(hx, oy - 60, 16, 0, Math.PI * 2); c.fill();
      // the big eyes in added white, the wing scratched, the feet on the bough
      c.fillStyle = WHITE;
      if (blink) { c.fillRect(hx - 11, oy - 62, 8, 2); c.fillRect(hx + 3, oy - 62, 8, 2); }
      else { c.beginPath(); c.arc(hx - 7, oy - 62, 5.5, 0, Math.PI * 2); c.arc(hx + 7, oy - 62, 5.5, 0, Math.PI * 2); c.fill(); c.fillStyle = GL; c.beginPath(); c.arc(hx - 7 + turn * 2, oy - 62, 2.4, 0, Math.PI * 2); c.arc(hx + 7 + turn * 2, oy - 62, 2.4, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = RED; c.beginPath(); c.moveTo(hx - 2, oy - 56); c.lineTo(hx, oy - 50); c.lineTo(hx + 2, oy - 56); c.fill();
      c.strokeStyle = INC; c.lineWidth = 1; c.beginPath();
      c.moveTo(ox - 12, oy - 38); c.quadraticCurveTo(ox - 16, oy - 14, ox - 4, oy - 2);
      for (let i = 0; i < 3; i++) { c.moveTo(ox - 2 + i * 5, oy - 34 + i * 3); c.arc(ox - 4 + i * 5, oy - 34 + i * 3, 2.5, 0, Math.PI); }
      for (let i = 0; i < 3; i++) { c.moveTo(ox + 1 + i * 5, oy - 22 + i * 3); c.arc(ox - 1 + i * 5, oy - 22 + i * 3, 2.5, 0, Math.PI); }
      c.stroke();
    },
  });
  // swallows crossing the upper field
  const sw = [[0.0, 520, 1], [2.1, 470, 0.85], [4.3, 560, 0.75]];
  p.live('birds', {
    t: 9.8, d: 1.0, reveal: 'fade', box: { x: PX0, y: FY0, w: PX1 - PX0, h: 500 },
    draw: (c, time) => {
      c.save(); c.beginPath(); c.rect(PX0, FY0, PX1 - PX0, FY1 - FY0); c.clip();
      c.fillStyle = GL;
      for (const [ph, y0, s] of sw) {
        const u = ((time * 0.055 + ph * 0.19) % 1);
        const x = lerp(PX0 - 60, PX1 + 60, u), y = y0 + Math.sin(u * 9 + ph) * 40;
        const f = Math.sin(time * 7 + ph * 3);
        c.save(); c.translate(x, y); c.scale(s, s);
        // a body, a forked tail, two swept wings beating
        c.beginPath(); c.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(11, -1, 4.4, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.moveTo(14, -2); c.lineTo(20, 0); c.lineTo(14, 1); c.fill();
        c.beginPath(); c.moveTo(-9, -1); c.lineTo(-30, -8); c.lineTo(-17, 0); c.lineTo(-30, 8); c.lineTo(-9, 2); c.closePath(); c.fill();
        const up = 0.35 + 0.65 * (0.5 + 0.5 * f);
        c.beginPath(); c.moveTo(6, -2); c.quadraticCurveTo(-2, -16 * up, -26, -26 * up); c.quadraticCurveTo(-10, -9 * up, -6, -1); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(6, 1); c.quadraticCurveTo(-2, 10 * up, -22, 16 * up); c.quadraticCurveTo(-8, 6 * up, -6, 2); c.closePath(); c.fill();
        c.restore();
      }
      c.restore();
    },
  });
  // the ship: a black hull with an eye on its prow, a white sail, oars rowing
  const sx = 1210, sy = RG - 14;
  p.live('ship', {
    t: 10.0, d: 1.0, reveal: 'slide', dx: 60, box: { x: sx - 10, y: RY0, w: PX1 - sx, h: RY1 - RY0 },
    draw: (c, time) => {
      const bob = Math.sin(time * 1.3) * 2;
      c.save(); c.translate(0, bob);
      c.fillStyle = GL; c.beginPath();
      c.moveTo(sx, sy - 34); c.quadraticCurveTo(sx + 6, sy - 6, sx + 30, sy); c.lineTo(sx + 196, sy); c.lineTo(sx + 232, sy - 12); c.lineTo(sx + 214, sy - 14);
      c.lineTo(sx + 206, sy - 26); c.lineTo(sx + 30, sy - 26); c.quadraticCurveTo(sx + 12, sy - 26, sx + 8, sy - 44); c.closePath(); c.fill();
      // the mast, yard and sail
      c.fillRect(sx + 112, sy - 160, 4, 136);
      c.fillRect(sx + 56, sy - 158, 116, 4);
      c.fillStyle = WHITE; c.beginPath(); c.moveTo(sx + 60, sy - 154); c.lineTo(sx + 168, sy - 154); c.quadraticCurveTo(sx + 172, sy - 100, sx + 162, sy - 58); c.lineTo(sx + 66, sy - 58); c.quadraticCurveTo(sx + 56, sy - 100, sx + 60, sy - 154); c.fill();
      c.strokeStyle = GL; c.lineWidth = 1; c.beginPath();
      for (let k = 1; k < 6; k++) { c.moveTo(sx + 58 + k * 18, sy - 152); c.lineTo(sx + 62 + k * 17, sy - 60); }
      for (let k = 1; k < 4; k++) { c.moveTo(sx + 58, sy - 154 + k * 24); c.lineTo(sx + 168, sy - 154 + k * 24); }
      c.stroke();
      // the eye on the prow
      c.fillStyle = WHITE; c.beginPath(); c.ellipse(sx + 206, sy - 12, 6, 3.4, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = GL; c.beginPath(); c.arc(sx + 207, sy - 12, 1.8, 0, Math.PI * 2); c.fill();
      // the oars, sweeping together
      const a = Math.sin(time * 2.2) * 0.28;
      c.strokeStyle = GL; c.lineWidth = 2.2; c.beginPath();
      for (let k = 0; k < 9; k++) { const ox = sx + 48 + k * 17, oy = sy - 10; c.moveTo(ox, oy); c.lineTo(ox - 22 * Math.cos(1.1 + a), oy + 30 * Math.sin(1.1 + a)); }
      c.stroke();
      // the steering oar and a red stripe along the rail
      c.lineWidth = 3; c.beginPath(); c.moveTo(sx + 20, sy - 30); c.lineTo(sx - 4, sy + 6); c.stroke();
      c.fillStyle = RED; c.fillRect(sx + 32, sy - 22, 172, 4);
      c.restore();
    },
  });
  // the runner's torch flame
  const [tx, ty] = [712 + 46 * 1.08, RG - 150 * 1.08];
  p.live('torch', {
    t: 9.6, d: 0.6, reveal: 'fade', box: { x: tx - 20, y: ty - 40, w: 40, h: 44 },
    draw: (c, time) => {
      const f = Math.sin(time * 9) * 3, g = Math.sin(time * 13 + 1) * 2;
      c.fillStyle = RED; c.beginPath(); c.moveTo(tx - 7, ty); c.quadraticCurveTo(tx - 12 + g, ty - 16, tx - 4 + f, ty - 32); c.quadraticCurveTo(tx + 2, ty - 18, tx + 8, ty - 22 + g); c.quadraticCurveTo(tx + 10, ty - 8, tx + 7, ty); c.closePath(); c.fill();
      c.fillStyle = WHITE; c.beginPath(); c.moveTo(tx - 3, ty - 2); c.quadraticCurveTo(tx - 4, ty - 12, tx + f * 0.4, ty - 18); c.quadraticCurveTo(tx + 4, ty - 10, tx + 3, ty - 2); c.closePath(); c.fill();
    },
  });
}

// ================================================================ the title, on the black below
function title(p) {
  const y = 1824;
  p.type('title', 'ΑΘΗΝΑ', W / 2, y, { family: F, weight: 800, size: 250, color: TC, align: 'center', track: 0.1, t: 11.2, gap: 0.2, d: 0.9 });
  p.type('title', 'ATHENS', W / 2, 1904, { family: F, weight: 400, size: 44, color: TC_D, align: 'center', track: 0.7, t: 12.4, gap: 0.08, d: 0.5, reveal: 'fade' });
  // small rules and a palmette either side of ATHENS
  p.group('title', { x: 300, y: 1870, w: 1000, h: 50 }, (c) => {
    c.fillStyle = TC_D;
    c.fillRect(440, 1890, 150, 2); c.fillRect(W - 590, 1890, 150, 2);
    for (const cx of [418, W - 418]) {
      for (let j = -3; j <= 3; j++) { const a = -Math.PI / 2 + j * 0.34, L = 20 - Math.abs(j) * 2; c.beginPath(); c.ellipse(cx + Math.cos(a) * L / 2, 1898 + Math.sin(a) * L / 2, L / 2, 2.6, a, 0, Math.PI * 2); c.fill(); }
      c.beginPath(); c.arc(cx, 1898, 4, 0, Math.PI * 2); c.fill();
    }
  }, { t: 12.9, d: 0.6, reveal: 'fade' });
}
