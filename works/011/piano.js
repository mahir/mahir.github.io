// A piano, tuned by ear. One octave of a grand piano, seen from the keyboard, tuned in the order an aural tuner
// uses: each string against one already set, by slowing the beat between two notes.
// The scene is drawn with three.js. The sound is made with Web Audio: every string is a stack of sine partials,
// so two strings beat for the same reason two real ones do.
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const RAD = Math.PI / 180;

/* ---------- The notes, and the tuner's order ---------- */

const NAMES = ['A3', 'A♯3', 'B3', 'C4', 'C♯4', 'D4', 'D♯4', 'E4', 'F4', 'F♯4', 'G4', 'G♯4', 'A4'];
const ET = NAMES.map((_, i) => 220 * 2 ** (i / 12));       // equal temperament, A4 = 440
const FORK = 'fork';
// [string to tune, what it is tuned against]: the fork, an octave, then round by fifths and fourths
const ORDER = [[12, FORK], [0, 12], [7, 0], [2, 7], [9, 2], [4, 9], [11, 4], [6, 11], [1, 6], [8, 1], [3, 8], [10, 3], [5, 10]];
// semitones apart: [name, partial of the lower note, partial of the upper note that coincide]
const KIND = { 0: ['a unison', 1, 1], 12: ['an octave', 2, 1], 7: ['a fifth', 3, 2], 5: ['a fourth', 4, 3] };

const STEPS = ORDER.map(([tune, ref]) => {
  const fT = ET[tune], fR = ref === FORK ? 440 : ET[ref];
  const [kind, pLow, pHigh] = KIND[ref === FORK ? 0 : Math.abs(tune - ref)];
  const low = fT < fR;
  const pT = low ? pLow : pHigh, pR = low ? pHigh : pLow;
  return {
    tune, ref, kind, pT, pR,
    rate: Math.abs(pT * fT - pR * fR),                     // beats a second when both notes are in equal temperament
    pure: 1200 * Math.log2((pR * fR) / (pT * fT)),         // cents from there to the beatless interval
  };
});

const SENS = 0.5;        // cents of pitch for a degree of lever
const TOL = 0.7;         // cents: close enough to set the pin
const HOLD = 0.9;        // seconds it has to stay there

/* ---------- Sound ---------- */

const sound = (() => {
  let ctx = null, bus = null, noise = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC({ latencyHint: 'interactive' });
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.25;
    comp.connect(ctx.destination);
    bus = ctx.createGain(); bus.gain.value = 0.2;
    bus.connect(comp);
    // the case and the room: a short tail of filtered noise
    const len = Math.floor(ctx.sampleRate * 1.7), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c); let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / ctx.sampleRate;
        lp += ((Math.random() * 2 - 1) - lp) * 0.22;
        d[i] = lp * Math.exp(-t / 0.42) * (t < 0.004 ? t / 0.004 : 1);
      }
    }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.5;
    bus.connect(conv); conv.connect(wet); wet.connect(comp);
    const nlen = Math.floor(ctx.sampleRate * 0.08);
    noise = ctx.createBuffer(1, nlen, ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nlen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nlen);
    return true;
  }

  // One string: sine partials, the upper ones dying sooner, struck at about an eighth of its length.
  // `boost` is the partial the tuner listens to; it is a little louder so the beat carries on a small speaker.
  function strike(freq, { boost = 0, vel = 1 } = {}) {
    if (!ctx) return null;
    const t = ctx.currentTime + 0.005;
    const out = ctx.createGain(); out.gain.value = 1; out.connect(bus);
    const parts = [];
    for (let n = 1; n <= 10; n++) {
      if (freq * n > 9500) break;
      let a = Math.pow(n, -1.1) * (0.25 + 0.75 * Math.abs(Math.sin(n * Math.PI / 8.4)));
      if (n === 1) a *= 0.8;
      if (n === boost) a *= 1.7;
      const tau = 5.2 / (1 + 0.42 * (n - 1));
      const o = ctx.createOscillator(); o.frequency.value = freq * n;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(a * vel, t + 0.004);
      g.gain.setTargetAtTime(a * vel * 0.6, t + 0.004, 0.1);
      g.gain.setTargetAtTime(0, t + 0.4, tau);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + 14);
      parts.push({ o, n });
    }
    // the hammer's knock
    const src = ctx.createBufferSource(); src.buffer = noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(2400, freq * 3.2); bp.Q.value = 0.8;
    const ng = ctx.createGain(); ng.gain.value = 0.5 * vel;
    src.connect(bp); bp.connect(ng); ng.connect(out); src.start(t);
    return {
      setFreq(f) { const now = ctx.currentTime; for (const p of parts) p.o.frequency.setTargetAtTime(f * p.n, now, 0.012); },
      stop(after = 0) {
        const at = ctx.currentTime + after;
        out.gain.setTargetAtTime(0, at, 0.06);
        for (const p of parts) { try { p.o.stop(at + 0.6); } catch (e) { /* already stopped */ } }
      },
    };
  }

  // The fork: almost a pure tone, with a short clang when it is struck.
  function fork() {
    if (!ctx) return null;
    const t = ctx.currentTime + 0.005;
    const out = ctx.createGain(); out.gain.value = 1; out.connect(bus);
    const oscs = [];
    for (const [f, a, tau] of [[440, 0.9, 7], [880, 0.05, 3], [2756, 0.22, 0.18]]) {
      const o = ctx.createOscillator(); o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.006); g.gain.setTargetAtTime(0, t + 0.05, tau);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 16);
      oscs.push(o);
    }
    return {
      setFreq() {},
      stop(after = 0) {
        const at = ctx.currentTime + after;
        out.gain.setTargetAtTime(0, at, 0.08);
        for (const o of oscs) { try { o.stop(at + 0.7); } catch (e) { /* already stopped */ } }
      },
    };
  }

  return { init, strike, fork, get on() { return !!ctx && ctx.state === 'running'; }, suspend() { if (ctx) ctx.suspend(); }, resume() { if (ctx) ctx.resume(); } };
})();

// how loud a struck string still is, `age` seconds on: a quick fall, then a long one
const env = (age) => (age < 0 ? 0 : 0.42 * Math.exp(-age / 0.12) + 0.58 * Math.exp(-Math.max(0, age - 0.3) / 5.2));

/* ---------- The scene ---------- */

const stage = $('stage');
const canvas = $('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  renderer = null;
}
if (!renderer) {
  // No WebGL: the still, and the words.
  canvas.remove();
  const img = new Image(); img.className = 'still'; img.src = 'og.jpg'; img.alt = 'The inside of a grand piano, with a tuning lever on one pin';
  stage.appendChild(img);
  $('intro').querySelector('.row').remove();
  $('intro').querySelector('.small').textContent = 'This browser cannot draw the piano, so there is nothing to tune here.';
  throw new Error('No WebGL');
}

const small = Math.min(innerWidth, innerHeight) < 700;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const ANISO = renderer.capabilities.getMaxAnisotropy();

const BG = 0x0a0807;
const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 40, 110);
// What the metal reflects: a dark room with a few soft lamps, like a workshop at night.
function studio() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(120, 70, 120), new THREE.MeshBasicMaterial({ color: 0x0e0c0b, side: THREE.BackSide })));
  const lamp = (w, h, color, power, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  lamp(40, 24, 0xfff0dc, 5, [-16, 30, -24]);     // the big lamp, overhead and beyond
  lamp(10, 44, 0xbcd2ff, 4.5, [46, 12, -6]);     // a cool window to the right
  lamp(44, 7, 0xffbe7d, 6, [4, 5, -52]);         // a warm strip low at the far end
  lamp(30, 10, 0xffe9cf, 3, [-44, 16, 14]);
  lamp(70, 14, 0xffffff, 3, [0, 26, 52]);      // and a little from behind the tuner
  return s;
}
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(studio(), 0.02).texture;
scene.environmentIntensity = 1.0;
const camera = new THREE.PerspectiveCamera(30, 1, 1, 260);

// Where things are, in centimetres or so. x runs up the keyboard, z comes toward the tuner, y is up.
const PITCH = 1.55;                    // from one note to the next
const SP = 0.34;                       // between the three strings of a note
const X0 = (i) => (i - 6) * PITCH;     // the thirteen notes that get tuned
const STRUT = 11.25;                   // the two plate bars either side of them
const WALL = 33;
const RIM = 13.6;                      // the case edge nearest the tuner
const FELT = 3.2, AG = 1.0;            // the felt the strings bear on, and the agraffes
const GAP0 = -0.3, GAP1 = -4.4;        // the opening the hammers come up through
const HAM = -2.3, DAMP = -6.6, MUTE = -10.6;
const BRIDGE = -34, HITCH = -42, FAR = -47;
const SY = 0.5;                        // height of the strings
const PINZ = (i, s) => 5.0 + s * 2.5 + (i & 1) * 1.1;

/* textures, drawn here */

function canvasTex(w, h, draw, srgb = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANISO;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const speckle = (contrast, pits) => (g, w, h) => {
  const d = g.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = 128 + (Math.random() - 0.5) * contrast - (Math.random() < pits ? 100 : 0);
    d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255;
  }
  g.putImageData(d, 0, 0);
};
const castGrain = canvasTex(512, 512, speckle(80, 0.006)); castGrain.repeat.set(0.3, 0.3);    // sand-cast iron under gold paint
const feltGrain = canvasTex(256, 256, speckle(150, 0)); feltGrain.repeat.set(1.6, 1.6);
const spruce = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#c99b58'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {       // broad bands of colour
    g.fillStyle = `rgba(${i % 2 ? 150 : 225},${i % 2 ? 100 : 180},${i % 2 ? 40 : 110},${rnd(0.03, 0.09)})`;
    g.fillRect(rnd(w), 0, rnd(20, 90), h);
  }
  for (let i = 0; i < 1100; i++) {     // the year rings, close and straight
    const x = rnd(w), k = rnd(-5, 5);
    g.strokeStyle = `rgba(${rnd(80, 125) | 0},${rnd(48, 74) | 0},18,${rnd(0.05, 0.22)})`;
    g.lineWidth = rnd(0.5, 2.4);
    g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + k, h * 0.33, x - k, h * 0.66, x, h); g.stroke();
  }
}, true);
spruce.repeat.set(1 / 13, 1 / 13); spruce.rotation = 0.62;
const rosewood = canvasTex(256, 512, (g, w, h) => {
  g.fillStyle = '#4b1d12'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {
    const x = rnd(w), k = rnd(-14, 14);
    g.strokeStyle = `rgba(${rnd(8, 40) | 0},${rnd(2, 12) | 0},4,${rnd(0.12, 0.5)})`;
    g.lineWidth = rnd(0.6, 4);
    g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + k, h * 0.3, x - k, h * 0.7, x + k * 0.4, h); g.stroke();
  }
}, true);
const winding = canvasTex(4, 16, (g, w, h) => {
  for (let y = 0; y < h; y++) { const v = 128 + 120 * Math.sin((y / h) * Math.PI * 2); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, w, 1); }
});

/* materials */

const P = THREE.MeshPhysicalMaterial, S = THREE.MeshStandardMaterial;
const gold = new P({ color: 0x9a6f22, metalness: 0.95, roughness: 0.46, bumpMap: castGrain, bumpScale: 0.9, clearcoat: 0.12, clearcoatRoughness: 0.5 });
const steel = new S({ color: 0xc6cbd1, metalness: 1, roughness: 0.3 });
const wire = new S({ color: 0xcfd0cf, metalness: 1, roughness: 0.22 });
const copper = new S({ color: 0xb9683a, metalness: 1, roughness: 0.36, bumpMap: winding, bumpScale: 1.4 });
const brass = new S({ color: 0xd0a546, metalness: 1, roughness: 0.26 });
const chrome = new S({ color: 0xf2f4f6, metalness: 1, roughness: 0.2 });
const black = new P({ color: 0x050505, metalness: 0, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.04 });
const feltRed = new P({ color: 0xa3121f, roughness: 1, sheen: 1, sheenColor: 0xff7a70, sheenRoughness: 0.55, bumpMap: feltGrain, bumpScale: 1.6 });
const feltGreen = new P({ color: 0x1d4a36, roughness: 1, sheen: 1, sheenColor: 0x7fd3a4, sheenRoughness: 0.6, bumpMap: feltGrain, bumpScale: 1.6 });
const feltWhite = new P({ color: 0xece6d6, roughness: 1, sheen: 0.7, sheenColor: 0xffffff, sheenRoughness: 0.6, bumpMap: feltGrain, bumpScale: 1.2 });
const board = new P({ map: spruce, color: 0xd9c9b0, roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.3 });
const maple = new S({ color: 0xb4854c, roughness: 0.55 });
const beech = new S({ color: 0xa7773f, roughness: 0.6 });
const bushing = new S({ color: 0x7b5c3a, roughness: 0.85 });
const dark = new S({ color: 0x0d0b0a, roughness: 0.95 });
const handleWood = new P({ map: rosewood, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.12 });

/* everything that never moves is merged, one mesh a material */

const bins = new Map();
const UP = new THREE.Vector3(0, 1, 0);
const at = (x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), new THREE.Vector3(sx, sy, sz));
function put(mat, geo, m) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (m) g.applyMatrix4(m);
  if (!bins.has(mat)) bins.set(mat, []);
  bins.get(mat).push(g);
}
const flat = (g) => { const f = g.toNonIndexed(); f.computeVertexNormals(); return f; };
// a box whose texture keeps one scale whatever its size
function box(mat, w, h, d, x, y, z) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]); }
  put(mat, g, at(x, y, z));
}
// a round rod from a to b
function rod(mat, a, b, r, seg = 8, wound = false) {
  const d = b.clone().sub(a), len = d.length();
  const g = new THREE.CylinderGeometry(r, r, len, seg, 1, true);
  if (wound) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * len * 9); }
  put(mat, g, new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new THREE.Vector3(1, 1, 1)));
}
function flush() {
  for (const [mat, list] of bins) {
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0;
    for (const g of list) {
      pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); uv.set(g.attributes.uv.array, o * 2);
      o += g.attributes.position.count; g.dispose();
    }
    const m = new THREE.BufferGeometry();
    m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    m.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const mesh = new THREE.Mesh(m, mat);
    mesh.castShadow = mat !== board && mat !== dark; mesh.receiveShadow = true;
    scene.add(mesh);
  }
  bins.clear();
}

/* the plate, the case and the soundboard */

box(gold, 2 * WALL, 1.2, RIM - GAP0, 0, -0.6, (RIM + GAP0) / 2);            // the plate the pins stand in
box(gold, 2 * WALL, 0.16, 1.5, 0, 0.08, AG);                                 // the ridge the agraffes are screwed into
box(gold, 2 * WALL, 0.75, HITCH + 2.5 - FAR, 0, -0.2, (HITCH + 2.5 + FAR) / 2);
box(board, 2 * WALL, 0.3, GAP1 - FAR, 0, -1.85, (GAP1 + FAR) / 2);           // the soundboard
box(dark, 2 * WALL, 2.6, 0.5, 0, -3.0, GAP1 + 0.25);
box(dark, 2 * WALL, 0.2, 6, 0, -5.2, -2.3);
box(maple, 2 * WALL, 2.15, 2.4, 0, SY - 0.05 - 1.075, BRIDGE - 1.1);         // the bridge
box(dark, 2 * WALL + 16, 8, 3, 0, 1.5, FAR - 1.5);                            // the far rim, in shadow
box(black, 8, 7, RIM - FAR + 20, -WALL - 4, 1, (RIM + FAR) / 2);
box(black, 8, 7, RIM - FAR + 20, WALL + 4, 1, (RIM + FAR) / 2);
for (const [x0, x1] of [[-WALL, -STRUT - 0.75], [-STRUT + 0.75, STRUT - 0.75], [STRUT + 0.75, WALL]]) box(feltGreen, x1 - x0, 0.32, 1.25, (x0 + x1) / 2, 0.16, FELT);

{ // the near rim, polished, with a rounded lip
  const s = new THREE.Shape(), r = 0.5, top = 1.7;
  s.moveTo(0, -1.2); s.lineTo(0, top - r); s.quadraticCurveTo(0, top, r, top); s.lineTo(12, top); s.lineTo(12, -1.2); s.lineTo(0, -1.2);
  const g = new THREE.ExtrudeGeometry(s, { depth: 2 * WALL + 16, bevelEnabled: false, curveSegments: 10 });
  g.rotateY(-Math.PI / 2); g.translate(WALL + 8, 0, RIM);
  put(black, g);
}
for (const sx of [-STRUT, STRUT]) { // the two bars of the plate, cast with a rounded back
  const s = new THREE.Shape(), w = 0.75, h = 1.3, r = 0.45;
  s.moveTo(-w, 0); s.lineTo(-w, h - r); s.quadraticCurveTo(-w, h, -w + r, h); s.lineTo(w - r, h); s.quadraticCurveTo(w, h, w, h - r); s.lineTo(w, 0); s.lineTo(-w, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: RIM - FAR, bevelEnabled: false, curveSegments: 8 });
  g.translate(sx, 0, FAR);
  put(gold, g);
  const dome = new THREE.SphereGeometry(0.42, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  for (const z of [10.5, -9, -27]) { put(brass, dome, at(sx, 1.3, z)); put(brass, new THREE.CylinderGeometry(0.5, 0.5, 0.06, 24), at(sx, 1.31, z)); }
}
{ // plate screws along the near edge
  const dome = new THREE.SphereGeometry(0.4, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), washer = new THREE.CylinderGeometry(0.5, 0.52, 0.07, 24);
  for (let x = -30; x <= 30; x += 5) { if (Math.abs(Math.abs(x) - STRUT) < 1.6) continue; put(brass, dome, at(x + 2.5, 0.06, 12.75)); put(brass, washer, at(x + 2.5, 0.035, 12.75)); }
}

/* pins, coils, strings, agraffes */

const pinShaft = new THREE.CylinderGeometry(0.17, 0.17, 1.25, 20);
const pinHead = flat(new THREE.CylinderGeometry(0.135, 0.185, 0.62, 4));
const pinCap = new THREE.CylinderGeometry(0.17, 0.17, 0.05, 20);
const bushG = new THREE.CylinderGeometry(0.3, 0.3, 0.04, 20);
const coilG = new THREE.TorusGeometry(0.22, 0.05, 6, 22).rotateX(Math.PI / 2);
const agBase = flat(new THREE.CylinderGeometry(0.36, 0.4, 0.42, 6));
const agTop = new THREE.SphereGeometry(0.37, 20, 12).scale(1, 0.85, 0.8);
const pegG = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);

// one note: `n` strings from their pins, over the felt, through the agraffe, to the bridge and the hitch pins
function addNote(x, n, odd, radius, wound) {
  for (let s = 0; s < n; s++) {
    const off = n === 3 ? (s - 1) * SP : (s - 0.5) * 0.46;
    const px = x + (n === 3 ? (s - 1) * 0.52 : (s - 0.5) * 0.8), pz = 5.0 + s * (n === 3 ? 2.5 : 3.2) + odd * 1.1;
    put(steel, pinShaft, at(px, 0.625, pz));
    put(steel, pinHead, at(px, 1.5, pz, rnd(Math.PI)));
    put(steel, pinCap, at(px, 1.21, pz));
    put(bushing, bushG, at(px, 0.02, pz));
    for (let k = 0; k < 3; k++) put(wire, coilG, at(px, 0.62 + k * 0.105, pz, rnd(6)));
    const sx = x + off, r0 = 0.05;
    const a = new THREE.Vector3(px + 0.22, 0.72, pz);
    const b = new THREE.Vector3(lerp(sx, px + 0.22, (FELT - AG) / (pz - AG)), 0.32 + r0, FELT);
    const c = new THREE.Vector3(sx, SY, AG);
    const d = new THREE.Vector3(sx, SY, BRIDGE);
    const e = new THREE.Vector3(sx, 0.4, HITCH);
    rod(wire, a, b, r0); rod(wire, b, c, r0);
    if (wound) {
      const c2 = new THREE.Vector3(sx, SY, AG - 1.4), d2 = new THREE.Vector3(sx, SY, BRIDGE + 1.6);
      rod(wire, c, c2, r0); rod(copper, c2, d2, radius, 10, true); rod(wire, d2, d, r0);
    } else rod(wire, c, d, radius);
    rod(wire, d, e, r0);
    put(steel, pegG, at(sx - 0.09, SY + 0.05, BRIDGE - 0.35)); put(steel, pegG, at(sx + 0.09, SY + 0.05, BRIDGE - 1.75));
    put(steel, pegG, at(sx, 0.4, HITCH));
  }
  put(brass, agBase, at(x, 0.36, AG, rnd(1)));
  put(brass, agTop, at(x, 0.62, AG));
}
for (let i = 0; i < 13; i++) addNote(X0(i), 3, i & 1, 0.052, false);
for (let j = 0; j < 13; j++) addNote(STRUT + 1.95 + j * 1.5, 3, j & 1, 0.048, false);              // the treble goes on to the right
for (let j = 0; j < 11; j++) addNote(-STRUT - 2.1 - j * 1.75, 2, j & 1, 0.1 + j * 0.008, true);    // wound strings to the left

flush();

/* the felt strip that mutes all but the middle string of each note */
{
  const N = 320, pos = [], uv = [], idx = [], x0 = X0(0) - 1.0, x1 = X0(12) + 1.0, w = 1.05, th = 0.17;
  const yOf = (x) => { const c = Math.cos(((x - X0(0)) / PITCH) * Math.PI * 2); return 0.66 + 0.46 * c - (c < 0 ? 0.1 * c * c : 0); };
  for (let i = 0; i <= N; i++) {
    const x = lerp(x0, x1, i / N), y = yOf(x), zz = MUTE + Math.sin(x * 1.3) * 0.05;
    pos.push(x, y + th / 2, zz - w / 2, x, y + th / 2, zz + w / 2, x, y - th / 2, zz + w / 2, x, y - th / 2, zz - w / 2);
    uv.push(x * 0.5, 0, x * 0.5, 0.5, x * 0.5, 0.6, x * 0.5, 1.1);
    if (i < N) { const a = i * 4, b = a + 4; idx.push(a, a + 1, b + 1, a, b + 1, b, a + 1, a + 2, b + 2, a + 1, b + 2, b + 1, a + 2, a + 3, b + 3, a + 2, b + 3, b + 2, a + 3, a, b, a + 3, b, b + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  const strip = new THREE.Mesh(g, feltRed); strip.castShadow = strip.receiveShadow = true;
  scene.add(strip);
}

/* hammers under the strings and dampers on them; the thirteen in the middle move */

const hamHead = new THREE.SphereGeometry(1, 20, 14).scale(0.4, 0.62, 0.92);
const hamCore = new THREE.BoxGeometry(0.28, 1.5, 0.42);
const hamShank = new THREE.CylinderGeometry(0.11, 0.11, 6, 8).rotateX(Math.PI / 2);
const HAM_REST = -1.75, HAM_TRAVEL = SY - 0.06 - 0.62 - HAM_REST;
function hammer(x) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(hamHead, feltWhite); head.receiveShadow = true;
  const core = new THREE.Mesh(hamCore, beech); core.position.y = -0.85;
  const shank = new THREE.Mesh(hamShank, beech); shank.position.set(0, -1.35, 3);
  g.add(head, core, shank); g.position.set(x, HAM_REST, HAM);
  scene.add(g); return g;
}
const dampHead = new THREE.BoxGeometry(1.02, 0.8, 2.3);
const dampTop = new THREE.CylinderGeometry(0.51, 0.51, 2.3, 20, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).scale(1, 0.5, 1);
const dampFelt = new THREE.BoxGeometry(0.94, 0.3, 2.05);
const DAMP_Y = SY + 0.05;
function damper(x) {
  const g = new THREE.Group();
  const felt = new THREE.Mesh(dampFelt, feltWhite); felt.position.y = 0.15;
  const head = new THREE.Mesh(dampHead, black); head.position.y = 0.7;
  const top = new THREE.Mesh(dampTop, black); top.position.y = 1.1;
  for (const m of [felt, head, top]) { m.castShadow = true; m.receiveShadow = true; }
  g.add(felt, head, top); g.position.set(x, DAMP_Y, DAMP);
  scene.add(g); return g;
}
const hammers = [], dampers = [];
for (let i = 0; i < 13; i++) { hammers.push(hammer(X0(i))); dampers.push(damper(X0(i))); }
for (let j = 0; j < 13; j++) { hammer(STRUT + 1.95 + j * 1.5); damper(STRUT + 1.95 + j * 1.5); }
for (let j = 0; j < 11; j++) { hammer(-STRUT - 2.1 - j * 1.75); damper(-STRUT - 2.1 - j * 1.75); }

/* a sounding string, blurred: a thin lens of light over the middle string of each note */

const blurs = [];
{
  const N = 48, L = AG - BRIDGE, pos = [], idx = [];
  for (let i = 0; i <= N; i++) { const u = i / N, w = Math.pow(Math.sin(Math.PI * u), 0.75); pos.push(-w, 0, -u * L, w, 0, -u * L); if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  for (let i = 0; i < 13; i++) {
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xfff0cf, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.set(X0(i), SY + 0.07, AG); m.visible = false; m.renderOrder = 2;
    scene.add(m); blurs.push(m);
  }
}

/* the tuning lever */

const lever = new THREE.Group();
{
  const add = (geo, mat, y = 0, parent = lever) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  add(new THREE.CylinderGeometry(0.37, 0.43, 1.3, 28), chrome, 1.47);                 // the socket that sits on the pin
  add(new THREE.SphereGeometry(0.47, 28, 18), chrome, 2.15);
  const arm = new THREE.Group(); arm.position.y = 2.15; arm.rotation.x = -(Math.PI / 2 - 11 * RAD); lever.add(arm);
  add(flat(new THREE.CylinderGeometry(0.2, 0.2, 5.6, 6)), chrome, 2.8, arm);           // a hexagonal shaft
  add(new THREE.CylinderGeometry(0.34, 0.3, 0.7, 28), brass, 5.75, arm);
  const prof = [[0.3, 6.05], [0.4, 6.4], [0.5, 7.4], [0.5, 8.6], [0.44, 9.9], [0.36, 10.7], [0.4, 11.0]].map(([r, y]) => new THREE.Vector2(r, y));
  const handle = add(new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(40), 36), handleWood, 0, arm);
  handle.material.map.repeat.set(1, 1);
  add(new THREE.CylinderGeometry(0.42, 0.4, 0.14, 28), brass, 11.05, arm);
  add(new THREE.SphereGeometry(0.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.4, 1), brass, 11.12, arm);
}
scene.add(lever);

/* the tuning fork, lying on the right-hand bar */

const fork = new THREE.Group(), tines = [];
{
  const mk = (geo, x, y, z) => { const m = new THREE.Mesh(geo, chrome); m.position.set(x, y, z); m.castShadow = true; fork.add(m); return m; };
  tines.push(mk(new THREE.BoxGeometry(0.2, 0.2, 4.2), -0.28, 0, -2.2), mk(new THREE.BoxGeometry(0.2, 0.2, 4.2), 0.28, 0, -2.2));
  mk(new THREE.BoxGeometry(0.76, 0.2, 0.3), 0, 0, 0.05);
  mk(new THREE.CylinderGeometry(0.1, 0.1, 2.3, 16).rotateX(Math.PI / 2), 0, 0, 1.3);
  mk(new THREE.SphereGeometry(0.2, 20, 14), 0, 0, 2.5);
  fork.position.set(STRUT, 1.41, 6.4); fork.rotation.y = -0.1;
}
scene.add(fork);
const FORK_AT = new THREE.Vector3(STRUT, 1.4, 5);

/* light */

const key = new THREE.DirectionalLight(0xfff1de, 3.6);
key.position.set(-22, 40, 26); key.target.position.set(0, 0, -8);
key.castShadow = true;
key.shadow.mapSize.setScalar(small ? 2048 : 4096);
Object.assign(key.shadow.camera, { left: -42, right: 42, top: 44, bottom: -36, near: 5, far: 130 });
key.shadow.bias = -0.0005; key.shadow.normalBias = 0.03; key.shadow.radius = 2.5;
scene.add(key, key.target);
const rake = new THREE.PointLight(0xffc58a, 900, 90, 2);      // a warm lamp low over the far strings
rake.position.set(16, 7, -24); scene.add(rake);
const cool = new THREE.PointLight(0xa9c4ff, 260, 70, 2);
cool.position.set(-20, 12, 16); scene.add(cool);

/* ---------- The camera: it frames the two strings that are sounding ---------- */

const TILT = 36 * RAD;       // from straight down, leaning toward the tuner
const cam = { x: 0, z: 0, d: 60 }, goal = { x: 0, z: 0, d: 60 };
let frameX = [X0(0), X0(12)];
function frame(xmin, xmax, snap = false) {
  frameX = [xmin, xmax];
  const tv = Math.tan(camera.fov * RAD / 2), th = tv * camera.aspect;
  const span = Math.max(xmax - xmin + 7, 11);
  const d = Math.max(span / 2 / th, (25 * Math.cos(TILT) / 2) / tv);
  const half = d * tv / Math.cos(TILT);
  goal.x = clamp((xmin + xmax) / 2, -WALL + d * th * 0.9, WALL - d * th * 0.9) || 0;
  goal.z = 17.4 - half * (camera.aspect < 0.8 ? 0.8 : 0.9);
  goal.d = d;
  if (snap || reduced) Object.assign(cam, goal);
}
const look = { x: 0, y: 0 };
function placeCamera(t) {
  const sway = reduced ? 0 : 1;
  const px = look.x * 1.6 * sway + Math.sin(t * 0.21) * 0.35 * sway, py = look.y * 1.0 * sway;
  camera.position.set(cam.x + px, 0.5 + cam.d * Math.cos(TILT) + py, cam.z + cam.d * Math.sin(TILT));
  camera.lookAt(cam.x, 0.5, cam.z);
  scene.fog.near = cam.d + 6; scene.fog.far = cam.d + 78;
}
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  const pr = clamp(Math.min(window.devicePixelRatio || 1, small ? 2.5 : 3, Math.sqrt(9e6 / (w * h))), 1, 3);
  renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  frame(frameX[0], frameX[1], true);
}
addEventListener('resize', resize);

const v3 = new THREE.Vector3();
function toScreen(x, y, z) {
  v3.set(x, y, z).project(camera);
  return [(v3.x * 0.5 + 0.5) * stage.clientWidth, (-v3.y * 0.5 + 0.5) * stage.clientHeight];
}

/* ---------- The tuning ---------- */

const cents = new Array(13).fill(0);          // each string, in cents from equal temperament
const tuned = new Array(13).fill(false);
const byTuner = new Array(13).fill(false);
const struck = new Array(13).fill(-99), until = new Array(13).fill(-99), voices = new Array(13).fill(null);
let forkStruck = -99, forkVoice = null;
let state = 'intro';                          // intro, tuning, set, done
let k = 0;                                    // which step
let now = 0, lastStrike = -99, lastInput = -99, hold = 0, wrong = 0, setAt = 0, phase = 0, auto = null, landed = false;
let thetaSet = 0;                             // where the lever points when this string is right, degrees clockwise from straight ahead
const lev = { x: 0, y: 0, z: 0, th: 0, from: null, to: null, t: 1 };

const freqOf = (i) => ET[i] * 2 ** (cents[i] / 1200);
const step = () => STEPS[k];
const targetOf = (s) => (s.ref === FORK ? 0 : cents[s.ref]);
const pinAt = (i) => [X0(i), PINZ(i, 1)];

function loosen() {
  for (let i = 0; i < 13; i++) { cents[i] = -rnd(13, 27); tuned[i] = false; byTuner[i] = false; }
}

function playNote(i, { boost = 0, dur = 8, vel = 1 } = {}) {
  if (voices[i]) voices[i].stop();
  voices[i] = sound.strike(freqOf(i), { boost, vel });
  if (voices[i]) voices[i].stop(dur);
  struck[i] = now; until[i] = now + dur;
}
function strikePair() {
  if (state !== 'tuning' && state !== 'set') return;
  const s = step();
  playNote(s.tune, { boost: s.pT });
  if (s.ref === FORK) { if (forkVoice) forkVoice.stop(); forkVoice = sound.fork(); forkStruck = now; }
  else playNote(s.ref, { boost: s.pR });
  phase = 0; lastStrike = now;
}

function leverTo(x, y, z, th, snap = false) {
  lev.from = { x: lev.x, y: lev.y, z: lev.z, th: lev.th }; lev.to = { x, y, z, th }; lev.t = snap || reduced ? 1 : 0;
  if (lev.t === 1) Object.assign(lev, lev.to);
}

const stepEl = $('step'), titleEl = $('title'), detailEl = $('detail'), hintEl = $('hint'), orderEl = $('order');
const tagT = $('tagT'), tagR = $('tagR'), lamp = $('lamp'), pend = $('pend'), paceWord = $('paceWord');
for (const [tune] of ORDER) { const li = document.createElement('li'); li.textContent = NAMES[tune].replace(/\d/, ''); orderEl.appendChild(li); }

function say(text) { if (hintEl.textContent !== text) hintEl.textContent = text; }

function enter(n, snap = false) {
  k = n; state = 'tuning'; hold = 0; wrong = 0; auto = null; landed = false;
  const s = step(), T = NAMES[s.tune];
  const [px, pz] = pinAt(s.tune);
  thetaSet = rnd(10, 30);       // it ends leaning a little right of straight ahead, and starts left of that
  leverTo(px, 0, pz, thetaSet - (targetOf(s) - cents[s.tune]) / SENS, snap);
  if (s.ref === FORK) frame(X0(s.tune) - 3, STRUT + 1.5, snap);
  else frame(Math.min(X0(s.tune), X0(s.ref)), Math.max(X0(s.tune), X0(s.ref)), snap);
  stepEl.textContent = `String ${n + 1} of 13`;
  if (s.ref === FORK) {
    titleEl.textContent = `${T} against the fork`;
    detailEl.textContent = 'Turn the lever to tighten the string. The wobble between the two slows as the string comes up to the fork. Stop when it is still.';
  } else {
    titleEl.textContent = `${T} against ${NAMES[s.ref]} · ${s.kind}`;
    detailEl.textContent = s.rate < 0.01
      ? 'Tighten until the wobble stops.'
      : `Left a little ${s.kind === 'a fifth' ? 'narrow' : 'wide'}, so it beats. Tighten until the beat slows to the pendulum, about ${Math.round(s.rate * 4)} beats in 4 seconds, and stop before it goes still.`;
  }
  say('');
  tagT.textContent = T; tagT.classList.remove('set');
  tagR.textContent = s.ref === FORK ? 'Fork · 440' : NAMES[s.ref];
  paceWord.textContent = s.rate < 0.01 ? 'Still' : 'Pace';
  [...orderEl.children].forEach((li, i) => { li.className = i < n ? 'done' : i === n ? 'now' : ''; });
}

function setPin() {
  const s = step();
  state = 'set'; setAt = now; tuned[s.tune] = true; auto = null;
  tagT.classList.add('set'); say('Set.');
  orderEl.children[k].className = 'done';
}

function finish() {
  state = 'done';
  frame(X0(0), X0(12));
  leverTo(-3, 1.7 - 0.82, 16.4, 82);
  tagT.classList.remove('on'); tagR.classList.remove('on');
  document.body.classList.add('quietly');
  // the report
  const list = $('cents'); list.textContent = '';
  let worst = 0;
  for (let i = 0; i < 13; i++) {
    if (Math.abs(cents[i]) > Math.abs(cents[worst])) worst = i;
    const li = document.createElement('li'), c = cents[i], w = clamp(Math.abs(c) / 5, 0, 1) * 50;
    li.innerHTML = `<span class="n">${NAMES[i]}</span><span class="bar"><i style="${c < 0 ? 'right' : 'left'}:50%;width:${w.toFixed(1)}%"></i></span><span class="v">${c > 0.049 ? '+' : c < -0.049 ? '−' : ''}${Math.abs(c).toFixed(1)}</span>`;
    list.appendChild(li);
  }
  const w = cents[worst], helped = byTuner.filter(Boolean).length;
  $('sum').textContent = `Furthest out: ${NAMES[worst]}, ${Math.abs(w).toFixed(1)} cents ${w < 0 ? 'flat' : 'sharp'}.`
    + (helped === 13 ? ' The tuner set every string.' : helped ? ` The tuner set ${helped} of the 13.` : '');
  $('result').hidden = false;
  playChords(0.9);
}

// A, D, E, A on the tuning as it stands
let chordTimers = [];
function playChords(delay = 0) {
  for (const t of chordTimers) clearTimeout(t);
  chordTimers = [];
  const chords = [[0, 4, 7, 12], [0, 5, 9, 12], [2, 7, 11], [0, 4, 7, 12]];
  chords.forEach((ch, c) => ch.forEach((i, j) => {
    chordTimers.push(setTimeout(() => { if (state === 'done') playNote(i, { dur: c === 3 ? 3.6 : 1.25, vel: 0.85 }); }, (delay + c * 1.35 + j * 0.05) * 1000));
  }));
}

function begin(n = 0) {
  sound.init();
  for (const t of chordTimers) clearTimeout(t);
  $('intro').hidden = true; $('result').hidden = true;
  document.body.classList.remove('quietly', 'waiting');
  loosen();
  for (let j = 0; j < n; j++) { const s = STEPS[j]; cents[s.tune] = targetOf(s) + rnd(-0.4, 0.4); tuned[s.tune] = true; byTuner[s.tune] = true; }
  enter(n, state === 'intro' && n > 0);
  lastInput = now;
}

/* ---------- Hands ---------- */

let drag = null;
function turn(deg) {
  if (state !== 'tuning' || auto || lev.t < 1) return;
  const s = step(), t = targetOf(s);
  cents[s.tune] = clamp(cents[s.tune] + deg * SENS, t - 45, t + 28);
  if (voices[s.tune]) voices[s.tune].setFreq(freqOf(s.tune));
  lastInput = now;
}
const angleAt = (e) => { const s = step(); const [px, pz] = pinAt(s.tune); const [cx, cy] = toScreen(px, 1.5, pz); return [Math.atan2(e.clientY - cy, e.clientX - cx), Math.hypot(e.clientX - cx, e.clientY - cy)]; };

canvas.addEventListener('pointerdown', (e) => {
  if (state === 'intro') return;
  sound.init();
  canvas.setPointerCapture(e.pointerId);
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, a: state === 'tuning' ? angleAt(e)[0] : 0 };
  stage.classList.add('turning');
  lastInput = now;
  if (state === 'tuning' && now - lastStrike > 1.2 && landed) strikePair();
});
canvas.addEventListener('pointermove', (e) => {
  look.x = (e.clientX / stage.clientWidth - 0.5) * (e.pointerType === 'mouse' ? 1 : 0);
  look.y = (e.clientY / stage.clientHeight - 0.5) * (e.pointerType === 'mouse' ? 1 : 0);
  if (!drag || drag.id !== e.pointerId) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5) drag.moved = true;
  if (state !== 'tuning') return;
  const [a, r] = angleAt(e);
  let da = a - drag.a; if (da > Math.PI) da -= Math.PI * 2; if (da < -Math.PI) da += Math.PI * 2;
  drag.a = a;
  if (drag.moved && r > 22) turn(da / RAD);
});
const release = (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  stage.classList.remove('turning');
  if (!drag.moved && e.type === 'pointerup') tap(e);
  drag = null;
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(UP, -SY), hit = new THREE.Vector3();
function tap(e) {
  if (state === 'tuning') { if (now - lastStrike > 0.25 && landed) strikePair(); return; }
  if (state !== 'done') return;
  ndc.set((e.clientX / stage.clientWidth) * 2 - 1, -(e.clientY / stage.clientHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (!ray.ray.intersectPlane(plane, hit)) return;
  const i = Math.round(hit.x / PITCH + 6);
  if (i >= 0 && i < 13 && Math.abs(hit.x - X0(i)) < 0.7 && hit.z < RIM) playNote(i, { dur: 2.6 });
}

addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement || e.metaKey || e.ctrlKey || e.altKey) return;
  const fine = e.shiftKey ? 0.2 : 0.7;
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { turn(fine); if (state === 'tuning' && now - lastStrike > 3 && landed) strikePair(); e.preventDefault(); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { turn(-fine); if (state === 'tuning' && now - lastStrike > 3 && landed) strikePair(); e.preventDefault(); }
  else if (e.key === ' ') { if (state === 'tuning' && landed) { sound.init(); strikePair(); lastInput = now; } e.preventDefault(); }
});

$('start').addEventListener('click', () => { begin(0); canvas.focus({ preventScroll: true }); });
$('strike').addEventListener('click', () => { sound.init(); if (state === 'tuning' && landed) { strikePair(); lastInput = now; } });
$('auto').addEventListener('click', () => {
  sound.init();
  if (state !== 'tuning' || auto || !landed) return;
  const s = step();
  auto = { from: cents[s.tune], to: targetOf(s) + rnd(-0.2, 0.2), t: 0, dur: reduced ? 0.6 : 2.4 };
  byTuner[s.tune] = true; lastInput = now;
  if (now - lastStrike > 0.6) strikePair();
});
$('play').addEventListener('click', () => { sound.init(); playChords(0); });
$('again').addEventListener('click', () => begin(0));
document.addEventListener('visibilitychange', () => { if (document.hidden) sound.suspend(); else if (state !== 'intro') sound.resume(); });

/* ---------- Every frame ---------- */

let last = performance.now() / 1000;
function tick() {
  const t = performance.now() / 1000, dt = Math.min(0.05, t - last); last = t; now = t;
  const s = state === 'intro' || state === 'done' ? null : step();

  // the lever, moving to its pin or turning on it
  if (lev.t < 1) {
    lev.t = Math.min(1, lev.t + dt / 0.9);
    const p = ease(lev.t), f = lev.from, to = lev.to;
    lev.x = lerp(f.x, to.x, p); lev.z = lerp(f.z, to.z, p); lev.th = lerp(f.th, to.th, p);
    lev.y = lerp(f.y, to.y, p) + Math.sin(Math.PI * p) * 2.6;
    if (lev.t === 1 && state === 'tuning') { landed = true; if (sound.on) { strikePair(); lastInput = now; } }
  } else if (state === 'tuning' && !landed) landed = true;
  if (s && lev.t === 1) {
    if (auto) {
      auto.t += dt / auto.dur;
      cents[s.tune] = lerp(auto.from, auto.to, ease(Math.min(1, auto.t)));
      if (voices[s.tune]) voices[s.tune].setFreq(freqOf(s.tune));
      lastInput = now;
    }
    lev.th = thetaSet - (targetOf(s) - cents[s.tune]) / SENS;
  }
  lever.position.set(lev.x, lev.y, lev.z); lever.rotation.y = -lev.th * RAD;

  // the beat between the two notes
  let beatLight = 0, pairLoud = 0;
  if (s) {
    const fR = s.ref === FORK ? 440 : freqOf(s.ref);
    const beat = s.pT * freqOf(s.tune) - s.pR * fR;
    phase += Math.PI * 2 * beat * dt;
    const ageT = now - struck[s.tune], ageR = s.ref === FORK ? now - forkStruck : now - struck[s.ref];
    pairLoud = now < until[s.tune] ? Math.min(env(ageT), env(ageR)) : 0;
    beatLight = pairLoud * (0.5 + 0.5 * Math.cos(phase));
    const err = cents[s.tune] - targetOf(s);

    if (state === 'tuning') {
      // strike again while the visitor is working
      if (landed && now - lastStrike > 4.4 && now - lastInput < 6.5 && sound.on) strikePair();
      const audible = pairLoud > 0.03 || !sound.on;
      hold = Math.abs(err) < TOL && audible && (!auto || auto.t >= 1) ? hold + dt : 0;
      if (hold > HOLD || (auto && auto.t >= 1 && hold > 0.3)) setPin();
      else {
        wrong = s.pure > 0.5 && Math.abs(err - 2 * s.pure) < 0.9 ? wrong + dt : 0;
        if (wrong > 1.4) say('Right pace, wrong side. Ease back through the still point.');
        else if (err > Math.max(6, s.pure + 5)) say('Too far. Ease it back.');
        else if (!sound.on && now - lastInput < 8 && lastInput > 0) say('No sound here. Watch the lamp: it swells with the beat.');
        else if (hintEl.textContent !== 'Set.') say('');
      }
    } else if (state === 'set') {
      if (now - setAt > 0.25 && lastStrike < setAt) strikePair();
      if (now - setAt > (reduced ? 1.2 : 1.9)) { if (k === 12) finish(); else enter(k + 1); }
    }
  }

  // hammers, dampers and the blur of each sounding string
  for (let i = 0; i < 13; i++) {
    const age = now - struck[i];
    const h = age < 0.035 ? age / 0.035 : Math.max(0, 1 - (age - 0.035) / 0.22);
    hammers[i].position.y = HAM_REST + (age < 1 ? h : 0) * HAM_TRAVEL;
    const up = now < until[i] ? 0.55 : 0;
    const d = dampers[i]; d.position.y += (DAMP_Y + up - d.position.y) * Math.min(1, dt * 14);
    const open = clamp((d.position.y - DAMP_Y) / 0.5, 0, 1);
    let a = env(age) * open;
    if (s && (i === s.tune || i === s.ref)) a *= 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(phase));
    const b = blurs[i]; b.visible = a > 0.012;
    if (b.visible) { b.scale.x = a * (reduced ? 0.2 : 0.34) * (1 + 0.12 * Math.sin(t * 61 + i)); b.material.opacity = 0.16 + 0.3 * a; }
  }
  const fa = env((now - forkStruck) * 0.75) * (s && s.ref === FORK ? 1 : 0.4);
  const j = reduced ? 0 : fa * 0.07 * Math.sin(t * 88);
  tines[0].position.x = -0.28 - j; tines[1].position.x = 0.28 + j;

  // the lamp and the pendulum
  lamp.setAttribute('fill-opacity', (beatLight * 1.5).toFixed(3));
  pend.setAttribute('transform', `rotate(${(s && s.rate > 0.01 && !reduced ? 24 * Math.sin(Math.PI * s.rate * t) : 0).toFixed(2)} 23 4)`);

  // the camera, then the two names
  const kf = Math.min(1, dt * 2.2);
  cam.x += (goal.x - cam.x) * kf; cam.z += (goal.z - cam.z) * kf; cam.d += (goal.d - cam.d) * kf;
  placeCamera(t);
  camera.updateMatrixWorld();
  if (s && state !== 'done') {
    const [tx, ty] = toScreen(X0(s.tune), 1.0, HAM);
    tagT.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) translate(-50%, -50%)`; tagT.classList.add('on');
    const [rx, ry] = s.ref === FORK ? toScreen(FORK_AT.x, 1.6, 2.6) : toScreen(X0(s.ref), 1.0, HAM);
    tagR.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px) translate(-50%, -50%)`; tagR.classList.add('on');
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

/* ---------- Start ---------- */

if (q.has('bare')) document.body.classList.add('bare');
loosen();
resize();
{ // before the first note the lever rests on the first pin, and the whole octave is in view
  const [px, pz] = pinAt(12);
  Object.assign(lev, { x: px, y: 0, z: pz, th: -52 });
  if (camera.aspect < 1) frame(X0(8), X0(12) + 1.5, true); else frame(X0(0) - 2, X0(12) + 2, true);
}
const jump = parseInt(q.get('step') || '', 10);
if (jump >= 1 && jump <= 13) begin(jump - 1);
requestAnimationFrame(tick);
// ?debug lets a test read where the tuning stands
if (q.has('debug')) window.piano = { get state() { return state; }, get step() { return k; }, get cents() { return cents.map((c) => +c.toFixed(2)); }, get err() { const s = STEPS[k]; return +(cents[s.tune] - targetOf(s)).toFixed(2); }, get sound() { return sound.on; }, steps: STEPS };
