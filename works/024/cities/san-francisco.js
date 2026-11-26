// San Francisco: a WPA screen print. A handful of flat inks laid down in steps,
// each pulled across like a squeegee: a sky in bands, Mount Tamalpais and the
// Marin Headlands in gold and shade, the Golden Gate in International Orange
// rising out of a bank of fog, the city's hills stepping down to the bay with
// Coit Tower and the Pyramid, a cable car climbing toward us, and a row of
// painted ladies over the park. A condensed title reversed out of a teal band.

import { Plate, W, H, boxOf } from '../print.js';
import { shade, mix, lerp, clamp, smooth, poly, rng } from '../kit.js';

const PAPER = '#efe3c5';
const INK = '#21353b', TEAL = '#2f5c63', TEAL_L = '#6a9693', GLASS = '#2a434a';
const SKY = ['#78a8a5', '#8fb8ae', '#a9c7b5', '#c4d4bb', '#dcdcbc', '#ece0b9'];
const OR = '#c9452b', OR_D = '#8f2c1e', OR_L = '#e2734a';
const GOLD = '#d8a557', GOLD_D = '#a9733d', GOLD_L = '#e9c27e';
const TAM = '#a2b7a5', TAM_D = '#87a091';
const SAGE = '#9aae8a', GREEN = '#5b7a59', GREEN_D = '#37523f', GREEN_L = '#86a173';
const FOG = '#f7f1e3', FOG_S = '#d8ddd2';
const SEA = ['#a8c6b8', '#8db7ad', '#72a5a0', '#5a9391', '#467f80'];
const CREAM = '#f5ecd5', STONE = '#d6c8a8', RED = '#9b3123';
const HOUSES = ['#f6eed8', '#f4e9cd', '#f6eed8', '#ecd6a8', '#d9e2d0', '#f0d3ba', '#cfdfd9', '#f3e2b6', '#f7efdc', '#e9dcc0', '#f6eed8'];

export const city = {
  id: 'san-francisco', name: 'San Francisco', wall: '#2b474b',
  alt: "The Golden Gate Bridge over fog and the bay, Alcatraz and sailboats, the Transamerica Pyramid, a row of painted Victorian houses and a cable car climbing a hill",
  google: 'family=Big+Shoulders+Display:wght@700;900',
  fonts: ['900 100px "Big Shoulders Display"', '700 40px "Big Shoulders Display"'],
  build,
};

const IX = 64, IY = 64, IR = W - 64, IB = 1600, IW = IR - IX; // the picture; the band and title sit below it

// the ground lines --------------------------------------------------------------
const gauss = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
const tamY = (x) => 702 - 190 * gauss(x, 1215, 165) - 92 * gauss(x, 1005, 120) - 120 * gauss(x, 1470, 190) - 26 * gauss(x, 1335, 55) + 4 * Math.sin(x * 0.05);
const headY = (x) => 892 - 262 * smooth(860, 1090, x) - 40 * gauss(x, 1180, 60) + 44 * gauss(x, 1300, 40) - 46 * gauss(x, 1420, 70) + 22 * smooth(1460, 1540, x) + 5 * Math.sin(x * 0.08);
const presY = (x) => 872 + 26 * smooth(200, 700, x) + 160 * smooth(560, 780, x) - 14 * Math.sin(x * 0.03);
const teleY = (x) => 1090 - 188 * gauss(x, 1298, 118) - 60 * smooth(1360, 1536, x) + 3 * Math.sin(x * 0.07);
const hillB = (x) => 1094 - 42 * gauss(x, 380, 210) - 18 * gauss(x, 760, 120) + 26 * gauss(x, 1010, 90) - 20 * smooth(1150, 1536, x);
const hillC = (x) => 1290 - 34 * gauss(x, 420, 300) + 14 * Math.sin(x * 0.0045 + 1) - 22 * gauss(x, 1400, 160);
const line = (x0, x1, f, step = 6) => { const pts = []; for (let x = x0; x <= x1 + 1e-6; x += step) pts.push([x, f(x)]); return pts; };

// the street the cable car climbs: it falls away from us to the Marina
const ST_TOP = 1082, ST_HOR = 1064;
const stX = (y) => lerp(1004, 962, (y - ST_TOP) / (IB - ST_TOP));
const stW = (y) => 132 * (y - ST_HOR) / (IB - ST_HOR);
const onStreet = (x0, x1, base) => base > ST_TOP - 4 && x1 > stX(base) - stW(base) - 3 && x0 < stX(base) + stW(base) + 3;

// the bridge
const S = { x: 470, deck: 806, k: 1, foot: 905 };
const N = { x: 1118, deck: 782, k: 0.7, foot: 884 };
const deckY = (x) => lerp(S.deck, N.deck, (x - S.x) / (N.x - S.x));
const deckT = (x) => lerp(20, 13, clamp((x - S.x) / (N.x - S.x), -0.6, 1.3));
const ANCHOR = 1302;

function build() {
  const p = new Plate({ paper: PAPER, seed: 1937 });
  const r = p.r;
  p.clip = { x: IX, y: IY, w: IW, h: IB - IY };
  p.stack('sky', 'sea', 'tam', 'marin', 'bridge', 'fog', 'fogLive', 'presidio', 'tele', 'down', 'bay', 'hillB', 'hillC', 'street', 'housesC', 'car', 'ladies', 'front', 'title', 'frame');
  p.layer('title', { clip: false });
  p.layer('frame', { clip: false });

  frame(p);
  sky(p, r);
  marin(p, r);
  sea(p, r);
  bridge(p, r);
  fog(p, r);
  presidio(p, r);
  telegraph(p, r);
  downtown(p, r);
  bay(p, r);
  hills(p, r);
  street(p, r);
  ladies(p, r);
  front(p, r);
  title(p);
  return p;
}

// ---------------------------------------------------------------- sky
function sky(p, r) {
  const ys = [IY, 238, 372, 486, 584, 652, 712];
  for (let i = 0; i < 6; i++) {
    const y0 = ys[i], y1 = ys[i + 1];
    p.group('sky', { x: IX, y: y0, w: IW, h: y1 - y0 + 2 }, (c) => { c.fillStyle = SKY[i]; c.fillRect(IX, y0, IW, y1 - y0 + 1); },
      { t: 0.15 + i * 0.17, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  }
  // long flat clouds, printed in the paper's own cream
  const clouds = [[120, 300, 520, 20], [880, 214, 560, 16], [600, 420, 360, 13], [1180, 452, 300, 11]];
  clouds.forEach(([x, y, w, h], i) => {
    p.group('sky', { x: x - h, y: y - h * 2, w: w + 2 * h + 40, h: h * 3 }, (c) => {
      c.fillStyle = mix(SKY[Math.min(5, 1 + i)], INK, 0.08); pill(c, x + 16, y + h * 0.55, w, h * 0.8);
      c.fillStyle = CREAM; pill(c, x, y, w, h);
      pill(c, x + w * 0.18, y - h * 0.8, w * 0.42, h * 0.9);
    }, { t: 1.25 + i * 0.14, d: 0.9, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

function pill(c, x, y, w, h) {
  c.beginPath(); c.moveTo(x + h / 2, y - h / 2); c.lineTo(x + w - h / 2, y - h / 2);
  c.arc(x + w - h / 2, y, h / 2, -Math.PI / 2, Math.PI / 2); c.lineTo(x + h / 2, y + h / 2);
  c.arc(x + h / 2, y, h / 2, Math.PI / 2, Math.PI * 1.5); c.fill();
}

// ---------------------------------------------------------------- Marin
// facets: the slope that falls away to the right is in shade, cut as one flat ink
function facets(c, f, x0, x1, foot, color, k = 0.42) {
  const pts = line(x0, x1, f, 4);
  c.fillStyle = color;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    if (!(py < pts[i - 1][1] && py <= pts[i + 1][1])) continue; // a peak
    let j = i + 1;
    while (j < pts.length - 1 && pts[j + 1][1] >= pts[j][1]) j++;
    const [vx, vy] = pts[j];
    const sh = pts.slice(i, j + 1);
    sh.push([vx + (foot - vy) * 0.12, foot], [px + (foot - py) * k, foot]);
    poly(c, sh); c.fill();
  }
}

function marin(p, r) {
  // Mount Tamalpais, far and pale
  const tam = [...line(760, IR + 10, tamY, 6), [IR + 10, 720], [760, 720]];
  p.group('tam', boxOf(tam, 4), (c) => {
    c.fillStyle = TAM; poly(c, tam); c.fill();
    c.save(); poly(c, tam); c.clip();
    facets(c, tamY, 760, IR + 10, 720, TAM_D, 0.5);
    c.restore();
  }, { t: 1.3, d: 1.2, reveal: 'rise', ease: 'inOut' });

  // the headlands: gold grass, the shade, the dark scrub in the gullies
  const hd = [...line(850, IR + 10, headY, 5), [IR + 10, 900], [850, 900]];
  const scrub = [];
  for (let i = 0; i < 9; i++) {
    const x = r.range(930, IR - 10), y0 = headY(x) + r.range(30, 70);
    const pts = [];
    const n = 14, len = r.range(60, 150), wd = r.range(10, 22);
    for (let k = 0; k <= n; k++) { const f = k / n; pts.push([x + f * len * 0.35 + Math.sin(f * 7 + i) * 4, y0 + f * len - Math.sin(f * Math.PI) * 0 ]); }
    const out = [];
    pts.forEach(([xx, yy], k) => out.push([xx - wd * Math.sin((k / n) * Math.PI) - 2, yy]));
    pts.slice().reverse().forEach(([xx, yy], k) => out.push([xx + wd * Math.sin(((n - k) / n) * Math.PI) * 0.8 + 2, yy]));
    scrub.push(out);
  }
  p.group('marin', boxOf(hd, 4), (c) => {
    c.fillStyle = GOLD; poly(c, hd); c.fill();
    c.save(); poly(c, hd); c.clip();
    // a lighter band along the crest, where the sun lies on the grass
    c.fillStyle = GOLD_L;
    c.beginPath(); line(850, IR + 10, headY, 5).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    line(850, IR + 10, headY, 5).reverse().forEach(([x, y]) => c.lineTo(x + 6, y + 16 + 10 * Math.sin(x * 0.03)));
    c.fill();
    facets(c, headY, 850, IR + 10, 900, GOLD_D, 0.55);
    c.restore();
  }, { t: 1.7, d: 1.3, reveal: 'rise', ease: 'inOut' });
  p.group('marin', { x: 860, y: 580, w: IR - 860, h: 320 }, (c) => {
    c.save(); poly(c, hd); c.clip();
    for (const s of scrub) { c.fillStyle = GREEN_D; poly(c, s); c.fill(); }
    // the grass: short strokes down the slope, the way a screen leaves them
    const rr = rng(31);
    c.strokeStyle = 'rgba(140,92,45,.45)'; c.lineWidth = 1.2; c.beginPath();
    for (let i = 0; i < 620; i++) {
      const x = rr.range(880, IR), y = headY(x) + rr.range(8, 240);
      c.moveTo(x, y); c.lineTo(x + 3, y + 7);
    }
    c.stroke();
    // the road that zigzags up from the bridge
    c.strokeStyle = CREAM; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath();
    c.moveTo(ANCHOR + 8, 778); c.lineTo(1250, 752); c.lineTo(1320, 728); c.lineTo(1214, 700); c.lineTo(1290, 676); c.lineTo(1232, 650);
    c.stroke();
    // old batteries on the slope, small white blocks
    c.fillStyle = CREAM;
    for (const [x, y] of [[1040, 700], [1170, 662], [1446, 700], [960, 780]]) { c.fillRect(x, y, 16, 6); c.fillStyle = GOLD_D; c.fillRect(x, y + 6, 16, 3); c.fillStyle = CREAM; }
    c.restore();
  }, { t: 2.6, d: 1.0, reveal: 'fade' });
  // fog pouring over the saddle
  const tongue = [];
  for (let a = 0; a <= 20; a++) { const f = a / 20; tongue.push([968 - 40 * f + Math.sin(f * 9) * 6, lerp(headY(968) + 4, 846, f)]); }
  for (let a = 20; a >= 0; a--) { const f = a / 20; tongue.push([1036 + 26 * f + Math.sin(f * 8 + 1) * 8, lerp(headY(1036) + 4, 850, f)]); }
  p.group('marin', boxOf(tongue, 30), (c) => {
    c.fillStyle = FOG_S; c.save(); c.translate(6, 6); poly(c, tongue); c.fill(); c.restore();
    c.fillStyle = FOG; poly(c, tongue); c.fill();
    for (const [x, y, rr] of [[976, headY(976) + 6, 18], [1002, headY(1002), 22], [1030, headY(1030) + 6, 17]]) { c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill(); }
  }, { t: 3.2, d: 1.2, reveal: 'fall', ease: 'inOut' });
}

// ---------------------------------------------------------------- the sea
function sea(p, r) {
  const ys = [700, 742, 800, 880, 980, 1100];
  for (let i = 0; i < 5; i++) {
    const y0 = ys[i], y1 = ys[i + 1];
    p.group('sea', { x: IX, y: y0, w: IW, h: y1 - y0 + 2 }, (c) => { c.fillStyle = SEA[i]; c.fillRect(IX, y0, IW, y1 - y0 + 1); },
      { t: 1.4 + i * 0.15, d: 0.8, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  }
  // light on the water: short level dashes, longer near
  const dashes = [];
  for (let i = 0; i < 260; i++) {
    const y = lerp(706, 1090, r() ** 1.3), k = (y - 700) / 400;
    const x = r.range(IX, IR), L = lerp(6, 34, k) * r.range(0.6, 1.3);
    dashes.push([[x, y], [x + L, y]]);
  }
  dashes.sort((a, b) => a[0][1] - b[0][1]);
  p.strokes('sea', dashes, 'rgba(245,236,213,.55)', 1.6, { t: 2.3, d: 1.0, reveal: 'fall', cap: 'butt' });
  p.strokes('sea', dashes.filter((_, i) => i % 3 === 0).map(([[x, y], [x1]]) => [[x + 4, y + 4], [x1 + 10, y + 4]]), 'rgba(33,53,59,.22)', 1.4, { t: 2.6, d: 0.9, reveal: 'fall', cap: 'butt' });
}

// ---------------------------------------------------------------- the bridge
function tower(c, T) {
  const { x, deck, k, foot } = T;
  const Ht = 612 * k, top = deck - Ht;
  const lv = [0, 0.355, 0.6, 0.805, 0.948];          // the struts' feet, up from the deck
  const sh = [0, 0.046, 0.042, 0.038, 0.052];        // and their heights
  const ow = [86, 81, 76, 72, 68].map((v) => v * k); // outer half width, a step in at each strut
  const lw = [36, 33, 31, 29, 27].map((v) => v * k); // the legs
  const yAt = (f) => deck - f * Ht;
  // below the deck: the legs go down to the pier, with crossed braces
  c.fillStyle = OR_D;
  for (const sd of [-1, 1]) c.fillRect(x + sd * ow[0] - (sd > 0 ? lw[0] : 0), deck, lw[0], foot - deck);
  c.strokeStyle = OR_D; c.lineWidth = 5 * k; c.beginPath();
  for (let y = deck + 12 * k; y < foot - 30 * k; y += 46 * k) {
    const a = x - ow[0] + lw[0], b = x + ow[0] - lw[0];
    c.moveTo(a, y); c.lineTo(b, y + 40 * k); c.moveTo(b, y); c.lineTo(a, y + 40 * k);
  }
  c.stroke();
  c.fillStyle = STONE; c.fillRect(x - ow[0] - 14 * k, foot - 26 * k, 2 * ow[0] + 28 * k, 30 * k);
  c.fillStyle = mix(STONE, INK, 0.25); c.fillRect(x + ow[0] * 0.2, foot - 26 * k, ow[0] * 0.8 + 14 * k, 30 * k);
  // the legs, segment by segment
  for (let i = 0; i < 5; i++) {
    const y0 = yAt(lv[i]), y1 = i < 4 ? yAt(lv[i + 1]) : top;
    for (const sd of [-1, 1]) {
      const xl = sd < 0 ? x - ow[i] : x + ow[i] - lw[i];
      const L = lw[i];
      c.fillStyle = OR; c.fillRect(xl, y1, L, y0 - y1 + 1);
      // the face turned from the sun
      c.fillStyle = OR_D; c.fillRect(xl + L * 0.62, y1, L * 0.38, y0 - y1 + 1);
      // the recessed flutes up the lit face
      c.fillStyle = mix(OR, OR_D, 0.45);
      c.fillRect(xl + L * 0.16, y1 + 6 * k, Math.max(1, 2.4 * k), y0 - y1 - 10 * k);
      c.fillRect(xl + L * 0.38, y1 + 6 * k, Math.max(1, 2.4 * k), y0 - y1 - 10 * k);
      // the shoulder where it steps in
      if (i > 0) { c.fillStyle = OR_L; c.fillRect(xl - (sd < 0 ? 0 : 0), y0 - 1.5 * k, L, 2.5 * k); }
    }
  }
  // the struts: Art Deco panels, ribbed, with stepped corners into the openings
  for (let i = 1; i < 5; i++) {
    const yb = yAt(lv[i]), ht = sh[i] * Ht;
    const inner = ow[i] - lw[i] + 1;
    c.fillStyle = OR; c.fillRect(x - inner, yb - ht, 2 * inner, ht);
    c.fillStyle = OR_D; c.fillRect(x - inner, yb - ht * 0.25, 2 * inner, ht * 0.25);
    c.fillStyle = mix(OR, OR_D, 0.55);
    const n = Math.max(3, Math.round((2 * inner) / (7 * k)));
    for (let j = 1; j < n; j++) c.fillRect(x - inner + (2 * inner * j) / n - 0.8 * k, yb - ht * 0.85, 1.6 * k, ht * 0.55);
    // the stepped corners at the top of the opening below
    const st = 6 * k;
    const innerB = ow[i - 1] - lw[i - 1];
    c.fillStyle = OR;
    for (const sd of [-1, 1]) {
      const xe = x + sd * innerB;
      c.fillRect(sd < 0 ? xe : xe - 2 * st, yb, 2 * st, st);
      c.fillRect(sd < 0 ? xe : xe - st, yb + st, st, st);
    }
    c.fillStyle = OR_D; c.fillRect(x - innerB, yb, 2 * innerB, 1.2 * k);
  }
  // the caps: each leg ends in two small steps
  for (const sd of [-1, 1]) {
    const xl = sd < 0 ? x - ow[4] : x + ow[4] - lw[4], L = lw[4];
    c.fillStyle = OR; c.fillRect(xl + L * 0.12, top - 7 * k, L * 0.76, 7 * k); c.fillRect(xl + L * 0.28, top - 12 * k, L * 0.44, 5 * k);
    c.fillStyle = OR_D; c.fillRect(xl + L * 0.6, top - 7 * k, L * 0.28, 7 * k); c.fillRect(xl + L * 0.6, top - 12 * k, L * 0.12, 5 * k);
  }
  // the cable saddles on top
  c.fillStyle = INK;
  for (const sd of [-1, 1]) c.fillRect(x + sd * (ow[4] - lw[4] / 2) - 5 * k, top - 15 * k, 10 * k, 4 * k);
}

const cabX = (T, sd) => T.x + sd * (68 - 13.5) * T.k;
const cabTop = (T) => T.deck - 612 * T.k - 13 * T.k;

// the main cable between the towers, as a parabola with its low point near the deck
function mainCable(sd) {
  const xa = cabX(S, sd), ya = cabTop(S), xb = cabX(N, sd), yb = cabTop(N);
  const sag = 512;
  const pts = [];
  for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push([lerp(xa, xb, t), lerp(ya, yb, t) + 4 * sag * t * (1 - t)]); }
  return pts;
}
function sideCable(T, sd, x1, y1, sag) {
  const xa = cabX(T, sd), ya = cabTop(T);
  const pts = [];
  for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push([lerp(xa, x1, t), lerp(ya, y1, t) + 4 * sag * t * (1 - t)]); }
  return pts;
}

function bridge(p, r) {
  p.group('bridge', { x: S.x - 110, y: cabTop(S) - 20, w: 220, h: S.foot - cabTop(S) + 30 }, (c) => tower(c, S), { t: 3.0, d: 1.7, reveal: 'rise', ease: 'inOut' });
  p.group('bridge', { x: N.x - 80, y: cabTop(N) - 20, w: 160, h: N.foot - cabTop(N) + 30 }, (c) => tower(c, N), { t: 3.5, d: 1.5, reveal: 'rise', ease: 'inOut' });
  // the deck: a roadway over a deep stiffening truss
  const x0 = IX - 10, x1 = ANCHOR;
  p.group('bridge', { x: x0, y: N.deck - 20, w: x1 - x0 + 30, h: 70 }, (c) => {
    const top = line(x0, x1, deckY, 8), bot = line(x0, x1, (x) => deckY(x) + deckT(x), 8);
    c.fillStyle = OR; poly(c, [...top, ...bot.reverse()]); c.fill();
    // the truss: its lower half in shade, crossed by the lattice
    c.fillStyle = OR_D; poly(c, [...line(x0, x1, (x) => deckY(x) + deckT(x) * 0.42, 8), ...line(x0, x1, (x) => deckY(x) + deckT(x), 8).reverse()]); c.fill();
    c.strokeStyle = OR; c.lineWidth = 1.1; c.beginPath();
    for (let x = x0; x < x1; x += 9) {
      const a = deckY(x) + deckT(x) * 0.42, b = deckY(x + 9) + deckT(x + 9);
      c.moveTo(x, a); c.lineTo(x + 9, b); c.moveTo(x + 9, deckY(x + 9) + deckT(x + 9) * 0.42); c.lineTo(x + 9, b);
    }
    c.stroke();
    // the rail and the lamps
    c.strokeStyle = OR_L; c.lineWidth = 2; c.beginPath(); top.forEach(([x, y], i) => (i ? c.lineTo(x, y - 3) : c.moveTo(x, y - 3))); c.stroke();
    c.fillStyle = OR_D;
    for (let x = x0 + 20; x < x1; x += 46) c.fillRect(x, deckY(x) - 12, 1.6, 10);
    // the anchorage on the Marin side
    c.fillStyle = STONE; c.fillRect(ANCHOR - 6, N.deck - 22, 46, 34);
    c.fillStyle = mix(STONE, INK, 0.3); c.fillRect(ANCHOR + 22, N.deck - 22, 18, 34);
  }, { t: 4.4, d: 1.3, reveal: 'wipe', ease: 'inOut' });
  // the cables, drawn by the pen, then the hangers fall from them
  const cables = [mainCable(1), mainCable(-1), sideCable(S, -1, IX - 80, 860, 60), sideCable(S, 1, IX - 80, 862, 60), sideCable(N, 1, ANCHOR + 10, N.deck - 14, 30), sideCable(N, -1, ANCHOR + 4, N.deck - 12, 30)];
  cables.forEach((pts, i) => p.pen('bridge', pts, i % 2 === 0 ? OR_D : OR, i < 2 ? 3.4 : 2.6, { t: 5.0 + i * 0.12, d: i < 2 ? 1.5 : 0.9 }));
  const hang = (pts, x0, x1) => {
    const out = [];
    for (let i = 1; i < pts.length; i++) {
      const [xa, ya] = pts[i - 1], [xb, yb] = pts[i];
      for (let x = Math.ceil(xa / 9) * 9; x < xb; x += 9) {
        if (x < x0 || x > x1) continue;
        const y = lerp(ya, yb, (x - xa) / (xb - xa));
        if (deckY(x) - 3 - y > 4) out.push([[x, y], [x, deckY(x) - 3]]);
      }
    }
    return out;
  };
  const hangers = [
    ...hang(mainCable(-1), cabX(S, 1) + 4, cabX(N, -1) - 4), ...hang(mainCable(1), cabX(S, 1) + 4, cabX(N, -1) - 4),
    ...hang(sideCable(S, -1, IX - 80, 860, 60).reverse(), IX, S.x - 90),
    ...hang(sideCable(N, 1, ANCHOR + 10, N.deck - 14, 30), N.x + 50, ANCHOR - 8),
  ];
  p.strokes('bridge', hangers, 'rgba(143,44,30,.85)', 1.1, { t: 6.1, d: 1.0, reveal: 'fall', cap: 'butt' });

  // cars on the deck, both ways
  const cars = [];
  for (let i = 0; i < 12; i++) cars.push({ ph: r(), sp: r.range(0.018, 0.03) * (i % 2 ? 1 : -1), col: r.pick([CREAM, TEAL, INK, GOLD_L, '#bfc9c2']) });
  p.live('bridge', {
    t: 7.0, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      for (const cr of cars) {
        let f = (cr.ph + time * cr.sp) % 1; if (f < 0) f += 1;
        const x = lerp(IX - 10, ANCHOR - 4, f), y = deckY(x) - 3, s = lerp(1, 0.72, clamp((x - S.x) / (N.x - S.x)));
        c.fillStyle = cr.col; c.fillRect(x - 5 * s, y - 4 * s, 10 * s, 4 * s);
      }
    },
  });
}

// ---------------------------------------------------------------- fog
function puffs(r, x0, x1, y, rad) {
  const out = [];
  for (let x = x0; x < x1;) { const rr = rad * r.range(0.7, 1.25); out.push([x, y + r.range(-0.25, 0.25) * rad, rr]); x += rr * r.range(0.9, 1.3); }
  return out;
}
function drawFog(c, list, base, o = {}) {
  // the shadow ink first, offset, then the cream on top: two flat pulls
  for (const [ink, dx, dy] of [[o.shade || FOG_S, 5, 7], [o.color || FOG, 0, 0]]) {
    c.fillStyle = ink; c.beginPath();
    for (const [x, y, rr] of list) { c.moveTo(x + dx + rr, y + dy); c.arc(x + dx, y + dy, rr, 0, Math.PI * 2); }
    const x0 = list[0][0] - list[0][2], x1 = list[list.length - 1][0] + list[list.length - 1][2];
    c.rect(x0 + dx, list[0][1] + dy, x1 - x0, base - list[0][1]);
    c.fill();
  }
}

function fog(p, r) {
  // the bank lying on the water, the towers' feet lost in it
  const bank = puffs(r, IX - 40, 1190, 858, 30);
  bank.forEach((b) => { b[1] += 12 * Math.sin(b[0] * 0.006) + (b[0] > 1050 ? 6 : 0); });
  p.group('fog', { x: IX - 80, y: 790, w: 1400, h: 140 }, (c) => drawFog(c, bank, 912), { t: 4.0, d: 1.6, reveal: 'wipe', ease: 'inOut' });
  // low wisps over the bank
  const wisp = puffs(r, 560, 1060, 890, 16);
  p.group('fog', { x: 520, y: 850, w: 600, h: 70 }, (c) => drawFog(c, wisp, 900), { t: 4.9, d: 1.0, reveal: 'wipeL', ease: 'inOut' });

  // bands that drift across the towers, slowly, each its own way
  const bands = [
    { y: 846, x: 160, w: 520, h: 16, sp: 0.21, amp: 70, ph: 0 },
    { y: 822, x: 760, w: 440, h: 13, sp: 0.16, amp: 90, ph: 2 },
    { y: 728, x: 860, w: 240, h: 11, sp: 0.13, amp: 60, ph: 4 },
    { y: 874, x: 940, w: 380, h: 12, sp: 0.18, amp: 80, ph: 1 },
  ];
  p.live('fogLive', {
    t: 5.2, d: 1.5, reveal: 'fade',
    draw: (c, time) => {
      for (const b of bands) {
        const dx = Math.sin(time * b.sp + b.ph) * b.amp + time * 1.2 % 1;
        c.fillStyle = 'rgba(216,221,210,.75)'; pill(c, b.x + dx + 6, b.y + 5, b.w, b.h);
        c.fillStyle = 'rgba(247,241,227,.93)'; pill(c, b.x + dx, b.y, b.w, b.h);
        pill(c, b.x + dx + b.w * 0.2, b.y - b.h * 0.6, b.w * 0.35, b.h * 0.8);
      }
    },
  });
}

// ---------------------------------------------------------------- the Presidio
function presidio(p, r) {
  const land = [...line(IX - 10, 800, presY, 6), [800, 1110], [IX - 10, 1110]];
  p.group('presidio', boxOf(land, 4), (c) => {
    c.fillStyle = GREEN_D; poly(c, land); c.fill();
    c.save(); poly(c, land); c.clip();
    // the wood below the crest, row on row of crowns
    const rr = rng(12);
    for (let k = 0; k < 9; k++) {
      c.fillStyle = k % 2 ? GREEN_D : mix(GREEN, GREEN_D, 0.45);
      // a scalloped edge of crowns, filled down to the foot
      c.beginPath(); c.moveTo(IX - 30, 1120);
      for (let x = IX - 30 + (k % 2) * 8; x < 810;) {
        const rad = rr.range(7, 12), y = presY(x + rad) + 30 + k * 20 + rr.range(-3, 3);
        c.lineTo(x, y); c.arc(x + rad, y, rad, Math.PI, 0); x += rad * 2;
      }
      c.lineTo(810, 1120); c.closePath(); c.fill();
    }
    c.restore();
  }, { t: 4.3, d: 1.1, reveal: 'rise' });
  // a wood of cypress and eucalyptus along the crest
  const trees = [];
  for (let x = IX - 10; x < 760; x += r.range(9, 18)) {
    const tall = r.chance(0.18);
    trees.push({ x, y: presY(x) + r.range(4, 22), rad: r.range(10, 18) * (tall ? 0.8 : 1), tall });
  }
  trees.sort((a, b) => a.y - b.y);
  p.group('presidio', { x: IX - 30, y: 800, w: 800, h: 200 }, (c) => {
    for (const t of trees) {
      if (t.tall) {
        c.fillStyle = GREEN_D; c.beginPath(); c.ellipse(t.x, t.y - t.rad * 1.9, t.rad * 0.7, t.rad * 2.2, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = GREEN; c.beginPath(); c.ellipse(t.x - t.rad * 0.2, t.y - t.rad * 2.1, t.rad * 0.4, t.rad * 1.8, 0, 0, Math.PI * 2); c.fill();
      } else {
        // a cypress: flat layered crown
        c.fillStyle = GREEN_D; c.beginPath(); c.ellipse(t.x, t.y - t.rad * 0.6, t.rad * 1.3, t.rad * 0.75, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = GREEN; c.beginPath(); c.ellipse(t.x - t.rad * 0.25, t.y - t.rad * 0.9, t.rad * 0.85, t.rad * 0.42, 0, 0, Math.PI * 2); c.fill();
      }
    }
  }, { t: 4.9, d: 1.0, reveal: 'rise' });
}

// ---------------------------------------------------------------- houses
// a San Francisco front: a bay window, a cornice or a gable, the door up its stair
function house(c, h0) {
  const { x, b, w, h, s, color } = h0;
  const col = color, dk = mix(col, INK, 0.3), lt = mix(col, '#fffaf0', 0.4), win = mix(GLASS, col, clamp(0.62 - s * 0.6, 0.08, 0.5));
  c.fillStyle = col; c.fillRect(x, b - h, w, h);
  if (h0.gable) {
    const gh = w * 0.42;
    c.fillStyle = col; poly(c, [[x - 1.5 * s, b - h + 1], [x + w / 2, b - h - gh], [x + w + 1.5 * s, b - h + 1]]); c.fill();
    c.fillStyle = dk; poly(c, [[x + w / 2, b - h - gh], [x + w + 1.5 * s, b - h + 1], [x + w / 2 + 2 * s, b - h + 1]]); c.fill();
    c.fillStyle = win; c.fillRect(x + w / 2 - 2 * s, b - h - gh * 0.5, 4 * s, 4 * s);
  }
  // the bay, lighter, with its shaded side
  const fl = Math.max(1, Math.round((h - 10 * s) / (17 * s)));
  const fh = (h - 9 * s) / fl;
  if (h0.bay) {
    const bx = x + w * 0.1, bw = w * 0.52;
    c.fillStyle = lt; c.fillRect(bx, b - h + 4 * s, bw, h - 12 * s);
    c.fillStyle = mix(col, INK, 0.18); c.fillRect(bx + bw * 0.78, b - h + 4 * s, bw * 0.22, h - 12 * s);
    c.fillStyle = win;
    for (let f = 0; f < fl; f++) {
      const y = b - 9 * s - (f + 1) * fh + fh * 0.22;
      c.fillRect(bx + bw * 0.08, y, bw * 0.16, fh * 0.56); c.fillRect(bx + bw * 0.32, y, bw * 0.36, fh * 0.56); c.fillRect(bx + bw * 0.78, y, bw * 0.13, fh * 0.56);
    }
    for (let f = 0; f < fl; f++) { const y = b - 9 * s - (f + 1) * fh + fh * 0.22; c.fillRect(x + w * 0.72, y, w * 0.16, fh * 0.56); }
  } else {
    c.fillStyle = win;
    const cols = Math.max(2, Math.round(w / (11 * s)));
    for (let f = 0; f < fl; f++) {
      const y = b - 9 * s - (f + 1) * fh + fh * 0.22;
      for (let k = 0; k < cols; k++) c.fillRect(x + (w * (k + 0.28)) / cols, y, (w / cols) * 0.44, fh * 0.56);
    }
  }
  // the ground floor: a door at one side, a garage at the other
  c.fillStyle = dk; c.fillRect(x, b - 9 * s, w, 9 * s);
  c.fillStyle = win; c.fillRect(x + w * 0.74, b - 8 * s, w * 0.14, 8 * s);
  if (h0.garage) { c.fillStyle = lt; c.fillRect(x + w * 0.12, b - 7 * s, w * 0.4, 7 * s); }
  // the cornice
  if (!h0.gable) {
    c.fillStyle = h0.trim || dk; c.fillRect(x - 1.2 * s, b - h - 3 * s, w + 2.4 * s, 4 * s);
    c.fillStyle = dk; for (let xx = x + 2 * s; xx < x + w - 1; xx += 5 * s) c.fillRect(xx, b - h + 1 * s, 1.6 * s, 2.4 * s);
  }
  // a seam of shade at its right edge
  c.fillStyle = mix(col, INK, 0.22); c.fillRect(x + w - Math.max(0.8, 2 * s), b - h, Math.max(0.8, 2 * s), h);
}

function bush(c, x, y, rad, col = GREEN, dk = GREEN_D) {
  c.fillStyle = dk; c.beginPath(); c.arc(x + rad * 0.14, y, rad, 0, Math.PI * 2); c.fill();
  c.fillStyle = col; c.beginPath(); c.arc(x - rad * 0.16, y - rad * 0.14, rad * 0.78, 0, Math.PI * 2); c.fill();
}

// rows of houses along a hill's line, far rows first; each house sits level, so
// the roofs step down the slopes
function rows(r, top, o) {
  const out = [];
  let off = o.lead;
  for (let j = 0; j < o.n; j++) {
    const f = o.n > 1 ? j / (o.n - 1) : 0, s = lerp(o.s0, o.s1, f);
    const items = [];
    let x = o.x0 - r() * 40 * s;
    while (x < o.x1) {
      const w = r.range(26, 44) * s, xc = x + w / 2;
      const base = top(xc) + off;
      if (o.skip && o.skip(x, x + w, base, j)) { x += w; continue; }
      if (r.chance(o.trees ?? 0.06)) { items.push({ tree: true, x: xc, b: base, rad: r.range(9, 14) * s }); x += w * 0.8; continue; }
      const h = r.range(44, 70) * s * (r.chance(0.1) ? 1.3 : 1);
      items.push({ x, b: base, w, h, s, color: r.pick(HOUSES), bay: w > 28 * s && r.chance(0.7), gable: r.chance(0.18), garage: r.chance(0.4), trim: r.chance(0.3) ? CREAM : null });
      x += w + (r.chance(0.08) ? r.range(2, 8) * s : 0);
    }
    out.push({ items, s, y: Math.min(...items.map((it) => it.b - (it.h || 0))), yb: Math.max(...items.map((it) => it.b)) });
    off += o.step * s;
  }
  return out;
}
function drawRow(c, row) {
  for (const it of row.items) {
    if (it.tree) bush(c, it.x, it.b - it.rad, it.rad);
    else house(c, it);
  }
}

// ---------------------------------------------------------------- Telegraph Hill
function telegraph(p, r) {
  const hill = [...line(1100, IR + 10, teleY, 5), [IR + 10, 1130], [1100, 1130]];
  p.group('tele', boxOf(hill, 4), (c) => {
    c.fillStyle = SAGE; poly(c, hill); c.fill();
    c.save(); poly(c, hill); c.clip(); facets(c, teleY, 1100, IR + 10, 1130, mix(SAGE, INK, 0.2), 0.6); c.restore();
  }, { t: 4.8, d: 1.0, reveal: 'rise' });
  const rs = rows(r, teleY, { x0: 1110, x1: IR + 10, n: 4, s0: 0.26, s1: 0.32, lead: 10, step: 44, trees: 0.08, skip: (x0, x1, b, j) => j < 2 && x1 > 1228 && x0 < 1366 });
  rs.forEach((row, j) => p.group('tele', { x: 1060, y: row.y - 20, w: IR - 1040, h: row.yb - row.y + 30 }, (c) => drawRow(c, row), { t: 5.2 + j * 0.2, d: 0.7, reveal: 'rise' }));
  // Pioneer Park's pines around the tower
  const pines = [];
  for (let i = 0; i < 26; i++) { const x = r.range(1232, 1364); pines.push([x, teleY(x) + r.range(2, 20), r.range(7, 12)]); }
  pines.sort((a, b) => a[1] - b[1]);
  p.group('tele', { x: 1210, y: 860, w: 180, h: 110 }, (c) => { for (const [x, y, rr] of pines) bush(c, x, y - rr * 0.6, rr, GREEN, GREEN_D); }, { t: 5.9, d: 0.7, reveal: 'rise' });
  // Coit Tower: a fluted column, a ring of tall arches at its head, on a low base
  const cx = 1298, foot = teleY(cx) + 8, top = foot - 186, hw = 25;
  p.group('tele', { x: cx - 60, y: top - 20, w: 120, h: foot - top + 30 }, (c) => {
    // the base building, its arched loggia
    c.fillStyle = CREAM; c.fillRect(cx - 42, foot - 22, 84, 22);
    c.fillStyle = STONE; c.fillRect(cx + 12, foot - 22, 30, 22);
    c.fillStyle = GLASS; for (let i = -3; i <= 3; i++) { c.beginPath(); c.arc(cx + i * 11, foot - 11, 3, Math.PI, 0); c.rect(cx + i * 11 - 3, foot - 11, 6, 8); c.fill(); }
    // the shaft: flutes in two inks, lit to the left
    const s0 = top + 30, s1 = foot - 22;
    for (let i = 0; i < 9; i++) {
      const x0 = cx - hw + (2 * hw * i) / 9, k = i / 8;
      c.fillStyle = k < 0.55 ? (i % 2 ? CREAM : '#ece1c6') : (i % 2 ? STONE : mix(STONE, INK, 0.12));
      c.fillRect(x0, s0, (2 * hw) / 9 + 0.5, s1 - s0);
    }
    // the head: a ledge, the arches, the crown
    c.fillStyle = CREAM; c.fillRect(cx - hw - 3, s0 - 3, 2 * hw + 6, 5);
    c.fillStyle = CREAM; c.fillRect(cx - hw, top + 4, 2 * hw, s0 - top - 4);
    c.fillStyle = STONE; c.fillRect(cx + hw * 0.25, top + 4, hw * 0.75, s0 - top - 4);
    c.fillStyle = GLASS; for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(cx + i * 9, top + 12, 3.2, Math.PI, 0); c.rect(cx + i * 9 - 3.2, top + 12, 6.4, 16); c.fill(); }
    c.fillStyle = CREAM; c.fillRect(cx - hw - 2, top, 2 * hw + 4, 5);
    c.fillStyle = STONE; c.fillRect(cx + hw * 0.3, top, hw * 0.7 + 2, 5);
    c.fillStyle = CREAM; for (let i = -2; i <= 2; i++) c.fillRect(cx + i * 9 - 2.5, top - 6, 5, 6);
  }, { t: 6.2, d: 1.3, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- downtown and the Pyramid
function downtown(p, r) {
  const blocks = [[1352, 46, 980], [1396, 40, 930], [1488, 58, 900], [1528, 48, 960], [1462, 36, 1010], [1342, 30, 1040]];
  const cols = blocks.map(() => r.pick([CREAM, STONE, '#e4d7b8', '#cbd5c8']));
  p.group('down', { x: 1320, y: 880, w: 240, h: 320 }, (c) => {
    for (const [i, [x, w, top]] of blocks.entries()) {
      const col = cols[i];
      c.fillStyle = col; c.fillRect(x - w / 2, top, w, 1200 - top);
      c.fillStyle = mix(col, INK, 0.25); c.fillRect(x + w * 0.18, top, w * 0.32, 1200 - top);
      c.fillStyle = mix(GLASS, col, 0.2);
      for (let y = top + 6; y < 1196; y += 6) c.fillRect(x - w / 2 + 3, y, w - 6, 2);
      c.fillStyle = mix(col, INK, 0.4); c.fillRect(x - w / 2 - 1, top - 3, w + 2, 4);
    }
  }, { t: 5.8, d: 1.0, reveal: 'rise' });

  // the Pyramid: a slender spire over a white tower, its two wings standing out
  const ax = 1440, apex = 512, base = 1200, hb = 74;
  const half = (y) => hb * (y - apex) / (base - apex);
  p.group('down', { x: ax - hb - 6, y: apex - 6, w: 2 * hb + 12, h: base - apex + 10 }, (c) => {
    const wing0 = 690, wing1 = 868, ww = half(wing1);
    // the wings first, so the faces sit over their inner edges
    c.fillStyle = CREAM; c.fillRect(ax - ww, wing0, ww * 0.5, wing1 - wing0);
    c.fillStyle = STONE; c.fillRect(ax + ww * 0.5, wing0, ww * 0.5, wing1 - wing0);
    // the faces, lit and shaded
    c.fillStyle = CREAM; poly(c, [[ax, apex], [ax, base], [ax - hb, base]]); c.fill();
    c.fillStyle = STONE; poly(c, [[ax, apex], [ax + hb, base], [ax, base]]); c.fill();
    // the windows, a line of them on every floor below the spire
    c.save(); poly(c, [[ax, apex], [ax + hb, base], [ax - hb, base]]); c.clip();
    for (let y = 618; y < base; y += 5.2) {
      const hw = half(y) - 3;
      c.fillStyle = 'rgba(42,67,74,.55)';
      for (let x = ax - hw; x < ax + hw - 1.5; x += 3.2) c.fillRect(x, y, 1.8, 2.4);
    }
    c.restore();
    // the wing tops and their small windows
    c.fillStyle = mix(STONE, INK, 0.3); c.fillRect(ax - ww, wing0 - 2, ww * 0.5, 3); c.fillRect(ax + ww * 0.5, wing0 - 2, ww * 0.5, 3);
    c.fillStyle = 'rgba(42,67,74,.5)';
    for (let y = wing0 + 6; y < wing1; y += 10) { c.fillRect(ax - ww + 3, y, 3, 5); c.fillRect(ax + ww - 6, y, 3, 5); }
    // the lantern at the very top
    c.fillStyle = mix(STONE, INK, 0.35); c.fillRect(ax - 1.6, apex + 18, 3.2, 40);
  }, { t: 6.6, d: 1.8, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- the bay: Alcatraz, the Palace, the Marina, boats
function bay(p, r) {
  // Alcatraz
  const ax = 1046, ay = 1040;
  const rock = [[ax - 66, ay + 6], [ax - 56, ay - 8], [ax - 30, ay - 16], [ax + 10, ay - 20], [ax + 46, ay - 14], [ax + 70, ay - 2], [ax + 78, ay + 6]];
  p.group('bay', { x: ax - 80, y: ay - 70, w: 170, h: 84 }, (c) => {
    c.fillStyle = GOLD_D; poly(c, rock); c.fill();
    c.fillStyle = GREEN; poly(c, [[ax - 56, ay - 8], [ax - 30, ay - 16], [ax - 10, ay - 14], [ax - 30, ay + 6], [ax - 62, ay + 6]]); c.fill();
    // the cellhouse, long and pale, its windows in rows
    c.fillStyle = CREAM; c.fillRect(ax - 30, ay - 34, 66, 18);
    c.fillStyle = STONE; c.fillRect(ax + 16, ay - 34, 20, 18);
    c.fillStyle = GLASS; for (let x = ax - 26; x < ax + 32; x += 5) { c.fillRect(x, ay - 30, 2, 4); c.fillRect(x, ay - 23, 2, 4); }
    // the lighthouse and the water tower
    c.fillStyle = CREAM; c.fillRect(ax - 44, ay - 58, 6, 44); c.fillStyle = INK; c.fillRect(ax - 46, ay - 62, 10, 5);
    c.fillStyle = STONE; c.fillRect(ax + 48, ay - 40, 14, 10); c.fillStyle = INK;
    c.fillRect(ax + 49, ay - 30, 1.5, 18); c.fillRect(ax + 59, ay - 30, 1.5, 18);
  }, { t: 6.0, d: 0.8, reveal: 'rise' });

  // the Palace of Fine Arts: a rotunda between two colonnades
  const px = 690, pb = 1082;
  p.group('bay', { x: px - 110, y: pb - 112, w: 220, h: 120 }, (c) => {
    c.fillStyle = CREAM;
    for (const sd of [-1, 1]) {
      c.fillRect(px + sd * 34 - (sd < 0 ? 66 : 0), pb - 36, 66, 6);
      for (let i = 0; i < 9; i++) c.fillRect(px + sd * (38 + i * 7.4) - 1.4, pb - 30, 2.8, 30);
    }
    // the drum and the dome
    c.fillStyle = CREAM; c.fillRect(px - 30, pb - 62, 60, 62);
    c.fillStyle = STONE; c.fillRect(px + 8, pb - 62, 22, 62);
    c.fillStyle = GLASS; for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(px + i * 11, pb - 40, 4, Math.PI, 0); c.rect(px + i * 11 - 4, pb - 40, 8, 32); c.fill(); }
    c.fillStyle = '#c0714a'; c.beginPath(); c.ellipse(px, pb - 62, 33, 38, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#9b5236'; c.beginPath(); c.ellipse(px, pb - 62, 33, 38, 0, Math.PI * 1.5, 0); c.lineTo(px, pb - 62); c.fill();
    c.fillStyle = CREAM; c.fillRect(px - 34, pb - 64, 68, 4); c.fillRect(px - 2, pb - 106, 4, 8);
  }, { t: 6.5, d: 1.0, reveal: 'rise' });

  // the yacht harbor: a forest of masts
  const masts = [];
  for (let i = 0; i < 48; i++) masts.push([r.range(780, 960), 1078 - r.range(0, 8), r.range(18, 36)]);
  masts.sort((a, b) => a[1] - b[1]);
  p.group('bay', { x: 770, y: 1030, w: 200, h: 60 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(772, 1078, 196, 4);
    for (const [x, y, h] of masts) {
      c.fillStyle = INK; c.fillRect(x, y - h, 1.2, h);
      c.fillStyle = CREAM; c.fillRect(x - 5, y - 3, 11, 3);
    }
  }, { t: 7.0, d: 0.8, reveal: 'rise' });

  // boats on the water
  const boats = [[760, 958, 0.55, 0], [890, 1002, 0.7, 1], [600, 930, 0.42, 0], [1190, 1066, 0.6, 2], [980, 952, 0.45, 0], [934, 1044, 0.56, 2]];
  boats.forEach(([x, y, s, kind], i) => p.group('bay', { x: x - 50 * s, y: y - 100 * s, w: 100 * s, h: 110 * s }, (c) => sailboat(c, x, y, s, kind), { t: 9.0 + i * 0.12, d: 0.6, reveal: 'rise' }));
  // two that sail on
  const live = [{ x: 820, y: 1048, s: 0.82, sp: 9, kind: 1 }, { x: 1180, y: 925, s: 0.5, sp: -6, kind: 0 }];
  p.live('bay', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const b of live) {
        const x = b.x + ((time * b.sp) % 260 + 260) % 260 - 130;
        sailboat(c, x, b.y + Math.sin(time * 1.4 + b.x) * 1.2, b.s, b.kind, b.sp < 0);
      }
    },
  });
}

// a flat-ink sailboat: a dark hull, two sails, one side of each in shade
function sailboat(c, x, y, s, kind = 0, flip = false) {
  const d = flip ? -1 : 1;
  c.fillStyle = 'rgba(33,53,59,.3)'; c.fillRect(x - 30 * s, y + 2 * s, 60 * s, 2.5 * s);
  c.fillStyle = INK; poly(c, [[x - 30 * s * d, y - 7 * s], [x + 34 * s * d, y - 7 * s], [x + 24 * s * d, y + 2 * s], [x - 22 * s * d, y + 2 * s]]); c.fill();
  const main = kind === 2 ? OR : CREAM;
  c.fillStyle = main; poly(c, [[x, y - 86 * s], [x, y - 11 * s], [x - 32 * s * d, y - 11 * s]]); c.fill();
  c.fillStyle = mix(main, INK, 0.2); poly(c, [[x, y - 86 * s], [x, y - 11 * s], [x - 12 * s * d, y - 11 * s]]); c.fill();
  c.fillStyle = kind === 1 ? GOLD_L : CREAM; poly(c, [[x + 3 * s * d, y - 72 * s], [x + 3 * s * d, y - 11 * s], [x + 30 * s * d, y - 11 * s]]); c.fill();
  c.fillStyle = INK; c.fillRect(x - 0.9 * s, y - 90 * s, 1.8 * s, 83 * s);
}

// ---------------------------------------------------------------- the city's hills
function hills(p, r) {
  // the middle hill, from the Marina up to the Heights
  const b = [...line(IX - 10, IR + 10, hillB, 6), [IR + 10, 1420], [IX - 10, 1420]];
  p.group('hillB', boxOf(b, 4), (c) => { c.fillStyle = '#c3c49a'; poly(c, b); c.fill(); }, { t: 5.6, d: 1.0, reveal: 'rise' });
  const rb = rows(r, hillB, { x0: IX - 10, x1: IR + 10, n: 7, s0: 0.3, s1: 0.5, lead: 14, step: 44, trees: 0.07, skip: (x0, x1, base) => onStreet(x0, x1, base) || (x1 > 600 && x0 < 790 && base < 1100) });
  rb.forEach((row, j) => p.group('hillB', { x: IX - 40, y: row.y - 20, w: IW + 80, h: row.yb - row.y + 30 }, (c) => drawRow(c, row), { t: 6.0 + j * 0.22, d: 0.8, reveal: 'rise' }));

  // the near hill
  const cc = [...line(IX - 10, IR + 10, hillC, 6), [IR + 10, IB + 10], [IX - 10, IB + 10]];
  p.group('hillC', boxOf(cc, 4), (c) => { c.fillStyle = '#aebc8c'; poly(c, cc); c.fill(); }, { t: 7.2, d: 1.0, reveal: 'rise' });
  const belt = [];
  for (let x = IX - 10; x < IR + 10; x += r.range(8, 16)) { const y = hillC(x) + r.range(-2, 10); if (!onStreet(x - 8, x + 8, y + 10)) belt.push([x, y, r.range(8, 15)]); }
  belt.sort((a, b) => a[1] - b[1]);
  p.group('hillC', { x: IX - 30, y: 1180, w: IW + 60, h: 160 }, (c) => { for (const [x, y, rr] of belt) bush(c, x, y, rr, GREEN, GREEN_D); }, { t: 7.6, d: 0.7, reveal: 'rise' });
  const rc = rows(r, hillC, { x0: IX - 10, x1: IR + 10, n: 8, s0: 0.54, s1: 1.16, lead: 16, step: 54, trees: 0.06, skip: (x0, x1, base) => onStreet(x0, x1, base) || (x1 < 800 && base > 1330) });
  rc.forEach((row, j) => p.group('housesC', { x: IX - 60, y: row.y - 30, w: IW + 120, h: row.yb - row.y + 40 }, (c) => drawRow(c, row), { t: 8.0 + j * 0.3, d: 0.8, reveal: 'rise' }));
}

// ---------------------------------------------------------------- the street and the cable cars
function street(p, r) {
  const ys = []; for (let y = ST_TOP; y <= IB + 10; y += 8) ys.push(y);
  const road = [...ys.map((y) => [stX(y) - stW(y), y]), ...ys.slice().reverse().map((y) => [stX(y) + stW(y), y])];
  // the crossings, where the street lies level for a moment
  const cross = [0.12, 0.3, 0.55, 0.86].map((f) => ST_TOP + (IB - ST_TOP) * f);
  p.group('street', boxOf(road, 30), (c) => {
    c.fillStyle = '#8f988f'; poly(c, road); c.fill();
    for (const y of cross) {
      const h = stW(y) * 0.32;
      c.fillStyle = '#b9b7a2'; c.fillRect(stX(y) - stW(y) - 30, y, 2 * stW(y) + 60, h);
      // the zebra
      c.fillStyle = CREAM;
      for (let k = -6; k <= 6; k++) c.fillRect(stX(y) + (k / 7) * stW(y) - stW(y) * 0.03, y + h * 0.15, stW(y) * 0.06, h * 0.7);
    }
    // the sidewalks
    c.fillStyle = STONE;
    c.beginPath(); ys.forEach((y, i) => (i ? c.lineTo(stX(y) - stW(y), y) : c.moveTo(stX(y) - stW(y), y)));
    ys.slice().reverse().forEach((y) => c.lineTo(stX(y) - stW(y) * 1.16, y)); c.fill();
    c.beginPath(); ys.forEach((y, i) => (i ? c.lineTo(stX(y) + stW(y), y) : c.moveTo(stX(y) + stW(y), y)));
    ys.slice().reverse().forEach((y) => c.lineTo(stX(y) + stW(y) * 1.16, y)); c.fill();
    // the rails and the cable slots, two tracks
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath();
    for (const lane of [-0.42, 0.42]) for (const off of [-0.17, 0, 0.17]) {
      ys.forEach((y, i) => { const x = stX(y) + (lane + off) * stW(y); i ? c.lineTo(x, y) : c.moveTo(x, y); });
    }
    c.stroke();
  }, { t: 7.8, d: 1.0, reveal: 'fall', ease: 'inOut' });

  // the cars: one climbing up toward us, one going down to the bay
  const cars = [{ lane: 0.42, sp: 1 / 30, ph: 0.2, up: true }, { lane: -0.42, sp: 1 / 30, ph: 0.1, up: false }];
  p.live('car', {
    t: 9.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const cr of cars) {
        let f = (cr.ph + (time - 9.2) * cr.sp) % 1; if (f < 0) f += 1;
        if (!cr.up) f = 1 - f;
        const y = ST_TOP + 10 + (IB + 120 - ST_TOP) * f ** 1.7;
        const s = stW(y) / 132;
        cableCar(c, stX(y) + cr.lane * stW(y), y, s * 0.92, time);
      }
    },
  });
}

// a cable car seen end on: red below, cream above, the roof lid and its bell
function cableCar(c, x, y, s, time) {
  const w = 104 * s;
  c.fillStyle = 'rgba(33,53,59,.32)'; c.fillRect(x - w * 0.56, y - 2 * s, w * 1.12, 5 * s);
  c.fillStyle = INK; c.fillRect(x - w * 0.36, y - 9 * s, w * 0.72, 9 * s);
  c.fillStyle = '#6c6a5f'; c.fillRect(x - w * 0.6, y - 15 * s, w * 1.2, 5 * s);
  // the lower body
  c.fillStyle = RED; c.fillRect(x - w / 2, y - 46 * s, w, 31 * s);
  c.fillStyle = shade(RED, 0.72); c.fillRect(x + w * 0.3, y - 46 * s, w * 0.2, 31 * s);
  c.fillStyle = GOLD_L; c.fillRect(x - w / 2, y - 26 * s, w, 2.4 * s);
  c.fillStyle = '#f6e6a0'; c.beginPath(); c.arc(x, y - 35 * s, 5.5 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = INK; c.beginPath(); c.arc(x, y - 35 * s, 2.4 * s, 0, Math.PI * 2); c.fill();
  // the cream upper with its windows
  c.fillStyle = CREAM; c.fillRect(x - w / 2, y - 90 * s, w, 44 * s);
  c.fillStyle = GLASS;
  for (let i = 0; i < 3; i++) c.fillRect(x - w / 2 + 6 * s + i * (w - 12 * s) / 3 + 2 * s, y - 84 * s, (w - 12 * s) / 3 - 4 * s, 30 * s);
  // the gripman, at the front
  c.fillStyle = TEAL; c.fillRect(x - 6 * s, y - 72 * s, 12 * s, 18 * s);
  c.fillStyle = '#e3b99b'; c.beginPath(); c.arc(x, y - 76 * s, 4.5 * s, 0, Math.PI * 2); c.fill();
  // the roof: a lid wider than the car, the sign board on its front
  c.fillStyle = INK; c.beginPath(); c.moveTo(x - w * 0.56, y - 90 * s);
  c.quadraticCurveTo(x, y - 116 * s, x + w * 0.56, y - 90 * s); c.closePath(); c.fill();
  c.fillStyle = CREAM; c.fillRect(x - w * 0.24, y - 104 * s, w * 0.48, 8 * s);
  c.fillStyle = GOLD; c.fillRect(x - 3 * s, y - 112 * s, 6 * s, 5 * s);
  // riders on the running boards, holding on
  for (const sd of [-1, 1]) {
    for (let k = 0; k < 2; k++) {
      const px = x + sd * (w * 0.5 + 4 * s), py = y - 16 * s - k * 0 ;
      c.fillStyle = k ? OR : TEAL; c.fillRect(px - 4 * s + k * sd * 3 * s, py - 30 * s - k * 6 * s, 8 * s, 30 * s);
      c.fillStyle = '#e3b99b'; c.beginPath(); c.arc(px + k * sd * 3 * s, py - 35 * s - k * 6 * s, 4 * s, 0, Math.PI * 2); c.fill();
    }
  }
  // the bell, rung now and then
  const ring = Math.sin(time * 9) > 0.96 ? 1.5 * s : 0;
  c.fillStyle = GOLD; c.beginPath(); c.arc(x + w * 0.3 + ring, y - 98 * s, 3 * s, Math.PI, 0); c.fill();
}

// ---------------------------------------------------------------- the painted ladies
const LADIES = [
  { body: '#7fa8b6', trim: CREAM, acc: OR_D, scale: '#e9c27e' },
  { body: '#e6c06a', trim: CREAM, acc: TEAL, scale: '#c9452b' },
  { body: '#98b893', trim: CREAM, acc: OR_D, scale: '#f1dcaa' },
  { body: '#e7a493', trim: CREAM, acc: TEAL, scale: '#7fa8b6' },
  { body: '#b9b6cf', trim: CREAM, acc: OR_D, scale: '#e6c06a' },
  { body: '#efe0b8', trim: TEAL, acc: OR, scale: '#98b893' },
  { body: '#6f9a95', trim: CREAM, acc: GOLD, scale: '#e7a493' },
];

function lady(c, L) {
  const { x, b, w, h } = L, P = L.pal;
  const gh = h * 0.27, eave = b - h + gh, baseH = h * 0.13, f1 = b - baseH, mid = lerp(eave, f1, 0.5);
  const shd = mix(P.body, INK, 0.3), lit = mix(P.body, '#fff8ea', 0.22);
  // the hip roof behind, seen past the gable
  c.fillStyle = '#56666a'; poly(c, [[x + w * 0.5, b - h - 2], [x + w + 3, eave - gh * 0.42], [x + w + 3, eave + 6], [x + w * 0.5, eave + 6]]); c.fill();
  c.fillStyle = '#43535a'; c.fillRect(x + w * 0.78, b - h + gh * 0.35, 9, 22); // a chimney
  // the body
  c.fillStyle = P.body; c.fillRect(x, eave, w, b - eave);
  // the raised basement and the garage
  c.fillStyle = shd; c.fillRect(x, f1, w, baseH);
  c.fillStyle = P.trim; c.fillRect(x + w * 0.06, f1 + baseH * 0.22, w * 0.48, baseH * 0.78);
  c.fillStyle = mix(P.trim, INK, 0.25); for (let k = 1; k < 4; k++) c.fillRect(x + w * 0.06, f1 + baseH * 0.22 + (baseH * 0.78 * k) / 4, w * 0.48, 1.2);
  // the bay: three sides, the middle lit, the right side in shade
  const bx = x + w * 0.05, bw = w * 0.56, sw = bw * 0.2;
  c.fillStyle = lit; c.fillRect(bx, eave - 2, sw, f1 - eave + 2);
  c.fillStyle = P.body; c.fillRect(bx + sw, eave - 2, bw - 2 * sw, f1 - eave + 2);
  c.fillStyle = shd; c.fillRect(bx + bw - sw, eave - 2, sw, f1 - eave + 2);
  // two floors of tall windows with their hoods
  for (const [y0, y1] of [[eave + (mid - eave) * 0.2, mid - (mid - eave) * 0.1], [mid + (f1 - mid) * 0.22, f1 - (f1 - mid) * 0.1]]) {
    const wins = [[bx + sw * 0.2, sw * 0.6], [bx + sw + (bw - 2 * sw) * 0.14, (bw - 2 * sw) * 0.72], [bx + bw - sw * 0.8, sw * 0.6]];
    for (const [wx, ww] of wins) {
      c.fillStyle = P.trim; c.fillRect(wx - 2, y0 - 2, ww + 4, y1 - y0 + 4);
      c.fillStyle = GLASS; c.fillRect(wx, y0, ww, y1 - y0);
      c.fillStyle = P.trim; c.fillRect(wx, y0 + (y1 - y0) * 0.42, ww, 1.6); // the sash
      // the hood: a little pediment in the accent
      c.fillStyle = P.acc; poly(c, [[wx - 4, y0 - 3], [wx + ww / 2, y0 - 9], [wx + ww + 4, y0 - 3]]); c.fill();
    }
    // the band under the sills, with its dentils
    c.fillStyle = P.trim; c.fillRect(x, y1 + 4, w, 3);
    c.fillStyle = P.acc; for (let xx = x + 2; xx < x + w - 2; xx += 4) c.fillRect(xx, y1 + 7, 2, 2);
  }
  // the door up its stair, under a porch hood on two posts
  const dx = x + w * 0.67, dw = w * 0.24;
  c.fillStyle = P.trim; c.fillRect(dx - 3, mid + (f1 - mid) * 0.1, dw + 6, f1 - mid - (f1 - mid) * 0.1);
  c.fillStyle = P.acc; c.fillRect(dx, mid + (f1 - mid) * 0.28, dw, f1 - mid - (f1 - mid) * 0.28);
  c.fillStyle = GLASS; c.fillRect(dx + 2, mid + (f1 - mid) * 0.16, dw - 4, (f1 - mid) * 0.1);
  c.fillStyle = P.trim; poly(c, [[dx - 7, mid + (f1 - mid) * 0.12], [dx + dw / 2, mid - 2], [dx + dw + 7, mid + (f1 - mid) * 0.12]]); c.fill();
  c.fillStyle = shd; c.fillRect(dx - 6, mid + (f1 - mid) * 0.12, 3, f1 - mid); c.fillRect(dx + dw + 3, mid + (f1 - mid) * 0.12, 3, f1 - mid);
  // the stair, down to the walk
  c.fillStyle = mix(P.trim, STONE, 0.5);
  for (let k = 0; k < 7; k++) { const yy = f1 + (baseH * k) / 7; c.fillRect(dx - 4 - k * 1.2, yy, dw + 8 + k * 2.4, baseH / 7 - 1); }
  // the upper window on the door side
  const uy0 = eave + (mid - eave) * 0.2, uy1 = mid - (mid - eave) * 0.1;
  c.fillStyle = P.trim; c.fillRect(dx - 2, uy0 - 2, dw + 4, uy1 - uy0 + 4);
  c.fillStyle = GLASS; c.fillRect(dx, uy0, dw, uy1 - uy0);
  c.fillStyle = P.acc; poly(c, [[dx - 4, uy0 - 3], [dx + dw / 2, uy0 - 10], [dx + dw + 4, uy0 - 3]]); c.fill();
  // the cornice on its brackets
  c.fillStyle = P.trim; c.fillRect(x - 5, eave - 6, w + 10, 7);
  c.fillStyle = P.acc; c.fillRect(x - 5, eave + 1, w + 10, 2.5);
  c.fillStyle = P.trim; for (let xx = x; xx <= x + w - 4; xx += 10) c.fillRect(xx, eave + 3, 4, 7);
  // the gable: fish-scale shingles, an arched window, a fan at the peak
  const gp = [[x - 6, eave - 5], [x + w / 2, b - h], [x + w + 6, eave - 5]];
  c.fillStyle = mix(P.body, P.trim, 0.25); poly(c, gp); c.fill();
  c.save(); poly(c, gp); c.clip();
  c.strokeStyle = mix(P.scale, P.body, 0.25); c.lineWidth = 1.4;
  for (let yy = eave - 9, row = 0; yy > b - h; yy -= 5, row++) {
    c.beginPath();
    for (let xx = x - 6 + (row % 2) * 3; xx < x + w + 6; xx += 6) { c.moveTo(xx + 3, yy); c.arc(xx, yy, 3, 0, Math.PI); }
    c.stroke();
  }
  c.fillStyle = shd; poly(c, [[x + w / 2, b - h], [x + w + 6, eave - 5], [x + w / 2, eave - 5]]); c.globalAlpha = 0.35; c.fill(); c.globalAlpha = 1;
  c.restore();
  const ax = x + w / 2, ay = eave - gh * 0.3;
  c.fillStyle = P.trim; c.beginPath(); c.arc(ax, ay - 8, 11, Math.PI, 0); c.rect(ax - 11, ay - 8, 22, 20); c.fill();
  c.fillStyle = GLASS; c.beginPath(); c.arc(ax, ay - 8, 8, Math.PI, 0); c.rect(ax - 8, ay - 8, 16, 17); c.fill();
  c.fillStyle = P.trim; c.fillRect(ax - 0.8, ay - 16, 1.6, 25);
  c.strokeStyle = P.trim; c.lineWidth = 1.2; c.beginPath();
  for (let k = 0; k <= 6; k++) { const a = Math.PI * (1 + k / 6); c.moveTo(ax, b - h + gh * 0.36); c.lineTo(ax + Math.cos(a) * 14, b - h + gh * 0.36 + Math.sin(a) * 10 * -(-1)); }
  c.stroke();
  // the bargeboards along the gable's edges and a finial
  c.strokeStyle = P.trim; c.lineWidth = 4; c.lineJoin = 'miter'; c.beginPath(); c.moveTo(gp[0][0], gp[0][1]); c.lineTo(gp[1][0], gp[1][1]); c.lineTo(gp[2][0], gp[2][1]); c.stroke();
  c.strokeStyle = P.acc; c.lineWidth = 1.4; c.beginPath(); c.moveTo(gp[0][0] + 3, gp[0][1] + 2); c.lineTo(gp[1][0], gp[1][1] + 5); c.lineTo(gp[2][0] - 3, gp[2][1] + 2); c.stroke();
  c.fillStyle = P.acc; c.fillRect(ax - 1.5, b - h - 14, 3, 14); c.beginPath(); c.arc(ax, b - h - 15, 3, 0, Math.PI * 2); c.fill();
  // corner boards, and the seam of shade where it meets its neighbor
  c.fillStyle = P.trim; c.fillRect(x, eave, 3, f1 - eave); c.fillRect(x + w - 3, eave, 3, f1 - eave);
  c.fillStyle = 'rgba(33,53,59,.35)'; c.fillRect(x + w - 1, eave, 2, b - eave);
}

function ladies(p, r) {
  const n = 7, w = 104, x0 = 76;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * w, b = 1532 - i * 9, h = 296 + (i % 2 ? 8 : 0);
    const L = { x, b, w, h, pal: LADIES[i] };
    p.group('ladies', { x: x - 10, y: b - h - 22, w: w + 22, h: h + 30 }, (c) => lady(c, L), { t: 8.6 + i * 0.2, d: 0.8, reveal: 'drop', dy: 36 });
  }
  // Steiner Street in front of them, and its curb
  const sx0 = IX - 10, sx1 = x0 + n * w + 20;
  const sy = (x) => 1534 - ((x - x0) / w) * 9 + 2;
  const carCols = [140, 330, 560].map(() => r.pick([TEAL, OR_D, GOLD_D, INK]));
  p.group('ladies', { x: sx0, y: 1460, w: sx1 - sx0, h: 110 }, (c) => {
    c.fillStyle = STONE; poly(c, [...line(sx0, sx1, sy, 10), ...line(sx0, sx1, (x) => sy(x) + 10, 10).reverse()]); c.fill();
    c.fillStyle = '#8f988f'; poly(c, [...line(sx0, sx1, (x) => sy(x) + 10, 10), ...line(sx0, sx1, (x) => sy(x) + 30, 10).reverse()]); c.fill();
    // a few parked cars
    for (const [i, cx] of [140, 330, 560].entries()) {
      const y = sy(cx) + 26;
      c.fillStyle = carCols[i];
      c.beginPath(); c.moveTo(cx - 30, y); c.lineTo(cx - 30, y - 10); c.lineTo(cx - 16, y - 12); c.lineTo(cx - 8, y - 22); c.lineTo(cx + 14, y - 22); c.lineTo(cx + 24, y - 12); c.lineTo(cx + 32, y - 10); c.lineTo(cx + 32, y); c.fill();
      c.fillStyle = GLASS; c.fillRect(cx - 5, y - 19, 8, 6); c.fillRect(cx + 6, y - 19, 8, 6);
      c.fillStyle = INK; c.beginPath(); c.arc(cx - 18, y, 5, 0, Math.PI * 2); c.arc(cx + 20, y, 5, 0, Math.PI * 2); c.fill();
    }
  }, { t: 10.0, d: 0.7, reveal: 'wipe' });
}

// ---------------------------------------------------------------- the park in front
function front(p, r) {
  const lawn = [[IX - 10, 1556], [200, 1552], [420, 1560], [620, 1576], [800, 1598], [880, IB + 10], [IX - 10, IB + 10]];
  p.group('front', boxOf(lawn, 4), (c) => {
    c.fillStyle = GREEN_L; poly(c, lawn); c.fill();
    c.save(); poly(c, lawn); c.clip();
    c.fillStyle = mix(GREEN_L, GREEN, 0.5);
    for (let x = IX - 40; x < 900; x += 56) poly(c, [[x, IB + 10], [x + 28, IB + 10], [x + 60, 1540], [x + 40, 1540]]), c.fill();
    c.restore();
  }, { t: 10.2, d: 0.7, reveal: 'wipe' });
  // people on the grass: a picnic, a reader, a dog, a walker
  p.group('front', { x: IX, y: 1520, w: 800, h: 90 }, (c) => {
    const pp = (x, y, col, sit) => {
      c.fillStyle = col;
      if (sit) { c.fillRect(x - 5, y - 12, 10, 12); c.fillRect(x - 5, y - 4, 16, 4); }
      else { c.fillRect(x - 4, y - 22, 8, 16); c.fillRect(x - 3, y - 6, 2.5, 6); c.fillRect(x + 0.5, y - 6, 2.5, 6); }
      c.fillStyle = '#e3b99b'; c.beginPath(); c.arc(x, sit ? y - 16 : y - 26, 4, 0, Math.PI * 2); c.fill();
    };
    c.fillStyle = OR; c.fillRect(196, 1580, 40, 10); c.fillStyle = CREAM; for (let k = 0; k < 4; k++) c.fillRect(200 + k * 10, 1580, 4, 10);
    pp(194, 1588, TEAL, true); pp(240, 1588, GOLD_D, true);
    pp(420, 1586, INK, true);
    pp(560, 1600, OR_D, false); pp(578, 1601, TEAL, false);
    c.fillStyle = INK; c.fillRect(600, 1594, 14, 5); c.fillRect(612, 1590, 4, 5); c.fillRect(601, 1599, 2, 4); c.fillRect(611, 1599, 2, 4);
    pp(110, 1584, GOLD_L, false);
    bush(c, 330, 1574, 16); bush(c, 700, 1590, 20); bush(c, 90, 1570, 12);
  }, { t: 10.5, d: 0.6, reveal: 'pop' });

  // gulls wheeling over the bay
  const gulls = [];
  for (let i = 0; i < 7; i++) gulls.push({ cx: r.range(300, 1300), cy: r.range(880, 1000), R: r.range(30, 90), sp: r.range(0.2, 0.4) * (i % 2 ? 1 : -1), ph: r() * 6, s: r.range(0.7, 1.1) });
  p.live('front', {
    t: 10.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = CREAM; c.lineCap = 'round';
      for (const g of gulls) {
        const a = g.ph + time * g.sp, x = g.cx + Math.cos(a) * g.R, y = g.cy + Math.sin(a) * g.R * 0.35;
        const fl = Math.sin(time * 6 + g.ph) * 2.5 * g.s, w = 9 * g.s;
        c.lineWidth = 2.2 * g.s; c.beginPath();
        c.moveTo(x - w, y - 2 - fl); c.quadraticCurveTo(x - w * 0.4, y - 5, x, y); c.quadraticCurveTo(x + w * 0.4, y - 5, x + w, y - 2 - fl); c.stroke();
      }
    },
  });
}

// ---------------------------------------------------------------- title and frame
function frame(p) {
  const rect = [[IX, IY], [IR, IY], [IR, IB], [IX, IB], [IX, IY]];
  p.pen('frame', rect, INK, 3, { t: 0.1, d: 1.4, cap: 'square' });
}

function title(p) {
  const y0 = 1630, y1 = 1858;
  p.group('title', { x: IX, y: y0, w: IW, h: y1 - y0 }, (c) => {
    c.fillStyle = TEAL; c.fillRect(IX, y0, IW, y1 - y0);
    c.fillStyle = OR; c.fillRect(IX, y0 + 10, IW, 5); c.fillRect(IX, y1 - 15, IW, 5);
  }, { t: 10.7, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  p.type('title', 'SAN FRANCISCO', W / 2, 1826, { family: '"Big Shoulders Display", sans-serif', weight: 900, size: 228, color: CREAM, shadow: OR_D, sx: 6, sy: 6, align: 'center', track: 0.035, fit: 1340, t: 11.1, gap: 0.1, d: 0.6 });
  p.type('title', 'CITY BY THE BAY', IX, 1916, { family: '"Big Shoulders Display", sans-serif', weight: 700, size: 46, color: TEAL, track: 0.28, t: 12.5, gap: 0.035, d: 0.5, reveal: 'fade' });
  p.type('title', 'CALIFORNIA', IR, 1916, { family: '"Big Shoulders Display", sans-serif', weight: 700, size: 46, color: OR, track: 0.28, align: 'right', t: 12.7, gap: 0.035, d: 0.5, reveal: 'fade' });
  // three small diamonds between them
  p.group('title', { x: W / 2 - 50, y: 1884, w: 100, h: 40 }, (c) => {
    [[-34, TEAL], [0, OR], [34, TEAL]].forEach(([dx, col]) => { c.fillStyle = col; poly(c, [[W / 2 + dx, 1890], [W / 2 + dx + 9, 1902], [W / 2 + dx, 1914], [W / 2 + dx - 9, 1902]]); c.fill(); });
  }, { t: 13.0, d: 0.6, reveal: 'rise' });
}
