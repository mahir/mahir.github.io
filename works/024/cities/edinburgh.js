// Edinburgh: a 1930s railway poster, lithographed in flat airbrushed color.
// Looking west down Princes Street Gardens at dusk: the Castle stands dark on its
// rock against an apricot sky, mist lying in the valley round its foot. On the
// left the Old Town's tenements, chimney stacks and crow-stepped gables run up
// to it, with the crown spire of St Giles', the twin towers of the Assembly Hall
// and the tall spire of the Tolbooth Kirk; below, the two classical galleries on
// the Mound. On the right, Princes Street and, close and huge, the Scott
// Monument's Gothic spire. A train steams through the gardens. Values recede in
// layers of heather, slate and moss; the name is set low, in the dark of the trees.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, shade, mix, rng } from '../kit.js';

const PAPER = '#efe6d3', CREAM = '#f3e6cc';
const SKY = ['#4c5478', '#8a7f9e', '#d6a69a', '#f0c590', '#f6dcae'];
const HAZE = '#b6a3b6', FAR = '#8d7f9f', MID = '#5f5878', CASTLE = '#3f3d5c', OLD = '#4a4766', NEAR = '#2c2f47';
const MOSS = '#263a35', DEEP = '#16211f', RIM = '#f2c48d', LAMP = '#f7cf7a', STONE = '#c9b9a4';
const FACE = 'Cabin, sans-serif';

export const city = {
  id: 'edinburgh', name: 'Edinburgh', wall: '#22243a',
  alt: 'A 1930s railway-poster view west along Princes Street Gardens at dusk: the Castle dark on its rock against an apricot sky with mist in the valley at its foot, the Old Town\'s tenements and chimney stacks climbing to it with the crown spire of St Giles\', the twin towers of the Assembly Hall and the Tolbooth Kirk\'s spire, the two classical galleries on the Mound, the buildings of Princes Street, the Scott Monument\'s Gothic spire close on the right, a steam train in the gardens, lamps and rooks, the name low in the dark of the trees',
  google: 'family=Cabin:wght@500;700',
  fonts: [['700 100px Cabin', 'EDINBURGH'], ['500 100px Cabin', 'THE CASTLE FROM PRINCES STREET GARDENS']],
  build,
};

const X0 = 64, Y0 = 64, X1 = W - 64, Y1 = H - 64;
const HZ = 1060;   // the haze line in the valley
const SM = 1312;   // the Scott Monument's axis

function build() {
  const p = new Plate({ paper: PAPER, seed: 1846 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'far', 'rock', 'castle', 'mist', 'old', 'mound', 'street', 'trees', 'rail', 'monument', 'lights', 'live', 'title');

  sky(p, r);
  far(p, r);
  rock(p, r);
  castle(p, r);
  oldTown(p, r);
  mound(p, r);
  street(p, r);
  gardens(p, r);
  monument(p, r);
  life(p, r);
  title(p, r);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
function fillPts(c, pts, col) { c.fillStyle = col; poly(c, pts); c.fill(); }
// an airbrushed fill: a vertical gradient through a shape
function airbrush(c, pts, y0, y1, c0, c1) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, c0); g.addColorStop(1, c1);
  c.fillStyle = g; poly(c, pts); c.fill();
}

// ================================================================ the sky
function sky(p, r) {
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: HZ - Y0 + 300 }, (c) => {
    const g = c.createLinearGradient(0, Y0, 0, HZ);
    SKY.forEach((col, i) => g.addColorStop([0, 0.3, 0.62, 0.86, 1][i], col));
    c.fillStyle = g; c.fillRect(X0, Y0, X1 - X0, HZ - Y0 + 300);
    // the glow where the sun has gone, behind the castle
    const s = c.createRadialGradient(980, 880, 20, 980, 880, 520);
    s.addColorStop(0, 'rgba(255,236,190,.75)'); s.addColorStop(1, 'rgba(255,236,190,0)');
    c.fillStyle = s; c.fillRect(X0, Y0, X1 - X0, HZ - Y0 + 120);
  }, { t: 0.1, d: 1.5, reveal: 'fall', ease: 'inOut' });
  // long thin clouds, lit underneath, in streaks
  const streaks = [[140, 300, 520, 14], [520, 380, 640, 10], [900, 240, 420, 12], [220, 520, 380, 9], [1040, 470, 360, 11], [640, 610, 300, 8], [160, 680, 260, 7]];
  streaks.forEach(([x, y, w, h], i) => {
    p.group('sky', { x: x - 10, y: y - h - 6, w: w + 20, h: h * 2 + 12 }, (c) => {
      c.fillStyle = mix(SKY[1], SKY[3], 0.25 + i * 0.08);
      c.beginPath(); c.ellipse(x + w / 2, y, w / 2, h, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(246,206,150,.7)';
      c.beginPath(); c.ellipse(x + w / 2 + w * 0.06, y + h * 0.45, w * 0.4, h * 0.45, 0, 0, Math.PI * 2); c.fill();
    }, { t: 1.0 + i * 0.16, d: 1.3, reveal: 'slide', dx: 80, ease: 'out' });
  });
}

// ================================================================ the far land
function far(p, r) {
  // Corstorphine and the low hills to the west, in haze
  const pts = [[X0, HZ]];
  for (let x = X0; x <= X1; x += 30) pts.push([x, HZ - 70 - 40 * Math.sin((x - 200) * 0.004) - r.range(0, 6)]);
  pts.push([X1, HZ + 20], [X0, HZ + 20]);
  p.group('far', boxOf(pts, 4), (c) => airbrush(c, pts, HZ - 120, HZ, HAZE, mix(HAZE, SKY[4], 0.4)), { t: 1.4, d: 1.0, reveal: 'rise' });
  // the west end's roofs and spires, flat and pale
  const roofs = [[X0, HZ - 40]];
  for (let x = X0; x < X1; x += r.range(20, 50)) { const h = r.range(30, 70); roofs.push([x, HZ - h], [x + r.range(16, 40), HZ - h]); if (r.chance(0.12)) roofs.push([x + 6, HZ - h - 50], [x + 10, HZ - h]); }
  roofs.push([X1, HZ + 20], [X0, HZ + 20]);
  p.fill('far', roofs, mix(FAR, HAZE, 0.3), { t: 1.8, d: 1.0, reveal: 'rise' });
}

// ================================================================ the rock
const ROCK = [[520, 1160], [560, 1060], [600, 1000], [640, 930], [676, 890], [700, 840], [740, 812], [800, 800], [1000, 792], [1120, 798], [1170, 810], [1200, 860], [1222, 940], [1250, 1020], [1290, 1100], [1320, 1170]];
function rock(p, r) {
  const pts = [...ROCK, [1320, 1200], [520, 1200]];
  p.group('rock', boxOf(pts, 6), (c) => {
    airbrush(c, pts, 790, 1150, MID, mix(MID, HAZE, 0.5));
    // the crag's facets: dark planes in shadow, a few lit toward the glow
    c.save(); poly(c, pts); c.clip();
    c.fillStyle = 'rgba(34,30,56,.2)';
    for (const f of FACETS) if (!f.lit) { poly(c, f.pts); c.fill(); }
    c.fillStyle = 'rgba(242,196,141,.13)';
    for (const f of FACETS) if (f.lit) { poly(c, f.pts); c.fill(); }
    c.restore();
  }, { t: 2.0, d: 1.4, reveal: 'rise', ease: 'inOut' });
}
const FACETS = (() => {
  const r = rng(5), out = [];
  for (let i = 0; i < 70; i++) {
    const x = r.range(540, 1310), y = r.range(800, 1100), w = r.range(8, 22), h = r.range(60, 170), k = r.range(-6, 6);
    out.push({ pts: [[x, y], [x + w, y + r.range(-8, 8)], [x + w * 0.7 + k, y + h], [x + k * 0.5, y + h * 0.8]], lit: x < 760 ? r.chance(0.5) : r.chance(0.18) });
  }
  return out;
})();

// ================================================================ the castle
function castle(p, r) {
  const top = 800;
  // the curtain walls along the rock's top
  const wall = [[690, 846], [720, 780], [1180, 770], [1206, 840], [1170, 812], [740, 820]];
  p.fill('castle', wall, CASTLE, { t: 3.0, d: 0.8, reveal: 'rise' });
  // the Half Moon Battery: a great curved drum facing us, the Palace behind it
  p.group('castle', { x: 650, y: 560, w: 260, h: 300 }, (c) => {
    // the Palace: a tall block with a square tower and a corner turret
    fillPts(c, rect(800, 640, 120, 150), OLD);
    fillPts(c, [[796, 640], [860, 600], [924, 640]], CASTLE);
    fillPts(c, rect(868, 576, 46, 70), CASTLE);
    c.fillStyle = CASTLE; c.fillRect(864, 568, 54, 10);
    for (let x = 864; x < 918; x += 9) c.fillRect(x, 560, 5, 9);
    fillPts(c, rect(906, 548, 14, 34), CASTLE);
    fillPts(c, [[904, 548], [913, 528], [922, 548]], CASTLE);
    // the battery
    c.fillStyle = CASTLE; c.beginPath();
    c.moveTo(680, 850); c.lineTo(690, 720); c.quadraticCurveTo(760, 690, 840, 712); c.lineTo(846, 830); c.closePath(); c.fill();
    // its lit rim and its row of gun ports
    c.strokeStyle = RIM; c.lineWidth = 3; c.beginPath(); c.moveTo(690, 720); c.quadraticCurveTo(760, 690, 840, 712); c.stroke();
    c.fillStyle = '#26243a';
    for (let x = 704; x < 836; x += 18) c.fillRect(x, 736, 7, 6);
    // the lit windows of the Palace
    c.fillStyle = LAMP;
    for (const [x, y] of [[812, 660], [836, 660], [812, 700], [860, 700], [884, 660], [884, 700], [882, 594]]) c.fillRect(x, y, 6, 12);
  }, { t: 3.3, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the Great Hall with its steep roof, the chapel, the long barracks
  p.group('castle', { x: 900, y: 580, w: 300, h: 240 }, (c) => {
    fillPts(c, rect(920, 680, 120, 110), OLD);
    fillPts(c, [[914, 682], [980, 628], [1046, 682]], CASTLE);
    c.fillStyle = LAMP; for (let x = 934; x < 1030; x += 22) c.fillRect(x, 700, 7, 18);
    // the long barrack block, many windows, at the rock's west edge
    fillPts(c, rect(1040, 650, 140, 140), mix(OLD, CASTLE, 0.5));
    fillPts(c, [[1036, 652], [1050, 630], [1170, 630], [1184, 652]], CASTLE);
    c.fillStyle = '#2b2942';
    for (let y = 664; y < 780; y += 22) for (let x = 1050; x < 1172; x += 15) c.fillRect(x, y, 6, 11);
    c.fillStyle = LAMP;
    for (const [x, y] of [[1065, 686], [1095, 708], [1140, 664], [1155, 730], [1080, 752], [1125, 774]]) c.fillRect(x, y, 6, 11);
    // the War Memorial's roof and lantern behind
    fillPts(c, [[990, 640], [1010, 600], [1040, 600], [1060, 640]], CASTLE);
    c.fillStyle = CASTLE; c.fillRect(1018, 586, 14, 16);
    // chimneys and a few battlements
    for (const x of [930, 1020, 1060, 1110, 1160]) c.fillRect(x, 616 + (x % 3) * 6, 8, 18);
  }, { t: 3.7, d: 1.3, reveal: 'rise', ease: 'inOut' });
  // the gatehouse and the esplanade wall on the near side, facing us
  p.group('castle', { x: 640, y: 760, w: 120, h: 120 }, (c) => {
    fillPts(c, rect(660, 780, 70, 70), CASTLE);
    for (let x = 660; x < 730; x += 12) c.fillRect(x, 770, 7, 12);
    fillPts(c, rect(650, 770, 14, 50), CASTLE); fillPts(c, rect(724, 770, 14, 50), CASTLE);
    c.fillStyle = '#26243a'; c.beginPath(); c.roundRect(684, 810, 22, 40, [11, 11, 0, 0]); c.fill();
  }, { t: 4.2, d: 0.9, reveal: 'rise' });
}

// ================================================================ the Old Town
function oldTown(p, r) {
  // tenements from the castle's foot toward us on the left: taller and darker
  // as they come near, each with stacks, pots, crow-steps and lit windows
  const ts = [];
  let x = 630;
  while (x > X0 - 80) {
    const k = clamp((630 - x) / 560);
    const w = lerp(46, 92, k) * r.range(0.8, 1.2);
    const top = lerp(860, 770, k) + r.range(-24, 24);
    ts.push({ x: x - w, w, top, k, col: mix(mix(OLD, NEAR, k * 0.7), HAZE, 0.15 * (1 - k)), crow: r.chance(0.35), stacks: r.int(1, 3), lit: [] });
    x -= w * r.range(0.86, 1.0);
  }
  for (const t of ts) {
    const rows = Math.floor((1180 - t.top - 30) / lerp(22, 32, t.k)), cols = Math.max(2, Math.round(t.w / lerp(14, 20, t.k)));
    t.rows = rows; t.cols = cols;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if (r.chance(0.22)) t.lit.push([i, j]);
    t.pots = [];
    for (let s = 0; s < t.stacks; s++) t.pots.push(r.range(0.1, 0.8));
  }
  // the far ones first
  ts.forEach((t, i) => {
    const sw = lerp(10, 18, t.k);
    p.group('old', { x: t.x - 6, y: t.top - 70, w: t.w + 12, h: 1200 - t.top + 70 }, (c) => {
      fillPts(c, rect(t.x, t.top, t.w, 1200 - t.top), t.col);
      // the gable: crow-stepped or a plain pitch
      if (t.crow) {
        c.fillStyle = t.col; const n = 4, sw2 = t.w / (2 * n);
        for (let s = 0; s < n; s++) c.fillRect(t.x + s * sw2, t.top - (s + 1) * 9, t.w - 2 * s * sw2, 9);
      } else fillPts(c, [[t.x, t.top], [t.x + t.w / 2, t.top - t.w * 0.38], [t.x + t.w, t.top]], shade(t.col, 0.85));
      // chimney stacks with their pots
      for (const s of t.pots) {
        const cx = t.x + t.w * s;
        c.fillStyle = shade(t.col, 0.9); c.fillRect(cx, t.top - 42, sw, 42);
        c.fillStyle = shade(t.col, 0.75);
        for (let k = 0; k < 3; k++) c.fillRect(cx + 1 + k * sw / 3, t.top - 50, sw / 3 - 2, 9);
      }
      // the lit left edge, toward the glow
      c.fillStyle = 'rgba(242,196,141,.22)'; c.fillRect(t.x + t.w - 4, t.top, 4, 1200 - t.top);
      // dark windows, then the lit ones
      const dx = t.w / t.cols, dy = lerp(22, 32, t.k);
      c.fillStyle = 'rgba(20,20,36,.45)'; c.beginPath();
      for (let a = 0; a < t.cols; a++) for (let b = 0; b < t.rows; b++) c.rect(t.x + a * dx + dx * 0.3, t.top + 18 + b * dy, dx * 0.4, dy * 0.5);
      c.fill();
    }, { t: 3.6 + (ts.length - i) * 0.09, d: 0.9, reveal: 'rise' });
  });
  // the lit windows, all at once as the evening comes on
  p.group('lights', { x: X0 - 80, y: 740, w: 720, h: 460 }, (c) => {
    c.fillStyle = LAMP; c.beginPath();
    for (const t of ts) {
      const dx = t.w / t.cols, dy = lerp(22, 32, t.k);
      for (const [a, b] of t.lit) c.rect(t.x + a * dx + dx * 0.3, t.top + 18 + b * dy, dx * 0.4, dy * 0.5);
    }
    c.fill();
  }, { t: 9.0, d: 1.0, reveal: 'fade' });

  // the Tolbooth Kirk's tall spire at the head of the Royal Mile
  p.group('old', { x: 560, y: 480, w: 90, h: 420 }, (c) => {
    const cx = 604;
    fillPts(c, rect(cx - 26, 720, 52, 180), mix(OLD, HAZE, 0.2));
    fillPts(c, [[cx - 22, 724], [cx, 500], [cx + 22, 724]], mix(OLD, HAZE, 0.2));
    for (const dx of [-30, 26]) fillPts(c, [[cx + dx, 724], [cx + dx + 2, 680], [cx + dx + 4, 724]], mix(OLD, HAZE, 0.2));
    c.strokeStyle = 'rgba(242,196,141,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + 2, 506); c.lineTo(cx + 21, 722); c.stroke();
    c.fillStyle = '#2b2942'; c.beginPath(); c.roundRect(cx - 7, 750, 14, 44, [7, 7, 0, 0]); c.fill();
  }, { t: 4.6, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the Assembly Hall's two towers, square with spired pinnacles
  p.group('old', { x: 380, y: 590, w: 140, h: 320 }, (c) => {
    for (const cx of [410, 482]) {
      const col = mix(OLD, NEAR, 0.3);
      fillPts(c, rect(cx - 18, 680, 36, 230), col);
      for (const dx of [-18, 12]) fillPts(c, [[cx + dx, 682], [cx + dx + 3, 640], [cx + dx + 6, 682]], col);
      fillPts(c, [[cx - 8, 682], [cx, 610], [cx + 8, 682]], col);
      c.fillStyle = '#25233a'; c.fillRect(cx - 5, 700, 10, 34);
      c.fillStyle = 'rgba(242,196,141,.35)'; c.fillRect(cx + 15, 680, 3, 230);
    }
    fillPts(c, rect(410, 760, 72, 150), mix(OLD, NEAR, 0.3));
    c.fillStyle = LAMP; c.beginPath(); c.roundRect(436, 790, 20, 46, [10, 10, 0, 0]); c.fill();
  }, { t: 5.0, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // St Giles': a square tower with the open crown of flying ribs
  p.group('old', { x: 130, y: 560, w: 140, h: 360 }, (c) => {
    const cx = 200, col = NEAR;
    fillPts(c, rect(cx - 30, 700, 60, 220), col);
    for (let x = cx - 30; x < cx + 30; x += 10) c.fillRect(x, 692, 6, 10);
    c.strokeStyle = col; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath();
    for (const dx of [-28, -14, 14, 28]) { c.moveTo(cx + dx, 700); c.quadraticCurveTo(cx + dx * 0.4, 640, cx, 628); }
    c.stroke();
    fillPts(c, rect(cx - 7, 600, 14, 32), col);
    fillPts(c, [[cx - 7, 602], [cx, 568], [cx + 7, 602]], col);
    for (const dx of [-30, -14, 14, 30]) fillPts(c, [[cx + dx - 3, 702], [cx + dx, 676], [cx + dx + 3, 702]], col);
    c.fillStyle = LAMP; c.beginPath(); c.arc(cx, 740, 9, 0, Math.PI * 2); c.fill();
  }, { t: 5.3, d: 1.2, reveal: 'rise', ease: 'inOut' });
}

// ================================================================ the Mound
function mound(p, r) {
  // the Mound's slope, then the two galleries: temples of pale stone
  const slope = [[X0, 1240], [380, 1180], [780, 1150], [880, 1180], [880, 1300], [X0, 1300]];
  p.group('mound', boxOf(slope, 4), (c) => airbrush(c, slope, 1140, 1300, mix(NEAR, HAZE, 0.25), NEAR), { t: 5.6, d: 1.0, reveal: 'rise' });
  const temple = (c, x, y, w, h, cols) => {
    fillPts(c, rect(x, y - 30, w, 30), mix(STONE, HAZE, 0.25));
    fillPts(c, [[x - 6, y - 30], [x + w / 2, y - 30 - w * 0.12], [x + w + 6, y - 30]], mix(STONE, HAZE, 0.1));
    fillPts(c, rect(x, y, w, h), mix(STONE, OLD, 0.45));
    c.fillStyle = mix(STONE, RIM, 0.3);
    for (let i = 0; i < cols; i++) c.fillRect(x + 6 + i * (w - 12) / (cols - 1) - 4, y, 8, h - 8);
    c.fillStyle = mix(STONE, HAZE, 0.2); c.fillRect(x - 4, y + h - 8, w + 8, 8);
  };
  p.group('mound', { x: 280, y: 1060, w: 260, h: 150 }, (c) => temple(c, 300, 1110, 200, 70, 8), { t: 6.0, d: 1.0, reveal: 'rise' });
  p.group('mound', { x: 560, y: 1040, w: 300, h: 150 }, (c) => {
    temple(c, 580, 1096, 250, 64, 10);
    // two small plinths at the corners of the roof
    c.fillStyle = mix(STONE, HAZE, 0.1); c.fillRect(576, 1038, 8, 18); c.fillRect(826, 1038, 8, 18);
  }, { t: 6.3, d: 1.0, reveal: 'rise' });
}

// ================================================================ Princes Street
function street(p, r) {
  const bs = [];
  for (let x = 1120; x < X1 + 40;) { const w = r.range(60, 110); bs.push({ x, w, top: r.range(840, 960), col: mix(NEAR, OLD, r.range(0, 0.5)), cols: Math.round(w / 18), lit: r() }); x += w; }
  bs.forEach((b, i) => {
    p.group('street', { x: b.x - 4, y: b.top - 50, w: b.w + 8, h: 1320 - b.top + 50 }, (c) => {
      fillPts(c, rect(b.x, b.top, b.w, 1320 - b.top), b.col);
      fillPts(c, [[b.x, b.top], [b.x + 10, b.top - 26], [b.x + b.w - 10, b.top - 26], [b.x + b.w, b.top]], shade(b.col, 0.85));
      c.fillStyle = shade(b.col, 0.8); c.fillRect(b.x + b.w * 0.3, b.top - 44, 12, 20); c.fillRect(b.x + b.w * 0.7, b.top - 40, 12, 16);
      c.fillStyle = 'rgba(242,196,141,.2)'; c.fillRect(b.x, b.top, 3, 1320 - b.top);
      const dx = b.w / b.cols;
      for (let a = 0; a < b.cols; a++) for (let y = b.top + 20, j = 0; y < 1240; y += 34, j++) {
        c.fillStyle = (a * 7 + j * 3 + Math.floor(b.lit * 10)) % 5 === 0 ? LAMP : 'rgba(18,18,32,.5)';
        c.fillRect(b.x + a * dx + dx * 0.3, y, dx * 0.4, 18);
      }
    }, { t: 5.8 + i * 0.12, d: 0.9, reveal: 'rise' });
  });
}

// ================================================================ the gardens
function gardens(p, r) {
  // the valley floor, the railway cutting and the trees, darkening toward us
  const floor = [[X0, 1200], [X1, 1200], [X1, Y1], [X0, Y1]];
  p.group('trees', boxOf(floor, 4), (c) => airbrush(c, floor, 1200, 1700, mix(MOSS, HAZE, 0.25), DEEP), { t: 6.6, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // the line, its two rails catching the glow
  p.strokes('trees', [[[X0, 1352], [X1, 1336]], [[X0, 1362], [X1, 1346]]], 'rgba(242,196,141,.6)', 2.5, { t: 7.2, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // rows of round trees: crowns with a lit cap on the side toward the glow
  const rows = [[1310, 22, 34, 0.15], [1420, 32, 46, 0.4], [1540, 44, 64, 0.65], [1680, 60, 86, 0.9]];
  rows.forEach(([y, r0, r1, k], ri) => {
    const crowns = [];
    for (let x = X0 - 30; x < X1 + 30; x += r.range(r0 * 0.9, r1 * 1.15)) {
      if (ri === 0 && x > 1160 && x < 1460) continue;
      crowns.push([x, y + r.range(-14, 14), r.range(r0, r1)]);
    }
    const col = mix(MOSS, DEEP, k), lit = mix(mix(MOSS, RIM, 0.3 - k * 0.15), HAZE, 0.2 * (1 - k));
    p.group('trees', { x: X0 - 100, y: y - r1 * 2.4, w: X1 - X0 + 200, h: r1 * 2.4 + 400 }, (c) => {
      // the lit side first, then the dark crown a little down and to the right
      c.fillStyle = lit; c.beginPath();
      for (const [x, yy, rr] of crowns) { c.moveTo(x + rr, yy - rr); c.arc(x, yy - rr, rr, 0, Math.PI * 2); }
      c.fill();
      c.fillStyle = col; c.beginPath();
      for (const [x, yy, rr] of crowns) { const o = rr * 0.14; c.moveTo(x + o + rr, yy - rr + o); c.arc(x + o, yy - rr + o, rr, 0, Math.PI * 2); c.rect(x - rr, yy - rr, rr * 2 + o, 400); }
      c.fill();
    }, { t: 7.0 + ri * 0.4, d: 1.0, reveal: 'rise' });
  });
  // mist lying low in the gardens, paler round the monument's foot
  const veils = [[1300, 1520, 360, 70], [1000, 1470, 300, 44], [520, 1500, 420, 50], [160, 1450, 260, 36], [1400, 1620, 260, 60]];
  p.group('trees', { x: X0, y: 1380, w: X1 - X0, h: 320 }, (c) => {
    for (const [x, y, w, h] of veils) {
      c.fillStyle = 'rgba(200,180,196,.10)'; c.beginPath(); c.ellipse(x, y, w, h, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(214,196,206,.10)'; c.beginPath(); c.ellipse(x, y + h * 0.2, w * 0.7, h * 0.55, 0, 0, Math.PI * 2); c.fill();
    }
  }, { t: 8.2, d: 1.2, reveal: 'fade' });
  // lamps along the walk, lit, and a few walkers
  const lamps = [];
  for (let x = 120; x < 1140; x += 150) lamps.push(x);
  p.group('lights', { x: X0, y: 1530, w: 1120, h: 120 }, (c) => {
    for (const x of lamps) {
      c.fillStyle = '#12191a'; c.fillRect(x - 2, 1560, 4, 80);
      c.fillStyle = 'rgba(247,207,122,.25)'; c.beginPath(); c.arc(x, 1556, 18, 0, Math.PI * 2); c.fill();
      c.fillStyle = LAMP; c.beginPath(); c.arc(x, 1556, 7, 0, Math.PI * 2); c.fill();
    }
  }, { t: 9.4, d: 0.8, reveal: 'fade' });
}

// ================================================================ the Scott Monument
function monument(p, r) {
  // a sooty Gothic spire in tiers, each with corner pinnacles, open pointed
  // arches and crockets, its left edges lit by the last of the sky
  const ink = '#332d40', lit = 'rgba(242,196,141,.8)';
  const tiers = [
    { y0: 1700, y1: 1400, hw: 146, hb: 154 }, { y0: 1400, y1: 1170, hw: 100, hb: 106 }, { y0: 1170, y1: 990, hw: 76, hb: 80 },
    { y0: 990, y1: 820, hw: 55, hb: 58 }, { y0: 820, y1: 672, hw: 40, hb: 42 },
  ];
  tiers.forEach((tr, i) => {
    const { y0, y1, hw, hb } = tr;
    const pin = hw * (i === 0 ? 0.3 : 0.36); // the corner piers' width
    const spring = y0 - (y0 - y1) * (i === 0 ? 0.5 : 0.5), apex = y1 + (y0 - y1) * (i === 0 ? 0.2 : 0.26);
    const fly = i < 1;                     // outer buttresses on the two lower stages
    const ox = hb + hw * 0.3, oh = (y0 - y1) * 0.55;
    p.group('monument', { x: SM - (fly ? ox : hb) - 30, y: y1 - hw - 20, w: (fly ? ox : hb) * 2 + 60, h: y0 - y1 + hw + 30 }, (c) => {
      c.fillStyle = ink;
      // the piers, leaning in as they rise
      for (const sx of [-1, 1]) {
        const xb = SM + sx * hb, xt = SM + sx * hw, w0 = -sx * pin * 1.1, w1 = -sx * pin;
        poly(c, [[xb, y0], [xt, y1], [xt + w1, y1], [xb + w0, y0]]); c.fill();
        // its pinnacle with crockets
        const px = xt + w1 / 2;
        poly(c, [[px - pin * 0.42, y1 + 2], [px, y1 - hw * 1.2], [px + pin * 0.42, y1 + 2]]); c.fill();
        for (let k = 1; k < 6; k++) {
          const t = k / 6, yy = y1 - hw * 1.2 * t, ww = pin * 0.42 * (1 - t);
          c.fillRect(px - ww - 4, yy - 1, 4, 3); c.fillRect(px + ww, yy - 1, 4, 3);
        }
        if (fly) {
          // an outer pier and the flying strut back to the tower
          const fx = SM + sx * ox;
          poly(c, [[fx - 9, y0], [fx - 7, y0 - oh], [fx + 7, y0 - oh], [fx + 9, y0]]); c.fill();
          poly(c, [[fx - 6, y0 - oh], [fx, y0 - oh - hw * 0.6], [fx + 6, y0 - oh]]); c.fill();
          c.strokeStyle = ink; c.lineWidth = 8; c.beginPath(); c.moveTo(fx, y0 - oh + 10); c.quadraticCurveTo((fx + xt) / 2, y0 - oh - 30, lerp(xb, xt, 0.65), lerp(y0, y1, 0.65)); c.stroke();
        }
      }
      // the arch: a band and spandrels around a pointed opening, left open
      const kx = (y) => lerp(hb, hw, (y0 - y) / (y0 - y1)) - pin * 1.05;
      c.beginPath();
      c.moveTo(SM - kx(y1), y1); c.lineTo(SM + kx(y1), y1); c.lineTo(SM + kx(spring), spring); c.lineTo(SM - kx(spring), spring); c.closePath();
      const aw = kx(spring) - 4;
      c.moveTo(SM - aw, spring + 1); c.quadraticCurveTo(SM - aw, apex + (spring - apex) * 0.25, SM, apex);
      c.quadraticCurveTo(SM + aw, apex + (spring - apex) * 0.25, SM + aw, spring + 1); c.closePath();
      c.fill('evenodd');
      // the gallery's parapet along the top of the stage, pierced
      c.fillRect(SM - hw - 12, y1 - 6, hw * 2 + 24, 14);
      c.fillStyle = mix(SKY[3], SKY[2], 0.4);
      for (let x = SM - hw + 2; x < SM + hw - 8; x += 9) c.fillRect(x, y1, 4, 5);
      c.fillStyle = ink;
      // small pinnacles along the parapet
      for (let k = 1; k < 4; k++) { const px = SM - hw + k * hw / 2; poly(c, [[px - 4, y1 - 3], [px, y1 - hw * 0.42], [px + 4, y1 - 3]]); c.fill(); }
      // a mullion and a roundel in the upper openings
      if (i > 0) {
        c.fillRect(SM - hb, y0 - (y0 - y1) * 0.2, hb * 2, (y0 - y1) * 0.2);
        c.fillStyle = 'rgba(242,196,141,.25)';
        for (let x = SM - hb + pin + 6; x < SM + hb - pin - 8; x += 12) c.fillRect(x, y0 - (y0 - y1) * 0.16, 5, (y0 - y1) * 0.1);
        c.fillStyle = ink;
        c.fillRect(SM - 2, apex + (spring - apex) * 0.3, 4, y0 - apex);
        c.strokeStyle = ink; c.lineWidth = 3; c.beginPath(); c.arc(SM, apex + (spring - apex) * 0.32, aw * 0.32, 0, Math.PI * 2); c.stroke();
      } else {
        c.fillRect(SM - hb - 10, y0 - 14, hb * 2 + 20, 14);
      }
      // the lit edges toward the glow
      c.fillStyle = lit;
      poly(c, [[SM - hb, y0], [SM - hw, y1], [SM - hw + 3, y1], [SM - hb + 3, y0]]); c.fill();
      c.fillRect(SM - aw, spring - (spring - apex) * 0.1, 2, y0 - spring);
    }, { t: 6.4 + i * 0.55, d: 1.2, reveal: 'rise', ease: 'inOut' });
  });
  // the final spire, drawn up to its finial
  const sp = [[SM - 30, 664], [SM - 4, 300], [SM, 250], [SM + 4, 300], [SM + 30, 664]];
  p.fill('monument', sp, ink, { t: 9.1, d: 1.2, reveal: 'rise', ease: 'inOut' });
  const crock = [];
  for (let y = 640; y > 310; y -= 22) { const w = lerp(30, 4, (664 - y) / 364); crock.push([[SM - w - 6, y], [SM - w, y - 6]], [[SM + w + 6, y], [SM + w, y - 6]]); }
  p.strokes('monument', crock, ink, 3, { t: 9.8, d: 0.8, reveal: 'rise', box: { x: SM - 50, y: 280, w: 100, h: 400 } });
  p.pen('monument', [[SM - 28, 660], [SM - 2, 270]], lit, 2, { t: 10.0, d: 0.8 });
  // the platform: Princes Street's railing at its feet
  p.group('monument', { x: 1060, y: 1660, w: X1 - 1060 + 4, h: 60 }, (c) => {
    c.fillStyle = ink; c.fillRect(1060, 1690, X1 - 1060, 14);
    for (let x = 1064; x < X1; x += 12) c.fillRect(x, 1670, 3, 22);
    c.fillRect(1060, 1668, X1 - 1060, 3);
  }, { t: 8.6, d: 0.9, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ things that move
function life(p, r) {
  // the mist, drifting slowly across the rock's foot and the valley
  const banks = [];
  for (let i = 0; i < 7; i++) banks.push([r.range(X0, X1), r.range(1050, 1230), r.range(220, 420), r.range(18, 34), r.range(6, 14), r() * 6]);
  p.live('mist', {
    t: 2.4, d: 2.0, box: { x: X0, y: 980, w: X1 - X0, h: 300 },
    draw: (c, time) => {
      for (const [x0, y, w, h, sp, ph] of banks) {
        const x = X0 + ((x0 - X0 + time * sp) % (X1 - X0 + w)) - w / 2;
        c.fillStyle = 'rgba(234,218,222,.36)'; c.beginPath(); c.ellipse(x, y, w, h, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(244,232,230,.22)'; c.beginPath(); c.ellipse(x + w * 0.2, y - h * 0.3, w * 0.6, h * 0.55, 0, 0, Math.PI * 2); c.fill();
      }
    },
  });
  // the train, steaming west through the gardens, its plume trailing
  p.live('rail', {
    t: 9.2, d: 1.0, box: { x: X0, y: 1220, w: X1 - X0, h: 160 },
    draw: (c, time) => {
      const k = time - 9.2, x = 860 - k * 20, y = 1346;
      c.fillStyle = '#141a1c';
      c.fillRect(x, y - 30, 80, 22); c.fillRect(x + 50, y - 46, 30, 38); c.fillRect(x + 8, y - 44, 10, 16);
      c.beginPath(); c.arc(x + 10, y - 19, 11, Math.PI * 0.5, Math.PI * 1.5); c.fill();
      for (let i = 0; i < 4; i++) {
        c.fillStyle = '#1c2426'; c.fillRect(x + 90 + i * 76, y - 36, 70, 28);
        c.fillStyle = LAMP; for (let w = 0; w < 6; w++) c.fillRect(x + 96 + i * 76 + w * 11, y - 30, 6, 8);
      }
      // the plume: puffs rising and spreading behind the engine
      for (let i = 0; i < 9; i++) {
        const age = i * 0.45 + (time * 1.6) % 0.45;
        const px = x + 13 + age * 26, py = y - 48 - age * 16, rr = 8 + age * 9;
        c.fillStyle = `rgba(238,226,228,${Math.max(0, 0.55 - age * 0.12)})`;
        c.beginPath(); c.arc(px, py, rr, 0, Math.PI * 2); c.fill();
      }
    },
  });
  // the flag on the Palace tower
  p.live('live', {
    t: 5.0, d: 0.8, box: { x: 880, y: 480, w: 60, h: 70 },
    draw: (c, time) => {
      const x = 891, y = 496;
      c.fillStyle = CASTLE; c.fillRect(x - 1, y, 2.5, 64);
      c.beginPath(); c.moveTo(x, y);
      for (let i = 0; i <= 5; i++) c.lineTo(x + i * 6, y + Math.sin(time * 4 - i) * 2.5);
      for (let i = 5; i >= 0; i--) c.lineTo(x + i * 6, y + 18 + Math.sin(time * 4 - i) * 2.5);
      c.fill();
    },
  });
  // rooks going home to roost
  const birds = [];
  for (let i = 0; i < 9; i++) birds.push([r.range(150, 1000), r.range(380, 640), r.range(0.7, 1.1), r() * 6]);
  p.live('live', {
    t: 9.6, d: 1.0, box: { x: X0, y: 300, w: X1 - X0, h: 400 },
    draw: (c, time) => {
      c.strokeStyle = '#2a2638'; c.lineCap = 'round';
      const k = time - 9.6;
      for (const [x0, y0, s, ph] of birds) {
        const x = x0 + k * 14 * s, y = y0 - k * 3 + Math.sin(time + ph) * 6, f = Math.sin(time * 6 * s + ph) * 4;
        c.lineWidth = 2.2 * s;
        c.beginPath(); c.moveTo(x - 9 * s, y - f * s); c.lineTo(x, y); c.lineTo(x + 9 * s, y - f * s); c.stroke();
      }
    },
  });
}

// ================================================================ the name
function title(p, r) {
  p.type('title', 'EDINBURGH', 92, 1832, {
    family: FACE, weight: 700, size: 220, track: 0.06, fit: 1080, color: CREAM,
    t: 10.6, gap: 0.16, d: 0.8, reveal: 'rise',
  });
  p.group('title', { x: 92, y: 1858, w: 640, h: 8 }, (c) => { c.fillStyle = RIM; c.fillRect(96, 1860, 630, 3); }, { t: 12.2, d: 0.7, reveal: 'wipe', ease: 'inOut' });
  p.type('title', 'THE CASTLE FROM PRINCES STREET GARDENS', 96, 1898, {
    family: FACE, weight: 500, size: 24, track: 0.24, color: RIM, t: 12.5, gap: 0.02, d: 0.4, reveal: 'fade',
  });
}
