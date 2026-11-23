// Rendering detail: photo-scanned PBR ground textures (Poly Haven, CC0) blended per zone, triplanar stone/plaster
// detail on every building, reflective animated water, instanced wind-blown grass, drifting motes and clouds.
import * as THREE from 'three';

const loader = new THREE.TextureLoader(), cache = {};
export function tex(name, srgb) {
  if (!cache[name]) { const t = loader.load('tex/' + name + '.jpg'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; cache[name] = t; }
  return cache[name];
}
export const U = { time: { value: 0 } };
const lin = (v) => Math.pow(v, 2.2);
const MEAN = { painted_grass: [0.517, 0.676, 0.366], painted_ember: [0.474, 0.199, 0.112], painted_cobble: [0.700, 0.427, 0.276], painted_sugarpave: [0.945, 0.846, 0.800], burned_ground_01: [0.38, 0.33, 0.281], rock_06: [0.489, 0.378, 0.272], cobblestone_floor_04: [0.539, 0.49, 0.383], marble_tiles: [0.548, 0.505, 0.445], leafy_grass: [0.592, 0.515, 0.349], coast_sand_01: [0.51, 0.449, 0.36], snow_02: [0.649, 0.648, 0.657], patterned_paving: [0.346, 0.327, 0.304], white_plaster_rough_01: [0.488, 0.443, 0.341], clay_roof_tiles_02: [0.57, 0.312, 0.169], brown_planks_05: [0.603, 0.582, 0.534] };
const mean = (id) => new THREE.Vector3(...MEAN[id].map(lin));

// Four ground layers blended by a per-vertex `splat` weight; the game's own vertex colours stay as the tint.
export function terrainMaterial(layers, bump = 0.9) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    layers.forEach((l, i) => { sh.uniforms['tD' + i] = { value: tex(l.id + '_d', true) }; sh.uniforms['tN' + i] = { value: tex(l.id + '_n') }; sh.uniforms['uM' + i] = { value: mean(l.id) }; });
    sh.uniforms.uScale = { value: new THREE.Vector4(...layers.map((l) => l.scale)) }; sh.uniforms.uRough = { value: new THREE.Vector4(...layers.map((l) => l.rough)) }; sh.uniforms.uChroma = { value: new THREE.Vector4(...layers.map((l) => l.chroma ?? 0.5)) };
    sh.vertexShader = 'attribute vec4 splat;\nvarying vec4 vSplat;\nvarying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSplat = splat; vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `uniform sampler2D tD0, tD1, tD2, tD3, tN0, tN1, tN2, tN3; uniform vec3 uM0, uM1, uM2, uM3; uniform vec4 uScale, uRough, uChroma; varying vec4 vSplat; varying vec3 vWP;\n` + sh.fragmentShader
      .replace('#include <map_fragment>', `vec2 gp = vWP.xz;
        vec3 d0 = texture2D(tD0, gp * uScale.x).rgb / uM0, d1 = texture2D(tD1, gp * uScale.y).rgb / uM1, d2 = texture2D(tD2, gp * uScale.z).rgb / uM2, d3 = texture2D(tD3, gp * uScale.w).rgb / uM3;
        vec3 det = d0 * vSplat.x + d1 * vSplat.y + d2 * vSplat.z + d3 * vSplat.w;
        float macro = 0.82 + 0.36 * texture2D(tD0, gp * 0.011).g / uM0.g * 0.5;
        float dl = dot(det, vec3(0.3333));
        diffuseColor.rgb *= mix(vec3(dl), det, dot(vSplat, uChroma)) * macro;`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = dot(vSplat, uRough);')
      .replace('#include <normal_fragment_maps>', `vec3 tn = (texture2D(tN0, gp * uScale.x).xyz * vSplat.x + texture2D(tN1, gp * uScale.y).xyz * vSplat.y + texture2D(tN2, gp * uScale.z).xyz * vSplat.z + texture2D(tN3, gp * uScale.w).xyz * vSplat.w) * 2.0 - 1.0;
        normal = normalize(normal + mat3(viewMatrix) * vec3(tn.x, 0.0, -tn.y) * ${bump.toFixed(2)});`);
  };
  return m;
}

// World-space triplanar stone/plaster grain + bump on any vertex-coloured material (buildings, props, trees).
export function detailPatch(m, id = 'white_plaster_rough_01', scale = 0.22, amt = 0.55, bump = 0.5) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.tDet = { value: tex(id + '_d', true) }; sh.uniforms.tDetN = { value: tex(id + '_n') }; sh.uniforms.uDM = { value: mean(id) };
    sh.vertexShader = 'varying vec3 vWP;\nvarying vec3 vWN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = 'uniform sampler2D tDet, tDetN; uniform vec3 uDM; varying vec3 vWP; varying vec3 vWN;\n' + sh.fragmentShader
      .replace('#include <map_fragment>', `vec3 tw = pow(abs(vWN), vec3(4.0)); tw /= (tw.x + tw.y + tw.z);
        vec2 ux = vWP.zy * ${scale.toFixed(3)}, uy = vWP.xz * ${scale.toFixed(3)}, uz = vWP.xy * ${scale.toFixed(3)};
        vec3 dd = (texture2D(tDet, ux).rgb * tw.x + texture2D(tDet, uy).rgb * tw.y + texture2D(tDet, uz).rgb * tw.z) / uDM;
        diffuseColor.rgb *= mix(vec3(1.0), vec3(dot(dd, vec3(0.3333))), ${amt.toFixed(2)});`)
      .replace('#include <normal_fragment_maps>', `vec3 nx = texture2D(tDetN, ux).xyz * 2.0 - 1.0, ny = texture2D(tDetN, uy).xyz * 2.0 - 1.0, nz = texture2D(tDetN, uz).xyz * 2.0 - 1.0;
        vec3 wp = vec3(0.0, nx.y, nx.x) * tw.x + vec3(ny.x, 0.0, ny.y) * tw.y + vec3(nz.x, nz.y, 0.0) * tw.z;
        normal = normalize(normal + mat3(viewMatrix) * wp * ${bump.toFixed(2)});`);
  };
  return m;
}
export function glowPatch(m) { // living flicker on lava, lamps, windows
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time;
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform float uTime; varying vec3 vWP;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float fl = sin(vWP.x * 0.9 + uTime * 2.3) * sin(vWP.z * 0.7 - uTime * 1.7) + sin((vWP.x + vWP.z) * 2.1 + uTime * 3.1) * 0.5;
      diffuseColor.rgb *= 1.75 * (1.0 + 0.16 * fl);`);
  };
  return m;
}
// Glossy, gently rolling water that reflects the sky.
export function waterMaterial(color, opacity = 0.9, rough = 0.07, wave = 1, glint = 0xffffff) {
  const gc = new THREE.Color(glint);
  // Painted water: slow bands of deep and shallow colour, a drifting web of light, soft foam flecks and sun glitter.
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05, transparent: opacity < 1, opacity, envMapIntensity: 1.5 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time;
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `uniform float uTime; varying vec3 vWP;
      vec2 wH(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
      float wCell(vec2 p, float t) { vec2 i = floor(p), f = fract(p); float d = 1.0; for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)), o = wH(i + g); o = 0.5 + 0.42 * sin(t + 6.2831 * o); d = min(d, length(g + o - f)); } return d; }
      float wN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(wH(i).x, wH(i + vec2(1, 0)).x, f.x), mix(wH(i + vec2(0, 1)).x, wH(i + vec2(1, 1)).x, f.x), f.y); }
      ` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      { float wt = uTime * 0.5, dist = length(vWP - cameraPosition), nearK = 1.0 - smoothstep(40.0, 170.0, dist);
        vec2 wp = vWP.xz + vec2(sin(vWP.z * 0.11 + wt), cos(vWP.x * 0.09 - wt * 0.8)) * 0.9;
        float band = wN(wp * 0.035 + vec2(wt * 0.03, 0.0)) * 0.6 + wN(wp * 0.11 - vec2(0.0, wt * 0.05)) * 0.4;
        diffuseColor.rgb *= mix(0.72, 1.22, smoothstep(0.25, 0.8, band));
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.8, 1.08, 1.12) + 0.03, smoothstep(0.55, 0.9, band) * 0.5);
        float c1 = wCell(wp * 0.33 + vec2(wt * 0.12, wt * 0.05), wt * 1.3), c2 = wCell(wp * 0.71 - vec2(wt * 0.1, -wt * 0.07), wt * 1.7 + 2.0);
        float web = smoothstep(0.5, 0.78, c1) * 0.7 + smoothstep(0.55, 0.8, c2) * 0.45;
        float fleck = smoothstep(0.82, 0.9, c1 * 0.6 + c2 * 0.5 + band * 0.25);
        vec3 lightC = mix(diffuseColor.rgb * 1.25, vec3(${gc.r.toFixed(3)}, ${gc.g.toFixed(3)}, ${gc.b.toFixed(3)}), 0.38);
        diffuseColor.rgb = mix(diffuseColor.rgb, lightC, clamp(web * 0.36 * nearK + fleck * 0.6 * nearK, 0.0, 0.8)); }`).replace('#include <normal_fragment_maps>', `vec2 q = vWP.xz * 0.42; float t = uTime * 0.7;
      vec2 g = vec2(sin(q.x * 1.3 + t) + sin(q.y * 1.7 - t * 1.3) + sin((q.x + q.y) * 2.9 + t * 1.7) * 0.5 + sin(q.x * 6.1 - t * 2.2) * 0.25, cos(q.y * 1.1 + t * 0.8) + cos(q.x * 2.3 + t) + cos((q.x - q.y) * 3.1 - t * 1.4) * 0.5 + cos(q.y * 5.7 + t * 2.0) * 0.25) * ${(0.07 * wave).toFixed(3)};
      normal = normalize(normal + mat3(viewMatrix) * vec3(g.x, 0.0, g.y) * (1.0 - smoothstep(30.0, 150.0, length(vWP - cameraPosition))));`);
  };
  return m;
}

// Wind-blown grass: one instanced patch that wraps around the camera, planted on a height+mask texture of the land.
export function makeGrass(world, ext = 260, size = 60, count = 13000, root = 0x6fc48a, tip = 0xdaf7c4) {
  const N = 256, data = new Uint16Array(N * N * 4), H = THREE.DataUtils.toHalfFloat;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = -ext + (i + 0.5) / N * ext * 2, z = -ext + (j + 0.5) / N * ext * 2, k = (j * N + i) * 4; data[k] = H(world.height(x, z, true)); data[k + 1] = H(world.grassMask(x, z)); data[k + 3] = H(1); }
  const hm = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.HalfFloatType); hm.magFilter = hm.minFilter = THREE.LinearFilter; hm.needsUpdate = true;
  const pos = [], idx = []; // a tuft of three tapered blades
  for (let b = 0; b < 3; b++) { const a = b * 2.1, ox = Math.cos(a) * 0.12, oz = Math.sin(a) * 0.12, c = Math.cos(a + 1), s = Math.sin(a + 1), w = 0.035, h = 0.3 + b * 0.07, o = pos.length / 3;
    for (const [dx, y] of [[-w, 0], [w, 0], [-w * 0.7, h * 0.5], [w * 0.7, h * 0.5], [0, h]]) pos.push(ox + dx * c, y, oz + dx * s); idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2, o + 2, o + 3, o + 4); }
  const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  const off = new Float32Array(count * 3); for (let i = 0; i < count; i++) { off[i * 3] = Math.random() * size; off[i * 3 + 1] = Math.random(); off[i * 3 + 2] = Math.random() * size; }
  geo.setAttribute('offset', new THREE.InstancedBufferAttribute(off, 3)); geo.instanceCount = count;
  const mat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCam: { value: new THREE.Vector3() }, uSize: { value: size }, uExt: { value: new THREE.Vector2(ext, 0.5 / ext) }, uHM: { value: null }, uTime: { value: 0 }, cRoot: { value: new THREE.Color(root) }, cTip: { value: new THREE.Color(tip) }, uLight: { value: 1 } }]),
    vertexShader: `attribute vec3 offset; uniform vec3 uCam; uniform float uSize, uTime; uniform vec2 uExt; uniform sampler2D uHM; varying float vH; varying float vR;
      #include <fog_pars_vertex>
      void main() { vec2 base = mod(offset.xz - uCam.xz + uSize * 0.5, uSize) - uSize * 0.5 + uCam.xz; vec4 hm = texture2D(uHM, (base + uExt.x) * uExt.y);
        float r = offset.y, edge = 1.0 - smoothstep(uSize * 0.36, uSize * 0.5, length(base - uCam.xz)), s = hm.g * edge * (0.65 + 0.8 * r);
        float a = r * 6.283; vec3 p = position; p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
        vec2 wind = vec2(sin(uTime * 1.6 + base.x * 0.35 + r * 3.0), cos(uTime * 1.2 + base.y * 0.3)) * 0.5; p *= s; p.xz += wind * p.y * p.y;
        vH = position.y / 0.44; vR = r; vec4 mvPosition = viewMatrix * vec4(base.x + p.x, hm.r + p.y, base.y + p.z, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform vec3 cRoot, cTip; uniform float uLight; varying float vH; varying float vR;
      #include <fog_pars_fragment>
      void main() { vec3 c = mix(cRoot, cTip, vH) * (0.85 + 0.3 * vR) * uLight; gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
  mat.uniforms.uHM.value = hm; mat.uniforms.uTime = U.time;
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; return mesh;
}
// Drifting motes: rising embers in Emberland, sugar-dust sparkles in Sugarland.
// falling weather near the camera: snow on the mountains, petals over the town
export function makeFall(color, count = 420, size = 1, fall = 1.6, sway = 1.2) {
  const p = new Float32Array(count * 3); for (let i = 0; i < count * 3; i++) p[i] = Math.random();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    uniforms: { uCam: { value: new THREE.Vector3() }, uTime: U.time, uCol: { value: new THREE.Color(color) }, uAmt: { value: 0 } },
    vertexShader: `uniform vec3 uCam; uniform float uTime; varying float vA;
      void main() { vec3 B = vec3(46.0, 26.0, 46.0); vec3 q = position * B; q.y -= uTime * ${fall.toFixed(2)} * (0.6 + position.x * 0.8); q.x += sin(uTime * 0.7 + position.z * 40.0) * ${sway.toFixed(2)}; q.z += cos(uTime * 0.55 + position.x * 40.0) * ${sway.toFixed(2)};
        vec3 w = mod(q - uCam + B * 0.5, B) - B * 0.5 + uCam; w.y = uCam.y - 7.0 + mod(q.y, B.y); vec4 mv = viewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mv;
        vA = smoothstep(23.0, 14.0, length(w.xz - uCam.xz)); gl_PointSize = (1.2 + position.z * 1.8) * ${(42 * size).toFixed(1)} / -mv.z; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uAmt; varying float vA; void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(uCol, smoothstep(0.5, 0.25, d) * vA * uAmt * 0.9); }` }));
  m.frustumCulled = false; return m;
}
export function makeMotes(color, rise = 1, count = 260) {
  const p = new Float32Array(count * 3); for (let i = 0; i < count * 3; i++) p[i] = Math.random();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uCam: { value: new THREE.Vector3() }, uTime: U.time, uCol: { value: new THREE.Color(color) }, uRise: { value: rise } },
    vertexShader: `uniform vec3 uCam; uniform float uTime, uRise; varying float vA;
      void main() { vec3 B = vec3(56.0, 20.0, 56.0); vec3 q = position * B; q.y += uTime * uRise * (0.5 + position.x); q.x += sin(uTime * 0.6 + position.z * 30.0) * 1.2; q.z += cos(uTime * 0.5 + position.x * 30.0) * 1.2;
        vec3 w = mod(q - uCam + B * 0.5, B) - B * 0.5 + uCam; w.y = uCam.y - 6.0 + mod(q.y, B.y); vec4 mv = viewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mv;
        vA = (0.5 + 0.5 * sin(uTime * 3.0 + position.y * 40.0)) * smoothstep(28.0, 18.0, length(w.xz - uCam.xz)); gl_PointSize = (1.5 + position.z * 2.5) * 60.0 / -mv.z; }`,
    fragmentShader: `uniform vec3 uCol; varying float vA; void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(uCol, smoothstep(0.5, 0.1, d) * vA); }` }));
  m.frustumCulled = false; return m;
}
// A soft procedural cloud deck that drifts overhead.
export function makeClouds() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: U.time, uCol: { value: new THREE.Color(0xffffff) }, uShade: { value: new THREE.Color(0xd8c8d8) }, uCover: { value: 0.52 } },
    vertexShader: 'varying vec2 vP; varying vec2 vL; void main() { vL = position.xy; vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uTime, uCover; uniform vec3 uCol, uShade; varying vec2 vP; varying vec2 vL;
      float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * n(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
      void main() { vec2 p = vP * 0.0011 + vec2(uTime * 0.006, uTime * 0.002); float d = fbm(p), d2 = fbm(p + vec2(0.03, 0.02));
        float a = smoothstep(uCover, uCover + 0.22, d) * smoothstep(4400.0, 1500.0, length(vL)); vec3 c = mix(uShade, uCol, smoothstep(-0.02, 0.06, d - d2 + 0.03)); gl_FragColor = vec4(c, a * 0.9); }` }));
  m.rotation.x = -Math.PI / 2; m.frustumCulled = false; m.renderOrder = -1; return m;
}
