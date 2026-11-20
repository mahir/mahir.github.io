// script.js: a writing system for one language, and the pen that writes it.
//
// A script belongs to one of seven families, each a way real scripts are built:
//   cut     straight strokes for wood and stone, like runes and the Old Turkic letters
//   round   bowls, curls and loops in one line, like Burmese or Georgian
//   hang    letters hanging from a line along the top of the word, like Devanagari
//   joined  letters joined along a line, told apart by dots, like Arabic or Mongolian
//   block   square letters, alone or stacked into one block per syllable, like Hangul
//   brush   two or three brush strokes to a sign, like kana
//   turn    one shape per consonant, turned to give the vowel, like Cree syllabics
//
// A glyph is a list of strokes; a stroke is a line of points in em units, x to the right and y up,
// with the baseline at 0 and the body of a letter about 1 high. makeScript() draws the glyphs,
// compose() turns words into cells, layout() sets cells in lines or columns, paint() inks them.

import { C, V, isV, base, isLong, toneOf } from './sounds.js';

const RAD = Math.PI / 180;
const arc = (cx, cy, rx, ry, a0, a1, step = 10) => {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
  const out = [];
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * RAD; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return out;
};
const bez = (p0, p1, p2, p3, n = 14) => {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n; const u = 1 - t;
    out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
  }
  return out;
};
const cat = (...parts) => {
  const out = [];
  for (const part of parts) for (const p of part) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-6) out.push(p);
  }
  return out;
};
const densify = (pts, step = 0.07) => {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 1; k <= n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
  }
  return out;
};
const move = (pts, dx, dy, sx = 1, sy = 1) => pts.map(([x, y]) => [x * sx + dx, y * sy + dy]);
const st = (p, extra = {}) => ({ p, ...extra });
const L = (x0, y0, x1, y1) => st([[x0, y0], [x1, y1]]);
const dot = (x, y) => st([[x, y]], { dot: true });
const bounds = (strokes) => {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const s of strokes) for (const [x, y] of s.p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1 };
};
const moveGlyph = (strokes, dx, dy, sx = 1, sy = 1) => strokes.map((s) => ({ ...s, p: move(s.p, dx, dy, sx, sy) }));
// fit a glyph's strokes into a box, without keeping its proportions
const fit = (strokes, bx0, by0, bx1, by1) => {
  const b = bounds(strokes);
  const sx = b.x1 - b.x0 > 1e-6 ? (bx1 - bx0) / (b.x1 - b.x0) : 1;
  const sy = b.y1 - b.y0 > 1e-6 ? (by1 - by0) / (b.y1 - b.y0) : 1;
  return strokes.map((s) => ({ ...s, p: s.p.map(([x, y]) => [b.x1 - b.x0 > 1e-6 ? bx0 + (x - b.x0) * sx : (bx0 + bx1) / 2, b.y1 - b.y0 > 1e-6 ? by0 + (y - b.y0) * sy : (by0 + by1) / 2]) }));
};

// carry a line on from its end: a curl inward, a flick outward, a loop, or a tail
function extend(pts, kind, scale = 1) {
  const n = pts.length;
  let [x, y] = pts[n - 1];
  const [px, py] = pts[n - 2];
  let h = Math.atan2(y - py, x - px);
  let sense = 0;
  for (let i = n - 1; i >= 2 && !sense; i--) {
    const c = (pts[i - 1][0] - pts[i - 2][0]) * (pts[i][1] - pts[i - 1][1]) - (pts[i - 1][1] - pts[i - 2][1]) * (pts[i][0] - pts[i - 1][0]);
    if (Math.abs(c) > 1e-7) sense = Math.sign(c);
  }
  if (!sense) sense = 1;
  const out = [];
  const turn = (deg, r0, r1, dir) => {
    const steps = Math.ceil(Math.abs(deg) / 12);
    for (let i = 1; i <= steps; i++) {
      const rr = (r0 + (r1 - r0) * i / steps) * scale;
      const d = (deg / steps) * RAD;
      h += dir * d;
      x += Math.cos(h) * rr * d; y += Math.sin(h) * rr * d;
      out.push([x, y]);
    }
  };
  if (kind === 'in') turn(290, 0.17, 0.045, sense);
  else if (kind === 'out') turn(95, 0.2, 0.14, -sense);
  else if (kind === 'loop') { turn(330, 0.1, 0.085, -sense); }
  else if (kind === 'tail') turn(28, 1.0, 1.0, sense * 0.6);
  return cat(pts, out);
}
const extendStart = (pts, kind, scale) => extend(pts.slice().reverse(), kind, scale).reverse();

// ====================================================================== the families
// Each returns { pool, w, asc, desc, pen, ... }: more glyphs than a language needs, in a shuffled order.

function famCut(r) {
  const H = r.range(1.12, 1.32); const W = r.range(0.46, 0.6); const rise = W * r.pick([0.7, 0.9, 1.15]);
  const m = H / 2;
  const pool = [];
  const side = (sx, o) => {
    const X = sx + o * W;
    const stem = L(sx, H, sx, 0);
    const b = {
      td: L(sx, H, X, H - rise), mu: L(sx, m, X, Math.min(H, m + rise)), md: L(sx, m, X, Math.max(0, m - rise)), bu: L(sx, 0, X, rise),
      ud: L(sx, H * 0.78, X, H * 0.78 - rise * 0.8),
      tt: st([[sx, H], [X, H - rise * 0.5], [sx, H - rise]]), tm: st([[sx, m + rise * 0.5], [X, m], [sx, m - rise * 0.5]]), tb: st([[sx, rise], [X, rise * 0.5], [sx, 0]]),
      ft: L(sx, H, X, H), fm: L(sx, m, X, m), fb: L(sx, 0, X, 0),
    };
    for (const combo of ['td', 'mu', 'md', 'bu', 'tt', 'tm', 'tb', 'td bu', 'td md', 'mu bu', 'tt bu', 'tt tb', 'ft', 'ft fm', 'ft fb', 'fm', 'td fm', 'ud bu', 'tt md', 'fb mu']) {
      pool.push({ s: [stem, ...combo.split(' ').map((k) => b[k])], w: W });
    }
  };
  side(0, 1); side(W, -1);
  const cx = W / 2;
  const stem = L(cx, H, cx, 0);
  const pair = (y0, dy) => [L(cx, y0, 0, y0 + dy), L(cx, y0, W, y0 + dy)];
  const k = rise * 0.62;
  for (const s of [
    [stem, ...pair(H, -k)], [stem, ...pair(m, k)], [stem, ...pair(m, -k)], [stem, ...pair(0, k)], [stem, L(0, m, W, m)],
    [stem, L(0, m + k * 0.5, W, m - k * 0.5)], [stem, L(0, m - k * 0.5, W, m + k * 0.5)], [stem, L(0, H, W, H)], [stem, L(0, 0, W, 0)],
    [stem, L(0, H * 0.7, W, H * 0.7), L(0, H * 0.38, W, H * 0.38)], [stem, L(cx, H, 0, H - k), L(cx, 0, W, k)], [stem, ...pair(H, -k), ...pair(m, -k)],
    [L(0, 0, W, H), L(0, H, W, 0)], [st([[W, H], [0, m], [W, 0]])], [st([[0, H], [W, m], [0, 0]])], [st([[0, 0], [cx, H], [W, 0]])], [st([[0, H], [cx, 0], [W, H]])],
    [L(0, H, 0, 0), L(0, H, W, 0), L(W, H, W, 0)], [L(0, H, 0, 0), L(0, 0, W, H), L(W, H, W, 0)], [L(0, H, 0, 0), L(W, H, W, 0), L(0, m, W, m)],
    [st([[0, H], [W, H], [0, 0], [W, 0]])], [st([[cx, H], [W, m], [cx, 0], [0, m], [cx, H]])], [st([[0, H], [W, H], [0, 0], [W, 0], [0, H]])],
    [L(0, H, 0, 0), L(W, H, W, 0)], [stem], [st([[0, H], [W, H * 0.72], [0, H * 0.44]]), st([[0, H * 0.56], [W, H * 0.28], [0, 0]])],
    [st([[0, 0], [0, H], [cx, m], [W, H], [W, 0]])], [st([[cx, H], [W, m], [cx, 0], [0, m], [cx, H]]), L(cx, H, cx, 0)],
  ]) pool.push({ s, w: W });
  const pen = r.chance(0.5) ? { kind: 'cut', w: r.range(0.1, 0.125) } : { kind: 'broad', w: r.range(0.13, 0.17), angle: r.range(22, 40), hair: 0.03 };
  return { pool: r.shuffle(pool), asc: H, desc: 0, gap: 0.3, pen, slant: r.pick([0, 0, 0.05, 0.1]), wob: 0.4 };
}

function famRound(r) {
  const W = r.range(0.68, 0.84);
  const h = W / 2;
  const bodies = {
    c: () => arc(h, 0.5, h, 0.5, 55, 305), cr: () => arc(h, 0.5, h, 0.5, 125, -125), u: () => arc(h, 0.5, h, 0.5, 150, 390),
    n: () => arc(h, 0.5, h, 0.5, 210, -30), o: () => arc(h, 0.5, h, 0.5, 100, 455),
    s: () => cat(arc(h, 0.75, W * 0.36, 0.25, 40, 270), arc(h, 0.25, W * 0.36, 0.25, 90, -140)),
    z: () => cat(arc(h, 0.75, W * 0.36, 0.25, 140, -90), arc(h, 0.25, W * 0.36, 0.25, 90, 320)),
    w: () => cat(arc(W * 0.25, 0.5, W * 0.25, 0.5, 170, 360), arc(W * 0.75, 0.5, W * 0.25, 0.5, 180, 370)),
    m: () => cat(arc(W * 0.25, 0.5, W * 0.25, 0.5, 190, 0), arc(W * 0.75, 0.5, W * 0.25, 0.5, 180, -10)),
    e: () => cat(arc(W * 0.45, 0.75, W * 0.4, 0.25, 150, -90), arc(W * 0.45, 0.25, W * 0.4, 0.25, 90, -150)),
    a: () => cat(arc(W * 0.55, 0.75, W * 0.4, 0.25, 30, 270), arc(W * 0.55, 0.25, W * 0.4, 0.25, 90, 330)),
  };
  const groups = {};
  for (const b of Object.keys(bodies)) {
    groups[b] = [];
    for (const s0 of b === 'o' ? ['none'] : ['none', 'in', 'loop']) for (const s1 of ['none', 'in', 'out', 'loop', 'tail']) {
      if (s0 === 'none' && s1 === 'none' && (b === 'o' ? false : r.chance(0.3))) continue;
      let p = bodies[b]();
      if (s1 !== 'none') p = extend(p, s1);
      if (s0 !== 'none') p = extendStart(p, s0);
      const s = [st(p)];
      const extra = r.weighted([['none', 0.72], ['dot', 0.14], ['bar', 0.14]]);
      if (extra === 'dot' && b !== 'w' && b !== 'm') s.push(dot(h, 0.5));
      if (extra === 'bar' && (b === 'c' || b === 'cr' || b === 'o' || b === 'u' || b === 'n')) s.push(L(h - 0.2, 0.5, h + 0.2, 0.5));
      groups[b].push({ s, w: W });
    }
    groups[b] = r.shuffle(groups[b]);
  }
  // deal the bodies round, so a language's letters are not all one shape
  const pool = [];
  const keys = r.shuffle(Object.keys(groups));
  for (let i = 0; i < 15; i++) for (const b of keys) if (groups[b][i]) pool.push(groups[b][i]);
  const pen = r.chance(0.68) ? { kind: 'round', w: r.range(0.075, 0.1) } : { kind: 'broad', w: r.range(0.13, 0.16), angle: r.range(15, 35), hair: 0.035 };
  return { pool, asc: 1.3, desc: 0.32, gap: 0.2, pen, slant: 0, wob: 1, tidy: true };
}

function famHang(r) {
  const W = r.range(0.66, 0.78);
  const R = W - 0.06; const Lx = 0.06; const Cx = W / 2;
  const stem = (x, y0 = 0) => L(x, 1, x, y0);
  const bowlL = (x, top = 0.9, bot = 0.36) => st(bez([x, top], [x - 0.62, top + 0.1], [x - 0.66, bot - 0.08], [x, bot]));
  const bowlR = (x, top = 0.9, bot = 0.36) => st(bez([x, top], [x + 0.62, top + 0.1], [x + 0.66, bot - 0.08], [x, bot]));
  const openL = (x) => st(cat(bez([x, 0.9], [x - 0.55, 1.0], [x - 0.68, 0.38], [x - 0.3, 0.3]), arc(x - 0.3, 0.42, 0.1, 0.12, -90, 120)));
  const legL = (x, y = 0.55) => st(bez([x, y], [x - 0.15, y - 0.2], [x - 0.36, 0.12], [x - 0.5, 0]));
  const legR = (x, y = 0.55) => st(bez([x, y], [x + 0.15, y - 0.2], [x + 0.36, 0.12], [x + 0.5, 0]));
  const loopL = (x, y = 0.52) => st(arc(x - 0.16, y, 0.16, 0.15, 0, 360));
  const hook = (x) => st(bez([x, 0], [x - 0.12, -0.16], [x - 0.42, -0.1], [x - 0.4, 0.14]));
  const foot = (x) => st(bez([x, 0], [x + 0.1, -0.04], [x + 0.22, 0.02], [x + 0.26, 0.16]));
  const hangL = (x = Lx) => st(cat([[x, 1], [x, 0.56]], bez([x, 0.56], [x, 0.26], [x + 0.3, 0.24], [x + 0.3, 0.5])));
  const archL = (x) => st(bez([Lx, 0.12], [Lx, 0.86], [x - 0.08, 0.86], [x, 0.5]));
  const cross = (x, y = 0.5) => L(x - 0.34, y, x + 0.06, y);
  const belly = () => st(cat(bez([Cx, 1], [Lx - 0.1, 0.94], [Lx - 0.06, 0.52], [Cx, 0.52]), bez([Cx, 0.52], [W + 0.06, 0.5], [W + 0.02, 0.02], [Cx - 0.12, 0.02])));
  const ring = (x, y, rr) => st(arc(x, y, rr, rr, 90, 450));
  const pool = [
    [stem(R), bowlL(R)], [stem(R), openL(R)], [stem(R), legL(R)], [stem(R), loopL(R)], [stem(R), loopL(R, 0.6), legL(R, 0.44)],
    [stem(R), hangL()], [stem(R), archL(R)], [stem(R), cross(R)], [stem(R), bowlL(R), hook(R)], [stem(R), hangL(), cross(R, 0.42)],
    [stem(R), hook(R)], [stem(R), bowlL(R, 0.92, 0.55), legL(R, 0.55)], [stem(R), bowlL(R, 0.6, 0.06)], [stem(R), openL(R), foot(R)],
    [stem(Cx), bowlL(Cx, 0.86, 0.4), bowlR(Cx, 0.86, 0.4)], [stem(Cx), bowlR(Cx)], [stem(Cx), legL(Cx), legR(Cx)], [stem(Cx, 0.5), ring(Cx, 0.25, 0.25)],
    [stem(Cx, 0.42), st(extend(bez([Cx, 0.42], [Cx - 0.4, 0.4], [Cx - 0.4, 0], [Cx, 0.02]), 'in'))], [stem(Cx), cross(Cx + 0.14), hook(Cx)], [stem(Cx), bowlL(Cx), foot(Cx)],
    [stem(Lx), bowlR(Lx)], [stem(Lx), legR(Lx)], [stem(Lx), bowlR(Lx, 0.6, 0.06)], [stem(Lx), bowlR(Lx, 0.92, 0.55), legR(Lx, 0.55)],
    [belly()], [hangL(), st(cat([[R, 1], [R, 0.56]], bez([R, 0.56], [R, 0.26], [R - 0.3, 0.24], [R - 0.3, 0.5])))], [L(Cx, 1, Cx, 0.78), ring(Cx, 0.39, 0.39)],
    [L(Cx, 1, Cx, 0.82), st(arc(Cx, 0.42, W * 0.46, 0.4, 70, 310))], [L(Lx, 1, Lx, 0.3), st(arc(Cx, 0.3, Cx - Lx, 0.3, 180, 360)), L(R, 0.3, R, 1)],
    [stem(Lx), stem(R), cross(R - 0.04, 0.5)], [st(cat([[Lx, 1], [Lx, 0.5]], arc(Lx + 0.24, 0.5, 0.24, 0.3, 180, 360), [[Lx + 0.48, 0.5], [Lx + 0.48, 1]])), legR(Lx + 0.3, 0.2)],
    [L(Cx, 1, Cx, 0.8), st(cat(arc(Cx, 0.6, 0.26, 0.2, 90, 270), arc(Cx, 0.2, 0.26, 0.2, 90, -110)))], [stem(R), st(arc(R - 0.3, 0.72, 0.3, 0.2, 0, 180)), st(arc(R - 0.3, 0.3, 0.3, 0.2, 0, -180))],
  ].map((s) => ({ s, w: W }));
  return { pool: r.shuffle(pool), asc: 1.38, desc: 0.36, gap: 0.14, bar: true, pen: { kind: 'broad', w: r.range(0.13, 0.17), angle: r.range(28, 48), hair: 0.032 }, slant: 0, wob: 0.8 };
}

function famBlock(r) {
  const W = r.range(0.74, 0.86); const H = 1;
  // six long strokes (the four sides and the two middles) and twelve half ones; a letter is two or
  // three long strokes that touch, sometimes with one short one
  const X = [0, W / 2, W]; const Y = [0, H / 2, H];
  const long = [[0, 2, 2, 2], [0, 0, 2, 0], [0, 2, 0, 0], [2, 2, 2, 0], [0, 1, 2, 1], [1, 2, 1, 0]];
  const half = [];
  for (const [x0, y0, x1, y1] of long) {
    const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2;
    half.push([x0, y0, mx, my], [mx, my, x1, y1]);
  }
  const touch = (a, b) => {
    const on = (px, py, [x0, y0, x1, y1]) => (x0 === x1 ? px === x0 && py <= Math.max(y0, y1) && py >= Math.min(y0, y1) : py === y0 && px <= Math.max(x0, x1) && px >= Math.min(x0, x1));
    return on(a[0], a[1], b) || on(a[2], a[3], b) || on(b[0], b[1], a) || on(b[2], b[3], a);
  };
  const joinedUp = (set) => {
    const seen = new Set([0]); const todo = [0];
    while (todo.length) { const i = todo.pop(); set.forEach((_, j) => { if (!seen.has(j) && touch(set[i], set[j])) { seen.add(j); todo.push(j); } }); }
    return seen.size === set.length;
  };
  const pool = [];
  const keys = new Set();
  const tryAdd = (set) => {
    if (!joinedUp(set)) return;
    const xs = set.flatMap((l) => [l[0], l[2]]); const ys = set.flatMap((l) => [l[1], l[3]]);
    if (Math.max(...xs) - Math.min(...xs) < 2 || Math.max(...ys) - Math.min(...ys) < 2) return;
    const key = set.map((l) => l.join('')).sort().join(' ');
    if (keys.has(key)) return;
    keys.add(key);
    const ordered = set.slice().sort((p, q) => Math.max(q[1], q[3]) - Math.max(p[1], p[3]) || p[0] - q[0]);
    pool.push({ s: ordered.map(([x0, y0, x1, y1]) => L(X[x0], Y[y0], X[x1], Y[y1])), w: W });
  };
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
    tryAdd([long[i], long[j]]);
    for (let k = j + 1; k < 6; k++) if (r.chance(0.7)) tryAdd([long[i], long[j], long[k]]);
    for (const hf of half) if (r.chance(0.3)) tryAdd([long[i], long[j], hf]);
  }
  const pen = r.weighted([[{ kind: 'broad', w: r.range(0.15, 0.19), angle: r.pick([8, 14, 76, 82]), hair: 0.045 }, 0.6], [{ kind: 'round', w: r.range(0.1, 0.125) }, 0.4]]);
  return { pool: r.shuffle(pool), asc: 1.08, desc: 0.1, gap: 0.26, pen, slant: 0, wob: 0.5, W };
}

// a smooth line through points (Catmull-Rom)
const through = (pts, per = 10) => {
  const out = [];
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    for (let k = 0; k < per; k++) {
      const t = k / per; const t2 = t * t; const t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(P[i - 1][0], P[i][0], P[i + 1][0], P[i + 2][0]), f(P[i - 1][1], P[i][1], P[i + 1][1], P[i + 2][1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

function famBrush(r) {
  // each sign is one sweep of the brush through three to five of nine points, sometimes with a dab beside it
  const at = (i) => [0.08 + (i % 3) * 0.42, 0.05 + Math.floor(i / 3) * 0.45];
  const near = (a, b) => Math.hypot((a % 3) - (b % 3), Math.floor(a / 3) - Math.floor(b / 3));
  const pool = [];
  const keys = new Set();
  const lean = r.range(-0.05, 0.05);
  for (let tries = 0; tries < 2500 && pool.length < 120; tries++) {
    const n = r.weighted([[3, 3], [4, 5], [5, 3]]);
    const path = [r.weighted([[6, 3], [7, 2], [8, 2], [3, 1.5], [5, 1], [0, 0.5], [2, 0.5]])];
    while (path.length < n) {
      const last = path[path.length - 1];
      const options = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !path.includes(i)).map((i) => [i, near(i, last) < 1.1 ? 3 : near(i, last) < 1.5 ? 2 : near(i, last) < 2.1 ? 1 : 0.3]);
      path.push(r.weighted(options));
    }
    const xs = path.map((i) => i % 3); const ys = path.map((i) => Math.floor(i / 3));
    if (Math.max(...ys) - Math.min(...ys) < 2 && Math.max(...xs) - Math.min(...xs) < 2) continue;
    if (Math.max(...ys) - Math.min(...ys) < 1) continue;
    const key = path.join('');
    if (keys.has(key) || keys.has(path.slice().reverse().join(''))) continue;
    keys.add(key);
    const pts = path.map((i) => { const [x, y] = at(i); return [x + r.range(-0.05, 0.05) + (y - 0.5) * lean, y + r.range(-0.05, 0.05)]; });
    const s = [st(through(pts), { press: r.pick(['flow', 'flow', 'taper']) })];
    const free = [0, 2, 4, 6, 8, 1, 7].filter((i) => !path.includes(i));
    if (free.length && r.chance(0.3)) { const [x, y] = at(r.pick(free)); s.push(st([[x - 0.04, y + 0.07], [x + 0.05, y - 0.06]], { press: 'drop' })); }
    pool.push({ s, w: 1 });
  }
  return { pool, asc: 1.12, desc: 0.14, gap: 0.2, pen: { kind: 'brush', w: r.range(0.08, 0.096) }, slant: 0, wob: 1.2 };
}

// simple shapes with a clear "which way up": turned four ways they give four different signs
function turnShapes() {
  return [
    { p: [st([[0.1, 0.9], [0.5, 0.1], [0.9, 0.9]])] }, { p: [st(arc(0.5, 0.62, 0.4, 0.5, 180, 360))] },
    { p: [st(cat([[0.28, 0.92], [0.28, 0.45]], arc(0.53, 0.45, 0.25, 0.33, 180, 330)))] }, { p: [st([[0.22, 0.9], [0.22, 0.14], [0.86, 0.14]])] },
    { p: [st(cat([[0.26, 0.08], [0.26, 0.92]], arc(0.26, 0.66, 0.46, 0.26, 90, -90)))] }, { p: [st(cat(arc(0.34, 0.7, 0.24, 0.2, 20, 270), arc(0.34, 0.3, 0.3, 0.2, 90, -150)))], two: true },
    { p: [L(0.1, 0.86, 0.9, 0.86), L(0.36, 0.86, 0.36, 0.1)] }, { p: [st(cat([[0.5, 0.1], [0.5, 0.62]], arc(0.5, 0.77, 0.15, 0.15, -90, 270)))] },
    { p: [st([[0.14, 0.88], [0.86, 0.88], [0.14, 0.12], [0.86, 0.12]])], two: true }, { p: [st([[0.14, 0.9], [0.5, 0.5], [0.86, 0.9]]), L(0.5, 0.5, 0.5, 0.08)] },
    { p: [st([[0.84, 0.88], [0.16, 0.88], [0.16, 0.12], [0.84, 0.12]])] }, { p: [st(cat(arc(0.5, 0.5, 0.38, 0.4, 60, 330), [[0.5, 0.5]]))] },
    { p: [st(arc(0.5, 0.62, 0.4, 0.5, 180, 360)), L(0.5, 0.12, 0.5, 0.5)] }, { p: [st([[0.1, 0.9], [0.5, 0.1], [0.9, 0.9]]), L(0.3, 0.5, 0.7, 0.5)] },
    { p: [st([[0.2, 0.9], [0.2, 0.12]]), st([[0.2, 0.52], [0.84, 0.12]])] }, { p: [st(cat([[0.2, 0.9], [0.2, 0.4]], arc(0.5, 0.4, 0.3, 0.3, 180, 360), [[0.8, 0.4], [0.8, 0.62]]))] },
    { p: [st([[0.12, 0.6], [0.4, 0.88], [0.4, 0.12]]), L(0.4, 0.12, 0.88, 0.12)] }, { p: [st(arc(0.5, 0.9, 0.4, 0.8, 200, 340)), dot(0.5, 0.62)] },
  ];
}
const turnOf = (p, k, two, s = 1) => p.map((sk) => ({ ...sk, p: sk.p.map(([x, y]) => {
  let X = x - 0.5; let Y = y - 0.5; let q = k;
  if (two && q >= 2) { X = -X; q -= 2; }                        // shapes that look the same upside down are flipped instead
  for (let i = 0; i < q; i++) [X, Y] = [Y, -X];
  return [(X + 0.5) * s, (Y + 0.5) * s];
}) }));

function famTurn(r) {
  const s = 0.86;
  const pool = r.shuffle(turnShapes()).map((sh) => ({ turns: [0, 1, 2, 3].map((k) => turnOf(sh.p, k, sh.two, s)), w: s }));
  return { pool, asc: 1.12, desc: 0.14, gap: 0.2, pen: { kind: 'round', w: r.range(0.082, 0.1) }, slant: 0, wob: 0.5, s };
}

function famJoined(r) {
  const x = r.range(0.34, 0.44);            // how tall a tooth is
  const T = r.range(1.1, 1.3);              // how tall a tall letter is
  const k = r.range(0.85, 1.1);             // how wide letters run
  const shapes = {
    tooth: () => ({ p: cat([[0, 0], [0.08 * k, 0]], bez([0.08 * k, 0], [0.16 * k, 0], [0.16 * k, x], [0.2 * k, x]), bez([0.2 * k, x], [0.24 * k, x], [0.22 * k, 0], [0.34 * k, 0]), [[0.42 * k, 0]]), w: 0.42 * k, top: x }),
    tall: () => ({ p: cat([[0, 0], [0.1 * k, 0]], bez([0.1 * k, 0], [0.16 * k, 0.1], [0.15 * k, T * 0.7], [0.17 * k, T]), bez([0.17 * k, T], [0.19 * k, T * 0.6], [0.18 * k, 0.04], [0.3 * k, 0]), [[0.38 * k, 0]]), w: 0.38 * k, top: T }),
    loop: () => ({ p: cat([[0, 0], [0.1 * k, 0]], arc(0.27 * k, x * 0.52, 0.17 * k, x * 0.52, 270, -90), [[0.5 * k, 0], [0.56 * k, 0]]), w: 0.56 * k, top: x * 1.04 }),
    bowl: () => ({ p: cat([[0, 0], [0.06 * k, 0]], bez([0.06 * k, 0], [0.04 * k, -0.52], [0.5 * k, -0.52], [0.52 * k, 0]), [[0.62 * k, 0]]), w: 0.62 * k, top: 0.05, low: -0.4 }),
    hump: () => ({ p: cat([[0, 0]], bez([0, 0], [0.06 * k, x * 1.25], [0.46 * k, x * 1.25], [0.52 * k, 0]), [[0.6 * k, 0]]), w: 0.6 * k, top: x * 0.95 }),
    flat: () => ({ p: [[0, 0], [0.34 * k, 0]], w: 0.34 * k, top: 0.05 }),
    zig: () => ({ p: cat([[0, 0], [0.06 * k, 0]], bez([0.06 * k, 0], [0.12 * k, 0], [0.12 * k, x * 0.9], [0.16 * k, x * 0.9]), bez([0.16 * k, x * 0.9], [0.2 * k, x * 0.9], [0.18 * k, 0], [0.28 * k, 0]), bez([0.28 * k, 0], [0.34 * k, 0], [0.34 * k, x * 0.9], [0.38 * k, x * 0.9]), bez([0.38 * k, x * 0.9], [0.42 * k, x * 0.9], [0.4 * k, 0], [0.5 * k, 0]), [[0.58 * k, 0]]), w: 0.58 * k, top: x * 0.9 }),
    flag: () => ({ p: cat([[0, 0], [0.1 * k, 0]], bez([0.1 * k, 0], [0.15 * k, 0.1], [0.14 * k, T * 0.6], [0.16 * k, T * 0.86]), bez([0.16 * k, T * 0.86], [0.3 * k, T * 0.96], [0.44 * k, T * 0.8], [0.34 * k, T * 0.62]), bez([0.34 * k, T * 0.62], [0.24 * k, T * 0.45], [0.2 * k, 0.03], [0.4 * k, 0]), [[0.5 * k, 0]]), w: 0.5 * k, top: T * 0.92 }),
    drop: () => ({ p: cat([[0, 0], [0.12 * k, 0]], arc(0.26 * k, -0.24, 0.14 * k, 0.24, 90, 450), [[0.36 * k, 0], [0.46 * k, 0]]), w: 0.46 * k, top: 0.05, low: -0.5 }),
    eye: () => ({ p: cat([[0, 0]], bez([0, 0], [0.12 * k, x * 1.1], [0.5 * k, x * 1.0], [0.56 * k, 0]), [[0.12 * k, 0], [0.66 * k, 0]]), w: 0.66 * k, top: x * 0.8 }),
  };
  const baseNames = r.shuffle(Object.keys(shapes));
  const marks = ['', 'a1', 'a2', 'b1', 'a3', 'b2'];
  const pool = [];
  for (const m of marks) for (const b of baseNames) pool.push({ shape: b, dots: m });
  const tail = r.pick(['sweep', 'flick', 'long', 'none']);
  const pip = r.weighted([['dot', 0.4], ['tick', 0.3], ['ring', 0.3]]);
  return { pool, shapes, tail, pip, x, T, asc: T + 0.3, desc: 0.62, gap: 0.2, pen: { kind: 'broad', w: r.range(0.12, 0.16), angle: r.range(48, 68), hair: 0.03 }, slant: 0, wob: 1 };
}

// small marks for vowels, tones and the like, each about a fifth of an em across and centered on 0,0
const MARKS = [
  () => [st([[-0.07, -0.07], [0.07, 0.07]])], () => [st([[-0.07, 0.07], [0.07, -0.07]])], () => [st([[-0.09, -0.05], [0, 0.06], [0.09, -0.05]])],
  () => [st(arc(0, 0.06, 0.09, 0.11, 200, 340))], () => [L(-0.1, 0, 0.1, 0)], () => [dot(0, 0)], () => [dot(-0.08, 0), dot(0.08, 0)],
  () => [st(arc(0, 0, 0.075, 0.075, 90, 450))], () => [st(arc(0, 0, 0.08, 0.08, 50, 310))], () => [L(-0.1, 0.04, 0.1, 0.04), L(-0.1, -0.05, 0.1, -0.05)],
  () => [st(bez([-0.1, -0.05], [-0.04, 0.12], [0.04, -0.12], [0.1, 0.05]))], () => [dot(0, 0.06), dot(-0.07, -0.05), dot(0.07, -0.05)],
];

// ====================================================================== a script for a language
export function makeScript(r, lang) {
  const { ph } = lang;
  const simple = ph.sylType === 'CV' || ph.sylType === 'CVn';
  const family = r.weighted([['cut', 1], ['round', 1.2], ['hang', 1], ['joined', 1.3], ['block', 1], ['brush', 0.9], ['turn', simple && ph.vowels.length <= 5 ? 1.7 : 0]]);
  const F = { cut: famCut, round: famRound, hang: famHang, joined: famJoined, block: famBlock, brush: famBrush, turn: famTurn }[family](r.fork('family'));
  const brushSyl = family === 'brush' && simple && ph.coda.size <= 3 && ph.cons.length * ph.vowels.length <= 72;
  const kind = family === 'turn' ? 'turned'
    : family === 'brush' ? (brushSyl && r.chance(0.75) ? 'syllabary' : 'alphabet')
    : family === 'block' ? (r.chance(0.55) ? 'blocks' : 'alphabet')
    : family === 'hang' ? (r.chance(0.6) ? 'abugida' : 'alphabet')
    : family === 'round' ? (r.chance(0.45) ? 'abugida' : 'alphabet')
    : family === 'joined' ? (r.chance(0.5) ? 'marked' : 'alphabet')
    : 'alphabet';
  let dir = 'ltr'; let cols = 'rl'; let boustro = false;
  if (family === 'cut') { const d = r.weighted([['ltr', 0.5], ['rtl', 0.3], ['ox', 0.2]]); if (d === 'ox') boustro = true; else dir = d; }
  if (family === 'joined') { dir = r.weighted([['rtl', 0.55], ['ltr', 0.15], ['down', 0.3]]); cols = 'lr'; }
  if (family === 'block') dir = r.chance(0.35) ? 'down' : 'ltr';
  if (family === 'brush') dir = r.chance(kind === 'syllabary' ? 0.8 : 0.3) ? 'down' : 'ltr';
  const sep = family === 'cut' ? (r.chance(0.6) ? 'mark' : 'space') : family === 'brush' ? (r.chance(0.55) ? 'none' : 'space') : family === 'block' && kind === 'blocks' ? (r.chance(0.35) ? 'none' : 'space') : 'space';
  const writesTone = ph.tones && kind === 'alphabet' && family !== 'joined' && r.chance(0.5);
  const longStyle = kind === 'alphabet' ? r.pick(['double', 'mark']) : 'mark';
  const slant = F.slant || 0;
  const sl = (strokes) => (slant ? strokes.map((s) => ({ ...s, p: s.p.map(([x, y]) => [x + y * slant, y]) })) : strokes);

  // ---------------------------------------------------------------- which sign for which sound
  const marks = r.shuffle(MARKS.map((f, i) => i));
  const mark = (i) => MARKS[marks[i % marks.length]]();
  const pool = F.pool.slice();
  let spare = 0;
  const take = () => {
    if (pool.length) return pool.shift();
    // out of shapes: an earlier one with a dot under it, as Devanagari and Arabic make new letters
    const g = F.pool[spare++ % F.pool.length];
    return g.turns ? { ...g, turns: g.turns.map((t) => [...t, dot(g.w / 2, g.w / 2)]) } : { ...g, s: [...g.s, dot(g.w / 2, -0.2)] };
  };
  const voicedPair = { b: 'p', d: 't', g: 'k', z: 's', v: 'f', 'ʒ': 'ʃ', 'dʒ': 'tʃ', 'ɣ': 'x' };
  const featural = kind === 'alphabet' && (family === 'cut' || family === 'round' || family === 'block') && r.chance(0.4);
  const inherent = kind === 'abugida' ? [...ph.vowels].sort((a, b) => V[b].w - V[a].w)[0] : null;
  const glyph = {};
  const vmark = {};       // vowel -> { s, pos }
  const table = {};       // brush syllabary: 'k|a' -> glyph
  const cons = ph.cons; const vowels = ph.vowels;
  let carrier = null;
  const voiceTick = (g) => ({ ...g, s: [...g.s, family === 'cut' ? L(g.w * 0.2, F.asc + 0.14, g.w * 0.8, F.asc + 0.14) : family === 'block' ? L(g.w * 0.3, 1.16, g.w * 0.7, 1.16) : st(arc(g.w / 2, 1.2, 0.1, 0.07, 200, 340))] });

  if (family === 'joined') {
    // the same few shapes, told apart by dots: a voiced sound is its voiceless twin with a dot under
    const free = F.pool.slice();
    const takeJ = () => free.shift() || { shape: r.pick(Object.keys(F.shapes)), dots: 'a3' };
    const order = [...cons.filter((c) => !voicedPair[c]), ...cons.filter((c) => voicedPair[c])];
    for (const c of order) {
      const twin = voicedPair[c];
      if (twin && glyph[twin] && glyph[twin].dots === '') {
        glyph[c] = { shape: glyph[twin].shape, dots: 'b1' };
        const i = free.findIndex((g) => g.shape === glyph[c].shape && g.dots === 'b1');
        if (i >= 0) free.splice(i, 1);
      } else glyph[c] = takeJ();
    }
    if (kind === 'alphabet') for (const v of vowels) glyph[v] = takeJ();
    else {
      vowels.forEach((v, i) => { vmark[v] = { s: mark(i), pos: i % 2 ? 'below' : 'above' }; });
      carrier = { shape: 'flat', dots: '' };
    }
  } else if (kind === 'turned') {
    cons.forEach((c) => { glyph[c] = take(); });
    carrier = take();
  } else if (kind === 'syllabary') {
    for (const c of ['', ...cons]) for (const v of vowels) table[c + '|' + v] = take();
    for (const c of ph.coda) table[c + '|'] = { ...take(), small: true };
  } else if (kind === 'blocks') {
    // consonants are small slanting or curved shapes; vowels are which sides of the square around them are drawn
    const inner = r.shuffle(turnShapes().flatMap((sh) => [0, 1, 2, 3].map((k) => ({ s: turnOf(sh.p, k, sh.two), w: 1 }))));
    cons.forEach((c, i) => { glyph[c] = inner[i % inner.length]; });
    const frames = r.shuffle(['T', 'B', 'L', 'R', 'TB', 'LR', 'TL', 'TR', 'BL', 'BR', 'TLB', 'TRB', 'LTR', 'LBR']);
    vowels.forEach((v, i) => { vmark[v] = { sides: frames[i] }; });
    F.pen = F.pen.kind === 'round' ? { kind: 'round', w: r.range(0.07, 0.085) } : { ...F.pen, w: r.range(0.1, 0.125) };
  } else {
    for (const c of cons) {
      const twin = featural && voicedPair[c];
      glyph[c] = twin && glyph[twin] ? voiceTick(glyph[twin]) : take();
    }
    if (kind === 'alphabet') for (const v of vowels) glyph[v] = take();
    else {
      carrier = take();
      const spots = family === 'hang' ? ['above', 'below', 'after', 'above', 'below', 'above', 'after', 'below'] : ['above', 'below', 'above', 'after', 'below', 'above', 'below', 'after'];
      let i = 0;
      for (const v of vowels) { if (v !== inherent) { vmark[v] = { s: mark(i), pos: spots[i % spots.length] }; i++; } }
    }
  }
  const killer = mark(vowels.length + 1);        // "no vowel here", under a consonant in an abugida
  const lengthMark = mark(vowels.length + 2);
  const toneMark = { H: [st([[-0.05, -0.05], [0.07, 0.07]])], L: [st([[-0.07, 0.05], [0.05, -0.07]])] };

  // ---------------------------------------------------------------- words into cells
  // A cell is { s: strokes with roles, w: advance }.
  const tag = (strokes, roles, m) => strokes.map((s) => ({ ...s, roles, ...(m ? { m } : {}) }));
  const top = family === 'hang' ? 1.22 : family === 'cut' ? F.asc + 0.2 : 1.24;
  const place = (s, x, y) => moveGlyph(s, x, y);
  const afterMark = (roles) => ({ s: tag(sl([L(0.1, 0.92, 0.1, 0.08)]), roles), w: 0.24 });

  function plainCell(seg, role) {
    const g = glyph[base(seg)];
    const cell = { s: tag(sl(g.s), [role]), w: g.w };
    if (isLong(seg) && longStyle === 'mark') cell.s.push(...tag(place([L(-0.14, 0, 0.14, 0)], g.w / 2, top), [role], 0.7));
    const t = toneOf(seg);
    if (writesTone && t && (t === 'H' || ph.tones === 3)) cell.s.push(...tag(place(toneMark[t], g.w * 0.5 + (isLong(seg) && longStyle === 'mark' ? 0.24 : 0), top + (isLong(seg) && longStyle === 'mark' ? 0.02 : 0)), [role], 0.7));
    return cell;
  }
  function alphabet(segs, roles) {
    const cells = [];
    segs.forEach((seg, i) => {
      cells.push(plainCell(seg, roles[i]));
      if (isV(seg) && isLong(seg) && longStyle === 'double') cells.push(plainCell(base(seg) + toneOf(seg), roles[i]));
    });
    return cells;
  }
  function abugida(segs, roles) {
    const cells = [];
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i]; const next = segs[i + 1];
      const isC = !isV(seg);
      const g = isC ? glyph[seg] : carrier;
      const v = isC ? (next && isV(next) ? next : null) : seg;
      const vr = isC ? (v ? roles[i + 1] : roles[i]) : roles[i];
      const cell = { s: tag(sl(g.s), [roles[i]]), w: g.w };
      let extra = null;
      if (!v) cell.s.push(...tag(place(killer, g.w * 0.72, -0.22), [roles[i]], 0.7));
      else {
        const mk = vmark[base(v)];
        if (mk) {
          if (mk.pos === 'after') extra = { s: tag(sl(place(mk.s, 0.16, 0.5, 1.5, 3.2)), [vr]), w: 0.34 };
          else cell.s.push(...tag(place(mk.s, g.w / 2, mk.pos === 'above' ? top : -0.24), [vr], 0.75));
        }
      }
      cells.push(cell);
      if (extra) cells.push(extra);
      if (v && isLong(v)) cells.push(afterMark([vr]));
      if (isC && v) i++;
    }
    return cells;
  }
  function turned(segs, roles) {
    const cells = [];
    const small = (g, role) => ({ s: tag(moveGlyph(g.turns[0], 0, 0.62, 0.46, 0.46), [role]), w: F.s * 0.46 + 0.04 });
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i]; const next = segs[i + 1];
      if (!isV(seg) && !(next && isV(next))) { cells.push(small(glyph[seg], roles[i])); continue; }
      const g = isV(seg) ? carrier : glyph[seg];
      const v = isV(seg) ? seg : next;
      const vr = isV(seg) ? roles[i] : roles[i + 1];
      const vi = vowels.indexOf(base(v));
      const cell = { s: tag(g.turns[vi % 4], [roles[i], vr]), w: F.s };
      if (vi >= 4) cell.s.push(...tag([dot(F.s * 0.5, 1.02)], [vr]));
      if (isLong(v)) cell.s.push(...tag([dot(F.s * 0.5, vi >= 4 ? 1.2 : 1.04)], [vr]));
      cells.push(cell);
      if (!isV(seg)) i++;
    }
    return cells;
  }
  function syllabary(segs, roles) {
    const cells = [];
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i]; const next = segs[i + 1];
      if (!isV(seg) && !(next && isV(next))) {
        const g = table[seg + '|'] || table[seg + '|' + vowels[0]];
        cells.push({ s: tag(moveGlyph(g.s, 0.2, 0.02, 0.6, 0.6), [roles[i]]), w: 0.82 });
        continue;
      }
      const c = isV(seg) ? '' : seg;
      const v = isV(seg) ? seg : next;
      const g = table[c + '|' + base(v)];
      cells.push({ s: tag(g.s, isV(seg) ? [roles[i]] : [roles[i], roles[i + 1]]), w: 1 });
      if (isLong(v)) cells.push({ s: tag([st([[0.5, 0.86], [0.5, 0.14]], { press: 'taper' })], [isV(seg) ? roles[i] : roles[i + 1]]), w: 1, long: true });
      if (!isV(seg)) i++;
    }
    return cells;
  }
  function blocks(segs, roles) {
    // one square per syllable: the vowel is the frame, the opening consonant sits inside it, a closing one goes underneath
    const cells = [];
    let at = 0;
    for (const syl of ph.syllabify(segs)) {
      const n = syl.onset.length + (syl.nucleus ? 1 : 0) + syl.coda.length;
      const rs = roles.slice(at, at + n); at += n;
      const s = [];
      const y0 = syl.coda.length ? 0.37 : 0; const y1 = 1; const x0 = 0.03; const x1 = 0.97;
      const hh = y1 - y0;
      const vr = rs[syl.onset.length] ?? rs[rs.length - 1];
      if (syl.nucleus) {
        const side = { T: [x0, y1, x1, y1], B: [x0, y0, x1, y0], L: [x0, y1, x0, y0], R: [x1, y1, x1, y0] };
        const inset = { T: [x0 + 0.12, y1 - 0.11, x1 - 0.12, y1 - 0.11], B: [x0 + 0.12, y0 + 0.11, x1 - 0.12, y0 + 0.11], L: [x0 + 0.11, y1 - 0.12, x0 + 0.11, y0 + 0.12], R: [x1 - 0.11, y1 - 0.12, x1 - 0.11, y0 + 0.12] };
        [...vmark[base(syl.nucleus)].sides].forEach((k, i) => {
          s.push(...tag([L(...side[k])], [vr]));
          if (!i && isLong(syl.nucleus)) s.push(...tag([L(...inset[k])], [vr]));
        });
      }
      const ib = [0.26, y0 + hh * 0.24, 0.74, y1 - hh * 0.24];
      if (!syl.onset.length) s.push(...tag([dot(0.5, y0 + hh / 2)], [vr]));
      syl.onset.forEach((c, i) => {
        const wEach = (ib[2] - ib[0] + (syl.onset.length > 1 ? 0.12 : 0)) / syl.onset.length;
        const bx = ib[0] - (syl.onset.length > 1 ? 0.06 : 0) + i * wEach;
        s.push(...tag(fit(glyph[c].s, bx + (i ? 0.04 : 0), ib[1], bx + wEach - (syl.onset.length > 1 && !i ? 0.04 : 0), ib[3]), [rs[i]]));
      });
      syl.coda.forEach((c, i) => {
        const wEach = 0.5 / syl.coda.length;
        s.push(...tag(fit(glyph[c].s, 0.25 + i * wEach + (i ? 0.03 : 0), 0.02, 0.25 + (i + 1) * wEach - (syl.coda.length > 1 && !i ? 0.03 : 0), 0.25), [rs[syl.onset.length + 1 + i]], 0.8));
      });
      cells.push({ s, w: 1 });
    }
    return cells;
  }
  function joined(segs, roles) {
    // the pen runs along the line without lifting; dots and marks go on afterwards
    const line = []; const extras = [];
    let x = 0;
    const items = [];
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      if (kind === 'marked') {
        const next = segs[i + 1];
        if (isV(seg)) items.push({ g: carrier, role: roles[i], v: seg, vr: roles[i] });
        else if (next && isV(next)) { items.push({ g: glyph[seg], role: roles[i], v: next, vr: roles[i + 1] }); i++; }
        else items.push({ g: glyph[seg], role: roles[i] });
      } else {
        items.push({ g: glyph[base(seg)], role: roles[i] });
        if (isV(seg) && isLong(seg)) items.push({ g: glyph[base(seg)], role: roles[i] });
      }
    }
    items.forEach((it, i) => {
      const sh = F.shapes[it.g.shape]();
      let p = move(sh.p, x, 0);
      const lastOne = i === items.length - 1;
      if (lastOne && F.tail !== 'none') {
        const [ex, ey] = p[p.length - 1];
        const t = F.tail === 'sweep' ? bez([ex, ey], [ex + 0.3, ey], [ex + 0.42, ey - 0.2], [ex + 0.2, ey - 0.46])
          : F.tail === 'flick' ? bez([ex, ey], [ex + 0.16, ey], [ex + 0.26, ey + 0.1], [ex + 0.3, ey + 0.36])
          : [[ex, ey], [ex + 0.36, ey]];
        p = cat(p, t);
      }
      line.push({ p, roles: [it.role] });
      const cx = x + sh.w * (it.g.shape === 'tall' || it.g.shape === 'flag' ? 0.62 : 0.5);
      const d = it.g.dots;
      const above = (sh.top || 0) + 0.2; const below = (sh.low || 0) - 0.2;
      const n = +d[1] || 0;
      const y = d[0] === 'a' ? above : below;
      const pip = (px, py) => extras.push({ ...(F.pip === 'dot' ? dot(px, py) : F.pip === 'tick' ? st([[px - 0.045, py - 0.06], [px + 0.045, py + 0.06]], { m: 0.7 }) : st(arc(px, py, 0.055, 0.055, 90, 450), { m: 0.55 })), roles: [it.role] });
      const gapX = F.pip === 'ring' ? 0.1 : 0.085;
      if (n === 1) pip(cx, y);
      if (n >= 2) { pip(cx - gapX, y); pip(cx + gapX, y); }
      if (n === 3) pip(cx, y + (d[0] === 'a' ? 0.16 : -0.16));
      if (it.v) {
        const mk = vmark[base(it.v)];
        const my = mk.pos === 'above' ? (d[0] === 'a' ? above + (n === 3 ? 0.36 : 0.22) : above + 0.04) : (d[0] === 'b' ? below - (n === 3 ? 0.36 : 0.22) : below - 0.02);
        extras.push(...tag(place(mk.s, cx, my), [it.vr], 0.7));
        if (isLong(it.v)) extras.push(...tag(place([L(-0.09, 0, 0.09, 0)], cx, my + (mk.pos === 'above' ? 0.17 : -0.17)), [it.vr], 0.7));
      }
      x += sh.w;
    });
    const w = x + (F.tail === 'none' ? 0 : F.tail === 'long' ? 0.36 : 0.3);
    return [{ s: [...line, ...extras], w, joined: true }];
  }
  const toCells = { alphabet: family === 'joined' ? joined : alphabet, marked: joined, abugida, turned, syllabary, blocks }[kind];

  function wordCells(segs, roles) {
    const rs = roles || segs.map(() => '');
    const cells = toCells(segs, rs);
    if (F.bar && cells.length) {
      // the line along the top, drawn once the letters hang in place
      const w = cells.reduce((a, c) => a + c.w, 0);
      cells[cells.length - 1].bar = { p: [[-0.08, 1], [w + 0.08, 1]], from: cells.length - 1 };
    }
    return cells;
  }

  // ---------------------------------------------------------------- marks between words and at the end
  const H = family === 'cut' ? F.asc : 1;
  const ends = {
    cut: { stop: [dot(0.1, H * 0.82), dot(0.1, H * 0.5), dot(0.1, H * 0.18)], q: [dot(0.1, H * 0.82), dot(0.1, H * 0.5), dot(0.1, H * 0.18), L(0.26, H * 0.3, 0.42, H * 0.7)], w: 0.3 },
    round: { stop: [st(arc(0.16, 0.16, 0.11, 0.11, 90, 450))], q: [st(extend(arc(0.16, 0.16, 0.11, 0.11, 90, 450), 'tail')), dot(0.16, 0.62)], w: 0.34 },
    hang: { stop: [L(0.1, 1.04, 0.1, 0)], q: [L(0.1, 1.04, 0.1, 0), st(bez([0.26, 1.04], [0.5, 0.9], [0.3, 0.6], [0.3, 0.38])), dot(0.3, 0.08)], w: 0.3 },
    joined: { stop: [dot(0.1, 0.1), dot(0.27, 0.1), dot(0.185, 0.27)], q: [dot(0.1, 0.27), dot(0.27, 0.27), dot(0.185, 0.1), dot(0.185, 0.5)], w: 0.4 },
    block: { stop: [st(arc(0.18, 0.14, 0.11, 0.11, 90, 450))], q: [st(arc(0.18, 0.14, 0.11, 0.11, 90, 450)), L(0.18, 0.44, 0.18, 0.82)], w: 0.4 },
    brush: { stop: [st(arc(0.2, 0.16, 0.1, 0.1, 100, 440), { press: 'even' })], q: [st(arc(0.2, 0.16, 0.1, 0.1, 100, 440), { press: 'even' }), st([[0.14, 0.62], [0.26, 0.48]], { press: 'drop' })], w: 0.44 },
    turn: { stop: [L(0.06, 0.2, 0.26, 0.6), L(0.26, 0.2, 0.06, 0.6)], q: [L(0.06, 0.2, 0.26, 0.6), L(0.26, 0.2, 0.06, 0.6), dot(0.16, 0.86)], w: 0.36 },
  }[family];
  const divider = family === 'cut' ? [dot(0.1, H * 0.66), dot(0.1, H * 0.34)] : [dot(0.1, 0.5)];
  const space = sep === 'space' ? (family === 'joined' ? 0.42 : family === 'brush' || kind === 'blocks' ? 0.5 : family === 'turn' ? 0.5 : 0.56) : sep === 'mark' ? 0.2 : (dir === 'down' ? 0.1 : F.gap);

  // words: [{ segs, roles }], end: 'stop' | 'q' | null -> units a line may break between
  function compose(words, end) {
    const units = [];
    words.forEach((w, i) => {
      const cells = wordCells(w.segs, w.roles);
      if (sep === 'mark' && i) units.push({ cells: [{ s: tag(divider, ['']), w: 0.2, point: true }], space: 0.2, glue: true });
      if (sep === 'none') cells.forEach((c, k) => units.push({ cells: [c], space: i && !k ? space : 0 }));
      else units.push({ cells, space: i ? space : 0 });
    });
    if (end) units.push({ cells: [{ s: tag(ends[end], ['end']), w: ends.w, point: true }], space: sep === 'mark' ? 0.24 : 0.2, glue: true });
    return units;
  }

  // ---------------------------------------------------------------- what to say about it
  const how = {
    alphabet: family === 'joined' ? 'an alphabet, joined' : 'an alphabet', marked: 'consonants on a line, vowels as marks', abugida: 'consonants with a vowel built in',
    turned: 'syllables, by turning', syllabary: 'a sign for each syllable', blocks: 'a block for each syllable',
  }[kind];
  const way = boustro ? 'written back and forth' : dir === 'ltr' ? 'written left to right' : dir === 'rtl' ? 'written right to left' : 'written top to bottom';
  const notes = [];
  notes.push({
    cut: 'The letters are straight strokes, made to be cut into wood or stone, like runes and the Old Turkic letters of the Orkhon valley.',
    round: 'The letters are bowls, curls and loops, drawn in one line each, as in Burmese and Georgian.',
    hang: 'The letters hang from a line drawn along the top of each word, as in Devanagari and Bengali.',
    joined: `The letters of a word join along one line. Several share a shape and are told apart by ${F.pip === 'dot' ? 'dots' : F.pip === 'tick' ? 'small strokes' : 'small rings'}, as Arabic tells its letters apart by dots.`,
    block: 'The letters are square, built from upright and level strokes.',
    brush: 'Each sign is one sweep of a brush, sometimes with a dab beside it.',
    turn: 'Each consonant has one shape, and the way it is turned gives the vowel, as in the syllabics written for Cree and Inuktitut.',
  }[family]);
  if (kind === 'blocks') notes.length = 0;
  if (kind === 'alphabet') notes.push('There is one letter for each sound.');
  if (kind === 'abugida') notes.push(`Each letter is a consonant with <i>${ph.romSeg(inherent)}</i> built in. A mark changes the vowel, and another takes it away, as in Devanagari.`);
  if (kind === 'marked') notes.push('Only consonants sit on the line. Vowels are small marks above and below it, as in fully pointed Arabic and Hebrew.');
  if (kind === 'syllabary') notes.push('There is a sign for each syllable, not for each sound, as in Japanese kana.');
  if (kind === 'blocks') notes.push('The sounds of a syllable are packed into one square. The consonant sits in the middle, the vowel is which sides of the square are drawn around it, and a closing consonant goes underneath. Korean Hangul also packs each syllable into a square, in its own way.');
  if (featural) notes.push('A voiced sound is the letter of its voiceless twin with a stroke above it, as Japanese adds two ticks to turn <i>ka</i> into <i>ga</i>.');
  if (family === 'joined' && F.tail !== 'none') notes.push('The last letter of a word ends in a tail.');
  notes.push(boustro ? 'Lines run one way and then back, with the letters turned round, as an ox plows a field. Early Greek was cut this way.'
    : dir === 'ltr' ? 'It runs from left to right.'
    : dir === 'rtl' ? 'It runs from right to left, as Arabic and Hebrew do.'
    : cols === 'lr' ? 'It runs down the page in columns, and the columns go from left to right, as in Mongolian.'
    : 'It runs down the page in columns, and the columns go from right to left, as Chinese and Japanese traditionally do.');
  if (sep === 'mark') notes.push('A mark stands between words, as in Old Turkic and Ethiopic.');
  if (sep === 'none') notes.push('Words are not spaced apart, as in Thai and Chinese.');
  if (ph.tones) notes.push(writesTone ? 'A small stroke above a vowel shows its tone.' : 'Tones are not written. Written Hausa and Somali leave them out too.');
  if (ph.long) notes.push(longStyle === 'double' ? 'A long vowel is written twice.' : kind === 'turned' ? 'A dot above marks a long vowel, as in Cree.' : 'A long vowel takes a mark of its own.');

  // the signs, for the chart: a list of { label, segs }, or a grid for scripts that write syllables
  let chart;
  const lab = (segs) => ph.rom(segs);
  if (kind === 'turned' || kind === 'syllabary') {
    chart = { grid: true, cols: vowels.map((v) => ph.romSeg(v)), rows: [{ label: '', cells: vowels.map((v) => [v]) }, ...cons.map((c) => ({ label: ph.romSeg(c), cells: vowels.map((v) => [c, v]) }))] };
  } else if (kind === 'abugida') {
    chart = { list: [...cons.map((c) => ({ label: lab([c, inherent]), segs: [c, inherent] })), ...vowels.filter((v) => v !== inherent).map((v) => ({ label: lab([cons[0], v]), segs: [cons[0], v], mark: true }))] };
  } else if (kind === 'marked') {
    chart = { list: [...cons.map((c) => ({ label: lab([c]), segs: [c] })), ...vowels.map((v) => ({ label: lab([cons[0], v]), segs: [cons[0], v], mark: true }))] };
  } else if (kind === 'blocks') {
    chart = { list: [...cons.map((c) => ({ label: lab([c, vowels[0]]), segs: [c, vowels[0]] })), ...vowels.slice(1).map((v) => ({ label: lab([cons[0], v]), segs: [cons[0], v], mark: true }))] };
  } else {
    chart = { list: [...cons, ...vowels].map((c) => ({ label: lab([c]), segs: [c] })) };
  }

  return {
    family, kind, dir, cols, boustro, sep, pen: F.pen, wob: F.wob ?? 1,
    metrics: { asc: F.asc, desc: F.desc, gap: F.gap, line: F.asc + F.desc + (family === 'hang' ? 0.5 : 0.42), colW: family === 'joined' ? F.asc + F.desc : 1, colGap: family === 'joined' ? 0.2 : 0.42, vgap: family === 'brush' ? 0.14 : 0.2 },
    compose, wordCells, chart, notes, summary: `${way}`, how,
  };
}

// ====================================================================== setting cells in lines
// units from compose(); size is the em in pixels; max is the longest a line (or a column) may run, in pixels.
export function layout(script, units, { size, max = Infinity, align = 'start' } = {}) {
  const M = script.metrics;
  const down = script.dir === 'down';
  const limit = max / size;
  const lines = [];
  let cur = { items: [], adv: 0 };
  const advOf = (c) => (down && !c.joined ? (c.point ? 0.5 : c.long ? 0.9 : M.asc + M.desc - 0.06 + M.vgap) : c.w + (c.joined || c.point ? 0 : M.gap));
  for (const u of units) {
    const uw = u.cells.reduce((a, c) => a + advOf(c), 0);
    const lead = cur.items.length ? u.space : 0;
    if (cur.items.length && !u.glue && cur.adv + lead + uw > limit) { lines.push(cur); cur = { items: [], adv: 0 }; }
    let x = cur.adv + (cur.items.length ? u.space : 0);
    const first = cur.items.length;
    for (const c of u.cells) { cur.items.push({ c, x, unit0: first }); x += advOf(c); }
    cur.adv = x;
  }
  if (cur.items.length) lines.push(cur);
  const run = Math.max(...lines.map((l) => l.adv), 0.01);
  const strokes = [];
  let total = 0; let n = 0;
  const wob = (script.wob ?? 1) * 0.011;
  const push = (s, toPx, phase) => {
    const pts = (s.dot ? s.p : densify(s.p)).map(([x, y]) => {
      const [X, Y] = toPx(x, y);
      return [(X + wob * (Math.sin(1.9 * X + 2.3 * Y + phase) + 0.5 * Math.sin(5.1 * X - 3.7 * Y + phase * 2))) * size, (Y + wob * (Math.sin(2.1 * Y - 1.7 * X + phase * 1.3) + 0.5 * Math.sin(4.3 * X + 3.1 * Y))) * size];
    });
    let len = 0;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(len); }
    if (s.dot) len = size * 0.12;
    strokes.push({ pts, cum, len, at: total, roles: s.roles || [''], dot: !!s.dot, m: s.m || 1, press: s.press });
    total += len + size * 0.1;       // the pen lifts and comes down again
  };
  let w; let h;
  if (!down) {
    w = run; h = M.asc + M.desc + (lines.length - 1) * M.line;
    lines.forEach((line, li) => {
      const back = (script.dir === 'rtl') !== (script.boustro && li % 2 === 1);
      const flip = script.boustro && li % 2 === 1;
      const off = align === 'center' ? (run - line.adv) / 2 : 0;
      const y0 = M.asc + li * M.line;
      line.items.forEach((it, k) => {
        const cw = it.c.w;
        const X0 = back ? run - off - it.x - cw : off + it.x;
        const mirror = flip || (back && it.c.joined);
        const toPx = (x, y) => [X0 + (mirror ? cw - x : x), y0 - y];
        for (const s of it.c.s) push(s, toPx, n * 1.7);
        if (it.c.bar) {
          // the top line of the whole word: from the first cell of the word to this one
          let wordW = 0; let x0 = Infinity;
          for (let q = k; q >= 0 && line.items[q].unit0 === it.unit0; q--) { x0 = Math.min(x0, line.items[q].x); }
          wordW = it.x + cw - x0;
          const bx = back ? run - off - x0 - wordW : off + x0;
          push({ p: [[-0.08, 1], [wordW + 0.08, 1]], roles: ['bar'] }, (x, y) => [bx + x, y0 - y], n * 1.7);
        }
        n++;
      });
    });
  } else {
    const pitch = M.colW + M.colGap;
    w = lines.length * pitch - M.colGap; h = run;
    lines.forEach((line, li) => {
      const X0 = script.cols === 'rl' ? (lines.length - 1 - li) * pitch : li * pitch;
      const off = align === 'center' ? (run - line.adv) / 2 : 0;
      for (const it of line.items) {
        const c = it.c;
        const toPx = c.joined
          ? (x, y) => [X0 + M.asc * 0.92 - y, off + it.x + x]
          : (x, y) => [X0 + (M.colW - c.w) / 2 + x, off + it.x + (c.point ? 0.5 : M.asc) - y];
        for (const s of c.s) push(s, toPx, n * 1.7);
        n++;
      }
    });
  }
  return { strokes, w: w * size, h: h * size, size, pen: script.pen, total, lines: lines.length };
}

// ====================================================================== ink
const quad = (ctx, ax, ay, bx, by, cx, cy, dx, dy) => {
  const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay) + (cx - ax) * (dy - ay) - (dx - ax) * (cy - ay);
  if (area >= 0) { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.lineTo(dx, dy); } else { ctx.moveTo(dx, dy); ctx.lineTo(cx, cy); ctx.lineTo(bx, by); ctx.lineTo(ax, ay); }
  ctx.closePath();
};
const turn = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
// the outline round a handful of points, wound the way the fills here expect
function hull(P) {
  P.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const lo = [];
  for (const p of P) { while (lo.length >= 2 && turn(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  const up = [];
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && turn(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  lo.pop(); up.pop();
  return lo.concat(up);
}
const disc = (ctx, x, y, rr) => { ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.closePath(); };
// a ribbon along a line, as wide at each point as half[i] says, with round joints
function ribbon(ctx, pts, half, roundEnds) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]; const [x1, y1] = pts[i + 1];
    const d = Math.hypot(x1 - x0, y1 - y0);
    if (d < 1e-6) continue;
    const nx = -(y1 - y0) / d; const ny = (x1 - x0) / d;
    quad(ctx, x0 - nx * half[i], y0 - ny * half[i], x0 + nx * half[i], y0 + ny * half[i], x1 + nx * half[i + 1], y1 + ny * half[i + 1], x1 - nx * half[i + 1], y1 - ny * half[i + 1]);
  }
  for (let i = roundEnds ? 0 : 1; i < pts.length - (roundEnds ? 0 : 1); i++) if (half[i] > 0.05) disc(ctx, pts[i][0], pts[i][1], half[i]);
}
const PRESS = {
  taper: (t) => (0.72 + 0.5 * Math.min(1, t * 6)) * (1 - 0.8 * t ** 2.2),
  even: (t) => 0.8 + 0.35 * Math.sin(Math.PI * t) ** 0.6 * (1 - 0.35 * t),
  swell: (t) => (0.45 + 1.15 * t ** 1.3) * (t > 0.9 ? 1 - (t - 0.9) * 7 : 1),
  drop: (t) => 0.5 + 1.2 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.8 * (0.4 + 0.6 * t),
  flow: (t) => (0.62 + 0.7 * Math.min(1, t * 5) - 0.25 * Math.sin(Math.PI * t)) * (1 - 0.72 * t ** 3),
};

function trace(ctx, s, pts, cum, len, pen, size) {
  const w = pen.w * size * s.m;
  if (s.dot) {
    const [x, y] = pts[0];
    if (pen.kind === 'broad') {
      const a = pen.angle * RAD; const k = w * 0.5;
      const ux = Math.cos(a) * k; const uy = -Math.sin(a) * k; const vx = Math.sin(a) * k * 0.92; const vy = Math.cos(a) * k * 0.92;
      quad(ctx, x - ux - vx, y - uy - vy, x + ux - vx, y + uy - vy, x + ux + vx, y + uy + vy, x - ux + vx, y - uy + vy);
    } else if (pen.kind === 'cut') {
      const k = w * 0.78;
      quad(ctx, x, y - k, x + k, y, x, y + k, x - k, y);
    } else disc(ctx, x, y, pen.kind === 'brush' ? w * 1.25 : w * 0.72);
    return;
  }
  if (pts.length < 2) return;
  const n = pts.length;
  if (pen.kind === 'broad') {
    // a flat nib held at one angle: a thin rectangle dragged along the line, so a stroke is as wide
    // as the nib going one way and as thin as its edge going the other
    const a = pen.angle * RAD;
    const ux = Math.cos(a) * w / 2; const uy = -Math.sin(a) * w / 2;      // y runs down the canvas
    const hh = pen.hair * size * s.m / 2;
    const vx = Math.sin(a) * hh; const vy = Math.cos(a) * hh;
    const nib = [[-ux - vx, -uy - vy], [ux - vx, uy - vy], [ux + vx, uy + vy], [-ux + vx, -uy + vy]];
    for (let i = 0; i < n - 1; i++) {
      const [x0, y0] = pts[i]; const [x1, y1] = pts[i + 1];
      const P = [];
      for (const [dx, dy] of nib) { P.push([x0 + dx, y0 + dy], [x1 + dx, y1 + dy]); }
      const H = hull(P);
      ctx.moveTo(H[0][0], H[0][1]);
      for (let k = 1; k < H.length; k++) ctx.lineTo(H[k][0], H[k][1]);
      ctx.closePath();
    }
  } else if (pen.kind === 'round') {
    ribbon(ctx, pts, pts.map(() => w / 2), true);
  } else if (pen.kind === 'cut') {
    // a knife cut: widest where it starts, narrowing as it is drawn out
    ribbon(ctx, pts, pts.map((_, i) => (w / 2) * (1.12 - 0.5 * (cum[i] / (len || 1)))), false);
  } else {
    const f = PRESS[s.press || 'taper'];
    ribbon(ctx, pts, pts.map((_, i) => Math.max(0.2, f(cum[i] / (len || 1))) * w), true);
  }
}

// cut a stroke off at a length along it
function clip(s, upto) {
  if (upto >= s.len || s.dot) return s.pts;
  const out = [s.pts[0]];
  for (let i = 1; i < s.pts.length; i++) {
    if (s.cum[i] <= upto) { out.push(s.pts[i]); continue; }
    const t = (upto - s.cum[i - 1]) / (s.cum[i] - s.cum[i - 1]);
    out.push([s.pts[i - 1][0] + (s.pts[i][0] - s.pts[i - 1][0]) * t, s.pts[i - 1][1] + (s.pts[i][1] - s.pts[i - 1][1]) * t]);
    break;
  }
  return out;
}

// t is how much has been written, 0 to 1. `hot(role)` picks the strokes drawn in the second ink.
export function paint(ctx, laid, { ink = '#111', hot = null, hotInk = '#c8321f', t = 1, x = 0, y = 0 } = {}) {
  const upto = t >= 1 ? Infinity : laid.total * t;
  let tip = null;                 // where the pen is, while it is still writing
  ctx.save();
  ctx.translate(x, y);
  for (const pass of [0, 1]) {
    if (pass && !hot) break;
    ctx.beginPath();
    for (const s of laid.strokes) {
      const isHot = hot ? s.roles.some(hot) : false;
      if ((pass === 1) !== isHot) continue;
      if (s.at >= upto) continue;
      const part = upto === Infinity ? s.pts : clip(s, upto - s.at);
      if (upto !== Infinity && part.length) tip = part[part.length - 1];
      trace(ctx, s, part, s.cum, s.len, laid.pen, laid.size);
    }
    ctx.fillStyle = pass ? hotInk : ink;
    ctx.fill('nonzero');
  }
  ctx.restore();
  return tip ? [tip[0] + x, tip[1] + y] : null;
}
