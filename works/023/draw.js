// Draws the map as a long exposure. Every shopper's place, month by month, goes to the
// graphics card as one texture of whole numbers; a month's step is drawn as a faint line
// from where each shopper was to where they went, added into a buffer that is never
// cleared while the months go forward, the way a photograph's film keeps every light that
// crossed it. A crowd that keeps to itself leaves its own color; where people from all
// over the map end up together their colors add up toward white.
//
// The buffer is read through a curve (1 − e^−x, as film darkens), with a soft glow taken
// from its smaller copies. On top go the things for sale, as small squares, and the
// shoppers where they are now, as points.
(function (root) {
  'use strict';
  const WIDE = 2048;   // texels to a row of the positions texture

  const COLOR = `
vec3 hue2rgb(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
// a shopper's color comes from where their taste started: round the middle of the map for hue,
// out from the middle for how strong
vec3 colorOf(vec2 home, float turn) {
  vec2 d = home - 0.5;
  float h = atan(d.y, d.x) / 6.2831853 + turn;
  float s = clamp(0.3 + length(d) * 1.9, 0.0, 1.0);
  return mix(vec3(0.62), hue2rgb(h), s);
}`;

  const FETCH = `
uniform highp usampler2D uPos;
uniform int uRows;
vec2 posAt(int i, int m) {
  uvec2 v = texelFetch(uPos, ivec2(i % ${WIDE}, m * uRows + i / ${WIDE}), 0).rg;
  return vec2(v) / 65535.0;
}`;

  // one month's step for every shopper: a line from month uM to uM + 1
  const STEP_V = `#version 300 es
precision highp float; precision highp int;
${FETCH}
${COLOR}
uniform float uTurn;
uniform float uGain;
uniform int uM;
out vec3 vC;
void main() {
  int i = gl_InstanceID, m = uM;
  vec2 p = posAt(i, m + gl_VertexID);
  vC = colorOf(posAt(i, 0), uTurn) * uGain;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;
}`;
  const STEP_F = `#version 300 es
precision highp float;
in vec3 vC; out vec4 o;
void main() { o = vec4(vC, 1.0); }`;

  // the film, read through its curve, with a glow, onto the night
  const SHOW_V = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;
  const SHOW_F = `#version 300 es
precision highp float;
uniform sampler2D uFilm;
uniform float uExp, uGlow, uLod;
in vec2 vUv; out vec4 o;
void main() {
  vec3 a = texture(uFilm, vUv).rgb;
  vec3 g = textureLod(uFilm, vUv, uLod).rgb * 0.6 + textureLod(uFilm, vUv, uLod + 1.5).rgb * 0.4;
  vec3 x = a * uExp + g * uGlow;
  vec3 c = 1.0 - exp(-x);
  vec3 night = vec3(0.02, 0.024, 0.036);
  o = vec4(night + c * (1.0 - night), 1.0);
}`;

  // the shoppers now, between two months
  const DOT_V = `#version 300 es
precision highp float; precision highp int;
${FETCH}
${COLOR}
uniform int uM;
uniform float uF, uTurn, uSize, uEvery;
out vec3 vC;
void main() {
  int i = gl_VertexID;
  vec2 p = mix(posAt(i, uM), posAt(i, uM + 1), uF);
  // only every so many shoppers are drawn as points: the rest are in the film
  if (i % int(uEvery) != 0) { gl_Position = vec4(2.0, 2.0, 0.0, 1.0); gl_PointSize = 0.0; return; }
  vC = mix(colorOf(posAt(i, 0), uTurn), vec3(1.0), 0.35);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); gl_Position.y = -gl_Position.y;
  gl_PointSize = uSize;
}`;
  const DOT_F = `#version 300 es
precision highp float;
in vec3 vC; out vec4 o;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.4, r);
  o = vec4(vC * a * 0.8, 1.0);
}`;

  // the things for sale: x, y, how popular, how many shoppers were shown it this month
  const THING_V = `#version 300 es
precision highp float;
in vec4 aThing;
uniform float uPx, uScale, uMany;
out float vLit; out float vSize;
void main() {
  // brighter the more shoppers were shown it, on a log scale up to uMany
  float lit = clamp(log(1.0 + aThing.w) / log(1.0 + uMany), 0.0, 1.0);
  vLit = lit;
  vSize = (3.5 + min(13.0, sqrt(aThing.z) * 1.3)) * uPx * uScale;
  gl_PointSize = vSize;
  gl_Position = vec4(aThing.xy * 2.0 - 1.0, 0.0, 1.0); gl_Position.y = -gl_Position.y;
}`;
  const THING_F = `#version 300 es
precision highp float;
in float vLit; in float vSize;
uniform float uPx;
out vec4 o;
void main() {
  vec2 q = abs(gl_PointCoord - 0.5) * 2.0;
  float e = max(q.x, q.y);
  float line = 1.0 - smoothstep(1.0 - 2.2 * uPx / vSize, 1.0 - 0.8 * uPx / vSize, e);
  float edge = step(1.0 - 2.4 * uPx / vSize, e);
  if (edge < 0.5) discard;
  vec3 lit = vec3(1.0, 0.93, 0.8), dark = vec3(0.32, 0.34, 0.42);
  o = vec4(mix(dark, lit, vLit) * (0.35 + vLit * 0.6), 1.0);
}`;

  function compile(gl, vs, fs) {
    const make = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + '\n' + src);
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, make(gl.VERTEX_SHADER, vs)); gl.attachShader(p, make(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  }

  function Painter(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) return null;
    const half = !!gl.getExtension('EXT_color_buffer_float') || !!gl.getExtension('EXT_color_buffer_half_float');
    const step = compile(gl, STEP_V, STEP_F);
    const show = compile(gl, SHOW_V, SHOW_F);
    const dot = compile(gl, DOT_V, DOT_F);
    const thing = compile(gl, THING_V, THING_F);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const showVao = gl.createVertexArray();
    gl.bindVertexArray(showVao);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindAttribLocation(show.p, 0, 'aPos');
    const emptyVao = gl.createVertexArray();
    const thingBuf = gl.createBuffer(), thingVao = gl.createVertexArray();
    gl.bindVertexArray(thingVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, thingBuf);
    const aThing = gl.getAttribLocation(thing.p, 'aThing');
    gl.enableVertexAttribArray(aThing); gl.vertexAttribPointer(aThing, 4, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const worlds = new Map();
    let size = 0;   // the film's side in device pixels

    function film(w) {
      if (w.tex) { gl.deleteTexture(w.tex); gl.deleteFramebuffer(w.fb); }
      w.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, w.tex);
      const levels = Math.floor(Math.log2(size)) + 1;
      gl.texStorage2D(gl.TEXTURE_2D, levels, half ? gl.RGBA16F : gl.RGBA8, size, size);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      w.fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, w.fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, w.tex, 0);
      gl.viewport(0, 0, size, size);
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      w.built = 0; w.mip = true;
    }

    const api = {
      half,
      // a world to draw: its run (see world.js)
      add(key, run) {
        const N = run.P.shoppers, T = run.P.months, rows = Math.ceil(N / WIDE);
        const w = { run, N, T, rows, sent: 0, built: 0, tex: null, fb: null, pad: new Uint16Array(rows * WIDE * 2) };
        w.pos = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, w.pos);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG16UI, WIDE, (T + 1) * rows);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        if (old(key)) api.drop(key);
        worlds.set(key, w);
        if (size) film(w);
        return w;
      },
      drop(key) {
        const w = worlds.get(key); if (!w) return;
        gl.deleteTexture(w.pos); if (w.tex) { gl.deleteTexture(w.tex); gl.deleteFramebuffer(w.fb); }
        worlds.delete(key);
      },
      // the months from `from` on have changed (or are new): send what is worked out
      sync(key, from = null) {
        const w = worlds.get(key); if (!w) return;
        if (from != null) { w.sent = Math.min(w.sent, from); if (w.built > from) w.built = Infinity; }
        const done = w.run.done, at = w.run.rec.at;
        gl.bindTexture(gl.TEXTURE_2D, w.pos);
        while (w.sent <= done) {
          const m = w.sent;
          w.pad.set(at.subarray(m * w.N * 2, (m + 1) * w.N * 2));
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, m * w.rows, WIDE, w.rows, gl.RG_INTEGER, gl.UNSIGNED_SHORT, w.pad);
          w.sent++;
        }
      },
      resize(px) {
        px = Math.max(64, Math.min(4096, Math.round(px)));
        if (px === size) return;
        size = px;
        for (const w of worlds.values()) film(w);
      },
      get size() { return size; },
      // expose the film up to month m (whole months only)
      expose(key, m) {
        const w = worlds.get(key); if (!w) return;
        m = Math.min(m, w.sent - 1);
        if (m < 0) return;   // nothing sent yet
        if (m < w.built) { film(w); }
        if (m === w.built) return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, w.fb);
        gl.viewport(0, 0, size, size);
        gl.useProgram(step.p);
        gl.bindVertexArray(emptyVao);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, w.pos);
        gl.uniform1i(step.u.uPos, 0);
        gl.uniform1i(step.u.uRows, w.rows);
        gl.uniform1f(step.u.uTurn, w.run.C.hue);
        // thinner lines on a bigger film cross more pixels: keep the same light per unit of map
        gl.uniform1f(step.u.uGain, (half ? 0.05 : 4 / 255));
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        for (let k = w.built; k < m; k++) {
          gl.uniform1i(step.u.uM, k);
          gl.drawArraysInstanced(gl.LINES, 0, 2, w.N);
        }
        gl.disable(gl.BLEND);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        w.built = m; w.mip = true;
      },
      // draw: view is the map's square on the canvas in device pixels, sides is [[key, x0, x1]]
      // with x0..x1 the share of the map's width that world shows, t is the month (fractional)
      frame({ view, sides, t, dots = true, things = true, glow = 1 }) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.02, 0.024, 0.036, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        const px = canvas.width / canvas.clientWidth || 1;
        const vy = canvas.height - view.y - view.h;
        gl.enable(gl.SCISSOR_TEST);
        for (const [key, x0, x1] of sides) {
          const w = worlds.get(key); if (!w || !w.tex) continue;
          const sx = Math.round(view.x + view.w * x0), sw = Math.round(view.x + view.w * x1) - sx;
          gl.scissor(sx, vy, sw, view.h);
          gl.viewport(view.x, vy, view.w, view.h);
          // the film
          if (w.mip) { gl.bindTexture(gl.TEXTURE_2D, w.tex); gl.generateMipmap(gl.TEXTURE_2D); w.mip = false; }
          gl.useProgram(show.p);
          gl.bindVertexArray(showVao);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, w.tex);
          gl.uniform1i(show.u.uFilm, 0);
          // a pixel is crossed by fewer lines on a bigger film, and fewer when the months are few
          const k = size / 420;
          gl.uniform1f(show.u.uExp, (half ? 1.6 : 1.6) * k);
          gl.uniform1f(show.u.uGlow, 1.4 * k * glow);
          gl.uniform1f(show.u.uLod, Math.log2(size / 180));
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
          // the things for sale
          if (things) {
            const M = w.run.things, m = Math.max(0, Math.min(Math.floor(t), w.run.done));
            const data = w.run.rec.things.subarray(m * M * 4, (m + 1) * M * 4);
            gl.useProgram(thing.p);
            gl.bindVertexArray(thingVao);
            gl.bindBuffer(gl.ARRAY_BUFFER, thingBuf);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
            gl.uniform1f(thing.u.uPx, px);
            gl.uniform1f(thing.u.uScale, Math.max(0.7, Math.min(1.3, view.w / px / 640)));
            gl.uniform1f(thing.u.uMany, w.N * 0.05);   // shown to one shopper in twenty: as bright as it gets
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
            gl.drawArrays(gl.POINTS, 0, M);
            gl.blendFunc(gl.ONE, gl.ONE);
          }
          // the shoppers now
          if (dots) {
            const top = Math.max(0, w.sent - 2), tt = Math.min(t, top + 0.999);
            const m = Math.floor(tt), f = tt - m;
            gl.useProgram(dot.p);
            gl.bindVertexArray(emptyVao);
            gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, w.pos);
            gl.uniform1i(dot.u.uPos, 0); gl.uniform1i(dot.u.uRows, w.rows);
            gl.uniform1i(dot.u.uM, m); gl.uniform1f(dot.u.uF, w.sent > m + 1 ? f : 0);
            gl.uniform1f(dot.u.uTurn, w.run.C.hue);
            gl.uniform1f(dot.u.uSize, Math.max(1.5, 2.2 * px * Math.min(1, view.w / px / 700)));
            gl.uniform1f(dot.u.uEvery, view.w / px < 500 ? 2 : 1);
            gl.drawArrays(gl.POINTS, 0, w.N);
          }
          gl.disable(gl.BLEND);
        }
        gl.disable(gl.SCISSOR_TEST);
      },
      lost: () => gl.isContextLost(),
    };
    const old = (key) => worlds.has(key);
    return api;
  }

  root.CrowdPainter = Painter;
})(typeof self !== 'undefined' ? self : this);
