// Auckland: a 1930s New Zealand tourism poster, printed by lithograph in soft
// sprayed inks with no outlines. We stand on the rim of Maungawhau / Mount Eden
// and look north: the crater's untouched grassy bowl at our feet,
// the suburbs' wooden villas among trees, the city with the Sky Tower over its
// towers, the Ferry Building and a liner at the wharf, the Museum on the Domain,
// the Harbour Bridge to the North Shore's cones, sails on the Waitematā and
// Rangitoto's long low cone beyond. A cabbage tree and a pōhutukawa in crimson
// bloom stand in front; the name is set in the sky.

import { Plate, W, H } from '../print.js';
import { mix, shade, poly, rng, lerp } from '../kit.js';

// the inks
const PAPER = '#f2e9d3', INK = '#24304a', CRIMSON = '#c3262f', CRIMSON_L = '#e65a4d', STAMEN = '#f6c0a0';
const SKY1 = '#78afbb', SKY2 = '#bcd8d0', SKY3 = '#f3e4bd', SKY4 = '#f5d3a6';
const CLOUD = '#fbf3e1', CLOUD_S = '#ebc6a6', CLOUD_B = '#c7d7d6';
const RANGI = '#7b80ad', RANGI_L = '#a3a4c8', RANGI_D = '#62689a', GULF = '#b4d0cf';
const SEA = '#3f7ea2', SEA_L = '#76aac2', SEA_D = '#2b5f86';
const LAND_F = '#a2b47e', LAND = '#7d9e5e', LAND_D = '#4c7448', GRASS = '#86a85a', GRASS_L = '#b9c77e', GRASS_D = '#4f7a40', GRASS_DD = '#38603a';
const STONE = '#ece0c4', STONE_S = '#b8aec0', STONE_D = '#8f8ca8', SAND = '#e4bc8a', BRICK = '#b0634a';
const ROOFS = ['#b5493b', '#c76a4a', '#5f826a', '#8d6a5a', '#a64a46', '#6f7f8f'];
const WALLS = ['#f4ead3', '#efe1c0', '#e8d7b5', '#f6efdf', '#e3d2b0'];
const POHU = '#2b4a37', POHU_M = '#3d6347', POHU_L = '#5c8159', BARK = '#5a4537', BARK_L = '#8a6a50';

export const city = {
  id: 'auckland', name: 'Auckland', wall: '#1f3a44',
  alt: 'A 1930s lithograph tourism poster seen from the rim of Mount Eden: the crater’s untouched grassy bowl, a couple looking out from the rim, wooden villas among trees, the Sky Tower over the city’s towers, the Ferry Building and a liner at the wharf, the Auckland War Memorial Museum on the Domain, the Harbour Bridge to the North Shore, sailboats and a ferry on the harbor and Rangitoto’s long low cone beyond, with a cabbage tree and a pōhutukawa in crimson bloom in front, under the title AUCKLAND',
  google: 'family=Bevan',
  fonts: [['400 220px "Bevan"', 'AUCKLAND'], ['400 40px "Bevan"', 'NEW ZEALAND THE CITY OF SAILS']],
  build,
};

const FACE = '"Bevan", serif';
const M = 44; // the cream margin round the picture
const HZ = 770; // the horizon over the gulf
const SHORE = 990; // the city's waterfront
// the crater's rim and its floor, as ellipses
const RIM = { x: 790, y: 1620, rx: 610, ry: 320 };
const FLOOR = { x: 800, y: 1676, rx: 160, ry: 50 };

function build() {
  const p = new Plate({ paper: PAPER, seed: 1936 });
  const r = p.r;
  p.clip = { x: M, y: M, w: W - 2 * M, h: H - 2 * M };
  p.stack('sky', 'clouds', 'gulf', 'harbor', 'boats', 'shore', 'city', 'tower', 'suburbs', 'cone', 'crater', 'front', 'tree', 'title', 'air', 'frame');
  p.layer('frame', { clip: false });
  frame(p);
  sky(p, r);
  clouds(p, r);
  gulf(p, r);
  harbor(p, r);
  northShore(p, r);
  bridge(p, r);
  downtown(p, r);
  skyTower(p);
  suburbs(p, r);
  cone(p, r);
  crater(p, r);
  front(p, r);
  cabbageTree(p, r);
  pohutukawa(p, r);
  life(p, r);
  title(p);
  return p;
}

// ---------------------------------------------------------------- helpers
// sprayed ink: dots scattered where a density function says, drawn as tiny squares
function spray(r, x0, y0, x1, y1, n, dens, size = 2.2) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = r.range(x0, x1), y = r.range(y0, y1);
    if (r() < dens(x, y)) out.push(x, y, size * r.range(0.6, 1.3));
  }
  return out;
}
function dots(c, list, color) {
  c.fillStyle = color; c.beginPath();
  for (let i = 0; i < list.length; i += 3) c.rect(list[i], list[i + 1], list[i + 2], list[i + 2]);
  c.fill();
}
function ell(c, e, grow = 0) { c.beginPath(); c.ellipse(e.x, e.y, e.rx + grow, e.ry + grow, 0, 0, Math.PI * 2); }
const inEll = (e, x, y) => ((x - e.x) / e.rx) ** 2 + ((y - e.y) / e.ry) ** 2 < 1;
// a smooth closed blob for puffs of leaves and cloud
function blob(c, x, y, rx, ry) { c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }

// ---------------------------------------------------------------- the sheet's edge
function frame(p) {
  // a paper margin, and a fine ink rule round the picture
  p.group('frame', { x: 0, y: 0, w: W, h: H }, (c) => {
    c.strokeStyle = INK; c.lineWidth = 3;
    c.strokeRect(M - 10, M - 10, W - 2 * M + 20, H - 2 * M + 20);
  }, { t: 0.0, d: 0.8, reveal: 'fade' });
}

// ---------------------------------------------------------------- the sky
function sky(p, r) {
  p.group('sky', { x: 0, y: 0, w: W, h: HZ + 20 }, (c) => {
    const g = c.createLinearGradient(0, M, 0, HZ);
    g.addColorStop(0, SKY1); g.addColorStop(0.42, SKY2); g.addColorStop(0.78, SKY3); g.addColorStop(1, SKY4);
    c.fillStyle = g; c.fillRect(0, 0, W, HZ + 10);
  }, { t: 0.2, d: 1.3, reveal: 'fall', ease: 'inOut' });
  // the lithographer's crayon: a grain of darker blue that thins out downward
  const sp = spray(rng(11), M, M, W - M, 560, 16000, (x, y) => 0.55 * (1 - (y - M) / 520) ** 1.6, 2.4);
  const sp2 = spray(rng(12), M, 420, W - M, HZ, 9000, (x, y) => 0.4 * ((y - 420) / 350) ** 2, 2.2);
  p.group('sky', { x: 0, y: 0, w: W, h: HZ + 10 }, (c) => { dots(c, sp, shade(SKY1, 0.9)); dots(c, sp2, '#f0c08e'); }, { t: 1.0, d: 1.0, reveal: 'fall', ease: 'inOut' });
}
// long banks of fair-weather cloud with flat, peach-shaded feet
const CLOUDS = [[330, 560, 460, 74, 1.5], [1240, 520, 420, 64, 1.75], [800, 650, 320, 44, 2.0], [1460, 680, 220, 34, 2.2], [190, 700, 260, 36, 2.35]];
function clouds(p, r) {
  for (const [x, y, w, h, t] of CLOUDS) {
    const rr = rng(x + y), n = Math.round(w / (h * 0.9)), puffs = [];
    for (let k = 0; k < n; k++) { const u = (k + 0.5) / n; puffs.push([x - w / 2 + u * w, y - Math.sin(u * Math.PI) * h * 0.55 - rr.range(0, h * 0.2), (w / n) * rr.range(0.6, 0.85) * (0.75 + 0.45 * Math.sin(u * Math.PI))]); }
    const sp = spray(rr, x - w / 2 - 20, y - h * 1.6, x + w / 2 + 20, y + 4, 900, (xx, yy) => 0.7 * ((yy - (y - h * 1.6)) / (h * 1.6)) ** 2, 2);
    p.group('clouds', { x: x - w / 2 - 60, y: y - h * 1.8, w: w + 120, h: h * 1.8 + 30 }, (c) => {
      c.save(); c.beginPath(); c.rect(x - w, y - h * 3, w * 2, h * 3); c.clip();
      c.fillStyle = CLOUD; c.beginPath(); for (const [px, py, pr] of puffs) blob(c, px, py, pr, pr * 0.8); c.fill();
      c.beginPath(); for (const [px, py, pr] of puffs) blob(c, px, py, pr, pr * 0.8); c.clip();
      dots(c, sp, CLOUD_S);
      c.restore();
      // the flat foot, in two thin streaks
      c.fillStyle = CLOUD; c.fillRect(x - w / 2 - 30, y - 6, w + 60, 7);
      c.fillStyle = CLOUD_B; c.fillRect(x - w / 2 - 10, y + 4, w + 20, 4);
    }, { t, d: 1.2, reveal: 'slide', dx: 60, ease: 'out' });
  }
}

// ---------------------------------------------------------------- the gulf and Rangitoto
function rangiY(x) {
  // Rangitoto: a broad shield rising evenly from the water to a small summit cone
  const cx = 1170, hw = 540, t = Math.abs(x - cx) / hw;
  if (t >= 1) return HZ;
  const shield = 66 * (1 - t) ** 1.35 * (1 - 0.25 * Math.max(0, 1 - t / 0.2) ** 2), cap = 12 * Math.max(0, 1 - (t / 0.09) ** 2);
  return HZ - shield - cap - 2 * Math.sin(x / 13) * (1 - t);
}
function gulf(p, r) {
  // the far water of the gulf, pale, and the islands beyond
  p.group('gulf', { x: 0, y: HZ - 50, w: W, h: 120 }, (c) => {
    c.fillStyle = GULF; c.fillRect(0, HZ - 2, W, 70);
    // the low far islands
    c.fillStyle = mix(RANGI_L, SKY3, 0.5);
    poly(c, [[M, HZ], [M, HZ - 12], [160, HZ - 16], [300, HZ - 8], [380, HZ]]); c.fill();
    poly(c, [[1480, HZ], [1520, HZ - 22], [1600, HZ - 26], [1600, HZ]]); c.fill();
  }, { t: 2.3, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  const prof = [[620, HZ + 1]];
  for (let x = 620; x <= 1600; x += 6) prof.push([x, rangiY(x)]);
  prof.push([1600, HZ + 1]);
  const lit = [[620, HZ + 1]];
  for (let x = 630; x <= 1170; x += 6) lit.push([x, rangiY(x)]);
  lit.push([1300, HZ + 1]);
  const bush = spray(rng(21), 620, HZ - 110, 1590, HZ, 4200, (x, y) => (y > rangiY(x) + 3 ? 0.55 : 0), 2.2);
  p.group('gulf', { x: 600, y: HZ - 120, w: 1010, h: 130 }, (c) => {
    c.fillStyle = RANGI; poly(c, prof); c.fill();
    c.fillStyle = RANGI_L; poly(c, lit); c.fill();
    dots(c, bush, RANGI_D);
    // the lava's dark edge at the water
    c.fillStyle = RANGI_D; c.fillRect(640, HZ - 3, 940, 4);
  }, { t: 2.6, d: 1.3, reveal: 'rise', ease: 'out' });
}

// ---------------------------------------------------------------- the harbor
function harbor(p, r) {
  p.group('harbor', { x: 0, y: HZ, w: W, h: SHORE - HZ + 30 }, (c) => {
    const g = c.createLinearGradient(0, HZ + 10, 0, SHORE + 20);
    g.addColorStop(0, SEA_L); g.addColorStop(0.5, SEA); g.addColorStop(1, SEA_D);
    c.fillStyle = g; c.fillRect(0, HZ + 12, W, SHORE - HZ + 20);
    c.fillStyle = GULF; c.fillRect(0, HZ + 2, W, 12);
  }, { t: 3.0, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // the wind's ripples: short pale dashes, finer toward the horizon
  const rip = [];
  const rr = rng(31);
  for (let y = HZ + 18; y < SHORE + 10; y += 5 + (y - HZ) * 0.03) {
    const n = 10 + Math.round((y - HZ) * 0.05);
    for (let i = 0; i < n; i++) { const x = rr.range(M, W - M), L = 6 + (y - HZ) * rr.range(0.05, 0.14); rip.push([[x, y], [x + L, y]]); }
  }
  p.strokes('harbor', rip, SEA_L, 1.8, { t: 3.5, d: 1.2, reveal: 'wipe', ease: 'inOut', box: { x: 0, y: HZ, w: W, h: SHORE - HZ + 30 } });
}
function northShore(p, r) {
  // the North Shore: a low green shore with two small volcanic cones
  const top = [[M - 10, 812]];
  for (let x = M; x <= 760; x += 10) {
    let y = 808 + Math.sin(x / 47) * 3 + (x / 760) * 14;
    y -= 34 * Math.exp(-(((x - 430) / 46) ** 2)); // Takarunga
    y -= 22 * Math.exp(-(((x - 660) / 34) ** 2)); // Maungauika
    top.push([x, y]);
  }
  top.push([780, 838], [760, 846], [M - 10, 846]);
  const rr = rng(41), houses = [];
  for (let i = 0; i < 260; i++) { const x = rr.range(M, 740), y = rr.range(818, 842); if (Math.abs(x - 430) < 40 || Math.abs(x - 660) < 30) continue; houses.push([x, y, rr.pick(['#f4ead3', '#e9d6b4', '#c56a52', '#d8c3a0'])]); }
  p.group('shore', { x: 0, y: 760, w: 800, h: 100 }, (c) => {
    c.fillStyle = LAND_F; poly(c, top); c.fill();
    c.fillStyle = mix(LAND_F, LAND, 0.5);
    for (const [cx, w] of [[430, 46], [660, 34]]) { c.beginPath(); c.ellipse(cx + w * 0.3, 830, w * 0.8, 26, 0, Math.PI, 0); c.fill(); }
    for (const [x, y, col] of houses) { c.fillStyle = col; c.fillRect(x, y, 4, 3); }
    c.fillStyle = shade(SEA_D, 1.1); c.fillRect(M, 845, 740, 3);
  }, { t: 3.4, d: 0.9, reveal: 'rise', ease: 'out' });
}
function bridge(p, r) {
  // the Harbour Bridge: low girder spans on piers, and over the shipping channel
  // the raised steel truss that is its one hump
  const x0 = M - 10, y0 = 942, x1 = 600, y1 = 846;
  const at = (x) => y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  const hump = (x) => (x > 220 && x < 400 ? 26 * Math.sin(((x - 220) / 180) * Math.PI) ** 0.8 : 0);
  p.group('shore', { x: x0 - 10, y: 800, w: x1 - x0 + 30, h: 170 }, (c) => {
    // piers
    c.fillStyle = '#58707a';
    for (let x = 70; x < x1; x += x < 220 || x > 400 ? 34 : 90) { const y = at(x); c.fillRect(x - 2, y, 4, 950 - y + (x < 300 ? 10 : 0) - (x > 400 ? (x - 400) * 0.05 : 0)); }
    // the deck
    c.strokeStyle = '#4c6670'; c.lineWidth = 5; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    // the truss: a top chord over the deck, laced with diagonals
    c.lineWidth = 2.2; c.strokeStyle = '#5d7882';
    c.beginPath();
    for (let x = 200; x <= 420; x += 4) { const y = at(x) - 8 - hump(x); x === 200 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
    c.lineWidth = 1.2; c.beginPath();
    for (let x = 204, k = 0; x < 416; x += 11, k++) { const a = at(x) - 2, b = at(x + 11) - 8 - hump(x + 11); c.moveTo(x, a); c.lineTo(x + 11, b); c.moveTo(x + 11, at(x + 11) - 2); c.lineTo(x + 11, b); }
    c.stroke();
    // a light catching its top
    c.strokeStyle = '#b9cdd0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, y0 - 3); c.lineTo(x1, y1 - 3); c.stroke();
  }, { t: 3.8, d: 1.4, reveal: 'wipeL', ease: 'inOut' });
}

// ---------------------------------------------------------------- the city
function downtown(p, r) {
  // the isthmus: green land from the waterfront down, the bays cut in
  const edge = [[M - 10, 958], [160, 962], [260, 978], [380, 986], [520, 992], [700, SHORE], [980, SHORE + 2], [1120, 994], [1220, 984], [1330, 990], [1460, 1000], [W, 996], [W, H], [0, H]];
  const grain = spray(rng(51), M, 960, W - M, 1340, 9000, () => 0.5, 2.2);
  p.group('city', { x: 0, y: 940, w: W, h: 420 }, (c) => {
    const g = c.createLinearGradient(0, 960, 0, 1340);
    g.addColorStop(0, LAND_F); g.addColorStop(1, LAND);
    c.fillStyle = g; poly(c, edge); c.fill();
    c.save(); poly(c, edge); c.clip(); dots(c, grain, shade(LAND, 0.88)); c.restore();
    // the sea wall and the wharves reaching into the harbor
    c.fillStyle = STONE; c.fillRect(560, SHORE - 3, 640, 5);
    c.fillStyle = '#d8ccb0';
    for (const [x, L] of [[760, 26], [880, 22], [1060, 34], [1140, 20]]) poly(c, [[x, SHORE], [x + 4, SHORE - L], [x + 22, SHORE - L], [x + 26, SHORE]]);
    c.fill();
  }, { t: 4.1, d: 1.0, reveal: 'wipe', ease: 'inOut' });

  // the towers: stone-colored blocks lit from the west, their east faces in violet shade
  const rr = rng(61), towers = [];
  const spots = [[600, 30, 70], [640, 34, 110], [690, 40, 150], [728, 30, 120], [760, 44, 210], [810, 36, 170], [850, 30, 240], [944, 46, 260], [992, 34, 190], [1028, 40, 230], [1074, 30, 150], [1110, 36, 120], [1150, 32, 90], [1190, 40, 70],
    [620, 46, 60], [700, 50, 80], [780, 38, 96], [880, 50, 120], [960, 52, 100], [1040, 44, 84], [1120, 52, 60], [1230, 46, 44], [560, 40, 44]];
  for (const [x, w, h] of spots) {
    const base = 1052 + rr.range(-4, 6);
    towers.push({ x, w, h, base, col: rr.pick([STONE, '#e7d4b0', '#d9dccf', '#efe3c9', '#e3c7a2', '#c9d2cf']), cap: rr.chance(0.4), step: rr.chance(0.35) });
  }
  towers.sort((a, b) => a.base - a.h - (b.base - b.h)); // tall ones first, so the low ones stand in front
  const drawTower = (c, o) => {
    const { x, w, h, base, col } = o, top = base - h;
    c.fillStyle = col; c.fillRect(x - w / 2, top, w, h);
    if (o.step) { c.fillRect(x - w * 0.32, top - 14, w * 0.64, 14); c.fillStyle = shade(col, 0.78); c.fillRect(x + w * 0.12, top - 14, w * 0.2, 14); }
    c.fillStyle = mix(col, STONE_S, 0.75); c.fillRect(x + w * 0.18, top, w * 0.32, h);
    // the window bands, faint, as a lithographer would suggest them
    c.fillStyle = mix(col, INK, 0.28);
    for (let y = top + 7; y < base - 6; y += 7) c.fillRect(x - w / 2 + 3, y, w * 0.66 - 3, 2);
    c.fillStyle = mix(col, INK, 0.42);
    for (let y = top + 7; y < base - 6; y += 7) c.fillRect(x + w * 0.2, y, w * 0.26, 2);
    if (o.cap) { c.fillStyle = shade(col, 0.7); c.fillRect(x - w / 2 - 1, top - 3, w + 2, 4); }
  };
  for (let i = 0; i < towers.length; i += 3) {
    const set = towers.slice(i, i + 3);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
    for (const o of set) { x0 = Math.min(x0, o.x - o.w / 2); x1 = Math.max(x1, o.x + o.w / 2); y0 = Math.min(y0, o.base - o.h - 16); }
    p.group('city', { x: x0 - 4, y: y0 - 4, w: x1 - x0 + 8, h: 1070 - y0 }, (c) => { for (const o of set) drawTower(c, o); }, { t: 4.6 + i * 0.07, d: 0.9, reveal: 'rise', ease: 'out' });
  }

  // the Ferry Building on the waterfront: sandstone over brick, its clock tower
  p.group('city', { x: 1160, y: 930, w: 130, h: 80 }, (c) => {
    const x = 1225, b = 1000;
    c.fillStyle = BRICK; c.fillRect(x - 52, b - 22, 104, 22);
    c.fillStyle = SAND; c.fillRect(x - 52, b - 36, 104, 15); c.fillRect(x - 56, b - 38, 112, 4);
    c.fillStyle = shade(BRICK, 0.75); for (let k = 0; k < 9; k++) c.fillRect(x - 46 + k * 11, b - 18, 5, 9);
    c.fillStyle = shade(SAND, 0.75); for (let k = 0; k < 9; k++) c.fillRect(x - 46 + k * 11, b - 33, 5, 8);
    // the tower and its cupola
    c.fillStyle = SAND; c.fillRect(x - 9, b - 66, 18, 30);
    c.fillStyle = shade(SAND, 0.82); c.fillRect(x + 2, b - 66, 7, 30);
    c.fillStyle = PAPER; c.beginPath(); c.arc(x, b - 56, 4.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6f8f82'; c.beginPath(); c.ellipse(x, b - 66, 9, 9, 0, Math.PI, 0); c.fill();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, b - 75); c.lineTo(x, b - 82); c.stroke();
    // corner turrets
    c.fillStyle = SAND; c.fillRect(x - 56, b - 46, 10, 10); c.fillRect(x + 46, b - 46, 10, 10);
  }, { t: 5.5, d: 0.8, reveal: 'rise' });
  // a liner at the wharf west of the city: white hull, two buff funnels
  p.group('city', { x: 380, y: 900, w: 170, h: 80 }, (c) => {
    c.translate(-560, -14);
    c.fillStyle = '#d8ccb0'; c.fillRect(950, 978, 150, 6);
    c.fillStyle = INK; poly(c, [[960, 970], [1084, 970], [1076, 980], [968, 980]]); c.fill();
    c.fillStyle = '#f7f1e2'; poly(c, [[962, 958], [1086, 958], [1084, 971], [960, 971]]); c.fill();
    c.fillRect(984, 948, 80, 11); c.fillRect(996, 940, 54, 9);
    c.fillStyle = '#d9a25a'; c.fillRect(1006, 926, 9, 15); c.fillRect(1030, 926, 9, 15);
    c.fillStyle = INK; c.fillRect(1006, 926, 9, 3); c.fillRect(1030, 926, 9, 3);
    c.fillStyle = 'rgba(36,48,74,.5)'; for (let x = 968; x < 1080; x += 6) c.fillRect(x, 962, 3, 3);
  }, { t: 5.7, d: 0.8, reveal: 'rise' });
  // the marina at Westhaven: a forest of thin masts
  const masts = [], mr = rng(65);
  for (let i = 0; i < 60; i++) { const x = mr.range(80, 330), y = 952 + (x - 80) * 0.06 + mr.range(-2, 2); masts.push([[x, y], [x, y - mr.range(12, 24)]]); }
  p.strokes('city', masts, '#f3ead6', 1.2, { t: 5.8, d: 0.6, reveal: 'rise', box: { x: 70, y: 910, w: 280, h: 70 } });
  // the Domain: a wooded hill, and the Museum on it, white and colonnaded
  const trees = [], tr = rng(71);
  for (let i = 0; i < 70; i++) { const x = tr.range(1280, 1560), y = 1008 + Math.abs(x - 1420) * 0.12 + tr.range(0, 40); trees.push([x, y, tr.range(8, 15)]); }
  p.group('city', { x: 1260, y: 940, w: 320, h: 130 }, (c) => {
    c.fillStyle = LAND; c.beginPath(); c.ellipse(1430, 1030, 200, 46, 0, Math.PI, 0); c.fill();
    c.fillStyle = LAND_D; c.beginPath(); for (const [x, y, s] of trees) blob(c, x, y, s, s * 0.8); c.fill();
    c.fillStyle = shade(LAND_D, 1.25); c.beginPath(); for (const [x, y, s] of trees) blob(c, x - s * 0.3, y - s * 0.3, s * 0.5, s * 0.4); c.fill();
  }, { t: 5.9, d: 0.8, reveal: 'rise' });
  p.group('city', { x: 1330, y: 930, w: 150, h: 80 }, (c) => {
    const x = 1404, b = 1000;
    c.fillStyle = '#f7f1e3'; c.fillRect(x - 62, b - 30, 124, 30);
    c.fillStyle = STONE_S; c.fillRect(x + 28, b - 30, 34, 30);
    c.fillStyle = '#f7f1e3'; poly(c, [[x - 30, b - 30], [x, b - 42], [x + 30, b - 30]]); c.fill();
    c.fillStyle = STONE_D; for (let k = 0; k < 10; k++) c.fillRect(x - 27 + k * 6, b - 28, 2, 24);
    c.fillStyle = '#f7f1e3'; c.fillRect(x - 14, b - 48, 28, 8);
    c.fillStyle = '#c9c7cf'; c.beginPath(); c.ellipse(x, b - 48, 15, 10, 0, Math.PI, 0); c.fill();
    c.fillStyle = shade(STONE_S, 0.8); c.fillRect(x - 62, b - 3, 124, 3);
  }, { t: 6.1, d: 0.8, reveal: 'rise' });
}

// the Sky Tower: a plain concrete shaft, the pod with its glass bands, and the mast
function skyTower(p) {
  const x = 905, base = 1060, top = 440;
  p.group('tower', { x: x - 60, y: top - 10, w: 120, h: base - top + 14 }, (c) => {
    // the shaft, lit on its left
    c.fillStyle = STONE; poly(c, [[x - 15, base], [x - 10, 660], [x + 10, 660], [x + 15, base]]); c.fill();
    c.fillStyle = STONE_S; poly(c, [[x + 2, base], [x + 1, 660], [x + 10, 660], [x + 15, base]]); c.fill();
    c.fillStyle = mix(STONE_S, INK, 0.25); c.fillRect(x + 7, 680, 2, base - 700);
    // the pod: an underside cone, three glass decks, a crown
    c.fillStyle = STONE; poly(c, [[x - 11, 668], [x - 40, 642], [x + 40, 642], [x + 11, 668]]); c.fill();
    c.fillStyle = STONE_S; poly(c, [[x + 2, 668], [x + 12, 642], [x + 40, 642], [x + 11, 668]]); c.fill();
    const deck = (y, hw, hh, glass) => {
      c.fillStyle = STONE; c.fillRect(x - hw, y, hw * 2, hh);
      c.fillStyle = STONE_S; c.fillRect(x + hw * 0.3, y, hw * 0.7, hh);
      c.fillStyle = glass; c.fillRect(x - hw + 2, y + hh * 0.3, hw * 2 - 4, hh * 0.45);
    };
    deck(628, 41, 14, '#6d8c9a');
    deck(612, 36, 16, '#557688');
    deck(600, 30, 12, '#6d8c9a');
    c.fillStyle = STONE; poly(c, [[x - 24, 600], [x - 12, 584], [x + 12, 584], [x + 24, 600]]); c.fill();
    c.fillStyle = STONE_S; poly(c, [[x + 4, 600], [x + 4, 584], [x + 12, 584], [x + 24, 600]]); c.fill();
    // the mast, stepping in, with its rings
    c.fillStyle = STONE; poly(c, [[x - 8, 586], [x - 3, top + 30], [x + 3, top + 30], [x + 8, 586]]); c.fill();
    c.fillStyle = STONE_S; poly(c, [[x + 1, 586], [x + 1, top + 30], [x + 3, top + 30], [x + 8, 586]]); c.fill();
    c.fillStyle = '#d9d0bd'; for (const y of [560, 530, 500]) c.fillRect(x - 6, y, 12, 4);
    c.strokeStyle = '#a99f99'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, top + 32); c.lineTo(x, top); c.stroke();
  }, { t: 5.0, d: 1.8, reveal: 'rise', ease: 'inOut' });
}

// ---------------------------------------------------------------- the suburbs
// wooden villas in their gardens: a gable or a hipped roof over a pale front
// and a window, among street trees. Smaller and paler toward the city.
function suburbs(p, r) {
  const rr = rng(81), bands = [];
  const haze = '#bfc79c';
  const field = (x, y) => Math.sin(x / 97 + y / 41) + 0.7 * Math.sin(x / 53 - y / 71) + 0.4 * Math.sin(x / 23 + y / 17);
  for (let y = 992; y < 1420; ) {
    const s = 0.4 + Math.max(0, y - 1000) / 260;
    const k = Math.max(0, Math.min(1, (1330 - y) / 330)) * 0.5;
    const row = { y, s, houses: [], trees: [] };
    for (let x = M + rr.range(0, 20); x < W - M; x += rr.range(15, 32) * s) {
      if (y < 1064 && x > 520 && x < 1290) continue; // the city's own blocks
      if (y < 1062 && x > 1260) continue; // the Domain
      const n = field(x, y);
      if (n < -1.3) continue; // a paddock
      if (n > 1.0 || rr.chance(0.22)) { if (rr.chance(n > 1.0 ? 0.7 : 1)) row.trees.push([x, y + rr.range(-3, 3) * s, rr.range(6, 11) * s, mix(rr.pick([LAND_D, GRASS_DD, '#5d7d4a', '#6c8a4c']), haze, k)]); }
      else row.houses.push([x, y + rr.range(-2, 2) * s, mix(rr.pick(ROOFS), haze, k), mix(rr.pick(WALLS), haze, k * 0.6), rr.chance(0.5)]);
    }
    bands.push(row);
    y += 9 * s + 5;
  }
  const drawRow = (c, row) => {
    const { s } = row;
    for (const [x, y, roof, wall, gable] of row.houses) {
      const w = 13 * s, h = 7 * s;
      c.fillStyle = wall; c.fillRect(x, y - h, w, h);
      c.fillStyle = shade(wall, 0.8); c.fillRect(x + w * 0.62, y - h, w * 0.38, h);
      c.fillStyle = roof;
      if (gable) poly(c, [[x - 1.5 * s, y - h], [x + w * 0.35, y - h - 6.5 * s], [x + w * 0.7, y - h], [x + w * 0.7, y - h]]);
      else poly(c, [[x - 1.5 * s, y - h], [x + 2.5 * s, y - h - 5 * s], [x + w - 2.5 * s, y - h - 5 * s], [x + w + 1.5 * s, y - h]]);
      c.fill();
      if (gable) { c.fillStyle = shade(roof, 0.75); poly(c, [[x + w * 0.35, y - h - 6.5 * s], [x + w + 1.5 * s, y - h - 5 * s], [x + w + 1.5 * s, y - h], [x + w * 0.7, y - h]]); c.fill(); }
      c.fillStyle = INK; c.globalAlpha = 0.55; c.fillRect(x + w * 0.18, y - h * 0.65, w * 0.14, h * 0.35); c.globalAlpha = 1;
    }
    for (const [x, y, rad, col] of row.trees) {
      c.fillStyle = col; c.beginPath(); c.ellipse(x, y - rad * 0.8, rad, rad * 0.9, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = shade(col, 1.3); c.beginPath(); c.ellipse(x - rad * 0.3, y - rad * 1.1, rad * 0.45, rad * 0.35, 0, 0, Math.PI * 2); c.fill();
    }
  };
  // rows go in a few at a time, far to near
  for (let i = 0; i < bands.length; i += 3) {
    const set = bands.slice(i, i + 3), y0 = set[0].y - 30 * set[0].s, y1 = set[set.length - 1].y + 6;
    p.group('suburbs', { x: 0, y: y0 - 6, w: W, h: y1 - y0 + 12 }, (c) => { for (const row of set) drawRow(c, row); }, { t: 6.2 + i * 0.09, d: 0.8, reveal: 'drop', dy: 14 });
  }
}

// ---------------------------------------------------------------- the cone and its crater
function coneTop(x) {
  // Maungawhau's outline as seen from its own south rim: shoulders falling to each side
  if (x < 260) return 1300 + (260 - x) * 0.55;
  if (x > 1320) return 1300 + (x - 1320) * 0.5;
  return 1300 + 6 * Math.sin(x / 90);
}
function cone(p, r) {
  const pts = [[M - 10, H]];
  for (let x = M - 10; x <= W; x += 10) pts.push([x, coneTop(x)]);
  pts.push([W, H]);
  const tufts = spray(rng(91), M, 1290, W - M, H - M, 9000, (x, y) => (y > coneTop(x) + 4 && !inEll(RIM, x, y) ? 0.5 : 0), 2.4);
  p.group('cone', { x: 0, y: 1280, w: W, h: H - 1280 }, (c) => {
    const g = c.createLinearGradient(0, 1290, 0, 1700);
    g.addColorStop(0, GRASS); g.addColorStop(1, GRASS_D);
    c.fillStyle = g; poly(c, pts); c.fill();
    dots(c, tufts, GRASS_DD);
    // the worn path round the rim
    c.strokeStyle = '#cdb98a'; c.lineWidth = 4;
    c.beginPath(); c.ellipse(RIM.x, RIM.y, RIM.rx + 22, RIM.ry + 14, 0, Math.PI * 1.04, Math.PI * 1.96); c.stroke();
  }, { t: 7.0, d: 1.0, reveal: 'rise', ease: 'out' });
}
function crater(p, r) {
  // the bowl: the far wall in light, the floor deep, the near wall in shade
  const shadeDots = spray(rng(101), RIM.x - RIM.rx, RIM.y - RIM.ry, RIM.x + RIM.rx, RIM.y + RIM.ry, 14000, (x, y) => {
    if (!inEll(RIM, x, y)) return 0;
    const k = (RIM.x - x) / RIM.rx; // the west wall falls into shade
    return Math.max(0, 0.15 + 0.6 * k) + (y > FLOOR.y ? 0.35 : 0);
  }, 2.4);
  p.group('crater', { x: RIM.x - RIM.rx - 10, y: RIM.y - RIM.ry - 10, w: RIM.rx * 2 + 20, h: RIM.ry * 2 + 20 }, (c) => {
    c.save(); ell(c, RIM); c.clip();
    const g = c.createLinearGradient(0, RIM.y - RIM.ry, 0, RIM.y + RIM.ry);
    g.addColorStop(0, GRASS_L); g.addColorStop(0.5, GRASS); g.addColorStop(0.66, mix(GRASS, GRASS_D, 0.6)); g.addColorStop(1, GRASS);
    c.fillStyle = g; c.fillRect(RIM.x - RIM.rx, RIM.y - RIM.ry, RIM.rx * 2, RIM.ry * 2);
    dots(c, shadeDots, GRASS_DD);
    const fg = c.createRadialGradient(FLOOR.x, FLOOR.y, 10, FLOOR.x, FLOOR.y, FLOOR.rx * 1.3);
    fg.addColorStop(0, GRASS_D); fg.addColorStop(1, 'rgba(79,122,64,0)');
    c.save(); c.translate(0, FLOOR.y); c.scale(1, FLOOR.ry / FLOOR.rx); c.translate(0, -FLOOR.y);
    c.fillStyle = fg; c.beginPath(); c.arc(FLOOR.x, FLOOR.y, FLOOR.rx * 1.3, 0, Math.PI * 2); c.fill(); c.restore();
    c.restore();
    // the rim's lip catches the light
    c.strokeStyle = GRASS_L; c.lineWidth = 5;
    c.beginPath(); c.ellipse(RIM.x, RIM.y, RIM.rx, RIM.ry, 0, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
  }, { t: 7.4, d: 1.2, reveal: 'iris', ease: 'inOut' });
  // contour lines down into the bowl, drawn one after another by the pen
  for (let k = 1; k <= 9; k++) {
    const t = k / 10, e = { x: lerp(RIM.x, FLOOR.x, t), y: lerp(RIM.y, FLOOR.y, t * t), rx: lerp(RIM.rx, FLOOR.rx, t), ry: lerp(RIM.ry, FLOOR.ry, t) };
    const pts = [];
    for (let i = 0; i <= 90; i++) { const a = Math.PI * (0.98 + (i / 90) * 1.04); pts.push([e.x + Math.cos(a) * e.rx, e.y + Math.sin(a) * e.ry]); }
    p.pen('crater', pts, mix(GRASS, GRASS_DD, 0.25 + t * 0.3), 1.8, { t: 8.0 + k * 0.1, d: 1.0 });
  }
  // grass tufts on the walls
  const rr = rng(111), tuft = [];
  for (let i = 0; i < 760; i++) {
    const x = rr.range(RIM.x - RIM.rx, RIM.x + RIM.rx), y = rr.range(RIM.y - RIM.ry, RIM.y + RIM.ry);
    if (!inEll({ ...RIM, rx: RIM.rx - 14, ry: RIM.ry - 14 }, x, y) || inEll(FLOOR, x, y)) continue;
    const s = 0.6 + (y - 1300) / 500;
    tuft.push([[x - 3 * s, y], [x - 4 * s, y - 6 * s]], [[x, y], [x, y - 8 * s]], [[x + 3 * s, y], [x + 5 * s, y - 6 * s]]);
  }
  p.strokes('crater', tuft, GRASS_DD, 1.4, { t: 9.1, d: 0.8, reveal: 'fade', box: { x: RIM.x - RIM.rx, y: RIM.y - RIM.ry - 10, w: RIM.rx * 2, h: RIM.ry * 2 + 10 } });
}
// ---------------------------------------------------------------- the foreground
function front(p, r) {
  // the near rim where we stand: the path, flax, and two visitors looking out
  const grain = spray(rng(121), M, 1860, W - M, H - M, 3000, () => 0.6, 2.6);
  p.group('front', { x: 0, y: 1840, w: W, h: H - 1840 }, (c) => {
    c.fillStyle = GRASS_D; poly(c, [[M - 10, 1880], [400, 1902], [800, 1910], [1200, 1900], [W, 1880], [W, H], [0, H]]); c.fill();
    c.fillStyle = '#d6c08f'; poly(c, [[M - 10, 1930], [500, 1916], [900, 1920], [1300, 1934], [W, 1930], [W, H - M + 2], [M - 10, H - M + 2]]); c.fill();
    dots(c, grain, shade(GRASS_D, 0.8));
  }, { t: 8.4, d: 0.8, reveal: 'rise' });
  // harakeke, the flax: long blades in a fan
  const rr = rng(131), blades = [];
  for (const [bx, by, n, hgt] of [[330, 1950, 16, 250], [1060, 1950, 12, 170]]) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 1.6 + rr.range(-0.08, 0.08), L = hgt * rr.range(0.7, 1.05);
      const ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L, bend = (i / (n - 1) - 0.5) * 30;
      blades.push(limb([[bx + (i - n / 2) * 2, by], [bx + Math.cos(a) * L * 0.6 + bend * 0.4, by + Math.sin(a) * L * 0.6], [ex + bend, ey + Math.abs(bend) * 0.6]], 12, 1));
    }
  }
  p.group('front', { x: 90, y: 1650, w: 1180, h: 320 }, (c) => {
    blades.forEach((b, i) => { c.fillStyle = i % 3 === 0 ? '#6f8c50' : i % 3 === 1 ? '#3e5a34' : '#4f6c3c'; poly(c, b); c.fill(); });
  }, { t: 8.9, d: 0.9, reveal: 'rise' });
  // the visitors, seen from behind: she in a crimson coat and cloche, he pointing at the city
  p.group('front', { x: 500, y: 1660, w: 300, h: 300 }, (c) => {
    c.translate(640, 1950); c.scale(1.6, 1.6); c.translate(-640, -1950);
    // her
    let x = 600, f = 1944;
    c.fillStyle = INK; c.fillRect(x - 9, f - 30, 5, 30); c.fillRect(x + 3, f - 30, 5, 30);
    c.fillStyle = CRIMSON; poly(c, [[x - 18, f - 26], [x - 12, f - 96], [x + 12, f - 96], [x + 18, f - 26]]); c.fill();
    c.fillStyle = shade(CRIMSON, 0.75); poly(c, [[x + 2, f - 26], [x + 4, f - 96], [x + 12, f - 96], [x + 18, f - 26]]); c.fill();
    c.fillStyle = '#d9a47c'; c.fillRect(x - 3, f - 104, 6, 8);
    c.fillStyle = INK; c.beginPath(); c.ellipse(x, f - 110, 11, 10, 0, Math.PI, 0); c.fill(); c.fillRect(x - 13, f - 111, 26, 3);
    // him
    x = 660; f = 1948;
    c.fillStyle = '#3a3f52'; c.fillRect(x - 10, f - 46, 8, 46); c.fillRect(x + 2, f - 46, 8, 46);
    c.fillStyle = '#6a5a4a'; poly(c, [[x - 15, f - 44], [x - 14, f - 108], [x + 14, f - 108], [x + 15, f - 44]]); c.fill();
    c.fillStyle = shade('#6a5a4a', 0.75); c.fillRect(x + 3, f - 108, 12, 64);
    c.strokeStyle = '#6a5a4a'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + 10, f - 100); c.lineTo(x + 34, f - 140); c.stroke();
    c.fillStyle = '#d9a47c'; c.fillRect(x - 4, f - 118, 8, 10);
    c.fillStyle = '#2b2b33'; c.fillRect(x - 14, f - 124, 28, 3); c.fillRect(x - 8, f - 134, 16, 11);
  }, { t: 9.5, d: 0.7, reveal: 'rise' });
}
// a cabbage tree on the left: a slim trunk forking into tufts of sword leaves
function cabbageTree(p, r) {
  const rr = rng(141);
  const forks = [[[120, 1960], [140, 1760], [150, 1600]], [[150, 1600], [118, 1500], [100, 1440]], [[150, 1600], [190, 1520], [226, 1470]], [[140, 1700], [70, 1640], [60, 1610]]];
  p.strokes('tree', forks, BARK, 12, { t: 9.0, d: 1.0, reveal: 'rise', ease: 'out', box: { x: 30, y: 1420, w: 220, h: 560 } });
  p.strokes('tree', forks.map((l) => l.map(([x, y]) => [x - 3, y])), BARK_L, 3, { t: 9.2, d: 0.8, reveal: 'rise', box: { x: 30, y: 1420, w: 220, h: 560 } });
  const tufts = [[100, 1440], [226, 1470], [60, 1610]];
  tufts.forEach(([tx, ty], i) => {
    const dark = [], light = [];
    for (let k = 0; k < 44; k++) {
      const a = (k / 44) * Math.PI * 2 + rr.range(-0.05, 0.05), L = rr.range(70, 110), droop = Math.max(0, Math.sin(a)) * 30 + (Math.cos(a) ** 2) * 18;
      const line = [[tx, ty], [tx + Math.cos(a) * L * 0.55, ty + Math.sin(a) * L * 0.55 + droop * 0.2], [tx + Math.cos(a) * L, ty + Math.sin(a) * L * 0.8 + droop]];
      (Math.sin(a) < -0.2 ? light : dark).push(line);
    }
    const box = { x: tx - 130, y: ty - 120, w: 260, h: 260 };
    p.strokes('tree', dark, '#3f5a36', 3.4, { t: 9.6 + i * 0.2, d: 0.7, reveal: 'pop', box });
    p.strokes('tree', light, '#8aa461', 2.6, { t: 9.7 + i * 0.2, d: 0.7, reveal: 'pop', box });
  });
}
// a pōhutukawa leaning in from the right: a gnarled trunk, a broad crown of
// leathery leaves, and the crimson brushes of its flowers
function limb(pts, w0, w1) {
  // a tapering outline round a polyline
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (pts.length - 1)) / 2;
    L.push([pts[i][0] - (dy / d) * w, pts[i][1] + (dx / d) * w]);
    R.push([pts[i][0] + (dy / d) * w, pts[i][1] - (dx / d) * w]);
  }
  return L.concat(R.reverse());
}
function pohutukawa(p, r) {
  const big = [
    limb([[1600, 1980], [1540, 1900], [1500, 1800], [1440, 1730], [1350, 1690], [1250, 1672]], 70, 16),
    limb([[1520, 1980], [1490, 1910], [1420, 1860], [1320, 1836], [1200, 1830]], 46, 12),
  ];
  const small = [
    limb([[1500, 1800], [1490, 1700], [1450, 1620], [1400, 1570]], 26, 8),
    limb([[1420, 1860], [1370, 1780], [1300, 1750]], 20, 6),
    limb([[1540, 1900], [1580, 1790], [1590, 1660]], 28, 10),
    limb([[1350, 1690], [1300, 1630], [1260, 1600]], 14, 5),
  ];
  const bark = [];
  const rb = rng(149);
  for (let i = 0; i < 40; i++) { const x = rb.range(1260, 1590), y = rb.range(1680, 1960); bark.push([[x, y], [x - rb.range(10, 30), y - rb.range(6, 18)]]); }
  p.group('tree', { x: 1160, y: 1540, w: 450, h: 450 }, (c) => {
    c.fillStyle = BARK; for (const l of big) { poly(c, l); c.fill(); }
    c.save(); c.beginPath(); for (const l of big) { c.moveTo(l[0][0], l[0][1]); for (const q of l) c.lineTo(q[0], q[1]); c.closePath(); } c.clip();
    c.strokeStyle = BARK_L; c.lineWidth = 2.4; c.beginPath(); for (const l of bark) { c.moveTo(l[0][0], l[0][1]); c.lineTo(l[1][0], l[1][1]); } c.stroke();
    c.restore();
  }, { t: 9.2, d: 1.0, reveal: 'wipeL', ease: 'inOut' });
  p.group('tree', { x: 1160, y: 1540, w: 450, h: 450 }, (c) => {
    c.fillStyle = BARK; for (const l of small) { poly(c, l); c.fill(); }
  }, { t: 9.5, d: 0.8, reveal: 'rise' });
  // the crown: masses of leaves, each a heap of small leathery ovals
  const rr = rng(151), masses = [];
  for (let i = 0; i < 30; i++) {
    const a = rr.range(0, 1), x = lerp(1150, 1600, a) + rr.range(-20, 20), y = 1520 + (1 - a) * 110 + Math.abs(a - 0.6) * 60 + rr.range(-50, 70);
    masses.push([x, y, rr.range(60, 100), rr.range(36, 54)]);
  }
  masses.sort((a, b) => a[1] - b[1]);
  const leaves = [[], [], []];
  for (const [x, y, rx, ry] of masses) for (let k = 0; k < 26; k++) {
    const u = rr.range(-1, 1), v = rr.range(-1, 0.6);
    if (u * u + v * v > 1) continue;
    leaves[v < -0.4 ? 2 : v < 0.1 ? 1 : 0].push([x + u * rx, y + v * ry, rr.range(8, 13), rr.range(-0.6, 0.6)]);
  }
  const leafPath = (c, list) => { c.beginPath(); for (const [x, y, s, a] of list) { c.moveTo(x + Math.cos(a) * s, y + Math.sin(a) * s); c.ellipse(x, y, s, s * 0.5, a, 0, Math.PI * 2); } };
  for (let half = 0; half < 2; half++) {
    const set = masses.filter((_, i) => i % 2 === half);
    p.group('tree', { x: 1040, y: 1430, w: 570, h: 420 }, (c) => {
      c.fillStyle = POHU; c.beginPath(); for (const [x, y, rx, ry] of set) blob(c, x, y, rx, ry); c.fill();
      c.fillStyle = POHU_M; c.beginPath(); for (const [x, y, rx, ry] of set) blob(c, x - rx * 0.08, y - ry * 0.22, rx * 0.82, ry * 0.68); c.fill();
    }, { t: 9.8 + half * 0.3, d: 0.9, reveal: 'pop' });
  }
  p.group('tree', { x: 1040, y: 1430, w: 570, h: 420 }, (c) => {
    c.fillStyle = POHU; leafPath(c, leaves[0]); c.fill();
    c.fillStyle = POHU_L; leafPath(c, leaves[1]); c.fill();
    c.fillStyle = '#8aa486'; leafPath(c, leaves[2]); c.fill();
  }, { t: 10.3, d: 0.6, reveal: 'fade' });
  // the flowers: brushes of crimson stamens, gold-tipped, opening a few at a time
  const flowers = [];
  for (const [x, y, rx, ry] of masses) for (let k = 0; k < 5; k++) flowers.push([x + rr.range(-rx, rx) * 0.8, y - ry * rr.range(0.1, 0.95), rr.range(10, 17)]);
  const brush = flowers.map(([x, y, s]) => {
    const lines = [], tips = [];
    for (let k = 0; k < 16; k++) { const a = Math.PI * (0.95 + (k / 15) * 1.1) + rr.range(-0.08, 0.08), L = s * rr.range(0.75, 1.1); lines.push([x, y + s * 0.2, x + Math.cos(a) * L, y + Math.sin(a) * L * 0.9]); tips.push([x + Math.cos(a) * L, y + Math.sin(a) * L * 0.9]); }
    return { x, y, s, lines, tips };
  });
  for (let i = 0; i < 5; i++) {
    const set = brush.filter((_, k) => k % 5 === i);
    p.group('tree', { x: 1030, y: 1400, w: 580, h: 460 }, (c) => {
      c.fillStyle = shade(CRIMSON, 0.6); c.beginPath(); for (const f of set) blob(c, f.x, f.y + f.s * 0.1, f.s * 0.75, f.s * 0.5); c.fill();
      c.strokeStyle = CRIMSON; c.lineWidth = 2.2; c.lineCap = 'round';
      c.beginPath(); for (const f of set) for (const [x0, y0, x1, y1] of f.lines) { c.moveTo(x0, y0); c.lineTo(x1, y1); } c.stroke();
      c.strokeStyle = CRIMSON_L; c.lineWidth = 1.3;
      c.beginPath(); for (const f of set) for (let k = 0; k < f.lines.length; k += 2) { const [x0, y0, x1, y1] = f.lines[k]; c.moveTo(lerp(x0, x1, 0.3), lerp(y0, y1, 0.3)); c.lineTo(x1, y1); } c.stroke();
      c.fillStyle = '#f4c25a'; c.beginPath(); for (const f of set) for (const [x, y] of f.tips) c.rect(x - 1.2, y - 1.2, 2.4, 2.4); c.fill();
    }, { t: 10.5 + i * 0.15, d: 0.6, reveal: 'pop' });
  }
}

// ---------------------------------------------------------------- what moves
function life(p, r) {
  // sails out on the harbor, drifting and heeling a little, and the Devonport ferry
  const rr = rng(161), fleet = [];
  for (let i = 0; i < 14; i++) {
    const y = rr.range(HZ + 30, SHORE - 20), s = 0.35 + (y - HZ) / 260;
    let x = rr.range(M + 20, W - M - 20);
    if (x > 560 && x < 1260 && y > 930) x = rr.chance(0.5) ? rr.range(360, 540) : rr.range(1280, 1520);
    fleet.push([x, y, s, rr.range(-1, 1), rr() * 6, rr.pick(['#fbf4e3', '#fbf4e3', '#f3d8b0', CRIMSON_L])]);
  }
  fleet.sort((a, b) => a[1] - b[1]);
  p.live('boats', {
    t: 4.0, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      for (const [x0, y, s, v, ph, sail] of fleet) {
        const x = x0 + v * time * 3, heel = Math.sin(time * 0.9 + ph) * 0.06;
        c.save(); c.translate(x, y); c.rotate(heel);
        c.fillStyle = INK; c.fillRect(-12 * s, -3 * s, 24 * s, 4 * s);
        c.fillStyle = sail; poly(c, [[0, -44 * s], [0, -5 * s], [14 * s, -5 * s]]); c.fill();
        c.fillStyle = shade(sail, 0.86); poly(c, [[-2 * s, -36 * s], [-2 * s, -5 * s], [-12 * s, -5 * s]]); c.fill();
        c.restore();
        c.fillStyle = SEA_L; c.fillRect(x - 14 * s, y + 2, 28 * s, 1.6);
      }
      // the ferry crossing from the North Shore
      const u = (time * 0.025) % 1, fx = lerp(640, 820, u), fy = lerp(860, 960, u);
      c.fillStyle = '#f7f1e2'; c.fillRect(fx - 18, fy - 8, 36, 7); c.fillRect(fx - 10, fy - 13, 20, 5);
      c.fillStyle = INK; c.fillRect(fx - 20, fy - 2, 40, 4);
      c.fillStyle = CRIMSON; c.fillRect(fx - 2, fy - 18, 5, 6);
      c.fillStyle = SEA_L; c.fillRect(fx - 34, fy + 3, 22, 2);
    },
  });
  // gulls wheeling over the crater
  const gulls = [[700, 1120, 0.4, 1.0], [880, 1180, 0.32, 0.8], [1040, 1100, 0.36, 0.9], [560, 1220, 0.28, 0.7]];
  p.live('air', {
    t: 10.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.strokeStyle = INK; c.lineCap = 'round'; c.lineJoin = 'round';
      for (const [x0, y0, w, s] of gulls) {
        const x = x0 + Math.cos(time * w + x0) * 110, y = y0 + Math.sin(time * w * 2 + y0) * 26, f = Math.sin(time * 3 + x0) * 5 * s;
        c.lineWidth = 3 * s;
        c.beginPath(); c.moveTo(x - 26 * s, y - 2 * s + f); c.quadraticCurveTo(x - 12 * s, y - 14 * s, x, y); c.quadraticCurveTo(x + 12 * s, y - 14 * s, x + 26 * s, y - 2 * s + f); c.stroke();
      }
    },
  });
}

// ---------------------------------------------------------------- the title
function title(p) {
  p.type('title', 'NEW ZEALAND', W / 2, 150, { family: FACE, size: 40, color: CRIMSON, align: 'center', track: 0.42, t: 10.6, gap: 0.05, d: 0.5, reveal: 'fade' });
  p.type('title', 'AUCKLAND', W / 2, 346, { family: FACE, size: 220, color: INK, shadow: CRIMSON, sx: 8, sy: 8, align: 'center', fit: 1380, track: 0.02, t: 11.0, gap: 0.13, d: 0.8, reveal: 'press' });
  p.type('title', 'THE CITY OF SAILS', W / 2, 418, { family: FACE, size: 36, color: INK, align: 'center', track: 0.3, t: 12.4, gap: 0.04, d: 0.5, reveal: 'fade' });
}
