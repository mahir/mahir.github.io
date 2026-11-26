// Havana: a Cuban silkscreen film poster in five inks on cream. The sea breaks
// over the Malecón wall, where a fisherman sits with his line; two 1950s cars
// cruise the boulevard in front of a row of pastel arcades with louvered
// shutters and iron balconies; the Capitolio's dome rises behind them, royal
// palms and the Morro lighthouse to one side, all under a dot-screen sky. The
// inks overprint and slip out of register a little; the name is set fat.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, rng, hex, rgb } from '../kit.js';

const CREAM = '#f0e3c5';
const YEL = '#f5c22f', ORA = '#ee7b2a', PINK = '#e8437b', TURQ = '#139ea4', BLK = '#211c24';
// two inks printed over each other
const mul = (a, b) => { const x = hex(a), y = hex(b); return rgb(x.map((v, i) => (v * y[i]) / 255)); };
const tint = (a, k) => { const x = hex(a), p = hex(CREAM); return rgb(x.map((v, i) => lerp(p[i], v, k))); };
const PINK_T = tint(PINK, 0.45), TURQ_T = tint(TURQ, 0.42), YEL_T = tint(YEL, 0.6), ORA_T = tint(ORA, 0.5);
const DEEP = mul(TURQ, TURQ), PLUM = mul(PINK, TURQ), RUST = mul(ORA, PINK);

export const city = {
  id: 'havana', name: 'Havana', wall: '#2a1a24',
  alt: 'A Cuban silkscreen film poster in pink, orange, turquoise, yellow and black: waves breaking over the Malecón sea wall where a fisherman sits, two 1950s cars on the boulevard in front of pastel arcades with louvered shutters and balconies, the dome of the Capitolio behind, royal palms and the Morro lighthouse under a dot-screen sky',
  google: 'family=Chango',
  fonts: [['400 200px "Chango"', 'LA HABANA'], ['400 30px "Chango"', 'MALECÓN · CENTRO · CAPITOLIO']],
  build,
};

const M = 56; // the cream margin
const ROAD0 = 1356, ROAD1 = 1496, WALLTOP = 1540, WALLFOOT = 1620;

function build() {
  const p = new Plate({ paper: CREAM, seed: 1959 });
  const r = p.r;
  p.clip = { x: M, y: M, w: W - 2 * M, h: H - 2 * M - 60 };
  p.stack('sky', 'far', 'dome', 'houses', 'detail', 'road', 'cars', 'wall', 'sea', 'spray', 'title');
  p.layer('title', { clip: false });

  sky(p, r);
  far(p, r);
  dome(p, r);
  houses(p, r);
  road(p, r);
  cars(p, r);
  wall(p, r);
  sea(p, r);
  spray(p, r);
  title(p, r);
  return p;
}

function path(c, pts, close) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}
// a dot screen: dots on a 45-degree grid, sized by f(x, y) in 0..1
function screen(x0, y0, x1, y1, step, f) {
  const dots = [];
  for (let j = 0, y = y0; y < y1; y += step * 0.7071, j++) for (let x = x0 + (j % 2) * step * 0.5; x < x1; x += step) {
    const k = f(x, y); if (k > 0.04) dots.push([x, y, (step * 0.56) * Math.sqrt(k)]);
  }
  return dots;
}
function dotsPath(c, dots) { c.beginPath(); for (const [x, y, s] of dots) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); } }

// ================================================================ the sky: yellow, a screen of orange, pink low down
function sky(p, r) {
  const y0 = M, y1 = 1100;
  const orange = screen(M, 520, W - M, y1, 15, (x, y) => clamp((y - 560) / 480) ** 1.2);
  const pinkd = screen(M, 820, W - M, y1, 15, (x, y) => clamp((y - 860) / 240) * 0.8);
  p.group('sky', { x: M, y: y0, w: W - 2 * M, h: y1 - y0 }, (c) => {
    c.fillStyle = YEL; c.fillRect(M, y0, W - 2 * M, y1 - y0);
  }, { t: 0.2, d: 0.9, reveal: 'fall', ease: 'inOut' });
  p.group('sky', { x: M, y: 500, w: W - 2 * M, h: y1 - 500 }, (c) => {
    c.fillStyle = ORA; dotsPath(c, orange); c.fill();
  }, { t: 0.8, d: 1.2, reveal: 'fall', ease: 'inOut' });
  p.group('sky', { x: M, y: 800, w: W - 2 * M, h: y1 - 800 }, (c) => {
    c.fillStyle = RUST; dotsPath(c, pinkd); c.fill();
  }, { t: 1.3, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // a flat cream cloud bank, printed as paper left bare
  const clouds = [[180, 640, 300], [1120, 560, 360], [700, 720, 220]];
  p.group('sky', { x: M, y: 480, w: W - 2 * M, h: 300 }, (c) => {
    c.fillStyle = CREAM;
    for (const [x, y, w] of clouds) {
      c.beginPath(); c.roundRect(x, y, w, 22, 11); c.fill();
      c.beginPath(); c.roundRect(x + w * 0.2, y - 18, w * 0.5, 22, 11); c.fill();
      c.beginPath(); c.roundRect(x - w * 0.15, y + 28, w * 0.6, 14, 7); c.fill();
    }
  }, { t: 1.6, d: 0.8, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ the Morro lighthouse and royal palms, to the left
function palm(c, x, y, h, col) {
  // a royal palm: a smooth trunk swelling at the foot, a green crownshaft, a ball of fronds
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x - 9, y); c.quadraticCurveTo(x - 6, y - h * 0.5, x - 5, y - h); c.lineTo(x + 5, y - h); c.quadraticCurveTo(x + 6, y - h * 0.5, x + 12, y); c.closePath(); c.fill();
  c.fillRect(x - 6, y - h - 40, 12, 42);
  c.lineCap = 'round';
  for (let k = 0; k < 11; k++) {
    const a = -Math.PI / 2 + (k - 5) * 0.32, L = 110 - Math.abs(k - 5) * 8;
    const ex = x + Math.cos(a) * L, ey = y - h - 40 + Math.sin(a) * L * 0.75;
    const droop = Math.abs(k - 5) * 9;
    c.strokeStyle = col; c.lineWidth = 7;
    c.beginPath(); c.moveTo(x, y - h - 40); c.quadraticCurveTo((x + ex) / 2, ey - 26, ex, ey + droop); c.stroke();
    // leaflets: a fringe of short strokes
    c.lineWidth = 2.4; c.beginPath();
    for (let t = 0.3; t < 1; t += 0.08) {
      const px = lerp(x, ex, t), py = lerp(y - h - 40, ey + droop, t) - 26 * 4 * t * (1 - t) * 0.5;
      c.moveTo(px, py); c.lineTo(px + 6, py + 16); c.moveTo(px, py); c.lineTo(px - 6, py + 16);
    }
    c.stroke();
  }
}
function far(p, r) {
  // the lighthouse on its rock
  const lx = 190, rock = 930;
  p.group('far', { x: M, y: 560, w: 330, h: 420 }, (c) => {
    c.fillStyle = PLUM; poly(c, [[M, rock + 40], [M, rock - 20], [120, rock - 40], [240, rock - 30], [330, rock + 10], [370, rock + 40]]); c.fill();
    // the castle's walls
    c.fillStyle = mul(ORA, TURQ); poly(c, [[90, rock - 30], [300, rock - 24], [300, rock - 60], [90, rock - 70]]); c.fill();
    c.fillStyle = BLK; for (let x = 96; x < 296; x += 18) c.fillRect(x, rock - 80 + (x - 90) * 0.05, 10, 10);
    // the tower, tapering, with its gallery and lantern
    c.fillStyle = CREAM; poly(c, [[lx - 22, rock - 60], [lx + 22, rock - 60], [lx + 14, rock - 300], [lx - 14, rock - 300]]); c.fill();
    c.fillStyle = PINK_T; poly(c, [[lx + 4, rock - 60], [lx + 22, rock - 60], [lx + 14, rock - 300], [lx + 2, rock - 300]]); c.fill();
    c.fillStyle = BLK; c.fillRect(lx - 24, rock - 308, 48, 8); c.fillRect(lx - 14, rock - 346, 28, 6);
    c.fillStyle = YEL; c.fillRect(lx - 11, rock - 340, 22, 32);
    c.strokeStyle = BLK; c.lineWidth = 2; c.beginPath(); for (let k = -8; k <= 8; k += 8) { c.moveTo(lx + k, rock - 340); c.lineTo(lx + k, rock - 308); } c.stroke();
    c.fillStyle = BLK; c.beginPath(); c.moveTo(lx - 16, rock - 346); c.quadraticCurveTo(lx, rock - 372, lx + 16, rock - 346); c.fill();
    c.fillRect(lx - 1.5, rock - 386, 3, 20);
    for (let k = 0; k < 3; k++) c.fillRect(lx - 3, rock - 250 + k * 60, 6, 14);
  }, { t: 2.0, d: 1.1, reveal: 'rise' });
  // royal palms
  p.group('far', { x: 230, y: 520, w: 380, h: 480 }, (c) => {
    palm(c, 330, 1000, 300, BLK);
    palm(c, 470, 1000, 250, mul(TURQ, ORA));
    palm(c, 400, 1000, 210, BLK);
  }, { t: 2.6, d: 1.2, reveal: 'rise' });
}

// ================================================================ the Capitolio's dome
function dome(p, r) {
  const cx = 1080, base = 770, hw = 122, top = 590;
  const domePts = [];
  for (let i = 0; i <= 40; i++) { const a = Math.PI * (1 + i / 40); domePts.push([cx + Math.cos(a) * hw, base + Math.sin(a) * (base - top) * (1 - 0.12 * Math.sin(i / 40 * Math.PI) ** 8)]); }
  const shade = screen(cx - hw, top, cx + hw, base, 9, (x, y) => clamp((x - cx + 30) / (hw + 10)) * 0.9);
  // the wings and portico far behind, then the drum, the dome, the lantern
  p.group('dome', { x: cx - 420, y: 860, w: 840, h: 200 }, (c) => {
    c.fillStyle = PINK_T; c.fillRect(cx - 410, 920, 820, 140);
    c.fillStyle = BLK; for (let x = cx - 400; x < cx + 400; x += 20) c.fillRect(x, 940, 8, 50);
    c.fillStyle = CREAM; poly(c, [[cx - 120, 920], [cx + 120, 920], [cx, 868]]); c.fill();
    c.fillStyle = PINK; c.fillRect(cx - 410, 912, 820, 10);
  }, { t: 2.6, d: 0.9, reveal: 'rise' });
  p.group('dome', { x: cx - 180, y: 760, w: 360, h: 180 }, (c) => {
    // the lower drum: a ring of columns
    c.fillStyle = CREAM; c.fillRect(cx - 160, 840, 320, 90);
    c.fillStyle = PLUM; for (let k = 0; k < 15; k++) { const x = cx - 150 + k * 21.4; c.fillRect(x, 852, 9, 70); }
    c.fillStyle = PINK; c.fillRect(cx - 170, 830, 340, 14); c.fillRect(cx - 166, 924, 332, 10);
    // the upper drum with its windows
    c.fillStyle = CREAM; c.fillRect(cx - 128, 770, 256, 62);
    c.fillStyle = BLK; for (let k = 0; k < 9; k++) { const x = cx - 112 + k * 28; c.fillRect(x, 784, 12, 32); }
    c.fillStyle = PINK; c.fillRect(cx - 134, 764, 268, 10);
  }, { t: 3.0, d: 1.0, reveal: 'rise' });
  p.group('dome', { x: cx - hw - 10, y: 480, w: 2 * hw + 20, h: 300 }, (c) => {
    c.fillStyle = TURQ_T; path(c, domePts, true); c.fill();
    c.save(); path(c, domePts, true); c.clip();
    c.fillStyle = TURQ; dotsPath(c, shade); c.fill();
    // the ribs
    c.strokeStyle = DEEP; c.lineWidth = 3; c.beginPath();
    for (let k = 1; k < 8; k++) { const x = cx - hw + (k / 8) * 2 * hw; c.moveTo(x, base); c.quadraticCurveTo(lerp(x, cx, 0.35), top + 20, cx, top); }
    c.stroke();
    c.restore();
    // the lantern: a little temple, and its cap
    c.fillStyle = CREAM; c.fillRect(cx - 26, top - 56, 52, 58);
    c.fillStyle = BLK; for (let k = 0; k < 5; k++) c.fillRect(cx - 22 + k * 10, top - 48, 5, 42);
    c.fillStyle = PINK; c.fillRect(cx - 32, top - 62, 64, 8); c.fillRect(cx - 30, top - 4, 60, 6);
    c.fillStyle = TURQ; c.beginPath(); c.moveTo(cx - 26, top - 62); c.quadraticCurveTo(cx, top - 100, cx + 26, top - 62); c.fill();
    c.fillStyle = BLK; c.fillRect(cx - 2, top - 118, 4, 22); c.beginPath(); c.arc(cx, top - 120, 5, 0, Math.PI * 2); c.fill();
  }, { t: 3.4, d: 1.3, reveal: 'rise', ease: 'out' });
}

// ================================================================ the arcades: a row of pastel houses
function houses(p, r) {
  const fills = [PINK_T, TURQ_T, YEL_T, ORA_T, CREAM, TURQ_T, PINK_T, YEL_T];
  const list = [];
  let x = M - 10, i = 0;
  while (x < W - M) {
    const w = r.range(190, 260);
    const near = x + w / 2 > 860 && x + w / 2 < 1300;
    const floors = near ? 2 : r.int(2, 3);
    const top = ROAD0 - 128 - floors * 122 - r.range(0, 30);
    list.push({ x, w, top, floors, col: fills[i % fills.length], deco: r.int(0, 2), seed: r.int(1, 1e6) });
    x += w; i++;
  }
  list.forEach((hs, k) => {
    const { x, w, top, col } = hs;
    const rr = rng(hs.seed);
    const dark = mul(col, col === CREAM ? YEL_T : col);
    const arcTop = ROAD0 - 128;
    const box = { x: x - 4, y: top - 60, w: w + 8, h: ROAD0 - top + 64 };
    // weathering: patches of dots where the paint has gone
    const patches = [];
    for (let n = 0; n < 3; n++) { const px = x + rr.range(10, w - 60), py = rr.range(top + 20, arcTop - 50); patches.push(...screen(px, py, px + rr.range(40, 90), py + rr.range(30, 70), 7, () => rr.range(0.2, 0.6))); }
    p.group('houses', box, (c) => {
      c.fillStyle = col; c.fillRect(x, top, w, ROAD0 - top);
      c.fillStyle = dark; dotsPath(c, patches); c.fill();
      // the parapet: plain, balustered, or a curved pediment
      c.fillStyle = dark; c.fillRect(x - 3, top - 6, w + 6, 14);
      if (hs.deco === 1) { c.fillStyle = col; c.fillRect(x, top - 40, w, 34); c.fillStyle = dark; for (let bx = x + 10; bx < x + w - 10; bx += 14) c.fillRect(bx, top - 34, 6, 28); c.fillRect(x - 3, top - 46, w + 6, 8); }
      if (hs.deco === 2) { c.fillStyle = col; c.beginPath(); c.moveTo(x + w * 0.2, top); c.quadraticCurveTo(x + w / 2, top - 70, x + w * 0.8, top); c.fill(); c.strokeStyle = dark; c.lineWidth = 6; c.stroke(); }
      // the arcade: columns, round arches, the dark loggia behind
      const bays = Math.max(2, Math.round(w / 80)), bw = w / bays;
      c.fillStyle = mul(col, PLUM);
      for (let b = 0; b < bays; b++) {
        const ax = x + b * bw + 12, aw = bw - 24;
        c.beginPath(); c.moveTo(ax, ROAD0); c.lineTo(ax, arcTop + aw / 2 + 12); c.arc(ax + aw / 2, arcTop + aw / 2 + 12, aw / 2, Math.PI, 0); c.lineTo(ax + aw, ROAD0); c.fill();
      }
      c.fillStyle = dark; c.fillRect(x, arcTop - 4, w, 12);
      for (let b = 0; b <= bays; b++) c.fillRect(x + b * bw - 5, ROAD0 - 14, 10, 14);
    }, { t: 3.8 + k * 0.28, d: 1.0, reveal: 'rise', ease: 'out' });
    // windows: tall, with louvered shutters, balconies on iron brackets
    const wins = [];
    const nw = Math.max(2, Math.round(w / 82));
    for (let f = 0; f < hs.floors; f++) {
      const wy = arcTop - 112 - f * 122;
      for (let b = 0; b < nw; b++) wins.push([x + (b + 0.5) * w / nw - 20, wy, 40, 86, rr.chance(0.35), rr.chance(0.6)]);
    }
    const sh = col === TURQ_T ? TURQ : col === PINK_T ? PINK : col === YEL_T ? ORA : col === ORA_T ? ORA : TURQ;
    p.group('detail', box, (c) => {
      for (const [wx, wy, ww, wh, open, bal] of wins) {
        c.fillStyle = dark; c.fillRect(wx - 6, wy - 14, ww + 12, 8);
        if (open) {
          c.fillStyle = BLK; c.fillRect(wx, wy, ww, wh);
          c.fillStyle = sh; c.fillRect(wx - 12, wy, 12, wh); c.fillRect(wx + ww, wy, 12, wh);
        } else {
          c.fillStyle = sh; c.fillRect(wx, wy, ww, wh);
          c.fillStyle = mul(sh, sh); for (let ly = wy + 5; ly < wy + wh - 3; ly += 7) c.fillRect(wx + 2, ly, ww - 4, 3);
          c.fillRect(wx + ww / 2 - 1, wy, 2, wh);
        }
        if (bal) {
          c.fillStyle = BLK; c.fillRect(wx - 14, wy + wh - 4, ww + 28, 5);
          c.fillRect(wx - 14, wy + wh - 34, ww + 28, 3);
          for (let bx = wx - 12; bx <= wx + ww + 12; bx += 6) c.fillRect(bx, wy + wh - 34, 1.6, 30);
          c.beginPath(); c.arc(wx - 2, wy + wh + 1, 7, 0, Math.PI); c.arc(wx + ww + 2, wy + wh + 1, 7, 0, Math.PI); c.lineWidth = 2; c.strokeStyle = BLK; c.stroke();
        }
      }
    }, { t: 4.6 + k * 0.24, d: 0.8, reveal: 'fade' });
  });
}

// ================================================================ the boulevard and its lamps
function road(p, r) {
  p.group('road', { x: M, y: ROAD0 - 4, w: W - 2 * M, h: WALLTOP - ROAD0 + 10 }, (c) => {
    c.fillStyle = mul(TURQ_T, PINK); c.fillRect(M, ROAD0, W - 2 * M, ROAD1 - ROAD0);
    c.fillStyle = CREAM; for (let x = M + 20; x < W - M; x += 90) c.fillRect(x, (ROAD0 + ROAD1) / 2 + 12, 46, 5);
    // the promenade on the sea side
    c.fillStyle = YEL_T; c.fillRect(M, ROAD1, W - 2 * M, WALLTOP - ROAD1);
    c.fillStyle = BLK; c.fillRect(M, ROAD1, W - 2 * M, 5);
  }, { t: 6.2, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // street lamps along the promenade
  const lamps = [300, 760, 1220];
  p.group('road', { x: M, y: 1180, w: W - 2 * M, h: 340 }, (c) => {
    for (const x of lamps) {
      c.fillStyle = BLK; c.fillRect(x - 3, 1230, 6, ROAD1 + 20 - 1230); c.fillRect(x - 9, ROAD1 + 10, 18, 12);
      c.fillRect(x - 30, 1232, 60, 4);
      for (const s of [-1, 1]) { c.fillStyle = CREAM; c.beginPath(); c.arc(x + s * 30, 1222, 11, 0, Math.PI * 2); c.fill(); c.fillStyle = BLK; c.fillRect(x + s * 30 - 7, 1208, 14, 4); }
    }
  }, { t: 6.6, d: 0.6, reveal: 'rise' });
}

// ================================================================ two 1950s cars
function car(c, o) {
  // facing right; (0, 0) is under the middle of the car, on the road
  const { body, roof, trim } = o;
  // the body: a long low shape with a tail fin at the back
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(-230, -34); c.lineTo(-236, -70); c.lineTo(-222, -104); c.lineTo(-150, -92); c.lineTo(-96, -96);
  c.lineTo(-70, -150); c.lineTo(70, -150); c.lineTo(110, -100); c.lineTo(214, -94); c.quadraticCurveTo(236, -90, 236, -62); c.lineTo(232, -34); c.closePath(); c.fill();
  // the two-tone roof and the side spear
  c.fillStyle = roof; poly(c, [[-70, -150], [70, -150], [96, -114], [-88, -114]]); c.fill();
  c.fillStyle = roof; poly(c, [[-210, -76], [40, -84], [160, -72], [40, -68], [-200, -62]]); c.fill();
  // the windows
  c.fillStyle = BLK; poly(c, [[-60, -142], [-6, -142], [-6, -108], [-78, -108]]); c.fill(); poly(c, [[2, -142], [62, -142], [90, -108], [2, -108]]); c.fill();
  c.fillStyle = trim; poly(c, [[20, -140], [34, -140], [16, -110], [6, -110]]); c.fill();
  // the chrome: bumpers, a strip, the grille
  c.fillStyle = CREAM; c.fillRect(-244, -48, 30, 12); c.fillRect(216, -50, 30, 12); c.fillRect(-200, -90, 340, 3);
  c.fillStyle = YEL; c.beginPath(); c.arc(228, -76, 7, 0, Math.PI * 2); c.fill();
  c.fillStyle = PINK; c.fillRect(-236, -96, 8, 14);
  // the wheels with whitewalls, the shadow under the car
  c.fillStyle = BLK; c.fillRect(-210, -8, 420, 8);
  for (const wx of [-142, 140]) {
    c.fillStyle = BLK; c.beginPath(); c.arc(wx, -28, 30, 0, Math.PI * 2); c.fill();
    c.fillStyle = CREAM; c.beginPath(); c.arc(wx, -28, 19, 0, Math.PI * 2); c.fill();
    c.fillStyle = trim; c.beginPath(); c.arc(wx, -28, 11, 0, Math.PI * 2); c.fill();
    // the wheel arch skirt
    c.fillStyle = body; c.beginPath(); c.arc(wx, -28, 34, Math.PI * 1.12, Math.PI * 1.88); c.lineTo(wx + 30, -66); c.lineTo(wx - 30, -66); c.fill();
  }
  // a driver
  c.fillStyle = trim; c.beginPath(); c.arc(30, -124, 10, 0, Math.PI * 2); c.fill(); c.fillRect(20, -116, 22, 10);
}
function cars(p, r) {
  const a = { body: TURQ, roof: CREAM, trim: PINK }, b = { body: PINK, roof: YEL_T, trim: TURQ };
  p.mark('cars', { t: 8.0, d: 1.6, reveal: 'slide', dx: -520, ease: 'out', box: { x: 300, y: 1240, w: 700, h: 260 },
    draw: (c) => { c.save(); c.translate(560, ROAD1 - 8); c.scale(0.95, 0.95); car(c, a); c.restore(); } });
  p.mark('cars', { t: 8.5, d: 1.6, reveal: 'slide', dx: 520, ease: 'out', box: { x: 900, y: 1220, w: 700, h: 260 },
    draw: (c) => { c.save(); c.translate(1230, ROAD1 - 52); c.scale(-0.82, 0.82); car(c, b); c.restore(); } });
}

// ================================================================ the sea wall, the fisherman, people sitting
function wall(p, r) {
  p.group('wall', { x: M, y: WALLTOP - 6, w: W - 2 * M, h: WALLFOOT - WALLTOP + 20 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(M, WALLTOP, W - 2 * M, WALLFOOT - WALLTOP);
    c.fillStyle = ORA_T; c.fillRect(M, WALLTOP + 22, W - 2 * M, WALLFOOT - WALLTOP - 22);
    c.fillStyle = BLK; c.fillRect(M, WALLTOP, W - 2 * M, 4); c.fillRect(M, WALLTOP + 20, W - 2 * M, 3);
    // stains running down it
    c.fillStyle = mul(ORA_T, ORA_T); for (let x = M + 30; x < W - M; x += 44) c.fillRect(x, WALLTOP + 24, 6, 20 + (x * 7) % 34);
  }, { t: 6.9, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // the fisherman on the wall, his rod and line; a couple further on
  const fx = 1120;
  p.group('wall', { x: fx - 60, y: 1380, w: 260, h: 320 }, (c) => {
    c.fillStyle = BLK;
    c.beginPath(); c.arc(fx, WALLTOP - 72, 12, 0, Math.PI * 2); c.fill();
    c.fillStyle = YEL; c.beginPath(); c.ellipse(fx, WALLTOP - 82, 22, 6, 0, 0, Math.PI * 2); c.fill(); c.fillRect(fx - 10, WALLTOP - 96, 20, 14);
    c.fillStyle = TURQ; poly(c, [[fx - 16, WALLTOP - 58], [fx + 14, WALLTOP - 58], [fx + 18, WALLTOP - 6], [fx - 18, WALLTOP - 6]]); c.fill();
    c.fillStyle = BLK; poly(c, [[fx - 6, WALLTOP - 8], [fx + 28, WALLTOP - 8], [fx + 30, WALLTOP + 40], [fx + 20, WALLTOP + 40], [fx + 16, WALLTOP + 4], [fx - 6, WALLTOP + 4]]); c.fill();
    c.strokeStyle = BLK; c.lineWidth = 3; c.beginPath(); c.moveTo(fx + 10, WALLTOP - 36); c.lineTo(fx + 150, WALLTOP - 120); c.stroke();
    c.lineWidth = 1.2; c.beginPath(); c.moveTo(fx + 150, WALLTOP - 120); c.quadraticCurveTo(fx + 168, WALLTOP, fx + 164, WALLFOOT + 40); c.stroke();
  }, { t: 9.4, d: 0.6, reveal: 'drop' });
  const walkers = [[420, PINK, 1], [520, BLK, -1], [880, TURQ, 1], [1500, ORA, -1]];
  p.group('wall', { x: M, y: 1400, w: W - 2 * M, h: 140 }, (c) => {
    for (const [x, col, d] of walkers) {
      const y = WALLTOP - 4;
      c.fillStyle = BLK; c.beginPath(); c.arc(x, y - 92, 11, 0, Math.PI * 2); c.fill();
      c.fillStyle = col; poly(c, [[x - 13, y - 80], [x + 13, y - 80], [x + 15, y - 36], [x - 15, y - 36]]); c.fill();
      c.fillStyle = BLK; poly(c, [[x - 10, y - 36], [x - 2, y - 36], [x - 10 * d, y], [x - 16 * d, y]]); c.fill(); poly(c, [[x + 2, y - 36], [x + 10, y - 36], [x + 16 * d, y], [x + 10 * d, y]]); c.fill();
    }
  }, { t: 9.2, d: 0.6, reveal: 'fade' });
  const cx = 1380;
  p.group('wall', { x: cx - 50, y: 1440, w: 120, h: 120 }, (c) => {
    for (const [dx, col, skirt] of [[0, PINK, true], [34, BLK, false]]) {
      const x = cx + dx;
      c.fillStyle = BLK; c.beginPath(); c.arc(x, WALLTOP - 66, 11, 0, Math.PI * 2); c.fill();
      c.fillStyle = col; poly(c, [[x - 13, WALLTOP - 54], [x + 13, WALLTOP - 54], [x + (skirt ? 20 : 15), WALLTOP - 4], [x - (skirt ? 20 : 15), WALLTOP - 4]]); c.fill();
    }
    c.fillStyle = BLK; c.fillRect(cx - 12, WALLTOP, 8, 36); c.fillRect(cx + 26, WALLTOP, 8, 36);
  }, { t: 9.7, d: 0.6, reveal: 'drop' });
}

// ================================================================ the sea: rows of curling waves
function sea(p, r) {
  const y0 = WALLFOOT, y1 = H - M - 60;
  const rows = [];
  for (let k = 0, y = y0 + 10; y < y1 + 40; k++, y += 34 + k * 6) {
    const amp = 8 + k * 2.4, len = 90 + k * 22, ph = r() * 6;
    const top = [];
    for (let x = M - 20; x <= W - M + 20; x += 6) {
      const u = ((x / len) + ph) % 1;
      top.push([x, y - amp * Math.sin(u * Math.PI) ** 0.6]);
    }
    rows.push({ top, y, k, len, ph, amp });
  }
  p.group('sea', { x: M, y: y0 - 10, w: W - 2 * M, h: y1 - y0 + 60 }, (c) => {
    c.fillStyle = TURQ; c.fillRect(M, y0, W - 2 * M, y1 - y0 + 60);
  }, { t: 7.0, d: 0.8, reveal: 'fall' });
  rows.forEach((row, i) => {
    const bot = i === rows.length - 1 ? y1 + 80 : row.y + 110;
    const shape = [...row.top, [W - M + 20, bot], [M - 20, bot]];
    const foam = [];
    for (let x = M - 20; x <= W - M + 20; x += row.len) {
      const cx = x - (row.ph % 1) * row.len + row.len * 0.5;
      foam.push([cx, row.y - row.amp, row.len * 0.15]);
    }
    p.group('sea', boxOf(shape, 30), (c) => {
      c.fillStyle = i % 2 ? DEEP : TURQ; path(c, shape, true); c.fill();
      c.strokeStyle = i % 2 ? TURQ_T : CREAM; c.lineWidth = 2 + row.k * 0.3; path(c, row.top.map(([x, y]) => [x + 3, y + 5])); c.stroke();
      // the crests: a curl of cream foam, offset from the turquoise like a slipped screen
      c.fillStyle = CREAM;
      for (const [x, y, s] of foam) {
        c.beginPath(); c.moveTo(x - s, y + s * 0.5); c.quadraticCurveTo(x - s * 0.2, y - s * 0.6, x + s * 0.7, y - s * 0.1);
        c.quadraticCurveTo(x + s * 0.2, y - s * 0.1, x + s * 0.3, y + s * 0.3); c.quadraticCurveTo(x - s * 0.3, y + s * 0.1, x - s, y + s * 0.5); c.fill();
      }
    }, { t: 7.3 + i * 0.2, d: 0.9, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ================================================================ the spray over the wall (it breaks and falls, again and again)
function spray(p, r) {
  const bursts = [[340, 4.6, 0], [860, 5.4, 2.2], [1460, 4.2, 3.6]];
  const blobs = bursts.map(([x, per, ph]) => {
    const list = [];
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + r.range(-1.0, 1.0);
      list.push([x + r.range(-60, 60), a, r.range(50, 190) * (1 - Math.abs(a + Math.PI / 2) * 0.4), r.range(7, 22)]);
    }
    const drops = [];
    for (let i = 0; i < 30; i++) drops.push([x + r.range(-150, 150), r.range(40, 230), r.range(2.5, 6)]);
    return { x, per, ph, list, drops };
  });
  // the static splash, printed once: a cream tongue up the face of the wall
  p.group('spray', { x: M, y: WALLTOP - 20, w: W - 2 * M, h: 140 }, (c) => {
    c.fillStyle = CREAM;
    for (const { x } of blobs) { c.beginPath(); c.ellipse(x, WALLFOOT + 4, 130, 18, 0, Math.PI, 0); c.fill(); for (let k = -3; k <= 3; k++) { c.beginPath(); c.ellipse(x + k * 30, WALLFOOT - 8 - (3 - Math.abs(k)) * 8, 12, 18 + (3 - Math.abs(k)) * 6, 0, 0, Math.PI * 2); c.fill(); } }
  }, { t: 8.8, d: 0.6, reveal: 'rise' });
  p.live('spray', {
    t: 9.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const { per, ph, list, drops } of blobs) {
        const u = ((time + ph) % per) / per; // 0..1 through one breaking wave
        if (u > 0.7) continue;
        const rise = Math.sin((u / 0.7) * Math.PI);
        const fade = u < 0.45 ? 1 : 1 - (u - 0.45) / 0.25;
        c.globalAlpha = Math.max(0, fade);
        c.fillStyle = CREAM;
        c.beginPath();
        for (const [x, a, L, s] of list) {
          const d = L * Math.sqrt(u / 0.7);
          const bx = x + Math.cos(a) * d, by = WALLFOOT - 10 + Math.sin(a) * d * rise * 1.1 + 40 * (u / 0.7) ** 2;
          const rr = s * (0.5 + 0.7 * rise);
          c.moveTo(bx + rr, by); c.arc(bx, by, rr, 0, Math.PI * 2);
        }
        c.fill();
        c.fillStyle = TURQ_T; c.beginPath();
        for (const [x, h, s] of drops) { const by = WALLFOOT - h * rise; c.moveTo(x + s, by); c.arc(x, by, s, 0, Math.PI * 2); }
        c.fill();
      }
      c.globalAlpha = 1;
    },
  });
  // frigate birds wheeling over the sea
  const birds = [];
  for (let i = 0; i < 6; i++) birds.push([r.range(200, 1400), r.range(1140, 1320), r() * 6, r.range(0.9, 1.5)]);
  p.live('spray', {
    t: 10.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = BLK; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
      for (const [x, y, ph, s] of birds) {
        const bx = x + Math.sin(time * 0.15 + ph) * 60, by = y - 520 + Math.sin(time * 0.4 + ph) * 16, f = Math.sin(time * 2 + ph) * 4;
        c.moveTo(bx - 26 * s, by + 4 * s + f); c.lineTo(bx - 10 * s, by - 6 * s - f * 0.5); c.lineTo(bx, by); c.lineTo(bx + 10 * s, by - 6 * s - f * 0.5); c.lineTo(bx + 26 * s, by + 4 * s + f);
      }
      c.stroke();
    },
  });
}

// ================================================================ the name, fat, out of register
function title(p, r) {
  p.type('title', 'LA', 120, 260, { size: 150, family: '"Chango"', color: BLK, shadow: PINK, sx: 9, sy: 7, t: 10.4, gap: 0.18, d: 0.6 });
  p.type('title', 'HABANA', W / 2, 500, { size: 260, family: '"Chango"', color: BLK, shadow: PINK, sx: 11, sy: 9, align: 'center', fit: W - 2 * M - 60, t: 10.8, gap: 0.2, d: 0.7 });
  // a turquoise bar with the places, like a film's credit line
  p.group('title', { x: M, y: H - M - 60, w: W - 2 * M, h: 64 }, (c) => {
    c.fillStyle = BLK; c.fillRect(M, H - M - 56, W - 2 * M, 56);
  }, { t: 12.0, d: 0.6, reveal: 'wipe', ease: 'inOut' });
  p.type('title', 'MALECÓN · CENTRO · CAPITOLIO', W / 2, H - M - 17, { size: 30, family: '"Chango"', color: YEL, align: 'center', track: 0.14, t: 12.4, gap: 0.03, d: 0.3, reveal: 'fade' });
}
