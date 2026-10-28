// Life on the water. Small boats idle in loops from the start; when the last landmark is in, the ferries start
// their crossings and the gulls come out over Eminönü and Karaköy. With reduced motion everything is placed and still,
// and the gulls stay away.

import { toWorld } from './geo.js';
import { ROUTES, BOAT_LOOPS } from './routes.js';
import { PALETTE } from './models.js';

const CROSSING = 25, PAUSE = 4; // seconds
const GULL_SPOTS = [[41.0195, 28.9760], [41.0222, 28.9785]];

export function createLife(THREE, view, { reducedMotion }) {
  const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const box = (w, h, d, m, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), m); b.position.y = y; return b; };
  const white = mat(PALETTE.white), cream = mat(0xefe4cc), red = mat(PALETTE.red), dark = mat(0x2c2a2a);
  const cabins = [mat(PALETTE.red), mat(0x3d6f9a), mat(PALETTE.white), mat(0xe8b84a)];
  const group = new THREE.Group();
  view.scene.add(group);

  // ---------- small boats ----------
  const boats = BOAT_LOOPS.map((b, i) => {
    const mesh = new THREE.Group();
    mesh.add(box(34, 4, 10, white, 0), box(12, 5, 7, cabins[i % 4], 4));
    mesh.children[1].position.x = -4;
    group.add(mesh);
    return { mesh, c: toWorld(b.lat, b.lon), rx: b.rx, rz: b.rz, a: i * 1.7, speed: (0.05 + 0.015 * (i % 3)) * (i % 2 ? 1 : -1) };
  });

  // ---------- ferries ----------
  function ferryMesh() {
    const f = new THREE.Group();
    f.add(box(90, 6, 20, white, 0), box(82, 8, 18, white, 6), box(58, 6, 16, cream, 14));
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 11, 10).translate(0, 5.5, 0), red);
    funnel.position.y = 20;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 2, 10), dark);
    band.position.y = 30;
    f.add(funnel, band);
    f.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return f;
  }
  // a route as points with the distance along it at each
  function track(stops) {
    const pts = stops.map(([lat, lon]) => toWorld(lat, lon));
    const at = [0];
    for (let i = 1; i < pts.length; i++) at.push(at[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    return { pts, at, length: at[at.length - 1] };
  }
  function pointAt(tr, d) {
    let i = 1;
    while (i < tr.pts.length - 1 && tr.at[i] < d) i++;
    const a = tr.pts[i - 1], b = tr.pts[i], k = (d - tr.at[i - 1]) / (tr.at[i] - tr.at[i - 1]);
    return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, heading: Math.atan2(b.z - a.z, b.x - a.x) };
  }
  const smooth = (k) => k * k * (3 - 2 * k);
  let ferries = [];

  // ---------- gulls ----------
  let gulls = [];
  function gullMesh() {
    const g = new THREE.Group();
    const wing = new THREE.BoxGeometry(9, 0.6, 3);
    const left = new THREE.Mesh(wing.clone().translate(-4.5, 0, 0), white), right = new THREE.Mesh(wing.clone().translate(4.5, 0, 0), white);
    g.add(left, right, new THREE.Mesh(new THREE.BoxGeometry(2, 2, 6), white));
    g.userData = { left, right };
    return g;
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
      let d, back = false;
      if (p < CROSSING) d = f.track.length * smooth(p / CROSSING);
      else if (p < CROSSING + PAUSE) d = f.track.length;
      else if (p < 2 * CROSSING + PAUSE) { d = f.track.length * (1 - smooth((p - CROSSING - PAUSE) / CROSSING)); back = true; }
      else { d = 0; back = true; }
      const q = pointAt(f.track, Math.min(Math.max(d, 0.01), f.track.length - 0.01));
      f.mesh.position.set(q.x, 0, q.z);
      f.mesh.rotation.y = -q.heading + (back ? Math.PI : 0);
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
  }

  function finish() {
    if (ferries.length) return;
    ferries = ROUTES.map((r, i) => {
      const mesh = ferryMesh();
      group.add(mesh);
      return { mesh, track: track(r.stops), offset: i * 13 };
    });
    if (!reducedMotion) {
      gulls = Array.from({ length: 12 }, (_, i) => {
        const [lat, lon] = GULL_SPOTS[i % 2];
        const mesh = gullMesh();
        group.add(mesh);
        return { mesh, c: toWorld(lat, lon), r: 60 + (i * 37) % 140, h: 50 + (i * 23) % 60, a0: i * 0.9, speed: (0.25 + (i % 4) * 0.08) * (i % 3 ? 1 : -1) };
      });
    }
    place();
  }

  place();
  return {
    finish,
    update(dt) {
      if (reducedMotion) return;
      t += dt;
      for (const b of boats) b.a += b.speed * dt;
      place();
    },
  };
}
