// Tiny low-poly construction kit: accumulates coloured primitives and merges them into two meshes
// (lit + glowing) so a whole kingdom costs a handful of draw calls on a phone.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { detailPatch, glowPatch } from './gfx.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _c = new THREE.Color(), _c2 = new THREE.Color();
const _p = new THREE.Vector3(), _s = new THREE.Vector3();
const cache = new Map();
function base(key, make) { let g = cache.get(key); if (!g) { g = make(); if (g.index) g = g.toNonIndexed(); g.deleteAttribute('uv'); cache.set(key, g); } return g; }

export class Kit {
  constructor() { this.solid = []; this.glow = []; this.roof = []; this.wood = []; }
  put(geo, color, x, y, z, o = {}) {
    const g = geo.clone();
    _e.set(o.rx || 0, o.ry || 0, o.rz || 0); _q.setFromEuler(_e);
    const s = o.s || [1, 1, 1]; _p.set(x, y, z); _s.set(s[0], s[1], s[2]);
    _m.compose(_p, _q, _s); g.applyMatrix4(_m);
    const pos = g.attributes.position, n = pos.count, col = new Float32Array(n * 3);
    _c.set(color);
    if (o.c2 !== undefined) { // vertical gradient from color (bottom) to c2 (top)
      _c2.set(o.c2); g.computeBoundingBox(); const y0 = g.boundingBox.min.y, dy = Math.max(1e-4, g.boundingBox.max.y - y0);
      for (let i = 0; i < n; i++) { const t = (pos.getY(i) - y0) / dy; col[i * 3] = _c.r + (_c2.r - _c.r) * t; col[i * 3 + 1] = _c.g + (_c2.g - _c.g) * t; col[i * 3 + 2] = _c.b + (_c2.b - _c.b) * t; }
    } else for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    (o.glow ? this.glow : o.roof ? this.roof : o.wood ? this.wood : this.solid).push(g); return this;
  }
  box(x, y, z, w, h, d, color, o) { return this.put(base('b', () => new THREE.BoxGeometry(1, 1, 1)), color, x, y + h / 2, z, { ...o, s: [w, h, d] }); }
  cyl(x, y, z, rt, rb, h, color, o = {}, seg = 14) { return this.put(base(`c${rt / (rb || 1e-3)}|${seg}|${rb ? 1 : 0}`, () => new THREE.CylinderGeometry(rb ? rt / rb : 1, rb ? 1 : 0, 1, seg)), color, x, y + h / 2, z, { ...o, s: [rb || rt, h, rb || rt] }); }
  cone(x, y, z, r, h, color, o = {}, seg = 12) { return this.put(base('k' + seg, () => new THREE.ConeGeometry(1, 1, seg)), color, x, y + h / 2, z, { ...o, s: [r, h, r] }); }
  sph(x, y, z, r, color, o = {}) { const s = o.s || [1, 1, 1]; return this.put(base('s', () => new THREE.SphereGeometry(1, 16, 11)), color, x, y, z, { ...o, s: [r * s[0], r * s[1], r * s[2]] }); }
  torus(x, y, z, r, t, color, o = {}) { return this.put(base('t' + (t / r).toFixed(2), () => new THREE.TorusGeometry(1, t / r, 8, 32)), color, x, y, z, { ...o, s: [r, r, r] }); }
  build() {
    const grp = new THREE.Group();
    if (this.solid.length) grp.add(new THREE.Mesh(mergeGeometries(this.solid), MAT.solid));
    if (this.glow.length) grp.add(new THREE.Mesh(mergeGeometries(this.glow), MAT.glow));
    if (this.roof.length) grp.add(new THREE.Mesh(mergeGeometries(this.roof), MAT.roof));
    if (this.wood.length) grp.add(new THREE.Mesh(mergeGeometries(this.wood), MAT.wood));
    this.solid = []; this.glow = []; this.roof = []; this.wood = [];
    return grp;
  }
}
export const MAT = {
  solid: detailPatch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.02 })),
  glow: glowPatch(new THREE.MeshBasicMaterial({ vertexColors: true })),
  roof: detailPatch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }), 'clay_roof_tiles_02', 0.3, 0.85, 1.1),
  wood: detailPatch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }), 'brown_planks_05', 0.45, 0.8, 0.8),
};
const lam = new Map();
export function mat(color, glow) { const k = color + (glow ? 'g' : ''); let m = lam.get(k); if (!m) { m = glow ? new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.7) }) : new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.0 }); lam.set(k, m); } return m; }
export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1), sph: new THREE.SphereGeometry(1, 24, 16), cyl: new THREE.CylinderGeometry(1, 1, 1, 20),
  cone: new THREE.ConeGeometry(1, 1, 18), frustum: new THREE.CylinderGeometry(0.42, 1, 1, 24, 3),
};
export function part(geo, color, x, y, z, sx, sy, sz, glow) { const m = new THREE.Mesh(geo, mat(color, glow)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return m; }
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function noise2(x, z) { // cheap smooth value noise
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return (h(xi, zi) * (1 - u) + h(xi + 1, zi) * u) * (1 - v) + (h(xi, zi + 1) * (1 - u) + h(xi + 1, zi + 1) * u) * v;
}
export const rnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
