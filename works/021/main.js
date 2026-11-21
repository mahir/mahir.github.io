// The page. It asks Open-Meteo which of the towns in towns.js has snow this hour, reads
// the air above one of them, grows the crystal (sky.js, reiter.js) and plays the fall.
//
// ?town=Davos opens a town by name, ?frozen uses the kept sky in frozen.js and asks
// nobody, ?still shows the crystal landed, ?p=0.5 stops it halfway down, ?bare hides
// everything but the crystal and the rail (og.jpg is ?frozen&still&bare).
(function () {
  'use strict';

  const Sky = window.Sky, Reiter = window.Reiter, TOWNS = window.SnowTowns;
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const BARE = params.has('bare'), STILL = params.has('still') || params.has('p'), FROZEN = params.has('frozen');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const API = 'https://api.open-meteo.com/v1/forecast';
  const SNOW = [71, 73, 75, 77, 85, 86];
  const FALL = 30; // seconds for a fall that grows all the way down

  const el = {
    status: $('#status'), town: $('#town'), when: $('#when'), scene: $('#scene'), gl: $('#gl'), rail: $('#rail'),
    railc: $('#railc'), kind: $('#kind'), nums: $('#nums'), again: $('#again'), other: $('#other'), save: $('#save'),
    chart: $('#chart'), towns: $('#towns'), list: $('#townlist'),
  };

  // ---------- words ----------

  const WEATHER = {
    0: 'clear', 1: 'mostly clear', 2: 'partly cloudy', 3: 'overcast', 45: 'fog', 48: 'freezing fog',
    51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle', 56: 'freezing drizzle', 57: 'freezing drizzle',
    61: 'light rain', 63: 'rain', 65: 'heavy rain', 66: 'freezing rain', 67: 'freezing rain',
    71: 'light snow', 73: 'snow', 75: 'heavy snow', 77: 'snow grains', 80: 'rain showers', 81: 'rain showers', 82: 'heavy rain showers',
    85: 'snow showers', 86: 'heavy snow showers', 95: 'thunderstorm', 96: 'thunderstorm with hail', 99: 'thunderstorm with hail',
  };
  const weather = (code) => WEATHER[code] || 'weather code ' + code;

  const KIND = {
    melt: 'Above freezing. Nothing is added, and it starts to melt.',
    dry: 'Too dry here. Nothing is added.',
    thin: 'Thin plates grow on it.',
    column: 'It grows tall here, not wide: it thickens.',
    plate: 'It grows as a plate.',
    sector: 'It grows broad arms.',
    star: 'It grows branches, the fern kind.',
    cold: 'Very cold. It grows as a thick plate.',
  };
  const KIND_SHORT = { melt: 'above freezing', dry: 'too dry', thin: 'thin plates', column: 'thickens', plate: 'plate', sector: 'broad arms', star: 'ferns', cold: 'thick plate' };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // "2026-11-21T11:45" -> "21 Nov 2026, 11:45"
  const stamp = (iso) => { const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d:\d\d)/.exec(iso || ''); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}, ${m[4]}` : ''; };
  const clock = (iso) => (/T(\d\d:\d\d)/.exec(iso || '') || [])[1] || '';
  const meters = (z) => (Math.round(z / 10) * 10).toLocaleString('en-US') + ' m';
  const degrees = (t, digits) => { const v = +t.toFixed(digits == null ? 0 : digits); return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(digits == null ? 0 : digits) + '°'; };

  // ---------- color: the temperature a layer has, on the rail and in the ice ----------

  const RAMP = [[-45, 152, 128, 255], [-30, 108, 146, 255], [-20, 92, 182, 255], [-12, 124, 226, 255], [-5, 200, 240, 255], [0, 240, 248, 255], [6, 255, 214, 170]];
  function tcolor(t) {
    if (t <= RAMP[0][0]) return RAMP[0].slice(1);
    for (let i = 1; i < RAMP.length; i++) if (t <= RAMP[i][0]) {
      const a = RAMP[i - 1], b = RAMP[i], f = (t - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f];
    }
    return RAMP[RAMP.length - 1].slice(1);
  }
  const css = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a == null ? 1 : a})`;

  // ---------- state ----------

  const grid = Reiter.Grid(200);
  let painter = null;
  try { painter = window.SnowPainter(el.gl); } catch (e) { painter = null; }
  const S = { town: null, snd: null, plan: null, crystal: null, p: 0, playing: false, fresh: 0, probe: null, scan: null, last: 0, drag: false, token: 0 };

  if (!painter) {
    document.documentElement.classList.add('nogl');
    el.status.textContent = 'This browser cannot draw the crystal (it needs WebGL 2). The picture is a kept one: Sapporo, 21 Nov 2026, 11:45.';
    return;
  }
  document.documentElement.classList.add('live');
  if (BARE) document.documentElement.classList.add('bare');

  // ---------- asking Open-Meteo ----------

  async function ask(url) {
    const stop = new AbortController(), timer = setTimeout(() => stop.abort(), 8000);
    try { const r = await fetch(url, { signal: stop.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
    finally { clearTimeout(timer); }
  }
  const everyTown = () => `latitude=${TOWNS.map((t) => t.lat).join(',')}&longitude=${TOWNS.map((t) => t.lon).join(',')}`;
  const scanURL = () => `${API}?${everyTown()}&current=temperature_2m,snowfall,weather_code&timezone=auto`;
  const nextURL = () => `${API}?${everyTown()}&hourly=snowfall&forecast_hours=24&timezone=auto`;
  const airURL = (t) => `${API}?latitude=${t.lat}&longitude=${t.lon}&current=temperature_2m,relative_humidity_2m,snowfall,weather_code`
    + `&hourly=${['temperature', 'relative_humidity', 'geopotential_height'].flatMap((v) => Sky.LEVELS.map((p) => `${v}_${p}hPa`)).join(',')}&forecast_hours=1&timezone=auto`;

  const snowing = (now) => !!now && (SNOW.includes(now.weather_code) || now.snowfall > 0);

  async function scan() {
    const all = await ask(scanURL());
    S.scan = TOWNS.map((t, i) => ({ town: t, now: all[i] && all[i].current }));
    return S.scan;
  }

  // ---------- from an answer to a crystal ----------

  function show(town, answer, note) {
    const token = ++S.token;
    S.town = town; S.snd = Sky.sounding(answer); S.plan = Sky.plan(S.snd);
    S.crystal = S.plan.empty ? null : Sky.grow(Reiter, grid, S.plan);
    painter.crystal(grid, S.crystal);

    // along the fall: the color of each layer's temperature, and the thickness gained by then
    const lut = new Uint8Array(256 * 4), sl = S.plan.slices;
    for (let i = 0; i < 256; i++) {
      const s = sl[Math.min(sl.length - 1, Math.round(i / 255 * (sl.length - 1)))], c = tcolor(s.t);
      lut[i * 4] = c[0]; lut[i * 4 + 1] = c[1]; lut[i * 4 + 2] = c[2];
      lut[i * 4 + 3] = Math.min(255, Math.round(s.tall / 160 * 255));
    }
    painter.lut(lut);

    el.town.textContent = town.name;
    el.when.textContent = `${town.country} · ${stamp(S.snd.time)} there · ${weather(S.snd.code)}`;
    el.status.textContent = S.crystal || snowing(answer.current) ? note : 'It is not snowing in ' + town.name + ' now, and the air above it is too dry to grow a crystal.';
    document.title = `Mahir Yavuz · A snowflake, on its way down · ${town.name}`;
    document.documentElement.classList.toggle('empty', !S.crystal);

    growth();
    chart();
    resize();
    S.probe = null;
    const p0 = params.has('p') ? Math.max(0, Math.min(1, +params.get('p') || 0)) : 1;
    if (STILL || calm || !S.crystal) { S.p = p0; S.playing = false; S.fresh = params.has('p') ? 1 : 0; frame(); read(); button(); }
    else fall(0);
    return token;
  }

  // where most of the crystal was put on: the heights between which the middle four fifths of its width grew
  function growth() {
    const sl = S.plan.slices, total = S.plan.reach;
    S.band = null;
    if (!S.crystal || total <= 0) return;
    let a = null, b = null;
    for (const s of sl) { if (a === null && s.radius >= total * 0.1) a = s; if (b === null && s.radius >= total * 0.9) b = s; }
    S.band = { from: a, to: b || sl[sl.length - 1] };
  }

  // ---------- the fall ----------

  function fall(from) {
    S.p = from == null ? 0 : from; S.playing = true; S.fresh = 1; S.last = 0;
    requestAnimationFrame(tick);
    button();
  }

  function tick(now) {
    if (!S.playing) return;
    const dt = S.last ? Math.min(0.1, (now - S.last) / 1000) : 0;
    S.last = now;
    const s = S.plan.at(S.p);
    S.p += dt / FALL * (s.grow > 0 ? 1 : 2.6);
    if (S.p >= 1) { S.p = 1; S.playing = false; settle(); }
    frame(); read();
    if (S.playing) requestAnimationFrame(tick); else button();
  }

  // once landed, the glow of new ice fades
  function settle() {
    const t0 = performance.now();
    const fade = (now) => {
      if (S.playing || S.drag || S.p < 1) return;
      S.fresh = Math.max(0, 1 - (now - t0) / 1400);
      frame();
      if (S.fresh > 0) requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
  }

  function button() {
    el.again.textContent = S.playing ? 'Hold it' : S.p >= 1 || !S.crystal ? 'Fall again' : 'Let it fall';
    el.again.disabled = !S.crystal;
    el.save.disabled = !S.crystal;
  }

  // ---------- drawing ----------

  const view = { cx: 0, cy: 0, unit: 1, railW: 0, dpr: 1, w: 0, h: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), box = el.scene.getBoundingClientRect();
    const w = Math.max(1, Math.round(box.width * dpr)), h = Math.max(1, Math.round(box.height * dpr));
    if (el.gl.width !== w || el.gl.height !== h) { el.gl.width = w; el.gl.height = h; }
    const rw = el.rail.getBoundingClientRect().width;
    const rc = el.railc, rh = el.rail.getBoundingClientRect().height;
    rc.width = Math.round(rw * dpr); rc.height = Math.round(rh * dpr);
    view.dpr = dpr; view.railW = rw * dpr;
    view.w = w; view.h = h;
    frame();
  }

  // The crystal sits in what the rail leaves free. The view starts close on the seed and
  // draws back as the crystal widens, ending where the whole of it fits; small crystals
  // end up drawn smaller, down to a point.
  function aim() {
    const tip = S.crystal ? S.crystal.tip : 60, whole = Math.max(tip, BARE ? 40 : 104) + 3;
    const now = S.crystal ? S.plan.at(Math.min(S.p, 0.9999)).radius : whole;
    const fit = Math.min(whole, Math.max(30, now * 1.7 + 12));
    const freeW = view.w - view.railW, pad = BARE ? 0.86 : 0.93;
    view.unit = Math.min(freeW * pad / (2 * 0.8660254 * fit), view.h * pad / (2 * fit));
    view.cx = view.railW + freeW / 2; view.cy = view.h / 2;
  }

  function frame() {
    if (!S.plan || !view.w) return;
    aim();
    painter.draw(view, S.crystal ? S.p : 0, S.probe, S.fresh);
    rail();
    dot();
  }

  // The rail: the air over the town, top to ground. A strip in the colors of its
  // temperature, and beside it how much vapor each height has to spare: filled where the
  // crystal can widen, outlined where it can only thicken.
  function rail() {
    const c = el.railc, g = c.getContext('2d'), d = view.dpr, w = c.width / d, h = c.height / d;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, w, h);
    const pl = S.plan, sl = pl.slices, wide = w >= 150;
    const top = 18, bottom = h - 30, span = bottom - top;
    const y = (z) => top + (pl.top - z) / (pl.top - pl.ground) * span;
    const xs = wide ? 80 : 38, sw = wide ? 6 : 5, xa = xs + sw + 5, wa = Math.max(14, w - xa - (wide ? 52 : 6));
    S.geom = { top, span, h, w };

    g.font = `${wide ? 12 : 11}px "IBM Plex Mono", ui-monospace, Menlo, monospace`;
    g.textBaseline = 'middle';
    // heights
    g.textAlign = 'right';
    const stepz = (pl.top - pl.ground) > 5200 ? 2000 : 1000;
    for (let z = Math.ceil((pl.ground + 150) / stepz) * stepz; z < pl.top - 60; z += stepz) {
      g.fillStyle = 'rgba(158,176,204,.9)';
      g.fillText(wide ? z.toLocaleString('en-US') + ' m' : z / 1000 + ' km', xs - 8, y(z));
      g.fillStyle = 'rgba(158,176,204,.5)'; g.fillRect(xs - 5, Math.round(y(z)), 4, 1);
    }
    g.fillStyle = 'rgba(158,176,204,.9)';
    g.fillText(wide ? 'ground' : 'gnd', xs - 8, bottom + 1);

    // temperature strip
    const dy = span / sl.length;
    for (let i = 0; i < sl.length; i++) { g.fillStyle = css(tcolor(sl[i].t)); g.fillRect(xs, top + i * dy, sw, dy + 0.6); }

    // vapor to spare
    const X = (s) => xa + Math.min(1, s.spare / 0.24) * wa;
    for (let i = 0; i < sl.length; i++) {
      const s = sl[i];
      if (s.spare <= 0) continue;
      const c2 = tcolor(s.t), yy = top + i * dy;
      if (s.grow > 0) { g.fillStyle = css(c2, 0.18 + 0.5 * Math.min(1, s.widens)); g.fillRect(xa, yy, X(s) - xa, dy + 0.6); }
      else { g.fillStyle = css(c2, 0.5); g.fillRect(X(s) - 1, yy, 1, dy + 0.6); if (i % 6 === 0) g.fillRect(xa, yy, X(s) - xa, 0.75); }
    }
    // the levels the forecast gives, with their temperatures
    if (wide) {
      g.textAlign = 'left';
      g.fillStyle = 'rgba(158,176,204,.75)'; g.fillText('vapor to spare', xa, 6);
      for (const p of S.snd.points) {
        if (p.z > pl.top || p.ground) continue;
        const yy = y(p.z);
        if (yy < top + 6 || yy > bottom - 12) continue;
        g.fillStyle = 'rgba(214,226,244,.85)'; g.fillText(degrees(p.t), w - 44, yy);
        g.fillStyle = 'rgba(214,226,244,.55)'; g.beginPath(); g.arc(xs + sw / 2, yy, 1.4, 0, 7); g.fill();
      }
      const gp = S.snd.points[S.snd.points.length - 1];
      g.fillStyle = 'rgba(214,226,244,.85)'; g.fillText(degrees(gp.t), w - 44, bottom + 1);
    }
    // the ground
    g.fillStyle = 'rgba(214,226,244,.45)'; g.fillRect(xs - 6, bottom + 12, w - xs + 6 - (wide ? 8 : 2), 1);

    // a layer pointed at on the crystal
    if (S.probe != null) { g.fillStyle = 'rgba(255,209,122,.9)'; g.fillRect(xs - 4, top + S.probe * span - 0.5, xa + wa - xs + 8, 1); }
    S.geom.xs = xs; S.geom.sw = sw;
  }

  // the crystal's place on the rail
  function dot() {
    const g = el.railc.getContext('2d'), G = S.geom;
    if (!G) return;
    const yy = G.top + S.p * G.span, x = G.xs + G.sw / 2;
    g.fillStyle = 'rgba(255,209,122,.28)'; g.fillRect(G.xs - 6, yy - 0.5, G.w - G.xs, 1);
    g.fillStyle = '#0a0f1c'; g.beginPath(); g.arc(x, yy, 7.5, 0, 7); g.fill();
    g.fillStyle = '#ffd17a'; g.beginPath(); g.arc(x, yy, 5, 0, 7); g.fill();
  }

  // ---------- the reading ----------

  function read() {
    const pl = S.plan, at = S.probe != null ? S.probe : S.p, s = pl.at(Math.min(at, 0.9999));
    const z = pl.top - at * (pl.top - pl.ground);
    let kind, nums;
    if (!S.crystal && S.probe == null) {
      kind = 'No crystal. The air over ' + S.town.name + ' is too dry to grow one this hour.';
      nums = `${meters(S.snd.ground)} · ${degrees(S.snd.points[S.snd.points.length - 1].t, 1)} on the ground`;
    } else if (S.probe != null) {
      kind = 'This ice froze at ' + meters(z) + ', at ' + degrees(s.t) + '.';
      nums = `${KIND_SHORT[s.kind]} · humidity ${Math.round(s.rh)}% · ${s.spare.toFixed(2)} g/m³ to spare`;
    } else if (S.p >= 1) {
      const g = S.snd.points[S.snd.points.length - 1];
      kind = 'On the ground in ' + S.town.name + ', ' + degrees(g.t, 1) + '.';
      nums = S.band ? `Most of it grew between ${meters(S.band.from.z)} and ${meters(S.band.to.z)}, at ${degrees(S.band.from.t)} to ${degrees(S.band.to.t)}.` : '';
    } else {
      kind = KIND[s.kind];
      nums = `${meters(z)} · ${degrees(s.t, 1)} · humidity ${Math.round(s.rh)}%` + (s.spare > 0 ? ` · ${s.spare.toFixed(2)} g/m³ to spare` : '');
    }
    if (el.kind.textContent !== kind) el.kind.textContent = kind;
    if (el.nums.textContent !== nums) el.nums.textContent = nums;
    el.rail.setAttribute('aria-valuenow', Math.round(z));
    el.rail.setAttribute('aria-valuetext', `${meters(z)}, ${degrees(s.t)}. ${KIND[s.kind]}`);
    mark();
  }

  // ---------- Nakaya's diagram, with this fall drawn across it ----------

  const CH = { w: 320, h: 224, l: 30, r: 6, t: 31, b: 34, t0: 0, t1: -40, s1: 0.3 };
  const cx = (t) => CH.l + (t - CH.t0) / (CH.t1 - CH.t0) * (CH.w - CH.l - CH.r);
  const cy = (s) => CH.h - CH.b - Math.min(s, CH.s1) / CH.s1 * (CH.h - CH.t - CH.b);

  function chart() {
    const sl = S.plan.slices;
    let water = '';
    for (let t = 0; t >= -40; t -= 0.5) water += (water ? 'L' : 'M') + cx(t).toFixed(1) + ' ' + cy(Sky.density(Sky.overWater(t) - Sky.overIce(t), t)).toFixed(1);
    let o = `<title>Nakaya’s diagram with the fall over ${S.town.name}</title>`;
    // the kinds, by temperature: names on two rows, so the narrow ones have room
    const zones = [[0, -3, 'plates', 0], [-3, -8, 'columns', 1], [-8, -22, 'plates, stars', 0], [-22, -40, 'thick plates', 1]];
    zones.forEach(([a, b, name, row], i) => {
      if (i % 2) o += `<rect x="${cx(a)}" y="${CH.t}" width="${cx(b) - cx(a)}" height="${CH.h - CH.t - CH.b}" class="zone"/>`;
      const mid = (cx(a) + cx(b)) / 2, y = row ? 22 : 9;
      o += i === 0 ? `<text x="${cx(a) - 2}" y="${y}" class="zl">${name}</text>` : `<text x="${mid}" y="${y}" class="zl" text-anchor="middle">${name}</text>`;
      if (i < 2) o += `<line x1="${mid}" y1="${y + 3}" x2="${mid}" y2="${CH.t - 1}" class="tick"/>`;
    });
    // axes
    for (const t of [0, -10, -20, -30, -40]) o += `<text x="${cx(t)}" y="${CH.h - CH.b + 15}" class="ax" text-anchor="middle">${t === 0 ? '0°' : '−' + -t + '°'}</text><line x1="${cx(t)}" y1="${CH.h - CH.b}" x2="${cx(t)}" y2="${CH.h - CH.b + 3}" class="tick"/>`;
    for (const s of [0.1, 0.2, 0.3]) o += `<text x="${CH.l - 5}" y="${cy(s) + 3.5}" class="ax" text-anchor="end">${s}</text><line x1="${CH.l}" y1="${cy(s)}" x2="${CH.w - CH.r}" y2="${cy(s)}" class="grid"/>`;
    o += `<line x1="${CH.l}" y1="${CH.h - CH.b}" x2="${CH.w - CH.r}" y2="${CH.h - CH.b}" class="axis"/>`;
    o += `<text x="${CH.w - CH.r}" y="${CH.h - 3}" class="ax" text-anchor="end">temperature</text><text x="2" y="${CH.h - 3}" class="ax">g/m³ of vapor to spare</text>`;
    o += `<path d="${water}" class="water"/>`;
    // the fall, colored by temperature, thicker where the crystal widens
    for (let i = 4; i < sl.length; i += 4) {
      const a = sl[i - 4], b = sl[i];
      if (a.t > 0.5 && b.t > 0.5) continue;
      const growing = b.grow > 0;
      o += `<line x1="${cx(Math.min(a.t, 0)).toFixed(1)}" y1="${cy(a.spare).toFixed(1)}" x2="${cx(Math.min(b.t, 0)).toFixed(1)}" y2="${cy(b.spare).toFixed(1)}" stroke="${css(tcolor(b.t))}" stroke-width="${growing ? 2.4 : 1}" stroke-linecap="round" opacity="${growing ? 1 : 0.6}"/>`;
    }
    o += `<circle id="cdot" r="4.5" class="cdot"/>`;
    el.chart.setAttribute('viewBox', `0 0 ${CH.w} ${CH.h}`);
    el.chart.innerHTML = o;
    mark();
  }

  function mark() {
    const d = el.chart.querySelector('#cdot');
    if (!d || !S.plan) return;
    const s = S.plan.at(Math.min(S.probe != null ? S.probe : S.p, 0.9999));
    d.setAttribute('cx', cx(Math.min(s.t, 0)).toFixed(1)); d.setAttribute('cy', cy(s.spare).toFixed(1));
  }

  // ---------- hands ----------

  // the rail is a slider: drag the crystal back up and let go
  const railP = (e) => { const b = el.rail.getBoundingClientRect(), G = S.geom; return Math.max(0, Math.min(1, (e.clientY - b.top - G.top) / G.span)); };
  el.rail.addEventListener('pointerdown', (e) => {
    if (!S.plan || !S.geom) return;
    try { el.rail.setPointerCapture(e.pointerId); } catch (err) { /* a pointer that cannot be captured still drags */ }
    S.drag = true; S.playing = false; S.fresh = 1; S.probe = null; S.p = railP(e);
    frame(); read(); button(); e.preventDefault();
  });
  el.rail.addEventListener('pointermove', (e) => { if (S.drag) { S.p = railP(e); frame(); read(); } });
  const letGo = () => { if (!S.drag) return; S.drag = false; if (S.crystal && S.p < 1) fall(S.p); else { settle(); button(); } };
  el.rail.addEventListener('pointerup', letGo);
  el.rail.addEventListener('pointercancel', letGo);
  el.rail.addEventListener('keydown', (e) => {
    if (!S.plan) return;
    const step = { ArrowUp: -0.02, ArrowDown: 0.02, PageUp: -0.1, PageDown: 0.1 }[e.key];
    if (step != null) { S.playing = false; S.fresh = 1; S.p = Math.max(0, Math.min(1, S.p + step)); }
    else if (e.key === 'Home') { S.playing = false; S.fresh = 1; S.p = 0; }
    else if (e.key === 'End') { S.playing = false; S.p = 1; settle(); }
    else if (e.key === ' ' || e.key === 'Enter') { el.again.click(); e.preventDefault(); return; }
    else return;
    e.preventDefault(); frame(); read(); button();
  });

  // which moment of the fall froze the ice under a point of the scene, or null
  function under(e) {
    if (!S.crystal) return null;
    const b = el.scene.getBoundingClientRect();
    const X = ((e.clientX - b.left) * view.dpr - view.cx) / view.unit, Y = -((e.clientY - b.top) * view.dpr - view.cy) / view.unit;
    const r = X / 0.8660254, q = Y - r / 2;
    let rq = Math.round(q), rr = Math.round(r);
    const rs = Math.round(-q - r), dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs + q + r);
    if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
    const f = Reiter.fold(rq, rr), i = grid.index.get(f[0] * 4096 + f[1]);
    return i === undefined || !S.crystal.ice[i] ? null : S.crystal.born[i];
  }
  // pointing at the ice says where it froze; a click takes the crystal back to that moment
  el.gl.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || S.playing || S.drag || S.p < 1) return;
    const b = under(e);
    if (b === S.probe) return;
    S.probe = b; el.gl.style.cursor = b == null ? '' : 'pointer';
    frame(); read();
  });
  el.gl.addEventListener('pointerleave', () => { if (S.probe != null) { S.probe = null; frame(); read(); } });
  el.gl.addEventListener('click', (e) => {
    const b = under(e);
    if (b == null) return;
    S.probe = null; fall(Math.max(0, b - 0.004));
  });

  el.again.addEventListener('click', () => {
    if (!S.crystal) return;
    if (S.playing) { S.playing = false; button(); }
    else fall(S.p >= 1 ? 0 : S.p);
  });

  // ---------- another town ----------

  function listTowns() {
    const rows = (S.scan || TOWNS.map((t) => ({ town: t, now: null })));
    const snow = rows.filter((r) => snowing(r.now)).sort((a, b) => b.now.snowfall - a.now.snowfall);
    const rest = rows.filter((r) => !snowing(r.now));
    const item = (r) => `<li><button type="button" data-town="${r.town.name}"${S.town && r.town.name === S.town.name ? ' aria-current="true"' : ''}><span class="n">${r.town.name}</span><span class="c">${r.town.country}</span><span class="w">${r.now ? weather(r.now.weather_code) + ', ' + degrees(r.now.temperature_2m) : ''}</span></button></li>`;
    el.list.innerHTML = (snow.length ? `<h3>Snowing now</h3><ul>${snow.map(item).join('')}</ul>` : '<p class="none">No snow in any of them this hour.</p>')
      + `<h3>${snow.length ? 'Not snowing now' : 'The towns'}</h3><ul>${rest.map(item).join('')}</ul>`;
  }
  el.other.addEventListener('click', () => { listTowns(); el.towns.showModal(); });
  el.towns.addEventListener('click', (e) => {
    if (e.target === el.towns) { el.towns.close(); return; }
    const b = e.target.closest('button[data-town]');
    if (b) { el.towns.close(); open(TOWNS.find((t) => t.name === b.dataset.town)); }
    else if (e.target.closest('.close')) el.towns.close();
  });

  async function open(town, note) {
    S.playing = false;
    el.status.textContent = 'Reading the air over ' + town.name + '.';
    try {
      const answer = await ask(airURL(town));
      const now = answer.current;
      show(town, answer, note || (snowing(now)
        ? 'It is snowing in ' + town.name + '. This is one crystal from the air above it.'
        : 'It is not snowing in ' + town.name + ' now. This is what the air above it would grow.'));
    } catch (e) { kept('Open-Meteo did not answer.'); }
  }

  function kept(why) {
    const F = window.SnowFrozen;
    show(TOWNS.find((t) => t.name === F.town), F.answer, (why ? why + ' ' : '') + 'This is a kept sky: ' + F.town + ', ' + stamp(F.answer.current.time) + '.');
  }

  // ---------- keep the picture ----------

  el.save.addEventListener('click', () => {
    if (!S.crystal) return;
    const N = 1600, keepW = el.gl.width, keepH = el.gl.height, keep = Object.assign({}, view);
    el.gl.width = N; el.gl.height = N;
    const fit = Math.max(S.crystal.tip, 104) + 3;
    painter.draw({ cx: N / 2, cy: N / 2 - 30, unit: N * 0.84 / (2 * fit) }, S.p, null, 0);
    const out = document.createElement('canvas'); out.width = N; out.height = N;
    const g = out.getContext('2d');
    g.fillStyle = '#070b14'; g.fillRect(0, 0, N, N);
    g.drawImage(el.gl, 0, 0);
    g.textBaseline = 'alphabetic';
    g.fillStyle = '#eef3fa'; g.font = '500 54px Newsreader, Georgia, serif'; g.fillText(S.town.name, 70, N - 118);
    g.fillStyle = '#9eb0cc'; g.font = '26px "IBM Plex Mono", ui-monospace, Menlo, monospace';
    g.fillText(`${S.town.country} · ${stamp(S.snd.time)} · ${weather(S.snd.code)}`, 70, N - 70);
    g.textAlign = 'right'; g.fillText('mahiryavuz.com/works/021', N - 70, N - 70);
    el.gl.width = keepW; el.gl.height = keepH; Object.assign(view, keep); frame();
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `snowflake-${S.town.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${(S.snd.time || '').replace(/[^0-9]/g, '').slice(0, 12)}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  });

  // ---------- start ----------

  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(el.scene);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (S.plan) frame(); });

  async function start() {
    if (FROZEN) { kept(''); return; }
    el.status.textContent = 'Looking for snow in ' + TOWNS.length + ' towns.';
    const named = params.get('town') && TOWNS.find((t) => t.name.toLowerCase() === params.get('town').toLowerCase());
    try {
      const rows = await scan();
      if (named) { await open(named); return; }
      const snow = rows.filter((r) => snowing(r.now)).sort((a, b) => b.now.snowfall - a.now.snowfall || b.now.weather_code - a.now.weather_code);
      if (snow.length) {
        const pick = snow[0].town;
        await open(pick, snow.length === 1
          ? `It is snowing in one of ${TOWNS.length} towns this hour: ${pick.name}. This is one crystal from the air above it.`
          : `It is snowing in ${snow.length} of ${TOWNS.length} towns this hour, hardest in ${pick.name}. This is one crystal from the air above it.`);
        return;
      }
      // nowhere: the town where snow is due soonest
      const next = await ask(nextURL());
      let best = null;
      next.forEach((a, i) => { const k = a.hourly.snowfall.findIndex((v) => v > 0); if (k >= 0 && (!best || k < best.k)) best = { k, town: TOWNS[i], time: a.hourly.time[k] }; });
      if (best) await open(best.town, `No snow in any of the ${TOWNS.length} towns this hour. The next is due in ${best.town.name} at ${clock(best.time)} there, so this is the air over it now.`);
      else {
        const cold = rows.slice().sort((a, b) => a.now.temperature_2m - b.now.temperature_2m)[0].town;
        await open(cold, `No snow in any of the ${TOWNS.length} towns today. ${cold.name} is the coldest, so this is the air over it.`);
      }
    } catch (e) { kept('Open-Meteo did not answer.'); }
  }
  start();
})();
