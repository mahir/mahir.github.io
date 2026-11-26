// Honolulu: a 1950s steamship menu cover, screen-printed in a few flat inks.
// Diamond Head's ribbed ridge over the curve of Waikīkī, the pink hotel among
// the palms, the Aloha Tower far off by the harbor, an outrigger canoe and
// surfers on long rolling swells, and in front a great wave with a rider on
// its face. Coconut palms lean in from the left, hibiscus and monstera fill
// the corner. The name runs across the sky in bamboo letters.

import { Plate, W, H } from '../print.js';
import { mix, shade, poly, rng } from '../kit.js';

// the inks
const PAPER = '#f6ecd4', NAVY = '#1c2b3f', TEAL = '#0f5c69', TEAL_M = '#1b8a8f', TURQ = '#38b9b2', TURQ_L = '#8fdcd0', FOAM = '#fbf6e8';
const SKY = '#7fcfd2', SKY_L = '#d9efe2', CORAL = '#f2694c', PINK = '#ee5d84', PINK_L = '#f7a9b5', GOLD = '#f6b93b', SAND = '#f2d49a', SAND_D = '#d9ae6a';
const LAV = '#9b98c8', LAV_D = '#7774a8', DH = '#86a35c', DH_D = '#55753f', DH_S = '#6b5f8e', GREEN = '#2f7a46', GREEN_D = '#1d5434', LEAF = '#5aa556', TRUNK = '#8a6038', TRUNK_D = '#5e3f26', RED = '#d6293a';

export const city = {
  id: 'honolulu', name: 'Honolulu', wall: '#103c45',
  alt: "A 1950s menu-cover print of Waikīkī: Diamond Head's ribbed ridge over the beach and its pink hotel among palms, the Aloha Tower far off by the harbor, an outrigger canoe, a catamaran and surfers on rolling swells, a rider on the face of a great wave in front, coconut palms leaning in from the left and hibiscus and monstera in the corner, under the title HONOLULU",
  google: 'family=Hanalei+Fill',
  fonts: [['400 230px "Hanalei Fill"', 'HONOLULU'], ['400 46px "Hanalei Fill"', 'WAIKĪKĪ·DIAMOND HEAD ALOHA']],
  build,
};

const FACE = '"Hanalei Fill", serif';
const HZ = 1010; // the horizon behind Waikīkī
const BEACH = 1086; // the waterline at the beach

function build() {
  const p = new Plate({ paper: PAPER, seed: 1959 });
  const r = p.r;
  p.stack('sky', 'clouds', 'hills', 'head', 'shore', 'sea', 'swell', 'wave', 'rider', 'palms', 'flowers', 'title');
  sky(p, r);
  clouds(p, r);
  hills(p, r);
  diamondHead(p, r);
  shore(p, r);
  sea(p, r);
  bigWave(p, r);
  palms(p, r);
  flowers(p, r);
  life(p, r);
  title(p, r);
  return p;
}

// halftone dots, the printer's way of fading an ink: radius from a function
function dots(x0, y0, x1, y1, step, radAt) {
  const out = [];
  for (let y = y0, k = 0; y < y1; y += step * 0.87, k++) for (let x = x0 + (k % 2) * step / 2; x < x1; x += step) { const rr = radAt(x, y); if (rr > 0.4) out.push([x, y, rr]); }
  return out;
}
function fillDots(c, list) { c.beginPath(); for (const [x, y, rr] of list) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); } c.fill(); }

// ================================================================ the sky
function sky(p, r) {
  p.group('sky', { x: 0, y: 0, w: W, h: HZ + 10 }, (c) => {
    c.fillStyle = SKY; c.fillRect(0, 0, W, HZ + 10);
    c.fillStyle = SKY_L; c.fillRect(0, 640, W, HZ + 10 - 640);
  }, { t: 0.2, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // the pale band at the horizon fades into the blue in a halftone screen
  const ht = dots(0, 520, W, 650, 14, (x, y) => 6.6 * (1 - (y - 520) / 130));
  p.group('sky', { x: 0, y: 500, w: W, h: 160 }, (c) => { c.fillStyle = SKY; fillDots(c, ht); }, { t: 0.9, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // and a soft sun, high and white
  p.group('sky', { x: 1100, y: 300, w: 300, h: 300 }, (c) => {
    c.fillStyle = '#fdf3c4'; c.beginPath(); c.arc(1250, 450, 120, 0, Math.PI * 2); c.fill();
    c.fillStyle = GOLD; fillDots(c, dots(1130, 330, 1370, 570, 12, (x, y) => { const d = Math.hypot(x - 1250, y - 450); return d < 118 ? 4.6 * Math.max(0, (d - 40) / 78) : 0; }));
  }, { t: 1.4, d: 0.8, reveal: 'pop' });
}
// trade-wind clouds: flat-footed heaps in two inks, the foot shaded with lines
const CLOUDS = [[260, 470, 380, 120], [880, 560, 300, 80], [1380, 640, 260, 70], [560, 680, 220, 50]];
function cloudShape(cl, rr) {
  const [x, y, w, h] = cl, puffs = [], n = Math.max(3, Math.round(w / (h * 0.8)));
  for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; puffs.push([x - w / 2 + t * w, y - Math.sin(t * Math.PI) * h * 0.5 - rr.range(0, h * 0.15), (w / n) * rr.range(0.62, 0.8) * (0.8 + 0.4 * Math.sin(t * Math.PI))]); }
  return puffs;
}
function drawCloud(c, cl, puffs, dx = 0) {
  const [x, y, w] = cl;
  c.fillStyle = '#fffaf0';
  c.beginPath(); for (const [px, py, pr] of puffs) { c.moveTo(px + dx + pr, py); c.arc(px + dx, py, pr, 0, Math.PI * 2); } c.fill();
  c.fillRect(x - w / 2 - 20 + dx, y - 10, w + 40, 12);
  c.fillStyle = TURQ_L; c.fillRect(x - w / 2 - 20 + dx, y - 2, w + 40, 4);
  c.fillRect(x - w / 2 + 10 + dx, y + 6, w - 20, 3);
}
function clouds(p, r) {
  CLOUDS.forEach((cl, i) => {
    const puffs = cloudShape(cl, rng(90 + i));
    cl.puffs = puffs;
    if (i === 1 || i === 2) return; // these two drift: drawn live
    const [x, y, w, h] = cl;
    p.group('clouds', { x: x - w / 2 - 40, y: y - h * 1.4, w: w + 80, h: h * 1.4 + 30 }, (c) => drawCloud(c, cl, puffs), { t: 1.3 + i * 0.25, d: 0.8, reveal: 'pop' });
  });
}

// ================================================================ the mountains and Diamond Head
function ridge(rr, x0, x1, base, peakAt, n) {
  const pts = [[x0, base]];
  for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; pts.push([x, peakAt(x) + rr.range(-6, 6)]); }
  pts.push([x1, base]);
  return pts;
}
function hills(p, r) {
  // the Ko'olau range, far and violet, cut by deep valleys
  const rr = rng(5);
  const far = ridge(rr, 0, 820, HZ, (x) => 760 + 60 * Math.sin(x / 90) + 40 * Math.sin(x / 31) + (x / 820) * 90, 80);
  const near = ridge(rr, 0, 700, HZ, (x) => 860 + 40 * Math.sin(x / 70 + 1) + 20 * Math.sin(x / 23) + (x / 700) * 50, 70);
  const ht = dots(0, 740, 820, HZ, 10, (x, y) => 3.6 * Math.min(1, (y - 760) / 200));
  p.group('hills', { x: 0, y: 680, w: 840, h: HZ - 670 }, (c) => {
    c.fillStyle = LAV; poly(c, far); c.fill();
    c.save(); poly(c, far); c.clip(); c.fillStyle = LAV_D; fillDots(c, ht); c.restore();
  }, { t: 2.0, d: 1.0, reveal: 'rise', ease: 'out' });
  p.group('hills', { x: 0, y: 800, w: 720, h: HZ - 790 }, (c) => {
    c.fillStyle = '#6f8f86'; poly(c, near); c.fill();
  }, { t: 2.4, d: 0.8, reveal: 'rise', ease: 'out' });
}
// Diamond Head from Waikīkī: a long slope up from the left, the rim's high
// point, and a steep fall to the sea, its flanks scored by ribs of rock
const DH_PROFILE = [[640, HZ], [720, 968], [820, 930], [920, 895], [1000, 862], [1060, 832], [1100, 806], [1130, 796], [1160, 800], [1190, 790], [1220, 796], [1250, 786], [1280, 780], [1310, 770], [1340, 744], [1365, 726], [1385, 722], [1400, 736], [1420, 776], [1450, 818], [1490, 860], [1530, 898], [1570, 930], [1600, 944], [1600, HZ]];
function dhTop(x) {
  for (let i = 1; i < DH_PROFILE.length; i++) {
    const [x0, y0] = DH_PROFILE[i - 1], [x1, y1] = DH_PROFILE[i];
    if (x <= x1 && x1 > x0) return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
  }
  return HZ;
}
function diamondHead(p, r) {
  p.group('head', { x: 630, y: 650, w: 980, h: HZ - 640 }, (c) => {
    c.fillStyle = DH; poly(c, DH_PROFILE); c.fill();
    // the shaded right-hand flanks
    c.save(); poly(c, DH_PROFILE); c.clip();
    c.fillStyle = DH_S; poly(c, [[1385, 722], [1420, 776], [1490, 860], [1570, 930], [1600, 944], [1600, HZ], [1420, HZ], [1400, 840]]); c.fill();
    // the crater's rim catches the light along its top
    c.fillStyle = '#a9c072'; poly(c, [[1100, 806], [1130, 796], [1160, 800], [1190, 790], [1220, 796], [1250, 786], [1280, 780], [1310, 770], [1340, 744], [1365, 726], [1385, 722], [1360, 760], [1300, 800], [1200, 816], [1110, 822]]); c.fill();
    c.fillStyle = DH_D; poly(c, [[640, HZ], [800, 960], [1000, 930], [1200, 960], [1400, 980], [1600, 990], [1600, HZ]]); c.fill();
    c.restore();
  }, { t: 2.6, d: 1.2, reveal: 'rise', ease: 'out' });
  // the ribs: gullies run straight down the slopes, dark on the light, light on the dark
  const ribs = [], ribsL = [];
  for (let x = 700; x < 1600; x += r.range(14, 24)) {
    const y0 = dhTop(x) + 4, L = r.range(40, 120) * (x > 1380 ? 1.3 : 0.8), lean = x < 1385 ? -0.15 : 0.12;
    const line = [[x, y0], [x + lean * L * 0.5 + r.range(-3, 3), y0 + L * 0.5], [x + lean * L, Math.min(HZ - 4, y0 + L)]];
    (x > 1395 ? ribsL : ribs).push(line);
  }
  p.strokes('head', ribs, DH_D, 3, { t: 3.3, d: 1.0, reveal: 'fall', ease: 'inOut', box: { x: 640, y: 640, w: 980, h: HZ - 630 } });
  p.strokes('head', ribsL, '#a9a0c8', 2.6, { t: 3.5, d: 1.0, reveal: 'fall', ease: 'inOut', box: { x: 640, y: 640, w: 980, h: HZ - 630 } });
  // the rim's key line, printed a hair off register
  p.pen('head', DH_PROFILE.slice(1, -1).map(([x, y]) => [x + 3, y + 2]), NAVY, 2.6, { t: 3.0, d: 1.4 });
  // the lighthouse at the foot, white with a red cap
  p.group('head', { x: 1520, y: 940, w: 40, h: 76 }, (c) => {
    c.fillStyle = FOAM; poly(c, [[1532, HZ], [1536, 960], [1548, 960], [1552, HZ]]); c.fill();
    c.fillStyle = RED; c.fillRect(1534, 950, 16, 10);
    c.fillStyle = NAVY; c.fillRect(1537, 970, 3, 4);
  }, { t: 4.0, d: 0.6, reveal: 'rise' });
}

// ================================================================ Waikīkī
function palmlet(c, x, y, h, lean, col) {
  // a small coconut palm for the shore: a curved trunk and a star of fronds
  const tx = x + lean * h, ty = y - h;
  c.strokeStyle = TRUNK_D; c.lineWidth = Math.max(1.5, h * 0.05); c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + lean * h * 0.2, y - h * 0.6, tx, ty); c.stroke();
  c.strokeStyle = col; c.lineWidth = Math.max(1.6, h * 0.06);
  c.beginPath();
  for (let k = 0; k < 7; k++) { const a = Math.PI * (1.05 + (k / 6) * 0.9), L = h * 0.42; c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - h * 0.05, tx + Math.cos(a) * L, ty + Math.sin(a) * L * 0.5 + h * 0.12); }
  c.stroke();
}
function shore(p, r) {
  // the far shore, the harbor and its tower, the beach's curve
  p.group('shore', { x: 0, y: HZ - 20, w: W, h: BEACH - HZ + 30 }, (c) => {
    c.fillStyle = GREEN_D; poly(c, [[0, HZ - 6], [700, HZ - 10], [1000, HZ + 6], [1600, HZ + 4], [1600, BEACH], [0, BEACH]]); c.fill();
    c.fillStyle = SAND; poly(c, [[0, BEACH - 18], [400, BEACH - 22], [900, BEACH - 14], [1300, BEACH - 6], [1600, BEACH + 4], [1600, BEACH + 12], [0, BEACH + 4]]); c.fill();
    c.fillStyle = SAND_D; poly(c, [[0, BEACH], [1600, BEACH + 8], [1600, BEACH + 14], [0, BEACH + 6]]); c.fill();
  }, { t: 4.0, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // the Aloha Tower by the harbor: a slim white tower with a clock and a pyramid roof
  p.group('shore', { x: 80, y: 820, w: 80, h: 200 }, (c) => {
    const x = 120;
    c.fillStyle = FOAM; c.fillRect(x - 14, 880, 28, 130);
    c.fillStyle = '#d9d2bf'; c.fillRect(x + 4, 880, 10, 130);
    c.fillStyle = FOAM; c.fillRect(x - 18, 870, 36, 12);
    c.fillStyle = '#5a9a9a'; poly(c, [[x - 16, 870], [x, 836], [x + 16, 870]]); c.fill();
    c.strokeStyle = NAVY; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, 836); c.lineTo(x, 822); c.stroke();
    c.fillStyle = NAVY; c.beginPath(); c.arc(x, 894, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = FOAM; c.beginPath(); c.arc(x, 894, 5, 0, Math.PI * 2); c.fill();
    c.fillStyle = NAVY; for (let y = 914; y < 1000; y += 14) c.fillRect(x - 6, y, 4, 7);
    // a liner at the pier beside it
    c.fillStyle = FOAM; poly(c, [[x + 24, 1004], [x + 150, 1004], [x + 140, 1016], [x + 30, 1016]]); c.fill();
    c.fillRect(x + 44, 990, 80, 14); c.fillStyle = CORAL; c.fillRect(x + 64, 976, 12, 14); c.fillRect(x + 90, 976, 12, 14);
  }, { t: 4.4, d: 0.8, reveal: 'rise' });
  // the hotels along the sand: the pink one with its towers, a white one with a long veranda, a few low ones
  const hotels = [[830, 210, 96, PINK_L, true, 4.6], [620, 150, 70, FOAM, false, 4.8], [1040, 90, 52, '#f0e2c0', false, 5.0], [470, 120, 58, '#e9d9b4', false, 5.1]];
  for (const [x, w, h, col, pink, t] of hotels) {
    const base = BEACH - 18;
    p.group('shore', { x: x - w / 2 - 10, y: base - h - 60, w: w + 20, h: h + 64 }, (c) => {
      c.fillStyle = col; c.fillRect(x - w / 2, base - h, w, h);
      c.fillStyle = pink ? '#d9738a' : 'rgba(28,43,63,.6)';
      for (let y = base - h + 12; y < base - 10; y += 16) for (let xx = x - w / 2 + 8; xx < x + w / 2 - 8; xx += 13) c.fillRect(xx, y, 6, 8);
      if (pink) {
        // the Moorish towers and their cupolas
        for (const tx of [x - 30, x, x + 30]) { const th = tx === x ? 54 : 34; c.fillStyle = PINK_L; c.fillRect(tx - 9, base - h - th, 18, th); c.fillStyle = PINK; c.beginPath(); c.ellipse(tx, base - h - th, 10, 12, 0, Math.PI, 0); c.fill(); c.fillStyle = '#d9738a'; c.fillRect(tx - 3, base - h - th + 10, 6, 10); }
        c.fillStyle = PINK; c.fillRect(x - w / 2, base - h, w, 5);
      } else { c.fillStyle = '#c9b48a'; c.fillRect(x - w / 2 - 4, base - h - 4, w + 8, 5); }
    }, { t, d: 0.7, reveal: 'rise', ease: 'out' });
  }
  // palms all along the shore, and striped umbrellas on the sand
  const pl = [];
  for (let x = 40; x < 1600; x += r.range(28, 70)) if (!(x > 700 && x < 950)) pl.push([x, BEACH - 16 + r.range(-4, 4), r.range(40, 86), r.range(-0.25, 0.2), r.pick([GREEN, LEAF, GREEN_D])]);
  pl.push([705, BEACH - 18, 120, 0.1, GREEN], [955, BEACH - 18, 130, -0.15, LEAF]);
  for (let k = 0; k < 2; k++) {
    const part = pl.filter((_, i) => i % 2 === k);
    p.group('shore', { x: 0, y: HZ - 140, w: W, h: BEACH - HZ + 150 }, (c) => { for (const [x, y, h, l, col] of part) palmlet(c, x, y, h, l, col); }, { t: 5.2 + k * 0.3, d: 0.8, reveal: 'rise', ease: 'out' });
  }
  const um = [];
  for (let i = 0; i < 24; i++) um.push([r.range(60, 1500), BEACH - r.range(4, 14), r.pick([CORAL, GOLD, PINK, TEAL_M, RED])]);
  p.group('shore', { x: 0, y: BEACH - 40, w: W, h: 50 }, (c) => {
    for (const [x, y, col] of um) {
      c.strokeStyle = NAVY; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 16); c.stroke();
      c.fillStyle = col; c.beginPath(); c.moveTo(x - 12, y - 14); c.quadraticCurveTo(x, y - 26, x + 12, y - 14); c.closePath(); c.fill();
      c.fillStyle = FOAM; c.beginPath(); c.moveTo(x - 3, y - 15); c.quadraticCurveTo(x, y - 25, x + 3, y - 15); c.closePath(); c.fill();
    }
  }, { t: 5.9, d: 0.6, reveal: 'fade' });
}

// ================================================================ the sea
function sea(p, r) {
  const y0 = BEACH + 6, y1 = H;
  p.group('sea', { x: 0, y: y0, w: W, h: y1 - y0 }, (c) => {
    c.fillStyle = TURQ_L; c.fillRect(0, y0, W, 70);
    c.fillStyle = TURQ; c.fillRect(0, y0 + 70, W, 260);
    c.fillStyle = TEAL_M; c.fillRect(0, y0 + 330, W, y1 - y0 - 330);
    // the reef's shallows shown through the water as a halftone
    c.fillStyle = TURQ; fillDots(c, REEF);
    c.fillStyle = TEAL_M; fillDots(c, DEEP);
  }, { t: 4.2, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // long rolling swells: white lines of surf, in rows down to the front
  const rows = [];
  for (let k = 0; k < 9; k++) {
    const y = BEACH + 40 + k * k * 6 + k * 22;
    const segs = [];
    for (let x = r.range(-60, 40); x < W; x += r.range(160, 320)) { const L = r.range(90, 240) * (1 + k * 0.12); segs.push([[x, y + r.range(-3, 3)], [x + L * 0.5, y - 3 - k * 0.4], [x + L, y + 1]]); }
    rows.push(segs);
  }
  rows.forEach((segs, k) => {
    p.strokes('swell', segs, FOAM, 2.5 + k * 0.45, { t: 5.0 + k * 0.16, d: 0.8, reveal: k % 2 ? 'wipeL' : 'wipe', ease: 'inOut', box: { x: -80, y: BEACH + 20, w: W + 160, h: 820 } });
  });
  // the outrigger canoe with six paddlers, and a catamaran under a striped sail
  canoe(p, 560, 1300, 1.25, 6.4);
  catamaran(p, 1180, 1210, 0.9, 6.8);
  // surfers on the small waves, standing on long boards
  const sf = [[360, 1166, 0.55, 1], [880, 1190, 0.6, -1], [1420, 1252, 0.75, 1]];
  p.group('swell', { x: 300, y: 1100, w: 1220, h: 180 }, (c) => { for (const [x, y, s, d] of sf) surfer(c, x, y, s, d, CORAL); }, { t: 7.2, d: 0.6, reveal: 'fade' });
}
const REEF = dots(0, BEACH + 70, W, BEACH + 330, 13, (x, y) => 5 * Math.max(0, 1 - (y - BEACH - 70) / 110) * (0.6 + 0.4 * Math.sin(x / 120)));
const DEEP = dots(0, BEACH + 250, W, BEACH + 340, 13, (x, y) => 5.5 * Math.max(0, (y - BEACH - 250) / 80));
function surfer(c, x, y, s, d, trunks) {
  c.save(); c.translate(x, y); c.scale(s * d, s);
  // the board, long and cream, with a red stripe
  c.fillStyle = FOAM; c.beginPath(); c.ellipse(0, 0, 70, 7, -0.05, 0, Math.PI * 2); c.fill();
  c.fillStyle = RED; c.fillRect(-60, -1, 120, 2);
  // the rider: knees bent, arms out
  c.strokeStyle = '#8a4a2e'; c.lineWidth = 8; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-14, -4); c.lineTo(-6, -26); c.lineTo(-2, -48); c.moveTo(14, -4); c.lineTo(10, -26); c.lineTo(-2, -48); c.stroke();
  c.fillStyle = trunks; c.fillRect(-12, -56, 20, 14);
  c.beginPath(); c.moveTo(-2, -54); c.lineTo(2, -86); c.stroke();
  c.lineWidth = 6; c.beginPath(); c.moveTo(-34, -70); c.lineTo(0, -82); c.lineTo(34, -76); c.stroke();
  c.fillStyle = '#8a4a2e'; c.beginPath(); c.arc(4, -96, 10, 0, Math.PI * 2); c.fill();
  c.fillStyle = NAVY; c.beginPath(); c.arc(4, -99, 10, Math.PI * 1.05, Math.PI * 1.95); c.fill();
  c.restore();
}
function canoe(p, x, y, s, t) {
  p.group('swell', { x: x - 230 * s, y: y - 110 * s, w: 460 * s, h: 170 * s }, (c) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    // the float on its booms
    c.strokeStyle = TRUNK_D; c.lineWidth = 5;
    for (const bx of [-80, 60]) { c.beginPath(); c.moveTo(bx, -12); c.quadraticCurveTo(bx + 10, 10, bx + 16, 34); c.stroke(); }
    c.fillStyle = TRUNK; c.beginPath(); c.ellipse(-10, 36, 140, 7, 0, 0, Math.PI * 2); c.fill();
    // the hull: long, dark red, its prow raised
    c.fillStyle = '#7a2a24'; c.beginPath(); c.moveTo(-200, -26); c.quadraticCurveTo(-170, 4, -120, 6); c.lineTo(150, 6); c.quadraticCurveTo(196, 2, 210, -30); c.lineTo(190, -14); c.lineTo(-180, -12); c.closePath(); c.fill();
    c.fillStyle = GOLD; c.fillRect(-170, -14, 350, 4);
    // the paddlers, each with a paddle in the water
    for (let k = 0; k < 6; k++) {
      const px = -140 + k * 56, ph = (k % 2) * 0.25;
      c.fillStyle = '#8a4a2e'; c.fillRect(px - 6, -46, 12, 34);
      c.fillStyle = [CORAL, GOLD, PINK, CORAL, GOLD, PINK][k]; c.fillRect(px - 7, -26, 14, 14);
      c.beginPath(); c.arc(px, -54, 8, 0, Math.PI * 2); c.fillStyle = '#8a4a2e'; c.fill();
      c.fillStyle = NAVY; c.beginPath(); c.arc(px, -57, 8, Math.PI, 0); c.fill();
      c.strokeStyle = TRUNK_D; c.lineWidth = 4; c.beginPath(); c.moveTo(px + 6, -60 - ph * 20); c.lineTo(px + 34, 18); c.stroke();
      c.fillStyle = TRUNK_D; c.beginPath(); c.ellipse(px + 36, 22, 5, 12, -0.4, 0, Math.PI * 2); c.fill();
    }
    // its wake
    c.strokeStyle = FOAM; c.lineWidth = 3; c.beginPath(); c.moveTo(-220, 8); c.lineTo(-330, 20); c.moveTo(-210, 18); c.lineTo(-300, 34); c.stroke();
    c.restore();
  }, { t, d: 1.0, reveal: 'slide', dx: 160 });
}
function catamaran(p, x, y, s, t) {
  p.group('swell', { x: x - 140 * s, y: y - 300 * s, w: 280 * s, h: 330 * s }, (c) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = FOAM; poly(c, [[-110, -10], [110, -10], [96, 6], [-96, 6]]); c.fill();
    c.fillStyle = NAVY; c.fillRect(-90, -20, 180, 10);
    c.strokeStyle = NAVY; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -20); c.lineTo(0, -280); c.stroke();
    // the sail in bands of color
    const sail = [[4, -276], [4, -26], [110, -26]];
    c.save(); poly(c, sail); c.clip();
    [CORAL, GOLD, PINK, TURQ, CORAL].forEach((col, k) => { c.fillStyle = col; c.fillRect(0, -276 + k * 50, 120, 50); });
    c.restore();
    c.fillStyle = FOAM; poly(c, [[-4, -250], [-4, -30], [-80, -30]]); c.fill();
    c.restore();
  }, { t, d: 1.0, reveal: 'slide', dx: -140 });
}

// the great wave in front: it rises from the right and curls over to the left
const WAVE_TOP = (x) => 1520 - 130 * Math.exp(-(((x - 560) / 420) ** 2)) + (x - 560) * 0.03;
const CX_ = 400, CY_ = WAVE_TOP(470) + 66, CR = 70; // the curl
function bigWave(p, r) {
  // the body: up the right, along the crest, over the curl, and down inside it
  const face = [[W + 10, H + 10], [W + 10, WAVE_TOP(W)]];
  for (let x = W; x >= 470; x -= 10) face.push([x, WAVE_TOP(x)]);
  const lip = [];
  for (let i = 0; i <= 30; i++) { const a = -Math.PI * 0.42 - (i / 30) * Math.PI * 1.25; lip.push([CX_ + Math.cos(a) * CR, CY_ + Math.sin(a) * CR]); }
  face.push(...lip, [CX_ - 30, CY_ + 40], [CX_ + 20, CY_ + 30], [CX_ + 60, CY_ + 90], [150, H + 10]);
  p.group('wave', { x: 0, y: 1300, w: W, h: H - 1300 }, (c) => {
    c.fillStyle = TEAL; poly(c, face); c.fill();
    c.save(); poly(c, face); c.clip();
    // the face's light: a pale band under the crest, then long lines following the swell
    c.fillStyle = TURQ; c.beginPath(); c.moveTo(W, WAVE_TOP(W)); for (let x = W; x >= 440; x -= 10) c.lineTo(x, WAVE_TOP(x)); for (let x = 440; x <= W; x += 10) c.lineTo(x, WAVE_TOP(x) + 40 + (x - 440) * 0.06); c.fill();
    c.fillStyle = TEAL_M; c.beginPath(); for (let x = 440; x <= W; x += 10) c.lineTo(x, WAVE_TOP(x) + 40 + (x - 440) * 0.06); for (let x = W; x >= 440; x -= 10) c.lineTo(x, WAVE_TOP(x) + 110 + (x - 440) * 0.08); c.fill();
    c.strokeStyle = TEAL_M; c.lineWidth = 5; c.beginPath();
    for (let k = 3; k < 14; k++) { c.moveTo(380, WAVE_TOP(380) + k * 36); for (let x = 380; x <= W; x += 20) c.lineTo(x, WAVE_TOP(x) + k * 36 + Math.sin(x / 90 + k) * 6 + (x - 380) * 0.05); }
    c.stroke();
    // the hollow under the lip
    c.fillStyle = NAVY; c.beginPath(); c.ellipse(CX_ + 12, CY_ + 18, 40, 36, 0.3, 0, Math.PI * 2); c.fill();
    c.restore();
  }, { t: 7.0, d: 1.2, reveal: 'rise', ease: 'out' });
  // foam: scallops along the crest and over the curl, and spray thrown off it
  const crest = [];
  for (let x = 1600; x > 470; x -= r.range(18, 28)) crest.push([x, WAVE_TOP(x) + 2, r.range(10, 18) * (0.6 + 0.4 * Math.exp(-(((x - 560) / 400) ** 2)))]);
  for (let i = 0; i < 24; i += 2) crest.push([lip[i][0], lip[i][1], r.range(11, 17)]);
  const spray = [];
  for (let i = 0; i < 90; i++) { const x = r.range(260, 900); spray.push([x, WAVE_TOP(x) - r.range(10, 110) * Math.exp(-(((x - 480) / 260) ** 2)), r.range(1.5, 5)]); }
  p.group('wave', { x: 120, y: 1240, w: W - 120, h: 420 }, (c) => {
    c.fillStyle = FOAM; c.beginPath(); for (const [x, y, rr] of crest) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); } c.fill();
    c.fillStyle = TURQ_L; c.beginPath(); for (const [x, y, rr] of crest) { c.moveTo(x + rr * 0.5, y + rr * 0.4); c.arc(x, y + rr * 0.4, rr * 0.5, 0, Math.PI); } c.fill();
    c.fillStyle = FOAM; c.beginPath(); for (const [x, y, rr] of spray) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); } c.fill();
  }, { t: 7.6, d: 0.9, reveal: 'wipeL', ease: 'inOut' });
  // the rider on the face, leaning into it
  p.group('rider', { x: 780, y: 1330, w: 320, h: 220 }, (c) => surfer(c, 930, WAVE_TOP(930) + 110, 1.3, -1, GOLD), { t: 8.2, d: 0.8, reveal: 'drop', dy: 40 });
}

// ================================================================ the near palms and flowers
function frondPts(rr, L, sag) {
  // a coconut frond: a spine that arcs and droops, leaflets hanging from it
  const spine = [], leaves = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; spine.push([t * L, sag * t * t * L]); }
  for (let i = 2; i < 14; i++) {
    const [x, y] = spine[i], ll = L * 0.32 * Math.sin((i / 14) * Math.PI) + 8;
    for (const s of [-1, 1]) leaves.push([x, y, x + ll * 0.3 + rr.range(-4, 4), y + s * ll * 0.4 + ll * 0.6]);
  }
  return { spine, leaves };
}
function palms(p, r) {
  const list = [[-30, H - 280, 1080, 0.36, 8.4], [60, H - 120, 820, 0.48, 8.7]];
  list.forEach(([x, y, h, lean, t], n) => {
    const rr = rng(300 + n);
    const tx = x + lean * h, ty = y - h;
    // the trunk: a long curve, ringed
    const trunk = [];
    for (let i = 0; i <= 30; i++) { const q = i / 30; trunk.push([x + lean * h * (q * q * 0.5 + q * 0.5), y - h * q]); }
    const fr = [];
    for (let k = 0; k < 9; k++) fr.push([(k / 9) * Math.PI * 2 + rr.range(-0.2, 0.2), rr.range(250, 360), rr.range(0.25, 0.7), frondPts(rr, 1, 0)]);
    const box = { x: x - 60, y: ty - 420, w: lean * h + 520, h: h + 460 };
    p.group('palms', box, (c) => {
      c.lineCap = 'round';
      for (let i = 1; i < trunk.length; i++) {
        const q = i / 30, w = 34 - q * 16;
        c.strokeStyle = i % 2 ? TRUNK : TRUNK_D; c.lineWidth = w;
        c.beginPath(); c.moveTo(trunk[i - 1][0], trunk[i - 1][1]); c.lineTo(trunk[i][0], trunk[i][1]); c.stroke();
      }
    }, { t, d: 1.0, reveal: 'rise', ease: 'out' });
    // the crown: fronds in two greens, and coconuts
    p.group('palms', box, (c) => {
      for (const [a, L, sag] of fr) {
        const ca = Math.cos(a), sa = Math.sin(a) * 0.5 - 0.25;
        const pt = (u) => [tx + ca * L * u, ty + sa * L * u + sag * u * u * L * 0.9];
        c.fillStyle = Math.sin(a) > 0 ? GREEN_D : GREEN;
        c.strokeStyle = c.fillStyle; c.lineWidth = 6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(tx, ty); for (let i = 1; i <= 14; i++) { const [px, py] = pt(i / 14); c.lineTo(px, py); } c.stroke();
        c.lineWidth = 7; c.beginPath();
        for (let i = 2; i < 14; i++) {
          const u = i / 14, [px, py] = pt(u), ll = L * 0.28 * Math.sin(u * Math.PI) + 10;
          for (const s of [-1, 1]) { c.moveTo(px, py); c.lineTo(px + ca * ll * 0.35 - s * sa * ll * 0.2, py + ll * 0.75 + s * 6); }
        }
        c.stroke();
      }
      c.fillStyle = '#6b4a22'; for (const [dx, dy] of [[-12, 10], [10, 14], [0, 24]]) { c.beginPath(); c.arc(tx + dx, ty + dy, 13, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = GOLD; c.beginPath(); c.arc(tx - 16, ty + 6, 3, 0, Math.PI * 2); c.fill();
    }, { t: t + 0.6, d: 0.9, reveal: 'iris', ease: 'out' });
  });
}
function hibiscus(c, x, y, R, rot, col, dark) {
  c.save(); c.translate(x, y); c.rotate(rot);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    c.save(); c.rotate(a);
    c.fillStyle = col;
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(R * 0.5, -R * 0.35, R * 1.1, -R * 0.55, R * 1.05, 0); c.bezierCurveTo(R * 1.1, R * 0.55, R * 0.5, R * 0.35, 0, 0); c.fill();
    c.strokeStyle = dark; c.lineWidth = 2; c.beginPath(); c.moveTo(R * 0.15, 0); c.lineTo(R * 0.8, 0); c.stroke();
    c.restore();
  }
  c.fillStyle = dark; c.beginPath(); c.arc(0, 0, R * 0.25, 0, Math.PI * 2); c.fill();
  // the long stamen with its pollen
  c.strokeStyle = GOLD; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(R * 0.85, -R * 0.6); c.stroke();
  c.fillStyle = GOLD; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(R * 0.75 + (k % 3) * 6, -R * 0.62 - Math.floor(k / 3) * 6 + (k % 2) * 3, 3.2, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = RED; c.beginPath(); c.arc(R * 0.9, -R * 0.66, 4, 0, Math.PI * 2); c.fill();
  c.restore();
}
function monstera(c, x, y, L, rot, col, vein) {
  // the leaf in lobes split down to the midrib, as the plant splits it
  c.save(); c.translate(x, y); c.rotate(rot);
  const n = 7;
  c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); for (let i = 0; i <= 20; i++) { const t = i / 20; c.lineTo(t * L, -Math.sin(t * Math.PI) * L * 0.22); } for (let i = 20; i >= 0; i--) { const t = i / 20; c.lineTo(t * L, Math.sin(t * Math.PI) * L * 0.22); } c.fill();
  for (const s of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const t0 = 0.06 + (i / n) * 0.92, t1 = 0.06 + ((i + 0.86) / n) * 0.92;
      const w0 = Math.sin(t0 * Math.PI) * L * 0.5, w1 = Math.sin(t1 * Math.PI) * L * 0.5;
      c.fillStyle = col;
      c.beginPath(); c.moveTo(t0 * L, 0); c.quadraticCurveTo(t0 * L + 10, s * w0 * 0.5, t0 * L + 18, s * w0); c.quadraticCurveTo((t0 + t1) / 2 * L + 20, s * (w0 + w1) * 0.55, t1 * L + 14, s * w1); c.lineTo(t1 * L, 0); c.closePath(); c.fill();
    }
  }
  c.strokeStyle = vein; c.lineWidth = 4; c.beginPath(); c.moveTo(-40, 0); c.lineTo(L, 0); c.stroke();
  c.restore();
}
function flowers(p, r) {
  // monstera leaves first, then the blooms on them
  [[-20, 1720, 420, -0.5, GREEN_D, 9.0], [120, 1900, 380, -0.95, GREEN, 9.2], [1500, 1960, 300, -2.4, GREEN_D, 9.3]].forEach(([x, y, L, rot, col, t]) => {
    p.group('flowers', { x: x - L - 60, y: y - L - 60, w: 2 * L + 120, h: 2 * L + 120 }, (c) => monstera(c, x, y, L, rot, col, LEAF), { t, d: 0.7, reveal: 'pop' });
  });
  [[150, 1640, 92, 0.3, RED, '#7a1020', 9.5], [330, 1830, 110, -0.6, CORAL, '#a0301e', 9.7], [80, 1930, 70, 1.1, PINK, '#9a2a4a', 9.8], [1460, 1880, 80, 2.2, GOLD, '#b4641a', 9.9]].forEach(([x, y, R, rot, col, dk, t]) => {
    p.group('flowers', { x: x - R * 1.3, y: y - R * 1.3, w: R * 2.6, h: R * 2.6 }, (c) => hibiscus(c, x, y, R, rot, col, dk), { t, d: 0.6, reveal: 'pop', ease: 'back' });
  });
}

// ================================================================ live
function life(p, r) {
  // two clouds drifting slowly on the trade wind
  p.live('clouds', {
    t: 1.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => { for (const i of [1, 2]) { const cl = CLOUDS[i]; drawCloud(c, cl, cl.puffs, Math.sin(time * 0.12 + i) * 40); } },
  });
  // frigatebirds hanging on the wind over the head
  const birds = [[900, 360, 0.3, 1.2], [1040, 420, 0.25, 0.9], [760, 470, 0.35, 0.8]];
  p.live('head', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = NAVY; c.lineCap = 'round';
      for (const [x0, y0, w, s] of birds) {
        const x = x0 + Math.cos(time * w) * 120, y = y0 + Math.sin(time * w * 2) * 20, f = Math.sin(time * 1.6 + x0) * 4;
        c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x - 30 * s, y - 4 * s + f); c.lineTo(x - 12 * s, y - 10 * s); c.lineTo(x, y); c.lineTo(x + 12 * s, y - 10 * s); c.lineTo(x + 30 * s, y - 4 * s + f); c.stroke();
      }
    },
  });
  // light on the water, and the canoe's paddles flashing
  const gl = [];
  for (let i = 0; i < 28; i++) gl.push([r.range(0, W), r.range(BEACH + 40, 1400), r() * 6, r.range(8, 22)]);
  p.live('swell', {
    t: 9.8, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = FOAM;
      for (const [x, y, ph, L] of gl) { const a = Math.sin(time * 1.5 + ph * 2); if (a < 0.3) continue; c.globalAlpha = a; c.fillRect(x + Math.sin(time * 0.5 + ph) * 8, y, L, 2.4); }
      c.globalAlpha = 1;
    },
  });
}

// ================================================================ the title
function title(p, r) {
  // a sand-colored band of shadow under the letters, printed first
  p.type('title', 'HONOLULU', W / 2, 300, { family: FACE, size: 250, color: CORAL, shadow: NAVY, sx: 9, sy: 9, align: 'center', fit: 1420, t: 10.4, gap: 0.14, d: 0.8, reveal: 'drop' });
  p.type('title', 'WAIKĪKĪ · DIAMOND HEAD', W / 2, 382, { family: FACE, size: 46, color: NAVY, align: 'center', track: 0.12, t: 11.8, gap: 0.04, d: 0.5 });
  p.type('title', 'ALOHA', 880, 1950, { family: FACE, size: 46, color: FOAM, align: 'center', track: 0.2, t: 12.4, gap: 0.08, d: 0.5 });
}
