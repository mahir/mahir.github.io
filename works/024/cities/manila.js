// Manila: a jeepney, head on, painted the way the jeepney shops paint them. The
// sign painter's sunset fills the sky in hard bands over Manila Bay, with the
// Mariveles hills far off, bancas on the water and the walls of Intramuros, the
// dome and belfry of the Manila Cathedral and San Agustin Church on the left.
// The jeepney stands on the boulevard in front of it all: a route board on its
// roof, the name MANILA painted on its visor in chrome-inline letters, chrome
// horses on the hood, a grille of chrome bars, mirrors on long stalks, antennas
// with streamers and a bumper full of lamps, pinstriped everywhere.

import { Plate, W, H } from '../print.js';
import { mix, shade, lerp } from '../kit.js';

// the shop's paint
const SKY = ['#0b4a5e', '#0f6a78', '#1a8c8e', '#3fae9e', '#8ccaa2', '#d6e3a0', '#ffe08a', '#ffbf4f'];
const SUN = '#fff0a8', SUN_R = '#ffb03b';
const SEA = '#0f5866', SEA_L = '#ffd27a', SEA_D = '#0a3a48', HILLS = '#2c6a72', HILLS_D = '#22545c';
const ADOBE = '#9a5f4f', ADOBE_L = '#c98262', ADOBE_D = '#5c3445', MOSS = '#4f6b45';
const DOME = '#5fa596', DOME_D = '#3c7468', DOME_L = '#9fd6c1';
const ROAD = '#24343c', ROAD_L = '#46585c', WALK = '#c9a27a', WALK_D = '#9a7a5c';
const INK = '#14202a';
const RED = '#e3204f', RED_D = '#a3123a', BLUE = '#1f4fb4', BLUE_D = '#13307a';
const YEL = '#ffcc2e', YEL_D = '#d99a12', PINK = '#ff5fae', CYAN = '#38d1e0', GREEN = '#2fb36a', CREAM = '#fff6df';
const PALM = '#1f5a3e', PALM_L = '#3f8a4c', TRUNK = '#5a3a3c';

const FACE = '"Bungee Inline", sans-serif', SIGN = '"Bungee", sans-serif';

export const city = {
  id: 'manila', name: 'Manila', wall: '#24163a',
  alt: 'A jeepney seen head on, painted in the jeepney shops\' manner: a route board on its roof, the name MANILA on its blue visor in chrome-inline letters, chrome horses on the hood, a chrome grille, round headlamps, mirrors on long stalks, antennas with streamers and a bumper of colored lamps with MAYNILA on its plate, on the bay boulevard under a sky painted in bands from teal to gold, all in a pinstriped edge, with the walls of Intramuros, the dome and belfry of the Manila Cathedral and San Agustin Church on the left, and on the right the sun setting over Manila Bay with bancas, the Mariveles hills and coconut palms',
  google: 'family=Bungee+Inline&family=Bungee',
  fonts: [['400 200px "Bungee Inline"', 'MANILA'], ['400 40px "Bungee"', 'QUIAPO · INTRAMUROS · BACLARAN MAYNILA']],
  build,
};

const HZ = 600; // the bay's horizon
const VX = 800; // the road's vanishing point
const SUNX = 1300;

function build() {
  const p = new Plate({ paper: '#f4e4c6', seed: 1571 });
  const r = p.r;
  p.stack('sky', 'far', 'sea', 'shore', 'road', 'shadow', 'body', 'front', 'chrome', 'horses', 'stripes', 'title', 'lamps', 'edge');
  sky(p, r);
  far(p, r);
  sea(p, r);
  shore(p, r);
  road(p, r);
  dashes(p);
  jeep(p, r);
  horses(p, r);
  fittings(p, r);
  title(p, r);
  lamps(p, r);
  edge(p, r);
  return p;
}

// ---------------------------------------------------------------- helpers
function path(c, pts, close = true) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  if (close) c.closePath();
}
function ink(c, fill, line, lw = 3) {
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (line) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
}
function rr(c, x, y, w, h, rad) { c.beginPath(); c.roundRect(x, y, w, h, rad); }
// polished chrome: the sunset and the road caught in bands
function chrome(c, y0, y1, warm = 0) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, mix('#ffffff', '#ffd8b0', warm));
  g.addColorStop(0.3, mix('#c8cfe0', '#ffd08a', warm));
  g.addColorStop(0.47, '#2f4a56');
  g.addColorStop(0.53, '#6f9aa0');
  g.addColorStop(0.7, '#f4f6fb');
  g.addColorStop(1, '#6f8a94');
  return g;
}
const box = (x0, y0, x1, y1, pad = 8) => ({ x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad });

// ---------------------------------------------------------------- the sky: the sign painter's sunset, band by band
const BANDS = [0, 120, 225, 315, 395, 460, 515, 562, HZ];
function sky(p, r) {
  for (let i = 0; i < SKY.length; i++) {
    const y0 = BANDS[i], y1 = BANDS[i + 1] + 2;
    // each band's lower edge is a slow scallop, as a brush lays it
    const edge = [];
    for (let x = 0; x <= W; x += 40) edge.push([x, y1 + (i < SKY.length - 1 ? Math.sin(x / 140 + i * 1.7) * 6 : 0)]);
    p.group('sky', box(0, y0 - 10, W, y1 + 10, 4), (c) => {
      c.beginPath(); c.moveTo(0, y0 - 8); c.lineTo(W, y0 - 8);
      for (let k = edge.length - 1; k >= 0; k--) c.lineTo(edge[k][0], edge[k][1]);
      c.closePath(); c.fillStyle = SKY[i]; c.fill();
    }, { t: 0.1 + i * 0.16, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  }
  // the sun on the horizon, with a ring of lighter paint
  p.group('sky', box(SUNX - 190, HZ - 190, SUNX + 190, HZ, 4), (c) => {
    c.save(); c.beginPath(); c.rect(0, 0, W, HZ); c.clip();
    c.fillStyle = mix(SUN_R, SKY[6], 0.4); c.beginPath(); c.arc(SUNX, HZ, 178, 0, Math.PI * 2); c.fill();
    c.fillStyle = SUN_R; c.beginPath(); c.arc(SUNX, HZ, 150, 0, Math.PI * 2); c.fill();
    c.fillStyle = SUN; c.beginPath(); c.arc(SUNX, HZ, 126, 0, Math.PI * 2); c.fill();
    c.restore();
  }, { t: 1.35, d: 1.4, reveal: 'rise', ease: 'out' });
  // clouds: long flat lozenges, lit pink underneath, the way the shops paint them
  const clouds = [[180, 150, 300], [1150, 110, 360], [560, 270, 260], [1420, 330, 220], [90, 410, 200], [900, 440, 300]];
  clouds.forEach(([x, y, w], i) => {
    const puffs = [];
    const n = Math.round(w / 55);
    for (let k = 0; k < n; k++) puffs.push([x - w / 2 + (k + 0.5) * (w / n), y - 8 - Math.sin(((k + 0.5) / n) * Math.PI) * r.range(14, 26), r.range(18, 28)]);
    p.group('sky', box(x - w / 2 - 30, y - 70, x + w / 2 + 30, y + 22), (c) => {
      c.fillStyle = mix(SKY[Math.min(7, 2 + (i % 4))], '#ffffff', 0.7);
      c.beginPath(); c.roundRect(x - w / 2, y - 18, w, 30, 15); c.fill();
      for (const [cx, cy, rad] of puffs) { c.beginPath(); c.arc(cx, cy, rad, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = mix('#ffffff', '#ffd27a', 0.6);
      c.beginPath(); c.roundRect(x - w / 2 + 20, y + 2, w - 40, 10, 5); c.fill();
    }, { t: 1.6 + i * 0.18, d: 1.0, reveal: 'wipe', ease: 'out' });
  });
}

// ---------------------------------------------------------------- far off: the Mariveles hills, Intramuros and its churches
function far(p, r) {
  // the hills of Bataan across the bay
  const hills = [[880, HZ]];
  for (let x = 880; x <= W + 20; x += 20) hills.push([x, HZ - 8 - Math.max(0, Math.sin((x - 880) / 260) * 46 + Math.sin((x - 880) / 77) * 9 + (x > 1300 && x < 1500 ? (1 - Math.abs(x - 1400) / 100) * 34 : 0))]);
  hills.push([W + 20, HZ]);
  p.fill('far', hills, HILLS, { t: 1.9, d: 1.2, reveal: 'rise' });
  p.group('far', box(880, HZ - 100, W, HZ), (c) => {
    // a lighter rim where the low sun catches the ridges
    c.strokeStyle = mix(HILLS, SKY[6], 0.55); c.lineWidth = 3;
    path(c, hills.slice(1, -1), false); c.stroke();
  }, { t: 2.3, d: 0.8, reveal: 'wipe' });

  // the walls of Intramuros: adobe blocks, a bastion and a sentry box
  const WY = 760; // the foot of the wall
  p.group('far', box(0, 560, 700, WY + 20, 10), (c) => {
    // the curtain wall
    c.fillStyle = ADOBE; c.fillRect(0, 640, 700, WY - 640);
    // the bastion's angled face
    path(c, [[150, 610], [330, 610], [380, WY], [100, WY]]); ink(c, ADOBE_L);
    path(c, [[100, WY], [150, 610], [130, 610], [70, WY]]); ink(c, ADOBE_D);
    // the courses of stone
    c.strokeStyle = ADOBE_D; c.lineWidth = 1.6; c.beginPath();
    for (let y = 652; y < WY; y += 13) {
      c.moveTo(0, y); c.lineTo(70 + (y - 610) * 0, y);
      c.moveTo(lerp(150, 100, (y - 610) / 150), y); c.lineTo(lerp(330, 380, (y - 610) / 150), y);
      c.moveTo(lerp(330, 380, (y - 610) / 150) + 4, y); c.lineTo(700, y);
    }
    for (let y = 652, k = 0; y < WY; y += 13, k++) for (let x = (k % 2) * 18; x < 700; x += 36) { c.moveTo(x, y); c.lineTo(x, y + 13); }
    c.stroke();
    // crenels along the top
    c.fillStyle = ADOBE;
    for (let x = 0; x < 700; x += 34) { if (x > 120 && x < 350) continue; c.fillRect(x, 626, 20, 16); }
    c.fillStyle = ADOBE_L; for (let x = 150; x < 330; x += 30) c.fillRect(x, 596, 18, 16);
    // moss in the joints and at the foot
    c.fillStyle = MOSS;
    for (let x = 0; x < 700; x += 23) { const h = 6 + ((x * 37) % 11); c.beginPath(); c.ellipse(x, WY - 2, 16, h, 0, Math.PI, 0); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 2.5; c.strokeRect(-4, 640, 708, WY - 640);
  }, { t: 2.4, d: 1.1, reveal: 'rise' });
  // the garita, the round sentry box on the bastion's point
  p.group('far', box(205, 520, 275, 615), (c) => {
    rr(c, 220, 556, 40, 54, 4); ink(c, ADOBE_L, INK, 2);
    c.fillStyle = INK; rr(c, 234, 570, 12, 22, 6); c.fill();
    path(c, [[212, 558], [240, 524], [268, 558]]); ink(c, ADOBE_D, INK, 2);
    c.fillStyle = ADOBE; c.fillRect(214, 604, 52, 8);
  }, { t: 3.1, d: 0.6, reveal: 'drop' });

  // San Agustin: a plain stone front, a pediment and its one tower, on the right (the left one was taken down after the 1880 earthquakes)
  p.group('far', box(380, 420, 580, 645, 10), (c) => {
    c.fillStyle = '#d7a27a'; c.fillRect(380, 500, 150, 140);
    path(c, [[372, 502], [455, 452], [538, 502]]); ink(c, '#e8b88c', INK, 2.5);
    // the base of the removed tower, on the left
    c.fillStyle = '#c99068'; c.fillRect(366, 560, 20, 80);
    // the standing tower
    c.fillStyle = '#c99068'; c.fillRect(526, 430, 44, 210);
    c.fillStyle = '#e8b88c'; c.fillRect(520, 424, 56, 12); c.fillRect(520, 476, 56, 8);
    c.fillStyle = INK; for (const y of [444, 492]) { rr(c, 538, y, 20, 26, [10, 10, 0, 0]); c.fill(); }
    // the doors and the round window
    rr(c, 438, 580, 34, 60, [17, 17, 0, 0]); c.fill();
    c.beginPath(); c.arc(455, 528, 11, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#b37a58'; for (const x of [384, 416, 494, 518]) c.fillRect(x, 504, 6, 136);
    c.strokeStyle = INK; c.lineWidth = 2.5; c.strokeRect(380, 500, 150, 140); c.strokeRect(526, 430, 44, 210);
  }, { t: 2.8, d: 0.9, reveal: 'rise' });

  // the Manila Cathedral: its front, the drum and green dome, the lantern
  p.group('far', box(560, 220, 760, 650, 12), (c) => {
    const cx = 660;
    // the dome's drum and dome
    c.fillStyle = '#e7c9a0'; c.fillRect(cx - 54, 360, 108, 70);
    c.fillStyle = INK; for (let k = -3; k <= 3; k++) { rr(c, cx + k * 14 - 4, 374, 8, 34, [4, 4, 0, 0]); c.fill(); }
    c.beginPath(); c.moveTo(cx - 64, 362); c.bezierCurveTo(cx - 64, 300, cx - 22, 282, cx, 280); c.bezierCurveTo(cx + 22, 282, cx + 64, 300, cx + 64, 362); c.closePath();
    ink(c, DOME, INK, 2.5);
    c.strokeStyle = DOME_D; c.lineWidth = 2; c.beginPath();
    for (const k of [-0.66, -0.33, 0, 0.33, 0.66]) { c.moveTo(cx + k * 64, 362); c.quadraticCurveTo(cx + k * 44, 300, cx, 282); }
    c.stroke();
    c.strokeStyle = DOME_L; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - 44, 350); c.quadraticCurveTo(cx - 40, 306, cx - 14, 292); c.stroke();
    // the lantern and its cross-less finial ball
    c.fillStyle = '#e7c9a0'; c.fillRect(cx - 12, 256, 24, 26); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(cx - 12, 256, 24, 26);
    path(c, [[cx - 16, 258], [cx, 240], [cx + 16, 258]]); ink(c, DOME, INK, 2);
    c.fillStyle = YEL; c.beginPath(); c.arc(cx, 236, 5, 0, Math.PI * 2); c.fill();
    // the front: a tall gable, the portal and the rose window
    c.fillStyle = '#f0d3a6'; c.fillRect(cx - 80, 470, 160, 175);
    path(c, [[cx - 88, 472], [cx, 410], [cx + 88, 472]]); ink(c, '#f6e0b8', INK, 2.5);
    c.fillStyle = '#d8b386'; c.fillRect(cx - 80, 470, 16, 175); c.fillRect(cx + 64, 470, 16, 175);
    c.fillStyle = INK; rr(c, cx - 22, 570, 44, 75, [22, 22, 0, 0]); c.fill();
    c.beginPath(); c.arc(cx, 515, 20, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#f0d3a6'; c.lineWidth = 2; c.beginPath();
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.moveTo(cx, 515); c.lineTo(cx + Math.cos(a) * 18, 515 + Math.sin(a) * 18); } c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2.5; c.strokeRect(cx - 80, 470, 160, 175);
  }, { t: 3.0, d: 1.2, reveal: 'rise' });
  // the cathedral's belfry, standing apart: four stages and a cupola
  p.group('far', box(750, 270, 840, 650, 10), (c) => {
    const x0 = 760, x1 = 830;
    const stages = [[560, 650, 70], [480, 560, 64], [410, 480, 56], [352, 410, 48]];
    for (const [y0, y1, w] of stages) {
      const cx = (x0 + x1) / 2;
      c.fillStyle = '#e9c99a'; c.fillRect(cx - w / 2, y0, w, y1 - y0);
      c.strokeStyle = INK; c.lineWidth = 2.2; c.strokeRect(cx - w / 2, y0, w, y1 - y0);
      c.fillStyle = '#f6e0b8'; c.fillRect(cx - w / 2 - 5, y0 - 6, w + 10, 8); c.strokeRect(cx - w / 2 - 5, y0 - 6, w + 10, 8);
      c.fillStyle = INK; rr(c, cx - w * 0.16, y0 + 14, w * 0.32, (y1 - y0) * 0.6, [w * 0.16, w * 0.16, 0, 0]); c.fill();
    }
    c.beginPath(); c.moveTo(771, 348); c.quadraticCurveTo(774, 300, 795, 292); c.quadraticCurveTo(816, 300, 819, 348); c.closePath();
    ink(c, DOME, INK, 2);
    c.fillStyle = YEL; c.beginPath(); c.arc(795, 286, 5, 0, Math.PI * 2); c.fill();
  }, { t: 3.3, d: 1.0, reveal: 'rise' });
}

// ---------------------------------------------------------------- the bay: water, the sun's road, bancas
function sea(p, r) {
  p.group('sea', box(560, HZ - 2, W, 1100, 2), (c) => {
    const g = c.createLinearGradient(0, HZ, 0, 1000);
    g.addColorStop(0, '#3f8f8c'); g.addColorStop(0.25, SEA); g.addColorStop(1, SEA_D);
    c.fillStyle = g; c.fillRect(560, HZ, W - 560, 500);
  }, { t: 1.7, d: 1.0, reveal: 'fall' });
  // brush ripples across the water, warm near the sun's road
  const lines = [], warm = [];
  for (let y = HZ + 8; y < 1000; y += 9 + (y - HZ) * 0.04) {
    const n = 7 + Math.round((y - HZ) / 30);
    for (let k = 0; k < n; k++) {
      const x = r.range(700, W + 30), L = r.range(14, 46) * (1 + (y - HZ) / 300);
      const near = Math.abs(x - SUNX) < 120 + (y - HZ) * 0.5;
      (near ? warm : lines).push([[x - L / 2, y], [x + L / 2, y]]);
    }
  }
  p.strokes('sea', lines, mix(SEA, '#8fe0d0', 0.4), 2.2, { t: 2.2, d: 1.2, reveal: 'fall', box: box(560, HZ, W, 1000) });
  p.strokes('sea', warm, SEA_L, 2.6, { t: 2.5, d: 1.2, reveal: 'fall', box: box(560, HZ, W, 1000) });
  // the sun's road, glittering
  const glints = [];
  for (let i = 0; i < 46; i++) {
    const y = HZ + 6 + (i * 7.3) % 330, spread = 30 + (y - HZ) * 0.42;
    glints.push([SUNX + r.range(-spread, spread), y, r.range(10, 34), r() * 6.28]);
  }
  p.live('sea', {
    t: 3.0, d: 1, box: box(SUNX - 200, HZ, SUNX + 200, 960),
    draw: (c, time) => {
      c.fillStyle = SUN;
      for (const [x, y, L, ph] of glints) {
        const a = 0.5 + 0.5 * Math.sin(time * 2.2 + ph);
        if (a < 0.25) continue;
        c.globalAlpha = a; c.fillRect(x - L * a / 2, y, L * a, 3);
      }
      c.globalAlpha = 1;
    },
  });
  // bancas: outrigger boats, a sail or two
  const bancas = [[1460, 680, 1.0, RED], [1120, 640, 0.65, YEL], [960, 625, 0.5, CYAN], [1540, 760, 1.3, GREEN]];
  bancas.forEach(([x, y, s, col], i) => {
    p.group('sea', box(x - 90 * s, y - 90 * s, x + 90 * s, y + 16 * s), (c) => banca(c, x, y, s, col, i % 2 === 0), { t: 3.4 + i * 0.25, d: 0.8, reveal: 'drop' });
  });
}
function banca(c, x, y, s, col, sail) {
  c.lineJoin = 'round';
  // the outriggers, long bamboo floats either side
  c.strokeStyle = INK; c.lineWidth = 2 * s;
  c.beginPath(); c.moveTo(x - 70 * s, y + 6 * s); c.lineTo(x + 70 * s, y + 6 * s); c.stroke();
  c.beginPath(); c.moveTo(x - 30 * s, y - 2 * s); c.lineTo(x - 50 * s, y + 6 * s); c.moveTo(x + 30 * s, y - 2 * s); c.lineTo(x + 50 * s, y + 6 * s); c.stroke();
  // the slim hull
  path(c, [[x - 48 * s, y - 10 * s], [x + 50 * s, y - 10 * s], [x + 36 * s, y + 2 * s], [x - 36 * s, y + 2 * s]]);
  ink(c, col, INK, 2 * s);
  c.fillStyle = CREAM; c.fillRect(x - 40 * s, y - 8 * s, 80 * s, 3 * s);
  if (sail) {
    path(c, [[x, y - 80 * s], [x, y - 14 * s], [x + 40 * s, y - 14 * s]]); ink(c, CREAM, INK, 1.8 * s);
    c.strokeStyle = INK; c.beginPath(); c.moveTo(x, y - 84 * s); c.lineTo(x, y - 10 * s); c.stroke();
  } else {
    // a fisherman, sitting
    c.fillStyle = INK; c.beginPath(); c.arc(x - 8 * s, y - 22 * s, 5 * s, 0, 7); c.fill(); c.fillRect(x - 12 * s, y - 18 * s, 8 * s, 9 * s);
    path(c, [[x - 18 * s, y - 25 * s], [x - 8 * s, y - 32 * s], [x + 2 * s, y - 25 * s]]); ink(c, YEL);
  }
}

// ---------------------------------------------------------------- the boulevard's edges: the sea wall, lamps, palms, people
function shore(p, r) {
  // the sea wall on the right, a balustrade running toward the vanishing point
  const sw = (x) => HZ + 50 + (x - 900) * 0.42; // its top edge
  p.group('shore', box(860, HZ + 30, W, 1460), (c) => {
    path(c, [[880, sw(880)], [W + 10, sw(W + 10)], [W + 10, sw(W + 10) + 60], [880, sw(880) + 10]]);
    ink(c, WALK, INK, 2);
    path(c, [[880, sw(880) + 10], [W + 10, sw(W + 10) + 60], [W + 10, 1450], [880, 1450]]); ink(c, WALK_D);
    // the balusters, growing as they come near
    c.fillStyle = CREAM; c.strokeStyle = INK; c.lineWidth = 1.2;
    for (let x = 900; x < W; x += 6 + (x - 900) * 0.05) {
      const h = 10 + (x - 900) * 0.07, w = 2 + (x - 900) * 0.012, y = sw(x);
      c.fillRect(x, y - h, w, h);
    }
    c.fillStyle = CREAM; path(c, [[890, sw(890) - 12], [W + 10, sw(W + 10) - 60], [W + 10, sw(W + 10) - 50], [890, sw(890) - 9]]); c.fill();
  }, { t: 3.6, d: 1.0, reveal: 'wipe' });
  // the left side: a lawn below the walls and the curb
  p.group('shore', box(0, 760, 760, 1320), (c) => {
    path(c, [[0, 760], [720, 760], [700, 640 + 140], [0, 1150]]); ink(c, '#4c7a4a');
    c.strokeStyle = '#3c6440'; c.lineWidth = 2; c.beginPath();
    for (let k = 0; k < 60; k++) { const x = (k * 97) % 700, y = 770 + ((k * 53) % 300); if (y > 760 + (720 - x) * 0.55) continue; c.moveTo(x, y); c.lineTo(x + 4, y - 7); c.moveTo(x + 6, y); c.lineTo(x + 8, y - 8); }
    c.stroke();
    path(c, [[0, 1150], [710, 772], [720, 790], [0, 1200]]); ink(c, WALK, INK, 2);
  }, { t: 3.4, d: 1.0, reveal: 'wipeL' });
  // the boulevard's lamps: the old twin-globe posts
  const lamps = [[70, 1180, 1.25], [1520, 1180, 1.25], [1180, 820, 0.55], [1350, 900, 0.8]];
  lamps.forEach(([x, y, s], i) => {
    p.group('shore', box(x - 50 * s, y - 330 * s, x + 50 * s, y + 6), (c) => {
      c.fillStyle = INK; c.fillRect(x - 4 * s, y - 300 * s, 8 * s, 300 * s);
      c.fillRect(x - 12 * s, y - 30 * s, 24 * s, 30 * s);
      c.strokeStyle = INK; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(x - 34 * s, y - 280 * s); c.quadraticCurveTo(x, y - 320 * s, x + 34 * s, y - 280 * s); c.stroke();
      for (const dx of [-34, 34]) { c.fillStyle = CREAM; c.beginPath(); c.arc(x + dx * s, y - 266 * s, 13 * s, 0, 7); c.fill(); c.lineWidth = 2; c.stroke(); }
    }, { t: 3.9 + i * 0.15, d: 0.7, reveal: 'rise' });
  });
  // coconut palms on the right, leaning over the bay
  palm(p, r, 1470, 1050, 1.25, 4.2, -0.2);
  palm(p, r, 1590, 1120, 1.45, 4.45, 0.12);
  palm(p, r, 1160, 760, 0.62, 4.6, -0.1);
  palm(p, r, 30, 1000, 1.1, 4.7, 0.18);
  // strollers on the sea wall and the lawn, small and dark against the light
  const folk = [];
  for (let i = 0; i < 9; i++) {
    const x = i < 5 ? 930 + i * 80 + r.range(-20, 20) : 380 + (i - 5) * 70;
    const y = i < 5 ? HZ + 48 + (x - 900) * 0.42 : 820 + (i - 5) * 6;
    folk.push([x, y, (i < 5 ? 0.5 + (x - 900) * 0.0015 : 0.55), r.pick([RED, YEL, CYAN, PINK, CREAM, GREEN])]);
  }
  p.group('shore', box(360, HZ + 10, 1400, 900), (c) => {
    for (const [x, y, s, col] of folk) {
      c.fillStyle = INK; c.beginPath(); c.arc(x, y - 44 * s, 6 * s, 0, 7); c.fill();
      c.fillStyle = col; rr(c, x - 7 * s, y - 37 * s, 14 * s, 22 * s, 4 * s); c.fill();
      c.fillStyle = INK; c.fillRect(x - 6 * s, y - 16 * s, 5 * s, 16 * s); c.fillRect(x + 1 * s, y - 16 * s, 5 * s, 16 * s);
    }
  }, { t: 5.0, d: 0.8, reveal: 'fade' });
}
function palm(p, r, x, y, s, t, lean) {
  // the trunk: a long curve of rings
  const top = [x + lean * 300 * s, y - 520 * s];
  const ctl = [x + lean * 40 * s, y - 280 * s];
  const pts = [];
  for (let k = 0; k <= 20; k++) {
    const u = k / 20;
    pts.push([(1 - u) * (1 - u) * x + 2 * (1 - u) * u * ctl[0] + u * u * top[0], (1 - u) * (1 - u) * y + 2 * (1 - u) * u * ctl[1] + u * u * top[1]]);
  }
  const fronds = [];
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k - 4) * 0.42 + r.range(-0.1, 0.1);
    const L = r.range(150, 200) * s, droop = r.range(0.5, 0.9);
    fronds.push([a, L, droop]);
  }
  p.group('shore', box(top[0] - 230 * s, top[1] - 160 * s, Math.max(x, top[0]) + 230 * s, y + 6), (c) => {
    c.strokeStyle = TRUNK; c.lineCap = 'round';
    for (let k = 1; k < pts.length; k++) {
      c.lineWidth = (22 - k * 0.5) * s; c.beginPath(); c.moveTo(pts[k - 1][0], pts[k - 1][1]); c.lineTo(pts[k][0], pts[k][1]); c.stroke();
    }
    c.strokeStyle = INK; c.lineWidth = 1.6 * s; c.beginPath();
    for (let k = 1; k < pts.length; k++) { const w = (11 - k * 0.25) * s; c.moveTo(pts[k][0] - w, pts[k][1]); c.lineTo(pts[k][0] + w, pts[k][1] + 2 * s); }
    c.stroke();
    // the fronds: a midrib and leaflets hanging from it
    for (const [a, L, droop] of fronds) {
      const ex = top[0] + Math.cos(a) * L, ey = top[1] + Math.sin(a) * L * 0.55 + L * droop * 0.55;
      const mx = top[0] + Math.cos(a) * L * 0.55, my = top[1] + Math.sin(a) * L * 0.55 - L * 0.12;
      c.strokeStyle = PALM; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(top[0], top[1]); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
      c.lineWidth = 3 * s;
      c.beginPath();
      for (let u = 0.15; u < 1; u += 0.07) {
        const bx = (1 - u) * (1 - u) * top[0] + 2 * (1 - u) * u * mx + u * u * ex;
        const by = (1 - u) * (1 - u) * top[1] + 2 * (1 - u) * u * my + u * u * ey;
        const l = 34 * s * Math.sin(u * Math.PI) + 8 * s;
        c.moveTo(bx, by); c.lineTo(bx - l * 0.45, by + l);
        c.moveTo(bx, by); c.lineTo(bx + l * 0.45, by + l);
      }
      c.stroke();
    }
    c.strokeStyle = PALM_L; c.lineWidth = 2 * s;
    for (const [a, L] of fronds) { c.beginPath(); c.moveTo(top[0], top[1]); c.lineTo(top[0] + Math.cos(a) * L * 0.4, top[1] + Math.sin(a) * L * 0.22 - 8 * s); c.stroke(); }
    // coconuts
    c.fillStyle = '#6a4a2a';
    for (const dx of [-10, 4, 14]) { c.beginPath(); c.arc(top[0] + dx * s, top[1] + 12 * s, 9 * s, 0, 7); c.fill(); }
  }, { t, d: 1.0, reveal: 'rise' });
}

// ---------------------------------------------------------------- the road
function road(p, r) {
  p.group('road', box(0, HZ + 160, W, H, 2), (c) => {
    path(c, [[720, 772], [890, 772], [W + 10, 1420], [W + 10, H], [-10, H], [-10, 1200]]);
    const g = c.createLinearGradient(0, 780, 0, H);
    g.addColorStop(0, ROAD_L); g.addColorStop(1, ROAD);
    c.fillStyle = g; c.fill();
    // the lanes' dashes running away, and the sunset's sheen on the asphalt
    c.strokeStyle = mix(SKY[6], ROAD, 0.5); c.lineWidth = 2;
    c.beginPath();
    for (let y = 800; y < H; y += 14 + (y - 800) * 0.03) { c.moveTo(1200 + (y - 800) * 0.2, y); c.lineTo(1300 + (y - 800) * 0.32, y); }
    c.stroke();
  }, { t: 2.0, d: 1.4, reveal: 'fall', ease: 'inOut' });
}

// the lane dashes stream toward us: the jeepney is on its way
function dashes(p) {
  p.live('road', {
    t: 3.2, d: 0.8, box: box(0, 772, W, H, 0),
    draw: (c, time) => {
      c.fillStyle = mix(CREAM, ROAD, 0.25);
      for (const lane of [-0.45, 0.45]) {
        for (let k = 0; k < 10; k++) {
          const v0 = ((k + time * 0.45) % 10) / 10, v1 = Math.min(1.05, v0 + 0.05);
          const ya = 772 + (H - 772) * v0 * v0, yb = 772 + (H - 772) * v1 * v1;
          const xa = 805 + lane * (ya - 772) * 1.5, xb = 805 + lane * (yb - 772) * 1.5;
          const wa = 1 + (ya - 772) * 0.012, wb = 1 + (yb - 772) * 0.012;
          path(c, [[xa - wa, ya], [xa + wa, ya], [xb + wb, yb], [xb - wb, yb]]); c.fill();
        }
      }
    },
  });
}

// ---------------------------------------------------------------- the jeepney
const J = {
  roof: 690, visor0: 712, visor1: 905, glass1: 1100, cowl: 1150, hoodTop: 1222, grille1: 1470,
  bumper0: 1470, bumper1: 1548, x0: 290, x1: 1310,
};
function jeep(p, r) {
  // its shadow on the road
  p.group('shadow', box(100, 1540, 1500, 1720), (c) => {
    c.fillStyle = 'rgba(8,20,28,.55)'; c.beginPath(); c.ellipse(800, 1630, 700, 58, 0, 0, Math.PI * 2); c.fill();
  }, { t: 4.6, d: 0.8, reveal: 'fade' });

  // the cab: the pillars and the roof, stainless steel
  p.group('body', box(260, J.roof - 10, 1340, J.cowl + 10), (c) => {
    path(c, [[J.x0 - 6, J.visor0], [J.x1 + 6, J.visor0], [J.x1 + 18, J.cowl], [J.x0 - 18, J.cowl]]);
    c.fillStyle = chrome(c, J.visor0, J.cowl, 0.4); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    // the roof's lip
    path(c, [[J.x0 + 10, J.roof], [J.x1 - 10, J.roof], [J.x1 + 22, J.visor0 + 4], [J.x0 - 22, J.visor0 + 4]]);
    c.fillStyle = chrome(c, J.roof, J.visor0 + 4, 0.6); c.fill(); c.stroke();
  }, { t: 4.7, d: 1.0, reveal: 'rise' });
  // the windshield: two panes holding the sunset
  p.group('body', box(300, J.visor1, 1300, J.glass1 + 6), (c) => {
    c.fillStyle = INK; c.fillRect(305, J.visor1 - 2, 990, J.glass1 - J.visor1 + 4);
    for (const [x0, x1] of [[322, 788], [812, 1278]]) {
      rr(c, x0, J.visor1 + 14, x1 - x0, J.glass1 - J.visor1 - 26, 10);
      const g = c.createLinearGradient(0, J.visor1, 0, J.glass1);
      g.addColorStop(0, '#ffd27a'); g.addColorStop(0.35, '#3fae9e'); g.addColorStop(0.75, '#0f5a6e'); g.addColorStop(1, '#0a2a38');
      c.fillStyle = g; c.fill();
      // a slanting streak of light across the glass
      c.save(); c.clip();
      c.fillStyle = 'rgba(255,240,220,.28)';
      path(c, [[x0 + 60, J.visor1], [x0 + 130, J.visor1], [x0 + 40, J.glass1], [x0 - 30, J.glass1]]); c.fill();
      path(c, [[x0 + 160, J.visor1], [x0 + 180, J.visor1], [x0 + 90, J.glass1], [x0 + 70, J.glass1]]); c.fill();
      // the far palms caught in the glass
      c.fillStyle = 'rgba(10,30,40,.6)';
      c.beginPath(); c.ellipse(x0 + (x1 - x0) * 0.75, J.glass1 - 20, 120, 34, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    // the wipers, parked
    c.strokeStyle = INK; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(420, J.glass1 - 14); c.lineTo(700, J.glass1 - 30); c.moveTo(910, J.glass1 - 14); c.lineTo(1190, J.glass1 - 30); c.stroke();
  }, { t: 5.2, d: 0.9, reveal: 'fall' });
  // things hung inside the windshield: tassels and a little fringe, as drivers do
  p.group('body', box(320, J.visor1 + 8, 1280, J.visor1 + 70), (c) => {
    const cols = [RED, YEL, CYAN, PINK, GREEN, CREAM];
    for (let x = 330, k = 0; x < 1272; x += 13, k++) {
      if (x > 780 && x < 820) continue;
      c.fillStyle = cols[k % cols.length];
      path(c, [[x, J.visor1 + 12], [x + 11, J.visor1 + 12], [x + 5.5, J.visor1 + 34 + (k % 3) * 4]]); c.fill();
    }
    for (const x of [560, 1040]) { c.strokeStyle = YEL; c.lineWidth = 2; c.beginPath(); c.moveTo(x, J.visor1 + 12); c.lineTo(x, J.visor1 + 58); c.stroke(); c.fillStyle = RED; c.beginPath(); c.arc(x, J.visor1 + 62, 7, 0, 7); c.fill(); }
  }, { t: 5.8, d: 0.6, reveal: 'fall' });

  // the visor: a painted blue board with a yellow rule
  p.group('front', box(270, J.visor0 - 4, 1330, J.visor1 + 6), (c) => {
    path(c, [[J.x0 - 6, J.visor0 + 4], [J.x1 + 6, J.visor0 + 4], [J.x1 - 8, J.visor1], [J.x0 + 8, J.visor1]]);
    ink(c, BLUE, INK, 3);
    path(c, [[J.x0 + 14, J.visor0 + 18], [J.x1 - 14, J.visor0 + 18], [J.x1 - 24, J.visor1 - 14], [J.x0 + 24, J.visor1 - 14]]);
    ink(c, null, YEL, 4);
    // a darker band under the letters
    c.fillStyle = BLUE_D; c.fillRect(J.x0 + 40, J.visor1 - 56, J.x1 - J.x0 - 80, 30);
  }, { t: 5.5, d: 0.8, reveal: 'wipe', ease: 'inOut' });

  // the cowl and the hood's top, painted red
  p.group('front', box(290, J.glass1 - 4, 1310, J.hoodTop + 6), (c) => {
    path(c, [[300, J.glass1], [1300, J.glass1], [1300, J.cowl], [300, J.cowl]]);
    c.fillStyle = chrome(c, J.glass1, J.cowl, 0.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    path(c, [[505, J.cowl], [1095, J.cowl], [1135, J.hoodTop], [465, J.hoodTop]]);
    ink(c, mix(RED, '#ff8a8a', 0.25), INK, 3);
    // the hood's ribs
    c.strokeStyle = RED_D; c.lineWidth = 2;
    c.beginPath(); for (let k = 1; k < 8; k++) { const u = k / 8; c.moveTo(lerp(505, 1095, u), J.cowl + 4); c.lineTo(lerp(465, 1135, u), J.hoodTop - 4); } c.stroke();
  }, { t: 5.9, d: 0.9, reveal: 'rise' });
  // the hood's face, either side of the grille, with the headlamps
  p.group('front', box(455, J.hoodTop - 4, 1145, J.grille1 + 6), (c) => {
    path(c, [[465, J.hoodTop], [1135, J.hoodTop], [1135, J.grille1], [465, J.grille1]]); ink(c, RED, INK, 3);
    c.fillStyle = RED_D; c.fillRect(465, J.grille1 - 24, 670, 24);
  }, { t: 6.3, d: 0.8, reveal: 'rise' });
  // the fenders, flat and wide, painted yellow
  for (const side of [-1, 1]) {
    const xa = side < 0 ? 205 : 1135, xb = side < 0 ? 465 : 1395;
    p.group('front', box(xa - 10, 1290, xb + 10, 1440), (c) => {
      const outer = side < 0 ? xa : xb, inner = side < 0 ? xb : xa;
      path(c, [[inner, 1312], [outer, 1338], [outer, 1420], [inner, 1408]]); ink(c, YEL, INK, 3);
      path(c, [[inner, 1300], [outer, 1324], [outer, 1338], [inner, 1312]]); ink(c, YEL_D, INK, 2.5);
    }, { t: 6.5 + (side > 0 ? 0.15 : 0), d: 0.7, reveal: side < 0 ? 'wipeL' : 'wipe' });
  }
  // the wheels under the fenders
  p.group('body', box(220, 1380, 1380, 1660), (c) => {
    for (const x of [270, 1180]) {
      rr(c, x, 1390, 150, 250, 30); ink(c, '#221a2a', INK, 3);
      c.strokeStyle = '#3d3448'; c.lineWidth = 3; c.beginPath();
      for (let y = 1410; y < 1630; y += 16) { c.moveTo(x + 14, y); c.lineTo(x + 136, y + 6); } c.stroke();
      c.fillStyle = chrome(c, 1460, 1560); rr(c, x + 40, 1450, 70, 110, 16); c.fill();
    }
  }, { t: 6.4, d: 0.7, reveal: 'rise' });
  // mud flaps behind the wheels, red with a white star and a chrome edge, hanging below the bumper
  for (const x of [255, 1265]) {
    p.group('body', box(x, 1500, x + 80, 1660), (c) => {
      rr(c, x, 1500, 80, 150, 6); ink(c, RED, INK, 2.5);
      star(c, x + 40, 1596, 22); ink(c, CREAM);
      c.fillStyle = chrome(c, 1634, 1646); c.fillRect(x, 1634, 80, 12);
    }, { t: 6.6, d: 0.5, reveal: 'fall' });
  }
}

// the chrome: grille, headlamps, bumper, mirrors, antennas
function fittings(p, r) {
  // the grille: vertical chrome bars drawn one after another
  p.group('chrome', box(590, J.hoodTop + 4, 1010, J.grille1 - 10), (c) => {
    rr(c, 600, J.hoodTop + 18, 400, J.grille1 - J.hoodTop - 46, [60, 60, 8, 8]); ink(c, INK);
    c.save(); c.clip();
    for (let x = 612; x < 996; x += 24) {
      c.fillStyle = chrome(c, J.hoodTop, J.grille1); c.fillRect(x, J.hoodTop + 10, 14, J.grille1 - J.hoodTop);
    }
    c.restore();
    rr(c, 600, J.hoodTop + 18, 400, J.grille1 - J.hoodTop - 46, [60, 60, 8, 8]);
    c.strokeStyle = chrome(c, J.hoodTop, J.grille1, 0.5); c.lineWidth = 10; c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  }, { t: 6.9, d: 1.0, reveal: 'rise' });
  // headlamps in chrome rings, and amber lamps below
  for (const x of [533, 1067]) {
    p.group('chrome', box(x - 62, J.hoodTop + 14, x + 62, J.grille1 - 20), (c) => {
      c.fillStyle = chrome(c, 1250, 1350); c.beginPath(); c.arc(x, 1300, 56, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
      const g = c.createRadialGradient(x - 12, 1288, 4, x, 1300, 44);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#fff1c2'); g.addColorStop(1, '#e0b56a');
      c.fillStyle = g; c.beginPath(); c.arc(x, 1300, 42, 0, 7); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(180,130,60,.5)'; c.lineWidth = 1.5; c.beginPath();
      for (let k = -30; k <= 30; k += 10) { c.moveTo(x + k, 1262); c.lineTo(x + k, 1338); } c.stroke();
      c.fillStyle = '#ff9d2e'; rr(c, x - 30, 1380, 60, 26, 10); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }, { t: 7.3 + (x > 800 ? 0.15 : 0), d: 0.6, reveal: 'pop', ease: 'back' });
  }
  // the bumper: a long chrome bar with guards rising at its ends
  p.group('chrome', box(150, J.bumper0 - 50, 1450, J.bumper1 + 8), (c) => {
    path(c, [[165, J.bumper0], [1435, J.bumper0], [1450, J.bumper1], [150, J.bumper1]]);
    c.fillStyle = chrome(c, J.bumper0, J.bumper1, 0.5); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    for (const x of [200, 600, 960, 1360]) { rr(c, x, J.bumper0 - 44, 40, 60, [12, 12, 0, 0]); c.fillStyle = chrome(c, J.bumper0 - 44, J.bumper0 + 16, 0.4); c.fill(); c.stroke(); }
    // the plate, painted with stars and stripes of color, no number
    rr(c, 700, J.bumper0 + 8, 200, 60, 6); ink(c, CREAM, INK, 2.5);
    c.fillStyle = RED; c.fillRect(708, J.bumper0 + 14, 184, 4); c.fillRect(708, J.bumper0 + 58, 184, 4);
    c.font = `400 30px ${SIGN}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = BLUE; c.fillText('MAYNILA', 800, J.bumper0 + 40);
  }, { t: 7.6, d: 0.7, reveal: 'drop', dy: 40 });
  // mirrors on long stalks, two a side
  for (const side of [-1, 1]) {
    const bx = side < 0 ? J.x0 : J.x1;
    const m = [[bx + side * 120, 930, 38], [bx + side * 175, 1160, 30]];
    p.group('chrome', box(Math.min(bx, bx + side * 220) - 10, 880, Math.max(bx, bx + side * 220) + 10, 1210), (c) => {
      c.strokeStyle = INK; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(bx, 1010); c.lineTo(m[0][0], m[0][1]); c.moveTo(bx + side * 30, J.cowl); c.lineTo(m[1][0], m[1][1]); c.stroke();
      c.strokeStyle = '#c8cfe0'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(bx, 1010); c.lineTo(m[0][0], m[0][1]); c.moveTo(bx + side * 30, J.cowl); c.lineTo(m[1][0], m[1][1]); c.stroke();
      for (const [x, y, rad] of m) {
        c.fillStyle = chrome(c, y - rad, y + rad, 0.4); c.beginPath(); c.ellipse(x, y, rad, rad * 1.2, 0, 0, 7); c.fill();
        c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
        const g = c.createLinearGradient(0, y - rad, 0, y + rad); g.addColorStop(0, SKY[7]); g.addColorStop(0.6, SKY[3]); g.addColorStop(1, SKY[0]);
        c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rad * 0.76, rad * 0.96, 0, 0, 7); c.fill();
      }
    }, { t: 7.9 + (side > 0 ? 0.2 : 0), d: 0.6, reveal: 'pop', ease: 'back' });
  }
  // the antennas, drawn up into the sky from the roof's corners
  for (const side of [-1, 1]) {
    const bx = side < 0 ? J.x0 + 14 : J.x1 - 14;
    p.pen('chrome', [[bx, J.roof + 4], [bx + side * 60, 300]], INK, 5, { t: 8.1, d: 0.8 });
    p.pen('chrome', [[bx, J.roof + 4], [bx + side * 60, 300]], '#d8dceb', 2, { t: 8.15, d: 0.8 });
  }

  // the route board on the roof, lettered in red
  p.group('chrome', box(530, 600, 1070, J.roof + 4), (c) => {
    c.fillStyle = INK; c.fillRect(600, 676, 10, 16); c.fillRect(990, 676, 10, 16);
    rr(c, 540, 610, 520, 70, 12); c.fillStyle = chrome(c, 610, 680, 0.5); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    rr(c, 552, 620, 496, 50, 6); c.fillStyle = CREAM; c.fill(); c.stroke();
  }, { t: 8.3, d: 0.6, reveal: 'rise' });
  p.group('chrome', box(552, 620, 1048, 670), (c) => {
    c.font = `400 25px ${SIGN}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = RED; c.fillText('QUIAPO · INTRAMUROS · BACLARAN', 800, 647);
  }, { t: 8.7, d: 0.9, reveal: 'wipe', ease: 'linear' });

  // pinstripes: thin lines of color following the body, laid by a steady hand
  const pin = (pts, col, w, t) => p.pen('stripes', pts, col, w, { t, d: 0.9 });
  pin([[J.x0 + 20, J.cowl - 14], [J.x1 - 20, J.cowl - 14]], PINK, 4, 9.0);
  pin([[J.x0 + 20, J.cowl - 26], [J.x1 - 20, J.cowl - 26]], CYAN, 3, 9.1);
  pin([[J.x0 + 20, J.glass1 + 10], [J.x1 - 20, J.glass1 + 10]], YEL, 3, 9.2);
  pin([[480, J.hoodTop + 16], [480, J.grille1 - 34], [585, J.grille1 - 34]], YEL, 4, 9.25);
  pin([[1120, J.hoodTop + 16], [1120, J.grille1 - 34], [1015, J.grille1 - 34]], YEL, 4, 9.25);
  pin([[490, J.hoodTop + 26], [490, J.grille1 - 44], [585, J.grille1 - 44]], CYAN, 2.5, 9.35);
  pin([[1110, J.hoodTop + 26], [1110, J.grille1 - 44], [1015, J.grille1 - 44]], CYAN, 2.5, 9.35);
  // scrolls on the fenders: a curl like a sign painter's flourish
  for (const side of [-1, 1]) {
    const cx = side < 0 ? 330 : 1270;
    const curl = [];
    for (let k = 0; k <= 46; k++) {
      const u = k / 46, a = u * Math.PI * 3.2, rad = 30 * (1 - u) + 3;
      curl.push([cx - side * (90 - u * 90) + side * Math.cos(a) * rad * 0.2, 1376 + Math.sin(a) * rad * 0.7 - 6]);
    }
    const sp = [];
    for (let k = 0; k <= 40; k++) { const u = k / 40, a = u * Math.PI * 4, rad = 22 * (1 - u) + 2; sp.push([cx + side * 60 + Math.cos(a) * rad, 1372 + Math.sin(a) * rad * 0.8]); }
    pin(sp, RED, 3.5, 9.5 + (side > 0 ? 0.1 : 0));
    pin([[cx - 110, 1396], [cx + 110, 1396]], BLUE, 3, 9.6);
  }
  // a checker strip along the cowl, and chrome studs on the visor's foot
  p.group('stripes', box(J.x0, J.glass1 + 16, J.x1, J.glass1 + 40), (c) => {
    for (let x = J.x0 + 24, k = 0; x < J.x1 - 34; x += 12, k++) {
      c.fillStyle = INK; c.fillRect(x, J.glass1 + 18 + (k % 2) * 8, 12, 8);
    }
  }, { t: 9.7, d: 0.8, reveal: 'wipe' });
  p.group('stripes', box(J.x0, J.visor1 - 10, J.x1, J.visor1 + 10), (c) => {
    for (let x = J.x0 + 20; x < J.x1 - 14; x += 26) { c.fillStyle = chrome(c, J.visor1 - 6, J.visor1 + 6); c.beginPath(); c.arc(x, J.visor1 + 1, 5, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(); }
  }, { t: 9.8, d: 0.6, reveal: 'wipe' });
  // flourishes on the red face beside the headlamps, and studs round it
  for (const side of [-1, 1]) {
    const cx = side < 0 ? 533 : 1067;
    const sp = [];
    for (let k = 0; k <= 36; k++) { const u = k / 36, a = Math.PI / 2 + side * u * Math.PI * 3, rad = 26 * (1 - u) + 3; sp.push([cx + side * 6 + Math.cos(a) * rad, 1440 - 26 + Math.sin(a) * rad * 0.5 - 8]); }
    pin(sp, YEL, 2.5, 9.9);
  }
}

// a five-pointed star
function star(c, x, y, R, rIn = 0.42) {
  c.beginPath();
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rad = k % 2 ? R * rIn : R; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  c.closePath();
}

// ---------------------------------------------------------------- the chrome horses on the hood
// a rearing horse in a 100 by 100 box, facing right, its hoof at the bottom
const HORSE = [[72, 0], [76, 4], [82, 8], [89, 14], [94, 19], [93, 24], [87, 26], [79, 23], [75, 30], [73, 40], [73, 47],
  [80, 45], [87, 43], [91, 46], [88, 50], [85, 57], [80, 58], [82, 51], [76, 53], [67, 57], [57, 62], [47, 64], [41, 68],
  [45, 82], [45, 93], [49, 99], [38, 100], [36, 92], [32, 82], [26, 72], [22, 66], [14, 70], [7, 82], [3, 86], [6, 74],
  [13, 62], [22, 58], [30, 52], [42, 42], [52, 34], [58, 24], [63, 14], [68, 6]];
function horse(c, x, y, h, flip, warm) {
  const s = h / 100;
  const pts = HORSE.map(([u, v]) => [x + (flip ? -1 : 1) * (u - 50) * s, y - (100 - v) * s]);
  path(c, pts);
  c.fillStyle = chrome(c, y - h, y, warm); c.fill();
  c.strokeStyle = INK; c.lineWidth = Math.max(2, h * 0.018); c.stroke();
  // the mane and a highlight down the neck
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = h * 0.02; c.beginPath();
  c.moveTo(x + (flip ? -1 : 1) * (66 - 50) * s, y - (100 - 10) * s); c.quadraticCurveTo(x + (flip ? -1 : 1) * (60 - 50) * s, y - (100 - 26) * s, x + (flip ? -1 : 1) * (46 - 50) * s, y - (100 - 42) * s);
  c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(x + (flip ? -1 : 1) * (82 - 50) * s, y - (100 - 13) * s, h * 0.02, 0, 7); c.fill();
}
function horses(p, r) {
  // the big one in the middle on a little plinth, and a pair facing out
  const list = [[800, J.hoodTop - 18, 200, false, 8.9], [575, J.hoodTop - 12, 120, true, 9.15], [1025, J.hoodTop - 12, 120, false, 9.3]];
  for (const [x, y, h, flip, t] of list) {
    p.group('horses', box(x - h * 0.6, y - h - 10, x + h * 0.6, y + 22), (c) => {
      c.fillStyle = chrome(c, y, y + 18); rr(c, x - h * 0.22, y, h * 0.44, 16, 4); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      horse(c, x, y + 1, h, flip, 0.5);
    }, { t, d: 0.7, reveal: 'drop', dy: 50, ease: 'back' });
  }
  // a row of small horses along the bumper's top, trotting toward the middle
  const small = [];
  for (let k = 0; k < 4; k++) { small.push([280 + k * 75, false]); small.push([1320 - k * 75, true]); }
  p.group('horses', box(230, J.bumper0 - 60, 1370, J.bumper0 + 4), (c) => {
    for (const [x, flip] of small) horse(c, x, J.bumper0 + 2, 56, flip, 0.3);
  }, { t: 9.5, d: 0.7, reveal: 'fade' });
}

// ---------------------------------------------------------------- the name on the visor
function title(p, r) {
  const size = 196, y = J.visor1 - 34, cx = 800;
  const m = measure(`400 ${size}px ${FACE}`);
  const str = 'MANILA', track = 0.04 * size;
  const widths = [];
  let total = 0;
  for (let i = 0; i < str.length; i++) { const w = m.measureText(str.slice(0, i + 1)).width; widths.push(w); }
  total = widths[widths.length - 1] + track * (str.length - 1);
  const k = Math.min(1, 920 / total);
  const fs = size * k;
  const x0 = cx - (total * k) / 2;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const gw = m.measureText(ch).width * k, gx = x0 + widths[i] * k + track * k * i - gw;
    p.group('title', { x: gx - 30, y: y - fs * 0.95, w: gw + 60, h: fs * 1.25 }, (c) => {
      c.font = `400 ${fs}px ${FACE}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      // the deep red block behind, as if the letters stood out of the board
      for (let d = 12; d >= 1; d -= 1) { c.fillStyle = mix(RED, RED_D, d / 12); c.fillText(ch, gx + d * 0.6, y + d * 0.9); }
      c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 6; c.strokeText(ch, gx, y);
      c.fillStyle = chrome(c, y - fs * 0.74, y, 0.35); c.fillText(ch, gx, y);
    }, { t: 10.4 + i * 0.16, d: 0.6, reveal: 'press', ease: 'back' });
  }
  // little stars either end of the name
  for (const [x, t] of [[340, 11.5], [1260, 11.6]]) {
    p.group('title', box(x - 30, y - 110, x + 30, y - 50), (c) => { star(c, x, y - 80, 24); ink(c, CREAM, INK, 2.5); }, { t, d: 0.5, reveal: 'pop', ease: 'back' });
  }
}
let mc = null;
function measure(font) {
  if (!mc) mc = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  mc.font = font;
  return mc;
}

// ---------------------------------------------------------------- the lamps: a string of bulbs on the roof, colored lamps on the bumper, streamers
function lamps(p, r) {
  const roof = [];
  for (let k = 0; k < 24; k++) roof.push([J.x0 + 12 + k * ((J.x1 - J.x0 - 24) / 23), J.roof + 12, [RED, YEL, GREEN, CYAN, PINK][k % 5], k * 0.7]);
  const bump = [];
  for (let k = 0; k < 14; k++) { const x = 230 + k * 87; if (x > 680 && x < 920) continue; bump.push([x, J.bumper0 + 40, [RED, '#ff9d2e', GREEN, YEL][k % 4], k * 1.3]); }
  p.live('lamps', {
    t: 11.9, d: 0.8, box: box(J.x0 - 40, J.roof - 10, J.x1 + 40, J.bumper1 + 10),
    draw: (c, time) => {
      const step = Math.floor(time * 3);
      for (const list of [roof, bump]) {
        for (let i = 0; i < list.length; i++) {
          const [x, y, col] = list[i];
          const on = (i + step) % 3 !== 0;
          c.fillStyle = on ? col : shade(col, 0.45);
          c.beginPath(); c.arc(x, y, list === roof ? 7 : 11, 0, 7); c.fill();
          if (on) { c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(x - 2, y - 3, list === roof ? 2.5 : 4, 0, 7); c.fill(); }
        }
      }
    },
  });
  // streamers on the antennas' tips
  for (const side of [-1, 1]) {
    const tx = (side < 0 ? J.x0 + 14 : J.x1 - 14) + side * 60, ty = 300;
    const cols = [RED, YEL, BLUE];
    p.live('lamps', {
      t: 9.0, d: 0.6, box: box(tx - 170, ty - 40, tx + 170, ty + 90),
      draw: (c, time) => {
        cols.forEach((col, k) => {
          c.strokeStyle = col; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath();
          c.moveTo(tx, ty + 4 + k * 4);
          for (let u = 1; u <= 6; u++) c.lineTo(tx + side * u * 22, ty + 6 + k * 9 + u * 5 + Math.sin(time * 5 + u * 0.9 + k) * u * 2.2);
          c.stroke();
        });
      },
    });
  }
  // birds going home across the sunset
  const birds = [];
  for (let k = 0; k < 9; k++) birds.push([r.range(0, 700), r.range(140, 420), r.range(0.7, 1.2), r() * 6.28]);
  p.live('lamps', {
    t: 6.0, d: 1, box: box(0, 80, W, 480),
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineCap = 'round';
      for (const [x0, y, s, ph] of birds) {
        const x = (x0 + (time - 6) * 26 * s) % (W + 80) - 40, f = Math.sin(time * 7 * s + ph);
        c.lineWidth = 2.6 * s; c.beginPath();
        c.moveTo(x - 12 * s, y - 2 * s - f * 5 * s); c.quadraticCurveTo(x - 5 * s, y - 6 * s, x, y);
        c.quadraticCurveTo(x + 5 * s, y - 6 * s, x + 12 * s, y - 2 * s - f * 5 * s); c.stroke();
      }
    },
  });
  // a glint that runs across the chrome now and then
  p.live('lamps', {
    t: 12.2, d: 0.6, box: box(150, J.hoodTop, 1450, J.bumper1),
    draw: (c, time) => {
      const u = ((time - 12.2) % 4.5) / 1.1;
      if (u > 1) return;
      const x = 150 + u * 1400;
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(255,240,220,.35)';
      path(c, [[x, J.bumper0], [x + 26, J.bumper0], [x + 6, J.bumper1], [x - 20, J.bumper1]]); c.fill();
      c.restore();
    },
  });
}

// ---------------------------------------------------------------- a pinstriped edge round the sheet, as round a jeepney's panel
function edge(p, r) {
  const cols = [RED, YEL, CYAN];
  cols.forEach((col, k) => {
    const m = 18 + k * 9;
    p.pen('edge', [[m, m], [W - m, m], [W - m, H - m], [m, H - m], [m, m]], col, 4, { t: 12.2 + k * 0.2, d: 1.4, cap: 'square' });
  });
  // stars at the corners
  for (const [x, y, t] of [[70, 70, 13.3], [W - 70, 70, 13.35], [70, H - 70, 13.4], [W - 70, H - 70, 13.45]]) {
    p.group('edge', box(x - 26, y - 26, x + 26, y + 26), (c) => { star(c, x, y, 20); ink(c, YEL, INK, 2); }, { t, d: 0.5, reveal: 'pop', ease: 'back' });
  }
}
