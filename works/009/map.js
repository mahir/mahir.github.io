// No. 009, part two: the states, drawn from states.js on a grid of tiles, one per state.
(() => {
  'use strict';
  const S = window.STATES, M = window.MIDTERMS, T = window.TIDE;
  if (!S || !T) return;
  const { el, scale, signed, showTip, hover, axisX, axisY, note, range, watch } = T;
  const now = M.y2026;

  // A tile grid of the states, roughly where they sit on the map.
  const GRID = {
    AK: [0, 0], ME: [11, 0], WI: [6, 1], VT: [10, 1], NH: [11, 1],
    WA: [1, 2], ID: [2, 2], MT: [3, 2], ND: [4, 2], MN: [5, 2], IL: [6, 2], MI: [7, 2], NY: [9, 2], MA: [10, 2],
    OR: [1, 3], NV: [2, 3], WY: [3, 3], SD: [4, 3], IA: [5, 3], IN: [6, 3], OH: [7, 3], PA: [8, 3], NJ: [9, 3], CT: [10, 3], RI: [11, 3],
    CA: [1, 4], UT: [2, 4], CO: [3, 4], NE: [4, 4], MO: [5, 4], KY: [6, 4], WV: [7, 4], VA: [8, 4], MD: [9, 4], DE: [10, 4],
    AZ: [2, 5], NM: [3, 5], KS: [4, 5], AR: [5, 5], TN: [6, 5], NC: [7, 5], SC: [8, 5],
    OK: [4, 6], LA: [5, 6], MS: [6, 6], AL: [7, 6], GA: [8, 6],
    HI: [0, 7], TX: [4, 7], FL: [9, 7],
  };
  const mix = (c, pct) => `color-mix(in oklab, ${c} ${pct}%, var(--paper))`;
  const partyVar = (p) => (p === 'D' ? 'var(--D)' : 'var(--R)');
  const partyName = (p) => (p === 'D' ? 'Democrats' : 'Republicans');

  // Draws the tile grid; cell(state) returns { fill, stroke, dash, hatch, dark, value, tip }.
  function tiles(chart, cell, key) {
    const W = chart.clientWidth;
    const size = Math.min(58, Math.floor((W - 2) / 12)), gap = Math.max(2, Math.round(size * .06));
    const H = size * 8;
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${size * 12} ${H}`, width: size * 12, height: H }, chart);
    svg.style.width = `${size * 12}px`;  // tiles keep their size; the grid doesn't stretch
    const defs = el('defs', {}, svg);
    const pat = el('pattern', { id: `hatch-${chart.id}`, width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 5, stroke: 'var(--ink-2)', 'stroke-width': 1.2, opacity: .55 }, pat);
    const small = size < 34;
    for (const [s, [cx, cy]] of Object.entries(GRID)) {
      const c = cell(s);
      const x = cx * size + gap / 2, y = cy * size + gap / 2, w = size - gap;
      const g = el('g', { class: 'tile' }, svg);
      const r = el('rect', {
        x, y, width: w, height: w, rx: 3, class: 'mark',
        style: `fill:${c.fill};stroke:${c.stroke || 'none'};stroke-width:${c.stroke ? 1.5 : 0}${c.dash ? ';stroke-dasharray:3 2' : ''}`,
      }, g);
      if (c.hatch) el('rect', { x, y, width: w, height: w, rx: 3, fill: `url(#hatch-${chart.id})`, 'pointer-events': 'none' }, g);
      const ink = c.dark ? 'var(--paper)' : 'var(--ink)';
      el('text', { x: x + w / 2, y: y + (c.value != null && !small ? w * .42 : w * .58), 'text-anchor': 'middle', class: 'st', style: `fill:${ink}` }, g).textContent = s;
      if (c.value != null && !small) el('text', { x: x + w / 2, y: y + w * .78, 'text-anchor': 'middle', class: 'v', style: `fill:${ink}` }, g).textContent = c.value;
      const hit = el('rect', { x: cx * size, y: cy * size, width: size, height: size, fill: 'transparent', class: 'hit' }, svg);
      hover(hit, chart, svg, `${key}${s}`, () => c.tip, () => [x + w / 2, y], r);
    }
  }
  const legend = (id, items) => {
    document.getElementById(id).innerHTML = items.map(([sw, label]) => `<span><i class="key-sw" style="${sw}"></i>${label}</span>`).join('');
  };
  const tipHtml = (title, sub, rows) => `<b>${title}</b>${sub ? `<div class="who">${sub}</div>` : ''}<dl>${rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`;

  // ---------- 7. where each wave broke ----------
  const counted26 = Object.keys(now.byState || {}).length > 0;
  const waveYears = Object.keys(S.president).map(Number).filter((y) => y < 2026 || counted26);
  let waveYear = counted26 ? 2026 : 2018;

  function seatsIn(y) {
    if (y === 2026) return Object.fromEntries(Object.entries(now.byState).map(([s, [d, r]]) => [s, [d, r, 0]]));
    return S.seats[String(y)];
  }
  function waveCell(y) {
    const p = S.president[y], i = 'DRO'.indexOf(p);
    const before = S.seats[String(y - 2)], after = seatsIn(y);
    return (s) => {
      const b = before[s] || [0, 0, 0], a = after[s];
      const name = S.names[s];
      if (!a) return { fill: 'var(--paper-2)', hatch: true, tip: tipHtml(name, 'Counting', [['Before', `${b[0]} D · ${b[1]} R`]]) };
      const ch = a[i] - b[i];
      const tip = tipHtml(name, `${y} · ${partyName(p)} held the White House`, [
        ['Before', `${b[0]} D · ${b[1]} R${b[2] ? ` · ${b[2]} other` : ''}`],
        ['After', `${a[0]} D · ${a[1]} R${a[2] ? ` · ${a[2]} other` : ''}`],
        ['Change', ch ? `${signed(ch)} for the ${partyName(p)}` : 'no change'],
      ]);
      if (ch > 0) return { fill: 'var(--paper)', stroke: partyVar(p), dash: true, value: signed(ch), tip };
      if (ch === 0) return { fill: 'var(--paper-2)', value: null, tip };
      const pct = ch === -1 ? 30 : ch === -2 ? 48 : ch >= -4 ? 68 : 92;
      return { fill: mix(partyVar(p), pct), dark: pct >= 68, value: signed(ch), tip };
    };
  }
  function waveSummary(y) {
    const p = S.president[y], i = 'DRO'.indexOf(p);
    const before = S.seats[String(y - 2)], after = seatsIn(y);
    const ch = Object.keys(S.names).filter((s) => after[s]).map((s) => [s, after[s][i] - (before[s] || [0, 0, 0])[i]]);
    const total = ch.reduce((a, [, v]) => a + v, 0);
    const lost = ch.filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]);
    const gained = ch.filter(([, v]) => v > 0);
    const most = lost.filter(([, v]) => v === lost[0]?.[1]).map(([s]) => S.names[s]);
    const list = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0]);
    const pending = y === 2026 && ch.length < 50 ? ` With ${50 - ch.length} states still counting.` : '';
    if (!lost.length) return `In ${y} the ${partyName(p)} lost no seats in any state, and gained ${total} in all.${pending}`;
    return `In ${y} the ${partyName(p)} ${total < 0 ? `lost ${-total} seats` : `gained ${total} seats`} ${pending ? 'so far' : 'across the country'}: down in ${lost.length} ${lost.length === 1 ? 'state' : 'states'}, up in ${gained.length || 'none'}. ` +
      `The most went in ${list(most)}, ${-lost[0][1]}${most.length > 1 ? ' each' : ''}.` + pending;
  }
  function drawWave(chart) {
    tiles(chart, waveCell(waveYear), `w${waveYear}`);
    document.getElementById('wave-sum').textContent = waveSummary(waveYear);
    const p = partyVar(S.president[waveYear]);
    legend('wave-key', [
      [`background:${mix(p, 30)}`, 'lost 1'], [`background:${mix(p, 48)}`, '2'], [`background:${mix(p, 68)}`, '3–4'], [`background:${mix(p, 92)}`, '5 or more'],
      [`background:var(--paper);box-shadow:inset 0 0 0 1.5px ${p}`, 'gained'], ['background:var(--paper-2)', 'no change'],
    ].concat(waveYear === 2026 ? [['background:repeating-linear-gradient(45deg, var(--paper-2) 0 3px, #a9a397 3px 4px)', 'counting']] : []));
    document.getElementById('wave-cap').textContent = 'Seats the president’s party held after the midterm, less those it held after the election before. ' +
      (S.newMaps.includes(waveYear) ? `${waveYear} came after a census: new maps and seats moving between states account for some of this change.` :
        waveYear === 2026 ? `Nine states voted on new lines in 2026: ${S.newLines2026.map((s) => S.names[s]).join(', ')}.` : 'The maps were the same both times.');
  }
  const yearsEl = document.getElementById('wave-years');
  yearsEl.innerHTML = waveYears.map((y) => `<button type="button" data-y="${y}" aria-pressed="${y === waveYear}"><i class="p" style="--c:${partyVar(S.president[y])}"></i>${y}</button>`).join('');
  yearsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    waveYear = +b.dataset.y;
    yearsEl.querySelectorAll('button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    T.hideTip();
    drawWave(document.getElementById('c-wave'));
  });

  // ---------- 8. one tide ----------
  function drawNational(chart) {
    const W = chart.clientWidth;
    const years = Object.keys(S.swing).map(Number).sort((a, b) => a - b);
    const row = 30, m = { t: 22, r: 70, b: 26, l: 48 };
    const H = m.t + m.b + row * years.length;
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const x = scale([0, 100], [m.l, W - m.r]);
    const ax = el('g', { class: 'axis' }, svg);
    for (const t of [0, 25, 50, 75, 100]) {
      el('line', { x1: x(t), x2: x(t), y1: m.t - 6, y2: H - m.b, class: t === 50 ? 'zero' : null }, ax);
      el('text', { x: x(t), y: H - 8, 'text-anchor': 'middle' }, ax).textContent = `${t}%`;
    }
    el('text', { x: x(50) + 6, y: m.t - 10, class: 'rule-label', style: 'font-weight:400;fill:var(--ink-2)' }, svg).textContent = 'half';
    const marks = el('g', {}, svg);
    years.forEach((y, i) => {
      const d = S.swing[y], v = d.against / d.n * 100, p = S.president[y];
      const cy = m.t + i * row + row / 2;
      el('text', { x: m.l - 10, y: cy + 4, 'text-anchor': 'end', class: 'ghost-label' }, svg).textContent = y;
      const r = el('path', { d: `M${x(0)},${cy - 7}H${x(v) - 3}Q${x(v)},${cy - 7} ${x(v)},${cy - 4}V${cy + 4}Q${x(v)},${cy + 7} ${x(v) - 3},${cy + 7}H${x(0)}Z`, class: 'mark', style: `fill:${partyVar(p)}` }, marks);
      el('text', { x: x(v) + 8, y: cy + 4, class: 'ghost-label', style: 'font-weight:400;fill:var(--ink-2)' }, svg).textContent = `${Math.round(v)}%`;
      const hit = el('rect', { x: 0, y: cy - row / 2, width: W, height: row, fill: 'transparent', class: 'hit' }, svg);
      hover(hit, chart, svg, `n${y}`, () => tipHtml(String(y), `${partyName(p)} held the White House`, [
        ['Against', `${d.against} of ${d.n} districts`], ['Median swing', `${signed(d.median, 1)} pts`],
      ]), () => [x(v), cy - 8], r);
    });
  }

  // ---------- 9. the South ----------
  function drawSouth(chart) {
    const W = chart.clientWidth, H = Math.round(Math.max(240, Math.min(340, W * .5)));
    const m = { t: 20, r: 40, b: 28, l: 40 };
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const pts = S.southSeats.map(([y, d, t]) => ({ y, v: d / t * 100, d, t }));
    const x = scale([1975, 2025], [m.l, W - m.r]);
    const y = scale([80, 20], [m.t, H - m.b]);
    axisY(svg, y, range(20, 80, 20), m.l, W - m.r, (t) => `${t}%`);
    axisX(svg, x, W < 520 ? [1980, 2000, 2020] : range(1980, 2020, 10), H - 8, String);
    el('line', { x1: m.l, x2: W - m.r, y1: y(50), y2: y(50), stroke: 'var(--ink)', 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: .4 }, svg);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], big = b.y === 1994 || b.y === 2010;
      el('path', { d: `M${x(a.y)},${y(a.v)}L${x(b.y)},${y(b.v)}`, stroke: big ? 'var(--D)' : 'var(--ink)', 'stroke-width': big ? 3.5 : 2, 'stroke-linecap': 'round', fill: 'none' }, svg);
    }
    const marks = el('g', {}, svg);
    for (const p of pts) {
      const c = el('circle', { cx: x(p.y), cy: y(p.v), r: p.y % 4 === 2 ? 3.5 : 2.5, class: 'mark', style: `fill:${p.y % 4 === 2 ? 'var(--paper)' : 'var(--ink)'};stroke:var(--ink);stroke-width:1.5` }, marks);
      const hit = el('circle', { cx: x(p.y), cy: y(p.v), r: 10, fill: 'transparent', class: 'hit' }, svg);
      hover(hit, chart, svg, `s${p.y}`, () => tipHtml(String(p.y), p.y % 4 === 2 ? 'Midterm' : 'Presidential year', [['Democrats', `${p.d} of ${p.t} seats`], ['Share', `${p.v.toFixed(1)}%`]]), () => [x(p.y), y(p.v)], c);
    }
    const at = (yr) => pts.find((p) => p.y === yr);
    note(svg, x(1994) + 8, y(at(1994).v) - 22, ['1994', '−12.8 pts']);
    note(svg, x(2010) + 8, y(at(2010).v) - 26, ['2010', '−16.8 pts']);
    note(svg, x(1976), y(at(1976).v) - 10, ['75%'], 'start');
    note(svg, x(2024), y(at(2024).v) + 20, ['30%'], 'middle');
    el('text', { x: W - m.r, y: y(50) - 6, 'text-anchor': 'end', class: 'rule-label', style: 'font-weight:400;fill:var(--ink-2)' }, svg).textContent = 'half the seats';
  }

  // ---------- 10. who stays home ----------
  const t26 = S.turnout2026 || {}, t24 = S.turnout['2024'] || {};
  const has26 = Object.keys(t26).length > 0;
  let homeK = 'avg';
  const BANDS = [[65, 18, 'under 65%'], [70, 36, '65–70'], [75, 56, '70–75'], [80, 76, '75–80'], [Infinity, 96, '80% or more']];
  const band = (v) => BANDS.find(([hi]) => v < hi);
  function drawHome(chart) {
    const odd = new Set(S.governorOdd), pres = new Set(S.governorPresidential);
    tiles(chart, (s) => {
      const v = homeK === 'avg' ? S.kept[s] : t26[s] && t24[s] ? t26[s] / t24[s] * 100 : null;
      const gov = odd.has(s) ? 'in odd years' : pres.has(s) ? 'in presidential years' : s === 'NH' || s === 'VT' ? 'every two years' : 'in the midterm';
      if (v == null) return { fill: 'var(--paper-2)', hatch: true, tip: tipHtml(S.names[s], 'Counting', []) };
      const [, pct] = band(v);
      return {
        fill: mix('var(--E)', pct), dark: pct >= 56, value: `${Math.round(v)}`,
        stroke: odd.has(s) ? 'var(--ink)' : null,
        tip: tipHtml(S.names[s], `Governor elected ${gov}`, homeK === 'avg'
          ? [['Kept', `${v.toFixed(1)}% of presidential-year turnout`], ['2022', `${(S.turnout['2022'][s] || 0).toFixed(1)}%`], ['2020', `${(S.turnout['2020'][s] || 0).toFixed(1)}%`]]
          : [['Kept', `${v.toFixed(1)}%`], ['2026', `${t26[s].toFixed(1)}%`], ['2024', `${t24[s].toFixed(1)}%`]]),
      };
    }, `h${homeK}`);
    document.getElementById('home-cap').textContent = homeK === 'avg'
      ? 'Turnout of eligible voters at each midterm, as a share of that state’s turnout two years before, averaged over 2002 to 2022.'
      : 'Turnout of eligible voters in 2026 as a share of the state’s 2024 turnout, from the UF Election Lab’s first estimates.';
    legend('home-key', BANDS.map(([, pct, label]) => [`background:${mix('var(--E)', pct)}`, label])
      .concat([['background:var(--paper);box-shadow:inset 0 0 0 1.5px var(--ink)', 'governor elected in odd years']]));
  }
  if (has26) {
    const seg = document.getElementById('home-seg');
    seg.hidden = false;
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      homeK = b.dataset.k;
      seg.querySelectorAll('button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      T.hideTip();
      drawHome(document.getElementById('c-home'));
    });
  }

  // ---------- 11. where 2026 is fought ----------
  let fightK = 0;
  function drawFight(chart) {
    const lines = new Set(S.newLines2026);
    tiles(chart, (s) => {
      const c = (S.close2024[s] || [0, 0])[fightK], seats = S.seats['2024'][s] || [0, 0, 0];
      const tip = tipHtml(S.names[s], lines.has(s) ? 'New lines for 2026' : 'Same lines as 2024', [
        ['2024', `${seats[0]} D · ${seats[1]} R`], [`R by < ${fightK ? 10 : 5} pts`, String(c)],
      ]);
      const fill = c ? mix('var(--R)', c === 1 ? 40 : c === 2 ? 66 : 92) : 'var(--paper-2)';
      return { fill, dark: c >= 2, value: c ? String(c) : null, hatch: lines.has(s), tip };
    }, `f${fightK}`);
    legend('fight-key', [
      [`background:${mix('var(--R)', 40)}`, '1 seat'], [`background:${mix('var(--R)', 66)}`, '2'], [`background:${mix('var(--R)', 92)}`, '3 or more'],
      ['background:repeating-linear-gradient(45deg, var(--paper-2) 0 3px, #a9a397 3px 4px)', 'new lines for 2026'],
    ]);
  }
  const fseg = document.getElementById('fight-seg');
  fseg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    fightK = +b.dataset.k;
    fseg.querySelectorAll('button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    T.hideTip();
    drawFight(document.getElementById('c-fight'));
  });

  // ---------- 12. one ballot ----------
  function drawSplit(chart) {
    const W = chart.clientWidth, H = Math.round(Math.max(320, Math.min(460, W * .66)));
    const m = { t: 30, r: 12, b: 28, l: 44 };
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const years = [...new Set(S.splits.map((r) => r.y))].sort((a, b) => a - b);
    const col = (W - m.l - m.r) / years.length;
    const cx0 = (i) => m.l + col * (i + .5);
    const y = scale([50, -50], [m.t, H - m.b]);
    axisY(svg, y, range(-40, 40, 20), m.l, W - m.r, (t) => (t === 0 ? '0' : `${t > 0 ? '+' : '−'}${Math.abs(t)}`));
    const r = col < 34 ? 2 : 2.6, pitch = r * 2 + .5, room = col * .46;
    const marks = el('g', {}, svg);
    years.forEach((yr, i) => {
      const rs = S.splits.filter((d) => d.y === yr).map((d) => ({ ...d, gap: d.sen - d.house })).sort((a, b) => a.gap - b.gap);
      const spread = rs.reduce((a, d) => a + Math.abs(d.gap), 0) / rs.length;
      el('rect', { x: cx0(i) - col * .42, y: y(spread), width: col * .84, height: y(-spread) - y(spread), rx: 3, class: 'band' }, svg);
      const split = rs.filter((d) => d.win !== d.houseWin).length;
      el('text', { x: cx0(i), y: H - 10, 'text-anchor': 'middle', class: 'ghost-label', style: `font-size:${col < 34 ? 9.5 : 11}px` }, svg).textContent = col < 34 ? `’${String(yr).slice(2)}` : yr;
      el('text', { x: cx0(i), y: m.t - 12, 'text-anchor': 'middle', class: 'ghost-label', style: 'font-weight:400;fill:var(--ink-2)' }, svg).textContent = split;
      // a small beeswarm: each dot takes the nearest free slot beside its column's centre line
      const placed = [];
      for (const d of rs) {
        const py = y(d.gap);
        let px = cx0(i);
        for (let k = 0; k < 40; k++) {
          const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * pitch;
          if (Math.abs(off) > room) break;
          if (!placed.some(([qx, qy]) => Math.hypot(qx - (cx0(i) + off), qy - py) < pitch)) { px = cx0(i) + off; break; }
        }
        placed.push([px, py]);
        const isSplit = d.win !== d.houseWin;
        const c = el('circle', { cx: px, cy: py, r, class: 'mark', style: `fill:${partyVar(d.win)};stroke:${isSplit ? 'var(--ink)' : 'var(--paper)'};stroke-width:${isSplit ? 1.8 : .8}` }, marks);
        const hit = el('circle', { cx: px, cy: py, r: Math.max(r + 2, 6), fill: 'transparent', class: 'hit' }, svg);
        const pp = S.president[yr] === 'D' ? 'Democrats' : 'Republicans';
        hover(hit, chart, svg, `sp${yr}${d.s}${d.special}`, () => tipHtml(`${S.names[d.s]}, ${yr}`, isSplit ? 'Senate and House went different ways' : 'Senate and House went the same way', [
          [`Senate, ${pp}`, `${d.sen.toFixed(1)}%`], [`House, ${pp}`, `${d.house.toFixed(1)}%`],
          ['Senate won by', d.win === 'D' ? 'Democrat' : 'Republican'], ['House vote won by', d.houseWin === 'D' ? 'Democrats' : 'Republicans'],
        ]), () => [px, py], c);
      }
    });
    el('text', { x: m.l - 6, y: m.t - 12, 'text-anchor': 'end', class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = 'split';
  }

  watch(document.getElementById('c-wave'), drawWave);
  watch(document.getElementById('c-split'), drawSplit);
  watch(document.getElementById('c-national'), drawNational);
  watch(document.getElementById('c-south'), drawSouth);
  watch(document.getElementById('c-home'), drawHome);
  watch(document.getElementById('c-fight'), drawFight);
})();
