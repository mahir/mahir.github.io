// No. 010 — The S&P 500, by weight.
// Every company in the index at every report, stacked by its share, largest on top. One band per company.
(() => {
  'use strict';

  const W = window.Weights;
  if (!W) return;
  const $ = (s) => document.querySelector(s);
  const OG = new URLSearchParams(location.search).has('og');
  if (OG) document.documentElement.classList.add('og');

  const TOP = 20;
  const dates = W.dates, n = dates.length, C = W.companies, m = C.length;
  const time = dates.map((d) => Date.parse(d + 'T00:00:00Z'));
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const nice = (i) => { const [y, mo, d] = dates[i].split('-').map(Number); return `${d} ${MONTHS[mo - 1]} ${y}`; };
  const pct = (v, dp) => (v * 100).toFixed(dp == null ? (v < 0.001 ? 3 : 2) : dp) + '%';

  // ---------- the stack: where each company sits at each report ----------
  const wt = new Float32Array(m * n), top = new Float32Array(m * n).fill(NaN), bot = new Float32Array(m * n).fill(NaN);
  const rank = new Uint16Array(m * n);                     // 1 = largest, 0 = not in the index
  const order = [], count = new Uint16Array(n), topShare = new Float32Array(n);
  C.forEach((c, k) => c.w.forEach((v, j) => { wt[k * n + c.s + j] = v / 100000; }));
  for (let i = 0; i < n; i++) {
    const ks = [];
    for (let k = 0; k < m; k++) if (wt[k * n + i] > 0) ks.push(k);
    ks.sort((a, b) => wt[b * n + i] - wt[a * n + i] || a - b);
    let y = 0;
    ks.forEach((k, r) => { top[k * n + i] = y; y += wt[k * n + i]; bot[k * n + i] = y; rank[k * n + i] = r + 1; if (r === TOP - 1) topShare[i] = y; });
    order.push(ks); count[i] = ks.length;
  }
  const inTop = (k, i) => rank[k * n + i] > 0 && rank[k * n + i] <= TOP;
  // What a band's color says: was the company in the top 20 at the first report, at the last, at both, or only in between.
  const KIND = { stay: '#4b4a8c', fell: '#b5532f', rose: '#008a7e', pass: '#9aa1ab' };
  const kind = new Array(m).fill(null), peak = new Float32Array(m), peakAt = new Uint16Array(m);
  for (let k = 0; k < m; k++) {
    let ever = false;
    for (let i = 0; i < n; i++) { if (inTop(k, i)) ever = true; if (wt[k * n + i] > peak[k]) { peak[k] = wt[k * n + i]; peakAt[k] = i; } }
    const a = inTop(k, 0), b = inTop(k, n - 1);
    kind[k] = a && b ? 'stay' : a ? 'fell' : b ? 'rose' : ever ? 'pass' : null;
  }
  const featured = [], others = [];
  for (let k = 0; k < m; k++) (kind[k] ? featured : others).push(k);
  featured.sort((a, b) => peak[a] - peak[b]);              // drawn smallest first, so the largest sit on top
  const runs = C.map((c, k) => {                           // stretches of consecutive reports a company is in
    const out = []; let a = -1;
    for (let i = 0; i <= n; i++) {
      const on = i < n && wt[k * n + i] > 0;
      if (on && a < 0) a = i;
      if (!on && a >= 0) { out.push([a, i - 1]); a = -1; }
    }
    return out;
  });

  // ---------- state ----------
  let all = false;          // false: the top of the stack; true: all of it
  let cur = n - 1;          // the report the list shows
  let hover = -1, pinned = -1, hoverI = -1;
  const css = getComputedStyle(document.documentElement);
  const INK = css.getPropertyValue('--ink').trim() || '#16181c', INK2 = css.getPropertyValue('--ink-2').trim() || '#444a53';
  const MUTE = css.getPropertyValue('--mute').trim() || '#5f6670', PAPER = css.getPropertyValue('--paper').trim() || '#f6f7f8';
  const REST = '#e3e6ea', SANS = '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif', MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';

  const fig = $('#fig'), base = $('#base'), over = $('#over'), tip = $('#tip');
  const bx = base.getContext('2d'), ox = over.getContext('2d');
  let G = null;             // geometry of the current layout

  function layout() {
    const w = OG ? 1200 : fig.clientWidth, wide = w >= 900;
    const mL = wide ? 196 : 6, mR = wide ? 170 : (w >= 560 ? 150 : 104), mT = 26, mB = 26;
    const domain = all ? 1 : 0.52;
    const h = OG ? 470 : all ? (wide ? 2300 : 1900) : (wide ? Math.round(Math.min(760, Math.max(600, w * .42))) : 500);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const cv of [base, over]) {
      cv.width = Math.round(w * dpr); cv.height = Math.round((h + mT + mB) * dpr);
      cv.style.width = w + 'px'; cv.style.height = (h + mT + mB) + 'px';
      cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const x0 = mL, x1 = w - mR;
    const x = time.map((t) => x0 + (t - time[0]) / (time[n - 1] - time[0]) * (x1 - x0));
    G = { w, h, wide, mL, mR, mT, mB, x0, x1, x, Y: (v) => mT + v / domain * h, yb: mT + h, domain };
  }

  // Between two reports every band eases from its old place to its new one. Bands that cross would leave holes
  // where neither covers, so the stack is worked out again every few pixels: bands are put in order of their
  // centers, and where two neighbors leave a hole they meet in the middle of it. At a report date nothing moves.
  let SX = [], S = 0, ST = null, SB = null, SE = null;
  function sample() {
    const { x } = G, STEP = 3, at = [];
    for (let i = 0; i < n - 1; i++) { const q = Math.max(1, Math.round((x[i + 1] - x[i]) / STEP)); for (let j = 0; j < q; j++) at.push([i, j / q]); }
    at.push([n - 2, 1]);
    S = at.length; SX = new Float32Array(S); SE = new Float32Array(S);
    ST = new Float32Array(m * S).fill(NaN); SB = new Float32Array(m * S).fill(NaN);
    const seen = new Int32Array(m).fill(-1);
    at.forEach(([i, u], j) => {
      const e = u * u * (3 - 2 * u), row = [];
      SX[j] = x[i] + (x[i + 1] - x[i]) * u; SE[j] = topShare[i] + (topShare[i + 1] - topShare[i]) * e;
      for (const side of [i, i + 1]) for (const k of order[side]) {
        if (seen[k] === j) continue; seen[k] = j;
        const a = wt[k * n + i], b = wt[k * n + i + 1];
        let t, bt;
        if (a > 0 && b > 0) { t = top[k * n + i] + (top[k * n + i + 1] - top[k * n + i]) * e; bt = bot[k * n + i] + (bot[k * n + i + 1] - bot[k * n + i]) * e; }
        else {                                           // leaving or arriving: the band comes to a point half way
          const w = a > 0 ? a * (1 - 2 * u) : b * (2 * u - 1); if (w <= 0) continue;
          const c = a > 0 ? (top[k * n + i] + bot[k * n + i]) / 2 : (top[k * n + i + 1] + bot[k * n + i + 1]) / 2;
          t = c - w / 2; bt = c + w / 2;
        }
        row.push([k, t, bt]);
      }
      row.sort((p, q) => (p[1] + p[2]) - (q[1] + q[2]));
      let deep = row[0]; deep[1] = Math.min(deep[1], 0);
      for (let r = 1; r < row.length; r++) {
        const c = row[r];
        if (deep[2] < c[1]) { const mid = (deep[2] + c[1]) / 2; deep[2] = mid; c[1] = mid; }
        if (c[2] >= deep[2]) deep = c;
      }
      for (const [k, t, bt] of row) { ST[k * S + j] = t; SB[k * S + j] = bt; }
    });
  }

  // One company's band, as a path through the samples, once for each stretch it is in the index.
  function paint(ctx, k, fill, stroke, lw) {
    const { Y } = G, o = k * S;
    let j = 0;
    while (j < S) {
      if (ST[o + j] !== ST[o + j]) { j++; continue; }
      let e = j; while (e + 1 < S && ST[o + e + 1] === ST[o + e + 1]) e++;
      ctx.beginPath(); ctx.moveTo(SX[j], Y(ST[o + j]));
      for (let q = j + 1; q <= e; q++) ctx.lineTo(SX[q], Y(ST[o + q]));
      for (let q = e; q >= j; q--) ctx.lineTo(SX[q], Y(SB[o + q]));
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
      j = e + 1;
    }
  }

  // Labels down one edge, pushed apart so none overlap.
  function labels(i, side) {
    const { Y, x0, x1, wide, yb } = G, gap = wide ? 14 : 13;
    const items = order[i].slice(0, TOP).map((k) => ({ k, y: (Y(top[k * n + i]) + Y(bot[k * n + i])) / 2, at: (Y(top[k * n + i]) + Y(bot[k * n + i])) / 2 }));
    items.push({ k: -1, y: Y(topShare[i]) + 9, at: Y(topShare[i]) });
    for (let j = 1; j < items.length; j++) items[j].y = Math.max(items[j].y, items[j - 1].y + gap);
    bx.textBaseline = 'middle';
    for (const it of items) {
      if (it.y > yb + 20) continue;
      const ex = side < 0 ? x0 : x1, lx = ex + side * 14;
      bx.strokeStyle = 'rgba(22,24,28,.35)'; bx.lineWidth = 1; bx.setLineDash(it.k < 0 ? [2, 2] : []);
      bx.beginPath(); bx.moveTo(ex + side * 2, it.at); bx.lineTo(ex + side * 7, it.y); bx.lineTo(ex + side * 11, it.y); bx.stroke(); bx.setLineDash([]);
      bx.textAlign = side < 0 ? 'right' : 'left';
      if (it.k < 0) {
        bx.font = `400 10.5px ${MONO}`; bx.fillStyle = MUTE;
        bx.fillText(wide ? `top ${TOP}: ${pct(topShare[i], 1)}` : `top ${TOP} ${pct(topShare[i], 1)}`, lx, it.y);
      } else {
        const name = C[it.k].n, v = pct(wt[it.k * n + i], 1);
        bx.font = `500 ${wide ? 12 : 11}px ${SANS}`; bx.fillStyle = INK;
        if (G.mR < 140) { bx.fillText(fit(name, G.mR - 16), lx, it.y); continue; }
        const nw = bx.measureText(name).width;
        bx.fillText(name, lx, it.y);
        bx.font = `400 10.5px ${MONO}`; bx.fillStyle = MUTE;
        bx.fillText(v, lx + side * (nw + 6), it.y + .5);
      }
    }
  }
  function fit(s, w) { if (bx.measureText(s).width <= w) return s; while (s.length > 3 && bx.measureText(s + '…').width > w) s = s.slice(0, -1); return s.trim() + '…'; }

  function drawBase() {
    const { w, h, x, x0, x1, mT, yb, Y } = G;
    bx.clearRect(0, 0, w, h + 60);
    // Above the line under the 20th company the bands are drawn in full; below it they fade, so the top reads first.
    const edge = (ctx, close) => {
      ctx.beginPath(); ctx.moveTo(SX[0], Y(SE[0]));
      for (let j = 1; j < S; j++) ctx.lineTo(SX[j], Y(SE[j]));
      if (close != null) { ctx.lineTo(x1, close); ctx.lineTo(x0, close); ctx.closePath(); }
    };
    bx.fillStyle = REST; bx.fillRect(x0, mT, x1 - x0, h);
    bx.save(); edge(bx, yb + 2); bx.clip(); bx.beginPath(); bx.rect(x0, mT, x1 - x0, h); bx.clip();
    if (all) for (const k of others) paint(bx, k, null, 'rgba(22,24,28,.13)', .5);
    bx.globalAlpha = .34;
    for (const k of featured) paint(bx, k, KIND[kind[k]], null, 0);
    bx.restore();
    bx.save(); edge(bx, mT - 2); bx.clip();
    for (const k of featured) paint(bx, k, KIND[kind[k]], PAPER, .6);
    bx.restore();
    edge(bx); bx.strokeStyle = INK; bx.lineWidth = 1.25; bx.setLineDash([3, 3]); bx.stroke(); bx.setLineDash([]);
    // years
    bx.font = `400 11px ${MONO}`; bx.fillStyle = MUTE; bx.textAlign = 'center'; bx.textBaseline = 'middle';
    const y0 = +dates[0].slice(0, 4) + 1, y1 = +dates[n - 1].slice(0, 4);
    for (let y = y0; y <= y1; y++) {
      const major = y % 5 === 0 || y === y0, px = x0 + (Date.UTC(y, 0, 1) - time[0]) / (time[n - 1] - time[0]) * (x1 - x0);
      bx.strokeStyle = 'rgba(22,24,28,.3)'; bx.lineWidth = 1;
      for (const [a, b] of [[mT - (major ? 6 : 3), mT], [yb, yb + (major ? 6 : 3)]]) { bx.beginPath(); bx.moveTo(px, a); bx.lineTo(px, b); bx.stroke(); }
      if (major && (G.wide || y % 10 === 0 || y === y0)) { bx.textAlign = !G.wide && y === y0 ? 'left' : 'center'; bx.fillText(y, px, mT - 14); bx.fillText(y, px, yb + 15); }
    }
    if (!all) {
      bx.font = `500 11px ${SANS}`; bx.textAlign = 'left'; bx.lineJoin = 'round';
      const note = G.wide ? `the other ${count[n - 1] - TOP} companies continue below` : 'the others continue below';
      bx.strokeStyle = REST; bx.lineWidth = 5; bx.strokeText(note, x0 + 10, yb - 12); bx.fillStyle = INK2;
      bx.fillText(note, x0 + 10, yb - 12);
    }
    if (G.wide) labels(0, -1);
    labels(n - 1, 1);
  }

  function drawOver() {
    const { w, h, x, mT, yb } = G;
    ox.clearRect(0, 0, w, h + 60);
    const i = hoverI >= 0 ? hoverI : cur;
    ox.strokeStyle = 'rgba(22,24,28,.55)'; ox.lineWidth = 1;
    ox.beginPath(); ox.moveTo(Math.round(x[i]) + .5, mT - 4); ox.lineTo(Math.round(x[i]) + .5, yb + 4); ox.stroke();
    ox.save(); ox.beginPath(); ox.rect(G.x0, mT, G.x1 - G.x0, h); ox.clip();
    if (pinned >= 0) paint(ox, pinned, INK, INK, 1.5);
    if (hover >= 0 && hover !== pinned) paint(ox, hover, pinned >= 0 ? 'rgba(22,24,28,.55)' : INK, pinned >= 0 ? 'rgba(22,24,28,.55)' : INK, 1.5);
    ox.restore();
  }

  // ---------- pointing ----------
  function pick(px, py) {
    const { Y, mT, yb, x0, x1, x } = G;
    if (px < x0 - 4 || px > x1 + 4 || py < mT || py > yb) return null;
    let j = 0; while (j < S - 1 && (SX[j] + SX[j + 1]) / 2 < px) j++;
    let near = 0; while (near < n - 1 && (x[near] + x[near + 1]) / 2 < px) near++;
    const list = all ? featured.slice().reverse().concat(others) : featured.slice().reverse();
    for (const k of list) {
      const t = ST[k * S + j];
      if (t !== t) continue;
      const a = Y(t), b = Y(SB[k * S + j]);
      if (py >= a - 1 && py <= Math.max(b, a + 2)) {
        let i = near;
        if (!(wt[k * n + i] > 0)) i = px < x[near] ? near - 1 : near + 1;
        if (!(wt[k * n + i] > 0)) i = px < x[near] ? near + 1 : near - 1;
        return { k, near: i };
      }
    }
    return { k: -1, near };
  }

  function showTip(k, i, px, py) {
    let html;
    if (k < 0) {
      html = `<b>The other ${count[i] - TOP} companies</b><span>${nice(i)}</span><span class="v">${pct(1 - topShare[i], 1)} of the index</span>`;
    } else {
      const c = C[k];
      html = `<b>${esc(c.n)}</b>${c.aka ? `<span>earlier ${esc(c.aka.slice(0, 2).join(', '))}</span>` : ''}<span>${nice(i)}</span>` +
        `<span class="v">${pct(wt[k * n + i])} of the index · No. ${rank[k * n + i]}</span>`;
    }
    tip.innerHTML = html; tip.hidden = false;
    const r = fig.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    let tx = px + 14, ty = py - th - 12;
    if (tx + tw > r.width - 4) tx = px - tw - 14;
    if (tx < 4) tx = 4;
    if (ty < 0) ty = py + 16;
    tip.style.transform = `translate(${Math.round(tx)}px, ${Math.round(ty)}px)`;
  }
  const esc = (s) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  function move(e) {
    const r = over.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const hit = pick(px, py);
    if (!hit) return leave();
    hover = hit.k; hoverI = hit.near;
    over.style.cursor = hit.k >= 0 ? 'pointer' : 'default';
    showTip(hit.k, hit.near, px, py); drawOver();
    return hit;
  }
  function leave() { hover = -1; hoverI = -1; tip.hidden = true; drawOver(); }
  over.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') move(e); });
  over.addEventListener('pointerleave', leave);
  over.addEventListener('click', (e) => {
    const hit = move(e);
    if (!hit) return;
    setDate(hit.near);
    select(hit.k >= 0 && hit.k !== pinned ? hit.k : -1);
    if (e.pointerType === 'touch' || hit.k < 0) setTimeout(() => { tip.hidden = true; }, 1800);
  });

  // ---------- the list and the company panel ----------
  const list = $('#list'), when = $('#when'), slider = $('#date'), sum = $('#sum'), panel = $('#panel');
  slider.max = n - 1; slider.value = cur;
  slider.addEventListener('input', () => setDate(+slider.value));

  function setDate(i) {
    cur = i; slider.value = i; slider.setAttribute('aria-valuetext', nice(i));
    when.textContent = nice(i);
    sum.textContent = `Together ${pct(topShare[i], 1)} of the index. The other ${count[i] - TOP} companies hold ${pct(1 - topShare[i], 1)}.`;
    list.innerHTML = order[i].slice(0, TOP).map((k, r) =>
      `<li><button type="button" data-k="${k}" aria-pressed="${k === pinned}"><span class="r">${r + 1}</span><i class="chip" style="--c:${KIND[kind[k]]}"></i>` +
      `<span class="nm">${esc(C[k].n)}</span><span class="v">${pct(wt[k * n + i])}</span></button></li>`).join('');
    drawOver();
  }
  list.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) select(+b.dataset.k === pinned ? -1 : +b.dataset.k); });

  function select(k) {
    pinned = k;
    for (const b of list.querySelectorAll('button')) b.setAttribute('aria-pressed', +b.dataset.k === k);
    if (k < 0) { panel.hidden = true; drawOver(); return; }
    const c = C[k], first = c.s, last = c.s + c.w.length - 1, here = wt[k * n + cur] > 0;
    const says = [];
    says.push(`${first === 0 ? `In the index at the first report, ${nice(0)}` : `First in the report of ${nice(first)}`}${last < n - 1 ? `, last in the report of ${nice(last)}` : ''}.`);
    says.push(`Largest share ${pct(peak[k])}, on ${nice(peakAt[k])}, when it ranked No. ${rank[k * n + peakAt[k]]}.`);
    if (last === n - 1) says.push(`Now ${pct(wt[k * n + n - 1])}, No. ${rank[k * n + n - 1]}.`);
    if (here && cur !== n - 1 && cur !== peakAt[k]) says.push(`On ${nice(cur)}: ${pct(wt[k * n + cur])}, No. ${rank[k * n + cur]}.`);
    panel.innerHTML = `<div><h3>${esc(c.n)}</h3>${c.aka ? `<p class="aka">Earlier ${esc(c.aka.join(', '))}</p>` : ''}<p>${says.join(' ')}</p>` +
      `<button type="button" class="link" id="clear">Clear</button></div>${spark(k)}`;
    panel.hidden = false;
    $('#clear').addEventListener('click', () => { select(-1); find.value = ''; });
    drawOver();
  }
  // A company's share over the whole period, on its own scale.
  function spark(k) {
    const w = 320, h = 84, pad = 4, max = peak[k], X = (i) => pad + (time[i] - time[0]) / (time[n - 1] - time[0]) * (w - 2 * pad), Yv = (v) => h - 16 - v / max * (h - 30);
    let d = '';
    for (const [a, b] of runs[k]) {
      d += `M${X(a).toFixed(1)},${Yv(0).toFixed(1)}`;
      for (let i = a; i <= b; i++) d += `L${X(i).toFixed(1)},${Yv(wt[k * n + i]).toFixed(1)}`;
      d += `L${X(b).toFixed(1)},${Yv(0).toFixed(1)}Z`;
    }
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Share of the index over time, peaking at ${pct(max)}"><path d="${d}" fill="${kind[k] ? KIND[kind[k]] : '#8a919b'}"/>` +
      `<line x1="${pad}" x2="${w - pad}" y1="${h - 16}" y2="${h - 16}" stroke="rgba(22,24,28,.35)"/>` +
      `<text x="${pad}" y="${h - 3}">${dates[0].slice(0, 4)}</text><text x="${w - pad}" y="${h - 3}" text-anchor="end">${dates[n - 1].slice(0, 4)}</text>` +
      `<text x="${Math.min(Math.max(X(peakAt[k]), 24), w - 24)}" y="10" text-anchor="middle">${pct(max)}</text></svg>`;
  }

  // ---------- find a company ----------
  const find = $('#find'), names = $('#names');
  const byName = new Map();
  C.forEach((c, k) => { if (!byName.has(c.n.toLowerCase())) byName.set(c.n.toLowerCase(), k); });
  names.innerHTML = C.map((c) => `<option value="${esc(c.n)}">`).join('');
  function lookup() {
    const q = find.value.trim().toLowerCase();
    if (!q) return;
    let k = byName.get(q);
    if (k == null) k = C.findIndex((c) => c.n.toLowerCase().startsWith(q) || (c.aka || []).some((a) => a.toLowerCase().startsWith(q)));
    if (k >= 0) { select(k); find.value = C[k].n; }
  }
  find.addEventListener('change', lookup);
  find.addEventListener('keydown', (e) => { if (e.key === 'Enter') lookup(); });

  // ---------- the top, or all of it ----------
  const toggle = $('#toggle');
  function setAll(v) {
    all = v; toggle.setAttribute('aria-pressed', v);
    toggle.textContent = v ? `Show the top ${TOP} only` : `Show all ${count[n - 1]} companies`;
    redraw();
  }
  toggle.addEventListener('click', () => { const y = fig.getBoundingClientRect().top; setAll(!all); if (y < 0) fig.scrollIntoView(); });

  function redraw() { layout(); sample(); drawBase(); drawOver(); }
  let lastW = 0;
  new ResizeObserver(() => { if (fig.clientWidth !== lastW) { lastW = fig.clientWidth; redraw(); } }).observe(fig);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);

  // The numbers in the opening lines, from the data.
  const stayed = featured.filter((k) => kind[k] === 'stay').length;
  for (const [id, v] of [['#n-first', pct(topShare[0], 1)], ['#n-last', pct(topShare[n - 1], 1)], ['#n-stay', ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][stayed] || stayed],
    ['#n-date', nice(n - 1).replace(/^\d+ /, '')], ['#n-reports', n], ['#n-companies', m.toLocaleString('en-US')]]) { const el = $(id); if (el) el.textContent = v; }

  document.documentElement.classList.remove('no-js');
  setAll(false); setDate(cur);
})();
