// A coffee, ordered by color. A mokka on a marble table in a Viennese café, seen from the guest's chair.
// The visitor pours milk (and more mokka) until it is the coffee they drink every day; a card of colors then
// comes to the table and shows which one it is, and its name.
// Drawn with three.js. Units are centimeters; y is up, the table top is y = 0, the guest sits toward +z.
// The milk on the surface is a 2D fluid (stable fluids) run on the GPU. Its color, and the card's, come from
// one Kubelka–Munk function, below.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const bare = q.has('bare');
const debug = q.has('debug');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;

if (bare) document.body.classList.add('bare');
if (debug) {
  const err = $('err');
  const show = (m) => { err.textContent += m + '\n'; };
  addEventListener('error', (e) => show(String(e.message || e)));
  addEventListener('unhandledrejection', (e) => show('promise: ' + String(e.reason && e.reason.message || e.reason)));
  const ce = console.error.bind(console);
  console.error = (...a) => { show(a.map(String).join(' ').slice(0, 400)); ce(...a); };
}

// a seeded random, so a ?seed gives the same clouds twice
let seed = (parseInt(q.get('seed') || '', 10) >>> 0) || ((Math.random() * 2 ** 31) >>> 0) || 7;
const SEED = seed;
function rand() { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const rr = (a, b) => a + (b - a) * rand();

/* ---------- Color: Kubelka–Munk, the one place it is defined ---------- */

// A thick turbid layer, per linear-RGB channel, with milk fraction c. Coffee absorbs, milk scatters.
const KM = { Kc: [0.34, 0.93, 2.40], Sc: [0.010, 0.010, 0.010], Km: [0.002, 0.004, 0.012], Sm: [1.0, 1.0, 1.0] };
// R = 1 + x − sqrt(x² + 2x), written as 1 / (1 + x + sqrt(x² + 2x)) so black coffee keeps its precision in float32
function km(c) {
  return [0, 1, 2].map((i) => {
    const K = (1 - c) * KM.Kc[i] + c * KM.Km[i], S = (1 - c) * KM.Sc[i] + c * KM.Sm[i], x = K / S;
    return 1 / (1 + x + Math.sqrt(x * x + 2 * x));
  });
}
const v3 = (a) => `vec3(${a.map((n) => n.toFixed(4)).join(', ')})`;
const KM_GLSL = `
vec3 km(float c) {
  vec3 K = mix(${v3(KM.Kc)}, ${v3(KM.Km)}, c);
  vec3 S = mix(${v3(KM.Sc)}, ${v3(KM.Sm)}, c);
  vec3 x = K / S;
  return 1.0 / (1.0 + x + sqrt(x * x + 2.0 * x));
}`;
const toSRGB = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
const hex = (lin) => '#' + lin.map((v) => Math.round(clamp(toSRGB(v), 0, 1) * 255).toString(16).padStart(2, '0')).join('');

// The card: nine swatches, and the five names, by milk fraction of the whole cup
const SWATCH = [0, 0.04, 0.09, 0.16, 0.25, 0.36, 0.48, 0.62, 0.76];
const GROUPS = [
  { key: 'schwarzer', word: 'Schwarzer', from: 0, to: 0 },
  { key: 'kapuziner', word: 'Kapuziner', from: 1, to: 1 },
  { key: 'brauner', word: 'Brauner', from: 2, to: 4 },
  { key: 'melange', word: 'Melange', from: 5, to: 6 },
  { key: 'verkehrt', word: 'Kaffee verkehrt', from: 7, to: 8 },
];
function nameFor(c, coffeeMl) {
  const size = coffeeMl < 60 ? 'Kleiner' : 'Großer';
  if (c < 0.02) return { g: 0, name: `${size} Schwarzer`, says: 'Mokka with no milk. A Kleiner is a single, a Großer a double.' };
  if (c < 0.065) return { g: 1, name: 'Kapuziner', says: 'A small mokka with a few drops of cream, enough to turn it the brown of a Capuchin friar’s habit.' };
  if (c < 0.30) return { g: 2, name: `${size} Brauner`, says: 'A mokka with a dash of milk or cream. A Kleiner is a single, a Großer a double.' };
  if (c < 0.55) return { g: 3, name: 'Melange', says: 'Half coffee, half milk. In the coffee house it comes with milk foam on top.' };
  return { g: 4, name: 'Kaffee verkehrt', says: 'Coffee the wrong way round: about two thirds milk to one third coffee.' };
}
// the swatch the marker settles on: the nearest one within the name's own group, so card and name agree
function swatchFor(c, g) {
  let best = GROUPS[g].from;
  for (let i = GROUPS[g].from; i <= GROUPS[g].to; i++) if (Math.abs(SWATCH[i] - c) < Math.abs(SWATCH[best] - c)) best = i;
  return best;
}

const STORE = 'mahiryavuz.016.named';
let named = new Set();
try { const s = JSON.parse(localStorage.getItem(STORE) || '[]'); if (Array.isArray(s)) s.forEach((k) => GROUPS.some((g) => g.key === k) && named.add(k)); } catch (e) { /* no storage */ }
const saveNamed = () => { try { localStorage.setItem(STORE, JSON.stringify([...named])); } catch (e) { /* no storage */ } };

/* ---------- The renderer ---------- */

const stage = $('stage');
const canvas = $('gl');
const hooks = ['mokka', 'milk', 'mixed', 't', 'pour', 'reveal', 'pick'].some((k) => q.has(k)) || bare;
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: hooks });
  if (!renderer.capabilities.isWebGL2) renderer = null;
} catch (e) { renderer = null; }
if (!renderer) {
  // No WebGL: the photograph, and the words.
  document.body.classList.add('nogl');
  document.body.classList.remove('waiting');
  canvas.remove();
  const img = new Image(); img.className = 'still'; img.src = 'og.jpg'; img.alt = 'A small white cup of black coffee on a silver tray, with milk pouring in from a porcelain jug';
  stage.appendChild(img);
  const t = $('aboutText'); t.classList.remove('sr-only');
  const p = document.createElement('p'); p.textContent = 'This browser cannot draw the table, so this is a picture of it.'; t.insertBefore(p, t.children[1]);
  throw new Error('No WebGL');
}

const coarse = matchMedia('(pointer: coarse)').matches;
const small = Math.min(innerWidth, innerHeight) < 700 || coarse;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = +(q.get('exp') || 1.05);
renderer.shadowMap.enabled = !q.has('noshadow');
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
const ANISO = renderer.capabilities.getMaxAnisotropy();

// Window light is soft: a shadow is sharp where an object meets the table and opens out with distance.
// The shadow lookup is replaced by a percentage-closer soft shadow (blocker search, then a filter sized by it).
const SH = { size: 90, near: 1, far: 900, light: +(q.get('pl') || 0.05) };
if (q.get('shadow') !== 'basic') {
  const n = small ? 28 : 64;
  const K = ((SH.far - SH.near) * SH.light) / SH.size;
  const pcss = `
  float ignoise(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
  vec2 vogel(int i, int n, float rot) { float r = sqrt((float(i) + 0.5) / float(n)); float a = float(i) * 2.39996323 + rot; return r * vec2(cos(a), sin(a)); }
  float pcssShadow(sampler2D map, vec4 sc, vec2 size) {
    float rot = 0.7 + 0.6 * ignoise(gl_FragCoord.xy);
    float search = 0.022, sum = 0.0, cnt = 0.0;
    for (int i = 0; i < 32; i++) {
      float d = unpackRGBAToDepth(texture2D(map, sc.xy + vogel(i, 32, rot) * search));
      if (d < sc.z) { sum += d; cnt += 1.0; }
    }
    if (cnt < 0.5) return 1.0;
    float pen = clamp((sc.z - sum / cnt) * ${K.toFixed(3)}, 1.6 / size.x, search);
    float lit = 0.0;
    for (int i = 0; i < ${n}; i++) lit += step(sc.z, unpackRGBAToDepth(texture2D(map, sc.xy + vogel(i, ${n}, rot + 1.7) * pen)));
    return lit / float(${n});
  }
  vec2 texture2DDistribution(`;
  let ch = THREE.ShaderChunk.shadowmap_pars_fragment;
  ch = ch.replace('vec2 texture2DDistribution(', pcss);
  ch = ch.replace('#if defined( SHADOWMAP_TYPE_PCF )', '#if defined( SHADOWMAP_TYPE_PCF )\n\t\t\tshadow = pcssShadow( shadowMap, shadowCoord, shadowMapSize );\n\t\t#elif defined( SHADOWMAP_TYPE_NEVER_016 )');
  THREE.ShaderChunk.shadowmap_pars_fragment = ch;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0907);
const camera = new THREE.PerspectiveCamera(24, 1, 2, 1400);

/* ---------- Where things are ---------- */

const TRAY_Y = 0.32;                         // the tray's floor
const TRAY = { a: 17.0, b: 12.2, x: 0.6, z: 0 };
const SAUCER = V3(2.4, TRAY_Y, 3.4);
const SAUCER_WELL = 0.42;
const CUP = V3(SAUCER.x, TRAY_Y + SAUCER_WELL, SAUCER.z);  // the cup's foot
const JUG_AT = V3(11.4, TRAY_Y, -4.6);                     // behind, to the right
const GLASS_AT = V3(-6.6, TRAY_Y, -3.9);                   // behind, to the left
const RIM_W = 8.5;                                         // the cup's rim, across

// The camera: someone at the table, about 36° above it, a longer lens, close. A framing says how wide the cup's rim
// is in the picture, where the cup sits in it (sx, sy, from the center, in fractions of the picture) and from where.
const FRAMES = {
  land: {
    play: { c: V3(1.3, 4.9, -2.2), frac: 0.24, el: 43, az: 10, fov: 24, sx: 0.0, sy: 0.14 },
    reveal: { c: V3(-5.5, 2.5, 6.5), frac: 0.21, el: 40, az: 6, fov: 24, sx: -0.12, sy: 0.04 },
  },
  port: {
    play: { c: V3(0.0, 4.6, -1.2), frac: 0.55, el: 44, az: -46, fov: 30, sx: 0.0, sy: 0.13 },
    reveal: { c: V3(-1.0, 2.5, 9.5), frac: 0.3, el: 50, az: 4, fov: 30, sx: 0.0, sy: -0.21 },
  },
};
const CARD_POSE = {
  land: { p: V3(-17.2, 0, 11.6), ry: 0.42, from: V3(-75, 0, 16) },
  port: { p: V3(-1.5, 0, 18.0), ry: 0.08, from: V3(-50, 0, 24) },
};

function camFrom(f, aspect) {
  const vf = THREE.MathUtils.degToRad(f.fov);
  const hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
  const d = RIM_W / (f.frac * 2 * Math.tan(hf / 2));
  const t = f.c.clone().add(V3(CUP.x, 0, CUP.z).multiply(V3(1, 0, 1)));
  const el = THREE.MathUtils.degToRad(f.el), az = THREE.MathUtils.degToRad(f.az);
  return { pos: t.clone().add(V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d)), t, fov: f.fov, ox: -f.sx, oy: -f.sy, d };
}

// The window behind the table, to the left. It is placed so that, from the guest's chair, the coffee mirrors
// part of it: a pane, the mullion beside it, a glazing bar across, and the dark frame.
const WIN = (() => {
  const c = camFrom(FRAMES.land.play, 16 / 9);
  const P = V3(CUP.x, CUP.y + 1.9, CUP.z);
  const v = P.clone().sub(c.pos).normalize();
  const r = V3(v.x, -v.y, v.z);
  const z = -250, t = (z - P.z) / r.z, H = P.clone().addScaledVector(r, t);
  const x1 = H.x + 16, x0 = x1 - 120;
  return { z, x0, x1, y0: 30, y1: H.y + 110, mx: H.x - 4, by: H.y + 18, by2: H.y - 80, hw: 3.6, fr: 8, facade: 105, H };
})();
// the light that comes through it, low and from behind on the left, so shadows run long toward the guest's right
const SUN = V3(-0.5, 0.43, -0.75).normalize();

/* ---------- The room, for reflections and the light it gives ---------- */

function room(withWindow) {
  const s = new THREE.Scene();
  const basic = (c, i = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(...c).multiplyScalar(i), side: THREE.BackSide });
  const box = new THREE.Mesh(new THREE.BoxGeometry(720, 500, 640), basic([0.085, 0.064, 0.048]));
  box.position.set(0, 175, 70); s.add(box);
  const plane = (w, h, c, i, pos, rot, side = THREE.DoubleSide) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...c).multiplyScalar(i), side }));
    m.position.set(...pos); if (rot) m.rotation.set(...rot); s.add(m); return m;
  };
  // the table: white marble, lit by the window, all round the cup
  const tableTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.7, '#d8d4cc'); gr.addColorStop(1, '#1a130e');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const tm = new THREE.Mesh(new THREE.PlaneGeometry(260, 220), new THREE.MeshBasicMaterial({ map: tableTex, color: new THREE.Color(1.5, 1.45, 1.38), side: THREE.DoubleSide }));
  tm.rotation.x = -Math.PI / 2; tm.position.set(-20, -1.5, -20); s.add(tm);
  // the floor, dark wood
  plane(720, 640, [0.03, 0.02, 0.014], 1, [0, -75, 70], [-Math.PI / 2, 0, 0]);
  // the left wall, lit near the window
  plane(640, 500, [0.11, 0.09, 0.075], 1, [-358, 175, 70], [0, Math.PI / 2, 0]);
  // lamps: two sconces on the right wall, a pendant over the next table
  plane(26, 40, [1.0, 0.7, 0.42], 7, [358, 150, -70], [0, -Math.PI / 2, 0]);
  plane(26, 40, [1.0, 0.7, 0.42], 7, [358, 150, 120], [0, -Math.PI / 2, 0]);
  const pend = new THREE.Mesh(new THREE.SphereGeometry(14, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.72, 0.45).multiplyScalar(9) }));
  pend.position.set(150, 230, 40); s.add(pend);
  // the bench and the guest, dark, toward the camera
  plane(400, 140, [0.06, 0.042, 0.03], 1, [0, 40, 300], [0, Math.PI, 0]);
  if (withWindow) {
    const W = WIN;
    const fw = W.x1 - W.x0 + 2 * W.fr, fh = W.y1 - W.y0 + 2 * W.fr;
    plane(fw + 30, fh + 30, [0.07, 0.05, 0.035], 1, [(W.x0 + W.x1) / 2, (W.y0 + W.y1) / 2, W.z + 0.5]);  // the reveal, plaster
    // panes: sky above, the house across the street below
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; const g = cv.getContext('2d');
    const yToPx = (y) => (1 - (y - W.y0) / (W.y1 - W.y0)) * 512;
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(clamp(yToPx(W.facade + 30) / 512, 0, 1), '#eef2f5');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
    g.fillStyle = '#7d7871'; g.fillRect(0, yToPx(W.facade), 256, 512);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(W.x1 - W.x0, W.y1 - W.y0), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1, 1, 1).multiplyScalar(7) }));
    pane.position.set((W.x0 + W.x1) / 2, (W.y0 + W.y1) / 2, W.z + 1); s.add(pane);
    const wood = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.06, 0.045, 0.032) });
    const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wood); m.position.set(x, y, W.z + 2); s.add(m); };
    bar(W.hw * 2, W.y1 - W.y0, W.mx, (W.y0 + W.y1) / 2);
    bar(W.x1 - W.x0, W.hw * 2, (W.x0 + W.x1) / 2, W.by);
    bar(W.x1 - W.x0, W.hw * 2, (W.x0 + W.x1) / 2, W.by2);
    bar(W.fr, fh, W.x0 - W.fr / 2, (W.y0 + W.y1) / 2); bar(W.fr, fh, W.x1 + W.fr / 2, (W.y0 + W.y1) / 2);
    bar(fw, W.fr, (W.x0 + W.x1) / 2, W.y1 + W.fr / 2); bar(fw, W.fr, (W.x0 + W.x1) / 2, W.y0 - W.fr / 2);
  }
  return s;
}
const pmrem = new THREE.PMREMGenerator(renderer);
const envFull = pmrem.fromScene(room(true), 0.0, 1, 1200).texture;
const envDark = pmrem.fromScene(room(false), 0.0, 1, 1200).texture;
scene.environment = envFull;
scene.environmentIntensity = 0.22;

/* ---------- Light ---------- */

const sun = new THREE.DirectionalLight(new THREE.Color(1.0, 0.965, 0.93), 5.6);
sun.position.copy(SUN).multiplyScalar(420);
sun.target.position.set(0, 0, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(small ? 1536 : 2048, small ? 1536 : 2048);
Object.assign(sun.shadow.camera, { left: -SH.size / 2, right: SH.size / 2, top: SH.size / 2, bottom: -SH.size / 2, near: SH.near, far: SH.far });
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias = -0.00025;
sun.shadow.normalBias = 0.07;
scene.add(sun, sun.target);
// the room's warm lamps, from the right
const fill = new THREE.DirectionalLight(new THREE.Color(1.0, 0.72, 0.48), 0.22);
fill.position.set(300, 160, 120);
scene.add(fill);

/* ---------- Textures, drawn here ---------- */

function canvasTex(w, h, draw, srgb = false, repeat = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANISO; t.repeat.set(repeat, repeat);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// fine scratches in polished silver, as roughness
const scratches = (g, w, h) => {
  g.fillStyle = 'rgb(150,150,150)'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const x = rr(0, w), y = rr(0, h), a = rr(0, TAU), l = rr(6, 90);
    g.strokeStyle = `rgba(${rand() < 0.5 ? 255 : 90},${rand() < 0.5 ? 255 : 90},${rand() < 0.5 ? 255 : 90},${rr(0.05, 0.25)})`;
    g.strokeStyle = `rgba(255,255,255,${rr(0.03, 0.12)})`;
    g.lineWidth = rr(0.3, 0.7);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + rr(-4, 4), y + Math.sin(a) * l * 0.5 + rr(-4, 4), x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // polishing swirls
  for (let i = 0; i < 160; i++) {
    const cx = rr(0, w), cy = rr(0, h), r = rr(10, 60);
    g.strokeStyle = `rgba(255,255,255,${rr(0.03, 0.08)})`; g.lineWidth = 0.6;
    g.beginPath(); g.arc(cx, cy, r, rr(0, TAU), rr(0, TAU)); g.stroke();
  }
};
const scratchTray = canvasTex(1024, 1024, (g, w, h) => { scratches(g, w, h); for (let i = 0; i < 1400; i++) { const x = rr(0, w), y = rr(0, h), a = rr(0, TAU), l = rr(20, 160); g.strokeStyle = `rgba(255,255,255,${rr(0.15, 0.4)})`; g.lineWidth = rr(0.5, 1.1); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } }, false, 1 / 7);
const scratchSmall = canvasTex(1024, 1024, scratches, false, 2);
// old silver: soft smudges and a little warm tarnish, in color
const patina = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const x = rr(0, w), y = rr(0, h), r = rr(20, 110), gr = g.createRadialGradient(x, y, 0, x, y, r);
    const warm = rand() < 0.4;
    gr.addColorStop(0, warm ? `rgba(190,160,120,${rr(0.12, 0.3)})` : `rgba(130,130,130,${rr(0.1, 0.25)})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
}, true, 1 / 30);

// an old tray is not quite flat: slow, wide undulations break its sheen into gradients
const warp = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  g.filter = 'blur(14px)';
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${rand() < 0.5 ? '255,255,255' : '0,0,0'},${rr(0.08, 0.25)})`; g.beginPath(); g.arc(rr(0, w), rr(0, h), rr(15, 60), 0, TAU); g.fill(); }
}, false, 1 / 34);

/* ---------- Materials ---------- */

const P = THREE.MeshPhysicalMaterial;
const porcelain = new P({ color: new THREE.Color(0xfbf8f2), roughness: 0.36, clearcoat: 1.0, clearcoatRoughness: 0.035, ior: 1.5, specularIntensity: 0.6 });
// a glaze lets a little light into the body: warmer and lighter in shadow than plain white paint
porcelain.onBeforeCompile = (sh) => {
  sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `
    outgoingLight += diffuseColor.rgb * vec3(0.060, 0.044, 0.030) * (1.0 - saturate(dot(totalDiffuse, vec3(0.3333))));
    #include <opaque_fragment>`);
};
const porcelainSaucer = porcelain.clone();
porcelainSaucer.clearcoat = 0.55; porcelainSaucer.clearcoatRoughness = 0.09; porcelainSaucer.specularIntensity = 0.35; porcelainSaucer.roughness = 0.45;
porcelainSaucer.onBeforeCompile = porcelain.onBeforeCompile;
const silver = new P({ color: new THREE.Color(0.92, 0.905, 0.88), metalness: 1.0, roughness: 0.3, roughnessMap: scratchSmall, envMapIntensity: 1.0 });
const silverTray = new P({ color: new THREE.Color(0.55, 0.54, 0.52), metalness: 1.0, roughness: 0.34, roughnessMap: scratchTray, map: patina, envMapIntensity: +(q.get('trayenv') || 0.42) });
const ebony = new P({ color: new THREE.Color(0x120a06), roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.15 });
const brass = new P({ color: new THREE.Color(0.86, 0.64, 0.33), metalness: 1.0, roughness: 0.28, roughnessMap: scratchSmall });

/* the planar mirror: the tray's floor, and faintly the marble, see the things standing on them */
const mirror = {
  rt: new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: true }),
  cam: new THREE.PerspectiveCamera(),
  mat: { value: new THREE.Matrix4() },
  texel: { value: new THREE.Vector2(1 / 4, 1 / 4) },
};
const PLANAR_GLSL = `
uniform sampler2D uMirror; uniform mat4 uMirrorMat; uniform vec2 uMirrorTexel;
vec4 planar(vec3 wp, float blur) {
  vec4 c = uMirrorMat * vec4(wp, 1.0);
  vec2 uv = c.xy / c.w;
  vec4 s = min(texture2D(uMirror, uv), vec4(2.0)) * 0.2;
  vec2 o = uMirrorTexel * blur;
  s += min(texture2D(uMirror, uv + vec2(o.x, o.y)), vec4(2.0)) * 0.2;
  s += min(texture2D(uMirror, uv + vec2(-o.x, o.y)), vec4(2.0)) * 0.2;
  s += min(texture2D(uMirror, uv + vec2(o.x, -o.y)), vec4(2.0)) * 0.2;
  s += min(texture2D(uMirror, uv + vec2(-o.x, -o.y)), vec4(2.0)) * 0.2;
  return s;
}`;

const NOISE_GLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy)); vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1; i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0); m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; mat2 r = mat2(0.8, -0.6, 0.6, 0.8); for (int i = 0; i < 5; i++) { s += a * snoise(p); p = r * p * 2.03 + 17.1; a *= 0.5; } return s; }
float fbm3(vec2 p) { float s = 0.0, a = 0.5; mat2 r = mat2(0.8, -0.6, 0.6, 0.8); for (int i = 0; i < 3; i++) { s += a * snoise(p); p = r * p * 2.03 + 17.1; a *= 0.5; } return s; }`;

// White marble with soft gray veins, computed from where the pixel is on the table, so it never repeats.
const marbleMat = new P({ color: 0xffffff, roughness: 0.2, clearcoat: 0.55, clearcoatRoughness: 0.09 });
marbleMat.onBeforeCompile = (sh) => {
  sh.uniforms.uMirror = { value: mirror.rt.texture }; sh.uniforms.uMirrorMat = mirror.mat; sh.uniforms.uMirrorTexel = mirror.texel;
  marbleMat.userData.sh = sh;
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
    .replace('#include <fog_vertex>', '#include <fog_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vWP;
${NOISE_GLSL}
${PLANAR_GLSL}
float veinLine(float f, float w) { float d = abs(fract(f + 0.5) - 0.5); float aa = fwidth(f) * 1.2; return 1.0 - smoothstep(w, w + aa + 0.002, d); }
float ridge(vec2 p) { return 1.0 - abs(snoise(p)); }
// Carrara: a white-gray ground with cloudy gray, veins that run one way (a diagonal), some broad and soft,
// and thin sharp threads that branch off them
vec4 marble(vec2 p) {
  const vec2 dir = vec2(0.80, -0.60);                 // the run of the veins
  vec2 u = vec2(dot(p, dir), dot(p, vec2(-dir.y, dir.x)));   // along, across
  vec2 w = vec2(fbm3(p * 0.014 + 3.0), fbm3(p * 0.014 + 7.7));
  vec2 q = u + w * 9.0;
  // cloudy ground
  float cloud = fbm(p * 0.02 + 1.7) * 0.6 + fbm3(p * 0.07 + 4.2) * 0.4;
  vec3 base = vec3(0.80, 0.80, 0.79) * (1.0 - 0.07 * smoothstep(-0.35, 0.6, cloud));
  base *= 1.0 + 0.01 * snoise(p * 3.1);
  // broad soft bands: stretched along the run
  float bandN = fbm3(q * vec2(0.006, 0.05) + 2.0);
  float band = smoothstep(0.18, 0.55, bandN) * 0.55 + smoothstep(0.45, 0.62, bandN) * 0.35;
  // threads: ridged noise stretched along the run, a main family and thinner branches
  float aaw = 0.0;
  float r1 = ridge(q * vec2(0.012, 0.09) + 5.0);
  float t1 = smoothstep(0.955 - fwidth(r1), 0.993, r1) * smoothstep(-0.2, 0.35, fbm3(q * 0.02 + 1.0));
  float r2 = ridge(q * vec2(0.03, 0.16) + vec2(snoise(q * 0.05) * 0.6, 3.0));
  float t2 = smoothstep(0.972 - fwidth(r2), 0.996, r2) * smoothstep(0.0, 0.45, fbm3(q * 0.035 + 9.0));
  float r3 = ridge(q * vec2(0.08, 0.32) + 11.0);
  float t3 = smoothstep(0.985 - fwidth(r3), 0.998, r3) * smoothstep(0.15, 0.55, fbm3(q * 0.06 + 2.0)) * (t1 * 0.0 + 0.7);
  float halo = pow(r1, 14.0) * 0.5 * smoothstep(-0.2, 0.35, fbm3(q * 0.02 + 1.0));
  vec3 gray = vec3(0.34, 0.35, 0.36);
  float v = clamp(band * 0.32 + halo * 0.26 + t1 * 0.62 + t2 * 0.42 + t3 * 0.3, 0.0, 0.8);
  return vec4(mix(base, gray, v), t1 + t2 * 0.5);
}`)
    .replace('#include <color_fragment>', `#include <color_fragment>
vec4 mb = marble(vWP.xz);
diffuseColor.rgb = mb.rgb;`)
    .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = roughnessFactor * (1.0 + 0.6 * mb.a);`)
    .replace('#include <lights_fragment_maps>', `#include <lights_fragment_maps>
{ vec4 pl = planar(vWP, 3.0); radiance = mix(radiance, pl.rgb, pl.a * 0.85);
  #ifdef USE_CLEARCOAT
  clearcoatRadiance = mix(clearcoatRadiance, pl.rgb, pl.a * 0.85);
  #endif
}`);
};
// the tray's floor: the same mirror, sharper
silverTray.onBeforeCompile = (sh) => {
  sh.uniforms.uMirror = { value: mirror.rt.texture }; sh.uniforms.uMirrorMat = mirror.mat; sh.uniforms.uMirrorTexel = mirror.texel;
  silverTray.userData.sh = sh;
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
    .replace('#include <fog_vertex>', '#include <fog_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vWP;\n${PLANAR_GLSL}\n${NOISE_GLSL}`)
    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{ vec2 pw = vWP.xz * 0.06;   // an old tray is not quite flat
  vec3 nT = normalize(vec3(fbm3(pw) * 0.05, 1.0, fbm3(pw + 5.3) * 0.05));
  normal = normalize((viewMatrix * vec4(nT, 0.0)).xyz); }`)
    .replace('#include <lights_fragment_maps>', `#include <lights_fragment_maps>
{ vec4 pl = planar(vWP, 6.0 + roughnessFactor * 14.0); radiance = mix(radiance, pl.rgb, pl.a * 0.6); }`)
    .replace('#include <aomap_fragment>', `#include <aomap_fragment>
reflectedLight.directSpecular *= 0.12;   // the window's glare on satin silver: a broad sheen, not a white sheet`);
};

/* ---------- Geometry ---------- */

const v2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));
// a smooth profile through points; `corners` keeps a list of segments apart so a crease stays a crease
function profile(...segments) {
  const out = [];
  for (const seg of segments) {
    const pts = seg.length > 2 ? new THREE.SplineCurve(v2(seg)).getSpacedPoints(Math.max(6, seg.length * 7)) : v2(seg);
    if (out.length) pts.shift();
    out.push(...pts);
  }
  return out;
}
function lathe(pts, segs = 96, phi = 0) {
  const g = new THREE.LatheGeometry(pts, segs, phi, TAU);
  return g;
}
// a tube along a curve with an elliptical section that can change along it
function sweep(curve, n, m, rw, rh) {
  const frames = curve.computeFrenetFrames(n, false);
  const pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, P0 = curve.getPointAt(t), N = frames.normals[i], B = frames.binormals[i];
    const a = rw(t), b = rh(t);
    for (let j = 0; j <= m; j++) {
      const th = (j / m) * TAU, c = Math.cos(th), s = Math.sin(th);
      pos.push(P0.x + N.x * c * b + B.x * s * a, P0.y + N.y * c * b + B.y * s * a, P0.z + N.z * c * b + B.z * s * a);
      const nn = N.clone().multiplyScalar(c / Math.max(b, 1e-3)).addScaledVector(B, s / Math.max(a, 1e-3)).normalize();
      nor.push(nn.x, nn.y, nn.z); uv.push(t, j / m);
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const a = i * (m + 1) + j, b = a + m + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
const curve3 = (pts) => new THREE.CatmullRomCurve3(pts.map(([x, y, z = 0]) => V3(x, y, z)), false, 'centripetal');
const mesh = (g, m, cast = true, recv = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = recv; return o; };

/* the table */
// a slab 3 cm thick with a rounded edge; its far edge runs across the picture, behind the tray
const TABLE = { w: 130, d: 92, back: -16.5 };
const table = mesh(new RoundedBoxGeometry(TABLE.w, 3, TABLE.d, 5, 1.3), marbleMat, false, true);
table.position.set(0, -1.5, TABLE.back + TABLE.d / 2);
scene.add(table);

/* beyond the table: the coffee house, far out of focus. A dome shaded by the direction one looks in. */
const backdrop = new THREE.Mesh(new THREE.SphereGeometry(700, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: true,
  vertexShader: 'varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
  fragmentShader: `
  varying vec3 vW;
  float disc(vec2 p, vec2 c, float r, float soft) { return 1.0 - smoothstep(r - soft, r + soft, length(p - c)); }
  void main() {
    vec3 d = normalize(vW - cameraPosition);
    vec2 a = vec2(atan(d.x, -d.z), asin(clamp(d.y, -1.0, 1.0)));     // azimuth, elevation
    // a dark wood interior, warmer and a little lighter toward the window on the left
    vec3 c = vec3(0.030, 0.019, 0.012);
    c += vec3(0.05, 0.036, 0.026) * smoothstep(0.4, -0.9, a.x) * smoothstep(-0.7, -0.35, a.y);
    c += vec3(0.012, 0.008, 0.004) * (0.5 + 0.5 * sin(a.y * 70.0 + 1.3)) * smoothstep(-0.65, -0.4, a.y);
    // the curve of a bentwood chair's back, dark, with a line of window light on it
    vec2 cc = vec2(0.17, -0.505); float rad = length((a - cc) * vec2(1.0, 1.35));
    float arc = (1.0 - smoothstep(0.004, 0.018, abs(rad - 0.085))) * step(cc.y - 0.01, a.y);
    c = mix(c, vec3(0.008, 0.005, 0.003), arc * 0.85);
    c += vec3(0.09, 0.07, 0.05) * (1.0 - smoothstep(0.0, 0.012, abs(rad - 0.095))) * step(cc.y + 0.02, a.y) * smoothstep(0.2, 0.05, a.x);
    // panelling: darker uprights, soft
    c *= 0.72 + 0.28 * smoothstep(0.0, 0.5, abs(fract(a.x * 3.2 + 0.15) - 0.5) * 2.0);
    // the window's glow, far to the left, cool and dim
    c += vec3(0.10, 0.12, 0.14) * exp(-pow((a.x + 0.95) / 0.28, 2.0)) * smoothstep(-0.75, -0.3, a.y);
    // lamps in the room behind, as soft discs of different sizes
    vec3 warm = vec3(1.0, 0.6, 0.28);
    c += warm * 1.3 * disc(a, vec2(-0.52, -0.43), 0.020, 0.008);
    c += warm * 0.7 * disc(a, vec2(-0.08, -0.40), 0.014, 0.006);
    c += warm * 1.1 * disc(a, vec2(0.30, -0.425), 0.03, 0.011);
    c += warm * 0.45 * disc(a, vec2(0.55, -0.39), 0.04, 0.016);
    c += warm * 0.9 * disc(a, vec2(0.12, -0.455), 0.012, 0.005);
    c += warm * 0.05 * exp(-pow(length(a - vec2(0.30, -0.425)) / 0.1, 2.0));
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`,
}));
backdrop.frustumCulled = false;
scene.add(backdrop);
scene.background = null;

/* the tray: an oval of silver with a rolled rim */
const tray = new THREE.Group();
{
  const segs = +(q.get("segs") || 160);
  // the rim, as offsets inward from the oval's edge (d) and heights (y)
  const prof = profile([[2.6, TRAY_Y], [1.4, TRAY_Y + 0.02], [0.75, TRAY_Y + 0.2], [0.42, 0.75], [0.22, 1.1], [0.05, 1.22], [-0.12, 1.14], [-0.16, 0.98], [-0.05, 0.86]],
    [[-0.05, 0.86], [0.15, 0.45], [0.55, 0.08], [1.4, 0.0], [2.8, 0.0]]);
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const th = (i / segs) * TAU, c = Math.cos(th), s = Math.sin(th);
    for (let j = 0; j < prof.length; j++) {
      const d = prof[j].x, y = prof[j].y;
      pos.push((TRAY.a - d) * c, y, (TRAY.b - d) * s); uv.push(i / segs * 12, j / prof.length);
    }
  }
  const L = prof.length;
  for (let i = 0; i < segs; i++) for (let j = 0; j < L - 1; j++) { const a = i * L + j, b = a + L; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  const rim = mesh(g, silver); tray.add(rim);
  const shape = new THREE.Shape(); shape.absellipse(0, 0, TRAY.a - 2.6 + 0.05, TRAY.b - 2.6 + 0.05, 0, TAU, false, 0);
  const fg = new THREE.ShapeGeometry(shape, 96); fg.rotateX(-Math.PI / 2); fg.translate(0, TRAY_Y, 0);
  const fl = mesh(fg, silverTray, false, true); fl.userData.mirrorSkip = true; tray.add(fl);
}
tray.position.set(TRAY.x, 0, TRAY.z);
scene.add(tray);

/* the saucer */
const saucer = mesh(lathe(profile(
  [[0, 0.14], [3.25, 0.16]], [[3.25, 0.16], [3.4, 0.03], [3.55, 0], [3.85, 0], [3.95, 0.06]],
  [[3.95, 0.06], [5.3, 0.42], [6.7, 0.86], [7.45, 1.16], [7.6, 1.3], [7.52, 1.38], [7.36, 1.36], [6.6, 1.12], [5.4, 0.74], [4.1, 0.48], [3.7, SAUCER_WELL + 0.01], [3.0, SAUCER_WELL], [0, SAUCER_WELL]]
), 160), porcelainSaucer);
saucer.position.copy(SAUCER);
scene.add(saucer);

/* the cup, and the volume it holds at each height */
const CUPDIM = { y0: 0.5, yb: 5.3, rb: 1.95, rt: 4.0, wall: 0.24 };   // a wide Viennese cup, rounded inside
function rInRaw(y) {
  const t = clamp((y - CUPDIM.y0) / (CUPDIM.yb - CUPDIM.y0), 0, 1);
  const r = CUPDIM.rb + (CUPDIM.rt - CUPDIM.rb) * (1 - Math.pow(1 - t, 1.9));
  const b = Math.min(1, t / 0.1);
  return r * Math.sqrt(Math.max(0, 1 - (1 - b) * (1 - b)));
}
let CUPS = 1;
{
  let v = 0; const n = 400, dy = (CUPDIM.yb - CUPDIM.y0) / n;
  for (let i = 0; i < n; i++) { const r = rInRaw(CUPDIM.y0 + (i + 0.5) * dy); v += Math.PI * r * r * dy; }
  CUPS = Math.cbrt(165 / v);
}
const VOL = [];
{
  let v = 0; const n = 600, dy = (CUPDIM.yb - CUPDIM.y0) / n;
  VOL.push([CUPDIM.y0 * CUPS, 0]);
  for (let i = 0; i < n; i++) { const r = rInRaw(CUPDIM.y0 + (i + 0.5) * dy) * CUPS; v += Math.PI * r * r * dy * CUPS; VOL.push([(CUPDIM.y0 + (i + 1) * dy) * CUPS, v]); }
}
// height of the surface above the cup's foot, and its radius, for a volume in ml
function levelFor(ml) {
  let i = 1; while (i < VOL.length - 1 && VOL[i][1] < ml) i++;
  const [y0, a] = VOL[i - 1], [y1, b] = VOL[i];
  const y = lerp(y0, y1, clamp((ml - a) / Math.max(1e-6, b - a), 0, 1));
  return { y, r: rInRaw(y / CUPS) * CUPS };
}
const BRIM_Y = CUPDIM.yb * CUPS;
const cup = new THREE.Group();
{
  const ys = [];
  for (let i = 0; i <= 28; i++) ys.push(lerp(CUPDIM.y0 + 0.02, CUPDIM.yb, i / 28));
  const rOut = (y) => rInRaw(Math.max(y, CUPDIM.y0 + 0.45)) + CUPDIM.wall * (1 - 0.25 * (y / CUPDIM.yb));
  const outer = ys.filter((y) => y > 0.7).map((y) => [rOut(y), y]);
  const inner = ys.slice().reverse().map((y) => [rInRaw(y), y]);
  const pts = profile(
    [[0, 0.1], [1.6, 0.1]], [[1.6, 0.1], [1.75, 0.0], [2.05, 0.0], [2.18, 0.12], [2.24, 0.3]],
    [[2.24, 0.3], [2.5, 0.5], ...outer.slice(0, -1), [CUPDIM.rt + 0.18, CUPDIM.yb - 0.05], [CUPDIM.rt + 0.12, CUPDIM.yb + 0.06], [CUPDIM.rt + 0.04, CUPDIM.yb + 0.08], [CUPDIM.rt - 0.02, CUPDIM.yb + 0.02]],
    [[CUPDIM.rt - 0.02, CUPDIM.yb + 0.02], ...inner.slice(1, -1), [0.9, CUPDIM.y0 + 0.01], [0, CUPDIM.y0]],
  );
  const body = mesh(lathe(pts, 128), porcelain);
  cup.add(body);
  // the handle: a loop with an oval section, its ends sunk in the wall
  const hc = curve3([[rOut(4.75) - 0.08, 4.75], [rOut(4.75) + 0.95, 5.0], [rOut(4.75) + 1.8, 4.6], [rOut(4.75) + 2.0, 3.75], [rOut(3.2) + 1.6, 2.8], [rOut(2.3) + 0.8, 2.15], [rOut(1.8) - 0.08, 1.8]]);
  const h = mesh(sweep(hc, 64, 16, (t) => 0.36 - 0.06 * Math.sin(t * Math.PI) + (t < 0.08 || t > 0.92 ? 0.04 : 0), (t) => 0.2 + 0.03 * Math.sin(t * Math.PI)), porcelain);
  cup.add(h);
  cup.scale.setScalar(CUPS);
  cup.position.copy(CUP);
  cup.rotation.y = -0.62;      // the handle to the right, toward the guest
}
scene.add(cup);

/* the teaspoon: a bowl and a handle, in silver */
// a teaspoon, 13 cm: a bowl 3 cm by 2 cm, a slim handle that widens a little at its end
function makeSpoon() {
  const g = new THREE.Group();
  const bowl = lathe(profile([[0, -0.36], [0.45, -0.33], [0.8, -0.19], [0.98, -0.02], [1.0, 0.03], [0.96, 0.04], [0.82, -0.13], [0.45, -0.27], [0, -0.3]]), 48);
  bowl.scale(1.5, 1, 1.0);
  g.add(mesh(bowl, silver));
  const hc = curve3([[1.3, 0.0], [2.2, 0.1], [3.6, 0.3], [6.4, 0.42], [9.6, 0.47], [11.5, 0.44]]);
  g.add(mesh(sweep(hc, 64, 10, (t) => lerp(0.14, 0.42, sstep(0.3, 1, t)) * (t > 0.95 ? Math.sqrt(Math.max(0.05, 1 - (t - 0.95) / 0.05)) : 1), (t) => lerp(0.065, 0.09, t)), silver));
  return g;
}
const spoon = makeSpoon();
// Where it rests: the bowl in the saucer's well beside the cup, the neck on the saucer's rim, the handle out over the
// tray. Found by letting it settle: for each tilt, lift it until no point is inside the saucer, keep the lowest.
const SAUCER_TOP = [[0, 0.42], [3.0, 0.42], [3.7, 0.43], [4.1, 0.48], [5.4, 0.74], [6.6, 1.12], [7.36, 1.36], [7.5, 1.385], [7.62, 1.3]];
function saucerTop(r) {
  for (let i = 1; i < SAUCER_TOP.length; i++) if (r <= SAUCER_TOP[i][0]) { const [r0, y0] = SAUCER_TOP[i - 1], [r1, y1] = SAUCER_TOP[i]; return lerp(y0, y1, (r - r0) / (r1 - r0)); }
  return -1;
}
function spoonRest(ang, rb) {
  const d = V3(Math.cos(ang), 0, Math.sin(ang)), yawA = Math.atan2(-d.z, d.x);
  const yaw = new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), yawA);
  const pts = [];
  spoon.children.forEach((o) => { const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 2) pts.push(V3(p.getX(i), p.getY(i), p.getZ(i))); });
  const C = V3(SAUCER.x + d.x * rb, 0, SAUCER.z + d.z * rb);
  let best = null;
  for (let th = -0.12; th <= 0.4; th += 0.003) {
    const qq = yaw.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V3(0, 0, 1), th));
    let lift = -1e9;
    for (const p0 of pts) {
      const w = p0.clone().applyQuaternion(qq);
      const r = Math.hypot(C.x + w.x - SAUCER.x, C.z + w.z - SAUCER.z);
      const st = saucerTop(r);
      const floor = st >= 0 ? SAUCER.y + st : TRAY_Y;
      lift = Math.max(lift, floor + 0.012 - w.y);
    }
    const com = lift + V3(2.6, 0, 0).applyQuaternion(qq).y;
    if (!best || com < best.com) best = { com, lift, qq, th };
  }
  return { p: V3(C.x, best.lift, C.z), q: best.qq, yaw: yawA, d, rb };
}
const SPOON_REST = spoonRest(Math.atan2(0.12, -1), 4.6);
spoon.position.copy(SPOON_REST.p); spoon.quaternion.copy(SPOON_REST.q);
scene.add(spoon);

/* the milk jug: porcelain, a belly, a spout pulled from the lip, a handle opposite */
function makeJug() {
  const g = new THREE.Group();
  const pts = profile(
    [[0, 0.1], [1.9, 0.1]], [[1.9, 0.1], [2.05, 0.0], [2.35, 0.0], [2.45, 0.12]],
    [[2.45, 0.12], [2.85, 0.75], [3.12, 1.9], [3.1, 3.2], [2.82, 4.4], [2.42, 5.4], [2.3, 6.3], [2.42, 7.15], [2.6, 7.7], [2.62, 7.86], [2.52, 7.9], [2.44, 7.75],
      [2.28, 7.1], [2.16, 6.3], [2.28, 5.4], [2.66, 4.4], [2.92, 3.2], [2.94, 1.9], [2.68, 0.85], [1.5, 0.55], [0, 0.5]],
  );
  const lg = lathe(pts, 128, Math.PI / 2);
  // the spout: pull the lip outward toward −x
  const p = lg.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const ang = Math.atan2(z, -x);           // 0 toward −x
    const w = Math.exp(-((ang / 0.42) ** 2)) * sstep(5.2, 7.9, y) ** 2;
    const r = Math.hypot(x, z) || 1e-6;
    const nr = r + w * 1.6;
    p.setXYZ(i, (x / r) * nr, y + w * 0.5, (z / r) * nr);
  }
  lg.computeVertexNormals();
  g.add(mesh(lg, porcelain));
  const hc = curve3([[2.4, 6.9], [3.6, 7.05], [4.6, 6.45], [4.75, 5.1], [4.2, 3.6], [3.4, 2.7], [2.9, 2.35]]);
  g.add(mesh(sweep(hc, 56, 14, (t) => 0.4 - 0.08 * Math.sin(t * Math.PI), (t) => 0.22), porcelain));
  g.userData.spout = V3(-(2.62 + 1.6), 7.86 + 0.5, 0);
  g.userData.spoutDir = V3(-1, 0.15, 0).normalize();
  return g;
}
const jug = makeJug();
scene.add(jug);
// the milk in the jug: its surface stays level however the jug is tipped (an ellipse where a level plane cuts it)
const jugMilk = new THREE.Mesh(new THREE.CircleGeometry(1, 72).rotateX(-Math.PI / 2), new P({ color: 0xf3efe6, roughness: 0.25, emissive: new THREE.Color(0.24, 0.232, 0.218) }));
jugMilk.receiveShadow = true;
scene.add(jugMilk);
const JUG_MILK = { h: 6.25, r: 2.16, lipH: 7.86 + 0.5 - 0.35 };
function placeJugMilk() {
  jug.updateMatrixWorld(true);
  const inv = jug.quaternion.clone().invert();
  const n = V3(0, 1, 0).applyQuaternion(inv);                 // level, seen from inside the jug
  const tipK = clamp(1 - n.y, 0, 1);
  const S = jug.userData.spout;
  // tipped, the milk comes up to the spout; standing, it rests at its height
  const hTip = (n.x * S.x + n.y * JUG_MILK.lipH) / Math.max(0.2, n.y);
  const h = lerp(JUG_MILK.h, Math.min(hTip, 7.6), sstep(0.0, 0.35, tipK));
  jugMilk.position.copy(jug.localToWorld(V3(0, h, 0)));
  const dir = V3(n.x, 0, n.z); const tilt = dir.length();
  const yaw = tilt > 1e-4 ? Math.atan2(-V3(1, 0, 0).applyQuaternion(jug.quaternion).z, V3(1, 0, 0).applyQuaternion(jug.quaternion).x) : 0;
  jugMilk.rotation.set(0, yaw, 0);
  const ny = Math.max(0.25, n.y);
  jugMilk.scale.set(JUG_MILK.r / ny, 1, JUG_MILK.r);
}

/* a small glass of water, two thirds full */
const glass = new THREE.Group();
{
  const G0 = { r0: 2.6, r1: 3.0, h: 8.5, wall: 0.18, base: 0.8 };
  const rAt = (y) => lerp(G0.r0, G0.r1, y / G0.h);
  const outer = profile([[0, 0.02], [G0.r0 - 0.25, 0.0], [G0.r0 - 0.04, 0.06], [G0.r0, 0.3]], [[G0.r0, 0.3], [rAt(G0.h * 0.5), G0.h * 0.5], [G0.r1, G0.h - 0.08], [G0.r1 - 0.06, G0.h], [G0.r1 - G0.wall + 0.02, G0.h - 0.05]],
    [[G0.r1 - G0.wall + 0.02, G0.h - 0.05], [rAt(G0.h * 0.5) - G0.wall, G0.h * 0.5], [G0.r0 - G0.wall, G0.base + 0.25], [G0.r0 - G0.wall - 0.35, G0.base], [0, G0.base - 0.05]]);
  // glass as a photograph shows it: what it mirrors, and walls that darken toward their edges; the rest is clear
  const clearMat = (edge, tint, k) => {
    const m = new P({ color: 0x000000, roughness: 0.07, metalness: 0, specularIntensity: 1, envMapIntensity: 1.3,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `
        float fr = pow(1.0 - abs(dot(normal, geometryViewDir)), ${k});
        float a = clamp(${edge.toFixed(3)} + 0.95 * fr, 0.0, 0.92);
        // one tall highlight down the side that faces the window
        vec3 rv = reflect(-geometryViewDir, normal);
        vec3 wv = normalize((viewMatrix * vec4(${v3([SUN.x, SUN.y * 0.6, SUN.z])}, 0.0)).xyz);
        float hl = smoothstep(0.86, 0.97, dot(normalize(rv), wv));
        gl_FragColor = vec4(outgoingLight + vec3(${tint}) * a + vec3(1.6, 1.58, 1.52) * hl * ${k === '2.5' ? '1.0' : '0.4'}, max(a, hl * 0.6));`)
        .replace('#include <premultiplied_alpha_fragment>', '');
    };
    return m;
  };
  const glassMat = clearMat(0.03, '0.05, 0.06, 0.055', '2.5');
  glassMat.depthWrite = true;
  const gm = mesh(lathe(outer, 96), glassMat, false, false); gm.renderOrder = 3;   // glass lets the light through: no dark shadow
  glass.add(gm);
  const WH = G0.h * 0.66;
  const water = profile([[0, G0.base - 0.04], [G0.r0 - G0.wall - 0.36, G0.base - 0.01], [G0.r0 - G0.wall - 0.02, G0.base + 0.25], [rAt(WH) - G0.wall - 0.02, WH - 0.12], [rAt(WH) - G0.wall - 0.1, WH], [0, WH]]);
  const waterMat = clearMat(0.025, '0.07, 0.09, 0.085', '2.0');
  const wm = mesh(lathe(water, 96), waterMat, false, false); wm.renderOrder = 2; glass.add(wm);
  // the rim and the water line, the two crisp ellipses that say "glass of water"
  const lineMat = (c, o) => new THREE.MeshBasicMaterial({ color: new THREE.Color(...c), transparent: true, opacity: o, depthWrite: true });
  const rimT = new THREE.Mesh(new THREE.TorusGeometry(G0.r1 - G0.wall / 2, 0.05, 6, 96), lineMat([1.4, 1.38, 1.32], 0.75));
  rimT.rotation.x = -Math.PI / 2; rimT.position.y = G0.h - 0.02; rimT.renderOrder = 4; glass.add(rimT);
  const wl = new THREE.Mesh(new THREE.TorusGeometry(rAt(WH) - G0.wall - 0.06, 0.035, 6, 96), lineMat([0.55, 0.62, 0.6], 0.55));
  wl.rotation.x = -Math.PI / 2; wl.position.y = WH; wl.renderOrder = 4; glass.add(wl);
  // where the window light comes through the water: a bright patch on the tray beside it
  const caustic = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 vUv; void main() { vec2 p = (vUv - 0.5) * vec2(2.0, 2.0); float g = exp(-dot(p * vec2(1.6, 2.6), p * vec2(1.6, 2.6))); float core = exp(-dot(p * vec2(4.0, 7.0), p * vec2(4.0, 7.0))); gl_FragColor = vec4(vec3(1.0, 0.96, 0.86) * (0.22 * g + 0.5 * core), 1.0); }',
  }));
  const sd = V3(-SUN.x, 0, -SUN.z).normalize();
  caustic.rotation.set(-Math.PI / 2, 0, Math.atan2(-sd.z, sd.x)); caustic.position.set(sd.x * 7.5, 0.02, sd.z * 7.5); caustic.renderOrder = 2;
  glass.add(caustic);
  glass.position.copy(GLASS_AT);
}
if (!q.has('noglass')) scene.add(glass);

/* the color card, and the brass ring that marks a color on it */
const CARD = { w: 10, h: 19, px: 80 };
const cardCanvas = document.createElement('canvas');
cardCanvas.width = CARD.w * CARD.px; cardCanvas.height = CARD.h * CARD.px;
const cardTex = new THREE.CanvasTexture(cardCanvas);
cardTex.colorSpace = THREE.SRGBColorSpace; cardTex.anisotropy = ANISO;
const cardGroup = new THREE.Group();
const cardMesh = mesh(new THREE.BoxGeometry(CARD.w, 0.06, CARD.h), [
  new P({ color: 0xe9dfca, roughness: 0.85 }), new P({ color: 0xe9dfca, roughness: 0.85 }),
  new P({ map: cardTex, roughness: 0.78, sheen: 0.3, sheenRoughness: 0.8, sheenColor: new THREE.Color(0.4, 0.38, 0.34) }),
  new P({ color: 0xe9dfca, roughness: 0.85 }), new P({ color: 0xe9dfca, roughness: 0.85 }), new P({ color: 0xe9dfca, roughness: 0.85 }),
]);
cardMesh.position.y = 0.03;
cardGroup.add(cardMesh);
const ring = mesh(new THREE.TorusGeometry(0.78, 0.1, 18, 72), brass);
ring.rotation.x = -Math.PI / 2;
ring.visible = false;
cardGroup.add(ring);
scene.add(cardGroup);

// the layout of the swatches on the card, in centimeters from its top-left corner
const LAYOUT = (() => {
  const h = 1.42, gIn = 0.12, gOut = 0.46, x = 0.85, w = 3.7;
  let y = 0; const rows = [];
  GROUPS.forEach((g, gi) => { for (let i = g.from; i <= g.to; i++) { rows[i] = { x, y, w, h }; y += h + (i < g.to ? gIn : 0); } if (gi < GROUPS.length - 1) y += gOut; });
  const top = (CARD.h - y) / 2;
  rows.forEach((r) => { r.y += top; });
  return rows;
})();
const swatchLocal = (i) => { const r = LAYOUT[i]; return V3(r.x + r.w / 2 - CARD.w / 2, 0.09, r.y + r.h / 2 - CARD.h / 2); };

// paper fibers and the painted swatches are drawn once; the names are drawn on top as they are found
const paper = document.createElement('canvas');
{
  const W = cardCanvas.width, H = cardCanvas.height, g = paper.getContext('2d');
  paper.width = W; paper.height = H;
  g.fillStyle = '#efe5cf'; g.fillRect(0, 0, W, H);
  const id = g.getImageData(0, 0, W, H), d = id.data;
  let s = 99; const rn = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < W * H; i++) { const n = (rn() - 0.5) * 7; d[i * 4] += n; d[i * 4 + 1] += n; d[i * 4 + 2] += n * 0.9; }
  g.putImageData(id, 0, 0);
  for (let i = 0; i < 700; i++) { g.strokeStyle = `rgba(${rn() < 0.5 ? '120,100,70' : '255,250,235'},${0.05 + rn() * 0.08})`; g.lineWidth = 0.6 + rn(); const x = rn() * W, y = rn() * H, a = rn() * TAU, l = 4 + rn() * 14; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  // a faint age at the edges
  const e = g.createLinearGradient(0, 0, W, 0); e.addColorStop(0, 'rgba(150,120,70,.10)'); e.addColorStop(0.04, 'rgba(150,120,70,0)'); e.addColorStop(0.96, 'rgba(150,120,70,0)'); e.addColorStop(1, 'rgba(150,120,70,.10)');
  g.fillStyle = e; g.fillRect(0, 0, W, H);
  // nine swatches of gouache, each a little uneven at the edge, laid on in a few horizontal strokes
  const px = CARD.px;
  LAYOUT.forEach((r, i) => {
    const col = km(SWATCH[i]);
    const x0 = r.x * px, y0 = r.y * px, w = r.w * px, h = r.h * px;
    const edge = (n, amp) => { const a = []; let v = 0; for (let k = 0; k <= n; k++) { v = v * 0.6 + (rn() - 0.5) * amp; a.push(v); } return a; };
    const N = 40, top = edge(N, 3.2), bot = edge(N, 3.2), lf = edge(12, 2.4), rt = edge(12, 5.0);
    g.save();
    g.beginPath();
    for (let k = 0; k <= N; k++) g.lineTo(x0 + (w * k) / N, y0 + top[k]);
    for (let k = 0; k <= 12; k++) g.lineTo(x0 + w + rt[k] + (k === 0 || k === 12 ? 0 : 1.5), y0 + (h * k) / 12);
    for (let k = N; k >= 0; k--) g.lineTo(x0 + (w * k) / N, y0 + h + bot[k]);
    for (let k = 12; k >= 0; k--) g.lineTo(x0 + lf[k], y0 + (h * k) / 12);
    g.closePath();
    g.fillStyle = hex(col); g.fill();
    g.clip();
    // brush strokes: the paint a touch thicker and thinner along each pass
    for (let k = 0; k < 9; k++) {
      const yy = y0 + rn() * h, hh = 4 + rn() * 12, f = 1 + (rn() - 0.5) * 0.07;
      g.fillStyle = hex(col.map((v) => v * f)); g.globalAlpha = 0.5;
      g.fillRect(x0 - 4, yy, w + 10, hh);
    }
    g.globalAlpha = 1;
    // the paint gathers at the edge as it dries
    g.lineWidth = 3; g.strokeStyle = hex(col.map((v) => v * 0.9)); g.globalAlpha = 0.35; g.stroke(); g.globalAlpha = 1;
    g.restore();
  });
}
const FONT = '"Bodoni Moda", "Didot", "Times New Roman", serif';
let writing = null;   // { gi, t } while a name is being written
function drawCard() {
  const g = cardCanvas.getContext('2d'), px = CARD.px;
  g.drawImage(paper, 0, 0);
  GROUPS.forEach((gr, gi) => {
    const done = named.has(gr.key), now = writing && writing.gi === gi;
    if (!done && !now) return;
    const a = LAYOUT[gr.from], b = LAYOUT[gr.to];
    const yc = ((a.y + b.y + b.h) / 2) * px;
    const k = now ? clamp(writing.t, 0, 1) : 1;
    g.save();
    // a pen line beside the group's colors
    const lx = (a.x + a.w + 0.28) * px, ly0 = a.y * px + 6, ly1 = (b.y + b.h) * px - 6;
    g.strokeStyle = 'rgba(38,26,18,.85)'; g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(lx, ly0); g.lineTo(lx, ly0 + (ly1 - ly0) * clamp(k * 3, 0, 1)); g.stroke();
    // the name, in a pen italic, revealed left to right as it is written
    const x = (a.x + a.w + 0.62) * px, maxW = (CARD.w - (a.x + a.w + 0.62) - 0.45) * px;
    let size = 64; g.font = `italic 500 ${size}px ${FONT}`;
    while (g.measureText(gr.word).width > maxW && size > 20) { size -= 1; g.font = `italic 500 ${size}px ${FONT}`; }
    const tw = g.measureText(gr.word).width;
    g.beginPath(); g.rect(x - 4, yc - size, (tw + 10) * clamp(k * 1.25 - 0.15, 0, 1), size * 2); g.clip();
    g.fillStyle = 'rgba(34,22,14,.92)'; g.shadowColor = 'rgba(34,22,14,.35)'; g.shadowBlur = 1.2;
    g.textBaseline = 'middle'; g.fillText(gr.word, x, yc + size * 0.08);
    g.restore();
  });
  cardTex.needsUpdate = true;
}

/* ---------- The soft dark under each thing, where it meets what it stands on ---------- */

// each is an analytic falloff from a contact outline (an oval or a rectangle), so it never bands
const BLOB_FS = `
varying vec2 vUv; uniform vec2 uSize, uHalf; uniform float uOp, uIn, uOut, uRect;
void main() {
  vec2 p = (vUv - 0.5) * uSize;
  float d;
  if (uRect > 0.5) { vec2 q = abs(p) - uHalf; d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
  else { float rho = length(p / uHalf); d = (rho - 1.0) * min(uHalf.x, uHalf.y); }
  float a = d > 0.0 ? exp(-d / uOut) : exp(d / uIn);
  gl_FragColor = vec4(0.09, 0.065, 0.045, a * uOp);
}`;
const blobs = [];
function blob(hx, hy, opacity, inW, outW, at, parent = scene, rect = false) {
  const W = hx * 2 + outW * 8, H = hy * 2 + outW * 8;
  const mat = new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: BLOB_FS, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { uSize: { value: new THREE.Vector2(W, H) }, uHalf: { value: new THREE.Vector2(hx, hy) }, uOp: { value: opacity }, uIn: { value: inW }, uOut: { value: outW }, uRect: { value: rect ? 1 : 0 } },
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat);
  m.rotation.x = -Math.PI / 2; m.position.copy(at); m.renderOrder = 1;
  parent.add(m); blobs.push(m); m.userData.base = opacity; if (q.has('noblob')) m.visible = false;
  m.setOpacity = (o) => { mat.uniforms.uOp.value = o; };
  return m;
}
blob(TRAY.a - 0.7, TRAY.b - 0.7, 0.55, 1.2, 0.45, V3(TRAY.x, 0.01, TRAY.z));
blob(3.85, 3.85, 0.6, 0.5, 0.3, V3(SAUCER.x, TRAY_Y + 0.01, SAUCER.z));
blob(6.2, 6.2, 0.26, 3.0, 1.4, V3(SAUCER.x, TRAY_Y + 0.008, SAUCER.z));
blob(2.5, 2.5, 0.55, 0.5, 0.35, V3(GLASS_AT.x, TRAY_Y + 0.01, GLASS_AT.z));
blob(2.1 * CUPS, 2.1 * CUPS, 0.6, 0.4, 0.22, V3(CUP.x, CUP.y + 0.01, CUP.z));
const jugBlob = blob(2.35, 2.35, 0.6, 0.6, 0.4, V3(JUG_AT.x, TRAY_Y + 0.01, JUG_AT.z));
// the spoon's own soft shadows: under the bowl on the saucer, and faintly on the tray under the handle's end
const spoonBlobs = [];
{
  const R = SPOON_REST, bowlAt = V3(SAUCER.x + R.d.x * R.rb, 0, SAUCER.z + R.d.z * R.rb);
  const b1 = blob(1.25, 0.82, 0.45, 0.35, 0.3, V3(bowlAt.x, SAUCER.y + saucerTop(R.rb) + 0.015, bowlAt.z));
  b1.rotation.z = R.yaw; spoonBlobs.push(b1);
  const endAt = bowlAt.clone().addScaledVector(R.d, 9.5);
  const b2 = blob(2.4, 0.22, 0.16, 0.4, 0.5, V3(endAt.x, TRAY_Y + 0.012, endAt.z));
  b2.rotation.z = R.yaw; spoonBlobs.push(b2);
}
const cardBlob = blob(CARD.w / 2, CARD.h / 2, 0.42, 0.3, 0.22, V3(0, 0.005, 0), cardGroup, true);

/* ---------- The fluid: milk on the surface ---------- */

const N = small ? 192 : 256, ND = small ? 384 : 512;
const halfOK = renderer.extensions.has('EXT_color_buffer_half_float') || renderer.extensions.has('EXT_color_buffer_float');
const SIMTYPE = halfOK ? THREE.HalfFloatType : THREE.UnsignedByteType;
const PACK = !halfOK;     // without float targets, values are packed into bytes: coarser, but it runs
const rt = (n) => new THREE.WebGLRenderTarget(n, n, { type: SIMTYPE, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, depthBuffer: false });
const dbl = (n) => ({ a: rt(n), b: rt(n), get read() { return this.a; }, get write() { return this.b; }, swap() { const t = this.a; this.a = this.b; this.b = t; } });
const vel = dbl(N), prs = dbl(N), dye = dbl(ND), curlRT = rt(N), divRT = rt(N);
const qScene = new THREE.Scene(), qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const qMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); qMesh.frustumCulled = false; qScene.add(qMesh);
const SIM_VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const SIM_HEAD = `
precision highp float;
varying vec2 vUv;
uniform vec2 texel;
${PACK ? '#define PACK 1' : ''}
#ifdef PACK
vec4 rdV(sampler2D t, vec2 uv) { return (texture2D(t, uv) * 2.0 - 1.0) * 160.0; }
vec4 wrV(vec4 v) { return clamp(v / 160.0 * 0.5 + 0.5, 0.0, 1.0); }
#else
vec4 rdV(sampler2D t, vec2 uv) { return texture2D(t, uv); }
vec4 wrV(vec4 v) { return v; }
#endif
float inside(vec2 uv) { return step(length(uv * 2.0 - 1.0), 1.0 - 1.5 * texel.x); }
vec2 toDisc(vec2 uv) { vec2 d = uv * 2.0 - 1.0; float l = length(d), lim = 1.0 - 3.0 * texel.x; if (l > lim) d *= lim / l; return d * 0.5 + 0.5; }
`;
const simMat = (fs, uniforms) => new THREE.ShaderMaterial({ vertexShader: SIM_VS, fragmentShader: SIM_HEAD + fs, uniforms: { texel: { value: new THREE.Vector2(1 / N, 1 / N) }, ...uniforms }, depthTest: false, depthWrite: false });
// where milk wells up: a ring around where the stream goes in (lobed, so it billows), and a sink in its middle
const SRC_GLSL = `
uniform vec4 uSrc[4]; uniform float uT;
#ifndef HAS_NOISE
${NOISE_GLSL}
#define HAS_NOISE
#endif
float source(vec2 uv) {
  float s = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 S = uSrc[i]; if (S.w == 0.0) continue;
    vec2 d = uv - S.xy; float r = length(d), th = atan(d.y, d.x);
    float lob = 1.0 + 0.9 * snoise(vec2(cos(th), sin(th)) * 1.3 + vec2(uT * 0.35 + float(i) * 3.1, S.x * 7.0));
    float w = 0.42 * S.z + 0.008, sig = 0.5 * S.z + 0.006;
    float ring = exp(-pow((r - S.z) / w, 2.0)) * max(lob, 0.0);
    float core = exp(-pow(r / sig, 2.0));
    s += S.w * (ring - 2.0 * S.z * w * 1.7725 / (sig * sig) * core);   // the sink balances the ring
  }
  return s;
}`;
const M = {
  fill: simMat('uniform vec4 uV; void main() { gl_FragColor = uV; }', { uV: { value: new THREE.Vector4() } }),
  fillV: simMat('void main() { gl_FragColor = wrV(vec4(0.0)); }', {}),
  curl: simMat(`uniform sampler2D uVel;
void main() {
  float L = rdV(uVel, vUv - vec2(texel.x, 0.0)).y, R = rdV(uVel, vUv + vec2(texel.x, 0.0)).y;
  float B = rdV(uVel, vUv - vec2(0.0, texel.y)).x, T = rdV(uVel, vUv + vec2(0.0, texel.y)).x;
  gl_FragColor = wrV(vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0));
}`, { uVel: { value: null } }),
  force: simMat(`uniform sampler2D uVel, uCurl; uniform float uDt, uCurlK, uTime, uDrift;
uniform vec4 uSpoon; uniform float uSpoonR, uSpoonOn;
uniform vec4 uPuff[8]; uniform vec2 uPuffV[8];
${NOISE_GLSL}
void main() {
  if (inside(vUv) < 0.5) { gl_FragColor = wrV(vec4(0.0)); return; }
  float L = rdV(uCurl, vUv - vec2(texel.x, 0.0)).x, R = rdV(uCurl, vUv + vec2(texel.x, 0.0)).x;
  float B = rdV(uCurl, vUv - vec2(0.0, texel.y)).x, T = rdV(uCurl, vUv + vec2(0.0, texel.y)).x, C = rdV(uCurl, vUv).x;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  f /= length(f) + 0.0001; f *= uCurlK * C; f.y *= -1.0;
  vec2 v = rdV(uVel, vUv).xy + f * uDt;
  // the slow life of a hot cup: convection, as a drifting curl-noise
  float e = 0.02;
  vec2 p = vUv * 1.5 + vec2(uTime * 0.021, -uTime * 0.017);
  float n0 = snoise(p + vec2(0.0, e)), n1 = snoise(p - vec2(0.0, e)), n2 = snoise(p + vec2(e, 0.0)), n3 = snoise(p - vec2(e, 0.0));
  v += vec2(n0 - n1, -(n2 - n3)) / (2.0 * e) * uDrift * uDt;
  // puffs of milk coming up: each pushes outward from where it rises
  for (int i = 0; i < 8; i++) {
    vec4 Pf = uPuff[i]; if (Pf.w == 0.0) continue;
    vec2 dd = vUv - Pf.xy; float g = exp(-dot(dd, dd) / (Pf.z * Pf.z));
    v += uPuffV[i] * g * Pf.w;
  }
  // the spoon drags what is around it
  vec2 d = (vUv - uSpoon.xy); float w = exp(-dot(d, d) / (uSpoonR * uSpoonR)) * uSpoonOn;
  v = mix(v, uSpoon.zw, clamp(w * 0.85, 0.0, 1.0));
  // the wall: nothing goes through it
  vec2 c = vUv * 2.0 - 1.0; float l = length(c);
  if (l > 1.0 - 5.0 * texel.x) { vec2 n = c / l; v -= n * max(dot(v, n), 0.0); }
  gl_FragColor = wrV(vec4(v, 0.0, 1.0));
}`, { uVel: { value: null }, uCurl: { value: null }, uDt: { value: 0 }, uCurlK: { value: 5 }, uTime: { value: 0 }, uDrift: { value: 0 }, uSpoon: { value: new THREE.Vector4() }, uSpoonR: { value: 0.09 }, uSpoonOn: { value: 0 },
    uPuff: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) }, uPuffV: { value: Array.from({ length: 8 }, () => new THREE.Vector2()) } }),
  div: simMat(`uniform sampler2D uVel;
${SRC_GLSL}
vec2 vAt(vec2 uv, vec2 c) { return inside(uv) > 0.5 ? rdV(uVel, uv).xy : -c; }
void main() {
  vec2 C = rdV(uVel, vUv).xy;
  float L = vAt(vUv - vec2(texel.x, 0.0), C).x, R = vAt(vUv + vec2(texel.x, 0.0), C).x;
  float B = vAt(vUv - vec2(0.0, texel.y), C).y, T = vAt(vUv + vec2(0.0, texel.y), C).y;
  float d = 0.5 * (R - L + T - B) - source(vUv) * inside(vUv);
  gl_FragColor = wrV(vec4(d, 0.0, 0.0, 1.0));
}`, { uVel: { value: null }, uSrc: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) }, uT: { value: 0 } }),
  jacobi: simMat(`uniform sampler2D uP, uDiv;
float pAt(vec2 uv, float c) { return inside(uv) > 0.5 ? rdV(uP, uv).x : c; }
void main() {
  float C = rdV(uP, vUv).x;
  float L = pAt(vUv - vec2(texel.x, 0.0), C), R = pAt(vUv + vec2(texel.x, 0.0), C);
  float B = pAt(vUv - vec2(0.0, texel.y), C), T = pAt(vUv + vec2(0.0, texel.y), C);
  gl_FragColor = wrV(vec4((L + R + B + T - rdV(uDiv, vUv).x) * 0.25, 0.0, 0.0, 1.0));
}`, { uP: { value: null }, uDiv: { value: null } }),
  grad: simMat(`uniform sampler2D uP, uVel;
float pAt(vec2 uv, float c) { return inside(uv) > 0.5 ? rdV(uP, uv).x : c; }
void main() {
  if (inside(vUv) < 0.5) { gl_FragColor = wrV(vec4(0.0)); return; }
  float C = rdV(uP, vUv).x;
  float L = pAt(vUv - vec2(texel.x, 0.0), C), R = pAt(vUv + vec2(texel.x, 0.0), C);
  float B = pAt(vUv - vec2(0.0, texel.y), C), T = pAt(vUv + vec2(0.0, texel.y), C);
  vec2 v = rdV(uVel, vUv).xy - 0.5 * vec2(R - L, T - B);
  gl_FragColor = wrV(vec4(v, 0.0, 1.0));
}`, { uP: { value: null }, uVel: { value: null } }),
  advV: simMat(`uniform sampler2D uVel; uniform float uDt, uDiss;
void main() {
  if (inside(vUv) < 0.5) { gl_FragColor = wrV(vec4(0.0)); return; }
  vec2 p = toDisc(vUv - uDt * rdV(uVel, vUv).xy * texel);
  gl_FragColor = wrV(vec4(rdV(uVel, p).xy * uDiss, 0.0, 1.0));
}`, { uVel: { value: null }, uDt: { value: 0 }, uDiss: { value: 1 } }),
  advD: simMat(`uniform sampler2D uVel, uDye; uniform float uDt, uRelax, uC, uInj, uCore, uTarget; uniform vec2 uVTexel;
uniform vec4 uDrop[8];
${SRC_GLSL}
void main() {
  vec2 p = toDisc(vUv - uDt * rdV(uVel, vUv).xy * uVTexel);
  float m = texture2D(uDye, p).r;
  // a little diffusion, so cloud edges stay soft
  vec2 dt2 = texel * 1.0;
  float avg = 0.25 * (texture2D(uDye, p + vec2(dt2.x, 0.0)).r + texture2D(uDye, p - vec2(dt2.x, 0.0)).r + texture2D(uDye, p + vec2(0.0, dt2.y)).r + texture2D(uDye, p - vec2(0.0, dt2.y)).r);
  m = mix(m, avg, 0.16);
  m += (uC - m) * uRelax;
  // milk (or mokka) coming up around the stream, and the stream itself where it goes in
  float s = max(source(vUv), 0.0);
  float core = 0.0;
  if (uSrc[0].w != 0.0) { float r = length(vUv - uSrc[0].xy); core = exp(-pow(r / 0.045, 2.0)); }
  m = mix(m, uTarget, clamp((s * uInj + core * uCore) * uDt, 0.0, 1.0));
  for (int i = 0; i < 8; i++) {
    vec4 D = uDrop[i]; if (D.w == 0.0) continue;
    float r = length(vUv - D.xy);
    m = mix(m, uTarget, clamp(exp(-pow(r / D.z, 2.0)) * D.w, 0.0, 1.0));
  }
  if (length(vUv * 2.0 - 1.0) > 1.0) m = uC;
  gl_FragColor = vec4(m, 0.0, 0.0, 1.0);
}`, { uVel: { value: null }, uDye: { value: null }, uDt: { value: 0 }, uRelax: { value: 0 }, uC: { value: 0 }, uInj: { value: 0 }, uCore: { value: 0 }, uTarget: { value: 1 }, uVTexel: { value: new THREE.Vector2(1 / N, 1 / N) },
    uDrop: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) }, uSrc: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) }, uT: { value: 0 } }),
};
M.advD.uniforms.texel.value.set(1 / ND, 1 / ND);
M.advD.uniforms.uSrc = M.div.uniforms.uSrc; M.advD.uniforms.uT = M.div.uniforms.uT;
function pass(mat, target) { qMesh.material = mat; renderer.setRenderTarget(target); renderer.render(qScene, qCam); }

const sim = {
  t: 0, energy: 0, upwell: 0, target: 1,
  src: [0, 1, 2, 3].map(() => ({ x: 0.5, y: 0.5, r: 0.2, a: 0, life: 0 })),
  drops: [], puffs: [], puffT: 0,
  spoon: { x: 0.5, y: 0.5, vx: 0, vy: 0, on: 0 },
  iters: small ? 16 : 24,
};
// milk that has gone down with the stream comes back up beside it, a puff at a time
function puffAround(u, v, n, reach, power = 1) {
  for (let i = 0; i < n && sim.puffs.length < 8; i++) {
    const a = rand() * TAU, d = reach * (0.4 + 0.9 * rand());
    let x = u + Math.cos(a) * d, y = v + Math.sin(a) * d;
    const l = Math.hypot(x - 0.5, y - 0.5); if (l > 0.42) { x = 0.5 + (x - 0.5) * 0.42 / l; y = 0.5 + (y - 0.5) * 0.42 / l; }
    const sp = (22 + 40 * rand()) * power, tw = (rand() - 0.5) * 1.4;
    const ca = Math.cos(a + tw), sa = Math.sin(a + tw);
    sim.puffs.push({ x, y, r: 0.08 + 0.06 * rand(), vx: ca * sp, vy: sa * sp });
    if (sim.drops.length < 8) sim.drops.push({ x, y, r: 0.07 + 0.05 * rand(), k: 0.55 + 0.35 * rand() });
  }
}
function simPour(u, v, strength, dt) {
  // called each step while a stream runs: puffs come up around the stream, more as it builds
  sim.puffT -= dt;
  while (sim.puffT <= 0) { sim.puffT += 0.075 / Math.max(0.2, strength); puffAround(u, v, 1, 0.1 + 0.18 * strength, 0.55 + 0.4 * strength); }
  if (sim.drops.length < 8) sim.drops.push({ x: u, y: v, r: 0.03, k: 0.5 * strength });
  // and a broad, thin well-up around it that lightens the coffee
  if (sim.drops.length < 8) sim.drops.push({ x: u + (rand() - 0.5) * 0.1, y: v + (rand() - 0.5) * 0.1, r: 0.16, k: 0.05 * strength });
}
function simReset(c) {
  const ac = renderer.autoClear; renderer.autoClear = false;
  M.fill.uniforms.uV.value.set(c, 0, 0, 1); pass(M.fill, dye.read); pass(M.fill, dye.write);
  for (const t of [vel.read, vel.write, prs.read, prs.write]) pass(M.fillV, t);
  renderer.setRenderTarget(null); renderer.autoClear = ac;
  sim.src.forEach((s) => { s.a = 0; }); sim.energy = 0; sim.upwell = 0;
}
const SRC_K = +(q.get('src') || 0);   // the steady well-up source; the puffs carry the look, so it is off
function simStep(dt) {
  sim.t += dt;
  const ac = renderer.autoClear; renderer.autoClear = false;
  const U = (m, k, v) => { m.uniforms[k].value = v; };
  // sources: positions are in sim uv, strengths in 1/s
  M.div.uniforms.uSrc.value.forEach((v, i) => { const s = sim.src[i]; v.set(s.x, s.y, s.r, s.a * SRC_K); });
  M.div.uniforms.uT.value = sim.t;
  U(M.curl, 'uVel', vel.read.texture); pass(M.curl, curlRT);
  const F = M.force.uniforms;
  F.uVel.value = vel.read.texture; F.uCurl.value = curlRT.texture; F.uDt.value = dt; F.uTime.value = sim.t;
  F.uDrift.value = 3.5 * clamp(cup.unmix * 1.5, 0.15, 1);
  F.uSpoon.value.set(sim.spoon.x, sim.spoon.y, sim.spoon.vx * N, sim.spoon.vy * N); F.uSpoonOn.value = sim.spoon.on;
  F.uPuff.value.forEach((v, i) => { const p = sim.puffs[i]; if (p) { v.set(p.x, p.y, p.r, 1); F.uPuffV.value[i].set(p.vx, p.vy); } else v.set(0, 0, 0, 0); });
  sim.puffs.length = 0;
  pass(M.force, vel.write); vel.swap();
  U(M.div, 'uVel', vel.read.texture); pass(M.div, divRT);
  M.jacobi.uniforms.uDiv.value = divRT.texture;
  for (let i = 0; i < sim.iters; i++) { M.jacobi.uniforms.uP.value = prs.read.texture; pass(M.jacobi, prs.write); prs.swap(); }
  U(M.grad, 'uP', prs.read.texture); U(M.grad, 'uVel', vel.read.texture); pass(M.grad, vel.write); vel.swap();
  U(M.advV, 'uVel', vel.read.texture); U(M.advV, 'uDt', dt); U(M.advV, 'uDiss', Math.exp(-dt * (sim.spoon.on ? 0.3 : 0.18)));
  pass(M.advV, vel.write); vel.swap();
  const D = M.advD.uniforms;
  D.uVel.value = vel.read.texture; D.uDye.value = dye.read.texture; D.uDt.value = dt;
  D.uRelax.value = 1 - Math.exp(-dt * (0.025 + 2.6 * sim.energy));
  D.uC.value = cup.c; D.uTarget.value = sim.target;
  D.uInj.value = 0.35; D.uCore.value = sim.src[0].a > 0 ? 9 * clamp(sim.src[0].a / 2.2, 0, 1) : 0;
  D.uDrop.value.forEach((v, i) => { const d = sim.drops[i]; if (d) v.set(d.x, d.y, d.r, d.k); else v.set(0, 0, 0, 0); });
  sim.drops.length = 0;
  pass(M.advD, dye.write); dye.swap();
  renderer.setRenderTarget(null); renderer.autoClear = ac;
}

/* ---------- The surface of the coffee ---------- */

const liquidMat = new P({ color: 0xffffff, roughness: 0.06, metalness: 0, specularIntensity: 0, envMap: envDark, envMapIntensity: 1.0 });
const LQ = {
  uDye: { value: dye.read.texture }, uDyeTexel: { value: 1 / ND }, uTime: { value: 0 }, uRip: { value: 0.0 }, uRadius: { value: 3 },
  uImp: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, -99, 0)) }, uStream: { value: new THREE.Vector3() },
  uWin: { value: new THREE.Vector4(WIN.x0, WIN.x1, WIN.y0, WIN.y1) }, uWinBars: { value: new THREE.Vector4(WIN.mx, WIN.by, WIN.by2, WIN.hw) }, uWinZ: { value: WIN.z }, uWinFacade: { value: WIN.facade },
  uCupC: { value: new THREE.Vector3() }, uRimR: { value: 3.6 }, uBub: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) },
  uSunDir: { value: SUN.clone() },
};
liquidMat.onBeforeCompile = (sh) => {
  Object.assign(sh.uniforms, LQ);
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vDisc; varying vec3 vWP;')
    .replace('#include <fog_vertex>', '#include <fog_vertex>\nvDisc = uv; vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec2 vDisc; varying vec3 vWP;
uniform sampler2D uDye; uniform float uDyeTexel, uTime, uRip, uRadius, uWinZ, uWinFacade, uRimR;
uniform vec4 uImp[4]; uniform vec3 uStream; uniform vec4 uWin, uWinBars; uniform vec3 uCupC; uniform vec4 uBub[16]; uniform vec3 uSunDir;
${KM_GLSL}
float hgt(vec2 uv) {
  vec2 p = (uv - 0.5) * 2.0 * uRadius;
  float h = uRip * (0.55 * sin(dot(p, vec2(1.9, 1.1)) + uTime * 3.3) + 0.45 * sin(dot(p, vec2(-1.3, 2.2)) + uTime * 2.6)
    + 0.32 * sin(dot(p, vec2(3.1, -1.7)) - uTime * 5.1) + 0.22 * sin(dot(p, vec2(-4.1, -2.6)) + uTime * 6.3));
  for (int i = 0; i < 4; i++) {
    vec4 I = uImp[i]; float age = uTime - I.z;
    if (I.w <= 0.0 || age < 0.0 || age > 3.0) continue;
    float r = length(p - (I.xy - 0.5) * 2.0 * uRadius), front = 0.4 + age * 13.0;
    h += I.w * exp(-age * 1.5) * sin(r * 8.5 - age * 36.0) * smoothstep(front + 0.6, front - 0.6, r) * exp(-r * 0.3);
  }
  if (uStream.z > 0.0) { vec2 dp = p - (uStream.xy - 0.5) * 2.0 * uRadius; float r = length(dp), th = atan(dp.y, dp.x);
    h += uStream.z * (sin(r * 11.0 - uTime * 31.0 + 1.5 * sin(th * 3.0 + uTime * 5.0)) * 0.6 + sin(r * 7.0 - uTime * 23.0 + th * 2.0) * 0.4) * exp(-r * 1.5) * smoothstep(0.0, 0.4, r);
    h -= uStream.z * 28.0 * exp(-r * r / 0.09);                                  // the dimple where it goes in
    h += uStream.z * 9.0 * exp(-pow((r - 0.42) / 0.12, 2.0)); }                  // and the little ring it pushes up
  return h;
}
vec3 windowRad(vec3 P, vec3 R, out float hit) {
  hit = 0.0;
  if (R.z > -0.02) return vec3(0.0);
  float t = (uWinZ - P.z) / R.z; vec3 H = P + R * t;
  float fr = 8.0, aa = 0.9 + t * 0.004;
  float outer = smoothstep(uWin.x - fr - aa, uWin.x - fr + aa, H.x) * smoothstep(uWin.y + fr + aa, uWin.y + fr - aa, H.x)
              * smoothstep(uWin.z - fr - aa, uWin.z - fr + aa, H.y) * smoothstep(uWin.w + fr + aa, uWin.w + fr - aa, H.y);
  if (outer <= 0.0) return vec3(0.0);
  float open = smoothstep(uWin.x - aa, uWin.x + aa, H.x) * smoothstep(uWin.y + aa, uWin.y - aa, H.x)
             * smoothstep(uWin.z - aa, uWin.z + aa, H.y) * smoothstep(uWin.w + aa, uWin.w - aa, H.y);
  float hw = uWinBars.w;
  // a window of small panes: glazing bars every 46 cm across and 58 cm up, from the mullion and the transom
  float bx = abs(fract((H.x - uWinBars.x) / 46.0 + 0.5) - 0.5) * 46.0, by = abs(fract((H.y - uWinBars.y) / 58.0 + 0.5) - 0.5) * 58.0;
  float bars = max(1.0 - smoothstep(hw - aa, hw + aa, bx), 1.0 - smoothstep(hw - aa, hw + aa, by));
  float sky = smoothstep(uWinFacade - 1.0, uWinFacade + 30.0, H.y);
  vec3 pane = mix(vec3(0.96, 0.93, 0.88) * 2.4, vec3(0.97, 0.99, 1.02) * 8.0, sky) * (0.85 + 0.15 * smoothstep(uWin.w, uWin.z, H.y));
  // the glass shows a hint of the sash beyond it
  vec3 wood = vec3(0.06, 0.045, 0.032);
  vec3 c = mix(wood, pane, open * (1.0 - bars));
  hit = outer;
  return c;
}
`)
    .replace('#include <color_fragment>', `#include <color_fragment>
float mL = texture2D(uDye, vDisc).r;
float e = uDyeTexel * 2.0;
float gx = texture2D(uDye, vDisc + vec2(e, 0.0)).r - texture2D(uDye, vDisc - vec2(e, 0.0)).r;
float gy = texture2D(uDye, vDisc + vec2(0.0, e)).r - texture2D(uDye, vDisc - vec2(0.0, e)).r;
float relief = clamp(1.0 + (-gx * 0.55 + gy * 0.85) * 1.6, 0.8, 1.2);
float rr = length(vDisc * 2.0 - 1.0);
diffuseColor.rgb = km(clamp(mL, 0.0, 1.0)) * relief;
diffuseColor.rgb *= mix(1.0, 0.9, smoothstep(0.8, 1.0, rr));`)
    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
float he = 0.0025;
vec2 dh = vec2(hgt(vDisc + vec2(he, 0.0)) - hgt(vDisc - vec2(he, 0.0)), hgt(vDisc + vec2(0.0, he)) - hgt(vDisc - vec2(0.0, he))) / (2.0 * he);
vec3 nW = normalize(vec3(-dh.x / (2.0 * uRadius), 1.0, dh.y / (2.0 * uRadius)));
normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);`)
    .replace('#include <opaque_fragment>', `
{
  vec3 V = normalize(cameraPosition - vWP);
  float NdV = clamp(dot(nW, V), 0.0, 1.0);
  float F = 0.02 + 0.98 * pow(1.0 - NdV, 5.0);
  vec3 Rw = reflect(-V, nW);
  vec3 refl = getIBLRadiance(geometryViewDir, normal, 0.03) * 0.9;
  float wh; vec3 wr = windowRad(vWP, Rw, wh);
  refl = mix(refl, wr, wh);
  // the inside of the cup above the coffee, mirrored near its far edge
  vec2 o = vWP.xz - uCupC.xy, d = Rw.xz;
  float A = dot(d, d), B = 2.0 * dot(o, d), Cc = dot(o, o) - uRimR * uRimR;
  float tw = (-B + sqrt(max(B * B - 4.0 * A * Cc, 0.0))) / (2.0 * A + 1e-5);
  float yh = vWP.y + Rw.y * tw;
  if (yh < uCupC.z) {
    vec2 hn = normalize(-(o + d * tw));
    float lit = 0.32 + 0.68 * smoothstep(-0.2, 0.6, dot(hn, -normalize(uSunDir.xz))) * smoothstep(uCupC.z - 1.2, uCupC.z - 0.1, yh);
    vec3 wall = vec3(0.7, 0.66, 0.6) * lit * 1.4;
    refl = mix(refl, wall, smoothstep(uCupC.z, uCupC.z - 0.06, yh));
  }
  outgoingLight = outgoingLight * (1.0 - F) + F * refl * ${q.has('norefl') ? '0.0' : '1.0'};   // a reflection only adds light
  // dark coffee is amber where it is thin: at the edge, against the white
  float band = smoothstep(0.935, 0.992, rr);
  float dark = 1.0 - smoothstep(0.03, 0.28, mL);
  vec3 amber = vec3(0.34, 0.12, 0.03) * (0.55 + 0.6 * smoothstep(-0.3, 0.7, dot(-normalize(vDisc * 2.0 - 1.0 + 1e-4), normalize(vec2(uSunDir.x, -uSunDir.z)))));
  outgoingLight = mix(outgoingLight, amber, band * dark * 0.85);
  outgoingLight += vec3(0.11, 0.1, 0.09) * smoothstep(0.982, 0.997, rr) * (0.4 + 0.6 * dark);
  // a few small bubbles at the rim
  for (int i = 0; i < 16; i++) {
    vec4 b = uBub[i]; if (b.w <= 0.0) continue;
    vec2 q2 = (vDisc - b.xy) * 2.0 * uRadius / b.z;
    float r = length(q2); if (r > 1.25) continue;
    float body = 1.0 - smoothstep(0.8, 1.0, r);
    float rimB = smoothstep(0.45, 0.9, r) * body;
    float spec = 1.0 - smoothstep(0.0, 0.32, length(q2 - vec2(-0.32, 0.36)));
    vec3 amberB = vec3(0.32, 0.13, 0.04) * (0.35 + 0.65 * (1.0 - smoothstep(0.03, 0.3, mL)));
    outgoingLight = mix(outgoingLight, amberB, rimB * b.w * 0.7);
    outgoingLight = mix(outgoingLight, outgoingLight * 0.55, (1.0 - smoothstep(0.95, 1.2, r)) * smoothstep(0.85, 1.0, r) * b.w * 0.6);
    outgoingLight += vec3(0.9, 0.75, 0.55) * spec * b.w * 0.6;
  }
}
#include <opaque_fragment>`);
};
// milky coffee scatters light inside it, so the wall's hard sun shadow does not lie on it as on a solid: no shadow map here
const liquid = mesh(new THREE.CircleGeometry(1, 160).rotateX(-Math.PI / 2), liquidMat, false, false);
scene.add(liquid);

/* ---------- The stream, and drops ---------- */

const streamMilk = new P({ color: new THREE.Color(0xf3efe6), roughness: 0.14, clearcoat: 0.3, clearcoatRoughness: 0.1, sheen: 0.5, sheenColor: new THREE.Color(1, 0.98, 0.94), sheenRoughness: 0.5 });
streamMilk.onBeforeCompile = (sh) => {
  sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `
    outgoingLight += vec3(0.09, 0.085, 0.078) + diffuseColor.rgb * 0.12 * pow(1.0 - abs(dot(normal, geometryViewDir)), 2.0);
    #include <opaque_fragment>`);
};
const streamCoffee = new P({ color: new THREE.Color(0.012, 0.005, 0.002), roughness: 0.08, specularIntensity: 0.5, envMapIntensity: 0.45 });
streamCoffee.onBeforeCompile = (sh) => {
  sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `
    float thin = pow(1.0 - abs(dot(normal, geometryViewDir)), 1.6);
    outgoingLight += vec3(0.36, 0.13, 0.03) * pow(thin, 1.6) * 0.8 + vec3(0.012, 0.004, 0.001);
    #include <opaque_fragment>`);
};
const SR = 24, SA = 14;
const streamGeo = new THREE.BufferGeometry();
{
  const pos = new Float32Array((SR + 1) * (SA + 1) * 3), nor = new Float32Array(pos.length), idx = [];
  for (let i = 0; i < SR; i++) for (let j = 0; j < SA; j++) { const a = i * (SA + 1) + j, b = a + SA + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  streamGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  streamGeo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  streamGeo.setIndex(idx);
}
const stream = mesh(streamGeo, streamMilk, true, false);
stream.frustumCulled = false; stream.visible = false;
scene.add(stream);
const dropGeo = new THREE.SphereGeometry(1, 20, 14);
const dropPool = Array.from({ length: 8 }, () => { const m = mesh(dropGeo, streamMilk, true, false); m.visible = false; scene.add(m); return m; });

/* ---------- The cup's state ---------- */

const MAX_ML = 156;
const cup0 = { mokka: 40, milk: 0 };
cup.mokka = 40; cup.milk = 0; cup.c = 0; cup.unmix = 0;
const level = { y: 0, r: 0 };
function setLevel() {
  const L = levelFor(cup.mokka + cup.milk);
  level.y = CUP.y + L.y; level.r = L.r;
  liquid.position.set(CUP.x, level.y, CUP.z);
  liquid.scale.set(level.r + 0.012, 1, level.r + 0.012);
  LQ.uRadius.value = level.r;
  LQ.uCupC.value.set(CUP.x, CUP.z, CUP.y + lerp(L.y, BRIM_Y, +(q.get('wallk') || 0.86)));
  LQ.uRimR.value = (level.r + CUPDIM.rt * CUPS) / 2;
  cup.c = cup.milk / Math.max(1e-6, cup.milk + cup.mokka);
}
// world xz to the fluid's uv, and back
const toUV = (x, z) => [0.5 + (x - CUP.x) / (2 * level.r), 0.5 - (z - CUP.z) / (2 * level.r)];
const fromUV = (u, v) => [CUP.x + (u - 0.5) * 2 * level.r, CUP.z - (v - 0.5) * 2 * level.r];

const bubbles = Array.from({ length: 16 }, () => ({ x: 0, y: 0, r: 0, life: 0, age: 0 }));
let bubAt = 0;
function addBubbles(n, life = 20) {
  for (let i = 0; i < n; i++) {
    const b = bubbles[bubAt]; bubAt = (bubAt + 1) % bubbles.length;
    const a = rr(0, TAU), rad = rr(0.86, 0.94);
    b.x = 0.5 + Math.cos(a) * rad * 0.5; b.y = 0.5 + Math.sin(a) * rad * 0.5;
    b.r = rr(0.02, 0.055); b.life = life * rr(0.6, 1.0); b.age = 0;
  }
}
let impAt = 0;
function ripple(u, v, amp) { const I = LQ.uImp.value[impAt]; impAt = (impAt + 1) % 4; I.set(u, v, LQ.uTime.value, amp); }

/* ---------- Pouring ---------- */

const G = 981;   // cm/s²
function makeVessel(obj, at, kind) {
  const v = { obj, kind, at: at.clone(), k: 0, held: false, flowT: 0, flowing: false, q: 0, dropT: 0, tail: 0, minUntil: 0 };
  // standing: its spout turned toward the cup
  const to = V3(CUP.x - at.x, 0, CUP.z - at.z).normalize();
  const sd = obj.userData.spoutDir.clone(); sd.y = 0; sd.normalize();
  const yaw = Math.atan2(-to.z, to.x) - Math.atan2(-sd.z, sd.x);
  v.restQ = new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), yaw);
  v.restP = at.clone();
  v.dirH = to;                      // from the vessel toward the cup
  v.tilt = kind === 'milk' ? 0.98 : 0.72;
  obj.position.copy(v.restP); obj.quaternion.copy(v.restQ);
  // pouring: tipped about the axis across the spout, its spout over the near side of the cup
  const axis = V3(-to.z, 0, to.x);  // horizontal, across
  v.pourQ = new THREE.Quaternion().setFromAxisAngle(axis, -v.tilt).multiply(v.restQ);
  return v;
}
const vessels = { milk: makeVessel(jug, JUG_AT, 'milk') };
function pourPose(v) {
  // aim: the stream should go in about a third of the way from the center toward the vessel
  const S = v.obj.userData.spout.clone().applyQuaternion(v.pourQ);
  const aimXZ = V3(CUP.x, 0, CUP.z).addScaledVector(v.dirH, -level.r * 0.3);
  const top = CUP.y + BRIM_Y + 2.8;
  // the stream leaves with some speed along the spout; go back by how far it carries
  const fall = top - level.y, t = Math.sqrt((2 * fall) / G), carry = 24 * t;
  const tip = V3(aimXZ.x, top, aimXZ.z).addScaledVector(v.dirH, -carry);
  return tip.sub(S);
}
function spoutWorld(v) { return v.obj.userData.spout.clone().applyMatrix4(v.obj.matrixWorld); }
function spoutDirWorld(v) { return v.obj.userData.spoutDir.clone().applyQuaternion(v.obj.quaternion).normalize(); }

function hold(kind, on) {
  const v = vessels[kind];
  if (making.on) return;              // it is being made: hands off
  if (on) {
    if (state !== 'play') return;
    if (cup.mokka + cup.milk >= MAX_ML - 0.05) { say('The cup is full.'); return; }
    if (stir.active) return;
    v.held = true; v.tap = true;     // a press always gives at least a few drops
    unfreeze();
  } else v.held = false;
  syncButtons();
}

function updateVessel(v, dt) {
  const TL = reduced ? 0.42 : 0.55;
  const wants = v.held || v.tap;
  const prevK = v.k;
  if (wants) v.k = Math.min(1, v.k + dt / TL); else if (!v.flowing && v.tail <= 0) v.k = Math.max(0, v.k - dt / (TL * 1.1));
  if (v.k !== prevK) { moved = true; v.target = v.target || pourPose(v); }
  { const up = v.k > 0; if (up !== pourFrame && !cardState.goal) { pourFrame = up; setFrame(false); } }
  if (v.k === 0) v.target = null;
  // pose: lift, carry over, then tip
  const e = ease(v.k);
  const tilt = sstep(0.4, 1.0, v.k);
  const tgt = v.target || pourPose(v);
  v.obj.position.lerpVectors(v.restP, tgt, e);
  v.obj.position.y += Math.sin(Math.PI * Math.min(1, v.k * 1.15)) * 3.2;
  v.obj.quaternion.copy(v.restQ).slerp(v.pourQ, tilt);
  v.obj.updateMatrixWorld(true);
  placeJugMilk();
  const blobK = 1 - sstep(0.0, 0.25, v.k);
  jugBlob.setOpacity(jugBlob.userData.base * blobK);

  // flow: in the pose, first a few drops, then a stream that builds
  if (v.k >= 1 && (v.held || v.flowing)) {
    if (!v.flowing) { v.flowing = true; v.flowT = 0; v.dropT = 0.03; }
    if (frozen) return;
    v.flowT += dt;
    if (cup.mokka + cup.milk >= MAX_ML) { v.held = false; say('The cup is full.'); syncButtons(); }
    if (v.flowT < 0.26) {
      v.q = 0;
      v.dropT -= dt;
      if (v.dropT <= 0 && (v.held || v.flowT < 0.22)) { spawnDrop(v); v.dropT = 0.085; }
      if (v.flowT >= 0.2) v.tap = false;
    } else {
      v.q = v.held ? (making.on ? making.rate : 14) * sstep(0.26, 0.95, v.flowT) : 0;
    }
    if (!v.held && v.flowT >= 0.22) { v.flowing = false; v.tap = false; v.tail = v.q > 0 ? 0.14 : 0; }
  } else if (v.flowing && v.k < 1) v.flowing = false;
  if (v.tail > 0) v.tail -= dt;
}

const drops = [];
function spawnDrop(v) {
  const S = spoutWorld(v), dir = spoutDirWorld(v);
  const m = dropPool.find((d) => !d.visible); if (!m) return;
  m.visible = true; m.material = v.kind === 'milk' ? streamMilk : streamCoffee;
  drops.push({ m, p: S.clone(), vel: V3(dir.x, 0, dir.z).normalize().multiplyScalar(9).add(V3(0, -2, 0)), kind: v.kind, t: 0 });
}
function updateDrops(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.t += dt; d.vel.y -= G * dt; d.p.addScaledVector(d.vel, dt);
    const r = 0.46, stretch = 1 + Math.min(0.6, -d.vel.y / 400);
    d.m.position.copy(d.p);
    d.m.scale.set(r / Math.sqrt(stretch), r * stretch, r / Math.sqrt(stretch));
    // grows from the lip during its first instant
    if (d.t < 0.05) d.m.scale.multiplyScalar(0.4 + 12 * d.t);
    if (d.p.y <= level.y) {
      d.m.visible = false; drops.splice(i, 1);
      const [u, w] = toUV(d.p.x, d.p.z);
      addLiquid(d.kind, making.on ? Math.min(0.4, Math.max(0, making.target - cup.milk)) : 0.4);
      sim.drops.push({ x: u, y: w, r: 0.035, k: 0.95 });
      puffAround(u, w, 2, 0.04, 0.6);
      const s = sim.src[1 + (sim.dropAt = ((sim.dropAt || 0) + 1) % 3)];
      Object.assign(s, { x: u, y: w, r: 0.075, a: 1.6, life: 1 });
      sim.target = d.kind === 'milk' ? 1 : 0;
      ripple(u, w, 0.016);
      addBubbles(1, 14);
      cup.lastPour = d.kind;
    }
  }
}
function addLiquid(kind, ml) {
  const room = MAX_ML - (cup.mokka + cup.milk);
  ml = Math.max(0, Math.min(ml, room));
  if (ml <= 0) return;
  const before = cup.c;
  cup[kind] += ml;
  setLevel();
  // how far from even the cup now is: new liquid of another color, in proportion
  const differs = Math.abs((kind === 'milk' ? 1 : 0) - before);
  cup.unmix = clamp(cup.unmix + (ml / (cup.mokka + cup.milk)) * differs * 6, 0, 1);
  updateCaption();
}

// the stream's shape: from the spout, falling, thinning as it speeds up
const tmpA = V3(), tmpB = V3();
function updateStream(dt, v) {
  const active = v && (v.q > 0 || v.tail > 0);
  stream.visible = !!active;
  LQ.uStream.value.z = 0;
  if (!active) return;
  stream.material = v.kind === 'milk' ? streamMilk : streamCoffee;
  const S = spoutWorld(v), dir = spoutDirWorld(v);
  const Q = Math.max(v.q, 2);
  const v0 = 16 + 10 * clamp(Q / 14, 0, 1);
  const vh = V3(dir.x, 0, dir.z).normalize().multiplyScalar(v0 * Math.hypot(dir.x, dir.z));
  const vy0 = v0 * dir.y * 0.4;
  const fall = S.y - level.y + 0.6;
  const tEnd = (vy0 + Math.sqrt(vy0 * vy0 + 2 * G * fall)) / G;
  const r0 = Math.sqrt(Q / (Math.PI * v0)) * 1.05;
  const pos = streamGeo.attributes.position.array, nor = streamGeo.attributes.normal.array;
  const T = LQ.uTime.value;
  // the tail: when the pour stops, the stream lets go at the top and falls
  const cut = v.tail > 0 && v.q === 0 ? clamp(1 - v.tail / 0.14, 0, 1) : 0;
  let prev = null;
  for (let i = 0; i <= SR; i++) {
    const s = cut + (1 - cut) * (i / SR), t = s * tEnd;
    const P0 = tmpA.copy(S).addScaledVector(vh, t); P0.y += vy0 * t - 0.5 * G * t * t;
    const sp = Math.hypot(vh.length(), vy0 - G * t);
    const wob = 0.06 * s * s + 0.012 * s;
    P0.x += Math.sin(T * 23 + s * 9) * wob; P0.z += Math.cos(T * 19 + s * 7) * wob;
    const rad = r0 * Math.sqrt(v0 / sp) * (i === 0 ? 0.92 : 1);
    const tan = V3(vh.x, vy0 - G * t, vh.z).normalize();
    const nx = V3().crossVectors(tan, V3(0, 0, 1)); if (nx.lengthSq() < 1e-4) nx.set(1, 0, 0); nx.normalize();
    const ny = V3().crossVectors(tan, nx).normalize();
    for (let j = 0; j <= SA; j++) {
      const th = (j / SA) * TAU, c = Math.cos(th), sn = Math.sin(th);
      const k = (i * (SA + 1) + j) * 3;
      const nn = tmpB.copy(nx).multiplyScalar(c).addScaledVector(ny, sn);
      pos[k] = P0.x + nn.x * rad; pos[k + 1] = P0.y + nn.y * rad; pos[k + 2] = P0.z + nn.z * rad;
      nor[k] = nn.x; nor[k + 1] = nn.y; nor[k + 2] = nn.z;
    }
    prev = P0;
  }
  streamGeo.attributes.position.needsUpdate = true; streamGeo.attributes.normal.needsUpdate = true;
  // where it goes in
  const tHit = (vy0 + Math.sqrt(vy0 * vy0 + 2 * G * (S.y - level.y))) / G;
  const hx = S.x + vh.x * tHit, hz = S.z + vh.z * tHit;
  const [u, w] = toUV(hx, hz);
  if (v.q > 0) {
    if (!frozen) addLiquid(v.kind, making.on ? Math.min(v.q * dt, Math.max(0, making.target - cup.milk)) : v.q * dt);
    const s0 = sim.src[0];
    s0.x = u; s0.y = w;
    s0.r = lerp(s0.r, 0.2 + 0.05 * Math.sin(T * 0.7), 0.05);
    s0.a = lerp(s0.a, 1.2 * clamp(v.q / 14, 0, 1), 1 - Math.exp(-dt * 4));
    sim.target = v.kind === 'milk' ? 1 : 0;
    LQ.uStream.value.set(u, w, 0.0022 * clamp(v.q / 14, 0, 1));
    simPour(u, w, clamp(v.q / 14, 0, 1), Math.min(dt, 1 / 30));
    sim.upwell = 1;
    cup.lastPour = v.kind;
    cup.pourAge = 0;
  }
}

/* ---------- Stirring ---------- */

const stir = { active: false, auto: false, k: 0, x: 0, z: 0, tx: 0, tz: 0, px: 0, pz: 0, autoT: 0, autoDur: 0, keys: false };
const SPOON_STIR_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.7, 1.05, 'YZX'));
function stirTo(x, z) {
  const dx = x - CUP.x, dz = z - CUP.z, d = Math.hypot(dx, dz), lim = Math.max(0.3, level.r - 1.0);
  if (d > lim) { x = CUP.x + (dx / d) * lim; z = CUP.z + (dz / d) * lim; }
  stir.tx = x; stir.tz = z;
}
function updateSpoon(dt) {
  const goal = stir.active ? 1 : 0;
  const prevK = stir.k;
  stir.k = goal ? Math.min(1, stir.k + dt / 0.32) : Math.max(0, stir.k - dt / 0.4);
  if (stir.auto) {
    stir.autoT += dt;
    const turns = 3, f = clamp(stir.autoT / stir.autoDur, 0, 1);
    const a = ease(f) * turns * TAU + 0.8, rad = (level.r - 1.1) * (0.55 + 0.35 * Math.sin(f * Math.PI));
    stirTo(CUP.x + Math.cos(a) * rad, CUP.z + Math.sin(a) * rad);
    if (f >= 1) { stir.auto = false; stir.active = false; stir.done && stir.done(); stir.done = null; }
  } else if (stir.keys) {
    stir.autoT += dt;
    const a = stir.autoT * 4.2, rad = (level.r - 1.1) * 0.7;
    stirTo(CUP.x + Math.cos(a) * rad, CUP.z + Math.sin(a) * rad);
  }
  if (stir.k <= 0 && prevK <= 0) { sim.spoon.on = 0; return; }
  moved = true;
  const px = stir.x, pz = stir.z;
  const kf = 1 - Math.exp(-dt * 22);
  if (stir.k < 1 && goal) { stir.x = stir.tx; stir.z = stir.tz; } else { stir.x += (stir.tx - stir.x) * kf; stir.z += (stir.tz - stir.z) * kf; }
  const vx = (stir.x - px) / Math.max(dt, 1e-3), vz = (stir.z - pz) / Math.max(dt, 1e-3);
  // pose: from the saucer, up and over, into the cup
  const e = ease(stir.k);
  const inCup = V3(stir.x, level.y - 1.25, stir.z);
  const p = V3().lerpVectors(SPOON_REST.p, inCup, e); p.y += Math.sin(Math.PI * e) * 6;
  spoon.position.copy(p);
  const lean = new THREE.Quaternion().setFromEuler(new THREE.Euler(clamp(-vz * 0.006, -0.18, 0.18), 0, clamp(vx * 0.006, -0.18, 0.18)));
  spoon.quaternion.copy(SPOON_REST.q).slerp(lean.multiply(SPOON_STIR_Q), e);
  spoonBlobs.forEach((b) => { b.visible = stir.k < 0.05; });
  if (stir.k >= 1) {
    const [u, w] = toUV(stir.x, stir.z);
    sim.spoon.x = u; sim.spoon.y = w;
    sim.spoon.vx = (vx / (2 * level.r)) * (1 / 1); sim.spoon.vy = (-vz / (2 * level.r));
    sim.spoon.on = 1;
    const sp = Math.hypot(vx, vz);
    sim.energy = Math.min(3, sim.energy + sp * dt * 0.05);
    LQ.uRip.value = Math.max(LQ.uRip.value, Math.min(0.02, sp * 0.0006));
    unfreeze();
  } else sim.spoon.on = 0;
}

/* ---------- The card comes to the table ---------- */

const cardState = { k: 0, goal: 0, marker: -1, markerT: 0, markerFrom: 0, markerTo: 0, markerK: 1 };
function orient() { return camera.aspect < 0.95 ? 'port' : 'land'; }
function placeCard() {
  const P0 = CARD_POSE[orient()];
  const e = reduced ? (cardState.goal ? 1 : 0) : easeOut(cardState.k);
  cardGroup.position.lerpVectors(P0.from, P0.p, e);
  cardGroup.rotation.y = P0.ry + (1 - e) * 0.25;
  cardGroup.visible = e > 0.001;
}
function placeRing(dt) {
  if (cardState.marker < 0) { ring.visible = false; return; }
  ring.visible = true;
  const m = cardState;
  if (m.markerK < 1) {
    // it moves down the swatches one by one, with a small pause on each, and settles
    const steps = Math.max(1, m.markerTo - m.markerFrom);
    m.markerK = reduced ? 1 : Math.min(1, m.markerK + dt / (0.3 + 0.24 * steps));
    moved = true;
  }
  const f = m.markerK, steps = m.markerTo - m.markerFrom;
  const s = m.markerFrom + steps * (f < 1 ? (Math.floor(f * steps) + ease(clamp((f * steps) % 1, 0, 1))) / Math.max(1, steps) : 1);
  const i0 = Math.floor(s), i1 = Math.min(8, i0 + 1), fr = s - i0;
  const a = swatchLocal(i0), b = swatchLocal(i1);
  ring.position.lerpVectors(a, b, fr);
  ring.position.y = 0.12 + (f < 1 ? 0.12 * Math.sin(fr * Math.PI) : 0);
  if (f >= 1 && m.done) { const d = m.done; m.done = null; d(); }
}

/* ---------- The camera ---------- */

const cam = { from: null, to: null, k: 1, cur: null };
// On a desktop window the framing is fitted, not fixed: the whole tray (and at the reveal the whole card) must be
// in the picture, clear of the words, whatever the window's shape. Points are projected and the camera is moved
// back until they fit, then the picture is shifted so they sit in the free part of the window.
let jugPourBox = null;
function framePoints(kind) {
  const pts = [];
  for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU; pts.push(V3(TRAY.x + Math.cos(a) * (TRAY.a + 0.4), 0, TRAY.z + Math.sin(a) * (TRAY.b + 0.4))); pts.push(V3(TRAY.x + Math.cos(a) * TRAY.a, 1.2, TRAY.z + Math.sin(a) * TRAY.b)); }
  if (kind === 'pour') {
    if (!jugPourBox) {
      const v = vessels.milk, P0 = jug.position.clone(), Q0 = jug.quaternion.clone();
      jug.position.copy(pourPose(v)); jug.quaternion.copy(v.pourQ); jug.updateMatrixWorld(true);
      jugPourBox = new THREE.Box3().setFromObject(jug).expandByScalar(0.6);
      jug.position.copy(P0); jug.quaternion.copy(Q0); jug.updateMatrixWorld(true);
    }
    const B = jugPourBox;
    for (const x of [B.min.x, B.max.x]) for (const y of [B.min.y, B.max.y]) for (const z of [B.min.z, B.max.z]) pts.push(V3(x, y, z));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; pts.push(V3(GLASS_AT.x + Math.cos(a) * 3, TRAY_Y + 8.6, GLASS_AT.z + Math.sin(a) * 3)); }
  } else if (kind === 'reveal') {
    const P0 = CARD_POSE.land, c = Math.cos(P0.ry), sn = Math.sin(P0.ry);
    for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const lx = x * (CARD.w / 2 + 0.4), lz = z * (CARD.h / 2 + 0.4); pts.push(V3(P0.p.x + lx * c + lz * sn, 0.1, P0.p.z - lx * sn + lz * c)); }
  }
  return pts;
}
function fitFrame(kind, aspect) {
  const f = FRAMES.land[kind === 'pour' ? 'play' : kind], W = innerWidth, H = innerHeight;
  // the free part of the window, in NDC: a small margin all round (the tray may run under the bar's corners);
  // at the reveal, left of the result card and under the nav
  const left = Math.max(16, W * 0.035), top = kind === 'reveal' ? Math.max(64, H * 0.08) : H * 0.035, bottom = Math.max(14, H * 0.035);
  let right = Math.max(16, W * 0.035);
  if (kind === 'reveal') { const cw = Math.min(400, W - 32), rm = Math.max(20, W * 0.03); right = W - (W - rm - cw - 28); }
  let Rx0 = -1 + (2 * left) / W, Rx1 = 1 - (2 * right) / W;
  const Ry0 = -1 + (2 * bottom) / H, Ry1 = 1 - (2 * top) / H;
  // at the table the tray takes about two thirds of the width, no more: the cup stays the subject
  if (kind !== 'reveal') { const c = (Rx0 + Rx1) / 2, h = Math.min((Rx1 - Rx0) / 2, kind === 'pour' ? 0.62 : 0.68); Rx0 = c - h; Rx1 = c + h; }
  const el = THREE.MathUtils.degToRad(f.el), az = THREE.MathUtils.degToRad(f.az);
  const dir = V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const t = V3(CUP.x, CUP.y + 3, CUP.z);
  const cam = new THREE.PerspectiveCamera(f.fov, aspect, 1, 3000);
  const pts = framePoints(kind), pv = V3();
  let d = 70, bx0, bx1, by0, by1;
  for (let it = 0; it < 14; it++) {
    cam.position.copy(t).addScaledVector(dir, d); cam.lookAt(t); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    bx0 = by0 = 1e9; bx1 = by1 = -1e9;
    for (const p of pts) { pv.copy(p).project(cam); bx0 = Math.min(bx0, pv.x); bx1 = Math.max(bx1, pv.x); by0 = Math.min(by0, pv.y); by1 = Math.max(by1, pv.y); }
    const sc = Math.max((bx1 - bx0) / (Rx1 - Rx0), (by1 - by0) / (Ry1 - Ry0));
    d *= Math.pow(sc, 0.85);
  }
  const dx = (Rx0 + Rx1) / 2 - (bx0 + bx1) / 2;
  // at the table the tray sits low, so the room above it goes to the jug; at the reveal everything is centerd
  const dy = kind === 'reveal' ? (Ry0 + Ry1) / 2 - (by0 + by1) / 2 : Ry0 - by0;
  return { pos: cam.position.clone(), t, fov: f.fov, ox: -dx / 2, oy: dy / 2, d, kind };
}
let pourFrame = false;
function frameNow() {
  if (orient() === 'land' && !q.get('frame') && !q.has('zoom')) return fitFrame(cardState.goal ? 'reveal' : pourFrame ? 'pour' : 'play', camera.aspect);
  const o = orient(), f = q.get('frame') === 'spoon' ? { c: V3(-4.5, 1.2, 1.5), frac: 0.42, el: 32, az: 28, fov: 26, sx: 0, sy: 0 } : q.get('frame') === 'og' ? { c: V3(2.0, 5.0, -2.0), frac: +(q.get('ogf') || 0.25), el: +(q.get('oge') || 43), az: 10, fov: 24, sx: 0.0, sy: 0.12 } : q.has('zoom') ? { c: V3(0, 3, 0), frac: 0.72, el: 47, az: 9, fov: 26, sx: 0, sy: 0 } : FRAMES[o][cardState.goal ? 'reveal' : 'play'];
  return camFrom(f, camera.aspect);
}
function setFrame(snap) {
  const next = frameNow();
  if (snap || reduced || !cam.cur) { cam.cur = next; cam.k = 1; cam.from = next; cam.to = next; if (debug) setTimeout(() => console.log('016 tray share', trayShare(), innerWidth + 'x' + innerHeight, cardState.goal ? 'reveal' : pourFrame ? 'pour' : 'play'), 0); }
  else { cam.from = { ...cam.cur, pos: cam.cur.pos.clone(), t: cam.cur.t.clone() }; cam.to = next; cam.k = 0; }
  applyCam();
}
function trayShare() {
  let x0 = 1e9, x1 = -1e9; const pv = V3();
  for (let i = 0; i < 96; i++) { const a = (i / 96) * TAU; for (const y of [0, 1.2]) { pv.set(TRAY.x + Math.cos(a) * (TRAY.a + 0.15), y, TRAY.z + Math.sin(a) * (TRAY.b + 0.15)).project(camera); x0 = Math.min(x0, pv.x); x1 = Math.max(x1, pv.x); } }
  return +((x1 - x0) / 2).toFixed(3);
}
function applyCam() {
  const c = cam.cur;
  camera.position.copy(c.pos); camera.lookAt(c.t); camera.fov = c.fov;
  const w = innerWidth, h = innerHeight;
  camera.setViewOffset(w, h, c.ox * w, c.oy * h, w, h);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
}
function updateCam(dt) {
  if (cam.k >= 1) return;
  cam.k = Math.min(1, cam.k + dt / 1.3);
  const e = ease(cam.k), A = cam.from, B = cam.to;
  cam.cur = { pos: A.pos.clone().lerp(B.pos, e), t: A.t.clone().lerp(B.t, e), fov: lerp(A.fov, B.fov, e), ox: lerp(A.ox, B.ox, e), oy: lerp(A.oy, B.oy, e) };
  applyCam(); moved = true;
  if (debug && cam.k >= 1) console.log('016 tray share', trayShare(), innerWidth + 'x' + innerHeight, cardState.goal ? 'reveal' : pourFrame ? 'pour' : 'play');
}

/* ---------- Rendering ---------- */

let moved = true;
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const pr = renderer.getPixelRatio();
  mirror.rt.setSize(Math.round(w * pr * 0.35), Math.round(h * pr * 0.35));
  mirror.texel.value.set(1 / mirror.rt.width, 1 / mirror.rt.height);
  const W = Math.round(w * pr), H = Math.round(h * pr);
  post.main.setSize(W, H); post.main.depthTexture.image.width = W; post.main.depthTexture.image.height = H;
  post.half.setSize(Math.ceil(W / 2), Math.ceil(H / 2)); post.blur.setSize(Math.ceil(W / 2), Math.ceil(H / 2));
  postMat.down.uniforms.uTexel.value.set(1 / W, 1 / H);
  postMat.gather.uniforms.uTexel.value.set(1 / post.half.width, 1 / post.half.height);
  setFrame(true);
  placeCard();
  moved = true;
}
const mirrorPlane = new THREE.Plane(V3(0, 1, 0), -TRAY_Y);
const hideInMirror = () => [table, backdrop, tray.children[1], ...blobs];
function renderMirror() {
  // the camera seen in the plane y = TRAY_Y
  const c = mirror.cam;
  c.copy(camera);
  const P0 = camera.position.clone(); P0.y = 2 * TRAY_Y - P0.y;
  const look = V3(0, 0, -1).applyQuaternion(camera.quaternion); look.y = -look.y;
  const up = V3(0, 1, 0).applyQuaternion(camera.quaternion); up.y = -up.y;
  c.position.copy(P0); c.up.copy(up); c.lookAt(P0.clone().add(look));
  c.projectionMatrix.copy(camera.projectionMatrix); c.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
  c.updateMatrixWorld();
  mirror.mat.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
  const hidden = hideInMirror(); hidden.forEach((o) => { o.userData.wasVisible = o.visible; o.visible = false; });
  const bg = scene.background; scene.background = null;
  renderer.clippingPlanes = [mirrorPlane];
  renderer.setRenderTarget(mirror.rt);
  renderer.setClearColor(0x000000, 0); renderer.clear();
  renderer.render(scene, c);
  renderer.setRenderTarget(null);
  renderer.clippingPlanes = [];
  scene.background = bg;
  hidden.forEach((o) => { o.visible = o.userData.wasVisible; });
}
const noMirror = q.has('nomirror');
/* depth of field: the scene goes into a float target with its depth; a half-size copy carries each pixel's blur
   (circle of confusion); a gather blur that will not let a far thing spread over a nearer, sharper one; then the
   sharp and the blurred are mixed by blur size, tone-mapped and written out. */
const noDof = q.has('nodof');
const post = {
  main: new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4, depthTexture: new THREE.DepthTexture(4, 4) }),
  half: new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false }),
  blur: new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false }),
  focus: { value: 40 }, k: { value: 10 }, near: { value: camera.near }, far: { value: camera.far },
  aperture: 1, apertureGoal: 1, focusPoint: V3(),
};
const COC_GLSL = `
#include <packing>
uniform sampler2D tDepth; uniform float uFocus, uK, uNear, uFar;
float cocAt(vec2 uv) {
  float z = -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, uNear, uFar);
  return clamp(uK * (z - uFocus) / z, -uK, uK);
}`;
const postU = { tDepth: { value: post.main.depthTexture }, uFocus: post.focus, uK: post.k, uNear: post.near, uFar: post.far };
const NT = small ? 24 : 48;
const postMat = {
  down: new THREE.ShaderMaterial({ vertexShader: SIM_VS, depthTest: false, depthWrite: false,
    uniforms: { ...postU, tColor: { value: post.main.texture }, uTexel: { value: new THREE.Vector2() } },
    fragmentShader: `varying vec2 vUv; uniform sampler2D tColor; uniform vec2 uTexel;
${COC_GLSL}
void main() {
  vec2 o = uTexel * 0.5;
  vec3 c = 0.25 * (texture2D(tColor, vUv + vec2(-o.x, -o.y)).rgb + texture2D(tColor, vUv + vec2(o.x, -o.y)).rgb + texture2D(tColor, vUv + vec2(-o.x, o.y)).rgb + texture2D(tColor, vUv + vec2(o.x, o.y)).rgb);
  float k = min(min(cocAt(vUv + vec2(-o.x, -o.y)), cocAt(vUv + vec2(o.x, o.y))), cocAt(vUv));
  gl_FragColor = vec4(c / (1.0 + max(max(c.r, c.g), c.b) / 12.0), k);   // tame tiny hot glints before they are spread
}` }),
  gather: new THREE.ShaderMaterial({ vertexShader: SIM_VS, depthTest: false, depthWrite: false,
    uniforms: { tHalf: { value: post.half.texture }, uTexel: { value: new THREE.Vector2() }, uK: post.k },
    fragmentShader: `varying vec2 vUv; uniform sampler2D tHalf; uniform vec2 uTexel; uniform float uK;
void main() {
  vec4 C = texture2D(tHalf, vUv); float ac = abs(C.a);
  vec3 acc = C.rgb; float ws = 1.0;
  for (int i = 0; i < ${NT}; i++) {
    float rr = sqrt((float(i) + 0.5) / ${NT}.0), an = float(i) * 2.39996323;
    vec2 o = rr * uK * vec2(cos(an), sin(an));
    float r = length(o);
    vec4 S = texture2D(tHalf, vUv + o * uTexel);
    float sc = abs(S.a);
    if (S.a > C.a) sc = min(sc, ac + 1.0);      // a farther thing does not spread over a nearer, sharper one
    float w = clamp(sc - r + 1.0, 0.0, 1.0);
    acc += S.rgb * w; ws += w;
  }
  gl_FragColor = vec4(acc / ws, ac);
}` }),
  out: new THREE.ShaderMaterial({ vertexShader: SIM_VS, depthTest: false, depthWrite: false,
    uniforms: { ...postU, tColor: { value: post.main.texture }, tBlur: { value: post.blur.texture } },
    fragmentShader: `varying vec2 vUv; uniform sampler2D tColor, tBlur;
${COC_GLSL}
void main() {
  vec3 sharp = texture2D(tColor, vUv).rgb;
  vec4 B = texture2D(tBlur, vUv);
  float t = ${noDof ? '0.0' : 'smoothstep(0.35, 1.2, max(abs(cocAt(vUv)), B.a * 0.6))'};
  gl_FragColor = vec4(mix(sharp, B.rgb, t), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}` }),
};
function render() {
  if (moved) { renderer.shadowMap.needsUpdate = true; moved = false; }
  if (!noMirror) renderMirror();
  // focus: the cup (or the card, as it comes); blur scales with the picture
  camera.updateMatrixWorld();
  post.focus.value = -post.focusPoint.clone().applyMatrix4(camera.matrixWorldInverse).z;
  post.k.value = post.half.width * 0.0115 * post.aperture;
  renderer.setRenderTarget(post.main); renderer.render(scene, camera);
  const ac = renderer.autoClear; renderer.autoClear = false;
  pass(postMat.down, post.half);
  pass(postMat.gather, post.blur);
  pass(postMat.out, null);
  renderer.autoClear = ac;
}

/* ---------- Words ---------- */

const amountsEl = $('amounts'), hintEl = $('hint');
let hintText = '';
let sawFull = false;
function say(t) { if (t === 'The cup is full.') sawFull = true; if (t !== hintText) { hintText = t; hintEl.textContent = t || ' '; } }
function updateCaption() {
  amountsEl.textContent = `Mokka ${Math.round(cup.mokka)} ml · Milk ${Math.round(cup.milk)} ml`;
}
function syncButtons() {
  $('milkBtn').setAttribute('aria-pressed', String(vessels.milk.held));
}
function hintNow() {
  if (state !== 'play') return;
  if (cup.mokka + cup.milk >= MAX_ML - 0.05) return say('The cup is full.');
  if (vessels.milk.held) return say('Let go to stop pouring.');
  if (stir.active) return say('Stirring.');
  if (cup.unmix > 0.2) return say('Drag in the cup to stir, or leave it and watch.');
  if (cup.milk === 0) return say('Hold the jug to pour milk. A tap gives a few drops.');
  return say('More milk, more mokka, or say it is yours.');
}

/* ---------- The flow of a visit ---------- */

let state = 'intro';
// "Point at a color": the guest points, the waiter makes it. A fresh single mokka, milk poured to that shade, stirred.
const making = { on: false, target: 0, rate: 14 };
function setControls(on) { $('milkBtn').disabled = !on; $('mine').disabled = !on; }
const chainQ = (q.get('chain') || '').split(',').map(Number).filter((n) => n >= 1 && n <= 9);
function makeShade(i, instant) {
  sawFull = false;
  if (debug) console.log('016 make shade', i + 1);
  const c = SWATCH[i];
  let mokka = 40, milk = c > 0 ? (c * mokka) / (1 - c) : 0;
  if (mokka + milk > MAX_ML - 6) { const tot = MAX_ML - 6; mokka = tot * (1 - c); milk = tot * c; }   // only the palest would overflow
  stir.active = false; stir.auto = false; stir.keys = false; stir.done = null;
  vessels.milk.held = false; vessels.milk.tap = false;
  $('intro').hidden = true; $('result').hidden = true;
  document.body.classList.remove('waiting', 'revealed', 'busy-reveal');
  cardState.goal = 0; cardState.marker = -1; cardState.after = null; cardState.done = null; ring.visible = false;
  if (reduced || instant) { cardState.k = 0; placeCard(); }
  setFrame(!!instant || reduced);
  cup.mokka = mokka; cup.milk = 0; cup.unmix = 0; cup.lastPour = null;
  setLevel(); simReset(0);
  bubbles.forEach((b) => { b.life = 0; }); addBubbles(4, 26);
  state = 'play'; unfreeze(); updateCaption();
  if (milk <= 0) { mine(); return; }                        // the darkest: nothing to pour
  if (reduced || instant) {
    cup.milk = milk; setLevel(); simReset(cup.c); cup.unmix = 0; updateCaption();
    if (instant) reveal(true); else mine();
    return;
  }
  making.on = true; making.target = milk; making.rate = Math.max(14, milk / 3.4);
  document.body.classList.add('making'); setControls(false); say('\u00a0');
  vessels.milk.held = true; vessels.milk.tap = true; syncButtons();
}
function updateMaking() {
  if (!making.on) return;
  const v = vessels.milk;
  if (v.held && cup.milk >= making.target - 0.005) { v.held = false; syncButtons(); }
  if (!v.held && !v.flowing && v.k === 0 && drops.length === 0 && v.tail <= 0) {
    making.on = false; setControls(true);
    mine();
  }
}
let frozen = false;      // a review hook can hold the picture still until the first touch
function unfreeze() { frozen = false; }

function begin(ml) {
  if (ml && ml !== cup.mokka) { cup.mokka = ml; cup.milk = 0; cup.unmix = 0; setLevel(); simReset(0); }
  $('intro').hidden = true;
  document.body.classList.remove('waiting');
  state = 'play';
  updateCaption(); hintNow();
  canvas.focus({ preventScroll: true });
}
function mine() {
  if (state !== 'play') return;
  vessels.milk.held = false; vessels.milk.tap = false; syncButtons();
  state = 'stirring';
  document.body.classList.add('busy-reveal');
  const go = () => reveal(false);
  if (cup.unmix > 0.08) {
    say('A few turns with the spoon first.');
    stir.active = true; stir.auto = true; stir.autoT = 0; stir.autoDur = reduced ? 1.6 : 2.6;
    stir.x = stir.tx = CUP.x; stir.z = stir.tz = CUP.z - level.r * 0.4;
    stir.done = () => setTimeout(go, 250);
  } else go();
}
function reveal(instant) {
  state = 'reveal';
  document.body.classList.remove('making');
  document.body.classList.remove('busy-reveal');
  document.body.classList.add('revealed');
  const c = cup.c, nm = nameFor(c, cup.mokka), sw = swatchFor(c, nm.g);
  cardState.goal = 1;
  setFrame(instant);
  const after = () => {
    cardState.marker = 0; cardState.markerFrom = 0; cardState.markerTo = sw; cardState.markerK = instant || sw === 0 ? 1 : 0;
    const finish = () => {
      const key = GROUPS[nm.g].key, isNew = !named.has(key);
      named.add(key);
      if (!hooks) saveNamed();            // a review link does not write to the visitor's card
      $('resultName').textContent = nm.name;
      $('ask').textContent = `In Vienna, ask for a ${nm.name}. ${nm.says}`;
      const milkWords = cup.milk === 0 ? 'No milk.' : `About ${Math.round(c * 100)}% milk.`;
      $('facts').textContent = `${milkWords} · ${named.size} of 5 named`;
      const r = $('result'); r.hidden = false; r.classList.remove('enter'); void r.offsetWidth; r.classList.add('enter');
      if (isNew) writing = { gi: nm.g, t: instant || reduced ? 1 : 0 };
      drawCard();
      if (!instant) document.querySelector('.again').focus({ preventScroll: true });
      if (debug) {
        console.log('016 result', JSON.stringify({ name: nm.name, facts: $('facts').textContent, mokka: +cup.mokka.toFixed(2), milk: +cup.milk.toFixed(2), c: +cup.c.toFixed(4), swatch: sw + 1, sawFull }));
        // ?debug&chain=5,9,1: after each result, click the next shade on the result card, as a visitor would
        const next = chainQ.shift();
        if (next) setTimeout(() => { console.log('016 click result swatch', next); document.querySelectorAll('#result .swatch')[next - 1].click(); }, 600);
      }
    };
    if (cardState.markerK >= 1) { placeRing(0); finish(); } else cardState.done = finish;
  };
  if (instant || reduced) { cardState.k = 1; placeCard(); post.aperture = 0.4; post.focusPoint.set(CUP.x, CUP.y + 3.2, CUP.z).lerp(cardGroup.position, 0.55); after(); }
  else { cardState.after = after; }
}
function again(ml = cup0.mokka) {
  $('result').hidden = true;
  document.body.classList.remove('revealed');
  cardState.goal = 0; cardState.marker = -1; cardState.after = null;
  ring.visible = false;
  if (reduced) { cardState.k = 0; placeCard(); }
  setFrame(false);
  cup.mokka = ml; cup.milk = 0; cup.unmix = 0; cup.lastPour = null;
  setLevel(); simReset(0);
  bubbles.forEach((b) => { b.life = 0; }); addBubbles(4, 26);
  state = 'play'; setControls(true); updateCaption(); hintNow();
  moved = true;
}

/* ---------- Input ---------- */

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pick(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects([jug], true)[0];
  if (hit) {
    return { kind: 'milk' };
  }
  const plane = new THREE.Plane(V3(0, 1, 0), -level.y), p = V3();
  if (ray.ray.intersectPlane(plane, p) && Math.hypot(p.x - CUP.x, p.z - CUP.z) < CUPDIM.rt * CUPS + 0.6) return { stir: true, x: p.x, z: p.z };
  return null;
}
let pointerMode = null;
function cardSwatchAt(e) {
  if (state !== 'reveal' || !cardGroup.visible || cardState.k < 1) return -1;
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObject(cardMesh, false)[0];
  if (!hit || !hit.uv || hit.face.materialIndex !== 2) return -1;
  const x = hit.uv.x * CARD.w, y = (1 - hit.uv.y) * CARD.h;
  return LAYOUT.findIndex((L) => x >= L.x - 0.1 && x <= L.x + L.w + 0.1 && y >= L.y - 0.06 && y <= L.y + L.h + 0.06);
}
canvas.addEventListener('pointerdown', (e) => {
  const sw = cardSwatchAt(e);
  if (sw >= 0) { e.preventDefault(); makeShade(sw); return; }
  if (state !== 'play' || making.on) return;
  const h = pick(e); if (!h) return;
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  if (h.kind) { pointerMode = { kind: h.kind }; hold(h.kind, true); }
  else if (h.stir && !vessels.milk.held) {
    pointerMode = { stir: true };
    stir.active = true; stir.auto = false; stirTo(h.x, h.z); stir.x = stir.tx; stir.z = stir.tz;
  }
  canvas.classList.add('busy');
  hintNow();
});
canvas.addEventListener('pointermove', (e) => {
  if (pointerMode && pointerMode.stir) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const p = V3(); if (ray.ray.intersectPlane(new THREE.Plane(V3(0, 1, 0), -level.y), p)) stirTo(p.x, p.z);
    return;
  }
  if (e.pointerType === 'mouse' && state === 'reveal') { canvas.classList.toggle('can-pick', cardSwatchAt(e) >= 0); return; }
  canvas.classList.remove('can-pick');
  if (pointerMode || state !== 'play' || making.on || e.pointerType !== 'mouse') return;
  const h = pick(e);
  canvas.classList.toggle('can-pour', !!(h && h.kind));
  canvas.classList.toggle('can-stir', !!(h && h.stir));
});
const endPointer = () => {
  if (!pointerMode) return;
  if (pointerMode.kind) hold(pointerMode.kind, false);
  if (pointerMode.stir) stir.active = false;
  pointerMode = null; canvas.classList.remove('busy'); hintNow();
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('lostpointercapture', endPointer);

// the hold-buttons: pressed with a pointer, or held with Space or Enter
for (const [id, kind] of [['milkBtn', 'milk']]) {
  const b = $(id);
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); hold(kind, true); hintNow(); });
  const up = () => { if (vessels[kind].held) { hold(kind, false); hintNow(); } };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  b.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); hold(kind, true); hintNow(); } else if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); });
  b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); up(); } });
  b.addEventListener('blur', up);
  b.addEventListener('click', (e) => e.preventDefault());
  b.addEventListener('contextmenu', (e) => e.preventDefault());
}
addEventListener('keydown', (e) => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  if ($('about').open) return;
  const k = e.key.toLowerCase();
  if (k === 'm') { hold('milk', true); hintNow(); }
  if (k === 's' && state === 'play' && !vessels.milk.held) { stir.active = true; stir.keys = true; stir.autoT = 0; stir.tx = stir.x = CUP.x + level.r * 0.4; stir.tz = stir.z = CUP.z; hintNow(); }
});
addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'm') { hold('milk', false); hintNow(); }
  if (k === 's' && stir.keys) { stir.keys = false; stir.active = false; hintNow(); }
});
addEventListener('blur', () => { hold('milk', false); if (stir.keys) { stir.keys = false; stir.active = false; } });
for (const holder of document.querySelectorAll('.swatches')) {
  SWATCH.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'swatch'; b.style.setProperty('--c', hex(km(c)));
    b.setAttribute('aria-label', `Shade ${i + 1} of 9`);
    b.addEventListener('click', () => makeShade(i));
    holder.appendChild(b);
  });
}
document.querySelectorAll('.start').forEach((b) => b.addEventListener('click', () => begin(+b.dataset.ml)));
$('mine').addEventListener('click', mine);
document.querySelectorAll('.again').forEach((b) => b.addEventListener('click', () => again(+b.dataset.ml)));
$('aboutBtn').addEventListener('click', () => $('about').showModal());
addEventListener('resize', resize);

/* ---------- The loop ---------- */

let last = performance.now();
function update(dt) {
  LQ.uTime.value += dt;
  updateCam(dt);
  { // focus on the cup; as the card comes, between the two, with a smaller aperture so both are sharp
    const cupF = V3(CUP.x, CUP.y + 3.2, CUP.z);
    const goal = cardState.goal ? cupF.clone().lerp(cardGroup.position.clone().add(V3(0, 0, 0)), 0.55) : cupF;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 3);
    if (post.focusPoint.lengthSq() === 0) post.focusPoint.copy(goal); else post.focusPoint.lerp(goal, k);
    post.aperture += ((cardState.goal ? 0.4 : 1) - post.aperture) * k;
  }
  for (const v of Object.values(vessels)) updateVessel(v, dt);
  const pouring = Object.values(vessels).find((v) => v.q > 0 || v.tail > 0);
  updateStream(dt, pouring);
  if (!frozen) updateDrops(dt);
  updateSpoon(dt);
  updateMaking();
  // the card
  if (cardState.goal && cardState.k < 1) { cardState.k = Math.min(1, cardState.k + dt / 1.15); placeCard(); moved = true; if (cardState.k >= 1 && cardState.after) { const a = cardState.after; cardState.after = null; setTimeout(a, 120); } }
  if (!cardState.goal && cardState.k > 0) { cardState.k = Math.max(0, cardState.k - dt / 0.9); placeCard(); moved = true; }
  placeRing(dt);
  if (writing && writing.t < 1) { writing.t = Math.min(1, writing.t + dt / 1.3); drawCard(); if (writing.t >= 1) writing = null; }
  else if (writing) { drawCard(); writing = null; }

  // the fluid
  const stirring = sim.spoon.on > 0;
  if (!pouring || pouring.q === 0) { const s0 = sim.src[0]; s0.a *= Math.exp(-dt / 1.6); s0.r += dt * 0.03; if (s0.a < 0.01) s0.a = 0; }
  for (let i = 1; i < 4; i++) { const s = sim.src[i]; s.a *= Math.exp(-dt / 0.7); s.r += dt * 0.04; if (s.a < 0.01) s.a = 0; }
  sim.energy *= Math.exp(-dt / 1.1);
  cup.unmix *= Math.exp(-dt * (0.02 + 2.2 * sim.energy));
  const alive = stirring || sim.src.some((s) => s.a > 0) || sim.energy > 0.002 || cup.unmix > 0.02 || drops.length > 0;
  if (alive && !frozen) {
    const h = Math.min(dt, 1 / 30);
    simStep(h);
    LQ.uDye.value = dye.read.texture;
  }
  // ripples settle
  const agit = (pouring && pouring.q > 0 ? 0.006 : 0) + (stirring ? 0.012 : 0);
  LQ.uRip.value = Math.max(agit, LQ.uRip.value * Math.exp(-dt / 0.9));
  if (LQ.uRip.value < 0.0004 && !agit) LQ.uRip.value = 0;
  const ringsLive = LQ.uImp.value.some((I) => I.w > 0 && LQ.uTime.value - I.z < 3);
  // bubbles fade
  let bub = false;
  bubbles.forEach((b, i) => {
    const U = LQ.uBub.value[i];
    if (b.life > 0 && !frozen) { b.age += dt; if (b.age >= b.life) b.life = 0; }
    const a = b.life > 0 ? clamp(Math.min(b.age / 0.6, 1) * (1 - sstep(b.life * 0.6, b.life, b.age)), 0, 1) : 0;
    U.set(b.x, b.y, b.r, frozen && b.life > 0 ? 1 : a); if (a > 0) bub = true;
  });
  if (state === 'play' && cup.pourAge !== undefined) cup.pourAge += dt;
  return alive || !!pouring || LQ.uRip.value > 0 || ringsLive || stir.k > 0 || cam.k < 1 || drops.length > 0 || Object.values(vessels).some((v) => v.k > 0 && v.k < 1) || (cardState.goal && cardState.k < 1) || (!cardState.goal && cardState.k > 0) || cardState.markerK < 1 || !!writing || (bub && Math.random() < 0.1);
}
let need = 3, lastHint = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const busy = update(dt);
  if (busy || moved || need > 0) { render(); need = Math.max(0, need - 1); }
  if (now - lastHint > 400 && state === 'play') { lastHint = now; hintNow(); }
  requestAnimationFrame(frame);
}

/* ---------- Start, and the review hooks ---------- */

const num = (k, d) => (q.has(k) && isFinite(parseFloat(q.get(k))) ? parseFloat(q.get(k)) : d);
cup.mokka = clamp(num('mokka', 40), 1, MAX_ML);
cup.milk = clamp(num('milk', 0), 0, MAX_ML - cup.mokka);
setLevel();
placeJugMilk();
post.focusPoint.set(CUP.x, CUP.y + 3.2, CUP.z);
drawCard();
resize();
document.fonts && document.fonts.load(`italic 500 40px ${FONT}`).then(() => { drawCard(); moved = true; }).catch(() => {});
simReset(0);
simStep(0);           // compiles every fluid pass now, not at the first pour
simReset(0);
addBubbles(4, 26);
updateCaption();

const mixedQ = q.get('mixed');
const tQ = num('t', null);
const pourQ = q.get('pour');
if (cup.milk > 0 && mixedQ === '0') {
  // an instant pour: the milk goes in at the stream's rate, then the clouds are left for t seconds
  const v = vessels.milk;
  const at = toUV(...(() => { const p = V3(CUP.x, 0, CUP.z).addScaledVector(v.dirH, -level.r * 0.3); return [p.x, p.z]; })());
  const pourT = cup.milk / 14, h = 1 / 30;
  const keepC = cup.c; cup.c = 0;
  cup.unmix = 1;
  for (let t = 0; t < pourT; t += h) {
    const s0 = sim.src[0];
    s0.x = at[0] + Math.sin(t * 5) * 0.01; s0.y = at[1]; s0.r = 0.2 + 0.05 * Math.sin(t * 0.7); s0.a = lerp(s0.a, 1.2, 0.15);
    sim.target = 1; cup.c = keepC * (t / pourT);
    simPour(s0.x, s0.y, Math.min(1, t / 0.6), h);
    simStep(h);
  }
  cup.c = keepC;
  const after = tQ === null ? 2 : tQ;
  const total = pourQ === 'milk' ? after : after;
  for (let t = 0; t < total; t += h) {
    const s0 = sim.src[0];
    if (pourQ === 'milk') { s0.a = 1.2; s0.r = 0.2 + 0.05 * Math.sin(t * 0.7); simPour(s0.x, s0.y, 1, h); }
    else { s0.a *= Math.exp(-h / 1.6); s0.r += h * 0.03; }
    sim.energy *= Math.exp(-h / 1.1);
    simStep(h);
  }
  LQ.uDye.value = dye.read.texture;
  addBubbles(7, 20);
  frozen = true;
} else if (cup.milk > 0 || mixedQ === '1') {
  simReset(cup.c);
  cup.unmix = 0;
}
if (pourQ === 'milk') {
  const v = vessels.milk;
  v.target = pourPose(v); v.k = 1; v.flowing = true; v.flowT = 1.2; v.q = 14; v.held = false;
  frozen = true;
  updateVessel(v, 0);
  v.held = true; v.flowing = true; v.q = 14;
  updateStream(0, v);
  LQ.uRip.value = 0.006;
  setFrame(true);
}
if (debug && chainQ.length) { const first = chainQ.shift(); setTimeout(() => { console.log('016 click intro swatch', first); document.querySelectorAll('#intro .swatch')[first - 1].click(); }, 1500); }
const pickQ = parseInt(q.get('pick') || '', 10);
if (pickQ >= 1 && pickQ <= 9) {
  makeShade(pickQ - 1, q.get('reveal') === '1');
} else if (q.get('reveal') === '1') {
  document.body.classList.remove('waiting');
  $('intro').hidden = true;
  state = 'play';
  reveal(true);
} else if (bare || hooks) {
  if (!bare) { $('intro').hidden = true; document.body.classList.remove('waiting'); state = 'play'; updateCaption(); hintNow(); }
}
if (bare) { $('intro').hidden = true; }

{ // compile now what only appears later (the stream, drops, the ring), so the first pour does not stall
  const keep = [stream.visible, dropPool[0].visible, dropPool[1].visible, ring.visible, cardGroup.visible, dropPool[1].material];
  stream.visible = dropPool[0].visible = dropPool[1].visible = ring.visible = cardGroup.visible = true; dropPool[1].material = streamCoffee;
  renderer.compile(scene, camera);
  renderer.clippingPlanes = [mirrorPlane]; renderer.compile(scene, camera); renderer.clippingPlanes = [];
  [stream.visible, dropPool[0].visible, dropPool[1].visible, ring.visible, cardGroup.visible, dropPool[1].material] = keep;
}
render();
requestAnimationFrame((t) => { last = t; requestAnimationFrame(frame); });

if (debug) {
  window.coffee = {
    km, hex, nameFor, swatchFor, get state() { return state; }, cup, level, sim, vessels, WIN, CUPS, levelFor,
    check() { return [0, 0.05, 0.15, 0.5, 0.67].map((c) => [c, hex(km(c))]); },
    cupOnScreen(dx = 0, dz = 0) { const p = V3(CUP.x + dx, level.y, CUP.z + dz).project(camera), r = canvas.getBoundingClientRect(); return [r.left + (p.x + 1) / 2 * r.width, r.top + (1 - p.y) / 2 * r.height]; },
    get spoonK() { return stir.k; }, get making() { return making.on; }, makeShade, get energy() { return sim.energy; },
  };
  console.log('016', JSON.stringify(window.coffee.check()), 'cup scale', CUPS.toFixed(3), 'brim', levelFor(130), 'win', JSON.stringify(WIN.H));
}
