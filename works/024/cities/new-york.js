// New York: an engraved bird's-eye view from above the harbor, looking north up
// Manhattan. Brick, limestone and steel; navy line; a swash capital title with
// the Empire State's mast between the words.

import { Plate, W, H, boxOf } from '../print.js';
import {
  Ground, box, windows, cloudPuffs, drawCloud, cloudBox, tree, gull, sailboat, waveLines,
  shade, mix, lerp, clamp, smooth, poly, rng, hatchQuad,
} from '../kit.js';

const INK = '#1e2536', PAPER = '#f2e3bf';
const WATER = '#4f8297', WATER_FAR = '#9dbab8', WAVE_D = '#2c5568', WAVE_L = '#d3e2da';
const BRICK = ['#b4573c', '#a44d37', '#c46d4b', '#94442f', '#bb6146', '#ad5a43'];
const SAND = ['#dcc39a', '#e5d3ae', '#cfb48a', '#d8bc90'];
const STONE = ['#e8dcc1', '#dccaa6', '#ebe1ca', '#d2c3a3'];
const GREY = ['#aaa79e', '#9ea4a4', '#bcb7aa', '#8f969a'];
const COPPER = '#77a48f', TREE = '#6c8f50', GRASS = '#93a86a';
const GROUND = '#cbbc9b', STREET = '#b9ab8c';

export const city = {
  id: 'new-york', name: 'New York', wall: '#26303f',
  alt: "An engraved bird's-eye view of Manhattan from above the harbor, with the Empire State Building between the words of the title, the Chrysler Building, the Brooklyn Bridge, the Statue of Liberty and a ferry",
  google: 'family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@500;700',
  fonts: ['900 100px "Cinzel Decorative"', '700 40px "Cinzel"'],
  build,
};

const g = new Ground({ cx: 800, hy: 470, y0: 1700, U: 1250, K: 0.55 });
const VMAX = 2.7;
const FAR = 16; // the far land runs on to here

// Manhattan's two shores, and the far shores of the rivers
const hw = (v) => 0.02 + 0.5 * (1 - Math.exp(-v / 0.12)) - 0.03 * smooth(1.6, 2.7, v);
const uc = (v) => -0.05 + 0.04 * v;
const Lm = (v) => uc(v) - hw(v);
const Rm = (v) => uc(v) + hw(v) * 1.04;
const uNJ = (v) => Lm(v) - 0.3 - 0.06 * Math.sin(v * 1.9 + 0.4) - 0.04 * v;
const uBK = (v) => Rm(v) + 0.2 + 0.07 * Math.sin(v * 1.6 + 1.2) + 0.02 * v;

function build() {
  const p = new Plate({ paper: PAPER, seed: 1624 });
  const r = p.r;
  p.clip = { x: 46, y: 46, w: W - 92, h: H - 92 };
  p.stack('sky', 'clouds', 'title', 'water', 'far', 'land', 'city', 'bridge', 'harbor', 'front', 'frame');
  p.layer('frame', { clip: false });

  sky(p, r);
  water(p, r);
  far(p, r);
  land(p, r);
  cityBlocks(p, r);
  bridge(p, r);
  liberty(p, r);
  harbor(p, r);
  title(p);
  frame(p);
  return p;
}

// ---------------------------------------------------------------- sky
function sky(p, r) {
  p.group('sky', { x: 0, y: 0, w: W, h: H }, (c) => {
    const gr = c.createLinearGradient(0, 430, 0, 960);
    gr.addColorStop(0, 'rgba(240,206,150,0)');
    gr.addColorStop(1, 'rgba(238,196,132,0.55)');
    c.fillStyle = gr; c.fillRect(0, 430, W, 560);
  }, { t: 0.15, d: 1.8, reveal: 'fade', ease: 'soft' });

  const clouds = [
    [70, 640, 380, 120], [1130, 600, 360, 112], [520, 520, 230, 66],
    [300, 800, 260, 70], [1250, 770, 250, 70], [930, 690, 210, 58], [80, 900, 170, 44], [1420, 930, 140, 38],
  ];
  clouds.forEach(([x, y, w, h], i) => {
    const cl = cloudPuffs(r, x, y, w, h);
    p.group('clouds', cloudBox(cl), (c) => drawCloud(c, cl, { fill: '#f8eed6', line: INK, lw: 1.5, hatch: 'rgba(30,37,54,.3)', step: 5.5, cover: 0.42 }),
      { t: 0.7 + i * 0.28, d: 1.5, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ---------------------------------------------------------------- water
function isWater(x, y) {
  if (y < 640) return false;
  const v = g.vAt(y), u = g.uAt(x, v);
  if (v < 0) return true;
  if (u < uNJ(v)) return false;
  if (u > uBK(v)) return false;
  if (v > FAR) return false;
  if (u > Lm(v) && u < Rm(v)) return false;
  return true;
}

function water(p, r) {
  p.group('water', { x: 0, y: 640, w: W, h: H - 640 }, (c) => {
    const gr = c.createLinearGradient(0, 680, 0, 1960);
    gr.addColorStop(0, WATER_FAR); gr.addColorStop(0.28, mix(WATER_FAR, WATER, 0.6)); gr.addColorStop(1, WATER);
    c.fillStyle = gr; c.fillRect(0, 640, W, H - 640);
  }, { t: 1.0, d: 2.2, reveal: 'fall', ease: 'inOut' });

  const bands = 14;
  const y0 = 700, y1 = 1960;
  for (let b = 0; b < bands; b++) {
    const ya = lerp(y0, y1, (b / bands) ** 1.6), yb = lerp(y0, y1, ((b + 1) / bands) ** 1.6);
    const dark = waveLines(r, g, { y0: ya, y1: yb, x0: 40, x1: W - 40, density: 1.1, skip: (x, y) => !isWater(x, y) });
    const light = waveLines(r, g, { y0: ya, y1: yb, x0: 40, x1: W - 40, density: 0.6, skip: (x, y) => !isWater(x, y) });
    if (!dark.length) continue;
    const t = 1.8 + b * 0.22;
    p.strokes('water', dark, WAVE_D, clamp(0.5 + b * 0.09, 0.6, 1.6), { t, d: 0.9, reveal: 'wipe' });
    if (light.length) p.strokes('water', light, WAVE_L, clamp(0.5 + b * 0.08, 0.5, 1.4), { t: t + 0.25, d: 0.9, reveal: 'wipeL' });
  }
}

// ---------------------------------------------------------------- far shores
function far(p, r) {
  // the land beyond the city runs into haze; low hills on the horizon
  p.group('far', { x: 0, y: 520, w: W, h: 200 }, (c) => {
    const pts = [[0, 600]];
    for (let x = 0; x <= W; x += 30) pts.push([x, 586 + Math.sin(x * 0.005 + 1) * 12 + Math.sin(x * 0.019) * 4]);
    pts.push([W, 720], [0, 720]);
    c.fillStyle = mix('#b8b49a', PAPER, 0.5); poly(c, pts); c.fill();
    c.strokeStyle = 'rgba(30,37,54,.4)'; c.lineWidth = 1;
    c.beginPath(); pts.slice(0, -2).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  }, { t: 1.4, d: 1.4, reveal: 'fade' });

  const shore = (fn, side) => {
    const pts = [];
    for (let v = FAR; v >= 0.02; v -= 0.03) pts.push(g.P(fn(v), v));
    const last = pts[pts.length - 1];
    if (side < 0) pts.push([-60, last[1]], [-60, 640]);
    else pts.push([W + 60, last[1]], [W + 60, 640]);
    return pts;
  };
  const nj = shore(uNJ, -1), bk = shore(uBK, 1);
  const beyond = [];
  for (let v = VMAX - 0.05; v <= FAR; v += 0.05) beyond.push(g.P(uNJ(v), v));
  for (let v = FAR; v >= VMAX - 0.05; v -= 0.05) beyond.push(g.P(uBK(v), v));
  p.fill('far', beyond, mix('#c8b48f', PAPER, 0.3), { t: 1.5, d: 1.2, reveal: 'fade' });
  p.fill('far', nj, mix('#c8b48f', PAPER, 0.25), { t: 1.6, d: 1.2, reveal: 'fade' });
  p.fill('far', bk, mix('#c8b48f', PAPER, 0.25), { t: 1.7, d: 1.2, reveal: 'fade' });
  const edge = (fn) => { const pts = []; for (let v = 0.02; v <= 6; v += 0.03) pts.push(g.P(fn(v), v)); return pts; };
  p.pen('far', edge(uNJ), 'rgba(30,37,54,.8)', 1.3, { t: 1.6, d: 2.0 });
  p.pen('far', edge(uBK), 'rgba(30,37,54,.8)', 1.3, { t: 1.7, d: 2.0 });

  // their low buildings, a row at a time, far to near; beyond the island's end
  // the rows run right across
  const rows = [];
  for (let v = 9; v > 0.04; v -= v > 5 ? 0.5 : v > 3 ? 0.22 : v > 1.5 ? 0.1 : 0.065) rows.push(v);
  rows.forEach((v, i) => {
    const t = 1.9 + (i / rows.length) * 4.6;
    const s = g.s(v);
    const fade = clamp(0.42 + (v - 0.5) * 0.08, 0.42, 0.78);
    const spans = v > VMAX ? [[uNJ(v) - 3, uBK(v) + 3]] : [[uNJ(v) - 3, uNJ(v) - 0.02], [uBK(v) + 0.02, uBK(v) + 3]];
    for (const [a, b] of spans) {
      const items = [];
      let u = a;
      while (u < b) {
        const w = r.range(0.03, 0.065);
        const [xa] = g.P(u, v), [xb] = g.P(u + w, v);
        if (xb > -20 && xa < W + 20) {
          const z = r.range(14, 46) * (r.chance(0.05) ? 2.2 : 1);
          items.push({ u0: u, u1: u + w, v0: v, v1: v + 0.035, z1: z, color: mix(r.chance(0.55) ? r.pick(BRICK) : r.pick(SAND), PAPER, fade) });
        }
        u += w + r.range(0.006, v > 1.2 ? 0.05 : 0.03);
      }
      if (!items.length) continue;
      items.sort((p1, p2) => Math.abs(p2.u0 + p2.u1) - Math.abs(p1.u0 + p1.u1));
      const pts = [];
      items.forEach((it) => { pts.push(g.P(it.u0, it.v0, 0), g.P(it.u1, it.v1, it.z1)); });
      p.group('far', boxOf(pts, 2), (c) => {
        for (const it of items) {
          box(c, g, { ...it, line: `rgba(30,37,54,${0.5 - fade * 0.4})`, lw: Math.max(0.35, s * 0.7), hatch: false, side: shade(it.color, 0.88) });
          if (s > 0.45) windows(c, g, { u0: it.u0, u1: it.u1, v0: it.v0, z1: it.z1, color: `rgba(40,46,60,${0.45 - fade * 0.3})`, pitch: 8 });
        }
      }, { t, d: 0.8, reveal: 'rise' });
    }
  });
  // the haze that sits over the far end
  p.group('far', { x: 0, y: 560, w: W, h: 260 }, (c) => {
    const gr = c.createLinearGradient(0, 590, 0, 800);
    gr.addColorStop(0, 'rgba(242,227,191,.85)'); gr.addColorStop(1, 'rgba(242,227,191,0)');
    c.fillStyle = gr; c.fillRect(0, 590, W, 210);
  }, { t: 6.4, d: 1.2, reveal: 'fade' });
}

// ---------------------------------------------------------------- the island
function island() {
  const pts = [];
  for (let v = 0; v <= VMAX; v += 0.02) pts.push(g.P(Lm(v), v));
  for (let v = VMAX; v >= 0; v -= 0.02) pts.push(g.P(Rm(v), v));
  return pts;
}

const PARKS = [
  { name: 'central', u0: (v) => uc(v) - 0.1, u1: (v) => uc(v) + 0.14, v0: 1.75, v1: 2.62 },
  { name: 'washington', u0: () => -0.31, u1: () => -0.13, v0: 0.42, v1: 0.5 },
];
const inPark = (u, v) => PARKS.some((k) => v > k.v0 && v < k.v1 && u > k.u0(v) && u < k.u1(v));

function land(p, r) {
  const isl = island();
  p.fill('land', isl, GROUND, { t: 2.4, d: 1.2, reveal: 'fade', line: INK, lw: 1.6 });

  // the parks: grass, then trees
  for (const k of PARKS) {
    const pts = [];
    for (let v = k.v0; v <= k.v1 + 1e-6; v += 0.02) pts.push(g.P(k.u0(v), v));
    for (let v = k.v1; v >= k.v0 - 1e-6; v -= 0.02) pts.push(g.P(k.u1(v), v));
    p.fill('land', pts, GRASS, { t: 2.8, d: 0.9, reveal: 'fade', line: 'rgba(30,37,54,.6)', lw: 0.8 });
    const trees = [];
    for (let i = 0; i < (k.name === 'central' ? 260 : 26); i++) {
      const v = r.range(k.v0 + 0.01, k.v1), u = r.range(k.u0(v) + 0.01, k.u1(v) - 0.01);
      if (k.name === 'washington' && Math.abs(u + 0.22) < 0.035 && Math.abs(v - 0.46) < 0.03) continue;
      trees.push([u, v]);
    }
    if (k.name === 'central') {
      // the reservoir
      const res = [];
      for (let a = 0; a < Math.PI * 2; a += 0.2) res.push(g.P(uc(2.25) + 0.02 + Math.cos(a) * 0.07, 2.25 + Math.sin(a) * 0.09));
      p.fill('land', res, mix(WATER, WATER_FAR, 0.5), { t: 3.0, d: 0.8, reveal: 'fade', line: INK, lw: 0.7 });
    }
    trees.sort((a, b) => b[1] - a[1]);
    const pts2 = trees.map(([u, v]) => g.P(u, v));
    p.group('land', boxOf(pts2, 30), (c) => {
      for (const [u, v] of trees) { const [x, y] = g.P(u, v); tree(c, x, y, 13 * g.s(v), { color: TREE, line: k.name === 'washington' ? INK : null, lw: 0.6 }); }
    }, { t: 3.1, d: 1.2, reveal: 'rise' });
  }

  // Battery Park, at the tip
  const bt = [];
  for (let i = 0; i < 40; i++) {
    const v = r.range(0.0, 0.07);
    const u = r.range(Lm(v) + 0.015, Rm(v) - 0.015);
    if (u < Lm(v) + 0.01 || u > Rm(v) - 0.01) continue;
    bt.push([u, v]);
  }
  bt.sort((a, b) => b[1] - a[1]);
  const btPts = bt.map(([u, v]) => g.P(u, v));
  if (btPts.length) {
    p.group('land', boxOf(btPts, 40), (c) => {
      for (const [u, v] of bt) { const [x, y] = g.P(u, v); tree(c, x, y, 20 * g.s(v), { color: TREE, line: INK, lw: 0.8 }); }
    }, { t: 8.6, d: 1.0, reveal: 'rise' });
  }

  // piers along both shores (the sheds' colors from their own generator, so the rest of the
  // poster draws as it always has)
  const rs = rng(243);
  for (const side of [-1, 1]) {
    for (let v = 0.06; v < 1.1; v += 0.055) {
      const edge = side < 0 ? Lm(v) : Rm(v);
      const len = r.range(0.05, 0.09);
      const u0 = side < 0 ? edge - len : edge - 0.005, u1 = side < 0 ? edge + 0.005 : edge + len;
      const vv = v, vw = 0.016;
      const deck = [g.P(u0, vv), g.P(u1, vv), g.P(u1, vv + vw), g.P(u0, vv + vw)];
      const t = 7.8 - v * 2.5, shed = rs.pick(['#d9c8a6', '#c9b48e', '#b8a586']);
      p.group('land', boxOf(deck, 30), (c) => {
        c.fillStyle = '#8f7c63'; poly(c, deck); c.fill();
        c.strokeStyle = INK; c.lineWidth = Math.max(0.5, g.s(v)); poly(c, deck); c.stroke();
        const s0 = side < 0 ? u0 + 0.005 : u0 + 0.012, s1 = side < 0 ? u1 - 0.012 : u1 - 0.005;
        box(c, g, { u0: s0, u1: s1, v0: vv + 0.002, v1: vv + vw - 0.002, z1: 16, color: shed, roof: '#7d6f5d' });
      }, { t, d: 0.7, reveal: 'fade' });
    }
  }

  // yellow cabs going down Fifth and up the avenue beside it
  const avenues = [{ du: -0.098, dir: -1 }, { du: 0.032, dir: 1 }];
  avenues.forEach((a, ai) => {
    for (let i = 0; i < 9; i++) {
      const ph = r(), sp = r.range(0.018, 0.03);
      const lane = r.range(-0.004, 0.004);
      p.live('land', {
        t: 7 + i * 0.2, d: 0.6, reveal: 'fade',
        draw: (c, time) => {
          const range = [0.24, 1.0];
          let k = (ph + time * sp * a.dir / (range[1] - range[0])) % 1; if (k < 0) k += 1;
          const v = lerp(range[0], range[1], k);
          const u = uc(v) + a.du + lane;
          const [x, y] = g.P(u, v), s = g.s(v);
          const w = 9 * s, h = 6 * s;
          c.fillStyle = '#e8b62a'; c.fillRect(x - w / 2, y - h, w, h);
          c.fillStyle = '#2b2f38'; c.fillRect(x - w / 2 + 1.5 * s, y - h, w - 3 * s, 2 * s);
          c.strokeStyle = INK; c.lineWidth = 0.6; c.strokeRect(x - w / 2, y - h, w, h);
        },
      });
    }
  });
}

// ---------------------------------------------------------------- the city
// every lot on the grid gets a building, from the far end to the tip; a few
// lots are kept for the buildings everyone knows
const LANDMARKS = [
  { name: 'empire', u: 0.0, v: 1.0, hw: 0.105, hv: 0.1 },
  { name: 'chrysler', u: 0.31, v: 1.12, hw: 0.075, hv: 0.08 },
  { name: 'rock', u: -0.33, v: 1.16, hw: 0.06, hv: 0.14 },
  { name: 'grand', u: 0.165, v: 0.9, hw: 0.085, hv: 0.07 },
  { name: 'flatiron', u: 0.02, v: 0.62, hw: 0.06, hv: 0.1 },
  { name: 'arch', u: -0.22, v: 0.455, hw: 0.04, hv: 0.02 },
  { name: 'woolworth', u: -0.17, v: 0.15, hw: 0.075, hv: 0.08 },
  { name: 'wall', u: 0.1, v: 0.085, hw: 0.06, hv: 0.06 },
];
const inLandmark = (u0, u1, v0, v1) => LANDMARKS.some((k) => u1 > k.u - k.hw && u0 < k.u + k.hw && v1 > k.v && v0 < k.v + k.hv);

function heightAt(r, u, v) {
  const down = Math.exp(-((v - 0.12) ** 2) / 0.006) * 210;
  const mid = Math.exp(-((v - 1.15) ** 2) / 0.16) * Math.exp(-((u - 0.02) ** 2) / 0.16) * 560;
  const base = 40 + 30 * smooth(0.2, 0.0, Math.abs(v - 0.35)) + (v > 1.6 ? 30 : 0);
  return Math.max(26, base * r.range(0.6, 1.3) + down * r() ** 3 + mid * r() ** 1.7);
}

function cityBlocks(p, r) {
  const items = [];
  const rowDepth = 0.05, street = 0.012;
  for (let v = 0.035; v < VMAX - 0.04; v += rowDepth + street) {
    const v0 = v, v1 = v + rowDepth;
    const left = Lm(v1) + 0.01, right = Rm(v1) - 0.01;
    // avenues: gaps at a fixed spacing across the island
    const aves = [];
    for (let k = -5; k <= 5; k++) aves.push(uc(v) + 0.035 + k * 0.13);
    let u = left;
    while (u < right - 0.012) {
      let w = r.range(0.022, 0.05);
      if (u + w > right) w = right - u;
      const ave = aves.find((a) => a > u && a < u + w + 0.008);
      if (ave !== undefined) { w = ave - 0.008 - u; if (w < 0.012) { u = ave + 0.008; continue; } }
      const u0 = u, u1 = u + w;
      u += w + (ave !== undefined ? 0.016 : r.range(0.0, 0.004));
      if (inPark((u0 + u1) / 2, v0) || inPark((u0 + u1) / 2, v1)) continue;
      if (inLandmark(u0, u1, v0, v1)) continue;
      // keep the buildings off the water
      if (u0 < Lm(v0) || u1 > Rm(v0)) continue;
      const z = heightAt(r, (u0 + u1) / 2, v0);
      items.push({ kind: 'lot', u0, u1, v0, v1: v0 + rowDepth * r.range(0.7, 1), z });
    }
  }
  for (const k of LANDMARKS) items.push({ kind: k.name, u0: k.u - k.hw, u1: k.u + k.hw, v0: k.v, v1: k.v + k.hv, k });

  // painter's order: far first, and on a row the outer ones first
  items.sort((a, b) => (b.v0 - a.v0) || (Math.abs(b.u0 + b.u1) - Math.abs(a.u0 + a.u1)));
  const vTop = VMAX;
  for (const it of items) {
    const t = 3.2 + (1 - it.v0 / vTop) ** 1.15 * 6.0 + r.range(-0.12, 0.12);
    if (it.kind === 'lot') addLot(p, r, it, t);
    else LM[it.kind](p, r, it.k, t);
  }
}

function lotColor(r, z) {
  if (z < 90) return r.chance(0.62) ? r.pick(BRICK) : r.pick(SAND);
  if (z < 260) return r.chance(0.4) ? r.pick(STONE) : r.chance(0.6) ? r.pick(SAND) : r.chance(0.5) ? r.pick(BRICK) : r.pick(GREY);
  return r.pick([...SAND, '#c9a57c', '#d3b98f', STONE[1], STONE[3], GREY[0], GREY[2]]);
}

const SIGNS = ['BOOKS', 'RECORDS', 'DELI', 'BAKERY', 'HARDWARE', 'CAFÉ', 'TAILOR', 'FLOWERS'];

function addLot(p, r, it, t) {
  const { u0, u1, v0, v1 } = it;
  const z = it.z;
  const color = lotColor(r, z);
  const s = g.s(v0);
  const tiers = [{ u0, u1, v0, v1, z0: 0, z1: z }];
  // setbacks for the tall ones
  if (z > 200 && r.chance(0.75)) {
    const n = z > 380 ? 3 : 2;
    let zz = z * r.range(0.45, 0.62), a = u0, b = u1, c0 = v0, c1 = v1;
    tiers[0].z1 = zz;
    for (let i = 1; i < n; i++) {
      const iu = (b - a) * r.range(0.1, 0.2), iv = (c1 - c0) * r.range(0.1, 0.2);
      a += iu; b -= iu; c0 += iv; c1 -= iv;
      const top = i === n - 1 ? z : zz + (z - zz) * r.range(0.4, 0.6);
      tiers.push({ u0: a, u1: b, v0: c0, v1: c1, z0: zz, z1: top });
      zz = top;
    }
  }
  const crown = z > 230 ? r.pick(['flat', 'deco', 'deco', 'pyramid', 'spire', 'cap', 'mansard']) : z > 110 && r.chance(0.25) ? 'mansard' : 'flat';
  const tank = z < 110 && r.chance(0.42) && s > 0.32;
  const escape = z < 100 && BRICK.includes(color) && s > 0.62 && r.chance(0.55);
  const shop = s > 0.78 && z < 120 && r.chance(0.5);
  const sign = shop && r.chance(0.4) ? r.pick(SIGNS) : null;
  const awn = r.pick(['#b8412f', '#2f5d6b', '#3f6b48']);
  const winColor = BRICK.includes(color) ? '#38333a' : '#4a4d58';
  const seed = Math.floor(r() * 1e9);

  const top = tiers[tiers.length - 1];
  const pts = [g.P(u0, v0, 0), g.P(u1, v0, 0), g.P(u1, v1, z), g.P(u0, v1, z), g.P(u0, v0, z + 120)];
  p.group('city', boxOf(pts, 6), (c) => {
    const rr = rng(seed);
    tiers.forEach((tr, i) => {
      box(c, g, { ...tr, color, roof: shade(color, 0.82) });
      windows(c, g, { u0: tr.u0, u1: tr.u1, v0: tr.v0, z0: tr.z0, z1: tr.z1, color: winColor, base: i === 0 && shop ? 14 : 0, pitch: z < 90 ? 6.5 : 7.5, fx: z < 90 ? 0.5 : 0.42 });
      // a cornice line at the top of each tier
      const [xa, ya] = g.P(tr.u0, tr.v0, tr.z1), [xb, yb0] = g.P(tr.u1, tr.v0, tr.z0);
      const ts = g.s(tr.v0);
      c.fillStyle = shade(color, 0.7); c.fillRect(xa, ya, xb - xa, Math.max(0.8, 3.2 * ts));
      if (z > 150) {
        // piers up the face and a heavier base, so a tall one reads as masonry
        const n = Math.max(2, Math.round((xb - xa) / Math.max(5, 16 * ts)));
        c.strokeStyle = 'rgba(70,58,48,.32)'; c.lineWidth = Math.max(0.5, 1.4 * ts); c.beginPath();
        for (let j = 1; j < n; j++) { const x = lerp(xa, xb, j / n); c.moveTo(x, yb0); c.lineTo(x, ya); }
        c.stroke();
        if (i === 0) { c.fillStyle = 'rgba(60,45,35,.18)'; c.fillRect(xa, yb0 - 22 * ts, xb - xa, 22 * ts); }
      }
    });
    // the crown
    const [cxa, cya] = g.P(top.u0, top.v0, top.z1), [cxb] = g.P(top.u1, top.v0, top.z1);
    const cw = cxb - cxa, ts = g.s(top.v0);
    if (crown === 'pyramid') {
      const col = rr.chance(0.6) ? COPPER : '#6b6460';
      c.fillStyle = col; poly(c, [[cxa, cya], [cxb, cya], [cxa + cw / 2, cya - cw * 0.9]]); c.fill();
      c.fillStyle = shade(col, 0.75); poly(c, [[cxa + cw / 2, cya], [cxb, cya], [cxa + cw / 2, cya - cw * 0.9]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = Math.max(0.5, 1.2 * ts); poly(c, [[cxa, cya], [cxb, cya], [cxa + cw / 2, cya - cw * 0.9]]); c.stroke();
    } else if (crown === 'spire') {
      c.strokeStyle = INK; c.lineWidth = Math.max(0.6, 1.4 * ts);
      c.beginPath(); c.moveTo(cxa + cw / 2, cya); c.lineTo(cxa + cw / 2, cya - cw * 1.2); c.stroke();
    } else if (crown === 'deco') {
      // a stepped top, each step narrower
      let w0 = cw, y0 = cya;
      for (let i = 0; i < 3; i++) {
        const h0 = cw * (0.22 + rr() * 0.12);
        w0 *= 0.72; y0 -= h0;
        const x0 = cxa + (cw - w0) / 2;
        c.fillStyle = shade(color, 1 - i * 0.04); c.fillRect(x0, y0, w0, h0);
        c.fillStyle = shade(color, 0.72); c.fillRect(x0 + w0 * 0.6, y0, w0 * 0.4, h0);
        c.strokeStyle = INK; c.lineWidth = Math.max(0.5, 1.1 * ts); c.strokeRect(x0, y0, w0, h0);
      }
      c.beginPath(); c.moveTo(cxa + cw / 2, y0); c.lineTo(cxa + cw / 2, y0 - cw * 0.5); c.stroke();
    } else if (crown === 'mansard') {
      const h0 = cw * 0.22, col = rr.chance(0.5) ? COPPER : '#5d5752';
      const m = [[cxa - 1, cya], [cxb + 1, cya], [cxb - cw * 0.12, cya - h0], [cxa + cw * 0.12, cya - h0]];
      c.fillStyle = col; poly(c, m); c.fill();
      c.strokeStyle = INK; c.lineWidth = Math.max(0.5, ts); poly(c, m); c.stroke();
      c.fillStyle = '#efe4c9';
      const nd = Math.max(1, Math.round(cw / (12 * ts)));
      for (let i = 0; i < nd; i++) { const x = lerp(cxa + cw * 0.18, cxb - cw * 0.18, nd === 1 ? 0.5 : i / (nd - 1)); c.fillRect(x - 1.6 * ts, cya - h0 * 0.8, 3.2 * ts, h0 * 0.55); }
    } else if (crown === 'cap') {
      c.fillStyle = shade(color, 0.8); c.fillRect(cxa + cw * 0.25, cya - cw * 0.25, cw * 0.5, cw * 0.25);
      c.strokeStyle = INK; c.lineWidth = Math.max(0.5, ts); c.strokeRect(cxa + cw * 0.25, cya - cw * 0.25, cw * 0.5, cw * 0.25);
    }
    // a wooden water tank on the roof
    if (tank) {
      const uu = lerp(u0, u1, rr.range(0.3, 0.7)), vv = lerp(v0, v1, 0.55);
      const [x, y] = g.P(uu, vv, z);
      waterTank(c, x, y, 1.15 * s);
    }
    // a fire escape down the front
    if (escape) {
      const [fa, fy] = g.P(lerp(u0, u1, 0.3), v0, 0), [fb] = g.P(lerp(u0, u1, 0.7), v0, 0);
      c.strokeStyle = INK; c.lineWidth = Math.max(0.5, 0.9 * s);
      c.beginPath();
      for (let zz = 24; zz < z - 8; zz += 9) {
        const y = fy - zz * s;
        c.moveTo(fa, y); c.lineTo(fb, y);
        c.moveTo(fa, y - 0.5 * s); c.lineTo(fa, y - 3.2 * s); c.moveTo(fb, y - 0.5 * s); c.lineTo(fb, y - 3.2 * s);
        const up = (Math.round(zz / 9) % 2) ? [fa + 2 * s, fb - 2 * s] : [fb - 2 * s, fa + 2 * s];
        c.moveTo(up[0], y); c.lineTo(up[1], y - 9 * s);
      }
      c.stroke();
    }
    // a shop with an awning on the ground floor
    if (shop) {
      const [xa2, ya2] = g.P(u0, v0, 0), [xb2] = g.P(u1, v0, 0);
      const w2 = xb2 - xa2, top2 = ya2 - 13 * s;
      c.fillStyle = '#3b3532'; c.fillRect(xa2 + w2 * 0.12, ya2 - 10 * s, w2 * 0.76, 10 * s);
      const stripes = Math.max(3, Math.round(w2 / (5 * s)));
      for (let i = 0; i < stripes; i++) {
        c.fillStyle = i % 2 ? '#f3ead6' : awn;
        poly(c, [[xa2 + w2 * 0.08 + (i / stripes) * w2 * 0.84, top2], [xa2 + w2 * 0.08 + ((i + 1) / stripes) * w2 * 0.84, top2],
          [xa2 + w2 * 0.04 + ((i + 1) / stripes) * w2 * 0.92, top2 + 6 * s], [xa2 + w2 * 0.04 + (i / stripes) * w2 * 0.92, top2 + 6 * s]]);
        c.fill();
      }
      c.strokeStyle = INK; c.lineWidth = 0.7 * s;
      poly(c, [[xa2 + w2 * 0.08, top2], [xa2 + w2 * 0.92, top2], [xa2 + w2 * 0.96, top2 + 6 * s], [xa2 + w2 * 0.04, top2 + 6 * s]]); c.stroke();
      if (sign && w2 > 40) {
        const sy = top2 - 9 * s;
        c.fillStyle = '#efe6cf'; c.fillRect(xa2 + w2 * 0.15, sy, w2 * 0.7, 8 * s);
        c.strokeRect(xa2 + w2 * 0.15, sy, w2 * 0.7, 8 * s);
        c.fillStyle = INK; c.font = `700 ${6.2 * s}px "Cinzel", serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(sign, xa2 + w2 / 2, sy + 4.4 * s);
      }
    }
  }, { t, d: 0.85, reveal: 'rise' });
}

function waterTank(c, x, y, s) {
  const w = 9 * s, h = 10 * s, leg = 6 * s;
  c.strokeStyle = INK; c.lineWidth = Math.max(0.4, 0.7 * s);
  c.beginPath();
  c.moveTo(x - w * 0.4, y); c.lineTo(x - w * 0.35, y - leg); c.moveTo(x + w * 0.4, y); c.lineTo(x + w * 0.35, y - leg);
  c.moveTo(x - w * 0.4, y); c.lineTo(x + w * 0.35, y - leg); c.stroke();
  c.fillStyle = '#8b6a49'; c.fillRect(x - w / 2, y - leg - h, w, h);
  c.fillStyle = '#6d513a'; c.fillRect(x + w * 0.1, y - leg - h, w * 0.4, h);
  c.fillStyle = '#5a4433';
  poly(c, [[x - w * 0.56, y - leg - h], [x + w * 0.56, y - leg - h], [x, y - leg - h - w * 0.55]]); c.fill();
  c.strokeRect(x - w / 2, y - leg - h, w, h);
  c.beginPath(); c.moveTo(x - w / 2, y - leg - h * 0.35); c.lineTo(x + w / 2, y - leg - h * 0.35);
  c.moveTo(x - w / 2, y - leg - h * 0.7); c.lineTo(x + w / 2, y - leg - h * 0.7); c.stroke();
  poly(c, [[x - w * 0.56, y - leg - h], [x + w * 0.56, y - leg - h], [x, y - leg - h - w * 0.55]]); c.stroke();
}

// a stack of tiers centered on (u, v): [hw, hv, z0, z1, color]
function tiers(c, u, v, list, o = {}) {
  for (const [a, b, z0, z1, col, win] of list) {
    const t = { u0: u - a, u1: u + a, v0: v + (o.depth || 0.1) / 2 - b, v1: v + (o.depth || 0.1) / 2 + b, z0, z1 };
    box(c, g, { ...t, color: col, roof: shade(col, 0.8) });
    if (win !== false) windows(c, g, { u0: t.u0, u1: t.u1, v0: t.v0, z0, z1, color: win || '#4a4d58', pitch: o.pitch || 6, fx: o.fx || 0.38, fz: o.fz || 0.6 });
  }
}

// vertical piers on a front face, the way limestone towers are drawn
function piers(c, u0, u1, v0, z0, z1, n, color, lw) {
  const s = g.s(v0);
  c.strokeStyle = color; c.lineWidth = lw * s;
  c.beginPath();
  for (let i = 1; i < n; i++) {
    const u = lerp(u0, u1, i / n);
    const [x, y0] = g.P(u, v0, z0), [, y1] = g.P(u, v0, z1);
    c.moveTo(x, y0); c.lineTo(x, y1);
  }
  c.stroke();
}

const LM = {
  empire(p, r, k, t) {
    const u = k.u, v = k.v, Z = 0.86;
    const top = g.P(u, v + 0.05, 1990 * Z);
    p.group('city', { x: top[0] - 160, y: top[1] - 10, w: 320, h: g.y(v) - top[1] + 20 }, (c) => {
      const lime = '#e2d9c2', limeD = '#b3a991', win = '#737786';
      // the base and the wings
      tiers(c, u, v, [[0.105, 0.05, 0, 70 * Z, lime, win], [0.09, 0.043, 70 * Z, 300 * Z, lime, win]], { depth: 0.1, pitch: 6.5, fz: 0.5 });
      // the shaft: windows in columns between darker piers
      const sh = { u0: u - 0.064, u1: u + 0.064, v0: v + 0.018, v1: v + 0.082 };
      box(c, g, { ...sh, z0: 300 * Z, z1: 1235 * Z, color: lime, side: limeD });
      windows(c, g, { ...sh, z0: 300 * Z, z1: 1235 * Z, color: win, cols: 15, fx: 0.36, fz: 0.62, story: 13 });
      piers(c, sh.u0, sh.u1, sh.v0, 300 * Z, 1235 * Z, 15, 'rgba(120,112,95,.7)', 1.1);
      // the slight central bay, lit a little
      const [bx0, by0] = g.P(u - 0.018, sh.v0, 300 * Z), [bx1, by1] = g.P(u + 0.018, sh.v0, 1235 * Z);
      c.fillStyle = 'rgba(255,250,235,.22)'; c.fillRect(bx0, by1, bx1 - bx0, by0 - by1);
      c.strokeStyle = INK; c.lineWidth = 0.9; c.strokeRect(bx0, by1, bx1 - bx0, by0 - by1);
      const st = [[0.05, 1235, 1400], [0.038, 1400, 1470], [0.026, 1470, 1520]];
      for (const [a, z0, z1] of st) {
        const tt = { u0: u - a, u1: u + a, v0: v + 0.05 - a * 0.5, v1: v + 0.05 + a * 0.5, z0: z0 * Z, z1: z1 * Z };
        box(c, g, { ...tt, color: lime, side: limeD });
        windows(c, g, { u0: tt.u0, u1: tt.u1, v0: tt.v0, z0: tt.z0, z1: tt.z1, color: win, cols: Math.round(a * 240), fx: 0.36, fz: 0.6, story: 12 });
        piers(c, tt.u0, tt.u1, tt.v0, tt.z0, tt.z1, Math.round(a * 240), 'rgba(120,112,95,.7)', 1);
      }
      // the mast: a tapering drum, ribbed, and the needle
      const vm = v + 0.05;
      const [mx, my0] = g.P(u, vm, 1520 * Z), [, my1] = g.P(u, vm, 1700 * Z), [, my2] = g.P(u, vm, 1740 * Z);
      const sm = g.s(vm), b0 = 0.021 * g.U * sm, b1 = 0.012 * g.U * sm;
      c.fillStyle = '#d8cfb6';
      poly(c, [[mx - b0, my0], [mx + b0, my0], [mx + b1, my1], [mx - b1, my1]]); c.fill();
      c.fillStyle = limeD; poly(c, [[mx + b0 * 0.2, my0], [mx + b0, my0], [mx + b1, my1], [mx + b1 * 0.2, my1]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.2;
      poly(c, [[mx - b0, my0], [mx + b0, my0], [mx + b1, my1], [mx - b1, my1]]); c.stroke();
      c.lineWidth = 0.7; c.beginPath();
      for (let i = -3; i <= 3; i++) { c.moveTo(mx + (b0 * i) / 4, my0); c.lineTo(mx + (b1 * i) / 4, my1); }
      for (let f = 0.15; f < 1; f += 0.17) { const yy = lerp(my0, my1, f), bb = lerp(b0, b1, f); c.moveTo(mx - bb, yy); c.lineTo(mx + bb, yy); }
      c.stroke();
      c.fillStyle = '#c4bba4'; poly(c, [[mx - b1, my1], [mx + b1, my1], [mx + b1 * 0.5, my2], [mx - b1 * 0.5, my2]]); c.fill();
      c.lineWidth = 1; poly(c, [[mx - b1, my1], [mx + b1, my1], [mx + b1 * 0.5, my2], [mx - b1 * 0.5, my2]]); c.stroke();
      const [, yTip] = g.P(u, vm, 1990 * Z);
      c.lineWidth = 2.6; c.beginPath(); c.moveTo(mx, my2); c.lineTo(mx, yTip); c.stroke();
      c.lineWidth = 1.3; c.beginPath();
      for (const [dy, w] of [[30, 5], [70, 4], [110, 3]]) { c.moveTo(mx - w, my2 - dy); c.lineTo(mx + w, my2 - dy); }
      c.stroke();
    }, { t: t - 0.5, d: 1.7, reveal: 'rise', ease: 'inOut' });
  },

  chrysler(p, r, k, t) {
    const u = k.u, v = k.v;
    const top = g.P(u, v, 1700);
    p.group('city', { x: top[0] - 120, y: top[1] - 10, w: 240, h: g.y(v) - top[1] + 20 }, (c) => {
      const steel = '#d6d8d2', steelD = '#999f9e', brickG = '#bcb4a6';
      tiers(c, u, v, [[0.075, 0.04, 0, 180, brickG, '#4b4f5c'], [0.05, 0.03, 180, 1000, '#cdc7b9', '#4b4f5c']], { depth: 0.08, pitch: 6, fz: 0.55 });
      // the crown: arches stacked smaller, each set with triangular windows
      const vf = v + 0.04 - 0.03;
      const [cx, cy0] = g.P(u, vf, 1000);
      const sc = g.s(vf) * g.U;
      let w = 0.05 * sc, y = cy0;
      for (let i = 0; i < 6; i++) {
        const h = w * 1.05;
        const arch = [];
        arch.push([cx - w, y]);
        for (let a = Math.PI; a <= Math.PI * 2 + 1e-6; a += Math.PI / 24) arch.push([cx + Math.cos(a) * w, y - h * 0.3 + Math.sin(a) * h * 0.9]);
        arch.push([cx + w, y]);
        c.fillStyle = steel; poly(c, arch); c.fill();
        c.save(); poly(c, arch); c.clip();
        c.fillStyle = steelD; c.fillRect(cx + w * 0.3, y - h * 1.4, w, h * 1.5);
        c.restore();
        c.strokeStyle = INK; c.lineWidth = 1.1; poly(c, arch); c.stroke();
        // the sunburst windows
        c.fillStyle = '#28303f';
        for (let a = Math.PI * 1.08; a < Math.PI * 1.96; a += Math.PI / 8) {
          const rx = Math.cos(a), ry = Math.sin(a);
          const bx = cx + rx * w * 0.58, by = y - h * 0.3 + ry * h * 0.52;
          const tx = cx + rx * w * 0.88, ty = y - h * 0.3 + ry * h * 0.8;
          const px = -ry * w * 0.06, py = rx * h * 0.05;
          poly(c, [[bx - px, by - py], [bx + px, by + py], [tx, ty]]); c.fill();
        }
        y -= h * 0.66; w *= 0.8;
      }
      // the needle
      const nh = 190;
      c.fillStyle = steel; poly(c, [[cx - w * 0.9, y], [cx + w * 0.9, y], [cx, y - nh]]); c.fill();
      c.fillStyle = steelD; poly(c, [[cx, y], [cx + w * 0.9, y], [cx, y - nh]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.1; poly(c, [[cx - w * 0.9, y], [cx + w * 0.9, y], [cx, y - nh]]); c.stroke();
      // the eagles at the corners of the setback
      const [ex0, ey] = g.P(u - 0.05, vf, 1000), [ex1] = g.P(u + 0.05, vf, 1000);
      c.fillStyle = steel; c.lineWidth = 0.9;
      for (const [ex, dir] of [[ex0, -1], [ex1, 1]]) { poly(c, [[ex, ey], [ex + dir * 12, ey - 3], [ex + dir * 14, ey + 2], [ex, ey + 4]]); c.fill(); c.stroke(); }
    }, { t: t - 0.3, d: 1.5, reveal: 'rise', ease: 'inOut' });
  },

  rock(p, r, k, t) {
    const u = k.u, v = k.v;
    const top = g.P(u, v, 1360);
    p.group('city', { x: top[0] - 110, y: top[1] - 10, w: 240, h: g.y(v) - top[1] + 20 }, (c) => {
      const lime = '#e6dbc0';
      const slab = [[0.062, 0.07, 0, 280], [0.046, 0.065, 280, 1000], [0.037, 0.06, 1000, 1280], [0.03, 0.05, 1280, 1340]];
      for (const [a, b, z0, z1] of slab) {
        const tt = { u0: u - a, u1: u + a, v0: v + 0.07 - b, v1: v + 0.07 + b, z0, z1 };
        box(c, g, { ...tt, color: lime, side: '#cbbd98' });
        // windows in vertical strips, front and side
        windows(c, g, { u0: tt.u0, u1: tt.u1, v0: tt.v0, z0, z1, color: '#5d6475', cols: Math.round(a * 240), fx: 0.28, fz: 0.82, story: 12 });
        const sideU = tt.u1;
        c.strokeStyle = 'rgba(70,76,92,.7)'; c.lineWidth = 1; c.beginPath();
        for (let i = 1; i < 16; i++) {
          const vv = lerp(tt.v0, tt.v1, i / 16);
          const [x0, y0] = g.P(sideU, vv, z0 + 8), [x1, y1] = g.P(sideU, vv, z1 - 8);
          c.moveTo(x0, y0); c.lineTo(x1, y1);
        }
        c.stroke();
      }
    }, { t: t - 0.3, d: 1.4, reveal: 'rise', ease: 'inOut' });
  },

  grand(p, r, k, t) {
    const u = k.u, v = k.v;
    const pts = [g.P(u - k.hw, v, 0), g.P(u + k.hw, v + k.hv, 300)];
    p.group('city', boxOf(pts, 30), (c) => {
      const stone = '#e3d6b6';
      const b = { u0: u - 0.08, u1: u + 0.08, v0: v, v1: v + 0.06, z0: 0, z1: 135 };
      box(c, g, { ...b, color: stone, roof: '#6f8f7a' });
      const s = g.s(v);
      const [xa, yb] = g.P(b.u0, v, 0), [xb] = g.P(b.u1, v, 0);
      const w = xb - xa, hgt = 135 * s;
      // three great arched windows between columns
      for (let i = 0; i < 3; i++) {
        const ax = xa + w * (0.22 + i * 0.28), aw = w * 0.16, ay = yb - hgt * 0.18, ah = hgt * 0.62;
        c.fillStyle = '#3a4150';
        c.beginPath(); c.moveTo(ax - aw / 2, ay); c.lineTo(ax - aw / 2, ay - ah + aw / 2);
        c.arc(ax, ay - ah + aw / 2, aw / 2, Math.PI, 0); c.lineTo(ax + aw / 2, ay); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(232,220,190,.8)'; c.lineWidth = 0.8; c.beginPath();
        for (let j = 1; j < 4; j++) { c.moveTo(ax - aw / 2 + (aw * j) / 4, ay); c.lineTo(ax - aw / 2 + (aw * j) / 4, ay - ah + aw * 0.3); }
        for (let j = 1; j < 5; j++) { c.moveTo(ax - aw / 2, ay - (ah * j) / 5); c.lineTo(ax + aw / 2, ay - (ah * j) / 5); }
        c.stroke();
      }
      c.strokeStyle = INK; c.lineWidth = 1;
      c.beginPath();
      for (let i = 0; i < 4; i++) { const x = xa + w * (0.08 + i * 0.28); c.moveTo(x, yb); c.lineTo(x, yb - hgt * 0.85); c.moveTo(x + 6 * s, yb); c.lineTo(x + 6 * s, yb - hgt * 0.85); }
      c.stroke();
      // the attic with its clock and figures
      const [mx, my] = g.P(u, v, 135);
      c.fillStyle = stone;
      poly(c, [[mx - w * 0.22, my], [mx + w * 0.22, my], [mx + w * 0.16, my - 24 * s], [mx, my - 44 * s], [mx - w * 0.16, my - 24 * s]]); c.fill();
      c.stroke();
      c.fillStyle = '#f5eedb'; c.beginPath(); c.arc(mx, my - 18 * s, 9 * s, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(mx, my - 18 * s); c.lineTo(mx, my - 24 * s); c.moveTo(mx, my - 18 * s); c.lineTo(mx + 4 * s, my - 16 * s); c.stroke();
      c.fillStyle = '#6f8f7a';
      for (const dx of [-0.13, 0.13]) { c.beginPath(); c.ellipse(mx + dx * w, my - 12 * s, 6 * s, 13 * s, 0, 0, Math.PI * 2); c.fill(); c.stroke(); }
    }, { t, d: 1.0, reveal: 'rise' });
  },

  flatiron(p, r, k, t) {
    const u = k.u, v = k.v, d = 0.1, z = 250;
    const A = [u, v], B = [u - 0.055, v + d], C = [u + 0.055, v + d];
    const pts = [g.P(...A, 0), g.P(...B, z), g.P(...C, z), g.P(...A, z)];
    p.group('city', boxOf(pts, 10), (c) => {
      const col = '#e6d2ad', dk = '#c7ae86';
      const wall = (P0, P1, color) => {
        const q = [g.P(...P0, 0), g.P(...P1, 0), g.P(...P1, z), g.P(...P0, z)];
        c.fillStyle = color; poly(c, q); c.fill();
        // floors and window piers
        c.strokeStyle = 'rgba(60,52,48,.55)'; c.lineWidth = 0.7; c.beginPath();
        for (let zz = 16; zz < z - 8; zz += 11) { const a = g.P(...P0, zz), b = g.P(...P1, zz); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        for (let i = 1; i < 12; i++) { const f = i / 12; const uu = lerp(P0[0], P1[0], f), vv = lerp(P0[1], P1[1], f); const a = g.P(uu, vv, 10), b = g.P(uu, vv, z - 20); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        c.stroke();
        c.strokeStyle = INK; c.lineWidth = 1.1; poly(c, q); c.stroke();
      };
      wall(A, B, dk); wall(A, C, col);
      const roof = [g.P(...A, z), g.P(...B, z), g.P(...C, z)];
      c.fillStyle = '#a89377'; poly(c, roof); c.fill(); c.strokeStyle = INK; c.stroke();
      // cornice
      c.lineWidth = 2.4; c.strokeStyle = '#7d6a55';
      c.beginPath(); c.moveTo(...g.P(...B, z - 4)); c.lineTo(...g.P(...A, z - 4)); c.lineTo(...g.P(...C, z - 4)); c.stroke();
    }, { t, d: 1.1, reveal: 'rise' });
  },

  arch(p, r, k, t) {
    const u = k.u, v = k.v;
    const [x, y] = g.P(u, v, 0), s = g.s(v);
    const w = 0.04 * g.U * s, h = 95 * s;
    p.group('city', { x: x - w - 4, y: y - h - 4, w: 2 * w + 8, h: h + 8 }, (c) => {
      const marble = '#f1eadb';
      c.fillStyle = marble;
      c.beginPath(); c.rect(x - w, y - h, 2 * w, h);
      c.moveTo(x - w * 0.45, y); c.lineTo(x - w * 0.45, y - h * 0.48); c.arc(x, y - h * 0.48, w * 0.45, Math.PI, 0); c.lineTo(x + w * 0.45, y);
      c.fill('evenodd');
      c.strokeStyle = INK; c.lineWidth = 1.1; c.stroke();
      c.beginPath(); c.moveTo(x - w, y - h * 0.82); c.lineTo(x + w, y - h * 0.82); c.moveTo(x - w, y - h * 0.9); c.lineTo(x + w, y - h * 0.9); c.stroke();
      c.fillStyle = 'rgba(30,37,54,.25)'; c.fillRect(x + w * 0.6, y - h * 0.8, w * 0.4, h * 0.8);
    }, { t, d: 0.9, reveal: 'rise' });
  },

  woolworth(p, r, k, t) {
    const u = k.u, v = k.v;
    const top = g.P(u, v, 1000);
    p.group('city', { x: top[0] - 130, y: top[1] - 10, w: 260, h: g.y(v) - top[1] + 20 }, (c) => {
      const terra = '#ece2c8', terraD = '#cbbd9c';
      const vf = v + 0.01;
      box(c, g, { u0: u - 0.075, u1: u + 0.075, v0: vf, v1: vf + 0.07, z1: 300, color: terra, side: terraD });
      windows(c, g, { u0: u - 0.075, u1: u + 0.075, v0: vf, z1: 300, color: '#4f5464', cols: 16, fx: 0.4, fz: 0.68 });
      piers(c, u - 0.075, u + 0.075, vf, 0, 300, 8, 'rgba(60,60,70,.5)', 1.2);
      const v2 = vf + 0.012;
      box(c, g, { u0: u - 0.042, u1: u + 0.042, v0: v2, v1: v2 + 0.045, z0: 300, z1: 640, color: terra, side: terraD });
      windows(c, g, { u0: u - 0.042, u1: u + 0.042, v0: v2, z0: 300, z1: 640, color: '#4f5464', cols: 9, fx: 0.4, fz: 0.7 });
      piers(c, u - 0.042, u + 0.042, v2, 300, 640, 5, 'rgba(60,60,70,.55)', 1.4);
      const v3 = v2 + 0.008;
      box(c, g, { u0: u - 0.032, u1: u + 0.032, v0: v3, v1: v3 + 0.03, z0: 640, z1: 720, color: terra, side: terraD });
      windows(c, g, { u0: u - 0.032, u1: u + 0.032, v0: v3, z0: 640, z1: 720, color: '#4f5464', cols: 6, fx: 0.4, fz: 0.7 });
      // the copper roof and its pinnacles
      const [x0, y0] = g.P(u - 0.032, v3, 720), [x1] = g.P(u + 0.032, v3, 720);
      const mx = (x0 + x1) / 2, w = x1 - x0;
      const roof = [[x0, y0], [x1, y0], [mx + w * 0.12, y0 - w * 1.25], [mx, y0 - w * 1.55], [mx - w * 0.12, y0 - w * 1.25]];
      c.fillStyle = COPPER; poly(c, roof); c.fill();
      c.fillStyle = shade(COPPER, 0.75); poly(c, [[mx, y0], [x1, y0], [mx + w * 0.12, y0 - w * 1.25], [mx, y0 - w * 1.55]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.1; poly(c, roof); c.stroke();
      c.lineWidth = 0.6; c.beginPath();
      for (let i = 1; i < 6; i++) { const yy = y0 - w * 1.25 * (i / 6); const ww = w / 2 * (1 - i / 6 * 0.86); c.moveTo(mx - ww, yy); c.lineTo(mx + ww, yy); }
      c.stroke();
      c.lineWidth = 1.2; c.beginPath(); c.moveTo(mx, y0 - w * 1.55); c.lineTo(mx, y0 - w * 1.95); c.stroke();
      for (const f of [-0.5, 0.5]) {
        const px = mx + f * w;
        c.fillStyle = terra; poly(c, [[px - 3, y0], [px + 3, y0], [px, y0 - 22]]); c.fill(); c.lineWidth = 0.8; c.stroke();
      }
      for (const f of [-0.075, 0.075]) {
        const [px, py] = g.P(u + f, vf, 300);
        c.fillStyle = terra; poly(c, [[px - 3, py], [px + 3, py], [px, py - 18]]); c.fill(); c.stroke();
      }
    }, { t: t - 0.3, d: 1.3, reveal: 'rise', ease: 'inOut' });
  },

  wall(p, r, k, t) {
    const u = k.u, v = k.v;
    const top = g.P(u, v, 900);
    p.group('city', { x: top[0] - 120, y: top[1] - 10, w: 240, h: g.y(v) - top[1] + 20 }, (c) => {
      const tan = '#d6bf93';
      tiers(c, u, v, [[0.06, 0.03, 0, 300, tan, '#4e5160'], [0.045, 0.024, 300, 560, tan, '#4e5160'], [0.034, 0.018, 560, 650, tan, '#4e5160']], { depth: 0.06, pitch: 6.5 });
      const vf = v + 0.03 - 0.018;
      const [x0, y0] = g.P(u - 0.034, vf, 650), [x1] = g.P(u + 0.034, vf, 650);
      const mx = (x0 + x1) / 2, w = x1 - x0;
      const roof = [[x0, y0], [x1, y0], [mx, y0 - w * 1.1]];
      c.fillStyle = '#5f8c79'; poly(c, roof); c.fill();
      c.fillStyle = '#4a7262'; poly(c, [[mx, y0], [x1, y0], [mx, y0 - w * 1.1]]); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.1; poly(c, roof); c.stroke();
      c.beginPath(); c.moveTo(mx, y0 - w * 1.1); c.lineTo(mx, y0 - w * 1.6); c.stroke();
      c.fillStyle = '#2c3446';
      for (let i = 0; i < 3; i++) { const yy = y0 - w * (0.25 + i * 0.25); const ww = w * (0.5 - i * 0.12) * 0.4; c.fillRect(mx - ww / 2 - w * 0.12, yy - 4, 3, 5); c.fillRect(mx + w * 0.1 - ww / 4, yy - 4, 3, 5); }
    }, { t: t - 0.2, d: 1.2, reveal: 'rise', ease: 'inOut' });
  },
};

// ---------------------------------------------------------------- the bridge
function bridge(p, r) {
  const deckL = [1105, 1596], deckR = [1600, 1548];
  const tx = 1395, tTop = 1150, tBase = 1735, tw = 112;
  const deckY = (x) => lerp(deckL[1], deckR[1], (x - deckL[0]) / (deckR[0] - deckL[0]));
  const stone = '#d2bd96', stoneD = '#ad9671';

  // the tower's foot in the water
  p.fill('bridge', [[tx - tw * 0.62, tBase - 30], [tx + tw * 0.62, tBase - 30], [tx + tw * 0.68, tBase + 10], [tx - tw * 0.68, tBase + 10]], stoneD, { t: 8.4, d: 0.6, reveal: 'rise', line: INK, lw: 1.3 });
  // the tower: stone, with two pointed arches the deck runs through
  p.group('bridge', { x: tx - tw / 2 - 20, y: tTop - 40, w: tw + 40, h: tBase - tTop + 40 }, (c) => {
    const x0 = tx - tw / 2, x1 = tx + tw / 2;
    const archTop = tTop + 150, aw = tw * 0.15;
    const arch = (ax) => {
      const bot = deckY(ax) - 14;
      c.moveTo(ax - aw, bot); c.lineTo(ax - aw, archTop + aw * 1.6);
      c.quadraticCurveTo(ax - aw, archTop + aw * 0.3, ax, archTop);
      c.quadraticCurveTo(ax + aw, archTop + aw * 0.3, ax + aw, archTop + aw * 1.6);
      c.lineTo(ax + aw, bot); c.closePath();
    };
    const body = () => {
      c.beginPath();
      c.moveTo(x0 + 8, tBase - 30); c.lineTo(x0, tTop + 46); c.lineTo(x0 - 7, tTop + 30); c.lineTo(x0 - 7, tTop);
      c.lineTo(x1 + 7, tTop); c.lineTo(x1 + 7, tTop + 30); c.lineTo(x1, tTop + 46); c.lineTo(x1 - 8, tBase - 30); c.closePath();
      arch(tx - tw * 0.25); arch(tx + tw * 0.25);
    };
    body(); c.fillStyle = stone; c.fill('evenodd');
    c.save(); body(); c.clip('evenodd');
    // the shaded pier on the right, and the courses of stone
    c.fillStyle = stoneD; c.fillRect(tx + tw * 0.25 + aw, tTop, tw, tBase);
    c.fillStyle = 'rgba(120,95,65,.35)'; c.fillRect(tx - tw * 0.25 + aw, tTop + 46, tw * 0.5 - 2 * aw, tBase);
    c.strokeStyle = 'rgba(90,70,50,.32)'; c.lineWidth = 0.7; c.beginPath();
    for (let y = tTop + 56; y < tBase; y += 12) { c.moveTo(x0 - 8, y); c.lineTo(x1 + 8, y); }
    c.stroke();
    c.restore();
    // the arches' deep reveals
    c.strokeStyle = 'rgba(70,55,40,.6)'; c.lineWidth = 3;
    c.beginPath(); arch(tx - tw * 0.25); arch(tx + tw * 0.25); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.6; body(); c.stroke();
    c.lineWidth = 1.2; c.beginPath();
    c.moveTo(x0 - 7, tTop + 30); c.lineTo(x1 + 7, tTop + 30); c.moveTo(x0, tTop + 46); c.lineTo(x1, tTop + 46);
    c.moveTo(x0 + 2, archTop - 20); c.lineTo(x1 - 2, archTop - 20);
    c.stroke();
  }, { t: 8.5, d: 1.4, reveal: 'rise', ease: 'inOut' });

  // the deck
  const deck = [[deckL[0], deckL[1] - 14], [deckR[0], deckR[1] - 14], [deckR[0], deckR[1] + 6], [deckL[0], deckL[1] + 6]];
  p.group('bridge', boxOf(deck, 4), (c) => {
    c.fillStyle = '#a4917a'; poly(c, deck); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; poly(c, deck); c.stroke();
    c.lineWidth = 0.6; c.beginPath();
    for (let x = deckL[0]; x < deckR[0]; x += 9) { c.moveTo(x, deckY(x) - 14); c.lineTo(x + 9, deckY(x + 9) + 6); }
    c.stroke();
  }, { t: 9.0, d: 1.1, reveal: 'wipeL' });

  // the cables: the side span down to the city, the main span out to Brooklyn
  const saddleL = [tx - tw * 0.36, tTop + 8], saddleR = [tx + tw * 0.36, tTop + 8];
  const curve = (a, b, sag, n = 40) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      pts.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f) + sag * 4 * f * (1 - f)]);
    }
    return pts;
  };
  const side = curve(saddleL, [deckL[0] + 8, deckL[1] - 30], 70);
  const main = curve(saddleR, [deckR[0] + 220, deckR[1] - 420], 420, 60);
  for (const off of [0, 7]) {
    p.pen('bridge', side.map(([x, y]) => [x + off * 0.4, y + off]), INK, 2.2, { t: 9.6, d: 1.3 });
    p.pen('bridge', main.map(([x, y]) => [x + off * 0.4, y + off]), INK, 2.2, { t: 9.6, d: 1.6 });
  }
  // suspenders hanging from the cables, and the stays fanning from the tower
  const hang = [];
  for (const cable of [side, main]) {
    for (let i = 1; i < cable.length - 1; i++) {
      const [x, y] = cable[i];
      if (x > deckR[0] || x < deckL[0]) continue;
      hang.push([[x, y + 2], [x, deckY(x) - 14]]);
    }
  }
  const stays = [];
  for (let i = 1; i <= 7; i++) {
    stays.push([saddleL, [tx - tw / 2 - i * 34, deckY(tx - tw / 2 - i * 34) - 14]]);
    stays.push([saddleR, [tx + tw / 2 + i * 34, deckY(tx + tw / 2 + i * 34) - 14]]);
  }
  p.strokes('bridge', hang, INK, 0.8, { t: 10.2, d: 1.2, reveal: 'fall' });
  p.strokes('bridge', stays, INK, 0.9, { t: 10.5, d: 1.1, reveal: 'fade' });

  // traffic on the deck
  for (let i = 0; i < 6; i++) {
    const ph = i / 6 + r.range(0, 0.08), sp = r.range(0.022, 0.032) * (i % 2 ? 1 : -1);
    const col = r.pick(['#e8b62a', '#e8b62a', '#3b6f8a', '#b8412f', '#e9e2cf']);
    p.live('bridge', {
      t: 10.6 + i * 0.15, d: 0.6, reveal: 'fade',
      draw: (c, time) => {
        let f = (ph + time * sp) % 1; if (f < 0) f += 1;
        const x = lerp(deckL[0] + 20, deckR[0] + 20, f);
        const y = deckY(x) - 14 - (i % 2 ? 0 : 1);
        c.fillStyle = col; c.fillRect(x - 9, y - 7, 18, 7);
        c.fillStyle = '#2b2f38'; c.fillRect(x - 5, y - 10, 10, 3.5);
        c.strokeStyle = INK; c.lineWidth = 0.8; c.strokeRect(x - 9, y - 7, 18, 7);
      },
    });
  }
}

// ---------------------------------------------------------------- Liberty
function liberty(p, r) {
  const bx = 230, gy = 1868; // the top of the pedestal's plinth
  // the island and its star-shaped fort
  const isl = [];
  for (let a = 0; a <= Math.PI * 2 + 1e-6; a += Math.PI / 30) isl.push([bx + Math.cos(a) * 250 + Math.sin(a * 3) * 10, 1935 + Math.sin(a) * 52]);
  p.fill('front', isl, '#a8a37a', { t: 9.0, d: 0.9, reveal: 'fade', line: INK, lw: 1.5 });
  const star = [];
  for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2 - Math.PI / 2; const rr = i % 2 ? 108 : 150; star.push([bx + Math.cos(a) * rr, 1915 + Math.sin(a) * rr * 0.3]); }
  p.fill('front', star, '#cfbf9b', { t: 9.2, d: 0.8, reveal: 'fade', line: INK, lw: 1.2 });
  p.group('front', { x: bx - 260, y: 1880, w: 520, h: 110 }, (c) => {
    const rr = rng(9);
    for (let i = 0; i < 16; i++) {
      const a = rr.range(Math.PI * 0.1, Math.PI * 0.9), d = rr.range(170, 235);
      tree(c, bx + Math.cos(a) * d * (rr.chance(0.5) ? 1 : -1), 1935 + Math.sin(a) * 40, 16, { color: TREE, line: INK, lw: 0.7, r: rr });
    }
  }, { t: 9.5, d: 0.9, reveal: 'rise' });

  // the pedestal
  p.group('front', { x: bx - 120, y: 1560, w: 240, h: 330 }, (c) => {
    const gr = '#d3c29f', grD = '#ab9876';
    const stepped = [[100, 1885, 1862], [86, 1862, 1832], [70, 1832, 1650], [80, 1650, 1636], [62, 1636, 1585]];
    for (const [w, y0, y1] of stepped) {
      c.fillStyle = gr; c.fillRect(bx - w, y1, 2 * w, y0 - y1);
      c.fillStyle = grD; c.fillRect(bx + w * 0.35, y1, w * 0.65, y0 - y1);
      c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(bx - w, y1, 2 * w, y0 - y1);
    }
    // the loggia openings and the stone courses
    c.fillStyle = '#3a3f4c';
    for (const dx of [-38, 0, 38]) { c.beginPath(); c.moveTo(bx + dx - 9, 1700); c.lineTo(bx + dx - 9, 1676); c.arc(bx + dx, 1676, 9, Math.PI, 0); c.lineTo(bx + dx + 9, 1700); c.fill(); }
    c.strokeStyle = 'rgba(30,37,54,.45)'; c.lineWidth = 0.8; c.beginPath();
    for (let y = 1720; y < 1830; y += 12) { c.moveTo(bx - 70, y); c.lineTo(bx + 70, y); }
    c.moveTo(bx - 70, 1712); c.lineTo(bx + 70, 1712);
    c.stroke();
    c.fillStyle = '#3a3f4c'; c.fillRect(bx - 12, 1600, 24, 24);
  }, { t: 9.3, d: 1.2, reveal: 'rise' });

  // the statue: robe, arm and torch, tablet, crown
  const S = 560, fy = 1585; // her height, and where she stands
  const P = (x, y) => [bx + x * S, fy - y * S];
  const robe = [P(-0.13, 0), P(0.14, 0), P(0.12, 0.2), P(0.1, 0.42), P(0.085, 0.6), P(0.05, 0.66), P(-0.05, 0.665), P(-0.09, 0.6), P(-0.105, 0.4), P(-0.12, 0.2)];
  const arm = [P(-0.095, 0.58), P(-0.035, 0.63), P(-0.058, 0.8), P(-0.064, 0.87), P(-0.106, 0.865), P(-0.108, 0.79)];
  const tablet = [P(0.06, 0.4), P(0.15, 0.45), P(0.12, 0.62), P(0.03, 0.57)];
  const torchCup = [P(-0.11, 0.86), P(-0.06, 0.86), P(-0.055, 0.9), P(-0.115, 0.9)];
  const flame = [P(-0.12, 0.9), P(-0.115, 0.95), P(-0.1, 0.975), P(-0.085, 1.02), P(-0.078, 0.975), P(-0.062, 0.955), P(-0.05, 0.9)];
  const green = '#7aa592', greenD = '#557f6e', greenL = '#a9cbbb';
  p.group('front', { x: bx - 0.2 * S, y: fy - 1.03 * S, w: 0.4 * S, h: 1.05 * S }, (c) => {
    c.lineJoin = 'round';
    // robe with its shaded side
    c.fillStyle = green; poly(c, robe); c.fill();
    c.save(); poly(c, robe); c.clip();
    c.fillStyle = greenD; poly(c, [P(0.02, 0), P(0.2, 0), P(0.2, 0.7), P(0.02, 0.66)]); c.fill();
    // folds
    c.strokeStyle = 'rgba(30,50,45,.55)'; c.lineWidth = 1.3; c.beginPath();
    const folds = [[-0.08, 0.02, -0.06, 0.55], [-0.04, 0.0, -0.02, 0.5], [0.0, 0.01, 0.03, 0.42], [0.05, 0.0, 0.07, 0.36], [0.1, 0.02, 0.09, 0.3], [-0.11, 0.1, -0.08, 0.35]];
    for (const [x0, y0, x1, y1] of folds) { const a = P(x0, y0), b = P(x1, y1), m = P((x0 + x1) / 2 + 0.012, (y0 + y1) / 2); c.moveTo(...a); c.quadraticCurveTo(m[0], m[1], b[0], b[1]); }
    c.stroke();
    c.strokeStyle = greenL; c.lineWidth = 1.1; c.beginPath();
    for (const [x0, y0, x1, y1] of folds) { const a = P(x0 - 0.008, y0), b = P(x1 - 0.008, y1); c.moveTo(...a); c.lineTo(...b); }
    c.stroke();
    // the sash across the robe
    c.fillStyle = greenD; poly(c, [P(-0.09, 0.5), P(0.09, 0.62), P(0.09, 0.58), P(-0.09, 0.46)]); c.fill();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.6; poly(c, robe); c.stroke();
    // the raised arm and torch
    c.fillStyle = green; poly(c, arm); c.fill(); c.stroke();
    c.fillStyle = '#c9a64e'; poly(c, torchCup); c.fill(); c.stroke();
    c.fillStyle = '#e8b43c'; poly(c, flame); c.fill();
    c.fillStyle = '#f4d47a'; poly(c, [P(-0.1, 0.9), P(-0.09, 0.95), P(-0.075, 0.91)]); c.fill();
    c.strokeStyle = INK; poly(c, flame); c.stroke();
    // the tablet
    c.fillStyle = greenL; poly(c, tablet); c.fill(); c.strokeStyle = INK; c.stroke();
    c.fillStyle = greenD; poly(c, [P(0.11, 0.43), P(0.15, 0.45), P(0.12, 0.62), P(0.09, 0.6)]); c.fill();
    // the head and the crown's seven rays
    const [hx, hy] = P(-0.005, 0.7), hr = 0.035 * S;
    c.fillStyle = green; c.beginPath(); c.arc(hx, hy, hr, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.stroke();
    c.fillStyle = greenD; c.beginPath(); c.arc(hx + hr * 0.3, hy + hr * 0.1, hr * 0.7, -0.6, 1.6); c.fill();
    c.fillStyle = green; c.beginPath(); c.ellipse(hx, hy - hr * 0.6, hr * 1.2, hr * 0.35, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.32;
      const bx0 = hx + Math.cos(a) * hr * 0.9, by0 = hy - hr * 0.7 + Math.sin(a) * hr * 0.3;
      const tx0 = hx + Math.cos(a) * hr * 2.6, ty0 = hy - hr * 0.7 + Math.sin(a) * hr * 2.2;
      const nx = -Math.sin(a) * hr * 0.16, ny = Math.cos(a) * hr * 0.16;
      poly(c, [[bx0 - nx, by0 - ny], [bx0 + nx, by0 + ny], [tx0, ty0]]); c.fill(); c.stroke();
    }
  }, { t: 9.6, d: 1.9, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- the harbor
function harbor(p, r) {
  // the ferry, crossing slowly
  p.live('harbor', {
    t: 10.2, d: 1.2, reveal: 'slide', dx: -180,
    draw: (c, time) => {
      const x = 560 + Math.min(time, 60) * 3.2, y = 1872 + Math.sin(time * 0.9) * 1.6;
      ferry(c, x, y);
      // smoke from the stack
      for (let i = 0; i < 6; i++) {
        const age = ((time * 0.35 + i / 6) % 1);
        c.fillStyle = `rgba(245,240,230,${0.75 * (1 - age)})`;
        c.strokeStyle = `rgba(30,37,54,${0.5 * (1 - age)})`; c.lineWidth = 1;
        const sx = x + 190 - age * 70, sy = y - 128 - age * 80, sr = 8 + age * 20;
        c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill(); c.stroke();
      }
    },
  });
  // sailboats and a tug
  const boats = [[480, 1742, 0.8], [1490, 1880, 1.05], [1060, 1748, 0.62]];
  boats.forEach(([x, y, s], i) => {
    p.live('harbor', {
      t: 10.4 + i * 0.3, d: 1.0, reveal: 'slide', dx: 60,
      draw: (c, time) => {
        const dx = Math.sin(time * 0.22 + i) * 12;
        c.save(); c.translate(x + dx, y + Math.sin(time * 1.3 + i * 2) * 1.5); c.rotate(Math.sin(time * 1.1 + i) * 0.03);
        sailboat(c, 0, 0, s * 1.3, { line: INK, hull: '#2c3446' });
        c.restore();
        wake(c, x + dx - 36 * s, y + 2, s);
      },
    });
  });
  p.live('harbor', {
    t: 10.8, d: 1.0, reveal: 'slide', dx: 80,
    draw: (c, time) => {
      const x = 1170 - Math.min(time, 60) * 1.6, y = 1792;
      tug(c, x, y, 0.9);
      for (let i = 0; i < 5; i++) {
        const age = ((time * 0.5 + i / 5) % 1);
        c.fillStyle = `rgba(60,62,70,${0.55 * (1 - age)})`;
        c.beginPath(); c.arc(x + 14 + age * 30, y - 56 - age * 50, 5 + age * 12, 0, Math.PI * 2); c.fill();
      }
    },
  });
  // gulls
  for (let i = 0; i < 6; i++) {
    const x0 = r.range(500, 1300), y0 = r.range(1150, 1500), ph = r() * 6, sp = r.range(0.15, 0.3);
    p.live('harbor', {
      t: 11 + i * 0.2, d: 0.8, reveal: 'fade',
      draw: (c, time) => {
        const a = time * sp + ph;
        gull(c, x0 + Math.cos(a) * 60, y0 + Math.sin(a * 1.3) * 20, 1.1, (Math.sin(time * 5 + ph) + 1) / 2, INK);
      },
    });
  }
}

function wake(c, x, y, s) {
  c.strokeStyle = 'rgba(240,240,228,.8)'; c.lineWidth = 1.4 * s;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x - 50 * s, y + 3 * s); c.moveTo(x + 10 * s, y + 4 * s); c.lineTo(x - 30 * s, y + 7 * s); c.stroke();
}

function ferry(c, x, y) {
  const L = 380;
  c.lineJoin = 'round';
  // wake
  c.strokeStyle = 'rgba(240,240,228,.85)'; c.lineWidth = 2;
  c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(x - 10 - i * 30, y + 4 + i * 2); c.lineTo(x - 60 - i * 40, y + 6 + i * 3); } c.stroke();
  // hull
  const hull = [[x, y - 34], [x + L, y - 34], [x + L - 18, y], [x + 14, y]];
  c.fillStyle = '#cf6537'; poly(c, hull); c.fill();
  c.fillStyle = '#a84c2a'; poly(c, [[x + 6, y - 14], [x + L - 8, y - 14], [x + L - 18, y], [x + 14, y]]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.5; poly(c, hull); c.stroke();
  c.fillStyle = '#2a2f3a'; c.beginPath();
  for (let i = 0; i < 26; i++) c.rect(x + 22 + i * 13.4, y - 29, 7, 8);
  c.fill();
  // decks
  const deck = (x0, x1, y0, h, col) => {
    c.fillStyle = col; c.fillRect(x0, y0 - h, x1 - x0, h);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x0, y0 - h, x1 - x0, h);
  };
  deck(x + 18, x + L - 18, y - 34, 26, '#d96d3c');
  c.fillStyle = '#2a2f3a'; c.beginPath(); for (let i = 0; i < 24; i++) c.rect(x + 28 + i * 13.5, y - 54, 8, 12); c.fill();
  deck(x + 44, x + L - 44, y - 60, 22, '#e9dfc7');
  c.fillStyle = '#2a2f3a'; c.beginPath(); for (let i = 0; i < 19; i++) c.rect(x + 54 + i * 14, y - 77, 8, 10); c.fill();
  deck(x + 150, x + 230, y - 82, 18, '#e9dfc7');
  c.fillStyle = '#2a2f3a'; c.fillRect(x + 160, y - 96, 60, 7);
  // the stack
  c.fillStyle = '#cf6537'; c.fillRect(x + 182, y - 122, 18, 40);
  c.fillStyle = '#22262e'; c.fillRect(x + 182, y - 128, 18, 9);
  c.strokeStyle = INK; c.strokeRect(x + 182, y - 128, 18, 46);
  // rails
  c.lineWidth = 0.7; c.beginPath(); c.moveTo(x + 18, y - 66); c.lineTo(x + L - 18, y - 66);
  for (let xx = x + 22; xx < x + L - 18; xx += 7) { c.moveTo(xx, y - 60); c.lineTo(xx, y - 66); }
  c.stroke();
}

function tug(c, x, y, s) {
  c.lineJoin = 'round';
  const hull = [[x - 50 * s, y - 16 * s], [x + 60 * s, y - 20 * s], [x + 50 * s, y], [x - 42 * s, y]];
  c.fillStyle = '#2f3a4c'; poly(c, hull); c.fill();
  c.fillStyle = '#b8412f'; c.fillRect(x - 46 * s, y - 20 * s, 102 * s, 5 * s);
  c.strokeStyle = INK; c.lineWidth = 1.2; poly(c, hull); c.stroke();
  c.fillStyle = '#e8dfc8'; c.fillRect(x - 22 * s, y - 40 * s, 44 * s, 22 * s); c.strokeRect(x - 22 * s, y - 40 * s, 44 * s, 22 * s);
  c.fillStyle = '#2a2f3a'; for (let i = 0; i < 4; i++) c.fillRect(x - 18 * s + i * 10 * s, y - 35 * s, 6 * s, 6 * s);
  c.fillStyle = '#e8dfc8'; c.fillRect(x - 10 * s, y - 54 * s, 24 * s, 14 * s); c.strokeRect(x - 10 * s, y - 54 * s, 24 * s, 14 * s);
  c.fillStyle = '#b8412f'; c.fillRect(x + 8 * s, y - 70 * s, 10 * s, 18 * s);
  c.fillStyle = '#22262e'; c.fillRect(x + 8 * s, y - 72 * s, 10 * s, 5 * s);
  c.strokeRect(x + 8 * s, y - 72 * s, 10 * s, 20 * s);
  wake(c, x - 50 * s, y + 2, s * 1.4);
}

// ---------------------------------------------------------------- title and frame
function title(p) {
  const o = { family: '"Cinzel Decorative", serif', weight: 900, size: 330, color: INK, gap: 0.13, d: 0.9 };
  p.type('title', 'NEW', 392, 415, { ...o, align: 'center', fit: 620, t: 11.2 });
  p.type('title', 'YORK', 1210, 415, { ...o, align: 'center', fit: 680, t: 11.6 });
}

function frame(p) {
  const rect = (i) => [[i, i], [W - i, i], [W - i, H - i], [i, H - i], [i, i]];
  p.pen('frame', rect(46), INK, 2.6, { t: 12.4, d: 1.6, cap: 'square' });
  p.pen('frame', rect(32), INK, 1.1, { t: 12.7, d: 1.6, cap: 'square' });
}
