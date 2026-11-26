// Cape Town: a 1950s railway-era travel poster, a lithograph pulled from a handful
// of stones, each ink laid flat with a chalky grain where two inks meet. Late
// afternoon from Table Bay, looking south: Devil's Peak, Table Mountain's long flat
// top with its tablecloth of cloud pouring over the edge, the cable car climbing to
// the top, Lion's Head and Signal Hill with the colored houses of the Bo-Kaap on its
// slope, the city at the mountain's foot, the harbor with its cranes, Clock Tower and
// a liner, and close in front a fishing boat moored at a granite quay. The name is
// cut in a deep blue band across the foot of the sheet.

import { Plate, W, H, boxOf } from '../print.js';
import { lerp, clamp, poly, shade, mix, sailboat, Ground, waveLines } from '../kit.js';

// the inks
const PAPER = '#f4ead2', NAVY = '#1c2740', NAVY_L = '#2d3b5c';
const SKY = ['#5b8dbd', '#6c9cc6', '#7fabcd', '#97bbd2', '#b4cdd4', '#d2d9cc', '#ead9b4', '#f4d59c'];
const SHADOW = '#6b6a98', SHADOW_D = '#4f4c7c', SHADOW_L = '#8b86ad';
const LIT = '#e3a072', LIT_L = '#f0bf8a', LIT_D = '#c47f62';
const FYN = '#7b8c58', FYN_D = '#566c47', FYN_L = '#a3a86a', PINE = '#38503f';
const CLOUD = '#fdf9ef', CLOUD_S = '#d3d1e4';
const SEA = '#2a7593', SEA_D = '#17506c', SEA_L = '#7fb4c2', SEA_FAR = '#8fbcc4';
const CORAL = '#e0603c', SUN = '#f3c24f', BRICK = '#ad4a35', BRICK_D = '#7e3427';
const WALL = ['#f5efe0', '#efe4cc', '#e8dcc0', '#f2e6c8', '#e2d3b4'];
const ROOF = ['#b5523a', '#a24a37', '#8e8a86', '#c4683f', '#7d7a7c'];
const KAAP = ['#e9578a', '#f2c230', '#4fb6a6', '#93c94a', '#a184cf', '#f08a3c', '#3d8fd1', '#f6f0e0', '#e74c3c', '#7fd0e0'];
const STONE = '#9a958c', STONE_D = '#6f6b66', STONE_L = '#bbb5a8';
const FONT = '"Bebas Neue", sans-serif';

export const city = {
  id: 'cape-town', name: 'Cape Town', wall: '#1c2740',
  alt: "A 1950s lithographed travel poster of Cape Town from Table Bay in the late afternoon: Devil's Peak, Table Mountain's long flat top with its tablecloth of cloud pouring over the cliffs, the cable car climbing to the top, Lion's Head and Signal Hill with the brightly painted houses of the Bo-Kaap and a minaret on its slope, the city and the City Hall's clock tower at the mountain's foot, the harbor with cranes, sheds, the Clock Tower, a grain silo, a lighthouse on the breakwater, a liner, a tug and yachts, and in front a fishing boat moored at a granite quay with gulls, above the name CAPE TOWN in a deep blue band",
  google: 'family=Bebas+Neue',
  fonts: [['400 300px "Bebas Neue"', 'CAPE TOWN'], ['400 44px "Bebas Neue"', 'SOUTH AFRICA · TABLE BAY · CTA 24']],
  build,
};

// the sheet: a cream margin, the picture, and the blue band at its foot
const PX = 46, PY = 46, PR = W - 46, PB = H - 46;
const BAND = 1676;           // the band's top edge
const QUAY = 1192;           // the harbor's quay line
const WL = 1606;             // the near boat's waterline

// the mountains' skyline, left to right
const RIDGE = [
  [PX - 10, 872], [70, 830], [104, 770], [134, 700], [160, 640], [182, 588], [200, 552], [214, 532], [226, 528], [238, 536],
  [256, 552], [282, 574], [312, 594], [336, 600], [356, 590], [376, 572], [394, 560],
  [470, 557], [560, 559], [650, 555], [740, 558], [830, 554], [920, 557], [1010, 555], [1090, 557], [1108, 560],
  [1124, 572], [1138, 604], [1152, 652], [1170, 714], [1194, 774], [1222, 820], [1250, 840],
  [1284, 812], [1312, 770], [1332, 726], [1346, 690], [1356, 662], [1366, 644], [1382, 632], [1400, 630], [1414, 636], [1426, 652], [1436, 676],
  [1452, 720], [1480, 768], [1520, 808], [PR + 10, 836],
];
const ridgeY = (x) => {
  for (let i = 1; i < RIDGE.length; i++) if (x <= RIDGE[i][0]) { const [x0, y0] = RIDGE[i - 1], [x1, y1] = RIDGE[i]; return lerp(y0, y1, (x - x0) / (x1 - x0)); }
  return RIDGE[RIDGE.length - 1][1];
};
const TOP0 = 394, TOP1 = 1108;   // the flat top, end to end

function build() {
  const p = new Plate({ paper: PAPER, seed: 1952 });
  const r = p.r;
  p.clip = { x: PX, y: PY, w: PR - PX, h: PB - PY };
  p.stack('sky', 'mtn', 'cloth', 'town', 'kaap', 'water', 'harbor', 'ships', 'front', 'band', 'live');

  sky(p, r);
  mountain(p, r);
  tablecloth(p, r);
  town(p, r);
  bokaap(p, r);
  water(p, r);
  harbor(p, r);
  ships(p, r);
  front(p, r);
  band(p);
  life(p, r);
  return p;
}

// ================================================================ helpers
function inside(pts, x, y) {
  let k = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) k = !k;
  }
  return k;
}
// the stone's grain: specks of an ink scattered in a shape, thinning out by a weight
function specks(r, pts, n, size, weight) {
  const b = boxOf(pts), out = [];
  for (let i = 0; i < n * 3 && out.length < n; i++) {
    const x = b.x + r() * b.w, y = b.y + r() * b.h;
    if (weight && r() > weight(x, y)) continue;
    if (inside(pts, x, y)) out.push(x, y, size * r.range(0.5, 1.2));
  }
  return out;
}
function drawSpecks(c, arr, color) {
  c.fillStyle = color; c.beginPath();
  for (let i = 0; i < arr.length; i += 3) c.rect(arr[i], arr[i + 1], arr[i + 2], arr[i + 2]);
  c.fill();
}
function fillPts(c, pts, color) { c.fillStyle = color; poly(c, pts); c.fill(); }
function strokeLines(c, lines, color, lw) {
  c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
  for (const l of lines) { c.moveTo(l[0][0], l[0][1]); for (let i = 1; i < l.length; i++) c.lineTo(l[i][0], l[i][1]); }
  c.stroke();
}
// a ragged edge between two points: the crayon line where a stone stops
function ragged(r, a, b, n, amp) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, j = i === 0 || i === n ? 0 : r.range(-amp, amp);
    out.push([lerp(a[0], b[0], t) + j * 0.5, lerp(a[1], b[1], t) + j]);
  }
  return out;
}

// ================================================================ the sky
function sky(p, r) {
  // flat bands, as the stones laid a graded sky, each meeting the next in a chalky grain
  const top = PY, bot = 900, n = SKY.length;
  const edges = SKY.map((_, i) => lerp(top, bot, (i / n) ** 0.85));
  SKY.forEach((col, i) => {
    const y0 = edges[i], y1 = i === n - 1 ? 1000 : edges[i + 1];
    const next = SKY[Math.min(n - 1, i + 1)];
    const grain = i < n - 1 ? specks(r, [[PX, y1 - 46], [PR, y1 - 46], [PR, y1 + 2], [PX, y1 + 2]], 2600, 2.4, (x, y) => ((y - (y1 - 46)) / 48) ** 1.6) : [];
    p.group('sky', { x: PX, y: y0 - 2, w: PR - PX, h: y1 - y0 + 8 }, (c) => {
      c.fillStyle = col; c.fillRect(PX, y0, PR - PX, y1 - y0 + 1);
      if (grain.length) drawSpecks(c, grain, next);
    }, { t: 0.2 + i * 0.16, d: 0.7, reveal: 'fall', ease: 'soft' });
  });
  // long streaks of high cloud, lit underneath
  const streaks = [[150, 250, 520, 18], [760, 190, 640, 14], [980, 330, 420, 12], [330, 400, 360, 10], [1120, 440, 300, 9]];
  streaks.forEach(([x, y, w, h], i) => {
    const pts = [];
    for (let k = 0; k <= 24; k++) { const t = k / 24, a = t * Math.PI; pts.push([x + t * w, y - Math.sin(a) ** 0.6 * h * (0.8 + 0.3 * Math.sin(t * 9 + i))]); }
    for (let k = 24; k >= 0; k--) { const t = k / 24; pts.push([x + t * w + 18 * Math.sin(t * Math.PI), y + Math.sin(t * Math.PI) ** 0.8 * h * 0.35]); }
    const under = pts.slice(25).map(([a, b]) => [a, b - 1]);
    p.group('sky', boxOf(pts, 6), (c) => {
      fillPts(c, pts, mix(PAPER, '#ffffff', 0.4));
      c.globalAlpha = 0.55; strokeLines(c, [under], SUN, 3); c.globalAlpha = 1;
    }, { t: 1.4 + i * 0.18, d: 1.0, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ================================================================ the mountain
// the base of the cliffs, below the flat top: buttress toes and gullies
const GULLY = [394, 528, 612, 694, 836, 1000, 1108];
const PLATTE = 694; // Platteklip Gorge, the great cleft up the middle
function mountain(p, r) {
  const sil = [...RIDGE, [PR + 10, 1060], [PX - 10, 1060]];
  // the whole massif, in its shadow ink, risen from behind the town
  p.fill('mtn', sil, SHADOW, { t: 1.2, d: 1.4, reveal: 'rise', ease: 'inOut' });

  // the cliffs' foot line: a toe under each buttress, a notch at each gully
  const toes = [];
  for (let i = 0; i < GULLY.length - 1; i++) {
    const a = GULLY[i], b = GULLY[i + 1];
    toes.push({ a, b, y: 780 + r.range(-8, 22) + (Math.abs((a + b) / 2 - 750) / 360) * 24, m: lerp(a, b, r.range(0.4, 0.65)) });
  }
  const foot = [[TOP0 - 16, 790]];
  for (const t of toes) { foot.push([t.a + 4, t.y - 18], [lerp(t.a, t.m, 0.5), t.y - 6], [t.m, t.y], [lerp(t.m, t.b, 0.5), t.y - 8], [t.b - 4, t.y - 16]); }
  foot.push([TOP1 + 22, 690]);

  // the sunlit rock: the cliff band from the flat top down to the toes
  const top = RIDGE.filter(([x]) => x >= TOP0 - 2 && x <= TOP1 + 2);
  const cliff = [...top, [TOP1 + 22, 690], ...foot.slice().reverse()];
  p.fill('mtn', cliff, LIT, { t: 2.2, d: 1.2, reveal: 'fall', ease: 'inOut' });

  // each buttress turns its left side from the sun: a ragged shadow, and a darker gully
  const shades = [], gullies = [];
  toes.forEach((t, i) => {
    const w = t.b - t.a, sx = t.a + w * r.range(0.14, 0.3);
    const yT = ridgeY(t.a) + 2;
    const edge = ragged(r, [sx, yT], [lerp(t.a, t.m, 0.6), t.y - 8], 9, 6);
    shades.push([[t.a, yT], ...edge, [t.a + 4, t.y - 18]]);
    // a second, smaller fold in the buttress
    if (w > 70) { const fx = t.a + w * r.range(0.55, 0.7); shades.push([[fx, yT + r.range(20, 60)], ...ragged(r, [fx + 3, yT + 70], [fx + w * 0.08, t.y - 20], 5, 4), [fx - 4, t.y - 22]]); }
    const gw = (GULLY[i] === PLATTE ? 8 : 3) * r.range(0.8, 1.3);
    gullies.push([[t.a - gw * 0.4, ridgeY(t.a) + 1], [t.a + gw * 0.4, ridgeY(t.a) + 1], [t.a + gw, t.y - 28], [t.a + gw * 1.6, t.y + 40], [t.a - gw * 1.2, t.y + 40], [t.a - gw, t.y - 30]]);
  });
  p.group('mtn', boxOf(cliff, 50), (c) => {
    for (const s of shades) fillPts(c, s, mix(LIT_D, SHADOW, 0.55));
    for (const g of gullies) fillPts(c, g, SHADOW_D);
  }, { t: 2.9, d: 1.1, reveal: 'fall', ease: 'inOut' });

  // the sandstone's beds: broken level lines across the cliffs, and the stone's grain
  const beds = [];
  for (let y = 572; y < 790; y += r.range(9, 17)) {
    let x = TOP0 + r.range(0, 20);
    while (x < TOP1) { const l = r.range(18, 70); if (y < footAt(foot, x) - 6) beds.push([[x, y + r.range(-1, 1)], [Math.min(TOP1, x + l), y + r.range(-1.5, 1.5)]]); x += l + r.range(6, 26); }
  }
  const litGrain = specks(r, cliff, 2600, 2.2);
  const brush = [];
  for (let i = 0; i < 260; i++) {
    const x = r.range(TOP0, TOP1), y0 = ridgeY(x) + r.range(4, 60), l = r.range(14, 60);
    if (y0 + l < footAt(foot, x)) brush.push([[x, y0], [x + r.range(-2, 2), y0 + l]]);
  }
  p.group('mtn', boxOf(cliff, 10), (c) => {
    c.save(); poly(c, cliff); c.clip();
    strokeLines(c, brush, 'rgba(79,76,124,.32)', 1.4);
    strokeLines(c, beds, 'rgba(110,72,70,.38)', 1.6);
    drawSpecks(c, litGrain, LIT_L);
    c.restore();
  }, { t: 3.6, d: 1.0, reveal: 'wipe', ease: 'inOut' });

  // Devil's Peak: its sunlit west face, and Lion's Head: its granite crown in the sun
  const devil = [[226, 528], [238, 536], [256, 552], [282, 574], [312, 594], [336, 600], [350, 680], [330, 760], [300, 840], [262, 760], [240, 640]];
  p.group('mtn', boxOf(devil, 6), (c) => {
    fillPts(c, devil, LIT_D);
  }, { t: 3.2, d: 1.0, reveal: 'fade' });

  // the lower slopes: fynbos in two greens, under the cliffs and down to the town
  const slope = [[PX - 10, 900], ...[[70, 862], [120, 820], [180, 790], [240, 800], [300, 846], [350, 690]], ...foot, [1136, 640], [1160, 700], [1194, 774], [1222, 820], [1250, 840], [1280, 826], [1312, 770], [1332, 726], [1346, 708], [1370, 716], [1396, 706], [1420, 712], [1460, 880], [PR + 10, 900], [PR + 10, 1100], [PX - 10, 1100]];
  const slopeGrain = specks(r, slope, 5200, 2.6, (x, y) => clamp((y - 760) / 260));
  const slopeLight = specks(r, slope, 2600, 2.2, (x, y) => clamp(1 - (y - 760) / 200));
  // the gullies run on down the slopes as dark green seams
  const seams = [];
  toes.forEach((t) => {
    const pts = [[t.a, t.y - 20]];
    let x = t.a, y = t.y - 20;
    while (y < t.y + r.range(90, 170)) { y += r.range(14, 24); x += r.range(-6, 6) + (x - 750) * 0.02; pts.push([x, y]); }
    seams.push(pts);
  });
  // spurs running down from each buttress: lit on the west flank, shaded on the east
  const spurLit = [], spurDark = [];
  toes.forEach((t) => {
    const len = r.range(110, 190), w = (t.b - t.a) * 0.55;
    const tip = [t.m, t.y - 2], foot0 = [t.m - w * 0.6, t.y + len], foot1 = [t.m + w * 0.7, t.y + len * 0.9], mid = [t.m + r.range(-8, 8), t.y + len];
    spurLit.push([tip, ...ragged(r, tip, foot1, 5, 5).slice(1), mid]);
    spurDark.push([tip, mid, ...ragged(r, foot0, tip, 5, 5).slice(0, -1)]);
  });
  p.group('mtn', boxOf(slope, 4), (c) => {
    fillPts(c, slope, FYN);
    for (const q of spurLit) fillPts(c, q, mix(FYN, FYN_L, 0.55));
    for (const q of spurDark) fillPts(c, q, mix(FYN, FYN_D, 0.5));
    drawSpecks(c, slopeGrain, FYN_D);
    drawSpecks(c, slopeLight, FYN_L);
    strokeLines(c, seams, 'rgba(56,80,63,.3)', 2);
  }, { t: 4.0, d: 1.2, reveal: 'fall', ease: 'inOut' });

  // Lion's Head: a cone of fynbos with a dome of bare rock on top, the sun on its west side
  const lion = RIDGE.filter(([x]) => x >= 1250);
  const peak = [...lion, [PR + 10, 920], [1250, 920]];
  const sunSide = [[1400, 630], ...lion.filter(([x]) => x > 1400), [PR + 10, 920], [1372, 920], [1388, 760]];
  const rock = [...lion.filter(([x]) => x >= 1346 && x <= 1436), [1446, 700], [1428, 716], [1404, 708], [1382, 720], [1360, 714], [1342, 704]];
  const rockSun = [[1400, 630], [1414, 636], [1426, 652], [1436, 676], [1446, 700], [1428, 716], [1404, 708], [1396, 680]];
  const lionGrain = specks(r, peak, 1600, 2.4);
  const rockBeds = [[[1346, 668], [1440, 662]], [[1340, 690], [1446, 684]], [[1362, 648], [1428, 645]]];
  p.group('mtn', boxOf(peak, 6), (c) => {
    fillPts(c, peak, mix(FYN_D, SHADOW, 0.35));
    fillPts(c, sunSide, mix(FYN_L, LIT, 0.3));
    drawSpecks(c, lionGrain, 'rgba(56,80,63,.5)');
    fillPts(c, rock, mix(LIT_D, SHADOW, 0.5));
    fillPts(c, rockSun, LIT);
    c.save(); poly(c, rock); c.clip(); strokeLines(c, rockBeds, 'rgba(90,60,70,.45)', 2); c.restore();
  }, { t: 4.3, d: 1.0, reveal: 'rise' });

  // pine woods on the lower slopes: little dark crowns in drifts
  const pines = [];
  const woods = [[180, 930, 160, 50], [420, 900, 220, 46], [700, 930, 260, 40], [980, 890, 180, 52], [1170, 900, 120, 40]];
  for (const [cx, cy, rw, rh] of woods) {
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      pines.push([cx + Math.cos(a) * rw * d, cy + Math.sin(a) * rh * d, r.range(4, 7.5)]);
    }
  }
  pines.sort((a, b) => a[1] - b[1]);
  p.group('mtn', { x: 0, y: 820, w: W, h: 200 }, (c) => {
    for (const [x, y, s] of pines) {
      c.fillStyle = PINE; c.beginPath(); c.ellipse(x, y, s, s * 0.8, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = FYN_L; c.beginPath(); c.ellipse(x + s * 0.3, y - s * 0.3, s * 0.4, s * 0.3, 0, 0, Math.PI * 2); c.fill();
    }
  }, { t: 4.6, d: 1.0, reveal: 'rise' });

  // the cable car's line, from the station on the slope to the top station at the western end
  const [ax, ay] = CABLE[0], [bx, by] = CABLE[1];
  p.group('mtn', { x: ax - 30, y: ay - 30, w: bx - ax + 60, h: by - ay + 60 }, (c) => {
    c.strokeStyle = NAVY; c.lineWidth = 1.4; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
    // the top station on the edge, and the lower one on the slope
    fillPts(c, [[ax - 14, ay + 2], [ax + 10, ay + 2], [ax + 10, ay - 12], [ax - 14, ay - 12]], WALL[0]);
    fillPts(c, [[ax - 16, ay - 12], [ax + 12, ay - 12], [ax + 8, ay - 17], [ax - 12, ay - 17]], NAVY_L);
    fillPts(c, [[bx - 12, by + 4], [bx + 14, by + 4], [bx + 14, by - 10], [bx - 12, by - 10]], WALL[1]);
    fillPts(c, [[bx - 14, by - 10], [bx + 16, by - 10], [bx + 12, by - 15], [bx - 10, by - 15]], BRICK);
  }, { t: 5.0, d: 0.8, reveal: 'fade' });

  // Signal Hill, nearer, its long back running to the sea
  const signal = [[1150, 1060], [1200, 1004], [1260, 962], [1320, 934], [1390, 916], [1460, 906], [1520, 902], [PR + 10, 904], [PR + 10, 1200], [1150, 1200]];
  const sigGrain = specks(r, signal, 1800, 2.4);
  p.group('mtn', boxOf(signal, 4), (c) => {
    fillPts(c, signal, mix(FYN_L, LIT, 0.25));
    drawSpecks(c, sigGrain, FYN);
    c.globalAlpha = 0.5; strokeLines(c, [signal.slice(0, 8)], LIT_L, 3); c.globalAlpha = 1;
  }, { t: 5.4, d: 1.0, reveal: 'rise' });
}
function footAt(foot, x) {
  for (let i = 1; i < foot.length; i++) if (x <= foot[i][0]) { const [x0, y0] = foot[i - 1], [x1, y1] = foot[i]; return lerp(y0, y1, (x - x0) / Math.max(1, x1 - x0)); }
  return 700;
}
const CABLE = [[1100, 562], [1176, 748]];

// ================================================================ the tablecloth
function tablecloth(p, r) {
  // the bank lying along the flat top: heaped puffs, flat where it rests on the rock
  const puffs = [];
  for (let x = TOP0 - 30; x < TOP1 + 30; x += r.range(22, 40)) puffs.push([x, 548 - r.range(0, 14), r.range(16, 32)]);
  const bankBox = { x: TOP0 - 70, y: 470, w: TOP1 - TOP0 + 140, h: 110 };
  const under = [];
  for (let k = 0; k < 4; k++) under.push([[TOP0 - 20 + k * 8, 556 + k * 3.5], [TOP1 + 20 - k * 8, 556 + k * 3.5]]);
  p.group('cloth', bankBox, (c) => {
    c.fillStyle = CLOUD_S;
    for (const [x, y, rr] of puffs) { c.beginPath(); c.arc(x + 3, y + 4, rr, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = CLOUD;
    for (const [x, y, rr] of puffs) { c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill(); }
    c.fillRect(TOP0 - 30, 548, TOP1 - TOP0 + 60, 16);
    c.globalAlpha = 0.6; strokeLines(c, under, CLOUD_S, 2); c.globalAlpha = 1;
  }, { t: 4.4, d: 1.2, reveal: 'wipeL', ease: 'inOut' });

  // the cloth itself: one soft sheet pouring over the whole edge, its hem in lobes, a
  // few long tongues running far down the gullies before they thin to nothing
  const lobes = [];
  for (let x = TOP0 + 10; x < TOP1; x += r.range(50, 90)) lobes.push([x, r.range(30, 60), r.range(26, 40)]);
  for (let i = 0; i < 6; i++) lobes.push([r.range(TOP0 + 40, TOP1 - 40), r.range(80, 140), r.range(12, 18)]);
  const hem = (x) => {
    let d = 26;
    for (const [lx, ld, sg] of lobes) d += ld * Math.exp(-(((x - lx) / sg) ** 2));
    return 556 + Math.min(220, d);
  };
  const segs = 5, span = (TOP1 - TOP0 + 12) / segs;
  for (let sgi = 0; sgi < segs; sgi++) {
    const x0 = TOP0 - 6 + sgi * span, x1 = x0 + span;
    const pts = [];
    for (let x = x0; x <= x1 + 0.1; x += 4) pts.push([x, ridgeY(x) - 2]);
    for (let x = x1; x >= x0 - 0.1; x -= 4) pts.push([x, hem(x)]);
    const inner = [];
    for (let x = x0; x <= x1 + 0.1; x += 4) inner.push([x, ridgeY(x) - 2]);
    for (let x = x1; x >= x0 - 0.1; x -= 4) inner.push([x, 556 + (hem(x) - 556) * 0.5]);
    const streaks = [];
    for (let k = 0; k < span / 9; k++) { const xx = r.range(x0, x1), l = (hem(xx) - 556) * r.range(0.5, 1); streaks.push([[xx, 562], [xx + r.range(-3, 3), 556 + l]]); }
    const deep = Math.max(...pts.map((q) => q[1]));
    p.group('cloth', { x: x0 - 4, y: 540, w: span + 8, h: deep - 530 }, (c) => {
      const gr = c.createLinearGradient(0, 556, 0, 556 + 200);
      gr.addColorStop(0, 'rgba(253,249,239,.9)'); gr.addColorStop(0.3, 'rgba(253,249,239,.55)'); gr.addColorStop(1, 'rgba(253,249,239,0)');
      c.fillStyle = gr; poly(c, pts); c.fill();
      c.fillStyle = 'rgba(253,249,239,.55)'; poly(c, inner); c.fill();
      c.save(); poly(c, pts); c.clip();
      const g2 = c.createLinearGradient(0, 556, 0, 556 + 200);
      g2.addColorStop(0, 'rgba(205,203,226,.75)'); g2.addColorStop(1, 'rgba(205,203,226,0)');
      c.restore();
    }, { t: 5.0 + sgi * 0.22, d: 1.8, reveal: 'fall', ease: 'soft' });
  }
}

// ================================================================ the town at the mountain's foot
function town(p, r) {
  // rows of houses and blocks, back to front, between the slopes and the harbor
  const rows = [];
  for (let k = 0; k < 8; k++) {
    const s = lerp(0.5, 1.0, k / 7), base = lerp(1000, 1158, (k / 7) ** 0.9);
    const items = [];
    let x = PX - 10 + r.range(0, 20);
    const xEnd = 1180 - k * 6;
    while (x < xEnd) {
      const w = r.range(20, 44) * s;
      if (k === 6 && x > 560 && x < 720) { x = 720; continue; }   // City Hall's place
      const tall = r.chance(k < 4 ? 0.14 : 0.08);
      const h = tall ? r.range(70, 130) * s : r.range(22, 40) * s;
      items.push({
        x, w, b: base + r.range(-2, 2), h, s,
        kind: tall ? 'block' : r.chance(0.55) ? 'pitch' : 'flat',
        wall: tall ? r.pick(['#ece3cf', '#dcd5c4', '#e8d6b0', '#cfd3cf']) : r.pick(WALL), roof: r.pick(ROOF), seed: r.int(0, 1e6),
        tree: r.chance(0.12),
      });
      x += w + r.range(-2, 5) * s;
    }
    rows.push({ k, s, base, items });
  }
  rows.forEach(({ k, s, base, items }) => {
    const pts = items.flatMap((it) => [[it.x, it.b], [it.x + it.w, it.b - it.h - 24 * s]]);
    p.group('town', boxOf(pts, 8), (c) => {
      for (const it of items) house(c, it);
    }, { t: 5.6 + k * 0.24, d: 0.9, reveal: 'rise', ease: 'out' });
    // the City Hall, honey stone, its clock tower over the front row
    if (k === 6) cityHall(p, 560, base, s, 5.6 + k * 0.24 + 0.2);
  });
}
function house(c, it) {
  const { x, w, b, h, s } = it;
  const shadeW = shade(it.wall, 0.8);
  if (it.kind === 'block') {
    fillPts(c, [[x, b], [x + w, b], [x + w, b - h], [x, b - h]], it.wall);
    fillPts(c, [[x + w * 0.72, b], [x + w, b], [x + w, b - h], [x + w * 0.72, b - h]], shadeW);
    c.fillStyle = 'rgba(28,39,64,.55)';
    for (let y = b - h + 6 * s; y < b - 8 * s; y += 7 * s) c.fillRect(x + 3 * s, y, w - 6 * s, 2.6 * s);
    fillPts(c, [[x - 1, b - h], [x + w + 1, b - h], [x + w + 1, b - h - 3 * s], [x - 1, b - h - 3 * s]], shade(it.wall, 0.7));
    return;
  }
  fillPts(c, [[x, b], [x + w, b], [x + w, b - h], [x, b - h]], it.wall);
  fillPts(c, [[x + w * 0.8, b], [x + w, b], [x + w, b - h], [x + w * 0.8, b - h]], shadeW);
  if (it.kind === 'pitch') {
    fillPts(c, [[x - 2 * s, b - h], [x + w + 2 * s, b - h], [x + w * 0.62, b - h - w * 0.42], [x + w * 0.38, b - h - w * 0.42]], it.roof);
    fillPts(c, [[x + w * 0.62, b - h - w * 0.42], [x + w + 2 * s, b - h], [x + w * 0.8, b - h]], shade(it.roof, 0.78));
  } else {
    fillPts(c, [[x - 1, b - h], [x + w + 1, b - h], [x + w + 1, b - h - 3.5 * s], [x - 1, b - h - 3.5 * s]], shade(it.wall, 0.72));
  }
  // windows: a row or two of dark panes, a door
  c.fillStyle = 'rgba(28,39,64,.7)';
  const n = Math.max(1, Math.round(w / (11 * s)));
  for (let row = 0; row < (h > 30 * s ? 2 : 1); row++) {
    const y = b - h + 6 * s + row * 13 * s;
    for (let i = 0; i < n; i++) c.fillRect(x + (i + 0.5) * (w / n) - 2.2 * s, y, 4.4 * s, 6 * s);
  }
  if (it.tree) {
    c.fillStyle = PINE; c.beginPath(); c.arc(x + w + 2, b - 9 * s, 9 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = FYN; c.beginPath(); c.arc(x + w + 4, b - 11 * s, 5 * s, 0, Math.PI * 2); c.fill();
  }
}
function cityHall(p, x0, base, s, t) {
  const w = 170 * s, h = 52 * s, tx = x0 + w / 2;
  p.group('town', { x: x0 - 10, y: base - 170 * s, w: w + 20, h: 180 * s }, (c) => {
    const HONEY = '#d9ac6b', HONEY_D = '#b88a52';
    fillPts(c, [[x0, base], [x0 + w, base], [x0 + w, base - h], [x0, base - h]], HONEY);
    fillPts(c, [[x0 + w * 0.82, base], [x0 + w, base], [x0 + w, base - h], [x0 + w * 0.82, base - h]], HONEY_D);
    // the corner pavilions' little domes and the arcade
    for (const px of [x0 + 6 * s, x0 + w - 26 * s]) {
      fillPts(c, [[px, base - h], [px + 20 * s, base - h], [px + 20 * s, base - h - 10 * s], [px, base - h - 10 * s]], HONEY);
      c.fillStyle = '#7fa38f'; c.beginPath(); c.ellipse(px + 10 * s, base - h - 10 * s, 10 * s, 8 * s, 0, Math.PI, 0); c.fill();
    }
    c.fillStyle = 'rgba(28,39,64,.7)';
    for (let i = 0; i < 9; i++) {
      const ax = x0 + 10 * s + i * (w - 20 * s) / 9;
      c.beginPath(); c.moveTo(ax, base); c.lineTo(ax, base - 14 * s); c.arc(ax + 6 * s, base - 14 * s, 6 * s, Math.PI, 0); c.lineTo(ax + 12 * s, base); c.fill();
      c.fillRect(ax + 2 * s, base - 38 * s, 8 * s, 12 * s);
    }
    // the clock tower: three stages, a clock, a little cupola
    const tw = 30 * s, th = 116 * s;
    fillPts(c, [[tx - tw / 2, base - h], [tx + tw / 2, base - h], [tx + tw / 2, base - th], [tx - tw / 2, base - th]], HONEY);
    fillPts(c, [[tx + tw * 0.2, base - h], [tx + tw / 2, base - h], [tx + tw / 2, base - th], [tx + tw * 0.2, base - th]], HONEY_D);
    c.fillStyle = PAPER; c.beginPath(); c.arc(tx, base - th + 18 * s, 8 * s, 0, Math.PI * 2); c.fill();
    c.strokeStyle = NAVY; c.lineWidth = 1.2; c.beginPath(); c.moveTo(tx, base - th + 18 * s); c.lineTo(tx, base - th + 12 * s); c.moveTo(tx, base - th + 18 * s); c.lineTo(tx + 4 * s, base - th + 20 * s); c.stroke();
    c.fillStyle = 'rgba(28,39,64,.7)'; c.fillRect(tx - 5 * s, base - th + 34 * s, 10 * s, 20 * s);
    fillPts(c, [[tx - tw / 2 - 3, base - th], [tx + tw / 2 + 3, base - th], [tx + tw / 2 - 2, base - th - 8 * s], [tx - tw / 2 + 2, base - th - 8 * s]], HONEY_D);
    c.fillStyle = '#7fa38f'; c.beginPath(); c.ellipse(tx, base - th - 8 * s, tw * 0.36, tw * 0.5, 0, Math.PI, 0); c.fill();
    c.strokeStyle = NAVY; c.lineWidth = 1.6; c.beginPath(); c.moveTo(tx, base - th - 8 * s - tw * 0.5); c.lineTo(tx, base - th - 24 * s); c.stroke();
  }, { t, d: 1.0, reveal: 'rise' });
}

// ================================================================ the Bo-Kaap
function bokaap(p, r) {
  // terraces of flat-roofed houses stepping up Signal Hill, street above street,
  // with steep lanes running up between them
  const rows = 6;
  const lanes = [1290, 1462];
  for (let k = rows - 1; k >= 0; k--) {
    const s = lerp(1.0, 0.68, k / (rows - 1));
    const y0 = 1172 - k * 37;
    const baseAt = (x) => y0 - (x - 1150) * 0.09;
    const houses = [];
    let x = 1150 + r.range(-20, 10) - k * 6;
    while (x < PR + 10) {
      const w = r.range(26, 34) * s;
      if (lanes.some((l) => x + w > l - 5 && x < l + 5)) { x = lanes.find((l) => x + w > l - 5 && x < l + 5) + 5; continue; }
      houses.push({ x, w, h: r.range(28, 34) * s, s, col: r.pick(KAAP), two: r.chance(0.2), b: baseAt(x + w / 2) });
      x += w;
    }
    const pts = houses.flatMap((hh) => [[hh.x, hh.b + 4], [hh.x + hh.w, hh.b - hh.h * (hh.two ? 1.5 : 1) - 8]]);
    p.group('kaap', boxOf(pts, 8), (c) => {
      // the street along the terrace's foot, pale and cobbled
      c.fillStyle = '#e6d9bd'; c.beginPath(); c.moveTo(1120, baseAt(1120) - 1); c.lineTo(PR + 10, baseAt(PR + 10) - 1); c.lineTo(PR + 10, baseAt(PR + 10) + 7); c.lineTo(1120, baseAt(1120) + 7); c.fill();
      for (const hh of houses) kaapHouse(c, hh);
    }, { t: 6.4 + (rows - 1 - k) * 0.22, d: 0.8, reveal: 'rise' });
    if (k === 3) minaret(p, 1300, baseAt(1300), s, 6.4 + (rows - 1 - k) * 0.22 + 0.3);
  }
  // the lanes' cobbles, steep and pale
  const cobbles = [];
  for (const l of lanes) for (let y = 960; y < 1170; y += 5) cobbles.push([[l - 3, y], [l + 3, y - 1]]);
  p.strokes('kaap', cobbles, 'rgba(28,39,64,.25)', 1.2, { t: 8.0, d: 0.6, reveal: 'fade' });
}
function kaapHouse(c, hh) {
  const { x, w, s, col, b } = hh;
  const h = hh.two ? hh.h * 1.5 : hh.h;
  fillPts(c, [[x, b], [x + w, b], [x + w, b - h], [x, b - h]], col);
  // the parapet: a molded cap with a little step in the middle
  const cap = shade(col, 0.78);
  fillPts(c, [[x - 1, b - h], [x + w + 1, b - h], [x + w + 1, b - h - 3 * s], [x + w * 0.65, b - h - 3 * s], [x + w * 0.6, b - h - 7 * s], [x + w * 0.4, b - h - 7 * s], [x + w * 0.35, b - h - 3 * s], [x - 1, b - h - 3 * s]], cap);
  fillPts(c, [[x + w * 0.86, b], [x + w, b], [x + w, b - h], [x + w * 0.86, b - h]], shade(col, 0.84));
  // a door between two tall sash windows, each story; a stoep in front
  const ink = 'rgba(28,39,64,.78)';
  c.fillStyle = ink;
  const stories = hh.two ? 2 : 1;
  for (let st = 0; st < stories; st++) {
    const yb = b - st * hh.h * 0.75;
    if (st === 0) c.fillRect(x + w * 0.42, yb - 17 * s, w * 0.16, 17 * s);
    else c.fillRect(x + w * 0.42, yb - 16 * s, w * 0.16, 9 * s);
    c.fillRect(x + w * 0.12, yb - 18 * s, w * 0.18, 10 * s);
    c.fillRect(x + w * 0.7, yb - 18 * s, w * 0.18, 10 * s);
  }
  c.fillStyle = 'rgba(255,255,255,.65)';
  c.fillRect(x + w * 0.12, b - 14 * s, w * 0.18, 1); c.fillRect(x + w * 0.7, b - 14 * s, w * 0.18, 1);
  c.fillStyle = shade(col, 0.6); c.fillRect(x - 1, b - 2.5 * s, w + 2, 2.5 * s);
}
function minaret(p, x, b, s, t) {
  p.group('kaap', { x: x - 20, y: b - 120 * s, w: 40, h: 124 * s }, (c) => {
    const w = 11 * s, h = 92 * s;
    fillPts(c, [[x - w / 2, b], [x + w / 2, b], [x + w / 2, b - h], [x - w / 2, b - h]], '#f6f0e0');
    fillPts(c, [[x + w * 0.1, b], [x + w / 2, b], [x + w / 2, b - h], [x + w * 0.1, b - h]], '#d9d0bc');
    fillPts(c, [[x - w * 0.9, b - h * 0.62], [x + w * 0.9, b - h * 0.62], [x + w * 0.9, b - h * 0.66], [x - w * 0.9, b - h * 0.66]], '#3e8a6a');
    c.fillStyle = '#3e8a6a'; c.beginPath(); c.ellipse(x, b - h, w * 0.7, w * 1.0, 0, Math.PI, 0); c.fill();
    c.strokeStyle = NAVY; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, b - h - w); c.lineTo(x, b - h - w - 10 * s); c.stroke();
    c.fillStyle = 'rgba(28,39,64,.7)'; c.fillRect(x - 1.5 * s, b - h * 0.5, 3 * s, 8 * s);
  }, { t, d: 0.8, reveal: 'rise' });
}

// ================================================================ the bay
const G = new Ground({ cx: 800, hy: 1120, y0: 1700, U: 1400, K: 1 });
function water(p, r) {
  // the water: light far off under the mountain, deep and blue close in
  p.group('water', { x: PX, y: QUAY - 10, w: PR - PX, h: BAND - QUAY + 10 }, (c) => {
    const bands = [SEA_FAR, mix(SEA_FAR, SEA, 0.45), SEA, mix(SEA, SEA_D, 0.5), SEA_D];
    const ys = [QUAY - 4, 1250, 1330, 1450, 1560, BAND];
    bands.forEach((col, i) => { c.fillStyle = col; c.fillRect(PX, ys[i], PR - PX, ys[i + 1] - ys[i] + 1); });
  }, { t: 6.8, d: 1.2, reveal: 'fall', ease: 'inOut' });
  // the grain where the bands meet
  const ys = [1250, 1330, 1450, 1560];
  const cols = [SEA_FAR, mix(SEA_FAR, SEA, 0.45), SEA, mix(SEA, SEA_D, 0.5)];
  ys.forEach((y, i) => {
    const g = specks(r, [[PX, y], [PR, y], [PR, y + 40], [PX, y + 40]], 1600, 2.4, (x, yy) => (1 - (yy - y) / 40) ** 1.5);
    p.group('water', { x: PX, y: y - 2, w: PR - PX, h: 44 }, (c) => drawSpecks(c, g, cols[i]), { t: 7.2 + i * 0.12, d: 0.6, reveal: 'fade' });
  });
  // wave strokes, short and pale far off, longer and darker close in
  const nb = 9;
  for (let b = 0; b < nb; b++) {
    const ya = lerp(QUAY + 8, BAND - 6, (b / nb) ** 1.3), yb = lerp(QUAY + 8, BAND - 6, ((b + 1) / nb) ** 1.3);
    const dark = waveLines(r, G, { y0: ya, y1: yb, x0: PX, x1: PR, density: 0.9 });
    const light = waveLines(r, G, { y0: ya, y1: yb, x0: PX, x1: PR, density: 0.5 });
    p.strokes('water', dark, b < 3 ? 'rgba(42,117,147,.6)' : SEA_D, clamp(0.8 + b * 0.22, 0.8, 2.4), { t: 7.4 + b * 0.14, d: 0.7, reveal: 'wipe' });
    p.strokes('water', light, 'rgba(220,238,238,.75)', clamp(0.7 + b * 0.18, 0.7, 2), { t: 7.5 + b * 0.14, d: 0.7, reveal: 'wipeL' });
  }
}

// ================================================================ the harbor
function harbor(p, r) {
  // the breakwater, with its little lighthouse at the end
  const bw = [[PX - 10, 1222], [560, 1216], [566, 1226], [PX - 10, 1234]];
  p.group('harbor', boxOf([...bw, [560, 1150]], 6), (c) => {
    fillPts(c, bw, STONE);
    fillPts(c, [[PX - 10, 1228], [566, 1222], [566, 1226], [PX - 10, 1234]], STONE_D);
    c.fillStyle = STONE_L; for (let x = 60; x < 556; x += 14) c.fillRect(x, 1218 - (x / 560) * 2, 6, 2);
    // the lighthouse: a white tower, a red lantern
    const lx = 548;
    fillPts(c, [[lx - 7, 1218], [lx + 7, 1218], [lx + 5, 1172], [lx - 5, 1172]], '#f7f1e2');
    fillPts(c, [[lx + 1, 1218], [lx + 7, 1218], [lx + 5, 1172], [lx + 1, 1172]], '#d8d0bf');
    fillPts(c, [[lx - 6, 1172], [lx + 6, 1172], [lx + 6, 1162], [lx - 6, 1162]], CORAL);
    fillPts(c, [[lx - 7, 1162], [lx + 7, 1162], [lx, 1154]], NAVY);
  }, { t: 7.8, d: 0.8, reveal: 'wipe' });

  // the quay, its sheds and warehouses
  const quay = [[PX - 10, QUAY - 6], [1150, QUAY - 6], [1150, QUAY + 8], [PX - 10, QUAY + 8]];
  const sheds = [];
  for (let x = 120; x < 720;) { const w = r.range(70, 120); sheds.push([x, w, r.range(22, 34)]); x += w + r.range(6, 16); }
  p.group('harbor', { x: PX, y: 1120, w: 1110, h: 90 }, (c) => {
    fillPts(c, quay, STONE_L);
    fillPts(c, [[PX - 10, QUAY + 2], [1150, QUAY + 2], [1150, QUAY + 8], [PX - 10, QUAY + 8]], STONE_D);
    for (const [x, w, h] of sheds) {
      fillPts(c, [[x, QUAY - 6], [x + w, QUAY - 6], [x + w, QUAY - 6 - h], [x, QUAY - 6 - h]], BRICK);
      // saw-tooth roofs
      c.fillStyle = BRICK_D; c.beginPath();
      for (let k = 0; k < 4; k++) { const a = x + k * w / 4; c.moveTo(a, QUAY - 6 - h); c.lineTo(a + w / 4, QUAY - 6 - h); c.lineTo(a + w / 4, QUAY - 6 - h - 9); c.closePath(); }
      c.fill();
      c.fillStyle = 'rgba(28,39,64,.6)';
      for (let a = x + 8; a < x + w - 12; a += 18) { c.beginPath(); c.moveTo(a, QUAY - 6); c.lineTo(a, QUAY - 18); c.arc(a + 5, QUAY - 18, 5, Math.PI, 0); c.lineTo(a + 10, QUAY - 6); c.fill(); }
    }
  }, { t: 8.0, d: 0.9, reveal: 'rise' });

  // cranes: red lattice towers with their jibs over the water
  [[170, 1.0, -1], [360, 0.9, 1], [500, 0.8, -1], [790, 0.95, 1]].forEach(([x, s, dir], i) => {
    const b = QUAY - 6, h = 96 * s;
    const lat = [];
    for (let y = b; y > b - h + 8; y -= 9 * s) lat.push([[x - 6 * s, y], [x + 6 * s, y - 9 * s]], [[x + 6 * s, y], [x - 6 * s, y - 9 * s]]);
    const jib = [[x, b - h], [x + dir * 70 * s, b - h + 26 * s]];
    p.group('harbor', { x: x - 90, y: b - h - 30, w: 180, h: h + 34 }, (c) => {
      strokeLines(c, [[[x - 6 * s, b], [x - 6 * s, b - h]], [[x + 6 * s, b], [x + 6 * s, b - h]]], CORAL, 2.2);
      strokeLines(c, lat, CORAL, 1.1);
      fillPts(c, [[x - 12 * s, b - h], [x + 12 * s, b - h], [x + 12 * s, b - h - 16 * s], [x - 12 * s, b - h - 16 * s]], CORAL);
      strokeLines(c, [jib, [[x, b - h - 16 * s], jib[1]]], NAVY, 1.6);
      strokeLines(c, [[jib[1], [jib[1][0], jib[1][1] + 30 * s]]], NAVY, 0.8);
    }, { t: 8.2 + i * 0.15, d: 0.8, reveal: 'rise' });
  });

  // the Clock Tower: red, Gothic, a clock under its pointed roof
  const cx = 860, cb = QUAY - 6;
  p.group('harbor', { x: cx - 30, y: cb - 140, w: 60, h: 144 }, (c) => {
    const w = 24, h = 86;
    fillPts(c, [[cx - w / 2, cb], [cx + w / 2, cb], [cx + w / 2, cb - h], [cx - w / 2, cb - h]], '#b9403a');
    fillPts(c, [[cx + 3, cb], [cx + w / 2, cb], [cx + w / 2, cb - h], [cx + 3, cb - h]], '#8e2f2c');
    fillPts(c, [[cx - w / 2 - 3, cb - h], [cx + w / 2 + 3, cb - h], [cx + w / 2 + 3, cb - h - 5], [cx - w / 2 - 3, cb - h - 5]], '#e9d8b4');
    fillPts(c, [[cx - w / 2 - 2, cb - h - 5], [cx + w / 2 + 2, cb - h - 5], [cx, cb - h - 46]], NAVY_L);
    c.fillStyle = PAPER; c.beginPath(); c.arc(cx, cb - h + 13, 7, 0, Math.PI * 2); c.fill();
    c.strokeStyle = NAVY; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, cb - h + 13); c.lineTo(cx, cb - h + 8); c.moveTo(cx, cb - h + 13); c.lineTo(cx + 4, cb - h + 14); c.stroke();
    c.fillStyle = '#5a1f1f';
    for (const y of [cb - 30, cb - 56]) { c.beginPath(); c.moveTo(cx - 4, y); c.lineTo(cx - 4, y - 10); c.lineTo(cx, y - 15); c.lineTo(cx + 4, y - 10); c.lineTo(cx + 4, y); c.fill(); }
    c.strokeStyle = NAVY; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, cb - h - 46); c.lineTo(cx, cb - h - 56); c.stroke();
  }, { t: 8.5, d: 0.9, reveal: 'rise' });

  // the grain silo: a tall ribbed block of concrete
  const sx = 940, sw = 120, sh = 150;
  p.group('harbor', { x: sx - 6, y: QUAY - sh - 30, w: sw + 12, h: sh + 30 }, (c) => {
    fillPts(c, [[sx, QUAY - 6], [sx + sw, QUAY - 6], [sx + sw, QUAY - sh], [sx, QUAY - sh]], '#dcd6c8');
    fillPts(c, [[sx + sw * 0.75, QUAY - 6], [sx + sw, QUAY - 6], [sx + sw, QUAY - sh], [sx + sw * 0.75, QUAY - sh]], '#b5ae9f');
    c.strokeStyle = 'rgba(28,39,64,.25)'; c.lineWidth = 1.4; c.beginPath();
    for (let x = sx + 8; x < sx + sw; x += 10) { c.moveTo(x, QUAY - 8); c.lineTo(x, QUAY - sh + 18); }
    c.stroke();
    fillPts(c, [[sx + 20, QUAY - sh], [sx + 80, QUAY - sh], [sx + 80, QUAY - sh - 24], [sx + 20, QUAY - sh - 24]], '#cfc8b9');
    c.fillStyle = 'rgba(28,39,64,.6)'; for (let x = sx + 26; x < sx + 76; x += 10) c.fillRect(x, QUAY - sh - 18, 5, 8);
  }, { t: 8.7, d: 0.9, reveal: 'rise' });
}

// ================================================================ the ships
function ships(p, r) {
  // the liner at her berth: black hull, white decks, a buff funnel; no line's colors
  const x0 = 1010, x1 = PR + 40, wl = 1268;
  const hull = [[x0, wl - 62], [x0 + 30, wl], [x1, wl], [x1, wl - 56], [x0 + 40, wl - 58]];
  p.group('ships', { x: x0 - 10, y: wl - 200, w: x1 - x0 + 20, h: 210 }, (c) => {
    fillPts(c, hull, '#22232d');
    fillPts(c, [[x0 + 24, wl - 8], [x1, wl - 8], [x1, wl], [x0 + 30, wl]], CORAL);
    fillPts(c, [[x0 + 2, wl - 60], [x1, wl - 56], [x1, wl - 52], [x0 + 6, wl - 56]], '#f6efe0');
    c.fillStyle = '#f6efe0'; for (let x = x0 + 60; x < x1; x += 16) { c.beginPath(); c.arc(x, wl - 36, 2.2, 0, Math.PI * 2); c.fill(); }
    // decks stepping up
    const decks = [[x0 + 70, x1, 26], [x0 + 110, x1 - 20, 22], [x0 + 170, x1 - 80, 18]];
    let y = wl - 56;
    decks.forEach(([a, b, h], i) => {
      fillPts(c, [[a, y], [b, y], [b, y - h], [a + 6, y - h]], '#f9f4ea');
      fillPts(c, [[a, y], [b, y], [b, y - 3], [a, y - 3]], '#cfc8b7');
      c.fillStyle = 'rgba(28,39,64,.7)'; for (let x = a + 14; x < b - 8; x += 11) c.fillRect(x, y - h + 7, 6, 6);
      y -= h;
      if (i === 0) { c.fillStyle = '#d8d0bd'; for (let x = a + 12; x < b; x += 46) { c.fillRect(x, y - 10, 24, 10); } }
    });
    // the funnel
    const fx = x0 + 260;
    fillPts(c, [[fx, y], [fx + 46, y], [fx + 52, y - 62], [fx + 8, y - 62]], '#e4b45c');
    fillPts(c, [[fx + 6, y - 50], [fx + 51, y - 50], [fx + 52, y - 62], [fx + 8, y - 62]], '#22232d');
    fillPts(c, [[fx + 32, y], [fx + 46, y], [fx + 52, y - 62], [fx + 40, y - 62]], 'rgba(120,80,30,.35)');
    // masts and the line of flags
    strokeLines(c, [[[x0 + 90, wl - 56], [x0 + 96, wl - 190]], [[x1 - 60, wl - 140], [x1 - 56, wl - 200]]], NAVY, 2);
    strokeLines(c, [[[x0 + 4, wl - 62], [x0 + 96, wl - 190], [fx + 20, y - 62], [x1 - 56, wl - 200]]], NAVY, 0.8);
    const flags = [CORAL, SUN, '#3d8fd1', '#f6f0e0', '#93c94a'];
    let k = 0;
    for (const [[ax, ay], [bx, by]] of [[[x0 + 4, wl - 62], [x0 + 96, wl - 190]], [[x0 + 96, wl - 190], [fx + 20, y - 62]], [[fx + 20, y - 62], [x1 - 56, wl - 200]]]) {
      for (let t = 0.08; t < 1; t += 0.1) {
        const fxx = lerp(ax, bx, t), fy = lerp(ay, by, t);
        fillPts(c, [[fxx - 3, fy], [fxx + 3, fy], [fxx, fy + 7]], flags[k++ % flags.length]);
      }
    }
  }, { t: 9.0, d: 1.2, reveal: 'slide', dx: 120, ease: 'out' });
  // her reflection, in broken strokes
  const refl = [];
  for (let y = 1272; y < 1330; y += 4) for (let x = x0 + 30; x < PR; x += r.range(18, 40)) if (r.chance(0.7)) refl.push([[x, y], [x + r.range(8, 26), y]]);
  p.strokes('ships', refl, 'rgba(23,30,42,.55)', 2, { t: 9.6, d: 0.6, reveal: 'fade' });

  // small fishing boats moored by the quay, and yachts out on the bay
  const moored = [[300, 1252, 0.5, '#3d8fd1'], [400, 1258, 0.55, CORAL], [470, 1250, 0.5, SUN], [690, 1256, 0.55, '#4fb6a6']];
  moored.forEach(([x, y, s, col], i) => {
    p.group('ships', { x: x - 50 * s, y: y - 110 * s, w: 100 * s, h: 120 * s }, (c) => smallBoat(c, x, y, s, col), { t: 9.1 + i * 0.12, d: 0.6, reveal: 'drop', dy: 12 });
  });
  [[260, 1360, 0.75], [1330, 1420, 0.9], [610, 1330, 0.55]].forEach(([x, y, s], i) => {
    p.group('ships', { x: x - 40 * s, y: y - 90 * s, w: 80 * s, h: 100 * s }, (c) => sailboat(c, x, y, s, { hull: i === 1 ? CORAL : NAVY, sail: '#fbf6ea', line: NAVY }), { t: 9.4 + i * 0.15, d: 0.7, reveal: 'pop' });
  });
  // the tug, pushing out with a bone in her teeth
  const tx = 860, ty = 1300;
  p.group('ships', { x: tx - 60, y: ty - 60, w: 120, h: 70 }, (c) => {
    fillPts(c, [[tx - 48, ty - 14], [tx + 44, ty - 14], [tx + 34, ty], [tx - 40, ty]], '#22232d');
    fillPts(c, [[tx - 46, ty - 14], [tx + 44, ty - 14], [tx + 42, ty - 10], [tx - 44, ty - 10]], CORAL);
    fillPts(c, [[tx - 20, ty - 14], [tx + 14, ty - 14], [tx + 14, ty - 30], [tx - 20, ty - 30]], '#f6efe0');
    c.fillStyle = 'rgba(28,39,64,.7)'; c.fillRect(tx - 14, ty - 26, 6, 5); c.fillRect(tx - 4, ty - 26, 6, 5); c.fillRect(tx + 6, ty - 26, 5, 5);
    fillPts(c, [[tx - 10, ty - 30], [tx, ty - 30], [tx, ty - 46], [tx - 10, ty - 46]], SUN);
    fillPts(c, [[tx - 10, ty - 42], [tx, ty - 42], [tx, ty - 46], [tx - 10, ty - 46]], '#22232d');
    c.strokeStyle = '#f2f6f2'; c.lineWidth = 2; c.beginPath(); c.moveTo(tx + 38, ty - 2); c.quadraticCurveTo(tx + 60, ty, tx + 66, ty + 6); c.moveTo(tx - 40, ty); c.lineTo(tx - 90, ty + 4); c.stroke();
  }, { t: 9.5, d: 0.7, reveal: 'slide', dx: -60 });
}
function smallBoat(c, x, y, s, col) {
  fillPts(c, [[x - 44 * s, y - 16 * s], [x + 48 * s, y - 22 * s], [x + 36 * s, y], [x - 36 * s, y]], col);
  fillPts(c, [[x - 44 * s, y - 16 * s], [x + 48 * s, y - 22 * s], [x + 47 * s, y - 17 * s], [x - 43 * s, y - 12 * s]], '#f6f0e0');
  fillPts(c, [[x - 16 * s, y - 18 * s], [x + 8 * s, y - 19 * s], [x + 8 * s, y - 38 * s], [x - 16 * s, y - 38 * s]], '#f6f0e0');
  c.fillStyle = 'rgba(28,39,64,.7)'; c.fillRect(x - 12 * s, y - 34 * s, 8 * s, 7 * s);
  strokeLines(c, [[[x + 20 * s, y - 20 * s], [x + 20 * s, y - 100 * s]], [[x + 20 * s, y - 100 * s], [x + 46 * s, y - 22 * s]], [[x + 20 * s, y - 100 * s], [x - 42 * s, y - 16 * s]]], NAVY, 1.2);
}

// ================================================================ the near quay and the fishing boat
function front(p, r) {
  // the granite quay at the left: dressed blocks, a stair down to the water
  const qTop = 1508, qx1 = 430;
  const face = [[PX - 10, qTop], [qx1, qTop], [qx1 + 10, qTop + 6], [qx1 + 10, BAND], [PX - 10, BAND]];
  const blocks = [];
  for (let y = qTop + 22, row = 0; y < BAND; y += 24, row++) {
    blocks.push([[PX - 10, y], [qx1 + 10, y]]);
    for (let x = PX + (row % 2) * 30 - 10; x < qx1; x += 60 + (row % 3) * 4) blocks.push([[x, y], [x, y - 24]]);
  }
  const stoneGrain = specks(r, face, 1800, 2.4);
  p.group('front', boxOf(face, 4), (c) => {
    fillPts(c, face, STONE);
    fillPts(c, [[PX - 10, qTop], [qx1, qTop], [qx1 + 10, qTop + 6], [qx1 + 10, qTop + 22], [PX - 10, qTop + 22]], STONE_L);
    drawSpecks(c, stoneGrain, STONE_D);
    strokeLines(c, blocks, 'rgba(28,39,64,.45)', 1.6);
    // the waterline's dark weed and wet stone
    fillPts(c, [[PX - 10, WL - 12], [qx1 + 10, WL - 12], [qx1 + 10, BAND], [PX - 10, BAND]], '#56655e');
  }, { t: 9.6, d: 0.9, reveal: 'rise' });

  // the boat: a high-bowed wooden fishing boat, sea green with a white strake
  const bx0 = 470, bx1 = 1190;
  const sheer = (t) => [lerp(bx0, bx1, t), lerp(1520, 1418, t ** 2.2) - 10 * Math.sin(t * Math.PI)];
  const top = [], bottom = [];
  for (let k = 0; k <= 30; k++) top.push(sheer(k / 30));
  for (let k = 30; k >= 0; k--) { const t = k / 30; bottom.push([lerp(bx0 + 22, bx1 - 70, t) + (t > 0.9 ? (t - 0.9) * 600 : 0), WL - 4 * Math.sin(t * Math.PI)]); }
  const hull = [...top, [bx1 + 4, 1424], ...bottom];
  const strake = [...top, ...top.slice().reverse().map(([x, y]) => [x, y + 16])];
  const planks = [];
  for (let k = 1; k < 6; k++) { const L = []; for (let i = 0; i <= 30; i++) { const t = i / 30, [x, y] = sheer(t); L.push([x, lerp(y + 16, WL, k / 6)]); } planks.push(L); }
  p.group('front', boxOf([...hull, [bx0, 1200]], 10), (c) => {
    fillPts(c, hull, '#2f9a93');
    c.save(); poly(c, hull); c.clip();
    strokeLines(c, planks, 'rgba(18,60,64,.45)', 1.6);
    fillPts(c, [[bx0, 1640], [bx1 + 10, 1640], [bx1 + 10, WL - 14], [bx0, WL - 14]], CORAL);
    fillPts(c, [[bx0, 1640], [bx0 + 220, 1640], [bx0 + 260, WL - 40], [bx0 + 120, 1500], [bx0, 1500]], 'rgba(15,40,50,.28)');
    c.restore();
    fillPts(c, strake, '#f6f0e0');
    strokeLines(c, [top], NAVY, 2.4);
    // the number on her bow, a fisherman's registration
    c.font = `400 34px ${FONT}`; c.fillStyle = NAVY; c.textAlign = 'center'; c.fillText('CTA 24', 1060, 1484); c.textAlign = 'left';
  }, { t: 9.9, d: 1.0, reveal: 'rise', ease: 'out' });

  // her wheelhouse, mast and gear
  p.group('front', { x: bx0, y: 1140, w: bx1 - bx0 + 20, h: 400 }, (c) => {
    const wx = 560, wb = sheer(0.13)[1] + 2;
    fillPts(c, [[wx, wb], [wx + 120, wb - 4], [wx + 116, wb - 92], [wx + 4, wb - 92]], '#f6f0e0');
    fillPts(c, [[wx + 84, wb - 3], [wx + 120, wb - 4], [wx + 116, wb - 92], [wx + 82, wb - 92]], '#d6cdb8');
    fillPts(c, [[wx - 8, wb - 92], [wx + 128, wb - 92], [wx + 122, wb - 106], [wx - 2, wb - 106]], CORAL);
    c.fillStyle = NAVY_L; for (const x of [wx + 12, wx + 44]) c.fillRect(x, wb - 78, 24, 26);
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(wx + 14, wb - 76, 5, 22); c.fillRect(wx + 46, wb - 76, 5, 22);
    c.fillStyle = NAVY; c.fillRect(wx + 88, wb - 70, 18, 66);
    // a stovepipe
    fillPts(c, [[wx + 20, wb - 106], [wx + 30, wb - 106], [wx + 30, wb - 136], [wx + 20, wb - 136]], '#22232d');
    // mast, boom, furled sail, stays
    const mx = 800, mb = sheer(0.45)[1];
    strokeLines(c, [[[mx, mb], [mx + 6, 1160]]], '#7a5a3a', 7);
    strokeLines(c, [[[mx + 2, mb - 70], [bx0 + 40, mb - 20]]], '#7a5a3a', 5);
    fillPts(c, [[mx - 2, mb - 74], [bx0 + 60, mb - 30], [bx0 + 70, mb - 18], [mx, mb - 62]], '#b5523a');
    strokeLines(c, [[[mx + 6, 1160], [bx1 - 6, 1420]], [[mx + 6, 1160], [bx0 + 10, 1500]], [[mx + 6, 1200], [mx + 70, 1408]]], NAVY, 1.4);
    // nets heaped amidships, crates of fish on the deck
    const nb = sheer(0.62)[1];
    c.fillStyle = '#c9783a'; c.beginPath(); c.ellipse(940, nb - 10, 70, 24, -0.06, Math.PI, 0); c.fill();
    c.save(); c.beginPath(); c.ellipse(940, nb - 10, 70, 24, -0.06, Math.PI, 0); c.clip();
    c.strokeStyle = 'rgba(80,40,20,.55)'; c.lineWidth = 1; c.beginPath();
    for (let x = 860; x < 1020; x += 7) { c.moveTo(x, nb - 40); c.lineTo(x + 30, nb); c.moveTo(x + 30, nb - 40); c.lineTo(x, nb); }
    c.stroke(); c.restore();
    for (const [x, y] of [[680, sheer(0.3)[1]], [712, sheer(0.34)[1] - 2]]) {
      fillPts(c, [[x, y], [x + 30, y], [x + 30, y - 16], [x, y - 16]], '#c89a5a');
      c.fillStyle = '#cfd8dc'; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x + 5 + k * 7, y - 17, 4, 2, 0.3, 0, Math.PI * 2); c.fill(); }
    }
  }, { t: 10.3, d: 1.0, reveal: 'rise' });

  // the fisherman on the quay, a bollard and its rope, crates
  p.group('front', { x: 200, y: 1380, w: 320, h: 140 }, (c) => {
    // the bollard
    fillPts(c, [[352, qTop], [384, qTop], [380, qTop - 26], [390, qTop - 34], [346, qTop - 34], [356, qTop - 26]], '#22232d');
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(358, qTop - 30, 4, 26);
    // the rope out to her stern
    strokeLines(c, [[[372, qTop - 22], [420, qTop - 6], [478, 1514]]], '#d9c59a', 3);
    // the fisherman: oilskins and a cap, hauling on the line
    const fx = 286;
    fillPts(c, [[fx - 12, qTop], [fx - 4, qTop], [fx - 2, qTop - 40], [fx - 14, qTop - 40]], NAVY);
    fillPts(c, [[fx + 2, qTop], [fx + 10, qTop], [fx + 8, qTop - 40], [fx - 2, qTop - 40]], NAVY);
    fillPts(c, [[fx - 18, qTop - 38], [fx + 14, qTop - 38], [fx + 10, qTop - 84], [fx - 14, qTop - 84]], SUN);
    fillPts(c, [[fx + 8, qTop - 78], [fx + 54, qTop - 44], [fx + 50, qTop - 38], [fx + 4, qTop - 66]], SUN);
    c.fillStyle = '#c68b62'; c.beginPath(); c.arc(fx - 1, qTop - 94, 10, 0, Math.PI * 2); c.fill();
    fillPts(c, [[fx - 13, qTop - 98], [fx + 13, qTop - 98], [fx + 9, qTop - 108], [fx - 9, qTop - 108]], NAVY);
    // crates and a basket
    fillPts(c, [[214, qTop], [262, qTop], [262, qTop - 30], [214, qTop - 30]], '#c89a5a');
    strokeLines(c, [[[214, qTop - 15], [262, qTop - 15]]], 'rgba(80,50,20,.6)', 1.4);
    fillPts(c, [[226, qTop - 30], [258, qTop - 30], [258, qTop - 52], [226, qTop - 52]], '#b5874c');
  }, { t: 10.6, d: 0.8, reveal: 'rise' });

  // the boat's reflection, broken by the swell
  const refl = [];
  for (let y = WL + 4; y < BAND - 2; y += 5) {
    for (let x = bx0 + 20; x < bx1; x += r.range(16, 40)) if (r.chance(0.75 - (y - WL) / 160)) refl.push([[x, y], [x + r.range(10, 32), y]]);
  }
  p.strokes('front', refl, 'rgba(47,154,147,.75)', 3, { t: 10.8, d: 0.6, reveal: 'fade' });
}

// ================================================================ the band and the name
function band(p) {
  p.group('band', { x: PX, y: BAND - 4, w: PR - PX, h: PB - BAND + 8 }, (c) => {
    c.fillStyle = NAVY; c.fillRect(PX, BAND, PR - PX, PB - BAND);
    c.fillStyle = SUN; c.fillRect(PX, BAND, PR - PX, 5);
    c.fillStyle = CORAL; c.fillRect(PX, BAND + 9, PR - PX, 2);
  }, { t: 10.2, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  // the name, sunlit letters with a coral shade
  p.type('band', 'CAPE TOWN', W / 2, 1930, { family: FONT, size: 282, color: PAPER, shadow: CORAL, sx: 7, sy: 7, track: 0.05, align: 'center', t: 10.9, gap: 0.14, d: 0.8, fit: 1240 });
  // the small lines either side of it
  const small = { family: FONT, size: 34, color: SUN, track: 0.22, gap: 0.03, d: 0.5, reveal: 'fade' };
  p.type('band', 'SOUTH AFRICA', W / 2, 1728, { ...small, align: 'center', t: 12.3 });
  p.group('band', { x: PX, y: 1700, w: PR - PX, h: 40 }, (c) => {
    c.fillStyle = SUN; c.fillRect(300, 1716, 330, 2); c.fillRect(W - 630, 1716, 330, 2);
  }, { t: 12.4, d: 0.8, reveal: 'fade' });
  // the margin's keyline
  p.pen('band', [[PX, PY], [PR, PY], [PR, PB], [PX, PB], [PX, PY]], NAVY, 3, { t: 12.6, d: 1.0, cap: 'square' });
}

// ================================================================ the things that move
function life(p, r) {
  // gulls wheeling over the harbor
  const gulls = Array.from({ length: 7 }, () => ({ x: r.range(200, 1400), y: r.range(1000, 1380), rx: r.range(40, 110), ry: r.range(10, 30), sp: r.range(0.25, 0.5), ph: r() * 6.28, s: r.range(1.1, 2.0) }));
  p.live('live', {
    t: 9.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = PAPER; c.lineCap = 'round';
      for (const gl of gulls) {
        const a = gl.ph + time * gl.sp, x = gl.x + Math.cos(a) * gl.rx, y = gl.y + Math.sin(a * 1.3) * gl.ry;
        const f = Math.sin(time * 7 + gl.ph) * 0.5 + 0.5, w = 10 * gl.s, h = (2 + f * 4) * gl.s;
        c.lineWidth = 2.2 * gl.s * 0.7; c.beginPath();
        c.moveTo(x - w, y - h * 0.2); c.quadraticCurveTo(x - w * 0.5, y - h * 1.3, x, y); c.quadraticCurveTo(x + w * 0.5, y - h * 1.3, x + w, y - h * 0.2); c.stroke();
      }
    },
  });
  // the cable car climbing and coming down, and the tug's smoke
  const [ax, ay] = CABLE[0], [bx, by] = CABLE[1];
  p.live('live', {
    t: 7.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const k = 0.5 - 0.5 * Math.cos(time * 0.35);
      const x = lerp(bx, ax, k), y = lerp(by, ay, k);
      c.strokeStyle = NAVY; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 6); c.stroke();
      c.fillStyle = CORAL; c.fillRect(x - 5, y + 6, 10, 8);
      c.fillStyle = PAPER; c.fillRect(x - 3, y + 8, 6, 3);
      // smoke from the tug's funnel, puffs drifting off and thinning
      for (let i = 0; i < 4; i++) {
        const age = (time * 0.5 + i / 4) % 1;
        c.globalAlpha = 0.7 * (1 - age);
        c.fillStyle = '#e8e2d6'; c.beginPath(); c.arc(855 - age * 70, 1246 - age * 60, 5 + age * 14, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
    },
  });
  // glints on the water close in, coming and going
  const glints = Array.from({ length: 26 }, () => [r.range(PX + 20, PR - 20), r.range(1380, BAND - 10), r.range(8, 22), r() * 6.28]);
  p.live('live', {
    t: 8.4, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = '#fbf3da'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();
      for (const [x, y, l, ph] of glints) {
        const v = Math.sin(time * 1.6 + ph);
        if (v < 0.35) continue;
        const ll = l * (v - 0.35) / 0.65;
        c.moveTo(x - ll / 2, y); c.lineTo(x + ll / 2, y);
      }
      c.stroke();
    },
  });
}
