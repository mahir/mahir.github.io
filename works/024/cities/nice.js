// Nice: the Baie des Anges in the manner of Raoul Dufy. The Promenade des
// Anglais sweeps up the sheet from the near corner to the far end of the bay,
// lined with palms, blue chairs, strollers, lamps and flags, the road and its
// cars, the hotels behind it with the Negresco's pink dome, the hills above;
// the sea is one great ultramarine full of sailboats. The color is washed on
// loosely and never quite where the line is: a quick black pen draws over it.

import { Plate, W, H } from '../print.js';

const PAPER = '#fbf8f0', INKC = '#16161e';
const ULTRA = '#1f3fae', ULTRA_D = '#142c86', CERUL = '#5aa6dc', SKY = '#a9d3ef', TURQ = '#38b0b4';
const PINK = '#f08aa4', ROSE = '#f6b9c2', RED = '#e0383a', VERM = '#ee5a2f', YEL = '#f6d04a', OCHRE = '#e8b25a';
const GREEN = '#6fb25a', GREEN_D = '#3f8a45', OLIVE = '#a3b84e', VIOLET = '#8e7cc8', LILAC = '#c9bde6', COBALT = '#2a58c8';
const SAND = '#efd7a6', GREY = '#d9d5e6';

export const city = {
  id: 'nice', name: 'Nice',
  alt: "A watercolor in Raoul Dufy's manner: the Promenade des Anglais curving up from the near corner along the Baie des Anges, with palms, blue chairs, strollers, lamps and flags, cars on the road, the hotels behind with the Negresco's pink dome, villas on the green hills, the beach with parasols, and an ultramarine sea full of sailboats, under the name in a looping script",
  google: 'family=Sacramento',
  wall: '#152a5c',
  fonts: [['400 400px "Sacramento"', 'Nice'], ['400 76px "Sacramento"', 'Promenade des Anglais']],
  build,
};

// ================================================================ the bay
// the shore: a curve from the near corner (t = 0) to the far end of the bay (t = 1)
const P0 = [1760, 1860], P1 = [1000, 1150], P2 = [150, 790];
const HZ = 598; // the horizon
function at(t) {
  const u = 1 - t;
  return [u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0], u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1]];
}
function nrm(t) { // pointing inland
  const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
  const l = Math.hypot(dx, dy);
  return [-dy / l, dx / l];
}
const sc = (t) => 1.7 * (1 - t) ** 1.5 + 0.07; // how big things are there
// a point inland of the shore by off (in sheet units at the near end)
function pt(t, off, up = 0) { const [x, y] = at(t), [nx, ny] = nrm(t), s = sc(t); return [x + nx * off * s, y + ny * off * s - up * s]; }
function band(o0, o1, t0 = 0, t1 = 1, n = 60) {
  const a = [], b = [];
  for (let i = 0; i <= n; i++) { const t = t0 + ((t1 - t0) * i) / n; a.push(pt(t, o0)); b.push(pt(t, o1)); }
  return [...a, ...b.reverse()];
}
// the strips along the shore, in units inland
const BEACH = [0, 34], PROM = [34, 150], ROAD = [150, 230], FRONT = 238;

// ================================================================ the brush and the pen
function bounds(pts, pad = 0) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}
// a wash: the shape loosened at the edges, a little off where the pen will go
function loosen(r, pts, amp, dx = 0, dy = 0) {
  const out = [];
  const n = pts.length;
  const ph = r() * 6, f = r.range(2, 5);
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i], [x2, y2] = pts[(i + 1) % n];
    const k = i / n;
    const j = amp * (0.55 * Math.sin(k * Math.PI * 2 * f + ph) + 0.45 * r.range(-1, 1));
    out.push([x + dx + j, y + dy + j * 0.6]);
    // fill long edges so the wobble shows along them
    const L = Math.hypot(x2 - x, y2 - y), m = Math.floor(L / 40);
    for (let q = 1; q < m; q++) { const u = q / m; out.push([x + (x2 - x) * u + dx + r.range(-amp, amp) * 0.6, y + (y2 - y) * u + dy + r.range(-amp, amp) * 0.6]); }
  }
  return out;
}
function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
function circ(x, y, rx, ry = rx, n = 18) { const o = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; o.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]); } return o; }
// a pen line, a little shaky
function shaky(r, pts, j = 1.2) { return pts.map(([x, y]) => [x + r.range(-j, j), y + r.range(-j, j)]); }

class Queue {
  constructor() { this.q = []; }
  add(layer, m) { this.q.push([layer, m]); }
  // washes: several patches of one color as one mark
  wash(layer, shapes, color, o) {
    const all = shapes.flat(), b = bounds(all, 8), a = o.alpha ?? 0.82;
    this.add(layer, {
      t: o.t, d: o.d ?? 0.9, reveal: o.reveal || 'fade', ease: o.ease || 'out', box: b,
      draw: (c) => {
        c.globalAlpha *= a; c.fillStyle = color; c.beginPath();
        for (const s of shapes) { c.moveTo(s[0][0], s[0][1]); for (let i = 1; i < s.length; i++) c.lineTo(s[i][0], s[i][1]); c.closePath(); }
        c.fill();
        // the pigment gathers at the edge as it dries
        c.globalAlpha *= 0.35; c.strokeStyle = color; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();
      },
    });
  }
  // pen lines, drawn one after another as by one hand
  pen(layer, lines, o) {
    if (!lines.length) return;
    const lens = lines.map((l) => { let s = 0; for (let i = 1; i < l.length; i++) s += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]); return s; });
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    const b = bounds(lines.flat(), (o.w || 2.5) + 4);
    const color = o.color || INKC, w = o.w || 2.6;
    this.add(layer, {
      t: o.t, d: o.d ?? 1.0, reveal: 'draw', ease: o.ease || 'inOut', box: b,
      draw: (c, q) => {
        c.strokeStyle = color; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
        let left = total * q;
        c.beginPath();
        for (let k = 0; k < lines.length && left > 0; k++) {
          const l = lines[k];
          c.moveTo(l[0][0], l[0][1]);
          for (let i = 1; i < l.length; i++) {
            const seg = Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]);
            if (seg >= left) { const u = left / (seg || 1); c.lineTo(l[i - 1][0] + (l[i][0] - l[i - 1][0]) * u, l[i - 1][1] + (l[i][1] - l[i - 1][1]) * u); left = 0; break; }
            c.lineTo(l[i][0], l[i][1]); left -= seg;
          }
        }
        c.stroke();
      },
    });
  }
  flush(p) {
    this.q.forEach((e, i) => { e[2] = i; });
    this.q.sort((a, b) => a[1].t - b[1].t || a[2] - b[2]);
    for (const [layer, m] of this.q) p.mark(layer, m);
  }
}

function build() {
  const p = new Plate({ paper: PAPER, seed: 1926 });
  const r = p.r;
  p.stack('wash', 'wash2', 'ink', 'wash3', 'ink2', 'live', 'title');
  const Q = new Queue();
  sky(Q, r);
  hills(Q, r);
  sea(Q, r);
  shore(Q, r);
  hotels(Q, r);
  promenade(Q, r);
  palms(Q, r);
  title(Q);
  Q.flush(p);
  life(p, r);
  return p;
}

// ================================================================ sky, hills, sea
const RIDGE = (x) => HZ - 10 - (x - 240) * 0.2 + Math.sin(x * 0.012) * 22 + Math.sin(x * 0.031) * 9;
function sky(Q, r) {
  // the sky washed in two blues, white paper left in the middle of it
  const top = loosen(r, [[-20, -20], [W + 20, -20], [W + 20, 230], [1100, 300], [600, 260], [-20, 330]], 22);
  const low = loosen(r, [[-20, 420], [700, 380], [900, 420], [900, HZ + 10], [-20, HZ + 10]], 18);
  Q.wash('wash', [top], SKY, { t: 0.3, d: 1.2, reveal: 'wipe', alpha: 0.75 });
  Q.wash('wash', [low], '#cfe6f4', { t: 0.7, d: 1.0, reveal: 'wipe', alpha: 0.8 });
  // a few quick clouds and the line of the horizon, in pen
  const cl = [];
  for (const [x, y, w] of [[1120, 150, 170], [1390, 250, 120], [860, 290, 100]]) {
    // a cloud: a run of loops along a flat foot
    const pts = [], n = Math.round(w / 34);
    for (let k = 0; k <= n * 16; k++) {
      const u = k / (n * 16), a = u * n * Math.PI * 2, rr = 16 + Math.sin(u * Math.PI) * 10;
      pts.push([x - w / 2 + u * w + Math.cos(a + Math.PI) * rr * 0.8, y - Math.sin(u * Math.PI) * 16 + Math.sin(a + Math.PI) * rr * 0.7 - rr * 0.5]);
    }
    cl.push(shaky(r, pts, 0.8));
    cl.push(shaky(r, [[x - w * 0.55, y + 4], [x + w * 0.55, y + 2]], 1));
  }
  const cw = [[1120, 136, 110, 34], [1390, 236, 80, 26], [860, 276, 66, 22]].map(([x, y, a, b2]) => loosen(r, circ(x + 14, y + 6, a, b2), 8));
  Q.wash('wash', cw, PAPER, { t: 1.0, d: 0.8, alpha: 0.9 });
  Q.pen('ink', cl, { t: 1.2, d: 1.2, w: 2 });
  Q.pen('ink', [shaky(r, [[-10, HZ], [400, HZ - 1], [700, HZ + 1]], 0.6)], { t: 1.0, d: 0.8, w: 2 });
  // Cap d'Antibes, far and low on the horizon
  const cap = [[-20, HZ], [40, HZ - 12], [110, HZ - 18], [170, HZ - 10], [210, HZ]];
  Q.wash('wash', [loosen(r, cap, 4, 8, 3)], VIOLET, { t: 1.4, d: 0.8, alpha: 0.55 });
  Q.pen('ink', [shaky(r, cap, 0.8)], { t: 1.6, d: 0.8, w: 1.8 });
}

function hills(Q, r) {
  const ridge = []; for (let x = 240; x <= W + 20; x += 20) ridge.push([x, RIDGE(x)]);
  const land = [...ridge, [W + 20, 1100], [900, 1000], [400, 840], [P2[0] - 6, P2[1] + 6], [190, HZ + 2]];
  Q.wash('wash', [loosen(r, land, 14, 4, -8)], GREEN, { t: 1.6, d: 1.2, reveal: 'fade', alpha: 0.7 });
  // violet shadows and olive patches over it
  const pat = [];
  for (let i = 0; i < 18; i++) { const x = r.range(300, 1580), y = RIDGE(x) + r.range(30, 300); pat.push(loosen(r, circ(x, y, r.range(50, 130), r.range(20, 44)), 10)); }
  Q.wash('wash', pat.filter((_, i) => i % 3 === 0), YEL, { t: 2.2, d: 0.9, alpha: 0.5 });
  Q.wash('wash', pat.filter((_, i) => i % 3 === 1), OLIVE, { t: 2.4, d: 0.9, alpha: 0.6 });
  Q.wash('wash', pat.filter((_, i) => i % 3 === 2), TURQ, { t: 2.5, d: 0.9, alpha: 0.4 });
  // the ridge in pen, and scribbled trees, cypresses and villas on the slopes
  Q.pen('ink', [shaky(r, ridge, 1.2)], { t: 2.0, d: 1.2, w: 2.2 });
  const loops = [], villas = [], vw = [];
  for (let i = 0; i < 80; i++) {
    const x = r.range(300, 1590), y = RIDGE(x) + r.range(14, 320);
    if (y > 760 + (x - 300) * 0.25 || x < 300) continue;
    if (r() < 0.6) {
      // a tree: a little loop of the pen
      const rr = r.range(5, 10), l = [];
      for (let k = 0; k <= 14; k++) { const a = (k / 14) * Math.PI * 2.3; l.push([x + Math.cos(a) * rr + k * 0.4, y + Math.sin(a) * rr * 0.8]); }
      loops.push(l);
    } else if (r() < 0.35) {
      loops.push([[x, y + 14], [x - 3, y], [x, y - 18], [x + 3, y], [x, y + 14]]); // a cypress
    } else {
      // a villa: a box with a red roof
      const w = r.range(18, 30), h = w * 0.6;
      villas.push([x, y, w, h]);
      vw.push(shaky(r, [[x, y], [x, y - h], [x + w, y - h], [x + w, y], [x, y]], 0.6), shaky(r, [[x - 3, y - h], [x + w / 2, y - h - 8], [x + w + 3, y - h]], 0.6));
    }
  }
  Q.wash('wash2', villas.map(([x, y, w, h]) => loosen(r, rect(x + 4, y - h - 6, w, 8), 2)), VERM, { t: 2.8, d: 0.6, alpha: 0.8 });
  Q.wash('wash2', villas.map(([x, y, w, h]) => loosen(r, rect(x - 3, y - h + 3, w, h), 2)), r.pick([ROSE, OCHRE]), { t: 2.9, d: 0.6, alpha: 0.7 });
  Q.pen('ink', [...loops, ...vw], { t: 3.0, d: 1.4, w: 1.6 });
}

// the great blue sea
const SEA = (() => {
  const s = [[-20, HZ], [196, HZ], [P2[0] + 14, P2[1] - 40], [P2[0] + 2, P2[1] + 2]];
  for (let i = 1; i <= 40; i++) s.push(at(1 - i / 40));
  s.push([W + 20, P0[1]], [W + 20, H + 30], [-20, H + 30]);
  return s;
})();
function sea(Q, r) {
  Q.wash('wash', [loosen(r, SEA, 12, -6, 8)], ULTRA, { t: 1.8, d: 1.6, reveal: 'fall', ease: 'inOut', alpha: 0.9 });
  // darker currents and a lighter turquoise along the beach
  const cur = []; for (let i = 0; i < 8; i++) { const y = r.range(760, 1940), x = r.range(0, 500) + (y - 760) * 0.6; cur.push(loosen(r, circ(x, y, r.range(120, 260), r.range(24, 50)), 12)); }
  Q.wash('wash', cur, ULTRA_D, { t: 2.6, d: 1.0, alpha: 0.5 });
  const sh = []; for (let i = 0; i <= 40; i++) sh.push(pt(i / 40, -10));
  for (let i = 40; i >= 0; i--) sh.push(pt(i / 40, -60));
  Q.wash('wash', [loosen(r, sh, 8, -6, 4)], TURQ, { t: 3.0, d: 1.0, reveal: 'wipe', alpha: 0.55 });
  // the waves: little pen marks, a scatter of w and m, bigger near
  const waves = [];
  for (let i = 0; i < 420; i++) {
    const y = r.range(HZ + 10, H), x = r.range(-10, W);
    if (!inside(SEA, x, y) || !inside(SEA, x + 40, y)) continue;
    const s = 0.25 + ((y - HZ) / (H - HZ)) * 1.6;
    const w = r.range(10, 20) * s, h = r.range(3, 6) * s;
    const l = [];
    const n = r.chance(0.5) ? 2 : 3;
    for (let k = 0; k <= n * 4; k++) { const u = k / (n * 4); l.push([x + u * w * n, y - Math.abs(Math.sin(u * Math.PI * n)) * h]); }
    waves.push(l);
  }
  waves.sort((a, b) => a[0][1] - b[0][1]);
  const per = Math.ceil(waves.length / 4);
  for (let k = 0; k < 4; k++) Q.pen('ink', waves.slice(k * per, (k + 1) * per), { t: 3.4 + k * 0.4, d: 1.0, w: 1.8, ease: 'linear' });
}
function inside(pts, x, y) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}

// ================================================================ the shore and the promenade
function shore(Q, r) {
  // the beach of pebbles, the promenade, the road: three washes loosely laid
  Q.wash('wash2', [loosen(r, band(BEACH[0], BEACH[1] + 4), 6, 6, -4)], SAND, { t: 3.4, d: 1.0, reveal: 'fade', alpha: 0.85 });
  Q.wash('wash2', [loosen(r, band(PROM[0] + 4, PROM[1]), 7, 10, -6)], GREY, { t: 3.6, d: 1.0, alpha: 0.6 });
  Q.wash('wash2', [loosen(r, band(ROAD[0] + 6, ROAD[1]), 6, 8, 4)], OCHRE, { t: 3.8, d: 1.0, alpha: 0.45 });
  // and, Dufy's way, broad patches of color laid across everything, sun and shade
  const big = (t, off, rx, ry) => { const [x, y] = pt(t, off); return loosen(r, circ(x, y, rx, ry, 22), 18); };
  Q.wash('wash2', [big(0.12, 200, 260, 120), big(0.45, 150, 170, 60)], YEL, { t: 4.0, d: 1.0, alpha: 0.45 });
  Q.wash('wash2', [big(0.06, 520, 300, 260), big(0.2, 420, 200, 160)], GREEN, { t: 4.1, d: 1.0, alpha: 0.5 });
  Q.wash('wash2', [big(0.3, 330, 220, 90), big(0.62, 300, 160, 60)], PINK, { t: 4.2, d: 1.0, alpha: 0.35 });
  // and their edges in pen
  const edge = (o) => { const l = []; for (let i = 0; i <= 50; i++) l.push(pt(i / 50, o)); return shaky(r, l, 1); };
  Q.pen('ink', [edge(0), edge(BEACH[1]), edge(PROM[1]), edge(ROAD[1])], { t: 3.6, d: 1.6, w: 2.4 });
  // the railing of the promenade over the beach: little posts
  const rail = [];
  for (let i = 0; i < 90; i++) { const t = i / 90, a = pt(t, BEACH[1] + 2), b = pt(t, BEACH[1] + 2, 12); rail.push([a, b]); }
  Q.pen('ink', rail, { t: 4.4, d: 1.0, w: 1.5, ease: 'linear' });
  // parasols on the beach, striped
  const paras = [];
  for (let i = 0; i < 14; i++) { const t = 0.05 + (i / 14) * 0.8 + r.range(-0.02, 0.02); paras.push([t, pt(t, BEACH[1] * 0.5, 18), sc(t)]); }
  const tops = paras.map(([, [x, y], s]) => loosen(r, [[x - 22 * s, y], [x, y - 12 * s], [x + 22 * s, y]], 2 * s, 3 * s, 0));
  Q.wash('wash3', tops.filter((_, i) => i % 2), RED, { t: 5.2, d: 0.7, alpha: 0.85 });
  Q.wash('wash3', tops.filter((_, i) => i % 2 === 0), YEL, { t: 5.3, d: 0.7, alpha: 0.85 });
  const pl = [];
  for (const [, [x, y], s] of paras) {
    pl.push(shaky(r, [[x - 22 * s, y], [x - 11 * s, y - 9 * s], [x, y - 12 * s], [x + 11 * s, y - 9 * s], [x + 22 * s, y]], 0.5));
    pl.push([[x, y - 12 * s], [x, y + 14 * s]]);
    for (const k of [-1, 1]) pl.push([[x, y - 12 * s], [x + k * 11 * s, y]]);
  }
  Q.pen('ink2', pl, { t: 5.5, d: 1.0, w: 1.8 });
}

// the blue chairs, the strollers, the lamps and the cars
function promenade(Q, r) {
  const chairs = [], chairInk = [];
  for (let i = 0; i < 46; i++) {
    const t = Math.pow(i / 46, 1.25) * 0.9, row = i % 2;
    const [x, y] = pt(t, PROM[0] + 22 + row * 16), s = sc(t) * 0.85;
    if (s < 0.12) continue;
    // a blue chair, its back to the road, facing the sea
    chairs.push(loosen(r, rect(x - 10 * s + 5 * s, y - 26 * s, 20 * s, 18 * s), 2 * s));
    chairInk.push(shaky(r, [[x - 9 * s, y], [x - 9 * s, y - 12 * s], [x + 9 * s, y - 12 * s], [x + 9 * s, y]], 0.5 * s));
    chairInk.push(shaky(r, [[x + 9 * s, y - 12 * s], [x + 12 * s, y - 30 * s], [x - 6 * s, y - 30 * s], [x - 9 * s, y - 12 * s]], 0.5 * s));
  }
  Q.wash('wash3', chairs, COBALT, { t: 6.0, d: 0.8, alpha: 0.8 });
  Q.pen('ink2', chairInk, { t: 6.2, d: 1.4, w: 1.8 });
  // the strollers: a few strokes each, with a parasol, a hat, a dog
  const ppl = [], coats = [];
  const cols = [RED, YEL, PINK, VERM, TURQ, VIOLET];
  for (let i = 0; i < 34; i++) {
    const t = Math.pow(r(), 1.3) * 0.85, [x, y] = pt(t, r.range(PROM[0] + 54, PROM[1] - 10)), s = sc(t) * 0.8;
    if (s < 0.12) continue;
    const lady = r.chance(0.55);
    coats.push([loosen(r, lady ? [[x - 8 * s, y - 4 * s], [x + 8 * s, y - 4 * s], [x + 3 * s, y - 34 * s], [x - 3 * s, y - 34 * s]] : rect(x - 5 * s, y - 34 * s, 10 * s, 22 * s), 2 * s, 4 * s, -2 * s), r.pick(cols)]);
    ppl.push(circ(x, y - 40 * s, 4.5 * s, 4.5 * s, 10).concat([[x + 4.5 * s, y - 40 * s]]));
    if (lady) {
      ppl.push(shaky(r, [[x - 3 * s, y - 34 * s], [x - 8 * s, y - 4 * s], [x + 8 * s, y - 4 * s], [x + 3 * s, y - 34 * s]], 0.4 * s));
      ppl.push([[x - 3 * s, y - 4 * s], [x - 3 * s, y]], [[x + 3 * s, y - 4 * s], [x + 3 * s, y]]);
      if (r.chance(0.5)) { const px = x + 10 * s, py = y - 58 * s; ppl.push([[x + 6 * s, y - 28 * s], [px, py]], shaky(r, [[px - 16 * s, py + 6 * s], [px, py - 4 * s], [px + 16 * s, py + 6 * s]], 0.4 * s)); }
    } else {
      ppl.push(shaky(r, [[x - 5 * s, y - 12 * s], [x - 5 * s, y - 34 * s], [x + 5 * s, y - 34 * s], [x + 5 * s, y - 12 * s]], 0.4 * s));
      ppl.push([[x - 3 * s, y - 12 * s], [x - 4 * s, y]], [[x + 3 * s, y - 12 * s], [x + 4 * s, y]]);
      ppl.push([[x - 8 * s, y - 44 * s], [x + 8 * s, y - 44 * s]], [[x - 4 * s, y - 44 * s], [x - 4 * s, y - 50 * s], [x + 4 * s, y - 50 * s], [x + 4 * s, y - 44 * s]]);
      if (r.chance(0.3)) ppl.push(shaky(r, [[x + 12 * s, y], [x + 14 * s, y - 8 * s], [x + 26 * s, y - 8 * s], [x + 28 * s, y], [x + 27 * s, y - 8 * s], [x + 30 * s, y - 14 * s]], 0.4 * s));
    }
  }
  for (const col of cols) Q.wash('wash3', coats.filter((c) => c[1] === col).map((c) => c[0]), col, { t: 6.8, d: 0.7, alpha: 0.85 });
  Q.pen('ink2', ppl.slice(0, Math.floor(ppl.length / 2)), { t: 7.0, d: 1.2, w: 1.7 });
  Q.pen('ink2', ppl.slice(Math.floor(ppl.length / 2)), { t: 7.4, d: 1.2, w: 1.7 });
  // lamps along the promenade, on the road side
  const lamps = [];
  for (let i = 0; i < 14; i++) {
    const t = (i / 14) * 0.9 + 0.02, [x, y] = pt(t, PROM[1] - 8), s = sc(t);
    lamps.push([[x, y], [x, y - 110 * s]], shaky(r, [[x - 10 * s, y - 100 * s], [x, y - 112 * s], [x + 10 * s, y - 100 * s]], 0.4), circ(x - 10 * s, y - 96 * s, 4 * s), circ(x + 10 * s, y - 96 * s, 4 * s));
  }
  Q.pen('ink2', lamps, { t: 7.8, d: 1.0, w: 1.9 });
  // the cars on the road: open tourers in red, yellow and black
  const cars = [], carW = [[], [], []];
  for (let i = 0; i < 9; i++) {
    const t = 0.04 + (i / 9) * 0.78 + r.range(-0.02, 0.02), [x, y] = pt(t, (ROAD[0] + ROAD[1]) / 2 + (i % 2 ? 18 : -14)), s = sc(t) * 0.75;
    carW[i % 3].push(loosen(r, rect(x - 30 * s + 6 * s, y - 22 * s, 58 * s, 16 * s), 2 * s));
    cars.push(shaky(r, [[x - 32 * s, y - 6 * s], [x - 30 * s, y - 18 * s], [x - 10 * s, y - 20 * s], [x - 4 * s, y - 32 * s], [x + 14 * s, y - 32 * s], [x + 18 * s, y - 20 * s], [x + 32 * s, y - 16 * s], [x + 32 * s, y - 6 * s]], 0.5 * s));
    cars.push(circ(x - 18 * s, y - 4 * s, 7 * s), circ(x + 20 * s, y - 4 * s, 7 * s));
  }
  Q.wash('wash3', carW[0], RED, { t: 8.0, d: 0.7 });
  Q.wash('wash3', carW[1], YEL, { t: 8.1, d: 0.7 });
  Q.wash('wash3', carW[2], ULTRA, { t: 8.2, d: 0.7 });
  Q.pen('ink2', cars, { t: 8.2, d: 1.2, w: 2 });
}

// ================================================================ the hotels
function hotels(Q, r) {
  const list = [];
  let t = 0.13;
  const pal = [ROSE, YEL, LILAC, OCHRE, null, PINK, SKY, null];
  let k = 0;
  while (t < 0.9) {
    const s = sc(t), w = r.range(150, 230), ht = r.range(190, 280);
    const neg = t >= 0.27 && !list.some((h) => h.neg);
    list.push({ t, w: neg ? 260 : w, h: neg ? 250 : ht, col: neg ? '#fff1e4' : pal[k++ % pal.length], neg });
    t += (neg ? 260 : w) / (900 * s + 200) * 0.38 + 0.012;
  }
  // nearest last, so they overlap the far ones
  list.reverse();
  list.forEach((h, i) => {
    const s = sc(h.t), [bx, by] = pt(h.t, FRONT);
    const [nx, ny] = nrm(h.t);
    // the front faces the sea: lay it out along the shore, a little skewed
    const [tx, ty] = (() => { const [a0, a1] = [at(h.t), at(Math.min(1, h.t + 0.02))]; const l = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]); return [(a1[0] - a0[0]) / l, (a1[1] - a0[1]) / l]; })();
    const w = h.w * s, ht = h.h * s;
    const A = [bx, by], Bq = [bx + tx * w, by + ty * w], C = [Bq[0], Bq[1] - ht], D = [A[0], A[1] - ht];
    const face = [A, Bq, C, D];
    const when = 4.6 + (list.length - 1 - i) * 0.16;
    // the side toward us and the flat roof, seen from above
    const dep = 60 * s;
    const A2 = [A[0] + nx * dep, A[1] + ny * dep], D2 = [A2[0], A2[1] - ht], C2 = [C[0] + nx * dep, C[1] + ny * dep];
    const side = [A, A2, D2, D], roof = [D, C, C2, D2];
    if (h.col) Q.wash('wash2', [loosen(r, face, 5 * s + 2, 8 * s, -6 * s)], h.col, { t: when, d: 0.7, alpha: 0.7 });
    Q.wash('wash2', [loosen(r, side, 4 * s + 2, 6 * s, -4 * s)], h.col || LILAC, { t: when + 0.05, d: 0.7, alpha: h.col ? 0.95 : 0.45 });
    Q.wash('wash2', [loosen(r, roof, 3 * s + 1, 4 * s, -3 * s)], GREY, { t: when + 0.1, d: 0.7, alpha: 0.7 });
    // the pen: outline, roof line, rows of windows and balconies
    const lines = [shaky(r, [A, Bq, C, D, A], 0.8), shaky(r, [A, A2, D2, D], 0.8), shaky(r, [D2, C2, C], 0.8)];
    // the side's windows, a few dashes
    for (let q = 1; q < 3; q++) for (let rr = 1; rr < Math.max(2, Math.round(h.h / 50)); rr++) { const u = q / 3, v = rr / Math.max(2, Math.round(h.h / 50)); const x = A[0] + (A2[0] - A[0]) * u, y = A[1] + (A2[1] - A[1]) * u - ht * v; lines.push([[x, y], [x, y - 10 * s]]); }
    const rows = Math.max(2, Math.round(h.h / 32)), cols = Math.max(3, Math.round(h.w / 24));
    for (let rr = 0; rr < rows; rr++) {
      const v = (rr + 0.6) / (rows + 0.3);
      const row = [];
      for (let cc = 0; cc < cols; cc++) {
        const u = (cc + 0.3) / cols, u2 = (cc + 0.7) / cols;
        const p0 = [A[0] + (Bq[0] - A[0]) * u, A[1] + (Bq[1] - A[1]) * u - ht * v], p1 = [A[0] + (Bq[0] - A[0]) * u2, A[1] + (Bq[1] - A[1]) * u2 - ht * v];
        // a window: a short upright dash
        lines.push([[p0[0] + (p1[0] - p0[0]) / 2, p0[1] + (p1[1] - p0[1]) / 2], [p0[0] + (p1[0] - p0[0]) / 2, p0[1] + (p1[1] - p0[1]) / 2 - 12 * s]]);
        row.push(p0, p1);
      }
      // a balcony line under every other row
      if (rr % 2 === 0 && row.length) lines.push(shaky(r, [row[0], row[row.length - 1]], 0.5));
    }
    if (h.neg) {
      // the Negresco: a mansard and, at its corner, the great pink dome
      const cx = Bq[0] - tx * w * 0.08, cy = C[1] + ty * 0 + (D[1] - C[1]) * 0.08;
      const dr = 46 * s;
      const dome = [];
      for (let q = 0; q <= 20; q++) { const a = Math.PI + (q / 20) * Math.PI; dome.push([cx + Math.cos(a) * dr, cy - 14 * s + Math.sin(a) * dr * 1.15]); }
      Q.wash('wash3', [loosen(r, [...dome, [cx + dr, cy], [cx - dr, cy]], 4 * s, 7 * s, -4 * s)], PINK, { t: when + 0.5, d: 0.8, alpha: 0.9 });
      Q.wash('wash3', [loosen(r, rect(cx - dr, cy - 14 * s, dr * 2, 14 * s), 2 * s, 4 * s, 2 * s)], ROSE, { t: when + 0.5, d: 0.8, alpha: 0.8 });
      lines.push(shaky(r, dome, 0.6), [[cx - dr, cy - 14 * s], [cx - dr, cy], [cx + dr, cy], [cx + dr, cy - 14 * s]]);
      for (const f of [-0.5, 0, 0.5]) lines.push([[cx + f * dr, cy - 14 * s], [cx + f * dr * 0.4, cy - 14 * s - dr * 1.0]]);
      // the lantern and its flagpole
      lines.push(rect(cx - 6 * s, cy - 14 * s - dr * 1.15 - 12 * s, 12 * s, 12 * s).concat([[cx - 6 * s, cy - 14 * s - dr * 1.15 - 12 * s]]));
      lines.push([[cx, cy - 14 * s - dr * 1.15 - 12 * s], [cx, cy - 14 * s - dr * 1.15 - 46 * s]]);
      // the mansard along the roof, its dormers
      const M = [C[0] - tx * w * 0.22, C[1] - ty * w * 0.22], m0 = [D[0], D[1] - 18 * s], m1 = [M[0], M[1] - 18 * s];
      lines.push(shaky(r, [D, m0, m1, M], 0.6));
      for (let q = 1; q < 6; q++) { const u = q / 6; const x = m0[0] + (m1[0] - m0[0]) * u, y = m0[1] + (m1[1] - m0[1]) * u + 18 * s; lines.push([[x - 4 * s, y], [x, y - 10 * s], [x + 4 * s, y]]); }
      h.flag = [cx, cy - 14 * s - dr * 1.15 - 46 * s, s];
    } else {
      // a cornice and a strip of red roof
      const R0 = [D[0], D[1] - 10 * s], R1 = [C[0], C[1] - 10 * s];
      lines.push(shaky(r, [D, R0, R1, C], 0.5));
      if (i % 2) Q.wash('wash3', [loosen(r, [D, R0, R1, C], 2 * s, 4 * s, -3 * s)], VERM, { t: when + 0.3, d: 0.6, alpha: 0.75 });
    }
    Q.pen('ink', lines, { t: when + 0.1, d: 0.9, w: Math.max(1.3, 2.4 * Math.min(1, s)) });
  });
  // the town behind: roofs in a loose wash and quick pen marks
  const town = band(FRONT + 220, FRONT + 520, 0.25, 0.97, 30);
  Q.wash('wash2', [loosen(r, town, 14, 10, -10)], ROSE, { t: 4.4, d: 1.0, alpha: 0.45 });
  const tiles = [[], [], []];
  for (let i = 0; i < 70; i++) { const t = r.range(0.2, 0.97), [x, y] = pt(t, r.range(FRONT + 180, FRONT + 540)), s = sc(t); tiles[i % 3].push(loosen(r, rect(x, y - 14 * s, r.range(30, 60) * s, r.range(12, 22) * s), 3 * s)); }
  Q.wash('wash2', tiles[0], VERM, { t: 4.5, d: 0.8, alpha: 0.6 });
  Q.wash('wash2', tiles[1], OCHRE, { t: 4.6, d: 0.8, alpha: 0.6 });
  Q.wash('wash2', tiles[2], PAPER, { t: 4.7, d: 0.8, alpha: 0.85 });
  const roofs = [];
  for (let i = 0; i < 90; i++) {
    const t = r.range(0.2, 0.97), [x, y] = pt(t, r.range(FRONT + 180, FRONT + 540)), s = sc(t);
    const w = r.range(30, 60) * s;
    roofs.push(shaky(r, [[x, y], [x + w * 0.5, y - w * 0.3], [x + w, y]], 0.5));
  }
  Q.pen('ink', roofs, { t: 4.4, d: 1.4, w: 1.5 });
  HOTELS.length = 0; HOTELS.push(...list);
}
const HOTELS = [];

// ================================================================ the palms
function palm(r, x, y, s, lines, crowns, lean) {
  const h = 300 * s, top = [x + lean * h, y - h];
  // the trunk: two lines, a little curved, with rings across
  const tr = (off) => { const l = []; for (let k = 0; k <= 10; k++) { const u = k / 10; l.push([x + off * s * (1 - u * 0.4) + lean * h * u * u, y - h * u]); } return l; };
  lines.push(shaky(r, tr(-6), 0.6 * s), shaky(r, tr(6), 0.6 * s));
  for (let k = 1; k < 14; k++) { const u = k / 14, cx = x + lean * h * u * u, cy = y - h * u; lines.push([[cx - 5 * s, cy], [cx + 5 * s, cy - 3 * s]]); }
  // the fronds: long arcs falling away from the top, with little strokes for leaflets
  const n = 7;
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (k / (n - 1) - 0.5) * Math.PI * 1.5 + r.range(-0.12, 0.12), L = r.range(110, 150) * s;
    const f = [];
    for (let q = 0; q <= 10; q++) { const u = q / 10; f.push([top[0] + Math.cos(a) * L * u, top[1] + Math.sin(a) * L * u + u * u * L * 0.55]); }
    lines.push(shaky(r, f, 0.6 * s));
    for (let q = 3; q < 10; q += 3) {
      const [px, py] = f[q], ll = (1 - q / 12) * 22 * s;
      lines.push([[px, py], [px + Math.cos(a + 0.9) * ll, py + Math.sin(a + 0.9) * ll + ll * 0.6]], [[px, py], [px + Math.cos(a - 0.9) * ll, py + Math.sin(a - 0.9) * ll + ll * 0.6]]);
    }
  }
  crowns.push(loosen(r, circ(top[0] + 18 * s, top[1] + 30 * s, 120 * s, 60 * s, 16), 16 * s));
}
function palms(Q, r) {
  // along the promenade from far to near; the nearest are huge
  const ts = [0.86, 0.77, 0.69, 0.61, 0.535, 0.465, 0.4, 0.34, 0.28, 0.225, 0.17, 0.12];
  ts.forEach((t, i) => {
    const [x, y] = pt(t, PROM[1] - 30), s = Math.min(0.85, sc(t) * 0.95);
    const lines = [], crowns = [];
    palm(r, x, y, s, lines, crowns, r.range(-0.08, 0.1));
    const when = 8.4 + i * 0.22;
    Q.wash('wash3', crowns, i % 2 ? GREEN : GREEN_D, { t: when, d: 0.7, alpha: 0.65 });
    Q.pen('ink2', lines, { t: when + 0.1, d: 0.9, w: Math.max(1.2, 1.8 * Math.min(1.2, s)) });
  });

}

// ================================================================ the name
function title(Q) {
  // written out with the pen, in one long stroke of the wrist
  Q.add('title', {
    t: 11.4, d: 1.8, reveal: 'wipe', ease: 'inOut', box: { x: 60, y: 60, w: 900, h: 470 },
    draw: (c) => {
      c.font = '400 400px "Sacramento"'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      c.fillStyle = 'rgba(240,138,164,.75)'; c.fillText('Nice', 118, 400);
      c.fillStyle = INKC; c.fillText('Nice', 104, 388);
    },
  });
  Q.add('title', {
    t: 12.8, d: 1.2, reveal: 'wipe', ease: 'inOut', box: { x: 100, y: 410, w: 900, h: 110 },
    draw: (c) => {
      c.font = '400 76px "Sacramento"'; c.textAlign = 'left'; c.fillStyle = ULTRA;
      c.fillText('Promenade des Anglais', 170, 484);
    },
  });
}

// ================================================================ what moves
function life(p, r) {
  // sailboats crossing the bay, far ones slow and small
  const boats = [];
  for (let i = 0; i < 11; i++) {
    const y = r.range(HZ + 30, 1750), s = 0.25 + ((y - HZ) / (H - HZ)) * 1.5;
    boats.push({ x: r.range(0, 900), y, s, sp: r.range(4, 10) * s * (r.chance(0.7) ? 1 : -1), sail: r.pick([PAPER, PAPER, ROSE, YEL]), ph: r() * 6 });
  }
  boats.sort((a, b) => a.y - b.y);
  const limit = (b, x) => { // keep to the water
    let lo = -60, hi = 1400; for (let k = 0; k < 6; k++) { const m = (lo + hi) / 2; if (inside(SEA, m, b.y)) lo = m; else hi = m; } return Math.min(x, lo - 40 * b.s);
  };
  p.live('live', {
    t: 9.6, d: 1.2, reveal: 'fade', box: { x: 0, y: HZ - 100, w: W, h: H - HZ + 100 },
    draw: (c, time) => {
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const b of boats) {
        let x = b.x + time * b.sp; x = ((x % 1100) + 1100) % 1100 - 60; x = limit(b, x);
        const y = b.y + Math.sin(time * 1.3 + b.ph) * 1.5 * b.s, s = b.s, dir = b.sp > 0 ? 1 : -1;
        // a white sail, the hull a quick stroke, the reflection a dash
        c.fillStyle = b.sail; c.beginPath(); c.moveTo(x, y - 6 * s); c.lineTo(x, y - 60 * s); c.lineTo(x + dir * 28 * s, y - 8 * s); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(x - 2 * dir * s, y - 52 * s); c.lineTo(x - 2 * dir * s, y - 8 * s); c.lineTo(x - dir * 16 * s, y - 8 * s); c.closePath(); c.fill();
        c.strokeStyle = INKC; c.lineWidth = Math.max(1, 1.6 * s);
        c.beginPath(); c.moveTo(x, y - 62 * s); c.lineTo(x, y - 4 * s); c.moveTo(x, y - 60 * s); c.lineTo(x + dir * 28 * s, y - 8 * s);
        c.moveTo(x - dir * 22 * s, y - 6 * s); c.quadraticCurveTo(x, y + 2 * s, x + dir * 30 * s, y - 6 * s); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(x - 10 * s, y + 6 * s); c.lineTo(x + 14 * s, y + 6 * s); c.stroke();
      }
    },
  });
  // tricolor flags on the near lamps and over the Negresco, flapping
  const flags = [];
  for (const t of [0.07, 0.16, 0.26]) { const [x, y] = pt(t, PROM[1] - 8), s = sc(t); flags.push([x, y - 130 * s, s, x, y - 70 * s]); }
  const neg = HOTELS.find((h) => h.neg);
  if (neg && neg.flag) flags.push([neg.flag[0], neg.flag[1], neg.flag[2], null]);
  p.live('live', {
    t: 10.2, d: 1.0, reveal: 'fade', box: { x: 0, y: 0, w: W, h: H },
    draw: (c, time) => {
      for (const [x, y, s, px, py] of flags) {
        if (px !== null) { c.strokeStyle = INKC; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(px, py); c.stroke(); }
        const fw = 40 * s, fh = 26 * s;
        for (let k = 0; k < 3; k++) {
          c.fillStyle = [ULTRA, PAPER, RED][k];
          c.beginPath();
          for (let q = 0; q <= 4; q++) { const u = (k + q / 4) / 3; c.lineTo(x + u * fw, y + Math.sin(time * 4 - u * 4) * 4 * s * u); }
          for (let q = 4; q >= 0; q--) { const u = (k + q / 4) / 3; c.lineTo(x + u * fw, y + fh + Math.sin(time * 4 - u * 4) * 4 * s * u); }
          c.closePath(); c.fill();
        }
        c.strokeStyle = INKC; c.lineWidth = 1.2 * s; c.beginPath();
        for (let q = 0; q <= 8; q++) { const u = q / 8; c.lineTo(x + u * fw, y + Math.sin(time * 4 - u * 4) * 4 * s * u); }
        c.stroke();
      }
    },
  });
  // gulls drawn as two quick strokes
  const gulls = []; for (let i = 0; i < 7; i++) gulls.push({ cx: r.range(300, 1400), cy: r.range(560, 900), R: r.range(50, 140), w: r.range(0.25, 0.5) * (r.chance(0.5) ? 1 : -1), ph: r() * 7, s: r.range(0.7, 1.3) });
  p.live('live', {
    t: 10.6, d: 1.0, reveal: 'fade', box: { x: 0, y: 380, w: W, h: 700 },
    draw: (c, time) => {
      c.strokeStyle = INKC; c.lineCap = 'round';
      for (const g of gulls) {
        const a = time * g.w + g.ph, x = g.cx + Math.cos(a) * g.R, y = g.cy + Math.sin(a) * g.R * 0.35, f = Math.sin(time * 5 + g.ph) * 5 * g.s, w = 14 * g.s;
        c.lineWidth = 2 * g.s; c.beginPath(); c.moveTo(x - w, y - f); c.quadraticCurveTo(x - w * 0.4, y - 7 * g.s, x, y); c.quadraticCurveTo(x + w * 0.4, y - 7 * g.s, x + w, y - f); c.stroke();
      }
    },
  });
}

