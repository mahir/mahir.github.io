// Tunis: a house in Sidi Bou Said, drawn face on like a mid-century screen print in
// whitewash, cobalt and magenta. The white wall fills the sheet: a studded blue door
// with a small wicket door in it, under a horseshoe arch of black and white stones,
// a blue mashrabiya on carved brackets, an iron window grille, a tiled bench with
// pots, and bougainvillea pouring over the corner. Past the corner the village
// steps down to the Gulf of Tunis: the mosque's square minaret, white houses with
// blue shutters, cypresses, and Bou Kornine's two horns across the water. The name
// is set on a painted tile plaque on the wall, تونس over TUNIS.

import { Plate, W, H } from '../print.js';
import { shade, lerp, poly } from '../kit.js';

// the inks
const WHITE = '#f8f6f0', WALL_S = '#d6dcea', WALL_D = '#b9c2da', SHADOW = 'rgba(64,82,150,.24)';
const BLUE = '#1658a6', BLUE_D = '#0c3a74', BLUE_L = '#3d86cf', BLUE_P = '#9cc4e8';
const SKY_T = '#3a8fd2', SKY_B = '#cbe7f1';
const SEA = '#1a8bb0', SEA_D = '#0e6286', SEA_L = '#61b7cf';
const STONE = '#dcb87c', STONE_D = '#b48c52', STONE_L = '#ecd3a2';
const INK = '#18202e';
const MAG = '#cf1f78', MAG_L = '#ea4d9c', MAG_D = '#9b1159', MAG_P = '#f39ac4';
const LEAF = '#2e6a3a', LEAF_L = '#4f9145', LEAF_D = '#1f4a2a';
const TERRA = '#c4623a', TERRA_D = '#8f3f22', YEL = '#e9b730', GREEN = '#3b8a68';
const HAZE = '#a9b6d8';

export const city = {
  id: 'tunis', name: 'Tunis', wall: '#123a6b',
  alt: 'A whitewashed house in Sidi Bou Said seen face on: a blue door studded with black nails under a horseshoe arch of black and white stones, a blue mashrabiya window on carved brackets, a blue iron window grille, a tiled bench with potted geraniums, and magenta bougainvillea pouring over the corner, beyond which the village steps down to the Gulf of Tunis with the square white minaret of the mosque, white houses with blue shutters, cypresses, a cat on the parapet, sailboats and the two peaks of Bou Kornine, the name تونس and TUNIS on a painted tile plaque',
  google: 'family=Tajawal:wght@500;800',
  fonts: [['800 230px "Tajawal"', 'تونس'], ['500 56px "Tajawal"', 'TUNIS'], ['500 22px "Tajawal"', 'SIDI BOU SAID · GOLFE DE TUNIS']],
  build,
};

// the sheet: a paper margin, a cobalt rule, the picture inside
const M = 40, R = W - M, B = H - M;
// the house: its wall runs from the left edge to the corner, from the parapet to the street
const CX = 1080, TOP = 330, STREET = 1820;
// the view past the corner
const HZ = 1010; // the horizon
// the door: an arch over a tall leaf
const DX0 = 580, DX1 = 980, DXM = 780, DR = 200, DAY = 1160, DBOT = STREET;
// the mashrabiya
const MX0 = 120, MX1 = 470, MY0 = 930, MY1 = 1120;
// the tile plaque for the name
const TX0 = 110, TX1 = 782, TY0 = 380, TY1 = 828;

function build() {
  const p = new Plate({ paper: '#f3eee2', seed: 1956 });
  const r = p.r;
  p.clip = { x: M, y: M, w: R - M, h: B - M };
  p.stack('sky', 'far', 'sea', 'village', 'wall', 'shade', 'door', 'works', 'vine', 'bloom', 'near', 'title', 'air', 'frame');
  p.layer('frame', { clip: false });
  p.layer('title', { clip: false });

  frame(p);
  sky(p, r);
  far(p, r);
  village(p, r);
  wall(p, r);
  door(p, r);
  mashrabiya(p);
  grille(p);
  street(p, r);
  parapet(p, r);
  bench(p, r);
  bougainvillea(p, r);
  plaque(p);
  life(p, r);
  return p;
}

// ================================================================ the frame
function frame(p) {
  // the paper margin is laid over the picture's edge, then the cobalt rules drawn round it
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = '#f3eee2';
    c.beginPath(); c.rect(0, 0, W, H); c.rect(M, M, R - M, B - M); c.fill('evenodd');
  }, { t: 0, d: 0.3, reveal: 'fade' });
  p.pen('frame', [[M, M], [R, M], [R, B], [M, B], [M, M]], BLUE_D, 4, { t: 0.1, d: 1.6, cap: 'square' });
  p.pen('frame', [[M - 14, M - 14], [R + 14, M - 14], [R + 14, B + 14], [M - 14, B + 14], [M - 14, M - 14]], BLUE, 1.4, { t: 0.4, d: 1.6, cap: 'square' });
}

// ================================================================ the sky
function sky(p, r) {
  p.group('sky', { x: M, y: M, w: R - M, h: HZ - M + 4 }, (c) => {
    const g = c.createLinearGradient(0, M, 0, HZ);
    g.addColorStop(0, SKY_T); g.addColorStop(0.6, '#7ab9e2'); g.addColorStop(1, SKY_B);
    c.fillStyle = g; c.fillRect(M, M, R - M, HZ - M + 4);
  }, { t: 0.2, d: 1.3, reveal: 'fall', ease: 'inOut' });
  // screen-print banding: a few paler stripes low in the sky
  const bands = [];
  for (let k = 0; k < 7; k++) { const y = HZ - 30 - k * 22 - k * k * 2; bands.push([[CX - 20, y], [R + 4, y]]); }
  p.strokes('sky', bands, 'rgba(255,255,255,.35)', 3, { t: 1.2, d: 0.9, reveal: 'wipeL', cap: 'butt' });
  // a few long flat clouds
  const clouds = [[1180, 470, 230], [1300, 760, 200], [130, 150, 260], [560, 230, 190], [1120, 210, 160]];
  clouds.forEach(([x, y, w], i) => {
    p.group('sky', { x: x - 30, y: y - 30, w: w + 70, h: 46 }, (c) => {
      c.fillStyle = 'rgba(255,255,255,.88)';
      c.beginPath();
      c.ellipse(x + w * 0.5, y, w * 0.5, 9, 0, 0, Math.PI * 2);
      c.ellipse(x + w * 0.35, y - 9, w * 0.22, 11, 0, 0, Math.PI * 2);
      c.ellipse(x + w * 0.62, y - 6, w * 0.18, 9, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(160,190,225,.5)'; c.fillRect(x + w * 0.12, y + 4, w * 0.76, 3);
    }, { t: 1.4 + i * 0.15, d: 1.0, reveal: i % 2 ? 'wipe' : 'wipeL' });
  });
}

// ================================================================ the gulf and the far shore
function far(p, r) {
  const x0 = CX - 10;
  // Bou Kornine: two horns over a long low shore
  const ridge = [];
  for (let x = x0; x <= R + 10; x += 6) {
    const h1 = 84 * Math.exp(-(((x - 1250) / 34) ** 2)), h2 = 70 * Math.exp(-(((x - 1316) / 30) ** 2));
    const body = 46 * Math.exp(-(((x - 1290) / 120) ** 2)), shore = 12 + 6 * Math.sin(x * 0.013);
    ridge.push([x, HZ - Math.max(h1, h2, body, shore)]);
  }
  p.fill('far', [[x0, HZ + 2], ...ridge, [R + 10, HZ + 2]], HAZE, { t: 1.3, d: 1.2, reveal: 'rise' });
  // its shadowed gullies
  const gul = [];
  for (let k = 0; k < 9; k++) { const x = 1222 + k * 13; gul.push([[x, HZ - 70 + Math.abs(k - 4) * 9], [x - 8, HZ - 14]]); }
  p.strokes('far', gul, 'rgba(110,120,170,.5)', 2, { t: 2.2, d: 0.6, reveal: 'fade' });
  // the sea, darker toward us
  p.group('sea', { x: x0, y: HZ, w: R - x0 + 10, h: 560 }, (c) => {
    const g = c.createLinearGradient(0, HZ, 0, HZ + 560);
    g.addColorStop(0, SEA_L); g.addColorStop(0.3, SEA); g.addColorStop(1, SEA_D);
    c.fillStyle = g; c.fillRect(x0, HZ, R - x0 + 10, 560);
  }, { t: 1.5, d: 1.1, reveal: 'fall' });
  // ripples, as short ruled strokes
  const rip = [];
  for (let i = 0; i < 160; i++) {
    const f = r() ** 1.4, y = HZ + 6 + f * 480, L = 6 + f * 26, x = r.range(x0, R);
    rip.push([[x, y], [x + L, y]]);
  }
  p.strokes('sea', rip, 'rgba(215,240,245,.55)', 1.6, { t: 2.0, d: 1.0, reveal: 'wipe' });
}

// ================================================================ the village down the slope
function whiteHouse(c, x, y, w, h, o) {
  // y is the foot; light from the upper right, so the left return is in shade
  const ext = o.ext || 60;
  c.fillStyle = WHITE; c.fillRect(x, y - h, w, h + ext);
  c.fillStyle = WALL_S; c.fillRect(x, y - h, Math.max(3, w * 0.16), h + ext);
  // a roof parapet, a lip of shadow under it
  c.fillStyle = WALL_D; c.fillRect(x, y - h + 4, w, 2);
  if (o.dome) {
    c.fillStyle = WHITE; c.beginPath(); c.arc(x + w * o.dome, y - h, w * 0.2, Math.PI, 0); c.fill();
    c.fillStyle = WALL_S; c.beginPath(); c.arc(x + w * o.dome, y - h, w * 0.2, Math.PI, Math.PI * 1.4); c.lineTo(x + w * o.dome, y - h); c.fill();
  }
  // shutters and doors in blue
  c.fillStyle = BLUE;
  for (const [u, v, ww, hh] of o.wins) c.fillRect(x + u * w, y - h + v * h, ww, hh);
  if (o.door != null) {
    const dx = x + o.door * w, dw = Math.min(14, w * 0.2), dh = Math.min(24, h * 0.5);
    c.beginPath(); c.moveTo(dx, y); c.lineTo(dx, y - dh + dw / 2); c.arc(dx + dw / 2, y - dh + dw / 2, dw / 2, Math.PI, 0); c.lineTo(dx + dw, y); c.fill();
  }
}
function village(p, r) {
  // rows of white houses stepping down toward the water, the farthest first
  const rows = [
    { y: 1270, h: [34, 56], n: 9, s: 0.7 },
    { y: 1340, h: [44, 70], n: 8, s: 0.85 },
    { y: 1420, h: [56, 84], n: 7, s: 1 },
    { y: 1510, h: [66, 96], n: 6, s: 1.2 },
  ];
  const houses = rows.map((row, ri) => {
    const list = [];
    let x = CX - 30 + r.range(-20, 0);
    while (x < R + 10) {
      const w = r.range(56, 110) * row.s, h = r.range(...row.h);
      const wins = [];
      const nw = r.int(1, 3);
      for (let k = 0; k < nw; k++) wins.push([r.range(0.25, 0.75), r.range(0.15, 0.4), 6 * row.s, 10 * row.s]);
      list.push({ x, y: row.y + r.range(-8, 6), w, h, o: { ext: ri === 3 ? 140 : 70, wins, door: r.chance(0.6) ? r.range(0.3, 0.7) : null, dome: r.chance(0.2) ? r.range(0.3, 0.7) : null } });
      x += w + r.range(-14, 6);
    }
    return list;
  });
  // the minaret and the mosque behind the first row
  minaret(p);
  // cypresses and palms between the rows
  const trees = [];
  for (let i = 0; i < 12; i++) trees.push([r.range(CX + 10, R - 10), r.pick([1250, 1330, 1410]) - r.range(0, 10), r.range(0.7, 1.2), r.chance(0.65) ? 'cyp' : 'palm']);
  houses.forEach((row, ri) => {
    p.group('village', { x: CX - 60, y: 1100, w: R - CX + 80, h: 460 }, (c) => {
      for (const hs of row) whiteHouse(c, hs.x, hs.y, hs.w, hs.h, hs.o);
      // the next row's trees stand in front of this one
      for (const [x, y, s, kind] of trees) {
        if (Math.abs(y - (rows[ri].y - 10)) > 30 || ri === 3) continue;
        if (kind === 'cyp') {
          c.fillStyle = LEAF_D; c.beginPath(); c.ellipse(x, y + 40 - 46 * s, 8 * s, 46 * s, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = LEAF; c.beginPath(); c.ellipse(x + 2 * s, y + 40 - 48 * s, 4 * s, 40 * s, 0, 0, Math.PI * 2); c.fill();
        } else {
          c.strokeStyle = '#6b5236'; c.lineWidth = 2.5 * s; c.beginPath(); c.moveTo(x, y + 40); c.quadraticCurveTo(x + 6 * s, y, x + 2 * s, y - 30 * s); c.stroke();
          c.strokeStyle = LEAF; c.lineWidth = 3 * s; c.lineCap = 'round';
          c.beginPath();
          for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.48; c.moveTo(x + 2 * s, y - 30 * s); c.quadraticCurveTo(x + 2 * s + Math.cos(a) * 14 * s, y - 30 * s + Math.sin(a) * 14 * s - 4 * s, x + 2 * s + Math.cos(a) * 26 * s, y - 30 * s + Math.sin(a) * 18 * s + 10 * s); }
          c.stroke();
        }
      }
    }, { t: 2.4 + ri * 0.45, d: 0.9, reveal: 'rise' });
  });
}
function minaret(p) {
  const x0 = 1330, x1 = 1418, foot = 1250, top = 660;
  p.group('village', { x: x0 - 140, y: 450, w: R - x0 + 150, h: foot - 450 + 10 }, (c) => {
    // the prayer hall's white dome beside it
    c.fillStyle = WHITE; c.fillRect(x1 + 6, foot - 110, 130, 110);
    c.beginPath(); c.arc(x1 + 70, foot - 110, 46, Math.PI, 0); c.fill();
    c.fillStyle = WALL_S; c.beginPath(); c.arc(x1 + 70, foot - 110, 46, Math.PI, Math.PI * 1.45); c.lineTo(x1 + 70, foot - 110); c.fill();
    c.fillRect(x1 + 6, foot - 110, 16, 110);
    c.fillStyle = BLUE; for (let k = 0; k < 3; k++) { c.fillRect(x1 + 36 + k * 30, foot - 80, 10, 24); }
    // the square shaft
    c.fillStyle = WHITE; c.fillRect(x0, top, x1 - x0, foot - top);
    c.fillStyle = WALL_S; c.fillRect(x0, top, 22, foot - top);
    // its stone bands and blind arches
    c.fillStyle = STONE_L; c.fillRect(x0, top + 120, x1 - x0, 6); c.fillRect(x0, top + 330, x1 - x0, 6);
    c.fillStyle = BLUE_D;
    for (const yy of [top + 60, top + 200, top + 400]) {
      const ax = (x0 + x1) / 2;
      c.beginPath(); c.moveTo(ax - 9, yy + 42); c.lineTo(ax - 9, yy + 9); c.arc(ax, yy + 9, 9, Math.PI, 0); c.lineTo(ax + 9, yy + 42); c.fill();
    }
    // the gallery: a jutting ledge and merlons
    c.fillStyle = WALL_D; c.fillRect(x0 - 10, top - 6, x1 - x0 + 20, 10);
    c.fillStyle = WHITE; c.fillRect(x0 - 10, top - 10, x1 - x0 + 20, 6);
    for (let k = 0; k < 6; k++) { const mx = x0 - 8 + k * ((x1 - x0 + 16) / 5.5); c.fillRect(mx, top - 26, 9, 16); }
    // the lantern and its little green-tiled cap
    const lx0 = x0 + 18, lx1 = x1 - 18;
    c.fillStyle = WHITE; c.fillRect(lx0, top - 104, lx1 - lx0, 94);
    c.fillStyle = WALL_S; c.fillRect(lx0, top - 104, 12, 94);
    c.fillStyle = BLUE_D; c.beginPath(); c.moveTo(lx0 + 18, top - 30); c.lineTo(lx0 + 18, top - 66); c.arc((lx0 + lx1) / 2, top - 66, (lx1 - lx0) / 2 - 18, Math.PI, 0); c.lineTo(lx1 - 18, top - 30); c.fill();
    c.fillStyle = GREEN; poly(c, [[lx0 - 8, top - 104], [lx1 + 8, top - 104], [(lx0 + lx1) / 2, top - 140]]); c.fill();
    c.fillStyle = shade(GREEN, 0.7); poly(c, [[lx0 - 8, top - 104], [(lx0 + lx1) / 2, top - 104], [(lx0 + lx1) / 2, top - 140]]); c.fill();
    // the finial: a rod with three brass balls
    const fx = (lx0 + lx1) / 2;
    c.strokeStyle = '#8a6a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(fx, top - 140); c.lineTo(fx, top - 182); c.stroke();
    c.fillStyle = YEL; for (const [yy, rr] of [[top - 150, 5], [top - 162, 4], [top - 172, 3]]) { c.beginPath(); c.arc(fx, yy, rr, 0, Math.PI * 2); c.fill(); }
  }, { t: 2.2, d: 1.6, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the wall
function wall(p, r) {
  // the whitewashed face, rising from the street
  p.group('wall', { x: M - 4, y: TOP - 130, w: CX - M + 8, h: STREET - TOP + 134 }, (c) => {
    c.fillStyle = WHITE; c.fillRect(M, TOP, CX - M, STREET - TOP);
    // the parapet's rounded coping and its shadow
    c.fillStyle = WHITE; c.beginPath(); c.roundRect(M - 4, TOP - 18, CX - M + 14, 26, 12); c.fill();
    c.fillStyle = WALL_S; c.fillRect(M, TOP + 8, CX - M, 7);
    // the corner: a thin shaded return
    c.fillStyle = WALL_S; c.fillRect(CX - 6, TOP + 8, 6, STREET - TOP - 8);
    // a little dome on the roof, at the back
    c.fillStyle = WHITE; c.beginPath(); c.arc(300, TOP - 14, 96, Math.PI, 0); c.fill();
    c.fillStyle = WALL_S; c.beginPath(); c.arc(300, TOP - 14, 96, Math.PI, Math.PI * 1.42); c.lineTo(300, TOP - 14); c.fill();
    c.fillStyle = WHITE; c.fillRect(196, TOP - 24, 208, 12);
  }, { t: 1.6, d: 1.6, reveal: 'rise', ease: 'inOut' });
  // whitewash brush marks: many faint strokes laid in coats
  for (let k = 0; k < 3; k++) {
    const lines = [];
    for (let i = 0; i < 150; i++) {
      const x = r.range(M, CX - 40), y = r.range(TOP + 20, STREET - 10), L = r.range(20, 90);
      lines.push([[x, y], [x + L * 0.5, y + r.range(-2, 2)], [x + L, y + r.range(-3, 3)]]);
    }
    p.strokes('wall', lines, k === 1 ? 'rgba(200,205,220,.35)' : 'rgba(225,226,232,.55)', r.range(1.4, 3), { t: 3.0 + k * 0.35, d: 0.9, reveal: 'wipe', box: { x: M, y: TOP, w: CX - M, h: STREET - TOP } });
  }
}

// ================================================================ the door
// the horseshoe arch: a circle cut low, so it closes in a little at its springing
const ARC = 0.36; // radians below the horizontal on each side
function archPath(c, cx, cy, rad, foot) {
  const a0 = Math.PI - ARC, a1 = ARC;
  c.beginPath();
  c.moveTo(cx + Math.cos(a0) * rad, foot);
  c.lineTo(cx + Math.cos(a0) * rad, cy + Math.sin(a0) * rad);
  c.arc(cx, cy, rad, a0, a1 + Math.PI * 2, false);
  c.lineTo(cx + Math.cos(a1) * rad, foot);
  c.closePath();
}
function studRow(out, x0, y0, x1, y1, step) {
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
  for (let i = 0; i <= n; i++) out.push([lerp(x0, x1, i / n), lerp(y0, y1, i / n)]);
}
function studArc(out, cx, cy, rad, a0, a1, step) {
  const n = Math.max(2, Math.round(Math.abs(a1 - a0) * rad / step));
  for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); out.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); }
}
function door(p, r) {
  const ro = DR + 70; // the stone surround's outer radius
  // the recess's shadow and the stone surround, the voussoirs alternating black and white
  p.group('door', { x: DXM - ro - 30, y: DAY - ro - 30, w: 2 * ro + 60, h: DBOT - DAY + ro + 40 }, (c) => {
    // a pale stone frame with its columns
    c.fillStyle = STONE; c.fillRect(DXM - ro, DAY, 2 * ro, DBOT - DAY);
    archPath(c, DXM, DAY, ro, DAY + 20); c.fill();
    // the voussoirs, in alternating stone
    const n = 15;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI - ARC + (i / n) * (Math.PI + 2 * ARC), a1 = Math.PI - ARC + ((i + 1) / n) * (Math.PI + 2 * ARC);
      c.fillStyle = i % 2 ? INK : STONE_L;
      c.beginPath(); c.arc(DXM, DAY, ro - 8, a0, a1); c.arc(DXM, DAY, DR + 18, a1, a0, true); c.closePath(); c.fill();
    }
    // the keystone
    c.fillStyle = STONE_D; poly(c, [[DXM - 20, DAY - ro - 4], [DXM + 20, DAY - ro - 4], [DXM + 14, DAY - DR - 16], [DXM - 14, DAY - DR - 16]]); c.fill();
    // two slim columns with capitals, carved in the jambs
    for (const s of [-1, 1]) {
      const x = DXM + s * (DR + 40);
      c.fillStyle = STONE_L; c.fillRect(x - 13, DAY + 40, 26, DBOT - DAY - 90);
      c.fillStyle = STONE_D; c.fillRect(x - 13, DAY + 40, 7, DBOT - DAY - 90);
      c.fillStyle = STONE_D; c.fillRect(x - 20, DAY + 20, 40, 20); c.fillRect(x - 20, DBOT - 54, 40, 22);
      c.fillStyle = STONE_L; c.fillRect(x - 20, DAY + 20, 40, 6);
      // carved rings on the capital
      c.strokeStyle = STONE_D; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 13, DAY + 52); c.lineTo(x + 13, DAY + 52); c.moveTo(x - 13, DBOT - 64); c.lineTo(x + 13, DBOT - 64); c.stroke();
    }
    // a threshold step
    c.fillStyle = STONE_D; c.fillRect(DXM - ro - 14, DBOT - 22, 2 * ro + 28, 22);
    c.fillStyle = STONE_L; c.fillRect(DXM - ro - 14, DBOT - 22, 2 * ro + 28, 5);
  }, { t: 3.3, d: 1.1, reveal: 'rise', ease: 'inOut' });

  // the leaf: cobalt boards in the arch, with a recess shadow on the left
  p.group('door', { x: DX0 - 10, y: DAY - DR - 10, w: DX1 - DX0 + 20, h: DBOT - DAY + DR + 10 }, (c) => {
    archPath(c, DXM, DAY, DR, DBOT - 22);
    c.fillStyle = BLUE; c.fill();
    c.save(); c.clip();
    // boards
    c.strokeStyle = BLUE_D; c.lineWidth = 1.4; c.beginPath();
    for (let x = DX0 + 25; x < DX1; x += 25) { c.moveTo(x, DAY - DR); c.lineTo(x, DBOT); }
    c.stroke();
    // the shadow of the jamb across the leaf's left edge, and the arch's on its top
    c.fillStyle = 'rgba(8,30,70,.45)'; c.fillRect(DX0 - 20, DAY - DR, 34, DBOT - DAY + DR);
    c.beginPath(); c.rect(DX0 - 10, DAY - DR - 10, DX1 - DX0 + 20, DR + 10); c.clip();
    c.beginPath(); c.arc(DXM, DAY, DR + 4, 0, Math.PI * 2); c.arc(DXM - 14, DAY + 22, DR, 0, Math.PI * 2, true); c.fill();
    c.restore();
    // the panels framed by raised moldings
    c.strokeStyle = BLUE_L; c.lineWidth = 3;
    c.strokeRect(DX0 + 40, DAY + 70, DX1 - DX0 - 80, 150);
    // the wicket door, a small arched door in the big one
    const wx0 = DXM - 82, wx1 = DXM + 82, wtop = 1420;
    c.fillStyle = BLUE_D; archPath(c, DXM, wtop + 82, 86, DBOT - 22); c.fill();
    c.fillStyle = BLUE; archPath(c, DXM, wtop + 82, 78, DBOT - 22); c.fill();
    c.strokeStyle = BLUE_L; c.lineWidth = 2; c.strokeRect(wx0 + 22, wtop + 120, wx1 - wx0 - 44, 220);
  }, { t: 3.9, d: 1.0, reveal: 'fall', ease: 'out' });

  // the nails: rows along the borders, around the arch, a lattice of diamonds and a star
  const zones = [[], [], [], [], []];
  // the outer border
  studRow(zones[0], DX0 + 18, DBOT - 34, DX0 + 18, DAY, 15);
  studRow(zones[0], DX1 - 18, DBOT - 34, DX1 - 18, DAY, 15);
  studArc(zones[0], DXM, DAY, DR - 18, Math.PI, Math.PI * 2, 15);
  studArc(zones[1], DXM, DAY, DR - 40, Math.PI, Math.PI * 2, 15);
  studRow(zones[1], DX0 + 40, DAY + 50, DX1 - 40, DAY + 50, 15);
  studRow(zones[1], DX0 + 40, DAY + 240, DX1 - 40, DAY + 240, 15);
  // inside the arch: a fan of rays of nails
  for (let k = 1; k < 8; k++) { const a = Math.PI + (k / 8) * Math.PI; studRow(zones[2], DXM + Math.cos(a) * 30, DAY + Math.sin(a) * 30, DXM + Math.cos(a) * (DR - 58), DAY + Math.sin(a) * (DR - 58), 14); }
  // the panel: diamonds
  for (let k = 0; k < 4; k++) {
    const cx = DX0 + 90 + k * 73, cy = DAY + 145, s = 30;
    studRow(zones[3], cx - s, cy, cx, cy - s * 1.6, 13); studRow(zones[3], cx, cy - s * 1.6, cx + s, cy, 13);
    studRow(zones[3], cx + s, cy, cx, cy + s * 1.6, 13); studRow(zones[3], cx, cy + s * 1.6, cx - s, cy, 13);
  }
  // round the wicket and an eight-pointed star of nails on it
  studArc(zones[4], DXM, 1502, 66, Math.PI - ARC, ARC + Math.PI * 2, 14);
  studRow(zones[4], DXM - 66 * Math.cos(ARC), 1502 + 66 * Math.sin(ARC), DXM - 66 * Math.cos(ARC), DBOT - 40, 14);
  studRow(zones[4], DXM + 66 * Math.cos(ARC), 1502 + 66 * Math.sin(ARC), DXM + 66 * Math.cos(ARC), DBOT - 40, 14);
  for (let k = 0; k < 8; k++) {
    const a0 = (k / 8) * Math.PI * 2, a1 = ((k + 3) / 8) * Math.PI * 2;
    studRow(zones[4], DXM + Math.cos(a0) * 44, 1650 + Math.sin(a0) * 44, DXM + Math.cos(a1) * 44, 1650 + Math.sin(a1) * 44, 12);
  }
  // the big leaf's lower field: rows of nails beside the wicket
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) studRow(zones[3], DXM + s * (106 + k * 22), 1300, DXM + s * (106 + k * 22), 1760, 16);
  zones.forEach((pts, i) => {
    p.group('door', { x: DX0 - 4, y: DAY - DR - 4, w: DX1 - DX0 + 8, h: DBOT - DAY + DR + 8 }, (c) => {
      c.fillStyle = INK; c.beginPath();
      for (const [x, y] of pts) { c.moveTo(x + 3.6, y); c.arc(x, y, 3.6, 0, Math.PI * 2); }
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath();
      for (const [x, y] of pts) { c.moveTo(x + 0.2, y - 1.2); c.arc(x - 1, y - 1.2, 1.1, 0, Math.PI * 2); }
      c.fill();
    }, { t: 4.8 + i * 0.32, d: 0.7, reveal: i === 2 ? 'iris' : 'fall' });
  });
  // knockers: iron rings on the big leaf and the wicket, and a keyhole plate
  p.group('door', { x: DX0, y: 1200, w: DX1 - DX0, h: 500 }, (c) => {
    c.strokeStyle = INK; c.lineCap = 'round';
    for (const [x, y, rr] of [[DXM - 130, 1330, 20], [DXM + 130, 1330, 20], [DXM + 50, 1560, 14]]) {
      c.fillStyle = INK; c.beginPath(); c.arc(x, y - rr, 6, 0, Math.PI * 2); c.fill();
      c.lineWidth = 5; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, rr, Math.PI * 1.1, Math.PI * 1.5); c.stroke(); c.strokeStyle = INK;
    }
    c.fillStyle = INK; c.fillRect(DXM - 66, 1590, 12, 30); c.fillStyle = BLUE; c.beginPath(); c.arc(DXM - 60, 1600, 2.6, 0, Math.PI * 2); c.fill();
  }, { t: 6.5, d: 0.6, reveal: 'pop' });
  // the door's shadow on the wall: the stone frame's thickness, cast down and left
  p.group('shade', { x: DXM - 300, y: DAY - 300, w: 600, h: DBOT - DAY + 320 }, (c) => {
    c.fillStyle = SHADOW;
    c.beginPath(); c.moveTo(DXM - 270, DAY + 24); c.lineTo(DXM - 292, DAY + 46); c.lineTo(DXM - 292, DBOT - 30); c.lineTo(DXM - 270, DBOT - 22); c.fill();
  }, { t: 5.2, d: 0.8, reveal: 'fade' });
}

// ================================================================ the mashrabiya
function mashrabiya(p) {
  const x0 = MX0, x1 = MX1, y0 = MY0, y1 = MY1, belly = 46;
  // the shadow it throws on the wall, down and to the left
  p.group('shade', { x: x0 - 40, y: y0 - 10, w: x1 - x0 + 60, h: y1 - y0 + 200 }, (c) => {
    c.fillStyle = SHADOW;
    c.beginPath(); c.moveTo(x0 + 10, y0 + 20); c.lineTo(x0 - 30, y0 + 60); c.lineTo(x0 - 30, y1 + 70); c.quadraticCurveTo((x0 + x1) / 2 - 40, y1 + belly + 110, x1 - 40, y1 + 70); c.lineTo(x1, y1 + 10); c.fill();
  }, { t: 7.0, d: 0.7, reveal: 'fade' });
  // the hood, the box, the lattice and the brackets, drawn by a pen in turn
  p.group('works', { x: x0 - 30, y: y0 - 70, w: x1 - x0 + 60, h: y1 - y0 + 200 }, (c) => {
    // the dark room behind the lattice
    c.fillStyle = '#0c2347';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1, y1); c.quadraticCurveTo((x0 + x1) / 2, y1 + belly * 2, x0, y1); c.closePath(); c.fill();
  }, { t: 4.6, d: 0.7, reveal: 'fall' });
  // the lattice: turned bars as a grid of short strokes with beads
  p.group('works', { x: x0 - 6, y: y0 - 6, w: x1 - x0 + 12, h: y1 - y0 + belly * 2 + 12 }, (c) => {
    c.save();
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1, y1); c.quadraticCurveTo((x0 + x1) / 2, y1 + belly * 2, x0, y1); c.closePath(); c.clip();
    c.strokeStyle = BLUE_L; c.lineWidth = 3.2; c.beginPath();
    for (let x = x0 + 10; x < x1; x += 14) { c.moveTo(x, y0); c.lineTo(x, y1 + belly * 1.2); }
    for (let y = y0 + 10; y < y1 + belly; y += 14) { c.moveTo(x0, y); c.lineTo(x1, y); }
    c.stroke();
    c.fillStyle = BLUE_P; c.beginPath();
    for (let x = x0 + 10; x < x1; x += 14) for (let y = y0 + 10; y < y1 + belly; y += 14) { c.moveTo(x + 2.4, y); c.arc(x, y, 2.4, 0, Math.PI * 2); }
    c.fill();
    c.restore();
  }, { t: 5.2, d: 1.3, reveal: 'fall', ease: 'inOut' });
  // the frame, rails and the curved belly band, then the hood and the brackets
  p.group('works', { x: x0 - 40, y: y0 - 80, w: x1 - x0 + 80, h: y1 - y0 + 220 }, (c) => {
    c.strokeStyle = BLUE; c.lineWidth = 12; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x0, y1); c.lineTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1, y1); c.stroke();
    c.lineWidth = 14; c.beginPath(); c.moveTo(x0, y1); c.quadraticCurveTo((x0 + x1) / 2, y1 + belly * 2, x1, y1); c.stroke();
    c.lineWidth = 8; c.beginPath(); c.moveTo(x0, y0 + 70); c.lineTo(x1, y0 + 70); c.moveTo(x0, y1 - 10); c.lineTo(x1, y1 - 10); c.stroke();
    // the posts
    c.lineWidth = 9; c.beginPath(); for (const x of [x0 + (x1 - x0) / 3, x0 + 2 * (x1 - x0) / 3]) { c.moveTo(x, y0); c.lineTo(x, y1 + belly * 0.95); } c.stroke();
    // a light edge on the right of each member
    c.strokeStyle = BLUE_P; c.lineWidth = 2; c.beginPath(); c.moveTo(x1 + 4, y0); c.lineTo(x1 + 4, y1); c.stroke();
    // the hood: a sloping roof of green glazed tiles under a blue board
    c.fillStyle = BLUE_D; c.fillRect(x0 - 26, y0 - 18, x1 - x0 + 52, 16);
    c.fillStyle = GREEN; poly(c, [[x0 - 30, y0 - 18], [x1 + 30, y0 - 18], [x1 + 6, y0 - 62], [x0 - 6, y0 - 62]]); c.fill();
    c.strokeStyle = shade(GREEN, 0.65); c.lineWidth = 2; c.beginPath();
    for (let k = 0; k <= 22; k++) { const t = k / 22; c.moveTo(lerp(x0 - 30, x1 + 30, t), y0 - 18); c.lineTo(lerp(x0 - 6, x1 + 6, t), y0 - 62); }
    c.stroke();
    c.fillStyle = '#7fbf9a'; c.fillRect(x0 - 6, y0 - 66, x1 - x0 + 12, 6);
    // the carved brackets under it, curling back to the wall
    c.fillStyle = BLUE_D;
    for (const [x, s] of [[x0 + 40, -1], [x1 - 40, 1]]) {
      // a quarter-round console: flat on the box, curving back into the wall
      c.beginPath(); c.moveTo(x - 30 * s, y1 + 10); c.lineTo(x + 6 * s, y1 + 26); c.quadraticCurveTo(x + 4 * s, y1 + 92, x - 30 * s, y1 + 104); c.closePath(); c.fill();
      c.strokeStyle = BLUE_L; c.lineWidth = 2.5; c.beginPath(); c.arc(x - 18 * s, y1 + 74, 10, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(x - 6 * s, y1 + 30); c.quadraticCurveTo(x - 2 * s, y1 + 56, x - 16 * s, y1 + 64); c.stroke();
    }
  }, { t: 5.9, d: 1.1, reveal: 'fade' });
}

// ================================================================ the window grille
function grille(p) {
  const x0 = 150, x1 = 420, y0 = 1300, y1 = 1580, xm = (x0 + x1) / 2, rad = (x1 - x0) / 2;
  p.group('works', { x: x0 - 40, y: y0 - 40, w: x1 - x0 + 80, h: y1 - y0 + 80 }, (c) => {
    // the opening, with blue shutters folded back
    c.fillStyle = '#16294a'; c.beginPath(); c.moveTo(x0, y1); c.lineTo(x0, y0 + rad); c.arc(xm, y0 + rad, rad, Math.PI, 0); c.lineTo(x1, y1); c.fill();
    c.fillStyle = BLUE;
    for (const s of [-1, 1]) {
      const sx = s < 0 ? x0 - 36 : x1 + 4;
      c.fillRect(sx, y0 + rad - 10, 32, y1 - y0 - rad + 10);
      c.fillStyle = BLUE_D; for (let y = y0 + rad; y < y1 - 6; y += 12) c.fillRect(sx + 4, y, 24, 4); c.fillStyle = BLUE;
    }
    // the sill
    c.fillStyle = STONE; c.fillRect(x0 - 44, y1, x1 - x0 + 88, 16); c.fillStyle = STONE_D; c.fillRect(x0 - 44, y1 + 12, x1 - x0 + 88, 4);
  }, { t: 5.6, d: 0.8, reveal: 'fall' });
  // the ironwork, drawn with a pen: bars, and pairs of S-curls between them
  const bars = [], curls = [];
  for (let k = 1; k < 6; k++) { const x = x0 + k * (x1 - x0) / 6; const top = y0 + rad - Math.sqrt(Math.max(0, rad * rad - (x - xm) ** 2)); bars.push([[x, y1], [x, top]]); }
  bars.push([[x0, y1 - 60], [x1, y1 - 60]]); bars.push([[x0, y0 + rad + 10], [x1, y0 + rad + 10]]);
  for (let k = 0; k < 6; k++) {
    const cx = x0 + (k + 0.5) * (x1 - x0) / 6, w = (x1 - x0) / 12 - 3;
    for (const yc of [y0 + rad + 60, y1 - 110]) {
      const pts = [];
      for (let i = 0; i <= 24; i++) { const t = i / 24, a = t * Math.PI * 2; pts.push([cx + Math.sin(a) * w * (t < 0.5 ? 1 : -1) * Math.sin(t * Math.PI), yc - 40 + t * 80]); }
      curls.push(pts);
    }
  }
  // the fan in the arch
  for (let k = 1; k < 6; k++) { const a = Math.PI + (k / 6) * Math.PI; curls.push([[xm, y0 + rad + 10], [xm + Math.cos(a) * (rad - 8), y0 + rad + Math.sin(a) * (rad - 8)]]); }
  p.strokes('works', bars, BLUE, 6, { t: 6.4, d: 0.9, reveal: 'rise' });
  p.strokes('works', curls, BLUE_L, 3.2, { t: 6.9, d: 0.9, reveal: 'rise' });
  p.group('shade', { x: x0 - 60, y: y0 - 20, w: x1 - x0 + 80, h: y1 - y0 + 60 }, (c) => {
    c.fillStyle = SHADOW; c.fillRect(x0 - 50, y0 + rad, 14, y1 - y0 - rad); c.fillRect(x0 - 50, y1 + 16, x1 - x0 + 80, 12);
  }, { t: 7.4, d: 0.6, reveal: 'fade' });
}

// ================================================================ the bench, pots and cat
function geranium(c, x, y, s, col, rr) {
  // a terracotta pot and a round head of leaves and red flowers
  c.fillStyle = TERRA; poly(c, [[x - 18 * s, y - 34 * s], [x + 18 * s, y - 34 * s], [x + 13 * s, y], [x - 13 * s, y]]); c.fill();
  c.fillStyle = TERRA_D; c.fillRect(x - 20 * s, y - 38 * s, 40 * s, 7 * s);
  c.fillStyle = LEAF_D; for (const [dx, dy, r0] of rr.leaves) { c.beginPath(); c.arc(x + dx * s, y - 40 * s + dy * s, r0 * s, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = LEAF_L; for (const [dx, dy, r0] of rr.leaves) { c.beginPath(); c.arc(x + dx * s - 2, y - 42 * s + dy * s, r0 * 0.6 * s, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = col; for (const [dx, dy] of rr.flowers) { c.beginPath(); c.arc(x + dx * s, y - 50 * s + dy * s, 5 * s, 0, Math.PI * 2); c.fill(); }
}
function plantParts(r) {
  const leaves = [], flowers = [];
  for (let i = 0; i < 9; i++) leaves.push([r.range(-22, 22), r.range(-26, 0), r.range(8, 12)]);
  for (let i = 0; i < 8; i++) flowers.push([r.range(-20, 20), r.range(-22, 0)]);
  return { leaves, flowers };
}
function bench(p, r) {
  const x0 = 90, x1 = 500, y0 = 1700, y1 = STREET;
  p.group('near', { x: x0 - 10, y: y0 - 20, w: x1 - x0 + 30, h: y1 - y0 + 24 }, (c) => {
    // the whitewashed seat and its tiled front
    c.fillStyle = STONE_D; c.fillRect(x0 - 6, y0 - 4, x1 - x0 + 12, 30);
    c.fillStyle = STONE_L; c.beginPath(); c.roundRect(x0 - 8, y0 - 6, x1 - x0 + 16, 22, 6); c.fill();
    c.strokeStyle = WALL_D; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 - 6, y0 + 16); c.lineTo(x1 + 6, y0 + 16); c.stroke();
    const ts = 30;
    for (let k = 0; x0 + k * ts < x1; k++) {
      const tx = x0 + k * ts;
      for (let j = 0; j < 3; j++) {
        const ty = y0 + 26 + j * ts;
        if (ty + ts > y1 + 2) break;
        c.fillStyle = '#f2ecd8'; c.fillRect(tx, ty, ts - 1, ts - 1);
        // a Nabeul tile: a blue lozenge with yellow and green in the corners
        c.fillStyle = BLUE; poly(c, [[tx + ts / 2, ty + 3], [tx + ts - 3, ty + ts / 2], [tx + ts / 2, ty + ts - 3], [tx + 3, ty + ts / 2]]); c.fill();
        c.fillStyle = YEL; c.beginPath(); c.arc(tx + ts / 2, ty + ts / 2, 4.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = GREEN; for (const [a, b] of [[0, 0], [ts, 0], [0, ts], [ts, ts]]) { c.beginPath(); c.arc(tx + a, ty + b, 5, 0, Math.PI * 2); c.fill(); }
      }
    }
    c.strokeStyle = '#b8b2a0'; c.lineWidth = 1; c.strokeRect(x0, y0 + 26, x1 - x0, y1 - y0 - 26);
  }, { t: 7.0, d: 0.9, reveal: 'rise' });
  // the bench's shadow on the wall and the street
  p.group('shade', { x: x0 - 60, y: y0 - 10, w: x1 - x0 + 80, h: y1 - y0 + 60 }, (c) => {
    c.fillStyle = SHADOW; poly(c, [[x0, y0 + 2], [x0 - 40, y0 + 40], [x0 - 40, y1], [x0, y1]]); c.fill();
  }, { t: 8.0, d: 0.6, reveal: 'fade' });
  // pots on the bench and at the foot of the door
  const pots = [[150, y0, 1, '#e0322b'], [250, y0, 0.85, MAG_L], [400, y0, 1.1, '#e0322b'], [1010, STREET, 1.25, '#f06a2a'], [80, STREET + 40, 1.3, '#e0322b'], [1190, 1608, 1.3, '#e0322b'], [1530, 1608, 1.0, MAG_L]];
  pots.forEach(([x, y, s, col], i) => {
    const parts = plantParts(r);
    p.group('near', { x: x - 40 * s, y: y - 90 * s, w: 80 * s, h: 94 * s }, (c) => geranium(c, x, y, s, col, parts), { t: 7.6 + i * 0.18, d: 0.6, reveal: 'drop' });
  });
}

// ================================================================ the street
function street(p, r) {
  const y0 = STREET, y1 = B;
  // cobbles laid in courses, a gutter under the wall
  const stones = [];
  for (let y = y0 + 6, row = 0; y < y1; row++) {
    const h = 26 + row * 6;
    for (let x = M - 40 + (row % 2) * 30; x < R + 40;) { const w = r.range(48, 80) + row * 6; stones.push([x, y, w - 4, h - 4, r.range(0.9, 1.06)]); x += w; }
    y += h;
  }
  p.group('near', { x: M, y: y0 - 4, w: R - M, h: y1 - y0 + 8 }, (c) => {
    c.fillStyle = '#9f9586'; c.fillRect(M, y0, R - M, y1 - y0);
    for (const [x, y, w, h, k] of stones) {
      c.fillStyle = shade('#d4cab8', k); c.beginPath(); c.roundRect(x, y, w, h, 8); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + 6, y + 3, w - 16, 3);
    }
    c.fillStyle = 'rgba(60,70,120,.28)'; c.fillRect(M, y0, R - M, 12);
  }, { t: 2.8, d: 1.0, reveal: 'wipe' });
}

// ================================================================ the parapet over the view
function parapet(p, r) {
  const y0 = 1610, y1 = STREET;
  p.group('near', { x: CX - 6, y: y0 - 70, w: R - CX + 12, h: y1 - y0 + 74 }, (c) => {
    c.fillStyle = WHITE; c.fillRect(CX, y0, R - CX, y1 - y0);
    c.fillStyle = WALL_S; c.fillRect(CX, y0, R - CX, 10);
    c.fillStyle = WHITE; c.beginPath(); c.roundRect(CX - 4, y0 - 14, R - CX + 8, 20, 9); c.fill();
    // a blue rail on posts along it
    c.fillStyle = BLUE; c.fillRect(CX, y0 - 66, R - CX, 9);
    for (let x = CX + 14; x < R; x += 36) {
      c.fillStyle = BLUE; c.fillRect(x, y0 - 60, 6, 48);
      c.fillStyle = BLUE_D; c.fillRect(x + 4, y0 - 60, 2, 48);
    }
    // the shadow of the bougainvillea on it
    // a band of tiles along its foot
    for (let x = CX, k = 0; x < R; x += 30, k++) {
      c.fillStyle = k % 2 ? BLUE : '#f2ecd8'; c.fillRect(x, y1 - 34, 29, 29);
      c.fillStyle = k % 2 ? YEL : BLUE; c.beginPath(); c.arc(x + 14.5, y1 - 19.5, 6, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = WALL_S; c.fillRect(CX, y1 - 38, R - CX, 4);
    // a niche with a little arched lamp shelf
    c.fillStyle = WALL_S; c.beginPath(); c.moveTo(1420, 1760); c.lineTo(1420, 1700); c.arc(1450, 1700, 30, Math.PI, 0); c.lineTo(1480, 1760); c.fill();
    c.fillStyle = BLUE_D; c.beginPath(); c.moveTo(1426, 1760); c.lineTo(1426, 1702); c.arc(1450, 1702, 24, Math.PI, 0); c.lineTo(1474, 1760); c.fill();
  }, { t: 6.2, d: 1.0, reveal: 'rise' });
}

// ================================================================ the bougainvillea
function bougainvillea(p, r) {
  // the trunk climbs the corner from the street, then branches spread along the parapet
  const trunk = [[1040, STREET], [1030, 1650], [1052, 1480], [1036, 1260], [1056, 1020], [1040, 800], [1060, 560], [1030, 380], [1000, 300]];
  const branches = [trunk];
  const ends = [[700, 250], [780, 380], [880, 230], [1200, 260], [1300, 420], [1180, 640], [1250, 860], [1140, 1100], [940, 560], [1120, 360]];
  for (const [ex, ey] of ends) {
    const k = 3 + r.int(0, 4), [sx, sy] = trunk[k];
    const pts = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([lerp(sx, ex, t) + Math.sin(t * Math.PI) * r.range(-40, 40), lerp(sy, ey, t) - Math.sin(t * Math.PI) * 50]); }
    branches.push(pts);
  }
  p.pen('vine', trunk, '#6a4a32', 11, { t: 6.0, d: 1.2 });
  branches.slice(1).forEach((b, i) => p.pen('vine', b, '#6a4a32', 4.5, { t: 6.5 + i * 0.07, d: 0.9 }));

  // clusters of bracts along the branches and draping down the corner
  const clusters = [];
  for (const b of branches) {
    for (let i = 1; i < b.length; i++) {
      for (let k = 0; k < 4; k++) {
        const t = r(), x = lerp(b[i - 1][0], b[i][0], t) + r.gauss() * 30, y = lerp(b[i - 1][1], b[i][1], t) + r.gauss() * 26;
        if (y > 1500) continue;
        clusters.push([x, y]);
      }
    }
  }
  // a curtain hanging down from the parapet top across the corner
  for (let i = 0; i < 70; i++) { const x = r.range(860, 1280), y = 300 + r() ** 1.6 * (1200 - 600 * Math.abs(x - 1070) / 220); clusters.push([x, Math.min(y, 1400)]); }
  clusters.sort((a, b) => a[1] - b[1]);
  const leaves = [], bracts = [];
  for (const [x, y] of clusters) {
    for (let k = 0; k < 4; k++) leaves.push([x + r.gauss() * 26, y + r.gauss() * 22, r.range(8, 15), r.range(4, 7), r() * Math.PI, r.chance(0.5) ? LEAF : r.chance(0.5) ? LEAF_L : LEAF_D]);
    for (let k = 0; k < 6; k++) bracts.push([x + r.gauss() * 20, y + r.gauss() * 16, r.range(6, 10), r() * Math.PI * 2, r.pick([MAG, MAG, MAG_L, MAG_D, MAG_L, MAG_P])]);
  }
  // in bands from the top down: leaves first, then the flowers popping over them, then
  // their shadow on the wall. Each band's shapes are built once, a path per color.
  const N = 12;
  const band = (arr, i) => arr.filter(([, y]) => y >= 200 + (i / N) * 1260 && y < 200 + ((i + 1) / N) * 1260 + (i === N - 1 ? 300 : 0));
  const byColor = (arr, add) => {
    const m = new Map();
    for (const it of arr) { const col = it[it.length - 1]; if (!m.has(col)) m.set(col, new Path2D()); add(m.get(col), it); }
    return [...m];
  };
  const leafPath = (P, [x, y, a, b, rot]) => { P.moveTo(x + a * Math.cos(rot), y + a * Math.sin(rot)); P.ellipse(x, y, a, b, rot, 0, Math.PI * 2); };
  const bractPath = (P, [x, y, s, rot]) => {
    // a bract: three papery petals round a pale center
    for (let k = 0; k < 3; k++) { const a = rot + k * 2.094, ex = x + Math.cos(a) * s * 0.6, ey = y + Math.sin(a) * s * 0.6; P.moveTo(ex + s * 0.7 * Math.cos(a), ey + s * 0.7 * Math.sin(a)); P.ellipse(ex, ey, s * 0.7, s * 0.45, a, 0, Math.PI * 2); }
  };
  for (let i = 0; i < N; i++) {
    const lv = band(leaves, i), br = band(bracts, i);
    const y0 = 160 + (i / N) * 1260;
    const bx = { x: 620, y: y0 - 60, w: 720, h: 1260 / N + 160 };
    const L = byColor(lv, leafPath), Bp = byColor(br, bractPath);
    const eye = new Path2D(); for (const [x, y] of br) { eye.moveTo(x + 1.6, y); eye.arc(x, y, 1.6, 0, Math.PI * 2); }
    const sh = new Path2D();
    for (const [x, y, a, b, rot] of lv) { if (x - 34 < CX - 24 && y + 46 > TOP + 30) { sh.moveTo(x - 34 + a * Math.cos(rot), y + 46 + a * Math.sin(rot)); sh.ellipse(x - 34, y + 46, a, b, rot, 0, Math.PI * 2); } }
    for (const [x, y, s] of br) { if (x - 34 < CX - 24 && y + 46 > TOP + 30) { sh.moveTo(x - 34 + s, y + 46); sh.arc(x - 34, y + 46, s, 0, Math.PI * 2); } }
    p.group('vine', bx, (c) => { for (const [col, P] of L) { c.fillStyle = col; c.fill(P); } }, { t: 6.8 + i * 0.12, d: 0.6, reveal: 'fade' });
    p.group('bloom', bx, (c) => { for (const [col, P] of Bp) { c.fillStyle = col; c.fill(P); } c.fillStyle = '#fbe9a8'; c.fill(eye); }, { t: 7.4 + i * 0.13, d: 0.7, reveal: 'pop' });
    p.group('shade', { x: 560, y: y0 - 40, w: CX - 560, h: 1260 / N + 200 }, (c) => {
      c.fillStyle = SHADOW; c.fill(sh);
    }, { t: 8.5 + i * 0.08, d: 0.5, reveal: 'fade' });
  }
}

// ================================================================ the plaque with the name
function plaque(p) {
  const ts = 56; // a tile
  const nx = Math.round((TX1 - TX0) / ts), ny = Math.round((TY1 - TY0) / ts);
  const x1 = TX0 + nx * ts, y1 = TY0 + ny * ts, cx = (TX0 + x1) / 2;
  // its shadow on the wall
  p.group('shade', { x: TX0 - 30, y: TY0, w: x1 - TX0 + 40, h: y1 - TY0 + 40 }, (c) => {
    c.fillStyle = SHADOW; poly(c, [[TX0, TY0 + 6], [TX0 - 18, TY0 + 24], [TX0 - 18, y1 + 18], [x1 - 18, y1 + 18], [x1, y1]]); c.fill();
  }, { t: 9.6, d: 0.6, reveal: 'fade' });
  // glazed tiles, white in the middle, a blue and yellow border round it
  p.group('title', { x: TX0 - 4, y: TY0 - 4, w: x1 - TX0 + 8, h: y1 - TY0 + 8 }, (c) => {
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x = TX0 + i * ts, y = TY0 + j * ts, edge = i === 0 || j === 0 || i === nx - 1 || j === ny - 1;
      c.fillStyle = '#fbf8ef'; c.fillRect(x, y, ts, ts);
      if (edge) {
        c.fillStyle = BLUE; c.fillRect(x + 3, y + 3, ts - 6, ts - 6);
        c.fillStyle = '#fbf8ef'; c.beginPath(); c.arc(x + ts / 2, y + ts / 2, 22, 0, Math.PI * 2); c.fill();
        c.fillStyle = YEL; c.beginPath();
        for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, rr = k % 2 ? 9 : 18; c.lineTo(x + ts / 2 + Math.cos(a) * rr, y + ts / 2 + Math.sin(a) * rr); }
        c.closePath(); c.fill();
        c.fillStyle = GREEN; c.beginPath(); c.arc(x + ts / 2, y + ts / 2, 5, 0, Math.PI * 2); c.fill();
      }
      // the glaze's sheen and the joints
      c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 6, y + 5, ts * 0.4, 3);
    }
    c.strokeStyle = '#c9c4b4'; c.lineWidth = 1.4; c.beginPath();
    for (let i = 0; i <= nx; i++) { c.moveTo(TX0 + i * ts, TY0); c.lineTo(TX0 + i * ts, y1); }
    for (let j = 0; j <= ny; j++) { c.moveTo(TX0, TY0 + j * ts); c.lineTo(x1, TY0 + j * ts); }
    c.stroke();
  }, { t: 9.3, d: 1.1, reveal: 'iris', ease: 'inOut' });
  // تونس, painted whole in cobalt, wiped in from the right as it is read
  const ay = TY0 + 262;
  p.mark('title', {
    t: 10.5, d: 1.5, reveal: 'wipeL', ease: 'inOut', box: { x: TX0 + ts - 10, y: TY0 + 30, w: x1 - TX0 - 2 * ts + 20, h: 300 },
    draw: (c) => {
      c.font = '800 214px "Tajawal", sans-serif'; c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillStyle = BLUE_P; c.fillText('تونس', cx + 4, ay + 4);
      c.fillStyle = BLUE; c.fillText('تونس', cx, ay);
      c.direction = 'ltr';
    },
  });
  p.type('title', 'TUNIS', cx, y1 - ts - 22, {
    family: '"Tajawal", sans-serif', weight: 500, size: 50, color: BLUE_D, align: 'center', track: 0.6, t: 11.8, gap: 0.12, d: 0.6,
  });
  p.type('title', 'SIDI BOU SAID · GOLFE DE TUNIS', W / 2, H - 12, {
    family: '"Tajawal", sans-serif', weight: 500, size: 20, color: BLUE_D, align: 'center', track: 0.42, t: 12.4, gap: 0.03, d: 0.4, reveal: 'fade',
  });
}

// ================================================================ what moves
function life(p, r) {
  // sailboats crossing the gulf, slowly, behind the village
  const boats = [[1150, 1060, 1.0, 6], [1420, 1100, 1.3, -5], [1300, 1030, 0.7, 4], [1500, 1170, 1.5, -7]];
  p.live('sea', {
    t: 9.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const k = time - 9;
      for (const [x0, y, s, v] of boats) {
        const span = R - CX + 80, x = CX - 40 + ((((x0 - CX + 40) + k * v) % span) + span) % span;
        c.fillStyle = '#f6f8fb';
        c.beginPath(); c.moveTo(x, y - 30 * s); c.lineTo(x, y - 4 * s); c.lineTo(x + 18 * s, y - 4 * s); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(x - 2 * s, y - 24 * s); c.lineTo(x - 2 * s, y - 4 * s); c.lineTo(x - 12 * s, y - 4 * s); c.closePath(); c.fill();
        c.fillStyle = BLUE_D; c.fillRect(x - 12 * s, y - 3 * s, 30 * s, 4 * s);
      }
    },
  });
  // sun flecks on the water, winking
  const fl = [];
  for (let i = 0; i < 46; i++) fl.push([r.range(CX, R), HZ + 8 + r() ** 1.5 * 200, r() * 7, r.range(6, 18)]);
  p.live('sea', {
    t: 9.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = '#ffffff';
      for (const [x, y, ph, L] of fl) { const a = Math.sin(time * 2.2 + ph * 3); if (a < 0.4) continue; c.globalAlpha = a; c.fillRect(x, y, L, 2); }
      c.globalAlpha = 1;
    },
  });
  // swallows looping over the roofs, bracts drifting down, and the cat's tail
  const birds = [];
  for (let i = 0; i < 7; i++) birds.push([r.range(200, 1450), r.range(120, 300), r.range(50, 140), r.range(0.3, 0.6) * (r.chance(0.5) ? 1 : -1), r() * 7]);
  const petals = [];
  for (let i = 0; i < 9; i++) petals.push([r.range(820, 1240), r.range(300, 900), r.range(18, 30), r() * 7, r.pick([MAG, MAG_L, MAG_D])]);
  p.live('air', {
    t: 9.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineCap = 'round'; c.lineWidth = 2.2;
      for (const [x0, y0, rx, w, ph] of birds) {
        const a = time * w + ph, x = x0 + Math.cos(a) * rx, y = y0 + Math.sin(a * 1.7) * rx * 0.25, f = Math.sin(time * 9 + ph) * 3;
        c.beginPath(); c.moveTo(x - 11, y - 3 - f); c.quadraticCurveTo(x - 4, y - 2, x, y + 2); c.quadraticCurveTo(x + 4, y - 2, x + 11, y - 3 - f); c.stroke();
      }
      // falling bracts: each falls for a while from its own height, swaying, and starts again
      for (const [x0, y0, v, ph, col] of petals) {
        const k = ((time * v + ph * 60) % 700), x = x0 + Math.sin(time * 1.3 + ph) * 22 - k * 0.12, y = y0 + k;
        if (y > 1800) continue;
        c.globalAlpha = Math.min(1, (700 - k) / 120);
        c.fillStyle = col; c.beginPath(); c.ellipse(x, y, 7, 4, time * 2 + ph, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
    },
  });
  // the cat on the parapet, its tail swinging
  const kx = 1330, ky = 1596;
  p.group('near', { x: kx - 40, y: ky - 90, w: 90, h: 100 }, (c) => cat(c, kx, ky), { t: 9.0, d: 0.6, reveal: 'drop' });
  p.live('air', {
    t: 9.2, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      const sw = Math.sin(time * 1.6) * 0.5 + Math.sin(time * 4.1) * 0.12;
      c.strokeStyle = '#3a3330'; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(kx + 18, ky - 6); c.quadraticCurveTo(kx + 40, ky + 4, kx + 42 + Math.sin(sw) * 18, ky + 26 + Math.cos(sw) * 6); c.stroke();
    },
  });
}
function cat(c, x, y) {
  // a seated cat from behind, in profile against the sea
  c.fillStyle = '#3a3330';
  c.beginPath(); c.ellipse(x, y - 22, 20, 26, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(x - 6, y - 54, 13, 0, Math.PI * 2); c.fill();
  poly(c, [[x - 17, y - 60], [x - 15, y - 76], [x - 7, y - 64]]); c.fill();
  poly(c, [[x - 2, y - 64], [x + 4, y - 76], [x + 7, y - 58]]); c.fill();
  c.fillStyle = '#f2b84b'; c.beginPath(); c.arc(x - 12, y - 56, 2.2, 0, Math.PI * 2); c.fill();
}

