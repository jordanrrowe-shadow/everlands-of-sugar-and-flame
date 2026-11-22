// Loads CC0 model kits (Quaternius: Medieval Village MegaKit, Stylized Nature MegaKit) and draws many copies cheaply.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

THREE.Cache.enabled = true;
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), store = {}, mats = {}, tints = {};
export const PACKS = {
  village: ['Wall_UnevenBrick_Straight', 'Wall_UnevenBrick_Window_Wide_Round', 'Wall_UnevenBrick_Door_Round', 'Wall_Plaster_Straight', 'Wall_Plaster_Window_Wide_Round', 'Corner_Exterior_Brick', 'Roof_RoundTiles_6x6', 'Roof_RoundTiles_6x8', 'Roof_RoundTiles_8x8', 'Roof_Front_Brick6', 'Roof_Front_Brick8', 'Prop_Chimney', 'Prop_Crate', 'Prop_Wagon', 'Door_1_Round', 'DoorFrame_Round_Brick', 'Window_Wide_Round1', 'WindowShutters_Wide_Round_Open', 'Prop_WoodenFence_Single', 'Prop_Vine1', 'Roof_Tower_RoundTiles'],
  // sculpted scenery (generated with Meshy from concept paintings); each is normalised to stand on y = 0 with a footprint 1 unit wide
  props: ['cakehouse1', 'cakehouse2', 'cakehouse3', 'candytree', 'lollytree', 'fountain', 'statue', 'cave', 'stall', 'emberhouse1', 'emberhouse2', 'brazier', 'firefest', 'arch'],
  nature: ['CommonTree_1', 'CommonTree_2', 'CommonTree_3', 'TwistedTree_2', 'DeadTree_1', 'DeadTree_2', 'Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3', 'Bush_Common', 'Bush_Common_Flowers', 'Flower_3_Group', 'Flower_4_Group', 'Mushroom_Common', 'Fern_1', 'Plant_7_Big', 'Pebble_Round_1'],
};
export const WORLD_PACKS = { ember: ['village', 'nature', 'props'], sugar: ['nature', 'props'], sea: [] };
export function loadPack(pack) {
  const sculpt = pack === 'props';
  return Promise.all(PACKS[pack].filter((n) => !store[n]).map((n) => loader.loadAsync(`models/${pack}/${n}.${sculpt ? 'glb' : 'gltf'}`).then((g) => {
    g.scene.updateMatrixWorld(true); const parts = [];
    if (sculpt) { const box = new THREE.Box3();
      g.scene.traverse((o) => { if (!o.isMesh) return; const src = o.geometry, geo = new THREE.BufferGeometry(), P = src.attributes.position, pos = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) { pos[i * 3] = P.getX(i); pos[i * 3 + 1] = P.getY(i); pos[i * 3 + 2] = P.getZ(i); }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); if (src.attributes.uv) geo.setAttribute('uv', src.attributes.uv); if (src.index) geo.setIndex(src.index); geo.applyMatrix4(o.matrixWorld); geo.computeVertexNormals(); geo.computeBoundingBox(); box.union(geo.boundingBox); o.material.envMapIntensity = 0.5; o.material.metalness = 0; o.material.roughness = 0.9; parts.push({ geo, key: n, mat: o.material }); });
      const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()), k = 1 / Math.max(sz.x, sz.z); for (const p of parts) { p.geo.translate(-c.x, -box.min.y, -c.z); p.geo.scale(k, k, k); } store[n] = parts; return; }
    g.scene.traverse((o) => { if (!o.isMesh) return; const geo = o.geometry.clone().applyMatrix4(o.matrixWorld), key = pack + ':' + o.material.name; if (!mats[key]) { mats[key] = o.material; o.material.envMapIntensity = 0.8; } parts.push({ geo, key, mat: mats[key] }); });
    store[n] = parts;
  }).catch((e) => { console.warn('model missing', n, e?.message); store[n] = []; })));
}
export const hasModel = (n) => !!(store[n] && store[n].length);
function tinted(part, tint) { // recolour foliage: keep the leaf texture's shading and cut-out, replace its hue
  if (!tint || !/Lea(ves|f)|Flowers/.test(part.key)) return part.mat; const k = part.key + tint; if (tints[k]) return tints[k];
  const m = (tints[k] = part.mat.clone()); m.color = new THREE.Color(tint);
  m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\n vec4 sampledDiffuseColor = texture2D( map, vMapUv );\n float lm = dot(sampledDiffuseColor.rgb, vec3(0.45, 0.9, 0.3));\n diffuseColor *= vec4(vec3(0.35 + lm * 1.5), sampledDiffuseColor.a);\n#endif'); };
  m.customProgramCacheKey = () => 'tint'; return m;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export class Scatter {
  constructor() { this.items = new Map(); }
  add(name, x, y, z, ry = 0, s = 1, tint) { const k = name + '|' + (tint ?? ''); if (!this.items.has(k)) this.items.set(k, []); this.items.get(k).push([x, y, z, ry, s]); return this; }
  build() {
    const g = new THREE.Group();
    for (const [k, list] of this.items) { const [name, t] = k.split('|'), tint = t ? +t : null;
      for (const part of store[name] || []) { const im = new THREE.InstancedMesh(part.geo, tinted(part, tint), list.length);
        list.forEach(([x, y, z, ry, s], i) => { _e.set(0, ry, 0); _q.setFromEuler(_e); _p.set(x, y, z); if (Array.isArray(s)) _s.set(s[0], s[1], s[2]); else _s.set(s, s, s); _m.compose(_p, _q, _s); im.setMatrixAt(i, _m); });
        im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); g.add(im); } }
    return g;
  }
}
