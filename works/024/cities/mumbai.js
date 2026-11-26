// Mumbai: a hand-painted 1970s film hoarding. The Gateway of India huge against
// a blazing sunset, the sun set inside its great arch, the Taj Mahal Palace's
// red domes beside it, boats on the harbor beyond, pigeons on the plaza and
// black-and-yellow taxis along the road. The title is painted the way film
// titles were: slanted, fat, extruded, in Devanagari over the sky, with MUMBAI
// under it. The whole board is framed in a row of bulbs that chase.

import { Plate, W, H } from '../print.js';
import { mix, shade, poly, rng } from '../kit.js';

// the painter's tins
const SKY0 = '#2a1748', SKY1 = '#6a1f63', SKY2 = '#c2335c', SKY3 = '#f0663a', SKY4 = '#ffb347', SKY5 = '#ffe08a';
const SUN = '#fff1b0', SUN_D = '#ffc94a';
const STONE = '#d79a55', STONE_L = '#ffd58a', STONE_D = '#9c5a3c', STONE_S = '#5e2f4e', STONE_M = '#b9784a';
const TAJ = '#e8c9a0', TAJ_D = '#a77b6a', TAJ_S = '#6e4560', DOME = '#c6402c', DOME_L = '#ef7a45', DOME_D = '#842a28';
const SEA = '#3b2e72', SEA_L = '#e2637a', INK = '#1d1024', CITY = '#6a3a74', CITY_F = '#8a4a7c';
const ROAD = '#3a2a3e', PLAZA = '#a8705e', PLAZA_L = '#c98d6c';
const TAXI_B = '#151217', TAXI_Y = '#f4c21b', CHROME = '#dfe4ea', FRAME = '#5b0f1c', FRAME_L = '#f2c14e';

export const city = {
  id: 'mumbai', name: 'Mumbai', wall: '#2b1230',
  alt: 'A hand-painted film hoarding: the Gateway of India against a blazing sunset with the sun inside its great arch, the red domes of the Taj Mahal Palace hotel beside it, boats and a sailing dhow on the harbor, pigeons on the plaza, black-and-yellow taxis and a red double-decker bus on the road, under the title मुंबई with MUMBAI in a frame of chasing bulbs',
  google: 'family=Yatra+One',
  fonts: [['400 300px "Yatra One"', 'मुंबई'], ['400 60px "Yatra One"', 'सपनों का शहर'], ['400 120px "Yatra One"', 'MUMBAI']],
  build,
};

const FACE = '"Yatra One", serif';
const FR = 46; // the frame's width
const HZ = 1196; // the sea's horizon
const GB = 1390; // the foot of the Gateway
const GX = 650; // its middle
const GS = 1.22; // and how much larger than its plan it is drawn
const ROADY = 1660; // where the road begins

function build() {
  const p = new Plate({ paper: '#f3e2c0', seed: 1924 });
  const r = p.r;
  p.stack('sky', 'sun', 'clouds', 'far', 'sea', 'taj', 'gate', 'plaza', 'road', 'cars', 'birds', 'title', 'seams', 'frame');
  frame(p, r);
  sky(p, r);
  sun(p, r);
  clouds(p, r);
  far(p, r);
  sea(p, r);
  taj(p, r);
  gateway(p, r);
  plaza(p, r);
  road(p, r);
  life(p, r);
  title(p, r);
  seams(p, r);
  return p;
}

// brushwork: many short strokes of paint, fixed at build time
function brush(r, x0, x1, y0, y1, colorAt, o = {}) {
  const out = [];
  const n = Math.round(((x1 - x0) * (y1 - y0)) / (o.area || 900));
  for (let i = 0; i < n; i++) {
    const x = r.range(x0, x1), y = r.range(y0, y1), L = r.range(o.l0 || 30, o.l1 || 120), w = r.range(o.w0 || 4, o.w1 || 11);
    const a = (o.angle || 0) + r.range(-0.08, 0.08);
    out.push([x, y, L, w, a, colorAt(x, y, r())]);
  }
  return out;
}
function paintStrokes(c, list, alpha = 0.55) {
  c.lineCap = 'round';
  c.globalAlpha *= alpha;
  for (const [x, y, L, w, a, col] of list) {
    c.strokeStyle = col; c.lineWidth = w;
    c.beginPath(); c.moveTo(x - Math.cos(a) * L / 2, y - Math.sin(a) * L / 2); c.quadraticCurveTo(x, y - w * 0.4, x + Math.cos(a) * L / 2, y + Math.sin(a) * L / 2); c.stroke();
  }
}

// ================================================================ the board
function frame(p, r) {
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = FRAME; c.beginPath(); c.rect(0, 0, W, H); c.rect(FR, FR, W - 2 * FR, H - 2 * FR); c.fill('evenodd');
    c.strokeStyle = FRAME_L; c.lineWidth = 3; c.strokeRect(FR - 6, FR - 6, W - 2 * FR + 12, H - 2 * FR + 12);
    c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(FR, FR, W - 2 * FR, H - 2 * FR);
    c.strokeStyle = 'rgba(255,220,160,.25)'; c.lineWidth = 1.5; c.strokeRect(8, 8, W - 16, H - 16);
  }, { t: 0, d: 0.6, reveal: 'fade' });
  // the bulbs, unlit, in their sockets
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = '#2a0810'; c.beginPath(); for (const [x, y] of BULBS) { c.moveTo(x + 11, y); c.arc(x, y, 11, 0, Math.PI * 2); } c.fill();
    c.fillStyle = '#c9a77a'; c.beginPath(); for (const [x, y] of BULBS) { c.moveTo(x + 7, y); c.arc(x, y, 7, 0, Math.PI * 2); } c.fill();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); for (const [x, y] of BULBS) { c.moveTo(x - 1, y - 3); c.arc(x - 2.5, y - 3, 1.8, 0, Math.PI * 2); } c.fill();
  }, { t: 0.4, d: 0.8, reveal: 'iris' });
}
const BULBS = (() => {
  const out = [], m = FR / 2 - 1, step = 44;
  for (let x = m; x < W - m; x += step) out.push([x, m]);
  for (let y = m; y < H - m; y += step) out.push([W - m, y]);
  for (let x = W - m; x > m; x -= step) out.push([x, H - m]);
  for (let y = H - m; y > m; y -= step) out.push([m, y]);
  return out;
})();

function seams(p, r) {
  // the hoarding is painted on sheets of tin: their joints and rivets show through
  p.group('seams', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = 'rgba(20,10,20,.22)'; c.lineWidth = 2; c.beginPath();
    for (const x of [430, 800, 1170]) { c.moveTo(x, FR); c.lineTo(x, H - FR); }
    c.moveTo(FR, 1000); c.lineTo(W - FR, 1000);
    c.stroke();
    c.strokeStyle = 'rgba(255,240,210,.14)'; c.lineWidth = 1; c.beginPath();
    for (const x of [432, 802, 1172]) { c.moveTo(x, FR); c.lineTo(x, H - FR); }
    c.stroke();
    c.fillStyle = 'rgba(20,10,20,.3)'; c.beginPath();
    for (const x of [430, 800, 1170]) for (let y = 120; y < H - 60; y += 160) { c.moveTo(x + 9, y); c.arc(x + 6, y, 3, 0, Math.PI * 2); c.moveTo(x - 3, y); c.arc(x - 6, y, 3, 0, Math.PI * 2); }
    c.fill();
  }, { t: 13.0, d: 0.8, reveal: 'fade' });
}

// ================================================================ the sky
const skyAt = (y) => {
  const stops = [[FR, SKY0], [330, SKY1], [640, SKY2], [900, SKY3], [1080, SKY4], [HZ, SKY5]];
  for (let i = 1; i < stops.length; i++) if (y <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (y - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  return SKY5;
};
function sky(p, r) {
  const bands = [[FR, 420], [420, 760], [760, 1020], [1020, HZ + 6]];
  bands.forEach(([y0, y1], i) => {
    const st = brush(r, FR, W - FR, y0, y1, (x, y, q) => mix(skyAt(y + (q - 0.5) * 90), q > 0.85 ? '#ffffff' : skyAt(y), q > 0.85 ? 0.12 : 0), { area: 700, l0: 60, l1: 220, w0: 6, w1: 16 });
    p.group('sky', { x: FR, y: y0 - 10, w: W - 2 * FR, h: y1 - y0 + 20 }, (c) => {
      const g = c.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, skyAt(y0)); g.addColorStop(1, skyAt(y1));
      c.fillStyle = g; c.fillRect(FR, y0, W - 2 * FR, y1 - y0 + 1);
      c.save(); c.beginPath(); c.rect(FR, y0, W - 2 * FR, y1 - y0); c.clip();
      paintStrokes(c, st, 0.5);
      c.restore();
    }, { t: 0.5 + i * 0.35, d: 0.9, reveal: 'fall', ease: 'inOut' });
  });
}
function sun(p, r) {
  // rays fanning from the sun, painted in two oranges
  const rays = [];
  for (let k = 0; k < 28; k++) { const a = Math.PI + (k / 28) * Math.PI; rays.push([a, a + Math.PI / 56]); }
  p.group('sun', { x: FR, y: FR, w: W - 2 * FR, h: HZ - FR }, (c) => {
    c.save(); c.beginPath(); c.rect(FR, FR, W - 2 * FR, HZ - FR); c.clip();
    c.fillStyle = 'rgba(255,214,120,.09)'; c.beginPath();
    for (const [a0, a1] of rays) { c.moveTo(GX, HZ - 40); c.arc(GX, HZ - 40, 1800, a0, a1); c.closePath(); }
    c.fill();
    c.restore();
  }, { t: 1.6, d: 1.2, reveal: 'iris', ease: 'inOut' });
  p.group('sun', { x: GX - 260, y: HZ - 300, w: 520, h: 300 }, (c) => {
    c.save(); c.beginPath(); c.rect(GX - 260, HZ - 300, 520, 300); c.clip();
    c.fillStyle = 'rgba(255,230,150,.35)'; c.beginPath(); c.arc(GX, HZ - 40, 210, 0, Math.PI * 2); c.fill();
    const g = c.createRadialGradient(GX, HZ - 80, 10, GX, HZ - 40, 160);
    g.addColorStop(0, SUN); g.addColorStop(0.7, '#ffe27a'); g.addColorStop(1, SUN_D);
    c.fillStyle = g; c.beginPath(); c.arc(GX, HZ - 40, 160, 0, Math.PI * 2); c.fill();
    // bands of haze across its face
    c.fillStyle = 'rgba(240,102,58,.35)';
    for (const [y, h] of [[HZ - 70, 6], [HZ - 46, 9], [HZ - 20, 12]]) c.fillRect(GX - 170, y, 340, h);
    c.restore();
  }, { t: 1.2, d: 1.2, reveal: 'rise', ease: 'out' });
}
function clouds(p, r) {
  // big painted cumulus, lit pink and gold from below, violet in their tops
  const list = [[230, 600, 420, 120], [1220, 520, 520, 150], [980, 770, 360, 90], [330, 860, 300, 70], [1380, 900, 240, 60]];
  list.forEach(([x, y, w, h], i) => {
    const rr = rng(70 + i);
    const puffs = [];
    const n = Math.round(w / (h * 0.6));
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; puffs.push([x - w / 2 + t * w + rr.range(-12, 12), y - Math.sin(t * Math.PI) * h * 0.55 + rr.range(-8, 8), (w / n) * rr.range(0.55, 0.8) * (0.7 + 0.5 * Math.sin(t * Math.PI))]); }
    const st = brush(rr, x - w / 2, x + w / 2, y - h, y + 10, (sx, sy, q) => (sy > y - h * 0.3 ? mix('#ff9a6a', '#ffd890', q) : mix('#8a3f7e', '#c45a8a', q)), { area: 260, l0: 16, l1: 50, w0: 4, w1: 9 });
    p.group('clouds', { x: x - w / 2 - 80, y: y - h * 1.6, w: w + 160, h: h * 1.6 + 40 }, (c) => {
      c.save();
      c.beginPath(); for (const [cx, cy, rad] of puffs) { c.moveTo(cx + rad, cy); c.arc(cx, cy, rad, 0, Math.PI * 2); }
      c.rect(x - w / 2 - 10, y - 20, w + 20, 26);
      c.fillStyle = '#b14f82'; c.fill();
      c.clip();
      paintStrokes(c, st, 0.75);
      // the bright rim along the foot
      c.globalAlpha = 1; c.fillStyle = 'rgba(255,226,150,.8)'; c.fillRect(x - w / 2 - 10, y, w + 20, 6);
      c.restore();
    }, { t: 2.0 + i * 0.25, d: 1.0, reveal: 'pop', ease: 'out' });
  });
}

// ================================================================ the far shore and the sea
function far(p, r) {
  // the harbor's far side: a low violet line of sheds, cranes and towers
  const pts = [[FR, HZ]];
  let x = FR;
  const cranes = [];
  while (x < W - FR) {
    const w = r.range(30, 90), h = r.chance(0.12) ? r.range(60, 110) : r.range(10, 40);
    pts.push([x, HZ - h], [x + w, HZ - h]);
    if (r.chance(0.08)) cranes.push([x + w / 2, HZ - h]);
    x += w;
  }
  pts.push([W - FR, HZ]);
  p.group('far', { x: FR, y: HZ - 200, w: W - 2 * FR, h: 210 }, (c) => {
    c.fillStyle = CITY_F; poly(c, pts); c.fill();
    c.strokeStyle = CITY; c.lineWidth = 3; c.beginPath();
    for (const [cx, cy] of cranes) { c.moveTo(cx, cy); c.lineTo(cx, cy - 70); c.lineTo(cx + 60, cy - 70); c.moveTo(cx - 20, cy - 70); c.lineTo(cx, cy - 90); c.lineTo(cx + 60, cy - 70); }
    c.stroke();
    c.fillStyle = 'rgba(255,220,150,.7)'; c.beginPath();
    for (let i = 0; i < 60; i++) { const lx = FR + ((i * 97) % (W - 2 * FR)), ly = HZ - 6 - ((i * 37) % 22); c.rect(lx, ly, 3, 2); }
    c.fill();
  }, { t: 2.6, d: 1.0, reveal: 'rise' });
}
function sea(p, r) {
  const y0 = HZ, y1 = GB + 10;
  const st = brush(r, FR, W - FR, y0, y1, (x, y, q) => (Math.abs(x - GX) < 120 + (y - y0) * 0.5 && q > 0.35 ? mix(SUN_D, SKY5, q) : mix(SEA, SEA_L, q * q)), { area: 300, l0: 20, l1: 90, w0: 2, w1: 5 });
  p.group('sea', { x: FR, y: y0 - 4, w: W - 2 * FR, h: y1 - y0 + 8 }, (c) => {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#b3466a'); g.addColorStop(1, SEA);
    c.fillStyle = g; c.fillRect(FR, y0, W - 2 * FR, y1 - y0);
    c.save(); c.beginPath(); c.rect(FR, y0, W - 2 * FR, y1 - y0); c.clip();
    paintStrokes(c, st, 0.8);
    c.restore();
  }, { t: 2.8, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // boats out on the harbor: a dhow under sail, launches, a steamer far off
  boat(p, 300, 1262, 1.0, '#f7f0e0', '#2a7f9e', 6.0);
  boat(p, 1450, 1250, 0.8, '#f7f0e0', '#c9342b', 6.3);
  dhow(p, 170, 1300, 1.1, 6.6);
  p.group('sea', { x: 1020, y: HZ - 40, w: 160, h: 50 }, (c) => {
    c.fillStyle = CITY; poly(c, [[1030, HZ - 2], [1170, HZ - 2], [1160, HZ + 8], [1040, HZ + 8]]); c.fill();
    c.fillRect(1060, HZ - 16, 80, 14); c.fillRect(1090, HZ - 36, 14, 20);
  }, { t: 5.6, d: 0.8, reveal: 'fade' });
}
function boat(p, x, y, s, hull, stripe, t) {
  // a harbor launch: a white hull with a colored band, a canopy on posts, a flag
  p.group('sea', { x: x - 110 * s, y: y - 90 * s, w: 220 * s, h: 110 * s }, (c) => {
    c.fillStyle = 'rgba(29,16,36,.35)'; c.fillRect(x - 90 * s, y + 6 * s, 180 * s, 6 * s);
    c.fillStyle = hull; poly(c, [[x - 100 * s, y - 26 * s], [x + 96 * s, y - 30 * s], [x + 80 * s, y + 4 * s], [x - 86 * s, y + 4 * s]]); c.fill();
    c.fillStyle = stripe; poly(c, [[x - 96 * s, y - 16 * s], [x + 92 * s, y - 19 * s], [x + 88 * s, y - 10 * s], [x - 92 * s, y - 8 * s]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2 * s; poly(c, [[x - 100 * s, y - 26 * s], [x + 96 * s, y - 30 * s], [x + 80 * s, y + 4 * s], [x - 86 * s, y + 4 * s]]); c.stroke();
    // the canopy and its posts
    c.beginPath(); for (let k = -3; k <= 3; k++) { c.moveTo(x + k * 22 * s, y - 28 * s); c.lineTo(x + k * 22 * s, y - 60 * s); } c.stroke();
    c.fillStyle = stripe; poly(c, [[x - 80 * s, y - 60 * s], [x + 80 * s, y - 62 * s], [x + 72 * s, y - 72 * s], [x - 72 * s, y - 70 * s]]); c.fill(); c.stroke();
    c.fillStyle = '#ffd34a'; c.beginPath(); for (let k = -3; k <= 3; k++) { c.moveTo(x + k * 22 * s + 4 * s, y - 40 * s); c.arc(x + k * 22 * s, y - 40 * s, 4 * s, 0, Math.PI * 2); } c.fill();
    c.beginPath(); c.moveTo(x + 70 * s, y - 72 * s); c.lineTo(x + 70 * s, y - 92 * s); c.stroke();
    c.fillStyle = '#ff8a2a'; poly(c, [[x + 70 * s, y - 92 * s], [x + 90 * s, y - 86 * s], [x + 70 * s, y - 80 * s]]); c.fill();
  }, { t, d: 0.9, reveal: 'slide', dx: -80 });
}
function dhow(p, x, y, s, t) {
  // a lateen sail, orange and patched, swelling over a dark wooden hull
  p.group('sea', { x: x - 80 * s, y: y - 240 * s, w: 260 * s, h: 260 * s }, (c) => {
    c.fillStyle = '#4a2418'; poly(c, [[x - 70 * s, y - 24 * s], [x + 120 * s, y - 30 * s], [x + 96 * s, y + 4 * s], [x - 50 * s, y + 4 * s]]); c.fill();
    c.fillStyle = '#d08a3a'; c.fillRect(x - 64 * s, y - 24 * s, 180 * s, 4 * s);
    c.strokeStyle = INK; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x + 20 * s, y - 24 * s); c.lineTo(x + 26 * s, y - 200 * s); c.stroke();
    c.lineWidth = 4 * s; c.beginPath(); c.moveTo(x - 60 * s, y - 60 * s); c.lineTo(x + 150 * s, y - 236 * s); c.stroke();
    c.fillStyle = '#f08a2c';
    c.beginPath(); c.moveTo(x - 56 * s, y - 64 * s); c.quadraticCurveTo(x + 110 * s, y - 120 * s, x + 146 * s, y - 232 * s); c.lineTo(x + 30 * s, y - 34 * s); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,230,160,.45)'; c.beginPath(); c.moveTo(x + 60 * s, y - 120 * s); c.quadraticCurveTo(x + 110 * s, y - 140 * s, x + 140 * s, y - 220 * s); c.lineTo(x + 80 * s, y - 120 * s); c.closePath(); c.fill();
    c.fillStyle = '#c95a24'; c.fillRect(x + 10 * s, y - 90 * s, 30 * s, 22 * s);
    c.strokeStyle = INK; c.lineWidth = 2 * s;
    c.beginPath(); c.moveTo(x - 56 * s, y - 64 * s); c.quadraticCurveTo(x + 110 * s, y - 120 * s, x + 146 * s, y - 232 * s); c.lineTo(x + 30 * s, y - 34 * s); c.closePath(); c.stroke();
  }, { t, d: 1.0, reveal: 'slide', dx: -120 });
}

// ================================================================ the Taj
function taj(p, r) {
  const x0 = 1130, x1 = W - FR, base = GB - 20, top = 1040;
  // the long front: stone with red-brick bands, rows of arched windows
  p.group('taj', { x: x0 - 10, y: top - 20, w: x1 - x0 + 20, h: base - top + 30 }, (c) => {
    c.fillStyle = TAJ; c.fillRect(x0, top, x1 - x0, base - top);
    c.fillStyle = '#c88a72';
    for (let y = top + 50; y < base; y += 62) c.fillRect(x0, y, x1 - x0, 8);
    // a warm wash from the sunset along the left of every bay
    c.fillStyle = 'rgba(255,170,90,.22)'; c.fillRect(x0, top, 120, base - top);
    c.fillStyle = 'rgba(80,30,70,.22)'; c.fillRect(x0 + 300, top, x1 - x0 - 300, base - top);
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x0, top, x1 - x0, base - top);
  }, { t: 3.0, d: 1.0, reveal: 'rise', ease: 'inOut' });
  // windows: pointed arches, some lit, with balconies
  const wins = [];
  for (let y = top + 70, row = 0; y < base - 50; y += 62, row++) for (let x = x0 + 22; x < x1 - 20; x += 34) wins.push([x, y, (row * 7 + x) % 5 === 0]);
  p.group('taj', { x: x0, y: top, w: x1 - x0, h: base - top }, (c) => {
    c.fillStyle = TAJ_S; c.beginPath();
    for (const [x, y, lit] of wins) if (!lit) { c.moveTo(x, y + 36); c.lineTo(x, y + 10); c.quadraticCurveTo(x, y, x + 9, y - 4); c.quadraticCurveTo(x + 18, y, x + 18, y + 10); c.lineTo(x + 18, y + 36); c.closePath(); }
    c.fill();
    c.fillStyle = '#ffd77a'; c.beginPath();
    for (const [x, y, lit] of wins) if (lit) { c.moveTo(x, y + 36); c.lineTo(x, y + 10); c.quadraticCurveTo(x, y, x + 9, y - 4); c.quadraticCurveTo(x + 18, y, x + 18, y + 10); c.lineTo(x + 18, y + 36); c.closePath(); }
    c.fill();
    c.fillStyle = TAJ_D; c.beginPath(); for (const [x, y] of wins) c.rect(x - 4, y + 34, 26, 4); c.fill();
  }, { t: 3.6, d: 0.9, reveal: 'fall', ease: 'inOut' });
  // the corner towers and the great central dome, red with white ribs
  const domes = [[1215, top, 48, 120, 4.2], [1400, top - 30, 86, 160, 4.6], [1520, top, 48, 120, 4.4]];
  for (const [x, y, rw, hgt, t] of domes) {
    p.group('taj', { x: x - rw - 20, y: y - hgt - 70, w: 2 * rw + 40, h: hgt + 110 }, (c) => {
      // the tower
      const tw = rw * 1.25;
      c.fillStyle = TAJ; c.fillRect(x - tw / 2, y - hgt * 0.45, tw, hgt * 0.45 + 40);
      c.fillStyle = TAJ_S; for (let k = -1; k <= 1; k++) c.fillRect(x + k * tw * 0.28 - 6, y - hgt * 0.36, 12, 34);
      c.fillStyle = '#f4e1c0'; c.fillRect(x - tw / 2 - 6, y - hgt * 0.45 - 8, tw + 12, 10);
      c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x - tw / 2, y - hgt * 0.45, tw, hgt * 0.45 + 40);
      // the dome: an onion of red tiles, ribbed
      const dy = y - hgt * 0.45 - 8;
      const domePath = () => { c.beginPath(); c.moveTo(x - rw * 0.62, dy); c.bezierCurveTo(x - rw * 0.75, dy - rw * 0.6, x - rw * 0.4, dy - rw * 0.95, x, dy - rw * 1.25); c.bezierCurveTo(x + rw * 0.4, dy - rw * 0.95, x + rw * 0.75, dy - rw * 0.6, x + rw * 0.62, dy); c.closePath(); };
      domePath(); c.fillStyle = DOME; c.fill();
      c.save(); domePath(); c.clip();
      c.fillStyle = DOME_L; c.beginPath(); c.ellipse(x - rw * 0.3, dy - rw * 0.55, rw * 0.3, rw * 0.6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = DOME_D; c.fillRect(x + rw * 0.25, dy - rw * 1.3, rw, rw * 1.3);
      c.strokeStyle = 'rgba(255,240,220,.8)'; c.lineWidth = 2;
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * rw * 0.24, dy); c.quadraticCurveTo(x + k * rw * 0.3, dy - rw * 0.7, x, dy - rw * 1.25); c.stroke(); }
      c.restore();
      domePath(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      c.strokeStyle = '#f4d27a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, dy - rw * 1.25); c.lineTo(x, dy - rw * 1.25 - 26); c.stroke();
      c.fillStyle = '#f4d27a'; c.beginPath(); c.arc(x, dy - rw * 1.25 - 10, 5, 0, Math.PI * 2); c.fill();
    }, { t, d: 0.9, reveal: 'rise', ease: 'out' });
  }
}

// ================================================================ the Gateway
function pointed(cx, w, spring, foot, k = 0.78) {
  // a pointed arch: two arcs meeting over the middle
  const R = w * k, pts = [[cx - w / 2, foot], [cx - w / 2, spring]];
  const a1 = Math.acos((w / 2 - R) / R);
  for (let i = 0; i <= 24; i++) { const a = Math.PI - (Math.PI - a1) * (i / 24); pts.push([cx - w / 2 + R + Math.cos(a) * R, spring - Math.sin(a) * R]); }
  for (let i = 24; i >= 0; i--) { const a = Math.PI - (Math.PI - a1) * (i / 24); pts.push([cx + w / 2 - R - Math.cos(a) * R, spring - Math.sin(a) * R]); }
  pts.push([cx + w / 2, foot]);
  return pts;
}
function gateway(p, r) {
  const L0 = 270, L1 = 2 * GX - 270; // the wings' outer edges (symmetric about GX)
  // the whole Gateway is drawn a size larger than its plan, about its foot
  const grp = (box, draw, o) => p.group('gate', { x: GX + (box.x - GX) * GS, y: GB + (box.y - GB) * GS, w: box.w * GS, h: box.h * GS }, (c) => { c.save(); c.translate(GX, GB); c.scale(GS, GS); c.translate(-GX, -GB); draw(c); c.restore(); }, o);
  const C0 = GX - 160, C1 = GX + 160; // the central block
  const T0 = 870; // the central block's top
  const arch = pointed(GX, 250, 1110, GB);
  const tex = brush(r, L0, L1, 700, GB, (x, y, q) => (q < 0.5 ? STONE_L : q < 0.8 ? STONE_M : '#f0b870'), { area: 120, l0: 6, l1: 20, w0: 2, w1: 4, angle: Math.PI / 2 });
  const texture = (c, x0, y0, x1, y1) => { c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip(); paintStrokes(c, tex.filter(([x, y]) => x > x0 - 20 && x < x1 + 20 && y > y0 - 20 && y < y1 + 20), 0.16); c.restore(); };
  // a cusped edge inside a pointed arch: little lobes along its curve
  const cusps = (c, pts, n, rad, col) => { c.fillStyle = col; c.beginPath(); for (let k = 1; k < n; k++) { const q = pts[2 + Math.round((k / n) * (pts.length - 5))]; c.moveTo(q[0] + rad, q[1]); c.arc(q[0], q[1], rad, 0, Math.PI * 2); } c.fill(); };
  // the plinth and steps
  grp({ x: L0 - 40, y: GB - 20, w: L1 - L0 + 80, h: 70 }, (c) => {
    for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? STONE_M : STONE_D; c.fillRect(L0 - 30 + k * 0, GB - 12 + k * 12, L1 - L0 + 60, 12); }
    c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(L0 - 30, GB - 12, L1 - L0 + 60, 48);
  }, { t: 3.6, d: 0.7, reveal: 'wipe', ease: 'inOut' });
  // the wings: each with an arched hall, a balcony of jali above and a crenellated top
  for (const s of [-1, 1]) {
    const a = s < 0 ? L0 : GX + 160 + 2, b = s < 0 ? GX - 162 : L1, cx = (a + b) / 2, wt = 1030;
    const hall = pointed(cx, 116, 1250, GB - 12, 0.7);
    const t0 = 4.0 + (s > 0 ? 0.2 : 0);
    grp({ x: a - 10, y: wt - 60, w: b - a + 20, h: GB - wt + 60 }, (c) => {
      c.fillStyle = STONE; c.fillRect(a, wt, b - a, GB - 12 - wt);
      // the light from the sunset on the near edges, shade on the far
      c.fillStyle = s < 0 ? 'rgba(255,220,140,.25)' : 'rgba(94,47,78,.28)'; c.fillRect(a, wt, b - a, GB - 12 - wt);
      texture(c, a, wt, b, GB - 12);
      // pilasters at the corners, small niches between
      c.fillStyle = STONE_M; c.fillRect(a + 6, wt + 38, 16, GB - wt - 60); c.fillRect(b - 22, wt + 38, 16, GB - wt - 60);
      c.fillStyle = STONE_L; c.fillRect(a + 6, wt + 38, 4, GB - wt - 60); c.fillRect(b - 22, wt + 38, 4, GB - wt - 60);
      c.fillStyle = STONE_S;
      for (const nx of [a + 44, b - 44]) for (const ny of [1210, 1290]) { c.beginPath(); c.moveTo(nx - 9, ny + 40); c.lineTo(nx - 9, ny + 8); c.arc(nx, ny + 8, 9, Math.PI, 0); c.lineTo(nx + 9, ny + 40); c.fill(); }
      // a frieze of little rosettes under the top
      c.fillStyle = STONE_D; c.beginPath(); for (let x = a + 14; x < b - 8; x += 18) { c.moveTo(x + 4, wt + 12); c.arc(x, wt + 12, 4, 0, Math.PI * 2); } c.fill();
      // string courses and a carved band
      c.fillStyle = STONE_D; for (const y of [wt + 30, wt + 140, 1190]) c.fillRect(a, y, b - a, 8);
      c.fillStyle = STONE_L; for (const y of [wt + 28, wt + 138, 1188]) c.fillRect(a, y, b - a, 3);
      // the crenellations along the top
      c.fillStyle = STONE; for (let x = a; x < b - 8; x += 20) { c.fillRect(x + 2, wt - 18, 12, 18); c.beginPath(); c.arc(x + 8, wt - 18, 6, Math.PI, 0); c.fill(); }
      // the hall's arch, deep in shadow, the sky beyond
      poly(c, hall); c.fillStyle = STONE_S; c.fill();
      c.save(); poly(c, hall); c.clip(); c.fillStyle = 'rgba(255,170,90,.35)'; c.fillRect(cx - 60, 1300, 120, 80); c.restore();
      c.strokeStyle = STONE_L; c.lineWidth = 6; openLine(c, pointed(cx, 132, 1250, GB - 12, 0.7)); c.stroke();
      cusps(c, hall, 9, 5, STONE);
      c.strokeStyle = INK; c.lineWidth = 2; openLine(c, hall); c.stroke();
      // the balcony: a jali screen in a bracketed frame
      const jx = cx - 60, jy = wt + 50, jw = 120, jh = 80;
      c.fillStyle = STONE_D; c.fillRect(jx - 8, jy - 6, jw + 16, jh + 16);
      c.fillStyle = STONE_S; c.fillRect(jx, jy, jw, jh);
      c.fillStyle = STONE_L; for (let y = jy + 4; y < jy + jh; y += 10) for (let x = jx + 4 + ((y / 10) % 2) * 5; x < jx + jw - 4; x += 10) c.fillRect(x, y, 5, 5);
      c.fillStyle = STONE_M; for (let k = 0; k < 5; k++) poly(c, [[jx - 4 + k * 32, jy + jh + 10], [jx + 10 + k * 32, jy + jh + 10], [jx + 3 + k * 32, jy + jh + 30]]), c.fill();
      c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(a, wt, b - a, GB - 12 - wt);
    }, { t: t0, d: 1.0, reveal: 'rise', ease: 'inOut' });
    // a little domed kiosk (chhatri) on the wing's outer corner
    const kx = s < 0 ? a + 40 : b - 40;
    grp({ x: kx - 50, y: wt - 140, w: 100, h: 130 }, (c) => chhatri(c, kx, wt - 18, 0.9), { t: t0 + 1.2, d: 0.6, reveal: 'drop', dy: 30 });
  }
  // the central block: the great arch through it, an attic of jali, the parapet
  grp({ x: C0 - 20, y: T0 - 40, w: C1 - C0 + 40, h: GB - T0 + 40 }, (c) => {
    const cut = () => { c.beginPath(); c.rect(C0, T0, C1 - C0, GB - 12 - T0); c.moveTo(arch[0][0], arch[0][1]); for (const q of arch) c.lineTo(q[0], q[1]); c.closePath(); };
    cut(); c.fillStyle = STONE; c.fill('evenodd');
    c.save(); cut(); c.clip('evenodd');
    // carved bands and panels
    c.fillStyle = STONE_D; for (const y of [T0 + 20, T0 + 110, 1180]) c.fillRect(C0, y, C1 - C0, 9);
    c.fillStyle = STONE_L; for (const y of [T0 + 18, T0 + 108, 1178]) c.fillRect(C0, y, C1 - C0, 3);
    // the jali in the attic
    c.fillStyle = STONE_S; c.fillRect(C0 + 30, T0 + 36, C1 - C0 - 60, 64);
    c.fillStyle = STONE_L; for (let y = T0 + 40; y < T0 + 96; y += 9) for (let x = C0 + 34 + ((y / 9) % 2) * 4.5; x < C1 - 34; x += 9) c.fillRect(x, y, 4, 4);
    texture(c, C0, T0, C1, GB - 12);
    c.fillStyle = STONE_M; c.fillRect(C0 + 4, T0 + 120, 14, GB - T0 - 140); c.fillRect(C1 - 18, T0 + 120, 14, GB - T0 - 140);
    c.fillStyle = STONE_L; c.fillRect(C0 + 4, T0 + 120, 3, GB - T0 - 140); c.fillRect(C1 - 18, T0 + 120, 3, GB - T0 - 140);
    // a row of tiny arched niches under the attic
    c.fillStyle = STONE_S; for (let x = C0 + 26; x < C1 - 20; x += 24) { c.beginPath(); c.moveTo(x - 5, T0 + 160); c.lineTo(x - 5, T0 + 144); c.arc(x, T0 + 144, 5, Math.PI, 0); c.lineTo(x + 5, T0 + 160); c.fill(); }
    // a deep shadow inside the arch's reveal, rim light on its left
    c.fillStyle = 'rgba(94,47,78,.25)'; c.fillRect(GX, T0, C1 - GX, GB - T0);
    c.restore();
    // the arch's molded edges
    c.strokeStyle = STONE_D; c.lineWidth = 14; openLine(c, pointed(GX, 270, 1110, GB - 12)); c.stroke();
    c.strokeStyle = STONE_L; c.lineWidth = 4; openLine(c, pointed(GX, 282, 1110, GB - 12)); c.stroke();
    cusps(c, arch, 15, 6, STONE);
    c.strokeStyle = INK; c.lineWidth = 2.4; openLine(c, arch); c.stroke();
    c.strokeRect(C0, T0, C1 - C0, GB - 12 - T0);
    // spandrel roundels either side of the arch's point
    for (const s of [-1, 1]) { const x = GX + s * 108, y = 1010; c.fillStyle = STONE_D; c.beginPath(); c.arc(x, y, 22, 0, Math.PI * 2); c.fill(); c.fillStyle = STONE_L; c.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.moveTo(x + Math.cos(a) * 15 + 4, y + Math.sin(a) * 15); c.arc(x + Math.cos(a) * 15, y + Math.sin(a) * 15, 4, 0, Math.PI * 2); } c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 22, 0, Math.PI * 2); c.stroke(); }
    // the parapet: little arches in a row
    c.fillStyle = STONE; c.fillRect(C0 - 10, T0 - 26, C1 - C0 + 20, 26);
    c.fillStyle = STONE_S; for (let x = C0; x < C1 - 10; x += 22) { c.beginPath(); c.moveTo(x + 6, T0 - 4); c.lineTo(x + 6, T0 - 14); c.arc(x + 11, T0 - 14, 5, Math.PI, 0); c.lineTo(x + 16, T0 - 4); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(C0 - 10, T0 - 26, C1 - C0 + 20, 26);
  }, { t: 4.6, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the four towers: octagonal shafts at the corners of the central block, the back two a little behind
  [[C0 + 12, 0.85, 5.4, true], [C1 - 12, 0.85, 5.5, true], [C0 - 4, 1.0, 5.7, false], [C1 + 4, 1.0, 5.8, false]].forEach(([x, s, t, back]) => {
    const top = back ? 748 : 770, w = 64 * s;
    grp({ x: x - w, y: top - 130, w: 2 * w, h: T0 + 40 - top + 130 }, (c) => {
      c.fillStyle = back ? STONE_M : STONE; c.fillRect(x - w / 2, top, w, T0 + 30 - top);
      c.fillStyle = back ? STONE_D : STONE_M; c.fillRect(x + w * 0.12, top, w * 0.38, T0 + 30 - top);
      if (!back) texture(c, x - w / 2, top, x + w / 2, T0 + 30);
      c.fillStyle = STONE_D; for (const y of [top + 60, top + 110]) c.fillRect(x - w / 2, y, w, 5);
      c.fillStyle = STONE_S; for (const y of [top + 24, top + 70]) { c.beginPath(); c.moveTo(x - 8, y + 30); c.lineTo(x - 8, y + 8); c.arc(x, y + 8, 8, Math.PI, 0); c.lineTo(x + 8, y + 30); c.fill(); }
      c.fillStyle = STONE_D; c.fillRect(x - w / 2 - 6, top - 4, w + 12, 10);
      c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x - w / 2, top, w, T0 + 30 - top);
      chhatri(c, x, top - 4, s * 1.1);
    }, { t, d: 0.9, reveal: 'rise', ease: 'out' });
  });
  // the sunset's rim light along the Gateway's left edges
  grp({ x: L0 - 10, y: 700, w: L1 - L0 + 20, h: GB - 700 }, (c) => {
    c.strokeStyle = 'rgba(255,230,140,.85)'; c.lineWidth = 4; c.beginPath();
    c.moveTo(L0 + 2, GB - 12); c.lineTo(L0 + 2, 1030);
    c.moveTo(C0 + 2, 1030); c.lineTo(C0 + 2, T0);
    c.moveTo(GX + 127, GB - 12); c.lineTo(GX + 127, 1110);
    c.stroke();
  }, { t: 7.0, d: 0.8, reveal: 'fade' });
}
// an arch's outline without its foot
function openLine(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
// a small domed pavilion on pillars
function chhatri(c, x, y, s) {
  c.fillStyle = STONE_D; c.fillRect(x - 26 * s, y - 6 * s, 52 * s, 8 * s);
  c.fillStyle = STONE; for (const k of [-1, 0, 1]) c.fillRect(x + k * 18 * s - 3 * s, y - 40 * s, 6 * s, 34 * s);
  c.fillStyle = STONE_S; c.fillRect(x - 15 * s, y - 36 * s, 30 * s, 28 * s);
  c.fillStyle = STONE; for (const k of [-1, 0, 1]) c.fillRect(x + k * 15 * s - 3 * s, y - 40 * s, 6 * s, 34 * s);
  c.fillStyle = STONE_D; c.fillRect(x - 28 * s, y - 46 * s, 56 * s, 8 * s);
  c.fillStyle = STONE; c.beginPath(); c.moveTo(x - 22 * s, y - 46 * s); c.bezierCurveTo(x - 26 * s, y - 70 * s, x - 6 * s, y - 80 * s, x, y - 92 * s); c.bezierCurveTo(x + 6 * s, y - 80 * s, x + 26 * s, y - 70 * s, x + 22 * s, y - 46 * s); c.closePath(); c.fill();
  c.fillStyle = 'rgba(94,47,78,.3)'; c.beginPath(); c.moveTo(x, y - 92 * s); c.bezierCurveTo(x + 6 * s, y - 80 * s, x + 26 * s, y - 70 * s, x + 22 * s, y - 46 * s); c.lineTo(x + 4 * s, y - 46 * s); c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(x - 22 * s, y - 46 * s); c.bezierCurveTo(x - 26 * s, y - 70 * s, x - 6 * s, y - 80 * s, x, y - 92 * s); c.bezierCurveTo(x + 6 * s, y - 80 * s, x + 26 * s, y - 70 * s, x + 22 * s, y - 46 * s); c.stroke();
  c.strokeStyle = '#f4d27a'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(x, y - 92 * s); c.lineTo(x, y - 108 * s); c.stroke();
}

// ================================================================ the plaza and the road
function plaza(p, r) {
  const st = brush(r, FR, W - FR, GB + 36, ROADY, (x, y, q) => mix(PLAZA, PLAZA_L, q), { area: 420, l0: 30, l1: 110, w0: 3, w1: 7 });
  p.group('plaza', { x: FR, y: GB + 30, w: W - 2 * FR, h: ROADY - GB - 20 }, (c) => {
    const g = c.createLinearGradient(0, GB + 36, 0, ROADY);
    g.addColorStop(0, '#d79a74'); g.addColorStop(1, '#8e5a56');
    c.fillStyle = g; c.fillRect(FR, GB + 36, W - 2 * FR, ROADY - GB - 36);
    c.save(); c.beginPath(); c.rect(FR, GB + 36, W - 2 * FR, ROADY - GB - 36); c.clip();
    paintStrokes(c, st, 0.5);
    // the paving's long lines toward the Gateway
    c.globalAlpha = 1; c.strokeStyle = 'rgba(60,30,40,.25)'; c.lineWidth = 2; c.beginPath();
    for (let k = -14; k <= 14; k++) { c.moveTo(GX + k * 30, GB + 36); c.lineTo(GX + k * 120, ROADY); }
    c.stroke();
    // the Gateway's glow on the stones
    c.fillStyle = 'rgba(255,210,130,.22)'; c.beginPath(); c.ellipse(GX, GB + 60, 300, 40, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }, { t: 5.0, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // a promenade wall with lamps along the road's edge
  p.group('plaza', { x: FR, y: ROADY - 60, w: W - 2 * FR, h: 70 }, (c) => {
    c.fillStyle = '#6e3c4e'; c.fillRect(FR, ROADY - 16, W - 2 * FR, 16);
    c.fillStyle = '#d9a07a'; c.fillRect(FR, ROADY - 18, W - 2 * FR, 4);
    for (let x = 140; x < W - 60; x += 240) {
      c.fillStyle = INK; c.fillRect(x - 2, ROADY - 58, 4, 42);
      c.fillStyle = '#fff0b0'; c.beginPath(); c.arc(x, ROADY - 60, 6, 0, Math.PI * 2); c.fill();
    }
  }, { t: 6.8, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // people strolling: small painted figures in bright cotton
  const folk = [];
  for (let i = 0; i < 30; i++) {
    const y = r.range(GB + 70, ROADY - 30), s = 0.6 + (y - GB) / 500;
    let x = r.range(100, W - 100);
    if (Math.abs(x - GX) < 60) x += 140;
    folk.push([x, y, s, r.pick(['#f4c21b', '#e8336d', '#2fa3a0', '#f7f0e0', '#ff7a2a', '#7a3fb0', '#2a6fd0', '#d7263d']), r.pick(['#1d1024', '#3a2418', '#5a3a2a']), r.chance(0.4)]);
  }
  folk.sort((a, b) => a[1] - b[1]);
  p.group('plaza', { x: FR, y: GB + 10, w: W - 2 * FR, h: ROADY - GB }, (c) => {
    for (const [x, y, s, col, hair, sari] of folk) {
      c.fillStyle = 'rgba(40,16,40,.3)'; c.beginPath(); c.ellipse(x + 10 * s, y, 12 * s, 3 * s, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = col;
      if (sari) { c.beginPath(); c.moveTo(x - 9 * s, y); c.lineTo(x - 5 * s, y - 34 * s); c.lineTo(x + 5 * s, y - 34 * s); c.lineTo(x + 9 * s, y); c.fill(); c.fillStyle = shade(col, 0.7); c.beginPath(); c.moveTo(x + 5 * s, y - 34 * s); c.lineTo(x - 6 * s, y - 14 * s); c.lineTo(x - 2 * s, y - 12 * s); c.lineTo(x + 7 * s, y - 28 * s); c.fill(); }
      else { c.fillRect(x - 6 * s, y - 34 * s, 12 * s, 18 * s); c.fillStyle = '#f2e6cc'; c.fillRect(x - 5 * s, y - 16 * s, 4 * s, 16 * s); c.fillRect(x + 1 * s, y - 16 * s, 4 * s, 16 * s); }
      c.fillStyle = '#9a5a3a'; c.beginPath(); c.arc(x, y - 39 * s, 5 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = hair; c.beginPath(); c.arc(x, y - 41 * s, 5 * s, Math.PI, 0); c.fill();
    }
    // a balloon seller with his bunch
    const bx = 1010, by = ROADY - 110;
    c.fillStyle = '#f7f0e0'; c.fillRect(bx - 7, by - 38, 14, 38); c.fillStyle = '#9a5a3a'; c.beginPath(); c.arc(bx, by - 44, 6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(30,15,30,.6)'; c.lineWidth = 1;
    const bl = [[-30, -150, '#e8336d'], [-8, -170, '#f4c21b'], [18, -158, '#2fa3a0'], [38, -140, '#ff7a2a'], [0, -132, '#7a3fb0'], [-22, -120, '#2a6fd0']];
    c.beginPath(); for (const [dx, dy] of bl) { c.moveTo(bx + 4, by - 40); c.lineTo(bx + dx, by + dy + 14); } c.stroke();
    for (const [dx, dy, col] of bl) { c.fillStyle = col; c.beginPath(); c.ellipse(bx + dx, by + dy, 12, 15, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(bx + dx - 4, by + dy - 6, 3, 0, Math.PI * 2); c.fill(); }
  }, { t: 7.4, d: 0.9, reveal: 'fade' });
  // pigeons on the stones, hundreds, gray with a sheen
  const pg = [];
  for (let i = 0; i < 240; i++) {
    const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 1;
    const x = GX - 330 + Math.cos(a) * rr * 230, y = GB + 130 + Math.sin(a) * rr * 60;
    pg.push([x, y, r.chance(0.5) ? 1 : -1, r.range(0.55, 0.85) * (0.8 + (y - GB) / 400)]);
  }
  pg.sort((a, b) => a[1] - b[1]);
  p.group('plaza', { x: GX - 640, y: GB + 30, w: 560, h: 180 }, (c) => {
    for (const [x, y, d, s] of pg) {
      c.fillStyle = '#7d7590'; c.beginPath(); c.ellipse(x, y, 7 * s, 4 * s, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5a5470'; c.beginPath(); c.arc(x + d * 6 * s, y - 4 * s, 3 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c9c4d8'; c.fillRect(x - 3 * s, y - 2 * s, 5 * s, 1.5 * s);
    }
  }, { t: 8.0, d: 0.8, reveal: 'fade' });
}
function road(p, r) {
  p.group('road', { x: FR, y: ROADY, w: W - 2 * FR, h: H - FR - ROADY }, (c) => {
    c.fillStyle = ROAD; c.fillRect(FR, ROADY, W - 2 * FR, H - FR - ROADY);
    // the sunset's sheen on the tar, and the white dashes
    c.fillStyle = 'rgba(255,140,90,.18)'; c.fillRect(FR, ROADY + 10, W - 2 * FR, 40);
    c.fillStyle = '#efe2c8'; for (let x = 70; x < W - 60; x += 120) c.fillRect(x, ROADY + 160, 60, 7);
    c.fillStyle = '#6a5060'; c.fillRect(FR, H - FR - 34, W - 2 * FR, 34);
    c.fillStyle = '#9a7a80'; c.fillRect(FR, H - FR - 36, W - 2 * FR, 4);
  }, { t: 6.4, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // a red double-decker going one way, taxis both ways
  bus(p, 1210, ROADY + 150, 1, 8.2);
  [[190, ROADY + 150, 1, 1, 8.4], [560, ROADY + 260, 1.15, -1, 8.7], [960, ROADY + 270, 1.15, -1, 9.0], [1440, ROADY + 268, 1.15, -1, 9.2]].forEach(([x, y, s, dir, t]) => taxi(p, x, y, s, dir, t));
}
function taxi(p, x, y, s, dir, t) {
  // a little boxy black taxi with a yellow roof, chrome bumpers and a roof sign
  p.group('cars', { x: x - 120 * s, y: y - 100 * s, w: 240 * s, h: 120 * s }, (c) => {
    c.save(); c.translate(x, y); c.scale(s * dir, s);
    c.fillStyle = 'rgba(10,5,10,.45)'; c.beginPath(); c.ellipse(0, 4, 104, 9, 0, 0, Math.PI * 2); c.fill();
    // the body
    c.fillStyle = TAXI_B; c.beginPath(); c.moveTo(-98, -8); c.lineTo(-96, -38); c.quadraticCurveTo(-94, -46, -80, -48); c.lineTo(80, -50); c.quadraticCurveTo(98, -48, 100, -34); c.lineTo(100, -8); c.closePath(); c.fill();
    // the roof and its glass
    c.fillStyle = TAXI_Y; c.beginPath(); c.moveTo(-54, -48); c.lineTo(-40, -82); c.quadraticCurveTo(-36, -86, -28, -86); c.lineTo(34, -86); c.quadraticCurveTo(42, -86, 46, -80); c.lineTo(66, -49); c.closePath(); c.fill();
    c.fillStyle = '#6e8eb0'; poly(c, [[-46, -50], [-34, -78], [2, -78], [2, -50]]); c.fill(); poly(c, [[8, -50], [8, -78], [40, -78], [56, -50]]); c.fill();
    c.fillStyle = 'rgba(255,220,180,.5)'; poly(c, [[-40, -54], [-32, -74], [-22, -74], [-34, -54]]); c.fill();
    c.fillStyle = TAXI_Y; c.fillRect(-4, -100, 24, 14); c.fillStyle = INK; c.fillRect(-1, -97, 18, 8);
    // the chrome, the lamps, the wheels
    c.fillStyle = CHROME; c.fillRect(-102, -14, 10, 8); c.fillRect(94, -14, 10, 8); c.fillRect(-90, -30, 186, 2);
    c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(97, -30, 5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d7263d'; c.fillRect(-99, -32, 5, 8);
    for (const wx of [-60, 62]) {
      c.fillStyle = INK; c.beginPath(); c.arc(wx, -6, 19, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e8e2d6'; c.beginPath(); c.arc(wx, -6, 11, 0, Math.PI * 2); c.fill();
      c.fillStyle = CHROME; c.beginPath(); c.arc(wx, -6, 6, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = '#3a3440'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(4, -48); c.lineTo(4, -10); c.stroke();
    c.fillStyle = 'rgba(255,170,110,.35)'; c.fillRect(-90, -46, 180, 6);
    c.restore();
  }, { t, d: 1.0, reveal: 'slide', dx: dir * -160 });
}
function bus(p, x, y, s, t) {
  p.group('cars', { x: x - 200, y: y - 230, w: 420, h: 250 }, (c) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = 'rgba(10,5,10,.4)'; c.fillRect(-180, -2, 370, 10);
    c.fillStyle = '#c62a2a'; c.beginPath(); c.moveTo(-190, -10); c.lineTo(-190, -200); c.quadraticCurveTo(-190, -214, -176, -214); c.lineTo(184, -214); c.quadraticCurveTo(196, -214, 196, -200); c.lineTo(196, -10); c.closePath(); c.fill();
    c.fillStyle = '#efe2c8'; c.fillRect(-190, -116, 386, 10);
    c.fillStyle = '#2c2a44';
    for (let k = 0; k < 7; k++) { c.fillRect(-176 + k * 52, -196, 42, 54); c.fillRect(-176 + k * 52, -98, 42, 48); }
    c.fillStyle = '#ffd77a'; for (const k of [1, 4, 5]) c.fillRect(-176 + k * 52, -196, 42, 54);
    c.fillStyle = 'rgba(255,190,120,.3)'; c.fillRect(-190, -214, 386, 10);
    c.fillStyle = INK; for (const wx of [-120, 130]) { c.beginPath(); c.arc(wx, -8, 22, 0, Math.PI * 2); c.fill(); c.fillStyle = '#8a8490'; c.beginPath(); c.arc(wx, -8, 9, 0, Math.PI * 2); c.fill(); c.fillStyle = INK; }
    c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(-190, -214, 386, 204);
    c.restore();
  }, { t, d: 1.0, reveal: 'slide', dx: 200 });
}

// ================================================================ live
function life(p, r) {
  // the bulbs chase round the frame
  p.live('frame', {
    t: 9.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const k0 = Math.floor(time * 7);
      c.fillStyle = 'rgba(255,214,120,.35)'; c.beginPath();
      for (let i = 0; i < BULBS.length; i++) if ((i + k0) % 3 === 0) { const [x, y] = BULBS[i]; c.moveTo(x + 15, y); c.arc(x, y, 15, 0, Math.PI * 2); }
      c.fill();
      c.fillStyle = '#fff6c8'; c.beginPath();
      for (let i = 0; i < BULBS.length; i++) if ((i + k0) % 3 === 0) { const [x, y] = BULBS[i]; c.moveTo(x + 7, y); c.arc(x, y, 7, 0, Math.PI * 2); }
      c.fill();
    },
  });
  // pigeons wheeling up past the Gateway
  const fl = [];
  for (let i = 0; i < 26; i++) fl.push([r.range(200, 1300), r.range(560, 1000), r.range(40, 160), r.range(0.25, 0.6) * (r.chance(0.5) ? 1 : -1), r() * 7, r.range(0.8, 1.3)]);
  p.live('birds', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#2a1a36';
      for (const [x0, y0, rad, w, ph, s] of fl) {
        const a = time * w + ph, x = x0 + Math.cos(a) * rad * 1.8, y = y0 + Math.sin(a) * rad * 0.5;
        const f = Math.sin(time * 9 + ph * 3);
        c.beginPath(); c.moveTo(x - 11 * s, y - 5 * f * s); c.quadraticCurveTo(x - 4 * s, y - 2 * s, x, y); c.quadraticCurveTo(x + 4 * s, y - 2 * s, x + 11 * s, y - 5 * f * s); c.quadraticCurveTo(x + 4 * s, y + 2 * s, x, y + 3 * s); c.quadraticCurveTo(x - 4 * s, y + 2 * s, x - 11 * s, y - 5 * f * s); c.fill();
      }
    },
  });
  // the sun's path on the water
  const gl = [];
  for (let i = 0; i < 24; i++) { const y = r.range(HZ + 8, GB - 20); gl.push([GX + r.range(-1, 1) * (40 + (y - HZ) * 0.6), y, r() * 6, r.range(10, 30)]); }
  p.live('sea', {
    t: 9.8, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#fff3c0';
      for (const [x, y, ph, L] of gl) {
        const a = Math.sin(time * 1.7 + ph * 2);
        if (a < 0.2) continue;
        c.globalAlpha = a; c.fillRect(x - L / 2 + Math.sin(time * 0.8 + ph) * 6, y, L, 2.5);
      }
      c.globalAlpha = 1;
    },
  });
}

// ================================================================ the title
function title(p, r) {
  const tx = 560, ty = 340, skew = -0.2;
  // the Devanagari set whole, so its letters join under the headline: first the deep extrusion
  p.mark('title', {
    t: 10.2, d: 1.0, reveal: 'wipe', ease: 'inOut', box: { x: 40, y: 20, w: 1200, h: 420 },
    draw: (c) => {
      c.save(); c.transform(1, 0, skew, 1, -skew * ty, 0);
      c.font = `400 300px ${FACE}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      for (let k = 22; k >= 1; k -= 1.5) { c.fillStyle = mix('#3a0a1a', '#7a1426', k / 22); c.fillText('मुंबई', tx + k * 0.9, ty + k); }
      c.restore();
    },
  });
  // then its face: a fat white outline, a fill from yellow to fire, a shine
  p.mark('title', {
    t: 10.8, d: 0.9, reveal: 'press', ease: 'out', box: { x: 40, y: 20, w: 1200, h: 420 },
    draw: (c) => {
      c.save(); c.transform(1, 0, skew, 1, -skew * ty, 0);
      c.font = `400 300px ${FACE}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
      c.strokeStyle = '#fff6dc'; c.lineWidth = 16; c.strokeText('मुंबई', tx, ty);
      const g = c.createLinearGradient(0, ty - 230, 0, ty + 40);
      g.addColorStop(0, '#fff27a'); g.addColorStop(0.45, '#ffc21b'); g.addColorStop(0.75, '#ff6a1a'); g.addColorStop(1, '#d7263d');
      c.fillStyle = g; c.fillText('मुंबई', tx, ty);
      c.strokeStyle = '#7a1426'; c.lineWidth = 3; c.strokeText('मुंबई', tx, ty);
      c.restore();
    },
  });
  // MUMBAI under it, in tall block letters with a hard red shadow
  p.type('title', 'MUMBAI', 1190, 300, { family: FACE, size: 104, color: '#e9fbff', shadow: '#c41f3e', sx: 7, sy: 7, stroke: INK, lw: 3, track: 0.08, align: 'center', t: 11.6, gap: 0.12, d: 0.6, reveal: 'drop' });
  // the tagline in a painted ribbon: the city of dreams
  p.group('title', { x: 930, y: 330, w: 540, h: 110 }, (c) => {
    c.translate(-55, -200);
    c.fillStyle = '#1f8f8f'; poly(c, [[1010, 540], [1490, 532], [1470, 572], [1494, 612], [1014, 618], [1032, 578]]); c.fill();
    c.strokeStyle = '#fff6dc'; c.lineWidth = 3; c.stroke();
    c.font = `400 54px ${FACE}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = INK; c.fillText('सपनों का शहर', 1255, 597);
    c.fillStyle = '#fff6dc'; c.fillText('सपनों का शहर', 1252, 594);
  }, { t: 12.4, d: 0.7, reveal: 'wipe', ease: 'inOut' });
  // starbursts, as the painters threw them round a title
  for (const [x, y, R, t] of [[110, 110, 40, 12.9], [1470, 120, 50, 13.0], [960, 150, 30, 13.1]]) {
    p.group('title', { x: x - R - 4, y: y - R - 4, w: 2 * R + 8, h: 2 * R + 8 }, (c) => {
      c.fillStyle = '#fff2a0'; c.beginPath();
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, rr = k % 2 ? R * 0.32 : R; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      c.closePath(); c.fill();
    }, { t, d: 0.5, reveal: 'pop', ease: 'back' });
  }
}
