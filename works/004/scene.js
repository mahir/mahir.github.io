// The scene: the frame as a slab of land and water under a warm afternoon sun, seen from high in the south-southwest
// through an orthographic camera, so it reads like the puzzle. The view pans and zooms but never turns.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { toWorld, WIDTH, HEIGHT } from './geo.js';
import { buildLandmark, buildOutline, PALETTE } from './models.js';

const HEADING = 20 * Math.PI / 180; // the camera looks north-northeast
const ELEVATION = 40 * Math.PI / 180;
const TO_CAMERA = new THREE.Vector3(-Math.sin(HEADING) * Math.cos(ELEVATION), Math.sin(ELEVATION), Math.cos(HEADING) * Math.cos(ELEVATION));
const SUN = new THREE.Vector3(-0.757, 0.574, 0.314).normalize(); // west-southwest, 35° up
const DISTANCE = 14000;
const MIN_VIEW = 500; // the closest view, in metres of view height
const LANDMARK_VIEW = 1400, LANDMARK_ACROSS = 1000;
// small screens open on the mouth of the Golden Horn: the peninsula's tip, Galata and Üsküdar
const START = { lat: 41.0200, lon: 28.9925, view: 2600, across: 3400 };
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

  // ---------- light ----------
  // sky and sun together light a level surface at about π, so tops show the palette's own colours
  scene.add(new THREE.HemisphereLight(0xfffaf2, 0xb8a888, 1.9));
  const sun = new THREE.DirectionalLight(0xfff3e0, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);

  // ---------- water, land and the slab's edge ----------
  const water = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH, HEIGHT),
    new THREE.MeshStandardMaterial({ color: COLORS.water, roughness: 0.35, metalness: 0 }));
  water.rotation.x = -Math.PI / 2;
  water.receiveShadow = true;
  scene.add(water);

  const landCells = [];
  land.region.forEach((r, i) => { if (r) landCells.push(i); });
  const ground = new THREE.InstancedMesh(new THREE.BoxGeometry(land.cell, LAND_TOP, land.cell),
    new THREE.MeshStandardMaterial({ color: COLORS.land, roughness: 1 }), landCells.length);
  const m = new THREE.Matrix4();
  landCells.forEach((i, k) => { const c = land.center(i); ground.setMatrixAt(k, m.makeTranslation(c.x, LAND_TOP / 2, c.z)); });
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

  // ---------- the ordinary city, all of it waiting at scale 0 ----------
  const { houses, trees } = city;
  const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    new THREE.MeshStandardMaterial({ roughness: 0.9 }), houses.length);
  const roofs = new THREE.InstancedMesh(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0),
    new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true }), houses.length);
  const canopy = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), trees.length);
  const tint = new THREE.Color();
  houses.forEach((h, i) => {
    walls.setColorAt(i, tint.setHex(PALETTE.walls[h.wall]));
    roofs.setColorAt(i, tint.setHex(PALETTE.roofs[h.roof]));
  });
  trees.forEach((t, i) => canopy.setColorAt(i, tint.setHex(PALETTE.trees[i % 3])));
  for (const mesh of [walls, roofs, canopy]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false; // instances start at scale 0, so a bounding sphere taken early would be wrong
    scene.add(mesh);
  }
  const byOwner = landmarks.map(() => ({ houses: [], trees: [] }));
  houses.forEach((h, i) => byOwner[h.owner].houses.push(i));
  trees.forEach((t, i) => byOwner[t.owner].trees.push(i));

  const o3 = new THREE.Object3D();
  const put = (mesh, i, x, y, z, sx, sy, sz) => {
    o3.position.set(x, y, z);
    o3.scale.set(sx || 1e-5, sy || 1e-5, sz || 1e-5);
    o3.updateMatrix();
    mesh.setMatrixAt(i, o3.matrix);
  };
  function setHouse(i, s) {
    const h = houses[i], spread = 0.7 + 0.3 * s, roofH = Math.min(h.w, h.d) * 0.38;
    put(walls, i, h.x, LAND_TOP, h.z, h.w * spread * (s > 0), h.h * s, h.d * spread * (s > 0));
    put(roofs, i, h.x, LAND_TOP + h.h * s, h.z, h.w * spread * (s > 0), roofH * s, h.d * spread * (s > 0));
  }
  function setTree(i, s) {
    const t = trees[i];
    put(canopy, i, t.x, LAND_TOP + t.r * 0.9 * s, t.z, t.r * s, t.r * 1.1 * s, t.r * s);
  }
  houses.forEach((_, i) => setHouse(i, 0));
  trees.forEach((_, i) => setTree(i, 0));

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
    const hood = byOwner[landmarks.indexOf(p.lm)];
    if (!animate || reducedMotion) {
      hood.houses.forEach((i) => setHouse(i, 1));
      hood.trees.forEach((i) => setTree(i, 1));
      for (const mesh of [walls, roofs, canopy]) mesh.instanceMatrix.needsUpdate = true;
      return Promise.resolve();
    }
    p.model.position.y = p.y - p.model.userData.height - 2;
    let last = 0;
    for (const i of hood.houses) last = Math.max(last, houses[i].delay);
    for (const i of hood.trees) last = Math.max(last, trees[i].delay);
    return new Promise((resolve) => rising.push({ p, hood, t0: performance.now(), end: RISE + last * 1000 + GROW, resolve }));
  }

  function stepRising(now) {
    for (let r = rising.length - 1; r >= 0; r--) {
      const a = rising[r], t = now - a.t0;
      const k = Math.min(1, t / RISE);
      a.p.model.position.y = a.p.y - (a.p.model.userData.height + 2) * (1 - easeOutBack(k));
      const grow = (delay) => easeOut(Math.min(1, Math.max(0, (t - RISE - delay * 1000) / GROW)));
      a.hood.houses.forEach((i) => setHouse(i, grow(houses[i].delay)));
      a.hood.trees.forEach((i) => setTree(i, grow(trees[i].delay)));
      for (const mesh of [walls, roofs, canopy]) mesh.instanceMatrix.needsUpdate = true;
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

  function resize() {
    const v = view();
    renderer.setSize(innerWidth, innerHeight, false);
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
    if (target === 'start') return small ? { ...toWorld(START.lat, START.lon), v: Math.max(START.view, START.across / aspect) } : { x: 0, z: 0, v: allView() };
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
  const pxToMetres = (px) => px * view() / canvas.clientHeight;

  // the waiting outline under the pointer, counting anything within 22 px of one as a hit
  function pickOutline(clientX, clientY) {
    const p = screenToGround(clientX, clientY);
    if (!p) return null;
    let best = null, bestD = pxToMetres(22);
    for (const [id, f] of pieces) {
      if (f.placed || !f.outline.visible) continue;
      const q = nearestOnFootprint(id, p), d = Math.hypot(q.x - p.x, q.z - p.z);
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
    renderer.render(scene, camera);
  });

  look({ x: 0, z: 0 });
  resize();
  glideTo('start', { duration: 0 });
  addEventListener('resize', resize);
  addEventListener('orientationchange', resize);

  return {
    three: THREE, scene, camera, renderer, controls,
    glideTo, screenToGround, pxToMetres, setRay, ray,
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
