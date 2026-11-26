// Reykjavík: a Nordic minimal poster on a winter night. A dark panel on a pale
// sheet: the northern lights hang in green and violet curtains over Esja's long
// snow-streaked ridge and the black bay, and they move. On the hill, lit from
// below, the Hallgrímskirkja's stepped columns climb to its tower; around and in
// front of it the town's corrugated-iron houses with colored roofs, snow on the
// ridges and warm windows. On the far shore Harpa's glass facets glow and the Sun
// Voyager points out to sea. The name is set below in a clean wide sans.

import { Plate, W, boxOf, rng } from '../print.js';
import { lerp, clamp, poly, shade } from '../kit.js';

const PAPER = '#e8e6e0', NAVY = '#13213a', SLATE = '#56606b';
const FACE = '"Manrope", sans-serif';
const TITLE = 'REYKJAVÍK';

export const city = {
  id: 'reykjavik', name: 'Reykjavík', wall: '#0c1a26',
  alt: "A Nordic minimal night poster: the northern lights in moving green and violet curtains over Esja's long snowy ridge and the dark bay, the Hallgrímskirkja lit from below with its stepped columns rising to its clock tower and steeple, Harpa's glowing glass cells and the Sun Voyager on the shore, rows of corrugated-iron houses with colored roofs, snow and warm windows climbing toward the church, parked cars under snow, street lamps and people walking, a fishing boat's lights on the bay, and the name set below on a pale margin",
  google: 'family=Manrope:wght@500;800',
  fonts: [['800 100px "Manrope"', TITLE], ['500 100px "Manrope"', 'ÍSLAND 64°08′N 21°56′W']],
  build,
};

// the printed panel and the lines of the view
const X0 = 92, Y0 = 92, X1 = W - 92, Y1 = 1560;
const RIDGE_FOOT = 1000;  // where Esja meets the bay
const SHORE = 1072;       // the town's shore
const CX = 800, BASE = 1300; // the church's axis and foot

function build() {
  const p = new Plate({ paper: PAPER, seed: 1986 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'aurora', 'stars', 'esja', 'bay', 'shore', 'far', 'church', 'detail', 'near', 'lamps', 'life', 'title');
  p.layer('title', { clip: false });

  sky(p, r);
  aurora(p, r);
  stars(p, r);
  esja(p, r);
  bay(p, r);
  shore(p, r);
  rows(p, r, 'far', [[1112, 0.34, 4.6], [1148, 0.42, 5.0], [1192, 0.52, 5.4], [1240, 0.62, 5.8]]);
  church(p, r);
  rows(p, r, 'near', [[1352, 0.86, 8.4], [1450, 1.08, 8.9], [1575, 1.36, 9.4]]);
  life(p, r);
  title(p);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

// ================================================================ the sky
function sky(p, r) {
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 }, (c) => {
    const g = c.createLinearGradient(0, Y0, 0, Y1), k = (RIDGE_FOOT - Y0) / (Y1 - Y0);
    g.addColorStop(0, '#050b17'); g.addColorStop(0.45 * k, '#0a1a2c'); g.addColorStop(0.85 * k, '#123241'); g.addColorStop(k, '#1a4249');
    g.addColorStop(k + 0.01, '#0c1822'); g.addColorStop(1, '#0a141d');
    c.fillStyle = g; c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
  }, { t: 0, d: 1.2, reveal: 'fade' });
}

function stars(p, r) {
  const pts = [];
  for (let i = 0; i < 520; i++) {
    const x = r.range(X0, X1), y = Y0 + (RIDGE_FOOT - 130 - Y0) * Math.pow(r(), 1.3);
    pts.push([x, y, r() < 0.06 ? r.range(1.6, 2.4) : r.range(0.5, 1.2), r.range(0.35, 0.95)]);
  }
  // in three sweeps, top down
  for (let k = 0; k < 3; k++) {
    const part = pts.filter((_, i) => i % 3 === k);
    p.group('stars', { x: X0, y: Y0, w: X1 - X0, h: RIDGE_FOOT - Y0 }, (c) => {
      for (const [x, y, s, a] of part) { c.fillStyle = `rgba(232,240,236,${a})`; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); }
    }, { t: 0.7 + k * 0.45, d: 1.2, reveal: 'fall', ease: 'soft' });
  }
}

// curtains painted once into small canvases, then moved by the clock
function aurora(p, r) {
  const SC = 0.5, BX = X0, BY = Y0, BW = X1 - X0, BH = 1000 - Y0;
  const base = (x, k) => 560 + 150 * Math.sin(x / 380 + 0.4 + k) - (x - X0) * 0.16 + 40 * Math.sin(x / 140 + k * 3);
  const make = (seed, k, rays, hot, cool) => {
    const R = [];
    const rr = rng(seed);
    for (let i = 0; i < rays; i++) {
      const x = BX + rr() * BW, b = base(x, k) + (rr() - 0.5) * 30;
      R.push([x, b, b - (170 + 250 * rr()) * (0.6 + 0.5 * Math.sin(x / 210 + k) ** 2), 2 + rr() * 6, 0.05 + rr() * 0.12]);
    }
    let cv = null;
    return () => {
      if (cv) return cv;
      cv = document.createElement('canvas');
      cv.width = Math.ceil(BW * SC); cv.height = Math.ceil(BH * SC);
      const c = cv.getContext('2d');
      c.scale(SC, SC); c.translate(-BX, -BY);
      c.globalCompositeOperation = 'lighter';
      for (const [x, b, top, w, a] of R) {
        const g = c.createLinearGradient(0, b + 20, 0, top);
        g.addColorStop(0, `rgba(${hot},0)`); g.addColorStop(0.1, `rgba(${hot},${a * 2})`);
        g.addColorStop(0.45, `rgba(${hot},${a})`); g.addColorStop(0.8, `rgba(${cool},${a * 0.8})`); g.addColorStop(1, `rgba(${cool},0)`);
        c.fillStyle = g; c.fillRect(x - w / 2, top, w, b + 20 - top);
      }
      // the bright hem
      c.strokeStyle = `rgba(${hot},0.28)`; c.lineWidth = 8; c.filter = 'blur(6px)';
      c.beginPath(); for (let x = BX; x <= BX + BW; x += 10) { const y = base(x, k) + 6; x === BX ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
      c.filter = 'none';
      return cv;
    };
  };
  const A = make(11, 0, 900, '120,240,170', '110,90,200');
  const B = make(23, 1.7, 520, '150,255,200', '190,80,170');
  p.live('aurora', {
    t: 1.6, d: 3.2, reveal: 'fade', ease: 'soft', box: { x: BX, y: BY, w: BW, h: BH },
    draw: (c, time) => {
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha *= 0.72 + 0.18 * Math.sin(time * 0.7);
      c.drawImage(A(), BX + 22 * Math.sin(time * 0.31), BY, BW, BH);
      c.globalAlpha *= 0.75 + 0.25 * Math.sin(time * 1.1 + 1);
      c.drawImage(B(), BX - 40 + 34 * Math.sin(time * 0.23 + 2), BY - 50 + 10 * Math.sin(time * 0.5), BW, BH);
    },
  });
}

// ================================================================ Esja
function esja(p, r) {
  // a long table of a mountain, highest in the middle, with gullies
  const prof = [];
  for (let x = X0 - 10; x <= X1 + 10; x += 8) {
    const t = (x - X0) / (X1 - X0);
    let y = RIDGE_FOOT - 40 - 120 * Math.sin(clamp(t * 1.15 + 0.02) * Math.PI) ** 0.55 - 26 * Math.sin(t * 9) * t;
    y += 6 * Math.sin(t * 41) + r.range(-2, 2);
    prof.push([x, y]);
  }
  const far = prof.map(([x, y]) => [x, Math.max(y + 60, RIDGE_FOOT - 24 + 7 * Math.sin(x / 90))]);
  // a paler range behind on the right (Akrafjall)
  const back = [];
  for (let x = 1020; x <= X1 + 10; x += 10) back.push([x, RIDGE_FOOT - 60 - 70 * Math.sin(((x - 1020) / 500) * Math.PI) ** 0.7 + r.range(-2, 2)]);
  p.fill('esja', [[1020, RIDGE_FOOT], ...back, [X1 + 10, RIDGE_FOOT]], '#2a4656', { t: 2.0, d: 1.2, reveal: 'rise' });
  const shape = [[X0 - 10, RIDGE_FOOT + 4], ...prof, [X1 + 10, RIDGE_FOOT + 4]];
  // in winter Esja is white: moonlit snow, bluish, brighter toward the top
  p.group('esja', boxOf(shape, 4), (c) => {
    const g = c.createLinearGradient(0, RIDGE_FOOT - 170, 0, RIDGE_FOOT);
    g.addColorStop(0, '#9db6bd'); g.addColorStop(0.6, '#5f7c89'); g.addColorStop(1, '#2c4656');
    c.fillStyle = g; poly(c, shape); c.fill();
  }, { t: 2.4, d: 1.4, reveal: 'rise' });
  // the dark bands of its stacked lava beds, broken by snow, and the gullies down them
  const top = (x) => { const i = clamp(Math.round((x - X0 + 10) / 8), 0, prof.length - 1); return prof[i][1]; };
  const beds = [], gullies = [];
  for (let k = 0; k < 9; k++) {
    let x = X0 - 10;
    while (x < X1) {
      const L = r.range(20, 120), gap = r.range(8, 50);
      const y0 = top(x) + 14 + k * 11 + r.range(-2, 2);
      if (y0 < RIDGE_FOOT - 4 && r() < 0.8) beds.push([[x, y0], [x + L * 0.5, y0 + r.range(-1.5, 1.5)], [x + L, y0 + r.range(-1, 1)]]);
      x += L + gap;
    }
  }
  for (let x = X0; x < X1; x += r.range(30, 70)) {
    const y = top(x) + r.range(4, 14), L = r.range(30, 110);
    gullies.push([[x, y], [x + r.range(-4, 4), y + L * 0.5], [x + r.range(-6, 6), Math.min(RIDGE_FOOT, y + L)]]);
  }
  p.strokes('esja', beds, 'rgba(26,44,58,.6)', 1.8, { t: 3.0, d: 1.3, reveal: 'fall' });
  p.strokes('esja', gullies, 'rgba(26,44,58,.35)', 1.2, { t: 3.3, d: 1.2, reveal: 'fall' });
  p.pen('esja', prof.map(([x, y]) => [x, y + 1]), 'rgba(220,238,232,.9)', 1.6, { t: 3.0, d: 1.8 });
  // the shadowed foot of the range
  p.fill('esja', [[X0 - 10, RIDGE_FOOT + 4], ...far, [X1 + 10, RIDGE_FOOT + 4]], '#132433', { t: 3.6, d: 0.9, reveal: 'rise' });
}

// ================================================================ the bay
function bay(p, r) {
  p.group('bay', { x: X0, y: RIDGE_FOOT - 2, w: X1 - X0, h: SHORE - RIDGE_FOOT + 30 }, (c) => {
    const g = c.createLinearGradient(0, RIDGE_FOOT, 0, SHORE + 20);
    g.addColorStop(0, '#0f2833'); g.addColorStop(1, '#08141e');
    c.fillStyle = g; c.fillRect(X0, RIDGE_FOOT, X1 - X0, SHORE - RIDGE_FOOT + 30);
  }, { t: 3.6, d: 0.9, reveal: 'wipe' });
  // ripples and the sky's green in the water
  const rip = [], green = [];
  for (let y = RIDGE_FOOT + 6; y < SHORE; y += 4) {
    for (let i = 0; i < 16; i++) {
      const x = r.range(X0, X1), L = r.range(8, 40);
      (r() < 0.35 && x < 1250 ? green : rip).push([[x, y + r.range(-1, 1)], [x + L, y + r.range(-1, 1)]]);
    }
  }
  p.strokes('bay', rip, 'rgba(120,160,170,.35)', 1, { t: 4.1, d: 1.0, reveal: 'wipe' });
  p.strokes('bay', green, 'rgba(120,230,170,.45)', 1.6, { t: 4.3, d: 1.0, reveal: 'wipe' });
}

// ================================================================ the shore
function shore(p, r) {
  // the town's ground: dark, with the coast road
  p.fill('shore', [[X0, SHORE], [X1, SHORE], [X1, Y1], [X0, Y1]], '#16222e', { t: 4.0, d: 0.8, reveal: 'fade' });
  p.fill('shore', [[X0, SHORE - 3], [X1, SHORE - 3], [X1, SHORE + 7], [X0, SHORE + 7]], '#3c4a55', { t: 4.2, d: 0.7, reveal: 'wipe' });
  // lights along the coast road, and their streaks in the water
  const lamps = [], streaks = [];
  for (let x = X0 + 14; x < X1; x += r.range(22, 34)) {
    lamps.push([x, SHORE - 8]);
    streaks.push([[x, SHORE - 2], [x + r.range(-1, 1), SHORE - 2 - r.range(10, 32)]]);
  }
  p.strokes('shore', streaks, 'rgba(245,190,110,.45)', 2, { t: 4.6, d: 0.8, reveal: 'fade' });
  p.group('shore', boxOf(lamps, 6), (c) => {
    c.fillStyle = '#5d6872'; for (const [x, y] of lamps) c.fillRect(x - 0.6, y, 1.2, 8);
    c.fillStyle = '#ffd89a'; for (const [x, y] of lamps) { c.beginPath(); c.arc(x, y, 1.9, 0, Math.PI * 2); c.fill(); }
  }, { t: 4.6, d: 1.2, reveal: 'wipe' });
  harpa(p, r);
  voyager(p);
}

// Harpa: a slanted box of glass cells, lit from inside in shifting colors
function harpa(p, r) {
  const x0 = 1150, x1 = 1420, yb = SHORE - 4;
  const out = [[x0, yb], [x0 + 4, yb - 54], [x0 + 60, yb - 80], [x0 + 150, yb - 96], [x1 - 30, yb - 96], [x1 - 6, yb - 70], [x1 + 8, yb]];
  // the cells, colored at build time
  const cells = [];
  const cw = 13, ch = 11;
  for (let row = 0; row * ch < 100; row++) {
    for (let col = 0; col * cw < x1 - x0 + 20; col++) {
      const cx = x0 - 6 + col * cw + (row % 2) * cw / 2, cy = yb - 4 - row * ch;
      const k = r();
      const band = Math.sin(cx / 40 + cy / 30) > 0.2;
      cells.push([cx, cy, k < 0.5 ? '#163447' : k < 0.75 ? (band ? '#2d7f8c' : '#24546e') : k < 0.9 ? '#3f9e96' : k < 0.96 ? '#e8c873' : '#8a6cc0']);
    }
  }
  p.group('shore', boxOf(out, 4), (c) => {
    c.save(); poly(c, out); c.clip();
    c.fillStyle = '#0d1c28'; c.fillRect(x0 - 10, yb - 100, x1 - x0 + 30, 104);
    for (const [x, y, col] of cells) { c.fillStyle = col; c.globalAlpha = 0.92; hex6(c, x, y, 6.6); c.fill(); }
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(8,16,24,.95)'; c.lineWidth = 1.1;
    for (const [x, y] of cells) { hex6(c, x, y, 6.6); c.stroke(); }
    c.restore();
    c.strokeStyle = '#c9d6dc'; c.lineWidth = 1.6; poly(c, out); c.stroke();
  }, { t: 5.0, d: 1.2, reveal: 'rise' });
}
function hex6(c, x, y, s) {
  c.beginPath();
  for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; const px = x + Math.cos(a) * s, py = y + Math.sin(a) * s; k ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.closePath();
}

// the Sun Voyager: a keel of steel with ribs, prow and stern raised, on a stone
function voyager(p) {
  const x = 330, y = SHORE - 10, L = 120;
  p.group('shore', { x: x - L / 2 - 20, y: y - 50, w: L + 40, h: 60 }, (c) => {
    c.fillStyle = '#5b6670'; c.fillRect(x - L * 0.42, y, L * 0.84, 6);
    c.strokeStyle = '#d7dde0'; c.lineWidth = 2.2; c.lineCap = 'round';
    const keel = (t) => [x - L / 2 + L * t, y - 6 - 10 * (Math.abs(t - 0.5) * 2) ** 3];
    c.beginPath(); for (let k = 0; k <= 20; k++) { const [a, b] = keel(k / 20); k ? c.lineTo(a, b) : c.moveTo(a, b); } c.stroke();
    // the prow and the stern rise in long spikes
    c.beginPath(); c.moveTo(x + L / 2, y - 16); c.lineTo(x + L / 2 + 14, y - 46); c.moveTo(x - L / 2, y - 16); c.lineTo(x - L / 2 - 8, y - 34); c.stroke();
    c.lineWidth = 1.3;
    c.beginPath();
    for (let k = 1; k < 10; k++) { const [a, b] = keel(k / 10); c.moveTo(a, b); c.lineTo(a + 4, b - 12 - 4 * Math.sin((k / 10) * Math.PI)); }
    c.moveTo(x - L * 0.38, y - 20); c.lineTo(x + L * 0.42, y - 20);
    c.stroke();
  }, { t: 5.4, d: 1.0, reveal: 'wipe' });
}

// ================================================================ the houses
const WALLS = ['#8a8d90', '#6f8592', '#a08e5c', '#6c8a83', '#946a60', '#5d7491', '#a59d90', '#7b7f9a'];
const ROOFS = ['#a8322c', '#2a6f6c', '#c48f2c', '#2f5a96', '#3f7b44', '#22272e', '#b85a2a', '#7a2c4a'];

function makeHouse(r, x, base, s) {
  const w = r.range(52, 104) * s, h = r.range(40, 74) * s, rh = r.range(0.32, 0.6) * w * (r() < 0.2 ? 0.4 : 1);
  const kind = r() < 0.72 ? 'gable' : r() < 0.6 ? 'side' : 'flat';
  const wall = r.pick(WALLS), roof = r.pick(ROOFS);
  const wins = [];
  const floors = h > 58 * s ? 2 : 1;
  const nw = Math.max(1, Math.round(w / (24 * s)));
  for (let f = 0; f < floors; f++) {
    for (let k = 0; k < nw; k++) {
      const ww = 9 * s, wh = 13 * s;
      const wx = x + (k + 0.5) * w / nw - ww / 2, wy = base - h + 10 * s + f * (h - 14 * s) / floors;
      if (f === 0 && k === Math.floor(nw / 2) && nw > 1 && r() < 0.5) continue;
      wins.push([wx, wy, ww, wh, r() < 0.62]);
    }
    if (kind === 'gable' && f === floors - 1 && rh > 18 * s) wins.push([x + w / 2 - 4 * s, base - h - rh * 0.55, 8 * s, 10 * s, r() < 0.5]);
  }
  const door = [x + w * r.range(0.15, 0.7), base - 22 * s, 10 * s, 22 * s];
  return { x, base, w, h, rh, kind, wall, roof, wins, door, s, chim: r() < 0.3 ? r.range(0.2, 0.75) : -1 };
}
function drawHouse(c, o) {
  const { x, base, w, h, rh, kind, s } = o;
  const top = base - h;
  // the wall, ribbed like corrugated iron
  c.fillStyle = o.wall; c.fillRect(x, top, w, h);
  c.strokeStyle = shade(o.wall, 0.78); c.lineWidth = Math.max(0.5, 0.8 * s);
  c.beginPath(); for (let xx = x + 3 * s; xx < x + w; xx += 3.2 * s) { c.moveTo(xx, top + 1); c.lineTo(xx, base); } c.stroke();
  // the roof and its snow
  let roofPts;
  if (kind === 'gable') roofPts = [[x - 4 * s, top], [x + w / 2, top - rh], [x + w + 4 * s, top]];
  else if (kind === 'side') roofPts = [[x - 4 * s, top], [x + 6 * s, top - rh * 0.6], [x + w - 6 * s, top - rh * 0.6], [x + w + 4 * s, top]];
  else roofPts = [[x - 3 * s, top], [x - 3 * s, top - 5 * s], [x + w + 3 * s, top - 5 * s], [x + w + 3 * s, top]];
  if (o.chim > 0) { c.fillStyle = '#3b3f45'; c.fillRect(x + w * o.chim, top - rh * 0.9, 7 * s, rh * 0.7); }
  c.fillStyle = o.roof; poly(c, roofPts); c.fill();
  c.save(); poly(c, roofPts); c.clip();
  c.fillStyle = '#dbe6ea';
  if (kind === 'gable') { poly(c, [[x + w / 2, top - rh - 2], [x + w / 2 - w * 0.3, top - rh * 0.4], [x + w / 2 + w * 0.3, top - rh * 0.4]]); c.fill(); }
  else c.fillRect(x - 6 * s, top - rh, w + 12 * s, (kind === 'side' ? rh * 0.32 : 3 * s));
  c.restore();
  c.fillStyle = '#dbe6ea'; c.fillRect(x - 4 * s, top - 1, w + 8 * s, 2 * s);
  // windows: lit warm, or dark; white frames
  for (const [wx, wy, ww, wh, lit] of o.wins) {
    c.fillStyle = '#e6e2d8'; c.fillRect(wx - 1.4 * s, wy - 1.4 * s, ww + 2.8 * s, wh + 2.8 * s);
    c.fillStyle = lit ? '#f4c66c' : '#1c2a38'; c.fillRect(wx, wy, ww, wh);
    c.fillStyle = 'rgba(40,40,50,.6)'; c.fillRect(wx + ww / 2 - 0.4 * s, wy, 0.8 * s, wh);
  }
  const [dx, dy, dw, dh] = o.door;
  c.fillStyle = shade(o.roof, 0.8); c.fillRect(dx, dy, dw, dh);
}

function rows(p, r, layer, spec) {
  for (const [base, s, t0] of spec) {
    const houses = [];
    // the town climbs toward the church's hill
    const lift = (x) => (layer === 'near' ? 46 : 22) * Math.exp(-(((x - CX) / 430) ** 2));
    let x = X0 - 30 * s;
    while (x < X1) {
      const o = makeHouse(r, x, base - lift(x + 40 * s), s);
      // the far rows leave the church's hill free
      const behind = layer === 'far' && Math.abs(x + o.w / 2 - CX) < 140;
      if (!behind) houses.push(o);
      x += o.w + r.range(6, 26) * s;
    }
    // a snowy pavement under the row
    const walk = [];
    for (let xx = X0 - 10; xx <= X1 + 10; xx += 20) walk.push([xx, base - lift(xx) - 1]);
    for (let xx = X1 + 10; xx >= X0 - 10; xx -= 20) walk.push([xx, base - lift(xx) + 7 * s]);
    p.fill(layer, walk, '#9fb2bf', { t: t0 - 0.2, d: 0.7, reveal: 'wipe' });
    // parked cars under snow, and people walking home, on the near pavements
    if (layer === 'near') {
      const cars = [], folk = [];
      for (let cx = X0 + r.range(30, 120); cx < X1 - 40; cx += r.range(150, 320)) cars.push([cx, base - lift(cx) + 6 * s, r.pick(['#7a2a28', '#2c4058', '#3d4a3a', '#5a5f66', '#8a6a2a'])]);
      for (let fx = X0 + r.range(10, 90); fx < X1; fx += r.range(90, 240)) folk.push([fx, base - lift(fx) + 5 * s, r.pick(['#1f2a36', '#3a2a30', '#2a3a3a']), r() < 0.5 ? 1 : -1]);
      p.group('lamps', { x: X0, y: base - 120 * s, w: X1 - X0, h: 140 * s }, (c) => {
        for (const [cx, cy, col] of cars) {
          c.fillStyle = col;
          c.beginPath(); c.moveTo(cx - 26 * s, cy - 3 * s); c.lineTo(cx - 26 * s, cy - 12 * s); c.lineTo(cx - 14 * s, cy - 13 * s); c.lineTo(cx - 8 * s, cy - 22 * s); c.lineTo(cx + 10 * s, cy - 22 * s); c.lineTo(cx + 18 * s, cy - 13 * s); c.lineTo(cx + 27 * s, cy - 11 * s); c.lineTo(cx + 27 * s, cy - 3 * s); c.fill();
          c.fillStyle = '#e4edf0'; c.beginPath(); c.ellipse(cx + 1 * s, cy - 22 * s, 11 * s, 3 * s, 0, 0, Math.PI * 2); c.fill();
          c.fillRect(cx - 26 * s, cy - 14 * s, 13 * s, 2.5 * s); c.fillRect(cx + 16 * s, cy - 14 * s, 11 * s, 2.5 * s);
          c.fillStyle = '#0e141a'; c.beginPath(); c.arc(cx - 15 * s, cy - 3 * s, 4.5 * s, 0, Math.PI * 2); c.arc(cx + 16 * s, cy - 3 * s, 4.5 * s, 0, Math.PI * 2); c.fill();
        }
        for (const [fx, fy, col, dir] of folk) {
          c.fillStyle = col;
          c.beginPath(); c.moveTo(fx - 4 * s, fy - 6 * s); c.lineTo(fx - 5 * s, fy - 24 * s); c.quadraticCurveTo(fx, fy - 29 * s, fx + 5 * s, fy - 24 * s); c.lineTo(fx + 4 * s, fy - 6 * s); c.fill();
          c.fillRect(fx - 3 * s, fy - 7 * s, 2.2 * s, 7 * s); c.fillRect(fx + 1 * s, fy - 7 * s, 2.2 * s, 7 * s);
          c.beginPath(); c.arc(fx, fy - 31 * s, 3.6 * s, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#b83a34'; c.fillRect(fx - 3.6 * s, fy - 27.5 * s, 7.2 * s, 2.2 * s);
        }
      }, { t: t0 + 1.1, d: 0.7, reveal: 'fade' });
    }
    // the row in four parts, from the middle out
    const parts = [[], [], [], []];
    for (const o of houses) parts[clamp(Math.floor(((o.x + o.w / 2 - X0) / (X1 - X0)) * 4), 0, 3)].push(o);
    [1, 2, 0, 3].forEach((k, i) => {
      const hs = parts[k];
      if (!hs.length) return;
      const bx = Math.min(...hs.map((o) => o.x)) - 10, ex = Math.max(...hs.map((o) => o.x + o.w)) + 10;
      const ty = Math.min(...hs.map((o) => o.base - o.h - o.rh)) - 6;
      p.group(layer, { x: bx, y: ty, w: ex - bx, h: base - ty + 4 }, (c) => { for (const o of hs) drawHouse(c, o); },
        { t: t0 + i * 0.16, d: 0.9, reveal: 'rise' });
    });
    // street lamps along the near rows
    if (layer === 'near') {
      const ls = [];
      for (let lx = X0 + r.range(20, 80); lx < X1; lx += r.range(160, 260)) ls.push([lx, base - lift(lx) + 4 * s, s]);
      p.group('lamps', { x: X0, y: base - 170 * s, w: X1 - X0, h: 180 * s }, (c) => {
        for (const [lx, ly, k] of ls) {
          const g = c.createRadialGradient(lx, ly - 70 * k, 0, lx, ly - 70 * k, 40 * k);
          g.addColorStop(0, 'rgba(255,214,140,.55)'); g.addColorStop(1, 'rgba(255,214,140,0)');
          c.fillStyle = g; c.fillRect(lx - 40 * k, ly - 110 * k, 80 * k, 80 * k);
          c.fillStyle = '#20262c'; c.fillRect(lx - 1.2 * k, ly - 70 * k, 2.4 * k, 70 * k);
          c.fillStyle = '#ffe2a8'; c.beginPath(); c.arc(lx, ly - 70 * k, 3.4 * k, 0, Math.PI * 2); c.fill();
        }
      }, { t: t0 + 0.9, d: 0.8, reveal: 'fade' });
    }
  }
}

// ================================================================ Hallgrímskirkja
// the stepped columns, the tower, its clock and belfry, the doorway
function church(p, r) {
  const STEP = 8, CW = 31;         // columns a side, and their width
  const TW = 150;                  // the tower's width
  const towerTop = 470;            // where the tower's shaft ends
  const lit = (c, x0, y0, x1, y1, tone = 1) => {
    const g = c.createLinearGradient(0, y1, 0, y0);
    g.addColorStop(0, shade('#e9ecea', tone)); g.addColorStop(0.55, shade('#c2cacd', tone)); g.addColorStop(1, shade('#7e8d97', tone));
    c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  };
  // the stepped wings, from the tower outward, each column lower than the last
  const cols = [];
  for (let side = -1; side <= 1; side += 2) {
    for (let k = 0; k < STEP; k++) {
      const xa = side < 0 ? CX - TW / 2 - (k + 1) * CW : CX + TW / 2 + k * CW;
      const top = lerp(600, 1150, (k / (STEP - 1)) ** 0.92);
      cols.push([xa, top, k, side]);
    }
  }
  cols.sort((a, b) => a[2] - b[2]);
  cols.forEach(([xa, top, k, side], i) => {
    p.group('church', { x: xa - 3, y: top - 10, w: CW + 6, h: BASE - top + 12 }, (c) => {
      lit(c, xa, top, xa + CW, BASE, side < 0 ? 0.96 : 0.88);
      // each column a bundle of three flutes, with the rounded head of basalt
      c.strokeStyle = 'rgba(70,82,92,.55)'; c.lineWidth = 1;
      c.beginPath();
      for (let f = 1; f < 3; f++) { c.moveTo(xa + f * CW / 3, top + 6); c.lineTo(xa + f * CW / 3, BASE); }
      c.stroke();
      c.strokeStyle = 'rgba(40,50,60,.8)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(xa, top); c.lineTo(xa, BASE); c.moveTo(xa + CW, top); c.lineTo(xa + CW, BASE); c.stroke();
      c.fillStyle = '#f2f4f2'; c.fillRect(xa, top, CW, 4);
      // the column's outer face in shade
      c.fillStyle = 'rgba(30,45,60,.32)'; side < 0 ? c.fillRect(xa, top, 6, BASE - top) : c.fillRect(xa + CW - 6, top, 6, BASE - top);
    }, { t: 6.0 + k * 0.17 + (side > 0 ? 0.06 : 0), d: 1.1, reveal: 'rise' });
  });
  // the tower: a shaft of columns, the belfry, the steeple
  p.group('church', { x: CX - TW / 2 - 4, y: towerTop - 6, w: TW + 8, h: BASE - towerTop + 8 }, (c) => {
    lit(c, CX - TW / 2, towerTop, CX + TW / 2, BASE, 1.02);
    c.strokeStyle = 'rgba(60,72,84,.5)'; c.lineWidth = 1;
    c.beginPath();
    for (let f = 1; f < 10; f++) { const xx = CX - TW / 2 + f * TW / 10; c.moveTo(xx, towerTop + 4); c.lineTo(xx, BASE); }
    c.stroke();
    c.strokeStyle = 'rgba(40,50,60,.8)'; c.lineWidth = 1.6; c.strokeRect(CX - TW / 2, towerTop, TW, BASE - towerTop);
  }, { t: 7.2, d: 1.6, reveal: 'rise' });
  // the upper tower, narrower, with the belfry's tall openings and the clocks
  const ut = 300, uw = 104;
  p.group('church', { x: CX - uw / 2 - 30, y: ut - 150, w: uw + 60, h: towerTop - ut + 160 }, (c) => {
    lit(c, CX - uw / 2, ut, CX + uw / 2, towerTop + 2, 0.95);
    c.strokeStyle = 'rgba(40,50,60,.8)'; c.lineWidth = 1.4; c.strokeRect(CX - uw / 2, ut, uw, towerTop - ut);
    // a ledge between the two
    c.fillStyle = '#dfe4e4'; c.fillRect(CX - TW / 2 - 4, towerTop - 6, TW + 8, 8);
    // the belfry: five tall slits
    c.fillStyle = '#18222c';
    for (let k = 0; k < 5; k++) c.fillRect(CX - uw / 2 + 12 + k * (uw - 24) / 4.6, ut + 22, 8, 64);
    // the steeple, a steep pyramid
    c.fillStyle = '#9aa6ad'; poly(c, [[CX - uw / 2 - 2, ut], [CX, ut - 120], [CX + uw / 2 + 2, ut]]); c.fill();
    c.fillStyle = '#6c7a84'; poly(c, [[CX, ut - 120], [CX + uw / 2 + 2, ut], [CX + 8, ut]]); c.fill();
    c.strokeStyle = 'rgba(40,50,60,.8)'; c.lineWidth = 1.2; poly(c, [[CX - uw / 2 - 2, ut], [CX, ut - 120], [CX + uw / 2 + 2, ut]]); c.stroke();
    c.strokeStyle = '#dfe4e4'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(CX, ut - 120); c.lineTo(CX, ut - 146); c.moveTo(CX - 8, ut - 136); c.lineTo(CX + 8, ut - 136); c.stroke();
  }, { t: 8.4, d: 1.2, reveal: 'rise' });
  // the clock
  p.group('detail', { x: CX - 26, y: ut + 92, w: 52, h: 52 }, (c) => {
    const y = ut + 118;
    c.fillStyle = '#f0ead8'; c.beginPath(); c.arc(CX, y, 21, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#2a333c'; c.lineWidth = 2; c.stroke();
    c.lineWidth = 1.4; c.beginPath();
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; c.moveTo(CX + Math.cos(a) * 15, y + Math.sin(a) * 15); c.lineTo(CX + Math.cos(a) * 19, y + Math.sin(a) * 19); }
    c.moveTo(CX, y); c.lineTo(CX + 8, y - 9); c.moveTo(CX, y); c.lineTo(CX - 2, y - 15);
    c.stroke();
  }, { t: 9.5, d: 0.6, reveal: 'pop' });
  // the few small windows high in the shaft
  p.group('detail', { x: CX - 40, y: towerTop + 20, w: 80, h: 120 }, (c) => {
    c.fillStyle = '#26323d';
    for (let k = 0; k < 3; k++) { c.fillRect(CX - 26 + k * 22, towerTop + 40, 8, 34); c.fillRect(CX - 26 + k * 22, towerTop + 92, 8, 22); }
  }, { t: 9.2, d: 0.9, reveal: 'rise' });
  // the doorway, lit
  p.group('detail', { x: CX - 40, y: BASE - 160, w: 80, h: 164 }, (c) => {
    c.fillStyle = '#e9e1cc';
    c.beginPath(); c.moveTo(CX - 30, BASE); c.lineTo(CX - 30, BASE - 110); c.quadraticCurveTo(CX - 30, BASE - 150, CX, BASE - 156); c.quadraticCurveTo(CX + 30, BASE - 150, CX + 30, BASE - 110); c.lineTo(CX + 30, BASE); c.fill();
    c.fillStyle = '#f3c76f';
    c.beginPath(); c.moveTo(CX - 20, BASE); c.lineTo(CX - 20, BASE - 100); c.quadraticCurveTo(CX - 20, BASE - 134, CX, BASE - 138); c.quadraticCurveTo(CX + 20, BASE - 134, CX + 20, BASE - 100); c.lineTo(CX + 20, BASE); c.fill();
  }, { t: 9.6, d: 0.7, reveal: 'fade' });
  // floodlight: a soft pale wash rising up the facade
  p.group('detail', { x: X0, y: 500, w: X1 - X0, h: BASE - 500 }, (c) => {
    const g = c.createRadialGradient(CX, BASE + 60, 20, CX, BASE + 60, 700);
    g.addColorStop(0, 'rgba(255,236,200,.22)'); g.addColorStop(1, 'rgba(255,236,200,0)');
    c.fillStyle = g; c.fillRect(X0, 500, X1 - X0, BASE - 500);
  }, { t: 9.8, d: 1.2, reveal: 'fade' });
}

// ================================================================ what moves
function life(p, r) {
  // stars that twinkle
  const tw = [];
  for (let i = 0; i < 26; i++) {
    let x = r.range(X0 + 20, X1 - 20);
    if (Math.abs(x - CX) < 90) x += 200;
    tw.push([x, r.range(Y0 + 20, 600), r.range(1.4, 2.4), r() * 6, r.range(1.2, 3)]);
  }
  p.live('life', {
    t: 3.0, d: 1, box: { x: X0, y: Y0, w: X1 - X0, h: 600 },
    draw: (c, time) => {
      c.fillStyle = '#f4f8f2';
      for (const [x, y, s, ph, sp] of tw) {
        const a = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * sp + ph));
        c.globalAlpha = a; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
      }
    },
  });
  // a car's lights on the coast road, going right
  p.live('life', {
    t: 10.2, d: 1, box: { x: X0, y: SHORE - 20, w: X1 - X0, h: 30 },
    draw: (c, time) => {
      const u = ((time - 10.2) * 46) % 360, x = 440 - u, y = SHORE + 2;
      c.globalAlpha *= clamp(u / 40) * clamp((360 - u) / 40);
      c.fillStyle = 'rgba(255,240,200,.95)'; c.beginPath(); c.arc(x, y, 2.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,240,200,.25)'; c.beginPath(); c.moveTo(x, y - 2); c.lineTo(x - 30, y - 5); c.lineTo(x - 30, y + 4); c.fill();
    },
  });
  // a fishing boat's lights crossing the bay, going left
  p.live('life', {
    t: 10.5, d: 1, box: { x: X0, y: RIDGE_FOOT, w: X1 - X0, h: SHORE - RIDGE_FOOT },
    draw: (c, time) => {
      const x = 240 - (time - 10.5) * 6, y = 1030 + Math.sin(time * 1.4) * 0.8;
      c.fillStyle = '#0a141c'; poly(c, [[x - 16, y - 4], [x + 18, y - 4], [x + 12, y + 2], [x - 12, y + 2]]); c.fill();
      c.fillRect(x - 4, y - 10, 9, 6);
      c.fillStyle = '#ffd994'; c.fillRect(x - 2, y - 8, 2, 2); c.fillRect(x + 2, y - 8, 2, 2);
      c.fillStyle = '#ff6a5a'; c.beginPath(); c.arc(x - 1, y - 18, 1.6, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#2a3640'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 1, y - 10); c.lineTo(x - 1, y - 18); c.stroke();
      c.fillStyle = 'rgba(255,217,148,.4)'; c.fillRect(x - 1, y + 3, 3, 12);
    },
  });
}

// ================================================================ the name
function title(p) {
  const y = 1790;
  p.type('title', TITLE, W / 2, y, { family: FACE, weight: 800, size: 230, color: NAVY, align: 'center', track: 0.06, fit: X1 - X0 - 20, t: 10.8, gap: 0.16, d: 0.8, reveal: 'rise' });
  p.group('title', { x: X0, y: 1830, w: X1 - X0, h: 6 }, (c) => { c.fillStyle = NAVY; c.fillRect(X0, 1832, X1 - X0, 2); }, { t: 12.4, d: 0.9, reveal: 'wipe' });
  const cap = (text, x, align, t) => p.group('title', { x: align === 'right' ? x - 700 : x - 10, y: 1850, w: 720, h: 60 }, (c) => {
    c.font = `500 26px ${FACE}`; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillStyle = SLATE;
    if (c.letterSpacing !== undefined) c.letterSpacing = '6px';
    c.fillText(text, x, 1890);
  }, { t, d: 0.8, reveal: align === 'right' ? 'wipeL' : 'wipe' });
  cap('ÍSLAND', X0, 'left', 12.8);
  cap('64°08′N 21°56′W', X1, 'right', 13.0);
}
