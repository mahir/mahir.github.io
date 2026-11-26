// Macau: a night poster, Portuguese and Chinese at once. The floodlit facade of
// the Ruins of St. Paul's stands at the head of its long flights of steps, the sky
// showing through its empty doors and windows. Pastel colonial houses with green
// shutters, iron balconies and lit shops close in on either side, red lanterns
// strung from them; the casino towers glitter beyond the roofs on the left and the
// Macau Tower stands on the right. In front, the black and white waves of the
// calçada, and the name on a blue and white tiled street sign, as on every corner.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, lerp, clamp, poly, rng } from '../kit.js';

const PAPER = '#0f1c1e';
// the night
const NIGHT = '#071721', NIGHT2 = '#0e2d39', NIGHT3 = '#1a4550', GLOW = '#8a3f5c', AMBER = '#e59a52';
// the stone under floodlights
const ST_L = '#f8dfa6', ST = '#e8c07e', ST_M = '#c99a5d', ST_D = '#94673c', ST_DD = '#55371f';
// the houses
const YEL = '#e3bf55', PINK = '#dc8f8c', MINT = '#8fc4a8', CRM = '#ead9b6', SKY = '#8fb2cf', SHUT = '#2d6a4c';
const LIT = '#ffd98c', LIT2 = '#ffb860';
// the calçada and the sign
const LIMEST = '#c9c1ad', BASALT = '#16191d', TILE = '#f3efe3', COB = '#1d4b9c', COB_D = '#163a7a';
const RED = '#c8322a';

const FAM = '"LXGW WenKai TC"';
export const city = {
  id: 'macau', name: 'Macau', wall: '#10262b',
  alt: "A night poster of Macau: the floodlit facade of the Ruins of St. Paul's at the top of its steps, the sky showing through its empty doors and windows, pastel colonial houses with green shutters, iron balconies, lit shops and strings of red lanterns either side, glittering casino towers and the Macau Tower beyond, fireworks, and black and white wave paving in front, with the name 澳門 MACAU on a blue and white tiled street sign",
  google: 'family=LXGW+WenKai+TC:wght@400;700',
  fonts: [
    [`700 100px ${FAM}`, '澳門MACAU茶餅家涼燒臘金舖藥'],
    [`400 30px ${FAM}`, '大三巴牌坊 · RUÍNAS DE S. PAULO'],
  ],
  build,
};

const M = 48, PW = W - 2 * M, PH = H - 2 * M;
const FX = 800, FB = 1030, HW = 300; // the facade: its middle, its foot, half its width
const SB = 1345; // the foot of the steps
const TX = 1290; // the Macau Tower

function build() {
  const p = new Plate({ paper: PAPER, seed: 1602 });
  const r = p.r;
  p.clip = { x: M, y: M, w: PW, h: PH };
  p.stack('sky', 'stars', 'far', 'trees', 'facade', 'stairs', 'plaza', 'houses', 'fronts', 'lamps', 'live', 'sign');
  p.layer('sign', { clip: false });

  sky(p, r);
  far(p, r);
  facade(p, r);
  stairs(p, r);
  plaza(p, r);
  houses(p, r);
  lamps(p, r);
  lives(p, r);
  sign(p);
  return p;
}

function shape(c, pts) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }
function arch(c, x, y, w, h) { // an arched opening, its foot at y, as a subpath
  const rr = w / 2;
  c.moveTo(x, y); c.lineTo(x, y - h + rr); c.arc(x + rr, y - h + rr, rr, Math.PI, 0); c.lineTo(x + w, y); c.closePath();
}

// ================================================================ the sky
const skyFill = (c) => {
  const gr = c.createLinearGradient(0, M, 0, 1150);
  gr.addColorStop(0, NIGHT); gr.addColorStop(0.55, NIGHT2); gr.addColorStop(1, NIGHT3);
  return gr;
};
function sky(p, r) {
  p.group('sky', { x: M, y: M, w: PW, h: 1300 }, (c) => {
    c.fillStyle = skyFill(c); c.fillRect(M, M, PW, 1300);
  }, { t: 0.1, d: 1.0, reveal: 'fall', ease: 'inOut' });
  // the casinos' glow on the left, and a lesser one under the tower
  p.group('sky', { x: M, y: 150, w: PW, h: 1000 }, (c) => {
    let gr = c.createRadialGradient(260, 760, 20, 260, 760, 620);
    gr.addColorStop(0, 'rgba(229,154,82,0.55)'); gr.addColorStop(0.35, 'rgba(138,63,92,0.45)'); gr.addColorStop(1, 'rgba(138,63,92,0)');
    c.fillStyle = gr; c.fillRect(M, 150, PW, 1000);
    gr = c.createRadialGradient(1400, 820, 10, 1400, 820, 360);
    gr.addColorStop(0, 'rgba(120,190,200,0.28)'); gr.addColorStop(1, 'rgba(120,190,200,0)');
    c.fillStyle = gr; c.fillRect(M, 150, PW, 1000);
  }, { t: 0.8, d: 1.2, reveal: 'fade' });
  // thin clouds lit from below
  const cl = [[620, 230, 380], [1050, 300, 300], [160, 420, 260], [880, 520, 220]];
  cl.forEach(([x, y, w], i) => {
    p.group('sky', { x: x - 10, y: y - 14, w: w + 20, h: 30 }, (c) => {
      c.fillStyle = 'rgba(120,150,160,0.18)'; c.beginPath(); c.ellipse(x + w / 2, y, w / 2, 7, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(229,154,82,0.25)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + w * 0.15, y + 5); c.lineTo(x + w * 0.85, y + 5); c.stroke();
    }, { t: 1.0 + i * 0.15, d: 0.8, reveal: i % 2 ? 'wipeL' : 'wipe' });
  });
  const st = [];
  for (let i = 0; i < 160; i++) st.push([r.range(M, W - M), r.range(M, 620), r.range(0.6, 1.8)]);
  p.group('stars', { x: M, y: M, w: PW, h: 600 }, (c) => {
    c.fillStyle = 'rgba(240,232,210,0.8)'; c.beginPath();
    for (const [x, y, s] of st) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); }
    c.fill();
  }, { t: 0.6, d: 1.0, reveal: 'fade' });
}

// ================================================================ beyond: the casino towers, the Macau Tower, trees behind the ruins
const CAS = []; // lit windows that twinkle later
// the top of the nearest roof in front of x, on the left (so twinkles stay behind the houses)
const roofAt = (x) => (x < 250 ? 514 : x < 386 ? 634 : x < 470 ? 734 : 814);
function far(p, r) {
  const rr = rng(88);
  // the towers, back to front, as glass slabs lit in grids
  const towers = [
    { x: 70, w: 90, top: 470, col: '#24324a', lit: '#e8b35c' },
    { x: 150, w: 70, top: 390, col: '#2a2340', lit: '#e07fb0' },
    { x: 330, w: 110, top: 430, col: '#233847', lit: '#79d0d6' },
    { x: 240, w: 80, top: 300, col: '#33293a', lit: '#ffcf6a', round: true },
    { x: 400, w: 70, top: 540, col: '#2b2a44', lit: '#ffd98c' },
    { x: 20, w: 70, top: 560, col: '#1d2c3c', lit: '#9fd8ff' },
  ];
  towers.forEach((t, i) => {
    const wins = [];
    for (let y = t.top + 24; y < 1000; y += 9) for (let x = t.x + 5; x < t.x + t.w - 6; x += 7) {
      if (rr.chance(0.62)) wins.push([x, y]);
      else if (rr.chance(0.08) && y < roofAt(x) - 4) CAS.push([x, y, t.lit, rr() * 6]);
    }
    const bx = { x: t.x - 40, y: t.top - 120, w: t.w + 80, h: 1000 - t.top + 120 };
    p.group('far', bx, (c) => {
      if (t.round) {
        // a plain slab with a rounded top, lit along its rim
        const rr2 = t.w / 2;
        c.fillStyle = t.col; c.beginPath(); c.moveTo(t.x, 1000); c.lineTo(t.x, t.top + rr2); c.arc(t.x + rr2, t.top + rr2, rr2, Math.PI, 0); c.lineTo(t.x + t.w, 1000); c.fill();
        c.fillStyle = mix(t.col, '#000000', 0.3); c.fillRect(t.x + t.w * 0.7, t.top + rr2 * 0.3, t.w * 0.3, 1000 - t.top - rr2 * 0.3);
        c.strokeStyle = t.lit; c.lineWidth = 3; c.beginPath(); c.arc(t.x + rr2, t.top + rr2, rr2 - 2, Math.PI, 0); c.stroke();
      } else {
        c.fillStyle = t.col; c.fillRect(t.x, t.top, t.w, 1000 - t.top);
        c.fillStyle = mix(t.col, '#000000', 0.3); c.fillRect(t.x + t.w * 0.7, t.top, t.w * 0.3, 1000 - t.top);
        // a lit crown
        c.fillStyle = t.lit; c.fillRect(t.x, t.top, t.w, 4); c.fillRect(t.x + 4, t.top + 10, t.w - 8, 2);
      }
      c.fillStyle = t.lit; c.globalAlpha = 0.85;
      for (const [x, y] of wins) if (!t.round || y > t.top + t.w * 0.55) c.fillRect(x, y, 3, 4);
      c.globalAlpha = 1;
    }, { t: 1.3 + i * 0.22, d: 1.0, reveal: 'rise' });
  });
  // the Macau Tower: a tapering shaft, the pod, the mast
  const tx = TX;
  p.group('far', { x: tx - 90, y: 120, w: 180, h: 900 }, (c) => {
    c.fillStyle = '#c7d3d6'; c.beginPath(); c.moveTo(tx - 22, 1000); c.lineTo(tx - 12, 380); c.lineTo(tx + 12, 380); c.lineTo(tx + 22, 1000); c.fill();
    c.fillStyle = '#8ea3aa'; c.beginPath(); c.moveTo(tx + 2, 1000); c.lineTo(tx + 2, 380); c.lineTo(tx + 12, 380); c.lineTo(tx + 22, 1000); c.fill();
    // the three supporting legs, thin
    c.fillStyle = '#b5c3c7'; for (const dx of [-30, 30]) { c.beginPath(); c.moveTo(tx + dx, 1000); c.lineTo(tx + dx * 0.5, 600); c.lineTo(tx + dx * 0.5 + 4, 600); c.lineTo(tx + dx + 4, 1000); c.fill(); }
    // the pod: a lower ring, a glazed band of light, a deck
    c.fillStyle = '#dfe7e8'; c.beginPath(); c.moveTo(tx - 26, 384); c.lineTo(tx - 60, 350); c.lineTo(tx + 60, 350); c.lineTo(tx + 26, 384); c.fill();
    c.fillStyle = '#ffe7a8'; c.fillRect(tx - 62, 322, 124, 28);
    c.fillStyle = 'rgba(40,60,70,0.6)'; for (let x = tx - 58; x < tx + 60; x += 9) c.fillRect(x, 324, 2, 24);
    c.fillStyle = '#dfe7e8'; c.beginPath(); c.moveTo(tx - 66, 322); c.lineTo(tx - 40, 300); c.lineTo(tx + 40, 300); c.lineTo(tx + 66, 322); c.fill();
    c.fillStyle = '#b5c3c7'; c.fillRect(tx - 30, 286, 60, 14);
    // the mast
    c.fillStyle = '#dfe7e8'; c.beginPath(); c.moveTo(tx - 6, 286); c.lineTo(tx - 2, 150); c.lineTo(tx + 2, 150); c.lineTo(tx + 6, 286); c.fill();
    c.fillStyle = '#8ea3aa'; for (let y = 280; y > 160; y -= 16) c.fillRect(tx - 5, y, 10, 2);
  }, { t: 2.0, d: 1.4, reveal: 'rise', ease: 'inOut' });
  // the hill of trees behind the ruins
  const blobs = [];
  for (let i = 0; i < 70; i++) {
    const side = i % 2 ? 1 : -1, x = FX + side * rr.range(200, 420);
    blobs.push([x, rr.range(880, 1040) - (Math.abs(x - FX) < 330 ? 60 : 0), rr.range(22, 46)]);
  }
  p.group('trees', { x: 330, y: 760, w: 940, h: 300 }, (c) => {
    c.fillStyle = '#0c2226'; c.beginPath();
    for (const [x, y, s] of blobs) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); }
    c.fill();
    c.fillStyle = 'rgba(229,154,82,0.16)'; c.beginPath();
    for (const [x, y, s] of blobs) { if (y > 960) { c.moveTo(x + s * 0.6, y + s * 0.3); c.arc(x, y + s * 0.3, s * 0.6, 0, Math.PI * 2); } }
    c.fill();
  }, { t: 2.4, d: 1.0, reveal: 'rise' });
}

// ================================================================ the facade of St. Paul's
// three full tiers, a narrower fourth between scrolls, the pediment and its cross
const T1 = 868, T2 = 722, T3 = 592, T4 = 470, PED = 392;
const COLS = [-0.95, -0.66, -0.47, -0.3, -0.17, 0.17, 0.3, 0.47, 0.66, 0.95];
function openings(c) {
  // ground tier: the great door and two side doors
  arch(c, FX - 56, FB, 112, 148);
  arch(c, FX - 0.8 * HW - 38, FB, 76, 112);
  arch(c, FX + 0.8 * HW - 38, FB, 76, 112);
  // second tier: three windows
  arch(c, FX - 44, T1 - 18, 88, 108);
  arch(c, FX - 0.8 * HW - 30, T1 - 24, 60, 86);
  arch(c, FX + 0.8 * HW - 30, T1 - 24, 60, 86);
  // third tier: two small square windows
  for (const sd of [-1, 1]) { const x = FX + sd * 0.8 * HW; c.rect(x - 20, T2 - 90, 40, 46); }
}
function outline(c) {
  c.moveTo(FX - HW - 10, FB); c.lineTo(FX - HW - 10, T3);
  // the scroll up to the fourth tier
  c.bezierCurveTo(FX - HW + 40, T3, FX - 190, T3 - 30, FX - 175, T4 + 10);
  c.lineTo(FX - 160, T4); c.lineTo(FX - 150, PED + 70); c.lineTo(FX, PED); c.lineTo(FX + 150, PED + 70); c.lineTo(FX + 160, T4); c.lineTo(FX + 175, T4 + 10);
  c.bezierCurveTo(FX + 190, T3 - 30, FX + HW - 40, T3, FX + HW + 10, T3);
  c.lineTo(FX + HW + 10, FB); c.closePath();
}
function facade(p, r) {
  const rr = rng(1640);
  // speckle for the granite, fixed now
  const grain = [];
  for (let i = 0; i < 1800; i++) grain.push([rr.range(FX - HW, FX + HW), rr.range(PED, FB), rr() < 0.5]);
  const body = (c, y0, y1) => {
    c.save(); c.beginPath(); c.rect(FX - HW - 40, y0, 2 * HW + 80, y1 - y0); c.clip();
    // the wall itself, floodlit from below
    const gr = c.createLinearGradient(0, PED, 0, FB);
    gr.addColorStop(0, ST_M); gr.addColorStop(0.5, ST); gr.addColorStop(1, ST_L);
    c.fillStyle = gr; c.beginPath(); outline(c); openings(c); c.fill('evenodd');
    // the openings' reveals: a dark inner edge
    c.strokeStyle = ST_DD; c.lineWidth = 5; c.beginPath(); openings(c); c.stroke();
    // granite speckle
    c.save(); c.beginPath(); outline(c); openings(c); c.clip('evenodd');
    c.fillStyle = 'rgba(85,55,31,0.25)';
    for (const [x, y, d] of grain) if (d) c.fillRect(x, y, 1.6, 1.6);
    c.fillStyle = 'rgba(255,240,200,0.3)';
    for (const [x, y, d] of grain) if (!d) c.fillRect(x, y, 1.4, 1.4);
    c.restore();
    c.restore();
  };
  // a cornice: a light top, a deep shadow under it
  const cornice = (c, y, x0, x1, h = 16) => {
    c.fillStyle = ST_L; c.fillRect(x0 - 8, y - h, x1 - x0 + 16, h * 0.45);
    c.fillStyle = ST; c.fillRect(x0 - 4, y - h * 0.55, x1 - x0 + 8, h * 0.55);
    c.fillStyle = 'rgba(85,55,31,0.55)'; c.fillRect(x0 - 4, y, x1 - x0 + 8, 6);
    c.fillStyle = 'rgba(85,55,31,0.35)'; for (let x = x0; x < x1; x += 9) c.fillRect(x, y - h * 0.5, 3, h * 0.35);
  };
  const column = (c, x, y0, y1, w, kind) => {
    c.fillStyle = 'rgba(85,55,31,0.4)'; c.fillRect(x + w / 2, y0, 5, y1 - y0); // its shadow on the wall
    c.fillStyle = ST; c.fillRect(x - w / 2, y0, w, y1 - y0);
    c.fillStyle = ST_L; c.fillRect(x - w / 2 + 2, y0, w * 0.3, y1 - y0);
    c.fillStyle = ST_M; c.fillRect(x + w * 0.18, y0, w * 0.32, y1 - y0);
    // base and capital
    c.fillStyle = ST_L; c.fillRect(x - w / 2 - 4, y1 - 8, w + 8, 8); c.fillRect(x - w / 2 - 5, y0, w + 10, 7);
    c.fillStyle = ST_D;
    if (kind === 1) { c.beginPath(); c.arc(x - w / 2 - 1, y0 + 9, 4, 0, Math.PI * 2); c.arc(x + w / 2 + 1, y0 + 9, 4, 0, Math.PI * 2); c.fill(); }
    else { for (let k = -1; k <= 1; k++) { c.beginPath(); c.arc(x + k * w * 0.35, y0 + 11, 3, 0, Math.PI * 2); c.fill(); } }
  };
  const niche = (c, x, yb, w, h) => {
    c.fillStyle = 'rgba(85,55,31,0.85)'; c.beginPath(); arch(c, x - w / 2, yb, w, h); c.fill();
    c.fillStyle = 'rgba(55,35,20,0.6)'; c.beginPath(); arch(c, x - w / 2 + 5, yb, w - 10, h - 6); c.fill();
    c.fillStyle = ST_L; c.fillRect(x - w / 2 - 4, yb, w + 8, 5);
    // a shell in the head of the niche
    c.strokeStyle = 'rgba(248,223,166,0.5)'; c.lineWidth = 1.2; c.beginPath();
    for (let k = 0; k < 7; k++) { const a = Math.PI + (k + 0.5) * Math.PI / 7; c.moveTo(x, yb - h + w / 2); c.lineTo(x + Math.cos(a) * w * 0.4, yb - h + w / 2 + Math.sin(a) * w * 0.4); }
    c.stroke();
  };
  const relief = (c, x, y, w, h) => { // a carved panel: a frame and a few raised shapes
    c.strokeStyle = 'rgba(85,55,31,0.55)'; c.lineWidth = 2; c.strokeRect(x - w / 2, y - h / 2, w, h);
    c.fillStyle = 'rgba(85,55,31,0.35)'; c.beginPath(); c.ellipse(x, y, w * 0.28, h * 0.28, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(248,223,166,0.5)'; c.beginPath(); c.ellipse(x - 2, y - 2, w * 0.18, h * 0.18, 0, 0, Math.PI * 2); c.fill();
  };
  // the ground tier
  p.group('facade', { x: FX - HW - 30, y: T1 - 30, w: 2 * HW + 60, h: FB - T1 + 40 }, (c) => {
    body(c, T1 - 4, FB + 2);
    for (const u of COLS) column(c, FX + u * HW, T1 + 8, FB, 22, 1);
    cornice(c, T1 + 8, FX - HW - 10, FX + HW + 10, 20);
    // a step along the foot
    c.fillStyle = ST_M; c.fillRect(FX - HW - 18, FB - 6, 2 * HW + 36, 8);
  }, { t: 3.0, d: 1.2, reveal: 'rise', ease: 'out' });
  // the second tier
  p.group('facade', { x: FX - HW - 30, y: T2 - 30, w: 2 * HW + 60, h: T1 - T2 + 40 }, (c) => {
    body(c, T2 - 4, T1 + 2);
    for (const u of COLS) column(c, FX + u * HW, T2 + 8, T1 - 12, 20, 2);
    for (const sd of [-1, 1]) niche(c, FX + sd * 0.385 * HW, T1 - 24, 36, 90);
    cornice(c, T2 + 8, FX - HW - 10, FX + HW + 10, 18);
  }, { t: 3.7, d: 1.1, reveal: 'rise' });
  // the third tier
  p.group('facade', { x: FX - HW - 30, y: T3 - 30, w: 2 * HW + 60, h: T2 - T3 + 40 }, (c) => {
    body(c, T3 - 4, T2 + 2);
    for (const u of [-0.95, -0.62, -0.25, 0.25, 0.62, 0.95]) column(c, FX + u * HW, T3 + 8, T2 - 10, 18, 2);
    niche(c, FX, T2 - 14, 60, 104);
    for (const sd of [-1, 1]) relief(c, FX + sd * 0.44 * HW, T2 - 64, 64, 70);
    cornice(c, T3 + 8, FX - HW - 10, FX + HW + 10, 16);
  }, { t: 4.3, d: 1.0, reveal: 'rise' });
  // the fourth tier between its scrolls, the obelisk pinnacles
  p.group('facade', { x: FX - HW - 30, y: T4 - 120, w: 2 * HW + 60, h: T3 - T4 + 130 }, (c) => {
    body(c, T4 - 4, T3 + 2);
    for (const u of [-0.5, 0.5]) column(c, FX + u * HW, T4 + 8, T3 - 6, 16, 2);
    niche(c, FX, T3 - 14, 52, 92);
    for (const sd of [-1, 1]) relief(c, FX + sd * 0.34 * HW, T3 - 58, 40, 54);
    cornice(c, T4 + 8, FX - 165, FX + 165, 14);
    // the scrolls' curls
    c.strokeStyle = ST_D; c.lineWidth = 4;
    for (const sd of [-1, 1]) { c.beginPath(); c.arc(FX + sd * 230, T3 - 18, 14, 0, Math.PI * 1.6); c.stroke(); }
    // small obelisks standing on the third tier's ends
    for (const u of [-0.97, -0.72, 0.72, 0.97]) {
      const x = FX + u * HW;
      c.fillStyle = ST_M; c.fillRect(x - 10, T3 - 18, 20, 18);
      c.fillStyle = ST; c.beginPath(); c.moveTo(x - 7, T3 - 18); c.lineTo(x - 2, T3 - 82); c.lineTo(x + 2, T3 - 82); c.lineTo(x + 7, T3 - 18); c.fill();
      c.fillStyle = ST_D; c.beginPath(); c.moveTo(x + 1, T3 - 18); c.lineTo(x + 1, T3 - 82); c.lineTo(x + 2, T3 - 82); c.lineTo(x + 7, T3 - 18); c.fill();
      c.fillStyle = ST_L; c.beginPath(); c.arc(x, T3 - 86, 4, 0, Math.PI * 2); c.fill();
    }
  }, { t: 4.8, d: 1.0, reveal: 'rise' });
  // the pediment, its round relief, the cross
  p.group('facade', { x: FX - 170, y: PED - 80, w: 340, h: T4 - PED + 90 }, (c) => {
    body(c, PED - 4, T4 + 2);
    c.strokeStyle = ST_L; c.lineWidth = 5; c.beginPath(); c.moveTo(FX - 156, PED + 72); c.lineTo(FX, PED - 2); c.lineTo(FX + 156, PED + 72); c.stroke();
    c.fillStyle = 'rgba(85,55,31,0.5)'; c.beginPath(); c.arc(FX, PED + 46, 17, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(248,223,166,0.6)'; c.lineWidth = 1.5; c.beginPath();
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; c.moveTo(FX + Math.cos(a) * 20, PED + 46 + Math.sin(a) * 20); c.lineTo(FX + Math.cos(a) * 28, PED + 46 + Math.sin(a) * 28); }
    c.stroke();
    c.fillStyle = ST; c.fillRect(FX - 4, PED - 64, 8, 62); c.fillRect(FX - 18, PED - 50, 36, 8);
    c.fillStyle = ST_D; c.fillRect(FX + 1, PED - 64, 3, 62);
  }, { t: 5.3, d: 0.9, reveal: 'rise' });
  // the floodlights' haze rising up the face
  p.group('facade', { x: FX - HW - 80, y: PED - 80, w: 2 * HW + 160, h: FB - PED + 100 }, (c) => {
    const gr = c.createRadialGradient(FX, FB + 60, 40, FX, FB + 60, 560);
    gr.addColorStop(0, 'rgba(255,214,140,0.28)'); gr.addColorStop(1, 'rgba(255,214,140,0)');
    c.fillStyle = gr; c.beginPath(); outline(c); openings(c); c.fill('evenodd');
  }, { t: 5.9, d: 1.0, reveal: 'fade' });
}

// ================================================================ the steps: three flights and their landings, widening toward us
const hwAt = (y) => lerp(HW + 40, 560, clamp((y - FB) / (SB - FB)) ** 1.3);
function stairs(p, r) {
  const flights = [[FB, 1112], [1128, 1218], [1236, SB]];
  flights.forEach(([y0, y1], i) => {
    const pts = [[FX - hwAt(y0), y0], [FX + hwAt(y0), y0], [FX + hwAt(y1), y1], [FX - hwAt(y1), y1]];
    p.group('stairs', boxOf(pts, 4), (c) => {
      c.fillStyle = '#8a6d4c'; shape(c, pts); c.fill();
      // the treads: light noses, dark risers, the lamplight stronger down the middle
      for (let y = y0 + 3, k = 0; y < y1; k++) {
        const h = 4 + (y - FB) * 0.022, hw = hwAt(y);
        const gr = c.createLinearGradient(FX - hw, 0, FX + hw, 0);
        gr.addColorStop(0, '#6e5539'); gr.addColorStop(0.5, '#d8b783'); gr.addColorStop(1, '#6e5539');
        c.fillStyle = gr; c.fillRect(FX - hw, y, 2 * hw, h * 0.55);
        y += h;
      }
    }, { t: 4.4 + i * 0.5, d: 0.9, reveal: 'fall', ease: 'inOut' });
    // the landing below the flight
    if (i < 2) {
      const ly = flights[i + 1][0];
      const lp = [[FX - hwAt(y1), y1], [FX + hwAt(y1), y1], [FX + hwAt(ly), ly], [FX - hwAt(ly), ly]];
      p.fill('stairs', lp, '#b99a6c', { t: 4.8 + i * 0.5, d: 0.5, reveal: 'fall' });
    }
  });
  // the low walls along the steps, with their balusters
  for (const sd of [-1, 1]) {
    const wall = [];
    for (let y = FB; y <= SB; y += 10) wall.push([FX + sd * hwAt(y), y]);
    const top = wall.map(([x, y]) => [x + sd * 2, y - 26 - (y - FB) * 0.05]);
    const pts = [...wall, ...top.reverse()];
    p.group('stairs', boxOf(pts, 6), (c) => {
      c.fillStyle = '#5c4530'; shape(c, pts); c.fill();
      c.fillStyle = '#c9a36c'; c.beginPath();
      for (let y = FB; y <= SB; y += 10) { const x = FX + sd * hwAt(y), h = 26 + (y - FB) * 0.05; c.rect(x + sd * 2 - 1.5, y - h, 3, 3 + h * 0.1); }
      c.fill();
    }, { t: 5.9, d: 0.8, reveal: 'fall' });
  }
}

// ================================================================ the square: waves of black basalt in white limestone
function plaza(p, r) {
  const Y0 = SB - 8, Y1 = H - M;
  p.group('plaza', { x: M, y: Y0, w: PW, h: Y1 - Y0 }, (c) => {
    const gr = c.createLinearGradient(0, Y0, 0, Y1);
    gr.addColorStop(0, '#8c8574'); gr.addColorStop(1, LIMEST);
    c.fillStyle = gr; c.fillRect(M, Y0, PW, Y1 - Y0);
  }, { t: 6.0, d: 0.8, reveal: 'fall' });
  // the waves, in perspective: farther rows finer and closer together
  const N = 16;
  for (let k = 0; k < N; k++) {
    const a = k / N, b = (k + 1) / N;
    const ya = Y0 + (Y1 - Y0 + 60) * a ** 1.5, yb = Y0 + (Y1 - Y0 + 60) * b ** 1.5;
    const gap = yb - ya, amp = gap * 0.42, lam = 90 + 340 * a, th = gap * 0.42;
    const top = [], bot = [];
    for (let x = M - 10; x <= W - M + 10; x += 8) {
      const ph = ((x - FX) / lam) * Math.PI * 2;
      top.push([x, ya + amp * Math.sin(ph)]);
      bot.push([x, ya + amp * Math.sin(ph) + th]);
    }
    const pts = [...top, ...bot.reverse()];
    p.fill('plaza', pts, BASALT, { t: 6.3 + k * 0.1, d: 0.7, reveal: k % 2 ? 'wipeL' : 'wipe', ease: 'inOut', box: { x: M - 12, y: ya - amp - 4, w: PW + 24, h: gap + 2 * amp + 8 } });
  }
  // the joints between the setts, a fine dark scatter over everything
  const rr = rng(4);
  const dots = [];
  for (let i = 0; i < 2600; i++) { const y = Y0 + (Y1 - Y0) * rr() ** 0.8, s = 0.6 + (y - Y0) / (Y1 - Y0) * 1.8; dots.push([rr.range(M, W - M), y, s]); }
  p.group('plaza', { x: M, y: Y0, w: PW, h: Y1 - Y0 }, (c) => {
    c.fillStyle = 'rgba(40,36,30,0.35)'; c.beginPath();
    for (const [x, y, s] of dots) c.rect(x, y, s, s);
    c.fill();
  }, { t: 8.0, d: 0.6, reveal: 'fade' });
}

// ================================================================ the houses either side
// each house is a front seen square on, farther ones (near the steps) first
function houses(p, r) {
  const rr = rng(1557);
  const H_ = [
    // x0, x1, top, foot, color, floors
    [452, 520, 840, 1236, CRM, 3],
    [1080, 1148, 846, 1236, SKY, 3],
    [372, 470, 760, 1300, MINT, 4],
    [1130, 1228, 766, 1300, CRM, 4],
    [238, 386, 660, 1370, PINK, 4],
    [1214, 1362, 650, 1370, YEL, 4],
    [M - 20, 250, 540, 1470, YEL, 5],
    [1350, W - M + 20, 600, 1470, PINK, 5],
  ];
  const signs = ['茶', '餅家', '涼茶', '燒臘', '金舖', '藥'];
  H_.forEach(([x0, x1, top, foot, col, fl], i) => {
    const night = mix(col, NIGHT2, 0.38);
    const w = x1 - x0, h = foot - top, fh = (h - 30) / (fl + 0.4);
    const left = (x0 + x1) / 2 < FX;
    const win = [];
    for (let f = 1; f < fl; f++) {
      const n = Math.max(2, Math.round(w / 52));
      for (let k = 0; k < n; k++) win.push([x0 + (k + 0.5) * w / n, foot - fh * 1.25 - f * fh + fh * 0.25, w / n * 0.42, fh * 0.55, rr.chance(0.4), rr.chance(0.5)]);
    }
    const sg = rr.pick(signs);
    // the wall, its cornice and parapet, and the lamplight washing up from the street
    p.group('houses', { x: x0 - 12, y: top - 30, w: w + 24, h: h + 34 }, (c) => {
      c.fillStyle = night; c.fillRect(x0, top, w, h);
      const gr = c.createLinearGradient(0, foot, 0, top);
      gr.addColorStop(0, 'rgba(255,190,110,0.5)'); gr.addColorStop(0.6, 'rgba(255,190,110,0.08)'); gr.addColorStop(1, 'rgba(255,190,110,0)');
      c.fillStyle = gr; c.fillRect(x0, top, w, h);
      // the side toward the steps in shade
      c.fillStyle = 'rgba(7,23,33,0.35)'; c.fillRect(left ? x1 - 8 : x0, top, 8, h);
      // cornice, parapet with its little balusters, and pilasters at the corners
      c.fillStyle = mix(CRM, NIGHT2, 0.3); c.fillRect(x0 - 6, top - 4, w + 12, 12);
      c.fillRect(x0 - 2, top - 26, w + 4, 6);
      c.fillStyle = mix(CRM, NIGHT2, 0.45); for (let x = x0 + 4; x < x1 - 4; x += 9) c.fillRect(x, top - 20, 4, 16);
      c.fillStyle = mix(CRM, NIGHT2, 0.35); c.fillRect(x0, top, 7, h); c.fillRect(x1 - 7, top, 7, h);
      // string courses between the floors
      c.fillStyle = 'rgba(234,217,182,0.35)'; for (let f = 1; f <= fl; f++) c.fillRect(x0, foot - fh * 1.25 - f * fh + fh * 1.05, w, 4);
    }, { t: 5.6 + i * 0.25, d: 0.9, reveal: 'rise' });
    // windows with green shutters, some lit, iron balconies on the first floor
    p.group('fronts', { x: x0 - 12, y: top, w: w + 24, h: h }, (c) => {
      for (const [cx, y, ww, wh, lit, open] of win) {
        c.fillStyle = lit ? LIT : '#1b2a2e'; c.fillRect(cx - ww / 2, y, ww, wh);
        if (lit) { c.fillStyle = 'rgba(255,184,96,0.5)'; c.fillRect(cx - ww / 2, y + wh * 0.6, ww, wh * 0.4); }
        // the window bars
        c.fillStyle = 'rgba(30,30,30,0.5)'; c.fillRect(cx - 1, y, 2, wh); c.fillRect(cx - ww / 2, y + wh * 0.45, ww, 2);
        // shutters, folded open either side, or closed over half
        c.fillStyle = mix(SHUT, NIGHT2, 0.25);
        if (open) { c.fillRect(cx - ww / 2 - ww * 0.36, y, ww * 0.32, wh); c.fillRect(cx + ww / 2 + ww * 0.04, y, ww * 0.32, wh); }
        else c.fillRect(cx, y, ww / 2, wh);
        c.fillStyle = 'rgba(0,0,0,0.25)';
        for (let yy = y + 3; yy < y + wh; yy += 4) { if (open) { c.fillRect(cx - ww / 2 - ww * 0.36, yy, ww * 0.32, 1); c.fillRect(cx + ww / 2 + ww * 0.04, yy, ww * 0.32, 1); } else c.fillRect(cx, yy, ww / 2, 1); }
        // the white molding round the window
        c.strokeStyle = 'rgba(234,217,182,0.55)'; c.lineWidth = 2; c.strokeRect(cx - ww / 2 - 2, y - 2, ww + 4, wh + 4);
      }
      // the first floor's iron balcony
      const by = foot - fh * 1.25 - fh + fh * 0.8;
      c.fillStyle = '#121a1c'; c.fillRect(x0 + 8, by, w - 16, 4); c.fillRect(x0 + 8, by - fh * 0.32, w - 16, 3);
      c.beginPath(); for (let x = x0 + 10; x < x1 - 10; x += 6) c.rect(x, by - fh * 0.32, 1.5, fh * 0.32); c.fill();
      c.strokeStyle = '#121a1c'; c.lineWidth = 1.2; c.beginPath();
      for (let x = x0 + 14; x < x1 - 14; x += 18) { c.moveTo(x + 9, by - fh * 0.16); c.arc(x + 4.5, by - fh * 0.16, 4.5, 0, Math.PI * 2); }
      c.stroke();
      // the shop at street level: an arcade of lit openings, a hanging sign
      const sy = foot - fh * 1.25;
      c.fillStyle = mix(col, NIGHT2, 0.5); c.fillRect(x0, sy, w, fh * 1.25);
      const n = Math.max(1, Math.round(w / 70));
      for (let k = 0; k < n; k++) {
        const ax = x0 + (k + 0.12) * w / n, aw = w / n * 0.76;
        c.fillStyle = LIT2; c.beginPath(); arch(c, ax, foot, aw, fh * 1.0); c.fill();
        c.fillStyle = 'rgba(120,50,20,0.5)'; c.fillRect(ax, foot - fh * 0.35, aw, fh * 0.35);
        c.fillStyle = 'rgba(60,30,15,0.6)'; for (let s = 0; s < 3; s++) c.fillRect(ax + aw * 0.1, foot - fh * (0.75 - s * 0.14), aw * 0.8, 2);
      }
    }, { t: 6.8 + i * 0.18, d: 0.7, reveal: 'fade' });
    // the shop's sign, red with gold characters, hanging out over the street
    if (w > 90) {
      const sx = left ? x1 - 46 : x0 + 14, sy = foot - fh * 1.25 - fh * 0.9, n = sg.length, ch = 30;
      p.group('fronts', { x: sx - 6, y: sy - 6, w: 44, h: n * ch + 22 }, (c) => {
        c.fillStyle = RED; c.fillRect(sx, sy, 32, n * ch + 10);
        c.strokeStyle = '#e8b04a'; c.lineWidth = 2; c.strokeRect(sx + 3, sy + 3, 26, n * ch + 4);
        c.fillStyle = '#f5cf6a'; c.font = `700 24px ${FAM}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        for (let k = 0; k < n; k++) c.fillText(sg[k], sx + 16, sy + 5 + ch * (k + 0.5));
      }, { t: 8.3 + i * 0.08, d: 0.5, reveal: 'drop', dy: 16 });
    }
  });
}

// ================================================================ lamps and their light, and people
function lamps(p, r) {
  // Portuguese iron lamp posts: two on the square, smaller ones on the steps
  const posts = [[300, 1720, 1.0], [1300, 1720, 1.0], [FX - 400, 1260, 0.55], [FX + 400, 1260, 0.55], [FX - 352, 1120, 0.42], [FX + 352, 1120, 0.42]];
  posts.forEach(([x, y, s], i) => {
    p.group('lamps', { x: x - 60 * s, y: y - 330 * s, w: 120 * s, h: 340 * s }, (c) => {
      c.fillStyle = '#111619';
      c.fillRect(x - 12 * s, y - 24 * s, 24 * s, 24 * s); // the foot
      c.beginPath(); c.moveTo(x - 6 * s, y - 24 * s); c.lineTo(x - 3.5 * s, y - 250 * s); c.lineTo(x + 3.5 * s, y - 250 * s); c.lineTo(x + 6 * s, y - 24 * s); c.fill();
      for (const k of [0.3, 0.55, 0.85]) c.fillRect(x - 8 * s, y - 250 * k * s - 4 * s, 16 * s, 5 * s);
      // a scrolled arm each side, a lantern on each
      c.strokeStyle = '#111619'; c.lineWidth = 3.5 * s; c.beginPath();
      for (const sd of [-1, 1]) { c.moveTo(x, y - 238 * s); c.quadraticCurveTo(x + sd * 40 * s, y - 262 * s, x + sd * 44 * s, y - 236 * s); }
      c.stroke();
      for (const sd of [-1, 1]) {
        const lx = x + sd * 44 * s, ly = y - 236 * s;
        c.fillStyle = LIT; c.beginPath(); c.moveTo(lx - 9 * s, ly); c.lineTo(lx + 9 * s, ly); c.lineTo(lx + 6 * s, ly + 26 * s); c.lineTo(lx - 6 * s, ly + 26 * s); c.fill();
        c.fillStyle = '#111619'; c.beginPath(); c.moveTo(lx - 12 * s, ly); c.lineTo(lx, ly - 10 * s); c.lineTo(lx + 12 * s, ly); c.fill(); c.fillRect(lx - 7 * s, ly + 25 * s, 14 * s, 4 * s);
      }
      c.beginPath(); c.arc(x, y - 262 * s, 5 * s, 0, Math.PI * 2); c.fill();
    }, { t: 8.6 + i * 0.12, d: 0.7, reveal: 'rise' });
  });
  // the glow round every lamp, added at once
  p.group('lamps', { x: M, y: 700, w: PW, h: 1260 }, (c) => {
    c.globalCompositeOperation = 'lighter';
    for (const [x, y, s] of posts) for (const sd of [-1, 1]) {
      const lx = x + sd * 44 * s, ly = y - 222 * s, R = 110 * s;
      const gr = c.createRadialGradient(lx, ly, 2, lx, ly, R);
      gr.addColorStop(0, 'rgba(255,200,120,0.55)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = gr; c.fillRect(lx - R, ly - R, 2 * R, 2 * R);
    }
    // pools of light on the paving under the two big lamps
    for (const x of [300, 1300]) {
      c.save(); c.translate(x, 1730); c.scale(1, 0.32);
      const gr = c.createRadialGradient(0, 0, 10, 0, 0, 300);
      gr.addColorStop(0, 'rgba(255,190,110,0.32)'); gr.addColorStop(1, 'rgba(255,190,110,0)');
      c.fillStyle = gr; c.fillRect(-300, -300, 600, 600); c.restore();
    }
  }, { t: 9.0, d: 0.8, reveal: 'fade' });
  // people on the steps and the square: dark figures, some with a lit edge
  const rr = rng(77), ppl = [];
  for (let i = 0; i < 34; i++) {
    const y = i < 24 ? rr.range(FB + 40, SB) : rr.range(SB + 60, 1560);
    const hw = y < SB ? hwAt(y) - 30 : 600, x = FX + rr.range(-hw, hw);
    const s = 0.55 + (y - FB) / 600;
    ppl.push([x, y, s, false, rr.pick(['#b65a4c', '#d8c7a0', '#4f6f8c', '#7c8f6a', '#c9a24c', '#3b3f52', '#e0dccf']), rr.chance(0.2) ? rr.pick(['#d8c7a0', RED]) : null]);
  }
  ppl.sort((a, b) => a[1] - b[1]);
  p.group('lamps', { x: M, y: FB - 80, w: PW, h: 700 }, (c) => {
    for (const [x, y, s, sit, col, top] of ppl) {
      const h = 58 * s;
      // legs, a coat or shirt, the head; lamplight catching one side
      c.fillStyle = '#15191e';
      c.fillRect(x - 4.5 * s, y - h * 0.46, 3.6 * s, h * 0.46); c.fillRect(x + 1 * s, y - h * 0.46, 3.6 * s, h * 0.46);
      c.fillStyle = col; c.beginPath(); c.moveTo(x - 7.5 * s, y - h * 0.86); c.lineTo(x + 7.5 * s, y - h * 0.86); c.lineTo(x + 6 * s, y - h * 0.42); c.lineTo(x - 6 * s, y - h * 0.42); c.fill();
      c.fillRect(x - 9 * s, y - h * 0.84, 2.5 * s, h * 0.36); c.fillRect(x + 6.5 * s, y - h * 0.84, 2.5 * s, h * 0.36);
      c.fillStyle = '#2a1f1a'; c.beginPath(); c.arc(x, y - h * 0.94, 5.2 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,200,120,0.45)'; c.fillRect(x - 7.5 * s, y - h * 0.86, 2.5 * s, h * 0.42);
      if (top) { c.fillStyle = top; c.beginPath(); c.arc(x, y - h * 0.97, 5.5 * s, Math.PI, 0); c.fill(); }
    }
  }, { t: 9.2, d: 0.8, reveal: 'fade' });
}

// ================================================================ what moves: lanterns, fireworks, the tower's lights, the casinos
function lives(p, r) {
  // two strings of red lanterns, from the houses to the walls of the steps
  const strings = [[[250, 700], [FX - 330, 1000]], [[1350, 690], [FX + 330, 1000]]];
  const lan = [];
  for (const [[x0, y0], [x1, y1]] of strings) for (let k = 1; k < 6; k++) {
    const t = k / 6, x = lerp(x0, x1, t), y = lerp(y0, y1, t) + Math.sin(t * Math.PI) * 50;
    lan.push([x, y, r() * 6, 0.8 + 0.3 * Math.sin(k)]);
  }
  p.live('live', {
    t: 9.4, d: 0.8,
    draw: (c, time) => {
      c.strokeStyle = '#1a1214'; c.lineWidth = 1.6; c.beginPath();
      for (const [[x0, y0], [x1, y1]] of strings) { c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 100, x1, y1); }
      c.stroke();
      for (const [x, y, ph, s] of lan) {
        const a = Math.sin(time * 1.6 + ph) * 0.12;
        c.save(); c.translate(x, y); c.rotate(a);
        c.fillStyle = '#e8b04a'; c.fillRect(-1, 0, 2, 8 * s);
        c.fillStyle = RED; c.beginPath(); c.ellipse(0, 24 * s, 16 * s, 15 * s, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,170,90,0.55)'; c.beginPath(); c.ellipse(-3 * s, 22 * s, 7 * s, 11 * s, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#1a1214'; c.fillRect(-7 * s, 8 * s, 14 * s, 3 * s); c.fillRect(-7 * s, 38 * s, 14 * s, 3 * s);
        c.fillStyle = '#e8b04a'; c.fillRect(-1, 41 * s, 2, 10 * s);
        c.restore();
      }
    },
  });
  // fireworks over the harbor beyond: a burst opens, falls and fades, then another
  const bursts = [[1080, 260, '#ffd98c', 0], [560, 200, '#f08fb0', 1.4], [1250, 470, '#9fe0e0', 2.6], [330, 300, '#ffd98c', 3.5]];
  const rays = [];
  for (let k = 0; k < 22; k++) rays.push([(k / 22) * Math.PI * 2 + r.range(-0.08, 0.08), r.range(0.75, 1.0)]);
  p.live('live', {
    t: 9.6, d: 0.6,
    draw: (c, time) => {
      c.lineCap = 'round';
      for (const [bx, by, col, off] of bursts) {
        const k = ((time - 9.6 + off) % 4.6) / 2.2;
        if (k > 1) continue;
        const R = 90 * Math.sqrt(k), drop = 30 * k * k;
        c.strokeStyle = col; c.globalAlpha = 1 - k; c.lineWidth = 2.2;
        c.beginPath();
        for (const [a, l] of rays) {
          const x0 = bx + Math.cos(a) * R * l * 0.6, y0 = by + Math.sin(a) * R * l * 0.6 + drop;
          c.moveTo(x0, y0); c.lineTo(bx + Math.cos(a) * R * l, by + Math.sin(a) * R * l + drop * 1.3);
        }
        c.stroke();
      }
      c.globalAlpha = 1;
    },
  });
  // the tower's red warning lights, and the casino windows flickering
  p.live('live', {
    t: 9.8, d: 0.6,
    draw: (c, time) => {
      const on = Math.sin(time * 3) > 0;
      c.fillStyle = on ? '#ff4a3a' : '#5a1a16';
      c.beginPath(); for (const [x, y, rr] of [[TX, 150, 4], [TX - 60, 322, 3], [TX + 60, 322, 3]]) { c.moveTo(x + rr, y); c.arc(x, y, rr, 0, Math.PI * 2); } c.fill();
      for (const [x, y, col, ph] of CAS) { if (Math.sin(time * 2.2 + ph * 3) > 0.2) { c.fillStyle = col; c.fillRect(x, y, 3, 4); } }
    },
  });
}

// ================================================================ the street sign: glazed tiles, a blue border, 澳門 MACAU
const SX0 = 340, SX1 = 1260, SY0 = 1530, SY1 = 1910, TS = 102;
function sign(p) {
  const cols = Math.round((SX1 - SX0) / TS), rows = Math.round((SY1 - SY0) / TS);
  const tw = (SX1 - SX0) / cols, th = (SY1 - SY0) / rows;
  // a shadow on the wall, then the tiles, row by row
  p.group('sign', { x: SX0 - 10, y: SY0 - 10, w: SX1 - SX0 + 40, h: SY1 - SY0 + 40 }, (c) => {
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(SX0 + 10, SY0 + 12, SX1 - SX0, SY1 - SY0);
  }, { t: 9.9, d: 0.5, reveal: 'fade' });
  for (let rI = 0; rI < rows; rI++) {
    p.group('sign', { x: SX0 - 2, y: SY0 + rI * th - 2, w: SX1 - SX0 + 4, h: th + 4 }, (c) => {
      for (let k = 0; k < cols; k++) {
        const x = SX0 + k * tw, y = SY0 + rI * th;
        c.fillStyle = TILE; c.fillRect(x + 1, y + 1, tw - 2, th - 2);
        // a glaze sheen and the hairline of the joint
        const gr = c.createLinearGradient(x, y, x + tw, y + th);
        gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(180,170,150,0.25)');
        c.fillStyle = gr; c.fillRect(x + 1, y + 1, tw - 2, th - 2);
        c.strokeStyle = 'rgba(120,110,95,0.6)'; c.lineWidth = 1.5; c.strokeRect(x + 0.5, y + 0.5, tw - 1, th - 1);
      }
    }, { t: 10.0 + rI * 0.18, d: 0.5, reveal: 'wipe', ease: 'out' });
  }
  // the painted border: a wide band, a thin line inside, corner fans
  p.group('sign', { x: SX0 - 4, y: SY0 - 4, w: SX1 - SX0 + 8, h: SY1 - SY0 + 8 }, (c) => {
    c.strokeStyle = COB; c.lineWidth = 14; c.strokeRect(SX0 + 16, SY0 + 16, SX1 - SX0 - 32, SY1 - SY0 - 32);
    c.lineWidth = 3; c.strokeRect(SX0 + 34, SY0 + 34, SX1 - SX0 - 68, SY1 - SY0 - 68);
    c.fillStyle = COB;
    for (const [x, y, a] of [[SX0 + 34, SY0 + 34, 0], [SX1 - 34, SY0 + 34, Math.PI / 2], [SX1 - 34, SY1 - 34, Math.PI], [SX0 + 34, SY1 - 34, -Math.PI / 2]]) {
      c.save(); c.translate(x, y); c.rotate(a);
      for (let k = 0; k < 5; k++) { const b = (k + 0.5) * (Math.PI / 2) / 5; c.beginPath(); c.ellipse(Math.cos(b) * 22, Math.sin(b) * 22, 8, 3, b, 0, Math.PI * 2); c.fill(); }
      c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  }, { t: 10.7, d: 0.9, reveal: 'iris' });
  // the name, brushed in cobalt
  p.type('sign', '澳門', W / 2, 1782, { size: 190, family: FAM, weight: 700, color: COB, align: 'center', track: 0.12, t: 11.1, gap: 0.35, d: 0.8, reveal: 'press' });
  p.type('sign', 'MACAU', W / 2, 1858, { size: 62, family: FAM, weight: 700, color: COB_D, align: 'center', track: 0.6, t: 11.9, gap: 0.1, d: 0.5, reveal: 'fade' });
  p.type('sign', '大三巴牌坊 · RUÍNAS DE S. PAULO', W / 2, 1594, { size: 26, family: FAM, weight: 400, color: COB, align: 'center', track: 0.18, t: 12.5, gap: 0.025, d: 0.3, reveal: 'fade' });
}
