// Seattle: a 1962 world's-fair poster of the space age. The Space Needle stands
// huge on the left, its legs pinched at the waist, its top house roofed in the
// original Galaxy Gold under three atomic orbits; Mount Rainier rises pale on the
// right over a dusk sky of stepped bands strewn with sparkle stars. The towers of
// downtown light their windows, with the Smith Tower's white pyramid among them,
// a ferry crosses Elliott Bay, the Pacific Science Center's white arches stand at
// the Needle's foot, the monorail runs on its beam across the front, and the
// Public Market's clock and sign glow on the right. The picture sits in a panel
// with round corners above the name in Audiowide.

import { Plate, W } from '../print.js';
import { poly } from '../kit.js';

const PAPER = '#f2e3c2', NAVY = '#17223d', NAVY2 = '#22355c', TEAL = '#2b8986', TEAL_D = '#1d5f61', TEAL_L = '#7cc5b6';
const ORANGE = '#ec6a2c', ORANGE_D = '#b94a1f', GOLD = '#f0b43c', CREAM = '#fbf1da', OLIVE = '#8f9257', LAV = '#a9b3d3', LAV_D = '#7d88b2';
const NEON = '#ef4a36', GROUND = '#1c4a46';
const F = 'Audiowide, sans-serif';

export const city = {
  id: 'seattle', name: 'Seattle', wall: '#14203a',
  alt: 'A 1962 space-age poster: the Space Needle huge against a dusk sky of sparkling stars, its gold-roofed top house circled by three atomic orbits with an elevator climbing its core, Mount Rainier pale behind downtown’s lit towers and the Smith Tower, a ferry and sailboats on Elliott Bay, the white arches of the Pacific Science Center, the monorail running on its beam, and the Public Market’s clock and neon sign, above the name SEATTLE',
  google: 'family=Audiowide',
  fonts: [['400 100px Audiowide', 'SEATTLE PUGET SOUND · WASHINGTON SPACE NEEDLE MOUNT RAINIER ELLIOTT BAY PUBLIC MARKET CENTER 1962 ★']],
  build,
};

// the picture panel
const PX0 = 70, PY0 = 70, PX1 = W - 70, PY1 = 1640, RAD = 46;
const HOR = 1210;      // the far shore under the mountain
const SHORE = 1300;    // the foot of downtown
const NEAR = 1480;     // the near ground
// the Needle
const NX = 500, FOOT = 1610, WAIST = 1010, HALO = 352;

function build() {
  const p = new Plate({ paper: PAPER, seed: 1962 });
  const r = p.r;
  p.clip = { x: PX0, y: PY0, w: PX1 - PX0, h: PY1 - PY0 };
  p.stack('sky', 'stars', 'mountain', 'city', 'bay', 'boats', 'ground', 'needle', 'front', 'orbits', 'live', 'mask', 'title');
  p.layer('mask', { clip: false });
  p.layer('title', { clip: false });

  mask(p);
  sky(p);
  stars(p, r);
  mountain(p, r);
  downtown(p, r);
  bay(p, r);
  ground(p, r);
  needle(p);
  orbits(p);
  monorail(p);
  market(p);
  life(p, r);
  title(p, r);
  return p;
}

const rrect = (c, x, y, w, h, rr) => {
  c.moveTo(x + rr, y); c.arcTo(x + w, y, x + w, y + h, rr); c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr); c.arcTo(x, y, x + w, y, rr); c.closePath();
};
// a four-pointed sparkle with concave sides
const sparkle = (c, x, y, s, k = 0.22) => {
  c.moveTo(x, y - s);
  c.quadraticCurveTo(x + s * k, y - s * k, x + s, y);
  c.quadraticCurveTo(x + s * k, y + s * k, x, y + s);
  c.quadraticCurveTo(x - s * k, y + s * k, x - s, y);
  c.quadraticCurveTo(x - s * k, y - s * k, x, y - s);
  c.closePath();
};

// ================================================================ the panel's frame
function mask(p) {
  p.group('mask', { x: 0, y: 0, w: W, h: 2000 }, (c) => {
    c.fillStyle = PAPER; c.beginPath(); c.rect(0, 0, W, 2000);
    rrect(c, PX0, PY0, PX1 - PX0, PY1 - PY0, RAD); c.fill('evenodd');
  }, { t: 0, d: 0.05, reveal: 'none' });
  // a navy keyline round the panel, and a thin gold one outside it
  p.group('mask', { x: PX0 - 24, y: PY0 - 24, w: PX1 - PX0 + 48, h: PY1 - PY0 + 48 }, (c) => {
    c.strokeStyle = NAVY; c.lineWidth = 6; c.beginPath(); rrect(c, PX0, PY0, PX1 - PX0, PY1 - PY0, RAD); c.stroke();
    c.strokeStyle = GOLD; c.lineWidth = 2.5; c.beginPath(); rrect(c, PX0 - 14, PY0 - 14, PX1 - PX0 + 28, PY1 - PY0 + 28, RAD + 14); c.stroke();
  }, { t: 0.3, d: 1.0, reveal: 'iris', ease: 'inOut' });
}

// ================================================================ the dusk sky in flat bands
function sky(p) {
  const bands = [[PY0, '#141f3a'], [300, '#1a2a4d'], [500, '#213862'], [680, '#2a4a74'], [840, '#356281'], [960, '#4b8088'], [1050, '#e9a066'], [1110, '#f2bb7c'], [1165, '#f6d398']];
  bands.forEach(([y, col], i) => {
    const y1 = i + 1 < bands.length ? bands[i + 1][0] : HOR + 10;
    p.group('sky', { x: PX0, y: y - 2, w: PX1 - PX0, h: y1 - y + 4 }, (c) => {
      c.fillStyle = col; c.fillRect(PX0, y, PX1 - PX0, y1 - y + 1);
    }, { t: 0.15 + i * 0.12, d: 0.7, reveal: 'fall', ease: 'inOut' });
  });
  // a low setting sun behind the far hills, banded like the sky
  p.group('sky', { x: 140, y: 1000, w: 300, h: 220 }, (c) => {
    c.save(); c.beginPath(); c.rect(140, 1000, 300, HOR - 1000); c.clip();
    c.fillStyle = GOLD; c.beginPath(); c.arc(290, HOR, 120, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f6d398';
    for (let k = 0; k < 4; k++) c.fillRect(140, HOR - 26 - k * 22, 300, 4 + k * 0.5);
    c.restore();
  }, { t: 1.3, d: 1.0, reveal: 'rise', ease: 'out' });
}

// ================================================================ the stars: sparkles, dots, atoms
function stars(p, r) {
  const list = [];
  for (let i = 0; i < 90; i++) {
    const x = r.range(PX0 + 30, PX1 - 30), y = r.range(PY0 + 30, 860);
    if (Math.abs(x - NX) < 300 && y > 160 && y < 460) continue; // clear of the Needle's top
    const kind = r() < 0.32 ? 'spark' : 'dot';
    list.push({ x, y, kind, s: kind === 'spark' ? r.range(7, 20) : r.range(1.6, 3.6), col: r.chance(0.3) ? GOLD : CREAM });
  }
  // fill in three passes, top to bottom
  for (let k = 0; k < 3; k++) {
    const set = list.filter((s, i) => i % 3 === k);
    p.group('stars', { x: PX0, y: PY0, w: PX1 - PX0, h: 820 }, (c) => {
      for (const s of set) {
        c.fillStyle = s.col; c.beginPath();
        if (s.kind === 'spark') sparkle(c, s.x, s.y, s.s); else c.arc(s.x, s.y, s.s, 0, Math.PI * 2);
        c.fill();
      }
    }, { t: 1.2 + k * 0.4, d: 0.8, reveal: 'fade' });
  }
  // two atoms: three crossed orbits round a nucleus
  for (const [x, y, s, t] of [[1340, 250, 46, 2.4], [880, 560, 30, 2.7], [170, 620, 26, 2.9]]) {
    p.group('stars', { x: x - s - 6, y: y - s - 6, w: 2 * s + 12, h: 2 * s + 12 }, (c) => {
      c.strokeStyle = CREAM; c.lineWidth = 2;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(x, y, s, s * 0.32, (k * Math.PI) / 3, 0, Math.PI * 2); c.stroke(); }
      c.fillStyle = ORANGE; c.beginPath(); c.arc(x, y, s * 0.16, 0, Math.PI * 2); c.fill();
    }, { t, d: 0.7, reveal: 'pop' });
  }
}

// ================================================================ Mount Rainier
function mountain(p, r) {
  const peak = [[790, HOR], [880, 1140], [960, 1060], [1050, 960], [1120, 880], [1170, 818], [1205, 786], [1236, 772], [1262, 776], [1290, 770], [1330, 790], [1380, 830], [1440, 890], [1500, 950], [1560, 1010], [1600, 1060], [1600, HOR]];
  // the far hills along the horizon, two flat tones
  const hills = [[PX0, HOR], [PX0, 1166], [200, 1150], [360, 1172], [520, 1146], [700, 1168], [800, 1180], [1000, 1176], [1300, 1186], [1530, 1168], [PX1, HOR]];
  p.fill('mountain', hills, LAV_D, { t: 1.8, d: 0.8, reveal: 'rise' });
  p.group('mountain', { x: 780, y: 760, w: 830, h: HOR - 760 + 4 }, (c) => {
    // the whole cone in snow
    c.fillStyle = CREAM; poly(c, peak); c.fill();
    // the shadowed east face
    c.fillStyle = LAV;
    poly(c, [[1262, 776], [1290, 770], [1330, 790], [1380, 830], [1440, 890], [1500, 950], [1560, 1010], [1600, 1060], [1600, HOR], [1310, HOR], [1300, 1060], [1270, 930], [1252, 850]]); c.fill();
    // ridges and glaciers: long curved strokes down the face
    c.strokeStyle = LAV_D; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath();
    const ridges = [[1236, 780, 1120, 1000], [1250, 790, 1200, 1060], [1262, 790, 1290, 1080], [1290, 780, 1390, 980], [1220, 800, 1030, 1050], [1300, 800, 1480, 1030]];
    for (const [x0, y0, x1, y1] of ridges) { c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + (x1 - x0) * 0.12, (y0 + y1) / 2, x1, y1); }
    c.stroke();
    // the forested foot below the snow line, with a jagged edge
    c.fillStyle = NAVY2; c.beginPath(); c.moveTo(780, HOR);
    for (let x = 790; x <= 1600; x += 22) c.lineTo(x, 1090 + Math.sin(x * 0.07) * 18 + ((x * 37) % 30) - (x > 1250 ? 30 : 0) + Math.abs(x - 1240) * 0.12);
    c.lineTo(1600, HOR); c.closePath(); c.fill();
  }, { t: 2.0, d: 1.5, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ downtown
function downtown(p, r) {
  const blocks = [];
  // a row of towers across the whole width, taller toward the middle right
  let x = PX0;
  while (x < PX1) {
    const w = r.pick([36, 44, 52, 60, 70, 84]);
    const mid = Math.exp(-(((x - 1000) / 360) ** 2));
    const h = Math.round(40 + r.range(20, 70) + mid * r.range(60, 190));
    blocks.push({ x, w, h, col: r.pick([NAVY2, TEAL_D, NAVY, '#2c4a6e']), lit: r() });
    x += w + r.pick([0, 2, 6]);
  }
  const draw = (c, set) => {
    for (const b of set) {
      const y = SHORE - b.h;
      c.fillStyle = b.col; c.fillRect(b.x, y, b.w, b.h);
      c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(b.x, y, b.w * 0.3, b.h);
      // windows: gold where lit
      c.fillStyle = GOLD; c.beginPath();
      for (let yy = y + 10; yy < SHORE - 8; yy += 11) for (let xx = b.x + 5; xx < b.x + b.w - 6; xx += 8) {
        const k = Math.sin(xx * 12.9898 + yy * 78.233) * 43758.5453;
        if (k - Math.floor(k) < 0.32 + b.lit * 0.25) c.rect(xx, yy, 4, 5);
      }
      c.fill();
    }
  };
  for (let k = 0; k < 4; k++) {
    const set = blocks.filter((b) => b.x >= PX0 + k * 365 && b.x < PX0 + (k + 1) * 365);
    const top = SHORE - Math.max(...set.map((b) => b.h)) - 4;
    const x0 = set[0].x, x1 = set[set.length - 1].x + set[set.length - 1].w;
    p.group('city', { x: x0 - 2, y: top, w: x1 - x0 + 4, h: SHORE - top + 4 }, (c) => draw(c, set), { t: 2.9 + k * 0.3, d: 0.9, reveal: 'rise' });
  }
  // the Smith Tower: a white shaft and its pyramid
  const sx = 1110, sy = SHORE - 210;
  p.group('city', { x: sx - 40, y: sy - 110, w: 80, h: 330 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(sx - 34, SHORE - 90, 68, 90); c.fillRect(sx - 22, sy, 44, 210);
    c.fillStyle = '#d9cdb0'; c.fillRect(sx + 6, sy, 16, 210);
    c.fillStyle = CREAM; poly(c, [[sx - 24, sy], [sx, sy - 74], [sx + 24, sy]]); c.fill();
    c.fillStyle = '#d9cdb0'; poly(c, [[sx, sy - 74], [sx + 24, sy], [sx, sy]]); c.fill();
    c.fillStyle = NAVY; c.fillRect(sx - 1, sy - 104, 2, 32); c.beginPath(); c.arc(sx, sy - 74, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = NAVY2; c.beginPath();
    for (let yy = sy + 10; yy < SHORE - 10; yy += 10) { c.rect(sx - 16, yy, 3, 5); c.rect(sx - 8, yy, 3, 5); c.rect(sx, yy, 3, 5); c.rect(sx + 8, yy, 3, 5); }
    c.fill();
  }, { t: 4.1, d: 0.9, reveal: 'rise' });
  // two mid-century slabs with gold crowns
  for (const [bx, bw, bh, t] of [[1270, 70, 250, 4.3], [890, 58, 200, 4.4]]) {
    p.group('city', { x: bx - 4, y: SHORE - bh - 20, w: bw + 8, h: bh + 24 }, (c) => {
      c.fillStyle = TEAL; c.fillRect(bx, SHORE - bh, bw, bh);
      c.fillStyle = ORANGE; c.fillRect(bx - 3, SHORE - bh - 10, bw + 6, 10);
      c.fillStyle = TEAL_L; c.beginPath();
      for (let yy = SHORE - bh + 12; yy < SHORE - 6; yy += 9) c.rect(bx + 6, yy, bw - 12, 3);
      c.fill();
    }, { t, d: 0.8, reveal: 'rise' });
  }
}

// ================================================================ Elliott Bay
function bay(p, r) {
  p.group('bay', { x: PX0, y: SHORE - 2, w: PX1 - PX0, h: NEAR - SHORE + 30 }, (c) => {
    c.fillStyle = TEAL; c.fillRect(PX0, SHORE, PX1 - PX0, NEAR - SHORE + 30);
    c.fillStyle = TEAL_D; c.fillRect(PX0, SHORE, PX1 - PX0, 6);
  }, { t: 3.6, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // ripples, and the gold of lit windows broken on the water
  const ripples = [], golds = [];
  for (let i = 0; i < 150; i++) {
    const y = r.range(SHORE + 14, NEAR + 20), x = r.range(PX0 + 10, PX1 - 40), l = r.range(14, 50) * (0.6 + (y - SHORE) / 300);
    ripples.push([[x, y], [x + l, y]]);
  }
  for (let i = 0; i < 70; i++) {
    const x = r.range(PX0 + 30, PX1 - 30), y = r.range(SHORE + 10, SHORE + 90);
    golds.push([[x, y], [x + r.range(5, 16), y]]);
  }
  p.strokes('bay', ripples, TEAL_L, 2.2, { t: 4.4, d: 0.9, reveal: 'wipe', cap: 'round' });
  p.strokes('bay', golds, GOLD, 2.6, { t: 4.8, d: 0.8, reveal: 'fade', cap: 'butt' });
  // sailboats with orange and cream sails
  [[1000, 1380, 1.0, ORANGE], [760, 1350, 0.7, CREAM], [1460, 1420, 0.9, CREAM]].forEach(([x, y, s, col], i) => {
    p.group('boats', { x: x - 40 * s, y: y - 80 * s, w: 80 * s, h: 90 * s }, (c) => {
      c.fillStyle = col; poly(c, [[x + 2 * s, y - 70 * s], [x + 2 * s, y - 8 * s], [x + 30 * s, y - 8 * s]]); c.fill();
      c.fillStyle = CREAM; poly(c, [[x - 3 * s, y - 56 * s], [x - 3 * s, y - 8 * s], [x - 24 * s, y - 8 * s]]); c.fill();
      c.fillStyle = NAVY; poly(c, [[x - 28 * s, y - 6 * s], [x + 32 * s, y - 6 * s], [x + 24 * s, y + 2 * s], [x - 22 * s, y + 2 * s]]); c.fill();
    }, { t: 5.2 + i * 0.2, d: 0.6, reveal: 'rise' });
  });
}

// ================================================================ the near ground: trees and the Science Center arches
function ground(p, r) {
  p.group('ground', { x: PX0, y: NEAR - 4, w: PX1 - PX0, h: PY1 - NEAR + 8 }, (c) => {
    c.fillStyle = GROUND; c.fillRect(PX0, NEAR, PX1 - PX0, PY1 - NEAR);
    c.fillStyle = '#26605a'; c.fillRect(PX0, NEAR, PX1 - PX0, 10);
  }, { t: 5.4, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // the Pacific Science Center's slender pointed arches, white over a pool
  const ax = 120, aw = 52;
  p.group('ground', { x: ax - 10, y: 1330, w: aw * 5 + 20, h: PY1 - 1330 }, (c) => {
    c.fillStyle = TEAL_L; c.fillRect(ax - 6, 1584, aw * 5 + 12, 20);
    for (let k = 0; k < 5; k++) {
      const x = ax + k * aw, top = 1350 + Math.abs(k - 2) * 26;
      c.fillStyle = CREAM; c.beginPath();
      c.moveTo(x + 4, 1590); c.lineTo(x + 4, top + 90);
      c.quadraticCurveTo(x + 6, top + 20, x + aw / 2, top);
      c.quadraticCurveTo(x + aw - 6, top + 20, x + aw - 4, top + 90);
      c.lineTo(x + aw - 4, 1590); c.lineTo(x + aw - 12, 1590); c.lineTo(x + aw - 12, top + 92);
      c.quadraticCurveTo(x + aw - 14, top + 36, x + aw / 2, top + 18);
      c.quadraticCurveTo(x + 14, top + 36, x + 12, top + 92); c.lineTo(x + 12, 1590); c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(23,34,61,.35)'; c.lineWidth = 1.5; c.stroke();
    }
  }, { t: 5.8, d: 1.1, reveal: 'rise', ease: 'out' });
  // mid-century trees: lollipops and tall ovals, in rows along the ground
  const trees = [];
  for (let i = 0; i < 34; i++) {
    const x = r.range(PX0 + 10, PX1 - 10);
    if (x > 110 && x < 400) continue;
    trees.push({ x, y: r.range(NEAR + 22, PY1 - 10), s: r.range(0.7, 1.3), kind: r.pick(['round', 'oval', 'oval', 'cone']), col: r.pick([TEAL, '#3a9a7c', TEAL_D, '#4aa58c']) });
  }
  trees.sort((a, b) => a.y - b.y);
  for (let k = 0; k < 3; k++) {
    const set = trees.filter((t, i) => i % 3 === k);
    p.group('ground', { x: PX0, y: NEAR - 80, w: PX1 - PX0, h: PY1 - NEAR + 80 }, (c) => {
      for (const t of set) {
        const { x, y, s } = t;
        c.fillStyle = NAVY; c.fillRect(x - 1.5 * s, y - 20 * s, 3 * s, 20 * s);
        c.fillStyle = t.col; c.beginPath();
        if (t.kind === 'round') c.arc(x, y - 30 * s, 16 * s, 0, Math.PI * 2);
        else if (t.kind === 'oval') c.ellipse(x, y - 38 * s, 11 * s, 26 * s, 0, 0, Math.PI * 2);
        else { c.moveTo(x, y - 66 * s); c.lineTo(x + 14 * s, y - 16 * s); c.lineTo(x - 14 * s, y - 16 * s); c.closePath(); }
        c.fill();
        c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath();
        if (t.kind === 'round') c.arc(x - 5 * s, y - 35 * s, 6 * s, 0, Math.PI * 2);
        else if (t.kind === 'oval') c.ellipse(x - 4 * s, y - 44 * s, 4 * s, 12 * s, 0, 0, Math.PI * 2);
        c.fill();
      }
    }, { t: 6.2 + k * 0.25, d: 0.7, reveal: 'fade' });
  }
  // little fairgoers on the paths
  const people = [];
  for (let i = 0; i < 40; i++) people.push([r.range(PX0 + 20, PX1 - 400), r.range(1600, 1630), r.pick([ORANGE, CREAM, GOLD, TEAL_L])]);
  p.group('ground', { x: PX0, y: 1560, w: PX1 - PX0, h: 80 }, (c) => {
    c.fillStyle = '#2f6e66'; c.fillRect(PX0, 1592, PX1 - PX0, 10);
    for (const [x, y, col] of people) {
      c.fillStyle = col; c.fillRect(x - 3, y - 14, 6, 10);
      c.fillStyle = NAVY; c.fillRect(x - 2.5, y - 4, 2, 6); c.fillRect(x + 0.5, y - 4, 2, 6);
      c.beginPath(); c.arc(x, y - 17, 3, 0, Math.PI * 2); c.fill();
    }
  }, { t: 7.0, d: 0.8, reveal: 'fade' });
}

// ================================================================ the Space Needle
// a leg: from its foot, pinched in to the waist, then out to the halo
function legPts(xf, xw, xt) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, u = 1 - t;
    const cx = xw + (xf - xw) * 0.05, cy = WAIST + (FOOT - WAIST) * 0.45;
    pts.push([u * u * xf + 2 * u * t * cx + t * t * xw, u * u * FOOT + 2 * u * t * cy + t * t * WAIST]);
  }
  for (let i = 1; i <= 24; i++) {
    const t = i / 24, u = 1 - t;
    const cx = xw - (xt - xw) * 0.1, cy = WAIST - (WAIST - HALO) * 0.55;
    pts.push([u * u * xw + 2 * u * t * cx + t * t * xt, u * u * WAIST + 2 * u * t * cy + t * t * (HALO + 34)]);
  }
  return pts;
}
function ribbon(c, pts, w0, w1) {
  c.beginPath();
  pts.forEach(([x, y], i) => { const w = w0 + (w1 - w0) * (i / (pts.length - 1)); i ? c.lineTo(x - w / 2, y) : c.moveTo(x - w / 2, y); });
  for (let i = pts.length - 1; i >= 0; i--) { const w = w0 + (w1 - w0) * (i / (pts.length - 1)); c.lineTo(pts[i][0] + w / 2, pts[i][1]); }
  c.closePath();
}

function needle(p) {
  const back = [legPts(NX - 150, NX - 20, NX - 70), legPts(NX + 150, NX + 20, NX + 70)];
  const outer = [legPts(NX - 240, NX - 46, NX - 118), legPts(NX + 240, NX + 46, NX + 118)];
  const front = [legPts(NX - 96, NX - 22, NX - 44), legPts(NX + 96, NX + 22, NX + 44)];
  // the core: the elevator shaft, in the original olive
  p.group('needle', { x: NX - 20, y: HALO, w: 40, h: FOOT - HALO + 4 }, (c) => {
    c.fillStyle = OLIVE; c.fillRect(NX - 14, HALO + 20, 28, FOOT - HALO - 20);
    c.fillStyle = 'rgba(23,34,61,.35)'; c.fillRect(NX + 4, HALO + 20, 10, FOOT - HALO - 20);
  }, { t: 6.0, d: 1.3, reveal: 'rise', ease: 'inOut' });
  const legMark = (pts, w0, w1, col, t) => {
    p.group('needle', { x: Math.min(...pts.map((q) => q[0])) - 20, y: HALO, w: Math.max(...pts.map((q) => q[0])) - Math.min(...pts.map((q) => q[0])) + 40, h: FOOT - HALO + 6 }, (c) => {
      c.fillStyle = col; ribbon(c, pts, w0, w1); c.fill();
      c.strokeStyle = NAVY; c.lineWidth = 2; c.stroke();
    }, { t, d: 1.6, reveal: 'rise', ease: 'inOut' });
  };
  back.forEach((pts, i) => legMark(pts, 24, 14, '#c9bc9c', 6.2 + i * 0.1));
  // crossings between the legs: rings at the waist and the old 100-foot deck
  p.group('needle', { x: NX - 200, y: 980, w: 400, h: 520 }, (c) => {
    c.fillStyle = CREAM; c.strokeStyle = NAVY; c.lineWidth = 2;
    for (const [y, hw] of [[1440, 150], [WAIST + 4, 56]]) { c.beginPath(); c.rect(NX - hw, y - 7, hw * 2, 14); c.fill(); c.stroke(); }
    // lattice: zigzag braces between the outer legs low down
    c.strokeStyle = 'rgba(23,34,61,.55)'; c.lineWidth = 2; c.beginPath();
    for (let y = 1460, k = 0; y < FOOT - 10; y += 30, k++) {
      const hw = 150 + (y - 1440) * 0.5;
      c.moveTo(NX - hw, y); c.lineTo(NX - hw + 40, y + 30);
      c.moveTo(NX + hw, y); c.lineTo(NX + hw - 40, y + 30);
    }
    c.stroke();
  }, { t: 7.0, d: 0.7, reveal: 'fade' });
  outer.forEach((pts, i) => legMark(pts, 34, 18, CREAM, 6.5 + i * 0.12));
  front.forEach((pts, i) => legMark(pts, 26, 15, CREAM, 6.8 + i * 0.12));
  // under the halo: struts fanning out from the core to the rim
  p.group('needle', { x: NX - 220, y: HALO - 10, w: 440, h: 110 }, (c) => {
    c.strokeStyle = NAVY; c.lineWidth = 3; c.beginPath();
    for (let k = -4; k <= 4; k++) { c.moveTo(NX + k * 6, HALO + 84); c.lineTo(NX + k * 50, HALO + 4); }
    c.stroke();
  }, { t: 7.6, d: 0.6, reveal: 'rise' });
  // the halo: a gold ring with a sunburst
  p.group('needle', { x: NX - 236, y: HALO - 40, w: 472, h: 80 }, (c) => {
    c.fillStyle = GOLD; c.beginPath(); c.ellipse(NX, HALO, 226, 30, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = NAVY; c.lineWidth = 2.5; c.stroke();
    c.strokeStyle = ORANGE_D; c.lineWidth = 2; c.beginPath();
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2;
      c.moveTo(NX + Math.cos(a) * 150, HALO + Math.sin(a) * 18); c.lineTo(NX + Math.cos(a) * 220, HALO + Math.sin(a) * 28);
    }
    c.stroke();
  }, { t: 8.0, d: 0.8, reveal: 'pop', ease: 'back' });
  // the top house: glass all round, wider at the top
  p.group('needle', { x: NX - 180, y: 270, w: 360, h: 90 }, (c) => {
    poly(c, [[NX - 140, HALO - 6], [NX + 140, HALO - 6], [NX + 168, 290], [NX - 168, 290]]);
    c.fillStyle = NAVY2; c.fill(); c.strokeStyle = NAVY; c.lineWidth = 2; c.stroke();
    // lit window mullions
    c.fillStyle = GOLD; c.beginPath();
    for (let k = -10; k <= 10; k++) { const x = NX + k * 14; c.rect(x - 4, 298, 8, 42); }
    c.fill();
    c.fillStyle = CREAM; c.fillRect(NX - 168, 286, 336, 6);
  }, { t: 8.3, d: 0.7, reveal: 'rise' });
  // the roof: a gold cone with orange ribs, a drum and the spire
  p.group('needle', { x: NX - 190, y: 100, w: 380, h: 200 }, (c) => {
    c.fillStyle = ORANGE; c.beginPath(); c.ellipse(NX, 287, 182, 14, 0, 0, Math.PI * 2); c.fill();
    poly(c, [[NX - 176, 284], [NX + 176, 284], [NX + 46, 230], [NX - 46, 230]]); c.fillStyle = GOLD; c.fill();
    c.strokeStyle = ORANGE_D; c.lineWidth = 2.4; c.beginPath();
    for (let k = -6; k <= 6; k++) { c.moveTo(NX + k * 7, 232); c.lineTo(NX + k * 27, 283); }
    c.stroke();
    c.strokeStyle = NAVY; c.lineWidth = 2; poly(c, [[NX - 176, 284], [NX + 176, 284], [NX + 46, 230], [NX - 46, 230]]); c.stroke();
    c.fillStyle = CREAM; c.fillRect(NX - 34, 206, 68, 24); c.strokeRect(NX - 34, 206, 68, 24);
    c.fillStyle = NAVY; c.fillRect(NX - 24, 212, 48, 8);
    // the spire
    c.fillStyle = CREAM; poly(c, [[NX - 8, 206], [NX + 8, 206], [NX + 2, 120], [NX - 2, 120]]); c.fill(); c.stroke();
  }, { t: 8.8, d: 0.8, reveal: 'rise', ease: 'out' });
}

// ================================================================ the orbits round the top
const ORB = [[-0.32, 330, 70], [0.28, 360, 64], [0.02, 300, 46]];
function orbitPts([a, rx, ry]) {
  const pts = [];
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * Math.PI * 2, x = Math.cos(t) * rx, y = Math.sin(t) * ry;
    pts.push([NX + x * Math.cos(a) - y * Math.sin(a), 300 + x * Math.sin(a) + y * Math.cos(a)]);
  }
  return pts;
}
function orbits(p) {
  ORB.forEach((o, i) => p.pen('orbits', orbitPts(o), i === 2 ? CREAM : GOLD, 2.6, { t: 9.2 + i * 0.3, d: 1.2 }));
}

// ================================================================ the monorail beam
function monorail(p) {
  p.group('front', { x: PX0, y: 1490, w: PX1 - PX0, h: PY1 - 1490 }, (c) => {
    c.fillStyle = '#d9cdb0';
    for (let x = PX0 + 90; x < PX1; x += 260) {
      poly(c, [[x - 10, PY1], [x + 10, PY1], [x + 6, 1528], [x + 26, 1514], [x - 26, 1514], [x - 6, 1528]]); c.fill();
    }
    c.fillStyle = CREAM; c.fillRect(PX0, 1502, PX1 - PX0, 14);
    c.fillStyle = '#c7bb9c'; c.fillRect(PX0, 1512, PX1 - PX0, 4);
  }, { t: 7.4, d: 1.2, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ the market clock and sign
const MX = 1330, MY = 1250;
function market(p) {
  // the market's roof in the corner
  p.group('front', { x: 1080, y: 1540, w: PX1 - 1080, h: PY1 - 1540 }, (c) => {
    c.fillStyle = NAVY; c.fillRect(1100, 1556, PX1 - 1100, PY1 - 1556);
    c.fillStyle = GOLD; c.beginPath();
    for (let x = 1116; x < PX1 - 10; x += 26) c.rect(x, 1580, 14, 22);
    c.fill();
    c.fillStyle = ORANGE; c.fillRect(1100, 1552, PX1 - 1100, 8);
  }, { t: 7.6, d: 0.8, reveal: 'rise' });
  // posts, sign board and clock
  p.group('front', { x: MX - 220, y: MY - 80, w: 440, h: 330 }, (c) => {
    c.fillStyle = NAVY; c.fillRect(MX - 140, 1470, 8, 86); c.fillRect(MX + 132, 1470, 8, 86); c.fillRect(MX - 4, MY + 60, 8, 50);
    c.fillStyle = NAVY; c.beginPath(); rrect(c, MX - 196, 1392, 392, 82, 8); c.fill();
    c.strokeStyle = NEON; c.lineWidth = 3; c.beginPath(); rrect(c, MX - 188, 1400, 376, 66, 5); c.stroke();
  }, { t: 8.2, d: 0.8, reveal: 'rise' });
  p.group('front', { x: MX - 80, y: MY - 80, w: 160, h: 160 }, (c) => {
    c.fillStyle = NAVY; c.beginPath(); c.arc(MX, MY, 70, 0, Math.PI * 2); c.fill();
    c.strokeStyle = NEON; c.lineWidth = 5; c.beginPath(); c.arc(MX, MY, 62, 0, Math.PI * 2); c.stroke();
    c.fillStyle = CREAM; c.beginPath(); c.arc(MX, MY, 54, 0, Math.PI * 2); c.fill();
    c.strokeStyle = NAVY; c.beginPath();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.lineWidth = k % 3 ? 2 : 4; c.moveTo(MX + Math.cos(a) * 50, MY + Math.sin(a) * 50); c.lineTo(MX + Math.cos(a) * 40, MY + Math.sin(a) * 40); }
    c.lineWidth = 2.5; c.stroke();
  }, { t: 8.6, d: 0.8, reveal: 'iris', ease: 'inOut' });
  p.type('front', 'PUBLIC MARKET', MX, 1440, { family: F, size: 38, color: NEON, align: 'center', track: 0.04, t: 9.0, gap: 0.05, d: 0.3, reveal: 'fade' });
  p.type('front', 'CENTER', MX, 1462, { family: F, size: 18, color: GOLD, align: 'center', track: 0.4, t: 9.7, gap: 0.04, d: 0.3, reveal: 'fade' });
}

// ================================================================ what moves
function life(p, r) {
  // the elevator climbing and coming down the core
  p.live('live', {
    t: 9.0, d: 0.6, reveal: 'fade', box: { x: NX - 20, y: HALO, w: 40, h: FOOT - HALO },
    draw: (c, time) => {
      const k = (Math.sin((time - 9) * 0.32 - Math.PI / 2) + 1) / 2;
      const y = FOOT - 60 - k * (FOOT - HALO - 140);
      c.fillStyle = GOLD; c.fillRect(NX - 9, y, 18, 24);
      c.fillStyle = NAVY; c.fillRect(NX - 6, y + 5, 12, 6);
    },
  });
  // electrons running round the orbits, and the beacon on the spire
  const paths = ORB.map(orbitPts);
  p.live('live', {
    t: 10.4, d: 0.8, reveal: 'fade', box: { x: NX - 380, y: 100, w: 760, h: 420 },
    draw: (c, time) => {
      paths.forEach((pts, i) => {
        const f = ((time * (0.07 + i * 0.025) + i * 0.33) % 1) * (pts.length - 1), j = Math.floor(f);
        const [x, y] = pts[j];
        c.fillStyle = 'rgba(240,180,60,.35)'; c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2); c.fill();
        c.fillStyle = i === 2 ? ORANGE : CREAM; c.beginPath(); c.arc(x, y, 5.5, 0, Math.PI * 2); c.fill();
      });
      const on = (Math.sin(time * 3) + 1) / 2;
      c.fillStyle = `rgba(239,74,54,${0.3 + on * 0.7})`; c.beginPath(); c.arc(NX, 116, 4 + on * 3, 0, Math.PI * 2); c.fill();
    },
  });
  // the hands of the market clock
  p.live('live', {
    t: 9.2, d: 0.6, reveal: 'fade', box: { x: MX - 50, y: MY - 50, w: 100, h: 100 },
    draw: (c, time) => {
      const m = -Math.PI / 2 + 1.1 + time * 0.1, h = -Math.PI / 2 - 1.4 + time * 0.0083;
      c.strokeStyle = NAVY; c.lineCap = 'round';
      c.lineWidth = 5; c.beginPath(); c.moveTo(MX, MY); c.lineTo(MX + Math.cos(h) * 26, MY + Math.sin(h) * 26); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(MX, MY); c.lineTo(MX + Math.cos(m) * 40, MY + Math.sin(m) * 40); c.stroke();
      c.fillStyle = NEON; c.beginPath(); c.arc(MX, MY, 4, 0, Math.PI * 2); c.fill();
    },
  });
  // a few sparkles that twinkle
  const tw = [];
  for (let i = 0; i < 9; i++) tw.push([r.range(PX0 + 60, PX1 - 60), r.range(PY0 + 40, 700), r.range(10, 18), r.range(0, 6)]);
  p.live('live', {
    t: 9.4, d: 0.8, reveal: 'fade', box: { x: PX0, y: PY0, w: PX1 - PX0, h: 700 },
    draw: (c, time) => {
      c.fillStyle = CREAM; c.beginPath();
      for (const [x, y, s, ph] of tw) { const k = 0.35 + 0.65 * Math.abs(Math.sin(time * 1.1 + ph)); sparkle(c, x, y, s * k, 0.18); }
      c.fill();
    },
  });
  // the monorail running along its beam, and the ferry crossing the bay
  p.live('live', {
    t: 9.8, d: 0.6, reveal: 'fade', box: { x: PX0, y: 1440, w: PX1 - PX0, h: 70 },
    draw: (c, time) => {
      const x = PX0 - 300 + (((time - 9.8) * 70 + 380) % (PX1 - PX0 + 600));
      const y = 1502;
      c.fillStyle = CREAM; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 250, y); c.quadraticCurveTo(x + 296, y - 4, x + 300, y - 30); c.quadraticCurveTo(x + 296, y - 50, x + 250, y - 52); c.lineTo(x + 20, y - 52); c.quadraticCurveTo(x, y - 50, x, y - 30); c.closePath(); c.fill();
      c.fillStyle = ORANGE; c.fillRect(x + 4, y - 22, 280, 12);
      c.fillStyle = NAVY2; c.beginPath();
      for (let k = 0; k < 10; k++) c.rect(x + 14 + k * 24, y - 44, 16, 14);
      c.rect(x + 262, y - 44, 26, 14); c.fill();
    },
  });
  p.live('live', {
    t: 6.0, d: 1.0, reveal: 'fade', box: { x: PX0, y: 1360, w: 1080, h: 80 },
    draw: (c, time) => {
      const x = 1040 - (time - 6) * 7, y = 1420;
      c.fillStyle = CREAM; poly(c, [[x - 90, y - 14], [x + 90, y - 14], [x + 80, y], [x - 80, y]]); c.fill();
      c.fillStyle = '#2e7d5a'; c.fillRect(x - 86, y - 14, 172, 5);
      c.fillStyle = CREAM; c.fillRect(x - 64, y - 28, 128, 14); c.fillRect(x - 40, y - 38, 80, 10);
      c.fillStyle = NAVY2; c.beginPath(); for (let k = 0; k < 10; k++) c.rect(x - 58 + k * 12, y - 25, 7, 6); c.fill();
      c.fillStyle = NAVY; c.fillRect(x - 6, y - 52, 12, 14);
      c.fillStyle = TEAL_L; c.fillRect(x + 92, y - 2, 60, 3); c.fillRect(x + 100, y + 4, 40, 2);
    },
  });
}

// ================================================================ the name
function title(p, r) {
  p.type('title', 'PUGET SOUND · WASHINGTON', W / 2, 1700, { family: F, size: 30, color: NAVY, align: 'center', track: 0.32, t: 10.2, gap: 0.025, d: 0.35, reveal: 'fade' });
  p.type('title', 'SEATTLE', W / 2 + 6, 1893, { family: F, size: 240, color: ORANGE, shadow: NAVY, sx: 9, sy: 9, align: 'center', track: 0.04, fit: 1260, t: 10.8, gap: 0.16, d: 0.8, reveal: 'press' });
  p.type('title', 'SPACE NEEDLE · MOUNT RAINIER · ELLIOTT BAY', W / 2, 1944, { family: F, size: 24, color: TEAL_D, align: 'center', track: 0.22, t: 12.2, gap: 0.012, d: 0.3, reveal: 'fade' });
  // sparkles and boomerangs on the paper either side of the name
  p.group('title', { x: 40, y: 1660, w: W - 80, h: 300 }, (c) => {
    c.fillStyle = GOLD; c.beginPath();
    sparkle(c, 120, 1740, 26); sparkle(c, 1480, 1760, 22); sparkle(c, 170, 1910, 12); sparkle(c, 1430, 1900, 14);
    c.fill();
    c.fillStyle = TEAL; c.beginPath(); c.arc(1500, 1700, 6, 0, Math.PI * 2); c.arc(100, 1830, 5, 0, Math.PI * 2); c.fill();
  }, { t: 12.6, d: 0.6, reveal: 'pop' });
}
