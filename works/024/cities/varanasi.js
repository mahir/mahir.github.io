// Varanasi: an Indian calendar print at dawn. We look down the river from a boat:
// the ghats run along the left bank toward the far haze, flight after flight of
// sandstone steps climbing from the water to palaces with arched balconies and
// parapets, temple spires and domed pavilions, straw umbrellas and bathers on
// the steps, saffron pennants. On the right the Ganges lies wide and pink under
// a red sun rising over the flat eastern bank, its light broken in a gold column
// on the water; boats with painted hulls and canopies, the leaning Ratneshwar
// temple standing in the river, small leaf-cup lamps floating. Marigold garlands
// hang across the top. The print sits in a maroon frame with gold rules and
// flowers, the name in Tiro Devanagari below, set a syllable at a time.

import { Plate, W } from '../print.js';
import { Ground, poly, mix, shade, lerp, smooth, waveLines, gull } from '../kit.js';

const MAROON = '#6a1325', MAROON_D = '#4a0c19', GOLD = '#e9b44a', GOLD_D = '#a8752a', CREAM = '#fbecd0';
const SAFFRON = '#f08a1c', MARI = '#f6b81e', LEAF = '#3f7a35', LEAF_D = '#285524';
const HAZE = '#efc3a6', INK = '#4a2526';
const STONES = ['#e3b07a', '#d79f6a', '#e8c08d', '#cf8c63', '#efd7b0', '#d4977a', '#e4a46c', '#c98257'];
const PAINTS = ['#ecc35c', '#e9a3a0', '#a9cfc8', '#f3ead8', '#e8b07c', '#d98a8a', '#f0d27a'];
const F = '"Tiro Devanagari Hindi", serif';
const DEVA = 'वाराणसी', SUB = 'काशी';

export const city = {
  id: 'varanasi', name: 'Varanasi', wall: '#3a1218',
  alt: 'An Indian calendar print at dawn, looking down the Ganges along the ghats: sandstone steps climbing from the water to palaces with arched balconies, temple spires and domed pavilions fading into the haze, straw umbrellas, bathers and saffron pennants on the steps, a red sun rising over the far bank with its light in a gold column on the river, painted boats with canopies and a boatman rowing, the leaning Ratneshwar temple standing in the water, leaf-cup lamps floating, and marigold garlands across the top, in a maroon frame with gold flowers above the name वाराणसी with VARANASI',
  google: 'family=Tiro+Devanagari+Hindi',
  fonts: [['400 190px "Tiro Devanagari Hindi"', DEVA + ' ' + SUB], ['400 44px "Tiro Devanagari Hindi"', 'VARANASI · THE GHATS AT DAWN ON THE GANGES']],
  build,
};

// the picture's opening inside the frame
const X0 = 90, Y0 = 90, X1 = W - 90, Y1 = 1560;
// looking along the bank: the vanishing point, the water's edge (u = UW), the top
// of the steps where the buildings stand (u = UP, height HS)
const g = new Ground({ cx: 1000, hy: 985, y0: 1700, U: 800, K: 1 });
const UW = -1.0, UP = -1.34, HS = 230, NSTEP = 16;
const VN = 0.06, VF = 60;
const SUN = [1290, 905, 74];

function build() {
  const p = new Plate({ paper: '#f3e2c4', seed: 1008 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'water', 'far', 'steps', 'ghats', 'spires', 'onsteps', 'river', 'boats', 'live', 'garland', 'frame', 'title');
  p.layer('frame', { clip: false });
  p.layer('title', { clip: false });

  frame(p);
  sky(p, r);
  water(p, r);
  steps(p, r);
  const blds = ghats(p, r);
  spires(p, r, blds);
  onSteps(p, r);
  river(p, r);
  boats(p, r);
  life(p, r);
  garland(p);
  title(p);
  return p;
}

const P = (u, v, z) => g.P(u, v, z);
const haze = (col, v, k = 0.75) => mix(col, HAZE, smooth(0.8, 14, v) * k);
const quad = (c, pts) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };

// ================================================================ the frame
function frame(p) {
  p.group('frame', { x: 0, y: 0, w: W, h: 2000 }, (c) => {
    c.fillStyle = MAROON; c.beginPath(); c.rect(26, 26, W - 52, 2000 - 52); c.rect(X0, Y0, X1 - X0, Y1 - Y0); c.fill('evenodd');
    // a darker band round the opening, for depth
    c.strokeStyle = MAROON_D; c.lineWidth = 12; c.strokeRect(X0 - 6, Y0 - 6, X1 - X0 + 12, Y1 - Y0 + 12);
  }, { t: 0, d: 0.5, reveal: 'fade' });
  // gold rules, drawn round by a pen: two round the opening, one at the edge
  const ring = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
  p.pen('frame', ring(X0 - 16, Y0 - 16, X1 + 16, Y1 + 16), GOLD, 3, { t: 0.3, d: 1.6, cap: 'butt' });
  p.pen('frame', ring(X0 - 24, Y0 - 24, X1 + 24, Y1 + 24), GOLD_D, 1.5, { t: 0.5, d: 1.6, cap: 'butt' });
  p.pen('frame', ring(42, 42, W - 42, 2000 - 42), GOLD, 2.5, { t: 0.4, d: 1.8, cap: 'butt' });
  // a running border of small gold lozenges and dots in the band
  p.group('frame', { x: 26, y: 26, w: W - 52, h: 2000 - 52 }, (c) => {
    c.fillStyle = GOLD_D; c.beginPath();
    const loz = (x, y, s) => { c.moveTo(x, y - s); c.lineTo(x + s * 0.6, y); c.lineTo(x, y + s); c.lineTo(x - s * 0.6, y); c.closePath(); };
    for (let x = 100; x < W - 90; x += 36) { loz(x, 57, 7); }
    for (let y = 100; y < Y1 + 10; y += 36) { loz(57, y, 7); loz(W - 57, y, 7); }
    c.fill();
  }, { t: 1.4, d: 0.8, reveal: 'fade' });
  // a flower in each corner of the band
  p.group('frame', { x: 26, y: 26, w: W - 52, h: 2000 - 52 }, (c) => {
    for (const [x, y] of [[57, 57], [W - 57, 57], [57, 2000 - 57], [W - 57, 2000 - 57]]) rosette(c, x, y, 26, GOLD, GOLD_D);
  }, { t: 1.6, d: 0.6, reveal: 'pop' });
}

// an eight-petaled flower
function rosette(c, x, y, s, col, dark) {
  c.fillStyle = col; c.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    c.ellipse(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.42, s * 0.2, a, 0, Math.PI * 2);
  }
  c.fill();
  c.fillStyle = dark; c.beginPath(); c.arc(x, y, s * 0.3, 0, Math.PI * 2); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(x, y, s * 0.14, 0, Math.PI * 2); c.fill();
}

// ================================================================ the dawn sky
function sky(p, r) {
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: g.hy - Y0 + 20 }, (c) => {
    const gr = c.createLinearGradient(0, Y0, 0, g.hy);
    gr.addColorStop(0, '#8090c2'); gr.addColorStop(0.32, '#c49ab8'); gr.addColorStop(0.62, '#f0afa0');
    gr.addColorStop(0.86, '#f8cb8e'); gr.addColorStop(1, '#fde3a8');
    c.fillStyle = gr; c.fillRect(X0, Y0, X1 - X0, g.hy - Y0 + 20);
  }, { t: 0.3, d: 1.2, reveal: 'fall', ease: 'inOut' });
  // the glow round the sun
  const [sx, sy, sr] = SUN;
  p.group('sky', { x: sx - 420, y: sy - 420, w: 840, h: 840 }, (c) => {
    const gr = c.createRadialGradient(sx, sy, sr * 0.8, sx, sy, 400);
    gr.addColorStop(0, 'rgba(255,236,170,.85)'); gr.addColorStop(0.4, 'rgba(253,210,140,.35)'); gr.addColorStop(1, 'rgba(253,210,140,0)');
    c.fillStyle = gr; c.fillRect(sx - 420, sy - 420, 840, 840);
  }, { t: 1.6, d: 1.4, reveal: 'fade' });
  // faint rays fanning out from the sun
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: g.hy - Y0 }, (c) => {
    c.save(); c.beginPath(); c.rect(X0, Y0, X1 - X0, g.hy - Y0); c.clip();
    c.fillStyle = 'rgba(255,236,190,.16)'; c.beginPath();
    for (let k = 0; k < 18; k++) {
      const a0 = Math.PI * (1.02 + k * 0.055), a1 = a0 + 0.022;
      c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a0) * 1600, sy + Math.sin(a0) * 1600); c.lineTo(sx + Math.cos(a1) * 1600, sy + Math.sin(a1) * 1600); c.closePath();
    }
    c.fill(); c.restore();
  }, { t: 2.4, d: 1.4, reveal: 'iris', ease: 'inOut' });
  // long soft clouds, rose with gold undersides
  const clouds = [[180, 360, 420, 22], [700, 300, 360, 18], [1080, 520, 380, 20], [380, 610, 300, 14], [1160, 700, 260, 12], [880, 760, 220, 10]];
  clouds.forEach(([x, y, w, h], i) => {
    const blobs = [];
    for (let k = 0; k < 6; k++) blobs.push([x + (k / 5) * w, y + r.range(-h * 0.4, h * 0.4), w * r.range(0.12, 0.2), h * r.range(0.7, 1.2)]);
    p.group('sky', { x: x - w * 0.3, y: y - h * 2.5, w: w * 1.6, h: h * 5 }, (c) => {
      c.fillStyle = 'rgba(244,170,170,.75)'; c.beginPath();
      for (const [bx, by, rx, ry] of blobs) { c.moveTo(bx + rx, by); c.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2); }
      c.fill();
      c.fillStyle = 'rgba(255,214,140,.8)'; c.beginPath();
      for (const [bx, by, rx, ry] of blobs) { c.moveTo(bx + rx * 0.8, by + ry * 0.5); c.ellipse(bx, by + ry * 0.5, rx * 0.8, ry * 0.4, 0, 0, Math.PI * 2); }
      c.fill();
    }, { t: 1.0 + i * 0.15, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  });
}

// ================================================================ the river and the far bank
function water(p, r) {
  const y0 = g.hy;
  p.group('water', { x: X0, y: y0 - 2, w: X1 - X0, h: Y1 - y0 + 4 }, (c) => {
    const gr = c.createLinearGradient(0, y0, 0, Y1);
    gr.addColorStop(0, '#f8d6a4'); gr.addColorStop(0.25, '#eeb39c'); gr.addColorStop(0.6, '#c58f97'); gr.addColorStop(1, '#7d7396');
    c.fillStyle = gr; c.fillRect(X0, y0, X1 - X0, Y1 - y0);
  }, { t: 0.8, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // the flat sandy eastern bank and a line of far trees
  p.group('far', { x: 980, y: y0 - 24, w: X1 - 980, h: 40 }, (c) => {
    c.fillStyle = '#e9b98f'; poly(c, [[1000, y0], [X1, y0], [X1, y0 + 12], [1000, y0 + 2]]); c.fill();
    c.fillStyle = '#b98680'; c.beginPath();
    for (let x = 1060; x < X1; x += 14) { const h = 4 + ((x * 31) % 11); c.moveTo(x, y0); c.ellipse(x, y0 - h * 0.5, 6, h * 0.6, 0, 0, Math.PI * 2); }
    c.fill();
  }, { t: 1.4, d: 0.8, reveal: 'wipe' });
  // the sun, rising out of the far bank
  const [sx, sy, sr] = SUN;
  p.mark('far', {
    t: 1.6, d: 1.8, reveal: 'slide', dy: 120, ease: 'out', box: { x: sx - sr - 4, y: sy - sr - 4, w: 2 * sr + 8, h: 2 * sr + 8 },
    draw: (c) => {
      c.save(); c.beginPath(); c.rect(sx - sr - 10, Y0, 2 * sr + 20, g.hy - Y0); c.clip();
      const gr = c.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, 4, sx, sy, sr);
      gr.addColorStop(0, '#ff9a4a'); gr.addColorStop(1, '#e0412a');
      c.fillStyle = gr; c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill();
      c.restore();
    },
  });
}

// ================================================================ the steps of the ghats
function steps(p, r) {
  // the bank is split along its length into ghats, each with its own stone
  const cuts = [VN, 0.35, 0.8, 1.4, 2.2, 3.3, 4.8, 7, 10.5, 16, VF];
  const ghatsAt = [];
  for (let k = 0; k < cuts.length - 1; k++) ghatsAt.push({ v0: cuts[k], v1: cuts[k + 1], stone: r.pick(STONES) });
  const us = [], zs = [];
  for (let i = 0; i <= NSTEP; i++) { us.push(lerp(UW, UP, i / NSTEP)); zs.push(HS * i / NSTEP); }
  // drawn far to near, one ghat a mark
  [...ghatsAt].reverse().forEach((gh, j) => {
    const { v0, v1 } = gh;
    const lit = haze(shade(gh.stone, 1.06), (v0 + v1) / 2), dark = haze(shade(gh.stone, 0.8), (v0 + v1) / 2);
    const corner = [P(UW, v0, 0), P(UW, v1, 0), P(UP - 0.02, v1, HS), P(UP - 0.02, v0, HS)];
    const xs = corner.map((q) => q[0]), ys = corner.map((q) => q[1]);
    const box = { x: Math.min(...xs) - 6, y: Math.min(...ys) - 10, w: Math.max(...xs) - Math.min(...xs) + 12, h: Math.max(...ys) - Math.min(...ys) + 20 };
    p.group('steps', box, (c) => {
      for (let i = 0; i < NSTEP; i++) {
        // the riser faces the river and the sun; the tread above it
        c.fillStyle = lit; c.beginPath(); quad(c, [P(us[i], v0, zs[i]), P(us[i], v1, zs[i]), P(us[i], v1, zs[i + 1]), P(us[i], v0, zs[i + 1])]); c.fill();
        c.fillStyle = dark; c.beginPath(); quad(c, [P(us[i], v0, zs[i + 1]), P(us[i], v1, zs[i + 1]), P(us[i + 1], v1, zs[i + 1]), P(us[i + 1], v0, zs[i + 1])]); c.fill();
      }
      // the edges of the steps, as fine lines
      c.strokeStyle = haze('#8a4f3a', (v0 + v1) / 2); c.lineWidth = Math.max(0.5, 1.2 * g.s(v0)); c.beginPath();
      for (let i = 0; i <= NSTEP; i++) { const a = P(us[i], v0, zs[i]), b = P(us[i], v1, zs[i]); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
      c.stroke();
      // the wall at the near end of the ghat, a darker cheek
      c.fillStyle = haze('#9a5a44', v0); c.beginPath();
      quad(c, [P(UW - 0.01, v0, 0), P(UW - 0.01, v0, HS * 0.25), P(UP, v0, HS + 10), P(UP, v0, 0)]);
      c.fill();
    }, { t: 2.2 + j * 0.22, d: 0.9, reveal: 'wipeL', ease: 'inOut' });
  });
  // a dark line of wet stone at the waterline
  const wet = [];
  for (let v = VN; v < VF; v *= 1.08) wet.push(P(UW + 0.004, v, 0));
  p.strokes('steps', [wet], '#7a4a40', 3, { t: 4.4, d: 0.8, reveal: 'wipe' });
}

// ================================================================ the buildings along the top of the steps
function facade(b) {
  // local coordinates on the face: a runs 0 to 1 along the bank, h is height above the steps
  return (a, h) => P(UP - b.back, lerp(b.v0, b.v1, a), HS + h);
}
function ghats(p, r) {
  const blds = [];
  let v = 0.16;
  while (v < 22) {
    const len = r.range(0.22, 0.55) * (v < 1 ? 1 : 1 + (v - 1) * 0.05);
    const style = r.pick(['palace', 'palace', 'house', 'house', 'temple', 'tall']);
    const h = style === 'tall' ? r.range(1250, 1650) : style === 'palace' ? r.range(950, 1300) : style === 'temple' ? r.range(380, 520) : r.range(650, 950);
    blds.push({ v0: v, v1: v + len, h, style, back: r.range(0, 0.06), col: r.chance(0.45) ? r.pick(PAINTS) : r.pick(STONES), trim: r.pick(['#b8463a', '#c9772f', '#5f8a7a', '#efe4cf', '#9b3b4a']), seed: r() });
    v += len + (r.chance(0.2) ? r.range(0.02, 0.08) : 0);
  }
  // beyond, the rest of the bank as a hazy band of blocks to the vanishing point
  const far = [];
  for (let v = 22; v < VF; v *= 1.06) far.push([v, v * 1.06, 300 + ((v * 97) % 1) * 500]);
  p.group('ghats', { x: 900, y: 900, w: 110, h: 100 }, (c) => {
    c.fillStyle = mix('#d9a487', HAZE, 0.6); c.beginPath();
    for (const [a, b, h] of far) quad(c, [P(UP, a, HS), P(UP, b, HS), P(UP, b, HS + h * 2), P(UP, a, HS + h * 2)]);
    c.fill();
  }, { t: 2.6, d: 0.6, reveal: 'fade' });
  // far to near
  const list = [...blds].reverse();
  list.forEach((b, j) => {
    const F_ = facade(b);
    const corners = [F_(0, -20), F_(1, -20), F_(1, b.h + 40), F_(0, b.h + 40)];
    const xs = corners.map((q) => q[0]), ys = corners.map((q) => q[1]);
    const box = { x: Math.min(...xs) - 20, y: Math.min(...ys) - 30, w: Math.max(...xs) - Math.min(...xs) + 40, h: Math.max(...ys) - Math.min(...ys) + 40 };
    const vm = (b.v0 + b.v1) / 2, s = g.s(vm);
    const col = haze(b.col, vm), dk = haze(shade(b.col, 0.62), vm), trim = haze(b.trim, vm), win = haze('#5a2c2c', vm, 0.6);
    const lw = Math.max(0.4, 1.4 * s);
    p.group('ghats', box, (c) => {
      // the face
      c.fillStyle = col; c.beginPath(); quad(c, [F_(0, 0), F_(1, 0), F_(1, b.h), F_(0, b.h)]); c.fill();
      // the plinth: a darker base with deep arches, for the palaces
      if (b.style !== 'house') {
        const ph = Math.min(220, b.h * 0.24);
        c.fillStyle = dk; c.beginPath(); quad(c, [F_(0, 0), F_(1, 0), F_(1, ph), F_(0, ph)]); c.fill();
        const n = Math.max(2, Math.round((b.v1 - b.v0) / 0.08));
        c.fillStyle = haze('#3c1e22', vm, 0.6); c.beginPath();
        for (let k = 0; k < n; k++) {
          const a0 = (k + 0.25) / n, a1 = (k + 0.75) / n;
          quad(c, [F_(a0, 0), F_(a1, 0), F_(a1, ph * 0.6), F_((a0 + a1) / 2, ph * 0.85), F_(a0, ph * 0.6)]);
        }
        c.fill();
      }
      // floors: cornice lines, windows with pointed heads, balconies on the palaces
      const story = b.style === 'house' ? 110 : 125;
      const base = b.style === 'house' ? 30 : Math.min(220, b.h * 0.24) + 20;
      const rows = Math.floor((b.h - base - 40) / story);
      const cols = Math.max(1, Math.round((b.v1 - b.v0) / (b.style === 'house' ? 0.09 : 0.07)));
      c.strokeStyle = dk; c.lineWidth = lw * 1.6; c.beginPath();
      for (let i = 0; i <= rows; i++) { const [ax, ay] = F_(0, base + i * story - 8), [bx, by] = F_(1, base + i * story - 8); c.moveTo(ax, ay); c.lineTo(bx, by); }
      c.stroke();
      c.fillStyle = win; c.beginPath();
      for (let i = 0; i < rows; i++) for (let k = 0; k < cols; k++) {
        const z0 = base + i * story + 12, z1 = z0 + story * 0.5;
        const a0 = (k + 0.3) / cols, a1 = (k + 0.7) / cols;
        quad(c, [F_(a0, z0), F_(a1, z0), F_(a1, z1), F_((a0 + a1) / 2, z1 + story * 0.16), F_(a0, z1)]);
      }
      c.fill();
      if (b.style === 'palace' || b.style === 'tall') {
        // jharokha balconies: a projecting box with a curved canopy in the trim color
        c.fillStyle = trim; c.beginPath();
        for (let i = 1; i < rows; i += 2) for (let k = 0; k < cols; k += 2) {
          const z0 = base + i * story + 4, a0 = (k + 0.18) / cols, a1 = (k + 0.82) / cols;
          quad(c, [F_(a0, z0), F_(a1, z0), F_(a1, z0 + 14), F_(a0, z0 + 14)]);
          quad(c, [F_(a0, z0 + story * 0.68), F_(a1, z0 + story * 0.68), F_(a1 + 0.02, z0 + story * 0.8), F_((a0 + a1) / 2, z0 + story * 0.9), F_(a0 - 0.02, z0 + story * 0.8)]);
        }
        c.fill();
      }
      // the parapet: little merlons along the top, and a band of trim
      c.fillStyle = trim; c.beginPath(); quad(c, [F_(0, b.h - 16), F_(1, b.h - 16), F_(1, b.h - 4), F_(0, b.h - 4)]); c.fill();
      c.fillStyle = col; c.beginPath();
      const nm = Math.max(3, Math.round((b.v1 - b.v0) / 0.035));
      for (let k = 0; k < nm; k += 2) quad(c, [F_(k / nm, b.h), F_((k + 1) / nm, b.h), F_((k + 1) / nm, b.h + 18), F_(k / nm, b.h + 18)]);
      c.fill();
      // the near corner, an edge in shadow
      c.strokeStyle = dk; c.lineWidth = lw; c.beginPath(); quad(c, [F_(0, 0), F_(1, 0), F_(1, b.h), F_(0, b.h)]); c.stroke();
    }, { t: 2.9 + j * 0.11, d: 0.9, reveal: 'rise', ease: 'out' });
  });
  return blds;
}

// ================================================================ temple spires and domed pavilions
// a curved shikhara: ribbed, with a ribbed disc and a finial and a saffron pennant
function shikhara(c, x, y, w, h, col, o = {}) {
  const dk = shade(col, 0.7), lt = shade(col, 1.08);
  const outline = (cx, cy, ww, hh) => {
    c.moveTo(cx - ww / 2, cy);
    c.bezierCurveTo(cx - ww * 0.5, cy - hh * 0.4, cx - ww * 0.44, cy - hh * 0.86, cx - ww * 0.15, cy - hh);
    c.lineTo(cx + ww * 0.15, cy - hh);
    c.bezierCurveTo(cx + ww * 0.44, cy - hh * 0.86, cx + ww * 0.5, cy - hh * 0.4, cx + ww / 2, cy);
    c.closePath();
  };
  // two smaller spires clinging to the sides
  c.fillStyle = dk; c.beginPath(); outline(x - w * 0.36, y, w * 0.4, h * 0.5); outline(x - w * 0.26, y - h * 0.3, w * 0.3, h * 0.38); c.fill();
  c.fillStyle = col; c.beginPath(); outline(x + w * 0.36, y, w * 0.4, h * 0.5); outline(x + w * 0.26, y - h * 0.3, w * 0.3, h * 0.38); c.fill();
  // the main tower, its shaded left half
  c.fillStyle = col; c.beginPath(); outline(x, y, w, h); c.fill();
  c.save(); c.beginPath(); outline(x, y, w, h); c.clip();
  c.fillStyle = dk; c.fillRect(x - w, y - h - 4, w * 0.82, h + 8);
  c.fillStyle = lt; c.fillRect(x + w * 0.08, y - h - 4, w * 0.12, h + 8);
  // horizontal ribs
  c.strokeStyle = shade(col, 0.55); c.lineWidth = Math.max(0.5, w * 0.018); c.beginPath();
  for (let k = 1; k < 10; k++) { const yy = y - (h * k) / 10; c.moveTo(x - w, yy); c.lineTo(x + w, yy); }
  // vertical ribs following the curve
  for (const f of [-0.3, -0.12, 0.12, 0.3]) { c.moveTo(x + f * w, y); c.quadraticCurveTo(x + f * w * 1.05, y - h * 0.6, x + f * w * 0.45, y - h); }
  c.stroke();
  c.restore();
  // the ribbed disc, the pot and the finial
  const ty = y - h;
  c.fillStyle = col; c.beginPath(); c.ellipse(x, ty - w * 0.06, w * 0.27, w * 0.08, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = dk; c.lineWidth = Math.max(0.5, w * 0.012); c.stroke();
  c.fillStyle = GOLD; c.beginPath(); c.ellipse(x, ty - w * 0.18, w * 0.07, w * 0.07, 0, 0, Math.PI * 2); c.fill();
  c.fillRect(x - w * 0.012, ty - w * 0.42, w * 0.024, w * 0.26);
  if (o.flag !== false) {
    c.fillStyle = SAFFRON; c.beginPath();
    c.moveTo(x, ty - w * 0.42); c.lineTo(x + w * 0.34, ty - w * 0.36); c.lineTo(x, ty - w * 0.28); c.closePath(); c.fill();
  }
}
// a chhatri: four slim posts under a dome
function chhatri(c, x, y, w, col) {
  const dk = shade(col, 0.68);
  c.fillStyle = dk; c.fillRect(x - w * 0.55, y - w * 0.1, w * 1.1, w * 0.1);
  c.fillStyle = col;
  for (const k of [-0.42, -0.14, 0.14, 0.42]) c.fillRect(x + k * w - w * 0.04, y - w * 0.7, w * 0.08, w * 0.6);
  c.fillRect(x - w * 0.6, y - w * 0.8, w * 1.2, w * 0.1);
  c.beginPath(); c.ellipse(x, y - w * 0.8, w * 0.46, w * 0.5, 0, Math.PI, 0); c.fill();
  c.fillStyle = dk; c.beginPath(); c.ellipse(x - w * 0.12, y - w * 0.82, w * 0.25, w * 0.46, 0, Math.PI, Math.PI * 1.5); c.lineTo(x - w * 0.12, y - w * 0.82); c.fill();
  c.fillStyle = GOLD; c.fillRect(x - w * 0.02, y - w * 1.45, w * 0.04, w * 0.18);
}

function spires(p, r, blds) {
  // the temples, from far to near, and pavilions on the corners of the palaces
  const marks = [];
  for (const b of blds) {
    const vm = (b.v0 + b.v1) / 2, s = g.s(vm);
    const [x, y] = P(UP - b.back, vm, HS + b.h);
    if (b.style === 'temple') {
      const w = 330 * s, h = w * r.range(2.0, 2.5);
      marks.push({ v: vm, x, y, w, h, kind: 'shikhara', col: haze(r.pick(['#e9c79a', '#d98d5c', '#f1e0c2', '#cc7a4f']), vm) });
    } else if (b.style === 'palace' && r.chance(0.7)) {
      for (const a of [0.12, 0.88]) {
        const [cx, cy] = P(UP - b.back, lerp(b.v0, b.v1, a), HS + b.h + 18);
        marks.push({ v: vm, x: cx, y: cy, w: 110 * s, kind: 'chhatri', col: haze(shade(b.col, 1.05), vm) });
      }
    } else if (b.style === 'tall' && r.chance(0.5)) {
      marks.push({ v: vm, x, y, w: 200 * s, h: 200 * s * 1.9, kind: 'shikhara', col: haze('#f1e0c2', vm), small: true });
    }
  }
  marks.sort((a, b) => b.v - a.v);
  marks.forEach((m, j) => {
    const box = m.kind === 'shikhara'
      ? { x: m.x - m.w * 0.8, y: m.y - m.h - m.w * 0.6, w: m.w * 1.6 + 4, h: m.h + m.w * 0.6 + 6 }
      : { x: m.x - m.w * 0.7, y: m.y - m.w * 1.5, w: m.w * 1.4, h: m.w * 1.6 };
    p.group('spires', box, (c) => {
      if (m.kind === 'shikhara') {
        // a stepped base under the spire
        c.fillStyle = shade(m.col, 0.82); c.fillRect(m.x - m.w * 0.62, m.y - m.w * 0.04, m.w * 1.24, m.w * 0.08);
        shikhara(c, m.x, m.y - m.w * 0.04, m.w, m.h, m.col);
      } else chhatri(c, m.x, m.y, m.w, m.col);
    }, { t: 4.6 + j * 0.09, d: 0.8, reveal: 'rise', ease: 'out' });
  });
}

// ================================================================ umbrellas, bathers and pennants on the steps
function onSteps(p, r) {
  const items = [];
  for (let i = 0; i < 46; i++) {
    const v = Math.exp(r.range(Math.log(0.3), Math.log(9)));
    const st = r.int(1, NSTEP - 2), u = lerp(UW, UP, (st + 0.5) / NSTEP), z = HS * (st + 1) / NSTEP;
    items.push({ kind: 'umbrella', v, u, z, col: r.pick(['#d9b060', '#c99a4a', '#e2c178']) });
  }
  for (let i = 0; i < 190; i++) {
    const v = Math.exp(r.range(Math.log(0.25), Math.log(12)));
    const st = r.int(0, NSTEP - 1), u = lerp(UW, UP, (st + 0.5) / NSTEP), z = HS * (st + 1) / NSTEP;
    items.push({ kind: 'person', v, u, z, col: r.pick([SAFFRON, '#f4ead6', '#e05a6a', '#f2c53a', '#f4ead6', '#d23a2a', '#6aa0c8']), sit: r.chance(0.4) });
  }
  for (let i = 0; i < 14; i++) {
    const v = Math.exp(r.range(Math.log(0.4), Math.log(8)));
    items.push({ kind: 'pole', v, u: UP + 0.01, z: HS, col: r.pick([SAFFRON, '#e04a3a', MARI]) });
  }
  items.sort((a, b) => b.v - a.v || a.u - b.u);
  // in four passes, far to near, so they gather along the bank
  const sets = [[], [], [], []];
  items.forEach((it) => { sets[it.v > 4 ? 0 : it.v > 1.6 ? 1 : it.v > 0.8 ? 2 : 3].push(it); });
  sets.forEach((set, k) => {
    p.group('onsteps', { x: X0, y: 300, w: 1000, h: Y1 - 300 }, (c) => {
      for (const it of set) {
        const s = g.s(it.v), [x, y] = P(it.u, it.v, it.z);
        if (it.kind === 'umbrella') {
          const hgt = 95 * s, rx = 68 * s, ry = 19 * s;
          c.fillStyle = haze('#6b4a30', it.v); c.fillRect(x - 1.2 * s, y - hgt, 2.4 * s, hgt);
          c.fillStyle = haze(it.col, it.v); c.beginPath(); c.ellipse(x, y - hgt, rx, ry, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = haze(shade(it.col, 0.72), it.v); c.beginPath(); c.ellipse(x, y - hgt + ry * 0.35, rx, ry * 0.65, 0, 0, Math.PI); c.fill();
          c.strokeStyle = haze(shade(it.col, 0.6), it.v); c.lineWidth = Math.max(0.4, s); c.beginPath();
          for (let k2 = 0; k2 < 10; k2++) { const a = (k2 / 10) * Math.PI * 2; c.moveTo(x, y - hgt - ry * 0.2); c.lineTo(x + Math.cos(a) * rx, y - hgt + Math.sin(a) * ry); }
          c.stroke();
        } else if (it.kind === 'person') {
          const h = (it.sit ? 30 : 48) * s, w = 11 * s;
          c.fillStyle = haze(it.col, it.v); c.beginPath(); c.ellipse(x, y - h * 0.45, w * 0.6, h * 0.48, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = haze('#5a3324', it.v); c.beginPath(); c.arc(x, y - h - w * 0.35, w * 0.42, 0, Math.PI * 2); c.fill();
        } else {
          const hgt = 260 * s;
          c.fillStyle = haze('#7a5030', it.v); c.fillRect(x - 1.5 * s, y - hgt, 3 * s, hgt);
          c.fillStyle = haze(it.col, it.v); c.beginPath(); c.moveTo(x, y - hgt); c.lineTo(x + 60 * s, y - hgt + 14 * s); c.lineTo(x, y - hgt + 30 * s); c.closePath(); c.fill();
        }
      }
    }, { t: 6.0 + k * 0.45, d: 0.8, reveal: 'fade' });
  });
}

// ================================================================ the river: the sun's column, ripples, the leaning temple
function river(p, r) {
  const [sx] = SUN;
  // the sun's light broken on the water in a column that widens toward us
  const dashes = [];
  for (let y = g.hy + 4; y < Y1; y += 4 + (y - g.hy) * 0.03) {
    const half = 18 + (y - g.hy) * 0.32;
    const n = 1 + Math.floor((y - g.hy) / 120);
    for (let k = 0; k < n + 1; k++) {
      const x = sx + r.range(-half, half), l = r.range(10, 40) * (0.5 + (y - g.hy) / 400);
      dashes.push([[x - l / 2, y], [x + l / 2, y]]);
    }
  }
  p.strokes('river', dashes, 'rgba(255,224,150,.85)', 3, { t: 3.2, d: 1.2, reveal: 'fall', cap: 'round' });
  // ripples over the whole river, longer near us
  const lines = waveLines(r, g, { y0: g.hy + 6, y1: Y1, x0: 250, x1: X1, density: 0.7, skip: (x, y) => x < P(UW, g.vAt(y), 0)[0] + 10 });
  p.strokes('river', lines, 'rgba(255,240,220,.45)', 1.6, { t: 3.6, d: 1.2, reveal: 'wipe' });
  p.strokes('river', lines.filter((l, i) => i % 3 === 0).map((l) => l.map(([x, y]) => [x + 6, y + 3])), 'rgba(110,80,120,.35)', 1.6, { t: 3.8, d: 1.2, reveal: 'wipe' });
  // reflections of the steps and buildings: warm vertical smears along the edge
  const refl = [];
  for (let v = 0.5; v < 9; v *= 1.05) {
    const [x, y] = P(UW + 0.02, v, 0), s = g.s(v);
    refl.push([[x + r.range(0, 30) * s, y + 6 * s], [x + r.range(30, 120) * s, y + 6 * s]]);
    refl.push([[x + r.range(0, 20) * s, y + 14 * s], [x + r.range(20, 70) * s, y + 14 * s]]);
  }
  p.strokes('river', refl, 'rgba(225,150,100,.55)', 2.4, { t: 4.8, d: 0.9, reveal: 'fade' });

  // the leaning Ratneshwar temple, standing in the river off the steps
  const v = 1.9, s = g.s(v), [tx, ty] = P(-0.82, v, 0);
  const w = 250 * s, h = w * 2.1;
  p.group('river', { x: tx - w * 2, y: ty - h - w * 1.2, w: w * 4, h: h + w * 2 + 90 * s }, (c) => {
    // its reflection, broken
    c.save(); c.globalAlpha = 0.35;
    c.fillStyle = '#b07060';
    for (let k = 0; k < 9; k++) c.fillRect(tx - w * 0.6 + k * 2 * s + (k % 2) * 6 * s, ty + 6 * s + k * 9 * s, w * (1.2 - k * 0.1), 5 * s);
    c.restore();
    c.save();
    c.translate(tx, ty); c.rotate(-0.13); c.translate(-tx, -ty);
    // the drowned base: a square shrine with a door, half under the water
    const col = '#d9a478';
    c.fillStyle = col; c.fillRect(tx - w * 0.6, ty - w * 0.7, w * 1.2, w * 0.7 + 6);
    c.fillStyle = shade(col, 0.68); c.fillRect(tx - w * 0.6, ty - w * 0.7, w * 0.4, w * 0.7 + 6);
    c.fillStyle = '#4a2526'; c.beginPath(); c.moveTo(tx - w * 0.12, ty); c.lineTo(tx - w * 0.12, ty - w * 0.4); c.quadraticCurveTo(tx, ty - w * 0.55, tx + w * 0.12, ty - w * 0.4); c.lineTo(tx + w * 0.12, ty); c.fill();
    c.fillStyle = shade(col, 0.82); c.fillRect(tx - w * 0.68, ty - w * 0.78, w * 1.36, w * 0.1);
    shikhara(c, tx, ty - w * 0.78, w, h, col);
    c.restore();
    // the water lapping round its foot
    c.fillStyle = 'rgba(190,140,150,.9)'; c.fillRect(tx - w * 0.9, ty - 2, w * 1.9, 10 * s);
    c.strokeStyle = 'rgba(255,240,220,.7)'; c.lineWidth = 1.6; c.beginPath();
    c.moveTo(tx - w * 0.9, ty - 2); c.lineTo(tx + w * 0.95, ty - 2); c.stroke();
  }, { t: 5.4, d: 1.1, reveal: 'rise', ease: 'out' });
}

// ================================================================ boats and lamps
function boat(c, x, y, s, o) {
  const L = o.len * s, dir = o.dir || 1;
  // hull: a long crescent, painted band along the gunwale
  c.fillStyle = o.hull;
  c.beginPath();
  c.moveTo(x - L / 2, y - 22 * s); c.quadraticCurveTo(x - L * 0.42, y + 4 * s, x - L * 0.3, y + 6 * s);
  c.lineTo(x + L * 0.3, y + 6 * s); c.quadraticCurveTo(x + L * 0.42, y + 4 * s, x + L / 2, y - 22 * s);
  c.quadraticCurveTo(x, y - 6 * s, x - L / 2, y - 22 * s); c.fill();
  c.strokeStyle = o.band; c.lineWidth = 4 * s; c.beginPath();
  c.moveTo(x - L * 0.47, y - 17 * s); c.quadraticCurveTo(x, y - 2 * s, x + L * 0.47, y - 17 * s); c.stroke();
  if (o.canopy) {
    // an arched canopy on four posts
    c.fillStyle = o.canopy;
    c.beginPath(); c.moveTo(x - L * 0.22, y - 12 * s); c.lineTo(x - L * 0.22, y - 56 * s);
    c.quadraticCurveTo(x, y - 84 * s, x + L * 0.22, y - 56 * s); c.lineTo(x + L * 0.22, y - 12 * s);
    c.lineTo(x + L * 0.18, y - 12 * s); c.lineTo(x + L * 0.18, y - 50 * s); c.quadraticCurveTo(x, y - 72 * s, x - L * 0.18, y - 50 * s); c.lineTo(x - L * 0.18, y - 12 * s); c.closePath(); c.fill();
    c.fillStyle = shade(o.canopy, 0.75); c.beginPath(); c.moveTo(x - L * 0.22, y - 56 * s); c.quadraticCurveTo(x, y - 84 * s, x + L * 0.22, y - 56 * s); c.lineTo(x + L * 0.22, y - 50 * s); c.quadraticCurveTo(x, y - 76 * s, x - L * 0.22, y - 50 * s); c.fill();
  }
  if (o.rower) {
    // a boatman standing at the stern with a long oar
    const rx = x + dir * L * 0.36;
    c.strokeStyle = '#4a2a1a'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(rx - dir * 30 * s, y - 76 * s); c.lineTo(rx + dir * 50 * s, y + 26 * s); c.stroke();
    c.fillStyle = o.rower; c.beginPath(); c.ellipse(rx, y - 44 * s, 8 * s, 24 * s, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5a3324'; c.beginPath(); c.arc(rx, y - 74 * s, 6 * s, 0, Math.PI * 2); c.fill();
  }
  // the hull's dark reflection
  c.fillStyle = 'rgba(70,40,60,.28)'; c.fillRect(x - L * 0.32, y + 8 * s, L * 0.64, 5 * s); c.fillRect(x - L * 0.22, y + 16 * s, L * 0.44, 3 * s);
}

const LAMPS = [];
function boats(p, r) {
  const list = [
    { u: -0.78, v: 2.6, len: 220, hull: '#6b3f2a', band: '#2f8a86', canopy: '#d8463a' },
    { u: -0.55, v: 5.2, len: 200, hull: '#5a3a2a', band: '#e2b13c', canopy: '#f2e3c2' },
    { u: -0.3, v: 3.4, len: 230, hull: '#6b3f2a', band: '#c43a2a', canopy: '#2f8a86', rower: '#f4ead6' },
    { u: 0.2, v: 7.5, len: 200, hull: '#5a3a2a', band: '#2f8a86' },
    { u: -0.62, v: 1.5, len: 210, hull: '#7a4a30', band: '#e2b13c', rower: SAFFRON, dir: -1 },
    { u: 0.55, v: 4.2, len: 220, hull: '#6b3f2a', band: '#d8463a', canopy: '#f0b43c' },
    { u: 0.15, v: 0.35, len: 300, hull: '#5c3424', band: '#2f8a86', canopy: '#c8343a', rower: '#f4ead6', dir: -1 },
  ];
  list.sort((a, b) => b.v - a.v);
  list.forEach((b, i) => {
    const s = g.s(b.v), [x, y] = P(b.u, b.v, 0), L = b.len * s;
    p.group('boats', { x: x - L * 0.6 - 60 * s, y: y - 100 * s, w: L * 1.2 + 120 * s, h: 140 * s }, (c) => boat(c, x, y, s, b),
      { t: 6.8 + i * 0.22, d: 0.9, reveal: 'slide', dx: (b.dir || 1) * -60 * s, ease: 'out' });
  });
  // lamps floating: a leaf cup and a small flame, more near the steps
  for (let i = 0; i < 46; i++) {
    const v = Math.exp(r.range(Math.log(0.25), Math.log(6))), u = UW + 0.05 + Math.abs(r.gauss()) * 0.9;
    const [x, y] = P(u, v, 0);
    if (x > X1 - 10) continue;
    LAMPS.push([x, y, g.s(v), r.range(0, 6)]);
  }
  p.group('boats', { x: X0, y: g.hy, w: X1 - X0, h: Y1 - g.hy }, (c) => {
    for (const [x, y, s] of LAMPS) {
      c.fillStyle = '#3f6a32'; c.beginPath(); c.ellipse(x, y, 13 * s, 4.5 * s, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = MARI; c.beginPath(); c.arc(x - 5 * s, y - 2 * s, 3 * s, 0, Math.PI * 2); c.arc(x + 5 * s, y - 2 * s, 3 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,210,120,.5)'; c.fillRect(x - 2 * s, y + 4 * s, 4 * s, 16 * s);
    }
  }, { t: 8.0, d: 1.0, reveal: 'fade' });
}

// ================================================================ what moves
function life(p, r) {
  // the lamps' flames flicker
  p.live('live', {
    t: 8.6, d: 1.0, reveal: 'fade', box: { x: X0, y: g.hy, w: X1 - X0, h: Y1 - g.hy },
    draw: (c, time) => {
      c.fillStyle = 'rgba(255,200,90,.35)'; c.beginPath();
      for (const [x, y, s, ph] of LAMPS) { const k = 1 + 0.25 * Math.sin(time * 7 + ph * 3); c.moveTo(x + 12 * s * k, y - 8 * s); c.arc(x, y - 8 * s, 12 * s * k, 0, Math.PI * 2); }
      c.fill();
      c.fillStyle = '#ffe9a0'; c.beginPath();
      for (const [x, y, s, ph] of LAMPS) {
        const k = 1 + 0.2 * Math.sin(time * 9 + ph * 5), fh = 12 * s * k;
        c.moveTo(x, y - 3 * s - fh); c.quadraticCurveTo(x + 4 * s, y - 4 * s, x, y - 2 * s); c.quadraticCurveTo(x - 4 * s, y - 4 * s, x, y - 3 * s - fh);
      }
      c.fill();
    },
  });
  // the sun's column shimmers
  const sh = [];
  for (let i = 0; i < 22; i++) { const y = g.hy + 10 + i * 24; sh.push([y, 18 + (y - g.hy) * 0.3, i * 1.7]); }
  p.live('live', {
    t: 9.0, d: 1.0, reveal: 'fade', box: { x: SUN[0] - 260, y: g.hy, w: 520, h: Y1 - g.hy },
    draw: (c, time) => {
      c.fillStyle = 'rgba(255,246,200,.8)';
      for (const [y, half, ph] of sh) {
        const x = SUN[0] + Math.sin(time * 0.8 + ph) * half * 0.8, l = 12 + (y - g.hy) * 0.08;
        c.fillRect(x - l / 2, y, l, 2.4);
      }
    },
  });
  // a small boat rowed slowly across the river
  p.live('live', {
    t: 9.4, d: 1.0, reveal: 'fade', box: { x: 600, y: 1080, w: 1000, h: 90 },
    draw: (c, time) => {
      const v = 2.0, s = g.s(v), u = -0.4 + (time - 9.4) * 0.012, [x, y] = P(u, v, 0);
      boat(c, x, y + Math.sin(time * 1.4) * 1.2, s, { len: 180, hull: '#6b3f2a', band: MARI, rower: '#e05a6a', dir: -1 });
    },
  });
  // birds crossing the sky in a loose line
  const birds = [];
  for (let i = 0; i < 8; i++) birds.push([i * 34 + r.range(-8, 8), (i % 2) * 16 + r.range(-6, 6), r.range(0, 6), r.range(0.8, 1.2)]);
  p.live('live', {
    t: 9.8, d: 1.0, reveal: 'fade', box: { x: X0, y: 250, w: X1 - X0, h: 320 },
    draw: (c, time) => {
      const x0 = 1200 - (time - 9.8) * 20, y0 = 420 - (time - 9.8) * 3;
      for (const [dx, dy, ph, s] of birds) gull(c, x0 + dx, y0 + dy, 1.3 * s, (Math.sin(time * 6 + ph) + 1) / 2, '#5a3346');
    },
  });
}

// ================================================================ marigold garlands across the top
function garland(p) {
  const hangs = [X0, 380, 660, 940, 1220, X1];
  const beads = [], leaves = [], tassels = [];
  for (let k = 0; k < hangs.length - 1; k++) {
    const a = hangs[k], b = hangs[k + 1], sag = 92;
    const n = Math.round((b - a) / 17);
    for (let i = 0; i <= n; i++) { const t = i / n; beads.push([lerp(a, b, t), Y0 + 10 + sag * Math.sin(Math.PI * t), (i + k) % 2]); }
  }
  for (const x of hangs) {
    leaves.push([x, Y0 + 12]);
    for (let i = 0; i < 7; i++) tassels.push([x + Math.sin(i * 0.6) * 2, Y0 + 30 + i * 18, i % 2]);
  }
  const bead = (c, x, y, kind, rr = 12) => {
    c.fillStyle = kind ? MARI : SAFFRON; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill();
    // ruffled petals: a ring of small darker scallops and a lighter heart
    c.fillStyle = kind ? '#d8901a' : '#c9620f'; c.beginPath();
    for (let j = 0; j < 8; j++) { const a = (j / 8) * Math.PI * 2; c.moveTo(x + Math.cos(a) * rr * 0.75 + 2.2, y + Math.sin(a) * rr * 0.75); c.arc(x + Math.cos(a) * rr * 0.75, y + Math.sin(a) * rr * 0.75, 2.2, 0, Math.PI * 2); }
    c.fill();
    c.fillStyle = kind ? '#ffd860' : '#ffa53a'; c.beginPath(); c.arc(x - rr * 0.15, y - rr * 0.2, rr * 0.38, 0, Math.PI * 2); c.fill();
  };
  // each swag drops in its turn
  for (let k = 0; k < hangs.length - 1; k++) {
    const a = hangs[k], b = hangs[k + 1], set = beads.filter(([x]) => x >= a && x <= b);
    p.group('garland', { x: a - 16, y: Y0 - 10, w: b - a + 32, h: 130 }, (c) => { for (const [x, y, kind] of set) bead(c, x, y, kind); },
      { t: 8.6 + k * 0.18, d: 0.8, reveal: 'drop', dy: 40, ease: 'back' });
  }
  p.group('garland', { x: X0 - 30, y: Y0 - 10, w: X1 - X0 + 60, h: 200 }, (c) => {
    for (const [x, y, kind] of tassels) bead(c, x, y, kind, 10);
    // a small cluster of mango leaves at every hanging point
    for (const [x, y] of leaves) {
      for (const [a, l] of [[-0.6, 34], [0.6, 34], [-1.4, 28], [1.4, 28]]) {
        c.save(); c.translate(x, y); c.rotate(a);
        c.fillStyle = LEAF; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(8, l * 0.5, 0, l); c.quadraticCurveTo(-8, l * 0.5, 0, 0); c.fill();
        c.strokeStyle = LEAF_D; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 2); c.lineTo(0, l - 3); c.stroke();
        c.restore();
      }
      bead(c, x, y + 4, 0, 13);
    }
  }, { t: 9.6, d: 0.7, reveal: 'fall' });
}

// ================================================================ the name
// Devanagari a syllable at a time, so each vowel sign stays with its letter
function devaType(p, layer, str, cx, y, o) {
  const m = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  const font = `400 ${o.size}px ${F}`;
  m.font = font;
  const segs = typeof Intl !== 'undefined' && Intl.Segmenter
    ? [...new Intl.Segmenter('hi', { granularity: 'grapheme' }).segment(str)].map((s) => s.segment)
    : [...str];
  const total = m.measureText(str).width, x0 = cx - total / 2;
  let pre = '';
  segs.forEach((gph, i) => {
    const gx = x0 + m.measureText(pre).width, gw = m.measureText(gph).width;
    pre += gph;
    p.mark(layer, {
      t: o.t + i * o.gap, d: o.d, reveal: 'press', ease: 'out',
      box: { x: gx - o.size * 0.25, y: y - o.size * 1.2, w: gw + o.size * 0.5, h: o.size * 1.7 },
      draw: (c) => {
        c.font = font; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillStyle = MAROON_D; c.fillText(gph, gx + 5, y + 5);
        c.fillStyle = GOLD; c.fillText(gph, gx, y);
      },
    });
  });
  return total;
}

function title(p) {
  const w = devaType(p, 'title', DEVA, W / 2, 1795, { size: 196, t: 10.6, gap: 0.3, d: 0.9 });
  // a gold rule either side of the line beneath, with flowers at its ends
  p.group('title', { x: 120, y: 1830, w: W - 240, h: 70 }, (c) => {
    c.fillStyle = GOLD;
    c.fillRect(200, 1866, 380, 2); c.fillRect(W - 580, 1866, 380, 2);
    rosette(c, 180, 1867, 16, GOLD, GOLD_D); rosette(c, W - 180, 1867, 16, GOLD, GOLD_D);
  }, { t: 12.0, d: 0.9, reveal: 'iris', ease: 'inOut' });
  p.type('title', 'VARANASI', W / 2, 1882, { family: F, size: 44, color: CREAM, align: 'center', track: 0.42, t: 12.2, gap: 0.07, d: 0.5 });
  p.type('title', 'THE GHATS AT DAWN', W / 2, 1928, { family: F, size: 22, color: GOLD, align: 'center', track: 0.3, t: 12.9, gap: 0.02, d: 0.4, reveal: 'fade' });
  // marigold heads either side of the name
  p.group('title', { x: 100, y: 1600, w: W - 200, h: 240 }, (c) => {
    for (const [x, y, s] of [[W / 2 - w / 2 - 110, 1720, 30], [W / 2 + w / 2 + 110, 1720, 30], [W / 2 - w / 2 - 170, 1760, 18], [W / 2 + w / 2 + 170, 1760, 18]]) {
      c.fillStyle = SAFFRON; c.beginPath();
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; c.moveTo(x + Math.cos(a) * s * 0.75 + s * 0.32, y + Math.sin(a) * s * 0.75); c.arc(x + Math.cos(a) * s * 0.75, y + Math.sin(a) * s * 0.75, s * 0.32, 0, Math.PI * 2); }
      c.fill();
      c.fillStyle = MARI; c.beginPath(); c.arc(x, y, s * 0.62, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c9620f'; c.beginPath(); c.arc(x, y, s * 0.22, 0, Math.PI * 2); c.fill();
    }
  }, { t: 11.8, d: 0.7, reveal: 'pop' });
}
