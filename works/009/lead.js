// No. 009, the Senate result and the record behind the scorecard's signals, filled in with 2026 once it is in.
(() => {
  'use strict';
  const M = window.MIDTERMS, S = window.STATES, T = window.TIDE;
  if (!M || !S || !T) return;
  const { el, scale, signed, hover, axisX, axisY, range, watch, color } = T;
  const now = M.y2026, counted = now.house != null;
  const scored = M.midterms.filter((m) => m.change != null);
  const majority = (size) => Math.floor(size / 2) + 1;
  const spare = (m) => m.seats0 - majority(m.size0);
  const tip = (title, sub, rows) => `<b>${title}</b>${sub ? `<div class="who">${sub}</div>` : ''}<dl>${rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`;
  const kept = (m) => m.seats1 >= majority(m.size1);
  const now26 = counted ? { ...now, seats1: now.house, size1: 435 } : null;
  const label = (svg, x, y, text, anchor = 'start', strong) =>
    el('text', { x, y, 'text-anchor': anchor, class: 'ghost-label', style: strong ? null : 'font-weight:400;fill:var(--ink-2)' }, svg).textContent = text;

  // ---------- record 1. approval and the majority ----------
  const PLACE = { 1994: 'left', 2010: 'below', 1978: 'above' };
  function drawRule(chart) {
    const W = chart.clientWidth, H = Math.round(Math.max(260, Math.min(360, W * .55)));
    const m = { t: 30, r: 16, b: 38, l: 40 };
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const pts = scored.filter((d) => d.y >= 1946 && d.approval && d.approval.v < 50 && spare(d) >= 0);
    const x = scale([0, 80], [m.l, W - m.r]);
    const y = scale([52, 22], [m.t, H - m.b]);
    axisY(svg, y, range(25, 50, 5), m.l, W - m.r, (t) => `${t}%`);
    axisX(svg, x, range(0, 80, 20), H - m.b + 18, String);
    el('text', { x: W - m.r, y: H - 4, 'text-anchor': 'end', class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = 'House seats over a majority';
    const cut = x(42.5);
    el('line', { x1: cut, x2: cut, y1: m.t - 18, y2: H - m.b, class: 'rule-line' }, svg);
    el('text', { x: cut - 8, y: m.t - 8, 'text-anchor': 'end', class: 'rule-label' }, svg).textContent = '40 or fewer: all lost';
    el('text', { x: cut + 8, y: m.t - 8, class: 'rule-label', style: 'font-weight:400;fill:var(--ink-2)' }, svg).textContent = '45 or more: all kept';
    const marks = el('g', {}, svg);
    const all = now26 ? pts.concat([now26]) : pts;
    for (const d of all) {
      const cx = x(spare(d)), cy = y(d.approval.v), c = color(d.party);
      const lost = !kept(d);
      const dot = el('circle', { cx, cy, r: 6, class: 'mark', style: lost ? `fill:${c};stroke:var(--paper);stroke-width:1.5` : `fill:var(--paper);stroke:${c};stroke-width:2.2` }, marks);
      const at = PLACE[d.y] || 'right';  // a few labels move off the line or off a neighbour
      if (at === 'left') label(svg, cx - 10, cy + 4, d.y, 'end', d.y === 2026);
      else if (at === 'above') label(svg, cx, cy - 11, d.y, 'middle', d.y === 2026);
      else if (at === 'below') label(svg, cx, cy + 19, d.y, 'middle', d.y === 2026);
      else label(svg, cx + 10, cy + 4, d.y, 'start', d.y === 2026);
      const hit = el('circle', { cx, cy, r: 13, fill: 'transparent', class: 'hit' }, svg);
      hover(hit, chart, svg, `ru${d.y}`, () => tip(String(d.y), `${d.president} · ${d.partyName}`, [
        ['Approval', `${d.approval.v}%`], ['Over a majority', `${spare(d)} seats`], ['House', `${signed(d.change)}, ${lost ? 'lost it' : 'kept it'}`],
      ]), () => [cx, cy], dot);
    }
    if (!counted) {
      const cx = x(spare(now)), cy = y(now.approval.v);
      el('circle', { cx, cy, r: 7, class: 'ghost-bar' }, svg);
      label(svg, cx + 11, cy + 4, '2026', 'start', true);
    }
  }

  // ---------- 2026: each Senate race against the state's 2024 vote for president ----------
  // One row per race with both parties on the ballot, from Trump's best state down: an open ring at Trump's 2024
  // margin, a dot at the 2026 Senate margin in the winner's color, and a line between them.
  const races26 = () => {
    const shares = now.senateShares || {}, calls = now.senateCalls || {};
    return S.senate2026.filter((d) => shares[d.s]).map((d) => {
      const [dem, rep] = shares[d.s];
      return { ...d, r: (rep - dem) / (dem + rep) * 100, won: calls[d.s] };
    }).sort((a, b) => b.m - a.m);
  };
  const lead = (v, r, d) => (Math.abs(v) < .5 ? 'even' : v > 0 ? `${r} +${v.toFixed(0)}` : `${d} +${(-v).toFixed(0)}`);
  function drawMoves(chart) {
    const W = chart.clientWidth, narrow = W < 520, rows = races26();
    const row = 20, m = { t: 30, r: narrow ? 10 : 104, b: 30, l: narrow ? 30 : 116 };
    const H = m.t + m.b + row * rows.length;
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const x = scale([-45, 50], [m.l, W - m.r]);
    const ax = el('g', { class: 'axis' }, svg);
    for (const t of range(-40, 40, 20)) {
      el('line', { x1: x(t), x2: x(t), y1: m.t - 4, y2: H - m.b + 4, ...(t === 0 ? { style: 'stroke:var(--ink);stroke-width:1' } : {}) }, ax);
      el('text', { x: x(t), y: H - 8, 'text-anchor': 'middle' }, ax).textContent = t === 0 ? 'even' : t < 0 ? `D +${-t}` : `R +${t}`;
    }
    el('text', { x: x(0) - 8, y: 14, 'text-anchor': 'end', class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = '← more Democratic';
    el('text', { x: x(0) + 8, y: 14, class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = 'more Republican →';
    const marks = el('g', {}, svg);
    rows.forEach((d, i) => {
      const cy = m.t + i * row + row / 2, x0 = x(d.m), x1 = x(d.r);
      const flip = d.won && d.won !== d.h;
      el('text', { x: m.l - 12, y: cy + 4, 'text-anchor': 'end', class: 'ghost-label', style: flip ? null : 'font-weight:400;fill:var(--ink-2)' }, svg).textContent = narrow ? d.s : S.names[d.s];
      const g = el('g', {}, marks);
      el('line', { x1: x0, x2: x1, y1: cy, y2: cy, style: 'stroke:var(--ink-2);stroke-width:1.5' }, g);
      el('circle', { cx: x0, cy, r: 4, style: 'fill:var(--paper);stroke:var(--ink-2);stroke-width:1.5' }, g);
      el('circle', { cx: x1, cy, r: 5.5, class: 'mark', style: `fill:${color(d.won || (d.r < 0 ? 'D' : 'R'))};opacity:${d.won ? 1 : .45};stroke:${flip ? 'var(--ink)' : 'var(--paper)'};stroke-width:${flip ? 2 : 1.5}` }, g);
      if (flip && !narrow) el('text', { x: W - m.r + 12, y: cy + 4, class: 'axis', style: 'font:400 11px var(--mono);fill:var(--ink)' }, svg).textContent = 'changed hands';
      const hit = el('rect', { x: 0, y: cy - row / 2, width: W, height: row, fill: 'transparent', class: 'hit' }, svg);
      hover(hit, chart, svg, `mv${d.s}`, () => tip(S.names[d.s], flip ? 'Changed hands' : d.won ? 'Held' : 'Still counting', [
        ['2024, president', lead(d.m, 'Trump', 'Harris')], ['2026, Senate', lead(d.r, 'Republican', 'Democrat')],
        ['Moved', `${Math.abs(d.m - d.r).toFixed(0)} pts toward the ${d.r < d.m ? 'Democrats' : 'Republicans'}`],
      ]), () => [x1, cy - 6], g);
    });
  }

  // ---------- 2026 against every midterm since 1978 ----------
  // The share of Senate races with both parties on the ballot that moved against the president's party.
  function drawShare(chart) {
    const W = chart.clientWidth;
    const rows = Object.entries(S.senateSwing).map(([yr, v]) => ({ y: +yr, p: S.president[yr], n: v.length, k: v.filter((s) => s > 0).length }));
    const r26 = races26();
    if (r26.length) rows.push({ y: 2026, p: 'R', n: r26.length, k: r26.filter((d) => d.m > d.r).length });
    const row = 24, m = { t: 4, r: 76, b: 4, l: 46 };
    const H = m.t + m.b + row * rows.length;
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const x = scale([0, 1], [m.l, W - m.r]);
    const track = el('g', {}, svg), marks = el('g', {}, svg);
    rows.forEach((d, i) => {
      const cy = m.t + i * row + row / 2, is26 = d.y === 2026;
      el('text', { x: 0, y: cy + 4, class: 'ghost-label', style: is26 ? null : 'font-weight:400;fill:var(--ink-2)' }, svg).textContent = d.y;
      el('rect', { x: x(0), y: cy - 5, width: x(1) - x(0), height: 10, rx: 2, class: 'band' }, track);
      const b = el('rect', { x: x(0), y: cy - 5, width: x(d.k / d.n) - x(0), height: 10, rx: 2, class: 'mark', style: `fill:${is26 ? 'var(--ink)' : '#a9a397'}` }, marks);
      label(svg, W, cy + 4, `${d.k} of ${d.n}`, 'end', is26);
      const hit = el('rect', { x: 0, y: cy - row / 2, width: W, height: row, fill: 'transparent', class: 'hit' }, svg);
      hover(hit, chart, svg, `sh${d.y}`, () => tip(String(d.y), `${d.p === 'D' ? 'Democrats' : 'Republicans'}, the president’s party`, [
        ['Moved against it', `${d.k} of ${d.n} races`], ['Share', `${Math.round(d.k / d.n * 100)}%`],
      ]), () => [x(d.k / d.n), cy - 6], b);
    });
  }

  // ---------- record 6. the ballot ----------
  function drawContest(chart) {
    const W = chart.clientWidth, H = Math.round(Math.max(260, Math.min(360, W * .55)));
    const m = { t: 24, r: 16, b: 38, l: 40 };
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const x = scale([0, 55], [m.l, W - m.r]);
    const y = scale([15, -70], [m.t, H - m.b]);
    axisY(svg, y, range(-60, 0, 20), m.l, W - m.r, (t) => (t === 0 ? '0' : signed(t)));
    axisX(svg, x, range(0, 50, 10), H - m.b + 18, String);
    el('text', { x: W - m.r, y: H - 4, 'text-anchor': 'end', class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = 'Seats the out-party left uncontested';
    el('text', { x: m.l + 4, y: m.t - 8, class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = 'House seats, president’s party';
    const u26 = S.uncontested2026;
    el('line', { x1: x(u26), x2: x(u26), y1: m.t, y2: H - m.b, class: 'rule-line' }, svg);
    el('text', { x: x(u26) + 6, y: m.t + 12, class: 'rule-label' }, svg).textContent = `2026: ${u26}`;
    const marks = el('g', {}, svg);
    const pts = Object.entries(S.uncontested).map(([yr, n]) => ({ ...scored.find((d) => d.y === +yr), u: n }));
    if (now26) pts.push({ ...now26, u: u26 });
    for (const d of pts) {
      const cx = x(d.u), cy = y(d.change);
      const dot = el('circle', { cx, cy, r: 5.5, class: 'mark', style: `fill:${color(d.party)};stroke:${d.y === 2026 ? 'var(--ink)' : 'var(--paper)'};stroke-width:${d.y === 2026 ? 2 : 1.5}` }, marks);
      label(svg, cx + 9, cy + 4, d.y);
      const hit = el('circle', { cx, cy, r: 12, fill: 'transparent', class: 'hit' }, svg);
      hover(hit, chart, svg, `co${d.y}`, () => tip(String(d.y), `${d.president} · ${d.partyName}`, [
        ['Uncontested', `${d.u} seats`], ['House', `${signed(d.change)} seats`],
      ]), () => [cx, cy], dot);
    }
  }

  // ---------- record 4. the calendar ----------
  // One line of elections; changes of control in midterms are named above it, in presidential years below.
  function drawControl(chart) {
    const W = chart.clientWidth, H = 96;
    const narrow = W < 520, m = { l: narrow ? 14 : 96, r: 18 };
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const x = scale([1946, 2026], [m.l, W - m.r]);
    const base = 48;
    el('line', { x1: x(1946), x2: x(2026), y1: base, y2: base, stroke: 'var(--rule)', 'stroke-width': 1.5 }, svg);
    if (!narrow) {
      el('text', { x: 0, y: base - 14, class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = 'in a midterm';
      el('text', { x: 0, y: base + 24, class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = 'presidential';
    }
    const changes = new Map(M.control.map((c) => [c.y, c]));
    if (now26 && !kept(now26)) changes.set(2026, { y: 2026, kind: 'midterm', to: 'D' });
    const yr2 = (yr) => `’${String(yr).slice(2)}`;  // four-year neighbours sit too close for full years
    for (let yr = 1946; yr <= 2026; yr += 2) {
      const c = changes.get(yr);
      if (!c) {
        if (yr === 2026 && !counted) continue;
        el('circle', { cx: x(yr), cy: base, r: yr % 4 === 2 ? 2.6 : 1.8, fill: yr % 4 === 2 ? 'var(--ink-2)' : '#a9a397' }, svg);
        continue;
      }
      el('circle', { cx: x(yr), cy: base, r: 6.5, style: `fill:${color(c.to)};stroke:var(--paper);stroke-width:2` }, svg);
      const above = c.kind === 'midterm';
      el('text', { x: x(yr), y: above ? base - 14 : base + 24, 'text-anchor': 'middle', class: 'ghost-label' }, svg).textContent = yr2(yr);
    }
    if (!counted) {
      el('circle', { cx: x(2026), cy: base, r: 6.5, class: 'ghost-bar' }, svg);
      el('text', { x: x(2026), y: base - 14, 'text-anchor': 'middle', class: 'ghost-label', style: 'font-weight:400;fill:var(--ink-2)' }, svg).textContent = '’26?';
    }
  }

  // ---------- record 5. the members ----------
  function drawFresh(chart) {
    const W = chart.clientWidth;
    const years = Object.keys(S.freshmen).map(Number).sort((a, b) => a - b);
    const row = 32, m = { t: 6, r: 50, b: 24, l: 48 };
    const H = m.t + m.b + row * years.length;
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const x = scale([0, 70], [m.l, W - m.r]);
    const ax = el('g', { class: 'axis' }, svg);
    for (const t of range(0, 60, 20)) {
      el('line', { x1: x(t), x2: x(t), y1: m.t, y2: H - m.b }, ax);
      el('text', { x: x(t), y: H - 6, 'text-anchor': 'middle' }, ax).textContent = `${t}%`;
    }
    const marks = el('g', {}, svg);
    years.forEach((yr, i) => {
      const f = S.freshmen[yr], cy = m.t + i * row + row / 2;
      const rf = f.fresh[0] / f.fresh[1] * 100, rv = f.vets[0] / f.vets[1] * 100;
      el('text', { x: m.l - 10, y: cy + 4, 'text-anchor': 'end', class: 'ghost-label' }, svg).textContent = yr;
      const a = el('rect', { x: x(0), y: cy - 9, width: Math.max(1.5, x(rf) - x(0)), height: 8, rx: 1.5, class: 'mark', style: 'fill:var(--ink)' }, marks);
      el('rect', { x: x(0), y: cy + 1, width: Math.max(1.5, x(rv) - x(0)), height: 8, rx: 1.5, style: 'fill:#a9a397' }, marks);
      label(svg, x(rf) + 6, cy - 1.5, `${Math.round(rf)}%`, 'start', true);
      const hit = el('rect', { x: 0, y: cy - row / 2, width: W, height: row, fill: 'transparent', class: 'hit' }, svg);
      const p = S.president[yr] === 'D' ? 'Democrats' : 'Republicans';
      hover(hit, chart, svg, `fr${yr}`, () => tip(String(yr), `${p}, the president’s party`, [
        ['First-term', `${f.fresh[0]} of ${f.fresh[1]} lost`], ['Others', `${f.vets[0]} of ${f.vets[1]} lost`],
      ]), () => [x(rf), cy - 8], a);
    });
  }

  // ---------- record 2. the margin, once it is in ----------
  if (counted) {
    document.getElementById('cush-seats').textContent = signed(now.change);
    document.getElementById('cush-house').textContent = kept(now26) ? 'kept' : 'lost';
  }

  watch(document.getElementById('c-moves'), drawMoves);
  watch(document.getElementById('c-share'), drawShare);
  watch(document.getElementById('c-rule'), drawRule);
  watch(document.getElementById('c-contest'), drawContest);
  watch(document.getElementById('c-control'), drawControl);
  watch(document.getElementById('c-fresh'), drawFresh);
})();
