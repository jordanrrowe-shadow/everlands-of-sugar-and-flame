// Rigged, animated people built from Quaternius's CC0 kits: Universal Base Characters (heads, hair),
// Modular Character Outfits – Fantasy (bodies) and the Universal Animation Library. Gowns, robes, capes,
// crowns and the other story-specific pieces are added on top and follow the skeleton.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { GEO, part, mat } from './kit.js';

const loader = new GLTFLoader(), src = {}, clips = {}, tl = new THREE.TextureLoader(), light = {};
const skinTex = (male) => { const k = male ? 'T_Superhero_Male_Light' : 'T_Superhero_Female_Light_BaseColor'; if (!light[k]) { const t = tl.load(`models/chars/${k}.jpg`); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; light[k] = t; } return light[k]; };
const NAMES = ['Female_Peasant', 'Male_Peasant', 'Male_Ranger', 'Superhero_Female_FullBody', 'Superhero_Male_FullBody', 'Hair_Long', 'Hair_Buns', 'Hair_SimpleParted', 'Hair_Beard'];
let ready = false, loading = null, ladies = false; const lady = {}, ladyClips = {};
export const peopleReady = () => ready;
export function loadPeople() {
  if (!loading) loading = Promise.all([...NAMES.map((n) => loader.loadAsync(`models/chars/${n}.gltf`).then((g) => { src[n] = g.scene; })), loader.loadAsync('models/chars/anims.glb').then((g) => { for (const c of g.animations) { c.tracks = c.tracks.filter((t) => !/^root\.position/.test(t.name)); clips[c.name] = c; } })])
    .then(() => { ready = true; return Promise.all(['Formal', 'Witch'].map((n) => loader.loadAsync(`models/umw/${n}.glb`).then((g) => { lady[n] = g.scene; for (const c of g.animations) ladyClips[c.name] = c; }))).then(() => { ladies = true; }).catch((e) => console.warn('lady models unavailable', e?.message)); }).catch((e) => { console.warn('character models unavailable, using simple figures', e?.message); });
  return loading;
}
const MALE = /King|Ashlock|Aldren|Steward|Boy|Orin|Brand|Tafford|Marsh|Guard|Warden|Attendant|Baker|Confectioner|Merchant|Seller|Balloonist|Archivist|Traveller$/;
function tint(mat, color, amt = 0.85, gain = 2.3) { // keep the texture's shading, replace its hue
  const m = mat.clone(); m.color = new THREE.Color(color); m.envMapIntensity = 0.6;
  m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP\n vec4 sampledDiffuseColor = texture2D( map, vMapUv );\n float lm = dot(sampledDiffuseColor.rgb, vec3(0.3333));\n diffuseColor.rgb *= mix(sampledDiffuseColor.rgb / max(diffuse, vec3(0.05)), vec3(0.42 + lm * ${gain.toFixed(2)}), ${amt.toFixed(2)});\n diffuseColor.a *= sampledDiffuseColor.a;\n#endif`); };
  m.customProgramCacheKey = () => 'ptint' + amt + gain; return m;
}
function headOnly(mat, skin, male) { // the base body is hidden below the neck; clothes cover the rest
  const m = mat.clone(); m.map = skinTex(male); m.color = new THREE.Color(skin || 0xffffff).lerp(new THREE.Color(0xffffff), 0.7); m.envMapIntensity = 0.5; m.emissive = new THREE.Color(skin || 0xf0c8a8).multiplyScalar(0.13);
  m.onBeforeCompile = (sh) => { sh.vertexShader = 'varying float vBindY;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvBindY = position.y;'); sh.fragmentShader = 'varying float vBindY;\n' + sh.fragmentShader.replace('#include <map_fragment>', 'if (vBindY < 1.475) discard;\n#include <map_fragment>'); };
  m.customProgramCacheKey = () => 'head'; return m;
}
function skinMat(mat, skin) { return tint(mat, new THREE.Color(skin || 0xf0c8a8).getHex(), 0.85, 1.5); }
export function makeRig(L) {
  const male = L.style === 'man' || L.style === 'guard' || MALE.test(L.name || ''); if (!male && ladies) return makeLady(L);
  const g = new THREE.Group(), u = (g.userData = { rig: true, t: 0 });
  const body = SkeletonUtils.clone(src[L.style === 'guard' ? 'Male_Ranger' : male ? 'Male_Peasant' : 'Female_Peasant']); g.add(body);
  let skel = null; const robed = L.style === 'girl' || L.style === 'woman' || L.style === 'elder';
  body.traverse((o) => { if (!o.isSkinnedMesh) return; skel = skel || o.skeleton; o.castShadow = true; o.frustumCulled = false; if (/Hood/.test(o.name)) o.visible = false;
    o.material = /Regular|Superhero/.test(o.material.name) ? skinMat(o.material, L.skin) : tint(o.material, L.top, 0.8); });
  const bone = {}; skel.bones.forEach((b) => (bone[b.name] = b));
  const add = (name, fix) => { const p = SkeletonUtils.clone(src[name]), list = []; p.traverse((o) => { if (o.isSkinnedMesh) list.push(o); });
    for (const o of list) { const sk = new THREE.Skeleton(o.skeleton.bones.map((b) => bone[b.name]), o.skeleton.boneInverses); g.add(o); o.bind(sk, o.bindMatrix); o.castShadow = true; o.frustumCulled = false; fix(o); } };
  add(male ? 'Superhero_Male_FullBody' : 'Superhero_Female_FullBody', (o) => { o.material = /Hair/.test(o.material.name) ? tint(o.material, L.hair, 1, 2.2) : /Eye/.test(o.material.name) ? o.material : headOnly(o.material, L.skin, male); });
  const hair = L.hairLong ? 'Hair_Long' : L.style === 'woman' || (L.style === 'elder' && !male) ? 'Hair_Buns' : 'Hair_SimpleParted';
  add(hair, (o) => { o.material = tint(o.material, L.hair, 1, 2.2); }); if (male && L.style === 'elder') add('Hair_Beard', (o) => { o.material = tint(o.material, L.hair, 1, 2.2); });
  // story-specific pieces, attached to bones so they move with the body
  g.updateMatrixWorld(true); const on = (b, m) => { g.add(m); m.updateMatrixWorld(true); bone[b].attach(m); m.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return m; };
  if (robed) { const long = L.style !== 'girl', sk = new THREE.Group();
    sk.add(part(GEO.frustum, L.skirt, 0, long ? 0.5 : 0.54, 0, long ? 0.33 : 0.43, long ? 0.98 : 0.9, long ? 0.33 : 0.43));
    if (!long) { sk.add(part(GEO.frustum, L.trim || 0xffffff, 0, 0.17, 0, 0.5, 0.18, 0.5), part(GEO.frustum, L.skirt, 0, 0.33, 0, 0.47, 0.18, 0.47)); }
    else if (L.trim) sk.add(part(GEO.frustum, L.trim, 0, 0.06, 0, 0.36, 0.1, 0.36)); on('pelvis', sk); }
  if (L.apron) on('spine_01', part(GEO.box, L.apron, 0, 0.92, 0.17, 0.3, 0.55, 0.03));
  if (L.cape) { const c = part(GEO.box, L.cape, 0, 0.92, -0.17, 0.4, 0.95, 0.03); c.rotation.x = 0.08; on('spine_03', c); }
  if (L.collar) on('spine_03', part(GEO.sph, L.collar, 0, 1.47, 0, 0.24, 0.08, 0.2));
  if (L.flower) on('Head', part(GEO.sph, L.flower, 0.13, 1.72, 0.07, 0.055, 0.055, 0.04));
  if (L.crown) on('Head', part(GEO.cyl, 0xe9b949, 0, 1.8, 0, 0.11, 0.08, 0.11));
  if (L.glasses) on('Head', part(GEO.box, 0x333333, 0, 1.665, 0.105, 0.17, 0.02, 0.015));
  if (L.tira) { const bag = new THREE.Group(); bag.add(part(GEO.box, 0xc9a0dc, -0.3, 0.95, 0.05, 0.16, 0.24, 0.24), part(GEO.sph, 0x6b4630, -0.3, 1.1, 0.07, 0.09, 0.08, 0.11), part(GEO.sph, 0xf3e3cf, -0.3, 1.13, 0.16, 0.06, 0.055, 0.055)); on('pelvis', bag); }
  if (L.style === 'guard') { g.add(part(GEO.cyl, 0x6b4a2a, 0.42, 1.15, 0.1, 0.022, 2.3, 0.022), part(GEO.cone, 0xcfd3d6, 0.42, 2.4, 0.1, 0.06, 0.22, 0.06)); }
  // animation
  u.mixer = new THREE.AnimationMixer(body); u.actions = {}; u.cur = null;
  u.play = (name, fade = 0.22) => { if (u.cur === name || !clips[name]) return; const a = (u.actions[name] = u.actions[name] || u.mixer.clipAction(clips[name])); a.reset().setEffectiveWeight(1).fadeIn(fade).play(); if (u.cur && u.actions[u.cur]) u.actions[u.cur].fadeOut(fade); u.cur = name; };
  u.once = (name) => { if (!clips[name]) return; const a = u.mixer.clipAction(clips[name]); a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false; a.fadeIn(0.1).play(); u.busyT = clips[name].duration * 0.8; if (u.cur && u.actions[u.cur]) u.actions[u.cur].setEffectiveWeight(0.15); u.one = a; };
  u.A = { idle: 'Idle_Loop', walk: 'Walk_Loop', jog: 'Jog_Fwd_Loop', sit: 'Sitting_Idle_Loop', air: 'Jump_Loop', talk: 'Idle_Talking_Loop', cast: 'Spell_Simple_Shoot' }; u.cast = () => u.once(u.A.cast);
  u.play('Idle_Loop', 0); u.mixer.update(Math.random() * 3);
  const h = (L.h || 1) * (L.style === 'child' ? 0.66 : 1) * 1.06; g.scale.setScalar(h); u.h = h; u.fast = L.style === 'girl' || L.style === 'child';
  return g;
}
// Women and girls: Quaternius "Ultimate Modular Women" (CC0). Flat-colour parts, so skin, hair and dress are set exactly.
function makeLady(L) {
  const g = new THREE.Group(), u = (g.userData = { rig: true, t: 0 }), elder = L.style === 'woman' || L.style === 'elder', base = elder ? 'Witch' : 'Formal';
  const body = SkeletonUtils.clone(lady[base]); g.add(body); let skel = null; const dark = new THREE.Color(L.skirt || L.top).multiplyScalar(0.55).getHex();
  const paint = (o, headOnly) => { const pn = /Head|Body|Feet|Legs/.test(o.name) ? o.name : o.parent.name, mn = o.material.name, head = /Head/.test(pn); if (headOnly && !head) { o.visible = false; return false; }
    let c; if (mn === 'Skin') c = L.skin || 0xf0c8a8; else if (mn === 'Hair_Black' || (head && mn === 'Red')) c = L.hair; else if (head && (mn === 'Purple' || mn === 'Gold')) { o.visible = false; return true; } else if (head) c = 0x3a2418;
    else if (/Feet/.test(pn)) c = dark; else if (mn === 'Gold') c = L.trim || 0xe9b949; else if (mn === 'LimeGreen' || mn === 'Purple') c = L.top; else c = dark;
    o.material = mat(c ?? 0x8a6a5a); o.castShadow = true; o.frustumCulled = false; return true; };
  const swapHead = !!L.hairLong && base === 'Formal';
  body.traverse((o) => { if (!o.isSkinnedMesh) return; skel = skel || o.skeleton; paint(o); const pn = /Head|Body|Feet|Legs/.test(o.name) ? o.name : o.parent.name; if (swapHead && /Head/.test(pn)) o.visible = false; });
  const bone = {}; skel.bones.forEach((b) => (bone[b.name] = b));
  if (swapHead) { const p = SkeletonUtils.clone(lady.Witch), list = []; p.traverse((o) => { if (o.isSkinnedMesh) list.push(o); }); for (const o of list) { const pn = /Head|Body|Feet|Legs/.test(o.name) ? o.name : o.parent.name; if (!/Head/.test(pn)) continue; const fake = { name: 'Witch_Head', isBone: false }; const keep = o.material.name; const sk = new THREE.Skeleton(o.skeleton.bones.map((b) => bone[b.name]), o.skeleton.boneInverses); o.name = 'Witch_Head'; g.add(o); o.bind(sk, o.bindMatrix); paint(o); } }
  g.updateMatrixWorld(true); const on = (b, m) => { g.add(m); m.updateMatrixWorld(true); (bone[b] || bone.Hips).attach(m); m.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return m; };
  { const long = L.style !== 'girl', sk = new THREE.Group(); sk.add(part(GEO.frustum, L.skirt, 0, long ? 0.56 : 0.6, 0, long ? 0.34 : 0.45, long ? 1.08 : 0.98, long ? 0.34 : 0.45));
    if (!long) sk.add(part(GEO.frustum, L.trim || 0xffffff, 0, 0.19, 0, 0.52, 0.2, 0.52), part(GEO.frustum, L.skirt, 0, 0.36, 0, 0.49, 0.2, 0.49)); else if (L.trim) sk.add(part(GEO.frustum, L.trim, 0, 0.07, 0, 0.37, 0.11, 0.37)); on('Hips', sk); }
  if (L.apron) on('Abdomen', part(GEO.box, L.apron, 0, 0.98, 0.17, 0.3, 0.6, 0.03));
  if (L.cape) { const c = part(GEO.box, L.cape, 0, 1.0, -0.15, 0.42, 1.0, 0.03); c.rotation.x = 0.07; on('Chest', c); }
  if (L.collar) on('Chest', part(GEO.sph, L.collar, 0, 1.55, 0.02, 0.24, 0.08, 0.2));
  if (L.flower) on('Head', part(GEO.sph, L.flower, 0.14, 1.8, 0.08, 0.055, 0.055, 0.04));
  if (L.crown) on('Head', part(GEO.cyl, 0xe9b949, 0, 1.9, 0.02, 0.11, 0.08, 0.11));
  if (L.glasses) on('Head', part(GEO.box, 0x333333, 0, 1.72, 0.19, 0.2, 0.02, 0.015));
  if (L.tira) { const bag = new THREE.Group(); bag.add(part(GEO.box, 0xc9a0dc, -0.3, 1.0, 0.05, 0.16, 0.24, 0.24), part(GEO.sph, 0x6b4630, -0.3, 1.15, 0.07, 0.09, 0.08, 0.11), part(GEO.sph, 0xf3e3cf, -0.3, 1.18, 0.16, 0.06, 0.055, 0.055)); on('Hips', bag); }
  u.mixer = new THREE.AnimationMixer(body); u.actions = {}; u.cur = null; const cl = ladyClips;
  u.play = (name, fade = 0.22) => { if (u.cur === name || !cl[name]) return; const a = (u.actions[name] = u.actions[name] || u.mixer.clipAction(cl[name])); a.reset().setEffectiveWeight(1).fadeIn(fade).play(); if (u.cur && u.actions[u.cur]) u.actions[u.cur].fadeOut(fade); u.cur = name; };
  u.once = (name) => { if (!cl[name]) return; const a = u.mixer.clipAction(cl[name]); a.reset(); a.setLoop(THREE.LoopOnce, 1); a.fadeIn(0.1).play(); u.busyT = cl[name].duration * 0.8; if (u.cur && u.actions[u.cur]) u.actions[u.cur].setEffectiveWeight(0.15); u.one = a; };
  u.A = { idle: 'Idle', walk: 'Walk', jog: 'Run', sit: 'Idle', air: 'Idle', talk: 'Idle', cast: 'Interact' }; u.cast = () => u.once('Interact');
  u.play('Idle', 0); u.mixer.update(Math.random() * 3);
  const h = (L.h || 1) * (L.style === 'child' ? 0.62 : 1) * 1.0; g.scale.setScalar(h); u.h = h; u.fast = L.style === 'girl' || L.style === 'child';
  return g;
}
export function animRig(p, dt, moving) {
  const u = p.userData; if (u.busyT > 0) { u.busyT -= dt; if (u.busyT <= 0 && u.one) { u.one.fadeOut(0.2); if (u.cur && u.actions[u.cur]) u.actions[u.cur].setEffectiveWeight(1); } }
  const A = u.A; u.play(u.pose === 'sit' ? A.sit : u.pose === 'air' ? A.air : moving ? (u.fast ? A.jog : A.walk) : u.pose === 'talk' ? A.talk : A.idle);
  u.mixer.update(dt);
}
