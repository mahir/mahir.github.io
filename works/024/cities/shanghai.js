// Shanghai: a 1930s calendar poster, airbrushed, at night. We look down the
// Huangpu from high over the Bund: its stone fronts floodlit gold and running
// away along the left bank (the Customs House and its clock tower, the HSBC dome,
// the green pyramid of the Peace Hotel, the Bank of China, the Garden Bridge and
// Broadway Mansions at the far end), and across the water the new towers of
// Pudong (the Oriental Pearl Tower, Jin Mao, the World Financial Center and the
// Shanghai Tower). Junks with ribbed sails in the foreground, a full moon in soft
// cloud; all of it inside a gilded art deco frame, the name 上海 at the head.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, mix } from '../kit.js';

const LAC = '#14100f', LAC2 = '#221a17';
const GOLD = '#d4ac58', GOLD_D = '#9a7432', GOLD_L = '#f1d796';
const SKY0 = '#0b2430', SKY1 = '#1b4650', SKY2 = '#4d7468', GLOW = '#e3a75e';
const RIVER0 = '#123038', RIVER1 = '#0a1b22';
const STONE = '#c9b48d', STONE_D = '#7f6e55', STONE_N = '#3b3a3e';
const LIT = '#ffd98a', LIT2 = '#ffb85a', DARKW = '#2a2a33';
const JADE = '#3f8f7c', ROSE = '#e0607a', RUST = '#a8462e', INK = '#0d1114';

export const city = {
  id: 'shanghai', name: 'Shanghai',
  alt: 'A 1930s calendar poster of Shanghai at night in a gilded art deco frame: the floodlit Bund running down the Huangpu with the Customs House clock tower, the HSBC dome, the Peace Hotel’s green pyramid roof, the Bank of China, the Garden Bridge and Broadway Mansions, and across the river the Oriental Pearl Tower, Jin Mao, the World Financial Center and the Shanghai Tower, with junks under ribbed sails and a full moon in soft cloud, under the name 上海',
  google: 'family=ZCOOL+XiaoWei&family=Limelight',
  wall: '#101a1c',
  fonts: [['400 100px "ZCOOL XiaoWei"', '上海外灘黃浦江夜景浦東'], ['400 40px "Limelight"', 'SHANGHAI THE BUND BY NIGHT · HUANGPU']],
  build,
};

// the picture inside the frame
const X0 = 120, X1 = W - 120, Y0 = 430, Y1 = 1720;
// the Bund in perspective: a point on the plane of its fronts at depth d and height z
const VX = 860, VY = 1050, K = 8;
const sOf = (d) => 1 / (1 + K * d);
const FX = -700, GY = 2050, RY = 2140; // the fronts' plane, the street, the water, on the near plane
const P = (X, z, d, y = GY) => { const s = sOf(d); return [VX + (X - VX) * s, VY + (y - z - VY) * s]; };

function build() {
  const p = new Plate({ paper: LAC, seed: 1934 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('frame', 'sky', 'pudong', 'bund', 'windows', 'river', 'reflect', 'boats', 'live', 'gilt', 'title');
  for (const n of ['frame', 'gilt', 'title']) p.layer(n, { clip: false });

  frame(p, r);
  sky(p, r);
  pudong(p, r);
  bund(p, r);
  river(p, r);
  boats(p, r);
  lives(p, r);
  gilt(p, r);
  title(p, r);
  return p;
}

function path(c, pts, close = true) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}
// a soft round glow, as an airbrush leaves it
function glow(c, x, y, rad, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0));
  c.fillStyle = g; c.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
}

// ================================================================ the lacquer frame (laid first; gilt later)
function frame(p, r) {
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = LAC; c.fillRect(0, 0, W, H);
    // a faint lacquer sheen across the border
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(80,50,40,0.25)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(80,50,40,0.25)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = LAC2; c.fillRect(X0 - 40, Y0 - 40, X1 - X0 + 80, Y1 - Y0 + 80);
  }, { t: 0, d: 0.5, reveal: 'fade' });
}

// ================================================================ the night sky: teal deepening upward, a warm glow over the city, the moon in cloud
const MX = 700, MY = 600;
function sky(p, r) {
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: VY - Y0 + 20 }, (c) => {
    const g = c.createLinearGradient(0, Y0, 0, VY + 10);
    g.addColorStop(0, SKY0); g.addColorStop(0.55, SKY1); g.addColorStop(0.85, SKY2); g.addColorStop(1, GLOW);
    c.fillStyle = g; c.fillRect(X0, Y0, X1 - X0, VY - Y0 + 20);
  }, { t: 0.4, d: 1.2, reveal: 'fall', ease: 'inOut' });
  // stars, few and small
  const stars = [];
  for (let i = 0; i < 90; i++) stars.push([r.range(X0, X1), r.range(Y0, 820), r.range(0.8, 2.2)]);
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: 420 }, (c) => {
    c.fillStyle = 'rgba(255,240,210,0.7)'; c.beginPath(); for (const [x, y, s] of stars) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
  }, { t: 1.0, d: 1.0, reveal: 'fade' });
  // the moon: a halo, the disc, its soft seas
  p.group('sky', { x: MX - 260, y: MY - 260, w: 520, h: 520 }, (c) => {
    glow(c, MX, MY, 260, 'rgba(255,236,190,A)', 0.35);
    c.fillStyle = '#fbf0d2'; c.beginPath(); c.arc(MX, MY, 74, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(200,184,150,0.3)';
    for (const [dx, dy, a, b, t] of [[-24, -18, 22, 12, 0.5], [10, 14, 30, 14, -0.3], [-14, 34, 12, 7, 0.2], [30, -24, 9, 6, 0], [-36, 10, 8, 10, 0]]) { c.beginPath(); c.ellipse(MX + dx, MY + dy, a, b, t, 0, Math.PI * 2); c.fill(); }
  }, { t: 1.2, d: 1.2, reveal: 'iris' });
  // long airbrushed clouds, lit on their upper edges by the moon
  const clouds = [[480, 690, 420, 26], [980, 640, 360, 20], [620, 760, 300, 16], [1220, 760, 260, 18], [300, 560, 220, 14], [880, 540, 200, 12]];
  p.group('sky', { x: X0, y: 480, w: X1 - X0, h: 340 }, (c) => {
    for (const [x, y, w, h] of clouds) {
      const g = c.createLinearGradient(0, y - h, 0, y + h);
      g.addColorStop(0, 'rgba(240,225,190,0.55)'); g.addColorStop(0.45, 'rgba(120,150,150,0.5)'); g.addColorStop(1, 'rgba(40,70,80,0)');
      c.fillStyle = g;
      c.beginPath(); c.ellipse(x, y, w, h, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(x - w * 0.25, y - h * 0.6, w * 0.45, h * 0.8, 0, 0, Math.PI * 2); c.fill();
    }
  }, { t: 1.8, d: 1.4, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ Pudong: the new towers across the river
function windowsGrid(c, x, y, w, h, sx, sy, r0) {
  // r0: a list of on/off made at build time, read in order
  let k = 0;
  for (let yy = y + 4; yy < y + h - 3; yy += sy) for (let xx = x + 3; xx < x + w - 3; xx += sx) {
    if (r0[k++ % r0.length]) c.fillRect(xx, yy, sx * 0.5, sy * 0.45);
  }
}
function pudong(p, r) {
  const base = VY + 24;
  const bits = []; for (let i = 0; i < 997; i++) bits.push(r.chance(0.55));
  // a skyline of lesser towers behind and between the great ones
  const lesser = [];
  for (let x = 900; x < X1; x += r.range(30, 60)) lesser.push([x, base - r.range(80, 300), r.range(26, 54)]);
  p.group('pudong', { x: 880, y: base - 320, w: X1 - 880, h: 340 }, (c) => {
    for (const [x, y, w] of lesser) {
      c.fillStyle = '#1f3a3e'; c.fillRect(x, y, w, base - y);
      c.fillStyle = 'rgba(255,215,140,0.55)'; windowsGrid(c, x, y, w, base - y, 7, 9, bits.slice((x | 0) % 400));
    }
  }, { t: 2.2, d: 1.2, reveal: 'rise' });
  // the Oriental Pearl Tower: three legs, a column, three rose spheres
  const ox = 1000, top = 560;
  p.group('pudong', { x: ox - 110, y: top - 80, w: 220, h: base - top + 90 }, (c) => {
    c.strokeStyle = '#d9c7b0'; c.lineCap = 'butt';
    c.lineWidth = 9; c.beginPath(); c.moveTo(ox - 70, base); c.lineTo(ox - 8, base - 210); c.moveTo(ox + 70, base); c.lineTo(ox + 8, base - 210); c.stroke();
    c.lineWidth = 12; c.beginPath(); c.moveTo(ox - 10, base); c.lineTo(ox - 10, top + 70); c.moveTo(ox + 10, base); c.lineTo(ox + 10, top + 70); c.stroke();
    c.lineWidth = 5; c.beginPath(); c.moveTo(ox, base - 40); c.lineTo(ox, top + 90); c.stroke();
    const sphere = (y, rad) => {
      const g = c.createRadialGradient(ox - rad * 0.35, y - rad * 0.35, rad * 0.1, ox, y, rad);
      g.addColorStop(0, '#ffc0c8'); g.addColorStop(0.6, ROSE); g.addColorStop(1, '#7a2440');
      c.fillStyle = g; c.beginPath(); c.arc(ox, y, rad, 0, Math.PI * 2); c.fill();
    };
    sphere(base - 210, 44);
    for (const y of [base - 300, base - 330, base - 360]) { c.fillStyle = '#f2c0c8'; c.beginPath(); c.arc(ox, y, 9, 0, Math.PI * 2); c.fill(); }
    sphere(top + 70, 30);
    c.fillStyle = '#d9c7b0'; c.fillRect(ox - 6, top + 10, 12, 40);
    sphere(top + 4, 12);
    c.strokeStyle = '#e8dccb'; c.lineWidth = 3; c.beginPath(); c.moveTo(ox, top - 8); c.lineTo(ox, top - 70); c.stroke();
    // lit bands round the spheres
    c.strokeStyle = LIT; c.lineWidth = 2; c.beginPath(); c.ellipse(ox, base - 210, 44, 8, 0, 0, Math.PI * 2); c.ellipse(ox, top + 70, 30, 6, 0, 0, Math.PI * 2); c.stroke();
  }, { t: 2.8, d: 1.3, reveal: 'rise' });
  // Jin Mao: a tapering pagoda of setbacks, a spire
  const jx = 1215, jtop = 600;
  p.group('pudong', { x: jx - 50, y: jtop - 70, w: 100, h: base - jtop + 80 }, (c) => {
    const steps = 9;
    for (let k = 0; k < steps; k++) {
      const y0 = lerp(base, jtop + 50, k / steps), y1 = lerp(base, jtop + 50, (k + 1) / steps), w = lerp(34, 14, k / steps);
      c.fillStyle = '#5c6e66'; c.fillRect(jx - w, y1, 2 * w, y0 - y1);
      c.fillStyle = '#86978c'; c.fillRect(jx - w, y1, w * 0.6, y0 - y1);
      c.fillStyle = LIT; c.fillRect(jx - w - 2, y1, 2 * w + 4, 2.5);
    }
    c.fillStyle = '#86978c'; poly(c, [[jx - 12, jtop + 52], [jx + 12, jtop + 52], [jx + 6, jtop + 14], [jx - 6, jtop + 14]]); c.fill();
    c.strokeStyle = '#c9d2c6'; c.lineWidth = 3; c.beginPath(); c.moveTo(jx, jtop + 14); c.lineTo(jx, jtop - 60); c.stroke();
  }, { t: 3.2, d: 1.2, reveal: 'rise' });
  // the World Financial Center: a tapering slab with the open trapezoid at its head
  const wx = 1300, wtop = 520;
  p.group('pudong', { x: wx - 50, y: wtop - 10, w: 100, h: base - wtop + 20 }, (c) => {
    c.fillStyle = '#41585a'; poly(c, [[wx - 38, base], [wx + 38, base], [wx + 14, wtop], [wx - 14, wtop]]); c.fill();
    c.fillStyle = '#6a8584'; poly(c, [[wx - 38, base], [wx - 4, base], [wx - 2, wtop], [wx - 14, wtop]]); c.fill();
    c.fillStyle = SKY1; poly(c, [[wx - 11, wtop + 18], [wx + 11, wtop + 18], [wx + 8, wtop + 40], [wx - 8, wtop + 40]]); c.fill();
    c.strokeStyle = 'rgba(255,215,140,0.5)'; c.lineWidth = 1.2; c.beginPath();
    for (let y = wtop + 50; y < base; y += 8) { const k = (y - wtop) / (base - wtop); c.moveTo(wx - lerp(14, 38, k) + 3, y); c.lineTo(wx + lerp(14, 38, k) - 3, y); }
    c.stroke();
  }, { t: 3.5, d: 1.2, reveal: 'rise' });
  // the Shanghai Tower: a twisting taper, the tallest, its spiral lit
  const sx = 1395, stop = 470;
  p.group('pudong', { x: sx - 60, y: stop - 10, w: 120, h: base - stop + 20 }, (c) => {
    const L = (k) => sx - lerp(46, 14, k) + Math.sin(k * 3) * 4, R = (k) => sx + lerp(46, 16, k) - Math.sin(k * 3) * 2;
    c.fillStyle = '#4d6466'; c.beginPath();
    for (let k = 0; k <= 1; k += 0.05) c.lineTo(L(k), lerp(base, stop, k));
    for (let k = 1; k >= 0; k -= 0.05) c.lineTo(R(k), lerp(base, stop, k));
    c.fill();
    c.fillStyle = '#7d9896'; c.beginPath();
    for (let k = 0; k <= 1; k += 0.05) c.lineTo(L(k), lerp(base, stop, k));
    for (let k = 1; k >= 0; k -= 0.05) c.lineTo(lerp(L(k), R(k), 0.35 + 0.25 * k), lerp(base, stop, k));
    c.fill();
    c.strokeStyle = 'rgba(255,220,150,0.7)'; c.lineWidth = 2.2; c.beginPath();
    for (let k = 0; k <= 1; k += 0.01) { const x = lerp(L(k), R(k), 0.5 + 0.5 * Math.sin(k * 26)), y = lerp(base, stop, k); k ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    c.fillStyle = '#4d6466'; poly(c, [[sx - 14, stop], [sx + 16, stop], [sx + 12, stop - 6], [sx - 6, stop - 8]]); c.fill();
  }, { t: 3.8, d: 1.3, reveal: 'rise' });
  // the low bank of Pudong: warehouses, the promenade lights
  p.group('pudong', { x: 860, y: base - 30, w: X1 - 860, h: 60 }, (c) => {
    c.fillStyle = '#16282b'; poly(c, [[850, base + 6], [850, base - 8], [X1, base - 22], [X1, base + 18]]); c.fill();
    c.fillStyle = LIT;
    for (let x = 870; x < X1; x += 12) { const y = lerp(base - 4, base + 6, (x - 850) / (X1 - 850)); c.fillRect(x, y, 3, 2); }
  }, { t: 4.2, d: 0.8, reveal: 'wipe' });
}

// ================================================================ the Bund: stone fronts in perspective, floodlit
// a quad on the plane of the fronts, from depth d0 to d1 and height z0 to z1
const fq = (d0, d1, z0, z1, X = FX) => [P(X, z0, d0), P(X, z0, d1), P(X, z1, d1), P(X, z1, d0)];
const BLD = [
  { d0: 0.0, d1: 0.05, z: 1900, kind: 'cols' },
  { d0: 0.05, d1: 0.1, z: 1700, kind: 'deco' },
  { d0: 0.1, d1: 0.16, z: 1600, kind: 'cols' },
  { d0: 0.16, d1: 0.23, z: 1800, kind: 'deco' },
  { d0: 0.23, d1: 0.3, z: 1650, kind: 'hsbc' },
  { d0: 0.3, d1: 0.37, z: 1750, kind: 'customs' },
  { d0: 0.37, d1: 0.43, z: 1500, kind: 'cols' },
  { d0: 0.43, d1: 0.5, z: 2050, kind: 'peace' },
  { d0: 0.5, d1: 0.57, z: 2150, kind: 'boc' },
  { d0: 0.57, d1: 0.65, z: 1300, kind: 'cols' },
  { d0: 0.65, d1: 0.71, z: 1150, kind: 'low' },
  { d0: 0.77, d1: 0.9, z: 2700, kind: 'broadway' },
  { d0: 0.9, d1: 1.2, z: 1100, kind: 'low' },
];
function bund(p, r) {
  // the street and the embankment wall, running away down the river
  const street = [P(FX, 0, 0), P(FX, 0, 1.4), P(-150, 0, 1.4), P(-150, 0, 0)];
  const wallq = [P(-150, 0, 0), P(-150, 0, 1.4), P(-150, 0, 1.4, RY), P(-150, 0, 0, RY)];
  p.group('bund', boxOf([...street, ...wallq], 6), (c) => {
    c.fillStyle = '#3a3330'; path(c, street); c.fill();
    c.fillStyle = '#5b4d40'; path(c, wallq); c.fill();
    c.fillStyle = 'rgba(255,200,120,0.25)'; path(c, [P(FX, 0, 0), P(FX, 0, 1.4), P(-450, 0, 1.4), P(-450, 0, 0)]); c.fill();
  }, { t: 2.4, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // the buildings, far to near
  const order = [...BLD].reverse();
  order.forEach((b, i) => {
    const t = 3.0 + i * 0.36;
    const face = fq(b.d0, b.d1, 0, b.z);
    const extra = [];
    const dm = (b.d0 + b.d1) / 2, s = sOf(dm);
    // the features on the roof, as points for the box
    if (b.kind === 'customs') extra.push(P(FX, b.z + 1300, dm));
    if (b.kind === 'peace') extra.push(P(FX, b.z + 900, b.d0 + 0.02));
    if (b.kind === 'boc') extra.push(P(FX, b.z + 500, dm));
    if (b.kind === 'hsbc') extra.push(P(FX, b.z + 700, dm));
    const bx = boxOf([...face, ...extra], 40 * s + 10);
    p.group('bund', bx, (c) => drawBuilding(c, b), { t, d: 1.2, reveal: 'rise' });
    // its windows light up a moment later
    const lit = [];
    const cols = Math.max(4, Math.round((b.d1 - b.d0) / 0.006)), floors = Math.round(b.z / 170);
    for (let f = 1; f < floors; f++) for (let k = 0; k < cols; k++) lit.push(r.chance(0.62) ? (r.chance(0.3) ? 2 : 1) : 0);
    p.group('windows', bx, (c) => {
      let n = 0;
      for (let f = 1; f < floors; f++) for (let k = 0; k < cols; k++) {
        const v = lit[n++];
        const d0 = lerp(b.d0, b.d1, (k + 0.25) / cols), d1 = lerp(b.d0, b.d1, (k + 0.72) / cols);
        const z0 = f * 170 + 40, z1 = z0 + 90;
        if (z1 > b.z - 60) continue;
        c.fillStyle = v === 2 ? LIT2 : v === 1 ? LIT : DARKW;
        path(c, fq(d0, d1, z0, z1)); c.fill();
      }
    }, { t: t + 2.6, d: 1.0, reveal: 'rise' });
  });
  // the Garden Bridge: a low steel truss over the creek between the low block and Broadway Mansions
  const g0 = 0.71, g1 = 0.77;
  const truss = [];
  for (let k = 0; k <= 8; k++) {
    const d = lerp(g0, g1, k / 8), h = 200 * Math.sin(Math.PI * k / 8);
    truss.push([P(-300, 0, d), P(-300, h + 60, d)]);
  }
  p.group('bund', boxOf(truss.flat(), 20), (c) => {
    c.strokeStyle = '#8a8f8a'; c.lineWidth = 2.5; c.beginPath();
    truss.forEach(([a, b], k) => { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); if (k) { const [pa, pb] = truss[k - 1]; c.moveTo(pa[0], pa[1]); c.lineTo(b[0], b[1]); c.moveTo(pb[0], pb[1]); c.lineTo(b[0], b[1]); } });
    c.stroke();
    c.strokeStyle = LIT; c.lineWidth = 1.5; c.beginPath(); truss.forEach(([, b], k) => (k ? c.lineTo(b[0], b[1]) : c.moveTo(b[0], b[1]))); c.stroke();
  }, { t: 3.4, d: 0.8, reveal: 'fade' });
  // the promenade: lamps on posts and their pools of light, trees, people strolling
  const lamps = [];
  for (let d = 0.02; d < 1.1; d += 0.035 + d * 0.04) lamps.push(d);
  const people = [];
  for (let i = 0; i < 46; i++) people.push([r() ** 1.6 * 0.7, r.range(-420, -200), r.pick(['#e9dcc4', '#2b2f3a', '#a8322c', '#3f6b62', '#d8b26a', '#1a1a1a']), r.chance(0.5)]);
  people.sort((a, b) => b[0] - a[0]);
  p.group('bund', boxOf([P(FX, 0, 0), P(-150, 500, 0), P(-150, 0, 1.1)], 30), (c) => {
    for (const d of lamps) {
      const [x, y] = P(-200, 0, d), [, ty] = P(-200, 380, d), s = sOf(d);
      glow(c, x, ty, 70 * s + 4, 'rgba(255,210,130,A)', 0.55);
      c.strokeStyle = '#1b1715'; c.lineWidth = Math.max(1, 8 * s); c.beginPath(); c.moveTo(x, y); c.lineTo(x, ty); c.stroke();
      c.fillStyle = '#fff1c8'; c.beginPath(); c.arc(x, ty, Math.max(1.5, 14 * s), 0, Math.PI * 2); c.fill();
    }
    for (const [d, X, col, hat] of people) {
      const [x, y] = P(X, 0, d), s = sOf(d);
      const h = 170 * s, w = 26 * s;
      c.fillStyle = col; poly(c, [[x - w, y], [x + w, y], [x + w * 0.6, y - h * 0.8], [x - w * 0.6, y - h * 0.8]]); c.fill();
      c.fillStyle = '#e8c9a8'; c.beginPath(); c.arc(x, y - h * 0.88, w * 0.55, 0, Math.PI * 2); c.fill();
      c.fillStyle = INK;
      if (hat) { c.fillRect(x - w * 0.9, y - h * 0.96, w * 1.8, Math.max(1, 4 * s)); c.fillRect(x - w * 0.5, y - h * 1.08, w, h * 0.12); }
      else { c.beginPath(); c.arc(x, y - h * 0.92, w * 0.55, Math.PI, 0); c.fill(); }
    }
  }, { t: 7.8, d: 1.0, reveal: 'fade' });
}
function drawBuilding(c, b) {
  const { d0, d1, z, kind } = b, dm = (d0 + d1) / 2, s = sOf(dm);
  const face = fq(d0, d1, 0, z);
  // the front, floodlit from below: warm at the foot, cooling to the sky at the top
  const yb = face[0][1], yt = face[3][1];
  const g = c.createLinearGradient(0, yb, 0, Math.min(yt, face[2][1]));
  const tone = { cols: '#c9b48d', deco: '#d8c9a6', hsbc: '#c2ab84', customs: '#cdb88e', peace: '#bfae90', boc: '#c8b896', low: '#a89678', broadway: '#b08a6a' }[kind];
  g.addColorStop(0, '#f4dfaa'); g.addColorStop(0.45, tone); g.addColorStop(1, mix(STONE_D, SKY1, 0.4));
  c.fillStyle = g; path(c, face); c.fill();
  // a dark end where it meets its neighbor, the cornice and a rusticated base
  c.fillStyle = 'rgba(40,30,30,0.5)'; path(c, fq(d0, d0 + (d1 - d0) * 0.04, 0, z)); c.fill();
  c.fillStyle = '#f7e6b8'; path(c, fq(d0, d1, z - 50, z)); c.fill();
  c.fillStyle = STONE_D; path(c, fq(d0, d1, z - 80, z - 50)); c.fill();
  c.fillStyle = 'rgba(90,70,50,0.45)'; path(c, fq(d0, d1, 0, 300)); c.fill();
  // pilasters or deco piers: thin vertical bands
  const piers = kind === 'deco' || kind === 'boc' || kind === 'broadway' ? 9 : 6;
  c.fillStyle = kind === 'deco' ? 'rgba(255,240,200,0.35)' : 'rgba(80,60,40,0.3)';
  for (let k = 0; k <= piers; k++) { const dd = lerp(d0, d1, k / piers); path(c, fq(dd - 0.0012, dd + 0.0012, 300, z - 80)); c.fill(); }
  if (kind === 'cols') {
    // a colonnade over the entrance, in shadow between its columns
    c.fillStyle = 'rgba(40,30,30,0.55)'; path(c, fq(lerp(d0, d1, 0.3), lerp(d0, d1, 0.7), 300, 760)); c.fill();
    c.fillStyle = '#f7e6b8'; for (let k = 0; k <= 4; k++) { const dd = lerp(lerp(d0, d1, 0.3), lerp(d0, d1, 0.7), k / 4); path(c, fq(dd - 0.002, dd + 0.002, 300, 760)); c.fill(); }
    c.fillStyle = '#f7e6b8'; path(c, fq(lerp(d0, d1, 0.28), lerp(d0, d1, 0.72), 760, 820)); c.fill();
  }
  if (kind === 'hsbc') {
    // the dome on its drum, over the middle
    const [cx, cy] = P(FX, z, dm), w = 300 * s;
    c.fillStyle = STONE; c.fillRect(cx - w * 0.7, cy - 160 * s, w * 1.4, 160 * s);
    c.fillStyle = 'rgba(40,30,30,0.5)'; for (let k = 0; k < 8; k++) c.fillRect(cx - w * 0.6 + k * w * 0.17, cy - 130 * s, w * 0.06, 100 * s);
    const gd = c.createRadialGradient(cx - w * 0.25, cy - 340 * s, 4, cx, cy - 220 * s, w * 0.9);
    gd.addColorStop(0, '#d8e6d4'); gd.addColorStop(1, '#4e7a6d');
    c.fillStyle = gd; c.beginPath(); c.ellipse(cx, cy - 160 * s, w * 0.62, 380 * s, 0, Math.PI, 0); c.fill();
    c.fillStyle = STONE; c.fillRect(cx - 14 * s, cy - 600 * s, 28 * s, 80 * s);
    c.fillStyle = LIT; c.beginPath(); c.arc(cx, cy - 610 * s, 10 * s, 0, Math.PI * 2); c.fill();
  }
  if (kind === 'customs') {
    // the clock tower: a square shaft, the clock faces, stepped stages, a lantern and a pole
    const [cx, cy] = P(FX, z, dm), w = 170 * s;
    const sh = c.createLinearGradient(0, cy, 0, cy - 1200 * s);
    sh.addColorStop(0, '#f2dca6'); sh.addColorStop(1, '#a8957a');
    c.fillStyle = sh; c.fillRect(cx - w, cy - 800 * s, 2 * w, 800 * s);
    c.fillStyle = 'rgba(70,55,40,0.4)'; c.fillRect(cx - w, cy - 800 * s, w * 0.35, 800 * s);
    for (let k = 0; k < 5; k++) { c.fillStyle = 'rgba(40,30,30,0.5)'; c.fillRect(cx - w * 0.15, cy - (140 + k * 120) * s, w * 0.3, 56 * s); }
    // the clock
    c.fillStyle = '#fff4d0'; c.beginPath(); c.arc(cx, cy - 656 * s, w * 0.72, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = Math.max(1, 5 * s); c.beginPath(); c.arc(cx, cy - 656 * s, w * 0.72, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(cx, cy - 656 * s); c.lineTo(cx, cy - 720 * s); c.moveTo(cx, cy - 656 * s); c.lineTo(cx + 40 * s, cy - 640 * s); c.stroke();
    c.fillStyle = '#e8d3a0'; c.fillRect(cx - w * 1.1, cy - 816 * s, w * 2.2, 32 * s);
    c.fillStyle = '#d4bd8e'; c.fillRect(cx - w * 0.8, cy - 1008 * s, w * 1.6, 192 * s);
    c.fillStyle = 'rgba(40,30,30,0.55)'; for (let k = -1; k <= 1; k++) c.fillRect(cx + k * w * 0.5 - w * 0.12, cy - 976 * s, w * 0.24, 128 * s);
    c.fillStyle = '#e8d3a0'; c.fillRect(cx - w * 0.9, cy - 1024 * s, w * 1.8, 24 * s);
    c.fillStyle = '#c2ac80'; c.fillRect(cx - w * 0.5, cy - 1136 * s, w, 112 * s);
    c.fillStyle = '#a8957a'; poly(c, [[cx - w * 0.55, cy - 1136 * s], [cx + w * 0.55, cy - 1136 * s], [cx, cy - 1216 * s]]); c.fill();
    c.strokeStyle = '#d6c6a4'; c.lineWidth = Math.max(1, 5 * s); c.beginPath(); c.moveTo(cx, cy - 1200 * s); c.lineTo(cx, cy - 1344 * s); c.stroke();
  }
  if (kind === 'peace') {
    // the corner tower and its steep green pyramid
    const da = d0 + 0.004, db = d0 + 0.03;
    const [ax, ay] = P(FX, z, da), [bx2, by2] = P(FX, z, db), [tx, ty] = P(FX, z + 520, (da + db) / 2);
    c.fillStyle = STONE; path(c, [[ax, ay], [bx2, by2], P(FX, z + 160, db), P(FX, z + 160, da)]); c.fill();
    c.fillStyle = 'rgba(40,30,30,0.45)'; path(c, fq(da + 0.004, db - 0.004, z + 30, z + 130)); c.fill();
    const top0 = P(FX, z + 160, da), top1 = P(FX, z + 160, db);
    c.fillStyle = '#3d7d62'; path(c, [top0, top1, [tx, ty]]); c.fill();
    c.fillStyle = '#6fae8f'; path(c, [top0, [(top0[0] + top1[0]) / 2, (top0[1] + top1[1]) / 2], [tx, ty]]); c.fill();
    c.strokeStyle = '#c9d8c4'; c.lineWidth = 2; c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx, ty - 60 * sOf(da)); c.stroke();
  }
  if (kind === 'boc') {
    // a Chinese hipped roof in blue-green tile over a stepped top
    const [cx, cy] = P(FX, z, dm), w = (P(FX, z, d0)[0] - P(FX, z, d1)[0]) * 0.5;
    c.fillStyle = '#2f5f68'; poly(c, [[cx - w * 0.95, cy + 6], [cx + w * 0.95, cy + 2], [cx + w * 0.6, cy - 260 * s], [cx - w * 0.6, cy - 256 * s]]); c.fill();
    c.fillStyle = '#58919a'; poly(c, [[cx - w * 0.95, cy + 6], [cx, cy + 4], [cx, cy - 258 * s], [cx - w * 0.6, cy - 256 * s]]); c.fill();
    c.strokeStyle = '#86b9bf'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - w * 1.05, cy + 10); c.quadraticCurveTo(cx - w * 0.9, cy + 2, cx - w * 0.9, cy - 8); c.moveTo(cx + w * 1.05, cy + 6); c.quadraticCurveTo(cx + w * 0.9, cy - 2, cx + w * 0.9, cy - 12); c.stroke();
  }
  if (kind === 'broadway') {
    // Broadway Mansions: brick, stepped back in tiers
    for (let k = 1; k <= 3; k++) {
      const a = lerp(d0, d1, k * 0.12), bq = lerp(d0, d1, 1 - k * 0.12);
      c.fillStyle = mix('#8a5a44', '#c99a72', k / 3); path(c, fq(a, bq, z, z + k * 220)); c.fill();
    }
    c.fillStyle = 'rgba(30,20,20,0.35)'; path(c, fq(d0, d1, 0, z)); c.fill();
  }
}

// ================================================================ the river: dark water, the lights laid down it in long streaks
function river(p, r) {
  const water = [P(-150, 0, 0, RY), P(-150, 0, 1.4, RY), [VX + 10, VY + 6], [850, VY + 30], [X1, VY + 20], [X1, Y1], [X0, Y1]];
  p.group('river', boxOf([[X0, VY], [X1, Y1]], 4), (c) => {
    const g = c.createLinearGradient(0, VY, 0, Y1);
    g.addColorStop(0, '#2c5552'); g.addColorStop(0.2, RIVER0); g.addColorStop(1, RIVER1);
    c.fillStyle = g; path(c, water); c.fill();
  }, { t: 2.0, d: 1.0, reveal: 'fall' });
  // ripples: thin pale dashes across the water, more open nearer
  const rip = [];
  for (let i = 0; i < 340; i++) { const y = VY + 30 + (Y1 - VY) * r() ** 1.5, k = (y - VY) / (Y1 - VY); rip.push([r.range(X0, X1), y, 8 + k * 60 * r.range(0.4, 1), 0.8 + k * 2]); }
  p.group('river', { x: X0, y: VY, w: X1 - X0, h: Y1 - VY }, (c) => {
    c.save(); path(c, water); c.clip();
    c.strokeStyle = 'rgba(150,190,180,0.22)'; c.lineCap = 'round';
    for (const [x, y, l, w] of rip) { c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y); c.stroke(); }
    c.restore();
  }, { t: 2.6, d: 1.2, reveal: 'fall' });
  // reflections: the moon, the towers, the lit fronts, each a column of broken gold
  const cols = [[MX, 180, '#fff0c8', 0.5], [1000, 30, '#ff9aa8', 0.6], [1215, 18, LIT, 0.5], [1300, 18, LIT, 0.45], [1395, 22, LIT, 0.5]];
  for (let k = 0; k < 14; k++) cols.push([r.range(880, X1), r.range(6, 14), LIT, 0.35]);
  for (const b of BLD) { const [x] = P(FX, 0, (b.d0 + b.d1) / 2); if (x > X0 && x < 760) cols.push([x + 280 * sOf(b.d0), 60 * sOf(b.d0) + 10, LIT, 0.4]); }
  const dashes = cols.map(([x, w, col, a]) => {
    const list = [];
    for (let y = VY + 40; y < Y1; y += r.range(6, 14)) { const k = (y - VY) / (Y1 - VY); list.push([x + r.range(-w, w) * (0.4 + k), y, r.range(6, 22) * (0.5 + k * 1.5) + w * 0.3, 1 + k * 3]); }
    return { col, a, list };
  });
  p.group('reflect', { x: X0, y: VY, w: X1 - X0, h: Y1 - VY }, (c) => {
    c.save(); path(c, water); c.clip();
    c.lineCap = 'round';
    for (const { col, a, list } of dashes) {
      c.strokeStyle = col; c.globalAlpha = a;
      c.beginPath(); for (const [x, y, l, w] of list) { c.moveTo(x - l / 2, y); c.lineTo(x + l / 2, y); } c.lineWidth = 2.2; c.stroke();
    }
    c.restore();
  }, { t: 7.0, d: 1.6, reveal: 'fall', ease: 'inOut' });
}

// ================================================================ the junks and sampans
function junk(c, s, sail, o = {}) {
  // (0, 0) on the waterline amidships, facing left; s scale
  c.save(); c.scale(s, s);
  // the hull: a high square stern, a low bow, a band of color
  c.fillStyle = INK;
  c.beginPath(); c.moveTo(-170, -46); c.quadraticCurveTo(-40, -20, 120, -30); c.lineTo(160, -90); c.lineTo(178, -86); c.lineTo(160, 0); c.lineTo(-130, 0); c.closePath(); c.fill();
  c.fillStyle = RUST; c.beginPath(); c.moveTo(-160, -42); c.quadraticCurveTo(-40, -18, 120, -28); c.lineTo(126, -40); c.quadraticCurveTo(-40, -30, -164, -50); c.fill();
  c.fillStyle = GOLD; c.fillRect(-150, -14, 280, 3);
  c.beginPath(); c.arc(-130, -30, 7, 0, Math.PI * 2); c.fill();
  // the masts and battened sails: fans of ribs, the cloth between them
  for (const [mx, h, w, lean] of sail) {
    c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(mx, -30); c.lineTo(mx + lean * 0.2, -30 - h); c.stroke();
    const top = -30 - h, bot = -50;
    const sp = [[mx + lean * 0.2 - 6, top + 6], [mx + lean * 0.2 + w * 0.45, top - 10], [mx + w + lean * 0.05, bot - h * 0.25], [mx + w * 0.85, bot], [mx - 6, bot]];
    const g = c.createLinearGradient(mx, top, mx + w, bot);
    g.addColorStop(0, o.sailLit || '#d77a4a'); g.addColorStop(1, o.sail || '#6e2c1c');
    c.fillStyle = g; path(c, sp); c.fill();
    c.strokeStyle = 'rgba(20,10,8,0.8)'; c.lineWidth = 2.5; c.beginPath();
    for (let k = 1; k < 8; k++) { const u = k / 8; c.moveTo(lerp(mx + lean * 0.2 - 6, mx - 6, u), lerp(top + 6, bot, u)); c.lineTo(lerp(lerp(mx + lean * 0.2 + w * 0.45, mx + w + lean * 0.05, u * 1.6 > 1 ? 1 : u * 1.6), mx + w * 0.85, clamp(u * 1.6 - 0.6)), lerp(lerp(top - 10, bot - h * 0.25, clamp(u * 1.6)), bot, clamp(u * 1.6 - 0.6))); }
    c.stroke();
  }
  c.restore();
}
function boats(p, r) {
  // a big junk in front, at the right, coming down the river
  p.mark('boats', {
    t: 8.4, d: 1.8, reveal: 'slide', dx: 260, ease: 'out', box: { x: 840, y: 1180, w: 640, h: 560 },
    draw: (c) => { c.save(); c.translate(1160, 1660); junk(c, 1.45, [[-90, 250, 120, 10], [10, 330, 150, 14], [110, 220, 110, 10]], { sailLit: '#e58a52', sail: '#7a2e1c' }); c.restore(); },
  });
  // a smaller one mid-river
  p.mark('boats', {
    t: 8.0, d: 1.6, reveal: 'slide', dx: -160, ease: 'out', box: { x: 540, y: 1180, w: 340, h: 230 },
    draw: (c) => { c.save(); c.translate(700, 1385); c.scale(-1, 1); junk(c, 0.62, [[-80, 240, 110, 8], [20, 300, 130, 12], [110, 200, 100, 8]], { sailLit: '#c86a42', sail: '#5a2418' }); c.restore(); },
  });
  // sampans with their lamps
  const sampans = [[420, 1560, 1.1], [300, 1460, 0.8], [760, 1500, 0.9], [980, 1290, 0.6], [1120, 1200, 0.5]];
  p.group('boats', { x: 200, y: 1150, w: 1000, h: 470 }, (c) => {
    for (const [x, y, s] of sampans) {
      c.fillStyle = INK; c.beginPath(); c.moveTo(x - 70 * s, y - 14 * s); c.quadraticCurveTo(x, y + 8 * s, x + 70 * s, y - 18 * s); c.lineTo(x + 54 * s, y); c.lineTo(x - 54 * s, y); c.fill();
      c.fillStyle = '#3a2a22'; c.beginPath(); c.ellipse(x - 6 * s, y - 16 * s, 30 * s, 18 * s, 0, Math.PI, 0); c.fill();
      c.strokeStyle = INK; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x + 50 * s, y - 16 * s); c.lineTo(x + 100 * s, y - 64 * s); c.stroke();
    }
  }, { t: 8.8, d: 0.8, reveal: 'fade' });
}

// ================================================================ what moves: lamps on the boats, a ferry, the tower lights, the water
function lives(p, r) {
  const lamps = [[1160 + 160 * 1.45, 1660 - 96 * 1.45, 16], [700 - 160 * 0.62, 1385 - 96 * 0.62, 8], [420 + 100 * 1.1, 1560 - 64 * 1.1, 9], [300 + 80, 1460 - 51, 7], [760 + 90, 1500 - 58, 7]];
  p.live('live', {
    t: 9.4, d: 1.0,
    draw: (c, time) => {
      for (let i = 0; i < lamps.length; i++) {
        const [x, y, s] = lamps[i], f = 0.75 + 0.25 * Math.sin(time * 5 + i * 2.1) * Math.sin(time * 3.3 + i);
        c.fillStyle = `rgba(255,190,100,${0.18 * f})`; c.beginPath(); c.arc(x, y, s * 3, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#c8362c'; c.beginPath(); c.ellipse(x, y, s * 0.7, s, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = `rgba(255,230,160,${f})`; c.beginPath(); c.arc(x, y, s * 0.45, 0, Math.PI * 2); c.fill();
      }
    },
  });
  // a ferry crossing far down the river, its portholes lit
  p.live('live', {
    t: 9.0, d: 1.0,
    draw: (c, time) => {
      const u = ((time - 9) * 0.012) % 1, x = lerp(1180, 860, u), y = lerp(1118, 1092, u), s = lerp(1, 0.75, u);
      c.fillStyle = '#d9d2c2'; c.fillRect(x - 40 * s, y - 14 * s, 80 * s, 10 * s); c.fillRect(x - 22 * s, y - 24 * s, 40 * s, 10 * s);
      c.fillStyle = INK; c.fillRect(x - 44 * s, y - 4 * s, 88 * s, 6 * s);
      c.fillStyle = LIT; for (let k = 0; k < 7; k++) c.fillRect(x - 34 * s + k * 10 * s, y - 11 * s, 4 * s, 3 * s);
      c.fillStyle = 'rgba(255,215,140,0.3)'; c.fillRect(x - 30 * s, y + 4 * s, 60 * s, 2);
    },
  });
  // beacons blinking on the tower tops
  const beacons = [[1000, 488], [1215, 538], [1300, 518], [1395, 460]];
  p.live('live', {
    t: 6.0, d: 1.0,
    draw: (c, time) => {
      for (let i = 0; i < beacons.length; i++) {
        const on = Math.sin(time * 2.2 + i * 1.3) > 0.3 ? 1 : 0.25;
        const [x, y] = beacons[i];
        c.fillStyle = `rgba(255,80,80,${0.25 * on})`; c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill();
        c.fillStyle = `rgba(255,140,140,${on})`; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
      }
    },
  });
  // the moon's path on the water trembles
  const glints = [];
  for (let i = 0; i < 40; i++) glints.push([MX + r.range(-60, 60), r.range(VY + 60, 1400), r.range(10, 30), r() * 6]);
  p.live('live', {
    t: 8.0, d: 1.0,
    draw: (c, time) => {
      c.strokeStyle = 'rgba(255,244,210,0.75)'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();
      for (const [x, y, l, ph] of glints) {
        const k = 0.5 + 0.5 * Math.sin(time * 2 + ph);
        if (k < 0.35) continue;
        const ll = l * k * (0.5 + (y - VY) / 600);
        c.moveTo(x - ll / 2 + Math.sin(time + ph) * 6, y); c.lineTo(x + ll / 2 + Math.sin(time + ph) * 6, y);
      }
      c.stroke();
    },
  });
}

// ================================================================ the gilt: rules, stepped corners, fans, chevrons
function gilt(p, r) {
  const o = 18;
  // the double rule round the picture, drawn by a pen
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
  p.pen('gilt', rect(X0 - 6, Y0 - 6, X1 + 6, Y1 + 6), GOLD, 5, { t: 0.4, d: 2.0 });
  p.pen('gilt', rect(X0 - o - 8, Y0 - o - 8, X1 + o + 8, Y1 + o + 8), GOLD_D, 2, { t: 0.7, d: 2.0 });
  // the outer frame: a broad gold band with stepped (ziggurat) corners
  const B = 40;
  const outer = [];
  const step = (x, y, sx, sy) => [[x, y + sy * 60], [x + sx * 20, y + sy * 60], [x + sx * 20, y + sy * 40], [x + sx * 40, y + sy * 40], [x + sx * 40, y + sy * 20], [x + sx * 60, y + sy * 20], [x + sx * 60, y]];
  outer.push(...step(B, B, 1, 1));
  outer.push(...step(W - B, B, -1, 1).reverse());
  outer.push(...step(W - B, H - B, -1, -1));
  outer.push(...step(B, H - B, 1, -1).reverse());
  outer.push(outer[0]);
  p.pen('gilt', outer, GOLD, 4, { t: 1.0, d: 2.4 });
  const inner = outer.map(([x, y]) => [x + (x < W / 2 ? 14 : -14), y + (y < H / 2 ? 14 : -14)]);
  p.pen('gilt', inner, GOLD_D, 1.5, { t: 1.3, d: 2.4 });
  // fans in the four corners of the picture's border
  const fans = [[X0 - 26, Y0 - 26, 0], [X1 + 26, Y0 - 26, Math.PI / 2], [X1 + 26, Y1 + 26, Math.PI], [X0 - 26, Y1 + 26, -Math.PI / 2]];
  p.group('gilt', { x: 0, y: 0, w: W, h: H }, (c) => {
    for (const [x, y, a] of fans) {
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = GOLD;
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 60 - k * 14, 0, Math.PI / 2); c.closePath(); c.fillStyle = k % 2 ? LAC2 : GOLD; c.fill(); }
      c.strokeStyle = GOLD_D; c.lineWidth = 1.5; c.beginPath(); for (let k = 0; k <= 6; k++) { const t = (k / 6) * Math.PI / 2; c.moveTo(0, 0); c.lineTo(Math.cos(t) * 60, Math.sin(t) * 60); } c.stroke();
      c.restore();
    }
  }, { t: 2.6, d: 0.8, reveal: 'fade' });
  // chevrons down the side bands
  const chev = [];
  for (let y = Y0 + 40; y < Y1 - 40; y += 36) { chev.push([[66, y], [84, y + 14], [102, y]]); chev.push([[W - 102, y], [W - 84, y + 14], [W - 66, y]]); }
  p.strokes('gilt', chev, GOLD_D, 3, { t: 3.0, d: 1.6, reveal: 'fall', ease: 'inOut' });
  // the head panel: a sunburst behind the name, a stepped arch over it
  const hx = W / 2, hy = 330;
  const rays = [];
  for (let k = 0; k <= 24; k++) { const a = Math.PI + (k / 24) * Math.PI; rays.push([[hx + Math.cos(a) * 120, hy + Math.sin(a) * 120], [hx + Math.cos(a) * 330, hy + Math.sin(a) * 260]]); }
  p.strokes('gilt', rays, 'rgba(212,172,88,0.45)', 2, { t: 9.4, d: 1.2, reveal: 'iris' });
  p.group('gilt', { x: hx - 520, y: 60, w: 1040, h: 340 }, (c) => {
    c.strokeStyle = GOLD; c.lineWidth = 3;
    c.beginPath(); c.moveTo(hx - 500, 390); c.lineTo(hx - 500, 140); c.lineTo(hx - 420, 140); c.lineTo(hx - 420, 100); c.lineTo(hx - 340, 100); c.lineTo(hx - 340, 70);
    c.lineTo(hx + 340, 70); c.lineTo(hx + 340, 100); c.lineTo(hx + 420, 100); c.lineTo(hx + 420, 140); c.lineTo(hx + 500, 140); c.lineTo(hx + 500, 390); c.stroke();
    c.lineWidth = 1.5; c.strokeStyle = GOLD_D;
    c.beginPath(); c.moveTo(hx - 486, 390); c.lineTo(hx - 486, 154); c.lineTo(hx - 406, 154); c.lineTo(hx - 406, 114); c.lineTo(hx - 326, 114); c.lineTo(hx - 326, 84);
    c.lineTo(hx + 326, 84); c.lineTo(hx + 326, 114); c.lineTo(hx + 406, 114); c.lineTo(hx + 406, 154); c.lineTo(hx + 486, 154); c.lineTo(hx + 486, 390); c.stroke();
    // little red lozenges at the steps
    c.fillStyle = '#b2382c';
    for (const x of [hx - 460, hx + 460]) { c.beginPath(); c.moveTo(x, 250); c.lineTo(x + 14, 270); c.lineTo(x, 290); c.lineTo(x - 14, 270); c.fill(); }
  }, { t: 9.0, d: 1.2, reveal: 'fade' });
}

// ================================================================ the name
function title(p, r) {
  p.type('title', '上海', W / 2, 300, { size: 210, family: '"ZCOOL XiaoWei"', color: GOLD_L, shadow: '#7a1f18', sx: 6, sy: 6, align: 'center', track: 0.18, t: 10.4, gap: 0.6, d: 1.0 });
  p.type('title', 'SHANGHAI', W / 2, 378, { size: 46, family: '"Limelight"', color: GOLD, align: 'center', track: 0.55, t: 11.8, gap: 0.08, d: 0.4, reveal: 'fade' });
  // the foot: the river's name, the subject, the year
  p.type('title', '黃浦江夜景', W / 2, 1850, { size: 64, family: '"ZCOOL XiaoWei"', color: GOLD_L, align: 'center', track: 0.3, t: 12.4, gap: 0.14, d: 0.5 });
  p.type('title', 'THE BUND BY NIGHT · HUANGPU', W / 2, 1910, { size: 24, family: '"Limelight"', color: GOLD_D, align: 'center', track: 0.4, t: 13.0, gap: 0.03, d: 0.3, reveal: 'fade' });
}
