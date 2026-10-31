// Paints a generated plate onto a canvas in the order a workshop would, and shows that canvas on a dish
// turned from a profile in WebGL: outline, ground, cobalt, turquoise, green, red, then the glaze.
(() => {
  'use strict';

  const HOLD = 12;            // seconds a finished plate stays before the next one starts
  const CLEAR = 1.1;          // seconds to wipe it back to bare clay
  const INK_TIME = 8.5;       // seconds of outline
  const COLOR_TIME = 2.6;     // seconds per colour
  const GLAZE_TIME = 3.2;
  const STAGES = [['ground', 'Ground'], ['blue', 'Cobalt'], ['turq', 'Turquoise'], ['green', 'Green'], ['red', 'Red']];

  const q = new URLSearchParams(location.search);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.getElementById('stage');
  const stepEl = document.getElementById('step');
  const titleEl = document.getElementById('title');
  const detailEl = document.getElementById('detail');
  const nextBtn = document.getElementById('next');
  const barEl = document.getElementById('bar');

  const SIZE = Math.min(2048, (window.WebGL2RenderingContext && (innerWidth < 700)) ? 1536 : 2048);
  const SCALE = SIZE / 2 / 1.02;
  const px = ([x, y]) => [SIZE / 2 + x * SCALE, SIZE / 2 + y * SCALE];

  const makeCanvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const paint = makeCanvas(SIZE);          // what is on the dish now
  const ctx = paint.getContext('2d');
  const buf = makeCanvas(SIZE);            // the plate as it will look when this stage is done
  const bctx = buf.getContext('2d');
  const inkLayer = makeCanvas(SIZE);       // every outline, with hidden lines removed
  const ictx = inkLayer.getContext('2d');
  const reliefC = makeCanvas(1024);        // how far the paint stands proud of the surface
  const rctx = reliefC.getContext('2d');

  /* ---------- Paint ---------- */

  const mix = (a, b, t) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
  };

  // A tile of slightly uneven colour: pigment settling thick and thin under the brush.
  function pigment(hex, light, dark, rand) {
    const c = makeCanvas(512), x = c.getContext('2d');
    x.fillStyle = hex; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) {
      const X = rand() * 512, Y = rand() * 512, r = 8 + rand() * 46;
      const g = x.createRadialGradient(X, Y, 0, X, Y, r);
      const col = rand() < 0.5 ? light : dark;
      g.addColorStop(0, col); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
      x.fillStyle = g; x.fillRect(X - r, Y - r, r * 2, r * 2);
    }
    return c;
  }

  let plate, pigments, pooled;

  function prepare(seed) {
    plate = Iznik.generate(seed);
    let s = seed | 0;
    const rand = () => (s = (s * 1664525 + 1013904223) | 0, (s >>> 0) / 4294967296);
    const P = plate.palette;
    pigments = {};
    pooled = {};
    for (const [k, l, d] of [['blue', 0.1, 0.12], ['turq', 0.06, 0.05], ['green', 0.07, 0.06], ['red', 0.05, 0.06]]) {
      const t = pigment(P[k], `rgba(255,255,255,${l * 0.5})`, `rgba(0,0,30,${d * 0.5})`, rand);
      pigments[k] = ctx.createPattern(t, 'repeat');
      pooled[k] = mix(P[k], '#080a1c', 0.5);
    }
    pigments.white = P.body;

    for (const sh of plate.shapes) {
      const P2 = new Path2D();
      sh.pts.forEach((p, i) => { const [x, y] = px(p); i ? P2.lineTo(x, y) : P2.moveTo(x, y); });
      if (!sh.open) P2.closePath();
      sh.path = P2;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const p of sh.pts) { const [x, y] = px(p); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      sh.box = [x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8];
      sh.size = Math.max(x1 - x0, y1 - y0);
      sh.reach = Math.hypot(x1 - x0, y1 - y0) * 1.1 + 4;
      const a = px(sh.at);
      sh.ax = a[0]; sh.ay = a[1];
      sh.stage = sh.ground ? 'ground' : sh.fill;
    }

    // All the outlines. Each shape first clears what lies under it, so nothing shows through.
    ictx.clearRect(0, 0, SIZE, SIZE);
    ictx.lineCap = ictx.lineJoin = 'round';
    ictx.strokeStyle = P.ink;
    for (const sh of plate.shapes) {
      if (!sh.open && sh.fill && !sh.ground) {
        ictx.globalCompositeOperation = 'destination-out';
        ictx.fillStyle = '#000';
        ictx.fill(sh.path);
        ictx.globalCompositeOperation = 'source-over';
      }
      if (sh.ink) { ictx.lineWidth = sh.ink * SCALE; ictx.stroke(sh.path); }
    }

    // Relief. The red was a thick slip that stands up under the glaze; the others sit nearly flush.
    rctx.setTransform(1, 0, 0, 1, 0, 0);
    rctx.fillStyle = '#000'; rctx.fillRect(0, 0, 1024, 1024);
    rctx.setTransform(1024 / SIZE, 0, 0, 1024 / SIZE, 0, 0);
    for (const sh of plate.shapes) {
      if (sh.open || !sh.fill) continue;
      const level = sh.ground ? 0 : { red: 255, blue: 62, green: 62, turq: 62, white: 0 }[sh.fill];
      rctx.fillStyle = `rgb(${level},${level},${level})`;
      rctx.fill(sh.path);
    }
    rctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // The whole plate as it stands once colours up to `done` are on. Anything later is left as reserved clay.
  function renderStage(done) {
    const P = plate.palette;
    bctx.globalAlpha = 1;
    bctx.fillStyle = P.body;
    bctx.fillRect(0, 0, SIZE, SIZE);
    for (const sh of plate.shapes) {
      if (sh.open || !sh.fill) continue;
      const on = done.has(sh.stage);
      if (sh.ground && !on) continue;
      bctx.fillStyle = on ? pigments[sh.fill] : P.body;
      bctx.fill(sh.path);
      if (on && sh.fill !== 'white' && sh.size > 14 && !sh.ground) {
        bctx.save();
        bctx.clip(sh.path);
        bctx.strokeStyle = pooled[sh.fill];
        bctx.lineJoin = 'round';
        for (const [w, a] of [[26, 0.07], [13, 0.1], [6, 0.13]]) {
          bctx.lineWidth = w; bctx.globalAlpha = a;
          bctx.stroke(sh.path);
        }
        bctx.restore();
      }
    }
    bctx.globalAlpha = 1;
    bctx.drawImage(inkLayer, 0, 0);
  }

  /* ---------- The order of work ---------- */

  let phase, clock, jobs, cursor, stageIndex, doneSet, glaze, clearing, hold, dirty, reliefDirty;

  function startInk() {
    phase = 'ink'; clock = 0; cursor = 0;
    setStep('Outline');
    ctx.fillStyle = plate.palette.body;
    ctx.fillRect(0, 0, SIZE, SIZE);
    jobs = [];
    const inked = plate.shapes.filter((s) => s.ink);
    const lengths = inked.map((s) => s.pts.length);
    const total = lengths.reduce((a, b) => a + b, 0);
    let t = 0;
    const span = INK_TIME * 0.9;
    for (const s of inked) {
      const share = s.pts.length / total;
      const dur = Math.max(0.1, Math.min(0.75, share * span * 7));
      jobs.push({ s, t0: t, dur, last: 0 });
      t += share * span;
    }
    dirty = true;
  }

  function stepInk(dt) {
    clock += dt;
    const P = plate.palette;
    ctx.strokeStyle = P.ink;
    ctx.lineCap = ctx.lineJoin = 'round';
    let finished = true;
    for (let i = cursor; i < jobs.length; i++) {
      const j = jobs[i];
      if (clock < j.t0) { finished = false; break; }
      const s = j.s, n = s.open ? s.pts.length : s.pts.length + 1;
      const u = Math.min(1, (clock - j.t0) / j.dur), e = u * u * (3 - 2 * u), to = Math.ceil(e * (n - 1));
      if (j.last === 0 && !s.open && s.fill && !s.ground) { ctx.fillStyle = P.body; ctx.fill(s.path); }
      if (to > j.last) {
        ctx.lineWidth = s.ink * SCALE;
        ctx.beginPath();
        const a = px(s.pts[j.last % s.pts.length]);
        ctx.moveTo(a[0], a[1]);
        for (let k = j.last + 1; k <= to; k++) { const b = px(s.pts[k % s.pts.length]); ctx.lineTo(b[0], b[1]); }
        ctx.stroke();
        j.last = to;
      }
      if (u < 1) finished = false;
      else if (i === cursor) cursor++;
    }
    dirty = true;
    if (finished) { stageIndex = -1; doneSet = new Set(['white']); nextStage(); }
  }

  function nextStage() {
    for (stageIndex++; stageIndex < STAGES.length; stageIndex++) {
      const key = STAGES[stageIndex][0];
      const here = plate.shapes.filter((s) => s.stage === key && !s.open);
      if (!here.length) continue;
      doneSet.add(key);
      renderStage(doneSet);
      phase = 'color'; clock = 0; cursor = 0;
      setStep(STAGES[stageIndex][1]);
      // The brush works across the plate from one side, shapes starting in turn.
      const a = Math.random() * 6.28, cx = Math.cos(a), cy = Math.sin(a);
      const key2 = (s) => s.ax * cx + s.ay * cy;
      here.sort((x, y) => key2(x) - key2(y));
      const big = key === 'ground';
      jobs = here.map((s, i) => ({ s, t0: big ? i * 0.3 : (i / here.length) * COLOR_TIME * 0.72, dur: big ? 2 : Math.min(0.9, 0.22 + s.size / 500), last: 0 }));
      return;
    }
    phase = 'glaze'; clock = 0;
    setStep('Glaze');
    reliefDirty = true;
  }

  function stepColor(dt) {
    clock += dt;
    let finished = true;
    for (let i = cursor; i < jobs.length; i++) {
      const j = jobs[i];
      if (clock < j.t0) { finished = false; break; }
      const s = j.s, u = Math.min(1, (clock - j.t0) / j.dur), r = s.reach * (1 - Math.pow(1 - u, 2.2));
      const [x, y, w, h] = s.box;
      ctx.save();
      ctx.clip(s.path);
      if (u < 1) {
        // A wet edge: the disc that grows from the brush's first touch, not quite round.
        ctx.beginPath();
        for (let k = 0; k < 20; k++) {
          const a = k / 20 * 6.2832, rr = r * (1 + 0.09 * Math.sin(a * 3 + j.t0 * 40) + 0.05 * Math.sin(a * 7 + j.t0 * 90));
          ctx[k ? 'lineTo' : 'moveTo'](s.ax + Math.cos(a) * rr, s.ay + Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.clip();
      }
      ctx.drawImage(buf, x, y, w, h, x, y, w, h);
      ctx.restore();
      if (u < 1) finished = false;
      else if (i === cursor) cursor++;
    }
    dirty = true;
    if (finished) { ctx.drawImage(buf, 0, 0); nextStage(); }
  }

  function setStep(s) {
    if (stepEl.textContent !== s) stepEl.textContent = s;
  }

  function begin(seed) {
    prepare(seed);
    titleEl.textContent = plate.title;
    detailEl.textContent = `${plate.detail}. ${plate.era}.`;
    glaze = 0; clearing = 0; hold = 0;
    barEl.style.transform = 'scaleX(0)';
    uploadRelief();
    if (reduced) {
      doneSet = new Set(['white', ...STAGES.map((s) => s[0])]);
      renderStage(doneSet);
      ctx.drawImage(buf, 0, 0);
      glaze = 1; phase = 'done'; dirty = true;
      setStep('Finished');
    } else startInk();
  }

  const freshSeed = () => (Math.random() * 1e6) | 0;
  let seedNext = q.has('seed') ? +q.get('seed') : freshSeed();
  function restart() {
    if (phase === 'clear') return;
    if (reduced) { begin(freshSeed()); return; }
    phase = 'clear'; clearing = 0; setStep('Clearing');
  }
  nextBtn.addEventListener('click', restart);

  function step(dt) {
    if (phase === 'ink') stepInk(dt);
    else if (phase === 'color') stepColor(dt);
    else if (phase === 'glaze') {
      clock += dt;
      glaze = Math.min(1, clock / GLAZE_TIME);
      if (glaze >= 1) { phase = 'done'; hold = 0; setStep('Finished'); }
    } else if (phase === 'done' && !reduced) {
      hold += dt;
      barEl.style.transform = `scaleX(${Math.min(1, hold / HOLD)})`;
      if (hold >= HOLD) restart();
    } else if (phase === 'clear') {
      clearing = Math.min(1, clearing + dt / CLEAR);
      if (clearing >= 1) { seedNext = freshSeed(); begin(seedNext); clearing = 0; }
    }
  }

  /* ---------- The dish ---------- */

  const canvas = document.getElementById('gl');
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!gl) {
    // No WebGL: show the painting itself, flat and round.
    paint.className = 'flat';
    canvas.replaceWith(paint);
    uploadRelief = () => {};
    begin(seedNext);
    let last = performance.now();
    (function tick(now) { step(Math.min(0.05, (now - last) / 1000)); last = now; requestAnimationFrame(tick); })(last);
    return;
  }

  const VERT = `#version 300 es
  in vec3 aPos; in vec3 aNor; in float aTop;
  uniform mat4 uVP, uModel; uniform float uSeed;
  out vec3 vP, vN; out vec2 vUv; out float vTop;
  void main(){
    vec3 p = aPos;
    float a = atan(p.z, p.x), r = length(p.xz);
    // No dish comes off the wheel perfectly round.
    float w = 1. + (.0055*sin(2.*a + uSeed) + .0035*sin(3.*a + uSeed*2.1) + .002*sin(5.*a - uSeed)) * smoothstep(.3, 1., r);
    p.xz *= w;
    p.y += (.006*sin(2.*a + uSeed*1.7)) * smoothstep(.55, 1., r);
    vec4 wp = uModel * vec4(p, 1.);
    vP = wp.xyz;
    vN = mat3(uModel) * aNor;
    vUv = .5 + aPos.xz / (2. * 1.02);
    vTop = aTop;
    gl_Position = uVP * wp;
  }`;

  const FRAG = `#version 300 es
  precision highp float;
  in vec3 vP, vN; in vec2 vUv; in float vTop;
  uniform sampler2D uPaint, uRelief;
  uniform vec3 uEye; uniform vec3 uBody;
  uniform float uGlaze, uClear, uFloor;
  out vec4 o;
  const vec3 LIGHT = normalize(vec3(-.52, .78, -.36));

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*noise(p); p=p*2.03+7.1; a*=.5; } return s; }
  vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }

  // The fine crackle of an old glaze: distance to the nearest cell wall.
  float craze(vec2 p){
    vec2 i = floor(p), f = fract(p); float d1 = 9., d2 = 9.;
    for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
      vec2 g = vec2(x,y), c = g + vec2(hash(i+g), hash(i+g+3.1)) - f;
      float d = dot(c,c);
      if(d<d1){ d2=d1; d1=d; } else if(d<d2) d2=d;
    }
    return sqrt(d2)-sqrt(d1);
  }

  // A room: dim walls, a bright tall window up and to the left, a softer lamp to the right.
  vec3 room(vec3 R){
    float y = R.y*.5+.5;
    vec3 c = mix(vec3(.018,.02,.024), vec3(.11,.115,.125), smoothstep(.1,1.,y));
    vec2 q = R.xz / (abs(R.y)+.45);
    vec2 w = (q - vec2(-.05,-.455)) / vec2(.022,.036);
    float e = .1;
    float win = smoothstep(1.,1.-e,abs(w.x)) * smoothstep(1.,1.-e,abs(w.y));
    win *= smoothstep(.02,.07,abs(w.x)) * smoothstep(.02,.07,abs(w.y+.18));
    c += vec3(1.,.98,.93) * win * 5.2 * step(0., R.y);
    vec2 l = (q - vec2(.8,.2)) / .55;
    c += vec3(1.,.86,.68) * exp(-dot(l,l)*2.) * .34 * step(0., R.y);
    return c;
  }

  void main(){
    vec3 V = normalize(uEye - vP);
    if(uFloor > .5){
      // The table, dark oiled wood lit from the window side, with the dish's soft shadow.
      vec2 p = vP.xz;
      float grain = fbm(vec2(p.x*1.2, p.y*17.)+fbm(p*1.6)*2.);
      float pool = exp(-dot(p+vec2(.5,.3), p+vec2(.5,.3))*.1);
      vec3 c = mix(vec3(.0075,.0065,.0065), vec3(.022,.017,.015), grain) * (.3 + 1.2*pool);
      float d = length((p - vec2(.13,.095))*vec2(1.,1.04));
      c *= .08 + .92*smoothstep(.8, 1.42, d);
      float contact = length(p); c *= .55 + .45*smoothstep(.72, 1.1, contact);
      vec3 R = reflect(-V, vec3(0,1,0));
      c += room(R) * .012 * pow(1.-max(V.y,0.),3.);
      c *= 1. - .45*dot(vUv*0.,vUv*0.);
      o = vec4(pow(c, vec3(1./2.2)), 1.);
      return;
    }

    vec2 uv = vUv;
    float r = length(uv-.5)*2.*1.02;
    vec3 N = normalize(vN);
    if(!gl_FrontFacing) N = -N;

    // How far the glaze wave has come: from the middle to the edge.
    float wave = uGlaze * 1.5 - r*.42;
    float g = smoothstep(.0,.34,wave) * vTop + (1.-vTop)*uGlaze;
    g *= 1.-uClear;

    vec2 tx = vec2(1./1024.);
    float hL=0., hR=0., hD=0., hU=0.;
    for(float s=1.; s<=2.5; s+=1.5){
      hL+=texture(uRelief,uv-vec2(tx.x*s,0)).r; hR+=texture(uRelief,uv+vec2(tx.x*s,0)).r;
      hD+=texture(uRelief,uv-vec2(0,tx.y*s)).r; hU+=texture(uRelief,uv+vec2(0,tx.y*s)).r;
    }
    vec2 grad = vec2(hR-hL, hU-hD) * vTop * g;

    // Glaze flows: broad waves, a fine orange-peel skin, and it pulls away from the raised paint.
    vec2 w1 = vec2(fbm(uv*7.+3.), fbm(uv*7.+9.))-.47;
    vec2 w2 = vec2(noise(uv*95.), noise(uv*95.+5.))-.5;
    vec3 Ng = normalize(N + vec3(w1.x,0.,w1.y)*.075 + vec3(w2.x,0.,w2.y)*.012 - vec3(grad.x,0.,grad.y)*.26);
    vec3 Nb = normalize(N + vec3(w2.x,0.,w2.y)*.06 - vec3(grad.x,0.,grad.y)*.1);

    // Under glass the painting softens slightly; bare, it is dry and pale.
    vec3 raw = texture(uPaint, uv).rgb;
    vec3 soft = textureLod(uPaint, uv, 2.2).rgb;
    float clay = noise(uv*420.)*.5+noise(uv*160.)*.5;
    vec3 fired = lin(mix(raw, soft, .12));
    vec3 dry = lin(mix(raw, vec3(dot(raw,vec3(.3,.55,.15))), .32)*.74 + uBody*.26) * (.93+.09*clay);
    vec3 a = mix(dry, fired*vec3(.985,1.,.985), g);
    a = mix(a, lin(uBody)*(.93+.09*clay), uClear);
    if(vTop<.5) a = lin(uBody)*.92;

    // Glaze gathers a faint blue-green in the deep of the rim and at the foot.
    float film = fbm(uv*11.);
    float cr = craze(uv*vec2(46.)+film*1.2) ;
    float crack = 1.-smoothstep(.0,.035,cr);
    crack *= smoothstep(.34,.62,fbm(uv*5.+2.));
    a *= 1. - crack*.13*g;
    float pin = smoothstep(.993,.998,hash(floor(uv*900.)))*g*smoothstep(.45,.6,noise(uv*14.));
    a *= 1.-pin*.5;

    // Light.
    float nl = max(dot(Nb,LIGHT),0.);
    float wrap = max((dot(Nb,LIGHT)+.3)/1.3,0.);
    float rimShade = 1.;
    if(vTop>.5){
      // The raised rim throws a soft shadow down into the well on the side nearest the window.
      float lean = dot(normalize(vUv-.5), normalize(vec2(-.52,-.36)));
      rimShade = 1.-.22*smoothstep(.56,.74,r)*(1.-smoothstep(.74,.82,r))*smoothstep(-.2,.9,lean);
    }
    vec3 diffuse = a * (vec3(.2,.21,.235) + vec3(1.08,1.03,.96)*mix(nl,wrap,.55)*.98) * rimShade;
    if(vTop<.5) diffuse *= .4;

    vec3 R = reflect(-V, Ng);
    float c = max(dot(Ng,V),0.);
    float F = .045 + .955*pow(1.-c,5.);
    vec3 spec = room(R) * F * g * 1.4;
    vec3 H = normalize(LIGHT+V);
    spec += vec3(1.,.97,.92) * pow(max(dot(Ng,H),0.),900.) * 1.1 * g;
    vec3 col = diffuse + spec;

    // Bare clay carries only a broad, chalky sheen.
    col += (1.-g) * vec3(.03) * pow(max(dot(Nb,H),0.),10.);
    col = col/(1.+col*.11);
    o = vec4(pow(col, vec3(1./2.2)), 1.);
  }`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const U = {};
  for (const n of ['uVP', 'uModel', 'uSeed', 'uPaint', 'uRelief', 'uEye', 'uBody', 'uGlaze', 'uClear', 'uFloor']) U[n] = gl.getUniformLocation(prog, n);

  // The dish's profile, centre outward over the top and back underneath: radius, height, top of the dish or not.
  const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const PROFILE = [];
  const topH = (r) => 0.004 * (1 - r / 0.72) + 0.128 * smooth(0.68, 0.815, r) + 0.03 * smooth(0.8, 1, r);
  for (let i = 0; i <= 150; i++) { const r = i / 150 * 0.99; PROFILE.push([r, topH(r), 1]); }
  for (let i = 1; i <= 8; i++) { const a = i / 8 * Math.PI; PROFILE.push([0.99 + 0.012 * Math.sin(a), topH(0.99) - 0.012 * (1 - Math.cos(a)), 1]); }
  for (let i = 1; i <= 24; i++) { const t = i / 24, r = 0.99 - t * 0.37; PROFILE.push([r, topH(r) - 0.024 - 0.03 * t, 0]); }
  PROFILE.push([0.62, -0.062, 0], [0.6, -0.062, 0], [0.58, -0.03, 0], [0, -0.03, 0]);

  const SEG = 220, pos = [], nor = [], tops = [], idx = [];
  const m = PROFILE.length;
  for (let i = 0; i < m; i++) {
    const a = PROFILE[Math.max(i - 1, 0)], b = PROFILE[Math.min(i + 1, m - 1)];
    let tr = b[0] - a[0], th = b[1] - a[1];
    const d = Math.hypot(tr, th) || 1; tr /= d; th /= d;
    for (let j = 0; j <= SEG; j++) {
      const t = j / SEG * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      pos.push(PROFILE[i][0] * c, PROFILE[i][1], PROFILE[i][0] * s);
      nor.push(-th * c, tr, -th * s);
      tops.push(PROFILE[i][2]);
    }
  }
  for (let i = 0; i < m - 1; i++) for (let j = 0; j < SEG; j++) {
    const a = i * (SEG + 1) + j, b = a + SEG + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }

  function vao(p, n, t, ix) {
    const v = gl.createVertexArray();
    gl.bindVertexArray(v);
    const attr = (name, data, size) => {
      const l = gl.getAttribLocation(prog, name);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0);
    };
    attr('aPos', p, 3); attr('aNor', n, 3); attr('aTop', t, 1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(ix), gl.STATIC_DRAW);
    return v;
  }
  const dishVao = vao(pos, nor, tops, idx);
  const F = 30, Y = -0.064;
  const floorVao = vao([-F, Y, -F, F, Y, -F, -F, Y, F, F, Y, F], [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], [1, 1, 1, 1], [0, 2, 1, 1, 2, 3]);

  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  function texture(unit, loc, filterMin) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterMin);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    gl.uniform1i(loc, unit);
    return t;
  }
  const paintTex = texture(0, U.uPaint, gl.LINEAR_MIPMAP_LINEAR);
  const reliefTex = texture(1, U.uRelief, gl.LINEAR);

  function uploadPaint() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, paintTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, paint);
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  function uploadRelief() {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, reliefTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, reliefC);
  }

  /* ---------- Camera and matrices ---------- */

  const mul = (a, b) => {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[r + 4] * b[c * 4 + 1] + a[r + 8] * b[c * 4 + 2] + a[r + 12] * b[c * 4 + 3];
    }
    return o;
  };
  const perspective = (fov, aspect, n, f) => {
    const t = 1 / Math.tan(fov / 2);
    return new Float32Array([t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]);
  };
  const lookAt = (e, c) => {
    const norm = (v) => { const d = Math.hypot(...v); return v.map((x) => x / d); };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const z = norm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = norm(cross([0, 1, 0], z)), y = cross(z, x);
    return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]);
  };
  const rotX = (a) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); };
  const rotZ = (a) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); };

  /* ---------- Pointer and frame ---------- */

  let tx = 0, ty = 0, cx = 0, cy = 0;
  addEventListener('pointermove', (e) => {
    tx = (e.clientX / innerWidth - 0.5) * 2;
    ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = stage.clientWidth, h = stage.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  addEventListener('resize', resize);
  resize();

  const hexToVec = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clearColor(0.05, 0.05, 0.05, 1);

  begin(seedNext);

  let last = performance.now(), T = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now; T += dt;
    step(dt);
    if (dirty) { uploadPaint(); dirty = false; }

    cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
    const sway = reduced ? 0 : 1;
    const ax = (cy * 0.075 + Math.sin(T * 0.31) * 0.022 * sway), az = (cx * -0.09 + Math.sin(T * 0.23) * 0.028 * sway);

    const aspect = canvas.width / canvas.height;
    const fov = 20 * Math.PI / 180;
    // Fit the dish with room for the caption: the wider of what height and width each ask for.
    const need = Math.max(1.22 / Math.tan(fov / 2), 1.14 / (Math.tan(fov / 2) * aspect));
    const el = 62 * Math.PI / 180;
    const look = [0, 0, 0.04];
    const eye = [0, Math.sin(el) * need, Math.cos(el) * need + look[2]];

    const VP = mul(perspective(fov, aspect, 0.5, 80), lookAt(eye, look));
    const Model = mul(rotX(ax), rotZ(az));

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(U.uVP, false, VP);
    gl.uniform3fv(U.uEye, eye);
    gl.uniform3fv(U.uBody, hexToVec(plate.palette.body));
    gl.uniform1f(U.uGlaze, glaze);
    gl.uniform1f(U.uClear, phase === 'clear' ? clearing * clearing * (3 - 2 * clearing) : 0);
    gl.uniform1f(U.uSeed, plate.seed % 7);

    gl.disable(gl.CULL_FACE);
    gl.uniform1f(U.uFloor, 1);
    gl.uniformMatrix4fv(U.uModel, false, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
    gl.bindVertexArray(floorVao);
    // The table writes no depth: a tilted dish dips below its plane and must still draw whole over it.
    gl.depthMask(false);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
    gl.depthMask(true);

    gl.uniform1f(U.uFloor, 0);
    gl.uniformMatrix4fv(U.uModel, false, Model);
    gl.bindVertexArray(dishVao);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // For the share image and for looking at one plate at leisure: ?seed=N&finish skips to the end.
  if (q.has('finish')) {
    document.body.classList.add('bare');
    doneSet = new Set(['white', ...STAGES.map((s) => s[0])]);
    renderStage(doneSet);
    ctx.drawImage(buf, 0, 0);
    glaze = 1; phase = 'hold-forever'; dirty = true;
    setStep('Finished');
  }
})();
