// Valparaíso: a naive painting of the port seen from the bay. The cerros rise
// almost to the top of the board, covered shelf over shelf in little houses of
// painted corrugated iron, every one a different color; three funiculars climb
// straight up them on their rails, two cars on each passing in the middle;
// painted stairways run up the ravines between walls of murals. Palacio
// Baburizza with its turret on Cerro Alegre, the Lutheran church's spire on
// Cerro Concepción, the clock tower of the Reloj Turri and the Armada building
// down in El Plan, green trolleybuses, then the port: cranes, a container ship,
// painted fishing boats and sea lions on a buoy. The frame is a painted board.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, shade, lerp, clamp, poly, rng } from '../kit.js';

const INK = '#1d2456', CREAM = '#fbf2dc', FRAME = '#27389a', FRAME_D = '#1b276f';
const SKY = '#62b9e6', SKY_L = '#9bd5f0', SKY_D = '#3f9fd6';
const HILL = '#7f9c48', HILL_D = '#5e7f36', HILL_L = '#a3bd5e', EARTH = '#c9a465', FAR = '#8db3c2', FAR2 = '#a9c8cf';
const SEA = '#1f5fae', SEA_D = '#184a8c', SEA_L = '#4b8fd4';
const RUST = '#b5532f', TIN = '#97a2ab', TILE = '#c63b2f', SLATE = '#56535e';
const HOUSE = ['#f4c430', '#e8436f', '#2fb3a8', '#3d6fd1', '#f07f2d', '#8bc34a', '#b06cd0', '#e5483a', '#f6e7c1',
  '#55c1e8', '#f59bb5', '#ffd96a', '#76d3b0', '#ff9c5b', '#c4e06a'];
const BOAT = ['#e5483a', '#f4c430', '#2fb3a8', '#3d6fd1', '#f6e7c1', '#e8436f', '#8bc34a'];
const FACE = '"Gochi Hand", cursive';

export const city = {
  id: 'valparaiso', name: 'Valparaíso', wall: '#1b276f',
  alt: 'A naive painting of Valparaíso from the bay: hills covered to the top in houses of painted corrugated iron in every color, three funiculars with their cars climbing straight up the slopes, painted stairways and murals in the ravines, Palacio Baburizza with its turret, the spire of the Lutheran church, the clock tower of the Reloj Turri and the Armada building in the lower town, a green trolleybus, and in the port cranes, a container ship, painted fishing boats and sea lions on a buoy, paper kites over the hills, in a painted blue frame',
  google: 'family=Gochi+Hand',
  fonts: [['400 100px "Gochi Hand"', 'Valparaíso CERRO ALEGRE · CONCEPCIÓN · EL PLAN · PUERTO · CHILE ASCENSOR 1906 RELOJ'], ['400 40px "Gochi Hand"', 'Valparaíso']],
  build,
};

// the board: a painted frame, the picture inside it
const FB = 44, CAP = 120;
const PX = FB, PY = FB, PW = W - 2 * FB, PH = H - FB - CAP;
const PB = PY + PH;
const FOOT = 1425; // where the hills meet the lower town
const STREET = 1572, QUAY = 1612;

// the skyline of the cerros: three hills with ravines between
const bump = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
const ridge = (x) => 705 - 235 * bump(x, 290, 290) - 305 * bump(x, 900, 300) - 240 * bump(x, 1430, 270);
// the ravines, from the ridge to the foot
const RAVINES = [{ x0: 612, x1: 575, w0: 16, w1: 46, ph: 0 }, { x0: 1168, x1: 1190, w0: 16, w1: 44, ph: 2 }];
const ravAt = (q, y) => { const k = clamp((y - ridge(q.x0)) / (FOOT - ridge(q.x0))); return [lerp(q.x0, q.x1, k) + 12 * Math.sin(y / 85 + q.ph) * k, lerp(q.w0, q.w1, k)]; };
// the funiculars: foot and top of their rails
const LIFTS = [
  { a: [352, 1470], b: [300, 948], col: ['#d93a30', '#f2c12e'] },
  { a: [842, 1470], b: [800, 836], col: ['#f2c12e', '#2fa36b'] },
  { a: [1318, 1470], b: [1372, 942], col: ['#2fa36b', '#d93a30'] },
];
// places kept clear of little houses
const KEEP = [
  [140, 830, 205, 180], // Palacio Baburizza (x, y, w, h)
  [860, 600, 150, 240], // the Lutheran church
  [1180, 860, 160, 90], // the top station on the right
  [1440, 740, 80, 140], // a lookout on the right hill
];

const J = (r, a) => r.range(-a, a);
const wob = (r, pts, a) => pts.map(([x, y]) => [x + J(r, a), y + J(r, a)]);
// a painted rectangle: its corners a little off true, and the edges sagging
function prect(r, x, y, w, h, a = 1.4) {
  const p = [[x, y + h], [x + w, y + h], [x + w, y], [x, y]];
  return wob(r, p, a);
}
function onLift(x0, x1, y) {
  for (const L of LIFTS) {
    const k = (y - L.a[1]) / (L.b[1] - L.a[1]);
    if (k < -0.05 || k > 1.12) continue;
    const lx = lerp(L.a[0], L.b[0], k);
    if (x1 > lx - 27 && x0 < lx + 27) return true;
  }
  return false;
}
function onRavine(x0, x1, y) {
  for (const q of RAVINES) {
    if (y < ridge(q.x0) - 20) continue;
    const [cx, hw] = ravAt(q, y);
    if (x1 > cx - hw && x0 < cx + hw) return true;
  }
  return false;
}
function kept(x0, y0, x1, y1) {
  return KEEP.some(([x, y, w, h]) => x1 > x && x0 < x + w && y1 > y && y0 < y + h);
}

function build() {
  const p = new Plate({ paper: CREAM, seed: 1536 });
  const r = p.r;
  p.clip = { x: PX, y: PY, w: PW, h: PH };
  p.stack('sky', 'far', 'hill', 'houses', 'ravine', 'marks', 'rails', 'cars', 'plan', 'sea', 'port', 'life', 'frame', 'title');
  p.layer('frame', { clip: false });
  p.layer('title', { clip: false });

  frame(p, r);
  sky(p, r);
  farHills(p, r);
  hill(p, r);
  houses(p, r);
  ravines(p, r);
  baburizza(p, r);
  lutheran(p, r);
  lookout(p, r);
  lifts(p, r);
  laundry(p, r);
  plan(p, r);
  port(p, r);
  sea(p, r);
  life(p, r);
  title(p, r);
  return p;
}

// the frame: a board painted blue with a row of white dabs and a yellow line inside
function frame(p, r) {
  const dabs = [];
  const run = (x0, y0, x1, y1, n) => {
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      dabs.push([lerp(x0, x1, t) + J(r, 1.5), lerp(y0, y1, t) + J(r, 1.5), r.range(3.2, 4.6), r.pick(['#fbf2dc', '#f4c430', '#f59bb5', '#76d3b0'])]);
    }
  };
  run(22, 22, W - 22, 22, 64); run(22, H - 22, W - 22, H - 22, 64);
  run(22, 22, 22, H - 22, 80); run(W - 22, 22, W - 22, H - 22, 80);
  const edge = [];
  for (let i = 0; i <= 40; i++) edge.push([PX + (PW * i) / 40 + J(r, 1), PY + J(r, 1.6)]);
  for (let i = 0; i <= 50; i++) edge.push([PX + PW + J(r, 1.6), PY + (PH * i) / 50 + J(r, 1)]);
  for (let i = 40; i >= 0; i--) edge.push([PX + (PW * i) / 40 + J(r, 1), PB + J(r, 1.6)]);
  for (let i = 50; i >= 0; i--) edge.push([PX + J(r, 1.6), PY + (PH * i) / 50 + J(r, 1)]);
  const strokes = [];
  for (let i = 0; i < 160; i++) {
    const side = i % 4, k = r();
    const L = r.range(60, 180);
    if (side < 2) { const y = side === 0 ? r.range(4, FB - 4) : r.range(PB + 6, H - 6), x = k * W; strokes.push([[x, y], [x + L, y + J(r, 2)]]); }
    else { const x = side === 2 ? r.range(4, FB - 4) : r.range(W - FB + 4, W - 4), y = k * H; strokes.push([[x, y], [x + J(r, 2), y + L]]); }
  }
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = FRAME;
    c.beginPath(); c.rect(0, 0, W, H);
    c.moveTo(edge[0][0], edge[0][1]); for (const [x, y] of edge) c.lineTo(x, y); c.closePath();
    c.fill('evenodd');
    c.strokeStyle = FRAME_D; c.lineWidth = 7; c.lineCap = 'round'; c.globalAlpha = 0.45;
    c.beginPath(); for (const s of strokes) { c.moveTo(s[0][0], s[0][1]); c.lineTo(s[1][0], s[1][1]); } c.stroke();
    c.globalAlpha = 1;
    c.strokeStyle = '#f4c430'; c.lineWidth = 4; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(edge[0][0], edge[0][1]); for (const [x, y] of edge) c.lineTo(x, y); c.closePath(); c.stroke();
  }, { t: 0, d: 0.9, reveal: 'fade' });
  // the canvas: a fine weave that the paint sits in
  p.group('frame', { x: PX, y: PY, w: PW, h: PH }, (c) => {
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(40,30,20,.07)';
    c.beginPath(); for (let y = PY + 1; y < PB; y += 3) { c.moveTo(PX, y); c.lineTo(PX + PW, y); } c.stroke();
    c.strokeStyle = 'rgba(255,250,235,.06)';
    c.beginPath(); for (let x = PX + 1; x < PX + PW; x += 3) { c.moveTo(x, PY); c.lineTo(x, PB); } c.stroke();
  }, { t: 0, d: 0.5, reveal: 'fade' });
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    for (const [x, y, rr, col] of dabs) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rr, rr * 0.8, 0.4, 0, Math.PI * 2); c.fill(); }
  }, { t: 0.7, d: 1.2, reveal: 'wipe', ease: 'inOut' });
}

// the sky: flat blue laid in with broad strokes, a few cotton clouds
function sky(p, r) {
  const strokes = [];
  for (let i = 0; i < 90; i++) {
    const y = r.range(PY + 10, 760), x = r.range(PX - 40, PX + PW), L = r.range(120, 380);
    strokes.push([x, y, L, r.range(8, 20), r.chance(0.6) ? SKY_L : SKY_D, r.range(0.12, 0.3)]);
  }
  p.group('sky', { x: PX, y: PY, w: PW, h: 820 }, (c) => {
    const g = c.createLinearGradient(0, PY, 0, 800);
    g.addColorStop(0, SKY_D); g.addColorStop(0.6, SKY); g.addColorStop(1, '#bfe3f2');
    c.fillStyle = g; c.fillRect(PX, PY, PW, 820);
    c.lineCap = 'round';
    for (const [x, y, L, w, col, a] of strokes) {
      c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + L / 2, y - w * 0.4, x + L, y + w * 0.2); c.stroke();
    }
    c.globalAlpha = 1;
  }, { t: 0.2, d: 1.1, reveal: 'fall', ease: 'inOut' });
  // clouds: heaps of round puffs, white over a gray-lilac belly
  const clouds = [[250, 560, 150], [700, 470, 110], [1180, 540, 170], [1440, 400, 90], [470, 400, 80]];
  clouds.forEach(([x, y, w], i) => {
    const puffs = [];
    const n = 5;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, lift = Math.sin(t * Math.PI);
      puffs.push([x - w / 2 + t * w, y - lift * w * 0.22 + J(r, 3), w * (0.16 + 0.12 * lift) * r.range(0.9, 1.1)]);
    }
    p.group('sky', { x: x - w, y: y - w * 0.8, w: w * 2, h: w }, (c) => {
      c.fillStyle = '#c9cde6';
      for (const [px, py, pr] of puffs) { c.beginPath(); c.arc(px + 4, py + 5, pr, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#fffaf0';
      for (const [px, py, pr] of puffs) { c.beginPath(); c.arc(px, py, pr * 0.94, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#c9cde6'; c.fillRect(x - w / 2 - 6, y + 2, w + 14, 6);
    }, { t: 1.2 + i * 0.18, d: 0.7, reveal: 'pop' });
  });
}

// the far hills behind the cerros, in the haze
function farHills(p, r) {
  const back = [[PX, 800]];
  for (let x = PX; x <= PX + PW; x += 20) back.push([x, 560 + 55 * Math.sin(x / 170) + 30 * Math.sin(x / 61) + J(r, 2)]);
  back.push([PX + PW, 800]);
  const mid = [[PX, 820]];
  for (let x = PX; x <= PX + PW; x += 20) mid.push([x, 600 + 45 * Math.sin(x / 130 + 2) + 22 * Math.sin(x / 47) + J(r, 2)]);
  mid.push([PX + PW, 820]);
  p.fill('far', back, FAR2, { t: 1.0, d: 0.9, reveal: 'rise' });
  p.fill('far', mid, FAR, { t: 1.3, d: 0.9, reveal: 'rise' });
  // a few dark trees on them, as dabs
  const trees = [];
  for (let i = 0; i < 70; i++) { const x = r.range(PX, PX + PW); trees.push([x, 640 + 50 * Math.sin(x / 130 + 2) + r.range(10, 60), r.range(4, 8)]); }
  p.group('far', { x: PX, y: 560, w: PW, h: 200 }, (c) => {
    c.fillStyle = '#6f9aa5';
    for (const [x, y, s] of trees) { c.beginPath(); c.ellipse(x, y, s, s * 1.4, 0, 0, Math.PI * 2); c.fill(); }
  }, { t: 1.6, d: 0.6, reveal: 'fade' });
}

// the hills themselves: olive, with earth showing and bushes dabbed on
function hill(p, r) {
  const pts = [[PX, STREET + 4]];
  for (let x = PX; x <= PX + PW; x += 12) {
    let y = ridge(x);
    for (const q of RAVINES) y += 26 * bump(x, q.x0, 34);
    pts.push([x, y + J(r, 1.5)]);
  }
  pts.push([PX + PW, STREET + 4]);
  const dabs = [];
  for (let i = 0; i < 900; i++) {
    const x = r.range(PX, PX + PW), y = r.range(ridge(x) + 4, FOOT + 40);
    dabs.push([x, y, r.range(3, 7), r.pick([HILL_D, HILL_L, EARTH, HILL_D, '#6c8f3e'])]);
  }
  // the ridge's own crest of bushes
  const crest = [];
  for (let x = PX; x <= PX + PW; x += r.range(7, 13)) crest.push([x, ridge(x) + r.range(0, 6), r.range(5, 10)]);
  p.group('hill', boxOf(pts, 10), (c) => {
    c.fillStyle = HILL; poly(c, pts); c.fill();
  }, { t: 1.6, d: 1.0, reveal: 'fade', ease: 'inOut' });
  p.group('hill', boxOf(pts, 12), (c) => {
    for (const [x, y, s, col] of dabs) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, s, s * 0.7, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = HILL_D;
    for (const [x, y, s] of crest) { c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); }
  }, { t: 2.3, d: 0.8, reveal: 'fade' });
}

// one little house of painted iron. h: { x, y (foot), w, h, col, roof, rcol, wins, step, door, gable }
function drawHouse(c, h) {
  const { x, y, w, hh } = h;
  // the walls
  c.fillStyle = h.col; poly(c, h.body); c.fill();
  // corrugated iron: close lines across the wall
  c.save(); poly(c, h.body); c.clip();
  c.strokeStyle = h.corr; c.lineWidth = 1.1;
  c.beginPath();
  if (h.vert) { for (let xx = x + 2; xx < x + w; xx += 3.4) { c.moveTo(xx, y - hh - 4); c.lineTo(xx + h.lean, y + 2); } }
  else { for (let yy = y - 3; yy > y - hh - 30; yy -= 3.6) { c.moveTo(x - 2, yy); c.lineTo(x + w + 2, yy + h.lean * 0.3); } }
  c.stroke();
  // a band of trim at the eaves
  c.fillStyle = h.trim; c.fillRect(x - 2, y - hh, w + 4, 3.5);
  c.restore();
  // the roof
  if (h.gable) {
    c.fillStyle = h.rcol; poly(c, h.gable); c.fill();
    c.strokeStyle = shade(h.rcol, 0.7); c.lineWidth = 1;
    c.beginPath(); for (let k = 1; k < 6; k++) { const t = k / 6; c.moveTo(lerp(h.gable[0][0], h.gable[2][0], t), lerp(h.gable[0][1], h.gable[2][1], t)); c.lineTo(lerp(h.gable[1][0], h.gable[2][0], t), lerp(h.gable[1][1], h.gable[2][1], t)); } c.stroke();
  } else if (h.shed) {
    c.fillStyle = h.rcol; poly(c, h.shed); c.fill();
  }
  // windows: tall sash windows with white frames, the panes dark blue or lit sky
  for (const [wx, wy, ww, wh, pane] of h.wins) {
    c.fillStyle = '#fdf6e8'; c.fillRect(wx - 1.6, wy - 1.6, ww + 3.2, wh + 3.2);
    c.fillStyle = pane; c.fillRect(wx, wy, ww, wh);
    c.fillStyle = '#fdf6e8'; c.fillRect(wx, wy + wh * 0.48, ww, 1.4); c.fillRect(wx + ww / 2 - 0.6, wy, 1.2, wh);
  }
  if (h.door) { const [dx, dw, dh, dc] = h.door; c.fillStyle = dc; c.fillRect(dx, y - dh, dw, dh); }
  if (h.balc) { c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); const [bx, by, bw] = h.balc; c.moveTo(bx, by); c.lineTo(bx + bw, by); for (let xx = bx; xx <= bx + bw; xx += 3) { c.moveTo(xx, by); c.lineTo(xx, by + 7); } c.moveTo(bx, by + 7); c.lineTo(bx + bw, by + 7); c.stroke(); }
  // the naive painter's dark outline
  c.strokeStyle = 'rgba(29,36,86,.75)'; c.lineWidth = 1.3; c.lineJoin = 'round';
  poly(c, h.body); c.stroke();
  if (h.gable) { poly(c, h.gable); c.stroke(); }
}

function makeHouse(r, x, y, w, hh, small) {
  const col = r.pick(HOUSE);
  const lean = J(r, 1.6);
  const body = [[x, y], [x + w, y], [x + w + lean, y - hh], [x + lean, y - hh]].map(([a, b]) => [a + J(r, 0.8), b + J(r, 0.8)]);
  const h = { x, y, w, hh, col, lean, body, corr: shade(col, 0.86), trim: r.pick(['#fdf6e8', shade(col, 0.6), '#fdf6e8']), wins: [], vert: r.chance(0.25) };
  const roofKind = r();
  const rh = Math.min(hh * 0.4, w * 0.38);
  if (roofKind < 0.42) {
    h.rcol = r.pick([RUST, TILE, TIN, RUST, SLATE]);
    h.gable = [[x - 3 + lean, y - hh + 1], [x + w + 3 + lean, y - hh + 1], [x + w / 2 + lean + J(r, 2), y - hh - rh]];
  } else if (roofKind < 0.7) {
    h.rcol = r.pick([RUST, TIN, SLATE]);
    const up = r.chance(0.5);
    h.shed = [[x - 2 + lean, y - hh + 1], [x + w + 2 + lean, y - hh + 1], [x + w + 2 + lean, y - hh - (up ? rh * 0.6 : 2)], [x - 2 + lean, y - hh - (up ? 2 : rh * 0.6)]];
  }
  // windows in one or two stories
  const stories = hh > 46 && !small ? 2 : 1;
  const n = Math.max(1, Math.round(w / 20));
  const ww = Math.min(8, (w / n) * 0.42), wh = Math.min(16, (hh / stories) * 0.42);
  const pane = r.chance(0.5) ? '#24357a' : '#3b5aa6';
  for (let s = 0; s < stories; s++) {
    const wy = y - hh + (hh / stories) * s + (hh / stories) * 0.22;
    for (let k = 0; k < n; k++) {
      if (r.chance(0.12)) continue;
      const wx = x + lean * (1 - (wy - (y - hh)) / hh) + (w / n) * (k + 0.5) - ww / 2;
      h.wins.push([wx, wy, ww, wh, r.chance(0.12) ? '#9fd6ef' : pane]);
    }
  }
  if (r.chance(0.45) && !small) h.door = [x + r.range(0.15, 0.7) * w, Math.max(5, w * 0.16), Math.min(hh * 0.35, 18), r.pick([INK, '#7a3a2a', '#2c6b4a'])];
  if (stories === 2 && r.chance(0.35)) { const bw = w * 0.6; h.balc = [x + (w - bw) / 2, y - hh / 2 - 2, bw]; }
  return h;
}

// rows of houses, shelf over shelf, packed from the foot to the crest. Each
// row stands a little taller than its shelf, so it hides the foot of the row
// behind: the rows are laid from the crest down, far to near.
function houses(p, r) {
  const rows = [];
  let y = FOOT + 10;
  while (y > 440) {
    const k = clamp((FOOT - y) / (FOOT - 470));
    const bh = lerp(92, 44, k);
    const row = [], bush = [];
    let x = PX - 20 + r.range(0, 20);
    while (x < PX + PW + 10) {
      const w = bh * r.range(0.75, 1.4);
      const hh = bh * r.range(0.95, 1.4);
      const foot = y + J(r, 4);
      const top = foot - hh;
      const ok = ridge(x) < top - 4 && ridge(x + w) < top - 4 && !onRavine(x - 2, x + w + 2, foot - bh / 2) &&
        !onLift(x, x + w, foot - bh * 0.3) && !onLift(x, x + w, top) && !kept(x, top, x + w, foot);
      if (ok && r.chance(0.97)) row.push(makeHouse(r, x, foot, w, hh, k > 0.75));
      else if (ridge(x) < foot - 10) for (let n = 0; n < 3; n++) bush.push([x + r.range(0, w), foot - r.range(4, bh * 0.6), r.range(6, 12), r.pick(['#3f7a3a', '#5c9a40', '#2f6a35'])]);
      x += w + r.range(-3, 5);
    }
    if (row.length) rows.push({ y, bh, row, bush });
    y -= bh * r.range(0.78, 0.9);
  }
  rows.reverse().forEach((R, i) => {
    const b = { x: PX - 30, y: R.y - R.bh * 2.1 - 10, w: PW + 60, h: R.bh * 2.1 + 24 };
    p.group('houses', b, (c) => {
      for (const [x, yy, s, col] of R.bush) { c.fillStyle = col; c.beginPath(); c.arc(x, yy, s, 0, Math.PI * 2); c.fill(); }
      for (const h of R.row) drawHouse(c, h);
    }, { t: 2.4 + i * 0.26, d: 0.8, reveal: 'drop', dy: 22, ease: 'out' });
  });
}

// the ravines: green gullies with trees, painted stairways climbing them between mural walls
function ravines(p, r) {
  RAVINES.forEach((q, qi) => {
    const top = ridge(q.x0) + 18;
    const left = [], right = [];
    for (let y = top; y <= FOOT + 10; y += 14) { const [cx, hw] = ravAt(q, y); left.push([cx - hw + J(r, 2), y]); right.push([cx + hw + J(r, 2), y]); }
    const shape = [...left, ...right.reverse()];
    // the stair: a zigzag of flights up the gully
    const flights = [];
    let y = FOOT + 4, side = -1;
    while (y > Math.max(top + 40, 820)) {
      const [cx, hw] = ravAt(q, y);
      const y2 = Math.max(top + 30, y - r.range(70, 100));
      const [cx2, hw2] = ravAt(q, y2);
      flights.push([cx + side * hw * 0.3, y, cx2 - side * hw2 * 0.3, y2]);
      y = y2; side = -side;
    }
    // trees and bushes in the gully
    const trees = [];
    for (let i = 0; i < 46; i++) {
      const yy = r.range(top + 10, FOOT); const [cx, hw] = ravAt(q, yy);
      const big = yy < 820 ? 1 : 0.7;
      trees.push([cx + r.pick([-1, 1]) * hw * r.range(0.8, 1.25), yy, r.range(9, 18) * big, r.pick(['#3f7a3a', '#2f6a35', '#5c9a40', '#78ad48'])]);
    }
    // mural panels on the walls beside the stair: flat shapes in bright paint (fish, waves, a sun, flowers)
    const murals = [];
    for (let i = 0; i < 5; i++) {
      const yy = lerp(FOOT - 40, 880, i / 4); const [cx, hw] = ravAt(q, yy);
      const sd = i % 2 ? 1 : -1;
      murals.push({ x: cx + sd * (hw + 2) - (sd > 0 ? 0 : 40), y: yy - 44, w: 40, h: 46, bg: r.pick(['#f4c430', '#e8436f', '#2fb3a8', '#3d6fd1', '#f07f2d']), kind: i % 4, fg: r.pick(['#fdf6e8', INK, '#e5483a', '#8bc34a']) });
    }
    p.group('ravine', boxOf(shape, 6), (c) => {
      c.fillStyle = HILL_D; poly(c, shape); c.fill();
      c.fillStyle = '#4a6b2e';
      c.beginPath(); for (const [x, yy] of left) c.rect(x, yy, 4, 10); c.fill();
    }, { t: 5.6 + qi * 0.3, d: 0.8, reveal: 'rise' });
    p.group('ravine', boxOf(shape, 40), (c) => {
      for (const [x, yy, s, col] of trees) {
        c.fillStyle = shade(col, 0.75); c.beginPath(); c.arc(x + 2, yy + 2, s, 0, Math.PI * 2); c.fill();
        c.fillStyle = col; c.beginPath(); c.arc(x, yy, s * 0.9, 0, Math.PI * 2); c.fill();
      }
      for (const m of murals) {
        c.fillStyle = m.bg; c.fillRect(m.x, m.y, m.w, m.h);
        c.fillStyle = m.fg; c.strokeStyle = m.fg; c.lineWidth = 2.4;
        const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
        if (m.kind === 0) { c.beginPath(); c.ellipse(cx - 2, cy, 10, 6, 0, 0, Math.PI * 2); c.moveTo(cx + 7, cy); c.lineTo(cx + 14, cy - 6); c.lineTo(cx + 14, cy + 6); c.fill(); }
        else if (m.kind === 1) { c.beginPath(); for (let k = 0; k < 3; k++) { c.moveTo(m.x + 3, cy - 8 + k * 8); c.quadraticCurveTo(m.x + 10, cy - 14 + k * 8, cx, cy - 8 + k * 8); c.quadraticCurveTo(cx + 8, cy - 2 + k * 8, m.x + m.w - 3, cy - 8 + k * 8); } c.stroke(); }
        else if (m.kind === 2) { c.beginPath(); c.arc(cx, cy, 8, 0, Math.PI * 2); c.fill(); c.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.moveTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11); c.lineTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15); } c.stroke(); }
        else { for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; c.beginPath(); c.arc(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 4.5, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#f4c430'; c.beginPath(); c.arc(cx, cy, 3.5, 0, Math.PI * 2); c.fill(); }
        c.strokeStyle = 'rgba(29,36,86,.7)'; c.lineWidth = 1.2; c.strokeRect(m.x, m.y, m.w, m.h);
      }
    }, { t: 6.0 + qi * 0.3, d: 0.8, reveal: 'fade' });
    // the steps, painted every color, one flight after another
    flights.forEach(([x0, y0, x1, y1], fi) => {
      const n = Math.max(6, Math.round((y0 - y1) / 6));
      p.group('ravine', { x: Math.min(x0, x1) - 20, y: y1 - 12, w: Math.abs(x1 - x0) + 40, h: y0 - y1 + 20 }, (c) => {
        for (let k = 0; k < n; k++) {
          const t = k / n, t2 = (k + 1) / n;
          const xa = lerp(x0, x1, t), ya = lerp(y0, y1, t), yb = lerp(y0, y1, t2);
          c.fillStyle = qi === 0 ? HOUSE[(k + fi * 3) % HOUSE.length] : (k % 2 ? '#d8d2c4' : '#b9b2a3');
          c.fillRect(xa - 11, yb, 22, ya - yb + 0.6);
          if (qi === 1) { c.fillStyle = HOUSE[(k * 2 + fi) % HOUSE.length]; c.fillRect(xa - 11, ya - 1.6, 22, 1.6); }
        }
        c.strokeStyle = 'rgba(29,36,86,.85)'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(x0 - 12, y0); c.lineTo(x1 - 12, y1); c.moveTo(x0 + 12, y0); c.lineTo(x1 + 12, y1); c.stroke();
        c.strokeStyle = qi === 0 ? '#fdf6e8' : '#d93a30'; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(x0 + 14, y0 - 12); c.lineTo(x1 + 14, y1 - 12); c.stroke();
      }, { t: 6.4 + qi * 0.3 + fi * 0.12, d: 0.6, reveal: 'rise' });
    });
  });
}

// Palacio Baburizza: an Art Nouveau house on Cerro Alegre, cream with green
// trim, bay windows and a central turret with a pointed cap
function baburizza(p, r) {
  const x = 150, y = 1008, w = 190, hh = 120;
  p.group('marks', { x: x - 20, y: y - 260, w: w + 40, h: 270 }, (c) => {
    // terrace wall below
    c.fillStyle = '#b89a6a'; c.fillRect(x - 12, y - 4, w + 24, 16);
    c.strokeStyle = 'rgba(29,36,86,.5)'; c.lineWidth = 1; c.beginPath(); for (let xx = x - 12; xx < x + w + 12; xx += 14) { c.moveTo(xx, y - 4); c.lineTo(xx, y + 12); } c.stroke();
    // body
    c.fillStyle = '#f1dfb2'; c.fillRect(x, y - hh, w, hh);
    // wings' steep slate roofs
    c.fillStyle = '#4d5f6a';
    poly(c, [[x - 6, y - hh], [x + 70, y - hh], [x + 58, y - hh - 36], [x + 6, y - hh - 36]]); c.fill();
    poly(c, [[x + w - 70, y - hh], [x + w + 6, y - hh], [x + w - 6, y - hh - 36], [x + w - 58, y - hh - 36]]); c.fill();
    // turret
    const tx = x + w / 2;
    c.fillStyle = '#ecd29a'; c.fillRect(tx - 24, y - hh - 70, 48, 72);
    c.fillStyle = '#3e6b55';
    poly(c, [[tx - 30, y - hh - 68], [tx + 30, y - hh - 68], [tx, y - hh - 140]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(tx, y - hh - 140); c.lineTo(tx, y - hh - 156); c.stroke();
    // green trim and timberwork
    c.fillStyle = '#3e6b55';
    c.fillRect(x, y - hh, w, 5); c.fillRect(x, y - hh / 2 - 2, w, 4); c.fillRect(tx - 24, y - hh - 70, 48, 4);
    // bay windows
    for (const bx of [x + 14, x + w - 54]) {
      c.fillStyle = '#e3c98e'; c.fillRect(bx, y - hh + 12, 40, hh - 18);
      for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) { c.fillStyle = '#fdf6e8'; c.fillRect(bx + 4 + j * 12, y - hh + 18 + k * 52, 9, 34); c.fillStyle = '#2b4b7d'; c.fillRect(bx + 5.5 + j * 12, y - hh + 20 + k * 52, 6, 30); }
    }
    for (let j = 0; j < 3; j++) { c.fillStyle = '#fdf6e8'; c.fillRect(tx - 18 + j * 13, y - hh - 58, 10, 26); c.fillStyle = '#2b4b7d'; c.fillRect(tx - 16.5 + j * 13, y - hh - 56, 7, 22); }
    // the door with its arch
    c.fillStyle = '#6b3d26'; c.beginPath(); c.moveTo(tx - 14, y); c.lineTo(tx - 14, y - 30); c.arc(tx, y - 30, 14, Math.PI, 0); c.lineTo(tx + 14, y); c.fill();
    c.strokeStyle = 'rgba(29,36,86,.85)'; c.lineWidth = 1.6; c.strokeRect(x, y - hh, w, hh); c.strokeRect(tx - 24, y - hh - 70, 48, 72);
  }, { t: 7.0, d: 0.8, reveal: 'drop', dy: 30 });
}

// the Lutheran church of the Holy Cross on Cerro Concepción: a slim stone-colored
// nave and a tall spire
function lutheran(p, r) {
  const x = 885, y = 830, w = 110;
  p.group('marks', { x: x - 20, y: y - 330, w: w + 50, h: 340 }, (c) => {
    // nave
    c.fillStyle = '#e8d6ae'; c.fillRect(x, y - 92, w, 92);
    c.fillStyle = '#8b3a2e'; poly(c, [[x - 6, y - 92], [x + w + 6, y - 92], [x + w - 10, y - 128], [x + 10, y - 128]]); c.fill();
    for (let k = 0; k < 4; k++) { c.fillStyle = '#2b4b7d'; c.beginPath(); const wx = x + 14 + k * 24; c.moveTo(wx, y - 20); c.lineTo(wx, y - 64); c.lineTo(wx + 5, y - 72); c.lineTo(wx + 10, y - 64); c.lineTo(wx + 10, y - 20); c.fill(); }
    // tower and spire
    const tx = x + 30;
    c.fillStyle = '#f1e3c2'; c.fillRect(tx - 22, y - 190, 44, 190);
    c.fillStyle = '#2b4b7d'; c.beginPath(); c.moveTo(tx - 6, y - 140); c.lineTo(tx - 6, y - 170); c.lineTo(tx, y - 178); c.lineTo(tx + 6, y - 170); c.lineTo(tx + 6, y - 140); c.fill();
    c.fillStyle = '#fdf6e8'; c.beginPath(); c.arc(tx, y - 108, 11, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.arc(tx, y - 108, 11, 0, Math.PI * 2); c.moveTo(tx, y - 108); c.lineTo(tx, y - 116); c.moveTo(tx, y - 108); c.lineTo(tx + 6, y - 106); c.stroke();
    c.fillStyle = '#4d5f6a'; poly(c, [[tx - 26, y - 188], [tx + 26, y - 188], [tx, y - 318]]); c.fill();
    c.strokeStyle = '#2f3a42'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx, y - 188); c.lineTo(tx, y - 318); c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(tx, y - 318); c.lineTo(tx, y - 330); c.moveTo(tx - 5, y - 325); c.lineTo(tx + 5, y - 325); c.stroke();
    c.strokeStyle = 'rgba(29,36,86,.85)'; c.lineWidth = 1.6; c.strokeRect(x, y - 92, w, 92); c.strokeRect(tx - 22, y - 190, 44, 190);
  }, { t: 7.3, d: 0.9, reveal: 'rise' });
}

// a little lookout pavilion on the right hill
function lookout(p, r) {
  const x = 1452, y = 880;
  p.group('marks', { x: x - 10, y: y - 150, w: 80, h: 160 }, (c) => {
    c.fillStyle = '#e8436f'; c.fillRect(x, y - 110, 56, 110);
    c.fillStyle = '#fdf6e8'; for (let k = 0; k < 3; k++) c.fillRect(x + 8, y - 100 + k * 34, 40, 18);
    c.fillStyle = '#3d6fd1'; for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) c.fillRect(x + 10 + j * 13, y - 98 + k * 34, 10, 14);
    c.fillStyle = RUST; poly(c, [[x - 6, y - 110], [x + 62, y - 110], [x + 28, y - 142]]); c.fill();
    c.strokeStyle = 'rgba(29,36,86,.85)'; c.lineWidth = 1.4; c.strokeRect(x, y - 110, 56, 110);
  }, { t: 7.6, d: 0.7, reveal: 'drop', dy: 24 });
}

// washing hung out across the ravines and between houses
function laundry(p, r) {
  const lines = [];
  RAVINES.forEach((q) => {
    for (const y of [700, 900, 1080, 1250]) {
      if (y < ridge(q.x0) + 60) continue;
      const [cx, hw] = ravAt(q, y);
      lines.push([cx - hw - 16, y + J(r, 6), cx + hw + 16, y + J(r, 6)]);
    }
  });
  for (let i = 0; i < 9; i++) {
    const x = r.range(80, 1500), y = r.range(ridge(x) + 120, FOOT - 40);
    if (onLift(x - 10, x + 70, y) || onRavine(x - 10, x + 70, y)) continue;
    lines.push([x, y, x + r.range(40, 70), y + J(r, 6)]);
  }
  const all = lines.map(([x0, y0, x1, y1]) => {
    const sag = (x1 - x0) * 0.12, clothes = [];
    for (let x = x0 + 6; x < x1 - 8; x += r.range(9, 15)) {
      const t = (x - x0) / (x1 - x0), y = lerp(y0, y1, t) + sag * 4 * t * (1 - t);
      clothes.push([x, y, r.range(5, 9), r.range(7, 13), r.pick(['#fdf6e8', '#e8436f', '#f4c430', '#3d6fd1', '#e5483a', '#2fb3a8', '#fdf6e8'])]);
    }
    return { x0, y0, x1, y1, sag, clothes };
  });
  all.forEach((L, i) => {
    p.group('ravine', { x: L.x0 - 6, y: Math.min(L.y0, L.y1) - 6, w: L.x1 - L.x0 + 12, h: L.sag + 30 }, (c) => {
      c.strokeStyle = 'rgba(29,36,86,.8)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(L.x0, L.y0); c.quadraticCurveTo((L.x0 + L.x1) / 2, (L.y0 + L.y1) / 2 + L.sag * 2, L.x1, L.y1); c.stroke();
      for (const [x, y, w, h, col] of L.clothes) { c.fillStyle = col; c.fillRect(x - w / 2, y, w, h); c.strokeStyle = 'rgba(29,36,86,.5)'; c.strokeRect(x - w / 2, y, w, h); }
    }, { t: 7.4 + i * 0.07, d: 0.6, reveal: 'wipe' });
  });
}

// the funiculars: twin tracks straight up the hill, a station house at the top
function lifts(p, r) {
  LIFTS.forEach((L, i) => {
    const [ax, ay] = L.a, [bx, by] = L.b;
    const len = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / len, ny = (bx - ax) / len;
    const off = (d) => [[ax + nx * d, ay + ny * d], [bx + nx * d, by + ny * d]];
    // the bed under the rails
    const bed = [off(-24)[0], off(24)[0], off(24)[1], off(-24)[1]];
    const n = Math.round(len / 9);
    p.group('rails', boxOf(bed, 6), (c) => {
      c.fillStyle = '#a6896a'; poly(c, bed); c.fill();
      c.strokeStyle = '#5a4636'; c.lineWidth = 2;
      c.beginPath();
      for (let k = 0; k <= n; k++) { const t = k / n; const x = lerp(ax, bx, t), y = lerp(ay, by, t); c.moveTo(x + nx * -22, y + ny * -22); c.lineTo(x + nx * 22, y + ny * 22); }
      c.stroke();
      c.strokeStyle = 'rgba(29,36,86,.6)'; c.lineWidth = 1.3; poly(c, bed); c.stroke();
    }, { t: 7.8 + i * 0.25, d: 0.8, reveal: 'rise', ease: 'inOut' });
    const rails = [-17, -7, 7, 17].map(off);
    p.strokes('rails', rails, '#2c2a33', 2.2, { t: 8.1 + i * 0.25, d: 0.9, reveal: 'rise', ease: 'inOut', cap: 'butt' });
    // the station house at the top
    const sx = bx + (i === 1 ? -40 : -6), sy = by + 12;
    p.group('rails', { x: sx - 14, y: sy - 110, w: 110, h: 118 }, (c) => {
      c.fillStyle = i === 1 ? '#f6e7c1' : '#e8b44a'; c.fillRect(sx, sy - 66, 82, 66);
      c.fillStyle = RUST; poly(c, [[sx - 8, sy - 66], [sx + 90, sy - 66], [sx + 78, sy - 92], [sx + 4, sy - 92]]); c.fill();
      c.fillStyle = INK; c.fillRect(sx + 30, sy - 40, 22, 40);
      c.fillStyle = '#fdf6e8'; c.fillRect(sx + 6, sy - 56, 70, 12);
      c.fillStyle = INK; c.font = `400 12px ${FACE}`; c.textAlign = 'center'; c.fillText('ASCENSOR', sx + 41, sy - 46);
      c.strokeStyle = 'rgba(29,36,86,.85)'; c.lineWidth = 1.4; c.strokeRect(sx, sy - 66, 82, 66);
    }, { t: 8.6 + i * 0.2, d: 0.6, reveal: 'drop', dy: 20 });
  });
}

// a funicular car: a box stepped to the slope, its floor along the rail
function car(c, x, y, ang, col) {
  const w = 30, h = 32;
  const dy = Math.tan(ang) * w; // the floor's rise across the car
  c.fillStyle = col;
  poly(c, [[x - w / 2, y + dy / 2], [x + w / 2, y - dy / 2], [x + w / 2, y - dy / 2 - h], [x - w / 2, y + dy / 2 - h]]); c.fill();
  c.fillStyle = '#fdf6e8';
  c.fillRect(x - w / 2 + 3, y - h + 4, w - 6, 11);
  c.fillStyle = '#2b4b7d';
  for (let k = 0; k < 3; k++) c.fillRect(x - w / 2 + 5 + k * 8.4, y - h + 6, 6, 7);
  c.fillStyle = shade(col, 0.6); c.fillRect(x - w / 2 - 1, y - h - 3, w + 2, 4);
  c.strokeStyle = 'rgba(29,36,86,.9)'; c.lineWidth = 1.3;
  poly(c, [[x - w / 2, y + dy / 2], [x + w / 2, y - dy / 2], [x + w / 2, y - dy / 2 - h], [x - w / 2, y + dy / 2 - h]]); c.stroke();
}

// the lower town, El Plan: a row of tall old facades with bay windows,
// the Armada building and the Reloj Turri
function plan(p, r) {
  const fronts = [];
  let x = PX - 4;
  while (x < PX + PW) {
    const w = r.range(60, 120);
    const skip = (x + w > 520 && x < 790) || (x + w > 1030 && x < 1170);
    if (!skip) {
      const hh = r.range(100, 150);
      const col = r.pick(['#e9c98f', '#d9a7a0', '#c9cfc7', '#efe0bf', '#b7c9d9', '#e6b37a', '#cfe0b0']);
      const floors = Math.floor(hh / 34);
      const bays = Math.max(2, Math.round(w / 26));
      fronts.push({ x, w, hh, col, floors, bays, cornice: shade(col, 0.78), mirador: r.chance(0.5) ? r.int(0, bays - 1) : -1, lit: Array.from({ length: floors * bays }, () => r.chance(0.15)) });
    }
    x += w + (skip ? 0 : r.range(0, 3));
    if (skip) x = (x < 790 && x + 20 > 520) ? 792 : x;
  }
  // the street, trolley wires and the quay wall
  p.group('plan', { x: PX, y: STREET - 60, w: PW, h: QUAY - STREET + 70 }, (c) => {
    c.fillStyle = '#7d7a80'; c.fillRect(PX, STREET, PW, QUAY - STREET);
    c.fillStyle = '#6a676e'; for (let xx = PX; xx < PX + PW; xx += 14) c.fillRect(xx, STREET + 18, 7, 2);
    c.fillStyle = '#c9b48a'; c.fillRect(PX, QUAY - 8, PW, 10);
    c.strokeStyle = '#2c2a33'; c.lineWidth = 1; c.beginPath(); c.moveTo(PX, STREET - 44); c.lineTo(PX + PW, STREET - 46); c.moveTo(PX, STREET - 38); c.lineTo(PX + PW, STREET - 40); c.stroke();
    c.lineWidth = 2.4; c.beginPath(); for (let xx = PX + 80; xx < PX + PW; xx += 220) { c.moveTo(xx, QUAY - 8); c.lineTo(xx, STREET - 50); } c.stroke();
  }, { t: 1.5, d: 0.8, reveal: 'wipe' });
  // street level: shopfronts with awnings
  p.group('plan', { x: PX, y: STREET - 170, w: PW, h: 180 }, (c) => {
    for (const f of fronts) {
      const top = STREET - f.hh;
      c.fillStyle = f.col; c.fillRect(f.x, top, f.w, f.hh);
      c.fillStyle = f.cornice; c.fillRect(f.x - 2, top, f.w + 4, 6); c.fillRect(f.x, top + 34, f.w, 3);
      const bw = f.w / f.bays;
      for (let fl = 0; fl < f.floors - 1; fl++) for (let b = 0; b < f.bays; b++) {
        const wx = f.x + b * bw + bw * 0.25, wy = top + 12 + fl * 34;
        c.fillStyle = '#fdf6e8'; c.fillRect(wx - 1.5, wy - 1.5, bw * 0.5 + 3, 22);
        c.fillStyle = f.lit[fl * f.bays + b] ? '#f6d36b' : '#2b4b7d'; c.fillRect(wx, wy, bw * 0.5, 19);
      }
      if (f.mirador >= 0) { const mx = f.x + f.mirador * bw + 2; c.fillStyle = shade(f.col, 0.9); c.fillRect(mx, top + 8, bw - 4, 56); c.strokeStyle = 'rgba(29,36,86,.6)'; c.lineWidth = 1; c.strokeRect(mx, top + 8, bw - 4, 56); }
      // awnings and shopfronts
      c.fillStyle = '#3a2f3a'; c.fillRect(f.x + 4, STREET - 30, f.w - 8, 30);
      c.fillStyle = shade(f.col, 0.65); c.fillRect(f.x + 2, STREET - 36, f.w - 4, 8);
      c.strokeStyle = 'rgba(29,36,86,.8)'; c.lineWidth = 1.3; c.strokeRect(f.x, top, f.w, f.hh);
    }
  }, { t: 3.4, d: 1.0, reveal: 'rise' });
  // the Armada building: gray stone, mansard roofs, a central tower with a dome and a clock
  const ax = 532, aw = 246, ah = 172;
  p.group('plan', { x: ax - 20, y: STREET - 360, w: aw + 40, h: 366 }, (c) => {
    c.fillStyle = '#d7d4cb'; c.fillRect(ax, STREET - ah, aw, ah);
    c.fillStyle = '#5a6470';
    poly(c, [[ax - 4, STREET - ah], [ax + 70, STREET - ah], [ax + 62, STREET - ah - 30], [ax + 4, STREET - ah - 30]]); c.fill();
    poly(c, [[ax + aw - 70, STREET - ah], [ax + aw + 4, STREET - ah], [ax + aw - 4, STREET - ah - 30], [ax + aw - 62, STREET - ah - 30]]); c.fill();
    const tx = ax + aw / 2;
    c.fillStyle = '#e3e0d6'; c.fillRect(tx - 40, STREET - ah - 80, 80, 82);
    c.fillStyle = '#5a6470'; c.beginPath(); c.moveTo(tx - 44, STREET - ah - 78); c.quadraticCurveTo(tx - 40, STREET - ah - 150, tx, STREET - ah - 158); c.quadraticCurveTo(tx + 40, STREET - ah - 150, tx + 44, STREET - ah - 78); c.fill();
    c.fillStyle = '#c9a54a'; c.fillRect(tx - 3, STREET - ah - 182, 6, 26); c.beginPath(); c.arc(tx, STREET - ah - 184, 5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fdf6e8'; c.beginPath(); c.arc(tx, STREET - ah - 42, 17, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.arc(tx, STREET - ah - 42, 17, 0, Math.PI * 2); c.moveTo(tx, STREET - ah - 42); c.lineTo(tx, STREET - ah - 54); c.moveTo(tx, STREET - ah - 42); c.lineTo(tx + 9, STREET - ah - 38); c.stroke();
    // columns and windows
    for (let fl = 0; fl < 3; fl++) for (let b = 0; b < 9; b++) {
      const wx = ax + 12 + b * 26.5, wy = STREET - ah + 18 + fl * 48;
      c.fillStyle = '#2b4b7d'; c.beginPath(); c.moveTo(wx, wy + 30); c.lineTo(wx, wy + 6); c.arc(wx + 7, wy + 6, 7, Math.PI, 0); c.lineTo(wx + 14, wy + 30); c.fill();
    }
    c.fillStyle = '#b9b5aa'; c.fillRect(ax, STREET - ah, aw, 6); c.fillRect(ax, STREET - ah + 62, aw, 4); c.fillRect(ax, STREET - ah + 110, aw, 4);
    // a flag
    c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(ax + 20, STREET - ah - 30); c.lineTo(ax + 20, STREET - ah - 80); c.stroke();
    c.fillStyle = '#fdf6e8'; c.fillRect(ax + 21, STREET - ah - 80, 26, 8); c.fillStyle = '#d93a30'; c.fillRect(ax + 21, STREET - ah - 72, 26, 8);
    c.fillStyle = '#2c49a8'; c.fillRect(ax + 21, STREET - ah - 80, 9, 8); c.fillStyle = '#fdf6e8'; c.beginPath(); c.arc(ax + 25.5, STREET - ah - 76, 1.8, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(29,36,86,.85)'; c.lineWidth = 1.6; c.strokeRect(ax, STREET - ah, aw, ah); c.strokeRect(tx - 40, STREET - ah - 80, 80, 82);
  }, { t: 4.4, d: 0.9, reveal: 'rise' });
  // the Reloj Turri: a narrow wedge of a building with a clock tower and a little dome
  const tx = 1100, tb = STREET;
  p.group('plan', { x: tx - 80, y: tb - 380, w: 160, h: 386 }, (c) => {
    c.fillStyle = '#e2c487'; c.fillRect(tx - 66, tb - 170, 132, 170);
    for (let fl = 0; fl < 4; fl++) for (let b = 0; b < 4; b++) { c.fillStyle = '#fdf6e8'; c.fillRect(tx - 56 + b * 30, tb - 156 + fl * 36, 18, 24); c.fillStyle = '#2b4b7d'; c.fillRect(tx - 54 + b * 30, tb - 154 + fl * 36, 14, 20); }
    c.fillStyle = '#d6b273'; c.fillRect(tx - 30, tb - 262, 60, 94);
    c.fillStyle = '#fdf6e8'; c.beginPath(); c.arc(tx, tb - 218, 22, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(tx, tb - 218, 22, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 1.2; c.beginPath(); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.moveTo(tx + Math.cos(a) * 17, tb - 218 + Math.sin(a) * 17); c.lineTo(tx + Math.cos(a) * 20, tb - 218 + Math.sin(a) * 20); } c.stroke();
    c.lineWidth = 2.2; c.beginPath(); c.moveTo(tx, tb - 218); c.lineTo(tx - 6, tb - 232); c.moveTo(tx, tb - 218); c.lineTo(tx + 12, tb - 216); c.stroke();
    c.fillStyle = '#3e6b55'; c.beginPath(); c.moveTo(tx - 34, tb - 262); c.quadraticCurveTo(tx - 32, tb - 318, tx, tb - 326); c.quadraticCurveTo(tx + 32, tb - 318, tx + 34, tb - 262); c.fill();
    c.fillStyle = '#c9a54a'; c.fillRect(tx - 2, tb - 352, 4, 28);
    c.fillStyle = '#b98f50'; c.fillRect(tx - 70, tb - 172, 140, 6); c.fillRect(tx - 34, tb - 266, 68, 6);
    c.strokeStyle = 'rgba(29,36,86,.85)'; c.lineWidth = 1.6; c.strokeRect(tx - 66, tb - 170, 132, 170); c.strokeRect(tx - 30, tb - 262, 60, 94);
  }, { t: 4.8, d: 0.9, reveal: 'rise' });
  // people on the pavement
  const folk = [];
  for (let i = 0; i < 26; i++) folk.push([r.range(PX + 20, PX + PW - 20), STREET + r.range(8, 30), r.range(0.85, 1.1), r.pick(['#e5483a', '#3d6fd1', '#f4c430', '#2fb3a8', '#1d2456', '#e8436f', '#8bc34a']), r.pick(['#3a2a22', '#1d2456', '#5a4636'])]);
  folk.sort((a, b) => a[1] - b[1]);
  p.group('plan', { x: PX, y: STREET - 30, w: PW, h: 70 }, (c) => {
    for (const [x, y, s, col, leg] of folk) {
      c.fillStyle = leg; c.fillRect(x - 3 * s, y - 9 * s, 2.4 * s, 9 * s); c.fillRect(x + 0.6 * s, y - 9 * s, 2.4 * s, 9 * s);
      c.fillStyle = col; c.beginPath(); c.moveTo(x - 5 * s, y - 8 * s); c.lineTo(x + 5 * s, y - 8 * s); c.lineTo(x + 4 * s, y - 22 * s); c.lineTo(x - 4 * s, y - 22 * s); c.fill();
      c.fillStyle = '#b77b55'; c.beginPath(); c.arc(x, y - 26 * s, 4 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = leg; c.beginPath(); c.arc(x, y - 27.5 * s, 4 * s, Math.PI, 0); c.fill();
    }
  }, { t: 5.9, d: 0.6, reveal: 'fade' });
}

// the port: a quay with cranes and a container ship, a pier with fishing boats
function port(p, r) {
  // the container quay on the left
  const qy = QUAY + 40;
  p.group('port', { x: PX, y: QUAY - 10, w: 560, h: 70 }, (c) => {
    c.fillStyle = '#b8aa92'; c.fillRect(PX, QUAY - 2, 520, qy - QUAY + 14);
    c.fillStyle = '#9d8f78'; c.fillRect(PX, qy + 6, 520, 6);
  }, { t: 2.0, d: 0.6, reveal: 'wipe' });
  // two gantry cranes, orange, their booms up
  [[120, 1], [330, 0.9]].forEach(([cx, s], i) => {
    const foot = qy + 6, top = foot - 300 * s;
    p.group('port', { x: cx - 90, y: top - 120, w: 220, h: foot - top + 130 }, (c) => {
      c.strokeStyle = '#e06a1f'; c.lineWidth = 7; c.lineCap = 'square';
      c.beginPath();
      c.moveTo(cx - 40, foot); c.lineTo(cx - 32, top); c.moveTo(cx + 40, foot); c.lineTo(cx + 32, top);
      c.moveTo(cx - 36, top + 30); c.lineTo(cx + 36, top + 30); c.moveTo(cx - 38, foot - 90); c.lineTo(cx + 38, foot - 90);
      c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(cx - 38, foot - 90); c.lineTo(cx + 34, top + 30); c.moveTo(cx + 38, foot - 90); c.lineTo(cx - 34, top + 30); c.stroke();
      // the raised boom and its stays
      c.lineWidth = 6; c.beginPath(); c.moveTo(cx - 60, top + 4); c.lineTo(cx + 40, top - 110 * s); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - 10, top - 50); c.lineTo(cx + 40, top - 110 * s); c.moveTo(cx - 10, top - 50); c.lineTo(cx - 60, top + 4); c.stroke();
      c.fillStyle = '#e06a1f'; c.fillRect(cx - 16, top - 56, 12, 56);
      c.fillStyle = '#fdf6e8'; c.fillRect(cx - 10, top + 8, 26, 18); c.fillStyle = '#2b4b7d'; c.fillRect(cx - 7, top + 11, 20, 10);
    }, { t: 3.0 + i * 0.3, d: 0.9, reveal: 'rise' });
  });
  // the container ship along the quay: dark red hull, stacks of boxes, white bridge
  const hx0 = 80, hx1 = 600, hy = qy + 70;
  const boxes = [];
  for (let col = 0; col < 13; col++) {
    const n = r.int(1, 3);
    for (let k = 0; k < n; k++) boxes.push([hx0 + 70 + col * 31, hy - 38 - (k + 1) * 16, r.pick(['#d93a30', '#2fa36b', '#3d6fd1', '#f4c430', '#e8436f', '#f07f2d', '#5c5c66', '#2fb3a8'])]);
  }
  p.group('port', { x: hx0 - 10, y: hy - 140, w: hx1 - hx0 + 30, h: 160 }, (c) => {
    for (const [bx, by, col] of boxes) {
      c.fillStyle = col; c.fillRect(bx, by, 29, 15);
      c.strokeStyle = shade(col, 0.65); c.lineWidth = 1; c.beginPath(); for (let k = 4; k < 29; k += 4) { c.moveTo(bx + k, by + 2); c.lineTo(bx + k, by + 13); } c.stroke();
      c.strokeStyle = 'rgba(29,36,86,.7)'; c.strokeRect(bx, by, 29, 15);
    }
    // bridge at the stern
    c.fillStyle = '#f4efe2'; c.fillRect(hx1 - 80, hy - 110, 46, 72);
    c.fillStyle = '#2b4b7d'; for (let k = 0; k < 4; k++) c.fillRect(hx1 - 76, hy - 104 + k * 16, 38, 6);
    c.fillStyle = '#3a3a44'; c.fillRect(hx1 - 66, hy - 130, 14, 22);
    // hull
    c.fillStyle = '#8f2d2a'; poly(c, [[hx0, hy - 40], [hx1, hy - 40], [hx1 - 14, hy], [hx0 + 26, hy]]); c.fill();
    c.fillStyle = '#2c2a33'; c.fillRect(hx0 + 10, hy - 8, hx1 - hx0 - 30, 8);
    c.fillStyle = '#fdf6e8'; c.fillRect(hx0, hy - 40, hx1 - hx0, 4);
    c.strokeStyle = 'rgba(29,36,86,.85)'; c.lineWidth = 1.6; poly(c, [[hx0, hy - 40], [hx1, hy - 40], [hx1 - 14, hy], [hx0 + 26, hy]]); c.stroke();
  }, { t: 8.8, d: 0.9, reveal: 'slide', dx: -160, ease: 'out' });
  // the pier on the right, on its legs
  const px0 = 1120, px1 = 1290, py = QUAY + 2, pl = QUAY + 110;
  p.group('port', { x: px0 - 10, y: py - 40, w: px1 - px0 + 20, h: pl - py + 50 }, (c) => {
    c.strokeStyle = '#5a4636'; c.lineWidth = 6; c.beginPath(); for (let k = 0; k < 6; k++) { const xx = lerp(px0 + 14, px1 - 14, k / 5); c.moveTo(xx, py + 10); c.lineTo(xx, pl + 20); } c.stroke();
    c.fillStyle = '#9b7a55'; poly(c, [[px0 - 6, py], [px1 + 6, py], [px1 + 6, pl], [px0 - 6, pl]]); c.fill();
    c.strokeStyle = '#7a5d3e'; c.lineWidth = 1.2; c.beginPath(); for (let yy = py + 8; yy < pl; yy += 8) { c.moveTo(px0 - 6, yy); c.lineTo(px1 + 6, yy); } c.stroke();
    // a little kiosk and the pier's lamps
    c.fillStyle = '#2fb3a8'; c.fillRect(px1 - 60, pl - 50, 44, 40); c.fillStyle = '#e5483a'; poly(c, [[px1 - 66, pl - 50], [px1 - 10, pl - 50], [px1 - 38, pl - 70]]); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); for (const xx of [px0 + 20, px0 + 80]) { c.moveTo(xx, pl); c.lineTo(xx, pl - 46); } c.stroke();
    c.fillStyle = '#f6d36b'; for (const xx of [px0 + 20, px0 + 80]) { c.beginPath(); c.arc(xx, pl - 48, 5, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = 'rgba(29,36,86,.8)'; c.lineWidth = 1.4; c.strokeRect(px0 - 6, py, px1 - px0 + 12, pl - py);
  }, { t: 3.6, d: 0.7, reveal: 'fall' });
}

// the bay: deep blue, painted with rows of little white wave curls
function sea(p, r) {
  const y0 = QUAY + 4;
  const curls = [];
  for (let y = y0 + 16; y < PB - 6; y += 15) {
    const k = (y - y0) / (PB - y0);
    const step = lerp(46, 70, k);
    for (let x = PX + (Math.round(y / 15) % 2) * step / 2 + J(r, 6); x < PX + PW; x += step + J(r, 8)) {
      curls.push([x, y + J(r, 2), lerp(7, 13, k), r.chance(0.8) ? '#e9f3fb' : SEA_L]);
    }
  }
  p.group('sea', { x: PX, y: y0 - 4, w: PW, h: PB - y0 + 8 }, (c) => {
    const g = c.createLinearGradient(0, y0, 0, PB);
    g.addColorStop(0, SEA_L); g.addColorStop(0.3, SEA); g.addColorStop(1, SEA_D);
    c.fillStyle = g; c.fillRect(PX, y0, PW, PB - y0);
  }, { t: 1.2, d: 0.9, reveal: 'fall' });
  p.group('sea', { x: PX, y: y0, w: PW, h: PB - y0 }, (c) => {
    c.lineWidth = 2.2; c.lineCap = 'round';
    for (const [x, y, s, col] of curls) {
      c.strokeStyle = col;
      c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x - s * 0.3, y - s * 0.7, x + s * 0.2, y - s * 0.2); c.quadraticCurveTo(x + s * 0.3, y + s * 0.1, x, y); c.stroke();
    }
  }, { t: 2.2, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // the buoy with sea lions
  const bx = 880, by = 1800;
  p.group('sea', { x: bx - 110, y: by - 110, w: 220, h: 150 }, (c) => {
    // the float: a red drum with a white band, its platform on top
    c.fillStyle = '#a82a24'; c.fillRect(bx - 70, by - 14, 140, 26);
    c.fillStyle = '#fdf6e8'; c.fillRect(bx - 70, by - 4, 140, 7);
    c.fillStyle = '#d93a30'; c.beginPath(); c.ellipse(bx, by - 14, 70, 14, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#a82a24'; c.beginPath(); c.ellipse(bx, by + 12, 70, 10, 0, 0, Math.PI); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.ellipse(bx, by - 14, 70, 14, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(bx - 70, by - 14); c.lineTo(bx - 70, by + 12); c.moveTo(bx + 70, by - 14); c.lineTo(bx + 70, by + 12); c.stroke();
    // three sea lions: two asleep, one sitting up with its nose in the air
    const SL = '#8a6448', SLD = '#6b4a34';
    const blob = (pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i += 2) c.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); c.closePath(); };
    c.lineWidth = 1.5; c.strokeStyle = INK;
    blob([[bx - 62, by - 14], [bx - 60, by - 30], [bx - 40, by - 30], [bx - 20, by - 26], [bx - 10, by - 16], [bx - 30, by - 10], [bx - 62, by - 14]]);
    c.fillStyle = SL; c.fill(); c.stroke();
    c.fillStyle = SLD; c.beginPath(); c.ellipse(bx - 62, by - 22, 9, 7, 0.3, 0, Math.PI * 2); c.fill(); c.stroke();
    blob([[bx + 18, by - 14], [bx + 24, by - 28], [bx + 44, by - 28], [bx + 62, by - 24], [bx + 66, by - 14], [bx + 44, by - 8], [bx + 18, by - 14]]);
    c.fillStyle = SLD; c.fill(); c.stroke();
    c.fillStyle = SL; c.beginPath(); c.ellipse(bx + 66, by - 22, 8, 6, -0.3, 0, Math.PI * 2); c.fill(); c.stroke();
    blob([[bx - 16, by - 14], [bx - 18, by - 44], [bx - 2, by - 70], [bx + 8, by - 84], [bx + 22, by - 80], [bx + 12, by - 60], [bx + 12, by - 34], [bx + 14, by - 18], [bx - 16, by - 14]]);
    c.fillStyle = SL; c.fill(); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(bx + 12, by - 78, 2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = SLD; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 10, by - 30); c.quadraticCurveTo(bx - 22, by - 24, bx - 26, by - 14); c.stroke();
}, { t: 9.6, d: 0.6, reveal: 'pop' });
}

// a painted fishing boat (lancha): bright hull, a little cabin, a name stripe
function lancha(c, x, y, s, col, col2) {
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x - 34 * s, y - 12 * s); c.lineTo(x + 36 * s, y - 14 * s); c.quadraticCurveTo(x + 30 * s, y + 4 * s, x + 18 * s, y + 4 * s); c.lineTo(x - 26 * s, y + 4 * s); c.closePath(); c.fill();
  c.fillStyle = col2; c.fillRect(x - 32 * s, y - 10 * s, 66 * s, 4 * s);
  c.fillStyle = '#fdf6e8'; c.fillRect(x - 10 * s, y - 28 * s, 20 * s, 15 * s);
  c.fillStyle = '#2b4b7d'; c.fillRect(x - 6 * s, y - 25 * s, 5 * s, 5 * s); c.fillRect(x + 2 * s, y - 25 * s, 5 * s, 5 * s);
  c.fillStyle = col2; c.fillRect(x - 12 * s, y - 31 * s, 24 * s, 4 * s);
  c.strokeStyle = INK; c.lineWidth = 1.4 * s; c.beginPath(); c.moveTo(x + 20 * s, y - 13 * s); c.lineTo(x + 20 * s, y - 48 * s); c.lineTo(x - 30 * s, y - 13 * s); c.stroke();
  c.strokeStyle = 'rgba(29,36,86,.85)'; c.lineWidth = 1.2 * s;
  c.beginPath(); c.moveTo(x - 34 * s, y - 12 * s); c.lineTo(x + 36 * s, y - 14 * s); c.quadraticCurveTo(x + 30 * s, y + 4 * s, x + 18 * s, y + 4 * s); c.lineTo(x - 26 * s, y + 4 * s); c.closePath(); c.stroke();
}

// the trolleybus: green and cream, its two poles up to the wires
function trolley(c, x, y) {
  c.fillStyle = '#2f7d56'; c.fillRect(x - 54, y - 36, 108, 30);
  c.fillStyle = '#f2e7c6'; c.fillRect(x - 54, y - 26, 108, 12);
  c.fillStyle = '#2b4b7d'; for (let k = 0; k < 6; k++) c.fillRect(x - 48 + k * 17, y - 33, 13, 8);
  c.fillStyle = '#2f7d56'; c.beginPath(); c.moveTo(x - 54, y - 36); c.quadraticCurveTo(x, y - 46, x + 54, y - 36); c.fill();
  c.fillStyle = '#2c2a33'; c.beginPath(); c.arc(x - 34, y - 5, 7, 0, Math.PI * 2); c.arc(x + 34, y - 5, 7, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#2c2a33'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 10, y - 42); c.lineTo(x + 22, y - 66); c.moveTo(x - 4, y - 42); c.lineTo(x + 28, y - 60); c.stroke();
  c.strokeStyle = 'rgba(29,36,86,.85)'; c.lineWidth = 1.3; c.strokeRect(x - 54, y - 36, 108, 30);
}

function life(p, r) {
  // the funicular cars: two on each track, one going up as the other comes down
  const tracks = LIFTS.map((L, i) => {
    const [ax, ay] = L.a, [bx, by] = L.b;
    const len = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / len, ny = (bx - ax) / len;
    return { ax, ay, bx, by, nx, ny, ang: Math.atan2(by - ay, bx - ax) + Math.PI / 2, col: L.col, ph: i * 1.9, sp: 0.16 + i * 0.03 };
  });
  p.live('cars', {
    t: 9.0, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      for (const T of tracks) {
        const u = 0.5 + 0.5 * Math.sin((time - 9) * T.sp * 2 + T.ph);
        const s1 = 0.08 + 0.84 * u, s2 = 0.92 - 0.84 * u;
        for (const [s, d, col] of [[s1, -12, T.col[0]], [s2, 12, T.col[1]]]) {
          const x = lerp(T.ax, T.bx, s) + T.nx * d, y = lerp(T.ay, T.by, s) + T.ny * d;
          car(c, x, y, 0, col);
        }
      }
    },
  });
  // the trolleybus along the street
  p.live('life', {
    t: 9.3, d: 0.8, reveal: 'fade',
    draw: (c, time) => { const x = PX - 70 + ((time - 9.3) * 38 + 180) % (PW + 140); trolley(c, x, STREET + 30); },
  });
  // boats at anchor, rocking; a sailboat crossing
  const boats = [];
  for (let i = 0; i < 7; i++) boats.push([lerp(700, 1500, i / 6) + J(r, 30), r.range(QUAY + 120, PB - 40), r.range(0.8, 1.25), BOAT[i % BOAT.length], BOAT[(i + 3) % BOAT.length]]);
  boats.sort((a, b) => a[1] - b[1]);
  const keep = boats.filter(([x, y]) => !(Math.abs(x - 870) < 110 && Math.abs(y - 1790) < 60) && !(x > 1100 && x < 1310 && y < QUAY + 140));
  p.live('life', {
    t: 9.0, d: 0.9, reveal: 'fade',
    draw: (c, time) => {
      keep.forEach(([x, y, s, a, b], i) => {
        const bob = Math.sin(time * 1.4 + i * 1.7) * 2 * s, tilt = Math.sin(time * 1.1 + i) * 0.04;
        c.save(); c.translate(x, y + bob); c.rotate(tilt); lancha(c, 0, 0, s, a, b); c.restore();
      });
    },
  });
  // volantines: paper kites over the hills, their strings down to a roof
  const kites = [[200, 470, 300, 760, '#e5483a', '#f4c430'], [1420, 420, 1330, 720, '#3d6fd1', '#fdf6e8'], [760, 520, 690, 700, '#2fa36b', '#e8436f']];
  p.live('life', {
    t: 9.5, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      kites.forEach(([x0, y0, ax, ay, c1, c2], i) => {
        const x = x0 + Math.sin(time * 0.7 + i * 2) * 14, y = y0 + Math.sin(time * 1.1 + i) * 8, a = Math.sin(time * 0.9 + i) * 0.15;
        c.strokeStyle = 'rgba(29,36,86,.6)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x, y + 26); c.quadraticCurveTo((x + ax) / 2 + 30, (y + ay) / 2 + 20, ax, ay); c.stroke();
        c.save(); c.translate(x, y); c.rotate(a);
        c.fillStyle = c1; c.beginPath(); c.moveTo(0, -26); c.lineTo(20, 0); c.lineTo(0, 26); c.lineTo(-20, 0); c.closePath(); c.fill();
        c.fillStyle = c2; c.beginPath(); c.moveTo(0, -26); c.lineTo(20, 0); c.lineTo(0, 0); c.closePath(); c.fill(); c.beginPath(); c.moveTo(0, 26); c.lineTo(-20, 0); c.lineTo(0, 0); c.closePath(); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, -26); c.lineTo(20, 0); c.lineTo(0, 26); c.lineTo(-20, 0); c.closePath(); c.moveTo(0, -26); c.lineTo(0, 26); c.moveTo(-20, 0); c.lineTo(20, 0); c.stroke();
        c.restore();
        // the tail of paper bows
        c.strokeStyle = c1; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + 26);
        for (let k = 1; k <= 6; k++) c.lineTo(x + Math.sin(time * 3 + k * 0.9 + i) * 6, y + 26 + k * 9);
        c.stroke();
      });
    },
  });
  // gulls wheeling over the port
  const gulls = Array.from({ length: 9 }, (_, i) => [r.range(200, 1400), r.range(1150, 1500), r.range(0.8, 1.3), r.range(0, 6)]);
  p.live('life', {
    t: 9.8, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = '#fdf6e8'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath();
      for (const [x0, y0, s, ph] of gulls) {
        const x = x0 + Math.sin(time * 0.3 + ph) * 60, y = y0 + Math.cos(time * 0.4 + ph) * 20, f = Math.sin(time * 5 + ph) * 4;
        c.moveTo(x - 12 * s, y - f); c.quadraticCurveTo(x - 6 * s, y - 8 * s, x, y); c.quadraticCurveTo(x + 6 * s, y - 8 * s, x + 12 * s, y - f);
      }
      c.stroke();
    },
  });
}

// the name painted across the sky, and the caption on the frame
function title(p, r) {
  const cx = W / 2;
  p.type('title', 'Valparaíso', cx, 330, {
    family: FACE, size: 250, color: '#fff6df', shadow: '#1d2456', sx: 7, sy: 8, align: 'center', track: 0.01,
    t: 10.6, gap: 0.16, d: 0.7, reveal: 'drop', fit: 1300,
  });
  p.type('title', 'CERRO ALEGRE  ·  CERRO CONCEPCIÓN  ·  EL PLAN  ·  EL PUERTO  ·  CHILE', cx, H - 48, {
    family: FACE, size: 40, color: '#fbf2dc', align: 'center', track: 0.08, t: 12.8, gap: 0.012, d: 0.4, reveal: 'fade', fit: PW - 80,
  });
}
