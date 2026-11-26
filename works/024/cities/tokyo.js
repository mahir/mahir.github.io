// Tokyo: a woodblock print at dusk. A sky graded from Prussian blue to peach,
// Fuji, bands of mist, the tower in red and white over tiled roofs, a pagoda and
// a cherry branch close by, the river and an arched bridge. Mincho type, a
// vertical cartouche and a red seal.

import { Plate, W, H, boxOf } from '../print.js';
import { shade, mix, lerp, clamp, poly, rng } from '../kit.js';

const SUMI = '#1d2238', PAPER = '#efe4cc';
const INDIGO = '#1f3260', PRUSSIAN = '#2a4677', PEACH = '#f3c79c', ROSE = '#e9a08a';
const VERMILION = '#cf4a2d', RED = '#b8352a', SNOW = '#f7f1e3', SLATE = '#56627d', ROOF = '#3e465c';
const PINE = '#3d5a4a', SAKURA = '#f2bcc4', SAKURA_D = '#d98a99', WATER = '#2c4f80';

export const city = {
  id: 'tokyo', name: 'Tokyo', wall: '#1b2238',
  alt: "A woodblock print at dusk: Mount Fuji and a red sun over tiled roofs, Tokyo Tower, a five-story pagoda, an arched bridge over the river, a cherry branch and a red seal",
  google: 'family=Shippori+Mincho+B1:wght@500;800',
  fonts: [['800 100px "Shippori Mincho B1"', '東京TOKYO'], ['500 40px "Shippori Mincho B1"', 'EDO・TOKYO']],
  build,
};

const IX = 70, IY = 70, IW = W - 140, IH = 1750; // the picture; the margin below holds the title

function build() {
  const p = new Plate({ paper: PAPER, seed: 1868 });
  const r = p.r;
  p.clip = { x: IX, y: IY, w: IW, h: IH };
  p.stack('sky', 'fuji', 'far', 'mist', 'roofsFar', 'tower', 'roofs', 'mist2', 'river', 'pagoda', 'bridge', 'boats', 'branch', 'title', 'frame');
  p.layer('title', { clip: false });
  p.layer('frame', { clip: false });

  sky(p, r);
  fuji(p, r);
  mist(p, r, 'mist', [[-80, 905, 760, 34], [880, 870, 820, 30], [300, 990, 900, 26]], 2.6);
  town(p, r);
  tower(p, r);
  mist(p, r, 'mist2', [[-60, 1250, 640, 30], [980, 1300, 700, 34]], 6.4);
  river(p, r);
  pagoda(p, r);
  bridge(p, r);
  boats(p, r);
  branch(p, r);
  title(p);
  return p;
}

// ---------------------------------------------------------------- sky
function sky(p, r) {
  p.group('sky', { x: IX, y: IY, w: IW, h: 1000 }, (c) => {
    const g = c.createLinearGradient(0, IY, 0, 1000);
    g.addColorStop(0, INDIGO); g.addColorStop(0.22, PRUSSIAN); g.addColorStop(0.55, mix(PRUSSIAN, ROSE, 0.55));
    g.addColorStop(0.8, PEACH); g.addColorStop(1, '#f6dcb8');
    c.fillStyle = g; c.fillRect(IX, IY, IW, 1000);
    // wood grain in the sky, the way a block prints
    const rr = rng(4);
    c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      const y = IY + rr() * 900;
      c.beginPath(); c.moveTo(IX, y);
      for (let x = IX; x <= IX + IW; x += 40) c.lineTo(x, y + Math.sin(x * 0.004 + i) * 6);
      c.stroke();
    }
  }, { t: 0.1, d: 2.2, reveal: 'fall', ease: 'inOut' });
  // the sun, low and red
  p.group('sky', { x: 920, y: 680, w: 200, h: 200 }, (c) => {
    c.fillStyle = VERMILION; c.beginPath(); c.arc(1020, 780, 88, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,190,150,.35)'; c.beginPath(); c.arc(1006, 766, 70, 0, Math.PI * 2); c.fill();
  }, { t: 1.6, d: 1.6, reveal: 'rise', ease: 'inOut' });
  // a few stars still out at the top
  const stars = [];
  for (let i = 0; i < 40; i++) stars.push([IX + r() * IW, IY + 20 + r() ** 1.6 * 260, 0.8 + r() * 1.8]);
  p.group('sky', { x: IX, y: IY, w: IW, h: 320 }, (c) => {
    c.fillStyle = 'rgba(250,240,220,.8)';
    for (const [x, y, s] of stars) { c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); }
  }, { t: 1.2, d: 1.5, reveal: 'fade' });
}

// ---------------------------------------------------------------- Fuji
function fuji(p, r) {
  const peak = [640, 560], base = 1010;
  const slope = (x) => {
    const d = Math.abs(x - peak[0]);
    return peak[1] + (base - peak[1]) * (1 - Math.exp(-d / 330)) ** 1.1 * 1.25;
  };
  const pts = [];
  for (let x = -60; x <= 1400; x += 10) pts.push([x, Math.min(base, slope(x) + (Math.abs(x - peak[0]) < 40 ? 6 : 0))]);
  const outline = pts.slice();
  pts.push([1400, base + 10], [-60, base + 10]);
  p.group('fuji', boxOf(pts), (c) => {
    const g = c.createLinearGradient(0, peak[1], 0, base);
    g.addColorStop(0, '#5c6f98'); g.addColorStop(1, mix('#8a8fae', PEACH, 0.45));
    c.fillStyle = g; poly(c, pts); c.fill();
    // the snow, with its ragged foot
    const snow = [];
    for (let x = 420; x <= 860; x += 6) snow.push([x, slope(x)]);
    for (let x = 860; x >= 420; x -= 6) {
      const d = Math.abs(x - peak[0]);
      const foot = slope(x) + 20 + Math.max(0, 150 - d * 0.55) * (0.6 + 0.4 * Math.abs(Math.sin(x * 0.09))) * (d < 200 ? 1 : 0.2);
      snow.push([x, Math.max(slope(x), foot)]);
    }
    c.save(); poly(c, pts); c.clip();
    c.fillStyle = SNOW; poly(c, snow); c.fill();
    // ridges running down
    c.strokeStyle = 'rgba(70,85,120,.55)'; c.lineWidth = 1.6; c.beginPath();
    for (let i = -5; i <= 5; i++) {
      if (!i) continue;
      const x0 = peak[0] + i * 9, x1 = peak[0] + i * 62;
      c.moveTo(x0, slope(x0) + 10); c.quadraticCurveTo((x0 + x1) / 2 + i * 6, (slope(x0) + slope(x1)) / 2 + 30, x1, slope(x1) + 90);
    }
    c.stroke();
    c.restore();
  }, { t: 1.0, d: 2.0, reveal: 'rise', ease: 'inOut' });
  p.pen('fuji', outline.filter(([x, y]) => y < base - 2), SUMI, 2.4, { t: 1.2, d: 2.2 });
}

// bands of mist: long rounded strips, a printer's way of saying distance
function mist(p, r, layer, bands, t0) {
  bands.forEach(([x, y, w, h], i) => {
    const pts = [];
    for (let a = -Math.PI / 2; a <= Math.PI / 2 + 1e-6; a += Math.PI / 12) pts.push([x + w + Math.cos(a) * h, y + Math.sin(a) * h]);
    for (let a = Math.PI / 2; a <= Math.PI * 1.5 + 1e-6; a += Math.PI / 12) pts.push([x + Math.cos(a) * h, y + Math.sin(a) * h]);
    p.group(layer, boxOf(pts, 4), (c) => {
      const g = c.createLinearGradient(0, y - h, 0, y + h);
      g.addColorStop(0, 'rgba(250,236,214,.98)'); g.addColorStop(1, 'rgba(246,214,182,.92)');
      c.fillStyle = g; poly(c, pts); c.fill();
      c.strokeStyle = 'rgba(29,34,56,.35)'; c.lineWidth = 1.2; poly(c, pts); c.stroke();
    }, { t: t0 + i * 0.35, d: 1.6, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
}

// ---------------------------------------------------------------- the city
// rows of tiled roofs, far and pale to near and dark, with a few modern blocks
function town(p, r) {
  // the far skyline: pale blocks against the mist
  const far = [];
  for (let x = IX - 20; x < IX + IW + 20;) {
    const w = r.range(18, 60), h = r.range(30, 150) * (r.chance(0.12) ? 1.8 : 1);
    far.push([x, w, h]); x += w + r.range(-4, 8);
  }
  p.group('far', { x: IX, y: 760, w: IW, h: 320 }, (c) => {
    for (const [x, w, h] of far) {
      c.fillStyle = mix('#9aa3bf', PEACH, 0.35); c.fillRect(x, 1060 - h, w, h);
      c.fillStyle = mix('#7d88a8', PEACH, 0.3); c.fillRect(x + w * 0.7, 1060 - h, w * 0.3, h);
      c.fillStyle = 'rgba(255,240,210,.5)';
      for (let y = 1060 - h + 8; y < 1050; y += 9) for (let xx = x + 4; xx < x + w * 0.65; xx += 7) c.fillRect(xx, y, 3, 3);
    }
    c.fillStyle = mix('#9aa3bf', PEACH, 0.4); c.fillRect(IX, 1056, IW, 40);
  }, { t: 3.0, d: 1.4, reveal: 'rise' });

  const rows = 9;
  for (let k = 0; k < rows; k++) {
    const f = k / (rows - 1);
    const y = lerp(1080, 1580, f ** 1.2), s = lerp(0.42, 1.15, f);
    const fade = lerp(0.55, 0, f);
    const items = [];
    for (let x = IX - 60 + r() * 60; x < IX + IW + 40;) {
      const roll = r();
      if (roll < 0.09 && k > 1) {
        items.push({ kind: 'pine', x: x + 30 * s, s: s * r.range(0.8, 1.2) });
        x += r.range(40, 80) * s; continue;
      }
      if (roll < 0.13 && k > 0 && k < rows - 1) {
        const w = r.range(170, 240) * s;
        items.push({ kind: 'temple', x, w, h: 44 * s, rh: 70 * s });
        x += w + r.range(0, 20) * s; continue;
      }
      const w = r.range(54, 160) * s;
      const tall = r.chance(0.3);
      items.push({ kind: r.chance(0.22) ? 'hip' : 'gable', x, w, h: (tall ? r.range(56, 72) : r.range(24, 40)) * s, rh: r.range(22, 38) * s, lamp: r.chance(0.22), two: tall && r.chance(0.7), kura: !tall && r.chance(0.12), tone: r.pick([ROOF, ROOF, '#4a4f60', '#5a4a48', '#44546a']) });
      x += w + r.range(-16, 10) * s;
    }
    p.group(y < 1300 ? 'roofsFar' : 'roofs', { x: IX - 60, y: y - 170 * s, w: IW + 120, h: 190 * s + 30 }, (c) => {
      for (const it of items) {
        if (it.kind === 'pine') pine(c, it.x, y, it.s, fade);
        else house(c, it, y, s, fade);
      }
    }, { t: 3.6 + k * 0.42, d: 0.9, reveal: 'rise' });
  }
}

function pine(c, x, y, s, fade) {
  const col = mix(PINE, '#a3b0b8', fade), dk = mix(shade(PINE, 0.7), '#98a4b0', fade);
  c.strokeStyle = mix('#3a2c28', '#9a96a0', fade); c.lineWidth = 4 * s;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 8 * s, y - 40 * s, x + 4 * s, y - 80 * s); c.stroke();
  for (const [dx, dy, w] of [[-26, -58, 34], [18, -72, 30], [-6, -96, 26], [24, -44, 22]]) {
    c.fillStyle = dk; c.beginPath(); c.ellipse(x + dx * s, y + dy * s + 3 * s, w * s, 9 * s, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = col; c.beginPath(); c.ellipse(x + dx * s - 2 * s, y + dy * s, w * s * 0.92, 7.5 * s, 0, 0, Math.PI * 2); c.fill();
  }
}

function house(c, hs, y, s, fade) {
  const { x, w, rh } = hs;
  let h = hs.h;
  const wall = mix(hs.kura ? '#f4efe2' : '#ece2cc', PEACH, fade * 0.6), timber = mix('#4b3a33', '#a59aa0', fade);
  const tone = hs.kind === 'temple' ? '#3b4a52' : hs.tone || ROOF;
  const roof = mix(tone, '#a8afc4', fade), roofD = mix(shade(tone, 0.7), '#a0a6bb', fade);
  if (hs.kind === 'temple') {
    // a temple hall: red posts under a great hipped roof
    c.fillStyle = mix('#efe3c8', PEACH, fade * 0.6); c.fillRect(x + w * 0.1, y - h, w * 0.8, h);
    c.fillStyle = mix(VERMILION, PEACH, fade);
    for (let i = 0; i <= 6; i++) c.fillRect(x + w * 0.1 + (w * 0.8 * i) / 6 - 3 * s, y - h, 6 * s, h);
    const eave = y - h, top = eave - rh;
    const pts = [];
    for (let k = 0; k <= 16; k++) { const f = k / 16 * 2 - 1; pts.push([x + w / 2 + f * w * 0.62, eave + 4 * s - Math.abs(f) ** 5 * 16 * s]); }
    pts.push([x + w * 0.78, top], [x + w * 0.22, top]);
    c.fillStyle = roof; poly(c, pts); c.fill();
    c.strokeStyle = mix(SUMI, '#9aa0b8', fade); c.lineWidth = Math.max(0.6, 1.6 * s); poly(c, pts); c.stroke();
    c.lineWidth = Math.max(1, 4 * s); c.beginPath(); c.moveTo(x + w * 0.2, top - 2 * s); c.lineTo(x + w * 0.8, top - 2 * s); c.stroke();
    return;
  }
  if (hs.two) {
    // a two-story house: a lower roof partway up the wall
    const lower = y - h * 0.48;
    c.fillStyle = wall; c.fillRect(x + w * 0.06, y - h, w * 0.88, h);
    c.strokeStyle = timber; c.lineWidth = Math.max(0.6, 1.4 * s); c.strokeRect(x + w * 0.06, y - h, w * 0.88, h);
    c.fillStyle = mix('#5a463c', '#aaa2a4', fade);
    for (let xx = x + w * 0.12; xx < x + w * 0.88; xx += 5 * s) c.fillRect(xx, y - h * 0.92, 1.6 * s, h * 0.36);
    const lp = [[x - w * 0.02, lower + 6 * s], [x + w * 1.02, lower + 6 * s], [x + w * 0.94, lower - 8 * s], [x + w * 0.06, lower - 8 * s]];
    c.fillStyle = roof; poly(c, lp); c.fill(); c.strokeStyle = mix(SUMI, '#9aa0b8', fade); c.stroke();
  }
  // the wall, with its posts and a lit window
  if (!hs.two) { c.fillStyle = wall; c.fillRect(x + w * 0.06, y - h, w * 0.88, h); }
  if (hs.kura) { c.fillStyle = mix('#2c2a30', '#9a96a0', fade); c.fillRect(x + w * 0.06, y - h * 0.35, w * 0.88, h * 0.35); }
  c.strokeStyle = timber; c.lineWidth = Math.max(0.6, 1.4 * s);
  c.strokeRect(x + w * 0.06, y - h, w * 0.88, h);
  c.beginPath();
  for (let i = 1; i < 4; i++) { const xx = x + w * 0.06 + (w * 0.88 * i) / 4; c.moveTo(xx, y - h); c.lineTo(xx, y); }
  c.stroke();
  if (hs.lamp) { c.fillStyle = mix('#f2b45a', PEACH, fade); c.fillRect(x + w * 0.3, y - h * 0.75, w * 0.18, h * 0.45); }
  // the roof: a low gable or a hip, with tiles and a ridge
  const eave = y - h, top = eave - rh;
  const pts = hs.kind === 'gable'
    ? [[x - w * 0.04, eave + 2 * s], [x + w * 1.04, eave + 2 * s], [x + w * 0.9, top], [x + w * 0.1, top]]
    : [[x - w * 0.04, eave + 2 * s], [x + w * 1.04, eave + 2 * s], [x + w * 0.7, top], [x + w * 0.3, top]];
  c.fillStyle = roof; poly(c, pts); c.fill();
  c.save(); poly(c, pts); c.clip();
  c.strokeStyle = roofD; c.lineWidth = Math.max(0.5, 1.2 * s); c.beginPath();
  for (let xx = x - w * 0.1; xx < x + w * 1.1; xx += 5 * s) { c.moveTo(xx, eave + 4 * s); c.lineTo(xx + (xx - (x + w / 2)) * -0.25, top); }
  c.stroke();
  c.restore();
  c.strokeStyle = mix(SUMI, '#9aa0b8', fade); c.lineWidth = Math.max(0.6, 1.6 * s); poly(c, pts); c.stroke();
  // the ridge, its ends turned up
  c.lineWidth = Math.max(1, 3.4 * s); c.beginPath();
  c.moveTo(pts[3][0] - 4 * s, top - 3 * s); c.lineTo(pts[2][0] + 4 * s, top - 3 * s); c.stroke();
}

// ---------------------------------------------------------------- the tower
function tower(p, r) {
  const cx = 1205, base = 1300, top = 330;
  const H0 = base - top;
  const half = (y) => { const f = (base - y) / H0; return 175 * (1 - f) ** 2.1 + 9; };
  const deck1 = base - H0 * 0.42, deck2 = base - H0 * 0.68, mast = base - H0 * 0.76;
  const legs = [];
  for (let y = base; y >= mast; y -= 6) legs.push([y, half(y)]);
  const outline = [...legs.map(([y, h]) => [cx - h, y]), ...legs.slice().reverse().map(([y, h]) => [cx + h, y])];
  p.group('tower', { x: cx - 200, y: top - 10, w: 400, h: base - top + 20 }, (c) => {
    // the body in orange, with white bands up the top half
    c.save();
    c.beginPath(); poly(c, outline);
    // the arch between the legs
    c.moveTo(cx - 120, base); c.quadraticCurveTo(cx, base - 260, cx + 120, base); c.closePath();
    c.clip('evenodd');
    c.fillStyle = VERMILION; c.fillRect(cx - 200, top, 400, H0);
    c.fillStyle = '#f2ead8';
    for (let i = 0; i < 7; i++) {
      const y0 = lerp(deck1 - 10, mast, i / 7);
      if (i % 2) c.fillRect(cx - 200, y0 - (deck1 - mast) / 14, 400, (deck1 - mast) / 7);
    }
    c.fillStyle = 'rgba(80,20,20,.28)'; c.fillRect(cx + 8, top, 200, H0);
    // the lattice: crossed braces between the legs, panel by panel
    c.strokeStyle = 'rgba(40,16,20,.75)'; c.lineWidth = 1;
    c.beginPath();
    let y = base;
    while (y > mast) {
      const h0 = half(y), step = Math.max(14, h0 * 0.38);
      const y1 = y - step, h1 = half(y1);
      for (const side of [-1, 1]) {
        c.moveTo(cx + side * h0, y); c.lineTo(cx, y1); c.moveTo(cx, y); c.lineTo(cx + side * h1, y1);
      }
      c.moveTo(cx - h1, y1); c.lineTo(cx + h1, y1);
      y = y1;
    }
    c.stroke();
    c.restore();
    c.strokeStyle = SUMI; c.lineWidth = 1.8; poly(c, outline); c.stroke();
    c.beginPath(); c.moveTo(cx - 120, base); c.quadraticCurveTo(cx, base - 260, cx + 120, base); c.stroke();
    // the decks
    const deck = (yy, w, h) => {
      c.fillStyle = '#f2ead8'; c.fillRect(cx - w, yy - h, 2 * w, h);
      c.fillStyle = '#2a3657'; c.fillRect(cx - w + 4, yy - h + 5, 2 * w - 8, h - 12);
      c.fillStyle = 'rgba(255,214,140,.75)';
      for (let xx = cx - w + 8; xx < cx + w - 8; xx += 9) c.fillRect(xx, yy - h + 8, 4, h - 18);
      c.strokeStyle = SUMI; c.lineWidth = 1.4; c.strokeRect(cx - w, yy - h, 2 * w, h);
    };
    deck(deck1, half(deck1) + 26, 40);
    deck(deck2, half(deck2) + 14, 22);
    // the mast, banded
    const mh = mast - top;
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? '#f2ead8' : VERMILION;
      const w = lerp(8, 2.5, i / 8);
      c.fillRect(cx - w, mast - (mh * (i + 1)) / 8, 2 * w, mh / 8 + 1);
    }
    c.strokeStyle = SUMI; c.lineWidth = 1; c.strokeRect(cx - 8, mast - mh, 16, mh);
  }, { t: 5.0, d: 2.4, reveal: 'rise', ease: 'inOut' });
  // a light at the top that blinks in the dusk
  p.live('tower', {
    t: 7.6, d: 0.5, reveal: 'fade',
    draw: (c, time) => {
      const on = (time % 2.4) < 1.1;
      c.fillStyle = on ? 'rgba(255,90,70,.95)' : 'rgba(150,40,40,.6)';
      c.beginPath(); c.arc(cx, top - 2, on ? 4.5 : 3, 0, Math.PI * 2); c.fill();
      if (on) { c.fillStyle = 'rgba(255,120,90,.25)'; c.beginPath(); c.arc(cx, top - 2, 14, 0, Math.PI * 2); c.fill(); }
    },
  });
}

// ---------------------------------------------------------------- the river
function river(p, r) {
  const y0 = 1600;
  p.group('river', { x: IX, y: y0, w: IW, h: IY + IH - y0 }, (c) => {
    const g = c.createLinearGradient(0, y0, 0, IY + IH);
    g.addColorStop(0, '#6f8fb5'); g.addColorStop(0.35, WATER); g.addColorStop(1, '#1a2c55');
    c.fillStyle = g; c.fillRect(IX, y0, IW, IY + IH - y0);
    // the bank
    c.fillStyle = '#6b6a6e'; c.fillRect(IX, y0 - 6, IW, 12);
    c.strokeStyle = SUMI; c.lineWidth = 1.5; c.beginPath(); c.moveTo(IX, y0 + 6); c.lineTo(IX + IW, y0 + 6); c.stroke();
  }, { t: 6.8, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // the water's lines, as a carver cuts them
  const rows = 16;
  for (let k = 0; k < rows; k++) {
    const y = lerp(y0 + 22, IY + IH - 10, k / (rows - 1));
    const lines = [];
    const amp = lerp(2, 7, k / rows), len = lerp(50, 160, k / rows);
    for (let x = IX - r() * len; x < IX + IW; x += len * r.range(0.9, 1.4)) {
      const pts = [];
      for (let i = 0; i <= 12; i++) { const xx = x + (i / 12) * len; pts.push([xx, y + Math.sin((i / 12) * Math.PI * 2) * amp]); }
      lines.push(pts);
    }
    p.strokes('river', lines, k % 3 === 2 ? 'rgba(240,232,214,.75)' : 'rgba(150,180,215,.6)', lerp(1, 2.4, k / rows), { t: 7.2 + k * 0.08, d: 0.9, reveal: k % 2 ? 'wipeL' : 'wipe' });
  }
  // the sun's path on the water
  p.group('river', { x: 940, y: y0, w: 180, h: 260 }, (c) => {
    c.fillStyle = 'rgba(240,140,100,.55)';
    for (let i = 0; i < 12; i++) { const yy = y0 + 18 + i * 18, w = 70 - i * 4; c.fillRect(1020 - w / 2 + Math.sin(i) * 8, yy, w, 4); }
  }, { t: 8.2, d: 1.0, reveal: 'fade' });
}

// ---------------------------------------------------------------- the pagoda
function pagoda(p, r) {
  const cx = 330, foot = 1596;
  const tiers = 5;
  // the stone base and the steps
  p.group('pagoda', { x: cx - 190, y: foot - 60, w: 380, h: 80 }, (c) => {
    c.fillStyle = '#b5ad9e'; c.fillRect(cx - 170, foot - 40, 340, 40);
    c.fillStyle = '#8e8678'; c.fillRect(cx + 40, foot - 40, 130, 40);
    c.strokeStyle = SUMI; c.lineWidth = 1.6; c.strokeRect(cx - 170, foot - 40, 340, 40);
    c.fillStyle = '#c9c1b2'; c.fillRect(cx - 40, foot - 40, 80, 40); c.strokeRect(cx - 40, foot - 40, 80, 40);
    c.beginPath(); for (let i = 1; i < 4; i++) { c.moveTo(cx - 40, foot - i * 10); c.lineTo(cx + 40, foot - i * 10); } c.stroke();
  }, { t: 7.6, d: 0.8, reveal: 'rise' });
  let y = foot - 40;
  for (let i = 0; i < tiers; i++) {
    const bw = lerp(120, 70, i / (tiers - 1)), bh = i === 0 ? 120 : 92;
    const rw = bw + lerp(120, 80, i / (tiers - 1)), rh = 44;
    const yb = y;
    p.group('pagoda', { x: cx - rw - 30, y: yb - bh - rh - 40, w: 2 * rw + 60, h: bh + rh + 50 }, (c) => {
      // the body: vermilion posts, white panels, a dark door
      c.fillStyle = '#f0e6d2'; c.fillRect(cx - bw, yb - bh, 2 * bw, bh);
      c.fillStyle = VERMILION;
      for (const f of [-1, -0.45, 0.45, 1]) c.fillRect(cx + f * bw - (f > 0 ? 12 : 0), yb - bh, 12, bh);
      c.fillRect(cx - bw, yb - bh, 2 * bw, 12);
      c.fillStyle = '#3a2a2a'; c.fillRect(cx - bw * 0.3, yb - bh * 0.78, bw * 0.6, bh * 0.78);
      c.fillStyle = 'rgba(60,20,20,.25)'; c.fillRect(cx + bw * 0.35, yb - bh, bw * 0.65, bh);
      c.strokeStyle = SUMI; c.lineWidth = 1.4; c.strokeRect(cx - bw, yb - bh, 2 * bw, bh);
      // brackets under the eave
      c.fillStyle = '#d8b85a';
      for (let x = cx - bw - 10; x <= cx + bw + 10; x += 16) c.fillRect(x - 3, yb - bh - 14, 6, 10);
      // the roof: a deep eave whose ends sweep up
      const ey = yb - bh - 6;
      const roof = [];
      for (let k = 0; k <= 24; k++) { const f = k / 24 * 2 - 1; roof.push([cx + f * rw, ey + 8 - Math.abs(f) ** 5 * 34 + (1 - f * f) * 6]); }
      roof.push([cx + rw * 0.55, ey - rh], [cx - rw * 0.55, ey - rh]);
      c.fillStyle = ROOF; poly(c, roof); c.fill();
      c.save(); poly(c, roof); c.clip();
      c.strokeStyle = '#2b3245'; c.lineWidth = 1.3; c.beginPath();
      for (let x = cx - rw; x < cx + rw; x += 7) { c.moveTo(x, ey + 12); c.lineTo(cx + (x - cx) * 0.55, ey - rh); }
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(cx - rw, ey - rh, rw * 0.8, rh + 20);
      c.restore();
      c.strokeStyle = SUMI; c.lineWidth = 1.8; poly(c, roof); c.stroke();
      // the eave's lit underside edge
      c.strokeStyle = '#d8b85a'; c.lineWidth = 3; c.beginPath();
      roof.slice(0, 25).forEach(([x, yy], k) => (k ? c.lineTo(x, yy + 3) : c.moveTo(x, yy + 3))); c.stroke();
      // bells at the corners
      c.fillStyle = '#d8b85a'; c.strokeStyle = SUMI; c.lineWidth = 1;
      for (const sgn of [-1, 1]) { const bx = cx + sgn * rw, by = ey - 22; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + 12); c.stroke(); c.beginPath(); c.arc(bx, by + 15, 4, 0, Math.PI * 2); c.fill(); c.stroke(); }
    }, { t: 8.0 + i * 0.45, d: 0.8, reveal: 'drop', dy: 40 });
    y = yb - bh - 6 - rh + 4;
  }
  // the finial: nine rings and a flame
  p.group('pagoda', { x: cx - 30, y: y - 240, w: 60, h: 250 }, (c) => {
    c.fillStyle = '#c49a3e'; c.fillRect(cx - 4, y - 220, 8, 220);
    c.strokeStyle = SUMI; c.lineWidth = 1; c.strokeRect(cx - 4, y - 220, 8, 220);
    for (let i = 0; i < 9; i++) { const yy = y - 40 - i * 17; c.beginPath(); c.ellipse(cx, yy, 15 - i * 0.6, 4, 0, 0, Math.PI * 2); c.fillStyle = '#d8b85a'; c.fill(); c.stroke(); }
    c.fillStyle = '#d8b85a'; poly(c, [[cx - 9, y - 210], [cx + 9, y - 210], [cx, y - 246]]); c.fill(); c.stroke();
  }, { t: 10.3, d: 0.8, reveal: 'rise' });
}

// ---------------------------------------------------------------- the bridge
function bridge(p, r) {
  const x0 = 860, x1 = 1600, y0 = 1650, rise = 120;
  const arc = (f) => y0 - Math.sin(f * Math.PI) * rise;
  const deck = [];
  for (let k = 0; k <= 40; k++) { const f = k / 40; deck.push([lerp(x0, x1, f), arc(f)]); }
  p.group('bridge', { x: x0 - 10, y: y0 - rise - 70, w: x1 - x0 + 20, h: rise + 260 }, (c) => {
    // posts in the water
    c.fillStyle = '#5a3a32';
    for (let k = 2; k < 40; k += 6) { const [x, yy] = deck[k]; c.fillRect(x - 6, yy, 12, 1800 - yy); c.strokeStyle = SUMI; c.lineWidth = 1.2; c.strokeRect(x - 6, yy, 12, 1800 - yy); }
    // the deck
    const body = [...deck.map(([x, yy]) => [x, yy]), ...deck.slice().reverse().map(([x, yy]) => [x, yy + 26])];
    c.fillStyle = RED; poly(c, body); c.fill();
    c.fillStyle = 'rgba(60,10,10,.3)'; poly(c, [...deck.map(([x, yy]) => [x, yy + 14]), ...deck.slice().reverse().map(([x, yy]) => [x, yy + 26])]); c.fill();
    c.strokeStyle = SUMI; c.lineWidth = 1.6; poly(c, body); c.stroke();
    // the rail with its posts and caps
    c.strokeStyle = RED; c.lineWidth = 6; c.beginPath();
    deck.forEach(([x, yy], k) => (k ? c.lineTo(x, yy - 46) : c.moveTo(x, yy - 46))); c.stroke();
    c.lineWidth = 3; c.beginPath(); deck.forEach(([x, yy], k) => (k ? c.lineTo(x, yy - 24) : c.moveTo(x, yy - 24))); c.stroke();
    c.lineWidth = 8;
    for (let k = 0; k <= 40; k += 5) { const [x, yy] = deck[k]; c.beginPath(); c.moveTo(x, yy); c.lineTo(x, yy - 52); c.stroke(); }
    c.fillStyle = '#d8b85a'; c.strokeStyle = SUMI; c.lineWidth = 1;
    for (let k = 0; k <= 40; k += 5) { const [x, yy] = deck[k]; c.beginPath(); c.moveTo(x - 6, yy - 52); c.quadraticCurveTo(x, yy - 70, x + 6, yy - 52); c.closePath(); c.fill(); c.stroke(); }
  }, { t: 9.4, d: 1.4, reveal: 'wipeL', ease: 'inOut' });
  // people crossing, with paper umbrellas
  for (let i = 0; i < 3; i++) {
    const ph = r(), sp = r.range(0.01, 0.018) * (i % 2 ? 1 : -1);
    const col = [VERMILION, '#e8d9b0', '#3c6b8a'][i];
    p.live('bridge', {
      t: 11 + i * 0.3, d: 0.8, reveal: 'fade',
      draw: (c, time) => {
        let f = (ph + time * sp) % 1; if (f < 0) f += 1;
        f = 0.08 + f * 0.84;
        const x = lerp(x0, x1, f), yy = arc(f) - 2;
        const bob = Math.abs(Math.sin(time * 4 + i)) * 1.5;
        c.fillStyle = '#1f2236'; c.fillRect(x - 4, yy - 26 - bob, 8, 24);
        c.fillStyle = col; c.beginPath(); c.moveTo(x - 20, yy - 30 - bob); c.quadraticCurveTo(x, yy - 52 - bob, x + 20, yy - 30 - bob); c.closePath(); c.fill();
        c.strokeStyle = SUMI; c.lineWidth = 1; c.stroke();
      },
    });
  }
}

// ---------------------------------------------------------------- boats
function boats(p, r) {
  p.live('boats', {
    t: 10.4, d: 1.2, reveal: 'slide', dx: -160,
    draw: (c, time) => {
      const x = 660 - Math.min(time, 80) * 2.2, y = 1760 + Math.sin(time * 1.1) * 2;
      // a roofed pleasure boat with its lanterns
      c.fillStyle = '#4a2f28'; poly(c, [[x - 150, y - 24], [x + 170, y - 24], [x + 140, y], [x - 130, y]]); c.fill();
      c.strokeStyle = SUMI; c.lineWidth = 1.4; c.stroke();
      c.fillStyle = '#f1e3c4'; c.fillRect(x - 120, y - 74, 240, 50);
      c.fillStyle = 'rgba(255,196,110,.9)';
      for (let i = 0; i < 8; i++) c.fillRect(x - 112 + i * 29, y - 66, 20, 32);
      c.strokeStyle = SUMI; c.strokeRect(x - 120, y - 74, 240, 50);
      c.fillStyle = ROOF; poly(c, [[x - 140, y - 74], [x + 140, y - 74], [x + 112, y - 96], [x - 112, y - 96]]); c.fill(); c.stroke();
      for (let i = 0; i < 6; i++) {
        const lx = x - 110 + i * 44, ly = y - 90 + Math.sin(time * 2 + i) * 1.5;
        c.beginPath(); c.moveTo(lx, y - 96); c.lineTo(lx, ly); c.stroke();
        c.fillStyle = RED; c.beginPath(); c.ellipse(lx, ly + 9, 7, 10, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      }
      // its light on the water
      c.fillStyle = 'rgba(255,200,120,.35)';
      for (let i = 0; i < 4; i++) c.fillRect(x - 100 + Math.sin(time + i) * 6, y + 8 + i * 10, 200 - i * 40, 3);
    },
  });
  // a flight of birds across the sky
  for (let i = 0; i < 7; i++) {
    const dx = (i - 3) * 26, dy = Math.abs(i - 3) * 14;
    p.live('boats', {
      t: 3.4, d: 1, reveal: 'fade',
      draw: (c, time) => {
        const x = ((time * 26 + 300) % 1900) - 150 + dx, y = 300 + dy + Math.sin(time * 0.4) * 12;
        const fl = Math.sin(time * 5 + i) * 3;
        c.strokeStyle = SUMI; c.lineWidth = 1.6; c.beginPath();
        c.moveTo(x - 9, y - 1 + fl); c.quadraticCurveTo(x - 4, y - 5, x, y); c.quadraticCurveTo(x + 4, y - 5, x + 9, y - 1 + fl); c.stroke();
      },
    });
  }
}

// ---------------------------------------------------------------- the cherry branch
function branch(p, r) {
  const segs = [];
  const blossoms = [];
  const grow = (x, y, a, len, w, depth, t) => {
    const n = 6;
    const pts = [[x, y]];
    let xx = x, yy = y, aa = a;
    for (let i = 0; i < n; i++) {
      aa += r.range(-0.22, 0.22);
      xx += Math.cos(aa) * len / n; yy += Math.sin(aa) * len / n;
      pts.push([xx, yy]);
    }
    segs.push({ pts, w, t, d: 0.5 + len / 700 });
    // flowers along the twigs
    if (depth >= 2) for (let i = 1; i < pts.length; i++) if (r.chance(0.8)) blossoms.push({ x: pts[i][0] + r.range(-14, 14), y: pts[i][1] + r.range(-12, 14), s: r.range(0.7, 1.25), t: t + 0.8 + r() * 0.8 });
    if (depth >= 4) return;
    const kids = depth === 0 ? 4 : r.int(2, 3);
    for (let k = 0; k < kids; k++) {
      const at = pts[r.int(2, n)];
      grow(at[0], at[1], aa + r.range(-0.7, 0.9) + (depth === 0 ? 0.25 : 0), len * r.range(0.4, 0.62), w * 0.6, depth + 1, t + 0.35 + depth * 0.25);
    }
  };
  grow(IX - 20, 110, 0.12, 560, 20, 0, 10.0);
  for (const sg of segs) p.pen('branch', sg.pts, '#2c2228', sg.w, { t: sg.t, d: sg.d, ease: 'soft' });
  blossoms.sort((a, b) => a.t - b.t);
  for (let i = 0; i < blossoms.length; i += 8) {
    const group = blossoms.slice(i, i + 8);
    const pts = group.map((b) => [b.x, b.y]);
    p.group('branch', boxOf(pts, 20), (c) => { for (const b of group) flower(c, b.x, b.y, b.s); }, { t: group[0].t, d: 0.7, reveal: 'pop' });
  }
  // petals falling
  for (let i = 0; i < 14; i++) {
    const x0 = r.range(80, 1100), ph = r(), sp = r.range(0.035, 0.06), sw = r.range(20, 60);
    p.live('branch', {
      t: 12 + i * 0.1, d: 1, reveal: 'fade',
      draw: (c, time) => {
        const f = (ph + time * sp) % 1;
        const x = x0 + f * 420 + Math.sin(time * 1.3 + i) * sw, y = 200 + f * 1500;
        c.save(); c.translate(x, y); c.rotate(time * 2 + i);
        c.fillStyle = SAKURA; c.beginPath(); c.ellipse(0, 0, 6, 3.5, 0, 0, Math.PI * 2); c.fill();
        c.restore();
      },
    });
  }
}

function flower(c, x, y, s) {
  c.fillStyle = SAKURA;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + s;
    c.beginPath(); c.ellipse(x + Math.cos(a) * 6 * s, y + Math.sin(a) * 6 * s, 6 * s, 4.4 * s, a, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = SAKURA_D; c.lineWidth = 0.8;
  c.beginPath(); c.arc(x, y, 9 * s, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#c0475d'; c.beginPath(); c.arc(x, y, 2.4 * s, 0, Math.PI * 2); c.fill();
}

// ---------------------------------------------------------------- title, seal and border
function title(p) {
  // the picture's border, cut as a block line
  const rect = [[IX, IY], [IX + IW, IY], [IX + IW, IY + IH], [IX, IY + IH], [IX, IY]];
  p.pen('frame', rect, SUMI, 3, { t: 0.2, d: 1.6, cap: 'square' });
  // the cartouche, top right, with the name down it
  const cx = 1418, cy = 120, cw = 112, ch = 330;
  p.group('title', { x: cx - 6, y: cy - 6, w: cw + 12, h: ch + 12 }, (c) => {
    c.fillStyle = '#f4ead4'; c.fillRect(cx, cy, cw, ch);
    c.strokeStyle = VERMILION; c.lineWidth = 6; c.strokeRect(cx + 7, cy + 7, cw - 14, ch - 14);
    c.strokeStyle = SUMI; c.lineWidth = 1.5; c.strokeRect(cx, cy, cw, ch);
  }, { t: 11.2, d: 0.8, reveal: 'fall' });
  p.type('title', '東', cx + cw / 2, cy + 150, { family: '"Shippori Mincho B1", serif', weight: 800, size: 104, color: SUMI, align: 'center', t: 11.7, d: 0.8 });
  p.type('title', '京', cx + cw / 2, cy + 275, { family: '"Shippori Mincho B1", serif', weight: 800, size: 104, color: SUMI, align: 'center', t: 11.9, d: 0.8 });
  // the name in the margin, set wide
  p.type('title', 'TOKYO', W / 2, 1930, { family: '"Shippori Mincho B1", serif', weight: 800, size: 128, color: SUMI, align: 'center', track: 0.55, t: 12.2, gap: 0.14, d: 0.8 });
  p.type('title', 'EDO・TOKYO', 200, 1905, { family: '"Shippori Mincho B1", serif', weight: 500, size: 26, color: mix(SUMI, PAPER, 0.25), align: 'center', track: 0.3, t: 12.9, gap: 0.03, d: 0.6, reveal: 'fade' });
  // the red seal
  p.group('title', { x: 1360, y: 1850, w: 110, h: 110 }, (c) => {
    c.fillStyle = '#c23a2c'; c.fillRect(1372, 1862, 84, 84);
    c.fillStyle = PAPER; c.font = '800 56px "Shippori Mincho B1", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('京', 1414, 1906);
    c.strokeStyle = PAPER; c.lineWidth = 3; c.strokeRect(1378, 1868, 72, 72);
  }, { t: 13.2, d: 0.6, reveal: 'press' });
}
