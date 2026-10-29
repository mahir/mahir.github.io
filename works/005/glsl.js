// Shader code the sky, the land and the clouds share, so they agree on noise, on where the clouds are and on the
// haze between you and everything. All of it works in linear light, before tone mapping.

export const NOISE = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
// 0 to 1
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, -9.7); a *= 0.5; }
  return s / 0.96875;
}
float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, -9.7); a *= 0.5; }
  return s / 0.875;
}
`;

// The cloud deck's coverage at a point on the ground plane, 0 to 1. The land uses it for cloud shadows.
export const CLOUDS = /* glsl */ `
uniform float uCover;
uniform float uTime;
uniform float uCloudScale;
uniform vec2 uWind;
// lift raises the threshold: higher layers of the deck are thinner, so a stack of them reads as puffs
float cloudDensity(vec2 xz, float lift) {
  vec2 p = xz / uCloudScale + uWind * uTime;
  float n = fbm(p) * 0.72 + fbm(p * 3.3 + 7.3) * 0.28;
  float threshold = 0.72 - 0.5 * uCover + lift;
  return smoothstep(threshold, threshold + 0.18, n);
}
`;

// Aerial perspective: haze that thins with height, warmer toward the sun. Night blends everything to the dark the
// opening chart is drawn on.
export const HAZE = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uHaze;
uniform vec3 uHazeSun;
uniform vec3 uSunGlow;
uniform float uBeta;
uniform float uHazeH;
uniform float uNight;
uniform vec3 uNightCol;
// how much a direction looks toward the sun, across the horizon
float sunward(vec3 dir) {
  vec2 a = dir.xz, b = uSunDir.xz;
  if (dot(a, a) < 1e-6 || dot(b, b) < 1e-6) return 0.0;
  return pow(max(dot(normalize(a), normalize(b)), 0.0), 4.0);
}
vec3 hazeColor(vec3 dir) {
  return mix(uHaze, uHazeSun, sunward(dir)) + uSunGlow * pow(max(dot(dir, uSunDir), 0.0), 6.0);
}
vec3 haze(vec3 col, vec3 world) {
  vec3 v = world - cameraPosition;
  float dist = length(v);
  vec3 dir = v / max(dist, 1e-3);
  float b = 1.0 / uHazeH;
  float k = dir.y * b * dist;
  float depth = uBeta * exp(-cameraPosition.y * b) * dist * (abs(k) > 1e-4 ? (1.0 - exp(-k)) / k : 1.0);
  float t = 1.0 - exp(-depth);
  col = mix(col, hazeColor(dir), t);
  return mix(col, uNightCol, uNight);
}
`;
