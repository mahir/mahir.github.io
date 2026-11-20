// voice.js: a voice for a language nobody has heard. Nothing is recorded. A soft buzz for the voice
// and a hiss for the breath pass through four resonances that glide from sound to sound as a mouth
// would, the way formant synthesizers have worked since the 1980s. It says any word a language here can make.
//
// plan() turns words into a list of moments (what the mouth is doing, from when, for how long);
// perform() schedules them on an audio context, live or offline.
//
// What keeps it smooth: the voice never stops between a vowel and a neighboring m, n, l, r, w or y,
// it only changes shape; every change is a glide, not a step; the pitch drifts and wavers a little,
// as a person's does; and a short room echo softens the edges.

import { C, isV, base, isLong, toneOf } from './sounds.js';

// the first three resonances of each vowel, in hertz, for a middling adult voice
const FORMANTS = {
  i: [280, 2250, 2900], y: [280, 1750, 2200], 'ɨ': [300, 1500, 2400], 'ɯ': [320, 1300, 2400], u: [310, 870, 2250],
  e: [400, 2000, 2600], 'ø': [400, 1500, 2300], 'ə': [500, 1500, 2500], o: [450, 850, 2400],
  'ɛ': [550, 1800, 2500], 'ɔ': [580, 900, 2400], a: [730, 1250, 2500],
};
// where the second resonance points while the mouth is closed at each place, and the pitch of the burst when it opens
const PLACE = [{ f2: 950, burst: 900, q: 0.8 }, { f2: 1750, burst: 3900, q: 1.4 }, { f2: 2150, burst: 2900, q: 1.8 }, { f2: 1900, burst: 2000, q: 2.2 }, { f2: 1300, burst: 1300, q: 2 }, { f2: 1500, burst: 1000, q: 1 }];
// the hiss of each fricative: its pitch, how narrow it is, how loud
const HISS = { s: [5600, 1.6, 0.26], z: [5600, 1.6, 0.16], 'ʃ': [2800, 1.8, 0.3], 'ʒ': [2800, 1.8, 0.18], f: [4600, 0.5, 0.09], v: [4600, 0.5, 0.05], 'θ': [5800, 0.5, 0.07], x: [1700, 2.2, 0.2], 'ɣ': [1700, 2.2, 0.11], ts: [5600, 1.6, 0.26], 'tʃ': [2800, 1.8, 0.3], 'dʒ': [2800, 1.8, 0.18] };

export const canSpeak = () => typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);

// words: [{ segs }], lang: the language (for stress, tones and its own voice), asked: a question rises at the end.
// A moment is { t, d, kind, ... }: 'open' (voice through the mouth, shaped by f), 'shut' (the mouth closed),
// 'hiss' (breath through a narrow gap), 'breath' (breath through the open mouth) or 'gap' (silence).
export function plan(lang, words, { asked = false } = {}) {
  const { ph } = lang;
  const pace = 0.84 + ((lang.seed * 7) % 16) / 100;            // every language has its own speaker
  const pitch = 108 + ((lang.seed * 13) % 64);
  const tract = 0.96 + ((lang.seed * 3) % 18) / 100;
  const out = [];
  let t = 0.08;
  const vowelsTotal = words.reduce((a, w) => a + w.segs.filter(isV).length, 0);
  let vowelN = 0;
  const scale = (f) => f.map((x) => x * tract);
  words.forEach((w, wi) => {
    const syl = ph.syllabify(w.segs);
    const stressed = ph.tones ? -1 : ph.stress === 'first' ? 0 : ph.stress === 'last' ? syl.length - 1 : Math.max(0, syl.length - 2);
    let si = -1;
    w.segs.forEach((seg, i) => {
      const next = w.segs[i + 1];
      const nextV = w.segs.slice(i + 1).find(isV) || w.segs.slice(0, i).reverse().find(isV) || 'a';
      if (isV(seg)) {
        si++; vowelN++;
        const last = wi === words.length - 1 && !w.segs.slice(i + 1).some(isV);
        const place = vowelN / Math.max(1, vowelsTotal);
        let f0 = pitch * (1.08 - 0.17 * place);                 // the pitch sinks through the sentence
        const tone = toneOf(seg);
        if (ph.tones) f0 *= tone === 'H' ? 1.17 : tone === 'L' ? 0.88 : 1;
        else if (si === stressed) f0 *= 1.09;
        if (asked && last) f0 *= 1.2;
        const d = (isLong(seg) ? 0.22 : 0.125) * (si === stressed ? 1.2 : 1) * (last ? 1.5 : 1) / pace;
        out.push({ t, d, kind: 'open', f: scale(FORMANTS[base(seg)]), f0, amp: si === stressed ? 1 : 0.84, glide: asked && last ? 1.14 : last ? 0.9 : 1 });
        t += d;
        return;
      }
      const c = C[seg];
      const P = PLACE[c.place];
      const vf = scale(FORMANTS[base(nextV)]);
      const shut = [270, ((P.f2 * 2 + vf[1] / tract) / 3) * tract, 2550 * tract];
      if (c.manner === 'glide') { const d = 0.065 / pace; out.push({ t, d, kind: 'open', f: scale(FORMANTS[seg === 'w' ? 'u' : 'i']), amp: 0.5 }); t += d; }
      else if (c.manner === 'liquid') {
        if (seg === 'l') { const d = 0.07 / pace; out.push({ t, d, kind: 'open', f: scale([350, 1150, 2650]), amp: 0.5 }); t += d; }
        else { const d = 0.05 / pace; out.push({ t, d: d * 0.45, kind: 'open', f: scale([400, 1300, 1800]), amp: 0.2 }); out.push({ t: t + d * 0.45, d: d * 0.55, kind: 'open', f: scale([420, 1350, 1900]), amp: 0.5 }); t += d; }
      } else if (c.manner === 'nasal') { const d = 0.08 / pace; out.push({ t, d, kind: 'open', f: shut, amp: 0.2, hum: 0.5 }); t += d; }
      else if (seg === 'h') { const d = 0.06 / pace; out.push({ t, d, kind: 'breath', f: vf, amp: 0.22 }); t += d; }
      else if (seg === 'ʔ') { out.push({ t, d: 0.055 / pace, kind: 'gap' }); t += 0.055 / pace; }
      else if (c.manner === 'fric') {
        const [freq, q, amp] = HISS[seg];
        const d = (next ? 0.09 : 0.11) / pace;
        out.push({ t, d, kind: 'hiss', freq, q, amp, f: shut, hum: c.voice ? 0.3 : 0 });
        t += d;
      } else {
        // a stop or an affricate: the mouth shuts, then opens with a small burst
        const hold = (c.manner === 'aff' ? 0.04 : 0.052) / pace;
        out.push({ t, d: hold, kind: 'shut', f: shut, hum: c.voice ? 0.3 : 0 });
        t += hold;
        if (c.manner === 'aff') { const [freq, q, amp] = HISS[seg]; out.push({ t, d: 0.06 / pace, kind: 'hiss', freq, q, amp, f: shut, hum: c.voice ? 0.25 : 0 }); t += 0.06 / pace; }
        else {
          out.push({ t, d: 0.01, kind: 'hiss', freq: P.burst, q: P.q, amp: c.voice ? 0.16 : 0.3, f: shut, hum: 0 });
          t += 0.01;
          if (c.extra === 'asp') { out.push({ t, d: 0.05, kind: 'breath', f: vf, amp: 0.2 }); t += 0.05; }
          else if (c.extra === 'ej') { out.push({ t, d: 0.035, kind: 'gap' }); t += 0.035; }
          else if (!c.voice) { out.push({ t, d: 0.014, kind: 'breath', f: vf, amp: 0.12 }); t += 0.014; }
        }
      }
    });
    out.push({ t, d: 0.06 / pace, kind: 'gap', word: wi });
    t += 0.06 / pace;
  });
  return { moments: out, length: t + 0.4, starts: words.map((w, wi) => (wi ? out.find((m) => m.word === wi - 1).t + 0.04 : 0.05)), pitch };
}

// a small room for the voice to sound in: a burst of noise dying away in a quarter of a second
function room(ctx) {
  const n = Math.floor(ctx.sampleRate * 0.3);
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buffer.getChannelData(0);
  let seed = 4321; let prev = 0;
  for (let i = 0; i < n; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = ((seed / 2147483647) * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.055));
    prev = prev * 0.55 + x * 0.45;                 // duller, as walls are
    d[i] = i < 40 ? 0 : prev;
  }
  const c = ctx.createConvolver(); c.buffer = buffer;
  return c;
}

// schedule a plan on an audio context, starting at `at` seconds. Returns the means to stop it.
export function perform(ctx, planned, at = ctx.currentTime + 0.06, level = 0.8) {
  const out = ctx.createGain(); out.gain.value = level;
  const soften = ctx.createBiquadFilter(); soften.type = 'lowpass'; soften.frequency.value = 4700; soften.Q.value = 0.5;
  soften.connect(out); out.connect(ctx.destination);
  const echo = room(ctx); const wet = ctx.createGain(); wet.gain.value = 0.2;
  out.connect(echo); echo.connect(wet); wet.connect(ctx.destination);

  // the buzz of the voice: a pulse whose overtones fall away quickly, so it hums more than it rasps
  const n = 64; const real = new Float32Array(n); const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) imag[k] = 1 / k ** 1.5;
  const buzz = ctx.createOscillator();
  buzz.setPeriodicWave(ctx.createPeriodicWave(real, imag));
  buzz.frequency.value = planned.pitch || 120;
  // a person's pitch is never quite still: a slow drift and a faint waver
  for (const [rate, depth] of [[5.1, 1.1], [0.83, 1.9]]) {
    const lfo = ctx.createOscillator(); lfo.frequency.value = rate;
    const g = ctx.createGain(); g.gain.value = depth;
    lfo.connect(g); g.connect(buzz.frequency); lfo.start(at); lfo.stop(at + planned.length + 0.2);
  }
  // the hiss of breath
  const len = Math.floor(ctx.sampleRate * 1.5);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 22222;
  for (let i = 0; i < len; i++) { seed = (seed * 16807) % 2147483647; data[i] = (seed / 2147483647) * 2 - 1; }
  const noise = ctx.createBufferSource(); noise.buffer = buffer; noise.loop = true;
  const airy = ctx.createBiquadFilter(); airy.type = 'highpass'; airy.frequency.value = 1100;
  noise.connect(airy);

  const voiced = ctx.createGain(); voiced.gain.value = 0;      // voice through the open mouth
  const breath = ctx.createGain(); breath.gain.value = 0;      // breath through the open mouth
  const hum = ctx.createGain(); hum.gain.value = 0;            // voice with the mouth shut, through the nose
  const hiss = ctx.createGain(); hiss.gain.value = 0;          // breath forced through a narrow gap
  buzz.connect(voiced); buzz.connect(hum); airy.connect(breath); noise.connect(hiss);
  // the mouth: four resonances one after another, each lifting the overtones near it
  const mouth = ctx.createGain(); mouth.gain.value = 0.16;
  voiced.connect(mouth); breath.connect(mouth);
  let node = mouth;
  const peaks = [[6, 18], [12, 23], [14, 19], [10, 11]].map(([q, db], k) => {
    const f = ctx.createBiquadFilter(); f.type = 'peaking'; f.Q.value = q; f.gain.value = db; f.frequency.value = [500, 1500, 2500, 3500][k];
    node.connect(f); node = f;
    return f;
  });
  node.connect(soften);
  const nose = ctx.createBiquadFilter(); nose.type = 'lowpass'; nose.frequency.value = 360; nose.Q.value = 0.9;
  const noseLevel = ctx.createGain(); noseLevel.gain.value = 0.5;
  hum.connect(nose); nose.connect(noseLevel); noseLevel.connect(soften);
  const gapFilter = ctx.createBiquadFilter(); gapFilter.type = 'bandpass'; gapFilter.frequency.value = 4000;
  hiss.connect(gapFilter); gapFilter.connect(soften);

  const set = (param, value, time, tau) => param.setTargetAtTime(value, Math.max(0, time), tau);
  const shape = (f, time, tau) => peaks.forEach((p, k) => { if (k < 3) set(p.frequency, f[k], time, tau); });
  let wasOpen = false;
  for (const m of planned.moments) {
    const t = at + m.t; const end = t + m.d;
    if (m.kind === 'open') {
      // from one voiced sound to the next the mouth glides; out of a closure it opens faster
      shape(m.f, t - 0.02, wasOpen ? 0.026 : 0.014);
      set(voiced.gain, m.amp, t, wasOpen ? 0.022 : 0.014);
      set(breath.gain, 0.012 * m.amp, t, 0.02);
      set(hum.gain, m.hum || 0, t, 0.018); set(hiss.gain, 0, t, 0.008);
      if (m.f0) { set(buzz.frequency, m.f0, t - 0.03, 0.05); if (m.glide && m.glide !== 1) set(buzz.frequency, m.f0 * m.glide, t + m.d * 0.3, m.d * 0.45); }
    } else if (m.kind === 'shut') {
      shape(m.f, t - 0.01, 0.016);
      set(voiced.gain, 0, t, 0.012); set(breath.gain, 0, t, 0.01); set(hiss.gain, 0, t, 0.008);
      set(hum.gain, m.hum, t, 0.012); set(hum.gain, 0, end, 0.008);
    } else if (m.kind === 'breath') {
      shape(m.f, t, 0.012);
      set(voiced.gain, 0, t, 0.012); set(hum.gain, 0, t, 0.01);
      set(breath.gain, m.amp, t, 0.01); set(breath.gain, 0, end, 0.012);
    } else if (m.kind === 'hiss') {
      shape(m.f, t, 0.016);
      gapFilter.frequency.setValueAtTime(m.freq, Math.max(0, t)); gapFilter.Q.setValueAtTime(m.q, Math.max(0, t));
      set(voiced.gain, 0, t, 0.014); set(breath.gain, 0, t, 0.01); set(hum.gain, m.hum, t, 0.014);
      set(hiss.gain, m.amp, t, m.d < 0.02 ? 0.003 : 0.014); set(hiss.gain, 0, end, m.d < 0.02 ? 0.005 : 0.014); set(hum.gain, 0, end, 0.012);
    } else {
      set(voiced.gain, 0, t, 0.02); set(hum.gain, 0, t, 0.016); set(hiss.gain, 0, t, 0.008); set(breath.gain, 0, t, 0.012);
    }
    wasOpen = m.kind === 'open';
  }
  const stopAt = at + planned.length;
  set(out.gain, 0, stopAt - 0.04, 0.012);
  buzz.start(at); noise.start(at); buzz.stop(stopAt + 0.1); noise.stop(stopAt + 0.1);
  return { stop: () => { try { out.gain.cancelScheduledValues(0); out.gain.setTargetAtTime(0, ctx.currentTime, 0.012); wet.gain.setTargetAtTime(0, ctx.currentTime, 0.03); buzz.stop(ctx.currentTime + 0.08); noise.stop(ctx.currentTime + 0.08); } catch { /* already stopped */ } }, until: stopAt };
}

let live = null; let playing = null; let timers = [];
// say these words aloud; resolves when done. A second call cuts the first short.
// onWord(i) is called as each word starts, and onWord(-1) when the voice stops.
export function speak(lang, words, opts = {}) {
  if (!canSpeak()) return Promise.resolve(false);
  if (!live) live = new (window.AudioContext || window.webkitAudioContext)();
  hush();
  const planned = plan(lang, words, opts);
  return live.resume().then(() => {
    const p = perform(live, planned);
    p.onWord = opts.onWord;
    playing = p;
    const lead = (p.until - planned.length - live.currentTime) * 1000;
    if (opts.onWord) planned.starts.forEach((t, i) => timers.push(setTimeout(() => { if (playing === p) opts.onWord(i); }, lead + t * 1000)));
    return new Promise((done) => timers.push(setTimeout(() => { if (playing === p) { playing = null; if (opts.onWord) opts.onWord(-1); } done(true); }, (p.until - live.currentTime) * 1000 + 60)));
  });
}
export function hush() {
  timers.forEach(clearTimeout); timers = [];
  if (playing) { playing.stop(); if (playing.onWord) playing.onWord(-1); playing = null; }
}
