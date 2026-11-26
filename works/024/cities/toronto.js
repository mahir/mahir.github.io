// Toronto: a modernist lakefront poster, seen from the Toronto Islands on an
// October afternoon. Flat inks laid over one another like a screenprint: the
// skyline across the lake with the CN Tower rising through the name, the ballpark's
// dome at its foot, the black towers, the white one and the red granite
// one of the financial district, the gold glass of a bank tower. Sailboats and
// the island ferry on the water; on the near shore the islands' lawn, two
// Muskoka chairs facing the city, geese, and maples in full autumn color.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, lerp, clamp, poly, rng } from '../kit.js';

const PAPER = '#f1e9d8';
const NAVY = '#1f2b44', RED = '#c8402a', ORANGE = '#e2702b', GOLD = '#eba937', CREAM = '#f6efe0';
const SKY = '#cfe1de', SKY2 = '#e6ebdc', LAKE = '#2d6488', LAKE2 = '#4c86a3', LAKE3 = '#7fb0c2';
const CONC = '#d9d3c4', CONC_D = '#aea697', GLASS = '#7d99a6', GLASS_D = '#5a7887';
const LAWN = '#a3a95a', LAWN_D = '#868f45', BARK = '#4a3526';

export const city = {
  id: 'toronto', name: 'Toronto',
  alt: "A modernist screenprint of Toronto's skyline across the lake from the Toronto Islands in autumn: the CN Tower rising through the name, the domed stadium, the black, white, red and gold towers of the financial district, sailboats and the island ferry on the water, and on the near shore a lawn with two Muskoka chairs, geese and red and orange maples",
  google: 'family=DM+Serif+Display:ital@0;1',
  wall: '#1d2a3a',
  fonts: [['400 100px "DM Serif Display"', 'TORONTO'], ['italic 400 40px "DM Serif Display"', 'Lake Ontario · from the Islands']],
  build,
};

const M = 60, PB = 1860; // the margin; the picture's foot
const SH = 1010; // the far shore, where the city meets the water
const LK = 1440; // the near shore, the islands
const TX = 600; // the CN Tower

function build() {
  const p = new Plate({ paper: PAPER, seed: 1976 });
  const r = p.r;
  p.clip = { x: M, y: M, w: W - 2 * M, h: PB - M };
  p.stack('sky', 'title', 'haze', 'city', 'tower', 'shore', 'lake', 'boats', 'island', 'trees', 'live', 'foot');
  p.layer('foot', { clip: false });

  sky(p, r);
  skyline(p, r);
  tower(p);
  lake(p, r);
  island(p, r);
  maples(p, r);
  lives(p, r);
  title(p);
  return p;
}

function shape(c, pts) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }
// an ink laid over what is under it, as a screenprint does
function over(c, fn) { c.save(); c.globalCompositeOperation = 'multiply'; fn(); c.restore(); }

// ================================================================ the sky: flat, pale, with long pill-shaped clouds
function sky(p, r) {
  p.group('sky', { x: M, y: M, w: W - 2 * M, h: SH - M + 10 }, (c) => {
    c.fillStyle = SKY; c.fillRect(M, M, W - 2 * M, SH - M + 10);
    c.fillStyle = SKY2; c.fillRect(M, 640, W - 2 * M, SH - 630);
    c.fillStyle = '#eef0e2'; c.fillRect(M, 840, W - 2 * M, SH - 830);
  }, { t: 0.1, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // a screen of fine rules over the top of the sky
  const rules = [];
  for (let y = M + 8, k = 0; y < 640; k++, y += 9 + k * 0.5) rules.push([[M, y], [W - M, y]]);
  p.strokes('sky', rules, 'rgba(255,255,255,0.45)', 1.6, { t: 0.5, d: 1.0, reveal: 'fall', box: { x: M, y: M, w: W - 2 * M, h: 600 } });
  const pills = [[180, 430, 380, 34], [1050, 380, 420, 40], [880, 560, 300, 24], [300, 640, 240, 20], [1240, 690, 230, 18]];
  pills.forEach(([x, y, w, h], i) => {
    p.group('sky', { x: x - 8, y: y - h / 2 - 8, w: w + 24, h: h + 20 }, (c) => {
      over(c, () => { c.fillStyle = '#b9cfd0'; c.beginPath(); c.roundRect(x + 10, y - h / 2 + 7, w, h, h / 2); c.fill(); });
      c.fillStyle = '#fbf7ee'; c.beginPath(); c.roundRect(x, y - h / 2, w, h, h / 2); c.fill();
    }, { t: 0.8 + i * 0.2, d: 0.8, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ================================================================ the skyline
// towers are laid in three passes: a pale far row, the condos either side, the downtown
function slab(c, t) {
  const { x, w, top, col } = t, foot = SH + 2;
  c.fillStyle = col; c.fillRect(x, top, w, foot - top);
  // the shaded side, overprinted
  over(c, () => { c.fillStyle = t.shade || 'rgba(90,100,120,0.35)'; c.fillRect(x + w * (t.lit ?? 0.62), top, w * (1 - (t.lit ?? 0.62)), foot - top); });
  // floors and mullions, as fine rules
  c.fillStyle = t.line || 'rgba(31,43,68,0.22)';
  const fs = t.floor || 7;
  if (t.mull) for (let xx = x + t.mull; xx < x + w - 1; xx += t.mull) c.fillRect(xx, top + 4, 1, foot - top - 4);
  if (fs > 0) for (let y = top + fs; y < foot; y += fs) c.fillRect(x, y, w, 1);
  if (t.cap) { c.fillStyle = t.cap; c.fillRect(x - 2, top - 5, w + 4, 6); }
}
function skyline(p, r) {
  const rr = rng(416);
  // the far row: low pale glass, almost the sky's color
  const farRow = [];
  for (let x = M; x < W - M; x += rr.range(26, 50)) farRow.push({ x, w: rr.range(24, 46), top: SH - rr.range(60, 240), col: '#b8cbcc', floor: 0, shade: 'rgba(120,140,150,0.18)' });
  p.group('haze', { x: M, y: SH - 260, w: W - 2 * M, h: 264 }, (c) => { for (const t of farRow) slab(c, t); }, { t: 1.0, d: 0.9, reveal: 'rise' });
  // the condos: glass slabs, teal and gray, some with balconies striping them
  const condos = [];
  for (let x = M - 10; x < W - M; x += rr.range(30, 60)) {
    const nearTower = x > 360 && x < 1340;
    const h = nearTower ? rr.range(160, 330) : rr.range(200, 420);
    condos.push({ x, w: rr.range(34, 58), top: SH - h, col: rr.pick([GLASS, '#8fb0b4', '#a9b9b8', '#6f8e9c', '#c2c6bc']), floor: rr.pick([5, 6, 0]), mull: rr.pick([0, 6, 8]), line: 'rgba(31,43,68,0.18)', lit: rr.range(0.5, 0.7) });
  }
  condos.sort((a, b) => a.top - b.top);
  for (let g = 0; g < 3; g++) {
    const set = condos.filter((_, i) => i % 3 === g);
    p.group('city', { x: M - 20, y: SH - 430, w: W - 2 * M + 40, h: 434 }, (c) => {
      for (const t of set) {
        slab(c, t);
        // balconies: short white bars on some
        if (t.floor === 5) { c.fillStyle = 'rgba(246,239,224,0.6)'; for (let y = t.top + 4; y < SH; y += 10) c.fillRect(t.x + 2, y, t.w * 0.45, 2); }
      }
    }, { t: 1.5 + g * 0.3, d: 1.0, reveal: 'rise' });
  }
  // the financial district, in front: named shapes in strong inks
  const towers = [
    { x: 1185, w: 62, top: 520, col: '#9fb3bb', floor: 6, mull: 6, kind: 'plain' },              // a pale glass tower with a bevelled top
    { x: 715, w: 58, top: 690, col: GOLD, floor: 0, kind: 'gold' },                                 // gold glass, sawtoothed
    { x: 760, w: 72, top: 575, col: '#2a2f38', floor: 6, mull: 7, line: 'rgba(235,169,55,0.22)', kind: 'black' }, // the black towers
    { x: 1048, w: 64, top: 600, col: '#2a2f38', floor: 6, mull: 7, line: 'rgba(235,169,55,0.22)', kind: 'black' },
    { x: 1120, w: 58, top: 545, col: '#d8d4ca', floor: 5, mull: 5, kind: 'plain' },
    { x: 970, w: 80, top: 490, col: '#b24a35', floor: 6, mull: 8, line: 'rgba(31,20,15,0.25)', kind: 'notch' }, // red granite, notched
    { x: 872, w: 86, top: 452, col: '#ece9df', floor: 7, mull: 4, line: 'rgba(31,43,68,0.16)', kind: 'white' }, // the white one, tallest
    { x: 830, w: 44, top: 640, col: '#7d8d94', floor: 6, mull: 6, kind: 'plain' },
    { x: 1250, w: 48, top: 660, col: '#596b76', floor: 6, mull: 5, kind: 'plain' },
  ];
  towers.forEach((t, i) => {
    p.group('city', { x: t.x - 12, y: t.top - 60, w: t.w + 24, h: SH - t.top + 64 }, (c) => {
      if (t.kind === 'gold') {
        // two gold triangles in plan read as a sawtooth face: bright and dark strips
        c.fillStyle = t.col; c.fillRect(t.x, t.top, t.w, SH - t.top);
        over(c, () => { c.fillStyle = 'rgba(160,100,30,0.55)'; for (let k = 0; k < 4; k++) c.fillRect(t.x + k * t.w / 4 + t.w / 8, t.top, t.w / 8, SH - t.top); });
        c.fillStyle = 'rgba(255,240,200,0.5)'; for (let y = t.top + 6; y < SH; y += 6) c.fillRect(t.x, y, t.w, 1);
        c.fillStyle = t.col; c.beginPath(); c.moveTo(t.x, t.top); c.lineTo(t.x + t.w * 0.25, t.top - 14); c.lineTo(t.x + t.w * 0.5, t.top); c.lineTo(t.x + t.w * 0.75, t.top - 14); c.lineTo(t.x + t.w, t.top); c.fill();
      } else {
        slab(c, t);
        if (t.kind === 'notch') {
          // the chevron notches climbing the top
          c.fillStyle = SKY; for (const sd of [0, 1]) { const x = sd ? t.x + t.w : t.x; c.beginPath(); c.moveTo(x, t.top - 1); c.lineTo(x + (sd ? -16 : 16), t.top - 1); c.lineTo(x, t.top + 30); c.fill(); }
          c.fillStyle = '#8f3626'; c.fillRect(t.x + t.w * 0.5 - 3, t.top - 18, 6, 18);
        }
        if (t.kind === 'white') {
          c.fillStyle = '#ece9df'; c.fillRect(t.x + 8, t.top - 14, t.w - 16, 14);
          c.fillStyle = NAVY; c.fillRect(t.x + t.w * 0.5 - 1, t.top - 46, 2, 32);
        }
        if (t.kind === 'black') { c.fillStyle = '#2a2f38'; c.fillRect(t.x - 3, t.top - 6, t.w + 6, 8); }
        if (t.kind === 'plain' && i === 0) { c.fillStyle = SKY; c.beginPath(); c.moveTo(t.x + t.w * 0.4, t.top - 1); c.lineTo(t.x + t.w + 1, t.top - 1); c.lineTo(t.x + t.w + 1, t.top + 26); c.fill(); }
      }
    }, { t: 2.3 + i * 0.2, d: 0.9, reveal: 'rise', ease: 'out' });
  });
  // the ballpark: a low drum, the dome's four ribbed panels
  const dx = 470, dw = 120;
  p.group('city', { x: dx - dw - 10, y: SH - 110, w: 2 * dw + 20, h: 114 }, (c) => {
    c.fillStyle = CONC; c.fillRect(dx - dw, SH - 36, 2 * dw, 38);
    c.fillStyle = 'rgba(31,43,68,0.35)'; for (let x = dx - dw + 6; x < dx + dw; x += 12) c.fillRect(x, SH - 30, 5, 26);
    c.fillStyle = '#f2efe6'; c.beginPath(); c.ellipse(dx, SH - 36, dw * 0.96, 66, 0, Math.PI, 0); c.fill();
    c.strokeStyle = CONC_D; c.lineWidth = 2; c.beginPath();
    for (const k of [-0.62, -0.2, 0.25]) { const a = Math.acos(k); c.moveTo(dx + k * dw * 0.96, SH - 36); c.lineTo(dx + k * dw * 0.96, SH - 36 - Math.sin(a) * 66); }
    c.stroke();
    c.strokeStyle = 'rgba(31,43,68,0.18)'; c.lineWidth = 1; c.beginPath();
    for (let k = 1; k < 5; k++) c.ellipse(dx, SH - 36, dw * 0.96, 66 * (1 - k * 0.18), 0, Math.PI, 0);
    c.stroke();
  }, { t: 3.8, d: 0.8, reveal: 'iris' });
  // the waterfront: low terminals, a row of trees, the ferry docks
  const trees = [];
  for (let x = M; x < W - M; x += rr.range(14, 30)) trees.push([x, rr.range(9, 15), rr.pick(['#c96b2c', '#7c8a43', '#d6a23a', '#a84a2a'])]);
  p.group('shore', { x: M - 10, y: SH - 50, w: W - 2 * M + 20, h: 66 }, (c) => {
    c.fillStyle = '#c4bdab'; for (let x = M; x < W - M; x += 110) c.fillRect(x + 10, SH - 22, 90, 22);
    c.fillStyle = 'rgba(31,43,68,0.35)'; for (let x = M; x < W - M; x += 110) for (let k = 0; k < 8; k++) c.fillRect(x + 16 + k * 11, SH - 16, 6, 5);
    for (const [x, rad, col] of trees) { c.fillStyle = col; c.beginPath(); c.arc(x, SH - 4 - rad * 0.4, rad, Math.PI, 0); c.fill(); }
    c.fillStyle = NAVY; c.fillRect(M, SH, W - 2 * M, 5);
  }, { t: 4.4, d: 0.9, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ the CN Tower
function tower(p) {
  const x = TX;
  const leg = [[x - 46, SH], [x - 20, 880], [x + 20, 880], [x + 46, SH]];
  p.group('tower', { x: x - 60, y: 860, w: 120, h: SH - 856 }, (c) => {
    c.fillStyle = CONC; shape(c, leg); c.fill();
    over(c, () => { c.fillStyle = 'rgba(120,110,95,0.5)'; shape(c, [[x + 4, SH], [x + 4, 880], [x + 20, 880], [x + 46, SH]]); c.fill(); });
    // the gaps between the three legs
    c.fillStyle = SKY2; c.beginPath(); c.moveTo(x - 30, SH); c.quadraticCurveTo(x - 20, 950, x - 10, SH); c.fill();
    c.beginPath(); c.moveTo(x + 12, SH); c.quadraticCurveTo(x + 22, 950, x + 32, SH); c.fill();
  }, { t: 3.6, d: 0.7, reveal: 'rise' });
  // the shaft, tapering, the long window strip of the lift up its face
  const shaft = [[x - 20, 882], [x - 13, 505], [x + 13, 505], [x + 20, 882]];
  p.group('tower', { x: x - 26, y: 500, w: 52, h: 386 }, (c) => {
    c.fillStyle = CONC; shape(c, shaft); c.fill();
    over(c, () => { c.fillStyle = 'rgba(120,110,95,0.5)'; shape(c, [[x + 3, 882], [x + 3, 505], [x + 13, 505], [x + 20, 882]]); c.fill(); });
    c.fillStyle = NAVY; c.fillRect(x - 6, 520, 4, 350);
    c.fillStyle = 'rgba(246,239,224,0.6)'; for (let y = 530; y < 860; y += 22) c.fillRect(x - 6, y, 4, 8);
  }, { t: 4.2, d: 1.4, reveal: 'rise', ease: 'inOut' });
  // the main pod: a cone below, the glazed ring, the deck, a cone above
  p.group('tower', { x: x - 80, y: 395, w: 160, h: 116 }, (c) => {
    c.fillStyle = CONC; shape(c, [[x - 16, 508], [x - 64, 474], [x + 64, 474], [x + 16, 508]]); c.fill();
    over(c, () => { c.fillStyle = 'rgba(120,110,95,0.45)'; shape(c, [[x + 2, 508], [x + 2, 474], [x + 64, 474], [x + 16, 508]]); c.fill(); });
    c.fillStyle = NAVY; c.fillRect(x - 68, 446, 136, 28);
    c.fillStyle = 'rgba(127,176,194,0.7)'; for (let k = 0; k < 15; k++) c.fillRect(x - 64 + k * 9, 450, 5, 20);
    c.fillStyle = CONC; c.fillRect(x - 72, 440, 144, 7); c.fillRect(x - 70, 472, 140, 4);
    shape(c, [[x - 66, 440], [x - 22, 412], [x + 22, 412], [x + 66, 440]]); c.fill();
    over(c, () => { c.fillStyle = 'rgba(120,110,95,0.45)'; shape(c, [[x + 2, 440], [x + 2, 412], [x + 22, 412], [x + 66, 440]]); c.fill(); });
  }, { t: 5.4, d: 0.7, reveal: 'drop', dy: 30 });
  // the upper shaft and the SkyPod
  p.group('tower', { x: x - 30, y: 230, w: 60, h: 186 }, (c) => {
    c.fillStyle = CONC; shape(c, [[x - 11, 414], [x - 8, 262], [x + 8, 262], [x + 11, 414]]); c.fill();
    over(c, () => { c.fillStyle = 'rgba(120,110,95,0.5)'; c.fillRect(x + 2, 262, 8, 152); });
    c.fillStyle = CONC; c.fillRect(x - 20, 244, 40, 20);
    c.fillStyle = NAVY; c.fillRect(x - 18, 249, 36, 8);
  }, { t: 6.0, d: 0.8, reveal: 'rise' });
  // the antenna, drawn up by a pen, and its little red light
  p.pen('tower', [[x, 245], [x, 92]], CONC_D, 7, { t: 6.6, d: 0.9, cap: 'butt' });
  p.pen('tower', [[x - 1, 245], [x - 1, 110]], CREAM, 2.5, { t: 6.8, d: 0.8, cap: 'butt' });
  p.group('tower', { x: x - 8, y: 80, w: 16, h: 16 }, (c) => { c.fillStyle = RED; c.beginPath(); c.arc(x, 90, 4, 0, Math.PI * 2); c.fill(); }, { t: 7.5, d: 0.4, reveal: 'pop' });
}

// ================================================================ the lake
function lake(p, r) {
  p.group('lake', { x: M, y: SH + 4, w: W - 2 * M, h: LK - SH + 40 }, (c) => {
    c.fillStyle = LAKE; c.fillRect(M, SH + 5, W - 2 * M, LK - SH + 40);
    c.fillStyle = LAKE2; c.fillRect(M, SH + 5, W - 2 * M, 60);
    c.fillStyle = LAKE3; c.fillRect(M, SH + 5, W - 2 * M, 14);
  }, { t: 4.8, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // long ripples, light on dark, finer far off
  const bands = [];
  for (let y = SH + 24, k = 0; y < LK + 30; k++, y += 7 + k * 0.9) {
    const segs = [];
    for (let x = M + r.range(-40, 60); x < W - M; x += r.range(60, 200) * (1 + k * 0.05)) segs.push([[x, y], [x + r.range(30, 120) * (1 + k * 0.06), y]]);
    bands.push({ segs, w: 1 + k * 0.12 });
  }
  bands.forEach(({ segs, w }, i) => p.strokes('lake', segs, 'rgba(127,176,194,0.75)', w, { t: 5.2 + i * 0.045, d: 0.6, reveal: i % 2 ? 'wipeL' : 'wipe' }));
  // the tower's reflection: broken bars under it, and the skyline's dark band
  const refl = [];
  for (let y = SH + 12, k = 0; y < SH + 420; k++, y += 9 + k * 0.4) { const w = (18 - k * 0.2) * (k % 3 === 0 ? 1.5 : 1); refl.push([[TX - w / 2 + Math.sin(k) * 4, y], [TX + w / 2 + Math.sin(k) * 4, y]]); }
  p.strokes('lake', refl, 'rgba(217,211,196,0.55)', 3, { t: 6.8, d: 0.9, reveal: 'fall', cap: 'butt' });
  const dark = [];
  for (let k = 0; k < 40; k++) { const x = r.range(700, 1300), y = SH + 10 + r.range(0, 130); dark.push([[x, y], [x + r.range(10, 40), y]]); }
  p.strokes('lake', dark, 'rgba(31,43,68,0.35)', 3, { t: 7.0, d: 0.7, reveal: 'fall' });
  // moored sailboats, still, in a little cluster on the left
  const moored = [];
  for (let k = 0; k < 7; k++) moored.push([120 + k * 34 + r.range(-6, 6), SH + 44 + r.range(0, 16), r.range(0.45, 0.6)]);
  p.group('lake', { x: 90, y: SH - 20, w: 300, h: 90 }, (c) => {
    for (const [x, y, s] of moored) {
      c.fillStyle = CREAM; c.fillRect(x - 14 * s, y - 4 * s, 28 * s, 5 * s);
      c.fillStyle = NAVY; c.fillRect(x - 0.8, y - 80 * s, 1.6, 76 * s);
    }
  }, { t: 7.2, d: 0.6, reveal: 'rise' });
}

// ================================================================ the near shore: the islands' lawn, the seawall, chairs, people, geese
function island(p, r) {
  const edge = [];
  for (let x = M - 10; x <= W - M + 10; x += 20) edge.push([x, LK + 6 * Math.sin(x * 0.006) + 4 * Math.sin(x * 0.019)]);
  const lawn = [...edge, [W - M + 10, PB + 4], [M - 10, PB + 4]];
  p.group('island', boxOf(lawn, 6), (c) => {
    c.fillStyle = LAWN; shape(c, lawn); c.fill();
    // mown bands, overprinted
    over(c, () => {
      c.fillStyle = 'rgba(134,143,69,0.28)';
      for (let k = 0; k < 6; k++) { const y = LK + 50 + k * 70; c.fillRect(M, y, W - 2 * M, 22 + k * 4); }
    });
  }, { t: 7.4, d: 0.9, reveal: 'rise' });
  // the seawall along the water: a stone edge and a boardwalk
  p.group('island', { x: M - 10, y: LK - 20, w: W - 2 * M + 20, h: 56 }, (c) => {
    c.fillStyle = '#c6bca6'; c.beginPath(); edge.forEach(([x, y], i) => (i ? c.lineTo(x, y - 8) : c.moveTo(x, y - 8))); for (let i = edge.length - 1; i >= 0; i--) c.lineTo(edge[i][0], edge[i][1] + 14); c.fill();
    c.fillStyle = 'rgba(31,43,68,0.3)'; for (const [x, y] of edge) c.fillRect(x, y - 7, 1.5, 20);
    c.fillStyle = NAVY; c.beginPath(); edge.forEach(([x, y], i) => (i ? c.lineTo(x, y - 8) : c.moveTo(x, y - 8))); for (let i = edge.length - 1; i >= 0; i--) c.lineTo(edge[i][0], edge[i][1] - 5); c.fill();
  }, { t: 7.8, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // a path curving across the lawn
  const path = [];
  for (let k = 0; k <= 30; k++) { const t = k / 30; path.push([lerp(M - 20, W - M + 20, t), LK + 130 + Math.sin(t * Math.PI * 1.3 + 0.4) * 60]); }
  p.pen('island', path, '#e3d5b4', 26, { t: 8.0, d: 1.0, cap: 'butt' });
  // two Muskoka chairs facing the lake: one red, one yellow
  const chair = (c, x, y, col, s) => {
    const dk = mix(col, NAVY, 0.4);
    c.fillStyle = dk; c.fillRect(x - 22 * s, y - 34 * s, 5 * s, 34 * s); c.fillRect(x + 17 * s, y - 34 * s, 5 * s, 34 * s);
    // the fanned back, its slats rounded on top
    c.fillStyle = col;
    for (let k = -3; k <= 3; k++) { const a = k * 0.09; c.save(); c.translate(x + k * 6 * s, y - 30 * s); c.rotate(a); c.beginPath(); c.roundRect(-2.6 * s, -62 * s, 5.2 * s, 64 * s, [2.6 * s, 2.6 * s, 0, 0]); c.fill(); c.restore(); }
    c.fillStyle = dk; c.fillRect(x - 26 * s, y - 70 * s, 52 * s, 4 * s);
    // the broad arms
    c.fillStyle = col; c.fillRect(x - 32 * s, y - 40 * s, 14 * s, 5 * s); c.fillRect(x + 18 * s, y - 40 * s, 14 * s, 5 * s);
    c.fillStyle = dk; c.fillRect(x - 24 * s, y - 24 * s, 48 * s, 4 * s);
  };
  p.group('island', { x: 640, y: 1560, w: 320, h: 140 }, (c) => {
    // their shadows on the grass
    over(c, () => { c.fillStyle = 'rgba(80,90,40,0.45)'; c.beginPath(); c.ellipse(720, 1688, 50, 8, 0, 0, Math.PI * 2); c.ellipse(880, 1680, 46, 7, 0, 0, Math.PI * 2); c.fill(); });
    chair(c, 710, 1688, RED, 1.15);
    chair(c, 870, 1680, GOLD, 1.05);
    // a blanket and a basket between them
    c.fillStyle = CREAM; c.beginPath(); c.moveTo(760, 1700); c.lineTo(820, 1690); c.lineTo(840, 1708); c.lineTo(778, 1718); c.fill();
  }, { t: 9.4, d: 0.6, reveal: 'drop', dy: 20 });
  // people along the seawall and on the lawn, small and flat
  const rr = rng(905);
  const ppl = [];
  for (let k = 0; k < 20; k++) {
    const x = rr.range(560, 1120), y = k < 12 ? LK + rr.range(-14, -4) : LK + rr.range(110, 220);
    ppl.push([x, y, (y - LK + 200) / 260, rr.pick([RED, NAVY, GOLD, '#3e6b74', CREAM, ORANGE]), rr.chance(0.3)]);
  }
  ppl.sort((a, b) => a[1] - b[1]);
  p.group('island', { x: 520, y: LK - 80, w: 640, h: 330 }, (c) => {
    for (const [x, y, s, col, bike] of ppl) {
      const h = 40 * s;
      if (bike) {
        c.strokeStyle = NAVY; c.lineWidth = 1.6 * s; c.beginPath();
        c.arc(x - 10 * s, y - 6 * s, 6 * s, 0, Math.PI * 2); c.moveTo(x + 16 * s, y - 6 * s); c.arc(x + 10 * s, y - 6 * s, 6 * s, 0, Math.PI * 2);
        c.moveTo(x - 10 * s, y - 6 * s); c.lineTo(x, y - 16 * s); c.lineTo(x + 10 * s, y - 6 * s); c.stroke();
        c.fillStyle = col; c.fillRect(x - 3 * s, y - 34 * s, 7 * s, 18 * s);
        c.fillStyle = NAVY; c.beginPath(); c.arc(x + 1 * s, y - 38 * s, 4 * s, 0, Math.PI * 2); c.fill();
      } else {
        c.fillStyle = NAVY; c.fillRect(x - 3 * s, y - h * 0.45, 2.6 * s, h * 0.45); c.fillRect(x + 0.6 * s, y - h * 0.45, 2.6 * s, h * 0.45);
        c.fillStyle = col; c.fillRect(x - 4.5 * s, y - h * 0.88, 9 * s, h * 0.46);
        c.fillStyle = NAVY; c.beginPath(); c.arc(x, y - h * 0.96, 4 * s, 0, Math.PI * 2); c.fill();
      }
    }
  }, { t: 9.7, d: 0.6, reveal: 'fade' });
  // Canada geese grazing on the lawn
  const geese = [[980, 1760, 1], [1030, 1772, 0.95], [1070, 1754, 0.9], [540, 1800, 1.05], [600, 1790, 1]];
  p.group('island', { x: 500, y: 1700, w: 620, h: 120 }, (c) => {
    for (const [x, y, s] of geese) {
      c.fillStyle = '#6b5a47'; c.beginPath(); c.ellipse(x, y - 12 * s, 18 * s, 9 * s, -0.1, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e8dfcc'; c.beginPath(); c.ellipse(x - 2 * s, y - 8 * s, 10 * s, 4 * s, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#1c1c1c'; c.lineWidth = 3.4 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 14 * s, y - 14 * s); c.quadraticCurveTo(x - 24 * s, y - 20 * s, x - 26 * s, y - 2 * s); c.stroke();
      c.fillStyle = '#f4efe2'; c.beginPath(); c.arc(x - 25 * s, y - 4 * s, 2.4 * s, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#1c1c1c'; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(x - 2, y - 4 * s); c.lineTo(x - 3, y + 2); c.moveTo(x + 4, y - 4 * s); c.lineTo(x + 5, y + 2); c.stroke();
    }
  }, { t: 9.9, d: 0.5, reveal: 'drop', dy: 14 });
}

// ================================================================ the maples: trunks drawn up, then crowns of overprinted leaves
// a maple leaf, its point up, centered at (x, y), as a path
function leaf(c, x, y, s, a) {
  const P = [[0, -1], [0.18, -0.55], [0.42, -0.72], [0.36, -0.32], [0.82, -0.42], [0.62, -0.1], [0.72, 0.02], [0.22, 0.18], [0.24, 0.42], [0.04, 0.34], [0.03, 0.62]];
  const ca = Math.cos(a), sa = Math.sin(a);
  const pt = (px, py) => [x + (px * ca - py * sa) * s, y + (px * sa + py * ca) * s];
  const pts = [...P, ...P.slice(0, -1).reverse().map(([px, py]) => [-px, py])];
  pts.forEach(([px, py], i) => { const [X, Y] = pt(px, py); i ? c.lineTo(X, Y) : c.moveTo(X, Y); });
  c.closePath();
}
function maples(p, r) {
  const trees = [
    { x: 250, y: 1640, h: 560, R: 270, branches: 7 },
    { x: 1360, y: 1620, h: 520, R: 250, branches: 7 },
    { x: 470, y: 1520, h: 300, R: 130, branches: 5 },
    { x: 1170, y: 1510, h: 280, R: 120, branches: 5 },
  ];
  const cols = [RED, ORANGE, GOLD, '#a83322', '#d65a2a'];
  trees.forEach((tr, ti) => {
    const rr = rng(300 + ti);
    const top = tr.y - tr.h, cx = tr.x, cy = top + tr.R * 0.7;
    // the trunk and its main branches, each a pen line
    const lines = [[[tr.x, tr.y], [tr.x + rr.range(-10, 10), top + tr.R * 0.9]]];
    for (let b = 0; b < tr.branches; b++) {
      const a = -Math.PI / 2 + (b / (tr.branches - 1) - 0.5) * 2.2;
      const y0 = lerp(tr.y - tr.h * 0.35, top + tr.R, b % 2 ? 0.5 : 0.2);
      const l = tr.R * rr.range(0.7, 0.95);
      lines.push([[tr.x, y0], [tr.x + Math.cos(a) * l * 0.5, y0 + Math.sin(a) * l * 0.5 - 20], [tr.x + Math.cos(a) * l, y0 + Math.sin(a) * l]]);
    }
    p.pen('trees', lines[0], BARK, tr.R * 0.12, { t: 8.2 + ti * 0.15, d: 0.7, cap: 'butt' });
    p.strokes('trees', lines.slice(1), BARK, tr.R * 0.035, { t: 8.6 + ti * 0.15, d: 0.6, reveal: 'rise' });
    // leaves: drawn at build time into lists, laid in three passes of ink
    const leaves = [[], [], [], [], []];
    const n = Math.round(tr.R * 2.1);
    for (let i = 0; i < n; i++) {
      const a = rr.range(0, Math.PI * 2), d = Math.sqrt(rr()) * tr.R;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.78;
      leaves[i % 5].push([x, y, rr.range(14, 24) * (tr.R / 250 * 0.5 + 0.5), rr.range(-0.6, 0.6), rr.pick(cols)]);
    }
    leaves.forEach((set, k) => {
      const bx = { x: cx - tr.R - 30, y: cy - tr.R - 30, w: 2 * tr.R + 60, h: 2 * tr.R + 60 };
      p.group('trees', bx, (c) => {
        over(c, () => {
          for (const col of cols) {
            c.fillStyle = col; c.globalAlpha = 0.85; c.beginPath();
            for (const [x, y, s, a, cc] of set) if (cc === col) leaf(c, x, y, s, a);
            c.fill();
          }
        });
      }, { t: 8.8 + ti * 0.3 + k * 0.22, d: 0.45, reveal: 'iris' });
    });
  });
  // leaves already fallen on the lawn
  const fall = [];
  const rr = rng(77);
  for (let i = 0; i < 160; i++) { const left = i % 2; fall.push([left ? rr.range(M, 640) : rr.range(1000, W - M), rr.range(1560, PB - 6), rr.range(7, 12), rr.range(0, 6), rr.pick(cols)]); }
  p.group('trees', { x: M, y: 1540, w: W - 2 * M, h: PB - 1540 }, (c) => {
    over(c, () => { for (const [x, y, s, a, col] of fall) { c.fillStyle = col; c.beginPath(); leaf(c, x, y, s, a); c.fill(); } });
  }, { t: 11.6, d: 0.6, reveal: 'fade' });
}

// ================================================================ what moves: the ferry, sailboats, geese in a V, falling leaves
function lives(p, r) {
  // the island ferry: a white two-decked boat crossing from the city
  p.live('boats', {
    t: 9.8, d: 0.8,
    draw: (c, time) => {
      const k = time - 9.8, x = 1380 - k * 26, y = 1250;
      c.fillStyle = 'rgba(246,239,224,0.6)'; c.fillRect(x + 70, y + 2, 60 + k * 2, 2);
      c.fillStyle = NAVY; c.beginPath(); c.moveTo(x - 64, y - 10); c.lineTo(x + 70, y - 10); c.lineTo(x + 62, y + 4); c.lineTo(x - 56, y + 4); c.fill();
      c.fillStyle = CREAM; c.fillRect(x - 56, y - 30, 118, 20); c.fillRect(x - 40, y - 46, 84, 16);
      c.fillStyle = LAKE; for (let i = 0; i < 10; i++) c.fillRect(x - 50 + i * 11, y - 25, 6, 8);
      c.fillStyle = RED; c.fillRect(x - 6, y - 60, 12, 14);
      c.fillStyle = NAVY; c.fillRect(x - 6, y - 62, 12, 3);
    },
  });
  // sailboats tacking slowly, their sails in the poster's inks
  const boats = [[300, 1180, 0.9, 7, RED], [980, 1120, 0.6, -5, CREAM], [1200, 1330, 1.1, 9, GOLD], [720, 1370, 1.2, -6, CREAM]];
  p.live('boats', {
    t: 10.0, d: 0.8,
    draw: (c, time) => {
      const k = time - 10;
      for (const [bx, y, s, sp, col] of boats) {
        const x = bx + k * sp, bob = Math.sin(time * 1.5 + bx) * 1.5;
        c.fillStyle = NAVY; c.beginPath(); c.moveTo(x - 26 * s, y + bob); c.lineTo(x + 26 * s, y + bob); c.lineTo(x + 18 * s, y + 8 * s + bob); c.lineTo(x - 18 * s, y + 8 * s + bob); c.fill();
        c.fillStyle = col; c.beginPath(); c.moveTo(x, y - 76 * s + bob); c.lineTo(x, y - 4 + bob); c.lineTo(x + 28 * s, y - 4 + bob); c.fill();
        c.fillStyle = col === CREAM ? '#d8cdb6' : CREAM; c.beginPath(); c.moveTo(x - 3, y - 64 * s + bob); c.lineTo(x - 3, y - 4 + bob); c.lineTo(x - 22 * s, y - 4 + bob); c.fill();
        c.fillStyle = 'rgba(31,43,68,0.35)'; c.fillRect(x - 22 * s, y + 10 * s + bob, 44 * s, 2);
      }
    },
  });
  // geese flying in a V, honking across the top of the sky
  p.live('live', {
    t: 10.2, d: 0.8,
    draw: (c, time) => {
      const k = time - 10.2, x0 = 1500 - k * 60, y0 = 560 - k * 4;
      c.fillStyle = NAVY; c.beginPath();
      for (let i = -4; i <= 4; i++) {
        const x = x0 + Math.abs(i) * 34, y = y0 + i * 18, f = Math.sin(time * 6 + i) * 5;
        c.moveTo(x - 12, y); c.lineTo(x, y - 2); c.lineTo(x + 6, y - 9 - f); c.lineTo(x + 8, y + 1); c.lineTo(x + 6, y + 9 + f); c.lineTo(x, y + 2); c.closePath();
      }
      c.fill();
    },
  });
  // leaves coming down from the big maples
  const fl = [];
  for (let i = 0; i < 26; i++) { const left = i % 2; fl.push([left ? r.range(80, 520) : r.range(1100, 1520), r.range(0, 600), r.range(26, 44), r() * 6, r.pick([RED, ORANGE, GOLD])]); }
  p.live('live', {
    t: 10.4, d: 0.8,
    draw: (c, time) => {
      const k = time - 10.4;
      for (const [x0, y0, sp, ph, col] of fl) {
        const y = 1100 + ((y0 + k * sp) % 720), x = x0 + Math.sin(k * 1.1 + ph) * 26;
        c.fillStyle = col; c.beginPath(); leaf(c, x, y, 11, Math.sin(k * 2 + ph) * 1.2); c.fill();
      }
    },
  });
}

// ================================================================ the name and the foot
function title(p) {
  p.type('title', 'TORONTO', W / 2, 330, { size: 300, family: '"DM Serif Display"', weight: 400, color: NAVY, align: 'center', fit: W - 2 * M - 70, track: 0.02, t: 10.7, gap: 0.16, d: 0.7, reveal: 'rise' });
  // the picture's edge and the line under it
  p.group('foot', { x: M - 4, y: M - 4, w: W - 2 * M + 8, h: PB - M + 8 }, (c) => {
    c.strokeStyle = NAVY; c.lineWidth = 3; c.strokeRect(M, M, W - 2 * M, PB - M);
  }, { t: 0.3, d: 0.8, reveal: 'fade' });
  p.group('foot', { x: M, y: PB + 50, w: W - 2 * M, h: 12 }, (c) => {
    c.fillStyle = RED; c.fillRect(M, PB + 54, 300, 4); c.fillRect(W - M - 300, PB + 54, 300, 4);
  }, { t: 12.4, d: 0.7, reveal: 'wipe', ease: 'inOut' });
  p.type('foot', 'Lake Ontario · from the Islands', W / 2, PB + 70, { size: 42, family: '"DM Serif Display"', style: 'italic', weight: 400, color: NAVY, align: 'center', t: 12.6, gap: 0.03, d: 0.4, reveal: 'fade' });
}
