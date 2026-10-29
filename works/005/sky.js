// The sky: a gradient from the haze at the horizon to the zenith, a glow and a disk for the sun, wisps of high
// cloud, and an overcast ceiling when the year was flat or falling. It also lights the land, as an environment map.

import * as THREE from 'three';
import { NOISE, HAZE } from './glsl.js';

export function createSky(U) {
  const material = new THREE.ShaderMaterial({
    uniforms: U,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0);
        gl_Position = p.xyww; // always on the far plane
        gl_Position.z = gl_Position.w * 0.99999;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uHorizonSun;
      uniform vec3 uSunCol;
      uniform float uHigh;
      uniform float uCloudDark;
      uniform float uDisk;
      uniform float uSkyCover;
      uniform float uSkyTime;
      ${NOISE}
      ${HAZE}
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        float sw = sunward(d);
        vec3 horizon = mix(uHorizon, uHorizonSun, sw);
        vec3 col = mix(horizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.38));
        col = mix(hazeColor(d), col, smoothstep(-0.01, 0.1, h));
        float s = max(dot(d, uSunDir), 0.0);
        col += uSunGlow * pow(s, 48.0) * 0.9;
        if (h > 0.0) {
          vec2 uv = d.xz / (h + 0.08);
          float w = fbm(uv * vec2(0.8, 2.4) + vec2(uSkyTime * 0.004, 0.0));
          float wisps = smoothstep(0.55, 0.8, w) * uHigh * smoothstep(0.0, 0.25, h);
          col = mix(col, mix(horizon * 1.05, uSunCol * 1.3, pow(s, 3.0) * 0.6 + 0.25), wisps * 0.6);
          float m = fbm(uv * 0.5 + vec2(uSkyTime * 0.002, uSkyTime * 0.001));
          float ceiling = smoothstep(1.0 - uSkyCover, 1.0 - uSkyCover + 0.35, m) * smoothstep(-0.02, 0.15, h);
          vec3 grey = mix(horizon, horizon * 0.5, uCloudDark) * (0.82 + 0.36 * m) + uSunGlow * pow(s, 4.0) * 0.35;
          col = mix(col, grey, ceiling);
        }
        col += uSunCol * smoothstep(0.99975, 0.9999, s) * uDisk * 18.0;
        col = mix(col, uNightCol, uNight);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;

  // The sky as light for the land, without the night blend.
  const envScene = new THREE.Scene();
  const envMesh = new THREE.Mesh(mesh.geometry, material);
  envMesh.frustumCulled = false;
  envScene.add(envMesh);
  let env = null;
  function environment(renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const night = U.uNight.value;
    U.uNight.value = 0;
    env?.dispose();
    env = pmrem.fromScene(envScene, 0.02, 0.1, 10);
    U.uNight.value = night;
    pmrem.dispose();
    return env.texture;
  }

  return { mesh, environment };
}
