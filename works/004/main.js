// No. 004 boots here: the land grid, the city that will grow on it, then the scene. Without WebGL, or if anything
// fails to load, the page shows a still of the finished city and the landmarks as a list.

import { parseLand } from './geo.js';
import { LANDMARKS } from './landmarks.js';
import { assignOwners, makeCity } from './city.js';
import { createGame } from './game.js';

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
  const [{ startScene }, { createLife }, { startUI }] = await Promise.all([import('./scene.js'), import('./life.js'), import('./ui.js')]);
  const scene = await startScene(document.getElementById('scene'), { land, landmarks: LANDMARKS, city, owners, reducedMotion, small });
  const life = createLife(scene.three, scene, { reducedMotion });
  scene.onFrame((dt) => life.update(dt));
  const game = createGame(LANDMARKS.map((l) => l.id));
  game.on('done', () => life.finish());
  startUI({ game, scene, landmarks: LANDMARKS, reducedMotion });
  // ?built opens on the finished city; ?still also hides the controls and frames all of it, for the share image
  if (params.has('built') || params.has('still')) {
    for (const lm of LANDMARKS) if (game.place(lm.id)) scene.placeLandmark(lm.id, { animate: false });
    await scene.glideTo('all', { duration: 0 });
  }
  if (params.has('still')) {
    root.classList.add('still-mode');
    requestAnimationFrame(() => requestAnimationFrame(() => { document.title = 'ready'; }));
  }
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));
  if (params.has('dev')) Object.assign(window, { __scene: scene, __game: game, __life: life });
} catch (err) {
  console.warn(err);
  root.classList.add('no-gl');
}
