// The cloud deck: four thin layers at the height the weather sets, each thinner than the one below, lit from above, dark from below, fading softly
// where a peak breaks through and away toward the edges. Peaks above the deck stand in sunlight over a sea of cloud.

import * as THREE from 'three';
import { NOISE, CLOUDS, HAZE } from './glsl.js';

export function createClouds(U) {
  const layers = [0, 1, 2, 3].map((layer) => {
    const material = new THREE.ShaderMaterial({
      uniforms: { ...U, uLayer: { value: layer }, uOpacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vWorld;
        uniform float uLayer;
        uniform float uOpacity;
        uniform float uCloudDark;
        uniform float uSunI;
        uniform vec3 uSunCol;
        uniform vec3 uAmb;
        uniform sampler2D uHeight;
        uniform vec4 uRect;
        uniform vec2 uCenter;
        uniform float uRadius;
        ${NOISE}
        ${CLOUDS}
        ${HAZE}
        void main() {
          vec2 xz = vWorld.xz + vec2(uLayer * 311.0, uLayer * -173.0);
          float lift = uLayer * 0.045;
          float d = cloudDensity(xz, lift);
          if (d < 0.01) discard;
          vec3 sd = normalize(uSunDir);
          float toward = cloudDensity(xz + sd.xz / max(sd.y, 0.1) * 150.0, lift);
          // thicker toward the sun means this side is in the cloud's own shadow
          float lit = clamp(0.62 + (d - toward) * 2.2, 0.18, 1.2);
          vec3 top = (uAmb * 0.72 + uSunCol * uSunI * 0.3 * lit) * (0.74 + 0.09 * uLayer);
          top = mix(top * vec3(0.8, 0.84, 0.92), top, smoothstep(0.05, 0.7, d)); // thin edges cooler and darker
          // from below: bright and thin at the edges on a fine day, a dark ceiling in a storm
          vec3 under = uAmb * mix(1.05, 0.3, uCloudDark) * (0.78 + 0.25 * (1.0 - d)) + uSunCol * uSunI * 0.05 * (1.0 - uCloudDark) * (1.0 - d);
          vec3 col = cameraPosition.y > vWorld.y ? top : under;
          float ground = texture2D(uHeight, (vWorld.xz - uRect.xy) * uRect.zw).r;
          float a = smoothstep(0.0, 0.85, d) * uOpacity;
          a *= smoothstep(0.0, 160.0, vWorld.y - ground);
          a *= 1.0 - smoothstep(uRadius * 0.55, uRadius, length(vWorld.xz - uCenter));
          a *= smoothstep(0.015, 0.09, abs(normalize(vWorld - cameraPosition).y)); // edge on, the haze takes over
          gl_FragColor = vec4(haze(col, vWorld), a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), material);
    mesh.frustumCulled = false;
    return mesh;
  });

  function place(L, base) {
    layers.forEach((m, i) => {
      m.scale.set(5 * L, 1, 5 * L);
      m.position.set(L / 2, base + i * 70, -0.2 * L);
    });
  }

  function update(camY, opacity) {
    layers.forEach((m, i) => {
      m.material.uniforms.uOpacity.value = opacity * (0.8 - 0.1 * i);
      // the nearer layers draw last
      m.renderOrder = camY > m.position.y ? 1 + i : 5 - i;
    });
  }

  return { layers, place, update };
}
