// The scene: the frame as a slab of land and water under a warm afternoon sun, seen from high in the south-southwest
// through an orthographic camera, so it reads like the puzzle. The view pans and zooms but never turns.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HorizontalTiltShiftShader } from 'three/addons/shaders/HorizontalTiltShiftShader.js';
import { VerticalTiltShiftShader } from 'three/addons/shaders/VerticalTiltShiftShader.js';
import { toWorld, WIDTH, HEIGHT } from './geo.js';
import { buildLandmark, buildOutline, PALETTE } from './models.js';
import { riseOrder, riseWindow } from './city.js';

const HEADING = 20 * Math.PI / 180; // the camera looks north-northeast
const ELEVATION = 40 * Math.PI / 180;
const TO_CAMERA = new THREE.Vector3(-Math.sin(HEADING) * Math.cos(ELEVATION), Math.sin(ELEVATION), Math.cos(HEADING) * Math.cos(ELEVATION));
const SUN = new THREE.Vector3(-0.844, 0.407, 0.350).normalize(); // west-southwest, 24° up: late afternoon
const DISTANCE = 14000;
const MIN_VIEW = 500; // the closest view, in metres of view height
const LANDMARK_VIEW = 1400, LANDMARK_ACROSS = 1000;
// every screen opens close in, on the mouth of the Golden Horn: the peninsula's tip, Galata and Üsküdar
const START = { lat: 41.0195, lon: 28.9895, view: 2600, across: 3600 };
const SLAB = 60, LAND_TOP = 6;
export const COLORS = { paper: 0xf3ead9, water: 0x2a8c99, waterSide: 0x22747f, land: 0xe9dbbd, landSide: 0xc7b38c };

export async function startScene(canvas, { land, landmarks, city, reducedMotion, small }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.paper);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, DISTANCE * 3);

  // ---------- light and air ----------
  // a low, warm late-afternoon sun against a cool sky, so every block has a lit face and a shaded one;
  // a haze the colour of the paper softens what is farther away, as over the Bosphorus
  scene.add(new THREE.HemisphereLight(0xe4ecf2, 0xc9a77c, 1.55));
  const sun = new THREE.DirectionalLight(0xffd8a6, 3.4);
  scene.fog = new THREE.Fog(0xf1e3c9, DISTANCE - 600, DISTANCE + 15000);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);

  // ---------- water, land and the slab's edge ----------
  const water = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH, HEIGHT), waterMaterial(land));
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = true;
  scene.add(water);

  const landCells = [];
  land.region.forEach((r, i) => { if (r) landCells.push(i); });
  const ground = new THREE.InstancedMesh(new THREE.BoxGeometry(land.cell, LAND_TOP, land.cell),
    new THREE.MeshStandardMaterial({ roughness: 1 }), landCells.length); // coloured per cell below
  const m = new THREE.Matrix4();
  const dirt = new THREE.Color();
  landCells.forEach((i, k) => {
    const c = land.center(i);
    ground.setMatrixAt(k, m.makeTranslation(c.x, LAND_TOP / 2, c.z));
    // a little unevenness in the ground, so bare land is not one flat colour
    const n = Math.sin(c.x * 0.013 + Math.cos(c.z * 0.009) * 2) * 0.5 + Math.sin(c.z * 0.021 + c.x * 0.004) * 0.5;
    ground.setColorAt(k, dirt.setHex(COLORS.land).offsetHSL(0, 0, n * 0.025));
  });
  ground.receiveShadow = true;
  ground.frustumCulled = false;
  scene.add(ground);
  scene.add(slabEdge(land));

  // ---------- landmarks, waiting as outlines ----------
  const pieces = new Map();
  for (const lm of landmarks) {
    const model = buildLandmark(THREE, lm);
    const outline = buildOutline(THREE, lm, model);
    const p = toWorld(lm.lat, lm.lon), y = lm.ownsLand ? LAND_TOP : 0;
    model.position.set(p.x, y, p.z);
    outline.position.set(p.x, y, p.z);
    scene.add(outline);
    pieces.set(lm.id, { lm, model, outline, x: p.x, z: p.z, y, placed: false, ...model.userData.footprint });
  }
  const showOutline = (id, on) => { pieces.get(id).outline.visible = on; };

  // ---------- the ordinary city, waiting as pale plots until its landmark is placed ----------
  // in rising order, so each neighborhood is one run of each buffer
  const n = landmarks.length;
  const H = riseOrder(city.houses, n), T = riseOrder(city.trees, n), M = riseOrder(city.mosques, n);
  const houses = H.items, trees = T.items, mosques = M.items;
  const delaysOf = (list) => Float32Array.from(list, (x) => x.delay);
  const houseDelays = delaysOf(houses), treeDelays = delaysOf(trees), mosqueDelays = delaysOf(mosques);
  const std = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const box = () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const inst = (geo, mat, count, shadow = true) => {
    const mesh = new THREE.InstancedMesh(geo, mat, Math.max(count, 1));
    mesh.count = count;
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false; // instances start at scale 0, so a bounding sphere taken early would be wrong
    scene.add(mesh);
    return mesh;
  };
  // walls darken toward the street, a baked stand-in for ambient occlusion
  const walls = inst(shadeBase(box(), 0.6), std({ vertexColors: true }), houses.length);
  const roofs = inst(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0), std({ flatShading: true, roughness: 0.7 }), houses.length);
  const plots = inst(box(), std({ color: 0xe0cda8, roughness: 1 }), houses.length, false);
  const crowns = inst(new THREE.IcosahedronGeometry(1, 0), std({ flatShading: true }), trees.length);
  const cypresses = inst(new THREE.ConeGeometry(1, 1, 6).translate(0, 0.5, 0), std({ color: 0x3c5a34, flatShading: true }), trees.length);
  const mBase = inst(shadeBase(box(), 0.66), std({ color: PALETTE.stone, vertexColors: true }), mosques.length);
  const mDome = inst(new THREE.SphereGeometry(1, 16, 7, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: PALETTE.leadLight }), mosques.length);
  const mShaft = inst(new THREE.CylinderGeometry(1, 1, 1, 8).translate(0, 0.5, 0), std({ color: PALETTE.white }), mosques.length);
  const mCap = inst(new THREE.ConeGeometry(1, 1, 8).translate(0, 0.5, 0), std({ color: PALETTE.lead }), mosques.length);
  const tint = new THREE.Color();
  houses.forEach((h, i) => {
    walls.setColorAt(i, tint.setHex(PALETTE.walls[h.wall]));
    roofs.setColorAt(i, tint.setHex(PALETTE.roofs[h.roof]));
  });
  trees.forEach((t, i) => crowns.setColorAt(i, tint.setHex(PALETTE.trees[i % 3])));

  const o3 = new THREE.Object3D();
  const put = (mesh, i, x, y, z, sx, sy, sz, rot = 0) => {
    o3.position.set(x, y, z);
    o3.rotation.set(0, rot, 0);
    o3.scale.set(sx || 1e-5, sy || 1e-5, sz || 1e-5);
    o3.updateMatrix();
    mesh.setMatrixAt(i, o3.matrix);
  };
  function setHouse(i, s) {
    const h = houses[i], on = s > 0, spread = 0.7 + 0.3 * s, roofH = h.roof === 4 ? 1.5 : Math.min(h.w, h.d) * 0.38;
    put(walls, i, h.x, LAND_TOP, h.z, h.w * spread * on, h.h * s, h.d * spread * on, h.rot);
    put(roofs, i, h.x, LAND_TOP + h.h * s, h.z, h.w * spread * on, roofH * s, h.d * spread * on, h.rot);
    put(plots, i, h.x, LAND_TOP, h.z, h.w * 0.9 * (s < 1), 1.6 * (s < 1), h.d * 0.9 * (s < 1), h.rot);
  }
  function setTree(i, s) {
    const t = trees[i], c = t.kind === 'cypress';
    put(crowns, i, t.x, LAND_TOP + t.r * 0.9 * s, t.z, t.r * s * !c, t.r * 1.1 * s * !c, t.r * s * !c);
    put(cypresses, i, t.x, LAND_TOP, t.z, t.r * 0.42 * s * c, t.r * 3.4 * s * c, t.r * 0.42 * s * c);
  }
  // a neighborhood mosque: a block, a lead dome and one pencil minaret
  function setMosque(i, s) {
    const m = mosques[i], z = m.size, on = s > 0, h = z * 0.85 * s; // tall enough to stand clear of the roofs
    put(mBase, i, m.x, LAND_TOP, m.z, z * on, h, z * on, m.rot);
    put(mDome, i, m.x, LAND_TOP + h, m.z, z * 0.46 * on, z * 0.44 * s, z * 0.46 * on);
    const mx = m.x + Math.cos(m.rot) * z * 0.66, mz = m.z - Math.sin(m.rot) * z * 0.66;
    put(mShaft, i, mx, LAND_TOP, mz, 2.8 * on, z * 2.3 * s, 2.8 * on);
    put(mCap, i, mx, LAND_TOP + z * 2.3 * s, mz, 3.3 * on, z * 0.4 * s, 3.3 * on);
  }
  houses.forEach((_, i) => setHouse(i, 0));
  trees.forEach((_, i) => setTree(i, 0));
  mosques.forEach((_, i) => setMosque(i, 0));

  // ---------- placing: the landmark rises, then its neighborhood around it ----------
  const RISE = 700, GROW = 400;
  const rising = [];
  const easeOutBack = (k) => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2;
  const easeOut = (k) => 1 - (1 - k) ** 3;

  function placeLandmark(id, { animate = true } = {}) {
    const p = pieces.get(id);
    if (p.placed) return Promise.resolve();
    p.placed = true;
    p.outline.visible = false;
    scene.add(p.model);
    const k = landmarks.indexOf(p.lm);
    const runs = [
      { from: H.start[k], to: H.start[k + 1], lo: H.start[k], list: houses, delays: houseDelays, set: setHouse, meshes: [walls, roofs, plots] },
      { from: T.start[k], to: T.start[k + 1], lo: T.start[k], list: trees, delays: treeDelays, set: setTree, meshes: [crowns, cypresses] },
      { from: M.start[k], to: M.start[k + 1], lo: M.start[k], list: mosques, delays: mosqueDelays, set: setMosque, meshes: [mBase, mDome, mShaft, mCap] },
    ];
    if (!animate || reducedMotion) {
      for (const run of runs) {
        for (let i = run.from; i < run.to; i++) run.set(i, 1);
        upload(run.meshes, run.from, run.to);
      }
      return Promise.resolve();
    }
    p.model.position.y = p.y - p.model.userData.height - 2;
    const last = Math.max(0, ...runs.filter((run) => run.to > run.from).map((run) => run.delays[run.to - 1]));
    return new Promise((resolve) => rising.push({ p, runs, t0: performance.now(), end: RISE + last * 1000 + GROW, resolve }));
  }

  function upload(meshes, from, to) {
    if (to <= from) return;
    for (const mesh of meshes) {
      mesh.instanceMatrix.addUpdateRange(from * 16, (to - from) * 16);
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // each frame touches only what is growing in each rising neighborhood, plus what has just finished
  function stepRising(now) {
    for (let r = rising.length - 1; r >= 0; r--) {
      const a = rising[r], t = now - a.t0;
      const k = Math.min(1, t / RISE);
      a.p.model.position.y = a.p.y - (a.p.model.userData.height + 2) * (1 - easeOutBack(k));
      for (const run of a.runs) {
        const { hi, next } = riseWindow(run.delays.subarray(run.from, run.to), run.lo - run.from, t, RISE, GROW);
        const to = run.from + hi;
        for (let i = run.lo; i < to; i++) run.set(i, easeOut(Math.min(1, Math.max(0, (t - RISE - run.list[i].delay * 1000) / GROW))));
        upload(run.meshes, run.lo, to);
        run.lo = run.from + next;
      }
      if (t >= a.end) { a.p.model.position.y = a.p.y; rising.splice(r, 1); a.resolve(); }
    }
  }

  // the nearest point of a landmark's footprint to p (p itself when inside it)
  function nearestOnFootprint(id, p) {
    const f = pieces.get(id), c = Math.cos(f.angle), s = Math.sin(f.angle);
    const dx = p.x - f.x, dz = p.z - f.z;
    const lx = THREE.MathUtils.clamp(dx * c - dz * s, -f.w / 2, f.w / 2), lz = THREE.MathUtils.clamp(dx * s + dz * c, -f.d / 2, f.d / 2);
    return { x: f.x + lx * c + lz * s, z: f.z - lx * s + lz * c };
  }

  // ---------- camera and controls ----------
  const controls = new OrbitControls(camera, canvas);
  controls.enableRotate = false;
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = 0.12;
  controls.screenSpacePanning = false; // pan along the ground
  controls.zoomToCursor = true;
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };

  let base = 1; // the frustum's height at zoom 1: the widest view allowed
  const view = () => base / camera.zoom; // the visible height, in metres of the view plane
  const setView = (v) => { camera.zoom = base / v; camera.updateProjectionMatrix(); };
  const look = (target) => {
    controls.target.set(target.x, 0, target.z);
    camera.position.copy(controls.target).addScaledVector(TO_CAMERA, DISTANCE);
    camera.lookAt(controls.target);
  };

  // the view height that shows the whole frame at this aspect
  function viewAll() {
    camera.updateMatrixWorld();
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [LAND_TOP, -SLAB]) {
      const p = new THREE.Vector3(sx * WIDTH / 2, y, sz * HEIGHT / 2).sub(controls.target);
      const a = p.dot(right), b = p.dot(up);
      x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b);
    }
    const aspect = innerWidth / innerHeight;
    return Math.max(y1 - y0, (x1 - x0) / aspect) * 1.08;
  }

  // ---------- the miniature look: tilt-shift, so the city reads as a model on a table ----------
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType }));
  composer.addPass(new RenderPass(scene, camera));
  const tiltH = new ShaderPass(HorizontalTiltShiftShader), tiltV = new ShaderPass(VerticalTiltShiftShader);
  composer.addPass(tiltH);
  composer.addPass(tiltV);
  composer.addPass(new OutputPass());
  for (const pass of [tiltH, tiltV]) pass.uniforms.r.value = 0.5; // sharp through the middle, softening to the edges

  function resize() {
    const v = view();
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(innerWidth, innerHeight);
    tiltH.uniforms.h.value = 1.5 / innerWidth;
    tiltV.uniforms.v.value = 1.5 / innerHeight;
    const saved = controls.target.clone();
    look({ x: 0, z: 0 });
    base = Math.max(viewAll() * 1.15, 11000);
    look(saved);
    const aspect = innerWidth / innerHeight;
    Object.assign(camera, { left: -base * aspect / 2, right: base * aspect / 2, top: base / 2, bottom: -base / 2 });
    controls.minZoom = 1;
    controls.maxZoom = base / MIN_VIEW;
    setView(Math.min(Math.max(v, MIN_VIEW), base));
    fitShadow();
  }

  // keep the sun's shadow camera on what is in view, so shadows stay crisp at every zoom
  function fitShadow() {
    const half = Math.max(view() * Math.max(1, innerWidth / innerHeight) * 0.75, 600);
    Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 100, far: 14000 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.target.position.copy(controls.target);
    sun.position.copy(controls.target).addScaledVector(SUN, 6000);
  }

  // keep the target over the frame
  controls.addEventListener('change', () => {
    const t = controls.target;
    const x = THREE.MathUtils.clamp(t.x, -WIDTH / 2, WIDTH / 2), z = THREE.MathUtils.clamp(t.z, -HEIGHT / 2, HEIGHT / 2);
    if (x !== t.x || z !== t.z || t.y !== 0) {
      const d = new THREE.Vector3(x - t.x, -t.y, z - t.z);
      t.add(d);
      camera.position.add(d);
    }
    fitShadow();
  });

  // ---------- glides ----------
  let glide = null;
  controls.addEventListener('start', () => { if (glide) { glide.done(); glide = null; } });

  // views are sized to show at least so many metres across as well as up, so a tall phone sees enough
  function destination(target) {
    const aspect = innerWidth / innerHeight;
    if (target === 'all') return { x: 0, z: 0, v: allView() };
    if (target === 'start') return { ...toWorld(START.lat, START.lon), v: Math.max(START.view, START.across / aspect) };
    const lm = landmarks.find((l) => l.id === target);
    return { ...toWorld(lm.lat, lm.lon), v: Math.max(LANDMARK_VIEW, LANDMARK_ACROSS / aspect) };
  }
  function allView() {
    const saved = controls.target.clone();
    look({ x: 0, z: 0 });
    const v = viewAll();
    look(saved);
    return v;
  }

  function glideTo(target, { duration = 900 } = {}) {
    if (glide) glide.done();
    const to = destination(target);
    const from = { x: controls.target.x, z: controls.target.z, v: view() };
    if (reducedMotion || duration <= 0) {
      look(to); setView(Math.min(to.v, base)); controls.update(); fitShadow();
      glide = null;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const t0 = performance.now();
      glide = { from, to, t0, duration, done: () => { resolve(); } };
      glide.step = (now) => {
        const k = Math.min(1, (now - t0) / duration), e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
        look({ x: from.x + (to.x - from.x) * e, z: from.z + (to.z - from.z) * e });
        // zoom in view-height space along a log curve, so it feels even
        setView(Math.min(Math.exp(Math.log(from.v) + (Math.log(to.v) - Math.log(from.v)) * e), base));
        fitShadow();
        if (k === 1) { const g = glide; glide = null; g.done(); }
      };
    });
  }

  // ---------- picking ----------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -LAND_TOP);
  function setRay(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  }
  function screenToGround(clientX, clientY) {
    setRay(clientX, clientY);
    const p = ray.ray.intersectPlane(groundPlane, new THREE.Vector3());
    if (!p || Math.abs(p.x) > WIDTH / 2 || Math.abs(p.z) > HEIGHT / 2) return null;
    return { x: p.x, z: p.z };
  }
  // How far the pointer is from a landmark's footprint, in screen pixels (0 inside it). Measured on screen, because
  // the tilt shortens ground distances toward the camera, and a tap target should be as tall as it is wide.
  const corner = new THREE.Vector3();
  function pixelsTo(id, clientX, clientY) {
    const f = pieces.get(id), c = Math.cos(f.angle), s = Math.sin(f.angle), r = canvas.getBoundingClientRect();
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => {
      const lx = (u * f.w) / 2, lz = (v * f.d) / 2;
      corner.set(f.x + lx * c + lz * s, f.y + 7, f.z - lx * s + lz * c).project(camera);
      return [((corner.x + 1) / 2) * r.width + r.left, ((1 - corner.y) / 2) * r.height + r.top];
    });
    let inside = true, sign = 0, best = Infinity;
    for (let i = 0; i < 4; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % 4], dx = bx - ax, dy = by - ay;
      const cross = dx * (clientY - ay) - dy * (clientX - ax);
      if (cross !== 0) { if (sign && Math.sign(cross) !== sign) inside = false; sign = sign || Math.sign(cross); }
      const t = Math.max(0, Math.min(1, ((clientX - ax) * dx + (clientY - ay) * dy) / (dx * dx + dy * dy || 1)));
      best = Math.min(best, Math.hypot(clientX - ax - t * dx, clientY - ay - t * dy));
    }
    return inside ? 0 : best;
  }

  // the waiting outline under the pointer, counting anything within 22 px of one as a hit
  function pickOutline(clientX, clientY) {
    let best = null, bestD = 22;
    for (const [id, f] of pieces) {
      if (f.placed || !f.outline.visible) continue;
      const d = pixelsTo(id, clientX, clientY);
      if (d <= bestD) { best = id; bestD = d; }
    }
    return best;
  }

  // ---------- the loop ----------
  const frameFns = [];
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1), now = performance.now();
    if (glide) glide.step(now);
    else controls.update();
    if (rising.length) stepRising(now);
    if (!reducedMotion) {
      const o = 0.22 + 0.1 * Math.sin(now / 520);
      for (const f of pieces.values()) if (!f.placed) f.outline.userData.ghostMat.opacity = o;
    }
    for (const fn of frameFns) fn(dt, now);
    composer.render();
  });

  look({ x: 0, z: 0 });
  resize();
  glideTo('start', { duration: 0 });
  water.material.userData.time = water.material.userData.time || { value: 0 };
  frameFns.push((dt) => { if (!reducedMotion) water.material.userData.time.value += dt; });
  addEventListener('resize', resize);
  addEventListener('orientationchange', resize);

  return {
    three: THREE, scene, camera, renderer, controls, composer,
    glideTo, screenToGround, pixelsTo, setRay, ray,
    pickOutline, showOutline, placeLandmark, nearestOnFootprint,
    model: (id) => pieces.get(id).model,
    viewDir: TO_CAMERA.clone(), sunDir: SUN.clone(),
    onFrame: (fn) => frameFns.push(fn),
    view, resize,
  };
}

// The slab's sides, cell by cell: sand under land, deep teal under water.
function slabEdge(land) {
  const pos = [], col = [];
  const cLand = new THREE.Color(COLORS.landSide), cWater = new THREE.Color(COLORS.waterSide);
  const quad = (ax, az, bx, bz, top, c) => {
    const v = [[ax, top, az], [bx, top, bz], [bx, -SLAB, bz], [ax, top, az], [bx, -SLAB, bz], [ax, -SLAB, az]];
    for (const p of v) { pos.push(...p); col.push(c.r, c.g, c.b); }
  };
  const W = WIDTH / 2, H = HEIGHT / 2, n = land.cell;
  for (let c = 0; c < land.cols; c++) {
    const x0 = -W + c * n, x1 = Math.min(W, x0 + n);
    if (x0 >= W) break;
    const s = land.region[(land.rows - 1) * land.cols + c], nn = land.region[c];
    quad(x0, H, x1, H, s ? LAND_TOP : 0, s ? cLand : cWater); // south edge, facing the camera
    quad(x1, -H, x0, -H, nn ? LAND_TOP : 0, nn ? cLand : cWater);
  }
  for (let r = 0; r < land.rows; r++) {
    const z0 = -H + r * n, z1 = Math.min(H, z0 + n);
    if (z0 >= H) break;
    const w = land.region[r * land.cols], e = land.region[r * land.cols + land.cols - 1];
    quad(-W, z0, -W, z1, w ? LAND_TOP : 0, w ? cLand : cWater); // west edge, facing the camera
    quad(W, z1, W, z0, e ? LAND_TOP : 0, e ? cLand : cWater);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }));
}

// Darken a geometry toward its base: vertex colours from `dark` at y = 0 up to full at the top.
function shadeBase(geo, dark) {
  const pos = geo.attributes.position, col = [];
  for (let i = 0; i < pos.count; i++) { const k = dark + (1 - dark) * Math.min(1, Math.max(0, pos.getY(i))); col.push(k, k, k); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

// The water: deep turquoise in the channels, paler over the shallows, a ring of foam that breathes along the shore,
// and slow ripples. How near the shore each point is comes from land.json, as a small texture.
function waterMaterial(land) {
  const R = 4; // cells of shallows, 160 m
  const dist = new Float32Array(land.region.length).fill(R);
  const queue = [];
  land.region.forEach((r, i) => { if (r) { dist[i] = 0; queue.push(i); } });
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q], c = i % land.cols, r = Math.floor(i / land.cols);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const cc = c + dc, rr = r + dr;
      if (cc < 0 || rr < 0 || cc >= land.cols || rr >= land.rows) continue;
      const j = rr * land.cols + cc;
      if (dist[j] > dist[i] + 1) { dist[j] = dist[i] + 1; queue.push(j); }
    }
  }
  const data = new Uint8Array(dist.length);
  dist.forEach((d, i) => { data[i] = Math.round(255 * Math.max(0, 1 - d / R)); });
  const shore = new THREE.DataTexture(data, land.cols, land.rows, THREE.RedFormat);
  shore.magFilter = shore.minFilter = THREE.LinearFilter;
  shore.needsUpdate = true;

  const mat = new THREE.MeshStandardMaterial({ color: COLORS.water, roughness: 0.32, metalness: 0 });
  mat.userData.time = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = mat.userData.time;
    shader.uniforms.uShore = { value: shore };
    shader.uniforms.uFrame = { value: new THREE.Vector2(land.cols * land.cell, land.rows * land.cell) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWPos;
uniform float uTime;
uniform sampler2D uShore;
uniform vec2 uFrame;
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1, 0)), u.x), mix(hash2(i + vec2(0, 1)), hash2(i + vec2(1, 1)), u.x), u.y);
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
vec2 suv = vec2(vWPos.x / uFrame.x + 0.5, vWPos.z / uFrame.y + 0.5);
float near = texture2D(uShore, suv).r;
float n = vnoise(vWPos.xz * 0.011 + vec2(uTime * 0.06, uTime * 0.04)) + 0.5 * vnoise(vWPos.xz * 0.034 - vec2(uTime * 0.1, -uTime * 0.07));
diffuseColor.rgb = mix(diffuseColor.rgb * 0.82, vec3(0.13, 0.43, 0.45), smoothstep(0.2, 1.0, near) * 0.7);
diffuseColor.rgb *= 0.94 + 0.09 * n;
float foam = smoothstep(0.84, 0.95, near + 0.05 * sin(uTime * 1.2 + n * 5.0));
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.92, 0.86), foam * 0.8);`);
  };
  return mat;
}
