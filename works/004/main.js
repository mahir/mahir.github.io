// No. 004 boots here: the land grid, the city that will grow on it, then the scene. Without WebGL, or if anything
// fails to load, the page shows a still of the finished city and the landmarks as a list.

import { parseLand } from './geo.js';
import { LANDMARKS } from './landmarks.js';
import { assignOwners, makeCity } from './city.js';

const root = document.documentElement;
root.classList.replace('no-js', 'js');
const params = new URLSearchParams(location.search);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 700;

try {
  const res = await fetch(new URL('./land.json', import.meta.url));
  if (!res.ok) throw new Error(`land.json: ${res.status}`);
  const land = parseLand(await res.json());
  const owners = assignOwners(land, LANDMARKS);
  const city = makeCity(land, owners, LANDMARKS);
  const { startScene } = await import('./scene.js');
  const scene = await startScene(document.getElementById('scene'), { land, landmarks: LANDMARKS, city, owners, reducedMotion, small });
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));
  if (params.has('dev')) window.__scene = scene;
} catch (err) {
  console.warn(err);
  root.classList.add('no-gl');
}
