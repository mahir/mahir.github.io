// _static.js: node works/020/_static.js
// Writes one language into index.html in Latin letters, between the <!-- gen:… --> markers, for
// readers without scripts (search engines and AI assistants among them). With scripts the page
// replaces all of it with a language of its own. Run it again after changing how languages are made.
import { readFileSync, writeFileSync } from 'node:fs';
import { makeLanguage, consonantChart } from './language.js';
import { START, TALE, plain } from './english.js';

const SEED = 15;          // the language on the share image
const L = makeLanguage(SEED);
const { ph } = L;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const romLine = (out) => out.words.map((w) => w.parts.map((p, i) => (i ? (p.join || '-') : '') + ph.rom(p.segs)).join('')).join(' ');
const glossLine = (out) => out.words.map((w) => w.parts.map((p, i) => (i ? (p.join || '-') : '') + p.gloss).join('')).join(' ');
const sentence = (S) => { const out = L.say(S); return `<p><i>${esc(romLine(out))}</i><br><small>${esc(glossLine(out))}</small> ${esc(plain(S))}</p>`; };
const n = L.G.notes;
const made = Object.entries(L.words.lex).filter(([, e]) => e.parts);

const parts = {
  cover: `
    <p class="name" id="name">${esc(L.name)}<span class="ipa">/${esc(ph.ipa(L.nameSegs))}/</span></p>
    <p class="means" id="means">${L.nameMeans ? `The name means “${esc(L.nameMeans)}”.` : 'The name means nothing else.'}</p>
    <p class="facts" id="facts">${L.facts.map((f) => `<span>${esc(f)}</span>`).join(' ')} <span>No. ${SEED}, one of 99,999</span></p>
    `,
  say: `
      <div class="plain-lines">${sentence(START)}${sentence({ ...START, not: true })}${sentence({ ...START, ask: true })}</div>
      <p class="why">${n.order} ${n.not} ${n.ask}</p>
      `,
  words: `
      <ul class="plain-list">${made.map(([id, e]) => `<li><i>${esc(ph.rom(e.segs))}</i> ${id}, “${e.order.join('-')}”</li>`).join('')}</ul>
      `,
  counting: `
      <ol class="plain-list">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => `<li><i>${esc(ph.rom(L.words.num[k]))}</i>${L.words.numLit[k] ? ` (${L.words.numLit[k]})` : ''}</li>`).join('')}</ol>
      `,
  tale: `
      <div class="plain-lines">${TALE.map(sentence).join('')}</div>
      `,
  sounds: `
      <p>${ph.cons.length} consonants: ${ph.cons.map((c) => `<i>${esc(ph.romSeg(c))}</i>`).join(' ')}. ${ph.vowels.length} vowels: ${ph.vowels.map((v) => `<i>${esc(ph.romSeg(v))}</i>`).join(' ')}.</p>
      `,
  grammar: `
      <dl class="rules">${[['Order', n.order], ['Who did what', n.case], ['Who receives', n.to], ['How many', n.count], ['The and a', n.the], ['Who, on the verb', n.who], ['When', n.time], ['Not', n.not], ['Asking', n.ask], ['Describing', n.adj], ['How the speaker knows', n.src], ['We', n.we]].filter(([, t]) => t).map(([k, t]) => `<div><dt>${k}</dt><dd>${t}</dd></div>`).join('')}</dl>
      `,
};
void consonantChart;

const file = new URL('./index.html', import.meta.url);
let html = readFileSync(file, 'utf8');
for (const [name, text] of Object.entries(parts)) {
  const re = new RegExp(`(<!-- gen:${name} -->)[\\s\\S]*?(<!-- /gen:${name} -->)`);
  if (!re.test(html)) throw new Error(`no marker for ${name}`);
  html = html.replace(re, (_, a, b) => `${a}${text}${b}`);
}
writeFileSync(file, html);
console.log(`wrote ${L.name} (No. ${SEED}) into index.html: ${romLine(L.say(START))}`);
