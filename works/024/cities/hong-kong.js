// Hong Kong: night over Victoria Harbour, seen from the Kowloon side. The Peak's
// dark ridge, the island's towers lit window by window, the harbor holding every
// light upside down, a junk under red battened sails, a ferry crossing, and the
// street's neon signs hung out over it all. The title is bent in glass tubes.

import { Plate, W, H, boxOf } from '../print.js';
import { mix, lerp, clamp, smooth, poly, rng, hex } from '../kit.js';

const NIGHT = '#0d0b1f';
const RIDGE = '#181430', RIDGE_L = '#2c2150';
const TOWER = ['#171838', '#1a1b3f', '#141532', '#1d1a3c', '#16193a'];
const BACK = ['#221f46', '#26224b', '#1f1d42'];
const WARM = '#ffd98a', WHITE = '#e9f1ff', COOL = '#9fd8ff', GOLDL = '#ffc65a';
const NEON = { red: '#ff3d4f', pink: '#ff5ab4', cyan: '#43ecff', yellow: '#ffd640', green: '#53ff9e', orange: '#ff8a3a', violet: '#b57bff' };
const SAIL = '#b92d26', SAIL_D = '#8e1f1c';

const SIGN_TEXT = '香港酒家茶樓金行大押麻雀涼茶夜市冰室海鮮粥麵藥行東方之珠';
export const city = {
  id: 'hong-kong', name: 'Hong Kong', wall: '#120a1a',
  alt: "Victoria Harbour at night: towers lit window by window, the Bank of China Tower, neon signs in Chinese, a red-sailed junk and a Star Ferry, the title in pink neon",
  google: 'family=Tilt+Neon&family=Noto+Sans+TC:wght@900',
  fonts: ['400 100px "Tilt Neon"', ['900 100px "Noto Sans TC"', SIGN_TEXT]],
  build,
};

const SHORE = 1290, PROM = 1828;
const CJK = '"Noto Sans TC", sans-serif', TUBE = '"Tilt Neon", sans-serif';

// ---------------------------------------------------------------- glass tubes
const rgba = (c, a) => { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; };
// a glow built of wide, faint strokes, so it scales with the sheet
function glow(c, path, color, w, k = 1) {
  for (const [m, a] of [[9, 0.05], [5.5, 0.08], [3.2, 0.14], [1.9, 0.3]]) {
    c.strokeStyle = rgba(color, a * k); c.lineWidth = w * m; path(); c.stroke();
  }
  c.strokeStyle = color; c.lineWidth = w; path(); c.stroke();
  c.strokeStyle = rgba('#ffffff', 0.65 * k); c.lineWidth = w * 0.38; path(); c.stroke();
}
function glowText(c, ch, x, y, size, font, color, k = 1) {
  c.font = `${font.w} ${size}px ${font.f}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round';
  for (const [m, a] of [[0.34, 0.05], [0.2, 0.09], [0.11, 0.16], [0.055, 0.32]]) {
    c.strokeStyle = rgba(color, a * k); c.lineWidth = size * m; c.strokeText(ch, x, y);
  }
  c.fillStyle = color; c.fillText(ch, x, y);
  c.strokeStyle = rgba(mix(color, '#ffffff', 0.6), 0.9 * k); c.lineWidth = size * 0.012; c.strokeText(ch, x, y);
}
// a tube lighting up: dark, a stutter, then on
function flick(q, seed) {
  if (q >= 0.82) return 1;
  if (q < 0.12) return 0;
  const n = Math.sin(seed * 91.7 + Math.floor(q * 26) * 12.9898) * 43758.5453;
  return n - Math.floor(n) < q * 1.15 ? 1 : 0.12;
}
function rrect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

function build() {
  const p = new Plate({ paper: NIGHT, seed: 1841 });
  const r = p.r;
  p.stack('sky', 'ridge', 'water', 'back', 'towers', 'marks', 'shore', 'reflect', 'ferry', 'junk', 'kowloon', 'signs', 'promenade', 'title', 'frame');
  p.layer('frame', { clip: false });

  sky(p, r);
  ridge(p, r);
  water(p, r);
  const lights = skyline(p, r);
  landmarks(p, r, lights);
  shore(p, r, lights);
  reflections(p, r, lights);
  ferry(p, r);
  junk(p, r);
  kowloon(p, r);
  signs(p, r);
  promenade(p, r);
  title(p);
  return p;
}

// ---------------------------------------------------------------- sky
function sky(p, r) {
  p.group('sky', { x: 0, y: 0, w: W, h: SHORE + 20 }, (c) => {
    const g = c.createLinearGradient(0, 0, 0, SHORE);
    g.addColorStop(0, '#08071a'); g.addColorStop(0.35, '#151034'); g.addColorStop(0.62, '#2a1745');
    g.addColorStop(0.82, '#4c1f55'); g.addColorStop(1, '#7a2c5c');
    c.fillStyle = g; c.fillRect(0, 0, W, SHORE + 20);
    // the city's glow on the low cloud
    const h = c.createRadialGradient(800, 1000, 50, 800, 1000, 760);
    h.addColorStop(0, 'rgba(255,120,150,.22)'); h.addColorStop(1, 'rgba(255,120,150,0)');
    c.fillStyle = h; c.fillRect(0, 300, W, 1000);
  }, { t: 0.1, d: 1.6, reveal: 'fade', ease: 'soft' });
  const stars = [];
  for (let i = 0; i < 150; i++) stars.push([r() * W, r() ** 1.7 * 620, 0.6 + r() * 1.5, 0.3 + r() * 0.6]);
  p.group('sky', { x: 0, y: 0, w: W, h: 640 }, (c) => {
    for (const [x, y, s, a] of stars) { c.fillStyle = `rgba(235,230,255,${a})`; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); }
  }, { t: 0.9, d: 1.2, reveal: 'fade' });
  // a thin moon
  p.group('sky', { x: 1330, y: 70, w: 160, h: 160 }, (c) => {
    const hl = c.createRadialGradient(1412, 150, 20, 1412, 150, 76); hl.addColorStop(0, 'rgba(255,240,220,.16)'); hl.addColorStop(1, 'rgba(255,240,220,0)');
    c.fillStyle = hl; c.beginPath(); c.arc(1412, 150, 76, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fbefd8'; c.beginPath(); c.arc(1412, 150, 30, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#100c27'; c.beginPath(); c.arc(1424, 142, 27, 0, Math.PI * 2); c.fill();
  }, { t: 1.3, d: 1.0, reveal: 'fade' });
  // low cloud lit from below
  p.group('sky', { x: 0, y: 760, w: W, h: 200 }, (c) => {
    c.fillStyle = 'rgba(160,70,120,.22)';
    for (const [x, y, w, h] of [[80, 820, 520, 18], [700, 790, 640, 14], [1100, 880, 500, 16], [300, 900, 380, 10]]) { rrect(c, x, y, w, h, h / 2); c.fill(); }
  }, { t: 1.6, d: 1.0, reveal: 'wipe' });
}

// ---------------------------------------------------------------- the Peak
const gauss = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
const ridgeY = (x) => 960 - 250 * gauss(x, 540, 260) - 140 * gauss(x, 1060, 190) - 60 * gauss(x, 300, 120) + 30 * gauss(x, 820, 90) + 6 * Math.sin(x * 0.03) + 60 * smooth(1300, 1600, x);

function ridge(p, r) {
  const pts = []; for (let x = -10; x <= W + 10; x += 8) pts.push([x, ridgeY(x)]);
  const hill = [...pts, [W + 10, SHORE + 10], [-10, SHORE + 10]];
  p.group('ridge', boxOf(hill, 6), (c) => {
    const g = c.createLinearGradient(0, 700, 0, SHORE);
    g.addColorStop(0, RIDGE_L); g.addColorStop(0.3, RIDGE); g.addColorStop(1, '#100d24');
    c.fillStyle = g; poly(c, hill); c.fill();
    // the rim of glow along the crest
    c.strokeStyle = 'rgba(190,110,190,.35)'; c.lineWidth = 2; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    // folds down the slope
    c.strokeStyle = 'rgba(60,45,100,.5)'; c.lineWidth = 3; c.beginPath();
    for (let x = 60; x < W; x += 90) { const y = ridgeY(x); c.moveTo(x, y + 10); c.quadraticCurveTo(x + 30, y + 120, x + 10, y + 260); }
    c.stroke();
  }, { t: 1.0, d: 1.4, reveal: 'rise', ease: 'inOut' });
  // houses on the hillside, a scatter of small lights, and the road along the crest
  const dots = [];
  for (let i = 0; i < 620; i++) {
    const x = r() * W, y = ridgeY(x) + 14 + r() ** 1.4 * (SHORE - ridgeY(x) - 30);
    dots.push([x, y, rgba(r() < 0.7 ? WARM : WHITE, 0.4 + r() * 0.6), 0, r(), r.chance(0.3)]);
  }
  for (let x = 180; x < 1400; x += 14) dots.push([x, ridgeY(x) + 22 + 8 * Math.sin(x * 0.02), rgba('#ffb15c', 0.9), 0, r(), false]);
  p.group('ridge', { x: 0, y: 680, w: W, h: SHORE - 680 }, (c, q) => {
    for (const [x, y, col, , th, big] of dots) {
      if (th > q) continue;
      c.fillStyle = col; c.fillRect(x, y, big ? 3 : 2, 2);
    }
  }, { t: 2.3, d: 1.2, reveal: 'none', ease: 'linear' });
  // the Peak Tower: a lit bowl on its stem, on the crest
  const tx = 560, ty = ridgeY(560) + 6;
  p.group('ridge', { x: tx - 80, y: ty - 80, w: 160, h: 100 }, (c) => {
    c.fillStyle = '#2b2448'; c.fillRect(tx - 24, ty - 30, 48, 34);
    c.fillStyle = 'rgba(255,210,140,.85)'; for (let i = 0; i < 5; i++) c.fillRect(tx - 20 + i * 9, ty - 24, 4, 12);
    // the bowl, its rim turned up at both ends
    c.fillStyle = '#3a3060';
    c.beginPath(); c.moveTo(tx - 46, ty - 58); c.quadraticCurveTo(tx - 30, ty - 44, tx - 22, ty - 30); c.lineTo(tx + 22, ty - 30);
    c.quadraticCurveTo(tx + 30, ty - 44, tx + 46, ty - 58); c.quadraticCurveTo(tx, ty - 46, tx - 46, ty - 58); c.fill();
    c.strokeStyle = 'rgba(255,190,120,.9)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(tx - 46, ty - 58); c.quadraticCurveTo(tx, ty - 46, tx + 46, ty - 58); c.stroke();
    c.fillStyle = 'rgba(255,200,130,.85)'; for (let i = -3; i <= 3; i++) c.fillRect(tx + i * 6 - 1.5, ty - 42 + Math.abs(i) * -1.5, 3, 4);
  }, { t: 3.0, d: 0.9, reveal: 'rise' });
}

// ---------------------------------------------------------------- water
function water(p, r) {
  p.group('water', { x: 0, y: SHORE, w: W, h: H - SHORE }, (c) => {
    const g = c.createLinearGradient(0, SHORE, 0, H);
    g.addColorStop(0, '#2a1640'); g.addColorStop(0.12, '#160f30'); g.addColorStop(0.6, '#0c0b24'); g.addColorStop(1, '#09081a');
    c.fillStyle = g; c.fillRect(0, SHORE, W, H - SHORE);
    // swell: faint dark lines across
    const rr = rng(5);
    c.strokeStyle = 'rgba(80,70,140,.18)'; c.lineWidth = 1.4; c.beginPath();
    for (let i = 0; i < 220; i++) {
      const y = SHORE + 10 + rr() ** 1.5 * (H - SHORE), x = rr() * W, L = 20 + (y - SHORE) * 0.12 * rr();
      c.moveTo(x, y); c.quadraticCurveTo(x + L / 2, y - 2, x + L, y);
    }
    c.stroke();
  }, { t: 1.3, d: 1.2, reveal: 'fall', ease: 'inOut' });
}

// ---------------------------------------------------------------- the island's towers
// windows as a list of small rects, each with the moment its light comes on
function windowsFor(r, b, o) {
  const out = [];
  const style = o.style ?? r.pick(['grid', 'grid', 'bands', 'cols']);
  const pal = o.pal ?? r.pick([[WARM, WARM, WHITE], [WHITE, COOL, WHITE], [WARM, GOLDL], [COOL, WHITE]]);
  const lit = o.lit ?? r.range(0.35, 0.7);
  const fy = o.fy ?? r.range(7, 10), fx = o.fx ?? r.range(6, 9);
  for (let y = b.top + 8; y < b.base - 6; y += fy) {
    if (style === 'bands') {
      if (r() < lit) out.push({ x: b.x + 3, y, w: b.w - 6, h: fy * 0.4, c: r.pick(pal), a: r.range(0.55, 0.95), th: r() });
      continue;
    }
    for (let x = b.x + 3; x < b.x + b.w - 4; x += fx) {
      if (r() > lit) continue;
      const ww = style === 'cols' ? fx * 0.35 : fx * 0.5;
      out.push({ x, y, w: ww, h: fy * (style === 'cols' ? 0.85 : 0.5), c: r.pick(pal), a: r.range(0.5, 1), th: r() });
    }
  }
  return out;
}
function drawWins(c, list, q) {
  for (const w of list) {
    if (w.th > q) continue;
    c.fillStyle = w.fill || (w.fill = rgba(w.c, w.a)); c.fillRect(w.x, w.y, w.w, w.h);
  }
}

const SLOTS = [[433, 510], [604, 678], [770, 892], [1036, 1126], [1214, 1286], [880, 1150]];
const inSlot = (x0, x1, top) => SLOTS.some(([a, b], i) => x1 > a - 4 && x0 < b + 4 && (i < 5 || top < SHORE - 120));

function skyline(p, r) {
  const lights = []; // [x0, x1, color, strength] for the reflections
  // the back row: taller toward Central and Wan Chai, dim
  const back = [];
  for (let x = -20; x < W + 20;) {
    const w = r.range(30, 70);
    const env = 0.5 + 0.8 * gauss(x, 620, 300) + 0.6 * gauss(x, 1150, 220);
    const h = r.range(130, 300) * env;
    back.push({ x, w, top: SHORE - 6 - h, base: SHORE, col: r.pick(BACK) });
    x += w + r.range(-6, 4);
  }
  const backWins = back.map((b) => windowsFor(r, b, { lit: r.range(0.2, 0.45), pal: [WARM, WHITE, COOL] }).map((w) => ({ ...w, a: w.a * 0.5 }))).flat();
  [[-20, 560], [540, 1080], [1060, W + 20]].forEach(([a, bnd], i) => {
    const part = back.filter((b) => b.x >= a && b.x < bnd);
    p.group('back', { x: a - 10, y: Math.min(...part.map((b) => b.top)) - 30, w: bnd - a + 90, h: SHORE + 10 - Math.min(...part.map((b) => b.top)) + 30 }, (c) => {
      for (const b of part) {
        c.fillStyle = b.col; c.fillRect(b.x, b.top, b.w, b.base - b.top);
        c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(b.x, b.top, b.w * 0.3, b.base - b.top);
        // masts and red lights on a few
        if (b.top < SHORE - 280) { c.fillStyle = '#2a2650'; c.fillRect(b.x + b.w / 2 - 1, b.top - 26, 2, 26); c.fillStyle = 'rgba(255,60,60,.9)'; c.beginPath(); c.arc(b.x + b.w / 2, b.top - 27, 2.4, 0, Math.PI * 2); c.fill(); }
      }
    }, { t: 2.2 + i * 0.4, d: 1.1, reveal: 'rise', ease: 'inOut' });
  });
  p.group('back', { x: 0, y: 600, w: W, h: SHORE - 600 }, (c, q) => drawWins(c, backWins, q), { t: 3.6, d: 1.6, reveal: 'none', ease: 'linear' });

  // the front row, thick with offices and flats
  const front = [];
  for (let x = -20; x < W + 20;) {
    const w = r.range(34, 82);
    const env = 0.45 + 0.75 * gauss(x, 650, 280) + 0.55 * gauss(x, 1120, 200) + 0.2 * gauss(x, 200, 120);
    const h = r.range(90, 290) * env * (r.chance(0.12) ? 1.4 : 1);
    const top = SHORE - h;
    if (!inSlot(x, x + w, top)) front.push({ x, w, top, base: SHORE, col: r.pick(TOWER), crown: r.pick(['flat', 'flat', 'step', 'mast', 'slope', 'neon']), neon: r.pick(Object.values(NEON)) });
    x += w + r.range(-4, 6);
  }
  for (const b of front) {
    b.wins = windowsFor(r, b, {});
    const strength = b.wins.length / Math.max(1, (b.base - b.top) * b.w / 60);
    lights.push([b.x, b.x + b.w, b.wins[0] ? b.wins[0].c : WARM, clamp(strength, 0.2, 1)]);
  }
  const bands = [[-20, 420], [400, 900], [880, 1300], [1280, W + 20]];
  bands.forEach(([a, bnd], i) => {
    const part = front.filter((b) => b.x >= a && b.x < bnd);
    if (!part.length) return;
    const top = Math.min(...part.map((b) => b.top)) - 64;
    p.group('towers', { x: a - 10, y: top, w: bnd - a + 100, h: SHORE + 10 - top }, (c) => {
      for (const b of part) tower(c, b);
    }, { t: 3.0 + i * 0.35, d: 1.2, reveal: 'rise', ease: 'inOut' });
  });
  bands.forEach(([a, bnd], i) => {
    const wins = front.filter((b) => b.x >= a && b.x < bnd).map((b) => b.wins).flat();
    p.group('towers', { x: a - 10, y: 500, w: bnd - a + 100, h: SHORE - 500 }, (c, q) => drawWins(c, wins, q), { t: 4.6 + i * 0.45, d: 1.4, reveal: 'none', ease: 'linear' });
  });
  // a few windows that keep changing
  const tw = [];
  for (let i = 0; i < 48; i++) { const b = r.pick(front.filter((f) => f.wins.length > 6)); const w = r.pick(b.wins); tw.push({ ...w, ph: r() * 10, sp: r.range(0.3, 1.2) }); }
  p.live('towers', {
    t: 7.0, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const w of tw) {
        const v = Math.sin(time * w.sp + w.ph);
        c.fillStyle = v > 0.55 ? rgba(w.c, 1) : v < -0.7 ? 'rgba(20,20,50,.95)' : rgba(w.c, w.a);
        c.fillRect(w.x, w.y, w.w, w.h);
      }
    },
  });
  return { lights, front };
}

function tower(c, b) {
  const { x, w, top, base } = b;
  c.fillStyle = b.col; c.fillRect(x, top, w, base - top);
  // the face toward the light of the harbor, a touch paler, and a seam of shade
  c.fillStyle = 'rgba(120,110,200,.08)'; c.fillRect(x, top, w * 0.55, base - top);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + w - 3, top, 3, base - top);
  if (b.crown === 'step') { c.fillStyle = b.col; c.fillRect(x + w * 0.15, top - 18, w * 0.7, 18); c.fillRect(x + w * 0.3, top - 30, w * 0.4, 12); }
  if (b.crown === 'mast') { c.fillStyle = '#2a2a55'; c.fillRect(x + w / 2 - 1.5, top - 50, 3, 50); c.fillStyle = 'rgba(255,60,60,.95)'; c.beginPath(); c.arc(x + w / 2, top - 51, 2.8, 0, Math.PI * 2); c.fill(); }
  if (b.crown === 'slope') { c.fillStyle = b.col; poly(c, [[x, top + 1], [x + w, top + 1], [x + w, top - w * 0.35]]); c.fill(); }
  if (b.crown === 'neon') {
    // a bar of colored light along the roof, no words
    const y = top + 6;
    glow(c, () => { c.beginPath(); c.moveTo(x + 4, y); c.lineTo(x + w - 4, y); }, b.neon, 2.2, 0.8);
  }
  // red lights at the corners of the roof
  c.fillStyle = 'rgba(255,70,70,.8)'; c.fillRect(x + 1, top - 2, 2, 2); c.fillRect(x + w - 3, top - 2, 2, 2);
}

// ---------------------------------------------------------------- the towers everyone knows
function landmarks(p, r, L) {
  // the tall one by the ferry piers: a shaft with lit piers, set back near the top, a crown of fins
  const ifc = { x: 471, hw: 37, top: 548 };
  p.group('marks', { x: ifc.x - 50, y: ifc.top - 60, w: 100, h: SHORE - ifc.top + 70 }, (c) => {
    const { x, hw, top } = ifc;
    const s1 = top + 140, s2 = top + 80;
    const shape = [[x - hw, SHORE], [x - hw, s1], [x - hw + 8, s1 - 8], [x - hw + 8, s2], [x - hw + 16, s2 - 8], [x - hw + 16, top + 30],
      [x + hw - 16, top + 30], [x + hw - 16, s2 - 8], [x + hw - 8, s2], [x + hw - 8, s1 - 8], [x + hw, s1], [x + hw, SHORE]];
    const g = c.createLinearGradient(x - hw, 0, x + hw, 0);
    g.addColorStop(0, '#3a4a7a'); g.addColorStop(0.55, '#24305a'); g.addColorStop(1, '#141a38');
    c.fillStyle = g; poly(c, shape); c.fill();
    // the piers of light running up it
    c.save(); poly(c, shape); c.clip();
    for (let k = -4; k <= 4; k++) { c.fillStyle = `rgba(200,230,255,${0.55 - Math.abs(k) * 0.06})`; c.fillRect(x + k * 8 - 0.8, top + 30, 1.6, SHORE - top); }
    c.fillStyle = 'rgba(190,220,255,.22)';
    for (let y = top + 40; y < SHORE; y += 6) c.fillRect(x - hw, y, 2 * hw, 1);
    c.restore();
    // the crown: fins rising at the corners, higher in the middle
    for (let k = -3; k <= 3; k++) {
      const fx = x + k * 6.5, fh = 34 + (3 - Math.abs(k)) * 14;
      c.fillStyle = '#2c3866'; c.fillRect(fx - 2, top + 30 - fh, 4, fh);
      c.fillStyle = 'rgba(210,235,255,.8)'; c.fillRect(fx - 0.6, top + 30 - fh, 1.2, fh);
    }
    c.fillStyle = 'rgba(255,60,60,.95)'; c.beginPath(); c.arc(x, top - 14, 3, 0, Math.PI * 2); c.fill();
  }, { t: 3.4, d: 1.6, reveal: 'rise', ease: 'inOut' });
  L.lights.push([ifc.x - ifc.hw, ifc.x + ifc.hw, COOL, 1]);

  // the tower with the striped head of colored light
  const ctr = { x: 641, hw: 34, top: 700 };
  p.group('marks', { x: ctr.x - 45, y: ctr.top - 120, w: 90, h: SHORE - ctr.top + 130 }, (c) => {
    const { x, hw, top } = ctr;
    c.fillStyle = '#1d2046'; c.fillRect(x - hw, top, 2 * hw, SHORE - top);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + hw * 0.3, top, hw * 0.7, SHORE - top);
    // its stepped head
    c.fillStyle = '#1d2046'; c.fillRect(x - hw + 8, top - 40, 2 * hw - 16, 40); c.fillRect(x - hw + 16, top - 64, 2 * hw - 32, 24);
    c.fillStyle = '#2a2a55'; c.fillRect(x - 1.5, top - 110, 3, 46);
    c.fillStyle = 'rgba(255,226,170,.65)';
    for (let y = top + 120; y < SHORE - 6; y += 7) for (let xx = x - hw + 4; xx < x + hw - 4; xx += 6) c.fillRect(xx, y, 3, 3);
  }, { t: 3.8, d: 1.4, reveal: 'rise', ease: 'inOut' });
  L.lights.push([ctr.x - ctr.hw, ctr.x + ctr.hw, NEON.violet, 0.9]);

  // the bank tower of crossed triangles and its two masts
  const boc = { x0: 770, x1: 892, top: 612 };
  p.group('marks', { x: boc.x0 - 10, y: boc.top - 120, w: boc.x1 - boc.x0 + 20, h: SHORE - boc.top + 130 }, (c) => {
    const { x0, x1, top } = boc, w = x1 - x0, mid = (x0 + x1) / 2;
    // shafts that stop at stepped heights, each cut off at a slope
    const t1 = top + 330, t2 = top + 230, t3 = top + 150, ap = x0 + w * 0.74;
    const body = [[x0, SHORE], [x0, t1], [mid, t2], [mid, t3], [ap, top], [x1, top + 96], [x1, SHORE]];
    const g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#2b3670'); g.addColorStop(0.5, '#1f2754'); g.addColorStop(1, '#151a3c');
    c.fillStyle = g; poly(c, body); c.fill();
    c.save(); poly(c, body); c.clip();
    c.fillStyle = 'rgba(150,180,255,.12)';
    for (let y = top; y < SHORE; y += 5) c.fillRect(x0, y, w, 1.2);
    c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(mid, top, w / 2, SHORE - top);
    c.restore();
    // the crossed braces, lit white: whole-width squares below, half-width ones above
    const lines = () => {
      c.beginPath();
      let y = SHORE;
      for (; y - w >= t1 - 1; y -= w) { c.moveTo(x0, y); c.lineTo(x1, y - w); c.moveTo(x1, y); c.lineTo(x0, y - w); c.moveTo(x0, y - w); c.lineTo(x1, y - w); }
      const hw = w / 2;
      for (; y - hw >= t3; y -= hw) { c.moveTo(mid, y); c.lineTo(x1, y - hw); c.moveTo(x1, y); c.lineTo(mid, y - hw); c.moveTo(mid, y - hw); c.lineTo(x1, y - hw); }
      c.moveTo(mid, SHORE); c.lineTo(mid, t3); c.moveTo(x0, t1); c.lineTo(mid, t2);
      c.moveTo(mid, t3); c.lineTo(ap, top); c.lineTo(x1, top + 96); c.moveTo(ap, top); c.lineTo(ap, y);
      for (const [px, py] of body) c.lineTo(px, py);
    };
    c.save(); poly(c, body); c.clip();
    glow(c, lines, '#dfe9ff', 1.6, 0.6);
    c.restore();
    c.strokeStyle = 'rgba(223,233,255,.8)'; c.lineWidth = 1.4; poly(c, body); c.stroke();
    // the masts
    const mx = x0 + w * 0.74;
    c.fillStyle = '#9aa6d8'; c.fillRect(mx - 6, top - 84, 2.2, 90); c.fillRect(mx + 6, top - 64, 2.2, 74);
    c.fillStyle = 'rgba(255,60,60,.95)'; c.beginPath(); c.arc(mx - 5, top - 86, 3, 0, Math.PI * 2); c.arc(mx + 7, top - 66, 3, 0, Math.PI * 2); c.fill();
  }, { t: 4.2, d: 1.6, reveal: 'rise', ease: 'inOut' });
  L.lights.push([boc.x0, boc.x1, WHITE, 0.8]);

  // the gold tower in Wan Chai, with a glass pyramid and a spire
  const cp = { x: 1081, hw: 45, top: 640 };
  p.group('marks', { x: cp.x - 55, y: cp.top - 160, w: 110, h: SHORE - cp.top + 170 }, (c) => {
    const { x, hw, top } = cp;
    c.fillStyle = '#2b2236'; c.fillRect(x - hw, top, 2 * hw, SHORE - top);
    c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x + 4, top, hw - 4, SHORE - top);
    // gold bands of light, floor on floor, broken at the corner
    for (let y = top + 10; y < SHORE - 4; y += 6) {
      c.fillStyle = 'rgba(255,196,90,.75)'; c.fillRect(x - hw + 3, y, hw - 6, 2);
      c.fillStyle = 'rgba(255,170,70,.45)'; c.fillRect(x + 4, y, hw - 7, 2);
    }
    // the pyramid top and spire (its light is redrawn as it changes color)
    c.fillStyle = '#2b2236'; poly(c, [[x - hw, top + 1], [x + hw, top + 1], [x, top - 62]]); c.fill();
    c.fillStyle = '#9aa6d8'; c.fillRect(x - 1.5, top - 150, 3, 90);
  }, { t: 4.6, d: 1.5, reveal: 'rise', ease: 'inOut' });
  L.lights.push([cp.x - cp.hw, cp.x + cp.hw, GOLDL, 1]);

  // the round tower with a crown
  const hp = { x: 1250, hw: 34, top: 760 };
  p.group('marks', { x: hp.x - 45, y: hp.top - 40, w: 90, h: SHORE - hp.top + 50 }, (c) => {
    const { x, hw, top } = hp;
    const g = c.createLinearGradient(x - hw, 0, x + hw, 0);
    g.addColorStop(0, '#2a2c5c'); g.addColorStop(0.4, '#1f2148'); g.addColorStop(1, '#101230');
    c.fillStyle = g; c.fillRect(x - hw, top, 2 * hw, SHORE - top);
    for (let y = top + 30; y < SHORE - 4; y += 7) { c.fillStyle = 'rgba(255,220,160,.5)'; c.fillRect(x - hw + 4, y, 2 * hw - 14, 2.4); }
    c.fillStyle = '#2a2c5c'; c.beginPath(); c.ellipse(x, top, hw + 6, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(120,230,255,.75)'; c.fillRect(x - hw - 6, top + 4, 2 * hw + 12, 4);
    c.fillStyle = '#2a2c5c'; c.fillRect(x - hw + 10, top - 18, 2 * hw - 20, 18);
  }, { t: 4.9, d: 1.3, reveal: 'rise', ease: 'inOut' });
  L.lights.push([hp.x - hp.hw, hp.x + hp.hw, WARM, 0.8]);

  // the heads that change color: the striped crown and the pyramid
  p.live('marks', {
    t: 6.6, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      const hues = [NEON.violet, NEON.cyan, NEON.pink, NEON.yellow, NEON.green];
      const { x, hw, top } = ctr;
      for (let i = 0; i < 9; i++) {
        const col = hues[Math.floor(time * 0.5 + i * 0.25) % hues.length];
        const y = top - 56 + i * 15, ww = i < 2 ? hw - 18 : i < 4 ? hw - 10 : hw - 2;
        glow(c, () => { c.beginPath(); c.moveTo(x - ww, y); c.lineTo(x + ww, y); }, col, 2.4, 0.7);
      }
      const col = hues[Math.floor(time * 0.33 + 2) % hues.length];
      const { x: px, hw: ph, top: pt } = cp;
      glow(c, () => { c.beginPath(); c.moveTo(px - ph, pt + 1); c.lineTo(px, pt - 62); c.lineTo(px + ph, pt + 1); c.moveTo(px - ph * 0.5, pt - 30); c.lineTo(px + ph * 0.5, pt - 30); }, col, 2, 0.8);
    },
  });
}

// ---------------------------------------------------------------- the waterfront
function shore(p, r, L) {
  // the convention center: a low glass hall under spread wings
  const cx = 1000, cw = 260;
  p.group('shore', { x: cx - cw / 2 - 20, y: SHORE - 70, w: cw + 40, h: 80 }, (c) => {
    c.fillStyle = '#18264a'; c.fillRect(cx - cw / 2, SHORE - 32, cw, 32);
    c.fillStyle = 'rgba(120,220,255,.55)'; for (let x = cx - cw / 2 + 4; x < cx + cw / 2 - 4; x += 8) c.fillRect(x, SHORE - 28, 5, 24);
    c.fillStyle = '#c9d4ee';
    c.beginPath(); c.moveTo(cx - cw / 2 - 14, SHORE - 30); c.quadraticCurveTo(cx - cw / 4, SHORE - 70, cx, SHORE - 40);
    c.quadraticCurveTo(cx + cw / 4, SHORE - 70, cx + cw / 2 + 14, SHORE - 30); c.lineTo(cx + cw / 2 + 14, SHORE - 34);
    c.quadraticCurveTo(cx + cw / 4, SHORE - 76, cx, SHORE - 46); c.quadraticCurveTo(cx - cw / 4, SHORE - 76, cx - cw / 2 - 14, SHORE - 34); c.fill();
  }, { t: 5.2, d: 1.0, reveal: 'rise' });
  L.lights.push([cx - cw / 2, cx + cw / 2, COOL, 0.7]);
  // the sea wall and the road along it, a line of lamps
  const lamps = []; for (let x = 0; x < W; x += r.range(5, 11)) lamps.push([x, SHORE - 3 + r.range(-1, 1), r.pick([WARM, '#ffae4a', WHITE])]);
  p.group('shore', { x: 0, y: SHORE - 12, w: W, h: 24 }, (c) => {
    c.fillStyle = '#100c22'; c.fillRect(0, SHORE - 4, W, 8);
    for (const [x, y, col] of lamps) { c.fillStyle = rgba(col, 0.25); c.fillRect(x - 2, y - 2, 6, 5); c.fillStyle = col; c.fillRect(x, y, 2, 2); }
  }, { t: 5.6, d: 1.0, reveal: 'wipe' });
}

// ---------------------------------------------------------------- the harbor's reflections
function reflections(p, r, L) {
  const by = new Map();
  for (const [x0, x1, col, st] of L.lights) {
    const n = Math.round((x1 - x0) * st * 0.5);
    for (let i = 0; i < n; i++) {
      const d = r() ** 1.8, y = SHORE + 8 + d * 420;
      const cx = lerp(x0, x1, r()), len = (x1 - x0) * r.range(0.15, 0.5) * (1 - d * 0.5);
      if (!by.has(col)) by.set(col, []);
      by.get(col).push([[cx - len / 2, y], [cx + len / 2, y], 1 - d]);
    }
  }
  let k = 0;
  for (const [col, list] of by) {
    // two strengths: bright near the shore, faint below
    const near = list.filter((l) => l[2] > 0.5).map((l) => [l[0], l[1]]), far = list.filter((l) => l[2] <= 0.5).map((l) => [l[0], l[1]]);
    if (near.length) p.strokes('reflect', near, rgba(col, 0.55), 2.2, { t: 5.8 + k * 0.12, d: 1.2, reveal: 'fall', cap: 'butt' });
    if (far.length) p.strokes('reflect', far, rgba(col, 0.25), 2.6, { t: 6.1 + k * 0.12, d: 1.2, reveal: 'fall', cap: 'butt' });
    k++;
  }
  // a few that wander on the swell
  const sh = [];
  for (let i = 0; i < 44; i++) { const [x0, x1, col] = r.pick(L.lights); sh.push({ x: lerp(x0, x1, r()), y: SHORE + 12 + r() ** 1.5 * 300, l: r.range(8, 26), col, ph: r() * 6 }); }
  p.live('reflect', {
    t: 7.2, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (const s of sh) {
        const a = 0.35 + 0.35 * Math.sin(time * 1.7 + s.ph);
        c.fillStyle = rgba(s.col, a); c.fillRect(s.x + Math.sin(time * 0.9 + s.ph) * 6 - s.l / 2, s.y, s.l, 2);
      }
    },
  });
}

// ---------------------------------------------------------------- the ferry
function ferry(p, r) {
  p.live('ferry', {
    t: 8.4, d: 1.2, reveal: 'fade',
    draw: (c, time) => {
      // a double-ended ferry shuttles across the open water, never turning
      const x = 1000 + 112 * Math.sin(time * 0.07 - 0.6), y = 1478 + Math.sin(time * 0.9) * 1.5;
      ferryAt(c, x, y);
    },
  });
}
function ferryAt(c, x, y) {
  const L = 270;
  // its lights on the water
  c.fillStyle = 'rgba(255,214,140,.22)';
  for (let i = 0; i < 6; i++) c.fillRect(x - L * 0.4 + Math.sin(i * 2.3) * 10, y + 8 + i * 9, L * 0.8 - i * 20, 2);
  // the hull, green, both ends alike
  c.fillStyle = '#1f6a45'; poly(c, [[x - L / 2, y - 22], [x + L / 2, y - 22], [x + L / 2 - 18, y + 4], [x - L / 2 + 18, y + 4]]); c.fill();
  c.fillStyle = '#e8efe4'; c.fillRect(x - L / 2 + 6, y - 24, L - 12, 4);
  // two white decks with their windows lit
  c.fillStyle = '#dfe8dc'; c.fillRect(x - L / 2 + 22, y - 52, L - 44, 28);
  c.fillStyle = '#cfdacb'; c.fillRect(x - L / 2 + 44, y - 76, L - 88, 24);
  c.fillStyle = 'rgba(255,214,130,.95)';
  for (let k = 0; k < 15; k++) c.fillRect(x - L / 2 + 28 + k * 15.2, y - 47, 9, 14);
  for (let k = 0; k < 11; k++) c.fillRect(x - L / 2 + 50 + k * 15.6, y - 71, 9, 12);
  // the roof in green, the wheelhouses at each end, the little mast
  c.fillStyle = '#1f6a45'; c.fillRect(x - L / 2 + 38, y - 82, L - 76, 7);
  c.fillStyle = '#dfe8dc'; c.fillRect(x - L / 2 + 30, y - 92, 26, 12); c.fillRect(x + L / 2 - 56, y - 92, 26, 12);
  c.fillStyle = 'rgba(255,214,130,.9)'; c.fillRect(x - L / 2 + 34, y - 89, 18, 6); c.fillRect(x + L / 2 - 52, y - 89, 18, 6);
  c.fillStyle = '#e8efe4'; c.fillRect(x - 1, y - 116, 2, 34);
  c.fillStyle = 'rgba(255,80,80,1)'; c.fillRect(x - 2, y - 118, 4, 4);
  c.fillStyle = 'rgba(120,255,160,1)'; c.fillRect(x + L / 2 - 8, y - 30, 4, 4);
}

// ---------------------------------------------------------------- the junk
function junk(p, r) {
  const wl = 1712;
  // its reflection first, red and broken
  p.group('junk', { x: 300, y: wl, w: 520, h: 120 }, (c) => {
    const rr = rng(8);
    for (let i = 0; i < 40; i++) {
      const y = wl + 6 + i * 2.8, x = 360 + rr() * 380, l = rr.range(20, 80);
      c.fillStyle = `rgba(200,50,45,${0.32 - i * 0.007})`; c.fillRect(x, y, l, 2);
    }
  }, { t: 7.6, d: 0.8, reveal: 'fall' });
  // the hull: a high stern, a low waist, the bow lifted
  const hull = [[318, 1596], [352, 1588], [372, 1640], [600, 1656], [770, 1636], [812, 1620], [798, 1650], [740, wl], [400, wl], [352, 1680]];
  p.group('junk', boxOf(hull, 20), (c) => {
    c.fillStyle = '#2a1712'; poly(c, hull); c.fill();
    c.fillStyle = '#4a2a1c'; poly(c, [[352, 1620], [600, 1668], [800, 1648], [796, 1660], [600, 1680], [356, 1640]]); c.fill();
    // the wales: long planks lit by the city behind
    c.strokeStyle = 'rgba(255,140,90,.35)'; c.lineWidth = 1.5; c.beginPath();
    for (let k = 0; k < 4; k++) { c.moveTo(360 + k * 6, 1652 + k * 12); c.quadraticCurveTo(600, 1676 + k * 10, 790, 1658 + k * 12); }
    c.stroke();
    // the stern's windows and the rail
    c.fillStyle = 'rgba(255,200,120,.9)'; for (let i = 0; i < 3; i++) c.fillRect(330 + i * 9, 1606, 5, 8);
    c.strokeStyle = '#4a2a1c'; c.lineWidth = 2; c.beginPath(); c.moveTo(326, 1586); c.lineTo(372, 1622); c.quadraticCurveTo(600, 1640, 806, 1612); c.stroke();
    c.lineWidth = 1; c.beginPath(); for (let x = 380; x < 800; x += 14) { c.moveTo(x, 1626 + (x - 380) * 0.0); c.lineTo(x, 1640 + Math.sin((x - 380) / 420 * Math.PI) * 8); } c.stroke();
  }, { t: 7.8, d: 0.8, reveal: 'drop', dy: 30 });
  // three masts and three sails, fanned, with their battens
  const sails = [
    { mx: 580, foot: 1628, top: 1176, fw: 34, bw: 232, lift: 80, t: 8.2 },
    { mx: 732, foot: 1618, top: 1336, fw: 22, bw: 140, lift: 50, t: 8.5 },
    { mx: 392, foot: 1590, top: 1350, fw: 16, bw: 98, lift: 40, t: 8.8 },
  ];
  for (const s of sails) {
    const n = 7;
    const luff = [], leech = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      const y = lerp(s.foot - 6, s.top + 20, f);
      luff.push([s.mx + lerp(s.fw, s.fw * 0.5, f), y]);
      leech.push([s.mx - s.bw * (0.82 + 0.3 * Math.sin(Math.PI * f * 0.9)), y - s.lift * f ** 1.4]);
    }
    const shape = [...luff, ...leech.slice().reverse()];
    p.group('junk', boxOf([...shape, [s.mx, s.top - 30]], 14), (c) => {
      c.fillStyle = '#1e120f'; c.fillRect(s.mx - 2.5, s.top - 26, 5, s.foot - s.top + 30);
      // the panels, alternately deeper
      for (let i = 0; i < n; i++) {
        c.fillStyle = i % 2 ? SAIL_D : SAIL;
        poly(c, [luff[i], luff[i + 1], leech[i + 1], leech[i]]); c.fill();
      }
      // light from the city through the cloth
      const g = c.createLinearGradient(0, s.top, 0, s.foot);
      g.addColorStop(0, 'rgba(255,120,90,.28)'); g.addColorStop(1, 'rgba(255,120,90,0)');
      c.fillStyle = g; poly(c, shape); c.fill();
      // the battens
      c.strokeStyle = '#3a0e0c'; c.lineWidth = 3.4; c.lineCap = 'round';
      c.beginPath(); for (let i = 0; i <= n; i++) { c.moveTo(luff[i][0] + 4, luff[i][1]); c.lineTo(leech[i][0] - 4, leech[i][1]); } c.stroke();
      // the edges
      c.strokeStyle = 'rgba(255,140,110,.55)'; c.lineWidth = 1.4; poly(c, shape); c.stroke();
      // the sheets fanning down to the stern
      c.strokeStyle = 'rgba(30,18,15,.8)'; c.lineWidth = 0.9; c.beginPath();
      for (let i = 0; i <= n; i += 2) { c.moveTo(leech[i][0], leech[i][1]); c.lineTo(s.mx - s.bw * 0.55, s.foot + 6); }
      c.stroke();
      // a pennant at the masthead
      c.fillStyle = NEON.yellow; poly(c, [[s.mx, s.top - 26], [s.mx + 22, s.top - 20], [s.mx, s.top - 14]]); c.fill();
    }, { t: s.t, d: 1.0, reveal: 'rise', ease: 'inOut' });
  }
  // a string of lanterns from stern to bow
  p.group('junk', { x: 300, y: 1150, w: 540, h: 500 }, (c) => {
    const pts = [[330, 1586], [392, 1350], [580, 1176], [732, 1336], [830, 1600]];
    c.strokeStyle = 'rgba(255,220,170,.35)'; c.lineWidth = 1;
    c.beginPath(); pts.forEach(([x, y], i) => (i ? c.quadraticCurveTo((pts[i - 1][0] + x) / 2, Math.max(pts[i - 1][1], y) + 30, x, y) : c.moveTo(x, y))); c.stroke();
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      for (let k = 1; k < 6; k++) {
        const f = k / 6, x = lerp(x0, x1, f), y = lerp(y0, y1, f) + Math.sin(f * Math.PI) * 18;
        c.fillStyle = 'rgba(255,200,110,.22)'; c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffd38a'; c.beginPath(); c.arc(x, y, 2.4, 0, Math.PI * 2); c.fill();
      }
    }
  }, { t: 9.4, d: 0.8, reveal: 'fade' });
}

// ---------------------------------------------------------------- Kowloon: the street's walls
function block(c, b, r) {
  const { x0, x1, top } = b, w = x1 - x0;
  const g = c.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, '#1d1530'); g.addColorStop(1, '#0d0a18');
  c.fillStyle = g; c.fillRect(x0, top, w, H - top);
  // the face turned to the street, darker
  const sx = b.side < 0 ? x1 - 34 : x0;
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(sx, top, 34, H - top);
  // the roof: tanks, a mast, a sign frame
  c.fillStyle = '#1d1530';
  c.fillRect(x0 + w * 0.2, top - 26, 40, 26); c.fillRect(x0 + w * 0.22, top - 34, 36, 8);
  c.fillRect(x0 + w * 0.65, top - 70, 3, 70);
  c.strokeStyle = '#2a2040'; c.lineWidth = 2; c.beginPath();
  for (let k = 0; k < 4; k++) { c.moveTo(x0 + w * 0.55, top - 10 - k * 12); c.lineTo(x0 + w * 0.9, top - 10 - k * 12); }
  c.moveTo(x0 + w * 0.55, top); c.lineTo(x0 + w * 0.55, top - 46); c.moveTo(x0 + w * 0.9, top); c.lineTo(x0 + w * 0.9, top - 46); c.stroke();
  c.fillStyle = 'rgba(255,60,60,.9)'; c.beginPath(); c.arc(x0 + w * 0.65 + 1.5, top - 72, 3, 0, Math.PI * 2); c.fill();
}
function blockWins(r, b) {
  const out = [], air = [], wash = [];
  const { x0, x1, top } = b;
  for (let y = top + 24; y < PROM + 120; y += 34) {
    for (let x = x0 + 10; x < x1 - 20; x += 26) {
      const lit = r() < 0.6;
      out.push({ x, y, w: 16, h: 20, c: lit ? r.pick([WARM, WARM, '#ffb36b', WHITE, '#ff9ccf', COOL]) : '#241c38', a: lit ? r.range(0.6, 0.95) : 1, th: r() });
      if (r() < 0.35) air.push([x + 1, y + 21]);
      if (r() < 0.12) wash.push([x - 4, y - 4, r.pick([NEON.red, '#e0e0ff', NEON.yellow, '#6fa8ff'])]);
    }
  }
  return { out, air, wash };
}

function kowloon(p, r) {
  const blocks = [{ x0: -10, x1: 236, top: 590, side: -1, t: 6.4 }, { x0: 1372, x1: W + 10, top: 500, side: 1, t: 6.8 }];
  for (const b of blocks) p.group('kowloon', { x: b.x0, y: b.top - 80, w: b.x1 - b.x0, h: H - b.top + 80 }, (c) => block(c, b, r), { t: b.t, d: 1.2, reveal: 'rise', ease: 'inOut' });
  for (const b of blocks) {
    const { out, air, wash } = blockWins(r, b);
    p.group('kowloon', { x: b.x0, y: b.top, w: b.x1 - b.x0, h: H - b.top }, (c, q) => {
      drawWins(c, out, q);
      // window grilles, air conditioners, washing on poles
      c.strokeStyle = 'rgba(10,8,20,.7)'; c.lineWidth = 1; c.beginPath();
      for (const w of out) { c.moveTo(w.x + w.w / 2, w.y); c.lineTo(w.x + w.w / 2, w.y + w.h); c.moveTo(w.x, w.y + w.h / 2); c.lineTo(w.x + w.w, w.y + w.h / 2); }
      c.stroke();
      if (q > 0.5) {
        c.fillStyle = '#4a4560'; for (const [x, y] of air) c.fillRect(x, y, 14, 8);
        for (const [x, y, col] of wash) { c.fillStyle = '#3a3450'; c.fillRect(x, y, 26, 1.5); c.fillStyle = rgba(col, 0.55); c.fillRect(x + 3, y + 1.5, 6, 10); c.fillRect(x + 12, y + 1.5, 8, 7); }
      }
    }, { t: b.t + 1.0, d: 1.2, reveal: 'none', ease: 'linear' });
  }
}

// ---------------------------------------------------------------- the signs
// each sign: x, y, w, h, words, color; the last three flicker
const SIGNS = [
  { x: 248, y: 640, w: 132, h: 330, t: '香港', col: NEON.red, size: 104, big: true },
  { x: 300, y: 1010, w: 96, h: 240, t: '酒家', col: NEON.pink },
  { x: 232, y: 1290, w: 90, h: 226, t: '金行', col: NEON.yellow },
  { x: 340, y: 1300, w: 76, h: 190, t: '涼茶', col: NEON.green, small: true },
  { x: 1262, y: 560, w: 100, h: 250, t: '茶樓', col: NEON.cyan },
  { x: 1208, y: 860, w: 96, h: 236, t: '大押', col: NEON.orange },
  { x: 1280, y: 1150, w: 88, h: 220, t: '海鮮', col: NEON.pink },
  { x: 1196, y: 1400, w: 80, h: 196, t: '粥麵', col: NEON.violet, small: true },
  { x: 236, y: 1560, w: 84, h: 200, t: '麻雀', col: NEON.cyan, flick: true },
  { x: 1300, y: 1440, w: 74, h: 190, t: '冰室', col: NEON.yellow, flick: true },
  { x: 320, y: 1560, w: 70, h: 180, t: '夜市', col: NEON.orange, flick: true },
];

function sign(c, s, k) {
  const { x, y, w, h } = s;
  // the bracket out from the wall
  c.strokeStyle = '#2a2040'; c.lineWidth = 3; c.beginPath();
  const wall = x < 800 ? 236 : 1372;
  c.moveTo(wall, y + 16); c.lineTo(x + w / 2, y - 6); c.moveTo(wall, y + h * 0.5); c.lineTo(x + (x < 800 ? 0 : w), y + h * 0.5); c.stroke();
  // the board
  c.fillStyle = '#120c1e'; rrect(c, x, y, w, h, 8); c.fill();
  c.fillStyle = rgba(s.col, 0.08 * k); rrect(c, x, y, w, h, 8); c.fill();
  if (k <= 0.01) {
    c.strokeStyle = rgba(s.col, 0.25); c.lineWidth = 2; rrect(c, x + 7, y + 7, w - 14, h - 14, 6); c.stroke();
  } else {
    glow(c, () => rrect(c, x + 7, y + 7, w - 14, h - 14, 6), s.col, 2.6, k);
  }
  const chars = [...s.t], n = chars.length, size = s.size || Math.min(w * 0.68, (h - 30) / n * 0.86);
  chars.forEach((ch, i) => {
    const cy = y + 15 + ((h - 30) * (i + 0.5)) / n;
    if (k <= 0.01) { c.font = `900 ${size}px ${CJK}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = rgba(s.col, 0.22); c.fillText(ch, x + w / 2, cy); }
    else glowText(c, ch, x + w / 2, cy, size, { w: 900, f: CJK }, s.col, k);
  });
}

function signs(p, r) {
  const steady = SIGNS.filter((s) => !s.flick);
  steady.forEach((s, i) => {
    p.mark('signs', {
      t: 8.3 + i * 0.22, d: 0.9, reveal: 'none', ease: 'linear',
      box: { x: s.x - 60, y: s.y - 60, w: s.w + 120, h: s.h + 120 },
      draw: (c, q) => sign(c, s, flick(q, i + 3)),
    });
  });
  // three that never quite hold
  const shaky = SIGNS.filter((s) => s.flick);
  p.live('signs', {
    t: 10.0, d: 0.6, reveal: 'fade',
    draw: (c, time) => {
      shaky.forEach((s, i) => {
        const n = Math.sin(Math.floor(time * 9 + i * 7) * 12.9898 + i) * 43758.5;
        const fr = n - Math.floor(n);
        const off = (time * (0.3 + i * 0.1) + i * 0.37) % 1 < 0.14 && fr < 0.6;
        sign(c, s, off ? 0 : 1);
      });
    },
  });
}

// ---------------------------------------------------------------- the promenade
function promenade(p, r) {
  p.group('promenade', { x: 0, y: PROM - 30, w: W, h: H - PROM + 30 }, (c) => {
    c.fillStyle = '#0e0b19'; c.fillRect(0, PROM, W, H - PROM);
    c.fillStyle = '#2b2142'; c.fillRect(0, PROM, W, 3);
    // the paving, in long lines toward us
    c.strokeStyle = 'rgba(80,60,110,.35)'; c.lineWidth = 1; c.beginPath();
    for (let x = -800; x < W + 800; x += 60) { c.moveTo(800 + (x - 800) * 0.6, PROM + 4); c.lineTo(x, H); }
    for (let y = PROM + 14; y < H; y += (y - PROM) * 0.35 + 10) { c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
  }, { t: 9.6, d: 0.8, reveal: 'rise' });
  // the paving is wet: the signs and the lamps lie in it as long streaks
  const wet = [];
  for (const sg of SIGNS) for (let i = 0; i < 16; i++) { const x = sg.x + sg.w * r.range(0.2, 0.8); if (x > 200 && x < 1400) wet.push([x, PROM + 10 + r() ** 1.3 * 160, r.range(8, 24), sg.col]); }
  for (const x of [300, 640, 980, 1320]) for (let i = 0; i < 14; i++) wet.push([x + r.range(-24, 24), PROM + 10 + r() ** 1.2 * 160, r.range(10, 30), '#ffd9a0']);
  for (let i = 0; i < 90; i++) wet.push([r.range(240, 1360), PROM + 8 + r() ** 1.5 * 170, r.range(10, 40), r.pick([NEON.pink, NEON.cyan, WARM, NEON.violet])]);
  p.group('promenade', { x: 0, y: PROM, w: W, h: H - PROM }, (c) => {
    for (const [x, y, l, col] of wet) { c.fillStyle = rgba(col, 0.22 * (1 - (y - PROM) / 230)); c.fillRect(x - 1.5, y, 3, l); }
    const g = c.createLinearGradient(0, PROM, 0, PROM + 90);
    g.addColorStop(0, 'rgba(160,80,160,.18)'); g.addColorStop(1, 'rgba(160,80,160,0)');
    c.fillStyle = g; c.fillRect(0, PROM, W, 90);
  }, { t: 9.9, d: 0.8, reveal: 'fade' });
  // the rail
  p.group('promenade', { x: 0, y: PROM - 40, w: W, h: 46 }, (c) => {
    c.fillStyle = '#0a0812';
    c.fillRect(0, PROM - 36, W, 4); c.fillRect(0, PROM - 18, W, 2.5);
    for (let x = 6; x < W; x += 38) c.fillRect(x, PROM - 36, 3, 36);
    c.fillStyle = 'rgba(255,170,220,.25)'; c.fillRect(0, PROM - 37, W, 1.2);
  }, { t: 10.0, d: 0.8, reveal: 'wipe', ease: 'inOut' });
  // people at the rail, looking across
  const folk = [];
  for (let i = 0; i < 26; i++) {
    const x = r.range(250, 1360);
    folk.push({ x, h: r.range(74, 96) * (r.chance(0.12) ? 0.6 : 1), w: r.range(18, 25), rim: r.pick([NEON.pink, NEON.cyan, WARM]), cam: r.chance(0.15) });
  }
  folk.sort((a, b) => a.x - b.x);
  p.group('promenade', { x: 200, y: PROM - 140, w: 1220, h: 170 }, (c) => {
    for (const f of folk) {
      const y = PROM + 8;
      c.fillStyle = '#07050d';
      rrect(c, f.x - f.w / 2, y - f.h, f.w, f.h * 0.62, 5); c.fill();
      c.fillRect(f.x - f.w * 0.35, y - f.h * 0.42, f.w * 0.3, f.h * 0.42); c.fillRect(f.x + f.w * 0.05, y - f.h * 0.42, f.w * 0.3, f.h * 0.42);
      c.beginPath(); c.arc(f.x, y - f.h - f.w * 0.42, f.w * 0.42, 0, Math.PI * 2); c.fill();
      // the rim of the harbor's light on head and shoulders
      c.strokeStyle = rgba(f.rim, 0.55); c.lineWidth = 1.4;
      c.beginPath(); c.arc(f.x, y - f.h - f.w * 0.42, f.w * 0.42, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      if (f.cam) { c.fillStyle = '#07050d'; c.fillRect(f.x - 4, y - f.h - f.w * 0.5, 10, 7); c.fillStyle = rgba(WHITE, 0.8); c.fillRect(f.x + 1, y - f.h - f.w * 0.4, 2, 2); }
    }
  }, { t: 10.3, d: 0.7, reveal: 'fade' });
  // lamps along the front
  p.group('promenade', { x: 200, y: PROM - 200, w: 1200, h: 210 }, (c) => {
    for (const x of [300, 640, 980, 1320]) {
      c.fillStyle = '#0a0812'; c.fillRect(x - 3, PROM - 150, 6, 150);
      c.fillRect(x - 22, PROM - 152, 44, 4);
      for (const dx of [-20, 20]) {
        c.fillStyle = 'rgba(255,210,150,.12)'; c.beginPath(); c.arc(x + dx, PROM - 162, 26, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,210,150,.25)'; c.beginPath(); c.arc(x + dx, PROM - 162, 12, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff0d0'; c.beginPath(); c.arc(x + dx, PROM - 162, 6, 0, Math.PI * 2); c.fill();
      }
    }
  }, { t: 10.5, d: 0.6, reveal: 'fade' });
}

// ---------------------------------------------------------------- title and frame
let mctx = null;
const measure = () => mctx || (mctx = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d'));

function tubeLine(p, layer, str, cx, y, o) {
  const m = measure();
  m.font = `400 ${o.size}px ${TUBE}`;
  const tr = (o.track || 0) * o.size;
  const total = m.measureText(str).width + tr * (str.length - 1);
  const x0 = cx - total / 2;
  let k = 0;
  [...str].forEach((ch, i) => {
    const gx = x0 + m.measureText(str.slice(0, i)).width + tr * i, gw = m.measureText(ch).width;
    if (ch === ' ') return;
    const seed = k + (o.seed || 0);
    p.mark(layer, {
      t: o.t + k * (o.gap ?? 0.2), d: o.d ?? 0.8, reveal: 'none', ease: 'linear',
      box: { x: gx - o.size * 0.4, y: y - o.size, w: gw + o.size * 0.8, h: o.size * 2 },
      draw: (c, q) => {
        const f = flick(q, seed);
        c.font = `400 ${o.size}px ${TUBE}`; c.textAlign = 'left'; c.textBaseline = 'middle';
        if (f < 1) { c.strokeStyle = rgba(o.color, 0.22); c.lineWidth = o.size * 0.03; c.strokeText(ch, gx, y); }
        if (f > 0.5) {
          c.lineJoin = 'round';
          for (const [mm, a] of [[0.36, 0.05], [0.22, 0.08], [0.12, 0.15], [0.06, 0.32]]) { c.strokeStyle = rgba(o.color, a); c.lineWidth = o.size * mm; c.strokeText(ch, gx, y); }
          c.fillStyle = mix(o.color, '#ffffff', 0.45); c.fillText(ch, gx, y);
          c.strokeStyle = o.color; c.lineWidth = o.size * 0.012; c.strokeText(ch, gx, y);
        }
      },
    });
    k++;
  });
}

function title(p) {
  tubeLine(p, 'title', 'HONG KONG', W / 2, 300, { size: 176, color: NEON.pink, track: 0.06, t: 10.8, gap: 0.2, d: 0.8 });
  tubeLine(p, 'title', 'PEARL OF THE EAST', W / 2, 438, { size: 46, color: NEON.cyan, track: 0.3, t: 12.4, gap: 0.03, d: 0.5, seed: 20 });
  // a neon border around the sheet, its tube run in by hand
  const x = 34, y = 34, w = W - 68, h = H - 68, rad = 26;
  const len = 2 * (w + h);
  p.mark('frame', {
    t: 12.7, d: 1.1, reveal: 'none', ease: 'inOut',
    box: { x: 0, y: 0, w: W, h: H },
    draw: (c, q) => {
      c.save();
      c.setLineDash([len * q, len]);
      glow(c, () => rrect(c, x, y, w, h, rad), NEON.cyan, 2.6, 0.75);
      c.restore();
    },
  });
}
