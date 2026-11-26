// Cusco: a painting of the Cusco school in a carved and gilded frame. A dark oil
// ground under yellowed varnish and fine cracks: the Plaza de Armas seen from
// above, the cathedral with its two squat towers and the richer front of La
// Compañía, the portales with their wooden balconies, red roofs climbing the
// hills to the zigzag walls of Sacsayhuamán, the Andes and a snow peak under a
// sky of gold-edged clouds; in front, a wall of fitted Inca stones, townsfolk in
// cloth worked with gold, and llamas. The name is painted on a cartouche.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, poly, mix, shade } from '../kit.js';

const GROUND = '#2a1a10';
const GOLD = '#c9993a', GOLD_L = '#f2d77e', GOLD_D = '#6b4614', BOLE = '#8a3322';
const INK = '#1c120a', ROOF = '#9a4a2c', ROOF_D = '#6e321e', WALL = '#e4d2ae', STONE = '#8f7962', STONE_D = '#5e4c3c';
const RED = '#a3262a', BLUE = '#2d4f7a', GREEN = '#3f6a3a', OCHRE = '#c08a2e', WHITE = '#efe2c4';
const FACE = '"MedievalSharp"';
const F = 130, PX0 = F, PX1 = W - F, PY0 = F, PY1 = H - F;   // the painting inside the frame

export const city = {
  id: 'cusco', name: 'Cusco', wall: '#24150d',
  alt: 'A painting in the manner of the Cusco school, dark under old varnish, in a carved gilt frame: the Plaza de Armas seen from above with the cathedral and its two towers, La Compañía de Jesús with its domed towers, arcades with wooden balconies and a fountain, red roofs climbing to the zigzag walls of Sacsayhuamán, green mountains and a snow peak under gold-edged clouds, and in front a wall of fitted Inca stones, townsfolk in cloth patterned with gold, and llamas, with the name on a painted cartouche',
  google: 'family=MedievalSharp',
  fonts: [['400 100px "MedievalSharp"', 'CUSCO Qosqo · el ombligo del mundo']],
  build,
};

function build() {
  const p = new Plate({ paper: GROUND, seed: 1650 });
  const r = p.r;
  p.stack('sky', 'mount', 'hills', 'town', 'church', 'plaza', 'portal', 'folk', 'inca', 'street', 'live', 'varnish', 'cartouche', 'frame', 'title');
  for (const n of ['frame', 'title']) p.layer(n, { clip: false });
  sky(p, r);
  mountains(p, r);
  hills(p, r);
  cathedral(p, r);
  compania(p, r);
  plaza(p, r);
  portales(p, r);
  folk(p, r);
  inca(p, r);
  street(p, r);
  life(p, r);
  varnish(p, r);
  frame(p, r);
  cartouche(p, r);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

// ================================================================ helpers
function vgrad(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  return g;
}
function line(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
function archPath(c, x, y, w, h) { c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); }
// gold brocade, as the Cusco painters stamped it over cloth: small flowers and dots
function brocade(c, pts, step = 9) {
  const b = boxOf(pts);
  c.save(); poly(c, pts); c.clip();
  c.fillStyle = GOLD_L; c.beginPath();
  for (let y = b.y + 3, k = 0; y < b.y + b.h; y += step, k++) for (let x = b.x + (k % 2) * step / 2; x < b.x + b.w; x += step) {
    c.moveTo(x + 1.6, y); c.arc(x, y, 1.6, 0, Math.PI * 2);
    c.moveTo(x + step / 2 + 0.8, y + step / 2); c.arc(x + step / 2, y + step / 2, 0.8, 0, Math.PI * 2);
  }
  c.fill();
  c.restore();
  // a gold hem
  c.strokeStyle = GOLD_L; c.lineWidth = 1.4; poly(c, pts); c.stroke();
}

// ================================================================ the sky
function sky(p, r) {
  const box = { x: PX0, y: PY0, w: PX1 - PX0, h: 800 };
  p.group('sky', box, (c) => {
    c.fillStyle = vgrad(c, PY0, PY0 + 760, [[0, '#1d2a2e'], [0.35, '#35514f'], [0.7, '#9a8a5a'], [1, '#e0b868']]);
    c.fillRect(PX0, PY0, PX1 - PX0, 800);
  }, { t: 1.0, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // clouds rolled in heaps, their edges caught in gold
  const clouds = [[330, 330, 260, 60], [1050, 280, 320, 70], [700, 470, 220, 48], [1300, 470, 190, 40], [260, 560, 180, 36]];
  clouds.forEach(([x, y, w, h], i) => {
    const puffs = [];
    const n = Math.round(w / (h * 0.8));
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; puffs.push([x - w / 2 + t * w, y - Math.sin(t * Math.PI) * h * 0.5 + r.range(-6, 6), (w / n) * r.range(0.62, 0.8)]); }
    p.group('sky', { x: x - w / 2 - 50, y: y - h * 1.4, w: w + 100, h: h * 2 }, (c) => {
      c.save(); c.beginPath(); c.rect(x - w, y - h * 2, w * 2, h * 2 + 10); c.clip();
      c.fillStyle = '#5a6458'; for (const [cx, cy, rr] of puffs) { c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#7c7f68'; for (const [cx, cy, rr] of puffs) { c.beginPath(); c.arc(cx - rr * 0.15, cy - rr * 0.2, rr * 0.78, 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = GOLD_L; c.lineWidth = 2.2; for (const [cx, cy, rr] of puffs) { c.beginPath(); c.arc(cx, cy, rr, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); }
      c.restore();
      c.strokeStyle = 'rgba(242,215,126,.6)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - w / 2, y + 1); c.lineTo(x + w / 2, y + 1); c.stroke();
    }, { t: 1.8 + i * 0.25, d: 0.9, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
  // birds in a long line, high
  const birds = [];
  for (let i = 0; i < 16; i++) birds.push([560 + i * 26 + r.range(-6, 6), 380 + Math.abs(i - 7) * 7 + r.range(-4, 4), r.range(5, 8)]);
  p.group('sky', { x: 520, y: 340, w: 480, h: 120 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath();
    for (const [x, y, s] of birds) { c.moveTo(x - s, y - s * 0.3); c.quadraticCurveTo(x - s * 0.4, y - s * 0.7, x, y); c.quadraticCurveTo(x + s * 0.4, y - s * 0.7, x + s, y - s * 0.3); }
    c.stroke();
  }, { t: 3.0, d: 0.6, reveal: 'fade' });
}

// ================================================================ the mountains
function ridgePts(r, x0, x1, base, top, n, jag) {
  const pts = [[x0, base]];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(x0, x1, t), top(lerp(x0, x1, t)) + r.range(-jag, jag)]); }
  pts.push([x1, base]);
  return pts;
}
function mountains(p, r) {
  // the far snow peak (Ausangate, far off to the southeast)
  const snow = [[960, 760], [1110, 600], [1150, 560], [1185, 585], [1230, 572], [1380, 700], [1480, 760]];
  p.group('mount', boxOf(snow, 4), (c) => {
    c.fillStyle = '#7d8a86'; poly(c, snow); c.fill();
    c.fillStyle = '#e8e4d4'; c.beginPath(); c.moveTo(1080, 630); c.lineTo(1150, 560); c.lineTo(1185, 585); c.lineTo(1230, 572); c.lineTo(1300, 630); c.lineTo(1260, 618); c.lineTo(1230, 640); c.lineTo(1200, 615); c.lineTo(1160, 648); c.lineTo(1130, 620); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(232,228,212,.35)'; c.lineWidth = 2; c.beginPath();
    for (let k = 0; k < 10; k++) { const x = 1110 + k * 18; c.moveTo(x, 630 + (k % 3) * 6); c.lineTo(x - 8 + k, 680 - (k % 2) * 14); }
    c.stroke();
  }, { t: 2.4, d: 1.0, reveal: 'rise' });
  // three ranges, far to near, darker and greener
  const ranges = [
    [690, (x) => 700 - 90 * Math.sin(x / 260) - 40 * Math.sin(x / 90 + 1), '#5f6e5c', 2.7],
    [760, (x) => 760 - 70 * Math.sin(x / 320 + 2) - 30 * Math.sin(x / 70), '#4a5c44', 3.0],
    [820, (x) => 830 - 50 * Math.sin(x / 200 + 4) - 20 * Math.sin(x / 55), '#3c5038', 3.3],
  ];
  for (const [base, top, col, t] of ranges) {
    const pts = ridgePts(r, PX0 - 10, PX1 + 10, 1100, top, 60, 6);
    const lines = [];
    for (let i = 0; i < 40; i++) { const x = r.range(PX0, PX1), y = top(x) + r.range(10, 80); lines.push([[x, y], [x + r.range(-30, 30), y + r.range(30, 70)]]); }
    p.group('mount', boxOf(pts, 4), (c) => {
      poly(c, pts); c.fillStyle = vgrad(c, base - 160, base + 200, [[0, shade(col, 1.25)], [1, shade(col, 0.6)]]); c.fill();
      c.strokeStyle = 'rgba(20,14,8,.16)'; c.lineWidth = 3; c.beginPath(); for (const l of lines) line(c, l); c.stroke();
    }, { t, d: 0.9, reveal: 'rise' });
  }
}

// the hills with fields and the town's roofs climbing them; Sacsayhuamán above
function hills(p, r) {
  // a slope on the left with terraced fields
  const slope = [[PX0 - 10, 1100], [PX0 - 10, 690], [300, 680], [520, 720], [700, 800], [900, 880], [900, 1100]];
  const fields = [];
  for (let i = 0; i < 26; i++) {
    const x = r.range(150, 820), y = r.range(740, 900), w = r.range(40, 90), h = r.range(10, 22);
    fields.push([x, y, w, h, r.pick(['#6f7d3a', '#8a8640', '#5d6e36', '#a08a46'])]);
  }
  p.group('hills', boxOf(slope, 4), (c) => {
    poly(c, slope); c.fillStyle = '#4f5f38'; c.fill();
    c.save(); poly(c, slope); c.clip();
    for (const [x, y, w, h, col] of fields) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y - 6); c.lineTo(x + w + 8, y + h); c.lineTo(x + 6, y + h + 4); c.fill(); }
    c.strokeStyle = 'rgba(28,18,10,.35)'; c.lineWidth = 1.2; c.beginPath();
    for (let y = 700; y < 1000; y += 14) { c.moveTo(PX0, y + Math.sin(y) * 4); c.quadraticCurveTo(500, y + 30, 900, y + 70); }
    c.stroke(); c.restore();
  }, { t: 3.6, d: 0.9, reveal: 'rise' });
  // Sacsayhuamán: three walls stepping back in zigzags across the hilltop
  const zig = (y0, x0, x1, a) => { const pts = []; let up = true; for (let x = x0; x <= x1; x += 26) { pts.push([x, y0 + (up ? 0 : a) + (x - x0) * 0.05]); up = !up; } return pts; };
  const walls = [zig(706, 180, 520, 14), zig(730, 170, 540, 16), zig(756, 160, 560, 18)];
  walls.forEach((w, i) => {
    p.group('hills', boxOf(w, 20), (c) => {
      c.fillStyle = '#7a6f5a'; c.beginPath(); line(c, w); for (let k = w.length - 1; k >= 0; k--) c.lineTo(w[k][0], w[k][1] + 18); c.closePath(); c.fill();
      c.fillStyle = 'rgba(20,14,8,.35)'; c.beginPath(); for (let k = 0; k < w.length - 1; k++) if (w[k + 1][1] > w[k][1]) { c.moveTo(w[k][0], w[k][1]); c.lineTo(w[k + 1][0], w[k + 1][1]); c.lineTo(w[k + 1][0], w[k + 1][1] + 18); c.lineTo(w[k][0], w[k][1] + 18); } c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); line(c, w); c.stroke();
      c.strokeStyle = 'rgba(28,18,10,.5)'; c.lineWidth = 0.8; c.beginPath();
      for (let k = 0; k < w.length - 1; k++) { const [x, y] = w[k]; c.moveTo(x + 6, y + 2); c.lineTo(x + 6, y + 17); c.moveTo(x + 16, y + 4); c.lineTo(x + 14, y + 17); c.moveTo(x, y + 9); c.lineTo(x + 24, y + 10); }
      c.stroke();
    }, { t: 3.9 + i * 0.2, d: 0.7, reveal: 'wipe' });
  });
  // the town: rows of white houses with red roofs, from the hills down to the square
  const rows = [[860, 0.55, 300, 1300], [900, 0.62, 160, 1440], [940, 0.7, 140, 1460], [985, 0.8, 140, 1460], [1030, 0.9, 140, 1460]];
  rows.forEach(([base, s, x0, x1], i) => {
    const hs = [];
    for (let x = x0 + r.range(-20, 0); x < x1;) {
      const w = r.range(36, 70) * s, h = r.range(22, 40) * s;
      const y = base + Math.sin(x / 140 + i) * 10 * s + r.range(-4, 4);
      hs.push([x, y, w, h, r.chance(0.2) ? '#d8b37a' : WALL, r.chance(0.5)]);
      x += w + r.range(-4, 2);
    }
    p.group('town', { x: x0 - 20, y: base - 70, w: x1 - x0 + 60, h: 120 }, (c) => {
      for (const [x, y, w, h, col] of hs) { c.fillStyle = col; c.fillRect(x, y - h, w, h + 14); }
      c.fillStyle = 'rgba(28,18,10,.25)'; for (const [x, y, w, h] of hs) c.fillRect(x + w * 0.72, y - h, w * 0.28, h + 14);
      c.fillStyle = ROOF; c.beginPath();
      for (const [x, y, w, h, , hip] of hs) { c.moveTo(x - 3, y - h); c.lineTo(x + w * (hip ? 0.25 : 0.5), y - h - 12 * s); if (hip) c.lineTo(x + w * 0.75, y - h - 12 * s); c.lineTo(x + w + 3, y - h); }
      c.fill();
      c.strokeStyle = ROOF_D; c.lineWidth = 0.8; c.beginPath();
      for (const [x, y, w, h] of hs) for (let rx = x + 2; rx < x + w; rx += 4) { c.moveTo(rx, y - h - 1); c.lineTo(rx + (x + w / 2 - rx) * 0.2, y - h - 9 * s); }
      c.stroke();
      c.fillStyle = INK; c.beginPath();
      for (const [x, y, w, h] of hs) { c.rect(x + w * 0.2, y - h * 0.55, 4 * s, 6 * s); if (w > 40 * s) c.rect(x + w * 0.55, y - h * 0.55, 4 * s, 6 * s); }
      c.fill();
    }, { t: 4.3 + i * 0.3, d: 0.8, reveal: 'rise' });
  });
}

// ================================================================ the cathedral
const PLAZA = 1060;   // the back edge of the square
function cathedral(p, r) {
  const x0 = 400, x1 = 800, base = PLAZA - 6;
  // the nave's long tiled roof behind the front
  p.group('church', { x: 320, y: 830, w: 560, h: base - 826 }, (c) => {
    c.fillStyle = ROOF_D; c.beginPath(); c.moveTo(x0 + 20, 920); c.lineTo(x0 + 120, 880); c.lineTo(x1 + 40, 880); c.lineTo(x1 + 60, 920); c.fill();
    // the side chapels, Jesús María on the left and El Triunfo on the right, with small domes
    for (const [cx, w] of [[350, 90], [850, 80]]) {
      c.fillStyle = STONE; c.fillRect(cx - w / 2, 950, w, base - 950);
      c.fillStyle = '#9c9077'; c.beginPath(); c.moveTo(cx - 24, 950); c.quadraticCurveTo(cx, 902, cx + 24, 950); c.fill();
      c.fillStyle = STONE_D; c.fillRect(cx - 3, 896, 6, 12);
      c.fillStyle = INK; c.beginPath(); archPath(c, cx - 12, 990, 24, base - 990); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(cx - w / 2, 950, w, base - 950);
    }
  }, { t: 5.4, d: 0.8, reveal: 'rise' });
  // the main front and its two towers
  const towers = [[x0, x0 + 84], [x1 - 84, x1]];
  p.group('church', { x: x0 - 20, y: 740, w: x1 - x0 + 40, h: base - 736 }, (c) => {
    c.fillStyle = STONE; c.fillRect(x0 + 84, 880, x1 - x0 - 168, base - 880);
    for (const [a, b] of towers) {
      c.fillStyle = STONE; c.fillRect(a, 830, b - a, base - 830);
      c.fillStyle = STONE_D; c.fillRect(b - 18, 830, 18, base - 830);
      // the belfry stage, its cornice, a little dome and lantern
      c.fillStyle = '#9a8e75'; c.fillRect(a + 6, 770, b - a - 12, 62);
      c.fillStyle = STONE_D; c.fillRect(a - 4, 826, b - a + 8, 8); c.fillRect(a + 2, 766, b - a - 4, 6);
      c.fillStyle = INK; c.beginPath(); archPath(c, a + 16, 784, 20, 40); archPath(c, b - 36, 784, 20, 40); c.fill();
      const m = (a + b) / 2;
      c.fillStyle = '#a09479'; c.beginPath(); c.moveTo(m - 32, 766); c.quadraticCurveTo(m - 30, 734, m, 730); c.quadraticCurveTo(m + 30, 734, m + 32, 766); c.fill();
      c.fillStyle = STONE_D; c.fillRect(m - 5, 716, 10, 16);
      c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(m, 716); c.lineTo(m, 700); c.moveTo(m - 5, 706); c.lineTo(m + 5, 706); c.stroke();
      // pinnacles on the corners
      c.fillStyle = '#9a8e75'; for (const px of [a + 2, b - 8]) { c.fillRect(px, 754, 6, 12); c.beginPath(); c.arc(px + 3, 752, 4, 0, Math.PI * 2); c.fill(); }
    }
    // the gable over the middle
    c.fillStyle = STONE; c.beginPath(); c.moveTo(x0 + 84, 880); c.lineTo((x0 + x1) / 2, 846); c.lineTo(x1 - 84, 880); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath();
    c.rect(x0 + 84, 880, x1 - x0 - 168, base - 880);
    for (const [a, b] of towers) c.rect(a, 830, b - a, base - 830);
    c.moveTo(x0 + 84, 880); c.lineTo((x0 + x1) / 2, 846); c.lineTo(x1 - 84, 880);
    c.stroke();
  }, { t: 5.7, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the carved front: a retablo of columns, niches and the great door
  const m = (x0 + x1) / 2;
  p.group('church', { x: x0 + 80, y: 840, w: x1 - x0 - 160, h: base - 836 }, (c) => {
    c.fillStyle = '#a3977c'; c.fillRect(m - 70, 900, 140, base - 900);
    c.fillStyle = INK; c.beginPath(); archPath(c, m - 26, 980, 52, base - 980); c.fill();
    c.beginPath(); archPath(c, m - 14, 916, 28, 46); c.fill();
    for (const dx of [-58, -40, 40, 58]) { c.fillStyle = '#c0b393'; c.fillRect(m + dx - 3, 904, 6, base - 908); }
    c.fillStyle = INK; for (const dx of [-110, 110]) { c.beginPath(); archPath(c, m + dx - 10, 950, 20, 36); c.fill(); c.fillRect(m + dx - 8, 1000, 16, 26); }
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath();
    c.moveTo(m - 74, 900); c.lineTo(m + 74, 900); c.moveTo(m - 74, 968); c.lineTo(m + 74, 968);
    c.rect(m - 70, 900, 140, base - 900); c.stroke();
    c.strokeStyle = GOLD; c.lineWidth = 1.4; c.beginPath(); c.arc(m, 980 + 26, 32, Math.PI, 0); c.stroke();
    // the stone's shading
    c.strokeStyle = 'rgba(28,18,10,.25)'; c.lineWidth = 1; c.beginPath();
    for (let y = 884; y < base; y += 12) { c.moveTo(x0 + 86, y); c.lineTo(m - 72, y); c.moveTo(m + 72, y); c.lineTo(x1 - 86, y); }
    c.stroke();
  }, { t: 6.4, d: 0.8, reveal: 'fade' });
  // coursing on the towers, gold bells in the belfries
  p.group('church', { x: x0 - 10, y: 700, w: x1 - x0 + 20, h: base - 696 }, (c) => {
    c.strokeStyle = 'rgba(28,18,10,.28)'; c.lineWidth = 1; c.beginPath();
    for (const [a, b] of towers) for (let y = 842; y < base; y += 11) { c.moveTo(a + 2, y); c.lineTo(b - 2, y); for (let x = a + 8 + ((y / 11 | 0) % 2) * 9; x < b - 4; x += 18) { c.moveTo(x, y); c.lineTo(x, y + 11); } }
    c.stroke();
    c.fillStyle = GOLD;
    for (const [a, b] of towers) for (const bx of [a + 26, b - 26]) { c.beginPath(); c.moveTo(bx - 7, 812); c.quadraticCurveTo(bx - 7, 798, bx, 797); c.quadraticCurveTo(bx + 7, 798, bx + 7, 812); c.fill(); }
    c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath();
    for (const [a, b] of towers) { c.moveTo(a - 4, 834); c.lineTo(b + 4, 834); c.moveTo(a + 2, 770); c.lineTo(b - 2, 770); }
    c.moveTo(x0 + 84, 880); c.lineTo(x1 - 84, 880);
    c.stroke();
  }, { t: 6.7, d: 0.6, reveal: 'fade' });
  // the raised platform and its steps
  p.group('church', { x: 300, y: base - 6, w: 620, h: 30 }, (c) => {
    c.fillStyle = '#7a705c'; c.fillRect(300, base, 620, 18);
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); for (let k = 0; k < 4; k++) { c.moveTo(300, base + 4 + k * 4.5); c.lineTo(920, base + 4 + k * 4.5); } c.stroke();
  }, { t: 6.8, d: 0.6, reveal: 'wipe' });
}

// La Compañía: a taller, richer front, two domed towers with lanterns, a dome behind
function compania(p, r) {
  const x0 = 1010, x1 = 1270, base = PLAZA + 4, m = (x0 + x1) / 2;
  p.group('church', { x: x0 - 20, y: 680, w: x1 - x0 + 40, h: base - 676 }, (c) => {
    // the dome behind
    c.fillStyle = '#8f8670'; c.fillRect(m - 40, 820, 80, 40);
    c.fillStyle = '#a3987c'; c.beginPath(); c.moveTo(m - 44, 822); c.bezierCurveTo(m - 42, 770, m + 42, 770, m + 44, 822); c.fill();
    c.fillStyle = STONE_D; c.fillRect(m - 6, 770, 12, 18);
    // the front between the towers, crowned by a scalloped pediment
    c.fillStyle = '#968a70'; c.fillRect(x0 + 60, 860, x1 - x0 - 120, base - 860);
    c.beginPath(); c.moveTo(x0 + 60, 862); c.quadraticCurveTo(x0 + 80, 840, m - 30, 846); c.quadraticCurveTo(m, 812, m + 30, 846); c.quadraticCurveTo(x1 - 80, 840, x1 - 60, 862); c.fill();
    for (const [a, b] of [[x0, x0 + 60], [x1 - 60, x1]]) {
      const tm = (a + b) / 2;
      c.fillStyle = '#968a70'; c.fillRect(a, 840, b - a, base - 840);
      c.fillStyle = '#6e6450'; c.fillRect(b - 14, 840, 14, base - 840);
      // the octagonal belfry, the dome, the lantern
      c.fillStyle = '#8a7f66'; c.fillRect(a + 6, 774, b - a - 12, 66);
      c.fillStyle = INK; c.beginPath(); archPath(c, tm - 10, 786, 20, 40); c.fill();
      c.fillStyle = '#a3987c'; c.beginPath(); c.moveTo(a + 2, 776); c.quadraticCurveTo(tm, 726, b - 2, 776); c.fill();
      c.fillStyle = '#968a70'; c.fillRect(tm - 7, 718, 14, 18);
      c.fillStyle = '#a3987c'; c.beginPath(); c.moveTo(tm - 9, 720); c.quadraticCurveTo(tm, 704, tm + 9, 720); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(tm, 706); c.lineTo(tm, 690); c.moveTo(tm - 4, 697); c.lineTo(tm + 4, 697);
      c.rect(a, 840, b - a, base - 840); c.rect(a + 6, 774, b - a - 12, 66); c.stroke();
      c.fillStyle = STONE_D; c.fillRect(a - 4, 836, b - a + 8, 7);
    }
    // the carved middle: three stages of columns, a window and the door
    c.fillStyle = INK; c.beginPath(); archPath(c, m - 22, 990, 44, base - 990); archPath(c, m - 14, 900, 28, 50); c.fill();
    c.fillStyle = '#c0b393';
    for (const dx of [-62, -46, 46, 62]) for (const [y0, y1] of [[870, 960], [970, base - 4]]) c.fillRect(m + dx - 2.5, y0, 5, y1 - y0);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath();
    c.rect(x0 + 60, 860, x1 - x0 - 120, base - 860);
    c.moveTo(x0 + 60, 964); c.lineTo(x1 - 60, 964); c.moveTo(x0 + 60, 868); c.lineTo(x1 - 60, 868);
    c.moveTo(x0 + 60, 862); c.quadraticCurveTo(x0 + 80, 840, m - 30, 846); c.quadraticCurveTo(m, 812, m + 30, 846); c.quadraticCurveTo(x1 - 80, 840, x1 - 60, 862);
    c.stroke();
    c.strokeStyle = GOLD; c.lineWidth = 1.4; c.beginPath(); c.arc(m, 830, 7, 0, Math.PI * 2); c.stroke();
  }, { t: 6.2, d: 1.2, reveal: 'rise', ease: 'inOut' });
  p.group('church', { x: x0 - 10, y: 760, w: x1 - x0 + 20, h: base - 756 }, (c) => {
    c.strokeStyle = 'rgba(28,18,10,.28)'; c.lineWidth = 1; c.beginPath();
    for (const [a, b] of [[x0, x0 + 60], [x1 - 60, x1]]) for (let y = 852; y < base; y += 11) { c.moveTo(a + 2, y); c.lineTo(b - 2, y); }
    c.stroke();
    c.fillStyle = GOLD;
    for (const bx of [x0 + 30, x1 - 30]) { c.beginPath(); c.moveTo(bx - 6, 818); c.quadraticCurveTo(bx - 6, 805, bx, 804); c.quadraticCurveTo(bx + 6, 805, bx + 6, 818); c.fill(); }
    c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 60, 964); c.lineTo(x1 - 60, 964); c.moveTo(x0 - 4, 840); c.lineTo(x0 + 64, 840); c.moveTo(x1 - 64, 840); c.lineTo(x1 + 4, 840); c.stroke();
  }, { t: 7.0, d: 0.6, reveal: 'fade' });
}

// ================================================================ the square
// the square in perspective: the back edge, the front edge, and the corners
const SQ = [[300, PLAZA], [1300, PLAZA], [1470, 1420], [130, 1420]];
function plaza(p, r) {
  p.group('plaza', boxOf(SQ, 4), (c) => {
    poly(c, SQ); c.fillStyle = vgrad(c, PLAZA, 1420, [[0, '#8a7656'], [1, '#5e4a32']]); c.fill();
    // the paths crossing to the fountain, and the paving lines
    c.fillStyle = 'rgba(214,190,140,.45)';
    c.beginPath(); c.moveTo(760, PLAZA); c.lineTo(840, PLAZA); c.lineTo(900, 1420); c.lineTo(700, 1420); c.fill();
    c.beginPath(); c.moveTo(240, 1220); c.lineTo(1360, 1220); c.lineTo(1380, 1260); c.lineTo(220, 1260); c.fill();
    c.strokeStyle = 'rgba(28,18,10,.25)'; c.lineWidth = 1; c.beginPath();
    for (let k = 0; k <= 24; k++) { const t = k / 24; c.moveTo(lerp(300, 1300, t), PLAZA); c.lineTo(lerp(130, 1470, t), 1420); }
    for (let y = PLAZA + 12; y < 1420; y += 12 + (y - PLAZA) * 0.05) { const t = (y - PLAZA) / 360; c.moveTo(lerp(300, 130, t), y); c.lineTo(lerp(1300, 1470, t), y); }
    c.stroke();
  }, { t: 7.0, d: 0.9, reveal: 'fall', ease: 'inOut' });
  // the gardens on either side of the fountain
  const beds = [[460, 1150], [1140, 1150], [420, 1320], [1180, 1320]];
  const flowers = [];
  for (const [x, y] of beds) for (let i = 0; i < 14; i++) flowers.push([x + r.range(-60, 60), y + r.range(-14, 14), r.pick([RED, GOLD_L, WHITE, '#c0507a'])]);
  p.group('plaza', { x: 300, y: 1110, w: 1000, h: 250 }, (c) => {
    for (const [x, y] of beds) { c.fillStyle = '#3f5a2e'; c.beginPath(); c.ellipse(x, y, 80, 22, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); }
    for (const [x, y, col] of flowers) { c.fillStyle = col; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill(); }
  }, { t: 7.5, d: 0.6, reveal: 'fade' });
  // the fountain: a basin, two tiers and a finial
  const fx = 800, fy = 1240;
  p.group('plaza', { x: fx - 90, y: fy - 130, w: 180, h: 150 }, (c) => {
    c.fillStyle = '#7d735e'; c.beginPath(); c.ellipse(fx, fy, 74, 18, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3a5a5e'; c.beginPath(); c.ellipse(fx, fy - 4, 64, 13, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8a8068'; c.fillRect(fx - 8, fy - 60, 16, 58);
    c.beginPath(); c.ellipse(fx, fy - 60, 36, 9, 0, 0, Math.PI * 2); c.fill();
    c.fillRect(fx - 5, fy - 96, 10, 36);
    c.beginPath(); c.ellipse(fx, fy - 96, 20, 6, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(fx, fy - 108, 7, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.ellipse(fx, fy, 74, 18, 0, 0, Math.PI * 2); c.moveTo(fx + 36, fy - 60); c.ellipse(fx, fy - 60, 36, 9, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = GOLD; c.beginPath(); c.moveTo(fx - 74, fy); c.ellipse(fx, fy, 74, 18, 0, Math.PI, Math.PI * 2); c.stroke();
  }, { t: 7.8, d: 0.7, reveal: 'rise' });
}

// the portales: arcades down both sides of the square, wooden balconies above
function portales(p, r) {
  for (const side of [-1, 1]) {
    // the arcade's foot runs from the back corner to the front corner
    const back = side < 0 ? [300, PLAZA] : [1300, PLAZA], front = side < 0 ? [130, 1420] : [1470, 1420];
    const at = (t) => [lerp(back[0], front[0], t), lerp(back[1], front[1], t)];
    const hAt = (t) => lerp(110, 260, t);
    const n = 9;
    const face = [];
    for (let k = 0; k <= 20; k++) { const t = k / 20, [x, y] = at(t); face.push([x, y - hAt(t)]); }
    const outer = side < 0 ? [[PX0 - 10, PLAZA - 140], ...face, [PX0 - 10, 1440]] : [[PX1 + 10, PLAZA - 140], ...face, [PX1 + 10, 1440]];
    const foot = []; for (let k = 20; k >= 0; k--) { const t = k / 20; foot.push(at(t)); }
    const wall = [...face, ...foot];
    p.group('portal', boxOf(outer, 6), (c) => {
      // the roofs and the houses' upper walls behind
      poly(c, outer); c.fillStyle = ROOF_D; c.fill();
      poly(c, wall); c.fillStyle = WALL; c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.2; poly(c, wall); c.stroke();
      // the arches of the arcade, dark under the vaults
      c.fillStyle = '#3a2618';
      for (let k = 0; k < n; k++) {
        const t0 = (k + 0.14) / n, t1 = (k + 0.86) / n;
        const [xa, ya] = at(t0), [xb, yb] = at(t1), hh = hAt((t0 + t1) / 2) * 0.46;
        c.beginPath(); c.moveTo(xa, ya); c.lineTo(xa, ya - hh * 0.6); c.quadraticCurveTo((xa + xb) / 2, (ya + yb) / 2 - hh * 1.25, xb, yb - hh * 0.6); c.lineTo(xb, yb); c.closePath(); c.fill();
      }
      // the cornice between the stories
      c.strokeStyle = '#7a6a50'; c.lineWidth = 3; c.beginPath();
      for (let k = 0; k <= 20; k++) { const t = k / 20, [x, y] = at(t); k ? c.lineTo(x, y - hAt(t) * 0.56) : c.moveTo(x, y - hAt(t) * 0.56); }
      c.stroke();
    }, { t: 7.2 + (side > 0 ? 0.3 : 0), d: 0.9, reveal: side < 0 ? 'wipe' : 'wipeL', ease: 'inOut' });
    // the carved wooden balconies, green and blue, on the upper story
    p.group('portal', boxOf(face, 40), (c) => {
      for (let k = 0; k < n; k++) {
        const t0 = (k + 0.2) / n, t1 = (k + 0.8) / n;
        const [xa, ya] = at(t0), [xb, yb] = at(t1);
        const ha = hAt(t0), hb = hAt(t1);
        const q = [[xa, ya - ha * 0.6], [xb, yb - hb * 0.6], [xb, yb - hb * 0.88], [xa, ya - ha * 0.88]];
        c.fillStyle = k % 3 === 1 ? BLUE : GREEN; poly(c, q); c.fill();
        c.strokeStyle = '#1a2a1a'; c.lineWidth = 1; c.beginPath();
        for (let s = 1; s < 5; s++) { const u = s / 5; c.moveTo(lerp(xa, xb, u), lerp(ya - ha * 0.6, yb - hb * 0.6, u)); c.lineTo(lerp(xa, xb, u), lerp(ya - ha * 0.88, yb - hb * 0.88, u)); }
        c.stroke();
        c.strokeStyle = GOLD; c.lineWidth = 1.2; poly(c, q); c.stroke();
      }
    }, { t: 8.0 + (side > 0 ? 0.2 : 0), d: 0.6, reveal: 'fade' });
  }
}

// ================================================================ the townsfolk
// a figure in a full skirt or a poncho, a hat, and cloth worked with gold
function person(c, x, y, s, o) {
  const body = o.skirt
    ? [[x - 13 * s, y], [x - 5 * s, y - 26 * s], [x + 5 * s, y - 26 * s], [x + 13 * s, y]]
    : [[x - 11 * s, y - 10 * s], [x - 6 * s, y - 30 * s], [x + 6 * s, y - 30 * s], [x + 11 * s, y - 10 * s]];
  if (!o.skirt) { c.fillStyle = INK; c.fillRect(x - 5 * s, y - 12 * s, 3.5 * s, 12 * s); c.fillRect(x + 1.5 * s, y - 12 * s, 3.5 * s, 12 * s); }
  c.fillStyle = o.top; c.fillRect(x - 5 * s, y - 36 * s, 10 * s, 12 * s);
  c.fillStyle = o.col; poly(c, body); c.fill();
  brocade(c, body, 6 * s);
  c.fillStyle = '#8a5a3a'; c.beginPath(); c.arc(x, y - 40 * s, 4.5 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = o.hat;
  if (o.skirt) { c.fillRect(x - 9 * s, y - 46 * s, 18 * s, 3 * s); c.fillRect(x - 5 * s, y - 50 * s, 10 * s, 4 * s); }
  else { c.beginPath(); c.moveTo(x - 6 * s, y - 43 * s); c.lineTo(x, y - 53 * s); c.lineTo(x + 6 * s, y - 43 * s); c.fill(); }
  if (o.bundle) { c.fillStyle = o.bundle; c.beginPath(); c.ellipse(x + 2 * s, y - 32 * s, 9 * s, 8 * s, 0, 0, Math.PI * 2); c.fill(); }
}
// a llama: a woolly body, long neck, ears with colored tassels, a blanket
function llama(c, x, y, s, o) {
  const col = o.col, dir = o.dir || 1;
  const X = (u) => x + u * s * dir;
  c.fillStyle = col;
  c.beginPath(); c.ellipse(x, y - 30 * s, 22 * s, 11 * s, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(X(14), y - 36 * s); c.lineTo(X(20), y - 70 * s); c.lineTo(X(28), y - 70 * s); c.lineTo(X(24), y - 32 * s); c.fill();
  c.beginPath(); c.ellipse(X(27), y - 72 * s, 9 * s, 5 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillRect(Math.min(X(20), X(24)), y - 84 * s, 4 * s, 10 * s);
  c.strokeStyle = col; c.lineWidth = 4 * s; c.lineCap = 'round'; c.beginPath();
  for (const u of [-16, -10, 10, 16]) { c.moveTo(X(u), y - 24 * s); c.lineTo(X(u + (o.step || 0) * (u > 0 ? 1 : -1)), y); }
  c.moveTo(X(-22), y - 32 * s); c.lineTo(X(-27), y - 26 * s);
  c.stroke();
  c.fillStyle = RED; c.beginPath(); c.arc(X(22), y - 86 * s, 2.6 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e0a030'; c.beginPath(); c.arc(X(26), y - 88 * s, 2.4 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = INK; c.beginPath(); c.arc(X(30), y - 73 * s, 1.3 * s, 0, Math.PI * 2); c.fill();
  if (o.blanket) {
    const b = [[X(-12), y - 41 * s], [X(10), y - 41 * s], [X(12), y - 24 * s], [X(-14), y - 24 * s]];
    c.fillStyle = o.blanket; poly(c, b); c.fill(); brocade(c, b, 5 * s);
  }
}

const COLS = [RED, BLUE, GREEN, OCHRE, '#6a2a5a', RED, '#1f3a5a'];
function folk(p, r) {
  // people about the square, in three bands of depth
  const bands = [[PLAZA + 30, PLAZA + 110, 0.8, 9.0], [PLAZA + 130, PLAZA + 230, 1.05, 9.3], [PLAZA + 250, 1400, 1.3, 9.6]];
  bands.forEach(([y0, y1, s, t]) => {
    const ps = [];
    for (let i = 0; i < 24; i++) {
      const y = r.range(y0, y1), x = r.range(lerp(320, 170, (y - PLAZA) / 360) + 60, lerp(1280, 1430, (y - PLAZA) / 360) - 60);
      if (Math.abs(x - 800) < 90 && Math.abs(y - 1220) < 40) continue;
      ps.push([x, y, s * r.range(0.9, 1.1), { skirt: r.chance(0.55), col: r.pick(COLS), top: r.pick([WHITE, '#d8a050', '#7a2a2a']), hat: r.pick(['#2a1a10', '#a3262a', '#1f3a5a']), bundle: r.chance(0.25) ? r.pick(['#c8902e', '#a3262a', '#4a6a8a']) : null }]);
    }
    ps.sort((a, b) => a[1] - b[1]);
    p.group('folk', { x: PX0, y: y0 - 70, w: PX1 - PX0, h: y1 - y0 + 80 }, (c) => {
      for (const [x, y, ss, o] of ps) person(c, x, y, ss, o);
    }, { t, d: 0.6, reveal: 'drop', dy: 14 });
  });
  // market cloths spread on the ground with goods
  const stalls = [[560, 1360], [1000, 1350], [320, 1395], [1250, 1390]];
  p.group('folk', { x: 220, y: 1320, w: 1140, h: 100 }, (c) => {
    for (const [x, y] of stalls) {
      const q = [[x - 50, y], [x + 50, y - 4], [x + 58, y + 18], [x - 56, y + 22]];
      c.fillStyle = RED; poly(c, q); c.fill(); brocade(c, q, 8);
      c.fillStyle = '#e0b040'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(x - 36 + k * 14, y + 8, 5, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#5a7a2e'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x - 30 + k * 18, y + 16, 4, 0, Math.PI * 2); c.fill(); }
    }
  }, { t: 9.8, d: 0.6, reveal: 'fade' });
  // llamas resting by the arcades
  const ll = [[260, 1300, 0.8, WHITE, 1], [1340, 1290, 0.8, '#7a5236', -1], [1110, 1180, 0.6, '#e8dcc0', -1]];
  p.group('folk', { x: PX0, y: 1100, w: PX1 - PX0, h: 230 }, (c) => {
    for (const [x, y, s, col, dir] of ll) llama(c, x, y, s, { col, dir, blanket: RED });
  }, { t: 10.0, d: 0.6, reveal: 'drop', dy: 12 });
}

// ================================================================ the Inca wall
// polygonal blocks of andesite, fitted without mortar, one at a time
const IW0 = 1440, IW1 = 1660;
function inca(p, r) {
  // a pattern of stones: courses of irregular widths, the joints tilted
  const cols = [];
  const stones = [];
  const rowsY = [IW0, IW0 + 62, IW0 + 140, IW0 + 220];
  const jit = (y) => y + r.range(-10, 10);
  const xsFor = () => { const xs = [PX0 - 30]; while (xs[xs.length - 1] < PX1 + 30) xs.push(xs[xs.length - 1] + r.range(80, 170)); return xs; };
  for (let k = 0; k < rowsY.length - 1; k++) {
    const xs = xsFor();
    const top = xs.map(() => jit(rowsY[k])), bot = xs.map(() => jit(rowsY[k + 1]));
    for (let i = 0; i < xs.length - 1; i++) {
      const lean = r.range(-14, 14), lean2 = r.range(-14, 14);
      // a polygon with chamfered corners, the edges pinched in a little
      const a = [xs[i] + lean, top[i]], b = [xs[i + 1] + lean2, top[i + 1]], cc = [xs[i + 1] - lean2 * 0.5, bot[i + 1]], d = [xs[i] - lean * 0.5, bot[i]];
      const ch = 9;
      const pts = [
        [a[0] + ch, a[1] + 2], [lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5) - r.range(0, 5)], [b[0] - ch, b[1] + 2], [b[0] - 2, b[1] + ch],
        [lerp(b[0], cc[0], 0.5) + r.range(-3, 4), lerp(b[1], cc[1], 0.5)], [cc[0] - 2, cc[1] - ch], [cc[0] - ch, cc[1] - 2],
        [lerp(d[0], cc[0], 0.5), lerp(d[1], cc[1], 0.5) + r.range(-3, 3)], [d[0] + ch, d[1] - 2], [d[0] + 2, d[1] - ch],
        [lerp(a[0], d[0], 0.5) + r.range(-3, 3), lerp(a[1], d[1], 0.5)], [a[0] + 2, a[1] + ch],
      ];
      stones.push({ pts, col: mix(r.pick(['#7f806c', '#6f725e', '#8a8670', '#767a68', '#837a64']), '#5a5a48', r.range(0, 0.3)), k, i });
    }
    cols.push(xs);
  }
  // the dark joints behind, then the stones, a course at a time, left to right
  p.group('inca', { x: PX0, y: IW0 - 20, w: PX1 - PX0, h: IW1 - IW0 + 40 }, (c) => {
    c.fillStyle = '#211a12'; c.fillRect(PX0, IW0 - 12, PX1 - PX0, IW1 - IW0 + 24);
  }, { t: 8.4, d: 0.5, reveal: 'rise' });
  const byRow = [[], [], []];
  for (const s of stones) byRow[s.k].push(s);
  byRow.forEach((row, k) => {
    // stones in batches of three, so a few dozen don't all arrive at once
    for (let j = 0; j < row.length; j += 3) {
      const batch = row.slice(j, j + 3);
      const all = batch.flatMap((s) => s.pts);
      p.group('inca', boxOf(all, 6), (c) => {
        for (const s of batch) {
          poly(c, s.pts); c.fillStyle = s.col; c.fill();
          // the bulge of the stone: lit on the top left, shaded below
          const b = boxOf(s.pts);
          c.save(); poly(c, s.pts); c.clip();
          c.fillStyle = 'rgba(255,240,200,.12)'; c.beginPath(); c.ellipse(b.x + b.w * 0.4, b.y + b.h * 0.35, b.w * 0.42, b.h * 0.32, 0, 0, Math.PI * 2); c.fill();
          c.strokeStyle = 'rgba(20,14,8,.45)'; c.lineWidth = 6; poly(c, s.pts); c.stroke();
          c.restore();
          c.strokeStyle = '#17110b'; c.lineWidth = 1.6; poly(c, s.pts); c.stroke();
        }
      }, { t: 8.6 + k * 0.35 + j * 0.05, d: 0.5, reveal: 'drop', dy: 20 });
    }
  });
  // a trapezoid doorway through the wall, double jambed, on the left
  const dx = 400;
  p.group('inca', { x: dx - 70, y: IW0 - 10, w: 140, h: IW1 - IW0 + 20 }, (c) => {
    c.fillStyle = '#6f725e'; c.beginPath(); c.moveTo(dx - 62, IW1); c.lineTo(dx - 44, IW0 + 10); c.lineTo(dx + 44, IW0 + 10); c.lineTo(dx + 62, IW1); c.fill();
    c.fillStyle = '#4a4a3a'; c.beginPath(); c.moveTo(dx - 44, IW1); c.lineTo(dx - 32, IW0 + 30); c.lineTo(dx + 32, IW0 + 30); c.lineTo(dx + 44, IW1); c.fill();
    c.fillStyle = '#120c07'; c.beginPath(); c.moveTo(dx - 32, IW1); c.lineTo(dx - 22, IW0 + 46); c.lineTo(dx + 22, IW0 + 46); c.lineTo(dx + 32, IW1); c.fill();
    c.strokeStyle = '#17110b'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(dx - 62, IW1); c.lineTo(dx - 44, IW0 + 10); c.lineTo(dx + 44, IW0 + 10); c.lineTo(dx + 62, IW1); c.stroke();
    // the lintel: one long stone
    c.fillStyle = '#7f806c'; c.fillRect(dx - 56, IW0 + 2, 112, 14); c.strokeRect(dx - 56, IW0 + 2, 112, 14);
  }, { t: 9.7, d: 0.6, reveal: 'rise' });
  // the stone of twelve angles, picked out
  p.group('inca', { x: 980, y: IW0 + 40, w: 220, h: 150 }, (c) => {
    const cx = 1090, cy = IW0 + 110, pts = [];
    const rad = [58, 66, 50, 70, 62, 56, 72, 60, 54, 68, 58, 64];
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 + 0.2; pts.push([cx + Math.cos(a) * rad[k] * 1.35, cy + Math.sin(a) * rad[k] * 0.85]); }
    c.fillStyle = '#211a12'; c.save(); c.translate(cx, cy); c.scale(1.06, 1.08); c.translate(-cx, -cy); poly(c, pts); c.fill(); c.restore();
    poly(c, pts); c.fillStyle = '#7d7a62'; c.fill();
    c.save(); poly(c, pts); c.clip();
    c.fillStyle = 'rgba(255,240,200,.14)'; c.beginPath(); c.ellipse(cx - 20, cy - 16, 70, 34, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(20,14,8,.45)'; c.lineWidth = 7; poly(c, pts); c.stroke();
    c.restore();
    c.strokeStyle = '#17110b'; c.lineWidth = 1.8; poly(c, pts); c.stroke();
  }, { t: 10.0, d: 0.6, reveal: 'pop' });
}

// the street at the wall's foot: cobbles, flowers, and a herd of llamas with their herder
function street(p, r) {
  const cob = [];
  for (let i = 0; i < 260; i++) cob.push([r.range(PX0, PX1), r.range(IW1 + 4, PY1), r.range(5, 11)]);
  p.group('street', { x: PX0, y: IW1 - 4, w: PX1 - PX0, h: PY1 - IW1 + 4 }, (c) => {
    c.fillStyle = '#4a3a28'; c.fillRect(PX0, IW1, PX1 - PX0, PY1 - IW1);
    c.fillStyle = '#5e4c36'; c.strokeStyle = 'rgba(20,14,8,.6)'; c.lineWidth = 1;
    c.beginPath(); for (const [x, y, s] of cob) { c.moveTo(x + s, y); c.ellipse(x, y, s, s * 0.55, 0, 0, Math.PI * 2); } c.fill(); c.stroke();
  }, { t: 9.4, d: 0.7, reveal: 'wipe' });
  // the herd, coming in from the left
  const herd = [[255, 1810, 1.25, WHITE, RED], [335, 1764, 1.0, '#7a5236', BLUE], [1300, 1800, 1.3, '#e8dcc0', GREEN], [1410, 1760, 1.0, '#3a2a1e', RED]];
  herd.forEach(([x, y, s, col, bl], i) => {
    const m = p.group('street', { x: x - 60 * s, y: y - 100 * s, w: 120 * s, h: 110 * s }, (c) => llama(c, x, y, s, { col, blanket: bl, dir: i < 2 ? 1 : -1, step: 2 }),
      { t: 10.2 + i * 0.15, d: 0.8, reveal: 'slide' });
    m.dx = i < 2 ? -80 : 80;
  });
  p.group('street', { x: 130, y: 1730, w: 80, h: 130 }, (c) => person(c, 168, 1850, 1.7, { skirt: true, col: RED, top: WHITE, hat: '#2a1a10', bundle: '#c8902e' }),
    { t: 10.5, d: 0.6, reveal: 'drop', dy: 14 });
  // flowers along the wall's foot, red and gold, as the painters scattered them
  const fl = [];
  for (let i = 0; i < 60; i++) fl.push([r.range(PX0 + 10, PX1 - 10), IW1 + r.range(-4, 12), r.pick([RED, GOLD_L, WHITE, '#d0602a']), r.range(3, 5)]);
  p.group('street', { x: PX0, y: IW1 - 30, w: PX1 - PX0, h: 50 }, (c) => {
    c.strokeStyle = '#2f4a22'; c.lineWidth = 1.4; c.beginPath();
    for (const [x, y] of fl) { c.moveTo(x, y + 8); c.lineTo(x, y - 12); }
    c.stroke();
    for (const [x, y, col, s] of fl) { c.fillStyle = col; c.beginPath(); c.arc(x, y - 14, s, 0, Math.PI * 2); c.fill(); }
  }, { t: 10.6, d: 0.6, reveal: 'fade' });
}

// ================================================================ the live things
function life(p, r) {
  // a condor riding the air over the mountains
  p.live('live', {
    t: 10.8, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const x = 760 + Math.cos(time * 0.25) * 340, y = 560 + Math.sin(time * 0.25) * 60, tilt = Math.sin(time * 0.25) * 0.15;
      c.save(); c.translate(x, y); c.rotate(tilt);
      c.fillStyle = INK; c.beginPath();
      c.moveTo(-60, 2); c.quadraticCurveTo(-30, -10, 0, 0); c.quadraticCurveTo(30, -10, 60, 2);
      c.lineTo(52, 6); c.lineTo(56, 9); c.lineTo(46, 9); c.quadraticCurveTo(20, 2, 0, 8); c.quadraticCurveTo(-20, 2, -46, 9); c.lineTo(-56, 9); c.lineTo(-52, 6); c.closePath(); c.fill();
      c.fillStyle = WHITE; c.fillRect(-4, -2, 8, 3);
      c.restore();
    },
  });
  // the fountain's water, rising and falling
  p.live('live', {
    t: 11.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = 'rgba(200,220,220,.75)'; c.lineWidth = 1.6; c.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2 + time * 0.4, h = 12 + Math.sin(time * 3 + k) * 3;
        const ex = 800 + Math.cos(a) * 30, ey = 1180 + Math.sin(a) * 6;
        c.moveTo(800, 1132); c.quadraticCurveTo(800 + Math.cos(a) * 16, 1132 - h, ex, ey);
      }
      c.stroke();
    },
  });
  // the gilt frame catching the light: a slow sheen running round it
  p.live('frame', {
    t: 11.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const k = ((time * 0.12) % 1.4) - 0.2, x = lerp(-400, W + 400, k);
      c.save();
      c.beginPath(); c.rect(0, 0, W, H); c.rect(PX0, PY0, PX1 - PX0, PY1 - PY0); c.clip('evenodd');
      c.fillStyle = 'rgba(255,248,210,.13)';
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 60, 0); c.lineTo(x - 340, H); c.lineTo(x - 400, H); c.closePath(); c.fill();
      c.restore();
    },
  });
}

// ================================================================ the varnish
// the old varnish: a warm darkening toward the edges, and a net of fine cracks
function varnish(p, r) {
  const box = { x: PX0, y: PY0, w: PX1 - PX0, h: PY1 - PY0 };
  p.group('varnish', box, (c) => {
    const g = c.createRadialGradient(W / 2, H * 0.48, 380, W / 2, H * 0.5, 1150);
    g.addColorStop(0, 'rgba(60,36,10,0)'); g.addColorStop(0.55, 'rgba(40,24,8,.28)'); g.addColorStop(1, 'rgba(20,12,4,.75)');
    c.fillStyle = g; c.fillRect(PX0, PY0, PX1 - PX0, PY1 - PY0);
    c.fillStyle = 'rgba(150,100,20,.12)'; c.fillRect(PX0, PY0, PX1 - PX0, PY1 - PY0);
  }, { t: 0.8, d: 1.0, reveal: 'fade' });
  // craquelure: a jittered grid, its cells joined by broken lines
  const S = 46, pts = [];
  for (let j = 0; j <= Math.ceil((PY1 - PY0) / S); j++) { pts.push([]); for (let i = 0; i <= Math.ceil((PX1 - PX0) / S); i++) pts[j].push([PX0 + i * S + r.range(-16, 16), PY0 + j * S + r.range(-16, 16)]); }
  const cracks = [];
  for (let j = 0; j < pts.length; j++) for (let i = 0; i < pts[j].length; i++) {
    const a = pts[j][i];
    for (const b of [pts[j][i + 1], pts[j + 1] && pts[j + 1][i]]) {
      if (!b || r.chance(0.12)) continue;
      const m = [lerp(a[0], b[0], 0.5) + r.range(-6, 6), lerp(a[1], b[1], 0.5) + r.range(-6, 6)];
      cracks.push([a, m, b]);
    }
  }
  p.strokes('varnish', cracks, 'rgba(18,10,4,.16)', 0.9, { t: 12.6, d: 1.0, reveal: 'fade', box });
}

// ================================================================ the frame
// carved and gilded: a bead at the edge, a round torus, a band of acanthus,
// a hollow in shadow and a bead and reel at the sight edge; scrolls at the
// corners and a crest of shell and volutes over the top
function frame(p, r) {
  const full = { x: 0, y: 0, w: W, h: H };
  const ring = (c) => { c.beginPath(); c.rect(0, 0, W, H); c.rect(PX0, PY0, PX1 - PX0, PY1 - PY0); };
  p.mark('frame', {
    t: 0, d: 0.9, reveal: 'iris', ease: 'inOut', box: full,
    draw: (c) => {
      ring(c);
      const g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#e8c86a'); g.addColorStop(0.3, GOLD); g.addColorStop(0.5, '#f0d888'); g.addColorStop(0.7, '#a87a2a'); g.addColorStop(1, '#6b4614');
      c.fillStyle = g; c.fill('evenodd');
      // the profile, as a stack of rules at each depth
      const prof = [[3, 6, GOLD_D], [9, 4, '#f6e09a'], [13, 3, GOLD_D], [20, 10, '#d8b058'], [26, 4, '#fbe8a8'], [34, 8, '#a37624'],
        [42, 3, GOLD_D], [92, 3, GOLD_D], [100, 12, '#4d3210'], [110, 4, '#8a6420'], [118, 3, '#f2d77e'], [126, 4, BOLE]];
      for (const [o, w, col] of prof) { c.strokeStyle = col; c.lineWidth = w; c.strokeRect(o, o, W - 2 * o, H - 2 * o); }
      // the right and bottom sides lie in shade
      c.fillStyle = 'rgba(40,20,0,.28)';
      c.beginPath(); c.moveTo(W, 0); c.lineTo(W, H); c.lineTo(PX1, PY1); c.lineTo(PX1, PY0); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(0, H); c.lineTo(W, H); c.lineTo(PX1, PY1); c.lineTo(PX0, PY1); c.closePath(); c.fill();
      // miters
      c.strokeStyle = 'rgba(60,30,0,.5)'; c.lineWidth = 1.2; c.beginPath();
      c.moveTo(0, 0); c.lineTo(PX0, PY0); c.moveTo(W, 0); c.lineTo(PX1, PY0); c.moveTo(0, H); c.lineTo(PX0, PY1); c.moveTo(W, H); c.lineTo(PX1, PY1); c.stroke();
    },
  });
  // the acanthus band: a leaf curling over every 64 units, all round
  const leaves = [];
  const side = (x0, y0, x1, y1, nx, ny) => {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.round(L / 64);
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; leaves.push([lerp(x0, x1, t), lerp(y0, y1, t), Math.atan2(y1 - y0, x1 - x0), nx, ny]); }
  };
  const o = 67;
  side(o + 60, o, W - o - 60, o, 0, 1); side(W - o, o + 60, W - o, H - o - 60, -1, 0); side(W - o - 60, H - o, o + 60, H - o, 0, -1); side(o, H - o - 60, o, o + 60, 1, 0);
  p.group('frame', full, (c) => {
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.rect(PX0, PY0, PX1 - PX0, PY1 - PY0); c.clip('evenodd');
    for (const [x, y, a] of leaves) {
      c.save(); c.translate(x, y); c.rotate(a);
      leaf(c);
      c.fillStyle = '#5a3a10'; c.beginPath(); c.arc(30, 20, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f4dd94'; c.beginPath(); c.arc(29, 19, 3.4, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    // the bead and reel at the sight edge
    c.fillStyle = '#f2d77e';
    for (let x = PX0 + 6; x < PX1; x += 14) { c.beginPath(); c.ellipse(x, PY0 - 8, 4, 2.6, 0, 0, Math.PI * 2); c.ellipse(x + 3, PY1 + 8, 4, 2.6, 0, 0, Math.PI * 2); c.fill(); }
    for (let y = PY0 + 6; y < PY1; y += 14) { c.beginPath(); c.ellipse(PX0 - 8, y, 2.6, 4, 0, 0, Math.PI * 2); c.ellipse(PX1 + 8, y, 2.6, 4, 0, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }, { t: 0.7, d: 1.2, reveal: 'iris', ease: 'inOut' });
  // where the gold is worn through to the red bole
  const worn = [];
  for (let i = 0; i < 70; i++) {
    const s = r.int(0, 3), t = r(), d = r.range(14, 36);
    const [x, y] = s === 0 ? [lerp(40, W - 40, t), d] : s === 1 ? [W - d, lerp(40, H - 40, t)] : s === 2 ? [lerp(40, W - 40, t), H - d] : [d, lerp(40, H - 40, t)];
    worn.push([x, y, r.range(3, 10), r.range(1.5, 4), r.range(0, 3)]);
  }
  p.group('frame', full, (c) => {
    c.fillStyle = 'rgba(138,51,34,.55)'; c.beginPath();
    for (const [x, y, a, b, rot] of worn) { c.moveTo(x + a, y); c.ellipse(x, y, a, b, rot, 0, Math.PI * 2); }
    c.fill();
  }, { t: 1.6, d: 0.6, reveal: 'fade' });
  // the corner scrolls and the crest
  [[0, 0, 1, 1], [W, 0, -1, 1], [W, H, -1, -1], [0, H, 1, -1]].forEach(([x, y, sx, sy], i) => {
    p.group('frame', { x: x - (sx < 0 ? 230 : 0), y: y - (sy < 0 ? 230 : 0), w: 230, h: 230 }, (c) => corner(c, x, y, sx, sy), { t: 1.2 + i * 0.12, d: 0.6, reveal: 'pop', ease: 'back' });
  });
  p.group('frame', { x: W / 2 - 200, y: 0, w: 400, h: 260 }, (c) => crest(c, W / 2, 0), { t: 1.7, d: 0.7, reveal: 'pop', ease: 'back' });
  p.group('frame', { x: W / 2 - 140, y: H - 150, w: 280, h: 150 }, (c) => { c.save(); c.translate(0, H); c.scale(1, -1); crest(c, W / 2, 0, 0.62); c.restore(); }, { t: 1.8, d: 0.6, reveal: 'pop', ease: 'back' });
}
// an acanthus leaf: a long C-scroll with three lobes, lit above, shaded below
function leaf(c) {
  for (const [dy, col] of [[2.5, '#5a3a10'], [0, '#f4dd94']]) {
    c.fillStyle = col; c.beginPath();
    c.moveTo(-30, 18 + dy); c.bezierCurveTo(-34, -6 + dy, -10, -24 + dy, 12, -18 + dy);
    c.quadraticCurveTo(20, -26 + dy, 26, -16 + dy); c.quadraticCurveTo(34, -14 + dy, 30, -2 + dy);
    c.quadraticCurveTo(24, -10 + dy, 14, -6 + dy); c.bezierCurveTo(0, -4 + dy, -12, 6 + dy, -14, 18 + dy); c.closePath(); c.fill();
  }
  c.strokeStyle = '#7a5418'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-24, 14); c.quadraticCurveTo(-18, -8, 10, -12); c.moveTo(-18, 16); c.quadraticCurveTo(-12, -2, 8, -6); c.stroke();
}
// a volute: a spiral scroll, lit and shaded
function volute(c, x, y, R, dir, turns = 1.6) {
  for (const [d, col, lw] of [[2, '#5a3a10', R * 0.34], [0, '#f2d77e', R * 0.3]]) {
    c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath();
    for (let k = 0; k <= 40; k++) { const t = k / 40, a = dir * t * turns * Math.PI * 2, rr = R * (1 - t * 0.8); const px = x + d + Math.cos(a) * rr, py = y + d + Math.sin(a) * rr; k ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke();
  }
  c.fillStyle = '#fff2b8'; c.beginPath(); c.arc(x - R * 0.05, y - R * 0.05, R * 0.18, 0, Math.PI * 2); c.fill();
}
function corner(c, x, y, sx, sy) {
  c.save(); c.translate(x, y); c.scale(sx, sy);
  // two great acanthus leaves running out along the sides from the corner
  for (const [rx, ry, rot] of [[112, 52, 0], [52, 112, Math.PI / 2]]) {
    c.save(); c.translate(rx, ry); c.rotate(rot); c.scale(2.6, rot ? -2.6 : 2.6); leaf(c); c.restore();
  }
  // a rosette on a block, with a ring of bole
  c.fillStyle = '#5a3a10'; c.beginPath(); c.arc(68, 68, 54, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e8c86a'; c.beginPath(); c.arc(65, 65, 52, 0, Math.PI * 2); c.fill();
  c.fillStyle = BOLE; c.beginPath(); c.arc(65, 65, 38, 0, Math.PI * 2); c.fill();
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2;
    for (const [d, col] of [[1.5, '#5a3a10'], [0, '#f4dd94']]) { c.fillStyle = col; c.beginPath(); c.ellipse(65 + d + Math.cos(a) * 20, 65 + d + Math.sin(a) * 20, 15, 7, a, 0, Math.PI * 2); c.fill(); }
  }
  c.fillStyle = '#fff2b8'; c.beginPath(); c.arc(65, 65, 9, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#7a5418'; c.lineWidth = 2; c.beginPath(); c.arc(65, 65, 52, 0, Math.PI * 2); c.stroke();
  volute(c, 186, 26, 18, 1);
  volute(c, 26, 186, 18, -1);
  c.restore();
}
function crest(c, x, y, k = 1) {
  c.save(); c.translate(x, y); c.scale(k, k);
  // a scallop shell of rounded lobes over a cartouche, scrolls on either side
  const N = 9, R0 = 128, base = 210;
  for (const [d, col] of [[3, '#5a3a10'], [0, '#ecd07a']]) {
    c.fillStyle = col; c.beginPath(); c.moveTo(-R0 + d, base + d);
    for (let i = 0; i < N; i++) {
      const a0 = Math.PI + i / N * Math.PI, a1 = Math.PI + (i + 1) / N * Math.PI, am = (a0 + a1) / 2;
      c.quadraticCurveTo(d + Math.cos(am) * R0 * 1.22, base + d + Math.sin(am) * R0 * 1.22, d + Math.cos(a1) * R0, base + d + Math.sin(a1) * R0);
    }
    c.closePath(); c.fill();
  }
  c.strokeStyle = '#7a5418'; c.lineWidth = 2.2; c.beginPath();
  for (let i = 1; i < N; i++) { const a = Math.PI + i / N * Math.PI; c.moveTo(0, base - 10); c.quadraticCurveTo(Math.cos(a) * R0 * 0.5, base + Math.sin(a) * R0 * 0.6, Math.cos(a) * R0, base + Math.sin(a) * R0); }
  c.stroke();
  c.strokeStyle = 'rgba(255,245,200,.7)'; c.lineWidth = 1.4; c.beginPath();
  for (let i = 1; i < N; i++) { const a = Math.PI + (i + 0.25) / N * Math.PI; c.moveTo(4, base - 14); c.quadraticCurveTo(Math.cos(a) * R0 * 0.5, base + Math.sin(a) * R0 * 0.6, Math.cos(a) * R0 * 0.96, base + Math.sin(a) * R0 * 0.96); }
  c.stroke();
  for (const s of [-1, 1]) { volute(c, s * 158, 150, 30, -s); volute(c, s * 120, 222, 20, s, 1.3); }
  // the cartouche: red bole in a gold rim
  c.fillStyle = '#5a3a10'; c.beginPath(); c.ellipse(2, 186, 40, 50, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#f2d77e'; c.beginPath(); c.ellipse(0, 184, 38, 48, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = BOLE; c.beginPath(); c.ellipse(0, 184, 27, 36, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#f2d77e'; c.beginPath();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.moveTo(Math.cos(a) * 6, 184 + Math.sin(a) * 6); c.lineTo(Math.cos(a + 0.2) * 19, 184 + Math.sin(a + 0.2) * 24); c.lineTo(Math.cos(a - 0.2) * 19, 184 + Math.sin(a - 0.2) * 24); }
  c.fill();
  c.restore();
}

// ================================================================ the cartouche and the name
function cartouche(p, r) {
  const cx = W / 2, cy = 1780, w = 720, h = 130;
  // the painted scroll: a red ground in a gold rim, its ends rolled
  const body = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40, x = cx - w / 2 + t * w; body.push([x, cy - h / 2 + Math.sin(t * Math.PI) * -14]); }
  for (let i = 40; i >= 0; i--) { const t = i / 40, x = cx - w / 2 + t * w; body.push([x, cy + h / 2 - Math.sin(t * Math.PI) * 8]); }
  p.group('cartouche', { x: cx - w / 2 - 70, y: cy - h / 2 - 40, w: w + 140, h: h + 80 }, (c) => {
    c.fillStyle = 'rgba(10,6,2,.45)'; c.save(); c.translate(6, 8); poly(c, body); c.fill(); c.restore();
    poly(c, body); c.fillStyle = vgrad(c, cy - h / 2, cy + h / 2, [[0, '#9a2a24'], [1, '#6a1a16']]); c.fill();
    c.strokeStyle = GOLD_L; c.lineWidth = 4; c.stroke();
    c.strokeStyle = GOLD; c.lineWidth = 1.4; c.save(); c.translate(cx, cy); c.scale(0.95, 0.82); c.translate(-cx, -cy); poly(c, body); c.stroke(); c.restore();
    // the rolled ends
    for (const s of [-1, 1]) {
      const ex = cx + s * w / 2;
      c.fillStyle = '#6a1a16'; c.beginPath(); c.ellipse(ex + s * 14, cy, 22, h / 2 + 6, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = GOLD_L; c.lineWidth = 3; c.stroke();
      c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.ellipse(ex + s * 14, cy, 11, h / 2 - 14, 0, 0, Math.PI * 2); c.stroke();
      // gold sprigs off the ends
      c.strokeStyle = GOLD_L; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath();
      c.moveTo(ex + s * 34, cy - 20); c.quadraticCurveTo(ex + s * 70, cy - 50, ex + s * 60, cy - 70);
      c.moveTo(ex + s * 34, cy + 20); c.quadraticCurveTo(ex + s * 70, cy + 50, ex + s * 60, cy + 70); c.stroke();
      c.fillStyle = GOLD_L; for (const dy of [-70, 70]) { c.beginPath(); c.arc(ex + s * 60, cy + dy, 5, 0, Math.PI * 2); c.fill(); }
    }
    // gold brocade sprinkled over the red, sparse
    c.save(); poly(c, body); c.clip();
    c.fillStyle = 'rgba(242,215,126,.35)'; c.beginPath();
    for (let y = cy - h / 2; y < cy + h / 2; y += 16) for (let x = cx - w / 2 + ((y / 16 | 0) % 2) * 8; x < cx + w / 2; x += 16) { c.moveTo(x + 1.4, y); c.arc(x, y, 1.4, 0, Math.PI * 2); }
    c.fill(); c.restore();
  }, { t: 11.2, d: 0.9, reveal: 'iris', ease: 'inOut' });
  // CUSCO in gold, a letter at a time
  const y = cy + 18;
  p.type('title', 'CUSCO', cx, y, { family: FACE, size: 110, color: GOLD_L, align: 'center', track: 0.18, t: 11.7, gap: 0.2, d: 0.7, reveal: 'press', shadow: '#3a0e0a', sx: 3, sy: 4 });
  p.group('title', { x: cx - 330, y: cy + 28, w: 660, h: 34 }, (c) => {
    c.font = `400 24px ${FACE}`; c.fillStyle = GOLD; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText('Qosqo · el ombligo del mundo', cx, cy + 50);
  }, { t: 12.8, d: 0.6, reveal: 'fade' });
}
