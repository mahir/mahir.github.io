// Porto: a port-wine label. A cream label in oxblood and gold, ruled and
// engine-turned like a banknote, with an oval vignette engraved in sepia line and
// tinted by hand: the Ribeira's stacked colored houses climbing from the quay to
// the Sé and the Clérigos tower, the iron arch of the Dom Luís I bridge with its
// two decks, the Serra do Pilar's round church, the Douro and rabelo boats laden
// with barrels. The city's motto runs in an arc over the oval, two exhibition
// medals flank the name, and PORTO is set in a fat Didone with a hatched shadow.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, gull, shade } from '../kit.js';

const PAPER = '#efe2c3', INK = '#2b1d17', OX = '#6c1424', OX_D = '#4a0c18';
const GOLD = '#b8913d', GOLD_L = '#e6c97c', GOLD_D = '#7e5f22';
const SKY = '#cfd6cf', RIVER = '#7f9c9b', RIVER_D = '#5a7878';
const TERRA = '#b65a3c', STONE = '#cbbd9f', ROCK = '#9c8f78';
const HOUSES = ['#d9a74a', '#c96f55', '#ece2cb', '#7f97a6', '#8d9b66', '#a8413b', '#dcbf8f', '#e6d6b4', '#6f8fa3', '#cf9a3d'];
const FACE = '"Abril Fatface"', TEXT = '"Old Standard TT"';

export const city = {
  id: 'porto', name: 'Porto', wall: '#2a0f16',
  alt: 'A port-wine label in oxblood and gold: an oval engraving tinted by hand of the Ribeira\'s stacked colored houses climbing from the quay to the Sé cathedral and the Clérigos tower, the iron arch and two decks of the Dom Luís I bridge with a train crossing, the round church of the Serra do Pilar, and rabelo boats laden with barrels on the Douro, under the city\'s motto in an arc, with two medals beside the name PORTO',
  google: 'family=Abril+Fatface&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400',
  fonts: [
    ['400 100px "Abril Fatface"', 'PORTO'],
    ['700 40px "Old Standard TT"', 'MUI NOBRE · SEMPRE LEAL · E INVICTA DOURO PORTUGAL MDCCCLXXXVI PONTE LUIZ I 1886 RABELO RIBEIRA'],
    ['italic 400 40px "Old Standard TT"', 'Vista da Ribeira e da Ponte Luiz I, tomada de Vila Nova de Gaia'],
    ['400 40px "Old Standard TT"', 'Gravado em Vila Nova de Gaia'],
  ],
  build,
};

// the oval vignette
const OX0 = 800, OY0 = 800, RX = 600, RY = 470;
const ovalTop = (x) => OY0 - RY * Math.sqrt(Math.max(0, 1 - ((x - OX0) / RX) ** 2));
const QUAY = 995, WATER = 1005, GAIA = 1165;

function build() {
  const p = new Plate({ paper: PAPER, seed: 1886 });
  const r = p.r;
  p.stack('sky', 'far', 'hill', 'town', 'bridge', 'river', 'sail', 'boats', 'front', 'live', 'mask', 'border', 'type', 'title');
  for (const n of ['mask', 'border', 'type', 'title']) p.layer(n, { clip: false });

  mask(p);
  border(p, r);
  sky(p, r);
  far(p, r);
  hill(p, r);
  town(p, r);
  cliff(p, r);
  bridge(p, r);
  pilar(p, r);
  river(p, r);
  boats(p, r);
  front(p, r);
  life(p, r);
  oval(p, r);
  lettering(p, r);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

// ================================================================ helpers
let mc = null;
function measure(text, font) {
  if (!mc) mc = document.createElement('canvas').getContext('2d');
  mc.font = font;
  return mc.measureText(text).width;
}
function line(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
function ellPts(rx, ry, n = 160, a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); pts.push([OX0 + Math.cos(a) * rx, OY0 + Math.sin(a) * ry]); }
  return pts;
}
// a horizontal gold foil: dark, light, dark, light
function foil(c, x0, x1) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, GOLD_D); g.addColorStop(0.22, GOLD_L); g.addColorStop(0.45, GOLD); g.addColorStop(0.7, GOLD_L); g.addColorStop(1, GOLD_D);
  return g;
}
// a hatch of diagonal lines, as a pattern (made once)
let hatchPat = null;
function hatch(c) {
  if (!hatchPat) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 8;
    const x = cv.getContext('2d'); x.strokeStyle = GOLD; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(-2, 10); x.lineTo(10, -2); x.moveTo(-2, 2); x.lineTo(2, -2); x.moveTo(6, 10); x.lineTo(10, 6); x.stroke();
    hatchPat = cv;
  }
  return c.createPattern(hatchPat, 'repeat');
}
// text set round a circle, its middle at the angle a (letters upright on the outside)
function ringText(c, str, cx, cy, R, a, font, color, track = 0, inside = false) {
  c.font = font; c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const ws = [...str].map((ch) => c.measureText(ch).width + track);
  const tot = ws.reduce((s, w) => s + w, 0) - track;
  let at = a - (inside ? -1 : 1) * tot / R / 2;
  for (let i = 0; i < str.length; i++) {
    const da = (ws[i] - track / 2) / R / 2;
    const aa = at + (inside ? -1 : 1) * da;
    c.save(); c.translate(cx + Math.cos(aa) * R, cy + Math.sin(aa) * R); c.rotate(aa + (inside ? -Math.PI / 2 : Math.PI / 2));
    c.fillText(str[i], 0, 0); c.restore();
    at += (inside ? -1 : 1) * ws[i] / R;
  }
}

// ================================================================ the label
// the bare label, laid first: it hides whatever the vignette draws outside the oval
function mask(p) {
  p.mark('mask', {
    t: 0, d: 0.05, reveal: 'none', box: { x: 0, y: 0, w: W, h: H },
    draw: (c) => { c.beginPath(); c.rect(0, 0, W, H); c.ellipse(OX0, OY0, RX, RY, 0, 0, Math.PI * 2); c.fillStyle = PAPER; c.fill('evenodd'); },
  });
}

function border(p, r) {
  const full = { x: 0, y: 0, w: W, h: H };
  const rectPts = (m) => [[m, m], [W - m, m], [W - m, H - m], [m, H - m], [m, m]];
  p.pen('border', rectPts(44), OX, 14, { t: 0.1, d: 1.3, cap: 'square' });
  p.group('border', full, (c) => {
    c.strokeStyle = foil(c, 0, W); c.lineWidth = 3.5; c.strokeRect(64, 64, W - 128, H - 128);
    c.lineWidth = 2; c.strokeRect(112, 112, W - 224, H - 224);
    c.strokeStyle = OX; c.lineWidth = 1.2; c.strokeRect(121, 121, W - 242, H - 242);
  }, { t: 0.6, d: 0.8, reveal: 'fade' });
  // the guilloche: two waves out of step, braided round the band
  const band = [];
  const run = (x0, y0, x1, y1) => {
    const L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    for (const ph of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) {
      const amp = ph === 0 || ph === Math.PI ? 15 : 8, pts = [];
      for (let s = 0; s <= L; s += 4) {
        const w = Math.sin(s / L * Math.round(L / 34) * Math.PI * 2 + ph) * amp;
        pts.push([lerp(x0, x1, s / L) + nx * w, lerp(y0, y1, s / L) + ny * w]);
      }
      band.push(pts);
    }
  };
  const m = 88;
  run(m + 26, m, W - m - 26, m); run(W - m, m + 26, W - m, H - m - 26);
  run(W - m - 26, H - m, m + 26, H - m); run(m, H - m - 26, m, m + 26);
  p.strokes('border', band, GOLD, 1.3, { t: 0.9, d: 1.0, reveal: 'fade', box: full });
  // corner rosettes
  [[m, m], [W - m, m], [W - m, H - m], [m, H - m]].forEach(([x, y], i) => {
    p.group('border', { x: x - 30, y: y - 30, w: 60, h: 60 }, (c) => {
      c.fillStyle = OX; c.fillRect(x - 22, y - 22, 44, 44);
      c.strokeStyle = GOLD_L; c.lineWidth = 1.5; c.strokeRect(x - 17, y - 17, 34, 34);
      c.fillStyle = GOLD_L;
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4;
        c.beginPath(); c.ellipse(x + Math.cos(a) * 8, y + Math.sin(a) * 8, 6, 2.6, a, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = OX; c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI * 2); c.fill();
    }, { t: 1.7 + i * 0.1, d: 0.5, reveal: 'pop', ease: 'back' });
  });
  // the engine-turned halo round the oval: rings that swell and narrow
  const rings = [];
  for (let k = 0; k < 9; k++) {
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const a = i / 240 * Math.PI * 2, w = 50 + k * 6 + Math.sin(a * 48 + k * 0.7) * 9;
      pts.push([OX0 + Math.cos(a) * (RX + w), OY0 + Math.sin(a) * (RY + w)]);
    }
    rings.push(pts);
  }
  p.strokes('border', rings, 'rgba(184,145,61,.42)', 0.9, { t: 1.2, d: 1.4, reveal: 'fade', box: { x: OX0 - RX - 130, y: OY0 - RY - 130, w: 2 * RX + 260, h: 2 * RY + 260 } });
}

// ================================================================ the sky, engraved
function sky(p, r) {
  const box = { x: OX0 - RX, y: OY0 - RY, w: 2 * RX, h: 2 * RY };
  p.group('sky', box, (c) => {
    const g = c.createLinearGradient(0, OY0 - RY, 0, 900);
    g.addColorStop(0, '#aebfc2'); g.addColorStop(0.55, SKY); g.addColorStop(1, '#efe0bf');
    c.fillStyle = g; c.fillRect(box.x, box.y, box.w, 600);
  }, { t: 1.0, d: 1.0, reveal: 'fade' });
  // clouds: rounded heaps where the engraver left the lines out
  const clouds = [[420, 470, 170, 46], [980, 420, 210, 52], [1240, 560, 150, 36], [650, 560, 120, 28]];
  const inCloud = (x, y) => clouds.some(([cx, cy, w, h]) => {
    const dx = (x - cx) / w, dy = (y - cy) / h;
    const lumpy = 1 + 0.18 * Math.sin(dx * 9 + cx);
    return dx * dx + (dy > 0 ? dy * dy * 3 : dy * dy) < lumpy * 0.9;
  });
  const lines = [];
  for (let y = OY0 - RY + 4, k = 0; y < 900; k++) {
    let seg = null;
    for (let x = OX0 - RX; x <= OX0 + RX; x += 14) {
      const yy = y + Math.sin(x * 0.004 + k) * 1.2;
      if (inCloud(x, yy)) { if (seg && seg.length > 1) lines.push(seg); seg = null; continue; }
      (seg ||= []).push([x, yy]);
    }
    if (seg && seg.length > 1) lines.push(seg);
    y += lerp(3.6, 9, clamp((y - (OY0 - RY)) / 520));
  }
  p.strokes('sky', lines, 'rgba(43,29,23,.42)', 0.9, { t: 1.4, d: 1.6, reveal: 'fall', ease: 'inOut', box });
  // the shading under each cloud
  const under = [];
  for (const [cx, cy, w, h] of clouds) {
    for (let k = 0; k < 5; k++) {
      const yy = cy + h * 0.25 + k * 4.5, hw = w * (0.8 - k * 0.12);
      under.push([[cx - hw, yy], [cx + hw, yy]]);
    }
    const top = [];
    for (let i = 0; i <= 24; i++) { const a = Math.PI + i / 24 * Math.PI; top.push([cx + Math.cos(a) * w * 0.92, cy + Math.sin(a) * h * (0.75 + 0.2 * Math.sin(i * 1.7))]); }
    under.push(top);
  }
  p.strokes('sky', under, 'rgba(43,29,23,.5)', 1, { t: 2.2, d: 0.9, reveal: 'fade', box });
}

// the gorge running upriver, seen through the arch
function far(p, r) {
  const ridges = [[880, '#b9c3bd', 12], [935, '#a5b2a8', 18], [975, '#8f9f92', 24]];
  ridges.forEach(([base, col, amp], i) => {
    const pts = [[820, WATER]];
    for (let x = 820; x <= 1420; x += 15) pts.push([x, base - amp - Math.sin(x * 0.011 + i * 2) * amp - Math.sin(x * 0.031 + i) * amp * 0.4 + (x > 1250 ? -(x - 1250) * 0.5 : 0)]);
    pts.push([1420, WATER]);
    p.group('far', boxOf(pts, 4), (c) => {
      poly(c, pts); c.fillStyle = col; c.fill();
      c.save(); poly(c, pts); c.clip();
      c.strokeStyle = 'rgba(43,29,23,.25)'; c.lineWidth = 0.8; c.beginPath();
      for (let y = base - amp * 3; y < WATER; y += 5) { c.moveTo(820, y); c.lineTo(1420, y); }
      c.stroke(); c.restore();
    }, { t: 2.2 + i * 0.2, d: 0.9, reveal: 'fade' });
  });
}

// ================================================================ the hill, the Sé and the Clérigos
const ridge = (x) => x < 470 ? lerp(585, 572, (x - 190) / 280) : x < 640 ? lerp(572, 598, (x - 470) / 170) : x < 790 ? lerp(598, 690, (x - 640) / 150) : 700;
function hill(p, r) {
  const pts = [[190, 1000]];
  for (let x = 190; x <= 830; x += 10) pts.push([x, ridge(x)]);
  pts.push([830, 1000]);
  // the hill's ground, gardens and walls between the roofs
  const tufts = [];
  for (let i = 0; i < 70; i++) { const x = r.range(200, 800); tufts.push([x, r.range(ridge(x) + 8, 760), r.range(5, 11)]); }
  p.group('hill', boxOf(pts, 4), (c) => {
    poly(c, pts); c.fillStyle = '#b7a77d'; c.fill();
    c.fillStyle = '#7f8a55'; c.beginPath();
    for (const [x, y, s] of tufts) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); }
    c.fill();
    c.strokeStyle = 'rgba(43,29,23,.35)'; c.lineWidth = 0.8; c.beginPath();
    for (const [x, y, s] of tufts) { c.moveTo(x - s, y + 2); c.lineTo(x + s, y + 2); c.moveTo(x - s * 0.7, y + 5); c.lineTo(x + s * 0.7, y + 5); }
    c.stroke();
  }, { t: 2.4, d: 0.9, reveal: 'rise' });
  // the upper town along the ridge: a band of small roofs and walls
  const tops = [];
  for (let x = 200; x < 790;) {
    const w = r.range(18, 34), h = r.range(18, 36);
    tops.push([x, ridge(x + w / 2) + 4, w, h, r.pick(HOUSES)]);
    x += w + r.range(0, 3);
  }
  p.group('hill', { x: 190, y: 500, w: 620, h: 230 }, (c) => {
    for (const [x, y, w, h, col] of tops) {
      c.fillStyle = col; c.fillRect(x, y - h, w, h + 14);
      c.fillStyle = TERRA; c.beginPath(); c.moveTo(x - 2, y - h); c.lineTo(x + w * 0.25, y - h - 7); c.lineTo(x + w * 0.75, y - h - 7); c.lineTo(x + w + 2, y - h); c.fill();
    }
    c.fillStyle = INK; c.beginPath();
    for (const [x, y, w, h] of tops) for (let wx = x + 4; wx < x + w - 5; wx += 8) for (let wy = y - h + 6; wy < y + 8; wy += 11) c.rect(wx, wy, 3, 5);
    c.fill();
    c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath();
    for (const [x, y, w, h] of tops) c.rect(x, y - h, w, h + 14);
    c.stroke();
  }, { t: 2.8, d: 0.9, reveal: 'rise' });
  clerigos(p);
  se(p);
}
// the Clérigos tower: a tall baroque stack of stages, a cupola and a cross on top
function clerigos(p) {
  const x = 470, foot = 585;
  p.group('hill', { x: x - 80, y: 400, w: 160, h: foot - 395 }, (c) => {
    // the church's nave at its foot
    c.fillStyle = '#e4d8bd'; c.fillRect(x - 70, foot - 46, 64, 50);
    c.fillStyle = TERRA; c.beginPath(); c.moveTo(x - 74, foot - 46); c.lineTo(x - 38, foot - 62); c.lineTo(x - 2, foot - 46); c.fill();
    // the stages, narrowing
    const st = [[22, foot, foot - 70], [20, foot - 70, foot - 110], [18, foot - 110, foot - 138], [15, foot - 138, foot - 158]];
    for (const [hw, y0, y1] of st) {
      c.fillStyle = '#e8dcc0'; c.fillRect(x - hw, y1, hw * 2, y0 - y1);
      c.fillStyle = '#b8a98a'; c.fillRect(x + hw * 0.4, y1, hw * 0.6, y0 - y1);
      c.fillStyle = STONE; c.fillRect(x - hw - 3, y1 - 4, hw * 2 + 6, 5);
    }
    // the cupola, lantern and cross
    c.fillStyle = '#d9cba9'; c.beginPath(); c.moveTo(x - 15, foot - 158); c.quadraticCurveTo(x - 14, foot - 182, x, foot - 186); c.quadraticCurveTo(x + 14, foot - 182, x + 15, foot - 158); c.fill();
    c.fillRect(x - 3, foot - 198, 6, 12);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath();
    c.moveTo(x, foot - 198); c.lineTo(x, foot - 214); c.moveTo(x - 5, foot - 208); c.lineTo(x + 5, foot - 208);
    for (const [hw, y0, y1] of st) c.rect(x - hw, y1, hw * 2, y0 - y1);
    c.moveTo(x - 15, foot - 158); c.quadraticCurveTo(x - 14, foot - 182, x, foot - 186); c.quadraticCurveTo(x + 14, foot - 182, x + 15, foot - 158);
    c.rect(x - 70, foot - 46, 64, 50);
    c.stroke();
    // the belfry's openings and the clock
    c.fillStyle = INK; c.beginPath();
    for (const dx of [-8, 4]) { c.rect(x + dx, foot - 104, 5, 22); c.rect(x + dx, foot - 134, 4, 14); }
    c.rect(x - 4, foot - 154, 3, 10); c.rect(x + 2, foot - 154, 3, 10);
    for (let k = 0; k < 4; k++) c.rect(x - 10 + k * 6, foot - 55, 3, 9);
    c.fill();
    // hatching on the shaded flank
    c.strokeStyle = 'rgba(43,29,23,.45)'; c.lineWidth = 0.7; c.beginPath();
    for (let y = foot - 156; y < foot; y += 3) { c.moveTo(x + 8, y); c.lineTo(x + 20, y); }
    c.stroke();
  }, { t: 3.0, d: 1.0, reveal: 'rise', ease: 'inOut' });
}
// the Sé: a fortress church of two square towers with domed caps, a rose window
// and the long bishop's palace beside it
function se(p) {
  const x = 640, foot = 610;
  p.group('hill', { x: x - 110, y: 470, w: 230, h: foot - 460 }, (c) => {
    // the bishop's palace
    c.fillStyle = '#ece3cc'; c.fillRect(x + 50, foot - 52, 64, 56);
    c.fillStyle = INK; c.beginPath();
    for (let wx = x + 56; wx < x + 110; wx += 10) { c.rect(wx, foot - 44, 4, 8); c.rect(wx, foot - 26, 4, 8); }
    c.fill();
    // the nave and its crenellations
    c.fillStyle = '#d8c9a6'; c.fillRect(x - 40, foot - 74, 80, 78);
    for (const tx of [x - 44, x + 26]) {
      c.fillStyle = '#d2c29e'; c.fillRect(tx, foot - 112, 22, 116);
      c.fillStyle = '#b3a37f'; c.fillRect(tx + 13, foot - 112, 9, 116);
      // the dome cap
      c.fillStyle = '#9fa39a'; c.beginPath(); c.moveTo(tx - 1, foot - 112); c.quadraticCurveTo(tx + 11, foot - 136, tx + 23, foot - 112); c.fill();
      c.fillStyle = INK; c.fillRect(tx + 9, foot - 140, 3, 6);
    }
    c.fillStyle = '#d8c9a6';
    for (let k = 0; k < 8; k++) c.fillRect(x - 21 + k * 6, foot - 80, 4, 6);
    // the portal and rose window
    c.fillStyle = INK; c.beginPath(); c.moveTo(x - 8, foot + 2); c.lineTo(x - 8, foot - 26); c.arc(x, foot - 26, 8, Math.PI, 0); c.lineTo(x + 8, foot + 2); c.fill();
    c.beginPath(); c.arc(x, foot - 52, 9, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#d8c9a6'; c.lineWidth = 1; c.beginPath();
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; c.moveTo(x, foot - 52); c.lineTo(x + Math.cos(a) * 8, foot - 52 + Math.sin(a) * 8); }
    c.stroke();
    c.fillStyle = INK; c.beginPath();
    for (const tx of [x - 44, x + 26]) { c.rect(tx + 7, foot - 100, 4, 14); c.rect(tx + 7, foot - 64, 3, 10); }
    c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath();
    c.rect(x - 40, foot - 74, 80, 78); c.rect(x - 44, foot - 112, 22, 116); c.rect(x + 26, foot - 112, 22, 116); c.rect(x + 50, foot - 52, 64, 56);
    c.stroke();
    c.strokeStyle = 'rgba(43,29,23,.4)'; c.lineWidth = 0.7; c.beginPath();
    for (let y = foot - 108; y < foot; y += 3) { c.moveTo(x - 31, y); c.lineTo(x - 22, y); c.moveTo(x + 39, y); c.lineTo(x + 48, y); }
    c.stroke();
  }, { t: 3.2, d: 1.0, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the Ribeira
// rows of tall narrow houses, back to front, each row a step down the hill
function town(p, r) {
  const ROWS = 5;
  for (let k = ROWS - 1; k >= 0; k--) {
    const s = 1 - k * 0.13, base = QUAY - k * 58 - (k ? 6 : 0);
    const xEnd = k === 0 ? 815 : 800 - k * 8;
    const hs = [];
    for (let x = 192 - r.range(0, 30); x < xEnd;) {
      const w = r.range(44, 74) * s, h = r.range(k ? 110 : 160, k ? 170 : 236) * s;
      const col = r.pick(HOUSES), floors = Math.max(2, Math.round(h / (34 * s)));
      hs.push({ x, w: Math.min(w, xEnd - x), y: base - h, h, col, floors, cols: Math.max(1, Math.round(w / (20 * s))), tile: r.chance(0.3), hip: r.chance(0.6), chim: r.chance(0.5), s });
      x += w + (r.chance(0.2) ? r.range(2, 6) : 0);
    }
    drawRow(p, hs, base, k, ROWS);
  }
  // the quay: the arcaded river wall, granite steps
  p.group('town', { x: 186, y: QUAY - 30, w: 640, h: 46 }, (c) => {
    c.fillStyle = STONE; c.fillRect(186, QUAY - 22, 640, 32);
    c.fillStyle = '#3e2f26'; c.beginPath();
    for (let x = 200; x < 800; x += 38) { c.moveTo(x, QUAY + 10); c.lineTo(x, QUAY - 6); c.arc(x + 13, QUAY - 6, 13, Math.PI, 0); c.lineTo(x + 26, QUAY + 10); }
    c.fill();
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(186, QUAY - 22); c.lineTo(826, QUAY - 22);
    for (let x = 190; x < 826; x += 12) { c.moveTo(x, QUAY - 22); c.lineTo(x, QUAY - 16); }
    c.stroke();
  }, { t: 5.5, d: 0.8, reveal: 'wipe' });
  // laundry strung across the front houses, and people on the quay
  const wash = [];
  for (let i = 0; i < 9; i++) {
    const x = 220 + i * 64 + r.range(-10, 10), y = r.range(870, 930);
    const cloths = []; for (let k = 0; k < 4; k++) cloths.push([x + 6 + k * 10, r.range(6, 12), r.pick(['#f6efe0', '#c64b3f', '#5d7fa0', '#e2c15a'])]);
    wash.push([x, y, cloths]);
  }
  p.group('town', { x: 200, y: 850, w: 620, h: 110 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath();
    for (const [x, y] of wash) { c.moveTo(x, y); c.quadraticCurveTo(x + 24, y + 6, x + 48, y); }
    c.stroke();
    for (const [x, y, cl] of wash) for (const [cx, h, col] of cl) { c.fillStyle = col; c.fillRect(cx, y + 2, 7, h); }
  }, { t: 6.0, d: 0.6, reveal: 'fade' });
  const folk = [];
  for (let i = 0; i < 26; i++) folk.push([r.range(200, 810), QUAY - 24 + r.range(-2, 2), r.pick(['#3b2a22', OX, '#4d5f6c', '#c9a55a', '#efe5cf'])]);
  p.group('town', { x: 190, y: QUAY - 50, w: 640, h: 34 }, (c) => {
    for (const [x, y, col] of folk) {
      c.fillStyle = col; c.fillRect(x - 2.5, y - 14, 5, 10);
      c.fillStyle = INK; c.fillRect(x - 2, y - 5, 1.6, 5); c.fillRect(x + 0.5, y - 5, 1.6, 5);
      c.beginPath(); c.arc(x, y - 17, 2.6, 0, Math.PI * 2); c.fill();
    }
  }, { t: 6.3, d: 0.5, reveal: 'fade' });
}
function drawRow(p, hs, base, k, ROWS) {
  const front = k === 0;
  p.group('town', { x: 160, y: Math.min(...hs.map((h) => h.y)) - 30, w: 680, h: base - Math.min(...hs.map((h) => h.y)) + 40 }, (c) => {
    c.lineJoin = 'round';
    for (const o of hs) {
      const { x, w, y, h, col, s } = o;
      // the side wall in shadow, then the front
      c.fillStyle = shade(col, 0.62); c.fillRect(x + w - 4 * s, y + 4, 4 * s, h);
      c.fillStyle = col; c.fillRect(x, y, w - 3 * s, h + 30);
      // blue tile: a fine diaper of dots
      if (o.tile) {
        c.fillStyle = 'rgba(255,255,255,.35)';
        for (let ty = y + 4; ty < y + h; ty += 6 * s) for (let tx = x + 3 + ((ty / 6 | 0) % 2) * 3 * s; tx < x + w - 5; tx += 6 * s) c.fillRect(tx, ty, 1.6, 1.6);
      }
      // the roof
      c.fillStyle = TERRA; c.beginPath();
      if (o.hip) { c.moveTo(x - 3, y); c.lineTo(x + w * 0.3, y - 14 * s); c.lineTo(x + w * 0.7, y - 14 * s); c.lineTo(x + w, y); }
      else { c.moveTo(x - 3, y); c.lineTo(x + w * 0.5, y - 18 * s); c.lineTo(x + w, y); }
      c.closePath(); c.fill();
      if (o.chim) { c.fillStyle = '#e8dcc0'; c.fillRect(x + w * 0.66, y - 22 * s, 6 * s, 14 * s); }
      c.fillStyle = STONE; c.fillRect(x - 2, y - 1, w + 1, 4 * s);
    }
    // windows: tall, with a light sill, in ink
    c.fillStyle = INK; c.beginPath();
    for (const o of hs) {
      const { x, w, y, h, s, floors, cols } = o;
      const fh = (h - 14 * s) / floors, cw = (w - 6 * s) / cols;
      for (let f = 0; f < floors; f++) for (let q = 0; q < cols; q++) {
        if (front && f === floors - 1 && q === 0) { c.rect(x + 3 * s + q * cw + cw * 0.18, y + 10 * s + f * fh + fh * 0.12, cw * 0.64, fh * 0.88); continue; }
        c.rect(x + 3 * s + q * cw + cw * 0.28, y + 10 * s + f * fh + fh * 0.2, cw * 0.44, fh * 0.56);
      }
    }
    c.fill();
    c.fillStyle = 'rgba(248,240,222,.85)'; c.beginPath();
    for (const o of hs) {
      const { x, w, y, h, s, floors, cols } = o;
      const fh = (h - 14 * s) / floors, cw = (w - 6 * s) / cols;
      for (let f = 0; f < floors; f++) for (let q = 0; q < cols; q++) c.rect(x + 3 * s + q * cw + cw * 0.22, y + 10 * s + f * fh + fh * 0.76, cw * 0.56, 1.6 * s);
    }
    c.fill();
    // iron balconies on the front row
    if (front) {
      c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath();
      for (const o of hs) {
        const { x, w, y, h, s, floors } = o;
        const fh = (h - 14 * s) / floors;
        for (let f = 0; f < floors - 1; f++) {
          const by = y + 10 * s + f * fh + fh * 0.76;
          c.moveTo(x + 3, by); c.lineTo(x + w - 7, by); c.moveTo(x + 3, by - 7); c.lineTo(x + w - 7, by - 7);
          for (let bx = x + 5; bx < x + w - 7; bx += 3) { c.moveTo(bx, by); c.lineTo(bx, by - 7); }
        }
      }
      c.stroke();
    }
    // the engraver's line: outlines, roof courses and hatching in the shadows
    c.strokeStyle = INK; c.lineWidth = front ? 1.1 : 0.8; c.beginPath();
    for (const o of hs) {
      const { x, w, y, h, s } = o;
      c.rect(x, y, w - 3 * s, h + 30);
      if (o.hip) { c.moveTo(x - 3, y); c.lineTo(x + w * 0.3, y - 14 * s); c.lineTo(x + w * 0.7, y - 14 * s); c.lineTo(x + w, y); }
      else { c.moveTo(x - 3, y); c.lineTo(x + w * 0.5, y - 18 * s); c.lineTo(x + w, y); }
    }
    c.stroke();
    c.strokeStyle = 'rgba(43,29,23,.45)'; c.lineWidth = 0.6; c.beginPath();
    for (const o of hs) {
      const { x, w, y, h, s } = o;
      for (let yy = y + 6; yy < y + h + 30; yy += 3) { c.moveTo(x + w - 4 * s, yy); c.lineTo(x + w, yy - 1); }
      for (let rx = x + 3; rx < x + w - 3; rx += 4) { c.moveTo(rx, y - 1); c.lineTo(rx + (o.hip ? 0 : (x + w / 2 - rx) * 0.3), y - 10 * s); }
    }
    c.stroke();
    // a deeper shade on the rows behind, as the hill falls into the next row's shadow
    if (!front) {
      c.fillStyle = `rgba(60,40,30,${0.06 + k * 0.03})`;
      for (const o of hs) c.fillRect(o.x, o.y + o.h - 10, o.w, 40);
    }
  }, { t: 3.4 + (ROWS - 1 - k) * 0.45, d: 0.9, reveal: 'rise', ease: 'out' });
}

// the Guindais cliff under the bridge's north end, the old town wall climbing it
function cliff(p, r) {
  const pts = [[770, 690], [820, 698], [872, 712], [884, 820], [878, 920], [890, 1006], [800, 1006], [812, 900], [790, 790]];
  const cracks = [];
  for (let i = 0; i < 26; i++) { const x = r.range(800, 875), y = r.range(720, 990); cracks.push([[x, y], [x + r.range(-8, 8), y + r.range(8, 20)], [x + r.range(-6, 10), y + r.range(20, 34)]]); }
  p.group('town', boxOf(pts, 6), (c) => {
    poly(c, pts); c.fillStyle = ROCK; c.fill();
    c.save(); poly(c, pts); c.clip();
    c.strokeStyle = 'rgba(43,29,23,.5)'; c.lineWidth = 0.7; c.beginPath();
    for (let y = 690; y < 1010; y += 3.5) { c.moveTo(830 + Math.sin(y * 0.05) * 8, y); c.lineTo(895, y); }
    c.stroke();
    c.lineWidth = 1; c.beginPath(); for (const cr of cracks) line(c, cr); c.stroke();
    // the Fernandina wall, crenellated, climbing the rock
    c.fillStyle = '#d6c8a6'; c.beginPath(); c.moveTo(800, 1004); c.lineTo(842, 712); c.lineTo(860, 714); c.lineTo(822, 1006); c.fill();
    c.fillStyle = INK; for (let k = 0; k < 12; k++) { const t = k / 12; c.fillRect(lerp(842, 802, t) - 4, lerp(712, 1000, t), 4, 6); }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.1; poly(c, pts); c.stroke();
  }, { t: 4.6, d: 0.9, reveal: 'fall' });
}

// ================================================================ the Dom Luís I bridge
const AX = 1110, SPAN = 272, DECK = 694, LOW = 955;
const archU = (x) => WATER - 6 - 305 * (1 - ((x - AX) / SPAN) ** 2);
const archL = (x) => WATER - 6 - 262 * (1 - ((x - AX) / SPAN) ** 2);
function bridge(p, r) {
  // the granite abutments where the arch springs, and the lower deck's towers
  const piers = [[AX - SPAN - 34, AX - SPAN + 24], [AX + SPAN - 24, AX + SPAN + 34]];
  p.group('bridge', { x: 800, y: 900, w: 640, h: 120 }, (c) => {
    for (const [x0, x1] of piers) {
      c.fillStyle = STONE; c.fillRect(x0, 930, x1 - x0, WATER - 930 + 4);
      c.fillStyle = '#e3d6b8'; c.fillRect(x0 - 4, 922, x1 - x0 + 8, 10);
      c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath();
      for (let y = 942; y < WATER; y += 12) { c.moveTo(x0, y); c.lineTo(x1, y); for (let x = x0 + ((y / 12 | 0) % 2) * 10; x < x1; x += 20) { c.moveTo(x, y); c.lineTo(x, y + 12); } }
      c.rect(x0, 930, x1 - x0, WATER - 930); c.rect(x0 - 4, 922, x1 - x0 + 8, 10);
      c.stroke();
    }
  }, { t: 5.0, d: 0.8, reveal: 'rise' });
  // the arch: two chords drawn by the pen
  const chord = (f) => { const pts = []; for (let x = AX - SPAN; x <= AX + SPAN; x += 6) pts.push([x, f(x)]); return pts; };
  p.pen('bridge', chord(archU), INK, 5, { t: 5.3, d: 1.4 });
  p.pen('bridge', chord(archL), INK, 3.5, { t: 5.5, d: 1.4 });
  // the web between them: a lattice of diagonals
  const web = [];
  const n = 34;
  for (let i = 0; i < n; i++) {
    const xa = lerp(AX - SPAN, AX + SPAN, i / n), xb = lerp(AX - SPAN, AX + SPAN, (i + 1) / n);
    web.push([[xa, archU(xa)], [xb, archL(xb)]], [[xa, archL(xa)], [xb, archU(xb)]], [[xa, archU(xa)], [xa, archL(xa)]]);
  }
  const band = [...chord(archU), ...chord(archL).reverse()];
  p.group('bridge', boxOf(band, 6), (c) => {
    poly(c, band); c.fillStyle = '#3d2e27'; c.fill();
    c.strokeStyle = '#cdbd99'; c.lineWidth = 1.1; c.beginPath(); for (const w of web) line(c, w); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2; poly(c, band); c.stroke();
  }, { t: 6.4, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // the upper deck: a deep lattice girder, with railings
  const D0 = 760, D1 = 1440;
  p.group('bridge', { x: D0 - 6, y: DECK - 20, w: D1 - D0 + 12, h: 44 }, (c) => {
    c.fillStyle = '#4a3b33'; c.fillRect(D0, DECK, D1 - D0, 16);
    c.strokeStyle = '#d9cdb2'; c.lineWidth = 1; c.beginPath();
    for (let x = D0; x < D1; x += 10) { c.moveTo(x, DECK + 15); c.lineTo(x + 5, DECK + 1); c.lineTo(x + 10, DECK + 15); }
    c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(D0, DECK, D1 - D0, 16);
    c.lineWidth = 0.8; c.beginPath(); c.moveTo(D0, DECK - 8); c.lineTo(D1, DECK - 8);
    for (let x = D0; x < D1; x += 6) { c.moveTo(x, DECK); c.lineTo(x, DECK - 8); }
    c.stroke();
    // lamps along the rail
    c.fillStyle = INK; for (let x = D0 + 30; x < D1; x += 70) { c.fillRect(x - 0.8, DECK - 22, 1.6, 22); c.fillRect(x - 3, DECK - 24, 6, 4); }
  }, { t: 6.8, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // posts from the arch up to the deck, and the tall lattice piers at either end
  const posts = [];
  for (const x of [AX - 236, AX - 196, AX - 156, AX - 116, AX - 76, AX + 76, AX + 116, AX + 156, AX + 196, AX + 236]) {
    const yb = archU(x);
    if (yb - DECK < 8) continue;
    const hw = 3 + (yb - DECK) * 0.02;
    posts.push([[x - hw, yb], [x - hw, DECK + 16]], [[x + hw, yb], [x + hw, DECK + 16]]);
    for (let y = DECK + 20; y < yb - 10; y += 14) posts.push([[x - hw, y], [x + hw, y + 14]], [[x + hw, y], [x - hw, y + 14]]);
  }
  p.strokes('bridge', posts, INK, 1.1, { t: 7.2, d: 0.8, reveal: 'fall' });
  const pier = (x, foot) => {
    const L = [];
    const top = DECK + 16, hw0 = 14, hw1 = 22;
    L.push([[x - hw0, top], [x - hw1, foot]], [[x + hw0, top], [x + hw1, foot]]);
    for (let y = top; y < foot - 4; y += 16) {
      const a = lerp(hw0, hw1, (y - top) / (foot - top)), b = lerp(hw0, hw1, (y + 16 - top) / (foot - top));
      L.push([[x - a, y], [x + b, y + 16]], [[x + a, y], [x - b, y + 16]], [[x - a, y], [x + a, y]]);
    }
    return L;
  };
  p.strokes('bridge', [...pier(800, 790), ...pier(1400, 900)], INK, 1.3, { t: 6.6, d: 0.9, reveal: 'rise' });
  // the lower deck, hung from the arch on hangers
  p.group('bridge', { x: AX - SPAN - 30, y: LOW - 30, w: 2 * SPAN + 60, h: 60 }, (c) => {
    c.fillStyle = '#4a3b33'; c.fillRect(AX - SPAN - 30, LOW, 2 * SPAN + 60, 10);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(AX - SPAN - 30, LOW, 2 * SPAN + 60, 10);
    c.lineWidth = 0.7; c.beginPath(); c.moveTo(AX - SPAN - 30, LOW - 6); c.lineTo(AX + SPAN + 30, LOW - 6);
    for (let x = AX - SPAN - 30; x < AX + SPAN + 30; x += 5) { c.moveTo(x, LOW); c.lineTo(x, LOW - 6); }
    c.stroke();
  }, { t: 7.4, d: 0.8, reveal: 'wipeL', ease: 'inOut' });
  const hang = [];
  for (let x = AX - 236; x <= AX + 236; x += 18) { const y = archL(x); if (y < LOW - 4) hang.push([[x, y], [x, LOW]]); }
  p.strokes('bridge', hang, INK, 1, { t: 7.8, d: 0.6, reveal: 'fall' });
  // the walkers and a cart on the lower deck
  const folk = [];
  for (let i = 0; i < 14; i++) folk.push([r.range(AX - SPAN, AX + SPAN), r.pick([INK, OX, '#4d5f6c'])]);
  p.group('bridge', { x: AX - SPAN - 10, y: LOW - 22, w: 2 * SPAN + 20, h: 24 }, (c) => {
    for (const [x, col] of folk) { c.fillStyle = col; c.fillRect(x - 1.5, LOW - 13, 3, 9); c.beginPath(); c.arc(x, LOW - 15, 2, 0, Math.PI * 2); c.fill(); c.fillStyle = INK; c.fillRect(x - 1.4, LOW - 4, 2.8, 4); }
    c.fillStyle = '#8b5a3a'; c.fillRect(AX + 60, LOW - 14, 22, 10); c.fillStyle = INK; c.beginPath(); c.arc(AX + 66, LOW - 3, 3, 0, Math.PI * 2); c.arc(AX + 77, LOW - 3, 3, 0, Math.PI * 2); c.fill();
  }, { t: 8.1, d: 0.5, reveal: 'fade' });
}

// the Serra do Pilar: the round church and the long monastery on the Gaia cliff
function pilar(p, r) {
  const x = 1290, top = 700;
  const rock = [[1180, 712], [1250, 700], [1420, 690], [1420, 1010], [1380, 1010], [1362, 930], [1330, 860], [1270, 790]];
  p.group('far', boxOf(rock, 4), (c) => {
    poly(c, rock); c.fillStyle = '#a99c80'; c.fill();
    c.save(); poly(c, rock); c.clip();
    c.strokeStyle = 'rgba(43,29,23,.45)'; c.lineWidth = 0.7; c.beginPath();
    for (let y = 690; y < 1010; y += 3.5) { c.moveTo(1180, y); c.lineTo(1420, y + 6); }
    c.stroke(); c.restore();
    c.fillStyle = '#6e7f4d'; c.beginPath(); for (let k = 0; k < 9; k++) { const tx = 1200 + k * 22; c.moveTo(tx + 9, 712); c.arc(tx, 712, 9, 0, Math.PI * 2); } c.fill();
  }, { t: 5.8, d: 0.8, reveal: 'rise' });
  p.group('far', { x: x - 110, y: 590, w: 230, h: 130 }, (c) => {
    // the monastery's long wing
    c.fillStyle = '#ece2c9'; c.fillRect(x + 30, top - 46, 86, 46);
    c.fillStyle = TERRA; c.fillRect(x + 28, top - 54, 90, 8);
    c.fillStyle = INK; for (let wx = x + 38; wx < x + 112; wx += 12) { c.fillRect(wx, top - 38, 4, 9); c.fillRect(wx, top - 20, 4, 9); }
    // the drum of the round church, its dome and lantern
    c.fillStyle = '#e6dbc1'; c.fillRect(x - 40, top - 64, 80, 64);
    c.fillStyle = '#c4b694'; c.fillRect(x + 14, top - 64, 26, 64);
    c.fillStyle = '#b4b0a2'; c.beginPath(); c.moveTo(x - 42, top - 64); c.bezierCurveTo(x - 40, top - 102, x + 40, top - 102, x + 42, top - 64); c.fill();
    c.fillStyle = '#e6dbc1'; c.fillRect(x - 6, top - 108, 12, 14);
    c.fillStyle = INK; c.beginPath(); c.moveTo(x - 7, top - 108); c.quadraticCurveTo(x, top - 118, x + 7, top - 108); c.fill();
    for (let k = 0; k < 5; k++) c.fillRect(x - 32 + k * 15, top - 52, 4, 14);
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath();
    c.rect(x - 40, top - 64, 80, 64); c.rect(x + 30, top - 46, 86, 46);
    c.moveTo(x - 42, top - 64); c.bezierCurveTo(x - 40, top - 102, x + 40, top - 102, x + 42, top - 64);
    for (let k = -3; k <= 3; k++) { c.moveTo(x + k * 10, top - 92 + Math.abs(k) * 3); c.lineTo(x + k * 13, top - 64); }
    c.stroke();
    c.strokeStyle = 'rgba(43,29,23,.45)'; c.lineWidth = 0.6; c.beginPath();
    for (let y = top - 62; y < top; y += 3) { c.moveTo(x + 16, y); c.lineTo(x + 40, y); }
    c.stroke();
  }, { t: 6.1, d: 0.9, reveal: 'rise' });
}

// ================================================================ the Douro
function river(p, r) {
  const box = { x: OX0 - RX, y: WATER - 4, w: 2 * RX, h: OY0 + RY - WATER + 4 };
  p.group('river', box, (c) => {
    const g = c.createLinearGradient(0, WATER, 0, GAIA);
    g.addColorStop(0, '#a3b7b0'); g.addColorStop(1, RIVER);
    c.fillStyle = g; c.fillRect(box.x, WATER, box.w, GAIA - WATER + 6);
  }, { t: 7.4, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // reflections: the houses' colors broken in the water, the arch upside down
  const refl = [];
  for (let i = 0; i < 160; i++) {
    const x = r.range(195, 820), y = WATER + 4 + Math.abs(r.gauss()) * 46;
    refl.push([x, y, r.range(10, 26), r.pick(HOUSES)]);
  }
  p.group('river', box, (c) => {
    for (const [x, y, w, col] of refl) { c.fillStyle = col; c.globalAlpha = 0.4; c.fillRect(x, y, w, 1.8); }
    c.globalAlpha = 1;
  }, { t: 8.0, d: 0.8, reveal: 'fade' });
  // the engraver's water: long level lines, closer toward us
  const lines = [];
  for (let y = WATER + 3, k = 0; y < GAIA + 10; k++) {
    for (let x = OX0 - RX + r.range(0, 40); x < OX0 + RX;) {
      const L = r.range(40, 200);
      lines.push([[x, y], [x + L, y + r.range(-0.6, 0.6)]]);
      x += L + r.range(4, 26);
    }
    y += lerp(3.2, 6, (y - WATER) / (GAIA - WATER));
  }
  p.strokes('river', lines, 'rgba(43,29,23,.4)', 0.8, { t: 7.7, d: 1.0, reveal: 'wipeL', ease: 'inOut', box });
}

// a rabelo: a long flat hull, a high steering platform aft with its great oar,
// a square sail on one mast, and pipes of wine stacked amidships
function rabelo(c, x, y, s, o) {
  const L = 150 * s, dir = o.dir || 1;
  const X = (u) => x + u * dir;
  // the hull
  c.fillStyle = '#4b3328';
  c.beginPath(); c.moveTo(X(-L * 0.5), y - 16 * s); c.quadraticCurveTo(X(-L * 0.45), y + 2 * s, X(-L * 0.3), y + 3 * s);
  c.lineTo(X(L * 0.35), y + 3 * s); c.quadraticCurveTo(X(L * 0.5), y, X(L * 0.56), y - 20 * s); c.lineTo(X(L * 0.5), y - 10 * s); c.lineTo(X(-L * 0.44), y - 8 * s); c.closePath(); c.fill();
  c.strokeStyle = '#d9c39a'; c.lineWidth = 1 * s; c.beginPath(); c.moveTo(X(-L * 0.44), y - 5 * s); c.lineTo(X(L * 0.5), y - 7 * s); c.stroke();
  // the barrels, two tiers
  const bw = 14 * s, bh = 12 * s;
  for (let tier = 0; tier < 2; tier++) for (let k = 0; k < (tier ? 4 : 6); k++) {
    const bx = X(-L * 0.26 + (k + tier * 0.5) * bw * 1.02), by = y - 8 * s - (tier + 1) * bh * 0.92;
    c.fillStyle = tier ? '#8a5a37' : '#7a4e31'; c.beginPath(); c.ellipse(bx, by + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#2b1d17'; c.lineWidth = 0.9 * s; c.beginPath();
    c.moveTo(bx - bw * 0.25, by + 1); c.lineTo(bx - bw * 0.25, by + bh - 1); c.moveTo(bx + bw * 0.25, by + 1); c.lineTo(bx + bw * 0.25, by + bh - 1);
    c.ellipse(bx, by + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2); c.stroke();
  }
  // the steering platform, the steersman and the long oar
  c.fillStyle = '#5c4033'; c.fillRect(Math.min(X(-L * 0.47), X(-L * 0.3)), y - 34 * s, L * 0.17, 5 * s);
  c.strokeStyle = '#2b1d17'; c.lineWidth = 1.4 * s; c.beginPath();
  c.moveTo(X(-L * 0.45), y - 30 * s); c.lineTo(X(-L * 0.45), y - 8 * s); c.moveTo(X(-L * 0.32), y - 30 * s); c.lineTo(X(-L * 0.32), y - 8 * s);
  c.moveTo(X(-L * 0.2), y - 52 * s); c.lineTo(X(-L * 0.78), y + 2 * s); c.stroke();
  c.fillStyle = '#2b1d17'; c.fillRect(X(-L * 0.38) - 2.5 * s, y - 50 * s, 5 * s, 16 * s); c.beginPath(); c.arc(X(-L * 0.38), y - 53 * s, 3.2 * s, 0, Math.PI * 2); c.fill();
  // the mast and the sail
  const mx = X(L * 0.1);
  c.strokeStyle = '#2b1d17'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(mx, y - 8 * s); c.lineTo(mx, y - 118 * s); c.stroke();
  if (o.sail) {
    const sw = 44 * s;
    c.fillStyle = '#f2e9d4'; c.beginPath(); c.moveTo(mx - sw, y - 112 * s); c.lineTo(mx + sw, y - 112 * s); c.quadraticCurveTo(mx + sw + 6 * s * dir, y - 76 * s, mx + sw, y - 42 * s); c.lineTo(mx - sw, y - 42 * s); c.quadraticCurveTo(mx - sw + 6 * s * dir, y - 76 * s, mx - sw, y - 112 * s); c.fill();
    c.strokeStyle = '#2b1d17'; c.lineWidth = 1 * s; c.stroke();
    c.strokeStyle = 'rgba(43,29,23,.4)'; c.lineWidth = 0.7 * s; c.beginPath();
    for (let k = 1; k < 5; k++) { const yy = y - 112 * s + k * 14 * s; c.moveTo(mx - sw, yy); c.lineTo(mx + sw, yy); }
    for (let k = 0; k < 8; k++) { c.moveTo(mx - sw * 0.2 + k * 4 * s, y - 108 * s); c.lineTo(mx - sw * 0.2 + k * 4 * s, y - 46 * s); }
    c.stroke();
    c.fillStyle = OX; c.fillRect(mx - sw, y - 64 * s, sw * 2, 6 * s);
    c.strokeStyle = '#2b1d17'; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(mx - sw - 4 * s, y - 112 * s); c.lineTo(mx + sw + 4 * s, y - 112 * s); c.stroke();
  } else {
    c.fillStyle = '#e8dcc2'; c.fillRect(mx - 40 * s, y - 114 * s, 80 * s, 7 * s);
    c.strokeStyle = '#2b1d17'; c.lineWidth = 0.8 * s; c.strokeRect(mx - 40 * s, y - 114 * s, 80 * s, 7 * s);
  }
  // rigging
  c.strokeStyle = 'rgba(43,29,23,.7)'; c.lineWidth = 0.6 * s; c.beginPath();
  c.moveTo(mx, y - 118 * s); c.lineTo(X(L * 0.54), y - 18 * s); c.moveTo(mx, y - 118 * s); c.lineTo(X(-L * 0.2), y - 34 * s); c.stroke();
}
function rabeloBox(x, y, s) { return { x: x - 130 * s, y: y - 130 * s, w: 260 * s, h: 145 * s }; }

function boats(p, r) {
  // far rabelos under the bridge, then two big ones moored at the Gaia quay
  const fleet = [
    [1000, 1040, 0.42, 1, true, 8.2], [1210, 1032, 0.36, -1, false, 8.35], [600, 1050, 0.48, -1, true, 8.5],
    [400, 1148, 1.0, 1, true, 8.7], [1110, 1156, 1.05, -1, false, 8.95],
  ];
  for (const [x, y, s, dir, sail, t] of fleet) {
    p.group('boats', rabeloBox(x, y, s), (c) => {
      rabelo(c, x, y, s, { dir, sail });
      c.strokeStyle = 'rgba(43,29,23,.45)'; c.lineWidth = 0.8; c.beginPath();
      for (let k = 0; k < 4; k++) { c.moveTo(x - 70 * s + k * 6, y + 6 * s + k * 3 * s); c.lineTo(x + 70 * s - k * 8, y + 6 * s + k * 3 * s); }
      c.stroke();
    }, { t, d: 0.8, reveal: 'drop', dy: 18 });
  }
}

// the Gaia quay in front: granite edge, bollards, pipes stacked, coopers at work
function front(p, r) {
  const y0 = GAIA;
  const box = { x: OX0 - RX, y: y0 - 30, w: 2 * RX, h: OY0 + RY - y0 + 30 };
  p.group('front', box, (c) => {
    c.fillStyle = '#cbbd9c'; c.fillRect(box.x, y0, box.w, 120);
    c.fillStyle = '#b3a37f'; c.fillRect(box.x, y0, box.w, 12);
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(box.x, y0); c.lineTo(box.x + box.w, y0);
    for (let x = box.x; x < box.x + box.w; x += 34) { c.moveTo(x, y0); c.lineTo(x, y0 + 12); }
    c.moveTo(box.x, y0 + 12); c.lineTo(box.x + box.w, y0 + 12);
    c.stroke();
    c.strokeStyle = 'rgba(43,29,23,.3)'; c.lineWidth = 0.7; c.beginPath();
    for (let y = y0 + 18; y < y0 + 120; y += 4) { c.moveTo(box.x, y); c.lineTo(box.x + box.w, y); }
    c.stroke();
    // bollards
    c.fillStyle = INK; for (const x of [560, 760, 960]) { c.fillRect(x - 5, y0 - 10, 10, 14); c.fillRect(x - 8, y0 - 13, 16, 4); }
  }, { t: 9.2, d: 0.8, reveal: 'rise' });
  // stacked pipes on the quay
  const pipes = [];
  for (const [cx, n] of [[640, 5], [860, 4]]) for (let tier = 0; tier < 3; tier++) for (let k = 0; k < n - tier; k++) pipes.push([cx + (k + tier * 0.5) * 30 - n * 15, y0 + 40 - tier * 24]);
  const coopers = [[560, y0 + 52, 1], [720, y0 + 60, -1], [990, y0 + 54, 1], [500, y0 + 40, -1]];
  p.group('front', { x: 470, y: y0 - 50, w: 560, h: 140 }, (c) => {
    for (const [x, y] of pipes) {
      c.fillStyle = '#7a4e31'; c.beginPath(); c.ellipse(x, y, 15, 13, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#9b6a44'; c.beginPath(); c.ellipse(x, y, 10, 9, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, 15, 13, 0, 0, Math.PI * 2); c.moveTo(x + 10, y); c.ellipse(x, y, 10, 9, 0, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = 'rgba(43,29,23,.5)'; c.lineWidth = 0.6; c.beginPath(); for (let k = -6; k <= 6; k += 3) { c.moveTo(x + k, y - 8); c.lineTo(x + k, y + 8); } c.stroke();
    }
    for (const [x, y, d] of coopers) {
      c.fillStyle = '#3b2a22'; c.fillRect(x - 4, y - 26, 8, 16);
      c.fillStyle = '#efe5cf'; c.fillRect(x - 4, y - 26, 8, 6);
      c.fillStyle = INK; c.fillRect(x - 4, y - 10, 3, 10); c.fillRect(x + 1, y - 10, 3, 10);
      c.beginPath(); c.arc(x, y - 30, 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#7a4e31'; c.beginPath(); c.ellipse(x + d * 16, y - 6, 9, 8, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
    }
  }, { t: 9.6, d: 0.7, reveal: 'drop', dy: 14 });
}

// ================================================================ the live things
function life(p, r) {
  // a rabelo running upriver under sail, between the moored ones and the bridge
  p.live('sail', {
    t: 9.9, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const u = (time * 9) % 520, x = 860 + u, y = 1088 + Math.sin(time * 1.3) * 1.2;
      c.save(); c.beginPath(); c.rect(840, 900, 540, 220); c.clip();
      c.globalAlpha *= Math.min(1, u / 60, (520 - u) / 60);
      rabelo(c, x, y, 0.55, { dir: 1, sail: true });
      c.restore();
    },
  });
  // a train crossing the upper deck
  p.live('live', {
    t: 10.1, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const x = 700 + ((time * 70) % 900);
      c.save(); c.beginPath(); c.rect(760, DECK - 30, 680, 34); c.clip();
      for (let k = 0; k < 3; k++) {
        const cx = x - k * 58;
        c.fillStyle = '#d9cdb2'; c.fillRect(cx - 54, DECK - 20, 54, 18);
        c.fillStyle = INK; c.fillRect(cx - 50, DECK - 16, 46, 5);
        c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(cx - 54, DECK - 20, 54, 18);
      }
      c.restore();
    },
  });
  // gulls wheeling over the river
  const gulls = [[620, 760, 0], [1000, 560, 1.7], [760, 880, 3.1], [1250, 860, 4.4]];
  p.live('live', {
    t: 10.3, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const [x0, y0, ph] of gulls) {
        const x = x0 + Math.sin(time * 0.31 + ph) * 70, y = y0 + Math.sin(time * 0.47 + ph * 2) * 18;
        gull(c, x, y, 1.15, (Math.sin(time * 5 + ph) + 1) / 2, INK);
      }
    },
  });
  // sun glints on the Douro
  const glints = [];
  for (let i = 0; i < 18; i++) glints.push([r.range(300, 1300), r.range(WATER + 10, GAIA - 8), r.range(10, 26), r.range(0, 6)]);
  p.live('live', {
    t: 10.5, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = 'rgba(250,244,226,.9)'; c.lineWidth = 1.6; c.beginPath();
      for (const [x, y, L, ph] of glints) {
        const q = Math.sin(time * 1.6 + ph);
        if (q > 0.3) { c.moveTo(x - L * q / 2, y); c.lineTo(x + L * q / 2, y); }
      }
      c.stroke();
    },
  });
}

// ================================================================ the oval's frame and laurels
function oval(p, r) {
  // three rules, drawn round by the pen
  p.pen('border', ellPts(RX + 3, RY + 3, 220, Math.PI / 2, Math.PI * 2.5), INK, 2, { t: 0.8, d: 1.5 });
  p.group('border', { x: OX0 - RX - 40, y: OY0 - RY - 40, w: 2 * RX + 80, h: 2 * RY + 80 }, (c) => {
    c.lineWidth = 10; c.strokeStyle = foil(c, OX0 - RX, OX0 + RX);
    c.beginPath(); c.ellipse(OX0, OY0, RX + 14, RY + 14, 0, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 1.5; c.strokeStyle = OX;
    c.beginPath(); c.ellipse(OX0, OY0, RX + 23, RY + 23, 0, 0, Math.PI * 2); c.stroke();
    // a row of beads in the gold
    c.fillStyle = GOLD_D; c.beginPath();
    for (let k = 0; k < 220; k++) { const a = k / 220 * Math.PI * 2, bx = OX0 + Math.cos(a) * (RX + 14), by = OY0 + Math.sin(a) * (RY + 14); c.moveTo(bx + 1.8, by); c.arc(bx, by, 1.8, 0, Math.PI * 2); }
    c.fill();
  }, { t: 1.6, d: 1.0, reveal: 'iris', ease: 'inOut' });
  // laurel sprays climbing the oval from a bow at its foot: a stem, pairs of
  // leaves shrinking toward the tip, and berries
  const stems = [], leaves = [], berries = [];
  for (const side of [-1, 1]) {
    const st = [];
    for (let k = 0; k <= 40; k++) {
      const a = Math.PI / 2 + side * (0.06 + k * 0.026), off = 40 - k * 0.3;
      st.push([OX0 + Math.cos(a) * (RX + off), OY0 + Math.sin(a) * (RY + off)]);
    }
    stems.push(st);
    for (let k = 2; k < 40; k += 3) {
      const [x, y] = st[k], [x2, y2] = st[k + 1];
      const tang = Math.atan2(y2 - y, x2 - x), L = 30 - k * 0.42;
      leaves.push([x, y, tang - 0.75, L], [x, y, tang + 0.75, L * 0.92]);
      if (k % 9 === 5) berries.push([x + Math.cos(tang + 1.57) * 10, y + Math.sin(tang + 1.57) * 10]);
    }
  }
  p.group('border', { x: OX0 - RX - 90, y: OY0, w: 2 * RX + 180, h: RY + 140 }, (c) => {
    c.strokeStyle = '#5e6a3a'; c.lineWidth = 2.4; c.lineCap = 'round';
    c.beginPath(); for (const st of stems) line(c, st); c.stroke();
    for (const [x, y, a, L] of leaves) {
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = '#6f7a45'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.45, -L * 0.3, L, 0); c.quadraticCurveTo(L * 0.5, L * 0.3, 0, 0); c.fill();
      c.fillStyle = '#8e9a5c'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.45, -L * 0.3, L, 0); c.quadraticCurveTo(L * 0.5, -L * 0.05, 0, 0); c.fill();
      c.strokeStyle = '#3f4626'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.45, -L * 0.3, L, 0); c.quadraticCurveTo(L * 0.5, L * 0.3, 0, 0); c.moveTo(2, 0); c.lineTo(L * 0.85, 0); c.stroke();
      c.restore();
    }
    c.fillStyle = OX; for (const [x, y] of berries) { c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); }
    // the bow
    c.fillStyle = OX;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(OX0, OY0 + RY + 34); c.quadraticCurveTo(OX0 + s * 40, OY0 + RY + 8, OX0 + s * 46, OY0 + RY + 34); c.quadraticCurveTo(OX0 + s * 40, OY0 + RY + 56, OX0, OY0 + RY + 34); c.fill();
      c.beginPath(); c.moveTo(OX0, OY0 + RY + 34); c.lineTo(OX0 + s * 30, OY0 + RY + 92); c.lineTo(OX0 + s * 20, OY0 + RY + 86); c.lineTo(OX0 + s * 14, OY0 + RY + 96); c.closePath(); c.fill(); }
    c.fillStyle = GOLD_L; c.beginPath(); c.arc(OX0, OY0 + RY + 34, 7, 0, Math.PI * 2); c.fill();
  }, { t: 12.9, d: 0.9, reveal: 'iris', ease: 'inOut' });
}

// ================================================================ the lettering
function lettering(p, r) {
  // the motto, one letter at a time round an arc over the oval
  const motto = 'MUI NOBRE · SEMPRE LEAL · E INVICTA';
  const font = `700 46px ${TEXT}`, ERX = RX + 92, ERY = RY + 92, track = 7;
  // the ellipse's length from its top, sampled, so letters can be placed by distance
  const tab = [];
  for (let i = 0, s = 0, px = OX0, py = OY0 - ERY; i <= 2000; i++) {
    const a = -Math.PI / 2 + (i / 2000 - 0.5) * Math.PI * 1.6, x = OX0 + Math.cos(a) * ERX, y = OY0 + Math.sin(a) * ERY;
    if (i) s += Math.hypot(x - px, y - py);
    tab.push([s, a]); px = x; py = y;
  }
  const mid = tab[1000][0];
  const angleAt = (d) => { let lo = 0, hi = tab.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m][0] - mid < d) lo = m; else hi = m; } return tab[lo][1]; };
  const ws = [...motto].map((ch) => measure(ch, font) + track);
  const tot = ws.reduce((s, w) => s + w, 0) - track;
  let dist = -tot / 2, k = 0;
  for (let i = 0; i < motto.length; i++) {
    const ch = motto[i], a = angleAt(dist + (ws[i] - track) / 2);
    dist += ws[i];
    if (ch === ' ') continue;
    const x = OX0 + Math.cos(a) * ERX, y = OY0 + Math.sin(a) * ERY;
    const rot = Math.atan2(Math.cos(a) * ERY, -Math.sin(a) * ERX);
    p.group('type', { x: x - 40, y: y - 60, w: 80, h: 100 }, (c) => {
      c.save(); c.translate(x, y); c.rotate(rot);
      c.font = font; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = OX; c.fillText(ch, 0, 0);
      c.restore();
    }, { t: 10.4 + k * 0.045, d: 0.6, reveal: 'press' });
    k++;
  }
  const ends = [angleAt(-tot / 2 - 30), angleAt(tot / 2 + 30)];
  // small stars closing the arc
  for (const aa of ends) {
    const x = OX0 + Math.cos(aa) * ERX, y = OY0 + Math.sin(aa) * ERY - 14;
    p.group('type', { x: x - 16, y: y - 16, w: 32, h: 32 }, (c) => {
      c.fillStyle = GOLD; c.beginPath();
      for (let q = 0; q < 10; q++) { const a = -Math.PI / 2 + q * Math.PI / 5, d = q % 2 ? 4.5 : 12; c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
      c.fill();
    }, { t: 11.9, d: 0.4, reveal: 'pop', ease: 'back' });
  }

  // the ribbon under the oval
  const RB = 1388;
  p.group('type', { x: 330, y: RB - 50, w: 940, h: 100 }, (c) => {
    // folded tails
    c.fillStyle = OX_D;
    for (const s of [-1, 1]) {
      const x0 = OX0 + s * 400;
      c.beginPath(); c.moveTo(x0, RB - 18); c.lineTo(x0 + s * 64, RB - 18); c.lineTo(x0 + s * 44, RB + 10); c.lineTo(x0 + s * 64, RB + 38); c.lineTo(x0, RB + 38); c.fill();
    }
    c.fillStyle = OX;
    c.beginPath(); c.moveTo(OX0 - 410, RB - 30); c.quadraticCurveTo(OX0, RB - 50, OX0 + 410, RB - 30); c.lineTo(OX0 + 410, RB + 26); c.quadraticCurveTo(OX0, RB + 6, OX0 - 410, RB + 26); c.fill();
    c.strokeStyle = GOLD_L; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(OX0 - 400, RB - 24); c.quadraticCurveTo(OX0, RB - 44, OX0 + 400, RB - 24); c.moveTo(OX0 - 400, RB + 20); c.quadraticCurveTo(OX0, RB, OX0 + 400, RB + 20); c.stroke();
    c.font = `italic 400 29px ${TEXT}`; c.fillStyle = GOLD_L; c.textAlign = 'center';
    c.fillText('Vista da Ribeira e da Ponte Luiz I, tomada de Vila Nova de Gaia', OX0, RB + 4);
  }, { t: 10.9, d: 1.0, reveal: 'iris', ease: 'inOut' });

  // an engraved flourish: two rules swelling to a lozenge
  p.group('type', { x: 420, y: 1462, w: 760, h: 40 }, (c) => {
    c.fillStyle = OX;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(OX0 + s * 22, 1482); c.quadraticCurveTo(OX0 + s * 140, 1476, OX0 + s * 360, 1482); c.quadraticCurveTo(OX0 + s * 140, 1488, OX0 + s * 22, 1482); c.fill(); }
    c.fillStyle = GOLD; c.beginPath(); c.moveTo(OX0, 1470); c.lineTo(OX0 + 12, 1482); c.lineTo(OX0, 1494); c.lineTo(OX0 - 12, 1482); c.closePath(); c.fill();
    c.strokeStyle = OX; c.lineWidth = 1; c.stroke();
    c.fillStyle = GOLD; for (const s of [-1, 1]) { c.beginPath(); c.arc(OX0 + s * 376, 1482, 4, 0, Math.PI * 2); c.fill(); }
  }, { t: 11.1, d: 0.8, reveal: 'iris', ease: 'inOut' });
  // the two medals
  medal(p, 236, 1640, 'PONTE LUIZ I', 'bridge', 11.2);
  medal(p, W - 236, 1640, 'RIBEIRA · DOURO', 'boat', 11.35);

  // PORTO: a fat Didone in oxblood over a shadow cut in gold hatching
  const y = 1748;
  const res = p.type('title', 'PORTO', OX0, y, { family: FACE, size: 330, color: OX, align: 'center', track: 0.03, fit: 880, t: 11.5, gap: 0.16, d: 0.7, reveal: 'drop', ease: 'back' });
  const f = `normal 400 ${res.size}px ${FACE}`;
  res.glyphs.forEach((m, i) => {
    const ch = 'PORTO'[i], gx = m.box.x + res.size * 0.15;
    m.dy = 40;
    m.box = { ...m.box, y: m.box.y - 20, h: m.box.h + 40 };
    m.draw = (c) => {
      c.font = f; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      c.fillStyle = OX; c.fillText(ch, gx, y);
      c.strokeStyle = OX_D; c.lineWidth = 1.5; c.strokeText(ch, gx, y);
    };
    p.group('type', { x: gx - 10, y: y - res.size, w: m.box.w + 30, h: res.size + 30 }, (c) => {
      c.font = f; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      c.fillStyle = hatch(c); c.fillText(ch, gx + 11, y + 9);
    }, { t: 11.3 + i * 0.16, d: 0.6, reveal: 'wipe' });
  });
  // the gold band under the name
  const BY = 1800;
  p.group('type', { x: 360, y: BY - 6, w: 880, h: 66 }, (c) => {
    c.fillStyle = OX; c.fillRect(380, BY, 840, 52);
    c.strokeStyle = GOLD_L; c.lineWidth = 1.5; c.strokeRect(386, BY + 6, 828, 40);
    c.font = `700 28px ${TEXT}`; c.fillStyle = GOLD_L; c.textAlign = 'center';
    const s = 'DOURO  ·  PORTUGAL  ·  MDCCCLXXXVI';
    let x = OX0 - (c.measureText(s).width + 4 * (s.length - 1)) / 2;
    c.textAlign = 'left';
    for (const ch of s) { c.fillText(ch, x, BY + 36); x += c.measureText(ch).width + 4; }
  }, { t: 12.4, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  p.group('type', { x: 500, y: 1862, w: 600, h: 40 }, (c) => {
    c.font = `400 22px ${TEXT}`; c.fillStyle = INK; c.textAlign = 'center';
    c.fillText('Gravado em Vila Nova de Gaia', OX0, 1890);
    c.strokeStyle = GOLD; c.lineWidth = 1; c.beginPath(); c.moveTo(540, 1883); c.lineTo(640, 1883); c.moveTo(960, 1883); c.lineTo(1060, 1883); c.stroke();
  }, { t: 12.8, d: 0.6, reveal: 'fade' });
}

// an exhibition medal in gold: a beaded rim, a legend round it, a picture struck in the middle
function medal(p, x, y, legend, kind, t) {
  const R = 118;
  p.group('type', { x: x - R - 14, y: y - R - 14, w: 2 * R + 28, h: 2 * R + 28 }, (c) => {
    const g = c.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.1, x, y, R * 1.05);
    g.addColorStop(0, GOLD_L); g.addColorStop(0.6, GOLD); g.addColorStop(1, GOLD_D);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD_D; c.lineWidth = 2; c.beginPath(); c.arc(x, y, R - 6, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(x, y, R - 40, 0, Math.PI * 2); c.stroke();
    c.fillStyle = GOLD_D;
    for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2; c.beginPath(); c.arc(x + Math.cos(a) * (R - 2), y + Math.sin(a) * (R - 2), 2.2, 0, Math.PI * 2); c.fill(); }
    ringText(c, legend, x, y, R - 33, -Math.PI / 2, `700 22px ${TEXT}`, '#5e4416', 3);
    ringText(c, '· 1886 ·', x, y, R - 16, Math.PI / 2, `700 16px ${TEXT}`, '#5e4416', 2, true);
    // the picture, struck in relief: a darker line under a lighter one
    for (const [dx, col] of [[1.2, GOLD_D], [0, '#f3dd98']]) {
      c.save(); c.translate(dx, dx);
      c.strokeStyle = col; c.lineWidth = 2.2; c.beginPath();
      if (kind === 'bridge') {
        for (let u = -1; u <= 1.001; u += 0.1) { const px = x + u * 56, py = y + 30 - 50 * (1 - u * u); u === -1 ? c.moveTo(px, py) : c.lineTo(px, py); }
        c.moveTo(x - 66, y - 22); c.lineTo(x + 66, y - 22); c.moveTo(x - 66, y + 14); c.lineTo(x + 66, y + 14);
        for (let u = -0.8; u <= 0.81; u += 0.4) { c.moveTo(x + u * 56, y - 22); c.lineTo(x + u * 56, y + 30 - 50 * (1 - u * u)); }
        c.moveTo(x - 66, y + 34); c.quadraticCurveTo(x - 30, y + 30, x, y + 34); c.quadraticCurveTo(x + 30, y + 38, x + 66, y + 34);
      } else {
        c.moveTo(x - 58, y + 20); c.quadraticCurveTo(x - 50, y + 32, x - 34, y + 32); c.lineTo(x + 40, y + 32); c.quadraticCurveTo(x + 56, y + 28, x + 60, y + 16);
        c.moveTo(x + 6, y + 30); c.lineTo(x + 6, y - 50);
        c.rect(x - 22, y - 44, 56, 40);
        c.moveTo(x - 30, y + 16); c.arc(x - 38, y + 16, 8, 0, Math.PI * 2); c.moveTo(x - 6, y + 16); c.arc(x - 14, y + 16, 8, 0, Math.PI * 2);
        c.moveTo(x - 40, y - 6); c.lineTo(x - 76, y + 36);
        c.moveTo(x - 66, y + 42); c.quadraticCurveTo(x - 30, y + 38, x, y + 42); c.quadraticCurveTo(x + 30, y + 46, x + 66, y + 42);
      }
      c.stroke(); c.restore();
    }
  }, { t, d: 0.7, reveal: 'pop', ease: 'back' });
}
