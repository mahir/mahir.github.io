// Ulaanbaatar: a Mongol zurag painting, the whole valley in fine detail. Under a
// pale sky of curling clouds, two ranges of mountains with forest on their
// slopes; in the valley the city, panel blocks in rows, the Blue Sky Tower's
// glass sail and the towers around it, the Government Palace, the power
// station's chimneys, and on its hill to the west the Gandan monastery with
// the Migjid Janraisig temple. Ger districts climb the slopes. The Tuul river
// runs across, and in front the steppe rolls toward us in five bands, crowded
// as a zurag is with small scenes: a naadam with its archers, wrestlers, stand
// and horse race; camps of gers with their smoke, a ger going up, mares and foals
// at the tether line, a camel caravan moving camp, herds and flocks, a herder
// with his pole lasso, a yak cart, a motorbike, granite outcrops, cranes at a
// pond, and tracks worn between them, with calm grass left in between. The
// painting is mounted in blue silk with a key pattern; the name in Cyrillic
// above it, the Latin below.

import { Plate, W, H } from '../print.js';
import { lerp, poly } from '../kit.js';

const PAPER = '#efe7d2';
const INK = '#2a2420', BLUE = '#22427f', BLUE_D = '#162c58', RED = '#b3332a', RED_D = '#7e1f19', YEL = '#e2b23c';
const SKY_T = '#8fb8cf', SKY_B = '#eef0e2';
const MT_D = '#2f5f5c', MT = '#4f8670', MT_L = '#93b583', MT_FAR = '#9fb6c8', MT_FAR_D = '#7d97b0';
const FOREST = '#22463a';
const VALLEY = '#a9b977', RIVER = '#4f8db0', RIVER_L = '#9cc6d8';
const BANDS = ['#bdb76f', '#a3b468', '#cdb873', '#93ad5e', '#aab86a'];
const FELT = '#f7f2e4', FELT_D = '#d6cdb6', DOOR = '#c9562c';
const HORSES = ['#8a5232', '#5d3a26', '#c9a26a', '#efe8d8', '#3a2c24', '#a86a3c', '#d8c39a'];
const DEELS = [BLUE, RED, '#2f7a6a', '#d07b2a', '#6b3f8a', '#3f8ad0', '#b8862c'];
const F = 'Oswald, sans-serif';
const CYR = 'УЛААНБААТАР';

export const city = {
  id: 'ulaanbaatar', name: 'Ulaanbaatar', wall: '#13223f',
  alt: 'A Mongol zurag painting of the Ulaanbaatar valley: forested mountains under curling clouds, the city with its panel blocks, the Blue Sky Tower and other towers, the Government Palace and the power station chimneys, the Gandan monastery with the Migjid Janraisig temple on its hill, ger districts on the slopes and the Tuul river, and in front the steppe crowded with small scenes: a naadam with archers, wrestlers and a horse race, camps of gers with smoke, a ger going up, mares and foals at the tether line, a camel caravan, herds of horses, sheep, goats and yaks, a herder with a pole lasso, a yak cart, a motorbike and cranes at a pond, mounted in blue silk under the name in Cyrillic, with ULAANBAATAR below',
  google: 'family=Oswald:wght@400;600',
  fonts: [['600 100px Oswald', CYR], ['400 40px Oswald', 'ULAANBAATAR']],
  build,
};

// the painting inside its mount
const PX0 = 110, PX1 = W - 110, PY0 = 340, PY1 = 1870;
const VAL = 830, RIV = 920; // the valley floor's top, the river

function build() {
  const p = new Plate({ paper: PAPER, seed: 1639 });
  const r = p.r;
  p.clip = { x: PX0, y: PY0, w: PX1 - PX0, h: PY1 - PY0 };
  p.stack('sky', 'mounts', 'valley', 'city', 'steppe', 'far', 'mid', 'live', 'mount', 'title');
  for (const n of ['mount', 'title']) p.layer(n, { clip: false });
  mount(p);
  sky(p, r);
  mountains(p, r);
  valley(p, r);
  cityscape(p, r);
  gandan(p);
  steppe(p, r);
  lands(p, r);
  scenes(p, r);
  life(p, r);
  title(p);
  return p;
}

// ================================================================ small helpers
function shape(c, pts, fill, o = {}) {
  c.fillStyle = fill; poly(c, pts); c.fill();
  if (o.line !== false) { c.strokeStyle = o.line || INK; c.lineWidth = o.lw || 1; c.lineJoin = 'round'; poly(c, pts); c.stroke(); }
}
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
// a rolling line across the painting, from a few sine waves
function rollY(x, base, amp, ph) {
  return base - amp * (0.55 * Math.sin(x * 0.004 + ph) + 0.3 * Math.sin(x * 0.011 + ph * 2.3) + 0.15 * Math.sin(x * 0.027 + ph * 0.7));
}
function contour(base, amp, ph, x0 = PX0 - 10, x1 = PX1 + 10) {
  const pts = [];
  for (let x = x0; x <= x1; x += 8) pts.push([x, rollY(x, base, amp, ph)]);
  return pts;
}

// ================================================================ the mount and its key pattern
function mount(p) {
  const k0 = 74, k1 = 110; // the silk from the sheet's edge band to the painting
  p.group('mount', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = BLUE;
    c.beginPath(); c.rect(PX0 - (k1 - k0), PY0 - (k1 - k0), PX1 - PX0 + 2 * (k1 - k0), PY1 - PY0 + 2 * (k1 - k0)); c.rect(PX0, PY0, PX1 - PX0, PY1 - PY0); c.fill('evenodd');
    c.strokeStyle = RED; c.lineWidth = 4; c.strokeRect(PX0 - (k1 - k0) - 4, PY0 - (k1 - k0) - 4, PX1 - PX0 + 2 * (k1 - k0) + 8, PY1 - PY0 + 2 * (k1 - k0) + 8);
    c.strokeStyle = YEL; c.lineWidth = 2.5; c.strokeRect(PX0 - 2, PY0 - 2, PX1 - PX0 + 4, PY1 - PY0 + 4);
  }, { t: 0.1, d: 1.0, reveal: 'iris', ease: 'inOut' });
  // the key pattern woven into the silk, all the way round
  const m = (k1 - k0) / 2;
  p.group('mount', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = 'rgba(226,178,60,.85)'; c.lineWidth = 2.2; c.lineCap = 'square'; c.lineJoin = 'miter';
    c.beginPath();
    const keyH = (x, y, s) => { c.moveTo(x, y + s); c.lineTo(x, y - s); c.lineTo(x + s, y - s); c.lineTo(x + s, y + s * 0.2); c.lineTo(x + s * 0.5, y + s * 0.2); c.lineTo(x + s * 0.5, y - s * 0.4); c.moveTo(x, y + s); c.lineTo(x + 1.6 * s, y + s); };
    const s = 9;
    for (let x = PX0 - m; x < PX1 + m - 12; x += 1.6 * s) { keyH(x, PY0 - m - 18, s); keyH(x, PY1 + m + 18, s); }
    c.stroke();
    c.beginPath();
    for (let y = PY0 - 2; y < PY1; y += 1.6 * s) {
      for (const x of [PX0 - m - 18, PX1 + m + 18]) { c.moveTo(x + s, y); c.lineTo(x - s, y); c.lineTo(x - s, y + s); c.lineTo(x + s * 0.2, y + s); c.lineTo(x + s * 0.2, y + s * 0.5); c.lineTo(x - s * 0.4, y + s * 0.5); c.moveTo(x + s, y); c.lineTo(x + s, y + 1.6 * s); }
    }
    c.stroke();
  }, { t: 0.9, d: 1.0, reveal: 'fade' });
}

// ================================================================ the sky
// a zurag cloud: a heap of curls outlined in blue, white inside
function cloudCurls(r, x, y, w) {
  const curls = [];
  const n = Math.max(3, Math.round(w / 46));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, lift = Math.sin(t * Math.PI);
    curls.push([x + t * w, y - lift * w * 0.12, (w / n) * (0.6 + 0.3 * lift), r.chance(0.5) ? 1 : -1]);
  }
  return curls;
}
function drawCloud(c, curls, y) {
  c.fillStyle = '#fbfaf3';
  c.beginPath(); for (const [cx, cy, rr] of curls) { c.moveTo(cx + rr, cy); c.arc(cx, cy, rr, 0, Math.PI * 2); } c.fill();
  c.fillRect(curls[0][0], y - curls[0][2] * 0.3, curls[curls.length - 1][0] - curls[0][0], curls[0][2] * 0.3 + 6);
  c.strokeStyle = '#5f86b0'; c.lineWidth = 1.6; c.lineCap = 'round';
  for (const [cx, cy, rr, dir] of curls) {
    c.beginPath();
    for (let k = 0; k <= 30; k++) { const t = k / 30, a = -Math.PI * 0.95 + dir * t * Math.PI * 2.4, q = rr * (1 - t * 0.8); k ? c.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q) : c.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); }
    c.stroke();
  }
  c.strokeStyle = 'rgba(95,134,176,.6)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(curls[0][0] - curls[0][2], y + 6); c.lineTo(curls[curls.length - 1][0] + curls[curls.length - 1][2], y + 6); c.stroke();
}
function sky(p, r) {
  p.group('sky', { x: PX0, y: PY0, w: PX1 - PX0, h: 560 }, (c) => {
    const g = c.createLinearGradient(0, PY0, 0, 780);
    g.addColorStop(0, SKY_T); g.addColorStop(0.7, SKY_B); g.addColorStop(1, '#f4eedb');
    c.fillStyle = g; c.fillRect(PX0, PY0, PX1 - PX0, 560);
  }, { t: 0.6, d: 1.2, reveal: 'fall', ease: 'inOut' });
  const clouds = [[180, 470, 260], [560, 410, 200], [930, 455, 300], [1290, 420, 170], [700, 520, 160], [1150, 545, 190]];
  clouds.forEach(([x, y, w], i) => {
    const curls = cloudCurls(r, x, y, w);
    p.group('sky', { x: x - 60, y: y - w * 0.4, w: w + 120, h: w * 0.4 + 70 }, (c) => drawCloud(c, curls, y), { t: 1.4 + i * 0.18, d: 0.8, reveal: i % 2 ? 'wipeL' : 'wipe' });
  });
  // the sun, small and pale, with rings
  p.group('sky', { x: 1260, y: 330, w: 160, h: 160 }, (c) => {
    c.fillStyle = '#f8e29a'; c.beginPath(); c.arc(1340, 410, 36, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#e0a63a'; c.lineWidth = 2; c.stroke();
    c.lineWidth = 1; c.beginPath(); c.arc(1340, 410, 46, 0, Math.PI * 2); c.stroke();
  }, { t: 1.2, d: 0.8, reveal: 'pop' });
}

// ================================================================ the mountains
function mountains(p, r) {
  // the far range, pale blue
  const far = [];
  for (let x = PX0 - 10; x <= PX1 + 10; x += 6) far.push([x, 640 - 70 * Math.abs(Math.sin(x * 0.006 + 1)) - 28 * Math.sin(x * 0.019) - 10 * Math.sin(x * 0.05)]);
  const farPoly = far.concat([[PX1 + 10, 760], [PX0 - 10, 760]]);
  p.group('mounts', { x: PX0, y: 480, w: PX1 - PX0, h: 290 }, (c) => {
    shape(c, farPoly, MT_FAR, { line: MT_FAR_D, lw: 1.4 });
    c.strokeStyle = 'rgba(125,151,176,.7)'; c.lineWidth = 1;
    c.beginPath(); for (let k = 1; k < 6; k++) { far.forEach(([x, y], i) => (i ? c.lineTo(x, y + k * 11) : c.moveTo(x, y + k * 11))); } c.stroke();
  }, { t: 1.8, d: 1.0, reveal: 'rise' });

  // the near range: peaks with ridges, dark at the top and pale at the foot
  const peaks = [[260, 610], [520, 575], [760, 640], [1010, 590], [1250, 620], [1420, 600]];
  const ridge = [];
  for (let x = PX0 - 10; x <= PX1 + 10; x += 5) {
    let y = 800;
    for (const [px, py] of peaks) y = Math.min(y, py + Math.abs(x - px) * 0.62 + 12 * Math.sin(x * 0.07 + px));
    ridge.push([x, y]);
  }
  const body = ridge.concat([[PX1 + 10, 860], [PX0 - 10, 860]]);
  p.group('mounts', { x: PX0, y: 540, w: PX1 - PX0, h: 330 }, (c) => {
    const g = c.createLinearGradient(0, 570, 0, 840);
    g.addColorStop(0, MT_D); g.addColorStop(0.45, MT); g.addColorStop(1, MT_L);
    shape(c, body, g, { line: INK, lw: 1.4 });
    // zurag ridges: lines running down from each peak, and contour lines along the slope
    c.save(); poly(c, body); c.clip();
    c.strokeStyle = 'rgba(20,50,40,.55)'; c.lineWidth = 1.2;
    c.beginPath();
    for (const [px, py] of peaks) for (let k = -3; k <= 3; k++) { if (!k) continue; c.moveTo(px + k * 4, py + 10); c.quadraticCurveTo(px + k * 22, py + 80, px + k * 48, 860); }
    c.stroke();
    c.strokeStyle = 'rgba(230,240,210,.35)';
    c.beginPath(); for (let k = 1; k < 9; k++) ridge.forEach(([x, y], i) => (i ? c.lineTo(x, y + k * 14) : c.moveTo(x, y + k * 14))); c.stroke();
    c.restore();
  }, { t: 2.4, d: 1.2, reveal: 'rise' });
  // forest on the slopes: little larches, dark
  const trees = [];
  for (let i = 0; i < 420; i++) {
    const x = r.range(PX0, PX1), ri = Math.round((x - PX0 + 10) / 5), y0 = ridge[Math.max(0, Math.min(ridge.length - 1, ri))][1];
    const y = r.range(y0 + 16, 830);
    if (r.chance(0.35) && y > 760) continue;
    trees.push([x, y, r.range(4, 7)]);
  }
  trees.sort((a, b) => a[1] - b[1]);
  p.group('mounts', { x: PX0, y: 560, w: PX1 - PX0, h: 300 }, (c) => {
    c.fillStyle = FOREST;
    c.beginPath(); for (const [x, y, s] of trees) { c.moveTo(x, y - s * 2.2); c.lineTo(x + s * 0.8, y); c.lineTo(x - s * 0.8, y); c.closePath(); } c.fill();
  }, { t: 3.4, d: 0.9, reveal: 'fade' });
}

// ================================================================ the valley and the river
function valley(p, r) {
  p.group('valley', { x: PX0, y: VAL - 40, w: PX1 - PX0, h: 200 }, (c) => {
    const top = contour(VAL, 14, 2.1);
    shape(c, top.concat([[PX1 + 10, 1000], [PX0 - 10, 1000]]), VALLEY, { line: false });
    c.strokeStyle = 'rgba(80,100,50,.35)'; c.lineWidth = 1;
    c.beginPath(); for (let k = 1; k < 10; k++) top.forEach(([x, y], i) => (i ? c.lineTo(x, y + k * 10) : c.moveTo(x, y + k * 10))); c.stroke();
  }, { t: 3.8, d: 0.8, reveal: 'fade' });
  // the Tuul, winding, with its white ripples
  const L = [], R = [];
  for (let x = PX0 - 10; x <= PX1 + 10; x += 10) {
    const y = RIV + 18 * Math.sin(x * 0.006 + 0.5) + 8 * Math.sin(x * 0.017), w = 14 + 6 * Math.sin(x * 0.01);
    L.push([x, y - w]); R.push([x, y + w]);
  }
  const river = L.concat(R.reverse());
  const rip = [];
  for (let x = PX0; x < PX1; x += r.range(16, 30)) {
    const y = RIV + 18 * Math.sin(x * 0.006 + 0.5) + 8 * Math.sin(x * 0.017) + r.range(-8, 8);
    rip.push([[x, y], [x + 6, y - 2], [x + 12, y]]);
  }
  p.group('valley', { x: PX0, y: RIV - 60, w: PX1 - PX0, h: 120 }, (c) => {
    shape(c, river, RIVER, { line: '#2f5f80', lw: 1.4 });
    c.strokeStyle = RIVER_L; c.lineWidth = 1.3; c.beginPath();
    for (const l of rip) { c.moveTo(l[0][0], l[0][1]); c.lineTo(l[1][0], l[1][1]); c.lineTo(l[2][0], l[2][1]); }
    c.stroke();
  }, { t: 4.2, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // willows along its banks
  const wil = [];
  for (let x = PX0 + 20; x < PX1; x += r.range(40, 90)) wil.push([x, RIV + 18 * Math.sin(x * 0.006 + 0.5) + 8 * Math.sin(x * 0.017) - 22 + r.range(-4, 4), r.range(9, 14)]);
  p.group('valley', { x: PX0, y: RIV - 80, w: PX1 - PX0, h: 100 }, (c) => {
    for (const [x, y, s] of wil) {
      c.strokeStyle = '#5a4030'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + s); c.lineTo(x, y); c.stroke();
      c.fillStyle = '#4f7e4a'; c.beginPath(); c.ellipse(x, y - s * 0.3, s * 0.8, s, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#2f5a35'; c.lineWidth = 0.8; c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(x + k * s * 0.3, y - s); c.lineTo(x + k * s * 0.38, y + s * 0.4); } c.stroke();
    }
  }, { t: 5.0, d: 0.8, reveal: 'pop' });
}

// ================================================================ the city
const PASTEL = ['#efe0c4', '#e9c9b4', '#d9dcc6', '#f1e6cf', '#d8c3dc', '#c9d8de', '#eed2a8'];
function block(c, x0, y0, w, h, col, o = {}) {
  shape(c, rect(x0, y0 - h, x0 + w, y0), col, { lw: 0.9 });
  // the side in shade
  const sw = o.side ?? Math.min(10, w * 0.25);
  if (sw > 0) shape(c, [[x0 + w, y0], [x0 + w + sw, y0 - sw * 0.5], [x0 + w + sw, y0 - h - sw * 0.5], [x0 + w, y0 - h]], 'rgba(90,80,70,.35)', { lw: 0.8 });
  c.fillStyle = o.win || 'rgba(50,60,70,.55)';
  const sx = o.wx || 7, sy = o.wy || 8;
  for (let y = y0 - h + 5; y < y0 - 5; y += sy) for (let x = x0 + 3; x < x0 + w - 4; x += sx) c.fillRect(x, y, sx * 0.45, sy * 0.45);
}
function cityscape(p, r) {
  // rows of panel blocks, back to front
  const rows = [];
  for (let row = 0; row < 4; row++) {
    const y0 = 838 + row * 18, list = [];
    for (let x = 430 + row * 6 - row * 40; x < 1280 + row * 40; x += r.range(34, 70)) {
      if (row < 2 && x > 840 && x < 960) continue; // room for the towers
      list.push([x, y0 + r.range(-3, 3), r.range(26, 58), r.range(30, 70) - row * 8, r.pick(PASTEL)]);
    }
    rows.push(list);
  }
  rows.forEach((list, i) => {
    p.group('city', { x: 340, y: 700, w: 1060, h: 230 }, (c) => { for (const [x, y, w, h, col] of list) block(c, x, y, w, h, col); }, { t: 4.6 + i * 0.3, d: 0.8, reveal: 'rise' });
  });
  // the towers in the middle, glass
  const towers = [[960, 836, 34, 180, '#9cb8c8'], [1010, 840, 30, 140, '#b8c8c2'], [800, 838, 28, 150, '#a9c0cc'], [770, 846, 36, 110, '#c9cfc2'], [1050, 846, 26, 100, '#9cb0c0']];
  towers.forEach(([x, y, w, h, col], i) => {
    p.group('city', { x: x - 6, y: y - h - 30, w: w + 24, h: h + 40 }, (c) => {
      block(c, x, y, w, h, col, { wx: 5, wy: 6, win: 'rgba(40,70,90,.5)' });
      c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + w / 2, y - h); c.lineTo(x + w / 2, y - h - 16); c.stroke();
    }, { t: 5.8 + i * 0.12, d: 0.7, reveal: 'rise' });
  });
  // the Blue Sky Tower: a glass sail, flat on one side, curved on the other
  p.group('city', { x: 860, y: 560, w: 110, h: 290 }, (c) => {
    const x0 = 880, b = 842, top = 600, wd = 70;
    const sail = [[x0, b]];
    for (let k = 0; k <= 20; k++) { const t = k / 20; sail.push([x0 + wd * Math.sin((1 - t) * Math.PI * 0.5 + 0.0) * (0.35 + 0.65 * (1 - t * t)), lerp(b, top, t)]); }
    sail.push([x0, top]);
    const g = c.createLinearGradient(x0, 0, x0 + wd, 0);
    g.addColorStop(0, '#3e6fa8'); g.addColorStop(0.6, '#7fb0d8'); g.addColorStop(1, '#3a5f90');
    shape(c, sail, g, { lw: 1.4 });
    c.save(); poly(c, sail); c.clip();
    c.strokeStyle = 'rgba(230,240,250,.45)'; c.lineWidth = 0.8;
    c.beginPath(); for (let y = top + 6; y < b; y += 6) { c.moveTo(x0, y); c.lineTo(x0 + wd, y); } for (let x = x0 + 8; x < x0 + wd; x += 9) { c.moveTo(x, top); c.lineTo(x, b); } c.stroke();
    c.restore();
    // its spine
    c.strokeStyle = '#e8eef2'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, b); c.lineTo(x0, top - 26); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x0 - 1.5, b); c.lineTo(x0 - 1.5, top - 26); c.stroke();
  }, { t: 6.4, d: 1.2, reveal: 'rise' });
  // the Government Palace: a long front with a colonnade in the middle
  p.group('city', { x: 600, y: 860, w: 220, h: 70 }, (c) => {
    const b = 912;
    shape(c, rect(610, b - 34, 810, b), '#e9dfc9', { lw: 1 });
    shape(c, rect(680, b - 50, 740, b), '#efe6d2', { lw: 1 });
    shape(c, [[676, b - 50], [744, b - 50], [740, b - 56], [680, b - 56]], '#b9b09a', { lw: 0.9 });
    c.fillStyle = INK; for (let x = 684; x < 738; x += 7) c.fillRect(x, b - 44, 2, 40);
    c.fillStyle = 'rgba(50,60,70,.6)'; for (let x = 616; x < 806; x += 8) if (x < 676 || x > 744) { c.fillRect(x, b - 28, 3, 6); c.fillRect(x, b - 16, 3, 6); }
    // the square in front, with tiny people
    shape(c, rect(600, b, 820, b + 12), '#d9cfb4', { lw: 0.8 });
    c.fillStyle = INK; for (const x of [622, 640, 655, 700, 771, 790]) c.fillRect(x, b + 3, 2, 6);
  }, { t: 6.5, d: 0.7, reveal: 'rise' });
  // the power station: a hall and two banded chimneys
  p.group('city', { x: 1240, y: 600, w: 160, h: 280 }, (c) => {
    shape(c, rect(1250, 820, 1390, 872), '#c9c0ae', { lw: 1 });
    c.fillStyle = 'rgba(50,60,70,.55)'; for (let x = 1256; x < 1386; x += 10) c.fillRect(x, 830, 4, 30);
    for (const [x, h] of [[1290, 230], [1345, 205]]) {
      const pts = [[x - 9, 822], [x + 9, 822], [x + 6, 822 - h], [x - 6, 822 - h]];
      shape(c, pts, '#efe8da', { lw: 1 });
      c.save(); poly(c, pts); c.clip(); c.fillStyle = RED; for (let y = 822 - h; y < 822; y += 40) c.fillRect(x - 10, y, 20, 14); c.restore();
      c.strokeStyle = INK; c.lineWidth = 1; poly(c, pts); c.stroke();
    }
  }, { t: 6.8, d: 1.0, reveal: 'rise' });
  // ger districts: gers and fenced yards up the slopes to either side
  const yards = [];
  for (let i = 0; i < 70; i++) {
    const left = i % 2 === 0;
    const x = left ? r.range(PX0 + 20, 420) : r.range(1180, PX1 - 20);
    const y = r.range(770, 880) + (left ? (x - PX0) * 0.05 : (PX1 - x) * 0.05) * 0;
    yards.push([x, y, r.range(9, 13), r.chance(0.5) ? '#d24a3a' : r.chance(0.5) ? '#4a7fc2' : '#e0b040']);
  }
  yards.sort((a, b) => a[1] - b[1]);
  [0, 1].forEach((k) => {
    const list = yards.filter((y, i) => i % 2 === k);
    p.group('city', { x: PX0, y: 740, w: PX1 - PX0, h: 160 }, (c) => {
      for (const [x, y, s, roof] of list) {
        c.strokeStyle = '#8a6a48'; c.lineWidth = 1; c.strokeRect(x - s * 1.6, y - s * 0.9, s * 3.4, s * 1.4);
        ger(c, x, y, s * 1.6, { small: true });
        shape(c, [[x + s * 1.2, y], [x + s * 2.4, y], [x + s * 2.4, y - s * 0.9], [x + s * 1.8, y - s * 1.4], [x + s * 1.2, y - s * 0.9]], '#e7dccb', { lw: 0.7 });
        c.fillStyle = roof; c.fillRect(x + s * 1.15, y - s * 1.0, s * 1.3, 2);
      }
    }, { t: 6.9 + k * 0.2, d: 0.7, reveal: 'rise' });
  });
}

// ================================================================ Gandan
function gandan(p) {
  // its hill, and the white walls round the temples
  p.group('city', { x: PX0, y: 700, w: 420, h: 180 }, (c) => {
    shape(c, [[PX0 - 10, 860], [PX0 - 10, 772], [220, 752], [330, 744], [440, 766], [520, 830], [520, 860]], '#b7b673', { line: INK, lw: 1.2 });
    c.strokeStyle = 'rgba(80,100,50,.4)'; c.lineWidth = 1;
    c.beginPath(); for (let k = 1; k < 7; k++) { c.moveTo(PX0, 772 + k * 12); c.quadraticCurveTo(330, 744 + k * 12, 520 - k * 4, 830 + k * 4); } c.stroke();
    shape(c, rect(200, 766, 470, 774), '#f6f1e4', { lw: 0.9 });
  }, { t: 7.2, d: 0.8, reveal: 'rise' });
  p.group('city', { x: 190, y: 560, w: 300, h: 220 }, (c) => {
    c.translate(315, 768); c.scale(0.78, 0.78); c.translate(-315, -768);
    // smaller halls with green roofs on either side
    for (const [x, w] of [[220, 60], [410, 52]]) {
      shape(c, rect(x - w / 2, 740, x + w / 2, 768), '#f3eee0', { lw: 1 });
      c.fillStyle = RED_D; c.fillRect(x - w / 2, 740, w, 5);
      c.fillStyle = INK; c.fillRect(x - 5, 752, 10, 16);
      shape(c, [[x - w / 2 - 10, 742], [x + w / 2 + 10, 742], [x + w / 2 - 6, 722], [x - w / 2 + 6, 722]], '#3f8a62', { lw: 1 });
      c.fillStyle = YEL; c.beginPath(); c.arc(x, 718, 3.5, 0, Math.PI * 2); c.fill();
    }
    // the Migjid Janraisig temple: a tall white hall, its red frieze, rows of windows,
    // and a double roof of green tiles with gold ridges
    const x = 315, b = 768, wd = 120;
    shape(c, rect(x - wd / 2, b - 120, x + wd / 2, b), '#f7f3e8', { lw: 1.2 });
    shape(c, rect(x + 30, b - 120, x + wd / 2, b), 'rgba(160,150,130,.3)', { line: false });
    c.fillStyle = INK;
    for (const yy of [b - 104, b - 78, b - 52]) for (let xx = x - 48; xx < x + 50; xx += 16) c.fillRect(xx, yy, 7, 14);
    c.fillStyle = RED_D; c.fillRect(x - 14, b - 30, 28, 30);
    c.fillStyle = YEL; c.fillRect(x - 14, b - 32, 28, 3);
    c.fillStyle = RED_D; c.fillRect(x - wd / 2, b - 124, wd, 8);
    const roof1 = [[x - wd / 2 - 18, b - 118], [x + wd / 2 + 18, b - 118], [x + wd / 2 - 8, b - 146], [x - wd / 2 + 8, b - 146]];
    shape(c, roof1, '#3f8a62', { lw: 1.2 });
    c.strokeStyle = 'rgba(20,60,40,.6)'; c.lineWidth = 0.8; c.beginPath(); for (let xx = x - wd / 2 - 10; xx < x + wd / 2 + 12; xx += 6) { c.moveTo(xx, b - 119); c.lineTo(x + (xx - x) * 0.82, b - 145); } c.stroke();
    shape(c, rect(x - 40, b - 166, x + 40, b - 146), '#f7f3e8', { lw: 1 });
    c.fillStyle = RED_D; c.fillRect(x - 40, b - 166, 80, 5);
    const roof2 = [[x - 56, b - 162], [x + 56, b - 162], [x + 34, b - 188], [x - 34, b - 188]];
    shape(c, roof2, '#3f8a62', { lw: 1.2 });
    // upturned eave tips and a gold ridge with its finial
    c.fillStyle = YEL;
    for (const [ex, ey] of [[x - wd / 2 - 18, b - 118], [x + wd / 2 + 18, b - 118], [x - 56, b - 162], [x + 56, b - 162]]) { c.beginPath(); c.arc(ex, ey - 3, 3, 0, Math.PI * 2); c.fill(); }
    c.fillRect(x - 34, b - 190, 68, 3);
    c.beginPath(); c.moveTo(x - 6, b - 190); c.lineTo(x + 6, b - 190); c.lineTo(x, b - 214); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  }, { t: 7.6, d: 1.2, reveal: 'rise' });
}

// ================================================================ the steppe
// five rolling bands, each a little nearer; the painter's crest line on each
const BAND_TOP = [[992, 14, 0.6], [1134, 18, 2.4], [1306, 22, 4.1], [1494, 20, 5.3], [1684, 16, 1.7]];
const groundY = (i, x) => rollY(x, BAND_TOP[i][0], BAND_TOP[i][1], BAND_TOP[i][2]);
function steppe(p, r) {
  BAND_TOP.forEach(([base, amp, ph], i) => {
    const top = contour(base, amp, ph);
    const body = top.concat([[PX1 + 10, PY1 + 10], [PX0 - 10, PY1 + 10]]);
    // grass: tufts of three strokes, scattered, sparser far away
    const tufts = [];
    const n = 220 + i * 70;
    for (let k = 0; k < n; k++) {
      const x = r.range(PX0, PX1), y = r.range(rollY(x, base, amp, ph) + 8, i < 4 ? BAND_TOP[i + 1][0] + 20 : PY1);
      const s = 1.6 + i * 0.9 + r.range(0, 1.2);
      tufts.push([[x - s, y], [x - s * 0.4, y - s * 1.6]], [[x, y], [x, y - s * 2]], [[x + s, y], [x + s * 0.4, y - s * 1.6]]);
    }
    // small stones and shrubs along the crest
    const bits = [];
    for (let k = 0; k < 14 + i * 4; k++) { const x = r.range(PX0, PX1); bits.push([x, rollY(x, base, amp, ph) + r.range(6, 30), r.range(2, 4) + i]); }
    p.group('steppe', { x: PX0 - 10, y: base - amp - 30, w: PX1 - PX0 + 20, h: PY1 - base + amp + 40 }, (c) => {
      shape(c, body, BANDS[i], { line: false });
      c.strokeStyle = 'rgba(70,80,40,.55)'; c.lineWidth = 1.3;
      c.beginPath(); top.forEach(([x, y], j) => (j ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
      c.strokeStyle = 'rgba(255,250,220,.4)'; c.lineWidth = 1;
      c.beginPath(); for (let k = 1; k < 4; k++) top.forEach(([x, y], j) => (j ? c.lineTo(x, y + k * 6) : c.moveTo(x, y + k * 6))); c.stroke();
      c.fillStyle = 'rgba(80,90,50,.45)';
      c.beginPath(); for (const [x, y, s] of bits) { c.moveTo(x + s * 1.4, y); c.ellipse(x, y, s * 1.4, s * 0.8, 0, 0, Math.PI * 2); } c.fill();
    }, { t: 6.9 + i * 0.3, d: 0.9, reveal: 'rise' });
    p.strokes('steppe', tufts, i % 2 ? 'rgba(50,90,40,.5)' : 'rgba(110,100,40,.5)', 1, { t: 7.9 + i * 0.1, d: 0.6, reveal: 'fade', box: { x: PX0, y: base - amp - 30, w: PX1 - PX0, h: PY1 - base + amp + 30 } });
  });
  // flowers in the nearest band, thicker on the calm left
  const fl = [];
  for (let k = 0; k < 200; k++) { const x = k < 90 ? r.range(PX0, 520) : r.range(PX0, PX1); fl.push([x, r.range(groundY(4, x) + 14, PY1 - 6), r.pick(['#e8c23a', '#d84a3a', '#f2f0e8', '#8a6ad0'])]); }
  p.group('steppe', { x: PX0, y: 1660, w: PX1 - PX0, h: PY1 - 1660 }, (c) => {
    for (const [x, y, col] of fl) { c.fillStyle = col; c.beginPath(); c.arc(x, y, 2.6, 0, Math.PI * 2); c.fill(); }
  }, { t: 8.5, d: 0.6, reveal: 'fade' });
}

// ================================================================ the land between the scenes
// where the scenes stand, so the scattered animals keep out of them
const BUSY = [
  [140, 1020, 270, 1072], [700, 995, 790, 1030], [1110, 1000, 1410, 1072],
  [250, 1036, 700, 1122], [700, 1060, 1030, 1128], [1030, 1076, 1140, 1118],
  [100, 1146, 450, 1222], [470, 1156, 712, 1226], [716, 1140, 884, 1222], [884, 1170, 1490, 1244],
  [100, 1232, 1490, 1292],
  [180, 1300, 600, 1442], [590, 1320, 744, 1430], [756, 1396, 992, 1482], [1036, 1352, 1466, 1452], [986, 1436, 1296, 1496],
  [110, 1440, 260, 1520], [1350, 1270, 1490, 1330],
  [110, 1552, 652, 1712], [636, 1578, 984, 1664], [956, 1470, 1490, 1664],
  [470, 1690, 1084, 1870], [1136, 1716, 1490, 1870], [110, 1716, 470, 1870],
];
const busy = (x, y, m = 8) => BUSY.some(([x0, y0, x1, y1]) => x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m);
const ROCKS = [[120, 1506, 140], [1356, 1318, 136]];
const POND = [250, 1792, 120, 26];

function lands(p, r) {
  // tracks worn into the grass between the camps, dotted
  const tracks = [
    [[200, 1072], [180, 1200], [380, 1290], [300, 1420], [420, 1560], [360, 1870]],
    [[1250, 1072], [1320, 1180], [980, 1300], [1000, 1460], [1140, 1520], [1220, 1630]],
    [[700, 1030], [760, 1160], [640, 1300], [720, 1500], [700, 1700], [800, 1870]],
  ];
  const dash = [];
  for (const tr of tracks) {
    const pts = [];
    for (let i = 0; i < tr.length - 1; i++) {
      const [a, b] = [tr[i], tr[i + 1]], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      for (let k = 0; k < 24; k++) { const t = k / 24; pts.push([lerp(a[0], b[0], t) + Math.sin(t * Math.PI) * (m[0] - a[0]) * 0.15, lerp(a[1], b[1], t)]); }
    }
    for (let i = 0; i + 1 < pts.length; i += 2) dash.push([pts[i], pts[i + 1]]);
  }
  p.strokes('steppe', dash, 'rgba(150,120,70,.55)', 2.2, { t: 8.6, d: 1.0, reveal: 'fall', box: { x: PX0, y: 1000, w: PX1 - PX0, h: PY1 - 1000 } });

  // granite outcrops with a few larches, as the zurag painters draw them
  ROCKS.forEach(([x0, base, w], i) => {
    const stones = [], larch = [];
    for (let k = 0; k < 9; k++) {
      const t = (k + 0.5) / 9, lift = Math.sin(t * Math.PI);
      stones.push([x0 + t * w + r.range(-6, 6), base - lift * w * 0.22 - r.range(0, 10), r.range(14, 24) * (0.6 + 0.5 * lift), r.range(10, 16) * (0.6 + 0.5 * lift)]);
    }
    stones.sort((a, b) => a[1] - b[1]);
    for (let k = 0; k < 5; k++) larch.push([x0 + r.range(0.1, 0.9) * w, base - w * 0.2 - r.range(0, 14), r.range(10, 16)]);
    p.group('steppe', { x: x0 - 30, y: base - w * 0.6, w: w + 60, h: w * 0.6 + 16 }, (c) => {
      c.fillStyle = FOREST;
      c.beginPath(); for (const [x, y, s] of larch) for (let k = 0; k < 3; k++) { const yy = y - k * s * 0.6; c.moveTo(x, yy - s); c.lineTo(x + s * (0.55 - k * 0.1), yy); c.lineTo(x - s * (0.55 - k * 0.1), yy); c.closePath(); } c.fill();
      for (const [x, y, rx, ry] of stones) {
        c.fillStyle = '#a7aaa0'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, Math.PI, 0); c.lineTo(x + rx, y + ry * 0.3); c.lineTo(x - rx, y + ry * 0.3); c.closePath(); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
        c.fillStyle = '#7d8580'; c.beginPath(); c.ellipse(x + rx * 0.35, y, rx * 0.5, ry * 0.8, 0, Math.PI, 0); c.fill();
        c.strokeStyle = '#eef0e2'; c.lineWidth = 1.2; c.beginPath(); c.arc(x - rx * 0.2, y - ry * 0.1, rx * 0.55, Math.PI * 1.15, Math.PI * 1.5); c.stroke();
      }
    }, { t: 8.3 + i * 0.2, d: 0.7, reveal: 'rise' });
  });

  // a pond on the calm side, reeds and three cranes
  const [px, py, prx, pry] = POND;
  const reeds = [];
  for (let k = 0; k < 26; k++) { const a = r.range(0, Math.PI * 2), x = px + Math.cos(a) * prx * 1.02, y = py + Math.sin(a) * pry * 1.02; reeds.push([[x, y], [x + r.range(-3, 3), y - r.range(8, 16)]]); }
  p.group('steppe', { x: px - prx - 20, y: py - pry - 40, w: 2 * prx + 40, h: 2 * pry + 60 }, (c) => {
    c.fillStyle = RIVER; c.beginPath(); c.ellipse(px, py, prx, pry, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#2f5f80'; c.lineWidth = 1.4; c.stroke();
    c.strokeStyle = RIVER_L; c.lineWidth = 1.2; c.beginPath();
    for (const [dx, dy, w] of [[-60, -8, 30], [10, -12, 40], [-20, 6, 50], [50, 4, 26], [-80, 10, 20]]) { c.moveTo(px + dx, py + dy); c.lineTo(px + dx + w, py + dy); }
    c.stroke();
    c.strokeStyle = '#4f6a32'; c.lineWidth = 1.2; c.beginPath(); for (const [a, b] of reeds) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
    // demoiselle cranes: gray, a black neck, a white tuft
    for (const [x, y, d] of [[200, 1790, 1], [236, 1798, -1], [306, 1786, 1]]) {
      c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 2, y); c.lineTo(x - 2, y + 12); c.moveTo(x + 2, y); c.lineTo(x + 2, y + 12); c.stroke();
      c.fillStyle = '#b9bdc0'; c.beginPath(); c.ellipse(x, y - 2, 10, 5, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#2a2420'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 7 * d, y - 4); c.lineTo(x + 10 * d, y - 18); c.stroke();
      c.fillStyle = '#2a2420'; c.beginPath(); c.arc(x + 10 * d, y - 19, 2.4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#f4f0e6'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 10 * d, y - 19); c.lineTo(x + 6 * d, y - 17); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + 12 * d, y - 19); c.lineTo(x + 16 * d, y - 18); c.stroke();
    }
  }, { t: 8.8, d: 0.7, reveal: 'fade' });

  // single animals grazing everywhere between the scenes
  const HS = [0.22, 0.28, 0.34, 0.42, 0.5], SS = [0.42, 0.52, 0.62, 0.74, 0.86];
  BAND_TOP.forEach((_, i) => {
    // a few small herds of one kind each, and lone riders going somewhere; the rest left empty
    const list = [];
    for (let h = 0; h < 3; h++) {
      const kind = r.pick(['horse', 'sheep', 'goat', 'cow', 'camel', 'horse']), n = kind === 'sheep' || kind === 'goat' ? 9 : 5;
      const cx = r.range(PX0 + 60, PX1 - 100), dir = r.chance(0.5) ? 1 : -1;
      for (let k = 0, got = 0; k < 60 && got < n; k++) {
        const x = cx + r.range(-70, 70), y0 = groundY(i, x) + 14, y1 = i < 4 ? groundY(i + 1, x) - 4 : PY1 - 8;
        const y = r.range(y0, y1);
        if (y1 - y0 < 10 || x < PX0 + 10 || x > PX1 - 50 || busy(x, y) || busy(x + 40 * HS[i], y)) continue;
        list.push([x, y, kind, r.pick(HORSES), r.chance(0.7) ? dir : -dir]); got++;
      }
    }
    for (let k = 0, got = 0; k < 60 && got < 2; k++) {
      const x = r.range(PX0 + 30, PX1 - 80), y = r.range(groundY(i, x) + 30, i < 4 ? groundY(i + 1, x) - 4 : PY1 - 8);
      if (busy(x, y, 30)) continue;
      list.push([x, y, 'rider', r.pick(HORSES), r.chance(0.5) ? 1 : -1, r.pick(DEELS)]); got++;
    }
    list.sort((a, b) => a[1] - b[1]);
    p.group('far', { x: PX0, y: BAND_TOP[i][0] - 60, w: PX1 - PX0, h: (i < 4 ? BAND_TOP[i + 1][0] : PY1) - BAND_TOP[i][0] + 90 }, (c) => {
      for (const [x, y, kind, col, d, deel] of list) {
        if (kind === 'horse') horse(c, x, y, HS[i], d, col);
        else if (kind === 'rider') horse(c, x, y, HS[i] * 1.1, d, col, { rider: deel, hat: d > 0 ? RED : BLUE });
        else if (kind === 'sheep') sheep(c, x, y, SS[i]);
        else if (kind === 'goat') goat(c, x, y, SS[i]);
        else if (kind === 'cow') yak(c, x, y, HS[i] * 1.1, d, '#7a4a2e');
        else camel(c, x, y, HS[i] * 0.95, d);
      }
    }, { t: 8.0 + i * 0.15, d: 0.6, reveal: 'fade' });
  });
}

// ================================================================ things on the steppe
// a ger: felt walls, a low cone of roof, ropes, a painted door and the crown
function ger(c, x, y, w, o = {}) {
  const h = w * 0.42, rh = w * 0.26;
  const wall = [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y - h], [x - w / 2, y - h]];
  const roof = [[x - w / 2 - w * 0.03, y - h], [x + w / 2 + w * 0.03, y - h], [x + w * 0.1, y - h - rh], [x - w * 0.1, y - h - rh]];
  shape(c, wall, FELT, { lw: o.small ? 0.7 : 1.2 });
  c.fillStyle = 'rgba(150,140,120,.35)'; poly(c, [[x + w * 0.2, y], [x + w / 2, y], [x + w / 2, y - h], [x + w * 0.2, y - h]]); c.fill();
  shape(c, roof, o.cover || FELT, { lw: o.small ? 0.7 : 1.2 });
  c.fillStyle = 'rgba(150,140,120,.3)'; poly(c, [[x + w * 0.2, y - h], [x + w / 2 + w * 0.03, y - h], [x + w * 0.1, y - h - rh], [x + w * 0.04, y - h - rh]]); c.fill();
  if (o.small) { c.fillStyle = DOOR; c.fillRect(x - w * 0.08, y - h * 0.7, w * 0.16, h * 0.7); return; }
  // the ropes round the wall and the roof
  c.strokeStyle = '#6a5a48'; c.lineWidth = Math.max(1, w * 0.012);
  c.beginPath();
  for (const k of [0.25, 0.6]) { c.moveTo(x - w / 2, y - h * k); c.lineTo(x + w / 2, y - h * k); }
  for (let k = -3; k <= 3; k++) { c.moveTo(x + k * w * 0.15, y - h); c.lineTo(x + k * w * 0.03, y - h - rh); }
  c.stroke();
  // the blue band at the eave, with its pattern
  c.fillStyle = o.band || BLUE; c.fillRect(x - w / 2, y - h - w * 0.02, w, w * 0.05);
  c.fillStyle = YEL; for (let xx = x - w / 2 + 4; xx < x + w / 2 - 4; xx += w * 0.06) c.fillRect(xx, y - h, w * 0.025, w * 0.012);
  // the door, painted orange with a pattern
  const dw = w * 0.17, dh = h * 0.78;
  shape(c, rect(x - dw / 2, y - dh, x + dw / 2, y), DOOR, { lw: 1 });
  c.strokeStyle = YEL; c.lineWidth = Math.max(1, w * 0.01); c.strokeRect(x - dw / 2 + 3, y - dh + 3, dw - 6, dh - 6);
  c.beginPath(); c.moveTo(x, y - dh + 6); c.lineTo(x, y - 6); c.stroke();
  // the crown and the stove pipe
  c.fillStyle = '#5a4a3a'; c.fillRect(x - w * 0.1, y - h - rh - w * 0.02, w * 0.2, w * 0.03);
  c.fillStyle = '#3a3330'; c.fillRect(x + w * 0.02, y - h - rh - w * 0.12, w * 0.035, w * 0.12);
}

// a horse, facing right, its hooves at (x, y). pose: legs' phase for a gallop, or null standing
function horse(c, x, y, s, dir, col, o = {}) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  const ph = o.phase;
  const dark = o.dark || '#2a1e18';
  // legs: [hip x, hip y] and the angle of each leg
  const legs = ph == null
    ? [[24, -34, 0.05], [30, -34, -0.05], [62, -34, 0.04], [68, -34, -0.04]]
    : [[22, -34, 0.6 * Math.sin(ph)], [30, -34, 0.6 * Math.sin(ph + 0.6)], [62, -34, -0.6 * Math.sin(ph + 1.6)], [68, -34, -0.6 * Math.sin(ph + 2.2)]];
  c.lineCap = 'round';
  legs.forEach(([hx, hy, a], i) => {
    const kx = hx + Math.sin(a) * 18, ky = hy + Math.cos(a) * 18;
    const bend = ph == null ? 0 : (i < 2 ? -0.5 : 0.6) * Math.max(0, Math.sin(ph + i));
    const fx = kx + Math.sin(a + bend) * 16, fy = ky + Math.cos(a + bend) * 16;
    c.strokeStyle = i % 2 ? col : dark; c.lineWidth = 5.5;
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
    c.fillStyle = '#1a1410'; c.fillRect(fx - 3, fy - 2, 6, 3);
  });
  // body, neck, head
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.2 / s;
  c.beginPath(); c.ellipse(45, -46, 29, 14, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  const lift = ph == null ? 0 : Math.sin(ph) * 3;
  const neck = [[60, -54], [74, -74 + lift], [84, -78 + lift], [100, -62 + lift], [98, -54 + lift], [86, -60 + lift], [74, -40]];
  poly(c, neck); c.fill(); c.stroke();
  // mane and tail
  c.strokeStyle = dark; c.lineWidth = 4;
  c.beginPath(); c.moveTo(62, -58); c.quadraticCurveTo(70, -76 + lift, 84, -80 + lift); c.stroke();
  c.lineWidth = 4.5;
  const tw = ph == null ? 0 : Math.sin(ph * 0.5) * 6;
  c.beginPath(); c.moveTo(17, -50); c.quadraticCurveTo(4, -40 + tw, 6, -16 + tw * 2); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(88, -68 + lift, 1.4, 0, Math.PI * 2); c.fill();
  // a rider in a deel and a pointed hat
  if (o.rider) {
    const rc = o.rider;
    c.fillStyle = rc; c.strokeStyle = INK; c.lineWidth = 1 / s;
    poly(c, [[36, -56], [56, -56], [54, -88], [42, -88]]); c.fill(); c.stroke();
    c.fillStyle = YEL; c.fillRect(40, -66, 15, 3);
    c.strokeStyle = rc; c.lineWidth = 5; c.beginPath(); c.moveTo(48, -56); c.lineTo(54, -40); c.stroke();
    c.fillStyle = '#b07a4c'; c.beginPath(); c.arc(49, -94, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = o.hat || RED; c.beginPath(); c.moveTo(41, -96); c.lineTo(57, -96); c.lineTo(50, -110); c.closePath(); c.fill();
    if (o.urga) { c.strokeStyle = '#6a4a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(50, -80); c.lineTo(130, -150); c.stroke(); c.lineWidth = 1.2; c.beginPath(); c.arc(132, -152, 7, 0, Math.PI * 2); c.stroke(); }
  }
  c.restore();
}
function sheep(c, x, y, s, wool = '#f4efe2', head = '#2a2420') {
  c.fillStyle = 'rgba(60,50,30,.25)'; c.beginPath(); c.ellipse(x + 1, y, 8 * s, 2 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = head; c.fillRect(x - 5 * s, y - 4 * s, 1.6 * s, 4 * s); c.fillRect(x + 4 * s, y - 4 * s, 1.6 * s, 4 * s);
  c.fillStyle = wool; c.beginPath(); c.ellipse(x, y - 6 * s, 7.5 * s, 4.5 * s, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(42,36,32,.6)'; c.lineWidth = 0.6 * s; c.stroke();
  c.fillStyle = head; c.beginPath(); c.ellipse(x + 8 * s, y - 7.5 * s, 2.6 * s, 2 * s, 0.4, 0, Math.PI * 2); c.fill();
}
function camel(c, x, y, s, dir, o = {}) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.strokeStyle = '#6a4a2a'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); for (const lx of [10, 18, 46, 54]) { c.moveTo(lx, -36); c.lineTo(lx + (lx % 4 ? 1 : -1), 0); } c.stroke();
  const body = [[4, -38], [8, -52], [16, -62], [24, -52], [32, -64], [40, -52], [56, -48], [64, -56], [70, -74], [80, -76], [84, -70], [76, -66], [70, -46], [58, -34], [10, -34]];
  c.fillStyle = '#b4834e'; poly(c, body); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.2 / s; poly(c, body); c.stroke();
  c.strokeStyle = '#8a5e32'; c.lineWidth = 1; c.beginPath(); c.moveTo(16, -62); c.lineTo(14, -54); c.moveTo(32, -64); c.lineTo(30, -55); c.stroke();
  if (o.load) {
    // a moving camp: felt rolls and lattice bundled between the humps
    c.fillStyle = FELT; poly(c, [[6, -46], [42, -46], [44, -66], [4, -66]]); c.fill(); c.strokeStyle = INK; c.lineWidth = 1 / s; c.stroke();
    c.strokeStyle = '#b8562c'; c.lineWidth = 2; c.beginPath(); c.moveTo(8, -56); c.lineTo(40, -56); c.stroke();
    c.fillStyle = RED; c.fillRect(14, -76, 20, 10);
  }
  c.restore();
}
function yak(c, x, y, s, dir, col = '#2a2420') {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.strokeStyle = '#1e1a18'; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); for (const lx of [12, 20, 44, 52]) { c.moveTo(lx, -20); c.lineTo(lx, 0); } c.stroke();
  // a heavy body with a hump over the shoulders and a long skirt of hair
  const body = [[4, -22], [2, -34], [10, -42], [30, -44], [44, -54], [56, -50], [62, -40], [68, -32], [72, -20], [66, -16], [60, -24], [56, -12], [50, -16], [44, -8], [36, -14], [28, -8], [20, -14], [12, -8], [8, -16]];
  c.fillStyle = col; poly(c, body); c.fill();
  c.strokeStyle = 'rgba(240,230,210,.35)'; c.lineWidth = 1;
  c.beginPath(); for (let k = 0; k < 8; k++) { c.moveTo(10 + k * 7, -38); c.lineTo(8 + k * 7, -12); } c.stroke();
  // the white face and the horns
  c.fillStyle = '#efe6d2'; c.beginPath(); c.ellipse(70, -26, 5, 7, 0.4, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#d9cdb2'; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(64, -34); c.quadraticCurveTo(58, -44, 64, -48); c.moveTo(70, -34); c.quadraticCurveTo(78, -42, 74, -48); c.stroke();
  c.strokeStyle = '#1e1a18'; c.lineWidth = 3; c.beginPath(); c.moveTo(4, -30); c.quadraticCurveTo(-6, -24, -4, -10); c.stroke();
  c.restore();
}
function person(c, x, y, h, col, hat = RED) {
  c.fillStyle = col; poly(c, [[x - h * 0.18, y], [x + h * 0.18, y], [x + h * 0.1, y - h * 0.72], [x - h * 0.1, y - h * 0.72]]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.8; c.stroke();
  c.fillStyle = YEL; c.fillRect(x - h * 0.13, y - h * 0.46, h * 0.26, h * 0.06);
  c.fillStyle = '#b07a4c'; c.beginPath(); c.arc(x, y - h * 0.8, h * 0.09, 0, Math.PI * 2); c.fill();
  c.fillStyle = hat; c.beginPath(); c.moveTo(x - h * 0.12, y - h * 0.84); c.lineTo(x + h * 0.12, y - h * 0.84); c.lineTo(x, y - h * 1.02); c.closePath(); c.fill();
}

function goat(c, x, y, s) {
  sheep(c, x, y, s, '#8a6448', '#3a2a20');
  c.strokeStyle = '#3a2a20'; c.lineWidth = 0.9 * s;
  c.beginPath(); c.moveTo(x + 7.5 * s, y - 9 * s); c.quadraticCurveTo(x + 6 * s, y - 13 * s, x + 4 * s, y - 13 * s); c.stroke();
}
function dog(c, x, y, s, col = '#3a2c24') {
  c.fillStyle = col;
  c.beginPath(); c.ellipse(x, y - 7 * s, 10 * s, 4.5 * s, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + 10 * s, y - 11 * s, 4 * s, 0, Math.PI * 2); c.fill();
  c.fillRect(x - 8 * s, y - 5 * s, 2.2 * s, 5 * s); c.fillRect(x + 5 * s, y - 5 * s, 2.2 * s, 5 * s);
  c.strokeStyle = col; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(x - 9 * s, y - 8 * s); c.quadraticCurveTo(x - 15 * s, y - 14 * s, x - 13 * s, y - 18 * s); c.stroke();
}
// a small figure kneeling or sitting: a cone of deel and a head
function sitter(c, x, y, h, col, hat = RED) {
  c.fillStyle = col; poly(c, [[x - h * 0.3, y], [x + h * 0.3, y], [x + h * 0.12, y - h * 0.55], [x - h * 0.12, y - h * 0.55]]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
  c.fillStyle = '#b07a4c'; c.beginPath(); c.arc(x, y - h * 0.66, h * 0.12, 0, Math.PI * 2); c.fill();
  c.fillStyle = hat; c.beginPath(); c.moveTo(x - h * 0.14, y - h * 0.72); c.lineTo(x + h * 0.14, y - h * 0.72); c.lineTo(x, y - h * 0.92); c.closePath(); c.fill();
}
function motorbike(c, x, y, s, dir, deel) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.strokeStyle = INK; c.lineWidth = 2.4;
  c.beginPath(); c.arc(-16, -8, 8, 0, Math.PI * 2); c.moveTo(24, -8); c.arc(16, -8, 8, 0, Math.PI * 2); c.stroke();
  c.fillStyle = RED; poly(c, [[-16, -10], [-6, -20], [12, -20], [16, -10], [4, -8]]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(12, -20); c.lineTo(10, -30); c.lineTo(4, -32); c.stroke();
  // the rider in a deel
  c.fillStyle = deel; poly(c, [[-10, -20], [4, -20], [2, -46], [-6, -46]]); c.fill();
  c.strokeStyle = deel; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -40); c.lineTo(8, -30); c.stroke();
  c.fillStyle = '#b07a4c'; c.beginPath(); c.arc(-2, -51, 5, 0, Math.PI * 2); c.fill();
  c.fillStyle = INK; c.beginPath(); c.arc(-2, -53, 5, Math.PI, 0); c.fill();
  c.restore();
}
function truck(c, x, y, s, dir, col) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.fillStyle = col; c.fillRect(-30, -24, 40, 16); c.fillRect(12, -30, 18, 22);
  c.fillStyle = '#cfe2ea'; c.fillRect(20, -27, 8, 8);
  c.fillStyle = '#d9c9a0'; c.fillRect(-28, -34, 36, 10);
  c.fillStyle = INK; for (const wx of [-20, 18]) { c.beginPath(); c.arc(wx, -7, 6, 0, Math.PI * 2); c.fill(); }
  c.restore();
}
// a cart on two tall wheels, piled with a load, pulled by a yak
function cart(c, x, y, s, dir, load) {
  yak(c, x + dir * 34 * s, y, s * 0.62, dir);
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.strokeStyle = '#5a4030'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(18, -24); c.lineTo(44, -18); c.stroke();
  c.fillStyle = '#8a6440'; c.fillRect(-26, -26, 46, 6);
  c.fillStyle = load; c.fillRect(-22, -42, 38, 16); c.strokeStyle = INK; c.lineWidth = 0.8; c.strokeRect(-22, -42, 38, 16);
  c.strokeStyle = '#6a4a2a'; c.lineWidth = 1; c.beginPath(); c.moveTo(-22, -34); c.lineTo(16, -34); c.stroke();
  c.strokeStyle = '#5a4030'; c.lineWidth = 2; c.beginPath(); c.arc(-4, -14, 14, 0, Math.PI * 2); c.stroke();
  c.lineWidth = 1; c.beginPath(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; c.moveTo(-4 + Math.cos(a) * 14, -14 + Math.sin(a) * 14); c.lineTo(-4 - Math.cos(a) * 14, -14 - Math.sin(a) * 14); } c.stroke();
  c.restore();
}
// two wrestlers gripping, in open jackets and briefs, boots on
function wrestlers(c, x, y, s, a = RED, b = BLUE) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (const [ox, col, d] of [[-8, a, 1], [8, b, -1]]) {
    c.strokeStyle = '#b07a4c'; c.lineWidth = 3.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ox - 2, -16); c.lineTo(ox - 7 * d, -2); c.moveTo(ox + 2, -16); c.lineTo(ox + 3 * d, -2); c.moveTo(ox + 4 * d, -32); c.lineTo(ox + 12 * d, -26); c.stroke();
    c.fillStyle = INK; c.fillRect(ox - 7 * d - 3, -4, 6, 4); c.fillRect(ox + 3 * d - 3, -4, 6, 4);
    c.fillStyle = col; poly(c, [[ox - 6 * d, -36], [ox + 8 * d, -33], [ox + 6 * d, -20], [ox - 4 * d, -22]]); c.fill();
    c.fillRect(ox - 4, -21, 8, 6);
    c.fillStyle = '#b07a4c'; c.beginPath(); c.arc(ox + 6 * d, -38, 4.6, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}
// an archer drawing his bow toward the left
function archer(c, x, y, h, col, hat) {
  person(c, x, y, h, col, hat);
  c.strokeStyle = '#5a3a1a'; c.lineWidth = 1.6;
  c.beginPath(); c.arc(x - h * 0.42, y - h * 0.66, h * 0.32, Math.PI * 0.6, Math.PI * 1.4); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 0.7;
  c.beginPath(); c.moveTo(x - h * 0.5, y - h * 0.96); c.lineTo(x - h * 0.06, y - h * 0.66); c.lineTo(x - h * 0.5, y - h * 0.36); c.stroke();
  c.beginPath(); c.moveTo(x - h * 0.8, y - h * 0.66); c.lineTo(x - h * 0.06, y - h * 0.66); c.stroke();
}
// a ger going up: the red lattice wall, the door frame, roof poles to the crown
function gerFrame(c, x, y, w) {
  const h = w * 0.42, rh = w * 0.26;
  c.strokeStyle = '#b8562c'; c.lineWidth = 1.2;
  c.beginPath();
  for (let k = -w / 2; k < w / 2; k += 6) { c.moveTo(x + k, y); c.lineTo(Math.min(x + w / 2, x + k + h), y - Math.min(h, w / 2 - k)); c.moveTo(x + k + 6, y); c.lineTo(Math.max(x - w / 2, x + k + 6 - h), y - Math.min(h, k + 6 + w / 2)); }
  c.stroke();
  c.strokeStyle = '#8a4a22'; c.lineWidth = 1.4;
  c.beginPath(); for (let k = -5; k <= 5; k++) { c.moveTo(x + (k * w) / 10, y - h); c.lineTo(x + k * w * 0.012, y - h - rh); } c.stroke();
  c.strokeStyle = '#5a3a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - w / 2, y - h); c.lineTo(x + w / 2, y - h); c.stroke();
  c.fillStyle = DOOR; c.fillRect(x - w * 0.08, y - h * 0.8, w * 0.16, h * 0.8);
  c.strokeStyle = '#5a3a1a'; c.lineWidth = 2; c.beginPath(); c.arc(x, y - h - rh, w * 0.06, 0, Math.PI * 2); c.stroke();
}
function flag(c, x, y, h, col) {
  c.strokeStyle = '#5a4030'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke();
  c.fillStyle = col; poly(c, [[x, y - h], [x + h * 0.34, y - h * 0.9], [x, y - h * 0.8]]); c.fill();
}
function fence(c, x0, x1, y, h, step = 8, col = '#8a6a48') {
  c.strokeStyle = col; c.lineWidth = Math.max(1, h * 0.07);
  c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.moveTo(x0, y - h * 0.6); c.lineTo(x1, y - h * 0.6);
  for (let x = x0; x <= x1; x += step) { c.moveTo(x, y); c.lineTo(x, y - h); }
  c.stroke();
}

// the gers of the steppe camps, set at build time so their smoke knows where they are
const CAMPS = [
  // band 2: a family camp
  [250, 1384, 70, {}], [342, 1376, 80, { band: RED }], [432, 1388, 66, {}],
  // band 3: a big camp to the right
  [1076, 1604, 112, { band: RED }], [1222, 1594, 128, {}], [1372, 1608, 104, { band: '#2f7a6a' }],
];
const PIPES = CAMPS.map(([x, y, w]) => [x + w * 0.0375, y - w * 0.8, w / 80]);

function scenes(p, r) {
  const S = (box, t, draw, o = {}) => p.group(o.layer || 'mid', box, draw, { t, d: o.d ?? 0.6, reveal: o.reveal || 'rise' });

  // ---- band 0, far off: camps, a herd of horses, a flock, riders, the road to the city
  S({ x: 690, y: 960, w: 730, h: 110 }, 8.2, (c) => {
    for (const [x, y, w] of [[1150, 1046, 46], [1214, 1040, 42], [1290, 1050, 50], [1360, 1042, 40]]) ger(c, x, y, w);
    fence(c, 1120, 1400, 1058, 8);
    for (const [x, y, w] of [[720, 1020, 30], [760, 1016, 26]]) ger(c, x, y, w, { small: true });
    for (const [x, y, col] of [[1186, 1062, DEELS[0]], [1250, 1060, DEELS[3]], [1330, 1064, DEELS[1]]]) person(c, x, y, 16, col);
  }, { layer: 'far' });
  const herd = [];
  for (let i = 0; i < 24; i++) herd.push([r.range(260, 640), r.range(1060, 1116), r.pick(HORSES), r.chance(0.5) ? 1 : -1]);
  herd.sort((a, b) => a[1] - b[1]);
  S({ x: 220, y: 1010, w: 480, h: 130 }, 8.4, (c) => {
    for (const [x, y, col, d] of herd) horse(c, x, y, 0.3, d, col);
    horse(c, 640, 1100, 0.34, -1, HORSES[4], { rider: DEELS[1], urga: true });
  }, { layer: 'far', reveal: 'fade' });
  const flock = [];
  for (let i = 0; i < 80; i++) flock.push([r.range(720, 1010), r.range(1070, 1122), r.chance(0.25)]);
  flock.sort((a, b) => a[1] - b[1]);
  S({ x: 700, y: 1050, w: 340, h: 90 }, 8.5, (c) => { for (const [x, y, gt] of flock) (gt ? goat : sheep)(c, x, y, 0.5); }, { layer: 'far', reveal: 'fade' });
  S({ x: PX0, y: 940, w: PX1 - PX0, h: 200 }, 8.6, (c) => {
    for (const [x, y, w] of [[170, 1050, 40], [222, 1056, 36]]) ger(c, x, y, w);
    fence(c, 140, 250, 1066, 7);
    horse(c, 1050, 1104, 0.34, 1, HORSES[4], { rider: DEELS[2] });
    horse(c, 1100, 1110, 0.34, 1, HORSES[1], { rider: DEELS[5], hat: BLUE });
    c.strokeStyle = '#cdbf98'; c.lineWidth = 6; c.beginPath(); c.moveTo(PX0, 972); c.quadraticCurveTo(600, 962, 1100, 956); c.lineTo(PX1, 958); c.stroke();
    const cars = [[300, 966, RED], [520, 962, '#efe8da'], [760, 958, BLUE], [940, 957, '#3a3330'], [1260, 957, '#e0b040']];
    for (const [x, y, col] of cars) { c.fillStyle = col; c.fillRect(x, y - 4, 12, 5); c.fillStyle = INK; c.fillRect(x + 2, y + 1, 2, 2); c.fillRect(x + 8, y + 1, 2, 2); }
    truck(c, 1400, 1004, 0.42, -1, '#3f8a62');
  }, { layer: 'far', reveal: 'fade' });

  // ---- band 1: the naadam. Archery, wrestling, the stand, the crowd along the race
  S({ x: PX0, y: 1140, w: 360, h: 90 }, 8.8, (c) => {
    // the archers' targets: a low wall of little leather cylinders, judges beside them
    for (let k = 0; k < 14; k++) { const x = 140 + k * 7; c.fillStyle = k % 3 ? '#e9dcc0' : RED; c.fillRect(x, 1176, 6, 8); }
    c.strokeStyle = INK; c.lineWidth = 0.6; c.strokeRect(140, 1176, 98, 8);
    person(c, 128, 1188, 18, DEELS[6], BLUE); person(c, 252, 1188, 18, DEELS[2], BLUE);
    flag(c, 118, 1186, 30, RED); flag(c, 262, 1186, 30, BLUE);
    [[350, DEELS[0]], [376, DEELS[4]], [402, DEELS[1]], [428, DEELS[3]]].forEach(([x, col], i) => archer(c, x, 1212, 26, col, i % 2 ? BLUE : RED));
    for (let k = 0; k < 6; k++) sitter(c, 380 + k * 12, 1182, 14, DEELS[(k + 3) % DEELS.length], k % 2 ? BLUE : RED);
  });
  const ring = [];
  for (let k = 0; k < 22; k++) { const a = Math.PI * (1.05 + 0.9 * k / 21); ring.push([590 + Math.cos(a) * 110, 1206 + Math.sin(a) * 34, DEELS[k % DEELS.length], k % 3 ? RED : BLUE]); }
  S({ x: 460, y: 1140, w: 260, h: 90 }, 9.0, (c) => {
    // the spectators sit in an arc; three pairs wrestle; a judge holds each one's hat
    for (const [x, y, col, hat] of ring) sitter(c, x, y, 14, col, hat);
    wrestlers(c, 536, 1216, 0.85); wrestlers(c, 594, 1208, 0.85, BLUE, '#6b3f8a'); wrestlers(c, 652, 1218, 0.85, RED, '#2f7a6a');
    person(c, 566, 1220, 22, '#2f7a6a', BLUE); person(c, 620, 1222, 22, DEELS[3], BLUE);
    flag(c, 488, 1220, 36, RED); flag(c, 700, 1222, 36, BLUE);
  });
  S({ x: 720, y: 1130, w: 170, h: 100 }, 9.2, (c) => {
    // the stand: a long tent roof, scalloped, on red posts, full of people
    c.fillStyle = RED_D; for (const x of [736, 778, 820, 862]) c.fillRect(x, 1180, 3, 36);
    for (let k = 0; k < 10; k++) sitter(c, 744 + k * 12, 1214, 16, DEELS[k % DEELS.length], k % 2 ? RED : BLUE);
    shape(c, [[726, 1182], [732, 1164], [868, 1164], [874, 1182]], BLUE, { lw: 1 });
    c.fillStyle = '#f2ead6'; for (let x = 730; x < 872; x += 12) { c.beginPath(); c.arc(x + 6, 1182, 6, 0, Math.PI); c.fill(); }
    c.fillStyle = YEL; c.fillRect(732, 1168, 136, 3);
    flag(c, 732, 1164, 28, RED); flag(c, 800, 1164, 32, YEL); flag(c, 868, 1164, 28, BLUE);
  });
  const crowd = [];
  for (let x = 900; x < PX1 - 10; x += r.range(8, 14)) crowd.push([x, 1230 + r.range(-3, 3), r.pick(DEELS), r.chance(0.5) ? RED : BLUE, r.range(14, 18)]);
  const parked = [[930, 1206, RED], [990, 1204, '#efe8da'], [1300, 1206, BLUE], [1360, 1204, '#3a3330'], [1420, 1206, '#e0b040']];
  S({ x: 880, y: 1170, w: PX1 - 880, h: 70 }, 9.4, (c) => {
    for (const [x, y, col] of parked) { c.fillStyle = col; c.fillRect(x, y - 8, 26, 9); c.fillRect(x + 5, y - 14, 15, 7); c.fillStyle = INK; c.beginPath(); c.arc(x + 6, y + 1, 3, 0, Math.PI * 2); c.arc(x + 20, y + 1, 3, 0, Math.PI * 2); c.fill(); }
    truck(c, 1180, 1210, 0.55, 1, '#3f8a62');
    for (const [x, y, col, hat, h] of crowd) person(c, x, y, h, col, hat);
    // the finish: two posts and a rope with streamers
    c.strokeStyle = '#5a4030'; c.lineWidth = 2; c.beginPath(); c.moveTo(1080, 1242); c.lineTo(1080, 1196); c.moveTo(1240, 1242); c.lineTo(1240, 1196); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.moveTo(1080, 1200); c.quadraticCurveTo(1160, 1210, 1240, 1200); c.stroke();
    for (let k = 1; k < 10; k++) { const x = 1080 + k * 16, y = 1200 + Math.sin((k / 10) * Math.PI) * 10; c.fillStyle = [RED, YEL, BLUE][k % 3]; poly(c, [[x - 3, y], [x + 3, y], [x, y + 7]]); c.fill(); }
  }, { reveal: 'fade' });

  // ---- band 2: a family camp, a ger going up, mares milked at the foal line, a caravan
  S({ x: 180, y: 1296, w: 450, h: 150 }, 9.0, (c) => {
    fence(c, 196, 470, 1400, 14, 9);
    for (const [x, y, w, o] of CAMPS.slice(0, 3)) ger(c, x, y, w, o);
    cart(c, 508, 1398, 0.9, 1, '#d6cdb6');
    person(c, 300, 1404, 26, DEELS[1]); person(c, 316, 1406, 18, DEELS[5], BLUE); dog(c, 380, 1406, 0.8);
    // felt laid out on the grass, a child beside it
    shape(c, [[200, 1420], [258, 1420], [262, 1432], [196, 1432]], FELT, { lw: 0.8 });
    person(c, 274, 1432, 16, DEELS[3], BLUE);
  });
  S({ x: 590, y: 1320, w: 150, h: 110 }, 9.3, (c) => {
    gerFrame(c, 640, 1408, 76);
    // two carrying a roll of felt, one on the roof poles
    person(c, 700, 1420, 26, DEELS[2]); person(c, 728, 1422, 26, DEELS[0], BLUE);
    shape(c, [[694, 1398], [734, 1400], [734, 1406], [694, 1404]], FELT, { lw: 0.7 });
    sitter(c, 652, 1372, 14, DEELS[4]);
  });
  const foals = [], mares = [];
  for (let k = 0; k < 6; k++) foals.push([794 + k * 28, 1436, r.pick(HORSES), r.chance(0.5) ? 1 : -1]);
  for (const x of [780, 846, 916]) mares.push([x, 1470, r.pick(HORSES)]);
  S({ x: 760, y: 1360, w: 230, h: 120 }, 9.5, (c) => {
    c.strokeStyle = '#5a4030'; c.lineWidth = 2; c.beginPath(); c.moveTo(776, 1440); c.lineTo(776, 1412); c.moveTo(968, 1440); c.lineTo(968, 1412); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.moveTo(776, 1416); c.quadraticCurveTo(872, 1424, 968, 1416); c.stroke();
    for (const [x, y, col, d] of foals) horse(c, x, y, 0.26, d, col);
    for (const [x, y, col] of mares) horse(c, x, y, 0.42, 1, col);
    sitter(c, 832, 1474, 18, DEELS[1]); c.fillStyle = '#9a9a9a'; c.fillRect(838, 1466, 6, 8);
    person(c, 960, 1476, 24, DEELS[6], BLUE);
  });
  S({ x: 1000, y: 1340, w: 460, h: 120 }, 9.6, (c) => {
    c.strokeStyle = '#6a4a2a'; c.lineWidth = 1; c.beginPath(); c.moveTo(1080, 1420); c.lineTo(1400, 1440); c.stroke();
    for (const [x, y] of [[1080, 1424], [1158, 1428], [1236, 1434], [1314, 1438]]) camel(c, x, y, 0.72, -1, { load: true });
    horse(c, 1400, 1446, 0.5, -1, HORSES[0], { rider: DEELS[3], hat: BLUE });
  });
  const goats = [];
  for (let i = 0; i < 34; i++) goats.push([r.range(1010, 1260), r.range(1452, 1490), r.chance(0.6)]);
  goats.sort((a, b) => a[1] - b[1]);
  S({ x: 990, y: 1430, w: 290, h: 70 }, 9.7, (c) => {
    for (const [x, y, gt] of goats) (gt ? goat : sheep)(c, x, y, 0.62);
    person(c, 1276, 1488, 26, DEELS[4], RED);
  }, { reveal: 'fade' });

  // ---- band 3: a herder with his pole lasso after loose horses; horses at the tether line; the big camp
  const loose = [];
  for (let i = 0; i < 10; i++) loose.push([r.range(420, 630), r.range(1600, 1704), r.pick(HORSES), r.range(0, 6.28)]);
  loose.sort((a, b) => a[1] - b[1]);
  S({ x: PX0, y: 1480, w: 580, h: 240 }, 9.8, (c) => {
    horse(c, 290, 1690, 0.82, 1, HORSES[5], { rider: BLUE, hat: RED, urga: true, phase: 1.1 });
    for (const [x, y, col, ph] of loose) horse(c, x, y, 0.5, 1, col, { phase: ph });
  });
  S({ x: 640, y: 1540, w: 340, h: 120 }, 10.0, (c) => {
    c.strokeStyle = '#5a4030'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(670, 1590); c.lineTo(670, 1640); c.moveTo(950, 1590); c.lineTo(950, 1640); c.stroke();
    c.lineWidth = 1.5; c.beginPath(); c.moveTo(670, 1594); c.lineTo(950, 1594); c.stroke();
    [[700, HORSES[2]], [760, HORSES[0]], [820, HORSES[3]], [880, HORSES[4]]].forEach(([x, col], i) => horse(c, x, 1646, 0.62, i % 2 ? 1 : -1, col));
    person(c, 960, 1652, 34, DEELS[2]);
  });
  S({ x: 960, y: 1460, w: 520, h: 210 }, 10.1, (c) => {
    fence(c, 1000, 1470, 1628, 20, 12, '#7a5a3a');
    for (const [x, y, w, o] of CAMPS.slice(3)) ger(c, x, y, w, o);
    // a laundry line, a churn and a pail, people at the door, a parked motorbike
    c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(1136, 1560); c.quadraticCurveTo(1150, 1566, 1162, 1560); c.stroke();
    [[1140, RED], [1148, YEL], [1155, BLUE]].forEach(([x, col]) => { c.fillStyle = col; c.fillRect(x - 3, 1562, 6, 8); });
    person(c, 1150, 1612, 34, DEELS[0]); person(c, 1166, 1614, 26, DEELS[3], BLUE);
    c.fillStyle = '#9a9a9a'; c.fillRect(1300, 1602, 10, 12); c.fillStyle = '#8a6440'; c.fillRect(1316, 1592, 9, 22);
    motorbike(c, 1000, 1652, 0.7, 1, DEELS[5]);
    dog(c, 1040, 1656, 1);
  });

  // ---- band 4, nearest: a flock with its shepherd, yaks, a woman with milk pails; the left kept calm
  const flock2 = [];
  for (let i = 0; i < 70; i++) flock2.push([r.range(500, 1060), r.range(1700, 1852), r.chance(0.3)]);
  flock2.sort((a, b) => a[1] - b[1]);
  S({ x: 470, y: 1660, w: 700, h: 210 }, 10.3, (c) => {
    for (const [x, y, gt] of flock2) (gt ? goat : sheep)(c, x, y, 0.8 + (y - 1700) / 600);
    horse(c, 1140, 1836, 0.74, -1, HORSES[3], { rider: DEELS[6], hat: BLUE });
  }, { reveal: 'fade' });
  S({ x: 1140, y: 1690, w: 350, h: 180 }, 10.5, (c) => {
    yak(c, 1220, 1780, 0.95, -1); yak(c, 1310, 1820, 1.1, 1); yak(c, 1400, 1770, 0.9, -1); yak(c, 1440, 1850, 1.0, -1, '#5a3a2a');
  });
  S({ x: PX0, y: 1700, w: 460, h: 170 }, 10.6, (c) => {
    // a woman carrying two pails on a yoke, a child running ahead, a foal
    person(c, 400, 1848, 52, DEELS[1], BLUE);
    c.strokeStyle = '#6a4a2a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(376, 1810); c.lineTo(424, 1810); c.stroke();
    c.fillStyle = '#9a9a9a'; c.fillRect(370, 1820, 10, 12); c.fillRect(420, 1820, 10, 12);
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(375, 1810); c.lineTo(375, 1820); c.moveTo(425, 1810); c.lineTo(425, 1820); c.stroke();
    person(c, 330, 1852, 30, DEELS[3], RED);
    horse(c, 416, 1764, 0.46, 1, HORSES[6]);
    for (const [x, y] of [[170, 1840], [230, 1856], [1180, 1858], [140, 1720]]) {
      for (let k = 0; k < 7; k++) { const a = k * 2.4; c.fillStyle = k % 2 ? '#e8c23a' : '#d84a3a'; c.beginPath(); c.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 4, 3.2, 0, Math.PI * 2); c.fill(); }
    }
  }, { reveal: 'fade' });
}

// ================================================================ what moves
function life(p, r) {
  // the horse race, galloping across the middle band, round and round
  const racers = [];
  for (let i = 0; i < 12; i++) racers.push([i * 118 + r.range(-30, 30), 1250 + (i % 3) * 12 + r.range(-3, 3), r.pick(HORSES), DEELS[i % DEELS.length], r.range(0, 6.28)]);
  racers.sort((a, b) => a[1] - b[1]);
  const span = PX1 - PX0 + 300;
  p.live('live', {
    t: 10.0, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      // the dust behind them
      for (const [x0, y, col, deel, ph] of racers) {
        const x = PX1 + 100 - (((time * 95 + x0) % span) + span) % span;
        c.fillStyle = 'rgba(200,180,130,.4)';
        c.beginPath(); c.ellipse(x + 38, y - 3, 22, 5, 0, 0, Math.PI * 2); c.fill();
        horse(c, x, y, 0.48, -1, col, { phase: time * 11 + ph, rider: deel, hat: RED });
      }
    },
  });
  // smoke from the stove pipes, curling
  const pipes = [[1290, 588, 1.4], [1345, 613, 1.3], ...PIPES];
  p.live('live', {
    t: 10.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.lineCap = 'round';
      pipes.forEach(([x, y, s], i) => {
        c.strokeStyle = i < 2 ? 'rgba(200,200,205,.75)' : 'rgba(230,226,215,.85)'; c.lineWidth = (i < 2 ? 7 : 2.2) * s;
        const n = i < 2 ? 8 : 6, st = i < 2 ? 9 : 6;
        c.beginPath(); c.moveTo(x, y);
        for (let k = 1; k <= n; k++) c.lineTo(x + Math.sin(time * 1.3 + k * 0.7 + i) * k * 1.6 * s + k * 3 * s, y - k * st * s);
        c.stroke();
      });
    },
  });
  // an eagle wheeling over the valley
  p.live('live', {
    t: 10.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const a = time * 0.3, x = 700 + Math.cos(a) * 220, y = 480 + Math.sin(a) * 60;
      const f = Math.sin(time * 2) * 4;
      c.save(); c.translate(x, y); c.rotate(Math.cos(a) * 0.15);
      c.fillStyle = '#3a2c24';
      c.beginPath(); c.moveTo(-34, -f); c.quadraticCurveTo(-14, -8, 0, 0); c.quadraticCurveTo(14, -8, 34, -f); c.quadraticCurveTo(14, 2, 0, 6); c.quadraticCurveTo(-14, 2, -34, -f); c.fill();
      c.beginPath(); c.moveTo(-5, 4); c.lineTo(5, 4); c.lineTo(0, 14); c.closePath(); c.fill();
      c.restore();
    },
  });
}

// ================================================================ the title
// one grapheme cluster at a time
function clusters(p, layer, str, cx, y, o) {
  const m = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  const font = `${o.weight} ${o.size}px ${F}`;
  m.font = font;
  const segs = typeof Intl !== 'undefined' && Intl.Segmenter
    ? [...new Intl.Segmenter('mn', { granularity: 'grapheme' }).segment(str)].map((s) => s.segment)
    : [...str];
  const tr = (o.track || 0) * o.size;
  const total = m.measureText(str).width + tr * (segs.length - 1), x0 = cx - total / 2;
  let pre = '';
  segs.forEach((g, i) => {
    const gw = m.measureText(g).width, gx = x0 + m.measureText(pre + g).width - gw + tr * i;
    pre += g;
    p.mark(layer, {
      t: o.t + i * o.gap, d: o.d, reveal: o.reveal || 'drop', dy: o.size * 0.25, ease: 'out',
      box: { x: gx - o.size * 0.2, y: y - o.size * 1.1, w: gw + o.size * 0.4, h: o.size * 1.4 },
      draw: (c) => {
        c.font = font; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        if (o.shadow) { c.fillStyle = o.shadow; c.fillText(g, gx + o.size * 0.025, y + o.size * 0.025); }
        c.fillStyle = o.color; c.fillText(g, gx, y);
      },
    });
  });
}

function title(p) {
  clusters(p, 'title', CYR, W / 2, 252, { weight: 600, size: 172, track: 0.035, color: BLUE, shadow: RED, t: 10.8, gap: 0.12, d: 0.6 });
  clusters(p, 'title', 'ULAANBAATAR', W / 2, 1962, { weight: 400, size: 34, track: 0.6, color: RED_D, t: 12.4, gap: 0.05, d: 0.4, reveal: 'fade' });
  p.group('title', { x: 300, y: 1930, w: 1000, h: 40 }, (c) => {
    c.fillStyle = RED;
    for (const s of [-1, 1]) {
      c.fillRect(W / 2 + s * 250 - (s < 0 ? 170 : 0), 1949, 170, 2);
      c.save(); c.translate(W / 2 + s * 430, 1950); c.rotate(Math.PI / 4); c.fillRect(-5, -5, 10, 10); c.restore();
    }
  }, { t: 13.0, d: 0.6, reveal: 'fade' });
}
