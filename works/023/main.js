// The page: works out a world's twenty years a few months at a time, and plays them back as
// they come.
//
// /works/023/#48213 is world No. 48213; without a number the page picks one.
// ?still shows the twentieth year at once, ?year=8 stops at that year, ?vs=search (or
// explore, plain) puts a second world beside the first, ?you=0.3,0.7 puts you in the crowd
// at that place, and ?bare shows only the map, filling the window.
(function () {
  'use strict';
  const P = World.P, doc = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const BARE = q.has('bare');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STILL = q.has('still') || q.has('year') || calm;
  const T = P.months;
  const RUN = 64;            // seconds the twenty years take to play
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const pct = (x) => (x < 0.1 ? (Math.round(x * 1000) / 10).toFixed(x < 0.01 ? 1 : 0) : Math.round(x * 100)) + '%';
  const COMPARE = {
    search: { delta: { mode: 'search' }, name: 'Searching instead' },
    explore: { delta: { explore: 0.4 }, name: 'Exploring more' },
    plain: { delta: { popular: 0 }, name: 'Ignoring what is popular' },
  };

  if (BARE) doc.classList.add('bare');

  const canvas = $('gl'), over = $('over'), scene = $('scene'), rail = $('rail'), ctx2 = over.getContext('2d');
  let painter = null;
  try { painter = window.CrowdPainter(canvas); } catch (e) { console.error(e); painter = null; }
  if (!painter) {
    doc.classList.add('nogl');
    $('status').textContent = 'This browser cannot draw the crowd, so here is a world that was kept: No. 13 after twenty years.';
    return;
  }
  doc.classList.add('live');

  const number = () => { const m = /^#(\d{1,5})$/.exec(location.hash), n = m ? +m[1] : 0; return n >= 1 && n <= 99999 ? n : 0; };
  let seed = number() || 1 + Math.floor(Math.random() * 99999);
  let A = null, B = null, vs = COMPARE[q.get('vs')] ? q.get('vs') : '';
  let t = 0, playing = !STILL, last = 0, split = 0.5, shown = -1, working = false, settled = false;
  let you = null;             // { x, y, from, A: {feed, search}, B }
  const drops = [];           // things put up by the visitor: { x, y, month, A: event, B: event }
  const sound = window.CrowdSound();

  // ------------------------------------------------------------------ worlds
  function open(n) {
    seed = n;
    if (number() !== n) history.replaceState(null, '', '#' + n);
    A = World.Run(n);
    B = vs ? World.Run(n, { delta: COMPARE[vs].delta }) : null;
    painter.add('A', A); if (B) painter.add('B', B); else painter.drop('B');
    t = 0; shown = -1; drops.length = 0;
    you = null;
    const yq = q.get('you');
    if (yq) { const [x, y] = yq.split(',').map(Number); if (x >= 0 && x <= 1 && y >= 0 && y <= 1) you = { x, y, from: 0 }; }
    $('kind').textContent = World.describe(A.C);
    $('status').textContent = `World No. ${fmt(n)}.`;
    $('ask').hidden = BARE || !!you;
    if (matchMedia('(hover: none)').matches) $('ask').textContent = 'Tap anywhere on the map to put yourself in the crowd, where your taste is.';
    setFeedInputs(A.C.feed.explore, A.C.feed.popular, 1);
    sides();
    work();
  }

  function sides() {
    $('sideA').hidden = !B; $('sideB').hidden = !B; $('wipe').hidden = !B;
    if (B) { $('sideA').textContent = 'The feed'; $('sideB').textContent = COMPARE[vs].name; }
    placeWipe();
  }

  // work out a few months at a time, in turn for each world, and send them to the card
  function work() {
    if (working) return;
    working = true;
    const slice = () => {
      let left = false;
      const until = performance.now() + 12;
      while (performance.now() < until) {
        let a = A.more(2), b = B ? B.more(2) : false;
        left = a || b;
        if (!left) break;
      }
      painter.sync('A'); if (B) painter.sync('B');
      if (left) setTimeout(slice, 0);
      else { working = false; walk(); if (STILL && !settled) { settled = true; settle(); } }
    };
    setTimeout(slice, 0);
  }
  const done = () => Math.min(A.done, B ? B.done : T);

  // you, and you searching, worked out through the recorded months
  function walk() {
    if (!you) return;
    you.A = A.you(you.x, you.y, you.from);
    you.B = B ? B.you(you.x, you.y, you.from) : null;
  }

  // a change from the month on the rail: the months after it are worked out again
  function change(e, back) {
    // at the end of the run there are no months left to change: go back to month `back` and change from there
    if (t >= T - 1 && back != null) t = back;
    // a world still catching up (just set beside the first) is worked out to here at once,
    // so both worlds change at the month on the rail
    while (done() < Math.min(Math.floor(t), T - 1)) { A.more(12); if (B) B.more(12); }
    const m = Math.min(Math.floor(t), done());
    const ea = Object.assign({}, e, { month: m });
    A.change(ea); painter.sync('A', m);
    let eb = null;
    if (B) { eb = Object.assign({}, e, { month: m }); B.change(eb); painter.sync('B', m); }
    if (you) { you.A = null; you.B = null; }
    // things put up after this month are gone with the months they were put up in
    for (let k = drops.length - 1; k >= 0; k--) if (drops[k].month > m) drops.splice(k, 1);
    shown = -1;
    work();
    return { ea, eb, m };
  }

  // ------------------------------------------------------------------ the feed's controls
  const inputs = { explore: $('explore'), popular: $('popular'), set: $('set') };
  const show = {
    explore: (v) => (v < 0.005 ? 'none' : '1 in ' + Math.max(1, Math.round(1 / v))),
    popular: (v) => (v === 0 ? 'none' : v.toFixed(1)),
    set: (v) => '×' + v.toFixed(2).replace(/0$/, ''),
  };
  let held = false;
  function setFeedInputs(explore, popular, set) {
    if (held) return;
    const vals = { explore, popular, set };
    for (const k in inputs) { inputs[k].value = vals[k]; $(k + 'Out').textContent = show[k](+vals[k]); }
  }
  for (const k in inputs) {
    inputs[k].addEventListener('input', () => { held = true; $(k + 'Out').textContent = show[k](+inputs[k].value); });
    inputs[k].addEventListener('change', () => {
      held = false;
      const ended = t >= T - 1;
      change({ kind: 'feed', feed: { explore: +inputs.explore.value, popular: +inputs.popular.value, set: +inputs.set.value } }, 0);
      say(ended
        ? 'The twenty years are run again from the start, with the feed set as you set it.'
        : `From year ${yearOf(t)} on, the feed is set as you set it. Everything after that is run again.`);
      if (!playing) toggle();
    });
  }
  $('shake').addEventListener('click', () => {
    const ended = t >= T - 1;
    change({ kind: 'shake', months: 12 }, 10 * 12);
    say((ended ? 'Back to year 10. ' : '') +
      `For one year from year ${yearOf(t)}, the feed mostly shows things picked at random from anywhere in the catalog. Then it goes back to normal. Tastes move slowly, so a single year hardly loosens the crowd.`);
    if (!playing) toggle();
  });

  // ------------------------------------------------------------------ the map
  function geometry() {
    const r = scene.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; over.width = w; over.height = h; }
    // the map is square: in a wide window (?bare) it sits in the middle, on the same night
    const s = Math.min(w, h);
    view = { x: Math.round((w - s) / 2), y: Math.round((h - s) / 2), w: s, h: s, dpr };
    painter.resize(s);
  }
  let view = { x: 0, y: 0, w: 1, h: 1, dpr: 1 };
  const toMap = (ev) => {
    const r = scene.getBoundingClientRect();
    const px = (ev.clientX - r.left) * view.dpr, py = (ev.clientY - r.top) * view.dpr;
    return { x: (px - view.x) / view.w, y: (py - view.y) / view.h };
  };
  const toPx = (x, y) => [view.x + x * view.w, view.y + y * view.h];

  canvas.addEventListener('click', (ev) => {
    const p = toMap(ev);
    if (p.x < 0.01 || p.y < 0.01 || p.x > 0.99 || p.y > 0.99) return;
    const tool = document.querySelector('input[name=tool]:checked').value;
    if (tool === 'you') {
      you = { x: p.x, y: p.y, from: Math.min(Math.floor(t), done()) };
      $('ask').hidden = true;
      walk(); shown = -1;
      say(you.from === 0 ? 'You are in the crowd. The white dot is you with the feed, the dashed one you searching on your own.' :
        `You join in year ${yearOf(t)}. The white dot is you with the feed, the dashed one you searching on your own.`);
      if (!playing && t < done() - 1) toggle();
    } else {
      const { ea, eb, m } = change({ kind: 'drop', x: p.x, y: p.y });
      drops.push({ x: p.x, y: p.y, month: m, A: ea, B: eb });
      say('A new thing, put up by a seller who will keep it up. See whether the feed ever shows it to anyone.');
      if (!playing) toggle();
    }
  });

  // the wipe between two worlds
  function placeWipe() { $('wipe').style.left = (split * 100) + '%'; $('wipe').setAttribute('aria-valuenow', Math.round(split * 100)); }
  {
    const wipe = $('wipe');
    let drag = false;
    const at = (ev) => { const r = scene.getBoundingClientRect(); split = Math.max(0.05, Math.min(0.95, (ev.clientX - r.left) / r.width)); placeWipe(); };
    wipe.addEventListener('pointerdown', (ev) => { drag = true; wipe.setPointerCapture(ev.pointerId); at(ev); });
    wipe.addEventListener('pointermove', (ev) => { if (drag) at(ev); });
    wipe.addEventListener('pointerup', () => { drag = false; });
    wipe.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { split = Math.max(0.05, Math.min(0.95, split + (ev.key === 'ArrowLeft' ? -0.05 : 0.05))); placeWipe(); ev.preventDefault(); }
    });
  }

  // ------------------------------------------------------------------ the rail
  const curve = $('curve'), cx = curve.getContext('2d');
  function drawCurve() {
    const r = curve.getBoundingClientRect(), dpr = view.dpr;
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (curve.width !== w || curve.height !== h) { curve.width = w; curve.height = h; }
    cx.clearRect(0, 0, w, h);
    cx.fillStyle = 'rgba(236,232,223,.05)'; cx.fillRect(0, 0, w, h);
    const line = (run, dash, color) => {
      cx.beginPath();
      for (let m = 0; m <= run.done; m++) {
        const x = (m / T) * w, y = 2 * dpr + (1 - run.rec.spread[m]) * (h - 4 * dpr);
        if (m) cx.lineTo(x, y); else cx.moveTo(x, y);
      }
      cx.setLineDash(dash); cx.strokeStyle = color; cx.lineWidth = 1.5 * dpr; cx.stroke(); cx.setLineDash([]);
    };
    if (B) line(B, [3 * dpr, 3 * dpr], 'rgba(236,232,223,.6)');
    line(A, [], '#ece8df');
    // where the feed was changed
    cx.fillStyle = '#ffd98a';
    for (const e of A.rec.events) { const x = (e.month / T) * w; cx.fillRect(x - dpr, 0, 2 * dpr, h); }
  }
  {
    let drag = false, was = false;
    const at = (ev) => {
      const r = rail.getBoundingClientRect();
      t = Math.max(0, Math.min(done(), ((ev.clientX - r.left) / r.width) * T));
    };
    rail.addEventListener('pointerdown', (ev) => { drag = true; was = playing; playing = false; rail.setPointerCapture(ev.pointerId); at(ev); });
    rail.addEventListener('pointermove', (ev) => { if (drag) at(ev); });
    const up = () => { if (!drag) return; drag = false; playing = was && t < T; label(); };
    rail.addEventListener('pointerup', up); rail.addEventListener('pointercancel', up);
    rail.addEventListener('keydown', (ev) => {
      const k = { ArrowLeft: -12, ArrowRight: 12, PageDown: -60, PageUp: 60, Home: -T, End: T }[ev.key];
      if (k == null) return;
      ev.preventDefault();
      t = Math.max(0, Math.min(done(), Math.round(t) + k));
    });
  }

  // ------------------------------------------------------------------ the buttons
  function toggle() {
    if (!playing && t >= T - 0.01) t = 0;
    playing = !playing; label();
  }
  function label() { $('play').textContent = playing ? 'Hold it' : t >= T - 0.01 ? 'Play again' : 'Play'; }
  $('play').addEventListener('click', toggle);
  $('other').addEventListener('click', () => { open(1 + Math.floor(Math.random() * 99999)); playing = true; label(); });
  $('sound').addEventListener('click', () => {
    const on = sound.toggle();
    $('sound').textContent = on ? 'Sound on' : 'Sound off';
    $('sound').setAttribute('aria-pressed', on ? 'true' : 'false');
    shown = -1;
  });
  $('compare').value = vs;
  $('compare').addEventListener('change', () => {
    vs = $('compare').value;
    const keep = Math.floor(t), was = you;
    // the second world runs from the start with the same changes the first has had
    B = vs ? World.Run(seed, { delta: COMPARE[vs].delta }) : null;
    if (B) {
      painter.add('B', B);
      for (const e of A.rec.events) {
        const copy = Object.assign({}, e); delete copy.thing;
        B.rec.events.push(copy);
        const d = drops.find((x) => x.A === e); if (d) d.B = copy;
      }
    } else painter.drop('B');
    if (was) { was.A = null; was.B = null; }
    t = keep; shown = -1; sides(); work();
  });
  addEventListener('hashchange', () => { const n = number(); if (n && n !== seed) open(n); });

  function say(s) { $('status').textContent = s; }
  const yearOf = (m) => fmt(Math.floor(m / 12));

  // ------------------------------------------------------------------ reading
  function moved(path, m) {
    const k = Math.min(m, T);
    if (!path || isNaN(path[k * 2])) return null;
    return Math.hypot(path[k * 2] - you.x, path[k * 2 + 1] - you.y);
  }
  function read(m) {
    const lines = [];
    const one = (run, who) => {
      const r = run.rec, f = r.feed[m], search = f.mode === 'search';
      const w = who ? `<span class="who">${who}</span>` : '';
      lines.push(`<p>${w}The crowd lives on <b>${pct(Math.min(1, r.spread[m]))}</b> of the ground it started on.</p>`);
      if (m > 0) lines.push(`<p>${w}Half of what ${search ? 'searches turned up' : 'the feed showed'} this month went to <b>${pct(r.half[m])}</b> of the catalog.</p>`);
    };
    one(A, B ? 'Feed' : '');
    if (B) one(B, vs === 'search' ? 'Search' : vs === 'explore' ? 'Explore' : 'Plain');
    if (you && you.A && m >= you.from) {
      const a = moved(you.A.feed, m), s = moved(you.A.search, m);
      if (a != null) lines.push(`<p class="you">With the feed, your taste has moved <b>${Math.round(a * 100)}%</b> of the map’s width. Searching on your own, it would have moved <b>${Math.round(s * 100)}%</b>.</p>`);
    }
    $('reading').innerHTML = lines.join('');
  }

  // ------------------------------------------------------------------ drawing
  function overlay(m, f) {
    ctx2.clearRect(0, 0, over.width, over.height);
    const dpr = view.dpr;
    // things put up by the visitor
    for (const d of drops) {
      for (const [run, key, x0, x1] of [[A, 'A', 0, B ? split : 1], [B, 'B', split, 1]]) {
        if (!run) continue;
        const e = d[key]; if (!e || e.thing == null || m < d.month || m > run.done) continue;
        const o = (m * run.things + e.thing) * 4;
        const [px, py] = toPx(run.rec.things[o], run.rec.things[o + 1]);
        if (px < view.x + view.w * x0 || px > view.x + view.w * x1) continue;
        const n = Math.round(run.rec.things[o + 3]), lit = n > 0;
        ctx2.strokeStyle = lit ? '#ffd98a' : 'rgba(255,217,138,.55)'; ctx2.lineWidth = 1.5 * dpr;
        ctx2.beginPath(); ctx2.arc(px, py, 9 * dpr, 0, 6.2832); ctx2.stroke();
        ctx2.font = `500 ${11 * dpr}px 'Instrument Sans', sans-serif`; ctx2.fillStyle = ctx2.strokeStyle;
        const word = n === 0 ? 'yours, shown to nobody' : n === 1 ? 'yours, shown to one' : `yours, shown to ${fmt(n)}`, tw = ctx2.measureText(word).width;
        const right = px + 12 * dpr + tw > view.x + view.w * x1 - 4 * dpr;
        ctx2.fillText(word, right ? px - 12 * dpr - tw : px + 12 * dpr, py - 8 * dpr);
      }
    }
    // you, and you searching
    if (you) {
      const draw = (path, dash, x0, x1, name) => {
        if (!path) return;
        ctx2.save();
        ctx2.beginPath(); ctx2.rect(view.x + view.w * x0, 0, view.w * (x1 - x0), over.height); ctx2.clip();
        ctx2.beginPath();
        let lx = 0, ly = 0, started = false;
        for (let k = you.from; k <= Math.min(m, T); k++) {
          if (isNaN(path[k * 2])) break;
          const [px, py] = toPx(path[k * 2], path[k * 2 + 1]);
          if (started) ctx2.lineTo(px, py); else { ctx2.moveTo(px, py); started = true; }
          lx = px; ly = py;
        }
        if (m < T && !isNaN(path[(m + 1) * 2])) {
          const [nx, ny] = toPx(path[(m + 1) * 2], path[(m + 1) * 2 + 1]);
          lx += (nx - lx) * f; ly += (ny - ly) * f; ctx2.lineTo(lx, ly);
        }
        ctx2.setLineDash(dash ? [3 * dpr, 3 * dpr] : []);
        ctx2.strokeStyle = 'rgba(0,0,0,.6)'; ctx2.lineWidth = 4 * dpr; ctx2.stroke();
        ctx2.strokeStyle = '#fff'; ctx2.lineWidth = 1.6 * dpr; ctx2.stroke();
        ctx2.setLineDash([]);
        if (started) {
          ctx2.beginPath(); ctx2.arc(lx, ly, 5 * dpr, 0, 6.2832);
          if (dash) { ctx2.setLineDash([2 * dpr, 2 * dpr]); ctx2.strokeStyle = '#fff'; ctx2.lineWidth = 1.5 * dpr; ctx2.stroke(); ctx2.setLineDash([]); }
          else { ctx2.fillStyle = '#fff'; ctx2.fill(); ctx2.strokeStyle = 'rgba(0,0,0,.7)'; ctx2.lineWidth = 1.5 * dpr; ctx2.stroke(); }
          ctx2.font = `500 ${11 * dpr}px 'Instrument Sans', sans-serif`;
          ctx2.lineWidth = 3 * dpr; ctx2.strokeStyle = 'rgba(5,6,10,.85)';
          const ty = ly + (dash ? 16 : -8) * dpr, tw = ctx2.measureText(name).width;
          const tx = lx + 9 * dpr + tw > view.x + view.w * x1 - 4 * dpr ? lx - 9 * dpr - tw : lx + 9 * dpr;
          ctx2.strokeText(name, tx, ty);
          ctx2.fillStyle = '#fff'; ctx2.fillText(name, tx, ty);
        }
        ctx2.restore();
      };
      const xa = B ? split : 1;
      if (you.A) { draw(you.A.search, true, 0, xa, 'you, searching'); draw(you.A.feed, false, 0, xa, 'you'); }
      if (B && you.B) { draw(you.B.search, true, split, 1, 'you, searching'); draw(you.B.feed, false, split, 1, 'you'); }
      // where you started
      const [hx, hy] = toPx(you.x, you.y);
      ctx2.strokeStyle = 'rgba(255,255,255,.7)'; ctx2.lineWidth = 1 * dpr;
      ctx2.beginPath(); ctx2.moveTo(hx - 5 * dpr, hy); ctx2.lineTo(hx + 5 * dpr, hy); ctx2.moveTo(hx, hy - 5 * dpr); ctx2.lineTo(hx, hy + 5 * dpr); ctx2.stroke();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    geometry();
    const top = done();
    if (playing) {
      // never ahead of what is worked out, but never pulled back by a world still catching up
      if (t < top) t = Math.min(t + dt * (T / RUN), top - 0.001, T);
      if (t >= T - 0.01 && top >= T) { t = T; playing = false; label(); }
    }
    const m = Math.min(Math.floor(t), top), f = t - Math.floor(t);
    painter.expose('A', m); if (B) painter.expose('B', m);
    const sidesNow = B ? [['A', 0, split], ['B', split, 1]] : [['A', 0, 1]];
    painter.frame({ view, sides: sidesNow, t, dots: true, things: true });
    if (you && !you.A && !working) walk();
    overlay(m, f);
    // the rail
    $('hand').style.left = (t / T * 100) + '%';
    $('ahead').style.left = (top / T * 100) + '%';
    rail.setAttribute('aria-valuenow', Math.round(t));
    rail.setAttribute('aria-valuetext', `Year ${yearOf(t)}, month ${Math.floor(t) % 12 + 1}`);
    if (m !== shown) {
      shown = m;
      $('year').innerHTML = m >= T ? `Year ${yearOf(m)}` : `Year ${yearOf(m)}<small>month ${m % 12 + 1}</small>`;
      read(m);
      drawCurve();
      const f0 = A.rec.feed[m];
      setFeedInputs(f0.explore, f0.popular, f0.set || 1);
      if (sound.on) sound.set(Array.from(A.rec.notes.subarray(m * 9, m * 9 + 9)));
    }
  }

  // ?still and ?year: go straight to a month once the months are worked out
  function settle() {
    const y = q.has('year') ? Math.max(0, Math.min(20, +q.get('year') || 0)) : 20;
    t = Math.min(done(), y * 12);
    playing = false; label();
  }

  open(seed);
  if (STILL) label();
  requestAnimationFrame(frame);
})();
