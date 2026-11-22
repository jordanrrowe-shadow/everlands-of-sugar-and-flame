// Rigged, animated people from Quaternius's CC0 "Ultimate Modular Women" and "Ultimate Modular Men" packs.
// Both share one skeleton and a flat-colour style, so skin, hair and clothes are painted exactly per character.
// Gowns, robes, capes, crowns and the other story-specific pieces are added on top and follow the bones.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { GEO, part, mat } from './kit.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), src = {}, clips = { lady: {}, man: {} };
// Sculpted hero models (generated from the authors' character art): Amber, Kim and the King are rigged and animated; Ruby and Tira are statues the game moves itself.
const hero = {}, HEROES = ['amber', 'amber-coat', 'kim', 'king', 'ruby', 'tira', 'lava', 'smorella', 'tafford', 'praline', 'ashlock'], HERO_OF = { Amber: 'amber', Kim: 'kim', 'The King': 'king', 'Grandma Lava': 'lava', Smorella: 'smorella', Tafford: 'tafford', 'Madame Praline': 'praline', 'Lord Ashlock': 'ashlock' }, HERO_H = { kim: 1.07, king: 1.15, amber: 1.12, 'amber-coat': 1.12, lava: 1.0, smorella: 1.1, tafford: 1.2, praline: 0.98, ashlock: 1.2 };
export const getHero = (n) => hero[n];
export function heroStatic(n, size) { const h = hero[n]; if (!h) return null; const m = h.scene.clone(true), box = new THREE.Box3().setFromObject(m), sz = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3()), k = size / Math.max(sz.x, sz.y, sz.z), g = new THREE.Group(); m.position.set(-c.x * k, -box.min.y * k, -c.z * k); m.scale.multiplyScalar(k); g.add(m); g.userData.size = sz.multiplyScalar(k); m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.material.envMapIntensity = 0.5; o.material.metalness = 0; o.material.roughness = 0.85; } }); return g; }
const LADIES = ['Formal', 'Witch'], MEN = ['King', 'Farmer', 'Adventurer', 'Worker', 'Suit', 'Casual'];
let ready = false, loading = null;
export const peopleReady = () => ready;
export function loadPeople() {
  const get = (dir, n, kind) => loader.loadAsync(`models/${dir}/${n}.glb`).then((g) => { src[n] = g.scene; for (const c of g.animations) clips[kind][c.name] = clips[kind][c.name] || c; });
  if (!loading) loading = Promise.all([...LADIES.map((n) => get('umw', n, 'lady')), ...MEN.map((n) => get('men', n, 'man'))])
    .then(() => { ready = true; return Promise.all(HEROES.map((n) => loader.loadAsync(`models/hero/${n}.glb`).then((g) => { for (const c of g.animations) if (/Walk|Run/.test(c.name)) for (const t of c.tracks) if (/Hips\.position$/.test(t.name)) for (let i = 0; i < t.values.length; i += 3) { t.values[i] = t.values[0]; t.values[i + 2] = t.values[2]; } hero[n] = { scene: g.scene, clips: Object.fromEntries(g.animations.map((c) => [c.name, c])) }; }).catch((e) => console.warn('hero model missing', n, e?.message)))); }).catch((e) => { console.warn('character models unavailable, using simple figures', e?.message); });
  return loading;
}
const MALE = /King|Ashlock|Aldren|Steward|Boy|Orin|Brand|Tafford|Marsh|Guard|Warden|Attendant|Baker|Confectioner|Merchant|Seller|Balloonist|Archivist|^Traveller$/;
const partOf = (o) => (/Head|Body|Feet|Legs|Pants|Backpack|Pistol/.test(o.name) ? o.name : o.parent.name);
const shade = (c, k) => new THREE.Color(c).multiplyScalar(k).getHex();
const hash = (s) => { let h = 7; for (const ch of s || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
const two = new Map(); const cloth = (c) => { let m = two.get(c); if (!m) { m = mat(c).clone(); m.side = THREE.DoubleSide; two.set(c, m); } return m; };
const capeGeo = new Map();
function cape(color, yTop, yBot, rBot) { // a tapered half-shell that hangs from the shoulders and wraps the back
  const k = yBot + '|' + rBot; let g = capeGeo.get(k);
  if (!g) { g = new THREE.CylinderGeometry(0.15, rBot, yTop - yBot, 14, 4, true, Math.PI - 1.3, 2.6); capeGeo.set(k, g); }
  const m = new THREE.Mesh(g, cloth(color)); m.position.set(0, (yTop + yBot) / 2, 0.0); m.scale.set(1.22, 1, 1); return m;
}
const ringGeo = new THREE.TorusGeometry(0.115, 0.04, 8, 20);
function collar(color, y) { const m = new THREE.Mesh(ringGeo, mat(color)); m.rotation.x = Math.PI / 2; m.position.set(0, y, 0); m.scale.set(1.3, 1, 1); return m; } // fluff resting on the shoulders

// one figure = a body from one model, optionally the head of another, bound to the same bones
function assemble(g, bodyName, headName, paint, keep) {
  const body = SkeletonUtils.clone(src[bodyName]); g.add(body); let skel = null; const swap = headName && headName !== bodyName;
  body.traverse((o) => { if (!o.isSkinnedMesh) return; skel = skel || o.skeleton; const pn = partOf(o); o.castShadow = true; o.frustumCulled = false;
    if ((swap && /Head/.test(pn)) || (/Backpack|Pistol/.test(pn) && !keep)) { o.visible = false; return; } paint(o, pn); });
  const bone = {}; skel.bones.forEach((b) => (bone[b.name] = b));
  if (swap) { const p = SkeletonUtils.clone(src[headName]), list = []; p.traverse((o) => { if (o.isSkinnedMesh && /Head/.test(partOf(o))) list.push([o, partOf(o)]); });
    for (const [o, pn] of list) { const sk = new THREE.Skeleton(o.skeleton.bones.map((b) => bone[b.name]), o.skeleton.boneInverses); g.add(o); o.bind(sk, o.bindMatrix); o.castShadow = true; o.frustumCulled = false; paint(o, pn); } }
  g.updateMatrixWorld(true);
  const on = (b, m) => { g.add(m); m.updateMatrixWorld(true); (bone[b] || bone.Hips).attach(m); m.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return m; };
  return { body, on, bone };
}
function animate(u, body, cl) {
  u.mixer = new THREE.AnimationMixer(body); u.actions = {}; u.cur = null;
  u.play = (name, fade = 0.22) => { if (u.cur === name || !cl[name]) return; const a = (u.actions[name] = u.actions[name] || u.mixer.clipAction(cl[name])); a.reset().setEffectiveWeight(1).fadeIn(fade).play(); if (u.cur && u.actions[u.cur]) u.actions[u.cur].fadeOut(fade); u.cur = name; };
  u.once = (name) => { if (!cl[name]) return; const a = u.mixer.clipAction(cl[name]); a.reset(); a.setLoop(THREE.LoopOnce, 1); a.fadeIn(0.1).play(); u.busyT = cl[name].duration * 0.8; if (u.cur && u.actions[u.cur]) u.actions[u.cur].setEffectiveWeight(0.15); u.one = a; };
  u.A = { idle: 'Idle', walk: 'Walk', jog: 'Run', sit: 'Idle', air: 'Idle', talk: 'Idle', cast: 'Interact' }; u.cast = () => u.once('Interact');
  u.play('Idle', 0); u.mixer.update(Math.random() * 3);
}
// hang a piece from a pivot at its top so it can swing behind a moving body
function swing(u, y, mesh, amp) { const pv = new THREE.Group(), inn = new THREE.Group(); pv.position.y = y; mesh.position.y -= y; inn.add(mesh); pv.add(inn); (u.sway ||= []).push([inn, amp]); return pv; }
function extras(L, on, lady) {
  if (L.apron) on('Abdomen', part(GEO.box, L.apron, 0, lady ? 0.98 : 1.02, lady ? 0.17 : 0.165, lady ? 0.3 : 0.27, lady ? 0.6 : 0.46, 0.03));
  if (L.flower) { const fl = new THREE.Group(); for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283; fl.add(part(GEO.sph, L.flower, 0, Math.sin(a) * 0.026, Math.cos(a) * 0.026, 0.008, 0.02, 0.02)); } fl.add(part(GEO.sph, 0xf2a93b, 0.004, 0, 0, 0.01, 0.014, 0.014)); fl.position.set(0.118, 1.76, 0.03); on('Head', fl); } // a small blossom tucked above the ear
  if (L.glasses) on('Head', part(GEO.box, 0x333333, 0, lady ? 1.72 : 1.7, 0.19, 0.2, 0.02, 0.015));
  if (L.tira) { const bag = new THREE.Group(); bag.add(part(GEO.box, 0xc9a0dc, -0.3, 1.0, 0.05, 0.16, 0.24, 0.24), part(GEO.sph, 0x6b4630, -0.3, 1.15, 0.07, 0.09, 0.08, 0.11), part(GEO.sph, 0xf3e3cf, -0.3, 1.18, 0.16, 0.06, 0.055, 0.055)); on('Hips', bag); }
}
export function makeRig(L) {
  const male = L.style === 'man' || L.style === 'guard' || (L.style !== 'woman' && L.style !== 'girl' && MALE.test(L.name || ''));
  let hk = HERO_OF[L.name]; if (hk === 'amber' && L.collar) hk = 'amber-coat'; if (hk && hero[hk]) return makeHero(L, hk);
  return male ? makeMan(L) : makeLady(L);
}
function makeHero(L, key) {
  const g = new THREE.Group(), u = (g.userData = { rig: true, hero: key, t: 0 }), H = hero[key], body = SkeletonUtils.clone(H.scene); g.add(body);
  body.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; o.material.envMapIntensity = 0.45; o.material.metalness = 0; o.material.roughness = 0.85; } });
  const cl = H.clips, has = (n, d) => (cl[n] ? n : d); animate(u, body, cl);
  u.A = { idle: 'Idle', walk: has('Walking_Woman', has('Casual_Walk', 'Idle')), jog: has('Run_02', has('Casual_Walk', 'Idle')), sit: has('Chair_Sit_Idle_F', has('Chair_Sit_Idle_M', 'Idle')), air: 'Idle', talk: has('Talk_with_Hands_Open', has('Talk_with_Right_Hand_Open', 'Idle')), cast: has('mage_soell_cast', 'Big_Wave_Hello'), sleep: has('Sleep_Normally', 'Idle'), dance: has('Joyful_Dance_with_Hand_Sway', 'Idle') };
  u.cast = () => u.once(u.A.cast); u.cur = null; u.play('Idle', 0);
  const h = HERO_H[key] || 1.1; g.scale.setScalar(h); u.h = h; u.fast = /amber|kim/.test(key);
  return g;
}
function makeLady(L) {
  const g = new THREE.Group(), u = (g.userData = { rig: true, t: 0 }), elder = L.style === 'woman' || L.style === 'elder' || !!L.gown, base = elder ? 'Witch' : 'Formal';
  const skirt = L.skirt || L.legs || L.top, dark = shade(skirt, 0.55);
  const paint = (o, pn) => { const mn = o.material.name, head = /Head/.test(pn);
    let c; if (mn === 'Skin') c = L.skin || 0xf0c8a8; else if (mn === 'Hair_Black' || (head && mn === 'Red')) c = L.hair; else if (head && (mn === 'Purple' || mn === 'Gold')) { o.visible = false; return; } else if (head) c = 0x3a2418;
    else if (/Feet/.test(pn)) c = L.accent || (elder ? skirt : dark); else if (mn === 'Gold') c = L.trim || 0xe9b949; else if (mn === 'LimeGreen' || mn === 'Purple') c = L.top; else c = L.accent || (elder ? skirt : dark);
    if (/Legs/.test(pn) || (elder && /Feet/.test(pn))) { o.visible = false; return; } o.material = mat(c ?? 0x8a6a5a); };
  const { body, on, bone } = assemble(g, base, L.hairLong && base === 'Formal' ? 'Witch' : null, paint);
  const long = elder, sk = new THREE.Group();
  if (L.tiers) { // a slim layered dress: three tiers falling from the waist, cream ruffles between
    const tier = (c, yBot, r) => part(GEO.frustum, c, 0, (1.1 + yBot) / 2, 0, r, 1.1 - yBot, r);
    sk.add(tier(L.top, 0.66, 0.25), tier(L.trim || 0xffffff, 0.56, 0.275), tier(skirt, 0.34, 0.3), tier(L.trim || 0xffffff, 0.25, 0.32), tier(L.top, 0.1, 0.335), part(GEO.sph, L.trim || 0xffffff, 0, 1.06, 0.12, 0.07, 0.045, 0.04)); }
  else sk.add(part(GEO.frustum, skirt, 0, long ? 0.56 : 0.6, 0, long ? 0.34 : 0.45, long ? 1.08 : 0.98, long ? 0.34 : 0.45));
  if (L.tiers) { // ruffles, ribbon bands, bows, an off-shoulder frill, puff sleeves, lace gloves and a necklace
    const cream = L.trim || 0xffffff, rose = shade(L.top, 0.82), ringOf = (n, r, y, sz, c, grp = sk) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283; grp.add(part(GEO.sph, c, Math.sin(a) * r, y, Math.cos(a) * r, sz, sz * 0.8, sz)); } };
    ringOf(16, 0.252, 0.655, 0.04, cream); ringOf(18, 0.302, 0.335, 0.043, cream); ringOf(20, 0.337, 0.1, 0.046, cream); ringOf(20, 0.325, 0.045, 0.04, 0xffffff);
    for (const [y, r] of [[0.72, 0.232], [0.4, 0.287], [0.16, 0.327]]) sk.add(part(GEO.frustum, rose, 0, y, 0, r, 0.035, r));
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + 0.5; sk.add(part(GEO.sph, 0xfff3c4, Math.sin(a) * 0.3, 0.24, Math.cos(a) * 0.3, 0.028, 0.028, 0.02), part(GEO.sph, 0xf2a93b, Math.sin(a) * 0.312, 0.24, Math.cos(a) * 0.312, 0.012, 0.012, 0.01)); }
    const bow = (x, y, z, sc, c, tails) => { const b = new THREE.Group(); for (const sgn of [-1, 1]) { const l = part(GEO.sph, c, sgn * 0.075, 0, 0, 0.075, 0.05, 0.028); l.rotation.z = sgn * 0.35; b.add(l); if (tails) { const tl = part(GEO.box, c, sgn * 0.045, -0.15, -0.01, 0.045, 0.26, 0.015); tl.rotation.z = sgn * 0.22; b.add(tl); } } b.add(part(GEO.sph, c, 0, 0, 0.01, 0.03, 0.03, 0.03)); b.position.set(x, y, z); b.scale.setScalar(sc); return b; };
    sk.add(part(GEO.frustum, cream, 0, 1.06, 0, 0.115, 0.07, 0.105)); on('Hips', bow(0, 1.08, -0.14, 1.5, cream, true));
    const top = new THREE.Group(); for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; top.add(part(GEO.sph, cream, Math.sin(a) * 0.19, 1.405 + Math.cos(a) * 0.012, Math.cos(a) * 0.115, 0.05, 0.042, 0.045)); }
    top.add(bow(0, 1.37, 0.135, 0.85, L.top), part(GEO.sph, 0xf2c14a, 0, 1.455, 0.085, 0.016, 0.016, 0.012)); for (let i = -3; i <= 3; i++) top.add(part(GEO.sph, 0xf2c14a, i * 0.022, 1.475 - Math.cos(i * 0.5) * 0.02 + 0.0, 0.07 + Math.cos(i * 0.5) * 0.012, 0.007, 0.007, 0.007));
    for (let i = 0; i < 3; i++) top.add(part(GEO.box, cream, 0, 1.3 - i * 0.055, 0.118, 0.07, 0.008, 0.008)); on('Chest', top);
    const wp = (n) => { const b = bone[n]; return b ? b.getWorldPosition(new THREE.Vector3()) : null; };
    for (const S of ['L', 'R']) { const a = wp('UpperArm' + S), e = wp('LowerArm' + S), w = wp('Wrist' + S); if (!a || !e || !w) continue;
      const puff = new THREE.Group(); puff.add(part(GEO.sph, L.top, 0, 0, 0, 0.082, 0.075, 0.082)); for (let i = 0; i < 8; i++) { const q = i / 8 * 6.283; puff.add(part(GEO.sph, cream, Math.sin(q) * 0.06, -0.06, Math.cos(q) * 0.06, 0.026, 0.02, 0.026)); } puff.position.copy(a).lerp(e, 0.22); on('UpperArm' + S, puff);
      const glove = new THREE.Group(); glove.add(part(GEO.sph, 0xfffaf0, 0, 0, 0, 0.04, 0.062, 0.04)); for (let i = 0; i < 7; i++) { const q = i / 7 * 6.283; glove.add(part(GEO.sph, 0xffffff, Math.sin(q) * 0.04, 0.055, Math.cos(q) * 0.04, 0.017, 0.014, 0.017)); } glove.add(part(GEO.sph, L.top, 0, 0.05, 0.045, 0.02, 0.014, 0.012)); glove.position.copy(w).lerp(e, 0.18); on('LowerArm' + S, glove); } } else if (!long) sk.add(part(GEO.frustum, L.trim || 0xffffff, 0, 0.19, 0, 0.52, 0.2, 0.52), part(GEO.frustum, skirt, 0, 0.36, 0, 0.49, 0.2, 0.49)); else if (L.trim) sk.add(part(GEO.frustum, L.trim, 0, 0.07, 0, 0.37, 0.11, 0.37)); if (long && L.accent) sk.add(part(GEO.frustum, L.accent, 0, 0.2, 0, 0.36, 0.16, 0.36)); on('Hips', sk);
  if (L.cape) on('Chest', swing(u, 1.46, long ? cape(L.cape, 1.46, 0.5, 0.36) : cape(L.cape, 1.46, 0.78, 0.33), 0.2));
  if (L.collar) on('Chest', collar(L.collar, 1.45));
  if (L.crown) on('Head', part(GEO.cyl, 0xe9b949, 0, 1.9, 0.02, 0.11, 0.08, 0.11));
  if (L.hairLong > 1) { // one continuous fall from the back of the head to the waist, lying on the back (or over the cape), with two locks over the shoulders
    const hg = new THREE.Group(), back = (y) => (y > 1.44 ? 0.085 + (1.68 - y) * 0.12 : L.cape ? 0.115 + (1.44 - y) * 0.33 : 0.115 + (1.44 - y) * 0.02);
    for (let i = 0; i < 15; i++) { const t = i / 14, y = 1.68 - t * 0.93, wd = (0.14 + 0.05 * Math.sin(t * Math.PI)) * (1 - t * 0.4); hg.add(part(GEO.sph, L.hair, Math.sin(t * 5) * 0.012, y, -back(y), wd, 0.1, 0.052 - t * 0.012));
      if (i > 2 && i % 2) for (const sgn of [-1, 1]) hg.add(part(GEO.sph, L.hair, sgn * (wd * 0.8 + 0.01 * Math.sin(i)), y - 0.03, -back(y) + 0.02, 0.05, 0.1, 0.042)); }
    for (const sgn of [-1, 1]) { hg.add(part(GEO.sph, L.hair, sgn * 0.07, 0.72, -back(0.72), 0.05, 0.09, 0.05)); for (let i = 0; i < 5; i++) { const t = i / 4, y = 1.6 - t * 0.42; hg.add(part(GEO.sph, L.hair, sgn * (0.115 + t * 0.02), y, 0.02 + t * 0.085, 0.042, 0.085, 0.045)); } }
    on('Chest', swing(u, 1.6, hg, 0.07)); }
  extras(L, on, true); animate(u, body, clips.lady);
  const h = (L.h || 1) * (L.style === 'child' ? 0.62 : 1); g.scale.setScalar(h); u.h = h; u.fast = L.style === 'girl' || L.style === 'child';
  return g;
}
const HEADS = ['Adventurer', 'Suit', 'Casual'], BODIES = ['Farmer', 'Casual', 'Adventurer', 'Worker'];
function makeMan(L) {
  const g = new THREE.Group(), u = (g.userData = { rig: true, t: 0 }), n = L.name || '', hsh = hash(n + (L.hair || 0));
  const king = /King/.test(n), guard = L.style === 'guard', elder = L.style === 'elder' && !king, child = L.style === 'child', pack = /^Traveller/.test(n);
  const bodyName = king || guard ? 'King' : elder ? 'Suit' : child ? 'Casual' : pack ? 'Adventurer' : L.apron ? (hsh % 2 ? 'Worker' : 'Farmer') : BODIES[hsh % BODIES.length];
  const headName = king || elder ? 'King' : /Seller|Marsh/.test(n) ? 'Farmer' : HEADS[(hsh >>> 3) % HEADS.length];
  const top = L.top || 0x8a6a5a, legs = L.legs || L.skirt || shade(top, 0.55), trim = L.trim || shade(top, 1.35), steel = guard ? 0x9a9ea6 : 0xd9b24a;
  const paint = (o, pn) => { const mn = o.material.name; let c;
    if (mn === 'Skin') c = L.skin || 0xe2b592; else if (mn === 'Skin_Darker') c = shade(L.skin || 0xe2b592, 0.9); else if (mn === 'Eye') c = 0x2a1a12;
    else if (/Head/.test(pn)) { if (/Hair|Eyebrows|Moustache/.test(mn)) c = L.hair; else if (mn === 'Gold') { if (!king) { o.visible = false; return; } c = 0xe9b949; } else if (mn === 'Beige') c = 0xe3cc94; else c = top; }
    else if (/Feet/.test(pn)) c = mn === 'Metal' ? shade(steel, 0.8) : /Brown2|Black|White/.test(mn) ? 0x2a1c16 : 0x4a3226;
    else if (/Legs|Pants/.test(pn)) c = /Metal/.test(mn) ? shade(steel, mn === 'Metal' ? 0.9 : 0.6) : mn === 'Brown2' ? shade(legs, 0.8) : legs;
    else if (/Backpack/.test(pn)) c = mn === 'Gold' ? 0xe9b949 : /Brown/.test(mn) ? 0x6b4630 : shade(top, 0.8);
    else if (mn === 'Metal') c = steel; else if (mn === 'Metal_Dark') c = shade(steel, 0.6);
    else if (/^(Blue|LightBlue|Green|Worker_Yellow|Suit)$/.test(mn) || (mn === 'LightBrown' && /Casual/.test(pn))) c = top;
    else if (mn === 'White') c = 0xf3ead8; else if (mn === 'Beige') c = king ? 0xf3ead8 : trim; else if (mn === 'Brown' && /Farmer/.test(pn)) c = shade(legs, 1.1); else c = trim;
    o.material = mat(c); };
  const { body, on } = assemble(g, bodyName, headName, paint, pack);
  if (elder) { const sk = new THREE.Group(); sk.add(part(GEO.frustum, L.skirt || shade(top, 0.75), 0, 0.55, 0, 0.36, 1.06, 0.36)); if (L.trim) sk.add(part(GEO.frustum, L.trim, 0, 0.07, 0, 0.39, 0.11, 0.39)); on('Hips', sk); }
  const cp = king ? L.cape || shade(top, 0.7) : pack ? 0 : L.cape; if (cp) on('Chest', swing(u, 1.5, cape(cp, 1.5, king ? 0.3 : 0.55, king ? 0.4 : 0.34), 0.16));
  if (L.collar) on('Chest', collar(L.collar, 1.5));
  if (L.crown && !king) on('Head', part(GEO.cyl, 0xe9b949, 0, 1.9, 0.02, 0.11, 0.08, 0.11));
  if (guard) g.add(part(GEO.cyl, 0x6b4a2a, 0.46, 1.15, 0.1, 0.022, 2.3, 0.022), part(GEO.cone, 0xcfd3d6, 0.46, 2.4, 0.1, 0.06, 0.22, 0.06));
  extras(L, on, false); animate(u, body, clips.man);
  const h = (L.h || 1) * (child ? 0.62 : 1); g.scale.setScalar(h); u.h = h; u.fast = child;
  return g;
}
export function animRig(p, dt, moving) {
  const u = p.userData; if (u.busyT > 0) { u.busyT -= dt; if (u.busyT <= 0 && u.one) { u.one.fadeOut(0.2); if (u.cur && u.actions[u.cur]) u.actions[u.cur].setEffectiveWeight(1); } }
  const A = u.A; if (u.fixedPose && A[u.fixedPose]) u.play(A[u.fixedPose]); else u.play(u.pose === 'sit' ? A.sit : u.pose === 'air' ? A.air : moving ? (u.fast ? A.jog : A.walk) : u.pose === 'talk' ? A.talk : A.idle);
  u.mixer.update(dt);
  if (u.sway) { u.st = (u.st || 0) + dt; for (const [g, amp] of u.sway) { const want = moving ? amp * (u.fast ? 1.5 : 1) * (1 + 0.28 * Math.sin(u.st * 7.5)) : amp * 0.1 * Math.sin(u.st * 1.4); g.rotation.x += (want - g.rotation.x) * Math.min(1, dt * 5); g.rotation.z = Math.sin(u.st * 3.1) * (moving ? 0.035 : 0.012); } }
}
