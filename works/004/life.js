// Life on the water and the bridges, from the first moment: small boats idle in loops, ferries cross on their lines
// and gulls wheel over Eminönü and Karaköy, every boat drawing a pale wake. Once a bridge is placed its traffic
// starts (and the red-and-white tram on Galata Bridge); when the last landmark is in, more gulls come out.
// With reduced motion everything is placed and still, and the gulls stay away.

import { toWorld } from './geo.js';
import { ROUTES, BOAT_LOOPS } from './routes.js';
import { LANDMARKS } from './landmarks.js';
import { PALETTE } from './models.js';

const CROSSING = 25, PAUSE = 4; // seconds
const GULL_SPOTS = [[41.0195, 28.9760], [41.0222, 28.9785]];
const MORE_GULLS = [[41.0256, 28.9741], [41.0211, 29.0041], [41.0086, 28.9802]]; // over Galata, Maiden's Tower, Sultanahmet
const CAR_COLOURS = [0xf2c12e, 0xf2c12e, 0xf8f4ec, 0xc1381e, 0x3d6f9a, 0x2c2a2a]; // taxis first

export function createLife(THREE, view, { reducedMotion }) {
  const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const box = (w, h, d, m, y = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), m); b.position.y = y; return b; };
  const white = mat(PALETTE.white), cream = mat(0xefe4cc), red = mat(PALETTE.red), dark = mat(0x2c2a2a);
  const cabins = [mat(PALETTE.red), mat(0x3d6f9a), mat(PALETTE.white), mat(0xe8b84a)];
  const group = new THREE.Group();
  view.scene.add(group);

  // a wake: a pale V that fades behind the stern
  const wakeTex = (() => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 32;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 128, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(255,255,255,0.85)');
    g.fillStyle = grad;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(128, 12); g.lineTo(128, 20); g.lineTo(0, 32); g.closePath(); g.fill();
    return new THREE.CanvasTexture(c);
  })();
  function wake(length, width) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(length, width).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: wakeTex, transparent: true, depthWrite: false, fog: true }));
    m.position.set(-length / 2, 0.8, 0); // behind: boats face local +x
    return m;
  }

  // ---------- small boats ----------
  const boats = BOAT_LOOPS.map((b, i) => {
    const mesh = new THREE.Group();
    mesh.add(box(34, 4, 10, white), box(12, 5, 7, cabins[i % 4], 4), wake(110, 26));
    mesh.children[1].position.x = -4;
    group.add(mesh);
    return { mesh, c: toWorld(b.lat, b.lon), rx: b.rx, rz: b.rz, a: i * 1.7, speed: (0.05 + 0.015 * (i % 3)) * (i % 2 ? 1 : -1) };
  });

  // ---------- ferries ----------
  function ferryMesh() {
    const f = new THREE.Group();
    f.add(box(90, 6, 20, white), box(82, 8, 18, white, 6), box(58, 6, 16, cream, 14));
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 11, 10).translate(0, 5.5, 0), red);
    funnel.position.y = 20;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 2, 10), dark);
    band.position.y = 30;
    f.add(funnel, band);
    f.traverse((o) => { if (o.isMesh && o.material !== undefined && !o.material.transparent) o.castShadow = true; });
    const w = wake(260, 60);
    f.add(w);
    f.userData.wake = w;
    return f;
  }
  // a route as points with the distance along it at each
  function track(points) {
    const at = [0];
    for (let i = 1; i < points.length; i++) at.push(at[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z));
    return { pts: points, at, length: at[at.length - 1] };
  }
  function pointAt(tr, d) {
    let i = 1;
    while (i < tr.pts.length - 1 && tr.at[i] < d) i++;
    const a = tr.pts[i - 1], b = tr.pts[i], k = (d - tr.at[i - 1]) / (tr.at[i] - tr.at[i - 1]);
    return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, y: (a.y ?? 0) + ((b.y ?? 0) - (a.y ?? 0)) * k, heading: Math.atan2(b.z - a.z, b.x - a.x) };
  }
  const smooth = (k) => k * k * (3 - 2 * k);
  const ferries = ROUTES.map((r, i) => {
    const mesh = ferryMesh();
    group.add(mesh);
    return { mesh, track: track(r.stops.map(([lat, lon]) => toWorld(lat, lon))), offset: i * 13 };
  });

  // ---------- gulls ----------
  const gulls = [];
  function addGulls(spots, count, seed) {
    if (reducedMotion) return;
    for (let i = 0; i < count; i++) {
      const [lat, lon] = spots[i % spots.length];
      const g = new THREE.Group();
      const wing = new THREE.BoxGeometry(9, 0.6, 3);
      const left = new THREE.Mesh(wing.clone().translate(-4.5, 0, 0), white), right = new THREE.Mesh(wing.clone().translate(4.5, 0, 0), white);
      g.add(left, right, new THREE.Mesh(new THREE.BoxGeometry(2, 2, 6), white));
      g.userData = { left, right };
      group.add(g);
      const k = i + seed;
      gulls.push({ mesh: g, c: toWorld(lat, lon), r: 60 + (k * 37) % 140, h: 50 + (k * 23) % 60, a0: k * 0.9, speed: (0.25 + (k % 4) * 0.08) * (k % 3 ? 1 : -1) });
    }
  }
  addGulls(GULL_SPOTS, 12, 0);

  // ---------- traffic on the bridges, once each is in ----------
  const lanes = [];
  function deckHeight(id, u, half) {
    if (id === 'galata-bridge') return 18;
    const towerX = half * 0.68; // as in models.js: level between the towers, sloping to the shores
    const x = Math.abs(u);
    return x <= towerX ? 100 : 100 + (24 - 100) * ((x - towerX) / (half - towerX));
  }
  function startTraffic(id) {
    const lm = LANDMARKS.find((l) => l.id === id);
    const a = toWorld(...lm.from), b = toWorld(...lm.to);
    const len = Math.hypot(b.x - a.x, b.z - a.z), dx = (b.x - a.x) / len, dz = (b.z - a.z) / len;
    const nx = -dz, nz = dx; // across the deck
    const lane = (offset, reverse) => {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const u = (i / 16) * len, along = reverse ? len - u : u;
        pts.push({ x: a.x + dx * along + nx * offset, z: a.z + dz * along + nz * offset, y: deckHeight(id, along - len / 2, len / 2) + 1 });
      }
      return track(pts);
    };
    const cars = [];
    for (const [offset, reverse] of [[-14, false], [-7, false], [7, true], [14, true]]) {
      const tr = lane(id === 'galata-bridge' ? offset * 1.6 : offset, reverse);
      for (let k = 0; k < 4; k++) {
        const car = box(9, 4, 4.5, mat(CAR_COLOURS[(k + cars.length) % CAR_COLOURS.length]));
        group.add(car);
        cars.push({ mesh: car, track: tr, d: (k / 4 + (offset > 0 ? 0.1 : 0)) * tr.length, speed: 16 + ((k * 7) % 5) * 2 });
      }
    }
    if (id === 'galata-bridge') {
      const tram = new THREE.Group();
      tram.add(box(34, 6, 5, white), box(34, 1.6, 5.2, red, 1.2));
      group.add(tram);
      cars.push({ mesh: tram, track: lane(0, false), d: 0, speed: 9, shuttle: true });
    }
    lanes.push(...cars);
    place();
  }

  let t = 0;
  function place() {
    for (const b of boats) {
      const x = b.c.x + b.rx * Math.cos(b.a), z = b.c.z + b.rz * Math.sin(b.a);
      b.mesh.position.set(x, 0, z);
      // face along the loop
      b.mesh.rotation.y = -Math.atan2(b.rz * Math.cos(b.a) * Math.sign(b.speed), -b.rx * Math.sin(b.a) * Math.sign(b.speed));
    }
    for (const f of ferries) {
      const period = 2 * (CROSSING + PAUSE), p = (t + f.offset) % period;
      let d, back = false, moving = 0;
      if (p < CROSSING) { d = f.track.length * smooth(p / CROSSING); moving = Math.sin(Math.PI * p / CROSSING); }
      else if (p < CROSSING + PAUSE) d = f.track.length;
      else if (p < 2 * CROSSING + PAUSE) { const k = (p - CROSSING - PAUSE) / CROSSING; d = f.track.length * (1 - smooth(k)); back = true; moving = Math.sin(Math.PI * k); }
      else { d = 0; back = true; }
      const q = pointAt(f.track, Math.min(Math.max(d, 0.01), f.track.length - 0.01));
      f.mesh.position.set(q.x, 0, q.z);
      f.mesh.rotation.y = -q.heading + (back ? Math.PI : 0);
      f.mesh.userData.wake.material.opacity = moving;
    }
    for (const g of gulls) {
      const a = g.a0 + t * g.speed;
      g.mesh.position.set(g.c.x + g.r * Math.cos(a), g.h + 6 * Math.sin(t * 0.7 + g.a0), g.c.z + g.r * Math.sin(a));
      g.mesh.rotation.y = g.speed > 0 ? Math.PI - a : -a; // nose (local -z) along the circle
      g.mesh.rotation.z = Math.sign(g.speed) * 0.25;
      const flap = 0.45 * Math.sin(t * 7 + g.a0 * 5);
      g.mesh.userData.left.rotation.z = flap;
      g.mesh.userData.right.rotation.z = -flap;
    }
    for (const c of lanes) {
      let d = c.d % c.track.length, flip = false;
      if (c.shuttle) { const span = c.track.length, k = c.d % (2 * span); d = k < span ? k : 2 * span - k; flip = k >= span; }
      const q = pointAt(c.track, Math.min(Math.max(d, 0.01), c.track.length - 0.01));
      c.mesh.position.set(q.x, q.y, q.z);
      c.mesh.rotation.y = -q.heading + (flip ? Math.PI : 0);
    }
  }

  place();
  return {
    placed(id) { if (id === 'galata-bridge' || id === 'bosphorus-bridge') startTraffic(id); },
    finish() { addGulls(MORE_GULLS, 18, 40); place(); },
    update(dt) {
      if (reducedMotion) return;
      t += dt;
      for (const b of boats) b.a += b.speed * dt;
      for (const c of lanes) c.d += c.speed * dt;
      place();
    },
  };
}
