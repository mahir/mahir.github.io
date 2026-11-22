// The page: runs one river for its 2,000 years, then plays the sheet back.
//
// /works/022/#48213 is river No. 48213; without a number the page picks one.
// ?still shows the last year at once, ?year=1240 stops at that year, ?bare shows only the
// sheet, filling the window.
(function () {
  'use strict';
  const P = River.P, doc = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const BARE = q.has('bare');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STILL = q.has('still') || q.has('year') || calm;
  const LOOKS = P.years / P.every;
  const RUN = 52;          // seconds the whole run takes to play
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const TIMES = ['', '', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

  if (BARE) doc.classList.add('bare');
  // a coarser sheet on a small screen: less to work out, and nothing to see of the rest
  if (Math.min(screen.width, screen.height) < 700) { P.cols = 1024; P.rows = 640; }

  const canvas = $('gl'), scene = $('scene'), rail = $('rail'), tag = $('tag');
  let painter = null;
  try { painter = window.RiverPainter(canvas); } catch (e) { painter = null; }
  if (!painter) {
    doc.classList.add('nogl');
    $('status').textContent = 'This browser cannot draw the river, so here is one that was kept: river No. 3 in its year 2,000.';
    return;
  }
  doc.classList.add('live');

  // the key of inks along the rail
  const inks = $('inks');
  window.RiverInks.forEach((c) => {
    const s = document.createElement('span');
    const base = `rgb(${c[0]},${c[1]},${c[2]})`, dark = `rgb(${Math.round(c[0] * 0.8)},${Math.round(c[1] * 0.8)},${Math.round(c[2] * 0.8)})`;
    s.style.background = c[3] ? `repeating-linear-gradient(${c[3] === 1 ? 45 : -45}deg, ${base} 0 3.6px, ${dark} 3.6px 4.6px)` : base;
    inks.appendChild(s);
  });

  const number = () => { const m = /^#(\d{1,5})$/.exec(location.hash), n = m ? +m[1] : 0; return n >= 1 && n <= 99999 ? n : 0; };
  let seed = number() || 1 + Math.floor(Math.random() * 99999);
  let run = null, shown = null;     // the river being worked out, and the one on the sheet
  let cuts = [];                    // years of the loops cut off on the sheet
  let t = 0, playing = false, last = 0, queued = false;
  let probe = null, view = { x: 0, y: 0, w: 1, h: 1, turn: false }, dpr = 1, sheetLong = 0;

  function open(n) {
    seed = n;
    if (number() !== n) history.replaceState(null, '', '#' + n);
    $('status').textContent = `Running ${fmt(P.years)} years of river No. ${n}.`;
    $('again').disabled = true;
    const mine = run = River.Run(n);
    const slice = () => {
      if (run !== mine) return;
      if (mine.more(14)) setTimeout(slice, 0); else begin(mine);
    };
    setTimeout(slice, 0);
  }

  function begin(r) {
    shown = r;
    painter.sheet(r.sheet, r.C);
    cuts = r.channel.cuts.filter((c) => c.sheet).map((c) => c.year);
    $('status').textContent = `No. ${seed}. ${River.describe(r.C)} The sheet is ${r.C.long} of its usual widths long.`;
    rule();
    $('again').disabled = false;
    probe = null; hide();
    doc.classList.add('ready');
    if (STILL) {
      const y = q.has('year') ? Math.max(0, Math.min(P.years, +q.get('year') || 0)) : P.years;
      t = y / P.every; playing = false; button(); paint();
    } else play(0);
    window.__river = { get t() { return t; }, get playing() { return playing; }, run: r, seed };
  }

  // the scale under the year: ten widths of this river
  function rule() { if (shown && sheetLong) $('scale').style.width = sheetLong / shown.C.long * 10 + 'px'; }

  function play(from) {
    if (from != null) t = from;
    if (t >= LOOKS) t = 0;
    playing = true; last = 0; button(); paint();
  }
  function hold() { playing = false; button(); paint(); }

  function button() {
    $('again').textContent = playing ? 'Hold it' : t >= LOOKS ? 'Run it again' : 'Let it run';
  }

  function paint() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }

  function frame(ts) {
    queued = false;
    if (!shown) return;
    if (playing) {
      if (last) t += Math.min(0.1, (ts - last) / 1000) * LOOKS / RUN;
      last = ts;
      if (t >= LOOKS) { t = LOOKS; playing = false; button(); }
    }
    painter.draw(view, t, probe, dpr);
    read();
    if (playing) paint();
  }

  // the words beside the sheet
  let said = { year: '', kind: '', nums: '' };
  function read() {
    const year = Math.round(t * P.every);
    const y = 'Year ' + fmt(year);
    if (y !== said.year) {
      $('year').textContent = said.year = y;
      rail.setAttribute('aria-valuenow', year);
      rail.setAttribute('aria-valuetext', 'year ' + fmt(year));
    }
    const share = t / LOOKS * 100;
    $('hand').style.left = share + '%';
    $('ahead').style.left = share + '%';
    let n = 0, latest = 0;
    for (const c of cuts) if (c <= year) { n++; latest = c; }
    let kind;
    if (year < 2) kind = 'A river, almost straight.';
    else if (!n) kind = 'Its bends grow, each one eating its outer bank.';
    else if (year - latest <= 40) kind = `In year ${fmt(latest)} the river took the short way and left a loop behind.`;
    else kind = n === 1 ? `One loop cut off so far, in year ${fmt(latest)}.` : `${n} loops cut off so far, the last in year ${fmt(latest)}.`;
    if (kind !== said.kind) $('kind').textContent = said.kind = kind;
    const wind = shown.stats.winding[Math.min(LOOKS, Math.floor(t))];
    const nums = `The river is ${wind.toFixed(1)} times as long as its valley.`;
    if (nums !== said.nums) $('nums').textContent = said.nums = nums;
  }

  // fit the sheet in the scene: across the screen when there is room, down it when not
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cw = scene.clientWidth, ch = scene.clientHeight;
    if (!cw || !ch) return;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    const turn = BARE ? cw < ch : getComputedStyle(scene).getPropertyValue('--turn').trim() === '1';
    const ratio = turn ? P.rows / P.cols : P.cols / P.rows;
    const pad = BARE ? 0 : 12;
    let w = cw - pad * 2, h = w / ratio;
    if (BARE ? h < ch : h > ch - pad * 2) { h = ch - pad * 2; w = h * ratio; }
    view = { x: (cw - w) / 2 * dpr, y: (ch - h) / 2 * dpr, w: w * dpr, h: h * dpr, turn };
    if (!BARE) {
      // the rail and the scale line up with the sheet
      const along = turn ? h : w;
      doc.style.setProperty('--sheet-left', (cw - w) / 2 + 'px');
      doc.style.setProperty('--sheet-width', w + 'px');
      sheetLong = along;
      rule();
    }
    paint();
  }

  // the cell of the sheet under a pointer, or null
  function under(e) {
    const r = canvas.getBoundingClientRect();
    const u = ((e.clientX - r.left) * dpr - view.x) / view.w, v = ((e.clientY - r.top) * dpr - view.y) / view.h;
    if (u < 0 || v < 0 || u >= 1 || v >= 1) return null;
    const gx = view.turn ? v : u, gy = view.turn ? 1 - u : v;
    return { col: Math.min(shown.sheet.cols - 1, Math.floor(gx * shown.sheet.cols)), row: Math.min(shown.sheet.rows - 1, Math.floor(gy * shown.sheet.rows)) };
  }

  // what the sheet shows at a cell in the year on view
  function ground(cell) {
    const now = Math.floor(t);
    let v = null, before = 0;
    for (const x of shown.sheet.visits(cell.col, cell.row)) if (x.from <= now) { if (v) before++; v = x; }
    if (!v) return { kind: 'paper' };
    if (v.to >= now) return { kind: 'water', v, before };
    const filled = v.lake ? (t - v.to) * P.every >= P.pond * Math.pow(v.lake / P.fill, 1.5) : true;
    return { kind: filled ? 'land' : 'pond', v, before };
  }

  function say(g) {
    if (g.kind === 'paper') return 'The river has not been here.';
    if (g.kind === 'water') return g.v.from === 0 ? 'The river, here since the start.' : `The river, here since year ${fmt(g.v.from * P.every)}.`;
    if (g.v.lake) {
      // the cut came between two looks: take its own year
      const lo = g.v.to * P.every, hit = shown.channel.cuts.find((c) => c.year > lo && c.year <= lo + P.every);
      const cut = fmt(hit ? hit.year : lo + P.every);
      return g.kind === 'pond' ? `A loop the river cut off in year ${cut}.` : `A loop cut off in year ${cut}, since closed up.`;
    }
    const left = fmt(g.v.to * P.every);
    const nth = TIMES[Math.min(10, g.before + 1)];
    return `The river left this ground in year ${left}` + (nth ? `, its ${nth} time here.` : '.');
  }

  function hide() { tag.hidden = true; }
  function point(e) {
    if (!shown) return null;
    const cell = under(e);
    if (!cell) { if (probe != null) { probe = null; paint(); } hide(); return null; }
    const g = ground(cell);
    const want = g.kind === 'land' || g.kind === 'pond' ? g.v.to : null;
    if (want !== probe) { probe = want; paint(); }
    tag.textContent = say(g);
    tag.hidden = false;
    const r = scene.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const tw = tag.offsetWidth, th = tag.offsetHeight;
    tag.style.left = Math.max(4, Math.min(r.width - tw - 4, x + 14)) + 'px';
    tag.style.top = Math.max(4, y - th - 12 < 4 ? y + 18 : y - th - 12) + 'px';
    return g;
  }

  canvas.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') point(e); });
  canvas.addEventListener('pointerleave', () => { if (probe != null) { probe = null; paint(); } hide(); });
  // a click on ground goes to the year the river left it
  canvas.addEventListener('click', (e) => {
    const g = point(e);
    if (!g || (g.kind !== 'land' && g.kind !== 'pond')) return;
    t = g.v.to; probe = null;
    hold();
    tag.textContent = say(g);
  });

  // the rail of years
  const yearAt = (e) => { const r = inks.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * LOOKS; };
  let dragging = false;
  rail.addEventListener('pointerdown', (e) => {
    if (!shown) return;
    dragging = true;
    try { rail.setPointerCapture(e.pointerId); } catch (err) { /* a made-up pointer has nothing to capture */ }
    t = yearAt(e); hold();
    e.preventDefault(); rail.focus({ preventScroll: true });
  });
  rail.addEventListener('pointermove', (e) => { if (dragging) { t = yearAt(e); paint(); } });
  const drop = () => { if (!dragging) return; dragging = false; if (!calm && t < LOOKS) play(); else button(); };
  rail.addEventListener('pointerup', drop);
  rail.addEventListener('pointercancel', drop);
  rail.addEventListener('keydown', (e) => {
    if (!shown) return;
    const step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -50, PageUp: 50 }[e.key];
    if (step) t = Math.max(0, Math.min(LOOKS, Math.round(t) + step));
    else if (e.key === 'Home') t = 0;
    else if (e.key === 'End') t = LOOKS;
    else return;
    e.preventDefault(); hold();
  });

  $('again').addEventListener('click', () => { if (!shown) return; if (playing) hold(); else play(); });
  $('other').addEventListener('click', () => { let n; do n = 1 + Math.floor(Math.random() * 99999); while (n === seed); open(n); });
  window.addEventListener('hashchange', () => { const n = number(); if (n && n !== seed) open(n); });

  // the sheet as a picture, with what it is written under it
  $('save').addEventListener('click', () => {
    if (!shown) return;
    const W = 2400, H = Math.round(W * P.rows / P.cols), M = 60, foot = 150;
    const keep = { w: canvas.width, h: canvas.height, view, dpr };
    canvas.width = W; canvas.height = H;
    painter.draw({ x: 0, y: 0, w: W, h: H, turn: false }, t, null, 2);
    const out = document.createElement('canvas');
    out.width = W + M * 2; out.height = H + M + foot;
    const c = out.getContext('2d');
    c.fillStyle = '#efe7d2'; c.fillRect(0, 0, out.width, out.height);
    c.drawImage(canvas, M, M);
    canvas.width = keep.w; canvas.height = keep.h; painter.draw(view, t, probe, dpr);
    const sw = 56, sx = M, sy = H + M + 34;
    window.RiverInks.forEach((k, i) => {
      c.fillStyle = `rgb(${k[0]},${k[1]},${k[2]})`; c.fillRect(sx + i * sw, sy, sw, 26);
      if (k[3]) {
        c.save(); c.beginPath(); c.rect(sx + i * sw, sy, sw, 26); c.clip();
        c.strokeStyle = `rgb(${Math.round(k[0] * 0.8)},${Math.round(k[1] * 0.8)},${Math.round(k[2] * 0.8)})`; c.lineWidth = 2;
        for (let d = -30; d < sw + 30; d += 9) { c.beginPath(); if (k[3] === 1) { c.moveTo(sx + i * sw + d, sy + 26); c.lineTo(sx + i * sw + d + 26, sy); } else { c.moveTo(sx + i * sw + d, sy); c.lineTo(sx + i * sw + d + 26, sy + 26); } c.stroke(); }
        c.restore();
      }
    });
    c.strokeStyle = '#2a2520'; c.lineWidth = 2; c.strokeRect(sx, sy, sw * 20, 26);
    c.fillStyle = '#2a2520'; c.textBaseline = 'top';
    c.font = '500 26px "Barlow", "Helvetica Neue", Arial, sans-serif';
    c.fillText('year 0', sx, sy + 38);
    c.textAlign = 'right'; c.fillText(fmt(P.years), sx + sw * 20, sy + 38);
    c.font = '500 34px "Barlow", "Helvetica Neue", Arial, sans-serif';
    c.fillText(`A river, and where it has been · river No. ${seed} · year ${fmt(t * P.every)}`, out.width - M, sy - 6);
    c.font = '400 26px "Barlow", "Helvetica Neue", Arial, sans-serif';
    c.fillText('mahiryavuz.com/works/022', out.width - M, sy + 40);
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `river-${seed}-year-${Math.round(t * P.every)}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  });

  new ResizeObserver(resize).observe(scene);
  resize();
  open(seed);
})();
