// main.js: the page of No. 020. It makes a language from the number in the address, writes its
// name on the cover, and fills the sections under it.
//
//   #48213      open that language            ?bare    the cover alone, for stills and the share image
//   ?still      no pen: everything is written at once (also when the visitor prefers reduced motion)

import { makeLanguage, clampSeed, MAX, consonantChart } from './language.js';
import { layout, paint } from './script.js';
import { english, plain, START, TALE, WHO, PRON, SUBJECTS, OBJECTS, VERB_LIST, ADJ_LIST } from './english.js';
import { NOUNS, VERBS, REAL } from './words.js';
import { GLOSS_KEY } from './grammar.js';
import { speak, canSpeak, hush } from './voice.js';

const q = new URLSearchParams(location.search);
const root = document.documentElement;
const bare = q.has('bare');
if (bare) root.classList.add('bare');
const still = q.has('still') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const INK = '#1a1713';
const RED = '#c5341c';
const RECEIVERS = ['child', 'woman', 'man', 'friend', 'stranger', 'dog', 'bird'];

const $ = (id) => document.getElementById(id);
function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) e.append(kid);
  return e;
}
// put these in an element in place of what it holds, skipping whatever is not there
const fill = (e, ...kids) => e.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false));

// ---------------------------------------------------------------- state
const cache = new Map();
const lang = (seed) => { if (!cache.has(seed)) cache.set(seed, makeLanguage(seed)); return cache.get(seed); };
let L = null;
let S = structuredClone(START);
let lastOut = null;          // how the sentence was said before the last change, in this language
let open = null;             // which part of the English sentence is being changed
let why = 'order';           // which note is showing under the sentence
const trail = [];            // the languages before this one, newest first

// ---------------------------------------------------------------- ink
const isHot = (r) => r === 'hot';
function makeInk(language, units, { size, max = Infinity, align = 'start', color = INK, label = '' } = {}) {
  const laid = layout(language.script, units, { size, max, align });
  const pad = Math.ceil(size * 0.34);
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = Math.ceil(laid.w + pad * 2); const hh = Math.ceil(laid.h + pad * 2);
  const c = h('canvas', { role: 'img', 'aria-label': label });
  c.width = Math.round(w * dpr); c.height = Math.round(hh * dpr);
  c.style.width = w + 'px'; c.style.aspectRatio = `${w} / ${hh}`;
  const ctx = c.getContext('2d');
  const cold = { ...laid, strokes: laid.strokes.filter((s) => !s.roles.some(isHot)) };
  let at = 0;
  const hotStrokes = laid.strokes.filter((s) => s.roles.some(isHot)).map((s) => { const o = { ...s, at }; at += s.len + size * 0.1; return o; });
  const hot = { ...laid, strokes: hotStrokes, total: at };
  const it = { canvas: c, laid, run: 0, w, h: hh, hotLength: at };
  it.draw = (t = 1, tHot = 1) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, hh);
    let tip = paint(ctx, cold, { ink: color, t, x: pad, y: pad });
    let tipColor = color;
    if (hotStrokes.length) { const hotTip = paint(ctx, hot, { ink: RED, t: tHot, x: pad, y: pad }); if (hotTip) { tip = hotTip; tipColor = RED; } }
    if (tip) {
      // the nib, a little ahead of the ink it has laid down
      ctx.beginPath(); ctx.arc(tip[0], tip[1], Math.max(2.2, size * 0.085), 0, Math.PI * 2);
      ctx.fillStyle = tipColor; ctx.fill();
    }
  };
  it.draw();
  return it;
}
// let the pen write it: all of it, or only what is in red
function write(it, mode = 'all', pace = 26) {
  const id = ++it.run;
  if (still || document.hidden) { it.draw(1, 1); return 0; }
  const length = mode === 'all' ? it.laid.total : it.hotLength;
  if (!length) { it.draw(1, 1); return 0; }
  const ms = Math.max(pace > 26 ? 1100 : 260, Math.min(2800, (length / it.laid.size) * pace));
  const t0 = performance.now();
  const step = (now) => {
    if (it.run !== id) return;
    const t = Math.min(1, (now - t0) / ms);
    if (mode === 'all') it.draw(t, t >= 1 ? 1 : 0); else it.draw(1, t);
    if (t < 1) requestAnimationFrame(step);
  };
  it.draw(mode === 'all' ? 0 : 1, 0);
  requestAnimationFrame(step);
  // if the browser is not drawing frames (a tab in the background), finish the writing anyway
  setTimeout(() => { if (it.run === id) { it.run++; it.draw(1, 1); } }, ms + 500);
  return ms;
}
// a word in the script. With a `row`, it joins the others there and is written in turn when the row comes into view.
const wordInk = (language, segs, size, label = '', row = null) => {
  const it = makeInk(language, language.script.compose([{ segs }], null), { size, label });
  if (row) row.push(it);
  return it.canvas;
};

// ---------------------------------------------------------------- things that happen when they come into view
const motion = !still && !bare && 'IntersectionObserver' in window;
if (motion) root.classList.add('motion');
const waiting = new Map();
const inView = new Set();
const watcher = motion ? new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) { inView.delete(e.target); continue; }
    inView.add(e.target);
    if (e.target.classList.contains('sec')) e.target.classList.add('seen');
    const go = waiting.get(e.target);
    if (go) { waiting.delete(e.target); go(); }
  }
}, { threshold: 0, rootMargin: '0px 0px -10% 0px' }) : null;      // any part of it, a little way up the window
function whenSeen(el, go) {
  if (!watcher) return;
  if (inView.has(el)) { go(); return; }
  waiting.set(el, go);
  watcher.observe(el);
}
// a row of words, each written by the pen a moment after the one before
function penRow(el, row, gap = 55) {
  if (!watcher || !row.length) return;
  for (const it of row) it.draw(0, 0);
  whenSeen(el, () => row.forEach((it, i) => setTimeout(() => write(it), Math.min(i * gap, 2600))));
}
const rom = (language, segs) => language.ph.rom(segs);

// one sentence as rows of word columns: the word in Latin letters over its gloss
function interlinear(language, out, hotParts = null) {
  return h('p', { class: 'inter' }, out.words.map((w) => h('span', { class: 'w' },
    h('span', { class: 'r' }, w.parts.map((p, i) => h('span', { class: hotParts && hotParts.has(p) ? 'hot' : null }, (i ? (p.join || '-') : '') + rom(language, p.segs)))),
    h('span', { class: 'g' }, w.parts.map((p, i) => [i ? (p.join || '-') : '', p.gloss in GLOSS_KEY ? h('abbr', { title: GLOSS_KEY[p.gloss], class: hotParts && hotParts.has(p) ? 'hot' : null }, p.gloss) : h('span', { class: hotParts && hotParts.has(p) ? 'hot' : null }, p.gloss)])),
  )));
}
const glossKey = (outs) => {
  const used = [];
  for (const out of outs) for (const w of out.words) for (const p of w.parts) if (p.gloss in GLOSS_KEY && !used.includes(p.gloss)) used.push(p.gloss);
  return used.length ? h('p', { class: 'key' }, used.map((g) => h('span', {}, h('abbr', {}, g), ' ' + GLOSS_KEY[g]))) : null;
};

// a button that says sentences aloud, one after another
function hearButton(sentences, wordsOf = () => []) {
  if (!canSpeak()) return null;
  const b = h('button', { type: 'button', class: 'hear', 'aria-pressed': 'false' }, h('span', { 'aria-hidden': 'true' }), 'Hear it');
  b.addEventListener('click', async () => {
    if (b.getAttribute('aria-pressed') === 'true') { hush(); b.setAttribute('aria-pressed', 'false'); b.dataset.run = ''; return; }
    const run = String(Math.random()); b.dataset.run = run;
    document.querySelectorAll('.hear[aria-pressed="true"]').forEach((o) => { o.setAttribute('aria-pressed', 'false'); o.dataset.run = ''; });
    b.setAttribute('aria-pressed', 'true');
    const all = sentences();
    for (let i = 0; i < all.length; i++) {
      if (b.dataset.run !== run || !b.isConnected) break;
      const els = [...wordsOf(i)];
      await speak(L, all[i].words, { asked: all[i].end === 'q', onWord: (k) => els.forEach((el, j) => el.classList.toggle('saying', j === k)) });
    }
    if (b.dataset.run === run) b.setAttribute('aria-pressed', 'false');
  });
  return b;
}

// ---------------------------------------------------------------- the cover
let nameInk = null;
function renderCover(pen = true) {
  const cover = $('cover');
  root.style.setProperty('--ground', L.cover[0]);
  root.style.setProperty('--on', L.cover[1]);
  root.style.setProperty('--on-soft', L.cover[2]);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', L.cover[0]);
  const box = $('name-ink');
  const units = L.script.compose([{ segs: L.nameSegs }], null);
  const probe = layout(L.script, units, { size: 100 });
  const maxW = Math.min(box.clientWidth || cover.clientWidth - 40, 1100) * 0.94;
  const maxH = bare ? 250 : Math.max(150, Math.min(innerHeight * 0.4, 420));
  const size = Math.max(30, Math.min(200, 100 * Math.min(maxW / (probe.w + 68), maxH / (probe.h + 68))));
  nameInk = makeInk(L, units, { size, color: L.cover[1], label: `${L.name}, written in its own script` });
  box.replaceChildren(nameInk.canvas);
  const penMs = pen ? write(nameInk, 'all', 62) : 0;      // the name is written slowly enough to watch
  root.style.setProperty('--pen', `${Math.round(penMs)}ms`);
  $('name').replaceChildren(L.name, h('span', { class: 'ipa' }, `/${L.ph.ipa(L.nameSegs)}/`));
  $('means').textContent = L.nameMeans ? `The name means “${L.nameMeans}”.` : 'The name means nothing else.';
  $('facts').replaceChildren(...L.facts.map((f) => h('span', {}, f)));
  const num = $('num');
  num.textContent = `No. ${L.seed.toLocaleString('en-US')}`;
  num.href = `#${L.seed}`;
  num.title = 'This address brings the same language back';
  num.hidden = false;
  $('next').hidden = false;
  // along the foot of the cover, the short text in small letters
  const text = [];
  TALE.forEach((sentence, i) => { const out = L.say(sentence); const u = L.script.compose(out.words, out.end); if (i) u[0].space = 0.9; text.push(...u); });
  const down = L.script.dir === 'down';
  if (down) $('frieze').replaceChildren();
  else {
    // one line of it, wider than the cover, so it runs off both edges
    const track = h('div', { class: 'track' + (L.script.dir === 'rtl' ? ' back' : '') }, makeInk(L, text, { size: 20, color: L.cover[2] }).canvas);
    $('frieze').replaceChildren(track);
  }
  document.title = `${L.name} · A language nobody speaks · Mahir Yavuz`;
}

// ---------------------------------------------------------------- one sentence
const partKey = (language, p) => `${p.role}|${p.gloss}|${rom(language, p.segs)}`;
let sayInk = null;
function renderSay(mode = 'all') {
  const out = L.say(S);
  // what is new since the sentence was last said: those parts go in red
  const hotParts = new Set();
  if (lastOut && mode !== 'all') {
    const had = new Map();
    for (const w of lastOut.words) for (const p of w.parts) had.set(partKey(L, p), (had.get(partKey(L, p)) || 0) + 1);
    for (const w of out.words) for (const p of w.parts) {
      const k = partKey(L, p);
      if (had.get(k)) had.set(k, had.get(k) - 1); else hotParts.add(p);
      if (p.moved && why === 'ask') hotParts.add(p);
    }
    if (lastOut.end !== out.end) hotParts.add('end');
  }
  const words = out.words.map((w) => ({ segs: w.segs, roles: w.parts.flatMap((p) => p.segs.map(() => (hotParts.has(p) ? 'hot' : ''))) }));
  const body = $('say-body');
  const boxW = Math.min(body.clientWidth || 600, 900);
  const down = L.script.dir === 'down';
  const size = down ? Math.max(28, Math.min(40, boxW / 16)) : Math.max(27, Math.min(42, boxW / 17));
  const units = L.script.compose(words, out.end);
  if (hotParts.has('end')) for (const s of units[units.length - 1].cells[0].s) s.roles = ['hot'];
  // a long sentence in a wide script is set smaller, so it stays within two lines where it can
  let inkSize = size;
  const fits = (sz) => { const probe = layout(L.script, units, { size: sz, max: down ? sz * 8.5 : boxW - sz * 0.7 }); return down ? probe.w <= boxW : probe.lines <= 2; };
  while (inkSize > 24 && !fits(inkSize)) inkSize *= 0.88;
  sayInk = makeInk(L, units, { size: inkSize, max: down ? inkSize * 8.5 : boxW - inkSize * 0.7, label: `“${plain(S)}” written in ${L.name}` });

  const en = h('p', { class: 'en' }, english(S).map((piece) => (piece.chip
    ? h('button', { type: 'button', class: 'chip', 'aria-expanded': open === piece.chip ? 'true' : 'false', onclick: () => { open = open === piece.chip ? null : piece.chip; renderSay('keep'); } }, piece.t)
    : piece.t)));

  const seg = (label, options, value, set) => h('div', { class: 'seg', role: 'group', 'aria-label': label }, options.map(([v, text]) => h('button', { type: 'button', 'aria-pressed': String(v === value), onclick: () => { if (v !== value) set(v); } }, text)));
  const change = (note, fn) => { lastOut = L.say(S); fn(); why = note; renderSay('hot'); renderTrail(); };
  const switches = h('div', { class: 'switches' },
    seg('When', [['past', 'Before'], ['now', 'Now'], ['later', 'Later']], S.time, (v) => change('time', () => { S.time = v; })),
    h('button', { type: 'button', class: 'tog', 'aria-pressed': String(S.not), onclick: () => change('not', () => { S.not = !S.not; }) }, 'Not'),
    h('button', { type: 'button', class: 'tog', 'aria-pressed': String(S.ask), onclick: () => change('ask', () => { S.ask = !S.ask; }) }, 'Asked'),
    L.G.evid && !S.ask ? seg('How the speaker knows', [['seen', 'Seen'], ['heard', 'Only heard']], S.src, (v) => change('src', () => { S.src = v; })) : null,
    L.G.clus && S.subj.pron === '1PL' ? seg('Which we', [[true, 'We, with you'], [false, 'We, without you']], S.subj.incl !== false, (v) => change('we', () => { S.subj.incl = v; })) : null,
    hearButton(() => [L.say(S)], () => $('say-body').querySelectorAll('.inter .w')),
  );

  // the part being changed
  let panel = null;
  if (open) {
    const rows = [];
    const row = (label, options, value, set) => rows.push(h('div', { class: 'row' }, h('span', { class: 'lab' }, label), seg(label, options, value, set)));
    if (open === 'verb') {
      row('Does what', VERB_LIST.map((v) => [v, VERBS[v][0]]), S.verb, (v) => change(VERBS[v][3] !== VERBS[S.verb][3] ? 'case' : 'order', () => { S.verb = v; }));
    } else {
      const np = S[open];
      const nouns = open === 'subj' ? SUBJECTS : open === 'rec' ? RECEIVERS : OBJECTS;
      const who = np.pron ? WHO.find((k) => PRON[k] === np.pron) : np.noun;
      const setWho = (v) => change(open === 'subj' ? 'who' : open === 'rec' ? 'to' : 'case', () => {
        const keep = { n: np.n || 1, adj: np.adj || null, def: np.def ?? true };
        S[open] = PRON[v] ? { pron: PRON[v], incl: true, ...keep } : { noun: v, ...keep };
      });
      row(open === 'subj' ? 'Who' : open === 'rec' ? 'To whom' : 'What', [...(open === 'subj' ? WHO.map((k) => [k, k]) : []), ...nouns.map((n) => [n, n])], who, setWho);
      if (!np.pron) {
        row('How many', [[1, 'one'], [2, 'two'], [3, 'many']], np.n, (v) => change('count', () => { np.n = v; }));
        row('What kind', [[null, 'any'], ...ADJ_LIST.map((a) => [a, a])], np.adj, (v) => change('adj', () => { np.adj = v; }));
        row('Which', [[true, 'the'], [false, np.n === 1 ? 'a' : 'some']], np.def, (v) => change('the', () => { np.def = v; }));
      }
    }
    panel = h('div', { class: 'panel' }, rows);
  }

  let note = L.G.notes[why] || L.G.notes.order;
  if (why === 'who' && S.subj.pron === '1PL' && L.G.notes.we) note = L.G.notes.we;
  if (why === 'src' && !L.G.notes.src) note = L.G.notes.order;
  const nothing = mode === 'hot' && !hotParts.size && lastOut && lastOut.words.length === out.words.length;
  const whyP = h('p', { class: 'why', html: (nothing ? '<b>Nothing changes.</b> ' : '') + note });

  fill(body,
    h('div', { class: 'ink-box' + (down ? ' down' : '') }, sayInk.canvas),
    interlinear(L, out, hotParts),
    en, switches, panel, whyP, glossKey([out]),
    h('div', { class: 'trail', id: 'trail' }),
  );
  renderTrail();
  if (mode === 'all') write(sayInk, 'all');
  else if (mode === 'hot') write(sayInk, 'hot');
}

function renderTrail() {
  const box = $('trail');
  if (!box) return;
  fill(box,
    h('p', { class: 'again' }, h('button', { type: 'button', class: 'next', onclick: () => next() }, 'Say it in another language')),
    trail.length ? h('p', { class: 'lab' }, 'The same sentence in the languages before this one') : null,
    trail.length ? h('ul', {}, trail.map((seed) => {
      const T = lang(seed);
      const out = T.say(S);
      return h('li', {}, h('a', { href: `#${seed}` }, T.name), h('span', { class: 'r' }, out.words.map((w) => rom(T, w.segs)).join(' ')));
    })) : null,
  );
}

// ---------------------------------------------------------------- the writing
function renderWriting() {
  const S_ = L.script;
  $('writing-notes').replaceChildren(...S_.notes.map((n) => h('p', { html: n })));
  const body = $('writing-body');
  const size = S_.dir === 'down' && S_.family !== 'joined' ? 34 : 38;
  const row = [];
  let chart;
  if (S_.chart.list) {
    chart = h('ul', { class: 'letters' }, S_.chart.list.map((x) => h('li', { class: x.mark ? 'mark' : null }, wordInk(L, x.segs, size, x.label, row), h('span', {}, x.label))));
  } else {
    chart = h('div', { class: 'grid-wrap' }, h('table', { class: 'syl' },
      h('thead', {}, h('tr', {}, h('th', {}), S_.chart.cols.map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', {}, S_.chart.rows.map((r) => h('tr', {}, h('th', { scope: 'row' }, r.label || '–'), r.cells.map((segs) => h('td', {}, wordInk(L, segs, 30, rom(L, segs), row)))))),
    ));
  }
  const out = h('div', { class: 'yours', 'aria-live': 'polite' });
  const input = h('input', { type: 'text', id: 'your-name', value: 'Mahir', maxlength: '24', autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false' });
  const show = () => {
    const segs = L.ph.borrow(input.value);
    if (!segs.length) { out.replaceChildren(h('p', { class: 'said' }, 'Type a name in Latin letters.')); return; }
    const it = makeInk(L, S_.compose([{ segs }], null), { size: Math.min(64, Math.max(34, (body.clientWidth || 400) / 9)), label: `${input.value} written in ${L.name}` });
    out.replaceChildren(it.canvas, h('p', { class: 'said', html: `In ${L.name} it is said <i>${rom(L, segs)}</i>. A sound the language lacks becomes the nearest one it has.` }));
    write(it);
  };
  input.addEventListener('input', show);
  body.replaceChildren(chart, h('div', { class: 'name-box' }, h('label', { for: 'your-name' }, 'Write a name'), input, out));
  penRow(chart, row, row.length > 40 ? 22 : 55);
  show();
}

// ---------------------------------------------------------------- the sounds
function renderSounds() {
  const { ph } = L;
  const notes = [];
  notes.push({
    CV: 'Every syllable is one consonant and one vowel, and nothing more, as in Hawaiian.',
    CVn: `A syllable may close, but only with ${[...ph.coda].map((x) => `<i>${ph.romSeg(x)}</i>`).join(', ').replace(/, ([^,]*)$/, ' or $1')}, much as Japanese allows only <i>n</i>.`,
    CVC: 'A syllable may end in a consonant.',
    CCVC: 'A syllable may open with two consonants, and may end in one.',
  }[ph.sylType] + (ph.onsetOpt ? ' A word may begin with a vowel.' : ' Every word begins with a consonant.'));
  if (ph.has('pʰ')) notes.push('Three of the stops come in a second kind, said with a puff of air: <i>ph</i>, <i>th</i>, <i>kh</i>. Hindi and Thai keep the two kinds apart too.');
  if (ph.has('pʼ')) notes.push('Three of the stops come in a second kind, said with a pop from the throat: <i>pʼ</i>, <i>tʼ</i>, <i>kʼ</i>. Georgian, Amharic and Quechua have these.');
  if (ph.harmony) notes.push('The vowels of a word are all from the front of the mouth or all from the back, and an ending changes its vowel to match. Turkish, Finnish and Hungarian do this.');
  if (ph.long) notes.push(`Vowels are short or long, and the length tells words apart, as in Finnish and Japanese. A long one is written ${ph.longStyle === 'macron' ? 'with a bar over it' : 'twice'}.`);
  if (ph.tones === 2) notes.push('Every syllable is said high or low, and the pitch tells words apart, as in Navajo. An accent marks a high one.');
  if (ph.tones === 3) notes.push('Every syllable is said high, middle or low, and the pitch tells words apart. The accents are the ones Yoruba uses: <i>á</i> high, <i>à</i> low, <i>a</i> in between.');
  if (!ph.tones) notes.push(`The stress falls on the ${ph.stress} syllable of a word, ${{ first: 'as in Finnish, Hungarian and Czech', 'next to last': 'as in Polish and Swahili', last: 'as it mostly does in Turkish' }[ph.stress]}.`);
  $('sounds-notes').replaceChildren(...notes.map((n) => h('p', { html: n })));
  const chart = consonantChart(ph);
  const cell = (list) => list.map((x) => h('span', { class: 'ph' }, h('b', {}, ph.romSeg(x)), ph.romSeg(x) !== x ? h('small', {}, x) : null));
  fill($('sounds-body'),
    h('div', { class: 'grid-wrap' }, h('table', { class: 'cons' },
      h('caption', {}, `${ph.cons.length} consonants`),
      h('thead', {}, h('tr', {}, h('th', {}), chart.cols.map((c) => h('th', { scope: 'col' }, c)))),
      h('tbody', {}, chart.rows.map((r) => h('tr', {}, h('th', { scope: 'row' }, r.label), r.cells.map((list) => h('td', {}, cell(list)))))),
    )),
    h('p', { class: 'vowels' }, h('span', { class: 'cap' }, `${ph.vowels.length} vowels`), cell(ph.vowels)),
    h('p', { class: 'fine' }, 'Each sound is shown as this page spells it, with its symbol in the International Phonetic Alphabet where that differs.'),
  );
}

// ---------------------------------------------------------------- the words
const GROUPS = [
  ['People', ['person', 'woman', 'man', 'child', 'mother', 'father', 'friend', 'stranger', 'fisherman']],
  ['Living things', ['dog', 'bird', 'fish', 'tree']],
  ['The world', ['sun', 'moon', 'star', 'sky', 'earth', 'mountain', 'river', 'sea', 'water', 'fire', 'rain', 'snow', 'wind', 'cloud', 'stone', 'ice', 'dew', 'wave', 'thunder', 'lightning', 'volcano']],
  ['Things', ['house', 'door', 'boat', 'road', 'bread', 'salt', 'milk', 'writing']],
  ['The body', ['eye', 'hand', 'mouth', 'heart', 'tear']],
  ['Saying and time', ['word', 'name', 'day', 'night']],
  ['Doing', Object.keys(VERBS)],
  ['Describing', ['big', 'small', 'good', 'old', 'new', 'long', 'cold', 'red', 'white', 'black']],
];
function renderWords() {
  const { lex } = L.words;
  const made = Object.entries(lex).filter(([, e]) => e.parts);
  const small = L.script.dir === 'down' && L.script.family !== 'joined' ? 22 : 24;
  const madeRow = []; const rootRow = [];
  const madeList = h('ul', { class: 'made' + (L.script.dir === 'down' ? ' down' : '') }, made.map(([id, e]) => {
    const real = REAL[e.parts.join('+')];
    return h('li', {},
      wordInk(L, e.segs, 32, rom(L, e.segs), madeRow),
      h('p', {}, h('i', {}, rom(L, e.segs)), ' ', h('b', {}, id), h('span', { class: 'lit' }, `“${e.order.join('-')}”: ${e.order.map((p) => rom(L, lex[p].segs)).join(' + ')}`), real ? h('span', { class: 'real' }, real + '.') : null),
    );
  }));
  const rootItem = (id, row = null) => h('li', {}, wordInk(L, lex[id].segs, small, rom(L, lex[id].segs), row), h('span', {}, h('i', {}, rom(L, lex[id].segs)), ' ', id in VERBS ? `to ${id}` : id));
  const first = ['person', 'water', 'fire', 'eye', 'hand', 'house', 'word', 'night', 'see', 'give', 'big', 'good'].filter((id) => !lex[id].parts);
  const groups = GROUPS.map(([label, ids]) => {
    const roots = ids.filter((id) => lex[id] && !lex[id].parts);
    return roots.length ? h('div', { class: 'group' }, h('h3', {}, label), h('ul', { class: 'roots' }, roots.map((id) => rootItem(id)))) : null;
  });
  const rootList = h('ul', { class: 'roots' }, first.map((id) => rootItem(id, rootRow)));
  const count = GROUPS.reduce((a, [, ids]) => a + ids.filter((id) => lex[id] && !lex[id].parts).length, 0);
  fill($('words-body'),
    made.length ? h('h3', {}, `Built from two words (${made.length})`) : null, made.length ? madeList : null,
    h('p', { class: 'fine', html: `A built word puts ${L.G.headFinal ? 'what it is last, as English does in “fisherman”' : 'what it is first, as French does in <i>pomme de terre</i> and Thai and Indonesian do throughout'}.` }),
    h('h3', {}, 'Roots'), rootList,
    h('details', { class: 'all' }, h('summary', {}, `All ${count} roots`), groups),
  );
  penRow(madeList, madeRow, 110);
  penRow(rootList, rootRow, 70);
}

// ---------------------------------------------------------------- counting
function renderCounting() {
  const { num, numLit, numSystem, handFive, scoreIsPerson } = L.words;
  const notes = [];
  notes.push({
    ten: 'Ten numbers, each with a root of its own, as in most languages.',
    five: 'Counting goes by fives: six is five and one, seven is five and two. Khmer and Wolof count like this.',
    'take away': 'Eight and nine are counted back from ten: “two from ten”, “one from ten”. Ainu does this, and Finnish <i>kahdeksan</i> and <i>yhdeksän</i> began the same way.',
  }[numSystem]);
  if (handFive) notes.push('Five is the word for “hand”, as <i>lima</i> is in Hawaiian and Malay.');
  if (scoreIsPerson) notes.push('Twenty is “one person”, all the fingers and toes. In Kʼicheʼ Maya <i>winaq</i> means both.');
  $('counting-notes').replaceChildren(...notes.map((n) => h('p', { html: n })));
  const twenty = L.twenty;
  const row = [];
  const twentyInk = makeInk(L, L.script.compose(twenty.map((segs) => ({ segs })), null), { size: 26, label: 'twenty' });
  fill($('counting-body'),
    h('ol', { class: 'nums' }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => h('li', {}, h('span', { class: 'n' }, String(n)), wordInk(L, num[n], 26, rom(L, num[n]), row), h('i', {}, rom(L, num[n])), numLit[n] ? h('small', {}, numLit[n]) : null))),
    h('p', { class: 'twenty' }, h('span', { class: 'n' }, '20'), twentyInk.canvas, h('i', {}, twenty.map((segs) => rom(L, segs)).join(' ')), h('small', {}, L.words.twenty.lit)),
  );
  row.push(twentyInk);
  penRow($('counting-body'), row, 190);
}

// ---------------------------------------------------------------- a short text
let taleInk = null;
function renderTale(mode = 'seen') {
  const outs = TALE.map((s) => L.say(s));
  const units = [];
  outs.forEach((out, i) => {
    const u = L.script.compose(out.words, out.end);
    if (i) u[0].space = L.script.sep === 'none' ? 0.5 : 0.9;
    units.push(...u);
  });
  const body = $('tale-body');
  const boxW = Math.min(body.clientWidth || 600, 860);
  const down = L.script.dir === 'down';
  const size = down ? 28 : Math.max(24, Math.min(34, boxW / 18));
  taleInk = makeInk(L, units, { size, max: down ? size * 10.5 : boxW - size * 0.7, label: `The short text written in ${L.name}` });
  fill(body,
    h('div', { class: 'ink-box page' + (down ? ' down' : '') }, taleInk.canvas),
    h('p', { class: 'hear-row' }, hearButton(() => outs, (i) => body.querySelectorAll(`.lines li:nth-child(${i + 1}) .w`))),
    h('ol', { class: 'lines' }, outs.map((out, i) => h('li', {}, interlinear(L, out), h('p', { class: 'tr' }, plain(TALE[i]))))),
    glossKey(outs),
  );
  // written by the pen when it comes into view
  if (mode === 'seen' && watcher) { const it = taleInk; it.draw(0, 0); whenSeen(body, () => write(it)); }
}

// ---------------------------------------------------------------- the grammar, in one place
function renderGrammar() {
  const n = L.G.notes;
  const rows = [['Order', n.order], ['Who did what', n.case], ['Who receives', n.to], ['How many', n.count], ['The and a', n.the], ['Who, on the verb', n.who], ['When', n.time], ['Not', n.not], ['Asking', n.ask], ['Describing', n.adj], ['How the speaker knows', n.src], ['We', n.we]];
  $('grammar-body').replaceChildren(h('dl', { class: 'rules' }, rows.filter(([, text]) => text).map(([label, text]) => h('div', {}, h('dt', {}, label), h('dd', { html: text })))));
}

// ---------------------------------------------------------------- turning to a language
function show(seed, { pen = true } = {}) {
  const from = L;
  L = lang(clampSeed(seed));
  if (from && from.seed !== L.seed) {
    const i = trail.indexOf(L.seed);
    if (i >= 0) trail.splice(i, 1);
    trail.unshift(from.seed);
    trail.length = Math.min(trail.length, 5);
  }
  lastOut = null; why = 'order';
  hush();
  if (S.subj.pron === '1PL' && S.subj.incl === undefined) S.subj.incl = true;
  renderCover(pen);
  // the cover's lines arrive one after another, behind the pen
  if (pen && !still) { root.classList.remove('arrive'); void root.offsetWidth; root.classList.add('arrive'); }
  if (bare) { root.dataset.ready = '1'; return; }
  renderSay(pen ? 'all' : 'keep');
  renderWriting();
  renderSounds();
  renderWords();
  renderCounting();
  renderTale();
  renderGrammar();
  if (watcher) document.querySelectorAll('.sec').forEach((el) => watcher.observe(el));
  root.dataset.ready = '1';
}
function next() {
  if (!still) root.classList.add('turning');
  let seed;
  do { seed = 1 + Math.floor(Math.random() * MAX); } while (L && seed === L.seed);
  history.pushState(null, '', `#${seed}`);
  show(seed);
}
const fromAddress = () => { const m = /(\d+)/.exec(location.hash) || /(\d+)/.exec(q.get('seed') || ''); return m ? clampSeed(+m[1]) : null; };

$('next').addEventListener('click', next);
addEventListener('hashchange', () => { const s = fromAddress(); if (s && (!L || s !== L.seed)) show(s); });
addEventListener('popstate', () => { const s = fromAddress(); if (s && (!L || s !== L.seed)) show(s); });
let resizeTimer = 0; let lastW = innerWidth;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (innerWidth === lastW || !L) return; lastW = innerWidth; renderCover(false); if (!bare) { renderSay('keep'); renderTale('full'); } }, 180);
});
const first = fromAddress() ?? 1 + Math.floor(Math.random() * MAX);
if (!location.hash) history.replaceState(null, '', `${location.pathname}${location.search}#${first}`);
// wait for the type, but not for long: the cover is already in its color
let started = false;
const start = () => { if (!started) { started = true; show(first); } };
if (document.fonts && document.fonts.ready) { document.fonts.ready.then(start, start); setTimeout(start, 900); } else start();
