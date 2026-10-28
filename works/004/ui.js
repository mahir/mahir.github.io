// The tray, the drag, the taps and "Build it for me". Every way of building asks the game first, and the game says
// no to a landmark already placed, so nothing can go in twice. On a phone a piece lifts out of the tray with an
// upward drag; sideways swipes still scroll the tray.

import { toWorld } from './geo.js';
import { onTarget } from './game.js';

const TAP = 6; // pixels a pointer may wander and still be a tap
const ICON = 112;

export function startUI({ game, scene, landmarks, reducedMotion }) {
  const $ = (id) => document.getElementById(id);
  const tray = $('tray'), count = $('count'), buildAll = $('build'), toast = $('toast'), hint = $('hint'), live = $('live');
  const canvas = scene.renderer.domElement;
  const byId = new Map(landmarks.map((l) => [l.id, l]));
  const icons = makeIcons(scene, landmarks);
  const buttons = new Map();
  let running = false;
  let drag = null;
  let suppressClick = false;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- the tray ----------
  for (const lm of landmarks) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = lm.id;
    b.setAttribute('aria-label', `Build ${lm.name}`);
    b.append(copy(icons.get(lm.id)), Object.assign(document.createElement('span'), { className: 'name', textContent: lm.name }));
    li.append(b);
    tray.append(li);
    buttons.set(lm.id, b);
    b.addEventListener('pointerdown', (e) => startDrag(e, lm.id, b));
    b.addEventListener('click', () => {
      if (suppressClick) { suppressClick = false; return; }
      fromTray(lm.id);
    });
  }

  // ---------- building ----------
  // a tap or Enter on a tray piece: glide to its outline, then build it
  async function fromTray(id) {
    if (running || !game.place(id)) return;
    await scene.glideTo(id, { duration: 600 });
    await scene.placeLandmark(id);
  }
  // a drop on the outline, or a tap on it: it is already in view
  function here(id) {
    if (running || !game.place(id)) return;
    scene.placeLandmark(id);
  }

  game.on('place', ({ id, placed, total }) => {
    const lm = byId.get(id), li = buttons.get(id)?.parentElement;
    // keep keyboard focus in the tray when the focused piece leaves it
    if (li && li.contains(document.activeElement)) {
      const next = (li.nextElementSibling || li.previousElementSibling)?.querySelector('button');
      (next || buildAll).focus();
    }
    li?.remove();
    count.innerHTML = `<b>${placed}</b> of ${total}`;
    toast.innerHTML = `${lm.name} <span class="year">· ${lm.year}</span>`;
    toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
    live.textContent = `${lm.name} placed, ${placed} of ${total}`;
    hint.classList.add('gone');
  });
  game.on('done', () => {
    document.documentElement.classList.add('done');
    buildAll.disabled = true;
    live.textContent = 'All thirteen landmarks are in. Istanbul is whole.';
    if (!running) scene.glideTo('all', { duration: 2200 });
  });

  buildAll.addEventListener('click', async () => {
    if (running || game.done()) return;
    running = true;
    cancelDrag();
    buildAll.disabled = true;
    buildAll.classList.add('running');
    buildAll.textContent = 'Building…';
    for (const id of game.remaining()) {
      if (!game.place(id)) continue;
      await scene.glideTo(id, { duration: 600 });
      await Promise.race([scene.placeLandmark(id), wait(900)]);
    }
    await scene.glideTo('all', { duration: 2200 });
    running = false;
    buildAll.classList.remove('running');
    buildAll.textContent = 'Build it for me';
  });

  // ---------- tapping an outline on the map ----------
  let press = null;
  canvas.addEventListener('pointerdown', (e) => { press = e.isPrimary ? { x: e.clientX, y: e.clientY, t: performance.now() } : null; });
  canvas.addEventListener('pointerup', (e) => {
    if (!press || Math.hypot(e.clientX - press.x, e.clientY - press.y) > TAP || performance.now() - press.t > 600) return;
    press = null;
    const id = scene.pickOutline(e.clientX, e.clientY);
    if (id) here(id);
  });

  // ---------- dragging a piece out of the tray ----------
  function startDrag(e, id, button) {
    if (running || drag || !e.isPrimary || e.button > 0) return;
    drag = { id, button, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, lifted: false, ghost: null };
    try { button.setPointerCapture(e.pointerId); } catch { /* moves are followed on window anyway */ }
  }
  function lift(e) {
    const d = drag;
    d.lifted = true;
    d.button.classList.add('lifted');
    scene.controls.enabled = false;
    d.ghost = Object.assign(document.createElement('div'), { className: 'ghost' });
    d.ghost.append(copy(icons.get(d.id)));
    document.body.append(d.ghost);
    moveGhost(e.clientX, e.clientY);
    if (offScreen(d.id)) scene.glideTo(d.id, { duration: 600 });
  }
  const moveGhost = (x, y) => { drag.ghost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -60%) scale(1.25)`; };

  addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!drag.lifted) {
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      // touch lifts with an upward drag (sideways scrolls the tray); a mouse lifts in any direction
      if (Math.hypot(dx, dy) < TAP || (e.pointerType === 'touch' && -dy < Math.abs(dx))) return;
      lift(e);
    }
    moveGhost(e.clientX, e.clientY);
  });
  addEventListener('pointerup', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!drag.lifted) { drag = null; return; } // a tap: the click handler builds it
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    const { id } = drag;
    const overUI = document.elementFromPoint(e.clientX, e.clientY)?.closest('.play, .top, .credit');
    const p = overUI ? null : scene.screenToGround(e.clientX, e.clientY);
    const hit = p && onTarget(p, scene.nearestOnFootprint(id, p), Math.max(80, scene.pxToMetres(30)));
    if (hit && game.place(id)) {
      endDrag(false);
      scene.placeLandmark(id);
    } else {
      endDrag(true);
    }
  });
  addEventListener('pointercancel', (e) => { if (drag && e.pointerId === drag.pointerId) endDrag(true); });
  // a second finger while holding a piece puts it back
  addEventListener('pointerdown', (e) => { if (drag && e.pointerId !== drag.pointerId) endDrag(true); }, true);

  function endDrag(home) {
    const d = drag;
    drag = null;
    scene.controls.enabled = true;
    if (!d || !d.lifted) return;
    const { ghost, button } = d;
    if (home && !reducedMotion && button.isConnected) {
      const r = button.getBoundingClientRect();
      ghost.classList.add('back-home');
      ghost.style.transform = `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px) translate(-50%, -60%) scale(1)`;
      setTimeout(() => { ghost.remove(); button.classList.remove('lifted'); }, 260);
    } else {
      ghost.remove();
      button.classList.remove('lifted');
    }
  }
  const cancelDrag = () => { if (drag) endDrag(true); };

  function offScreen(id) {
    const lm = byId.get(id), p = toWorld(lm.lat, lm.lon);
    const v = new scene.three.Vector3(p.x, 6, p.z).project(scene.camera);
    return Math.abs(v.x) > 0.85 || Math.abs(v.y) > 0.75;
  }
}

// Each landmark drawn once into a small canvas, from the scene's own angle and light, for the tray.
function makeIcons(scene, landmarks) {
  const THREE = scene.three;
  const out = new Map();
  let r;
  try {
    r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch {
    for (const lm of landmarks) out.set(lm.id, document.createElement('canvas'));
    return out;
  }
  r.setPixelRatio(1);
  r.setSize(ICON, ICON, false);
  const s = new THREE.Scene();
  s.add(new THREE.HemisphereLight(0xfffaf2, 0xb8a888, 1.9));
  const sun = new THREE.DirectionalLight(0xfff3e0, 2.4);
  sun.position.copy(scene.sunDir);
  s.add(sun);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 100000);
  for (const lm of landmarks) {
    const m = scene.model(lm.id).clone();
    m.position.set(0, 0, 0);
    s.add(m);
    const sphere = new THREE.Box3().setFromObject(m).getBoundingSphere(new THREE.Sphere());
    const R = sphere.radius * 1.02;
    Object.assign(cam, { left: -R, right: R, top: R, bottom: -R });
    cam.position.copy(sphere.center).addScaledVector(scene.viewDir, R * 4);
    cam.lookAt(sphere.center);
    cam.updateProjectionMatrix();
    r.render(s, cam);
    const c = document.createElement('canvas');
    c.width = c.height = ICON;
    c.getContext('2d').drawImage(r.domElement, 0, 0);
    out.set(lm.id, c);
    s.remove(m);
  }
  r.dispose();
  r.forceContextLoss();
  return out;
}

function copy(source) {
  const c = document.createElement('canvas');
  c.width = source.width || ICON;
  c.height = source.height || ICON;
  if (source.width) c.getContext('2d').drawImage(source, 0, 0);
  c.setAttribute('aria-hidden', 'true');
  return c;
}
