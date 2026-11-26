// Madrid: a 1920s Spanish art deco poster. The Metrópolis building's corner
// rotunda seen from low on the street, huge: giant paired columns, sculpture
// groups on the cornice, the drum, the black slate dome laced with gold and the
// winged Victory on top. Behind it a stepped sun in coral and peach with gold
// rays fanning over a banded teal dusk; the Edificio Grassy and the Telefónica
// tower down the Gran Vía to the left, the Círculo de Bellas Artes and its
// Minerva to the right; streaming traffic below, swifts round the dome, the
// name in Limelight on a black band inside a stepped gold frame.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, poly, mix, shade } from '../kit.js';

const PAPER = '#f2e6cc', INK = '#1b1a20', GOLD = '#d6a744', GOLD_D = '#9a6f27', GOLD_L = '#f0cf7a';
const STONE_L = '#f6ead2', STONE = '#ead6b2', STONE_M = '#dcb894', STONE_S = '#c98c6f', STONE_D = '#a7664f';
const TEAL = ['#123a40', '#174a4e', '#1e5a5a', '#2a6c66', '#3d8076', '#5b9585'];
const CORAL = '#d4573f', SALMON = '#e98762', PEACH = '#f3b88a', SUN_L = '#f8dcae';
const SLATE = '#202028', SLATE_L = '#33343e';
const HAZE = '#6f9c92', HAZE_L = '#9dbcad';

export const city = {
  id: 'madrid', name: 'Madrid', wall: '#3a1f1b',
  alt: 'A 1920s art deco poster of Madrid: the Metrópolis building seen from the street below, its corner rotunda of paired columns with sculpture groups on the cornice and its black and gold dome crowned by a winged Victory, against a stepped coral sun with gold rays over a teal dusk, with the Edificio Grassy and the Telefónica tower down the Gran Vía, the Círculo de Bellas Artes with its Minerva, streaming traffic, street lamps, people in hats and swifts round the dome',
  google: 'family=Limelight',
  fonts: [['400 240px "Limelight"', 'MADRID'], ['400 34px "Limelight"', 'GRAN VÍA · CALLE DE ALCALÁ · ESPAÑA']],
  build,
};

const X0 = 84, X1 = W - 84, Y0 = 84, Y1 = 1640; // the picture's window
const H0 = 1540; // the street, where the eye is
const CX = 800, R = 272; // the rotunda
const D = Math.PI / 180;
const FACE = '"Limelight"';

// a level y on a cylinder of radius rad, at angle th from straight on: seen from
// below, a ring above the eye bows up toward the viewer
const bow = (y, rad) => (H0 - y) * 0.1 * (rad / R);
const cyl = (rad, th, y) => [CX + rad * Math.sin(th), y - bow(y, rad) * Math.cos(th)];
function cylBand(rad, t0, t1, y0, y1, n = 10) {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(cyl(rad, lerp(t0, t1, i / n), y0));
  for (let i = n; i >= 0; i--) pts.push(cyl(rad, lerp(t0, t1, i / n), y1));
  return pts;
}
// the wings recede to two vanishing points on the street line
const VL = -1250, VR = W + 1250;
const EL = CX - R * Math.sin(76 * D), ER = CX + R * Math.sin(76 * D);
const wingY = (x, yEdge, side) => {
  const vx = side < 0 ? VL : VR, x0 = side < 0 ? EL : ER;
  return H0 + (yEdge - H0) * (x - vx) / (x0 - vx);
};
const edgeY = (y) => cyl(R, 76 * D, y)[1];
// a column of the wing, i steps from the rotunda, foreshortened
const wingX = (i, side, step = 0.16) => {
  const vx = side < 0 ? VL : VR, x0 = side < 0 ? EL : ER;
  return vx + (x0 - vx) / (1 + step * i);
};

function build() {
  const p = new Plate({ paper: PAPER, seed: 1911 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'sun', 'rays', 'far', 'grassy', 'circulo', 'wings', 'rotunda', 'detail', 'dome', 'statue', 'street', 'people', 'live', 'frame');
  p.layer('frame', { clip: false });

  frame(p);
  sky(p, r);
  far(p, r);
  grassy(p, r);
  circulo(p, r);
  wings(p, r);
  rotunda(p, r);
  dome(p, r);
  statue(p);
  street(p, r);
  live(p, r);
  title(p);
  return p;
}

function path(c, pts, close = true) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}
function rects(c, list) { c.beginPath(); for (const [x, y, w, h] of list) c.rect(x, y, w, h); }

// ================================================================ the frame: black, gold rules, stepped corners
function frame(p) {
  const B = 40;
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = INK;
    c.beginPath(); c.rect(B, B, W - 2 * B, H - 2 * B); c.rect(X0, Y0, X1 - X0, Y1 - Y0); c.fill('evenodd');
  }, { t: 0, d: 0.5, reveal: 'fade' });
  // a gold rule round the window, stepped in at the corners like a deco frieze
  const step = (x, y, sx, sy) => [[x, y + sy * 70], [x + sx * 16, y + sy * 70], [x + sx * 16, y + sy * 40], [x + sx * 40, y + sy * 40], [x + sx * 40, y + sy * 16], [x + sx * 70, y + sy * 16], [x + sx * 70, y]];
  p.group('frame', { x: X0 - 30, y: Y0 - 30, w: X1 - X0 + 60, h: Y1 - Y0 + 60 }, (c) => {
    c.strokeStyle = GOLD; c.lineWidth = 3;
    c.strokeRect(X0 - 14, Y0 - 14, X1 - X0 + 28, Y1 - Y0 + 28);
    c.lineWidth = 1.4; c.strokeRect(X0 - 22, Y0 - 22, X1 - X0 + 44, Y1 - Y0 + 44);
    c.fillStyle = INK; c.lineWidth = 3;
    for (const [x, y, sx, sy] of [[X0, Y0, 1, 1], [X1, Y0, -1, 1], [X0, Y1, 1, -1], [X1, Y1, -1, -1]]) {
      const pts = [[x, y], ...step(x, y, sx, sy)];
      path(c, pts); c.fill(); c.stroke();
    }
  }, { t: 0.3, d: 1.2, reveal: 'fade' });
  // the outer gold line and little chevrons along the bottom of the black
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = GOLD_D; c.lineWidth = 2; c.strokeRect(B + 10, B + 10, W - 2 * B - 20, H - 2 * B - 20);
  }, { t: 0.6, d: 1.4, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ the sky: banded teal, a stepped sun, gold rays
const SUNX = CX, SUNY = 860;
function sky(p, r) {
  // hard bands of teal, darkest at the top
  const bands = [Y0, 260, 420, 560, 690, 800, 1000];
  bands.slice(0, -1).forEach((y, i) => {
    p.group('sky', { x: X0, y, w: X1 - X0, h: bands[i + 1] - y + (i === 5 ? 700 : 2) }, (c) => {
      c.fillStyle = TEAL[i]; c.fillRect(X0, y, X1 - X0, (i === 5 ? 900 : bands[i + 1] - y + 2));
    }, { t: 0.2 + i * 0.16, d: 0.6, reveal: 'fall', ease: 'inOut' });
  });
  // small gold stars in the dark top bands, as four-pointed sparks
  const stars = [];
  for (let i = 0; i < 26; i++) {
    const x = r.range(X0 + 30, X1 - 30), y = r.range(Y0 + 30, 470);
    if (Math.hypot(x - SUNX, y - SUNY) < 760) continue;
    stars.push([x, y, r.range(3, 8)]);
  }
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: 500 }, (c) => {
    c.fillStyle = GOLD_L; c.beginPath();
    for (const [x, y, s] of stars) { c.moveTo(x, y - s); c.lineTo(x + s * 0.22, y - s * 0.22); c.lineTo(x + s, y); c.lineTo(x + s * 0.22, y + s * 0.22); c.lineTo(x, y + s); c.lineTo(x - s * 0.22, y + s * 0.22); c.lineTo(x - s, y); c.lineTo(x - s * 0.22, y - s * 0.22); c.closePath(); }
    c.fill();
  }, { t: 1.3, d: 0.8, reveal: 'fade' });

  // the sun: concentric half discs, stepped, coral outside to pale in the middle
  const rings = [[640, CORAL], [560, SALMON], [480, '#ee9d70'], [400, PEACH], [310, '#f6c999'], [210, SUN_L]];
  rings.forEach(([rad, col], i) => {
    p.group('sun', { x: SUNX - rad - 6, y: SUNY - rad - 6, w: rad * 2 + 12, h: rad * 2 + 12 }, (c) => {
      c.fillStyle = col; c.beginPath(); c.arc(SUNX, SUNY, rad, 0, Math.PI * 2); c.fill();
    }, { t: 1.0 + i * 0.2, d: 0.9, reveal: 'iris', ease: 'out' });
  });
  // thin gold rules on the ring edges
  p.group('sun', { x: SUNX - 650, y: SUNY - 650, w: 1300, h: 1300 }, (c) => {
    c.strokeStyle = GOLD; c.lineWidth = 2.4;
    for (const [rad] of rings) { c.beginPath(); c.arc(SUNX, SUNY, rad + 6, Math.PI, Math.PI * 2); c.stroke(); }
  }, { t: 2.3, d: 0.9, reveal: 'fade' });

  // rays: alternate wedges of a lighter teal fanning from behind the sun, then gold lines
  const wedges = [], lines = [];
  const N = 34;
  for (let i = 0; i <= N; i++) {
    const a = Math.PI + (i / N) * Math.PI;
    const ca = Math.cos(a), sa = Math.sin(a);
    if (i % 2 === 0 && i < N) {
      const a2 = a + (Math.PI / N) * 0.55;
      wedges.push([[SUNX + ca * 650, SUNY + sa * 650], [SUNX + ca * 1700, SUNY + sa * 1700], [SUNX + Math.cos(a2) * 1700, SUNY + Math.sin(a2) * 1700], [SUNX + Math.cos(a2) * 650, SUNY + Math.sin(a2) * 650]]);
    }
    const L = i % 2 ? 1700 : 1000 + (i % 4) * 140;
    lines.push([[SUNX + ca * 660, SUNY + sa * 660], [SUNX + ca * L, SUNY + sa * L]]);
  }
  p.group('rays', { x: X0, y: Y0, w: X1 - X0, h: SUNY - Y0 }, (c) => {
    c.save(); c.beginPath(); c.rect(X0, Y0, X1 - X0, SUNY - Y0); c.clip();
    c.fillStyle = 'rgba(120,180,160,0.13)';
    c.beginPath(); for (const w of wedges) { c.moveTo(w[0][0], w[0][1]); for (const q of w.slice(1)) c.lineTo(q[0], q[1]); c.closePath(); } c.fill();
    c.restore();
  }, { t: 2.1, d: 1.0, reveal: 'fade' });
  lines.map((l, i) => [l, i, 2.3 + Math.abs(i - N / 2) * 0.035]).sort((a, b) => a[2] - b[2]).forEach(([l, i, t]) => {
    p.pen('rays', l, i % 2 ? GOLD : GOLD_D, i % 2 ? 2.2 : 1.4, { t, d: 0.7, ease: 'out' });
  });
}

// ================================================================ far: the Gran Vía running away with the Telefónica tower
function far(p, r) {
  // the street's far end: facades in haze, stepping down toward the vanishing point
  const gx0 = 300, gx1 = 470;
  const blocks = [];
  let x = gx1;
  while (x > gx0 + 10) {
    const w = r.range(14, 30) * (x - gx0 + 60) / 200;
    const top = lerp(1330, 1180, (x - gx0) / (gx1 - gx0)) - r.range(0, 60);
    blocks.push([x - w, top, w]);
    x -= w;
  }
  p.group('far', { x: 280, y: 900, w: 220, h: 660 }, (c) => {
    // the Telefónica: a stepped tower with its crown, far down the street
    const tx = 382;
    c.fillStyle = HAZE;
    rects(c, [[tx - 30, 1100, 60, 440], [tx - 22, 1040, 44, 70], [tx - 15, 1000, 30, 50], [tx - 9, 975, 18, 30], [tx - 3, 940, 6, 40]]); c.fill();
    c.fillStyle = HAZE_L; rects(c, [[tx - 30, 1100, 16, 440], [tx - 22, 1040, 10, 70], [tx - 15, 1000, 7, 50]]); c.fill();
    c.fillStyle = shade(HAZE, 0.8);
    c.beginPath(); for (let y = 1110; y < 1500; y += 14) for (let k = -2; k <= 2; k++) c.rect(tx + k * 10 - 2, y, 4, 7); c.fill();
    // the street's facades
    for (const [bx, top, w] of blocks) {
      c.fillStyle = mix(HAZE, STONE_M, 0.35 + (bx % 3) * 0.08); c.fillRect(bx, top, w + 0.5, H0 - top);
    }
    c.fillStyle = GOLD_L; c.beginPath();
    for (const [bx, top, w] of blocks) for (let y = top + 10; y < H0 - 30; y += 16) if ((bx * 7 + y) % 5 < 2) c.rect(bx + w * 0.3, y, w * 0.35, 5);
    c.fill();
  }, { t: 2.8, d: 1.0, reveal: 'rise' });
}

// ================================================================ the Edificio Grassy, on the far corner to the left
function grassy(p, r) {
  const tx = 205, tw = 74; // the round corner tower's center and half width
  const top = 1000;
  // the block running off to the left
  p.group('grassy', { x: X0, y: 1040, w: 200, h: 520 }, (c) => {
    c.fillStyle = STONE_M; c.fillRect(X0, 1080, 140, H0 - 1080);
    c.fillStyle = STONE; c.fillRect(X0, 1068, 140, 14);
    c.fillStyle = INK; c.beginPath();
    for (let y = 1110; y < 1460; y += 42) for (let x = X0 + 10; x < 136; x += 22) c.rect(x, y, 10, 24);
    c.fill();
    c.fillStyle = GOLD; c.beginPath();
    for (let y = 1110; y < 1460; y += 42) for (let x = X0 + 10; x < 136; x += 22) if ((x + y * 3) % 7 === 0) c.rect(x + 1, y + 1, 8, 22);
    c.fill();
  }, { t: 3.0, d: 0.9, reveal: 'rise' });
  // the tower: tiers of columns, then the round temple with its little dome
  p.group('grassy', { x: tx - tw - 20, y: 640, w: tw * 2 + 40, h: 920 }, (c) => {
    c.fillStyle = STONE; c.fillRect(tx - tw, top, tw * 2, H0 - top);
    c.fillStyle = STONE_L; c.fillRect(tx - tw, top, tw * 0.7, H0 - top);
    c.fillStyle = STONE_S; c.fillRect(tx + tw * 0.45, top, tw * 0.55, H0 - top);
    // floors: windows between pilasters
    for (let y = top + 30; y < H0 - 70; y += 54) {
      c.fillStyle = INK;
      for (let k = -2; k <= 2; k++) { const x = tx + k * tw * 0.36; c.fillRect(x - 7 * Math.cos(k * 0.5), y, 14 * Math.cos(k * 0.5), 32); }
      c.fillStyle = shade(STONE_S, 0.9); c.fillRect(tx - tw - 3, y + 40, tw * 2 + 6, 5);
    }
    // the shop floor
    c.fillStyle = INK; c.fillRect(tx - tw, H0 - 64, tw * 2, 64);
    c.fillStyle = GOLD; for (let k = -2; k <= 2; k++) c.fillRect(tx + k * 28 - 9, H0 - 54, 18, 40);
    // cornice
    c.fillStyle = STONE_L; c.fillRect(tx - tw - 8, top - 12, tw * 2 + 16, 14);
    c.fillStyle = STONE_D; c.fillRect(tx - tw - 8, top + 2, tw * 2 + 16, 4);
    // the temple: a ring of columns on a plinth
    const ty = top - 12, th = 120, rw = tw * 0.78;
    c.fillStyle = STONE_M; c.fillRect(tx - rw - 6, ty - 18, rw * 2 + 12, 18);
    c.fillStyle = TEAL[2]; c.fillRect(tx - rw, ty - 18 - th, rw * 2, th);
    for (let k = -4; k <= 4; k++) {
      const s = k / 4.6, x = tx + Math.sin(s * 1.4) * rw, cw = 9 * Math.cos(s * 1.4);
      c.fillStyle = k > 1 ? STONE_S : STONE_L; c.fillRect(x - cw / 2, ty - 18 - th, cw, th);
    }
    c.fillStyle = STONE; c.fillRect(tx - rw - 8, ty - 30 - th, rw * 2 + 16, 14);
    // the cupola and its lantern
    c.fillStyle = SLATE; c.beginPath(); c.ellipse(tx, ty - 30 - th, rw * 0.92, rw * 0.9, 0, Math.PI, 0); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 2;
    for (let k = -3; k <= 3; k++) { c.beginPath(); c.ellipse(tx, ty - 30 - th, Math.abs(k) / 3 * rw * 0.92 + 0.1, rw * 0.9, 0, k < 0 ? Math.PI : Math.PI * 1.5, k < 0 ? Math.PI * 1.5 : Math.PI * 2); c.stroke(); }
    const ly = ty - 30 - th - rw * 0.9;
    c.fillStyle = STONE_L; c.fillRect(tx - 9, ly - 26, 18, 28);
    c.fillStyle = GOLD; c.beginPath(); c.arc(tx, ly - 30, 9, Math.PI, 0); c.fill();
    c.fillRect(tx - 1.5, ly - 62, 3, 34); c.beginPath(); c.arc(tx, ly - 64, 4, 0, Math.PI * 2); c.fill();
  }, { t: 3.3, d: 1.2, reveal: 'rise' });
}

// ================================================================ the Círculo de Bellas Artes and its Minerva, to the right
function circulo(p, r) {
  const x0 = 1300, x1 = X1 + 10, top = 760;
  p.group('circulo', { x: x0 - 20, y: 420, w: x1 - x0 + 40, h: H0 - 420 + 10 }, (c) => {
    // the main block, in shade, and its lit side
    c.fillStyle = STONE_S; c.fillRect(x0, top, x1 - x0, H0 - top);
    c.fillStyle = STONE_M; c.fillRect(x0, top, 40, H0 - top);
    // a giant loggia low down: columns in a deep shadow
    c.fillStyle = STONE_D; c.fillRect(x0 + 60, 1120, x1 - x0 - 60, 260);
    c.fillStyle = INK; c.fillRect(x0 + 70, 1140, x1 - x0 - 70, 230);
    c.fillStyle = STONE_S; for (let x = x0 + 80; x < x1; x += 46) c.fillRect(x, 1140, 16, 230);
    c.fillStyle = STONE_M; for (let x = x0 + 80; x < x1; x += 46) c.fillRect(x, 1140, 5, 230);
    // the windows above, in a strict grid, a few lit
    for (let y = top + 40; y < 1100; y += 52) {
      for (let x = x0 + 64; x < x1 - 10; x += 46) {
        c.fillStyle = (x * 3 + y) % 11 < 3 ? GOLD : INK; c.fillRect(x, y, 20, 32);
      }
      c.fillStyle = STONE_D; c.fillRect(x0 + 40, y + 40, x1 - x0, 3);
    }
    // the shop floor
    c.fillStyle = INK; c.fillRect(x0, 1410, x1 - x0, H0 - 1410);
    c.fillStyle = GOLD; for (let x = x0 + 20; x < x1; x += 52) c.fillRect(x, 1430, 26, 70);
    // cornice and the stepped upper stage
    c.fillStyle = STONE_M; c.fillRect(x0 - 10, top - 16, x1 - x0 + 20, 18);
    c.fillStyle = STONE_S; c.fillRect(x0 + 50, top - 120, 160, 106);
    c.fillStyle = STONE_M; c.fillRect(x0 + 50, top - 120, 24, 106);
    c.fillStyle = INK; for (let x = x0 + 86; x < x0 + 200; x += 30) c.fillRect(x, top - 96, 14, 60);
    c.fillStyle = STONE_M; c.fillRect(x0 + 40, top - 132, 180, 14);
    c.fillStyle = STONE_D; c.fillRect(x0 + 90, top - 160, 80, 30);
  }, { t: 3.6, d: 1.2, reveal: 'rise' });
  // Minerva: helmeted, spear upright, shield at her side
  const mx = 1430, my = top - 160;
  p.group('circulo', { x: mx - 60, y: my - 210, w: 120, h: 215 }, (c) => {
    c.fillStyle = INK;
    // robe
    path(c, [[mx - 22, my], [mx + 22, my], [mx + 14, my - 70], [mx + 12, my - 110], [mx - 12, my - 110], [mx - 15, my - 70]]); c.fill();
    // head and crested helmet
    c.beginPath(); c.arc(mx, my - 122, 11, 0, Math.PI * 2); c.fill();
    path(c, [[mx - 12, my - 128], [mx - 4, my - 150], [mx + 14, my - 146], [mx + 8, my - 128]]); c.fill();
    // arm and spear
    path(c, [[mx + 10, my - 104], [mx + 30, my - 128], [mx + 34, my - 124], [mx + 16, my - 98]]); c.fill();
    c.fillRect(mx + 30, my - 200, 4, 200);
    path(c, [[mx + 32, my - 214], [mx + 38, my - 198], [mx + 26, my - 198]]); c.fill();
    // shield
    c.beginPath(); c.ellipse(mx - 26, my - 46, 16, 30, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = GOLD; c.lineWidth = 1.6; c.beginPath(); c.ellipse(mx - 26, my - 46, 10, 22, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(mx - 6, my - 20); c.lineTo(mx - 2, my - 96); c.moveTo(mx + 6, my - 20); c.lineTo(mx + 5, my - 90); c.stroke();
  }, { t: 4.6, d: 0.7, reveal: 'drop', dy: 30 });
}

// ================================================================ the Metrópolis: its two short wings
const MAIN0 = 1010, MAIN1 = 1290; // the giant order runs between these, at the side
function wings(p, r) {
  const L = { side: -1, xEnd: 470, fill: STONE_L, lines: STONE_M, win: INK };
  const Rt = { side: 1, xEnd: 1300, fill: STONE_S, lines: STONE_D, win: INK };
  [L, Rt].forEach((w, wi) => {
    const s = w.side, xE = s < 0 ? EL : ER;
    const top = edgeY(MAIN0 - 30), base = H0;
    const q = (x, y) => [x, wingY(x, edgeY(y), s)];
    const face = [q(xE, MAIN0 - 30), q(w.xEnd, MAIN0 - 30), q(w.xEnd, H0), q(xE, H0)];
    const cols = [];
    for (let i = 0; i < 20; i++) { const x = wingX(i, s, s < 0 ? 0.012 : 0.03); if ((s < 0 && x < w.xEnd) || (s > 0 && x > w.xEnd)) break; cols.push(x); }
    p.group('wings', boxOf(face, 30), (c) => {
      c.fillStyle = w.fill; poly(c, face); c.fill();
      // the cornice and the balustrade above it
      c.fillStyle = wi ? STONE_M : STONE;
      poly(c, [q(xE, MAIN0 - 30), q(w.xEnd, MAIN0 - 30), q(w.xEnd, MAIN0 - 62), q(xE, MAIN0 - 62)]); c.fill();
      c.strokeStyle = w.lines; c.lineWidth = 1.6; c.beginPath();
      for (let k = 0; k < 40; k++) { const x = lerp(xE, w.xEnd, k / 40); const a = q(x, MAIN0 - 34), b = q(x, MAIN0 - 58); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
      c.stroke();
      c.fillStyle = w.lines;
      poly(c, [q(xE, MAIN0 - 30), q(w.xEnd, MAIN0 - 30), q(w.xEnd, MAIN0 - 22), q(xE, MAIN0 - 22)]); c.fill();
      poly(c, [q(xE, MAIN1), q(w.xEnd, MAIN1), q(w.xEnd, MAIN1 + 14), q(xE, MAIN1 + 14)]); c.fill();
      // giant pilasters and windows between them, three floors and a shop floor
      for (let i = 0; i < cols.length - 1; i++) {
        const xa = cols[i], xb = cols[i + 1], wdt = xb - xa;
        const pil = [q(xa, MAIN0), q(xa + wdt * 0.16, MAIN0), q(xa + wdt * 0.16, MAIN1), q(xa, MAIN1)];
        c.fillStyle = wi ? STONE_D : STONE_M; poly(c, pil); c.fill();
        for (const [ya, yb] of [[MAIN0 + 30, MAIN0 + 100], [MAIN0 + 130, MAIN0 + 190], [MAIN0 + 215, MAIN0 + 265]]) {
          const wa = xa + wdt * 0.36, wb = xa + wdt * 0.8;
          c.fillStyle = w.win; poly(c, [q(wa, ya), q(wb, ya), q(wb, yb), q(wa, yb)]); c.fill();
          // a little iron balcony
          c.strokeStyle = w.win; c.lineWidth = 1.4; c.beginPath();
          const b0 = q(wa - wdt * 0.05, yb + 2), b1 = q(wb + wdt * 0.05, yb + 2);
          c.moveTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.stroke();
        }
        // the shop floor: arches
        const a0 = q(xa + wdt * 0.25, MAIN1 + 40), a1 = q(xa + wdt * 0.85, H0);
        c.fillStyle = INK; poly(c, [a0, q(xa + wdt * 0.85, MAIN1 + 40), a1, q(xa + wdt * 0.25, H0)]); c.fill();
        c.fillStyle = GOLD; const g0 = q(xa + wdt * 0.32, MAIN1 + 120), g1 = q(xa + wdt * 0.78, H0 - 20);
        poly(c, [g0, q(xa + wdt * 0.78, MAIN1 + 120), g1, q(xa + wdt * 0.32, H0 - 20)]); c.fill();
      }
    }, { t: 3.9 + wi * 0.3, d: 1.2, reveal: s < 0 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ================================================================ the rotunda: base, giant order, cornice, sculpture
const PAIRS = [-54, -19, 19, 54].map((a) => a * D);
const TMAX = 76 * D;
// posterized light from the left: four flat tones across the drum
const toneAt = (th) => (th < -40 * D ? STONE_L : th < 8 * D ? STONE : th < 44 * D ? STONE_M : STONE_S);
function toned(c, rad, y0, y1, shadeK = 1) {
  const cuts = [-TMAX, -40 * D, 8 * D, 44 * D, TMAX];
  for (let i = 0; i < 4; i++) {
    c.fillStyle = shadeK === 1 ? toneAt(lerp(cuts[i], cuts[i + 1], 0.5)) : shade(toneAt(lerp(cuts[i], cuts[i + 1], 0.5)), shadeK);
    path(c, cylBand(rad, cuts[i], cuts[i + 1] + 0.004, y0, y1, 8)); c.fill();
  }
}
function rotunda(p, r) {
  const all = cylBand(R + 14, -TMAX, TMAX, MAIN0 - 110, H0, 24);
  const bx = boxOf(all, 20);
  // the body, toned
  p.group('rotunda', bx, (c) => {
    toned(c, R, MAIN0 - 30, H0);
    // the band between the shop floor and the order
    toned(c, R + 6, MAIN1, MAIN1 + 22, 0.9);
    // a gold zigzag frieze along that band, and rustication on the shop floor's piers
    c.strokeStyle = GOLD_D; c.lineWidth = 2; c.beginPath();
    for (let k = 0; k <= 80; k++) { const [x, y] = cyl(R + 6, lerp(-TMAX, TMAX, k / 80), MAIN1 + (k % 2 ? 6 : 16)); k ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    c.strokeStyle = shade(STONE_M, 0.85); c.lineWidth = 1.4; c.beginPath();
    for (let y = MAIN1 + 50; y < H0; y += 24) for (let k = 0; k <= 16; k++) { const [x, yy] = cyl(R, lerp(-TMAX, TMAX, k / 16), y); k ? c.lineTo(x, yy) : c.moveTo(x, yy); }
    c.stroke();
  }, { t: 4.2, d: 1.3, reveal: 'rise', ease: 'inOut' });

  // the shop floor: tall arches between the column feet
  const bays = [-TMAX + 0.05, ...PAIRS, TMAX - 0.05];
  p.group('rotunda', bx, (c) => {
    for (let i = 0; i < bays.length - 1; i++) {
      const a = bays[i] + 0.1, b = bays[i + 1] - 0.1;
      const m = (a + b) / 2;
      const [xa] = cyl(R, a, 0), [xb] = cyl(R, b, 0);
      const top = cyl(R, m, MAIN1 + 70)[1];
      c.fillStyle = INK;
      c.beginPath(); c.moveTo(xa, H0); c.lineTo(xa, top + (xb - xa) / 2); c.arc((xa + xb) / 2, top + (xb - xa) / 2, (xb - xa) / 2, Math.PI, 0); c.lineTo(xb, H0); c.closePath(); c.fill();
      // lit shop windows with deco glazing bars
      c.fillStyle = GOLD; c.fillRect(xa + 5, top + (xb - xa) / 2 + 30, xb - xa - 10, H0 - top - (xb - xa) / 2 - 40);
      c.strokeStyle = GOLD_D; c.lineWidth = 2; c.beginPath();
      for (let k = 1; k < 4; k++) { const x = lerp(xa + 5, xb - 5, k / 4); c.moveTo(x, top + (xb - xa) / 2 + 30); c.lineTo(x, H0 - 10); }
      c.stroke();
      // the fan in the arch
      c.strokeStyle = GOLD; c.lineWidth = 1.6; c.beginPath();
      const ccx = (xa + xb) / 2, ccy = top + (xb - xa) / 2;
      for (let k = 1; k < 8; k++) { const ang = Math.PI + (k / 8) * Math.PI; c.moveTo(ccx, ccy); c.lineTo(ccx + Math.cos(ang) * (xb - xa) * 0.42, ccy + Math.sin(ang) * (xb - xa) * 0.42); }
      c.stroke();
    }
  }, { t: 5.0, d: 0.8, reveal: 'rise' });

  // windows of the three main floors, in the bays, with balconies
  p.group('rotunda', bx, (c) => {
    for (let i = 0; i < bays.length - 1; i++) {
      const m0 = (bays[i] + bays[i + 1]) / 2, hw = Math.min(0.11, (bays[i + 1] - bays[i]) / 2 - 0.1);
      if (hw < 0.03) continue;
      const a = m0 - hw, b = m0 + hw;
      for (const [ya, yb, lit] of [[MAIN0 + 26, MAIN0 + 104, 0], [MAIN0 + 128, MAIN0 + 196, 1], [MAIN0 + 218, MAIN0 + 270, 0]]) {
        const pts = cylBand(R, a, b, ya, yb, 6);
        c.fillStyle = (i + lit) % 3 === 1 ? GOLD : INK; path(c, pts); c.fill();
        // a pediment or a lintel above
        c.fillStyle = shade(toneAt((a + b) / 2), 0.82); path(c, cylBand(R + 3, a - 0.03, b + 0.03, ya - 12, ya - 4, 6)); c.fill();
        // the balcony rail
        c.strokeStyle = INK; c.lineWidth = 2; path(c, cylBand(R + 5, a - 0.03, b + 0.03, yb + 2, yb + 14, 6).slice(0, 7), false); c.stroke();
        c.lineWidth = 1; c.beginPath();
        for (let k = 0; k <= 8; k++) { const th = lerp(a - 0.03, b + 0.03, k / 8); const u = cyl(R + 5, th, yb + 2), v = cyl(R + 5, th, yb + 14); c.moveTo(u[0], u[1]); c.lineTo(v[0], v[1]); }
        c.stroke();
        path(c, cylBand(R + 5, a - 0.03, b + 0.03, yb + 14, yb + 16, 6)); c.fillStyle = INK; c.fill();
      }
    }
  }, { t: 5.4, d: 1.0, reveal: 'rise' });

  // the giant paired columns, fluted, with gilt capitals
  PAIRS.forEach((th0, i) => {
    const pair = [th0 - 0.045, th0 + 0.045];
    const pts = [];
    for (const th of pair) pts.push(...cylBand(R + 18, th - 0.03, th + 0.03, MAIN0 - 10, MAIN1 + 22, 2));
    p.group('detail', boxOf(pts, 20), (c) => {
      for (const th of pair) {
        const w = 0.028;
        // plinth
        c.fillStyle = shade(toneAt(th), 0.86); path(c, cylBand(R + 16, th - w * 1.4, th + w * 1.4, MAIN1, MAIN1 + 22, 3)); c.fill();
        // shaft: a lit half and a shaded half
        c.fillStyle = mix(toneAt(th), STONE_L, 0.5); path(c, cylBand(R + 14, th - w, th, MAIN0 + 4, MAIN1, 3)); c.fill();
        c.fillStyle = shade(toneAt(th), 0.74); path(c, cylBand(R + 14, th, th + w, MAIN0 + 4, MAIN1, 3)); c.fill();
        c.strokeStyle = shade(toneAt(th), 0.7); c.lineWidth = 0.9; c.beginPath();
        for (let k = 1; k < 6; k++) { const t = th - w + (2 * w * k) / 6; const u = cyl(R + 14, t, MAIN0 + 8), v = cyl(R + 14, t, MAIN1 - 4); c.moveTo(u[0], u[1]); c.lineTo(v[0], v[1]); }
        c.stroke();
        // the capital
        c.fillStyle = GOLD; path(c, cylBand(R + 16, th - w * 1.5, th + w * 1.5, MAIN0 - 12, MAIN0 + 6, 3)); c.fill();
        c.fillStyle = GOLD_D; path(c, cylBand(R + 16, th - w * 1.5, th + w * 1.5, MAIN0 + 2, MAIN0 + 6, 3)); c.fill();
      }
    }, { t: 5.8 + i * 0.18, d: 0.9, reveal: 'rise' });
  });

  // the main cornice and the balustrade over it
  p.group('detail', bx, (c) => {
    c.fillStyle = STONE_L; path(c, cylBand(R + 24, -TMAX, TMAX, MAIN0 - 32, MAIN0 - 12, 16)); c.fill();
    c.fillStyle = STONE_D; path(c, cylBand(R + 24, -TMAX, TMAX, MAIN0 - 16, MAIN0 - 12, 16)); c.fill();
    // dentils
    c.fillStyle = STONE_S; c.beginPath();
    for (let k = 0; k < 70; k++) { const t = lerp(-TMAX, TMAX, (k + 0.5) / 70); path(c, cylBand(R + 22, t - 0.006, t + 0.006, MAIN0 - 12, MAIN0 - 6, 1)); c.fill(); }
    toned(c, R + 18, MAIN0 - 64, MAIN0 - 32, 0.96);
    c.strokeStyle = STONE_D; c.lineWidth = 1.5; c.beginPath();
    for (let k = 0; k < 90; k++) { const t = lerp(-TMAX, TMAX, (k + 0.5) / 90); const u = cyl(R + 18, t, MAIN0 - 36), v = cyl(R + 18, t, MAIN0 - 58); c.moveTo(u[0], u[1]); c.lineTo(v[0], v[1]); }
    c.stroke();
    c.fillStyle = STONE_L; path(c, cylBand(R + 20, -TMAX, TMAX, MAIN0 - 70, MAIN0 - 62, 16)); c.fill();
  }, { t: 6.4, d: 0.8, reveal: 'wipe', ease: 'inOut' });

  // the four sculpture groups over the column pairs: a seated figure between two standing ones
  PAIRS.forEach((th, i) => {
    const [x, y] = cyl(R + 18, th, MAIN0 - 70);
    const s = Math.cos(th) * 0.35 + 0.75;
    p.group('statue', { x: x - 60, y: y - 120, w: 120, h: 125 }, (c) => {
      c.fillStyle = mix(INK, STONE_D, 0.25);
      c.fillRect(x - 34 * s, y - 16, 68 * s, 16); // the pedestal
      const fig = (fx, h, arm) => {
        const by = y - 16;
        path(c, [[fx - 8 * s, by], [fx + 8 * s, by], [fx + 6 * s, by - h * 0.55], [fx + 5 * s, by - h * 0.82], [fx - 5 * s, by - h * 0.82], [fx - 6 * s, by - h * 0.55]]); c.fill();
        c.beginPath(); c.arc(fx, by - h * 0.9, 5.5 * s, 0, Math.PI * 2); c.fill();
        path(c, [[fx + 3 * s, by - h * 0.78], [fx + arm * 18 * s, by - h * 0.98], [fx + arm * 20 * s, by - h * 0.94], [fx + 5 * s, by - h * 0.7]]); c.fill();
      };
      fig(x - 22 * s, 64 * s, -1);
      fig(x + 22 * s, 60 * s, 1);
      // the seated one in the middle, larger, with a wheel or a sheaf
      path(c, [[x - 12 * s, y - 16], [x + 14 * s, y - 16], [x + 10 * s, y - 40 * s], [x + 6 * s, y - 70 * s], [x - 6 * s, y - 70 * s], [x - 10 * s, y - 42 * s]]); c.fill();
      c.beginPath(); c.arc(x, y - 79 * s, 7 * s, 0, Math.PI * 2); c.fill();
      c.strokeStyle = GOLD; c.lineWidth = 1.6;
      c.beginPath(); if (i % 2) c.arc(x + 16 * s, y - 34 * s, 10 * s, 0, Math.PI * 2); else { c.moveTo(x - 16 * s, y - 20); c.lineTo(x - 22 * s, y - 60 * s); c.moveTo(x - 16 * s, y - 20); c.lineTo(x - 12 * s, y - 62 * s); } c.stroke();
    }, { t: 6.8 + i * 0.2, d: 0.6, reveal: 'drop', dy: 20 });
  });
}

// ================================================================ the drum and the dome
const DR = 214, DRUM0 = MAIN0 - 70, DRUM1 = 800; // drum from its foot up to here
const DOMEH = 250, DOMR = 200;
const domeR = (h) => DOMR * Math.cos(h * Math.PI / 2) ** 0.62;
const domeY = (h) => DRUM1 - 14 - h * DOMEH;
function dome(p, r) {
  // the attic drum: toned, pilasters in pairs, round windows between
  const drumPts = cylBand(DR + 16, -TMAX, TMAX, DRUM1 - 20, DRUM0, 16);
  p.group('dome', boxOf(drumPts, 20), (c) => {
    toned(c, DR, DRUM1, DRUM0);
    c.fillStyle = STONE_D; path(c, cylBand(DR + 2, -TMAX, TMAX, DRUM0 - 30, DRUM0 - 26, 14)); c.fill();
    // pilasters
    for (const t0 of [-60, -30, 0, 30, 60]) for (const dt of [-4, 4]) {
      const t = (t0 + dt) * D;
      c.fillStyle = mix(toneAt(t), STONE_L, 0.4); path(c, cylBand(DR + 6, t - 0.022, t + 0.022, DRUM1 + 8, DRUM0 - 2, 2)); c.fill();
      c.fillStyle = GOLD; path(c, cylBand(DR + 8, t - 0.028, t + 0.028, DRUM1 + 4, DRUM1 + 14, 2)); c.fill();
    }
    // the round windows
    for (const t0 of [-36, 0, 36]) {
      const t = t0 * D, [x, y] = cyl(DR, t, (DRUM1 + DRUM0) / 2 + 6);
      const w = 17 * Math.cos(t);
      c.fillStyle = INK; c.beginPath(); c.ellipse(x, y, w, 20, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = GOLD; c.lineWidth = 2.4; c.beginPath(); c.ellipse(x, y, w + 5, 25, 0, 0, Math.PI * 2); c.stroke();
      c.fillStyle = t0 === 0 ? GOLD_L : INK; c.beginPath(); c.ellipse(x, y, w * 0.6, 12, 0, 0, Math.PI * 2); c.fill();
      // a garland under it
      c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(x - w - 8, y + 30); c.quadraticCurveTo(x, y + 46, x + w + 8, y + 30); c.stroke();
    }
    // its cornice
    c.fillStyle = STONE_L; path(c, cylBand(DR + 14, -TMAX, TMAX, DRUM1 - 16, DRUM1, 14)); c.fill();
    c.fillStyle = STONE_D; path(c, cylBand(DR + 14, -TMAX, TMAX, DRUM1 - 3, DRUM1, 14)); c.fill();
  }, { t: 7.0, d: 1.1, reveal: 'rise', ease: 'inOut' });

  // the dome: black slate, its side lit faintly from the left
  // the front of its foot bows down onto the drum's cornice
  const foot = cylBand(DOMR, -Math.PI / 2, Math.PI / 2, DRUM1 - 14, DRUM1 - 14, 20).slice(0, 21);
  const domePath = (c) => {
    c.beginPath();
    foot.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    for (let i = 0; i <= 30; i++) { const h = i / 30; c.lineTo(CX + domeR(h), domeY(h)); }
    for (let i = 30; i >= 0; i--) { const h = i / 30; c.lineTo(CX - domeR(h), domeY(h)); }
    c.closePath();
  };
  const dbox = { x: CX - DOMR - 20, y: domeY(1) - 20, w: DOMR * 2 + 40, h: DOMEH + 90 };
  p.group('dome', dbox, (c) => {
    c.fillStyle = SLATE; domePath(c); c.fill();
    c.save(); domePath(c); c.clip();
    c.fillStyle = SLATE_L;
    c.beginPath();
    for (let i = 0; i <= 30; i++) { const h = i / 30; c.lineTo(CX - domeR(h), domeY(h)); }
    for (let i = 30; i >= 0; i--) { const h = i / 30; c.lineTo(CX - domeR(h) * 0.55, domeY(h)); }
    c.fill();
    // slate courses: fine rings
    c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 1; c.beginPath();
    for (let h = 0.03; h < 0.95; h += 0.035) {
      const rr = domeR(h), y = domeY(h);
      for (let k = 0; k <= 24; k++) { const th = -Math.PI / 2 + (k / 24) * Math.PI; const [x, yy] = [CX + rr * Math.sin(th), y - bow(y, rr) * Math.cos(th) * 0.5]; k ? c.lineTo(x, yy) : c.moveTo(x, yy); }
    }
    c.stroke();
    c.restore();
  }, { t: 7.6, d: 1.0, reveal: 'rise', ease: 'inOut' });

  // the gold: ribs, garlands swagged between them, a crown of oculi, wreaths
  const ribs = [-72, -48, -24, 0, 24, 48, 72].map((a) => a * D);
  const ribPts = (th) => { const pts = []; for (let i = 0; i <= 24; i++) { const h = i / 24 * 0.93; const rr = domeR(h), y = domeY(h); pts.push([CX + rr * Math.sin(th), y - bow(y, rr) * 0.5 * Math.cos(th)]); } return pts; };
  ribs.forEach((th, i) => {
    p.pen('dome', ribPts(th), GOLD, 3.2 * (0.5 + 0.5 * Math.cos(th)) + 0.8, { t: 8.1 + Math.abs(i - 3) * 0.08, d: 0.8, cap: 'butt' });
  });
  const swags = [];
  for (const hh of [0.22, 0.5]) {
    for (let i = 0; i < ribs.length - 1; i++) {
      const a = ribPts(ribs[i])[Math.round(hh / 0.93 * 24)], b = ribPts(ribs[i + 1])[Math.round(hh / 0.93 * 24)];
      swags.push([a, b, hh]);
    }
  }
  p.group('dome', dbox, (c) => {
    c.strokeStyle = GOLD; c.lineWidth = 2.2; c.beginPath();
    for (const [a, b, hh] of swags) { const sag = (hh < 0.3 ? 24 : 14) * (Math.abs(b[0] - a[0]) / 70); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag, b[0], b[1]); }
    c.stroke();
    c.fillStyle = GOLD; c.beginPath();
    for (const [a, b, hh] of swags) { if (hh > 0.3) continue; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + 20 * (Math.abs(b[0] - a[0]) / 70) + 10; c.moveTo(mx + 4, my); c.arc(mx, my, 4, 0, Math.PI * 2); }
    c.fill();
    // the dormers at the foot: little gilt oval frames
    for (let k = -2; k <= 2; k++) {
      const th = k * 24 * D + 12 * D; if (Math.abs(th) > 70 * D) continue;
      const h = 0.08, rr = domeR(h), y = domeY(h);
      const x = CX + rr * Math.sin(th), yy = y - bow(y, rr) * 0.5 * Math.cos(th) - 18;
      const w = 12 * Math.cos(th);
      c.fillStyle = GOLD; c.beginPath(); c.ellipse(x, yy, w + 4, 18, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = INK; c.beginPath(); c.ellipse(x, yy, w, 13, 0, 0, Math.PI * 2); c.fill();
    }
    // the crown band near the top
    const h = 0.82, rr = domeR(h), y = domeY(h);
    c.strokeStyle = GOLD; c.lineWidth = 4; c.beginPath();
    for (let k = 0; k <= 20; k++) { const th = -Math.PI / 2 + (k / 20) * Math.PI; const x = CX + rr * Math.sin(th), yy = y - bow(y, rr) * 0.5 * Math.cos(th); k ? c.lineTo(x, yy) : c.moveTo(x, yy); }
    c.stroke();
  }, { t: 8.7, d: 0.8, reveal: 'fade' });

  // the lantern
  const ly = domeY(0.93);
  p.group('dome', { x: CX - 60, y: ly - 110, w: 120, h: 120 }, (c) => {
    c.fillStyle = STONE; c.fillRect(CX - 34, ly - 66, 68, 66);
    c.fillStyle = STONE_S; c.fillRect(CX + 8, ly - 66, 26, 66);
    c.fillStyle = STONE_L; c.fillRect(CX - 34, ly - 66, 12, 66);
    c.fillStyle = INK; for (const k of [-16, 0, 16]) c.fillRect(CX + k - 4, ly - 56, 8, 40);
    c.fillStyle = GOLD; c.fillRect(CX - 40, ly - 74, 80, 10); c.fillRect(CX - 38, ly - 6, 76, 8);
    c.fillStyle = SLATE; c.beginPath(); c.ellipse(CX, ly - 74, 36, 22, 0, Math.PI, 0); c.fill();
    c.fillStyle = GOLD; c.fillRect(CX - 16, ly - 104, 32, 10);
  }, { t: 9.0, d: 0.6, reveal: 'rise' });
}

// ================================================================ the winged Victory on the lantern
function statue(p) {
  const bx = CX, by = domeY(0.93) - 104; // her feet
  const S = 1.12;
  const P = (x, y) => [bx + x * S, by - y * S];
  p.group('statue', { x: bx - 140, y: by - 300, w: 280, h: 306 }, (c) => {
    c.lineJoin = 'round';
    // the wings: raised and swept out, the long feathers stepped along the trailing edge
    for (const s of [-1, 1]) {
      const edge = [[6, 128], [20, 168], [40, 210], [70, 252], [84, 224], [74, 218], [92, 194], [76, 188], [92, 162], [70, 160], [74, 134], [50, 140], [36, 118], [10, 112]];
      c.fillStyle = s < 0 ? GOLD : GOLD_D; path(c, edge.map(([x, y]) => P(s * x, y))); c.fill();
      c.strokeStyle = s < 0 ? GOLD_D : INK; c.lineWidth = 1.2; c.beginPath();
      for (const [x0, y0, x1, y1] of [[18, 150, 76, 222], [16, 138, 80, 192], [14, 128, 78, 164], [12, 120, 62, 140]]) {
        const u = P(s * x0, y0), v = P(s * x1, y1); c.moveTo(u[0], u[1]); c.lineTo(v[0], v[1]);
      }
      c.stroke();
      c.fillStyle = s < 0 ? GOLD_L : GOLD; path(c, [[6, 128], [20, 168], [40, 210], [70, 252], [34, 190], [16, 146]].map(([x, y]) => P(s * x, y))); c.fill();
    }
    // the robe, flaring at the hem, blown back
    c.fillStyle = GOLD;
    path(c, [P(-26, 0), P(22, 0), P(16, 30), P(11, 78), P(10, 112), P(13, 124), P(-13, 124), P(-10, 110), P(-12, 76), P(-18, 34)]); c.fill();
    c.fillStyle = GOLD_D;
    path(c, [P(4, 0), P(22, 0), P(16, 30), P(11, 78), P(10, 112), P(13, 124), P(4, 124)]); c.fill();
    c.strokeStyle = GOLD_D; c.lineWidth = 1.2; c.beginPath();
    for (let k = 0; k < 4; k++) { const a = P(-20 + k * 5, 3), b = P(-7 + k * 3, 80); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
    // head, the right arm raised high with a laurel wreath, the left holding a palm
    c.fillStyle = GOLD; const h = P(0, 138); c.beginPath(); c.arc(h[0], h[1], 9.5 * S, 0, Math.PI * 2); c.fill();
    path(c, [P(8, 120), P(26, 168), P(30, 204), P(24, 205), P(19, 170), P(3, 126)]); c.fill();
    const w = P(28, 218); c.strokeStyle = GOLD; c.lineWidth = 3.4; c.beginPath(); c.arc(w[0], w[1], 12, 0, Math.PI * 2); c.stroke();
    c.fillStyle = GOLD; for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; c.beginPath(); c.ellipse(w[0] + Math.cos(a) * 12, w[1] + Math.sin(a) * 12, 4, 2, a + 1.2, 0, Math.PI * 2); c.fill(); }
    path(c, [P(-8, 118), P(-26, 92), P(-22, 88), P(-4, 110)]); c.fill();
    // the plinth
    c.fillStyle = GOLD_D; c.fillRect(bx - 22, by - 4, 44, 8);
  }, { t: 9.4, d: 0.9, reveal: 'drop', dy: 40, ease: 'back' });
}

// ================================================================ the street: lamps, cars standing, people in hats
function street(p, r) {
  // the road: dark, with tram rails catching the light
  p.group('street', { x: X0, y: H0 - 6, w: X1 - X0, h: Y1 - H0 + 10 }, (c) => {
    c.fillStyle = '#26232a'; c.fillRect(X0, H0, X1 - X0, Y1 - H0);
    c.fillStyle = '#3b3640'; c.fillRect(X0, H0, X1 - X0, 16);
    c.fillStyle = STONE_D; c.fillRect(X0, H0 + 14, X1 - X0, 3);
    c.strokeStyle = 'rgba(214,167,68,0.55)'; c.lineWidth = 1.6; c.beginPath();
    for (const y of [1584, 1592, 1616, 1624]) { c.moveTo(X0, y); c.lineTo(X1, y); }
    c.stroke();
    // reflections of the shop windows on the wet road
    c.fillStyle = 'rgba(214,167,68,0.22)';
    for (let x = X0 + 30; x < X1; x += 61) c.fillRect(x, H0 + 22, 6, 30);
  }, { t: 8.0, d: 0.8, reveal: 'wipe', ease: 'inOut' });

  // street lamps: a fluted post with three lanterns
  const lamps = [170, 560, 1050, 1440];
  lamps.forEach((x, i) => {
    p.group('street', { x: x - 40, y: H0 - 220, w: 80, h: 236 }, (c) => {
      c.fillStyle = INK;
      c.fillRect(x - 8, H0 - 8, 16, 14); c.fillRect(x - 4, H0 - 150, 8, 145); c.fillRect(x - 6, H0 - 70, 12, 8);
      c.fillRect(x - 30, H0 - 160, 60, 4);
      for (const dx of [-28, 0, 28]) {
        const ly = H0 - (dx ? 164 : 190);
        c.fillStyle = INK; path(c, [[x + dx - 8, ly + 4], [x + dx + 8, ly + 4], [x + dx + 10, ly - 22], [x + dx - 10, ly - 22]]); c.fill();
        c.fillStyle = GOLD_L; path(c, [[x + dx - 5, ly + 1], [x + dx + 5, ly + 1], [x + dx + 7, ly - 19], [x + dx - 7, ly - 19]]); c.fill();
        c.fillStyle = INK; path(c, [[x + dx - 12, ly - 22], [x + dx + 12, ly - 22], [x + dx, ly - 32]]); c.fill();
      }
      c.fillRect(x - 2, H0 - 190, 4, 30);
    }, { t: 8.4 + i * 0.12, d: 0.6, reveal: 'rise' });
  });

  // people: men in hats and coats, women in cloches, at the building's foot
  const folk = [];
  for (let i = 0; i < 46; i++) {
    const x = r.range(X0 + 20, X1 - 20);
    if (lamps.some((l) => Math.abs(l - x) < 14)) continue;
    folk.push([x, H0 + r.range(2, 12), r.range(0.85, 1.1), r.int(0, 2), r() < 0.5 ? 1 : -1]);
  }
  folk.sort((a, b) => a[1] - b[1]);
  for (let g = 0; g < 3; g++) {
    const part = folk.filter((_, i) => i % 3 === g);
    p.group('people', { x: X0, y: H0 - 80, w: X1 - X0, h: 100 }, (c) => {
      for (const [x, y, s, kind, dir] of part) {
        c.fillStyle = INK;
        if (kind === 2) {
          // a woman: a straight short coat, a cloche
          path(c, [[x - 7 * s, y - 26 * s], [x + 7 * s, y - 26 * s], [x + 6 * s, y - 50 * s], [x - 6 * s, y - 50 * s]]); c.fill();
          c.fillRect(x - 4 * s, y - 26 * s, 2.5 * s, 26 * s); c.fillRect(x + 2 * s, y - 26 * s, 2.5 * s, 26 * s);
          c.beginPath(); c.arc(x, y - 56 * s, 6 * s, 0, Math.PI * 2); c.fill();
          c.fillStyle = CORAL; c.beginPath(); c.arc(x, y - 58 * s, 6.5 * s, Math.PI, 0); c.fill(); c.fillRect(x - 7.5 * s, y - 58.5 * s, 15 * s, 2 * s);
        } else {
          // a man: a long coat, a hat with a brim
          path(c, [[x - 8 * s, y - 18 * s], [x + 8 * s, y - 18 * s], [x + 7 * s, y - 52 * s], [x - 7 * s, y - 52 * s]]); c.fill();
          c.fillRect(x - 5 * s, y - 18 * s, 3.5 * s, 18 * s); c.fillRect(x + 1.5 * s, y - 18 * s, 3.5 * s, 18 * s);
          c.beginPath(); c.arc(x, y - 58 * s, 6 * s, 0, Math.PI * 2); c.fill();
          c.fillRect(x - 9 * s, y - 62 * s, 18 * s, 2.4 * s); c.fillRect(x - 5.5 * s, y - 70 * s, 11 * s, 8 * s);
          if (kind === 1) { c.fillRect(x + dir * 9 * s, y - 40 * s, 1.6 * s, 40 * s); } // a cane
        }
      }
    }, { t: 9.0 + g * 0.25, d: 0.6, reveal: 'fade' });
  }
}

// a 1920s car seen from the side: long bonnet, upright cab, spoked wheels
function car(c, x, y, s, dir, body) {
  const P = (u, v) => [x + dir * u * s, y - v * s];
  c.fillStyle = body;
  path(c, [P(-46, 10), P(50, 10), P(52, 22), P(18, 26), P(14, 46), P(-30, 46), P(-38, 26), P(-48, 24)]); c.fill();
  c.fillStyle = INK; path(c, [P(-26, 42), P(10, 42), P(12, 28), P(-30, 28)]); c.fill();
  c.fillStyle = body; c.fillRect(Math.min(...[P(-10, 0)[0], P(-8, 0)[0]]), y - 42 * s, 2 * s, 14 * s);
  c.fillStyle = INK;
  for (const u of [-30, 34]) { const [wx, wy] = P(u, 9); c.beginPath(); c.arc(wx, wy, 10 * s, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = GOLD; for (const u of [-30, 34]) { const [wx, wy] = P(u, 9); c.beginPath(); c.arc(wx, wy, 3.5 * s, 0, Math.PI * 2); c.fill(); }
  const [hx, hy] = P(52, 18); c.fillStyle = GOLD_L; c.beginPath(); c.arc(hx, hy, 3.5 * s, 0, Math.PI * 2); c.fill();
}

// ================================================================ live: traffic streaming both ways, swifts round the dome
function live(p, r) {
  // lights: a lane of headlights to the right, a lane of red tail lights to the left
  const heads = [], tails = [];
  for (let i = 0; i < 22; i++) heads.push([r() * 1, r.range(0.8, 1.2)]);
  for (let i = 0; i < 22; i++) tails.push([r() * 1, r.range(0.8, 1.2)]);
  const span = X1 - X0 + 200;
  p.live('live', {
    t: 9.6, d: 1.0, reveal: 'fade',
    box: { x: X0, y: 1570, w: X1 - X0, h: 70 },
    draw: (c, time) => {
      c.fillStyle = 'rgba(240,207,122,0.9)'; c.beginPath();
      for (const [ph, sp] of heads) { const x = X0 - 100 + ((ph * span + time * 140 * sp) % span); c.rect(x - 60 * sp, 1618, 60 * sp, 3); c.rect(x - 2, 1615, 8, 9); }
      c.fill();
      c.fillStyle = 'rgba(232,90,64,0.9)'; c.beginPath();
      for (const [ph, sp] of tails) { const x = X1 + 100 - ((ph * span + time * 110 * sp) % span); c.rect(x, 1588, 46 * sp, 2.4); c.rect(x - 3, 1585, 6, 7); }
      c.fill();
    },
  });
  // two motorcars rolling along
  p.live('live', {
    t: 10.0, d: 1.0, reveal: 'fade',
    box: { x: X0, y: 1540, w: X1 - X0, h: 100 },
    draw: (c, time) => {
      const x1 = X0 - 120 + ((time * 70) % (span + 120));
      car(c, x1, 1632, 0.95, 1, CORAL);
      const x2 = X1 + 120 - ((time * 55 + 700) % (span + 120));
      car(c, x2, 1604, 0.8, -1, TEAL[2]);
    },
  });
  // swifts wheeling round the dome
  const swifts = [];
  for (let i = 0; i < 9; i++) swifts.push([r.range(0, Math.PI * 2), r.range(240, 420), r.range(60, 150), r.range(0.25, 0.45) * (r() < 0.3 ? -1 : 1), r.range(420, 700)]);
  p.live('live', {
    t: 9.8, d: 1.0, reveal: 'fade',
    box: { x: X0, y: Y0, w: X1 - X0, h: 900 },
    draw: (c, time) => {
      c.fillStyle = INK; c.beginPath();
      for (const [ph, rx, ry, sp, cy] of swifts) {
        const a = ph + time * sp, x = CX + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
        const dir = -Math.sin(a) * Math.sign(sp) > 0 ? 1 : -1, f = Math.sin(time * 9 + ph * 3) * 3;
        // a sickle: two swept wings meeting at a small body
        c.moveTo(x + dir * 9, y);
        c.quadraticCurveTo(x + dir * 2, y - 12, x - dir * 16, y - 22 - f);
        c.quadraticCurveTo(x - dir * 2, y - 8, x - dir * 8, y - 2);
        c.lineTo(x - dir * 14, y - 4); c.lineTo(x - dir * 10, y); c.lineTo(x - dir * 14, y + 4); c.lineTo(x - dir * 8, y + 2);
        c.quadraticCurveTo(x - dir * 2, y + 8, x - dir * 16, y + 22 + f);
        c.quadraticCurveTo(x + dir * 2, y + 12, x + dir * 9, y);
        c.closePath();
      }
      c.fill();
    },
  });
}

// ================================================================ the name
function title(p) {
  const ty = 1880;
  p.type('frame', 'MADRID', W / 2, ty, { size: 206, family: FACE, color: GOLD, align: 'center', track: 0.08, fit: X1 - X0 - 120, t: 10.6, gap: 0.22, d: 0.8, reveal: 'press' });
  p.group('frame', { x: X0, y: 1690, w: X1 - X0, h: 40 }, (c) => {
    c.strokeStyle = GOLD; c.lineWidth = 2;
    c.beginPath(); c.moveTo(X0 + 40, 1700); c.lineTo(560, 1700); c.moveTo(1040, 1700); c.lineTo(X1 - 40, 1700); c.stroke();
    c.fillStyle = GOLD;
    for (const x of [560, 1040]) { c.beginPath(); c.moveTo(x, 1692); c.lineTo(x + 8 * (x < 800 ? 1 : -1), 1700); c.lineTo(x, 1708); c.lineTo(x - 8 * (x < 800 ? 1 : -1), 1700); c.closePath(); c.fill(); }
  }, { t: 12.2, d: 0.8, reveal: 'iris' });
  p.type('frame', 'GRAN VÍA', W / 2, 1712, { size: 32, family: FACE, color: GOLD_L, align: 'center', track: 0.3, t: 12.3, gap: 0.05, d: 0.4, reveal: 'fade' });
  p.type('frame', 'CALLE DE ALCALÁ · ESPAÑA', W / 2, 1932, { size: 24, family: FACE, color: GOLD_D, align: 'center', track: 0.4, t: 12.7, gap: 0.025, d: 0.4, reveal: 'fade' });
}
