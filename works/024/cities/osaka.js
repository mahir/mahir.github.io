// Osaka: a Showa-era printed poster of Dōtonbori at night. The canal runs away
// between two walls of signs: blade signs lettered top to bottom and ringed with
// bulbs, red lanterns under the eaves, lit windows, the Ebisu bridge crowded
// with people, a tour boat on the water and the colors of the signs broken up
// in it. Above, pasted on like a postcard, the castle under the moon. Flat
// inks, a dot screen in the sky, the name in heavy gothic on cream.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, rng, mix } from '../kit.js';

const CREAM = '#efe3c6', NAVY = '#161c3c', NAVY2 = '#232a55', NIGHT = '#0f1330', INK = '#14142a';
const RED = '#d9372c', RED_D = '#9e2420', YEL = '#f3c331', TEAL = '#2b9c94', PINK = '#e7638b', ORA = '#ee8030', GRN = '#45a866', WHT = '#f7efdc', BLUE = '#3a6fc4';
const CASTLE_SKY = '#2b6c72', VERD = '#5fae9c', GOLD = '#e0b24a';
const FACE = '"Dela Gothic One"';

const WORDS = ['うどん', 'すし', '酒', 'たこ焼', 'お好み焼', '喫茶', '食堂', '劇場', '映画', 'ホテル', 'かに料理', 'ふぐ', '串カツ', 'ラーメン', '居酒屋', '名物', '大衆酒場', '中華', '洋食', '焼肉', '珈琲', '甘味', '旅館', 'めし', 'おでん', '天ぷら', 'そば', 'ビヤホール', 'キャバレー', 'パチンコ'];
const TITLE_J = '大阪', CASTLE_J = '大阪城', PLACE = '道頓堀';
const ALL_J = [...new Set([...WORDS.join(''), ...TITLE_J, ...CASTLE_J, ...PLACE])].join('');

export const city = {
  id: 'osaka', name: 'Osaka', wall: '#191327',
  alt: 'A Showa-era printed poster of Dōtonbori at night: the canal between walls of lettered blade signs ringed with bulbs, red paper lanterns and lit windows, the Ebisu bridge crowded with people, a tour boat on the colored water, and Osaka Castle under the moon on a small panel above, with the name in heavy gothic letters',
  google: 'family=Dela+Gothic+One',
  fonts: [[`400 120px ${FACE}`, ALL_J], [`400 120px ${FACE}`, 'OSAKA DŌTONBORI · CANAL AT NIGHT']],
  build,
};

// the picture, inside a cream margin; the title on the cream below
const PX0 = 72, PX1 = W - 72, PY0 = 72, PY1 = 1630;
// the canal in one-point perspective
const VX = 800, VY = 780, F = 700;
const P = (u, h, z) => [VX + (u * F) / z, VY + (h * F) / z];
const WALL = 1.6, EDGE = 1.0, WALK = 1.2, WATER = 1.45, ZFAR = 15, BRIDGE = 6.2;

function build() {
  const p = new Plate({ paper: CREAM, seed: 1958 });
  const r = p.r;
  segs.length = 0; blades.length = 0;
  p.clip = { x: PX0, y: PY0, w: PX1 - PX0, h: PY1 - PY0 };
  p.stack('sky', 'far', 'water', 'walls', 'bridge', 'signs', 'front', 'live', 'panel', 'title');
  p.layer('panel', { clip: false }); p.layer('title', { clip: false });

  sky(p, r);
  far(p, r);
  water(p, r);
  walls(p, r);
  bridge(p, r);
  signs(p, r);
  front(p, r);
  live(p, r);
  panel(p, r);
  title(p, r);
  return p;
}

function path(c, pts, close) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}

// ================================================================ the night sky with its dot screen
function sky(p, r) {
  const dots = [];
  for (let y = PY0 + 6; y < 820; y += 13) for (let x = PX0 + 6 + ((y / 13) % 2) * 6.5; x < PX1; x += 13) {
    const k = clamp((y - PY0) / (820 - PY0));
    dots.push([x, y, 1 + k * 4.2]);
  }
  const stars = [];
  for (let i = 0; i < 60; i++) stars.push([r.range(PX0, PX1), r.range(PY0, 520), r.range(1, 2.6)]);
  p.group('sky', { x: PX0, y: PY0, w: PX1 - PX0, h: 900 }, (c) => {
    c.fillStyle = NIGHT; c.fillRect(PX0, PY0, PX1 - PX0, 900);
    // the glow of the signs on the haze low down, as a screen of purple dots
    c.fillStyle = '#4a2a5e';
    c.beginPath(); for (const [x, y, s] of dots) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
  }, { t: 0.2, d: 1.2, reveal: 'fall', ease: 'inOut' });
  p.group('sky', { x: PX0, y: PY0, w: PX1 - PX0, h: 500 }, (c) => {
    c.fillStyle = WHT; for (const [x, y, s] of stars) c.fillRect(x - s / 2, y - s / 2, s, s);
  }, { t: 1.2, d: 0.8, reveal: 'fade' });
}

// ================================================================ the far end: low buildings and a glow at the vanishing point
function far(p, r) {
  const blocks = [];
  let x = VX - 140;
  while (x < VX + 140) { const w = r.range(14, 30); blocks.push([x, VY + 1.2 * F / ZFAR, w, r.range(60, 130)]); x += w; }
  const lit = [];
  for (const [bx, by, bw, bh] of blocks) for (let yy = by - bh + 6; yy < by - 6; yy += 7) for (let xx = bx + 3; xx < bx + bw - 3; xx += 6) if (r.chance(0.45)) lit.push([xx, yy, r.pick([YEL, WHT, ORA, PINK])]);
  p.group('far', { x: VX - 160, y: VY - 200, w: 320, h: 300 }, (c) => {
    c.fillStyle = '#5a2c58'; c.beginPath(); c.ellipse(VX, VY + 20, 170, 90, 0, Math.PI, 0); c.fill();
    for (const [bx, by, bw, bh] of blocks) { c.fillStyle = NAVY2; c.fillRect(bx, by - bh, bw, bh); }
    for (const [xx, yy, col] of lit) { c.fillStyle = col; c.fillRect(xx, yy, 3, 3); }
  }, { t: 1.6, d: 1.0, reveal: 'rise' });
}

// ================================================================ the canal and what it reflects
function water(p, r) {
  const zN = 1.0;
  const shape = [P(-EDGE, WATER, ZFAR), P(EDGE, WATER, ZFAR), P(EDGE, WATER, zN), P(-EDGE, WATER, zN)];
  p.group('water', boxOf(shape, 4), (c) => {
    c.fillStyle = '#0c1028'; poly(c, shape); c.fill();
  }, { t: 2.0, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // reflections: broken strokes of the signs' colors, under where they hang
  const refl = [];
  for (let i = 0; i < 260; i++) {
    const z = 1.1 + r() ** 1.3 * 9;
    const side = r.chance(0.5) ? -1 : 1;
    const u = side * r.range(0.45, 0.98);
    const [x, y] = P(u, WATER, z);
    const yy = y + r.range(0, 1) * 0;
    const s = F / z;
    refl.push([x, yy + r.range(0, 0.5) * s, r.range(0.05, 0.18) * s, Math.max(1.2, 0.012 * s), r.pick([RED, YEL, PINK, TEAL, ORA, WHT, GRN])]);
  }
  refl.sort((a, b) => a[1] - b[1]);
  p.group('water', boxOf(shape, 4), (c) => {
    c.save(); poly(c, shape); c.clip();
    for (const [x, y, L, h, col] of refl) { c.fillStyle = col; c.globalAlpha = 0.75; c.fillRect(x - L / 2, y, L, h); }
    c.restore();
  }, { t: 7.4, d: 1.2, reveal: 'fall', ease: 'inOut' });
}

// ================================================================ the two walls: buildings, windows, walkways, railings
const segs = [];
function walls(p, r) {
  for (const side of [-1, 1]) {
    let z = ZFAR;
    while (z > 0.9) {
      const len = r.range(0.25, 0.75) * z * 0.6;
      const z1 = Math.max(0.85, z - len);
      segs.push({ side, z0: z1, z1: z, top: -r.range(1.4, 2.4), col: r.pick([NAVY2, '#2a2048', '#1c2a4a', '#30244a', '#1f2440']), seed: r.int(1, 1e6) });
      z = z1;
    }
  }
  // far to near, both sides together
  segs.sort((a, b) => b.z1 - a.z1);
  segs.forEach((s, i) => {
    const u = s.side * WALL;
    const q = [P(u, WALK, s.z1), P(u, s.top, s.z1), P(u, s.top, s.z0), P(u, WALK, s.z0)];
    const rr = rng(s.seed);
    // windows: a grid on the wall plane, most of them lit
    const wins = [];
    const nz = Math.max(2, Math.round((s.z1 - s.z0) / (0.09 * s.z0) )), rows = Math.round((WALK - s.top) / 0.34);
    for (let a = 0; a < nz; a++) for (let b = 1; b < rows; b++) {
      if (rr.chance(0.3)) continue;
      const za = lerp(s.z0, s.z1, (a + 0.2) / nz), zb = lerp(s.z0, s.z1, (a + 0.75) / nz);
      const ha = s.top + b * 0.34, hb = ha + 0.18;
      wins.push([[P(u, ha, za), P(u, ha, zb), P(u, hb, zb), P(u, hb, za)], rr.pick([YEL, '#f6dc8a', ORA, '#f4e6c0', PINK])]);
    }
    // a roof edge and a billboard frame on some roofs
    const bill = rr.chance(0.45) ? [P(u, s.top, lerp(s.z0, s.z1, 0.2)), P(u, s.top - 0.5, lerp(s.z0, s.z1, 0.2)), P(u, s.top - 0.5, lerp(s.z0, s.z1, 0.8)), P(u, s.top, lerp(s.z0, s.z1, 0.8))] : null;
    const bcol = rr.pick([RED, YEL, TEAL, PINK, WHT]);
    const box = boxOf([...q, ...(bill || [])], 4);
    p.group('walls', box, (c) => {
      c.fillStyle = s.col; poly(c, q); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
      for (const [w, col] of wins) { c.fillStyle = col; poly(c, w); c.fill(); }
      if (bill) {
        c.fillStyle = bcol; poly(c, bill); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
        // stripes across it
        c.strokeStyle = NAVY; c.lineWidth = Math.max(1, 2.4 * F / s.z0 / 100);
        c.beginPath(); for (let k = 1; k < 4; k++) { const t = k / 4; c.moveTo(lerp(bill[0][0], bill[3][0], t), lerp(bill[0][1], bill[3][1], t)); c.lineTo(lerp(bill[1][0], bill[2][0], t), lerp(bill[1][1], bill[2][1], t)); } c.stroke();
      }
    }, { t: 2.4 + i * 0.07, d: 0.8, reveal: 'rise' });
  });
  // the walkways, their stone faces and railings
  for (const side of [-1, 1]) {
    const walk = [P(side * EDGE, WALK, ZFAR), P(side * WALL, WALK, ZFAR), P(side * WALL, WALK, 0.85), P(side * EDGE, WALK, 0.85)];
    const face = [P(side * EDGE, WALK, ZFAR), P(side * EDGE, WATER, ZFAR), P(side * EDGE, WATER, 0.85), P(side * EDGE, WALK, 0.85)];
    const lines = [];
    for (let z = 1; z < ZFAR; z *= 1.12) lines.push([P(side * EDGE, WALK, z), P(side * WALL, WALK, z)]);
    const posts = [];
    for (let z = 0.95; z < ZFAR; z *= 1.07) posts.push([P(side * EDGE, WALK, z), P(side * EDGE, WALK - 0.22, z)]);
    p.group('walls', boxOf([...walk, ...face], 4), (c) => {
      c.fillStyle = '#3a3150'; poly(c, walk); c.fill();
      c.strokeStyle = '#2a2240'; c.lineWidth = 1; c.beginPath(); for (const [a, b] of lines) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
      c.fillStyle = '#4c4a68'; poly(c, face); c.fill();
      // a warm wash on the stone from the signs
      c.fillStyle = 'rgba(240,120,60,.22)'; poly(c, walk); c.fill();
    }, { t: 4.4 + (side > 0 ? 0.2 : 0), d: 1.0, reveal: 'fade' });
    p.group('walls', boxOf([...walk, ...face], 30), (c) => {
      c.strokeStyle = '#c9b78e'; c.lineCap = 'round';
      for (const [a, b] of posts) { c.lineWidth = Math.max(1, (b[1] - a[1]) * -0.06); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      c.lineWidth = 2.4; path(c, posts.map((q) => q[1])); c.stroke();
    }, { t: 4.9 + (side > 0 ? 0.2 : 0), d: 0.9, reveal: side < 0 ? 'wipe' : 'wipeL', ease: 'inOut' });
  }
}

// ================================================================ the Ebisu bridge, crowded
function bridge(p, r) {
  const z = BRIDGE, s = F / z;
  const deckTop = (u) => WALK - 0.18 - 0.12 * (1 - u * u / (WALL * WALL));
  const deck = [], under = [];
  for (let u = -WALL - 0.4; u <= WALL + 0.4; u += 0.1) { deck.push(P(u, deckTop(clamp(u, -WALL, WALL)), z)); under.push(P(u, deckTop(clamp(u, -WALL, WALL)) + 0.22, z)); }
  const body = [...deck, ...under.reverse()];
  const people = [];
  for (let i = 0; i < 46; i++) {
    const u = r.range(-WALL, WALL), [x, y] = P(u, deckTop(u) - 0.2, z);
    people.push([x, y, r.range(0.13, 0.17) * s, r.pick([RED, YEL, WHT, TEAL, PINK, '#2a2a40', '#2a2a40', '#2a2a40'])]);
  }
  p.group('bridge', boxOf(body, 60), (c) => {
    c.fillStyle = '#2a2546'; path(c, body, true); c.fill();
    c.strokeStyle = '#c9b78e'; c.lineWidth = 2; path(c, deck); c.stroke();
    // the shadowed arch under it
    c.fillStyle = '#07091c'; const [ax, ay] = P(-EDGE, WATER, z), [bx] = P(EDGE, WATER, z);
    c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo((ax + bx) / 2, under[Math.floor(under.length / 2)][1] - 6, bx, ay); c.lineTo(ax, ay); c.fill();
  }, { t: 5.4, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  p.group('bridge', boxOf(body, 80), (c) => {
    for (const [x, y, h, col] of people) {
      c.fillStyle = '#121225'; c.beginPath(); c.arc(x, y - h * 0.85, h * 0.16, 0, Math.PI * 2); c.fill();
      c.fillStyle = col; c.beginPath(); c.moveTo(x - h * 0.14, y - h * 0.68); c.lineTo(x + h * 0.14, y - h * 0.68); c.lineTo(x + h * 0.17, y - h * 0.2); c.lineTo(x - h * 0.17, y - h * 0.2); c.closePath(); c.fill();
      c.fillStyle = '#121225'; c.fillRect(x - h * 0.1, y - h * 0.2, h * 0.2, h * 0.2);
    }
    // the parapet with its lamps
    c.fillStyle = '#c9b78e'; path(c, deck.map(([x, y]) => [x, y + 1])); c.lineWidth = 2; c.strokeStyle = '#c9b78e'; c.stroke();
    for (const u of [-1.2, -0.4, 0.4, 1.2]) {
      const [x, y] = P(u, deckTop(u), z);
      c.strokeStyle = '#c9b78e'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 0.45 * s); c.stroke();
      c.fillStyle = WHT; c.beginPath(); c.arc(x, y - 0.47 * s, 5, 0, Math.PI * 2); c.fill();
    }
  }, { t: 6.0, d: 0.9, reveal: 'fade' });
}

// ================================================================ the signs
// letters set top to bottom in a column
function vtext(c, str, x, y, size, color) {
  c.font = `400 ${size}px ${FACE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color;
  const chars = [...str];
  chars.forEach((ch, i) => c.fillText(ch, x, y + (i + 0.5) * size * 1.04));
}
const blades = [];
function signs(p, r) {
  const list = [];
  for (const side of [-1, 1]) {
    for (let z = 1.15 + r.range(0, 0.2); z < 11; z *= r.range(1.16, 1.3)) {
      const word = r.pick(WORDS);
      const n = [...word].length;
      const out = r.range(0.28, 0.4);
      const len = 0.33 * n + 0.25;
      const top = -r.range(0.8, 1.9);
      const pal = r.pick([[RED, WHT], [YEL, RED], [WHT, RED], [TEAL, WHT], [PINK, WHT], [NAVY, YEL], [ORA, NAVY], [GRN, WHT], [WHT, NAVY], [BLUE, YEL]]);
      list.push({ side, z, out, top, len, word, pal, bulbs: r.chance(0.55), stripe: r.chance(0.4) });
    }
  }
  list.sort((a, b) => b.z - a.z);
  const nList = list.length;
  // their colors broken up in the canal: dashes under each near sign, pulled in toward the middle
  const dashes = [];
  for (const sg of list) {
    if (sg.z > 7) continue;
    const u = sg.side * r.range(0.62, 0.9), s = F / sg.z;
    const ya = VY + (2 * WATER - sg.top - sg.len) * F / sg.z, yb = VY + (2 * WATER - sg.top) * F / sg.z;
    const [x] = P(u, WATER, sg.z);
    for (let y = ya; y < Math.min(yb, PY1); y += Math.max(3, 0.028 * s)) {
      const L = sg.out * s * r.range(0.25, 1.1);
      if (r.chance(0.35)) continue;
      dashes.push([x + r.range(-0.16, 0.16) * s, y, L, Math.max(1.2, 0.014 * s), r.chance(0.8) ? sg.pal[0] : sg.pal[1]]);
    }
  }
  const wshape = [P(-EDGE, WATER, ZFAR), P(EDGE, WATER, ZFAR), P(EDGE, WATER, 1.0), P(-EDGE, WATER, 1.0)];
  p.group('water', boxOf(wshape, 4), (c) => {
    c.save(); poly(c, wshape); c.clip();
    c.globalAlpha = 0.45;
    for (const [x, y, L, h, col] of dashes) { c.fillStyle = col; c.fillRect(x - L / 2, y, L, h); }
    c.restore();
  }, { t: 8.9, d: 1.0, reveal: 'fall', ease: 'inOut' });
  list.forEach((sg, i) => {
    const u0 = sg.side * WALL, u1 = sg.side * (WALL - sg.out);
    const [xa, ya] = P(u0, sg.top, sg.z), [xb, yb] = P(u1, sg.top + sg.len, sg.z);
    const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), y0 = ya, y1 = yb;
    const w = x1 - x0, h = y1 - y0;
    const size = Math.min(w * 0.62, (h * 0.9) / [...sg.word].length);
    const bulbs = [];
    if (sg.bulbs) {
      const step = Math.max(5, w * 0.12);
      for (let x = x0 + step / 2; x < x1; x += step) { bulbs.push([x, y0 + step * 0.35]); bulbs.push([x, y1 - step * 0.35]); }
      for (let y = y0 + step * 1.2; y < y1 - step; y += step) { bulbs.push([x0 + step * 0.35, y]); bulbs.push([x1 - step * 0.35, y]); }
    }
    const bracket = [P(u0, sg.top + 0.1, sg.z), P(u0, sg.top + sg.len - 0.1, sg.z)];
    const box = { x: x0 - 8, y: y0 - 8, w: w + 16, h: h + 16 };
    const sgm = { ...sg, x0, y0, x1, y1, w, h, bulbs };
    if (sg.z < 3.2 && sg.bulbs) blades.push(sgm);
    p.group('signs', box, (c) => {
      // the bracket to the wall
      c.strokeStyle = '#0a0a18'; c.lineWidth = Math.max(1, w * 0.06);
      c.beginPath(); c.moveTo(bracket[0][0], bracket[0][1]); c.lineTo(sg.side < 0 ? x0 : x1, bracket[0][1]); c.moveTo(bracket[1][0], bracket[1][1]); c.lineTo(sg.side < 0 ? x0 : x1, bracket[1][1]); c.stroke();
      c.fillStyle = sg.pal[0]; c.fillRect(x0, y0, w, h);
      c.strokeStyle = INK; c.lineWidth = Math.max(1, w * 0.04); c.strokeRect(x0, y0, w, h);
      if (sg.stripe) { c.fillStyle = sg.pal[1]; c.fillRect(x0 + w * 0.08, y0 + h * 0.03, w * 0.84, Math.max(1, h * 0.012)); c.fillRect(x0 + w * 0.08, y1 - h * 0.03, w * 0.84, Math.max(1, h * 0.012)); }
      vtext(c, sg.word, (x0 + x1) / 2, y0 + (h - size * 1.04 * [...sg.word].length) / 2, size, sg.pal[1]);
      if (sg.bulbs) { c.fillStyle = '#fff3c4'; for (const [bx, by] of bulbs) { c.beginPath(); c.arc(bx, by, Math.max(0.9, w * 0.028), 0, Math.PI * 2); c.fill(); } }
    }, { t: 5.6 + (i / nList) * 3.0, d: 0.6, reveal: 'drop', dy: 14, ease: 'out' });
  });

  // red paper lanterns along the eaves, far to near
  const lan = [];
  for (const side of [-1, 1]) for (let z = 1.0; z < 12; z *= 1.075) {
    const [x, y] = P(side * (WALL - 0.08), 0.35, z);
    lan.push([x, y, 0.11 * F / z, z, r.chance(0.8) ? RED : WHT]);
  }
  lan.sort((a, b) => b[3] - a[3]);
  for (let k = 0; k < 3; k++) {
    const part = lan.filter((_, i) => i % 3 === k);
    p.group('signs', boxOf(part.map(([x, y]) => [x, y]), 80), (c) => {
      for (const [x, y, s, , col] of part) chochin(c, x, y, s, col);
    }, { t: 8.7 + k * 0.25, d: 0.6, reveal: 'fade' });
  }
}
function chochin(c, x, y, s, col) {
  c.fillStyle = col; c.beginPath(); c.ellipse(x, y, s * 0.55, s * 0.75, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#111'; c.fillRect(x - s * 0.32, y - s * 0.82, s * 0.64, s * 0.16); c.fillRect(x - s * 0.32, y + s * 0.66, s * 0.64, s * 0.16);
  if (s > 10) { c.strokeStyle = col === RED ? RED_D : '#c8b48a'; c.lineWidth = Math.max(0.6, s * 0.04); c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(x - s * 0.52 * Math.sqrt(1 - (k / 3) ** 2), y + k * s * 0.22); c.lineTo(x + s * 0.52 * Math.sqrt(1 - (k / 3) ** 2), y + k * s * 0.22); } c.stroke(); }
}

// ================================================================ the near walkways: people, a big lantern
function front(p, r) {
  // strollers on both walkways, far to near
  const folk = [];
  for (let i = 0; i < 60; i++) {
    const side = r.chance(0.5) ? -1 : 1, z = 1.3 + r() ** 1.5 * 9;
    const u = side * r.range(EDGE + 0.15, WALL - 0.12);
    const [x, y] = P(u, WALK, z);
    folk.push([x, y, 0.33 * F / z, z, r.pick([RED, YEL, WHT, TEAL, PINK, '#3a3a58', '#3a3a58'])]);
  }
  folk.sort((a, b) => b[3] - a[3]);
  for (let k = 0; k < 2; k++) {
    const part = folk.filter((_, i) => i % 2 === k);
    p.group('front', { x: PX0, y: 600, w: PX1 - PX0, h: PY1 - 600 }, (c) => {
      for (const [x, y, h, , col] of part) {
        c.fillStyle = '#101024'; c.beginPath(); c.arc(x, y - h * 0.88, h * 0.1, 0, Math.PI * 2); c.fill();
        c.fillStyle = col; c.beginPath(); c.moveTo(x - h * 0.11, y - h * 0.76); c.lineTo(x + h * 0.11, y - h * 0.76); c.lineTo(x + h * 0.14, y - h * 0.36); c.lineTo(x - h * 0.14, y - h * 0.36); c.closePath(); c.fill();
        c.fillStyle = '#101024'; c.fillRect(x - h * 0.1, y - h * 0.36, h * 0.08, h * 0.36); c.fillRect(x + h * 0.02, y - h * 0.36, h * 0.08, h * 0.36);
      }
    }, { t: 9.3 + k * 0.3, d: 0.6, reveal: 'fade' });
  }
  // a string of lanterns across the canal, near
  const pts = [];
  const [ax, ay] = P(-WALL, -0.4, 2.0), [bx, by] = P(WALL, -0.4, 2.0);
  for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push([lerp(ax, bx, t), lerp(ay, by, t) + 60 * Math.sin(t * Math.PI)]); }
  p.pen('front', pts, '#0a0a18', 2, { t: 8.3, d: 0.9 });
  const hang = pts.filter((_, i) => i % 2 === 1);
  p.group('front', boxOf(pts, 40), (c) => {
    hang.forEach(([x, y], i) => { c.strokeStyle = '#0a0a18'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 8); c.stroke(); chochin(c, x, y + 22, 18, i % 3 === 1 ? WHT : RED); });
  }, { t: 9.0, d: 0.6, reveal: 'fall' });
}

// ================================================================ live: chasing bulbs, a boat, the water stirring
function live(p, r) {
  // the bulbs on the near signs chase round
  const chase = blades.slice(-6);
  p.live('live', {
    t: 9.4, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      for (const sg of chase) {
        const rad = Math.max(1.2, sg.w * 0.034);
        c.fillStyle = '#fff8d8';
        sg.bulbs.forEach(([x, y], i) => { if (((i + Math.floor(time * 6)) % 3) === 0) { c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill(); } });
      }
    },
  });
  // a tour boat coming up the canal toward us
  p.live('live', {
    t: 7.8, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const z = Math.max(2.4, 9 - (time - 7.8) * 0.16), s = F / z;
      const [x, y] = P(0.25, WATER, z);
      const bob = Math.sin(time * 2) * 0.01 * s;
      c.fillStyle = WHT; c.beginPath(); c.moveTo(x - 0.34 * s, y - 0.12 * s + bob); c.lineTo(x + 0.34 * s, y - 0.12 * s + bob); c.lineTo(x + 0.28 * s, y + bob); c.lineTo(x - 0.28 * s, y + bob); c.closePath(); c.fill();
      c.fillStyle = TEAL; c.fillRect(x - 0.3 * s, y - 0.22 * s + bob, 0.6 * s, 0.1 * s);
      c.fillStyle = '#20284a'; c.fillRect(x - 0.32 * s, y - 0.25 * s + bob, 0.64 * s, 0.03 * s);
      c.fillStyle = YEL; for (let k = 0; k < 6; k++) c.fillRect(x - 0.27 * s + k * 0.095 * s, y - 0.2 * s + bob, 0.05 * s, 0.05 * s);
      c.fillStyle = RED; c.fillRect(x - 0.28 * s, y - 0.05 * s + bob, 0.56 * s, 0.02 * s);
      // its wake
      c.fillStyle = 'rgba(247,239,220,.5)'; c.fillRect(x - 0.4 * s, y + 0.01 * s, 0.8 * s, Math.max(1, 0.012 * s));
    },
  });
  // light sliding on the water
  const glint = [];
  for (let i = 0; i < 70; i++) { const z = 1.2 + r() * 6, u = r.range(-0.9, 0.9); glint.push([u, z, r() * 6, r.pick([YEL, PINK, WHT, RED])]); }
  p.live('live', {
    t: 8.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const [u, z, ph, col] of glint) {
        const a = Math.sin(time * 1.4 + ph * 2); if (a < 0.3) continue;
        const [x, y] = P(u + Math.sin(time * 0.7 + ph) * 0.04, WATER, z), s = F / z;
        c.globalAlpha = a * 0.8; c.fillStyle = col; c.fillRect(x - 0.06 * s, y, 0.12 * s, Math.max(1, 0.01 * s));
      }
      c.globalAlpha = 1;
    },
  });
}

// ================================================================ the castle, pasted on above
const PN = { x: 548, y: 118, w: 504, h: 360 };
function panel(p, r) {
  const { x, y, w, h } = PN;
  const ix = x + 16, iy = y + 16, iw = w - 32, ih = h - 32;
  p.group('panel', { x: x - 10, y: y - 10, w: w + 30, h: h + 30 }, (c) => {
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(x + 10, y + 12, w, h);
    c.fillStyle = CREAM; c.fillRect(x, y, w, h);
    c.fillStyle = CASTLE_SKY; c.fillRect(ix, iy, iw, ih);
    c.strokeStyle = RED; c.lineWidth = 2; c.strokeRect(x + 7, y + 7, w - 14, h - 14);
  }, { t: 1.4, d: 0.9, reveal: 'drop', dy: -30, ease: 'back' });
  // the moon, a dot screen around it, clouds in bands
  const cx = x + w / 2;
  const halo = [];
  for (let yy = iy + 4; yy < iy + ih; yy += 9) for (let xx = ix + 4 + ((yy / 9) % 2) * 4.5; xx < ix + iw; xx += 9) {
    const d = Math.hypot(xx - (ix + iw - 110), yy - (iy + 80));
    if (d < 140) halo.push([xx, yy, 2.6 * (1 - d / 140)]);
  }
  p.group('panel', { x: ix, y: iy, w: iw, h: ih }, (c) => {
    c.save(); c.beginPath(); c.rect(ix, iy, iw, ih); c.clip();
    c.fillStyle = '#5ba39f'; c.beginPath(); for (const [a, b, s] of halo) { c.moveTo(a + s, b); c.arc(a, b, s, 0, Math.PI * 2); } c.fill();
    c.fillStyle = '#f5e6b4'; c.beginPath(); c.arc(ix + iw - 110, iy + 80, 40, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e9d698'; c.beginPath(); c.arc(ix + iw - 100, iy + 88, 9, 0, Math.PI * 2); c.arc(ix + iw - 124, iy + 68, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3d8a8a';
    for (const [a, b, l] of [[ix + 20, iy + 60, 150], [ix + 60, iy + 80, 110], [ix + iw - 210, iy + 140, 160]]) { c.beginPath(); c.roundRect(a, b, l, 9, 5); c.fill(); }
    c.restore();
  }, { t: 2.0, d: 0.9, reveal: 'fade' });
  // the keep on its stone base
  const bx = cx - 30, base = iy + ih - 40;
  const tiers = [[150, 30], [126, 28], [102, 26], [82, 24], [62, 26]];
  p.group('panel', { x: ix, y: iy, w: iw, h: ih }, (c) => {
    c.save(); c.beginPath(); c.rect(ix, iy, iw, ih); c.clip();
    // the moat and the far bank
    c.fillStyle = '#1d4c55'; c.fillRect(ix, base + 18, iw, 40);
    c.strokeStyle = '#7cc0b4'; c.lineWidth = 1.4; c.beginPath(); for (let k = 0; k < 8; k++) { const xx = ix + 30 + k * 56; c.moveTo(xx, base + 30 + (k % 2) * 8); c.lineTo(xx + 26, base + 30 + (k % 2) * 8); } c.stroke();
    // the stone base: battered, coursed
    c.fillStyle = '#9aa6a0'; poly(c, [[bx - 110, base + 18], [bx + 110, base + 18], [bx + 92, base - 30], [bx - 92, base - 30]]); c.fill();
    c.strokeStyle = '#5e6a68'; c.lineWidth = 1; c.beginPath();
    for (let k = 1; k < 5; k++) { const yy = base + 18 - k * 9.6, dx = 110 - k * 3.6; c.moveTo(bx - dx, yy); c.lineTo(bx + dx, yy); }
    for (let k = 0; k < 14; k++) { const xx = bx - 100 + k * 15; c.moveTo(xx, base + 18); c.lineTo(xx + 3, base - 30); }
    c.stroke();
    // the tiers: white walls under verdigris roofs, gables and gold
    let yy = base - 30;
    tiers.forEach(([tw, th], i) => {
      c.fillStyle = WHT; c.fillRect(bx - tw / 2 + 8, yy - th, tw - 16, th);
      c.fillStyle = '#20284a'; for (let k = 0; k < Math.floor((tw - 24) / 14); k++) c.fillRect(bx - tw / 2 + 14 + k * 14, yy - th * 0.62, 6, th * 0.32);
      const ry = yy - th;
      c.fillStyle = VERD; c.beginPath(); c.moveTo(bx - tw / 2 - 10, ry + 6); c.quadraticCurveTo(bx - tw / 2 + 4, ry - 2, bx - tw / 2 + 12, ry - 10); c.lineTo(bx + tw / 2 - 12, ry - 10); c.quadraticCurveTo(bx + tw / 2 - 4, ry - 2, bx + tw / 2 + 10, ry + 6); c.closePath(); c.fill();
      c.strokeStyle = '#2d6e64'; c.lineWidth = 1.2; c.stroke();
      // a gable on alternate tiers
      if (i % 2 === 1 || i === 4) {
        c.fillStyle = VERD; poly(c, [[bx - 22, ry - 8], [bx + 22, ry - 8], [bx, ry - 30]]); c.fill(); c.stroke();
        c.fillStyle = WHT; poly(c, [[bx - 13, ry - 10], [bx + 13, ry - 10], [bx, ry - 23]]); c.fill();
        c.fillStyle = GOLD; c.fillRect(bx - 3, ry - 19, 6, 5);
      }
      c.fillStyle = GOLD; c.fillRect(bx - tw / 2 + 4, ry - 1, tw - 8, 2);
      yy = ry - 6;
    });
    // the ridge and its golden fish
    c.fillStyle = VERD; c.fillRect(bx - 40, yy - 12, 80, 8);
    for (const s of [-1, 1]) { c.fillStyle = GOLD; c.beginPath(); c.ellipse(bx + s * 40, yy - 18, 5, 9, s * 0.4, 0, Math.PI * 2); c.fill(); poly(c, [[bx + s * 40, yy - 28], [bx + s * 47, yy - 34], [bx + s * 36, yy - 26]]); c.fill(); }
    // pines on the bank
    c.fillStyle = '#1f4f4a';
    for (const [tx, s] of [[ix + 40, 1], [ix + 86, 0.8], [ix + iw - 60, 1.1], [ix + iw - 18, 0.8], [bx + 150, 0.7]]) {
      for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(tx + (k - 1) * 10 * s, base + 4 - k * 16 * s, 24 * s - k * 5, 8 * s, 0, 0, Math.PI * 2); c.fill(); }
    }
    c.restore();
  }, { t: 2.6, d: 1.2, reveal: 'rise', ease: 'out' });
  // the caption on the panel's margin
  p.type('panel', CASTLE_J, x + 24, y + h - 26, { size: 22, family: FACE, color: CREAM, t: 3.6, gap: 0.1, d: 0.4 });
}

// ================================================================ the name on the cream
function title(p, r) {
  // three stripes in the inks
  const sy = PY1 + 26;
  [[RED, 0], [YEL, 12], [TEAL, 24]].forEach(([col, dy], i) => {
    p.group('title', { x: PX0, y: sy + dy - 2, w: PX1 - PX0, h: 12 }, (c) => { c.fillStyle = col; c.fillRect(PX0, sy + dy, PX1 - PX0, 7); }, { t: 10.2 + i * 0.15, d: 0.7, reveal: 'wipe', ease: 'inOut' });
  });
  // 大阪, offset as if the black plate slipped a little
  p.type('title', TITLE_J, PX0 - 6, 1918, { size: 236, family: FACE, color: RED, shadow: INK, sx: 7, sy: 6, t: 10.8, gap: 0.35, d: 0.8 });
  p.type('title', 'OSAKA', PX1, 1830, { size: 132, family: FACE, color: NAVY, align: 'right', track: 0.04, t: 11.6, gap: 0.12, d: 0.6 });
  p.type('title', PLACE, 590, 1902, { size: 50, family: FACE, color: RED, t: 12.3, gap: 0.12, d: 0.5 });
  p.type('title', 'DŌTONBORI · CANAL AT NIGHT', PX1, 1898, { size: 24, family: FACE, color: NAVY, align: 'right', track: 0.12, t: 12.6, gap: 0.02, d: 0.3, reveal: 'fade' });
}
