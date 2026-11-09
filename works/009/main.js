// No. 009, The midterm tide: every midterm since 1790 drawn from midterms.js, with 2026 filled in once it is counted.
(() => {
  'use strict';
  document.documentElement.classList.remove('no-js');

  const D = window.MIDTERMS;
  const all = D.midterms;
  const scored = all.filter((m) => m.change != null);
  const now = D.y2026;
  const counted = now.house != null;
  const est = now.estimate ? ' est.' : '';  // the House figure is an estimate until the count is final
  const NS = 'http://www.w3.org/2000/svg';

  // ---------- small tools ----------
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const scale = ([d0, d1], [r0, r1]) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  const color = (p) => (p === 'D' ? 'var(--D)' : p === 'R' ? 'var(--R)' : 'var(--E)');
  const signed = (v, digits = 0) => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(digits);
  const pct = (v) => (v == null ? '—' : `${v.toFixed(1)}%`);
  const median = (xs) => { const s = [...xs].sort((a, b) => a - b), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };

  // A bar from the baseline to v, its far end rounded.
  function bar(x, w, y0, y1, r = 2) {
    const h = Math.abs(y1 - y0);
    r = Math.min(r, w / 2, h);
    if (y1 < y0) return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`;
    return `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
  }

  // ---------- tooltip ----------
  const tip = document.getElementById('tip');
  let tipFor = null;
  function showTip(html, chart, px, py, key) {
    tip.innerHTML = html;
    const host = chart.getBoundingClientRect();
    tip.style.left = '0px'; tip.style.top = '0px';
    tip.classList.add('on');
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = host.left + window.scrollX + px + 14;
    if (x + w > window.scrollX + document.documentElement.clientWidth - 8) x = host.left + window.scrollX + px - w - 14;
    x = Math.max(window.scrollX + 8, x);
    let y = host.top + window.scrollY + py - h - 12;
    if (y < window.scrollY + 60) y = host.top + window.scrollY + py + 16;
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
    tipFor = key;
  }
  function hideTip() { tip.classList.remove('on'); tipFor = null; document.querySelectorAll('.chart svg.dim').forEach((s) => s.classList.remove('dim')); }
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.mark, .hit')) hideTip(); });
  window.addEventListener('scroll', () => { if (tipFor && matchMedia('(hover: hover)').matches) hideTip(); }, { passive: true });

  function midtermTip(m) {
    if (m.y === 2026 && !counted) {
      return `<b>2026</b><div class="who">Donald J. Trump · Republican</div><dl>
        <dt>House</dt><dd>${now.seats0} of 435, counting</dd><dt>Approval</dt><dd>${now.approval ? now.approval.v + '%' : '—'}</dd></dl>`;
    }
    const rows = [];
    if (m.change != null) {
      rows.push(['House', `${m.seats0} → ${m.seats1} of ${m.size1}`], ['Change', `${signed(m.change)} seats`], ['Share', `${m.share0.toFixed(1)}% → ${m.share1.toFixed(1)}%`]);
    } else rows.push(['House', 'no party to score']);
    if (m.senate && m.senate.change != null) rows.push(['Senate', `${signed(m.senate.change)} seats`]);
    if (m.y === 2026 && now.estimate) rows.push(['House figure', 'NBC News estimate']);
    if (m.approval) rows.push(['Approval', `${m.approval.v}%, ${m.approval.when}`]);
    const t = m.y === 2026 ? now.turnout && now.turnout.v : m.turnout;
    if (t != null) rows.push(['Turnout', pct(t)]);
    return `<b>${m.y}</b><div class="who">${m.president} · ${m.partyName}</div><dl>${rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`;
  }

  // Hover on a mouse, tap on a touch screen; the hit can be larger than the mark.
  function hover(hit, chart, svg, key, html, at, mark) {
    const on = (e) => {
      const r = chart.getBoundingClientRect();
      const [px, py] = at ? at() : [e.clientX - r.left, e.clientY - r.top];
      svg.classList.add('dim');
      svg.querySelectorAll('.mark.on').forEach((n) => n.classList.remove('on'));
      if (mark) mark.classList.add('on');
      showTip(html(), chart, px, py, key);
    };
    hit.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') on(e); });
    hit.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && tipFor === key) on(e); });
    hit.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hideTip(); });
    hit.addEventListener('click', (e) => { if (tipFor === key && e.pointerType !== 'mouse') hideTip(); else on(e); });
  }

  function axisY(svg, y, ticks, x0, x1, fmt) {
    const g = el('g', { class: 'axis' }, svg);
    for (const t of ticks) {
      el('line', { x1: x0, x2: x1, y1: y(t), y2: y(t), class: t === 0 ? 'zero' : null }, g);
      el('text', { x: x0 - 6, y: y(t) + 3.5, 'text-anchor': 'end' }, g).textContent = fmt(t);
    }
    return g;
  }
  function axisX(svg, x, ticks, y0, fmt, anchor = 'middle') {
    const g = el('g', { class: 'axis' }, svg);
    for (const t of ticks) el('text', { x: x(t), y: y0, 'text-anchor': anchor }, g).textContent = fmt(t);
    return g;
  }
  function note(svg, x, y, lines, anchor = 'start', lead) {
    const g = el('g', { class: 'note' }, svg);
    if (lead) el('line', { x1: lead[0], y1: lead[1], x2: lead[2], y2: lead[3] }, g);
    lines.forEach((s, i) => { el('text', { x, y: y + i * 14, 'text-anchor': anchor, class: i === 0 ? 'yr' : null }, g).textContent = s; });
    return g;
  }
  const range = (a, b, step) => { const out = []; for (let v = a; v <= b + 1e-9; v += step) out.push(+v.toFixed(6)); return out; };

  // ---------- 2026: every midterm ----------
  let measure = 'change';
  const since1946 = scored.filter((m) => m.y >= 1946);
  const typical = { change: median(since1946.map((m) => m.change)), shift: median(since1946.map((m) => m.shift)) };

  function drawAll(chart) {
    const W = chart.clientWidth, H = Math.round(Math.max(300, Math.min(480, W * .48)));
    const narrow = W < 640;
    const m = { t: 26, r: narrow ? 30 : 56, b: 28, l: 38 };
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const share = measure === 'shift';
    const vals = scored.map((d) => d[measure]).concat(counted ? [now[measure]] : []);
    const lo = Math.min(share ? -42 : -150, ...vals) - (share ? 0 : 0), hi = Math.max(share ? 12 : 40, ...vals);
    const x = scale([1786, 2030], [m.l, W - m.r]);
    const y = scale([hi, lo], [m.t, H - m.b]);
    const step = x(1790) - x(1786);
    const bw = Math.max(1.6, step * .58);

    const yt = share ? range(-30, 10, 10) : range(-125, 25, 25);
    axisY(svg, y, yt, m.l, W - m.r, (t) => (t === 0 ? '0' : share ? `${t > 0 ? '+' : '−'}${Math.abs(t)}` : signed(t)));
    axisX(svg, x, narrow ? [1800, 1850, 1900, 1950, 2000] : range(1800, 2025, 25), H - 8, String);

    const marks = el('g', {}, svg);
    for (const d of all) {
      const cx = x(d.y);
      if (d.change != null) {
        const p = el('path', { d: bar(cx - bw / 2, bw, y(0), y(d[measure])), class: 'mark', style: `fill:${color(d.party)}` }, marks);
        p.dataset.y = d.y;
      }
      const hit = el('rect', { x: cx - step / 2, y: m.t, width: step, height: H - m.t - m.b, fill: 'transparent', class: 'hit' }, svg);
      hover(hit, chart, svg, `all${d.y}`, () => midtermTip(d), () => [cx, y(d.change != null ? d[measure] : 0)], marks.querySelector(`[data-y="${d.y}"]`));
    }

    // 2026: a dashed slot as deep as a typical midterm since 1946 while it is counted, its bar once it is.
    const cx = x(2026);
    const slotW = Math.max(bw, 5);
    let p;
    if (counted) {
      p = el('path', { d: bar(cx - slotW / 2, slotW, y(0), y(now[measure])), class: 'mark', style: `fill:${color('R')};opacity:${est ? .55 : 1}` }, marks);
      note(svg, cx, y(now[measure]) + (now[measure] < 0 ? 16 : -18), [`2026${est}`, share ? `${signed(now.shift, 1)} pts` : signed(now.change)], 'middle');
    } else {
      p = el('rect', { x: cx - slotW / 2, y: y(0), width: slotW, height: y(typical[measure]) - y(0), rx: 1.5, class: 'ghost-bar mark' }, marks);
      el('text', { x: cx, y: y(typical[measure]) + 15, 'text-anchor': 'middle', class: 'ghost-label' }, svg).textContent = '2026';
      el('text', { x: cx, y: y(typical[measure]) + 28, 'text-anchor': 'middle', class: 'ghost-label', style: 'fill:var(--mute)' }, svg).textContent = '?';
    }
    const hit26 = el('rect', { x: cx - step / 2 - 4, y: m.t, width: step + 8, height: H - m.t - m.b, fill: 'transparent', class: 'hit' }, svg);
    hover(hit26, chart, svg, 'all2026', () => midtermTip({ ...now, y: 2026 }), () => [cx, y(counted ? now[measure] : typical[measure])], p);

    // a few years worth naming
    const at = (yr) => scored.find((d) => d.y === yr);
    const notes = share
      ? [[1894, ['1894', '−35 pts']], [1874, ['1874', '−33 pts']], [1902, ['1902', 'gained 7 seats,', 'lost 2.4 pts'], true], [1938, ['1938', '−17 pts']], [2010, ['2010', '−14 pts'], true]]
      : [[1894, narrow ? ['1894', '−125'] : ['1894', '−125, the most', 'ever lost']], [1874, ['1874', '−96']], [1922, ['1922', '−77'], true], [1938, ['1938', '−72'], true], [1994, ['1994', '−54'], true], [2010, ['2010', '−63']]];
    for (const [yr, lines, minor] of notes) {
      if (minor && narrow) continue;
      const d = at(yr), v = d[measure], px = x(yr), py = y(v);
      if (v >= 0 || (yr === 1902 && share)) {
        const ty = Math.min(py, y(0)) - 40;
        note(svg, px, ty - 14 * (lines.length - 1) + 0, lines, 'middle', [px, ty + 4, px, Math.min(py, y(0)) - 4]);
      } else note(svg, px, py + 15, lines, 'middle');
    }
  }

  document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
    measure = b.dataset.m;
    document.querySelectorAll('.seg button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    hideTip();
    drawAll(document.getElementById('c-all'));
  }));

  // ---------- record 3. the seats each party has up ----------
  function drawExposure(chart) {
    const W = chart.clientWidth, H = Math.round(Math.max(280, Math.min(400, W * .58)));
    const m = { t: 22, r: 16, b: 38, l: 40 };
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const pts = scored.filter((d) => d.senate && d.senate.change != null && d.senate.defend != null);
    const x = scale([4, 30], [m.l, W - m.r]);
    const y = scale([10, -15], [m.t, H - m.b]);
    el('rect', { x: x(19.5), y: m.t, width: x(30) - x(19.5), height: H - m.t - m.b, class: 'band' }, svg);
    axisY(svg, y, range(-15, 10, 5), m.l, W - m.r, (t) => (t === 0 ? '0' : signed(t)));
    axisX(svg, x, range(5, 30, 5), H - m.b + 18, String);
    el('text', { x: W - m.r, y: H - 4, 'text-anchor': 'end', class: 'axis', style: 'font:400 11px var(--mono);fill:var(--mute)' }, svg).textContent = 'Senate seats the president’s party defended';
    el('text', { x: x(30) - 6, y: m.t + 14, 'text-anchor': 'end', class: 'rule-label', style: 'font-weight:400;fill:var(--ink-2)' }, svg).textContent = '20 or more: lost seats 8 times in 9';
    const def = now.senate.defend;
    if (def != null) {
      el('line', { x1: x(def), x2: x(def), y1: m.t + 24, y2: H - m.b, class: 'rule-line' }, svg);
      el('text', { x: x(def) - 6, y: m.t + 34, 'text-anchor': 'end', class: 'rule-label' }, svg).textContent = `2026: ${def}`;
    }
    const named = new Set([1970, 1982, 2018, 1946, 1958, 2002]);
    const marks = el('g', {}, svg);
    const all26 = now.senate.change != null ? pts.concat([{ ...now, seats1: now.house, size1: 435 }]) : pts;
    for (const d of all26) {
      const cx = x(d.senate.defend), cy = y(d.senate.change);
      const c = el('circle', { cx, cy, r: 5.5, class: 'mark', style: `fill:${color(d.party)};stroke:${d.y === 2026 ? 'var(--ink)' : 'var(--paper)'};stroke-width:${d.y === 2026 ? 2 : 1.5}` }, marks);
      if (named.has(d.y) || d.y === 2026) el('text', { x: cx + 9, y: cy + 4, class: 'ghost-label', style: 'font-weight:400;fill:var(--ink-2)' }, svg).textContent = d.y;
      const hit = el('circle', { cx, cy, r: 12, fill: 'transparent', class: 'hit' }, svg);
      hover(hit, chart, svg, `ex${d.y}`, () => midtermTip(d).replace('</dl>', `<dt>Defended</dt><dd>${d.senate.defend} Senate seats</dd></dl>`), () => [cx, cy], c);
    }
  }

  // ---------- 2026: turnout ----------
  function drawTurnout(chart) {
    const W = chart.clientWidth, H = Math.round(Math.max(260, Math.min(380, W * .5)));
    const m = { t: 16, r: 46, b: 28, l: 36 };
    chart.textContent = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, chart);
    const x = scale([1786, 2030], [m.l, W - m.r]);
    const y = scale([85, 0], [m.t, H - m.b]);
    axisY(svg, y, range(0, 80, 20), m.l, W - m.r, (t) => `${t}%`);
    axisX(svg, x, W < 560 ? [1800, 1850, 1900, 1950, 2000] : range(1800, 2025, 25), H - 8, String);
    const series = { p: D.turnout.filter((t) => t.kind === 'p'), m: D.turnout.filter((t) => t.kind === 'm') };
    const line = (pts) => pts.map((t, i) => `${i ? 'L' : 'M'}${x(t.y).toFixed(1)},${y(t.v).toFixed(1)}`).join('');
    el('path', { d: line(series.p), fill: 'none', stroke: '#a9a397', 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    el('path', { d: line(series.m), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    const last = series.m[series.m.length - 1];
    const t26 = now.turnout && now.turnout.v;
    if (t26 != null) {
      // 2026 is an estimate until the count is certified: a dashed segment in the midterm line's ink, not a party color
      el('path', { d: `M${x(last.y)},${y(last.v)}L${x(2026)},${y(t26)}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '3 3' }, svg);
      el('circle', { cx: x(2026), cy: y(t26), r: 4.5, fill: 'var(--ink)', stroke: 'var(--paper)', 'stroke-width': 1.5 }, svg);
      el('text', { x: x(2026) + 8, y: y(t26) + 4, class: 'ghost-label' }, svg).textContent = `${t26.toFixed(1)}%`;
    } else {
      el('circle', { cx: x(2026), cy: y(last.v), r: 4.5, class: 'ghost-bar' }, svg);
      el('text', { x: x(2026) + 8, y: y(last.v) + 4, class: 'ghost-label' }, svg).textContent = '2026';
    }
    note(svg, x(2018), y(50) - 14, ['2018', '50.0%'], 'middle');
    note(svg, x(1926), y(32.9) + 18, ['1926', '32.9%'], 'middle');

    // a crosshair that finds the nearest election
    const cross = el('line', { y1: m.t, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1, opacity: 0 }, svg);
    const dotM = el('circle', { r: 4, fill: 'var(--ink)', opacity: 0 }, svg);
    const dotP = el('circle', { r: 4, fill: '#a9a397', opacity: 0 }, svg);
    const hit = el('rect', { x: m.l, y: m.t, width: W - m.l - m.r + 30, height: H - m.t - m.b, fill: 'transparent', class: 'hit' }, svg);
    const years = D.turnout.map((t) => t.y).concat([2026]);
    const at = (e) => {
      const r = chart.getBoundingClientRect(), px = e.clientX - r.left;
      let best = years[0];
      for (const yr of years) if (Math.abs(x(yr) - px) < Math.abs(x(best) - px)) best = yr;
      return best;
    };
    const near = (list, yr) => list.reduce((a, b) => (Math.abs(b.y - yr) < Math.abs(a.y - yr) ? b : a));
    const show = (e) => {
      const yr = at(e), isMid = yr % 4 === 2;
      const mt = yr === 2026 ? { y: 2026, v: t26 } : isMid ? series.m.find((t) => t.y === yr) : near(series.m, yr);
      const pr = isMid ? near(series.p, yr) : series.p.find((t) => t.y === yr);
      cross.setAttribute('x1', x(yr)); cross.setAttribute('x2', x(yr)); cross.setAttribute('opacity', .25);
      if (mt && mt.v != null) { dotM.setAttribute('cx', x(mt.y)); dotM.setAttribute('cy', y(mt.v)); dotM.setAttribute('opacity', 1); } else dotM.setAttribute('opacity', 0);
      if (pr) { dotP.setAttribute('cx', x(pr.y)); dotP.setAttribute('cy', y(pr.v)); dotP.setAttribute('opacity', 1); }
      const html = `<b>${yr}</b><div class="who">${isMid ? 'Midterm' : 'Presidential election'}</div><dl>
        <dt>Midterm ${mt ? mt.y : ''}</dt><dd>${mt && mt.v != null ? pct(mt.v) : 'counting'}</dd>
        <dt>Presidential ${pr ? pr.y : ''}</dt><dd>${pr ? pct(pr.v) : '—'}</dd></dl>`;
      showTip(html, chart, x(yr), y(mt && mt.v != null ? mt.v : pr ? pr.v : 50), 'turnout');
    };
    const clear = () => { cross.setAttribute('opacity', 0); dotM.setAttribute('opacity', 0); dotP.setAttribute('opacity', 0); hideTip(); };
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clear(); });
  }

  // ---------- 2026, once it is in ----------
  function fillBoard() {
    const set = (id, html, wait) => { const n = document.getElementById(id); n.innerHTML = html; n.classList.toggle('wait', !!wait); };
    if (counted) {
      const keep = now.house >= now.majority;
      document.getElementById('legend-2026').hidden = true;
      set('b-house', `${now.house}<small>${signed(now.change)}${est}</small>`);
      document.getElementById('b-house-p').textContent = now.estimate && now.houseCalled
        ? `Republican seats in NBC News’s estimate of the final count, from 220. Called so far: ${now.houseCalled[0]} Democrats, ${now.houseCalled[1]} Republicans. ${keep ? 'They keep the House.' : 'The Democrats take the House.'}`
        : `Republican seats of 435, from 220. ${keep ? 'They keep the House.' : 'The Democrats take the House.'}`;
    }
    // before a chamber is final: the seats called so far, Democrats first
    const sofar = (id, [d, r], size, majority, held, name) => {
      const out = size - d - r;
      set(id, `${d}–${r}<small>${out} to call</small>`);
      const won = d >= majority ? `The Democrats take the ${name}.` : r >= majority ? `Republicans keep the ${name}.` : `${majority} is a majority.`;
      document.getElementById(`${id}-p`).textContent = `Democrats have won ${d} seats and Republicans ${r}, with ${out} still uncalled. Republicans held ${held}. ${won}`;
    };
    if (!counted && now.houseCalled) sofar('b-house', now.houseCalled, 435, now.majority, 220, 'House');
    if (now.senateSeats == null && now.senateCalled) sofar('b-senate', now.senateCalled, 100, 51, 53, 'Senate');
    if (now.senateSeats != null) {
      const keep = now.senateSeats >= 50;
      set('b-senate', `${now.senateSeats}<small>${signed(now.senate.change)}</small>`);
      document.getElementById('b-senate-p').textContent = `Republican seats of 100, from 53. ${keep ? 'They keep the Senate.' : 'The Democrats take the Senate.'}`;
    }
    if (now.turnout && now.turnout.v != null) {
      set('b-turnout', `${now.turnout.v.toFixed(1)}<small>%</small>`);
      document.getElementById('b-turnout-p').textContent = `Of 251.6 million eligible voters, an estimate until the count is certified. 2022 drew 46.1%.`;
    }
    if (now.approval) set('b-approval', `${now.approval.v}<small>%</small>`);
    const noteEl = document.getElementById('board-note');
    if (counted || now.senateSeats != null || now.houseCalled || now.senateCalled) noteEl.textContent = [now.asOf ? `As of ${now.asOf}, New York time.` : '', now.note || ''].join(' ').trim() || 'Results as called.';

    // where 2026 falls among the waves
    if (counted) {
      const rows = scored.concat([{ ...now, seats1: now.house, size1: 435 }]).sort((a, b) => a.shift - b.shift);
      const rank = rows.findIndex((d) => d.y === 2026) + 1;
      const top = rows.slice(0, 8);
      if (rank > 8) top.push(rows[rank - 1]);
      const widest = -rows[0].shift;
      document.querySelector('#waves tbody').innerHTML = top.map((d) => `<tr class="${d.y === 2026 ? 'now' : ''}">
        <td class="y">${d.y}</td><td class="who">${d.president}<small>${d.partyName}${d.y === 2026 ? ` · ${rank} of ${rows.length}${est}` : ''}</small></td>
        <td class="bar"><div class="b ${d.party === 'D' ? 'cD' : d.party === 'R' ? 'cR' : 'cE'}" style="width:${Math.max(0, -d.shift / widest * 100).toFixed(0)}%"></div></td>
        <td class="v">${signed(d.shift, 1)} pts</td><td class="v">${signed(d.change)}</td></tr>`).join('');
    }
  }

  function fillTable() {
    const rows = all.concat([{ ...now, seats1: now.house, size1: 435 }]);
    document.querySelector('#data tbody').innerHTML = rows.map((d) => {
      const t = d.y === 2026 ? now.turnout && now.turnout.v : d.turnout;
      return `<tr><td>${d.y}</td><td>${d.president}</td><td>${d.partyName}</td>
        <td>${d.seats0 ?? '—'}</td><td>${d.seats1 != null ? d.seats1 + (d.y === 2026 ? est : '') : d.y === 2026 ? 'counting' : '—'}</td><td>${d.change != null ? signed(d.change) : '—'}</td>
        <td>${d.shift != null ? signed(d.shift, 1) : '—'}</td><td>${d.senate && d.senate.change != null ? signed(d.senate.change) : '—'}</td>
        <td>${d.approval ? d.approval.v + '%' : '—'}</td><td>${t != null ? pct(t) : '—'}</td></tr>`;
    }).join('');
  }

  // ---------- draw, and draw again when the width changes ----------
  function watch(chart, draw) {
    let w = chart.clientWidth;
    draw(chart);
    new ResizeObserver(() => {
      if (chart.clientWidth === w) return;  // drawing changes only the height, so this never loops
      w = chart.clientWidth;
      hideTip();
      draw(chart);
    }).observe(chart);
  }
  const charts = [['c-all', drawAll], ['c-turnout', drawTurnout], ['c-exposure', drawExposure]];
  for (const [id, draw] of charts) watch(document.getElementById(id), draw);
  fillBoard();
  fillTable();

  // for the state charts in map.js
  window.TIDE = { el, scale, color, signed, pct, bar, showTip, hideTip, hover, axisY, axisX, note, range, watch };
})();
