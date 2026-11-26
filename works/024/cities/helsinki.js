// Helsinki: a length of Finnish printed cotton. Four inks, screen by screen, a
// little out of register: navy, poppy red, sea teal and mustard on unbleached
// cloth. A low red sun, cut across by navy bands, sits off to the left of the
// white Cathedral on its stairs, with cut-paper cloud ribbons; below them the
// waterfront, the market square's tents and the South Harbor in big rows of
// scalloped waves with a ferry crossing; the Uspenski Cathedral's red brick and
// gold domes on their rock; sprigs of birch leaves and lingonberries in the
// corners. The weave shows through everything. Under the print, the name.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, shade, mix, rng } from '../kit.js';

const CLOTH = '#f3ede0', NAVY = '#1f2a5c', RED = '#e2442f', TEAL = '#2b978c', MUST = '#e8b13a';
const WHITE = '#f8f4ea';
// where two inks cross, the darker overprint
const RED_NAVY = '#3a1f3e', TEAL_NAVY = '#173d4f', RED_TEAL = '#6a3a2a';
// each screen sits a little off the others
const OFF = { navy: [0, 0], red: [4, 3], teal: [-3, 4], must: [3, -3] };
const FACE = 'Fredoka, sans-serif';

export const city = {
  id: 'helsinki', name: 'Helsinki', wall: '#17204a',
  alt: 'A Finnish printed-textile poster in four inks on cloth: a low red sun cut by navy bands to the left of the white Cathedral with its green domes on its broad stairs, cut-paper cloud ribbons, the waterfront houses, the striped tents of the market square, the South Harbor as rows of scalloped waves with a white ferry, the Uspenski Cathedral\'s red brick and gold onion domes on their rock, gulls, and big sprigs of birch leaves and lingonberries in the corners, the name in round letters beneath',
  google: 'family=Fredoka:wght@500;700',
  fonts: [['700 100px Fredoka', 'HELSINKI'], ['500 100px Fredoka', 'HELSINGFORS · TUOMIOKIRKKO · KAUPPATORI · ETELÄSATAMA 4 VÄRIÄ']],
  build,
};

const FY0 = 70, FY1 = 1700;   // the printed field, full width
const CX = 800;
const STEP0 = 1000, STEP1 = 1110, TOWN = 1250, QUAY = 1300, SEA1 = 1590;

function build() {
  const p = new Plate({ paper: CLOTH, seed: 1952 });
  const r = p.r;
  p.clip = { x: 0, y: FY0, w: W, h: FY1 - FY0 };
  p.stack('ground', 'sun', 'cath', 'cathx', 'rock', 'town', 'sea', 'seax', 'sprig', 'weave', 'live', 'title');
  p.layer('title', { clip: false });

  ground(p, r);
  sun(p, r);
  cathedral(p, r);
  uspenski(p, r);
  town(p, r);
  sea(p, r);
  sprigs(p, r);
  weave(p, r);
  life(p, r);
  title(p, r);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

const off = (c, ink) => c.translate(OFF[ink][0], OFF[ink][1]);
function fillPts(c, pts, col) { c.fillStyle = col; poly(c, pts); c.fill(); }
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

// a birch leaf: broad at the base, pointed, with a toothed edge, on its stalk
// at (x, y), pointing along a; the teeth are fixed at build time
function birchLeaf(x, y, L, a, wd) {
  const side = (sg) => {
    const out = [];
    for (let i = 0; i <= 22; i++) {
      const u = i / 22, w = wd * Math.sin(Math.PI * Math.pow(u, 0.62)) * (1 - u * 0.15);
      out.push([u * L, sg * (w + (i % 2 && i < 21 ? wd * 0.08 : 0))]);
    }
    return out;
  };
  const loc = [...side(-1), ...side(1).reverse()];
  const ca = Math.cos(a), sa = Math.sin(a), T = ([u, v]) => [x + u * ca - v * sa, y + u * sa + v * ca];
  const ribs = [[T([0, 0]), T([L * 0.96, 0])]];
  for (let k = 1; k < 8; k++) {
    const u = k / 9, w = wd * Math.sin(Math.PI * Math.pow(u + 0.08, 0.62)) * 0.8;
    for (const sg of [-1, 1]) ribs.push([T([u * L, 0]), T([u * L + w * 0.7, sg * w])]);
  }
  return { pts: loc.map(T), ribs, stalk: [T([-L * 0.18, 0]), T([0, 0])] };
}

// ================================================================ the ground
function ground(p, r) {
  // the navy screen over the top of the cloth
  p.group('ground', { x: 0, y: FY0, w: W, h: QUAY - FY0 + 10 }, (c) => {
    c.fillStyle = NAVY; c.fillRect(0, FY0, W, QUAY - FY0);
  }, { t: 0.1, d: 1.2, reveal: 'fall', ease: 'inOut' });
  // a small repeat in the navy: rows of tiny cloth-colored dots and dashes
  const marks = [];
  for (let y = FY0 + 24, row = 0; y < STEP0; y += 34, row++) {
    for (let x = (row % 2) * 34 + 14; x < W; x += 68) marks.push([x, y]);
  }
  p.group('ground', { x: 0, y: FY0, w: W, h: STEP0 - FY0 }, (c) => {
    c.fillStyle = 'rgba(243,237,224,.22)'; c.beginPath();
    for (const [x, y] of marks) { c.moveTo(x + 3, y); c.arc(x, y, 3, 0, Math.PI * 2); }
    c.fill();
    c.strokeStyle = 'rgba(243,237,224,.12)'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath();
    for (const [x, y] of marks) { c.moveTo(x + 22, y + 17); c.lineTo(x + 46, y + 17); }
    c.stroke();
  }, { t: 1.0, d: 1.2, reveal: 'fall', ease: 'inOut' });
}

// ================================================================ the low sun
const SUN = { x: 320, y: 690, r: 240 };
function sun(p, r) {
  // a red disc low on the left, well clear of the Cathedral's dome
  p.group('sun', { x: SUN.x - SUN.r - 10, y: SUN.y - SUN.r - 10, w: SUN.r * 2 + 20, h: SUN.r * 2 + 20 }, (c) => {
    off(c, 'red'); c.fillStyle = RED; c.beginPath(); c.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2); c.fill();
  }, { t: 1.4, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // navy bands cut across its lower half, thicker as they go down
  p.group('sun', { x: SUN.x - SUN.r - 10, y: SUN.y - 10, w: SUN.r * 2 + 20, h: SUN.r + 20 }, (c) => {
    c.fillStyle = NAVY;
    for (let k = 0, y = SUN.y + 18; k < 6; k++) { const h = 8 + k * 5; c.fillRect(SUN.x - SUN.r - 6, y, SUN.r * 2 + 12, h); y += h + 22 - k * 2; }
  }, { t: 2.5, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // cut-paper cloud ribbons: long round-ended strips in mustard, teal and white
  const ribbons = [[60, 470, 520, 30, MUST], [170, 560, 340, 22, TEAL], [1010, 250, 540, 34, MUST], [1150, 330, 420, 24, TEAL], [940, 410, 260, 18, CLOTH], [1240, 560, 330, 20, MUST]];
  ribbons.forEach(([x, y, w, h, col], i) => {
    p.group('sun', { x: x - 10, y: y - 6, w: w + 20, h: h + 12 }, (c) => {
      c.save(); off(c, col === TEAL ? 'teal' : col === MUST ? 'must' : 'navy');
      c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fill();
      c.restore();
    }, { t: 2.8 + i * 0.18, d: 0.9, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ================================================================ the Cathedral
function cathedral(p, r) {
  // the stairs: a broad white trapezoid ruled with navy treads
  const steps = [[480, STEP0], [1120, STEP0], [1260, STEP1], [340, STEP1]];
  p.group('cath', boxOf(steps, 6), (c) => {
    fillPts(c, steps, WHITE);
    c.fillStyle = NAVY;
    for (let y = STEP0 + 6, i = 0; y < STEP1; y += 7 + i * 0.35, i++) {
      const k = (y - STEP0) / (STEP1 - STEP0);
      c.fillRect(lerp(480, 340, k), y, lerp(640, 920, k), 2.2);
    }
  }, { t: 3.6, d: 1.1, reveal: 'rise', ease: 'inOut' });

  // the body with its long rank of windows, the portico, the pediment
  p.group('cath', { x: 500, y: 640, w: 600, h: STEP0 - 636 }, (c) => {
    fillPts(c, rect(520, 700, 560, STEP0 - 700), WHITE);
    // the end pavilions, a step higher, with low pediments
    for (const x of [520, 980]) { fillPts(c, rect(x, 680, 100, 20), WHITE); fillPts(c, [[x - 4, 682], [x + 50, 650], [x + 104, 682]], WHITE); }
    c.fillStyle = NAVY;
    for (const x of [540, 580, 1000, 1040]) { c.beginPath(); c.roundRect(x, 760, 22, 70, [11, 11, 0, 0]); c.fill(); c.beginPath(); c.roundRect(x, 870, 22, 60, [11, 11, 0, 0]); c.fill(); }
    c.fillRect(520, 720, 560, 4); c.fillRect(520, STEP0 - 24, 560, 3);
  }, { t: 4.1, d: 1.1, reveal: 'rise', ease: 'inOut' });
  p.group('cath', { x: 640, y: 690, w: 320, h: STEP0 - 686 }, (c) => {
    // the pediment and the six columns, navy between them
    fillPts(c, [[650, 790], [CX, 700], [950, 790]], WHITE);
    c.strokeStyle = NAVY; c.lineWidth = 3; c.beginPath(); c.moveTo(672, 780); c.lineTo(CX, 712); c.lineTo(928, 780); c.closePath(); c.stroke();
    c.fillStyle = NAVY; c.fillRect(654, 790, 292, 6);
    fillPts(c, rect(660, 796, 280, STEP0 - 796), NAVY);
    c.fillStyle = WHITE;
    for (let i = 0; i < 6; i++) c.fillRect(668 + i * 50, 800, 26, STEP0 - 800);
    c.fillStyle = NAVY;
    for (let i = 0; i < 6; i++) { c.fillRect(672 + i * 50, 806, 3, STEP0 - 816); c.fillRect(686 + i * 50, 806, 3, STEP0 - 816); }
  }, { t: 4.6, d: 1.0, reveal: 'rise', ease: 'inOut' });

  // drums and domes: four small ones at the corners, then the great one
  const drum = (c, x, y0, y1, hw, cols) => {
    fillPts(c, rect(x - hw, y0, hw * 2, y1 - y0), WHITE);
    c.fillStyle = NAVY;
    for (let i = 0; i < cols; i++) c.fillRect(x - hw + (i + 0.62) * (hw * 2 / cols), y0 + 14, hw * 2 / cols * 0.34, y1 - y0 - 24);
    c.fillRect(x - hw, y0 + 6, hw * 2, 3);
  };
  const dome = (c, x, y, hw, h) => {
    c.save(); off(c, 'teal');
    c.fillStyle = TEAL; c.beginPath(); c.moveTo(x - hw, y); c.bezierCurveTo(x - hw, y - h * 0.8, x - hw * 0.45, y - h, x, y - h); c.bezierCurveTo(x + hw * 0.45, y - h, x + hw, y - h * 0.8, x + hw, y); c.fill();
    // ribs, as cloth-colored lines
    c.strokeStyle = 'rgba(243,237,224,.55)'; c.lineWidth = 2;
    for (const k of [-0.6, -0.2, 0.2, 0.6]) { c.beginPath(); c.moveTo(x + hw * k, y); c.quadraticCurveTo(x + hw * k * 0.8, y - h * 0.7, x, y - h); c.stroke(); }
    c.restore();
  };
  [[580, 0], [1020, 1]].forEach(([x, i]) => {
    p.group('cathx', { x: x - 60, y: 520, w: 120, h: 182 }, (c) => {
      drum(c, x, 610, 700, 44, 6);
      dome(c, x, 612, 50, 66);
      fillPts(c, rect(x - 8, 530, 16, 20), WHITE);
      c.fillStyle = WHITE; c.beginPath(); c.arc(x, 530, 8, Math.PI, 0); c.fill();
    }, { t: 5.2 + i * 0.25, d: 1.0, reveal: 'rise', ease: 'inOut' });
  });
  p.group('cathx', { x: 650, y: 240, w: 300, h: 464 }, (c) => {
    drum(c, CX, 520, 702, 112, 10);
    fillPts(c, rect(CX - 120, 512, 240, 12), WHITE);
    dome(c, CX, 516, 124, 180);
  }, { t: 5.6, d: 1.4, reveal: 'rise', ease: 'inOut' });
  p.group('cathx', { x: CX - 30, y: 236, w: 60, h: 110 }, (c) => {
    fillPts(c, rect(CX - 18, 298, 36, 42), WHITE);
    c.fillStyle = NAVY; c.fillRect(CX - 10, 306, 5, 26); c.fillRect(CX + 5, 306, 5, 26);
    c.save(); off(c, 'teal'); c.fillStyle = TEAL; c.beginPath(); c.arc(CX, 298, 20, Math.PI, 0); c.fill(); c.restore();
    c.fillStyle = MUST; c.fillRect(CX - 2, 250, 4, 30); c.beginPath(); c.arc(CX, 252, 6, 0, Math.PI * 2); c.fill();
  }, { t: 6.7, d: 0.8, reveal: 'rise' });
}

// ================================================================ Uspenski
function uspenski(p, r) {
  // the rock it stands on, then the brick church and its gold onion domes
  const rock = [[1180, QUAY], [1220, 1180], [1290, 1150], [1420, 1130], [1530, 1150], [W, 1170], [W, QUAY]];
  p.fill('rock', rock, TEAL_NAVY, { t: 4.8, d: 1.0, reveal: 'rise' });
  const bx = 1300, bw = 230, by = 1000;
  p.group('rock', { x: bx - 20, y: 760, w: bw + 40, h: 400 }, (c) => {
    c.save(); off(c, 'red');
    fillPts(c, rect(bx, by, bw, 150), RED);
    fillPts(c, rect(bx + 70, 900, 90, 110), RED);
    for (const [x, w] of [[bx + 10, 40], [bx + bw - 50, 40]]) fillPts(c, rect(x, 950, w, 60), RED);
    c.restore();
    // brick courses and arched windows, in cloth
    c.fillStyle = 'rgba(243,237,224,.7)';
    for (let x = bx + 16; x < bx + bw - 10; x += 26) { c.beginPath(); c.roundRect(x, by + 30, 10, 34, [5, 5, 0, 0]); c.fill(); }
    for (let x = bx + 86; x < bx + 150; x += 22) { c.beginPath(); c.roundRect(x, 930, 9, 30, [4.5, 4.5, 0, 0]); c.fill(); }
    c.fillStyle = RED_NAVY;
    for (let y = by + 80; y < by + 150; y += 10) c.fillRect(bx, y, bw, 2);
    // the onion domes
    const onion = (x, y, s) => {
      c.save(); off(c, 'must'); c.fillStyle = MUST; c.beginPath();
      c.moveTo(x - 13 * s, y); c.bezierCurveTo(x - 22 * s, y - 16 * s, x - 14 * s, y - 28 * s, x, y - 44 * s);
      c.bezierCurveTo(x + 14 * s, y - 28 * s, x + 22 * s, y - 16 * s, x + 13 * s, y); c.fill(); c.restore();
      c.fillStyle = MUST; c.fillRect(x - 1.2, y - 58 * s, 2.4, 16 * s);
    };
    c.fillStyle = RED; c.fillRect(bx + 103, 860, 24, 40);
    onion(bx + 115, 862, 1.35);
    onion(bx + 30, 952, 0.9); onion(bx + bw - 30, 952, 0.9);
    onion(bx + 80, 902, 0.8); onion(bx + 150, 902, 0.8);
  }, { t: 6.0, d: 1.3, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the waterfront and the market
function town(p, r) {
  // a band of white waterfront houses with navy windows and red roofs
  const houses = [];
  for (let x = -10; x < 1220;) {
    const w = r.range(70, 130), h = r.range(70, 120);
    houses.push({ x, w, h, roof: r.pick([RED, TEAL, NAVY]), cols: Math.round(w / 18), rows: Math.max(2, Math.round(h / 26)) });
    x += w + 4;
  }
  houses.forEach((h, i) => {
    const y = TOWN - h.h;
    p.group('town', { x: h.x - 4, y: y - 26, w: h.w + 12, h: h.h + 30 }, (c) => {
      fillPts(c, rect(h.x, y, h.w, h.h), WHITE);
      c.save(); off(c, h.roof === RED ? 'red' : h.roof === TEAL ? 'teal' : 'navy');
      fillPts(c, [[h.x - 2, y + 2], [h.x + h.w + 2, y + 2], [h.x + h.w - 12, y - 18], [h.x + 12, y - 18]], h.roof);
      c.restore();
      c.fillStyle = NAVY; c.beginPath();
      const dx = h.w / h.cols;
      for (let k = 0; k < h.cols; k++) for (let j = 0; j < h.rows; j++) c.rect(h.x + k * dx + dx * 0.3, y + 12 + j * 24, dx * 0.4, 12);
      c.fill();
    }, { t: 6.6 + i * 0.08, d: 0.8, reveal: 'rise' });
  });
  // the market square: a cloth-colored ground, a row of tents, people
  p.group('town', { x: 0, y: TOWN - 2, w: 1240, h: QUAY - TOWN + 4 }, (c) => {
    c.fillStyle = CLOTH; c.fillRect(0, TOWN, 1240, QUAY - TOWN);
    c.fillStyle = 'rgba(31,42,92,.25)';
    for (let x = 0; x < 1240; x += 18) for (let y = TOWN + 8; y < QUAY; y += 14) c.fillRect(x + ((y / 14) % 2) * 9, y, 3, 3);
  }, { t: 7.2, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  const tents = [];
  for (let x = 30; x < 1180; x += r.range(64, 84)) tents.push({ x, w: r.range(48, 62), col: r.pick([RED, MUST, TEAL, RED, NAVY]), stripe: r.chance(0.5) });
  tents.forEach((t, i) => {
    p.group('town', { x: t.x - 6, y: TOWN - 4, w: t.w + 12, h: 56 }, (c) => {
      const y = TOWN + 10;
      fillPts(c, rect(t.x + 4, y + 16, t.w - 8, 24), WHITE);
      c.fillStyle = NAVY; c.fillRect(t.x + 4, y + 16, 2, 24); c.fillRect(t.x + t.w - 6, y + 16, 2, 24);
      fillPts(c, [[t.x, y + 18], [t.x + t.w / 2, y], [t.x + t.w, y + 18]], t.col);
      if (t.stripe) { c.fillStyle = WHITE; for (let k = 1; k < 4; k++) poly(c, [[t.x + t.w * k / 4 - 3, y + 18], [t.x + t.w / 2, y + 1], [t.x + t.w * k / 4 + 3, y + 18]]), c.fill(); }
      c.fillStyle = t.col; c.beginPath();
      for (let k = 0; k < 6; k++) { c.moveTo(t.x + k * t.w / 6, y + 18); c.arc(t.x + (k + 0.5) * t.w / 6, y + 18, t.w / 12, 0, Math.PI); }
      c.fill();
    }, { t: 7.6 + i * 0.05, d: 0.6, reveal: 'drop', dy: 18 });
  });
  const folk = [];
  for (let i = 0; i < 70; i++) folk.push([r.range(10, 1220), r.range(TOWN + 48, QUAY - 2), r.pick([NAVY, NAVY, RED, TEAL, MUST])]);
  p.group('town', { x: 0, y: TOWN + 30, w: 1240, h: 40 }, (c) => {
    for (const [x, y, col] of folk) { c.fillStyle = col; c.beginPath(); c.roundRect(x - 2.5, y - 14, 5, 14, 2.5); c.fill(); c.fillStyle = NAVY; c.beginPath(); c.arc(x, y - 17, 2.6, 0, Math.PI * 2); c.fill(); }
  }, { t: 8.6, d: 0.8, reveal: 'fade' });
}

// ================================================================ the harbor
function sea(p, r) {
  // rows of big scallops, far to near, teal and navy by turns, each with a
  // cloth-colored crest and a row of dots
  const rows = [];
  for (let y = QUAY + 46, i = 0; y < SEA1 + 40; i++) {
    const w = 150 + i * 26;
    rows.push({ y, w, col: i % 2 ? NAVY : TEAL, ph: (i % 2) * 0.5, i });
    y += 40 + i * 10;
  }
  p.group('sea', { x: 0, y: QUAY, w: W, h: 60 }, (c) => { c.fillStyle = TEAL_NAVY; c.fillRect(0, QUAY, W, 60); }, { t: 5.0, d: 0.8, reveal: 'wipe' });
  rows.forEach((row) => {
    const { y, w, col, ph } = row;
    p.group('sea', { x: 0, y: y - w / 2 - 6, w: W, h: SEA1 - y + w / 2 + 30 }, (c) => {
      c.save(); c.beginPath(); c.rect(0, 0, W, SEA1 + 10); c.clip();
      c.save(); off(c, col === TEAL ? 'teal' : 'navy');
      c.fillStyle = col; c.beginPath();
      c.moveTo(0, FY1 + 40);
      for (let x = -w * (1 + ph); x < W + w; x += w) c.arc(x + w / 2, y, w / 2, Math.PI, 0);
      c.lineTo(W + w, FY1 + 40); c.closePath(); c.fill();
      c.restore();
      c.strokeStyle = col === TEAL ? 'rgba(243,237,224,.8)' : 'rgba(43,151,140,.9)'; c.lineWidth = Math.max(3, w * 0.04); c.lineCap = 'round';
      c.beginPath();
      for (let x = -w * (1 + ph); x < W + w; x += w) { c.moveTo(x + w * 0.24, y); c.arc(x + w / 2, y, w * 0.26, Math.PI, Math.PI * 1.75); }
      c.stroke();
      c.fillStyle = 'rgba(243,237,224,.55)'; c.beginPath();
      for (let x = -w * (1 + ph); x < W + w; x += w) for (const k of [0.3, 0.5, 0.7]) { const xx = x + w * k; c.moveTo(xx + 3, y + w * 0.16); c.arc(xx, y + w * 0.16, 3, 0, Math.PI * 2); }
      c.fill();
      c.restore();
    }, { t: 5.4 + row.i * 0.28, d: 0.9, reveal: 'rise', ease: 'out' });
  });
  // the sea ends in a row of cloth scallops, like a printed hem
  p.group('seax', { x: 0, y: SEA1 - 40, w: W, h: FY1 - SEA1 + 50 }, (c) => {
    c.fillStyle = CLOTH; c.beginPath(); c.moveTo(0, FY1 + 10);
    for (let x = 0; x <= W; x += 64) c.arc(x + 32, SEA1, 32, Math.PI, 0);
    c.lineTo(W, FY1 + 10); c.closePath(); c.fill();
    c.fillStyle = NAVY; c.beginPath();
    for (let x = 0; x <= W; x += 64) { c.moveTo(x + 32 + 5, SEA1 + 4); c.arc(x + 32, SEA1 + 4, 5, 0, Math.PI * 2); }
    c.fill();
  }, { t: 8.2, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // the far island ferries' pier and a lighthouse buoy, small
  p.group('seax', { x: 1160, y: QUAY - 60, w: 140, h: 100 }, (c) => {
    c.fillStyle = WHITE; c.fillRect(1180, QUAY - 4, 110, 10);
    c.fillStyle = RED; c.fillRect(1268, QUAY - 50, 12, 46); c.fillStyle = WHITE; c.fillRect(1268, QUAY - 34, 12, 8);
  }, { t: 8.0, d: 0.6, reveal: 'rise' });
}

// ================================================================ birch and lingonberry in the corners
function sprigs(p, r) {
  // two birch twigs reaching in from the lower corners, each with big toothed
  // leaves in mustard and teal, and lingonberry sprigs low among them
  const twigs = [
    { pts: [[-20, 1720], [120, 1600], [260, 1500], [400, 1430]], sg: 1, t: 8.2 },
    { pts: [[W + 20, 1720], [1490, 1610], [1360, 1520], [1240, 1460]], sg: -1, t: 8.5 },
  ];
  twigs.forEach((tw, ti) => {
    p.pen('sprig', tw.pts, NAVY, 9, { t: tw.t, d: 0.9 });
    const leaves = [];
    for (let k = 0; k < 6; k++) {
      const u = 0.18 + k * 0.15, seg = Math.min(2, Math.floor(u * 3)), f = u * 3 - seg;
      const [ax, ay] = tw.pts[seg], [bx, by] = tw.pts[seg + 1];
      const x = lerp(ax, bx, f), y = lerp(ay, by, f);
      const up = k % 2 ? -1 : 1;
      const a = tw.sg > 0 ? -Math.PI / 2 + up * 0.9 + 0.3 : -Math.PI / 2 - up * 0.9 - 0.3;
      leaves.push({ ...birchLeaf(x, y, r.range(210, 260) * (1 - k * 0.08), a, r.range(78, 96) * (1 - k * 0.08)), col: k % 3 === 1 ? WHITE : MUST });
    }
    leaves.forEach((lf, k) => {
      p.group('sprig', boxOf(lf.pts, 16), (c) => {
        c.strokeStyle = NAVY; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(...lf.stalk[0]); c.lineTo(...lf.stalk[1]); c.stroke();
        c.save(); off(c, lf.col === MUST ? 'must' : 'navy'); fillPts(c, lf.pts, lf.col); c.restore();
        c.strokeStyle = lf.col === MUST ? '#b9781c' : NAVY; c.lineWidth = 3.5; c.beginPath();
        for (const [a0, b0] of lf.ribs) { c.moveTo(a0[0], a0[1]); c.lineTo(b0[0], b0[1]); }
        c.stroke();
      }, { t: tw.t + 0.5 + k * 0.16, d: 0.7, reveal: 'pop', ease: 'back' });
    });
  });
  // lingonberry sprigs: small glossy leaves in pairs up a stem, and a cluster
  // of red berries at the top, each with a cloth highlight and a navy eye
  const sprig = (x, y, h, lean, n) => {
    const stem = [], lv = [], berries = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; stem.push([x + lean * t * t, y - t * h]); }
    for (let i = 1; i < 7; i++) {
      const [sx, sy] = stem[i];
      for (const sg of [-1, 1]) lv.push([sx + sg * 20, sy - 6, 22, 11, sg * 0.5]);
    }
    const [tx, ty] = stem[8];
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.62; berries.push([tx + Math.cos(a) * 34 + r.range(-3, 3), ty + 14 + Math.abs(i - (n - 1) / 2) * 13, r.range(16, 21)]); }
    return { stem, lv, berries, box: boxOf([...stem, ...berries.map(([bx, by]) => [bx, by])], 40) };
  };
  const ls = [sprig(540, 1700, 150, 24, 5), sprig(650, 1700, 110, -18, 4), sprig(1120, 1700, 140, -26, 5), sprig(1010, 1700, 100, 16, 3)];
  ls.forEach((s0, i) => {
    p.group('sprig', s0.box, (c) => {
      c.strokeStyle = NAVY; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(...s0.stem[0]);
      for (const q of s0.stem) c.lineTo(q[0], q[1]);
      c.stroke();
      c.fillStyle = NAVY;
      for (const [lx, ly, a, b, rot] of s0.lv) { c.beginPath(); c.ellipse(lx, ly, a, b, rot, 0, Math.PI * 2); c.fill(); }
      c.save(); off(c, 'red'); c.fillStyle = RED;
      for (const [bx, by, br] of s0.berries) { c.beginPath(); c.arc(bx, by, br, 0, Math.PI * 2); c.fill(); }
      c.restore();
      for (const [bx, by, br] of s0.berries) {
        c.fillStyle = CLOTH; c.beginPath(); c.arc(bx - br * 0.35, by - br * 0.35, br * 0.22, 0, Math.PI * 2); c.fill();
        c.fillStyle = RED_NAVY; c.beginPath(); c.arc(bx + br * 0.2, by + br * 0.55, br * 0.16, 0, Math.PI * 2); c.fill();
      }
    }, { t: 9.4 + i * 0.22, d: 0.8, reveal: 'rise' });
  });
}

// ================================================================ the cloth
function weave(p, r) {
  // the weave: fine warp and weft over the whole print
  const lines = [];
  for (let x = 2; x < W; x += 6) lines.push([[x, FY0], [x, FY1]]);
  const weft = [];
  for (let y = FY0 + 2; y < FY1; y += 6) weft.push([[0, y], [W, y]]);
  p.strokes('weave', lines, 'rgba(255,250,235,.07)', 1.4, { t: 1.3, d: 0.3, reveal: 'fade', box: { x: 0, y: FY0, w: W, h: FY1 - FY0 } });
  p.strokes('weave', weft, 'rgba(30,20,30,.05)', 1.2, { t: 1.35, d: 0.3, reveal: 'fade', box: { x: 0, y: FY0, w: W, h: FY1 - FY0 } });
}

// ================================================================ things that move
function life(p, r) {
  // the white ferry, crossing slowly to the left
  p.live('live', {
    t: 9.4, d: 1.0, box: { x: 0, y: 1260, w: W, h: 160 },
    draw: (c, time) => {
      const x = 1000 - (time - 9.4) * 10, y = 1398;
      c.fillStyle = WHITE; poly(c, [[x - 150, y - 26], [x + 140, y - 26], [x + 170, y - 50], [x + 160, y], [x - 140, y]]); c.fill();
      fillPts(c, rect(x - 110, y - 56, 220, 30), WHITE);
      fillPts(c, rect(x - 70, y - 78, 140, 22), WHITE);
      c.fillStyle = NAVY; c.fillRect(x - 150, y - 6, 300, 6);
      c.beginPath();
      for (let i = 0; i < 16; i++) c.rect(x - 130 + i * 16, y - 20, 9, 7);
      for (let i = 0; i < 12; i++) c.rect(x - 100 + i * 17, y - 48, 9, 9);
      c.fill();
      c.fillStyle = RED; c.fillRect(x - 20, y - 108, 32, 30);
      c.fillStyle = NAVY; c.fillRect(x - 20, y - 108, 32, 8);
    },
  });
  // gulls, cloth-white on the navy
  const gulls = [];
  for (let i = 0; i < 5; i++) gulls.push([r.range(150, 1450), r.range(150, 420), r.range(1, 1.6), r() * 6]);
  p.live('live', {
    t: 9.6, d: 1.0, box: { x: 0, y: 80, w: W, h: 420 },
    draw: (c, time) => {
      c.fillStyle = WHITE;
      for (const [x0, y0, s, ph] of gulls) {
        const x = x0 + Math.sin(time * 0.3 + ph) * 50, y = y0 + Math.cos(time * 0.4 + ph) * 16, f = Math.sin(time * 4 + ph) * 8;
        c.beginPath(); c.moveTo(x - 24 * s, y - f * s); c.quadraticCurveTo(x - 10 * s, y - 12 * s, x, y); c.quadraticCurveTo(x + 10 * s, y - 12 * s, x + 24 * s, y - f * s);
        c.quadraticCurveTo(x + 10 * s, y - 6 * s, x, y + 5 * s); c.quadraticCurveTo(x - 10 * s, y - 6 * s, x - 24 * s, y - f * s); c.fill();
      }
    },
  });
  // flags on the tents, fluttering
  p.live('live', {
    t: 9.0, d: 0.8, box: { x: 0, y: TOWN - 30, w: 1240, h: 40 },
    draw: (c, time) => {
      c.fillStyle = MUST;
      for (let x = 60; x < 1180; x += 220) {
        c.fillRect(x, TOWN - 22, 2, 30);
        const f = Math.sin(time * 5 + x) * 3;
        poly(c, [[x + 2, TOWN - 22], [x + 22, TOWN - 18 + f], [x + 2, TOWN - 12]]); c.fill();
      }
    },
  });
}

// ================================================================ the name, on the plain cloth
function title(p, r) {
  // a selvedge along the top edge: registration dots in each ink
  [NAVY, RED, TEAL, MUST].forEach((col, i) => {
    p.group('title', { x: 60 + i * 34 - 2, y: 22, w: 30, h: 30 }, (c) => { c.fillStyle = col; c.beginPath(); c.arc(73 + i * 34, 36, 11, 0, Math.PI * 2); c.fill(); }, { t: 0.2 + i * 0.12, d: 0.4, reveal: 'pop' });
  });
  p.type('title', 'HELSINGFORS · 4 VÄRIÄ', W - 60, 46, { family: FACE, weight: 500, size: 24, track: 0.2, color: NAVY, align: 'right', t: 0.6, gap: 0.02, d: 0.3, reveal: 'fade' });
  p.type('title', 'HELSINKI', CX, 1905, {
    family: FACE, weight: 700, size: 270, track: 0.02, fit: 1420, align: 'center', color: NAVY, shadow: RED, sx: 7, sy: 6,
    t: 10.6, gap: 0.17, d: 0.7, reveal: 'drop', ease: 'back',
  });
  p.type('title', 'TUOMIOKIRKKO · KAUPPATORI · ETELÄSATAMA', CX, 1962, { family: FACE, weight: 500, size: 28, track: 0.2, color: NAVY, align: 'center', t: 12.4, gap: 0.025, d: 0.4, reveal: 'fade' });
}
