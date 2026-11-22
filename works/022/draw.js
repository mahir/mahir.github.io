// Draws the sheet. The river's whole run is worked out before anything is shown, and every
// cell of the sheet keeps the years the river was on it, so the map of any year is one
// question asked of every pixel: when was the river last here, as of that year? That is
// what lets the years be dragged back.
//
// The cells go to the graphics card as two textures of whole numbers (see Sheet in
// river.js). The shader reads the four cells around a pixel, works out each one's state in
// the year asked for, and blends them, so banks come out smooth. Then it inks the sheet as
// a printed map is inked: flat colors, hatching on the later centuries, a line along each
// bank, fine lines where the river stood every twenty years.
(function (root) {
  'use strict';

  // One ink for each century, in the order a printer might pick them to keep neighbors
  // apart: [r, g, b, hatch] where hatch 0 is flat, 1 is ruled one way and 2 the other.
  const INKS = [
    [169, 197, 143, 0], [240, 222, 142, 0], [217, 106, 92, 0], [156, 196, 226, 0], [234, 176, 106, 0],
    [242, 194, 196, 0], [130, 182, 166, 0], [202, 184, 216, 0], [239, 160, 136, 0], [214, 224, 160, 0],
    [240, 222, 142, 1], [156, 196, 226, 2], [217, 106, 92, 1], [169, 197, 143, 2], [242, 194, 196, 1],
    [234, 176, 106, 2], [202, 184, 216, 1], [130, 182, 166, 2], [214, 224, 160, 1], [239, 160, 136, 2],
  ];

  const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;
uniform usampler2D uHead;   // per cell: where its visits start (24 bits) and how many (8 bits)
uniform usampler2D uPool;   // the visits: first look (10 bits), last look (10 bits), loop band (3 bits)
uniform sampler2D uInks;    // one ink per century
uniform vec2 uRes;
uniform vec4 uView;         // the sheet on the canvas: left, top, width, height in pixels
uniform float uTurn;        // 1 when the valley runs down the screen instead of across it
uniform float uT;           // the look asked for; a look is uSet.y years
uniform float uProbe;       // a look whose river is to be drawn over the map, or -1
uniform float uPx;          // device pixels to one CSS pixel
uniform vec2 uGrid;         // cells across and down
uniform vec4 uSet;          // cells per width, years per look, years for a loop's water to close up, and for its clay to set
uniform vec3 uWaves[9];     // the valley's walls: nine waves, each a height, a wave number and a phase
uniform vec4 uValley;       // the valley's middle and its half-width
uniform vec4 uHard[4];      // ground hard from the start: each oval's middle and two radii, in widths
uniform vec2 uTilt[4];      // and the cosine and sine of its turn
out vec4 o;

const vec3 PAPER = vec3(0.937, 0.906, 0.824);
const vec3 INK = vec3(0.165, 0.145, 0.125);
const vec3 WATER = vec3(0.995, 0.990, 0.975);
const vec3 POND = vec3(0.839, 0.902, 0.910);
const vec3 RED = vec3(0.722, 0.224, 0.153);

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

// one cell in the year asked for: how much of it is river, how much a pond in an old loop,
// the ink of its ground (times whether it has any), when the river left it, and whether
// the river was on it at the probed look
void cell(ivec2 c, float rule1, float rule2, out float water, out float pond, out vec4 land, out float when, out float ghost, out float clay) {
  c = clamp(c, ivec2(0), ivec2(uGrid) - 1);
  uint h = texelFetch(uHead, c, 0).r;
  int n = int(h >> 24u), at = int(h & 0xFFFFFFu);
  int t0 = int(floor(uT)), pr = int(uProbe);
  uint va = 0u, vb = 0u;
  bool ha = false, hb = false;
  ghost = 0.0;
  for (int k = 0; k < 32; k++) {
    if (k >= n) break;
    int i = at + k;
    uint v = texelFetch(uPool, ivec2(i & 4095, i >> 12), 0).r;
    int from = int(v & 1023u), to = int((v >> 10u) & 1023u);
    if (from <= t0) { va = v; ha = true; }
    if (from <= t0 + 1) { vb = v; hb = true; }
    if (uProbe >= 0.0 && from <= pr && pr <= to) ghost = 1.0;
  }
  int toA = int((va >> 10u) & 1023u), toB = int((vb >> 10u) & 1023u);
  float wa = ha && toA >= t0 ? 1.0 : 0.0, wb = hb && toB >= t0 + 1 ? 1.0 : 0.0;
  water = mix(wa, wb, uT - float(t0));
  when = float(toA);
  land = vec4(0.0); pond = 0.0; clay = 0.0;
  if (ha) {
    float years = when * uSet.y, since = max(uT - when, 0.0) * uSet.y;
    vec4 ink = texelFetch(uInks, ivec2(clamp(int(years / 100.0), 0, 19), 0), 0);
    float ruled = ink.a > 0.75 ? rule2 : ink.a > 0.25 ? rule1 : 0.0;
    vec3 tint = mix(ink.rgb, ink.rgb * 0.8, ruled);
    // old ground is printed paler, so the last few centuries stand out
    land = vec4(mix(tint, mix(PAPER, tint, 0.36), smoothstep(150.0, 1300.0, since)), 1.0);
    int band = int(va >> 20u);
    if (band > 0) {
      float lasts = uSet.z * pow(float(band) / 6.0, 1.5);
      pond = 1.0 - smoothstep(0.8, 1.0, since / lasts);
      clay = smoothstep(0.0, uSet.w, since);
    }
  }
}

// the valley's two walls at a place along it, in widths from the sheet's middle line: as walls() in river.js
vec2 walls(float x) {
  float s[9];
  for (int i = 0; i < 9; i++) s[i] = uWaves[i].x * sin(uWaves[i].y * x + uWaves[i].z);
  float both = s[0] + s[1] + s[2];
  return vec2(uValley.x + uValley.y + both + s[3] + s[4] + s[5], uValley.x - uValley.y + both - s[6] - s[7] - s[8]);
}

// a line along the edge of something: v is its share of each of the four cells around the
// pixel, b their blend, lat how many pixels apart those cells are. Where cells are a pixel
// apart the line is every pixel whose four cells disagree; where they are farther apart it
// is a band about a pixel wide along the middle of the blend.
float edge(vec4 v, float b, float lat) {
  float differ = max(max(v.x, v.y), max(v.z, v.w)) - min(min(v.x, v.y), min(v.z, v.w));
  float half_ = clamp(0.62 / lat, 0.16, 0.5);
  float band = (1.0 - smoothstep(half_ * 0.55, half_, abs(b - 0.5))) * step(0.001, differ);
  return mix(smoothstep(0.1, 0.6, differ), band, clamp(lat - 1.0, 0.0, 1.0));
}

void main() {
  vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = (fc - uView.xy) / uView.zw;
  vec2 past = max(-uv, uv - 1.0) * uView.zw;
  float outside = max(past.x, past.y);
  if (outside > 0.0) {
    // the sheet's border: a heavy line a little way out
    float a = step(5.0 * uPx, outside) * step(outside, 7.0 * uPx);
    o = vec4(INK * a, a);
    return;
  }

  // along the valley and across it, 0..1
  vec2 g = uTurn > 0.5 ? vec2(uv.y, 1.0 - uv.x) : uv;
  vec2 size = uGrid / uSet.x;             // the sheet in widths
  vec2 w = g * size;
  float across = w.y - size.y * 0.5;       // widths from the sheet's middle line

  // the paper: a grid of squares, sixteen to the sheet's length
  vec3 col = PAPER;
  float pxw = uView.z / (uTurn > 0.5 ? size.y : size.x);   // pixels to one width
  float square = size.x / 16.0;
  vec2 sq = abs(fract(w / square + 0.5) - 0.5) * square * pxw;
  float squares = 1.0 - smoothstep(0.5 * uPx, 1.0 * uPx, min(sq.x, sq.y));
  // the valley's walls, half a width beyond where the river's middle can go, and the
  // ground rising behind them in a few lines that thin out
  vec2 wl = walls(w.x);
  float d = max(across - wl.x, wl.y - across) - 0.5;
  float side = step(0.0, across);
  float wob = sin(w.x * 0.55 + side * 1.7) * 0.6 + sin(w.x * 1.31 + side * 4.0) * 0.4;
  float rim = 1.0 - smoothstep(0.4 * uPx, 1.0 * uPx, abs(d) * pxw);
  float pitch = max(0.44, 6.0 * uPx / pxw);
  float u = (d - 0.07 * wob * d) / pitch;
  float rise = (1.0 - smoothstep(0.3 * uPx, 0.85 * uPx, abs(fract(u + 0.5) - 0.5) * pitch * pxw)) * step(0.5, u) * (1.0 - smoothstep(2.5, 7.5, u));
  col *= 1.0 - 0.04 * step(0.0, d);
  col = mix(col, INK, 0.11 * squares);
  col = mix(col, INK, max(0.5 * rim, 0.3 * rise));

  // stipple, in CSS pixels: coarse for ground that was hard from the start, fine for clay
  vec2 cp = fc / uPx;
  vec2 st = vec2(cp.x + cp.y, cp.x - cp.y) * 0.7071;
  float dots = 1.0 - smoothstep(0.75, 1.35, length(fract(st / 5.0) - 0.5) * 5.0);
  float specks = 1.0 - smoothstep(0.45, 0.95, length(fract(cp / 3.4 + vec2(0.0, 0.5 * floor(cp.x / 3.4))) - 0.5) * 3.4);
  float hard = 0.0;
  for (int i = 0; i < 4; i++) {
    if (uHard[i].z <= 0.0) continue;
    vec2 q = vec2(w.x, across) - uHard[i].xy;
    vec2 e = vec2(q.x * uTilt[i].x + q.y * uTilt[i].y, q.y * uTilt[i].x - q.x * uTilt[i].y) / uHard[i].zw;
    hard = max(hard, 1.0 - smoothstep(0.72, 1.0, dot(e, e)));
  }
  col = mix(col, INK, 0.5 * dots * hard);

  // hatching, ruled in CSS pixels so it stays the same on every screen
  float rule1 = 1.0 - smoothstep(0.3, 0.75, abs(fract((cp.x + cp.y) / 6.5) - 0.5) * 6.5);
  float rule2 = 1.0 - smoothstep(0.3, 0.75, abs(fract((cp.x - cp.y) / 6.5) - 0.5) * 6.5);

  // the four cells around the pixel; where cells are finer than pixels, four a pixel apart
  float stride = max(1.0, uSet.x / pxw), lat = max(1.0, pxw / uSet.x);
  vec2 cf = (g * uGrid - 0.5) / stride;
  vec2 fl = floor(cf), f = cf - fl;
  ivec2 ca = ivec2(fl * stride + 0.5), cb = ivec2((fl + 1.0) * stride + 0.5);
  float w0, w1, w2, w3, p0, p1, p2, p3, t0, t1, t2, t3, g0, g1, g2, g3, y0, y1, y2, y3;
  vec4 l0, l1, l2, l3;
  cell(ca, rule1, rule2, w0, p0, l0, t0, g0, y0);
  cell(ivec2(cb.x, ca.y), rule1, rule2, w1, p1, l1, t1, g1, y1);
  cell(ivec2(ca.x, cb.y), rule1, rule2, w2, p2, l2, t2, g2, y2);
  cell(cb, rule1, rule2, w3, p3, l3, t3, g3, y3);
  vec4 k = vec4((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y);
  float water = dot(k, vec4(w0, w1, w2, w3));
  float pond = dot(k, vec4(p0, p1, p2, p3));
  float ghost = dot(k, vec4(g0, g1, g2, g3));
  vec4 land = l0 * k.x + l1 * k.y + l2 * k.z + l3 * k.w;

  // ground the river has been on
  if (land.a > 0.0) {
    col = mix(col, land.rgb / land.a, land.a);
    col = mix(col, INK, 0.07 * squares * land.a);
    // a fine line where the bank stood every twenty years, as on a sheet of bar ridges
    if (land.a > 0.999 && water < 0.001) {
      float x = dot(k, vec4(t0, t1, t2, t3)) * uSet.y / 20.0, fw = fwidth(x);
      float ring = (1.0 - smoothstep(0.0, 1.2 * fw + 0.01, abs(fract(x) - 0.5))) * (1.0 - smoothstep(0.25, 0.7, fw));
      col = mix(col, INK, 0.13 * ring * (1.0 - pond));
    }
    // hard ground stays hard under the ink; clay that has set in an old loop is speckled
    col = mix(col, INK, 0.42 * dots * hard * land.a);
    col = mix(col, INK, 0.28 * specks * dot(k, vec4(y0, y1, y2, y3)) * (1.0 - pond));
  }
  // water standing in a loop the river left
  col = mix(col, POND, pond);
  col = mix(col, INK, 0.36 * edge(vec4(p0, p1, p2, p3), pond, lat));
  // the river itself
  col = mix(col, WATER, water);
  col = mix(col, INK, 0.92 * edge(vec4(w0, w1, w2, w3), water, lat));
  // the river of another year, drawn over the map
  if (uProbe >= 0.0) {
    col = mix(col, WATER, 0.42 * ghost);
    col = mix(col, RED, 0.95 * edge(vec4(g0, g1, g2, g3), ghost, lat));
  }
  // paper is not quite even
  col *= 1.0 + (hash(floor(fc / uPx * 1.5)) - 0.5) * 0.028;
  // the sheet's own edge
  float lip = 1.0 - smoothstep(0.6 * uPx, 1.4 * uPx, -outside);
  col = mix(col, INK, 0.8 * lip);
  o = vec4(col, 1.0);
}`;

  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }

  function Painter(canvas) {
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
    if (!gl) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {};
    for (const name of ['uHead', 'uPool', 'uInks', 'uRes', 'uView', 'uTurn', 'uT', 'uProbe', 'uPx', 'uGrid', 'uSet', 'uWaves', 'uValley', 'uHard', 'uTilt']) U[name] = gl.getUniformLocation(prog, name);

    const tex = (unit) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    const head = tex(0), pool = tex(1), inks = tex(2);
    gl.uniform1i(U.uHead, 0); gl.uniform1i(U.uPool, 1); gl.uniform1i(U.uInks, 2);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const bytes = new Uint8Array(INKS.length * 4);
    INKS.forEach((c, i) => bytes.set([c[0], c[1], c[2], c[3] * 127], i * 4));
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, inks);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, INKS.length, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    let cols = 1, rows = 1, C = null;

    return {
      gl,
      // a finished Sheet from river.js, and the character of its river
      sheet(sh, character) {
        cols = sh.cols; rows = sh.rows; C = character;
        gl.uniform3fv(U.uWaves, new Float32Array(C.waves.flat()));
        gl.uniform4f(U.uValley, C.off, C.half, 0, 0);
        const hard = new Float32Array(16), tilt = new Float32Array(8);
        C.hard.slice(0, 4).forEach((k, i) => { hard.set(k.slice(0, 4), i * 4); tilt[i * 2] = Math.cos(k[4]); tilt[i * 2 + 1] = Math.sin(k[4]); });
        gl.uniform4fv(U.uHard, hard); gl.uniform2fv(U.uTilt, tilt);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, head);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32UI, cols, rows, 0, gl.RED_INTEGER, gl.UNSIGNED_INT, sh.head);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, pool);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32UI, 4096, sh.pool.length / 4096, 0, gl.RED_INTEGER, gl.UNSIGNED_INT, sh.pool);
      },
      // view: { x, y, w, h, turn } in canvas pixels, y down; t and probe in looks
      draw(view, t, probe, px) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(U.uRes, canvas.width, canvas.height);
        gl.uniform4f(U.uView, view.x, view.y, view.w, view.h);
        gl.uniform1f(U.uTurn, view.turn ? 1 : 0);
        gl.uniform1f(U.uT, t);
        gl.uniform1f(U.uProbe, probe == null ? -1 : probe);
        gl.uniform1f(U.uPx, px || 1);
        gl.uniform2f(U.uGrid, cols, rows);
        gl.uniform4f(U.uSet, C.per, C.every, C.pond, C.set);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    };
  }

  root.RiverPainter = Painter;
  root.RiverInks = INKS;
})(typeof self !== 'undefined' ? self : this);
