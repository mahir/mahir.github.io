// The renderer and everything in it: sky, land, clouds, the sun and the white line of the opening chart. main.js
// hands it a range to show and, every frame, a camera pose and how far along the beats are.

import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { createSky } from './sky.js';
import { createLand } from './land.js';
import { createClouds } from './clouds.js';
import { sunDirection } from './weather.js';
import { FLOOR, TREE_LINE, SNOW_LINE } from './scale.js';

const srgb = (c, rgb) => c.setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace);

export function createScene(canvas, { small }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 10, 1e5);

  const U = {
    uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uHaze: { value: new THREE.Color() }, uHazeSun: { value: new THREE.Color() }, uHorizonSun: { value: new THREE.Color() }, uSunGlow: { value: new THREE.Color() },
    uBeta: { value: 1e-4 }, uHazeH: { value: 2000 }, uFar: { value: 1e5 }, uNight: { value: 1 }, uNightCol: { value: new THREE.Color(0x0d0f12).convertSRGBToLinear() },
    uCover: { value: 0.5 }, uTime: { value: 0 }, uCloudScale: { value: 2600 }, uWind: { value: new THREE.Vector2(0.004, 0.0015) },
    uCloudBase: { value: 2000 }, uRise: { value: 0 }, uStretch: { value: 1 }, uFloor: { value: FLOOR },
    uTreeLine: { value: TREE_LINE }, uSnowLine: { value: SNOW_LINE },
    uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSunCol: { value: new THREE.Color() },
    uHigh: { value: 0 }, uCloudDark: { value: 0 }, uDisk: { value: 1 }, uSkyCover: { value: 0 }, uSkyTime: { value: 0 },
    uSunI: { value: 1 }, uAmb: { value: new THREE.Color() },
    uHeight: { value: null }, uRect: { value: new THREE.Vector4(0, 0, 1, 1) }, uCenter: { value: new THREE.Vector2() }, uRadius: { value: 1 },
  };

  const sky = createSky(U);
  const land = createLand(U);
  const clouds = createClouds(U);
  scene.add(sky.mesh, land.mesh, land.skirt, ...clouds.layers);
  // the land and clouds stay out of the opening chart until their shaders are compiled
  const hideLand = (hidden) => { for (const m of [land.mesh, land.skirt, ...clouds.layers]) m.visible = !hidden; };
  hideLand(true);

  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 2048 : 4096, small ? 2048 : 4096);
  scene.add(sun, sun.target);

  const lineMaterial = new LineMaterial({ color: 0xffffff, linewidth: 2, transparent: true, depthTest: false, worldUnits: false });
  const line = new Line2(new LineGeometry(), lineMaterial);
  line.renderOrder = 10;
  line.frustumCulled = false;
  scene.add(line);
  let segments = 0;

  let weather = null, terrain = null, L = 1;
  const center = new THREE.Vector3();

  function setWeather(w, scale) {
    weather = w;
    L = scale.L;
    const dir = sunDirection(w);
    U.uSunDir.value.set(...dir);
    srgb(U.uHaze.value, w.haze);
    srgb(U.uHazeSun.value, w.hazeSun);
    srgb(U.uZenith.value, w.zenith);
    srgb(U.uHorizon.value, w.horizon);
    srgb(U.uHorizonSun.value, w.horizonSun);
    srgb(U.uSunCol.value, w.sun);
    U.uSunGlow.value.copy(U.uSunCol.value).multiplyScalar(w.glow);
    U.uAmb.value.copy(U.uHorizon.value).lerp(U.uZenith.value, 0.35);
    U.uBeta.value = 3 / w.visibility;
    U.uHazeH.value = w.hazeHeight;
    U.uCover.value = w.cloudCover;
    U.uSkyCover.value = w.cloudCover;
    U.uCloudBase.value = w.cloudBase;
    U.uCloudDark.value = w.cloudDark;
    U.uHigh.value = w.highClouds;
    U.uDisk.value = (1 - w.cloudCover) ** 1.5;
    U.uSunI.value = w.sunIntensity;
    U.uCloudScale.value = Math.max(1800, 0.11 * L);
    srgb(sun.color, w.sun);
    renderer.toneMappingExposure = w.exposure;
    clouds.place(L, w.cloudBase);
    scene.environment = sky.environment(renderer);
  }

  function setLine(positions) {
    const g = new LineGeometry();
    g.setPositions(positions);
    line.geometry.dispose();
    line.geometry = g;
    segments = positions.length / 3 - 1;
    g.instanceCount = 0;
  }

  // the land from the worker, and a small heightmap so the clouds can thin where peaks break through
  function setTerrain(t, heightAt) {
    terrain = t;
    hideLand(true);
    land.setTerrain(t);
    const n = 256, x0 = t.xs[0], z0 = t.zs[0], w = t.xs[t.cols - 1] - x0, d = t.zs[t.rows - 1] - z0;
    const data = new Uint16Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) data[j * n + i] = THREE.DataUtils.toHalfFloat(heightAt(x0 + (i / (n - 1)) * w, z0 + (j / (n - 1)) * d));
    U.uHeight.value?.dispose();
    const tex = new THREE.DataTexture(data, n, n, THREE.RedFormat, THREE.HalfFloatType);
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    U.uHeight.value = tex;
    U.uRect.value.set(x0, z0, 1 / w, 1 / d);
    U.uCenter.value.set(L / 2, -0.2 * L);
    U.uRadius.value = 2.4 * L;
    center.set(L / 2, 0, -0.2 * L);
    fitShadow();
  }

  // Compile the land's and clouds' shaders without holding up the page, then let them show.
  async function prepare() {
    try { await renderer.compileAsync(scene, camera); } catch { /* compiles on first draw instead */ }
    hideLand(false);
  }

  // the sun's shadow camera, tight around the land as the sun sees it
  function fitShadow() {
    if (!terrain) return;
    const dir = U.uSunDir.value.clone();
    if (dir.y < 0.03) dir.y = 0.03;
    dir.normalize();
    sun.target.position.copy(center);
    sun.position.copy(center).addScaledVector(dir, 3 * L);
    sun.updateMatrixWorld();
    sun.target.updateMatrixWorld();
    const cam = sun.shadow.camera;
    cam.position.copy(sun.position);
    cam.lookAt(center);
    cam.updateMatrixWorld();
    const inv = cam.matrixWorldInverse;
    const box = new THREE.Box3();
    const xs = [terrain.xs[0], terrain.xs[terrain.cols - 1]], zs = [terrain.zs[0], terrain.zs[terrain.rows - 1]], ys = [0, terrain.maxH];
    for (const x of xs) for (const y of ys) for (const z of zs) box.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(inv));
    cam.left = box.min.x; cam.right = box.max.x; cam.bottom = box.min.y; cam.top = box.max.y;
    cam.near = Math.max(1, -box.max.z - 10); cam.far = -box.min.z + 10;
    cam.updateProjectionMatrix();
    const texel = (box.max.x - box.min.x) / sun.shadow.mapSize.x;
    sun.shadow.normalBias = texel * 1.2;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 2;
    renderer.shadowMap.needsUpdate = true;
  }

  const lookAt = new THREE.Vector3();
  let shadowDirty = 0;
  function frame({ pose, beats, stretch, time }) {
    if (!weather) return;
    const day = beats.day;
    U.uNight.value = 1 - day;
    U.uRise.value = beats.rise;
    U.uStretch.value = stretch;
    U.uTime.value = time;
    U.uSkyTime.value = time;
    sun.intensity = weather.sunIntensity * day;
    scene.environmentIntensity = weather.envIntensity * day;

    line.scale.y = stretch;
    line.position.y = FLOOR * (1 - stretch) + 2;
    line.geometry.instanceCount = Math.round(segments * beats.draw);
    lineMaterial.opacity = beats.line;
    line.visible = beats.line > 0.001;

    clouds.update(pose.pos[1], day);

    camera.position.set(...pose.pos);
    lookAt.set(...pose.target);
    camera.lookAt(lookAt);
    camera.fov = pose.fov;
    const dist = camera.position.distanceTo(lookAt);
    camera.near = Math.min(2000, Math.max(8, dist * 0.004));
    camera.far = dist + 12 * L;
    camera.updateProjectionMatrix();
    U.uFar.value = camera.far;

    // while the land rises its shadows move; after that they stay put
    const moving = beats.rise < 1 || stretch > 1.0001;
    if (moving || shadowDirty-- > 0) renderer.shadowMap.needsUpdate = true;
    if (moving) shadowDirty = 2;
    renderer.render(scene, camera);
  }

  // a world point on screen, in CSS pixels
  const v = new THREE.Vector3();
  function project(p) {
    v.set(p[0], p[1], p[2]).project(camera);
    const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, visible: v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2 };
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    lineMaterial.resolution.set(w, h);
    return w / h;
  }

  return { renderer, camera, setWeather, setLine, setTerrain, prepare, frame, project, resize, fitShadow };
}
