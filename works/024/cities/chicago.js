// Chicago: a 1933 world's-fair poster, airbrushed. The Loop at dusk from high over
// Lake Michigan, looking west into the afterglow: the towers dark against the sky
// with their windows coming on, the river running in from the lake with its
// bascule bridges raised, the L's tracks through the streets, the Willis Tower and
// the Board of Trade in the Loop, the Wrigley Building floodlit white on the river
// and the Tribune Tower beside it, Grant Park and Buckingham Fountain, Navy Pier,
// the street grid glowing out to the prairie, searchlights fanning from the
// lakefront and an airship crossing. The title in tall condensed capitals below.

import { Plate, W, H, boxOf } from '../print.js';
import { Ground, mix, lerp, clamp, poly, rng } from '../kit.js';

// the inks: indigo night above, the afterglow at the horizon, violet towers, amber light
const NIGHT = '#141634', INDIGO = '#22205a', VIOLET = '#4a3a7e', MAUVE = '#9a5f8c', ROSE = '#e0786a', AMBER = '#f5a74a', GLOW = '#ffdc8f';
const T_TOP = ['#6c5a9c', '#5d5592', '#7a6198', '#59649a', '#8a6a9c'], T_FOOT = '#1c1a3c';
const LIME = '#d9cfd8', LIME_D = '#8e809e', TERRA = '#f4ead8';
const LAKE = '#1d2f63', LAKE_D = '#121c44', LAKE_L = '#3c5a9a';
const PARK = '#1f4a4a', PARK_L = '#2f6a5e', LAMP = '#ffd27a', RIVER = '#2a3f78';
const STEEL = '#2a2a44', CREAM = '#f6e6c4';

export const city = {
  id: 'chicago', name: 'Chicago', wall: '#16152c',
  alt: "Chicago at dusk in the style of a 1933 world's fair poster, seen from high over Lake Michigan: the Loop's towers dark against the afterglow with lit windows, the Willis Tower and the Board of Trade, the river with its bascule bridges raised, the elevated tracks, the Wrigley Building floodlit beside the Tribune Tower, Grant Park with Buckingham Fountain, Navy Pier, the fair's Sky Ride towers and pavilions on Northerly Island, the street grid glowing out to the prairie, searchlights over the lakefront and an airship",
  google: 'family=League+Gothic',
  fonts: [['400 330px "League Gothic"', 'CHICAGO'], ['400 46px "League Gothic"', '1833 · A CENTURY OF PROGRESS · 1933LAKE MICHIGAN ILLINOIS']],
  build,
};

// the picture and the ground under it, seen from over the lake
const PX0 = 60, PY0 = 60, PX1 = W - 60, PY1 = 1590;
const g = new Ground({ cx: 820, hy: 640, y0: 1640, U: 1500, K: 1 });
const SHORE = 0.62, RIV0 = 0.06, RIV1 = 0.12, FORK = 2.3, FORK1 = 2.4;

function build() {
  const p = new Plate({ paper: NIGHT, seed: 1933 });
  const r = p.r;
  p.clip = { x: PX0, y: PY0, w: PX1 - PX0, h: PY1 - PY0 };
  p.stack('sky', 'ground', 'city', 'near', 'beams', 'life', 'frame', 'title');
  for (const n of ['frame', 'title']) p.layer(n, { clip: false });

  frame(p);
  sky(p, r);
  ground(p, r);
  town(p, r);
  near(p, r);
  life(p, r);
  title(p);
  return p;
}

// ================================================================ the frame
function frame(p) {
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.beginPath(); c.rect(0, 0, W, H); c.rect(PX0, PY0, PX1 - PX0, PY1 - PY0); c.fillStyle = NIGHT; c.fill('evenodd');
    c.strokeStyle = AMBER; c.lineWidth = 3; c.strokeRect(PX0 - 14, PY0 - 14, PX1 - PX0 + 28, PY1 - PY0 + 28);
    c.strokeStyle = 'rgba(245,167,74,.45)'; c.lineWidth = 1.5; c.strokeRect(PX0 - 24, PY0 - 24, PX1 - PX0 + 48, H - 2 * PY0 + 48 - 24);
    // the stepped corners, as on a deco doorway
    c.fillStyle = AMBER;
    for (const [x, y, sx, sy] of [[PX0 - 14, PY0 - 14, 1, 1], [PX1 + 14, PY0 - 14, -1, 1], [PX0 - 14, PY1 + 14, 1, -1], [PX1 + 14, PY1 + 14, -1, -1]]) {
      for (let k = 0; k < 3; k++) c.fillRect(x + sx * (k * 12) - (sx < 0 ? 8 : 0), y + sy * (k * 12) - (sy < 0 ? 8 : 0), 8, 8);
    }
  }, { t: 0, d: 0.8, reveal: 'fade' });
}

// ================================================================ the sky
function sky(p, r) {
  p.group('sky', { x: PX0, y: PY0, w: PX1 - PX0, h: g.hy - PY0 + 80 }, (c) => {
    const gr = c.createLinearGradient(0, PY0, 0, g.hy + 20);
    gr.addColorStop(0, NIGHT); gr.addColorStop(0.3, INDIGO); gr.addColorStop(0.58, VIOLET);
    gr.addColorStop(0.78, MAUVE); gr.addColorStop(0.9, ROSE); gr.addColorStop(0.97, AMBER); gr.addColorStop(1, GLOW);
    c.fillStyle = gr; c.fillRect(PX0, PY0, PX1 - PX0, g.hy - PY0 + 80);
  }, { t: 0.3, d: 1.4, reveal: 'rise', ease: 'inOut' });
  // the sun just gone: a soft dome of light on the horizon
  p.group('sky', { x: PX0, y: g.hy - 360, w: PX1 - PX0, h: 400 }, (c) => {
    const gr = c.createRadialGradient(720, g.hy + 10, 10, 720, g.hy + 10, 520);
    gr.addColorStop(0, 'rgba(255,236,170,.95)'); gr.addColorStop(0.25, 'rgba(255,190,110,.55)'); gr.addColorStop(1, 'rgba(255,150,100,0)');
    c.fillStyle = gr; c.fillRect(PX0, g.hy - 360, PX1 - PX0, 400);
  }, { t: 1.2, d: 1.2, reveal: 'fade' });
  // streamlined clouds: long lit bands with rounded ends
  const bands = [];
  for (let i = 0; i < 9; i++) { const y = r.range(280, 590), x = r.range(PX0 - 100, PX1 - 300), w = r.range(240, 620), h = r.range(7, 16); bands.push([x, y, w, h]); }
  p.group('sky', { x: PX0, y: 240, w: PX1 - PX0, h: 380 }, (c) => {
    for (const [x, y, w, h] of bands) {
      const k = (y - 280) / 310;
      c.fillStyle = mix('#8d6aa6', '#f39a78', k); c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fill();
      c.fillStyle = mix('#b892c0', '#ffd09a', k); c.beginPath(); c.roundRect(x + h, y, w - 2 * h, h * 0.35, h * 0.2); c.fill();
    }
  }, { t: 1.6, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // the first stars, high up
  const stars = []; for (let i = 0; i < 70; i++) stars.push([r.range(PX0, PX1), r.range(PY0 + 10, 330), r.range(0.8, 2)]);
  p.group('sky', { x: PX0, y: PY0, w: PX1 - PX0, h: 300 }, (c) => {
    c.fillStyle = '#f2e8d6'; c.beginPath(); for (const [x, y, s] of stars) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
  }, { t: 2.0, d: 1.0, reveal: 'fade' });
}

// ================================================================ the ground: the lake, the grid, the river, the park
const Y = (v) => g.y(v);
function quad(u0, u1, v0, v1, z = 0) { return [g.P(u0, v0, z), g.P(u1, v0, z), g.P(u1, v1, z), g.P(u0, v1, z)]; }
function ground(p, r) {
  const ys = Y(SHORE);
  // the land: dark slate, warming toward the glow at the horizon
  p.group('ground', { x: PX0, y: g.hy - 4, w: PX1 - PX0, h: ys - g.hy + 10 }, (c) => {
    const gr = c.createLinearGradient(0, g.hy, 0, ys);
    gr.addColorStop(0, '#c9786e'); gr.addColorStop(0.04, '#6a4a74'); gr.addColorStop(0.25, '#352c5a'); gr.addColorStop(1, '#221d44');
    c.fillStyle = gr; c.fillRect(PX0, g.hy, PX1 - PX0, ys - g.hy + 4);
  }, { t: 1.8, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // the grid of streets, lit, running out to the prairie: the long ones first
  const longs = [], cross = [];
  for (let u = -14; u <= 14; u += 0.12) longs.push([g.P(u, u > -4 && u < 4 ? SHORE : 3), g.P(u, 60)]);
  for (let v = SHORE; v < 40; v *= 1.11) { const s = g.s(v), uu = 1.2 / s; cross.push([g.P(-uu, v), g.P(uu, v), s]); }
  p.mark('ground', {
    t: 2.3, d: 1.4, reveal: 'fall', ease: 'inOut', box: { x: PX0, y: g.hy, w: PX1 - PX0, h: ys - g.hy },
    draw: (c) => {
      c.lineCap = 'butt';
      c.strokeStyle = 'rgba(255,196,110,.38)'; c.lineWidth = 1.1;
      c.beginPath(); for (const [a, b] of longs) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
      for (const [a, b, s] of cross) { c.strokeStyle = `rgba(255,${180 + 40 * (1 - s)},110,${0.2 + s * 0.4})`; c.lineWidth = Math.max(0.6, 2 * s); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      // the boulevards, brighter: the diagonals out to the northwest and southwest
      c.strokeStyle = 'rgba(255,214,140,.55)'; c.lineWidth = 1.6;
      c.beginPath(); let a = g.P(0.2, 2.4), b = g.P(3.5, 30); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); a = g.P(-0.4, 2.6); b = g.P(-4.5, 30); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    },
  });
  // the river: in from the lake, then forking north and south at Wolf Point
  p.group('ground', { x: PX0, y: g.hy, w: PX1 - PX0, h: ys - g.hy + 10 }, (c) => {
    c.fillStyle = RIVER;
    poly(c, quad(RIV0, RIV1, SHORE - 0.02, FORK1)); c.fill();
    poly(c, quad(-4, 4, FORK, FORK1)); c.fill();
    // the light on it
    c.strokeStyle = 'rgba(255,190,130,.5)'; c.lineWidth = 1.2;
    c.beginPath(); for (let v = SHORE; v < FORK; v += 0.06) { const a = g.P(RIV0 + 0.012, v), b = g.P(RIV1 - 0.012, v); c.moveTo(a[0], a[1]); c.lineTo(lerp(a[0], b[0], 0.5), a[1]); } c.stroke();
  }, { t: 3.0, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // Grant Park: lawns in their geometry, paths, rows of trees, the lamps along the drive
  const beds = [];
  for (let u = -1.6; u < 0.0; u += 0.16) for (const [v0, v1] of [[0.66, 0.76], [0.8, 0.92]]) beds.push(quad(u + 0.012, u + 0.148, v0, v1));
  const trees = [];
  for (let u = -1.6; u < 0.04; u += 0.035) for (const v of [0.655, 0.78, 0.935]) trees.push([...g.P(u, v), g.s(v)]);
  p.group('ground', { x: PX0, y: Y(0.95) - 10, w: PX1 - PX0, h: ys - Y(0.95) + 16 }, (c) => {
    c.fillStyle = '#2a2a48'; poly(c, quad(-4, RIV0, SHORE, 0.96)); c.fill();
    c.fillStyle = PARK; for (const b of beds) { poly(c, b); c.fill(); }
    c.fillStyle = PARK_L; for (const b of beds) { const [a, bb, cc, d] = b; poly(c, [a, bb, [lerp(bb[0], cc[0], 0.3), lerp(bb[1], cc[1], 0.3)], [lerp(a[0], d[0], 0.3), lerp(a[1], d[1], 0.3)]]); c.fill(); }
    c.fillStyle = '#163634'; for (const [x, y, s] of trees) { c.beginPath(); c.ellipse(x, y - 4 * s, 7 * s, 5 * s, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = LAMP; for (let u = -1.6; u < 0.05; u += 0.05) { const [x, y] = g.P(u, SHORE + 0.005); c.fillRect(x - 1, y - 1, 2.4, 2.4); }
    // the north side's shore: Lake Shore Drive and its lamps
    c.fillStyle = '#2a2a48'; poly(c, quad(RIV1, 4, SHORE, 0.72)); c.fill();
    c.fillStyle = LAMP; for (let u = RIV1; u < 2; u += 0.05) { const [x, y] = g.P(u, SHORE + 0.005); c.fillRect(x - 1, y - 1, 2.4, 2.4); }
  }, { t: 3.4, d: 1.0, reveal: 'rise' });
  // the lake: deep blue, ruled with long lines like a speed poster, the city's lights in it
  const lines = [];
  for (let y = ys + 6; y < PY1; y += lerp(5, 16, (y - ys) / (PY1 - ys))) { const x0 = r.range(PX0, PX1 - 400), w = r.range(160, 700); lines.push([x0, y, w]); }
  const refl = [];
  for (let i = 0; i < 90; i++) { const x = r.range(PX0, PX1), L = r.range(20, 90); refl.push([x, ys + 4, L, r.range(1, 3)]); }
  p.group('ground', { x: PX0, y: ys - 4, w: PX1 - PX0, h: PY1 - ys + 8 }, (c) => {
    const gr = c.createLinearGradient(0, ys, 0, PY1);
    gr.addColorStop(0, LAKE_L); gr.addColorStop(0.25, LAKE); gr.addColorStop(1, LAKE_D);
    c.fillStyle = gr; c.fillRect(PX0, ys, PX1 - PX0, PY1 - ys);
    c.strokeStyle = 'rgba(160,180,230,.18)'; c.lineWidth = 1.5;
    c.beginPath(); for (const [x, y, w] of lines) { c.moveTo(x, y); c.lineTo(x + w, y); } c.stroke();
    c.fillStyle = 'rgba(255,200,120,.35)'; for (const [x, y, L, w] of refl) c.fillRect(x, y, w, L);
    // the breakwater, a pale line out in the lake
    c.strokeStyle = 'rgba(220,210,230,.5)'; c.lineWidth = 2;
    const a = g.P(-0.2, 0.36), b = g.P(0.9, 0.36); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  }, { t: 2.6, d: 1.2, reveal: 'fall', ease: 'inOut' });
}

// ================================================================ the city
// a tower: a stack of tiers, each a box set back from the one below
function tower(u, v, w, d, z, kind, r) {
  const tiers = [];
  let u0 = u, u1 = u + w, v0 = v, v1 = v + d, z0 = 0;
  const steps = kind === 'deco' ? r.int(2, 4) : kind === 'slab' ? 1 : r.int(1, 2);
  for (let k = 0; k < steps; k++) {
    const z1 = k === steps - 1 ? z : z0 + (z - z0) * r.range(0.45, 0.7);
    tiers.push({ u0, u1, v0, v1, z0, z1 });
    const inset = Math.min((u1 - u0), (v1 - v0)) * r.range(0.12, 0.22);
    u0 += inset; u1 -= inset; v0 += inset; v1 -= inset; z0 = z1;
  }
  return tiers;
}
// faces of a box, in screen coordinates, with their kind
function faces(b) {
  const { u0, u1, v0, v1, z0, z1 } = b;
  const P = (u, v, z) => g.P(u, v, z);
  const out = [];
  if (u1 < 0) out.push(['side', [P(u1, v0, z0), P(u1, v1, z0), P(u1, v1, z1), P(u1, v0, z1)]]);
  else if (u0 > 0) out.push(['side', [P(u0, v0, z0), P(u0, v1, z0), P(u0, v1, z1), P(u0, v0, z1)]]);
  if (z1 < g.eye) out.push(['roof', [P(u0, v0, z1), P(u1, v0, z1), P(u1, v1, z1), P(u0, v1, z1)]]);
  out.push(['front', [P(u0, v0, z0), P(u1, v0, z0), P(u1, v0, z1), P(u0, v0, z1)]]);
  return out;
}
// a building's drawing: airbrushed faces, a rim of afterglow on its top, its windows lit
function drawBldg(c, b) {
  for (const t of b.tiers) {
    for (const [kind, q] of faces(t)) {
      const yt = Math.min(q[2][1], q[3][1]), yb = Math.max(q[0][1], q[1][1]);
      if (kind === 'front') {
        const gr = c.createLinearGradient(0, yt, 0, yb);
        gr.addColorStop(0, b.top); gr.addColorStop(1, b.foot);
        c.fillStyle = gr;
      } else if (kind === 'side') {
        const gr = c.createLinearGradient(0, yt, 0, yb);
        gr.addColorStop(0, mix(b.top, '#000', 0.25)); gr.addColorStop(1, mix(b.foot, '#000', 0.3));
        c.fillStyle = gr;
      } else c.fillStyle = b.roof;
      poly(c, q); c.fill();
    }
    // the rim light along the top edge
    const a = g.P(t.u0, t.v0, t.z1), bb = g.P(t.u1, t.v0, t.z1);
    c.fillStyle = b.rim; c.fillRect(a[0], a[1] - 0.5, bb[0] - a[0], Math.max(1, 2.2 * g.s(t.v0)));
  }
  if (b.win.length) { c.fillStyle = b.lit; c.beginPath(); for (const [x, y, w, h] of b.win) c.rect(x, y, w, h); c.fill(); }
}
function litWindows(b, r) {
  const out = [];
  for (const t of b.tiers) {
    const s = g.s(t.v0), [xa, ya] = g.P(t.u0, t.v0, t.z0), [xb] = g.P(t.u1, t.v0, t.z0);
    const story = 16, rows = Math.floor((t.z1 - t.z0) / story) - 1, wpx = xb - xa;
    const pitch = Math.max(3.4, 9 * s), cols = Math.floor(wpx / pitch);
    if (cols < 1 || rows < 1) continue;
    const ww = Math.max(1, pitch * 0.45), hh = Math.max(1, story * s * 0.42);
    // whole floors are lit or dark, and a few rooms in between
    for (let k = 0; k < rows; k++) {
      const floorLit = r() < b.on, y = ya - (k + 1) * story * s;
      for (let j = 0; j < cols; j++) if (floorLit ? r() < 0.8 : r() < 0.08) out.push([xa + j * pitch + (pitch - ww) / 2, y, ww, hh]);
    }
  }
  return out;
}
function town(p, r) {
  const items = [];
  const spots = [[-0.4, -0.26, 2.12, 2.3], [-0.46, -0.32, 1.66, 1.8], [0.125, 0.235, 0.88, 1.0], [0.25, 0.32, 0.88, 1.0]];
  const free = (u0, u1, v0, v1) => !spots.some(([a, b, c0, d]) => u1 > a && u0 < b && v1 > c0 && v0 < d);
  // block by block, from the far west side to the lake
  const add = (u0, u1, v0, v1, zmin, zmax, kinds) => {
    if (!free(u0, u1, v0, v1)) return;
    const z = r.range(zmin, zmax), kind = r.pick(kinds);
    const top = r.pick(T_TOP), stone = r.chance(0.16);
    const b = {
      v: v0, tiers: tower(u0, v0, u1 - u0, v1 - v0, z, kind, r),
      top: stone ? LIME : top, foot: stone ? '#3c3456' : T_FOOT, roof: stone ? '#c7a6b0' : mix(top, ROSE, 0.35),
      rim: r.chance(0.5) ? AMBER : '#ffb98a', lit: r.chance(0.7) ? 'rgba(255,214,128,.95)' : 'rgba(255,238,190,.9)', on: r.range(0.15, 0.45), win: [],
    };
    // a crown on some: a spire or a lantern
    if (kind === 'deco' && r.chance(0.5)) { const t = b.tiers[b.tiers.length - 1], um = (t.u0 + t.u1) / 2; b.spire = { u: um, v: t.v0, z0: t.z1, z1: t.z1 + r.range(30, 90) }; }
    b.win = litWindows(b, r);
    items.push(b);
  };
  const BS = 0.11;
  for (let v = 0.96; v < 6; v += BS * (v < 2.4 ? 1 : v < 3.5 ? 1.4 : 2)) {
    const s = g.s(v), span = 1.05 / s;
    const bv = BS * (v < 2.4 ? 1 : v < 3.5 ? 1.4 : 2) * 0.78;
    for (let u = -span; u < span; u += BS) {
      const u0 = u + 0.012, u1 = u + BS - 0.012;
      // not in the river, not in the park
      if (v < FORK1 + 0.02 && u1 > RIV0 - 0.01 && u0 < RIV1 + 0.01) continue;
      if (v + bv > FORK - 0.01 && v < FORK1 + 0.02) continue;
      const loop = u > -0.7 && u < RIV0 && v < FORK, north = u > RIV1 && v < FORK;
      if (loop) {
        if (r.chance(0.5)) { const m = lerp(u0, u1, r.range(0.4, 0.6)); add(u0, m - 0.008, v, v + bv, 260, 820, ['deco', 'slab', 'plain']); add(m + 0.008, u1, v, v + bv, 200, 700, ['deco', 'slab', 'plain']); }
        else add(u0, u1, v, v + bv, 280, 900, ['deco', 'slab', 'deco']);
      } else if (north) {
        const k = clamp(1 - (u - 0.2) / 1.2);
        add(u0, u1, v, v + bv, 120 + 200 * k, 280 + 480 * k, ['deco', 'slab', 'plain']);
      } else if (v < FORK) add(u0, u1, v, v + bv, 110, 380, ['plain', 'slab']);
      else { const k = clamp(1 - (v - 2.4) / 3.2); if (r.chance(0.2 + 0.6 * k)) add(u0, u1, v, v + bv, 40 + 140 * k, 120 + 360 * k, ['plain', 'slab']); }
    }
  }
  // the bridges over the river at the streets, leaves raised on some
  const bridges = [];
  for (const [v, up] of [[0.94, false], [1.1, true], [1.26, false], [1.42, true], [1.58, true], [1.74, false], [1.9, true], [2.06, true]]) bridges.push({ v, bridge: true, up });
  // the L: the Loop's elevated tracks, in short pieces so the towers can stand in front of them
  const els = [];
  for (const uu of [-0.6, -0.02]) for (let v = 1.08; v < 2.08; v += 0.1) els.push({ v, el: 'along', u: uu, v1: v + 0.1 });
  for (const vv of [1.12, 2.02]) els.push({ v: vv, el: 'across', u0: -0.6, u1: -0.02 });
  // the landmarks, at their depths
  const marks = [
    { v: 2.12, land: willis }, { v: 1.66, land: boardOfTrade }, { v: 0.88, land: wrigley }, { v: 0.88, land: tribune },
  ];
  const all = [...items, ...bridges, ...els, ...marks].sort((a, b) => b.v - a.v || (a.land ? 1 : 0) - (b.land ? 1 : 0));
  // set down far to near, a band at a time; the landmarks rise on their own
  const groups = [];
  let chunk = [];
  for (const it of all) {
    if (it.land) { if (chunk.length) groups.push(chunk); chunk = []; groups.push(it); continue; }
    chunk.push(it);
    if (chunk.length >= (it.v > FORK1 ? 46 : 18)) { groups.push(chunk); chunk = []; }
  }
  if (chunk.length) groups.push(chunk);
  const top = (it) => (it.tiers ? g.P(0, it.v, it.tiers[it.tiers.length - 1].z1 + 100)[1] : Y(it.v) - 80);
  groups.forEach((gr, k) => {
    const t = lerp(3.6, 8.4, k / (groups.length - 1));
    if (gr.land) { p.group('city', { x: PX0, y: PY0, w: PX1 - PX0, h: Y(gr.v) - PY0 + 40 }, (c) => gr.land(c), { t, d: 1.3, reveal: 'rise', ease: 'out' }); return; }
    const y0 = Math.max(PY0, Math.min(...gr.map(top))), y1 = Y(gr[gr.length - 1].v) + 30;
    p.group('city', { x: PX0, y: y0, w: PX1 - PX0, h: y1 - y0 }, (c) => { for (const it of gr) drawItem(c, it); }, { t, d: 0.9, reveal: 'rise', ease: 'out' });
  });
}
function drawItem(c, it) {
  if (it.bridge) return bridge(c, it);
  if (it.el) return elevated(c, it);
  drawBldg(c, it);
  if (it.spire) {
    const a = g.P(it.spire.u, it.spire.v, it.spire.z0), b = g.P(it.spire.u, it.spire.v, it.spire.z1), s = g.s(it.spire.v);
    c.fillStyle = it.top; c.beginPath(); c.moveTo(a[0] - 7 * s, a[1]); c.lineTo(b[0], b[1]); c.lineTo(a[0] + 7 * s, a[1]); c.fill();
    c.fillStyle = it.rim; c.fillRect(b[0] - 0.6, b[1], 1.2, (a[1] - b[1]) * 0.6);
  }
}
function bridge(c, it) {
  const { v, up } = it, s = g.s(v);
  const [xa, ya] = g.P(RIV0 - 0.01, v), [xb] = g.P(RIV1 + 0.01, v);
  const w = xb - xa;
  c.fillStyle = STEEL;
  if (!up) { c.fillRect(xa, ya - 6 * s, w, 6 * s); c.fillStyle = LAMP; c.fillRect(xa, ya - 6 * s, w, Math.max(0.8, 1.2 * s)); return; }
  // two leaves standing up from their towers, latticed
  const h = w * 0.5;
  for (const [x0, dir] of [[xa, 1], [xb, -1]]) {
    const x1 = x0 + dir * w * 0.12;
    c.fillStyle = STEEL; poly(c, [[x0, ya], [x0 + dir * w * 0.16, ya], [x1 + dir * w * 0.06, ya - h], [x1, ya - h]]); c.fill();
    c.strokeStyle = 'rgba(255,190,130,.6)'; c.lineWidth = Math.max(0.5, 1 * s);
    c.beginPath(); for (let k = 1; k < 6; k++) { const y = ya - (h * k) / 6; c.moveTo(x0 + dir * 1, y); c.lineTo(x0 + dir * w * 0.14, y - h / 12); } c.stroke();
    // the tender's house at the foot
    c.fillStyle = '#3a3458'; c.fillRect(Math.min(x0, x0 - dir * w * 0.12), ya - 12 * s, w * 0.12, 12 * s);
    c.fillStyle = LAMP; c.fillRect(Math.min(x0, x0 - dir * w * 0.12) + w * 0.03, ya - 9 * s, w * 0.03, 3 * s);
  }
}
function elevated(c, it) {
  c.strokeStyle = '#2c2546'; c.lineCap = 'butt';
  if (it.el === 'along') {
    const a = g.P(it.u, it.v, 22), b = g.P(it.u, it.v1, 22), s = g.s(it.v);
    c.lineWidth = Math.max(1.2, 5 * s); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    c.lineWidth = Math.max(0.6, 1.4 * s); c.beginPath(); for (let k = 0; k < 3; k++) { const v = lerp(it.v, it.v1, k / 3), q = g.P(it.u, v, 22), q0 = g.P(it.u, v, 0); c.moveTo(q[0], q[1]); c.lineTo(q0[0], q0[1]); } c.stroke();
  } else {
    const a = g.P(it.u0, it.v, 22), b = g.P(it.u1, it.v, 22), s = g.s(it.v);
    c.lineWidth = Math.max(1.2, 5 * s); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    // the columns and a train standing at a station, its windows lit
    c.lineWidth = Math.max(0.6, 1.4 * s); c.beginPath(); for (let u = it.u0; u <= it.u1; u += 0.04) { const q = g.P(u, it.v, 22), q0 = g.P(u, it.v, 0); c.moveTo(q[0], q[1]); c.lineTo(q0[0], q0[1]); } c.stroke();
    const t0 = g.P(it.u0 + 0.18, it.v, 22), t1 = g.P(it.u0 + 0.34, it.v, 22);
    c.fillStyle = '#7a3a3a'; c.fillRect(t0[0], t0[1] - 9 * s, t1[0] - t0[0], 7 * s);
    c.fillStyle = LAMP; for (let x = t0[0] + 2; x < t1[0] - 2; x += 5 * s + 2) c.fillRect(x, t0[1] - 7.5 * s, 2.4 * s, 2.4 * s);
  }
}

// ================================================================ the landmarks
// the Willis Tower: nine black tubes in a bundle, stopping at four heights, two masts
function willis(c) {
  const u0 = -0.4, v0 = 2.14, a = 0.042, Z = 1.35;
  const hs = [[50, 90, 66], [90, 108, 108], [66, 90, 50]]; // rows from front (east) to back; columns south to north
  // hs[col][row]: col 0 south, 1 middle, 2 north; row 0 east (front) to 2 west
  const tube = (i, j) => { const fl = [[50, 90, 66], [90, 108, 108], [66, 90, 50]][i][j]; return { u0: u0 + i * a, u1: u0 + (i + 1) * a, v0: v0 + j * a, v1: v0 + (j + 1) * a, z0: 0, z1: fl * 7.4 * Z }; };
  const order = [];
  for (let j = 2; j >= 0; j--) for (const i of [0, 2, 1]) order.push(tube(i, j));
  for (const t of order) {
    for (const [kind, q] of faces(t)) {
      const yt = Math.min(q[2][1], q[3][1]), yb = Math.max(q[0][1], q[1][1]);
      const gr = c.createLinearGradient(0, yt, 0, yb);
      if (kind === 'front') { gr.addColorStop(0, '#4a4060'); gr.addColorStop(0.5, '#25213a'); gr.addColorStop(1, '#141226'); }
      else { gr.addColorStop(0, '#332c48'); gr.addColorStop(1, '#0e0c1c'); }
      c.fillStyle = kind === 'roof' ? '#5a4a6a' : gr; poly(c, q); c.fill();
      if (kind === 'front') {
        // the black bands of its mechanical floors, and fine mullions
        const s = g.s(t.v0); c.fillStyle = '#0b0a16';
        for (const fl of [29, 65, 88, 104]) if (fl * 7.4 * Z < t.z1) { const y = g.P(t.u0, t.v0, fl * 7.4 * Z)[1]; c.fillRect(q[0][0], y, q[1][0] - q[0][0], 5 * s); }
        c.strokeStyle = 'rgba(255,200,140,.18)'; c.lineWidth = 0.7;
        c.beginPath(); for (let k = 1; k < 6; k++) { const x = lerp(q[0][0], q[1][0], k / 6); c.moveTo(x, q[3][1]); c.lineTo(x, q[0][1]); } c.stroke();
      }
    }
    const a1 = g.P(t.u0, t.v0, t.z1), b1 = g.P(t.u1, t.v0, t.z1); c.fillStyle = AMBER; c.fillRect(a1[0], a1[1] - 0.5, b1[0] - a1[0], 1.6);
  }
  // the two masts, white, with their red lights
  for (const uu of [u0 + a * 1.3, u0 + a * 1.75]) {
    const b = g.P(uu, v0 + a * 1.5, 108 * 7.4 * Z), tp = g.P(uu, v0 + a * 1.5, 108 * 7.4 * Z + 300);
    c.strokeStyle = '#d8d0dc'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(tp[0], tp[1]); c.stroke();
    c.fillStyle = '#ff5a4a'; c.beginPath(); c.arc(tp[0], tp[1], 2.6, 0, Math.PI * 2); c.fill();
  }
}
// the Board of Trade: a deco slab closing LaSalle Street, its pyramid roof and figure
function boardOfTrade(c) {
  const t1 = { u0: -0.45, u1: -0.33, v0: 1.67, v1: 1.79, z0: 0, z1: 300 };
  const t2 = { u0: -0.425, u1: -0.355, v0: 1.69, v1: 1.77, z0: 300, z1: 620 };
  for (const t of [t1, t2]) for (const [kind, q] of faces(t)) {
    const yt = Math.min(q[2][1], q[3][1]), yb = Math.max(q[0][1], q[1][1]);
    const gr = c.createLinearGradient(0, yt, 0, yb);
    gr.addColorStop(0, kind === 'front' ? '#cdbfd0' : '#9a8aa6'); gr.addColorStop(1, '#3c3256');
    c.fillStyle = kind === 'roof' ? '#b99aa8' : gr; poly(c, q); c.fill();
    if (kind === 'front') {
      // the deep vertical piers of its front
      c.fillStyle = 'rgba(40,30,70,.55)'; for (let k = 1; k < 8; k++) { const x = lerp(q[0][0], q[1][0], k / 8); c.fillRect(x - 0.8, q[3][1] + 4, 1.6, q[0][1] - q[3][1] - 4); }
    }
  }
  // the pyramid and the figure on it
  const a = g.P(t2.u0, t2.v0, 620), b = g.P(t2.u1, t2.v0, 620), tp = g.P((t2.u0 + t2.u1) / 2, (t2.v0 + t2.v1) / 2, 720);
  c.fillStyle = '#7e8a8a'; poly(c, [a, b, tp]); c.fill();
  c.fillStyle = '#a6b4ae'; poly(c, [a, [lerp(a[0], b[0], 0.5), a[1]], tp]); c.fill();
  c.fillStyle = '#d8c48a'; c.fillRect(tp[0] - 1.5, tp[1] - 14, 3, 14); c.beginPath(); c.arc(tp[0], tp[1] - 16, 2.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = AMBER; c.fillRect(a[0], a[1] - 0.5, b[0] - a[0], 1.6);
}
// the Wrigley Building: white terracotta, floodlit, its clock tower over the river
function wrigley(c) {
  const v0 = 0.89, s = g.s(v0);
  const main = { u0: 0.13, u1: 0.2, v0, v1: 0.99, z0: 0, z1: 330 };
  const tower = { u0: 0.14, u1: 0.17, v0: v0 - 0.002, v1: 0.92, z0: 330, z1: 520 };
  const flood = (q) => { const yt = Math.min(q[2][1], q[3][1]), yb = Math.max(q[0][1], q[1][1]); const gr = c.createLinearGradient(0, yt, 0, yb); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(0.6, TERRA); gr.addColorStop(1, '#d9b8a8'); return gr; };
  // the glow of the floodlights round it
  const [cx, cy] = g.P(0.165, v0, 260);
  const gl = c.createRadialGradient(cx, cy, 10, cx, cy, 240);
  gl.addColorStop(0, 'rgba(255,240,200,.45)'); gl.addColorStop(1, 'rgba(255,240,200,0)');
  c.fillStyle = gl; c.fillRect(cx - 240, cy - 240, 480, 480);
  for (const t of [main, tower]) for (const [kind, q] of faces(t)) { c.fillStyle = kind === 'front' ? flood(q) : kind === 'side' ? '#d6c0b4' : '#f0dccc'; poly(c, q); c.fill(); }
  // the windows in rows, dark against the white; the clock and the lantern
  const [xa, ya] = g.P(main.u0, v0, 0), [xb] = g.P(main.u1, v0, 0);
  c.fillStyle = 'rgba(120,90,110,.55)';
  for (let z = 30; z < 320; z += 16) for (let k = 0; k < 16; k++) c.fillRect(lerp(xa, xb, (k + 0.3) / 16), ya - z * s, (xb - xa) / 16 * 0.45, 7 * s);
  const [tx0, ty] = g.P(tower.u0, tower.v0, 330), [tx1] = g.P(tower.u1, tower.v0, 330), tm = (tx0 + tx1) / 2, tw = tx1 - tx0;
  c.fillStyle = '#2a2240'; c.beginPath(); c.arc(tm, ty - 120 * s, tw * 0.28, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff7e0'; c.beginPath(); c.arc(tm, ty - 120 * s, tw * 0.22, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#2a2240'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(tm, ty - 120 * s); c.lineTo(tm, ty - 120 * s - tw * 0.16); c.moveTo(tm, ty - 120 * s); c.lineTo(tm + tw * 0.12, ty - 120 * s); c.stroke();
  const top = ty - 190 * s;
  c.fillStyle = '#fbf0dc'; c.fillRect(tm - tw * 0.36, top - 26 * s, tw * 0.72, 26 * s);
  c.fillStyle = '#e8d6c4'; c.fillRect(tm - tw * 0.26, top - 52 * s, tw * 0.52, 26 * s);
  c.fillStyle = '#fbf0dc'; c.beginPath(); c.moveTo(tm - tw * 0.2, top - 52 * s); c.quadraticCurveTo(tm, top - 90 * s, tm + tw * 0.2, top - 52 * s); c.fill();
  c.strokeStyle = '#fbf0dc'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(tm, top - 80 * s); c.lineTo(tm, top - 110 * s); c.stroke();
  c.fillStyle = AMBER; c.fillRect(tm - tw * 0.36, top - 27 * s, tw * 0.72, 1.4);
}
// the Tribune Tower: a gothic crown of buttresses on a tall shaft
function tribune(c) {
  const v0 = 0.9, s = g.s(v0);
  const shaft = { u0: 0.26, u1: 0.31, v0, v1: 0.96, z0: 0, z1: 420 };
  for (const [kind, q] of faces(shaft)) {
    const yt = Math.min(q[2][1], q[3][1]), yb = Math.max(q[0][1], q[1][1]);
    const gr = c.createLinearGradient(0, yt, 0, yb); gr.addColorStop(0, kind === 'front' ? '#c9b6c4' : '#8f7f9e'); gr.addColorStop(1, '#2e2848');
    c.fillStyle = kind === 'roof' ? '#a68a9a' : gr; poly(c, q); c.fill();
  }
  const [xa, ya] = g.P(shaft.u0, v0, 0), [xb] = g.P(shaft.u1, v0, 0), w = xb - xa, top = ya - 420 * s;
  c.fillStyle = 'rgba(40,30,70,.5)'; for (let k = 1; k < 6; k++) c.fillRect(lerp(xa, xb, k / 6) - 0.6, top + 10, 1.2, ya - top - 10);
  c.fillStyle = 'rgba(255,214,128,.9)'; for (let z = 40; z < 400; z += 22) for (let k = 0; k < 5; k++) if ((z * 7 + k * 13) % 5 < 2) c.fillRect(xa + (k + 0.3) * w / 5, ya - z * s, w / 5 * 0.4, 6 * s);
  // the crown: an octagonal lantern ringed by flying buttresses and pinnacles
  c.fillStyle = '#d8c6d0';
  c.fillRect(xa + w * 0.22, top - 60 * s, w * 0.56, 60 * s);
  c.fillStyle = '#2a2240'; for (let k = 0; k < 3; k++) c.fillRect(xa + w * (0.3 + k * 0.16), top - 50 * s, w * 0.07, 34 * s);
  c.strokeStyle = '#d8c6d0'; c.lineWidth = Math.max(1.2, 3 * s);
  c.beginPath();
  for (const d of [-1, 1]) { const x0 = d < 0 ? xa : xb, x1 = xa + w * (d < 0 ? 0.22 : 0.78); c.moveTo(x0, top); c.quadraticCurveTo(x0, top - 40 * s, x1, top - 54 * s); }
  c.stroke();
  c.fillStyle = '#e8d8e0';
  for (const x of [xa, xa + w * 0.22, xa + w * 0.5, xa + w * 0.78, xb]) { c.beginPath(); c.moveTo(x - 3 * s, top - (x === xa || x === xb ? 0 : 60 * s)); c.lineTo(x, top - (x === xa || x === xb ? 34 : 96) * s); c.lineTo(x + 3 * s, top - (x === xa || x === xb ? 0 : 60 * s)); c.fill(); }
  c.fillStyle = AMBER; c.fillRect(xa, top - 0.5, w, 1.4);
}

// ================================================================ in front: Navy Pier, the fountain, the boats
function near(p, r) {
  // Navy Pier: the long sheds out into the lake, the hall at the end, a wheel
  const pu0 = 0.66, pu1 = 0.74, pv0 = 0.2;
  p.group('near', { x: g.P(pu0, SHORE)[0] - 200, y: Y(SHORE) - 120, w: 600, h: Y(pv0) - Y(SHORE) + 140 }, (c) => {
    // the shadow on the water, then the deck, then the sheds
    c.fillStyle = 'rgba(10,14,40,.5)'; poly(c, quad(pu0 + 0.01, pu1 + 0.03, pv0 - 0.01, SHORE)); c.fill();
    c.fillStyle = '#4a4268'; poly(c, quad(pu0, pu1, pv0, SHORE)); c.fill();
    const shed = { u0: pu0 + 0.008, u1: pu1 - 0.008, v0: pv0 + 0.06, v1: SHORE, z0: 0, z1: 26 };
    for (const [kind, q] of faces(shed)) { c.fillStyle = kind === 'roof' ? '#8a6a8a' : kind === 'side' ? '#3a3256' : '#6a5a86'; poly(c, q); c.fill(); }
    // the lamps along the pier
    c.fillStyle = LAMP; for (let v = pv0 + 0.02; v < SHORE; v *= 1.06) { const a = g.P(pu0 + 0.004, v, 4), b = g.P(pu1 - 0.004, v, 4); c.fillRect(a[0] - 1, a[1] - 1, 2.4, 2.4); c.fillRect(b[0] - 1, b[1] - 1, 2.4, 2.4); }
    // the hall at the end, with its domed towers
    const hall = { u0: pu0 - 0.01, u1: pu1 + 0.01, v0: pv0, v1: pv0 + 0.06, z0: 0, z1: 44 };
    for (const [kind, q] of faces(hall)) { const gr = c.createLinearGradient(0, q[3][1], 0, q[0][1]); gr.addColorStop(0, '#e8d6c8'); gr.addColorStop(1, '#8a6a7a'); c.fillStyle = kind === 'roof' ? '#b88aa0' : kind === 'side' ? '#7a5a7a' : gr; poly(c, q); c.fill(); }
    const s = g.s(pv0);
    for (const uu of [hall.u0 + 0.01, hall.u1 - 0.01]) { const [x, y] = g.P(uu, pv0, 44); c.fillStyle = '#e8d6c8'; c.fillRect(x - 6 * s, y - 24 * s, 12 * s, 24 * s); c.fillStyle = '#5a7a7a'; c.beginPath(); c.arc(x, y - 24 * s, 6 * s, Math.PI, 0); c.fill(); }
    c.fillStyle = LAMP; const [hx0, hy] = g.P(hall.u0, pv0, 0), [hx1] = g.P(hall.u1, pv0, 0); for (let x = hx0 + 6; x < hx1 - 4; x += 9) c.fillRect(x, hy - 26 * s, 3, 8 * s);
    // the wheel
    const [wx, wy] = g.P(pu0 + 0.02, 0.4, 0), wr = 60 * g.s(0.4);
    c.strokeStyle = '#e8d6c8'; c.lineWidth = 1.4; c.beginPath(); c.arc(wx, wy - wr - 6, wr, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 0.7; c.beginPath(); for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; c.moveTo(wx, wy - wr - 6); c.lineTo(wx + Math.cos(a) * wr, wy - wr - 6 + Math.sin(a) * wr); } c.stroke();
    c.fillStyle = LAMP; for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; c.fillRect(wx + Math.cos(a) * wr - 1.2, wy - wr - 6 + Math.sin(a) * wr - 1.2, 2.4, 2.4); }
    c.strokeStyle = '#e8d6c8'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(wx - 12, wy); c.lineTo(wx, wy - wr - 6); c.lineTo(wx + 12, wy); c.stroke();
  }, { t: 8.3, d: 1.0, reveal: 'wipeL', ease: 'inOut' });
  // Buckingham Fountain: three round basins in pink stone, a ring of jets
  const [fx, fy] = g.P(-0.42, 0.79), fs = g.s(0.79);
  p.group('near', { x: fx - 120, y: fy - 120, w: 240, h: 150 }, (c) => {
    const gl = c.createRadialGradient(fx, fy - 20, 4, fx, fy - 20, 110);
    gl.addColorStop(0, 'rgba(255,220,200,.5)'); gl.addColorStop(1, 'rgba(255,220,200,0)');
    c.fillStyle = gl; c.fillRect(fx - 120, fy - 130, 240, 160);
    c.fillStyle = '#7ab0c8'; c.beginPath(); c.ellipse(fx, fy, 150 * fs, 34 * fs, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#e8c4b8'; c.lineWidth = 2; c.stroke();
    for (const [rr, h, col] of [[70, 14, '#e2b0a4'], [44, 30, '#eec4b6'], [24, 44, '#f6d8cc']]) {
      c.fillStyle = col; c.beginPath(); c.ellipse(fx, fy - h * fs, rr * fs, rr * 0.24 * fs, 0, 0, Math.PI * 2); c.fill();
      c.fillRect(fx - rr * fs * 0.3, fy - h * fs, rr * fs * 0.6, 12 * fs);
    }
  }, { t: 8.6, d: 0.7, reveal: 'pop' });
  // the fair on Northerly Island: bright pavilions, and the Sky Ride's two towers
  const pav = [];
  for (let i = 0; i < 30; i++) { const u = r.range(-0.74, -0.08), v = r.range(0.28, 0.45); pav.push({ u0: u, u1: u + r.range(0.03, 0.07), v0: v, v1: v + 0.03, z0: 0, z1: r.range(14, 46), col: r.pick(['#f08a3c', '#3c8ad8', '#f5c84a', '#e85a5a', '#f2efe6', '#3cb08a']) }); }
  pav.sort((a, b) => b.v0 - a.v0);
  const isle = [g.P(-1.6, 0.48), g.P(-0.02, 0.48), g.P(-0.02, 0.27), g.P(-1.6, 0.27)];
  p.group('near', { x: PX0, y: Y(0.48) - 60, w: g.P(-0.02, 0.27)[0] - PX0 + 10, h: Y(0.27) - Y(0.48) + 66 }, (c) => {
    c.fillStyle = '#2f2a4e'; poly(c, isle); c.fill();
    c.fillStyle = '#3c6a5a'; poly(c, [g.P(-1.6, 0.47), g.P(-0.04, 0.47), g.P(-0.04, 0.455), g.P(-1.6, 0.455)]); c.fill();
    for (const b of pav) {
      for (const [kind, q] of faces(b)) { c.fillStyle = kind === 'front' ? b.col : kind === 'roof' ? mix(b.col, '#fff', 0.3) : mix(b.col, '#000', 0.3); poly(c, q); c.fill(); }
      const [x, y] = g.P(b.u0, b.v0, 0), [x1] = g.P(b.u1, b.v0, 0); c.fillStyle = LAMP; c.fillRect(x + 2, y - 5, x1 - x - 4, 2);
    }
    c.fillStyle = LAMP; for (let u = -1.6; u < -0.02; u += 0.04) { const [x, y] = g.P(u, 0.27); c.fillRect(x - 1, y - 1, 2.4, 2.4); }
  }, { t: 8.0, d: 0.8, reveal: 'rise' });
  for (const [k, u] of [[0, SKY0], [1, SKY1]]) {
    p.group('near', { x: g.P(u, 0.38)[0] - 40, y: g.P(u, 0.38, SKYH)[1] - 40, w: 80, h: g.P(u, 0.38)[1] - g.P(u, 0.38, SKYH)[1] + 50 }, (c) => skyTower(c, u), { t: 8.3 + k * 0.25, d: 1.0, reveal: 'rise', ease: 'out' });
  }
  p.group('near', { x: g.P(SKY0, 0.38)[0] - 10, y: g.P(SKY0, 0.38, SKYH)[1] - 20, w: g.P(SKY1, 0.38)[0] - g.P(SKY0, 0.38)[0] + 20, h: 260 }, (c) => {
    const a = g.P(SKY0, 0.38, 410), b = g.P(SKY1, 0.38, 410);
    c.strokeStyle = 'rgba(240,230,240,.7)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.moveTo(a[0], a[1] + 6); c.lineTo(b[0], b[1] + 6); c.stroke();
  }, { t: 8.9, d: 0.7, reveal: 'wipe', ease: 'inOut' });
  // boats on the lake, moored: sloops by the harbor, their riding lights
  const moored = []; for (let i = 0; i < 16; i++) moored.push([r.range(-1.0, 0.5), r.range(0.5, 0.59)]);
  p.group('near', { x: PX0, y: Y(0.58) - 50, w: PX1 - PX0, h: Y(0.4) - Y(0.58) + 60 }, (c) => {
    for (const [u, v] of moored) {
      const [x, y] = g.P(u, v), s = g.s(v);
      c.fillStyle = '#e8dcd0'; c.beginPath(); c.moveTo(x - 10 * s, y); c.lineTo(x + 10 * s, y); c.lineTo(x + 7 * s, y + 3 * s); c.lineTo(x - 7 * s, y + 3 * s); c.fill();
      c.strokeStyle = '#e8dcd0'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 30 * s); c.stroke();
      c.fillStyle = LAMP; c.fillRect(x - 1, y - 31 * s, 2, 2);
      c.fillStyle = 'rgba(255,200,120,.3)'; c.fillRect(x - 0.5, y + 4 * s, 1.2, 10 * s);
    }
  }, { t: 8.9, d: 0.8, reveal: 'fade' });
}

// a Sky Ride tower: a tall latticed steel shaft, the deck for the cars, a lit crown
const SKY0 = -0.6, SKY1 = -0.16, SKYH = 560;
function skyTower(c, u) {
  const v = 0.38, s = g.s(v), [x, y] = g.P(u, v), H2 = SKYH * s, w = 30 * s;
  c.fillStyle = '#d8d0e0'; poly(c, [[x - w, y], [x - w * 0.45, y - H2], [x + w * 0.45, y - H2], [x + w, y]]); c.fill();
  c.fillStyle = '#9a8eb4'; poly(c, [[x, y], [x, y - H2], [x + w * 0.45, y - H2], [x + w, y]]); c.fill();
  c.strokeStyle = 'rgba(40,30,70,.6)'; c.lineWidth = 0.8; c.beginPath();
  for (let k = 0; k < 16; k++) { const y0 = y - (H2 * k) / 16, y1 = y - (H2 * (k + 1)) / 16, w0 = lerp(w, w * 0.45, k / 16), w1 = lerp(w, w * 0.45, (k + 1) / 16); c.moveTo(x - w0, y0); c.lineTo(x + w1, y1); c.moveTo(x + w0, y0); c.lineTo(x - w1, y1); }
  c.stroke();
  // the observation deck where the cables meet, and the crown with its beacon
  const dy = y - 410 * s;
  c.fillStyle = '#3a3258'; c.fillRect(x - w * 1.1, dy - 8 * s, w * 2.2, 14 * s);
  c.fillStyle = LAMP; for (let k = 0; k < 6; k++) c.fillRect(x - w + k * w * 0.36, dy - 4 * s, w * 0.18, 4 * s);
  c.fillStyle = '#f08a3c'; c.fillRect(x - w * 0.6, y - H2 - 22 * s, w * 1.2, 22 * s);
  c.fillStyle = '#ff5a4a'; c.beginPath(); c.arc(x, y - H2 - 26 * s, 3, 0, Math.PI * 2); c.fill();
}

// ================================================================ life
function life(p, r) {
  // searchlights from the lakefront, fanning and swaying
  const roots = [g.P(SKY0, 0.38, SKYH + 34), g.P(SKY1, 0.38, SKYH + 34), g.P(0.55, 0.5)];
  p.live('beams', {
    t: 9.0, d: 1.6, reveal: 'fade',
    draw: (c, time) => {
      c.globalCompositeOperation = 'lighter';
      roots.forEach(([x, y], i) => {
        for (let k = 0; k < 2; k++) {
          const a = -Math.PI / 2 + (i === 2 ? 0.35 : -0.25) + (k - 0.5) * 0.5 + Math.sin(time * 0.35 + i * 2 + k * 1.7) * 0.22;
          const L = 1500, w = 0.035;
          c.fillStyle = 'rgba(255,236,200,.13)';
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a - w) * L, y + Math.sin(a - w) * L); c.lineTo(x + Math.cos(a + w) * L, y + Math.sin(a + w) * L); c.closePath(); c.fill();
          c.fillStyle = 'rgba(255,240,210,.12)';
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a - w * 0.35) * L, y + Math.sin(a - w * 0.35) * L); c.lineTo(x + Math.cos(a + w * 0.35) * L, y + Math.sin(a + w * 0.35) * L); c.closePath(); c.fill();
        }
      });
      c.globalCompositeOperation = 'source-over';
    },
  });
  // a rocket car running to and fro on the Sky Ride's cable
  p.live('life', {
    t: 9.4, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      const a = g.P(SKY0, 0.38, 410), b = g.P(SKY1, 0.38, 410);
      const ph = ((time - 9.4) * 0.09) % 2, f = ph < 1 ? ph : 2 - ph, k = f * f * (3 - 2 * f) * 0.84 + 0.08;
      const x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k) + 3;
      c.strokeStyle = '#d8d0e0'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 8); c.stroke();
      c.fillStyle = '#e85a5a'; c.beginPath(); c.ellipse(x, y + 12, 13, 4.5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = LAMP; for (let j = -2; j <= 2; j++) c.fillRect(x + j * 4 - 1, y + 11, 2, 2);
    },
  });
  // the airship, crossing slowly
  p.live('life', {
    t: 9.6, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      const x = 1700 - ((time - 9.6) * 9 + 380) % 2100, y = 300 + Math.sin(time * 0.3) * 4;
      c.fillStyle = '#b8b0c8'; c.beginPath(); c.ellipse(x, y, 120, 22, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e8dcec'; c.beginPath(); c.ellipse(x - 10, y - 8, 100, 9, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6a5a86'; c.beginPath(); c.ellipse(x, y + 10, 120, 10, 0, 0, Math.PI); c.fill();
      c.strokeStyle = 'rgba(80,70,110,.5)'; c.lineWidth = 1; c.beginPath(); for (let k = -3; k <= 3; k++) { c.moveTo(x + k * 30, y - 21 + Math.abs(k) * 0.5); c.lineTo(x + k * 30, y + 21 - Math.abs(k) * 0.5); } c.stroke();
      // the fins and the gondola, its windows lit
      c.fillStyle = '#9a90b0'; c.beginPath(); c.moveTo(x + 100, y); c.lineTo(x + 132, y - 22); c.lineTo(x + 128, y); c.lineTo(x + 132, y + 22); c.closePath(); c.fill();
      c.fillStyle = '#4a4068'; c.fillRect(x - 70, y + 20, 30, 7);
      c.fillStyle = LAMP; for (let k = 0; k < 4; k++) c.fillRect(x - 67 + k * 7, y + 22, 3, 3);
      c.fillStyle = '#ff6a5a'; c.fillRect(x + 126, y - 1, 3, 3);
    },
  });
  // the fountain's jets, rising and falling
  const [fx, fy] = g.P(-0.42, 0.79), fs = g.s(0.79);
  p.live('life', {
    t: 9.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const h = (60 + Math.sin(time * 1.3) * 14) * fs;
      c.strokeStyle = 'rgba(240,248,255,.85)'; c.lineWidth = 2.2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(fx, fy - 44 * fs); c.lineTo(fx, fy - 44 * fs - h); c.stroke();
      c.lineWidth = 1.2; c.beginPath();
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, x0 = fx + Math.cos(a) * 110 * fs, y0 = fy + Math.sin(a) * 26 * fs; c.moveTo(x0, y0); c.quadraticCurveTo(lerp(x0, fx, 0.4), y0 - h * 0.6, lerp(x0, fx, 0.6), fy - 14 * fs); }
      c.stroke();
    },
  });
  // an excursion steamer gliding north up the shore, all its decks lit
  p.live('life', {
    t: 9.3, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const u = -1.1 + ((time - 9.3) * 0.02) % 2.0, v = 0.16, [x, y] = g.P(u, v), s = g.s(v);
      c.fillStyle = 'rgba(255,200,120,.35)'; c.fillRect(x - 40 * s, y + 4, 80 * s, 2); c.fillRect(x - 30 * s, y + 9, 60 * s, 1.5);
      c.fillStyle = '#e8dcd0'; c.beginPath(); c.moveTo(x - 50 * s, y - 8 * s); c.lineTo(x + 56 * s, y - 8 * s); c.lineTo(x + 46 * s, y); c.lineTo(x - 46 * s, y); c.fill();
      c.fillStyle = '#cfc0c8'; c.fillRect(x - 40 * s, y - 16 * s, 76 * s, 8 * s); c.fillRect(x - 28 * s, y - 23 * s, 52 * s, 7 * s);
      c.fillStyle = '#3a3256'; c.fillRect(x - 2 * s, y - 36 * s, 7 * s, 13 * s);
      c.fillStyle = LAMP; for (let k = 0; k < 12; k++) c.fillRect(x - 38 * s + k * 6.2 * s, y - 13 * s, 3 * s, 2.4 * s); for (let k = 0; k < 8; k++) c.fillRect(x - 26 * s + k * 6.2 * s, y - 20 * s, 3 * s, 2.2 * s);
    },
  });
}

// ================================================================ the title
function title(p) {
  const top = PY1 + 40;
  // the band: chevrons and rules in amber either side
  p.group('title', { x: 0, y: top - 10, w: W, h: H - top }, (c) => {
    c.fillStyle = AMBER; c.fillRect(PX0, top + 6, PX1 - PX0, 4); c.fillRect(PX0, H - 70, PX1 - PX0, 3);
    c.fillStyle = ROSE; c.fillRect(PX0, top + 14, PX1 - PX0, 2);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 5; k++) {
        const x = s < 0 ? PX0 + 40 + k * 34 : PX1 - 40 - k * 34, y = top + 130;
        c.fillStyle = k % 2 ? ROSE : AMBER;
        c.beginPath(); c.moveTo(x, y - 60); c.lineTo(x + s * 22, y); c.lineTo(x, y + 60); c.lineTo(x - s * 12, y + 60); c.lineTo(x + s * 10, y); c.lineTo(x - s * 12, y - 60); c.fill();
      }
    }
  }, { t: 10.4, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  p.type('title', 'CHICAGO', W / 2, top + 238, {
    family: '"League Gothic", sans-serif', size: 300, color: CREAM, shadow: '#c4462e', sx: 8, sy: 8,
    align: 'center', track: 0.12, t: 10.8, gap: 0.16, d: 0.8, reveal: 'rise', fit: 1000,
  });
  p.type('title', '1833 · A CENTURY OF PROGRESS · 1933', W / 2, H - 82, {
    family: '"League Gothic", sans-serif', size: 44, color: AMBER, align: 'center', track: 0.34, t: 12.2, gap: 0.025, d: 0.5, reveal: 'fade',
  });
}
