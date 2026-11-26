// Mexico City: a folk painting under papel picado. Three strings of cut-paper
// banners across a turquoise sky; the volcanoes Iztaccíhuatl and Popocatépetl
// behind a valley of painted houses; the Palacio de Bellas Artes with its orange
// tiled dome among jacarandas, the Angel of Independence on her column, the
// Torre Latinoamericana; a crowd of round muralist figures with calla lilies;
// trajineras with painted arches on a Xochimilco canal. The frame is woven
// stripes, like a serape, and the name is painted in many colors.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, shade, lerp, clamp, poly } from '../kit.js';

const INK = '#2b1630', CREAM = '#f7ecd2', PAPER = '#f3e3c0';
const PINK = '#e0337c', MAGENTA = '#b81e64', ORANGE = '#f08024', YELLOW = '#f6c232', TURQ = '#17a19d', TEAL = '#0f7d7c';
const GREEN = '#3e9b48', DGREEN = '#256a3a', PURPLE = '#7a4ca6', JACA = '#9b72cf', JACA_L = '#c2a2e6', BLUE = '#2d5fa6';
const RED = '#d43a2a', TERRA = '#c4643a', GOLD = '#e8b23a', MARBLE = '#f1e7d0', SKIN = ['#8e5134', '#a8643f', '#7a4329', '#b9774c'];
const FOLK = [PINK, ORANGE, YELLOW, TURQ, GREEN, PURPLE, RED, BLUE];
const HOUSE = ['#f2a7b8', '#f6d36b', '#9fd4cf', '#f5b072', '#c8dc8a', '#e8e0cc', '#b9a6e0', '#ef8d7a', '#f7efe0'];

const FACE = '"Bowlby One SC", sans-serif';
const NAMES = ['LUPITA', 'XÓCHITL', 'ROSITA'];

export const city = {
  id: 'mexico-city', name: 'Mexico City', wall: '#3a1530',
  alt: 'A folk painting of Mexico City under strings of papel picado: the Palacio de Bellas Artes with its orange tiled dome among purple jacarandas, the Angel of Independence on her column, the Torre Latinoamericana and the Metropolitan Cathedral, the volcanoes Popocatépetl and Iztaccíhuatl, a crowd of round mural figures carrying calla lilies, and trajineras with painted arches on a canal, in a border of serape stripes',
  google: 'family=Bowlby+One+SC',
  fonts: [['400 100px "Bowlby One SC"', 'MÉXICO CIUDAD DE TENOCHTITLAN · ' + NAMES.join(' ')]],
  build,
};

// the picture inside the woven border
const BW = 52, PX = BW, PY = BW, PW = W - 2 * BW, PH = H - 2 * BW;
const HORIZON = 800, PLAZA = 1172, CANAL = 1352, BAND = 1678;

function build() {
  const p = new Plate({ paper: PAPER, seed: 1325 });
  const r = p.r;
  p.clip = { x: PX, y: PY, w: PW, h: PH };
  p.stack('sky', 'clouds', 'volcano', 'smoke', 'far', 'torre', 'cathedral', 'bellas', 'angel', 'trees', 'plaza', 'poplars', 'crowd', 'balloons',
    'canal', 'boats', 'bank', 'flagsBack', 'flagsMid', 'flagsFront', 'butterflies', 'band', 'title', 'border');
  p.layer('border', { clip: false });

  border(p);
  sky(p, r);
  volcanoes(p, r);
  farCity(p, r);
  torre(p);
  cathedral(p);
  bellasArtes(p, r);
  angel(p);
  jacarandas(p, r);
  plaza(p, r);
  poplars(p, r);
  crowd(p, r);
  canal(p, r);
  banners(p, r);
  life(p, r);
  title(p, r);
  return p;
}

// ================================================================ helpers
function shape(c, pts, fill, lw = 3, line = INK) {
  poly(c, pts); if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }
}
function circle(c, x, y, rr, fill, lw = 0, line = INK) {
  c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); }
}
function arch(c, x, y, w, h) {
  const rr = w / 2;
  c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + rr); c.arc(x + rr, y + rr, rr, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath();
}

// ================================================================ the serape border
function border(p) {
  // stripes from the outside in: [color, width]
  const stripes = [[INK, 7], [PINK, 9], [YELLOW, 4], [TURQ, 8], [CREAM, 2], [ORANGE, 5], [GREEN, 6], [CREAM, 2], [RED, 5], [INK, 4]];
  let inset = 0;
  stripes.forEach(([col, w], i) => {
    const m = inset + w / 2;
    const pts = [[m, H / 2], [m, m], [W - m, m], [W - m, H - m], [m, H - m], [m, H / 2]];
    p.pen('border', pts, col, w + 0.6, { t: 0.1 + i * 0.07, d: 1.5, cap: 'butt' });
    inset += w;
  });
  // the weave: little ticks across the pink stripe, like a serape's fringe of color
  p.group('border', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = YELLOW;
    const m = 7 + 4.5;
    for (let x = 20; x < W - 20; x += 14) { c.fillRect(x, m - 2, 6, 4); c.fillRect(x, H - m - 2, 6, 4); }
    for (let y = 20; y < H - 20; y += 14) { c.fillRect(m - 2, y, 4, 6); c.fillRect(W - m - 2, y, 4, 6); }
    c.fillStyle = INK;
    const n = 7 + 9 + 4 + 4;
    for (let x = 30; x < W - 30; x += 28) { poly(c, [[x, n - 3], [x + 4, n], [x, n + 3], [x - 4, n]]); c.fill(); poly(c, [[x, H - n - 3], [x + 4, H - n], [x, H - n + 3], [x - 4, H - n]]); c.fill(); }
    for (let y = 30; y < H - 30; y += 28) { poly(c, [[n - 3, y], [n, y - 4], [n + 3, y], [n, y + 4]]); c.fill(); poly(c, [[W - n - 3, y], [W - n, y - 4], [W - n + 3, y], [W - n, y + 4]]); c.fill(); }
  }, { t: 1.4, d: 0.8, reveal: 'fade' });
}

// ================================================================ sky, clouds
function sky(p, r) {
  p.group('sky', { x: 0, y: 0, w: W, h: CANAL }, (c) => {
    const g = c.createLinearGradient(0, PY, 0, HORIZON + 40);
    g.addColorStop(0, '#62c3bd'); g.addColorStop(0.55, '#a9dccf'); g.addColorStop(1, '#f6e4b0');
    c.fillStyle = g; c.fillRect(0, 0, W, HORIZON + 200);
    // painted strokes of the brush across the sky
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 6; c.lineCap = 'round';
    const rr = (i) => ((Math.sin(i * 91.7) * 43758.5) % 1 + 1) % 1;
    c.beginPath();
    for (let i = 0; i < 60; i++) { const x = PX + rr(i) * PW, y = PY + 20 + rr(i + 7) * 640, L = 40 + rr(i + 3) * 120; c.moveTo(x, y); c.lineTo(x + L, y + 2); }
    c.stroke();
  }, { t: 0.3, d: 1.2, reveal: 'fade', ease: 'soft' });
  // round folk clouds with a painted edge
  const clouds = [[180, 560, 1.0], [640, 520, 0.8], [1080, 590, 0.7]];
  clouds.forEach(([x, y, s], i) => {
    const puffs = [[0, 0, 34], [40, -18, 42], [86, -6, 36], [120, 6, 26], [-34, 8, 24]].map(([dx, dy, rr]) => [x + dx * s, y + dy * s, rr * s]);
    p.group('clouds', { x: x - 70 * s, y: y - 70 * s, w: 220 * s, h: 110 * s }, (c) => {
      c.strokeStyle = INK; c.lineWidth = 5;
      for (const [cx, cy, rr] of puffs) { c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.stroke(); }
      c.fillStyle = '#fff8e6';
      for (const [cx, cy, rr] of puffs) { c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = 'rgba(160,215,210,.6)';
      for (const [cx, cy, rr] of puffs) { c.beginPath(); c.arc(cx + rr * 0.15, cy + rr * 0.35, rr * 0.62, 0, Math.PI); c.fill(); }
      c.fillStyle = '#fff8e6'; c.fillRect(x - 70 * s, y + 18 * s, 220 * s, 30);
    }, { t: 1.0 + i * 0.25, d: 0.8, reveal: 'pop' });
  });
}

// ================================================================ the volcanoes
function volcanoes(p, r) {
  // Iztaccíhuatl, the long white ridge, on the left
  const izta = [[PX - 10, HORIZON + 40], [PX - 10, 740], [150, 700], [250, 660], [330, 640], [400, 655], [470, 630], [560, 612], [640, 640], [720, 690], [820, 740], [900, HORIZON + 40]];
  const iztaSnow = [[200, 690], [250, 660], [330, 640], [400, 655], [470, 630], [560, 612], [640, 640], [690, 672], [650, 668], [610, 690], [570, 664], [520, 690], [470, 668], [420, 692], [370, 672], [320, 690], [270, 680], [230, 700]];
  p.group('volcano', boxOf(izta, 6), (c) => {
    shape(c, izta, '#7e8fc4', 3);
    shape(c, iztaSnow, '#fbf6ec', 2.5);
    // ridges down the flank
    c.strokeStyle = 'rgba(43,22,48,.35)'; c.lineWidth = 2; c.beginPath();
    for (let x = 220; x < 800; x += 46) { c.moveTo(x, 700 + (x - 500) ** 2 * 0.0002); c.lineTo(x - 20, HORIZON + 20); }
    c.stroke();
  }, { t: 0.9, d: 1.1, reveal: 'rise' });
  // Popocatépetl, the smoking cone, on the right
  const popo = [[760, HORIZON + 40], [930, 700], [1110, 568], [1180, 534], [1260, 530], [1330, 562], [1460, 660], [PX + PW + 10, 720], [PX + PW + 10, HORIZON + 40]];
  const snow = [[1080, 594], [1110, 568], [1180, 534], [1260, 530], [1330, 562], [1372, 594], [1340, 610], [1310, 588], [1280, 620], [1240, 596], [1200, 626], [1160, 598], [1120, 622]];
  p.group('volcano', boxOf(popo, 6), (c) => {
    shape(c, popo, '#6878b6', 3);
    // the lit flank
    shape(c, [[760, HORIZON + 40], [930, 700], [1110, 568], [1180, 534], [1150, 640], [1060, HORIZON + 40]], '#8796ca', 0);
    shape(c, snow, '#fbf6ec', 2.5);
    c.strokeStyle = 'rgba(43,22,48,.3)'; c.lineWidth = 2; c.beginPath();
    for (let k = 0; k < 9; k++) { const x = 1130 + k * 26; c.moveTo(x, 600 + Math.abs(k - 4) * 6); c.lineTo(980 + k * 70, HORIZON + 20); }
    c.stroke();
    // the crater's lip
    c.fillStyle = '#4b4f86'; c.beginPath(); c.ellipse(1220, 532, 42, 5, 0, 0, Math.PI * 2); c.fill();
  }, { t: 1.2, d: 1.1, reveal: 'rise' });
  // the valley floor, hazy
  p.group('volcano', { x: 0, y: HORIZON - 30, w: W, h: 330 }, (c) => {
    shape(c, [[0, HORIZON + 10], [400, HORIZON - 12], [900, HORIZON + 4], [1300, HORIZON - 14], [W, HORIZON], [W, HORIZON + 300], [0, HORIZON + 300]], '#b8c99a', 0);
  }, { t: 1.6, d: 0.8, reveal: 'fade' });
}

// ================================================================ the valley of houses
function farCity(p, r) {
  const rows = [[828, 0.55], [866, 0.68], [910, 0.82], [958, 0.95], [1010, 1.1], [1062, 1.25]];
  rows.forEach(([base, s], ri) => {
    const houses = [];
    for (let x = PX - 10; x < PX + PW + 10;) {
      const w = r.range(34, 70) * s, h = r.range(26, 58) * s;
      houses.push({ x, w, h, col: r.pick(HOUSE), roof: r.int(0, 5), dome: r() < 0.05, tank: r() < 0.25, win: r.int(1, 3) });
      x += w - r.range(0, 6) * s;
    }
    p.group('far', { x: 0, y: base - 110 * s, w: W, h: 116 * s + 10 }, (c) => {
      c.lineJoin = 'round';
      for (const hs of houses) {
        const { x, w, h, col } = hs, y = base - h;
        shape(c, [[x, base], [x, y], [x + w, y], [x + w, base]], col, 1.6 * s + 0.4);
        // a parapet, or a pitched tile roof
        if (hs.roof === 0) shape(c, [[x - 2, y], [x + w / 2, y - h * 0.3], [x + w + 2, y]], TERRA, 1.4 * s);
        else { c.fillStyle = shade(col, 0.85); c.fillRect(x, y, w, 3 * s); }
        if (hs.tank) { c.fillStyle = '#4a4a5a'; c.fillRect(x + w * 0.6, y - 9 * s, 10 * s, 9 * s); }
        if (hs.dome) {
          c.fillStyle = YELLOW; c.beginPath(); c.arc(x + w / 2, y, w * 0.32, Math.PI, 0); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke();
          c.fillStyle = BLUE; for (let k = -2; k <= 2; k++) c.fillRect(x + w / 2 + k * w * 0.1 - 1, y - w * 0.18, 2, w * 0.16);
        }
        // a door and windows
        c.fillStyle = INK;
        c.fillRect(x + w * 0.42, base - h * 0.42, w * 0.16, h * 0.42);
        for (let k = 0; k < hs.win; k++) c.fillRect(x + w * (0.12 + k * 0.62 / Math.max(1, hs.win - 1 || 1)), y + h * 0.22, w * 0.12, h * 0.18);
        if (h > 40 * s) for (let k = 0; k < 2; k++) c.fillRect(x + w * (0.16 + k * 0.56), y + h * 0.55, w * 0.12, h * 0.16);
      }
    }, { t: 1.8 + ri * 0.22, d: 0.7, reveal: 'rise' });
  });
}

// ================================================================ the Torre Latinoamericana
function torre(p) {
  const x0 = 236, x1 = 352, base = 1050, top = 520;
  p.group('torre', { x: x0 - 10, y: 380, w: x1 - x0 + 20, h: base - 380 + 6 }, (c) => {
    // the shaft: glass in a grid, the shaded side darker
    const sx = x0 + (x1 - x0) * 0.66;
    shape(c, [[x0, base], [x0, top], [x1, top], [x1, base]], '#6f99c6', 0);
    c.fillStyle = '#4c72a2'; c.fillRect(sx, top, x1 - sx, base - top);
    c.strokeStyle = 'rgba(247,236,210,.75)'; c.lineWidth = 1.2; c.beginPath();
    for (let y = top + 10; y < base; y += 11) { c.moveTo(x0, y); c.lineTo(x1, y); }
    for (let x = x0 + 9; x < x1; x += 9) { c.moveTo(x, top); c.lineTo(x, base); }
    c.stroke();
    c.strokeStyle = INK; c.lineWidth = 3; poly(c, [[x0, base], [x0, top], [x1, top], [x1, base]]); c.stroke();
    // the setbacks of the crown
    const steps = [[top, 12], [top - 26, 24], [top - 46, 34], [top - 62, 42]];
    for (const [y, ins] of steps) {
      shape(c, [[x0 + ins, y], [x0 + ins, y - 22], [x1 - ins, y - 22], [x1 - ins, y]], '#6f99c6', 2.5);
      c.fillStyle = 'rgba(247,236,210,.7)'; c.fillRect(x0 + ins + 3, y - 14, x1 - x0 - 2 * ins - 6, 2);
    }
    // the mast
    const mx = (x0 + x1) / 2;
    c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(mx, top - 84); c.lineTo(mx, 392); c.stroke();
    c.lineWidth = 2; c.beginPath(); for (let k = 0; k < 4; k++) { c.moveTo(mx - 10 + k * 2, 470 - k * 18); c.lineTo(mx + 10 - k * 2, 470 - k * 18); } c.stroke();
    circle(c, mx, 390, 5, RED);
  }, { t: 2.8, d: 1.3, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the Metropolitan Cathedral, far off
function cathedral(p) {
  const x = 1150, base = 1000;
  p.group('cathedral', { x: x - 120, y: base - 250, w: 240, h: 256 }, (c) => {
    const ST = '#d9b48c', SH = '#b58d6a';
    // the dome behind
    shape(c, [[x - 30, base - 140], [x - 30, base - 165], [x + 30, base - 165], [x + 30, base - 140]], ST, 2);
    c.beginPath(); c.ellipse(x, base - 165, 30, 34, 0, Math.PI, 0); c.fillStyle = '#e5d3a8'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    circle(c, x, base - 202, 4, GOLD, 1.5);
    // the front between the towers
    shape(c, [[x - 70, base], [x - 70, base - 120], [x - 30, base - 140], [x, base - 150], [x + 30, base - 140], [x + 70, base - 120], [x + 70, base]], ST, 2.5);
    c.fillStyle = INK; arch(c, x - 14, base - 60, 28, 60); c.fill();
    c.fillStyle = SH; for (const dx of [-50, 34]) { arch(c, x + dx, base - 50, 16, 40); c.fill(); }
    // the two bell towers with their bell-shaped caps
    for (const tx of [x - 92, x + 92]) {
      shape(c, [[tx - 24, base], [tx - 24, base - 150], [tx + 24, base - 150], [tx + 24, base]], ST, 2.5);
      shape(c, [[tx - 20, base - 150], [tx - 20, base - 190], [tx + 20, base - 190], [tx + 20, base - 150]], ST, 2.5);
      c.fillStyle = INK; for (const dy of [-110, -184]) { arch(c, tx - 8, base + dy, 16, 28); c.fill(); }
      c.beginPath(); c.moveTo(tx - 20, base - 190); c.bezierCurveTo(tx - 20, base - 214, tx - 4, base - 214, tx, base - 236); c.bezierCurveTo(tx + 4, base - 214, tx + 20, base - 214, tx + 20, base - 190); c.closePath();
      c.fillStyle = '#9c8c78'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      circle(c, tx, base - 238, 3.5, GOLD, 1.2);
    }
  }, { t: 2.5, d: 1.0, reveal: 'rise' });
}

// ================================================================ the Palacio de Bellas Artes
function bellasArtes(p, r) {
  const cx = 800, base = 1128, top = 930;
  // the marble body
  p.group('bellas', { x: 500, y: top - 70, w: 600, h: base - top + 92 }, (c) => {
    // steps
    for (let k = 0; k < 4; k++) shape(c, [[560 - k * 14, base + k * 6], [1040 + k * 14, base + k * 6], [1040 + k * 14, base + k * 6 + 6], [560 - k * 14, base + k * 6 + 6]], k % 2 ? '#e6dabd' : MARBLE, 1.5);
    // wings and the center block
    shape(c, [[530, base], [530, top + 30], [1070, top + 30], [1070, base]], MARBLE, 3);
    shape(c, [[660, base], [660, top - 4], [940, top - 4], [940, base]], MARBLE, 3);
    // the shaded edges of the bays
    c.fillStyle = 'rgba(180,150,110,.35)'; c.fillRect(916, top - 4, 24, base - top + 4); c.fillRect(1046, top + 30, 24, base - top - 30);
    // the three entrance arches with their glass
    for (let k = 0; k < 3; k++) {
      const ax = 690 + k * 80;
      c.fillStyle = INK; arch(c, ax, top + 70, 60, base - top - 70); c.fill();
      c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath();
      for (let y = top + 104; y < base; y += 18) { c.moveTo(ax + 6, y); c.lineTo(ax + 54, y); }
      c.moveTo(ax + 30, top + 74); c.lineTo(ax + 30, base); c.stroke();
    }
    // paired columns between the arches
    for (const x of [668, 680, 754, 766, 834, 846, 914, 926]) {
      shape(c, [[x - 4, base], [x - 4, top + 40], [x + 4, top + 40], [x + 4, base]], '#fbf4e2', 1.3);
      c.fillStyle = GOLD; c.fillRect(x - 6, top + 34, 12, 6);
    }
    // the wings' arched windows and their balconies
    for (const wx of [552, 600, 962, 1010]) {
      c.fillStyle = INK; arch(c, wx, top + 80, 30, 66); c.fill();
      c.fillStyle = INK; arch(c, wx + 4, top + 168, 22, 40); c.fill();
      c.fillStyle = '#e6dabd'; c.fillRect(wx - 4, top + 146, 38, 6);
    }
    // the frieze: a band of orange tile and gold dots
    c.fillStyle = ORANGE; c.fillRect(530, top + 30, 540, 10); c.fillRect(660, top - 4, 280, 12);
    c.fillStyle = YELLOW; for (let x = 538; x < 1066; x += 12) { c.beginPath(); c.arc(x, top + 35, 2.2, 0, Math.PI * 2); c.fill(); }
    // the balustrade along the roof
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath();
    c.moveTo(530, top + 22); c.lineTo(660, top + 22); c.moveTo(940, top + 22); c.lineTo(1070, top + 22);
    for (let x = 536; x < 660; x += 8) { c.moveTo(x, top + 22); c.lineTo(x, top + 30); }
    for (let x = 944; x < 1070; x += 8) { c.moveTo(x, top + 22); c.lineTo(x, top + 30); }
    c.stroke();
    // a sculpted group over the doors, as a gold cartouche
    shape(c, [[760, top - 4], [770, top - 26], [800, top - 36], [830, top - 26], [840, top - 4]], GOLD, 2.5);
  }, { t: 3.6, d: 1.1, reveal: 'rise', ease: 'inOut' });

  // the corner cupolas
  for (const x of [566, 1034]) {
    p.group('bellas', { x: x - 44, y: top - 80, w: 88, h: 120 }, (c) => {
      shape(c, [[x - 26, top + 30], [x - 26, top - 4], [x + 26, top - 4], [x + 26, top + 30]], MARBLE, 2.5);
      c.fillStyle = INK; for (const dx of [-14, 6]) { arch(c, x + dx, top + 2, 8, 20); c.fill(); }
      tiledDome(c, x, top - 4, 34, 52, 4);
      circle(c, x, top - 60, 5, GOLD, 2);
    }, { t: 4.3 + (x > 800 ? 0.15 : 0), d: 0.6, reveal: 'pop' });
  }
  // the drum and the great tiled dome
  p.group('bellas', { x: 620, y: 600, w: 360, h: top - 596 }, (c) => {
    shape(c, [[676, top - 4], [676, 846], [924, 846], [924, top - 4]], MARBLE, 3);
    for (let k = 0; k < 6; k++) { const ox = 700 + k * 40; circle(c, ox + 10, 878, 11, INK); circle(c, ox + 10, 878, 11, null, 2, GOLD); }
    c.fillStyle = ORANGE; c.fillRect(676, 846, 248, 8);
    tiledDome(c, 800, 846, 144, 186, 9);
  }, { t: 4.6, d: 1.0, reveal: 'rise', ease: 'inOut' });
  // the lantern, and the eagle with spread wings on its crown
  p.group('bellas', { x: 740, y: 560, w: 120, h: 110 }, (c) => {
    shape(c, [[780, 668], [780, 632], [820, 632], [820, 668]], MARBLE, 2.5);
    c.fillStyle = INK; for (const dx of [785, 803]) { arch(c, dx, 638, 10, 24); c.fill(); }
    shape(c, [[774, 632], [800, 614], [826, 632]], ORANGE, 2.5);
    // the eagle
    const ey = 596;
    shape(c, [[800, ey + 14], [770, ey - 6], [762, ey - 22], [782, ey - 12], [792, ey - 2], [800, ey - 14], [808, ey - 2], [818, ey - 12], [838, ey - 22], [830, ey - 6]], GOLD, 2);
    circle(c, 800, ey - 18, 4, GOLD, 1.5);
  }, { t: 5.4, d: 0.6, reveal: 'pop' });
}
// a dome of orange and yellow tile, in rows of scales, with ribs to its crown
function tiledDome(c, cx, base, rw, rh, ribs) {
  const path = () => { c.beginPath(); c.moveTo(cx - rw, base); c.bezierCurveTo(cx - rw, base - rh * 0.62, cx - rw * 0.42, base - rh * 0.92, cx, base - rh); c.bezierCurveTo(cx + rw * 0.42, base - rh * 0.92, cx + rw, base - rh * 0.62, cx + rw, base); c.closePath(); };
  c.save(); path(); c.fillStyle = ORANGE; c.fill(); c.clip();
  // rows of scales, alternating yellow and orange
  const rows = Math.max(4, Math.round(rh / 14));
  for (let j = 0; j < rows; j++) {
    const y = base - (j + 0.5) * (rh / rows), sw = Math.max(6, rw / 6);
    c.fillStyle = j % 2 ? YELLOW : '#f5a03c';
    for (let x = cx - rw + (j % 2) * sw / 2; x < cx + rw; x += sw) { c.beginPath(); c.arc(x, y, sw * 0.46, 0, Math.PI); c.fill(); }
  }
  // shading to the right
  const g = c.createLinearGradient(cx - rw, 0, cx + rw, 0);
  g.addColorStop(0, 'rgba(255,240,200,.18)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(110,30,10,.35)');
  c.fillStyle = g; c.fillRect(cx - rw, base - rh, 2 * rw, rh);
  // the ribs
  c.strokeStyle = MARBLE; c.lineWidth = Math.max(1.5, rw / 30);
  c.beginPath();
  for (let k = 1; k < ribs; k++) {
    const f = -1 + (2 * k) / ribs;
    c.moveTo(cx + f * rw, base); c.quadraticCurveTo(cx + f * rw * 0.9, base - rh * 0.75, cx, base - rh);
  }
  c.stroke();
  c.restore();
  path(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
}

// ================================================================ the Angel of Independence
function angel(p) {
  const x = 1312, base = 1186, capY = 590;
  // the pedestal with its steps
  p.group('angel', { x: x - 110, y: base - 110, w: 220, h: 116 }, (c) => {
    for (let k = 0; k < 3; k++) shape(c, [[x - 100 + k * 12, base - k * 12], [x + 100 - k * 12, base - k * 12], [x + 100 - k * 12, base - k * 12 - 12], [x - 100 + k * 12, base - k * 12 - 12]], k % 2 ? '#e6dabd' : MARBLE, 2);
    shape(c, [[x - 62, base - 36], [x - 62, base - 96], [x + 62, base - 96], [x + 62, base - 36]], MARBLE, 2.5);
    for (const dx of [-74, 74]) shape(c, [[x + dx - 14, base - 36], [x + dx - 14, base - 70], [x + dx + 14, base - 70], [x + dx + 14, base - 36]], '#e6dabd', 2);
    c.fillStyle = INK; c.fillRect(x - 20, base - 84, 40, 30);
    c.fillStyle = GOLD; c.fillRect(x - 16, base - 80, 32, 4);
  }, { t: 5.0, d: 0.6, reveal: 'rise' });
  // the column: fluted, ringed with bands
  p.group('angel', { x: x - 30, y: capY - 30, w: 60, h: base - 96 - capY + 34 }, (c) => {
    const y1 = base - 96;
    shape(c, [[x - 18, y1], [x - 15, capY], [x + 15, capY], [x + 18, y1]], MARBLE, 2.5);
    c.fillStyle = 'rgba(180,150,110,.35)'; c.fillRect(x + 5, capY, 12, y1 - capY);
    c.strokeStyle = 'rgba(43,22,48,.35)'; c.lineWidth = 1; c.beginPath();
    for (const dx of [-9, -3, 3, 9]) { c.moveTo(x + dx, capY + 4); c.lineTo(x + dx * 1.15, y1); } c.stroke();
    for (const f of [0.22, 0.5, 0.78]) { const y = lerp(capY, y1, f); shape(c, [[x - 20, y - 4], [x + 20, y - 4], [x + 20, y + 4], [x - 20, y + 4]], GOLD, 1.6); }
    // the capital and the round base the figure stands on
    shape(c, [[x - 26, capY], [x - 18, capY - 12], [x + 18, capY - 12], [x + 26, capY]], GOLD, 2);
    shape(c, [[x - 12, capY - 12], [x - 12, capY - 24], [x + 12, capY - 24], [x + 12, capY - 12]], MARBLE, 2);
  }, { t: 5.3, d: 1.1, reveal: 'rise', ease: 'inOut' });
  // the gilded winged Victory, a laurel wreath held high
  const fy = capY - 24;
  p.group('angel', { x: x - 90, y: fy - 150, w: 180, h: 156 }, (c) => {
    // wings, swept up and back
    for (const s of [-1, 1]) {
      shape(c, [[x + s * 4, fy - 82], [x + s * 30, fy - 118], [x + s * 62, fy - 138], [x + s * 56, fy - 110], [x + s * 70, fy - 104], [x + s * 50, fy - 84], [x + s * 60, fy - 74], [x + s * 30, fy - 64]], GOLD, 2.2);
      c.strokeStyle = 'rgba(120,70,10,.6)'; c.lineWidth = 1.2; c.beginPath();
      for (let k = 0; k < 4; k++) { c.moveTo(x + s * (12 + k * 10), fy - 74 - k * 3); c.lineTo(x + s * (26 + k * 10), fy - 106 - k * 6); }
      c.stroke();
    }
    // the robe
    shape(c, [[x - 10, fy], [x - 13, fy - 50], [x - 8, fy - 80], [x + 8, fy - 80], [x + 12, fy - 46], [x + 16, fy]], GOLD, 2.2);
    c.strokeStyle = 'rgba(120,70,10,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 2, fy - 70); c.lineTo(x - 4, fy - 2); c.moveTo(x + 5, fy - 60); c.lineTo(x + 8, fy - 2); c.stroke();
    // the raised arm and the wreath
    shape(c, [[x + 4, fy - 78], [x + 18, fy - 108], [x + 22, fy - 106], [x + 9, fy - 74]], GOLD, 1.8);
    c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(x + 22, fy - 118, 9, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = GOLD; c.lineWidth = 3; c.stroke();
    circle(c, x, fy - 88, 7, GOLD, 2);
  }, { t: 6.3, d: 0.7, reveal: 'pop', ease: 'back' });
}

// ================================================================ jacarandas in flower
function jacarandas(p, r) {
  const trees = [[470, 1150, 70], [585, 1162, 58], [1010, 1160, 62], [1135, 1150, 72], [1450, 1170, 66], [395, 1170, 50], [700, 1172, 46], [895, 1172, 46]];
  trees.forEach(([x, y, rad], i) => {
    const blobs = [];
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + r() * 0.5; blobs.push([x + Math.cos(a) * rad * 0.5, y - rad * 1.2 + Math.sin(a) * rad * 0.32, rad * r.range(0.42, 0.58)]); }
    blobs.push([x, y - rad * 1.35, rad * 0.55]);
    const dots = [];
    for (let k = 0; k < 170; k++) {
      const [bx, by, br] = r.pick(blobs), a = r() * Math.PI * 2, d = Math.sqrt(r()) * br;
      dots.push([bx + Math.cos(a) * d, by + Math.sin(a) * d, r.range(2.2, 4.6), r() < 0.35]);
    }
    p.group('trees', { x: x - rad * 1.3, y: y - rad * 2.1, w: rad * 2.6, h: rad * 2.2 }, (c) => {
      // the trunk and its branches
      c.strokeStyle = '#5a3a2a'; c.lineCap = 'round'; c.lineWidth = rad * 0.16;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - rad * 0.7); c.lineTo(x - rad * 0.4, y - rad * 1.1); c.moveTo(x, y - rad * 0.7); c.lineTo(x + rad * 0.45, y - rad * 1.05); c.stroke();
      c.fillStyle = INK; for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx, by, br + 2.5, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = PURPLE; for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(bx, by, br, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = JACA; c.beginPath(); for (const [dx, dy, dr, l] of dots) if (!l) { c.moveTo(dx + dr, dy); c.arc(dx, dy, dr, 0, Math.PI * 2); } c.fill();
      c.fillStyle = JACA_L; c.beginPath(); for (const [dx, dy, dr, l] of dots) if (l) { c.moveTo(dx + dr, dy); c.arc(dx, dy, dr, 0, Math.PI * 2); } c.fill();
    }, { t: 6.0 + i * 0.12, d: 0.6, reveal: 'pop', ease: 'back' });
  });
}

// ================================================================ the plaza and the canal's banks
function plaza(p, r) {
  p.group('plaza', { x: 0, y: PLAZA - 6, w: W, h: CANAL - PLAZA + 12 }, (c) => {
    c.fillStyle = '#e2b56e'; c.fillRect(0, PLAZA, W, CANAL - PLAZA);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, PLAZA); c.lineTo(W, PLAZA); c.stroke();
    // the paving, in lines that run to the palace
    c.strokeStyle = 'rgba(150,90,40,.35)'; c.lineWidth = 1.5; c.beginPath();
    for (let k = -14; k <= 14; k++) { c.moveTo(800 + k * 40, PLAZA); c.lineTo(800 + k * 120, CANAL); }
    for (let y = PLAZA + 16; y < CANAL; y += 22) { c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
  }, { t: 7.0, d: 0.8, reveal: 'wipe', ease: 'inOut' });
}
function poplars(p, r) {
  // ahuejotes: the tall slim willows that hold the chinampas' banks
  const xs = [96, 168, 1432, 1500, 236];
  xs.forEach((x, i) => {
    const h = r.range(330, 420), w = r.range(30, 40), y = CANAL + 6;
    const ticks = [];
    for (let k = 0; k < 46; k++) { const t = r(); const yy = y - 30 - t * (h - 40), half = w * Math.sin(Math.PI * clamp(1 - t * 0.98, 0.05, 1)) ** 0.7; ticks.push([x + r.range(-half * 0.8, half * 0.8), yy]); }
    p.group('poplars', { x: x - w - 8, y: y - h - 10, w: 2 * w + 16, h: h + 14 }, (c) => {
      c.strokeStyle = '#4a3020'; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 40); c.stroke();
      c.beginPath(); c.moveTo(x, y - 20); c.bezierCurveTo(x - w * 1.25, y - h * 0.35, x - w * 0.6, y - h * 0.85, x, y - h); c.bezierCurveTo(x + w * 0.6, y - h * 0.85, x + w * 1.25, y - h * 0.35, x, y - 20); c.closePath();
      c.fillStyle = DGREEN; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.strokeStyle = '#5fae58'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath();
      for (const [tx, ty] of ticks) { c.moveTo(tx, ty); c.lineTo(tx, ty + 9); } c.stroke();
    }, { t: 6.6 + i * 0.15, d: 0.8, reveal: 'rise' });
  });
}

// ================================================================ the crowd, as round mural figures
function crowd(p, r) {
  // three rows, back to front, each figure seen from behind or side
  const rows = [[PLAZA + 70, 0.62], [PLAZA + 112, 0.8], [PLAZA + 168, 1.0]];
  rows.forEach(([y, s], ri) => {
    const figs = [];
    for (let x = PX + 280 + ri * 30; x < PX + PW - 230; x += r.range(64, 96) * s) {
      if (ri === 2 && x > 640 && x < 760) { x += 40; continue; } // the balloon seller's place
      figs.push({
        x: x + r.range(-10, 10), s: s * r.range(0.9, 1.08), skin: r.pick(SKIN),
        kind: r.pick(['rebozo', 'rebozo', 'hat', 'hat', 'callas', 'braid']), col: r.pick([BLUE, RED, PINK, TURQ, PURPLE, ORANGE, GREEN]),
        col2: r.pick([CREAM, YELLOW, '#f2f2e6']), lean: r.range(-0.06, 0.06),
      });
    }
    const per = 5;
    for (let k = 0; k * per < figs.length; k++) {
      const g = figs.slice(k * per, (k + 1) * per);
      const x0 = Math.min(...g.map((f) => f.x)) - 90 * s, x1 = Math.max(...g.map((f) => f.x)) + 90 * s;
      p.group('crowd', { x: x0, y: y - 220 * s, w: x1 - x0, h: 226 * s }, (c) => { for (const f of g) figure(c, f.x, y, f); },
        { t: 7.6 + ri * 0.45 + k * 0.1, d: 0.6, reveal: 'drop', dy: 18 });
    }
  });
  // the balloon seller in the front row
  p.group('crowd', { x: 640, y: PLAZA + 168 - 210, w: 120, h: 214 }, (c) => figure(c, 700, PLAZA + 168, { s: 1.02, skin: SKIN[0], kind: 'hat', col: '#f2f2e6', col2: RED, lean: 0 }),
    { t: 8.8, d: 0.6, reveal: 'drop', dy: 18 });
}
// one figure: a heavy rounded body, a head, and what it wears or carries
function figure(c, x, y, f) {
  const s = f.s, h = 150 * s;
  c.save(); c.translate(x, y); c.rotate(f.lean); c.translate(-x, -y);
  c.lineJoin = 'round';
  const body = () => {
    c.beginPath();
    c.moveTo(x - 40 * s, y);
    c.bezierCurveTo(x - 46 * s, y - h * 0.4, x - 34 * s, y - h * 0.72, x - 10 * s, y - h * 0.76);
    c.lineTo(x + 10 * s, y - h * 0.76);
    c.bezierCurveTo(x + 34 * s, y - h * 0.72, x + 46 * s, y - h * 0.4, x + 40 * s, y);
    c.closePath();
  };
  const headY = y - h * 0.84, hr = 15 * s;
  if (f.kind === 'callas') {
    // a great basket of calla lilies on the back, bent under it
    const bx = x, by = y - h * 0.82;
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k - 4) * 0.22, L = 70 * s + (k % 3) * 8 * s;
      const tx = bx + Math.cos(a) * L, ty = by - 20 * s + Math.sin(a) * L;
      c.strokeStyle = DGREEN; c.lineWidth = 2.4 * s; c.beginPath(); c.moveTo(bx, by - 10 * s); c.lineTo(tx, ty); c.stroke();
      c.save(); c.translate(tx, ty); c.rotate(a + Math.PI / 2);
      c.beginPath(); c.moveTo(0, 6 * s); c.bezierCurveTo(-13 * s, -2 * s, -10 * s, -18 * s, 0, -22 * s); c.bezierCurveTo(6 * s, -14 * s, 12 * s, -4 * s, 0, 6 * s);
      c.fillStyle = '#fbf7ee'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6 * s; c.stroke();
      c.fillStyle = YELLOW; c.fillRect(-1.2 * s, -10 * s, 2.4 * s, 10 * s);
      c.restore();
    }
    c.beginPath(); c.ellipse(bx, by, 46 * s, 20 * s, 0, 0, Math.PI * 2); c.fillStyle = '#c99a52'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6 * s; c.stroke();
    c.strokeStyle = 'rgba(90,55,20,.6)'; c.lineWidth = 1.4 * s; c.beginPath();
    for (let k = -4; k <= 4; k++) { c.moveTo(bx + k * 10 * s, by - 17 * s); c.lineTo(bx + k * 9 * s, by + 18 * s); } c.stroke();
  }
  body(); c.fillStyle = f.col; c.fill(); c.strokeStyle = INK; c.lineWidth = 3 * s; c.stroke();
  // the folds of the cloth, as round painted shadows
  c.save(); body(); c.clip();
  c.fillStyle = 'rgba(30,10,30,.22)'; c.beginPath(); c.ellipse(x + 30 * s, y - h * 0.3, 18 * s, h * 0.5, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(30,10,30,.28)'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(x - 8 * s, y - h * 0.7); c.quadraticCurveTo(x - 16 * s, y - h * 0.3, x - 10 * s, y); c.moveTo(x + 12 * s, y - h * 0.6); c.quadraticCurveTo(x + 6 * s, y - h * 0.3, x + 14 * s, y); c.stroke();
  c.restore();
  if (f.kind === 'rebozo') {
    // a striped shawl over the head and shoulders
    c.beginPath(); c.moveTo(x - 20 * s, headY - 8 * s); c.quadraticCurveTo(x, headY - 30 * s, x + 20 * s, headY - 8 * s); c.lineTo(x + 38 * s, y - h * 0.48); c.lineTo(x - 38 * s, y - h * 0.48); c.closePath();
    c.fillStyle = f.col2; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6 * s; c.stroke();
    c.strokeStyle = f.col; c.lineWidth = 2.4 * s; c.beginPath();
    for (let k = 1; k < 4; k++) { const yy = lerp(headY, y - h * 0.48, k / 4); c.moveTo(x - 20 * s - k * 5 * s, yy); c.lineTo(x + 20 * s + k * 5 * s, yy); } c.stroke();
  } else {
    circle(c, x, headY, hr, f.skin, 2.6 * s);
    // black hair from behind; a braid down the back
    c.beginPath(); c.arc(x, headY - 2 * s, hr, Math.PI * 0.9, Math.PI * 2.1); c.fillStyle = '#1e1418'; c.fill();
    if (f.kind === 'braid' || f.kind === 'callas') {
      c.fillStyle = '#1e1418'; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x, headY + 14 * s + k * 9 * s, 4.5 * s, 6 * s, 0, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = RED; c.fillRect(x - 4 * s, headY + 48 * s, 8 * s, 4 * s);
    }
    if (f.kind === 'hat') {
      // a wide straw hat
      c.beginPath(); c.ellipse(x, headY - 6 * s, 38 * s, 9 * s, 0, 0, Math.PI * 2); c.fillStyle = '#e8c878'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6 * s; c.stroke();
      c.beginPath(); c.moveTo(x - 14 * s, headY - 8 * s); c.bezierCurveTo(x - 14 * s, headY - 34 * s, x + 14 * s, headY - 34 * s, x + 14 * s, headY - 8 * s); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = f.col2; c.fillRect(x - 13 * s, headY - 14 * s, 26 * s, 4 * s);
    }
  }
  c.restore();
}

// ================================================================ the canal
function canal(p, r) {
  p.group('canal', { x: 0, y: CANAL - 4, w: W, h: BAND - CANAL + 8 }, (c) => {
    const g = c.createLinearGradient(0, CANAL, 0, BAND);
    g.addColorStop(0, '#1d8e8a'); g.addColorStop(1, '#13716f');
    c.fillStyle = g; c.fillRect(0, CANAL, W, BAND - CANAL);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, CANAL); c.lineTo(W, CANAL); c.stroke();
  }, { t: 8.3, d: 0.8, reveal: 'fall', ease: 'inOut' });
  // painted waves: little arcs in rows
  const waves = [];
  for (let y = CANAL + 22; y < BAND - 10; y += 20) {
    for (let x = PX + ((y / 20) % 2) * 24; x < PX + PW; x += 48 + r.range(-6, 6)) waves.push([x, y]);
  }
  p.group('canal', { x: 0, y: CANAL, w: W, h: BAND - CANAL }, (c) => {
    c.strokeStyle = 'rgba(190,240,228,.75)'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath();
    for (const [x, y] of waves) { c.moveTo(x, y); c.quadraticCurveTo(x + 9, y - 7, x + 18, y); }
    c.stroke();
  }, { t: 8.7, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // the near bank, a chinampa with marigolds and cabbages
  const flowers = [];
  for (let x = PX + 10; x < PX + PW; x += r.range(16, 30)) flowers.push([x, BAND - 14 - r() * 18, r() < 0.7 ? ORANGE : YELLOW, r.range(6, 10)]);
  p.group('bank', { x: 0, y: BAND - 50, w: W, h: 56 }, (c) => {
    c.beginPath(); c.moveTo(0, BAND); c.lineTo(0, BAND - 26);
    for (let x = 0; x <= W; x += 40) c.quadraticCurveTo(x + 20, BAND - 36, x + 40, BAND - 26);
    c.lineTo(W, BAND); c.closePath(); c.fillStyle = GREEN; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    for (const [x, y, col, rr] of flowers) {
      c.fillStyle = DGREEN; c.beginPath(); c.ellipse(x - rr * 0.8, y + rr, rr * 0.7, rr * 0.35, -0.5, 0, Math.PI * 2); c.fill();
      circle(c, x, y, rr, col, 1.6);
      c.fillStyle = shade(col, 0.8); c.beginPath(); c.arc(x, y, rr * 0.45, 0, Math.PI * 2); c.fill();
    }
  }, { t: 9.0, d: 0.7, reveal: 'rise' });
}

// a trajinera: a flat boat with a painted arch at its bow and a canopy
function trajinera(c, x, y, s, o, time) {
  const L = 300 * s, bow = x - L / 2, stern = x + L / 2;
  c.lineJoin = 'round';
  // the reflection
  c.fillStyle = 'rgba(10,60,60,.35)'; c.fillRect(bow + 10 * s, y + 4 * s, L - 20 * s, 10 * s);
  // the hull
  shape(c, [[bow, y - 26 * s], [stern, y - 26 * s], [stern - 14 * s, y], [bow + 14 * s, y]], o.hull, 2.6 * s);
  c.fillStyle = YELLOW; c.fillRect(bow + 6 * s, y - 20 * s, L - 12 * s, 4 * s);
  // the posts, the canopy
  c.strokeStyle = INK; c.lineWidth = 3 * s; c.beginPath();
  for (const f of [0.2, 0.5, 0.8]) { c.moveTo(bow + L * f, y - 26 * s); c.lineTo(bow + L * f, y - 86 * s); }
  c.stroke();
  shape(c, [[bow + L * 0.15, y - 86 * s], [bow + L * 0.85, y - 86 * s], [bow + L * 0.88, y - 98 * s], [bow + L * 0.12, y - 98 * s]], o.roof, 2.4 * s);
  c.fillStyle = CREAM; for (let k = 0; k < 9; k++) c.fillRect(bow + L * (0.15 + k * 0.08), y - 97 * s, 10 * s, 10 * s);
  // the passengers at the table
  for (const [f, col] of [[0.32, RED], [0.44, BLUE], [0.6, PINK], [0.7, GREEN]]) {
    shape(c, [[bow + L * f - 11 * s, y - 26 * s], [bow + L * f - 9 * s, y - 50 * s], [bow + L * f + 9 * s, y - 50 * s], [bow + L * f + 11 * s, y - 26 * s]], col, 2 * s);
    circle(c, bow + L * f, y - 58 * s, 7.5 * s, SKIN[(f * 10 | 0) % 4], 2 * s);
  }
  // the boatman and his pole, at the stern
  const px = stern - 24 * s;
  shape(c, [[px - 9 * s, y - 26 * s], [px - 7 * s, y - 64 * s], [px + 7 * s, y - 64 * s], [px + 9 * s, y - 26 * s]], CREAM, 2 * s);
  circle(c, px, y - 72 * s, 7 * s, SKIN[2], 2 * s);
  c.beginPath(); c.ellipse(px, y - 76 * s, 16 * s, 4 * s, 0, 0, Math.PI * 2); c.fillStyle = '#e8c878'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6 * s; c.stroke();
  const pa = 0.35 + Math.sin(time * 0.9 + x * 0.01) * 0.08;
  c.strokeStyle = '#6b4a2a'; c.lineWidth = 3.4 * s; c.beginPath(); c.moveTo(px + 6 * s, y - 60 * s); c.lineTo(px + 6 * s + Math.sin(pa) * 112 * s, y - 60 * s + Math.cos(pa) * 112 * s); c.stroke();
  // the painted arch at the bow with the boat's name
  const aw = 140 * s, ah = 150 * s, ax = bow + 4 * s, ay = y - 26 * s - ah;
  c.beginPath(); c.moveTo(ax, ay + ah); c.lineTo(ax, ay + aw * 0.3); c.quadraticCurveTo(ax + aw / 2, ay - aw * 0.32, ax + aw, ay + aw * 0.3); c.lineTo(ax + aw, ay + ah); c.lineTo(ax + aw - 14 * s, ay + ah); c.lineTo(ax + aw - 14 * s, ay + aw * 0.45);
  c.quadraticCurveTo(ax + aw / 2, ay - aw * 0.04, ax + 14 * s, ay + aw * 0.45); c.lineTo(ax + 14 * s, ay + ah); c.closePath();
  c.fillStyle = o.arch; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6 * s; c.stroke();
  // the name board across it
  shape(c, [[ax - 6 * s, ay + aw * 0.2], [ax + aw + 6 * s, ay + aw * 0.2], [ax + aw + 6 * s, ay + aw * 0.44], [ax - 6 * s, ay + aw * 0.44]], o.board, 2 * s);
  c.font = `400 ${Math.round(20 * s)}px ${FACE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK;
  c.fillText(o.name, ax + aw / 2, ay + aw * 0.325);
  // flowers painted round the crown
  for (let k = 0; k < 7; k++) { const a = Math.PI + (k + 0.5) / 7 * Math.PI, rr = aw / 2 - 7 * s; circle(c, ax + aw / 2 + Math.cos(a) * rr, ay + aw * 0.3 + Math.sin(a) * rr * 0.62 - 4 * s, 4.6 * s, k % 2 ? RED : CREAM, 1.2 * s); }
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  // painted flowers up the posts of the arch
  for (let k = 0; k < 5; k++) {
    const fy = ay + aw * 0.56 + k * 17 * s;
    circle(c, ax + 7 * s, fy, 4.4 * s, k % 2 ? PINK : YELLOW, 1.2 * s);
    circle(c, ax + aw - 7 * s, fy, 4.4 * s, k % 2 ? YELLOW : PINK, 1.2 * s);
  }
}

// ================================================================ papel picado
// one cut-paper flag, hanging from (x, y): the paper with its holes, filled even-odd
function flagPath(c, x, y, w, h, motif) {
  c.beginPath();
  // the paper: a fold at the top, the edge cut in scallops
  c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h);
  const n = 6, sw = w / n;
  for (let k = n - 1; k >= 0; k--) { const sx = x + k * sw; c.lineTo(sx + sw * 0.75, y + h); c.lineTo(sx + sw / 2, y + h - sw * 0.5); c.lineTo(sx + sw * 0.25, y + h); c.lineTo(sx, y + h); }
  c.closePath();
  // a border of little diamonds, inside the edges
  const dd = w * 0.035;
  const diamond = (cx, cy, rx, ry) => { c.moveTo(cx, cy - ry); c.lineTo(cx + rx, cy); c.lineTo(cx, cy + ry); c.lineTo(cx - rx, cy); c.closePath(); };
  for (let k = 0; k < 7; k++) diamond(x + w * (0.12 + k * 0.127), y + h * 0.13, dd, dd * 1.4);
  for (let k = 0; k < 5; k++) { diamond(x + w * 0.09, y + h * (0.26 + k * 0.12), dd, dd * 1.4); diamond(x + w * 0.91, y + h * (0.26 + k * 0.12), dd, dd * 1.4); }
  const cx = x + w / 2, cy = y + h * 0.5;
  const ell = (ex, ey, rx, ry, a) => { c.moveTo(ex + Math.cos(a) * rx, ey + Math.sin(a) * rx); c.ellipse(ex, ey, rx, ry, a, 0, Math.PI * 2); };
  if (motif === 0) {
    // a flower of eight petals
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ell(cx + Math.cos(a) * w * 0.17, cy + Math.sin(a) * w * 0.17, w * 0.1, w * 0.045, a); }
    c.moveTo(cx + w * 0.06, cy); c.arc(cx, cy, w * 0.06, 0, Math.PI * 2);
  } else if (motif === 1) {
    // a lattice of diamonds
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if ((i + j) % 2 === 0) diamond(cx + i * w * 0.1, cy + j * w * 0.1, w * 0.045, w * 0.045);
  } else if (motif === 2) {
    // a bird among leaves
    c.moveTo(cx - w * 0.24, cy + w * 0.02); c.quadraticCurveTo(cx - w * 0.05, cy - w * 0.16, cx + w * 0.16, cy - w * 0.06);
    c.lineTo(cx + w * 0.26, cy - w * 0.1); c.lineTo(cx + w * 0.18, cy); c.quadraticCurveTo(cx, cy + w * 0.14, cx - w * 0.24, cy + w * 0.02); c.closePath();
    ell(cx - w * 0.1, cy + w * 0.2, w * 0.07, w * 0.03, 0.5); ell(cx + w * 0.1, cy + w * 0.22, w * 0.07, w * 0.03, -0.5);
  } else {
    // a sun of triangles round a ring
    c.moveTo(cx + w * 0.1, cy); c.arc(cx, cy, w * 0.1, 0, Math.PI * 2);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2, b = 0.18;
      c.moveTo(cx + Math.cos(a - b) * w * 0.15, cy + Math.sin(a - b) * w * 0.15); c.lineTo(cx + Math.cos(a) * w * 0.27, cy + Math.sin(a) * w * 0.27); c.lineTo(cx + Math.cos(a + b) * w * 0.15, cy + Math.sin(a + b) * w * 0.15); c.closePath();
    }
  }
  // a row of slits under the motif
  for (let k = 0; k < 5; k++) { const sx = x + w * (0.24 + k * 0.13); c.moveTo(sx, y + h * 0.78); c.lineTo(sx + w * 0.05, y + h * 0.78); c.lineTo(sx + w * 0.05, y + h * 0.84); c.lineTo(sx, y + h * 0.84); c.closePath(); }
}
function drawFlag(c, x, y, w, h, col, motif) {
  flagPath(c, x, y, w, h, motif);
  c.fillStyle = 'rgba(43,22,48,.22)'; c.save(); c.translate(3, 4); c.fill('evenodd'); c.restore();
  c.fillStyle = col; c.fill('evenodd');
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x, y, w, 7);
}
function stringRow(y0, sag) { return (x) => y0 + sag * (1 - ((x - 800) / 780) ** 2); }

function banners(p, r) {
  const rows = [
    { layer: 'flagsBack', y0: 64, sag: 40, w: 88, h: 106, gap: 12, t: 9.4, off: 0 },
    { layer: 'flagsMid', y0: 138, sag: 56, w: 102, h: 124, gap: 14, t: 9.9, off: 40 },
  ];
  rows.forEach((row, ri) => {
    const sy = stringRow(row.y0, row.sag);
    const pts = []; for (let x = 0; x <= W; x += 20) pts.push([x, sy(x)]);
    p.pen(row.layer, pts, INK, 2, { t: row.t - 0.4, d: 0.8 });
    let k = 0;
    for (let x = PX + 8 + row.off; x + row.w < PX + PW; x += row.w + row.gap, k++) {
      const fx = x, fy = sy(x + row.w / 2), col = FOLK[(k * 3 + ri * 2) % FOLK.length], motif = (k + ri) % 4;
      p.group(row.layer, { x: fx - 4, y: fy - 4, w: row.w + 12, h: row.h + 12 }, (c) => drawFlag(c, fx, fy, row.w, row.h, col, motif),
        { t: row.t + k * 0.05, d: 0.6, reveal: 'fall', ease: 'out' });
    }
  });
}

// ================================================================ what moves
function life(p, r) {
  // the front string of flags, swaying in the air
  const sy = stringRow(232, 62), fw = 120, fh = 148, gap = 16;
  const flags = [];
  let k = 0;
  for (let x = PX + 4; x + fw < PX + PW; x += fw + gap, k++) flags.push([x, sy(x + fw / 2), FOLK[(k * 5 + 3) % FOLK.length], (k + 2) % 4, r() * 6]);
  const pts = []; for (let x = 0; x <= W; x += 20) pts.push([x, sy(x)]);
  p.pen('flagsFront', pts, INK, 2.4, { t: 10.2, d: 0.8 });
  p.live('flagsFront', {
    t: 10.5, d: 1.0, reveal: 'fall', box: { x: 0, y: 200, w: W, h: 420 },
    draw: (c, time) => {
      for (const [x, y, col, motif, ph] of flags) {
        const a = Math.sin(time * 1.3 + ph) * 0.05;
        c.save(); c.translate(x + fw / 2, y); c.transform(1, 0, a, 1, 0, 0); c.translate(-x - fw / 2, -y);
        drawFlag(c, x, y, fw, fh, col, motif);
        c.restore();
      }
    },
  });
  // smoke from Popocatépetl
  p.live('smoke', {
    t: 2.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (let k = 0; k < 6; k++) {
        const ph = (time * 0.12 + k / 6) % 1;
        const x = 1214 - ph * 170 + Math.sin(ph * 5 + k) * 12, y = 522 - ph * 150, rr = 10 + ph * 30;
        c.globalAlpha = 0.75 * (1 - ph) * Math.min(1, ph * 6);
        circle(c, x, y, rr, '#f6f1e6');
        c.fillStyle = 'rgba(150,160,200,.35)'; c.beginPath(); c.arc(x + rr * 0.2, y + rr * 0.3, rr * 0.6, 0, Math.PI); c.fill();
      }
      c.globalAlpha = 1;
    },
  });
  // trajineras drifting on the canal
  const boats = [
    [880, 1458, 0.86, { hull: RED, roof: TURQ, arch: GREEN, board: CREAM, name: NAMES[2] }],
    [440, 1560, 1.18, { hull: GREEN, roof: PINK, arch: YELLOW, board: CREAM, name: NAMES[0] }],
    [1150, 1636, 1.32, { hull: BLUE, roof: ORANGE, arch: PINK, board: YELLOW, name: NAMES[1] }],
  ];
  boats.forEach(([bx, by, s, o], i) => {
    p.live('boats', {
      t: 9.1 + i * 0.3, d: 1.2, reveal: 'slide', dx: 160 * (i % 2 ? 1 : -1),
      draw: (c, time) => trajinera(c, bx + Math.sin(time * 0.18 + i * 2) * 50, by + Math.sin(time * 1.1 + i) * 2, s, o, time),
    });
  });
  // balloons over the seller's hat
  const balloons = [[-30, -40, PINK], [0, -58, YELLOW], [28, -44, TURQ], [-12, -80, ORANGE], [20, -84, GREEN], [-44, -72, PURPLE], [44, -70, RED]];
  const hx = 700, hy = PLAZA + 168 - 150;
  p.live('balloons', {
    t: 9.0, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineWidth = 1.2;
      balloons.forEach(([dx, dy, col], i) => {
        const bx = hx + dx + Math.sin(time * 1.2 + i) * 4, by = hy + dy - 40 + Math.sin(time * 1.7 + i * 2) * 3;
        c.beginPath(); c.moveTo(hx + 8, hy + 30); c.lineTo(bx, by + 16); c.stroke();
        c.beginPath(); c.ellipse(bx, by, 13, 16, 0, 0, Math.PI * 2); c.fillStyle = col; c.fill(); c.lineWidth = 2; c.stroke(); c.lineWidth = 1.2;
        c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(bx - 4, by - 6, 3, 5, -0.4, 0, Math.PI * 2); c.fill();
      });
    },
  });
  // monarch butterflies
  const bf = [];
  for (let i = 0; i < 9; i++) bf.push([r.range(150, 1450), r.range(640, 1500), r.range(30, 70), r() * 6, r.range(1.3, 1.8)]);
  p.live('butterflies', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const [x0, y0, R, ph, s] of bf) {
        const x = x0 + Math.cos(time * 0.4 + ph) * R, y = y0 + Math.sin(time * 0.7 + ph) * R * 0.5;
        const f = 0.25 + 0.75 * Math.abs(Math.sin(time * 7 + ph * 3));
        for (const sd of [-1, 1]) {
          c.save(); c.translate(x, y); c.scale(sd * f, 1);
          c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(6 * s, -14 * s, 18 * s, -12 * s, 15 * s, -2 * s); c.bezierCurveTo(14 * s, 4 * s, 6 * s, 4 * s, 0, 2 * s);
          c.bezierCurveTo(8 * s, 6 * s, 12 * s, 12 * s, 4 * s, 12 * s); c.closePath();
          c.fillStyle = ORANGE; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
          c.restore();
        }
        c.fillStyle = INK; c.fillRect(x - 1.2, y - 4 * s, 2.4, 14 * s);
      }
    },
  });
}

// ================================================================ the title
function title(p, r) {
  // the painted band, its top edge cut in scallops like the flags
  p.group('band', { x: 0, y: BAND - 30, w: W, h: H - BAND + 30 }, (c) => {
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, BAND);
    for (let x = 0; x < W; x += 40) { c.lineTo(x + 10, BAND); c.quadraticCurveTo(x + 20, BAND - 22, x + 30, BAND); c.lineTo(x + 40, BAND); }
    c.lineTo(W, H); c.closePath();
    c.fillStyle = MAGENTA; c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.fillStyle = YELLOW; for (let x = 20; x < W; x += 40) { c.beginPath(); c.arc(x, BAND - 7, 3.2, 0, Math.PI * 2); c.fill(); }
    // a stitched line inside
    c.strokeStyle = 'rgba(247,236,210,.6)'; c.lineWidth = 2; c.setLineDash([10, 8]);
    c.beginPath(); c.moveTo(PX + 16, BAND + 18); c.lineTo(PX + PW - 16, BAND + 18); c.stroke(); c.setLineDash([]);
  }, { t: 11.0, d: 0.8, reveal: 'rise', ease: 'inOut' });
  // MÉXICO, each letter painted its own color with a dark edge and shadow
  const cols = [YELLOW, TURQ, ORANGE, '#7fd06b', CREAM, '#f7a3c4'];
  const res = p.type('title', 'MÉXICO', W / 2, 1876, { family: FACE, size: 176, color: '#000', align: 'center', track: 0.04, t: 11.4, gap: 0.2, d: 0.7 });
  res.glyphs.forEach((m, i) => {
    const ch = 'MÉXICO'[i], gx = m.box.x + res.size * 0.15, f = `normal 400 ${res.size}px ${FACE}`;
    m.draw = (c) => {
      c.font = f; c.textBaseline = 'alphabetic';
      c.fillStyle = INK; c.fillText(ch, gx + 8, 1876 + 8);
      c.fillStyle = cols[i]; c.fillText(ch, gx, 1876);
      c.strokeStyle = INK; c.lineWidth = 4; c.lineJoin = 'round'; c.strokeText(ch, gx, 1876);
    };
  });
  p.type('title', 'CIUDAD DE MÉXICO · TENOCHTITLAN', W / 2, 1926, { family: FACE, size: 24, color: CREAM, align: 'center', track: 0.3, t: 12.7, gap: 0.03, d: 0.5, reveal: 'fade' });
  // marigolds either side of the name
  for (const [x, y] of [[150, 1820], [1450, 1820]]) {
    p.group('title', { x: x - 70, y: y - 70, w: 140, h: 140 }, (c) => {
      for (const [dx, dy, rr] of [[-30, 20, 26], [30, 22, 24], [0, -10, 34]]) {
        const fx = x + dx, fy = y + dy;
        c.fillStyle = DGREEN; c.beginPath(); c.ellipse(fx - rr, fy + rr * 0.5, rr * 0.7, rr * 0.3, -0.5, 0, Math.PI * 2); c.fill();
        for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; circle(c, fx + Math.cos(a) * rr * 0.62, fy + Math.sin(a) * rr * 0.62, rr * 0.38, k % 2 ? ORANGE : '#f59a2a', 1.4); }
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.2; circle(c, fx + Math.cos(a) * rr * 0.3, fy + Math.sin(a) * rr * 0.3, rr * 0.3, YELLOW, 1.2); }
        circle(c, fx, fy, rr * 0.18, '#e07a16', 1.2);
      }
    }, { t: 12.9 + (x > 800 ? 0.2 : 0), d: 0.6, reveal: 'pop', ease: 'back' });
  }
}
