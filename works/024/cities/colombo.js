// Colombo: an old tea-chest label. A deep green ground engraved with a lattice,
// gold rules with cut corners, sprigs of tea in the upper corners and elephants
// in the lower ones, a red ribbon over the top. In a great beaded gold oval, a
// chromolithograph of the city at sundown: the Jami Ul-Alfar mosque's red and
// white candy stripes and its turrets, the old Colombo lighthouse with its clock,
// the Lotus Tower, the long tiled roof and verandah of the Old Dutch Hospital,
// the sea off Galle Face with outrigger canoes and kites, coconut palms, and a
// street with a bullock cart and a three-wheeler. The name in Della Respira below.

import { Plate, W, H } from '../print.js';
import { lerp, poly } from '../kit.js';

const PAPER = '#efe4c6';
const LABEL = '#123f2f', LABEL_D = '#0b2a1f', LABEL_L = '#1d5440';
const GOLD = '#c99a3e', GOLD_L = '#efd48e', GOLD_D = '#8a6224', GOLD_DD = '#5a3d12';
const RIB = '#9e2a22', RIB_D = '#6e1a14';
const INK = '#1f2b25';
const RED = '#c4372c', RED_D = '#8f2219', WHITE = '#f6eedb';
const SEA = '#4f9a9a', SEA_D = '#2c6e72', SKY_T = '#bcdcd6', SKY_M = '#f3e3bb', SKY_H = '#f2b98d';
const WALL = '#efe0bd', WALL_D = '#d2bd92', ROOF = '#b5563a', ROOF_D = '#8a3c27', SHUT = '#2f6b4f';
const LEAF = '#3c7c47', LEAF_D = '#24563a', LEAF_L = '#6aa25e', GRASS = '#86a85c', ROAD = '#d9c193';
const F = '"Della Respira", serif';

export const city = {
  id: 'colombo', name: 'Colombo', wall: '#0e2a20',
  alt: 'A vintage tea label in green and gold: inside a beaded gold oval, the red and white striped Jami Ul-Alfar mosque with its domed turrets, the old Colombo lighthouse clock tower, the Lotus Tower, the tiled roof and verandah of the Old Dutch Hospital, the sea off Galle Face at sundown with outrigger canoes, a steamer and kites, coconut palms, and a street with a bullock cart, a three-wheeler and people; tea sprigs in the upper corners, elephants in the lower ones, a red ribbon reading SRI LANKA and the name COLOMBO',
  google: 'family=Della+Respira',
  fonts: [['400 100px "Della Respira"', 'COLOMBO SRI LANKA PEARL OF THE INDIAN OCEAN']],
  build,
};

// the oval opening, and the label's edge
const OX = 800, OY = 890, RX = 570, RY = 680;
const L0 = 40; // the label's margin on the sheet
const HZ = 862; // the horizon

function build() {
  const p = new Plate({ paper: PAPER, seed: 6979 });
  const r = p.r;
  p.stack('sky', 'far', 'sea', 'mosque', 'city', 'front', 'live', 'ground', 'frame', 'corners', 'title');
  for (const n of ['ground', 'frame', 'corners', 'title']) p.layer(n, { clip: false });
  ground(p);
  sky(p, r);
  frame(p);
  far(p, r);
  sea(p, r);
  lotusTower(p);
  mosque(p);
  lighthouse(p);
  hospital(p);
  palms(p);
  street(p, r);
  corners(p);
  life(p, r);
  title(p);
  return p;
}

// ================================================================ engraving helpers
// parallel lines across a shape: the engraver's tint
function hatch(c, pts, step, ang, color, lw) {
  c.save(); poly(c, pts); c.clip();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 2;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  c.strokeStyle = color; c.lineWidth = lw;
  c.beginPath();
  for (let d = -R; d <= R; d += step) { c.moveTo(cx - ca * R - sa * d, cy - sa * R + ca * d); c.lineTo(cx + ca * R - sa * d, cy + sa * R + ca * d); }
  c.stroke();
  c.restore();
}
function shape(c, pts, fill, o = {}) {
  c.fillStyle = fill; poly(c, pts); c.fill();
  if (o.hatch) hatch(c, pts, o.hatch, o.ang ?? 0, o.hc || 'rgba(31,43,37,.35)', o.hlw || 0.8);
  if (o.line !== false) { c.strokeStyle = o.line || INK; c.lineWidth = o.lw || 1.3; c.lineJoin = 'round'; poly(c, pts); c.stroke(); }
}
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
function ovalPath(c, rx, ry) { c.moveTo(OX + rx, OY); c.ellipse(OX, OY, rx, ry, 0, 0, Math.PI * 2); }
// the label's outline: a rectangle with its corners cut in quarter circles
function labelPath(c, k, cut) {
  const x0 = k, y0 = k, x1 = W - k, y1 = H - k;
  c.moveTo(x0 + cut, y0); c.lineTo(x1 - cut, y0); c.arc(x1, y0, cut, Math.PI, Math.PI / 2, true);
  c.lineTo(x1, y1 - cut); c.arc(x1, y1, cut, -Math.PI / 2, Math.PI, true);
  c.lineTo(x0 + cut, y1); c.arc(x0, y1, cut, 0, -Math.PI / 2, true);
  c.lineTo(x0, y0 + cut); c.arc(x0, y0, cut, Math.PI / 2, 0, true);
  c.closePath();
}

// ================================================================ the label ground
function ground(p) {
  // the green, everywhere but the oval: it hides the picture's edges from the start
  p.group('ground', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = PAPER; c.beginPath(); c.rect(0, 0, W, H); labelPath(c, L0, 46); c.fill('evenodd');
    c.beginPath(); labelPath(c, L0, 46); ovalPath(c, RX, RY);
    const g = c.createRadialGradient(OX, OY, 400, OX, OY, 1300);
    g.addColorStop(0, LABEL_L); g.addColorStop(0.6, LABEL); g.addColorStop(1, LABEL_D);
    c.fillStyle = g; c.fill('evenodd');
  }, { t: 0, d: 0.8, reveal: 'fade' });
  // a lattice engraved in it, with a dot at every crossing: one tile, repeated
  let tile = null;
  const latticeTile = () => {
    if (tile) return tile;
    const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(26, 26) : Object.assign(document.createElement('canvas'), { width: 26, height: 26 });
    const t = cv.getContext('2d');
    t.strokeStyle = 'rgba(201,154,62,.2)'; t.lineWidth = 1;
    t.beginPath(); t.moveTo(0, 0); t.lineTo(26, 26); t.moveTo(26, 0); t.lineTo(0, 26); t.stroke();
    t.fillStyle = 'rgba(231,196,110,.4)';
    for (const [x, y] of [[0, 0], [26, 0], [0, 26], [26, 26], [13, 13]]) t.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
    tile = cv;
    return tile;
  };
  p.group('ground', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.beginPath(); labelPath(c, L0 + 40, 30); ovalPath(c, RX + 40, RY + 40);
    c.fillStyle = c.createPattern(latticeTile(), 'repeat'); c.fill('evenodd');
  }, { t: 0.4, d: 1.0, reveal: 'fade' });
}

// ================================================================ the frames
function frame(p) {
  // the label's two gold rules, drawn round
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = GOLD; c.lineWidth = 5; c.beginPath(); labelPath(c, L0 + 18, 34); c.stroke();
    c.lineWidth = 1.5; c.beginPath(); labelPath(c, L0 + 30, 28); c.stroke();
    c.strokeStyle = GOLD_L; c.lineWidth = 1; c.beginPath(); labelPath(c, L0 + 17, 35); c.stroke();
    // little gold stars in the corner cuts
    c.fillStyle = GOLD;
    for (const [x, y] of [[L0, L0], [W - L0, L0], [W - L0, H - L0], [L0, H - L0]]) star(c, x + Math.sign(OX - x) * 40, y + Math.sign(OY - y) * 40, 9);
  }, { t: 0.8, d: 1.2, reveal: 'iris', ease: 'inOut' });

  // the oval: a gold band, beads, and a red line inside
  p.group('frame', { x: OX - RX - 50, y: OY - RY - 50, w: 2 * RX + 100, h: 2 * RY + 100 }, (c) => {
    c.beginPath(); ovalPath(c, RX + 38, RY + 38); ovalPath(c, RX, RY);
    const g = c.createLinearGradient(OX - RX, OY - RY, OX + RX, OY + RY);
    g.addColorStop(0, GOLD_L); g.addColorStop(0.35, GOLD); g.addColorStop(0.55, GOLD_L); g.addColorStop(0.8, GOLD_D); g.addColorStop(1, GOLD);
    c.fillStyle = g; c.fill('evenodd');
    // engraved fluting across the band
    c.strokeStyle = 'rgba(90,61,18,.55)'; c.lineWidth = 1;
    c.beginPath();
    for (let k = 0; k < 360; k++) {
      const a = (k / 360) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      c.moveTo(OX + ca * (RX + 22), OY + sa * (RY + 22)); c.lineTo(OX + ca * (RX + 36), OY + sa * (RY + 36));
    }
    c.stroke();
    c.strokeStyle = GOLD_DD; c.lineWidth = 2;
    c.beginPath(); ovalPath(c, RX + 38, RY + 38); c.stroke();
    c.beginPath(); ovalPath(c, RX + 20, RY + 20); c.stroke();
    c.strokeStyle = RIB; c.lineWidth = 3; c.beginPath(); ovalPath(c, RX + 2, RY + 2); c.stroke();
    c.strokeStyle = GOLD_DD; c.lineWidth = 1.2; c.beginPath(); ovalPath(c, RX, RY); c.stroke();
  }, { t: 1.6, d: 1.4, reveal: 'iris', ease: 'inOut' });
  // pearls between the rules
  const pearls = [];
  for (let k = 0; k < 150; k++) { const a = (k / 150) * Math.PI * 2; pearls.push([OX + Math.cos(a) * (RX + 10), OY + Math.sin(a) * (RY + 10)]); }
  p.group('frame', { x: OX - RX - 30, y: OY - RY - 30, w: 2 * RX + 60, h: 2 * RY + 60 }, (c) => {
    c.fillStyle = GOLD_DD; c.beginPath(); for (const [x, y] of pearls) { c.moveTo(x + 5.5, y + 1); c.arc(x + 0.8, y + 1, 4.8, 0, Math.PI * 2); } c.fill();
    c.fillStyle = '#f7e9c0'; c.beginPath(); for (const [x, y] of pearls) { c.moveTo(x + 4.6, y); c.arc(x, y, 4.6, 0, Math.PI * 2); } c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); for (const [x, y] of pearls) { c.moveTo(x - 0.5, y - 1.5); c.arc(x - 1.5, y - 1.5, 1.4, 0, Math.PI * 2); } c.fill();
  }, { t: 2.8, d: 0.9, reveal: 'fade' });
  // scrolls at the oval's sides
  p.group('frame', { x: 120, y: OY - 120, w: W - 240, h: 240 }, (c) => {
    for (const s of [-1, 1]) scrollPair(c, OX + s * (RX + 38), OY, s);
  }, { t: 3.2, d: 0.8, reveal: 'pop' });
}
function star(c, x, y, s) {
  c.beginPath();
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? s * 0.42 : s; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fill();
}
// two C-scrolls back to back, and a rosette, set on the oval's edge
function scrollPair(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, 1);
  c.strokeStyle = GOLD; c.lineWidth = 7; c.lineCap = 'round';
  for (const k of [-1, 1]) {
    c.beginPath(); c.moveTo(0, k * 20); c.bezierCurveTo(40, k * 22, 58, k * 70, 30, k * 92); c.bezierCurveTo(12, k * 104, -2, k * 84, 16, k * 76); c.stroke();
  }
  c.strokeStyle = GOLD_DD; c.lineWidth = 1.4;
  for (const k of [-1, 1]) { c.beginPath(); c.moveTo(4, k * 16); c.bezierCurveTo(44, k * 18, 62, k * 70, 30, k * 97); c.stroke(); }
  c.fillStyle = RIB; c.beginPath(); c.arc(20, 0, 18, 0, Math.PI * 2); c.fill();
  c.strokeStyle = GOLD; c.lineWidth = 4; c.stroke();
  c.fillStyle = GOLD_L; star(c, 20, 0, 10);
  c.restore();
}

// ================================================================ the sky and the sun
const SUN = [1268, HZ, 66];
function sky(p, r) {
  p.group('sky', { x: OX - RX, y: OY - RY, w: 2 * RX, h: HZ - OY + RY + 4 }, (c) => {
    const g = c.createLinearGradient(0, OY - RY, 0, HZ);
    g.addColorStop(0, SKY_T); g.addColorStop(0.55, SKY_M); g.addColorStop(1, SKY_H);
    c.fillStyle = g; c.fillRect(OX - RX, OY - RY, 2 * RX, HZ - OY + RY + 2);
  }, { t: 1.2, d: 1.2, reveal: 'fall', ease: 'inOut' });
  // the sun and its rays, engraved
  const rays = [];
  for (let k = 0; k < 34; k++) {
    const a = Math.PI + (k + 0.5) / 34 * Math.PI, L = k % 2 ? 520 : 900;
    rays.push([[SUN[0] + Math.cos(a) * 90, HZ + Math.sin(a) * 90], [SUN[0] + Math.cos(a) * L, HZ + Math.sin(a) * L]]);
  }
  p.strokes('sky', rays, 'rgba(225,140,90,.45)', 2.2, { t: 2.2, d: 1.2, reveal: 'iris', box: { x: OX - RX, y: OY - RY, w: 2 * RX, h: HZ - OY + RY } });
  // the engraver's lines across the sky, close at the top
  const lines = [];
  for (let y = OY - RY + 4, k = 0; y < HZ - 4; k++) {
    lines.push([[OX - RX, y], [OX + RX, y]]);
    y += 4 + (y - (OY - RY)) / (HZ - OY + RY) * 9;
  }
  p.strokes('sky', lines, 'rgba(40,80,90,.16)', 1, { t: 2.0, d: 1.0, reveal: 'fall' });
  p.group('sky', { x: SUN[0] - 80, y: HZ - 80, w: 160, h: 84 }, (c) => {
    c.save(); c.beginPath(); c.rect(SUN[0] - 80, HZ - 80, 160, 80); c.clip();
    c.fillStyle = '#f08a55'; c.beginPath(); c.arc(SUN[0], HZ, SUN[2], 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(160,60,30,.5)'; c.lineWidth = 1.2;
    c.beginPath(); for (let y = HZ - 6; y > HZ - SUN[2]; y -= 7) { const h = Math.sqrt(SUN[2] ** 2 - (HZ - y) ** 2); c.moveTo(SUN[0] - h, y); c.lineTo(SUN[0] + h, y); } c.stroke();
    c.restore();
  }, { t: 2.6, d: 1.0, reveal: 'rise' });
  // a few long clouds, lit from below
  const cl = [[300, 430, 260], [620, 330, 200], [880, 520, 300], [430, 640, 220], [1120, 600, 180], [1000, 300, 160]];
  cl.forEach(([x, y, w], i) => {
    p.group('sky', { x: x - 10, y: y - 26, w: w + 20, h: 40 }, (c) => {
      const pts = [];
      for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push([x + t * w, y - Math.sin(t * Math.PI) * 18 - Math.sin(t * Math.PI * 3) * 4]); }
      pts.push([x + w, y + 6], [x, y + 6]);
      c.fillStyle = '#fbf2dc'; poly(c, pts); c.fill();
      c.strokeStyle = 'rgba(200,110,80,.6)'; c.lineWidth = 1.2;
      c.beginPath(); for (let yy = y + 4; yy > y - 10; yy -= 4) { c.moveTo(x + 14, yy); c.lineTo(x + w - 14, yy); } c.stroke();
      c.strokeStyle = 'rgba(31,43,37,.5)'; c.lineWidth = 1; poly(c, pts); c.stroke();
    }, { t: 2.4 + i * 0.15, d: 0.8, reveal: i % 2 ? 'wipeL' : 'wipe' });
  });
}

// ================================================================ the far town, the sea
function far(p, r) {
  // the land under the horizon on the left
  p.group('far', { x: OX - RX, y: HZ - 4, w: 700, h: 560 }, (c) => {
    shape(c, rect(OX - RX, HZ, 900, 1400), '#dccfa6', { hatch: 6, ang: 0, hc: 'rgba(120,100,60,.2)', line: false });
  }, { t: 3.2, d: 0.8, reveal: 'fade' });
  // roofs and a dome or two along the horizon, pale with distance
  const blocks = [];
  let x = OX - RX;
  const walls = ['#e9d8b4', '#e6c9ae', '#d9d3bd', '#efdcc0', '#dcc7a2'];
  while (x < 900) {
    const w = r.range(34, 72), h = r.range(26, 78);
    blocks.push([x, w, h, r.chance(0.18), r.pick(walls), r.chance(0.5)]);
    x += w - 6;
  }
  p.group('far', { x: OX - RX, y: HZ - 140, w: 700, h: 260 }, (c) => {
    for (const [x0, w, h, dome, col, roof] of blocks) {
      const yt = HZ + 40 - h;
      shape(c, rect(x0, yt, x0 + w, HZ + 70), col, { hatch: 3, ang: Math.PI / 2, hc: 'rgba(90,80,60,.12)', line: 'rgba(31,43,37,.45)', lw: 0.9 });
      c.fillStyle = 'rgba(70,80,75,.45)';
      for (let yy = yt + 8; yy < HZ + 60; yy += 13) for (let xx = x0 + 6; xx < x0 + w - 8; xx += 10) c.fillRect(xx, yy, 4, 6);
      if (roof) shape(c, [[x0 - 3, yt], [x0 + w + 3, yt], [x0 + w - 8, yt - 12], [x0 + 8, yt - 12]], '#c9775a', { line: 'rgba(31,43,37,.45)', lw: 0.9 });
      if (dome) { c.fillStyle = '#e8e0c8'; c.beginPath(); c.arc(x0 + w / 2, yt, w * 0.28, Math.PI, 0); c.fill(); c.strokeStyle = 'rgba(31,43,37,.5)'; c.stroke(); }
    }
  }, { t: 3.4, d: 1.0, reveal: 'rise' });
  // a row of trees at their feet
  const trees = [];
  for (let x = OX - RX + 10; x < 900; x += r.range(26, 40)) trees.push([x, HZ + 84 + r.range(-6, 6), r.range(18, 28)]);
  p.group('far', { x: OX - RX, y: HZ + 20, w: 700, h: 120 }, (c) => {
    for (const [x, y, s] of trees) {
      c.fillStyle = LEAF_D; c.beginPath(); c.arc(x + 3, y + 2, s, 0, Math.PI * 2); c.fill();
      c.fillStyle = LEAF; c.beginPath(); c.arc(x, y, s * 0.9, 0, Math.PI * 2); c.fill();
      c.fillStyle = LEAF_L; c.beginPath(); c.arc(x - s * 0.3, y - s * 0.35, s * 0.4, 0, Math.PI * 2); c.fill();
    }
    hatch(c, rect(OX - RX, HZ + 40, 900, HZ + 120), 3, 0.8, 'rgba(20,50,30,.2)', 0.8);
  }, { t: 3.9, d: 0.8, reveal: 'rise' });
}

function sea(p, r) {
  const shore = (x) => 1040 + (x - 900) * 0.18; // the line of the beach
  p.group('sea', { x: 880, y: HZ - 2, w: OX + RX - 880, h: 300 }, (c) => {
    const g = c.createLinearGradient(0, HZ, 0, 1160);
    g.addColorStop(0, '#d7a88a'); g.addColorStop(0.15, SEA); g.addColorStop(1, SEA_D);
    c.fillStyle = g;
    c.beginPath(); c.moveTo(880, HZ); c.lineTo(OX + RX, HZ); c.lineTo(OX + RX, shore(OX + RX)); c.lineTo(880, shore(880)); c.closePath(); c.fill();
    // the sun's path on the water
    c.fillStyle = 'rgba(250,190,120,.55)';
    for (let y = HZ + 6; y < 1060; y += 8) { const w = 30 + (y - HZ) * 0.5; c.fillRect(SUN[0] - w / 2, y, w, 2.5); }
    // Galle Face's grass between the beach and the town
    c.fillStyle = GRASS; c.beginPath(); c.moveTo(880, shore(880)); c.lineTo(OX + RX, shore(OX + RX)); c.lineTo(OX + RX, 1300); c.lineTo(880, 1300); c.closePath(); c.fill();
    c.fillStyle = '#efd9a6'; c.beginPath(); c.moveTo(880, shore(880)); c.lineTo(OX + RX, shore(OX + RX)); c.lineTo(OX + RX, shore(OX + RX) + 16); c.lineTo(880, shore(880) + 12); c.closePath(); c.fill();
    hatch(c, [[880, shore(880) + 12], [OX + RX, shore(OX + RX) + 16], [OX + RX, 1300], [880, 1300]], 5, -0.2, 'rgba(36,86,58,.35)', 1);
  }, { t: 3.0, d: 1.2, reveal: 'wipeL', ease: 'inOut' });
  // engraved swell lines
  const waves = [];
  for (let y = HZ + 8; y < 1120; y += 7) {
    const yEnd = y;
    for (let x = 890 + r.range(0, 40); x < OX + RX; x += r.range(40, 90)) {
      if (yEnd > shore(x) - 6) continue;
      const L = 14 + (y - HZ) * 0.15;
      waves.push([[x, y], [x + L * 0.5, y - 1.5], [x + L, y]]);
    }
  }
  p.strokes('sea', waves, 'rgba(20,60,64,.6)', 1.1, { t: 3.6, d: 0.8, reveal: 'fade', box: { x: 880, y: HZ, w: OX + RX - 880, h: 280 } });
  // white surf along the beach
  const surf = [];
  for (let x = 900; x < OX + RX; x += 18) surf.push([[x, shore(x) - 3], [x + 12, shore(x + 12) - 4]]);
  p.strokes('sea', surf, '#fbf5e6', 2.2, { t: 4.0, d: 0.7, reveal: 'wipeL' });
  // a steamer on the horizon
  p.group('sea', { x: 960, y: HZ - 40, w: 110, h: 50 }, (c) => {
    shape(c, [[970, HZ - 6], [1060, HZ - 6], [1052, HZ + 4], [978, HZ + 4]], '#3a3f3a', { line: false });
    shape(c, rect(990, HZ - 14, 1040, HZ - 6), WHITE, { line: INK, lw: 0.8 });
    shape(c, rect(1010, HZ - 28, 1020, HZ - 14), RED_D, { line: INK, lw: 0.8 });
    c.fillStyle = 'rgba(90,90,90,.35)'; c.beginPath(); c.ellipse(1000, HZ - 34, 16, 5, -0.2, 0, Math.PI * 2); c.fill();
  }, { t: 4.3, d: 0.6, reveal: 'fade' });
}

// ================================================================ the Lotus Tower
function lotusTower(p) {
  const x = 1112, top = 382;
  p.group('far', { x: x - 70, y: 260, w: 140, h: 1000 }, (c) => {
    // the shaft
    const shaft = [[x - 26, 1240], [x + 26, 1240], [x + 15, 520], [x - 15, 520]];
    shape(c, shaft, '#7fa58a', { hatch: 3, ang: Math.PI / 2, hc: 'rgba(31,60,45,.25)' });
    c.fillStyle = 'rgba(31,60,45,.28)'; c.fill(); poly(c, [[x + 4, 1240], [x + 26, 1240], [x + 15, 520], [x + 3, 520]]); c.fill();
    // the bud: petals overlapping, widest a third of the way up
    const petal = (dx, w, h, y0, col) => {
      const pts = [];
      for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push([x + dx - w * Math.sin(t * Math.PI) * (1 - t * 0.35), y0 - h * t]); }
      for (let k = 16; k >= 0; k--) { const t = k / 16; pts.push([x + dx + w * Math.sin(t * Math.PI) * (1 - t * 0.35) * 0.4, y0 - h * t]); }
      shape(c, pts, col, { hatch: 3.2, ang: -0.6, hc: 'rgba(60,20,50,.3)', lw: 1.1 });
    };
    petal(-16, 44, 150, 540, '#a04f78');
    for (let k = 0; k < 2; k++) { c.save(); c.translate(2 * x, 0); c.scale(-1, 1); petal(-16, 44, 150, 540, '#8d4169'); c.restore(); }
    petal(0, 30, 165, 545, '#c06b8f');
    // the collar under it
    shape(c, [[x - 30, 548], [x + 30, 548], [x + 22, 530], [x - 22, 530]], '#ccd3c0', { lw: 1 });
    // the mast
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(x, top + 10); c.lineTo(x, top - 110); c.stroke();
    c.lineWidth = 1; c.beginPath(); for (let y = top; y > top - 100; y -= 12) { c.moveTo(x - 5, y); c.lineTo(x + 5, y); } c.stroke();
    c.fillStyle = RED; c.beginPath(); c.arc(x, top - 112, 3, 0, Math.PI * 2); c.fill();
  }, { t: 3.7, d: 1.4, reveal: 'rise', ease: 'out' });
}

// ================================================================ the Red Mosque
const MX0 = 372, MX1 = 812, MB = 1250;
// a wall in candy stripes: red and white bands
function stripes(c, pts, band = 12, y0 = 0) {
  c.save(); poly(c, pts); c.clip();
  c.fillStyle = WHITE; poly(c, pts); c.fill();
  let ya = Infinity, yb = -Infinity, xa = Infinity, xb = -Infinity;
  for (const [x, y] of pts) { ya = Math.min(ya, y); yb = Math.max(yb, y); xa = Math.min(xa, x); xb = Math.max(xb, x); }
  c.fillStyle = RED;
  for (let y = yb - ((yb - y0) % (2 * band)); y > ya - 2 * band; y -= 2 * band) c.fillRect(xa, y - band, xb - xa, band);
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.3; poly(c, pts); c.stroke();
}
// an onion dome on a drum, striped, with a finial
function onion(c, x, y, w, h) {
  const pts = [];
  for (let k = 0; k <= 20; k++) {
    const t = k / 20, a = t * Math.PI;
    const bulge = Math.sin(a) * (1 - 0.35 * t) + (t > 0.8 ? 0 : 0);
    pts.push([x - w * bulge * (t < 0.5 ? 1 : 1 - (t - 0.5) * 0.6), y - h * t]);
  }
  for (let k = 20; k >= 0; k--) { const [px, py] = pts[k]; pts.push([2 * x - px, py]); }
  c.save(); poly(c, pts); c.clip();
  c.fillStyle = WHITE; c.fill();
  c.fillStyle = RED;
  for (let k = -4; k <= 4; k += 2) { c.beginPath(); c.moveTo(x, y - h); c.quadraticCurveTo(x + k * w * 0.22, y - h * 0.4, x + k * w * 0.24, y + 2); c.lineTo(x + (k + 1) * w * 0.24, y + 2); c.quadraticCurveTo(x + (k + 1) * w * 0.22, y - h * 0.4, x, y - h); c.fill(); }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 1.1; poly(c, pts); c.stroke();
  c.beginPath(); c.moveTo(x, y - h); c.lineTo(x, y - h - h * 0.45); c.stroke();
  c.fillStyle = GOLD; c.beginPath(); c.arc(x, y - h - h * 0.22, 2.4, 0, Math.PI * 2); c.fill();
}
// an arch, its opening dark and its ring of alternating red and white stones
function archway(c, x, yb, w, h, dark = '#3b2620') {
  const r0 = w / 2, yt = yb - h + r0;
  const hole = [[x - r0, yb]];
  for (let k = 0; k <= 16; k++) { const a = Math.PI + (k / 16) * Math.PI; hole.push([x + Math.cos(a) * r0, yt + Math.sin(a) * r0 * 1.15 - (k === 8 ? r0 * 0.25 : 0)]); }
  hole.push([x + r0, yb]);
  c.lineWidth = r0 * 0.4; c.lineCap = 'butt';
  for (let k = 0; k < 9; k++) {
    const a0 = Math.PI + (k / 9) * Math.PI, a1 = Math.PI + ((k + 1) / 9) * Math.PI;
    c.strokeStyle = k % 2 ? WHITE : RED;
    c.beginPath(); c.ellipse(x, yt, r0 * 1.2, r0 * 1.36, 0, a0, a1); c.stroke();
  }
  c.fillStyle = dark; poly(c, hole); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1; poly(c, hole); c.stroke();
}

function mosque(p) {
  const T = 4.4;
  // the side wall, receding, in shadow
  p.group('mosque', { x: 320, y: 980, w: 60, h: 280 }, (c) => {
    const side = [[MX0, MB], [MX0 - 44, MB - 22], [MX0 - 44, 1010], [MX0, 1000]];
    stripes(c, side, 12, MB);
    c.fillStyle = 'rgba(40,20,20,.35)'; poly(c, side); c.fill();
    hatch(c, side, 3, Math.PI / 2, 'rgba(31,43,37,.35)', 0.8);
  }, { t: T, d: 0.8, reveal: 'rise' });
  // the front, ground floor and upper floor
  p.group('mosque', { x: MX0 - 4, y: 990, w: MX1 - MX0 + 8, h: MB - 990 + 6 }, (c) => {
    stripes(c, rect(MX0, 1000, MX1, MB), 12, MB);
    // the cornice between the floors
    shape(c, rect(MX0 - 6, 1114, MX1 + 6, 1124), WHITE, { lw: 1 });
    shape(c, rect(MX0 - 8, 992, MX1 + 8, 1004), WHITE, { lw: 1 });
  }, { t: T + 0.3, d: 1.0, reveal: 'rise' });
  // the arcade below, the pointed windows above
  p.group('mosque', { x: MX0, y: 1000, w: MX1 - MX0, h: MB - 1000 }, (c) => {
    for (let k = 0; k < 6; k++) archway(c, MX0 + 42 + k * 71.2, MB, 46, 98);
    for (let k = 0; k < 8; k++) {
      const x = MX0 + 30 + k * 54.3;
      archway(c, x, 1100, 24, 66, '#2f3e3c');
      c.strokeStyle = WHITE; c.lineWidth = 1; c.beginPath(); c.moveTo(x, 1100); c.lineTo(x, 1060); c.moveTo(x - 12, 1080); c.lineTo(x + 12, 1080); c.stroke();
    }
  }, { t: T + 0.9, d: 0.8, reveal: 'wipe' });
  // the parapet's battlements
  p.group('mosque', { x: MX0 - 10, y: 960, w: MX1 - MX0 + 20, h: 40 }, (c) => {
    c.fillStyle = WHITE; c.strokeStyle = INK; c.lineWidth = 1;
    for (let x = MX0 - 6; x < MX1; x += 16) { poly(c, [[x, 994], [x + 10, 994], [x + 10, 982], [x + 5, 975], [x, 982]]); c.fill(); c.stroke(); }
  }, { t: T + 1.3, d: 0.5, reveal: 'rise' });
  // the middle bay: a tower of three stages with the clock and the big dome
  p.group('mosque', { x: 520, y: 760, w: 150, h: 250 }, (c) => {
    stripes(c, rect(540, 880, 646, 1000), 12, MB);
    shape(c, rect(534, 874, 652, 884), WHITE, { lw: 1 });
    // the clock
    c.fillStyle = WHITE; c.beginPath(); c.arc(593, 930, 26, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.lineWidth = 1; c.beginPath();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.moveTo(593 + Math.cos(a) * 21, 930 + Math.sin(a) * 21); c.lineTo(593 + Math.cos(a) * 24, 930 + Math.sin(a) * 24); }
    c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(593, 930); c.lineTo(593, 913); c.moveTo(593, 930); c.lineTo(605, 936); c.stroke();
    archway(c, 593, 996, 30, 40);
    // the drum and the dome
    stripes(c, rect(560, 846, 626, 874), 7, MB);
    onion(c, 593, 846, 40, 70);
  }, { t: T + 1.6, d: 1.0, reveal: 'rise' });
  // the turrets: two tall ones at the corners and four small ones on the parapet
  const tur = [[MX0, 26, 1000, 870], [MX1, 26, 1000, 870], [458, 16, 990, 930], [540, 18, 990, 860], [646, 18, 990, 860], [728, 16, 990, 930]];
  tur.forEach(([x, w, yb, yt], i) => {
    p.group('mosque', { x: x - w - 10, y: yt - 90, w: 2 * w + 20, h: (i < 2 ? MB : yb) - yt + 96 }, (c) => {
      const b = i < 2 ? MB : yb;
      stripes(c, rect(x - w / 2, yt, x + w / 2, b), 9, MB);
      // little arched openings and rings
      c.fillStyle = '#3b2620';
      for (let y = yt + 14; y < b - 30; y += 46) { c.beginPath(); c.moveTo(x - w * 0.18, y + 16); c.lineTo(x - w * 0.18, y + 4); c.arc(x, y + 4, w * 0.18, Math.PI, 0); c.lineTo(x + w * 0.18, y + 16); c.fill(); }
      shape(c, rect(x - w / 2 - 4, yt - 6, x + w / 2 + 4, yt), WHITE, { lw: 1 });
      onion(c, x, yt - 6, w * 0.62, w * 1.7);
    }, { t: T + 2.0 + i * 0.16, d: 0.6, reveal: 'rise' });
  });
}

// ================================================================ the old lighthouse
function lighthouse(p) {
  const x = 930, b = 1200;
  p.group('city', { x: x - 60, y: 690, w: 120, h: b - 690 + 6 }, (c) => {
    const body = [[x - 34, b], [x + 34, b], [x + 28, 850], [x - 28, 850]];
    shape(c, body, WALL);
    shape(c, [[x + 6, b], [x + 34, b], [x + 28, 850], [x + 5, 850]], WALL_D, { hatch: 3, ang: Math.PI / 2, line: false });
    c.strokeStyle = INK; c.lineWidth = 1.3; poly(c, body); c.stroke();
    // string courses and slit windows
    c.beginPath(); for (const y of [1120, 1030, 940]) { c.moveTo(x - 34 + (b - y) * 0.017, y); c.lineTo(x + 34 - (b - y) * 0.017, y); } c.stroke();
    c.fillStyle = '#3b2e28'; for (const y of [1150, 1060, 970, 890]) c.fillRect(x - 5, y, 10, 20);
    // the clock stage
    shape(c, rect(x - 36, 800, x + 36, 852), WALL);
    shape(c, rect(x + 8, 800, x + 36, 852), WALL_D, { hatch: 3, ang: Math.PI / 2 });
    c.fillStyle = WHITE; c.beginPath(); c.arc(x - 8, 826, 17, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
    c.beginPath(); c.moveTo(x - 8, 826); c.lineTo(x - 8, 814); c.moveTo(x - 8, 826); c.lineTo(x, 830); c.stroke();
    // the gallery, the lantern, the cap
    shape(c, rect(x - 42, 792, x + 42, 800), WALL_D, { lw: 1 });
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); for (let xx = x - 40; xx <= x + 40; xx += 6) { c.moveTo(xx, 792); c.lineTo(xx, 780); } c.moveTo(x - 42, 780); c.lineTo(x + 42, 780); c.stroke();
    shape(c, rect(x - 18, 748, x + 18, 792), '#f6d58a');
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); for (const xx of [x - 6, x + 6]) { c.moveTo(xx, 748); c.lineTo(xx, 792); } c.stroke();
    const cap = [];
    for (let k = 0; k <= 12; k++) { const a = Math.PI + (k / 12) * Math.PI; cap.push([x + Math.cos(a) * 22, 748 + Math.sin(a) * 22]); }
    shape(c, cap, '#3d5a52', { hatch: 3, ang: 0.6, hc: 'rgba(255,255,255,.25)' });
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 726); c.lineTo(x, 700); c.stroke();
  }, { t: 6.0, d: 1.2, reveal: 'rise' });
}

// ================================================================ the Old Dutch Hospital
function hospital(p) {
  const x0 = 760, x1 = 1420, b = 1392;
  p.group('city', { x: x0 - 30, y: 1190, w: x1 - x0 + 40, h: b - 1190 + 8 }, (c) => {
    // the upper wall with its shuttered windows
    shape(c, rect(x0, 1270, x1, 1336), WALL, { hatch: 5, ang: 0, hc: 'rgba(31,43,37,.12)' });
    for (let x = x0 + 26; x < x1 - 20; x += 46) {
      shape(c, rect(x, 1284, x + 22, 1324), SHUT, { lw: 1 });
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.beginPath(); for (let y = 1288; y < 1322; y += 4) { c.moveTo(x + 2, y); c.lineTo(x + 20, y); } c.moveTo(x + 11, 1284); c.lineTo(x + 11, 1324); c.stroke();
    }
    // the long hipped roof of half-round tiles
    const roof = [[x0 - 24, 1276], [x1 + 24, 1276], [x1 - 60, 1206], [x0 + 60, 1206]];
    shape(c, roof, ROOF);
    c.save(); poly(c, roof); c.clip();
    c.strokeStyle = ROOF_D; c.lineWidth = 1.2; c.beginPath();
    for (let x = x0 - 30; x < x1 + 30; x += 7) { const k = (x - (x0 + x1) / 2) / ((x1 - x0) / 2); c.moveTo(x, 1276); c.lineTo(x - k * 50, 1206); }
    c.stroke();
    c.strokeStyle = 'rgba(255,220,180,.4)'; c.beginPath(); for (let y = 1270; y > 1206; y -= 9) { c.moveTo(x0 - 30, y); c.lineTo(x1 + 30, y); } c.stroke();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.3; poly(c, roof); c.stroke();
    // the verandah's lean-to roof and its shadow
    const ver = [[x0 - 30, 1352], [x1 + 30, 1352], [x1 + 10, 1334], [x0 - 10, 1334]];
    shape(c, ver, ROOF_D, { hatch: 3, ang: 0.3, hc: 'rgba(0,0,0,.25)' });
    shape(c, rect(x0 - 20, 1352, x1 + 20, b), '#6f6250', { hatch: 3, ang: 0, hc: 'rgba(0,0,0,.3)' });
    // its square pillars
    for (let x = x0 - 14; x <= x1 + 14; x += 40) {
      shape(c, rect(x, 1352, x + 11, b), WHITE, { lw: 1 });
      c.fillStyle = WALL_D; c.fillRect(x + 7, 1352, 4, b - 1352);
    }
    shape(c, rect(x0 - 26, b - 4, x1 + 26, b + 4), WALL_D, { lw: 1 });
  }, { t: 7.2, d: 1.3, reveal: 'rise' });
}

// ================================================================ coconut palms
function palm(c, x, y, lean, h, s = 1) {
  const tx = x + lean, ty = y - h;
  c.strokeStyle = '#6d5a43'; c.lineWidth = 9 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + lean * 0.2, y - h * 0.6, tx, ty); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1;
  c.beginPath();
  for (let k = 1; k < 22; k++) {
    const t = k / 22, px = lerp(lerp(x, x + lean * 0.2, t), lerp(x + lean * 0.2, tx, t), t), py = lerp(lerp(y, y - h * 0.6, t), lerp(y - h * 0.6, ty, t), t);
    c.moveTo(px - 4.5 * s, py); c.lineTo(px + 4.5 * s, py - 2);
  }
  c.stroke();
  // fronds: arcs drooping from the crown, each with its leaflets
  const fr = [-2.9, -2.4, -1.9, -1.35, -0.8, -0.35, 0.15, 3.4, 3.0];
  for (const a0 of fr) {
    const L = (90 + 30 * Math.abs(Math.sin(a0 * 3))) * s;
    const pts = [];
    for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([tx + Math.cos(a0) * L * t, ty + Math.sin(a0) * L * t * 0.6 + t * t * 46 * s]); }
    c.strokeStyle = LEAF_D; c.lineWidth = 2.4 * s; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts) c.lineTo(q[0], q[1]); c.stroke();
    c.lineWidth = 1.6 * s;
    for (let k = 2; k <= 10; k++) {
      const [px, py] = pts[k], ll = (22 - k * 1.3) * s;
      c.strokeStyle = k % 2 ? LEAF : LEAF_D;
      c.beginPath(); c.moveTo(px, py); c.lineTo(px - 4 * s, py + ll); c.moveTo(px, py); c.lineTo(px + 5 * s, py + ll * 0.9); c.stroke();
    }
  }
  c.fillStyle = '#8a6a3a'; for (const [dx, dy] of [[-6, 6], [4, 8], [-1, 12]]) { c.beginPath(); c.arc(tx + dx * s, ty + dy * s, 5 * s, 0, Math.PI * 2); c.fill(); }
}
function palms(p) {
  const list = [[300, 1360, 90, 640, 1.1], [250, 1420, 40, 520, 1], [1300, 1330, -60, 380, 0.9]];
  list.forEach(([x, y, lean, h, s], i) => {
    const xs = [x, x + lean];
    p.group('city', { x: Math.min(...xs) - 150 * s, y: y - h - 80, w: Math.abs(lean) + 300 * s, h: h + 90 }, (c) => palm(c, x, y, lean, h, s), { t: 8.0 + i * 0.2, d: 1.0, reveal: 'rise' });
  });
}

// ================================================================ the street
function street(p, r) {
  const y0 = 1392;
  p.group('front', { x: OX - RX, y: y0, w: 2 * RX, h: OY + RY - y0 }, (c) => {
    c.fillStyle = ROAD; c.fillRect(OX - RX, y0, 2 * RX, OY + RY - y0);
    hatch(c, rect(OX - RX, y0, OX + RX, OY + RY), 6, 0, 'rgba(120,90,50,.25)', 1);
    c.strokeStyle = 'rgba(120,90,50,.5)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(OX - RX, y0 + 20); c.lineTo(OX + RX, y0 + 20); c.stroke();
    // the mosque's forecourt meets the road
    c.fillStyle = '#c9ad7c'; c.fillRect(OX - RX, y0, 2 * RX, 8);
  }, { t: 4.6, d: 0.8, reveal: 'wipe' });
  // the mosque's forecourt, its striped boundary wall and gateposts, and frangipani
  p.group('mosque', { x: OX - RX, y: MB - 4, w: 700, h: y0 - MB + 8 }, (c) => {
    shape(c, rect(OX - RX, MB, 900, y0), '#d8c39b', { hatch: 4, ang: 0, hc: 'rgba(120,90,50,.3)', line: false });
    stripes(c, rect(MX0 - 60, y0 - 46, MX1 + 30, y0), 8, y0);
    for (const x of [MX0 - 60, 520, 666, MX1 + 20]) { stripes(c, rect(x, y0 - 70, x + 14, y0), 8, y0); onion(c, x + 7, y0 - 70, 8, 14); }
    c.fillStyle = '#3b2620'; c.fillRect(534, y0 - 40, 132, 40);
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); for (let x = 540; x < 664; x += 8) { c.moveTo(x, y0 - 40); c.lineTo(x, y0); } c.stroke();
  }, { t: 8.5, d: 0.6, reveal: 'rise' });
  const fr = [[430, 1340, 30], [470, 1330, 26], [745, 1336, 28]];
  p.group('mosque', { x: 380, y: 1280, w: 420, h: 80 }, (c) => {
    for (const [x, y, s] of fr) {
      c.strokeStyle = '#6d5a43'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y + 40); c.lineTo(x, y); c.stroke();
      c.fillStyle = LEAF_D; c.beginPath(); c.ellipse(x, y, s, s * 0.6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = LEAF; c.beginPath(); c.ellipse(x - 3, y - 3, s * 0.8, s * 0.45, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fbf3df';
      for (let k = 0; k < 7; k++) { const a = k * 2.4; c.beginPath(); c.arc(x + Math.cos(a) * s * 0.6, y - 4 + Math.sin(a) * s * 0.3, 3, 0, Math.PI * 2); c.fill(); }
    }
  }, { t: 8.8, d: 0.5, reveal: 'pop' });
  // a bullock cart with its curved thatch
  p.group('front', { x: 440, y: 1380, w: 260, h: 150 }, (c) => cart(c, 560, 1500), { t: 9.0, d: 0.6, reveal: 'drop' });
  // a three-wheeler
  p.group('front', { x: 820, y: 1400, w: 160, h: 140 }, (c) => trike(c, 900, 1512), { t: 9.2, d: 0.6, reveal: 'drop' });
  // people under umbrellas and in sarongs
  const ppl = [[480, 1450], [726, 1440], [770, 1468], [1040, 1452], [1080, 1470], [640, 1560], [980, 1560]];
  const cols = [[WHITE, '#3b6a9a', RED], ['#e9b04c', WHITE, null], [WHITE, '#7a3b52', '#2f4f6b'], ['#d86a3a', WHITE, null], [WHITE, '#2f6b4f', RED_D], ['#c9475a', WHITE, null], [WHITE, '#5a4a8a', '#222']];
  ppl.forEach(([x, y], i) => {
    p.group('front', { x: x - 30, y: y - 90, w: 60, h: 100 }, (c) => walker(c, x, y, cols[i], 64 + (y - 1440) * 0.15), { t: 9.4 + i * 0.1, d: 0.5, reveal: 'pop' });
  });
  // lamp posts, and a hand cart heaped with king coconuts
  p.group('front', { x: 600, y: 1380, w: 600, h: 200 }, (c) => {
    for (const [x, y] of [[690, 1470], [1120, 1460]]) {
      c.strokeStyle = '#2a332e'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 110); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.moveTo(x - 14, y - 100); c.lineTo(x + 14, y - 100); c.stroke();
      for (const dx of [-14, 14]) { shape(c, [[dx + x - 6, y - 100], [dx + x + 6, y - 100], [dx + x + 4, y - 116], [dx + x - 4, y - 116]], '#f6d58a', { lw: 1 }); }
      c.fillStyle = '#2a332e'; c.fillRect(x - 5, y - 4, 10, 6);
    }
    const hx = 1000, hy = 1530;
    shape(c, rect(hx - 40, hy - 26, hx + 30, hy - 14), '#8a6440', { lw: 1 });
    c.strokeStyle = '#5a4030'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(hx + 30, hy - 20); c.lineTo(hx + 64, hy - 30); c.stroke();
    c.strokeStyle = '#4a3424'; c.lineWidth = 2.5; c.beginPath(); c.arc(hx - 10, hy - 8, 9, 0, Math.PI * 2); c.stroke();
    const nuts = [[-34, -32], [-22, -33], [-10, -33], [2, -33], [14, -32], [-28, -42], [-16, -43], [-4, -43], [8, -42], [-20, -52], [-8, -52], [2, -51]];
    for (const [dx, dy] of nuts) { c.fillStyle = '#e8902f'; c.beginPath(); c.arc(hx + dx, hy + dy, 6.5, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#8a4a18'; c.lineWidth = 0.9; c.stroke(); }
  }, { t: 9.9, d: 0.5, reveal: 'pop' });
  // crows on the road
  const crows = [[600, 1580], [628, 1586], [870, 1576], [1110, 1550]];
  p.group('front', { x: 560, y: 1530, w: 600, h: 70 }, (c) => { for (const [x, y] of crows) crow(c, x, y, 1); }, { t: 10.0, d: 0.5, reveal: 'pop' });
}
function crow(c, x, y, s) {
  c.fillStyle = '#1d1d22';
  c.beginPath(); c.ellipse(x, y - 8 * s, 10 * s, 5.5 * s, -0.2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x + 9 * s, y - 13 * s, 4 * s, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(x + 12 * s, y - 14 * s); c.lineTo(x + 18 * s, y - 12 * s); c.lineTo(x + 12 * s, y - 11 * s); c.fill();
  c.beginPath(); c.moveTo(x - 8 * s, y - 9 * s); c.lineTo(x - 18 * s, y - 4 * s); c.lineTo(x - 9 * s, y - 5 * s); c.fill();
  c.fillStyle = '#5a5a62'; c.beginPath(); c.arc(x + 7 * s, y - 13 * s, 2.5 * s, Math.PI * 0.7, Math.PI * 1.6); c.fill();
  c.strokeStyle = '#1d1d22'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(x - 1, y - 4 * s); c.lineTo(x - 2, y); c.moveTo(x + 3, y - 4 * s); c.lineTo(x + 3, y); c.stroke();
}
function walker(c, x, y, [shirt, sarong, umb], h) {
  c.fillStyle = 'rgba(80,60,30,.25)'; c.beginPath(); c.ellipse(x + 6, y, h * 0.22, 4, 0, 0, Math.PI * 2); c.fill();
  shape(c, [[x - h * 0.11, y - h * 0.48], [x + h * 0.11, y - h * 0.48], [x + h * 0.12, y - 2], [x - h * 0.12, y - 2]], sarong, { lw: 0.9, hatch: 3, ang: Math.PI / 2, hc: 'rgba(0,0,0,.18)' });
  shape(c, [[x - h * 0.12, y - h * 0.48], [x + h * 0.12, y - h * 0.48], [x + h * 0.1, y - h * 0.8], [x - h * 0.1, y - h * 0.8]], shirt, { lw: 0.9 });
  c.fillStyle = '#8a5a36'; c.beginPath(); c.arc(x, y - h * 0.88, h * 0.08, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#1d1a18'; c.beginPath(); c.arc(x, y - h * 0.9, h * 0.08, Math.PI, Math.PI * 2); c.fill();
  c.fillStyle = '#8a5a36'; c.fillRect(x - h * 0.08, y - 2, h * 0.06, 3); c.fillRect(x + h * 0.03, y - 2, h * 0.06, 3);
  if (umb) {
    const uy = y - h * 1.1, ur = h * 0.3;
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 3, y - h * 0.62); c.lineTo(x + 3, uy); c.stroke();
    const pts = [[x + 3 - ur, uy + ur * 0.3]];
    for (let k = 0; k <= 10; k++) { const a = Math.PI + (k / 10) * Math.PI; pts.push([x + 3 + Math.cos(a) * ur, uy + ur * 0.3 + Math.sin(a) * ur * 0.75]); }
    shape(c, pts, umb, { lw: 1 });
  }
}
function cart(c, x, y) {
  // the bullock
  const ox = x + 70;
  shape(c, [[ox - 30, y - 50], [ox + 28, y - 52], [ox + 44, y - 64], [ox + 58, y - 56], [ox + 54, y - 40], [ox + 36, y - 38], [ox + 30, y - 22], [ox + 30, y], [ox + 24, y], [ox + 22, y - 22], [ox - 16, y - 22], [ox - 18, y], [ox - 24, y], [ox - 28, y - 26], [ox - 34, y - 40]], '#efe6d2', { hatch: 3.5, ang: 0, hc: 'rgba(31,43,37,.2)', lw: 1.1 });
  shape(c, [[ox - 4, y - 52], [ox + 6, y - 62], [ox + 14, y - 52]], '#efe6d2', { lw: 1 });
  c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ox + 46, y - 64); c.quadraticCurveTo(ox + 44, y - 76, ox + 50, y - 80); c.moveTo(ox + 52, y - 62); c.quadraticCurveTo(ox + 56, y - 74, ox + 62, y - 76); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(ox + 50, y - 56, 1.6, 0, Math.PI * 2); c.fill();
  // the shaft, the wheel, the cart's barrel roof of thatch
  c.strokeStyle = '#5a4030'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 20, y - 34); c.lineTo(ox + 4, y - 50); c.stroke();
  shape(c, rect(x - 80, y - 44, x + 24, y - 28), '#8a6440', { lw: 1 });
  const roof = [[x - 90, y - 44]];
  for (let k = 0; k <= 12; k++) { const a = Math.PI + (k / 12) * Math.PI; roof.push([x - 34 + Math.cos(a) * 64, y - 46 + Math.sin(a) * 44]); }
  roof.push([x + 32, y - 44]);
  shape(c, roof, '#c9a25a', { hatch: 3, ang: Math.PI / 2 - 0.15, hc: 'rgba(90,60,20,.5)', lw: 1.2 });
  c.fillStyle = '#3b2a20'; c.beginPath(); c.ellipse(x + 30, y - 52, 6, 20, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#4a3424'; c.lineWidth = 3; c.beginPath(); c.arc(x - 40, y - 18, 18, 0, Math.PI * 2); c.stroke();
  c.lineWidth = 1.5; c.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.moveTo(x - 40, y - 18); c.lineTo(x - 40 + Math.cos(a) * 18, y - 18 + Math.sin(a) * 18); } c.stroke();
}
function trike(c, x, y) {
  // a three-wheeler: a rounded cab with a canvas top
  const body = [[x - 56, y - 14], [x - 54, y - 62], [x - 44, y - 82], [x + 24, y - 84], [x + 42, y - 66], [x + 52, y - 40], [x + 50, y - 14]];
  shape(c, body, '#2f6b4f', { lw: 1.3 });
  shape(c, [[x - 50, y - 70], [x - 42, y - 86], [x + 26, y - 88], [x + 36, y - 72]], '#1f2b25', { line: false });
  c.fillStyle = '#e8d9b0'; poly(c, [[x - 40, y - 64], [x - 2, y - 64], [x - 2, y - 30], [x - 46, y - 30]]); c.fill();
  c.fillStyle = 'rgba(170,200,200,.8)'; poly(c, [[x + 6, y - 66], [x + 30, y - 66], [x + 40, y - 46], [x + 6, y - 46]]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1; c.stroke();
  c.fillStyle = '#efd48e'; c.beginPath(); c.arc(x + 46, y - 30, 4, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#1d1d22';
  for (const wx of [x - 34, x + 36]) { c.beginPath(); c.arc(wx, y - 8, 11, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#9a9a9a'; for (const wx of [x - 34, x + 36]) { c.beginPath(); c.arc(wx, y - 8, 4, 0, Math.PI * 2); c.fill(); }
}

// ================================================================ the corners
// a tea sprig: two leaves and a bud on a stem, with a flower
function leaf(c, x, y, a, L, wd) {
  c.save(); c.translate(x, y); c.rotate(a);
  const pts = [];
  for (let k = 0; k <= 14; k++) { const t = k / 14; pts.push([t * L, -Math.sin(t * Math.PI) * wd * (1 - 0.3 * t) + (k % 2 ? 0 : -1.5) * Math.sin(t * Math.PI)]); }
  for (let k = 14; k >= 0; k--) { const t = k / 14; pts.push([t * L, Math.sin(t * Math.PI) * wd * (1 - 0.3 * t) + (k % 2 ? 0 : 1.5) * Math.sin(t * Math.PI)]); }
  shape(c, pts, LEAF, { line: GOLD, lw: 1.8 });
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(0, 0); for (let k = 15; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]); c.closePath(); c.fill();
  c.strokeStyle = GOLD_L; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(L * 0.95, 0);
  for (let k = 1; k < 6; k++) { const t = k / 6; c.moveTo(t * L, 0); c.lineTo(t * L + L * 0.1, -wd * 0.6 * Math.sin(t * Math.PI)); c.moveTo(t * L, 0); c.lineTo(t * L + L * 0.1, wd * 0.6 * Math.sin(t * Math.PI)); }
  c.stroke();
  c.restore();
}
function sprig(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, 1);
  c.strokeStyle = GOLD; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(60, -30, 130, -40); c.stroke();
  leaf(c, 20, -8, 0.9, 110, 30);
  leaf(c, 60, -24, -0.75, 120, 34);
  leaf(c, 100, -35, 0.35, 90, 24);
  leaf(c, 128, -40, -0.3, 60, 12);
  // a white tea flower with its gold heart
  c.fillStyle = '#f7f0dc';
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; c.beginPath(); c.ellipse(30 + Math.cos(a) * 11, 42 + Math.sin(a) * 11, 10, 7, a, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = GOLD_L; c.beginPath(); c.arc(30, 42, 7, 0, Math.PI * 2); c.fill();
  c.fillStyle = GOLD_D; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.fillRect(30 + Math.cos(a) * 4 - 1, 42 + Math.sin(a) * 4 - 1, 2, 2); }
  c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(20, -6); c.quadraticCurveTo(26, 14, 30, 32); c.stroke();
  c.restore();
}
// an elephant, facing right, its feet at (x, y)
const ELE = [[10, -112], [30, -134], [62, -146], [100, -146], [126, -140], [146, -152], [170, -154], [190, -140], [200, -116], [204, -86], [208, -50], [210, -20], [218, -6], [228, -10], [226, -18], [218, -16], [212, -48], [198, -82], [190, -88], [180, -84], [172, -74], [168, -40], [168, 0], [146, 0], [146, -36], [136, -52], [80, -54], [66, -40], [64, 0], [42, 0], [40, -40], [24, -60], [12, -84]];
function elephant(c, x, y, s, dir) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  // the far legs, darker
  shape(c, [[130, -50], [150, -50], [152, 0], [134, 0]], GOLD_D, { line: GOLD_DD, lw: 1.2 });
  shape(c, [[50, -50], [74, -50], [76, 0], [56, 0]], GOLD_D, { line: GOLD_DD, lw: 1.2 });
  const g = c.createLinearGradient(0, -150, 0, 0);
  g.addColorStop(0, GOLD_L); g.addColorStop(0.5, GOLD); g.addColorStop(1, GOLD_D);
  c.fillStyle = g; poly(c, ELE); c.fill();
  hatch(c, ELE, 4, 0.1, 'rgba(90,61,18,.35)', 1);
  c.strokeStyle = GOLD_DD; c.lineWidth = 2; poly(c, ELE); c.stroke();
  // the ear, a tusk, the eye, the creases of the trunk, the tail
  const ear = [[140, -128], [160, -126], [164, -100], [156, -78], [140, -84], [134, -104]];
  shape(c, ear, GOLD, { line: GOLD_DD, lw: 1.6, hatch: 3, ang: 1.2, hc: 'rgba(90,61,18,.4)' });
  c.fillStyle = '#fbf3dc'; poly(c, [[184, -84], [200, -72], [206, -60], [196, -68], [182, -78]]); c.fill();
  c.strokeStyle = GOLD_DD; c.lineWidth = 1; c.stroke();
  c.fillStyle = GOLD_DD; c.beginPath(); c.arc(176, -118, 2.6, 0, Math.PI * 2); c.fill();
  c.strokeStyle = GOLD_DD; c.lineWidth = 1.2; c.beginPath();
  for (let k = 0; k < 7; k++) { const yy = -96 + k * 11; c.moveTo(200 + k * 0.6, yy); c.lineTo(208 + k * 0.4, yy + 2); }
  c.moveTo(12, -96); c.quadraticCurveTo(0, -70, 4, -46); c.stroke();
  c.restore();
}
function corners(p) {
  const tl = [[150, 150, 1], [W - 150, 150, -1]];
  tl.forEach(([x, y, s], i) => {
    p.group('corners', { x: s > 0 ? x - 40 : x - 210, y: y - 120, w: 250, h: 230 }, (c) => sprig(c, x, y + 50, s), { t: 9.0 + i * 0.25, d: 0.9, reveal: 'pop' });
  });
  [[118, 1600, 1], [W - 118, 1600, -1]].forEach(([x, y, dir], i) => {
    p.group('corners', { x: dir > 0 ? x - 10 : x - 240, y: y - 180, w: 250, h: 190 }, (c) => {
      // the little ground it stands on
      c.strokeStyle = GOLD; c.lineWidth = 3; c.beginPath(); c.moveTo(x - dir * 4, y + 2); c.lineTo(x + dir * 235, y + 2); c.stroke();
      elephant(c, x, y, 1.0, dir);
    }, { t: 9.5 + i * 0.25, d: 0.9, reveal: 'rise' });
  });
  // the red ribbon over the top of the oval
  p.group('corners', { x: 430, y: 112, w: 740, h: 110 }, (c) => {
    const y0 = 138, y1 = 196;
    // the tails, folded behind
    for (const s of [-1, 1]) {
      const xa = OX + s * 270, xb = OX + s * 360;
      shape(c, [[xa, y0 + 16], [xb, y0 + 16], [xb - s * 24, (y0 + y1) / 2 + 16], [xb, y1 + 16], [xa, y1 + 16]], RIB_D, { line: GOLD, lw: 2 });
      shape(c, [[xa, y1], [xa + s * 6, y1 + 16], [xa, y1 + 16]], '#4a100c', { line: false });
    }
    const band = [];
    for (let k = 0; k <= 20; k++) { const t = k / 20, x = lerp(OX - 280, OX + 280, t); band.push([x, y0 + Math.sin(t * Math.PI) * -10]); }
    for (let k = 20; k >= 0; k--) { const t = k / 20, x = lerp(OX - 280, OX + 280, t); band.push([x, y1 + Math.sin(t * Math.PI) * -10]); }
    shape(c, band, RIB, { line: GOLD, lw: 2.5 });
    c.strokeStyle = GOLD_L; c.lineWidth = 1; c.beginPath();
    for (const dy of [6, y1 - y0 - 6]) { for (let k = 0; k <= 20; k++) { const t = k / 20, x = lerp(OX - 274, OX + 274, t), yy = y0 + dy - Math.sin(t * Math.PI) * 10; k ? c.lineTo(x, yy) : c.moveTo(x, yy); } }
    c.stroke();
  }, { t: 9.8, d: 0.8, reveal: 'iris' });
}

// ================================================================ what moves
function life(p, r) {
  // kites over Galle Face, on long strings from the green
  const kites = [[1170, 700, '#d8402e', 0], [1300, 760, '#f0c040', 1.7], [1060, 640, '#3d6fa8', 3.1]];
  p.live('live', {
    t: 10.2, d: 1.0, reveal: 'fade', box: { x: OX - RX, y: OY - RY, w: 2 * RX, h: 2 * RY },
    draw: (c, time) => {
      for (const [x0, y0, col, ph] of kites) {
        const x = x0 + Math.sin(time * 0.7 + ph) * 14, y = y0 + Math.sin(time * 1.1 + ph) * 8, a = Math.sin(time * 0.9 + ph) * 0.2;
        c.strokeStyle = 'rgba(31,43,37,.55)'; c.lineWidth = 0.9;
        c.beginPath(); c.moveTo(x, y + 18); c.quadraticCurveTo(x - 20, y + 200, x0 - 60, 1180); c.stroke();
        c.save(); c.translate(x, y); c.rotate(a);
        c.fillStyle = col; c.beginPath(); c.moveTo(0, -20); c.lineTo(14, 0); c.lineTo(0, 22); c.lineTo(-14, 0); c.closePath(); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); c.beginPath(); c.moveTo(0, -20); c.lineTo(0, 22); c.moveTo(-14, 0); c.lineTo(14, 0); c.stroke();
        c.strokeStyle = col; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, 22);
        for (let k = 1; k <= 6; k++) c.lineTo(Math.sin(time * 3 + k + ph) * 6, 22 + k * 9);
        c.stroke();
        c.restore();
      }
    },
  });
  // outrigger canoes, rocking, their sails square
  p.live('live', {
    t: 10.0, d: 1.0, reveal: 'fade', box: { x: 880, y: HZ - 60, w: OX + RX - 880, h: 200 },
    draw: (c, time) => {
      [[1060, 950, 1, 0], [1250, 1005, 1.2, 2]].forEach(([x, y, s, ph]) => {
        const bob = Math.sin(time * 1.4 + ph) * 1.5, tilt = Math.sin(time * 1.1 + ph) * 0.04;
        c.save(); c.translate(x, y + bob); c.rotate(tilt); c.scale(s, s);
        c.fillStyle = '#4a3424'; c.beginPath(); c.moveTo(-30, -4); c.lineTo(32, -4); c.lineTo(24, 3); c.lineTo(-24, 3); c.closePath(); c.fill();
        c.strokeStyle = '#4a3424'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-10, -4); c.lineTo(-10, 10); c.moveTo(12, -4); c.lineTo(12, 10); c.moveTo(-16, 10); c.lineTo(18, 10); c.stroke();
        c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, -4); c.lineTo(-2, -48); c.stroke();
        c.fillStyle = '#f2e2bf'; c.beginPath(); c.moveTo(-2, -46); c.lineTo(22, -40); c.lineTo(24, -10); c.lineTo(-1, -8); c.closePath(); c.fill();
        c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
        c.restore();
      });
    },
  });
  // the sun's glitter on the sea
  const gl = [];
  for (let i = 0; i < 26; i++) gl.push([SUN[0] + r.range(-90, 90) * (0.3 + i / 26), r.range(HZ + 8, 1060), r.range(0, 6.28), r.range(6, 14)]);
  p.live('live', {
    t: 10.4, d: 1.0, reveal: 'fade', box: { x: 880, y: HZ, w: OX + RX - 880, h: 220 },
    draw: (c, time) => {
      c.fillStyle = '#fff1cc';
      for (const [x, y, ph, L] of gl) { const a = Math.sin(time * 1.6 + ph); if (a < 0.2) continue; c.globalAlpha = a; c.fillRect(x - L / 2, y, L, 1.8); }
      c.globalAlpha = 1;
    },
  });
  // crows wheeling over the mosque
  p.live('live', {
    t: 10.6, d: 1.0, reveal: 'fade', box: { x: OX - RX, y: OY - RY, w: 2 * RX, h: 700 },
    draw: (c, time) => {
      c.strokeStyle = '#1d1d22'; c.lineWidth = 2.2; c.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        const a = time * 0.35 + k * 1.6, x = 600 + Math.cos(a) * (160 + k * 20), y = 640 + Math.sin(a) * 50 + k * 18;
        const f = Math.sin(time * 6 + k * 2) * 5;
        c.beginPath(); c.moveTo(x - 10, y - f); c.quadraticCurveTo(x - 4, y - 4, x, y); c.quadraticCurveTo(x + 4, y - 4, x + 10, y - f); c.stroke();
      }
    },
  });
}

// ================================================================ the title
function title(p) {
  p.type('title', 'SRI LANKA', OX, 180, { family: F, size: 38, color: GOLD_L, align: 'center', track: 0.3, t: 10.3, gap: 0.07, d: 0.5 });
  // the name, in gold with a dark green shadow, under a hairline
  p.group('title', { x: 200, y: 1622, w: 1200, h: 20 }, (c) => {
    c.strokeStyle = GOLD; c.lineWidth = 2;
    c.beginPath(); c.moveTo(OX - 300, 1632); c.lineTo(OX + 300, 1632); c.stroke();
    c.fillStyle = GOLD_L; star(c, OX, 1632, 8);
  }, { t: 10.6, d: 0.7, reveal: 'iris' });
  p.type('title', 'COLOMBO', OX, 1810, { family: F, size: 196, color: GOLD, shadow: LABEL_D, sx: 5, sy: 6, stroke: GOLD_DD, lw: 1.6, align: 'center', track: 0.06, t: 10.9, gap: 0.14, d: 0.8 });
  p.type('title', 'PEARL OF THE INDIAN OCEAN', OX, 1874, { family: F, size: 30, color: '#e8dcc0', align: 'center', track: 0.24, t: 12.2, gap: 0.035, d: 0.4, reveal: 'fade' });
  p.group('title', { x: 150, y: 1850, w: 1300, h: 40 }, (c) => {
    c.fillStyle = GOLD;
    for (const s of [-1, 1]) {
      const x = OX + s * 420;
      c.beginPath(); c.moveTo(x - s * 0, 1864); c.lineTo(x + s * 120, 1864); c.lineWidth = 1.5; c.strokeStyle = GOLD; c.stroke();
      star(c, x + s * 132, 1864, 7);
    }
  }, { t: 13.0, d: 0.6, reveal: 'fade' });
}
