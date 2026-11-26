// Venice: golden hour from the water, as an ink-and-wash print seen through a
// Venetian window. Sepia hairlines over soft washes: the Salute and the Dogana on
// the left, the Library, the Campanile, the two columns and the Doge's Palace in
// its pink and white, then the Riva. Half the sheet is lagoon, holding all of it
// upside down. Striped poles and a gondola close by. A Didone italic in the sky.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, lerp, poly, rng } from '../kit.js';

const SEPIA = '#5b3a2e', INK = '#3e2622';
const CREAM = '#f7ecd6', STONE = '#f1dfc2', STONE_S = '#d9b9a3', ROSE = '#e5a08c', ROSE_D = '#c47b6d';
const GOLD = '#e3a945', GOLD_L = '#f6d690', TERRA = '#c0603f', BRICK = '#b9573f', BRICK_D = '#94402f';
const LEAD = '#9aa1aa', LEAD_D = '#6f7682', COPPER = '#7fa596', OX = '#6b2730', NIGHT = '#2c3b4c';
const LAGOON = '#3f8585', LAGOON_D = '#1d4f58', LAGOON_L = '#86b5a6';

export const city = {
  id: 'venice', name: 'Venice', wall: '#40252a',
  alt: "Santa Maria della Salute, the Campanile and the Doge's Palace across the lagoon at a pink sunset, with gondolas, a sailing barge and striped mooring poles, framed by an ogee arch",
  google: 'family=Playfair+Display:ital,wght@0,400..700;1,400..700',
  fonts: [['italic 500 200px "Playfair Display"', 'Venezia'], ['500 40px "Playfair Display"', 'VENICE LA SERENISSIMA']],
  build,
};

// the picture: a window with an ogee head
const X0 = 84, X1 = W - 84, Y1 = 1916, SPRING = 640, APEX = 92, CX = W / 2;
const WL = 1180; // the waterline under the palaces
function archPath(c, inset = 0) {
  const x0 = X0 + inset, x1 = X1 - inset, sp = SPRING, ap = APEX + inset * 1.6;
  c.moveTo(x0, Y1 - inset);
  c.lineTo(x0, sp);
  c.bezierCurveTo(x0, sp - 290, CX - 62 + inset * 0.2, sp - 300, CX, ap);
  c.bezierCurveTo(CX + 62 - inset * 0.2, sp - 300, x1, sp - 290, x1, sp);
  c.lineTo(x1, Y1 - inset);
  c.closePath();
}
function archPts(inset = 0, n = 60) {
  const x0 = X0 + inset, x1 = X1 - inset, sp = SPRING, ap = APEX + inset * 1.6;
  const bez = (p0, p1, p2, p3, t) => (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3;
  const pts = [[x0, Y1 - inset], [x0, sp]];
  for (let i = 1; i <= n; i++) { const t = i / n; pts.push([bez(x0, x0, CX - 62 + inset * 0.2, CX, t), bez(sp, sp - 290, sp - 300, ap, t)]); }
  for (let i = 1; i <= n; i++) { const t = i / n; pts.push([bez(CX, CX + 62 - inset * 0.2, x1, x1, t), bez(ap, sp - 300, sp - 290, sp, t)]); }
  pts.push([x1, Y1 - inset], [x0, Y1 - inset]);
  return pts;
}

// what the water gives back: simple shapes, mirrored later
const REFL = [];

function build() {
  REFL.length = 0;
  const p = new Plate({ paper: '#f4e9d3', seed: 1172 });
  const r = p.r;
  p.clip = { x: X0, y: APEX, w: X1 - X0, h: Y1 - APEX };
  p.stack('sky', 'far', 'salute', 'city', 'doge', 'riva', 'water', 'refl', 'boats', 'poles', 'gondola', 'air', 'mask', 'title');
  p.layer('mask', { clip: false });
  p.layer('title', { clip: false });

  frame(p);
  sky(p, r);
  far(p, r);
  palazzo(p, r);
  salute(p, r);
  dogana(p, r);
  libreria(p, r);
  campanile(p, r);
  columns(p, r);
  domes(p, r);
  doge(p, r);
  riva(p, r);
  water(p, r);
  bragozzo(p, r);
  poles(p, r);
  gondola(p, r);
  life(p, r);
  title(p);
  return p;
}

// ---------------------------------------------------------------- helpers
// letters set one by one, each placed where the whole word puts it, so the
// font's kerning lands before each letter (o as for Plate.type)
let meas = null;
function setType(p, layer, str, x, y, o) {
  meas ??= (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  const font = `${o.style || 'normal'} ${o.weight || 400} ${o.size}px ${o.family}`;
  meas.font = font;
  const tr = (o.track || 0) * o.size;
  const wAt = (k) => meas.measureText(str.slice(0, k)).width + tr * k;
  const total = wAt(str.length) - tr;
  const x0 = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  let k = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === ' ') continue;
    const gw = meas.measureText(ch).width, gx = x0 + wAt(i + 1) - tr - gw;
    const t = (o.t || 0) + k++ * (o.gap ?? 0.09), sz = o.size;
    p.mark(layer, {
      t, d: o.d ?? 0.7, reveal: o.reveal || 'press', ease: 'out',
      box: { x: gx - sz * 0.3, y: y - sz * 1.05, w: gw + sz * 0.6, h: sz * 1.4 },
      draw: (c) => { c.font = font; c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillStyle = o.color; c.fillText(ch, gx, y); },
    });
  }
}
// a Venetian window head: straight sides, then an ogee to a point
function ogee(c, x, yb, w, h) {
  const sp = yb - h + w * 0.75;
  c.moveTo(x - w / 2, yb); c.lineTo(x - w / 2, sp);
  c.quadraticCurveTo(x - w / 2, sp - w * 0.42, x - w * 0.12, sp - w * 0.55);
  c.quadraticCurveTo(x, sp - w * 0.62, x, yb - h);
  c.quadraticCurveTo(x, sp - w * 0.62, x + w * 0.12, sp - w * 0.55);
  c.quadraticCurveTo(x + w / 2, sp - w * 0.42, x + w / 2, sp);
  c.lineTo(x + w / 2, yb); c.closePath();
}
function pointed(c, x, yb, w, h) {
  const sp = yb - h + w * 0.7;
  c.moveTo(x - w / 2, yb); c.lineTo(x - w / 2, sp);
  c.quadraticCurveTo(x - w / 2, yb - h + w * 0.1, x, yb - h);
  c.quadraticCurveTo(x + w / 2, yb - h + w * 0.1, x + w / 2, sp);
  c.lineTo(x + w / 2, yb); c.closePath();
}
function round(c, x, yb, w, h) {
  c.moveTo(x - w / 2, yb); c.lineTo(x - w / 2, yb - h + w / 2);
  c.arc(x, yb - h + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, yb); c.closePath();
}
// the warm light from the left: a glaze over a shape, gold to rose
function glaze(c, x0, x1, a = 0.28) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, `rgba(246,200,120,${a})`); g.addColorStop(1, `rgba(170,90,100,${a * 0.9})`);
  return g;
}
const line = (c, w = 1.1, col = SEPIA) => { c.strokeStyle = col; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; };

// ---------------------------------------------------------------- sky
function sky(p, r) {
  p.group('sky', { x: X0, y: APEX, w: X1 - X0, h: WL - APEX + 20 }, (c) => {
    const g = c.createLinearGradient(0, APEX, 0, WL);
    g.addColorStop(0, '#d59a93'); g.addColorStop(0.35, '#e9b096'); g.addColorStop(0.7, '#f3cb98'); g.addColorStop(1, '#f8e2a8');
    c.fillStyle = g; c.fillRect(X0, APEX, X1 - X0, WL - APEX + 20);
    // the sun's glow, low on the left
    const rg = c.createRadialGradient(560, 905, 10, 560, 905, 520);
    rg.addColorStop(0, 'rgba(255,246,214,.95)'); rg.addColorStop(0.18, 'rgba(255,232,170,.6)'); rg.addColorStop(1, 'rgba(255,220,160,0)');
    c.fillStyle = rg; c.fillRect(X0, APEX, X1 - X0, WL - APEX + 20);
  }, { t: 0.2, d: 1.6, reveal: 'fall', ease: 'inOut' });
  p.group('sky', { x: 480, y: 830, w: 160, h: 160 }, (c) => {
    c.fillStyle = 'rgba(255,249,228,.95)'; c.beginPath(); c.arc(560, 905, 58, 0, Math.PI * 2); c.fill();
  }, { t: 1.2, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // long thin clouds, lit underneath, with a hairline along their lower edge
  const clouds = [[140, 760, 560, 1], [900, 690, 520, -1], [300, 930, 420, 1], [1040, 880, 380, -1], [620, 600, 300, 1], [1120, 1010, 300, -1], [180, 1030, 260, 1]];
  clouds.forEach(([x, y, w, dir], i) => {
    const h = 10 + w * 0.025;
    const pts = [];
    for (let k = 0; k <= 30; k++) { const f = k / 30; pts.push([x + f * w, y - Math.sin(f * Math.PI) ** 0.7 * h * (0.7 + 0.3 * Math.sin(f * 9 + i))]); }
    for (let k = 30; k >= 0; k--) { const f = k / 30; pts.push([x + f * w + dir * 20 * f, y + Math.sin(f * Math.PI) * h * 0.25]); }
    p.group('sky', boxOf(pts, 6), (c) => {
      c.fillStyle = i % 2 ? 'rgba(242,190,165,.85)' : 'rgba(250,222,180,.9)'; poly(c, pts); c.fill();
      c.fillStyle = 'rgba(255,240,205,.8)';
      c.beginPath(); for (let k = 31; k < 62; k++) { const [px, py] = pts[k]; k === 31 ? c.moveTo(px, py - 2) : c.lineTo(px, py - 2); } c.lineTo(pts[61][0], pts[61][1] - 6); c.lineTo(pts[31][0], pts[31][1] - 6); c.fill();
      line(c, 0.9, 'rgba(91,58,46,.45)');
      c.beginPath(); for (let k = 31; k < 62; k++) { const [px, py] = pts[k]; k === 31 ? c.moveTo(px, py) : c.lineTo(px, py); } c.stroke();
    }, { t: 1.3 + i * 0.18, d: 1.2, reveal: dir > 0 ? 'wipe' : 'wipeL', ease: 'inOut' });
  });
}

// ---------------------------------------------------------------- the far shore
function far(p, r) {
  // the Giudecca and the Grand Canal's palaces, low and pale behind everything
  const blocks = [];
  for (let x = X0; x < X1;) { const w = r.range(16, 44); blocks.push([x, w, r.range(10, 34), r.chance(0.08)]); x += w; }
  p.group('far', { x: X0, y: WL - 110, w: X1 - X0, h: 120 }, (c) => {
    c.fillStyle = 'rgba(214,160,150,.55)';
    for (const [x, w, h, tower] of blocks) {
      c.fillRect(x, WL - 6 - h, w, h + 6);
      if (tower) { c.fillRect(x + w * 0.4, WL - h - 50, 7, 50); c.beginPath(); c.moveTo(x + w * 0.4 - 1, WL - h - 50); c.lineTo(x + w * 0.4 + 3.5, WL - h - 62); c.lineTo(x + w * 0.4 + 8, WL - h - 50); c.fill(); }
    }
    c.fillStyle = 'rgba(160,100,100,.35)';
    for (const [x, w, h] of blocks) for (let k = 4; k < w - 4; k += 7) c.fillRect(x + k, WL - h + 4, 2.5, 5);
  }, { t: 1.9, d: 1.2, reveal: 'fade' });
}

// ---------------------------------------------------------------- Santa Maria della Salute
function salute(p, r) {
  const k = 6.7, cx = 300, gy = WL + 2;
  const X = (x) => cx + x * k, Y = (y) => gy - y * k;
  // the domes: a tall drum, a lead dome with its ribs, a lantern, a statue
  const dome = (c, x, y0, w, h, lantW, lantH) => {
    c.beginPath(); c.moveTo(X(x - w), Y(y0));
    c.bezierCurveTo(X(x - w), Y(y0 + h * 0.75), X(x - w * 0.42), Y(y0 + h), X(x), Y(y0 + h));
    c.bezierCurveTo(X(x + w * 0.42), Y(y0 + h), X(x + w), Y(y0 + h * 0.75), X(x + w), Y(y0)); c.closePath();
    const g = c.createLinearGradient(X(x - w), 0, X(x + w), 0);
    g.addColorStop(0, '#c9c2bd'); g.addColorStop(0.45, LEAD); g.addColorStop(1, '#7c7487');
    c.fillStyle = g; c.fill(); line(c, 1.2); c.stroke();
    // ribs
    line(c, 0.8, 'rgba(62,38,34,.55)'); c.beginPath();
    for (let i = -3; i <= 3; i++) { const f = i / 3.4; c.moveTo(X(x + f * w), Y(y0)); c.quadraticCurveTo(X(x + f * w * 0.82), Y(y0 + h * 0.8), X(x), Y(y0 + h)); }
    c.stroke();
    // lantern
    const ly = y0 + h - 0.6;
    c.fillStyle = STONE; c.fillRect(X(x - lantW), Y(ly + lantH), lantW * 2 * k, lantH * k);
    line(c, 1); c.strokeRect(X(x - lantW), Y(ly + lantH), lantW * 2 * k, lantH * k);
    c.fillStyle = INK; for (const f of [-0.5, 0.1]) c.fillRect(X(x + f * lantW), Y(ly + lantH * 0.85), lantW * 0.4 * k, lantH * 0.55 * k);
    c.fillStyle = LEAD; c.beginPath(); c.arc(X(x), Y(ly + lantH), lantW * k * 1.05, Math.PI, 0); c.fill(); c.stroke();
    return ly + lantH + lantW;
  };
  const drum = (c, x, y0, y1, w, n) => {
    c.fillStyle = STONE; c.fillRect(X(x - w), Y(y1), 2 * w * k, (y1 - y0) * k);
    c.fillStyle = 'rgba(196,123,109,.35)'; c.fillRect(X(x + w * 0.3), Y(y1), w * 0.7 * k, (y1 - y0) * k);
    line(c, 1); c.strokeRect(X(x - w), Y(y1), 2 * w * k, (y1 - y0) * k);
    c.fillStyle = INK;
    for (let i = 0; i < n; i++) { const xx = x - w + (2 * w * (i + 0.5)) / n; c.beginPath(); round(c, X(xx), Y(y0 + (y1 - y0) * 0.22), (w / n) * 0.75 * k, (y1 - y0) * 0.55 * k); c.fill(); }
    line(c, 0.8); c.beginPath();
    for (let i = 0; i <= n; i++) { const xx = X(x - w + (2 * w * i) / n); c.moveTo(xx, Y(y0)); c.lineTo(xx, Y(y1)); }
    c.stroke();
    c.fillStyle = STONE; c.fillRect(X(x - w - 0.8), Y(y1 + 1), (2 * w + 1.6) * k, 1 * k); c.strokeRect(X(x - w - 0.8), Y(y1 + 1), (2 * w + 1.6) * k, 1 * k);
  };
  REFL.push({ pts: [[X(-34), gy], [X(-34), Y(22)], [X(-14), Y(32)], [X(-12), Y(66)], [X(12), Y(66)], [X(14), Y(32)], [X(40), Y(30)], [X(40), gy]], color: '#d9b49e' });
  // the octagon and the chapels around it
  p.group('salute', { x: X(-36), y: Y(80), w: 80 * k, h: 82 * k }, (c) => {
    // the second dome and its two bell towers, behind, on their own block
    c.fillStyle = STONE_S; c.fillRect(X(20), Y(28), 22 * k, 28 * k);
    c.fillStyle = 'rgba(196,123,109,.3)'; c.fillRect(X(31), Y(28), 11 * k, 28 * k);
    line(c, 1); c.strokeRect(X(20), Y(28), 22 * k, 28 * k);
    c.fillStyle = INK; for (const bx of [27, 35]) { c.beginPath(); round(c, X(bx), Y(6), 2.4 * k, 9 * k); c.fill(); }
    c.fillStyle = STONE; c.fillRect(X(19.5), Y(28.8), 23 * k, 1.2 * k);
    for (const bx of [24, 38]) {
      c.fillStyle = STONE; c.fillRect(X(bx - 2), Y(46), 4 * k, 46 * k);
      c.fillStyle = 'rgba(196,123,109,.3)'; c.fillRect(X(bx), Y(46), 2 * k, 46 * k);
      line(c, 0.9); c.strokeRect(X(bx - 2), Y(46), 4 * k, 46 * k);
      c.fillStyle = INK; c.fillRect(X(bx - 1), Y(44), 2 * k, 4 * k);
      c.fillStyle = LEAD; c.beginPath(); c.moveTo(X(bx - 2.4), Y(46)); c.quadraticCurveTo(X(bx - 2.2), Y(50), X(bx), Y(53)); c.quadraticCurveTo(X(bx + 2.2), Y(50), X(bx + 2.4), Y(46)); c.fill(); c.stroke();
    }
    drum(c, 31, 28, 35, 7, 5);
    dome(c, 31, 35, 7.4, 9, 1.6, 3.2);
    // the octagon's walls, three faces seen
    c.fillStyle = STONE; poly(c, [[X(-22), gy], [X(-22), Y(30)], [X(22), Y(30)], [X(22), gy]]); c.fill();
    c.fillStyle = glaze(c, X(-22), X(22), 0.3); poly(c, [[X(-22), gy], [X(-22), Y(30)], [X(22), Y(30)], [X(22), gy]]); c.fill();
    c.fillStyle = 'rgba(196,123,109,.35)'; c.fillRect(X(10), Y(30), 12 * k, 30 * k);
    line(c, 1.2); c.strokeRect(X(-22), Y(30), 44 * k, 30 * k);
    line(c, 0.9); c.beginPath(); c.moveTo(X(-10), Y(30)); c.lineTo(X(-10), gy); c.moveTo(X(10), Y(30)); c.lineTo(X(10), gy); c.stroke();
    // side chapels with pediments and thermal windows
    for (const sx of [-16, 16]) {
      c.fillStyle = STONE; c.fillRect(X(sx - 5.5), Y(20), 11 * k, 20 * k);
      c.fillStyle = sx > 0 ? 'rgba(196,123,109,.35)' : 'rgba(246,200,120,.18)'; c.fillRect(X(sx - 5.5), Y(20), 11 * k, 20 * k);
      line(c, 1); c.strokeRect(X(sx - 5.5), Y(20), 11 * k, 20 * k);
      c.fillStyle = STONE; poly(c, [[X(sx - 6.2), Y(20)], [X(sx + 6.2), Y(20)], [X(sx), Y(24.5)]]); c.fill(); c.stroke();
      c.fillStyle = INK; c.beginPath(); c.arc(X(sx), Y(15), 3 * k, Math.PI, 0); c.fill();
      c.fillRect(X(sx - 1.4), Y(9), 2.8 * k, 7 * k);
      for (const dx of [-4, 4]) { c.fillStyle = STONE; c.fillRect(X(sx + dx - 0.5), Y(19), 1 * k, 19 * k); line(c, 0.6); c.strokeRect(X(sx + dx - 0.5), Y(19), 1 * k, 19 * k); }
      c.fillStyle = STONE; c.fillRect(X(sx - 0.6), Y(27), 1.2 * k, 2.5 * k);
    }
    // the main front: a triumphal arch, paired columns, a pediment, statues
    c.fillStyle = CREAM; c.fillRect(X(-8.5), Y(28), 17 * k, 28 * k);
    c.fillStyle = 'rgba(246,200,120,.2)'; c.fillRect(X(-8.5), Y(28), 9 * k, 28 * k);
    line(c, 1.2); c.strokeRect(X(-8.5), Y(28), 17 * k, 28 * k);
    c.fillStyle = NIGHT; c.beginPath(); round(c, X(0), gy, 7 * k, 18 * k); c.fill();
    c.fillStyle = '#5a6a76'; c.beginPath(); round(c, X(0), gy, 4.6 * k, 14 * k); c.fill();
    for (const dx of [-7, -5.2, 5.2, 7]) { c.fillStyle = CREAM; c.fillRect(X(dx - 0.5), Y(24), 1 * k, 24 * k); line(c, 0.7); c.strokeRect(X(dx - 0.5), Y(24), 1 * k, 24 * k); }
    c.fillStyle = CREAM; poly(c, [[X(-9.5), Y(28)], [X(9.5), Y(28)], [X(0), Y(33)]]); c.fill(); line(c, 1); c.stroke();
    for (const dx of [-8.5, 0, 8.5]) { c.fillStyle = CREAM; const y = dx ? 28 : 33; c.fillRect(X(dx - 0.5), Y(y + 3), 1 * k, 3 * k); c.beginPath(); c.arc(X(dx), Y(y + 3.4), 0.6 * k, 0, Math.PI * 2); c.fill(); }
    // the steps down to the water
    for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? STONE : STONE_S; c.fillRect(X(-12 + i), gy - (i + 1) * 3, (24 - 2 * i) * k, 3); }
  }, { t: 2.7, d: 1.4, reveal: 'rise', ease: 'inOut' });
  // the great drum and its volutes, then the dome
  p.group('salute', { x: X(-26), y: Y(86), w: 52 * k, h: 58 * k }, (c) => {
    // the scrolls that buttress the drum: big spirals with statues on top
    for (const sx of [-1, 1]) for (const [dx, sc] of [[16.5, 1.15], [10.5, 0.9]]) {
      const bx = X(sx * dx), by = Y(30), R = 3.4 * k * sc;
      c.fillStyle = STONE;
      c.beginPath(); c.moveTo(bx - sx * R * 1.1, by); c.lineTo(bx - sx * R * 1.1, by - R * 2.3);
      c.quadraticCurveTo(bx + sx * R * 0.2, by - R * 2.9, bx + sx * R * 1.1, by - R * 1.2); c.lineTo(bx + sx * R * 1.1, by); c.closePath(); c.fill();
      line(c, 1); c.stroke();
      c.beginPath(); for (let a = 0; a < Math.PI * 3.2; a += 0.2) { const rr = R * (1 - a / (Math.PI * 3.6)); const xx = bx + sx * R * 0.35 + Math.cos(a * sx) * rr * 0.8, yy = by - R * 0.85 + Math.sin(a) * rr * 0.8; a ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
      c.fillStyle = CREAM; c.fillRect(bx - sx * R * 0.6 - 2, by - R * 2.9 - 9, 4, 9); c.beginPath(); c.arc(bx - sx * R * 0.6, by - R * 2.9 - 11, 2.4, 0, Math.PI * 2); c.fill();
    }
    drum(c, 0, 30, 47, 12, 8);
    const top = dome(c, 0, 47, 13.4, 20, 2.6, 5.6);
    // the statue of the Virgin on the top
    c.fillStyle = CREAM; c.fillRect(X(-0.5), Y(top + 3.4), 1 * k, 3.4 * k); c.beginPath(); c.arc(X(0), Y(top + 3.8), 0.6 * k, 0, Math.PI * 2); c.fill();
    line(c, 0.6); c.strokeRect(X(-0.5), Y(top + 3.4), 1 * k, 3.4 * k);
  }, { t: 3.4, d: 1.5, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- the Dogana
function dogana(p, r) {
  const x0 = 590, x1 = 742, gy = WL + 2, h = 68;
  REFL.push({ pts: [[x0, gy], [x0, gy - h], [x1, gy - h], [x1, gy]], color: '#e5c9ad' });
  p.group('city', { x: x0 - 4, y: gy - 230, w: x1 - x0 + 30, h: 232 }, (c) => {
    c.fillStyle = STONE; c.fillRect(x0, gy - h, x1 - x0, h);
    c.fillStyle = glaze(c, x0, x1); c.fillRect(x0, gy - h, x1 - x0, h);
    // rusticated arches along the water
    c.fillStyle = NIGHT; for (let x = x0 + 10; x < x1 - 30; x += 22) { c.beginPath(); round(c, x + 7, gy, 13, 30); c.fill(); }
    line(c, 0.6, 'rgba(91,58,46,.5)'); c.beginPath(); for (let y = gy - 4; y > gy - h + 18; y -= 6) { c.moveTo(x0, y); c.lineTo(x1, y); } c.stroke();
    c.fillStyle = INK; for (let x = x0 + 12; x < x1 - 30; x += 22) c.fillRect(x + 3, gy - 56, 7, 10);
    line(c, 1.1); c.strokeRect(x0, gy - h, x1 - x0, h);
    c.fillStyle = TERRA; c.fillRect(x0 - 2, gy - h - 6, x1 - x0 + 4, 6); c.strokeRect(x0 - 2, gy - h - 6, x1 - x0 + 4, 6);
    // the tower at the point, two figures holding the golden ball, Fortune on top
    const tx = x1 - 16;
    c.fillStyle = CREAM; c.fillRect(tx - 18, gy - h - 60, 36, 60);
    c.fillStyle = 'rgba(196,123,109,.35)'; c.fillRect(tx + 4, gy - h - 60, 14, 60);
    line(c, 1.1); c.strokeRect(tx - 18, gy - h - 60, 36, 60);
    c.fillStyle = INK; c.beginPath(); round(c, tx, gy - h - 8, 12, 30); c.fill();
    c.fillStyle = CREAM; c.fillRect(tx - 21, gy - h - 66, 42, 6); c.strokeRect(tx - 21, gy - h - 66, 42, 6);
    c.fillStyle = INK; c.fillRect(tx - 12, gy - h - 82, 5, 16); c.fillRect(tx + 7, gy - h - 82, 5, 16);
    c.fillStyle = GOLD; c.beginPath(); c.arc(tx, gy - h - 92, 14, 0, Math.PI * 2); c.fill(); line(c, 1); c.stroke();
    c.fillStyle = GOLD_L; c.beginPath(); c.arc(tx - 4, gy - h - 96, 5, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD; c.fillRect(tx - 1.5, gy - h - 122, 3, 16);
    poly(c, [[tx - 1, gy - h - 120], [tx + 16, gy - h - 128], [tx + 15, gy - h - 114]]); c.fill(); line(c, 0.7); c.stroke();
  }, { t: 3.8, d: 1.2, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- the Library
function libreria(p, r) {
  const x0 = 770, x1 = 990, gy = WL + 2, h = 132;
  REFL.push({ pts: [[x0, gy], [x0, gy - h], [x1, gy - h], [x1, gy]], color: '#eddcc0' });
  p.group('city', { x: x0 - 6, y: gy - h - 40, w: x1 - x0 + 12, h: h + 42 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(x0, gy - h, x1 - x0, h);
    c.fillStyle = glaze(c, x0, x1, 0.22); c.fillRect(x0, gy - h, x1 - x0, h);
    const n = 9, bw = (x1 - x0) / n;
    // the two orders of arches
    for (let i = 0; i < n; i++) {
      const x = x0 + bw * (i + 0.5);
      c.fillStyle = NIGHT; c.beginPath(); round(c, x, gy, bw * 0.58, 50); c.fill();
      c.fillStyle = '#7c5a5a'; c.beginPath(); round(c, x, gy - 62, bw * 0.5, 42); c.fill();
      c.fillStyle = CREAM; c.fillRect(x - bw * 0.5, gy - 54, 4, 54); c.fillRect(x - bw * 0.5, gy - 112, 4, 50);
      c.fillStyle = 'rgba(255,235,190,.5)'; c.beginPath(); c.arc(x, gy - 104, 3, 0, Math.PI * 2); c.fill();
    }
    line(c, 0.8); c.beginPath();
    for (let i = 0; i <= n; i++) { const x = x0 + bw * i; c.moveTo(x, gy); c.lineTo(x, gy - 54); c.moveTo(x, gy - 62); c.lineTo(x, gy - 112); }
    c.moveTo(x0, gy - 56); c.lineTo(x1, gy - 56); c.moveTo(x0, gy - 60); c.lineTo(x1, gy - 60);
    c.stroke();
    // the frieze with its garlands
    c.fillStyle = STONE_S; c.fillRect(x0, gy - h, x1 - x0, 14);
    line(c, 0.7); c.beginPath();
    for (let x = x0; x < x1; x += 11) { c.moveTo(x, gy - h + 4); c.quadraticCurveTo(x + 5.5, gy - h + 12, x + 11, gy - h + 4); }
    c.stroke();
    line(c, 1.1); c.strokeRect(x0, gy - h, x1 - x0, h);
    // the balustrade, its statues and obelisks against the sky
    c.fillStyle = CREAM; c.fillRect(x0, gy - h - 8, x1 - x0, 8); line(c, 0.8); c.strokeRect(x0, gy - h - 8, x1 - x0, 8);
    c.beginPath(); for (let x = x0 + 3; x < x1; x += 4) { c.moveTo(x, gy - h - 1); c.lineTo(x, gy - h - 7); } c.stroke();
    for (let i = 0; i <= n; i++) {
      const x = x0 + bw * i;
      c.fillStyle = CREAM;
      if (i === 0 || i === n) { poly(c, [[x - 3, gy - h - 8], [x + 3, gy - h - 8], [x, gy - h - 34]]); c.fill(); line(c, 0.7); c.stroke(); continue; }
      c.fillRect(x - 2, gy - h - 22, 4, 14); c.beginPath(); c.arc(x, gy - h - 25, 2.6, 0, Math.PI * 2); c.fill();
      line(c, 0.6); c.strokeRect(x - 2, gy - h - 22, 4, 14);
    }
  }, { t: 4.3, d: 1.1, reveal: 'wipe', ease: 'inOut' });
}

// ---------------------------------------------------------------- the Campanile
function campanile(p, r) {
  const cx = 1012, gy = WL - 8, k = 6.1;
  const X = (x) => cx + x * k, Y = (y) => gy - y * k;
  const hw = 6.4;
  REFL.push({ pts: [[X(-hw), gy], [X(-hw), Y(61)], [X(-5), Y(70)], [X(0), Y(96)], [X(5), Y(70)], [X(hw), Y(61)], [X(hw), gy]], color: '#c86a50' });
  p.group('city', { x: X(-hw - 2), y: Y(100), w: (hw + 2) * 2 * k, h: 101 * k }, (c) => {
    // the brick shaft with its long arched strips
    c.fillStyle = BRICK; c.fillRect(X(-hw), Y(50), 2 * hw * k, 50 * k);
    c.fillStyle = 'rgba(246,200,120,.22)'; c.fillRect(X(-hw), Y(50), hw * k, 50 * k);
    c.fillStyle = BRICK_D;
    for (let i = 0; i < 5; i++) {
      const x = X(-hw + 0.9 + i * 2.35);
      c.beginPath(); round(c, x + 0.8 * k, Y(4), 1.5 * k, 45 * k); c.fill();
    }
    c.fillStyle = 'rgba(80,25,20,.25)'; c.fillRect(X(1.5), Y(50), (hw - 1.5) * k, 50 * k);
    line(c, 0.5, 'rgba(62,38,34,.35)'); c.beginPath(); for (let y = 2; y < 50; y += 1.1) { c.moveTo(X(-hw), Y(y)); c.lineTo(X(hw), Y(y)); } c.stroke();
    line(c, 1.2); c.strokeRect(X(-hw), Y(50), 2 * hw * k, 50 * k);
    // the belfry: white stone, four arches each side
    c.fillStyle = STONE; c.fillRect(X(-hw - 0.4), Y(61), (2 * hw + 0.8) * k, 11 * k);
    c.fillStyle = INK; for (let i = 0; i < 4; i++) { c.beginPath(); round(c, X(-hw + 1.6 + i * 3.2), Y(51.2), 2 * k, 8.4 * k); c.fill(); }
    c.fillStyle = GOLD; c.fillRect(X(-0.6), Y(58), 1.2 * k, 3 * k);
    line(c, 1); c.strokeRect(X(-hw - 0.4), Y(61), (2 * hw + 0.8) * k, 11 * k);
    c.fillStyle = STONE_S; c.fillRect(X(-hw - 0.8), Y(51.2), (2 * hw + 1.6) * k, 1.2 * k); c.fillRect(X(-hw - 0.8), Y(62), (2 * hw + 1.6) * k, 1 * k);
    // the attic with the lion, and the spire in green copper
    c.fillStyle = BRICK; c.fillRect(X(-hw + 0.3), Y(70), (2 * hw - 0.6) * k, 8 * k);
    c.fillStyle = 'rgba(80,25,20,.25)'; c.fillRect(X(1.5), Y(70), (hw - 1.8) * k, 8 * k);
    c.fillStyle = GOLD; c.beginPath(); c.ellipse(X(-1), Y(66), 2.2 * k, 1.4 * k, 0, 0, Math.PI * 2); c.fill();
    line(c, 1); c.strokeRect(X(-hw + 0.3), Y(70), (2 * hw - 0.6) * k, 8 * k);
    c.fillStyle = STONE; c.fillRect(X(-hw), Y(71), 2 * hw * k, 1 * k);
    c.fillStyle = COPPER; poly(c, [[X(-hw + 0.4), Y(71)], [X(hw - 0.4), Y(71)], [X(0), Y(95)]]); c.fill();
    c.fillStyle = '#5f8576'; poly(c, [[X(0), Y(71)], [X(hw - 0.4), Y(71)], [X(0), Y(95)]]); c.fill();
    line(c, 1.1); poly(c, [[X(-hw + 0.4), Y(71)], [X(hw - 0.4), Y(71)], [X(0), Y(95)]]); c.stroke();
    line(c, 0.6, 'rgba(62,38,34,.4)'); c.beginPath(); for (let i = 1; i < 7; i++) { const y = 71 + i * 3.4, w = (hw - 0.4) * (1 - i * 3.4 / 24); c.moveTo(X(-w), Y(y)); c.lineTo(X(w), Y(y)); } c.stroke();
  }, { t: 4.6, d: 1.8, reveal: 'rise', ease: 'inOut' });
  // the golden angel turning on the top
  p.group('city', { x: X(-3), y: Y(101), w: 6 * k, h: 7 * k }, (c) => {
    c.fillStyle = GOLD; c.fillRect(X(-0.25), Y(97.5), 0.5 * k, 2.5 * k);
    c.beginPath(); c.arc(X(0), Y(98.6), 0.5 * k, 0, Math.PI * 2); c.fill();
    poly(c, [[X(0), Y(97.8)], [X(2.4), Y(99.6)], [X(1.8), Y(97.2)]]); c.fill();
    line(c, 0.6); c.beginPath(); c.moveTo(X(0), Y(95)); c.lineTo(X(0), Y(97.5)); c.stroke();
  }, { t: 6.4, d: 0.6, reveal: 'pop' });
  // the Loggetta at its foot: three arches in marble
  p.group('city', { x: X(-8), y: Y(10), w: 16 * k, h: 12 * k }, (c) => {
    c.fillStyle = CREAM; c.fillRect(X(-7), Y(8), 14 * k, 8 * k + 8);
    c.fillStyle = ROSE; c.fillRect(X(-7), Y(9.4), 14 * k, 1.4 * k);
    c.fillStyle = INK; for (const dx of [-4.2, 0, 4.2]) { c.beginPath(); round(c, X(dx), gy + 8, 2.4 * k, 5.6 * k); c.fill(); }
    line(c, 0.9); c.strokeRect(X(-7), Y(9.4), 14 * k, 9.4 * k + 8);
    c.fillStyle = CREAM; c.fillRect(X(-7.4), Y(10.4), 14.8 * k, 1 * k);
  }, { t: 5.6, d: 0.8, reveal: 'rise' });
}

// ---------------------------------------------------------------- the two columns
function columns(p, r) {
  const gy = WL + 2;
  for (const [x, t, lion] of [[1050, 5.4, true], [1112, 5.6, false]]) {
    const h = 122;
    REFL.push({ pts: [[x - 4, gy], [x - 4, gy - h], [x + 4, gy - h], [x + 4, gy]], color: '#b99b96' });
    p.group('city', { x: x - 30, y: gy - h - 40, w: 60, h: h + 42 }, (c) => {
      c.fillStyle = '#c5aaa3'; c.fillRect(x - 4, gy - h, 8, h);
      c.fillStyle = 'rgba(80,40,50,.22)'; c.fillRect(x + 1, gy - h, 3, h);
      line(c, 0.9); c.strokeRect(x - 4, gy - h, 8, h);
      c.fillStyle = STONE; c.fillRect(x - 9, gy - 10, 18, 10); c.fillRect(x - 7, gy - h - 7, 14, 7); c.strokeRect(x - 9, gy - 10, 18, 10); c.strokeRect(x - 7, gy - h - 7, 14, 7);
      if (lion) {
        // the winged lion, in bronze gilt
        c.fillStyle = GOLD;
        poly(c, [[x - 12, gy - h - 7], [x + 12, gy - h - 7], [x + 12, gy - h - 16], [x + 7, gy - h - 22], [x + 3, gy - h - 16], [x - 10, gy - h - 16], [x - 14, gy - h - 12]]); c.fill();
        poly(c, [[x - 4, gy - h - 16], [x - 10, gy - h - 32], [x + 2, gy - h - 19]]); c.fill();
        line(c, 0.7); poly(c, [[x - 12, gy - h - 7], [x + 12, gy - h - 7], [x + 12, gy - h - 16], [x + 7, gy - h - 22], [x + 3, gy - h - 16], [x - 10, gy - h - 16], [x - 14, gy - h - 12]]); c.stroke();
      } else {
        // the saint with his spear, standing on the crocodile
        c.fillStyle = CREAM; c.fillRect(x - 3, gy - h - 26, 6, 19); c.beginPath(); c.arc(x, gy - h - 29, 3, 0, Math.PI * 2); c.fill();
        line(c, 0.7); c.strokeRect(x - 3, gy - h - 26, 6, 19);
        c.beginPath(); c.moveTo(x + 6, gy - h - 7); c.lineTo(x + 6, gy - h - 38); c.stroke();
        c.fillStyle = '#9c8a72'; c.fillRect(x - 10, gy - h - 10, 20, 3);
      }
    }, { t, d: 1.0, reveal: 'rise' });
  }
}

// ---------------------------------------------------------------- the basilica's domes, behind the palace
function domes(p, r) {
  const gy = WL - 178;
  const list = [[1232, 36, 66], [1352, 42, 82], [1470, 34, 62]];
  for (const [x, w, h] of list) REFL.push({ pts: [[x - w, gy], [x - w, gy - h * 0.5], [x, gy - h], [x + w, gy - h * 0.5], [x + w, gy]], color: '#a8a3ab' });
  p.group('doge', { x: 1180, y: gy - 130, w: 360, h: 140 }, (c) => {
    for (const [x, w, h] of list) {
      c.fillStyle = STONE_S; c.fillRect(x - w * 0.8, gy - h * 0.35, w * 1.6, h * 0.35 + 6);
      line(c, 0.8); c.strokeRect(x - w * 0.8, gy - h * 0.35, w * 1.6, h * 0.35 + 6);
      c.beginPath(); c.moveTo(x - w * 0.9, gy - h * 0.35);
      c.bezierCurveTo(x - w * 0.95, gy - h * 0.8, x - w * 0.4, gy - h * 0.95, x, gy - h * 0.95);
      c.bezierCurveTo(x + w * 0.4, gy - h * 0.95, x + w * 0.95, gy - h * 0.8, x + w * 0.9, gy - h * 0.35); c.closePath();
      const g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, '#cbc3c0'); g.addColorStop(1, '#7d7688');
      c.fillStyle = g; c.fill(); line(c, 1); c.stroke();
      // the onion lantern and its cross
      c.fillStyle = LEAD; c.beginPath(); c.moveTo(x - 5, gy - h * 0.94); c.quadraticCurveTo(x - 9, gy - h * 1.05, x, gy - h * 1.15); c.quadraticCurveTo(x + 9, gy - h * 1.05, x + 5, gy - h * 0.94); c.fill(); c.stroke();
      c.fillStyle = GOLD; c.fillRect(x - 0.8, gy - h * 1.15 - 12, 1.6, 12); c.fillRect(x - 4, gy - h * 1.15 - 9, 8, 1.6);
    }
  }, { t: 6.2, d: 1.1, reveal: 'rise' });
}

// ---------------------------------------------------------------- the Doge's Palace
function doge(p, r) {
  const x0 = 1146, x1 = 1146 + 71 * 7, gy = WL + 2, k = 7;
  const Y = (m) => gy - m * k;
  const top = Y(25);
  REFL.push({ pts: [[x0, gy], [x0, top - 10], [x1, top - 10], [x1, gy]], color: '#ecc0ad' });
  // the great wall: pink and white stone in a lozenge pattern
  p.group('doge', { x: x0 - 4, y: top - 30, w: x1 - x0 + 8, h: gy - top + 32 }, (c) => {
    c.fillStyle = '#f2d3c0'; c.fillRect(x0, top, x1 - x0, Y(15) - top);
    c.save(); c.beginPath(); c.rect(x0, top, x1 - x0, Y(15) - top); c.clip();
    const dw = 15, dh = 9.5;
    c.fillStyle = ROSE;
    for (let y = top; y < Y(15) + dh; y += dh) {
      for (let x = x0 - dw; x < x1 + dw; x += dw) {
        const ox = (Math.round((y - top) / dh) % 2) * dw / 2;
        poly(c, [[x + ox, y - dh * 0.36], [x + ox + dw * 0.36, y], [x + ox, y + dh * 0.36], [x + ox - dw * 0.36, y]]); c.fill();
      }
    }
    c.fillStyle = glaze(c, x0, x1, 0.3); c.fillRect(x0, top, x1 - x0, Y(15) - top);
    c.restore();
    // the tall pointed windows, two set lower, and the round ones above
    const wins = [[0.1, 0], [0.22, 0], [0.34, -2], [0.66, -2], [0.78, 0], [0.9, 0]];
    for (const [f, dz] of wins) {
      const x = lerp(x0, x1, f);
      c.fillStyle = STONE; c.beginPath(); pointed(c, x, Y(16.4 + dz), 25, 66); c.fill();
      c.fillStyle = NIGHT; c.beginPath(); pointed(c, x, Y(16.8 + dz), 17, 59); c.fill();
      line(c, 0.8); c.beginPath(); pointed(c, x, Y(16.4 + dz), 25, 66); c.stroke();
      line(c, 0.7, 'rgba(241,223,194,.7)'); c.beginPath(); c.moveTo(x, Y(16.8 + dz)); c.lineTo(x, Y(16.8 + dz) - 40); c.stroke();
      c.fillStyle = STONE; c.fillRect(x - 13, Y(16.4 + dz), 26, 4); line(c, 0.7); c.strokeRect(x - 13, Y(16.4 + dz), 26, 4);
    }
    for (const f of [0.22, 0.78]) { const x = lerp(x0, x1, f); c.fillStyle = STONE; c.beginPath(); c.arc(x, Y(23.6), 6, 0, Math.PI * 2); c.fill(); c.fillStyle = NIGHT; c.beginPath(); c.arc(x, Y(23.6), 4, 0, Math.PI * 2); c.fill(); }
    // the great balcony window in the middle, under its spire of carving
    const mx = (x0 + x1) / 2;
    c.fillStyle = CREAM; c.fillRect(mx - 26, Y(25.6), 52, Y(14.6) - Y(25.6));
    c.fillStyle = NIGHT; c.beginPath(); pointed(c, mx, Y(16), 26, 62); c.fill();
    line(c, 0.9); c.strokeRect(mx - 26, Y(25.6), 52, Y(14.6) - Y(25.6));
    c.fillStyle = CREAM; poly(c, [[mx - 22, Y(25.6)], [mx + 22, Y(25.6)], [mx, Y(31)]]); c.fill(); line(c, 0.9); c.stroke();
    c.fillStyle = CREAM; c.fillRect(mx - 2.5, Y(33.5), 5, 14); c.beginPath(); c.arc(mx, Y(34), 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = STONE; c.fillRect(mx - 30, Y(16), 60, 6); line(c, 0.8); c.strokeRect(mx - 30, Y(16), 60, 6);
    c.beginPath(); for (let x = mx - 28; x < mx + 30; x += 4) { c.moveTo(x, Y(16)); c.lineTo(x, Y(16) + 6); } c.stroke();
    line(c, 1.2); c.strokeRect(x0, top, x1 - x0, gy - top);
  }, { t: 5.7, d: 1.4, reveal: 'wipe', ease: 'inOut' });
  // the open loggia: twice the arches of the arcade below, with quatrefoils
  p.group('doge', { x: x0, y: Y(15.4), w: x1 - x0, h: Y(7.2) - Y(15.4) + 2 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(x0, Y(15), x1 - x0, Y(7.6) - Y(15));
    const n = 34, bw = (x1 - x0) / n;
    c.fillStyle = '#5c4446';
    for (let i = 0; i < n; i++) { const x = x0 + bw * (i + 0.5); c.beginPath(); ogee(c, x, Y(7.8), bw * 0.66, 30); c.fill(); }
    // the band of rings above them
    for (let i = 0; i < n; i++) {
      const x = x0 + bw * (i + 1);
      if (i === n - 1) break;
      c.fillStyle = '#5c4446'; c.beginPath(); c.arc(x, Y(13.2), bw * 0.34, 0, Math.PI * 2); c.fill();
      c.fillStyle = CREAM;
      for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2 + Math.PI / 4; c.beginPath(); c.arc(x + Math.cos(a) * bw * 0.16, Y(13.2) + Math.sin(a) * bw * 0.16, bw * 0.08, 0, Math.PI * 2); c.fill(); }
    }
    c.fillStyle = 'rgba(246,200,120,.2)'; c.fillRect(x0, Y(15), (x1 - x0) * 0.5, Y(7.6) - Y(15));
    c.fillStyle = STONE; c.fillRect(x0, Y(8.1), x1 - x0, 4);
    line(c, 0.6, 'rgba(62,38,34,.6)'); c.beginPath(); for (let x = x0 + 2; x < x1; x += 3.4) { c.moveTo(x, Y(7.6) - 1); c.lineTo(x, Y(8.1)); } c.stroke();
    line(c, 1); c.beginPath(); c.moveTo(x0, Y(15)); c.lineTo(x1, Y(15)); c.moveTo(x0, Y(7.6)); c.lineTo(x1, Y(7.6)); c.stroke();
  }, { t: 6.5, d: 1.2, reveal: 'wipe' });
  // the arcade at the foot: seventeen pointed arches on short columns
  p.group('doge', { x: x0, y: Y(7.8), w: x1 - x0, h: gy - Y(7.8) + 2 }, (c) => {
    c.fillStyle = STONE; c.fillRect(x0, Y(7.6), x1 - x0, gy - Y(7.6));
    const n = 17, bw = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const x = x0 + bw * (i + 0.5);
      c.fillStyle = '#4a3638'; c.beginPath(); pointed(c, x, gy, bw * 0.72, 7 * k); c.fill();
      c.fillStyle = 'rgba(240,200,150,.25)'; c.beginPath(); pointed(c, x - bw * 0.12, gy, bw * 0.3, 6.2 * k); c.fill();
      line(c, 0.8); c.beginPath(); pointed(c, x, gy, bw * 0.72, 7 * k); c.stroke();
    }
    c.fillStyle = 'rgba(246,200,120,.18)'; c.fillRect(x0, Y(7.6), (x1 - x0) * 0.5, gy - Y(7.6));
  }, { t: 6.9, d: 1.1, reveal: 'wipe' });
  // the cresting along the top and the pinnacle at the corner
  p.group('doge', { x: x0 - 10, y: top - 34, w: x1 - x0 + 20, h: 36 }, (c) => {
    c.fillStyle = '#7d7688'; c.fillRect(x0 + 4, top - 18, x1 - x0 - 8, 18);
    c.fillStyle = CREAM;
    for (let x = x0 + 3; x < x1; x += 9) {
      poly(c, [[x - 3.4, top], [x + 3.4, top], [x + 3.4, top - 6], [x + 1.2, top - 9], [x + 2.6, top - 12], [x, top - 17], [x - 2.6, top - 12], [x - 1.2, top - 9], [x - 3.4, top - 6]]); c.fill();
    }
    line(c, 0.5, 'rgba(62,38,34,.6)');
    for (let x = x0 + 3; x < x1; x += 9) { c.beginPath(); c.moveTo(x - 3.4, top - 6); c.lineTo(x + 3.4, top - 6); c.stroke(); }
    for (const x of [x0 + 2, x1 - 2]) {
      c.fillStyle = CREAM; c.fillRect(x - 4, top - 22, 8, 22); line(c, 0.8); c.strokeRect(x - 4, top - 22, 8, 22);
      poly(c, [[x - 5, top - 22], [x + 5, top - 22], [x, top - 34]]); c.fill(); c.stroke();
    }
  }, { t: 7.3, d: 0.8, reveal: 'drop', dy: 16 });
}

// ---------------------------------------------------------------- Palazzo Dandolo and the Riva
function palazzo(p, r) {
  // beside the Salute, a pink palazzo with Gothic windows, cut by the frame
  const gy = WL + 2, x0 = X0 - 10, x1 = 168, h = 168;
  REFL.push({ pts: [[x0, gy], [x0, gy - h], [x1, gy - h], [x1, gy]], color: ROSE });
  p.group('salute', { x: x0 - 2, y: gy - h - 14, w: x1 - x0 + 4, h: h + 16 }, (c) => {
    c.fillStyle = '#e8998a'; c.fillRect(x0, gy - h, x1 - x0, h);
    c.fillStyle = 'rgba(246,200,120,.25)'; c.fillRect(x0, gy - h, (x1 - x0) * 0.5, h);
    c.fillStyle = STONE; c.fillRect(x0, gy - 30, x1 - x0, 30);
    c.fillStyle = NIGHT; c.beginPath(); round(c, x1 - 34, gy, 20, 26); c.fill();
    // a five-light window on the main floor, pairs above and below
    const floors = [[gy - 48, 30, 2], [gy - 100, 40, 5], [gy - 146, 28, 2]];
    for (const [yb, wh, n] of floors) {
      const xs = n === 5 ? [0, 1, 2, 3, 4].map((i) => x1 - 112 + i * 15) : [x1 - 96, x1 - 30];
      for (const x of xs) {
        c.fillStyle = STONE; c.beginPath(); ogee(c, x, yb, 12, wh); c.fill();
        c.fillStyle = NIGHT; c.beginPath(); ogee(c, x, yb - 1, 8, wh - 4); c.fill();
      }
      c.fillStyle = STONE; c.fillRect(xs[0] - 10, yb, xs[xs.length - 1] - xs[0] + 20, 4);
      line(c, 0.6); c.strokeRect(xs[0] - 10, yb, xs[xs.length - 1] - xs[0] + 20, 4);
      if (n === 5) { c.beginPath(); for (let x = xs[0] - 8; x < xs[4] + 10; x += 4) { c.moveTo(x, yb + 4); c.lineTo(x, yb + 12); } c.stroke(); c.strokeRect(xs[0] - 10, yb + 12, 80, 3); }
    }
    line(c, 1.1); c.strokeRect(x0, gy - h, x1 - x0, h);
    c.fillStyle = CREAM;
    for (let x = x0 + 4; x < x1; x += 10) { poly(c, [[x - 3, gy - h], [x + 3, gy - h], [x, gy - h - 10]]); c.fill(); }
  }, { t: 2.4, d: 1.0, reveal: 'rise' });
}

function riva(p, r) {
  // the stone edge of the quay, the lamps, the people out at dusk
  p.group('riva', { x: X0, y: WL - 30, w: X1 - X0, h: 44 }, (c) => {
    c.fillStyle = STONE; c.fillRect(760, WL - 4, X1 - 760, 12);
    c.fillStyle = STONE_S; c.fillRect(760, WL + 4, X1 - 760, 4);
    c.fillStyle = STONE; c.fillRect(X0, WL - 2, 680, 10);
    line(c, 0.8); c.beginPath(); c.moveTo(760, WL + 8); c.lineTo(X1, WL + 8); c.moveTo(X0, WL + 8); c.lineTo(742, WL + 8); c.stroke();
  }, { t: 7.8, d: 0.8, reveal: 'wipe' });
  const folk = [];
  for (let i = 0; i < 46; i++) {
    const x = r.chance(0.8) ? r.range(780, 1500) : r.range(170, 600);
    folk.push([x, r.pick([INK, OX, NIGHT, CREAM, TERRA, GOLD]), r.range(0.85, 1.15)]);
  }
  folk.sort((a, b) => a[0] - b[0]);
  p.group('riva', { x: X0, y: WL - 40, w: X1 - X0, h: 46 }, (c) => {
    for (const [x, col, s] of folk) {
      const h = 15 * s, y = WL - 2;
      c.fillStyle = col; c.beginPath(); c.moveTo(x - h * 0.2, y); c.lineTo(x - h * 0.12, y - h * 0.75); c.lineTo(x + h * 0.12, y - h * 0.75); c.lineTo(x + h * 0.2, y); c.fill();
      c.fillStyle = '#e0b49a'; c.beginPath(); c.arc(x, y - h * 0.86, h * 0.12, 0, Math.PI * 2); c.fill();
    }
    // lamps on the quay
    for (let x = 800; x < X1; x += 96) {
      c.fillStyle = INK; c.fillRect(x - 1, WL - 34, 2, 32);
      c.fillStyle = GOLD_L; c.beginPath(); c.arc(x, WL - 36, 3.6, 0, Math.PI * 2); c.fill();
      line(c, 0.7); c.stroke();
    }
  }, { t: 8.2, d: 0.7, reveal: 'fade' });
  // gondolas tied up along the Molo, with their poles
  const moored = [];
  for (let x = 800; x < 1500; x += r.range(46, 74)) moored.push([x, r.range(0.85, 1.05)]);
  p.group('riva', { x: 740, y: WL - 30, w: 800, h: 54 }, (c) => {
    for (const [x, s] of moored) {
      c.fillStyle = INK;
      c.beginPath(); c.moveTo(x - 30 * s, WL + 14); c.quadraticCurveTo(x, WL + 22, x + 32 * s, WL + 12);
      c.lineTo(x + 36 * s, WL + 4); c.lineTo(x + 31 * s, WL + 9); c.quadraticCurveTo(x, WL + 15, x - 28 * s, WL + 9); c.lineTo(x - 34 * s, WL + 6); c.closePath(); c.fill();
      c.fillStyle = OX; c.fillRect(x - 6 * s, WL + 10, 10 * s, 3);
      for (const dx of [-38, 40]) {
        c.fillStyle = CREAM; c.fillRect(x + dx * s - 1.5, WL - 22, 3, 44);
        c.fillStyle = dx > 0 ? NIGHT : OX; for (let y = WL - 20; y < WL + 20; y += 8) c.fillRect(x + dx * s - 1.5, y, 3, 4);
        c.fillStyle = GOLD; c.beginPath(); c.arc(x + dx * s, WL - 23, 2.4, 0, Math.PI * 2); c.fill();
      }
    }
  }, { t: 8.5, d: 0.8, reveal: 'wipeL' });
}

// ---------------------------------------------------------------- the water
function water(p, r) {
  // the lagoon: the sky's gold at the top, deep teal toward us
  p.group('water', { x: X0, y: WL, w: X1 - X0, h: Y1 - WL }, (c) => {
    const g = c.createLinearGradient(0, WL, 0, Y1);
    g.addColorStop(0, '#d9c497'); g.addColorStop(0.06, '#a9b99c'); g.addColorStop(0.25, '#6fa597'); g.addColorStop(0.6, LAGOON); g.addColorStop(1, LAGOON_D);
    c.fillStyle = g; c.fillRect(X0, WL, X1 - X0, Y1 - WL);
  }, { t: 2.0, d: 1.6, reveal: 'fall', ease: 'inOut' });
  // the reflections, in strips that slide apart as the water moves
  // drawn once into a sheet of its own at twice the scale, then laid down
  let sheet = null;
  const RH = Y1 - WL;
  p.group('refl', { x: X0, y: WL, w: X1 - X0, h: RH }, (c) => {
    if (!sheet) {
      sheet = document.createElement('canvas');
      sheet.width = (X1 - X0) * 2; sheet.height = RH * 2;
      const sc = sheet.getContext('2d');
      sc.scale(2, 2); sc.translate(-X0, -WL);
      reflections(sc);
    }
    c.drawImage(sheet, X0, WL, X1 - X0, RH);
  }, { t: 8.1, d: 1.6, reveal: 'fall', ease: 'inOut' });
  waterLines(p, r);
}

function reflections(c) {
  {
    const rr = rng(8);
    let y = WL + 6;
    while (y < WL + 560) {
      const hgt = 3 + (y - WL) * 0.024 + rr() * 3;
      const dx = Math.sin(y * 0.11) * (1 + (y - WL) * 0.025) + rr.range(-1.5, 1.5);
      const a = 0.85 * (1 - (y - WL) / 640) ** 0.8;
      c.save(); c.beginPath(); c.rect(X0, y, X1 - X0, hgt * 0.86); c.clip();
      c.translate(dx, 2 * WL + 8); c.scale(1, -1);
      const a0 = c.globalAlpha;
      for (const f of REFL) { c.fillStyle = mix(f.color, '#8a5a50', 0.12 + (y - WL) / 1600); c.globalAlpha = a0 * a; poly(c, f.pts); c.fill(); }
      c.restore();
      y += hgt;
    }
    // the sun's path on the water
    for (let i = 0; i < 70; i++) {
      const yy = WL + 8 + i * 9 + rr() * 4, w = (40 + i * 2.2) * rr.range(0.4, 1);
      c.fillStyle = `rgba(255,244,205,${0.75 - i / 110})`;
      c.fillRect(560 - w / 2 + rr.range(-30, 30) * (i / 60), yy, w, 2.2 + i * 0.03);
    }
  }
}

function waterLines(p, r) {
  // the water's lines, short near the palaces and longer toward us
  const rows = 22;
  for (let k = 0; k < rows; k++) {
    const f = k / (rows - 1), y = lerp(WL + 30, Y1 - 10, f ** 1.3);
    const lines = [], hi = [];
    const len = lerp(18, 110, f), amp = lerp(1, 5, f);
    for (let x = X0 - r() * len; x < X1; x += len * r.range(0.8, 1.7)) {
      const pts = [];
      for (let i = 0; i <= 8; i++) pts.push([x + (i / 8) * len, y + r.range(-3, 3) * f + Math.sin((i / 8) * Math.PI * 2) * amp]);
      (r.chance(0.3) ? hi : lines).push(pts);
    }
    p.strokes('water', lines, `rgba(29,79,88,${lerp(0.35, 0.7, f)})`, lerp(0.8, 2.2, f), { t: 9.0 + k * 0.05, d: 0.8, reveal: k % 2 ? 'wipeL' : 'wipe' });
    if (hi.length) p.strokes('water', hi, 'rgba(250,236,200,.6)', lerp(0.7, 1.8, f), { t: 9.2 + k * 0.05, d: 0.8, reveal: k % 2 ? 'wipe' : 'wipeL' });
  }
}

// ---------------------------------------------------------------- a fishing boat with painted sails
function bragozzo(p, r) {
  const x = 330, y = 1372, s = 1;
  p.group('boats', { x: x - 110, y: y - 190, w: 230, h: 230 }, (c) => {
    // its reflection first, broken
    for (let j = 0; j < 9; j++) { c.fillStyle = j % 2 ? 'rgba(200,110,60,.35)' : 'rgba(230,170,80,.3)'; c.fillRect(x - 40 + Math.sin(j * 1.3) * 5, y + 8 + j * 7, 80 - j * 6, 4); }
    // the hull, broad and dark, with an eye at the bow
    c.fillStyle = '#2d2422';
    c.beginPath(); c.moveTo(x - 70, y - 16); c.quadraticCurveTo(x - 60, y + 4, x - 30, y + 6); c.lineTo(x + 46, y + 6); c.quadraticCurveTo(x + 70, y + 2, x + 78, y - 20); c.lineTo(x + 70, y - 14); c.lineTo(x - 64, y - 12); c.closePath(); c.fill();
    c.fillStyle = TERRA; c.fillRect(x - 62, y - 12, 128, 4);
    c.fillStyle = CREAM; c.beginPath(); c.arc(x + 58, y - 6, 3, 0, Math.PI * 2); c.fill();
    // the masts and the two lug sails in ochre and red, with their emblems
    line(c, 2, INK); c.beginPath(); c.moveTo(x - 6, y - 12); c.lineTo(x - 2, y - 172); c.moveTo(x + 50, y - 12); c.lineTo(x + 52, y - 96); c.stroke();
    const main = [[x - 2, y - 168], [x - 78, y - 150], [x - 60, y - 22], [x + 2, y - 26]];
    c.fillStyle = '#d98a35'; poly(c, main); c.fill(); line(c, 1); c.stroke();
    c.fillStyle = 'rgba(160,60,40,.3)'; poly(c, [[x - 2, y - 168], [x - 30, y - 162], [x - 22, y - 24], [x + 2, y - 26]]); c.fill();
    c.fillStyle = TERRA; c.beginPath(); c.arc(x - 36, y - 96, 18, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD_L; c.beginPath(); c.arc(x - 36, y - 96, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = TERRA; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; poly(c, [[x - 36 + Math.cos(a) * 18, y - 96 + Math.sin(a) * 18], [x - 36 + Math.cos(a + 0.2) * 26, y - 96 + Math.sin(a + 0.2) * 26], [x - 36 + Math.cos(a + 0.4) * 18, y - 96 + Math.sin(a + 0.4) * 18]]); c.fill(); }
    const fore = [[x + 52, y - 94], [x + 18, y - 84], [x + 24, y - 20], [x + 54, y - 22]];
    c.fillStyle = '#b8452f'; poly(c, fore); c.fill(); line(c, 1); c.stroke();
    c.fillStyle = GOLD_L; poly(c, [[x + 38, y - 70], [x + 46, y - 56], [x + 38, y - 42], [x + 30, y - 56]]); c.fill();
    line(c, 0.6, 'rgba(62,38,34,.45)'); c.beginPath(); for (let i = 1; i < 5; i++) { const f = i / 5; c.moveTo(lerp(x - 2, x - 78, f * 0.9), lerp(y - 168, y - 150, f)); c.lineTo(lerp(x + 2, x - 60, f), lerp(y - 26, y - 22, f)); } c.stroke();
    // a little pennant at the masthead
    c.fillStyle = OX; poly(c, [[x - 2, y - 172], [x + 18, y - 168], [x - 2, y - 164]]); c.fill();
  }, { t: 9.7, d: 1.0, reveal: 'rise', ease: 'inOut' });
  // small boats out by the Riva, each with a rower
  const small = [[880, 1232, 0.34, 1], [1080, 1262, 0.4, -1], [640, 1250, 0.3, -1], [1380, 1226, 0.3, 1]];
  p.group('boats', { x: 500, y: 1180, w: 1020, h: 110 }, (c) => {
    for (const [bx, by, sc, dir] of small) {
      c.save(); c.translate(bx, by); c.scale(dir * sc, sc);
      c.fillStyle = 'rgba(20,40,45,.3)'; c.fillRect(-110, 6, 220, 5);
      c.fillStyle = '#1a1617'; gondolaShape(c, 0, 0, 330); c.fill();
      c.fillStyle = NIGHT; c.fillRect(104, -42, 9, 22); c.fillStyle = CREAM; c.fillRect(103, -64, 11, 22);
      c.fillStyle = GOLD_L; c.fillRect(100, -72, 17, 3);
      c.strokeStyle = '#7a4a2c'; c.lineWidth = 3; c.beginPath(); c.moveTo(104, -52); c.lineTo(70, 12); c.stroke();
      c.restore();
    }
  }, { t: 9.9, d: 0.8, reveal: 'fade' });
}

// ---------------------------------------------------------------- the striped poles
function poles(p, r) {
  const set = [[1236, 1330, 1836, 20, OX], [1318, 1262, 1856, 24, NIGHT], [1414, 1300, 1866, 22, OX], [1490, 1372, 1878, 18, NIGHT]];
  set.forEach(([x, top, foot, w, col], i) => {
    p.group('poles', { x: x - w - 4, y: top - w - 4, w: 2 * w + 8, h: Y1 - top + w + 8 }, (c) => {
      // the pole, its spiral stripes, its gilded cap
      c.save(); c.beginPath(); c.rect(x - w / 2, top, w, foot - top); c.clip();
      c.fillStyle = CREAM; c.fillRect(x - w / 2, top, w, foot - top);
      c.fillStyle = col;
      for (let y = top - w; y < foot; y += w * 1.8) poly(c, [[x - w / 2, y], [x + w / 2, y - w * 0.6], [x + w / 2, y + w * 0.3], [x - w / 2, y + w * 0.9]]);
      for (let y = top - w; y < foot; y += w * 1.8) { poly(c, [[x - w / 2, y], [x + w / 2, y - w * 0.6], [x + w / 2, y + w * 0.3], [x - w / 2, y + w * 0.9]]); c.fill(); }
      c.fillStyle = 'rgba(60,30,30,.28)'; c.fillRect(x + w * 0.1, top, w * 0.4, foot - top);
      c.fillStyle = 'rgba(255,230,170,.35)'; c.fillRect(x - w * 0.4, top, w * 0.18, foot - top);
      c.restore();
      line(c, 1.1); c.strokeRect(x - w / 2, top, w, foot - top);
      c.fillStyle = GOLD; c.beginPath(); c.arc(x, top - w * 0.2, w * 0.62, 0, Math.PI * 2); c.fill(); line(c, 1); c.stroke();
      c.fillStyle = GOLD_L; c.beginPath(); c.arc(x - w * 0.2, top - w * 0.38, w * 0.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD; c.fillRect(x - w * 0.62, top + w * 0.35, w * 1.24, w * 0.3);
      // its reflection, broken by the water
      for (let y = foot + 2, j = 0; y < Y1; y += 7, j++) {
        c.fillStyle = j % 3 === 1 ? `rgba(107,39,48,.5)` : 'rgba(247,236,214,.45)';
        c.fillRect(x - w / 2 + Math.sin(j * 1.7 + i) * 3, y, w, 4);
      }
    }, { t: 9.4 + i * 0.22, d: 0.9, reveal: 'rise', ease: 'inOut' });
  });
}

// ---------------------------------------------------------------- the gondola close by
function gondolaShape(c, x, y, L, o = {}) {
  // long and asymmetric, its two ends rising; the prow on the left
  const h = L * 0.055;
  c.beginPath();
  c.moveTo(x - L * 0.5, y - L * 0.15);
  c.quadraticCurveTo(x - L * 0.44, y - h * 0.4, x - L * 0.3, y);
  c.quadraticCurveTo(x, y + h * 0.5, x + L * 0.32, y);
  c.quadraticCurveTo(x + L * 0.46, y - h * 0.5, x + L * 0.5, y - L * 0.1);
  c.lineTo(x + L * 0.49, y - L * 0.09);
  c.quadraticCurveTo(x + L * 0.43, y - h * 1.4, x + L * 0.3, y - h * 1.2);
  c.quadraticCurveTo(x, y - h * 0.8, x - L * 0.3, y - h * 1.2);
  c.quadraticCurveTo(x - L * 0.42, y - h * 1.5, x - L * 0.49, y - L * 0.14);
  c.closePath();
}
function gondola(p, r) {
  const x = 700, y = 1800, L = 1000;
  p.group('gondola', { x: x - L * 0.56, y: y - L * 0.26, w: L * 1.12, h: L * 0.36 }, (c) => {
    // its shadow and reflection on the water
    c.fillStyle = 'rgba(20,40,45,.45)';
    c.beginPath(); c.ellipse(x, y + 18, L * 0.42, 14, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(20,30,35,.3)';
    for (let j = 0; j < 8; j++) c.fillRect(x - L * 0.38 + Math.sin(j) * 8, y + 10 + j * 8, L * 0.76 - j * 30, 4);
    // the hull, black lacquer with a long highlight
    c.fillStyle = '#1a1617'; gondolaShape(c, x, y, L); c.fill();
    c.strokeStyle = 'rgba(255,214,150,.5)'; c.lineWidth = 2.4; c.beginPath();
    c.moveTo(x - L * 0.3, y - L * 0.055 * 1.05); c.quadraticCurveTo(x, y - L * 0.055 * 0.62, x + L * 0.3, y - L * 0.055 * 1.05); c.stroke();
    c.strokeStyle = 'rgba(255,214,150,.3)'; c.lineWidth = 1.2; c.beginPath();
    c.moveTo(x - L * 0.32, y - 4); c.quadraticCurveTo(x, y + L * 0.055 * 0.3, x + L * 0.3, y - 4); c.stroke();
    // the seats: red velvet, gold trim
    for (const [dx, w] of [[-0.12, 0.1], [0.02, 0.12], [0.16, 0.08]]) {
      const sx = x + dx * L, sy = y - L * 0.055 * 0.95;
      c.fillStyle = OX; c.fillRect(sx - w * L / 2, sy - 22, w * L, 22);
      c.fillStyle = '#8f3440'; c.fillRect(sx - w * L / 2, sy - 22, w * L, 7);
      c.fillStyle = GOLD; c.fillRect(sx - w * L / 2, sy - 2, w * L, 3);
      for (const e of [-1, 1]) { c.beginPath(); c.arc(sx + e * w * L / 2, sy - 22, 4, 0, Math.PI * 2); c.fill(); }
    }
    // the seahorses on the sides, in brass
    for (const e of [-1, 1]) {
      const hx = x + e * L * 0.05, hy = y - L * 0.055 * 0.9 - 30;
      c.fillStyle = GOLD; c.beginPath(); c.ellipse(hx, hy, 5, 9, e * 0.3, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(hx + e * 4, hy - 9, 4, 0, Math.PI * 2); c.fill();
    }
    // the iron at the prow: a tall blade with a curved crest, six teeth forward, one back
    const fx = x - L * 0.5, fy = y - L * 0.15;
    c.save(); c.translate(fx, fy); c.rotate(-0.12);
    c.fillStyle = '#dcd5c6';
    c.beginPath();
    c.moveTo(4, 6); c.lineTo(-6, 6); c.lineTo(-8, -40);
    c.quadraticCurveTo(-12, -62, -28, -70); c.quadraticCurveTo(-10, -80, 6, -70);
    c.quadraticCurveTo(10, -58, 8, -44); c.lineTo(8, 0); c.closePath(); c.fill();
    for (let i = 0; i < 6; i++) { const yy = -38 + i * 7; c.fillRect(-26, yy, 20, 3.4); }
    c.fillRect(6, -18, 12, 3.4);
    line(c, 1, INK);
    c.beginPath(); c.moveTo(4, 6); c.lineTo(-6, 6); c.lineTo(-8, -40); c.quadraticCurveTo(-12, -62, -28, -70); c.quadraticCurveTo(-10, -80, 6, -70); c.quadraticCurveTo(10, -58, 8, -44); c.lineTo(8, 0); c.closePath(); c.stroke();
    c.fillStyle = 'rgba(255,240,210,.7)'; c.fillRect(-4, -40, 2, 40);
    c.restore();
    // gold trim along the gunwale
    c.strokeStyle = GOLD; c.lineWidth = 1.6; c.beginPath();
    c.moveTo(x - L * 0.42, y - L * 0.055 * 1.32); c.quadraticCurveTo(x, y - L * 0.055 * 0.74, x + L * 0.4, y - L * 0.055 * 1.3); c.stroke();
    // the oarlock at the stern
    const ox = x + L * 0.36, oy = y - L * 0.055 * 1.1;
    c.fillStyle = '#7a4a2c'; c.beginPath(); c.moveTo(ox - 5, oy); c.lineTo(ox - 8, oy - 24); c.quadraticCurveTo(ox - 2, oy - 34, ox + 6, oy - 30); c.quadraticCurveTo(ox, oy - 24, ox + 6, oy - 16); c.lineTo(ox + 5, oy); c.fill();
    // the rope to the pole
    c.strokeStyle = '#c9a77a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + L * 0.49, y - L * 0.09); c.quadraticCurveTo(x + L * 0.58, y - L * 0.02, 1230, 1722); c.stroke();
  }, { t: 10.0, d: 1.2, reveal: 'slide', dx: -120 });
}

// ---------------------------------------------------------------- what moves
function life(p, r) {
  // the light on the water, glinting
  const glints = [];
  for (let i = 0; i < 150; i++) {
    const inPath = r.chance(0.55);
    const y = WL + 10 + r() ** 1.3 * 700;
    const x = inPath ? 560 + r.gauss() * (30 + (y - WL) * 0.25) : r.range(X0, X1);
    glints.push([x, y, r.range(4, 18) * (0.4 + (y - WL) / 700), r() * 6, inPath]);
  }
  p.live('refl', {
    t: 9.6, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      for (const [x, y, w, ph, gold] of glints) {
        const a = 0.5 + 0.5 * Math.sin(time * 2.2 + ph * 3);
        if (a < 0.25) continue;
        c.fillStyle = gold ? `rgba(255,240,196,${a * 0.85})` : `rgba(248,232,204,${a * 0.45})`;
        c.fillRect(x + Math.sin(time * 0.8 + ph) * 4 - w / 2, y, w * (0.6 + a * 0.4), 2);
      }
    },
  });
  // a gondolier rowing across the basin
  p.live('boats', {
    t: 9.8, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      const x = 220 + ((time - 9.8) * 9 + 300) % 1400, y = 1440 + Math.sin(time * 1.4) * 1.5;
      const L = 330;
      c.fillStyle = 'rgba(20,40,45,.3)'; c.fillRect(x - L * 0.36, y + 4, L * 0.72, 4);
      c.fillStyle = '#1a1617'; gondolaShape(c, x, y, L); c.fill();
      c.fillStyle = OX; c.fillRect(x - 24, y - 26, 40, 9);
      // the gondolier at the stern, in stripes and a straw hat
      const gx = x + L * 0.33, gy = y - L * 0.06;
      const st = Math.sin(time * 1.6);
      c.fillStyle = NIGHT; c.fillRect(gx - 4, gy - 22, 8, 22);
      c.fillStyle = CREAM; c.fillRect(gx - 5, gy - 44, 10, 22);
      c.fillStyle = NIGHT; for (let k = 0; k < 4; k++) c.fillRect(gx - 5, gy - 42 + k * 5.5, 10, 2.4);
      c.fillStyle = '#e0b49a'; c.beginPath(); c.arc(gx, gy - 49, 4.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD_L; c.fillRect(gx - 8, gy - 54, 16, 2.4); c.fillRect(gx - 4.5, gy - 59, 9, 5);
      c.fillStyle = OX; c.fillRect(gx - 4.5, gy - 55.5, 9, 1.6);
      // the oar
      c.strokeStyle = '#7a4a2c'; c.lineWidth = 2.4; c.beginPath();
      c.moveTo(gx - 6 + st * 4, gy - 34); c.lineTo(gx - 40 + st * 14, y + 14); c.stroke();
    },
  });
  // gulls
  const gulls = [[300, 520, 0], [1120, 600, 2], [1250, 470, 4], [700, 1000, 1]];
  p.live('air', {
    t: 10.2, d: 1, reveal: 'fade',
    draw: (c, time) => {
      for (const [x0, y0, ph] of gulls) {
        const x = x0 + Math.sin(time * 0.15 + ph) * 90, y = y0 + Math.sin(time * 0.4 + ph) * 18;
        const fl = Math.sin(time * 3.2 + ph) * 5;
        c.strokeStyle = CREAM; c.lineWidth = 2.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x - 13, y - 2 - fl); c.quadraticCurveTo(x - 6, y - 6, x, y); c.quadraticCurveTo(x + 6, y - 6, x + 13, y - 2 - fl); c.stroke();
        c.strokeStyle = 'rgba(62,38,34,.6)'; c.lineWidth = 1; c.stroke();
      }
    },
  });
}

// ---------------------------------------------------------------- frame and title
function frame(p) {
  // the sheet outside the window: plain paper, over everything
  p.group('mask', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = '#f4e9d3';
    c.beginPath(); c.rect(0, 0, W, H); archPath(c, 0); c.fill('evenodd');
  }, { t: 0, d: 0.01, reveal: 'none' });
  // the window's moulding drawn round: oxblood, then a gold line inside
  p.pen('mask', archPts(-3), OX, 7, { t: 0.2, d: 2.2, closed: false, cap: 'butt' });
  p.pen('mask', archPts(7), GOLD, 2, { t: 0.5, d: 2.2, closed: false, cap: 'butt' });
  p.pen('mask', archPts(-26), 'rgba(91,58,46,.55)', 1, { t: 0.8, d: 2.2, closed: false, cap: 'butt' });
}

function title(p) {
  // the finial on top of the arch
  p.group('title', { x: CX - 30, y: APEX - 70, w: 60, h: 74 }, (c) => {
    c.fillStyle = GOLD;
    c.beginPath(); c.moveTo(CX, APEX - 64); c.quadraticCurveTo(CX + 16, APEX - 40, CX, APEX - 8); c.quadraticCurveTo(CX - 16, APEX - 40, CX, APEX - 64); c.fill();
    line(c, 1, OX); c.stroke();
    c.beginPath(); c.arc(CX, APEX - 70, 5, 0, Math.PI * 2); c.fill(); c.stroke();
  }, { t: 2.3, d: 0.6, reveal: 'pop' });
  const tx = CX, ty = 480;
  setType(p, 'title', 'Venezia', tx, ty, { family: '"Playfair Display", serif', style: 'italic', weight: 500, size: 236, color: OX, align: 'center', t: 10.7, gap: 0.17, d: 0.9 });
  p.group('title', { x: tx - 320, y: ty + 30, w: 640, h: 40 }, (c) => {
    c.fillStyle = OX;
    c.fillRect(tx - 250, ty + 50, 120, 1.4); c.fillRect(tx + 130, ty + 50, 120, 1.4);
    for (const x of [tx - 250, tx + 250]) { poly(c, [[x, ty + 45], [x + 5, ty + 50.7], [x, ty + 56], [x - 5, ty + 50.7]]); c.fill(); }
  }, { t: 12.2, d: 0.8, reveal: 'iris' });
  p.type('title', 'VENICE', tx, ty + 62, { family: '"Playfair Display", serif', weight: 500, size: 34, color: OX, track: 0.55, align: 'center', t: 12.3, gap: 0.07, d: 0.6, reveal: 'fade' });
  p.type('title', 'La Serenissima', tx, 1966, { family: '"Playfair Display", serif', style: 'italic', weight: 400, size: 30, color: SEPIA, track: 0.06, align: 'center', t: 13.0, gap: 0.03, d: 0.6, reveal: 'fade' });
}
