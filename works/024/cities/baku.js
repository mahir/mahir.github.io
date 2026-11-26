// Baku: the whole poster is a woven rug, in the manner of the Kuba and Shirvan
// rugs of Azerbaijan. Warps are strung, then the knots are tied row by row from
// the bottom up, so the rug grows as you watch: a barber-pole guard, a main
// border of stars and diamonds, a madder field strewn with boteh, birds and
// stars, and a stepped medallion woven as a picture: the Flame Towers on
// their hill, the Maiden Tower, the domes of the Shirvanshahs' palace, the
// walls of the old city and the Caspian. Last, the name is knotted in: BAKI.

import { Plate, W, H } from '../print.js';
import { shade, lerp, clamp } from '../kit.js';

// the dyes: madder, indigo, undyed wool, weld, and their mixes
const PAL = [
  '#a3271f', // 0 madder red
  '#6c1a16', // 1 dark red
  '#1f2a52', // 2 indigo
  '#efe3c5', // 3 ivory
  '#d9a03a', // 4 gold
  '#3d6b4f', // 5 green
  '#6b90b8', // 6 sky blue
  '#d77a5e', // 7 rose
  '#2e1d1a', // 8 brown-black
  '#e0692b', // 9 orange
  '#b88a55', // 10 camel
  '#2f6f76', // 11 teal
  '#8a6440', // 12 dark camel
  '#dcc092', // 13 sand
];
const [RED, RED_D, NAVY, IVORY, GOLD, GREEN, SKY, ROSE, BROWN, ORANGE, CAMEL, TEAL, CAMEL_D, SAND] = PAL.map((_, i) => i);

export const city = {
  id: 'baku', name: 'Baku',
  alt: "The whole poster is a woven Caucasian rug: a stepped medallion on a madder field holds the Flame Towers on their hill, the Maiden Tower, the domes of the Shirvanshahs' palace and the old city walls above the waves of the Caspian, with boteh, birds and stars around it, a border of eight-pointed stars and diamonds, fringes at both ends, and the name BAKI knotted into a panel above with BAKU below",
  google: 'family=Alegreya+SC:wght@800',
  wall: '#3a1716',
  fonts: [['800 120px "Alegreya SC"', 'BAKI BAKU']],
  build,
};

// the rug: 176 knots across, 216 rows, each knot 8 units square
const NX = 176, NY = 216, KN = 8;
const RX = (W - NX * KN) / 2, RY = 136;
const PAPER = '#ddd2ba';

// the field, the medallion and the two panels, in knots
const F0 = 27, F1 = NX - 27, FY0 = 27, FY1 = NY - 27; // the field, ends excluded
const MC = [88, 110]; // the medallion's center
const TOP = { x0: 34, x1: 142, y0: 30, y1: 56 }; // the panel for BAKI
const BOT = { x0: 52, x1: 124, y0: 167, y1: 186 }; // the panel for BAKU

function build() {
  const p = new Plate({ paper: PAPER, seed: 1806 });
  const r = p.r;
  p.stack('paper', 'warp', 'rug', 'letters', 'live');
  const rug = design(r);
  const tex = knotTexture();

  under(p, r);
  weave(p, r, rug, tex);
  fringes(p, r);
  flames(p, rug, tex);
  letters(p, rug, tex);
  return p;
}

// ================================================================ the design, knot by knot
function design(r) {
  const g = new Uint8Array(NX * NY).fill(RED);
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < NX && y < NY) g[y * NX + x] = c; };
  const get = (x, y) => g[y * NX + x];
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, c); };
  const star = (cx, cy, rr, c) => { // an eight-pointed star: a square and a diamond
    for (let y = -rr * 2; y <= rr * 2; y++) for (let x = -rr * 2; x <= rr * 2; x++) {
      if ((Math.abs(x) <= rr && Math.abs(y) <= rr) || Math.abs(x) + Math.abs(y) <= Math.round(rr * 1.5)) set(cx + x, cy + y, c);
    }
  };
  const diamond = (cx, cy, rr, c) => { for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) if (Math.abs(x) + Math.abs(y) <= rr) set(cx + x, cy + y, c); };
  const stamp = (cx, cy, rows, map) => {
    const h = rows.length, w = rows[0].length;
    rows.forEach((row, j) => { for (let i = 0; i < w; i++) { const ch = row[i]; if (map[ch] !== undefined) set(cx - (w >> 1) + i, cy - (h >> 1) + j, map[ch]); } });
  };

  // ---- the ends: a few rows of flat weave in stripes
  for (let y = 0; y < 3; y++) { rect(0, y, NX, y + 1, [BROWN, RED_D, IVORY][y]); rect(0, NY - 1 - y, NX, NY - y, [BROWN, RED_D, IVORY][y]); }

  // ---- the outer guard: a barber pole of diagonal stripes, 4 knots, all round
  const ring = (d0, d1, fn) => {
    for (let y = 3; y < NY - 3; y++) for (let x = 0; x < NX; x++) {
      const d = Math.min(x, NX - 1 - x, y - 3, NY - 4 - y);
      if (d >= d0 && d < d1) set(x, y, fn(x, y, d));
    }
  };
  ring(0, 1, () => BROWN);
  ring(1, 5, (x, y) => [RED, IVORY, NAVY, IVORY][Math.floor((x + y) / 2) % 4]);
  ring(5, 6, () => BROWN);
  // ---- the main border: ivory ground with stars and hooked diamonds
  ring(6, 21, () => IVORY);
  ring(21, 22, () => BROWN);
  // ---- the inner guard: a reciprocal zigzag, indigo and gold
  ring(22, 26, (x, y, d) => {
    const along = (x < 26 || x > NX - 27) ? y : x, k = along % 8, h = k < 4 ? k : 7 - k;
    return d - 22 <= h ? NAVY : GOLD;
  });
  ring(26, 27, () => BROWN);
  // the border's motifs, spaced evenly along each side
  const bx = (6 + 21) / 2 | 0; // the middle of the border
  const motif = (cx, cy, k) => {
    if (k % 2 === 0) {
      star(cx, cy, 4, NAVY); star(cx, cy, 2, GOLD); diamond(cx, cy, 1, RED);
    } else {
      diamond(cx, cy, 6, RED); diamond(cx, cy, 4, IVORY); diamond(cx, cy, 2, GREEN); set(cx, cy, IVORY);
      for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { set(cx + dx * 4, cy + dy * 4, RED); set(cx + dx * 5, cy + dy * 4, RED); set(cx + dx * 4, cy + dy * 5, RED); }
    }
  };
  // corners first: a rosette in each
  for (const [cx, cy] of [[bx, bx + 3], [NX - 1 - bx, bx + 3], [bx, NY - 4 - bx], [NX - 1 - bx, NY - 4 - bx]]) {
    star(cx, cy, 5, RED); star(cx, cy, 3, NAVY); diamond(cx, cy, 2, GOLD); set(cx, cy, RED);
  }
  const along = (a0, a1, n) => Array.from({ length: n }, (_, i) => Math.round(lerp(a0, a1, (i + 0.5) / n)));
  along(bx + 12, NX - 1 - bx - 12, 8).forEach((x, i) => { motif(x, bx + 3, i); motif(x, NY - 4 - bx, i + 1); });
  along(bx + 15, NY - 4 - bx - 12, 10).forEach((y, i) => { motif(bx, y, i + 1); motif(NX - 1 - bx, y, i); });
  // a small running vine between the motifs: gold dots on the ivory
  ring(8, 9, (x, y) => (get(x, y) === IVORY && (x + y) % 4 === 0 ? ROSE : get(x, y)));
  ring(18, 19, (x, y) => (get(x, y) === IVORY && (x + y) % 4 === 2 ? ROSE : get(x, y)));

  // ---- the field: corner spandrels in indigo with stepped edges
  const spandrel = (sx, sy) => {
    for (let j = 0; j < 22; j++) for (let i = 0; i < 22; i++) {
      if (i + j < 19 - (Math.floor(i / 2) % 2)) set(sx > 0 ? F1 - 1 - i : F0 + i, sy > 0 ? FY1 - 1 - j : FY0 + j, NAVY);
      else if (i + j < 21) set(sx > 0 ? F1 - 1 - i : F0 + i, sy > 0 ? FY1 - 1 - j : FY0 + j, IVORY);
    }
    const cx = sx > 0 ? F1 - 6 : F0 + 5, cy = sy > 0 ? FY1 - 6 : FY0 + 5;
    star(cx, cy, 2, GOLD); diamond(cx, cy, 1, RED); set(cx, cy, IVORY);
  };
  spandrel(-1, 1); spandrel(1, 1); // only below: the panel for the name fills the top

  // ---- the medallion: a stepped lozenge with truncated tips, ram's horns and pendants
  const A = 58, B = 66;
  const lz = (x, y, k = 0) => { const dx = Math.abs(x - MC[0]), dy = Math.abs(y - MC[1]); return dx / (A + k) + dy / (B + k) <= 1 && dx <= 40 + k && dy <= 48 + k; };
  for (let y = FY0; y < FY1; y++) for (let x = F0; x < F1; x++) {
    if (lz(x, y, 5)) {
      if (!lz(x, y, 4)) set(x, y, BROWN);
      else if (!lz(x, y, 2)) set(x, y, (x + y) % 3 ? IVORY : RED);
      else if (!lz(x, y, 1)) set(x, y, GOLD);
      else if (!lz(x, y, 0)) set(x, y, BROWN);
      else set(x, y, NAVY);
    } else if (lz(x, y, 7)) set(x, y, lz(x, y, 6) ? NAVY : BROWN); // a band of indigo round the rim
  }
  // ram's-horn hooks on the four slanting sides
  const HORN = ['X...X', 'XX.XX', '.XXX.', '..X..', '..X..'];
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    for (const t of [0.35, 0.65]) {
      // a point along the slanting side, a little outside it
      const dy = lerp(48, 66 * (1 - 40 / 58), t), dx = 58 * (1 - dy / 66) + 9;
      const x = Math.round(MC[0] + sx * Math.min(dx, 49)), y = Math.round(MC[1] + sy * dy);
      stamp(x, y, sy < 0 ? HORN : HORN.slice().reverse(), { X: GOLD });
    }
  }
  // pendants above and below
  for (const sgn of [-1, 1]) {
    const py = MC[1] + sgn * 56;
    for (let j = 0; j < 6; j++) for (let i = -6 + j; i <= 6 - j; i++) set(MC[0] + i, py + sgn * j, j === 5 - 0 ? BROWN : NAVY);
    diamond(MC[0], py + sgn * 2, 2, GOLD);
  }

  // ---- the panels for the name: indigo with stepped ends and an ivory frame
  const panel = (b) => {
    for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) {
      const step = Math.min(y - b.y0, b.y1 - 1 - y);
      const inset = Math.max(0, 4 - step);
      if (x < b.x0 + inset || x >= b.x1 - inset) continue;
      const edge = step === 0 || x === b.x0 + inset || x === b.x1 - 1 - inset;
      const edge2 = step === 1 || x === b.x0 + inset + 1 || x === b.x1 - 2 - inset;
      set(x, y, edge ? BROWN : edge2 ? IVORY : step === 2 || x === b.x0 + inset + 2 || x === b.x1 - 3 - inset ? GOLD : NAVY);
    }
  };
  panel(TOP); panel(BOT);
  // small stars at the ends of the panels
  for (const b of [TOP, BOT]) {
    const cy = (b.y0 + b.y1) >> 1;
    star(b.x0 + 10, cy, 2, GOLD); set(b.x0 + 10, cy, RED); star(b.x1 - 11, cy, 2, GOLD); set(b.x1 - 11, cy, RED);
  }

  // ---- the field's small motifs, scattered in rows, clear of the medallion and panels
  const BOTEH = ['..XX..', '.XOOX.', 'XOOOX.', 'XOOOOX', 'XOOOOX', '.XOOX.', '..XXX.', '....XX'];
  const BIRD = ['.XX....', 'XXX....', '.XXXXXX', '..XXXX.', '..X..X.'];
  const HOOK = ['X...X', '.XXX.', 'XX.XX', '.XXX.', 'X...X'];
  const TREE = ['..X..', '.XXX.', 'XXXXX', '.XXX.', 'XXXXX', '..X..', '..X..'];
  const cols = [IVORY, NAVY, GOLD, GREEN, SKY, ROSE, IVORY, ORANGE];
  const clear = (x, y, m) => !lz(x, y, 10) && !(x > TOP.x0 - m && x < TOP.x1 + m && y > TOP.y0 - m && y < TOP.y1 + m) && !(x > BOT.x0 - m && x < BOT.x1 + m && y > BOT.y0 - m && y < BOT.y1 + m);
  let k = 0;
  for (let y = FY0 + 6; y < FY1 - 4; y += 10) {
    for (let x = F0 + 6 + (((y - FY0 - 6) / 10) % 2) * 5; x < F1 - 4; x += 10) {
      // keep out of the spandrels
      const ex = Math.min(x - F0, F1 - x), ey = Math.min(y - FY0, FY1 - y);
      if (ex + ey < 26) continue;
      if (!clear(x, y, 5)) continue;
      const c = cols[k % cols.length], c2 = cols[(k + 3) % cols.length];
      const kind = (k * 7 + (y >> 2)) % 5;
      if (kind === 0) stamp(x, y, BOTEH, { X: c, O: c2 === c ? RED_D : c2 });
      else if (kind === 1) stamp(x, y, BIRD, { X: c === NAVY ? IVORY : c });
      else if (kind === 2) { star(x, y, 2, c); set(x, y, RED_D); }
      else if (kind === 3) stamp(x, y, HOOK, { X: c });
      else stamp(x, y, TREE, { X: c === IVORY ? GREEN : c });
      k++;
    }
  }
  // tiny filler crosses between them
  for (let y = FY0 + 3; y < FY1 - 3; y += 11) for (let x = F0 + 1 + ((y / 11) % 2) * 6; x < F1 - 2; x += 12) {
    const ex = Math.min(x - F0, F1 - x), ey = Math.min(y - FY0, FY1 - y);
    if (ex + ey < 24 || !clear(x, y, 2) || get(x, y) !== RED) continue;
    set(x, y, IVORY); set(x - 1, y, GOLD); set(x + 1, y, GOLD); set(x, y - 1, GOLD); set(x, y + 1, GOLD);
  }

  // ---- the picture in the medallion
  const flame = scene(g, lz, r);

  // ---- abrash: each new batch of madder dyes a few rows a little lighter or darker
  const tone = new Float32Array(NY);
  for (let y = 0; y < NY;) { const n = r.int(4, 14), v = r.range(-0.07, 0.06); for (let j = 0; j < n && y < NY; j++, y++) tone[y] = v; }
  const jit = new Float32Array(NX * NY);
  for (let i = 0; i < jit.length; i++) jit[i] = r.range(-0.035, 0.035);
  return { g, tone, jit, flame };
}

// the picture: drawn as shapes on a fine canvas, then read back one knot at a time
function scene(g, lz, r) {
  const S = 4, cv = document.createElement('canvas');
  cv.width = NX * S; cv.height = NY * S;
  const c = cv.getContext('2d');
  c.scale(S, S);
  const [mx, my] = MC;
  const col = (i) => PAL[i];
  // the sky's stars
  // the sea: rows of zigzag waves
  c.fillStyle = col(TEAL); c.fillRect(mx - 60, my + 26, 120, 40);
  c.fillStyle = col(SKY);
  for (let y = my + 28; y < my + 60; y += 5) {
    c.beginPath();
    for (let x = mx - 60; x <= mx + 60; x += 4) { c.lineTo(x, y); c.lineTo(x + 2, y + 2); }
    c.lineTo(mx + 60, y + 2.6); c.lineTo(mx - 60, y + 2.6); c.fill();
  }
  // the hill under the towers (Highland Park), green in steps
  c.fillStyle = col(GREEN);
  c.beginPath(); c.moveTo(mx - 10, my + 26); c.quadraticCurveTo(mx + 6, my - 2, mx + 30, my + 2); c.quadraticCurveTo(mx + 44, my + 6, mx + 52, my + 14); c.lineTo(mx + 52, my + 26); c.fill();
  // the TV tower on the hill's far shoulder
  c.fillStyle = col(IVORY); c.fillRect(mx + 39, my - 30, 2, 36); c.fillRect(mx + 37, my - 22, 6, 3); c.fillRect(mx + 39.5, my - 38, 1, 8);
  // the Flame Towers: three tongues of flame, the middle one tallest
  const tower = (x, base, h, w, lean) => {
    c.beginPath();
    c.moveTo(x - w / 2, base);
    c.bezierCurveTo(x - w * 0.62, base - h * 0.45, x - w * 0.3 + lean * 0.3, base - h * 0.85, x + lean, base - h);
    c.bezierCurveTo(x + w * 0.45 + lean * 0.4, base - h * 0.7, x + w * 0.62, base - h * 0.4, x + w / 2, base);
    c.closePath();
  };
  const towers = [[mx + 6, my + 8, 34, 12, 3], [mx + 30, my + 6, 36, 12, -3], [mx + 18, my + 4, 52, 14, 1]];
  for (const [x, b, h, w, l] of towers) {
    tower(x, b, h, w, l); c.fillStyle = col(RED_D); c.fill();
    tower(x, b, h * 0.92, w * 0.78, l); c.fillStyle = col(ORANGE); c.fill();
    tower(x - w * 0.05, b, h * 0.7, w * 0.4, l * 0.6); c.fillStyle = col(GOLD); c.fill();
  }
  // the old city's walls along the shore, with the Double Gates
  c.fillStyle = col(CAMEL); c.fillRect(mx - 52, my + 12, 50, 14);
  c.fillStyle = col(CAMEL_D); for (let x = mx - 50; x < mx - 2; x += 6) c.fillRect(x, my + 16, 1, 10);
  c.fillStyle = col(BROWN);
  for (let x = mx - 52; x < mx - 2; x += 3) c.fillRect(x, my + 10, 1.6, 2.4);
  c.fillStyle = col(CAMEL); for (let x = mx - 52; x < mx - 2; x += 3) c.fillRect(x, my + 10, 1.6, 2.2);
  c.fillStyle = col(BROWN); c.fillRect(mx - 52, my + 12, 50, 1);
  // a gate in the wall
  c.fillStyle = col(BROWN); c.beginPath(); c.moveTo(mx - 6, my + 26); c.lineTo(mx - 6, my + 19); c.arc(mx - 3.5, my + 19, 2.5, Math.PI, 0); c.lineTo(mx - 1, my + 26); c.fill();
  // the domes of the Shirvanshahs' palace, behind the walls
  for (const [dx, rr] of [[-44, 5], [-35, 4]]) {
    c.fillStyle = col(CAMEL_D); c.fillRect(mx + dx - rr, my + 4, rr * 2, 8);
    c.fillStyle = col(SAND); c.beginPath(); c.arc(mx + dx, my + 4, rr, Math.PI, 0); c.fill();
    c.fillStyle = col(BROWN); c.fillRect(mx + dx - 0.5, my - rr - 1, 1, 2);
  }
  // the Maiden Tower: a round tower with its buttress, ribbed in stone courses
  const tx = mx - 20, tt = my - 30, tb = my + 24;
  c.fillStyle = col(CAMEL_D); c.fillRect(tx + 5, tt + 8, 7, tb - tt - 8); // the buttress, in shade
  c.fillStyle = col(CAMEL); c.fillRect(tx + 5, tt + 8, 3, tb - tt - 8);
  c.fillStyle = col(CAMEL); c.fillRect(tx - 7, tt, 13, tb - tt);
  c.fillStyle = col(SAND); c.fillRect(tx - 5, tt, 5, tb - tt); // the lit curve
  c.fillStyle = col(CAMEL_D); c.fillRect(tx + 3, tt, 3, tb - tt);
  // the stone courses, in a darker camel
  c.fillStyle = col(CAMEL_D); for (let y = tt + 6; y < tb; y += 7) c.fillRect(tx - 7, y, 13, 1);
  c.fillStyle = col(BROWN); c.fillRect(tx - 8, tt, 1, tb - tt);
  for (let x = tx - 7; x < tx + 6; x += 3) c.fillRect(x, tt - 2, 2, 2.2);
  c.fillRect(tx - 3, tt + 12, 2, 3); c.fillRect(tx - 2, tt + 24, 2, 3); c.fillRect(tx - 3, tb - 6, 4, 6);
  // a boat on the Caspian
  c.fillStyle = col(IVORY); c.beginPath(); c.moveTo(mx + 12, my + 40); c.lineTo(mx + 12, my + 31); c.lineTo(mx + 20, my + 40); c.fill();
  c.fillStyle = col(BROWN); c.fillRect(mx + 6, my + 40, 18, 2);

  // read it back: each knot takes the nearest dye at its center
  const img = c.getImageData(0, 0, cv.width, cv.height).data;
  const rgb = PAL.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const flame = [];
  for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
    if (!lz(x, y, -1)) continue;
    const i = ((y * S + S / 2) * cv.width + x * S + S / 2) * 4;
    if (img[i + 3] < 128) continue;
    let best = 0, bd = Infinity;
    rgb.forEach(([R, G, B], k) => { const d = (R - img[i]) ** 2 + (G - img[i + 1]) ** 2 + (B - img[i + 2]) ** 2; if (d < bd) { bd = d; best = k; } });
    g[y * NX + x] = best;
    if ((best === ORANGE || best === GOLD) && x > MC[0] - 2 && y < MC[1] + 10) flame.push([x, y]);
  }
  // stars in the night sky: single gold and ivory knots, and an eight-pointed one
  const sky = [[-30, -44], [-8, -40], [8, -30], [-36, -14], [34, -40], [-4, -20], [26, -22], [-40, -30], [16, -46], [-16, -8]];
  sky.forEach(([dx, dy], i) => { const x = MC[0] + dx, y = MC[1] + dy; if (g[y * NX + x] === NAVY) g[y * NX + x] = i % 3 ? GOLD : IVORY; });
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g[(MC[1] - 36 + dy) * NX + MC[0] - 4 + dx] = GOLD;
  return flame;
}

// ================================================================ the knot's look
// one knot as a tile, 8 units square at 4 px a unit: two lobes with a seam
// between them, darker at the row's foot, a glint on top. Multiplied over the dyes.
function knotTexture() {
  const S = 4, T = KN * S;
  const mk = () => { const cv = document.createElement('canvas'); cv.width = T; cv.height = T; return cv; };
  const dark = mk(), light = mk();
  const d = dark.getContext('2d'), l = light.getContext('2d');
  d.fillStyle = '#fff'; d.fillRect(0, 0, T, T);
  // the two lobes of the knot, each a slanted oval
  for (const [cx, rot] of [[T * 0.27, 0.35], [T * 0.73, -0.35]]) {
    const gr = d.createRadialGradient(cx, T * 0.42, 1, cx, T * 0.5, T * 0.42);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(236,228,220,1)'); gr.addColorStop(1, 'rgba(160,140,130,1)');
    d.fillStyle = gr; d.beginPath(); d.ellipse(cx, T * 0.48, T * 0.27, T * 0.46, rot, 0, Math.PI * 2); d.fill();
  }
  d.fillStyle = 'rgba(120,100,90,.55)'; d.fillRect(0, T - 3, T, 3); d.fillRect(T / 2 - 1, 0, 2, T);
  l.fillStyle = '#000'; l.fillRect(0, 0, T, T);
  l.fillStyle = 'rgba(255,250,240,.16)';
  for (const [cx, rot] of [[T * 0.24, 0.35], [T * 0.7, -0.35]]) { l.beginPath(); l.ellipse(cx, T * 0.3, T * 0.1, T * 0.2, rot, 0, Math.PI * 2); l.fill(); }
  return { dark, light, S };
}
// lay the knot look over a region (already in sheet units)
function pile(c, tex, x, y, w, h) {
  if (!tex.pd) {
    const m = new DOMMatrix([1 / tex.S, 0, 0, 1 / tex.S, RX, RY]);
    tex.pd = c.createPattern(tex.dark, 'repeat'); tex.pl = c.createPattern(tex.light, 'repeat');
    tex.pd.setTransform(m); tex.pl.setTransform(m);
  }
  const { pd, pl } = tex;
  c.globalCompositeOperation = 'multiply'; c.fillStyle = pd; c.fillRect(x, y, w, h);
  c.globalCompositeOperation = 'screen'; c.fillStyle = pl; c.fillRect(x, y, w, h);
  c.globalCompositeOperation = 'source-over';
}

// the dyed knots as a small image, one pixel a knot
function knotImage(rug) {
  const cv = document.createElement('canvas'); cv.width = NX; cv.height = NY;
  const c = cv.getContext('2d'), img = c.createImageData(NX, NY);
  const rgb = PAL.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
    const i = y * NX + x, k = rug.g[i], base = rgb[k];
    const f = 1 + rug.jit[i] + (k === RED || k === RED_D ? rug.tone[y] : rug.tone[y] * 0.3);
    img.data[i * 4] = clamp(base[0] * f, 0, 255); img.data[i * 4 + 1] = clamp(base[1] * f, 0, 255); img.data[i * 4 + 2] = clamp(base[2] * f, 0, 255); img.data[i * 4 + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return cv;
}

// ================================================================ the paper, warps and shadow
function under(p, r) {
  // the rug's shadow on the sheet
  p.group('paper', { x: RX - 30, y: RY - 30, w: NX * KN + 70, h: NY * KN + 70 }, (c) => {
    c.fillStyle = 'rgba(70,40,30,.18)'; c.fillRect(RX + 8, RY + 10, NX * KN, NY * KN);
    c.fillStyle = 'rgba(70,40,30,.12)'; c.fillRect(RX + 3, RY + 4, NX * KN + 10, NY * KN + 10);
  }, { t: 0.1, d: 0.8, reveal: 'fade' });
  // the warps strung top to bottom: undyed wool, two per knot
  const warps = [];
  for (let i = 0; i <= NX; i++) { const x = RX + i * KN + 0.5; warps.push([[x, RY - 70], [x, RY + NY * KN + 70]]); }
  const half = warps.length >> 1;
  p.strokes('warp', warps.slice(0, half), '#c4b594', 1.8, { t: 0.2, d: 1.1, reveal: 'fall', ease: 'inOut', box: { x: RX - 4, y: RY - 74, w: NX * KN / 2 + 8, h: NY * KN + 150 } });
  p.strokes('warp', warps.slice(half), '#c4b594', 1.8, { t: 0.35, d: 1.1, reveal: 'fall', ease: 'inOut', box: { x: RX + NX * KN / 2 - 4, y: RY - 74, w: NX * KN / 2 + 8, h: NY * KN + 150 } });
}

// ================================================================ the weaving
function weave(p, r, rug, tex) {
  const small = knotImage(rug);
  const ROWS = 4, bands = NY / ROWS;
  const t0 = 1.2, t1 = 9.0;
  for (let b = 0; b < bands; b++) {
    const row0 = NY - (b + 1) * ROWS; // from the bottom up
    const y = RY + row0 * KN, h = ROWS * KN;
    const t = lerp(t0, t1, b / (bands - 1));
    p.group('rug', { x: RX - 4, y: y - 2, w: NX * KN + 8, h: h + 4 }, (c) => {
      c.imageSmoothingEnabled = false;
      c.drawImage(small, 0, row0, NX, ROWS, RX, y, NX * KN, h);
      pile(c, tex, RX, y, NX * KN, h);
      // the side cords, overcast in dark wool
      c.fillStyle = PAL[BROWN];
      for (const x of [RX - 3, RX + NX * KN - 3]) { c.fillRect(x, y, 6, h); }
      c.fillStyle = PAL[RED_D];
      for (const x of [RX - 3, RX + NX * KN - 3]) for (let yy = y; yy < y + h; yy += 8) c.fillRect(x, yy + 1, 6, 3);
    }, { t, d: 0.42, reveal: b % 2 ? 'wipeL' : 'wipe', ease: 'linear' });
  }
  // the beater: a bar of the loom pressing each new row down, gone once the rug is done
  p.live('live', {
    t: t0, d: 0.3, reveal: 'none', box: { x: 0, y: 0, w: W, h: H },
    draw: (c, time) => {
      if (time > t1 + 0.6) return;
      const b = clamp((time - t0) / (t1 - t0) * (bands - 1) + 0.6, 0, bands);
      const y = RY + NY * KN - b * ROWS * KN;
      c.fillStyle = 'rgba(58,34,24,.82)'; c.fillRect(RX - 26, y - 9, NX * KN + 52, 7);
      c.fillStyle = 'rgba(205,170,120,.9)'; c.fillRect(RX - 26, y - 9, NX * KN + 52, 2);
      // the reed's teeth
      c.fillStyle = 'rgba(58,34,24,.5)';
      for (let x = RX; x < RX + NX * KN; x += 16) c.fillRect(x, y - 22, 1.5, 13);
    },
  });
}

// ================================================================ the fringes
function fringes(p, r) {
  // bundles of four warps knotted at the rug's end, hanging out top and bottom
  const tufts = [];
  for (let i = 0; i < NX / 2; i++) {
    const x = RX + i * KN * 2 + KN;
    tufts.push([x, r.range(52, 74), r.range(-0.4, 0.4), r.range(0, 6.28)]);
  }
  const draw = (c, time, end) => {
    const sgn = end === 'top' ? -1 : 1, y0 = end === 'top' ? RY - 2 : RY + NY * KN + 2;
    c.strokeStyle = '#e9dcbc'; c.lineWidth = 2.6; c.lineCap = 'round';
    c.beginPath();
    for (const [x, len, lean, ph] of tufts) {
      const sway = time === null ? 0 : Math.sin(time * 1.3 + ph) * 3;
      for (const dx of [-3, 0, 3]) {
        const tip = [x + dx * 1.6 + lean * 10 + sway, y0 + sgn * (len + dx)];
        c.moveTo(x + dx, y0); c.quadraticCurveTo(x + dx * 0.4, y0 + sgn * 12, tip[0], tip[1]);
      }
    }
    c.stroke();
    // the knots that gather each bundle
    c.fillStyle = '#d9c9a3'; c.beginPath();
    for (const [x] of tufts) { c.moveTo(x + 4.5, y0 + sgn * 9); c.ellipse(x, y0 + sgn * 9, 4.5, 3.5, 0, 0, Math.PI * 2); }
    c.fill();
    c.strokeStyle = 'rgba(120,96,70,.5)'; c.lineWidth = 1;
    c.beginPath(); for (const [x] of tufts) { c.moveTo(x - 4, y0 + sgn * 9); c.lineTo(x + 4, y0 + sgn * 9); } c.stroke();
  };
  // the bottom fringe appears as the first row is knotted, the top as the last
  p.live('live', { t: 1.5, d: 0.8, reveal: 'fade', box: { x: 0, y: RY + NY * KN - 4, w: W, h: 100 }, draw: (c, time) => draw(c, time, 'bottom') });
  p.live('live', { t: 9.4, d: 0.8, reveal: 'fall', box: { x: 0, y: RY - 100, w: W, h: 100 }, draw: (c, time) => draw(c, time, 'top') });
}

// ================================================================ the Flame Towers' lights
function flames(p, rug, tex) {
  // the towers' knots ripple upward in fire colors, as their lights do at night
  const cells = rug.flame;
  if (!cells.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of cells) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const bx = RX + x0 * KN, by = RY + y0 * KN, bw = (x1 - x0 + 1) * KN, bh = (y1 - y0 + 1) * KN;
  const fire = [PAL[ORANGE], PAL[GOLD], '#f2c86a', PAL[GOLD], PAL[ORANGE], '#c8401f'].map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const nw = x1 - x0 + 1, nh = y1 - y0 + 1;
  // the knot look for just these cells: white elsewhere, so multiplying leaves the rest alone
  let small = null, img = null, mask = null;
  const prep = (c) => {
    small = document.createElement('canvas'); small.width = nw; small.height = nh;
    img = small.getContext('2d').createImageData(nw, nh);
    mask = document.createElement('canvas'); mask.width = bw * 2; mask.height = bh * 2;
    const m = mask.getContext('2d');
    m.setTransform(2, 0, 0, 2, -bx * 2, -by * 2);
    m.fillStyle = '#fff'; m.fillRect(bx, by, bw, bh);
    m.save(); m.beginPath(); for (const [x, y] of cells) m.rect(RX + x * KN, RY + y * KN, KN, KN); m.clip();
    pile(m, tex, bx, by, bw, bh);
    // pile() leaves the light pass screened over white; that is white, so only the dark pass shows
    m.restore();
  };
  p.live('live', {
    t: 9.6, d: 1.4, reveal: 'fade', box: { x: bx - 4, y: by - 4, w: bw + 8, h: bh + 8 },
    draw: (c, time) => {
      if (!small) prep(c);
      const k = time - 9.6, d = img.data;
      for (const [x, y] of cells) {
        const ph = Math.floor(y * 0.5 + k * 5 + Math.sin(x * 0.7) * 1.5), col = fire[((ph % fire.length) + fire.length) % fire.length];
        const i = ((y - y0) * nw + (x - x0)) * 4;
        d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
      }
      small.getContext('2d').putImageData(img, 0, 0);
      c.imageSmoothingEnabled = false;
      c.drawImage(small, bx, by, bw, bh);
      c.imageSmoothingEnabled = true;
      c.globalCompositeOperation = 'multiply'; c.drawImage(mask, bx, by, bw, bh); c.globalCompositeOperation = 'source-over';
    },
  });
}

// ================================================================ the name, knotted in
function letters(p, rug, tex) {
  // each letter is drawn small and read back knot by knot, then knotted in one at a time
  const set = (word, b, size, t0, gap, track) => {
    const cy = (b.y0 + b.y1) / 2;
    let cache = null;
    const make = () => {
      if (cache) return cache;
      const S = 6, cv = document.createElement('canvas');
      cv.width = NX * S; cv.height = NY * S;
      const c = cv.getContext('2d');
      c.scale(S, S);
      c.font = `800 ${size}px "Alegreya SC"`; c.textBaseline = 'alphabetic';
      const widths = [...word].map((ch) => c.measureText(ch).width);
      const total = widths.reduce((a, w) => a + w, 0) + track * (word.length - 1);
      let x = (b.x0 + b.x1) / 2 - total / 2;
      const cap = size * 0.68, base = cy + cap / 2;
      const spans = [];
      for (let i = 0; i < word.length; i++) {
        c.fillStyle = '#fff'; c.fillText(word[i], x, base);
        spans.push([Math.floor(x) - 1, Math.ceil(x + widths[i]) + 2]);
        x += widths[i] + track;
      }
      // knots are tied where the letter covers more than half the knot
      const data = c.getImageData(0, 0, cv.width, cv.height).data;
      const on = new Uint8Array(NX * NY);
      for (let y = b.y0 + 3; y < b.y1 - 3; y++) for (let xk = b.x0 + 3; xk < b.x1 - 3; xk++) {
        let sum = 0;
        for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) sum += data[((y * S + j) * cv.width + xk * S + i) * 4 + 3];
        if (sum / (S * S * 255) > 0.45) on[y * NX + xk] = 1;
      }
      // a fine canvas with the letter knots, their gold shadow knots and the pile
      const Z = 2, hi = document.createElement('canvas');
      hi.width = NX * KN * Z; hi.height = (b.y1 - b.y0) * KN * Z;
      const h = hi.getContext('2d');
      h.scale(Z, Z); h.translate(-RX, -RY - b.y0 * KN);
      for (let y = b.y0; y < b.y1; y++) for (let xk = b.x0; xk < b.x1; xk++) {
        const i = y * NX + xk;
        if (on[i]) { h.fillStyle = shade(PAL[IVORY], 1 + rug.jit[i]); h.fillRect(RX + xk * KN, RY + y * KN, KN, KN); }
        else if (on[i - NX - 1] && rug.g[i] === NAVY) { h.fillStyle = shade(PAL[GOLD], 1 + rug.jit[i]); h.fillRect(RX + xk * KN, RY + y * KN, KN, KN); }
      }
      h.globalCompositeOperation = 'source-atop';
      const m = new DOMMatrix([1 / tex.S, 0, 0, 1 / tex.S, RX, RY]);
      const pd = h.createPattern(tex.dark, 'repeat'); pd.setTransform(m);
      h.fillStyle = pd; h.globalAlpha = 1;
      // multiply inside the letters only: draw the pattern over a copy and keep it where the letters are
      const tmp = document.createElement('canvas'); tmp.width = hi.width; tmp.height = hi.height;
      const tc = tmp.getContext('2d'); tc.drawImage(hi, 0, 0);
      tc.globalCompositeOperation = 'multiply'; tc.setTransform(Z, 0, 0, Z, -RX * Z, -(RY + b.y0 * KN) * Z); tc.fillStyle = pd; tc.fillRect(RX, RY + b.y0 * KN, NX * KN, (b.y1 - b.y0) * KN);
      tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'destination-in'; tc.drawImage(hi, 0, 0);
      cache = { cv: tmp, spans, Z };
      return cache;
    };
    // one mark a letter, over its span of knots
    const est = size * 0.62 + track;
    const n = word.length, total = est * n;
    for (let i = 0; i < n; i++) {
      const xa = (b.x0 + b.x1) / 2 - total / 2 + est * i;
      p.group('letters', { x: RX + (xa - 3) * KN, y: RY + b.y0 * KN - 10, w: (est + 6) * KN, h: (b.y1 - b.y0) * KN + 20 }, (c) => {
        const { cv, spans, Z } = make();
        const [s0, s1] = spans[i];
        const sx = clamp(s0, b.x0, b.x1), ex = clamp(s1, b.x0, b.x1);
        c.drawImage(cv, sx * KN * Z, 0, (ex - sx) * KN * Z, cv.height, RX + sx * KN, RY + b.y0 * KN, (ex - sx) * KN, (b.y1 - b.y0) * KN);
      }, { t: t0 + i * gap, d: 0.7, reveal: 'press', ease: 'out' });
    }
  };
  set('BAKI', TOP, 31, 10.4, 0.32, 3);
  set('BAKU', BOT, 18, 11.9, 0.18, 2);
}
