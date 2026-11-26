// Yangon: a kalaga hanging, gold thread and sequins couched on black velvet, in a
// border of red lacquerware. The Shwedagon fills the middle: its platform and
// terraces ringed with small spires, the great bell, the turban bands, the
// inverted bowl, the lotus moldings, the banana bud and the hti on top, all in
// padded gold. Tiered pyatthat pavilions and small zedis stand on the platform;
// trees and toddy palms cover the hill below. Sule Pagoda and the High Court's
// clock tower stand to either side. In front, Kandawgyi lake in blue velvet with
// gold scale waves and the Karaweik barge pavilion, and a teak boardwalk with
// people under parasols. The name in Burmese, with YANGON beneath.

import { Plate, W, H } from '../print.js';
import { lerp, poly } from '../kit.js';

const VELVET = '#120c0e', VEL_L = '#2c1d21';
const GOLD = '#d2a443', GOLD_L = '#f4d98c', GOLD_D = '#8a5e1c', GOLD_DD = '#56360d';
const RED = '#901f16', RED_D = '#5e120c', RED_L = '#b9402e';
const GREEN = '#24603d', GREEN_L = '#4a8f55', GREEN_D = '#143a27';
const BLUE = '#1d2f70', BLUE_L = '#30509e', BLUE_D = '#111b48';
const SILVER = '#dedad0', CREAM = '#efe3c6', TEAK = '#6e4122', TEAK_D = '#45260f', SKIN = '#b67a4c';
const F = 'Padauk, serif';
const MY = 'ရန်ကုန်';

export const city = {
  id: 'yangon', name: 'Yangon', wall: '#1d0f0d',
  alt: 'A kalaga hanging in gold thread and sequins on black velvet, framed in red lacquerware: the Shwedagon Pagoda on its terraced platform with tiered pavilions and small spires, trees and toddy palms on the hill below, Sule Pagoda and the High Court clock tower to either side, the Karaweik barge pavilion on Kandawgyi lake, people with parasols on a teak boardwalk, a silver moon and gold cloud scrolls, and the name in Burmese with YANGON beneath',
  google: 'family=Padauk:wght@400;700',
  fonts: [['700 100px Padauk', MY + ' YANGON'], ['400 40px Padauk', 'YANGON']],
  build,
};

// the field inside the border
const FX0 = 160, FX1 = W - 160, FY0 = 160, FY1 = H - 160;
const CX = 800, TERR = 1110; // the stupa's axis and the top of its platform
const LAKE = 1262, SHORE = 1545, PANEL = 1612;

function build() {
  const p = new Plate({ paper: VELVET, seed: 3105 });
  const r = p.r;
  p.stack('velvet', 'sky', 'far', 'stupa', 'zedis', 'hill', 'lake', 'barge', 'front', 'border', 'live', 'title');
  velvet(p);
  border(p, r);
  sky(p, r);
  far(p);
  stupa(p, r);
  zedis(p);
  hill(p, r);
  lake(p, r);
  barge(p);
  front(p, r);
  life(p, r);
  title(p);
  return p;
}

// ================================================================ thread and sequins
// couched gold: a line of thread, then the stitches that hold it down
function couch(c, path, lw = 2.4, col = GOLD, tie = GOLD_D) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = col; c.lineWidth = lw; path(); c.stroke();
  c.setLineDash([1.4, 3.2]); c.strokeStyle = tie; path(); c.stroke();
  c.setLineDash([]);
}
const polyPath = (c, pts, closed = true) => () => {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  if (closed) c.closePath();
};
// a padded appliqué piece: the padding's shadow, the cloth, a couched edge
function pad(c, pts, col, o = {}) {
  c.save(); c.translate(3, 4); c.fillStyle = 'rgba(0,0,0,.45)'; poly(c, pts); c.fill(); c.restore();
  c.fillStyle = col; poly(c, pts); c.fill();
  if (o.edge !== false) couch(c, polyPath(c, pts), o.lw || 2.2, o.edgeCol || GOLD, o.tie || GOLD_D);
}
// sequins: a disc, its rim, and the glint off the top
function sequins(c, list, base = GOLD, hi = GOLD_L) {
  c.fillStyle = 'rgba(0,0,0,.5)';
  c.beginPath(); for (const [x, y, s] of list) { c.moveTo(x + s + 0.8, y + 1); c.arc(x + 0.8, y + 1, s, 0, Math.PI * 2); } c.fill();
  c.fillStyle = base;
  c.beginPath(); for (const [x, y, s] of list) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
  c.fillStyle = hi;
  c.beginPath(); for (const [x, y, s] of list) { c.moveTo(x - s * 0.2, y - s * 0.35); c.arc(x - s * 0.35, y - s * 0.35, s * 0.42, 0, Math.PI * 2); } c.fill();
  c.fillStyle = GOLD_DD;
  c.beginPath(); for (const [x, y, s] of list) if (s > 2.4) { c.moveTo(x + 0.8, y); c.arc(x, y, 0.8, 0, Math.PI * 2); } c.fill();
}
function goldGrad(c, x0, x1, light = 0.38) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, GOLD_D); g.addColorStop(Math.max(0.05, light - 0.22), GOLD);
  g.addColorStop(light, GOLD_L); g.addColorStop(Math.min(0.95, light + 0.3), GOLD); g.addColorStop(1, GOLD_DD);
  return g;
}

// ================================================================ velvet
function velvet(p) {
  p.group('velvet', { x: 0, y: 0, w: W, h: H }, (c) => {
    const g = c.createRadialGradient(CX, 760, 80, CX, 900, 1250);
    g.addColorStop(0, VEL_L); g.addColorStop(0.55, '#1a1114'); g.addColorStop(1, VELVET);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }, { t: 0, d: 0.9, reveal: 'fade' });
}

// ================================================================ the lacquer border
// a cartouche of the engraved lacquer: a black oval cut through to yellow and green
function cartouche(c, x, y, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = '#140b08'; c.beginPath(); c.ellipse(0, 0, 32, 21, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#e2b54a'; c.lineWidth = 2; c.stroke();
  c.strokeStyle = '#d9a538'; c.lineWidth = 1.4;
  c.beginPath(); c.ellipse(0, 0, 24, 14, 0, 0, Math.PI * 2); c.stroke();
  // two scrolls back to back
  c.strokeStyle = '#e9c45a'; c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(-17, 4); c.bezierCurveTo(-14, -9, -3, -9, -3, -2); c.bezierCurveTo(-3, 3, -9, 3, -9, -1);
  c.moveTo(17, -4); c.bezierCurveTo(14, 9, 3, 9, 3, 2); c.bezierCurveTo(3, -3, 9, -3, 9, 1);
  c.stroke();
  c.fillStyle = '#4c8a4a'; c.beginPath(); c.arc(0, 0, 3.4, 0, Math.PI * 2); c.fill();
  c.restore();
}
function diamond(c, x, y) {
  c.fillStyle = '#3f7d46'; c.beginPath(); c.moveTo(x, y - 11); c.lineTo(x + 8, y); c.lineTo(x, y + 11); c.lineTo(x - 8, y); c.closePath(); c.fill();
  c.strokeStyle = '#e2b54a'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = '#e2b54a'; c.fillRect(x - 1.5, y - 1.5, 3, 3);
}
function rosette(c, x, y) {
  c.fillStyle = '#140b08'; c.beginPath(); c.arc(x, y, 34, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#e2b54a'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#d9a538';
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    c.beginPath(); c.ellipse(x + Math.cos(a) * 17, y + Math.sin(a) * 17, 8, 4, a, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = RED_L; c.beginPath(); c.arc(x, y, 8, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#e9c45a'; c.lineWidth = 1.3; c.stroke();
}
const B0 = 46, B1 = 128; // the band's outer and inner edges, from the sheet's edge
function band(c, side) {
  const m = (B0 + B1) / 2;
  c.fillStyle = RED;
  const horiz = side === 'top' || side === 'bottom';
  const yy = side === 'top' ? m : H - m, xx = side === 'left' ? m : W - m;
  if (horiz) c.fillRect(B0, yy - (B1 - B0) / 2, W - 2 * B0, B1 - B0);
  else c.fillRect(xx - (B1 - B0) / 2, B1, B1 - B0, H - 2 * B1);
  // engraved hairlines along both edges
  c.strokeStyle = '#e2b54a'; c.lineWidth = 1.6;
  c.beginPath();
  if (horiz) { for (const d of [-34, -29, 29, 34]) { c.moveTo(B0 + 6, yy + d); c.lineTo(W - B0 - 6, yy + d); } }
  else { for (const d of [-34, -29, 29, 34]) { c.moveTo(xx + d, B1); c.lineTo(xx + d, H - B1); } }
  c.stroke();
  // a row of little ticks, the lacquer's dotted edge
  c.fillStyle = '#e9c45a';
  if (horiz) { for (let x = B0 + 10; x < W - B0 - 6; x += 7) { c.fillRect(x, yy - 32.5, 2, 2); c.fillRect(x, yy + 30.5, 2, 2); } }
  else { for (let y = B1; y < H - B1; y += 7) { c.fillRect(xx - 32.5, y, 2, 2); c.fillRect(xx + 30.5, y, 2, 2); } }
  // cartouches and diamonds
  if (horiz) {
    const n = 14, step = (W - 2 * B1) / n;
    for (let i = 0; i < n; i++) cartouche(c, B1 + step * (i + 0.5), yy, 0);
    for (let i = 1; i < n; i++) diamond(c, B1 + step * i, yy);
    rosette(c, m, yy); rosette(c, W - m, yy);
  } else {
    const n = 18, step = (H - 2 * B1) / n;
    for (let i = 0; i < n; i++) cartouche(c, xx, B1 + step * (i + 0.5), Math.PI / 2);
    for (let i = 1; i < n; i++) diamond(c, xx, B1 + step * i);
  }
}

function border(p, r) {
  p.group('border', { x: 0, y: 0, w: W, h: B1 + 4 }, (c) => band(c, 'top'), { t: 0.2, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  p.group('border', { x: W - B1 - 4, y: 0, w: B1 + 4, h: H }, (c) => band(c, 'right'), { t: 0.6, d: 1.3, reveal: 'fall', ease: 'inOut' });
  p.group('border', { x: 0, y: H - B1 - 4, w: W, h: B1 + 4 }, (c) => band(c, 'bottom'), { t: 1.0, d: 1.2, reveal: 'wipeL', ease: 'inOut' });
  p.group('border', { x: 0, y: 0, w: B1 + 4, h: H }, (c) => band(c, 'left'), { t: 1.4, d: 1.3, reveal: 'rise', ease: 'inOut' });
  // the gold cord inside the band, drawn round by a pen
  const k = 142, cord = [[k, k], [W - k, k], [W - k, H - k], [k, H - k], [k, k]];
  p.pen('border', cord, GOLD, 6, { t: 1.6, d: 1.8 });
  // its twist
  const ticks = [];
  for (let i = 0; i < cord.length - 1; i++) {
    const [a, b] = [cord[i], cord[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 3; s < L; s += 6) {
      const x = lerp(a[0], b[0], s / L), y = lerp(a[1], b[1], s / L);
      ticks.push([[x - 2.6, y + 2.6], [x + 2.6, y - 2.6]]);
    }
  }
  p.strokes('border', ticks, GOLD_D, 1.3, { t: 3.3, d: 0.6, reveal: 'fade' });
  // a row of sequins inside the cord
  const sq = [];
  const q = 158;
  for (let x = q; x <= W - q; x += 13) { sq.push([x, q, 3.2]); sq.push([x, H - q, 3.2]); }
  for (let y = q + 13; y < H - q; y += 13) { sq.push([q, y, 3.2]); sq.push([W - q, y, 3.2]); }
  p.group('border', { x: 140, y: 140, w: W - 280, h: H - 280 }, (c) => sequins(c, sq), { t: 3.5, d: 0.8, reveal: 'fade' });
}

// ================================================================ the sky
// a spiral, for the ends of a cloud scroll
function spiral(cx, cy, r0, turns, dir, a0) {
  const pts = [];
  const n = Math.round(turns * 22);
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = a0 + dir * t * turns * Math.PI * 2, rr = r0 * (1 - t * 0.85);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return pts;
}
// a Burmese cloud: a wavy bar ending in curls, with a lobe above
function cloudScroll(x, y, w, s) {
  const lines = [];
  const R = 15 * s;
  // the body: two lines from curl to curl
  for (const dy of [0, 9 * s]) {
    const line = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      line.push([x + R + t * (w - 2 * R), y + dy - Math.sin(t * Math.PI * 2) * 4 * s]);
    }
    lines.push(line);
  }
  lines.push(spiral(x + R, y + R * 0.55, R * 0.95, 1.4, 1, -Math.PI / 2));
  lines.push(spiral(x + w - R, y + R * 0.55, R * 0.95, 1.4, -1, -Math.PI / 2));
  // a lobe in the middle, curling at its top
  const mx = x + w * 0.5;
  const lobe = [];
  for (let i = 0; i <= 20; i++) { const a = Math.PI + (i / 20) * Math.PI; lobe.push([mx + Math.cos(a) * w * 0.18, y - 2 + Math.sin(a) * 26 * s]); }
  lines.push(lobe);
  lines.push(spiral(mx - w * 0.1, y - 14 * s, 9 * s, 1.2, 1, 0));
  return lines;
}

function inStupa(x, y) {
  // a generous keep-out around the pagoda and the moon
  if (Math.hypot(x - 330, y - 370) < 105) return true;
  if (y < 200) return Math.abs(x - CX) < 40;
  if (y < 540) return Math.abs(x - CX) < 95;
  if (y < 760) return Math.abs(x - CX) < 170;
  if (y < 1130) return Math.abs(x - CX) < 260 + (y - 760) * 0.5 || (y > 720 && (Math.abs(x - 430) < 110 || Math.abs(x - 1170) < 110));
  return true;
}

function sky(p, r) {
  // the moon: padded silver in a ring of sequins
  const mx = 330, my = 370;
  const ring = [];
  for (let k = 0; k < 30; k++) { const a = (k / 30) * Math.PI * 2; ring.push([mx + Math.cos(a) * 76, my + Math.sin(a) * 76, 3.4]); }
  p.group('sky', { x: mx - 90, y: my - 90, w: 180, h: 180 }, (c) => {
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.arc(mx + 3, my + 4, 62, 0, Math.PI * 2); c.fill();
    const g = c.createRadialGradient(mx - 22, my - 24, 6, mx, my, 64);
    g.addColorStop(0, '#fbf8ef'); g.addColorStop(0.6, SILVER); g.addColorStop(1, '#9d988c');
    c.fillStyle = g; c.beginPath(); c.arc(mx, my, 62, 0, Math.PI * 2); c.fill();
    // the quilting of the padding
    c.strokeStyle = 'rgba(120,112,98,.55)'; c.lineWidth = 1.2;
    c.beginPath();
    for (let k = -2; k <= 2; k++) { c.moveTo(mx + k * 20 - 30, my - 52); c.quadraticCurveTo(mx + k * 20 + 6, my, mx + k * 20 - 30, my + 52); }
    c.stroke();
    couch(c, () => { c.beginPath(); c.arc(mx, my, 62, 0, Math.PI * 2); }, 2.6, '#ece6d6', '#8f897c');
    sequins(c, ring, SILVER, '#ffffff');
  }, { t: 1.4, d: 1.1, reveal: 'iris' });

  // cloud scrolls, drawn in gold thread
  const clouds = [[1000, 330, 300, 1.1], [1150, 520, 220, 0.9], [180, 560, 230, 0.95], [470, 650, 150, 0.75], [1180, 760, 200, 0.85], [190, 840, 170, 0.8], [520, 250, 170, 0.8], [1240, 230, 150, 0.7]];
  clouds.forEach(([x, y, w, s], i) => {
    const lines = cloudScroll(x, y, w, s);
    p.group('sky', { x: x - 30, y: y - 60, w: w + 60, h: 110 }, (c) => {
      for (const l of lines) couch(c, polyPath(c, l, false), 2.4);
    }, { t: 1.8 + i * 0.22, d: 0.9, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });

  // sequins strewn over the velvet, in sprays of three and alone
  const spr = [[], [], [], []];
  for (let i = 0; i < 420; i++) {
    const x = r.range(FX0 + 12, FX1 - 12), y = r.range(FY0 + 12, 1090);
    if (inStupa(x, y)) continue;
    let near = false;
    for (const [cx, cy, w] of clouds) if (x > cx - 20 && x < cx + w + 20 && y > cy - 45 && y < cy + 30) near = true;
    if (near) continue;
    const band = Math.min(3, Math.floor(((x - FX0) / (FX1 - FX0)) * 4));
    if (r.chance(0.25)) {
      const a = r.range(0, Math.PI * 2);
      for (let k = 0; k < 3; k++) spr[band].push([x + Math.cos(a + k * 2.1) * 7, y + Math.sin(a + k * 2.1) * 7, 2.6]);
      spr[band].push([x, y, 1.6]);
    } else spr[band].push([x, y, r.range(1.8, 3.6)]);
  }
  spr.forEach((list, i) => {
    p.group('sky', { x: FX0 + i * 320 - 20, y: FY0, w: 360, h: 960 }, (c) => sequins(c, list, i % 2 ? '#c99a3c' : GOLD), { t: 2.4 + i * 0.3, d: 0.9, reveal: 'fade' });
  });
  // eight-point stars of thread among them
  const stars = [];
  for (let i = 0; i < 22; i++) {
    const x = r.range(FX0 + 30, FX1 - 30), y = r.range(FY0 + 30, 1000);
    if (inStupa(x, y)) continue;
    stars.push([x, y, r.range(7, 12)]);
  }
  p.group('sky', { x: FX0, y: FY0, w: FX1 - FX0, h: 900 }, (c) => {
    c.strokeStyle = GOLD; c.lineWidth = 1.6; c.lineCap = 'round';
    c.beginPath();
    for (const [x, y, s] of stars) for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI, L = k % 2 ? s * 0.6 : s;
      c.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
    }
    c.stroke();
    sequins(c, stars.map(([x, y]) => [x, y, 2.4]), GOLD_L, '#fff6da');
  }, { t: 3.6, d: 0.8, reveal: 'fade' });
}

// ================================================================ the stupa
// heights above the platform and half widths, at scale 1
const bellHW = (u) => { const s = (u - 155) / 195; return 115 + 90 * (1 - s) ** 1.7; };
const bowlHW = (u) => { const t = (u - 418) / 42; return 84 + 10 * Math.sin(Math.PI * t) - 14 * t; };
const budHW = (u) => { const t = (u - 535) / 245; return 9 + 41 * (1 - t) ** 1.35; };

// the sections of a stupa standing at (cx, base), scaled by s, bottom to top
function stupaParts(cx, base, s) {
  const Y = (u) => base - u * s, X = (h) => h * s;
  const slab = (u0, u1, h0, h1 = h0) => [[cx - X(h0), Y(u0)], [cx + X(h0), Y(u0)], [cx + X(h1), Y(u1)], [cx - X(h1), Y(u1)]];
  const prof = (u0, u1, f, n = 24) => {
    const R = [], L = [];
    for (let i = 0; i <= n; i++) { const u = lerp(u0, u1, i / n), h = f(u); R.push([cx + X(h), Y(u)]); L.push([cx - X(h), Y(u)]); }
    return R.concat(L.reverse());
  };
  // lotus moldings: a band whose lower (down) or upper (up) edge is petals
  const petals = (u0, u1, h0, h1, n, up) => {
    const pts = [];
    if (up) {
      pts.push([cx - X(h0), Y(u0)], [cx + X(h0), Y(u0)]);
      for (let i = n * 2; i >= 0; i--) { const t = i / (n * 2), x = cx + lerp(-X(h1), X(h1), t); pts.push([x, Y(i % 2 ? u1 - (u1 - u0) * 0.35 : u1)]); }
    } else {
      pts.push([cx + X(h1), Y(u1)], [cx - X(h1), Y(u1)]);
      for (let i = 0; i <= n * 2; i++) { const t = i / (n * 2), x = cx + lerp(-X(h0), X(h0), t); pts.push([x, Y(i % 2 ? u0 + (u1 - u0) * 0.35 : u0)]); }
    }
    return pts;
  };
  return [
    { k: 'terrace', pts: slab(0, 40, 360), u: [0, 40], hw: 360 },
    { k: 'terrace', pts: slab(40, 70, 320), u: [40, 70], hw: 320 },
    { k: 'terrace', pts: slab(70, 98, 285), u: [70, 98], hw: 285 },
    { k: 'oct', pts: slab(98, 120, 250, 244), hw: 250 },
    { k: 'oct', pts: slab(120, 138, 230, 224), hw: 230 },
    { k: 'oct', pts: slab(138, 155, 212, 206), hw: 212 },
    { k: 'bell', pts: prof(155, 350, bellHW), hw: 205 },
    { k: 'band', pts: prof(350, 375, (u) => 112 + 5 * Math.sin(Math.PI * (u - 350) / 25)), hw: 117 },
    { k: 'band', pts: prof(375, 398, (u) => 100 + 5 * Math.sin(Math.PI * (u - 375) / 23)), hw: 105 },
    { k: 'band', pts: prof(398, 418, (u) => 90 + 4 * Math.sin(Math.PI * (u - 398) / 20)), hw: 94 },
    { k: 'bowl', pts: prof(418, 460, bowlHW), hw: 92 },
    { k: 'band', pts: slab(460, 470, 68, 66), hw: 68 },
    { k: 'lotus', pts: petals(470, 502, 66, 60, 9, false), hw: 66 },
    { k: 'lotus', pts: petals(502, 535, 58, 50, 8, true), hw: 58 },
    { k: 'bud', pts: prof(535, 780, budHW, 30), hw: 50 },
  ];
}

function stupa(p, r) {
  // the platform: red velvet with a gold balustrade
  p.group('stupa', { x: 240, y: TERR - 10, w: 1120, h: 80 }, (c) => {
    pad(c, [[262, TERR], [1338, TERR], [1350, 1166], [250, 1166]], RED);
    c.strokeStyle = GOLD; c.lineWidth = 2;
    c.beginPath(); c.moveTo(262, TERR + 14); c.lineTo(1338, TERR + 14); c.stroke();
    c.fillStyle = GOLD;
    for (let x = 270; x < 1332; x += 14) c.fillRect(x, TERR + 3, 3, 11);
    c.fillStyle = RED_D;
    for (let x = 280; x < 1330; x += 46) { c.beginPath(); c.moveTo(x, 1160); c.lineTo(x, 1138); c.arc(x + 15, 1138, 15, Math.PI, 0); c.lineTo(x + 30, 1160); c.fill(); }
  }, { t: 3.4, d: 1.0, reveal: 'wipe', ease: 'inOut' });

  const parts = stupaParts(CX, TERR, 1);
  let t = 3.9;
  for (const part of parts) {
    const d = part.k === 'bell' ? 1.1 : part.k === 'bud' ? 1.0 : 0.45;
    const pts = part.pts, hw = part.hw;
    let y0 = Infinity, y1 = -Infinity;
    for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    p.group('stupa', { x: CX - hw - 10, y: y0 - 6, w: 2 * hw + 20, h: y1 - y0 + 14 }, (c) => {
      c.save(); c.translate(3, 4); c.fillStyle = 'rgba(0,0,0,.45)'; poly(c, pts); c.fill(); c.restore();
      c.fillStyle = goldGrad(c, CX - hw, CX + hw, part.k === 'band' ? 0.42 : 0.36);
      poly(c, pts); c.fill();
      if (part.k === 'terrace') {
        // the recesses along the terrace, and its cornice
        c.fillStyle = 'rgba(70,40,10,.55)';
        const [ua, ub] = part.u, yb = TERR - ua, yt = TERR - ub, step = 24;
        for (let x = CX - hw + 14; x < CX + hw - 20; x += step) {
          c.beginPath(); c.moveTo(x, yb - 4); c.lineTo(x, yt + 12); c.arc(x + 6, yt + 12, 6, Math.PI, 0); c.lineTo(x + 12, yb - 4); c.fill();
        }
        c.fillStyle = GOLD_L; c.fillRect(CX - hw, yt, 2 * hw, 3);
      }
      if (part.k === 'lotus' || part.k === 'band' || part.k === 'bowl') {
        c.strokeStyle = 'rgba(255,240,190,.7)'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(CX - hw * 0.8, (y0 + y1) / 2 - 2); c.lineTo(CX + hw * 0.5, (y0 + y1) / 2 - 2); c.stroke();
      }
      couch(c, polyPath(c, pts), 1.8, GOLD_D, GOLD_DD);
    }, { t, d, reveal: 'rise', ease: 'out' });
    t += part.k === 'bell' ? 0.75 : part.k === 'terrace' ? 0.3 : 0.2;
  }

  // the small spires that ring the terraces
  const spires = [];
  [[40, 360, 34, 30], [70, 320, 30, 25], [98, 285, 27, 21]].forEach(([u, hw, step, h]) => {
    for (let x = CX - hw + 10; x <= CX + hw - 10; x += step) spires.push([x, TERR - u, h]);
  });
  p.group('stupa', { x: CX - 370, y: TERR - 140, w: 740, h: 110 }, (c) => {
    for (const [x, y, h] of spires) {
      c.fillStyle = 'rgba(0,0,0,.4)';
      c.beginPath(); c.moveTo(x - h * 0.28 + 2, y + 2); c.quadraticCurveTo(x - h * 0.24 + 2, y - h * 0.5, x + 2, y - h + 2); c.quadraticCurveTo(x + h * 0.24 + 2, y - h * 0.5, x + h * 0.28 + 2, y + 2); c.fill();
      c.fillStyle = goldGrad(c, x - h * 0.28, x + h * 0.28);
      c.beginPath(); c.moveTo(x - h * 0.28, y); c.quadraticCurveTo(x - h * 0.24, y - h * 0.5, x, y - h); c.quadraticCurveTo(x + h * 0.24, y - h * 0.5, x + h * 0.28, y); c.closePath(); c.fill();
      c.strokeStyle = GOLD_DD; c.lineWidth = 1; c.stroke();
      c.fillStyle = GOLD_L; c.beginPath(); c.arc(x, y - h - 2, 1.8, 0, Math.PI * 2); c.fill();
    }
  }, { t: 5.0, d: 0.7, reveal: 'rise' });

  // the hti: seven rings of the umbrella, each with its little bells
  const rings = [];
  for (let i = 0; i < 7; i++) rings.push([TERR - 782 - i * 11, 34 - i * 3.7]);
  rings.forEach(([y, hw], i) => {
    p.group('stupa', { x: CX - hw - 8, y: y - 10, w: 2 * hw + 16, h: 24 }, (c) => {
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(CX + 2, y + 3, hw, 3.6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = goldGrad(c, CX - hw, CX + hw, 0.4); c.beginPath(); c.ellipse(CX, y, hw, 3.6, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = GOLD_DD; c.lineWidth = 0.9; c.stroke();
      c.fillStyle = GOLD_L;
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.arc(CX + k * hw * 0.42, y + 6, 1.5, 0, Math.PI * 2); c.fill(); }
    }, { t: 9.0 + i * 0.08, d: 0.4, reveal: 'drop', dy: 16 });
  });
  // the mast through the hti, the vane and the diamond orb
  const ytop = TERR - 780;
  p.group('stupa', { x: CX - 20, y: TERR - 920, w: 60, h: 150 }, (c) => {
    c.strokeStyle = GOLD; c.lineWidth = 3; c.beginPath(); c.moveTo(CX, ytop); c.lineTo(CX, TERR - 905); c.stroke();
    const vy = TERR - 865;
    c.fillStyle = GOLD_L; c.beginPath(); c.moveTo(CX - 3, vy + 5); c.quadraticCurveTo(CX + 14, vy - 6, CX + 30, vy); c.quadraticCurveTo(CX + 14, vy + 10, CX - 3, vy + 9); c.fill();
    c.strokeStyle = GOLD_DD; c.lineWidth = 1; c.stroke();
    const oy = TERR - 890;
    c.fillStyle = '#fff8e2'; c.beginPath(); c.arc(CX, oy, 7, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 1.6; c.stroke();
  }, { t: 9.7, d: 0.5, reveal: 'pop' });

  // the gold plates of the bell and the bud
  const plates = [];
  for (let u = 168; u < 345; u += 16) {
    const h = bellHW(u), y = TERR - u;
    const L = [];
    for (let i = 0; i <= 12; i++) { const t2 = i / 12; L.push([CX + (t2 * 2 - 1) * h, y + Math.sin(t2 * Math.PI) * 5]); }
    plates.push(L);
  }
  for (let k = -5; k <= 5; k++) {
    if (!k) continue;
    const L = [];
    for (let u = 156; u <= 350; u += 8) L.push([CX + bellHW(u) * (k / 6) * Math.cos((k / 6) * 0.3), TERR - u + Math.cos((k / 6) * Math.PI / 2) * 4]);
    plates.push(L);
  }
  for (let k = -2; k <= 2; k++) {
    if (!k) continue;
    const L = [];
    for (let u = 536; u <= 776; u += 10) L.push([CX + budHW(u) * k / 3, TERR - u]);
    plates.push(L);
  }
  p.strokes('stupa', plates, 'rgba(96,60,14,.55)', 1.1, { t: 8.9, d: 0.8, reveal: 'fade', box: { x: CX - 215, y: TERR - 790, w: 430, h: 650 } });

  // sequins over the gold, densest on the bell and the bud's tip
  const sq = [];
  for (let u = 160; u < 346; u += 9) {
    const h = bellHW(u) - 8, y = TERR - u, off = (Math.round(u / 9) % 2) * 4.5;
    for (let x = -h + off; x <= h; x += 9) if (r.chance(0.55)) sq.push([CX + x, y + Math.sqrt(Math.max(0, 1 - (x / h) ** 2)) * 4, r.range(1.3, 2.2)]);
  }
  for (let u = 540; u < 776; u += 8) {
    const h = budHW(u) - 4;
    for (let x = -h; x <= h; x += 7) if (r.chance(0.3 + (u - 540) / 400)) sq.push([CX + x, TERR - u, r.range(1.2, 1.9)]);
  }
  for (const [y, hw] of rings) for (let x = -hw + 3; x <= hw - 3; x += 6) sq.push([CX + x, y, 1.4]);
  p.group('stupa', { x: CX - 215, y: TERR - 800, w: 430, h: 660 }, (c) => sequins(c, sq, '#f2d27c', '#fffbe8'), { t: 10.0, d: 1.2, reveal: 'rise', ease: 'inOut' });

}

// ================================================================ pavilions and small zedis
// a pyatthat: a pillared hall under tier on tier of gold roofs with a spire
function pyatthat(c, x, base, w, n, k = 1) {
  const sh = (pts, col) => {
    c.save(); c.translate(3 * k, 4 * k); c.fillStyle = 'rgba(0,0,0,.45)'; poly(c, pts); c.fill(); c.restore();
    c.fillStyle = col; poly(c, pts); c.fill();
    c.strokeStyle = GOLD_DD; c.lineWidth = 1.2 * k; c.stroke();
  };
  // plinth and hall
  sh([[x - w * 0.5, base], [x + w * 0.5, base], [x + w * 0.5, base - 12 * k], [x - w * 0.5, base - 12 * k]], GOLD_D);
  const hw = w * 0.38, hh = 66 * k, hb = base - 12 * k;
  sh([[x - hw, hb], [x + hw, hb], [x + hw, hb - hh], [x - hw, hb - hh]], RED);
  c.fillStyle = GOLD;
  for (const f of [-0.92, -0.32, 0.32, 0.92]) c.fillRect(x + hw * f - 3 * k, hb - hh + 6 * k, 6 * k, hh - 6 * k);
  c.fillStyle = '#0d0708';
  c.beginPath(); c.moveTo(x - hw * 0.22, hb); c.lineTo(x - hw * 0.22, hb - hh * 0.55); c.quadraticCurveTo(x, hb - hh * 0.85, x + hw * 0.22, hb - hh * 0.55); c.lineTo(x + hw * 0.22, hb); c.fill();
  c.strokeStyle = GOLD_L; c.lineWidth = 1.3 * k; c.stroke();
  // the roofs
  let y = hb - hh;
  for (let i = 0; i < n; i++) {
    const rw = w * (0.62 - i * 0.085), th = (30 - i * 2.4) * k;
    const top = rw * 0.5;
    const roof = [
      [x - rw - 12 * k, y - 10 * k], [x - rw, y], [x + rw, y], [x + rw + 12 * k, y - 10 * k],
      [x + rw * 0.92, y - 4 * k], [x + top, y - th], [x - top, y - th], [x - rw * 0.92, y - 4 * k],
    ];
    sh(roof, goldGrad(c, x - rw, x + rw, 0.4));
    // the eave's fretwork
    c.fillStyle = GOLD_DD;
    for (let xx = x - rw + 6 * k; xx < x + rw - 4 * k; xx += 7 * k) c.fillRect(xx, y - 3.5 * k, 2.2 * k, 3 * k);
    y -= th;
    // the neck between the roofs
    const nw = top * 0.82, nh = 7 * k;
    sh([[x - nw, y], [x + nw, y], [x + nw, y - nh], [x - nw, y - nh]], RED_D);
    y -= nh;
  }
  // the spire
  const sp = 70 * k;
  sh([[x - 9 * k, y], [x + 9 * k, y], [x + 2, y - sp], [x - 2, y - sp]], GOLD);
  c.fillStyle = GOLD_L;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(x, y - sp * (0.35 + i * 0.16), (8 - i * 1.6) * k, 1.8 * k, 0, 0, Math.PI * 2); c.fill(); }
  c.beginPath(); c.arc(x, y - sp - 3 * k, 2.6 * k, 0, Math.PI * 2); c.fill();
  return y - sp - 6 * k;
}
// a small bell zedi on its own plinth
function zedi(c, x, base, h) {
  const parts = stupaParts(x, base, h / 905);
  for (const part of parts) {
    c.fillStyle = 'rgba(0,0,0,.4)'; c.save(); c.translate(2, 3); poly(c, part.pts); c.fill(); c.restore();
    c.fillStyle = goldGrad(c, x - part.hw * h / 905, x + part.hw * h / 905); poly(c, part.pts); c.fill();
    c.strokeStyle = GOLD_DD; c.lineWidth = 0.9; c.stroke();
  }
  const top = base - 780 * h / 905;
  c.strokeStyle = GOLD_L; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, top); c.lineTo(x, top - h * 0.1); c.stroke();
}

function zedis(p) {
  const small = [[352, 112], [1248, 112], [545, 96], [1055, 96]];
  small.forEach(([x, h], i) => {
    p.group('zedis', { x: x - h * 0.45, y: TERR - h * 1.05, w: h * 0.9, h: h * 1.05 + 8 }, (c) => zedi(c, x, TERR + 2, h), { t: 5.6 + i * 0.15, d: 0.6, reveal: 'rise' });
  });
  p.group('zedis', { x: 340, y: 720, w: 180, h: 400 }, (c) => pyatthat(c, 430, TERR + 4, 160, 5), { t: 6.6, d: 1.1, reveal: 'rise' });
  p.group('zedis', { x: 1080, y: 720, w: 180, h: 400 }, (c) => pyatthat(c, 1170, TERR + 4, 160, 5), { t: 7.0, d: 1.1, reveal: 'rise' });
}

// ================================================================ the far side: Sule and the High Court
function far(p) {
  // Sule Pagoda, on the left
  p.group('far', { x: 150, y: 880, w: 200, h: 370 }, (c) => {
    const x = 250, base = 1236, s = 0.36;
    // its octagonal walls with their shops below
    pad(c, [[x - 92, base], [x + 92, base], [x + 92, base - 26], [x - 92, base - 26]], RED, { lw: 1.6 });
    c.fillStyle = '#0d0708';
    for (let xx = x - 84; xx < x + 80; xx += 18) c.fillRect(xx, base - 20, 10, 14);
    zedi(c, x, base - 24, 905 * s);
  }, { t: 2.6, d: 1.1, reveal: 'rise' });
  // the High Court: red brick banded with white, its clock tower in the middle
  p.group('far', { x: 1230, y: 880, w: 220, h: 370 }, (c) => {
    const base = 1240;
    pad(c, [[1250, base], [1440, base], [1440, base - 110], [1250, base - 110]], RED_L, { lw: 1.6 });
    c.fillStyle = CREAM;
    for (let y = base - 104; y < base; y += 22) c.fillRect(1252, y, 186, 4);
    c.fillStyle = '#1b0f0e';
    for (let row = 0; row < 3; row++) for (let xx = 1262; xx < 1430; xx += 22) {
      if (xx > 1326 && xx < 1366) continue;
      const y = base - 96 + row * 32;
      c.beginPath(); c.moveTo(xx, y + 20); c.lineTo(xx, y + 6); c.arc(xx + 6, y + 6, 6, Math.PI, 0); c.lineTo(xx + 12, y + 20); c.fill();
    }
    // the tower
    const tx = 1346, tw = 30, top = base - 300;
    pad(c, [[tx - tw, base], [tx + tw, base], [tx + tw, top + 50], [tx - tw, top + 50]], RED_L, { lw: 1.6 });
    c.fillStyle = CREAM;
    for (let y = top + 60; y < base; y += 20) c.fillRect(tx - tw + 2, y, 2 * tw - 4, 4);
    c.fillStyle = '#1b0f0e';
    for (let y = top + 140; y < base - 40; y += 44) c.fillRect(tx - 6, y, 12, 22);
    // the clock stage, the lantern and the little dome
    pad(c, [[tx - tw - 6, top + 52], [tx + tw + 6, top + 52], [tx + tw + 6, top + 44], [tx - tw - 6, top + 44]], CREAM, { lw: 1.4 });
    c.fillStyle = SILVER; c.beginPath(); c.arc(tx, top + 80, 17, 0, Math.PI * 2); c.fill();
    couch(c, () => { c.beginPath(); c.arc(tx, top + 80, 17, 0, Math.PI * 2); }, 2);
    c.strokeStyle = '#1b0f0e'; c.lineWidth = 2; c.beginPath(); c.moveTo(tx, top + 80); c.lineTo(tx, top + 69); c.moveTo(tx, top + 80); c.lineTo(tx + 8, top + 84); c.stroke();
    pad(c, [[tx - 20, top + 44], [tx + 20, top + 44], [tx + 20, top + 18], [tx - 20, top + 18]], RED_L, { lw: 1.4 });
    c.fillStyle = '#1b0f0e'; c.fillRect(tx - 12, top + 24, 6, 14); c.fillRect(tx + 6, top + 24, 6, 14);
    const dome = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; dome.push([tx + Math.cos(a) * 22, top + 18 + Math.sin(a) * 18]); }
    pad(c, dome, GOLD, { lw: 1.4 });
    c.strokeStyle = GOLD_L; c.lineWidth = 2; c.beginPath(); c.moveTo(tx, top); c.lineTo(tx, top - 22); c.stroke();
  }, { t: 2.9, d: 1.1, reveal: 'rise' });
}

// ================================================================ the hill: trees and palms
function blob(r, x, y, rad) {
  const pts = [], n = 14, ph = r.range(0, 6);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 1 + 0.12 * Math.sin(a * 3 + ph) + 0.06 * Math.sin(a * 5 + ph * 2);
    pts.push([x + Math.cos(a) * rad * k, y + Math.sin(a) * rad * 0.82 * k]);
  }
  return pts;
}
function hill(p, r) {
  const ground = [[FX0, 1290], [FX0, 1235], [260, 1205], [420, 1170], [600, 1158], [1000, 1158], [1180, 1170], [1340, 1205], [FX1, 1235], [FX1, 1290]];
  p.fill('hill', ground, GREEN_D, { t: 3.1, d: 0.8, reveal: 'rise' });
  // crowns in rows, back to front
  const crowns = [];
  for (let row = 0; row < 3; row++) {
    for (let x = FX0 + 10 + row * 22; x < FX1; x += r.range(42, 66)) {
      const yTop = 1150 + Math.abs(x - CX) * 0.08;
      const y = yTop + row * 34 + r.range(-6, 6);
      if (row === 0 && Math.abs(x - CX) < 380 && r.chance(0.5)) continue;
      const rad = r.range(24, 36) - row * 2;
      crowns.push({ x, y, row, pts: blob(r, x, y, rad), col: [GREEN, GREEN_L, '#2f7346', '#3d6e3a'][r.int(0, 3)] });
    }
  }
  const groups = 6;
  for (let gI = 0; gI < groups; gI++) {
    const list = crowns.filter((cr, i) => i % groups === gI);
    p.group('hill', { x: FX0 - 10, y: 1090, w: FX1 - FX0 + 20, h: 210 }, (c) => {
      for (const cr of list) {
        pad(c, cr.pts, cr.col, { lw: 1.6 });
        // the stitched leaf veins
        c.strokeStyle = 'rgba(210,180,90,.55)'; c.lineWidth = 1;
        const [x0, y0] = [cr.x, cr.y];
        c.beginPath(); c.moveTo(x0 - 12, y0 + 6); c.quadraticCurveTo(x0, y0 - 10, x0 + 12, y0 + 6); c.moveTo(x0 - 6, y0 - 6); c.lineTo(x0 + 4, y0 - 14); c.stroke();
      }
    }, { t: 3.3 + gI * 0.2, d: 0.6, reveal: 'pop' });
  }
  // toddy palms: tall trunks and round fans
  const palms = [[184, 1250, 300], [1424, 1252, 330], [660, 1262, 120], [960, 1262, 110], [420, 1262, 90]];
  palms.forEach(([x, y, h], i) => {
    p.group('hill', { x: x - 70, y: y - h - 70, w: 140, h: h + 80 }, (c) => {
      c.strokeStyle = TEAK; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 6, y - h * 0.5, x + 2, y - h); c.stroke();
      c.strokeStyle = 'rgba(230,190,110,.5)'; c.lineWidth = 1;
      c.beginPath(); for (let yy = y - 10; yy > y - h + 10; yy -= 9) { c.moveTo(x - 3, yy); c.lineTo(x + 5, yy - 2); } c.stroke();
      const cy = y - h - 6;
      for (let k = 0; k < 11; k++) {
        const a = Math.PI * (1.02 + k * 0.096) + (k % 2 ? 0.05 : 0);
        const L = 46 + (k % 3) * 6;
        const tip = [x + 2 + Math.cos(a) * L, cy + Math.sin(a) * L * 0.9];
        const fan = [[x + 2, cy], [tip[0] + Math.cos(a + 1.6) * 7, tip[1] + Math.sin(a + 1.6) * 7], [tip[0] + Math.cos(a - 1.6) * 7, tip[1] + Math.sin(a - 1.6) * 7]];
        c.fillStyle = k % 2 ? GREEN : GREEN_L; poly(c, fan); c.fill();
      }
      for (let k = 0; k < 6; k++) {
        const a = Math.PI * (0.05 + k * 0.18), L = 34;
        const tip = [x + 2 + Math.cos(a) * L, cy + Math.sin(a) * L * 0.7];
        c.fillStyle = GREEN_D; poly(c, [[x + 2, cy], [tip[0] - 5, tip[1]], [tip[0] + 5, tip[1]]]); c.fill();
      }
      couch(c, () => { c.beginPath(); c.arc(x + 2, cy, 9, 0, Math.PI * 2); }, 2);
    }, { t: 4.7 + i * 0.18, d: 0.8, reveal: 'rise' });
  });
}

// ================================================================ the lake
function lake(p, r) {
  p.group('lake', { x: FX0, y: LAKE - 6, w: FX1 - FX0, h: SHORE - LAKE + 12 }, (c) => {
    const g = c.createLinearGradient(0, LAKE, 0, SHORE);
    g.addColorStop(0, BLUE_L); g.addColorStop(0.5, BLUE); g.addColorStop(1, BLUE_D);
    c.fillStyle = g; c.fillRect(FX0, LAKE, FX1 - FX0, SHORE - LAKE);
    couch(c, () => { c.beginPath(); c.moveTo(FX0, LAKE); c.lineTo(FX1, LAKE); }, 3);
  }, { t: 6.0, d: 1.4, reveal: 'wipe', ease: 'inOut' });
  // scale waves, a row at a time
  let i = 0;
  for (let y = LAKE + 22; y < SHORE - 6; y += 17, i++) {
    const w = 24 + (y - LAKE) * 0.06, lines = [];
    const off = (i % 2) * w / 2;
    for (let x = FX0 - off; x < FX1; x += w) {
      if (x > 900 && x < 1390 && y < 1470) continue; // the barge covers these
      const L = [];
      for (let k = 0; k <= 8; k++) { const a = Math.PI + (k / 8) * Math.PI; L.push([x + w / 2 + Math.cos(a) * w / 2, y + Math.sin(a) * w * 0.28]); }
      lines.push(L);
    }
    p.strokes('lake', lines, i % 3 === 1 ? '#c99a3c' : 'rgba(214,170,74,.85)', 1.5, { t: 6.6 + i * 0.09, d: 0.7, reveal: i % 2 ? 'wipeL' : 'wipe', box: { x: FX0, y: y - 14, w: FX1 - FX0, h: 20 } });
  }
  // the pagoda's reflection: gold stitches narrowing down the water
  const refl = [];
  for (let y = LAKE + 8; y < SHORE - 20; y += 7) {
    const h = 150 * (1 - (y - LAKE) / (SHORE - LAKE)) + 14;
    for (let x = CX - h; x < CX + h; x += r.range(14, 30)) {
      const L = r.range(6, 16);
      refl.push([[x, y + r.range(-2, 2)], [x + L, y]]);
    }
  }
  p.strokes('lake', refl, 'rgba(246,214,128,.75)', 2, { t: 8.6, d: 1.0, reveal: 'fall', box: { x: CX - 180, y: LAKE, w: 360, h: SHORE - LAKE } });
}

// ================================================================ the Karaweik barge
const BX = 1140, WL = 1452; // the barge's middle and its waterline
function bargeDraw(c) {
  // the hull, low and long
  const hull = [[905, WL - 26], [1380, WL - 26], [1366, WL - 4], [1330, WL + 6], [950, WL + 6], [918, WL - 6]];
  pad(c, hull, GOLD);
  c.fillStyle = RED;
  c.fillRect(930, WL - 18, 430, 9);
  c.fillStyle = GOLD_L;
  for (let x = 936; x < 1356; x += 16) { c.beginPath(); c.arc(x, WL - 13.5, 2.2, 0, Math.PI * 2); c.fill(); }
  // the prow: a long neck rising to a bird's head with a curling crest
  const neck = [[1350, WL - 24], [1386, WL - 30], [1408, WL - 80], [1412, WL - 130], [1402, WL - 160], [1386, WL - 170], [1376, WL - 156], [1390, WL - 132], [1386, WL - 86], [1360, WL - 44], [1336, WL - 26]];
  pad(c, neck, GOLD);
  const head = [[1376, WL - 170], [1396, WL - 182], [1420, WL - 176], [1446, WL - 162], [1418, WL - 156], [1396, WL - 152]];
  pad(c, head, GOLD_L);
  c.fillStyle = RED_D; c.beginPath(); c.arc(1404, WL - 168, 3, 0, Math.PI * 2); c.fill();
  couch(c, polyPath(c, spiral(1378, WL - 182, 14, 1.3, -1, 0), false), 2.4);
  // the stern: a tail of curling plumes
  const tail = [[948, WL - 24], [912, WL - 30], [884, WL - 70], [872, WL - 118], [892, WL - 108], [904, WL - 72], [930, WL - 40], [952, WL - 26]];
  pad(c, tail, GOLD);
  for (let k = 0; k < 3; k++) couch(c, polyPath(c, spiral(880 + k * 13, WL - 116 + k * 18, 10 - k * 2, 1.2, 1, Math.PI), false), 2.2);
  // two small pavilions and the great one in the middle
  for (const x of [1012, 1268]) pyatthat(c, x, WL - 24, 92, 3, 0.62);
  pyatthat(c, BX, WL - 24, 230, 7, 0.95);
}
function barge(p) {
  p.group('barge', { x: 860, y: 1120, w: 600, h: WL - 1110 }, (c) => bargeDraw(c), { t: 8.0, d: 1.4, reveal: 'rise', ease: 'out' });
  // its reflection, upside down and dim in the blue
  p.group('barge', { x: 860, y: WL, w: 600, h: SHORE - WL }, (c) => {
    c.beginPath(); c.rect(FX0, WL + 6, FX1 - FX0, SHORE - WL - 6); c.clip();
    c.globalAlpha *= 0.22;
    c.translate(0, 2 * WL + 4); c.scale(1, -1);
    bargeDraw(c);
  }, { t: 9.2, d: 0.9, reveal: 'fade' });
}

// ================================================================ the boardwalk and its walkers
function person(c, x, foot, o) {
  const h = o.h;
  c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(x - h * 0.13 + 2, foot - h * 0.55 + 3, h * 0.26, h * 0.55);
  // longyi to the ankle
  c.fillStyle = o.longyi; poly(c, [[x - h * 0.12, foot - h * 0.5], [x + h * 0.12, foot - h * 0.5], [x + h * 0.14, foot - 3], [x - h * 0.14, foot - 3]]); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1;
  c.beginPath(); for (let k = 1; k < 4; k++) { c.moveTo(x - h * 0.12, foot - h * 0.5 + k * h * 0.11); c.lineTo(x + h * 0.13, foot - h * 0.5 + k * h * 0.11); } c.stroke();
  c.fillStyle = SKIN; c.fillRect(x - h * 0.09, foot - 3, h * 0.07, 3); c.fillRect(x + h * 0.03, foot - 3, h * 0.07, 3);
  // shirt, head, hair
  c.fillStyle = o.shirt; poly(c, [[x - h * 0.13, foot - h * 0.5], [x + h * 0.13, foot - h * 0.5], [x + h * 0.11, foot - h * 0.8], [x - h * 0.11, foot - h * 0.8]]); c.fill();
  c.fillStyle = SKIN; c.beginPath(); c.arc(x, foot - h * 0.88, h * 0.085, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#140b0a'; c.beginPath(); c.arc(x, foot - h * 0.9, h * 0.085, Math.PI * 1.05, Math.PI * 1.95); c.fill();
  if (o.parasol) {
    const py = foot - h * 1.12, pr = h * 0.34;
    c.strokeStyle = TEAK_D; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + h * 0.08, foot - h * 0.62); c.lineTo(x + h * 0.06, py); c.stroke();
    c.fillStyle = o.parasol; c.beginPath(); c.moveTo(x + h * 0.06 - pr, py + pr * 0.32); c.quadraticCurveTo(x + h * 0.06, py - pr * 0.6, x + h * 0.06 + pr, py + pr * 0.32); c.closePath(); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 1;
    c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(x + h * 0.06, py - pr * 0.12); c.lineTo(x + h * 0.06 + k * pr * 0.45, py + pr * 0.3); } c.stroke();
  }
}

function front(p, r) {
  // the deck of the boardwalk
  p.group('front', { x: FX0, y: SHORE - 8, w: FX1 - FX0, h: PANEL - SHORE + 10 }, (c) => {
    c.fillStyle = TEAK; c.fillRect(FX0, SHORE, FX1 - FX0, PANEL - SHORE - 14);
    c.strokeStyle = TEAK_D; c.lineWidth = 1.4;
    c.beginPath(); for (let x = FX0 + 18; x < FX1; x += 22) { c.moveTo(x, SHORE + 4); c.lineTo(x - 6, PANEL - 16); } c.stroke();
    c.fillStyle = TEAK_D; c.fillRect(FX0, PANEL - 16, FX1 - FX0, 6);
  }, { t: 9.0, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // walkers
  const cols = [[RED, CREAM, '#d8692f'], [GREEN, '#e7c9a0', null], [BLUE_L, CREAM, RED_L], ['#6a2c56', '#f0d0b0', null], [RED_D, CREAM, '#e0a12e'], ['#2a5f6b', CREAM, '#c03b5c'], ['#7a4b1c', '#efe3c6', null], [GREEN_L, CREAM, '#d8692f'], [RED, '#e7c9a0', null]];
  const xs = [230, 300, 420, 560, 640, 760, 1010, 1200, 1330];
  xs.forEach((x, i) => {
    const [longyi, shirt, parasol] = cols[i];
    const h = r.range(56, 66);
    p.group('front', { x: x - 30, y: SHORE - 70, w: 60, h: 100 }, (c) => person(c, x, SHORE + 22, { h, longyi, shirt, parasol }), { t: 9.4 + i * 0.1, d: 0.5, reveal: 'drop', dy: 12 });
  });
  // the railing in front of them
  p.group('front', { x: FX0, y: SHORE - 34, w: FX1 - FX0, h: 70 }, (c) => {
    c.fillStyle = TEAK;
    for (let x = FX0 + 20; x < FX1; x += 64) c.fillRect(x - 3, SHORE - 22, 7, 52);
    c.fillRect(FX0, SHORE - 26, FX1 - FX0, 7); c.fillRect(FX0, SHORE + 4, FX1 - FX0, 5);
    couch(c, () => { c.beginPath(); c.moveTo(FX0, SHORE - 26); c.lineTo(FX1, SHORE - 26); }, 2);
    c.strokeStyle = TEAK_D; c.lineWidth = 1.5;
    c.beginPath(); for (let x = FX0 + 20; x < FX1 - 60; x += 64) { c.moveTo(x + 4, SHORE - 19); c.lineTo(x + 60, SHORE + 4); c.moveTo(x + 60, SHORE - 19); c.lineTo(x + 4, SHORE + 4); } c.stroke();
  }, { t: 10.2, d: 0.8, reveal: 'wipe' });
  // the divider above the title: a gold line and a row of sequins
  const sq = [];
  for (let x = FX0 + 10; x < FX1 - 4; x += 12) sq.push([x, PANEL + 6, 2.8]);
  p.group('front', { x: FX0, y: PANEL - 8, w: FX1 - FX0, h: 24 }, (c) => {
    couch(c, () => { c.beginPath(); c.moveTo(FX0, PANEL - 3); c.lineTo(FX1, PANEL - 3); }, 3);
    sequins(c, sq);
  }, { t: 10.4, d: 0.8, reveal: 'wipe' });
}

// ================================================================ what moves
function life(p, r) {
  // sequins that catch the light, one and then another
  const tw = [];
  for (let i = 0; i < 40; i++) {
    let x, y;
    do { x = r.range(FX0 + 20, FX1 - 20); y = r.range(FY0 + 20, 1060); } while (inStupa(x, y));
    tw.push([x, y, r.range(0, 6.28), r.range(0.7, 1.4), r.range(5, 9)]);
  }
  // some on the gold of the pagoda itself
  for (let i = 0; i < 14; i++) { const u = r.range(170, 760), h = u < 350 ? bellHW(u) : u < 535 ? 70 : budHW(u); tw.push([CX + r.range(-h * 0.8, h * 0.8), TERR - u, r.range(0, 6.28), r.range(0.8, 1.5), r.range(5, 8)]); }
  p.live('live', {
    t: 10.6, d: 0.8, reveal: 'fade', box: { x: 0, y: 0, w: W, h: H },
    draw: (c, time) => {
      c.fillStyle = '#fff8e0';
      for (const [x, y, ph, sp, s] of tw) {
        const a = Math.sin(time * sp + ph);
        if (a < 0.55) continue;
        const k = (a - 0.55) / 0.45;
        c.globalAlpha = k; const L = s * k;
        c.fillRect(x - L, y - 0.8, 2 * L, 1.6); c.fillRect(x - 0.8, y - L, 1.6, 2 * L);
      }
      c.globalAlpha = 1;
    },
  });
  // glints on the lake
  const gl = [];
  for (let i = 0; i < 26; i++) gl.push([r.range(FX0 + 20, 880), r.range(LAKE + 16, SHORE - 30), r.range(0, 6.28), r.range(8, 18)]);
  p.live('live', {
    t: 10.8, d: 0.8, reveal: 'fade', box: { x: FX0, y: LAKE, w: FX1 - FX0, h: SHORE - LAKE },
    draw: (c, time) => {
      c.fillStyle = GOLD_L;
      for (const [x, y, ph, L] of gl) {
        const a = Math.sin(time * 1.3 + ph);
        if (a < 0.3) continue;
        c.globalAlpha = a; c.fillRect(x + Math.sin(time * 0.6 + ph) * 4, y, L, 2);
      }
      c.globalAlpha = 1;
    },
  });
  // a rowing boat crossing slowly
  p.live('live', {
    t: 10.0, d: 1.0, reveal: 'fade', box: { x: FX0, y: LAKE, w: FX1 - FX0, h: SHORE - LAKE },
    draw: (c, time) => {
      const x = 300 + Math.max(0, time - 10) * 11, y = 1412 + Math.sin(time * 1.2) * 1.5;
      const oar = Math.sin(time * 2.2);
      c.fillStyle = 'rgba(0,0,0,.4)'; poly(c, [[x - 44, y - 6], [x + 48, y - 6], [x + 34, y + 9], [x - 34, y + 9]]); c.fill();
      c.fillStyle = TEAK; poly(c, [[x - 46, y - 9], [x + 46, y - 9], [x + 32, y + 5], [x - 32, y + 5]]); c.fill();
      c.strokeStyle = GOLD; c.lineWidth = 2; c.stroke();
      c.fillStyle = RED; poly(c, [[x - 8, y - 9], [x + 8, y - 9], [x + 6, y - 28], [x - 6, y - 28]]); c.fill();
      c.fillStyle = SKIN; c.beginPath(); c.arc(x, y - 33, 5.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e0a12e'; c.beginPath(); c.moveTo(x - 10, y - 36); c.lineTo(x, y - 46); c.lineTo(x + 10, y - 36); c.closePath(); c.fill();
      c.strokeStyle = TEAK_D; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(x - 2, y - 20); c.lineTo(x - 30 + oar * 14, y + 10); c.moveTo(x + 2, y - 20); c.lineTo(x + 30 - oar * 14, y + 10); c.stroke();
    },
  });
  // two egrets, flying across the sky
  p.live('live', {
    t: 10.3, d: 1.0, reveal: 'fade', box: { x: FX0, y: FY0, w: FX1 - FX0, h: 700 },
    draw: (c, time) => {
      const T = Math.max(0, time - 10.3);
      [[1360, 470, 0], [1420, 500, 1.3]].forEach(([x0, y0, ph]) => {
        const x = x0 - T * 22, y = y0 + Math.sin(T * 0.5 + ph) * 8;
        if (x < FX0 + 30) return;
        const f = Math.sin(time * 4 + ph);
        c.fillStyle = '#f3efe4';
        c.beginPath(); c.ellipse(x, y, 13, 4.5, -0.1, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.moveTo(x - 3, y - 2); c.quadraticCurveTo(x + 4, y - 18 * f, x + 14, y - 22 * f); c.quadraticCurveTo(x + 8, y - 4, x + 6, y); c.fill();
        c.strokeStyle = '#f3efe4'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 11, y - 1); c.quadraticCurveTo(x - 18, y - 6, x - 22, y - 3); c.stroke();
        c.strokeStyle = GOLD; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 22, y - 3); c.lineTo(x - 29, y - 2); c.moveTo(x + 12, y + 1); c.lineTo(x + 24, y + 3); c.stroke();
      });
    },
  });
}

// ================================================================ the title
// set one grapheme cluster at a time, so the Burmese letters keep their marks
function clusters(p, layer, str, cx, y, o) {
  const m = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  const font = `${o.weight || 700} ${o.size}px ${F}`;
  m.font = font;
  const segs = typeof Intl !== 'undefined' && Intl.Segmenter
    ? [...new Intl.Segmenter('my', { granularity: 'grapheme' }).segment(str)].map((s) => s.segment)
    : [...str];
  const total = m.measureText(str).width, x0 = cx - total / 2;
  let pre = '';
  segs.forEach((g, i) => {
    const gx = x0 + m.measureText(pre).width, gw = m.measureText(g).width;
    pre += g;
    p.mark(layer, {
      t: o.t + i * o.gap, d: o.d, reveal: 'press', ease: 'out',
      box: { x: gx - o.size * 0.3, y: y - o.size * 1.3, w: gw + o.size * 0.6, h: o.size * 1.9 },
      draw: (c) => {
        c.font = font; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillStyle = 'rgba(0,0,0,.6)'; c.fillText(g, gx + 4, y + 6);
        const gr = c.createLinearGradient(0, y - o.size * 0.8, 0, y + o.size * 0.2);
        gr.addColorStop(0, GOLD_L); gr.addColorStop(0.55, GOLD); gr.addColorStop(1, GOLD_D);
        c.fillStyle = gr; c.fillText(g, gx, y);
        c.strokeStyle = GOLD_DD; c.lineWidth = 1.5; c.strokeText(g, gx, y);
      },
    });
  });
  return { x0, total };
}

function title(p) {
  const base = 1724;
  const { x0, total } = clusters(p, 'title', MY, CX, base, { size: 140, t: 10.8, gap: 0.26, d: 0.9 });
  p.type('title', 'YANGON', CX, 1826, { family: F, weight: 400, size: 30, color: CREAM, align: 'center', track: 0.7, t: 12.1, gap: 0.09, d: 0.5 });
  // sequin rosettes either side of the name
  const ros = [];
  for (const x of [x0 - 110, x0 + total + 110]) {
    ros.push([x, 1694, 7]);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ros.push([x + Math.cos(a) * 18, 1694 + Math.sin(a) * 18, 4]); }
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 + 0.26; ros.push([x + Math.cos(a) * 32, 1694 + Math.sin(a) * 32, 2.6]); }
  }
  p.group('title', { x: FX0, y: 1670, w: FX1 - FX0, h: 100 }, (c) => sequins(c, ros), { t: 12.7, d: 0.7, reveal: 'pop' });
  // the gold lines either side of YANGON
  p.group('title', { x: FX0, y: 1805, w: FX1 - FX0, h: 24 }, (c) => {
    couch(c, () => { c.beginPath(); c.moveTo(CX - 330, 1816); c.lineTo(CX - 150, 1816); c.moveTo(CX + 150, 1816); c.lineTo(CX + 330, 1816); }, 2.2);
  }, { t: 13.0, d: 0.7, reveal: 'wipe' });
}
