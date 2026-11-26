// No. 024: the press. A poster is a Plate: a list of marks on named layers, on a
// sheet 1600 wide and 2000 tall. Every mark has a start time and a length, and a
// way of arriving (it rises, wipes in, is drawn by a pen, is pressed in). A Press
// plays a plate onto a canvas at any time: finished marks are baked into their
// layer's own canvas once, so a frame only draws the marks still arriving.
// Nothing here touches the page.

export const W = 1600, H = 2000;

export const ease = {
  linear: (t) => t,
  out: (t) => 1 - (1 - t) ** 3,
  soft: (t) => 1 - (1 - t) ** 2,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t) => { const c = 1.4; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; },
};

export function rng(seed) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (a0, b0) => a0 + (b0 - a0) * r();
  r.int = (a0, b0) => Math.floor(a0 + (b0 - a0 + 1) * r());
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  r.gauss = () => (r() + r() + r() - 1.5) / 1.5;
  return r;
}

// the bounding box of a list of points [x, y, x, y, ...] or [[x, y], ...]
export function boxOf(pts, pad = 0) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const flat = typeof pts[0] === 'number';
  const n = flat ? pts.length / 2 : pts.length;
  for (let i = 0; i < n; i++) {
    const x = flat ? pts[2 * i] : pts[i][0], y = flat ? pts[2 * i + 1] : pts[i][1];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}

export function lengthOf(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}

export class Plate {
  constructor({ paper = '#f1e4c4', seed = 1 } = {}) {
    this.paper = paper;
    this.r = rng(seed);
    this.order = [];
    this.layers = {};
    this.end = 0;
    this.fonts = [];
  }
  layer(name, opts) {
    if (!this.layers[name]) { this.layers[name] = { name, marks: [], lives: [], clip: true }; this.order.push(name); }
    if (opts) Object.assign(this.layers[name], opts);
    return this.layers[name];
  }
  // declare the layers bottom to top, so the order does not depend on which is used first
  stack(...names) { names.forEach((n) => this.layer(n)); return this; }

  // m: { t, d, draw(ctx, q), reveal, box, ease }
  mark(layer, m) {
    m.d ??= 0.8; m.reveal ??= 'fade'; m.ease ??= 'out';
    this.layer(layer).marks.push(m);
    this.end = Math.max(this.end, m.t + m.d);
    return m;
  }
  // a mark that is drawn every frame, after it has arrived: draw(ctx, time, q)
  live(layer, m) {
    m.d ??= 1; m.reveal ??= 'fade'; m.ease ??= 'out';
    this.layer(layer).lives.push(m);
    this.end = Math.max(this.end, m.t + m.d);
    return m;
  }

  // shapes ----------------------------------------------------------------
  fill(layer, pts, color, o = {}) {
    return this.mark(layer, {
      ...o, box: o.box || boxOf(pts, 2),
      draw: (c) => { c.fillStyle = color; poly(c, pts); c.fill(); if (o.line) { c.strokeStyle = o.line; c.lineWidth = o.lw || 2; c.lineJoin = 'round'; c.stroke(); } },
    });
  }
  // a pen stroke along a polyline; with reveal 'draw' it is drawn from its start
  pen(layer, pts, color, width, o = {}) {
    const len = lengthOf(pts);
    return this.mark(layer, {
      reveal: 'draw', ease: 'inOut', ...o, box: boxOf(pts, width + 2),
      draw: (c, q) => {
        c.strokeStyle = color; c.lineWidth = width; c.lineCap = o.cap || 'round'; c.lineJoin = 'round';
        if (q < 1) { c.setLineDash([len, len + 1]); c.lineDashOffset = len * (1 - q); }
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
        if (o.closed) c.closePath();
        c.stroke();
      },
    });
  }
  // many short strokes drawn as one mark (hatching, waves, rain)
  strokes(layer, lines, color, width, o = {}) {
    const all = lines.flat();
    return this.mark(layer, {
      ...o, box: o.box || boxOf(all, width + 2),
      draw: (c) => {
        c.strokeStyle = color; c.lineWidth = width; c.lineCap = o.cap || 'round'; c.lineJoin = 'round';
        c.beginPath();
        for (const l of lines) { c.moveTo(l[0][0], l[0][1]); for (let i = 1; i < l.length; i++) c.lineTo(l[i][0], l[i][1]); }
        c.stroke();
      },
    });
  }
  group(layer, box, draw, o = {}) { return this.mark(layer, { ...o, box, draw }); }

  // type: one mark per letter, set from left to right. Each letter sits where the
  // text through it ends, less its own width, so the font's kerning is kept.
  // o: { size, family, weight, style, color, track, align, t, d, gap, reveal, stroke, lw, fit }
  type(layer, str, x, y, o) {
    const ctx = measurer();
    let size = o.size;
    const font = (s) => `${o.style || 'normal'} ${o.weight || 400} ${s}px ${o.family}`;
    ctx.font = font(size);
    const track = (o.track || 0) * size;
    const widthAt = (k) => ctx.measureText(str.slice(0, k)).width + track * k;
    let total = widthAt(str.length) - track;
    if (o.fit && total > o.fit) { size *= o.fit / total; ctx.font = font(size); total = o.fit; }
    const tr = (o.track || 0) * size;
    const wAt = (k) => ctx.measureText(str.slice(0, k)).width + tr * k;
    total = wAt(str.length) - tr;
    const x0 = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    const glyphs = [];
    let k = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      // where the letter ends, less its own width: keeps the kerning with the one before
      const gw = ctx.measureText(ch).width, gx = x0 + wAt(i + 1) - tr - gw;
      if (ch === ' ') continue;
      const t = (o.t || 0) + k * (o.gap ?? 0.09);
      k++;
      const f = font(size);
      glyphs.push(this.mark(layer, {
        t, d: o.d ?? 0.7, reveal: o.reveal || 'press', ease: o.ease || 'out',
        box: { x: gx - size * 0.15, y: y - size * 1.05, w: gw + size * 0.3, h: size * 1.4 },
        draw: (c) => {
          c.font = f; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
          if (o.shadow) { c.fillStyle = o.shadow; c.fillText(ch, gx + (o.sx ?? size * 0.03), y + (o.sy ?? size * 0.03)); }
          if (o.color) { c.fillStyle = o.color; c.fillText(ch, gx, y); }
          if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.lw || 2; c.lineJoin = 'round'; c.strokeText(ch, gx, y); }
        },
      }));
    }
    return { size, width: total, x0, glyphs };
  }
}

let mctx = null;
function measurer() {
  if (!mctx) mctx = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')).getContext('2d');
  return mctx;
}

export function poly(c, pts) {
  c.beginPath();
  if (typeof pts[0] === 'number') {
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  } else {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  }
  c.closePath();
}

// how a mark arrives. q runs 0 to 1 (eased); the context is already in sheet units.
function reveal(c, m, q) {
  const b = m.box;
  switch (m.reveal) {
    case 'none': return q > 0;
    case 'fade': c.globalAlpha *= q; return true;
    case 'rise': { // grows up from its foot
      c.beginPath(); c.rect(b.x - 4, b.y + b.h * (1 - q) - 1, b.w + 8, b.h * q + 6); c.clip();
      c.globalAlpha *= Math.min(1, q * 4); return true;
    }
    case 'fall': {
      c.beginPath(); c.rect(b.x - 4, b.y - 4, b.w + 8, b.h * q + 5); c.clip(); return true;
    }
    case 'wipe': case 'wipeR': { // left to right
      c.beginPath(); c.rect(b.x - 4, b.y - 4, b.w * q + 5, b.h + 8); c.clip(); return true;
    }
    case 'wipeL': {
      c.beginPath(); c.rect(b.x + b.w * (1 - q) - 1, b.y - 4, b.w * q + 5, b.h + 8); c.clip(); return true;
    }
    case 'iris': {
      const r = Math.hypot(b.w, b.h) * 0.55 * q;
      c.beginPath(); c.arc(b.x + b.w / 2, b.y + b.h / 2, r + 1, 0, Math.PI * 2); c.clip(); return true;
    }
    case 'pop': {
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2, s = 0.7 + 0.3 * q;
      c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy);
      c.globalAlpha *= Math.min(1, q * 2); return true;
    }
    case 'press': { // a letter set into the sheet: a little large and faint, then home
      const cx = b.x + b.w / 2, cy = b.y + b.h * 0.6, s = 1 + 0.08 * (1 - q);
      c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy);
      c.globalAlpha *= Math.min(1, q * 1.6); return true;
    }
    case 'slide': {
      c.translate((m.dx || 0) * (1 - q), (m.dy || 0) * (1 - q));
      c.globalAlpha *= Math.min(1, q * 3); return true;
    }
    case 'drop': { // falls a little into place
      c.translate(0, -(m.dy ?? 24) * (1 - q));
      c.globalAlpha *= Math.min(1, q * 2.5); return true;
    }
    default: return true; // 'draw': the mark draws its own part
  }
}

// the reveals that only clip a mark, which can be laid down from a picture while it arrives
const SPRITE = new Set(['rise', 'fall', 'wipe', 'wipeR', 'wipeL', 'iris']);

// every mark baked and nothing live: the layer will not change again
const closed = (ly) => ly.done === ly.L.marks.length && ly.L.lives.length === 0;

export class Press {
  constructor(plate, canvas) {
    this.plate = plate;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size();
  }
  size() {
    const { canvas } = this;
    this.k = canvas.width / W;
    this.layers = this.plate.order.map((name) => {
      const L = this.plate.layers[name];
      L.marks.forEach((m, i) => { m.i = i; });
      const cv = document.createElement('canvas');
      cv.width = canvas.width; cv.height = canvas.height;
      return { L, cv, cx: cv.getContext('2d'), done: 0 };
    });
    this.grain = grainFor(canvas.width, canvas.height);
    if (this.sprites) this.dropSprites(); else this.sprites = new Map();
    this.at = -1;
    if (this.runs) this.dropRuns(); else this.runs = new Map();
  }
  paint(c, m, time, live, L) {
    const raw = (time - m.t) / m.d;
    if (raw <= 0) return;
    const q = ease[m.ease](Math.min(1, raw));
    c.save();
    c.setTransform(this.k, 0, 0, this.k, 0, 0);
    const cl = this.plate.clip;
    if (cl && L.clip) { c.beginPath(); c.rect(cl.x, cl.y, cl.w, cl.h); c.clip(); }
    if (reveal(c, m, q)) {
      if (live) m.draw(c, time, q);
      else if (q < 1 && SPRITE.has(m.reveal) && m.draw.length < 2 && !m.direct) this.sprite(c, m);
      else m.draw(c, q);
    }
    c.restore();
  }
  // A mark that arrives by a clip (rise, fall, wipe, iris) does not change while it
  // arrives, only how much of it shows. It is drawn once into a picture of its box at the sheet's scale and that is laid down instead; when it
  // is baked it is drawn as itself, so the finished poster is made by the same strokes.
  sprite(c, m) {
    const cw = this.canvas.width, ch = this.canvas.height;
    let sp = this.sprites.get(m);
    if (!sp) {
      const b = m.box, k = this.k;
      // as far as the reveal's clip reaches (an iris opens past the box's corners)
      const pad = m.reveal === 'iris' ? Math.hypot(b.w, b.h) * 0.55 + 2 - Math.min(b.w, b.h) / 2 : 8;
      const x0 = Math.max(0, Math.floor((b.x - pad) * k)), y0 = Math.max(0, Math.floor((b.y - pad) * k));
      const x1 = Math.min(cw, Math.ceil((b.x + b.w + pad) * k)), y1 = Math.min(ch, Math.ceil((b.y + b.h + pad) * k));
      // off the sheet, or a box without a size: drawn as itself
      if (!(x1 > x0 && y1 > y0)) { m.direct = true; c.setTransform(k, 0, 0, k, 0, 0); m.draw(c, 1); return; }
      const cv = document.createElement('canvas');
      cv.width = x1 - x0; cv.height = y1 - y0;
      const s = cv.getContext('2d');
      s.setTransform(k, 0, 0, k, -x0, -y0);
      // a mark that blends with what lies under it (multiply, screen) cannot be a picture
      let blends = false;
      const proto = Object.getPrototypeOf(s), gco = Object.getOwnPropertyDescriptor(proto, 'globalCompositeOperation');
      Object.defineProperty(s, 'globalCompositeOperation', { get() { return gco.get.call(this); }, set(v) { if (v !== 'source-over') blends = true; gco.set.call(this, v); } });
      m.draw(s, 1);
      if (blends) { cv.width = cv.height = 0; m.direct = true; c.setTransform(k, 0, 0, k, 0, 0); m.draw(c, 1); return; }
      sp = { cv, x0, y0 };
      this.sprites.set(m, sp);
    }
    // the clip is already set; the picture goes down pixel for pixel
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(sp.cv, sp.x0, sp.y0);
  }
  dropSprite(m) { const sp = this.sprites.get(m); if (sp) { sp.cv.width = sp.cv.height = 0; this.sprites.delete(m); } }
  dropSprites() { for (const sp of this.sprites.values()) sp.cv.width = sp.cv.height = 0; this.sprites.clear(); }
  // draw the plate as it is at this time (seconds since it began)
  frame(time) {
    const { ctx, canvas } = this;
    if (time < this.at) this.reset();
    this.at = time;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.plate.paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // bake every mark that has finished, in each layer's order
    for (const ly of this.layers) {
      const { marks } = ly.L;
      while (ly.done < marks.length && time >= marks[ly.done].t + marks[ly.done].d) {
        this.paint(ly.cx, marks[ly.done], Infinity, false, ly.L);
        this.dropSprite(marks[ly.done]);
        ly.done++;
      }
    }
    // a layer is closed once all its marks are baked and nothing on it moves; a run of
    // closed layers is laid down as one canvas, made once, rather than layer by layer
    const L = this.layers, used = new Set();
    for (let i = 0; i < L.length;) {
      if (closed(L[i])) {
        let j = i + 1; while (j < L.length && closed(L[j])) j++;
        if (j - i > 1) { const key = `${i}-${j}`; used.add(key); ctx.drawImage(this.run(i, j, key), 0, 0); }
        else if (L[i].done) ctx.drawImage(L[i].cv, 0, 0);
        i = j; continue;
      }
      const ly = L[i], { marks, lives } = ly.L;
      if (ly.done) ctx.drawImage(ly.cv, 0, 0);
      for (let k = ly.done; k < marks.length; k++) {
        const m = marks[k];
        if (time > m.t) this.paint(ctx, m, time, false, ly.L);
      }
      for (const m of lives) if (time > m.t) this.paint(ctx, m, time, true, ly.L);
      i++;
    }
    // runs no longer in use are let go
    for (const [key, cv] of this.runs) if (!used.has(key)) { cv.width = cv.height = 0; this.runs.delete(key); }
    // the paper's grain over everything, so the inks sit in it
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(this.grain.dark, 0, 0);
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(this.grain.light, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }
  run(i, j, key) {
    if (!this.runs.has(key)) {
      const cv = document.createElement('canvas');
      cv.width = this.canvas.width; cv.height = this.canvas.height;
      const c = cv.getContext('2d');
      for (let k = i; k < j; k++) if (this.layers[k].done) c.drawImage(this.layers[k].cv, 0, 0);
      this.runs.set(key, cv);
    }
    return this.runs.get(key);
  }
  dropRuns() {
    for (const cv of this.runs.values()) cv.width = cv.height = 0;
    this.runs.clear();
  }
  reset() {
    for (const ly of this.layers) { ly.cx.clearRect(0, 0, ly.cv.width, ly.cv.height); ly.done = 0; }
    this.dropRuns();
    this.dropSprites();
  }
  // let go of the layer canvases once the sheet is off the wall: a loop of a hundred posters is long
  dispose() {
    for (const ly of this.layers) { ly.cv.width = ly.cv.height = 0; }
    this.layers = [];
    this.dropRuns();
    this.dropSprites();
  }
}

// paper: fibers and a fine tooth that darken a little (multiply), and specks
// where the ink did not take (screen). Made once per size.
const grains = new Map();
function grainFor(w, h) {
  const key = `${w}x${h}`;
  if (grains.has(key)) return grains.get(key);
  const r = rng(77);
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const dark = mk(), light = mk();
  const dc = dark.getContext('2d'), lc = light.getContext('2d');
  const img = dc.createImageData(w, h), d = img.data;
  for (let i = 0; i < w * h; i++) {
    const n = 255 - Math.floor(r() * r() * 26);
    d[4 * i] = n; d[4 * i + 1] = n; d[4 * i + 2] = Math.min(255, n + 2); d[4 * i + 3] = 255;
  }
  dc.putImageData(img, 0, 0);
  // fibers
  const s = w / W;
  dc.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
    const x = r() * w, y = r() * h, a = r() * Math.PI, l = (8 + r() * 30) * s;
    dc.strokeStyle = `rgba(120,100,70,${0.03 + r() * 0.05})`;
    dc.lineWidth = (0.6 + r()) * s;
    dc.beginPath(); dc.moveTo(x, y);
    dc.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 6 * s, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    dc.stroke();
  }
  // a soft darkening toward the edges, like an old sheet
  const g = dc.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(190,170,140,0.35)');
  dc.fillStyle = g; dc.fillRect(0, 0, w, h);
  lc.fillStyle = '#000'; lc.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h * 0.0016; i++) {
    const a = 0.05 + r() * 0.14;
    lc.fillStyle = `rgba(255,248,235,${a})`;
    const rr = (0.4 + r() * 1.3) * s;
    lc.beginPath(); lc.arc(r() * w, r() * h, rr, 0, Math.PI * 2); lc.fill();
  }
  const out = { dark, light };
  grains.set(key, out);
  return out;
}
