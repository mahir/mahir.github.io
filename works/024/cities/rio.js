// Rio de Janeiro: a mid-century screen print. Copacabana's crescent seen from
// above its near end: the wave pavement sweeping round the bay, sand, surf,
// the white blocks of the Avenida Atlântica, Corcovado with the Redeemer
// against the sun, and Sugarloaf with its cable car. Flat inks, no outlines.

import { Plate, W, H, boxOf } from '../print.js';
import { shade, mix, lerp, clamp, smooth, poly, rng } from '../kit.js';

const INK = '#151819', PAPER = '#f3ecdb', WHITE = '#fbf7ec';
const SKY = '#c4e6dc', SKY_L = '#d9efe6', SUN = '#f5b92a', SUN_L = '#f9d872';
const JADE = '#2b9f7b', EMERALD = '#0c6a4d', DEEP = '#08402f', LEAF = '#63bd8a', MINT = '#9fd4b6';
const SEA = '#1a6aa3', SEA_D = '#0e4c7e', SEA_L = '#3d9fc6', TURQ = '#4fc0b0';
const SAND = '#f2d690', SAND_D = '#e1bb69', ROCK = '#34403e', ROCK_L = '#5a6965';
const LAND = '#e7dcc0', ROAD = '#3a3e3e';
const TITLE = '"Righteous", sans-serif';

export const city = {
  id: 'rio', name: 'Rio de Janeiro', wall: '#0e3a2f',
  alt: "A view over Copacabana's wave-patterned promenade and beach to Sugarloaf Mountain, with Christ the Redeemer on Corcovado against the sun, palms and sailboats",
  google: 'family=Righteous',
  fonts: [['400 100px "Righteous"', 'RIODEJANEIROCOPACABANAPÃOAÇÚCARCORCOVADO·']],
  build,
};

// ---------------------------------------------------------------- projection
// a camera one unit above the ground, looking out level at the horizon
const F = 1100, HY = 860, CX = 800;
const P = (X, Z, h = 0) => [CX + (F * X) / Z, HY + (F * (1 - h)) / Z];
const toWorld = (x, y) => { const Z = F / (y - HY); return [((x - CX) * Z) / F, Z]; };

// the waterline of the crescent, drawn on the sheet from the near end (off the
// right edge) round to Leme, then lifted onto the ground
const SHORE = (() => {
  const A = [1760, 1500], B = [700, 1500], C = [130, 1270], D = [850, 905];
  const pts = [];
  for (let i = 0; i <= 1400; i++) {
    const t = i / 1400, u = 1 - t;
    const x = u * u * u * A[0] + 3 * u * u * t * B[0] + 3 * u * t * t * C[0] + t * t * t * D[0];
    const y = u * u * u * A[1] + 3 * u * u * t * B[1] + 3 * u * t * t * C[1] + t * t * t * D[1];
    pts.push(toWorld(x, y));
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
})();
const LEN = SHORE.len;

// a point on the waterline at arc length L, pushed landward by o
function at(L, o = 0) {
  const { pts, cum } = SHORE;
  L = clamp(L, 0, LEN);
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < L) lo = m; else hi = m; }
  const f = (L - cum[lo]) / (cum[hi] - cum[lo] || 1);
  const a = pts[lo], b = pts[hi];
  const x = lerp(a[0], b[0], f), z = lerp(a[1], b[1], f);
  const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
  // landward is to the left of the direction of travel
  const nx = -tz / tl, nz = tx / tl;
  return [x + nx * o, z + nz * o, tx / tl, tz / tl, nx, nz];
}
const S = (L, o = 0, h = 0) => { const [x, z] = at(L, o); return P(x, z, h); };
const depth = (L, o = 0) => at(L, o)[1];
// arc length steps that stay about the same size on the sheet
const stepAt = (L, px = 6) => clamp((px * depth(L)) / F, 0.004, 0.25);

// a band along the shore between two offsets, as a screen polygon
function band(L0, L1, o0, o1, px = 5) {
  const pts = [];
  for (let L = L0; L < L1; L += stepAt(L, px)) pts.push(S(L, o0));
  pts.push(S(L1, o0));
  const back = [];
  for (let L = L0; L < L1; L += stepAt(L, px)) back.push(S(L, o1));
  back.push(S(L1, o1));
  return pts.concat(back.reverse());
}
// a line along the shore at one offset
function line(L0, L1, o, px = 5, h = 0) {
  const pts = [];
  for (let L = L0; L < L1; L += stepAt(L, px)) pts.push(S(L, o, h));
  pts.push(S(L1, o, h));
  return pts;
}

// the bands, landward from the water
const O = { pave: 0.3, road: 0.64, mid: 0.75, walk: 0.86, b0: 1.04 };

const IX = 64, IY = 64, IW = W - 128, IH = 1800; // the picture
const PEAK = [432, 598]; // Corcovado's summit

function build() {
  const p = new Plate({ paper: PAPER, seed: 1565 });
  const r = p.r;
  p.clip = { x: IX, y: IY, w: IW, h: IH };
  p.stack('sky', 'sun', 'far', 'sea', 'range', 'sugar', 'surf', 'land', 'city', 'beach', 'life', 'palms', 'garden', 'mask', 'title', 'frame');
  p.layer('mask', { clip: false });
  p.layer('title', { clip: false });
  p.layer('frame', { clip: false });

  sky(p, r);
  range(p, r);
  sugarloaf(p, r);
  sea(p, r);
  ground(p, r);
  city_(p, r);
  beach(p, r);
  life(p, r);
  palms(p, r);
  garden(p, r);
  title(p);
  frame(p);
  return sprites(p);
}

// The press redraws a mark every frame while it arrives, and palms, roofs and
// windows are costly to draw. A mark that clips in (rise, fall, wipe) is drawn
// once into a sprite of its box at the sheet's scale and that is laid down
// while it arrives; once it has arrived it is drawn as itself, so the finished
// poster is made by the very same strokes.
const CLIPS = ['rise', 'fall', 'wipe', 'wipeR', 'wipeL'];
function sprites(p) {
  for (const name of p.order) for (const m of p.layers[name].marks) {
    if (!CLIPS.includes(m.reveal) || m.draw.length > 1) continue;
    const draw = m.draw, b = m.box;
    let sp = null;
    m.draw = (c, q) => {
      if (q >= 1) { if (sp) { sp.width = sp.height = 0; sp = null; } return draw(c, q); }
      const cw = c.canvas.width, ch = c.canvas.height;
      if (!sp || sp.cw !== cw) {
        // the box and a little more, as the reveal's clip is, in whole pixels
        const k = cw / W;
        const x0 = Math.max(0, Math.floor((b.x - 8) * k)), y0 = Math.max(0, Math.floor((b.y - 8) * k));
        const x1 = Math.min(cw, Math.ceil((b.x + b.w + 8) * k)), y1 = Math.min(ch, Math.ceil((b.y + b.h + 8) * k));
        if (x1 <= x0 || y1 <= y0) return;
        if (sp) sp.width = sp.height = 0;
        sp = document.createElement('canvas');
        sp.width = x1 - x0; sp.height = y1 - y0; sp.cw = cw; sp.x0 = x0; sp.y0 = y0;
        const s = sp.getContext('2d');
        s.setTransform(k, 0, 0, k, -x0, -y0);
        draw(s, q);
      }
      // clip reveals do not move the mark, so the sprite goes down pixel for pixel
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(sp, sp.x0, sp.y0); c.restore();
    };
  }
  return p;
}

// ---------------------------------------------------------------- sky and sun
function sky(p, r) {
  p.group('sky', { x: 0, y: 0, w: W, h: HY + 40 }, (c) => {
    c.fillStyle = SKY; c.fillRect(0, 0, W, HY + 40);
    // flat steps of paler sky toward the horizon, the way a screen prints a fade
    const steps = [[640, 0.25], [720, 0.5], [790, 0.75]];
    for (const [y, a] of steps) { c.fillStyle = mix(SKY, SKY_L, a); c.fillRect(0, y, W, HY + 40 - y); }
  }, { t: 0.1, d: 1.3, reveal: 'fall', ease: 'inOut' });

  // the sun behind the Redeemer, and its rays
  const [sx, sy] = [PEAK[0], PEAK[1] - 34];
  p.group('sun', { x: sx - 330, y: sy - 330, w: 660, h: 660 }, (c) => {
    c.fillStyle = 'rgba(249,216,114,.45)';
    c.beginPath();
    for (let i = 0; i < 28; i++) {
      const a0 = (i / 28) * Math.PI * 2, a1 = a0 + (Math.PI * 2) / 56;
      c.moveTo(sx, sy); c.arc(sx, sy, 320, a0, a1); c.closePath();
    }
    c.fill();
  }, { t: 1.0, d: 1.6, reveal: 'iris', ease: 'inOut' });
  p.group('sun', { x: sx - 160, y: sy - 160, w: 320, h: 320 }, (c) => {
    c.fillStyle = SUN; c.beginPath(); c.arc(sx, sy, 150, 0, Math.PI * 2); c.fill();
    c.strokeStyle = SUN_L; c.lineWidth = 5;
    for (const rr of [118, 88]) { c.beginPath(); c.arc(sx, sy, rr, 0, Math.PI * 2); c.stroke(); }
  }, { t: 0.6, d: 1.6, reveal: 'rise', ease: 'inOut' });

  // long flat clouds
  const clouds = [[1180, 610, 300, 30], [1330, 560, 160, 22], [110, 470, 190, 22], [640, 690, 220, 18]];
  clouds.forEach(([x, y, w, h], i) => {
    p.group('sky', { x: x - h, y: y - h * 2.2, w: w + 2 * h, h: h * 3.4 }, (c) => {
      c.fillStyle = WHITE;
      c.beginPath(); c.roundRect(x, y - h, w, h, h / 2); c.fill();
      c.beginPath(); c.roundRect(x + w * 0.18, y - h * 2, w * 0.5, h * 1.4, h * 0.7); c.fill();
      c.fillStyle = SKY_L; c.fillRect(x + w * 0.05, y - h * 0.32, w * 0.9, h * 0.12);
    }, { t: 1.6 + i * 0.25, d: 1.2, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });

  // frigatebirds wheeling over the bay
  const birds = [];
  for (let i = 0; i < 6; i++) birds.push({ x: r.range(620, 1250), y: r.range(420, 700), rad: r.range(30, 70), sp: r.range(0.25, 0.45) * (r.chance(0.5) ? 1 : -1), ph: r() * 6, s: r.range(0.8, 1.2) });
  p.live('sky', {
    t: 9.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineCap = 'round'; c.lineJoin = 'round';
      for (const b of birds) {
        const a = time * b.sp + b.ph;
        const x = b.x + Math.cos(a) * b.rad, y = b.y + Math.sin(a) * b.rad * 0.4, s = b.s;
        const fl = Math.sin(time * 2 + b.ph) * 1.6;
        c.lineWidth = 2.2 * s; c.beginPath();
        c.moveTo(x - 16 * s, y - 2 * s + fl); c.lineTo(x - 7 * s, y - 5 * s); c.lineTo(x, y);
        c.lineTo(x + 7 * s, y - 5 * s); c.lineTo(x + 16 * s, y - 2 * s + fl); c.stroke();
      }
    },
  });
}

// ---------------------------------------------------------------- Corcovado and the range
const RIDGE = [[-30, 868], [40, 850], [120, 842], [200, 815], [260, 790], [320, 745], [365, 700], [392, 660], [408, 628], [420, 610], [432, 600], [444, 603], [455, 616], [462, 640], [466, 672], [472, 700], [492, 726], [530, 748], [590, 768], [650, 790], [720, 812], [790, 838], [860, 870], [905, 896], [905, 908], [-30, 908]];

function range(p, r) {
  // far blue ranges: Pedra da Gávea's flat block and the Two Brothers
  const far = [[-30, 820], [40, 790], [70, 712], [92, 700], [196, 698], [214, 716], [236, 744], [262, 724], [284, 706], [302, 722], [318, 748], [350, 772], [380, 800], [-30, 830]];
  p.fill('far', far, mix(MINT, SKY, 0.45), { t: 1.4, d: 1.2, reveal: 'rise' });
  p.group('far', boxOf(far, 2), (c) => {
    c.fillStyle = mix(MINT, SKY, 0.2);
    poly(c, [[70, 712], [92, 700], [196, 698], [214, 716], [150, 760], [80, 760]]); c.fill();
    c.strokeStyle = mix(MINT, SKY, 0.1); c.lineWidth = 2; c.beginPath();
    for (let x = 96; x < 196; x += 9) { c.moveTo(x, 702); c.lineTo(x - 6, 740); }
    c.stroke();
  }, { t: 1.9, d: 0.8, reveal: 'fade' });
  // Niterói's hills, far across the bay
  const nit = [[1380, 868], [1420, 842], [1470, 830], [1520, 846], [1560, 838], [1600, 850], [1600, 870]];
  p.fill('far', nit, mix(MINT, SKY, 0.45), { t: 2.0, d: 1.0, reveal: 'rise' });

  // the range, lit on the left and in shade on the right of each fall
  p.fill('range', RIDGE, JADE, { t: 1.8, d: 1.6, reveal: 'rise', ease: 'inOut' });
  p.group('range', boxOf(RIDGE, 2), (c) => {
    c.save(); poly(c, RIDGE); c.clip();
    c.fillStyle = EMERALD;
    poly(c, [[432, 600], [444, 603], [455, 616], [462, 640], [466, 672], [472, 700], [492, 726], [530, 748], [590, 768], [650, 790], [720, 812], [790, 838], [860, 870], [905, 896], [905, 1000], [560, 1000], [470, 800]]); c.fill();
    poly(c, [[-30, 868], [40, 850], [120, 842], [200, 815], [260, 790], [230, 1000], [-30, 1000]]); c.fill();
    // parallel lines down the slopes, the printer's way of saying a fall
    c.strokeStyle = 'rgba(8,64,47,.45)'; c.lineWidth = 2.2; c.lineCap = 'round';
    c.beginPath();
    for (let k = 1; k < 12; k++) {
      const pts = RIDGE.slice(0, 22).map(([x, y]) => [x + k * 3, y + k * 17]);
      pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    }
    c.stroke();
    c.restore();
  }, { t: 2.4, d: 1.2, reveal: 'fade' });
  // the bare granite of the hump, streaked
  p.group('range', { x: 380, y: 590, w: 110, h: 140 }, (c) => {
    const rock = [[408, 628], [420, 610], [432, 600], [444, 603], [455, 616], [462, 640], [466, 672], [470, 698], [452, 712], [430, 690], [415, 664], [400, 650]];
    c.fillStyle = ROCK_L; poly(c, rock); c.fill();
    c.save(); poly(c, rock); c.clip();
    c.fillStyle = ROCK; poly(c, [[440, 600], [470, 620], [480, 720], [446, 716], [446, 650]]); c.fill();
    c.strokeStyle = 'rgba(251,247,236,.5)'; c.lineWidth = 1.6; c.beginPath();
    for (let x = 402; x < 470; x += 7) { c.moveTo(x, 600); c.quadraticCurveTo(x + 4, 650, x - 2, 720); }
    c.stroke();
    c.restore();
  }, { t: 2.9, d: 0.9, reveal: 'fade' });
  // forest: round crowns over the lower slopes
  const trees = [];
  for (let i = 0; i < 520; i++) {
    const x = r.range(-20, 900), y = r.range(640, 960);
    const top = ridgeY(x);
    if (y < top + 30 || y > 930) continue;
    if (x > 380 && x < 480 && y < 720) continue;
    trees.push([x, y, r.range(4, 8) * (0.6 + (y - 700) / 600), r.pick([LEAF, MINT, DEEP, LEAF, JADE])]);
  }
  trees.sort((a, b) => a[1] - b[1]);
  for (let k = 0; k < 4; k++) {
    const part = trees.filter((_, i) => i % 4 === k);
    p.group('range', boxOf(part.map(([x, y]) => [x, y]), 12), (c) => {
      for (const [x, y, rr, col] of part) { c.fillStyle = col; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill(); }
    }, { t: 3.1 + k * 0.2, d: 0.9, reveal: 'rise' });
  }
  // the hillside houses, a scatter of small bright cubes
  const houses = [];
  for (let i = 0; i < 260; i++) {
    const x = r.range(60, 780), y = r.range(780, 930);
    if (y < ridgeY(x) + 60) continue;
    houses.push([x, y, r.range(5, 9), r.range(4, 7), r.pick([WHITE, WHITE, SUN_L, '#f0c9a0', MINT, '#e8e2cf', SEA_L])]);
  }
  houses.sort((a, b) => a[1] - b[1]);
  p.group('range', boxOf(houses.map(([x, y]) => [x, y]), 14), (c) => {
    for (const [x, y, w, h, col] of houses) {
      c.fillStyle = col; c.fillRect(x, y - h, w, h);
      c.fillStyle = 'rgba(21,24,25,.35)'; c.fillRect(x + w * 0.6, y - h, w * 0.4, h);
      c.fillStyle = INK; c.fillRect(x + w * 0.2, y - h * 0.6, w * 0.25, h * 0.3);
    }
  }, { t: 4.0, d: 1.0, reveal: 'rise' });

  redeemer(p);
}

function ridgeY(x) {
  for (let i = 1; i < 24; i++) {
    const [x0, y0] = RIDGE[i - 1], [x1, y1] = RIDGE[i];
    if (x >= x0 && x <= x1) return lerp(y0, y1, (x - x0) / (x1 - x0));
  }
  return 900;
}

// Christ the Redeemer: arms out, robe falling to a plinth, on the summit
function redeemer(p) {
  const [x, y] = [PEAK[0], PEAK[1] + 2];
  p.group('range', { x: x - 40, y: y - 84, w: 80, h: 92 }, (c) => {
    const lite = WHITE, dim = '#c9d3cf';
    c.lineJoin = 'round';
    // the plinth and the chapel under it
    c.fillStyle = lite; c.fillRect(x - 9, y - 12, 18, 12);
    c.fillStyle = dim; c.fillRect(x + 1, y - 12, 8, 12);
    c.fillStyle = lite; c.fillRect(x - 5, y - 20, 10, 8);
    c.fillStyle = dim; c.fillRect(x + 1, y - 20, 4, 8);
    // the figure: robe, sleeves under the arms, arms out, head
    const top = y - 20, sh = top - 44;
    const body = [
      [x - 5, top], [x - 6.5, sh + 16], [x - 30, sh + 4], [x - 31, sh + 1.5], [x - 30, sh - 1], [x - 5, sh - 1.5], [x - 3.2, sh - 4],
      [x + 3.2, sh - 4], [x + 5, sh - 1.5], [x + 30, sh - 1], [x + 31, sh + 1.5], [x + 30, sh + 4], [x + 6.5, sh + 16], [x + 5, top],
    ];
    c.fillStyle = INK; poly(c, body.map(([px, py]) => [px + (px < x ? -1.3 : 1.3), py + 1.3])); c.fill();
    c.fillStyle = lite; poly(c, body); c.fill();
    c.fillStyle = dim; poly(c, [[x + 0.5, top], [x + 0.5, sh - 4], [x + 3.2, sh - 4], [x + 5, sh - 1.5], [x + 30, sh - 1], [x + 31, sh + 1.5], [x + 30, sh + 4], [x + 6.5, sh + 16], [x + 5, top]]); c.fill();
    // the fall of the robe
    c.strokeStyle = 'rgba(21,24,25,.35)'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(x - 2, sh + 10); c.lineTo(x - 2.5, top); c.moveTo(x + 2.5, sh + 12); c.lineTo(x + 2.8, top); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(x, sh - 7.5, 4.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = lite; c.beginPath(); c.arc(x, sh - 7.5, 3.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = dim; c.beginPath(); c.arc(x + 1, sh - 7.5, 2.2, -1.2, 1.2); c.fill();
  }, { t: 5.6, d: 1.4, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- Sugarloaf
const SUGAR = [[1110, 872], [1124, 840], [1146, 790], [1170, 740], [1196, 694], [1222, 656], [1252, 626], [1284, 606], [1314, 598], [1342, 604], [1366, 622], [1386, 652], [1400, 692], [1410, 740], [1420, 790], [1436, 832], [1462, 860], [1490, 872]];
const URCA = [[930, 878], [946, 846], [968, 820], [1000, 802], [1036, 790], [1074, 786], [1110, 792], [1140, 806], [1166, 828], [1186, 852], [1200, 878]];
const LEME = [[760, 900], [800, 880], [840, 860], [880, 846], [920, 850], [950, 866], [972, 890], [980, 910], [760, 910]];

function sugarloaf(p, r) {
  p.fill('sugar', SUGAR, ROCK, { t: 2.2, d: 1.6, reveal: 'rise', ease: 'inOut' });
  // the streaks are placed once, here, from their own generator: placed inside the draw they
  // would move every frame
  const rs = rng(294);
  const streaks = Array.from({ length: 16 }, (_, i) => ({ dx: rs.range(-4, 4), dy: rs.range(0, 30), len: rs.range(140, 220) }));
  p.group('sugar', boxOf(SUGAR, 4), (c) => {
    c.save(); poly(c, SUGAR); c.clip();
    // the lit flank, then streaks down the granite
    c.fillStyle = ROCK_L;
    poly(c, [[1100, 880], [1150, 760], [1230, 650], [1300, 600], [1318, 600], [1270, 680], [1236, 780], [1220, 880]]); c.fill();
    c.strokeStyle = 'rgba(251,247,236,.55)'; c.lineWidth = 2; c.lineCap = 'round';
    c.beginPath();
    for (let i = 0; i < 16; i++) {
      const k = streaks[i], x = 1180 + i * 15 + k.dx, y0 = 640 + Math.abs(i - 8) * 14 + k.dy;
      c.moveTo(x, y0); c.quadraticCurveTo(x + (i - 8) * 3, y0 + 90, x + (i - 8) * 6, y0 + k.len);
    }
    c.stroke();
    c.strokeStyle = 'rgba(21,24,25,.35)'; c.lineWidth = 2.4; c.beginPath();
    for (let i = 0; i < 7; i++) { const x = 1330 + i * 14; c.moveTo(x, 620 + i * 6); c.quadraticCurveTo(x + 10, 720, x + 18 + i * 3, 860); }
    c.stroke();
    // the green cap and the green skirt
    c.fillStyle = EMERALD;
    c.beginPath(); c.moveTo(1240, 640); c.quadraticCurveTo(1300, 586, 1372, 628); c.quadraticCurveTo(1320, 626, 1290, 640); c.quadraticCurveTo(1262, 650, 1240, 640); c.fill();
    c.beginPath(); c.moveTo(1100, 872);
    for (let x = 1100; x <= 1500; x += 20) c.lineTo(x, 836 + Math.sin(x * 0.09) * 8 + Math.abs(x - 1300) * 0.04);
    c.lineTo(1500, 880); c.closePath(); c.fill();
    c.restore();
    // crowns along the skirt
    const rr = rng(31);
    for (let i = 0; i < 70; i++) {
      const x = rr.range(1110, 1490), y = rr.range(834, 872);
      c.fillStyle = rr.pick([JADE, LEAF, DEEP]); c.beginPath(); c.arc(x, y, rr.range(3, 6), 0, Math.PI * 2); c.fill();
    }
  }, { t: 3.0, d: 1.0, reveal: 'fade' });

  // Urca, low and green, and Leme at the end of the beach
  for (const [shape, t] of [[URCA, 2.6], [LEME, 3.0]]) {
    p.fill('sugar', shape, JADE, { t, d: 1.2, reveal: 'rise' });
    p.group('sugar', boxOf(shape, 8), (c) => {
      c.save(); poly(c, shape); c.clip();
      const b = boxOf(shape);
      c.fillStyle = EMERALD; c.fillRect(b.x + b.w * 0.6, b.y, b.w, b.h);
      const rr = rng(Math.floor(b.x));
      for (let i = 0; i < 90; i++) {
        const x = rr.range(b.x, b.x + b.w), y = rr.range(b.y + 8, b.y + b.h);
        c.fillStyle = rr.pick([LEAF, DEEP, MINT, JADE]); c.beginPath(); c.arc(x, y, rr.range(3, 6), 0, Math.PI * 2); c.fill();
      }
      c.restore();
    }, { t: t + 0.7, d: 0.9, reveal: 'fade' });
  }

  // the cable car: two stages, the beach to Urca and Urca to the summit
  const st0 = [1010, 872], st1 = [1076, 788], st2 = [1316, 600];
  const cable = (a, b, sag) => {
    const pts = [];
    for (let i = 0; i <= 30; i++) { const f = i / 30; pts.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f) + sag * 4 * f * (1 - f)]); }
    return pts;
  };
  const c1 = cable([st0[0], st0[1] - 14], [st1[0], st1[1] - 16], 6), c2 = cable([st1[0] + 6, st1[1] - 16], [st2[0] - 10, st2[1] - 12], 18);
  p.group('sugar', { x: st0[0] - 30, y: st2[1] - 40, w: st2[0] - st0[0] + 60, h: st0[1] - st2[1] + 50 }, (c) => {
    // the stations
    for (const [x, y, w] of [[st0[0], st0[1], 26], [st1[0], st1[1], 30], [st2[0], st2[1], 30]]) {
      c.fillStyle = WHITE; c.fillRect(x - w / 2, y - 16, w, 14);
      c.fillStyle = INK; c.fillRect(x - w / 2 + 3, y - 12, w - 6, 4);
      c.fillStyle = SUN; c.fillRect(x - w / 2 - 2, y - 19, w + 4, 4);
    }
  }, { t: 6.4, d: 0.6, reveal: 'pop' });
  for (const off of [0, 3]) {
    p.pen('sugar', c1.map(([x, y]) => [x, y + off]), INK, 1.1, { t: 6.8, d: 0.6 });
    p.pen('sugar', c2.map(([x, y]) => [x, y + off]), INK, 1.1, { t: 6.9, d: 1.1 });
  }
  const along = (pts, f) => { const i = Math.min(pts.length - 2, Math.floor(f * (pts.length - 1))), k = f * (pts.length - 1) - i; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; };
  p.live('sugar', {
    t: 8.0, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      // each gondola runs up and down its stage, resting a moment at the ends
      const runs = [[c1, 9, 0.2, 3], [c2, 14, 0.55, 0]];
      for (const [pts, per, ph, off] of runs) {
        const k = ((time / per + ph) % 1);
        const f = smooth(0, 1, Math.min(1, Math.max(0, (Math.abs(k * 2 - 1) - 0.08) / 0.84)));
        const [x, y] = along(pts, f);
        const yy = y + off;
        c.strokeStyle = INK; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(x, yy); c.lineTo(x, yy + 6); c.stroke();
        c.fillStyle = SUN; c.beginPath(); c.roundRect(x - 7, yy + 6, 14, 10, 3); c.fill();
        c.fillStyle = INK; c.fillRect(x - 5, yy + 8, 10, 3.2);
        c.lineWidth = 0.9; c.beginPath(); c.roundRect(x - 7, yy + 6, 14, 10, 3); c.stroke();
      }
    },
  });
}

// ---------------------------------------------------------------- the sea
function sea(p, r) {
  p.group('sea', { x: 0, y: HY - 4, w: W, h: H - HY + 4 }, (c) => {
    c.fillStyle = SEA; c.fillRect(0, HY - 4, W, H - HY + 4);
    c.fillStyle = SEA_D; c.fillRect(0, HY - 4, W, 26);
    c.fillStyle = mix(SEA, SEA_D, 0.5); c.fillRect(0, HY + 22, W, 30);
  }, { t: 1.2, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // shallows: lighter water in steps toward the shore
  p.fill('sea', band(0, LEN, -0.55, 0.05), SEA_L, { t: 2.2, d: 1.2, reveal: 'fade' });
  p.fill('sea', band(0, LEN, -0.24, 0.05), TURQ, { t: 2.5, d: 1.2, reveal: 'fade' });
  // the water's texture: short flat dashes, closer together far off
  const rows = [];
  for (let y = HY + 8; y < IY + IH; y += Math.max(5, (y - HY) * 0.07)) rows.push(y);
  const dashes = [];
  for (const y of rows) {
    const s = (y - HY) / 600;
    for (let x = IX + r.range(0, 40); x < IX + IW; x += r.range(40, 120) * (0.4 + s)) {
      const [X, Z] = toWorld(x, y);
      if (landward(X, Z) > -0.6) continue;
      dashes.push([[x, y], [x + r.range(8, 22) * (0.3 + s), y]]);
    }
  }
  const half = Math.floor(dashes.length / 2);
  p.strokes('sea', dashes.slice(0, half), 'rgba(251,247,236,.35)', 1.6, { t: 3.0, d: 1.2, reveal: 'wipe' });
  p.strokes('sea', dashes.slice(half), 'rgba(14,76,126,.55)', 1.6, { t: 3.3, d: 1.2, reveal: 'wipeL' });

  // a ship far out, and fishing boats at anchor
  p.group('sea', { x: 990, y: 846, w: 80, h: 26 }, (c) => {
    c.fillStyle = INK; poly(c, [[1000, 862], [1060, 862], [1056, 868], [1004, 868]]); c.fill();
    c.fillStyle = WHITE; c.fillRect(1040, 853, 12, 9);
    c.fillStyle = SUN; c.fillRect(1044, 848, 4, 6);
  }, { t: 4.2, d: 0.6, reveal: 'pop' });
  const anchored = [[1250, 1010, 0.6], [1380, 1080, 0.75], [1150, 1120, 0.8], [990, 1000, 0.5]];
  anchored.forEach(([x, y, s], i) => {
    p.group('sea', { x: x - 30 * s, y: y - 30 * s, w: 60 * s, h: 40 * s }, (c) => {
      c.fillStyle = [WHITE, SUN, WHITE, '#e2564a'][i]; poly(c, [[x - 22 * s, y - 8 * s], [x + 24 * s, y - 8 * s], [x + 16 * s, y], [x - 16 * s, y]]); c.fill();
      c.fillStyle = INK; c.fillRect(x - 22 * s, y - 9 * s, 46 * s, 2.2 * s);
      c.fillStyle = WHITE; c.fillRect(x - 6 * s, y - 18 * s, 12 * s, 9 * s);
      c.fillStyle = INK; c.fillRect(x - 0.8 * s, y - 28 * s, 1.6 * s, 10 * s);
      c.fillStyle = 'rgba(251,247,236,.5)'; c.fillRect(x - 18 * s, y + 3 * s, 36 * s, 1.6 * s);
    }, { t: 4.4 + i * 0.15, d: 0.6, reveal: 'pop' });
  });

  // the surf: rows of breakers parallel to the beach
  const rowsO = [-0.42, -0.3, -0.19, -0.1];
  rowsO.forEach((o, i) => {
    const segs = [];
    let L = r.range(0, 0.3);
    while (L < LEN - 0.3) {
      const len = r.range(0.4, 1.3) * (0.6 + i * 0.2);
      segs.push(line(L, Math.min(LEN - 0.2, L + len), o + r.range(-0.015, 0.015), 4));
      L += len + r.range(0.15, 0.6);
    }
    p.strokes('surf', segs, i === 3 ? WHITE : 'rgba(251,247,236,.7)', 2.2 + i * 0.5, { t: 4.6 + i * 0.25, d: 1.0, reveal: i % 2 ? 'wipeL' : 'wipe' });
  });
  // the foam, rolling in: lives drawn every frame along the near shore
  const foam = [];
  for (let i = 0; i < 9; i++) {
    const L0 = (i / 9) * (LEN * 0.8) + r.range(0, 0.4);
    foam.push({ L0, L1: L0 + r.range(0.6, 1.6), ph: r(), per: r.range(5, 7.5) });
  }
  p.live('surf', {
    t: 5.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.lineCap = 'round';
      for (const f of foam) {
        const k = ((time / f.per + f.ph) % 1);
        const o = lerp(-0.26, -0.005, smooth(0, 1, k));
        const a = Math.sin(k * Math.PI);
        c.strokeStyle = `rgba(251,247,236,${0.95 * a})`;
        const pts = line(f.L0, Math.min(LEN - 0.1, f.L1), o, 7);
        const z = depth((f.L0 + f.L1) / 2);
        c.lineWidth = clamp(9 / z, 1, 6);
        c.beginPath(); pts.forEach(([x, y], j) => (j ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
        // the thin lacy edge behind the crest
        c.lineWidth = clamp(3 / z, 0.6, 2);
        c.strokeStyle = `rgba(251,247,236,${0.6 * a})`;
        const back = line(f.L0 + 0.05, Math.min(LEN - 0.1, f.L1 - 0.05), o - 0.03, 7);
        c.beginPath(); back.forEach(([x, y], j) => (j ? c.lineTo(x, y + Math.sin(j * 1.7) * 1.2) : c.moveTo(x, y))); c.stroke();
      }
    },
  });
  // sailboats tacking slowly in the bay
  const sails = [[1180, 940, 0.7, 0.9], [1330, 1180, 1.0, 1.3], [960, 960, 0.5, 0.7]];
  p.live('surf', {
    t: 9.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      sails.forEach(([x0, y0, s, sp], i) => {
        const x = x0 + Math.sin(time * 0.08 * sp + i * 2) * 50, y = y0 + Math.sin(time * 1.2 + i) * 1.2;
        const lean = Math.sin(time * 0.9 + i) * 0.04;
        c.save(); c.translate(x, y); c.rotate(lean);
        c.fillStyle = INK; poly(c, [[-20 * s, -4 * s], [22 * s, -4 * s], [16 * s, 2 * s], [-15 * s, 2 * s]]); c.fill();
        c.fillStyle = WHITE; poly(c, [[1 * s, -66 * s], [1 * s, -7 * s], [24 * s, -7 * s]]); c.fill();
        c.fillStyle = i === 1 ? SUN : WHITE; poly(c, [[-2 * s, -56 * s], [-2 * s, -7 * s], [-20 * s, -7 * s]]); c.fill();
        c.fillStyle = INK; c.fillRect(-0.8 * s, -68 * s, 1.6 * s, 62 * s);
        c.restore();
        c.fillStyle = 'rgba(251,247,236,.6)'; c.fillRect(x - 40 * s, y + 4 * s, 34 * s, 1.6 * s);
      });
    },
  });
}

// how far landward of the waterline a ground point is (negative: out at sea)
function landward(X, Z) {
  let best = Infinity, sign = 1;
  const { pts } = SHORE;
  for (let i = 0; i < pts.length; i += 14) {
    const d = Math.hypot(pts[i][0] - X, pts[i][1] - Z);
    if (d < best) {
      best = d;
      const j = Math.min(pts.length - 1, i + 1), tx = pts[j][0] - pts[i][0], tz = pts[j][1] - pts[i][1];
      sign = (-tz * (X - pts[i][0]) + tx * (Z - pts[i][1])) >= 0 ? 1 : -1;
    }
  }
  return best * sign;
}

// ---------------------------------------------------------------- the land and the avenue
function ground(p, r) {
  const land = [];
  for (let L = 0; L < LEN; L += stepAt(L, 6)) land.push(S(L, 0.02));
  land.push(S(LEN, 0.02));
  land.push([760, 906], [-60, 906], [-60, H + 60], [W + 400, H + 60], [W + 400, land[0][1]]);
  p.fill('land', land, LAND, { t: 3.4, d: 1.0, reveal: 'fade' });
  // the far city at the foot of the hills
  const far = [];
  for (let x = -20; x < 900;) {
    const w = r.range(8, 22), h = r.range(10, 34);
    far.push([x, w, h, r.pick([WHITE, '#efe6cf', SUN_L, '#e3eadf'])]);
    x += w + r.range(-2, 3);
  }
  p.group('land', { x: -20, y: 850, w: 940, h: 70 }, (c) => {
    for (const [x, w, h, col] of far) {
      const y = 912 + Math.max(0, (x - 600) * 0.02);
      c.fillStyle = col; c.fillRect(x, y - h, w, h);
      c.fillStyle = 'rgba(21,24,25,.25)'; c.fillRect(x + w * 0.65, y - h, w * 0.35, h);
      c.fillStyle = 'rgba(21,24,25,.55)';
      for (let yy = y - h + 3; yy < y - 3; yy += 4) c.fillRect(x + 1.5, yy, w * 0.55, 1.2);
    }
  }, { t: 3.6, d: 1.0, reveal: 'rise' });
  // nearer, a denser city between the hills and the avenue's blocks
  const mid = [];
  for (const y of [922, 936, 952, 970, 990]) {
    const k = (y - HY) / 80;
    for (let x = IX - 20 + r.range(0, 20); x < 760 - (y - 920) * 2; x += r.range(10, 24) * k) mid.push([x, y, r.range(8, 20) * k, r.range(14, 40) * k, r.pick(FACADES)]);
  }
  p.group('land', { x: IX - 30, y: 850, w: 800, h: 150 }, (c) => {
    for (const [x, y, w, h, col] of mid) {
      c.fillStyle = col; c.fillRect(x, y - h, w, h);
      c.fillStyle = mix(col, '#7f9e98', 0.35); c.fillRect(x, y - h, w * 0.3, h);
      c.fillStyle = 'rgba(29,42,46,.75)';
      for (let yy = y - h + 3; yy < y - 4; yy += 4.2) c.fillRect(x + w * 0.38, yy, w * 0.52, 1.6);
    }
  }, { t: 3.9, d: 1.0, reveal: 'rise' });
}

// ---------------------------------------------------------------- the blocks
const FACADES = [WHITE, WHITE, '#f6f0df', '#eef3ea', '#fbf2cf', '#d8eee4', WHITE, '#f3e7c9'];

function city_(p, r) {
  // rows of blocks parallel to the beach; the front row on the avenue is the tallest
  const rows = [[1.06, 0.2, [0.26, 0.46]], [1.33, 0.18, [0.22, 0.5]], [1.59, 0.18, [0.2, 0.42]], [1.85, 0.2, [0.18, 0.38]], [2.13, 0.2, [0.16, 0.36]], [2.43, 0.22, [0.16, 0.32]], [2.75, 0.22, [0.14, 0.3]], [3.08, 0.24, [0.14, 0.28]], [3.42, 0.24, [0.14, 0.28]]];
  const items = [];
  rows.forEach(([o0, dep, [h0, h1]], ri) => {
    for (let L = r.range(0, 0.1); L < LEN - 0.12;) {
      const w = r.range(0.07, 0.16) * (1 + depth(L) * 0.02);
      const L1 = Math.min(LEN - 0.05, L + w);
      const z = depth(L, o0);
      const gap = r.chance(0.12) ? r.range(0.05, 0.1) : r.range(0.006, 0.02);
      const nx = at(L)[4];
      if (z > 1.45 && z < 26 && (nx < -0.45 || z > 1.8)) {
        const [sx] = S(L, o0 + dep);
        if (sx > IX - 80) items.push({ L0: L, L1, o0, o1: o0 + dep, h: r.range(h0, h1) * (r.chance(0.08) ? 1.25 : 1), ri, seed: Math.floor(r() * 1e9), col: r.pick(FACADES), style: r.pick(['ribbon', 'ribbon', 'grid', 'fins', 'grid', 'balcony']) });
      }
      L = L1 + gap;
    }
  });
  // far first, by distance from the eye
  const dist = (it) => { const [x, z] = at((it.L0 + it.L1) / 2, (it.o0 + it.o1) / 2); return Math.hypot(x, z); };
  items.forEach((it) => { it.d = dist(it); });
  items.sort((a, b) => b.d - a.d);
  const dmax = items[0].d, dmin = items[items.length - 1].d;
  // in fours, far to near, each four rising together
  for (let i = 0; i < items.length; i += 4) {
    const part = items.slice(i, i + 4);
    const t = 4.4 + ((dmax - part[0].d) / (dmax - dmin)) ** 0.8 * 4.2;
    const pts = [];
    for (const it of part) pts.push(S(it.L0, it.o0), S(it.L1, it.o0), S(it.L0, it.o1), S(it.L1, it.o1), S(it.L0, it.o0, it.h), S(it.L1, it.o1, it.h), S(it.L0, it.o1, it.h));
    p.group('city', boxOf(pts, 6), (c) => { for (const it of part) building(c, it); }, { t, d: 0.7, reveal: 'rise' });
  }
}

function building(c, it) {
  const { L0, L1, o0, o1, h, col } = it;
  const rr = rng(it.seed);
  const A = S(L0, o0), B = S(L1, o0), A2 = S(L0, o1), B2 = S(L1, o1);
  const At = S(L0, o0, h), Bt = S(L1, o0, h), A2t = S(L0, o1, h), B2t = S(L1, o1, h);
  const z = depth(L0, o0), k = F / z / 1100; // its scale on the sheet
  const shadeCol = mix(col, '#7f9e98', 0.3);
  const fl = Math.max(6, Math.round(h / 0.034));
  const g = 1 / (fl + 0.6);
  const dark = rr.chance(0.55) ? '#1d2a2e' : '#24465a';
  const accent = rr.pick([JADE, SUN, SEA_L, TURQ, SUN_L, '#e2564a', JADE, SUN]);
  const lerp2 = (P0, P1, Q0, Q1) => (u, v) => [lerp(lerp(P0[0], P1[0], u), lerp(Q0[0], Q1[0], u), v), lerp(lerp(P0[1], P1[1], u), lerp(Q0[1], Q1[1], u), v)];
  const quad = (fn, u0, u1, v0, v1) => { poly(c, [fn(u0, v0), fn(u1, v0), fn(u1, v1), fn(u0, v1)]); c.fill(); };
  // one face: the wall, a dark open ground floor on posts, then the floors
  const face = (fn, base, wpx, style, lit) => {
    c.fillStyle = base; quad(fn, 0, 1, 0, 1);
    if (wpx < 3) return;
    c.fillStyle = lit ? INK : '#26302f'; quad(fn, 0.03, 0.97, 0, g * 0.9);
    c.fillStyle = base;
    const posts = Math.max(2, Math.round(wpx / 14));
    for (let i = 0; i <= posts; i++) { const u = lerp(0.05, 0.95, i / posts); quad(fn, u - 0.35 / (posts * 2.4), u + 0.35 / (posts * 2.4), 0, g); }
    const dk = lit ? dark : mix(dark, base, 0.25);
    for (let f = 1; f < fl; f++) {
      const v0 = (f + 0.2) * g, v1 = (f + 0.85) * g;
      if (style === 'ribbon') {
        c.fillStyle = dk; quad(fn, 0.03, 0.97, v0, v0 + (v1 - v0) * 0.6);
        if (lit && k > 0.22 && (f + it.seed) % 3 === 0) { c.fillStyle = accent; const u = ((f * 37 + it.seed) % 60) / 100; quad(fn, u + 0.04, u + 0.24, v0 + (v1 - v0) * 0.6, v1 + g * 0.1); }
      } else if (style === 'grid') {
        const n = Math.max(2, Math.round(wpx / 9));
        c.fillStyle = dk;
        if (wpx / n < 2.4) { quad(fn, 0.06, 0.94, v0, v1 - (v1 - v0) * 0.25); continue; }
        for (let i = 0; i < n; i++) quad(fn, (i + 0.22) / n, (i + 0.78) / n, v0, v1 - (v1 - v0) * 0.15);
      } else if (style === 'fins') {
        c.fillStyle = dk; quad(fn, 0.03, 0.97, v0 - g * 0.15, v1);
        const n = Math.max(3, Math.round(wpx / 6));
        c.fillStyle = lit ? accent : mix(accent, base, 0.4);
        if (wpx / n >= 1.8) for (let i = 0; i <= n; i++) { const u = lerp(0.03, 0.97, i / n); quad(fn, u - 0.28 / n, u + 0.28 / n, v0 - g * 0.15, v1); }
      } else {
        // deep balconies: a parapet over a dark recess, every third in color
        c.fillStyle = dk; quad(fn, 0.03, 0.97, v0 - g * 0.1, v1);
        c.fillStyle = f % 3 === 0 ? (lit ? accent : mix(accent, base, 0.4)) : base; quad(fn, 0.03, 0.97, v0 + (v1 - v0) * 0.5, v1 + g * 0.12);
      }
    }
    // a cornice
    c.fillStyle = lit ? mix(base, INK, 0.12) : mix(base, INK, 0.2); quad(fn, 0, 1, 1 - g * 0.25, 1);
  };
  const endStyle = it.style === 'fins' || it.style === 'balcony' ? 'grid' : it.style;
  const wEnd = Math.hypot(A2[0] - A[0], A2[1] - A[1]), wFace = Math.hypot(B[0] - A[0], B[1] - A[1]);
  face(lerp2(A2, A, A2t, At), shadeCol, wEnd, endStyle, false);
  face(lerp2(A, B, At, Bt), col, wFace, it.style, true);
  // the roof, with a little room and a water tank, and now and then a pool
  c.fillStyle = mix(col, '#b9b2a0', 0.4); poly(c, [At, Bt, B2t, A2t]); c.fill();
  if (k > 0.12) {
    const roofP = (u, v) => at(lerp(L0, L1, u), lerp(o0, o1, v));
    const [rx, rz] = roofP(rr.range(0.3, 0.6), 0.55);
    const a = P(rx, rz, h), b = P(rx, rz, h + 0.045);
    const wpx2 = Math.max(2, wEnd * 0.35);
    c.fillStyle = mix(col, '#b9b2a0', 0.15); c.fillRect(a[0] - wpx2 / 2, b[1], wpx2, a[1] - b[1]);
    c.fillStyle = shadeCol; c.fillRect(a[0] - wpx2 / 2, b[1], wpx2 * 0.4, a[1] - b[1]);
    c.fillStyle = INK; c.fillRect(a[0] - wpx2 * 0.1, b[1] + (a[1] - b[1]) * 0.35, wpx2 * 0.3, (a[1] - b[1]) * 0.3);
    if (rr.chance(0.35)) {
      const q4 = [P(...roofP(0.62, 0.15).slice(0, 2), h), P(...roofP(0.9, 0.15).slice(0, 2), h), P(...roofP(0.9, 0.6).slice(0, 2), h), P(...roofP(0.62, 0.6).slice(0, 2), h)];
      c.fillStyle = TURQ; poly(c, q4); c.fill();
    }
  }
}

// ---------------------------------------------------------------- the beach and the promenade
function beach(p, r) {
  // the sand, a damp edge, and the walk behind it
  p.fill('beach', band(0, LEN, 0, O.pave), SAND, { t: 3.0, d: 1.2, reveal: 'fade' });
  p.fill('beach', band(0, LEN, 0, 0.035), SAND_D, { t: 3.4, d: 1.0, reveal: 'fade' });
  // the pavement's waves: black and white bands along the promenade, unrolled
  // from the near end round the crescent
  const segs = 10;
  for (let i = 0; i < segs; i++) {
    const La = (LEN * i) / segs, Lb = (LEN * (i + 1)) / segs;
    const outline = band(La, Lb, O.pave, O.road, 3);
    p.group('beach', boxOf(outline, 4), (c) => pavement(c, La, Lb), { t: 3.6 + i * 0.22, d: 0.9, reveal: 'fade' });
  }
  // the road, its median, the far sidewalk
  p.fill('beach', band(0, LEN, O.road, O.walk), ROAD, { t: 5.2, d: 1.0, reveal: 'fade' });
  p.fill('beach', band(0, LEN, O.mid - 0.012, O.mid + 0.012), '#9aa39b', { t: 5.5, d: 0.8, reveal: 'fade' });
  const dashes = [];
  for (const o of [O.road + 0.055, O.mid + 0.055]) {
    for (let L = 0; L < LEN - 0.1; L += 0.18) dashes.push(line(L, L + 0.07, o, 6));
  }
  p.strokes('beach', dashes, 'rgba(251,247,236,.75)', 1.4, { t: 5.7, d: 0.8, reveal: 'fade' });
  // the sidewalk on the buildings' side: Burle Marx's abstract mosaic
  for (let i = 0; i < 6; i++) {
    const La = (LEN * i) / 6, Lb = (LEN * (i + 1)) / 6;
    p.group('beach', boxOf(band(La, Lb, O.walk, O.b0 + 0.02, 4), 4), (c) => burleMarx(c, La, Lb), { t: 5.8 + i * 0.12, d: 0.8, reveal: 'fade' });
  }
  // the edge of the promenade: a crisp kerb against the sand
  p.pen('beach', line(0, LEN, O.pave, 5), INK, 1.6, { t: 6.0, d: 1.6, ease: 'inOut' });

  // cars along the avenue
  const cars = [];
  for (let i = 0; i < 16; i++) cars.push({ ph: r(), sp: r.range(0.012, 0.02) * (i % 2 ? 1 : -1), lane: i % 2 ? O.road + 0.05 : O.mid + 0.05, col: r.pick([SUN, WHITE, '#e2564a', SEA_L, JADE, WHITE, INK]) });
  p.live('beach', {
    t: 8.4, d: 0.8, reveal: 'fade',
    draw: (c, time) => {
      for (const car of cars) {
        let f = (car.ph + time * car.sp) % 1; if (f < 0) f += 1;
        const L = f * LEN;
        const z = depth(L, car.lane);
        if (z < 1.5) continue;
        const k = F / z / 1100;
        const a = S(L, car.lane), b = S(L + 0.07 * (car.sp > 0 ? 1 : -1), car.lane);
        const hgt = 0.035;
        const at2 = S(L, car.lane, hgt), bt = S(L + 0.07 * (car.sp > 0 ? 1 : -1), car.lane, hgt);
        c.fillStyle = car.col; poly(c, [a, b, bt, at2]); c.fill();
        const ct = (f2, up) => [lerp(at2[0], bt[0], f2), lerp(at2[1], bt[1], f2) - up * k];
        c.fillStyle = car.col; poly(c, [ct(0.22, 0), ct(0.78, 0), ct(0.7, 14), ct(0.3, 14)]); c.fill();
        c.fillStyle = '#26404a'; poly(c, [ct(0.28, 2), ct(0.72, 2), ct(0.66, 11), ct(0.34, 11)]); c.fill();
        c.fillStyle = INK; c.fillRect(Math.min(a[0], b[0]), Math.max(a[1], b[1]) - 1.5 * k, Math.abs(b[0] - a[0]), 3 * k);
      }
    },
  });
}

// big abstract fields across the walk: black, white and brick, with curved seams
const BM = (() => {
  const r = rng(1949), fields = [];
  for (let L = -0.2; L < 40;) {
    const len = r.range(0.06, 0.2);
    const isl = [];
    for (let k = r.int(0, 2); k > 0; k--) isl.push({ u: r.range(0.25, 0.75), v: r.range(0.2, 0.8), ru: r.range(0.18, 0.4), rv: r.range(0.12, 0.3), col: r.pick([INK, WHITE, '#b4553a', SUN, INK]), w: r.range(0, 6) });
    fields.push({ L, len, col: r.pick([INK, WHITE, INK, WHITE, '#d8cfb4', WHITE, r.chance(0.3) ? '#b4553a' : INK]), bend: r.range(-0.05, 0.05), isl, split: r.chance(0.4) ? r.range(0.3, 0.7) : 0, col2: r.pick([INK, WHITE, '#d8cfb4']) });
    L += len;
  }
  return fields;
})();
function burleMarx(c, La, Lb) {
  const o0 = O.walk, o1 = O.b0 + 0.02, wid = o1 - o0;
  c.save();
  poly(c, band(La, Lb, o0, o1, 4)); c.clip();
  c.fillStyle = '#d8cfb4'; poly(c, band(La, Lb, o0, o1, 4)); c.fill();
  for (const fd of BM) {
    if (fd.L + fd.len + 0.2 < La || fd.L - 0.2 > Lb) continue;
    // the seam at each end bows across the walk
    const seam = (L0, k) => L0 + fd.bend * Math.sin(k * Math.PI);
    const pts = [];
    for (let k = 0; k <= 1.0001; k += 0.1) pts.push(S(seam(fd.L, k), o0 + k * wid));
    for (let k = 1; k >= -0.0001; k -= 0.1) pts.push(S(seam(fd.L + fd.len, k) + 0.002, o0 + k * wid));
    c.fillStyle = fd.col; poly(c, pts); c.fill();
    // a field split along its length into two inks
    if (fd.split && fd.col2 !== fd.col) {
      const sp = [];
      for (let k = 0; k <= 1.0001; k += 0.1) sp.push(S(fd.L + fd.len * k, o0 + (fd.split + 0.12 * Math.sin(k * Math.PI * 2)) * wid));
      for (let k = 1; k >= -0.0001; k -= 0.1) sp.push(S(fd.L + fd.len * k, o1));
      c.fillStyle = fd.col2; poly(c, sp); c.fill();
    }
    // rounded islands inside the field
    for (const is of fd.isl) {
      if (is.col === fd.col) continue;
      const ip = [];
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 14) {
        const u = is.u + Math.cos(a) * is.ru * 0.5 * (1 + 0.2 * Math.sin(a * 3 + is.w)), v = is.v + Math.sin(a) * is.rv;
        ip.push(S(fd.L + clamp(u, 0, 1) * fd.len, o0 + clamp(v, 0, 1) * wid));
      }
      c.fillStyle = is.col; poly(c, ip); c.fill();
    }
  }
  c.restore();
}

function pavement(c, La, Lb) {
  const lam = 0.16, bands = 9; // the length of a wave, and the bands across the walk
  const wid = O.road - O.pave;
  c.save();
  poly(c, band(La, Lb, O.pave, O.road, 3)); c.clip();
  c.fillStyle = WHITE; poly(c, band(La, Lb, O.pave, O.road, 3)); c.fill();
  c.fillStyle = INK;
  for (let b = -1; b < bands + 1; b += 2) {
    const edge = (L, k) => O.pave + wid * ((k + 0.85 * Math.sin((2 * Math.PI * L) / lam)) / bands);
    const pts = [], back = [];
    for (let L = La - 0.01; L < Lb + 0.01; L += Math.min(lam / 18, stepAt(L, 3))) { pts.push(S(L, edge(L, b))); back.push(S(L, edge(L, b + 1))); }
    poly(c, pts.concat(back.reverse())); c.fill();
  }
  c.restore();
}

// ---------------------------------------------------------------- people, umbrellas, kiosks
const SWIM = [SUN, '#e2564a', SEA_L, JADE, INK, WHITE, TURQ, '#f08a3c'];
const SKIN = ['#8a5a3c', '#b47a52', '#d9a47a', '#6b4430', '#c58c62'];
const PARASOL = [[SUN, WHITE], [JADE, WHITE], [SEA, WHITE], ['#e2564a', WHITE], [SUN, '#e2564a'], [INK, WHITE], [TURQ, SUN], [EMERALD, SUN_L]];

function life(p, r) {
  // everything on the sand, placed in the world and drawn far to near
  const things = [];
  for (let L = 0.05; L < LEN - 0.2; L += r.range(0.012, 0.03)) {
    const z = depth(L);
    if (r.chance(0.5)) things.push({ kind: 'umb', L, o: r.range(0.06, 0.26), col: r.pick(PARASOL), tilt: r.range(-0.3, 0.3) });
    if (r.chance(0.85)) things.push({ kind: r.chance(0.35) ? 'lie' : 'stand', L: L + r.range(-0.01, 0.01), o: r.range(0.02, 0.28), suit: r.pick(SWIM), skin: r.pick(SKIN), towel: r.pick(SWIM) });
    if (r.chance(0.25)) things.push({ kind: 'swim', L, o: r.range(-0.2, -0.04), skin: r.pick(SKIN) });
    if (z < 3 && r.chance(0.2)) things.push({ kind: 'stand', L, o: r.range(0.0, 0.05), suit: r.pick(SWIM), skin: r.pick(SKIN) });
    if (r.chance(0.3)) things.push({ kind: 'walk', L, o: r.range(O.pave + 0.03, O.road - 0.03), suit: r.pick(SWIM), skin: r.pick(SKIN) });
    if (r.chance(0.3)) things.push({ kind: 'sit', L: L + 0.006, o: r.range(0.08, 0.26), suit: r.pick(SWIM), skin: r.pick(SKIN), chair: r.pick(SWIM) });
    if (r.chance(0.06)) things.push({ kind: 'surf', L, o: r.range(-0.4, -0.15), skin: r.pick(SKIN), board: r.pick([WHITE, SUN, '#e2564a', TURQ]) });
    // close by, the crowd is thicker
    if (z < 2.6) for (let k = 0; k < 2; k++) things.push({ kind: r.chance(0.3) ? 'lie' : r.chance(0.5) ? 'sit' : 'stand', L: L + r.range(-0.012, 0.012), o: r.range(0.03, 0.27), suit: r.pick(SWIM), skin: r.pick(SKIN), towel: r.pick(SWIM), chair: r.pick(SWIM) });
  }
  // the kiosks and the lifeguard posts, at intervals along the edge of the sand
  for (let L = 0.5; L < LEN - 0.3; L += 1.05) things.push({ kind: 'kiosk', L, o: O.pave - 0.035 });
  for (let L = 1.0; L < LEN - 0.3; L += 2.1) things.push({ kind: 'posto', L, o: 0.2 });
  for (let L = 0.9; L < LEN - 0.5; L += 3.1) things.push({ kind: 'net', L, o: 0.13 });
  things.forEach((it) => { const [x, z] = at(it.L, it.o); it.z = z; it.x = x; });
  const vis = things.filter((it) => it.z > 1.08 && it.z < 30);
  vis.sort((a, b) => b.z - a.z);
  // in batches, far to near
  const n = 26;
  for (let i = 0; i < n; i++) {
    const part = vis.slice(Math.floor((i * vis.length) / n), Math.floor(((i + 1) * vis.length) / n));
    if (!part.length) continue;
    const pts = [];
    part.forEach((it) => { const [sx, sy] = P(it.x, it.z); const k = F / it.z; pts.push([sx - k * 0.12, sy - k * 0.2], [sx + k * 0.12, sy + k * 0.04]); });
    p.group('life', boxOf(pts, 4), (c) => { for (const it of part) thing(c, it); }, { t: 7.6 + i * 0.12, d: 0.7, reveal: 'drop', dy: 10 });
  }
}

function thing(c, it) {
  const [x, y] = P(it.x, it.z);
  const k = F / it.z / 1100; // pixels per unit, over 1100
  const u = 1100 * k * 0.01; // a hundredth of a unit, on the sheet
  if (it.kind === 'umb') {
    const rad = 3.2 * u, pole = 5.4 * u;
    c.fillStyle = 'rgba(80,60,30,.22)'; c.beginPath(); c.ellipse(x + 1.2 * u, y, rad * 0.9, rad * 0.32, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = Math.max(0.6, 0.3 * u); c.beginPath(); c.moveTo(x, y); c.lineTo(x + it.tilt * u, y - pole); c.stroke();
    const cx = x + it.tilt * u, cy = y - pole;
    const segs = 8;
    for (let s = 0; s < segs; s++) {
      c.fillStyle = it.col[s % 2];
      c.beginPath(); c.moveTo(cx, cy - rad * 0.45);
      c.ellipse(cx, cy, rad, rad * 0.45, 0, Math.PI + (s / segs) * Math.PI, Math.PI + ((s + 1) / segs) * Math.PI);
      c.closePath(); c.fill();
    }
    c.fillStyle = it.col[0]; c.beginPath(); c.ellipse(cx, cy, rad, rad * 0.18, 0, 0, Math.PI); c.fill();
  } else if (it.kind === 'lie') {
    c.fillStyle = it.towel; c.fillRect(x - 1.8 * u, y - 0.8 * u, 3.6 * u, 1.2 * u);
    if (u > 4) { c.fillStyle = WHITE; for (let i = 0; i < 3; i++) c.fillRect(x - 1.8 * u + (i + 0.4) * 1.2 * u, y - 0.8 * u, 0.3 * u, 1.2 * u); }
    c.fillStyle = it.skin; c.fillRect(x - 1.4 * u, y - 0.55 * u, 2.6 * u, 0.5 * u);
    c.beginPath(); c.arc(x + 1.3 * u, y - 0.32 * u, 0.36 * u, 0, Math.PI * 2); c.fill();
    c.fillStyle = it.suit; c.fillRect(x - 0.3 * u, y - 0.6 * u, 0.8 * u, 0.6 * u);
  } else if (it.kind === 'sit') {
    // in a striped folding chair, leaning back
    c.fillStyle = 'rgba(80,60,30,.22)'; c.fillRect(x - 0.6 * u, y - 0.2 * u, 2.4 * u, 0.4 * u);
    c.strokeStyle = INK; c.lineWidth = Math.max(0.5, 0.14 * u);
    c.beginPath(); c.moveTo(x - 0.8 * u, y); c.lineTo(x + 0.6 * u, y - 1.6 * u); c.moveTo(x + 0.8 * u, y); c.lineTo(x - 0.4 * u, y - 0.9 * u); c.stroke();
    c.fillStyle = it.chair; poly(c, [[x - 0.9 * u, y - 0.8 * u], [x + 0.3 * u, y - 0.8 * u], [x + 0.9 * u, y - 2.2 * u], [x + 0.3 * u, y - 2.4 * u]]); c.fill();
    c.fillStyle = it.skin;
    c.beginPath(); c.arc(x + 0.55 * u, y - 2.55 * u, 0.36 * u, 0, Math.PI * 2); c.fill();
    poly(c, [[x - 0.2 * u, y - 0.95 * u], [x + 0.6 * u, y - 2.2 * u], [x + 0.9 * u, y - 2.0 * u], [x + 0.2 * u, y - 0.8 * u]]); c.fill();
    c.fillRect(x - 1.3 * u, y - 1.0 * u, 1.2 * u, 0.35 * u);
    c.fillStyle = it.suit; c.fillRect(x - 0.35 * u, y - 1.15 * u, 0.7 * u, 0.45 * u);
  } else if (it.kind === 'stand' || it.kind === 'walk') {
    const hgt = 1.75 * 1.4 * u;
    if (u > 3.2) {
      // a little figure: legs, trunks, body, arms, head with dark hair
      const step = it.kind === 'walk' ? 0.25 * u : 0.1 * u;
      c.fillStyle = 'rgba(80,60,30,.2)'; c.beginPath(); c.ellipse(x + 0.4 * u, y, 0.9 * u, 0.25 * u, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = it.skin;
      c.fillRect(x - 0.26 * u - step, y - hgt * 0.47, 0.22 * u, hgt * 0.47);
      c.fillRect(x + 0.04 * u + step, y - hgt * 0.47, 0.22 * u, hgt * 0.47);
      c.fillRect(x - 0.3 * u, y - hgt * 0.82, 0.6 * u, hgt * 0.38);
      c.fillRect(x - 0.48 * u, y - hgt * 0.8, 0.16 * u, hgt * 0.34);
      c.fillRect(x + 0.32 * u, y - hgt * 0.8, 0.16 * u, hgt * 0.34);
      c.beginPath(); c.arc(x, y - hgt * 0.9, 0.3 * u, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2a1d17'; c.beginPath(); c.arc(x, y - hgt * 0.93, 0.3 * u, Math.PI, 0); c.fill();
      c.fillStyle = it.suit; c.fillRect(x - 0.32 * u, y - hgt * 0.53, 0.64 * u, hgt * 0.12);
      if (it.suit === SUN || it.suit === '#e2564a' || it.suit === TURQ) c.fillRect(x - 0.3 * u, y - hgt * 0.76, 0.6 * u, hgt * 0.08);
    } else {
      c.fillStyle = it.skin; c.fillRect(x - 0.28 * u, y - hgt, 0.56 * u, hgt);
      c.beginPath(); c.arc(x, y - hgt - 0.3 * u, 0.36 * u, 0, Math.PI * 2); c.fill();
      c.fillStyle = it.suit; c.fillRect(x - 0.32 * u, y - hgt * 0.55, 0.64 * u, hgt * 0.18);
      if (it.kind === 'walk') { c.fillRect(x - 0.32 * u, y - hgt * 0.95, 0.64 * u, hgt * 0.4); }
    }
  } else if (it.kind === 'swim') {
    c.fillStyle = 'rgba(251,247,236,.7)'; c.fillRect(x - 0.9 * u, y - 0.15 * u, 1.8 * u, 0.3 * u);
    c.fillStyle = it.skin; c.beginPath(); c.arc(x, y - 0.35 * u, 0.36 * u, 0, Math.PI * 2); c.fill();
  } else if (it.kind === 'surf') {
    c.fillStyle = it.board; c.beginPath(); c.ellipse(x, y - 0.1 * u, 1.6 * u, 0.32 * u, -0.1, 0, Math.PI * 2); c.fill();
    c.fillStyle = it.skin; c.fillRect(x - 0.6 * u, y - 0.55 * u, 1.3 * u, 0.4 * u);
    c.beginPath(); c.arc(x + 0.8 * u, y - 0.45 * u, 0.3 * u, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(251,247,236,.8)'; c.fillRect(x - 2.4 * u, y + 0.15 * u, 1.4 * u, 0.2 * u);
  } else if (it.kind === 'kiosk') {
    // a round kiosk under a striped cone roof
    const w = 4 * u, hgt = 3 * u;
    c.fillStyle = WHITE; c.fillRect(x - w / 2, y - hgt, w, hgt);
    c.fillStyle = JADE; c.fillRect(x - w / 2, y - hgt, w, hgt * 0.35);
    c.fillStyle = INK; c.fillRect(x - w * 0.35, y - hgt * 0.6, w * 0.7, hgt * 0.18);
    for (let s = 0; s < 6; s++) {
      c.fillStyle = s % 2 ? WHITE : EMERALD;
      poly(c, [[x, y - hgt - 2.6 * u], [x - w * 0.7 + (s / 6) * w * 1.4, y - hgt], [x - w * 0.7 + ((s + 1) / 6) * w * 1.4, y - hgt]]); c.fill();
    }
    c.fillStyle = INK; c.fillRect(x - 0.2 * u, y - hgt - 3.4 * u, 0.4 * u, 0.9 * u);
  } else if (it.kind === 'posto') {
    // a lifeguard post: a cabin on stilts
    const w = 3.4 * u;
    c.strokeStyle = INK; c.lineWidth = Math.max(0.5, 0.3 * u);
    c.beginPath(); c.moveTo(x - w * 0.4, y); c.lineTo(x - w * 0.3, y - 4 * u); c.moveTo(x + w * 0.4, y); c.lineTo(x + w * 0.3, y - 4 * u); c.stroke();
    c.fillStyle = WHITE; c.fillRect(x - w / 2, y - 6.6 * u, w, 2.6 * u);
    c.fillStyle = SEA_L; c.fillRect(x - w * 0.4, y - 6 * u, w * 0.8, 1 * u);
    c.fillStyle = '#e2564a'; c.fillRect(x - w * 0.6, y - 7.4 * u, w * 1.2, 0.8 * u);
    c.fillStyle = INK; c.fillRect(x + w * 0.3, y - 10 * u, 0.25 * u, 3 * u);
    c.fillStyle = '#e2564a'; poly(c, [[x + w * 0.3 + 0.25 * u, y - 10 * u], [x + w * 0.3 + 2 * u, y - 9.4 * u], [x + w * 0.3 + 0.25 * u, y - 8.8 * u]]); c.fill();
  } else if (it.kind === 'net') {
    const [x2, y2] = S(it.L + 0.08, it.o);
    c.strokeStyle = INK; c.lineWidth = Math.max(0.5, 0.25 * u);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 2.6 * u); c.moveTo(x2, y2); c.lineTo(x2, y2 - 2.6 * u); c.stroke();
    c.strokeStyle = 'rgba(21,24,25,.6)'; c.beginPath();
    c.moveTo(x, y - 2.5 * u); c.lineTo(x2, y2 - 2.5 * u); c.moveTo(x, y - 1.7 * u); c.lineTo(x2, y2 - 1.7 * u); c.stroke();
  }
}

// ---------------------------------------------------------------- palms
function palms(p, r) {
  const list = [];
  for (let L = 0.25; L < LEN - 0.4; L += r.range(0.32, 0.5)) list.push({ L, o: O.pave - 0.012, hgt: r.range(0.34, 0.44), lean: r.range(-0.25, 0.25), seed: Math.floor(r() * 1e6) });
  list.forEach((it) => { it.z = depth(it.L, it.o); });
  const vis = list.filter((it) => it.z > 1.15 && it.z < 26).sort((a, b) => b.z - a.z);
  vis.forEach((it, i) => {
    const [x, y] = S(it.L, it.o);
    const k = F / it.z;
    const top = y - it.hgt * k;
    p.group('palms', { x: x - k * 0.2, y: top - k * 0.16, w: k * 0.4, h: y - top + k * 0.18 }, (c) => palm(c, x, y, it.hgt * k, it.lean, it.seed), { t: 8.0 + (i / vis.length) * 1.8, d: 0.8, reveal: 'rise' });
  });
  // a big palm close by, in the corner, framing the view
  const [fx, fy, fh] = [250, 1930, 640];
  p.group('garden', { x: fx - 300, y: fy - fh - 220, w: 760, h: fh + 240 }, (c) => palm(c, fx, fy, fh, 0.42, 77), { t: 7.0, d: 1.2, reveal: 'rise', ease: 'inOut' });
}

// a coconut palm, its foot at (x, y), tall hgt on the sheet
function palm(c, x, y, hgt, lean, seed) {
  const rr = rng(seed);
  const s = hgt / 300;
  const tx = x + lean * hgt * 0.4, ty = y - hgt;
  const mx0 = x + lean * hgt * 0.05, my0 = y - hgt * 0.5;
  const trunk = (f) => [lerp(lerp(x, mx0, f), lerp(mx0, tx, f), f), lerp(lerp(y, my0, f), lerp(my0, ty, f), f)];
  // the trunk: a gentle curve that thins upward, ringed
  const tw = Math.max(1.2, 9 * s);
  if (s > 0.6) {
    const L = [], R = [];
    for (let f = 0; f <= 1.0001; f += 0.05) {
      const [px, py] = trunk(f), w = tw * (1.15 - 0.4 * f) / 2;
      L.push([px - w, py]); R.push([px + w, py]);
    }
    c.fillStyle = '#8a7660'; poly(c, L.concat(R.reverse())); c.fill();
    c.fillStyle = '#6d5c49'; poly(c, L.map(([px, py], i) => [px + tw * 0.25 * (1.15 - 0.4 * i / 20), py]).concat(R.slice().reverse().map(([px, py]) => [px, py]).reverse().reverse())); c.fill();
  } else {
    c.strokeStyle = '#7b6a55'; c.lineWidth = tw; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx0, my0, tx, ty); c.stroke();
  }
  if (s > 0.25) {
    c.strokeStyle = 'rgba(21,24,25,.35)'; c.lineWidth = Math.max(0.6, 1.6 * s);
    c.beginPath();
    for (let f = 0.04; f < 0.96; f += s > 0.6 ? 0.025 : 0.06) {
      const [bx, by] = trunk(f), w = tw * (1.15 - 0.4 * f) * 0.45;
      c.moveTo(bx - w, by); c.quadraticCurveTo(bx, by + 2.5 * s, bx + w, by - 0.5 * s);
    }
    c.stroke();
  }
  // the fronds: arching ribs; close up they are feathered with leaflets
  const n = s > 0.6 ? 13 : 9;
  const fronds = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + ((i + 0.5) / n - 0.5) * Math.PI * 1.95 + rr.range(-0.1, 0.1);
    const len = (110 + rr.range(-10, 22)) * s * (Math.abs(Math.cos(a)) > 0.5 ? 1 : 0.85);
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + len * 0.48;
    const mx = tx + Math.cos(a) * len * 0.55, my = ty + Math.sin(a) * len * 0.75 - 16 * s;
    fronds.push({ a, len, ex, ey, mx, my, col: i % 2 ? EMERALD : JADE });
  }
  // the far ones first, darker
  fronds.sort((f1, f2) => Math.sin(f1.a) - Math.sin(f2.a));
  for (const fr of fronds) {
    const { ex, ey, mx, my } = fr;
    const at2 = (f) => [lerp(lerp(tx, mx, f), lerp(mx, ex, f), f), lerp(lerp(ty, my, f), lerp(my, ey, f), f)];
    if (s > 0.6) {
      // leaflets: thin blades hanging from both sides of the rib
      c.fillStyle = fr.col;
      for (let f = 0.08; f < 0.98; f += 0.045) {
        const [px, py] = at2(f), [qx, qy] = at2(f + 0.02);
        const dx = qx - px, dy = qy - py, dl = Math.hypot(dx, dy) || 1;
        const nx = -dy / dl, ny = dx / dl;
        const ll = (30 * s) * Math.sin(Math.PI * Math.min(1, f * 1.1)) + 6 * s;
        for (const sd of [-1, 1]) {
          const tipx = px + nx * ll * sd * 0.8 + dx / dl * ll * 0.35, tipy = py + ny * ll * sd * 0.8 + dy / dl * ll * 0.35 + ll * 0.45;
          c.beginPath(); c.moveTo(px - dx / dl * 2.2 * s, py - dy / dl * 2.2 * s);
          c.quadraticCurveTo((px + tipx) / 2 + nx * sd * 3 * s, (py + tipy) / 2 - 4 * s, tipx, tipy);
          c.quadraticCurveTo((px + tipx) / 2, (py + tipy) / 2, px + dx / dl * 3 * s, py + dy / dl * 3 * s);
          c.fill();
        }
      }
      c.strokeStyle = DEEP; c.lineWidth = 2.2 * s * 0.6;
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    } else {
      const w = 16 * s, nx = -Math.sin(fr.a) * w, ny = Math.cos(fr.a) * w;
      c.fillStyle = fr.col;
      c.beginPath(); c.moveTo(tx, ty);
      c.quadraticCurveTo(mx + nx, my + ny, ex, ey);
      c.quadraticCurveTo(mx - nx * 0.4, my - ny * 0.4, tx, ty); c.fill();
      if (s > 0.2) {
        c.strokeStyle = 'rgba(8,64,47,.7)'; c.lineWidth = Math.max(0.5, 1.4 * s);
        c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
      }
    }
  }
  c.fillStyle = '#8a6a3a';
  for (const [dx, dy] of [[-5, 4], [4, 5], [0, 8], [-1, 2]]) { c.beginPath(); c.arc(tx + dx * s, ty + dy * s, 4.5 * s, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = 'rgba(21,24,25,.3)';
  for (const [dx, dy] of [[-5, 4], [4, 5]]) { c.beginPath(); c.arc(tx + dx * s + 1.4 * s, ty + dy * s + 1.4 * s, 2.6 * s, 0, Math.PI * 2); c.fill(); }
}

// ---------------------------------------------------------------- the garden in the corner
// big tropical leaves in the corner, the way Burle Marx planted the avenue
function garden(p, r) {
  const ox = IX - 10, oy = IY + IH + 10;
  const leaves = [
    { kind: 'sword', x: ox + 40, a: -1.42, len: 560, t: 7.50 },
    { kind: 'sword', x: ox + 90, a: -1.2, len: 500, t: 7.56 },
    { kind: 'sword', x: ox + 20, a: -1.62, len: 470, t: 7.62 },
    { kind: 'sword', x: ox + 150, a: -1.0, len: 430, t: 7.68 },
    { kind: 'sword', x: ox + 210, a: -0.78, len: 360, t: 7.74 },
    { kind: 'monstera', x: ox + 160, y: oy - 250, a: -1.12, len: 270, col: EMERALD, t: 7.85 },
    { kind: 'flower', x: ox + 290, y: oy - 430, a: -0.7, t: 8.00 },
    { kind: 'monstera', x: ox + 40, y: oy - 20, a: -0.72, len: 320, col: JADE, t: 8.10 },
    { kind: 'monstera', x: ox + 390, y: oy - 40, a: -0.42, len: 240, col: LEAF, t: 8.20 },
    { kind: 'flower', x: ox + 500, y: oy - 230, a: -0.3, t: 8.30 },
  ];
  for (const lf of leaves) {
    if (lf.kind === 'sword') {
      const x0 = lf.x, y0 = oy;
      const ex = x0 + Math.cos(lf.a) * lf.len, ey = y0 + Math.sin(lf.a) * lf.len;
      p.group('garden', boxOf([[x0, y0], [ex, ey]], 60), (c) => {
        const nx = -Math.sin(lf.a), ny = Math.cos(lf.a), w = 26;
        const mx = (x0 + ex) / 2 + nx * 30, my = (y0 + ey) / 2 + ny * 30;
        c.fillStyle = DEEP;
        c.beginPath(); c.moveTo(x0 - nx * w * 0.3, y0 - ny * w * 0.3);
        c.quadraticCurveTo(mx - nx * w, my - ny * w, ex, ey);
        c.quadraticCurveTo(mx + nx * w, my + ny * w, x0 + nx * w * 0.3, y0 + ny * w * 0.3); c.fill();
        c.strokeStyle = 'rgba(99,189,138,.55)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
      }, { t: lf.t, d: 0.8, reveal: 'rise', ease: 'inOut' });
    } else if (lf.kind === 'monstera') {
      p.group('garden', { x: lf.x - lf.len * 1.1, y: lf.y - lf.len * 1.1, w: lf.len * 2.2, h: lf.len * 2.2 }, (c) => monstera(c, lf.x, lf.y, lf.a, lf.len, lf.col), { t: lf.t, d: 0.8, reveal: 'pop' });
    } else {
      p.group('garden', { x: lf.x - 90, y: lf.y - 110, w: 180, h: 240 }, (c) => strelitzia(c, lf.x, lf.y, lf.a), { t: lf.t, d: 0.7, reveal: 'pop' });
    }
  }
}

// a heart-shaped leaf with slits running in to the rib
function monstera(c, x, y, a, len, col) {
  c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2);
  // the stalk
  c.strokeStyle = shade(col, 0.8); c.lineWidth = len * 0.035; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, len * 0.1); c.quadraticCurveTo(len * 0.05, len * 0.6, 0, len * 1.1); c.stroke();
  // half-widths along the rib (rib runs from y = 0 up to y = -len)
  const side = (sd) => {
    const pts = [[0, len * 0.06]];
    const slits = [0.18, 0.34, 0.5, 0.66, 0.8];
    for (let k = 0; k <= 40; k++) {
      const t = k / 40;
      const w = len * 0.5 * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.15 * t) + (t < 0.12 ? len * 0.12 * (1 - t / 0.12) : 0);
      const yy = -t * len + (t < 0.1 ? len * 0.08 * (1 - t / 0.1) : 0);
      const sl = slits.find((q) => Math.abs(q - t) < 0.013);
      if (sl !== undefined && w > len * 0.12) {
        pts.push([sd * w, yy + len * 0.02], [sd * w * 0.22, yy - len * 0.02], [sd * w * 0.98, yy - len * 0.035]);
      } else pts.push([sd * w, yy]);
    }
    pts.push([0, -len]);
    return pts;
  };
  const L = side(-1), R = side(1);
  c.fillStyle = col; poly(c, L.concat(R.slice().reverse())); c.fill();
  c.strokeStyle = shade(col, 0.62); c.lineWidth = 3; c.lineJoin = 'round'; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.08)'; poly(c, L.concat([[0, -len], [0, len * 0.06]])); c.fill();
  // rib and veins
  c.strokeStyle = mix(col, WHITE, 0.35); c.lineWidth = len * 0.012;
  c.beginPath(); c.moveTo(0, len * 0.05); c.lineTo(0, -len * 0.95);
  for (let k = 1; k < 6; k++) { const yy = -len * (k * 0.16); c.moveTo(0, yy + len * 0.04); c.quadraticCurveTo(len * 0.12, yy - len * 0.02, len * 0.34, yy - len * 0.05); c.moveTo(0, yy + len * 0.04); c.quadraticCurveTo(-len * 0.12, yy - len * 0.02, -len * 0.34, yy - len * 0.05); }
  c.stroke();
  // the small holes by the rib
  c.fillStyle = shade(col, 0.55);
  for (let k = 1; k < 5; k++) for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(sd * len * 0.1, -len * (0.12 + k * 0.15), len * 0.035, len * 0.016, sd * 0.4, 0, Math.PI * 2); c.fill(); }
  c.restore();
}

// a bird of paradise: the beak, orange crest and blue tongue
function strelitzia(c, x, y, a) {
  c.save(); c.translate(x, y); c.rotate(a);
  c.strokeStyle = EMERALD; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-10, 110); c.quadraticCurveTo(-6, 40, 0, 0); c.stroke();
  c.fillStyle = DEEP; poly(c, [[-6, 4], [70, -6], [76, 0], [6, 14]]); c.fill();
  c.fillStyle = '#7d3b5a'; poly(c, [[-4, 6], [66, -3], [70, 2], [4, 12]]); c.fill();
  c.fillStyle = '#f08a3c';
  for (const [dx, h0] of [[14, 52], [26, 62], [38, 50]]) poly(c, [[dx - 7, -2], [dx + 7, -3], [dx - 6, -h0], [dx - 14, -h0 + 6]]), c.fill();
  c.fillStyle = SUN; poly(c, [[22, -3], [30, -3], [22, -44]]); c.fill();
  c.fillStyle = SEA; poly(c, [[30, -4], [44, -5], [48, -30]]); c.fill();
  c.restore();
}

// ---------------------------------------------------------------- title and frame
function title(p) {
  const o = { family: TITLE, weight: 400, color: INK };
  p.type('title', 'RIO', 1030, 420, { ...o, size: 360, align: 'center', track: 0.02, shadow: SUN, sx: 10, sy: 10, t: 10.6, gap: 0.22, d: 0.9 });
  p.type('title', 'DE JANEIRO', 1030, 500, { ...o, size: 62, align: 'center', track: 0.42, t: 11.5, gap: 0.07, d: 0.6 });
  p.type('title', 'COPACABANA · PÃO DE AÇÚCAR · CORCOVADO', W / 2, 1938, { ...o, size: 34, align: 'center', track: 0.3, color: mix(INK, PAPER, 0.15), t: 12.6, gap: 0.025, d: 0.5, reveal: 'fade' });
}

function frame(p) {
  // the picture's rounded corners, and a keyline round it
  const R = 36;
  p.group('mask', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.fillStyle = PAPER;
    c.beginPath(); c.rect(0, 0, W, H); c.roundRect(IX, IY, IW, IH, R); c.fill('evenodd');
  }, { t: 0, d: 0.05, reveal: 'none' });
  const pts = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= 8; i++) { const a = a0 + (i / 8) * (Math.PI / 2); pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); } };
  corner(IX + R, IY + R, Math.PI); corner(IX + IW - R, IY + R, -Math.PI / 2); corner(IX + IW - R, IY + IH - R, 0); corner(IX + R, IY + IH - R, Math.PI / 2);
  pts.push(pts[0]);
  p.pen('frame', pts, INK, 3, { t: 12.2, d: 1.8 });
}
