// Storybook finish: a soft ink line wherever depth breaks (silhouettes, steps, eaves), and slightly richer colour.
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

export class InkPass extends Pass {
  constructor(camera) {
    super(); this.camera = camera;
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, uPx: { value: new THREE.Vector2(1, 1) }, uNear: { value: 0.1 }, uFar: { value: 2000 }, uInk: { value: new THREE.Color(0x3a1a16) }, uAmt: { value: 0.62 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse, tDepth; uniform vec2 uPx; uniform float uNear, uFar, uAmt; uniform vec3 uInk; varying vec2 vUv;
        float lin(vec2 uv) { float d = texture2D(tDepth, uv).x; return uNear * uFar / (uFar - d * (uFar - uNear)); }
        void main() { vec4 c = texture2D(tDiffuse, vUv); float z = lin(vUv);
          float e = 0.0; e = max(e, abs(lin(vUv + vec2(uPx.x, 0.0)) - z)); e = max(e, abs(lin(vUv - vec2(uPx.x, 0.0)) - z)); e = max(e, abs(lin(vUv + vec2(0.0, uPx.y)) - z)); e = max(e, abs(lin(vUv - vec2(0.0, uPx.y)) - z));
          float edge = smoothstep(0.035, 0.11, e / z) * smoothstep(170.0, 60.0, z) * step(z, uFar * 0.6);
          float l = dot(c.rgb, vec3(0.299, 0.587, 0.114)); c.rgb = mix(vec3(l), c.rgb, 1.14);
          c.rgb = mix(c.rgb, uInk * min(1.0, 0.25 + l), edge * uAmt); gl_FragColor = c; }`,
      depthTest: false, depthWrite: false }));
  }
  setSize(w, h) { this.quad.material.uniforms.uPx.value.set(1.35 / w, 1.35 / h); }
  render(renderer, writeBuffer, readBuffer) {
    const u = this.quad.material.uniforms; u.tDiffuse.value = readBuffer.texture; u.tDepth.value = readBuffer.depthTexture; u.uNear.value = this.camera.near; u.uFar.value = this.camera.far;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.quad.render(renderer);
  }
}
