/* No. 017 · the sections, the large view, recolor and Save card. The cards themselves are in the HTML. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.replace('no-js', 'js');
  const P = window.Palette;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = id => document.getElementById(id);
  const tiles = [...document.querySelectorAll('.wall .tile')];
  const BOTTOM = 107;            // the saying stays above this line, in cqw: the footer's top rule is at 114.8

  // ---------- fit: the baked size should already fit; if this browser sets the type wider, step it down ----------
  const wide = (p, l) => l.scrollWidth > p.clientWidth + 1;
  function overflows(card) {
    const p = card.querySelector('.q p'), unit = card.clientWidth / 100;
    if (!unit) return false;
    const top = card.getBoundingClientRect().top;
    const bottom = (p.getBoundingClientRect().bottom - top) / unit;
    return bottom > BOTTOM + 0.5 || p.scrollWidth > p.clientWidth + 1 || [...p.querySelectorAll('.ln')].some(l => wide(p, l));
  }
  function refit(card) {
    const p = card.querySelector('.q p');
    // a baked line wider than the measure: this browser is not setting the face the build measured, so let the card wrap
    if (!card.classList.contains('wrap') && [...p.querySelectorAll('.ln')].some(l => wide(p, l))) card.classList.add('wrap');
    let fs = parseFloat(card.style.getPropertyValue('--fs')) || 10;
    for (let i = 0; i < 40 && overflows(card); i++) { fs = Math.round(fs * 0.97 * 100) / 100; card.style.setProperty('--fs', fs); }
  }
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  // a card is checked when it first comes near the screen, so a long page costs nothing until it is read
  fontsReady.then(() => {
    if (!('IntersectionObserver' in window)) return tiles.forEach(t => refit(t.querySelector('.card')));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      refit(e.target.querySelector('.card'));
    }), { rootMargin: '600px 0px' });
    tiles.forEach(t => io.observe(t));
  });

  // ---------- sections: one row each, "Show all" for the rest ----------
  const shown = tiles;           // Previous and Next walk every card, theme after theme
  const sections = [...document.querySelectorAll('.theme')];
  function setOpen(sec, on) {
    const b = sec.querySelector('.more');
    sec.classList.toggle('open', on);
    if (!b) return;
    b.setAttribute('aria-expanded', String(on));
    b.textContent = on ? 'Show fewer' : `Show all ${b.dataset.n}`;
  }
  for (const sec of sections) {
    const b = sec.querySelector('.more');
    if (!b) continue;
    b.hidden = false;
    b.addEventListener('click', () => {
      const on = !sec.classList.contains('open');
      setOpen(sec, on);
      // closing a long section from its foot: bring its heading back rather than leave the reader further down the page
      if (!on && sec.getBoundingClientRect().top < 0) sec.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    });
  }
  // a card that a closed section is hiding: open the section
  function reveal(tile) {
    const sec = tile.closest('.theme');
    if (sec && !tile.querySelector('.card').getClientRects().length) setOpen(sec, true);
  }

  // the index of themes marks the section being read
  const strip = document.querySelector('.jump ol');
  const jump = [...document.querySelectorAll('.jump a')];
  let ticking = false;
  function mark() {
    ticking = false;
    const line = (document.querySelector('.jump')?.offsetHeight || 0) + 80;
    let cur = null;
    for (const sec of sections) if (sec.getBoundingClientRect().top <= line) cur = sec;
    let changed = false;
    for (const a of jump) {
      const on = String(!!cur && a.getAttribute('href') === '#' + cur.id);
      if (a.getAttribute('aria-current') !== on) { a.setAttribute('aria-current', on); changed = true; }
    }
    if (changed && strip && strip.scrollWidth > strip.clientWidth) follow();
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(mark); } }, { passive: true });
  mark();
  // the row of themes, when it is wider than the screen, fades at its cut edge until scrolled to the end
  function edge() {
    if (!strip) return;
    strip.classList.toggle('over', strip.scrollWidth > strip.clientWidth + 1);
    strip.classList.toggle('end', strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2);
  }
  strip?.addEventListener('scroll', edge, { passive: true });
  addEventListener('resize', edge);
  fontsReady.then(edge);
  // keep the marked theme in view in the row
  function follow() {
    const a = strip.querySelector('[aria-current="true"]');
    if (!a) return;
    const l = a.offsetLeft - strip.offsetLeft, r = l + a.offsetWidth;
    if (l < strip.scrollLeft || r > strip.scrollLeft + strip.clientWidth - 40) strip.scrollTo({ left: Math.max(0, l - 24), behavior: reduce.matches ? 'auto' : 'smooth' });
  }

  // ---------- color ----------
  function setColor(tile, variant) {
    const p = P.pair(tile.dataset.theme, variant);
    tile.dataset.variant = p.variant;
    const edge = P.contrast(p.field, ground()) < EDGE_BELOW;
    for (const card of [tile.querySelector('.card'), current === tile && $('frame').querySelector('.card')]) {
      if (!card) continue;
      card.style.setProperty('--f', p.field);
      card.style.setProperty('--i', p.ink);
      card.classList.toggle('edge', edge);
    }
    return p;
  }
  // a card whose field is close to the page's ground gets a hairline edge (the generator bakes the same rule)
  const EDGE_BELOW = 1.3;
  let groundHex = null;
  function ground() {
    if (groundHex) return groundHex;
    const v = getComputedStyle(root).getPropertyValue('--ground').trim();
    return (groundHex = /^#[0-9a-f]{6}$/i.test(v) ? v : '#ebe6dc');
  }
  const NAMES = { ink: 'ink on color', deep: 'paper on deep', tonal: 'tonal', pale: 'tonal, pale', complement: 'complement', neighbor: 'neighbor', quiet: 'quiet', mid: 'paper on mid', shade: 'ink on shade', dusk: 'ink on dusk' };
  function describe(tile) {
    const t = P.theme(tile.dataset.theme), p = P.pair(t.name, tile.dataset.variant);
    const fam = P.FAMILIES[t.family].name;
    const i = t.variants.indexOf(p.variant) + 1;
    const name = NAMES[p.variant] || (p.variant.startsWith('ink-') ? `${P.FAMILIES[p.variant.slice(4)].name} ink on paper` : p.variant);
    return `${fam} · ${name} · ${i} of ${t.variants.length} · ${p.field} / ${p.ink}`;
  }

  // ---------- the large view ----------
  const view = $('view'), frame = $('frame'), info = $('info');
  let current = null, opener = null;

  function show(tile, how) {
    current = tile;
    const card = tile.querySelector('.card').cloneNode(true);
    card.removeAttribute('href');
    card.setAttribute('role', 'img');
    card.setAttribute('aria-label', tile.querySelector('.q').textContent.trim());
    if (how !== 'still' && !reduce.matches) card.classList.add('enter');
    frame.replaceChildren(card);
    const src = tile.querySelector('.src').cloneNode(true);
    const scheme = document.createElement('p');
    scheme.className = 'scheme'; scheme.id = 'scheme'; scheme.textContent = describe(tile);
    info.replaceChildren(src, scheme);
    if (src.querySelector('[dir="rtl"]')) loadFont('Noto+Naskh+Arabic');
    if (src.querySelector('[lang="pa-Guru"]')) loadFont('Noto+Serif+Gurmukhi');
    const i = shown.indexOf(tile);
    $('count').textContent = `${i + 1} of ${shown.length}`;
    $('prev').disabled = i <= 0;
    $('next').disabled = i >= shown.length - 1;
    swatch();
    requestAnimationFrame(() => refit(card));
  }
  function swatch() {
    const sw = $('recolor').querySelector('.sw'), t = P.theme(current.dataset.theme);
    const vs = t.variants, next = P.pair(t.name, vs[(vs.indexOf(current.dataset.variant) + 1) % vs.length]);
    sw.style.setProperty('--f', next.field); sw.style.setProperty('--i', next.ink);
  }
  function open(tile, push) {
    if (!tile) return;
    const opening = !view.open;
    if (opening) { opener = tile.querySelector('.card'); view.showModal(); }
    show(tile);
    if (opening) $('close').focus();
    const url = '#' + tile.id;
    if (location.hash !== url) history[push ? 'pushState' : 'replaceState'](null, '', url);
  }
  function close() {
    if (view.open) view.close();
    closed();
  }
  // run when the view closes, by the button, by Esc or by the address; once
  function closed() {
    if (view.open || (!current && !frame.firstChild)) return;
    const t = current;
    current = null; frame.replaceChildren(); info.replaceChildren();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    // back on the wall at the card last shown, its section opened if it was folded away
    if (t) reveal(t);
    const back = t ? t.querySelector('.card') : opener;
    if (back) { back.focus({ preventScroll: true }); back.scrollIntoView({ block: 'nearest' }); }
  }
  view.addEventListener('close', closed);
  view.addEventListener('cancel', e => { e.preventDefault(); close(); });   // Esc
  function step(d) {
    const i = shown.indexOf(current) + d;
    if (i < 0 || i >= shown.length) return;
    open(shown[i], false);
  }

  document.getElementById('wall').addEventListener('click', e => {
    const a = e.target.closest('.card');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(a.closest('.tile'), true);
  });
  $('close').addEventListener('click', close);
  $('prev').addEventListener('click', () => step(-1));
  $('next').addEventListener('click', () => step(1));
  $('recolor').addEventListener('click', () => {
    const t = P.theme(current.dataset.theme), vs = t.variants;
    setColor(current, vs[(vs.indexOf(current.dataset.variant) + 1) % vs.length]);
    $('scheme').textContent = describe(current);
    swatch();
  });
  $('save').addEventListener('click', async () => {
    const b = $('save'); b.disabled = true;
    try { await download(current); } finally { b.disabled = false; }
  });
  view.addEventListener('keydown', e => {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });
  // a click on the empty ground closes, as Esc does
  view.addEventListener('click', e => { if (e.target === view || e.target.classList.contains('view-in')) close(); });

  // swipe on touch
  let sx = 0, sy = 0, st = 0;
  frame.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; st = e.timeStamp; } });
  frame.addEventListener('pointerup', e => {
    if (e.pointerType === 'mouse' || !st) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; st = 0;
    if (Math.abs(dx) > 48 && Math.abs(dx) > 1.5 * Math.abs(dy)) step(dx < 0 ? 1 : -1);
  });
  frame.addEventListener('pointercancel', () => { st = 0; });

  // an address opens its card
  const byId = id => tiles.find(t => t.id === decodeURIComponent(id));
  function route(first) {
    const id = location.hash.slice(1), t = id && byId(id);
    if (t) {
      // arriving at a card's address: the wall behind is scrolled to that card, its section open
      if (first === true) { reveal(t); t.scrollIntoView({ block: 'center' }); }
      if (t !== current) open(t, false);
    }
    else if (view.open) close();
  }
  addEventListener('popstate', route);
  addEventListener('hashchange', route);
  if (location.hash) fontsReady.then(() => route(true));

  // a face for the original's script, fetched the first time a card needs it
  const loaded = new Set();
  function loadFont(family) {
    if (loaded.has(family)) return; loaded.add(family);
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=${family}:wght@400&display=swap`;
    document.head.append(l);
  }

  // ---------- Save card: read the lines out of the laid-out card, draw them on a 1080 x 1350 canvas ----------
  const W = 1080, H = 1350;
  async function renderCard(card) {
    await fontsReady;
    // lay a copy out at exactly 1080 wide, off screen, so every position is in output pixels
    const host = document.createElement('div');
    host.style.cssText = `position:fixed;left:-${W + 200}px;top:0;width:${W}px;pointer-events:none;contain:layout`;
    const c = card.cloneNode(true);
    c.classList.remove('enter');
    c.style.transition = 'none';
    host.append(c); document.body.append(host);
    refit(c);
    try {
      const ox = c.getBoundingClientRect().left, oy = c.getBoundingClientRect().top;
      const cs = getComputedStyle(c);
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = cs.backgroundColor; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = cs.color; ctx.strokeStyle = cs.color;
      if ('fontKerning' in ctx) ctx.fontKerning = 'normal';
      ctx.textBaseline = 'alphabetic';
      for (const run of runs(c.querySelector('.q'))) drawRun(ctx, run, ox, oy);
      const ft = c.querySelector('.ft'), fr = ft.getBoundingClientRect(), fcs = getComputedStyle(ft);
      const bt = parseFloat(fcs.borderTopWidth), bb = parseFloat(fcs.borderBottomWidth);
      ctx.fillRect(0, fr.top - oy, W, bt);
      ctx.fillRect(0, fr.bottom - oy - bb, W, bb);
      for (const s of ft.children) {
        const r = document.createRange(); r.selectNodeContents(s);
        const rect = r.getClientRects()[0]; if (!rect) continue;
        const scs = getComputedStyle(s);
        const text = s.textContent;   // set in capitals by the generator, Turkish İ included
        drawRun(ctx, { text, rect, cs: scs }, ox, oy);
      }
      return canvas;
    } finally { host.remove(); }
  }
  // Each run is a stretch of one text node on one line, in one style. Words are drawn at their own laid-out x,
  // so kerning, tracking and line breaks are the browser's own.
  function runs(q) {
    const out = [], walker = document.createTreeWalker(q, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node; (node = walker.nextNode());) {
      const cs = getComputedStyle(node.parentElement), s = node.data;
      // split into words, keeping each word with the spaces before it out of it
      const re = /\S+/g;
      for (let m; (m = re.exec(s));) {
        range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length);
        const rects = [...range.getClientRects()].filter(r => r.width > 0);
        if (rects.length === 1) { out.push({ text: m[0], rect: rects[0], cs }); continue; }
        // a word split across lines (rare): fall back to letters
        for (let k = 0; k < m[0].length; k++) {
          range.setStart(node, m.index + k); range.setEnd(node, m.index + k + 1);
          const r = range.getClientRects()[0]; if (r) out.push({ text: m[0][k], rect: r, cs });
        }
      }
    }
    return out;
  }
  const metrics = new Map();
  function drawRun(ctx, { text, rect, cs }, ox, oy) {
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    ctx.font = font;
    const ls = parseFloat(cs.letterSpacing) || 0;
    if ('letterSpacing' in ctx) ctx.letterSpacing = ls + 'px';
    // the run's box is the font's ascent + descent; the baseline is the ascent below its top
    if (!metrics.has(font)) metrics.set(font, ctx.measureText('Hxg'));
    const m = metrics.get(font);
    const y = rect.top - oy + m.fontBoundingBoxAscent;
    if ('letterSpacing' in ctx || !ls) { ctx.fillText(text, rect.left - ox, y); return; }
    // no canvas letter-spacing in this browser: place each letter where tracking puts it
    let x = rect.left - ox;
    for (const ch of text) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + ls; }
  }
  async function download(tile) {
    const canvas = await renderCard($('frame').querySelector('.card') || tile.querySelector('.card'));
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `no-017-${tile.id}.png`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  // for the build's own check of Save card against the screen
  window.No017 = { renderCard, refit, overflows };
})();
