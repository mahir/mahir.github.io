// Bangkok: a Thai temple mural, painted flat in gold on a lacquer red. Wat Arun's
// great prang stands in the middle on its three terraces, tier on tier of
// porcelain flowers, with two of its smaller prangs beside it and mural trees
// between. The Chao Phraya runs across the foot in curling gold lines, with
// longtail boats, a rice barge and sampans of fruit sellers. In the upper corners,
// fenced off by the zigzag lines murals use to part one scene from the next, the
// Grand Palace's Chakri Maha Prasat and the Giant Swing. Small gold flowers are
// scattered over the red, and the border is a chain of rosettes and flames.

import { Plate, W, H } from '../print.js';
import { poly, lerp } from '../kit.js';

const RED = '#7e1b13', RED_D = '#5c110c', RED_L = '#9a2c1c', GOLD = '#d4a13c', GOLD_L = '#f1cf78', GOLD_D = '#98681f';
const INK = '#21130d', CREAM = '#efe2c3', CREAM_D = '#cdbb98', GREEN = '#2e5a44', GREEN_L = '#4f7d55', GREEN_D = '#1d3a2d';
const WATER = '#173c40', WATER_L = '#21545a', PINK = '#d98a78', BLUE = '#3d5f93', ORANGE = '#d26a2c', SKIN = '#c98a55';
const F = 'Chonburi, serif';
const THAI = 'กรุงเทพ', SUB = 'วัดอรุณราชวราราม · แม่น้ำเจ้าพระยา';

export const city = {
  id: 'bangkok', name: 'Bangkok', wall: '#3a0f0c',
  alt: "A Thai temple mural in gold on lacquer red: Wat Arun's great prang on its terraces with two smaller prangs beside it and mural trees between, a white riverside wall and a pier pavilion, longtail boats, a rice barge and fruit sellers' sampans on the curling waves of the Chao Phraya, the Chakri Maha Prasat and the Giant Swing in zigzag-edged scenes in the upper corners, gold flowers scattered over the red, and the name in Thai with Bangkok beneath",
  google: 'family=Chonburi',
  fonts: [['400 100px Chonburi', THAI + ' BANGKOK ' + SUB]],
  build,
};

// the picture inside the border, the riverbank, the river's foot
const X0 = 126, X1 = W - 126, Y0 = 126, Y1 = H - 126;
const BANK = 1272, RIVER = 1330, RFOOT = 1624;

function build() {
  const p = new Plate({ paper: RED_D, seed: 1782 });
  const r = p.r;
  p.stack('ground', 'sky', 'scenes', 'trees', 'prangs', 'prang', 'bank', 'river', 'boats', 'border', 'live', 'title');

  ground(p);
  sky(p, r);
  scenes(p, r);
  trees(p, r);
  prangs(p, r);
  bank(p, r);
  river(p, r);
  boats(p, r);
  border(p);
  life(p);
  title(p);
  return p;
}

// ================================================================ ground and sky
function ground(p) {
  p.group('ground', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = RED; c.fillRect(X0, Y0, X1 - X0, BANK - Y0 + 4);
  }, { t: 0, d: 0.8, reveal: 'fade' });
  // the river, painted in a deep green
  p.group('ground', { x: X0, y: RIVER - 10, w: X1 - X0, h: RFOOT - RIVER + 20 }, (c) => {
    c.fillStyle = WATER; c.fillRect(X0, RIVER - 8, X1 - X0, RFOOT - RIVER + 8);
  }, { t: 1.6, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // the title panel
  p.group('ground', { x: X0, y: RFOOT, w: X1 - X0, h: Y1 - RFOOT }, (c) => {
    c.fillStyle = RED_D; c.fillRect(X0, RFOOT, X1 - X0, Y1 - RFOOT);
  }, { t: 0.3, d: 0.8, reveal: 'fade' });
}

// a gold flower of four petals, the mural's scattered ground pattern
function flower(c, x, y, s) {
  c.moveTo(x, y - s); c.quadraticCurveTo(x + s * 0.35, y - s * 0.35, x + s, y);
  c.quadraticCurveTo(x + s * 0.35, y + s * 0.35, x, y + s);
  c.quadraticCurveTo(x - s * 0.35, y + s * 0.35, x - s, y);
  c.quadraticCurveTo(x - s * 0.35, y - s * 0.35, x, y - s);
}

function sky(p, r) {
  // flowers strewn over the red, on a loose lattice so they never clump
  const pts = [];
  for (let y = Y0 + 30, j = 0; y < BANK - 40; y += 46, j++) {
    for (let x = X0 + 24 + (j % 2) * 30; x < X1 - 20; x += 60) pts.push([x + r.range(-9, 9), y + r.range(-8, 8), r.range(5, 8)]);
  }
  const bands = 4;
  for (let b = 0; b < bands; b++) {
    const ya = Y0 + (b / bands) * (BANK - Y0), yb = Y0 + ((b + 1) / bands) * (BANK - Y0);
    p.group('sky', { x: X0, y: ya - 12, w: X1 - X0, h: yb - ya + 24 }, (c) => {
      c.fillStyle = GOLD; c.beginPath();
      for (const [x, y, s] of pts) if (y >= ya && y < yb) flower(c, x, y, s);
      c.fill();
      c.fillStyle = RED_D; c.beginPath();
      for (const [x, y, s] of pts) if (y >= ya && y < yb) { c.moveTo(x + s * 0.22, y); c.arc(x, y, s * 0.22, 0, Math.PI * 2); }
      c.fill();
    }, { t: 0.8 + b * 0.25, d: 0.9, reveal: 'fade' });
  }
  // curling clouds in gold line, as murals draw them
  const clouds = [[700, 300, 1], [960, 520, -1], [420, 760, 1], [1210, 790, -1]];
  clouds.forEach(([x, y, dir], i) => {
    const lines = cloudLines(x, y, dir);
    p.group('sky', { x: x - 150, y: y - 60, w: 300, h: 100 }, (c) => {
      c.fillStyle = RED_L; c.beginPath();
      for (const [cx, cy, rr] of lines.puffs) { c.moveTo(cx + rr, cy); c.arc(cx, cy, rr, 0, Math.PI * 2); }
      c.fill();
      c.strokeStyle = GOLD_L; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();
      for (const [cx, cy, rr] of lines.puffs) { c.moveTo(cx - rr, cy); c.arc(cx, cy, rr, Math.PI, 0); }
      for (const sp of lines.spirals) { c.moveTo(sp[0][0], sp[0][1]); for (const q of sp) c.lineTo(q[0], q[1]); }
      c.moveTo(lines.foot[0], y + 6); c.lineTo(lines.foot[1], y + 6);
      c.stroke();
    }, { t: 1.4 + i * 0.2, d: 0.9, reveal: dir > 0 ? 'wipe' : 'wipeL', ease: 'inOut' });
  });
}

function cloudLines(x, y, dir) {
  const puffs = [], spirals = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), lift = Math.sin(t * Math.PI);
    puffs.push([x + (t - 0.5) * 200, y - lift * 26, 22 + lift * 12]);
  }
  // a spiral tail at one end
  const sx = x + dir * 130, sy = y - 6, sp = [];
  for (let a = 0; a < Math.PI * 3.2; a += 0.2) { const rr = 18 * (1 - a / (Math.PI * 3.6)); sp.push([sx + dir * Math.cos(a) * rr, sy - Math.sin(a) * rr]); }
  spirals.push(sp);
  return { puffs, spirals, foot: [x - 120, x + 120] };
}

// ================================================================ scenes in the corners
// a zigzag line, the mural's divider between scenes: from a to b in teeth of size k
function zigzag(a, b, k = 12) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L / k));
  const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy, ny = ux;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, o = i % 2 ? k * 0.55 : 0;
    out.push([lerp(a[0], b[0], t) + nx * o, lerp(a[1], b[1], t) + ny * o]);
  }
  return out;
}

function scenes(p, r) {
  // left: the Grand Palace's Chakri Maha Prasat; right: the Giant Swing
  const left = [[X0, Y0], [600, Y0], [528, 600], [X0, 600]];
  const right = [[1000, Y0], [X1, Y0], [X1, 600], [1072, 600]];
  for (const [shape, t, edge] of [[left, 2.4, [[600, Y0], [528, 600], [X0, 600]]], [right, 2.7, [[1000, Y0], [1072, 600], [X1, 600]]]]) {
    p.group('scenes', { x: Math.min(...shape.map((q) => q[0])) - 10, y: Y0, w: 520, h: 490 }, (c) => {
      c.fillStyle = RED_D; poly(c, shape); c.fill();
    }, { t, d: 0.7, reveal: 'fade' });
    const z = [...zigzag(edge[0], edge[1], 14), ...zigzag(edge[1], edge[2], 14).slice(1)];
    p.pen('scenes', z, GOLD, 2.4, { t: t + 0.3, d: 1.2 });
    p.pen('scenes', z.map(([x, y]) => [x + (shape === left ? 7 : -7), y + 7]), GOLD_D, 1.2, { t: t + 0.5, d: 1.2 });
  }
  chakri(p);
  swing(p, r);
}

// a Thai tiered roof seen from the front: layers of red tile edged in green, gold
// finials (chofa) curling up at the gable tips. Returns nothing; draws at (x, y) foot.
function thaiRoof(c, x, y, w, h, tiers = 3) {
  for (let i = 0; i < tiers; i++) {
    const k = i / tiers, ww = w * (1 - k * 0.28), yy = y - h * k, hh = h / tiers * 1.15;
    const pts = [[x - ww / 2, yy], [x + ww / 2, yy], [x + ww * 0.3, yy - hh], [x - ww * 0.3, yy - hh]];
    c.fillStyle = ORANGE; poly(c, pts); c.fill();
    c.fillStyle = GREEN; poly(c, [[x - ww / 2, yy], [x + ww / 2, yy], [x + ww / 2 - 4, yy - 4], [x - ww / 2 + 4, yy - 4]]); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 1.4; poly(c, pts); c.stroke();
    // the chofa: a gold hook at each lower corner
    c.beginPath();
    for (const s of [-1, 1]) { const ex = x + s * ww / 2; c.moveTo(ex, yy); c.quadraticCurveTo(ex + s * 6, yy - 4, ex + s * 4, yy - 14); }
    c.lineWidth = 2.2; c.stroke();
  }
}

// a prasat spire: stepped bells and a long gold needle
function spire(c, x, y, h, w) {
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const k = i / steps, ww = w * (1 - k * 0.8), yy = y - h * 0.55 * k;
    c.fillStyle = i % 2 ? GOLD : GOLD_L; c.fillRect(x - ww / 2, yy - h * 0.55 / steps, ww, h * 0.55 / steps);
  }
  c.fillStyle = GOLD; poly(c, [[x - w * 0.12, y - h * 0.55], [x + w * 0.12, y - h * 0.55], [x, y - h]]); c.fill();
  c.strokeStyle = GOLD_D; c.lineWidth = 1; c.beginPath();
  for (let i = 1; i < 5; i++) { const yy = y - h * 0.55 - i * h * 0.08, ww = w * 0.12 * (1 - i * 0.2); c.moveTo(x - ww, yy); c.lineTo(x + ww, yy); }
  c.stroke();
}

function chakri(p) {
  const g = 556, x0 = 156, x1 = 500, cx = 328;
  // the long hall: two stories of tall windows behind a row of columns, a balustrade at its foot
  p.group('scenes', { x: x0 - 6, y: g - 130, w: x1 - x0 + 12, h: 136 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(x0, g - 116, x1 - x0, 116);
    c.fillStyle = CREAM_D; c.fillRect(x0, g - 22, x1 - x0, 22);
    c.fillStyle = RED_D; c.beginPath();
    for (let x = x0 + 10; x < x1 - 12; x += 22) { c.rect(x, g - 104, 9, 30); c.rect(x, g - 62, 9, 34); }
    c.fill();
    c.fillStyle = GOLD; c.beginPath();
    for (let x = x0 + 10; x < x1 - 12; x += 22) { c.moveTo(x, g - 104); c.arc(x + 4.5, g - 104, 4.5, Math.PI, 0); }
    c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 1.4; c.strokeRect(x0, g - 116, x1 - x0, 116);
    c.beginPath(); c.moveTo(x0, g - 70); c.lineTo(x1, g - 70); c.stroke();
    c.lineWidth = 1; c.beginPath();
    for (let x = x0 + 4; x < x1; x += 7) { c.moveTo(x, g - 2); c.lineTo(x, g - 14); }
    c.stroke();
  }, { t: 4.2, d: 0.9, reveal: 'rise' });
  // three prasat roofs and spires: the middle one tallest
  [[x0 + 50, 92, 200, 4.7], [x1 - 50, 92, 200, 4.9], [cx, 132, 290, 5.2]].forEach(([x, w, h, t]) => {
    p.group('scenes', { x: x - w / 2 - 14, y: g - 116 - h - 10, w: w + 28, h: h + 14 }, (c) => {
      const base = g - 116;
      thaiRoof(c, x, base, w, h * 0.32, 3);
      spire(c, x, base - h * 0.3, h * 0.7, w * 0.36);
    }, { t, d: 0.9, reveal: 'rise', ease: 'inOut' });
  });
  // the wall in front and a gate in it
  p.group('scenes', { x: X0, y: g - 8, w: 400, h: 50 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(X0 + 4, g, 392, 32);
    c.fillStyle = GOLD; c.beginPath();
    for (let x = X0 + 8; x < X0 + 392; x += 18) { c.moveTo(x, g); c.lineTo(x + 6, g - 7); c.lineTo(x + 12, g); }
    c.fill();
    c.fillStyle = RED_D; c.beginPath(); c.moveTo(cx - 16, g + 32); c.lineTo(cx - 16, g + 12); c.arc(cx, g + 12, 16, Math.PI, 0); c.lineTo(cx + 16, g + 32); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 1.2; c.strokeRect(X0 + 4, g, 392, 32);
  }, { t: 5.5, d: 0.6, reveal: 'wipe' });
}

function swing(p, r) {
  const g = 540, xa = 1268, xb = 1372, top = 214;
  // the white platform, the two tall red posts and their struts, the carved crossbar
  p.group('scenes', { x: xa - 50, y: top - 30, w: xb - xa + 100, h: g - top + 50 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(xa - 40, g, xb - xa + 80, 18);
    c.strokeStyle = GOLD; c.lineWidth = 1.2; c.strokeRect(xa - 40, g, xb - xa + 80, 18);
    c.fillStyle = '#c4301f';
    poly(c, [[xa - 8, g], [xa + 8, g], [xa + 6, top], [xa - 6, top]]); c.fill();
    poly(c, [[xb - 8, g], [xb + 8, g], [xb + 6, top], [xb - 6, top]]); c.fill();
    // the struts leaning in
    c.strokeStyle = '#c4301f'; c.lineWidth = 6; c.beginPath();
    c.moveTo(xa - 34, g); c.lineTo(xa - 4, g - 110); c.moveTo(xb + 34, g); c.lineTo(xb + 4, g - 110);
    c.stroke();
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath();
    for (const y of [g - 90, g - 160, g - 230]) { c.moveTo(xa - 6, y); c.lineTo(xa + 6, y); c.moveTo(xb - 6, y); c.lineTo(xb + 6, y); }
    c.stroke();
    // the crossbar with carved, upturned ends
    c.fillStyle = '#c4301f'; c.fillRect(xa - 30, top - 6, xb - xa + 60, 14);
    c.fillStyle = GOLD;
    for (const [x, s] of [[xa - 30, -1], [xb + 30, 1]]) poly(c, [[x, top - 6], [x, top + 8], [x + s * 16, top - 14], [x + s * 10, top - 16]]);
    c.fill();
    c.fillStyle = GOLD; c.fillRect(xa - 20, top - 14, xb - xa + 40, 6);
  }, { t: 5.0, d: 1.1, reveal: 'rise', ease: 'inOut' });
  // shophouses along the street behind it, and a tuk-tuk
  p.group('scenes', { x: 1086, y: 380, w: 380, h: 220 }, (c) => {
    for (let i = 0; i < 6; i++) {
      const x = 1100 + i * 62; if (x > X1 - 10) break;
      const hgt = 70 + (i % 3) * 10;
      c.fillStyle = i % 2 ? CREAM : CREAM_D; c.fillRect(x, g + 18, 60, -hgt);
      c.fillStyle = GREEN; c.beginPath(); c.rect(x + 8, g + 18 - hgt + 12, 14, 20); c.rect(x + 36, g + 18 - hgt + 12, 14, 20); c.fill();
      c.fillStyle = ORANGE; c.fillRect(x - 2, g + 18 - hgt - 6, 64, 8);
      c.strokeStyle = GOLD_D; c.lineWidth = 1; c.strokeRect(x, g + 18, 60, -hgt);
    }
  }, { t: 4.4, d: 0.8, reveal: 'rise' });
  p.group('scenes', { x: 1140, y: 540, w: 80, h: 60 }, (c) => {
    const x = 1150, y = 590;
    c.fillStyle = BLUE; poly(c, [[x, y - 8], [x + 52, y - 8], [x + 54, y - 34], [x + 12, y - 34], [x, y - 22]]); c.fill();
    c.fillStyle = GOLD_L; c.fillRect(x + 8, y - 40, 50, 7);
    c.fillStyle = INK; c.beginPath(); c.arc(x + 8, y - 4, 6, 0, Math.PI * 2); c.arc(x + 46, y - 4, 6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 1.2; c.strokeRect(x + 16, y - 30, 14, 14);
  }, { t: 5.9, d: 0.5, reveal: 'pop', ease: 'back' });
  // people on the street: a woman with a shoulder pole, a man in a hat
  p.group('scenes', { x: 1200, y: 520, w: 260, h: 70 }, (c) => {
    person(c, 1236, 584, 1, '#2f5a44', 'hat');
    person(c, 1410, 584, 1, '#3d5f93', 'pole');
    person(c, 1444, 584, 0.9, '#d26a2c', 'none');
  }, { t: 6.1, d: 0.5, reveal: 'drop', dy: 10 });
}

// a mural figure in profile, its feet at (x, y): a sarong, a bare torso or blouse, a hat
function person(c, x, y, s, cloth, kind) {
  c.fillStyle = cloth; poly(c, [[x - 5 * s, y - 2 * s], [x + 5 * s, y - 2 * s], [x + 4 * s, y - 16 * s], [x - 4 * s, y - 16 * s]]); c.fill();
  c.fillStyle = SKIN; poly(c, [[x - 4 * s, y - 16 * s], [x + 4 * s, y - 16 * s], [x + 3 * s, y - 28 * s], [x - 3 * s, y - 28 * s]]); c.fill();
  c.fillRect(x - 3 * s, y - 2 * s, 2 * s, 3 * s); c.fillRect(x + 1 * s, y - 2 * s, 2 * s, 3 * s);
  c.beginPath(); c.arc(x, y - 32 * s, 4 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = INK; c.beginPath(); c.arc(x - 0.5 * s, y - 33.5 * s, 3.6 * s, Math.PI, 0); c.fill();
  if (kind === 'hat') { c.fillStyle = GOLD_L; poly(c, [[x - 10 * s, y - 32 * s], [x + 10 * s, y - 32 * s], [x, y - 40 * s]]); c.fill(); }
  if (kind === 'pole') {
    c.strokeStyle = GOLD_D; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(x - 20 * s, y - 27 * s); c.lineTo(x + 20 * s, y - 29 * s); c.stroke();
    c.lineWidth = 0.8 * s; c.beginPath(); c.moveTo(x - 18 * s, y - 27 * s); c.lineTo(x - 18 * s, y - 12 * s); c.moveTo(x + 18 * s, y - 29 * s); c.lineTo(x + 18 * s, y - 12 * s); c.stroke();
    c.fillStyle = GOLD; c.beginPath(); c.arc(x - 18 * s, y - 9 * s, 5 * s, 0, Math.PI); c.arc(x + 18 * s, y - 9 * s, 5 * s, 0, Math.PI); c.fill();
  }
}

// ================================================================ trees
function trees(p, r) {
  // mural trees: a dark trunk branching into round clusters of small scalloped leaves
  const spots = [[470, BANK, 150], [1130, BANK, 150], [150, BANK - 2, 110], [1450, BANK - 2, 110], [640, BANK, 90], [960, BANK, 90]];
  spots.forEach(([x, y, h], i) => {
    const clusters = [];
    const n = 5 + Math.round(h / 40);
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + r.range(-1.2, 1.2);
      const d = r.range(0.25, 0.55) * h;
      clusters.push([x + Math.cos(a) * d * 0.9, y - h * 0.62 + Math.sin(a) * d * 0.55, r.range(0.2, 0.3) * h]);
    }
    clusters.sort((a, b) => a[1] - b[1]);
    p.group('trees', { x: x - h, y: y - h * 1.3, w: 2 * h, h: h * 1.32 }, (c) => {
      c.strokeStyle = INK; c.lineCap = 'round';
      c.lineWidth = h * 0.07; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h * 0.5); c.stroke();
      c.lineWidth = h * 0.03; c.beginPath();
      for (const [cx, cy] of clusters) { c.moveTo(x, y - h * 0.45); c.quadraticCurveTo(x, cy + 10, cx, cy); }
      c.stroke();
      for (const [cx, cy, rr] of clusters) {
        c.fillStyle = GREEN_D; c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.fill();
        // the leaves as scallops in rows, lit from above
        c.save(); c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.clip();
        c.fillStyle = GREEN; c.beginPath();
        for (let yy = cy - rr; yy < cy + rr; yy += 7) for (let xx = cx - rr + ((yy - cy) / 7 % 2 ? 3.5 : 0); xx < cx + rr; xx += 7) { c.moveTo(xx + 3, yy); c.arc(xx, yy, 3, 0, Math.PI); }
        c.fill();
        c.fillStyle = GREEN_L; c.beginPath();
        for (let yy = cy - rr; yy < cy - rr * 0.2; yy += 7) for (let xx = cx - rr; xx < cx + rr; xx += 7) { c.moveTo(xx + 2, yy); c.arc(xx, yy, 2, 0, Math.PI); }
        c.fill();
        c.restore();
        c.strokeStyle = GOLD; c.lineWidth = 1.3; c.beginPath(); c.arc(cx, cy, rr, Math.PI * 0.95, Math.PI * 2.05); c.stroke();
      }
    }, { t: 7.6 + i * 0.18, d: 0.8, reveal: 'rise', ease: 'out' });
  });
}

// ================================================================ the prangs
// a prang's outline: half its width at a height z (0 at its foot, 1 at the tip)
// three terraces, then the body swelling a little like a corncob, then the spire
const TERR = [[0, 0.1, 0.25], [0.1, 0.185, 0.205], [0.185, 0.26, 0.163]];
const BODY0 = 0.26, BODY1 = 0.86;
function hw(z) {
  if (z < BODY0) { for (const [a, b, w] of TERR) if (z < b) return w; }
  if (z < BODY1) { const u = (z - BODY0) / (BODY1 - BODY0); return 0.03 + 0.098 * (1 - u ** 2.1) + 0.02 * Math.sin(Math.PI * u * 0.9); }
  const u = (z - BODY1) / (1 - BODY1); return 0.03 * (1 - u) + 0.003;
}

// one prang, built tier by tier from its foot; cx, foot, H its height in px
function prang(p, layer, cx, foot, H, t0, dt, seed) {
  const Y = (z) => foot - z * H, Wd = (z) => hw(z) * H;
  const bands = [];
  // terraces
  for (const [a, b] of TERR) bands.push(['terrace', a, b]);
  // body tiers
  const tiers = 11;
  for (let i = 0; i < tiers; i++) bands.push(['tier', lerp(BODY0, BODY1, i / tiers), lerp(BODY0, BODY1, (i + 1) / tiers), i]);
  bands.push(['spire', BODY1, 1]);
  // the colors of the porcelain flowers, chosen at build time
  const R = (k) => { const v = Math.sin(seed * 91.7 + k * 12.9898) * 43758.5453; return v - Math.floor(v); };
  bands.forEach(([kind, a, b, i], n) => {
    const ya = Y(a), yb = Y(b), wa = Wd(a + 0.0001), wb = Wd(Math.max(a + 0.0001, b - 0.0001));
    const box = { x: cx - wa - 14, y: yb - 16, w: 2 * wa + 28, h: ya - yb + 22 };
    p.group(layer, box, (c) => {
      if (kind === 'terrace') {
        const w = wa;
        c.fillStyle = CREAM; c.fillRect(cx - w, yb, 2 * w, ya - yb);
        c.fillStyle = CREAM_D; c.fillRect(cx + w * 0.4, yb, w * 0.6, ya - yb);
        // the wall's bands of porcelain flowers
        c.fillStyle = RED_L; c.fillRect(cx - w, yb + (ya - yb) * 0.32, 2 * w, (ya - yb) * 0.3);
        let k = 0;
        for (let x = cx - w + 8; x < cx + w - 6; x += 11, k++) {
          c.fillStyle = [PINK, BLUE, GOLD_L, GREEN_L][k % 4]; c.beginPath(); flower(c, x, yb + (ya - yb) * 0.47, 4.2); c.fill();
        }
        // the balustrade along its top: little posts and a gold rail
        c.fillStyle = CREAM; c.fillRect(cx - w - 4, yb - 10, 2 * w + 8, 10);
        c.fillStyle = RED_D; c.beginPath(); for (let x = cx - w; x < cx + w - 3; x += 7) c.rect(x, yb - 8, 3.5, 7); c.fill();
        c.fillStyle = GOLD; c.fillRect(cx - w - 6, yb - 12, 2 * w + 12, 3.5);
        // the steep stair up the front
        const sw = H * 0.026;
        c.fillStyle = CREAM_D; c.fillRect(cx - sw, yb - 10, 2 * sw, ya - yb + 10);
        c.strokeStyle = GOLD_D; c.lineWidth = 1; c.beginPath();
        for (let y = yb - 6; y < ya; y += 4.5) { c.moveTo(cx - sw, y); c.lineTo(cx + sw, y); }
        c.stroke();
        c.strokeStyle = GOLD; c.lineWidth = 1.5; c.strokeRect(cx - w, yb, 2 * w, ya - yb);
        c.strokeRect(cx - sw, yb - 10, 2 * sw, ya - yb + 10);
        // niches at either end
        c.fillStyle = RED_D;
        for (const s of [-1, 1]) { const x = cx + s * (w - H * 0.04); c.beginPath(); c.moveTo(x - 6, ya - 4); c.lineTo(x - 6, ya - (ya - yb) * 0.55); c.quadraticCurveTo(x, ya - (ya - yb) * 0.95, x + 6, ya - (ya - yb) * 0.55); c.lineTo(x + 6, ya - 4); c.fill(); }
      } else if (kind === 'tier') {
        // the swelling band, its shadow side, the flowers set in it
        const pts = [], N = 8;
        for (let j = 0; j <= N; j++) { const z = lerp(a, b, j / N); pts.push([cx - Wd(z), Y(z)]); }
        for (let j = N; j >= 0; j--) { const z = lerp(a, b, j / N); pts.push([cx + Wd(z), Y(z)]); }
        c.fillStyle = CREAM; poly(c, pts); c.fill();
        c.save(); poly(c, pts); c.clip();
        c.fillStyle = CREAM_D; c.fillRect(cx + wa * 0.35, yb - 2, wa, ya - yb + 4);
        c.fillStyle = '#e6d4ad'; c.fillRect(cx - wa * 0.12, yb - 2, wa * 0.24, ya - yb + 4);
        const rows = Math.max(1, Math.floor((ya - yb) / 12));
        for (let rr = 0; rr < rows; rr++) {
          const y = ya - 7 - rr * ((ya - yb - 6) / rows), w = Wd(a + (ya - y) / H);
          const step = Math.max(7, H * 0.011);
          let k = 0;
          for (let x = cx - w + step * 0.6; x < cx + w - step * 0.3; x += step, k++) {
            const col = [PINK, BLUE, GOLD, GREEN_L, PINK, ORANGE][Math.floor(R(n * 50 + rr * 13 + k) * 6)];
            c.fillStyle = col; c.beginPath(); flower(c, x, y, step * 0.38); c.fill();
          }
        }
        c.restore();
        c.strokeStyle = GOLD; c.lineWidth = 1.4; poly(c, pts); c.stroke();
        // the ledge on top, with a row of upturned gold leaves
        const lw = wb + H * 0.007;
        c.fillStyle = GOLD; c.fillRect(cx - lw, yb - 3, 2 * lw, 5);
        c.beginPath();
        const lstep = Math.max(6, H * 0.012);
        for (let x = cx - lw + 2; x < cx + lw - 2; x += lstep) { c.moveTo(x, yb - 3); c.quadraticCurveTo(x + lstep * 0.1, yb - 3 - lstep * 0.9, x + lstep * 0.5, yb - 3 - lstep * 1.1); c.quadraticCurveTo(x + lstep * 0.5, yb - 3 - lstep * 0.4, x + lstep * 0.85, yb - 3); }
        c.fill();
        // a niche on the second and fifth tiers
        if (i === 1 || i === 5) {
          const nh = (ya - yb) * 0.8, nw = Math.min(wa * 0.25, H * 0.03);
          c.fillStyle = RED_D; c.beginPath(); c.moveTo(cx - nw, ya - 3); c.lineTo(cx - nw, ya - nh * 0.6); c.quadraticCurveTo(cx, ya - nh * 1.15, cx + nw, ya - nh * 0.6); c.lineTo(cx + nw, ya - 3); c.fill();
          c.strokeStyle = GOLD_L; c.lineWidth = 1.4; c.stroke();
        }
      } else {
        // the spire: a gold needle ringed with bands, a small crown at its foot
        c.fillStyle = GOLD; poly(c, [[cx - wa, ya], [cx + wa, ya], [cx + 1.2, yb], [cx - 1.2, yb]]); c.fill();
        c.fillStyle = GOLD_L; poly(c, [[cx - wa, ya], [cx - wa * 0.2, ya], [cx, yb], [cx - 1, yb]]); c.fill();
        c.strokeStyle = GOLD_D; c.lineWidth = 1.2; c.beginPath();
        for (let k = 1; k < 7; k++) { const z = lerp(a, b, k / 8), w = Wd(z) + 2; c.moveTo(cx - w, Y(z)); c.lineTo(cx + w, Y(z)); }
        c.stroke();
        c.fillStyle = GOLD; c.beginPath(); c.arc(cx, ya - (ya - yb) * 0.3, Wd(a) * 0.55, 0, Math.PI * 2); c.fill();
        c.strokeStyle = GOLD_D; c.stroke();
      }
    }, { t: t0 + n * dt, d: Math.min(1.2, dt * 3.2), reveal: 'rise', ease: 'out' });
  });
}

function prangs(p) {
  // the two smaller prangs, then the great one
  prang(p, 'prangs', 304, BANK, 560, 4.0, 0.2, 3);
  prang(p, 'prangs', 1296, BANK, 560, 4.25, 0.2, 7);
  prang(p, 'prang', 800, BANK, 1080, 3.0, 0.27, 1);
}

// ================================================================ the bank
function bank(p, r) {
  // the white wall along the river, crenellated with leaf-shaped merlons
  p.group('bank', { x: X0, y: BANK - 24, w: X1 - X0, h: RIVER - BANK + 32 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(X0, BANK, X1 - X0, RIVER - BANK);
    c.fillStyle = CREAM_D; c.fillRect(X0, RIVER - 14, X1 - X0, 14);
    c.fillStyle = CREAM; c.beginPath();
    for (let x = X0 + 4; x < X1 - 16; x += 24) { c.moveTo(x, BANK); c.lineTo(x, BANK - 8); c.quadraticCurveTo(x + 8, BANK - 12, x + 8, BANK - 22); c.quadraticCurveTo(x + 8, BANK - 12, x + 16, BANK - 8); c.lineTo(x + 16, BANK); }
    c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.moveTo(X0, BANK); c.lineTo(X1, BANK); c.moveTo(X0, RIVER - 14); c.lineTo(X1, RIVER - 14); c.stroke();
    // gold panels along the wall and steps down to the water
    c.fillStyle = GOLD; c.beginPath();
    for (let x = X0 + 30; x < X1 - 30; x += 60) { flower(c, x, BANK + 22, 6); }
    c.fill();
    c.fillStyle = CREAM_D; c.fillRect(740, BANK, 120, RIVER - BANK);
    c.strokeStyle = GOLD_D; c.lineWidth = 1; c.beginPath();
    for (let y = BANK + 6; y < RIVER; y += 6) { c.moveTo(740, y); c.lineTo(860, y); }
    c.stroke();
  }, { t: 6.8, d: 1.1, reveal: 'wipe', ease: 'inOut' });
  // the pier pavilion on the right: a tiered roof on red posts
  const px = 1300, pw = 210;
  p.group('bank', { x: px - pw / 2 - 20, y: BANK - 200, w: pw + 40, h: 236 }, (c) => {
    c.fillStyle = RED_D; c.beginPath();
    for (let k = 0; k < 5; k++) c.rect(px - pw / 2 + 12 + k * ((pw - 30) / 4), BANK - 70, 8, 96);
    c.fill();
    c.fillStyle = GOLD; c.beginPath();
    for (let k = 0; k < 5; k++) c.rect(px - pw / 2 + 10 + k * ((pw - 30) / 4), BANK - 74, 12, 6);
    c.fill();
    c.fillStyle = CREAM; c.fillRect(px - pw / 2, BANK + 20, pw, 12);
    thaiRoof(c, px, BANK - 72, pw + 20, 120, 3);
    c.fillStyle = GOLD; c.beginPath(); c.moveTo(px - 5, BANK - 192); c.lineTo(px + 5, BANK - 192); c.lineTo(px, BANK - 206); c.fill();
  }, { t: 7.4, d: 0.9, reveal: 'rise', ease: 'inOut' });
  // people on the bank and the pier
  const folk = [];
  for (let i = 0; i < 9; i++) {
    let x = r.range(160, 1440);
    if (x > 700 && x < 900) x += 220;
    folk.push([x, r.pick([GREEN, BLUE, ORANGE, '#5a2d6e', RED_L]), r.pick(['hat', 'none', 'none', 'pole'])]);
  }
  p.group('bank', { x: X0, y: BANK - 60, w: X1 - X0, h: 90 }, (c) => {
    for (const [x, col, kind] of folk) person(c, x, BANK + 12, 1.05, col, kind);
  }, { t: 8.6, d: 0.6, reveal: 'drop', dy: 10 });
}

// ================================================================ the river
function river(p, r) {
  // curling waves: rows of looped lines, each a stretched loop-the-loop
  const rows = [];
  for (let y = RIVER + 16, j = 0; y < RFOOT - 8; y += 21, j++) rows.push([y, j]);
  rows.forEach(([y, j], n) => {
    // a gentle swell with a curl rolled into it every so often
    const A = 2.2 + (y - RIVER) / 120, ph = r() * 100, gap = r.range(110, 150), rr = 5 + (y - RIVER) / 70;
    const pts = [];
    let next = X0 + r.range(20, gap);
    for (let x = X0 - 20; x < X1 + 20; x += 3) {
      const yy = y + A * Math.sin((x + ph) / 16);
      pts.push([x, yy]);
      if (x >= next) {
        for (let a = 0; a <= Math.PI * 2.6; a += 0.3) {
          const k = rr * (1 - a / (Math.PI * 4));
          pts.push([x + Math.sin(a) * k, yy - k + Math.cos(a) * k]);
        }
        next += gap * r.range(0.8, 1.2);
      }
    }
    p.pen('river', pts, n % 2 ? GOLD_D : GOLD, 1.5, { t: 2.0 + n * 0.12, d: 1.3, box: { x: X0, y: y - 30, w: X1 - X0, h: 60 } });
  });
  // the edge of the bank's reflection: a band of lighter water
  p.group('river', { x: X0, y: RIVER - 4, w: X1 - X0, h: 20 }, (c) => {
    c.fillStyle = WATER_L; c.fillRect(X0, RIVER - 2, X1 - X0, 9);
  }, { t: 2.2, d: 0.8, reveal: 'wipe' });
}

// ================================================================ boats
// a longtail: long low hull with its prow raised and hung with colored cloth, a
// canopy, the boatman at the stern holding the long engine shaft. Foot at (x, y).
function longtail(c, x, y, s, dir, people, hull = '#5a3018') {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.fillStyle = hull;
  c.beginPath(); c.moveTo(-110, -8); c.lineTo(80, -8); c.quadraticCurveTo(110, -10, 124, -38); c.quadraticCurveTo(110, -2, 90, 4); c.lineTo(-100, 4); c.closePath(); c.fill();
  c.fillStyle = GOLD; c.fillRect(-108, -10, 196, 3);
  // ribbons on the prow
  c.fillStyle = PINK; poly(c, [[118, -30], [126, -36], [116, -14], [112, -16]]); c.fill();
  c.fillStyle = GOLD_L; poly(c, [[113, -24], [119, -28], [110, -12], [107, -14]]); c.fill();
  // the canopy
  c.fillStyle = BLUE; c.fillRect(-60, -44, 110, 7);
  c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath();
  for (const px of [-56, -4, 46]) { c.moveTo(px, -37); c.lineTo(px, -8); }
  c.stroke();
  // passengers
  for (let k = 0; k < people; k++) {
    const px = -42 + k * 26;
    c.fillStyle = [ORANGE, GREEN, PINK, CREAM][k % 4]; c.fillRect(px - 5, -22, 10, 14);
    c.fillStyle = SKIN; c.beginPath(); c.arc(px, -26, 4.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(px, -27.5, 4.2, Math.PI, 0); c.fill();
  }
  // the boatman and the engine on its long shaft
  c.fillStyle = INK; c.fillRect(-104, -26, 14, 14);
  c.fillStyle = GREEN; c.fillRect(-96, -24, 9, 16);
  c.fillStyle = SKIN; c.beginPath(); c.arc(-92, -30, 4.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = GOLD_L; poly(c, [[-101, -31], [-83, -31], [-92, -38]]); c.fill();
  c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-96, -18); c.lineTo(-160, 8); c.stroke();
  c.restore();
}

function riceBarge(c, x, y) {
  // a broad wooden hull and a curved thatched roof
  c.fillStyle = '#4a2814'; c.beginPath(); c.moveTo(x - 130, y - 18); c.lineTo(x + 130, y - 18); c.quadraticCurveTo(x + 120, y + 4, x + 96, y + 6); c.lineTo(x - 104, y + 6); c.quadraticCurveTo(x - 124, y + 2, x - 130, y - 18); c.fill();
  c.fillStyle = GOLD_D; c.fillRect(x - 128, y - 20, 256, 4);
  c.fillStyle = '#b07a3a'; c.beginPath(); c.moveTo(x - 80, y - 20); c.bezierCurveTo(x - 80, y - 70, x + 70, y - 70, x + 70, y - 20); c.closePath(); c.fill();
  c.strokeStyle = GOLD_D; c.lineWidth = 1; c.beginPath();
  for (let k = -70; k < 66; k += 9) { c.moveTo(x + k, y - 22); c.lineTo(x + k * 0.9 + 3, y - 54 + Math.abs(k) * 0.2); }
  c.stroke();
  c.strokeStyle = GOLD; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 80, y - 20); c.bezierCurveTo(x - 80, y - 70, x + 70, y - 70, x + 70, y - 20); c.stroke();
  // the bargeman poling it along
  c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 88, y - 56); c.lineTo(x + 124, y + 22); c.stroke();
  c.fillStyle = ORANGE; c.fillRect(x + 92, y - 40, 9, 18);
  c.fillStyle = SKIN; c.beginPath(); c.arc(x + 96, y - 45, 4.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = GOLD_L; poly(c, [[x + 86, y - 46], [x + 106, y - 46], [x + 96, y - 54]]); c.fill();
}

// a sampan with a fruit seller in a wide hat, her fruit heaped in baskets
function sampan(c, x, y, fruit) {
  c.fillStyle = '#5a3018'; c.beginPath(); c.moveTo(x - 60, y - 14); c.quadraticCurveTo(x, y - 6, x + 60, y - 14); c.quadraticCurveTo(x + 50, y + 4, x, y + 4); c.quadraticCurveTo(x - 50, y + 4, x - 60, y - 14); c.fill();
  c.fillStyle = GOLD; c.fillRect(x - 54, y - 12, 108, 2.5);
  for (let k = 0; k < fruit.length; k++) {
    const [fx, col] = fruit[k];
    c.fillStyle = col; c.beginPath();
    for (let j = 0; j < 5; j++) c.arc(x + fx + (j % 3) * 5 - 5, y - 16 - (j > 2 ? 5 : 0), 3.2, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = BLUE; c.fillRect(x - 40, y - 30, 11, 18);
  c.fillStyle = SKIN; c.beginPath(); c.arc(x - 34.5, y - 34, 4.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = GOLD_L; poly(c, [[x - 50, y - 35], [x - 19, y - 35], [x - 34.5, y - 47]]); c.fill();
  c.strokeStyle = GOLD_D; c.lineWidth = 1; c.stroke();
  c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x - 30, y - 26); c.lineTo(x - 4, y + 10); c.stroke();
}

function boats(p, r) {
  p.group('boats', { x: 160, y: 1470, w: 320, h: 110 }, (c) => riceBarge(c, 310, 1556), { t: 8.9, d: 0.9, reveal: 'slide', dx: -60 });
  const fruitSets = [];
  for (let i = 0; i < 3; i++) fruitSets.push([[0, r.pick([ORANGE, '#e4c23a', GREEN_L])], [18, r.pick([PINK, ORANGE, '#7a3d8c'])], [36, r.pick(['#e4c23a', GREEN_L, RED_L])]]);
  [[1060, 1396], [1210, 1420], [1370, 1398]].forEach(([x, y], i) => {
    p.group('boats', { x: x - 70, y: y - 56, w: 140, h: 66 }, (c) => sampan(c, x, y, fruitSets[i]), { t: 9.1 + i * 0.15, d: 0.6, reveal: 'drop', dy: 12 });
  });
  p.group('boats', { x: 440, y: 1350, w: 330, h: 70 }, (c) => longtail(c, 620, 1404, 1, 1, 3), { t: 9.4, d: 0.8, reveal: 'slide', dx: -80 });
}

// ================================================================ the border
function border(p) {
  // the band outside the picture: a gold rule, a black band of rosettes, a red band of flames
  p.group('border', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = INK; c.beginPath(); c.rect(30, 30, W - 60, H - 60); c.rect(96, 96, W - 192, H - 192); c.fill('evenodd');
    c.fillStyle = RED; c.beginPath(); c.rect(100, 100, W - 200, H - 200); c.rect(X0 - 4, Y0 - 4, X1 - X0 + 8, Y1 - Y0 + 8); c.fill('evenodd');
  }, { t: 0.1, d: 0.7, reveal: 'fade' });
  const rect = (i) => [[i, i], [W - i, i], [W - i, H - i], [i, H - i], [i, i]];
  p.pen('border', rect(30), GOLD, 4, { t: 0.2, d: 1.4, cap: 'square' });
  p.pen('border', rect(96), GOLD, 2.5, { t: 0.4, d: 1.4, cap: 'square' });
  p.pen('border', rect(X0 - 4), GOLD, 2, { t: 0.6, d: 1.4, cap: 'square' });
  // rosettes: a chain of four-petal flowers in diamonds, along all four sides
  const ros = [];
  const along = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 52); for (let i = 0; i <= n; i++) ros.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]); };
  along([63, 63], [W - 63, 63]); along([W - 63, 63], [W - 63, H - 63]); along([W - 63, H - 63], [63, H - 63]); along([63, H - 63], [63, 63]);
  for (let s = 0; s < 4; s++) {
    const part = ros.slice(Math.floor(s * ros.length / 4), Math.floor((s + 1) * ros.length / 4));
    const bx = s === 0 ? { x: 30, y: 30, w: W - 60, h: 66 } : s === 1 ? { x: W - 96, y: 30, w: 66, h: H - 60 } : s === 2 ? { x: 30, y: H - 96, w: W - 60, h: 66 } : { x: 30, y: 30, w: 66, h: H - 60 };
    p.group('border', bx, (c) => {
      c.strokeStyle = GOLD; c.lineWidth = 1.4; c.beginPath();
      for (const [x, y] of part) { c.moveTo(x, y - 22); c.lineTo(x + 22, y); c.lineTo(x, y + 22); c.lineTo(x - 22, y); c.closePath(); }
      c.stroke();
      c.fillStyle = GOLD; c.beginPath(); for (const [x, y] of part) flower(c, x, y, 14); c.fill();
      c.fillStyle = RED; c.beginPath(); for (const [x, y] of part) flower(c, x, y, 7); c.fill();
      c.fillStyle = GOLD_L; c.beginPath(); for (const [x, y] of part) { c.moveTo(x + 3, y); c.arc(x, y, 3, 0, Math.PI * 2); } c.fill();
      // little dots between
      c.fillStyle = GOLD; c.beginPath();
      for (let i = 0; i < part.length - 1; i++) { const x = (part[i][0] + part[i + 1][0]) / 2, y = (part[i][1] + part[i + 1][1]) / 2; c.moveTo(x + 3, y); c.arc(x, y, 3, 0, Math.PI * 2); }
      c.fill();
    }, { t: 0.7 + s * 0.3, d: 0.9, reveal: s === 0 ? 'wipe' : s === 1 ? 'fall' : s === 2 ? 'wipeL' : 'rise', ease: 'inOut' });
  }
  // flames (kranok) along the red band, pointing in toward the picture
  const fl = [];
  const flames = (a, b, nx, ny) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 20);
    for (let i = 0; i < n; i++) fl.push([lerp(a[0], b[0], (i + 0.5) / n), lerp(a[1], b[1], (i + 0.5) / n), (b[0] - a[0]) / L, (b[1] - a[1]) / L, nx, ny]);
  };
  flames([100, 100], [W - 100, 100], 0, 1); flames([W - 100, 100], [W - 100, H - 100], -1, 0); flames([W - 100, H - 100], [100, H - 100], 0, -1); flames([100, H - 100], [100, 100], 1, 0);
  const kr = (c, f) => {
    const [x, y, ux, uy, nx, ny] = f, P = (a, b) => [x + ux * a + nx * b, y + uy * a + ny * b];
    const p0 = P(-9, 0), p1 = P(9, 0), tip = P(6, 20), m1 = P(10, 10), m2 = P(-6, 12);
    c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(m2[0], m2[1], tip[0], tip[1]); c.quadraticCurveTo(m1[0], m1[1], p1[0], p1[1]); c.closePath();
  };
  p.group('border', { x: 96, y: 96, w: W - 192, h: H - 192 }, (c) => {
    c.save(); c.beginPath(); c.rect(100, 100, W - 200, H - 200); c.clip();
    c.fillStyle = GOLD; c.beginPath(); for (const f of fl) kr(c, f); c.fill();
    c.restore();
  }, { t: 1.6, d: 1.0, reveal: 'iris', ease: 'inOut' });
  // a band of flames between the river and the title panel
  const fl2 = [];
  for (let x = X0 + 10; x < X1 - 6; x += 20) fl2.push([x, RFOOT, 1, 0, 0, 1]);
  p.group('border', { x: X0, y: RFOOT - 6, w: X1 - X0, h: 34 }, (c) => {
    c.fillStyle = INK; c.fillRect(X0, RFOOT, X1 - X0, 26);
    c.fillStyle = GOLD; c.beginPath(); for (const f of fl2) kr(c, f); c.fill();
    c.fillRect(X0, RFOOT, X1 - X0, 3); c.fillRect(X0, RFOOT + 25, X1 - X0, 2);
  }, { t: 2.6, d: 1.0, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ what moves
function life(p) {
  // two longtails: one running upriver fast, one coming down slower
  p.live('live', {
    t: 10.0, d: 0.8, reveal: 'fade', box: { x: X0, y: 1440, w: X1 - X0, h: 120 },
    draw: (c, time) => {
      const span = X1 - X0 + 500, x = X0 - 250 + ((time - 10) * 70 + 700) % span, y = 1520 + Math.sin(time * 2.1) * 1.5;
      c.save(); c.beginPath(); c.rect(X0, 1400, X1 - X0, 200); c.clip();
      longtail(c, x, y, 1.15, 1, 4, '#3e2210');
      // the spray thrown up behind
      c.strokeStyle = CREAM; c.lineWidth = 1.4; c.beginPath();
      for (let k = 0; k < 4; k++) { const ph = (time * 3 + k / 4) % 1; c.moveTo(x - 190 - ph * 40, y + 6 - k); c.lineTo(x - 210 - ph * 60, y + 2 - k * 3); }
      c.stroke();
      c.restore();
    },
  });
  p.live('live', {
    t: 10.3, d: 0.8, reveal: 'fade', box: { x: X0, y: 1380, w: X1 - X0, h: 80 },
    draw: (c, time) => {
      const span = X1 - X0 + 400, x = X1 + 200 - ((time - 10.3) * 32 + 300) % span, y = 1450 + Math.sin(time * 1.7 + 1) * 1.2;
      c.save(); c.beginPath(); c.rect(X0, 1360, X1 - X0, 120); c.clip();
      longtail(c, x, y, 0.8, -1, 2, '#6a3a1c');
      c.restore();
    },
  });
  // a little flock of birds crossing the sky, drawn as mural birds: two gold strokes
  p.live('live', {
    t: 10.6, d: 0.8, reveal: 'fade', box: { x: X0, y: Y0, w: X1 - X0, h: 700 },
    draw: (c, time) => {
      const T = time - 10.6;
      c.strokeStyle = GOLD_L; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath();
      for (let k = 0; k < 5; k++) {
        const x = 1090 - T * 14 - k * 34 + (k % 2) * 10, y = 690 - k * 14 - T * 2 + Math.sin(T * 0.8 + k) * 6;
        const f = Math.sin(time * 5 + k * 1.3) * 5;
        c.moveTo(x - 10, y - 2 - f); c.quadraticCurveTo(x - 4, y - 4 - f * 0.5, x, y); c.quadraticCurveTo(x + 4, y - 4 - f * 0.5, x + 10, y - 2 - f);
      }
      c.stroke();
    },
  });
  // a flag on the pier pavilion's needle, flickering
  p.live('live', {
    t: 10.8, d: 0.6, reveal: 'fade', box: { x: 1290, y: BANK - 250, w: 60, h: 50 },
    draw: (c, time) => {
      const x = 1300, y = BANK - 236;
      c.strokeStyle = GOLD_D; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, BANK - 204); c.lineTo(x, y - 4); c.stroke();
      c.fillStyle = PINK; c.beginPath(); c.moveTo(x, y - 4);
      for (let k = 0; k <= 6; k++) c.lineTo(x + k * 5, y - 4 + Math.sin(time * 4 - k * 0.8) * 2 + k * 0.4);
      for (let k = 6; k >= 0; k--) c.lineTo(x + k * 5, y + 10 + Math.sin(time * 4 - k * 0.8) * 2 - k * 0.6);
      c.fill();
    },
  });
}

// ================================================================ the name
// set Thai a grapheme at a time, so a vowel or tone mark stays with its consonant
function thaiType(p, layer, str, cx, y, o) {
  const m = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  const font = `400 ${o.size}px ${F}`;
  m.font = font;
  const segs = typeof Intl !== 'undefined' && Intl.Segmenter
    ? [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(str)].map((s) => s.segment)
    : [...str];
  const total = m.measureText(str).width, x0 = cx - total / 2;
  let pre = '';
  segs.forEach((g, i) => {
    const gx = x0 + m.measureText(pre).width, gw = m.measureText(g).width;
    pre += g;
    p.mark(layer, {
      t: o.t + i * o.gap, d: o.d, reveal: 'press', ease: 'out',
      box: { x: gx - o.size * 0.2, y: y - o.size * 1.25, w: gw + o.size * 0.4, h: o.size * 1.7 },
      draw: (c) => {
        c.font = font; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillStyle = GOLD_D; c.fillText(g, gx + 4, y + 4);
        c.fillStyle = GOLD; c.fillText(g, gx, y);
      },
    });
  });
}

function title(p) {
  thaiType(p, 'title', THAI, W / 2, 1782, { size: 160, t: 11.0, gap: 0.2, d: 0.9 });
  p.type('title', 'BANGKOK', W / 2, 1850, { family: F, size: 30, color: CREAM, align: 'center', track: 0.6, t: 12.4, gap: 0.08, d: 0.5 });
  // the temple's and the river's names, small, either side
  p.group('title', { x: X0 + 20, y: 1815, w: X1 - X0 - 40, h: 45 }, (c) => {
    c.font = `400 17px ${F}`; c.fillStyle = GOLD; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const [a, b] = SUB.split(' · ');
    c.fillText(a, 250, 1846); c.fillText(b, 1350, 1846);
  }, { t: 12.9, d: 0.8, reveal: 'fade' });
  // gold flowers either side of the name
  p.group('title', { x: X0, y: 1690, w: X1 - X0, h: 150 }, (c) => {
    c.fillStyle = GOLD; c.beginPath();
    for (const x of [250, 1350]) { flower(c, x, 1750, 34); }
    c.fill();
    c.fillStyle = RED_D; c.beginPath(); for (const x of [250, 1350]) flower(c, x, 1750, 17); c.fill();
    c.fillStyle = GOLD_L; c.beginPath(); for (const x of [250, 1350]) { c.moveTo(x + 6, 1750); c.arc(x, 1750, 6, 0, Math.PI * 2); } c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 1.6; c.beginPath();
    for (const x of [250, 1350]) { c.moveTo(x, 1702); c.lineTo(x + 48, 1750); c.lineTo(x, 1798); c.lineTo(x - 48, 1750); c.closePath(); }
    c.stroke();
  }, { t: 10.6, d: 0.7, reveal: 'pop', ease: 'back' });
}
