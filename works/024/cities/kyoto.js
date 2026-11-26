// Kyoto: a Rimpa screen. A ground of gold leaf laid in squares, banks of gold
// cloud, the green hills of Higashiyama pooled with darker green, the Yasaka
// pagoda and the stage of Kiyomizu among the maples, the roofs of the city
// between the clouds, a dark stream in Kōrin's curls running down under the
// Togetsukyō bridge to the pond where the Golden Pavilion stands against its
// pines. Maple branches close by. The name brushed on the gold in Zen Antique.

import { Plate, W, H } from '../print.js';
import { lerp, clamp, poly, rng } from '../kit.js';

const BOLE = '#8e4a2e', GOLD = '#d6ae52', GOLD_L = '#e4c473', GOLD_D = '#b88a33', SEAM = 'rgba(150,108,38,.1)';
const SUMI = '#1b1714', LACQUER = '#1c1411', BROCADE = '#23304c';
const WATER = '#1e2838', WATER_D = '#141b27', SWIRL = 'rgba(226,202,128,.75)';
const GREEN = '#4f8a62', GREEN_D = '#2f6146', GREEN_L = '#78a57a', AZURE = '#3d6488', PINE = '#26432f';
const ROOF = '#4d5766', ROOF_D = '#384150', WALL = '#efe6cf', WOOD = '#5a3a26', BARK = '#4a3326';
const LEAF = ['#c83f27', '#a6252a', '#df6a2b', '#e38b31', '#b8302a', '#d4522a'];
const PAV = '#ecc457', PAV_D = '#b98a2c', PAV_L = '#f6dc85';

const TITLE = '京都';
export const city = {
  id: 'kyoto', name: 'Kyoto', wall: '#2a2216',
  alt: 'A Rimpa screen on gold leaf: the Golden Pavilion over its dark pond against pines, a stream in curling lines under the Togetsukyō bridge, the roofs of the city between gold clouds, the Yasaka pagoda and the stage of Kiyomizu on green hills, wild geese, maple branches, and the name 京都 brushed in black',
  google: 'family=Zen+Antique',
  fonts: [['400 100px "Zen Antique"', TITLE + 'KYOTO·HEIAN-KYŌ']],
  build,
};

const FONT = '"Zen Antique", serif';
// the gold field inside the mounting
const GX = 84, GY = 84, GW = W - 168, GH = H - 168;
const PANELS = 4;

function build() {
  const p = new Plate({ paper: BOLE, seed: 794 });
  const r = p.r;
  p.clip = { x: GX, y: GY, w: GW, h: GH };
  p.stack('mount', 'gold', 'clouds', 'hills', 'temple', 'pagoda', 'roofs', 'clouds2', 'stream', 'swirls', 'pond', 'pines', 'pavilion',
    'bridge', 'clouds3', 'maples', 'leaves', 'title', 'seams');
  p.layer('mount', { clip: false });

  mount(p, r);
  gold(p, rng(2));
  clouds(p, rng(3), 'clouds', [[600, 214, 940, 56], [1080, 820, 520, 40]], 1.8);
  hills(p, rng(4));
  kiyomizu(p, rng(5));
  pagoda(p, rng(6));
  roofs(p, rng(7));
  clouds(p, rng(8), 'clouds2', [[520, 904, 330, 34], [860, 1084, 760, 50], [GX - 60, 1150, 520, 46]], 6.2);
  stream(p, rng(9));
  pond(p, rng(10));
  pines(p, rng(11));
  pavilion(p, rng(12));
  bridge(p, rng(13));
  clouds(p, rng(14), 'clouds3', [[1130, 1112, 470, 66], [GX - 50, 1500, 300, 34]], 8.6);
  maples(p, rng(15));
  falling(p, rng(16));
  title(p);
  seams(p);
  return p;
}

// ---------------------------------------------------------------- the mounting
// a black lacquer edge and a band of indigo brocade with a gold lozenge pattern
function mount(p, r) {
  p.group('mount', { x: 0, y: 0, w: W, h: H }, (c) => {
    // the frame only: the field inside is left for the gold
    const ring = (x, y, w, h, i) => { c.beginPath(); c.rect(x, y, w, h); c.rect(x + i, y + i, w - 2 * i, h - 2 * i); };
    c.fillStyle = LACQUER; ring(0, 0, W, H, 36); c.fill('evenodd');
    c.strokeStyle = 'rgba(255,230,190,.08)'; c.lineWidth = 6; c.strokeRect(12, 12, W - 24, H - 24);
    c.fillStyle = BROCADE; ring(36, 36, W - 72, H - 72, GX - 6 - 36); c.fill('evenodd');
    c.fillStyle = LACQUER; ring(GX - 6, GY - 6, GW + 12, GH + 12, 6); c.fill('evenodd');
  }, { t: 0, d: 0.8, reveal: 'fade' });
  // the brocade: a lattice of small gold lozenges with a flower in each
  const dots = [];
  const step = 24;
  const band = (x, y) => x > 36 && x < W - 36 && y > 36 && y < H - 36 && (x < GX - 8 || x > GX + GW + 8 || y < GY - 8 || y > GY + GH + 8);
  for (let y = 36 + step / 2; y < H - 36; y += step / 2) {
    for (let x = 36 + ((y / (step / 2)) % 2 ? step / 2 : 0); x < W - 36; x += step) if (band(x, y)) dots.push([x, y]);
  }
  p.group('mount', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = 'rgba(214,174,82,.55)'; c.lineWidth = 1;
    c.beginPath();
    for (const [x, y] of dots) { c.moveTo(x, y - 6); c.lineTo(x + 6, y); c.lineTo(x, y + 6); c.lineTo(x - 6, y); c.closePath(); }
    c.stroke();
    c.fillStyle = 'rgba(226,196,115,.8)';
    for (const [x, y] of dots) { c.beginPath(); c.arc(x, y, 1.6, 0, Math.PI * 2); c.fill(); }
    // a fine gold line either side of the brocade
    c.strokeStyle = 'rgba(214,174,82,.8)'; c.lineWidth = 1.5;
    c.strokeRect(36, 36, W - 72, H - 72); c.strokeRect(GX - 7, GY - 7, GW + 14, GH + 14);
  }, { t: 0.3, d: 0.9, reveal: 'fade' });
}

// ---------------------------------------------------------------- the gold
// gold leaf laid square by square, each a little different, seams showing
function gold(p, r) {
  const S = 92;
  const cols = Math.ceil(GW / S) + 1, rows = Math.ceil(GH / S) + 1;
  const tones = [];
  for (let j = 0; j < rows; j++) {
    const row = [];
    for (let i = 0; i < cols; i++) {
      const k = r.range(-1, 1);
      row.push({ k, dx: r.range(-0.3, 0.3), dy: r.range(-0.3, 0.3), spots: Array.from({ length: r.int(0, 2) }, () => [r(), r(), r.range(6, 20)]) });
    }
    tones.push(row);
  }
  // the leaves differ only a breath: the gold reads as one surface with a faint grid
  const tone = (k) => (k > 0 ? `rgba(246,222,150,${0.018 * k})` : `rgba(150,105,35,${-0.016 * k})`);
  for (let j = 0; j < rows; j++) {
    const y = GY + j * S;
    p.group('gold', { x: GX, y: y - 4, w: GW, h: S + 8 }, (c) => {
      for (let i = 0; i < cols; i++) {
        const t = tones[j][i], x = GX + i * S;
        c.fillStyle = GOLD; c.fillRect(x + t.dx - 0.5, y + t.dy - 0.5, S + 1, S + 1);
        c.fillStyle = tone(t.k); c.fillRect(x + t.dx, y + t.dy, S, S);
        // faint tarnish
        for (const [u, v, rad] of t.spots) { c.fillStyle = 'rgba(160,112,40,.04)'; c.beginPath(); c.arc(x + u * S, y + v * S, rad, 0, Math.PI * 2); c.fill(); }
        c.strokeStyle = SEAM; c.lineWidth = 0.6; c.strokeRect(x + t.dx + 0.5, y + t.dy + 0.5, S - 1, S - 1);
      }
    }, { t: 0.5 + j * 0.07, d: 0.7, reveal: j % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  }
}

// ---------------------------------------------------------------- clouds
// suyari-gasumi: long banks of gold cloud with rounded, lobed ends, raised
// in a paler gold and outlined, dusted with flakes
function cloudPts(r, x, y, w, h) {
  const top = [], bot = [];
  const lobes = Math.max(2, Math.round(w / (h * 2.2)));
  // the left end: a round lobe; the right end too; the top edge rises in lobes
  for (let i = 0; i <= 40; i++) { const a = Math.PI / 2 + (i / 40) * Math.PI; top.push([x + h / 2 + Math.cos(a) * h / 2, y + Math.sin(a) * h / 2]); }
  for (let k = 0; k < lobes; k++) {
    const x0 = x + h / 2 + (k / lobes) * (w - h), x1 = x + h / 2 + ((k + 1) / lobes) * (w - h);
    const lift = h * r.range(0.15, 0.4);
    for (let i = 1; i <= 16; i++) { const t = i / 16; top.push([lerp(x0, x1, t), y - h / 2 - Math.sin(t * Math.PI) * lift]); }
  }
  for (let i = 0; i <= 40; i++) { const a = -Math.PI / 2 + (i / 40) * Math.PI; top.push([x + w - h / 2 + Math.cos(a) * h / 2, y + Math.sin(a) * h / 2]); }
  for (let k = lobes; k > 0; k--) {
    const x0 = x + h / 2 + (k / lobes) * (w - h), x1 = x + h / 2 + ((k - 1) / lobes) * (w - h);
    const dip = h * r.range(0.0, 0.15);
    for (let i = 1; i <= 12; i++) { const t = i / 12; bot.push([lerp(x0, x1, t), y + h / 2 + Math.sin(t * Math.PI) * dip]); }
  }
  return [...top, ...bot];
}
function clouds(p, r, layer, list, t0) {
  list.forEach(([x, y, w, h], i) => {
    const pts = cloudPts(r, x, y, w, h);
    const flakes = [];
    for (let k = 0; k < w / 6; k++) flakes.push([r.range(x, x + w), r.range(y - h * 0.6, y + h * 0.5), r.range(1.2, 4.5), r() * Math.PI]);
    const box = { x: x - 10, y: y - h * 1.2, w: w + 20, h: h * 2 + 10 };
    p.group(layer, box, (c) => {
      c.fillStyle = GOLD_L; poly(c, pts); c.fill();
      c.save(); poly(c, pts); c.clip();
      // the flakes of cut leaf, and a band of deeper gold along the foot
      for (const [fx, fy, s, a] of flakes) {
        c.fillStyle = 'rgba(250,232,170,.9)';
        c.save(); c.translate(fx, fy); c.rotate(a); c.fillRect(-s / 2, -s / 2, s, s * 0.8); c.restore();
      }
      c.fillStyle = 'rgba(184,138,51,.25)'; c.fillRect(x, y + h * 0.18, w, h);
      c.restore();
      c.strokeStyle = GOLD_D; c.lineWidth = 2.2; c.lineJoin = 'round'; poly(c, pts); c.stroke();
      c.strokeStyle = 'rgba(255,240,200,.6)'; c.lineWidth = 1;
      c.save(); c.translate(0, 3); poly(c, pts); c.restore(); c.stroke();
    }, { t: t0 + i * 0.3, d: 1.2, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ---------------------------------------------------------------- the hills
// Higashiyama: rounded green hills, their color pooled darker at the edges
// (tarashikomi), a bluer range far behind
function hillPts(x0, x1, yb, peaks) {
  const pts = [[x0, yb]];
  for (let x = x0; x <= x1; x += 6) {
    let y = yb;
    for (const [px, py, pw] of peaks) { const d = (x - px) / pw; if (Math.abs(d) < 1) y = Math.min(y, yb - (yb - py) * Math.cos(d * Math.PI / 2) ** 1.4); }
    pts.push([x, y]);
  }
  pts.push([x1, yb]);
  return pts;
}
function hills(p, r) {
  const ranges = [
    { c: AZURE, d: '#2a4a6b', yb: 900, x0: 480, x1: GX + GW + 10, peaks: [[700, 470, 260], [1040, 400, 330], [1400, 430, 300]] },
    { c: GREEN, d: GREEN_D, yb: 960, x0: 520, x1: GX + GW + 10, peaks: [[640, 640, 200], [930, 560, 280], [1290, 520, 320], [1520, 600, 200]] },
    { c: GREEN_L, d: GREEN, yb: 1000, x0: 560, x1: GX + GW + 10, peaks: [[760, 760, 220], [1120, 700, 260], [1450, 690, 210]] },
  ];
  ranges.forEach((h, k) => {
    const pts = hillPts(h.x0, h.x1, h.yb, h.peaks);
    // pools of darker color, soft-edged, along the ridges
    // tarashikomi: wet pigment dropped into wet pigment, drying in blotches
    // with darker rims
    const pools = [];
    for (let i = 0; i < 22; i++) {
      const j = r.int(1, pts.length - 2), [x, y] = pts[j];
      const cx = x + r.range(-30, 30), cy = y + r.range(10, 110), rad = r.range(20, 60), n = 18, ph = r() * 6;
      const blob = [];
      for (let q = 0; q < n; q++) { const a = (q / n) * Math.PI * 2; const rr = rad * (1 + 0.28 * Math.sin(a * 3 + ph) + 0.15 * Math.sin(a * 5 + ph * 2)); blob.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.6]); }
      pools.push(blob);
    }
    const dots = [];
    for (let i = 0; i < 90; i++) { const j = r.int(1, pts.length - 2); dots.push([pts[j][0] + r.range(-30, 30), pts[j][1] + r.range(10, 140), r.range(2, 5)]); }
    const box = { x: h.x0 - 10, y: Math.min(...pts.map((q) => q[1])) - 10, w: h.x1 - h.x0 + 20, h: h.yb - Math.min(...pts.map((q) => q[1])) + 20 };
    p.group('hills', box, (c) => {
      c.fillStyle = h.c; poly(c, pts); c.fill();
      c.save(); poly(c, pts); c.clip();
      c.lineJoin = 'round';
      for (const blob of pools) {
        c.fillStyle = 'rgba(18,38,30,.14)'; poly(c, blob); c.fill();
        c.strokeStyle = 'rgba(18,38,30,.22)'; c.lineWidth = 4; c.stroke();
        c.strokeStyle = 'rgba(18,38,30,.3)'; c.lineWidth = 1.2; c.stroke();
      }
      // the ridge darker, as the pigment pooled at the edge
      c.strokeStyle = h.d; c.lineWidth = 9; c.globalAlpha = 0.6; poly(c, pts); c.stroke();
      c.globalAlpha = 1;
      c.fillStyle = 'rgba(20,45,30,.55)';
      for (const [x, y, rad] of dots) { c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill(); }
      c.restore();
    }, { t: 2.6 + k * 0.45, d: 1.3, reveal: 'rise', ease: 'inOut' });
  });
}

// ---------------------------------------------------------------- Kiyomizu
// the main hall on its stage, held out over the slope on a grid of pillars
function kiyomizu(p, r) {
  const x = 1250, y = 760; // the front edge of the stage
  const box = { x: x - 190, y: y - 150, w: 380, h: 280 };
  p.group('temple', box, (c) => {
    // the lattice of pillars and ties under the stage
    c.fillStyle = 'rgba(90,58,38,.25)'; c.fillRect(x - 150, y, 210, 110);
    c.strokeStyle = WOOD; c.lineWidth = 3;
    c.beginPath();
    for (let k = 0; k <= 8; k++) { const xx = x - 150 + k * 26; c.moveTo(xx, y); c.lineTo(xx, y + 110 - k * 4); }
    for (let k = 1; k <= 4; k++) { const yy = y + k * 22; c.moveTo(x - 152, yy); c.lineTo(x + 60, yy); }
    c.stroke();
    // the stage
    c.fillStyle = '#8a5a34'; c.fillRect(x - 160, y - 8, 230, 10);
    c.fillStyle = '#c99b5f'; c.fillRect(x - 160, y - 16, 230, 8);
    c.strokeStyle = WOOD; c.lineWidth = 1.5; c.beginPath(); for (let xx = x - 156; xx < x + 70; xx += 9) { c.moveTo(xx, y - 16); c.lineTo(xx, y - 30); } c.moveTo(x - 160, y - 30); c.lineTo(x + 70, y - 30); c.stroke();
    // the hall: posts and white panels under a great curved roof of bark
    c.fillStyle = WALL; c.fillRect(x - 120, y - 82, 240, 66);
    c.fillStyle = WOOD; for (let xx = x - 120; xx <= x + 120; xx += 30) c.fillRect(xx - 2, y - 82, 4, 66);
    c.fillRect(x - 122, y - 84, 244, 5);
    c.fillStyle = BARK;
    c.beginPath(); c.moveTo(x - 180, y - 78); c.quadraticCurveTo(x - 120, y - 92, x - 90, y - 140); c.lineTo(x + 90, y - 140); c.quadraticCurveTo(x + 120, y - 92, x + 180, y - 78); c.closePath(); c.fill();
    c.fillStyle = '#6b4a35'; c.fillRect(x - 92, y - 146, 184, 8);
    c.strokeStyle = 'rgba(240,210,150,.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 178, y - 79); c.quadraticCurveTo(x, y - 74, x + 178, y - 79); c.stroke();
  }, { t: 4.4, d: 1.0, reveal: 'rise' });
  // maples around it: small round crowns of red
  // maples around it, in autumn: clusters of small leaves
  const small = [];
  for (let i = 0; i < 12; i++) {
    const cx = x + r.range(-220, 230), cy = y + r.range(-10, 150), col = r.pick(LEAF);
    for (let k = 0; k < 9; k++) small.push({ x: cx + r.range(-22, 22), y: cy + r.range(-14, 14), s: r.range(7, 10), a: r.range(-3, 3), col: r() < 0.7 ? col : r.pick(LEAF), vein: false });
  }
  p.group('temple', { x: x - 260, y: y - 40, w: 540, h: 230 }, (c) => { for (const l of small) leaf(c, l); }, { t: 5.0, d: 0.8, reveal: 'pop' });
}

// ---------------------------------------------------------------- the pagoda
// Yasaka: five dark roofs on a slim body, a gilt finial of nine rings
function pagoda(p, r) {
  const cx = 820, base = 930;
  const parts = [];
  let y = base;
  for (let k = 0; k < 5; k++) {
    const bw = lerp(74, 52, k / 4), bh = lerp(64, 50, k / 4), rw = lerp(150, 112, k / 4);
    parts.push({ y, bw, bh, rw, k });
    y -= bh + 26;
  }
  const top = y;
  const box = { x: cx - 170, y: top - 170, w: 340, h: base - top + 180 };
  p.group('pagoda', box, (c) => {
    // the stone base
    c.fillStyle = '#8f8a7c'; c.fillRect(cx - 90, base - 6, 180, 16);
    for (const q of parts) {
      const yb = q.y, yt = q.y - q.bh;
      // the body: dark posts and white panels, a railing at the foot
      c.fillStyle = '#6b3c2a'; c.fillRect(cx - q.bw, yt, q.bw * 2, q.bh);
      c.fillStyle = WALL;
      for (const u of [-0.75, 0, 0.75]) c.fillRect(cx + u * q.bw - q.bw * 0.16, yt + q.bh * 0.25, q.bw * 0.32, q.bh * 0.6);
      c.fillStyle = '#3a2219'; c.fillRect(cx - q.bw - 4, yb - 6, q.bw * 2 + 8, 6);
      // the roof: a deep eave with turned-up corners, the bracketing in shade under it
      const ry = yt - 4, rw = q.rw;
      c.fillStyle = '#2b2422';
      c.fillRect(cx - q.bw - 8, ry - 4, q.bw * 2 + 16, 8);
      c.fillStyle = '#2f3644';
      c.beginPath();
      c.moveTo(cx - rw, ry - 14); c.quadraticCurveTo(cx - rw * 0.7, ry - 6, cx - q.bw, ry - 4); c.lineTo(cx + q.bw, ry - 4);
      c.quadraticCurveTo(cx + rw * 0.7, ry - 6, cx + rw, ry - 14);
      c.quadraticCurveTo(cx + rw * 0.65, ry - 18, cx + q.bw * 0.7, ry - 30); c.lineTo(cx - q.bw * 0.7, ry - 30);
      c.quadraticCurveTo(cx - rw * 0.65, ry - 18, cx - rw, ry - 14);
      c.fill();
      c.strokeStyle = 'rgba(200,190,170,.45)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(cx - rw, ry - 14); c.quadraticCurveTo(cx - rw * 0.7, ry - 6, cx - q.bw, ry - 4); c.lineTo(cx + q.bw, ry - 4); c.quadraticCurveTo(cx + rw * 0.7, ry - 6, cx + rw, ry - 14); c.stroke();
      // tile rows
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1;
      c.beginPath(); for (let xx = cx - q.bw * 0.7; xx < cx + q.bw * 0.7; xx += 6) { c.moveTo(xx, ry - 29); c.lineTo(xx + (xx - cx) * 0.35, ry - 6); } c.stroke();
      // bells at the corners
      c.fillStyle = GOLD_D; c.beginPath(); c.arc(cx - rw + 3, ry - 9, 2.6, 0, Math.PI * 2); c.arc(cx + rw - 3, ry - 9, 2.6, 0, Math.PI * 2); c.fill();
    }
    // the finial
    const fy = top + 20;
    c.fillStyle = '#2f3644'; c.fillRect(cx - 16, fy - 14, 32, 14);
    c.fillStyle = GOLD_D; c.fillRect(cx - 3, fy - 150, 6, 140);
    c.fillStyle = '#e9c66a';
    for (let k = 0; k < 9; k++) { const yy = fy - 24 - k * 11; c.beginPath(); c.ellipse(cx, yy, 11 - k * 0.3, 3, 0, 0, Math.PI * 2); c.fill(); }
    c.beginPath(); c.moveTo(cx, fy - 166); c.quadraticCurveTo(cx + 9, fy - 150, cx, fy - 136); c.quadraticCurveTo(cx - 9, fy - 150, cx, fy - 166); c.fill();
  }, { t: 5.2, d: 1.6, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- the city
// the roofs of the town between the clouds, row on row, in grey tile
function roofs(p, r) {
  // the rows are loose: they wander up and down the slope, the houses step and
  // crowd and leave gaps, and the sizes vary
  const rows = [];
  for (let y0 = 906, k = 0; y0 < 1080; y0 += r.range(24, 36), k++) {
    const s = lerp(0.9, 1.3, (y0 - 906) / 170), items = [], ph = r() * 6, amp = r.range(4, 10);
    for (let x = 560 + r.range(-60, 10); x < GX + GW + 20;) {
      const sz = s * r.range(0.82, 1.15);
      const w = r.range(40, 120) * sz, h = r.range(14, 26) * sz;
      const y = Math.round(y0 + Math.sin(x * 0.007 + ph) * amp + r.range(-4, 4));
      if (!(x > 700 && x < 940 && y < 940) && r() > 0.07) items.push({ x: x + r.range(-3, 3), y, w, h, wall: r.range(8, 14) * sz, tone: r.pick([ROOF, ROOF_D, '#5d6878', '#454f5d']), lit: r() < 0.08, gable: r() < 0.3, tree: r() < 0.16 ? r.pick([PINE, GREEN_D, LEAF[0], LEAF[2]]) : null, kura: r() < 0.1 });
      x += w + r.range(-14, 10) * sz;
    }
    // nearer (lower) houses go over farther ones
    items.sort((a, b) => a.y - b.y);
    rows.push({ y0, items, k });
  }
  rows.forEach(({ y0, items, k }) => {
    p.group('roofs', { x: GX, y: y0 - 60, w: GW, h: 100 }, (c) => {
      for (const b of items) {
        const y = b.y;
        if (b.tree) {
          // a garden tree between the houses: a heap of round crowns
          c.fillStyle = b.tree;
          for (let q = 0; q < 4; q++) { c.beginPath(); c.arc(b.x + b.w * (0.25 + q * 0.17), y - b.h * (0.4 + (q % 2) * 0.4), b.h * 0.75, 0, Math.PI * 2); c.fill(); }
          c.fillRect(b.x + b.w * 0.15, y - b.h * 0.4, b.w * 0.7, b.h * 0.4 + b.wall);
          continue;
        }
        if (b.kura) {
          // a white storehouse, taller, with a dark band at its foot
          c.fillStyle = WALL; c.fillRect(b.x + 4, y - b.h * 0.8, b.w * 0.6, b.h * 0.8 + b.wall);
          c.fillStyle = '#3b3f48'; c.fillRect(b.x + 4, y + b.wall * 0.4, b.w * 0.6, b.wall * 0.6);
          c.fillStyle = '#2b323d'; c.beginPath(); c.moveTo(b.x, y - b.h * 0.8); c.lineTo(b.x + b.w * 0.3 + 2, y - b.h * 1.5); c.lineTo(b.x + b.w * 0.6 + 8, y - b.h * 0.8); c.fill();
          c.fillStyle = '#2b2620'; c.fillRect(b.x + b.w * 0.26, y - b.h * 0.5, b.w * 0.1, b.h * 0.22);
          continue;
        }
        // a white wall and a dark lattice front under each roof
        c.fillStyle = WALL; c.fillRect(b.x + 3, y, b.w - 6, b.wall);
        c.fillStyle = '#6b4a35';
        for (let xx = b.x + 6; xx < b.x + b.w - 6; xx += 4) c.fillRect(xx, y + b.wall * 0.3, 1.4, b.wall * 0.7);
        if (b.lit) { c.fillStyle = 'rgba(230,160,60,.8)'; c.fillRect(b.x + b.w * 0.3, y + 3, b.w * 0.2, b.wall - 4); }
        // the roof
        c.fillStyle = b.tone;
        c.beginPath();
        if (b.gable) { c.moveTo(b.x, y); c.lineTo(b.x + b.w * 0.5, y - b.h * 1.3); c.lineTo(b.x + b.w, y); }
        else { c.moveTo(b.x - 2, y); c.lineTo(b.x + b.w * 0.18, y - b.h); c.lineTo(b.x + b.w * 0.82, y - b.h); c.lineTo(b.x + b.w + 2, y); }
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1;
        c.beginPath(); for (let xx = b.x + 4; xx < b.x + b.w - 2; xx += 5) { c.moveTo(xx, y - 1); c.lineTo(xx + (xx - b.x - b.w / 2) * 0.1, y - b.h * 0.9); } c.stroke();
        c.fillStyle = '#2b323d'; c.fillRect(b.x + (b.gable ? b.w * 0.45 : b.w * 0.18), y - (b.gable ? b.h * 1.3 : b.h) - 2, b.gable ? b.w * 0.1 : b.w * 0.64, 3);
      }
    }, { t: 5.6 + k * 0.16, d: 0.9, reveal: 'rise', ease: 'inOut' });
  });
}

// ---------------------------------------------------------------- the stream
// the river comes down from between the hills and widens into the pond: dark
// water in Kōrin's way, with curling lines of gold in it
const STREAM = [[1500, 1094], [1210, 1104], [920, 1142], [640, 1212], [420, 1300], [300, 1420], [370, 1580]];
const streamC = (t) => {
  // its center from under the cloud (t = 0) to where it meets the pond (t = 1),
  // a smooth curve through the points above
  const n = STREAM.length - 1, f = clamp(t) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i;
  const P0 = STREAM[Math.max(0, i - 1)], P1 = STREAM[i], P2 = STREAM[i + 1], P3 = STREAM[Math.min(n, i + 2)];
  const cr = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u * u + (-a + 3 * b - 3 * c2 + d) * u * u * u);
  return [cr(P0[0], P1[0], P2[0], P3[0]), cr(P0[1], P1[1], P2[1], P3[1])];
};
// one bold sweep that swells as it comes round the bend and opens into the pond
const streamW = (t) => lerp(84, 300, t) + 80 * Math.sin(Math.PI * clamp(t)) ** 1.5;
function streamShape() {
  const L = [], R = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60, [x, y] = streamC(t), [x2, y2] = streamC(Math.min(1, t + 0.01));
    const a = Math.atan2(y2 - y, x2 - x), w = streamW(t);
    L.push([x - Math.sin(a) * -w / 2, y - Math.cos(a) * w / 2]);
    R.push([x + Math.sin(a) * -w / 2, y + Math.cos(a) * w / 2]);
  }
  return [...L, ...R.reverse()];
}
// one flowing line with curls: it runs along the current, and now and then
// turns in on itself in a little spiral
function swirlLine(r, path, curlEvery) {
  const out = [];
  let next = r.range(curlEvery * 0.3, curlEvery);
  let s = 0;
  for (let i = 0; i < path.length; i++) {
    out.push(path[i]);
    if (i > 0) s += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    if (s > next && i < path.length - 2) {
      const [x, y] = path[i], [x2, y2] = path[i + 1];
      const a = Math.atan2(y2 - y, x2 - x), side = r() < 0.5 ? 1 : -1, R0 = r.range(9, 18);
      const cx = x + Math.cos(a + side * Math.PI / 2) * R0, cy = y + Math.sin(a + side * Math.PI / 2) * R0;
      const a0 = a - side * Math.PI / 2;
      const turns = r.range(1.2, 1.9);
      for (let k = 1; k <= 30; k++) {
        const f = k / 30, ang = a0 + side * f * turns * Math.PI * 2, rad = R0 * (1 - f * 0.85);
        out.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
      }
      return { pts: out, rest: path.slice(i + 1) };
    }
  }
  return { pts: out, rest: [] };
}
function stream(p, r) {
  const shape = streamShape();
  const box = { x: GX, y: 1040, w: 1360, h: 600 };
  p.group('stream', box, (c) => {
    c.fillStyle = WATER; poly(c, shape); c.fill();
    c.strokeStyle = WATER_D; c.lineWidth = 6; poly(c, shape); c.stroke();
    // a fine line of gold along each bank
    c.strokeStyle = GOLD_L; c.lineWidth = 1.6; c.lineJoin = 'round'; poly(c, shape); c.stroke();
  }, { t: 6.4, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // Kōrin's water: lines that run with the current and roll over into curls,
  // the curls set at an even beat and staggered line to line
  const curl = (pts, R0) => {
    const [x, y] = pts[pts.length - 2], [x2, y2] = pts[pts.length - 1];
    const a = Math.atan2(y2 - y, x2 - x);
    const cx = x2 + Math.cos(a + Math.PI / 2) * R0, cy = y2 + Math.sin(a + Math.PI / 2) * R0, a0 = a - Math.PI / 2;
    for (let k = 1; k <= 34; k++) { const f = k / 34, ang = a0 + f * 1.55 * Math.PI * 2, rad = R0 * (1 - f * 0.8); pts.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]); }
    return pts;
  };
  const at = (t, k) => {
    const [x, y] = streamC(t), [x2, y2] = streamC(Math.min(1, t + 0.004)), [x0, y0] = streamC(Math.max(0, t - 0.004));
    const a = Math.atan2(y2 - y0, x2 - x0), w = streamW(t);
    return [x - Math.sin(a) * k * w, y + Math.cos(a) * k * w];
  };
  const lines = [];
  const KS = [-0.34, -0.17, 0, 0.17, 0.34];
  const STEP = 0.125;
  KS.forEach((k, li) => {
    for (let tc = 0.07 + (li % 2) * STEP / 2 + li * 0.01; tc < 0.99; tc += STEP) {
      const t0 = Math.max(0.005, tc - STEP * 0.92), pts = [];
      for (let t = t0; t <= tc + 1e-6; t += 0.004) pts.push(at(t, k));
      if (pts.length < 4) continue;
      const w = streamW(tc);
      lines.push(curl(pts, clamp(w * 0.075, 10, 24)));
    }
  });
  lines.sort((a, b) => a[0][1] - b[0][1]);
  const per = 8;
  for (let i = 0; i < lines.length; i += per) {
    const set = lines.slice(i, i + per);
    p.strokes('swirls', set, SWIRL, 2.0, { t: 7.0 + (i / per) * 0.12, d: 1.0, reveal: 'fade' });
  }
}

// ---------------------------------------------------------------- the pond
// Kyōko-chi, the mirror pond: dark water across the foot of the screen, curls
// of gold in it, islets with rocks
const PONDY = 1560;
function pondShape() {
  const pts = [[GX - 10, PONDY + 40]];
  for (let x = GX; x <= GX + GW + 10; x += 20) pts.push([x, PONDY + Math.sin(x * 0.01) * 10 - (x > 500 && x < 700 ? 30 : 0)]);
  pts.push([GX + GW + 10, GY + GH + 10], [GX - 10, GY + GH + 10]);
  return pts;
}
function pond(p, r) {
  const shape = pondShape();
  p.group('pond', { x: GX - 10, y: PONDY - 50, w: GW + 20, h: GY + GH - PONDY + 60 }, (c) => {
    c.fillStyle = WATER; poly(c, shape); c.fill();
    c.strokeStyle = WATER_D; c.lineWidth = 7; poly(c, shape); c.stroke();
  }, { t: 7.2, d: 1.2, reveal: 'fall', ease: 'inOut' });
  const lines = [];
  for (let y = PONDY + 40; y < GY + GH; y += r.range(22, 34)) {
    const path = [];
    for (let x = GX - 20; x < GX + GW + 20; x += 8) path.push([x, y + Math.sin(x * 0.012 + y * 0.03) * 6]);
    let rest = path.slice(r.int(0, 8));
    while (rest.length > 4) {
      const { pts, rest: nr } = swirlLine(r, rest, r.range(200, 420));
      lines.push(pts);
      rest = nr.slice(r.int(3, 9));
    }
  }
  const per = 6;
  for (let i = 0; i < lines.length; i += per) {
    p.strokes('pond', lines.slice(i, i + per), SWIRL, 1.6, { t: 7.6 + (i / per) * 0.1, d: 1.2, reveal: 'draw' });
  }
}

// ---------------------------------------------------------------- the pines
// the dark wooded hill behind the pavilion, and pines on the islets
function pineClump(c, r, x, y, s) {
  // a Rimpa pine: a leaning trunk and flat, layered pads of needles
  c.strokeStyle = BARK; c.lineWidth = 6 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 20 * s, y - 50 * s, x - 10 * s, y - 90 * s); c.stroke();
  const pads = [[-30, -96, 54], [24, -78, 46], [-8, -124, 40], [40, -112, 30], [-50, -70, 36]];
  for (const [dx, dy, w] of pads) {
    const px = x + dx * s, py = y + dy * s, pw = w * s;
    c.fillStyle = PINE;
    c.beginPath(); c.ellipse(px, py, pw, pw * 0.36, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(120,160,110,.6)'; c.lineWidth = 1;
    c.beginPath();
    for (let k = -0.8; k <= 0.8; k += 0.16) { c.moveTo(px + k * pw, py - pw * 0.3 * Math.sqrt(1 - k * k)); c.lineTo(px + k * pw * 1.05, py + pw * 0.05); }
    c.stroke();
  }
}
function pines(p, r) {
  // the hill: a dark mound of trees, its top in round crowns
  const pts = [[720, PONDY + 10]];
  for (let x = 720; x <= 1480; x += 5) {
    const k = (x - 720) / 760;
    const y = PONDY - Math.sin(k * Math.PI) ** 0.7 * 300 + Math.sin(x * 0.03) * 10 + Math.sin(x * 0.071 + 1) * 6;
    pts.push([x, y]);
  }
  pts.push([1480, PONDY + 10]);
  const crowns = [];
  for (let i = 0; i < 70; i++) { const j = r.int(1, pts.length - 2); crowns.push([pts[j][0], pts[j][1] + r.range(0, 30), r.range(14, 30)]); }
  const dots = [];
  for (let i = 0; i < 260; i++) dots.push([r.range(720, 1480), r.range(1240, PONDY), r.range(4, 10)]);
  p.group('pines', { x: 700, y: 1200, w: 800, h: PONDY - 1180 }, (c) => {
    c.fillStyle = PINE; poly(c, pts); c.fill();
    for (const [x, y, rad] of crowns) { c.beginPath(); c.arc(x, y, rad, Math.PI, 0); c.fill(); }
    c.save(); poly(c, pts); c.clip();
    c.fillStyle = 'rgba(70,110,75,.55)';
    for (const [x, y, rad] of dots) { c.beginPath(); c.ellipse(x, y, rad, rad * 0.5, 0, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }, { t: 7.8, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // pines on the islets in the pond
  const isles = [[640, PONDY + 170, 0.95], [260, PONDY + 250, 0.8]];
  isles.forEach(([x, y, s], i) => {
    p.group('pines', { x: x - 120 * s, y: y - 170 * s, w: 240 * s, h: 200 * s }, (c) => {
      c.fillStyle = '#8f8a7c'; c.beginPath(); c.ellipse(x, y, 80 * s, 16 * s, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5f5a50'; c.beginPath(); c.ellipse(x + 20 * s, y - 6 * s, 26 * s, 12 * s, 0, 0, Math.PI * 2); c.fill();
      pineClump(c, rng(90 + i), x - 10 * s, y - 6 * s, s);
    }, { t: 8.4 + i * 0.2, d: 0.9, reveal: 'rise' });
  });
}

// ---------------------------------------------------------------- the Golden Pavilion
function pavilion(p, r) {
  const cx = 1060, base = PONDY + 4, K = 1.18;
  const draw = (c) => {
    c.save(); c.translate(cx, base); c.scale(K, K); c.translate(-cx, -base);
    // the stone footing at the water
    c.fillStyle = '#7d786c'; c.fillRect(cx - 170, base - 10, 340, 12);
    // first floor: plain wood and white shutters, open at the veranda
    const f1 = base - 10, h1 = 78, w1 = 150;
    c.fillStyle = '#8a6a48'; c.fillRect(cx - w1, f1 - h1, w1 * 2, h1);
    c.fillStyle = WALL;
    for (let k = 0; k < 6; k++) { const x = cx - w1 + 8 + k * 50; c.fillRect(x, f1 - h1 + 14, 38, h1 - 26); }
    c.strokeStyle = 'rgba(90,60,40,.7)'; c.lineWidth = 1;
    c.beginPath();
    for (let k = 0; k < 6; k++) { const x = cx - w1 + 8 + k * 50; for (let g = 1; g < 6; g++) { c.moveTo(x, f1 - h1 + 14 + g * (h1 - 26) / 6); c.lineTo(x + 38, f1 - h1 + 14 + g * (h1 - 26) / 6); } c.moveTo(x + 19, f1 - h1 + 14); c.lineTo(x + 19, f1 - 12); }
    c.stroke();
    c.fillStyle = WOOD; for (let k = 0; k <= 6; k++) c.fillRect(cx - w1 + k * 50 - 2, f1 - h1, 5, h1);
    c.fillRect(cx - w1 - 6, f1 - 8, w1 * 2 + 12, 8);
    // the little fishing pavilion at its side
    c.fillStyle = '#8a6a48'; c.fillRect(cx + w1, f1 - 44, 56, 44);
    c.fillStyle = WALL; c.fillRect(cx + w1 + 6, f1 - 36, 44, 26);
    eave(c, cx + w1 + 28, f1 - 44, 40, 8, BARK);
    // first roof
    eave(c, cx, f1 - h1, 196, 16, BARK);
    // second floor: gold, with a railed balcony
    const f2 = f1 - h1 - 18, h2 = 70, w2 = 128;
    c.fillStyle = PAV; c.fillRect(cx - w2, f2 - h2, w2 * 2, h2);
    c.fillStyle = PAV_D; for (let k = 0; k <= 5; k++) c.fillRect(cx - w2 + k * (w2 * 2 / 5) - 2, f2 - h2, 4, h2);
    c.fillStyle = 'rgba(120,80,20,.35)'; for (let k = 0; k < 5; k++) c.fillRect(cx - w2 + k * (w2 * 2 / 5) + 10, f2 - h2 + 14, w2 * 2 / 5 - 20, h2 - 30);
    c.fillStyle = PAV_L; c.fillRect(cx - w2 - 8, f2 - 14, w2 * 2 + 16, 4);
    c.strokeStyle = PAV_D; c.lineWidth = 1.5; c.beginPath(); for (let x = cx - w2 - 6; x < cx + w2 + 8; x += 8) { c.moveTo(x, f2 - 10); c.lineTo(x, f2); } c.stroke();
    c.fillStyle = PAV_D; c.fillRect(cx - w2 - 8, f2 - 2, w2 * 2 + 16, 4);
    // second roof
    eave(c, cx, f2 - h2, 168, 14, BARK);
    // third floor: gold, smaller, with bell-shaped windows
    const f3 = f2 - h2 - 16, h3 = 62, w3 = 78;
    c.fillStyle = PAV; c.fillRect(cx - w3, f3 - h3, w3 * 2, h3);
    c.fillStyle = PAV_D; c.fillRect(cx - w3, f3 - h3, 4, h3); c.fillRect(cx + w3 - 4, f3 - h3, 4, h3); c.fillRect(cx - 2, f3 - h3, 4, h3);
    c.fillStyle = '#3a2a14';
    for (const dx of [-40, 40]) {
      const x = cx + dx, y = f3 - 12;
      c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x - 14, y - 24); c.quadraticCurveTo(x - 14, y - 36, x - 6, y - 38); c.quadraticCurveTo(x, y - 46, x + 6, y - 38); c.quadraticCurveTo(x + 14, y - 36, x + 14, y - 24); c.lineTo(x + 14, y); c.fill();
    }
    c.fillStyle = PAV_L; c.fillRect(cx - w3 - 6, f3 - 6, w3 * 2 + 12, 4);
    // the top roof: a pyramid with curved sides
    const ry = f3 - h3;
    c.fillStyle = BARK;
    c.beginPath(); c.moveTo(cx - 132, ry + 4); c.quadraticCurveTo(cx - 70, ry - 2, cx - 10, ry - 66); c.lineTo(cx + 10, ry - 66); c.quadraticCurveTo(cx + 70, ry - 2, cx + 132, ry + 4); c.quadraticCurveTo(cx + 120, ry + 10, cx + 90, ry + 10); c.lineTo(cx - 90, ry + 10); c.quadraticCurveTo(cx - 120, ry + 10, cx - 132, ry + 4); c.fill();
    c.strokeStyle = 'rgba(240,210,150,.35)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx - 130, ry + 5); c.quadraticCurveTo(cx, ry + 12, cx + 130, ry + 5); c.stroke();
    // the phoenix on top
    c.fillStyle = PAV;
    c.beginPath(); c.moveTo(cx - 4, ry - 66); c.lineTo(cx - 6, ry - 84); c.quadraticCurveTo(cx - 2, ry - 98, cx + 6, ry - 102); c.lineTo(cx + 4, ry - 94);
    c.quadraticCurveTo(cx + 16, ry - 100, cx + 26, ry - 112); c.quadraticCurveTo(cx + 20, ry - 92, cx + 6, ry - 84); c.lineTo(cx + 4, ry - 66); c.fill();
    c.beginPath(); c.moveTo(cx - 6, ry - 82); c.quadraticCurveTo(cx - 22, ry - 86, cx - 28, ry - 76); c.quadraticCurveTo(cx - 16, ry - 80, cx - 4, ry - 76); c.fill();
    c.restore();
  };
  const top = base - (14 + 78 + 18 + 70 + 16 + 62 + 112) * K;
  const box = { x: cx - 250, y: top - 10, w: 520, h: base - top + 20 };
  p.group('pavilion', box, draw, { t: 8.6, d: 1.6, reveal: 'rise', ease: 'inOut' });
  // its reflection: the pavilion upside down in the water, broken by ripples
  const rbox = { x: cx - 250, y: base, w: 520, h: base - top + 20 };
  p.group('pavilion', rbox, (c) => {
    c.save();
    c.beginPath();
    for (let y = base + 2; y < base + (base - top); y += 7) c.rect(cx - 260 + Math.sin(y * 0.3) * 6, y, 530, 4.2);
    c.clip();
    c.globalAlpha = 0.42;
    c.translate(0, base * 2); c.scale(1, -1);
    draw(c);
    c.restore();
  }, { t: 9.8, d: 1.0, reveal: 'fall' });
}
// a shingled eave with turned-up corners, its foot at (cx, y)
function eave(c, cx, y, w, h, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(cx - w, y - h * 0.4);
  c.quadraticCurveTo(cx - w * 0.75, y + h * 0.2, cx - w * 0.6, y + h * 0.15);
  c.lineTo(cx + w * 0.6, y + h * 0.15);
  c.quadraticCurveTo(cx + w * 0.75, y + h * 0.2, cx + w, y - h * 0.4);
  c.lineTo(cx + w * 0.7, y - h * 1.3); c.lineTo(cx - w * 0.7, y - h * 1.3);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(240,210,150,.35)'; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(cx - w, y - h * 0.4); c.quadraticCurveTo(cx - w * 0.75, y + h * 0.2, cx - w * 0.6, y + h * 0.15); c.lineTo(cx + w * 0.6, y + h * 0.15); c.quadraticCurveTo(cx + w * 0.75, y + h * 0.2, cx + w, y - h * 0.4); c.stroke();
}

// ---------------------------------------------------------------- the bridge
// Togetsukyō: a long, low wooden bridge on many legs across the stream's mouth
function bridge(p, r) {
  const x0 = GX - 10, x1 = 640, y = 1420;
  p.group('bridge', { x: x0 - 20, y: y - 40, w: x1 - x0 + 40, h: 120 }, (c) => {
    const deckY = (x) => y - Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 14;
    // legs, in threes
    c.fillStyle = WOOD;
    for (let x = x0 + 30; x < x1 - 10; x += 40) for (const dx of [-7, 0, 7]) c.fillRect(x + dx, deckY(x), 4, 70 - (deckY(x) - y));
    c.fillStyle = 'rgba(30,20,12,.5)'; for (let x = x0 + 30; x < x1 - 10; x += 40) c.fillRect(x - 9, deckY(x) + 30, 22, 3);
    // the deck and its rail
    c.strokeStyle = '#3b2618'; c.lineWidth = 11; c.lineCap = 'butt';
    c.beginPath(); for (let x = x0; x <= x1; x += 8) c[x === x0 ? 'moveTo' : 'lineTo'](x, deckY(x)); c.stroke();
    c.strokeStyle = '#7a5434'; c.lineWidth = 3;
    c.beginPath(); for (let x = x0; x <= x1; x += 8) c[x === x0 ? 'moveTo' : 'lineTo'](x, deckY(x) - 16); c.stroke();
    c.lineWidth = 2; c.beginPath(); for (let x = x0 + 4; x <= x1; x += 18) { c.moveTo(x, deckY(x) - 4); c.lineTo(x, deckY(x) - 16); } c.stroke();
  }, { t: 8.1, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // people crossing: tiny figures under parasols
  const folk = [[220, 1, '#a6252a'], [270, -1, '#23304c'], [430, 1, '#e38b31'], [540, -1, '#3f6f5a']];
  p.group('bridge', { x: x0, y: y - 60, w: x1 - x0, h: 60 }, (c) => {
    for (const [x, dir, col] of folk) {
      const yy = y - Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * 14 - 4;
      c.fillStyle = col; c.beginPath(); c.moveTo(x - 6, yy); c.lineTo(x - 4, yy - 20); c.lineTo(x + 4, yy - 20); c.lineTo(x + 6, yy); c.fill();
      c.fillStyle = SUMI; c.beginPath(); c.arc(x, yy - 23, 3.5, 0, Math.PI * 2); c.fill();
      c.strokeStyle = SUMI; c.lineWidth = 1; c.beginPath(); c.moveTo(x + dir * 2, yy - 18); c.lineTo(x + dir * 4, yy - 34); c.stroke();
      c.fillStyle = '#efe6cf'; c.beginPath(); c.moveTo(x + dir * 4 - 14, yy - 32); c.quadraticCurveTo(x + dir * 4, yy - 44, x + dir * 4 + 14, yy - 32); c.fill();
    }
  }, { t: 9.4, d: 0.6, reveal: 'pop' });
}

// ---------------------------------------------------------------- maples
// branches of momiji reaching in from the left and from the lower right
function leafPts(x, y, s, a) {
  // seven pointed lobes, the middle ones longest, cut deep between them
  const pts = [];
  const lobes = 7;
  for (let i = 0; i <= lobes * 2; i++) {
    const f = i / (lobes * 2), ang = a - Math.PI * 0.85 + f * Math.PI * 1.7;
    const li = Math.abs(i / 2 - lobes / 2) / (lobes / 2);
    const len = (i % 2 === 0 ? lerp(1, 0.55, li ** 1.4) : 0.38) * s;
    pts.push([x + Math.cos(ang) * len, y + Math.sin(ang) * len]);
  }
  pts.push([x, y]);
  return pts;
}
function branchPath(r, x, y, a, len, bend) {
  const pts = [[x, y]];
  for (let i = 1; i <= 20; i++) {
    const t = i / 20;
    const aa = a + bend * t + Math.sin(t * 7 + x) * 0.08;
    x += Math.cos(aa) * len / 20; y += Math.sin(aa) * len / 20;
    pts.push([x, y]);
  }
  return pts;
}
function maples(p, r) {
  const branches = [];
  const grow = (x, y, a, len, bend, w, depth, out) => {
    const path = branchPath(r, x, y, a, len, bend);
    out.push({ path, w });
    if (depth > 0) {
      const n = depth > 1 ? 3 : 2;
      for (let k = 0; k < n; k++) {
        const j = Math.floor(lerp(6, 18, (k + r()) / n)), [bx, by] = path[j];
        grow(bx, by, a + bend * (j / 20) + r.range(-0.9, 0.9), len * r.range(0.4, 0.62), r.range(-0.6, 0.6), w * 0.55, depth - 1, out);
      }
    }
  };
  const sets = [
    { x: GX - 10, y: 1720, a: -0.42, len: 500, bend: 0.3, w: 17, t: 9.6 },
    { x: GX + GW + 10, y: 1900, a: -Math.PI / 2 - 0.5, len: 430, bend: -0.35, w: 18, t: 10.0 },
  ];
  sets.forEach((st, si) => {
    const out = [];
    grow(st.x, st.y, st.a, st.len, st.bend, st.w, 2, out);
    // leaves gather at the twig ends and along the outer branches
    const leaves = [];
    for (const b of out) {
      if (b.w > st.w * 0.9) continue;
      const n = b.w < st.w * 0.4 ? 14 : 6;
      for (let k = 0; k < n; k++) {
        const j = Math.floor(lerp(8, 20, r())), [lx, ly] = b.path[j];
        leaves.push({ x: lx + r.range(-28, 28), y: ly + r.range(-22, 26), s: r.range(16, 27), a: r.range(-Math.PI, Math.PI), col: r.pick(LEAF), vein: r() < 0.7 });
      }
    }
    const box = { x: Math.min(...out.flatMap((b) => b.path.map((q) => q[0]))) - 40, y: Math.min(...out.flatMap((b) => b.path.map((q) => q[1]))) - 40, w: 0, h: 0 };
    box.w = Math.max(...out.flatMap((b) => b.path.map((q) => q[0]))) - box.x + 40;
    box.h = Math.max(...out.flatMap((b) => b.path.map((q) => q[1]))) - box.y + 40;
    p.group('maples', box, (c) => {
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const b of out) {
        c.strokeStyle = SUMI; c.lineWidth = b.w;
        c.beginPath(); b.path.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
        // the bark's lighter streak
        c.strokeStyle = 'rgba(120,90,60,.5)'; c.lineWidth = b.w * 0.25;
        c.beginPath(); b.path.forEach(([x, y], i) => (i ? c.lineTo(x, y - b.w * 0.2) : c.moveTo(x, y - b.w * 0.2))); c.stroke();
      }
    }, { t: st.t, d: 1.2, reveal: si ? 'wipeL' : 'wipe', ease: 'inOut' });
    // leaves in clusters, so not too many arrive at once
    const chunk = Math.ceil(leaves.length / 6);
    for (let i = 0; i < leaves.length; i += chunk) {
      const set = leaves.slice(i, i + chunk);
      const lb = { x: Math.min(...set.map((l) => l.x)) - 32, y: Math.min(...set.map((l) => l.y)) - 32, w: 0, h: 0 };
      lb.w = Math.max(...set.map((l) => l.x)) - lb.x + 32; lb.h = Math.max(...set.map((l) => l.y)) - lb.y + 32;
      p.group('maples', lb, (c) => { for (const l of set) leaf(c, l); }, { t: st.t + 0.6 + (i / chunk) * 0.16, d: 0.7, reveal: 'pop' });
    }
  });
}
function leaf(c, l) {
  const pts = leafPts(l.x, l.y, l.s, l.a);
  c.fillStyle = l.col; poly(c, pts); c.fill();
  if (l.vein) {
    c.strokeStyle = 'rgba(90,20,15,.45)'; c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i < 7; i++) { const ang = l.a - Math.PI * 0.85 + (i / 6) * Math.PI * 1.7; c.moveTo(l.x, l.y); c.lineTo(l.x + Math.cos(ang) * l.s * 0.7, l.y + Math.sin(ang) * l.s * 0.7); }
    c.stroke();
  }
}

// ---------------------------------------------------------------- the live things
function falling(p, r) {
  // leaves drifting down across the screen, turning
  const L = [];
  for (let i = 0; i < 6; i++) L.push({ x0: r.range(300, 1400), ph: r() * 1000, sp: r.range(28, 46), sw: r.range(20, 50), s: r.range(13, 19), col: r.pick(LEAF), turn: r.range(0.6, 1.6) });
  p.live('leaves', {
    t: 10.6, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const l of L) {
        const span = GH + 100, y = GY - 40 + ((time * l.sp + l.ph) % span);
        const x = l.x0 + Math.sin(time * 0.7 + l.ph) * l.sw;
        leaf(c, { x, y, s: l.s, a: time * l.turn + l.ph, col: l.col, vein: false });
      }
    },
  });
  // a skein of wild geese crossing the gold, high up
  const geese = [[0, 0], [-34, 16], [-68, 30], [-30, -14], [-60, -26]];
  p.live('clouds', {
    t: 10.8, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      const x0 = 1500 - ((time * 22) % 1700), y0 = 330 + Math.sin(time * 0.3) * 10;
      c.strokeStyle = SUMI; c.lineWidth = 2.6; c.lineCap = 'round'; c.lineJoin = 'round';
      geese.forEach(([dx, dy], i) => {
        const x = x0 - dx, y = y0 + dy, f = Math.sin(time * 4 + i * 1.3) * 5;
        c.beginPath(); c.moveTo(x + 13, y - 3 - f); c.quadraticCurveTo(x + 6, y - 4 - f * 0.6, x, y); c.quadraticCurveTo(x + 6, y + 2 + f * 0.4, x + 13, y + 5 + f * 0.3); c.stroke();
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y + 1); c.stroke();
      });
    },
  });
  // a light that slides across the gold of the pavilion now and then
  p.live('pavilion', {
    t: 11, d: 1, reveal: 'fade',
    draw: (c, time) => {
      const k = (time * 0.12) % 1;
      if (k > 0.35) return;
      const x = lerp(880, 1260, k / 0.35);
      c.save();
      c.beginPath(); c.rect(1060 - 152, PONDY - 352, 304, 228); c.clip();
      c.fillStyle = 'rgba(255,248,215,.35)';
      c.beginPath(); c.moveTo(x, PONDY - 352); c.lineTo(x + 30, PONDY - 352); c.lineTo(x - 36, PONDY - 124); c.lineTo(x - 66, PONDY - 124); c.fill();
      c.restore();
    },
  });
  // the curls in the pond turning slowly: a few bright strokes travel along them
  const paths = [];
  for (let i = 0; i < 4; i++) {
    const y = r.range(PONDY + 80, GY + GH - 40), x = r.range(GX + 100, GX + GW - 300);
    paths.push({ x, y, len: r.range(160, 280), ph: r() });
  }
  p.live('swirls', {
    t: 11.2, d: 1, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = 'rgba(250,232,170,.8)'; c.lineWidth = 2; c.lineCap = 'round';
      for (const q of paths) {
        const k = (time * 0.15 + q.ph) % 1;
        const x = q.x + k * q.len;
        c.beginPath(); c.moveTo(x, q.y + Math.sin(x * 0.012 + q.y * 0.03) * 6);
        for (let s = 1; s <= 6; s++) { const xx = x + s * 6; c.lineTo(xx, q.y + Math.sin(xx * 0.012 + q.y * 0.03) * 6); }
        c.stroke();
      }
    },
  });
}

// ---------------------------------------------------------------- the title
// 京都 brushed large in black down the gold at the upper left, KYOTO under it
function title(p) {
  const x = 330, size = 300;
  p.type('title', '京', x, 520, { family: FONT, size, color: SUMI, align: 'center', t: 11.0, d: 1.0, reveal: 'fall', ease: 'inOut' });
  p.type('title', '都', x, 830, { family: FONT, size, color: SUMI, align: 'center', t: 11.7, d: 1.0, reveal: 'fall', ease: 'inOut' });
  p.type('title', 'KYOTO', x, 960, { family: FONT, size: 64, color: SUMI, track: 0.42, align: 'center', t: 12.6, gap: 0.12, d: 0.6 });
  p.type('title', 'HEIAN-KYŌ', x, 1012, { family: FONT, size: 30, color: 'rgba(27,23,20,.75)', track: 0.4, align: 'center', t: 13.2, gap: 0.05, d: 0.5, reveal: 'fade' });
}

// ---------------------------------------------------------------- the panel seams
// the screen folds in four: a fine shadowed seam between each panel
function seams(p) {
  p.group('seams', { x: GX, y: GY, w: GW, h: GH }, (c) => {
    for (let k = 1; k < PANELS; k++) {
      const x = GX + (GW / PANELS) * k;
      const g = c.createLinearGradient(x - 18, 0, x + 18, 0);
      g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.45, 'rgba(255,240,200,.10)'); g.addColorStop(0.5, 'rgba(90,60,20,.22)'); g.addColorStop(0.56, 'rgba(60,40,10,.12)'); g.addColorStop(1, 'rgba(60,40,10,0)');
      c.fillStyle = g; c.fillRect(x - 18, GY, 36, GH);
    }
  }, { t: 13.8, d: 1.0, reveal: 'fade' });
}
