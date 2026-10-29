// The land: the heightfield from the worker as a mesh, painted by altitude and slope (grass and forest low, rock on
// steep ground and above the trees, snow above the snow line where it can lie) in the colours of its kind of land
// (kinds.js), with fine rock detail in the light,
// cloud shadows and the shared haze. Before the land rises it lies flat on the plain; the opening chart's stretch
// applies to it as it does to the line, so the two meet exactly.

import * as THREE from 'three';
import { NOISE, CLOUDS, HAZE } from './glsl.js';
import { HORIZON } from './terrain.js';

const VERTEX = {
  common: /* glsl */ `
    attribute float aBase;
    uniform float uRise;
    uniform float uStretch;
    uniform float uFloor;
    varying vec3 vWorld;
    varying vec3 vUp;`,
  normal: /* glsl */ `
    { float s = uRise * uStretch; objectNormal = normalize(vec3(objectNormal.x * s, objectNormal.y, objectNormal.z * s)); }`,
  position: /* glsl */ `
    transformed.y = uFloor + (mix(aBase, transformed.y, uRise) - uFloor) * uStretch;`,
};

const PAINT = /* glsl */ `
  vec3 up = normalize(vUp);
  float slope = 1.0 - up.y;
  float h = vWorld.y;
  float top = smoothstep(0.55, 0.85, up.y);
  bool sideX = abs(up.x) > abs(up.z);
  float fw = length(fwidth(vWorld)); // metres a pixel: fine noise fades out before it can shimmer
  float n1 = fbm(vWorld.xz / 420.0);
  float n2 = mix(0.5, tfbm(vWorld, top, sideX, 47.0), 1.0 - smoothstep(8.0, 40.0, fw));
  float n3 = mix(0.5, tnoise(vWorld, top, sideX, 6.0), 1.0 - smoothstep(1.5, 6.0, fw));
  vec3 grass = mix(uGrassLo, uGrassHi, smoothstep(300.0, uTreeLine + 400.0, h + (n1 - 0.5) * 600.0));
  grass = mix(grass, uDry, smoothstep(0.55, 0.8, n2) * 0.5); // dry patches
  grass *= 0.82 + 0.36 * n2;
  float forest = (1.0 - smoothstep(uTreeLine - 300.0, uTreeLine + 80.0, h + (n1 - 0.5) * 400.0))
    * (1.0 - smoothstep(0.3, 0.55, slope)) * smoothstep(0.42, 0.7, n2 + (n1 - 0.5) * 0.5 + slope * 0.4);
  vec3 trees = mix(uForest, uForestAlt, smoothstep(0.35, 0.65, n1 + (n3 - 0.5) * 0.6));
  vec3 col = mix(grass, trees * (0.75 + 0.5 * n3), forest * uForestAmt);
  float grip = 0.12 * (1.0 - smoothstep(600.0, 1400.0, h)) + uRockAt; // low down, grass holds on steeper ground
  rockMask = clamp(smoothstep(0.36 + grip, 0.58 + grip, slope + (n2 - 0.5) * 0.14)
    + smoothstep(uTreeLine + 100.0, uTreeLine + 800.0, h + (n1 - 0.5) * 500.0) * smoothstep(0.12, 0.32, slope), 0.0, 1.0);
  vec3 rock = mix(uRockDark, uRockLight, n2) * (0.85 + 0.3 * n3);
  // layers of another colour, as thick as the kind's beds, fading out before they're finer than a pixel
  float bed = smoothstep(0.35, 0.65, 0.5 + 0.5 * sin(h / uBandH + n1 * 6.0 + (n2 - 0.5) * 1.5));
  rock = mix(rock, uBand * (0.85 + 0.3 * n3), bed * uStrata * (1.0 - smoothstep(uBandH, 4.0 * uBandH, fw)));
  rock *= 0.9 + 0.12 * sin(h / 19.0 + n1 * 6.0); // strata
  col = mix(col, rock, rockMask);
  float steepest = 0.5 + 0.28 * smoothstep(uSnowLine, uSnowLine + 2500.0, h); // high up, snow holds on steeper ground
  snowMask = smoothstep(uSnowLine - 120.0, uSnowLine + 260.0, h + (n1 - 0.5) * 520.0 + (n2 - 0.5) * 120.0)
    * (1.0 - smoothstep(steepest - 0.12, steepest + 0.12, slope + (n2 - 0.5) * 0.25));
  col = mix(col, vec3(0.86, 0.88, 0.92), snowMask);
  diffuseColor.rgb = col;
  // a cloud's shadow: where the sun's ray through this point crosses the deck
  cloudShade = 1.0;
  vec3 sd = normalize(uSunDir);
  if (sd.y > 0.02 && h < uCloudBase) cloudShade = 1.0 - 0.85 * cloudDensity(vWorld.xz + sd.xz / sd.y * (uCloudBase - h), 0.0);
`;

const DETAIL = /* glsl */ `
  {
    // a bumpier surface in the light: the gradient of side-projected noise, kept tangent to the ground
    float e = 4.0, sc = 61.0;
    float c0 = tfbm3(vWorld, top, sideX, sc);
    vec3 g = vec3(tfbm3(vWorld + vec3(e, 0.0, 0.0), top, sideX, sc) - c0,
                  tfbm3(vWorld + vec3(0.0, e, 0.0), top, sideX, sc) - c0,
                  tfbm3(vWorld + vec3(0.0, 0.0, e), top, sideX, sc) - c0) / e * sc * (0.4 + n1);
    g -= dot(g, up) * up;
    float strength = (0.12 + 0.55 * rockMask) * (1.0 - 0.6 * snowMask) * (1.0 - smoothstep(6.0, 40.0, fw));
    normal = normalize((viewMatrix * vec4(normalize(up - g * strength), 0.0)).xyz);
  }
`;

function patch(material, U, depthOnly = false) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX.common}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\n${depthOnly ? '' : VERTEX.normal}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERTEX.position}`)
      .replace('#include <project_vertex>', `#include <project_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\n${depthOnly ? '' : 'vUp = normalize(mat3(modelMatrix) * objectNormal);'}`);
    if (depthOnly) return;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWorld;
        varying vec3 vUp;
        uniform float uTreeLine;
        uniform float uSnowLine;
        uniform float uCloudBase;
        uniform vec3 uGrassLo, uGrassHi, uDry, uForest, uForestAlt, uRockDark, uRockLight, uBand;
        uniform float uForestAmt, uStrata, uBandH, uRockAt;
        ${NOISE}
        ${CLOUDS}
        ${HAZE}
        float rockMask;
        float snowMask;
        float cloudShade;
        // Noise on steep ground is taken from the side, so cliffs aren't smeared into vertical streaks.
        // top: how flat the ground is (1 looks down on it); sideX: whether it faces east-west rather than north-south
        vec2 sideOf(vec3 p, bool sideX) { return sideX ? p.zy : p.xy; }
        float tfbm(vec3 p, float top, bool sideX, float s) {
          if (top > 0.98) return fbm(p.xz / s);
          if (top < 0.02) return fbm(sideOf(p, sideX) / s);
          return mix(fbm(sideOf(p, sideX) / s), fbm(p.xz / s), top);
        }
        float tfbm3(vec3 p, float top, bool sideX, float s) {
          if (top > 0.98) return fbm3(p.xz / s);
          if (top < 0.02) return fbm3(sideOf(p, sideX) / s);
          return mix(fbm3(sideOf(p, sideX) / s), fbm3(p.xz / s), top);
        }
        float tnoise(vec3 p, float top, bool sideX, float s) {
          return mix(vnoise(sideOf(p, sideX) / s), vnoise(p.xz / s), top);
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${PAINT}`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(mix(0.96, 0.86, rockMask), 0.5, snowMask);')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${DETAIL}`)
      .replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.replace(
        'getDirectionalLightInfo( directionalLight, directLight );',
        'getDirectionalLightInfo( directionalLight, directLight );\n\t\tdirectLight.color *= cloudShade;'))
      .replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb = haze(gl_FragColor.rgb, vWorld);\n#include <tonemapping_fragment>');
  };
}

export function createLand(U) {
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 });
  patch(material, U);
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  patch(depth, U, true);

  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
  mesh.customDepthMaterial = depth;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  // flat land running on past the grid to the horizon
  const plane = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, HORIZON - 4, 0);
  plane.setAttribute('aBase', new THREE.BufferAttribute(new Float32Array(4).fill(HORIZON - 4), 1));
  const skirt = new THREE.Mesh(plane, material);
  skirt.receiveShadow = true;
  skirt.frustumCulled = false;

  let indexKey = '', index = null;
  function setTerrain(t) {
    const { cols, rows, xs, zs, heights, base, normals } = t;
    const position = new Float32Array(cols * rows * 3);
    for (let r = 0, i = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++, i++) { position[i * 3] = xs[c]; position[i * 3 + 1] = heights[i]; position[i * 3 + 2] = zs[r]; }
    }
    if (indexKey !== `${cols}x${rows}`) {
      index = new Uint32Array((cols - 1) * (rows - 1) * 6);
      for (let r = 0, k = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
          index[k++] = a; index[k++] = d; index[k++] = b;
          index[k++] = b; index[k++] = d; index[k++] = e;
        }
      }
      indexKey = `${cols}x${rows}`;
    }
    // a fresh geometry each time, so the last range's buffers leave the GPU at once
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(position, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    g.setAttribute('aBase', new THREE.BufferAttribute(base, 1));
    g.setIndex(new THREE.BufferAttribute(index, 1));
    g.computeBoundingSphere();
    mesh.geometry.dispose();
    mesh.geometry = g;
    const L = t.L;
    skirt.position.set(L / 2, 0, -0.2 * L);
    skirt.scale.set(60 * L, 1, 60 * L);
  }

  return { mesh, skirt, setTerrain };
}
