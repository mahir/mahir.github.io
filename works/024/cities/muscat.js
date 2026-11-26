// Muscat: through a carved Omani door. Two heavy teak leaves studded with brass
// stand open into a cool white room; above the opening, a carved lintel holds
// the name in gilded letters. Through it, the old harbor at the end of the
// afternoon: Al Mirani and Al Jalali, the two forts, on the dark crags either
// side of the cove, watchtowers on the ridges, dhows on the water, and in front
// the blue and gold columns of Al Alam Palace over a paved square with palms. On the
// floor of the room, a brass coffee pot and an incense burner, smoking.

import { Plate, W, H, boxOf } from '../print.js';
import { shade, mix, lerp, clamp, poly } from '../kit.js';

// the room: plaster, teak, brass
const PLASTER = '#efe6d4';
const TEAK = '#6e4326', TEAK_D = '#3f2415', TEAK_L = '#9a6338', TEAK_X = '#2b170d';
const BRASS = '#d4a64a', BRASS_L = '#f2d58a', BRASS_D = '#8f6a26';
// the view: late light on the rocks and the water
const SKY_T = '#8fbfcf', SKY_H = '#f4dcb0';
const ROCK = '#76533f', ROCK_D = '#432c22', ROCK_F = '#b9a0a0', ROCK_FF = '#d3bfb6';
const FORT = '#e3c99a', FORT_D = '#b9986a', FORT_L = '#f3e2bd';
const SEA_T = '#4fb3b5', SEA_D = '#1f7486', SEA_F = '#8fcfcf';
const PAL_W = '#f5efe2', PAL_BLUE = '#2a68b0', PAL_BLUE_D = '#1c4a86', GOLD = '#d9a93c', GOLD_L = '#f1cf72';
const PAVE = '#ead9b8', PAVE_D = '#cdb58c', PALM = '#4f7a3a', PALM_D = '#2f5430', TRUNK = '#8b6a45';

export const city = {
  id: 'muscat', name: 'Muscat',
  alt: "The old harbor of Muscat seen through a carved Omani door of teak and brass studs standing open: the forts of Al Mirani and Al Jalali on the dark crags either side of the cove, watchtowers on the ridges, dhows on the water, the blue and gold columns of Al Alam Palace over a square with palms, and on the floor a brass coffee pot and a smoking incense burner, under the name مسقط carved in the lintel with MUSCAT",
  google: 'family=El+Messiri:wght@500;700',
  wall: '#2c1a12',
  fonts: [['700 150px "El Messiri"', 'مسقط'], ['500 42px "El Messiri"', 'MUSCAT']],
  build,
};

// the opening, the jambs and the lintel
const OX0 = 340, OX1 = 1260, OY0 = 470, OY1 = 1640;
const JW = 92, LY0 = 90, FLOOR = 1712;

function build() {
  const p = new Plate({ paper: PLASTER, seed: 968 });
  const r = p.r;
  p.clip = { x: OX0, y: OY0, w: OX1 - OX0, h: OY1 - OY0 };
  p.stack('sky', 'far', 'rock', 'forts', 'sea', 'palace', 'square', 'live', 'room', 'door', 'leaves', 'lintel', 'title', 'floor', 'smoke');
  for (const n of ['room', 'door', 'leaves', 'lintel', 'title', 'floor', 'smoke']) p.layer(n, { clip: false });

  room(p, r);
  sky(p, r);
  mountains(p, r);
  forts(p, r);
  sea(p, r);
  palace(p, r);
  square(p, r);
  boats(p, r);
  door(p, r);
  leaves(p, r);
  lintel(p, r);
  floor(p, r);
  return p;
}

// ================================================================ the room
function room(p, r) {
  // the plaster wall around the door: lime wash, with the light coming in through it
  p.group('room', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = PLASTER; c.beginPath(); c.rect(0, 0, W, FLOOR); c.rect(OX0, OY0, OX1 - OX0, OY1 - OY0); c.fill('evenodd');
    // a soft darkening toward the corners of the room
    const g = c.createRadialGradient(800, 1000, 500, 800, 1000, 1250);
    g.addColorStop(0, 'rgba(120,96,70,0)'); g.addColorStop(1, 'rgba(120,96,70,.28)');
    c.fillStyle = g; c.beginPath(); c.rect(0, 0, W, FLOOR); c.rect(OX0, OY0, OX1 - OX0, OY1 - OY0); c.fill('evenodd');
  }, { t: 0, d: 0.6, reveal: 'fade' });
  // trowel marks in the lime: faint strokes
  const marks = [];
  for (let i = 0; i < 260; i++) {
    const x = r.range(0, W), y = r.range(0, FLOOR - 10);
    if (x > OX0 - JW - 60 && x < OX1 + JW + 60 && y > LY0 - 40) continue;
    const a = r.range(-0.4, 0.4), L = r.range(20, 70);
    marks.push([[x, y], [x + Math.cos(a) * L, y + Math.sin(a) * L * 0.4]]);
  }
  p.strokes('room', marks, 'rgba(170,150,118,.35)', 2.2, { t: 0.3, d: 0.8, reveal: 'fade', box: { x: 0, y: 0, w: W, h: FLOOR } });
}

// ================================================================ the view
function sky(p, r) {
  const bands = 8, y0 = OY0, y1 = 1000;
  for (let i = 0; i < bands; i++) {
    const ya = lerp(y0, y1, i / bands), col = mix(SKY_T, SKY_H, (i / (bands - 1)) ** 1.2);
    p.group('sky', { x: OX0, y: ya - 2, w: OX1 - OX0, h: y1 - ya + 4 }, (c) => { c.fillStyle = col; c.fillRect(OX0, ya, OX1 - OX0, y1 - ya + 300); },
      { t: 0.4 + i * 0.09, d: 0.7, reveal: 'fall', ease: 'soft' });
  }
  // the low sun's haze over the sea mouth
  p.group('sky', { x: OX0, y: 650, w: OX1 - OX0, h: 400 }, (c) => {
    const g = c.createRadialGradient(820, 930, 10, 820, 930, 330);
    g.addColorStop(0, 'rgba(255,240,205,.9)'); g.addColorStop(1, 'rgba(255,240,205,0)');
    c.fillStyle = g; c.fillRect(OX0, 650, OX1 - OX0, 400);
  }, { t: 1.2, d: 1.2, reveal: 'fade' });
  // thin high clouds
  [[420, 560, 300], [880, 520, 360], [700, 620, 220], [1060, 600, 180]].forEach(([x, y, w], i) => {
    const pts = [];
    for (let k = 0; k <= 20; k++) { const t = k / 20; pts.push([x + t * w, y - 9 * Math.sin(t * Math.PI) ** 0.5]); }
    pts.push([x + w, y + 2], [x, y + 2]);
    p.fill('sky', pts, '#fbf1dc', { t: 1.4 + i * 0.15, d: 1.0, reveal: i % 2 ? 'wipeL' : 'wipe' });
  });
}

// a jagged ridge: points from x0 to x1 over a base line, peaking at px with height h
function ridge(r, x0, x1, base, px, h, rough = 0.12, n = 50) {
  const pts = [];
  let wob = 0;
  for (let k = 0; k <= n; k++) {
    const x = lerp(x0, x1, k / n);
    const t = x < px ? (x - x0) / (px - x0) : (x1 - x) / (x1 - px);
    wob = wob * 0.6 + r.range(-1, 1) * rough;
    pts.push([x, base - h * clamp(Math.pow(clamp(t), 0.8) + wob * 0.5, 0, 1.08)]);
  }
  return pts;
}

// a rock mass with a lit face and a shaded face split at its peak, and strata lines
function crag(p, layer, r, pts, base, light, dark, t, o = {}) {
  let pk = 0; pts.forEach(([, y], i) => { if (y < pts[pk][1]) pk = i; });
  const shape = [...pts, [pts[pts.length - 1][0], base], [pts[0][0], base]];
  // the shadow face: from the peak down and to the right, a wandering crease
  const crease = [pts[pk]];
  let x = pts[pk][0];
  for (let y = pts[pk][1]; y < base; y += 22) { x += r.range(-4, 14) * (o.flip ? -1 : 1); crease.push([x, y]); }
  const shadeSide = o.flip
    ? [...pts.slice(0, pk + 1), ...crease.slice(1), [crease[crease.length - 1][0], base], [pts[0][0], base]]
    : [...crease, [crease[crease.length - 1][0], base], [pts[pts.length - 1][0], base], ...pts.slice(pk).reverse()];
  const strata = [];
  const b = boxOf(shape, 4);
  for (let i = 0; i < (o.strata ?? 26); i++) {
    const y = r.range(b.y + 20, base - 6), xs = r.range(b.x, b.x + b.w), L = r.range(20, 80);
    strata.push([[xs, y], [xs + L * 0.5, y + r.range(-4, 6)], [xs + L, y + r.range(-3, 8)]]);
  }
  const gullies = [];
  for (let i = 0; i < (o.gullies ?? 12); i++) {
    const k = r.int(2, pts.length - 3), [gx, gy] = pts[k];
    const L = r.range(40, 150);
    gullies.push([[gx, gy + 4], [gx + r.range(-10, 10), gy + L * 0.5], [gx + r.range(-16, 16), gy + L]]);
  }
  // angular facets of broken rock, lighter and darker
  const facets = [];
  for (let i = 0; i < (o.facets ?? 0); i++) {
    const x = r.range(b.x, b.x + b.w), y = r.range(b.y + 10, base), s = r.range(10, 34);
    const pts0 = [[x, y], [x + s * r.range(0.6, 1.4), y + s * r.range(-0.3, 0.4)], [x + s * r.range(0.2, 1), y + s * r.range(0.6, 1.3)]];
    facets.push([pts0, r.chance(0.5)]);
  }
  p.group(layer, b, (c) => {
    c.fillStyle = light; poly(c, shape); c.fill();
    c.save(); poly(c, shape); c.clip();
    c.fillStyle = dark; poly(c, shadeSide); c.fill();
    for (const [pts0, up] of facets) { c.fillStyle = up ? mix(light, '#fff4e0', 0.1) : mix(light, dark, 0.5); poly(c, pts0); c.fill(); }
    c.strokeStyle = shade(dark, 0.8); c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();
    for (const l of gullies) { c.moveTo(l[0][0], l[0][1]); c.quadraticCurveTo(l[1][0], l[1][1], l[2][0], l[2][1]); } c.stroke();
    c.strokeStyle = mix(light, dark, 0.5); c.lineWidth = 1.6; c.beginPath();
    for (const l of strata) { c.moveTo(l[0][0], l[0][1]); c.quadraticCurveTo(l[1][0], l[1][1], l[2][0], l[2][1]); } c.stroke();
    c.restore();
  }, { t, d: 1.0, reveal: 'rise', ease: 'out' });
  return pts;
}

let RIDGES = {};
function mountains(p, r) {
  // far ranges in haze, then the two crags that hold the cove
  const f1 = crag(p, 'far', r, ridge(r, OX0 - 20, 760, 960, 560, 230, 0.08), 980, ROCK_FF, mix(ROCK_FF, ROCK_F, 0.6), 1.6, { strata: 6, gullies: 4 });
  const f2 = crag(p, 'far', r, ridge(r, 860, OX1 + 20, 960, 1080, 280, 0.08), 980, ROCK_FF, mix(ROCK_FF, ROCK_F, 0.6), 1.75, { strata: 6, gullies: 4, flip: true });
  crag(p, 'far', r, ridge(r, OX0 - 20, 690, 1000, 420, 300, 0.12), 1020, ROCK_F, mix(ROCK_F, ROCK, 0.45), 2.0, { strata: 10, gullies: 6, facets: 20 });
  crag(p, 'far', r, ridge(r, 930, OX1 + 20, 1000, 1210, 360, 0.12), 1020, ROCK_F, mix(ROCK_F, ROCK, 0.45), 2.15, { strata: 10, gullies: 6, flip: true, facets: 20 });
  // the near crags, dark, down to the water
  RIDGES.L = crag(p, 'rock', r, ridge(r, OX0 - 30, 690, 1130, 470, 420, 0.3, 90), 1140, ROCK, ROCK_D, 2.5, { strata: 40, gullies: 18, facets: 70 });
  RIDGES.R = crag(p, 'rock', r, ridge(r, 900, OX1 + 30, 1130, 1150, 470, 0.3, 90), 1140, ROCK, ROCK_D, 2.7, { strata: 40, gullies: 18, flip: true, facets: 70 });
  // watchtowers on the far ridges: small round towers
  // watchtowers stand on the highest points of the far ridges
  const peak = (pts, a, b) => pts.filter(([x]) => x > a && x < b).reduce((m, q) => (q[1] < m[1] ? q : m), [0, Infinity]);
  const towers = [[...peak(f1, 500, 620), 0.8], [...peak(f2, 1020, 1140), 0.9]].map(([x, y, s]) => [x, y + 4, s]);
  towers.forEach(([x, y, s], i) => {
    p.group('forts', { x: x - 20 * s, y: y - 50 * s, w: 40 * s, h: 60 * s }, (c) => watchtower(c, x, y, s), { t: 3.0 + i * 0.12, d: 0.6, reveal: 'rise' });
  });
}

function watchtower(c, x, y, s) {
  c.fillStyle = FORT_D; c.fillRect(x - 9 * s, y - 34 * s, 18 * s, 36 * s);
  c.fillStyle = FORT; c.fillRect(x - 9 * s, y - 34 * s, 10 * s, 36 * s);
  c.fillStyle = FORT_D;
  for (let k = 0; k < 4; k++) c.fillRect(x - 9 * s + k * 5 * s, y - 38 * s, 3 * s, 4 * s);
  c.fillStyle = TEAK_D; c.fillRect(x - 1.5 * s, y - 24 * s, 3 * s, 6 * s);
}

// a fort: walls stepping down a crag, round towers, crenellations, slits
function forts(p, r) {
  // the ground line of a crag at x
  const top = (pts, x) => { for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return lerp(y0, y1, (x - x0) / (x1 - x0)); } return pts[pts.length - 1][1]; };
  let prof = null; // the rock's profile under the fort being drawn
  const foot = (x0, x1, yb) => Math.max(yb, prof(x0), prof(x1), prof((x0 + x1) / 2)) + 12 - yb;
  const block = (c, x0, x1, yb, h, lit = true) => {
    const f = foot(x0, x1, yb);
    // a battered foot, sloping out to the rock
    c.fillStyle = lit ? FORT : FORT_D; c.beginPath(); c.moveTo(x0, yb - h * 0.4); c.lineTo(x0 - 7, yb + f); c.lineTo(x1 + 7, yb + f); c.lineTo(x1, yb - h * 0.4); c.fill();
    c.fillRect(x0, yb - h, x1 - x0, h + f);
    c.fillStyle = lit ? FORT_L : FORT; c.fillRect(x0, yb - h, Math.min(6, (x1 - x0) * 0.2), h + f);
    c.fillStyle = lit ? FORT : FORT_D;
    for (let x = x0; x < x1 - 3; x += 9) c.fillRect(x, yb - h - 6, 5, 6);
    c.fillStyle = TEAK_D; for (let x = x0 + 10; x < x1 - 8; x += 22) c.fillRect(x, yb - h + 14, 3, 8);
  };
  const roundTower = (c, x, yb, w, h) => {
    const f = foot(x - w / 2, x + w / 2, yb);
    c.fillStyle = FORT_D; c.beginPath(); c.moveTo(x - w / 2, yb - h * 0.35); c.lineTo(x - w / 2 - 8, yb + f); c.lineTo(x + w / 2 + 8, yb + f); c.lineTo(x + w / 2, yb - h * 0.35); c.fill();
    c.fillStyle = FORT; c.beginPath(); c.moveTo(x - w / 2, yb - h * 0.35); c.lineTo(x - w / 2 - 8, yb + f); c.lineTo(x, yb + f); c.lineTo(x, yb - h * 0.35); c.fill();
    c.fillStyle = FORT_D; c.fillRect(x - w / 2, yb - h, w, h + f);
    c.fillStyle = FORT; c.fillRect(x - w / 2, yb - h, w * 0.55, h + f);
    c.fillStyle = FORT_L; c.fillRect(x - w / 2 + 3, yb - h, w * 0.18, h + f);
    // a rounded shade on the far side
    c.fillStyle = shade(FORT_D, 0.85); c.fillRect(x + w * 0.32, yb - h, w * 0.18, h + f);
    // the rounded crown of merlons
    c.fillStyle = FORT; c.beginPath();
    const n = Math.round(w / 9);
    for (let k = 0; k < n; k++) { const mx = x - w / 2 + (k + 0.42) * (w / n), mw = (w / n) * 0.3; c.moveTo(mx - mw, yb - h); c.lineTo(mx - mw, yb - h - 6); c.arc(mx, yb - h - 6, mw, Math.PI, 0); c.lineTo(mx + mw, yb - h); }
    c.fill();
    c.fillStyle = FORT_D; c.fillRect(x - w / 2, yb - h + 4, w, 3);
    c.fillStyle = TEAK_D;
    for (let k = 0; k < 3; k++) c.fillRect(x - 2, yb - h + 22 + k * 26, 4, 10);
  };
  // Al Mirani on the left crag: a tall round tower over walls stepping down
  const L = RIDGES.L, R = RIDGES.R;
  const ml = (x) => top(L, x);
  p.group('forts', { x: 360, y: 560, w: 330, h: 500 }, (c) => {
    prof = ml;
    block(c, 520, 590, ml(555) + 10, 34, false);
    block(c, 446, 530, ml(488) + 8, 42);
    roundTower(c, 470, ml(470) + 6, 36, 84);
    block(c, 392, 450, ml(420) + 10, 28);
    roundTower(c, 590, ml(590) + 8, 26, 40);
  }, { t: 3.3, d: 1.0, reveal: 'rise' });
  // Al Jalali on the right crag: long walls along the ridge with two round towers
  const mr = (x) => top(R, x);
  p.group('forts', { x: 940, y: 520, w: 330, h: 540 }, (c) => {
    prof = mr;
    block(c, 1000, 1100, mr(1050) + 10, 32, false);
    block(c, 1096, 1210, mr(1150) + 8, 40);
    roundTower(c, 1016, mr(1016) + 10, 30, 50);
    roundTower(c, 1170, mr(1170) + 8, 38, 76);
    block(c, 1210, 1262, mr(1236) + 10, 30, false);
  }, { t: 3.6, d: 1.0, reveal: 'rise' });
  // stepped paths and walls running down the rock to the water
  const steps = [];
  for (const [x0, y0, x1, y1] of [[470, 820, 520, 1100], [600, 900, 640, 1110], [1010, 860, 960, 1100], [1180, 840, 1130, 1110]]) {
    const pts = [];
    for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([lerp(x0, x1, t) + (k % 2 ? 6 : -6), lerp(y0, y1, t)]); }
    steps.push(pts);
  }
  p.strokes('forts', steps, FORT_D, 4, { t: 3.9, d: 0.9, reveal: 'fall' });
}

function sea(p, r) {
  // the cove between the crags, the open sea beyond its mouth
  const y0 = 960;
  p.group('sea', { x: OX0, y: y0 - 2, w: OX1 - OX0, h: 400 }, (c) => {
    c.fillStyle = SEA_F; c.fillRect(OX0, y0, OX1 - OX0, 400);
    const steps = [[1000, mix(SEA_F, SEA_T, 0.5)], [1040, SEA_T], [1100, mix(SEA_T, SEA_D, 0.4)], [1170, mix(SEA_T, SEA_D, 0.7)]];
    for (const [y, col] of steps) { c.fillStyle = col; c.fillRect(OX0, y, OX1 - OX0, 400); }
  }, { t: 2.2, d: 0.9, reveal: 'fall' });
  // the ground of the square, plain, until it is paved
  p.group('sea', { x: OX0, y: 1200, w: OX1 - OX0, h: OY1 - 1200 }, (c) => { c.fillStyle = PAVE; c.fillRect(OX0, 1300, OX1 - OX0, OY1 - 1300); },
    { t: 2.4, d: 0.8, reveal: 'fall' });
  // the sun's path on the water
  const glint = [], ripples = [];
  for (let i = 0; i < 90; i++) {
    const y = r.range(968, 1060), w = (y - 960) * 0.3 + 8, x = 820 + r.gauss() * w;
    glint.push([[x - r.range(4, 14), y], [x + r.range(4, 14), y]]);
  }
  for (let i = 0; i < 260; i++) {
    const y = r.range(990, 1300), k = (y - 960) / 300, x = r.range(OX0, OX1), L = 6 + k * 26;
    ripples.push([[x - L, y], [x - L * 0.3, y - 1.5 - k * 2], [x + L * 0.4, y], [x + L, y - 1]]);
  }
  p.strokes('sea', ripples, 'rgba(230,248,240,.75)', 1.6, { t: 2.8, d: 1.0, reveal: 'wipe', box: { x: OX0, y: 980, w: OX1 - OX0, h: 340 } });
  p.strokes('sea', glint, '#fff6dc', 2, { t: 3.0, d: 0.9, reveal: 'fade', box: { x: OX0, y: 960, w: OX1 - OX0, h: 110 } });
  // foam where the crags meet the water
  const foam = [];
  for (const [x0, x1] of [[OX0, 700], [900, OX1]]) for (let x = x0; x < x1; x += r.range(14, 30)) foam.push([[x, 1132 + r.range(-3, 3)], [x + r.range(8, 20), 1132 + r.range(-3, 3)]]);
  p.strokes('sea', foam, '#f2fbf6', 2.4, { t: 3.2, d: 0.8, reveal: 'wipe', box: { x: OX0, y: 1120, w: OX1 - OX0, h: 30 } });
}

// ================================================================ the palace
function palace(p, r) {
  const yb = 1420; // its foot on the square
  // the shore at the head of the cove: a quay and the old town's white houses
  const houses = [];
  for (let x = OX0 - 10; x < OX1 + 10;) {
    const w = r.range(36, 80), h = r.range(40, 90);
    houses.push([x, w, h, r.chance(0.3), r.int(1, 3)]);
    x += w - 4;
  }
  p.group('palace', { x: OX0, y: 1090, w: OX1 - OX0, h: 240 }, (c) => {
    c.fillStyle = PAVE_D; c.fillRect(OX0, 1196, OX1 - OX0, 120);
    c.fillStyle = PAVE; c.fillRect(OX0, 1190, OX1 - OX0, 8);
    for (const [x, w, h, tint, n] of houses) {
      const y = 1196 - h;
      c.fillStyle = tint ? '#efe0c4' : PAL_W; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(150,120,90,.25)'; c.fillRect(x + w - 8, y, 8, h);
      c.fillStyle = tint ? '#e3cfa8' : '#e6ddca'; for (let k = 0; k < w - 6; k += 8) c.fillRect(x + 3 + k, y - 5, 5, 5);
      c.fillStyle = '#5b6f86';
      for (let j = 0; j < n; j++) for (let k = x + 9; k < x + w - 12; k += 18) c.fillRect(k, y + 14 + j * 26, 7, 12);
    }
  }, { t: 4.0, d: 0.9, reveal: 'rise' });
  // the long low wings, white with blue-trimmed arcades
  for (const [x0, x1, i] of [[380, 610, 0], [990, 1220, 1]]) {
    p.group('palace', { x: x0 - 6, y: 1200, w: x1 - x0 + 12, h: yb - 1200 + 6 }, (c) => {
      c.fillStyle = PAL_W; c.fillRect(x0, 1250, x1 - x0, yb - 1250);
      c.fillStyle = shade(PAL_W, 0.86); c.fillRect(x0, 1250, x1 - x0, 10);
      c.fillStyle = GOLD; c.fillRect(x0, 1240, x1 - x0, 10);
      c.fillStyle = PAL_BLUE; c.fillRect(x0, 1232, x1 - x0, 8);
      // arcades: two stories of pointed openings in shade
      for (const [ya, hh] of [[1272, 52], [1340, 70]]) {
        for (let x = x0 + 14; x < x1 - 20; x += 30) {
          c.fillStyle = PAL_BLUE_D; c.beginPath(); c.moveTo(x, ya + hh); c.lineTo(x, ya + 14); c.quadraticCurveTo(x + 10, ya - 4, x + 20, ya + 14); c.lineTo(x + 20, ya + hh); c.fill();
          c.fillStyle = mix(PAL_BLUE_D, '#000', 0.25); c.fillRect(x, ya + hh - 8, 20, 8);
        }
      }
    }, { t: 4.4 + i * 0.15, d: 0.9, reveal: 'rise' });
  }
  // the central block behind the portico
  p.group('palace', { x: 600, y: 1130, w: 400, h: yb - 1130 + 6 }, (c) => {
    c.fillStyle = shade(PAL_W, 0.94); c.fillRect(610, 1170, 380, yb - 1170);
    c.fillStyle = PAL_BLUE; c.fillRect(610, 1160, 380, 12);
    c.fillStyle = GOLD; c.fillRect(610, 1150, 380, 10);
    // windows behind the columns, in blue shade
    c.fillStyle = PAL_BLUE_D;
    for (let x = 630; x < 980; x += 34) { c.fillRect(x, 1210, 16, 50); c.fillRect(x, 1300, 16, 80); }
  }, { t: 4.8, d: 0.9, reveal: 'rise' });
  // the portico: tall slender columns, blue below, flaring gold capitals like funnels
  const cols = 8, x0 = 560, x1 = 1040, top = 1120;
  for (let i = 0; i < cols; i++) {
    const x = lerp(x0, x1, i / (cols - 1));
    p.group('palace', { x: x - 40, y: top - 10, w: 80, h: yb - top + 16 }, (c) => {
      c.fillStyle = PAL_BLUE; c.fillRect(x - 6, top + 70, 12, yb - top - 70);
      c.fillStyle = PAL_BLUE_D; c.fillRect(x + 1, top + 70, 5, yb - top - 70);
      // the gold capital, flared
      c.fillStyle = GOLD; c.beginPath(); c.moveTo(x - 6, top + 74); c.bezierCurveTo(x - 8, top + 40, x - 30, top + 22, x - 36, top + 12); c.lineTo(x + 36, top + 12); c.bezierCurveTo(x + 30, top + 22, x + 8, top + 40, x + 6, top + 74); c.fill();
      c.fillStyle = GOLD_L; c.beginPath(); c.moveTo(x - 6, top + 74); c.bezierCurveTo(x - 8, top + 40, x - 30, top + 22, x - 36, top + 12); c.lineTo(x - 22, top + 12); c.bezierCurveTo(x - 12, top + 26, x - 4, top + 44, x - 3, top + 74); c.fill();
      c.fillStyle = PAL_BLUE; c.fillRect(x - 8, top + 72, 16, 6);
      // the base
      c.fillStyle = GOLD; c.fillRect(x - 9, yb - 14, 18, 14);
    }, { t: 5.3 + i * 0.1, d: 0.8, reveal: 'rise' });
  }
  // the roof slab over the columns: a blue fascia with a gold band
  p.group('palace', { x: 520, y: 1070, w: 560, h: 70 }, (c) => {
    c.fillStyle = PAL_BLUE; c.fillRect(520, 1086, 560, 26);
    c.fillStyle = GOLD; c.fillRect(520, 1076, 560, 10); c.fillRect(520, 1112, 560, 6);
    c.fillStyle = PAL_BLUE_D; for (let x = 530; x < 1075; x += 20) c.fillRect(x, 1092, 10, 14);
    c.fillStyle = GOLD_L; c.fillRect(520, 1076, 560, 3);
  }, { t: 6.2, d: 0.8, reveal: 'wipe' });
  // the steps up to the portico
  p.group('palace', { x: 540, y: yb - 4, w: 520, h: 50 }, (c) => {
    for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? PAVE_D : PAVE; c.fillRect(540 - k * 6, yb + k * 10, 520 + k * 12, 10); }
  }, { t: 6.4, d: 0.6, reveal: 'fade' });
}

// ================================================================ the square
function square(p, r) {
  const y0 = 1450;
  // paving in perspective: lines to a point beyond the palace
  const vx = 800, vy = 1180;
  const lines = [];
  for (let k = -14; k <= 14; k++) { const xb = 800 + k * 90; const t = (y0 - vy) / (OY1 + 40 - vy); lines.push([[lerp(vx, xb, t), y0], [xb, OY1 + 40]]); }
  for (let y = y0 + 8; y < OY1; y += (y - vy) * 0.12) lines.push([[OX0, y], [OX1, y]]);
  p.group('square', { x: OX0, y: y0 - 6, w: OX1 - OX0, h: OY1 - y0 + 10 }, (c) => {
    c.fillStyle = PAVE; c.fillRect(OX0, y0, OX1 - OX0, OY1 - y0);
    c.strokeStyle = PAVE_D; c.lineWidth = 1.5; c.beginPath();
    for (const l of lines) { c.moveTo(l[0][0], l[0][1]); c.lineTo(l[1][0], l[1][1]); } c.stroke();
    // a long shadow from the door across the square
    c.fillStyle = 'rgba(120,90,60,.12)'; c.fillRect(OX0, OY1 - 60, OX1 - OX0, 60);
  }, { t: 6.6, d: 0.8, reveal: 'fall' });
  // low white walls with gold-tipped railings, left and right
  p.group('square', { x: OX0, y: 1420, w: OX1 - OX0, h: 60 }, (c) => {
    for (const [x0, x1] of [[OX0, 560], [1040, OX1]]) {
      c.fillStyle = PAL_W; c.fillRect(x0, 1440, x1 - x0, 26);
      c.fillStyle = shade(PAL_W, 0.85); c.fillRect(x0, 1460, x1 - x0, 6);
      c.fillStyle = GOLD; for (let x = x0 + 6; x < x1; x += 14) c.fillRect(x, 1428, 3, 12);
    }
  }, { t: 6.8, d: 0.7, reveal: 'wipe' });
  // palms: two tall date palms and smaller ones along the square
  const palms = [[420, 1540, 1.25], [1180, 1560, 1.35], [560, 1470, 0.75], [1050, 1470, 0.75], [700, 1455, 0.5], [900, 1455, 0.5]];
  palms.sort((a, b) => a[1] - b[1]).forEach(([x, y, s], i) => {
    const h = 300 * s, lean = (x < 800 ? -1 : 1) * 18 * s;
    const tx = x + lean, ty = y - h;
    const fronds = [];
    for (let k = 0; k < 11; k++) {
      const a = -Math.PI / 2 + (k / 10 - 0.5) * 3.6, L = r.range(80, 110) * s;
      fronds.push([a, L, r.range(0.3, 0.6)]);
    }
    p.group('square', { x: tx - 130 * s, y: ty - 80 * s, w: 260 * s, h: h + 100 * s }, (c) => {
      // the trunk with its ring scars
      c.strokeStyle = TRUNK; c.lineWidth = 11 * s; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + lean * 0.2, y - h * 0.5, tx, ty); c.stroke();
      c.strokeStyle = shade(TRUNK, 0.7); c.lineWidth = 2 * s; c.beginPath();
      for (let k = 1; k < 16; k++) { const t = k / 16, px = lerp(x, tx, t * t * 0.4 + t * 0.6), py = lerp(y, ty, t); c.moveTo(px - 5 * s, py); c.lineTo(px + 5 * s, py - 2 * s); }
      c.stroke();
      // fronds: arcs with leaflets
      for (const [a, L, droop] of fronds) {
        const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.6 + droop * L * 0.7;
        const mx = tx + Math.cos(a) * L * 0.55, my = ty + Math.sin(a) * L * 0.6 - 10 * s;
        c.strokeStyle = a < -Math.PI / 2 ? PALM : PALM_D; c.lineWidth = 2.4 * s;
        c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
        c.lineWidth = 1.4 * s; c.beginPath();
        for (let k = 2; k < 12; k++) {
          const t = k / 12, qx = (1 - t) ** 2 * tx + 2 * (1 - t) * t * mx + t * t * ex, qy = (1 - t) ** 2 * ty + 2 * (1 - t) * t * my + t * t * ey;
          const ll = 16 * s * (1 - t * 0.6);
          c.moveTo(qx, qy); c.lineTo(qx + Math.cos(a + 1.2) * ll * 0.5, qy + ll);
          c.moveTo(qx, qy); c.lineTo(qx + Math.cos(a - 1.2) * ll * 0.5, qy + ll * 0.9);
        }
        c.stroke();
      }
      c.fillStyle = '#c98a2e'; c.beginPath(); c.arc(tx - 4 * s, ty + 8 * s, 6 * s, 0, Math.PI * 2); c.arc(tx + 6 * s, ty + 9 * s, 5 * s, 0, Math.PI * 2); c.fill();
    }, { t: 7.0 + i * 0.15, d: 0.8, reveal: 'rise' });
  });
  // lamp posts along the square
  const lamps = [[620, 1500, 0.7], [980, 1500, 0.7], [520, 1600, 1], [1080, 1600, 1]];
  p.group('square', { x: 480, y: 1380, w: 640, h: 240 }, (c) => {
    for (const [x, y, s] of lamps) {
      c.fillStyle = GOLD; c.fillRect(x - 2 * s, y - 110 * s, 4 * s, 110 * s);
      c.fillStyle = PAL_W; c.beginPath(); c.arc(x, y - 116 * s, 9 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD; c.fillRect(x - 6 * s, y - 106 * s, 12 * s, 3 * s); c.fillRect(x - 5 * s, y - 4 * s, 10 * s, 4 * s);
    }
  }, { t: 7.6, d: 0.6, reveal: 'rise' });
  // people: white dishdashas and a few dark abayas, small
  const folk = [];
  for (let i = 0; i < 16; i++) { const y = r.range(1470, 1630), s = 0.5 + (y - 1450) / 300; folk.push([r.range(OX0 + 30, OX1 - 30), y, s, r.chance(0.7)]); }
  folk.sort((a, b) => a[1] - b[1]);
  p.group('square', { x: OX0, y: 1400, w: OX1 - OX0, h: 260 }, (c) => {
    for (const [x, y, s, white] of folk) {
      c.fillStyle = 'rgba(110,80,50,.25)'; c.beginPath(); c.ellipse(x + 8 * s, y, 12 * s, 3 * s, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = white ? '#fbfaf4' : '#2a2430';
      c.beginPath(); c.moveTo(x - 6 * s, y); c.lineTo(x - 4 * s, y - 34 * s); c.lineTo(x + 4 * s, y - 34 * s); c.lineTo(x + 6 * s, y); c.fill();
      c.fillStyle = white ? '#ece6d6' : '#2a2430'; c.fillRect(x + 1 * s, y - 34 * s, 3 * s, 34 * s);
      c.fillStyle = white ? '#f3efe4' : '#2a2430'; c.beginPath(); c.arc(x, y - 39 * s, 5 * s, 0, Math.PI * 2); c.fill();
      if (white) { c.fillStyle = '#8a5a3a'; c.fillRect(x - 3 * s, y - 39 * s, 6 * s, 3 * s); }
    }
  }, { t: 8.0, d: 0.6, reveal: 'fade' });
}

// ================================================================ dhows
function dhow(c, x, y, s, sail, flip = 1) {
  // the hull: a long curved boat with a raised stern
  c.fillStyle = '#6a4228';
  c.beginPath();
  c.moveTo(x - 60 * s * flip, y - 14 * s);
  c.quadraticCurveTo(x - 30 * s * flip, y + 6 * s, x + 30 * s * flip, y + 4 * s);
  c.lineTo(x + 56 * s * flip, y - 18 * s); c.lineTo(x + 50 * s * flip, y - 6 * s);
  c.lineTo(x - 52 * s * flip, y - 6 * s); c.closePath(); c.fill();
  c.fillStyle = '#e8d9b4'; c.fillRect(Math.min(x - 50 * s * flip, x + 46 * s * flip), y - 9 * s, 96 * s, 2.5 * s);
  c.strokeStyle = '#3f2415'; c.lineWidth = 2 * s;
  c.beginPath(); c.moveTo(x - 4 * s * flip, y - 8 * s); c.lineTo(x - 2 * s * flip, y - 96 * s); c.stroke();
  if (sail) {
    // the lateen sail on its long slanted yard
    c.fillStyle = sail;
    c.beginPath(); c.moveTo(x - 50 * s * flip, y - 36 * s); c.lineTo(x + 30 * s * flip, y - 120 * s); c.quadraticCurveTo(x + 36 * s * flip, y - 60 * s, x + 10 * s * flip, y - 14 * s); c.closePath(); c.fill();
    c.fillStyle = 'rgba(120,90,60,.25)';
    c.beginPath(); c.moveTo(x - 50 * s * flip, y - 36 * s); c.lineTo(x + 10 * s * flip, y - 14 * s); c.lineTo(x - 8 * s * flip, y - 50 * s); c.closePath(); c.fill();
    c.strokeStyle = '#3f2415'; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(x - 56 * s * flip, y - 30 * s); c.lineTo(x + 34 * s * flip, y - 126 * s); c.stroke();
  } else {
    c.strokeStyle = '#3f2415'; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(x - 40 * s * flip, y - 30 * s); c.lineTo(x + 20 * s * flip, y - 90 * s); c.stroke();
  }
}

function boats(p, r) {
  const moored = [[480, 1170, 0.55, null, 1], [1130, 1180, 0.6, null, -1], [700, 1120, 0.4, '#f4ead2', 1]];
  moored.forEach(([x, y, s, sail, f], i) => {
    p.group('sea', { x: x - 80 * s, y: y - 140 * s, w: 160 * s, h: 160 * s }, (c) => {
      c.fillStyle = 'rgba(15,70,80,.35)'; c.fillRect(x - 54 * s, y + 2 * s, 108 * s, 4 * s);
      dhow(c, x, y, s, sail, f);
    }, { t: 3.6 + i * 0.2, d: 0.7, reveal: 'drop', dy: 10 });
  });
  // a dhow under sail crossing the cove, and gulls
  p.live('live', {
    t: 8.6, d: 1.0, reveal: 'fade', box: { x: OX0, y: 900, w: OX1 - OX0, h: 260 },
    draw: (c, time) => {
      const u = ((time - 8.6) * 0.018 + 0.1) % 1;
      const x = lerp(1180, 640, u), y = 1050, fade = Math.min(1, Math.min(u, 1 - u) * 10);
      c.globalAlpha *= fade;
      c.strokeStyle = 'rgba(240,252,246,.8)'; c.lineWidth = 1.6; c.beginPath();
      for (let j = 1; j < 5; j++) { c.moveTo(x + 22 + j * 14, y + 1 + j); c.lineTo(x + 32 + j * 14, y + 1 + j); }
      c.stroke();
      dhow(c, x, y, 0.42, '#fbf3df', -1);
    },
  });
  const gulls = [[700, 760, 1.2, 0], [760, 800, 0.9, 1.7], [980, 720, 1.0, 3.1]];
  p.live('live', {
    t: 9.0, d: 1.0, reveal: 'fade', box: { x: OX0, y: 600, w: OX1 - OX0, h: 400 },
    draw: (c, time) => {
      c.strokeStyle = '#4a3a34'; c.lineCap = 'round';
      for (const [gx, gy, s, ph] of gulls) {
        const a = time * 0.3 + ph, x = gx + Math.cos(a) * 70 * s, y = gy + Math.sin(a * 1.4) * 20 * s;
        const flap = Math.sin(time * 4.5 + ph * 2), w = 11 * s, h = (2 + flap * 3.2) * s;
        c.lineWidth = 2 * s; c.beginPath();
        c.moveTo(x - w, y - h); c.quadraticCurveTo(x - w * 0.4, y - h - 3 * s, x, y); c.quadraticCurveTo(x + w * 0.4, y - h - 3 * s, x + w, y - h); c.stroke();
      }
    },
  });
}

// ================================================================ the door frame
// a carved rosette: petals round a boss
function rosette(c, x, y, rad, n = 8, col = TEAK, o = {}) {
  c.fillStyle = TEAK_X; c.beginPath(); c.arc(x + rad * 0.06, y + rad * 0.08, rad * 1.02, 0, Math.PI * 2); c.fill();
  c.fillStyle = shade(col, 0.82); c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + (o.rot || 0);
    const px = x + Math.cos(a) * rad * 0.55, py = y + Math.sin(a) * rad * 0.55;
    c.fillStyle = TEAK_X; c.beginPath(); c.ellipse(px + 1, py + 1.4, rad * 0.4, rad * 0.17, a, 0, Math.PI * 2); c.fill();
    c.fillStyle = Math.cos(a - 2.4) > 0 ? shade(col, 1.3) : col; c.beginPath(); c.ellipse(px, py, rad * 0.4, rad * 0.17, a, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = o.boss || BRASS; c.beginPath(); c.arc(x, y, rad * 0.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = BRASS_L; c.beginPath(); c.arc(x - rad * 0.06, y - rad * 0.06, rad * 0.08, 0, Math.PI * 2); c.fill();
}
// a brass stud
function stud(c, x, y, rad) {
  c.fillStyle = 'rgba(30,15,8,.55)'; c.beginPath(); c.arc(x + rad * 0.25, y + rad * 0.3, rad, 0, Math.PI * 2); c.fill();
  c.fillStyle = BRASS_D; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
  c.fillStyle = BRASS; c.beginPath(); c.arc(x - rad * 0.12, y - rad * 0.12, rad * 0.78, 0, Math.PI * 2); c.fill();
  c.fillStyle = BRASS_L; c.beginPath(); c.arc(x - rad * 0.35, y - rad * 0.35, rad * 0.3, 0, Math.PI * 2); c.fill();
}
// a carved vine running along a band: a wave with leaves either side
function vine(c, x0, y0, x1, y1, w, col) {
  const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux;
  const n = Math.round(L / (w * 1.6));
  c.lineCap = 'round';
  for (const [dx, dy, cl, lw] of [[1.5, 2, TEAK_X, w * 0.16], [0, 0, shade(col, 1.25), w * 0.12]]) {
    c.strokeStyle = cl; c.lineWidth = lw; c.beginPath();
    for (let k = 0; k <= n * 8; k++) {
      const t = k / (n * 8), s = Math.sin(t * n * Math.PI) * w * 0.28;
      const x = x0 + ux * L * t + nx * s + dx, y = y0 + uy * L * t + ny * s + dy;
      k ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
  }
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, side = k % 2 ? 1 : -1;
    const x = x0 + ux * L * t + nx * side * w * 0.12, y = y0 + uy * L * t + ny * side * w * 0.12;
    const a = Math.atan2(uy, ux) + side * 0.9;
    c.fillStyle = TEAK_X; c.beginPath(); c.ellipse(x + 1.2, y + 1.6, w * 0.24, w * 0.1, a, 0, Math.PI * 2); c.fill();
    c.fillStyle = shade(col, 1.2); c.beginPath(); c.ellipse(x, y, w * 0.24, w * 0.1, a, 0, Math.PI * 2); c.fill();
  }
}

function door(p, r) {
  // the shadow the frame casts on the plaster, then the jambs
  p.group('door', { x: OX0 - JW - 50, y: LY0, w: OX1 - OX0 + 2 * JW + 100, h: FLOOR - LY0 + 10 }, (c) => {
    c.fillStyle = 'rgba(90,64,40,.25)';
    c.fillRect(OX0 - JW - 26, LY0 + 20, 30, FLOOR - LY0 - 20); c.fillRect(OX1 + JW - 4, LY0 + 20, 30, FLOOR - LY0 - 20);
  }, { t: 0.4, d: 0.8, reveal: 'fade' });
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? OX0 - JW : OX1, x1 = x0 + JW;
    p.group('door', { x: x0 - 6, y: LY0 + 200, w: JW + 12, h: FLOOR - LY0 - 190 }, (c) => {
      c.fillStyle = TEAK; c.fillRect(x0, LY0 + 210, JW, FLOOR - LY0 - 210);
      c.fillStyle = TEAK_D; c.fillRect(side < 0 ? x1 - 10 : x0, LY0 + 210, 10, FLOOR - LY0 - 210); // the reveal into the opening
      c.fillStyle = TEAK_L; c.fillRect(side < 0 ? x0 : x1 - 6, LY0 + 210, 6, FLOOR - LY0 - 210);
      // a sunk band down the jamb with a carved vine
      c.fillStyle = TEAK_D; c.fillRect(x0 + 18, LY0 + 240, JW - 36, FLOOR - LY0 - 300);
      vine(c, x0 + JW / 2, LY0 + 250, x0 + JW / 2, FLOOR - 70, JW - 40, TEAK);
      // studs top and bottom
      for (const y of [LY0 + 226, FLOOR - 40]) for (const x of [x0 + 20, x0 + JW / 2, x0 + JW - 20]) stud(c, x, y, 6);
    }, { t: 0.6 + (side + 1) * 0.15, d: 1.0, reveal: 'rise', ease: 'out' });
  }
  // the threshold: a raised teak sill
  p.group('door', { x: OX0 - JW - 10, y: OY1 - 10, w: OX1 - OX0 + 2 * JW + 20, h: FLOOR - OY1 + 30 }, (c) => {
    c.fillStyle = TEAK; c.fillRect(OX0 - JW, OY1, OX1 - OX0 + 2 * JW, FLOOR - OY1);
    c.fillStyle = TEAK_L; c.fillRect(OX0 - JW, OY1, OX1 - OX0 + 2 * JW, 8);
    c.fillStyle = TEAK_D; c.fillRect(OX0 - JW, FLOOR - 12, OX1 - OX0 + 2 * JW, 12);
    for (let x = OX0 - JW + 30; x < OX1 + JW - 20; x += 60) stud(c, x, (OY1 + FLOOR) / 2 + 2, 6);
  }, { t: 1.0, d: 0.8, reveal: 'wipe' });
}

// the two leaves, swung open into the room: each a quad in perspective
function leaves(p, r) {
  const leaf = (side) => {
    const hx = side < 0 ? OX0 - JW + 8 : OX1 + JW - 8; // the hinge edge
    const fx = side < 0 ? 40 : W - 40; // the free edge, nearer us
    const q = [[hx, OY0 - 30], [fx, OY0 - 150], [fx, FLOOR + 40], [hx, FLOOR - 4]];
    // bilinear: u from hinge to free edge, v from top to foot
    const Q = (u, v) => {
      const top = [lerp(q[0][0], q[1][0], u), lerp(q[0][1], q[1][1], u)], bot = [lerp(q[3][0], q[2][0], u), lerp(q[3][1], q[2][1], u)];
      return [lerp(top[0], bot[0], v), lerp(top[1], bot[1], v)];
    };
    const quad = (u0, v0, u1, v1) => [Q(u0, v0), Q(u1, v0), Q(u1, v1), Q(u0, v1)];
    return { q, Q, quad, side };
  };
  for (const side of [-1, 1]) {
    const L = leaf(side), { q, Q, quad } = L;
    const b = boxOf(q, 30);
    // the slab of the leaf and its thick edge
    p.group('leaves', b, (c) => {
      const edge = side < 0 ? [q[1], [q[1][0] + 26, q[1][1] + 4], [q[2][0] + 26, q[2][1] - 4], q[2]] : [q[1], [q[1][0] - 26, q[1][1] + 4], [q[2][0] - 26, q[2][1] - 4], q[2]];
      c.fillStyle = 'rgba(60,40,25,.3)'; poly(c, [[q[3][0], q[3][1]], [q[2][0], q[2][1]], [q[2][0] + side * 40, q[2][1] + 30], [q[3][0], q[3][1] + 10]]); c.fill();
      c.fillStyle = TEAK; poly(c, q); c.fill();
      c.fillStyle = TEAK_D; poly(c, edge); c.fill();
      // a wash of light from the opening, falling off toward the free edge
      const g = c.createLinearGradient(q[0][0], 0, q[1][0], 0);
      g.addColorStop(0, 'rgba(255,220,160,.22)'); g.addColorStop(1, 'rgba(20,10,5,.25)');
      c.fillStyle = g; poly(c, q); c.fill();
    }, { t: 1.3 + (side + 1) * 0.1, d: 1.0, reveal: side < 0 ? 'wipeL' : 'wipe', ease: 'inOut' });
    // the carved panels: two columns of five, each sunk with a rosette
    const rows = 5, us = [[0.1, 0.46], [0.54, 0.9]];
    const vs = []; for (let k = 0; k < rows; k++) vs.push([0.06 + k * 0.18, 0.06 + k * 0.18 + 0.15]);
    let n = 0;
    for (const [v0, v1] of vs) {
      const pts = [];
      for (const [u0, u1] of us) pts.push(quad(u0, v0, u1, v1));
      const all = pts.flat();
      const k = n++;
      p.group('leaves', boxOf(all, 12), (c) => {
        for (const [ua, ub] of us) {
          const outer = quad(ua, v0, ub, v1), inner = quad(ua + 0.035, v0 + 0.012, ub - 0.035, v1 - 0.012);
          c.fillStyle = TEAK_X; poly(c, outer); c.fill();
          c.fillStyle = TEAK_D; poly(c, inner); c.fill();
          // the bevel: light on the top edge, dark on the hinge side
          c.fillStyle = shade(TEAK, 1.25); poly(c, [outer[0], outer[1], inner[1], inner[0]]); c.fill();
          // a rosette, squeezed by the angle of the leaf
          const [cx, cy] = Q((ua + ub) / 2, (v0 + v1) / 2);
          const w = Math.abs(Q(ub, (v0 + v1) / 2)[0] - Q(ua, (v0 + v1) / 2)[0]);
          const hgt = Math.abs(Q((ua + ub) / 2, v1)[1] - Q((ua + ub) / 2, v0)[1]);
          c.save(); c.translate(cx, cy); c.scale(w / hgt * 1.0, 1); c.translate(-cx, -cy);
          rosette(c, cx, cy, hgt * 0.3, 10, TEAK, { rot: k * 0.3 });
          c.restore();
        }
      }, { t: 1.9 + k * 0.18 + (side + 1) * 0.06, d: 0.7, reveal: 'fade' });
    }
    // rows of brass studs on the rails between the panels
    const studs = [];
    for (let k = 0; k <= rows; k++) {
      const v = 0.06 + k * 0.18 - 0.016;
      for (let j = 0; j <= 8; j++) studs.push(Q(0.08 + j * 0.105, v));
    }
    for (let j = 0; j < 22; j++) studs.push(Q(0.5, 0.04 + j * 0.043));
    p.group('leaves', boxOf(studs, 14), (c) => {
      for (const [x, y] of studs) {
        const s = 3 + Math.abs(x - (side < 0 ? OX0 : OX1)) / 60;
        stud(c, x, y, s);
      }
    }, { t: 3.2 + (side + 1) * 0.1, d: 0.8, reveal: 'fall' });
    // the ring handle near the free edge
    const [hx, hy] = Q(0.8, 0.5);
    p.group('leaves', { x: hx - 40, y: hy - 40, w: 80, h: 110 }, (c) => {
      stud(c, hx, hy, 12);
      c.strokeStyle = BRASS_D; c.lineWidth = 7; c.beginPath(); c.ellipse(hx + 2, hy + 34, 17, 30, 0, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = BRASS; c.lineWidth = 4.5; c.beginPath(); c.ellipse(hx, hy + 32, 17, 30, 0, 0, Math.PI * 2); c.stroke();
    }, { t: 3.6, d: 0.6, reveal: 'drop', dy: 14 });
  }
}

// ================================================================ the lintel and the name
function lintel(p, r) {
  const x0 = OX0 - JW - 40, x1 = OX1 + JW + 40, y0 = LY0, y1 = OY0;
  p.group('lintel', { x: x0 - 10, y: y0 - 10, w: x1 - x0 + 20, h: y1 - y0 + 30 }, (c) => {
    c.fillStyle = 'rgba(90,64,40,.25)'; c.fillRect(x0 + 10, y0 + 14, x1 - x0, y1 - y0);
    c.fillStyle = TEAK; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.fillStyle = TEAK_L; c.fillRect(x0, y0, x1 - x0, 8);
    c.fillStyle = TEAK_D; c.fillRect(x0, y1 - 14, x1 - x0, 14);
    // a carved band of vine along the top and bottom
    c.fillStyle = TEAK_D; c.fillRect(x0 + 16, y0 + 20, x1 - x0 - 32, 44); c.fillRect(x0 + 16, y1 - 70, x1 - x0 - 32, 44);
  }, { t: 0.2, d: 0.9, reveal: 'fall' });
  p.group('lintel', { x: x0, y: y0, w: x1 - x0, h: 80 }, (c) => vine(c, x0 + 30, y0 + 42, x1 - 30, y0 + 42, 46, TEAK), { t: 1.0, d: 1.4, reveal: 'wipe', ease: 'inOut' });
  p.group('lintel', { x: x0, y: y1 - 80, w: x1 - x0, h: 80 }, (c) => vine(c, x1 - 30, y1 - 48, x0 + 30, y1 - 48, 46, TEAK), { t: 1.2, d: 1.4, reveal: 'wipeL', ease: 'inOut' });
  // the central panel, sunk, where the name is carved and gilded
  const cx = 800, py0 = y0 + 76, py1 = y1 - 82;
  p.group('lintel', { x: 380, y: py0 - 6, w: 840, h: py1 - py0 + 12 }, (c) => {
    c.fillStyle = TEAK_X; c.fillRect(400, py0, 800, py1 - py0);
    c.fillStyle = TEAK_D; c.fillRect(406, py0 + 6, 788, py1 - py0 - 6);
    c.fillStyle = shade(TEAK, 1.2); c.fillRect(400, py1 - 3, 800, 3);
  }, { t: 1.5, d: 0.7, reveal: 'fade' });
  // rosettes either side of the panel
  for (const [x, i] of [[300, 0], [1300, 1], [220, 2], [1380, 3]]) {
    const rad = i < 2 ? 56 : 40;
    p.group('lintel', { x: x - rad - 6, y: (py0 + py1) / 2 - rad - 6, w: 2 * rad + 14, h: 2 * rad + 14 }, (c) => rosette(c, x, (py0 + py1) / 2, rad, 12, TEAK), { t: 2.0 + i * 0.15, d: 0.7, reveal: 'pop' });
  }
  // the name in Arabic, set whole and uncovered from right to left
  const ay = py0 + 122;
  p.group('title', { x: 420, y: py0 - 10, w: 760, h: py1 - py0 + 20 }, (c) => {
    c.font = '700 150px "El Messiri"'; c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = TEAK_X; c.fillText('مسقط', cx + 5, ay + 6);
    c.fillStyle = BRASS_D; c.fillText('مسقط', cx + 2, ay + 2);
    c.fillStyle = BRASS; c.fillText('مسقط', cx, ay);
    c.save(); c.beginPath(); c.rect(400, py0, 800, (ay - py0) * 0.55); c.clip();
    c.fillStyle = BRASS_L; c.fillText('مسقط', cx, ay); c.restore();
  }, { t: 10.6, d: 1.5, reveal: 'wipeL', ease: 'inOut' });
  // MUSCAT beneath, a letter at a time
  p.type('title', 'MUSCAT', cx, py1 - 18, {
    family: '"El Messiri"', weight: 500, size: 42, color: BRASS, shadow: TEAK_X, sx: 2, sy: 3, track: 0.5, align: 'center',
    t: 12.0, gap: 0.08, d: 0.6, reveal: 'press',
  });
}

// ================================================================ the floor of the room
function floor(p, r) {
  // stone flags under a palm-leaf mat
  p.group('floor', { x: 0, y: FLOOR - 2, w: W, h: H - FLOOR + 2 }, (c) => {
    c.fillStyle = '#d8c7a6'; c.fillRect(0, FLOOR, W, H - FLOOR);
    c.strokeStyle = '#bfa983'; c.lineWidth = 2; c.beginPath();
    for (let y = FLOOR + 30; y < H; y += 30 + (y - FLOOR) * 0.3) { c.moveTo(0, y); c.lineTo(W, y); }
    for (let k = -12; k <= 12; k++) { c.moveTo(800 + k * 70, FLOOR); c.lineTo(800 + k * 180, H); }
    c.stroke();
    c.fillStyle = 'rgba(255,236,190,.35)';
    c.beginPath(); c.moveTo(OX0, FLOOR); c.lineTo(OX1, FLOOR); c.lineTo(OX1 + 180, H); c.lineTo(OX0 - 180, H); c.fill();
  }, { t: 0.1, d: 0.7, reveal: 'fade' });
  // the mat: a woven oval of palm leaf in bands
  const mx = 800, my = 1880;
  p.group('floor', { x: mx - 380, y: my - 110, w: 760, h: 230 }, (c) => {
    for (let k = 0; k < 9; k++) {
      c.fillStyle = k % 3 === 1 ? '#b5463a' : k % 3 === 2 ? '#d9b871' : '#c9a35c';
      c.beginPath(); c.ellipse(mx, my, 360 - k * 34, 96 - k * 9, 0, 0, Math.PI * 2); c.fill();
    }
  }, { t: 8.6, d: 0.8, reveal: 'pop' });
  // a brass coffee pot (dallah) with its long beak, and an incense burner
  const dx = 700, dy = 1870;
  p.group('floor', { x: dx - 90, y: dy - 220, w: 180, h: 240 }, (c) => {
    c.fillStyle = 'rgba(60,40,20,.3)'; c.beginPath(); c.ellipse(dx + 10, dy + 6, 60, 12, 0, 0, Math.PI * 2); c.fill();
    // body
    c.fillStyle = BRASS_D; c.beginPath(); c.moveTo(dx - 50, dy); c.quadraticCurveTo(dx - 60, dy - 60, dx - 24, dy - 90); c.lineTo(dx + 24, dy - 90); c.quadraticCurveTo(dx + 60, dy - 60, dx + 50, dy); c.fill();
    c.fillStyle = BRASS; c.beginPath(); c.moveTo(dx - 50, dy); c.quadraticCurveTo(dx - 60, dy - 60, dx - 24, dy - 90); c.lineTo(dx + 6, dy - 90); c.quadraticCurveTo(dx - 10, dy - 50, dx - 6, dy); c.fill();
    // neck, lid and finial
    c.fillStyle = BRASS_D; c.beginPath(); c.moveTo(dx - 22, dy - 90); c.lineTo(dx - 14, dy - 140); c.lineTo(dx + 14, dy - 140); c.lineTo(dx + 22, dy - 90); c.fill();
    c.fillStyle = BRASS; c.beginPath(); c.moveTo(dx - 22, dy - 90); c.lineTo(dx - 14, dy - 140); c.lineTo(dx - 2, dy - 140); c.lineTo(dx - 6, dy - 90); c.fill();
    c.fillStyle = BRASS; c.beginPath(); c.ellipse(dx, dy - 146, 26, 10, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(dx - 16, dy - 150); c.quadraticCurveTo(dx, dy - 200, dx + 16, dy - 150); c.fill();
    c.fillStyle = BRASS_L; c.beginPath(); c.arc(dx, dy - 196, 6, 0, Math.PI * 2); c.fill();
    // the long curved beak
    c.strokeStyle = BRASS; c.lineWidth = 10; c.lineCap = 'round';
    c.beginPath(); c.moveTo(dx - 40, dy - 50); c.quadraticCurveTo(dx - 80, dy - 90, dx - 78, dy - 150); c.stroke();
    c.strokeStyle = BRASS_D; c.lineWidth = 6; c.beginPath(); c.moveTo(dx - 78, dy - 150); c.lineTo(dx - 84, dy - 162); c.stroke();
    // the handle
    c.strokeStyle = BRASS_D; c.lineWidth = 7; c.beginPath(); c.moveTo(dx + 20, dy - 130); c.quadraticCurveTo(dx + 80, dy - 110, dx + 44, dy - 40); c.stroke();
    // bands
    c.fillStyle = BRASS_L; c.fillRect(dx - 40, dy - 70, 6, 3); c.fillRect(dx - 52, dy - 22, 10, 3);
  }, { t: 9.0, d: 0.8, reveal: 'drop', dy: 20 });
  const bx = 900, by = 1880;
  p.group('floor', { x: bx - 60, y: by - 120, w: 120, h: 140 }, (c) => {
    c.fillStyle = 'rgba(60,40,20,.3)'; c.beginPath(); c.ellipse(bx + 8, by + 6, 46, 10, 0, 0, Math.PI * 2); c.fill();
    // a square clay burner, painted, with a stepped foot and a bowl
    c.fillStyle = '#b5463a'; c.fillRect(bx - 34, by - 40, 68, 40);
    c.fillStyle = '#d9b871'; c.fillRect(bx - 34, by - 40, 68, 6); c.fillRect(bx - 34, by - 14, 68, 4);
    c.fillStyle = '#2f5a6a'; for (let k = 0; k < 4; k++) c.fillRect(bx - 28 + k * 16, by - 30, 8, 12);
    c.fillStyle = '#c4553f'; c.beginPath(); c.moveTo(bx - 26, by - 40); c.lineTo(bx - 40, by - 76); c.lineTo(bx + 40, by - 76); c.lineTo(bx + 26, by - 40); c.fill();
    c.fillStyle = '#4a2a20'; c.beginPath(); c.ellipse(bx, by - 76, 40, 9, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e07a3a'; c.beginPath(); c.ellipse(bx - 4, by - 78, 14, 4, 0, 0, Math.PI * 2); c.fill();
  }, { t: 9.3, d: 0.7, reveal: 'drop', dy: 20 });
  // frankincense smoke rising, live: three thin wisps
  p.live('smoke', {
    t: 9.8, d: 1.5, reveal: 'fade', box: { x: bx - 160, y: by - 600, w: 320, h: 540 },
    draw: (c, time) => {
      c.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        c.strokeStyle = `rgba(250,246,238,${0.5 - k * 0.12})`; c.lineWidth = 5 - k;
        c.beginPath();
        for (let j = 0; j <= 24; j++) {
          const t = j / 24, y = by - 80 - t * 420;
          const x = bx - 4 + Math.sin(t * 6 - time * 1.6 + k * 2) * (8 + t * 40) + Math.sin(t * 3 + time * 0.7 + k) * t * 20;
          j ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.stroke();
      }
    },
  });
}
