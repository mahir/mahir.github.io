// Lima: a chicha poster. Fluorescent pink, orange, green and yellow on black,
// screen-printed with split-fountain fades and stacked blocks of hand-set type,
// as if the city were the night's headline act. Two pictures sit in the stack:
// the Plaza Mayor (the cathedral's twin towers, the carved wooden balconies of the
// Archbishop's Palace and the colonial houses, the bronze fountain, palms) as
// black shapes against a fluorescent dusk; and the cliffs of Miraflores in bands
// over the Pacific, with the lighthouse, paragliders and surfers.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly } from '../kit.js';

const BLACK = '#0d0c10', PINK = '#ff2e93', ORANGE = '#ff7417', YELLOW = '#ffec1f', GREEN = '#36ef55', BLUE = '#27b3ff', WHITE = '#fff6ec';
const FACE = '"Titan One", sans-serif';

export const city = {
  id: 'lima', name: 'Lima', wall: '#241016',
  alt: 'A chicha poster for Lima in fluorescent pink, orange, green and yellow on black: stacked bands of hand-set type around a huge fading LIMA, a picture of the Plaza Mayor with the cathedral\'s twin towers, the Archbishop\'s Palace\'s carved wooden balconies, colonial houses, the bronze fountain and palms against a fluorescent dusk, and a picture of the striped cliffs of Miraflores with the lighthouse, paragliders, surfers and the Pacific under a setting sun',
  google: 'family=Titan+One',
  fonts: [['400 100px "Titan One"', 'LIMA LA CIUDAD DE LOS REYES ¡DIRECTO DESDE EL PACÍFICO! PLAZA MAYOR MIRAFLORES COSTA VERDE ENTRADA LIBRE TODOS LOS DÍAS 1535 ¡NO FALTES! PERÚ · '],
  ],
  build,
};

const M = 34;                         // the outer margin
const P1 = { x: 70, y: 880, w: W - 140, h: 450 };   // the Plaza Mayor
const P2 = { x: 70, y: 1352, w: W - 140, h: 350 };  // Miraflores

function build() {
  const p = new Plate({ paper: BLACK, seed: 1535 });
  const r = p.r;
  p.stack('frame', 'sky', 'plaza', 'plazaFront', 'coast', 'sea', 'type', 'live', 'title');
  frame(p);
  topRows(p);
  plazaSky(p, r);
  plaza(p, r);
  coast(p, r);
  bottomRows(p, r);
  sparks(p, r);
  life(p, r);
  title(p, r);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

// ================================================================ helpers
let mc = null;
function measure(text, size) {
  if (!mc) mc = document.createElement('canvas').getContext('2d');
  mc.font = `normal 400 ${size}px ${FACE}`;
  return mc.measureText(text).width;
}
// a size that sets the text to a width, no larger than size
function fit(text, size, w, track = 0) {
  const tw = measure(text, size) + track * size * (text.length - 1);
  return tw > w ? size * w / tw : size;
}
// a line of type set letter by letter with tracking, as one drawing
function setLine(c, text, x, y, size, fill, track = 0, align = 'center') {
  c.font = `normal 400 ${size}px ${FACE}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const tr = track * size, total = c.measureText(text).width + tr * (text.length - 1);
  let gx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  c.fillStyle = fill;
  for (let i = 0; i < text.length; i++) {
    const w = c.measureText(text.slice(0, i + 1)).width - c.measureText(text.slice(0, i)).width;
    c.fillText(text[i], gx, y);
    gx += w + tr;
  }
}
// a vertical fade between inks, as a split-fountain roller leaves it
function fade(c, y0, y1, cols) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col));
  return g;
}
function fadeX(c, x0, x1, cols) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col));
  return g;
}
function starPts(x, y, R, rr, n = 5, rot = -Math.PI / 2) {
  const pts = [];
  for (let k = 0; k < n * 2; k++) { const a = rot + (k / (n * 2)) * Math.PI * 2, d = k % 2 ? rr : R; pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]); }
  return pts;
}
function fillPoly(c, pts, fill) { poly(c, pts); c.fillStyle = fill; c.fill(); }
function rect(c, x, y, w, h, fill) { c.fillStyle = fill; c.fillRect(x, y, w, h); }
function arch(c, x, y, w, h) {
  c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath();
}

// ================================================================ the frame
function frame(p) {
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = PINK; c.lineWidth = 12; c.strokeRect(M, M, W - 2 * M, H - 2 * M);
  }, { t: 0.1, d: 0.9, reveal: 'iris', ease: 'inOut' });
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = GREEN; c.lineWidth = 4; c.strokeRect(M + 16, M + 16, W - 2 * M - 32, H - 2 * M - 32);
    // corner stars
    for (const [x, y] of [[M + 16, M + 16], [W - M - 16, M + 16], [M + 16, H - M - 16], [W - M - 16, H - M - 16]]) { fillPoly(c, starPts(x, y, 26, 11), YELLOW); }
  }, { t: 0.5, d: 0.8, reveal: 'fade' });
}

// ================================================================ the type blocks above the name
function topRows(p) {
  // a pink block, black letters
  const t1 = 'LA CIUDAD DE LOS REYES', s1 = fit(t1, 70, 1180, 0.06);
  p.group('type', { x: 60, y: 70, w: W - 120, h: 110 }, (c) => {
    c.fillStyle = fadeX(c, 70, W - 70, [PINK, '#ff4f7a', PINK]); c.fillRect(70, 76, W - 140, 98);
    setLine(c, t1, W / 2, 150, s1, BLACK, 0.06);
    for (const x of [130, W - 130]) fillPoly(c, starPts(x, 125, 34, 14), BLACK);
  }, { t: 0.7, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // green letters straight on the black, fading to yellow
  const t2 = '¡DIRECTO DESDE EL PACÍFICO!', s2 = fit(t2, 64, 1300, 0.04);
  p.group('type', { x: 60, y: 190, w: W - 120, h: 100 }, (c) => {
    c.save(); c.fillStyle = fade(c, 210, 268, [YELLOW, GREEN]);
    setLine(c, t2, W / 2, 266, s2, c.fillStyle, 0.04); c.restore();
  }, { t: 1.1, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // under the name: an orange block that lists the sights
  const t3 = 'PLAZA MAYOR · MIRAFLORES · COSTA VERDE', s3 = fit(t3, 50, 1360, 0.04);
  p.group('type', { x: 60, y: 790, w: W - 120, h: 84 }, (c) => {
    c.fillStyle = fadeX(c, 70, W - 70, [ORANGE, YELLOW, ORANGE]); c.fillRect(70, 798, W - 140, 70);
    setLine(c, t3, W / 2, 852, s3, BLACK, 0.04);
  }, { t: 9.0, d: 0.9, reveal: 'wipeL', ease: 'inOut' });
}

// ================================================================ the Plaza Mayor
function plazaSky(p, r) {
  const { x, y, w, h } = P1;
  // the dusk, a fade of three inks, cut in bands as a screen prints it
  p.group('sky', { x: x - 4, y: y - 4, w: w + 8, h: h + 8 }, (c) => {
    c.fillStyle = fade(c, y, y + h * 0.78, [PINK, ORANGE, YELLOW]); c.fillRect(x, y, w, h);
    c.fillStyle = BLACK;
    for (let k = 0; k < 9; k++) { const yy = y + h * 0.42 + k * k * 2.6 + k * 8; c.fillRect(x, yy, w, 1.5 + k * 0.6); }
  }, { t: 1.5, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  p.group('frame', { x: x - 12, y: y - 12, w: w + 24, h: h + 24 }, (c) => {
    c.strokeStyle = YELLOW; c.lineWidth = 7; c.strokeRect(x - 6, y - 6, w + 12, h + 12);
  }, { t: 1.3, d: 0.8, reveal: 'iris' });
  // a big low sun behind the cathedral (which stands on the plaza's east side)
  p.group('sky', { x: 700, y: 900, w: 200, h: 200 }, (c) => {
    c.fillStyle = YELLOW; c.beginPath(); c.arc(800, 1010, 86, 0, Math.PI * 2); c.fill();
    c.fillStyle = PINK; for (let k = 0; k < 5; k++) c.fillRect(700, 1000 + k * 16, 200, 3 + k * 1.5);
  }, { t: 2.0, d: 0.8, reveal: 'iris', ease: 'soft' });
  // birds over the square
  const birds = [];
  for (let i = 0; i < 14; i++) birds.push([r.range(140, 1450), r.range(910, 1000), r.range(6, 11)]);
  p.group('sky', { x: P1.x, y: 890, w: P1.w, h: 130 }, (c) => {
    c.strokeStyle = BLACK; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
    for (const [bx, by, s] of birds) { c.moveTo(bx - s, by - s * 0.4); c.quadraticCurveTo(bx - s * 0.4, by - s * 0.7, bx, by); c.quadraticCurveTo(bx + s * 0.4, by - s * 0.7, bx + s, by - s * 0.4); }
    c.stroke();
  }, { t: 5.8, d: 0.6, reveal: 'fade' });
}
// an enclosed wooden balcony: a box on brackets, its sides latticed
function balcony(c, x, y, w, h, col, lat) {
  rect(c, x - 6, y - 10, w + 12, 12, BLACK);
  rect(c, x, y, w, h, BLACK);
  c.strokeStyle = col; c.lineWidth = 3; c.strokeRect(x + 4, y + 4, w - 8, h - 8);
  // the panels of lattice
  const n = Math.max(2, Math.round(w / 34));
  c.lineWidth = 1.6; c.strokeStyle = lat; c.beginPath();
  for (let k = 0; k < n; k++) {
    const px = x + 8 + k * ((w - 16) / n), pw = (w - 16) / n - 6;
    c.rect(px, y + 10, pw, h * 0.52);
    for (let d = -h; d < pw; d += 7) { c.moveTo(px + Math.max(0, d), y + 10 + Math.max(0, -d)); c.lineTo(px + Math.min(pw, d + h * 0.52), y + 10 + Math.min(h * 0.52, h * 0.52 - (d + h * 0.52 - Math.min(pw, d + h * 0.52)))); }
  }
  c.stroke();
  c.strokeStyle = col; c.lineWidth = 2; c.beginPath();
  for (let k = 0; k < n; k++) { const px = x + 8 + k * ((w - 16) / n), pw = (w - 16) / n - 6; c.rect(px, y + h * 0.66, pw, h * 0.22); }
  c.stroke();
  // the brackets underneath
  c.fillStyle = BLACK; c.strokeStyle = col; c.lineWidth = 2;
  for (let k = 0; k <= n; k++) { const bx = x + k * (w / n); c.beginPath(); c.moveTo(bx - 6, y + h); c.lineTo(bx + 6, y + h); c.lineTo(bx, y + h + 22); c.closePath(); c.fill(); c.stroke(); }
}
function plaza(p, r) {
  const base = P1.y + P1.h - 46; // the square's pavement
  // colonial houses with balconies, on the right of the cathedral
  const RX = 1036, RW = P1.x + P1.w - RX;
  p.group('plaza', { x: RX, y: 1060, w: RW, h: base - 1060 + 4 }, (c) => {
    rect(c, RX, 1110, RW, base - 1110, BLACK);
    rect(c, RX, 1098, RW, 14, BLACK);
    c.fillStyle = YELLOW; c.beginPath();
    for (let x = RX + 30; x < RX + RW - 30; x += 60) { arch(c, x, 1220, 26, 46); }
    c.fill();
    c.strokeStyle = ORANGE; c.lineWidth = 3; c.beginPath(); c.moveTo(RX, 1112); c.lineTo(RX + RW, 1112); c.moveTo(RX, 1290); c.lineTo(RX + RW, 1290); c.stroke();
  }, { t: 2.3, d: 0.9, reveal: 'rise' });
  p.group('plaza', { x: RX, y: 1110, w: RW, h: 120 }, (c) => {
    balcony(c, RX + 28, 1130, 190, 62, GREEN, PINK);
    balcony(c, RX + 262, 1130, 210, 62, ORANGE, GREEN);
  }, { t: 3.6, d: 0.7, reveal: 'drop', dy: 20 });
  // the cathedral: two towers with arched belfries and lanterns, the facade between
  const CX = 800;
  const tower = (tx) => {
    const pts = [[tx - 54, base], [tx - 54, 1080], [tx - 44, 1080], [tx - 44, 1030], [tx - 36, 1030], [tx - 36, 976], [tx - 22, 976], [tx - 22, 954],
      [tx - 10, 954], [tx - 10, 936], [tx, 922], [tx + 10, 936], [tx + 10, 954], [tx + 22, 954], [tx + 22, 976], [tx + 36, 976], [tx + 36, 1030], [tx + 44, 1030], [tx + 44, 1080], [tx + 54, 1080], [tx + 54, base]];
    return pts;
  };
  const towers = [tower(CX - 170), tower(CX + 170)];
  p.group('plaza', { x: CX - 240, y: 900, w: 480, h: base - 896 }, (c) => {
    for (const tp of towers) fillPoly(c, tp, BLACK);
    // the facade, its crest stepping up to a point
    fillPoly(c, [[CX - 120, base], [CX - 120, 1090], [CX - 90, 1090], [CX - 70, 1060], [CX - 30, 1050], [CX, 1020], [CX + 30, 1050], [CX + 70, 1060], [CX + 90, 1090], [CX + 120, 1090], [CX + 120, base]], BLACK);
  }, { t: 2.6, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the cathedral's lines, drawn in yellow ink
  p.group('plaza', { x: CX - 240, y: 900, w: 480, h: base - 896 }, (c) => {
    c.strokeStyle = YELLOW; c.lineWidth = 3; c.beginPath();
    for (const tx of [CX - 170, CX + 170]) {
      // the belfry's arches, two stages
      arch(c, tx - 30, 990, 22, 36); arch(c, tx + 8, 990, 22, 36);
      arch(c, tx - 12, 1040, 24, 34);
      c.moveTo(tx - 44, 1080); c.lineTo(tx + 44, 1080); c.moveTo(tx - 36, 1030); c.lineTo(tx + 36, 1030);
      // pilasters down the tower
      c.moveTo(tx - 40, 1090); c.lineTo(tx - 40, base - 8); c.moveTo(tx + 40, 1090); c.lineTo(tx + 40, base - 8);
      arch(c, tx - 14, 1120, 28, 50); arch(c, tx - 14, 1200, 28, 50);
      c.moveTo(tx + 8, 936); c.arc(tx, 936, 8, 0, Math.PI * 2);
    }
    // the great portal and the carved bays over it
    arch(c, CX - 46, 1170, 92, base - 1170);
    arch(c, CX - 30, 1186, 60, base - 1186);
    c.moveTo(CX - 110, 1150); c.lineTo(CX + 110, 1150);
    for (const dx of [-100, -70, 70, 100]) { c.moveTo(CX + dx, 1100); c.lineTo(CX + dx, base - 8); }
    arch(c, CX - 22, 1090, 44, 50);
    c.moveTo(CX + 10, 1062); c.arc(CX, 1062, 10, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = PINK; c.beginPath(); arch(c, CX - 30, 1186, 60, base - 1186); c.fill();
  }, { t: 3.9, d: 1.2, reveal: 'wipe' });
  // the Archbishop's Palace on the cathedral's left, with its two great balconies
  const AX = P1.x, AW = 486;
  p.group('plaza', { x: AX - 4, y: 1050, w: AW + 8, h: base - 1046 }, (c) => {
    fillPoly(c, [[AX, base], [AX, 1100], [AX + 50, 1100], [AX + 50, 1070], [AX + AW - 20, 1070], [AX + AW - 20, 1100], [AX + AW, 1100], [AX + AW, base]], BLACK);
    c.strokeStyle = GREEN; c.lineWidth = 3; c.beginPath();
    c.moveTo(AX, 1102); c.lineTo(AX + AW, 1102); c.moveTo(AX + 50, 1080); c.lineTo(AX + AW - 20, 1080);
    arch(c, AX + 210, 1220, 60, base - 1220);
    for (const wx of [AX + 40, AX + 120, AX + 320, AX + 400]) c.rect(wx, 1236, 30, 44);
    c.stroke();
  }, { t: 3.2, d: 1.0, reveal: 'rise' });
  p.group('plaza', { x: AX, y: 1100, w: AW, h: 130 }, (c) => {
    balcony(c, AX + 24, 1124, 170, 78, ORANGE, YELLOW);
    balcony(c, AX + 236, 1124, 196, 78, PINK, GREEN);
  }, { t: 4.4, d: 0.8, reveal: 'drop', dy: 24 });
  // the pavement, in stripes
  p.group('plazaFront', { x: P1.x, y: base - 4, w: P1.w, h: P1.y + P1.h - base + 6 }, (c) => {
    rect(c, P1.x, base, P1.w, P1.y + P1.h - base, BLACK);
    c.fillStyle = ORANGE; for (let k = 0; k < 4; k++) c.fillRect(P1.x, base + 8 + k * 10, P1.w, 2 + k);
  }, { t: 4.8, d: 0.7, reveal: 'wipe' });
  // the bronze fountain in the middle of the square
  const fParts = [
    [[720, base + 2], [740, base - 24], [860, base - 24], [880, base + 2]],
    [[748, base - 24], [776, base - 74], [824, base - 74], [852, base - 24]],
    [[790, base - 74], [790, base - 116], [810, base - 116], [810, base - 74]],
    [[794, base - 128], [794, base - 160], [800, base - 172], [806, base - 160], [806, base - 128]],
  ];
  p.group('plazaFront', { x: 690, y: 1140, w: 220, h: base - 1130 }, (c) => {
    c.strokeStyle = PINK; c.lineWidth = 4; c.lineJoin = 'round';
    for (const fp of fParts) { fillPoly(c, fp, BLACK); c.stroke(); }
    c.beginPath(); c.ellipse(800, base - 122, 54, 10, 0, 0, Math.PI * 2); c.fillStyle = BLACK; c.fill(); c.stroke();
    c.strokeStyle = BLUE; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath();
    for (const s of [-1, 1]) { c.moveTo(800, base - 150); c.quadraticCurveTo(800 + s * 40, base - 172, 800 + s * 54, base - 126); c.moveTo(800 + s * 34, base - 116); c.quadraticCurveTo(800 + s * 60, base - 118, 800 + s * 74, base - 30); }
    c.stroke();
  }, { t: 5.2, d: 0.8, reveal: 'rise' });
  // palms in the square, their fronds in green ink
  for (const [x, i] of [[300, 0], [1300, 1], [560, 2], [1060, 3]]) {
    const h = i < 2 ? 260 : 200, top = base - h;
    const fronds = [];
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI + (k / 8) * Math.PI + r.range(-0.1, 0.1), L = r.range(70, 100);
      const pts = [];
      for (let s = 0; s <= 8; s++) { const t = s / 8; pts.push([x + Math.cos(a) * L * t, top + Math.sin(a) * L * t * 0.7 + L * 0.45 * t * t]); }
      fronds.push(pts);
    }
    p.group('plazaFront', { x: x - 120, y: top - 90, w: 240, h: h + 96 }, (c) => {
      c.fillStyle = BLACK; c.beginPath(); c.moveTo(x - 9, base); c.quadraticCurveTo(x + 6, base - h * 0.5, x - 3, top); c.lineTo(x + 5, top); c.quadraticCurveTo(x + 14, base - h * 0.5, x + 9, base); c.fill();
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = BLACK; c.lineWidth = 16; c.beginPath(); for (const f of fronds) { c.moveTo(f[0][0], f[0][1]); for (const q of f) c.lineTo(q[0], q[1]); } c.stroke();
      c.strokeStyle = GREEN; c.lineWidth = 2.5; c.beginPath();
      for (const f of fronds) for (let s = 2; s < 8; s++) { const [qx, qy] = f[s]; c.moveTo(qx, qy); c.lineTo(qx + (f[s + 1][0] - qx) * 0.5, qy + 12); c.moveTo(qx, qy); c.lineTo(qx + (f[s + 1][0] - qx) * 0.5, qy - 10); }
      c.stroke();
    }, { t: 5.5 + i * 0.15, d: 0.8, reveal: 'rise' });
  }
  // people crossing the square
  const folk = [];
  for (let i = 0; i < 22; i++) folk.push([r.range(P1.x + 20, P1.x + P1.w - 20), base + r.range(6, 30), r.range(0.8, 1.2), r.pick([PINK, GREEN, YELLOW, BLUE])]);
  p.group('plazaFront', { x: P1.x, y: base - 40, w: P1.w, h: 80 }, (c) => {
    for (const [x, y, s, col] of folk) {
      c.fillStyle = col; c.fillRect(x - 5 * s, y - 26 * s, 10 * s, 16 * s);
      c.fillStyle = BLACK; c.fillRect(x - 5 * s, y - 10 * s, 4 * s, 10 * s); c.fillRect(x + 1 * s, y - 10 * s, 4 * s, 10 * s);
      c.fillStyle = col; c.beginPath(); c.arc(x, y - 31 * s, 5 * s, 0, Math.PI * 2); c.fill();
    }
  }, { t: 6.0, d: 0.6, reveal: 'fade' });
}

// ================================================================ the cliffs of Miraflores
const cliffTop = (x) => (x < 1000 ? 1470 + Math.sin(x * 0.02) * 4 + (x > 860 ? (x - 860) * 0.9 : 0) : 1600);
function coast(p, r) {
  const { x, y, w, h } = P2;
  p.group('frame', { x: x - 12, y: y - 12, w: w + 24, h: h + 24 }, (c) => {
    c.strokeStyle = GREEN; c.lineWidth = 7; c.strokeRect(x - 6, y - 6, w + 12, h + 12);
  }, { t: 6.2, d: 0.8, reveal: 'iris' });
  // the sky, yellow fading into pink, and the sun with its cuts
  p.group('coast', { x: x - 4, y: y - 4, w: w + 8, h: h + 8 }, (c) => {
    c.fillStyle = fade(c, y, y + h * 0.7, [YELLOW, ORANGE, PINK]); c.fillRect(x, y, w, h);
  }, { t: 6.4, d: 0.9, reveal: 'wipeL', ease: 'inOut' });
  p.group('coast', { x: 1080, y: 1400, w: 240, h: 200 }, (c) => {
    c.save(); c.beginPath(); c.rect(1080, 1380, 240, 196); c.clip();
    c.fillStyle = WHITE; c.beginPath(); c.arc(1200, 1520, 96, 0, Math.PI * 2); c.fill();
    c.fillStyle = PINK; for (let k = 0; k < 6; k++) c.fillRect(1100, 1505 + k * 13, 200, 3 + k * 1.4);
    c.restore();
  }, { t: 6.8, d: 0.8, reveal: 'iris', ease: 'soft' });
  // the cliff: bands of earth stepping down to the beach, each its own ink
  const bands = [BLACK, ORANGE, BLACK, PINK, BLACK, ORANGE, BLACK, YELLOW, BLACK];
  const sea = 1640;
  const xs = [];
  for (let xx = x - 4; xx <= 1010; xx += 10) xs.push(xx);
  const edge = (k) => xs.map((xx) => [xx, lerp(cliffTop(xx), sea, k / bands.length) + Math.sin(xx * 0.03 + k * 1.7) * 3 * (k ? 1 : 0)]);
  bands.forEach((col, k) => {
    const top = edge(k), bot = edge(k + 1);
    const pts = [...top, [1012 + k * 6, bot[bot.length - 1][1]], ...bot.reverse()];
    p.group('coast', boxOf(pts, 4), (c) => fillPoly(c, pts, col), { t: 7.0 + k * 0.1, d: 0.7, reveal: 'wipe' });
  });
  // the park along the top: the lighthouse, a line of trees, the towers behind
  p.group('coast', { x: x, y: 1330, w: 960, h: 150 }, (c) => {
    const tops = [[110, 1400, 60], [190, 1380, 80], [520, 1392, 70], [610, 1370, 98], [700, 1400, 62], [790, 1386, 84]];
    for (const [bx, by, bw] of tops) {
      rect(c, bx, by, bw, 1476 - by, BLACK);
      c.fillStyle = YELLOW; for (let yy = by + 10; yy < 1460; yy += 14) for (let xx = bx + 8; xx < bx + bw - 8; xx += 14) c.fillRect(xx, yy, 6, 7);
    }
    c.fillStyle = BLACK; c.beginPath();
    for (let xx = 90; xx < 960; xx += 26) { c.moveTo(xx + 14, 1466); c.arc(xx, 1466, 14, 0, Math.PI * 2); }
    c.fill();
    c.fillStyle = GREEN; for (let xx = 90; xx < 960; xx += 26) c.fillRect(xx - 6, 1458, 3, 3);
  }, { t: 7.9, d: 0.8, reveal: 'rise' });
  // La Marina's lighthouse: a striped tower with a lantern
  p.group('coast', { x: 340, y: 1330, w: 80, h: 150 }, (c) => {
    fillPoly(c, [[362, 1476], [368, 1376], [392, 1376], [398, 1476]], '#1f3fd6');
    c.save(); poly(c, [[362, 1476], [368, 1376], [392, 1376], [398, 1476]]); c.clip();
    c.fillStyle = WHITE; c.fillRect(350, 1396, 60, 14); c.fillRect(350, 1436, 60, 14);
    c.restore();
    rect(c, 360, 1370, 40, 8, WHITE); rect(c, 368, 1352, 24, 18, YELLOW); rect(c, 368, 1352, 24, 4, BLACK);
    fillPoly(c, [[364, 1352], [380, 1336], [396, 1352]], BLACK);
  }, { t: 8.2, d: 0.7, reveal: 'rise' });
  // the road at the foot of the cliff and the Pacific
  p.group('sea', { x: x, y: sea - 30, w: w, h: y + h - sea + 30 }, (c) => {
    c.fillStyle = fade(c, sea - 8, y + h, [GREEN, BLUE]); c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, sea + 30); c.lineTo(1000, sea - 6); c.lineTo(x + w, sea - 6); c.lineTo(x + w, y + h); c.fill();
    rect(c, x, sea - 10, 1000 - x, 14, BLACK);
    c.fillStyle = YELLOW; for (let xx = x + 8; xx < 990; xx += 34) c.fillRect(xx, sea - 5, 16, 3);
  }, { t: 8.0, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // waves: black cuts across the sea, white where they break
  const cuts = [], foam = [];
  for (let yy = sea + 8; yy < y + h - 4; yy += 10) {
    for (let xx = x + r.range(0, 60); xx < x + w; xx += r.range(60, 140)) {
      const L = r.range(30, 90);
      if (yy < sea + 26 && xx < 980) continue;
      (r.chance(0.18) ? foam : cuts).push([[xx, yy], [xx + L * 0.5, yy - 4], [xx + L, yy]]);
    }
  }
  p.strokes('sea', cuts, BLACK, 3.5, { t: 8.6, d: 0.8, reveal: 'wipe', box: { x: x, y: sea, w: w, h: y + h - sea } });
  p.strokes('sea', foam, WHITE, 3, { t: 8.9, d: 0.6, reveal: 'wipeL', box: { x: x, y: sea, w: w, h: y + h - sea } });
}

// ================================================================ the type blocks below
function bottomRows(p, r) {
  const t4 = 'ENTRADA LIBRE · TODOS LOS DÍAS', s4 = fit(t4, 62, 1340, 0.05);
  p.group('type', { x: 60, y: 1716, w: W - 120, h: 96 }, (c) => {
    c.fillStyle = fadeX(c, 70, W - 70, [GREEN, YELLOW, GREEN]); c.fillRect(70, 1724, W - 140, 80);
    setLine(c, t4, W / 2, 1788, s4, BLACK, 0.05);
  }, { t: 9.3, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // the year in pink, fading to orange, and the place under it
  p.group('type', { x: 60, y: 1820, w: 760, h: 140 }, (c) => {
    c.save(); c.fillStyle = fade(c, 1840, 1930, [PINK, ORANGE]);
    setLine(c, 'DESDE 1535', 84, 1916, 104, c.fillStyle, 0.02, 'left'); c.restore();
  }, { t: 9.6, d: 0.8, reveal: 'wipe' });
  p.group('type', { x: 780, y: 1840, w: 340, h: 100 }, (c) => {
    setLine(c, 'PERÚ', 800, 1912, 70, BLUE, 0.08, 'left');
  }, { t: 9.9, d: 0.6, reveal: 'wipe' });
  // the starburst that shouts
  const burst = starPts(1400, 1896, 92, 72, 18, 0.1);
  p.group('type', { x: 1296, y: 1792, w: 210, h: 210 }, (c) => {
    fillPoly(c, burst, YELLOW);
    c.strokeStyle = PINK; c.lineWidth = 5; poly(c, burst); c.stroke();
    c.save(); c.translate(1400, 1896); c.rotate(-0.12);
    setLine(c, '¡NO', 0, -6, 42, BLACK, 0.02); setLine(c, 'FALTES!', 0, 36, 36, BLACK, 0.02);
    c.restore();
  }, { t: 12.5, d: 0.7, reveal: 'pop', ease: 'back' });
}

// ================================================================ sparks
// four-pointed glints scattered over the black, printed in the last pass
const GLINTS = [[150, 360, 26, YELLOW], [1460, 330, 30, GREEN], [120, 740, 18, PINK], [1480, 760, 22, YELLOW], [690, 330, 16, PINK], [1210, 320, 14, GREEN]];
function glint(c, x, y, s, col) { fillPoly(c, starPts(x, y, s, s * 0.22, 4, 0), col); }
function sparks(p) {
  GLINTS.forEach(([x, y, s, col], i) => p.group('type', { x: x - s - 4, y: y - s - 4, w: 2 * s + 8, h: 2 * s + 8 }, (c) => glint(c, x, y, s, col),
    { t: 12.7 + i * 0.08, d: 0.5, reveal: 'pop', ease: 'back' }));
}

// ================================================================ the live things
function life(p, r) {
  // paragliders riding the wind along the cliff
  const gliders = [[300, 1420, 0, PINK, GREEN], [640, 1400, 2.1, GREEN, YELLOW], [860, 1440, 4.2, BLUE, PINK]];
  p.live('live', {
    t: 10.0, d: 1, reveal: 'fade',
    draw: (c, time) => {
      c.save(); c.beginPath(); c.rect(P2.x, P2.y, P2.w, P2.h); c.clip();
      for (const [x0, y0, ph, a, b] of gliders) {
        const x = x0 + Math.sin(time * 0.22 + ph) * 90, y = y0 + Math.sin(time * 0.5 + ph) * 12 - 40;
        // the canopy: an arc of cells in two inks
        for (let k = 0; k < 6; k++) {
          const a0 = Math.PI * (1.12 + k * 0.127), a1 = a0 + Math.PI * 0.127;
          c.beginPath(); c.arc(x, y + 30, 46, a0, a1); c.arc(x, y + 30, 34, a1, a0, true); c.closePath();
          c.fillStyle = k % 2 ? a : b; c.fill();
        }
        c.strokeStyle = BLACK; c.lineWidth = 1.4; c.beginPath();
        c.moveTo(x - 40, y + 14); c.lineTo(x, y + 50); c.lineTo(x + 40, y + 14); c.moveTo(x - 14, y - 2); c.lineTo(x, y + 50); c.lineTo(x + 14, y - 2); c.stroke();
        c.fillStyle = BLACK; c.fillRect(x - 4, y + 48, 8, 10);
      }
      c.restore();
    },
  });
  // surfers on the long swell
  p.live('live', {
    t: 10.3, d: 1, reveal: 'fade',
    draw: (c, time) => {
      for (const [x0, y0, ph] of [[1240, 1666, 0], [1420, 1690, 2.5]]) {
        const x = x0 + Math.sin(time * 0.35 + ph) * 60, y = y0 + Math.sin(time * 0.9 + ph) * 3;
        c.fillStyle = WHITE; c.beginPath(); c.ellipse(x, y, 26, 5, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = BLACK; c.fillRect(x - 4, y - 30, 8, 22); c.beginPath(); c.arc(x, y - 36, 6, 0, Math.PI * 2); c.fill();
        c.fillRect(x - 16, y - 26, 32, 4);
        c.strokeStyle = WHITE; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 30, y + 4); c.quadraticCurveTo(x - 60, y - 4, x - 80, y + 6); c.stroke();
      }
    },
  });
  // the lighthouse's beam sweeping
  p.live('live', {
    t: 10.5, d: 1, reveal: 'fade',
    draw: (c, time) => {
      const k = Math.sin(time * 1.2);
      c.fillStyle = 'rgba(255,246,236,.55)'; c.beginPath(); c.moveTo(380, 1360); c.lineTo(380 + k * 220, 1340); c.lineTo(380 + k * 220, 1372); c.closePath(); c.fill();
    },
  });
  // the glints twinkle
  p.live('live', {
    t: 13.2, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      GLINTS.forEach(([x, y, s], i) => {
        const q = Math.max(0, Math.sin(time * 2.2 + i * 1.9));
        if (q > 0.6) glint(c, x, y, s * 0.7 * q, WHITE);
      });
    },
  });
}

// ================================================================ the title
// LIMA, huge, a fade from yellow through orange to pink with a green shadow
function title(p, r) {
  const y = 765, size = fit('LIMA', 560, 1360, 0.04);
  const res = p.type('title', 'LIMA', W / 2, y, { family: FACE, size, color: YELLOW, align: 'center', track: 0.04, t: 11.0, gap: 0.3, d: 0.8, reveal: 'drop', ease: 'back' });
  const f = `normal 400 ${res.size}px ${FACE}`, top = y - res.size * 0.72;
  res.glyphs.forEach((m, i) => {
    const ch = 'LIMA'[i], gx = m.box.x + res.size * 0.15, gw = m.box.w - res.size * 0.3;
    m.dy = 60;
    // the green shadow goes down first, as the first pass of the screen
    p.group('frame', { x: gx - 10, y: top - 30, w: gw + 60, h: y - top + 60 }, (c) => {
      c.font = f; c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillStyle = GREEN; c.fillText(ch, gx + 16, y + 14);
    }, { t: 4.6 + i * 0.25, d: 0.9, reveal: 'wipe', ease: 'inOut' });
    m.box = { ...m.box, y: m.box.y - 20, h: m.box.h + 40 };
    m.draw = (c) => {
      c.font = f; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      c.strokeStyle = BLACK; c.lineWidth = 10; c.lineJoin = 'round'; c.strokeText(ch, gx, y);
      c.fillStyle = fade(c, top, y, [YELLOW, ORANGE, PINK]); c.fillText(ch, gx, y);
      // the screen's thin cuts across the lower half
      c.save(); c.beginPath(); c.rect(gx - 4, top, gw + 8, y - top + 4); c.clip();
      c.fillStyle = BLACK; for (let k = 0; k < 5; k++) c.fillRect(gx - 4, y - 150 + k * 28, gw + 8, 3 + k * 1.6);
      c.restore();
    };
  });
}
