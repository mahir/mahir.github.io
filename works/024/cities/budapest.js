// Budapest: a 1930s Hungarian tourism poster, flat lithographic color. Looking
// up the Danube at dusk. The sky is laid in bands, cobalt to eosin green to gold
// and coral, bowed around a setting sun that is ringed like a Zsolnay plate;
// deco clouds in oxblood and rose cross it, and the name stands in gold at the
// top. Against the sun, on the left, Castle Hill: the Royal Palace and its dome,
// Matthias Church with its patterned tile roof, the Fisherman's Bastion and the
// funicular climbing the slope. Across the river the Parliament fills the right,
// lit by the last sun: arcades, pointed windows, pinnacles, spires and the ribbed
// dome. In front the Chain Bridge spans the sheet, its arched towers, chains,
// lamps and a stone lion at each end; a paddle steamer passes under it. A frieze
// of glazed tiles and a cobalt band close the sheet.

import { Plate, W, H } from '../print.js';
import { poly, rng, lerp, mix } from '../kit.js';

const IVORY = '#f5ead3', PAPER = '#efe2c6';
const EOSIN = '#2f7d6d', EOSIN_D = '#1b5248';
const OCHRE = '#dca642', OX = '#8c2c3a', OX_D = '#5e1c29', COBALT = '#1f3567', COBALT_D = '#14234a';
const GOLD = '#f2c66a', GOLD_D = '#c98d32';
const HILL = '#4a3550', HILL_D = '#3a2943', HILL_L = '#5e4664';
const BUDA = '#7a6488', BUDA_D = '#5d4a6c', BUDA_L = '#958099';
const STONE = '#d9c09a', STONE_S = '#9e8676', STONE_D = '#6a5462', STONE_L = '#ead7b4';
const PARL = '#f3dcb8', PARL_S = '#d0a38e', PARL_R = '#a8383c', PARL_RD = '#7c2630', PARL_D = '#7a4a58';
const LIT = '#ffd27a';

export const city = {
  id: 'budapest', name: 'Budapest', wall: '#1d2446',
  alt: 'A 1930s Hungarian tourism poster at dusk: the name BUDAPEST in gold over a banded sky of cobalt, eosin green and gold with deco clouds and a setting sun ringed with ornament, Castle Hill against it with the Royal Palace and its dome, Matthias Church with its tiled roof, the Fisherman’s Bastion and the funicular, across the Danube the Parliament with its arcades, spires and ribbed dome, and in front the Chain Bridge with its two arched towers, its chains, its lamps and a stone lion at each end, a paddle steamer, and a frieze of glazed tiles in Zsolnay colors',
  google: 'family=Eczar:wght@500;800',
  fonts: [['800 240px "Eczar"', 'BUDAPEST'], ['500 30px "Eczar"', 'MAGYARORSZÁG · A DUNA GYÖNGYE']],
  build,
};

const FONT = '"Eczar", serif';
const MG = 48;
const FR = 1786, FR1 = 1866, BOT = H - MG;      // the tile frieze, then the cobalt band
const HOR = 1126;                               // the far bank under the Parliament
const SUNX = 320, SUNY = 604, SUNR = 124;       // the setting sun
const DECK = 1432, DECK_H = 20;                 // the bridge's roadway
const T1 = 470, T2 = 1130, TW = 78, TTOP = 1166; // its towers: centers, half width, top
const WATER = 1520;                             // the water at the piers
const PB = 1112;                                // the foot of the Parliament
const PX0 = 800, PX1 = 1546, DC = 1176;         // its ends and its dome

function build() {
  const p = new Plate({ paper: PAPER, seed: 1896 });
  p.clip = { x: MG, y: MG, w: W - 2 * MG, h: FR - MG };
  p.stack('sky', 'sun', 'cloud', 'buda', 'river', 'pest', 'chain', 'bridge', 'near', 'live', 'band', 'title');
  for (const n of ['band', 'title']) p.layer(n, { clip: false });

  sky(p);
  sun(p);
  clouds(p);
  castleHill(p);
  river(p);
  const lights = parliament(p);
  pestBank(p);
  lights();
  bridge(p);
  water(p);
  band(p);
  title(p);
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
function bez(a, b, cc, d, n = 12) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * cc[0] + t ** 3 * d[0], u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * cc[1] + t ** 3 * d[1]]);
  }
  return pts;
}
// a pointed Gothic opening, its foot at (x, y), w wide and h tall
function pointed(x, y, w, h) {
  const s = y - h + w * 0.85, pts = [[x, y], [x, s]];
  for (let i = 1; i < 6; i++) { const a = Math.PI - (i / 6) * Math.PI / 3; pts.push([x + w + Math.cos(a) * w, s - Math.sin(a) * w]); }
  pts.push([x + w / 2, s - Math.sin(Math.PI / 3) * w]);
  for (let i = 5; i >= 1; i--) { const a = (i / 6) * Math.PI / 3; pts.push([x + Math.cos(a) * w, s - Math.sin(a) * w]); }
  pts.push([x + w, s], [x + w, y]);
  return pts;
}
// a thin spire: a shaft from y0 up to y1, then a needle to y2
function spire(c, x, y0, y1, y2, w, col, shade, roof) {
  fillP(c, [[x - w, y0], [x - w, y1], [x + w, y1], [x + w, y0]], col);
  c.fillStyle = shade; c.fillRect(x + w * 0.2, y1, w * 0.8, y0 - y1);
  fillP(c, [[x - w - 2, y1 + 2], [x, y2], [x + w + 2, y1 + 2]], roof);
  c.fillStyle = col; c.fillRect(x - w - 2, y1, 2 * w + 4, 3);
}

// ---------------------------------------------------------------- the sky
// the bands bow down away from the sun, as if laid round it
const BANDS = [[MG, '#14244c'], [356, '#1d3563'], [452, '#26507a'], [540, '#2f6f7c'], [622, '#5a937f'], [700, '#a9b980'], [770, '#eccb78'], [846, '#f3a862'], [930, '#e67a5a'], [1010, '#d4605a']];
const bandY = (k, x) => (k === 0 ? MG : BANDS[k][0] + 150 * ((x - SUNX) / 1150) ** 2);
function bandPts(k) {
  const pts = [];
  for (let x = MG - 10; x <= W - MG + 10; x += 20) pts.push([x, bandY(k, x)]);
  pts.push([W - MG + 10, HOR + 40], [MG - 10, HOR + 40]);
  return pts;
}
function sky(p) {
  BANDS.forEach(([y, col], k) => {
    const pts = bandPts(k);
    p.group('sky', { x: MG, y: (k ? y : MG) - 4, w: W - 2 * MG, h: HOR + 44 - (k ? y : MG) }, (c) => fillP(c, pts, col),
      { t: 0.15 + k * 0.16, d: 0.9, reveal: 'fall', ease: 'soft' });
  });
  // the litho's hairlines: a few lighter lines low in every band
  const lines = [];
  for (let k = 1; k < BANDS.length; k++) {
    for (const f of [0.12, 0.26, 0.42]) {
      const ln = [];
      for (let x = MG; x <= W - MG; x += 24) ln.push([x, lerp(bandY(k, x), k + 1 < BANDS.length ? bandY(k + 1, x) : HOR, 1 - f)]);
      lines.push([k, ln]);
    }
  }
  p.group('sky', { x: MG, y: MG, w: W - 2 * MG, h: HOR - MG + 20 }, (c) => {
    c.lineWidth = 1.6;
    for (const [k, ln] of lines) {
      c.strokeStyle = mix(BANDS[k][1], BANDS[Math.min(BANDS.length - 1, k + 1)][1], 0.6);
      c.beginPath(); ln.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    }
  }, { t: 1.8, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // stars in the top bands, around the name
  const r = rng(5), stars = [];
  for (let i = 0; i < 170; i++) { const y = r.range(MG + 8, 470); stars.push([r.range(MG + 8, W - MG - 8), y, r.range(0.7, 2.0) * (1 - (y - MG) / 560)]); }
  p.group('sky', { x: MG, y: MG, w: W - 2 * MG, h: 440 }, (c) => {
    c.fillStyle = '#f4e9d0';
    c.beginPath(); for (const [x, y, s] of stars) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
  }, { t: 2.0, d: 1.2, reveal: 'fade' });
}

// ---------------------------------------------------------------- the sun, ringed like a plate
function sun(p) {
  p.group('sun', { x: SUNX - SUNR - 6, y: SUNY - SUNR - 6, w: 2 * SUNR + 12, h: 2 * SUNR + 12 }, (c) => {
    c.fillStyle = '#fbe7b0'; c.beginPath(); c.arc(SUNX, SUNY, SUNR, 0, Math.PI * 2); c.fill();
    // stripes of light across its lower half, as on the old posters
    c.save(); c.beginPath(); c.arc(SUNX, SUNY, SUNR, 0, Math.PI * 2); c.clip();
    c.fillStyle = '#f6c779';
    for (let k = 0; k < 7; k++) { const y = SUNY + 12 + k * 17; c.fillRect(SUNX - SUNR, y, 2 * SUNR, 4 + k * 1.4); }
    c.restore();
  }, { t: 1.1, d: 1.0, reveal: 'pop' });
  // the rings: an oxblood line, beads, little tulips pointing out, a thin gold line
  const beads = [], tulips = [];
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; beads.push([SUNX + Math.cos(a) * 160, SUNY + Math.sin(a) * 154, i % 2]); }
  for (let i = 0; i < 28; i++) tulips.push((i / 28) * Math.PI * 2 + Math.PI / 28);
  const R = 216;
  p.group('sun', { x: SUNX - R - 10, y: SUNY - R - 10, w: 2 * R + 20, h: 2 * R + 20 }, (c) => {
    c.strokeStyle = OX; c.lineWidth = 5; c.beginPath(); c.arc(SUNX, SUNY, 138, 0, Math.PI * 2); c.stroke();
    for (const [x, y, k] of beads) { c.fillStyle = k ? OX : EOSIN_D; c.beginPath(); c.arc(x, y, k ? 4.5 : 3.2, 0, Math.PI * 2); c.fill(); }
    for (const a of tulips) {
      c.save(); c.translate(SUNX + Math.cos(a) * 196, SUNY + Math.sin(a) * 184); c.rotate(a + Math.PI / 2);
      // a folk tulip: a cup of three petals on a short stem
      c.fillStyle = OX; c.beginPath(); c.moveTo(0, 12); c.bezierCurveTo(-13, 4, -12, -10, -6, -14); c.lineTo(0, -6); c.lineTo(6, -14); c.bezierCurveTo(12, -10, 13, 4, 0, 12); c.fill();
      c.fillStyle = OCHRE; c.beginPath(); c.moveTo(0, 6); c.bezierCurveTo(-4, 0, -3, -8, 0, -12); c.bezierCurveTo(3, -8, 4, 0, 0, 6); c.fill();
      c.strokeStyle = EOSIN_D; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 12); c.lineTo(0, 20); c.stroke();
      c.restore();
    }
    c.strokeStyle = GOLD_D; c.lineWidth = 2; c.beginPath(); c.arc(SUNX, SUNY, 206, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 1.2; c.beginPath(); c.arc(SUNX, SUNY, R, 0, Math.PI * 2); c.stroke();
  }, { t: 1.6, d: 1.4, reveal: 'fade' });
}

// ---------------------------------------------------------------- deco clouds
// a long cloud: a flat foot, a row of scallops rising to the middle, a lit underside
function cloudPts(x, y, w, h, n) {
  const pts = [[x, y]];
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, lift = (t) => Math.sin(t * Math.PI) ** 0.6;
    const xa = x + t0 * w, xb = x + t1 * w, ya = y - h * lift(t0) * 0.85, yb = y - h * lift(t1) * 0.85;
    const top = Math.min(ya, yb) - (xb - xa) * 0.45;
    pts.push(...bez([xa, ya], [xa, top], [xb, top], [xb, yb], 8).slice(i ? 1 : 0));
  }
  pts.push([x + w, y]);
  return pts;
}
const CLOUDS = [
  [760, 470, 640, 74, 8, '#4b2f5a', '#a8506a'],
  [1000, 640, 540, 58, 7, '#8a3a4e', '#e07a5e'],
  [560, 600, 300, 42, 5, '#7a3550', '#d06a5e'],
  [110, 694, 420, 40, 6, '#9a4450', '#f0995e'],
  [1180, 780, 330, 36, 5, '#a84a52', '#f3a067'],
];
function clouds(p) {
  CLOUDS.forEach(([x, y, w, h, n, body, lit], i) => {
    const pts = cloudPts(x, y, w, h, n);
    p.group('cloud', { x: x - 8, y: y - h * 1.6, w: w + 16, h: h * 1.6 + 14 }, (c) => {
      fillP(c, pts, body);
      // the lit underside in two steps, and a gold line along the foot
      c.save(); poly(c, pts); c.clip();
      c.fillStyle = mix(body, lit, 0.5); c.fillRect(x, y - h * 0.62, w, h);
      c.fillStyle = lit; c.fillRect(x, y - h * 0.3, w, h);
      c.restore();
      c.strokeStyle = GOLD; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + 10, y + 5); c.lineTo(x + w - 10, y + 5); c.stroke();
      c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 40, y + 11); c.lineTo(x + w * 0.6, y + 11); c.stroke();
    }, { t: 2.2 + i * 0.22, d: 1.1, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ---------------------------------------------------------------- Castle Hill, against the sun
// the Buda bank seen up the river: x of the water's edge at a height y
const bankL = (y) => lerp(784, 236, (y - HOR) / (DECK - HOR));
const TREE_TONES = [['#3d2c46', '#57405e'], ['#343249', '#4a4862'], ['#46324c', '#634a62']];
const HILLP = [[MG - 10, 1450], [MG - 10, 838], [560, 838], [600, 862], [700, 868], [744, 930], [770, 1010], [790, 1080], [bankL(HOR), HOR], [bankL(DECK + 20), DECK + 20]];
function castleHill(p) {
  const r = rng(41), trees = [];
  for (let i = 0; i < 3000 && trees.length < 620; i++) {
    const x = r.range(MG, 800), y = r.range(872, 1420), s = r.range(7, 14);
    if (inPoly(x - s, y, HILLP) && inPoly(x + s, y, HILLP) && inPoly(x, y - s - 6, HILLP)) trees.push([x, y, s]);
  }
  trees.sort((a, b) => a[1] - b[1]);
  // the zigzag walls and terraces of the castle down the slope
  const walls = [[[MG, 918], [300, 930], [520, 916], [700, 940]], [[MG, 1000], [180, 1010], [260, 1060], [520, 1050], [740, 1040]], [[120, 1130], [340, 1110], [430, 1160], [640, 1150]]];
  p.group('buda', { x: MG - 10, y: 820, w: 820, h: 640 }, (c) => {
    fillP(c, HILLP, HILL);
    // the hill's slope picks up a little light toward the river
    c.save(); poly(c, HILLP); c.clip();
    c.fillStyle = '#56405c'; poly(c, [[560, 838], [600, 862], [700, 868], [744, 930], [770, 1010], [790, 1080], [bankL(HOR), HOR], [bankL(DECK), DECK], [380, DECK]]); c.fill();
    c.restore();
    TREE_TONES.forEach(([dk, lt], k) => {
      const set = trees.filter((_, i) => i % 3 === k);
      c.fillStyle = dk;
      c.beginPath(); for (const [x, y, s] of set) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
      c.fillStyle = lt;
      c.beginPath(); for (const [x, y, s] of set) { c.moveTo(x - s * 0.1, y - s * 0.3); c.arc(x - s * 0.3, y - s * 0.3, s * 0.42, 0, Math.PI * 2); } c.fill();
    });
    // lamps along the paths
    c.fillStyle = LIT;
    for (const w of walls) for (let i = 1; i < w.length; i++) for (let t = 0.2; t < 1; t += 0.3) c.fillRect(lerp(w[i - 1][0], w[i][0], t) - 1.5, lerp(w[i - 1][1], w[i][1], t) - 12, 3, 3);
    c.strokeStyle = BUDA_D; c.lineWidth = 7; c.lineJoin = 'round';
    for (const w of walls) { c.beginPath(); w.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
    c.strokeStyle = BUDA_L; c.lineWidth = 2;
    for (const w of walls) { c.beginPath(); w.forEach(([x, y], i) => (i ? c.lineTo(x, y - 4) : c.moveTo(x, y - 4))); c.stroke(); }
    // the rim of the hill catching the last light
    c.strokeStyle = '#d98a6a'; c.lineWidth = 3; c.beginPath(); c.moveTo(600, 862); c.lineTo(700, 868); c.lineTo(744, 930); c.lineTo(770, 1010); c.lineTo(790, 1080); c.stroke();
  }, { t: 3.0, d: 1.0, reveal: 'rise' });
  // the funicular's track up the slope, its stations
  p.group('buda', { x: 380, y: 830, w: 260, h: 320 }, (c) => {
    c.fillStyle = BUDA_D; poly(c, [[600, 1120], [612, 1120], [432, 846], [420, 846]]); c.fill();
    c.strokeStyle = BUDA_L; c.lineWidth = 1.2; c.beginPath();
    for (let k = 0; k <= 30; k++) { const t = k / 30, x = lerp(606, 426, t), y = lerp(1120, 846, t); c.moveTo(x - 7, y); c.lineTo(x + 7, y); }
    c.stroke();
    fillP(c, [[580, 1124], [580, 1100], [640, 1100], [640, 1124]], BUDA);
    fillP(c, [[402, 852], [402, 830], [452, 830], [452, 852]], BUDA);
  }, { t: 3.5, d: 0.8, reveal: 'fade' });
  // houses along the Buda quay at the foot of the hill, their windows lit
  const quay = [];
  for (let x = 520; x < 790; x += r.range(26, 40)) { const y = 1110 + (790 - x) * 0.14; quay.push([x, y, r.range(26, 36), r.range(26, 44), r.pick(['#806a8a', '#8c7590', '#73607f'])]); }
  const qlit = [];
  for (const [x, y, w, h] of quay) for (let yy = y - h + 8; yy < y - 8; yy += 11) for (let xx = x + 4; xx < x + w - 6; xx += 8) qlit.push([xx, yy, r.chance(0.4)]);
  p.group('buda', { x: 500, y: 1040, w: 320, h: 120 }, (c) => {
    for (const [x, y, w, h, col] of quay) { fillP(c, [[x, y], [x, y - h], [x + w / 2, y - h - 12], [x + w, y - h], [x + w, y]], col); }
    for (const [x, y, l] of qlit) { c.fillStyle = l ? LIT : BUDA_D; c.fillRect(x, y, 4, 6); }
  }, { t: 3.9, d: 0.8, reveal: 'rise' });
  palace(p, r);
  matthias(p);
}

// the Royal Palace: a long front of two lit floors, the central block, the drum and the dome
function palace(p, r) {
  const lit = [];
  for (let x = 92; x < 590; x += 13) for (const y of [790, 812]) if (Math.abs(x - 320) > 70) lit.push([x, y, r.chance(0.55)]);
  p.group('buda', { x: MG, y: 540, w: 600, h: 320 }, (c) => {
    // the wings and their roofs
    fillP(c, [[80, 842], [80, 774], [600, 774], [600, 842]], BUDA);
    fillP(c, [[76, 776], [92, 760], [588, 760], [604, 776]], BUDA_D);
    c.fillStyle = BUDA_L; c.fillRect(80, 774, 520, 4); c.fillRect(80, 826, 520, 3);
    for (const [x, y, l] of lit) { c.fillStyle = l ? LIT : BUDA_D; c.fillRect(x, y, 6, 12); }
    // corner pavilions
    for (const x of [80, 560]) { fillP(c, [[x, 842], [x, 752], [x + 40, 752], [x + 40, 842]], BUDA); fillP(c, [[x - 4, 754], [x + 20, 736], [x + 44, 754]], BUDA_D); }
    // the central block with its columns
    fillP(c, [[250, 842], [250, 734], [390, 734], [390, 842]], BUDA);
    fillP(c, [[240, 738], [320, 704], [400, 738]], BUDA_D);
    c.fillStyle = BUDA_L; for (let x = 262; x < 384; x += 14) c.fillRect(x, 748, 5, 78);
    c.fillStyle = LIT; c.fillRect(306, 800, 28, 26);
    // the drum, ringed with columns, and the copper dome with its lantern
    fillP(c, [[274, 712], [274, 652], [366, 652], [366, 712]], BUDA);
    c.fillStyle = BUDA_D; for (let x = 280; x < 362; x += 10) c.fillRect(x, 658, 4, 48);
    c.fillStyle = BUDA_L; c.fillRect(268, 648, 104, 6);
    const dome = [...bez([270, 650], [268, 592], [304, 566], [320, 562]), ...bez([320, 562], [336, 566], [372, 592], [370, 650])];
    fillP(c, dome, '#3d7a6c');
    c.save(); poly(c, dome); c.clip();
    c.fillStyle = '#5c9a86'; c.beginPath(); c.ellipse(298, 608, 16, 50, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#2a5a50'; c.lineWidth = 2; c.beginPath();
    for (const k of [-0.66, -0.33, 0, 0.33, 0.66]) { c.moveTo(320 + k * 50, 650); c.quadraticCurveTo(320 + k * 46, 590, 320 + k * 6, 564); }
    c.stroke(); c.restore();
    fillP(c, [[310, 566], [310, 536], [330, 536], [330, 566]], BUDA);
    c.fillStyle = BUDA_D; c.fillRect(314, 542, 3, 18); c.fillRect(323, 542, 3, 18);
    fillP(c, [[306, 538], [320, 512], [334, 538]], '#3d7a6c');
    c.fillStyle = GOLD; c.beginPath(); c.arc(320, 506, 5, 0, Math.PI * 2); c.fill(); c.fillRect(318.5, 490, 3, 14); c.fillRect(313, 495, 14, 3);
  }, { t: 3.4, d: 1.3, reveal: 'rise' });
}

// Matthias Church with its diamond-tiled roof and tall spire, the Fisherman's Bastion below it
function matthias(p) {
  p.group('buda', { x: 560, y: 600, w: 230, h: 300 }, (c) => {
    // the bastion: an arcaded wall and seven conical turrets, pale stone catching the light
    fillP(c, [[586, 896], [586, 860], [764, 860], [764, 896]], '#b9a6bf');
    c.fillStyle = BUDA_D; for (let x = 594; x < 758; x += 15) { poly(c, pointed(x, 892, 9, 24)); c.fill(); }
    for (const [x, h] of [[596, 28], [624, 38], [652, 34], [680, 46], [708, 36], [734, 50], [758, 30]]) {
      fillP(c, [[x - 8, 864], [x - 8, 846], [x + 8, 846], [x + 8, 864]], '#cbbad0');
      c.fillStyle = BUDA; c.fillRect(x + 2, 846, 6, 18);
      fillP(c, [[x - 11, 848], [x, 846 - h], [x + 11, 848]], '#8f7aa0');
      c.fillStyle = GOLD; c.beginPath(); c.arc(x, 844 - h, 2.4, 0, Math.PI * 2); c.fill();
    }
    // the nave and its steep roof of patterned tiles
    fillP(c, [[600, 848], [600, 806], [706, 806], [706, 848]], BUDA);
    const roof = [[594, 808], [653, 762], [712, 808]];
    fillP(c, roof, OX);
    c.save(); poly(c, roof); c.clip();
    for (let y = 770, row = 0; y < 812; y += 8, row++) for (let x = 590 + (row % 2) * 6; x < 716; x += 12) {
      c.fillStyle = (row + Math.round(x / 12)) % 3 === 0 ? EOSIN : OCHRE; poly(c, [[x, y], [x + 5, y - 4], [x + 10, y], [x + 5, y + 4]]); c.fill();
    }
    c.restore();
    c.fillStyle = BUDA_D; for (let x = 612; x < 700; x += 16) { poly(c, pointed(x, 842, 8, 26)); c.fill(); }
    // the bell tower and its tall Gothic spire with little gables
    fillP(c, [[646, 848], [646, 700], [674, 700], [674, 848]], BUDA);
    c.fillStyle = BUDA_D; c.fillRect(664, 700, 10, 148);
    c.fillStyle = BUDA_D; poly(c, pointed(652, 760, 7, 30)); c.fill(); poly(c, pointed(661, 760, 7, 30)); c.fill();
    c.fillStyle = LIT; c.fillRect(655, 800, 10, 14);
    fillP(c, [[642, 702], [646, 690], [674, 690], [678, 702]], BUDA_L);
    for (const x of [646, 674]) fillP(c, [[x - 4, 692], [x, 672], [x + 4, 692]], BUDA_L);
    fillP(c, [[648, 692], [660, 612], [672, 692]], BUDA_D);
    c.fillStyle = OCHRE; for (let y = 640; y < 690; y += 10) { const w = (y - 612) / 80 * 22; c.fillRect(660 - w / 2, y, w, 2.5); }
    c.fillStyle = GOLD; c.beginPath(); c.arc(660, 610, 3, 0, Math.PI * 2); c.fill(); c.fillRect(659, 596, 2, 12);
  }, { t: 4.0, d: 1.2, reveal: 'rise' });
}

// ---------------------------------------------------------------- the river beyond the bridge
function river(p) {
  const pts = [[bankL(HOR), HOR], [W - MG + 10, HOR], [W - MG + 10, DECK + 20], [bankL(DECK + 20), DECK + 20]];
  p.group('river', { x: 200, y: HOR - 4, w: W - MG - 190, h: DECK - HOR + 30 }, (c) => {
    // the river holds the sky's bands, upside down
    const g = c.createLinearGradient(0, HOR, 0, DECK + 20);
    g.addColorStop(0, '#f0b86a'); g.addColorStop(0.3, '#e0805e'); g.addColorStop(0.65, '#5a8a80'); g.addColorStop(1, '#25486e');
    c.fillStyle = g; poly(c, pts); c.fill();
  }, { t: 2.6, d: 0.9, reveal: 'fall' });
  const r = rng(13), rip = [];
  for (let i = 0; i < 220; i++) {
    const y = r.range(HOR + 18, DECK + 16), k = (y - HOR) / (DECK - HOR);
    const x = r.range(bankL(y) + 8, W - MG), L = 6 + k * 34;
    rip.push([[x, y], [x + L, y]]);
  }
  p.strokes('river', rip, 'rgba(255,226,170,.5)', 1.6, { t: 5.8, d: 1.0, reveal: 'fade' });
}

// ---------------------------------------------------------------- the Parliament
// the river front: an arcade, two floors of pointed windows between buttresses, the
// steep red roofs, the end pavilions, the two chamber halls with their spires, and
// the ribbed dome on its drum, all bristling with pinnacles
const PAV = [[PX0, 62, 64], [PX1 - 62, 62, 64]];             // end pavilions: x, width, rise
const HALLS = [[DC - 300, 150], [DC + 150, 150]];           // the chamber halls: x, width
const BODY = PB - 108, ROOF = BODY - 40;
function parliamentBody(c, lit) {
  // the long roof, steep and red, with a pale ridge
  fillP(c, [[PX0 + 10, BODY], [PX0 + 30, ROOF], [PX1 - 30, ROOF], [PX1 - 10, BODY]], PARL_R);
  c.fillStyle = PARL_RD; for (let x = PX0 + 40; x < PX1 - 40; x += 10) c.fillRect(x, ROOF + 4, 1.4, BODY - ROOF - 6);
  c.fillStyle = PARL; c.fillRect(PX0 + 30, ROOF - 2, PX1 - PX0 - 60, 3);
  // the front
  fillP(c, [[PX0, PB], [PX0, BODY], [PX1, BODY], [PX1, PB]], PARL);
  c.fillStyle = PARL_S; c.fillRect(PX0, BODY, PX1 - PX0, 5);
  c.fillRect(PX0, PB - 34, PX1 - PX0, 3);
  // the arcade at the foot, and two floors of pointed windows
  c.fillStyle = PARL_D;
  for (let x = PX0 + 6; x < PX1 - 10; x += 14) { poly(c, pointed(x, PB - 4, 9, 26)); c.fill(); }
  for (let x = PX0 + 7; x < PX1 - 10; x += 14) { poly(c, pointed(x, PB - 44, 7, 26)); c.fill(); poly(c, pointed(x, PB - 76, 7, 22)); c.fill(); }
  if (lit) { c.fillStyle = LIT; for (const [x, y] of lit) { poly(c, pointed(x, y, 7, y > PB - 50 ? 26 : 22)); c.fill(); } }
  // buttresses: a shaded strip every few bays, each topped with a pinnacle
  for (let x = PX0 + 4; x < PX1; x += 42) {
    c.fillStyle = PARL_S; c.fillRect(x + 4, BODY + 2, 4, PB - BODY - 2);
    c.fillStyle = PARL; poly(c, [[x, BODY + 2], [x + 6, BODY - 26], [x + 12, BODY + 2]]); c.fill();
  }
  // statues' niches in a row under the cornice
  c.fillStyle = PARL_S; for (let x = PX0 + 14; x < PX1 - 10; x += 21) c.fillRect(x, BODY + 10, 3, 7);
}
function parliamentTall(c) {
  // the end pavilions: taller, a steep hipped roof and four corner turrets
  for (const [x, w, h] of PAV) {
    fillP(c, [[x, BODY + 2], [x, BODY - h], [x + w, BODY - h], [x + w, BODY + 2]], PARL);
    c.fillStyle = PARL_S; c.fillRect(x + w - 14, BODY - h, 14, h + 2);
    c.fillStyle = PARL_D; poly(c, pointed(x + w / 2 - 9, BODY - 8, 18, h - 16)); c.fill();
    fillP(c, [[x - 2, BODY - h], [x + 12, BODY - h - 70], [x + w - 12, BODY - h - 70], [x + w + 2, BODY - h]], PARL_R);
    c.fillStyle = PARL_RD; c.fillRect(x + w / 2, BODY - h - 68, w / 2 - 12, 68);
    for (const tx of [x + 2, x + w - 2]) spire(c, tx, BODY - h + 4, BODY - h - 26, BODY - h - 62, 4, PARL, PARL_S, PARL_R);
    spire(c, x + w / 2, BODY - h - 64, BODY - h - 76, BODY - h - 108, 3, PARL, PARL_S, PARL_R);
  }
  // the chamber halls: a gabled front rising over the roof, a slender spire at each corner
  for (const [x, w] of HALLS) {
    const top = ROOF - 24;
    fillP(c, [[x, BODY + 2], [x, top], [x + w, top], [x + w, BODY + 2]], PARL);
    c.fillStyle = PARL_S; c.fillRect(x + w - 18, top, 18, BODY - top + 2);
    fillP(c, [[x + 10, top + 2], [x + w / 2, top - 56], [x + w - 10, top + 2]], PARL_R);
    fillP(c, [[x + w / 2 - 30, top + 2], [x + w / 2, top - 40], [x + w / 2 + 30, top + 2]], PARL);
    c.fillStyle = PARL_D; poly(c, pointed(x + w / 2 - 6, top - 2, 12, 26)); c.fill();
    c.fillStyle = PARL_D; for (let k = 0; k < 4; k++) { poly(c, pointed(x + 22 + k * ((w - 56) / 3), BODY - 4, 12, 34)); c.fill(); }
    for (const tx of [x + 6, x + w - 6]) spire(c, tx, BODY, top - 72, top - 128, 6, PARL, PARL_S, PARL_R);
    for (let k = 1; k < 6; k++) { const tx = x + (k * w) / 6; c.fillStyle = PARL; poly(c, [[tx - 2.5, top + 1], [tx, top - 16], [tx + 2.5, top + 1]]); c.fill(); }
  }
  // the dome hall's front, the two towers beside the dome
  fillP(c, [[DC - 86, BODY + 2], [DC - 86, ROOF - 10], [DC + 86, ROOF - 10], [DC + 86, BODY + 2]], PARL);
  c.fillStyle = PARL_S; c.fillRect(DC + 56, ROOF - 10, 30, BODY - ROOF + 12);
  c.fillStyle = PARL_D; for (let k = -2; k <= 2; k++) { poly(c, pointed(DC + k * 30 - 7, BODY - 6, 14, 40)); c.fill(); }
  for (const x of [DC - 96, DC + 96]) spire(c, x, BODY, ROOF - 110, ROOF - 176, 9, PARL, PARL_S, PARL_R);
  c.fillStyle = PARL_D; for (const x of [DC - 96, DC + 96]) { c.fillRect(x - 5, ROOF - 96, 3, 26); c.fillRect(x + 2, ROOF - 96, 3, 26); }
  // the sixteen-sided drum with tall windows, then the ribbed dome
  const D0 = ROOF - 10, D1 = ROOF - 92;
  fillP(c, [[DC - 66, D0], [DC - 62, D1], [DC + 62, D1], [DC + 66, D0]], PARL);
  c.fillStyle = PARL_S; c.fillRect(DC + 28, D1, 36, D0 - D1);
  c.fillStyle = PARL_D; for (let x = DC - 54; x < DC + 52; x += 15) { poly(c, pointed(x, D0 - 8, 8, D0 - D1 - 20)); c.fill(); }
  c.fillStyle = PARL; for (let x = DC - 60; x <= DC + 60; x += 15) { poly(c, [[x - 3, D1 + 2], [x, D1 - 22], [x + 3, D1 + 2]]); c.fill(); }
  const top = D1 - 92;
  const dome = [...bez([DC - 64, D1], [DC - 70, D1 - 58], [DC - 30, top + 16], [DC - 8, top]), ...bez([DC + 8, top], [DC + 30, top + 16], [DC + 70, D1 - 58], [DC + 64, D1])];
  fillP(c, dome, PARL_R);
  c.save(); poly(c, dome); c.clip();
  c.fillStyle = '#c9605a'; c.beginPath(); c.ellipse(DC - 34, D1 - 40, 24, 56, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = PARL; c.lineWidth = 3; c.beginPath();
  for (const k of [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75]) { c.moveTo(DC + k * 66, D1); c.quadraticCurveTo(DC + k * 60, D1 - 66, DC + k * 8, top + 2); }
  c.stroke();
  // little dormers in two rings
  c.fillStyle = PARL; for (const [y, xs] of [[D1 - 26, [-48, -24, 0, 24, 48]], [D1 - 62, [-28, 0, 28]]]) for (const dx of xs) { c.fillRect(DC + dx - 3, y - 6, 6, 9); poly(c, [[DC + dx - 4, y - 6], [DC + dx, y - 12], [DC + dx + 4, y - 6]]); c.fill(); }
  c.restore();
  // the lantern and the spire
  fillP(c, [[DC - 11, top + 6], [DC - 9, top - 30], [DC + 9, top - 30], [DC + 11, top + 6]], PARL);
  c.fillStyle = PARL_D; c.fillRect(DC - 5, top - 24, 3, 22); c.fillRect(DC + 2, top - 24, 3, 22);
  fillP(c, [[DC - 10, top - 28], [DC, top - 96], [DC + 10, top - 28]], PARL_R);
  c.fillStyle = GOLD; c.beginPath(); c.arc(DC, top - 98, 3.4, 0, Math.PI * 2); c.fill();
  // pinnacles all along the long roofline
  c.fillStyle = PARL;
  for (let x = PX0 + 20; x < PX1 - 20; x += 21) {
    if (Math.abs(x - DC) < 92 || HALLS.some(([hx, hw]) => x > hx - 6 && x < hx + hw + 6) || x < PX0 + 70 || x > PX1 - 70) continue;
    poly(c, [[x - 2.5, ROOF + 2], [x, ROOF - 16], [x + 2.5, ROOF + 2]]); c.fill();
  }
}
const parlBox = { x: PX0 - 20, y: ROOF - 300, w: PX1 - PX0 + 40, h: PB - ROOF + 316 };
function parliament(p) {
  const r = rng(21), lit = [];
  for (let x = PX0 + 7; x < PX1 - 10; x += 14) for (const y of [PB - 44, PB - 76]) if (r.chance(0.32)) lit.push([x, y]);
  // far Pest behind it: low roofs, a few domes, lights coming on
  const roofs = [], lights = [];
  for (let x = PX0 - 20; x < W - MG; x += r.range(16, 30)) roofs.push([x, BODY - r.range(10, 40)]);
  for (let i = 0; i < 90; i++) lights.push([r.range(PX0, W - MG), r.range(BODY - 30, PB - 10)]);
  p.group('pest', { x: PX0 - 30, y: BODY - 90, w: W - MG - PX0 + 40, h: PB - BODY + 100 }, (c) => {
    c.fillStyle = '#c88a6c';
    c.beginPath(); c.moveTo(PX0 - 30, PB);
    for (const [x, y] of roofs) { c.lineTo(x, y); c.lineTo(x + 12, y); }
    c.lineTo(W - MG, PB); c.closePath(); c.fill();
    c.beginPath(); c.arc(PX0 + 120, BODY - 34, 18, Math.PI, 0); c.fill(); c.fillRect(PX0 + 118, BODY - 72, 4, 22);
    c.fillStyle = LIT; for (const [x, y] of lights) c.fillRect(x, y, 2.4, 2.4);
  }, { t: 4.2, d: 0.9, reveal: 'rise' });
  p.group('pest', { x: PX0 - 20, y: BODY - 60, w: PX1 - PX0 + 40, h: PB - BODY + 70 }, (c) => parliamentBody(c, null), { t: 4.6, d: 1.2, reveal: 'rise' });
  p.group('pest', parlBox, (c) => parliamentTall(c), { t: 5.3, d: 1.6, reveal: 'rise' });
  // the embankment under it
  p.group('pest', { x: PX0 - 40, y: PB - 4, w: W - MG - PX0 + 50, h: 24 }, (c) => {
    c.fillStyle = '#9a6a6a'; c.fillRect(PX0 - 30, PB, W - MG - PX0 + 40, 14);
    c.fillStyle = '#7a4e58'; for (let x = PX0 - 30; x < W - MG; x += 16) c.fillRect(x, PB + 4, 8, 2);
  }, { t: 5.0, d: 0.6, reveal: 'wipe' });
  // its reflection in the river, upside down and faint
  p.group('river', { x: PX0 - 20, y: PB + 12, w: PX1 - PX0 + 40, h: DECK - PB }, (c) => {
    c.save(); c.beginPath(); c.rect(PX0 - 20, PB + 14, PX1 - PX0 + 40, DECK - PB); c.clip();
    c.globalAlpha = 0.26; c.translate(0, 2 * PB + 28); c.scale(1, -1); parliamentBody(c, null); parliamentTall(c);
    c.restore();
  }, { t: 6.6, d: 1.2, reveal: 'fall' });
  // the windows lighting up, added after the bridgehead so the layer bakes in order
  return () => p.group('pest', { x: PX0, y: PB - 110, w: PX1 - PX0, h: 80 }, (c) => {
    c.fillStyle = LIT; for (const [x, y] of lit) { poly(c, pointed(x, y, 7, y > PB - 50 ? 26 : 22)); c.fill(); }
  }, { t: 9.4, d: 1.2, reveal: 'fade' });
}

// ---------------------------------------------------------------- the Pest bridgehead
function pestBank(p) {
  const r = rng(31), wins = [];
  const blocks = [[1300, 1214, 132, '#a8786a'], [1432, 1196, 124, '#9a6c62']];
  for (const [x0, top, w] of blocks) for (let y = top + 24; y < DECK - 30; y += 24) for (let x = x0 + 10; x < x0 + w - 12; x += 15) wins.push([x, y, r.chance(0.35)]);
  const trees = [];
  for (let x = 1180; x < 1300; x += r.range(14, 22)) trees.push([x, 1150 + (x - 1180) * 0.4 + r.range(-4, 4), r.range(9, 14)]);
  p.group('pest', { x: 1160, y: 1120, w: W - MG - 1150, h: DECK - 1110 }, (c) => {
    fillP(c, [[1170, 1140], [W - MG, 1140], [W - MG, DECK], [1170, DECK]], '#6a4c5e');
    c.fillStyle = '#3f5a4e'; c.beginPath(); for (const [x, y, s] of trees) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } c.fill();
    for (const [x0, top, w, col] of blocks) {
      fillP(c, [[x0, DECK], [x0, top], [x0 + w, top], [x0 + w, DECK]], col);
      c.fillStyle = PARL_S; c.fillRect(x0 + w - 16, top, 16, DECK - top);
      c.fillStyle = PARL_S; c.fillRect(x0, top + 6, w, 3);
    }
    // the Gresham's gable and its two small green domes
    fillP(c, [[1306, 1214], [1366, 1166], [1426, 1214]], '#b77a6a');
    for (const x of [1306, 1426]) { c.fillStyle = EOSIN; c.beginPath(); c.arc(x, 1214, 15, Math.PI, 0); c.fill(); c.fillRect(x - 2, 1182, 4, 18); }
    for (const [x, y, l] of wins) { c.fillStyle = l ? LIT : PARL_D; c.fillRect(x, y, 7, 13); }
    c.fillStyle = OCHRE; c.fillRect(1180, DECK - 40, 54, 18); c.fillStyle = LIT; for (let x = 1184; x < 1230; x += 9) c.fillRect(x, DECK - 36, 5, 5);
  }, { t: 5.6, d: 1.0, reveal: 'rise' });
}

// ---------------------------------------------------------------- the Chain Bridge
const sag = (x) => lerp(TTOP + 8, DECK - 24, 1 - (2 * (x - T1) / (T2 - T1) - 1) ** 2);
function chainPts(off) {
  const pts = [];
  for (let x = 150; x <= T1; x += 10) { const k = (x - 150) / (T1 - 150); pts.push([x, lerp(DECK - 6, TTOP + 8, k ** 1.3) + off]); }
  for (let x = T1 + 10; x <= T2; x += 10) pts.push([x, sag(x) + off]);
  for (let x = T2 + 10; x <= 1450; x += 10) { const k = (1450 - x) / (1450 - T2); pts.push([x, lerp(DECK - 6, TTOP + 8, k ** 1.3) + off]); }
  return pts;
}
const LAMPS = [];
function bridge(p) {
  LAMPS.length = 0;
  const upper = chainPts(0), lower = chainPts(13);
  p.pen('chain', upper, '#2e2840', 10, { t: 7.0, d: 1.6 });
  p.pen('chain', lower, '#2e2840', 7, { t: 7.25, d: 1.6 });
  // the links, picked out in light
  const links = upper.filter((_, i) => i % 2 === 0);
  p.group('chain', { x: 130, y: TTOP - 10, w: 1340, h: DECK - TTOP + 20 }, (c) => {
    c.fillStyle = '#8a7b96'; for (const [x, y] of links) c.fillRect(x - 3.5, y - 2.5, 7, 3);
  }, { t: 8.6, d: 0.6, reveal: 'wipe' });
  // the hangers
  const hang = [];
  for (let x = 170; x < 1440; x += 20) {
    if (Math.abs(x - T1) < TW + 6 || Math.abs(x - T2) < TW + 6) continue;
    const pt = upper.reduce((a, b) => (Math.abs(b[0] - x) < Math.abs(a[0] - x) ? b : a));
    hang.push([[x, pt[1] + 4], [x, DECK]]);
  }
  p.strokes('chain', hang, '#2e2840', 2.2, { t: 8.4, d: 1.0, reveal: 'wipe', ease: 'inOut' });

  // the towers: triumphal arches of stone, lit warm on the left, shaded on the right
  const AR = 46, AS = 1316; // the arch's half width and where it springs
  [T1, T2].forEach((cx, i) => {
    const t = 5.9 + i * 0.4;
    p.group('bridge', { x: cx - TW - 24, y: DECK - 4, w: 2 * TW + 48, h: WATER - DECK + 30 }, (c) => {
      fillP(c, [[cx - TW - 8, DECK], [cx + TW + 8, DECK], [cx + TW + 16, WATER + 12], [cx - TW - 16, WATER + 12]], STONE_S);
      fillP(c, [[cx + TW - 22, DECK], [cx + TW + 8, DECK], [cx + TW + 16, WATER + 12], [cx + TW - 20, WATER + 12]], STONE_D);
      c.fillStyle = 'rgba(40,30,50,.35)'; for (let y = DECK + 18; y < WATER; y += 16) c.fillRect(cx - TW - 12, y, 2 * TW + 24, 2);
    }, { t, d: 0.7, reveal: 'rise' });
    p.group('bridge', { x: cx - TW - 16, y: TTOP - 40, w: 2 * TW + 32, h: DECK - TTOP + 44 }, (c) => {
      c.fillStyle = STONE;
      c.beginPath(); c.rect(cx - TW, TTOP + 30, 2 * TW, DECK - TTOP - 30);
      c.moveTo(cx - AR, DECK); c.lineTo(cx - AR, AS); c.arc(cx, AS, AR, Math.PI, 0); c.lineTo(cx + AR, DECK); c.closePath();
      c.fill('evenodd');
      c.fillStyle = STONE_S; c.fillRect(cx + TW - 22, TTOP + 30, 22, DECK - TTOP - 30);
      c.fillStyle = STONE_D; c.fillRect(cx + AR - 10, AS - 4, 10, DECK - AS + 4);
      // pilasters, banded rustication, the cornice and the attic
      c.fillStyle = STONE_L; c.fillRect(cx - TW + 6, TTOP + 40, 14, DECK - TTOP - 40); c.fillRect(cx + TW - 36, TTOP + 40, 12, DECK - TTOP - 40);
      c.fillStyle = 'rgba(70,50,60,.3)';
      for (let y = TTOP + 60; y < DECK; y += 20) { c.fillRect(cx - TW, y, 30, 2); c.fillRect(cx + TW - 30, y, 30, 2); }
      fillP(c, [[cx - TW - 10, TTOP + 30], [cx + TW + 10, TTOP + 30], [cx + TW + 6, TTOP + 16], [cx - TW - 6, TTOP + 16]], STONE_L);
      fillP(c, [[cx - TW + 4, TTOP + 16], [cx + TW - 4, TTOP + 16], [cx + TW - 4, TTOP - 16], [cx - TW + 4, TTOP - 16]], STONE);
      c.fillStyle = STONE_S; c.fillRect(cx + TW - 24, TTOP - 16, 20, 32);
      fillP(c, [[cx - TW - 2, TTOP - 16], [cx + TW + 2, TTOP - 16], [cx + TW - 4, TTOP - 26], [cx - TW + 4, TTOP - 26]], STONE_L);
      // the coat of arms over the arch: a red and silver shield under a crown
      c.fillStyle = STONE_S; c.fillRect(cx - 26, TTOP + 46, 52, 66);
      fillP(c, [[cx - 17, TTOP + 62], [cx + 17, TTOP + 62], [cx + 17, TTOP + 88], [cx, TTOP + 104], [cx - 17, TTOP + 88]], OX);
      c.save(); poly(c, [[cx, TTOP + 62], [cx + 17, TTOP + 62], [cx + 17, TTOP + 88], [cx, TTOP + 104]]); c.clip();
      c.fillStyle = IVORY; for (let y = TTOP + 66; y < TTOP + 104; y += 9) c.fillRect(cx, y, 18, 4.5);
      c.restore();
      c.fillStyle = GOLD; c.fillRect(cx - 12, TTOP + 54, 24, 6); for (const dx of [-10, 0, 10]) { c.beginPath(); c.arc(cx + dx, TTOP + 53, 3, 0, Math.PI * 2); c.fill(); }
      // the arch's molding and keystone
      c.strokeStyle = STONE_L; c.lineWidth = 5; c.beginPath(); c.arc(cx, AS, AR + 6, Math.PI, 0); c.stroke();
      fillP(c, [[cx - 9, AS - AR - 12], [cx + 9, AS - AR - 12], [cx + 6, AS - AR + 6], [cx - 6, AS - AR + 6]], STONE_L);
    }, { t: t + 0.4, d: 1.3, reveal: 'rise' });
  });
  // the roadway and its railing
  p.group('bridge', { x: MG, y: DECK - 30, w: W - 2 * MG, h: 60 }, (c) => {
    c.fillStyle = '#4b3f5c'; c.fillRect(MG, DECK, W - 2 * MG, DECK_H);
    c.fillStyle = '#7a6a88'; c.fillRect(MG, DECK, W - 2 * MG, 4);
    c.fillStyle = '#2f2944'; c.fillRect(MG, DECK - 18, W - 2 * MG, 3);
    for (let x = MG; x < W - MG; x += 9) c.fillRect(x, DECK - 18, 2, 18);
  }, { t: 6.6, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // the abutments at the two ends, down into the water
  for (const [x0, x1, t] of [[MG, 280, 6.3], [1320, W - MG, 6.5]]) {
    p.group('bridge', { x: x0 - 4, y: DECK, w: x1 - x0 + 28, h: FR - DECK }, (c) => {
      const slant = x0 === MG ? 20 : -20;
      fillP(c, [[x0, DECK + DECK_H], [x1, DECK + DECK_H], [x1 + slant, FR], [x0, FR]], '#5d4c64');
      c.fillStyle = 'rgba(30,20,40,.35)';
      for (let y = DECK + 40; y < FR; y += 24) c.fillRect(x0, y, x1 - x0 + 16, 2);
      for (let y = DECK + 40, k = 0; y < FR; y += 24, k++) for (let x = x0 + (k % 2) * 30; x < x1; x += 60) c.fillRect(x, y, 2, 24);
    }, { t, d: 0.8, reveal: 'rise' });
  }
  // the lions on their pedestals, couched, one at each end
  for (const [x, dir, t] of [[170, 1, 8.7], [1430, -1, 8.9]]) {
    p.group('bridge', { x: x - 110, y: DECK - 250, w: 220, h: 254 }, (c) => lion(c, x, dir), { t, d: 0.7, reveal: 'pop' });
  }
  // the lamp posts along the railing
  const posts = [];
  for (let x = 290; x < 1320; x += 92) if (Math.abs(x - T1) > TW + 14 && Math.abs(x - T2) > TW + 14) posts.push(x);
  p.group('bridge', { x: 260, y: DECK - 90, w: 1080, h: 94 }, (c) => {
    for (const x of posts) {
      c.fillStyle = '#2a2440'; c.fillRect(x - 2.5, DECK - 70, 5, 70); c.fillRect(x - 7, DECK - 12, 14, 12);
      c.fillRect(x - 14, DECK - 66, 28, 3);
      for (const dx of [-14, 14]) { c.fillRect(x + dx - 5, DECK - 82, 10, 16); fillP(c, [[x + dx - 6, DECK - 82], [x + dx, DECK - 89], [x + dx + 6, DECK - 82]], '#2a2440'); }
    }
  }, { t: 9.0, d: 0.9, reveal: 'wipe' });
  LAMPS.push(...posts);
}

// a couched lion in profile on its pedestal, its head toward dir
function lion(c, x, dir) {
  const P0 = DECK - 120;
  fillP(c, [[x - 84, DECK], [x - 84, P0], [x + 84, P0], [x + 84, DECK]], STONE_S);
  c.fillStyle = STONE_D; c.fillRect(dir > 0 ? x + 58 : x - 84, P0, 26, DECK - P0);
  c.fillStyle = 'rgba(60,40,50,.3)'; c.fillRect(x - 84, P0 + 26, 168, 3); c.fillRect(x - 84, DECK - 20, 168, 3);
  fillP(c, [[x - 90, P0], [x + 90, P0], [x + 84, P0 - 10], [x - 84, P0 - 10]], STONE_L);
  c.save(); c.translate(x, P0 - 10); c.scale(dir * 1.08, 1.08);
  c.fillStyle = STONE;
  c.beginPath();
  c.moveTo(-70, 0); c.bezierCurveTo(-78, -26, -60, -42, -36, -40);
  c.bezierCurveTo(-10, -38, 14, -44, 30, -52);
  c.lineTo(42, -78); c.bezierCurveTo(56, -88, 74, -80, 74, -62);
  c.lineTo(80, -52); c.lineTo(72, -46); c.lineTo(70, -36);
  c.bezierCurveTo(66, -26, 58, -22, 52, -18);
  c.lineTo(84, -12); c.lineTo(84, 0); c.closePath(); c.fill();
  // the mane in shadow with its locks, the paws, the tail along the plinth
  c.fillStyle = STONE_S;
  c.beginPath(); c.moveTo(22, -46); c.bezierCurveTo(20, -84, 44, -100, 64, -90); c.bezierCurveTo(48, -80, 50, -54, 54, -18); c.bezierCurveTo(38, -22, 26, -32, 22, -46); c.fill();
  c.strokeStyle = STONE_D; c.lineWidth = 1.4; c.beginPath();
  for (let k = 0; k < 5; k++) { c.moveTo(28 + k * 5, -48 - k * 6); c.quadraticCurveTo(34 + k * 4, -40 - k * 6, 40 + k * 3, -30 - k * 4); }
  c.moveTo(-36, -38); c.quadraticCurveTo(-48, -20, -40, 0); c.stroke();
  c.fillStyle = STONE; c.beginPath(); c.moveTo(56, -84); c.bezierCurveTo(70, -88, 80, -76, 80, -56); c.lineTo(66, -50); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-70, -4); c.quadraticCurveTo(-92, -4, -86, -22); c.quadraticCurveTo(-80, -10, -66, -10); c.fill();
  c.fillStyle = STONE_D; c.fillRect(56, -8, 26, 3); c.beginPath(); c.arc(66, -66, 2.4, 0, Math.PI * 2); c.fill();
  c.fillRect(74, -52, 6, 2);
  c.restore();
}

// ---------------------------------------------------------------- the water this side of the bridge
function water(p) {
  const x0 = 280, x1 = 1340, y0 = DECK + DECK_H;
  // the sky again, in bands broken by the current
  const bands = [[y0, '#d4605a'], [1486, '#e2845e'], [1548, '#c98a6e'], [1616, '#6e8a82'], [1690, '#3a6278']];
  p.group('near', { x: x0, y: y0, w: x1 - x0, h: FR - y0 }, (c) => {
    bands.forEach(([y, col], k) => { c.fillStyle = col; c.fillRect(x0, y, x1 - x0, FR - y); });
  }, { t: 2.8, d: 1.0, reveal: 'fall' });
  // the piers' and towers' reflections: long dark smudges
  p.group('near', { x: x0, y: WATER, w: x1 - x0, h: FR - WATER }, (c) => {
    c.fillStyle = 'rgba(30,24,50,.4)';
    for (const cx of [T1, T2]) { poly(c, [[cx - TW, WATER + 10], [cx + TW, WATER + 10], [cx + TW - 14, FR], [cx - TW + 14, FR]]); c.fill(); }
  }, { t: 7.0, d: 1.0, reveal: 'fall' });
  // broken edges of each band and short wave strokes
  const r = rng(51), dash = [], waves = [];
  for (let k = 1; k < bands.length; k++) for (let x = x0; x < x1; x += r.range(14, 34)) { dash.push([bands[k][1], x, bands[k][0] - r.range(4, 22), r.range(12, 44)]); dash.push([bands[k - 1][1], x + r.range(0, 20), bands[k][0] + r.range(2, 16), r.range(10, 34)]); }
  for (let i = 0; i < 260; i++) {
    const y = r.range(WATER + 10, FR - 6), k = (y - WATER) / (FR - WATER);
    const x = r.range(x0 + 4, x1 - 40), L = 10 + 40 * k;
    waves.push([[x, y], [x + L * 0.5, y - 2 - 2 * k], [x + L, y]]);
  }
  p.group('near', { x: x0, y: y0, w: x1 - x0, h: FR - y0 }, (c) => {
    for (const [col, x, y, w] of dash) { c.fillStyle = col; c.fillRect(x, y, w, 4); }
  }, { t: 3.6, d: 0.8, reveal: 'wipe' });
  p.strokes('near', waves, 'rgba(250,210,160,.45)', 2, { t: 4.2, d: 1.2, reveal: 'wipe', box: { x: x0, y: WATER, w: x1 - x0, h: FR - WATER } });
  // a rowing boat by the Pest abutment
  p.group('near', { x: 1150, y: 1690, w: 160, h: 60 }, (c) => {
    fillP(c, [[1170, 1720], [1290, 1720], [1272, 1736], [1184, 1736]], '#2a2440');
    c.fillStyle = OX; c.fillRect(1176, 1720, 108, 3);
    c.fillStyle = '#2a2440'; c.beginPath(); c.arc(1226, 1700, 6, 0, Math.PI * 2); c.fill(); c.fillRect(1220, 1704, 12, 16);
    c.strokeStyle = '#2a2440'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(1196, 1744); c.lineTo(1252, 1708); c.stroke();
  }, { t: 9.2, d: 0.6, reveal: 'drop' });
}

// ---------------------------------------------------------------- the frieze, the band and the name
function band(p) {
  // a thin rule round the whole sheet
  p.group('band', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = COBALT; c.lineWidth = 3; c.strokeRect(MG - 16, MG - 16, W - 2 * MG + 32, H - 2 * MG + 32);
    c.lineWidth = 1; c.strokeRect(MG - 24, MG - 24, W - 2 * MG + 48, H - 2 * MG + 48);
  }, { t: 0.1, d: 0.8, reveal: 'fade' });
  // glazed tiles: on ivory, a quatrefoil of eosin and oxblood round an ochre eye, alternating
  const n = 19, w = (W - 2 * MG) / n, ym = (FR + FR1) / 2;
  p.group('band', { x: MG, y: FR - 4, w: W - 2 * MG, h: FR1 - FR + 8 }, (c) => {
    c.fillStyle = IVORY; c.fillRect(MG, FR, W - 2 * MG, FR1 - FR);
    for (let k = 0; k < n; k++) {
      const x = MG + (k + 0.5) * w, a = k % 2 ? OX : EOSIN, b = k % 2 ? EOSIN : OX;
      c.strokeStyle = COBALT; c.lineWidth = 2; c.strokeRect(MG + k * w + 3, FR + 3, w - 6, FR1 - FR - 6);
      for (let q = 0; q < 4; q++) {
        const ang = q * Math.PI / 2;
        c.fillStyle = q % 2 ? b : a;
        c.beginPath(); c.ellipse(x + Math.cos(ang) * 15, ym + Math.sin(ang) * 15, 13, 8, ang, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = OCHRE; c.beginPath(); c.arc(x, ym, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = COBALT; for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { c.beginPath(); c.arc(x + dx * (w / 2 - 10), ym + dy * 27, 3, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(x - 14, ym - 18, 8, 3, -0.5, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = COBALT_D; c.fillRect(MG, FR, W - 2 * MG, 4); c.fillRect(MG, FR1 - 4, W - 2 * MG, 4);
  }, { t: 9.8, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  p.group('band', { x: MG, y: FR1, w: W - 2 * MG, h: BOT - FR1 }, (c) => {
    c.fillStyle = COBALT; c.fillRect(MG, FR1, W - 2 * MG, BOT - FR1);
    c.fillStyle = GOLD_D; c.fillRect(MG + 28, FR1 + 12, W - 2 * MG - 56, 2); c.fillRect(MG + 28, BOT - 14, W - 2 * MG - 56, 2);
  }, { t: 9.6, d: 0.8, reveal: 'fall' });
}
function title(p) {
  p.type('title', 'MAGYARORSZÁG', W / 2, 128, {
    family: FONT, weight: 500, size: 30, color: GOLD, align: 'center', track: 0.6, t: 10.0, gap: 0.04, d: 0.5, reveal: 'fade',
  });
  p.group('title', { x: 300, y: 104, w: 1000, h: 30 }, (c) => {
    c.fillStyle = GOLD_D;
    for (const s of [-1, 1]) { c.fillRect(W / 2 + s * 200 - (s < 0 ? 150 : 0), 117, 150, 2); c.save(); c.translate(W / 2 + s * 368, 118); c.rotate(Math.PI / 4); c.fillRect(-5, -5, 10, 10); c.restore(); }
  }, { t: 10.4, d: 0.6, reveal: 'fade' });
  p.type('title', 'BUDAPEST', W / 2, 352, {
    family: FONT, weight: 800, size: 236, color: GOLD, shadow: OX_D, sx: 8, sy: 8,
    align: 'center', track: 0.06, fit: W - 2 * MG - 110, t: 10.6, gap: 0.16, d: 0.8, reveal: 'press',
  });
  p.type('title', 'A DUNA GYÖNGYE', W / 2, 1922, {
    family: FONT, weight: 500, size: 34, color: GOLD, align: 'center', track: 0.5, t: 12.2, gap: 0.04, d: 0.5,
  });
}

// ---------------------------------------------------------------- life
function life(p) {
  // the lamps on the bridge lighting one after another, and their reflections trembling
  const lamps = LAMPS.flatMap((x) => [[x - 14, DECK - 74], [x + 14, DECK - 74]]);
  const refl = LAMPS.filter((x) => x > 300 && x < 1320);
  p.live('live', {
    t: 9.5, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      lamps.forEach(([x, y], i) => {
        const on = Math.min(1, Math.max(0, (time - 9.5 - i * 0.05) * 3));
        if (!on) return;
        c.globalAlpha = 0.2 * on; c.fillStyle = LIT;
        c.beginPath(); c.arc(x, y, 17, 0, Math.PI * 2); c.fill();
        c.globalAlpha = on; c.fillStyle = '#fff1c2'; c.fillRect(x - 3.5, y - 5, 7, 10);
      });
      c.fillStyle = '#ffd98a';
      refl.forEach((x, i) => {
        const on = Math.min(1, Math.max(0, (time - 10 - i * 0.1) * 2));
        for (let k = 0; k < 7; k++) {
          const y = WATER + 16 + k * 34, w = 12 + 5 * Math.sin(time * 2.4 + k + i);
          c.globalAlpha = 0.5 * on * (1 - k / 8);
          c.fillRect(x - w / 2 + Math.sin(time * 1.8 + k * 1.3 + i) * 4, y, w, 3);
        }
      });
      c.globalAlpha = 1;
    },
  });
  // a paddle steamer coming downstream
  p.live('live', {
    t: 9.3, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const x = 420 + (time - 9.3) * 15, y = 1668;
      c.save(); c.translate(x, y); c.scale(1.3, 1.3); c.translate(-x, -y);
      c.fillStyle = 'rgba(30,24,50,.4)'; c.fillRect(x - 72, y + 6, 156, 8);
      c.fillStyle = '#efe6d4'; poly(c, [[x - 84, y - 18], [x + 94, y - 18], [x + 78, y + 4], [x - 72, y + 4]]); c.fill();
      c.fillStyle = OX; c.fillRect(x - 78, y - 6, 166, 5);
      c.fillStyle = '#d8ccb8'; c.fillRect(x - 48, y - 40, 100, 22);
      c.fillStyle = LIT; for (let k = 0; k < 7; k++) c.fillRect(x - 42 + k * 13, y - 35, 7, 9);
      c.fillStyle = '#2a2440'; c.fillRect(x + 6, y - 70, 12, 30); c.fillStyle = OX; c.fillRect(x + 6, y - 70, 12, 6);
      c.fillStyle = '#d8ccb8'; c.beginPath(); c.arc(x - 6, y - 12, 21, Math.PI, 0); c.fill();
      c.strokeStyle = '#2a2440'; c.lineWidth = 2; c.beginPath();
      for (let k = 0; k < 4; k++) { const a = time * 3 + k * Math.PI / 4; c.moveTo(x - 6 - Math.cos(a) * 17, y - 12 - Math.abs(Math.sin(a)) * 17); c.lineTo(x - 6 + Math.cos(a) * 17, y - 12 - Math.abs(Math.sin(a)) * 3); }
      c.stroke();
      c.fillStyle = 'rgba(220,200,210,1)';
      for (let k = 0; k < 4; k++) { const ph = (time * 0.6 + k / 4) % 1; c.globalAlpha = 0.5 * (1 - ph); c.beginPath(); c.arc(x + 12 - ph * 90, y - 78 - ph * 40, 6 + ph * 14, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1;
      c.restore();
    },
  });
  // the funicular's two cars passing on the slope
  p.live('live', {
    t: 8.0, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      const k = 0.5 + 0.42 * Math.sin((time - 8) * 0.35);
      for (const t of [k, 1 - k]) {
        const x = lerp(604, 430, t), y = lerp(1112, 846, t);
        c.save(); c.translate(x, y); c.rotate(-0.99);
        c.fillStyle = OCHRE; c.fillRect(-14, -10, 28, 12); c.fillStyle = LIT; c.fillRect(-10, -8, 6, 5); c.fillRect(-2, -8, 6, 5); c.fillRect(6, -8, 5, 5);
        c.restore();
      }
    },
  });
  // stars twinkling over the name, and swallows crossing the sky
  const r = rng(61), tw = [], birds = [];
  for (let i = 0; i < 16; i++) tw.push([r.range(MG + 20, W - MG - 20), r.range(MG + 20, 460), r() * 7]);
  for (let i = 0; i < 9; i++) birds.push([r.range(-120, 120), r.range(-40, 40), r() * 6, r.range(0.8, 1.2)]);
  p.live('live', {
    t: 10.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#fff6dc';
      for (const [x, y, ph] of tw) {
        const a = Math.sin(time * 1.6 + ph);
        if (a < 0.4) continue;
        const s = (a - 0.4) * 9;
        c.fillRect(x - s, y - 0.8, 2 * s, 1.6); c.fillRect(x - 0.8, y - s, 1.6, 2 * s);
      }
      const cx = 760 + ((time - 10) * 26) % 900, cy = 560 - Math.sin(time * 0.3) * 30;
      c.strokeStyle = '#2a2440'; c.lineWidth = 2.2; c.lineCap = 'round';
      c.beginPath();
      for (const [dx, dy, ph, s] of birds) {
        const x = cx + dx, y = cy + dy, f = Math.sin(time * 9 + ph) * 3 * s, w = 9 * s;
        c.moveTo(x - w, y - f); c.quadraticCurveTo(x - w * 0.4, y - 3, x, y); c.quadraticCurveTo(x + w * 0.4, y - 3, x + w, y - f);
      }
      c.stroke();
    },
  });
}
