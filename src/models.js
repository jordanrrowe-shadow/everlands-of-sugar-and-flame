// Procedural characters, the dragon, critters and small props.
import * as THREE from 'three';
import { GEO, part, mat } from './kit.js';
import { peopleReady, makeRig, animRig, getHero, heroStatic } from './people.js';

export function makePerson(L) { return peopleReady() ? makeRig(L) : makeSimple(L); }

function makeSimple(L) {
  const g = new THREE.Group(), u = (g.userData = { t: Math.random() * 6 });
  const skirted = L.style === 'girl' || L.style === 'woman' || L.style === 'elder';
  const skin = L.skin || 0xf0c8a8;
  if (skirted) {
    const long = L.style !== 'girl';
    g.add(part(GEO.frustum, L.skirt, 0, long ? 0.5 : 0.62, 0, long ? 0.42 : 0.56, long ? 1.0 : 0.78, long ? 0.42 : 0.56));
    if (L.style === 'girl') { // layered ruffles
      g.add(part(GEO.frustum, L.trim || 0xffffff, 0, 0.3, 0, 0.62, 0.22, 0.62));
      g.add(part(GEO.frustum, L.skirt, 0, 0.46, 0, 0.6, 0.2, 0.6));
      u.legL = part(GEO.box, 0xf5e6d8, -0.1, 0.12, 0, 0.1, 0.26, 0.12); u.legR = part(GEO.box, 0xf5e6d8, 0.1, 0.12, 0, 0.1, 0.26, 0.12); g.add(u.legL, u.legR);
    }
  } else {
    for (const sx of [-1, 1]) { const p = new THREE.Group(); p.position.set(sx * 0.12, 0.82, 0); p.add(part(GEO.box, L.legs || 0x554433, 0, -0.41, 0, 0.17, 0.82, 0.2)); g.add(p); if (sx < 0) u.legL = p; else u.legR = p; }
  }
  g.add(part(GEO.cyl, L.top, 0, 1.18, 0, 0.24, 0.56, 0.19));
  if (L.trim && L.style !== 'girl') g.add(part(GEO.box, L.trim, 0, 1.18, 0.185, 0.08, 0.5, 0.03));
  if (L.style === 'girl') g.add(part(GEO.box, L.trim || 0xffffff, 0, 1.1, 0.19, 0.2, 0.3, 0.03));
  if (L.apron) g.add(part(GEO.box, L.apron, 0, 0.92, 0.2, 0.34, 0.6, 0.04));
  for (const sx of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(sx * 0.31, 1.4, 0);
    p.add(part(GEO.box, L.sleeve || L.top, 0, -0.26, 0, 0.12, 0.52, 0.13), part(GEO.sph, skin, 0, -0.56, 0, 0.07, 0.07, 0.07));
    g.add(p); if (sx < 0) u.armL = p; else u.armR = p;
  }
  g.add(part(GEO.sph, skin, 0, 1.64, 0, 0.21, 0.22, 0.21));
  for (const sx of [-1, 1]) g.add(part(GEO.sph, 0xffffff, sx * 0.078, 1.665, 0.178, 0.04, 0.048, 0.03), part(GEO.sph, L.eye || 0x4a2a1a, sx * 0.078, 1.662, 0.2, 0.026, 0.034, 0.016), part(GEO.sph, 0x140c0a, sx * 0.078, 1.662, 0.209, 0.013, 0.018, 0.01), part(GEO.sph, 0xf2a0a0, sx * 0.13, 1.6, 0.15, 0.04, 0.025, 0.02), part(GEO.sph, L.hair, sx * 0.078, 1.722, 0.185, 0.045, 0.01, 0.02));
  g.add(part(GEO.sph, 0xc8566a, 0, 1.565, 0.19, 0.035, 0.012, 0.015), part(GEO.sph, skin, 0, 1.62, 0.21, 0.02, 0.025, 0.02), part(GEO.cyl, skin, 0, 1.44, 0, 0.07, 0.1, 0.07));
  g.add(part(GEO.sph, L.hair, 0, 1.71, -0.04, 0.235, 0.22, 0.235));
  if (L.hairLong) { g.add(part(GEO.sph, L.hair, 0, 1.3, -0.2, 0.26, 0.5, 0.14)); g.add(part(GEO.sph, L.hair, -0.2, 1.42, -0.06, 0.09, 0.3, 0.1), part(GEO.sph, L.hair, 0.2, 1.42, -0.06, 0.09, 0.3, 0.1)); }
  else if (L.style === 'woman' || L.style === 'elder') g.add(part(GEO.sph, L.hair, 0, 1.84, -0.1, 0.12, 0.11, 0.12));
  if (L.flower) g.add(part(GEO.sph, L.flower, 0.2, 1.8, 0.06, 0.07, 0.07, 0.05));
  if (L.crown) g.add(part(GEO.cyl, 0xe9b949, 0, 1.9, 0, 0.17, 0.1, 0.17));
  if (L.glasses) g.add(part(GEO.box, 0x333333, 0, 1.66, 0.2, 0.3, 0.03, 0.02));
  if (L.cape) { const c = part(GEO.box, L.cape, 0, 0.98, -0.22, 0.56, 0.95, 0.05); c.rotation.x = 0.12; g.add(c); }
  if (L.collar) g.add(part(GEO.sph, L.collar, 0, 1.44, 0, 0.3, 0.1, 0.26));
  if (L.style === 'guard') { g.add(part(GEO.cyl, 0x6b4a2a, 0.42, 1.2, 0.1, 0.025, 2.3, 0.025), part(GEO.cone, 0xcfd3d6, 0.42, 2.45, 0.1, 0.07, 0.24, 0.07)); }
  if (L.tira) { g.add(part(GEO.box, 0xc9a0dc, -0.36, 0.95, 0.05, 0.18, 0.26, 0.26)); const t = makeCritter('tira'); t.position.set(-0.36, 1.1, 0.05); t.scale.setScalar(0.6); g.add(t); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const h = (L.h || 1) * (L.style === 'child' ? 0.68 : 1); g.scale.setScalar(h); u.h = h;
  return g;
}
export function animPerson(p, dt, moving, slow) {
  if (p.userData.rig) return animRig(p, dt, moving, slow);
  const u = p.userData; u.t += dt * (moving ? 10 : 2);
  const a = moving ? Math.sin(u.t) * 0.7 : Math.sin(u.t) * 0.04;
  if (u.armL) { u.armL.rotation.x = a; u.armR.rotation.x = -a; }
  if (u.legL) { if (u.legL.isGroup) { u.legL.rotation.x = -a; u.legR.rotation.x = a; } else { u.legL.position.z = -a * 0.14; u.legR.position.z = a * 0.14; } }
}

const RUBY = new THREE.MeshBasicMaterial({ color: 0xff2238 });
export function makeDragon(accent) {
  if (!accent && getHero('ruby')) { // the sculpted Ruby: wings flap in the vertex shader, hinged where they leave the body
    const g = new THREE.Group(), u = (g.userData = { t: 0, heroRuby: true, flap: { value: 0.9 } }), m = heroStatic('ruby', 15); m.position.y = -1.75; g.add(m); u.body = m;
    m.traverse((o) => { if (!o.isMesh) return; o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox, cx = (bb.min.x + bb.max.x) / 2, hw = (bb.max.x - bb.min.x) / 2; o.material = o.material.clone(); o.frustumCulled = false;
      o.material.onBeforeCompile = (sh) => { sh.uniforms.uFlap = u.flap; sh.vertexShader = 'uniform float uFlap;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n{ float dx = transformed.x - (${cx.toFixed(4)}); float d = max(0.0, abs(dx) - ${(hw * 0.2).toFixed(4)}); float k = smoothstep(0.0, ${(hw * 0.12).toFixed(4)}, d); float a = uFlap * k; transformed.y += d * sin(a); transformed.x = (${cx.toFixed(4)}) + sign(dx) * (min(abs(dx), ${(hw * 0.2).toFixed(4)}) + d * cos(a)); }`); }; o.material.customProgramCacheKey = () => 'rubyflap'; });
    return g; }
  const g = new THREE.Group(), u = (g.userData = { t: 0 });
  const ruby = accent ? new THREE.MeshBasicMaterial({ color: accent }) : RUBY; u.ruby = ruby; u.base = new THREE.Color(accent || 0xff2238);
  const bk = 0x191214, P = (geo, x, y, z, sx, sy, sz, c = bk) => part(geo, c, x, y, z, sx, sy, sz);
  const R = (x, y, z, s) => { const m = new THREE.Mesh(GEO.sph, ruby); m.position.set(x, y, z); m.scale.setScalar(s); return m; };
  g.add(P(GEO.sph, 0, 0, 0, 1.15, 1.0, 2.5));
  for (let i = 0; i < 6; i++) { const t = i / 5; g.add(P(GEO.sph, 0, 0.4 + t * 1.9, 2.0 + t * 2.3, 0.72 - t * 0.3, 0.72 - t * 0.3, 0.8 - t * 0.2)); g.add(R(0, 1.05 + t * 1.95, 1.85 + t * 2.25, 0.2 - t * 0.06)); }
  const head = new THREE.Group(); head.position.set(0, 2.45, 4.6); u.head = head; g.add(head);
  head.add(P(GEO.box, 0, 0, 0, 0.75, 0.55, 0.9), P(GEO.box, 0, -0.1, 0.75, 0.5, 0.36, 0.9));
  for (const sx of [-1, 1]) { const h = P(GEO.cone, sx * 0.28, 0.35, -0.45, 0.1, 0.7, 0.1); h.rotation.x = -1.0; head.add(h); head.add(part(GEO.sph, 0xffc93a, sx * 0.39, 0.08, 0.2, 0.07, 0.09, 0.1, true)); g.add(R(sx * 0.95, 0.5, 1.1, 0.26), R(sx * 1.05, 0.3, 0.2, 0.2)); }
  for (let i = 0; i < 9; i++) { const t = i / 8; g.add(P(GEO.sph, 0, -0.1 - t * 0.5, -2.2 - t * 5.2, 0.7 - t * 0.6, 0.6 - t * 0.5, 0.9)); if (i % 2 === 0) g.add(R(0, 0.45 - t * 0.9, -2.2 - t * 5.2, 0.16 - t * 0.1)); }
  const tip = new THREE.Mesh(GEO.cone, ruby); tip.position.set(0, -0.6, -8); tip.scale.set(0.25, 0.8, 0.25); tip.rotation.x = -Math.PI / 2; g.add(tip);
  for (const [x, z] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.4], [0.9, -1.4]]) g.add(P(GEO.box, x, -1.0, z, 0.4, 1.2, 0.5));
  const wingGeo = new THREE.BufferGeometry();
  const V = [[0, 0, 0.9], [0, 0, -1.8], [5.6, 0.7, 1.4], [6.6, 0.3, -0.5], [4.6, 0, -2.6], [2.3, 0, -2.9]];
  const tri = [[0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 1]], arr = [];
  for (const t of tri) for (const i of t) arr.push(...V[i]);
  wingGeo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); wingGeo.computeVertexNormals();
  const wm = new THREE.MeshStandardMaterial({ color: 0x3a1418, side: THREE.DoubleSide, roughness: 0.55 });
  for (const sx of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(sx * 0.8, 0.7, 0.6); w.scale.x = sx;
    w.add(new THREE.Mesh(wingGeo, wm));
    const bone = P(GEO.cyl, 2.8, 0.35, 1.15, 0.09, 5.7, 0.09); bone.rotation.z = -Math.PI / 2 + 0.12; bone.rotation.y = -0.09; w.add(bone);
    for (const [x, y, z] of [[5.6, 0.7, 1.4], [6.6, 0.3, -0.5], [4.6, 0, -2.6], [3.4, 0.5, 1.2]]) w.add(R(x, y, z, 0.17));
    g.add(w); if (sx < 0) u.wingL = w; else u.wingR = w;
  }
  // detail: jaw and teeth, nostrils, brows, a crown of horns, spines down the back, belly plates, thighs and claws, wing fingers, tail fin
  const sc = 0x2a1a1e, bone = 0xe8dcc8, belly = 0x4a1820;
  const jaw = new THREE.Group(); jaw.position.set(0, -0.3, 0.3); jaw.add(P(GEO.box, 0, -0.06, 0.55, 0.42, 0.14, 1.0, sc)); for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) { const t = P(GEO.cone, sx * 0.19, 0.06, 0.25 + i * 0.22, 0.035, 0.13, 0.035, bone); jaw.add(t); } head.add(jaw); u.jaw = jaw;
  for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) { const t = P(GEO.cone, sx * 0.2, -0.3, 0.55 + i * 0.2, 0.035, 0.13, 0.035, bone); t.rotation.x = Math.PI; head.add(t); }
  for (const sx of [-1, 1]) { head.add(part(GEO.sph, 0xff5a2a, sx * 0.14, 0.07, 1.18, 0.045, 0.04, 0.05, true), P(GEO.box, sx * 0.34, 0.22, 0.22, 0.2, 0.09, 0.42, sc), part(GEO.sph, 0x1a0a0a, sx * 0.425, 0.08, 0.22, 0.03, 0.07, 0.05));
    const h2 = P(GEO.cone, sx * 0.4, 0.3, -0.25, 0.07, 0.45, 0.07, bone); h2.rotation.set(-1.2, 0, -sx * 0.5); head.add(h2); const h3 = P(GEO.cone, sx * 0.3, 0.52, -0.75, 0.06, 0.5, 0.06, bone); h3.rotation.x = -1.25; head.add(h3); const ch = P(GEO.cone, sx * 0.3, -0.3, -0.1, 0.05, 0.3, 0.05, sc); ch.rotation.set(Math.PI - 0.6, 0, sx * 0.4); head.add(ch); }
  for (let i = 0; i < 6; i++) { const t = i / 5, s = P(GEO.cone, 0, 1.2 + t * 1.9, 1.75 + t * 2.2, 0.07, 0.42 - t * 0.12, 0.07, sc); s.rotation.x = -0.7; g.add(s); }
  for (let i = 0; i < 6; i++) { const s = P(GEO.cone, 0, 1.05 - Math.abs(i - 2.5) * 0.05, 1.3 - i * 0.62, 0.09, 0.5, 0.09, sc); s.rotation.x = -0.35; g.add(s); }
  for (let i = 0; i < 9; i++) { const t = i / 8, s = P(GEO.cone, 0, 0.42 - t * 0.5, -2.2 - t * 5.2, 0.06, 0.4 - t * 0.25, 0.06, sc); s.rotation.x = -0.5; g.add(s); }
  for (let i = 0; i < 7; i++) g.add(P(GEO.box, 0, -0.86, 1.9 - i * 0.62, 0.95 - Math.abs(i - 3) * 0.1, 0.16, 0.54, belly)); for (let i = 0; i < 5; i++) { const t = i / 4; g.add(P(GEO.box, 0, 0.0 + t * 1.75, 2.45 + t * 2.1, 0.5 - t * 0.14, 0.14, 0.5, belly)); }
  for (const [x, z] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.4], [0.9, -1.4]]) { g.add(P(GEO.sph, x * 1.05, -0.35, z, 0.42, 0.6, 0.6, bk), P(GEO.box, x, -1.62, z + 0.22, 0.48, 0.2, 0.8, sc)); for (const dx of [-0.16, 0, 0.16]) { const c = P(GEO.cone, x + dx, -1.6, z + 0.72, 0.05, 0.28, 0.05, bone); c.rotation.x = Math.PI / 2; g.add(c); } }
  for (const sx of [-1, 1]) { const w = sx < 0 ? u.wingL : u.wingR; for (const [x, y, z] of [[6.6, 0.3, -0.5], [4.6, 0, -2.6], [2.3, 0, -2.9]]) { const L = Math.hypot(x, y, z - 0.9), f = P(GEO.cyl, x / 2, y / 2 + 0.03, (z + 0.9) / 2, 0.05, L, 0.05, sc); f.lookAt(x, y + 0.03, z); f.rotateX(Math.PI / 2); w.add(f); const cl = P(GEO.cone, x, y, z, 0.07, 0.4, 0.07, bone); cl.lookAt(x * 2, y, z * 2 - 0.9); cl.rotateX(Math.PI / 2); w.add(cl); } const th = P(GEO.cone, 5.75, 0.95, 1.55, 0.07, 0.5, 0.07, bone); w.add(th); }
  for (const sx of [-1, 1]) { const fin = P(GEO.box, sx * 0.3, -0.6, -7.6, 0.6, 0.05, 0.7, sc); fin.rotation.y = sx * 0.6; g.add(fin); g.add(R(sx * 0.62, 0.72, 0.65, 0.2), R(sx * 0.8, 0.1, -0.9, 0.17), R(sx * 0.55, 1.5, 3.0, 0.12)); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function animDragon(d, dt, flying) {
  const u = d.userData; u.t += dt;
  if (u.heroRuby) { const want = flying ? Math.sin(u.t * 4.4) * 0.55 : 0.5 + Math.sin(u.t * 1.2) * 0.05; u.flap.value += (want - u.flap.value) * Math.min(1, dt * (flying ? 30 : 3)); u.body.position.y = -1.75 + (flying ? Math.sin(u.t * 4.4 + 1.2) * 0.25 : Math.sin(u.t * 1.2) * 0.04); return; }
  const f = flying ? Math.sin(u.t * 4.2) * 0.55 : 0.9 + Math.sin(u.t * 1.3) * 0.04;
  u.wingL.rotation.z = -f; u.wingR.rotation.z = f;
  const sx = flying ? 1 : 0.55; u.wingL.scale.set(-sx, 1, 1); u.wingR.scale.set(sx, 1, 1);
  u.head.rotation.x = Math.sin(u.t * 0.9) * 0.06; u.head.rotation.y = flying ? 0 : Math.sin(u.t * 0.45) * 0.22; if (u.jaw) u.jaw.rotation.x = Math.max(0, Math.sin(u.t * 0.7) - 0.75) * 1.2;
  const b = 0.55 + 0.45 * Math.sin(u.t * 1.25); u.ruby.color.copy(u.base).multiplyScalar(0.7 + 1.5 * b);
}

// painted creatures: flat sprites that always face the camera, standing on their bottom edge
const sprTex = {}, sprLoader = new THREE.TextureLoader();
export function sprite(name, size = 1) { const t = (sprTex[name] ||= (() => { const x = sprLoader.load(`art/sprite/${name}.webp`); x.colorSpace = THREE.SRGBColorSpace; return x; })()); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, alphaTest: 0.35, transparent: false })); s.center.set(0.5, 0.04); s.scale.setScalar(size); return s; }
export function makeCritter(kind) {
  const g = new THREE.Group();
  if (kind === 'turtle') { g.add(sprite('turtle', 1.5)); return g; }
  if (kind === 'sprite') { g.add(sprite('bonbon', 1.5)); return g; }
  if (kind === 'cinder') { g.add(sprite('cinder', 1.7)); return g; }
  if (kind === 'cat') { g.add(sprite('cat', 1.3)); return g; }
  if (kind === 'tira' && getHero('tira')) { const t = heroStatic('tira', 0.5); g.add(t); return g; }
  if (kind === 'tira') { g.add(part(GEO.sph, 0x6b4630, 0, 0.15, -0.02, 0.15, 0.14, 0.2), part(GEO.sph, 0xf3e3cf, 0, 0.11, 0.06, 0.11, 0.09, 0.13), part(GEO.sph, 0x6b4630, 0, 0.27, 0.15, 0.12, 0.11, 0.11), part(GEO.sph, 0xf3e3cf, 0, 0.245, 0.215, 0.075, 0.065, 0.06), part(GEO.cone, 0x6b4630, -0.075, 0.4, 0.13, 0.04, 0.11, 0.04), part(GEO.cone, 0x6b4630, 0.075, 0.4, 0.13, 0.04, 0.11, 0.04), part(GEO.sph, 0x1a1210, -0.045, 0.29, 0.245, 0.017, 0.02, 0.012), part(GEO.sph, 0x1a1210, 0.045, 0.29, 0.245, 0.017, 0.02, 0.012), part(GEO.sph, 0xf2a0b0, 0, 0.255, 0.272, 0.014, 0.011, 0.01), part(GEO.sph, 0x6b4630, 0, 0.2, -0.22, 0.05, 0.06, 0.07)); for (const [x, z] of [[-0.08, 0.1], [0.08, 0.1], [-0.09, -0.1], [0.09, -0.1]]) g.add(part(GEO.sph, 0xf3e3cf, x, 0.03, z, 0.04, 0.03, 0.05)); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); }
  else if (kind === 'sprite') { g.add(part(GEO.sph, 0xffffff, 0, 0.2, 0, 0.18, 0.18, 0.22), part(GEO.cone, 0xffffff, -0.1, 0.5, 0.05, 0.05, 0.3, 0.05), part(GEO.cone, 0xffffff, 0.1, 0.5, 0.05, 0.05, 0.3, 0.05), part(GEO.sph, 0xbfe8ff, -0.2, 0.32, -0.05, 0.16, 0.2, 0.03, true), part(GEO.sph, 0xbfe8ff, 0.2, 0.32, -0.05, 0.16, 0.2, 0.03, true)); }
  else if (kind === 'turtle') { g.add(part(GEO.sph, 0xbfe3a0, 0, 0.22, 0, 0.42, 0.24, 0.48), part(GEO.sph, 0xfff3d0, 0, 0.34, 0, 0.28, 0.16, 0.32), part(GEO.sph, 0xbfe3a0, 0, 0.44, 0, 0.14, 0.08, 0.16), part(GEO.sph, 0xf5e3a0, 0, 0.22, 0.5, 0.14, 0.13, 0.16), part(GEO.sph, 0xf5e3a0, -0.36, 0.1, 0.26, 0.14, 0.05, 0.1), part(GEO.sph, 0xf5e3a0, 0.36, 0.1, 0.26, 0.14, 0.05, 0.1)); }
  else if (kind === 'cat') { g.add(part(GEO.cyl, 0xd98a2b, 0, 0.12, 0, 0.5, 0.24, 0.5), part(GEO.sph, 0xffffff, 0, 0.3, 0, 0.36, 0.22, 0.32), part(GEO.sph, 0xffffff, 0.2, 0.42, 0.16, 0.15, 0.14, 0.14), part(GEO.cone, 0xffffff, 0.14, 0.58, 0.16, 0.05, 0.1, 0.05), part(GEO.cone, 0xffffff, 0.27, 0.58, 0.16, 0.05, 0.1, 0.05)); }
  return g;
}
export function makeProp(name) {
  const g = new THREE.Group();
  if (name === 'flask') g.add(part(GEO.cyl, 0x8a5a3a, 0, 0.2, 0, 0.12, 0.3, 0.08), part(GEO.cyl, 0xd9b36a, 0, 0.4, 0, 0.05, 0.1, 0.05));
  else if (name === 'bun') g.add(part(GEO.sph, 0xd9963a, 0, 0.14, 0, 0.18, 0.12, 0.18), part(GEO.sph, 0xf5d68a, 0, 0.2, 0, 0.12, 0.06, 0.12));
  else if (name === 'picnic') { g.add(part(GEO.box, 0xf7a8c8, 0, 0.02, 0, 2.2, 0.04, 1.7), part(GEO.box, 0xffffff, 0, 0.03, 0, 2.2, 0.04, 0.3), part(GEO.box, 0xffffff, 0, 0.035, 0, 0.3, 0.04, 1.7), part(GEO.cyl, 0xc98a5a, -0.6, 0.2, 0.3, 0.3, 0.4, 0.3), part(GEO.cyl, 0xfff1d6, 0.4, 0.1, -0.3, 0.1, 0.16, 0.1), part(GEO.cyl, 0xfff1d6, 0.7, 0.1, 0.2, 0.1, 0.16, 0.1), part(GEO.sph, 0x4a2814, 0.4, 0.17, -0.3, 0.085, 0.02, 0.085), part(GEO.sph, 0x4a2814, 0.7, 0.17, 0.2, 0.085, 0.02, 0.085), part(GEO.sph, 0xa8d88a, -0.1, 0.07, -0.45, 0.16, 0.05, 0.12)); }
  else if (name === 'crates') { g.add(part(GEO.box, 0x8a6248, 0, 0.6, 0, 1.3, 1.2, 1.3), part(GEO.box, 0x7a5238, 1.25, 0.5, 0.2, 1.1, 1, 1.1), part(GEO.box, 0x9a7254, 0.5, 1.6, 0.1, 1, 0.9, 1), part(GEO.cyl, 0x6b4a36, -1.1, 0.6, 0.5, 0.5, 1.2, 0.5)); for (const [x, y] of [[0, 0.6], [1.25, 0.5], [0.5, 1.6]]) g.add(part(GEO.box, 0x5a3a26, x, y, 0.66, 1.0, 0.12, 0.04)); }
  else if (name === 'purse') g.add(part(GEO.sph, 0x8e1b2c, 0, 0.14, 0, 0.14, 0.14, 0.14), part(GEO.sph, 0xe9b949, 0, 0.3, 0, 0.05, 0.05, 0.05));
  else if (name === 'spyglass') { const m = part(GEO.cyl, 0xc9a04a, 0, 0.12, 0, 0.05, 0.5, 0.05); m.rotation.z = Math.PI / 2; g.add(m); }
  else if (name === 'herbs') g.add(part(GEO.cone, 0x7fc98a, 0, 0.25, 0, 0.25, 0.5, 0.25), part(GEO.sph, 0xbfa0e8, 0, 0.5, 0, 0.1, 0.1, 0.1));
  else if (name === 'sapling') { for (const x of [-0.4, 0.4]) g.add(part(GEO.cyl, 0xb9774a, x, 0.15, 0, 0.2, 0.3, 0.2), part(GEO.cyl, 0xffffff, x, 0.8, 0, 0.05, 1.0, 0.05), part(GEO.cyl, 0xe23a4a, x, 0.6, 0, 0.055, 0.14, 0.055), part(GEO.cyl, 0xe23a4a, x, 1.0, 0, 0.055, 0.14, 0.055), part(GEO.sph, 0x9fe0b0, x, 1.4, 0, 0.25, 0.2, 0.25)); }
  else if (name === 'pouch') g.add(part(GEO.sph, 0xc9a0dc, 0, 0.2, 0, 0.25, 0.2, 0.2), part(GEO.box, 0xfff1d6, 0, 0.36, 0, 0.3, 0.05, 0.22));
  else if (name === 'turtle' || name === 'cat' || name === 'sprite' || name === 'tira' || name === 'cinder') return makeCritter(name);
  return g;
}
// ring to fly through
export function makeRing(color = 0xffb347) { const m = new THREE.Mesh(new THREE.TorusGeometry(7, 0.35, 6, 28), new THREE.MeshBasicMaterial({ color, fog: false, transparent: true, opacity: 0.9 })); return m; }
