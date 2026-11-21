// Draws the crystal. The whole fall is grown before anything is shown, and every cell
// remembers how far down it froze, so the picture at any moment of the fall is one
// question asked of every pixel: was this ice there yet? That is what lets the fall be
// dragged back up.
//
// The cells go to the graphics card as a texture, one texel per hexagon. The shader finds
// the three cells around a pixel, blends them, and lights the ice the way a microscope
// does on a dark field: flat ice stays dim, edges and ridges catch the light.
(function (root) {
  'use strict';

  const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uCells;   // RG: when the cell froze (16 bits, 0..1 of the fall), B: how much it held at the end
uniform sampler2D uLut;     // along the fall: RGB the color of that layer's temperature, A the thickness gained by then
uniform vec2 uRes;
uniform vec2 uCenter;       // in pixels
uniform float uUnit;        // pixels per cell
uniform float uR;           // grid radius in cells
uniform float uT;           // how far down the fall, 0..1
uniform float uProbe;       // a moment of the fall to mark, or -1
uniform float uFresh;       // 1 while falling: newly frozen ice glows
out vec4 o;

const float NEVER = 9.0;

vec3 cell(ivec2 qr) {
  ivec2 c = qr + ivec2(int(uR));
  int n = int(uR) * 2 + 1;
  if (c.x < 0 || c.y < 0 || c.x >= n || c.y >= n) return vec3(NEVER, 0.0, 0.0);
  vec4 t = texelFetch(uCells, c, 0);
  float born = (t.r * 255.0 * 256.0 + t.g * 255.0) / 65535.0;
  if (t.a < 0.5) born = NEVER;
  return vec3(born, t.b, 0.0);
}

// what one cell adds at this moment: x how much of it is there, y its height
vec2 seen(vec3 c) {
  float cov = clamp((uT - c.x) / 0.004 + 0.5, 0.0, 1.0);
  float age = clamp(uT - c.x, 0.0, 1.0);
  float tall = texture(uLut, vec2(uT, 0.5)).a - texture(uLut, vec2(clamp(c.x, 0.0, 1.0), 0.5)).a;
  return vec2(cov, cov * (0.55 + 1.5 * sqrt(age) + 1.6 * c.y + 3.2 * max(tall, 0.0)));
}

void main() {
  // an arm points straight up: the lattice's long axis runs along the screen's y
  vec2 P = (gl_FragCoord.xy - uCenter) / uUnit;
  float r = P.x / 0.8660254;
  float q = P.y - r * 0.5;
  float fq = floor(q), fr = floor(r), a = q - fq, b = r - fr;
  ivec2 i0, i1 = ivec2(int(fq) + 1, int(fr)), i2 = ivec2(int(fq), int(fr) + 1);
  vec3 w;
  if (a + b < 1.0) { i0 = ivec2(int(fq), int(fr)); w = vec3(1.0 - a - b, a, b); }
  else { i0 = ivec2(int(fq) + 1, int(fr) + 1); w = vec3(a + b - 1.0, 1.0 - b, 1.0 - a); }
  vec3 c0 = cell(i0), c1 = cell(i1), c2 = cell(i2);
  vec2 s0 = seen(c0), s1 = seen(c1), s2 = seen(c2);

  float cover = dot(w, vec3(s0.x, s1.x, s2.x));
  float H = dot(w, vec3(s0.y, s1.y, s2.y));
  float aa = clamp(fwidth(cover) * 0.75, 0.002, 0.5);
  float alpha = smoothstep(0.5 - aa, 0.5 + aa, cover);
  if (alpha <= 0.0) { o = vec4(0.0); return; }

  vec3 ws = w * vec3(s0.x, s1.x, s2.x);
  float wsum = max(ws.x + ws.y + ws.z, 1e-4);
  vec3 tint = (ws.x * texture(uLut, vec2(clamp(c0.x, 0.0, 1.0), 0.5)).rgb
             + ws.y * texture(uLut, vec2(clamp(c1.x, 0.0, 1.0), 0.5)).rgb
             + ws.z * texture(uLut, vec2(clamp(c2.x, 0.0, 1.0), 0.5)).rgb) / wsum;

  // when this spot froze, and how long ago
  float bI = dot(ws, vec3(c0.x, c1.x, c2.x)) / wsum;
  float age = clamp(uT - bI, 0.0, 1.0);

  // the slope of the ice, per cell
  vec2 g = vec2(dFdx(H), dFdy(H)) * uUnit;
  float steep = min(length(g), 2.0);
  vec3 n = normalize(vec3(-g * 0.6, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.6, 0.66));
  float lit = max(dot(n, L), 0.0);
  float spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 30.0);

  // growth rings: a fine line each time the fall has gone another step, as in a tree
  float x = bI * 24.0, fw = fwidth(x);
  float ring = (1.0 - smoothstep(0.0, 1.3 * fw + 0.02, abs(fract(x) - 0.5))) * (1.0 - smoothstep(0.3, 0.8, fw));

  float rim = 1.0 - smoothstep(0.5, 0.92, cover);
  float lum = 0.3 + 0.2 * sqrt(age) + 0.5 * lit * steep + 0.3 * ring + 0.85 * rim;
  vec3 col = tint * lum + vec3(0.92, 0.97, 1.0) * (0.3 * rim + 0.45 * spec * steep);
  alpha *= mix(0.86, 1.0, max(rim, ring));

  if (uFresh > 0.0) {
    float f0 = exp(-max(uT - c0.x, 0.0) / 0.012), f1 = exp(-max(uT - c1.x, 0.0) / 0.012), f2 = exp(-max(uT - c2.x, 0.0) / 0.012);
    float fresh = (ws.x * f0 + ws.y * f1 + ws.z * f2) / wsum;
    col += vec3(1.0, 0.93, 0.78) * fresh * 0.32 * uFresh;
  }
  if (uProbe >= 0.0) {
    float m0 = exp(-pow((c0.x - uProbe) / 0.007, 2.0)), m1 = exp(-pow((c1.x - uProbe) / 0.007, 2.0)), m2 = exp(-pow((c2.x - uProbe) / 0.007, 2.0));
    col += vec3(1.0, 0.82, 0.48) * (ws.x * m0 + ws.y * m1 + ws.z * m2) / wsum * 0.9;
  }
  o = vec4(col * alpha, alpha);
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
    for (const name of ['uCells', 'uLut', 'uRes', 'uCenter', 'uUnit', 'uR', 'uT', 'uProbe', 'uFresh']) U[name] = gl.getUniformLocation(prog, name);

    const tex = (unit, filter) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    const cells = tex(0, gl.NEAREST), lut = tex(1, gl.LINEAR);
    gl.uniform1i(U.uCells, 0); gl.uniform1i(U.uLut, 1);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    let R = 0;

    return {
      gl,
      // grid from Reiter.Grid, crystal from Sky.grow: unfold the wedge onto the whole grid
      crystal(grid, crystal) {
        R = grid.R;
        const n = 2 * R + 1, px = new Uint8Array(n * n * 4);
        if (crystal) {
          for (let r = -R; r <= R; r++) for (let q = -R; q <= R; q++) {
            if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) > R) continue;
            const f = grid.fold(q, r), i = grid.index.get(f[0] * 4096 + f[1]);
            if (i === undefined || !crystal.ice[i]) continue;
            const o = ((r + R) * n + (q + R)) * 4, b = Math.round(Math.max(0, Math.min(1, crystal.born[i])) * 65535);
            px[o] = b >> 8; px[o + 1] = b & 255;
            px[o + 2] = Math.max(0, Math.min(255, Math.round((crystal.s[i] - 1) * 160)));
            px[o + 3] = 255;
          }
        }
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, cells);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, n, n, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
      },
      // 256 steps along the fall: [r, g, b, thickness] each 0..255
      lut(bytes) {
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, lut);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
      },
      // view: { cx, cy, unit } in canvas pixels, y down
      draw(view, t, probe, fresh) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(U.uRes, canvas.width, canvas.height);
        gl.uniform2f(U.uCenter, view.cx, canvas.height - view.cy);
        gl.uniform1f(U.uUnit, view.unit);
        gl.uniform1f(U.uR, R);
        gl.uniform1f(U.uT, t);
        gl.uniform1f(U.uProbe, probe == null ? -1 : probe);
        gl.uniform1f(U.uFresh, fresh || 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    };
  }

  root.SnowPainter = Painter;
})(typeof self !== 'undefined' ? self : this);
