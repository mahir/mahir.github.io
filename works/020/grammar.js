// grammar.js: how one language puts a sentence together. makeGrammar draws the choices (the order
// of the words, what is an ending and what is a word of its own, what gets marked at all), and
// realize() turns a meaning into words, each word a list of parts with a gloss for every part.
//
// Every choice here is one some real language makes. The notes say which.

import { NOUNS, VERBS } from './words.js';

export const GLOSS_KEY = {
  PL: 'more than one', DU: 'exactly two', ACC: 'the thing acted on', ERG: 'the doer', DAT: 'the receiver', DEF: 'the',
  PST: 'past', PRS: 'present', FUT: 'future', NPST: 'not past', NEG: 'not', Q: 'question', REP: 'so it is said',
  '1SG': 'I', '2SG': 'you', '3SG': 'he, she, it', '1PL': 'we', '2PL': 'you all', '3PL': 'they',
  '1PL.INCL': 'we, you included', '1PL.EXCL': 'we, but not you',
};

export function makeGrammar(r, ph) {
  // ---------------------------------------------------------------- the choices
  const order = r.weighted([['SOV', 0.42], ['SVO', 0.38], ['VSO', 0.11], ['VOS', 0.05], ['OVS', 0.04]]);
  const OV = order === 'SOV' || order === 'OVS';
  const verbFirst = order[0] === 'V';
  // how words are built: with endings, with beginnings, with separate small words, or a mix
  const build = r.weighted([['endings', OV ? 0.52 : 0.28], ['beginnings', OV ? 0.04 : 0.2], ['words', (OV ? 0.14 : 0.32) * (ph.tones ? 2.2 : 1)], ['mixed', 0.24]]);
  const exp = (wordOk = true) => (build === 'endings' ? (wordOk && r.chance(0.1) ? 'word' : 'suffix')
    : build === 'beginnings' ? (wordOk && r.chance(0.12) ? 'word' : 'prefix')
    : build === 'words' ? 'word'
    : r.weighted([['suffix', 0.5], ['prefix', 0.22], ['word', wordOk ? 0.28 : 0]]));

  const seen = new Set();
  const mk = (kind) => {
    let a;
    for (let i = 0; i < 40; i++) { a = ph.affix(r, kind); const key = ph.rom(a); if (!seen.has(key)) { seen.add(key); return a; } }
    return a;
  };
  const form = (type) => mk(type === 'word' ? 'word' : type);

  const adp = r.chance(OV ? 0.9 : 0.1) ? 'post' : 'pre';
  const headFinal = r.chance(OV ? 0.82 : 0.5);
  const adjOrder = r.chance(OV ? 0.65 : 0.35) ? 'AN' : 'NA';
  const numOrder = r.chance(0.68) ? 'NumN' : 'NNum';

  const align = r.weighted([['none', build === 'words' ? 0.6 : OV ? 0.2 : verbFirst ? 0.35 : 0.5], ['acc', OV ? 0.55 : 0.35], ['erg', OV ? 0.25 : 0.13]]);
  let caseType = exp();
  if (caseType === 'prefix' && r.chance(0.6)) caseType = 'word';
  const kase = {
    align, type: caseType, dom: align === 'acc' && r.chance(0.35),
    acc: align === 'acc' ? form(caseType) : null,
    erg: align === 'erg' ? form(caseType) : null,
  };
  const datType = align !== 'none' ? caseType : (build === 'endings' && r.chance(0.5) ? 'suffix' : 'word');
  kase.datType = datType;
  kase.dat = form(datType);

  const numSys = r.weighted([['none', build === 'words' ? 0.5 : 0.15], ['pl', 0.62], ['du', build === 'words' ? 0 : 0.2]]);
  let numType = r.chance(0.1) ? 'redup' : exp();
  const num = {
    sys: numSys, type: numType, withNum: r.pick(['keep', 'drop']), animOnly: numSys !== 'none' && r.chance(0.15),
    wordPos: r.pick(['before', 'after']),
    pl: numSys !== 'none' && numType !== 'redup' ? form(numType) : null,
    du: numSys === 'du' ? form(numType === 'redup' ? 'suffix' : numType) : null,
  };
  if (num.sys === 'du' && numType === 'redup') num.duType = 'suffix';

  const defKind = r.weighted([['none', 0.55], ['word', 0.25], ['affix', build === 'words' ? 0 : 0.2]]);
  const def = {
    type: defKind === 'affix' ? (build === 'beginnings' || (build === 'mixed' && r.chance(0.3)) ? 'prefix' : 'suffix') : defKind,
    pos: r.chance(OV ? 0.45 : 0.75) ? 'before' : 'after',
    one: r.chance(defKind === 'none' ? 0.15 : 0.3),
  };
  def.form = def.type === 'none' ? null : form(def.type);

  const agrType = build === 'words' ? 'none' : r.weighted([['none', 0.35], ['suffix', build === 'beginnings' ? 0.08 : 0.45], ['prefix', build === 'endings' ? 0.06 : 0.3]]);
  const agr = { type: agrType, forms: {}, drop: agrType !== 'none' && r.chance(0.7) };
  if (agrType !== 'none') {
    for (const p of ['1SG', '2SG', '3SG', '1PL', '2PL', '3PL']) agr.forms[p] = p === '3SG' && r.chance(0.6) ? null : mk(agrType);
  }

  const tenseSys = r.weighted([['three', 0.5], ['past', 0.3], ['none', build === 'words' ? 0.45 : 0.1]]);
  const tenseType = exp();
  const tense = { sys: tenseSys, type: tenseType, pos: r.chance(OV ? 0.3 : 0.8) ? 'before' : 'after', forms: {} };
  if (tenseSys === 'three') {
    tense.forms.PST = form(tenseType);
    tense.forms.PRS = r.chance(0.75) ? null : form(tenseType);
    tense.forms.FUT = form(tenseType);
  } else if (tenseSys === 'past') {
    tense.forms.PST = form(tenseType);
    tense.forms.NPST = r.chance(0.75) ? null : form(tenseType);
  } else {
    tense.earlier = mk('word');
    tense.later = mk('word');
  }

  const negType = build === 'words' ? r.weighted([['pre', 0.65], ['post', 0.2], ['circum', 0.15]])
    : build === 'endings' ? r.weighted([['suffix', 0.5], ['pre', 0.22], ['aux', agrType === 'suffix' ? 0.18 : 0], ['post', 0.12]])
    : build === 'beginnings' ? r.weighted([['prefix', 0.6], ['pre', 0.28], ['circum', 0.12]])
    : r.weighted([['suffix', 0.25], ['prefix', 0.15], ['pre', 0.3], ['post', 0.1], ['circum', 0.1], ['aux', agrType !== 'none' ? 0.1 : 0]]);
  const neg = { type: negType, outer: r.chance(0.5) };
  neg.form = form(negType === 'suffix' ? 'suffix' : negType === 'prefix' ? 'prefix' : 'word');
  if (negType === 'circum') neg.form2 = mk('word');
  if (negType === 'aux') neg.form = ph.root(r, 1);

  const qType = r.weighted([['final', 0.34], ['initial', 0.14], ['suffix', build === 'words' ? 0 : 0.2], ['voice', 0.2], ['front', order === 'SVO' || order === 'SOV' ? 0.12 : 0]]);
  const q = { type: qType, form: qType === 'final' || qType === 'initial' ? mk('word') : qType === 'suffix' ? mk('suffix') : null };

  let evid = null;
  if (r.chance(0.2)) {
    const type = build === 'endings' || (build === 'mixed' && r.chance(0.5)) ? 'suffix' : 'word';
    evid = { type, form: form(type) };
  }

  // ---------------------------------------------------------------- the words for I, you, we
  const short = () => { let a; for (let i = 0; i < 40; i++) { a = ph.root(r, r.chance(0.75) ? 1 : 2); const key = ph.rom(a); if (!seen.has(key)) { seen.add(key); return a; } } return a; };
  const pron = { '1SG': [short()], '2SG': [short()], '3SG': [short()] };
  const builtPlural = numSys !== 'none' && (numType === 'suffix' || numType === 'prefix') && r.chance(0.4);
  for (const p of ['1', '2', '3']) {
    if (builtPlural) {
      const s = pron[p + 'SG'][0];
      pron[p + 'PL'] = numType === 'suffix' ? [s, ph.attachSuffix(s, num.pl)] : [ph.attachPrefix(num.pl, s), s];
    } else pron[p + 'PL'] = [short()];
  }
  const clus = r.chance(0.2);
  let inclBuilt = false;
  if (clus) {
    pron['1PL.EXCL'] = pron['1PL'];
    inclBuilt = r.chance(0.4);
    pron['1PL.INCL'] = inclBuilt ? [pron['1SG'][0], ph.weld(pron['1SG'][0], pron['2SG'][0]).slice(pron['1SG'][0].length)] : [short()];
  }

  const G = { order, OV, build, adp, headFinal, adjOrder, numOrder, kase, num, def, agr, tense, neg, q, evid, clus, pron, builtPlural, inclBuilt, reserved: [...seen] };

  // ---------------------------------------------------------------- putting a sentence together
  const W = (segs, gloss, role) => ({ parts: [{ segs: segs.slice(), gloss, role }] });
  const all = (w) => w.parts.flatMap((p) => p.segs);
  const suf = (w, aff, gloss, role) => { w.parts.push({ segs: ph.attachSuffix(all(w), aff), gloss, role, join: '-' }); return w; };
  const pre = (w, aff, gloss, role) => { const p = ph.attachPrefix(aff, all(w)); w.parts[0].join = '-'; w.parts.unshift({ segs: p, gloss, role }); return w; };
  const add = (w, type, aff, gloss, role) => (type === 'suffix' ? suf(w, aff, gloss, role) : pre(w, aff, gloss, role));

  // a noun or pronoun with everything that goes around it. `kase` is 'ACC', 'ERG', 'DAT' or ''.
  function phrase(lang, spec, role, kaseName) {
    const { lex, num: numerals } = lang.words;
    const words = [];
    let head;
    if (spec.pron) {
      const key = spec.pron === '1PL' && clus ? (spec.incl ? '1PL.INCL' : '1PL.EXCL') : spec.pron;
      const forms = pron[key];
      const built = forms.length > 1;
      if (!built) head = W(forms[0], key, role);
      else if (key === '1PL.INCL') head = { parts: [{ segs: forms[0].slice(), gloss: '1SG', role }, { segs: forms[1].slice(), gloss: '2SG', role, join: '-' }] };
      else if (numType === 'suffix') head = { parts: [{ segs: forms[0].slice(), gloss: key[0] + 'SG', role }, { segs: forms[1].slice(), gloss: 'PL', role, join: '-' }] };
      else head = { parts: [{ segs: forms[0].slice(), gloss: 'PL', role }, { segs: forms[1].slice(), gloss: key[0] + 'SG', role, join: '-' }] };
      words.push(head);
    } else {
      const noun = NOUNS[spec.noun];
      head = W(lex[spec.noun].segs, noun[0], role);
      const counted = num.sys !== 'none' && (!num.animOnly || noun[2]);
      let mark = '';
      if (spec.n > 1 && counted) {
        if (spec.n === 2 && num.sys === 'du') mark = 'DU';
        else if (spec.n === 2 && num.withNum === 'drop') mark = '';
        else mark = 'PL';
      }
      let plWord = null;
      if (mark === 'DU') {
        const t = num.duType || num.type;
        if (t === 'word') plWord = W(num.du, 'DU', role + '.n'); else add(head, t, num.du, 'DU', role + '.n');
      } else if (mark === 'PL') {
        if (num.type === 'redup') {
          const stem = all(head);
          const joined = ph.weld(stem, stem);
          head.parts.push({ segs: joined.slice(stem.length), gloss: 'PL', role: role + '.n', join: '~' });
        } else if (num.type === 'word') plWord = W(num.pl, 'PL', role + '.n');
        else add(head, num.type, num.pl, 'PL', role + '.n');
      }
      if (spec.def && (def.type === 'suffix' || def.type === 'prefix')) add(head, def.type, def.form, 'DEF', role + '.d');
      let core = [head];
      if (spec.adj) { const a = W(lex[spec.adj].segs, spec.adj, role + '.a'); core = adjOrder === 'AN' ? [a, head] : [head, a]; }
      if (plWord) core = num.wordPos === 'before' ? [plWord, ...core] : [...core, plWord];
      let count = null;
      if (spec.n === 2 && mark !== 'DU') count = W(numerals[2], 'two', role + '.n');
      else if (spec.n === 1 && !spec.def && def.one) count = W(numerals[1], 'one', role + '.d');
      if (count) core = numOrder === 'NumN' ? [count, ...core] : [...core, count];
      if (spec.def && def.type === 'word') { const d = W(def.form, 'DEF', role + '.d'); core = def.pos === 'before' ? [d, ...core] : [...core, d]; }
      words.push(...core);
    }
    if (kaseName) {
      const type = kaseName === 'DAT' ? kase.datType : kase.type;
      const f = kaseName === 'DAT' ? kase.dat : kaseName === 'ACC' ? kase.acc : kase.erg;
      if (type === 'word') { const k = W(f, kaseName, role + '.c'); if (adp === 'pre') words.unshift(k); else words.push(k); }
      else add(head, type, f, kaseName, role + '.c');
    }
    return words;
  }

  function realize(lang, S) {
    const { lex } = lang.words;
    const valency = VERBS[S.verb][3];
    const subj = S.subj;
    const person = subj.pron || (subj.n > 1 ? '3PL' : '3SG');

    // the verb and what clings to it
    const v = W(lex[S.verb].segs, VERBS[S.verb][0], 'verb');
    let aux = null;
    if (S.not && neg.type === 'aux') aux = W(neg.form, 'NEG', 'not');
    const host = aux || v;
    const before = []; const after = [];
    if (S.not && neg.type === 'suffix') suf(v, neg.form, 'NEG', 'not');
    if (S.not && neg.type === 'prefix') pre(v, neg.form, 'NEG', 'not');
    let tGloss = '';
    if (tense.sys === 'three') tGloss = { past: 'PST', now: 'PRS', later: 'FUT' }[S.time];
    if (tense.sys === 'past') tGloss = S.time === 'past' ? 'PST' : 'NPST';
    const tForm = tGloss ? tense.forms[tGloss] : null;
    let tWord = null;
    if (tForm) {
      if (tense.type === 'word') tWord = W(tForm, tGloss, 'time');
      else add(host, tense.type, tForm, tGloss, 'time');
    }
    const told = evid && S.src === 'heard' && !S.ask;
    let eWord = null;
    if (told) { if (evid.type === 'suffix') suf(host, evid.form, 'REP', 'src'); else eWord = W(evid.form, 'REP', 'src'); }
    if (agr.type !== 'none' && agr.forms[person]) add(host, agr.type, agr.forms[person], person, 'subj.agr');
    if (S.ask && q.type === 'suffix') suf(host, q.form, 'Q', 'ask');
    if (tWord) (tense.pos === 'before' ? before : after).push(tWord);
    if (S.not && (neg.type === 'pre' || neg.type === 'circum')) { const n = W(neg.form, 'NEG', 'not'); if (neg.outer) before.unshift(n); else before.push(n); }
    if (S.not && neg.type === 'post') { const n = W(neg.form, 'NEG', 'not'); if (neg.outer) after.push(n); else after.unshift(n); }
    if (S.not && neg.type === 'circum') after.push(W(neg.form2, 'NEG', 'not'));
    if (eWord) after.push(eWord);
    const core = aux ? (OV ? [v, aux] : [aux, v]) : [v];
    const Vg = [...before, ...core, ...after];

    // who, what, to whom
    const dropped = !!subj.pron && agr.drop;
    const Sg = dropped ? [] : phrase(lang, subj, 'subj', valency >= 2 && kase.align === 'erg' ? 'ERG' : '');
    const Og = valency >= 2 ? phrase(lang, S.obj, 'obj', kase.align === 'acc' && (!kase.dom || S.obj.def || S.obj.pron) ? 'ACC' : '') : [];
    const Rg = valency === 3 ? phrase(lang, S.rec, 'rec', 'DAT') : [];

    let seq = { SOV: [Sg, Rg, Og, Vg], SVO: [Sg, Vg, Og, Rg], VSO: [Vg, Sg, Og, Rg], VOS: [Vg, Og, Rg, Sg], OVS: [Og, Rg, Vg, Sg] }[order];
    let moved = false;
    if (S.ask && q.type === 'front') { seq = [Vg, ...seq.filter((x) => x !== Vg)]; moved = true; }
    const words = seq.flat();
    if (moved) for (const w of Vg) for (const p of w.parts) p.moved = true;
    if (tense.sys === 'none' && S.time !== 'now') words.unshift(W(S.time === 'past' ? tense.earlier : tense.later, S.time === 'past' ? 'earlier' : 'later', 'time'));
    if (S.ask && q.type === 'final') words.push(W(q.form, 'Q', 'ask'));
    if (S.ask && q.type === 'initial') words.unshift(W(q.form, 'Q', 'ask'));
    for (const w of words) {
      w.segs = all(w);
      w.roles = w.parts.flatMap((p) => p.segs.map(() => p.role));
    }
    return { words, end: S.ask ? 'q' : 'stop', dropped, person };
  }

  // ---------------------------------------------------------------- saying what the grammar does
  const it = (segs, type = 'word') => `<i>${type === 'suffix' ? '-' : ''}${ph.rom(segs)}${type === 'prefix' ? '-' : ''}</i>`;
  const piece = (type) => (type === 'suffix' ? 'an ending' : type === 'prefix' ? 'a beginning' : 'a word of its own');
  const notes = {};
  notes.order = {
    SOV: 'The verb comes last: who, then what, then the doing. Turkish, Japanese and Hindi do the same.',
    SVO: 'Who comes first, then the verb, then what, as in English, Mandarin and Swahili.',
    VSO: 'The verb comes first, then who, then what, as in Welsh, Irish and Classical Arabic.',
    VOS: 'The verb comes first and the doer last, as in Malagasy and Fijian.',
    OVS: 'What is acted on comes first and the doer last. Few languages do this. Hixkaryana, in Brazil, is one.',
  }[order];
  const kWhere = (type) => (type === 'word' ? (adp === 'post' ? 'followed by' : 'preceded by') : type === 'suffix' ? 'given the ending' : 'given the beginning');
  notes.case = align === 'none'
    ? 'Nothing marks who did what to whom except the order of the words, as in Mandarin and Indonesian.'
    : align === 'acc'
      ? (kase.dom
        ? `The thing acted on is ${kWhere(kase.type)} ${it(kase.acc, kase.type)}, but only when it is a particular one: “the bird”, not “a bird”. Turkish and Persian do the same.`
        : `The thing acted on is ${kWhere(kase.type)} ${it(kase.acc, kase.type)}. ${kase.type === 'word' ? 'Japanese does this with <i>o</i>.' : 'Latin, Russian and Turkish mark it too.'}`)
      : `Whoever does something to something is ${kWhere(kase.type)} ${it(kase.erg, kase.type)}. Whoever just sleeps or sings is not, and neither is the thing acted on. Basque and Tibetan work this way.`;
  notes.to = `Whoever receives is ${kWhere(kase.datType)} ${it(kase.dat, kase.datType)}${kase.datType === 'word' ? (adp === 'post' ? ': “to” comes after its noun, as in Japanese and Turkish.' : ': “to” comes before its noun, as in English.') : ', as in Turkish, Latin and Russian.'}`;
  const numNote = [];
  if (num.sys === 'none') numNote.push('Nouns do not change for number: one bird, many bird. Mandarin and Japanese are the same.');
  else {
    if (num.type === 'redup') numNote.push('More than one is said by saying the noun twice, as Indonesian says <i>orang-orang</i> for “people”.');
    else if (num.type === 'word') numNote.push(`A separate word, ${it(num.pl)}, says there is more than one, as Tagalog does with <i>mga</i>.`);
    else numNote.push(`More than one takes ${piece(num.type) === 'an ending' ? 'the ending' : 'the beginning'} ${it(num.pl, num.type)}${num.type === 'prefix' ? ', as plurals in Swahili are made at the front of the word' : ''}.`);
    if (num.sys === 'du') numNote.push(`Exactly two has its own form, ${it(num.du, num.duType || num.type)}, and no number word is needed. Slovene and Classical Arabic have one too.`);
    else numNote.push(num.withNum === 'drop' ? 'After a number the noun stays as it is, “two bird”, as in Turkish and Hungarian.' : 'It stays after a number too, as in English.');
    if (num.animOnly) numNote.push('Only people and animals are counted this way, much as Mandarin keeps <i>-men</i> for people.');
  }
  notes.count = numNote.join(' ');
  const defNote = [];
  if (def.type === 'none') defNote.push(def.one ? 'There is no word for “the”, and “a” is the word for “one”, as in Turkish.' : 'There is no word for “the” or “a”, as in Russian, Japanese and Finnish.');
  else {
    if (def.type === 'word') defNote.push(def.pos === 'before' ? `“The” is ${it(def.form)}, a word before the noun, as in English and French.` : `“The” is ${it(def.form)}, a word after the noun, as in Wolof and Yoruba.`);
    if (def.type === 'suffix') defNote.push(`“The” is the ending ${it(def.form, 'suffix')} on the noun, as in Swedish, Romanian and Basque.`);
    if (def.type === 'prefix') defNote.push(`“The” is ${it(def.form, 'prefix')}, joined to the front of the noun, as in Arabic and Hebrew.`);
    defNote.push(def.one ? '“A” is the word for “one”, as in German and French.' : 'There is no word for “a”, as in Welsh and Icelandic.');
  }
  notes.the = defNote.join(' ');
  notes.who = agr.type === 'none'
    ? 'The verb is the same whoever does it, as in Mandarin, Japanese and Swedish.'
    : `The verb carries ${agr.type === 'suffix' ? 'an ending' : 'a beginning'} for who does it${agr.drop ? ', so “I”, “you”, “we” and “they” need no word of their own' : ', and the word for who is said as well'}. ${agr.drop ? (agr.type === 'suffix' ? 'Spanish, Italian and Turkish do the same.' : 'Swahili does the same.') : (agr.type === 'suffix' ? 'German and Russian do the same.' : 'So do many languages of the Americas and Africa.')}`;
  const tWhere = tense.type === 'word' ? `a small word ${tense.pos} the verb` : tense.type === 'suffix' ? 'an ending on the verb' : 'a beginning on the verb';
  notes.time = tense.sys === 'none'
    ? `The verb has no tenses. A word for “earlier” (${it(tense.earlier)}) or “later” (${it(tense.later)}) says when, as in Mandarin and Indonesian.`
    : tense.sys === 'past'
      ? `Time is ${tWhere}. There is a past, ${it(tense.forms.PST, tense.type)}, and one form for everything else: later is said like now, as in Japanese and Finnish.`
      : `Time is ${tWhere}: ${it(tense.forms.PST, tense.type)} for before and ${it(tense.forms.FUT, tense.type)} for later${tense.forms.PRS ? `, ${it(tense.forms.PRS, tense.type)} for now` : ''}. ${tense.type === 'word' ? 'Tok Pisin does it with <i>bin</i> and <i>bai</i>.' : tense.type === 'prefix' ? 'Swahili does it with <i>li-</i> and <i>ta-</i>.' : 'Turkish and Latin use endings too.'}`;
  notes.not = {
    suffix: `“Not” is the ending ${it(neg.form, 'suffix')} on the verb, as in Turkish (<i>-me</i>) and Japanese (<i>-nai</i>).`,
    prefix: `“Not” is ${it(neg.form, 'prefix')}, joined to the front of the verb, as in Czech (<i>ne-</i>).`,
    pre: `“Not” is ${it(neg.form)}, a word before the verb, as in Spanish (<i>no</i>) and Russian (<i>ne</i>).`,
    post: `“Not” is ${it(neg.form)}, a word after the verb, as in German (<i>nicht</i>) and Dutch (<i>niet</i>).`,
    circum: `“Not” is two words, ${it(neg.form)} before the verb and ${it(neg.form2 || [])} after it, as in French: <i>ne … pas</i>.`,
    aux: `“Not” is a verb, ${it(neg.form)}. It takes the endings and the real verb goes bare, as in Finnish: <i>en</i>, <i>et</i>, <i>ei</i>.`,
  }[neg.type];
  notes.ask = {
    final: `A question ends with ${it(q.form || [])}, as Japanese ends with <i>ka</i> and Mandarin with <i>ma</i>.`,
    initial: `A question opens with ${it(q.form || [])}, as Polish opens with <i>czy</i> and Arabic with <i>hal</i>.`,
    suffix: `A question is the ending ${it(q.form || [], 'suffix')} on the verb, as Finnish adds <i>-ko</i>.`,
    voice: 'A question uses the same words as a statement. Only the voice changes, and the mark at the end, as in Italian and Spanish.',
    front: 'For a question the verb moves to the front, as in German and Dutch.',
  }[q.type];
  notes.adj = adjOrder === 'AN' ? 'A describing word comes before its noun, as in English and Turkish.' : 'A describing word comes after its noun, as in French, Arabic and Indonesian.';
  if (evid) notes.src = `The speaker must say how they know. ${evid.type === 'suffix' ? `The ending ${it(evid.form, 'suffix')}` : `The word ${it(evid.form)}`} marks what was only heard from others. Turkish does this with <i>-miş</i>, and Quechua and Tibetan have their own ways.`;
  if (clus) notes.we = `There are two words for “we”: ${it(pron['1PL.INCL'].flat())} includes the person spoken to, ${it(pron['1PL.EXCL'].flat())} does not. Indonesian (<i>kita</i>, <i>kami</i>) and Tagalog do the same${inclBuilt ? '; this one is built from “I” and “you”, like Tok Pisin <i>yumi</i>' : ''}.`;

  G.notes = notes;
  G.realize = realize;
  G.summary = [
    { SOV: 'verb last', SVO: 'verb in the middle', VSO: 'verb first', VOS: 'verb first', OVS: 'object first' }[order],
    { endings: 'built with endings', beginnings: 'built with beginnings', words: 'built with small words', mixed: 'endings and small words' }[build],
  ];
  return G;
}
