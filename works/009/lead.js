// No. 009, the opening: six signals the record gave about 2026 before the vote, filled in with the result once it is in.
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

  // ---------- 1. approval and the majority ----------
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
    el('text', { x: W - m.r, y: H - 4, 'text-anchor': 'end', class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = 'House seats to spare over a majority';
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
        ['Approval', `${d.approval.v}%`], ['To spare', `${spare(d)} seats`], ['House', `${signed(d.change)}, ${lost ? 'lost it' : 'kept it'}`],
      ]), () => [cx, cy], dot);
    }
    if (!counted) {
      const cx = x(spare(now)), cy = y(now.approval.v);
      el('circle', { cx, cy, r: 7, class: 'ghost-bar' }, svg);
      label(svg, cx + 11, cy + 4, '2026', 'start', true);
    }
  }

  // ---------- the Senate map ----------
  // The 35 seats up, lined up from Harris's best state to Trump's: columns on a wide screen, rows on a phone.
  function drawSenmap(chart) {
    const W = chart.clientWidth, seats = S.senate2026, calls = now.senateCalls || {};
    const anyCall = Object.keys(calls).length > 0;
    const wide = W >= 560;
    chart.textContent = '';
    const fmt = (v) => (v > 0 ? `Trump +${v.toFixed(0)}` : v < 0 ? `Harris +${(-v).toFixed(0)}` : 'even');
    const tipFor = (d) => () => tip(S.names[d.s], d.special ? 'Special election' : 'Regular election', [
      ['Held by', d.h === 'D' ? 'a Democrat' : 'a Republican'], ['2024', fmt(d.m)],
      ['2026', calls[d.s] ? `${calls[d.s] === 'D' ? 'Democrat' : 'Republican'} won${calls[d.s] !== d.h ? ', a change' : ''}` : 'counting'],
    ]);
    const style = (d) => {
      const won = calls[d.s], flip = won && won !== d.h;
      return `fill:${color(won || d.h)};opacity:${anyCall && !won ? .35 : 1}${flip ? ';stroke:var(--ink);stroke-width:2' : ''}`;
    };
    const marks = [];
    let svg;
    if (wide) {
      const H = 300, m = { t: 26, b: 26, l: 66, r: 6 };
      svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
      const y = scale([50, -30], [m.t, H - m.b]);
      const col = (W - m.l - m.r) / seats.length;
      axisY(svg, y, [-20, 0, 20, 40], m.l, W - m.r, (t) => (t > 0 ? `Trump +${t}` : t < 0 ? `Harris +${-t}` : '0'));
      seats.forEach((d, i) => {
        const x0 = m.l + i * col + col * .14, w = col * .72, y0 = y(0), y1 = y(d.m);
        const b = el('rect', { x: x0, y: Math.min(y0, y1), width: w, height: Math.max(1.5, Math.abs(y1 - y0)), rx: 1.5, class: 'mark', style: style(d) }, svg);
        el('text', { x: x0 + w / 2, y: d.m >= 0 ? y1 - 5 : y1 + 12, 'text-anchor': 'middle', class: 'ghost-label', style: `font-size:${col < 18 ? 9 : 10}px` }, svg).textContent = d.s;
        const hit = el('rect', { x: m.l + i * col, y: m.t, width: col, height: H - m.t - m.b, fill: 'transparent', class: 'hit' }, svg);
        hover(hit, chart, svg, `sm${d.s}`, tipFor(d), () => [x0 + w / 2, Math.min(y0, y1)], b);
      });
    } else {
      const row = 17, m = { t: 22, b: 8, l: 30, r: 54 };
      const H = m.t + m.b + row * seats.length;
      svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
      const x = scale([-30, 50], [m.l, W - m.r]);
      el('line', { x1: x(0), x2: x(0), y1: m.t - 6, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1 }, svg);
      el('text', { x: x(0) - 6, y: 12, 'text-anchor': 'end', class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = '← Harris';
      el('text', { x: x(0) + 6, y: 12, class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = 'Trump →';
      seats.forEach((d, i) => {
        const cy = m.t + i * row + row / 2, x0 = x(0), x1 = x(d.m);
        el('text', { x: 0, y: cy + 4, class: 'ghost-label', style: 'font-size:10.5px' }, svg).textContent = d.s;
        const b = el('rect', { x: Math.min(x0, x1), y: cy - 5.5, width: Math.max(1.5, Math.abs(x1 - x0)), height: 11, rx: 1.5, class: 'mark', style: style(d) }, svg);
        el('text', { x: d.m >= 0 ? x1 + 5 : x1 - 5, y: cy + 4, 'text-anchor': d.m >= 0 ? 'start' : 'end', class: 'axis', style: 'font:400 10px var(--mono);fill:var(--mute)' }, svg).textContent = Math.abs(d.m).toFixed(0);
        const hit = el('rect', { x: 0, y: cy - row / 2, width: W, height: row, fill: 'transparent', class: 'hit' }, svg);
        hover(hit, chart, svg, `sm${d.s}`, tipFor(d), () => [Math.max(x0, x1), cy - 6], b);
      });
    }
    if (anyCall && !document.getElementById('senmap-flip')) {
      document.getElementById('senmap-key').insertAdjacentHTML('beforeend',
        '<span id="senmap-flip"><i class="key-sw" style="background:var(--paper);box-shadow:inset 0 0 0 2px var(--ink)"></i>changed hands</span><span><i class="key-sw" style="background:var(--paper-2)"></i>pale: still counting</span>');
    }
  }

  // ---------- the night: each Senate race against the president's last margin ----------
  // One row per midterm, one dot per race with both parties on the ballot; past zero, the president's party ran behind.
  function swings26() {
    const shares = now.senateShares || {};
    return S.senate2026.filter((d) => shares[d.s]).map((d) => {
      const [dem, rep] = shares[d.s];
      return Math.round((d.m - (rep - dem) / (dem + rep) * 100) * 10) / 10;
    }).sort((a, b) => a - b);
  }
  function drawSwing(chart) {
    const W = chart.clientWidth, narrow = W < 520;
    const rows = Object.entries(S.senateSwing).map(([yr, v]) => ({ y: +yr, v, p: S.president[yr] }));
    const v26 = swings26();
    if (v26.length) rows.push({ y: 2026, v: v26, p: 'R' });
    const row = 28, m = { t: 38, r: narrow ? 46 : 70, b: 30, l: 40 };
    const H = m.t + m.b + row * rows.length;
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const lo = -30, hi = 50, x = scale([lo, hi], [m.l, W - m.r]);
    const ax = el('g', { class: 'axis' }, svg);
    for (const t of range(-20, 40, 20)) {
      el('line', { x1: x(t), x2: x(t), y1: m.t - 6, y2: H - m.b + 4, ...(t === 0 ? { style: 'stroke:var(--ink);stroke-width:1' } : {}) }, ax);
      el('text', { x: x(t), y: H - m.b + 18, 'text-anchor': 'middle' }, ax).textContent = t === 0 ? '0' : signed(t);
    }
    el('text', { x: x(0) - 6, y: 20, 'text-anchor': 'end', class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = '← ran ahead';
    el('text', { x: x(0) + 6, y: 20, class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = 'ran behind →';
    const marks = el('g', {}, svg);
    rows.forEach((d, i) => {
      const cy = m.t + i * row + row / 2, now = d.y === 2026;
      const behind = d.v.filter((s) => s > 0).length, med = d.v[Math.floor(d.v.length / 2)];
      el('text', { x: 0, y: cy + 4, class: 'ghost-label', style: now ? null : 'font-weight:400;fill:var(--ink-2)' }, svg).textContent = d.y;
      const g = el('g', {}, marks);
      d.v.forEach((s, j) => {
        const cx = x(Math.max(lo, Math.min(hi, s)));
        el('circle', { cx, cy: cy + ((j % 3) - 1) * 4, r: 2.6, style: `fill:${now ? color('R') : '#a9a397'};opacity:${now ? 1 : .8}` }, g);
      });
      el('line', { x1: x(med), x2: x(med), y1: cy - 9, y2: cy + 9, style: `stroke:var(--ink);stroke-width:${now ? 2.5 : 2}` }, g);
      label(svg, W, cy + 4, narrow ? `${behind}/${d.v.length}` : `${behind} of ${d.v.length}`, 'end', now);
      const hit = el('rect', { x: 0, y: cy - row / 2, width: W, height: row, fill: 'transparent', class: 'hit' }, svg);
      hover(hit, chart, svg, `sw${d.y}`, () => tip(String(d.y), `${d.p === 'D' ? 'Democrats' : 'Republicans'}, the president’s party`, [
        ['Ran behind', `${behind} of ${d.v.length} races`], ['Median race', `${signed(med, 1)} pts`],
      ]), () => [x(med), cy - 10], g);
    });
  }

  // ---------- 3. the ballot ----------
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

  // ---------- 4. Cleveland ----------
  function drawCleveland(chart) {
    const W = chart.clientWidth;
    const rows = [1886, 1894, 2018].map((yr) => scored.find((d) => d.y === yr)).concat([now26 || { ...now, y: 2026 }]);
    const row = 46, m = { t: 4, r: 64, b: 4, l: 0 };
    const H = m.t + m.b + row * rows.length;
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const x = scale([0, 130], [m.l, W - m.r]);
    const marks = el('g', {}, svg);
    rows.forEach((d, i) => {
      const cy = m.t + i * row + row / 2, loss = d.change != null ? -d.change : null;
      const who = d.y === 2026 || d.y === 2018 ? 'Trump' : 'Cleveland';
      // the name on its own line, the bar under it
      el('text', { x: 0, y: cy - 8, class: 'ghost-label' }, svg).textContent = d.y;
      label(svg, 40, cy - 8, `${who}, ${d.y === 1886 || d.y === 2018 ? 'first term' : 'second term'}`);
      const by = cy + 2;
      if (loss == null) {
        el('rect', { x: x(0), y: by - 6, width: x(22) - x(0), height: 12, rx: 2, class: 'ghost-bar' }, svg);
        label(svg, x(22) + 8, by + 4, 'counting');
        return;
      }
      const w = Math.max(2, x(Math.max(0, loss)) - x(0));
      const b = el('rect', { x: x(0), y: by - 6, width: w, height: 12, rx: 2, class: 'mark', style: `fill:${color(d.party)}` }, marks);
      label(svg, x(0) + w + 8, by + 4, loss >= 0 ? `−${loss}` : `+${-loss}`, 'start', true);
      const hit = el('rect', { x: 0, y: cy - row / 2, width: W, height: row, fill: 'transparent', class: 'hit' }, svg);
      hover(hit, chart, svg, `cl${d.y}`, () => tip(String(d.y), `${d.president} · ${d.partyName}`, [['House', `${d.seats0} → ${d.seats1} of ${d.size1}`]]), () => [x(0) + w, cy - 6], b);
    });
  }

  // ---------- 5. the calendar ----------
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

  // ---------- 6. the members ----------
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

  // ---------- 2. the margin, once it is in ----------
  if (counted) {
    document.getElementById('cush-seats').textContent = signed(now.change);
    document.getElementById('cush-house').textContent = kept(now26) ? 'kept' : 'lost';
  }

  watch(document.getElementById('c-swing'), drawSwing);
  watch(document.getElementById('c-rule'), drawRule);
  watch(document.getElementById('c-senmap'), drawSenmap);
  watch(document.getElementById('c-contest'), drawContest);
  watch(document.getElementById('c-cleveland'), drawCleveland);
  watch(document.getElementById('c-control'), drawControl);
  watch(document.getElementById('c-fresh'), drawFresh);
})();
