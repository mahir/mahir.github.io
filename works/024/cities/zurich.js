// Zürich: a Swiss International Style poster. Everything sits on a strict grid of
// twelve columns and is made of rectangles, in black, grays, white and one red.
// A tall red field stands behind the Grossmünster's twin towers, printed white;
// the Alps along the horizon are a row of gray bars, overprinted dark where they
// cross the red, with white snow on the tallest; the old town below is a band of
// gray blocks pricked with windows, with the Fraumünster's stepped spire and
// St. Peter's tower and its great clock. Under the quay the lake is solid black,
// ruled in white, gray and red where the towers and the field are reflected,
// with swans, sailboats and a paddle steamer. The name is set flush left in
// Archivo Black, its umlaut two red squares, over three columns of small facts.

import { Plate, W } from '../print.js';

const PAPER = '#efeee9', INK = '#121314', RED = '#e2231a', RED_D = '#9e1812';
const G1 = '#dcdbd6', G2 = '#bdbcb7', G3 = '#94948f', G4 = '#62635f', G5 = '#36373a';
const FB = '"Archivo Black", sans-serif', FA = 'Archivo, sans-serif';

const FACTS = [
  ['Grossmünster', '1100–1220', 'Zwei Türme, 62 m'],
  ['St. Peter', 'Zifferblatt 8,7 m', 'Fraumünster 853'],
  ['Zürichsee', '406 m ü. M.', 'Limmat, Glarner Alpen'],
];
const SMALL = 'Zürich Zurich Stadt am See 47°22′N 8°32′E Grossmünster Fraumünster St. Peter Zürichsee Limmat Glarner Alpen Schweiz ' +
  FACTS.flat().join(' ') + ' 0123456789·—–,.';

export const city = {
  id: 'zurich', name: 'Zürich', wall: '#1c1d20',
  alt: 'A Swiss International Style poster built of rectangles in black, gray and one red: the Grossmünster’s twin towers in white against a tall red field, the Alps as a row of gray bars with snow on the peaks, the old town’s blocks with the Fraumünster’s spire and St. Peter’s tower with its great clock, and the black lake below ruled with white and red reflections, with swans, sailboats and a paddle steamer, over the name Zürich with its umlaut in two red squares',
  google: 'family=Archivo+Black&family=Archivo:wght@500;700',
  fonts: [['400 100px "Archivo Black"', 'Zurich Zürich'], ['500 100px Archivo', SMALL], ['700 100px Archivo', SMALL]],
  build,
};

// the grid: twelve columns of 120 between the margins
const ML = 80, MR = W - 80, COL = 120;
const QUAY = 1000;               // the line where the town meets the lake
const FX = ML + 6 * COL, FY = 210; // the red field: the right half, down to the quay
const T1 = 1110, T2 = 1250, TW = 92; // the Grossmünster's two towers (centers) and width
const PX = 380, PY = 712;        // St. Peter's clock
const FRX = 640;                 // the Fraumünster's spire
const LAKE_CALM = 1410;          // below this the lake is left plain for the type

function build() {
  const p = new Plate({ paper: PAPER, seed: 1218 });
  const r = p.r;
  p.stack('field', 'alps', 'back', 'towers', 'town', 'lake', 'water', 'boats', 'facts', 'live', 'title');

  header(p);
  field(p);
  alps(p, r);
  grossmunster(p);
  fraumunster(p);
  stPeter(p);
  town(p, r);
  lake(p, r);
  boats(p, r);
  facts(p);
  life(p);
  title(p);
  return p;
}

const rect = (c, x, y, w, h) => c.rect(x, y, w, h);

// ================================================================ the head of the sheet
function header(p) {
  p.group('field', { x: ML - 2, y: 150, w: MR - ML + 4, h: 10 }, (c) => {
    c.fillStyle = INK; c.fillRect(ML, 152, MR - ML, 4);
  }, { t: 0.2, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  const o = { family: FA, weight: 700, size: 21, color: INK, track: 0.02, gap: 0.014, d: 0.35, reveal: 'fade' };
  p.type('field', 'Zürich', ML, 128, { ...o, t: 0.6 });
  p.type('field', 'Stadt am See', ML + 2 * COL, 128, { ...o, weight: 500, t: 0.7 });
  p.type('field', '47°22′N  8°32′E', ML + 6 * COL, 128, { ...o, weight: 500, t: 0.8 });
  p.type('field', 'Schweiz', MR, 128, { ...o, weight: 500, align: 'right', t: 0.95 });
  // a small red square at the corner of the grid, the one red announced
  p.group('field', { x: ML + 4 * COL - 4, y: 98, w: 40, h: 40 }, (c) => {
    c.fillStyle = RED; c.fillRect(ML + 4 * COL, 104, 30, 30);
  }, { t: 1.0, d: 0.5, reveal: 'pop' });
}

// ================================================================ the red field
function field(p) {
  p.group('field', { x: FX, y: FY, w: MR - FX, h: QUAY - FY + 4 }, (c) => {
    c.fillStyle = RED; c.fillRect(FX, FY, MR - FX, QUAY - FY);
  }, { t: 0.7, d: 1.4, reveal: 'rise', ease: 'inOut' });
  // a black bar along its top edge, a column wide, set flush with the grid
  p.group('field', { x: FX, y: FY - 4, w: COL * 2 + 4, h: 26 }, (c) => {
    c.fillStyle = INK; c.fillRect(FX, FY, COL * 2, 16);
  }, { t: 1.9, d: 0.6, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ the Alps: a row of bars
function alps(p, r) {
  // a skyline of peaks, highest a little left of the field's edge
  const peaks = [[0.02, 150], [0.12, 260], [0.19, 200], [0.29, 330], [0.37, 250], [0.48, 400], [0.56, 320], [0.65, 380], [0.75, 260], [0.85, 340], [0.94, 220], [1.02, 170]];
  const height = (u) => {
    let h = 30;
    for (const [pu, ph] of peaks) h = Math.max(h, ph - Math.abs(u - pu) * 1700 * (0.8 + (ph % 7) / 20));
    return h;
  };
  const BW = 16, GAP = 4, base = QUAY - 70;
  const bars = [];
  for (let x = ML; x + BW <= MR + 1; x += BW + GAP) {
    const u = (x - ML) / (MR - ML);
    const h = Math.round((height(u) + r.range(-8, 8)) / 4) * 4;
    bars.push({ x, h });
  }
  const SNOW = base - 330; // above this line the bars are white
  // in groups of six, rising left to right
  for (let i = 0; i < bars.length; i += 6) {
    const set = bars.slice(i, i + 6);
    const x0 = set[0].x, x1 = set[set.length - 1].x + BW;
    const top = base - Math.max(...set.map((b) => b.h));
    p.group('alps', { x: x0 - 2, y: top - 4, w: x1 - x0 + 4, h: base - top + 8 }, (c) => {
      c.save();
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = G2; c.beginPath();
      for (const b of set) rect(c, b.x, base - b.h, BW, b.h);
      c.fill();
      c.restore();
      // snow: the tops above the line, white with a black hairline
      c.fillStyle = '#fbfaf6'; c.strokeStyle = INK; c.lineWidth = 1;
      for (const b of set) {
        const y = base - b.h;
        if (y < SNOW) { c.fillRect(b.x, y, BW, SNOW - y); c.strokeRect(b.x + 0.5, y + 0.5, BW - 1, SNOW - y - 1); }
      }
    }, { t: 1.6 + i * 0.022, d: 0.7, reveal: 'rise', ease: 'out' });
  }
  // the foot of the range: a mid-gray band under the bars, hills of the near shore
  p.group('alps', { x: ML - 2, y: base - 4, w: MR - ML + 4, h: QUAY - base + 8 }, (c) => {
    c.save(); c.globalCompositeOperation = 'multiply';
    c.fillStyle = G3; c.fillRect(ML, base, MR - ML, QUAY - base);
    c.restore();
  }, { t: 2.9, d: 0.9, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ the Grossmünster
function grossmunster(p) {
  const nave = { x: T1 - 120, y: 800, w: T2 - T1 + 240 };
  // the nave between and beside the towers
  p.group('back', { x: nave.x - 4, y: nave.y - 4, w: nave.w + 8, h: QUAY - nave.y + 8 }, (c) => {
    c.fillStyle = G1; c.fillRect(nave.x, nave.y, nave.w, QUAY - nave.y);
    c.fillStyle = G2; c.fillRect(nave.x, nave.y, nave.w, 14);
    // tall round-headed windows as slots
    c.fillStyle = INK; c.beginPath();
    for (let x = nave.x + 22; x < nave.x + nave.w - 20; x += 34) rect(c, x, nave.y + 46, 10, 44);
    c.fill();
  }, { t: 4.4, d: 0.9, reveal: 'rise' });
  for (const [k, cx] of [[0, T1], [1, T2]]) {
    const x = cx - TW / 2, t0 = 4.8 + k * 0.35;
    // the square shaft
    p.group('towers', { x: x - 4, y: 548, w: TW + 8, h: QUAY - 548 + 4 }, (c) => {
      c.fillStyle = '#fbfaf6'; c.fillRect(x, 560, TW, QUAY - 560);
      c.fillStyle = G1; c.fillRect(x + TW * 0.68, 560, TW * 0.32, QUAY - 560); // the shade side
      c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x + 1, 561, TW - 2, QUAY - 561);
      // string courses dividing the stories
      c.fillStyle = INK;
      for (const y of [640, 724, 808, 880]) c.fillRect(x, y, TW, 4);
      // windows: paired slots in each story, the belfry openings tall
      c.beginPath();
      rect(c, x + 18, 586, 16, 42); rect(c, x + TW - 34, 586, 16, 42);
      rect(c, x + 24, 664, 10, 40); rect(c, x + TW - 34, 664, 10, 40);
      rect(c, x + 40, 750, 12, 34);
      rect(c, x + 40, 830, 12, 30);
      c.fill();
    }, { t: t0, d: 1.4, reveal: 'rise', ease: 'inOut' });
    // the clock on the front, a square dial
    p.group('towers', { x: cx - 22, y: 706, w: 44, h: 44 }, (c) => {
      c.fillStyle = INK; c.fillRect(cx - 18, 710, 36, 36);
      c.fillStyle = '#fbfaf6'; c.fillRect(cx - 14, 714, 28, 28);
      c.fillStyle = INK; c.fillRect(cx - 1.5, 717, 3, 12); c.fillRect(cx - 1.5, 727, 10, 3);
    }, { t: t0 + 1.9, d: 0.4, reveal: 'pop' });
    // the octagonal belfry above, narrower, and its domed cap in stacked blocks
    p.group('towers', { x: x - 4, y: 400, w: TW + 8, h: 170 }, (c) => {
      const bx = cx - 34;
      c.fillStyle = '#fbfaf6'; c.fillRect(bx, 494, 68, 66);
      c.fillStyle = G1; c.fillRect(bx + 46, 494, 22, 66);
      c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(bx + 1, 495, 66, 65);
      c.fillStyle = INK; c.fillRect(bx + 12, 508, 9, 34); c.fillRect(bx + 29, 508, 9, 34); c.fillRect(bx + 46, 508, 9, 34);
      c.fillRect(bx - 6, 488, 80, 7);
      // the cap: blocks narrowing to a small lantern and finial
      const caps = [[62, 18], [50, 16], [36, 14], [22, 12], [10, 18], [3, 22]];
      let y = 488;
      for (const [w, h] of caps) { y -= h; c.fillStyle = INK; c.fillRect(cx - w / 2, y, w, h); }
    }, { t: t0 + 1.3, d: 0.9, reveal: 'rise', ease: 'out' });
  }
}

// ================================================================ the Fraumünster
function fraumunster(p) {
  const x = FRX - 28;
  p.group('back', { x: x - 4, y: 690, w: 64, h: QUAY - 690 + 4 }, (c) => {
    c.fillStyle = G4; c.fillRect(x, 700, 56, QUAY - 700);
    c.fillStyle = G5; c.fillRect(x + 38, 700, 18, QUAY - 700);
    c.fillStyle = PAPER; c.beginPath();
    rect(c, x + 22, 724, 10, 34); rect(c, x + 22, 790, 10, 26);
    c.fill();
    // its clock, white square on the dark tower
    c.fillRect(x + 12, 828, 32, 32);
    c.fillStyle = INK; c.fillRect(x + 27, 832, 3, 14); c.fillRect(x + 27, 843, 11, 3);
  }, { t: 4.2, d: 1.1, reveal: 'rise', ease: 'inOut' });
  // the slim spire, a stepped stack of blocks
  p.group('back', { x: FRX - 34, y: 440, w: 68, h: 264 }, (c) => {
    c.fillStyle = INK; c.fillRect(FRX - 32, 692, 64, 8);
    const steps = [[44, 30], [36, 34], [28, 40], [20, 46], [12, 52], [4, 40]];
    let y = 692;
    for (const [w, h] of steps) { y -= h; c.fillStyle = G5; c.fillRect(FRX - w / 2, y, w, h); c.fillStyle = INK; c.fillRect(FRX + w / 2 - w * 0.35, y, w * 0.35, h); }
  }, { t: 5.2, d: 1.0, reveal: 'rise', ease: 'out' });
}

// ================================================================ St. Peter and its clock
function stPeter(p) {
  const x = PX - 50;
  p.group('back', { x: x - 4, y: 640, w: 108, h: QUAY - 640 + 4 }, (c) => {
    c.fillStyle = G3; c.fillRect(x, 650, 100, QUAY - 650);
    c.fillStyle = G4; c.fillRect(x + 70, 650, 30, QUAY - 650);
    c.fillStyle = INK; c.fillRect(x - 4, 646, 108, 8);
    c.fillStyle = INK; c.beginPath();
    rect(c, x + 22, 780, 12, 50); rect(c, x + 44, 780, 12, 50); rect(c, x + 66, 780, 12, 50);
    rect(c, x + 44, 860, 12, 40);
    c.fill();
  }, { t: 3.9, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the spire
  p.group('back', { x: PX - 40, y: 500, w: 80, h: 152 }, (c) => {
    const steps = [[70, 20], [54, 24], [40, 28], [26, 30], [12, 30], [3, 16]];
    let y = 646;
    for (const [w, h] of steps) { y -= h; c.fillStyle = G5; c.fillRect(PX - w / 2, y, w, h); }
    c.fillStyle = RED; c.fillRect(PX - 6, y - 10, 12, 8); // a weathervane flag, in the one red
  }, { t: 4.9, d: 0.9, reveal: 'rise' });
  // the great dial: black ring, white face, sixty ticks
  p.group('back', { x: PX - 50, y: PY - 50, w: 100, h: 100 }, (c) => {
    c.fillStyle = INK; c.beginPath(); c.arc(PX, PY, 44, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fbfaf6'; c.beginPath(); c.arc(PX, PY, 38, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.beginPath();
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, l = i % 5 ? 4 : 10;
      c.lineWidth = i % 5 ? 1.2 : 3.4;
      c.moveTo(PX + Math.cos(a) * 36, PY + Math.sin(a) * 36); c.lineTo(PX + Math.cos(a) * (36 - l), PY + Math.sin(a) * (36 - l));
    }
    c.lineWidth = 1.4; c.stroke();
  }, { t: 6.4, d: 0.8, reveal: 'iris', ease: 'inOut' });
}

// ================================================================ the old town
function town(p, r) {
  // a row of blocks along the quay, taller toward the back, cut where landmarks stand
  const houses = [];
  const lanes = [[ML, 1000, 950, 70, 150], [ML, 1000, 975, 40, 100]]; // two rows: back taller, front low
  lanes.forEach(([x0, , foot, hmin, hmax], row) => {
    let x = x0;
    while (x < MR - 10) {
      const w = Math.min(MR - x, r.pick([40, 48, 60, 72, 80, 100]));
      const h = Math.round(r.range(hmin, hmax) / 4) * 4;
      // the back row keeps clear of the towers
      const blocked = row === 0 && ((x + w > T1 - 70 && x < T2 + 70) || (x + w > PX - 54 && x < PX + 54) || (x + w > FRX - 32 && x < FRX + 32));
      if (!blocked) houses.push({ x, w, foot, h: row ? h * 0.7 : h, row, tone: r.pick(row ? [G4, G5, INK, G3] : [G3, G2, G4, G5]), roof: r.chance(0.6), seed: r() });
      x += w + (row ? 0 : r.pick([0, 0, 4]));
    }
  });
  const draw = (c, set) => {
    for (const hs of set) {
      const y = hs.foot - hs.h;
      c.fillStyle = hs.tone; c.fillRect(hs.x, y, hs.w, hs.h);
      if (hs.roof) { c.fillStyle = hs.tone === INK ? G5 : INK; c.fillRect(hs.x, y - 10, hs.w, 10); c.fillRect(hs.x + hs.w * 0.2, y - 18, 8, 8); }
      // windows: a grid of small slots, lighter on the dark blocks
      c.fillStyle = hs.tone === G2 || hs.tone === G3 ? INK : '#e9e7e0';
      c.beginPath();
      const cols = Math.max(1, Math.floor((hs.w - 8) / 13)), rows = Math.floor((hs.h - 14) / 20);
      const off = (hs.w - cols * 13) / 2 + 3;
      for (let i = 0; i < rows; i++) for (let k = 0; k < cols; k++) {
        if ((i * 7 + k * 3 + Math.floor(hs.seed * 10)) % 9 === 0) continue;
        rect(c, hs.x + off + k * 13, y + 10 + i * 20, 6, 10);
      }
      c.fill();
    }
  };
  // rising in four runs across, back row first
  for (const row of [0, 1]) {
    const hs = houses.filter((h) => h.row === row);
    const n = 4;
    for (let k = 0; k < n; k++) {
      const set = hs.filter((h) => h.x >= ML + k * (MR - ML) / n && h.x < ML + (k + 1) * (MR - ML) / n);
      if (!set.length) continue;
      const x0 = Math.min(...set.map((h) => h.x)), x1 = Math.max(...set.map((h) => h.x + h.w));
      const top = Math.min(...set.map((h) => h.foot - h.h - 20));
      p.group('town', { x: x0 - 2, y: top - 4, w: x1 - x0 + 4, h: QUAY - top + 6 }, (c) => draw(c, set),
        { t: 3.4 + row * 1.6 + k * 0.28, d: 0.9, reveal: 'rise', ease: 'out' });
    }
  }
  // the quay: a white curb, and a row of small people and lamp posts along it
  const figs = [];
  for (let i = 0; i < 70; i++) figs.push([r.range(ML + 10, MR - 10), r.range(15, 22), r.chance(0.12)]);
  figs.sort((a, b) => a[0] - b[0]);
  p.group('town', { x: ML - 2, y: QUAY - 40, w: MR - ML + 4, h: 48 }, (c) => {
    c.fillStyle = '#fbfaf6'; c.fillRect(ML, QUAY - 4, MR - ML, 6);
    c.fillStyle = INK; c.beginPath();
    for (const [x, h] of figs) { rect(c, x - 2.5, QUAY - 4 - h, 5, h - 5); rect(c, x - 2, QUAY - 9 - h, 4, 4); }
    for (let x = ML + 40; x < MR; x += 120) rect(c, x, QUAY - 40, 2, 36), rect(c, x - 4, QUAY - 42, 10, 4);
    c.fill();
    c.fillStyle = RED; c.beginPath();
    for (const [x, h, red] of figs) if (red) rect(c, x - 2.5, QUAY - 4 - h, 5, (h - 5) * 0.55);
    c.fill();
  }, { t: 7.0, d: 1.0, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ the lake
function lake(p, r) {
  p.group('lake', { x: 0, y: QUAY, w: W, h: 2000 - QUAY }, (c) => {
    c.fillStyle = INK; c.fillRect(0, QUAY + 2, W, 2000 - QUAY);
  }, { t: 2.4, d: 1.5, reveal: 'fall', ease: 'inOut' });
  // rules on the water: thin and close near the town, thicker and farther apart
  // toward us. Each row is broken into dashes; under the field they print red,
  // under the towers white and long, elsewhere gray.
  const rows = [];
  for (let y = QUAY + 18, k = 0; y < LAKE_CALM; k++) {
    const t = (y - QUAY) / (LAKE_CALM - QUAY);
    rows.push({ y, lw: 1 + t * 5 });
    y += 9 + t * 34;
  }
  const red = [], white = [], gray = [];
  for (const row of rows) {
    for (let x = ML; x < MR;) {
      const len = r.range(12, 70) * (1 + (row.y - QUAY) / 600), gap = r.range(6, 30);
      const x1 = Math.min(MR, x + len), mid = (x + x1) / 2;
      const seg = [[x, row.y], [x1, row.y]];
      const inTower = Math.abs(mid - T1) < TW / 2 + 6 || Math.abs(mid - T2) < TW / 2 + 6;
      const into = inTower ? white : mid > FX ? red : gray;
      if (inTower || r.chance(mid > FX ? 0.85 : 0.55)) into.push({ seg, lw: row.lw * (inTower ? 1 : r.range(0.6, 1)) });
      x = x1 + gap;
    }
  }
  // drawn in three bands down the lake so the rules come in like a press roller
  const bands = [[QUAY, 1150], [1150, 1290], [1290, LAKE_CALM]];
  bands.forEach(([a, b], i) => {
    const inB = (s) => s.seg[0][1] >= a && s.seg[0][1] < b;
    p.group('water', { x: ML - 10, y: a - 8, w: MR - ML + 20, h: b - a + 16 }, (c) => {
      c.lineCap = 'butt';
      for (const [col, list] of [[G4, gray], [RED, red], ['#f4f2ec', white]]) {
        c.strokeStyle = col;
        for (const s of list) {
          if (!inB(s)) continue;
          c.lineWidth = s.lw; c.beginPath(); c.moveTo(s.seg[0][0], s.seg[0][1]); c.lineTo(s.seg[1][0], s.seg[1][1]); c.stroke();
        }
      }
    }, { t: 5.6 + i * 0.5, d: 1.1, reveal: 'wipe', ease: 'inOut' });
  });
  // the long reflection of St. Peter's and the Fraumünster's towers in gray blocks
  p.group('water', { x: 300, y: QUAY, w: 400, h: 260 }, (c) => {
    c.fillStyle = G5; c.beginPath();
    for (let i = 0; i < 9; i++) { rect(c, PX - 40 + (i % 2) * 8, QUAY + 14 + i * 24, 70 - i * 5, 8); rect(c, FRX - 22 + (i % 3) * 4, QUAY + 14 + i * 26, 40 - i * 3, 7); }
    c.fill();
  }, { t: 7.2, d: 0.8, reveal: 'fall' });
}

// ================================================================ boats and swans
const swanAt = (c, x, y, s, dir = 1) => {
  // body, tail, neck, head, all rectangles; the bill in red
  c.fillStyle = '#fbfaf6';
  c.fillRect(x - 22 * s, y - 12 * s, 40 * s, 12 * s);
  c.fillRect(x - 30 * s * dir - (dir < 0 ? 10 * s : 0), y - 16 * s, 10 * s, 6 * s);
  const nx = x + (dir > 0 ? 12 : -17) * s;
  c.fillRect(nx, y - 38 * s, 5 * s, 28 * s);
  c.fillRect(dir > 0 ? nx : nx - 9 * s, y - 40 * s, 14 * s, 6 * s);
  c.fillStyle = RED; c.fillRect(dir > 0 ? nx + 14 * s : nx - 15 * s, y - 39 * s, 6 * s, 3.5 * s);
  c.fillStyle = INK; c.fillRect(dir > 0 ? nx + 8 * s : nx - 6 * s, y - 39 * s, 2 * s, 2 * s);
  // its broken reflection
  c.fillStyle = G4; c.fillRect(x - 20 * s, y + 3 * s, 36 * s, 3 * s); c.fillRect(x - 14 * s, y + 9 * s, 24 * s, 2.5 * s);
};

function boats(p, r) {
  // sailboats far out: a hull bar and two narrow sail blocks each
  const sails = [];
  for (let i = 0; i < 9; i++) sails.push([r.range(ML + 40, MR - 60), r.range(QUAY + 40, QUAY + 150), r.range(0.5, 0.9), r.chance(0.2)]);
  sails.sort((a, b) => a[1] - b[1]);
  sails.forEach(([x, y, s, red], i) => {
    p.group('boats', { x: x - 30 * s, y: y - 74 * s, w: 64 * s, h: 84 * s }, (c) => {
      c.fillStyle = '#fbfaf6';
      c.fillRect(x - 22 * s, y - 6 * s, 46 * s, 6 * s);
      c.fillStyle = red ? RED : '#fbfaf6';
      c.fillRect(x - 2 * s, y - 64 * s, 20 * s, 54 * s);
      c.fillStyle = '#fbfaf6'; c.fillRect(x - 16 * s, y - 50 * s, 11 * s, 40 * s);
      c.fillStyle = G4; c.fillRect(x - 18 * s, y + 3 * s, 38 * s, 3 * s);
    }, { t: 8.0 + i * 0.12, d: 0.6, reveal: 'rise' });
  });
  // swans resting near the quay
  const swans = [[230, 1235, 1.0, 1], [300, 1262, 0.8, -1], [820, 1205, 0.7, 1], [1440, 1200, 0.9, -1]];
  swans.forEach(([x, y, s, dir], i) => {
    p.group('boats', { x: x - 46 * s, y: y - 46 * s, w: 92 * s, h: 62 * s }, (c) => swanAt(c, x, y, s, dir),
      { t: 8.6 + i * 0.2, d: 0.6, reveal: 'drop', dy: 16 });
  });
}

// ================================================================ the facts above the name
function facts(p) {
  const y0 = 1440;
  p.group('facts', { x: ML - 2, y: y0 - 4, w: MR - ML + 4, h: 10 }, (c) => {
    c.fillStyle = '#f4f2ec'; c.fillRect(ML, y0, MR - ML, 2);
  }, { t: 9.4, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  FACTS.forEach(([a, b, cc], i) => {
    const x = ML + i * 4 * COL;
    // each line set whole and wiped in, like a line of hot metal
    [[a, 700, 24, '#f4f2ec', 40], [b, 500, 22, G2, 72], [cc, 500, 22, G2, 100]].forEach(([txt, wt, sz, col, dy], k) => {
      p.group('facts', { x: x - 4, y: y0 + dy - sz - 4, w: 4 * COL - 20, h: sz + 14 }, (c) => {
        c.font = `${wt} ${sz}px ${FA}`; c.fillStyle = col; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillText(txt, x, y0 + dy);
      }, { t: 9.7 + i * 0.25 + k * 0.12, d: 0.6, reveal: 'wipe', ease: 'inOut' });
    });
  });
}

// ================================================================ what moves
function life(p) {
  // the hands of St. Peter's clock
  p.live('live', {
    t: 7.0, d: 0.6, reveal: 'fade', box: { x: PX - 40, y: PY - 40, w: 80, h: 80 },
    draw: (c, time) => {
      const m = -Math.PI / 2 + 0.4 + time * 0.09, h = -Math.PI / 2 + 2.2 + time * 0.0075;
      c.strokeStyle = INK; c.lineCap = 'butt';
      c.lineWidth = 4; c.beginPath(); c.moveTo(PX, PY); c.lineTo(PX + Math.cos(h) * 20, PY + Math.sin(h) * 20); c.stroke();
      c.lineWidth = 2.6; c.beginPath(); c.moveTo(PX, PY); c.lineTo(PX + Math.cos(m) * 31, PY + Math.sin(m) * 31); c.stroke();
      c.fillStyle = RED; c.fillRect(PX - 3, PY - 3, 6, 6);
    },
  });
  // a paddle steamer crossing far out, trailing a white wake
  p.live('live', {
    t: 8.2, d: 1.0, reveal: 'fade', box: { x: 0, y: QUAY + 30, w: W, h: 80 },
    draw: (c, time) => {
      const x = ML + 260 + (time - 8.2) * 11, y = QUAY + 92;
      c.fillStyle = '#fbfaf6';
      c.fillRect(x - 70, y - 10, 140, 10);          // hull
      c.fillRect(x - 54, y - 22, 104, 12);          // deck house
      c.fillRect(x - 40, y - 30, 70, 8);            // upper deck
      c.fillStyle = INK; c.beginPath();
      for (let k = 0; k < 9; k++) rect(c, x - 50 + k * 11, y - 19, 6, 6);
      c.fill();
      c.fillStyle = INK; c.fillRect(x - 6, y - 50, 12, 20); // funnel
      c.fillStyle = RED; c.fillRect(x - 6, y - 50, 12, 5);
      c.fillStyle = G2; c.fillRect(x - 12, y - 14, 24, 14); // paddle box
      c.fillStyle = G4; c.fillRect(x - 64, y + 3, 124, 3);
      c.fillStyle = 'rgba(244,242,236,.7)';
      for (let k = 0; k < 4; k++) c.fillRect(x - 90 - k * 36, y - 2 + (k % 2) * 3, 26 - k * 5, 2);
    },
  });
  // two swans gliding slowly across the near water
  p.live('live', {
    t: 9.0, d: 1.0, reveal: 'fade', box: { x: 0, y: 1250, w: W, h: 150 },
    draw: (c, time) => {
      const dt = time - 9;
      swanAt(c, 980 + dt * 6, 1330 + Math.sin(dt * 0.7) * 2, 1.35, 1);
      swanAt(c, 1060 + dt * 6, 1362 + Math.sin(dt * 0.7 + 1) * 2, 1.0, 1);
    },
  });
  // the red reflections under the field tremble a little
  const dashes = [];
  for (let i = 0; i < 16; i++) dashes.push([FX + 30 + ((i * 97) % (MR - FX - 80)), 1250 + (i % 6) * 26, 30 + ((i * 37) % 50), i * 1.3]);
  p.live('live', {
    t: 8.0, d: 1.0, reveal: 'fade', box: { x: FX - 40, y: 1235, w: MR - FX + 80, h: 175 },
    draw: (c, time) => {
      c.fillStyle = RED;
      for (const [x, y, l, ph] of dashes) c.fillRect(x + Math.sin(time * 0.9 + ph) * 14, y, l * (0.7 + 0.3 * Math.sin(time * 1.3 + ph)), 4);
    },
  });
}

// ================================================================ the name
function title(p) {
  const y = 1935;
  const t = p.type('title', 'Zurich', ML - 8, y, { family: FB, size: 448, color: '#f4f2ec', track: -0.035, fit: MR - ML + 8, t: 10.6, gap: 0.16, d: 0.8, reveal: 'press' });
  // the umlaut: two red squares over the u
  const u = t.glyphs[1].box, s = t.size;
  const cx = u.x + u.w / 2, d = s * 0.105, top = y - s * 0.79;
  p.group('title', { x: cx - s * 0.2, y: top - 6, w: s * 0.4, h: d + 12 }, (c) => {
    c.fillStyle = RED;
    c.fillRect(cx - s * 0.145, top, d, d);
    c.fillRect(cx + s * 0.04, top, d, d);
  }, { t: 12.2, d: 0.6, reveal: 'drop', dy: 40, ease: 'back' });
}
