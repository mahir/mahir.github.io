// Dubai: a 1970s science-fiction paperback cover. A black title band with the
// name in chrome; below, an airbrushed dusk where a vast sun stands behind the
// Burj Khalifa's needle. Towers rise in rim-lit tiers from the desert, the gold
// Dubai Frame, the Museum of the Future's ring, the Burj Al Arab's sail and the
// Emirates Towers among them; wind towers and dhows line the creek, an abra
// crosses it, and a camel train walks the crest of the dunes in front.

import { Plate, W, H } from '../print.js';
import { lerp, poly } from '../kit.js';

const BLACK = '#0b0d0e', OCHRE = '#d9a03a', RUST = '#c8562a', TEAL = '#2f7a78', ORANGE = '#f0863e', GOLD = '#ffcf7e', CREAM = '#fff3d2';
const SIL = '#1c2a2c', SIL_FAR = '#5f7a6c', SIL_MID = '#203638';
const FACE = 'Orbitron';
const TOP = 420, HZ = 1250;           // the foot of the band, the horizon
const SX = 800, SY = 1060, SR = 380;  // the sun

export const city = {
  id: 'dubai', name: 'Dubai', wall: '#1d0f26',
  alt: 'A 1970s science-fiction paperback cover for Dubai: under a black band with the name in chrome letters, a vast sun at dusk stands behind the needle of the Burj Khalifa among rim-lit towers, with the gold Dubai Frame, the ring of the Museum of the Future, the sail of the Burj Al Arab, the Emirates Towers and the twisting Cayan Tower; a metro train runs on its viaduct, wind towers and dhows line the creek where an abra crosses, flamingos fly over, a camel train walks the crest of the dunes, and a robed traveler with a staff looks on from the nearest dune',
  google: 'family=Orbitron:wght@500;900',
  fonts: [
    ['900 100px Orbitron', 'DUBAI'],
    ['500 40px Orbitron', 'A JOURNEY TO THE CITY OF TOMORROW · DUBAI CREEK · DOWNTOWN · JUMEIRAH 25° 16′ N 55° 18′ E'],
  ],
  build,
};

function build() {
  const p = new Plate({ paper: BLACK, seed: 2010 });
  const r = p.r;
  p.stack('sky', 'sun', 'far', 'towers', 'burj', 'near', 'old', 'creek', 'duneBack', 'duneMid', 'duneFront', 'live', 'band', 'title');
  band(p, r);
  sky(p, r);
  sun(p, r);
  far(p, r);
  towers(p, r);
  burj(p, r);
  landmarks(p, r);
  oldTown(p, r);
  creek(p, r);
  dunes(p, r);
  traveler(p);
  life(p, r);
  title(p, r);
  for (const n of p.order) p.layers[n].marks.sort((a, b) => a.t - b.t);
  return p;
}

// ================================================================ helpers
function vgrad(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  return g;
}
function hgrad(c, x0, x1, stops) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  return g;
}
function line(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
// a silhouette lit from behind: the rim on the side facing the sun, then the body
function rimmed(c, pts, body, rim, side, k = 2.4) {
  c.lineJoin = 'miter';
  poly(c, pts); c.strokeStyle = rim; c.lineWidth = k * 1.6; c.stroke();
  c.save(); c.translate(-side * k, k * 0.6); poly(c, pts); c.fillStyle = body; c.fill(); c.restore();
}
function setLine(c, text, x, y, size, weight, fill, track = 0, align = 'center') {
  c.font = `${weight} ${size}px ${FACE}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const tr = track * size;
  const total = c.measureText(text).width + tr * (text.length - 1);
  let gx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  c.fillStyle = fill;
  for (let i = 0; i < text.length; i++) {
    c.fillText(text[i], gx, y);
    gx += c.measureText(text.slice(0, i + 1)).width - c.measureText(text.slice(0, i)).width + tr;
  }
}

// ================================================================ the cover's band
function band(p, r) {
  p.group('band', { x: 0, y: 0, w: W, h: TOP + 6 }, (c) => {
    c.fillStyle = BLACK; c.fillRect(0, 0, W, TOP);
  }, { t: 0, d: 0.6, reveal: 'fall', ease: 'soft' });
  // three stripes at its foot
  [[OCHRE, 0], [RUST, 1], [TEAL, 2]].forEach(([col, i]) => {
    p.group('band', { x: 0, y: TOP - 36 + i * 12, w: W, h: 12 }, (c) => { c.fillStyle = col; c.fillRect(0, TOP - 34 + i * 12, W, 8); },
      { t: 0.5 + i * 0.12, d: 0.8, reveal: i % 2 ? 'wipeL' : 'wipe', ease: 'inOut' });
  });
  // the thin rule round the band, like a cover's printed border
  p.group('band', { x: 30, y: 30, w: W - 60, h: TOP - 80 }, (c) => {
    c.strokeStyle = 'rgba(255,207,126,.6)'; c.lineWidth = 1.5; c.strokeRect(40, 40, W - 80, TOP - 100);
    c.fillStyle = GOLD; for (const [x, y] of [[40, 40], [W - 40, 40], [40, TOP - 60], [W - 40, TOP - 60]]) { c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); }
  }, { t: 1.0, d: 0.8, reveal: 'fade' });
}

// ================================================================ the sky
function sky(p, r) {
  const box = { x: 0, y: TOP, w: W, h: HZ - TOP + 4 };
  p.group('sky', box, (c) => {
    c.fillStyle = vgrad(c, TOP, HZ, [[0, '#0e2a30'], [0.28, '#1f5258'], [0.5, '#5e8574'], [0.7, '#c49a52'], [0.86, '#e07a3a'], [1, GOLD]]);
    c.fillRect(0, TOP, W, HZ - TOP);
  }, { t: 0.3, d: 1.4, reveal: 'fall', ease: 'inOut' });
  // the desert at dusk, laid first from the foot of the cover up
  p.group('sky', { x: 0, y: HZ, w: W, h: H - HZ }, (c) => {
    c.fillStyle = vgrad(c, HZ, H, [[0, '#e89a5a'], [0.2, '#a8532e'], [0.6, '#4a2a22'], [1, '#1a1012']]);
    c.fillRect(0, HZ, W, H - HZ);
  }, { t: 0.2, d: 1.2, reveal: 'rise', ease: 'inOut' });
  // airbrushed bands of thin cloud across the sun
  const veils = [[700, 1.0, 0.22], [820, 0.8, 0.18], [960, 1.2, 0.16], [1120, 0.9, 0.2]];
  p.group('sky', box, (c) => {
    for (const [y, w, a] of veils) {
      const g = c.createLinearGradient(0, y - 10, 0, y + 14);
      g.addColorStop(0, 'rgba(255,190,150,0)'); g.addColorStop(0.5, `rgba(255,190,150,${a})`); g.addColorStop(1, 'rgba(255,190,150,0)');
      c.fillStyle = g; c.beginPath(); c.ellipse(W / 2 + (y % 300) - 150, y, W * 0.55 * w, 14, 0, 0, Math.PI * 2); c.fill();
    }
  }, { t: 3.0, d: 1.2, reveal: 'wipe', ease: 'inOut' });
  // stars in the high dark
  const stars = [];
  for (let i = 0; i < 60; i++) { const y = TOP + 10 + r() ** 2.2 * 300; stars.push([r.range(20, W - 20), y, r.range(0.6, 2) * (1 - (y - TOP) / 450)]); }
  p.group('sky', { x: 0, y: TOP, w: W, h: 420 }, (c) => {
    c.fillStyle = CREAM; c.beginPath();
    for (const [x, y, s] of stars) { c.moveTo(x + s, y); c.arc(x, y, s, 0, Math.PI * 2); }
    c.fill();
  }, { t: 1.4, d: 1.0, reveal: 'fade' });
}

// the vast sun: it rises out of the horizon, with an airbrushed glow round it
function sun(p, r) {
  p.group('sun', { x: 0, y: TOP, w: W, h: HZ - TOP }, (c) => {
    const g = c.createRadialGradient(SX, SY, SR * 0.9, SX, SY, SR * 1.9);
    g.addColorStop(0, 'rgba(255,210,140,.55)'); g.addColorStop(0.4, 'rgba(255,150,110,.18)'); g.addColorStop(1, 'rgba(255,120,110,0)');
    c.fillStyle = g; c.fillRect(0, TOP, W, HZ - TOP);
  }, { t: 2.6, d: 1.2, reveal: 'fade' });
  const m = p.group('sun', { x: SX - SR - 10, y: SY - SR - 10, w: 2 * SR + 20, h: 2 * SR + 20 }, (c) => {
    c.save(); c.beginPath(); c.rect(0, TOP, W, HZ - TOP); c.clip();
    const g = c.createRadialGradient(SX - 60, SY - 90, 20, SX, SY, SR);
    g.addColorStop(0, '#fffbe8'); g.addColorStop(0.55, '#ffe9b0'); g.addColorStop(0.9, '#ffc27a'); g.addColorStop(1, '#ffad6a');
    c.fillStyle = g; c.beginPath(); c.arc(SX, SY, SR, 0, Math.PI * 2); c.fill();
    // a soft ring at the edge, as the airbrush leaves it
    c.strokeStyle = 'rgba(255,255,240,.45)'; c.lineWidth = 3; c.beginPath(); c.arc(SX, SY, SR - 14, Math.PI * 1.05, Math.PI * 1.6); c.stroke();
    c.restore();
  }, { t: 1.2, d: 2.0, reveal: 'slide', ease: 'out' });
  m.dy = 420;
  // concentric halos
  p.group('sun', { x: SX - SR - 130, y: SY - SR - 130, w: 2 * SR + 260, h: 2 * SR + 260 }, (c) => {
    c.save(); c.beginPath(); c.rect(0, TOP, W, HZ - TOP); c.clip();
    for (let k = 1; k <= 4; k++) { c.strokeStyle = `rgba(255,220,170,${0.22 - k * 0.04})`; c.lineWidth = 2; c.beginPath(); c.arc(SX, SY, SR + k * 26, 0, Math.PI * 2); c.stroke(); }
    c.restore();
  }, { t: 3.0, d: 1.0, reveal: 'iris', ease: 'out' });
}

// ================================================================ the towers
// a plain tower: a slab with a crown, and its rows of lit windows
function slab(x, w, top, kind, r) {
  const pts = [[x, HZ], [x, top]];
  if (kind === 1) pts.push([x + w * 0.5, top - w * 0.6]);
  if (kind === 2) { pts.push([x + w * 0.2, top], [x + w * 0.2, top - 14], [x + w * 0.8, top - 14], [x + w * 0.8, top]); }
  if (kind === 3) { pts.push([x + w * 0.45, top], [x + w * 0.5, top - 60], [x + w * 0.55, top]); }
  if (kind === 4) { pts.push([x + w * 0.15, top - 10], [x + w * 0.85, top - 10]); }
  pts.push([x + w, top], [x + w, HZ]);
  const lights = [];
  for (let y = top + 10; y < HZ - 6; y += 9) for (let xx = x + 4; xx < x + w - 4; xx += 7) if (r.chance(0.22)) lights.push([xx, y]);
  return { pts, lights, x, w, top };
}
function far(p, r) {
  // the far towers, hazed by the dust in the air
  const set = [];
  for (let x = 30; x < W - 30;) {
    const w = r.range(26, 50), top = HZ - r.range(90, 260) * (Math.abs(x - SX) < 300 ? 1.2 : 0.9);
    set.push(slab(x, w, top, r.int(0, 4), r));
    x += w + r.range(4, 24);
  }
  p.group('far', { x: 0, y: HZ - 380, w: W, h: 400 }, (c) => {
    c.fillStyle = SIL_FAR; c.beginPath(); for (const s of set) { poly(c, s.pts); c.fill(); }
    c.fillStyle = 'rgba(255,200,140,.55)'; c.beginPath();
    for (const s of set) for (const [x, y] of s.lights) c.rect(x, y, 2.5, 2);
    c.fill();
  }, { t: 3.0, d: 1.0, reveal: 'rise' });
}
function towers(p, r) {
  // the middle ranks, rim-lit, rising in groups from the edges in
  const groups = [[60, 560], [1040, 1560], [560, 700], [900, 1040]];
  groups.forEach(([x0, x1], gi) => {
    const set = [];
    for (let x = x0; x < x1;) {
      const w = r.range(34, 66), near = Math.abs(x + w / 2 - SX);
      const top = HZ - r.range(160, 420) * (near < 280 ? 1.1 : 0.85);
      set.push(slab(x, w, top, r.int(0, 4), r));
      x += w + r.range(10, 40);
    }
    p.group('towers', { x: x0 - 20, y: TOP, w: x1 - x0 + 120, h: HZ - TOP + 4 }, (c) => {
      for (const s of set) {
        const side = s.x + s.w / 2 < SX ? 1 : -1;
        rimmed(c, s.pts, SIL_MID, '#ff9f62', side, 2.2);
      }
      // glass bands and lit windows
      c.fillStyle = 'rgba(255,210,140,.85)'; c.beginPath();
      for (const s of set) for (const [x, y] of s.lights) c.rect(x, y, 3, 2.4);
      c.fill();
      c.strokeStyle = 'rgba(255,170,130,.18)'; c.lineWidth = 1; c.beginPath();
      for (const s of set) for (let x = s.x + 6; x < s.x + s.w - 4; x += 12) { c.moveTo(x, s.top + 8); c.lineTo(x, HZ); }
      c.stroke();
    }, { t: 3.6 + gi * 0.35, d: 1.0, reveal: 'rise', ease: 'out' });
  });
}

// the Burj Khalifa: setbacks stepping in round a core, then the needle
function burj(p, r) {
  // [top of the tier, half width on the left, half width on the right]
  const tiers = [[1110, 74, 66], [1000, 62, 52], [895, 50, 44], [800, 40, 33], [715, 31, 26], [645, 22, 19], [590, 15, 13], [548, 9, 8]];
  const pts = [[SX - tiers[0][1], HZ]];
  let y0 = HZ;
  for (const [y, hl] of tiers) { pts.push([SX - hl, y0], [SX - hl, y]); y0 = y; }
  pts.push([SX - 5, 548], [SX - 2.4, 500], [SX - 0.8, 452], [SX + 0.8, 452], [SX + 2.4, 500], [SX + 5, 548]);
  y0 = 548;
  for (let i = tiers.length - 1; i >= 0; i--) { const [y, , hr] = tiers[i]; const yb = i ? tiers[i - 1][0] : HZ; pts.push([SX + hr, y], [SX + hr, yb]); }
  pts.push([SX + tiers[0][2], HZ]);
  const box = { x: SX - 100, y: 430, w: 200, h: HZ - 420 };
  p.group('burj', box, (c) => {
    poly(c, pts);
    c.fillStyle = hgrad(c, SX - 76, SX + 70, [[0, '#0f2228'], [0.3, '#2f5a5c'], [0.46, '#d9a070'], [0.5, '#ffe0a8'], [0.54, '#8a6a4a'], [0.75, '#24403e'], [1, '#0d1c20']]);
    c.fill();
    c.strokeStyle = '#ffb27a'; c.lineWidth = 1.6; c.lineJoin = 'miter'; c.stroke();
  }, { t: 4.4, d: 1.8, reveal: 'rise', ease: 'inOut' });
  // the fins, the bands at each setback, the maintenance rings, and lights
  p.group('burj', box, (c) => {
    c.save(); poly(c, pts); c.clip();
    c.strokeStyle = 'rgba(255,220,180,.35)'; c.lineWidth = 1.2; c.beginPath();
    for (const dx of [-52, -38, -24, -12, 12, 24, 36, 48]) { c.moveTo(SX + dx, HZ); c.lineTo(SX + dx, 560); }
    c.stroke();
    c.strokeStyle = 'rgba(20,10,30,.6)'; c.lineWidth = 3; c.beginPath();
    for (const [y] of tiers) { c.moveTo(SX - 80, y + 2); c.lineTo(SX + 80, y + 2); }
    for (let y = 1200; y > 560; y -= 64) { c.moveTo(SX - 80, y); c.lineTo(SX + 80, y); }
    c.stroke();
    c.fillStyle = 'rgba(255,225,170,.9)'; c.beginPath();
    for (let y = 1236; y > 570; y -= 11) for (let x = SX - 66; x < SX + 66; x += 9) if (((x * 7 + y * 3) % 17) < 3) c.rect(x, y, 2.5, 2);
    c.fill();
    c.restore();
  }, { t: 6.2, d: 0.9, reveal: 'fade' });
}

// the landmarks among the towers
function landmarks(p, r) {
  // the Burj Al Arab's sail on its island, far off on the left
  const bx = 250, bt = 940;
  p.group('near', { x: bx - 70, y: bt - 30, w: 180, h: HZ - bt + 34 }, (c) => {
    const mast = [[bx - 26, HZ], [bx - 30, bt + 120], [bx - 18, bt + 20], [bx, bt - 10]];
    const sail = [[bx - 26, HZ], ...[...Array(13)].map((_, i) => { const t = i / 12; return [bx - 10 + Math.sin(t * Math.PI) * 70 - t * 10, lerp(HZ - 40, bt, t)]; }), [bx, bt - 10]];
    c.fillStyle = hgrad(c, bx - 40, bx + 70, [[0, '#d7b6c8'], [0.5, '#ffe2cc'], [1, '#8a5a8a']]);
    poly(c, sail); c.fill();
    c.strokeStyle = 'rgba(80,40,80,.45)'; c.lineWidth = 1; c.beginPath();
    for (let k = 1; k < 9; k++) { const y = lerp(HZ - 40, bt + 20, k / 9); c.moveTo(bx - 26, y); c.quadraticCurveTo(bx + 20, y + 6, bx + 50 * Math.sin(k / 9 * Math.PI), y); }
    c.stroke();
    c.strokeStyle = SIL; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); line(c, mast); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 30, bt + 90); c.lineTo(bx + 40, bt + 60); c.stroke();
    // the helipad, out on its arm
    c.fillStyle = SIL; c.beginPath(); c.ellipse(bx - 56, bt + 70, 22, 5, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = SIL; c.lineWidth = 3; c.beginPath(); c.moveTo(bx - 52, bt + 72); c.lineTo(bx - 28, bt + 100); c.stroke();
  }, { t: 5.6, d: 1.0, reveal: 'rise' });
  // the Museum of the Future: a silver ring on a green mound, cut with script
  const mx = 560, my = 1130, RO = [76, 88], RI = [36, 50];
  const cuts = [];
  for (let i = 0; i < 26; i++) {
    const a0 = r.range(0, Math.PI * 2), len = r.range(0.25, 0.7), rr = r.range(0.6, 0.9), wob = r.range(0.02, 0.06), ph = r.range(0, 6);
    const seg = [];
    for (let k = 0; k <= 10; k++) { const a = a0 + len * k / 10, q = rr + Math.sin(k * 0.9 + ph) * wob; seg.push([mx + Math.cos(a) * lerp(RI[0], RO[0], q), my + Math.sin(a) * lerp(RI[1], RO[1], q)]); }
    cuts.push(seg);
  }
  p.group('near', { x: mx - 110, y: my - 100, w: 220, h: HZ - my + 104 }, (c) => {
    c.fillStyle = '#3f5a3c'; c.beginPath(); c.ellipse(mx, HZ, 110, 46, 0, Math.PI, 0); c.fill();
    c.beginPath(); c.ellipse(mx, my, RO[0], RO[1], 0, 0, Math.PI * 2); c.ellipse(mx, my, RI[0], RI[1], 0, 0, Math.PI * 2);
    c.fillStyle = hgrad(c, mx - RO[0], mx + RO[0], [[0, '#6a5a7e'], [0.3, '#e8e4f0'], [0.5, '#a39cb6'], [0.7, '#fff1dd'], [1, '#5a4870']]);
    c.fill('evenodd');
    c.save(); c.beginPath(); c.ellipse(mx, my, RO[0], RO[1], 0, 0, Math.PI * 2); c.ellipse(mx, my, RI[0], RI[1], 0, 0, Math.PI * 2); c.clip('evenodd');
    c.strokeStyle = '#1c2a2c'; c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); for (const cu of cuts) line(c, cu); c.stroke();
    c.restore();
    c.strokeStyle = '#ffb27a'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(mx, my, RO[0], RO[1], 0, Math.PI * 0.6, Math.PI * 1.4); c.stroke();
  }, { t: 6.0, d: 0.8, reveal: 'pop', ease: 'back' });
  // the Emirates Towers: two blades with slanted tops
  p.group('near', { x: 1040, y: 820, w: 170, h: HZ - 816 }, (c) => {
    for (const [x, w, top] of [[1050, 50, 880], [1120, 44, 940]]) {
      const pts = [[x, HZ], [x, top + 60], [x + w, top], [x + w, HZ]];
      rimmed(c, pts, '#1e3436', '#ffa66a', -1, 2.4);
      c.strokeStyle = 'rgba(255,200,170,.35)'; c.lineWidth = 1; c.beginPath();
      for (let y = top + 70; y < HZ; y += 8) { c.moveTo(x + 4, y); c.lineTo(x + w - 4, y); }
      c.stroke();
      c.strokeStyle = '#ffd09a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + w * 0.7, top + 12); c.lineTo(x + w * 0.7, top - 40); c.stroke();
    }
  }, { t: 5.8, d: 1.0, reveal: 'rise' });
  // the Cayan Tower, twisting
  p.group('near', { x: 1240, y: 860, w: 100, h: HZ - 856 }, (c) => {
    const L = [], R = [], cx = 1290;
    for (let y = 900; y <= HZ; y += 6) { const ph = (y - 900) * 0.012; L.push([cx - 22 + Math.sin(ph) * 6, y]); R.push([cx + 22 + Math.sin(ph) * 6, y]); }
    const pts = [...L, ...R.reverse()];
    rimmed(c, pts, '#22383a', '#ff9f62', -1, 2.2);
    c.save(); poly(c, pts); c.clip();
    c.strokeStyle = 'rgba(255,190,150,.35)'; c.lineWidth = 1.4; c.beginPath();
    for (let y = 860; y < HZ + 40; y += 18) { c.moveTo(cx - 30, y); c.lineTo(cx + 30, y - 22); }
    c.stroke(); c.restore();
  }, { t: 6.2, d: 0.9, reveal: 'rise' });
  // the Dubai Frame: a gold picture frame stood on end, the sky inside it
  const fx = 1440, ft = 1010;
  p.group('near', { x: fx - 60, y: ft - 10, w: 120, h: HZ - ft + 12 }, (c) => {
    c.beginPath(); c.rect(fx - 50, ft, 100, HZ - ft); c.rect(fx - 30, ft + 18, 60, HZ - ft - 40);
    c.fillStyle = hgrad(c, fx - 50, fx + 50, [[0, '#9a6a26'], [0.3, '#ffe08a'], [0.55, '#c8902e'], [0.8, '#ffd27a'], [1, '#8a5a1e']]);
    c.fill('evenodd');
    c.strokeStyle = 'rgba(90,50,20,.6)'; c.lineWidth = 1; c.beginPath();
    for (let y = ft + 8; y < HZ; y += 10) { c.moveTo(fx - 48, y); c.lineTo(fx - 32, y); c.moveTo(fx + 32, y); c.lineTo(fx + 48, y); }
    c.stroke();
  }, { t: 6.5, d: 0.9, reveal: 'rise' });
  // the metro's viaduct across the foot of the city
  p.group('near', { x: 0, y: HZ - 40, w: W, h: 50 }, (c) => {
    c.fillStyle = '#142022'; c.fillRect(0, HZ - 34, W, 9);
    c.fillStyle = '#ff9f62'; c.fillRect(0, HZ - 34, W, 1.6);
    c.fillStyle = '#142022'; for (let x = 40; x < W; x += 120) { c.beginPath(); c.moveTo(x - 6, HZ); c.lineTo(x - 4, HZ - 25); c.lineTo(x + 4, HZ - 25); c.lineTo(x + 6, HZ); c.fill(); }
  }, { t: 7.0, d: 0.9, reveal: 'wipe', ease: 'inOut' });
}

// ================================================================ the old town and the creek
const BANK = 1316;
function oldTown(p, r) {
  // low houses of coral stone with square wind towers
  const houses = [];
  for (let x = -10; x < W + 10;) {
    const w = r.range(40, 90), h = r.range(26, 50);
    houses.push([x, w, h, r.chance(0.45), r.range(0.25, 0.7)]);
    x += w + r.range(-4, 6);
  }
  p.group('old', { x: 0, y: HZ - 60, w: W, h: BANK - HZ + 64 }, (c) => {
    c.fillStyle = '#5a3a2e'; c.fillRect(0, HZ - 6, W, BANK - HZ + 8);
    for (const [x, w, h, tower, tx] of houses) {
      const y = BANK - 8 - h;
      c.fillStyle = '#b0605a'; c.fillRect(x, y, w, h + 8);
      c.fillStyle = '#e8956a'; c.fillRect(x, y, w, 3);
      if (tower) {
        const wx = x + w * tx, ww = 22;
        c.fillStyle = '#a4545a'; c.fillRect(wx, y - 56, ww, 56);
        c.fillStyle = '#e8956a'; c.fillRect(wx - 3, y - 60, ww + 6, 4); c.fillRect(wx, y - 56, 2, 56);
        c.fillStyle = '#2a1e1a'; for (let k = 0; k < 4; k++) c.fillRect(wx + 3 + k * 4.6, y - 52, 2.4, 26);
      }
      c.fillStyle = '#2a1e1a'; for (let dx = 10; dx < w - 8; dx += 18) c.fillRect(x + dx, y + h * 0.45, 5, 9);
    }
  }, { t: 6.8, d: 0.9, reveal: 'rise' });
  // dhows moored along the bank
  const dhows = [];
  for (let i = 0; i < 9; i++) dhows.push([60 + i * 170 + r.range(-30, 30), r.range(0.7, 1.1)]);
  p.group('old', { x: 0, y: BANK - 100, w: W, h: 116 }, (c) => {
    for (const [x, s] of dhows) {
      c.fillStyle = '#1c1a18'; c.beginPath();
      c.moveTo(x - 44 * s, BANK - 14 * s); c.lineTo(x + 40 * s, BANK - 14 * s); c.lineTo(x + 54 * s, BANK - 26 * s); c.lineTo(x + 36 * s, BANK + 2); c.lineTo(x - 38 * s, BANK + 2); c.closePath(); c.fill();
      c.strokeStyle = '#1c1a18'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(x, BANK - 14 * s); c.lineTo(x - 4 * s, BANK - 80 * s);
      c.moveTo(x - 40 * s, BANK - 60 * s); c.lineTo(x + 30 * s, BANK - 86 * s); c.stroke();
      c.strokeStyle = '#ff9f62'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 40 * s, BANK - 14 * s); c.lineTo(x + 40 * s, BANK - 14 * s); c.stroke();
    }
  }, { t: 7.2, d: 0.7, reveal: 'rise' });
}
function creek(p, r) {
  const y0 = BANK, y1 = 1510;
  p.group('creek', { x: 0, y: y0 - 2, w: W, h: y1 - y0 + 4 }, (c) => {
    c.fillStyle = vgrad(c, y0, y1, [[0, '#eca05e'], [0.35, '#8a8a62'], [1, '#1f4a52']]); c.fillRect(0, y0, W, y1 - y0);
    // the sun's road on the water
    c.fillStyle = vgrad(c, y0, y1, [[0, 'rgba(255,236,180,.95)'], [1, 'rgba(255,236,180,.2)']]);
    for (let k = 0; k < 14; k++) {
      const y = y0 + 4 + k * k * 0.66 + k * 2, hw = 220 - k * 9;
      c.fillRect(SX - hw + Math.sin(k * 2.3) * 20, y, 2 * hw, 2 + k * 0.25);
    }
  }, { t: 7.0, d: 1.0, reveal: 'wipe', ease: 'inOut' });
  // reflections of the towers, broken
  const refl = [];
  for (let i = 0; i < 160; i++) { const x = r.range(0, W); refl.push([x, y0 + 4 + r() ** 1.5 * 100, r.range(10, 40)]); }
  p.group('creek', { x: 0, y: y0, w: W, h: y1 - y0 }, (c) => {
    c.fillStyle = 'rgba(20,34,36,.45)'; c.beginPath();
    for (const [x, y, w] of refl) if (Math.abs(x - SX) > 200 || y > y0 + 50) c.rect(x, y, w, 2);
    c.fill();
    c.fillStyle = 'rgba(20,34,36,.55)'; c.fillRect(SX - 6, y0, 12, 60);
  }, { t: 7.6, d: 0.8, reveal: 'fade' });
}

// ================================================================ the dunes
// a dune: its crest as a curve, filled down to the foot, lit along the top
function dune(p, layer, crest, foot, t, cols, r) {
  const pts = [...crest, [W + 20, H + 20], [-20, H + 20]];
  const top = Math.min(...crest.map((q) => q[1]));
  // wind ripples following the crest
  const rip = [];
  for (let k = 1; k < 26; k++) {
    const off = k * k * 0.9 + k * 6;
    const seg = []; let on = false;
    for (let i = 0; i < crest.length; i += 2) {
      const [x, y] = crest[i];
      const wob = Math.sin(x * 0.02 + k * 1.3) * (2 + k * 0.3);
      if (r.chance(0.06)) on = !on;
      if (on) seg.push([x, y + off + wob]); else if (seg.length > 1) { rip.push(seg.splice(0)); } else seg.length = 0;
    }
    if (seg.length > 1) rip.push(seg);
  }
  p.group(layer, { x: 0, y: top - 6, w: W, h: H - top + 6 }, (c) => {
    poly(c, pts);
    c.fillStyle = vgrad(c, top, foot, cols); c.fill();
  }, { t, d: 1.0, reveal: 'rise', ease: 'out' });
  p.group(layer, { x: 0, y: top - 6, w: W, h: H - top + 6 }, (c) => {
    c.save(); poly(c, pts); c.clip();
    c.strokeStyle = 'rgba(255,190,140,.22)'; c.lineWidth = 1.6; c.beginPath(); for (const l of rip) line(c, l); c.stroke();
    c.restore();
    c.strokeStyle = '#ffc48a'; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath(); line(c, crest); c.stroke();
  }, { t: t + 0.6, d: 0.9, reveal: 'wipe', ease: 'inOut' });
}
const crestOf = (x0, x1, f) => { const pts = []; for (let x = x0; x <= x1; x += 10) pts.push([x, f(x)]); return pts; };
const backCrest = (x) => 1440 - 34 * Math.sin((x + 200) / 520 * Math.PI) - 12 * Math.sin(x / 140);
const midCrest = (x) => 1580 - 150 * Math.exp(-(((x - 860) / (x < 860 ? 560 : 320)) ** 2)) + 8 * Math.sin(x / 90);
const frontCrest = (x) => 1780 - 90 * Math.exp(-(((x - 420) / 380) ** 2)) + (x > 700 ? (x - 700) * 0.06 : 0) - 26 * Math.sin(x / 210);
function dunes(p, r) {
  dune(p, 'duneBack', crestOf(-20, W + 20, backCrest), 1700, 7.7, [[0, '#e08a4c'], [0.25, '#a0502e'], [1, '#3e2622']], r);
  dune(p, 'duneMid', crestOf(-20, W + 20, midCrest), 1900, 8.1, [[0, '#ec944c'], [0.2, '#aa562e'], [0.7, '#4a2a22'], [1, '#24161a']], r);
  dune(p, 'duneFront', crestOf(-20, W + 20, frontCrest), H, 8.5, [[0, '#f6a654'], [0.12, '#b85e30'], [0.5, '#4a2620'], [1, '#170e10']], r);
  // grass tufts and a trail of footprints over the front dune
  const tufts = [], prints = [];
  for (let i = 0; i < 26; i++) { const x = r.range(40, W - 40); tufts.push([x, frontCrest(x) + r.range(40, 200), r.range(10, 24)]); }
  for (let i = 0; i < 40; i++) { const t = i / 40, x = lerp(1520, 860, t), y = lerp(1980, frontCrest(860) + 20, t ** 0.8); prints.push([x + (i % 2 ? 6 : -6), y]); }
  p.group('duneFront', { x: 0, y: 1600, w: W, h: 400 }, (c) => {
    c.strokeStyle = '#2a1a12'; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath();
    for (const [x, y, h] of tufts) for (let k = -3; k <= 3; k++) { c.moveTo(x, y); c.quadraticCurveTo(x + k * 3, y - h * 0.6, x + k * h * 0.22, y - h * (1 - Math.abs(k) * 0.1)); }
    c.stroke();
    c.fillStyle = 'rgba(26,14,10,.55)'; c.beginPath();
    for (const [x, y] of prints) { c.moveTo(x + 4, y); c.ellipse(x, y, 4, 2, 0, 0, Math.PI * 2); }
    c.fill();
  }, { t: 9.4, d: 0.8, reveal: 'fade' });
}

// a traveler in a long robe on the near dune, looking at the city, with a staff
function traveler(p) {
  const x = 1120, y = frontCrest(1120) + 10, k = 1.7;
  p.group('duneFront', { x: x - 40 * k, y: y - 110 * k, w: 300 * k, h: 160 * k }, (c) => {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = 'rgba(26,14,10,.5)'; c.beginPath(); c.moveTo(-10, 0); c.lineTo(12, 0); c.lineTo(230, 70); c.lineTo(200, 74); c.closePath(); c.fill();
    c.fillStyle = '#1a1210'; c.beginPath();
    c.moveTo(-14, 0); c.lineTo(-8, -60); c.quadraticCurveTo(0, -70, 8, -60); c.lineTo(15, 0); c.closePath(); c.fill();
    c.beginPath(); c.arc(0, -72, 8, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#1a1210'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(20, 2); c.lineTo(26, -92); c.stroke();
    c.strokeStyle = '#ffb27a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-7, -58); c.quadraticCurveTo(-2, -66, 2, -66); c.moveTo(-6, -76); c.arc(0, -72, 7.5, Math.PI * 1.1, Math.PI * 1.6); c.moveTo(-13, -2); c.lineTo(-8, -58); c.stroke();
    c.restore();
  }, { t: 10.2, d: 0.7, reveal: 'rise' });
}

// ================================================================ the live things
function life(p, r) {
  // an abra crossing the creek: a long wooden boat with a canopy and passengers
  p.live('live', {
    t: 9.9, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const x = -140 + ((time * 26) % (W + 280)), y = 1392 + Math.sin(time * 1.7) * 1.5;
      c.fillStyle = 'rgba(26,14,10,.35)'; c.fillRect(x - 70, y + 4, 140, 4);
      c.fillStyle = '#5a2e2a'; c.beginPath(); c.moveTo(x - 70, y - 12); c.lineTo(x + 66, y - 12); c.lineTo(x + 78, y - 22); c.lineTo(x + 58, y + 2); c.lineTo(x - 62, y + 2); c.closePath(); c.fill();
      c.fillStyle = '#ffb27a'; c.fillRect(x - 70, y - 14, 140, 2);
      c.fillStyle = '#1c1a18'; for (let k = 0; k < 7; k++) { c.fillRect(x - 50 + k * 15, y - 30, 7, 18); c.beginPath(); c.arc(x - 46.5 + k * 15, y - 34, 4, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#e8c08a'; c.fillRect(x - 60, y - 48, 116, 6);
      c.fillStyle = '#1c1a18'; c.fillRect(x - 58, y - 42, 2, 30); c.fillRect(x + 52, y - 42, 2, 30);
      c.strokeStyle = 'rgba(255,230,190,.6)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 80, y + 3); c.lineTo(x - 130, y + 6); c.moveTo(x - 76, y + 8); c.lineTo(x - 110, y + 11); c.stroke();
    },
  });
  // the metro train gliding along its viaduct
  p.live('live', {
    t: 10.1, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const x = -300 + ((time * 120) % 2200);
      const y = HZ - 35;
      c.fillStyle = '#dcd6ea';
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 230, y); c.quadraticCurveTo(x + 262, y, x + 266, y - 12); c.quadraticCurveTo(x + 256, y - 22, x + 230, y - 22); c.lineTo(x, y - 22); c.closePath(); c.fill();
      c.fillStyle = '#142022'; c.fillRect(x + 6, y - 17, 236, 6);
      c.fillStyle = '#ff9f62'; c.fillRect(x, y - 4, 250, 2);
      c.fillStyle = '#9890b2'; for (let k = 1; k < 4; k++) c.fillRect(x + k * 62, y - 22, 2, 22);
    },
  });
  // flamingos flying across the dusk in a loose skein
  const birds = [];
  for (let i = 0; i < 9; i++) birds.push([i * 34 + (i % 2) * 10, Math.abs(i - 4) * 14 + (i % 3) * 4, i * 0.7]);
  p.live('live', {
    t: 10.3, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      const ox = W + 80 - ((time * 40) % (W + 500)), oy = 760 + Math.sin(time * 0.3) * 20;
      c.lineCap = 'round';
      for (const [dx, dy, ph] of birds) {
        const x = ox + dx * 1.5, y = oy + dy * 1.4, f = Math.sin(time * 6 + ph);
        c.strokeStyle = '#ff8fa8'; c.lineWidth = 2.4; c.beginPath();
        c.moveTo(x - 24, y + 1); c.lineTo(x + 22, y);
        c.moveTo(x - 2, y); c.lineTo(x - 12, y - 16 * f); c.moveTo(x + 2, y); c.lineTo(x + 8, y - 14 * f);
        c.stroke();
        c.strokeStyle = '#1c1a18'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 24, y + 1); c.lineTo(x - 30, y + 4); c.stroke();
      }
    },
  });
  // a camel train walking the crest of the middle dune, long shadows behind
  p.live('live', {
    t: 10.5, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      for (let k = 0; k < 5; k++) {
        const x = 1180 - ((time * 9 + k * 58) % 1000), y = midCrest(x) + 2;
        if (frontCrest(x) - y < 40) continue;
        const s = k === 0 ? 0.8 : 1, step = Math.sin(time * 3 + k) * 3;
        c.fillStyle = 'rgba(26,14,10,.4)';
        c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x + 14, y); c.lineTo(x + 40, y + 34); c.lineTo(x + 8, y + 34); c.fill();
        c.fillStyle = '#1a1210';
        c.beginPath(); c.ellipse(x, y - 30 * s, 20 * s, 11 * s, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(x - 2, y - 40 * s, 9 * s, 7 * s, 0, 0, Math.PI * 2); c.fill();
        c.lineWidth = 3.2 * s; c.strokeStyle = '#1a1210'; c.lineCap = 'round'; c.beginPath();
        c.moveTo(x - 16 * s, y - 32 * s); c.quadraticCurveTo(x - 30 * s, y - 36 * s, x - 30 * s, y - 50 * s); c.lineTo(x - 38 * s, y - 50 * s);
        c.moveTo(x - 12 * s, y - 24 * s); c.lineTo(x - 12 * s + step, y); c.moveTo(x - 6 * s, y - 24 * s); c.lineTo(x - 6 * s - step, y);
        c.moveTo(x + 10 * s, y - 24 * s); c.lineTo(x + 10 * s - step, y); c.moveTo(x + 16 * s, y - 24 * s); c.lineTo(x + 16 * s + step, y);
        c.stroke();
        if (k % 2 === 0) { c.fillRect(x - 3, y - 58 * s, 6, 14); c.beginPath(); c.arc(x, y - 61 * s, 3.5, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#ffb27a'; c.fillRect(x - 20 * s, y - 31 * s, 40 * s, 1.4);
      }
    },
  });
  // a few stars that twinkle, and the beacon at the needle's tip
  const tw = [];
  for (let i = 0; i < 14; i++) tw.push([r.range(40, W - 40), r.range(TOP + 20, TOP + 260), r.range(0, 6)]);
  p.live('live', {
    t: 10.7, d: 1.0, reveal: 'fade',
    draw: (c, time) => {
      c.fillStyle = CREAM; c.beginPath();
      for (const [x, y, ph] of tw) {
        const q = Math.sin(time * 2 + ph);
        if (q > 0.4) { const s = q * 5; c.moveTo(x - s, y); c.lineTo(x, y - 0.8); c.lineTo(x + s, y); c.lineTo(x, y + 0.8); c.moveTo(x, y - s); c.lineTo(x + 0.8, y); c.lineTo(x, y + s); c.lineTo(x - 0.8, y); }
      }
      c.fill();
      if (Math.sin(time * 3) > 0.2) { c.fillStyle = '#ff5050'; c.beginPath(); c.arc(SX, 454, 3, 0, Math.PI * 2); c.fill(); }
    },
  });
}

// ================================================================ the title
// DUBAI in chrome: a cold sky in the top of each letter, a dark horizon, the
// desert's gold reflected in the bottom
function title(p, r) {
  const y = 298;
  const res = p.type('title', 'DUBAI', W / 2, y, { family: FACE, weight: 900, size: 230, color: '#fff', align: 'center', track: 0.08, fit: 1320, t: 10.9, gap: 0.22, d: 0.8, reveal: 'drop', ease: 'back' });
  const f = `normal 900 ${res.size}px ${FACE}`;
  const capTop = y - res.size * 0.72;
  res.glyphs.forEach((m, i) => {
    const ch = 'DUBAI'[i], gx = m.box.x + res.size * 0.15;
    m.dy = 50;
    m.box = { ...m.box, y: m.box.y - 30, h: m.box.h + 60 };
    m.draw = (c) => {
      c.font = f; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      c.fillStyle = TEAL; c.fillText(ch, gx + 8, y + 8);
      c.fillStyle = vgrad(c, capTop, y, [[0, '#f4f8ff'], [0.42, '#8ea6d8'], [0.5, '#1c1430'], [0.53, '#5a2a4a'], [0.62, ORANGE], [1, '#fff0c0']]);
      c.fillText(ch, gx, y);
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; c.strokeText(ch, gx, y);
    };
  });
  // the lines above and below
  p.group('title', { x: 0, y: 60, w: W, h: 70 }, (c) => setLine(c, 'A JOURNEY TO THE CITY OF TOMORROW', W / 2, 112, 30, 500, GOLD, 0.32),
    { t: 12.1, d: 0.9, reveal: 'wipe', ease: 'inOut' });
  p.group('title', { x: 0, y: 320, w: W, h: 40 }, (c) => {
    setLine(c, 'DUBAI CREEK · DOWNTOWN · JUMEIRAH', 70, 350, 17, 500, 'rgba(255,207,126,.8)', 0.24, 'left');
    setLine(c, '25° 16′ N 55° 18′ E', W - 70, 350, 17, 500, 'rgba(255,207,126,.8)', 0.24, 'right');
  }, { t: 12.5, d: 0.7, reveal: 'fade' });
  // a glint on the D and on the needle's tip
  const glint = (c, x, y, s) => {
    c.fillStyle = '#fff'; c.beginPath();
    c.moveTo(x - s, y); c.lineTo(x - s * 0.1, y - s * 0.1); c.lineTo(x, y - s); c.lineTo(x + s * 0.1, y - s * 0.1); c.lineTo(x + s, y); c.lineTo(x + s * 0.1, y + s * 0.1); c.lineTo(x, y + s); c.lineTo(x - s * 0.1, y + s * 0.1); c.closePath(); c.fill();
  };
  const gx = res.glyphs[0].box.x + res.size * 0.3;
  p.group('title', { x: gx - 40, y: capTop - 40, w: 80, h: 80 }, (c) => glint(c, gx, capTop + 6, 34), { t: 12.9, d: 0.5, reveal: 'pop', ease: 'back' });
}
