// Ho Chi Minh City: the cover of a 1960s Saigon film weekly, printed in four
// cheap inks on thin paper, the colors a little off the black. A script nameplate,
// Sài Gòn, over a cover picture of the square at the end of Đồng Khởi: the
// Notre-Dame basilica's red brick front and twin spires, the yellow Central Post
// Office with its great arched window and clock, tamarind trees with their
// feathery leaves framing the view, and a river of scooters pouring toward the
// reader, riders in conical hats and áo dài. Halftone dots in the sky and the
// shadows; cover lines, a starburst and a black band below.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, mix, shade } from '../kit.js';

const PAPER = '#f4eedd', BLACK = '#1b1a1f', CYAN = '#1b8fb0', CYAN_L = '#a9d9e6', MAG = '#e2487a';
const YEL = '#f4c22b', RED = '#df4430', GREEN = '#3e9a5a', GREEN_D = '#236b45', GREEN_L = '#9cc65a';
const BRICK = '#c4533c', BRICK_D = '#9a3c2c', SLATE = '#56697c', OCHRE = '#f0bf45', OCHRE_D = '#c98f2a';
const CREAM = '#fbf3dc', ROAD = '#8e8a98';

const SCRIPT = '"Lobster"', SANS = '"Oswald"';
const NAME = 'Sài Gòn';
const KICK = 'TUẦN BÁO ĐIỆN ẢNH';
const STRIP = 'BƯU ĐIỆN · NHÀ THỜ ĐỨC BÀ · ĐƯỜNG ĐỒNG KHỞI';
const LINE1 = 'Phố phường', LINE2 = 'Sài Gòn';
const BURST1 = 'SỐ', BURST2 = 'ĐẶC BIỆT';
const ISSUE = 'SỐ 24', PRICE = 'GIÁ 15 ĐỒNG';
const BAND = 'HO CHI MINH CITY';

export const city = {
  id: 'ho-chi-minh-city', name: 'Ho Chi Minh City', wall: '#2a1620',
  alt: 'The cover of a 1960s Saigon film weekly with the nameplate Sài Gòn in script: the red brick front and twin spires of the Notre-Dame basilica and the yellow Central Post Office with its great arched window and clock, tamarind trees framing them, and a river of scooters pouring toward the reader with riders in conical hats and áo dài, printed in halftone dots, with cover lines, a yellow starburst and HO CHI MINH CITY in a black band below',
  google: 'family=Lobster&family=Oswald:wght@500;700',
  fonts: [['400 300px "Lobster"', NAME + LINE1], ['700 120px "Oswald"', BAND + ISSUE + BURST1 + BURST2], ['500 34px "Oswald"', KICK + STRIP + PRICE]],
  build,
};

const X0 = 60, X1 = W - 60, Y0 = 400, Y1 = 1800; // the cover picture
const BASE = 1262;                                  // the buildings' foot

function build() {
  const p = new Plate({ paper: PAPER, seed: 1966 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'church', 'post', 'road', 'rows', 'trees', 'trees2', 'live', 'cover', 'frame');
  p.layer('frame', { clip: false });

  page(p);
  sky(p, r);
  basilica(p, r);
  postOffice(p, r);
  road(p, r);
  scooters(p, r);
  trees(p, r);
  live(p, r);
  coverLines(p);
  nameplate(p);
  return p;
}

function path(c, pts, close = true) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}
// halftone: a screen of dots whose size follows f(x, y) (0 to 1)
function halftone(c, x0, y0, x1, y1, step, f, col) {
  c.fillStyle = col; c.beginPath();
  const dy = step * 0.7, j0 = Math.ceil(y0 / dy);
  for (let j = j0, y = j0 * dy; y < y1; y += dy, j++) {
    for (let x = x0 + (j % 2) * step * 0.5; x < x1; x += step) {
      const k = f(x, y); if (k <= 0.04) continue;
      const rr = step * 0.5 * Math.min(1, k);
      c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2);
    }
  }
  c.fill();
}
// the colors land a little up and left of the black
const OFF = [-4, -3];
function inked(c, fn) { c.save(); c.translate(OFF[0], OFF[1]); fn(); c.restore(); }

// ================================================================ the page
function page(p) {
  p.group('frame', { x: 0, y: 0, w: W, h: Y0 }, (c) => {
    c.fillStyle = BLACK; c.fillRect(X0, 56, X1 - X0, 4); c.fillRect(X0, 66, X1 - X0, 1.5);
    c.fillRect(X0, 368, X1 - X0, 1.5);
  }, { t: 0, d: 0.7, reveal: 'wipe' });
  p.type('frame', KICK, X1, 100, { size: 28, family: SANS, weight: 500, color: BLACK, align: 'right', track: 0.32, t: 0.3, gap: 0.03, d: 0.4, reveal: 'fade' });
  // the strip of cover lines over the picture
  p.group('frame', { x: X0, y: 372, w: X1 - X0, h: 30 }, (c) => { c.fillStyle = YEL; c.fillRect(X0, 372, X1 - X0, 28); }, { t: 0.5, d: 0.6, reveal: 'wipe' });
  p.type('frame', STRIP, W / 2, 396, { size: 26, family: SANS, weight: 500, color: BLACK, align: 'center', track: 0.28, t: 0.8, gap: 0.02, d: 0.3, reveal: 'fade' });
  // the picture's edge
  p.group('frame', { x: X0 - 6, y: Y0 - 6, w: X1 - X0 + 12, h: Y1 - Y0 + 12 }, (c) => {
    c.strokeStyle = BLACK; c.lineWidth = 3; c.strokeRect(X0 - 1.5, Y0 - 1.5, X1 - X0 + 3, Y1 - Y0 + 3);
  }, { t: 0.3, d: 0.8, reveal: 'fade' });
}

// ================================================================ the sky
function sky(p, r) {
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 }, (c) => {
    c.fillStyle = mix(CYAN_L, PAPER, 0.35); c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    c.fillStyle = mix(YEL, PAPER, 0.6); c.fillRect(X0, 1080, X1 - X0, 200);
  }, { t: 0.4, d: 1.0, reveal: 'fall' });
  // the screen of cyan dots, laid in bands from the top so few are drawn at once
  for (let b = 0; b < 8; b++) {
    const ya = Y0 + 4 + b * 102, yb = ya + 102;
    p.group('sky', { x: X0, y: ya - 8, w: X1 - X0, h: 118 }, (c) => {
      halftone(c, X0, ya, X1, yb, 13, (x, y) => 0.95 - (y - Y0) / 760 + Math.sin(x * 0.01) * 0.05, CYAN);
    }, { t: 0.9 + b * 0.16, d: 0.4, reveal: 'fall', ease: 'soft' });
  }
  p.group('sky', { x: X0, y: 990, w: X1 - X0, h: 280 }, (c) => {
    halftone(c, X0, 1000, X1, 1260, 11, (x, y) => (y - 1000) / 400, mix(MAG, PAPER, 0.25));
  }, { t: 2.2, d: 0.5, reveal: 'fade' });
  // the far trees of the city behind the square
  const crowns = [];
  for (let x = X0; x < X1; x += r.range(30, 60)) crowns.push([x, 1262 - r.range(40, 120), r.range(40, 70)]);
  p.group('sky', { x: X0, y: 1080, w: X1 - X0, h: 190 }, (c) => {
    c.fillStyle = mix(GREEN, CYAN_L, 0.45); c.beginPath();
    for (const [x, y, rr] of crowns) { c.moveTo(x + rr, y); c.ellipse(x, y, rr, rr * 0.7, 0, 0, Math.PI * 2); }
    c.rect(X0, 1200, X1 - X0, 70); c.fill();
    halftone(c, X0, 1120, X1, 1262, 8, (x, y) => (y - 1130) / 200, mix(GREEN_D, CYAN, 0.4));
  }, { t: 2.5, d: 0.8, reveal: 'rise' });
  // a few flat cloud shapes left in the paper
  const clouds = [[620, 520, 260, 50], [880, 610, 180, 36], [1180, 470, 220, 44]];
  clouds.forEach(([x, y, w, h], i) => p.group('sky', { x: x - 10, y: y - h - 10, w: w + 20, h: 2 * h + 20 }, (c) => {
    c.fillStyle = PAPER; c.beginPath();
    c.ellipse(x + w * 0.5, y, w * 0.5, h * 0.55, 0, 0, Math.PI * 2);
    c.ellipse(x + w * 0.38, y - h * 0.35, w * 0.24, h * 0.55, 0, 0, Math.PI * 2);
    c.ellipse(x + w * 0.64, y - h * 0.25, w * 0.2, h * 0.45, 0, 0, Math.PI * 2); c.fill();
  }, { t: 2.9 + i * 0.25, d: 0.8, reveal: 'wipe' }));
}

// ================================================================ the Notre-Dame basilica
const CX = 530;
function basilica(p, r) {
  const L = 300, R = 760, TW = 122, TT = 640, BODY = 812;
  // the brick front, string courses, the gable
  p.group('church', { x: L - 20, y: TT - 20, w: R - L + 40, h: BASE - TT + 30 }, (c) => {
    const front = [[L, BASE], [L, TT], [L + TW, TT], [L + TW, BODY], [CX, 712], [R - TW, BODY], [R - TW, TT], [R, TT], [R, BASE]];
    inked(c, () => {
      c.fillStyle = BRICK; path(c, front); c.fill();
      c.fillStyle = BRICK_D; c.fillRect(L, TT, 18, BASE - TT); c.fillRect(R - TW, TT, 16, BASE - TT);
    });
    // brick courses
    c.save(); path(c, front); c.clip();
    c.strokeStyle = 'rgba(80,20,10,0.35)'; c.lineWidth = 1.2; c.beginPath();
    for (let y = TT + 6; y < BASE; y += 7) for (let x = L + ((y / 7) % 2) * 9; x < R; x += 18) { c.moveTo(x, y); c.lineTo(x + 12, y); }
    c.stroke();
    halftone(c, L, TT, L + 40, BASE, 8, () => 0.55, 'rgba(27,26,31,0.6)');
    c.restore();
    // cream string courses and pilasters
    c.fillStyle = CREAM;
    for (const y of [BODY - 4, 960, 1100]) c.fillRect(L - 6, y, R - L + 12, 10);
    for (const x of [L + TW - 8, R - TW - 2]) c.fillRect(x, BODY, 10, BASE - BODY);
    c.fillRect(L - 6, TT - 8, TW + 12, 12); c.fillRect(R - TW - 6, TT - 8, TW + 12, 12);
    path(c, [[L + TW, BODY], [CX, 712], [R - TW, BODY], [R - TW, BODY - 10], [CX, 700], [L + TW, BODY - 10]]); c.fill();
    c.strokeStyle = BLACK; c.lineWidth = 2.5; path(c, front); c.stroke();
  }, { t: 1.8, d: 1.1, reveal: 'rise' });

  // belfries, lancets, the rose window, the three doors
  p.group('church', { x: L - 10, y: TT - 10, w: R - L + 20, h: BASE - TT + 20 }, (c) => {
    const lancet = (x, y, w, h, fill) => { c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w * 0.6); c.quadraticCurveTo(x, y, x + w / 2, y - w * 0.3); c.quadraticCurveTo(x + w, y, x + w, y + w * 0.6); c.lineTo(x + w, y + h); c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = CREAM; c.lineWidth = 3; c.stroke(); };
    for (const tx of [L, R - TW]) {
      lancet(tx + 22, 676, 30, 110, BLACK); lancet(tx + 70, 676, 30, 110, BLACK);
      lancet(tx + 44, 860, 34, 80, '#2c4a66');
      lancet(tx + 44, 1000, 34, 80, '#2c4a66');
    }
    // the rose window
    const rx = CX, ry = 900;
    c.fillStyle = CREAM; c.beginPath(); c.arc(rx, ry, 58, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2c4a66'; c.beginPath(); c.arc(rx, ry, 48, 0, Math.PI * 2); c.fill();
    c.fillStyle = CYAN; c.beginPath(); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.moveTo(rx + Math.cos(a) * 34 + 7, ry + Math.sin(a) * 34); c.arc(rx + Math.cos(a) * 34, ry + Math.sin(a) * 34, 7, 0, Math.PI * 2); } c.fill();
    c.strokeStyle = CREAM; c.lineWidth = 2.5; c.beginPath(); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.moveTo(rx, ry); c.lineTo(rx + Math.cos(a) * 48, ry + Math.sin(a) * 48); } c.stroke();
    c.fillStyle = MAG; c.beginPath(); c.arc(rx, ry, 10, 0, Math.PI * 2); c.fill();
    // the doors
    for (const [x, w, h] of [[CX, 92, 150], [L + 61, 60, 110], [R - 61, 60, 110]]) {
      c.fillStyle = CREAM; c.beginPath(); c.moveTo(x - w / 2 - 8, BASE); c.lineTo(x - w / 2 - 8, BASE - h + w / 2); c.arc(x, BASE - h + w / 2, w / 2 + 8, Math.PI, 0); c.lineTo(x + w / 2 + 8, BASE); c.fill();
      c.fillStyle = '#3a1f1a'; c.beginPath(); c.moveTo(x - w / 2, BASE); c.lineTo(x - w / 2, BASE - h + w / 2); c.arc(x, BASE - h + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, BASE); c.fill();
      c.fillStyle = 'rgba(27,26,31,0.5)'; c.fillRect(x - 1, BASE - h + w / 2, 2, h - w / 2);
    }
    // the clock between the spires
    c.fillStyle = CREAM; c.beginPath(); c.arc(CX, 760, 16, 0, Math.PI * 2); c.fill();
    c.strokeStyle = BLACK; c.lineWidth = 2; c.stroke(); c.beginPath(); c.moveTo(CX, 760); c.lineTo(CX, 750); c.moveTo(CX, 760); c.lineTo(CX + 7, 762); c.stroke();
  }, { t: 2.7, d: 0.9, reveal: 'fade' });

  // the two spires, slate on iron, with their pinnacles and crosses
  [L, R - TW].forEach((tx, i) => {
    const mx = tx + TW / 2, top = 452;
    const sp = [[tx + 8, TT - 8], [mx, top], [tx + TW - 8, TT - 8]];
    p.group('church', { x: tx - 14, y: top - 50, w: TW + 28, h: TT - top + 60 }, (c) => {
      inked(c, () => {
        c.fillStyle = SLATE; path(c, sp); c.fill();
        c.fillStyle = shade(SLATE, 0.7); path(c, [[mx, top], [tx + TW - 8, TT - 8], [mx + 8, TT - 8]]); c.fill();
      });
      c.strokeStyle = 'rgba(244,238,221,0.5)'; c.lineWidth = 1.2; c.beginPath();
      for (let k = 1; k < 8; k++) { const y = lerp(TT - 8, top, k / 8), hw = lerp(TW / 2 - 8, 0, k / 8); c.moveTo(mx - hw, y); c.lineTo(mx + hw, y); }
      c.stroke();
      c.strokeStyle = BLACK; c.lineWidth = 2.2; path(c, sp); c.stroke(); c.beginPath(); c.moveTo(mx, top); c.lineTo(mx, TT - 8); c.stroke();
      // pinnacles at the corners
      for (const px of [tx + 4, tx + TW - 4]) { c.fillStyle = SLATE; path(c, [[px - 7, TT - 6], [px, TT - 44], [px + 7, TT - 6]]); c.fill(); c.stroke(); }
      // a gabled dormer, and the cross
      c.fillStyle = CREAM; path(c, [[mx - 10, TT - 70], [mx, TT - 92], [mx + 10, TT - 70], [mx + 10, TT - 48], [mx - 10, TT - 48]]); c.fill();
      c.fillStyle = BLACK; c.fillRect(mx - 4, TT - 76, 8, 22);
      c.fillRect(mx - 2, top - 40, 4, 42); c.fillRect(mx - 11, top - 30, 22, 4);
    }, { t: 3.2 + i * 0.5, d: 1.0, reveal: 'rise' });
  });
}

// ================================================================ the Central Post Office
const PL = 830, PR = 1560, PC = 1120, PW = 132; // the wings, and the pavilion's middle and half-width
function postOffice(p, r) {
  const ROOF = 1000;
  // the long wings
  p.group('post', { x: PL - 10, y: 950, w: PR - PL + 20, h: BASE - 940 }, (c) => {
    inked(c, () => {
      c.fillStyle = OCHRE; c.fillRect(PL, ROOF, PR - PL, BASE - ROOF);
      c.fillStyle = '#9b4a32'; path(c, [[PL - 6, ROOF], [PR, ROOF], [PR, 962], [PL + 24, 962]]); c.fill();
    });
    c.fillStyle = CREAM; c.fillRect(PL - 8, ROOF - 4, PR - PL + 8, 14); c.fillRect(PL - 8, 1126, PR - PL + 8, 10);
    // the windows of the two floors between cream pilasters
    for (let x = PL + 14; x < PR; x += 70) {
      if (Math.abs(x + 28 - PC) < PW + 30) continue;
      c.fillStyle = CREAM; c.fillRect(x - 10, ROOF + 10, 8, BASE - ROOF - 10);
      // upstairs: an arched window with green shutters folded back
      c.fillStyle = BLACK; c.beginPath(); c.moveTo(x + 10, 1110); c.lineTo(x + 10, 1050); c.arc(x + 28, 1050, 18, Math.PI, 0); c.lineTo(x + 46, 1110); c.fill();
      c.fillStyle = GREEN; c.fillRect(x + 2, 1046, 8, 64); c.fillRect(x + 46, 1046, 8, 64);
      c.strokeStyle = CREAM; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 28, 1032); c.lineTo(x + 28, 1110); c.moveTo(x + 10, 1066); c.lineTo(x + 46, 1066); c.stroke();
      // downstairs: tall doors
      c.fillStyle = GREEN_D; c.fillRect(x + 10, 1150, 36, BASE - 1150);
      c.strokeStyle = 'rgba(244,238,221,0.6)'; c.lineWidth = 1.2; c.beginPath(); for (let y = 1156; y < BASE; y += 6) { c.moveTo(x + 12, y); c.lineTo(x + 44, y); } c.stroke();
    }
    halftone(c, PL, ROOF + 12, PR, ROOF + 40, 7, (x, y) => 0.7 - (y - ROOF) / 40, 'rgba(27,26,31,0.6)');
    c.strokeStyle = BLACK; c.lineWidth = 2.5; c.strokeRect(PL, ROOF, PR - PL + 10, BASE - ROOF);
  }, { t: 4.2, d: 1.0, reveal: 'rise' });

  // the pavilion: a rounded pediment, the clock, the great arched window
  const top = 812;
  p.group('post', { x: PC - PW - 20, y: top - 20, w: 2 * PW + 40, h: BASE - top + 30 }, (c) => {
    const ped = [[PC - PW, BASE], [PC - PW, 880]];
    for (let k = 0; k <= 20; k++) { const t = k / 20, a = Math.PI + t * Math.PI; ped.push([PC + Math.cos(a) * PW, 880 + Math.sin(a) * (880 - top)]); }
    ped.push([PC + PW, BASE]);
    inked(c, () => { c.fillStyle = mix(OCHRE, CREAM, 0.15); path(c, ped); c.fill(); c.fillStyle = OCHRE_D; c.fillRect(PC + PW - 22, 870, 22, BASE - 870); });
    c.fillStyle = CREAM;
    for (const x of [PC - PW, PC - PW + 26, PC + PW - 40, PC + PW - 14]) c.fillRect(x, 880, 14, BASE - 880);
    c.fillRect(PC - PW - 8, 960, 2 * PW + 16, 12);
    c.strokeStyle = CREAM; c.lineWidth = 10; c.beginPath(); c.arc(PC, 880, PW - 8, Math.PI, 0); c.stroke();
    // the great arch
    const ax = PC, aw = 84, ay = 1060;
    c.fillStyle = CREAM; c.beginPath(); c.moveTo(ax - aw - 10, BASE); c.lineTo(ax - aw - 10, ay); c.arc(ax, ay, aw + 10, Math.PI, 0); c.lineTo(ax + aw + 10, BASE); c.fill();
    c.fillStyle = '#20364a'; c.beginPath(); c.moveTo(ax - aw, BASE); c.lineTo(ax - aw, ay); c.arc(ax, ay, aw, Math.PI, 0); c.lineTo(ax + aw, BASE); c.fill();
    c.save(); c.clip(); halftone(c, ax - aw, ay - aw, ax + aw, BASE, 9, (x, y) => 0.4 + (y - ay) / 500, CYAN); c.restore();
    c.strokeStyle = CREAM; c.lineWidth = 3; c.beginPath();
    for (let k = 0; k <= 8; k++) { const a = Math.PI + (k / 8) * Math.PI; c.moveTo(ax, ay); c.lineTo(ax + Math.cos(a) * aw, ay + Math.sin(a) * aw); }
    c.moveTo(ax - aw, ay); c.lineTo(ax + aw, ay); c.moveTo(ax - aw, 1150); c.lineTo(ax + aw, 1150);
    for (const dx of [-42, 0, 42]) { c.moveTo(ax + dx, ay); c.lineTo(ax + dx, BASE); }
    c.stroke();
    c.fillStyle = CREAM; c.beginPath(); c.arc(ax, ay, 16, Math.PI, 0); c.fill();
    // the sign over the arch, and a garland of rosettes under the pediment
    c.fillStyle = GREEN_D; c.fillRect(PC - 80, 976, 160, 30);
    c.fillStyle = CREAM; c.font = `500 22px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BƯU ĐIỆN', PC, 992);
    c.fillStyle = OCHRE_D; c.beginPath(); for (let x = PC - PW + 20; x < PC + PW - 10; x += 22) { c.moveTo(x + 5, 948); c.arc(x, 948, 5, 0, Math.PI * 2); } c.fill();
    // the clock in its wreath
    c.fillStyle = GREEN; c.beginPath(); c.ellipse(PC - 58, 900, 22, 12, -0.4, 0, Math.PI * 2); c.ellipse(PC + 58, 900, 22, 12, 0.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = CREAM; c.beginPath(); c.arc(PC, 892, 40, 0, Math.PI * 2); c.fill();
    c.strokeStyle = BLACK; c.lineWidth = 3; c.stroke();
    c.lineWidth = 2; c.beginPath(); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.moveTo(PC + Math.cos(a) * 33, 892 + Math.sin(a) * 33); c.lineTo(PC + Math.cos(a) * 38, 892 + Math.sin(a) * 38); } c.stroke();
    c.strokeStyle = BLACK; c.lineWidth = 2.5; path(c, ped); c.stroke();
    // the flagless pole and the little dome of the roof behind
    c.fillStyle = '#9b4a32'; c.beginPath(); c.ellipse(PC, top + 2, 30, 14, 0, Math.PI, 0); c.fill();
  }, { t: 4.9, d: 1.0, reveal: 'rise' });
}

// ================================================================ the road
function road(p, r) {
  p.group('road', { x: X0, y: BASE, w: X1 - X0, h: Y1 - BASE }, (c) => {
    c.fillStyle = CREAM; c.fillRect(X0, BASE, X1 - X0, 26);
    c.fillStyle = ROAD; c.fillRect(X0, BASE + 26, X1 - X0, Y1 - BASE);
    halftone(c, X0, BASE + 30, X1, Y1, 10, (x, y) => 0.15 + (y - BASE) / 1400, 'rgba(27,26,31,0.55)');
    // lane lines running to the square
    c.strokeStyle = CREAM; c.lineWidth = 6; c.setLineDash([40, 40]);
    for (const k of [-1.4, -0.5, 0.5, 1.4]) { c.beginPath(); c.moveTo(800 + k * 60, BASE + 30); c.lineTo(800 + k * 700, Y1); c.stroke(); }
    c.setLineDash([]);
  }, { t: 6.2, d: 0.8, reveal: 'fall' });
}

// ================================================================ the river of scooters
const HATS = ['hat', 'hat', 'helmet', 'helmet', 'helmet', 'hat'];
const SHIRTS = [CREAM, MAG, CYAN, YEL, '#ffffff', RED, GREEN, '#f6a8c4', '#2c4a66'];
const BODIES = [RED, CREAM, CYAN, YEL, MAG, '#3a3a48', GREEN];

// a scooter coming head on: wheel, leg shield, lamp, bars; the rider above
function rider(c, x, y, s, o) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(27,26,31,0.35)'; c.beginPath(); c.ellipse(0, 2, 30, 6, 0, 0, Math.PI * 2); c.fill();
  // an áo dài's long panels flying out behind
  if (o.aodai) { c.fillStyle = o.shirt; path(c, [[-14, -64], [14, -64], [30, -18], [6, -30], [-6, -30], [-30, -18]]); c.fill(); }
  c.fillStyle = BLACK; c.fillRect(-6, -26, 12, 28);
  c.fillStyle = o.body; path(c, [[-18, -24], [18, -24], [14, -66], [-14, -66]]); c.fill();
  c.fillStyle = shade(o.body, 0.75); c.fillRect(6, -64, 8, 40);
  c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(0, -56, 6, 0, Math.PI * 2); c.fill();
  c.strokeStyle = BLACK; c.lineWidth = 3; c.beginPath(); c.moveTo(-28, -70); c.lineTo(28, -70); c.moveTo(-24, -70); c.lineTo(-28, -84); c.moveTo(24, -70); c.lineTo(28, -84); c.stroke();
  c.fillStyle = BLACK; c.beginPath(); c.arc(-28, -86, 3.5, 0, Math.PI * 2); c.arc(28, -86, 3.5, 0, Math.PI * 2); c.fill();
  // a passenger behind, if any
  if (o.pass) {
    c.fillStyle = o.pass; c.fillRect(6, -118, 20, 36);
    c.fillStyle = '#c98a5a'; c.beginPath(); c.arc(16, -126, 8, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8d49a'; path(c, [[-2, -126], [16, -142], [34, -126]]); c.fill();
  }
  // the rider: shoulders, arms to the bars, a head with a hat or a helmet and a mask
  c.fillStyle = o.shirt; path(c, [[-17, -70], [17, -70], [14, -108], [-14, -108]]); c.fill();
  c.strokeStyle = o.shirt; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-13, -102); c.lineTo(-24, -72); c.moveTo(13, -102); c.lineTo(24, -72); c.stroke();
  c.fillStyle = '#c98a5a'; c.beginPath(); c.arc(0, -118, 10, 0, Math.PI * 2); c.fill();
  if (o.hat === 'hat') {
    c.fillStyle = '#ecd598'; path(c, [[-26, -118], [0, -142], [26, -118]]); c.fill();
    c.strokeStyle = '#b89a52'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-14, -125); c.lineTo(14, -125); c.moveTo(-6, -133); c.lineTo(6, -133); c.stroke();
  } else {
    c.fillStyle = o.helmet; c.beginPath(); c.arc(0, -120, 12, Math.PI, 0); c.fill(); c.fillRect(-12, -121, 24, 3);
    if (o.mask) { c.fillStyle = o.mask; c.fillRect(-7, -116, 14, 8); }
  }
  c.restore();
}

function scooters(p, r) {
  const rows = [
    // y, scale, count, x0, x1, time
    [1296, 0.34, 34, 300, 1520, 6.7],
    [1346, 0.42, 30, 220, 1540, 7.0],
    [1408, 0.52, 26, 140, 1560, 7.3],
    [1480, 0.64, 22, 90, 1580, 7.6],
    [1565, 0.79, 17, 60, 1590, 7.9],
    [1662, 0.97, 14, 40, 1600, 8.2],
    [1780, 1.22, 10, 30, 1620, 8.5],
  ];
  rows.forEach(([y, s, n, x0, x1, t]) => {
    const list = [];
    for (let i = 0; i < n; i++) {
      list.push({
        x: lerp(x0, x1, (i + 0.5) / n) + r.range(-0.3, 0.3) * (x1 - x0) / n, y: y + r.range(-18, 18) * s, s: s * r.range(0.92, 1.06),
        body: r.pick(BODIES), shirt: r.pick(SHIRTS), hat: r.pick(HATS), helmet: r.pick([RED, YEL, CYAN, CREAM, MAG]),
        mask: r.chance(0.5) ? r.pick(['#ffffff', CYAN_L, '#f6a8c4']) : null, aodai: r.chance(0.25), pass: r.chance(0.25) ? r.pick(SHIRTS) : null,
      });
    }
    list.sort((a, b) => a.y - b.y);
    p.group('rows', { x: X0 - 40, y: y - 160 * s, w: X1 - X0 + 80, h: 190 * s }, (c) => { for (const o of list) rider(c, o.x, o.y, o.s, o); }, { t, d: 0.8, reveal: 'drop', dy: 30 });
  });
}

// ================================================================ the tamarinds
// a frond: a drooping stalk with small paired leaflets
function frond(r, x, y, a, L) {
  const stalk = [], leaves = [];
  for (let k = 0; k <= 10; k++) {
    const t = k / 10, ang = a + t * 0.5;
    const px = x + Math.cos(a) * L * t, py = y + Math.sin(a) * L * t + t * t * L * 0.35;
    stalk.push([px, py]);
    if (k > 0) for (const sg of [-1, 1]) { const la = ang + sg * 1.1 + Math.PI * 0.15; leaves.push([[px, py], [px + Math.cos(la) * 9 * (1 - t * 0.4), py + Math.sin(la) * 9 * (1 - t * 0.4)]]); }
  }
  return { stalk, leaves };
}

function trees(p, r) {
  const groups = [
    // the tree at the left edge, and the one hanging over the post office
    { trunk: [[190, Y1], [205, 1500], [180, 1200], [210, 900], [180, 640]], branches: [[[205, 1000], [280, 820], [330, 640]], [[190, 760], [90, 600]], [[200, 860], [300, 560]]], area: [X0 - 20, Y0 - 20, 330, 1080], n: 230, t: 8.8 },
    { trunk: [[1490, Y1], [1470, 1500], [1500, 1150], [1470, 820], [1500, 560]], branches: [[[1480, 760], [1330, 560], [1240, 470]], [[1490, 640], [1560, 460]], [[1475, 900], [1360, 760]]], area: [1250, Y0 - 20, X1 + 20, 840], n: 210, t: 9.3 },
  ];
  groups.forEach((gr, gi) => {
    const L = gi ? 'trees2' : 'trees';
    p.pen(L, gr.trunk, '#4a3428', 26, { t: gr.t, d: 0.8, cap: 'butt' });
    for (const b of gr.branches) p.pen(L, b, '#4a3428', 11, { t: gr.t + 0.3, d: 0.6 });
    const sets = [[], [], []], stalks = [];
    for (let i = 0; i < gr.n; i++) {
      const [ax, ay, bx, by] = gr.area;
      const x = r.range(ax, bx), y = r.range(ay, by);
      const f = frond(r, x, y, r.range(-0.2, 1.4) + (x > 800 ? Math.PI * 0.6 : 0), r.range(40, 80));
      stalks.push(f.stalk);
      sets[r.pick([0, 1, 1, 2])].push(...f.leaves);
    }
    // the shade inside the crown, under the fronds
    const blobs = stalks.slice(0, 40).map((st) => [st[3][0], st[3][1] + 10, r.range(30, 52)]);
    p.group(L, boxOf(blobs.map(([x, y]) => [x, y]), 60), (c) => {
      c.fillStyle = 'rgba(35,90,60,0.88)'; c.beginPath();
      for (const [x, y, rr] of blobs) { c.moveTo(x + rr, y); c.ellipse(x, y, rr, rr * 0.8, 0, 0, Math.PI * 2); }
      c.fill();
    }, { t: gr.t + 0.4, d: 0.8, reveal: 'fade' });
    p.strokes(L, stalks, '#3a4a28', 1.5, { t: gr.t + 0.5, d: 0.4, reveal: 'fade' });
    // the leaflets, in small batches from the top down, so few are drawn at once
    [GREEN_D, GREEN, GREEN_L].forEach((col, i) => {
      const list = sets[i].sort((a, b) => a[0][1] - b[0][1]);
      const n = 4, per = Math.ceil(list.length / n);
      for (let k = 0; k < n; k++) {
        const part = list.slice(k * per, (k + 1) * per);
        if (part.length) p.strokes(L, part, col, 4.5, { t: gr.t + 0.6 + i * 0.35 + k * 0.08, d: 0.35, reveal: 'fade' });
      }
    });
  });
}

// ================================================================ what moves
function live(p, r) {
  // the post office clock
  p.live('live', {
    t: 9.8, d: 0.6, reveal: 'fade', box: { x: PC - 40, y: 852, w: 80, h: 80 },
    draw: (c, time) => {
      const m = (time * 6) % 60, h = 4 + m / 60;
      c.strokeStyle = BLACK; c.lineCap = 'round';
      c.lineWidth = 4; c.beginPath(); c.moveTo(PC, 892); c.lineTo(PC + Math.sin(h / 12 * Math.PI * 2) * 18, 892 - Math.cos(h / 12 * Math.PI * 2) * 18); c.stroke();
      c.lineWidth = 2.5; c.beginPath(); c.moveTo(PC, 892); c.lineTo(PC + Math.sin(m / 60 * Math.PI * 2) * 28, 892 - Math.cos(m / 60 * Math.PI * 2) * 28); c.stroke();
      c.fillStyle = RED; c.beginPath(); c.arc(PC, 892, 3, 0, Math.PI * 2); c.fill();
    },
  });
  // tamarind leaflets drifting down
  const fall = [];
  for (let i = 0; i < 18; i++) fall.push([r.range(X0, X1), r() * 1000, r.range(40, 80), r() * 6, r.pick([GREEN_L, YEL, GREEN])]);
  p.live('live', {
    t: 10.0, d: 0.8, reveal: 'fade', box: { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 },
    draw: (c, time) => {
      for (const [x0, ph, v, w, col] of fall) {
        const y = Y0 + ((ph + time * v) % (Y1 - Y0)), x = x0 + Math.sin(time * 1.2 + w) * 30, a = Math.sin(time * 2 + w) * 1.2;
        c.fillStyle = col; c.save(); c.translate(x, y); c.rotate(a); c.fillRect(-5, -2, 10, 4); c.restore();
      }
    },
  });
  // pigeons wheeling about the spires
  const birds = [];
  for (let i = 0; i < 7; i++) birds.push([r.range(0.35, 0.6), r() * 6, r.range(90, 200), r.range(-40, 40)]);
  p.live('live', {
    t: 10.2, d: 0.8, reveal: 'fade', box: { x: 250, y: 380, w: 760, h: 380 },
    draw: (c, time) => {
      c.strokeStyle = BLACK; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath();
      for (const [sp, ph, rad, dy] of birds) {
        const a = time * sp + ph, x = 640 + Math.cos(a) * rad * 1.6, y = 560 + dy + Math.sin(a) * rad * 0.5, f = Math.sin(time * 9 + ph) * 4;
        c.moveTo(x - 10, y - 2 - f); c.quadraticCurveTo(x - 4, y - 4, x, y); c.quadraticCurveTo(x + 4, y - 4, x + 10, y - 2 - f);
      }
      c.stroke();
    },
  });
}

// ================================================================ the cover lines
function coverLines(p) {
  // a magenta panel with a line in script
  p.group('cover', { x: X0 + 20, y: 1560, w: 520, h: 210 }, (c) => {
    c.fillStyle = BLACK; c.fillRect(X0 + 36, 1586, 470, 170);
    c.fillStyle = MAG; c.fillRect(X0 + 26, 1576, 470, 170);
  }, { t: 11.4, d: 0.5, reveal: 'wipe' });
  p.group('cover', { x: X0 + 30, y: 1580, w: 470, h: 170 }, (c) => {
    c.font = `400 76px ${SCRIPT}`; c.textAlign = 'left'; c.fillStyle = CREAM;
    c.fillText(LINE1, X0 + 56, 1652); c.fillStyle = YEL; c.fillText(LINE2, X0 + 150, 1726);
  }, { t: 11.7, d: 0.7, reveal: 'wipe' });
  // the starburst
  const bx = 920, by = 560;
  p.mark('cover', {
    t: 12.2, d: 0.6, reveal: 'pop', box: { x: bx - 130, y: by - 130, w: 260, h: 260 },
    draw: (c) => {
      const star = (rr, col, dx = 0) => { c.fillStyle = col; c.beginPath(); for (let k = 0; k < 36; k++) { const a = (k / 36) * Math.PI * 2, q = k % 2 ? rr * 0.8 : rr; c.lineTo(bx + dx + Math.cos(a) * q, by + dx + Math.sin(a) * q); } c.closePath(); c.fill(); };
      star(118, BLACK, 6); star(118, YEL);
      c.save(); c.translate(bx, by); c.rotate(-0.18);
      c.fillStyle = BLACK; c.textAlign = 'center'; c.font = `700 46px ${SANS}`; c.fillText(BURST1, 0, -6);
      c.fillStyle = RED; c.font = `700 40px ${SANS}`; c.fillText(BURST2, 0, 40);
      c.restore();
    },
  });
}

// ================================================================ the nameplate and the band
function nameplate(p) {
  // Sài Gòn in script: the shadow plate first, then the red, wiped on as one word
  const draw = (col, dx) => (c) => { c.font = `400 262px ${SCRIPT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = col; c.fillText(NAME, 76 + dx, 300 + dx * 0.7); };
  p.group('frame', { x: 56, y: 70, w: 1060, h: 300 }, draw(BLACK, 9), { t: 10.4, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  p.group('frame', { x: 56, y: 70, w: 1060, h: 300 }, (c) => { draw(RED, 0)(c); c.save(); c.beginPath(); c.rect(60, 70, 1050, 150); c.clip(); draw('rgba(255,170,120,0.5)', 0)(c); c.restore(); }, { t: 10.6, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // the issue box
  p.group('frame', { x: 1180, y: 110, w: 370, h: 230 }, (c) => {
    c.fillStyle = BLACK; c.fillRect(1196, 132, 344, 200);
    c.fillStyle = CYAN; c.fillRect(1186, 122, 344, 200);
    c.fillStyle = PAPER; c.fillRect(1200, 246, 316, 62);
  }, { t: 11.0, d: 0.5, reveal: 'fall' });
  p.type('frame', ISSUE, 1358, 226, { size: 104, family: SANS, weight: 700, color: PAPER, align: 'center', track: 0.04, t: 11.3, gap: 0.08, d: 0.5, reveal: 'press' });
  p.type('frame', PRICE, 1358, 290, { size: 40, family: SANS, weight: 500, color: BLACK, align: 'center', track: 0.12, t: 11.7, gap: 0.03, d: 0.4, reveal: 'fade' });
  // the black band and the city's name
  p.group('frame', { x: X0, y: Y1 + 10, w: X1 - X0, h: 160 }, (c) => { c.fillStyle = BLACK; c.fillRect(X0, Y1 + 20, X1 - X0, 140); c.fillStyle = YEL; c.fillRect(X0, Y1 + 20, X1 - X0, 6); }, { t: 9.8, d: 0.6, reveal: 'wipe' });
  p.type('frame', BAND, W / 2, 1945, { size: 108, family: SANS, weight: 700, color: PAPER, align: 'center', track: 0.16, t: 12.4, gap: 0.07, d: 0.5, reveal: 'press' });
}
