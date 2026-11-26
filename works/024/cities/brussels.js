// Brussels: a clear-line comic album cover. Flat colors inside even black
// outlines, no hatching. The name on top in Bangers; a big panel of the
// Grand-Place with the town hall's Gothic spire on the left and the gilded guild
// houses on the right, a carpet of begonias laid on the square and little people
// round it; under it a strip of three small panels: the Galeries Royales
// Saint-Hubert, the cathedral of St. Michael and St. Gudula, and the Palais de
// Justice with its dome.

import { Plate, W, H } from '../print.js';
import { Ground, poly, rng, lerp, shade } from '../kit.js';

const INK = '#1b1b1d', PAPER = '#f5f0e2', WHITE = '#fffdf6';
const SKY = '#8fcfe8', SKY_L = '#bfe4f1';
const SAND = '#ecd3a0', SAND_S = '#cfae74', SAND_D = '#b48f57';
const SLATE = '#56708f', SLATE_D = '#3f5674', SLATE_L = '#7d97b4';
const WIN = '#35587e', WIN_L = '#7fb0d6';
const GOLD = '#f3b724', GOLD_D = '#c98612', GOLD_L = '#ffe07a';
const PAVE = '#d8ccb2', PAVE_L = '#e7ddc6', PAVE_LINE = '#b9a98a';
const BED = '#2f5e2c', BOX = '#24461f';
const RED = '#d8352a', ORANGE = '#f07d22', YELLOW = '#f8cf2c', PINK = '#ef7aa4', CREAM = '#fff4d8', WINE = '#9b1f3a', LEAF = '#4f8f3a';
const SKIN = '#f6c9a0';

export const city = {
  id: 'brussels', name: 'Brussels', wall: '#23324a',
  alt: 'A clear-line comic album cover of the Grand-Place: the town hall with its Gothic spire on the left, the gilded guild houses on the right with the dome of the Roy d’Espagne, a carpet of begonias laid on the square and little people round it, a Belgian flag and pigeons in the sky, and below, small panels of the Galeries Royales Saint-Hubert, the cathedral of St. Michael and St. Gudula and the Palais de Justice, under the name BRUXELLES',
  google: 'family=Bangers',
  fonts: [['400 250px "Bangers"', 'BRUXELLES'], ['400 40px "Bangers"', 'GRAND-PLACE · GROTE MARKT GALERIES SAINT-HUBERT STS-MICHEL-ET-GUDULE PALAIS DE JUSTICE BRUSSEL BRUSSELS']],
  build,
};

const FONT = '"Bangers", sans-serif';
// the panels: the big one, and three in a strip under it
const M = 56, GAP = 28;
const P0 = { x: M, y: 352, w: W - 2 * M, h: 1112 };
const SY = P0.y + P0.h + GAP, SH = H - M - SY;
const SW = (P0.w - 2 * GAP) / 3;
const PS = [0, 1, 2].map((i) => ({ x: M + i * (SW + GAP), y: SY, w: SW, h: SH }));
// the square seen from a balcony: its far side at FOOT
const G = new Ground({ cx: 800, hy: 1012, y0: P0.y + P0.h, U: 1300, K: 1 });
const FOOT = 1104;

function build() {
  const p = new Plate({ paper: PAPER, seed: 1695 });
  p.clip = { x: P0.x, y: P0.y, w: P0.w, h: P0.h };
  p.stack('sheet', 'sky', 'cloud', 'square', 'carpet', 'hall', 'tower', 'houses', 'gold', 'people', 'strip', 'live', 'frame', 'title');
  for (const n of ['sheet', 'strip', 'frame', 'title']) p.layer(n, { clip: false });

  frames(p);
  sky(p);
  square(p);
  townHall(p);
  guildHouses(p);
  carpet(p);
  people(p);
  galeries(p, PS[0]);
  cathedral(p, PS[1]);
  palais(p, PS[2]);
  title(p);
  life(p);
  return p;
}

// ---------------------------------------------------------------- small helpers
// fill a shape and give it the even black line of the style
function ol(c, pts, fill, lw = 2.4) {
  poly(c, pts);
  if (fill) { c.fillStyle = fill; c.fill(); }
  c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke();
}
function rectO(c, x, y, w, h, fill, lw = 2.2) { ol(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, lw); }
// a simpler, exact pointed arch: two arcs of radius w meeting over the middle
function arch(x, y, w, h, n = 10) {
  const spring = y - h + w * 0.86;
  const pts = [[x, y], [x, spring]];
  for (let i = 1; i <= n; i++) { const a = Math.PI - (i / n) * (Math.PI / 3); pts.push([x + w + Math.cos(a) * w, spring - Math.sin(a) * w]); }
  for (let i = n - 1; i >= 0; i--) { const a = (i / n) * (Math.PI / 3); pts.push([x + Math.cos(a) * w, spring - Math.sin(a) * w]); }
  pts.push([x + w, spring], [x + w, y]);
  return pts;
}
// a round arch
function roundArch(x, y, w, h, n = 12) {
  const r = w / 2, spring = y - h + r;
  const pts = [[x, y], [x, spring]];
  for (let i = 1; i < n; i++) { const a = Math.PI + (i / n) * Math.PI; pts.push([x + r + Math.cos(a) * r, spring + Math.sin(a) * r]); }
  pts.push([x + w, spring], [x + w, y]);
  return pts;
}
// a puffy comic cloud: stroke every puff, then fill them all
function cloudPuffs(r, x, y, w) {
  const n = Math.max(3, Math.round(w / 46)), puffs = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, lift = Math.sin(t * Math.PI);
    puffs.push([x + t * w, y - 10 - lift * 26 * r.range(0.8, 1.2), (w / n) * r.range(0.62, 0.8) * (0.8 + 0.5 * lift)]);
  }
  return puffs;
}
function drawCloud(c, puffs, y) {
  c.save();
  c.beginPath(); c.rect(0, 0, W, y); c.clip();
  c.strokeStyle = INK; c.lineWidth = 5;
  for (const [x, yy, rr] of puffs) { c.beginPath(); c.arc(x, yy, rr, 0, Math.PI * 2); c.stroke(); }
  c.fillStyle = WHITE;
  for (const [x, yy, rr] of puffs) { c.beginPath(); c.arc(x, yy, rr, 0, Math.PI * 2); c.fill(); }
  // a flat blue-white shadow under the heap
  c.fillStyle = '#dff1f8';
  for (const [x, yy, rr] of puffs) { c.beginPath(); c.arc(x + rr * 0.15, yy + rr * 0.35, rr * 0.75, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = WHITE;
  for (const [x, yy, rr] of puffs) { c.beginPath(); c.arc(x - rr * 0.1, yy - rr * 0.1, rr * 0.8, 0, Math.PI * 2); c.fill(); }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(puffs[0][0] - puffs[0][2] * 0.8, y); c.lineTo(puffs[puffs.length - 1][0] + puffs[puffs.length - 1][2] * 0.8, y); c.stroke();
}

// ---------------------------------------------------------------- the panels' borders
function frames(p) {
  const all = [P0, ...PS];
  all.forEach((b, i) => {
    const pts = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h], [b.x, b.y]];
    p.pen('frame', pts, INK, 7, { t: 0.05 + i * 0.22, d: 1.1, cap: 'square' });
  });
}

// ---------------------------------------------------------------- the sky
function sky(p) {
  p.group('sky', { x: P0.x, y: P0.y, w: P0.w, h: FOOT - P0.y + 10 }, (c) => {
    c.fillStyle = SKY; c.fillRect(P0.x, P0.y, P0.w, FOOT - P0.y + 10);
    // a paler band low down, flat, as a colorist would lay it
    c.fillStyle = SKY_L; c.fillRect(P0.x, 860, P0.w, FOOT - 860 + 10);
  }, { t: 0.4, d: 1.0, reveal: 'fall', ease: 'soft' });
  const r = rng(31);
  const clouds = [[1040, 520, 300], [1250, 640, 230], [610, 470, 180], [150, 600, 160], [870, 760, 150]];
  clouds.forEach(([x, y, w], i) => {
    const puffs = cloudPuffs(r, x, y, w);
    p.group('cloud', { x: x - 60, y: y - 120, w: w + 120, h: 132 }, (c) => drawCloud(c, puffs, y), { t: 1.0 + i * 0.18, d: 0.7, reveal: 'pop' });
  });
}

// ---------------------------------------------------------------- the square
function square(p) {
  p.group('square', { x: P0.x, y: FOOT - 6, w: P0.w, h: P0.y + P0.h - FOOT + 6 }, (c) => {
    c.fillStyle = PAVE; c.fillRect(P0.x, FOOT, P0.w, P0.y + P0.h - FOOT);
    // a lighter band of pavement along the foot of the houses
    c.fillStyle = PAVE_L; c.fillRect(P0.x, FOOT, P0.w, 14);
    c.strokeStyle = INK; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(P0.x, FOOT); c.lineTo(P0.x + P0.w, FOOT); c.stroke();
  }, { t: 1.2, d: 0.8, reveal: 'fade' });
  // the cobbles: rows across the square and lines running to the far side
  const lines = [];
  for (let v = 0.05; v < 4.2; v *= 1.16) lines.push([G.P(-2, v + 0.04), G.P(2, v + 0.04)]);
  for (let u = -1.6; u <= 1.6; u += 0.1) lines.push([G.P(u, 0), G.P(u, 4.2)]);
  p.strokes('square', lines, PAVE_LINE, 1.1, { t: 1.5, d: 1.2, reveal: 'wipe', box: { x: P0.x, y: FOOT, w: P0.w, h: P0.y + P0.h - FOOT } });
}

// ---------------------------------------------------------------- the town hall
const TH0 = 40, TH1 = 752, TX = 432; // its front and the axis of the tower
const ARC = 1024, F1 = 948, F2 = 878, PAR = 852, RIDGE = 724;

function townHall(p) {
  // the body: the front, its two floors and the arcade
  p.group('hall', { x: TH0 - 4, y: PAR - 8, w: TH1 - TH0 + 8, h: FOOT - PAR + 14 }, (c) => {
    rectO(c, TH0, PAR, TH1 - TH0, FOOT - PAR, SAND, 2.6);
    // a string course between the floors
    c.fillStyle = SAND_S;
    for (const y of [ARC - 6, F1 - 6, F2 - 6]) { c.fillRect(TH0, y, TH1 - TH0, 6); }
    c.strokeStyle = INK; c.lineWidth = 1.6;
    c.beginPath();
    for (const y of [ARC - 6, ARC, F1 - 6, F1, F2 - 6, F2]) { c.moveTo(TH0, y); c.lineTo(TH1, y); }
    c.stroke();
  }, { t: 2.0, d: 1.1, reveal: 'rise' });
  // the arcade at the foot: seventeen pointed arches, the tower's porch wider
  p.group('hall', { x: TH0, y: ARC - 4, w: TH1 - TH0, h: FOOT - ARC + 6 }, (c) => {
    const n = 17, step = (TH1 - TH0 - 20) / n;
    for (let i = 0; i < n; i++) {
      const x = TH0 + 10 + i * step + 5;
      ol(c, arch(x, FOOT, step - 10, FOOT - ARC - 8), '#6b5b4a', 2);
    }
    // the shade inside the arcade
    c.fillStyle = '#4b3f35';
    for (let i = 0; i < n; i++) { const x = TH0 + 10 + i * step + 5; c.fillRect(x + 2, FOOT - 26, step - 14, 24); }
  }, { t: 2.7, d: 0.8, reveal: 'wipe' });
  // two floors of tall windows, statues in niches between them
  const nW = 22, ws = (TH1 - TH0 - 24) / nW;
  for (const [y0, y1, k] of [[ARC - 6, F1, 0], [F1 - 6, F2, 1]]) {
    p.group('hall', { x: TH0, y: y1 - 4, w: TH1 - TH0, h: y0 - y1 + 8 }, (c) => {
      for (let i = 0; i < nW; i++) {
        const x = TH0 + 12 + i * ws;
        if (Math.abs(x + ws / 2 - TX) < 70) continue; // the tower's face
        if (i % 2 === 0) {
          ol(c, arch(x + 3, y0 - 6, ws * 0.7, y0 - y1 - 14), WIN, 1.8);
          c.strokeStyle = WIN_L; c.lineWidth = 1.2;
          c.beginPath(); c.moveTo(x + 3 + ws * 0.35, y0 - 8); c.lineTo(x + 3 + ws * 0.35, y1 + 18); c.moveTo(x + 4, y0 - (y0 - y1) * 0.45); c.lineTo(x + 2 + ws * 0.7, y0 - (y0 - y1) * 0.45); c.stroke();
        } else {
          // a niche with a little stone figure
          ol(c, arch(x + ws * 0.15, y0 - 10, ws * 0.62, (y0 - y1) * 0.7), SAND_S, 1.4);
          const fx = x + ws * 0.46, fy = y0 - 12;
          c.fillStyle = SAND_D;
          c.beginPath(); c.moveTo(fx - 4, fy); c.lineTo(fx - 3, fy - 22); c.lineTo(fx + 3, fy - 22); c.lineTo(fx + 4, fy); c.closePath(); c.fill();
          c.beginPath(); c.arc(fx, fy - 26, 3.5, 0, Math.PI * 2); c.fill();
          c.fillStyle = SAND; c.fillRect(fx - 7, fy, 14, 3); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(fx - 7, fy, 14, 3);
          // a small canopy over the niche
          c.fillStyle = SAND_S; poly(c, [[fx - 8, y1 + 14 + k], [fx, y1 + 2], [fx + 8, y1 + 14 + k]]); c.fill(); c.stroke();
        }
      }
    }, { t: 3.0 + k * 0.35, d: 0.9, reveal: 'wipe' });
  }
  // the roof: steep slate, three rows of dormers, a crest along the ridge
  p.group('hall', { x: TH0 - 6, y: RIDGE - 30, w: TH1 - TH0 + 12, h: PAR - RIDGE + 34 }, (c) => {
    ol(c, [[TH0 + 6, PAR], [TH0 + 50, RIDGE], [TH1 - 50, RIDGE], [TH1 - 6, PAR]], SLATE, 2.6);
    // the crest
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath();
    for (let x = TH0 + 56; x < TH1 - 56; x += 12) { c.moveTo(x, RIDGE); c.lineTo(x, RIDGE - 9); c.moveTo(x - 3, RIDGE - 6); c.lineTo(x + 3, RIDGE - 6); }
    c.stroke();
    // slate courses, flat lines of a darker blue
    c.strokeStyle = SLATE_D; c.lineWidth = 1.2; c.beginPath();
    for (let y = RIDGE + 14; y < PAR; y += 14) { const k = (y - RIDGE) / (PAR - RIDGE); c.moveTo(lerp(TH0 + 50, TH0 + 6, k) + 3, y); c.lineTo(lerp(TH1 - 50, TH1 - 6, k) - 3, y); }
    c.stroke();
  }, { t: 3.3, d: 1.0, reveal: 'rise' });
  // dormers, row by row, popping in
  const rows = [[PAR - 32, 26, 34, 22], [PAR - 74, 22, 44, 18], [PAR - 108, 16, 58, 14]];
  rows.forEach(([y, s, pitch, h], k) => {
    const xs = [];
    const k0 = (PAR - y) / (PAR - RIDGE);
    for (let x = lerp(TH0 + 6, TH0 + 50, k0) + pitch * 0.6; x < lerp(TH1 - 6, TH1 - 50, k0) - pitch * 0.4; x += pitch) if (Math.abs(x - TX) > 74) xs.push(x);
    p.group('hall', { x: TH0, y: y - h - s - 6, w: TH1 - TH0, h: h + s + 12 }, (c) => {
      for (const x of xs) {
        ol(c, [[x - s / 2, y], [x - s / 2, y - h], [x, y - h - s * 0.7], [x + s / 2, y - h], [x + s / 2, y]], SAND, 1.6);
        rectO(c, x - s * 0.26, y - h * 0.82, s * 0.52, h * 0.7, WIN, 1.2);
      }
    }, { t: 3.9 + k * 0.22, d: 0.6, reveal: 'pop' });
  });
  // the parapet: a gallery of small arches and pinnacles along the cornice
  p.group('hall', { x: TH0 - 4, y: PAR - 34, w: TH1 - TH0 + 8, h: 40 }, (c) => {
    rectO(c, TH0, PAR - 12, TH1 - TH0, 14, SAND_S, 1.8);
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath();
    for (let x = TH0 + 6; x < TH1; x += 9) { c.moveTo(x, PAR); c.lineTo(x, PAR - 8); }
    c.stroke();
    for (let x = TH0 + 30; x < TH1 - 10; x += 56) {
      if (Math.abs(x - TX) < 70) continue;
      ol(c, [[x - 4, PAR - 12], [x - 4, PAR - 22], [x, PAR - 32], [x + 4, PAR - 22], [x + 4, PAR - 12]], SAND, 1.4);
    }
  }, { t: 4.2, d: 0.7, reveal: 'wipe' });
  // the corner turrets, octagonal with pointed caps
  for (const [x, t] of [[TH0 + 18, 4.3], [TH1 - 18, 4.45]]) {
    p.group('hall', { x: x - 30, y: 680, w: 60, h: PAR - 670 }, (c) => {
      rectO(c, x - 16, 790, 32, PAR - 790, SAND, 2);
      c.fillStyle = SAND_S; c.fillRect(x + 4, 792, 11, PAR - 794);
      c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + 4, 792); c.lineTo(x + 4, PAR); c.stroke();
      rectO(c, x - 5, 808, 9, 22, WIN, 1.2);
      ol(c, [[x - 20, 792], [x, 690], [x + 20, 792]], SLATE, 2);
      c.fillStyle = GOLD; c.beginPath(); c.arc(x, 686, 5, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke();
    }, { t, d: 0.8, reveal: 'rise' });
  }
  tower(p);
}

// the tower: a square shaft over the porch, then open octagonal stages, each
// narrower, ringed with pinnacles, then the openwork spire and the gilded figure
function tower(p) {
  const stages = [
    // [y foot, y top, half width, kind]
    [FOOT, 656, 58, 'shaft'],
    [656, 606, 48, 'belfry'],
    [606, 556, 37, 'oct'],
    [556, 514, 28, 'oct'],
    [514, 484, 20, 'oct'],
  ];
  stages.forEach(([y0, y1, hw, kind], i) => {
    const t = 3.6 + i * 0.42;
    p.group('tower', { x: TX - hw - 26, y: y1 - 40, w: 2 * hw + 52, h: y0 - y1 + 44 }, (c) => {
      if (kind === 'shaft') {
        rectO(c, TX - hw, y1, 2 * hw, y0 - y1, SAND, 2.6);
        // the shaded side, flat
        c.fillStyle = SAND_S; c.fillRect(TX + hw * 0.45, y1 + 2, hw * 0.55 - 1.5, y0 - y1 - 4);
        c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(TX + hw * 0.45, y1); c.lineTo(TX + hw * 0.45, y0); c.stroke();
        // the porch: a tall pointed doorway with the figure in the tympanum
        ol(c, arch(TX - 30, FOOT, 60, 120), '#4b3f35', 2.4);
        ol(c, arch(TX - 22, FOOT - 70, 44, 40), SAND_S, 1.6);
        // windows climbing the shaft and the clock-less blind arcades
        for (let y = ARC - 10; y > y1 + 50; y -= 64) {
          ol(c, arch(TX - 34, y, 26, 48), WIN, 1.6);
          ol(c, arch(TX + 8, y, 26, 48), WIN, 1.6);
        }
        c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath();
        for (let y = ARC - 6; y > y1 + 30; y -= 64) { c.moveTo(TX - hw, y); c.lineTo(TX + hw, y); }
        c.stroke();
      } else {
        // a stage: its body, tall pointed openings, a balustrade on top, pinnacles at the corners
        rectO(c, TX - hw, y1, 2 * hw, y0 - y1, SAND, 2.4);
        c.fillStyle = SAND_S; c.fillRect(TX + hw * 0.5, y1 + 2, hw * 0.5 - 1.5, y0 - y1 - 4);
        const n = kind === 'belfry' ? 3 : 2, ow = (2 * hw - 12) / n;
        for (let k = 0; k < n; k++) ol(c, arch(TX - hw + 6 + k * ow + ow * 0.12, y0 - 6, ow * 0.76, (y0 - y1) * 0.78), '#3b4a62', 1.6);
        rectO(c, TX - hw - 4, y1 - 6, 2 * hw + 8, 8, SAND_S, 1.6);
        for (const sx of [-1, 1]) {
          const x = TX + sx * (hw + 2);
          ol(c, [[x - 5, y1 + 4], [x - 5, y1 - 14], [x, y1 - 36], [x + 5, y1 - 14], [x + 5, y1 + 4]], SAND, 1.6);
          // flying buttress back to the stage above
          c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y1 - 12); c.quadraticCurveTo(x - sx * 8, y1 - 22, x - sx * 16, y1 - 30); c.stroke();
        }
      }
    }, { t, d: 0.75, reveal: 'rise' });
  });
  // the spire, openwork, with crockets along its edges
  p.group('tower', { x: TX - 36, y: 380, w: 72, h: 112 }, (c) => {
    ol(c, [[TX - 19, 486], [TX - 2, 392], [TX + 2, 392], [TX + 19, 486]], SAND, 2.2);
    c.fillStyle = '#3b4a62';
    for (let k = 0; k < 6; k++) { const y = 478 - k * 14, w = 15 * (1 - k / 6.5); c.fillRect(TX - w / 2, y - 9, w, 8); }
    c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath();
    for (let k = 1; k < 10; k++) { const y = 486 - k * 9.4, dx = 19 * (1 - k / 10) + 2 * (k / 10); c.moveTo(TX - dx, y); c.lineTo(TX - dx - 6, y - 4); c.moveTo(TX + dx, y); c.lineTo(TX + dx + 6, y - 4); }
    c.stroke();
  }, { t: 5.75, d: 0.7, reveal: 'rise' });
  // the gilded figure on the top, a small dark-outlined shape with a raised arm
  p.group('gold', { x: TX - 18, y: 352, w: 36, h: 44 }, (c) => {
    c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 1.4;
    poly(c, [[TX - 4, 393], [TX - 3, 376], [TX - 8, 372], [TX - 2, 370], [TX - 1, 366], [TX + 2, 366], [TX + 3, 372], [TX + 10, 362], [TX + 11, 364], [TX + 4, 376], [TX + 4, 393]]); c.fill(); c.stroke();
    c.beginPath(); c.arc(TX, 363, 3, 0, Math.PI * 2); c.fill(); c.stroke();
  }, { t: 6.2, d: 0.6, reveal: 'pop' });
}

// ---------------------------------------------------------------- the guild houses
// each: [x0, x1, cornice, gable top, gable kind, color]
const HOUSES = [
  [770, 975, 868, 752, 'dome', '#dcc08f'],
  [975, 1100, 884, 744, 'volute', '#c4a079'],
  [1100, 1222, 872, 726, 'stack', '#e2cda4'],
  [1222, 1360, 862, 748, 'pediment', '#b9a790'],
  [1360, 1486, 874, 724, 'stern', '#d8b88a'],
  [1486, 1600, 884, 760, 'volute', '#c9ad86'],
];

// the outline of a baroque gable over a cornice
function gable(kind, x0, x1, yb, yt) {
  const w = x1 - x0, h = yb - yt, cx = (x0 + x1) / 2;
  const half = [];
  const q = (ax, ay, bx, by, cx2, cy2, n = 8) => { for (let i = 1; i <= n; i++) { const t = i / n; half.push([(1 - t) ** 2 * ax + 2 * (1 - t) * t * bx + t * t * cx2, (1 - t) ** 2 * ay + 2 * (1 - t) * t * by + t * t * cy2]); } };
  if (kind === 'volute') {
    half.push([x0 + w * 0.04, yb]);
    q(x0 + w * 0.04, yb, x0 + w * 0.22, yb - h * 0.05, x0 + w * 0.2, yb - h * 0.36);
    half.push([x0 + w * 0.28, yb - h * 0.36]);
    q(x0 + w * 0.28, yb - h * 0.36, x0 + w * 0.4, yb - h * 0.42, x0 + w * 0.34, yb - h * 0.72);
    half.push([x0 + w * 0.4, yb - h * 0.72]);
    q(x0 + w * 0.4, yb - h * 0.72, x0 + w * 0.42, yb - h, cx, yb - h);
  } else if (kind === 'stack') {
    half.push([x0 + w * 0.03, yb], [x0 + w * 0.03, yb - h * 0.2]);
    q(x0 + w * 0.03, yb - h * 0.2, x0 + w * 0.2, yb - h * 0.2, x0 + w * 0.16, yb - h * 0.42);
    half.push([x0 + w * 0.22, yb - h * 0.42], [x0 + w * 0.22, yb - h * 0.6]);
    q(x0 + w * 0.22, yb - h * 0.6, x0 + w * 0.36, yb - h * 0.6, x0 + w * 0.32, yb - h * 0.8);
    half.push([x0 + w * 0.36, yb - h * 0.8]);
    q(x0 + w * 0.36, yb - h * 0.8, cx - w * 0.12, yb - h * 1.02, cx, yb - h);
  } else if (kind === 'pediment') {
    half.push([x0 + w * 0.02, yb], [x0 + w * 0.02, yb - h * 0.34], [x0 + w * 0.16, yb - h * 0.34], [x0 + w * 0.16, yb - h * 0.44], [cx, yb - h * 0.82]);
  } else if (kind === 'stern') {
    // the Cornet: a gable like the stern of a ship
    half.push([x0 + w * 0.04, yb]);
    q(x0 + w * 0.04, yb, x0 - w * 0.02, yb - h * 0.45, x0 + w * 0.2, yb - h * 0.62);
    q(x0 + w * 0.2, yb - h * 0.62, x0 + w * 0.12, yb - h * 0.86, x0 + w * 0.32, yb - h * 0.9);
    q(x0 + w * 0.32, yb - h * 0.9, cx - w * 0.1, yb - h * 1.04, cx, yb - h);
  }
  const right = half.slice().reverse().map(([x, y]) => [2 * cx - x, y]);
  return [...half, ...right];
}

function guildHouses(p) {
  HOUSES.forEach(([x0, x1, yc, yt, kind, col], i) => {
    const t = 3.0 + i * 0.32;
    const w = x1 - x0;
    // the front: floors of windows between pilasters
    p.group('houses', { x: x0 - 4, y: yc - 6, w: w + 8, h: FOOT - yc + 10 }, (c) => {
      rectO(c, x0, yc, w, FOOT - yc, col, 2.6);
      // the ground floor: shop arches
      const n = kind === 'dome' ? 4 : 3, aw = (w - 16) / n;
      c.fillStyle = shade(col, 0.82); c.fillRect(x0 + 2, FOOT - 66, w - 4, 64);
      for (let k = 0; k < n; k++) ol(c, roundArch(x0 + 8 + k * aw + 5, FOOT, aw - 10, 56), '#5a4636', 1.8);
      // floors
      const floors = Math.round((FOOT - 72 - yc) / 52);
      const fh = (FOOT - 72 - yc) / floors;
      c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath();
      for (let f = 0; f <= floors; f++) { const y = FOOT - 70 - f * fh; c.moveTo(x0, y); c.lineTo(x1, y); }
      c.stroke();
      const cols = kind === 'dome' ? 5 : 3, cw = w / cols;
      for (let f = 0; f < floors; f++) {
        const yb = FOOT - 74 - f * fh;
        for (let k = 0; k < cols; k++) {
          const x = x0 + k * cw + cw * 0.24;
          rectO(c, x, yb - fh * 0.74, cw * 0.52, fh * 0.66, WIN, 1.5);
          c.strokeStyle = WIN_L; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x + cw * 0.26, yb - fh * 0.72); c.lineTo(x + cw * 0.26, yb - fh * 0.1); c.moveTo(x + 2, yb - fh * 0.48); c.lineTo(x + cw * 0.52 - 2, yb - fh * 0.48); c.stroke();
        }
        // pilasters between the bays
        c.fillStyle = shade(col, 0.9);
        for (let k = 1; k < cols; k++) { const x = x0 + k * cw; c.fillRect(x - 3, yb - fh + 6, 6, fh - 4); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(x - 3, yb - fh + 6, 6, fh - 4); }
      }
    }, { t, d: 1.0, reveal: 'rise' });
    // the gable or the dome over the cornice
    if (kind === 'dome') {
      const cx = (x0 + x1) / 2;
      p.group('houses', { x: x0 - 4, y: yt - 60, w: w + 8, h: yc - yt + 66 }, (c) => {
        // a balustrade with urns along the cornice
        rectO(c, x0 - 2, yc - 16, w + 4, 16, shade(col, 0.88), 2);
        c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); for (let x = x0 + 6; x < x1; x += 8) { c.moveTo(x, yc - 2); c.lineTo(x, yc - 14); } c.stroke();
        // the octagonal drum and its dome
        rectO(c, cx - 50, yc - 70, 100, 54, col, 2.2);
        c.fillStyle = shade(col, 0.82); c.fillRect(cx + 18, yc - 68, 31, 50);
        for (let k = 0; k < 3; k++) ol(c, roundArch(cx - 38 + k * 28, yc - 24, 18, 36), WIN, 1.4);
        c.beginPath(); c.moveTo(cx - 54, yc - 70); c.bezierCurveTo(cx - 52, yt + 4, cx + 52, yt + 4, cx + 54, yc - 70); c.closePath();
        c.fillStyle = SLATE; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
        c.strokeStyle = SLATE_D; c.lineWidth = 1.4; c.beginPath();
        for (const k of [-0.6, -0.25, 0.25, 0.6]) { c.moveTo(cx + k * 54, yc - 70); c.quadraticCurveTo(cx + k * 40, yt + 20, cx + k * 6, yt + 16); }
        c.stroke();
        // the lantern
        rectO(c, cx - 9, yt - 10, 18, 26, col, 1.8);
      }, { t: t + 0.9, d: 0.9, reveal: 'rise' });
    } else {
      const pts = gable(kind, x0, x1, yc, yt);
      p.group('houses', { x: x0 - 20, y: yt - 10, w: w + 40, h: yc - yt + 14 }, (c) => {
        ol(c, pts, col, 2.4);
        // a window or an oculus in the gable
        const cx = (x0 + x1) / 2, h = yc - yt;
        rectO(c, cx - 14, yc - h * 0.36, 28, h * 0.3, WIN, 1.5);
        c.beginPath(); c.arc(cx, yc - h * 0.62, 9, 0, Math.PI * 2); c.fillStyle = WIN; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
        // its cornice ledge
        rectO(c, x0 - 3, yc - 6, w + 6, 8, shade(col, 0.88), 1.8);
      }, { t: t + 0.9, d: 0.8, reveal: 'rise' });
    }
  });
  gilding(p);
}

// the gold: friezes along the floors, edges of the gables, the figures and
// urns on top. All popped in after the stone.
function gilding(p) {
  HOUSES.forEach(([x0, x1, yc, yt, kind], i) => {
    const t = 6.3 + i * 0.16, cx = (x0 + x1) / 2, w = x1 - x0;
    p.group('gold', { x: x0 - 22, y: yt - 64, w: w + 44, h: FOOT - yt + 70 }, (c) => {
      c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 1.3;
      // a gilded frieze under the cornice and over the shops
      for (const y of [yc + 4, FOOT - 76]) {
        c.fillStyle = GOLD; c.fillRect(x0 + 4, y, w - 8, 6); c.strokeRect(x0 + 4, y, w - 8, 6);
        c.fillStyle = GOLD_D; for (let x = x0 + 10; x < x1 - 8; x += 12) c.fillRect(x, y + 2, 4, 2);
      }
      // gilded garlands over some windows
      c.strokeStyle = GOLD_D; c.lineWidth = 2.4; c.beginPath();
      for (let x = x0 + w / 6; x < x1; x += w / 3) { c.moveTo(x - 12, yc + 24); c.quadraticCurveTo(x, yc + 34, x + 12, yc + 24); }
      c.stroke();
      if (kind === 'dome') {
        // the gilded figure on the lantern, arms out, and urns on the balustrade
        c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 1.4;
        c.beginPath(); c.arc(cx, yt - 16, 7, 0, Math.PI * 2); c.fill(); c.stroke();
        poly(c, [[cx - 5, yt - 22], [cx - 4, yt - 40], [cx - 14, yt - 50], [cx - 12, yt - 53], [cx - 2, yt - 45], [cx, yt - 50], [cx + 2, yt - 45], [cx + 12, yt - 56], [cx + 14, yt - 53], [cx + 4, yt - 40], [cx + 5, yt - 22]]); c.fill(); c.stroke();
        c.beginPath(); c.arc(cx, yt - 53, 3.5, 0, Math.PI * 2); c.fill(); c.stroke();
        for (let x = x0 + 12; x < x1 - 4; x += (w - 24) / 5) {
          poly(c, [[x - 5, yc - 16], [x - 7, yc - 26], [x, yc - 32], [x + 7, yc - 26], [x + 5, yc - 16]]); c.fill(); c.stroke();
        }
      } else {
        // a gold line along the gable's edge and a figure on its top
        const pts = gable(kind, x0, x1, yc, yt);
        c.strokeStyle = GOLD; c.lineWidth = 3.4; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(pts[0][0] + 4, pts[0][1] - 3); for (let k = 1; k < pts.length; k++) c.lineTo(pts[k][0] + (pts[k][0] < cx ? 4 : -4), pts[k][1] + 4); c.stroke();
        const top = kind === 'pediment' ? yc - (yc - yt) * 0.82 : yt;
        c.fillStyle = GOLD; c.strokeStyle = INK; c.lineWidth = 1.4;
        if (kind === 'pediment') {
          // the phoenix on the Louve, wings up
          poly(c, [[cx - 4, top], [cx - 22, top - 34], [cx - 6, top - 22], [cx, top - 40], [cx + 6, top - 22], [cx + 22, top - 34], [cx + 4, top]]); c.fill(); c.stroke();
        } else if (kind === 'stern') {
          // a gilded lantern-like finial and two horn-like volutes
          poly(c, [[cx - 6, top], [cx - 8, top - 18], [cx, top - 30], [cx + 8, top - 18], [cx + 6, top]]); c.fill(); c.stroke();
          c.beginPath(); c.arc(cx, top - 34, 4, 0, Math.PI * 2); c.fill(); c.stroke();
        } else {
          poly(c, [[cx - 5, top], [cx - 4, top - 24], [cx - 8, top - 28], [cx - 2, top - 30], [cx, top - 35], [cx + 2, top - 30], [cx + 8, top - 28], [cx + 4, top - 24], [cx + 5, top]]); c.fill(); c.stroke();
          c.beginPath(); c.arc(cx, top - 38, 3.6, 0, Math.PI * 2); c.fill(); c.stroke();
        }
        // urns at the shoulders
        for (const sx of [-1, 1]) {
          const x = cx + sx * w * 0.42, y = yc - 6;
          poly(c, [[x - 4, y], [x - 6, y - 10], [x, y - 16], [x + 6, y - 10], [x + 4, y]]); c.fill(); c.stroke();
        }
      }
    }, { t, d: 0.6, reveal: 'pop' });
  });
  // a flagpole on the Roy d'Espagne's balustrade (its flag is live)
  const [x0, , yc] = HOUSES[0];
  p.group('gold', { x: x0 + 10, y: yc - 150, w: 20, h: 140 }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x0 + 20, yc - 16); c.lineTo(x0 + 20, yc - 142); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.arc(x0 + 20, yc - 144, 4.5, 0, Math.PI * 2); c.fill(); c.lineWidth = 1.3; c.stroke();
  }, { t: 7.2, d: 0.5, reveal: 'rise' });
}

// ---------------------------------------------------------------- the carpet of begonias
const CU = 0.55, CV0 = 0.3, CV1 = 2.7; // its half width and its near and far edges
// the design, in coordinates x across -1..1 and y along -3..3 (near is -3)
function design(x, y) {
  const ax = Math.abs(x), ay = Math.abs(y);
  if (ax > 0.9 || ay > 2.9) return 'R';
  if (ax > 0.84 || ay > 2.84) return 'Y';
  // three great rosettes along the strip
  for (const cy of [-1.85, 0, 1.85]) {
    const dx = x, dy = y - cy, r = Math.hypot(dx, dy);
    if (r < 0.74) {
      if (r < 0.16) return 'Y';
      if (r < 0.22) return 'W';
      const a = Math.atan2(dy, dx), petal = Math.cos(a * 8);
      if (r < 0.52 + 0.1 * petal) return cy === 0 ? 'P' : 'O';
      if (r < 0.6 + 0.08 * petal) return 'W';
      if (r > 0.66) return 'G';
      return 'R';
    }
  }
  // between the rosettes, a diamond lattice of yellow on wine
  const d = Math.abs(((x + y) * 2.2 % 1 + 1) % 1 - 0.5), e = Math.abs(((x - y) * 2.2 % 1 + 1) % 1 - 0.5);
  if (d < 0.07 || e < 0.07) return 'Y';
  if (d > 0.36 && e > 0.36) return 'W';
  return 'V';
}
const BLOOM = { R: RED, Y: YELLOW, W: CREAM, P: PINK, O: ORANGE, G: LEAF, V: WINE };

function carpet(p) {
  // the bed of greenery under the flowers
  const corners = [G.P(-CU, CV0), G.P(CU, CV0), G.P(CU, CV1), G.P(-CU, CV1)];
  p.fill('carpet', corners, BED, { t: 5.6, d: 0.7, reveal: 'fade', line: INK, lw: 2.6 });
  // the flowers, as a mosaic of cells, laid in bands from the far end to the near
  const nx = 54, ny = 132, cells = [];
  for (let j = 0; j < ny; j++) {
    const v0 = lerp(CV1, CV0, j / ny), v1 = lerp(CV1, CV0, (j + 1) / ny);
    for (let i = 0; i < nx; i++) {
      const u0 = lerp(-CU, CU, i / nx), u1 = lerp(-CU, CU, (i + 1) / nx);
      const x = lerp(-1, 1, (i + 0.5) / nx), y = lerp(3, -3, (j + 0.5) / ny);
      const k = design(x, y);
      // each cell a little inset, so the green shows between the blooms
      const gu = (u1 - u0) * 0.07, gv = (v0 - v1) * 0.08;
      cells.push([j, k, [G.P(u0 + gu, v1 + gv), G.P(u1 - gu, v1 + gv), G.P(u1 - gu, v0 - gv), G.P(u0 + gu, v0 - gv)]]);
    }
  }
  const bands = 8;
  for (let b = 0; b < bands; b++) {
    const mine = cells.filter(([j]) => Math.floor(j * bands / ny) === b);
    const byColor = {};
    for (const [, k, q] of mine) (byColor[k] ||= []).push(q);
    const ys = mine.flatMap(([, , q]) => q.map((pt) => pt[1]));
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const xl = G.P(-CU, lerp(CV1, CV0, (b + 1) / bands))[0], xr = G.P(CU, lerp(CV1, CV0, (b + 1) / bands))[0];
    p.group('carpet', { x: xl - 4, y: y0 - 4, w: xr - xl + 8, h: y1 - y0 + 8 }, (c) => {
      for (const k in byColor) {
        c.fillStyle = BLOOM[k]; c.beginPath();
        for (const q of byColor[k]) { c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.lineTo(q[2][0], q[2][1]); c.lineTo(q[3][0], q[3][1]); c.closePath(); }
        c.fill();
      }
    }, { t: 5.9 + b * 0.3, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  }
  // the boxwood edges round the rosettes and along the border, drawn by a pen
  const toScreen = (x, y) => G.P(x * CU, lerp(CV0, CV1, (y + 3) / 6));
  [-1.85, 0, 1.85].forEach((cy, i) => {
    const ring = [];
    for (let k = 0; k <= 64; k++) { const a = (k / 64) * Math.PI * 2; ring.push(toScreen(Math.cos(a) * 0.74, cy + Math.sin(a) * 0.74)); }
    p.pen('carpet', ring, BOX, 2.6, { t: 8.4 + i * 0.15, d: 0.9 });
  });
}

// ---------------------------------------------------------------- the people
// little clear-line figures: a round head, a coat, legs; some with a hat, an
// umbrella, a balloon or a dog
function people(p) {
  const r = rng(1958);
  const coats = ['#e2483b', '#2f6db3', '#f2c230', '#3b8f5a', '#7a4fa0', '#f08a3a', '#2a2f3a', '#d9d4c4', '#1f7f8f', '#b23a5e'];
  const hair = ['#3a2a1e', '#6b4a2a', '#d9a74a', '#1d1d1d', '#a8432a', '#bfbab0'];
  const folk = [];
  const spot = (u, v) => Math.abs(u) < CU + 0.06 && v > CV0 - 0.12 && v < CV1 + 0.1;
  for (let i = 0; i < 90; i++) {
    let u, v, tries = 0;
    do { u = r.range(-1.15, 1.15); v = r.chance(0.4) ? r.range(0.0, 0.3) : r.range(0.1, 3.6); tries++; } while (spot(u, v) && tries < 30);
    if (spot(u, v)) continue;
    const [x, y] = G.P(u, v);
    if (x < P0.x + 10 || x > P0.x + P0.w - 10) continue;
    const s = G.s(v) * 1.35;
    folk.push({ x, y, s, v, coat: r.pick(coats), legs: r.pick(['#2a2f3a', '#3b4a62', '#5a4636', '#2a2f3a']), hair: r.pick(hair), hat: r.chance(0.25), skirt: r.chance(0.35), face: r.chance(0.5) ? 1 : -1,
      kit: r.chance(0.08) ? 'umbrella' : r.chance(0.07) ? 'balloon' : r.chance(0.07) ? 'dog' : r.chance(0.1) ? 'camera' : '', step: r.range(-1, 1) });
  }
  folk.sort((a, b) => b.v - a.v);
  // in groups, far ones first
  const groups = 6;
  for (let g = 0; g < groups; g++) {
    const mine = folk.filter((_, i) => i % groups === g);
    if (!mine.length) continue;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const f of mine) { x0 = Math.min(x0, f.x - 60 * f.s); x1 = Math.max(x1, f.x + 60 * f.s); y0 = Math.min(y0, f.y - 110 * f.s); y1 = Math.max(y1, f.y + 8); }
    p.group('people', { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, (c) => { for (const f of mine) figure(c, f); }, { t: 8.7 + g * 0.22, d: 0.6, reveal: 'drop', dy: 18 });
  }
}

function figure(c, f) {
  const { x, y, s } = f;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.lineJoin = 'round'; c.lineCap = 'round';
  // a shadow on the paving
  c.fillStyle = 'rgba(80,70,50,.25)'; c.beginPath(); c.ellipse(4, 0, 14, 3.5, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.8;
  // legs
  c.fillStyle = f.legs;
  poly(c, [[-6 + f.step * 2, 0], [-2, -24], [2, -24], [-1 + f.step * 2, 0]]); c.fill(); c.stroke();
  poly(c, [[1, 0], [1, -24], [5, -24], [6 - f.step * 2, 0]]); c.fill(); c.stroke();
  // coat or skirt
  c.fillStyle = f.coat;
  if (f.skirt) poly(c, [[-11, -16], [-6, -46], [6, -46], [11, -16]]);
  else poly(c, [[-8, -20], [-7, -46], [7, -46], [8, -20]]);
  c.fill(); c.stroke();
  // an arm
  c.lineWidth = 4.4; c.strokeStyle = INK; c.beginPath(); c.moveTo(6 * f.face, -42); c.lineTo(9 * f.face, -26); c.stroke();
  c.lineWidth = 2.6; c.strokeStyle = f.coat; c.beginPath(); c.moveTo(6 * f.face, -42); c.lineTo(9 * f.face, -26); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.8;
  // head
  c.fillStyle = SKIN; c.beginPath(); c.arc(0, -54, 7.5, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = f.hair;
  if (f.hat) { poly(c, [[-10, -57], [10, -57], [6, -60], [6, -66], [-6, -66], [-6, -60]]); c.fillStyle = '#3b3f4a'; c.fill(); c.stroke(); }
  else { c.beginPath(); c.arc(0, -55, 7.6, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fill(); c.stroke(); }
  // a dot of an eye toward where they look
  c.fillStyle = INK; c.beginPath(); c.arc(3.2 * f.face, -54, 1.1, 0, Math.PI * 2); c.fill();
  if (f.kit === 'umbrella') {
    c.lineWidth = 1.6; c.beginPath(); c.moveTo(9 * f.face, -26); c.lineTo(9 * f.face, -76); c.stroke();
    c.fillStyle = '#e2483b'; c.beginPath(); c.moveTo(9 * f.face - 20, -74); c.quadraticCurveTo(9 * f.face, -98, 9 * f.face + 20, -74); c.closePath(); c.fill(); c.stroke();
  } else if (f.kit === 'balloon') {
    c.lineWidth = 1; c.beginPath(); c.moveTo(9 * f.face, -26); c.quadraticCurveTo(14 * f.face, -60, 12 * f.face, -88); c.stroke();
    c.fillStyle = '#e2483b'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(12 * f.face, -98, 8, 10, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  } else if (f.kit === 'dog') {
    c.fillStyle = WHITE; c.lineWidth = 1.5;
    const dx = 22 * f.face;
    poly(c, [[dx - 9, -5], [dx - 9, -12], [dx + 6, -12], [dx + 6, -5]]); c.fill(); c.stroke();
    c.beginPath(); c.arc(dx + 9 * Math.sign(f.face), -15, 4.5, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(dx - 7, -5); c.lineTo(dx - 7, 0); c.moveTo(dx + 4, -5); c.lineTo(dx + 4, 0); c.moveTo(9 * f.face, -26); c.lineTo(dx, -12); c.stroke();
  } else if (f.kit === 'camera') {
    c.fillStyle = '#2a2f3a'; c.fillRect(6 * f.face - 4, -56, 8, 6);
  }
  c.restore();
}

// ---------------------------------------------------------------- the strip
function inside(c, b) { c.save(); c.beginPath(); c.rect(b.x, b.y, b.w, b.h); c.clip(); }
function caption(p, b, text, t) {
  // a yellow caption box in the panel's corner
  const m = measure(`400 30px ${FONT}`, text);
  const w = m + 28;
  p.group('strip', { x: b.x - 2, y: b.y - 2, w: w + 6, h: 50 }, (c) => {
    rectO(c, b.x, b.y, w, 44, YELLOW, 3);
    c.font = `400 30px ${FONT}`; c.fillStyle = INK; c.textBaseline = 'alphabetic'; c.fillText(text, b.x + 14, b.y + 34);
  }, { t, d: 0.5, reveal: 'wipe' });
}
let mc = null;
function measure(font, text) {
  mc ||= (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  mc.font = font; return mc.measureText(text).width;
}

// the Galeries Royales Saint-Hubert: down the arcade under its glass vault
function galeries(p, b) {
  const vx = b.x + b.w / 2, vy = b.y + b.h * 0.56;
  const depth = [1, 0.74, 0.55, 0.41, 0.31, 0.235, 0.18, 0.14, 0.11];
  // [half width, floor, cornice, vault top] at scale 1
  const HW = 220, FL = 170, CO = -80, VT = -250;
  const P = (x, y, s) => [vx + x * s, vy + y * s];
  p.group('strip', b, (c) => {
    inside(c, b);
    c.fillStyle = '#d4ecf3'; c.fillRect(b.x, b.y, b.w, b.h);
    // the floor, its tiles running to the far end
    c.fillStyle = '#e2d2b2'; poly(c, [P(-HW, FL, 1.6), P(HW, FL, 1.6), P(HW, FL, 0.06), P(-HW, FL, 0.06)]); c.fill();
    c.strokeStyle = '#c4b08c'; c.lineWidth = 1.2; c.beginPath();
    for (let k = -4; k <= 4; k++) { c.moveTo(...P(k * HW / 5, FL, 1.6)); c.lineTo(...P(k * HW / 5, FL, 0.06)); }
    for (const s of [1.2, 0.9, 0.68, 0.52, 0.4, 0.3, 0.23]) { c.moveTo(...P(-HW, FL, s)); c.lineTo(...P(HW, FL, s)); }
    c.stroke();
    c.restore();
  }, { t: 6.8, d: 0.7, reveal: 'fall' });
  p.group('strip', b, (c) => {
    inside(c, b);
    // the walls, cream, three floors of a bay stepping back to the far end
    for (const sx of [-1, 1]) {
      c.fillStyle = '#f3e2bf';
      poly(c, [P(sx * HW, FL, 1.6), P(sx * HW, CO, 1.6), P(sx * HW, CO, 0.06), P(sx * HW, FL, 0.06)]); c.fill();
    }
    c.lineWidth = 1.5; c.strokeStyle = INK;
    const S = [1.6, ...depth.slice(1)];
    for (let k = 0; k < S.length - 1; k++) {
      const s0 = S[k], s1 = S[k + 1];
      for (const sx of [-1, 1]) {
        const X = sx * HW;
        const at = (f, y) => { const s = lerp(s0, s1, f); return [vx + X * s, vy + y * s]; };
        const quad = (f0, f1, y0, y1, col) => { c.fillStyle = col; poly(c, [at(f0, y0), at(f1, y0), at(f1, y1), at(f0, y1)]); c.fill(); c.stroke(); };
        quad(0.16, 0.84, FL, 70, '#f6c45e');     // the lit shop window
        quad(0.16, 0.84, 70, 54, '#3b4a62');     // its sign board
        quad(0.24, 0.76, 34, -2, '#7fa6c4');     // the mezzanine window
        quad(0.24, 0.76, -22, -64, '#7fa6c4');   // the upper window
        // the pilaster between bays
        c.beginPath(); c.moveTo(...at(1, FL)); c.lineTo(...at(1, CO)); c.stroke();
      }
    }
    // the cornices running to the far end
    c.lineWidth = 2; c.beginPath();
    for (const sx of [-1, 1]) for (const y of [CO, 44, 10]) { c.moveTo(...P(sx * HW, y, 1.6)); c.lineTo(...P(sx * HW, y, 0.06)); }
    c.stroke();
    // the end of the gallery, far off
    c.fillStyle = '#f3e2bf'; poly(c, [P(-HW, FL, 0.06), P(HW, FL, 0.06), P(HW, CO, 0.06), P(-HW, CO, 0.06)]); c.fill(); c.stroke();
    c.restore();
  }, { t: 7.1, d: 0.8, reveal: 'iris' });
  // the glass vault: iron ribs, arched, getting smaller toward the end
  p.group('strip', b, (c) => {
    inside(c, b);
    c.strokeStyle = INK;
    for (const s of [1.6, ...depth.slice(1)]) {
      c.lineWidth = Math.max(1.2, 3.6 * s / 1.6);
      c.beginPath(); c.moveTo(...P(-HW, CO, s)); c.bezierCurveTo(...P(-HW, VT, s), ...P(HW, VT, s), ...P(HW, CO, s)); c.stroke();
    }
    // the ridge and two purlins
    c.lineWidth = 1.4; c.beginPath();
    for (const k of [-0.5, 0, 0.5]) { const yy = k === 0 ? VT * 0.75 : VT * 0.62; const a = P(k * HW, yy, 1.6), z = P(k * HW, yy, 0.06); c.moveTo(a[0], a[1]); c.lineTo(z[0], z[1]); }
    c.stroke();
    // shoppers on the floor
    for (const [x, y, s, col] of [[-110, FL, 0.62, '#e2483b'], [70, FL, 0.45, '#2f6db3'], [-40, FL, 0.3, '#3b8f5a'], [130, FL, 0.95, '#f2c230'], [20, FL, 0.22, '#7a4fa0'], [-150, FL, 1.2, '#1f7f8f']]) {
      const [px, py] = P(x, y, s);
      figure(c, { x: px, y: py, s: s * 1.6, coat: col, legs: '#2a2f3a', hair: '#3a2a1e', hat: s > 0.6, skirt: s < 0.5, face: x < 0 ? 1 : -1, kit: '', step: 0.3 });
    }
    c.restore();
  }, { t: 7.6, d: 0.8, reveal: 'fade' });
  caption(p, b, 'GALERIES SAINT-HUBERT', 9.0);
}

// the cathedral: two square towers with flat tops over a Gothic front
function cathedral(p, b) {
  const cx = b.x + b.w / 2, gy = b.y + b.h - 54;
  p.group('strip', b, (c) => {
    inside(c, b);
    c.fillStyle = SKY; c.fillRect(b.x, b.y, b.w, b.h);
    c.fillStyle = SKY_L; c.fillRect(b.x, gy - 120, b.w, 120);
    c.fillStyle = '#9fbf6a'; c.fillRect(b.x, gy, b.w, b.h);
    c.restore();
  }, { t: 7.2, d: 0.7, reveal: 'fall' });
  const ST = '#ece0c4', ST_S = '#cdbb93';
  p.group('strip', b, (c) => {
    inside(c, b);
    // trees either side
    for (const [x, rr, col] of [[b.x + 40, 46, '#4f8f3a'], [b.x + b.w - 44, 52, '#3f7f34'], [b.x + 92, 34, '#5f9f44']]) {
      c.fillStyle = '#6b4a2a'; c.fillRect(x - 4, gy - 30, 8, 30);
      c.fillStyle = col; c.beginPath(); c.arc(x, gy - 30 - rr * 0.8, rr, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }
    // the nave's gable between the towers
    ol(c, [[cx - 70, gy - 160], [cx, gy - 250], [cx + 70, gy - 160]], ST, 2.4);
    for (const sx of [-1, 1]) {
      const x0 = sx < 0 ? cx - 150 : cx + 70;
      // a tower: three stages, buttresses, tall louvered openings, a flat top
      rectO(c, x0, gy - 300, 80, 300, ST, 2.6);
      c.fillStyle = ST_S; c.fillRect(x0 + (sx < 0 ? 2 : 56), gy - 298, 22, 296);
      c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath();
      for (const y of [gy - 110, gy - 200]) { c.moveTo(x0, y); c.lineTo(x0 + 80, y); }
      c.moveTo(x0 + (sx < 0 ? 24 : 56), gy - 300); c.lineTo(x0 + (sx < 0 ? 24 : 56), gy); c.stroke();
      ol(c, arch(x0 + 28, gy - 212, 24, 76), '#3b4a62', 1.6);
      ol(c, arch(x0 + 30, gy - 120, 20, 60), '#3b4a62', 1.6);
      // the open parapet and the corner pinnacles at the top
      rectO(c, x0 - 4, gy - 312, 88, 14, ST_S, 2);
      for (const px of [x0 + 2, x0 + 78]) ol(c, [[px - 5, gy - 312], [px, gy - 336], [px + 5, gy - 312]], ST, 1.6);
    }
    // the center: the great window and the portals
    rectO(c, cx - 70, gy - 160, 140, 160, ST, 2.6);
    ol(c, arch(cx - 44, gy - 70, 88, 96), '#3b4a62', 2);
    c.strokeStyle = WIN_L; c.lineWidth = 1.4; c.beginPath();
    for (const k of [-22, 0, 22]) { c.moveTo(cx + k, gy - 72); c.lineTo(cx + k, gy - 140); }
    c.stroke();
    c.beginPath(); c.arc(cx, gy - 140, 14, 0, Math.PI * 2); c.stroke();
    ol(c, arch(cx - 22, gy, 44, 58), '#4b3f35', 2);
    for (const sx of [-1, 1]) ol(c, arch(cx + sx * 110 - 14, gy, 28, 44), '#4b3f35', 1.8);
    // the steps
    for (let k = 0; k < 4; k++) rectO(c, cx - 180 - k * 14, gy + k * 9, 360 + k * 28, 9, '#e7dcc4', 1.4);
    c.restore();
  }, { t: 7.5, d: 1.0, reveal: 'rise' });
  caption(p, b, 'STS-MICHEL-ET-GUDULE', 9.2);
}

// the Palais de Justice: a heaped mass of colonnades under its great dome
function palais(p, b) {
  const cx = b.x + b.w / 2, gy = b.y + b.h - 44;
  const ST = '#e2d6bb', ST_S = '#bfae8a';
  p.group('strip', b, (c) => {
    inside(c, b);
    c.fillStyle = '#f2c26a'; c.fillRect(b.x, b.y, b.w, b.h);
    c.fillStyle = '#f6d690'; c.beginPath(); c.arc(cx + 130, b.y + 130, 46, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke();
    c.fillStyle = '#c9a26a'; c.fillRect(b.x, gy, b.w, b.h);
    c.restore();
  }, { t: 7.8, d: 0.7, reveal: 'fall' });
  p.group('strip', b, (c) => {
    inside(c, b);
    c.translate(cx, gy); c.scale(0.8, 0.8); c.translate(-cx, -gy);
    // the base block with its portico
    rectO(c, cx - 230, gy - 120, 460, 120, ST, 2.6);
    c.fillStyle = ST_S; c.fillRect(cx - 228, gy - 24, 456, 22);
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath();
    for (let x = cx - 210; x <= cx + 210; x += 28) { c.moveTo(x, gy - 104); c.lineTo(x, gy - 26); }
    c.moveTo(cx - 230, gy - 104); c.lineTo(cx + 230, gy - 104); c.stroke();
    ol(c, [[cx - 90, gy - 120], [cx, gy - 168], [cx + 90, gy - 120]], ST, 2.2);
    // the square drum, then the round drum with its colonnade
    rectO(c, cx - 120, gy - 230, 240, 110, ST, 2.4);
    for (let x = cx - 104; x <= cx + 104; x += 26) rectO(c, x - 6, gy - 214, 12, 80, ST_S, 1.2);
    rectO(c, cx - 82, gy - 300, 164, 70, ST, 2.4);
    c.beginPath(); for (let x = cx - 72; x <= cx + 72; x += 18) { c.moveTo(x, gy - 296); c.lineTo(x, gy - 236); } c.stroke();
    // the dome, its ribs and the crown on its lantern
    c.beginPath(); c.moveTo(cx - 86, gy - 300); c.bezierCurveTo(cx - 84, gy - 400, cx + 84, gy - 400, cx + 86, gy - 300); c.closePath();
    c.fillStyle = '#8e9a6a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
    c.strokeStyle = '#6d7a4e'; c.lineWidth = 1.6; c.beginPath();
    for (const k of [-0.6, -0.25, 0.25, 0.6]) { c.moveTo(cx + k * 86, gy - 300); c.quadraticCurveTo(cx + k * 60, gy - 370, cx + k * 10, gy - 376); }
    c.stroke();
    rectO(c, cx - 12, gy - 404, 24, 30, ST, 1.8);
    ol(c, [[cx - 14, gy - 404], [cx, gy - 430], [cx + 14, gy - 404]], GOLD, 1.8);
    // the wings stepping down either side
    for (const sx of [-1, 1]) {
      const x0 = sx < 0 ? cx - 420 : cx + 230;
      rectO(c, x0, gy - 80, 190, 80, ST, 2.2);
      c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); for (let x = x0 + 14; x < x0 + 186; x += 22) { c.moveTo(x, gy - 64); c.lineTo(x, gy - 16); } c.stroke();
    }
    c.restore();
  }, { t: 8.1, d: 1.0, reveal: 'rise' });
  caption(p, b, 'PALAIS DE JUSTICE', 9.4);
}

// ---------------------------------------------------------------- the title
function title(p) {
  // BRUXELLES, yellow with a black outline and a hard black shadow, each letter popping in
  p.type('title', 'BRUXELLES', W / 2, 300, {
    family: FONT, size: 260, color: YELLOW, stroke: INK, lw: 9, shadow: INK, sx: 12, sy: 12,
    align: 'center', track: 0.04, fit: W - 2 * M - 40, t: 10.4, gap: 0.14, d: 0.6, reveal: 'pop',
  });
  // the caption box in the big panel's corner
  const text = 'GRAND-PLACE · GROTE MARKT';
  const w = measure(`400 40px ${FONT}`, text) + 36;
  p.group('title', { x: P0.x - 2, y: P0.y - 2, w: w + 8, h: 64 }, (c) => {
    rectO(c, P0.x, P0.y, w, 58, YELLOW, 4);
    c.font = `400 40px ${FONT}`; c.fillStyle = INK; c.fillText(text, P0.x + 18, P0.y + 45);
  }, { t: 12.0, d: 0.5, reveal: 'wipe' });
  // the edition line under the strip
  p.type('title', 'BRUSSEL · BRUSSELS', W - M, H - 18, { family: FONT, size: 30, color: INK, align: 'right', track: 0.12, t: 12.4, gap: 0.03, d: 0.4 });
}

// ---------------------------------------------------------------- life
function life(p) {
  // pigeons wheeling over the square
  const r = rng(1830), birds = [];
  for (let i = 0; i < 9; i++) birds.push([r.range(780, 1350), r.range(470, 640), r.range(40, 120), r.range(0.4, 0.75) * (r.chance(0.5) ? 1 : -1), r() * 7, r.range(1.2, 1.7)]);
  p.live('live', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 1.8; c.fillStyle = '#e9edf2';
      for (const [x0, y0, rad, w, ph, s] of birds) {
        const a = time * w + ph, x = x0 + Math.cos(a) * rad, y = y0 + Math.sin(a * 1.3) * rad * 0.35;
        const f = Math.sin(time * 12 + ph * 3) * 9 * s, d = Math.sign(-Math.sin(a) * w) || 1;
        c.beginPath();
        c.moveTo(x - 9 * s * d, y + 1); c.quadraticCurveTo(x, y - 4 * s, x + 9 * s * d, y);
        c.quadraticCurveTo(x, y + 5 * s, x - 9 * s * d, y + 1); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(x - 3 * s, y - 1); c.lineTo(x - 10 * s, y - f); c.lineTo(x + 4 * s, y - 1); c.closePath(); c.fill(); c.stroke();
      }
    },
  });
  // the Belgian flag waving on the pole
  const [x0, , yc] = HOUSES[0];
  const fx = x0 + 22, fy = yc - 140;
  p.live('live', {
    t: 9.9, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      const cols = ['#1d1d1d', '#f5cf2a', '#e0302c'];
      const wave = (x, k) => Math.sin(time * 5 - x * 0.07) * 5 * k;
      for (let s = 0; s < 3; s++) {
        c.fillStyle = cols[s]; c.beginPath();
        const xa = fx + s * 30, xb = xa + 30;
        c.moveTo(xa, fy + wave(xa - fx, (xa - fx) / 90));
        c.lineTo(xb, fy + wave(xb - fx, (xb - fx) / 90));
        c.lineTo(xb, fy + 56 + wave(xb - fx, (xb - fx) / 90));
        c.lineTo(xa, fy + 56 + wave(xa - fx, (xa - fx) / 90)); c.closePath(); c.fill();
      }
      c.strokeStyle = INK; c.lineWidth = 2; c.beginPath();
      c.moveTo(fx, fy);
      for (let x = 0; x <= 90; x += 10) c.lineTo(fx + x, fy + wave(x, x / 90));
      for (let x = 90; x >= 0; x -= 10) c.lineTo(fx + x, fy + 56 + wave(x, x / 90));
      c.closePath(); c.stroke();
    },
  });
  // the gold catching the sun: small stars that flash and go
  const gl = [];
  HOUSES.forEach(([a, b, yc2, yt]) => { gl.push([(a + b) / 2, yt - 30, r() * 9]); gl.push([a + 14, yc2 + 6, r() * 9]); });
  gl.push([TX, 366, 1.3]);
  p.live('live', {
    t: 12.6, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = WHITE; c.strokeStyle = INK; c.lineWidth = 1.2;
      for (const [x, y, ph] of gl) {
        const a = Math.sin(time * 1.3 + ph);
        if (a < 0.75) continue;
        const s = (a - 0.75) / 0.25 * 11;
        c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.25, y - s * 0.25); c.lineTo(x + s, y); c.lineTo(x + s * 0.25, y + s * 0.25); c.lineTo(x, y + s); c.lineTo(x - s * 0.25, y + s * 0.25); c.lineTo(x - s, y); c.lineTo(x - s * 0.25, y - s * 0.25); c.closePath(); c.fill(); c.stroke();
      }
    },
  });
}
