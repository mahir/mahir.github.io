// Munich: a poster in the manner of Ludwig Hohlwein. No outlines: bold flat
// shapes that lock into each other, light against shadow, a spattered grain in
// the color. The Frauenkirche's two brick towers, their octagons and green
// domes, stand huge in a gold evening; the Neues Rathaus's tower with its
// Glockenspiel and its tall spire to the left; a maypole in white and blue;
// chestnut trees in flower over a beer garden. In front, large, the way
// Hohlwein drew people: a waitress carrying six steins, the low sun on her
// left side, and a man in a loden coat and a hat with a chamois tuft, seen from
// behind, raising his stein to her, and a dachshund between them. The name in
// a blackletter on a red band.

import { Plate, W, H } from '../print.js';
import { poly, rng, lerp } from '../kit.js';

const INK = '#1d1812', CREAM = '#f3e4bf';
const SKY = '#e7c062', SKY_D = '#d7a646', SKY_L = '#f2d98e';
const BRICK_L = '#c85a3a', BRICK = '#a03e2a', BRICK_D = '#5b2217', ROOF = '#7e3426';
const COP_L = '#9cbc92', COP = '#4f7c62', COP_D = '#21392d';
const STONE_L = '#a8977a', STONE = '#6b5e4c', STONE_D = '#2f2924';
const LEAF_D = '#1c2618', LEAF = '#304422', LEAF_L = '#5f7a34', BLOSSOM = '#f6eedb';
const GRAVEL = '#d7b26a', GRAVEL_L = '#f0d592', GRAVEL_D = '#9a7840';
const RED = '#a5281f', RED_D = '#741a14', RED_L = '#c8453a', BLUE = '#3d7fc0', WHITE = '#f8f1df';
const WOOD = '#3d4a2c', FOAM = '#fbf6e8', BEER = '#e2a12c', BEER_D = '#a8641a', BEER_L = '#f6cf6a';
// the people
const SKIN = '#eab48a', SKIN_D = '#b5704c', SKIN_L = '#f6d2ae';
const HAIR = '#5c3520', HAIR_D = '#2e1a10';
const LINEN = '#f7efdc', LINEN_D = '#cbbb98';
const APRON = '#3a6f9e', APRON_D = '#22476c', APRON_L = '#6c9cc6';
const LODEN = '#66704c', LODEN_L = '#97a070', LODEN_D = '#2c3322', HAT = '#2f3a22', HAT_L = '#56663a';

export const city = {
  id: 'munich', name: 'Munich', wall: '#2a1a14',
  alt: 'A poster in the manner of Ludwig Hohlwein: the two brick towers of the Frauenkirche with their green domes huge against a gold evening sky, the Neues Rathaus with its Glockenspiel and tall spire, a white and blue maypole, chestnut trees in flower over a beer garden, a waitress in a dirndl carrying six steins and a man in a loden coat and a hat with a chamois tuft raising his stein to her, a dachshund on the gravel between them, and the name München in blackletter on a red band',
  google: 'family=Grenze+Gotisch:wght@700',
  fonts: [['700 250px "Grenze Gotisch"', 'München']],
  build,
};

const FONT = '"Grenze Gotisch", serif';
const MG = 40;                      // the paper margin
const BAND = 1700, STRIP = 1674;    // the title band and the lozenges over it
const HEDGE = 1440;                 // the hedge at the back of the garden
// the Frauenkirche: two towers, each a lit front and a shaded side; a square
// shaft, an octagon on it with the clock, and the dome
const TOWERS = [{ x0: 770, x1: 935 }, { x0: 1115, x1: 1280 }];
const SIDE = 46, SQ = 650, OCT = 352, DH = 128;
// the Neues Rathaus
const RX0 = MG, RX1 = 748, RTOP = 936, TW0 = 296, TW1 = 414, SHAFT = 610;
const GL = { y0: 930, y1: 1090 }; // the Glockenspiel's oriel

function build() {
  const p = new Plate({ paper: CREAM, seed: 1468 });
  p.clip = { x: MG, y: MG, w: W - 2 * MG, h: H - 2 * MG };
  p.stack('sky', 'church', 'hall', 'pole', 'trees', 'garden', 'man', 'woman', 'band', 'live', 'title');
  for (const n of ['band', 'title']) p.layer(n, { clip: false });

  sky(p);
  frauenkirche(p);
  rathaus(p);
  maypole(p);
  chestnuts(p);
  garden(p);
  drinker(p);
  waitress(p);
  dachshund(p);
  band(p);
  life(p);
  return p;
}

// ---------------------------------------------------------------- helpers
function fillP(c, pts, col) { c.fillStyle = col; poly(c, pts); c.fill(); }
function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function boxOfPts(pts, pad = 4) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}
// the spatter of the stone-lithograph: specks inside a shape, thicker where
// dens(x, y) is high. Made at build time; drawn as one path.
function spatter(seed, pts, n, dens, size = [1.2, 3.2]) {
  const r = rng(seed), b = boxOfPts(pts, 0), out = [];
  for (let i = 0; i < n * 3 && out.length < n; i++) {
    const x = b.x + r() * b.w, y = b.y + r() * b.h;
    if (!inPoly(x, y, pts)) continue;
    if (r() > dens(x, y)) continue;
    out.push(x, y, r.range(size[0], size[1]));
  }
  return out;
}
// the same inside a drawn path (in its own units), tested on a small canvas
let mctx = null;
function spatterIn(seed, path, b, n, dens, size = [1.2, 3]) {
  mctx ||= (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  const r = rng(seed), out = [];
  for (let i = 0; i < n * 4 && out.length < n; i++) {
    const x = b.x + r() * b.w, y = b.y + r() * b.h;
    if (!mctx.isPointInPath(path, x, y)) continue;
    if (r() > dens(x, y)) continue;
    out.push(x, y, r.range(size[0], size[1]));
  }
  return out;
}
function drawSpatter(c, sp, col) {
  c.fillStyle = col; c.beginPath();
  for (let i = 0; i < sp.length; i += 3) { const s = sp[i + 2]; c.rect(sp[i] - s / 2, sp[i + 1] - s / 2, s, s * 0.9); }
  c.fill();
}
// a curve sampled into points (quadratic or cubic)
function bez(a, b, cc, d, n = 12) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    if (d) pts.push([u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * cc[0] + t ** 3 * d[0], u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * cc[1] + t ** 3 * d[1]]);
    else pts.push([u * u * a[0] + 2 * u * t * b[0] + t * t * cc[0], u * u * a[1] + 2 * u * t * b[1] + t * t * cc[1]]);
  }
  return pts;
}
function pointed(x, y, w, h) {
  const r = w, s = y - h + w * 0.85, pts = [[x, y], [x, s]];
  for (let i = 1; i < 8; i++) { const a = Math.PI - (i / 8) * Math.PI / 3; pts.push([x + w + Math.cos(a) * r, s - Math.sin(a) * r]); }
  pts.push([x + w / 2, s - Math.sin(Math.PI / 3) * r]);
  for (let i = 7; i >= 1; i--) { const a = (i / 8) * Math.PI / 3; pts.push([x + Math.cos(a) * r, s - Math.sin(a) * r]); }
  pts.push([x + w, s], [x + w, y]);
  return pts;
}
function roundArch(x, y, w, h) {
  const pts = [[x, y], [x, y - h + w / 2]];
  for (let i = 1; i < 8; i++) { const a = Math.PI + (i / 8) * Math.PI; pts.push([x + w / 2 + Math.cos(a) * w / 2, y - h + w / 2 + Math.sin(a) * w / 2]); }
  pts.push([x + w, y - h + w / 2], [x + w, y]);
  return pts;
}
// a figure is a list of [svg path, color] in its own units, set at (x, y) and scale s
function figure(parts) { return parts.map(([d, col]) => [new Path2D(d), col]); }
function drawFig(c, fig, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (const [P, col] of fig) { c.fillStyle = col; c.fill(P); }
  c.restore();
}

// ---------------------------------------------------------------- the sky
function sky(p) {
  const all = [[MG, MG], [W - MG, MG], [W - MG, BAND], [MG, BAND]];
  p.group('sky', { x: MG, y: MG, w: W - 2 * MG, h: BAND - MG }, (c) => {
    fillP(c, all, SKY);
    // flat steps of a paler glow toward the horizon, as in a lithograph
    c.fillStyle = '#ebc970'; c.fillRect(MG, 980, W - 2 * MG, BAND - 980);
    c.fillStyle = SKY_L; c.fillRect(MG, 1180, W - 2 * MG, BAND - 1180);
  }, { t: 0.2, d: 1.1, reveal: 'rise', ease: 'soft' });
  // the grain: specks of a deeper gold, thicker toward the top of the sheet
  const sp = spatter(11, all, 9000, (x, y) => Math.max(0, 1 - (y - MG) / 900) ** 1.6, [1.4, 3.6]);
  p.group('sky', { x: MG, y: MG, w: W - 2 * MG, h: 900 }, (c) => drawSpatter(c, sp, SKY_D), { t: 0.9, d: 1.0, reveal: 'fall' });
  // long flat clouds, cream lit from below, sliding in from the left
  const clouds = [[90, 330, 520, 26], [180, 380, 340, 16], [1180, 600, 360, 22], [1240, 650, 260, 14], [470, 760, 260, 18]];
  clouds.forEach(([x, y, w, h], i) => {
    p.group('sky', { x: x - 10, y: y - h - 4, w: w + 40, h: 2 * h + 8 }, (c) => {
      c.fillStyle = SKY_L;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w * 0.2, y - h, x + w * 0.5, y - h * 0.8); c.quadraticCurveTo(x + w * 0.8, y - h * 1.1, x + w, y); c.closePath(); c.fill();
      c.fillStyle = CREAM; c.fillRect(x + w * 0.1, y - 3, w * 0.85, 6);
    }, { t: 1.2 + i * 0.16, d: 0.9, reveal: 'slide', dx: -60 });
  });
}

// ---------------------------------------------------------------- the Frauenkirche
// the dome (a Welsche Haube): it rises from the octagon nearly upright, swells
// a little, and rounds over to a short lantern
function domeOutline(cx, hw) {
  const left = bez([cx - hw, OCT], [cx - hw - 12, OCT - 56], [cx - hw * 0.62, OCT - DH], [cx - 12, OCT - DH], 16);
  const right = left.slice().reverse().map(([x, y]) => [2 * cx - x, y]);
  return [...left, ...right];
}
// a rib from a point on the dome's foot up to the lantern
function rib(cx, hw, xb) {
  const k = (xb - cx) / hw;
  return bez([xb, OCT], [xb + k * 14, OCT - 58], [cx + k * hw * 0.5, OCT - DH + 2], [cx + k * 12, OCT - DH], 14);
}
function frauenkirche(p) {
  // the nave behind: its steep gable between the towers and its long roof to the right
  const gableP = [[935, 1300], [935, 840], [1025, 700], [1115, 840], [1115, 1300]];
  const roofP = [[1326, 730], [W - MG, 772], [W - MG, 1340], [1326, 1340]];
  const shadeR = spatter(21, roofP, 1800, (x) => 0.2 + 0.6 * (x - 1326) / 230);
  const shadeG = spatter(22, gableP, 900, (x, y) => 0.15 + 0.5 * (y - 700) / 600);
  p.group('church', { x: 930, y: 690, w: W - MG - 930, h: 660 }, (c) => {
    fillP(c, roofP, ROOF); drawSpatter(c, shadeR, BRICK_D);
    fillP(c, gableP, BRICK); drawSpatter(c, shadeG, BRICK_D);
    // the long roof's tile courses, and the west window between the towers
    c.fillStyle = BRICK_D; for (let y = 760; y < 1330; y += 28) c.fillRect(1326, y + (y - 760) * 0.02, W - MG - 1326, 3);
    fillP(c, pointed(996, 1250, 58, 240), BRICK_D);
    c.fillStyle = BRICK_L; c.fillRect(1022, 1050, 6, 200);
    fillP(c, roundArch(1012, 820, 26, 40), BRICK_D);
  }, { t: 1.8, d: 1.2, reveal: 'rise' });
  TOWERS.forEach(({ x0, x1 }, i) => {
    const t = 2.2 + i * 0.45, cx = (x0 + x1) / 2, w = x1 - x0;
    const front = [[x0, SQ], [x1, SQ], [x1, 1400], [x0, 1400]];
    const side = [[x1, SQ], [x1 + SIDE, SQ - 12], [x1 + SIDE, 1400], [x1, 1400]];
    // the shading on the lit face grows toward its right edge, in specks
    const sp = spatter(30 + i, front, 2600, (x) => Math.max(0, (x - x0) / w - 0.35) * 1.4);
    const lightSp = spatter(40 + i, side, 600, () => 0.5, [1, 2.4]);
    p.group('church', { x: x0 - 4, y: SQ - 20, w: w + SIDE + 8, h: 1400 - SQ + 24 }, (c) => {
      fillP(c, front, BRICK_L);
      drawSpatter(c, sp, BRICK);
      fillP(c, side, BRICK_D);
      drawSpatter(c, lightSp, BRICK);
      // the corner buttresses, flat strips with their own lit edge
      c.fillStyle = '#d46c4a'; c.fillRect(x0, SQ, 16, 1400 - SQ);
      c.fillStyle = BRICK; c.fillRect(x1 - 16, SQ, 16, 1400 - SQ);
      // the string courses, a thin dark line and a lit one
      c.fillStyle = BRICK_D;
      for (const y of [830, 1010, 1190]) c.fillRect(x0, y, w, 6);
      c.fillStyle = '#e07a55';
      for (const y of [826, 1006, 1186]) c.fillRect(x0, y, w * 0.6, 3);
      // blind panels and slit windows between the courses
      for (const y of [800, 980, 1160]) {
        fillP(c, pointed(cx - 30, y, 12, 110), BRICK_D);
        fillP(c, pointed(cx + 18, y, 12, 110), BRICK_D);
      }
      fillP(c, pointed(cx - 12, 760, 24, 70), INK);
      // the side face's own windows
      c.fillStyle = INK;
      for (const y of [800, 980, 1160]) c.fillRect(x1 + 18, y - 60, 9, 56);
    }, { t, d: 1.4, reveal: 'rise' });
    // the octagon: three facets, lit, half lit and dark
    const ox0 = x0 + 8, ox1 = x1 + SIDE - 14, ow = ox1 - ox0;
    const f1 = ox0 + ow * 0.17, f2 = ox0 + ow * 0.6;
    p.group('church', { x: ox0 - 12, y: OCT - 16, w: ow + 24, h: SQ - OCT + 24 }, (c) => {
      fillP(c, [[ox0, OCT], [f1, OCT], [f1, SQ], [ox0, SQ]], '#dd7a52');
      fillP(c, [[f1, OCT], [f2, OCT], [f2, SQ], [f1, SQ]], BRICK_L);
      fillP(c, [[f2, OCT], [ox1, OCT], [ox1, SQ], [f2, SQ]], BRICK_D);
      // a ring of small round-headed windows under the cornice
      const ring = (a, b, col, n) => { const ww = (b - a) / n; for (let k = 0; k < n; k++) fillP(c, roundArch(a + k * ww + ww * 0.28, OCT + 62, ww * 0.44, 34), col); };
      ring(ox0, f1, BRICK_D, 1); ring(f1, f2, BRICK_D, 3); ring(f2, ox1, INK, 2);
      // the tall pointed window, then the clock
      const fc = (f1 + f2) / 2;
      fillP(c, pointed(fc - 15, OCT + 190, 30, 100), INK);
      c.fillStyle = BRICK_L; c.fillRect(fc - 2, OCT + 104, 4, 86);
      fillP(c, pointed((f2 + ox1) / 2 - 8, OCT + 186, 16, 92), '#2a0f0a');
      c.fillStyle = BRICK_D; c.beginPath(); c.arc(fc, OCT + 236, 30, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e9c56a'; c.beginPath(); c.arc(fc, OCT + 236, 24, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(fc, OCT + 236); c.lineTo(fc, OCT + 218); c.moveTo(fc, OCT + 236); c.lineTo(fc + 12, OCT + 242); c.stroke();
      c.fillStyle = '#7a3a1e'; c.beginPath(); c.ellipse((f2 + ox1) / 2, OCT + 232, 13, 24, 0, 0, Math.PI * 2); c.fill();
      // the cornice under the dome and the ledge where the square shaft ends
      c.fillStyle = BRICK_D; c.fillRect(ox0 - 6, OCT, ow + 12, 12);
      c.fillStyle = '#e07a55'; c.fillRect(ox0 - 6, OCT, (f2 - ox0) + 6, 4);
      c.fillStyle = BRICK_D; c.fillRect(x0 - 4, SQ - 6, w + SIDE + 4, 12);
      c.fillStyle = '#e07a55'; c.fillRect(x0 - 4, SQ - 8, w * 0.7, 4);
      // the corners of the facets
      c.fillStyle = 'rgba(60,20,12,.35)'; c.fillRect(f1 - 1, OCT + 12, 3, SQ - OCT - 12); c.fillRect(f2 - 1, OCT + 12, 3, SQ - OCT - 12);
    }, { t: t + 1.3, d: 0.8, reveal: 'rise' });
    // the dome: copper in three facets like the octagon, the lantern and its orb
    const dcx = (ox0 + ox1) / 2, hw = ow / 2 + 6;
    const dome = domeOutline(dcx, hw);
    const r1 = rib(dcx, hw, f1), r2 = rib(dcx, hw, f2);
    p.group('church', { x: dcx - hw - 30, y: OCT - DH - 90, w: 2 * hw + 60, h: DH + 100 }, (c) => {
      fillP(c, dome, COP);
      c.save(); poly(c, dome); c.clip();
      fillP(c, [[dcx - hw - 30, OCT + 2], ...r1, [dcx - hw - 30, OCT - DH - 10]], COP_L);
      fillP(c, [...r2, [dcx + hw + 30, OCT - DH - 10], [dcx + hw + 30, OCT + 2]], COP_D);
      // a long glint on the lit facet, and a seam of copper sheets across
      c.fillStyle = '#c8dcbc'; c.beginPath(); c.ellipse(dcx - hw * 0.62, OCT - 58, 6, 36, 0.12, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(20,40,30,.4)'; c.lineWidth = 2;
      c.beginPath(); for (const f of [0.3, 0.6]) { const y = OCT - DH * f; c.moveTo(dcx - hw - 10, y); c.quadraticCurveTo(dcx, y + 8, dcx + hw + 10, y); } c.stroke();
      c.restore();
      // the lantern, its small cap and the orb
      const ly = OCT - DH;
      fillP(c, [[dcx - 13, ly + 6], [dcx + 13, ly + 6], [dcx + 11, ly - 30], [dcx - 11, ly - 30]], COP);
      fillP(c, [[dcx + 3, ly + 6], [dcx + 13, ly + 6], [dcx + 11, ly - 30], [dcx + 3, ly - 30]], COP_D);
      c.fillStyle = INK; c.fillRect(dcx - 7, ly - 22, 5, 14);
      c.fillStyle = COP_L; c.beginPath(); c.ellipse(dcx, ly - 32, 17, 14, 0, Math.PI, Math.PI * 2); c.fill();
      c.fillStyle = COP_D; c.beginPath(); c.ellipse(dcx + 6, ly - 32, 11, 14, 0, Math.PI * 1.5, Math.PI * 2); c.lineTo(dcx + 6, ly - 32); c.fill();
      c.fillStyle = '#e9c56a'; c.beginPath(); c.arc(dcx, ly - 52, 6, 0, Math.PI * 2); c.fill();
      c.fillRect(dcx - 1.5, ly - 72, 3, 16);
    }, { t: t + 2.0, d: 1.0, reveal: 'rise' });
  });
}

// ---------------------------------------------------------------- the Neues Rathaus
function rathaus(p) {
  // the front: a dark mass under a row of pointed gables and pinnacles
  const top = [];
  const gx = [RX0, 110, 190, 270, 470, 560, 650, RX1];
  top.push([RX0, RTOP + 40]);
  for (let i = 0; i < gx.length - 1; i++) {
    const a = gx[i], b = gx[i + 1];
    if (a >= TW0 - 30 && b <= TW1 + 60) { top.push([a, RTOP + 30], [b, RTOP + 30]); continue; }
    const h = 70 + ((i * 37) % 40);
    top.push([a, RTOP + 30], [a + 6, RTOP + 20], [(a + b) / 2, RTOP - h], [b - 6, RTOP + 20], [b, RTOP + 30]);
  }
  const body = [...top, [RX1, 1470], [RX0, 1470]];
  const sp = spatter(51, body, 2600, (x, y) => 0.15 + 0.5 * ((y - RTOP) / 500));
  p.group('hall', { x: RX0, y: RTOP - 130, w: RX1 - RX0 + 6, h: 1470 - RTOP + 136 }, (c) => {
    fillP(c, body, STONE);
    drawSpatter(c, sp, STONE_D);
    // the left faces of the gables catch the light
    for (let i = 0; i < gx.length - 1; i++) {
      const a = gx[i], b = gx[i + 1];
      if (a >= TW0 - 30 && b <= TW1 + 60) continue;
      const h = 70 + ((i * 37) % 40);
      fillP(c, [[a + 6, RTOP + 20], [(a + b) / 2, RTOP - h], [(a + b) / 2, RTOP + 30], [a + 6, RTOP + 30]], STONE_L);
      // pinnacles at the gable feet
      fillP(c, [[a - 5, RTOP + 30], [a, RTOP - 30], [a + 5, RTOP + 30]], STONE_D);
      // a window in each gable
      fillP(c, pointed((a + b) / 2 - 9, RTOP + 10, 18, 46), '#e3b65a');
    }
  }, { t: 3.4, d: 1.3, reveal: 'rise' });
  // rows of pointed windows, a few lit by the low sun
  const r = rng(52), wins = [];
  for (const y of [1030, 1120, 1210, 1300]) for (let x = RX0 + 18; x < RX1 - 30; x += 38) {
    if (x > TW0 - 20 && x < TW1 + 10) continue;
    wins.push([x, y, r.chance(0.28)]);
  }
  p.group('hall', { x: RX0, y: 960, w: RX1 - RX0, h: 360 }, (c) => {
    for (const [x, y, lit] of wins) {
      fillP(c, pointed(x, y, 18, 58), lit ? '#e7b552' : STONE_D);
      c.fillStyle = STONE_L; c.fillRect(x - 2, y, 22, 4);
    }
  }, { t: 4.2, d: 1.0, reveal: 'wipe' });
  // the tower's square shaft, lit on the left, with the clock high up
  const cx = (TW0 + TW1) / 2;
  const shaft = [[TW0, SHAFT], [TW1, SHAFT], [TW1, 1470], [TW0, 1470]];
  const ssp = spatter(53, shaft, 1800, (x) => 0.1 + 0.8 * Math.max(0, (x - TW0) / (TW1 - TW0) - 0.4));
  p.group('hall', { x: TW0 - 24, y: SHAFT - 70, w: TW1 - TW0 + 48, h: 1470 - SHAFT + 72 }, (c) => {
    fillP(c, shaft, STONE_L);
    drawSpatter(c, ssp, STONE);
    fillP(c, [[TW1 - 28, SHAFT], [TW1, SHAFT], [TW1, 1470], [TW1 - 28, 1470]], STONE_D);
    // corner buttresses that end in turrets with small spires over the gallery
    for (const [x, col] of [[TW0 - 10, STONE_L], [TW1 - 4, STONE_D]]) {
      c.fillStyle = col; c.fillRect(x, SHAFT - 20, 14, 1470 - SHAFT + 20);
      fillP(c, [[x - 1, SHAFT - 20], [x + 7, SHAFT - 66], [x + 15, SHAFT - 20]], col);
    }
    // the clock, square in its frame, just under the gallery
    c.fillStyle = STONE_D; c.fillRect(cx - 38, SHAFT + 40, 76, 76);
    c.fillStyle = '#e9c56a'; c.beginPath(); c.arc(cx, SHAFT + 78, 30, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, SHAFT + 78); c.lineTo(cx - 14, SHAFT + 68); c.moveTo(cx, SHAFT + 78); c.lineTo(cx, SHAFT + 56); c.stroke();
    // pairs of tall windows above and below the oriel
    for (const y of [800, 1210]) { fillP(c, pointed(TW0 + 22, y, 26, 110), STONE_D); fillP(c, pointed(TW0 + 60, y, 26, 110), STONE_D); }
    // the gallery: a balustrade of small openings
    c.fillStyle = STONE_D; c.fillRect(TW0 - 14, SHAFT - 4, TW1 - TW0 + 28, 12);
    for (let x = TW0 - 10; x < TW1 + 12; x += 10) c.fillRect(x, SHAFT - 22, 5, 20);
    c.fillRect(TW0 - 14, SHAFT - 26, TW1 - TW0 + 28, 6);
  }, { t: 4.4, d: 1.5, reveal: 'rise' });
  // the open octagon, its small gallery and the tall spire with the little figure
  const oT = 470, sT = 268;
  p.group('hall', { x: cx - 60, y: sT - 30, w: 120, h: SHAFT - sT + 10 }, (c) => {
    fillP(c, [[cx - 40, oT], [cx + 40, oT], [cx + 40, SHAFT - 24], [cx - 40, SHAFT - 24]], STONE_L);
    fillP(c, [[cx + 14, oT], [cx + 40, oT], [cx + 40, SHAFT - 24], [cx + 14, SHAFT - 24]], STONE_D);
    for (const dx of [-32, -8]) fillP(c, pointed(cx + dx, SHAFT - 34, 18, 96), SKY);
    fillP(c, pointed(cx + 20, SHAFT - 34, 12, 96), INK);
    // the small gallery and its pinnacles
    c.fillStyle = STONE_D; c.fillRect(cx - 46, oT - 6, 92, 10);
    for (const dx of [-44, -16, 16, 44]) fillP(c, [[cx + dx - 4, oT - 4], [cx + dx, oT - 34], [cx + dx + 4, oT - 4]], dx < 0 ? STONE_L : STONE_D);
    // the spire: lit and dark halves, crockets up its edges
    fillP(c, [[cx - 30, oT - 6], [cx, sT], [cx + 30, oT - 6]], STONE_L);
    fillP(c, [[cx, sT], [cx + 30, oT - 6], [cx + 4, oT - 6]], STONE_D);
    c.fillStyle = STONE_D;
    for (let k = 1; k < 7; k++) { const f = k / 7, y = lerp(oT - 6, sT, f), hx = 30 * (1 - f); c.fillRect(cx - hx - 4, y - 2, 5, 4); c.fillRect(cx + hx - 1, y - 2, 5, 4); }
    // the little figure on the very top
    c.fillStyle = INK; c.fillRect(cx - 2, sT - 22, 4, 22); c.beginPath(); c.arc(cx, sT - 25, 4, 0, Math.PI * 2); c.fill();
    c.fillRect(cx - 5, sT - 18, 10, 3);
  }, { t: 5.7, d: 0.9, reveal: 'rise' });
  // the Glockenspiel: a two-storied oriel of copper on the tower, its stages lit
  p.group('hall', { x: cx - 84, y: GL.y0 - 30, w: 168, h: GL.y1 - GL.y0 + 60 }, (c) => {
    const { y0, y1 } = GL;
    fillP(c, [[cx - 72, y0], [cx + 72, y0], [cx + 62, y1 - 10], [cx, y1 + 22], [cx - 62, y1 - 10]], COP_D);
    fillP(c, [[cx - 72, y0], [cx - 8, y0], [cx - 8, y1 + 14], [cx - 62, y1 - 10]], COP);
    c.fillStyle = '#f0c766'; c.fillRect(cx - 58, y0 + 14, 116, 54); c.fillRect(cx - 58, y0 + 84, 116, 50);
    c.fillStyle = COP_D; for (const x of [cx - 20, cx + 18]) { c.fillRect(x - 3, y0 + 14, 6, 54); c.fillRect(x - 3, y0 + 84, 6, 50); }
    fillP(c, [[cx - 80, y0], [cx, y0 - 24], [cx + 80, y0]], COP_D);
    fillP(c, [[cx - 80, y0], [cx, y0 - 24], [cx, y0]], COP_L);
  }, { t: 6.0, d: 0.8, reveal: 'pop' });
}

// ---------------------------------------------------------------- the maypole
const MX = 704;
function maypole(p) {
  const top = 620, foot = 1450;
  const wAt = (y) => lerp(7, 13, (y - top) / (foot - top));
  // its spiral of white and blue
  const stripes = [];
  for (let y = top; y < foot; y += 22) stripes.push(y);
  p.group('pole', { x: MX - 20, y: top - 20, w: 40, h: foot - top + 24 }, (c) => {
    fillP(c, [[MX - wAt(top), top], [MX + wAt(top), top], [MX + wAt(foot), foot], [MX - wAt(foot), foot]], WHITE);
    c.fillStyle = BLUE;
    for (const y of stripes) {
      const w0 = wAt(y), w1 = wAt(y + 11);
      poly(c, [[MX - w0, y + 8], [MX + w0, y], [MX + w1, y + 11], [MX - w1, y + 19]]); c.fill();
    }
    c.fillStyle = 'rgba(30,40,60,.35)'; c.fillRect(MX + 3, top, 10, foot - top);
  }, { t: 6.4, d: 1.1, reveal: 'rise' });
  // the boards of the crafts on brackets, two wreaths and the crown of fir
  const boards = [];
  for (let k = 0; k < 6; k++) boards.push([k % 2 ? 1 : -1, 720 + k * 105, k]);
  p.group('pole', { x: MX - 110, y: top - 70, w: 220, h: foot - top + 30 }, (c) => {
    for (const [s, y, k] of boards) {
      c.fillStyle = INK; c.fillRect(s > 0 ? MX : MX - 46, y - 2, 46, 4);
      const bx = MX + s * 46 - (s < 0 ? 52 : 0);
      c.fillStyle = WHITE; c.fillRect(bx, y - 30, 52, 40);
      c.fillStyle = BLUE; c.fillRect(bx + 3, y - 27, 46, 34);
      // a tiny silhouette of a craft on each
      c.fillStyle = WHITE;
      if (k % 3 === 0) { c.beginPath(); c.arc(bx + 26, y - 10, 9, 0, Math.PI * 2); c.fill(); }
      else if (k % 3 === 1) { poly(c, [[bx + 14, y + 2], [bx + 26, y - 22], [bx + 38, y + 2]]); c.fill(); }
      else { c.fillRect(bx + 16, y - 18, 20, 16); }
    }
    for (const y of [690, 1000]) { c.strokeStyle = LEAF; c.lineWidth = 6; c.beginPath(); c.ellipse(MX, y, 34, 8, 0, 0, Math.PI * 2); c.stroke(); }
    fillP(c, [[MX - 24, top + 4], [MX, top - 60], [MX + 24, top + 4]], LEAF_D);
    fillP(c, [[MX - 24, top + 4], [MX, top - 60], [MX, top + 4]], LEAF);
  }, { t: 7.2, d: 0.7, reveal: 'pop' });
}

// ---------------------------------------------------------------- the chestnut trees
const TREES = [
  { tx: 230, cx: 250, cy: 1170, rx: 250, ry: 190, seed: 61 },
  { tx: 1450, cx: 1400, cy: 1190, rx: 230, ry: 180, seed: 62 },
];
function chestnuts(p) {
  TREES.forEach((T, i) => {
    const r = rng(T.seed), lobes = [], lights = [], candles = [];
    for (let k = 0; k < 16; k++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.75;
      lobes.push([T.cx + Math.cos(a) * T.rx * d, T.cy + Math.sin(a) * T.ry * d * 0.9, r.range(70, 120)]);
    }
    // the lit side: lobes on the upper left only
    for (const [x, y, rad] of lobes) if (x < T.cx + 40 && y < T.cy + 30) lights.push([x - rad * 0.2, y - rad * 0.25, rad * 0.62]);
    // the white candles of blossom, upright cones
    for (let k = 0; k < 46; k++) {
      const [x, y, rad] = r.pick(lobes), a = r() * Math.PI * 2, d = r() * rad * 0.8;
      candles.push([x + Math.cos(a) * d, y + Math.sin(a) * d - 10, r.range(12, 22)]);
    }
    const trunkX = T.tx;
    p.group('trees', { x: trunkX - 40, y: T.cy, w: 80, h: 1500 - T.cy }, (c) => {
      fillP(c, [[trunkX - 22, 1500], [trunkX - 14, T.cy + 40], [trunkX + 14, T.cy + 40], [trunkX + 24, 1500]], INK);
      fillP(c, [[trunkX - 22, 1500], [trunkX - 14, T.cy + 40], [trunkX - 4, T.cy + 40], [trunkX - 8, 1500]], '#4b3a26');
    }, { t: 6.6 + i * 0.3, d: 0.8, reveal: 'rise' });
    p.group('trees', { x: T.cx - T.rx - 130, y: T.cy - T.ry - 130, w: 2 * T.rx + 260, h: 2 * T.ry + 260 }, (c) => {
      c.fillStyle = LEAF_D;
      for (const [x, y, rad] of lobes) { c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = LEAF;
      for (const [x, y, rad] of lights) { c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = LEAF_L;
      for (const [x, y, rad] of lights) { c.beginPath(); c.arc(x - rad * 0.25, y - rad * 0.25, rad * 0.45, 0, Math.PI * 2); c.fill(); }
    }, { t: 7.0 + i * 0.3, d: 1.0, reveal: 'fade' });
    p.group('trees', { x: T.cx - T.rx - 130, y: T.cy - T.ry - 150, w: 2 * T.rx + 260, h: 2 * T.ry + 260 }, (c) => {
      for (const [x, y, h] of candles) {
        fillP(c, [[x - h * 0.28, y], [x, y - h], [x + h * 0.28, y]], BLOSSOM);
        c.fillStyle = '#e48a7a'; c.fillRect(x - 1.5, y - h * 0.45, 3, 3);
      }
    }, { t: 8.0 + i * 0.2, d: 0.7, reveal: 'fade' });
  });
}

// ---------------------------------------------------------------- the beer garden
function garden(p) {
  const ground = [[MG, HEDGE], [W - MG, HEDGE], [W - MG, BAND], [MG, BAND]];
  // shade under the trees and dapples of light, made once
  const dark = spatter(71, ground, 3000, (x, y) => 0.15 + 0.6 * Math.max(0, 1 - Math.min(Math.abs(x - 260), Math.abs(x - 1380)) / 420) * (1 - (y - HEDGE) / 400));
  const r = rng(72), dapples = [];
  for (let k = 0; k < 50; k++) dapples.push([r.range(MG, W - MG), r.range(HEDGE + 20, BAND - 10), r.range(10, 34)]);
  p.group('garden', { x: MG, y: HEDGE - 30, w: W - 2 * MG, h: BAND - HEDGE + 30 }, (c) => {
    fillP(c, ground, GRAVEL);
    drawSpatter(c, dark, GRAVEL_D);
    // the hedge at the back of the garden
    c.fillStyle = LEAF_D; c.fillRect(MG, HEDGE - 24, W - 2 * MG, 34);
    c.fillStyle = LEAF;
    for (let x = MG; x < W - MG; x += 26) { c.beginPath(); c.arc(x + 13, HEDGE - 22, 14, Math.PI, Math.PI * 2); c.fill(); }
    c.fillStyle = GRAVEL_L;
    for (const [x, y, rr] of dapples) { c.beginPath(); c.ellipse(x, y, rr, rr * 0.35, 0, 0, Math.PI * 2); c.fill(); }
  }, { t: 7.4, d: 0.9, reveal: 'fade' });
  // a long table at the back, its steins waiting
  const y = 1540, x0 = 470, x1 = 1010;
  const folk = [[520], [590], [672], [752], [836], [912]];
  p.group('garden', { x: x0 - 10, y: y - 150, w: x1 - x0 + 20, h: 220 }, (c) => {
    for (const [x] of folk) { c.fillStyle = BEER; c.fillRect(x + 12, y - 26, 13, 22); c.fillStyle = FOAM; c.fillRect(x + 11, y - 30, 15, 6); }
    // the table top, its edge in light, the trestles and the bench
    fillP(c, [[x0, y], [x1, y], [x1 - 12, y - 10], [x0 + 12, y - 10]], '#6a7a48');
    c.fillStyle = WOOD; c.fillRect(x0, y, x1 - x0, 8);
    c.fillStyle = INK;
    for (const x of [x0 + 30, (x0 + x1) / 2, x1 - 30]) { poly(c, [[x - 14, y + 50], [x - 3, y + 8], [x + 3, y + 8], [x + 14, y + 50]]); c.fill(); }
    c.fillStyle = WOOD; c.fillRect(x0 + 20, y + 34, x1 - x0 - 40, 8);
  }, { t: 8.2, d: 0.8, reveal: 'drop', dy: 16 });
}

// ---------------------------------------------------------------- the drinker
// a man seen from behind at the front table, turning to the right, his right
// arm raising a glass stein. The sun is on his left: back and hat brim lit, the
// side under the raised arm in deep shadow that runs into the tree behind him.
const MAN = { x: -30, y: 1178, s: 1.45 };
function drinker(p) {
  const { x, y, s } = MAN;
  const coat = 'M104,128 C78,140 52,170 40,214 C30,252 26,300 24,360 L18,480 L346,480 L338,330 C332,268 318,214 290,180 C270,156 236,136 206,126 C176,140 134,140 104,128 Z';
  const fig = figure([
    // the loden coat: mid tone, the lit back, the dark side under the arm
    [coat, LODEN],
    ['M104,128 C78,140 52,170 40,214 C30,252 26,300 24,360 L18,480 L150,480 C150,380 144,250 132,138 C122,136 112,132 104,128 Z', LODEN_L],
    ['M246,206 C288,226 320,270 334,320 L346,480 L236,480 C244,400 248,300 246,206 Z', LODEN_D],
    // the seam down the back and the vent
    ['M150,140 L156,140 C160,250 162,360 166,480 L160,480 C156,360 152,250 150,140 Z', LODEN_D],
    // the green collar
    ['M98,122 C130,138 180,138 212,120 L222,140 C186,160 126,158 90,142 Z', '#2c4a2a'],
    ['M98,122 C112,130 126,134 140,136 L136,152 C118,150 102,146 90,142 Z', '#4f7a42'],
  ]);
  const head = figure([
    // nape and the back of the head, short dark hair; the right ear and a sliver of cheek
    ['M114,100 C130,120 182,122 202,104 L208,126 C176,142 134,140 110,126 Z', SKIN_D],
    ['M104,58 C98,84 102,108 120,118 C142,128 178,126 198,112 C206,94 208,72 202,56 Z', '#3a2a1e'],
    ['M104,58 C98,84 102,108 120,118 C126,104 124,80 128,58 Z', '#5a4030'],
    ['M196,60 C210,74 212,100 202,118 L190,120 C200,100 202,80 196,60 Z', SKIN],
    ['M178,74 C190,68 200,78 198,94 C196,104 188,106 180,100 Z', SKIN],
    ['M184,80 C190,80 192,88 190,96 L186,96 Z', SKIN_D],
    // the hat: a brim lit along its front edge, a dented crown, a dark cord band
    ['M60,58 C82,40 216,36 242,52 C236,68 198,72 150,72 C108,72 76,68 60,58 Z', HAT],
    ['M60,58 C70,50 100,44 140,42 C110,50 86,58 76,66 Z', HAT_L],
    ['M106,50 C104,22 124,4 154,4 C184,4 200,20 198,48 Z', HAT],
    ['M106,50 C104,22 124,4 154,4 C138,10 130,28 132,50 Z', HAT_L],
    ['M150,8 C156,18 156,30 152,40 L156,40 C160,30 160,18 154,6 Z', '#1d2414'],
    ['M106,38 C134,46 172,46 198,36 L198,50 C172,58 134,58 106,50 Z', '#1d1812'],
  ]);
  const arm = figure([
    // the raised right arm: sleeve out and up, a green cuff, the hand on the handle
    ['M226,146 C270,134 322,134 362,148 C376,166 378,192 368,210 C330,200 290,206 258,220 Z', LODEN],
    ['M226,146 C270,134 322,134 362,148 C330,150 286,156 250,170 Z', LODEN_L],
    ['M258,220 C290,206 330,200 368,210 C360,216 320,222 290,232 Z', LODEN_D],
    ['M336,170 C340,128 346,90 350,52 L392,54 C392,92 386,140 376,200 Z', LODEN],
    ['M336,170 C340,128 346,90 350,52 L364,52 C360,92 354,136 350,186 Z', LODEN_L],
    ['M378,56 L392,54 C392,92 386,140 376,200 L366,196 C374,150 378,100 378,56 Z', LODEN_D],
    ['M348,46 L394,48 L392,66 L346,64 Z', '#2c4a2a'],
    ['M348,48 C342,30 350,6 368,0 C384,-4 394,12 394,34 L394,50 Z', SKIN],
    ['M376,2 C388,4 394,16 394,34 L394,50 L380,50 C384,34 384,16 376,2 Z', SKIN_D],
  ]);
  // the stein he raises: thick glass, gold beer, foam heaped over
  const stein = figure([
    ['M372,-46 C344,-44 340,26 372,30 L374,18 C356,14 358,-30 374,-32 Z', '#e8dcb8'],
    ['M382,-76 L452,-76 L454,46 C454,56 448,62 438,62 L398,62 C388,62 380,56 380,46 Z', BEER],
    ['M382,-76 L398,-76 L398,62 C388,62 380,56 380,46 Z', BEER_L],
    ['M436,-76 L452,-76 L454,46 C454,56 448,62 438,62 Z', BEER_D],
    ['M380,40 L454,40 L454,46 C454,56 448,62 438,62 L398,62 C388,62 380,56 380,46 Z', '#f0d9a0'],
    ['M376,-70 C370,-94 394,-104 410,-94 C424,-108 452,-104 458,-86 C468,-76 462,-62 452,-60 L452,-40 C446,-36 442,-44 442,-60 L384,-60 C380,-60 376,-64 376,-70 Z', FOAM],
    ['M430,-92 C444,-100 456,-94 458,-84 C462,-74 458,-64 450,-62 C452,-72 446,-84 430,-92 Z', '#e4d6b4'],
  ]);
  // the dimples of the glass and a few bubbles, set out now
  const dimples = [];
  for (let row = 0; row < 4; row++) for (let k = 0; k < 3; k++) dimples.push([392 + k * 22 + (row % 2) * 8, -40 + row * 22]);
  const fx = (lx) => x + lx * s, fy = (ly) => y + ly * s;
  const coatSp = spatterIn(81, new Path2D(coat), { x: 0, y: 120, w: 360, h: 360 }, 1400, (lx, ly) => Math.max(0, (lx - 120) / 220) * 0.9 * (ly > 200 ? 1 : 0.5));
  // the chamois tuft, a fan of hairs, dark with pale tips
  const r = rng(83), tuft = [];
  for (let k = 0; k < 60; k++) { const a = -Math.PI * r.range(0.44, 0.64), l = r.range(46, 84); tuft.push([112 + r.range(-6, 6), 42, a, l]); }
  p.group('man', { x: fx(0) - 30, y: fy(110), w: 400 * s, h: BAND - fy(110) + 10 }, (c) => {
    drawFig(c, fig, x, y, s);
    c.save(); c.translate(x, y); c.scale(s, s); drawSpatter(c, coatSp, LODEN_D); c.restore();
  }, { t: 8.7, d: 0.9, reveal: 'rise' });
  p.group('man', { x: fx(20), y: fy(-100), w: 260 * s, h: 260 * s }, (c) => {
    drawFig(c, head, x, y, s);
    c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round';
    for (const [pass, col, w0] of [[0, '#3a2a1e', 3.2], [1, '#d8cdb4', 2.2]]) {
      c.strokeStyle = col; c.lineWidth = w0; c.beginPath();
      for (const [bx, by, a, l] of tuft) {
        const f = pass ? 0.62 : 0;
        const ax = bx + Math.cos(a) * l * f, ay = by + Math.sin(a) * l * f;
        c.moveTo(ax, ay); c.quadraticCurveTo(bx + Math.cos(a) * l * 0.7 - 4, by + Math.sin(a) * l * 0.7, bx + Math.cos(a) * l - 4, by + Math.sin(a) * l);
      }
      c.stroke();
    }
    c.restore();
  }, { t: 9.2, d: 0.7, reveal: 'drop', dy: 20 });
  p.group('man', { x: fx(220), y: fy(-110), w: 260 * s, h: 360 * s }, (c) => {
    drawFig(c, arm, x, y, s);
    drawFig(c, stein, x, y, s);
    c.save(); c.translate(x, y); c.scale(s, s);
    for (const [dx, dy] of dimples) {
      c.fillStyle = dx < 404 ? '#f8dc8c' : dx > 430 ? '#b8741a' : '#efb543';
      c.beginPath(); c.ellipse(dx, dy, 7, 8.5, 0, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }, { t: 9.5, d: 0.7, reveal: 'rise' });
}

// ---------------------------------------------------------------- the waitress
// a Kellnerin in a dirndl, walking left with three steins in each hand; her face
// turned three quarters, the sun on its left side, her right side in shadow
const WOM = { x: 870, y: 718, s: 1.4 };
function waitress(p) {
  const { x, y, s } = WOM;
  const skirt = 'M152,296 C116,330 98,400 90,470 C82,560 72,640 66,700 L344,700 C336,640 326,560 316,470 C306,400 288,330 248,296 Z';
  const body = figure([
    // the skirt, its shadowed right side and two deep folds
    [skirt, RED],
    ['M152,296 C116,330 98,400 90,470 C82,560 72,640 66,700 L104,700 C114,560 130,420 160,300 Z', RED_L],
    ['M214,300 C244,380 268,540 286,700 L344,700 C336,640 326,560 316,470 C306,400 288,330 248,296 Z', RED_D],
    ['M118,520 C110,580 102,640 96,700 L108,700 C112,640 118,580 124,520 Z', RED_D],
    ['M132,320 L140,318 L134,360 Z', RED_D], ['M146,312 L152,312 L146,350 Z', RED_D], ['M252,312 L258,312 L266,352 Z', '#4e0f0b'], ['M266,320 L272,322 L284,362 Z', '#4e0f0b'],
    // the apron, blue, with a lit left edge, folds and a darker right half
    ['M168,300 C160,400 146,560 136,700 L268,700 C260,560 244,400 234,300 Z', APRON],
    ['M168,300 C160,400 146,560 136,700 L156,700 C164,560 174,400 180,300 Z', APRON_L],
    ['M212,300 C222,400 236,560 244,700 L268,700 C260,560 244,400 234,300 Z', APRON_D],
    ['M196,330 C194,450 192,570 192,700 L200,700 C200,570 202,450 202,330 Z', APRON_D],
    ['M176,312 L182,312 L178,346 Z', APRON_D], ['M218,312 L224,312 L226,346 Z', APRON_D],
    // the bodice: black velvet laced down the front, its lit left edge
    ['M148,194 C170,186 232,186 254,194 C252,234 248,270 248,302 C224,310 176,310 152,302 C152,270 150,234 148,194 Z', '#1f1a16'],
    ['M148,194 C156,191 164,189 172,188 C168,230 166,270 166,306 L152,302 C152,270 150,234 148,194 Z', '#4a4036'],
    // the apron's waistband and its bow on her left
    ['M146,292 C176,302 226,302 254,292 L254,306 C226,316 176,316 146,306 Z', APRON_D],
    ['M146,296 C126,282 112,292 116,306 C120,318 136,314 146,304 C140,322 132,340 136,352 L146,350 C148,336 150,320 150,304 Z', APRON_L],
  ]);
  const top = figure([
    // the blouse: low neck, short puffed sleeves, the right one in shadow
    ['M146,160 C166,150 182,148 194,152 C212,148 236,150 258,162 L254,200 L148,200 Z', LINEN],
    ['M150,156 C120,152 100,174 104,204 C108,224 130,232 152,222 C162,204 162,176 150,156 Z', LINEN],
    ['M150,156 C120,152 100,174 104,204 C108,214 114,220 122,224 C114,200 120,170 150,156 Z', '#fffaf0'],
    ['M248,156 C280,150 300,174 296,204 C292,224 270,232 250,222 C240,204 238,176 248,156 Z', LINEN_D],
    ['M222,152 C238,152 250,156 258,162 L254,200 L226,200 C232,186 230,166 222,152 Z', LINEN_D],
    // the neck, and the neckband with its small silver piece
    ['M176,124 L178,154 C190,160 206,158 216,150 L214,112 Z', SKIN],
    ['M200,120 L214,112 L216,150 C210,154 204,156 198,156 Z', SKIN_D],
    ['M176,138 C190,144 206,144 216,136 L216,144 C206,152 190,152 176,146 Z', '#1f1a16'],
  ]);
  const head = figure([
    // the bun of plaits at the back, behind the head
    ['M206,64 C226,52 252,62 254,86 C256,110 236,122 218,114 Z', HAIR_D],
    // the face: brow, the nose, lips and chin on its left side, the jaw to the ear
    ['M195,40 C175,40 160,52 157,68 C155,76 152,84 149,94 L145,101 C147,104 151,105 153,107 C152,111 151,114 153,117 C154,121 156,124 158,128 C166,136 184,136 198,128 C210,120 220,108 226,92 C230,70 220,42 195,40 Z', SKIN],
    // the shadow on her right side, its edge running down the cheek
    ['M204,58 C214,74 214,98 202,114 C194,124 184,132 172,135 C192,138 212,124 222,104 C230,84 226,58 208,46 Z', SKIN_D],
    ['M158,72 C162,64 172,62 180,66 C170,66 164,70 160,76 Z', SKIN_L],
    // the hair: parted, drawn back over the ear
    ['M155,70 C154,48 174,30 200,31 C228,32 244,52 240,78 C238,92 232,104 224,110 C222,96 218,84 210,76 C198,66 178,62 162,66 C160,68 157,70 155,70 Z', HAIR],
    ['M200,31 C228,32 244,52 240,78 C238,92 232,104 224,110 C224,92 228,60 200,31 Z', HAIR_D],
    ['M164,52 C176,40 196,36 212,40 C196,40 180,44 170,54 Z', '#9a6438'],
    // the ear, half in shadow, with a gold drop
    ['M210,84 C218,80 224,88 222,100 C220,108 214,110 210,104 Z', SKIN_D],
  ]);
  const arms = figure([
    // her right arm (our left), lit: bent at the elbow, carrying its steins up and out
    ['M112,212 C102,240 92,270 84,300 L110,312 C118,284 128,254 140,224 Z', SKIN],
    ['M128,222 C120,250 114,280 108,310 L110,312 C118,284 128,254 140,224 Z', SKIN_D],
    ['M84,300 C74,290 64,280 56,270 L74,256 C84,268 98,286 110,312 Z', SKIN],
    ['M84,300 C74,290 64,280 56,270 L60,266 C70,278 82,290 94,306 Z', SKIN_D],
    // her left arm (our right), in shadow, hanging with its load
    ['M286,212 C294,244 300,274 304,304 L278,310 C274,282 268,252 260,222 Z', SKIN_D],
    ['M304,300 C310,316 316,330 322,344 L294,352 C288,336 282,322 278,306 Z', SKIN_D],
    ['M286,212 C294,244 300,274 304,304 L296,304 C290,276 284,248 276,220 Z', '#8c5236'],
  ]);
  const fists = figure([
    ['M34,256 C36,244 56,240 68,248 C76,256 74,276 62,282 C50,286 36,278 34,256 Z', SKIN],
    ['M34,256 C36,244 48,240 56,242 C48,250 44,264 48,280 C40,276 34,268 34,256 Z', SKIN_L],
    ['M300,326 C308,314 328,316 334,328 C338,342 330,356 316,356 C304,356 296,342 300,326 Z', SKIN_D],
  ]);
  const FISTS = [[52, 264], [318, 338]];
  const steins = [];
  for (const [side, x0] of [[-1, -30], [1, 262]]) {
    const [, fy0] = FISTS[side < 0 ? 0 : 1];
    for (let k = 0; k < 3; k++) steins.push({ x: x0 + k * 30, y: fy0 + 30 + (k === 1 ? 10 : 0), back: k !== 1, side });
  }
  steins.sort((a, b) => (a.back === b.back ? 0 : a.back ? -1 : 1));
  // one shadow down her right side, across blouse, bodice, apron and skirt alike
  const dress = new Path2D();
  for (const d of [skirt, 'M148,194 C170,186 232,186 254,194 C252,234 248,270 248,302 C224,310 176,310 152,302 C152,270 150,234 148,194 Z', 'M146,160 C166,150 182,148 194,152 C212,148 236,150 258,162 L254,200 L148,200 Z', 'M248,156 C280,150 300,174 296,204 C292,224 270,232 250,222 C240,204 238,176 248,156 Z']) dress.addPath(new Path2D(d));
  const veil = new Path2D('M232,150 C240,260 256,440 280,700 L380,700 L380,150 Z');
  const fx = (lx) => x + lx * s, fy = (ly) => y + ly * s;
  const skirtSp = spatterIn(91, new Path2D(skirt), { x: 60, y: 290, w: 290, h: 410 }, 1600, (lx) => (lx > 266 ? Math.min(1, (lx - 250) / 70) : lx < 134 ? 0.25 : 0), [1.2, 3]);
  // the ground shadow she throws to the right
  p.group('woman', { x: fx(60), y: fy(640), w: 520, h: 90 }, (c) => {
    c.fillStyle = 'rgba(90,60,20,.38)';
    c.beginPath(); c.moveTo(fx(70), BAND); c.bezierCurveTo(fx(200), fy(660), fx(420), fy(650), fx(560), fy(690)); c.lineTo(fx(560), BAND); c.closePath(); c.fill();
  }, { t: 9.0, d: 0.5, reveal: 'fade' });
  p.group('woman', { x: fx(50), y: fy(140), w: 320 * s, h: BAND - fy(140) + 4 }, (c) => {
    drawFig(c, body, x, y, s);
    c.save(); c.translate(x, y); c.scale(s, s); drawSpatter(c, skirtSp, '#5e1410');
    // the lacing of the bodice: silver hooks and a cord
    c.fillStyle = '#d8d2c2'; for (let k = 0; k < 5; k++) { c.fillRect(188, 206 + k * 18, 5, 4); c.fillRect(208, 206 + k * 18, 5, 4); }
    c.strokeStyle = '#d8d2c2'; c.lineWidth = 1.6; c.beginPath();
    for (let k = 0; k < 4; k++) { c.moveTo(191, 208 + k * 18); c.lineTo(210, 226 + k * 18); c.moveTo(210, 208 + k * 18); c.lineTo(191, 226 + k * 18); }
    c.stroke();
    c.restore();
  }, { t: 9.3, d: 0.8, reveal: 'rise' });
  p.group('woman', { x: fx(90), y: fy(100), w: 240 * s, h: BAND - fy(100) + 4 }, (c) => {
    drawFig(c, top, x, y, s);
    c.save(); c.translate(x, y); c.scale(s, s); c.clip(dress); c.fillStyle = 'rgba(70,20,12,.24)'; c.fill(veil); c.restore();
  }, { t: 9.8, d: 0.6, reveal: 'fade' });
  p.group('woman', { x: fx(120), y: fy(14), w: 160 * s, h: 140 * s }, (c) => {
    c.save(); c.translate(fx(196), fy(132)); c.rotate(-0.07); c.translate(-fx(196), -fy(132));
    drawFig(c, head, x, y, s);
    c.translate(x, y); c.scale(s, s);
    // the eye under its lid, the brow, the lips, a little color in the cheek
    c.fillStyle = '#2a1a12';
    c.beginPath(); c.moveTo(161, 84); c.quadraticCurveTo(168, 79, 175, 83); c.quadraticCurveTo(168, 86, 161, 84); c.fill();
    c.fillRect(160, 74, 16, 2.6);
    c.fillStyle = '#b8322a'; c.beginPath(); c.moveTo(150, 112); c.quadraticCurveTo(156, 109, 161, 112); c.quadraticCurveTo(156, 117, 151, 115); c.fill();
    c.fillStyle = 'rgba(214,96,80,.35)'; c.beginPath(); c.arc(174, 104, 10, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e9c56a'; c.beginPath(); c.arc(216, 114, 3.4, 0, Math.PI * 2); c.fill();
    c.restore();
  }, { t: 10.1, d: 0.6, reveal: 'drop', dy: 16 });
  p.group('woman', { x: fx(-50), y: fy(200), w: 500 * s, h: 280 * s }, (c) => {
    drawFig(c, arms, x, y, s);
    c.save(); c.translate(x, y); c.scale(s, s);
    for (const m of steins) stein6(c, m);
    // the handles, gathered up into each fist
    c.strokeStyle = '#d9c38e'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath();
    for (const m of steins) { const [fx0, fy0] = FISTS[m.side < 0 ? 0 : 1]; c.moveTo(m.x + 28, m.y - 8); c.quadraticCurveTo(m.x + 28, fy0 + 4, fx0, fy0 + 6); }
    c.stroke();
    c.restore();
    drawFig(c, fists, x, y, s);
  }, { t: 10.4, d: 0.7, reveal: 'drop', dy: 20 });
}
// one stein hanging from her fist: tall glass, gold beer, white head
function stein6(c, { x, y, back, side }) {
  const w = 56, h = 104, sh = side > 0 ? 0.78 : 1;
  const k = (col) => (sh < 1 ? mixHex(col, '#5a2a10', 0.22) : col);
  c.fillStyle = k(back ? BEER_D : BEER); c.beginPath(); c.roundRect(x, y, w, h, [2, 2, 8, 8]); c.fill();
  c.fillStyle = k(BEER_L); c.fillRect(x + 6, y + 8, 9, h - 20);
  c.fillStyle = k(BEER_D); c.fillRect(x + w - 14, y + 4, 10, h - 12);
  c.fillStyle = k('#f0d9a0'); c.beginPath(); c.roundRect(x, y + h - 12, w, 12, [0, 0, 8, 8]); c.fill();
  c.fillStyle = k(FOAM); c.beginPath(); c.moveTo(x - 3, y + 8); c.bezierCurveTo(x - 6, y - 14, x + 20, y - 20, x + 30, y - 10); c.bezierCurveTo(x + 44, y - 20, x + w + 8, y - 8, x + w + 3, y + 8); c.closePath(); c.fill();
}
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (n, s0) => (n >> s0) & 255, m = (s0) => Math.round(lerp(ch(pa, s0), ch(pb, s0), t));
  return `rgb(${m(16)},${m(8)},${m(0)})`;
}

// ---------------------------------------------------------------- the dachshund
// standing on the gravel between them, nose up toward the stein, black and tan
const DOG = { x: 590, y: 1532, s: 1.22 };
function dachshund(p) {
  const { x, y, s } = DOG;
  const BLK = '#1d1812', BLK_L = '#4e4136', TAN = '#a8642a', TAN_L = '#d08a44';
  const dog = figure([
    // the far legs, a step behind
    ['M60,70 L54,104 L66,106 L74,72 Z', '#120e0b'],
    ['M172,70 L178,104 L190,104 L186,70 Z', '#120e0b'],
    // the long body, the chest low and forward
    ['M40,40 C60,26 150,24 192,32 C210,36 216,52 210,64 C204,76 184,82 162,82 L74,84 C50,84 32,72 32,56 C32,50 34,44 40,40 Z', BLK],
    ['M44,38 C64,26 150,24 192,32 C200,34 206,38 208,44 C170,36 100,34 50,46 Z', BLK_L],
    // the tan of the chest and the near legs, with paws
    ['M34,58 C38,74 52,84 72,84 L70,74 C56,72 44,66 34,58 Z', TAN],
    ['M64,74 L58,106 L80,108 L80,98 L74,98 L82,76 Z', TAN],
    ['M166,74 L170,106 L192,106 L190,96 L184,96 L184,74 Z', TAN],
    ['M64,74 L58,106 L64,106 L70,78 Z', TAN_L],
    // the tail, up and curved
    ['M204,42 C222,34 234,20 240,6 L246,9 C240,28 228,44 210,54 Z', BLK],
    // the neck and head, raised, the long muzzle pointing up and left
    ['M42,52 C36,38 30,26 28,16 C26,6 32,-2 44,-2 C56,-2 62,8 64,20 C66,32 64,44 60,56 Z', BLK],
    ['M30,6 C18,4 4,6 -6,10 C-10,14 -8,20 -2,21 C10,22 22,20 34,20 Z', BLK],
    ['M30,14 C18,16 6,18 -2,21 C10,22 22,22 34,22 Z', TAN],
    ['M-8,9 C-12,10 -13,15 -9,17 C-6,17 -4,13 -4,11 Z', '#000000'],
    ['M30,4 C24,4 16,4 8,6 C16,2 24,0 32,0 Z', BLK_L],
    // the ear, long and soft, and the tan spot over the eye
    ['M46,4 C56,4 60,16 58,30 C56,42 48,44 44,38 C40,28 40,14 46,4 Z', '#0c0907'],
    ['M30,4 C33,1 37,1 39,4 C36,5 33,5 30,4 Z', TAN_L],
  ]);
  p.group('woman', { x: x - 30, y: y - 20, w: 300 * s, h: BAND - y + 20 }, (c) => {
    // its shadow on the gravel
    c.fillStyle = 'rgba(90,60,20,.38)'; c.beginPath(); c.ellipse(x + 150 * s, y + 108 * s, 130 * s, 9 * s, 0, 0, Math.PI * 2); c.fill();
    drawFig(c, dog, x, y, s);
    c.fillStyle = '#f3e4bf'; c.beginPath(); c.arc(x + 34 * s, y + 9 * s, 2.2 * s, 0, Math.PI * 2); c.fill();
  }, { t: 10.8, d: 0.6, reveal: 'drop', dy: 18 });
}

// ---------------------------------------------------------------- the band and the name
function band(p) {
  // the lozenges of white and blue over the band
  const n = 28, w = (W - 2 * MG) / n;
  p.group('band', { x: MG, y: STRIP - 4, w: W - 2 * MG, h: BAND - STRIP + 8 }, (c) => {
    c.fillStyle = WHITE; c.fillRect(MG, STRIP, W - 2 * MG, BAND - STRIP);
    c.fillStyle = BLUE;
    for (let k = 0; k < n; k++) { const x = MG + k * w; poly(c, [[x, STRIP], [x + w / 2, (STRIP + BAND) / 2], [x, BAND], [x - w / 2, (STRIP + BAND) / 2]]); c.fill(); }
  }, { t: 10.6, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // the red band
  const bb = [[MG, BAND], [W - MG, BAND], [W - MG, H - MG], [MG, H - MG]];
  const sp = spatter(101, bb, 2200, (x, y) => 0.2 + 0.8 * ((y - BAND) / (H - MG - BAND)) ** 2);
  p.group('band', { x: MG, y: BAND, w: W - 2 * MG, h: H - MG - BAND }, (c) => {
    fillP(c, bb, RED); drawSpatter(c, sp, RED_D);
  }, { t: 10.8, d: 0.8, reveal: 'rise' });
  // München in blackletter, cream, with a dark shadow cut down and right
  p.type('title', 'München', 110, 1925, {
    family: FONT, weight: 700, size: 270, color: CREAM, shadow: RED_D, sx: 8, sy: 8,
    align: 'left', track: 0.01, t: 11.3, gap: 0.2, d: 0.8, reveal: 'press',
  });
}

// ---------------------------------------------------------------- life
function life(p) {
  // swifts screaming round the towers
  const r = rng(111), birds = [];
  for (let i = 0; i < 8; i++) birds.push([r.range(820, 1300), r.range(240, 520), r.range(60, 180), r.range(0.5, 0.9) * (r.chance(0.5) ? 1 : -1), r() * 7]);
  p.live('live', {
    t: 9.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = INK;
      for (const [x0, y0, rad, w, ph] of birds) {
        const a = time * w + ph, x = x0 + Math.cos(a) * rad, y = y0 + Math.sin(a * 1.7) * rad * 0.3;
        const f = 0.6 + 0.4 * Math.sin(time * 14 + ph * 3);
        c.beginPath(); c.moveTo(x - 14, y + 4 * f); c.quadraticCurveTo(x - 4, y - 3 * f, x, y); c.quadraticCurveTo(x + 4, y - 3 * f, x + 14, y + 4 * f); c.quadraticCurveTo(x + 4, y, x, y + 3); c.quadraticCurveTo(x - 4, y, x - 14, y + 4 * f); c.fill();
      }
    },
  });
  // the Glockenspiel's figures turning round in their two lit stages
  const cx = (TW0 + TW1) / 2, { y0 } = GL;
  const cols = [RED, BLUE, '#2c3a22', WHITE, '#e9c56a', INK];
  // (on the hall's own layer, so the chestnut in front hides them)
  p.live('hall', {
    t: 10.0, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      c.save(); c.beginPath(); c.rect(cx - 58, y0 + 14, 116, 54); c.rect(cx - 58, y0 + 84, 116, 50); c.clip();
      for (const [y, h, sp, n] of [[y0 + 66, 42, 0.5, 6], [y0 + 132, 38, -0.35, 6]]) {
        for (let k = 0; k < n; k++) {
          const a = time * sp + (k / n) * Math.PI * 2, x = cx + Math.cos(a) * 62;
          if (Math.sin(a) < -0.2) continue; // behind
          c.fillStyle = cols[k % cols.length];
          c.fillRect(x - 6, y - h, 12, h - 10);
          c.beginPath(); c.arc(x, y - h - 4, 6, 0, Math.PI * 2); c.fill();
          c.fillStyle = INK; c.fillRect(x - 5, y - 10, 4, 10); c.fillRect(x + 1, y - 10, 4, 10);
        }
      }
      c.restore();
    },
  });
  // the light through the chestnut leaves, moving on the gravel
  const dap = [];
  for (let k = 0; k < 14; k++) dap.push([r.range(480, 1100), r.range(HEDGE + 110, BAND - 30), r.range(8, 22), r() * 7]);
  p.live('garden', {
    t: 10.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#f7e2a6';
      for (const [x, y, rr, ph] of dap) {
        const a = 0.5 + 0.5 * Math.sin(time * 0.9 + ph);
        c.globalAlpha = a * 0.8;
        c.beginPath(); c.ellipse(x + Math.sin(time * 0.6 + ph) * 8, y, rr, rr * 0.35, 0, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
    },
  });
}
