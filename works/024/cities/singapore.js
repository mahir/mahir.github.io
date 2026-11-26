// Singapore: a 1950s tropical-modern travel poster, screen printed in a few flat
// inks that never quite register. Marina Bay seen from the Merlion: the lion with
// a fish's body spouting into the bay, and across the water the three towers of
// Marina Bay Sands under their ship of a roof garden, the ArtScience Museum's
// lotus, the spiky domes of the Esplanade, the Supertrees and the garden domes,
// the city behind in a humid haze. Orchids hang in from the corner, and below,
// a frieze of shophouses with louvered shutters and five-foot ways. The name runs
// huge across the sky, behind the towers.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, mix, shade } from '../kit.js';

const CREAM = '#f3ead2', NAVY = '#1c2c3a', JADE = '#1e5b4c', LEAF = '#3e8a4e', LIME = '#a9c95a';
const CORAL = '#ef6a4c', ORCHID = '#c9468f', ORCHID_L = '#e88ab8', TEAL = '#2a8f93', TEAL_D = '#1b6670';
const SKY = '#cfe6d6', SKY2 = '#b4d9cb', SKY3 = '#97cbbd', SUN = '#f6c445', HAZE = '#e2eee0';
const STONE = '#e9e2cf', STONE_D = '#b9b5a4';

const FACE = '"Passion One"';
const SUB = 'MARINA BAY · THE LION CITY';

export const city = {
  id: 'singapore', name: 'Singapore', wall: '#173d36',
  alt: 'A 1950s tropical-modern screen print of Marina Bay: the Merlion on its rock spouting into the bay, and across the water the three towers of Marina Bay Sands under their ship of a roof garden, the ArtScience Museum like a lotus, the spiky domes of the Esplanade, the Supertrees and the garden domes and the city’s towers in a hazy sun, orchids hanging in from the corner, a bumboat on the water, and below, a frieze of shophouses with louvered shutters and five-foot ways where people walk under parasols, under the name SINGAPORE running huge across the sky behind the towers',
  google: 'family=Passion+One:wght@400;900',
  fonts: [['900 300px "Passion One"', 'SINGAPORE'], ['400 46px "Passion One"', SUB]],
  build,
};

const X0 = 60, X1 = W - 60, Y0 = 60, Y1 = 1860;
const SHORE = 1190;   // the far shore of the bay
const BAY1 = 1600;    // the near edge of the bay
const FR0 = 1620;     // the shophouse frieze
const STREET = 1832;

function build() {
  const p = new Plate({ paper: CREAM, seed: 65 });
  const r = p.r;
  p.clip = { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  p.stack('sky', 'sun', 'title', 'far', 'water', 'mbs', 'park', 'merlion', 'frieze', 'green', 'live', 'frame');
  p.layer('frame', { clip: false });

  sky(p, r);
  title(p);
  far(p, r);
  water(p, r);
  sands(p, r);
  park(p, r);
  merlion(p, r);
  frieze(p, r);
  greens(p, r);
  live(p, r);
  margin(p);
  return p;
}

function path(c, pts, close = true) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath();
}
// a print off its register: the key line lands a little down and to the right
function offLine(c, pts, close = true, col = NAVY, lw = 3) {
  c.save(); c.translate(4, 3); c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = 'round'; path(c, pts, close); c.stroke(); c.restore();
}
// dry-brush: pale streaks where the ink thinned on the screen
function dry(r, x0, y0, x1, y1, n, len) {
  const out = [];
  for (let i = 0; i < n; i++) { const x = r.range(x0, x1), y = r.range(y0, y1), L = r.range(len * 0.4, len); out.push([[x, y], [x + L, y + r.range(-1, 1)]]); }
  return out;
}

// ================================================================ sky
function sky(p, r) {
  // flat stepped bands, not a gradient: one ink laid over another
  p.group('sky', { x: X0, y: Y0, w: X1 - X0, h: SHORE - Y0 + 20 }, (c) => {
    c.fillStyle = HAZE; c.fillRect(X0, Y0, X1 - X0, SHORE - Y0 + 20);
    const band = (y, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(X0, Y0); c.lineTo(X1, Y0); for (let x = X1; x >= X0; x -= 20) c.lineTo(x, y + Math.sin(x * 0.004 + y) * 10); c.closePath(); c.fill(); };
    band(1000, SKY); band(720, SKY2); band(380, SKY3);
  }, { t: 0, d: 1.2, reveal: 'fall', ease: 'inOut' });
  p.strokes('sky', dry(r, X0, Y0, X1, SHORE, 420, 90), 'rgba(243,234,210,0.35)', 2, { t: 0.9, d: 1.0, reveal: 'wipe', box: { x: X0 - 10, y: Y0 - 10, w: X1 - X0 + 120, h: SHORE - Y0 + 20 } });

  // a hazy sun, ringed
  p.group('sun', { x: 120, y: 200, w: 440, h: 440 }, (c) => {
    c.fillStyle = mix(SUN, HAZE, 0.55); c.beginPath(); c.arc(340, 420, 205, 0, Math.PI * 2); c.fill();
    c.fillStyle = SUN; c.beginPath(); c.arc(340, 420, 165, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(243,234,210,0.6)'; c.lineWidth = 3; c.beginPath();
    for (let y = 300; y < 590; y += 14) { const h = Math.sqrt(Math.max(0, 165 ** 2 - (y - 420) ** 2)); c.moveTo(340 - h, y); c.lineTo(340 + h, y); }
    c.stroke();
  }, { t: 0.8, d: 1.0, reveal: 'pop' });

  // flat clouds: pills stacked, each with a lime shadow off its register
  const list = [[540, 860, 300], [1080, 790, 260], [140, 980, 230], [1240, 160, 220], [700, 170, 160], [1300, 960, 200]];
  list.forEach(([x, y, w], i) => {
    const pills = [[x, y, w, 34], [x + w * 0.18, y - 30, w * 0.55, 34], [x + w * 0.45, y + 30, w * 0.6, 30]];
    p.group('sun', { x: x - 20, y: y - 70, w: w + 60, h: 140 }, (c) => {
      const pill = (px, py, pw, ph) => { c.beginPath(); c.moveTo(px + ph / 2, py - ph / 2); c.lineTo(px + pw - ph / 2, py - ph / 2); c.arc(px + pw - ph / 2, py, ph / 2, -Math.PI / 2, Math.PI / 2); c.lineTo(px + ph / 2, py + ph / 2); c.arc(px + ph / 2, py, ph / 2, Math.PI / 2, Math.PI * 1.5); c.fill(); };
      c.fillStyle = mix(LIME, SKY, 0.35); for (const [px, py, pw, ph] of pills) pill(px + 8, py + 8, pw, ph);
      c.fillStyle = CREAM; for (const q of pills) pill(...q);
    }, { t: 1.4 + i * 0.25, d: 1.1, reveal: 'slide', dx: i % 2 ? 60 : -60, ease: 'out' });
  });
}

// ================================================================ the name, behind the towers
function title(p) {
  p.type('title', 'SINGAPORE', W / 2, 545, {
    size: 330, family: FACE, weight: 900, color: CORAL, shadow: NAVY, sx: 10, sy: 8, align: 'center', track: 0.01, fit: X1 - X0 - 70,
    t: 10.4, gap: 0.16, d: 0.8, reveal: 'press',
  });
}

// ================================================================ the far shore: the city, the Esplanade
function far(p, r) {
  // the city's towers, pale in the haze
  const towers = [];
  for (let x = X0 + 10; x < 640;) {
    const w = r.range(40, 90), h = r.range(180, 470);
    towers.push([x, w, h, r.pick(['#a9c7c4', '#9bbcbd', '#bad2cb', '#8fb2b6'])]);
    x += w + r.range(-14, 8);
  }
  towers.sort((a, b) => b[2] - a[2]);
  p.group('far', { x: X0, y: SHORE - 500, w: 620, h: 510 }, (c) => {
    for (const [x, w, h, col] of towers) {
      c.fillStyle = col; c.fillRect(x, SHORE - h, w, h);
      c.fillStyle = shade(col, 0.88); c.fillRect(x + w * 0.65, SHORE - h, w * 0.35, h);
      c.fillStyle = 'rgba(243,234,210,0.55)'; for (let y = SHORE - h + 10; y < SHORE - 10; y += 10) c.fillRect(x + 4, y, w * 0.6 - 4, 3);
    }
  }, { t: 2.0, d: 1.0, reveal: 'rise' });
  // the Esplanade: two domes covered in spiky sunshades
  const domes = [[545, 200, 100], [690, 130, 70]];
  p.group('far', { x: 420, y: SHORE - 120, w: 360, h: 130 }, (c) => {
    for (const [cx, w, h] of domes) {
      c.save();
      c.beginPath(); c.ellipse(cx, SHORE, w / 2, h, 0, Math.PI, Math.PI * 2); c.closePath();
      c.fillStyle = '#c9b98a'; c.fill(); c.clip();
      c.fillStyle = '#8e7e58';
      for (let row = 0; row < 9; row++) {
        const y = SHORE - h + row * (h / 8.5);
        for (let k = -12; k <= 12; k++) {
          const x = cx + k * 16 + (row % 2) * 8;
          c.beginPath(); c.moveTo(x - 6, y + 10); c.lineTo(x, y); c.lineTo(x + 6, y + 10); c.fill();
        }
      }
      c.fillStyle = 'rgba(28,44,58,0.18)'; c.fillRect(cx + w * 0.12, SHORE - h, w, h);
      c.restore();
      offLine(c, Array.from({ length: 25 }, (_, i) => [cx + Math.cos(Math.PI + (i / 24) * Math.PI) * w / 2, SHORE + Math.sin(Math.PI + (i / 24) * Math.PI) * h]), false, NAVY, 2.5);
    }
  }, { t: 2.6, d: 0.8, reveal: 'rise' });
  // the shore: a low green bank and a promenade line
  p.group('far', { x: X0, y: SHORE - 24, w: X1 - X0, h: 34 }, (c) => {
    c.fillStyle = LEAF; c.beginPath(); c.moveTo(X0, SHORE + 2);
    for (let x = X0; x <= X1; x += 18) c.lineTo(x, SHORE - 8 - Math.abs(Math.sin(x * 0.07)) * 12);
    c.lineTo(X1, SHORE + 2); c.fill();
    c.fillStyle = STONE; c.fillRect(X0, SHORE, X1 - X0, 6);
  }, { t: 3.0, d: 0.8, reveal: 'wipe' });
}

// ================================================================ the bay
function water(p, r) {
  p.group('water', { x: X0, y: SHORE, w: X1 - X0, h: BAY1 - SHORE }, (c) => {
    c.fillStyle = TEAL; c.fillRect(X0, SHORE + 6, X1 - X0, BAY1 - SHORE);
    c.fillStyle = mix(TEAL, SKY, 0.35); c.fillRect(X0, SHORE + 6, X1 - X0, 70);
    c.fillStyle = TEAL_D; c.fillRect(X0, 1460, X1 - X0, BAY1 - 1460);
  }, { t: 3.0, d: 1.0, reveal: 'fall' });
  // the towers' reflections: broken stripes
  const refl = [];
  for (const cx of [905, 1080, 1255]) for (let y = SHORE + 14; y < 1520; y += 11) {
    const k = (y - SHORE) / 330, w = 70 * (1 - k * 0.3) * r.range(0.5, 1.1);
    refl.push([[cx - w / 2 + r.range(-8, 8), y], [cx + w / 2 + r.range(-8, 8), y]]);
  }
  p.strokes('water', refl, 'rgba(226,238,224,0.55)', 5, { t: 6.2, d: 1.0, reveal: 'fall' });
  // flat cream wave dashes
  const waves = [];
  for (let i = 0; i < 260; i++) {
    const y = r.range(SHORE + 20, BAY1 - 6), k = (y - SHORE) / (BAY1 - SHORE), x = r.range(X0, X1), L = 10 + k * 34;
    waves.push([[x, y], [x + L * 0.5, y - 2 - k * 2], [x + L, y]]);
  }
  p.strokes('water', waves, 'rgba(243,234,210,0.8)', 2.2, { t: 3.5, d: 1.0, reveal: 'wipe' });
}

// ================================================================ Marina Bay Sands
const TOP = 592; // the towers' heads, under the roof garden
function towerPts(cx) {
  // two legs leaning together; the east one bows out
  const wb = 104, wt = 74;
  const L = [], R = [];
  for (let k = 0; k <= 20; k++) {
    const t = k / 20, y = lerp(SHORE, TOP, t);
    L.push([cx - lerp(wb / 2, wt / 2, t), y]);
    R.push([cx + lerp(wb / 2, wt / 2, t) + Math.sin(t * Math.PI) * 18, y]);
  }
  return [...L, ...R.reverse()];
}

function sands(p, r) {
  [905, 1080, 1255].forEach((cx, i) => {
    const pts = towerPts(cx);
    p.group('mbs', { x: cx - 70, y: TOP - 10, w: 150, h: SHORE - TOP + 20 }, (c) => {
      c.fillStyle = '#e6e8dc'; path(c, pts); c.fill();
      c.save(); path(c, pts); c.clip();
      // the shaded leg and the gap between the legs
      c.fillStyle = '#9fb7b3'; path(c, [[cx + 4, SHORE], [cx + 80, SHORE], [cx + 80, TOP], [cx + 4, TOP]]); c.fill();
      c.fillStyle = TEAL_D; path(c, [[cx - 7, SHORE], [cx + 7, SHORE], [cx + 2, SHORE - 380], [cx - 2, SHORE - 380]]); c.fill();
      // floors
      c.strokeStyle = 'rgba(28,44,58,0.32)'; c.lineWidth = 1.4; c.beginPath();
      for (let y = TOP + 6; y < SHORE; y += 7.5) { c.moveTo(cx - 60, y); c.lineTo(cx + 80, y); }
      c.stroke();
      c.fillStyle = 'rgba(243,234,210,0.5)'; c.fillRect(cx - 40, TOP, 8, SHORE - TOP);
      c.restore();
      offLine(c, pts);
    }, { t: 3.8 + i * 0.5, d: 1.2, reveal: 'rise', ease: 'inOut' });
  });
  // the roof garden: a ship laid across the three heads, its bow over the north tower
  const ship = [[770, TOP - 22], [1340, TOP - 22], [1350, TOP - 8], [1330, TOP + 6], [900, TOP + 10], [835, TOP + 4], [770, TOP - 6]];
  const palms = [];
  for (let x = 800; x < 1330; x += r.range(12, 22)) palms.push([x, r.range(6, 11)]);
  p.group('mbs', { x: 740, y: TOP - 60, w: 640, h: 90 }, (c) => {
    for (const [x, rr] of palms) { c.fillStyle = LEAF; c.beginPath(); c.arc(x, TOP - 24, rr, Math.PI, Math.PI * 2); c.fill(); }
    c.fillStyle = '#d6dacd'; path(c, ship); c.fill();
    c.fillStyle = '#9fb7b3'; path(c, [[835, TOP + 4], [1330, TOP + 6], [1350, TOP - 8], [1345, TOP - 4], [900, TOP]]); c.fill();
    c.fillStyle = TEAL; c.fillRect(1160, TOP - 26, 160, 5);
    offLine(c, ship);
  }, { t: 5.5, d: 1.0, reveal: 'slide', dx: -120, ease: 'out' });
  // the podium along the water
  p.group('mbs', { x: 820, y: SHORE - 50, w: 540, h: 60 }, (c) => {
    c.fillStyle = '#d8d6c4';
    path(c, [[840, SHORE], [840, SHORE - 22], [900, SHORE - 38], [960, SHORE - 22], [1020, SHORE - 38], [1080, SHORE - 22], [1140, SHORE - 38], [1200, SHORE - 22], [1260, SHORE - 38], [1330, SHORE - 22], [1330, SHORE]]); c.fill();
    c.fillStyle = 'rgba(28,44,58,0.25)'; c.fillRect(840, SHORE - 12, 490, 4);
  }, { t: 6.0, d: 0.6, reveal: 'rise' });
  // the ArtScience Museum: a white lotus of ten fingers on the water
  p.group('park', { x: 680, y: SHORE - 140, w: 220, h: 160 }, (c) => {
    const cx = 790, base = SHORE + 4;
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k - 4) * 0.27, L = 100 - Math.abs(k - 4) * 10;
      const tip = [cx + Math.cos(a) * L, base - 22 + Math.sin(a) * L];
      const pts = [[cx + Math.cos(a - 1.4) * 22, base - 6], tip, [cx + Math.cos(a + 1.4) * 22, base - 6]];
      c.fillStyle = k < 4 ? '#f6f2e4' : '#cfd3c6'; path(c, pts); c.fill();
      c.strokeStyle = NAVY; c.lineWidth = 2; c.save(); c.translate(3, 2); path(c, pts); c.stroke(); c.restore();
    }
    c.fillStyle = '#d8d6c4'; c.fillRect(cx - 40, base - 8, 80, 10);
  }, { t: 6.4, d: 0.7, reveal: 'rise' });
}

// ================================================================ the gardens beyond
function park(p, r) {
  const trees = [[1395, 170], [1455, 220], [1510, 150], [1370, 110]];
  trees.forEach(([x, h], i) => {
    p.group('park', { x: x - 60, y: SHORE - h - 30, w: 120, h: h + 40 }, (c) => {
      // the trunk, a lattice, and the canopy like an open umbrella
      c.fillStyle = '#7b3a6a'; path(c, [[x - 6, SHORE], [x + 6, SHORE], [x + 20, SHORE - h], [x - 20, SHORE - h]]); c.fill();
      c.strokeStyle = ORCHID_L; c.lineWidth = 1.5; c.beginPath();
      for (let y = SHORE - h + 10; y < SHORE; y += 12) { const w = lerp(20, 6, (y - (SHORE - h)) / h); c.moveTo(x - w, y); c.lineTo(x + w, y - 8); }
      c.stroke();
      c.fillStyle = ORCHID; path(c, [[x - 48, SHORE - h - 18], [x + 48, SHORE - h - 18], [x + 18, SHORE - h], [x - 18, SHORE - h]]); c.fill();
      c.fillStyle = '#e9a63a'; c.fillRect(x - 48, SHORE - h - 22, 96, 5);
      offLine(c, [[x - 48, SHORE - h - 18], [x + 48, SHORE - h - 18], [x + 18, SHORE - h], [x - 18, SHORE - h]], true, NAVY, 2);
    }, { t: 6.8 + i * 0.18, d: 0.6, reveal: 'rise' });
  });
  // the two glass domes of the gardens
  p.group('park', { x: 1360, y: SHORE - 80, w: 190, h: 90 }, (c) => {
    for (const [cx, w, h] of [[1420, 110, 52], [1510, 80, 40]]) {
      c.fillStyle = '#bfe0dc'; c.beginPath(); c.ellipse(cx, SHORE, w / 2, h, 0, Math.PI, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(28,44,58,0.4)'; c.lineWidth = 1.2; c.beginPath();
      for (let k = 1; k < 7; k++) { const x = cx - w / 2 + (k * w) / 7; c.moveTo(x, SHORE); c.quadraticCurveTo(cx + (x - cx) * 0.6, SHORE - h * 0.9, cx, SHORE - h); }
      c.stroke();
    }
  }, { t: 7.4, d: 0.6, reveal: 'rise' });
}

// ================================================================ the Merlion
const MX = 330;
function merlion(p, r) {
  // the rock, the stone slab, and the waves he rises from
  p.group('merlion', { x: 120, y: 1420, w: 470, h: 190 }, (c) => {
    c.fillStyle = JADE; path(c, [[130, BAY1 + 4], [160, 1530], [230, 1500], [330, 1508], [440, 1494], [530, 1520], [570, BAY1 + 4]]); c.fill();
    c.fillStyle = shade(JADE, 0.7); path(c, [[330, 1508], [440, 1494], [530, 1520], [570, BAY1 + 4], [380, BAY1 + 4]]); c.fill();
    c.fillStyle = STONE; c.fillRect(200, 1480, 290, 26);
    c.fillStyle = STONE_D; c.fillRect(200, 1500, 290, 6);
    c.fillStyle = '#dfe6dc'; c.beginPath();
    for (let x = 214; x < 480; x += 36) { c.moveTo(x, 1482); c.arc(x + 18, 1482, 18, Math.PI, 0); }
    c.fill();
    c.strokeStyle = TEAL_D; c.lineWidth = 2.2; c.beginPath();
    for (let x = 214; x < 480; x += 36) { c.moveTo(x + 8, 1482); c.arc(x + 18, 1482, 10, Math.PI, 0); }
    c.stroke();
  }, { t: 7.0, d: 0.6, reveal: 'rise' });

  // the fish's body, upright, its tail curled up behind with a split fin
  const body = [[450, 1110], [500, 1200], [506, 1300], [482, 1390], [450, 1470], [250, 1470], [214, 1424], [198, 1362], [194, 1310],
    [146, 1258], [214, 1292], [240, 1244], [228, 1318], [252, 1362], [284, 1300], [300, 1220], [322, 1150]];
  p.group('merlion', { x: 130, y: 1100, w: 400, h: 380 }, (c) => {
    c.fillStyle = '#f4f0e4'; path(c, body); c.fill();
    c.save(); path(c, body); c.clip();
    c.fillStyle = '#c9cfc6'; path(c, [[430, 1100], [520, 1100], [520, 1480], [400, 1480]]); c.fill();
    c.fillStyle = '#d8ddd2'; c.fillRect(130, 1240, 100, 100);
    // scales
    c.strokeStyle = 'rgba(28,44,58,0.35)'; c.lineWidth = 1.6; c.beginPath();
    for (let y = 1190; y < 1470; y += 16) for (let x = 250 + ((y / 16) % 2) * 9; x < 510; x += 18) { c.moveTo(x - 8, y); c.arc(x, y, 8, Math.PI, 0, true); }
    c.stroke();
    // the ribs of the fin
    c.strokeStyle = 'rgba(28,44,58,0.4)'; c.lineWidth = 1.5; c.beginPath();
    for (let k = 0; k < 5; k++) { c.moveTo(212, 1330); c.lineTo(160 + k * 18, 1262 - k * 4); }
    c.stroke();
    c.restore();
    offLine(c, body);
    // a fin on his chest
    const fin = [[440, 1250], [400, 1320], [460, 1300]];
    c.fillStyle = '#e2e2d6'; path(c, fin); c.fill(); offLine(c, fin);
  }, { t: 7.4, d: 1.0, reveal: 'rise' });

  // the lion's head in profile: a mane of scallops and curls, the face toward the bay
  const hx = 400, hy = 1060;
  const mane = [];
  for (let k = 0; k <= 48; k++) { const a = (k / 48) * Math.PI * 2, rr = 120 + (k % 2 ? -14 : 8); mane.push([hx + Math.cos(a) * rr * 0.9, hy + Math.sin(a) * rr]); }
  const face = [[380, 958], [470, 972], [520, 1006], [550, 1032], [544, 1060], [506, 1066], [538, 1080], [524, 1112], [452, 1126], [392, 1108], [362, 1020]];
  p.group('merlion', { x: hx - 130, y: hy - 140, w: 300, h: 290 }, (c) => {
    c.fillStyle = '#ece8da'; path(c, mane); c.fill();
    c.save(); path(c, mane); c.clip(); c.fillStyle = '#c9cfc6'; c.fillRect(hx - 140, hy + 40, 300, 120); c.restore();
    offLine(c, mane);
    c.strokeStyle = 'rgba(28,44,58,0.45)'; c.lineWidth = 2; c.beginPath();
    for (let ring = 0; ring < 2; ring++) for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2 + ring * 0.2, rr = ring ? 62 : 94, x = hx + Math.cos(a) * rr * 0.9, y = hy + Math.sin(a) * rr;
      c.moveTo(x + 8, y); c.arc(x, y, 8, 0, Math.PI * 1.5);
    }
    c.stroke();
    c.fillStyle = '#f8f5ea'; path(c, face); c.fill();
    c.fillStyle = '#d8ddd2'; path(c, [[452, 1126], [524, 1112], [538, 1080], [506, 1066], [470, 1090], [420, 1100]]); c.fill();
    offLine(c, face);
    c.fillStyle = TEAL_D; path(c, [[506, 1066], [544, 1060], [538, 1080]]); c.fill();
    // the ear, the eye under a heavy brow, the nose, the whisker spots
    c.fillStyle = '#f8f5ea'; path(c, [[388, 966], [400, 930], [424, 962]]); c.fill(); offLine(c, [[388, 966], [400, 930], [424, 962]], true, NAVY, 2);
    c.fillStyle = NAVY; c.beginPath(); c.ellipse(478, 1002, 10, 6, 0.15, 0, Math.PI * 2); c.fill();
    c.strokeStyle = NAVY; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(452, 986); c.quadraticCurveTo(478, 974, 502, 990); c.stroke();
    c.fillStyle = NAVY; c.beginPath(); c.arc(546, 1030, 5, 0, Math.PI * 2); c.fill();
    c.beginPath(); for (const [x, y] of [[508, 1040], [520, 1046], [514, 1034], [526, 1036]]) { c.moveTo(x + 2.4, y); c.arc(x, y, 2.4, 0, Math.PI * 2); } c.fill();
  }, { t: 8.0, d: 0.8, reveal: 'press' });
}

// ================================================================ the shophouse frieze
function shophouse(c, x, w, col, shut, r0) {
  const top = FR0 + 34, mid = FR0 + 120, base = STREET;
  // the roof, the facade, the pilasters
  c.fillStyle = '#b8553a'; path(c, [[x - 4, top], [x + w + 4, top], [x + w - 6, top - 22], [x + 6, top - 22]]); c.fill();
  c.fillStyle = 'rgba(28,44,58,0.3)'; for (let k = x + 4; k < x + w; k += 7) c.fillRect(k, top - 20, 2, 20);
  c.fillStyle = col; c.fillRect(x, top, w, base - top);
  c.fillStyle = shade(col, 0.86); c.fillRect(x, top, 10, base - top); c.fillRect(x + w - 10, top, 10, base - top);
  c.fillStyle = CREAM; c.fillRect(x - 3, top, w + 6, 8); c.fillRect(x - 3, mid - 6, w + 6, 8);
  // a band of tiles under the cornice
  for (let k = x + 14; k < x + w - 14; k += 12) { c.fillStyle = (k / 12) % 2 < 1 ? TEAL : CORAL; c.fillRect(k, top + 10, 10, 8); }
  // three shuttered windows with fanlights
  const ww = (w - 40) / 3;
  for (let i = 0; i < 3; i++) {
    const wx = x + 20 + i * ww + 4, wy = top + 34, wh = mid - wy - 14, w2 = ww - 8;
    c.fillStyle = CREAM; c.beginPath(); c.arc(wx + w2 / 2, wy, w2 / 2, Math.PI, 0); c.fill();
    c.fillStyle = NAVY; c.beginPath(); c.arc(wx + w2 / 2, wy, w2 / 2 - 4, Math.PI, 0); c.fill();
    c.strokeStyle = CREAM; c.lineWidth = 1.5; c.beginPath(); for (let k = 1; k < 4; k++) { const a = Math.PI + (k / 4) * Math.PI; c.moveTo(wx + w2 / 2, wy); c.lineTo(wx + w2 / 2 + Math.cos(a) * w2 / 2, wy + Math.sin(a) * w2 / 2); } c.stroke();
    c.fillStyle = shut; c.fillRect(wx, wy, w2, wh);
    c.strokeStyle = shade(shut, 0.7); c.lineWidth = 1.4; c.beginPath();
    for (let y = wy + 5; y < wy + wh; y += 5) { c.moveTo(wx + 2, y); c.lineTo(wx + w2 - 2, y); }
    c.moveTo(wx + w2 / 2, wy); c.lineTo(wx + w2 / 2, wy + wh); c.stroke();
    if ((i + r0) % 3 === 1) { c.fillStyle = NAVY; c.fillRect(wx + w2 * 0.25, wy, w2 * 0.5, wh); }
  }
  // the five-foot way: an arcade in shade
  const n = 2, aw = (w - 20) / n;
  c.fillStyle = shade(col, 0.6); c.fillRect(x + 10, mid + 2, w - 20, base - mid - 2);
  for (let i = 0; i < n; i++) {
    const ax = x + 10 + i * aw + 8, aw2 = aw - 16, ay = mid + 18 + aw2 / 2;
    c.fillStyle = '#2b2a36'; c.beginPath(); c.moveTo(ax, base); c.lineTo(ax, ay); c.arc(ax + aw2 / 2, ay, aw2 / 2, Math.PI, 0); c.lineTo(ax + aw2, base); c.fill();
    c.fillStyle = shut; c.fillRect(ax + aw2 * 0.2, ay + 4, aw2 * 0.6, base - ay - 4);
    c.fillStyle = 'rgba(243,234,210,0.35)'; c.fillRect(ax + aw2 * 0.48, ay + 4, 2, base - ay - 4);
  }
  c.fillStyle = col; for (const px of [x, x + w / 2 - 7, x + w - 14]) c.fillRect(px + (px === x ? 6 : 0), mid + 2, 14 - (px === x ? 6 : 0), base - mid);
}

function frieze(p, r) {
  // the band between the bay and the street: cream, with a coral dotted line
  p.group('frieze', { x: X0, y: BAY1, w: X1 - X0, h: FR0 - BAY1 + 40 }, (c) => {
    c.fillStyle = CREAM; c.fillRect(X0, BAY1, X1 - X0, FR0 - BAY1 + 40);
    c.fillStyle = CORAL; for (let x = X0 + 10; x < X1; x += 22) c.fillRect(x, BAY1 + 8, 10, 4);
    c.fillStyle = SKY; c.fillRect(X0, FR0, X1 - X0, 40);
  }, { t: 8.2, d: 0.6, reveal: 'wipe' });
  const cols = ['#f2b3b0', '#bfe0cf', '#f6d77e', '#a9cbe6', '#f5c29a', '#d7c1e6', '#f2b3b0', '#c7e3a6', '#f6d77e'];
  const shuts = [LEAF, TEAL_D, '#2f6fa8', LEAF, CORAL, JADE, TEAL_D, '#2f6fa8', LEAF];
  const ws = [];
  let x = X0 - 30;
  for (let i = 0; i < 9; i++) { const w = r.range(150, 190); ws.push([x, w]); x += w; }
  ws.forEach(([hx, w], i) => {
    p.group('frieze', { x: hx - 8, y: FR0 + 6, w: w + 16, h: STREET - FR0 + 4 }, (c) => shophouse(c, hx, w, cols[i], shuts[i], i), { t: 8.4 + i * 0.13, d: 0.6, reveal: 'rise' });
  });
  // the street
  p.group('frieze', { x: X0, y: STREET, w: X1 - X0, h: Y1 - STREET }, (c) => {
    c.fillStyle = '#7d8a83'; c.fillRect(X0, STREET, X1 - X0, Y1 - STREET);
    c.fillStyle = STONE; c.fillRect(X0, STREET, X1 - X0, 5);
  }, { t: 9.4, d: 0.5, reveal: 'wipe' });
  // people in the five-foot ways: a parasol, a shopper, a man reading
  const folk = [];
  for (let i = 0; i < 12; i++) folk.push([r.range(X0 + 30, X1 - 30), r.pick([CORAL, NAVY, '#f6f2e4', SUN, ORCHID, TEAL]), r.pick([0, 0, 1, 2]), r.range(0.9, 1.1)]);
  p.group('frieze', { x: X0, y: STREET - 90, w: X1 - X0, h: 100 }, (c) => {
    for (const [fx, col, kind, s] of folk) {
      c.fillStyle = col; path(c, [[fx - 9 * s, STREET], [fx + 9 * s, STREET], [fx + 6 * s, STREET - 40 * s], [fx - 6 * s, STREET - 40 * s]]); c.fill();
      c.fillStyle = '#8a5a3a'; c.beginPath(); c.arc(fx, STREET - 47 * s, 7 * s, 0, Math.PI * 2); c.fill();
      if (kind === 1) { c.fillStyle = r0col(col); c.beginPath(); c.arc(fx + 2, STREET - 58 * s, 22 * s, Math.PI, 0); c.fill(); c.fillStyle = NAVY; c.fillRect(fx + 1, STREET - 58 * s, 2, 18 * s); }
      if (kind === 2) { c.fillStyle = '#f6f2e4'; c.fillRect(fx + 6 * s, STREET - 36 * s, 12 * s, 9 * s); }
    }
  }, { t: 9.6, d: 0.6, reveal: 'fade' });
}
const r0col = (col) => (col === CORAL ? ORCHID_L : CORAL);

// ================================================================ orchids and leaves
function vanda(c, x, y, s, a) {
  // an orchid: five round petals and a dark lip
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  c.fillStyle = ORCHID_L;
  for (let k = 0; k < 5; k++) { const b = (k / 5) * Math.PI * 2 - Math.PI / 2; c.beginPath(); c.ellipse(Math.cos(b) * 12, Math.sin(b) * 12, 11, 8, b, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = ORCHID; c.beginPath(); c.ellipse(0, 9, 8, 11, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = SUN; c.beginPath(); c.arc(0, 0, 4, 0, Math.PI * 2); c.fill();
  c.restore();
}

function leafShape(x, y, L, wd, a) {
  // a long tropical leaf, pointed, as a polygon
  const pts = [];
  for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push([t * L, -Math.sin(t * Math.PI) * wd * (1 - t * 0.3)]); }
  for (let k = 12; k >= 0; k--) { const t = k / 12; pts.push([t * L, Math.sin(t * Math.PI) * wd * (1 - t * 0.3)]); }
  return pts.map(([u, v]) => [x + Math.cos(a) * u - Math.sin(a) * v, y + Math.sin(a) * u + Math.cos(a) * v]);
}

function greens(p, r) {
  // big leaves pushing in at the top left and down the left edge
  const leaves = [
    [X0 - 20, Y0 + 40, 330, 70, 0.35, LEAF], [X0 - 30, Y0 + 160, 260, 60, 0.75, JADE], [X0 + 40, Y0 - 20, 280, 58, 0.1, LIME],
    [X0 - 20, 1300, 240, 56, -0.5, JADE], [X0 - 30, 1420, 280, 62, -0.15, LEAF], [X0 - 10, 1520, 200, 46, -0.9, LIME],
  ];
  leaves.forEach(([x, y, L, wd, a, col], i) => {
    const pts = leafShape(x, y, L, wd, a);
    const veins = [];
    for (let k = 1; k < 10; k++) {
      const t = k / 10, u = t * L, v = Math.sin(t * Math.PI) * wd * 0.8 * (1 - t * 0.3);
      for (const sgn of [-1, 1]) veins.push([[x + Math.cos(a) * u, y + Math.sin(a) * u], [x + Math.cos(a) * (u + 24) - Math.sin(a) * v * sgn, y + Math.sin(a) * (u + 24) + Math.cos(a) * v * sgn]]);
    }
    p.group('green', boxOf(pts, 10), (c) => {
      c.fillStyle = col; path(c, pts); c.fill();
      c.strokeStyle = 'rgba(243,234,210,0.45)'; c.lineWidth = 2; c.beginPath();
      c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
      for (const [[ax, ay], [bx, by]] of veins) { c.moveTo(ax, ay); c.lineTo(bx, by); }
      c.stroke();
      offLine(c, pts, true, NAVY, 2);
    }, { t: 9.0 + i * 0.12, d: 0.7, reveal: 'pop' });
  });
}

// ================================================================ what moves
function live(p, r) {
  // the Merlion's jet, falling into the bay
  const m = [548, 1072], land = [830, 1450], ctrl = [700, 990];
  const at = (t) => [lerp(lerp(m[0], ctrl[0], t), lerp(ctrl[0], land[0], t), t), lerp(lerp(m[1], ctrl[1], t), lerp(ctrl[1], land[1], t), t)];
  const arc = Array.from({ length: 41 }, (_, k) => at(k / 40));
  const spray = [];
  for (let i = 0; i < 18; i++) spray.push([r.range(-50, 50), r.range(0, 40), r() * 6, r.range(2, 5)]);
  p.live('live', {
    t: 9.4, d: 0.8, reveal: 'fade',
    box: { x: 520, y: 960, w: 420, h: 560 },
    draw: (c, time) => {
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(243,250,245,0.85)'; c.lineWidth = 12; path(c, arc, false); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.setLineDash([18, 14]); c.lineDashOffset = -time * 160; path(c, arc, false); c.stroke(); c.setLineDash([]);
      c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath();
      for (const [dx, h, ph, rr] of spray) {
        const k = (time * 1.4 + ph) % 1, x = land[0] + dx * k, y = land[1] - Math.sin(k * Math.PI) * (20 + h);
        c.moveTo(x + rr, y); c.arc(x, y, rr * (1 - k * 0.5), 0, Math.PI * 2);
      }
      c.fill();
    },
  });
  // a bumboat crossing the bay, with its painted eye
  p.live('live', {
    t: 9.8, d: 0.8, reveal: 'fade',
    box: { x: X0, y: 1330, w: X1 - X0, h: 100 },
    draw: (c, time) => {
      const span = X1 - X0 + 260, x = X1 + 130 - ((time * 34 + 600) % span), y = 1400;
      c.fillStyle = 'rgba(28,44,58,0.3)'; c.fillRect(x - 60, y + 6, 120, 5);
      c.fillStyle = CORAL; path(c, [[x - 66, y - 18], [x + 60, y - 18], [x + 48, y + 4], [x - 56, y + 4]]); c.fill();
      c.fillStyle = '#2f6fa8'; c.fillRect(x - 60, y - 22, 116, 6);
      c.fillStyle = '#f6f2e4'; c.beginPath(); c.ellipse(x - 48, y - 8, 7, 5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = NAVY; c.beginPath(); c.arc(x - 49, y - 8, 2.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = SUN; c.fillRect(x - 30, y - 50, 80, 8);
      c.fillStyle = NAVY; c.fillRect(x - 26, y - 42, 3, 20); c.fillRect(x + 44, y - 42, 3, 20);
      c.fillStyle = '#f6f2e4'; for (let k = 0; k < 4; k++) c.fillRect(x - 16 + k * 16, y - 34, 8, 12);
    },
  });
  // swifts over the water
  const birds = [];
  for (let i = 0; i < 6; i++) birds.push([r.range(0.2, 0.5), r() * 6, r.range(700, 1500), r.range(700, 1000)]);
  p.live('live', {
    t: 10.0, d: 0.8, reveal: 'fade',
    box: { x: 560, y: 620, w: 1000, h: 460 },
    draw: (c, time) => {
      c.strokeStyle = NAVY; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath();
      for (const [sp, ph, cx, cy] of birds) {
        const x = cx + Math.sin(time * sp + ph) * 120, y = cy + Math.cos(time * sp * 1.3 + ph) * 40, f = Math.sin(time * 8 + ph) * 4;
        c.moveTo(x - 11, y - 3 - f); c.quadraticCurveTo(x - 4, y - 4, x, y); c.quadraticCurveTo(x + 4, y - 4, x + 11, y - 3 - f);
      }
      c.stroke();
    },
  });
  // an orchid spray hanging in from the top right, nodding
  const flowers = [];
  for (let k = 0; k < 9; k++) flowers.push([k / 8, r.range(0.75, 1.05), r.range(-0.5, 0.5)]);
  p.live('live', {
    t: 9.2, d: 1.0, reveal: 'fall',
    box: { x: 1260, y: Y0 - 20, w: 300, h: 440 },
    draw: (c, time) => {
      const sway = Math.sin(time * 0.9) * 0.05;
      c.save(); c.translate(1525, Y0 - 10); c.rotate(sway);
      const stem = (t) => [-Math.sin(t * 1.4) * 110, t * 300];
      c.strokeStyle = LEAF; c.lineWidth = 4; c.beginPath();
      for (let k = 0; k <= 20; k++) { const [x, y] = stem(k / 20); k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
      for (const [t, s, a] of flowers) { const [x, y] = stem(t); vanda(c, x + (t * 7 % 2 ? 16 : -16), y, 1.35 * s * (1 - t * 0.2), a + sway * 3); }
      c.restore();
    },
  });
}

// ================================================================ the margin
function margin(p) {
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = NAVY; c.lineWidth = 3; c.strokeRect(X0 - 1.5, Y0 - 1.5, X1 - X0 + 3, Y1 - Y0 + 3);
  }, { t: 0.1, d: 0.8, reveal: 'fade' });
  p.type('frame', SUB, W / 2, 1932, { size: 50, family: FACE, weight: 400, color: NAVY, align: 'center', track: 0.18, t: 12.2, gap: 0.04, d: 0.4, reveal: 'fade' });
  for (const sx of [-1, 1]) p.group('frame', { x: W / 2 + sx * 520 - 30, y: 1886, w: 60, h: 60 }, (c) => {
    c.fillStyle = CORAL; c.beginPath(); c.arc(W / 2 + sx * 520, 1915, 12, 0, Math.PI * 2); c.fill();
    c.fillStyle = LEAF; c.beginPath(); c.arc(W / 2 + sx * 520 + sx * 26, 1915, 6, 0, Math.PI * 2); c.fill();
  }, { t: 13.0, d: 0.5, reveal: 'pop' });
}
