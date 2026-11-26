// Paris: a gouache travel poster from the fifties. No outlines, only flat shapes
// in a short palette: deep teal, coral, cream, black and mustard. The tower rises
// huge on the right over an ocean of zinc roofs cut on the slant; the Seine runs
// away under Pont Alexandre III to Notre-Dame, and Sacré-Cœur stands against a
// low sun. A brush-script title in the sky, a black band at the foot.

import { Plate, W, boxOf } from '../print.js';
import { Ground, mix, lerp, clamp, poly, rng } from '../kit.js';

const TEAL_D = '#16454a', TEAL = '#256a6b', TEAL_M = '#3f8783', SEA = '#86b3a2', MINT = '#b9d1bd';
const CREAM = '#f4e6c8', CREAM_D = '#e3cfab', CORAL = '#e8674f', PINK = '#f0a48b', BLUSH = '#f5c9ac';
const BLACK = '#211b1a', MUSTARD = '#e3a636', HAZE = '#e9c9b2';
const LIT = '#f7d9bb', SHADOW = '#8fa9a6', ZINC = '#a6b8b6', ZINC_D = '#5f7d82', ZINC_T = '#4f6d73';
const STREET = '#b99c8d', LEAF = '#2f6a5e', LEAF_L = '#5e9a7f';

export const city = {
  id: 'paris', name: 'Paris', wall: '#173c40',
  alt: "A gouache view along the Seine with the Eiffel Tower, Sacré-Cœur against a low sun, Notre-Dame, the Invalides dome and rows of zinc roofs, the name in a looping script",
  google: 'family=Yellowtail&family=Josefin+Sans:wght@600;700',
  fonts: [['400 300px "Yellowtail"', 'Paris'], ['600 40px "Josefin Sans"', 'LA VILLE LUMIÈRE FRANCE']],
  build,
};

// the picture, and the black band below it
const IX = 34, IY = 34, IW = W - 68, IB = 1846;
const BAND = { x: IX, y: IB, w: IW, h: 1966 - IB };

// the town on the ground, seen from the height of the roofs
const G = new Ground({ cx: 700, hy: 1020, y0: 2150, U: 1100, K: 1.6 });
// the street grid is turned against the view, so blocks show two faces
const CA = 0.894, SA = 0.447;
const UV = (a, b) => [a * CA - b * SA, a * SA + b * CA];
const CAM_A = -0.279, CAM_B = -0.559;
const P = (u, v, z = 0) => G.P(u, v, z);

// the Seine runs away from us, a little to the left
const uR = (v) => -0.585 + 0.12 * Math.sin(v * 0.6) - 0.05 * v;
const RW = 0.375;
const ISLE = [2.05, 3.05]; // Île de la Cité, in v
const isleHalf = (v) => (v < ISLE[0] || v > ISLE[1] ? 0 : 0.2 * Math.sin(Math.PI * (v - ISLE[0]) / (ISLE[1] - ISLE[0])) ** 0.6);
// the tower stands here, on its park
const TU = 1.16, TV = 1.23;
const inPark = (u, v) => u > 0.62 && u < 1.75 && v > 0.82 && v < 2.7;
const INV = [0.62, 3.7];
const CAFES = []; // the Invalides
const inInv = (u, v) => Math.abs(u - INV[0]) < 0.28 && Math.abs(v - INV[1]) < 0.4;

// a heavy group drawn once into its own canvas, at the press's scale and on its
// pixel grid, then copied each frame while it arrives. The canvas covers the box
// and a margin, as much as a rise reveal ever shows of it. When the group is
// pressed into its layer it is drawn as itself, so the finished poster is just
// as it was, and its canvas is let go. A group is a list of steps drawn in turn,
// so its canvas can be made over a few frames.
let CACHES = [], TINY = null, SHEET = null;
function cached(box, steps, t, d) {
  const pad = 8;
  const e = { t, d, cv: null, g: null, ck: 0, ox: 0, oy: 0, i: 0 };
  e.start = (k) => {
    e.ox = Math.floor((box.x - pad) * k); e.oy = Math.floor((box.y - pad) * k);
    const w = Math.max(1, Math.ceil((box.x + box.w + pad) * k) - e.ox), h = Math.max(1, Math.ceil((box.y + box.h + pad) * k) - e.oy);
    e.cv = document.createElement('canvas'); e.cv.width = w; e.cv.height = h;
    e.g = e.cv.getContext('2d');
    e.g.setTransform(k, 0, 0, k, -e.ox, -e.oy);
    e.ck = k; e.i = 0;
  };
  e.free = () => { if (e.cv) { e.cv.width = e.cv.height = 0; e.cv = e.g = null; } };
  e.ready = (k) => e.cv && e.ck === k && e.i === steps.length;
  // one step, then copy the canvas once out of sight so its drawing is done now
  e.step = (k) => {
    if (!e.cv || e.ck !== k) e.start(k);
    steps[e.i++](e.g);
    TINY ??= document.createElement('canvas'); TINY.width = TINY.height = 1;
    TINY.getContext('2d').drawImage(e.cv, 0, 0, 1, 1);
  };
  CACHES.push(e);
  // whole (q is 1) and not on the sheet itself: it is being pressed into its layer
  return (c, q) => {
    if (q === 1 && c.canvas !== SHEET) { e.free(); for (const st of steps) st(c); return; }
    const k = c.canvas.width / W;
    if (!e.cv || e.ck !== k) e.start(k);
    while (e.i < steps.length) steps[e.i++](e.g);
    c.drawImage(e.cv, e.ox / k, e.oy / k, e.cv.width / k, e.cv.height / k);
  };
}
// only for marks that rise: they are clipped to their box, so the margin holds all they show
const riseGroup = (p, layer, box, steps, o) => p.group(layer, box, cached(box, Array.isArray(steps) ? steps : [steps], o.t, o.d ?? 0.8), o);

// the groups' canvases are made ahead, a few a frame in the quiet early
// seconds, so none costs its whole drawing in the frames it arrives in. Groups
// already whole are skipped. It draws nothing itself, notes which canvas is the
// sheet, and sits on a layer below the town that already moves.
function prebuild(p) {
  const list = CACHES.slice().sort((a, b) => a.t - b.t);
  let next = 0, last = 0;
  p.live('clouds', {
    t: 0, d: 0.01, reveal: 'none',
    draw: (c, time) => {
      const k = c.canvas.width / W, t0 = performance.now();
      SHEET = c.canvas;
      if (time < last || (list[0] && list[0].ck !== k)) next = 0;
      last = time;
      while (next < list.length) {
        const e = list[next];
        if (time >= e.t + e.d || e.ready(k)) { next++; continue; }
        e.step(k);
        if (performance.now() - t0 > 3) break;
      }
    },
  });
}

function build() {
  CAFES.length = 0;
  CACHES = []; SHEET = null;
  const p = new Plate({ paper: '#efe2c3', seed: 1889 });
  const r = p.r;
  p.clip = { x: IX, y: IY, w: IW, h: IB - IY };
  p.stack('sky', 'clouds', 'far', 'ground', 'boats', 'city0', 'tower', 'city1', 'bridge', 'people', 'air', 'shadow', 'title', 'band');
  p.layer('band', { clip: false });
  p.layer('title', { clip: false });
  p.layer('shadow', { clip: false });

  sky(p, r);
  far(p, r);
  ground(p, r);
  town(p, r);
  tower(p, r);
  bridge(p, r);
  people(p, r);
  life(p, r);
  title(p);
  prebuild(p);
  return p;
}

// ---------------------------------------------------------------- texture
// a gouache wash: a flat fill, then faint drags of the brush across it, lighter
// and darker, so the color is never quite even
function brushed(c, seed, x, y, w, h, o = {}) {
  const rr = rng(seed);
  const n = o.n ?? Math.round((w * h) / 9000) + 6;
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const yy = y + rr() * h, xx = x - 40 + rr() * w * 0.6, len = w * rr.range(0.3, 0.9);
    const light = rr() < 0.5;
    c.strokeStyle = light ? `rgba(255,250,235,${rr.range(0.03, 0.07) * (o.k ?? 1)})` : `rgba(30,20,20,${rr.range(0.025, 0.06) * (o.k ?? 1)})`;
    c.lineWidth = rr.range(3, o.max ?? 18);
    c.beginPath(); c.moveTo(xx, yy);
    const steps = 6;
    for (let k = 1; k <= steps; k++) c.lineTo(xx + (len * k) / steps, yy + Math.sin(k * 1.3 + i) * rr.range(0.5, 3) + (o.tilt || 0) * len * k / steps);
    c.stroke();
  }
}
// a band whose top edge is cut by hand
function wavyBand(seed, x0, x1, top, bottom, amp) {
  const rr = rng(seed);
  const pts = [];
  for (let x = x0; x <= x1 + 40; x += 40) pts.push([x, top + Math.sin(x * 0.006 + seed) * amp + rr.range(-amp, amp) * 0.3]);
  pts.push([x1, bottom], [x0, bottom]);
  return pts;
}

// ---------------------------------------------------------------- sky
function sky(p, r) {
  const bands = [
    [IY, TEAL_D], [250, '#1d5658'], [430, TEAL], [600, TEAL_M], [740, SEA], [850, '#cfc9ac'], [920, BLUSH], [975, PINK],
  ];
  bands.forEach(([y, col], i) => {
    const pts = wavyBand(30 + i, IX, IX + IW, y, 1060, i ? 7 : 0);
    p.group('sky', { x: IX, y: y - 12, w: IW, h: 1072 - y }, (c) => {
      c.fillStyle = col; poly(c, pts); c.fill();
      c.save(); poly(c, pts); c.clip(); brushed(c, 100 + i, IX, y - 10, IW, Math.min(260, 1060 - y)); c.restore();
    }, { t: 0.05 + i * 0.16, d: 1.0, reveal: 'fall', ease: 'inOut' });
  });
  // a low sun behind Montmartre, cut by three bars of sky
  const sx = 300, sy = 905, sr = 182;
  p.group('sky', { x: sx - sr - 10, y: sy - sr - 10, w: 2 * sr + 20, h: 2 * sr + 20 }, (c) => {
    c.fillStyle = 'rgba(245,190,160,.55)'; c.beginPath(); c.arc(sx, sy, sr + 26, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.clip();
    c.fillStyle = CORAL; c.fillRect(sx - sr, sy - sr, 2 * sr, 2 * sr);
    c.fillStyle = '#ee8564'; c.fillRect(sx - sr, sy - sr, 2 * sr, sr * 0.7);
    brushed(c, 7, sx - sr, sy - sr, 2 * sr, 2 * sr, { n: 30 });
    c.fillStyle = PINK;
    for (const [dy, h] of [[0.28, 9], [0.5, 12], [0.7, 15]]) c.fillRect(sx - sr, sy + sr * dy * 0.9 - 40, 2 * sr, h);
    c.restore();
  }, { t: 1.0, d: 1.6, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- the far edge
function far(p, r) {
  // the last of the town, pale in the evening air
  const sil = [];
  for (let x = IX; x < IX + IW;) {
    const w = r.range(14, 40), h = r.range(10, 30) * (r.chance(0.07) ? 2.4 : 1);
    sil.push([x, w, h, r.chance(0.1)]); x += w;
  }
  p.group('far', { x: IX, y: 930, w: IW, h: 110 }, (c) => {
    c.fillStyle = mix(HAZE, PINK, 0.35);
    c.beginPath(); c.moveTo(IX, 1040);
    for (const [x, w, h, dome] of sil) {
      const y = 1018 - h;
      c.lineTo(x, y + 4); c.lineTo(x + w * 0.15, y); c.lineTo(x + w * 0.85, y); c.lineTo(x + w, y + 4);
      if (dome) { c.lineTo(x + w * 0.7, y); c.arc(x + w * 0.5, y, w * 0.2, 0, Math.PI, true); }
    }
    c.lineTo(IX + IW, 1040); c.closePath(); c.fill();
    c.fillStyle = mix(HAZE, PINK, 0.2);
    for (const [x, w, h] of sil) for (let k = 0; k < w / 7; k++) c.fillRect(x + 3 + k * 7, 1014 - h, 2.2, -4);
  }, { t: 1.5, d: 1.2, reveal: 'rise' });

  // Montmartre: a hill of houses, the basilica on top
  const hill = [[IX, 1030]];
  for (let x = IX; x <= 620; x += 10) {
    const k = (x - 300) / 300;
    hill.push([x, 1030 - Math.max(0, 128 * Math.exp(-k * k * 1.6) - 6) - 8 * (1 - Math.abs(k))]);
  }
  hill.push([620, 1030]);
  const hillY = (x) => { const k = (x - 300) / 300; return 1030 - Math.max(0, 128 * Math.exp(-k * k * 1.6) - 6) - 8 * (1 - Math.abs(k)); };
  const houses = [];
  for (let i = 0; i < 120; i++) {
    const x = r.range(IX, 600), top = hillY(x);
    const y = r.range(top + 6, 1032);
    houses.push([x, y, r.range(7, 16), r.range(6, 13), r.chance(0.3)]);
  }
  houses.sort((a, b) => a[1] - b[1]);
  p.group('far', boxOf(hill, 20), (c) => {
    c.fillStyle = '#d49a8a'; poly(c, hill); c.fill();
    c.save(); poly(c, hill); c.clip();
    brushed(c, 11, IX, 880, 600, 160, { n: 40 });
    for (const [x, y, w, h, tree] of houses) {
      if (tree) { c.fillStyle = '#b07f78'; c.beginPath(); c.arc(x, y - 4, w * 0.45, 0, Math.PI * 2); c.fill(); continue; }
      c.fillStyle = '#f1c7ae'; c.fillRect(x, y - h, w, h);
      c.fillStyle = '#c9877d'; c.fillRect(x + w * 0.65, y - h, w * 0.35, h);
      c.fillStyle = '#a9787a'; poly(c, [[x - 1, y - h], [x + w + 1, y - h], [x + w * 0.8, y - h - 4], [x + w * 0.2, y - h - 4]]); c.fill();
      c.fillStyle = 'rgba(120,80,80,.6)'; c.fillRect(x + 2, y - h * 0.65, 2, 3); if (w > 11) c.fillRect(x + 6, y - h * 0.65, 2, 3);
    }
    c.restore();
  }, { t: 1.9, d: 1.2, reveal: 'rise' });
  sacreCoeur(p, 300, hillY(300) + 4);
}

function sacreCoeur(p, cx, gy) {
  const st = '#fbf0dc', sd = '#e4cbb3', dk = '#a7787a';
  const dome = (c, x, y, w, h) => {
    // a tall Romano-Byzantine dome on its drum, with a little lantern
    c.fillStyle = st; c.beginPath(); c.moveTo(x - w, y);
    c.bezierCurveTo(x - w * 1.02, y - h * 0.55, x - w * 0.45, y - h * 0.95, x, y - h);
    c.bezierCurveTo(x + w * 0.45, y - h * 0.95, x + w * 1.02, y - h * 0.55, x + w, y); c.closePath(); c.fill();
    c.fillStyle = sd; c.beginPath(); c.moveTo(x + w * 0.15, y);
    c.bezierCurveTo(x + w * 0.3, y - h * 0.6, x + w * 0.2, y - h * 0.9, x, y - h);
    c.bezierCurveTo(x + w * 0.45, y - h * 0.95, x + w * 1.02, y - h * 0.55, x + w, y); c.closePath(); c.fill();
    // ribs
    c.strokeStyle = 'rgba(167,120,122,.45)'; c.lineWidth = 1; c.beginPath();
    for (const f of [-0.55, 0, 0.55]) { c.moveTo(x + f * w, y); c.quadraticCurveTo(x + f * w * 0.85, y - h * 0.7, x, y - h); }
    c.stroke();
    // lantern
    c.fillStyle = st; c.fillRect(x - w * 0.16, y - h - h * 0.26, w * 0.32, h * 0.26);
    c.fillStyle = dk; for (const f of [-0.08, 0.04]) c.fillRect(x + f * w, y - h - h * 0.22, w * 0.05, h * 0.14);
    c.fillStyle = st; c.beginPath(); c.arc(x, y - h - h * 0.26, w * 0.17, Math.PI, 0); c.fill();
    c.fillStyle = sd; c.fillRect(x - 0.8, y - h - h * 0.5, 1.6, h * 0.12);
  };
  const drum = (c, x, y0, y1, w) => {
    c.fillStyle = st; c.fillRect(x - w, y1, 2 * w, y0 - y1);
    c.fillStyle = sd; c.fillRect(x + w * 0.35, y1, w * 0.65, y0 - y1);
    c.fillStyle = dk;
    for (let i = 0; i < 7; i++) { const xx = x - w + (2 * w * (i + 0.5)) / 7; c.fillRect(xx - 1.2, y1 + (y0 - y1) * 0.25, 2.4, (y0 - y1) * 0.55); }
    c.fillStyle = sd; c.fillRect(x - w - 2, y1 - 3, 2 * w + 4, 3);
  };
  // the bell tower behind, on the right
  p.group('far', { x: cx + 40, y: gy - 205, w: 60, h: 210 }, (c) => {
    const x = cx + 72;
    c.fillStyle = st; c.fillRect(x - 13, gy - 150, 26, 150);
    c.fillStyle = sd; c.fillRect(x + 3, gy - 150, 10, 150);
    c.fillStyle = dk; c.fillRect(x - 8, gy - 140, 4, 22); c.fillRect(x - 1, gy - 140, 4, 22);
    c.fillStyle = st; c.fillRect(x - 15, gy - 156, 30, 6);
    drum(c, x, gy - 156, gy - 172, 11);
    dome(c, x, gy - 172, 11, 22);
  }, { t: 2.5, d: 1.0, reveal: 'rise' });
  p.group('far', { x: cx - 110, y: gy - 210, w: 220, h: 214 }, (c) => {
    // the body: a long block with arches, then the porch of three arches
    c.fillStyle = st; c.fillRect(cx - 92, gy - 62, 184, 62);
    c.fillStyle = sd; c.fillRect(cx + 40, gy - 62, 52, 62);
    c.fillStyle = dk;
    for (let i = 0; i < 9; i++) { const x = cx - 84 + i * 19; if (Math.abs(x - cx) < 34) continue; c.fillRect(x, gy - 50, 5, 14); c.beginPath(); c.arc(x + 2.5, gy - 50, 2.5, Math.PI, 0); c.fill(); }
    // the porch, raised forward
    c.fillStyle = st; c.fillRect(cx - 36, gy - 54, 72, 54);
    c.fillStyle = dk;
    for (const dx of [-22, 0, 22]) { c.beginPath(); c.moveTo(dx + cx - 7, gy); c.lineTo(dx + cx - 7, gy - 24); c.arc(dx + cx, gy - 24, 7, Math.PI, 0); c.lineTo(dx + cx + 7, gy); c.fill(); }
    c.fillStyle = st; poly(c, [[cx - 40, gy - 54], [cx + 40, gy - 54], [cx, gy - 70]]); c.fill();
    // two small domes on the porch, two more at the corners
    for (const dx of [-28, 28]) { drum(c, cx + dx, gy - 54, gy - 60, 7); dome(c, cx + dx, gy - 60, 7, 13); }
    for (const dx of [-74, 74]) { drum(c, cx + dx, gy - 62, gy - 74, 10); dome(c, cx + dx, gy - 74, 10, 20); }
    // the great dome on its tall drum
    c.fillStyle = st; c.fillRect(cx - 44, gy - 92, 88, 32);
    drum(c, cx, gy - 92, gy - 128, 30);
    dome(c, cx, gy - 128, 30, 58);
  }, { t: 2.7, d: 1.3, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- ground and river
const riverPts = (side, v0 = 0.12, v1 = 30) => {
  const pts = [];
  for (let v = v0; v <= v1; v += v < 2 ? 0.05 : v < 6 ? 0.15 : 0.6) pts.push(P(uR(v) + side * RW, v));
  return pts;
};

function ground(p, r) {
  // the street level, pale and warm, under everything
  p.group('ground', { x: IX, y: 1010, w: IW, h: IB - 1010 }, (c) => {
    const g = c.createLinearGradient(0, 1020, 0, IB);
    g.addColorStop(0, mix(STREET, HAZE, 0.75)); g.addColorStop(0.25, mix(STREET, HAZE, 0.3)); g.addColorStop(1, STREET);
    c.fillStyle = g; c.fillRect(IX, 1016, IW, IB - 1016);
  }, { t: 1.7, d: 1.0, reveal: 'fade' });
  // the quays: a stone edge each side
  const quay = (side) => {
    const a = riverPts(side);
    const outer = [];
    for (let v = 0.12; v <= 30; v += v < 2 ? 0.05 : v < 6 ? 0.15 : 0.6) outer.push(P(uR(v) + side * (RW + 0.05), v));
    return [...a, ...outer.reverse()];
  };
  for (const side of [-1, 1]) p.fill('ground', quay(side), mix(CREAM_D, STREET, 0.25), { t: 2.1, d: 0.8, reveal: 'fade' });
  // the water, lighter far off where it takes the sky
  const water = [...riverPts(-1), ...riverPts(1).reverse()];
  p.group('ground', boxOf(water, 4), (c) => {
    const g = c.createLinearGradient(0, 1020, 0, IB);
    g.addColorStop(0, BLUSH); g.addColorStop(0.08, SEA); g.addColorStop(0.35, TEAL_M); g.addColorStop(1, TEAL);
    c.fillStyle = g; poly(c, water); c.fill();
    c.save(); poly(c, water); c.clip();
    brushed(c, 21, IX, 1020, 800, 830, { n: 60, k: 1.2 });
    // the quay walls' shadow on the water, on the left of each bank
    c.fillStyle = 'rgba(22,69,74,.35)'; poly(c, [...riverPts(-1), ...riverPts(-1).reverse().map(([x, y]) => [x + 14 * (y - 1020) / 800, y])]); c.fill();
    c.restore();
  }, { t: 2.2, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // the island
  const isle = [];
  for (let v = ISLE[0]; v <= ISLE[1] + 1e-6; v += 0.05) isle.push(P(uR(v) - isleHalf(v), v));
  for (let v = ISLE[1]; v >= ISLE[0] - 1e-6; v -= 0.05) isle.push(P(uR(v) + isleHalf(v), v));
  p.fill('ground', isle, mix(CREAM_D, STREET, 0.3), { t: 2.8, d: 0.6, reveal: 'fade' });
  // the water's marks: short flat strokes, longer toward us
  const lines = [], light = [];
  for (let v = 0.14; v < 7; v += v < 1 ? 0.035 : v < 3 ? 0.09 : 0.25) {
    const s = G.s(v), n = Math.max(1, Math.round(5 * s * 3));
    for (let i = 0; i < n; i++) {
      const u = uR(v) + r.range(-RW * 0.9, RW * 0.9);
      if (v > ISLE[0] && v < ISLE[1] && Math.abs(u - uR(v)) < isleHalf(v) + 0.05) continue;
      const [x, y] = P(u, v), L = r.range(10, 34) * s;
      (r.chance(0.35) ? light : lines).push([[x - L, y], [x + L, y]]);
    }
  }
  p.strokes('ground', lines, 'rgba(22,69,74,.55)', 2.4, { t: 3.0, d: 1.2, reveal: 'wipe' });
  p.strokes('ground', light, 'rgba(246,210,180,.7)', 2, { t: 3.3, d: 1.2, reveal: 'wipeL' });

  // the park under the tower: lawn and gravel
  const lawn = [P(0.68, 0.86), P(1.7, 0.86), P(1.7, 2.65), P(0.68, 2.65)];
  p.group('ground', boxOf(lawn, 4), (c) => {
    c.fillStyle = mix(CREAM_D, STREET, 0.2); poly(c, lawn); c.fill();
    for (const [a, b] of [[0.72, 1.06], [1.26, 1.66]]) {
      const q = [P(a, 0.9), P(b, 0.9), P(b, 2.6), P(a, 2.6)];
      c.fillStyle = LEAF_L; poly(c, q); c.fill();
    }
    c.fillStyle = mix(LEAF_L, MINT, 0.4);
    for (let v = 1.7; v < 2.6; v += 0.12) { const q = [P(0.75, v), P(1.03, v), P(1.03, v + 0.05), P(0.75, v + 0.05)]; poly(c, q); c.fill(); }
  }, { t: 3.2, d: 0.9, reveal: 'fade' });
}

// ---------------------------------------------------------------- the town
// every block on the turned grid: two lit faces, a zinc mansard with dormers,
// and the long chimney stacks on the party walls. Far to near, in bands.
function town(p, r) {
  const items = [];
  const SA_ = 0.205, SB_ = 0.165;
  for (let ia = -70; ia <= 70; ia++) {
    for (let ib = -6; ib <= 110; ib++) {
      const a0 = ia * SA_ + (ib % 2 ? 0.03 : 0), b0 = ib * SB_;
      const wa = 0.17 * (ia % 5 === 0 ? 0.8 : 1), wb = 0.12;
      const [uc, vc] = UV(a0 + wa / 2, b0 + wb / 2);
      if (vc < 0.16 || vc > 8.5) continue;
      if (vc > 5 && r.chance(clamp((vc - 5) / 4) * 0.5)) continue;
      const s = G.s(vc);
      const [xc] = P(uc, vc);
      if (xc < IX - 120 * s - 20 || xc > IX + IW + 120 * s + 20) continue;
      // keep clear of the river, the island, the park and the Invalides
      const corners = [[a0, b0], [a0 + wa, b0], [a0 + wa, b0 + wb], [a0, b0 + wb]].map(([a, b]) => UV(a, b));
      if (corners.some(([u, v]) => Math.abs(u - uR(v)) < RW + 0.08)) continue;
      if (corners.some(([u, v]) => inPark(u, v) || inInv(u, v))) continue;
      if (corners.some(([u, v]) => v < 0.13)) continue;
      // now and then a square of trees instead of a block
      if (r.chance(0.035) && vc < 5) {
        for (let k = 0; k < 6; k++) { const [u, v] = UV(a0 + r() * wa, b0 + r() * wb); items.push({ kind: 'tree', u, v, s: G.s(v) }); }
        continue;
      }
      // split the block into lots along a, each its own height
      const n = vc < 3 ? r.int(2, 4) : vc < 5 ? r.int(1, 3) : 1;
      const cuts = [0];
      for (let k = 1; k < n; k++) cuts.push(k / n + r.range(-0.08, 0.08));
      cuts.push(1);
      const zb = r.range(96, 112);
      for (let k = 0; k < n; k++) {
        const la0 = a0 + wa * cuts[k], la1 = a0 + wa * cuts[k + 1];
        const lot = {
          kind: 'lot', a0: la0, a1: la1, b0, b1: b0 + wb,
          z: zb + r.range(-6, 10) + (r.chance(0.08) ? -26 : 0), m: r.range(21, 27), seed: Math.floor(r() * 1e9), tone: r.int(0, 3),
          awning: false, pots: r.int(3, 7),
        };
        const [u, v] = UV((la0 + la1) / 2, b0 + wb / 2);
        lot.u = u; lot.v = v; lot.s = G.s(v);
        items.push(lot);
      }
    }
  }
  // plane trees along the quays, both sides, and round the park
  for (const side of [-1, 1]) {
    for (let v = 0.2; v < 6; v += v < 1 ? 0.07 : v < 3 ? 0.13 : 0.3) {
      if (side < 0 && v < 0.3) continue;
      items.push({ kind: 'tree', u: uR(v) + side * (RW + 0.06), v, s: G.s(v), big: true });
    }
  }
  for (let v = 0.9; v < 2.6; v += 0.1) for (const u of [0.66, 1.72]) items.push({ kind: 'tree', u, v, s: G.s(v), big: true });
  for (let v = 1.0; v < 2.6; v += 0.14) for (const u of [1.1, 1.22]) items.push({ kind: 'tree', u, v, s: G.s(v) });
  // the island's point and its trees
  for (let v = 2.1; v < 2.3; v += 0.05) items.push({ kind: 'tree', u: uR(v) + r.range(-0.05, 0.05), v, s: G.s(v) });

  // the café: the lots that face the quay nearest us take awnings
  const near = items.filter((it) => it.kind === 'lot' && it.v < 0.62 && it.u < 0.25).sort((a, b) => a.u - b.u);
  near.slice(0, 3).forEach((it) => { it.awning = true; CAFES.push(it); });

  for (const it of items) { it.dist = Math.hypot(it.u, it.v + 1 / G.K); }
  // bands from the far end to us; the tower stands between the two layers
  const cutsV = [11, 7.5, 5.6, 4.4, 3.6, 3.0, 2.55, 2.2, 1.9, 1.62, 1.4, TV, 1.06, 0.92, 0.8, 0.68, 0.57, 0.47, 0.38, 0.3, 0.22, 0.1];
  const landmarks = [
    { v: INV[1], fn: invalides, t: 3.2 },
    { v: 2.55, fn: notreDame, t: 4.0 },
  ];
  for (let k = 0; k < cutsV.length - 1; k++) {
    const hi = cutsV[k], lo = cutsV[k + 1];
    const band = items.filter((it) => it.v <= hi && it.v > lo).sort((a, b) => b.dist - a.dist);
    if (!band.length) continue;
    const layer = lo >= TV - 1e-6 ? 'city0' : 'city1';
    const f = k / (cutsV.length - 2);
    const t = layer === 'city0' ? lerp(2.6, 5.0, f / 0.5) : lerp(5.6, 8.2, (f - 0.5) / 0.5);
    const pts = [];
    for (const it of band) {
      const [x, y] = P(it.u, it.v);
      const R = 0.16 * G.U * it.s;
      pts.push([x - R, y + R * 0.4], [x + R, y - (it.kind === 'lot' ? (it.z + it.m + 40) * it.s + R * 0.3 : 60 * it.s)]);
    }
    // each band arrives as a ripple of short chunks, far to near
    const size = layer === 'city1' ? 8 : 22, n = Math.ceil(band.length / size);
    for (let j = 0; j < n; j++) {
      const part = band.slice(j * size, (j + 1) * size), pp = pts.slice(j * size * 2, (j + 1) * size * 2);
      riseGroup(p, layer, boxOf(pp, 4), (c) => {
        for (const it of part) (it.kind === 'lot' ? drawLot : drawTree)(c, it);
      }, { t: t + (j / n) * 0.3, d: 0.55, reveal: 'rise' });
    }
    for (const lm of landmarks) if (lm.v <= hi && lm.v > lo) lm.fn(p, r, lm.t);
  }
}

const fadeAt = (v) => clamp((v - 0.9) / 6.5) ** 0.8 * 0.85;

function drawTree(c, it) {
  const [x, y] = P(it.u, it.v), s = it.s;
  const R = (it.big ? 0.034 : 0.026) * G.U * s;
  const f = fadeAt(it.v);
  c.fillStyle = mix(BLACK, HAZE, f); c.fillRect(x - R * 0.08, y - R * 1.1, R * 0.16, R * 1.1);
  c.fillStyle = mix(LEAF, HAZE, f);
  c.beginPath(); c.ellipse(x, y - R * 1.35, R, R * 0.85, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = mix(LEAF_L, HAZE, f);
  c.beginPath(); c.ellipse(x - R * 0.3, y - R * 1.55, R * 0.6, R * 0.5, 0, 0, Math.PI * 2); c.fill();
}

// a quad on a wall from (s, z) fractions along the bottom edge e0 -> e1
function wallPt(e0, e1, f, z) { return P(lerp(e0[0], e1[0], f), lerp(e0[1], e1[1], f), z); }

function drawLot(c, L) {
  const rr = rng(L.seed);
  const s = L.s, f = fadeAt(L.v);
  const z = L.z, m = L.m, di = 0.016;
  const A = [L.a0, L.a1], B = [L.b0, L.b1];
  const g = (a, b) => UV(a, b);
  // the faces we can see, each from its left end to its right on screen
  const faces = [];
  if (CAM_B < B[0]) faces.push({ e0: g(A[0], B[0]), e1: g(A[1], B[0]), i0: g(A[0] + di, B[0] + di), i1: g(A[1] - di, B[0] + di), lit: false });
  if (CAM_A < A[0]) faces.push({ e0: g(A[0], B[1]), e1: g(A[0], B[0]), i0: g(A[0] + di, B[1] - di), i1: g(A[0] + di, B[0] + di), lit: true });
  if (CAM_A > A[1]) faces.push({ e0: g(A[1], B[0]), e1: g(A[1], B[1]), i0: g(A[1] - di, B[0] + di), i1: g(A[1] - di, B[1] - di), lit: false });
  const tones = [[LIT, SHADOW], ['#f3cfb0', '#9db2ab'], ['#f8e4c4', '#a7b8ae'], ['#efc6ad', '#93a9a8']];
  const [tl, ts] = tones[L.tone || 0];
  const wallLit = mix(tl, HAZE, f), wallSh = mix(ts, HAZE, f);
  const winLit = mix('#3d6b6c', HAZE, f), winSh = mix(TEAL_D, HAZE, f);
  const big = s > 0.3, mid = s > 0.17, tiny = s < 0.135;
  for (const F of faces) {
    const q = [P(...F.e0, 0), P(...F.e1, 0), P(...F.e1, z), P(...F.e0, z)];
    c.fillStyle = F.lit ? wallLit : wallSh; poly(c, q); c.fill();
    const len = Math.hypot(F.e1[0] - F.e0[0], F.e1[1] - F.e0[1]);
    if (mid) {
      // windows: tall French windows, five floors over a shop floor
      const cols = Math.max(2, Math.round(len / 0.03));
      c.fillStyle = F.lit ? winLit : winSh;
      c.beginPath();
      for (let fl = 0; fl < 6; fl++) {
        const z0 = 18 + fl * 14, z1 = z0 + 9.5;
        if (z1 > z - 3) break;
        for (let k = 0; k < cols; k++) {
          const f0 = (k + 0.3) / cols, f1 = (k + 0.7) / cols;
          const a = wallPt(F.e0, F.e1, f0, z0), b = wallPt(F.e0, F.e1, f1, z0), cc = wallPt(F.e0, F.e1, f1, z1), d = wallPt(F.e0, F.e1, f0, z1);
          c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath();
        }
      }
      c.fill();
      // the shop floor: a dark band of shopfronts
      c.fillStyle = mix(F.lit ? '#6d5652' : '#40585a', HAZE, f);
      const sp = [wallPt(F.e0, F.e1, 0.04, 2), wallPt(F.e0, F.e1, 0.96, 2), wallPt(F.e0, F.e1, 0.96, 13), wallPt(F.e0, F.e1, 0.04, 13)];
      poly(c, sp); c.fill();
      if (big) {
        // wrought-iron balconies along the second and fifth floors
        c.strokeStyle = mix(BLACK, HAZE, f); c.lineWidth = Math.max(0.8, 2.2 * s);
        c.beginPath();
        for (const zz of [31, 87]) { if (zz > z - 4) continue; const a = wallPt(F.e0, F.e1, 0.02, zz), b = wallPt(F.e0, F.e1, 0.98, zz); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        c.stroke();
        // a band of stone between the shop and the floors above
        c.strokeStyle = F.lit ? '#fbe8d2' : '#b5c6c0'; c.lineWidth = Math.max(0.8, 2.4 * s);
        c.beginPath(); const a = wallPt(F.e0, F.e1, 0, 15), b = wallPt(F.e0, F.e1, 1, 15); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      }
    } else if (!tiny) {
      c.strokeStyle = F.lit ? mix('#c49a8c', HAZE, f) : mix('#7b9693', HAZE, f); c.lineWidth = Math.max(0.6, 3 * s);
      c.beginPath();
      for (let zz = 22; zz < z - 4; zz += 14) { const a = wallPt(F.e0, F.e1, 0.05, zz), b = wallPt(F.e0, F.e1, 0.95, zz); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
      c.stroke();
    }
    if (tiny) continue;
    // the cornice
    c.strokeStyle = F.lit ? mix('#fff0dc', HAZE, f) : mix('#c3d0c9', HAZE, f); c.lineWidth = Math.max(0.7, 3 * s);
    c.beginPath(); c.moveTo(...P(...F.e0, z)); c.lineTo(...P(...F.e1, z)); c.stroke();
    // a café's striped awning over the quay
    if (L.awning && F.lit) {
      const n = Math.max(6, Math.round(len / 0.012));
      for (let k = 0; k < n; k++) {
        const f0 = 0.05 + (k / n) * 0.9, f1 = 0.05 + ((k + 1) / n) * 0.9;
        const a = wallPt(F.e0, F.e1, f0, 15), b = wallPt(F.e0, F.e1, f1, 15);
        const d = 10 * s;
        c.fillStyle = k % 2 ? CREAM : CORAL;
        poly(c, [a, b, [b[0] - d * 0.9, b[1] + d * 0.7], [a[0] - d * 0.9, a[1] + d * 0.7]]); c.fill();
      }
      const a = wallPt(F.e0, F.e1, 0.05, 15), b = wallPt(F.e0, F.e1, 0.95, 15), d = 10 * s;
      c.strokeStyle = CORAL; c.lineWidth = 2.4 * s;
      c.beginPath(); c.moveTo(a[0] - d * 0.9, a[1] + d * 0.7); c.lineTo(b[0] - d * 0.9, b[1] + d * 0.7); c.stroke();
    }
  }
  // the mansard: a zinc slope over each face, and the flat top
  const top = [g(A[0] + di, B[0] + di), g(A[1] - di, B[0] + di), g(A[1] - di, B[1] - di), g(A[0] + di, B[1] - di)].map(([u, v]) => P(u, v, z + m));
  c.fillStyle = mix(ZINC_T, HAZE, f); poly(c, top); c.fill();
  if (s > 0.2 && L.a1 - L.a0 > 0.05) {
    // a light well down into the courtyard
    const ca = (L.a0 + L.a1) / 2, cb = (L.b0 + L.b1) / 2 + 0.01;
    const cw = (L.a1 - L.a0) * 0.18, ch = 0.018;
    c.fillStyle = mix('#33494c', HAZE, f);
    poly(c, [g(ca - cw, cb - ch), g(ca + cw, cb - ch), g(ca + cw, cb + ch), g(ca - cw, cb + ch)].map(([u, v]) => P(u, v, z + m)));
    c.fill();
    c.fillStyle = mix(tl, HAZE, f);
    poly(c, [g(ca - cw, cb + ch), g(ca + cw, cb + ch), g(ca + cw, cb + ch), g(ca - cw, cb + ch)].map(([u, v], i) => P(u, v, z + m - (i < 2 ? 0 : 12)))); c.fill();
  }
  for (const F of faces) {
    const q = [P(...F.e0, z), P(...F.e1, z), P(...F.i1, z + m), P(...F.i0, z + m)];
    c.fillStyle = mix(F.lit ? ZINC : ZINC_D, HAZE, f); poly(c, q); c.fill();
    if (big) {
      // the seams of the zinc
      const len = Math.hypot(F.e1[0] - F.e0[0], F.e1[1] - F.e0[1]);
      const n = Math.round(len / 0.008);
      c.strokeStyle = F.lit ? 'rgba(80,110,115,.35)' : 'rgba(40,60,66,.35)'; c.lineWidth = Math.max(0.5, 1 * s);
      c.beginPath();
      for (let k = 1; k < n; k++) {
        const a = wallPt(F.e0, F.e1, k / n, z), b = wallPt(F.i0, F.i1, k / n, z + m);
        c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
      }
      c.stroke();
    }
    if (mid) {
      // dormers: little windows standing out of the slope
      const len = Math.hypot(F.e1[0] - F.e0[0], F.e1[1] - F.e0[1]);
      const n = Math.max(1, Math.round(len / 0.03));
      for (let k = 0; k < n; k++) {
        const fc = (k + 0.5) / n, hw = 0.006;
        const mid0 = [lerp(F.e0[0], F.i0[0], 0.3), lerp(F.e0[1], F.i0[1], 0.3)], mid1 = [lerp(F.e1[0], F.i1[0], 0.3), lerp(F.e1[1], F.i1[1], 0.3)];
        const a = wallPt(mid0, mid1, fc - hw / len, z + m * 0.2), b = wallPt(mid0, mid1, fc + hw / len, z + m * 0.2);
        const hgt = m * 0.62 * s;
        c.fillStyle = mix(F.lit ? CREAM : '#c2cfc8', HAZE, f);
        poly(c, [a, b, [b[0], b[1] - hgt], [(a[0] + b[0]) / 2, a[1] - hgt * 1.35], [a[0], a[1] - hgt]]); c.fill();
        if (big) {
          c.fillStyle = mix(TEAL_D, HAZE, f);
          const w = b[0] - a[0];
          poly(c, [[a[0] + w * 0.25, a[1] - hgt * 0.1], [b[0] - w * 0.25, b[1] - hgt * 0.1], [b[0] - w * 0.25, b[1] - hgt * 0.75], [a[0] + w * 0.25, a[1] - hgt * 0.75]]); c.fill();
          c.fillStyle = mix(ZINC_D, HAZE, f);
          poly(c, [[a[0] - 1, a[1] - hgt * 0.95], [(a[0] + b[0]) / 2, a[1] - hgt * 1.45], [b[0] + 1, b[1] - hgt * 0.95], [(a[0] + b[0]) / 2, a[1] - hgt * 1.25]]); c.fill();
        }
      }
    }
  }
  // the chimney stacks on the party walls, with their rows of pots
  if (!tiny) {
    const bm = (B[0] + B[1]) / 2, hb = 0.026, wa = 0.006, zt = z + m + 14;
    const walls = s > 0.25 ? [A[0], A[1]] : [A[0]];
    for (const aw of walls) {
      const q0 = g(aw - wa, bm - hb), q1 = g(aw + wa, bm - hb), q2 = g(aw + wa, bm + hb), q3 = g(aw - wa, bm + hb);
      const fr = [P(...q0, z + m - 4), P(...q1, z + m - 4), P(...q1, zt), P(...q0, zt)];
      const lf = [P(...q3, z + m - 4), P(...q0, z + m - 4), P(...q0, zt), P(...q3, zt)];
      c.fillStyle = mix('#f1cdb0', HAZE, f); poly(c, lf); c.fill();
      c.fillStyle = mix('#c79a8a', HAZE, f); poly(c, fr); c.fill();
      c.fillStyle = mix('#a77d72', HAZE, f); poly(c, [P(...q0, zt), P(...q1, zt), P(...q2, zt), P(...q3, zt)]); c.fill();
      if (s > 0.18) {
        for (let k = 0; k < L.pots; k++) {
          const bb = bm - hb * 0.75 + (k / Math.max(1, L.pots - 1)) * hb * 1.5;
          const [x, y] = P(...g(aw, bb), zt);
          const w = 4.2 * s, h = 8 * s;
          c.fillStyle = mix(k % 3 ? CORAL : '#c9573f', HAZE, f); c.fillRect(x - w / 2, y - h, w, h);
          c.fillStyle = mix(BLACK, HAZE, f); c.fillRect(x - w * 0.6, y - h - 1.4 * s, w * 1.2, 1.8 * s);
        }
      }
    }
  }
}

// ---------------------------------------------------------------- Notre-Dame and the Invalides
function notreDame(p, r, t) {
  const v = 2.55, s = G.s(v), u = uR(v);
  const [x0, y0] = P(u, v);
  const k = 4.5 * s * 2.3; // px per meter
  const X = (x) => x0 + x * k, Y = (y) => y0 - y * k;
  const st = '#f6dcc0', sd = '#d3b39f', dk = TEAL_D;
  riseGroup(p, 'city0', { x: X(-40), y: Y(100), w: 80 * k, h: 102 * k }, (c) => {
    // the nave roof behind, and the spire at the crossing
    c.fillStyle = ZINC_D; poly(c, [[X(-12), Y(33)], [X(12), Y(33)], [X(8), Y(45)], [X(-8), Y(45)]]); c.fill();
    c.fillStyle = BLACK;
    poly(c, [[X(-2.2), Y(45)], [X(2.2), Y(45)], [X(0.4), Y(96)], [X(-0.4), Y(96)]]); c.fill();
    c.fillStyle = MUSTARD; c.fillRect(X(-0.3), Y(98), 0.6 * k, 2 * k);
    // the west front
    c.fillStyle = st; c.fillRect(X(-21), Y(46), 42 * k, 46 * k);
    c.fillStyle = sd; c.fillRect(X(9), Y(46), 12 * k, 46 * k);
    // the towers
    for (const cx of [-14, 14]) {
      c.fillStyle = cx > 0 ? sd : st; c.fillRect(X(cx - 7), Y(69), 14 * k, 23 * k);
      c.fillStyle = dk;
      for (const dx of [-3.2, 1.2]) { c.beginPath(); c.moveTo(X(cx + dx), Y(50)); c.lineTo(X(cx + dx), Y(63)); c.lineTo(X(cx + dx + 1), Y(65)); c.lineTo(X(cx + dx + 2), Y(63)); c.lineTo(X(cx + dx + 2), Y(50)); c.fill(); }
      c.fillStyle = cx > 0 ? '#c4a593' : '#e8cbb2'; c.fillRect(X(cx - 7.4), Y(69.5), 14.8 * k, 1.4 * k);
    }
    // the gallery of chimeras: an open arcade across the front
    c.fillStyle = dk;
    for (let i = 0; i < 14; i++) { const x = -20 + i * 2.95; c.fillRect(X(x + 0.5), Y(45), 1.6 * k, 4 * k); }
    // the rose and the side windows
    c.fillStyle = st; c.beginPath(); c.arc(X(0), Y(33), 6.5 * k, 0, Math.PI * 2); c.fill();
    c.fillStyle = dk; c.beginPath(); c.arc(X(0), Y(33), 5.6 * k, 0, Math.PI * 2); c.fill();
    c.strokeStyle = st; c.lineWidth = Math.max(0.6, 0.5 * k); c.beginPath();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.moveTo(X(0), Y(33)); c.lineTo(X(Math.cos(a) * 5.6), Y(33 + Math.sin(a) * 5.6)); }
    c.stroke(); c.beginPath(); c.arc(X(0), Y(33), 2.2 * k, 0, Math.PI * 2); c.stroke();
    for (const cx of [-14, 14]) for (const dx of [-2.4, 0.6]) {
      c.fillStyle = dk; c.beginPath(); c.moveTo(X(cx + dx), Y(26)); c.lineTo(X(cx + dx), Y(36)); c.lineTo(X(cx + dx + 0.9), Y(38)); c.lineTo(X(cx + dx + 1.8), Y(36)); c.lineTo(X(cx + dx + 1.8), Y(26)); c.fill();
    }
    // the gallery of kings, then the three portals
    c.fillStyle = sd; c.fillRect(X(-21), Y(24), 42 * k, 2.4 * k);
    c.fillStyle = dk;
    for (let i = 0; i < 28; i++) c.fillRect(X(-20 + i * 1.45), Y(23.6), 0.6 * k, 1.8 * k);
    for (const [cx, w, h] of [[-14, 4, 15], [0, 5, 17], [14, 4, 15]]) {
      c.beginPath(); c.moveTo(X(cx - w), Y(0)); c.lineTo(X(cx - w), Y(h - w)); c.quadraticCurveTo(X(cx - w), Y(h), X(cx), Y(h + w * 0.4));
      c.quadraticCurveTo(X(cx + w), Y(h), X(cx + w), Y(h - w)); c.lineTo(X(cx + w), Y(0)); c.fill();
    }
    // buttresses
    c.fillStyle = sd;
    for (const x of [-21, -7.5, 6.3, 19.8]) c.fillRect(X(x), Y(44), 1.2 * k, 44 * k);
  }, { t, d: 1.3, reveal: 'rise', ease: 'inOut' });
}

function invalides(p, r, t) {
  const [u, v] = INV, s = G.s(v);
  const [x0, y0] = P(u, v);
  const k = 4.5 * s * 2.6;
  const X = (x) => x0 + x * k, Y = (y) => y0 - y * k;
  const st = '#f3d6bc', sd = '#cdab9b';
  riseGroup(p, 'city0', { x: X(-80), y: Y(112), w: 160 * k, h: 114 * k }, (c) => {
    // the long hospital front, low and even
    c.fillStyle = ZINC_D; c.fillRect(X(-75), Y(24), 150 * k, 6 * k);
    c.fillStyle = st; c.fillRect(X(-75), Y(18), 150 * k, 18 * k);
    c.fillStyle = '#b48f86';
    for (let i = 0; i < 24; i++) c.fillRect(X(-72 + i * 6.2), Y(14), 2 * k, 5 * k);
    // the church block and its portico
    c.fillStyle = st; c.fillRect(X(-28), Y(34), 56 * k, 34 * k);
    c.fillStyle = sd; c.fillRect(X(12), Y(34), 16 * k, 34 * k);
    c.fillStyle = '#b48f86'; for (let i = 0; i < 8; i++) c.fillRect(X(-14 + i * 3.6), Y(28), 1.4 * k, 22 * k);
    c.fillStyle = st; poly(c, [[X(-16), Y(34)], [X(16), Y(34)], [X(0), Y(42)]]); c.fill();
    // the drum, two stages with columns
    c.fillStyle = st; c.fillRect(X(-17), Y(58), 34 * k, 24 * k);
    c.fillStyle = sd; c.fillRect(X(6), Y(58), 11 * k, 24 * k);
    c.fillStyle = '#b48f86'; for (let i = 0; i < 9; i++) c.fillRect(X(-15.5 + i * 3.7), Y(56), 1.3 * k, 18 * k);
    c.fillStyle = st; c.fillRect(X(-14), Y(64), 28 * k, 6 * k);
    // the gilded dome, ribbed
    const dy = 64, dh = 30, dw = 14.5;
    c.fillStyle = MUSTARD; c.beginPath(); c.moveTo(X(-dw), Y(dy));
    c.bezierCurveTo(X(-dw), Y(dy + dh * 0.7), X(-dw * 0.5), Y(dy + dh), X(0), Y(dy + dh));
    c.bezierCurveTo(X(dw * 0.5), Y(dy + dh), X(dw), Y(dy + dh * 0.7), X(dw), Y(dy)); c.closePath(); c.fill();
    c.save(); c.clip();
    c.fillStyle = '#b77e2a'; c.fillRect(X(3), Y(dy + dh), dw * k, dh * k);
    c.strokeStyle = '#8f5f22'; c.lineWidth = Math.max(0.7, 0.45 * k); c.beginPath();
    for (let i = -4; i <= 4; i++) { c.moveTo(X(i * dw / 4.6), Y(dy)); c.quadraticCurveTo(X(i * dw / 5.5), Y(dy + dh * 0.8), X(0), Y(dy + dh)); }
    c.stroke();
    c.fillStyle = '#f6d27a'; c.fillRect(X(-dw * 0.75), Y(dy + dh * 0.5), 2 * k, 10 * k);
    c.restore();
    // the lantern and its spire
    c.fillStyle = MUSTARD; c.fillRect(X(-2.5), Y(dy + dh + 9), 5 * k, 9 * k);
    c.fillStyle = '#b77e2a'; c.fillRect(X(0.5), Y(dy + dh + 9), 2 * k, 9 * k);
    c.fillStyle = MUSTARD; poly(c, [[X(-2.5), Y(dy + dh + 9)], [X(2.5), Y(dy + dh + 9)], [X(0), Y(dy + dh + 19)]]); c.fill();
  }, { t, d: 1.2, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- the tower
const TX = 1130, TB = G.y(TV) + 2, TT = 56, HM = 330;
const tY = (m) => TB - (TB - TT) * (m / HM) ** 0.84;
const tK = (m) => 6.8 * (1 - 0.36 * (m / HM));
function interp(tab, m) {
  if (m <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) {
    if (m <= tab[i][0]) {
      const [m0, a] = tab[i - 1], [m1, b] = tab[i];
      const f = (m - m0) / (m1 - m0);
      return Math.exp(lerp(Math.log(Math.max(a, 0.01)), Math.log(Math.max(b, 0.01)), f));
    }
  }
  return tab[tab.length - 1][1];
}
const OUT = [[0, 62.5], [57, 35.3], [115, 20.4], [180, 12.2], [230, 8.8], [276, 6.6], [290, 5.5], [305, 3.2], [330, 0.5]];
const INN = [[0, 37], [57, 21], [115, 10], [160, 3.5], [178, 0.01]];
const tO = (m, side) => [TX + side * interp(OUT, m) * tK(m), tY(m) - (m === 0 ? 36 : 0)];
const tI = (m, side) => [TX + side * (m >= 178 ? 0 : interp(INN, m)) * tK(m), tY(m) - (m === 0 ? 36 : 0)];

function tower(p, r) {
  const IRON = '#2b2220';
  const LEGM = [0, 7, 15, 24, 34, 45, 57, 68, 80, 92, 104, 115, 128, 142, 158, 178];
  const SHAFT = [178, 192, 207, 222, 238, 254, 268, 276];

  // the stone feet the legs stand on
  p.group('tower', { x: TX - 470, y: TB - 60, w: 940, h: 80 }, (c) => {
    for (const side of [-1, 1]) {
      const o = tO(0, side), n = tI(0, side);
      const x0 = Math.min(o[0], n[0]) - 14, x1 = Math.max(o[0], n[0]) + 14;
      c.fillStyle = '#e9cdb4'; c.fillRect(x0, TB - 34, x1 - x0, 40);
      c.fillStyle = '#b99d93'; c.fillRect(x0 + (x1 - x0) * 0.62, TB - 34, (x1 - x0) * 0.38, 40);
      c.fillStyle = '#f6e2cb'; c.fillRect(x0 - 5, TB - 40, x1 - x0 + 10, 8);
      c.fillStyle = 'rgba(120,90,80,.35)'; for (let y = TB - 24; y < TB + 6; y += 9) c.fillRect(x0, y, x1 - x0, 1.6);
      c.fillStyle = TEAL_D; c.fillRect((x0 + x1) / 2 - 8, TB - 22, 16, 28);
    }
  }, { t: 3.7, d: 0.8, reveal: 'rise' });
  // the legs drawn up from the ground, outside and inside edges
  for (const side of [-1, 1]) {
    const outer = [], inner = [];
    for (let m = 0; m <= 178; m += 3) { outer.push(tO(m, side)); inner.push(tI(m, side)); }
    p.pen('tower', outer, IRON, 7, { t: 3.9 + (side > 0 ? 0.15 : 0), d: 1.8 });
    p.pen('tower', inner, IRON, 5, { t: 4.1 + (side > 0 ? 0.15 : 0), d: 1.7 });
  }
  // the leg faces: tinted with the sky behind, then their lattice in sections
  const legFace = (side, m0, m1) => {
    const pts = [];
    for (let m = m0; m <= m1 + 1e-6; m += 2) pts.push(tO(m, side));
    for (let m = m1; m >= m0 - 1e-6; m -= 2) pts.push(tI(m, side));
    return pts;
  };
  const lattice = (c, side, levels, lw) => {
    c.strokeStyle = IRON; c.lineCap = 'round';
    for (let i = 0; i < levels.length - 1; i++) {
      const m0 = levels[i], m1 = levels[i + 1];
      const o0 = tO(m0, side), o1 = tO(m1, side), n0 = tI(m0, side), n1 = tI(m1, side);
      const w = lw * tK(m0) / 6.8;
      c.lineWidth = w * 1.3; c.beginPath(); c.moveTo(...o0); c.lineTo(...n0); c.stroke();
      // the big cross, doubled
      c.lineWidth = w; c.beginPath();
      for (const d of [-1.2, 1.2]) { c.moveTo(o0[0], o0[1] + d); c.lineTo(n1[0], n1[1] + d); c.moveTo(n0[0], n0[1] + d); c.lineTo(o1[0], o1[1] + d); }
      c.stroke();
      // the small lattice inside each girder: zigzags along the cross
      c.lineWidth = Math.max(0.6, w * 0.4); c.beginPath();
      for (const [a, b] of [[o0, n1], [n0, o1]]) {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(3, Math.round(len / 9));
        const nx = -(b[1] - a[1]) / len * 2.6, ny = (b[0] - a[0]) / len * 2.6;
        for (let k = 0; k <= n; k++) {
          const f = k / n, x = lerp(a[0], b[0], f) + (k % 2 ? nx : -nx), y = lerp(a[1], b[1], f) + (k % 2 ? ny : -ny);
          k ? c.lineTo(x, y) : c.moveTo(x, y);
        }
      }
      c.stroke();
      // and along the corner posts
      c.beginPath();
      for (const [a, b] of [[o0, o1], [n0, n1]]) {
        const n = Math.max(2, Math.round(Math.abs(b[1] - a[1]) / 7));
        for (let k = 0; k <= n; k++) {
          const f = k / n, x = lerp(a[0], b[0], f) + (k % 2 ? 3 : -3) * side, y = lerp(a[1], b[1], f);
          k ? c.lineTo(x, y) : c.moveTo(x, y);
        }
      }
      c.stroke();
    }
  };
  // the back legs, seen through the arch, pale with distance
  p.group('tower', { x: TX - 440, y: tY(180), w: 880, h: TB - tY(180) + 4 }, (c) => {
    c.strokeStyle = 'rgba(43,34,32,.28)'; c.lineWidth = 3;
    for (const side of [-1, 1]) {
      c.beginPath();
      for (let m = 44; m <= 178; m += 4) { const [x, y] = tI(m, side); const xx = TX + (x - TX) * 0.55; m > 44 ? c.lineTo(xx, y - 6) : c.moveTo(xx, y - 6); }
      c.stroke();
    }
    c.lineWidth = 1.4; c.beginPath();
    for (let i = 6; i < LEGM.length - 1; i++) {
      const a = tI(LEGM[i], -1), b = tI(LEGM[i + 1], 1);
      const ax = TX + (a[0] - TX) * 0.55, bx = TX + (b[0] - TX) * 0.55;
      c.moveTo(ax, a[1] - 6); c.lineTo(bx, b[1] - 6); c.moveTo(TX - (ax - TX), a[1] - 6); c.lineTo(TX - (bx - TX), b[1] - 6);
    }
    c.stroke();
  }, { t: 4.3, d: 1.0, reveal: 'fade' });
  const sections = [[0, 57, 4.5], [57, 115, 5.2], [115, 178, 5.9]];
  for (const [m0, m1, t] of sections) {
    const lv = LEGM.filter((m) => m >= m0 && m <= m1);
    const top = tY(m1), bot = tY(m0);
    p.group('tower', { x: TX - 470, y: top - 6, w: 940, h: bot - top + 12 }, (c) => {
      for (const side of [-1, 1]) {
        c.fillStyle = side < 0 ? 'rgba(22,69,74,.22)' : 'rgba(22,40,44,.34)'; poly(c, legFace(side, m0, m1)); c.fill();
        lattice(c, side, lv, 3.4);
        // the sun catches the outer edge of the left leg
        if (side < 0) {
          c.strokeStyle = CORAL; c.lineWidth = 2.2; c.beginPath();
          for (let m = m0; m <= m1; m += 3) { const [x, y] = tO(m, side); m === m0 ? c.moveTo(x + 4, y) : c.lineTo(x + 4, y); }
          c.stroke();
        }
      }
    }, { t, d: 0.9, reveal: 'rise' });
  }
  // the great arch under the first floor
  const arch = [];
  const aL = tI(10, -1), aR = tI(10, 1), apex = tY(41);
  for (let k = 0; k <= 40; k++) {
    const f = k / 40 * 2 - 1;
    arch.push([lerp(aL[0], aR[0], (f + 1) / 2), aL[1] - (aL[1] - apex) * Math.sqrt(1 - f * f)]);
  }
  p.pen('tower', arch, IRON, 8, { t: 5.0, d: 1.2 });
  p.group('tower', boxOf(arch, 26), (c) => {
    // the spandrels above the arch, worked in rings
    c.strokeStyle = IRON; c.lineWidth = 2;
    c.beginPath(); arch.forEach(([x, y], i) => (i ? c.lineTo(x, y - 18) : c.moveTo(x, y - 18))); c.stroke();
    c.lineWidth = 1.4;
    for (let k = 2; k < 40; k += 2) {
      const [x, y] = arch[k];
      c.beginPath(); c.arc(x, y - 9, 5.5, 0, Math.PI * 2); c.stroke();
    }
    c.beginPath();
    for (let k = 0; k <= 40; k += 4) { const [x, y] = arch[k]; c.moveTo(x, y - 18); c.lineTo(x, tY(57)); }
    c.stroke();
  }, { t: 5.6, d: 0.8, reveal: 'fade' });

  // the shaft, where the legs have met
  const shaftL = [], shaftR = [];
  for (let m = 178; m <= 276; m += 3) { shaftL.push(tO(m, -1)); shaftR.push(tO(m, 1)); }
  p.pen('tower', shaftL, IRON, 5, { t: 6.0, d: 1.3 });
  p.pen('tower', shaftR, IRON, 5, { t: 6.05, d: 1.3 });
  p.group('tower', { x: TX - 120, y: tY(276) - 4, w: 240, h: tY(178) - tY(276) + 8 }, (c) => {
    const face = [...shaftL, ...shaftR.slice().reverse()];
    c.fillStyle = 'rgba(22,69,74,.3)'; poly(c, face); c.fill();
    c.strokeStyle = IRON;
    for (let i = 0; i < SHAFT.length - 1; i++) {
      const a = tO(SHAFT[i], -1), b = tO(SHAFT[i], 1), a1 = tO(SHAFT[i + 1], -1), b1 = tO(SHAFT[i + 1], 1);
      c.lineWidth = 2.4; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke();
      c.lineWidth = 1.7; c.beginPath();
      c.moveTo(...a); c.lineTo(...b1); c.moveTo(...b); c.lineTo(...a1);
      c.moveTo((a[0] + b[0]) / 2, a[1]); c.lineTo((a1[0] + b1[0]) / 2, a1[1]);
      c.stroke();
      c.lineWidth = 0.8; c.beginPath();
      const n = 6;
      for (let k = 1; k < n; k++) { const f = k / n; const y = lerp(a[1], a1[1], f); const xl = lerp(a[0], a1[0], f), xr = lerp(b[0], b1[0], f); c.moveTo(xl, y); c.lineTo(xr, y); }
      c.stroke();
    }
    c.strokeStyle = CORAL; c.lineWidth = 1.6; c.beginPath();
    shaftL.forEach(([x, y], i) => (i ? c.lineTo(x + 3, y) : c.moveTo(x + 3, y))); c.stroke();
  }, { t: 6.6, d: 0.9, reveal: 'rise' });

  // the floors
  const floor = (m, h, over, kind) => {
    const y1 = tY(m), y0 = tY(m + h);
    const hw = interp(OUT, m) * tK(m) + over;
    return { y0, y1, hw, kind };
  };
  const F1 = floor(57, 8, 22), F2 = floor(115, 5, 14), F3 = floor(276, 8, 5);
  p.group('tower', { x: TX - F1.hw - 10, y: F1.y0 - 30, w: 2 * F1.hw + 20, h: F1.y1 - F1.y0 + 40 }, (c) => {
    const { y0, y1, hw } = F1;
    c.fillStyle = IRON; c.fillRect(TX - hw, y0, 2 * hw, y1 - y0);
    // its frieze of arches
    c.fillStyle = MUSTARD;
    const n = 26, aw = (2 * hw - 16) / n;
    for (let i = 0; i < n; i++) {
      const x = TX - hw + 8 + i * aw + aw * 0.18, w = aw * 0.64, yb = y1 - 5, yt = y0 + 6;
      c.beginPath(); c.moveTo(x, yb); c.lineTo(x, yt + w / 2); c.arc(x + w / 2, yt + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, yb); c.fill();
    }
    // the rail, and the pavilions on the floor
    c.strokeStyle = IRON; c.lineWidth = 1.4; c.beginPath(); c.moveTo(TX - hw, y0 - 9); c.lineTo(TX + hw, y0 - 9);
    for (let x = TX - hw; x <= TX + hw; x += 6) { c.moveTo(x, y0); c.lineTo(x, y0 - 9); }
    c.stroke();
    c.fillStyle = CREAM; c.fillRect(TX - hw * 0.62, y0 - 22, hw * 0.34, 13); c.fillRect(TX + hw * 0.28, y0 - 22, hw * 0.34, 13);
    c.fillStyle = TEAL_D;
    for (let i = 0; i < 7; i++) { c.fillRect(TX - hw * 0.6 + i * hw * 0.047, y0 - 19, hw * 0.025, 7); c.fillRect(TX + hw * 0.3 + i * hw * 0.047, y0 - 19, hw * 0.025, 7); }
  }, { t: 5.8, d: 0.8, reveal: 'drop', dy: 30 });
  p.group('tower', { x: TX - F2.hw - 10, y: F2.y0 - 26, w: 2 * F2.hw + 20, h: F2.y1 - F2.y0 + 34 }, (c) => {
    const { y0, y1, hw } = F2;
    c.fillStyle = IRON; c.fillRect(TX - hw, y0, 2 * hw, y1 - y0);
    c.fillStyle = MUSTARD; for (let x = TX - hw + 5; x < TX + hw - 6; x += 9) c.fillRect(x, y0 + 3, 5, y1 - y0 - 6);
    c.strokeStyle = IRON; c.lineWidth = 1.2; c.beginPath(); c.moveTo(TX - hw, y0 - 7); c.lineTo(TX + hw, y0 - 7);
    for (let x = TX - hw; x <= TX + hw; x += 5) { c.moveTo(x, y0); c.lineTo(x, y0 - 7); }
    c.stroke();
    c.fillStyle = CREAM; c.fillRect(TX - hw * 0.5, y0 - 18, hw, 11);
    c.fillStyle = TEAL_D; for (let x = TX - hw * 0.45; x < TX + hw * 0.45; x += 7) c.fillRect(x, y0 - 15, 3.5, 6);
  }, { t: 6.5, d: 0.7, reveal: 'drop', dy: 26 });
  p.group('tower', { x: TX - 40, y: tY(330) - 6, w: 80, h: F3.y1 - tY(330) + 12 }, (c) => {
    const { y0, y1, hw } = F3;
    // the top floor's cabin, the lantern, and the mast
    c.fillStyle = IRON; c.fillRect(TX - hw, y0, 2 * hw, y1 - y0);
    c.fillStyle = MUSTARD; for (let x = TX - hw + 3; x < TX + hw - 3; x += 6) c.fillRect(x, y0 + 3, 3, y1 - y0 - 6);
    const yl = tY(292);
    c.fillStyle = IRON; poly(c, [[TX - hw * 0.7, y0], [TX + hw * 0.7, y0], [TX + 7, yl], [TX - 7, yl]]); c.fill();
    c.beginPath(); c.arc(TX, yl, 8, Math.PI, 0); c.fill();
    c.fillStyle = CREAM; c.fillRect(TX - 4, yl - 4, 3, 4);
    c.strokeStyle = IRON; c.lineWidth = 3; c.beginPath(); c.moveTo(TX, yl - 8); c.lineTo(TX, tY(330)); c.stroke();
    c.strokeStyle = CREAM; c.lineWidth = 3;
    c.beginPath(); for (let m = 300; m < 328; m += 6) { c.moveTo(TX, tY(m)); c.lineTo(TX, tY(m + 2.5)); } c.stroke();
  }, { t: 7.3, d: 0.9, reveal: 'rise' });
}

// ---------------------------------------------------------------- Pont Alexandre III
function bridge(p, r) {
  const v = 0.52, s = G.s(v), y = G.y(v);
  const xl = P(uR(v) - RW - 0.05, v)[0], xr = P(uR(v) + RW + 0.05, v)[0];
  const k = s * 4.5 * 1.7; // px per meter
  const deck = y - 11 * k, mid = (xl + xr) / 2;
  const archTop = deck + 1.6 * k, spring = y - 1 * k;
  const stone = '#f3dcc2', stoneD = '#cfae99', steel = TEAL_D;
  const xa = xl + 9 * k, xb = xr - 9 * k; // where the arch springs
  // the deck: its far parapet, the roadway, the near face
  p.group('bridge', { x: xl - 10, y: deck - 30, w: xr - xl + 20, h: y - deck + 40 }, (c) => {
    c.fillStyle = mix(STREET, CREAM, 0.3); poly(c, [[xl, deck - 5 * k], [xr, deck - 5 * k], [xr - 6, deck - 12 * k], [xl + 6, deck - 12 * k]]); c.fill();
    c.fillStyle = steel; c.fillRect(xl, deck - 14 * k, xr - xl, 2.2 * k);
    // the arch: one flat steel span, its ribs and its rings
    c.fillStyle = steel;
    c.beginPath(); c.moveTo(xa, spring);
    c.quadraticCurveTo(mid, archTop - (spring - archTop) * 0.98, xb, spring);
    c.lineTo(xb, deck); c.lineTo(xa, deck); c.closePath(); c.fill();
    c.fillStyle = mix(TEAL, steel, 0.4);
    c.beginPath(); c.moveTo(xa, spring); c.quadraticCurveTo(mid, archTop - (spring - archTop) * 0.98, xb, spring);
    c.quadraticCurveTo(mid, archTop + (spring - archTop) * 0.2 - (spring - archTop) * 0.98, xa, spring); c.fill();
    // rings in the spandrels, as on the real bridge
    c.strokeStyle = MUSTARD; c.lineWidth = Math.max(1, 0.5 * k);
    for (let x = xa + 12; x < xb - 10; x += 3.2 * k) {
      const f = (x - xa) / (xb - xa), ay = spring - (spring - archTop) * 4 * f * (1 - f) * 0.99;
      const rad = Math.min(1.3 * k, (ay - deck) * 0.36);
      if (rad > 1.2) { c.beginPath(); c.arc(x, (ay + deck) / 2, rad, 0, Math.PI * 2); c.stroke(); }
    }
    // the garlands and the keystone shell in gold
    c.fillStyle = MUSTARD; c.beginPath(); c.arc(mid, deck + 2.2 * k, 2.2 * k, 0, Math.PI * 2); c.fill();
    c.strokeStyle = MUSTARD; c.lineWidth = Math.max(1.2, 0.6 * k);
    for (let i = 0; i < 12; i++) {
      const x0 = lerp(xa, xb, i / 12), x1 = lerp(xa, xb, (i + 1) / 12);
      c.beginPath(); c.moveTo(x0, deck + 0.6 * k); c.quadraticCurveTo((x0 + x1) / 2, deck + 2.4 * k, x1, deck + 0.6 * k); c.stroke();
    }
    // the parapet and its balusters
    c.fillStyle = stone; c.fillRect(xl, deck - 3.6 * k, xr - xl, 3.6 * k);
    c.fillStyle = stoneD;
    for (let x = xl + 4; x < xr - 4; x += 1.4 * k) c.fillRect(x, deck - 2.8 * k, 0.6 * k, 2 * k);
    c.fillStyle = stone; c.fillRect(xl, deck - 3.9 * k, xr - xl, 0.9 * k);
    // the abutments
    for (const [x0, x1] of [[xl, xa], [xb, xr]]) {
      c.fillStyle = stone; c.fillRect(x0, deck, x1 - x0, y - deck);
      c.fillStyle = stoneD; c.fillRect((x0 + x1) / 2, deck, (x1 - x0) / 2, y - deck);
      c.fillStyle = 'rgba(120,90,80,.4)'; for (let yy = deck + 2 * k; yy < y; yy += 1.6 * k) c.fillRect(x0, yy, x1 - x0, 0.3 * k);
    }
  }, { t: 8.3, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // the four pylons, two seen, each with its gilded horse
  const pylon = (cx, t, dir) => {
    const pw = 3.4 * k, ph = 24 * k, top = deck - ph;
    p.group('bridge', { x: cx - pw * 3, y: top - 14 * k, w: pw * 6, h: y - top + 16 * k }, (c) => {
      c.fillStyle = stone; c.fillRect(cx - pw * 1.5, deck - 6 * k, pw * 3, 6 * k + (y - deck));
      c.fillStyle = stoneD; c.fillRect(cx + pw * 0.2, deck - 6 * k, pw * 1.3, 6 * k + (y - deck));
      // the column, its bands and its cap
      c.fillStyle = stone; c.fillRect(cx - pw / 2, top, pw, ph - 6 * k);
      c.fillStyle = stoneD; c.fillRect(cx + pw * 0.1, top, pw * 0.4, ph - 6 * k);
      c.fillStyle = stone;
      for (const yy of [deck - 9 * k, top + 4 * k]) c.fillRect(cx - pw * 0.75, yy, pw * 1.5, 1.2 * k);
      c.fillRect(cx - pw * 0.85, top - 0.8 * k, pw * 1.7, 1.6 * k);
      // the gilded figure and horse on top
      c.fillStyle = MUSTARD;
      const hx = cx, hy = top - 0.8 * k;
      c.beginPath();
      c.moveTo(hx - 2.6 * k * dir, hy); c.lineTo(hx - 2.2 * k * dir, hy - 3 * k); c.lineTo(hx - 3.2 * k * dir, hy - 5 * k); // tail
      c.lineTo(hx - 1.2 * k * dir, hy - 4.6 * k); c.lineTo(hx + 1.6 * k * dir, hy - 5.2 * k); // back
      c.lineTo(hx + 3 * k * dir, hy - 8 * k); c.lineTo(hx + 3.8 * k * dir, hy - 7.2 * k); // neck, head
      c.lineTo(hx + 2.8 * k * dir, hy - 4 * k); c.lineTo(hx + 2.8 * k * dir, hy); c.lineTo(hx + 2 * k * dir, hy);
      c.lineTo(hx + 1.6 * k * dir, hy - 2.4 * k); c.lineTo(hx - 1.4 * k * dir, hy - 2.4 * k); c.lineTo(hx - 1.8 * k * dir, hy); c.closePath(); c.fill();
      // the wings, raised
      poly(c, [[hx - 0.6 * k * dir, hy - 4.8 * k], [hx - 3 * k * dir, hy - 11 * k], [hx - 1.6 * k * dir, hy - 10.4 * k], [hx + 0.6 * k * dir, hy - 5 * k]]); c.fill();
      // the rider holding up the horse
      c.fillRect(hx - 0.5 * k, hy - 9.5 * k, 1 * k, 4.8 * k);
      c.beginPath(); c.arc(hx, hy - 10.3 * k, 0.8 * k, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#b77e2a'; c.fillRect(hx + 0.1 * k, hy - 9.5 * k, 0.4 * k, 4.8 * k);
    }, { t, d: 0.9, reveal: 'rise', ease: 'inOut' });
  };
  pylon(xl + 3.5 * k, 9.0, 1);
  pylon(xr - 3.5 * k, 9.2, -1);
  // the lamps along the parapet, dropped in one after another
  const lamps = [];
  for (let i = 1; i < 8; i++) lamps.push(lerp(xl + 9 * k, xr - 9 * k, i / 8));
  p.group('bridge', { x: xl, y: deck - 14 * k, w: xr - xl, h: 12 * k }, (c) => {
    for (const x of lamps) {
      c.fillStyle = BLACK; c.fillRect(x - 0.3 * k, deck - 10 * k, 0.6 * k, 6.5 * k);
      c.fillRect(x - 1.6 * k, deck - 9.4 * k, 3.2 * k, 0.35 * k);
      c.fillStyle = CREAM;
      for (const dx of [-1.6, 0, 1.6]) { c.beginPath(); c.arc(x + dx * k, deck - (dx ? 10 : 11) * k, 0.75 * k, 0, Math.PI * 2); c.fill(); }
    }
  }, { t: 9.5, d: 0.7, reveal: 'drop', dy: 14 });
  // people crossing, seen over the parapet
  const rr = rng(51), walkers = [];
  for (let i = 0; i < 11; i++) walkers.push([lerp(xl + 14 * k, xr - 14 * k, rr()), rr.pick([BLACK, CORAL, TEAL_D, CREAM, MUSTARD]), rr.range(0.9, 1.1)]);
  p.group('bridge', { x: xl, y: deck - 14 * k, w: xr - xl, h: 12 * k }, (c) => {
    for (const [x, col, h0] of walkers) {
      const h = 6.5 * k * h0, yb = deck - 4 * k;
      c.fillStyle = col; c.fillRect(x - h * 0.16, yb - h * 0.75, h * 0.32, h * 0.75);
      c.fillStyle = '#e9b59a'; c.beginPath(); c.arc(x, yb - h * 0.87, h * 0.12, 0, Math.PI * 2); c.fill();
      if (col === CORAL) { c.fillStyle = BLACK; c.beginPath(); c.ellipse(x, yb - h * 0.97, h * 0.2, h * 0.06, 0, 0, Math.PI * 2); c.fill(); }
    }
  }, { t: 9.8, d: 0.6, reveal: 'fade' });
}

// ---------------------------------------------------------------- people
function people(p, r) {
  // walkers on the quays and the bridge, and the café's tables
  const folk = [];
  for (let i = 0; i < 70; i++) {
    const side = r.chance(0.5) ? -1 : 1;
    const v = r.range(0.25, 2.2) ** 1.2;
    if (side < 0 && v < 0.35) continue;
    folk.push({ u: uR(v) + side * (RW + 0.025 + r.range(-0.012, 0.012)), v, col: r.pick([BLACK, BLACK, CORAL, TEAL_D, CREAM, MUSTARD]) });
  }
      folk.sort((a, b) => b.v - a.v);
  const pts = folk.map(({ u, v }) => P(u, v));
  // the café tables out on the pavement, under the awnings
  const tables = [];
  CAFES.forEach((L) => {
    const n = 5;
    for (let k = 0; k < n; k++) {
      const b = lerp(L.b1, L.b0, (k + 0.5) / n), [u, v] = UV(L.a0 - 0.022, b);
      tables.push({ u, v, sit: [k % 2 ? CORAL : BLACK, k % 3 ? CREAM : TEAL_D] });
    }
  });
  if (tables.length) {
    tables.sort((a, b) => b.v - a.v);
    p.group('people', boxOf(tables.map(({ u, v }) => P(u, v)), 30), (c) => {
      for (const t of tables) {
        const [x, y] = P(t.u, t.v), s = G.s(t.v), h = 15 * s;
        for (const [dx, col] of [[-0.42, t.sit[0]], [0.42, t.sit[1]]]) {
          c.fillStyle = col; c.fillRect(x + dx * h - h * 0.13, y - h * 0.68, h * 0.26, h * 0.42);
          c.fillStyle = '#e9b59a'; c.beginPath(); c.arc(x + dx * h, y - h * 0.78, h * 0.11, 0, Math.PI * 2); c.fill();
          c.fillStyle = BLACK; c.fillRect(x + dx * h - h * 0.12, y - h * 0.28, h * 0.24, h * 0.28);
        }
        c.fillStyle = BLACK; c.fillRect(x - h * 0.03, y - h * 0.4, h * 0.06, h * 0.4);
        c.fillStyle = CREAM; c.beginPath(); c.ellipse(x, y - h * 0.42, h * 0.26, h * 0.08, 0, 0, Math.PI * 2); c.fill();
      }
    }, { t: 9.6, d: 0.7, reveal: 'fade' });
  }
  p.group('people', boxOf(pts, 20), (c) => {
    for (const f of folk) {
      const [x, y] = P(f.u, f.v), s = G.s(f.v), h = 15 * s;
      c.fillStyle = f.col; c.fillRect(x - h * 0.17, y - h * 0.82, h * 0.34, h * 0.62);
      c.fillStyle = BLACK; c.fillRect(x - h * 0.12, y - h * 0.22, h * 0.09, h * 0.22); c.fillRect(x + h * 0.03, y - h * 0.22, h * 0.09, h * 0.22);
      c.fillStyle = '#e9b59a'; c.beginPath(); c.arc(x, y - h * 0.92, h * 0.12, 0, Math.PI * 2); c.fill();
    }
  }, { t: 9.8, d: 0.8, reveal: 'fade' });
}

// ---------------------------------------------------------------- what moves
function life(p, r) {
  // long flat clouds in the evening sky, drifting
  const clouds = [[180, 640, 300, 1], [660, 560, 220, 0.7], [1320, 470, 260, 0.9], [460, 820, 380, 1.1], [1380, 760, 200, 0.6], [880, 860, 300, 0.8]];
  p.live('clouds', {
    t: 1.6, d: 1.4, reveal: 'fade',
    draw: (c, time) => {
      clouds.forEach(([x0, y, w, sp], i) => {
        const x = ((x0 + time * 4 * sp + 400) % 2000) - 200;
        const h = 16 + w * 0.03;
        c.fillStyle = i % 2 ? 'rgba(245,201,172,.9)' : 'rgba(244,230,200,.85)';
        c.beginPath(); c.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(x + w * 0.12, y - h * 0.55, w * 0.3, h * 0.45, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(232,103,79,.28)';
        c.beginPath(); c.ellipse(x + w * 0.05, y + h * 0.3, w * 0.42, h * 0.22, 0, 0, Math.PI * 2); c.fill();
      });
    },
  });
  // a riverboat coming down toward us, slipping under the bridge
  p.live('boats', {
    t: 8.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const f = ((time - 8) * 0.012 + 0.35) % 1;
      const v = lerp(3.2, 0.2, f), s = G.s(v);
      const u = uR(v) + 0.12;
      const [x, y] = P(u, v);
      const L = 0.26 * G.U * s * 0.32, h = 7 * s;
      // its wake
      c.strokeStyle = 'rgba(246,224,200,.75)'; c.lineWidth = Math.max(1, 2.4 * s);
      c.beginPath(); c.moveTo(x - L * 0.5, y + h * 0.4); c.lineTo(x - L * 0.9, y - h * 1.2); c.moveTo(x + L * 0.5, y + h * 0.4); c.lineTo(x + L * 0.9, y - h * 1.2); c.stroke();
      // a long low boat with a glass cabin, seen from its bow
      c.fillStyle = CREAM; poly(c, [[x - L / 2, y - h], [x + L / 2, y - h], [x + L * 0.4, y + h * 0.4], [x - L * 0.4, y + h * 0.4]]); c.fill();
      c.fillStyle = CORAL; c.fillRect(x - L / 2, y - h * 0.35, L, h * 0.3);
      c.fillStyle = MINT; c.fillRect(x - L * 0.38, y - h * 2.6, L * 0.76, h * 1.6);
      c.fillStyle = TEAL_D; for (let i = 0; i < 5; i++) c.fillRect(x - L * 0.34 + i * L * 0.145, y - h * 2.4, L * 0.08, h * 1.1);
      c.fillStyle = TEAL_D; c.fillRect(x - L * 0.42, y - h * 2.9, L * 0.84, h * 0.4);
    },
  });
  // pigeons wheeling over the roofs, and the flag on the tower
  const birds = [];
  for (let i = 0; i < 11; i++) birds.push([r.range(-90, 90), r.range(-40, 40), r() * 6]);
  p.live('air', {
    t: 9.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const cx = 760 + Math.sin(time * 0.21) * 160, cy = 760 + Math.sin(time * 0.33) * 50;
      c.fillStyle = BLACK;
      for (const [dx, dy, ph] of birds) {
        const x = cx + dx + Math.sin(time * 0.8 + ph) * 18, y = cy + dy + Math.cos(time * 0.7 + ph) * 10;
        const fl = Math.sin(time * 9 + ph * 3) * 4;
        c.beginPath(); c.moveTo(x - 8, y - fl); c.quadraticCurveTo(x - 3, y - 2, x, y + 1.5); c.quadraticCurveTo(x + 3, y - 2, x + 8, y - fl);
        c.quadraticCurveTo(x + 3, y + 1, x, y + 3.5); c.quadraticCurveTo(x - 3, y + 1, x - 8, y - fl); c.fill();
      }
    },
  });
  p.live('air', {
    t: 8.2, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      const x = TX, y = tY(330) + 2;
      c.fillStyle = BLACK; c.fillRect(x - 1, y - 2, 2, 26);
      const cols = [TEAL_D, CREAM, CORAL];
      for (let i = 0; i < 3; i++) {
        c.fillStyle = cols[i];
        c.beginPath();
        for (let k = 0; k <= 6; k++) {
          const fx = (i * 6 + k) / 18, wave = Math.sin(time * 5 - fx * 6) * 2.2 * fx;
          const xx = x + 1 + fx * 30;
          k ? c.lineTo(xx, y + wave) : c.moveTo(xx, y + wave);
        }
        for (let k = 6; k >= 0; k--) {
          const fx = (i * 6 + k) / 18, wave = Math.sin(time * 5 - fx * 6) * 2.2 * fx;
          c.lineTo(x + 1 + fx * 30, y + 18 + wave);
        }
        c.fill();
      }
    },
  });
}


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

// ---------------------------------------------------------------- title and band
function title(p) {
  const o = { family: '"Yellowtail", cursive', size: 440, gap: 0.2, d: 0.9 };
  setType(p, 'shadow', 'Paris', 92 + 14, 520 + 12, { ...o, color: CORAL, t: 10.6, reveal: 'fade' });
  setType(p, 'title', 'Paris', 92, 520, { ...o, color: CREAM, t: 10.75 });
  p.type('title', 'LA VILLE LUMIÈRE', 452, 610, { family: '"Josefin Sans", sans-serif', weight: 600, size: 30, color: MUSTARD, track: 0.42, align: 'center', t: 12.0, gap: 0.04, d: 0.5, reveal: 'fade' });
  // the black band and its line
  p.group('band', { x: BAND.x, y: BAND.y, w: BAND.w, h: BAND.h }, (c) => {
    c.fillStyle = BLACK; c.fillRect(BAND.x, BAND.y, BAND.w, BAND.h);
    c.fillStyle = CORAL; c.fillRect(BAND.x, BAND.y, BAND.w, 7);
  }, { t: 0.3, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  p.type('band', 'FRANCE', W / 2, 1932, { family: '"Josefin Sans", sans-serif', weight: 600, size: 64, color: CREAM, track: 0.7, align: 'center', t: 12.5, gap: 0.1, d: 0.6 });
  p.group('band', { x: 0, y: 1880, w: W, h: 60 }, (c) => {
    c.fillStyle = MUSTARD;
    for (const x of [470, 1130]) { c.beginPath(); c.arc(x, 1910, 6, 0, Math.PI * 2); c.fill(); }
    c.fillRect(150, 1909, 270, 2); c.fillRect(1180, 1909, 270, 2);
  }, { t: 13.2, d: 0.7, reveal: 'fade' });
}
