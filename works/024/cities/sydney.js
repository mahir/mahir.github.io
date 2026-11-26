// Sydney: a 1930s Australian railway-and-shipping poster, in cream and coral. The
// harbor at sundown from Mrs Macquarie's Point: the Harbour Bridge's arch across
// the sheet with the sun set inside it and its rays fanning out behind, the Opera
// House's sails on Bennelong Point in front, the city's towers and Sydney Tower
// on the left, Fort Denison in the water, ferries and yachts, and a smooth-barked
// red gum leaning in from the right with cockatoos in it.

import { Plate, W, boxOf } from '../print.js';
import { mix, lerp, clamp, poly, rng } from '../kit.js';

// the inks: cream and coral, a deep harbor teal and a steel navy
const CREAM = '#f5e7cc', CREAM_L = '#fbf2df', SAND = '#ead2a8', RAY = '#f3d3b4', RAY2 = '#efc3a2';
const CORAL = '#e8735a', CORAL_D = '#c4513f', CORAL_L = '#f4a088', APRICOT = '#f5b27a', GOLD = '#e9a93d';
const NAVY = '#1f2a44', STEEL = '#2c3753', STEEL_L = '#59627d', STEEL_F = '#8b8ea0';
const TEAL = '#2d7781', TEAL_D = '#1d5360', TEAL_L = '#5fa5a0', TEAL_P = '#9fcbbf';
const STONE = '#d8b58a', STONE_D = '#b38d65', STONE_L = '#ead0a8';
const GUM = '#5d8c6c', GUM_D = '#365f50', GUM_L = '#8db592', BARK = '#e59a7d', BARK_D = '#c06f58';
const FERRY = '#2f6a4d';

export const city = {
  id: 'sydney', name: 'Sydney', wall: '#24324a',
  alt: "The harbor at Sydney at sundown in 1930s poster style, the Harbour Bridge's arch with the sun set inside it and rays fanning out behind, the Opera House's sails, the city's towers and Sydney Tower, Fort Denison, ferries and yachts on the water, and a red gum with cockatoos",
  google: 'family=Poller+One&family=Poiret+One',
  fonts: [['400 240px "Poller One"', 'SYDNEY'], ['400 30px "Poiret One"', 'NEW SOUTH WALES · AUSTRALIA']],
  build,
};

// the picture inside its frame, and the band for the title below it
const PX = 70, PY = 70, PR = W - 70, PB = 1560, PW = PR - PX, PH = PB - PY;
const WL = 1090; // the far waterline under the bridge
// the bridge, seen side on: the arch's bearings, the deck and the pylons
const XA = 236, XB = 1376, SPAN = XB - XA, XM = (XA + XB) / 2;
const BEAR = WL - 10, DECK = 978, PYL = 884, PYW = 124;
const LOW = 306, UP_END = 128, UP_TOP = 346; // heights above the bearings
const yLow = (x) => BEAR - LOW * (1 - ((x - XM) / (SPAN / 2)) ** 2);
const yUp = (x) => BEAR - UP_END - (UP_TOP - UP_END) * (1 - ((x - XM) / (SPAN / 2)) ** 2);
// the sun, set inside the arch
const SX = 820, SY = 1062, SR = 150;

function build() {
  const p = new Plate({ paper: CREAM, seed: 1932 });
  const r = p.r;
  p.clip = { x: PX, y: PY, w: PW, h: PH };
  p.stack('sky', 'land', 'bridge', 'deck', 'traffic', 'pylons', 'water', 'opera', 'boats', 'gum', 'birds', 'title');
  p.layer('title', { clip: false });

  frame(p);
  sky(p, r);
  far(p, r);
  skyline(p, r);
  sydneyTower(p);
  northShore(p, r);
  bridge(p, r);
  water(p, r);
  gardens(p, r);
  opera(p, r);
  fort(p, r);
  rock(p, r);
  gum(p, r);
  life(p, r);
  title(p);
  return p;
}

// ================================================================ the frame
// a deco frame: navy rule, a coral rule inside it, the corners stepped
function stepped(x0, y0, x1, y1, s) {
  return [[x0 + 2 * s, y0], [x1 - 2 * s, y0], [x1 - 2 * s, y0 + s], [x1 - s, y0 + s], [x1 - s, y0 + 2 * s], [x1, y0 + 2 * s],
    [x1, y1 - 2 * s], [x1 - s, y1 - 2 * s], [x1 - s, y1 - s], [x1 - 2 * s, y1 - s], [x1 - 2 * s, y1],
    [x0 + 2 * s, y1], [x0 + 2 * s, y1 - s], [x0 + s, y1 - s], [x0 + s, y1 - 2 * s], [x0, y1 - 2 * s],
    [x0, y0 + 2 * s], [x0 + s, y0 + 2 * s], [x0 + s, y0 + s], [x0 + 2 * s, y0 + s], [x0 + 2 * s, y0]];
}
function frame(p) {
  // the cream margin outside the picture is the paper; the rules are drawn last, over the picture's edge
  const outer = stepped(34, 34, W - 34, 2000 - 34, 18);
  p.pen('title', outer, NAVY, 3, { t: 0.1, d: 1.6, cap: 'square' });
  const inner = stepped(46, 46, W - 46, 2000 - 46, 14);
  p.pen('title', inner, CORAL, 1.6, { t: 0.4, d: 1.6, cap: 'square' });
}

// ================================================================ the sky
function sky(p, r) {
  p.group('sky', { x: PX, y: PY, w: PW, h: WL - PY + 10 }, (c) => {
    const g = c.createLinearGradient(0, PY, 0, WL);
    g.addColorStop(0, CREAM_L); g.addColorStop(0.55, CREAM); g.addColorStop(1, '#f8d7b2');
    c.fillStyle = g; c.fillRect(PX, PY, PW, WL - PY + 10);
  }, { t: 0.2, d: 1.4, reveal: 'fall', ease: 'inOut' });

  // the rays: wedges shot out from the sun, one at a time from the middle outward
  const N = 34, R = 1700;
  const order = [];
  for (let i = 0; i < N; i++) order.push(i);
  // straight up first, then out to both sides
  order.sort((a, b) => Math.abs(a - N / 2 + 0.5) - Math.abs(b - N / 2 + 0.5));
  order.forEach((i, k) => {
    if (i % 2) return;
    const a0 = Math.PI + (i / N) * Math.PI, a1 = Math.PI + ((i + 1) / N) * Math.PI;
    const near = 1 - Math.abs(i - N / 2 + 0.5) / (N / 2);
    const col = mix(RAY2, RAY, 1 - near * 0.6);
    p.mark('sky', {
      t: 1.0 + k * 0.045, d: 0.9, reveal: 'draw', ease: 'out',
      box: { x: PX, y: PY, w: PW, h: WL - PY },
      draw: (c, q) => {
        const L = SR + 40 + (R - SR) * q;
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(SX + Math.cos(a0) * (SR + 34), SY + Math.sin(a0) * (SR + 34));
        c.lineTo(SX + Math.cos(a0) * L, SY + Math.sin(a0) * L);
        c.lineTo(SX + Math.cos(a1) * L, SY + Math.sin(a1) * L);
        c.lineTo(SX + Math.cos(a1) * (SR + 34), SY + Math.sin(a1) * (SR + 34));
        c.closePath(); c.fill();
      },
    });
  });
  // fine lines down the middle of the cream rays, the way a poster artist ruled them
  const fine = [];
  for (let i = 1; i < N; i += 2) {
    const a = Math.PI + ((i + 0.5) / N) * Math.PI;
    fine.push([[SX + Math.cos(a) * (SR + 70), SY + Math.sin(a) * (SR + 70)], [SX + Math.cos(a) * R, SY + Math.sin(a) * R]]);
  }
  p.strokes('sky', fine, 'rgba(232,115,90,.28)', 1.2, { t: 2.7, d: 0.8, reveal: 'fade', box: { x: PX, y: PY, w: PW, h: WL - PY } });

  // the sun: a coral disc with its rings
  p.group('sky', { x: SX - SR - 80, y: SY - SR - 80, w: 2 * SR + 160, h: SR + 90 }, (c) => {
    for (let k = 3; k >= 1; k--) {
      c.strokeStyle = mix(CORAL_L, CREAM, 0.25 * k); c.lineWidth = 3;
      c.beginPath(); c.arc(SX, SY, SR + 16 * k, Math.PI, 0); c.stroke();
    }
    const g = c.createLinearGradient(0, SY - SR, 0, SY);
    g.addColorStop(0, APRICOT); g.addColorStop(0.5, CORAL_L); g.addColorStop(1, CORAL);
    c.fillStyle = g; c.beginPath(); c.arc(SX, SY, SR, 0, Math.PI * 2); c.fill();
    // the lower half of the disc, banded as it sinks
    c.fillStyle = CREAM_L;
    for (let k = 0; k < 6; k++) { const y = SY - 64 + k * 15; c.fillRect(SX - SR, y, 2 * SR, 2 + k * 1.4); }
  }, { t: 1.3, d: 1.5, reveal: 'rise', ease: 'out' });

  // long streamlined clouds, cream with coral undersides
  const clouds = [[180, 360, 420, 30], [1040, 300, 380, 26], [920, 520, 520, 24], [140, 640, 300, 20], [1200, 690, 240, 18]];
  clouds.forEach(([x, y, w, h], i) => {
    p.group('sky', { x: x - 10, y: y - h - 6, w: w + h + 20, h: 2 * h + 20 }, (c) => {
      const lane = (yy, x0, x1, hh, col) => {
        c.fillStyle = col; c.beginPath();
        c.moveTo(x0 + hh / 2, yy - hh / 2); c.lineTo(x1 - hh / 2, yy - hh / 2); c.arc(x1 - hh / 2, yy, hh / 2, -Math.PI / 2, Math.PI / 2);
        c.lineTo(x0 + hh / 2, yy + hh / 2); c.arc(x0 + hh / 2, yy, hh / 2, Math.PI / 2, Math.PI * 1.5); c.fill();
      };
      lane(y - h * 0.55, x + w * 0.22, x + w * 0.7, h * 0.8, CREAM_L);
      lane(y, x, x + w, h, CREAM_L);
      lane(y + h * 0.42, x + w * 0.12, x + w * 0.92, h * 0.34, CORAL_L);
      c.fillStyle = 'rgba(232,115,90,.35)'; c.fillRect(x + w * 0.2, y + h * 0.14, w * 0.6, 2);
    }, { t: 2.9 + i * 0.22, d: 1.1, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ================================================================ far hills under the sun
function far(p, r) {
  const pts = [[PX, WL + 4]];
  for (let x = PX; x <= PR; x += 10) pts.push([x, WL - 26 - 10 * Math.sin(x * 0.006 + 1) - 6 * Math.sin(x * 0.021)]);
  pts.push([PR, WL + 4]);
  // a row of small houses and trees along the ridge, very faint
  const rr = rng(71), bits = [];
  for (let x = PX + 6; x < PR; x += 7 + rr() * 9) {
    const y = WL - 22 - 10 * Math.sin(x * 0.006 + 1) - 6 * Math.sin(x * 0.021);
    bits.push(rr() < 0.5 ? [x, y + 2, 3 + rr() * 3] : [x, y - 4 - rr() * 5, 5 + rr() * 5, 10]);
  }
  p.group('land', boxOf(pts, 3), (c) => {
    c.fillStyle = mix(CORAL_L, STEEL_F, 0.45); poly(c, pts); c.fill();
    c.fillStyle = mix(CORAL_L, STEEL_F, 0.62);
    for (const b of bits) { if (b.length === 3) { c.beginPath(); c.arc(b[0], b[1], b[2], 0, Math.PI * 2); c.fill(); } else c.fillRect(...b); }
  }, { t: 2.3, d: 1.0, reveal: 'rise' });
}

// ================================================================ the city, left
function skyline(p, r) {
  // stepped towers between the frame and the bridge's south pylon; t climbs left to right
  const towers = [];
  let x = PX - 10;
  const rr = rng(33);
  while (x < 560) {
    const w = rr.range(44, 96);
    const top = 640 + rr() * 240 + Math.max(0, (x - 330)) * 0.6;
    towers.push({ x, w, top, steps: rr.int(1, 3), col: rr.pick([STONE_L, SAND, '#efd8b8', '#e8c6a5', CORAL_L]), crown: rr.int(0, 3) });
    x += w * rr.range(0.65, 0.95);
  }
  // draw the far ones first: taller ones behind
  towers.sort((a, b) => a.top - b.top);
  towers.forEach((tw, i) => {
    const box = { x: tw.x - 4, y: tw.top - 60, w: tw.w + 8, h: WL - tw.top + 70 };
    p.group('land', box, (c) => tower(c, tw), { t: 3.0 + i * 0.07, d: 0.8, reveal: 'rise', ease: 'out' });
  });
}
// a deco tower: setbacks, piers of windows, a lit west face
function tower(c, tw) {
  const { x, w, top, steps, col } = tw;
  const lit = mix(col, '#fff1de', 0.35), shd = mix(col, STEEL, 0.28);
  let y = top, x0 = x, x1 = x + w;
  // the tiers, each narrower and taller up
  const tiers = [];
  for (let s = 0; s < steps; s++) {
    const inset = (steps - 1 - s) * w * 0.12;
    tiers.push([x0 + inset, x1 - inset, top + s * 46]);
  }
  for (let s = steps - 1; s >= 0; s--) {
    const [a, b, ty] = tiers[s];
    c.fillStyle = col; c.fillRect(a, ty, b - a, WL - ty);
    c.fillStyle = shd; c.fillRect(b - (b - a) * 0.3, ty, (b - a) * 0.3, WL - ty);
    c.fillStyle = lit; c.fillRect(a, ty, 3, WL - ty);
    // the window piers: thin vertical slots
    c.fillStyle = mix(col, NAVY, 0.45);
    const n = Math.max(2, Math.round((b - a) / 11));
    for (let k = 0; k < n; k++) {
      const wx = a + ((k + 0.5) / n) * (b - a) - 1.6;
      c.fillRect(wx, ty + 10, 3.2, WL - ty - 10);
    }
    // the spandrels across them, every story
    c.fillStyle = col;
    for (let yy = ty + 18; yy < WL; yy += 9) c.fillRect(a + 3, yy, b - a - 6, 2.6);
    c.strokeStyle = 'rgba(31,42,68,.55)'; c.lineWidth = 1; c.strokeRect(a + 0.5, ty + 0.5, b - a - 1, WL - ty);
  }
  // crowns: a fin, a stepped cap or a mast
  const [a, b, ty] = tiers[0];
  const m = (a + b) / 2;
  c.fillStyle = col;
  if (tw.crown === 0) { c.fillRect(m - 4, ty - 34, 8, 34); c.fillStyle = shd; c.fillRect(m + 1, ty - 34, 3, 34); }
  else if (tw.crown === 1) { c.fillRect(a + 6, ty - 10, b - a - 12, 10); c.fillRect(a + 14, ty - 18, b - a - 28, 8); }
  else if (tw.crown === 2) { c.strokeStyle = NAVY; c.lineWidth = 1.4; c.beginPath(); c.moveTo(m, ty); c.lineTo(m, ty - 44); c.stroke(); }
}

// Sydney Tower: a thin shaft held by cables, the gold turret, the spire
function sydneyTower(p) {
  const x = 470, base = WL, tb = 500, tt = 430, sp = 300;
  p.group('land', { x: x - 60, y: sp - 10, w: 120, h: base - sp + 10 }, (c) => {
    // the cables, fanned
    c.strokeStyle = 'rgba(44,55,83,.55)'; c.lineWidth = 1;
    c.beginPath();
    for (let k = -3; k <= 3; k++) { c.moveTo(x + k * 7, base); c.lineTo(x + k * 1.2, tb + 40); }
    c.stroke();
    // the shaft
    c.fillStyle = STONE_L; c.fillRect(x - 6, tb, 12, base - tb);
    c.fillStyle = STONE_D; c.fillRect(x + 1, tb, 5, base - tb);
    // the turret: a squat drum of gold glass in bands
    const tw = 52;
    c.fillStyle = GOLD; c.beginPath(); c.moveTo(x - tw * 0.55, tb); c.lineTo(x - tw / 2, tt + 18); c.lineTo(x + tw / 2, tt + 18); c.lineTo(x + tw * 0.55, tb); c.closePath(); c.fill();
    c.fillStyle = '#c98a2c';
    for (let k = 0; k < 7; k++) c.fillRect(x - tw / 2, tt + 22 + k * 8, tw, 2);
    c.fillStyle = mix(GOLD, CORAL_D, 0.3); c.fillRect(x + tw * 0.18, tt + 18, tw * 0.32, tb - tt - 18);
    c.fillStyle = CREAM_L; c.fillRect(x - tw / 2 - 4, tt + 12, tw + 8, 6); c.fillRect(x - tw * 0.55 - 3, tb - 2, tw * 1.1 + 6, 5);
    c.fillStyle = STEEL; c.fillRect(x - tw * 0.36, tt, tw * 0.72, 13);
    // the spire and its mast
    c.fillStyle = STONE_L; c.fillRect(x - 3, sp + 40, 6, tt - sp - 40);
    c.strokeStyle = NAVY; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, sp + 40); c.lineTo(x, sp); c.stroke();
    c.strokeStyle = 'rgba(31,42,68,.7)'; c.lineWidth = 1; c.strokeRect(x - 6, tb, 12, base - tb);
  }, { t: 3.7, d: 1.3, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the north shore
function northShore(p, r) {
  // Milsons Point and Kirribilli: a low green shore with houses and pines, under the north end
  const yAt = (x) => WL - 28 - 26 * clamp((x - 1200) / 200) - 8 * Math.sin(x * 0.03);
  const pts = [[1040, WL + 2]];
  for (let x = 1040; x <= PR; x += 8) pts.push([x, yAt(x) + 22 * clamp((1160 - x) / 120)]);
  pts.push([PR, WL + 2]);
  p.group('land', boxOf(pts, 2), (c) => {
    c.fillStyle = mix(GUM, CORAL_L, 0.25); poly(c, pts); c.fill();
  }, { t: 2.6, d: 0.8, reveal: 'rise' });
  // houses, red roofs and cream walls, and a few dark pines
  const items = [];
  const rr = rng(55);
  for (let x = 1090; x < PR - 6; x += rr.range(12, 22)) {
    const y = yAt(x) + 22 * clamp((1160 - x) / 120) + rr.range(4, 22);
    items.push([x, y, rr.int(0, 4), rr.range(10, 18)]);
  }
  p.group('land', { x: 1060, y: WL - 160, w: PR - 1060, h: 170 }, (c) => {
    for (const [x, y, k, w] of items) {
      if (k === 0) { // a pine
        c.fillStyle = GUM_D; c.beginPath(); c.moveTo(x, y - w * 2.4); c.lineTo(x + w * 0.4, y); c.lineTo(x - w * 0.4, y); c.closePath(); c.fill();
        continue;
      }
      if (k === 4) { // a block of flats
        c.fillStyle = '#efd8b8'; c.fillRect(x, y - w * 2.2, w * 1.3, w * 2.2);
        c.fillStyle = 'rgba(31,42,68,.55)'; for (let j = 0; j < 4; j++) c.fillRect(x + 2, y - w * 2.2 + 4 + j * w * 0.5, w * 1.3 - 4, 1.6);
        continue;
      }
      c.fillStyle = CREAM_L; c.fillRect(x, y - w * 0.6, w, w * 0.6);
      c.fillStyle = k === 1 ? CORAL_D : CORAL;
      poly(c, [[x - 2, y - w * 0.6], [x + w / 2, y - w], [x + w + 2, y - w * 0.6]]); c.fill();
      c.fillStyle = NAVY; c.fillRect(x + w * 0.3, y - w * 0.4, 2, 3);
    }
  }, { t: 3.2, d: 0.9, reveal: 'rise' });
}

// ================================================================ the bridge
function bridge(p, r) {
  const N = 28, dx = SPAN / N;
  const px = (i) => XA + i * dx;
  // the far truss, behind and a little up the hill: pale, simple
  const off = [-16, -10];
  const backLines = [];
  for (let i = 0; i <= N; i++) {
    const x = px(i);
    backLines.push([[x + off[0], yUp(x) + off[1]], [x + off[0], Math.min(yLow(x), DECK) + off[1]]]);
  }
  const chord = (f, o = [0, 0], a = XA, b = XB) => { const pts = []; for (let x = a; x <= b + 0.1; x += dx / 4) pts.push([x + o[0], f(x) + o[1]]); return pts; };
  p.pen('land', chord(yLow, off), STEEL_F, 5, { t: 4.0, d: 1.6 });
  p.pen('land', chord(yUp, off), STEEL_F, 3.5, { t: 4.1, d: 1.6 });
  p.strokes('land', backLines, STEEL_F, 1.6, { t: 5.2, d: 0.8, reveal: 'fade' });

  // the near truss, built out from both shores at once and joined at the crown, as it was in 1930
  const half = N / 2;
  for (let k = 0; k < half; k++) {
    for (const side of [0, 1]) {
      const i = side ? N - 1 - k : k; // the panel from x(i) to x(i+1)
      const a = px(i), b = px(i + 1);
      const lines = [];
      // the post at the panel point nearer the shore, and the diagonal, sloping toward mid-span
      const xo = side ? b : a, xi = side ? a : b;
      lines.push([[xo, yUp(xo)], [xo, yLow(xo)]]);
      lines.push([[xo, yLow(xo)], [xi, yUp(xi)]]);
      // the X bracing in the deeper end panels
      if (k < 5) lines.push([[xo, yUp(xo)], [xi, yLow(xi)]]);
      const box = boxOf(lines.flat(), 8);
      const t = 4.2 + k * 0.13;
      p.strokes('bridge', lines, STEEL, 2.6, { t, d: 0.4, reveal: 'fade', box });
      // the chords along this panel, thick
      p.mark('bridge', {
        t, d: 0.4, reveal: side ? 'wipeL' : 'wipe', box,
        draw: (c) => {
          c.strokeStyle = STEEL; c.lineCap = 'round';
          c.lineWidth = 8; c.beginPath(); c.moveTo(a, yLow(a)); for (let s = 1; s <= 4; s++) { const x = lerp(a, b, s / 4); c.lineTo(x, yLow(x)); } c.stroke();
          c.lineWidth = 6; c.beginPath(); c.moveTo(a, yUp(a)); for (let s = 1; s <= 4; s++) { const x = lerp(a, b, s / 4); c.lineTo(x, yUp(x)); } c.stroke();
          // a light edge on the chords' upper sides, toward the sun
          c.strokeStyle = 'rgba(244,160,136,.55)'; c.lineWidth = 1.4;
          c.beginPath(); c.moveTo(a, yLow(a) + 3); for (let s = 1; s <= 4; s++) { const x = lerp(a, b, s / 4); c.lineTo(x, yLow(x) + 3); } c.stroke();
        },
      });
    }
  }
  // the last post at the crown
  p.strokes('bridge', [[[XM, yUp(XM)], [XM, yLow(XM)]]], STEEL, 3, { t: 6.05, d: 0.3, reveal: 'fall' });

  // the deck, run out from both pylons, and the hangers dropped to it
  p.mark('deck', {
    t: 6.0, d: 0.9, reveal: 'draw', ease: 'inOut', box: { x: PX, y: DECK - 30, w: PW, h: 60 },
    draw: (c, q) => {
      const half = (PR - PX) / 2 * q, mid = XM;
      c.save(); c.beginPath(); c.rect(PX, DECK - 30, half, 60); c.rect(PR - half, DECK - 30, half, 60); c.clip();
      c.fillStyle = STEEL; c.fillRect(PX, DECK - 4, PW, 18);
      c.fillStyle = STEEL_L; c.fillRect(PX, DECK + 6, PW, 3);
      // the parapet rail and its posts
      c.fillStyle = STEEL; c.fillRect(PX, DECK - 14, PW, 2.4);
      for (let x = PX; x < PR; x += 9) c.fillRect(x, DECK - 14, 1.4, 10);
      // lamp standards along the deck
      for (let x = PX + 20; x < PR; x += 64) { c.fillRect(x, DECK - 30, 1.6, 26); c.fillRect(x - 3, DECK - 31, 7, 2.4); }
      c.restore();
    },
  });
  const hang = [], posts = [];
  for (let i = 1; i < N; i++) {
    const x = px(i);
    if (yLow(x) < DECK - 4) hang.push([[x, yLow(x) + 3], [x, DECK - 4]]);
    else posts.push([[x, DECK + 10], [x, yLow(x)]]);
  }
  p.strokes('deck', hang, STEEL, 1.8, { t: 6.7, d: 0.5, reveal: 'fall' });
  p.strokes('deck', posts, STEEL, 3.2, { t: 6.8, d: 0.4, reveal: 'fall' });

  // the approach spans beyond the north pylon, on stone piers
  const ap = [];
  for (let x = XB + PYW + 4; x < PR + 40; x += 56) ap.push(x);
  p.group('deck', { x: XB + PYW, y: DECK - 6, w: PR - XB - PYW + 4, h: WL - DECK + 20 }, (c) => {
    for (const x of ap) {
      c.fillStyle = STONE; c.fillRect(x, DECK + 14, 16, WL - DECK);
      c.fillStyle = STONE_D; c.fillRect(x + 10, DECK + 14, 6, WL - DECK);
    }
    c.strokeStyle = STEEL; c.lineWidth = 1.4; c.beginPath();
    for (let x = XB + PYW; x < PR; x += 14) { c.moveTo(x, DECK + 14); c.lineTo(x + 7, DECK + 30); c.lineTo(x + 14, DECK + 14); }
    c.stroke(); c.fillStyle = STEEL; c.fillRect(XB + PYW, DECK + 29, PR - XB - PYW, 3);
  }, { t: 6.9, d: 0.6, reveal: 'wipe' });

  // the pylons, granite, standing before the truss ends
  pylon(p, XA - PYW - 2, 3.6);
  pylon(p, XB + 2, 3.75);
}
function pylon(p, x0, t) {
  const w = PYW, top = PYL, foot = WL + 6;
  p.group('pylons', { x: x0 - 10, y: top - 40, w: w + 20, h: foot - top + 50 }, (c) => {
    const body = [[x0, foot], [x0 + 4, top + 30], [x0 + 10, top + 30], [x0 + 10, top + 12], [x0 + w - 10, top + 12], [x0 + w - 10, top + 30], [x0 + w - 4, top + 30], [x0 + w, foot]];
    c.fillStyle = STONE; poly(c, body); c.fill();
    // the sun's side lit, the other in shade
    c.fillStyle = STONE_D; poly(c, [[x0 + w * 0.62, foot], [x0 + w * 0.62, top + 12], [x0 + w - 10, top + 12], [x0 + w - 10, top + 30], [x0 + w - 4, top + 30], [x0 + w, foot]]); c.fill();
    // the coursing of the granite blocks
    c.strokeStyle = 'rgba(120,86,56,.45)'; c.lineWidth = 1;
    c.beginPath();
    for (let y = top + 36, k = 0; y < foot; y += 11, k++) {
      c.moveTo(x0 + 3, y); c.lineTo(x0 + w - 3, y);
      for (let x = x0 + 8 + (k % 2) * 11; x < x0 + w - 4; x += 22) { c.moveTo(x, y); c.lineTo(x, y + 11); }
    }
    c.stroke();
    // the two recessed bays and their deco steps
    for (const f of [0.28, 0.72]) {
      const bx = x0 + w * f;
      c.fillStyle = f < 0.5 ? STONE_D : mix(STONE_D, STEEL, 0.3);
      c.fillRect(bx - 7, top + 44, 14, 110);
      c.fillRect(bx - 4, top + 36, 8, 8);
    }
    // the portal the deck runs through
    c.fillStyle = STEEL;
    c.beginPath(); c.moveTo(x0 + 26, DECK + 14); c.lineTo(x0 + 26, DECK - 14); c.arc(x0 + w / 2, DECK - 14, w / 2 - 26, Math.PI, 0); c.lineTo(x0 + w - 26, DECK + 14); c.closePath(); c.fill();
    c.strokeStyle = STONE_L; c.lineWidth = 3; c.beginPath(); c.arc(x0 + w / 2, DECK - 14, w / 2 - 22, Math.PI, 0); c.stroke();
    c.fillStyle = 'rgba(244,160,136,.6)'; c.fillRect(x0 + 26, DECK + 14, w - 52, 3);
    // the cap: a stepped parapet
    c.fillStyle = STONE_L; c.fillRect(x0 + 6, top + 26, w - 12, 6); c.fillRect(x0 + 14, top + 8, w - 28, 5);
    c.fillStyle = STONE; c.fillRect(x0 + w / 2 - 14, top - 4, 28, 14); c.fillRect(x0 + w / 2 - 7, top - 12, 14, 8);
    c.strokeStyle = 'rgba(31,42,68,.6)'; c.lineWidth = 1.2; poly(c, body); c.stroke();
    // the foot in the water: the abutment
    c.fillStyle = STONE_D; c.fillRect(x0 - 8, foot - 22, w + 16, 22);
    c.fillStyle = STONE; c.fillRect(x0 - 8, foot - 22, w + 16, 4);
  }, { t, d: 1.1, reveal: 'rise', ease: 'out' });
}

// ================================================================ the harbor
function water(p, r) {
  // bands of teal, stepped darker toward us, each with a scalloped top edge
  const bands = [];
  let y = WL, h = 8;
  while (y < PB) { bands.push([y, h]); y += h; h *= 1.17; }
  p.group('water', { x: PX, y: WL - 4, w: PW, h: PB - WL + 8 }, (c) => {
    c.fillStyle = TEAL_L; c.fillRect(PX, WL, PW, PB - WL);
  }, { t: 4.8, d: 0.9, reveal: 'fall' });
  bands.forEach(([y, h], i) => {
    const k = i / (bands.length - 1);
    const col = mix(TEAL_L, TEAL_D, 0.15 + k * 0.85);
    const sc = 6 + h * 0.9;
    p.group('water', { x: PX, y: y - sc, w: PW, h: PB - y + sc }, (c) => {
      c.fillStyle = col;
      c.beginPath(); c.moveTo(PX, PB);
      for (let x = PX - (i % 2) * sc; x <= PR + sc; x += sc * 2) { c.lineTo(x, y + h * 0.55); c.quadraticCurveTo(x + sc, y - h * 0.2, x + sc * 2, y + h * 0.55); }
      c.lineTo(PR, PB); c.closePath(); c.fill();
      // a pale crest along each scallop
      c.strokeStyle = `rgba(214,236,226,${0.18 + 0.2 * k})`; c.lineWidth = 1 + k * 1.2;
      c.beginPath();
      for (let x = PX - (i % 2) * sc; x <= PR + sc; x += sc * 2) { c.moveTo(x + sc * 0.35, y + h * 0.18); c.quadraticCurveTo(x + sc, y - h * 0.12, x + sc * 1.65, y + h * 0.18); }
      c.stroke();
    }, { t: 5.0 + i * 0.08, d: 0.6, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
  // the sun's road: coral and cream dashes down the middle, widening toward us
  const road = [];
  for (let yy = WL + 6; yy < PB; yy += 7 + (yy - WL) * 0.03) {
    const f = (yy - WL) / (PB - WL), w = 40 + f * 260;
    const n = 2 + Math.floor(f * 4);
    for (let k = 0; k < n; k++) {
      const x = SX + r.gauss() * w * 0.5, L = r.range(10, 40) * (0.5 + f);
      road.push([[x - L / 2, yy], [x + L / 2, yy]]);
    }
  }
  p.strokes('water', road, 'rgba(250,200,160,.85)', 2.4, { t: 7.3, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // the bridge's long shadow-reflection under it: vertical dashes of steel
  const refl = [];
  for (let x = XA; x <= XB; x += 22) {
    const yy = WL + 8 + r() * 20;
    refl.push([[x, yy], [x, yy + 6 + r() * 14]]);
  }
  p.strokes('water', refl, 'rgba(29,83,96,.6)', 3, { t: 7.0, d: 0.6, reveal: 'fall' });
  // launches and dinghies at their moorings off the north shore, small with distance
  const moor = [];
  for (let i = 0; i < 26; i++) moor.push([r.range(1130, PR - 10), WL + 8 + r() * 46, r.chance(0.3)]);
  for (let i = 0; i < 12; i++) moor.push([r.range(PX + 20, 300), 1226 + r() * 30, r.chance(0.3)]);
  p.group('water', { x: PX, y: WL, w: PW, h: 200 }, (c) => {
    for (const [x, y, mast] of moor) {
      const s = 0.5 + (y - WL) / 160;
      c.fillStyle = CREAM_L; c.fillRect(x - 6 * s, y - 2.4 * s, 12 * s, 2.4 * s);
      c.fillStyle = TEAL_D; c.fillRect(x - 5 * s, y + 1, 10 * s, 1.2);
      if (mast) { c.fillStyle = NAVY; c.fillRect(x - 0.5, y - 16 * s, 1, 14 * s); }
    }
  }, { t: 7.8, d: 0.5, reveal: 'fade' });
}

// ================================================================ Bennelong Point
function gardens(p, r) {
  // the Botanic Garden's figs and palms along the shore left of the point, behind it
  const blobs = [];
  const rr = rng(88);
  for (let x = PX - 20; x < 760; x += rr.range(18, 34)) blobs.push([x, 1150 + rr.range(-14, 14) - Math.max(0, 300 - x) * 0.12, rr.range(22, 42)]);
  p.group('opera', { x: PX, y: 1000, w: 720, h: 230 }, (c) => {
    c.fillStyle = GUM_D; c.fillRect(PX, 1150, 700, 58);
    for (const [x, y, s] of blobs) { c.fillStyle = GUM_D; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); }
    for (const [x, y, s] of blobs) { c.fillStyle = GUM; c.beginPath(); c.arc(x - s * 0.2, y - s * 0.25, s * 0.72, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(244,160,136,.45)';
    for (const [x, y, s] of blobs) { c.beginPath(); c.arc(x - s * 0.35, y - s * 0.45, s * 0.3, 0, Math.PI * 2); c.fill(); }
    // the sandstone sea wall of Farm Cove
    c.fillStyle = STONE; c.fillRect(PX, 1206, 700, 12);
    c.fillStyle = STONE_D; c.fillRect(PX, 1214, 700, 4);
    c.strokeStyle = 'rgba(120,86,56,.5)'; c.lineWidth = 1; c.beginPath();
    for (let x = PX + 6; x < 770; x += 14) { c.moveTo(x, 1206); c.lineTo(x, 1214); }
    c.stroke();
  }, { t: 6.4, d: 0.9, reveal: 'rise' });
}

// the Opera House: two halls of shells side by side on the granite podium
// A shell is a spherical triangle: two feet on the podium and an apex. Its
// ridge runs from the back foot up to the apex; its open mouth faces north, glazed.
const OPX = 180, OPY = 1236; // the podium's top at its left
function shellPath(c, s) {
  const { a, b, ax, ay, dir } = s; // feet a < b, apex
  c.beginPath();
  c.moveTo(a, OPY);
  if (dir > 0) {
    c.bezierCurveTo(a + (ax - a) * 0.06, OPY - (OPY - ay) * 0.78, ax - (ax - a) * 0.34, ay + (OPY - ay) * 0.02, ax, ay);
    c.bezierCurveTo(ax + (b - ax) * 0.02, ay + (OPY - ay) * 0.35, b - (b - ax) * 0.25, OPY - (OPY - ay) * 0.12, b, OPY);
  } else {
    c.bezierCurveTo(a + (ax - a) * 0.25, OPY - (OPY - ay) * 0.12, ax - (ax - a) * 0.02, ay + (OPY - ay) * 0.35, ax, ay);
    c.bezierCurveTo(ax + (b - ax) * 0.34, ay + (OPY - ay) * 0.02, b - (b - ax) * 0.06, OPY - (OPY - ay) * 0.78, b, OPY);
  }
  c.closePath();
}
function shell(c, s, col) {
  // the glazed mouth under it, toward its open side
  const { a, b, ax, ay, dir } = s;
  c.fillStyle = '#5a3c3a';
  if (dir > 0) poly(c, [[ax, ay + 4], [b + (b - ax) * 0.15, OPY], [ax - (ax - a) * 0.1, OPY]]); else poly(c, [[ax, ay + 4], [a - (ax - a) * 0.15, OPY], [ax + (b - ax) * 0.1, OPY]]);
  c.fill();
  // the glass mullions catching the sun
  c.strokeStyle = 'rgba(244,160,136,.55)'; c.lineWidth = 1;
  c.beginPath();
  for (let k = 1; k < 8; k++) { const x = lerp(ax, dir > 0 ? b : a, k / 8); c.moveTo(lerp(ax, x, 0.15 + k * 0.08), ay + (OPY - ay) * (k / 8) * 0.9 + 6); c.lineTo(x, OPY); }
  c.stroke();
  // the shell itself
  shellPath(c, s);
  const g = c.createLinearGradient(a, 0, b, 0);
  if (dir > 0) { g.addColorStop(0, CREAM_L); g.addColorStop(0.55, col); g.addColorStop(1, mix(col, CORAL_L, 0.55)); }
  else { g.addColorStop(0, mix(col, CORAL_L, 0.55)); g.addColorStop(0.45, col); g.addColorStop(1, CREAM_L); }
  c.fillStyle = g; c.fill();
  // the tiles: chevrons of fine lines running up to the ridge
  c.save(); shellPath(c, s); c.clip();
  c.strokeStyle = 'rgba(180,140,110,.42)'; c.lineWidth = 0.9;
  c.beginPath();
  const foot = dir > 0 ? a : b;
  for (let k = 1; k < 16; k++) {
    const f = k / 16;
    const x0 = lerp(foot, dir > 0 ? b : a, f);
    c.moveTo(x0, OPY); c.quadraticCurveTo(lerp(x0, ax, 0.5) - dir * 18 * (1 - f), lerp(OPY, ay, 0.55), ax, ay);
  }
  c.stroke();
  c.restore();
  // the ridge line and the edge
  shellPath(c, s); c.strokeStyle = 'rgba(110,70,60,.55)'; c.lineWidth = 1.3; c.stroke();
}
function opera(p, r) {
  // the podium: broad, pink granite, its steps toward the city and its walls on the water
  const pod = [[OPX - 120, OPY + 70], [OPX - 40, OPY], [OPX + 600, OPY], [OPX + 660, OPY + 18], [OPX + 660, OPY + 70]];
  p.group('opera', boxOf(pod, 6), (c) => {
    c.fillStyle = '#d7a48a'; poly(c, pod); c.fill();
    c.fillStyle = '#b97f69'; c.fillRect(OPX - 40, OPY + 34, 700, 36);
    // the broad steps, ruled
    c.strokeStyle = 'rgba(120,70,60,.5)'; c.lineWidth = 1; c.beginPath();
    for (let k = 1; k < 9; k++) { const y = OPY + k * 3.8; c.moveTo(OPX - 40 - k * 9, y); c.lineTo(OPX + 160, y); }
    // the colonnade under the forecourt
    for (let x = OPX + 180; x < OPX + 640; x += 14) { c.moveTo(x, OPY + 38); c.lineTo(x, OPY + 66); }
    c.stroke();
    c.fillStyle = CREAM_L; c.fillRect(OPX - 40, OPY - 2, 640, 4);
    c.fillStyle = '#7e4d44'; c.fillRect(OPX + 170, OPY + 38, 480, 4);
  }, { t: 7.0, d: 0.7, reveal: 'rise' });

  // the two halls: the nearer, lower theater in front, the concert hall behind and higher.
  // Both face north (right), two small shells at their south ends facing back.
  const back = [
    { a: OPX + 10, b: OPX + 120, ax: OPX + 40, ay: OPY - 150, dir: -1 },
    { a: OPX + 70, b: OPX + 380, ax: OPX + 300, ay: OPY - 330, dir: 1 },
    { a: OPX + 220, b: OPX + 470, ax: OPX + 420, ay: OPY - 270, dir: 1 },
    { a: OPX + 360, b: OPX + 560, ax: OPX + 520, ay: OPY - 180, dir: 1 },
  ];
  const front = [
    { a: OPX + 130, b: OPX + 230, ax: OPX + 158, ay: OPY - 120, dir: -1 },
    { a: OPX + 190, b: OPX + 440, ax: OPX + 380, ay: OPY - 250, dir: 1 },
    { a: OPX + 330, b: OPX + 540, ax: OPX + 500, ay: OPY - 200, dir: 1 },
    { a: OPX + 450, b: OPX + 610, ax: OPX + 580, ay: OPY - 130, dir: 1 },
  ];
  // the restaurant's little pair, at the left
  const rest = [
    { a: OPX - 30, b: OPX + 30, ax: OPX - 18, ay: OPY - 70, dir: -1 },
    { a: OPX - 10, b: OPX + 80, ax: OPX + 50, ay: OPY - 90, dir: 1 },
  ];
  let t = 7.4;
  for (const [list, col] of [[back, '#f1e6d0'], [front, '#f8efdc'], [rest, '#f4e9d4']]) {
    for (const s of list) {
      const box = { x: Math.min(s.a, s.ax) - 50, y: s.ay - 14, w: Math.max(s.b, s.ax) - Math.min(s.a, s.ax) + 110, h: OPY - s.ay + 20 };
      p.group('opera', box, (c) => shell(c, s, col), { t, d: 0.75, reveal: 'rise', ease: 'out' });
      t += 0.16;
    }
  }
  // people on the steps and the forecourt, and the lamps along the edge
  const rr = rng(61), folk = [];
  for (let k = 0; k < 70; k++) {
    const y = OPY + 4 + rr() * 28, x = OPX - 30 - (y - OPY) * 2.2 + rr() * (200 + (y - OPY) * 2);
    folk.push([x, y, rr.pick([NAVY, CORAL_D, CREAM_L, TEAL_D, GOLD]), rr.range(0.8, 1.2)]);
  }
  p.group('opera', { x: OPX - 160, y: OPY - 30, w: 860, h: 80 }, (c) => {
    for (const [x, y, col, s] of folk) {
      c.fillStyle = col; c.fillRect(x - 1.6 * s, y - 7 * s, 3.2 * s, 6 * s);
      c.fillStyle = '#3a2a2a'; c.beginPath(); c.arc(x, y - 8.6 * s, 1.5 * s, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = NAVY;
    for (let x = OPX + 180; x < OPX + 640; x += 46) { c.fillRect(x, OPY - 22, 1.6, 22); c.beginPath(); c.arc(x + 0.8, OPY - 23, 2.4, 0, Math.PI * 2); c.fill(); }
  }, { t: 8.9, d: 0.6, reveal: 'fade' });
}

// Fort Denison: the Martello tower and the barracks on their rock
function fort(p, r) {
  const x = 1060, y = 1236;
  p.group('gum', { x: x - 150, y: y - 140, w: 330, h: 175 }, (c) => {
    // the rock and the sea wall
    c.fillStyle = STONE_D; poly(c, [[x - 140, y + 24], [x - 120, y], [x + 160, y], [x + 175, y + 24]]); c.fill();
    c.fillStyle = STONE; c.fillRect(x - 120, y - 16, 280, 18);
    c.strokeStyle = 'rgba(120,86,56,.5)'; c.lineWidth = 1; c.beginPath();
    for (let xx = x - 116; xx < x + 160; xx += 12) { c.moveTo(xx, y - 16); c.lineTo(xx, y + 2); }
    c.stroke();
    // the barracks: a long low block with a pitched roof
    c.fillStyle = STONE_L; c.fillRect(x - 100, y - 54, 120, 38);
    c.fillStyle = CORAL_D; poly(c, [[x - 106, y - 54], [x - 90, y - 70], [x + 10, y - 70], [x + 26, y - 54]]); c.fill();
    c.fillStyle = NAVY; for (let k = 0; k < 6; k++) c.fillRect(x - 92 + k * 19, y - 44, 6, 12);
    // the Martello tower: a round stone tower, tapered, with its parapet
    const tx = x + 76;
    c.fillStyle = STONE; poly(c, [[tx - 40, y - 16], [tx - 34, y - 112], [tx + 34, y - 112], [tx + 40, y - 16]]); c.fill();
    c.fillStyle = STONE_D; poly(c, [[tx + 8, y - 16], [tx + 10, y - 112], [tx + 34, y - 112], [tx + 40, y - 16]]); c.fill();
    c.strokeStyle = 'rgba(120,86,56,.5)'; c.beginPath();
    for (let yy = y - 104; yy < y - 16; yy += 8) { c.moveTo(tx - 38, yy); c.lineTo(tx + 38, yy); }
    c.stroke();
    c.fillStyle = STONE_L; c.fillRect(tx - 38, y - 122, 76, 10);
    c.fillStyle = NAVY; c.fillRect(tx - 8, y - 70, 6, 14); c.fillRect(tx - 24, y - 96, 4, 8);
    // the flagstaff, bare
    c.strokeStyle = NAVY; c.lineWidth = 1.4; c.beginPath(); c.moveTo(tx, y - 122); c.lineTo(tx, y - 138); c.stroke();
    // reflection
    c.fillStyle = 'rgba(29,83,96,.45)'; c.fillRect(x - 130, y + 26, 300, 4); c.fillRect(x - 90, y + 34, 220, 3);
  }, { t: 8.0, d: 0.8, reveal: 'rise' });
}

// ================================================================ foreground
// the sandstone ledge at Mrs Macquarie's Point, bottom right, in deco strata
function rock(p, r) {
  const pts = [[880, PB + 10], [930, 1480], [1050, 1440], [1200, 1400], [1330, 1370], [PR + 10, 1340], [PR + 10, PB + 10]];
  p.group('gum', boxOf(pts, 4), (c) => {
    c.fillStyle = STONE; poly(c, pts); c.fill();
    c.save(); poly(c, pts); c.clip();
    // strata: bands of ochre and coral, tilted
    for (let k = 0; k < 14; k++) {
      const y = 1360 + k * 16;
      c.fillStyle = k % 3 === 0 ? STONE_D : k % 3 === 1 ? mix(STONE, CORAL_L, 0.4) : STONE_L;
      c.beginPath(); c.moveTo(860, y + 40); c.quadraticCurveTo(1200, y - 18, PR + 20, y - 30); c.lineTo(PR + 20, y - 22); c.quadraticCurveTo(1200, y - 8, 860, y + 48); c.fill();
    }
    c.restore();
    c.strokeStyle = 'rgba(31,42,68,.6)'; c.lineWidth = 1.4; c.beginPath(); for (let i = 1; i < pts.length - 1; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke();
  }, { t: 8.4, d: 0.8, reveal: 'rise' });
}

// a smooth-barked red gum, its salmon trunk twisting up the right edge, a bough over the top
// (an Angophora: pink bark that peels in patches, sickle leaves hanging in clumps)
const LIMBS = [
  // the trunk, from the rock up and over the top in one long bough
  { pts: [[1512, 1420], [1494, 1270], [1522, 1110], [1496, 950], [1508, 800], [1478, 640], [1420, 480], [1336, 350], [1226, 252], [1100, 186], [960, 160]],
    w0: 92, w1: 14, t: 8.6, d: 1.5, rev: 'rise' },
  // a side branch from the bough, down and left
  { pts: [[1380, 410], [1300, 430], [1220, 470], [1140, 486]], w0: 20, w1: 6, t: 9.6, d: 0.5, rev: 'wipeL' },
  { pts: [[1250, 268], [1210, 330], [1150, 360]], w0: 12, w1: 4, t: 9.7, d: 0.4, rev: 'wipeL' },
];
// a smooth curve through a few points (Catmull-Rom)
function spline(pts, n = 8) {
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
// a tapering ribbon along a curve, and the two edges
function ribbon(pts, w0, w1) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const w = lerp(w0, w1, (i / (pts.length - 1)) ** 0.8) / 2;
    L.push([pts[i][0] - dy / d * w, pts[i][1] + dx / d * w]); R.push([pts[i][0] + dy / d * w, pts[i][1] - dx / d * w]);
  }
  return { L, R, shape: L.concat(R.slice().reverse()) };
}
function gum(p, r) {
  LIMBS.forEach((lb, i) => {
    const c0 = spline(lb.pts);
    const { L, R, shape } = ribbon(c0, lb.w0, lb.w1);
    // patches where the old bark has peeled, fixed now
    const rr = rng(500 + i), patches = [];
    for (let k = 0; k < c0.length; k += 3) {
      if (rr() < 0.45) continue;
      const f = k / (c0.length - 1), w = lerp(lb.w0, lb.w1, f);
      patches.push([c0[k][0] + rr.range(-0.3, 0.3) * w, c0[k][1] + rr.range(-6, 6), w * rr.range(0.06, 0.12), w * rr.range(0.35, 0.8), rr() < 0.4]);
    }
    p.group('gum', boxOf(shape, 8), (c) => {
      c.fillStyle = BARK; poly(c, shape); c.fill();
      c.save(); poly(c, shape); c.clip();
      // shade down the side away from the sun, a highlight toward it
      c.strokeStyle = BARK_D; c.lineWidth = lb.w0 * 0.42; c.lineJoin = 'round';
      c.beginPath(); R.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
      c.strokeStyle = 'rgba(255,226,200,.75)'; c.lineWidth = Math.max(2, lb.w0 * 0.08);
      c.beginPath(); c.moveTo(lerp(L[0][0], c0[0][0], 0.45), lerp(L[0][1], c0[0][1], 0.45));
      for (let k = 1; k < c0.length; k++) c.lineTo(lerp(L[k][0], c0[k][0], 0.45), lerp(L[k][1], c0[k][1], 0.45));
      c.stroke();
      for (const [x, y, rx, ry, dark] of patches) {
        c.fillStyle = dark ? 'rgba(176,94,74,.35)' : 'rgba(250,200,172,.55)';
        c.beginPath(); c.ellipse(x, y, rx, ry, 0.1, 0, Math.PI * 2); c.fill();
      }
      c.restore();
      c.strokeStyle = 'rgba(110,50,40,.65)'; c.lineWidth = 1.4; poly(c, shape); c.stroke();
    }, { t: lb.t, d: lb.d, reveal: lb.rev, ease: 'inOut' });
  });
  // the leaves: sickle-shaped, hanging in clumps from the bough's twigs
  const clumps = [[980, 160, 1.25], [1090, 190, 1.3], [1200, 250, 1.15], [1150, 470, 1.1], [1240, 450, 1], [1160, 360, 0.95],
    [1330, 340, 1.05], [1400, 520, 0.9], [880, 150, 0.9], [1040, 120, 1], [1290, 260, 0.9], [1440, 420, 0.8]];
  clumps.forEach(([cx, cy, s], i) => {
    const rr = rng(300 + i);
    const leaves = [];
    for (let k = 0; k < 48; k++) {
      const a = Math.PI / 2 + rr.range(-1.25, 1.25), L = rr.range(30, 66) * s;
      const x = cx + rr.range(-46, 46) * s, y = cy + rr.range(-18, 22) * s;
      const tone = rr();
      leaves.push([x, y, a, L, tone < 0.4 ? GUM_D : tone < 0.78 ? GUM : GUM_L, tone]);
    }
    leaves.sort((A, B) => A[5] - B[5]);
    // twigs to hold them
    const twigs = leaves.filter((_, k) => k % 6 === 0).map(([x, y]) => [[cx, cy - 12 * s], [x, y]]);
    p.group('gum', { x: cx - 130 * s, y: cy - 50 * s, w: 260 * s, h: 150 * s }, (c) => {
      c.strokeStyle = BARK_D; c.lineWidth = 1.6; c.beginPath();
      for (const [[a0, b0], [a1, b1]] of twigs) { c.moveTo(a0, b0); c.lineTo(a1, b1); }
      c.stroke();
      for (const [x, y, a, L, col] of leaves) {
        const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
        const nx = -Math.sin(a), ny = Math.cos(a);
        c.fillStyle = col;
        c.beginPath(); c.moveTo(x, y);
        c.quadraticCurveTo((x + ex) / 2 + nx * L * 0.22, (y + ey) / 2 + ny * L * 0.22, ex, ey);
        c.quadraticCurveTo((x + ex) / 2 + nx * L * 0.03, (y + ey) / 2 + ny * L * 0.03, x, y);
        c.fill();
      }
    }, { t: 9.8 + i * 0.09, d: 0.6, reveal: 'pop' });
  });
}

// ================================================================ life
function life(p, r) {
  // ferries crossing: green hulls, cream upperworks, a funnel each
  p.live('boats', {
    t: 9.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const k = Math.max(0, time - 9);
      // each runs its course and comes round again from out of sight
      ferry(c, -100 + ((800 + k * 7) % 1800), 1330 + Math.sin(time * 1.2) * 1.2, 1.15, 1);
      ferry(c, -150 + ((450 + k * 6) % 1600), 1494 + Math.sin(time * 1.1 + 2) * 1.4, 1.75, 1);
      // the far one fades in past the point and out before Fort Denison's wall
      const fx = 1240 - ((k * 4 + 50) % 260), fa = clamp((1240 - fx) / 30) * clamp((fx - 985) / 40);
      if (fa > 0) { c.globalAlpha = fa; ferry(c, fx, 1150 + Math.sin(time * 1.4 + 1) * 0.8, 0.7, -1); c.globalAlpha = 1; }
    },
  });
  // yachts with coral and cream sails, rocking at their moorings
  const yachts = [[380, 1330, 0.9, CORAL], [700, 1420, 1.25, CREAM_L], [860, 1180, 0.6, CREAM_L], [1300, 1210, 0.62, CORAL], [140, 1372, 1.15, CORAL_D], [560, 1326, 0.7, CREAM_L]];
  p.live('boats', {
    t: 9.3, d: 1.0, reveal: 'fade',
    draw: (c, time) => yachts.forEach(([x, y, s, col], i) => yacht(c, x + Math.sin(time * 0.2 + i) * 4, y, s, col, Math.sin(time * 1.1 + i * 2) * 0.04)),
  });
  // the glitter on the sun's road, flickering
  const gl = [];
  for (let i = 0; i < 90; i++) { const f = r() ** 0.8; gl.push([SX + r.gauss() * (30 + f * 200), WL + 10 + f * (PB - WL - 20), r() * 7, 8 + f * 26]); }
  p.live('water', {
    t: 8.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#fff3dc';
      for (const [x, y, ph, L] of gl) {
        const a = Math.sin(time * 2 + ph * 3);
        if (a < 0.3) continue;
        c.globalAlpha = a; c.fillRect(x - L / 2, y, L, 2);
      }
      c.globalAlpha = 1;
    },
  });
  // gulls over the water
  const gs = [];
  for (let i = 0; i < 9; i++) gs.push([PX + 200 + r() * 1100, 380 + r() * 500, r.range(40, 120), r.range(0.15, 0.35) * (r.chance(0.5) ? 1 : -1), r() * 7, r.range(1, 1.7)]);
  p.live('birds', {
    t: 9.8, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = NAVY; c.lineCap = 'round';
      for (const [x0, y0, rx, w, ph, s] of gs) {
        const a = time * w + ph, x = x0 + Math.cos(a) * rx, y = y0 + Math.sin(a) * rx * 0.3;
        const fl = Math.sin(time * 6 + ph * 3), ww = 10 * s, hh = (2 + fl * 2.4) * s;
        c.lineWidth = 1.6 * s;
        c.beginPath(); c.moveTo(x - ww, y - hh * 0.3); c.quadraticCurveTo(x - ww * 0.45, y - hh * 1.3, x, y); c.quadraticCurveTo(x + ww * 0.45, y - hh * 1.3, x + ww, y - hh * 0.3); c.stroke();
      }
    },
  });
  // cockatoos on the bough, their crests lifting
  const cks = [[1226, 234, 1.35, 0], [1104, 174, 1.25, 1.7], [1290, 422, 1.15, 3.1]];
  p.live('birds', {
    t: 10.0, d: 0.8, reveal: 'pop', box: { x: 1060, y: 110, w: 280, h: 340 },
    draw: (c, time) => cks.forEach(([x, y, s, ph]) => cockatoo(c, x, y, s, 0.5 + 0.5 * Math.sin(time * 1.3 + ph), Math.sin(time * 0.7 + ph) * 0.15)),
  });
  // a train over the bridge, now and then
  p.live('traffic', {
    t: 7.0, d: 0.5, reveal: 'fade',
    draw: (c, time) => {
      const L = 2600, x = PR + 300 - ((time - 7) * 140) % L;
      c.fillStyle = STEEL;
      for (let k = 0; k < 6; k++) c.fillRect(x + k * 46, DECK - 12, 42, 9);
      c.fillStyle = 'rgba(244,160,136,.8)';
      for (let k = 0; k < 6; k++) for (let j = 0; j < 5; j++) c.fillRect(x + k * 46 + 4 + j * 8, DECK - 10, 4, 3);
    },
  });
}

function ferry(c, x, y, s, dir) {
  c.save(); c.translate(x, y); c.scale(s * dir, s);
  // the wake
  c.strokeStyle = 'rgba(255,243,220,.75)'; c.lineWidth = 1.6;
  c.beginPath(); for (let k = 0; k < 4; k++) { c.moveTo(-70 - k * 18, 2 + k * 2); c.lineTo(-56 - k * 18, 2 + k * 2); } c.stroke();
  // the hull: green, a cream band, a lighter line at the waterline
  c.fillStyle = FERRY; poly(c, [[-64, -12], [66, -12], [58, 2], [-58, 2]]); c.fill();
  c.fillStyle = CREAM_L; c.fillRect(-60, -16, 124, 4);
  // two decks of windows and the wheelhouses at both ends
  c.fillStyle = CREAM_L; c.fillRect(-52, -32, 104, 16);
  c.fillStyle = FERRY; for (let k = 0; k < 11; k++) c.fillRect(-48 + k * 9.2, -28, 5, 7);
  c.fillStyle = CREAM_L; c.fillRect(-38, -44, 76, 12);
  c.fillStyle = NAVY; c.fillRect(-40, -46, 80, 3);
  c.fillStyle = FERRY; c.fillRect(-34, -41, 68, 4);
  // the funnel, cream with a dark top
  c.fillStyle = CREAM_L; c.fillRect(-6, -62, 12, 18); c.fillStyle = NAVY; c.fillRect(-6, -64, 12, 5);
  c.restore();
}
function yacht(c, x, y, s, sail, tilt) {
  c.save(); c.translate(x, y); c.rotate(tilt); c.scale(s, s);
  c.fillStyle = NAVY; poly(c, [[-22, -6], [24, -6], [16, 2], [-16, 2]]); c.fill();
  c.fillStyle = sail; poly(c, [[2, -70], [2, -10], [26, -10]]); c.fill(); poly(c, [[-2, -58], [-2, -10], [-20, -10]]); c.fill();
  c.strokeStyle = NAVY; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -74); c.lineTo(0, -6); c.stroke();
  c.fillStyle = 'rgba(29,83,96,.5)'; c.fillRect(-18, 4, 36, 2); c.fillRect(-10, 8, 20, 2);
  c.restore();
}
// a sulphur-crested cockatoo perched, facing left; up lifts the crest
function cockatoo(c, x, y, s, up, tilt) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // the body and folded wing
  c.fillStyle = '#fbf6ea';
  c.beginPath(); c.ellipse(0, -18, 11, 18, 0.25, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e9e2d2'; c.beginPath(); c.ellipse(4, -16, 7, 15, 0.3, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fbf6ea'; poly(c, [[2, -4], [14, 14], [6, 12], [-2, -2]]); c.fill();
  // the head, turning a little
  c.save(); c.translate(-6, -34); c.rotate(tilt);
  c.fillStyle = '#fbf6ea'; c.beginPath(); c.arc(0, 0, 8, 0, Math.PI * 2); c.fill();
  // the crest: yellow feathers swept back and up
  c.fillStyle = '#f2c230';
  for (let k = 0; k < 4; k++) {
    const a = -Math.PI / 2 + 0.25 + k * 0.22 - up * 0.5;
    c.beginPath(); c.moveTo(-2, -5); c.quadraticCurveTo(Math.cos(a) * 10, Math.sin(a) * 10 - 6, Math.cos(a) * (14 + up * 6), Math.sin(a) * (14 + up * 6) - 2); c.lineTo(2, -4); c.fill();
  }
  c.fillStyle = NAVY; c.beginPath(); c.arc(-4, -1, 1.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#3a3a44'; c.beginPath(); c.moveTo(-7, 0); c.quadraticCurveTo(-13, 2, -9, 6); c.lineTo(-5, 3); c.fill();
  c.restore();
  // feet on the bough
  c.strokeStyle = '#7a6a66'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-2, -2); c.lineTo(-3, 4); c.moveTo(4, -2); c.lineTo(5, 4); c.stroke();
  c.restore();
}

// ================================================================ the title
function title(p) {
  const cx = W / 2, base = 1810;
  // the band: cream, between two navy rules, coral speed lines at both ends
  p.group('title', { x: 40, y: PB - 6, w: W - 80, h: 12 }, (c) => {
    c.fillStyle = NAVY; c.fillRect(PX, PB - 3, PW, 6);
    c.fillStyle = CORAL; c.fillRect(PX, PB + 6, PW, 3);
  }, { t: 10.2, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  for (const s of [-1, 1]) {
    p.group('title', { x: s < 0 ? PX : PR - 190, y: 1690, w: 190, h: 120 }, (c) => {
      for (let k = 0; k < 4; k++) {
        const L = 150 - k * 30, y = 1716 + k * 22;
        c.fillStyle = k % 2 ? CORAL : NAVY;
        c.fillRect(s < 0 ? PX + 14 : PR - 14 - L, y, L, k % 2 ? 6 : 9);
      }
    }, { t: 12.4 + (s > 0 ? 0.15 : 0), d: 0.6, reveal: s < 0 ? 'wipe' : 'wipeL' });
  }
  p.type('title', 'SYDNEY', cx, base, {
    family: '"Poller One", serif', size: 236, color: NAVY, shadow: CORAL, sx: 9, sy: 9,
    align: 'center', track: 0.04, t: 10.7, gap: 0.2, d: 0.8, fit: 1060,
  });
  p.type('title', 'NEW SOUTH WALES  ·  AUSTRALIA', cx, 1898, {
    family: '"Poiret One", serif', size: 34, color: NAVY, align: 'center', track: 0.42, t: 12.6, gap: 0.03, d: 0.5, reveal: 'fade',
  });
}
