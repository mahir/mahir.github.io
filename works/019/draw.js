// draw.js: a listing's picture, drawn from its attributes. Nothing is stored: craft and form give the
// silhouette, the color fills it, the surface is laid over it in the second color, and the shop picks the
// backdrop, so the things the feeds compare are things the eye can compare too.
//
//   svg(listing)  -> an SVG string, viewBox 0 0 100 100
//   url(listing)  -> an object URL for it, made once and kept (the same listing shows in several feeds)
//
// Every listing is seeded by its id, so its speckles and stems are its own and never change.

import { COLORS, SURFACES, CRAFTS } from './vocab.js';

// ---------------------------------------------------------------- randomness and color
function rng(...xs) {
  let h = 2166136261 >>> 0;
  for (const x of xs) { const s = String(x); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } h ^= 0x9e37; h = Math.imul(h, 2246822519) >>> 0; }
  let a = h >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const n = (v) => +v.toFixed(1);
const INK = '#2b2926', PAPER = '#f6f0e3', OAK = '#c9a16a', BRASS = '#b9923f';

// A shop photographs everything against one backdrop: a wall and the table under it.
const BACKDROPS = [
  ['#e7decd', '#d2c4aa'], ['#d6d9cf', '#bcc2b3'], ['#ead8cd', '#d8bdab'],
  ['#d0d7da', '#b3bec3'], ['#dfd4be', '#c1b190'], ['#c5cdc2', '#a9b4a6'],
];

// ---------------------------------------------------------------- surfaces
// Marks laid over a box in the second color; the caller clips them to the object. `s` scales the marks.
function marks(l, r, box, ink, ink2, opt = {}) {
  const [x0, y0, x1, y1] = box, w = x1 - x0, h = y1 - y0, s = opt.s || 1;
  const kind = SURFACES[l.surface];
  let out = '';
  if (kind === 'striped') {
    const horizontal = opt.dir ? opt.dir === 'h' : r() < 0.5;
    const band = (2.2 + r() * 2.6) * s, gap = band * (0.9 + r() * 1.1), pair = r() < 0.35;
    const len = horizontal ? h : w;
    for (let p = -band * r(); p < len; p += band + gap) {
      out += horizontal ? `<rect x="${n(x0)}" y="${n(y0 + p)}" width="${n(w)}" height="${n(band)}"/>` : `<rect x="${n(x0 + p)}" y="${n(y0)}" width="${n(band)}" height="${n(h)}"/>`;
      if (pair) { const q = p + band + gap * 0.3, t = band * 0.28; out += horizontal ? `<rect x="${n(x0)}" y="${n(y0 + q)}" width="${n(w)}" height="${n(t)}"/>` : `<rect x="${n(x0 + q)}" y="${n(y0)}" width="${n(t)}" height="${n(h)}"/>`; }
    }
    return `<g fill="${ink}">${out}</g>`;
  }
  if (kind === 'speckled') {
    const count = Math.round((w * h) / (9 + r() * 7) / (s * s));
    let a = '', b = '';
    for (let i = 0; i < count; i++) {
      const c = `<circle cx="${n(x0 + r() * w)}" cy="${n(y0 + r() * h)}" r="${n((0.3 + r() * r() * 0.9) * s)}"/>`;
      if (r() < 0.7) a += c; else b += c;
    }
    return `<g fill="${ink}">${a}</g><g fill="${ink2}">${b}</g>`;
  }
  if (kind === 'checked') {
    const cell = (3 + r() * 2.4) * s;
    for (let y = y0 - cell * r(); y < y1; y += cell * 2) out += `<rect x="${n(x0)}" y="${n(y)}" width="${n(w)}" height="${n(cell)}"/>`;
    for (let x = x0 - cell * r(); x < x1; x += cell * 2) out += `<rect x="${n(x)}" y="${n(y0)}" width="${n(cell)}" height="${n(h)}"/>`;
    return `<g fill="${ink}" fill-opacity=".55">${out}</g>`;
  }
  if (kind === 'botanical') {
    const cell = 12.5 * s;
    let stems = '', leaves = '', dots = '';
    for (let gy = y0 - cell * 0.4; gy < y1 + cell * 0.3; gy += cell) for (let gx = x0 - cell * 0.4 + ((Math.round((gy - y0) / cell) % 2) * cell) / 2; gx < x1 + cell * 0.3; gx += cell) {
      const ox = gx + r() * cell * 0.5, oy = gy + cell * 0.9 + r() * cell * 0.3;
      const ang = (-90 + (r() - 0.5) * 70) * Math.PI / 180, len = cell * (0.75 + r() * 0.3), bend = (r() - 0.5) * 0.7;
      const pt = (t) => { const a = ang + bend * t; return [ox + Math.cos(a) * len * t, oy + Math.sin(a) * len * t, a]; };
      const [ex, ey] = pt(1), [mx, my] = pt(0.5);
      stems += `<path d="M${n(ox)} ${n(oy)}Q${n(mx + (mx - (ox + ex) / 2) * 2)} ${n(my + (my - (oy + ey) / 2) * 2)} ${n(ex)} ${n(ey)}"/>`;
      for (let k = 1; k <= 4; k++) {
        const [px, py, a] = pt(0.2 + k * 0.2);
        for (const side of [-1, 1]) {
          const la = a + side * 0.85, cx = px + Math.cos(la) * 1.7 * s, cy = py + Math.sin(la) * 1.7 * s;
          leaves += `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(1.9 * s)}" ry="${n(0.8 * s)}" transform="rotate(${n(la * 180 / Math.PI)} ${n(cx)} ${n(cy)})"/>`;
        }
      }
      if (r() < 0.6) dots += `<circle cx="${n(gx + r() * cell)}" cy="${n(gy + r() * cell)}" r="${n(0.75 * s)}"/>`;
    }
    return `<g fill="none" stroke="${ink}" stroke-width="${n(0.5 * s)}" stroke-linecap="round">${stems}</g><g fill="${ink}">${leaves}</g><g fill="${ink2}">${dots}</g>`;
  }
  if (kind === 'geometric') {
    const cell = (6.5 + r() * 2.5) * s;
    let a = '', b = '';
    for (let y = y0 - cell * r(); y < y1; y += cell) for (let x = x0 - cell * r() * 0.5; x < x1; x += cell) {
      const k = Math.floor(r() * 7), q = Math.floor(r() * 4), c = cell;
      const corner = [[x, y], [x + c, y], [x + c, y + c], [x, y + c]];
      let m = '';
      if (k === 0) { const [p, e, f] = [corner[q], corner[(q + 1) % 4], corner[(q + 3) % 4]]; m = `<path d="M${n(p[0])} ${n(p[1])}L${n(e[0])} ${n(e[1])}A${n(c)} ${n(c)} 0 0 1 ${n(f[0])} ${n(f[1])}Z"/>`; }
      else if (k === 1) { const [p, e] = [corner[q], corner[(q + 1) % 4]]; m = `<path d="M${n(p[0])} ${n(p[1])}A${n(c / 2)} ${n(c / 2)} 0 0 1 ${n(e[0])} ${n(e[1])}Z"/>`; }
      else if (k === 2) { const [p, e, f] = [corner[q], corner[(q + 1) % 4], corner[(q + 2) % 4]]; m = `<path d="M${n(p[0])} ${n(p[1])}L${n(e[0])} ${n(e[1])}L${n(f[0])} ${n(f[1])}Z"/>`; }
      else if (k === 3) m = `<circle cx="${n(x + c / 2)}" cy="${n(y + c / 2)}" r="${n(c * 0.32)}"/>`;
      else if (k === 4) m = `<rect x="${n(x + c * 0.2)}" y="${n(y + c * 0.2)}" width="${n(c * 0.6)}" height="${n(c * 0.6)}"/>`;
      if (r() < 0.62) a += m; else b += m;
    }
    return `<g fill="${ink}">${a}</g><g fill="${ink2}">${b}</g>`;
  }
  return '';
}

// ---------------------------------------------------------------- shared parts
let uid = '';
const clip = (name, shape) => `<clipPath id="${uid}${name}">${shape}</clipPath>`;
const clipped = (name, inner) => `<g clip-path="url(#${uid}${name})">${inner}</g>`;
// A round thing catches light on the left and falls into shade on the right.
const volume = (x0, x1, y0, y1) => {
  const w = x1 - x0;
  return `<rect x="${n(x1 - w * 0.3)}" y="${n(y0)}" width="${n(w * 0.3)}" height="${n(y1 - y0)}" fill="#000" fill-opacity=".11"/><rect x="${n(x0 + w * 0.1)}" y="${n(y0)}" width="${n(w * 0.09)}" height="${n(y1 - y0)}" fill="#fff" fill-opacity=".13"/>`;
};
const ground = (cx, y, rx, ry = 2.6) => `<ellipse cx="${n(cx + rx * 0.12)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="#000" fill-opacity=".14"/>`;
const flame = (cx, y) => `<path d="M${n(cx)} ${n(y)}v-2.2" stroke="${INK}" stroke-width=".6" stroke-linecap="round"/><path d="M${n(cx)} ${n(y - 9.5)}c3.2 4 2.6 7.6 0 7.6s-3.2-3.6 0-7.6z" fill="#f0a63a"/><path d="M${n(cx)} ${n(y - 6.2)}c1.4 1.9 1.2 3.9 0 3.9s-1.4-2 0-3.9z" fill="#fbe6a8"/>`;

const BASE = 81;   // where things stand on the table
const HORIZON = 60;

// ---------------------------------------------------------------- the eight crafts
// Each returns { scene: 'table' | 'floor' | 'wall', body } for a 100 by 100 picture.
const draw = {
  mug(l, r, c) {
    const [w, h] = [[35, 31], [29, 43], [25, 19]][l.form].map((v) => v * (0.96 + r() * 0.08));
    const cx = 47, x0 = cx - w / 2, x1 = cx + w / 2, y0 = BASE - h, t = l.form === 2 ? 3 : 1.6, rr = l.form === 2 ? 8 : 5;
    const body = `<path d="M${n(x0)} ${n(y0)}H${n(x1)}L${n(x1 - t)} ${n(BASE - rr)}Q${n(x1 - t)} ${BASE} ${n(x1 - t - rr)} ${BASE}H${n(x0 + t + rr)}Q${n(x0 + t)} ${BASE} ${n(x0 + t)} ${n(BASE - rr)}Z"/>`;
    const reach = l.form === 2 ? 7.5 : 11, thick = l.form === 2 ? 3 : 4.2;
    const handle = `<path d="M${n(x1 - 1)} ${n(y0 + h * 0.2)}C${n(x1 + reach)} ${n(y0 + h * 0.14)} ${n(x1 + reach)} ${n(y0 + h * 0.8)} ${n(x1 - 2)} ${n(y0 + h * 0.7)}" fill="none" stroke="${c.main}" stroke-width="${thick}" stroke-linecap="round"/><path d="M${n(x1 - 1)} ${n(y0 + h * 0.2)}C${n(x1 + reach)} ${n(y0 + h * 0.14)} ${n(x1 + reach)} ${n(y0 + h * 0.8)} ${n(x1 - 2)} ${n(y0 + h * 0.7)}" fill="none" stroke="#000" stroke-opacity=".11" stroke-width="${thick}" stroke-linecap="round"/>`;
    const saucer = l.form === 2 ? `<ellipse cx="${cx}" cy="${BASE + 0.6}" rx="${n(w * 0.92)}" ry="3.6" fill="${c.main}"/><ellipse cx="${cx}" cy="${BASE + 0.2}" rx="${n(w * 0.92)}" ry="3.2" fill="#fff" fill-opacity=".22"/>` : '';
    return { scene: 'table', body: `${clip('b', body)}${ground(cx, BASE + (l.form === 2 ? 2.2 : 0.4), w * (l.form === 2 ? 1 : 0.62))}${saucer}${handle}<g fill="${c.main}">${body}</g>${clipped('b', marks(l, r, [x0, y0, x1, BASE], c.ink, c.ink2, { dir: 'h' }) + volume(x0, x1, y0, BASE))}<ellipse cx="${cx}" cy="${n(y0)}" rx="${n(w / 2)}" ry="2.7" fill="${c.light}"/><ellipse cx="${cx}" cy="${n(y0 + 0.3)}" rx="${n(w / 2 - 1.3)}" ry="1.9" fill="${c.deep}"/>` };
  },

  vase(l, r, c) {
    const cx = 50;
    let body, x0, x1, y0, mouth;
    if (l.form === 0) {            // bottle: a narrow neck on wide shoulders
      const h = 50 + r() * 5, hw = 13 + r() * 2.5; y0 = BASE - h; x0 = cx - hw; x1 = cx + hw; mouth = 4.4;
      body = `<path d="M${cx - mouth} ${n(y0)}H${cx + mouth}V${n(y0 + 12)}C${cx + mouth} ${n(y0 + 20)} ${n(x1)} ${n(y0 + 19)} ${n(x1)} ${n(y0 + 30)}V${BASE - 4}Q${n(x1)} ${BASE} ${n(x1 - 4)} ${BASE}H${n(x0 + 4)}Q${n(x0)} ${BASE} ${n(x0)} ${BASE - 4}V${n(y0 + 30)}C${n(x0)} ${n(y0 + 19)} ${cx - mouth} ${n(y0 + 20)} ${cx - mouth} ${n(y0 + 12)}Z"/>`;
    } else if (l.form === 1) {     // bud vase: a ball with a short neck
      const h = 33 + r() * 4, hw = 16 + r() * 2; y0 = BASE - h; x0 = cx - hw; x1 = cx + hw; mouth = 3.4;
      body = `<path d="M${cx - mouth} ${n(y0)}H${cx + mouth}V${n(y0 + 6)}C${n(x1 + 3)} ${n(y0 + 8)} ${n(x1 + 3)} ${BASE} ${cx + 6} ${BASE}H${cx - 6}C${n(x0 - 3)} ${BASE} ${n(x0 - 3)} ${n(y0 + 8)} ${cx - mouth} ${n(y0 + 6)}Z"/>`;
    } else {                       // cylinder
      const h = 40 + r() * 6, hw = 10.5 + r() * 2; y0 = BASE - h; x0 = cx - hw; x1 = cx + hw; mouth = hw;
      body = `<path d="M${n(x0)} ${n(y0)}H${n(x1)}V${BASE - 3}Q${n(x1)} ${BASE} ${n(x1 - 3)} ${BASE}H${n(x0 + 3)}Q${n(x0)} ${BASE} ${n(x0)} ${BASE - 3}Z"/>`;
    }
    // a few dried stems
    const dried = r() < 0.5 ? '#8a6c47' : '#56613f';
    let stems = '', heads = '';
    const count = l.form === 2 ? 4 : 2 + Math.floor(r() * 2);
    for (let i = 0; i < count; i++) {
      const lean = (i - (count - 1) / 2) * (l.form === 2 ? 5.5 : 4) + (r() - 0.5) * 3, len = Math.min(15 + r() * 9, y0 - 14);
      const sx = cx + (i - (count - 1) / 2) * Math.min(1.6, mouth * 0.5), ex = sx + lean * 1.5, ey = y0 - len;
      stems += `<path d="M${n(sx)} ${n(y0 + 2)}Q${n(sx + lean * 0.2)} ${n(y0 - len * 0.5)} ${n(ex)} ${n(ey)}"/>`;
      heads += r() < 0.5 ? `<ellipse cx="${n(ex)}" cy="${n(ey - 1.6)}" rx="1.1" ry="2.6" transform="rotate(${n(lean * 2.5)} ${n(ex)} ${n(ey)})"/>` : `<circle cx="${n(ex)}" cy="${n(ey)}" r="1.5"/><circle cx="${n(ex - lean * 0.25 - 1.6)}" cy="${n(ey + 4)}" r="1.1"/><circle cx="${n(ex - lean * 0.2 + 1.7)}" cy="${n(ey + 7)}" r="1"/>`;
    }
    return { scene: 'table', body: `${clip('b', body)}${ground(cx, BASE + 0.4, (x1 - x0) * 0.56)}<g fill="none" stroke="${dried}" stroke-width=".6" stroke-linecap="round">${stems}</g><g fill="${dried}">${heads}</g><g fill="${c.main}">${body}</g>${clipped('b', marks(l, r, [x0 - 3, y0, x1 + 3, BASE], c.ink, c.ink2, { dir: 'h' }) + volume(x0 - 3, x1 + 3, y0, BASE))}<ellipse cx="${cx}" cy="${n(y0 + 0.2)}" rx="${n(mouth)}" ry="${n(Math.min(2.4, mouth * 0.34))}" fill="${c.deep}"/>` };
  },

  rug(l, r, c) {
    const turn = n((r() - 0.5) * 9);
    const fringe = mix(c.main, PAPER, 0.55);
    let shape, box, ends = '';
    if (l.form === 2) { const rad = 33 + r() * 3; shape = `<circle cx="50" cy="50" r="${n(rad)}"/>`; box = [50 - rad, 50 - rad, 50 + rad, 50 + rad]; }
    else {
      const [w, h] = l.form === 0 ? [29 + r() * 3, 74] : [70, 48 + r() * 5];
      const x0 = 50 - w / 2, y0 = 50 - h / 2; box = [x0, y0, x0 + w, y0 + h];
      shape = `<rect x="${n(x0)}" y="${n(y0)}" width="${n(w)}" height="${n(h)}" rx=".8"/>`;
      // a fringe on the two short ends
      if (l.form === 0) for (let x = x0 + 0.9; x < x0 + w; x += 1.7) ends += `<path d="M${n(x)} ${n(y0)}v-3.2M${n(x)} ${n(y0 + h)}v3.2"/>`;
      else for (let y = y0 + 0.9; y < y0 + h; y += 1.7) ends += `<path d="M${n(x0)} ${n(y)}h-3.2M${n(x0 + w)} ${n(y)}h3.2"/>`;
    }
    const [x0, y0, x1, y1] = box;
    const border = SURFACES[l.surface] === 'striped' ? '' : l.form === 2 ? `<circle cx="50" cy="50" r="${n((x1 - x0) / 2 - 3.6)}" fill="none" stroke="${c.ink}" stroke-width="1.3"/>` : `<rect x="${n(x0 + 3.4)}" y="${n(y0 + 3.4)}" width="${n(x1 - x0 - 6.8)}" height="${n(y1 - y0 - 6.8)}" fill="none" stroke="${c.ink}" stroke-width="1.3"/>`;
    return { scene: 'floor', body: `${clip('b', shape)}<g transform="rotate(${turn} 50 50)"><g transform="translate(1.3 1.8)" fill="#000" fill-opacity=".13">${shape}</g><g stroke="${fringe}" stroke-width=".7" stroke-linecap="round">${ends}</g><g fill="${c.main}">${shape}</g>${clipped('b', marks(l, r, box, c.ink, c.ink2, { dir: l.form === 0 ? 'h' : 'v', s: 1.15 }))}${border}</g>` };
  },

  print(l, r, c) {
    const [w, h] = [[36, 50], [54, 38], [44, 44]][l.form];
    const x0 = 50 - w / 2, y1 = BASE - 2, y0 = y1 - h;
    const frame = [OAK, INK, '#f3eee3'][Math.floor(r() * 3)];
    const mat = 4.2, ax0 = x0 + 1.5 + mat, ay0 = y0 + 1.5 + mat, aw = w - 3 - mat * 2, ah = h - 3 - mat * 2;
    const art = `<rect x="${n(ax0)}" y="${n(ay0)}" width="${n(aw)}" height="${n(ah)}"/>`;
    let picture = marks(l, r, [ax0, ay0, ax0 + aw, ay0 + ah], c.ink, c.ink2, { s: 1.25 });
    if (SURFACES[l.surface] === 'plain') {   // one large shape on a field
      const k = Math.floor(r() * 3), mx = ax0 + aw / 2, my = ay0 + ah / 2, rad = Math.min(aw, ah) * 0.3;
      picture = k === 0 ? `<circle cx="${n(mx)}" cy="${n(my - ah * 0.06)}" r="${n(rad)}" fill="${c.ink}"/>`
        : k === 1 ? `<path d="M${n(mx - rad)} ${n(ay0 + ah)}V${n(my)}a${n(rad)} ${n(rad)} 0 0 1 ${n(rad * 2)} 0V${n(ay0 + ah)}Z" fill="${c.ink}"/>`
          : `<path d="M${n(ax0)} ${n(my + ah * 0.12)}a${n(aw / 2)} ${n(aw / 2)} 0 0 1 ${n(aw)} 0V${n(ay0 + ah)}H${n(ax0)}Z" fill="${c.ink}"/><circle cx="${n(mx + aw * 0.18)}" cy="${n(ay0 + ah * 0.22)}" r="${n(rad * 0.42)}" fill="${c.ink2}"/>`;
    }
    return { scene: 'table', body: `${clip('b', art)}<rect x="${n(x0 + 1.6)}" y="${n(y0 + 1.2)}" width="${w}" height="${h}" fill="#000" fill-opacity=".12"/><rect x="${n(x0)}" y="${n(y0)}" width="${w}" height="${h}" fill="${frame}"/><rect x="${n(x0 + 1.5)}" y="${n(y0 + 1.5)}" width="${w - 3}" height="${h - 3}" fill="${PAPER}"/><g fill="${c.main}">${art}</g>${clipped('b', picture)}${ground(50, y1 + 0.3, w * 0.5, 1.5)}` };
  },

  candle(l, r, c) {
    const cx = 50;
    if (l.form === 1) {            // a pair of tapers in small holders
      let out = '', clips = '';
      [-9, 9].forEach((dx, k) => {
        const x = cx + dx, h = 43 - k * (4 + r() * 5), top = BASE - 6 - h;
        const taper = `<path d="M${n(x - 2.2)} ${BASE - 6}L${n(x - 1.3)} ${n(top)}H${n(x + 1.3)}L${n(x + 2.2)} ${BASE - 6}Z"/>`;
        clips += clip('t' + k, taper);
        out += `${ground(x, BASE + 0.3, 6.4, 1.8)}<path d="M${n(x - 5.6)} ${BASE}h11.2l-1.2-2.4h-2.1l-.5-4h-3.6l-.5 4h-2.1z" fill="${c.holder}"/><g fill="${c.main}">${taper}</g>${clipped('t' + k, marks(l, r, [x - 2.4, top, x + 2.4, BASE - 6], c.ink, c.ink2, { dir: 'h', s: 0.6 }) + `<rect x="${n(x + 0.6)}" y="${n(top)}" width="1.8" height="${n(h)}" fill="#000" fill-opacity=".1"/>`)}${flame(x, top)}`;
      });
      return { scene: 'table', body: clips + out };
    }
    const jar = l.form === 2;
    const w = jar ? 27 + r() * 3 : 18 + r() * 5, h = jar ? 23 + r() * 3 : 30 + r() * 12;
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = BASE - h, rr = jar ? 4 : 1.5;
    const body = `<path d="M${n(x0)} ${n(y0)}H${n(x1)}V${n(BASE - rr)}Q${n(x1)} ${BASE} ${n(x1 - rr)} ${BASE}H${n(x0 + rr)}Q${n(x0)} ${BASE} ${n(x0)} ${n(BASE - rr)}Z"/>`;
    const label = jar ? `<rect x="${n(cx - 6.5)}" y="${n(y0 + h * 0.34)}" width="13" height="${n(h * 0.4)}" rx=".8" fill="${PAPER}"/><path d="M${n(cx - 4)} ${n(y0 + h * 0.48)}h8M${n(cx - 3)} ${n(y0 + h * 0.58)}h6" stroke="${INK}" stroke-opacity=".55" stroke-width=".55" stroke-linecap="round"/>` : '';
    const top = jar ? `<ellipse cx="${cx}" cy="${n(y0)}" rx="${n(w / 2)}" ry="2.6" fill="${c.light}"/><ellipse cx="${cx}" cy="${n(y0 + 0.4)}" rx="${n(w / 2 - 1.4)}" ry="1.9" fill="#f1e6cc"/>` : `<ellipse cx="${cx}" cy="${n(y0)}" rx="${n(w / 2)}" ry="2.2" fill="${c.light}"/>`;
    return { scene: 'table', body: `${clip('b', body)}${ground(cx, BASE + 0.4, w * 0.6)}<g fill="${c.main}">${body}</g>${clipped('b', marks(l, r, [x0, y0, x1, BASE], c.ink, c.ink2, { dir: 'h' }) + volume(x0, x1, y0, BASE))}${label}${top}${flame(cx, y0 + 0.4)}` };
  },

  earrings(l, r, c) {
    const card = lum(c.main) > 0.72 ? '#c9aa7c' : PAPER;
    const x0 = 27, y0 = 15, w = 46, h = 70, holeY = 31;
    const variant = Math.floor(r() * 3);
    let shapes = '', wires = '', clips = '', box;
    [39, 61].forEach((x, k) => {
      let shape;
      if (l.form === 0) {           // hoops: a wide enamel ring
        shape = `<path fill-rule="evenodd" d="M${x - 9.5} ${holeY + 13}a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0 -19 0zM${x - 5} ${holeY + 13}a5 5 0 1 1 10 0a5 5 0 1 1 -10 0z"/>`;
        wires += `<path d="M${x} ${holeY}v3.6"/>`;
        box = [x - 10, holeY + 3, x + 10, holeY + 23];
      } else if (l.form === 1) {    // drops: a small bead and a hanging shape
        const top = holeY + 8.5;
        shape = variant === 0 ? `<path d="M${x} ${top}c7 8.5 7.4 20 0 20s-7-11.5 0-20z"/>`
          : variant === 1 ? `<path d="M${x - 6.2} ${top + 20}v-13a6.2 6.2 0 0 1 12.4 0v13z"/>`
            : `<circle cx="${x}" cy="${top + 10}" r="8"/>`;
        wires += `<path d="M${x} ${holeY}v5.4"/>`;
        shapes += `<circle cx="${x}" cy="${holeY + 5.9}" r="2" fill="${c.ink}"/>`;
        box = [x - 9, top, x + 9, top + 21];
      } else {                      // studs
        const cy = holeY + 7;
        shape = variant === 0 ? `<circle cx="${x}" cy="${cy}" r="6.6"/>` : variant === 1 ? `<path d="M${x - 7} ${cy + 3}a7 7 0 0 1 14 0z"/>` : `<rect x="${x - 5.4}" y="${cy - 5.4}" width="10.8" height="10.8" rx="1" transform="rotate(45 ${x} ${cy})"/>`;
        box = [x - 8, cy - 8, x + 8, cy + 8];
      }
      clips += clip('e' + k, shape);
      shapes += `<g transform="translate(.7 1)" fill="#000" fill-opacity=".14">${shape}</g><g fill="${c.main}">${shape}</g>${clipped('e' + k, marks(l, r, box, c.ink, c.ink2, { s: 0.62 }))}`;
    });
    return { scene: 'wall', body: `${clips}<rect x="${x0 + 1.4}" y="${y0 + 1.8}" width="${w}" height="${h}" rx="2" fill="#000" fill-opacity=".12"/><rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="2" fill="${card}"/><circle cx="50" cy="${y0 + 6}" r="1.7" fill="#000" fill-opacity=".2"/><path d="M41 ${y0 + h - 9}h18M44 ${y0 + h - 6}h12" stroke="${INK}" stroke-opacity=".4" stroke-width=".6" stroke-linecap="round"/><g transform="translate(50 ${holeY - 4}) scale(1.3) translate(-50 ${-holeY})"><g fill="none" stroke="${BRASS}" stroke-width=".7" stroke-linecap="round">${wires}</g>${shapes}</g>` };
  },

  tote(l, r, c) {
    const strap = mix(c.main, '#000000', 0.2);
    let body, box, straps;
    if (l.form === 0) {            // tote: a flat rectangle on two handles
      const w = 44 + r() * 4, h = 46 + r() * 3, x0 = 50 - w / 2, y0 = 41; box = [x0, y0, x0 + w, y0 + h];
      body = `<path d="M${n(x0)} ${y0}h${n(w)}v${n(h - 1.5)}q0 1.5 -1.5 1.5h${n(-w + 3)}q-1.5 0 -1.5 -1.5z"/>`;
      straps = `<path d="M${n(x0 + w * 0.24)} ${y0 + 2}C${n(x0 + w * 0.24)} 12 ${n(x0 + w * 0.76)} 12 ${n(x0 + w * 0.76)} ${y0 + 2}"/>`;
    } else if (l.form === 1) {     // bucket bag: narrower at the foot, one long strap
      const y0 = 47, h = 40; box = [28, y0, 72, y0 + h];
      body = `<path d="M29 ${y0}h42l-4.5 ${h - 6}q-.8 6 -7 6h-19q-6.2 0 -7 -6z"/>`;
      straps = `<path d="M33 ${y0 + 2}C36 8 64 8 67 ${y0 + 2}"/>`;
    } else {                       // market bag: wide and shallow, long handles
      const y0 = 50, h = 37; box = [20, y0, 80, y0 + h];
      body = `<path d="M21 ${y0}h58l-3 ${h - 12}q-1.4 12 -13 12h-26q-11.6 0 -13 -12z"/>`;
      straps = `<path d="M36 ${y0 + 2}C36 10 64 10 64 ${y0 + 2}"/>`;
    }
    const [x0, y0, x1] = box;
    return { scene: 'wall', body: `${clip('b', body)}<g transform="translate(1.5 2)" fill="#000" fill-opacity=".12">${body}</g><g fill="none" stroke="${strap}" stroke-width="3" stroke-linecap="round">${straps}</g><circle cx="50" cy="12.5" r="2.6" fill="${OAK}"/><circle cx="50.6" cy="13.1" r="2.6" fill="#000" fill-opacity=".12"/><g fill="${c.main}">${body}</g>${clipped('b', marks(l, r, box, c.ink, c.ink2, { s: 1.1 }) + `<rect x="${n(x0)}" y="${y0}" width="${n(x1 - x0)}" height="3.4" fill="#000" fill-opacity=".1"/>`)}` };
  },

  board(l, r, c) {
    const turn = n((r() - 0.5) * 22);
    const grainInk = mix(OAK, '#000000', 0.14);
    let body, paint, box, hole;
    if (l.form === 0) {            // round, with a short handle
      body = `<path d="M44.5 13h11q2 0 2 2v12.6a26 26 0 1 1 -15 0V15q0 -2 2 -2z"/>`;
      paint = `<rect x="0" y="0" width="100" height="47"/>`; box = [20, 10, 80, 47]; hole = [50, 18.5];
    } else if (l.form === 1) {     // paddle: long, with a long handle
      body = `<path d="M46 9h8q2 0 2 2v21q0 3 5 4.5q6 1.8 6 8V86q0 5 -5 5H38q-5 0 -5 -5V44.500q0 -6.2 6 -8q5 -1.500 5 -4.500V11q0 -2 2 -2z"/>`;
      paint = `<rect x="0" y="52" width="100" height="48"/>`; box = [30, 52, 70, 92]; hole = [50, 14.5];
    } else {                       // cutting board
      body = `<rect x="21" y="24" width="58" height="56" rx="5"/>`;
      paint = `<rect x="0" y="0" width="${n(46 + r() * 8)}" height="100"/>`; box = [20, 22, 56, 82]; hole = [72.5, 30.5];
    }
    let grain = '';
    for (let y = 16; y < 92; y += 6 + r() * 6) grain += `<path d="M10 ${n(y)}Q${n(30 + r() * 40)} ${n(y + (r() - 0.5) * 7)} 90 ${n(y + (r() - 0.5) * 3)}"/>`;
    return { scene: 'floor', body: `${clip('b', body)}${clip('p', paint)}<g transform="rotate(${turn} 50 50)"><g transform="translate(1.4 1.9)" fill="#000" fill-opacity=".14">${body}</g><g fill="${OAK}">${body}</g>${clipped('b', `<g fill="none" stroke="${grainInk}" stroke-width=".5">${grain}</g>` + clipped('p', `<rect width="100" height="100" fill="${c.main}"/>` + marks(l, r, box, c.ink, c.ink2, { s: 0.9 })))}<circle cx="${hole[0]}" cy="${hole[1]}" r="2.1" fill="${c.floor}"/></g>` };
  },
};

// ---------------------------------------------------------------- a listing's picture
export function svg(l) {
  const r = rng('listing', l.id);
  uid = `l${l.id}-`;
  const main = COLORS[l.color].hex;
  // the second color; when it is the same as the first, the marks go tone on tone
  let ink = COLORS[l.accent].hex;
  if (l.accent === l.color) ink = lum(main) > 0.45 ? mix(main, '#000000', 0.28) : mix(main, '#ffffff', 0.34);
  // a third, for the odd speck or shape: dark on light things, pale on dark ones
  const ink2 = SURFACES[l.surface] === 'speckled' ? (lum(main) > 0.3 ? '#3b2f27' : '#efe4cc') : mix(ink, lum(main) > 0.45 ? '#2b2926' : '#f6f0e3', 0.55);
  // the shop's backdrop, unless the thing would vanish against it
  const craft = CRAFTS[l.craft].id;
  const scene0 = craft === 'rug' || craft === 'board' ? 1 : 0;
  let b = (l.shop * 7 + 3) % BACKDROPS.length;
  const lost = (back) => Math.abs(lum(back) - lum(main)) < 0.13 || (craft === 'board' && Math.abs(lum(back) - lum(OAK)) < 0.1);
  for (let tries = 0; tries < BACKDROPS.length && lost(BACKDROPS[b][scene0]); tries++) b = (b + 1) % BACKDROPS.length;
  const [wall, table] = BACKDROPS[b];
  const c = { main, ink, ink2, light: mix(main, '#ffffff', 0.3), deep: mix(main, '#000000', 0.42), holder: r() < 0.5 ? BRASS : '#3a3835', floor: table };
  let { scene, body } = draw[craft](l, r, c);
  // things on the table are drawn small and brought up to fill the picture, standing where they stood
  const grow = { mug: 1.32, vase: 1.1, print: 1.3, candle: 1.3 }[craft];
  if (grow) body = `<g transform="translate(50 ${BASE}) scale(${grow}) translate(-50 ${-BASE})">${body}</g>`;
  const back = scene === 'table' ? `<rect width="100" height="100" fill="${wall}"/><rect y="${HORIZON}" width="100" height="${100 - HORIZON}" fill="${table}"/>`
    : `<rect width="100" height="100" fill="${scene === 'floor' ? table : wall}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${back}${body}</svg>`;
}

const urls = new Map();
export function url(l) {
  if (!urls.has(l.id)) urls.set(l.id, URL.createObjectURL(new Blob([svg(l)], { type: 'image/svg+xml' })));
  return urls.get(l.id);
}
