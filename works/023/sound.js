// The sound of the feed: one note for each ninth of the map, as loud as that ninth's share of
// the month's showings. A world starts with most of the chord; as the showings gather into
// fewer parts of the map, notes drop out, and in most worlds three or four are left by the
// twentieth year. Nothing plays until it is switched on.
(function (root) {
  'use strict';
  // a pentatonic chord over two octaves, one note for each ninth, top left to bottom right
  const NOTES = [196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];

  function Sound() {
    let ctx = null, out = null, voices = [], on = false;

    function start() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      out = ctx.createGain(); out.gain.value = 0;
      // a little room: two delays fed back into each other, mixed low
      const dry = ctx.createGain(), wet = ctx.createGain(); wet.gain.value = 0.28;
      const d1 = ctx.createDelay(1), d2 = ctx.createDelay(1), fb = ctx.createGain(), tone = ctx.createBiquadFilter();
      d1.delayTime.value = 0.23; d2.delayTime.value = 0.37; fb.gain.value = 0.45; tone.type = 'lowpass'; tone.frequency.value = 1800;
      out.connect(dry); out.connect(d1); d1.connect(d2); d2.connect(tone); tone.connect(fb); fb.connect(d1); tone.connect(wet);
      dry.connect(ctx.destination); wet.connect(ctx.destination);
      voices = NOTES.map((f, k) => {
        const g = ctx.createGain(); g.gain.value = 0;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900 + k * 60; lp.Q.value = 0.4;
        const a = ctx.createOscillator(), b = ctx.createOscillator();
        a.type = 'sine'; b.type = 'triangle'; a.frequency.value = f; b.frequency.value = f * 1.003;
        const bg = ctx.createGain(); bg.gain.value = 0.35;
        a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(out);
        // a slow swell of its own, so the chord breathes: a tremolo on the filter
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = 0.07 + k * 0.013; lg.gain.value = 300;
        lfo.connect(lg); lg.connect(lp.frequency);
        a.start(); b.start(); lfo.start();
        return { g, level: 0 };
      });
      return true;
    }

    return {
      get on() { return on; },
      toggle() {
        if (!ctx && !start()) return false;
        on = !on;
        if (on) ctx.resume();
        const now = ctx.currentTime;
        out.gain.cancelScheduledValues(now);
        out.gain.setTargetAtTime(on ? 0.16 : 0, now, on ? 0.6 : 0.15);
        return on;
      },
      // shares: nine numbers that add up to one
      set(shares) {
        if (!ctx || !on) return;
        const now = ctx.currentTime;
        voices.forEach((v, k) => {
          const s = shares[k] || 0;
          const level = s < 0.02 ? 0 : Math.pow(s, 0.6) * 0.55;
          if (Math.abs(level - v.level) < 0.004) return;
          v.level = level;
          v.g.gain.setTargetAtTime(level, now, 0.5);
        });
      },
    };
  }

  root.CrowdSound = Sound;
})(typeof self !== 'undefined' ? self : this);
