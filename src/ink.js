// Storybook finish: a wandering ink line at silhouettes, creases and colour boundaries, washes of colour in soft steps, paper grain.
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

export class InkPass extends Pass {
  constructor(camera) {
    super(); this.camera = camera;
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, uPx: { value: new THREE.Vector2(1, 1) }, uNear: { value: 0.1 }, uFar: { value: 2000 }, uInk: { value: new THREE.Color(0x3a1a16) }, uAmt: { value: 0.7 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse, tDepth; uniform vec2 uPx; uniform float uNear, uFar, uAmt; uniform vec3 uInk; varying vec2 vUv;
        float lin(vec2 uv) { float d = texture2D(tDepth, uv).x; return uNear * uFar / (uFar - d * (uFar - uNear)); }
        float lum(vec2 uv) { return dot(texture2D(tDiffuse, uv).rgb, vec3(0.299, 0.587, 0.114)); }
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float grain(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
        void main() {
          // the pen wanders a little, so lines are never ruler-straight
          vec2 wob = (vec2(grain(vUv / uPx * 0.045), grain(vUv / uPx * 0.045 + 37.0)) - 0.5) * uPx * 1.5, uv = vUv + wob;
          vec4 c = texture2D(tDiffuse, vUv); float z = lin(uv), near = smoothstep(170.0, 60.0, z) * step(z, uFar * 0.6);
          vec2 dx = vec2(uPx.x, 0.0), dy = vec2(0.0, uPx.y);
          float zl = lin(uv - dx), zr = lin(uv + dx), zu = lin(uv + dy), zd = lin(uv - dy);
          // an outline where depth breaks (silhouettes), a finer one where a surface creases (the second difference of depth)
          float e = max(max(abs(zl - z), abs(zr - z)), max(abs(zu - z), abs(zd - z)));
          float edge = smoothstep(0.035, 0.11, e / z);
          float crease = smoothstep(0.012, 0.04, (abs(zl + zr - 2.0 * z) + abs(zu + zd - 2.0 * z)) / z) * 0.55;
          // and a light line where flat colours meet, so painted trim and patterns read as drawn
          float l = dot(c.rgb, vec3(0.299, 0.587, 0.114)), ll = lum(uv - dx), lr = lum(uv + dx), lu = lum(uv + dy), ld = lum(uv - dy);
          float tone = smoothstep(0.1, 0.3, max(max(abs(ll - l), abs(lr - l)), max(abs(lu - l), abs(ld - l)))) * 0.38;
          float ink = max(edge, max(crease, tone)) * near;
          // richer colour, washes that settle into a few soft steps, and a tooth of paper under everything
          c.rgb = mix(vec3(l), c.rgb, 1.16); c.rgb = mix(c.rgb, floor(c.rgb * 9.0 + 0.5) / 9.0, 0.16);
          c.rgb *= 0.965 + 0.07 * grain(vUv / uPx * 0.22);
          c.rgb = mix(c.rgb, uInk * min(1.0, 0.25 + l), ink * uAmt); gl_FragColor = c; }`,
      depthTest: false, depthWrite: false }));
  }
  setSize(w, h) { this.quad.material.uniforms.uPx.value.set(1.5 / w, 1.5 / h); }
  render(renderer, writeBuffer, readBuffer) {
    const u = this.quad.material.uniforms; u.tDiffuse.value = readBuffer.texture; u.tDepth.value = readBuffer.depthTexture; u.uNear.value = this.camera.near; u.uFar.value = this.camera.far;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.quad.render(renderer);
  }
}
