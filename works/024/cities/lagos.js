// Lagos: a 1970s Afrobeat record cover. The sleeve lies on the sheet with the
// record half out of it, its label turning. On the sleeve, drawn by hand in thick
// black line and loud flat color: the Third Mainland Bridge sweeping in out of
// the corner, jammed with yellow danfo buses, across the lagoon to the island's
// towers under a sun of concentric bands; Makoko's stilt houses by the bridge, the
// National Arts Theatre with its peaked roof on the right, the cable-stayed Lekki-Ikoyi
// bridge far off, and fishermen in dugouts, one casting a net, in a lagoon patterned like
// adire cloth. The name in Bungee across the top of the sleeve.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, poly, rng } from '../kit.js';

const PAPER = '#efe3cb', INK = '#17110d', CREAM = '#f7ecd4';
const RED = '#d6331f', ORANGE = '#f27a1c', YELLOW = '#ffc71a', GREEN = '#0d8a4e', GREEN_D = '#08603a', GREEN_L = '#3fb36b';
const BLUE = '#1d5cb4', BLUE_D = '#123f86', TEAL = '#17a19c', MAGENTA = '#c3286a', PURPLE = '#5b2a7e', BROWN = '#7c3c1d', RUST = '#b5532a', TAN = '#d9a35f';
const FACE = '"Bungee", sans-serif';

export const city = {
  id: 'lagos', name: 'Lagos', wall: '#173a2a',
  alt: 'A 1970s Afrobeat record cover for Lagos, the record half out of its sleeve: the Third Mainland Bridge sweeps in from the corner jammed with yellow danfo buses, across a lagoon patterned like adire cloth where fishermen paddle dugout canoes and one stands to cast his net, past the stilt houses of Makoko, to the towers of Lagos Island under a sun of concentric red, orange and magenta bands, with the cable-stayed Lekki-Ikoyi Link Bridge far off and the National Arts Theatre with its peaked, cap-shaped roof on the right, all in thick hand-drawn black line, under the name LAGOS and ÈKÓ',
  google: 'family=Bungee',
  fonts: [['400 100px "Bungee"', 'LAGOS ÈKÓ STEREO 33⅓ RPM SIDE A EKO O NI BAJE · LAGOON MAKOKO THIRD MAINLAND BRIDGE AFRO LONG PLAY'], ],
  build,
};

// the sleeve, the picture on it, and the record
const SL = { x: 70, y: 470, w: W - 140, h: 1470 };
const SC = { x: 98, y: 822, w: W - 196, h: 966 };     // the picture
const HZ = 1150;                                    // the island's waterline
const SUN = [1030, 1150];
const REC = [1000, 474], RR = 440;

const inScene = (c) => { c.beginPath(); c.rect(SC.x, SC.y, SC.w, SC.h); c.clip(); };

function build() {
  const p = new Plate({ paper: PAPER, seed: 1976 });
  const r = p.r;
  p.stack('sheet', 'record', 'sleeve', 'sky', 'island', 'lagoon', 'shore', 'bridge', 'traffic', 'front', 'live', 'title');
  for (const n of p.order) p.layer(n, { clip: false });
  sheet(p, r);
  record(p, r);
  sleeve(p, r);
  sky(p, r);
  island(p, r);
  lagoon(p, r);
  makoko(p, r);
  theater(p, r);
  bridge(p, r);
  canoes(p, r);
  strip(p, r);
  life(p, r);
  title(p, r);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

// ================================================================ helpers
// a line drawn by hand: each segment cut short and nudged, decided once at build
function wob(r, pts, amp = 1.6, step = 14, closed = false) {
  const src = closed ? pts.concat([pts[0]]) : pts, out = [];
  for (let i = 0; i < src.length - 1; i++) {
    const [x0, y0] = src[i], [x1, y1] = src[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 0; k < n; k++) { const t = k / n; out.push([lerp(x0, x1, t) + (k ? r.range(-amp, amp) : 0), lerp(y0, y1, t) + (k ? r.range(-amp, amp) : 0)]); }
  }
  out.push(src[src.length - 1]);
  return out;
}
function path(c, pts, close = true) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  if (close) c.closePath();
}
function ink(c, pts, fill, lw = 5, close = true) {
  path(c, pts, close);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
}
function rectPts(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function circlePts(x, y, rr, n = 36, sy = 1) { const o = []; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; o.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * sy]); } return o; }
function spline(pts, n = 10) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function setText(c, text, x, y, size, fill, track = 0, align = 'left') {
  c.font = `400 ${size}px ${FACE}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const tr = track * size, total = c.measureText(text).width + tr * (text.length - 1);
  let gx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  c.fillStyle = fill;
  for (let i = 0; i < text.length; i++) {
    const w = c.measureText(text.slice(0, i + 1)).width - c.measureText(text.slice(0, i)).width;
    c.fillText(text[i], gx, y); gx += w + tr;
  }
}

// ================================================================ the sheet and the record
function sheet(p, r) {
  // ÈKÓ, the city's own name, and the record's particulars in the top corner
  p.group('sheet', { x: 80, y: 60, w: 520, h: 400 }, (c) => {
    c.font = `400 190px ${FACE}`; c.textBaseline = 'alphabetic';
    c.fillStyle = INK; c.fillText('ÈKÓ', 112, 302);
    c.fillStyle = RED; c.fillText('ÈKÓ', 100, 290);
  }, { t: 12.4, d: 0.7, reveal: 'wipe' });
  p.group('sheet', { x: 90, y: 320, w: 460, h: 120 }, (c) => {
    c.fillStyle = INK; c.fillRect(104, 330, 330, 52);
    setText(c, 'STEREO', 118, 372, 40, CREAM, 0.12);
    setText(c, 'LONG PLAY · 33⅓ RPM', 104, 428, 30, INK, 0.06);
  }, { t: 12.9, d: 0.6, reveal: 'wipe' });
}
function record(p, r) {
  const [x, y] = REC;
  const grooves = [];
  for (let k = 0; k < 34; k++) grooves.push(RR - 18 - k * 8 - (k > 16 ? 14 : 0));
  p.group('record', { x: x - RR - 10, y: y - RR - 10, w: 2 * RR + 20, h: RR + 20 }, (c) => {
    c.save(); c.beginPath(); c.rect(x - RR - 10, y - RR - 10, 2 * RR + 20, RR + 10); c.clip();
    c.fillStyle = INK; c.beginPath(); c.arc(x, y, RR, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#3a312b'; c.lineWidth = 1.6;
    for (const g of grooves) if (g > 160) { c.beginPath(); c.arc(x, y, g, Math.PI, Math.PI * 2); c.stroke(); }
    // the sheen, two pale wedges
    c.fillStyle = 'rgba(247,236,212,.12)';
    for (const a of [-2.5, -0.9]) { c.beginPath(); c.moveTo(x, y); c.arc(x, y, RR - 6, a, a + 0.28); c.closePath(); c.fill(); }
    c.restore();
  }, { t: 0.3, d: 1.2, reveal: 'rise', ease: 'out' });
}

// ================================================================ the sleeve
function sleeve(p, r) {
  const { x, y, w, h } = SL;
  const edge = wob(r, rectPts(x, y, w, h), 1.2, 30, true);
  p.group('sleeve', { x: x - 20, y: y - 20, w: w + 40, h: h + 40 }, (c) => {
    // a hard shadow under the sleeve
    c.fillStyle = 'rgba(23,17,13,.35)'; c.fillRect(x + 14, y + 14, w, h);
    ink(c, edge, GREEN, 8);
  }, { t: 0.5, d: 1.0, reveal: 'rise', ease: 'out' });
  // the title band's ground: bold diagonal stripes in two greens
  const stripes = [];
  for (let k = -10; k < 40; k++) { const x0 = x + k * 60; stripes.push([[x0, 820], [x0 + 300, 500], [x0 + 330, 500], [x0 + 30, 820]]); }
  p.group('sleeve', { x: x, y: 490, w: w, h: 340 }, (c) => {
    c.save(); c.beginPath(); c.rect(x + 20, 492, w - 40, 328); c.clip();
    c.fillStyle = GREEN_D; for (const s of stripes) { poly(c, s); c.fill(); }
    c.restore();
  }, { t: 1.0, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // the picture's frame
  const frame = wob(r, rectPts(SC.x, SC.y, SC.w, SC.h), 1.2, 40, true);
  p.group('sleeve', { x: SC.x - 12, y: SC.y - 12, w: SC.w + 24, h: SC.h + 24 }, (c) => {
    ink(c, frame, CREAM, 8);
  }, { t: 1.2, d: 0.7, reveal: 'iris', ease: 'out' });
}

// ================================================================ the sky: a sun of concentric bands
function sky(p, r) {
  const [sx, sy] = SUN;
  const cols = [ORANGE, RED, MAGENTA, PURPLE, RED, ORANGE, YELLOW, ORANGE, RED, MAGENTA, PURPLE, BLUE_D];
  const radii = cols.map((_, k) => 1180 - k * 88);
  const rings = radii.map((rad) => wob(r, Array.from({ length: 60 }, (_, k) => { const a = Math.PI + (k / 59) * Math.PI; return [sx + Math.cos(a) * rad, sy + Math.sin(a) * rad]; }), 2.2, 22));
  // drawn from the outside in, each band a mark arriving as an iris from the sun
  cols.forEach((col, k) => {
    const rad = radii[k];
    p.group('sky', { x: sx - rad, y: sy - rad, w: 2 * rad, h: 2 * rad }, (c) => {
      c.save(); inScene(c);
      path(c, rings[k], true); c.fillStyle = cols[cols.length - 1 - k]; c.fill();
      c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
      c.restore();
    }, { t: 1.4 + k * 0.12, d: 0.9, reveal: 'iris', ease: 'out' });
  });
  // the sun
  const sun = wob(r, circlePts(sx, sy, 180, 44), 2, 18, true);
  p.group('sky', { x: sx - 200, y: sy - 200, w: 400, h: 210 }, (c) => {
    c.save(); inScene(c); c.beginPath(); c.rect(SC.x, SC.y, SC.w, HZ + 4 - SC.y); c.clip(); ink(c, sun, YELLOW, 6);
    c.strokeStyle = ORANGE; c.lineWidth = 8;
    for (const rad of [134, 90, 48]) { c.beginPath(); c.arc(sx, sy, rad, Math.PI, Math.PI * 2); c.stroke(); }
    c.restore();
  }, { t: 3.0, d: 0.8, reveal: 'pop', ease: 'back' });
  // dots in some bands, the way a cover artist fills a shape
  const dots = [];
  for (let k = 0; k < 700; k++) {
    const a = Math.PI + r() * Math.PI, rad = r.range(180, 1180);
    const band = radii.findIndex((rr, i) => rad <= rr && (i === radii.length - 1 || rad > radii[i + 1]));
    if (band % 3 !== 1) continue;
    const x = sx + Math.cos(a) * rad, y = sy + Math.sin(a) * rad;
    if (x < SC.x || x > SC.x + SC.w || y < SC.y || y > HZ) continue;
    dots.push([x, y]);
  }
  p.group('sky', { x: SC.x, y: SC.y, w: SC.w, h: HZ - SC.y }, (c) => {
    c.save(); inScene(c); c.fillStyle = INK; c.beginPath();
    for (const [x, y] of dots) { c.moveTo(x + 4, y); c.arc(x, y, 4, 0, Math.PI * 2); }
    c.fill(); c.restore();
  }, { t: 3.2, d: 0.6, reveal: 'fade' });
}

// ================================================================ the island's towers and the Lekki bridge
function island(p, r) {
  const towers = [];
  const cols = [CREAM, TEAL, ORANGE, CREAM, '#f2d6a2', TEAL, CREAM, RED];
  for (let x = 200; x < 850;) {
    const w = r.range(40, 86), h = r.range(70, 230);
    towers.push({ x, w, h, col: r.pick(cols), kind: r.int(0, 2) });
    x += w + r.range(-14, 10);
  }
  // NECOM House: the tall slab with a mast
  towers.push({ x: 690, w: 62, h: 300, col: CREAM, kind: 0, mast: true });
  towers.sort((a, b) => (a.mast ? 1 : 0) - (b.mast ? 1 : 0) || a.h - b.h);
  const back = towers.filter((t, i) => i % 2 === 0), front = towers.filter((t, i) => i % 2 === 1);
  const drawTowers = (set) => (c) => {
    c.save(); inScene(c);
    for (const t of set) {
      const top = HZ - 10 - t.h;
      ink(c, wob(rng(t.x | 0), rectPts(t.x, top, t.w, t.h + 10), 1, 30, true), t.col, 4);
      c.fillStyle = INK; c.beginPath();
      if (t.kind === 0) for (let yy = top + 12; yy < HZ - 20; yy += 14) c.rect(t.x + 6, yy, t.w - 12, 5);
      else if (t.kind === 1) for (let yy = top + 12; yy < HZ - 20; yy += 16) for (let xx = t.x + 7; xx < t.x + t.w - 8; xx += 12) c.rect(xx, yy, 6, 8);
      else for (let xx = t.x + 8; xx < t.x + t.w - 6; xx += 12) c.rect(xx, top + 10, 4, t.h - 22);
      c.fill();
      if (t.mast) { c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(t.x + t.w / 2, top); c.lineTo(t.x + t.w / 2, top - 70); c.moveTo(t.x + t.w / 2 - 12, top - 40); c.lineTo(t.x + t.w / 2 + 12, top - 40); c.stroke(); }
    }
    c.restore();
  };
  p.group('island', { x: 220, y: HZ - 380, w: 1000, h: 380 }, drawTowers(back), { t: 3.3, d: 1.0, reveal: 'rise', ease: 'out' });
  p.group('island', { x: 220, y: HZ - 380, w: 1000, h: 380 }, drawTowers(front), { t: 3.8, d: 1.0, reveal: 'rise', ease: 'out' });
  // the island's shore and its palms
  const shore = wob(r, [[SC.x, HZ - 6], [SC.x + SC.w, HZ - 10], [SC.x + SC.w, HZ + 14], [SC.x, HZ + 14]], 1.5, 26, true);
  const palms = [];
  for (let k = 0; k < 16; k++) palms.push([r.range(140, 1460), r.range(40, 70), r.range(-0.2, 0.2)]);
  p.group('island', { x: SC.x, y: HZ - 100, w: SC.w, h: 120 }, (c) => {
    c.save(); inScene(c);
    ink(c, shore, GREEN, 4);
    for (const [x, h, lean] of palms) {
      const tx = x + lean * h, ty = HZ - 6 - h;
      c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(x, HZ - 4); c.quadraticCurveTo(x + lean * h * 0.3, HZ - h * 0.6, tx, ty); c.stroke();
      c.fillStyle = GREEN_L; c.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI * (1.05 + k * 0.18); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * 18, ty + Math.sin(a) * 18 - 8, tx + Math.cos(a) * 30, ty + Math.sin(a) * 18 + 8); c.quadraticCurveTo(tx + Math.cos(a) * 14, ty + Math.sin(a) * 10, tx, ty); }
      c.fill(); c.lineWidth = 2.5; c.stroke();
    }
    c.restore();
  }, { t: 4.3, d: 0.8, reveal: 'rise' });
  // the Lekki-Ikoyi Link Bridge: one pylon, two fans of cables, a curved deck
  const px = 1330, ptop = 930, deckY = (x) => HZ - 30 - Math.sin(((x - 1170) / 360) * Math.PI) * 18;
  const cables = [];
  for (let k = 1; k <= 7; k++) {
    for (const s of [-1, 1]) { const x = px + s * k * 22; cables.push([[px, ptop + 14 + k * 6], [x, deckY(x)]]); }
  }
  p.group('island', { x: 1150, y: ptop - 20, w: 380, h: HZ - ptop + 20 }, (c) => {
    c.save(); inScene(c);
    c.strokeStyle = INK; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath();
    for (let x = 1170; x <= 1500; x += 10) x === 1170 ? c.moveTo(x, deckY(x)) : c.lineTo(x, deckY(x));
    c.stroke();
    c.strokeStyle = CREAM; c.lineWidth = 3; c.stroke();
    c.lineWidth = 4; c.strokeStyle = INK; c.beginPath();
    for (let x = 1190; x < 1500; x += 40) { c.moveTo(x, deckY(x)); c.lineTo(x, HZ); }
    c.stroke();
    ink(c, [[px - 9, deckY(px) + 4], [px - 5, ptop], [px + 5, ptop], [px + 9, deckY(px) + 4]], CREAM, 4);
    c.restore();
  }, { t: 4.0, d: 0.8, reveal: 'rise' });
  p.strokes('island', cables, INK, 2.2, { t: 4.6, d: 0.9, reveal: 'fall', box: { x: px - 170, y: ptop, w: 340, h: HZ - ptop } });
}

// ================================================================ the lagoon, patterned like adire
function lagoon(p, r) {
  p.group('lagoon', { x: SC.x, y: HZ, w: SC.w, h: SC.y + SC.h - HZ }, (c) => {
    c.fillStyle = BLUE; c.fillRect(SC.x, HZ + 10, SC.w, SC.y + SC.h - HZ - 10);
    // deeper bands toward us
    c.fillStyle = BLUE_D;
    for (let k = 0; k < 5; k++) { const y = HZ + 60 + k * k * 22 + k * 40; c.fillRect(SC.x, y, SC.w, 10 + k * 6); }
  }, { t: 4.4, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // the pattern: rows of motifs, small far off and larger near
  const circles = [], waves = [], spirals = [];
  let y = HZ + 30, row = 0;
  while (y < SC.y + SC.h - 10) {
    const s = 0.4 + ((y - HZ) / (SC.y + SC.h - HZ)) * 1.4;
    const step = 70 * s;
    for (let x = SC.x + (row % 2) * step / 2; x < SC.x + SC.w + step; x += step) {
      const k = (row + Math.round(x / step)) % 3;
      if (k === 0) circles.push([x, y, 11 * s]);
      else if (k === 1) waves.push([x, y, s]);
      else spirals.push([x, y, 10 * s]);
    }
    y += 34 * s + 8; row++;
  }
  const box = { x: SC.x, y: HZ, w: SC.w, h: SC.y + SC.h - HZ };
  p.group('lagoon', box, (c) => {
    c.save(); inScene(c);
    c.strokeStyle = CREAM; c.lineWidth = 3; c.beginPath();
    for (const [x, y, rr] of circles) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); c.moveTo(x + rr * 0.35, y); c.arc(x, y, rr * 0.35, 0, Math.PI * 2); }
    c.stroke(); c.restore();
  }, { t: 5.0, d: 0.8, reveal: 'wipe' });
  p.group('lagoon', box, (c) => {
    c.save(); inScene(c);
    c.strokeStyle = TEAL; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath();
    for (const [x, y, s] of waves) { c.moveTo(x - 22 * s, y); c.quadraticCurveTo(x - 11 * s, y - 10 * s, x, y); c.quadraticCurveTo(x + 11 * s, y + 10 * s, x + 22 * s, y); }
    c.stroke();
    c.strokeStyle = CREAM; c.lineWidth = 2.6; c.beginPath();
    for (const [x, y, rr] of spirals) { for (let k = 0; k <= 24; k++) { const a = k * 0.5, d = rr * (k / 24); const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; k ? c.lineTo(px, py) : c.moveTo(px, py); } }
    c.stroke(); c.restore();
  }, { t: 5.3, d: 0.8, reveal: 'wipeL' });
}

// ================================================================ Makoko's stilt houses
function makoko(p, r) {
  const huts = [];
  for (let x = 110; x < 560;) {
    const s = r.range(0.85, 1.15), w = 70 * s, base = r.range(1240, 1290);
    huts.push({ x, w, base, h: r.range(38, 54) * s, roof: r.pick([RUST, TEAL, RUST, TAN, '#9aa0a2']), legs: r.range(24, 40), door: r.chance(0.6) });
    x += w + r.range(6, 24);
  }
  huts.sort((a, b) => a.base - b.base);
  p.group('shore', { x: 90, y: 1150, w: 500, h: 220 }, (c) => {
    c.save(); inScene(c);
    for (const h of huts) {
      const top = h.base - h.h;
      // stilts
      c.strokeStyle = INK; c.lineWidth = 3.5; c.beginPath();
      for (let k = 0; k < 4; k++) { const x = h.x + 6 + k * (h.w - 12) / 3; c.moveTo(x, h.base); c.lineTo(x, h.base + h.legs); }
      c.stroke();
      // plank walls
      ink(c, wob(rng(h.x | 0), rectPts(h.x, top, h.w, h.h), 1, 20, true), TAN, 3.5);
      c.strokeStyle = BROWN; c.lineWidth = 1.6; c.beginPath();
      for (let yy = top + 7; yy < h.base; yy += 7) { c.moveTo(h.x + 2, yy); c.lineTo(h.x + h.w - 2, yy); }
      c.stroke();
      if (h.door) { c.fillStyle = INK; c.fillRect(h.x + h.w * 0.4, top + h.h * 0.35, h.w * 0.2, h.h * 0.65); }
      // the corrugated roof
      ink(c, [[h.x - 8, top + 2], [h.x + h.w * 0.5, top - 22], [h.x + h.w + 8, top + 2]], h.roof, 3.5);
      c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath();
      for (let k = 1; k < 8; k++) { const t = k / 8; c.moveTo(lerp(h.x - 8, h.x + h.w + 8, t), top + 2); c.lineTo(h.x + h.w * 0.5, top - 22); }
      c.stroke();
    }
    // canoes moored among the stilts
    for (const [x, y] of [[180, 1316], [380, 1324], [500, 1300]]) {
      ink(c, [[x - 46, y - 6], [x + 46, y - 6], [x + 34, y + 4], [x - 34, y + 4]], BROWN, 3);
    }
    c.restore();
  }, { t: 5.5, d: 1.1, reveal: 'rise', ease: 'out' });
}

// ================================================================ the National Arts Theatre
function theater(p, r) {
  const cx = 1312, by = 1470, rw = 158;
  const islandPts = wob(r, circlePts(cx, by + 14, rw + 70, 40, 0.22), 2, 20, true);
  p.group('shore', { x: cx - rw - 90, y: 1260, w: 2 * rw + 180, h: 330 }, (c) => {
    c.save(); inScene(c);
    ink(c, islandPts, GREEN, 4);
    // the drum, its pleated walls
    c.beginPath(); c.moveTo(cx - rw, by - 70); c.lineTo(cx - rw, by); c.ellipse(cx, by, rw, 30, 0, Math.PI, 0, true); c.lineTo(cx + rw, by - 70); c.closePath();
    c.fillStyle = CREAM; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.stroke();
    c.lineWidth = 2; c.beginPath();
    for (let k = 1; k < 16; k++) { const a = Math.PI - (k / 16) * Math.PI, x = cx + Math.cos(a) * rw; c.moveTo(x, by - 66); c.lineTo(x, by + Math.sin(a) * 30); }
    c.stroke();
    c.fillStyle = INK; c.beginPath(); c.ellipse(cx, by - 40, rw * 0.95, 8, 0, 0, Math.PI); c.fill();
    // the brim and the peaked cap of the roof
    c.beginPath(); c.ellipse(cx, by - 74, rw + 26, 22, 0, 0, Math.PI * 2); c.fillStyle = INK; c.fill();
    c.beginPath(); c.moveTo(cx - rw - 20, by - 76); c.quadraticCurveTo(cx - 60, by - 92, cx - 50, by - 150); c.lineTo(cx + 50, by - 150); c.quadraticCurveTo(cx + 60, by - 92, cx + rw + 20, by - 76); c.closePath();
    c.fillStyle = TEAL; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath();
    for (let k = -4; k <= 4; k++) { c.moveTo(cx + k * 40, by - 78); c.quadraticCurveTo(cx + k * 14, by - 100, cx + k * 11, by - 150); }
    c.stroke();
    c.beginPath(); c.ellipse(cx, by - 150, 52, 9, 0, 0, Math.PI * 2); c.fillStyle = YELLOW; c.fill(); c.lineWidth = 3.5; c.stroke();
    c.restore();
  }, { t: 6.0, d: 1.1, reveal: 'rise', ease: 'out' });
}

// ================================================================ the Third Mainland Bridge
const CL = spline([[-80, 1800], [240, 1690], [560, 1530], [780, 1405], [960, 1310], [1130, 1240], [1320, 1200], [1560, 1180]], 24);
const widthAt = (i) => lerp(340, 12, (i / (CL.length - 1)) ** 0.6);
function frameAt(i) {
  const a = CL[Math.max(0, i - 1)], b = CL[Math.min(CL.length - 1, i + 1)];
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  return { x: CL[i][0], y: CL[i][1], tx: dx / L, ty: dy / L, nx: -dy / L, ny: dx / L, w: widthAt(i) };
}
// a point on the deck: s along it (0 near, 1 far), off across it (-0.5 far edge, 0.5 near edge)
function deckAt(s, off) {
  const fi = s * (CL.length - 1), i = Math.min(CL.length - 2, Math.floor(fi)), f = fi - i;
  const A = frameAt(i), B = frameAt(i + 1);
  const x = lerp(A.x, B.x, f), y = lerp(A.y, B.y, f), w = lerp(A.w, B.w, f);
  return { x: x + A.nx * w * off, y: y + A.ny * w * off * 0.5, w, ang: Math.atan2(A.ty, A.tx) };
}
function bridge(p, r) {
  const far = [], near = [], foot = [];
  for (let i = 0; i < CL.length; i++) {
    const f = frameAt(i);
    far.push([f.x - f.nx * f.w * 0.5, f.y - f.ny * f.w * 0.5 * 0.5]);
    near.push([f.x + f.nx * f.w * 0.5, f.y + f.ny * f.w * 0.5 * 0.5]);
    foot.push([near[i][0], near[i][1] + f.w * 0.16]);
  }
  const deck = far.concat(near.slice().reverse());
  const fascia = near.concat(foot.slice().reverse());
  // the piers: many, close together, below the fascia
  const piers = [];
  for (let i = 2; i < CL.length; i += 3) { const f = frameAt(i); const [x, y] = foot[i]; piers.push([x, y, f.w * 0.09, f.w * 0.42]); }
  p.group('bridge', boxOf(foot.concat(far), 60), (c) => {
    c.save(); inScene(c);
    c.fillStyle = INK;
    for (const [x, y, pw, ph] of piers) { c.fillRect(x - pw, y - 4, pw * 2, ph); }
    c.fillStyle = CREAM; for (const [x, y, pw, ph] of piers) { c.fillRect(x - pw * 0.35, y + ph * 0.1, pw * 0.4, ph * 0.7); }
    c.restore();
  }, { t: 6.6, d: 1.0, reveal: 'wipeL', ease: 'inOut' });
  p.group('bridge', boxOf(foot.concat(far), 20), (c) => {
    c.save(); inScene(c);
    path(c, fascia); c.fillStyle = ORANGE; c.fill(); c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
    path(c, deck); c.fillStyle = '#5b5550'; c.fill(); c.stroke();
    // the lane markings and the curbs
    c.lineCap = 'round';
    c.strokeStyle = CREAM; c.lineWidth = 2; c.setLineDash([22, 18]); c.beginPath();
    for (let i = 0; i < CL.length; i++) { const f = frameAt(i); const x = f.x, y = f.y; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke(); c.setLineDash([]);
    c.strokeStyle = YELLOW; c.lineWidth = 5; path(c, far, false); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 4; path(c, far, false); c.stroke();
    c.restore();
  }, { t: 6.9, d: 1.2, reveal: 'wipeL', ease: 'inOut' });
  // the parapet on the near side, posts and rail, as a mark of its own
  const posts = [];
  for (let i = 1; i < CL.length; i += 2) { const [x, y] = near[i], h = widthAt(i) * 0.1; posts.push([[x, y], [x, y - h]]); }
  const rail = near.map(([x, y], i) => [x, y - widthAt(i) * 0.1]);
  p.group('bridge', boxOf(near, 40), (c) => {
    c.save(); inScene(c);
    c.strokeStyle = INK; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
    for (const [[x0, y0], [x1, y1]] of posts) { c.moveTo(x0, y0); c.lineTo(x1, y1); }
    c.stroke();
    c.lineWidth = 5; path(c, rail, false); c.stroke();
    c.restore();
  }, { t: 8.9, d: 0.9, reveal: 'wipeL' });

  // the go-slow: a jam of buses and cars on the far lane, set at build time
  const jam = [];
  for (let s = 0.13; s < 0.92;) {
    const d = deckAt(s, -0.24), size = d.w / 250;
    const kind = r.chance(0.72) ? 'bus' : r.pick(['red', 'blue', 'white']);
    jam.push({ s, kind, rack: r.chance(0.4), load: r.pick([RED, TEAL, ORANGE, CREAM]) });
    s += (kind === 'bus' ? 0.052 : 0.04) * Math.max(0.3, size ** 0.55) + 0.004;
  }
  // in groups of four, from the far end toward us
  const groups = [];
  for (let k = 0; k < jam.length; k += 4) groups.push(jam.slice(k, k + 4));
  groups.reverse().forEach((g, gi) => {
    const pts = g.map((v) => { const d = deckAt(v.s, -0.24); return [d.x, d.y]; });
    p.group('traffic', boxOf(pts, 120), (c) => {
      c.save(); inScene(c);
      for (const v of g.slice().reverse()) { const d = deckAt(v.s, -0.24); vehicle(c, d.x, d.y, d.w / 250, d.ang, v); }
      c.restore();
    }, { t: 7.4 + gi * 0.22, d: 0.6, reveal: 'drop', dy: 30 });
  });
}
// a danfo bus (yellow, two black stripes, a full roof rack sometimes) or a car,
// drawn on the deck at (x, y), its scale, the deck's angle
function vehicle(c, x, y, s, ang, v) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 4.5;
  if (v.kind === 'bus') {
    // the body: a box with a rounded nose to the left (heading toward us)
    c.beginPath(); c.moveTo(-58, 0); c.lineTo(-58, -40); c.quadraticCurveTo(-58, -56, -42, -58); c.lineTo(56, -58); c.lineTo(58, 0); c.closePath();
    c.fillStyle = YELLOW; c.fill(); c.stroke();
    c.fillStyle = INK; c.fillRect(-58, -22, 116, 6); c.fillRect(-58, -12, 116, 4);
    // windows
    c.fillStyle = '#2b3a44'; c.beginPath();
    c.moveTo(-54, -32); c.lineTo(-50, -50); c.lineTo(-38, -52); c.lineTo(-38, -32); c.closePath();
    for (let k = 0; k < 4; k++) c.rect(-30 + k * 22, -52, 17, 18);
    c.fill();
    if (v.rack) {
      c.fillStyle = v.load; c.fillRect(-36, -76, 70, 16); c.strokeRect(-36, -76, 70, 16);
      c.beginPath(); c.moveTo(-40, -58); c.lineTo(-40, -62); c.lineTo(38, -62); c.lineTo(38, -58); c.stroke();
    }
    wheels(c, [-36, 36], 11);
  } else {
    const col = v.kind === 'red' ? RED : v.kind === 'blue' ? BLUE : CREAM;
    c.beginPath(); c.moveTo(-44, 0); c.lineTo(-46, -18); c.lineTo(-24, -22); c.lineTo(-12, -38); c.lineTo(22, -38); c.lineTo(34, -22); c.lineTo(46, -20); c.lineTo(46, 0); c.closePath();
    c.fillStyle = col; c.fill(); c.stroke();
    c.fillStyle = '#2b3a44'; c.beginPath(); c.moveTo(-8, -34); c.lineTo(4, -34); c.lineTo(4, -23); c.lineTo(-18, -23); c.closePath(); c.rect(9, -34, 12, 11); c.fill();
    wheels(c, [-26, 28], 9);
  }
  c.restore();
}
function wheels(c, xs, rr) {
  for (const wx of xs) { c.beginPath(); c.arc(wx, 0, rr, 0, Math.PI * 2); c.fillStyle = INK; c.fill(); c.fillStyle = '#9aa0a2'; c.beginPath(); c.arc(wx, 0, rr * 0.4, 0, Math.PI * 2); c.fill(); }
}

// ================================================================ fishermen in the near lagoon
const BOATS = [[930, 1622, 1.25, 1], [1360, 1650, 1.45, -1], [720, 1720, 1.05, 1]];
function canoes(p, r) {
  BOATS.forEach(([x, y, s, dir], i) => {
    const hull = [[x - 120 * s, y - 14 * s], [x + 120 * s, y - 14 * s], [x + 96 * s, y + 10 * s], [x - 96 * s, y + 10 * s]];
    p.group('front', { x: x - 140 * s, y: y - 130 * s, w: 280 * s, h: 150 * s }, (c) => {
      c.save(); inScene(c);
      // a pale ripple under the hull
      c.strokeStyle = CREAM; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 140 * s, y + 18 * s); c.lineTo(x + 130 * s, y + 18 * s); c.stroke();
      ink(c, hull, BROWN, 4.5);
      c.fillStyle = INK; c.fillRect(x - 100 * s, y - 14 * s, 200 * s, 4 * s);
      // a seated paddler at the stern
      const px = x - dir * 70 * s;
      c.fillStyle = INK; c.beginPath(); c.arc(px, y - 46 * s, 9 * s, 0, Math.PI * 2); c.fill();
      ink(c, [[px - 10 * s, y - 14 * s], [px - 8 * s, y - 36 * s], [px + 8 * s, y - 36 * s], [px + 10 * s, y - 14 * s]], i % 2 ? TEAL : RED, 3);
      c.strokeStyle = INK; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(px + dir * 30 * s, y - 60 * s); c.lineTo(px - dir * 26 * s, y + 18 * s); c.stroke();
      c.restore();
    }, { t: 8.2 + i * 0.25, d: 0.7, reveal: 'rise' });
  });
}

// ================================================================ the strip at the foot of the sleeve
function strip(p, r) {
  const y0 = SC.y + SC.h + 14, y1 = SL.y + SL.h - 18;
  p.group('title', { x: SL.x + 10, y: y0 - 6, w: SL.w - 20, h: y1 - y0 + 12 }, (c) => {
    // adire squares: a checker of circles and crosses
    for (let k = 0; k < 2; k++) {
      const x0 = k ? SL.x + SL.w - 190 : SL.x + 30;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
        const x = x0 + i * 40, y = y0 + 8 + j * 40;
        c.fillStyle = (i + j) % 2 ? BLUE_D : BLUE; c.fillRect(x, y, 40, 40);
        c.strokeStyle = CREAM; c.lineWidth = 3; c.beginPath();
        if ((i + j) % 2) { c.arc(x + 20, y + 20, 11, 0, Math.PI * 2); } else { c.moveTo(x + 8, y + 8); c.lineTo(x + 32, y + 32); c.moveTo(x + 32, y + 8); c.lineTo(x + 8, y + 32); }
        c.stroke();
      }
      c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(x0, y0 + 8, 160, 80);
    }
    setText(c, 'SIDE A · EKO O NI BAJE', W / 2, y0 + 72, 58, CREAM, 0.04, 'center');
  }, { t: 9.2, d: 0.9, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ live things
function life(p, r) {
  // the record's label, turning: two inks, the side and the name, and the hole
  const [x, y] = REC;
  p.live('record', {
    t: 1.4, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      c.save(); c.beginPath(); c.rect(x - 200, y - 200, 400, 200); c.clip();
      c.translate(x, y); c.rotate(time * 0.9);
      c.fillStyle = RED; c.beginPath(); c.arc(0, 0, 150, 0, Math.PI * 2); c.fill();
      c.fillStyle = YELLOW; c.beginPath(); c.arc(0, 0, 150, -0.6, 0.6); c.lineTo(0, 0); c.closePath(); c.fill();
      c.beginPath(); c.arc(0, 0, 150, Math.PI - 0.6, Math.PI + 0.6); c.lineTo(0, 0); c.closePath(); c.fill();
      c.font = `400 40px ${FACE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK;
      c.fillText('LAGOS', 0, -88); c.font = `400 22px ${FACE}`; c.fillText('SIDE A · 33⅓', 0, 92);
      c.fillStyle = PAPER; c.beginPath(); c.arc(0, 0, 10, 0, Math.PI * 2); c.fill();
      c.restore();
    },
  });
  // buses running in the near lane, from the far end toward us and on out of the corner
  const runners = [0, 0.33, 0.66].map((ph, i) => ({ ph, kind: 'bus', rack: i !== 1, load: [RED, TEAL, ORANGE][i] }));
  p.live('live', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.save(); inScene(c);
      const list = runners.map((v) => ({ v, s: 1 - ((time * 0.028 + v.ph) % 1) }))
        .filter((o) => o.s > 0.02 && o.s < 0.9).sort((a, b) => b.s - a.s);
      for (const { v, s } of list) { const d = deckAt(s, 0.2); vehicle(c, d.x, d.y, d.w / 250, d.ang, v); }
      c.restore();
    },
  });
  // birds over the lagoon
  p.live('live', {
    t: 10.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.save(); inScene(c);
      c.strokeStyle = INK; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath();
      for (let i = 0; i < 6; i++) {
        const x = 300 + ((time * (16 + i * 3) + i * 230) % 1200), y = 900 + i * 26 + Math.sin(time * 0.8 + i) * 10;
        const f = Math.sin(time * 6 + i * 1.3) * 6, w = 14 - i * 0.8;
        c.moveTo(x - w, y - f); c.quadraticCurveTo(x - w * 0.4, y - 6, x, y); c.quadraticCurveTo(x + w * 0.4, y - 6, x + w, y - f);
      }
      c.stroke(); c.restore();
    },
  });
  // a cast net, thrown again and again from the middle canoe
  const [bx, by, bs] = BOATS[0];
  p.live('live', {
    t: 10.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const k = (time * 0.35) % 1, open = Math.sin(Math.min(1, k * 1.6) * Math.PI / 2);
      const fx = bx + 30 * bs, fy = by - 14 * bs;
      // the fisherman, standing, his arms following the throw
      c.fillStyle = INK; c.beginPath(); c.arc(fx, fy - 96 * bs, 10 * bs, 0, Math.PI * 2); c.fill();
      // legs apart on the gunwales, a wrapper at the hips, a bare torso
      c.strokeStyle = INK; c.lineWidth = 7 * bs; c.lineCap = 'round'; c.beginPath();
      c.moveTo(fx - 14 * bs, fy); c.lineTo(fx - 6 * bs, fy - 40 * bs); c.moveTo(fx + 14 * bs, fy); c.lineTo(fx + 6 * bs, fy - 40 * bs); c.stroke();
      ink(c, [[fx - 15 * bs, fy - 30 * bs], [fx - 12 * bs, fy - 52 * bs], [fx + 12 * bs, fy - 52 * bs], [fx + 15 * bs, fy - 30 * bs]], YELLOW, 3);
      ink(c, [[fx - 11 * bs, fy - 52 * bs], [fx - 13 * bs, fy - 84 * bs], [fx + 13 * bs, fy - 84 * bs], [fx + 11 * bs, fy - 52 * bs]], BROWN, 3);
      c.strokeStyle = INK; c.lineWidth = 6 * bs; c.beginPath(); c.moveTo(fx - 10 * bs, fy - 80 * bs); c.lineTo(fx - 26 * bs, fy - 60 * bs + open * 10 * bs); c.stroke();
      const nx = fx + (60 + 90 * open) * bs, ny = fy - (100 - 40 * open) * bs, rad = (14 + 56 * open) * bs;
      c.strokeStyle = INK; c.lineWidth = 6 * bs; c.beginPath(); c.moveTo(fx + 10 * bs, fy - 80 * bs); c.lineTo(fx + (24 + 16 * open) * bs, fy - (104 - 20 * open) * bs); c.stroke();
      c.lineWidth = 2.5; c.beginPath(); c.moveTo(fx + (24 + 16 * open) * bs, fy - (104 - 20 * open) * bs); c.lineTo(nx - rad * 0.6, ny); c.stroke();
      c.lineWidth = 2; c.beginPath();
      c.ellipse(nx, ny, rad, rad * 0.45, -0.15, 0, Math.PI * 2);
      for (let j = 0; j < 8; j++) { const a = (j / 8) * Math.PI * 2; c.moveTo(nx, ny - rad * 0.2); c.lineTo(nx + Math.cos(a) * rad, ny + Math.sin(a) * rad * 0.45); }
      c.stroke();
    },
  });
}

// ================================================================ the name
function title(p, r) {
  const y = 760;
  const res = p.type('title', 'LAGOS', W / 2, y, {
    family: FACE, size: 320, color: YELLOW, align: 'center', track: 0.02, fit: SL.w - 120,
    t: 10.6, gap: 0.26, d: 0.8, reveal: 'drop', ease: 'back',
  });
  const f = `400 ${res.size}px ${FACE}`;
  res.glyphs.forEach((m, i) => {
    const ch = 'LAGOS'[i], gx = m.box.x + res.size * 0.15;
    m.dy = 70;
    m.box = { ...m.box, y: m.box.y - 30, h: m.box.h + 60, w: m.box.w + 40 };
    m.draw = (c) => {
      c.font = f; c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.lineJoin = 'round';
      // a hard black shadow, a red step, then the letter outlined
      c.fillStyle = INK; c.fillText(ch, gx + 22, y + 22);
      c.fillStyle = RED; c.fillText(ch, gx + 11, y + 11);
      c.strokeStyle = INK; c.lineWidth = 9; c.strokeText(ch, gx + 11, y + 11);
      c.fillStyle = i % 2 ? ORANGE : YELLOW; c.fillText(ch, gx, y);
      c.lineWidth = 8; c.strokeText(ch, gx, y);
      // a highlight cut into each letter
      c.save(); c.beginPath(); c.rect(gx, y - res.size * 0.74, m.box.w, res.size * 0.16); c.clip();
      c.fillStyle = 'rgba(255,255,255,.28)'; c.fillText(ch, gx, y); c.restore();
    };
  });
}
