// No. 012 · Ebru, sheet by sheet.
// The tray is never stored as pixels that get smeared. It is a short list of what the marbler did, a drop here,
// a pull of the awl there, and every pixel is found by walking that list backwards to the paint it came from.
// So edges stay sharp however far the colours are drawn. When the list grows long, its oldest part is set down
// and the walk ends there: drops as colour in a texture (the "base"), passes of the awl and comb as a warp of it.
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const bare = q.has('bare');                      // ?bare: the tray alone, already marbled, for the share image
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  if (bare) document.body.classList.add('bare');

  const canvas = $('water'), basin = $('basin'), stage = $('stage'), hintEl = $('hint');
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) {
    // No WebGL 2: the still, and the words.
    document.body.classList.add('nogl');
    const img = new Image(); img.className = 'still'; img.src = 'og.jpg';
    img.alt = 'A marbling tray seen from above, its colours combed into feathered rows';
    basin.append(img);
    hintEl.textContent = 'This experiment needs WebGL 2, which this browser does not offer.';
    for (const el of document.querySelectorAll('.dock input, .dock button')) el.disabled = true;
    return;
  }

  // ---------------------------------------------------------------- the tray, in its own units: 1 high, A wide
  const A = bare ? innerWidth / innerHeight : (innerWidth < 760 && innerHeight > innerWidth ? 0.8 : 1.5);
  const OPS = 256;                 // room in the list
  const BAKE_AT = 72;              // set the oldest part down once the list is this long
  const DROP = 0.085, DROP_MAX = 0.26;
  // A tine: how far its pull reaches, the gap between its teeth (none for the awl), and its grip, which is how much of the
  // tine's own travel the paint right under it follows. Less than all of it, so paint is drawn out a hand's width and let go.
  const AWL = { lam: 0.034, gap: 0, grip: 0.97 }, COMB = { lam: 0.015, gap: 0.062, grip: 0.985 };
  const baseLong = Math.min(coarse ? 1536 : 2048, gl.getParameter(gl.MAX_TEXTURE_SIZE));
  const BW = Math.round(A >= 1 ? baseLong : baseLong * A), BH = Math.round(A >= 1 ? baseLong / A : baseLong);

  // ---------------------------------------------------------------- shaders
  const VERT = `#version 300 es
in vec2 aPos; uniform vec2 uFlip; out vec2 vUv;
void main(){ vUv = vec2(.5 + .5*aPos.x*uFlip.x, .5 - .5*aPos.y*uFlip.y); gl_Position = vec4(aPos, 0., 1.); }`;

  const NOISE = `
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a*vnoise(p); p = p*2.03 + 17.1; a *= .5; } return s; }`;

  // Where did the paint at this point come from? Walk the list from the newest act to the oldest.
  const PATTERN = `#version 300 es
precision highp float; precision highp sampler2D;
uniform sampler2D uOps, uBase, uWarp;
uniform int uCount, uSamples, uOut, uWarped;
uniform vec2 uTray, uRes, uBaseSize;
in vec2 vUv; out vec4 o;
${NOISE}
const vec2 OFF[4] = vec2[4](vec2(.125,.375), vec2(-.375,.125), vec2(-.125,-.375), vec2(.375,-.125));
// Since the colours were last set down, the awl and the comb may have moved them. The warp says, for each place, how far
// away the paint that is there now lay then. So colour is never copied from a copy: it is always looked up where it fell.
vec2 unwarp(vec2 p){
  vec2 t = clamp(vec2(p.x/uTray.x, 1. - p.y/uTray.y), 0., 1.)*uBaseSize - .5, f = fract(t);
  ivec2 i = ivec2(floor(t)), lo = ivec2(0), hi = ivec2(uBaseSize) - 1;
  vec2 a = texelFetch(uWarp, clamp(i, lo, hi), 0).xy, b = texelFetch(uWarp, clamp(i + ivec2(1, 0), lo, hi), 0).xy,
       c = texelFetch(uWarp, clamp(i + ivec2(0, 1), lo, hi), 0).xy, d = texelFetch(uWarp, clamp(i + 1, lo, hi), 0).xy;
  return p + mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
vec4 base(vec2 p){
  if (uWarped == 1) p = unwarp(p);
  vec2 uv = clamp(vec2(p.x/uTray.x, 1. - p.y/uTray.y), 0., 1.);   // nothing comes in from past the walls: the paint at the wall is drawn out
  // a bilinear that sharpens as the paint is stretched, so an edge stays about a pixel wide however far it is drawn
  vec2 t = uv*uBaseSize - .5, i = floor(t), a = dFdx(t), b = dFdy(t);
  float E = dot(a, a), G = dot(b, b), F = dot(a, b);
  float thin = sqrt(max(.5*(E + G - sqrt((E - G)*(E - G) + 4.*F*F)), 1e-8));   // texels to a pixel, along the way the paint is stretched most
  vec2 f = clamp((t - i - .5)*clamp(1./thin, 2., 4096.) + .5, 0., 1.);
  return texture(uBase, (i + f + .5)/uBaseSize);
}
// a drop of pigment: mottled, grainy, a little thinner in the middle and darker at its rim.
// u is the place inside the drop as it first fell, so the grain is drawn out with the paint.
vec4 pigment(vec3 c, vec2 u, float seed){
  float t = length(u);
  float lum = 1. + (fbm(u*2.6 + seed*19.7) - .5)*.22 + (vnoise(u*34. + seed*7.3) - .5)*.08;
  lum *= mix(1.04, .84, smoothstep(.93, 1., t));
  return vec4(clamp(c*lum, 0., 1.), 1.);
}
// Walk the list from the newest act to the oldest. True if the walk ends inside a drop, whose colour is then c.
bool walk(inout vec2 p, out vec4 c){
  c = vec4(0.);
  for (int i = uCount - 1; i >= 0; i--) {
    vec4 a = texelFetch(uOps, ivec2(i, 0), 0), b = texelFetch(uOps, ivec2(i, 1), 0);
    if (a.x < .5) {                                 // a drop made room for itself
      vec2 d = p - a.yz; float r2 = a.w*a.w, d2 = dot(d, d), q = a.x*2.5;
      if (d2 < r2) { c = pigment(b.rgb, d/a.w, b.a); return true; }
      // On open water it pushes everything outward and every colour keeps its area. On a crowded tray (q) it takes most of
      // its room from the paint right beside it, which is squeezed into a vein around the drop.
      p = a.yz + d*sqrt(1. - r2*(1. - q + q*exp(-(d2 - r2)/(r2*.3)))/d2);
    } else {                                        // a tine moved a short way and dragged what was near it
      vec2 m = b.xy, v = p - a.yz; float mm = dot(m, m), grip = a.x - 1.;
      if (b.z > 0.) { vec2 bar = vec2(cos(b.w), sin(b.w)); v -= bar*b.z*floor(dot(v, bar)/b.z + .5); }   // a comb: the nearest tooth
      float f = grip*exp(-length(v - m*clamp(dot(v, m)/mm, 0., 1.))/a.w);
      vec2 w = v - m*f;
      f = grip*exp(-length(w - m*clamp(dot(w, m)/mm, 0., 1.))/a.w);
      p -= m*f;
    }
  }
  return false;
}
vec4 trace(vec2 p){ vec4 c; return walk(p, c) ? c : base(p); }
void main(){
  if (uOut == 1) {                                  // passes of the awl and the comb, set down into the warp
    vec2 from = vUv*uTray, p = from; vec4 c; walk(p, c);
    if (uWarped == 1) p = unwarp(p);
    o = vec4(p - from, 0., 1.); return;
  }
  vec4 acc = vec4(0.);
  for (int s = 0; s < uSamples; s++) {
    vec2 off = uSamples == 1 ? vec2(0.) : OFF[uSamples == 2 ? s*2 : s];
    acc += trace((vUv + off/uRes)*uTray);
  }
  o = acc/float(uSamples);
}`;

  // The pattern as it is seen: floating on the water (mode 0), or taken up by a sheet of paper (mode 1).
  const FINISH = `#version 300 es
precision highp float;
uniform sampler2D uPat;
uniform vec2 uPatScale, uTray;
uniform int uMode;
uniform float uTime, uAgit, uLay, uSoak, uWipe;
uniform vec4 uRip[6];
in vec2 vUv; out vec4 o;
${NOISE}
const vec3 PAPER = vec3(.955, .940, .895);
vec3 paper(vec2 p){
  float fib = fbm(p*vec2(38., 150.))*.6 + fbm(p.yx*vec2(60., 170.) + 9.)*.4;
  return PAPER*(1. + (fib - .5)*.055 + (vnoise(p*520.) - .5)*.03);
}
vec4 pat(vec2 p){ return texture(uPat, clamp(vec2(p.x/uTray.x, 1. - p.y/uTray.y), 0., 1.)*uPatScale); }
void main(){
  vec2 p = vUv*uTray;
  if (uMode == 1) {
    vec4 c = pat(p);
    vec3 pap = paper(p), ink = c.a > 0. ? c.rgb/c.a : vec3(1.);
    ink = ink*.95 + .04;                                             // matte on paper, not wet
    float take = c.a*(.90 + .10*fbm(p*9.))*(1. - .85*step(.993, vnoise(p*240.)));   // the paper takes almost all of it
    o = vec4(mix(pap, ink*(pap/PAPER), take*.97), 1.);
    return;
  }
  vec2 sp = p; float glint = 0.;
  for (int i = 0; i < 6; i++) {                                      // rings from the drops
    vec4 r = uRip[i]; float age = uTime - r.z;
    if (r.w <= 0. || age < 0. || age > 2.6) continue;
    vec2 d = p - r.xy; float L = length(d) + 1e-5, R = .02 + age*.32;
    float w = exp(-pow((L - R)/.04, 2.))*r.w*exp(-age*1.8), ph = sin((L - R)*110.);
    sp += d/L*w*ph*.0055; glint += w*ph;
  }
  if (uAgit > .001) sp += (vec2(fbm(p*5. + vec2(uTime*.35, 0.)), fbm(p*5. + vec2(7.3, uTime*.31))) - .5)*uAgit*.0045;
  vec4 c = pat(sp);
  vec3 water = vec3(.775, .765, .705)*(1. - .16*dot(vUv - .5, vUv - .5));
  float band = exp(-pow((p.x*.55 + p.y - .275*uTray.x - .42)/.4, 2.));   // daylight across the surface
  vec3 bare = water + band*.035;
  water *= 1. - .17*pat(sp + vec2(-.006, -.009)).a;                  // the film's shadow on the floor of the tray
  vec3 col = water*(1. - c.a) + c.rgb + band*(.035 + .03*c.a) + glint*.04;
  if (uWipe > 0.) {                                                  // a strip of paper skims the surface clean
    float s = mix(-.12, uTray.x + .12, uWipe) - p.x;
    if (s > .075) col = bare;
    else if (s > 0.) col = paper(p)*mix(.80, .97, sin(s/.075*3.14159));
    else col *= 1. - .28*exp(s/.03);
  }
  if (uLay > 0.) {                                                   // the sheet is laid from one side, its far edge still in the hand
    float s = mix(-.2, uTray.x + .2, uLay) - .10*pow(abs(vUv.y - .45)*1.6, 2.) - p.x;
    if (s > 0.) {
      vec3 pap = paper(p)*.985, ink = c.a > 0. ? c.rgb/c.a : vec3(1.);
      pap *= mix(vec3(1.), mix(vec3(1.), ink, c.a), smoothstep(.04, .5, s)*(.06 + .11*uSoak));   // the colours show faintly through
      float k = clamp(s/.11, 0., 1.);
      pap *= mix(.76, 1., smoothstep(0., 1., k));
      pap += .05*exp(-pow((k - .45)/.22, 2.))*(1. - k);
      col = pap;
    } else col *= 1. - .32*exp(s/.05);
  }
  o = vec4(col, 1.);
}`;

  function program(frag) {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, frag]]) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) {
      const name = gl.getActiveUniform(p, i).name.replace('[0]', '');
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  }
  const PAT = program(PATTERN), FIN = program(FINISH);

  gl.bindVertexArray(gl.createVertexArray());
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function target(w, h) {
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h };
  }
  const free = (t) => { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); };

  const opsTex = gl.createTexture(), opsBuf = new Float32Array(OPS*2*4);
  gl.bindTexture(gl.TEXTURE_2D, opsTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, OPS, 2, 0, gl.RGBA, gl.FLOAT, opsBuf);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const bases = [target(BW, BH), target(BW, BH)];
  let cur = 0, pat = null, patW = 1, patH = 1;

  // the warp: two numbers a place, kept as floats where the browser can draw into such a texture
  const F32 = gl.getExtension('EXT_color_buffer_float'), F16 = F32 || gl.getExtension('EXT_color_buffer_half_float');
  function warpTarget() {
    if (!F16) return null;
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    if (F32) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, BW, BH, 0, gl.RG, gl.FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, BW, BH, 0, gl.RG, gl.HALF_FLOAT, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE ? { tex, fbo, w: BW, h: BH } : null;
  }
  const warps = [warpTarget(), warpTarget()], canWarp = !!(warps[0] && warps[1]);
  let wcur = 0, warped = false;                    // which warp is current; has anything been moved since the colours were set down

  // ---------------------------------------------------------------- the list of what was done
  const ops = [];
  let paint = false, drops = 0;                    // is there colour on the water; how many drops so far
  let dirty = true, refined = false, lastChange = 0, scale = 1, slow = 0, agit = 0, instant = bare || calm;
  const rip = new Float32Array(24); let ripAt = 0;
  const T0 = performance.now(), now = () => (performance.now() - T0)/1000;

  function upload() {
    for (let i = 0; i < ops.length; i++) {
      const o = ops[i], a = i*4, b = (OPS + i)*4;
      if (o.k === 0) { opsBuf[a] = o.sq*0.4; opsBuf[a + 1] = o.x; opsBuf[a + 2] = o.y; opsBuf[a + 3] = o.r; opsBuf[b] = o.c[0]; opsBuf[b + 1] = o.c[1]; opsBuf[b + 2] = o.c[2]; opsBuf[b + 3] = o.seed; }
      else { opsBuf[a] = 1 + o.grip; opsBuf[a + 1] = o.x; opsBuf[a + 2] = o.y; opsBuf[a + 3] = o.lam; opsBuf[b] = o.mx; opsBuf[b + 1] = o.my; opsBuf[b + 2] = o.gap; opsBuf[b + 3] = o.ang; }
    }
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, opsTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, OPS, 2, gl.RGBA, gl.FLOAT, opsBuf);
  }

  function drawPattern(t, w, h, count, samples, out = 0) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); gl.viewport(0, 0, w, h);
    gl.useProgram(PAT.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, opsTex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bases[cur].tex);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, canWarp ? warps[wcur].tex : opsTex);
    gl.uniform1i(PAT.u.uOps, 0); gl.uniform1i(PAT.u.uBase, 1); gl.uniform1i(PAT.u.uWarp, 3);
    gl.uniform1i(PAT.u.uWarped, warped ? 1 : 0); gl.uniform1i(PAT.u.uOut, out);
    gl.uniform1i(PAT.u.uCount, count); gl.uniform1i(PAT.u.uSamples, samples);
    gl.uniform2f(PAT.u.uTray, A, 1); gl.uniform2f(PAT.u.uRes, w, h); gl.uniform2f(PAT.u.uBaseSize, BW, BH);
    gl.uniform2f(PAT.u.uFlip, 1, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const settled = (o) => o.k === 1 || o.done;
  function settleAll() { for (const o of ops) if (o.k === 0 && !o.done) { o.r = o.to; o.hold = false; o.done = true; } dirty = true; }

  // Set the oldest, finished part of the list down into the base, and forget it.
  // A pass of the awl or the comb is set down only once it is over. Just ahead of a moving tine the paint is bunched up
  // tight, and it opens out again when the tine has gone by; set down while bunched, it would open out blurred.
  function bake(all) {
    let n = 0; while (n < ops.length && settled(ops[n]) && (all || !(ops[n].pass && ops[n].pass.open))) n++;
    // Drops are set down as colour. Passes are set down as warp, so that the colours themselves are left alone.
    while (n > 0) {
      const strokes = canWarp && ops[0].k === 1;
      let m = 1; if (canWarp) while (m < n && (ops[m].k === 1) === strokes) m++; else m = n;
      upload();
      if (strokes) { drawPattern(warps[1 - wcur], BW, BH, m, 1, 1); wcur = 1 - wcur; warped = true; }
      else { drawPattern(bases[1 - cur], BW, BH, m, 2); cur = 1 - cur; warped = false; }
      ops.splice(0, m); n -= m;
    }
  }

  function push(o) {
    if (ops.length >= OPS - 56) { settleAll(); bake(); if (ops.length >= OPS - 56) bake(true); }
    ops.push(o); paint = true; dirty = true; if (!calm) agit = 1; wake();
    return o;
  }

  // the tray crowds as it fills, and later drops open less
  const crowd = () => 0.55 + 0.45*Math.exp(-drops/45);

  function addDrop(x, y, r, c, hold, still, sq = 0) {
    drops++;
    if (!instant && !still) { rip[ripAt*4] = x; rip[ripAt*4 + 1] = y; rip[ripAt*4 + 2] = now(); rip[ripAt*4 + 3] = Math.min(1, r/0.07); ripAt = (ripAt + 1) % 6; }
    return push({ k: 0, x, y, r: instant ? r : 0.004, to: r, c, sq, seed: Math.random(), hold: hold && !instant, done: instant && !hold });
  }

  // A tine goes from where it was to (x, y), in steps short enough for the paint to follow. `s` is the pass it belongs to.
  function strokeTo(s, x, y, tine, ang, flush) {
    const dx = x - s.x, dy = y - s.y, d = Math.hypot(dx, dy), { lam, gap, grip } = tine, seg = lam*0.6;
    if (d < 1e-5 || (d < seg*0.5 && !flush)) return;
    const n = Math.ceil(d/seg);
    for (let i = 0; i < n; i++) push({ k: 1, x: s.x + dx*i/n, y: s.y + dy*i/n, mx: dx/n, my: dy/n, lam, gap, ang, grip, pass: s });
    s.x = x; s.y = y;
  }

  function clearTray() {
    ops.length = 0; paint = false; drops = 0; dirty = true; made = ''; warped = false;
    for (const b of bases) { gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
  }

  // ---------------------------------------------------------------- drawing
  const fx = { lay: 0, soak: 0, wipe: 0 };

  function renderPattern(fine) {
    upload();
    if (fine) { patW = canvas.width; patH = canvas.height; drawPattern(pat, patW, patH, ops.length, 4); }
    else { patW = Math.max(2, Math.round(canvas.width*scale)); patH = Math.max(2, Math.round(canvas.height*scale)); drawPattern(pat, patW, patH, ops.length, 1); }
  }

  function finish(mode, tex, sx, sy, flipX, flipY, t) {
    gl.useProgram(FIN.p);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(FIN.u.uPat, 2); gl.uniform2f(FIN.u.uPatScale, sx, sy); gl.uniform2f(FIN.u.uTray, A, 1);
    gl.uniform1i(FIN.u.uMode, mode); gl.uniform2f(FIN.u.uFlip, flipX, flipY);
    gl.uniform1f(FIN.u.uTime, t); gl.uniform1f(FIN.u.uAgit, agit);
    gl.uniform1f(FIN.u.uLay, fx.lay); gl.uniform1f(FIN.u.uSoak, fx.soak); gl.uniform1f(FIN.u.uWipe, fx.wipe);
    gl.uniform4fv(FIN.u.uRip, rip);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function present(t) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    finish(0, pat.tex, patW/canvas.width, patH/canvas.height, 1, 1, t);
  }

  // The sheet as a picture: the tray's pattern at print size, mirrored, as the paper took it.
  function makePrint() {
    const long = Math.min(coarse ? 1600 : 2000, gl.getParameter(gl.MAX_TEXTURE_SIZE));
    const w = Math.round(A >= 1 ? long : long*A), h = Math.round(A >= 1 ? long/A : long);
    const a = target(w, h), b = target(w, h);
    upload(); drawPattern(a, w, h, ops.length, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo); gl.viewport(0, 0, w, h);
    finish(1, a.tex, 1, 1, -1, -1, 0);
    const px = new Uint8ClampedArray(w*h*4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    free(a); free(b);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').putImageData(new ImageData(px, w, h), 0, 0);
    return c;
  }

  // ---------------------------------------------------------------- the loop: it runs only while something moves
  const tweens = [];
  const easeInOut = (u) => 0.5 - 0.5*Math.cos(Math.PI*u);
  function tween(ms, fn, ease = easeInOut) {
    return new Promise((done) => { tweens.push({ t0: now(), dur: ms/1000, fn, ease, done }); wake(); });
  }

  let raf = 0, last = 0, auto = null;
  function wake() { if (!raf) raf = requestAnimationFrame(frame); }

  function frame() {
    raf = 0;
    const t = now(), gap = t - last, dt = Math.min(0.05, Math.max(0.001, gap)); last = t;
    let live = false;

    if (auto) { live = true; if (auto.step(dt)) { const was = auto; auto = null; hand.hide(); if (was.done) was.done(); setBusy(busy); } }

    for (const o of ops) {
      if (o.k !== 0 || o.done) continue;
      if (o.hold) o.to = Math.min(DROP_MAX, o.to + dt*0.07);
      o.r += (o.to - o.r)*(1 - Math.exp(-dt/0.16));
      if (!o.hold && o.to - o.r < 0.0005) { o.r = o.to; o.done = true; }
      dirty = true; live = true;
    }

    for (let i = tweens.length - 1; i >= 0; i--) {
      const w = tweens[i], u = Math.min(1, (t - w.t0)/w.dur);
      w.fn(w.ease(u)); live = true;
      if (u >= 1) { tweens.splice(i, 1); w.done(); }
    }

    if (ops.length > BAKE_AT) bake();

    if (dirty) {
      renderPattern(false); dirty = false; refined = false; lastChange = t;
      // if the walk is too heavy for this machine, draw it smaller while things move; it is redrawn fine when they stop
      // (a gap longer than a tenth of a second is the browser resting the page, not the walk being heavy)
      if (gap < 0.1) { slow = gap > 0.03 ? slow + 1 : Math.max(0, slow - 1); if (slow > 14 && scale > 0.5) { scale -= 0.25; slow = 0; } }
    } else if (!refined && t - lastChange > 0.14) { renderPattern(true); refined = true; }

    agit *= Math.exp(-dt/1.1);
    let rings = false;
    for (let i = 0; i < 6; i++) if (rip[i*4 + 3] > 0 && t - rip[i*4 + 2] < 2.6) rings = true;
    present(t);
    if (live || !refined || agit > 0.004 || rings) wake();
  }

  // ---------------------------------------------------------------- fitting the tray to the page
  let trayH = 1;
  function fit() {
    const box = stage.getBoundingClientRect(), rim = bare ? 0 : parseFloat(getComputedStyle($('tray')).paddingLeft)*2;
    const h = Math.max(120, Math.floor(Math.min(box.height - rim, (box.width - rim)/A))), w = Math.floor(h*A);
    basin.style.width = w + 'px'; basin.style.height = h + 'px'; trayH = h;
    document.documentElement.style.setProperty('--tray-w', (w + rim) + 'px');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let cw = Math.round(w*dpr), ch = Math.round(h*dpr);
    const most = 3.4e6; if (cw*ch > most) { const k = Math.sqrt(most/(cw*ch)); cw = Math.round(cw*k); ch = Math.round(ch*k); }
    if (canvas.width !== cw || canvas.height !== ch || !pat) {
      canvas.width = cw; canvas.height = ch;
      if (pat) free(pat); pat = target(cw, ch);
      dirty = true;
    }
    wake();
  }
  new ResizeObserver(fit).observe(stage);
  fit();

  // ---------------------------------------------------------------- the hand over the water: a loaded brush, the awl, the comb
  const hand = (() => {
    const svg = $('hand'), dropEl = $('cDrop'), awlEl = $('cAwl'), combEl = $('cComb'), barEl = $('cBar'), tinesEl = $('cTines');
    const set = (el, o) => { for (const k in o) el.setAttribute(k, o[k]); };
    return {
      show(kind, x, y, ang, gap = COMB.gap) {
        const px = x*trayH, py = y*trayH;
        svg.classList.add('on');
        dropEl.style.display = kind === 'drop' ? '' : 'none';
        awlEl.style.display = kind === 'draw' ? '' : 'none';
        combEl.style.display = kind === 'comb' ? '' : 'none';
        if (kind === 'drop') set(dropEl, { cx: px, cy: py });
        else if (kind === 'draw') set(awlEl, { cx: px, cy: py });
        else {
          const g = gap*trayH, L = Math.ceil(2.2*trayH*Math.max(1, A)/g)*g, cx = Math.cos(ang), cy = Math.sin(ang);
          const ends = { x1: px - cx*L, y1: py - cy*L, x2: px + cx*L, y2: py + cy*L };
          set(barEl, ends); set(tinesEl, ends); tinesEl.setAttribute('stroke-dasharray', `0 ${g}`);
        }
      },
      hide() { svg.classList.remove('on'); },
      tint(hex) { dropEl.setAttribute('fill', hex); },
    };
  })();

  // ---------------------------------------------------------------- pigments and tools
  const HINTS = {
    drop: 'Tap the water to drop colour. Hold for a wider drop, drag to sprinkle.',
    draw: 'Drag the awl through the colours, back and forth.',
    comb: 'Drag the comb across the tray in one pass.',
  };
  let tool = 'drop', pig = [0.11, 0.21, 0.34], pigHex = '#1d3557';
  const say = (text) => { hintEl.textContent = text; };
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)/255);
  const pigs = [...document.querySelectorAll('input[name="pig"]')];
  const byName = Object.fromEntries(pigs.map((el) => [el.value, rgb(el.dataset.c)]));

  function pickPig(el) { pig = rgb(el.dataset.c); pigHex = el.dataset.c; hand.tint(pigHex); $('pigName').textContent = el.value; }
  for (const el of pigs) el.addEventListener('change', () => { pickPig(el); if (tool !== 'drop') { $('toolDrop').checked = true; pickTool('drop'); } });
  function pickTool(name) { tool = name; say(HINTS[name]); $('turn').textContent = name === 'drop' ? 'Sprinkle for me' : name === 'draw' ? 'Draw for me' : 'Comb for me'; }
  for (const el of document.querySelectorAll('input[name="tool"]')) el.addEventListener('change', () => pickTool(el.value));

  // ---------------------------------------------------------------- the visitor's hand
  let busy = false, ptr = null;
  let pen = null;                                   // the pass the marbler's own hand is in the middle of
  const halt = () => { auto = null; showing = false; if (pen) { pen.open = false; pen = null; } };
  let showing = false, next = 0, made = '';         // is a classic being made; which comes next; what is on the water, while nobody has touched it
  const at = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left)/r.height, (e.clientY - r.top)/r.height]; };
  const jitter = (v) => (Math.random() - 0.5)*v;

  canvas.addEventListener('pointerdown', (e) => {
    if (busy || e.button || ptr) return;
    e.preventDefault(); canvas.setPointerCapture(e.pointerId);
    if (auto) { halt(); hand.tint(pigHex); setBusy(busy); say(HINTS[tool]); }
    made = '';
    const [x, y] = at(e);
    ptr = { id: e.pointerId, x, y, ang: null, drop: null, open: true };
    if (tool === 'drop') ptr.drop = addDrop(x, y, DROP*crowd(), pig, true);
    hand.show(tool, x, y, Math.PI/2);
  });
  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = at(e);
    if (!ptr) { if (e.pointerType === 'mouse' && !busy && !auto) hand.show(tool, x, y, Math.PI/2); return; }
    if (e.pointerId !== ptr.id) return;
    if (tool === 'drop') {
      if (Math.hypot(x - ptr.x, y - ptr.y) > 0.055) {
        if (ptr.drop) { ptr.drop.hold = false; ptr.drop = null; }
        addDrop(x + jitter(0.03), y + jitter(0.03), (0.016 + Math.random()*0.028)*crowd(), pig, false);
        ptr.x = x; ptr.y = y;
      }
    } else if (tool === 'draw') strokeTo(ptr, x, y, AWL, 0);
    else {
      if (ptr.ang === null && Math.hypot(x - ptr.x, y - ptr.y) > 0.02) {
        // the comb is held square to the way it first moves, and keeps that line for the whole pass
        let a = Math.atan2(y - ptr.y, x - ptr.x); const q4 = Math.round(a/(Math.PI/2))*(Math.PI/2);
        if (Math.abs(a - q4) < 0.26) a = q4;
        ptr.ang = a + Math.PI/2;
      }
      if (ptr.ang !== null) strokeTo(ptr, x, y, COMB, ptr.ang);
    }
    hand.show(tool, x, y, ptr.ang === null ? Math.PI/2 : ptr.ang);
  });
  const lift = (e) => {
    if (!ptr || e.pointerId !== ptr.id) return;
    if (ptr.drop) ptr.drop.hold = false;
    if (e.pointerType !== 'mouse') hand.hide();
    ptr.open = false; ptr = null; wake();
  };
  canvas.addEventListener('pointerup', lift);
  canvas.addEventListener('pointercancel', lift);
  canvas.addEventListener('pointerleave', () => { if (!ptr && !auto) hand.hide(); });

  // ---------------------------------------------------------------- the marbler's own hand
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0)/4294967296; }; }

  // Drops of each colour in turn, each one falling where the water is emptiest.
  function scatter(groups, start, span, rand) {
    const list = [], pts = [];
    let sofar = 0; const total = groups.reduce((s, g) => s + g[1], 0);
    for (const [c, count, r] of groups) for (let i = 0; i < count; i++, sofar++) {
      let best = null, far = -1;
      for (let k = 0; k < 14; k++) {
        const x = 0.06 + rand()*(A - 0.12), y = 0.06 + rand()*0.88;
        let near = 9; for (const p of pts) near = Math.min(near, Math.hypot(p[0] - x, p[1] - y));
        if (near > far) { far = near; best = [x, y]; }
      }
      pts.push(best);
      list.push({ t: start + span*(sofar + rand()*0.6)/total, x: best[0], y: best[1], r: r*(0.8 + rand()*0.4), c });
    }
    let i = 0, el = 0;
    return { step(dt) { el += dt; while (i < list.length && list[i].t <= el) { const d = list[i++]; addDrop(d.x, d.y, d.r*crowd(), d.c, false); } return i >= list.length; } };
  }

  // The awl or the comb taken along one path after another, easing into and out of each like a hand.
  function draw(kind, paths, tine, ang, speed, rest = 0.14) {
    let i = 0, j = 0, t = 0, s = null, len = null, idle = 0;
    return { step(dt) {
      if (idle > 0) { idle -= dt; return false; }
      const P = paths[i];
      if (!s) {
        s = pen = { x: P[0][0], y: P[0][1], open: true }; t = 0; j = 0; len = [0];
        for (let k = 1; k < P.length; k++) len.push(len[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
      }
      const total = len[len.length - 1], dur = total/speed;
      t = Math.min(dur, t + dt);
      const d = easeInOut(t/dur)*total;
      while (j < P.length - 2 && len[j + 1] <= d) { j++; strokeTo(s, P[j][0], P[j][1], tine, ang, false); }
      const f = (d - len[j])/(len[j + 1] - len[j] || 1), x = P[j][0] + (P[j + 1][0] - P[j][0])*f, y = P[j][1] + (P[j + 1][1] - P[j][1])*f;
      strokeTo(s, x, y, tine, ang, t >= dur);
      if (!instant) hand.show(kind, x, y, ang, tine.gap);
      if (t >= dur) { s.open = false; s = pen = null; idle = rest; if (++i >= paths.length) return true; }
      return false;
    } };
  }

  // Gel-git, "come and go": parallel lines across the tray, each drawn the other way from the last.
  let along = A >= 1, drawn = 0, combed = 0;       // do the lines run along x; how many times each has been done
  function gelgit() {
    const n = 7, paths = [];
    for (let i = 0; i < n; i++) {
      const v = (i + 0.5)/n, back = i % 2 === 1;
      // each line starts and ends past the walls, so what the awl gathers is carried off the water
      paths.push(along ? [[back ? A + 0.1 : -0.1, v], [back ? -0.1 : A + 0.1, v]] : [[v*A, back ? 1.1 : -0.1], [v*A, back ? -0.1 : 1.1]]);
    }
    const run = draw('draw', paths, AWL, 0, along ? 2.1 : 1.6, 0.16);
    along = !along; drawn++;
    return run;
  }
  // Then the comb, once, square across the lines just drawn.
  function tarak() {
    const acrossX = along, back = combed % 2 === 1, shift = back ? COMB.gap/2 : 0;   // `along` was flipped after the last gel-git
    const path = acrossX
      ? [[back ? A + 0.06 : -0.06, 0.5 + shift], [back ? -0.06 : A + 0.06, 0.5 + shift]]
      : [[A/2 + shift, back ? 1.06 : -0.06], [A/2 + shift, back ? -0.06 : 1.06]];
    combed++;
    return draw('comb', [path], COMB, acrossX ? Math.PI/2 : 0, 0.55);
  }

  const ground = () => scatter([[byName['Indigo'], 7, 0.155], [byName['Yellow ochre'], 7, 0.125], [byName['Red ochre'], 6, 0.105], [byName['White'], 6, 0.07]], 0.35, 3.0, rng(12));

  function runNow(run) { const was = instant; instant = true; while (!run.step(1/60)) if (ops.length > BAKE_AT) bake(); instant = was; settleAll(); }

  $('turn').addEventListener('click', () => {
    if (busy || auto) return;
    if (tool !== 'drop' && !paint) { say('There is no colour on the water yet.'); return; }
    made = '';
    const run = tool === 'drop' ? scatter([[pig, 14, 0.06]], 0, 1.5, Math.random) : tool === 'draw' ? gelgit() : tarak();
    if (calm) { runNow(run); wake(); } else { auto = run; setBusy(busy); wake(); }
  });

  // ---------------------------------------------------------------- the classics, made from clean water by a practised hand
  const css = (c) => `rgb(${c.map((v) => Math.round(v*255)).join(' ')})`;
  const pale = (c, k) => c.map((v, i) => v + ([0.955, 0.94, 0.895][i] - v)*k);   // a colour let down with water
  const FINE = { lam: 0.028, gap: 0, grip: 0.97 }, BROAD = { lam: 0.05, gap: 0, grip: 0.95 }, POINT = { lam: 0.03, gap: 0, grip: 0.93 };
  const TEETH = { lam: 0.011, gap: 0.046, grip: 0.985 };

  // The ground: colour after colour shaken from a brush that sweeps along the top half of the tray and back along the bottom.
  // Each drop falls where the water is emptiest. A layer is [colour, how many, how wide, how uneven].
  function rain(layers, rand) {
    const list = [], pts = [];
    let t = 0.25;
    layers.forEach(([c, many, r, uneven = 0.3], li) => {
      const count = Math.round(many*A/1.5), drops = [];
      for (let i = 0; i < count; i++) {
        let best = null, far = -1;
        for (let k = 0; k < 14; k++) {
          const x = 0.04 + rand()*(A - 0.08), y = 0.04 + rand()*0.92;
          let near = 9; for (const p of pts) near = Math.min(near, Math.hypot(p[0] - x, p[1] - y));
          if (near > far) { far = near; best = [x, y]; }
        }
        pts.push(best);
        const [x, y] = best, band = y < 0.5 ? 0 : 1, first = (band === 0) === (li % 2 === 0);
        drops.push({ x, y, band, c, r: r*(1 - uneven + rand()*2*uneven), key: (first ? 0 : 4) + (first ? x : A - x) + (rand() - 0.5)*0.2 });
      }
      drops.sort((a, b) => a.key - b.key);
      const span = 0.55 + count*0.011, every = Math.ceil(count/5);
      drops.forEach((d, i) => { d.t = t + span*i/count; d.ring = i % every === 0; list.push(d); });
      t += span + 0.22;
    });
    let i = 0, el = 0, hx = list[0].x, hy = 0.25;
    return { step(dt) {
      el += dt;
      while (i < list.length && list[i].t <= el) { const d = list[i++]; addDrop(d.x, d.y, d.r, d.c, false, !d.ring, 0.75); }
      if (!instant && i < list.length) {
        const d = list[i], k = 1 - Math.exp(-dt/0.16);
        hx += (d.x - hx)*k; hy += ((d.band ? 0.75 : 0.25) - hy)*k;
        hand.tint(css(d.c)); hand.show('drop', hx, hy);
      }
      return i >= list.length;
    } };
  }

  // The first colour: one drop that opens right across the tray. Every colour after it lands on paint, not on water.
  function flood(c) {
    let dropped = false;
    return { step() { if (!dropped) { addDrop(A/2, 0.5, 0.52*Math.hypot(A, 1) + 0.06, c, false); dropped = true; if (!instant) { hand.tint(css(c)); hand.show('drop', A/2, 0.5); } } return ops.every(settled); } };
  }

  // a breath between two steps, long enough for the last drops to finish opening
  function rest(sec) { return { step(dt) { sec -= dt; return sec <= 0 && ops.every(settled); } }; }

  // gel-git from wall to wall, and the comb square across it, down the tray
  function comeAndGo(n, tine, speed) {
    const paths = [];
    for (let i = 0; i < n; i++) { const y = (i + 0.5)/n, back = i % 2 === 1; paths.push([[back ? A + 0.1 : -0.1, y], [back ? -0.1 : A + 0.1, y]]); }
    return draw('draw', paths, tine, 0, speed, 0.1);
  }
  const combDown = (tine, speed) => draw('comb', [[[A/2, -0.06], [A/2, 1.06]]], tine, 0, speed);

  // a spiral into each place, from the outside in, row after row
  function nests(tine, speed) {
    const cols = Math.round(A/0.25), rows = 4, R = 0.41*Math.min(A/cols, 1/rows), paths = [];
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const c = r % 2 ? cols - 1 - k : k, cx = (c + 0.5)/cols*A, cy = (r + 0.5)/rows, P = [];
      for (let q = 0; q <= 72; q++) { const w = q/72, a = -Math.PI/2 + w*2.4*2*Math.PI, rad = R*(1 - w); P.push([cx + Math.cos(a)*rad, cy + Math.sin(a)*rad]); }
      paths.push(P);
    }
    return draw('draw', paths, tine, 0, speed, 0.07);
  }

  // slow waves down the tray, across the lines of a gel-git
  function waves(tine, speed) {
    const m = Math.round(A/0.3), paths = [];
    for (let i = 0; i < m; i++) {
      const x0 = (i + 0.5)/m*A, back = i % 2 === 1, P = [];
      for (let q = 0; q <= 48; q++) { const w = q/48, y = (back ? 1 - w : w)*1.2 - 0.1; P.push([x0 + 0.085*Math.sin(y*3*Math.PI), y]); }
      paths.push(P);
    }
    return draw('draw', paths, tine, 0, speed, 0.14);
  }

  // Hatip: rings of colour dropped one inside the other, set out in rows, then pulled into hearts.
  function places() {
    const cols = Math.round(A/0.3), rows = 3, list = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) list.push({ x: (c + 0.5)/cols*A, y: (r + 0.5)/rows, c, r });
    return Object.assign(list, { cols, rows });
  }
  function rings(at, layers, beat) {
    const list = [];
    layers.forEach(([c, r], li) => { for (let i = 0; i < at.length; i++) { const p = at[i], k = (p.r + li) % 2 ? at.cols - 1 - p.c : p.c; list.push({ p: at[p.r*at.cols + k], c, r }); } });
    let n = 0, t = 0;
    return { step(dt) {
      t += dt;
      while (n < list.length && n*beat <= t) {
        const d = list[n++], p = d.p;
        addDrop(p.x, p.y, d.r, d.c, false, n % 3 !== 0);
        // this drop pushes every other ring a little further off, so keep track of where each one has gone
        for (const o of at) if (o !== p) { const dx = o.x - p.x, dy = o.y - p.y, k = Math.sqrt(1 + d.r*d.r/(dx*dx + dy*dy)); o.x = p.x + dx*k; o.y = p.y + dy*k; }
        if (!instant) { hand.tint(css(d.c)); hand.show('drop', p.x, p.y); }
      }
      return n >= list.length;
    } };
  }
  function hearts(at, tine, speed) {
    const paths = [];
    for (let c = 0; c < at.cols; c++) {
      const col = at.filter((p) => p.c === c), P = [[col[0].x, -0.1], ...col.map((p) => [p.x, p.y]), [col[col.length - 1].x, 1.1]];
      paths.push(c % 2 ? P.reverse() : P);
    }
    return draw('draw', paths, tine, 0, speed, 0.16);
  }

  const N = byName;
  const CLASSICS = [
    { name: 'Taraklı ebru', steps: (rand) => [
      { say: 'Taraklı, the combed pattern. First the ground: one colour opens across the whole tray.', make: () => flood(N['Lamp black']) },
      { say: 'Each colour after it is sprinkled over the last, and crowds it into veins.',
        make: () => rain([[N['Indigo'], 50, 0.07], [N['Red ochre'], 64, 0.055], [N['Yellow ochre'], 80, 0.045], [N['White'], 80, 0.03]], rand) },
      { make: () => rest(0.5) },
      { say: 'Gel-git, come and go. The awl crosses the tray, each line the other way from the last.', make: () => comeAndGo(12, FINE, 2.8) },
      { say: 'Then the comb, once, square across the lines.', make: () => combDown(TEETH, 0.5) },
    ] },
    { name: 'Bülbül yuvası', steps: (rand) => [
      { say: 'Bülbül yuvası, the nightingale’s nest. First the ground: one colour across the whole tray.', make: () => flood(N['Tobacco']) },
      { say: 'Then the others over it, in small stones.',
        make: () => rain([[N['Indigo'], 50, 0.066], [N['Turquoise'], 64, 0.053], [N['Yellow ochre'], 76, 0.042], [N['White'], 80, 0.028]], rand) },
      { make: () => rest(0.5) },
      { say: 'The awl turns a spiral into each place, from the outside in, row after row.', make: () => nests(FINE, 1.9) },
    ] },
    { name: 'Şal ebrusu', steps: (rand) => [
      { say: 'Şal, the shawl. First the ground: one colour across the whole tray.', make: () => flood(N['Lamp black']) },
      { say: 'Then the others, each sprinkled over the last.',
        make: () => rain([[N['Red ochre'], 50, 0.07], [N['Tobacco'], 56, 0.055], [N['Yellow ochre'], 70, 0.045], [N['White'], 76, 0.03]], rand) },
      { make: () => rest(0.5) },
      { say: 'Gel-git, come and go, to draw the colours out into fine lines.', make: () => comeAndGo(12, FINE, 2.8) },
      { say: 'Then a few slow waves across the lines. Too many and the colours break up.', make: () => waves(BROAD, 1.1) },
    ] },
    { name: 'Hatip ebrusu', steps: (rand, at = places()) => [
      { say: 'Hatip, named for a preacher of Hagia Sophia in the 1700s. First a pale ground.', make: () => flood(pale(N['Indigo'], 0.6)) },
      { make: () => rain([[pale(N['Turquoise'], 0.7), 54, 0.062], [pale(N['Indigo'], 0.8), 70, 0.05]], rand) },
      { make: () => rest(0.6) },
      { say: 'Rings of colour, each dropped inside the last, set out in rows.',
        make: () => rings(at, [[N['Red ochre'], 0.07], [N['Yellow ochre'], 0.052], [N['Indigo'], 0.036], [N['White'], 0.018]], 0.085) },
      { make: () => rest(0.5) },
      { say: 'The awl goes through each line of rings and pulls them into hearts.', make: () => hearts(at, POINT, 1.0) },
    ] },
    { name: 'Battal ebru', steps: (rand) => [
      { say: 'Battal, the oldest pattern: colour and nothing else. One colour opens across the whole tray.', make: () => flood(N['Indigo']) },
      { say: 'Each colour after it crowds the last into veins. No awl, no comb.',
        make: () => rain([[N['Green'], 30, 0.085, 0.45], [N['Yellow ochre'], 44, 0.065, 0.55], [N['Red ochre'], 50, 0.05, 0.55], [N['White'], 44, 0.036, 0.6]], rand) },
      { say: 'Last, a fine sprinkle of white.', make: () => rain([[N['White'], 150, 0.0075, 0.7]], rand) },
      { make: () => rest(0.4) },
    ] },
  ];

  // One step after another, each with its line of words.
  function recipe(c, rand, upto = 99) {
    const steps = c.steps(rand).slice(0, upto); let i = -1, run = null;
    return { step(dt) {
      if (!run) { if (++i >= steps.length) return true; if (steps[i].say && !instant) say(steps[i].say); run = steps[i].make(); }
      if (run.step(dt)) run = null;
      return false;
    } };
  }

  function shown(c) { showing = false; made = c.name; hand.tint(pigHex); say(`${c.name}. Lay the sheet to keep it, or work on it first.`); }

  $('classic').addEventListener('click', async () => {
    if (showing) { halt(); hand.hide(); hand.tint(pigHex); setBusy(busy); say('Stopped there. It is yours to go on with.'); return; }
    if (busy || auto) return;
    const c = CLASSICS[next++ % CLASSICS.length], rand = rng((Math.random()*2**31) | 0);
    if (paint) await skim();
    if (calm) { runNow(recipe(c, rand)); shown(c); wake(); return; }
    auto = recipe(c, rand); auto.done = () => shown(c);
    showing = true; setBusy(busy); wake();
  });

  // ---------------------------------------------------------------- skimming the water clean
  function setBusy(b) {
    busy = b;
    for (const el of [$('turn'), $('skim'), $('lay')]) el.disabled = b || !!auto;
    $('classic').disabled = b || (!!auto && !showing);
    $('classic').classList.toggle('on', showing); $('classicText').textContent = showing ? 'Stop here' : 'Show me a classic';
    document.body.classList.toggle('busy', b);
  }

  async function skim() {
    setBusy(true); hand.hide(); settleAll();
    if (!calm) await tween(900, (v) => { fx.wipe = v; });
    clearTray(); fx.wipe = 0;
    setBusy(false); wake();
  }
  $('skim').addEventListener('click', async () => {
    if (busy || auto) return;
    if (!paint) { say('The water is already clear.'); return; }
    await skim();
    $('toolDrop').checked = true; pickTool('drop'); say('The water is clear. ' + HINTS.drop);
  });

  // ---------------------------------------------------------------- laying the sheet, lifting it, keeping it
  const liftEl = $('lift'), turnEl = $('sheet'), backEl = $('back'), frontEl = $('front'), shadeEl = $('shade');
  const keptEl = $('kept'), railEl = $('rail'), sheets = [];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const day = () => { const d = new Date(); return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}`; };

  function keep(print, name) {
    const n = sheets.length + 1, rec = { n, date: day(), url: null, name };
    rec.ready = new Promise((done) => print.toBlob((blob) => { rec.url = URL.createObjectURL(blob); done(); }, 'image/png'));
    const thumb = document.createElement('canvas'); thumb.width = 320; thumb.height = Math.round(320*print.height/print.width);
    thumb.getContext('2d').drawImage(print, 0, 0, thumb.width, thumb.height);
    const li = document.createElement('li'), btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'kept'; btn.setAttribute('aria-label', `Sheet ${n}, open`);
    btn.style.setProperty('--tilt', ((n*37) % 5 - 2)*0.7 + 'deg');
    btn.append(thumb); li.append(btn); keptEl.append(li);
    btn.addEventListener('click', () => open(rec));
    sheets.push(rec); railEl.classList.add('has');
    $('count').textContent = n === 1 ? '1 sheet' : `${n} sheets`;
    return { rec, btn };
  }

  async function open(rec) {
    await rec.ready;
    const img = new Image(); img.src = rec.url; img.alt = `Sheet ${rec.n}, a marbled print`;
    $('viewPic').replaceChildren(img);
    $('viewCap').textContent = `Sheet ${rec.n} · ${rec.name ? rec.name + ' · ' : ''}${rec.date}`;
    $('save').href = rec.url; $('save').download = `ebru-sheet-${String(rec.n).padStart(2, '0')}.png`;
    $('view').showModal();
  }
  $('view').addEventListener('click', (e) => { if (e.target === $('view')) $('view').close(); });

  $('lay').addEventListener('click', async () => {
    if (busy || auto) return;
    if (!paint) { say('There is no colour on the water yet.'); return; }
    setBusy(true); hand.hide(); settleAll();
    renderPattern(true); refined = true; dirty = false;
    const print = makePrint(), name = made;
    say('The sheet goes down from one side, so no air is caught under it.');

    if (calm) {
      clearTray(); const { rec } = keep(print, name); await rec.ready; print.width = print.height = 0;
      setBusy(false); say(`Sheet ${rec.n} is drying. The water is clear again.`); wake();
      return;
    }

    await tween(1500, (v) => { fx.lay = v; });
    say('A moment for the paper to take the colour.');
    await tween(650, (v) => { fx.soak = v; }, (u) => u);

    // the laid sheet becomes a thing of its own, exactly where it lies, and the water under it is already clean
    present(now());
    backEl.width = canvas.width; backEl.height = canvas.height;
    backEl.getContext('2d').drawImage(canvas, 0, 0);
    const r = canvas.getBoundingClientRect();
    Object.assign(liftEl.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    frontEl.replaceChildren(print);
    liftEl.hidden = false;
    clearTray(); fx.lay = 0; fx.soak = 0; renderPattern(true); present(now());

    say('Lifted, and turned over.');
    const ease = 'cubic-bezier(.45,0,.15,1)';
    shadeEl.animate([{ opacity: 0, transform: 'translateY(0) scaleX(1)' }, { opacity: .5, transform: 'translateY(18px) scaleX(1)', offset: .3 },
      { opacity: .5, transform: 'translateY(18px) scaleX(.12)', offset: .65 }, { opacity: .5, transform: 'translateY(18px) scaleX(1)' }], { duration: 1900, easing: ease, fill: 'forwards' });
    await turnEl.animate([{ transform: 'translateY(0) scale(1) rotateY(0deg)' }, { transform: 'translateY(-3%) scale(1.05) rotateY(0deg)', offset: .3 },
      { transform: 'translateY(-3%) scale(1.05) rotateY(180deg)' }], { duration: 1900, easing: ease, fill: 'forwards' }).finished;
    await wait(850);

    // to the others, where it dries
    const { rec, btn } = keep(print, name);
    btn.style.opacity = 0; btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    await new Promise(requestAnimationFrame);
    const s = btn.getBoundingClientRect(), k = s.width/(r.width*1.05);
    const dx = s.left + s.width/2 - (r.left + r.width/2), dy = s.top + s.height/2 - (r.top + r.height/2) + k*0.03*r.height;
    shadeEl.animate([{ opacity: .5 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
    await liftEl.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${k})` }], { duration: 950, easing: 'cubic-bezier(.6,0,.1,1)', fill: 'forwards' }).finished;
    btn.style.opacity = '';
    liftEl.hidden = true;
    for (const el of [liftEl, turnEl, shadeEl]) for (const a of el.getAnimations()) a.cancel();
    frontEl.replaceChildren();
    rec.ready.then(() => { print.width = print.height = 0; });

    setBusy(false);
    $('toolDrop').checked = true; pickTool('drop');
    say(`Sheet ${rec.n} is drying. The water is clear for the next one.`);
    wake();
  });

  // ---------------------------------------------------------------- opening
  pickPig(pigs.find((el) => el.checked) || pigs[0]);
  pickTool('drop');
  // A classic at once, for the share image and for checking.
  function atOnce(i, seed) {
    halt(); clearTray();
    runNow(recipe(CLASSICS[i], rng(seed), +q.get('upto') || 99)); made = CLASSICS[i].name;
  }
  if (bare) atOnce(+q.get('classic') || 0, +q.get('seed') || 7);
  else if (calm) runNow(ground());
  else auto = ground();
  setBusy(false);
  wake();

  // for the share image and for checking: the tray's state from outside
  window.Ebru = { get ops() { return ops.length; }, get paint() { return paint; }, get scale() { return scale; },
    now(kind) { halt(); runNow(kind === 'draw' ? gelgit() : kind === 'comb' ? tarak() : ground()); setBusy(busy); wake(); },
    classic(i, seed) { atOnce(i, seed || 7); setBusy(busy); wake(); } };
})();
