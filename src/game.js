// The game core: state, world loading, player + dragon control, NPCs, the script runner, saves.
import * as THREE from 'three';
import { buildEmber, buildSugar, buildSea, SKY } from './worlds.js';
import { makePerson, animPerson, makeDragon, animDragon, makeProp, makeRing } from './models.js';
import { GEO, mat, part, rnd, smooth } from './kit.js';
import { U, makeGrass, makeMotes, makeClouds, makeFall } from './gfx.js';
import { InkPass } from './ink.js';
import { loadPack, WORLD_PACKS } from './assets.js';
import { loadPeople } from './people.js';
import { playCut, WHO as CUTWHO } from './cut.js';
import { makeRoom, deckZone } from './rooms.js';
const PLAYS = {
  sugar: [{ id: 'stars', at: [95, 43], label: 'Star-hop the Marshmallow Meadows' }, { id: 'turtles', at: [-90, 33], label: 'Turtle round-up' }, { id: 'sled', at: [-5.5, -89], label: 'Sled the Ice Cream Mountain' },
    { id: 'tira', at: [-7, 14], label: 'Tira’s crumb hunt' }, { id: 'kim', at: [24, 3], label: 'Kim’s delivery round' }, { id: 'rubyfish', at: [-22, 141], label: 'Meanwhile, Ruby…', rings: [[-32, 8, 124], [-8, 12, 112], [22, 14, 126], [30, 12, 150], [5, 10, 162], [-26, 12, 156], [-52, 17, 166], [-32, 8, 124]] },
    { id: 'rings', at: [14, 132], label: 'Ring flight with Ruby', ruby: 1, rings: [[0, 34, 100], [-38, 44, 30], [-60, 52, -40], [0, 66, -96], [42, 62, -70], [86, 44, -62], [108, 48, 10], [40, 36, 90]] }],
  ember: [{ id: 'lanterns', at: [11, 47], label: 'Lantern dash' },
    { id: 'rings', at: [-22, 16], label: 'Ring flight with Ruby', ruby: 1, rings: [[-58, 40, -8], [-52, 48, -52], [-34, 56, -78], [0, 64, -112], [34, 56, -78], [52, 50, -58], [58, 42, -6], [0, 34, 34]] }],
};
import { spokenLine } from './story/speak.js';
import { CAST, CODEX } from './story/cast.js';
import p1 from './story/part1.js'; import p2 from './story/part2.js'; import p3 from './story/part3.js';
import * as UI from './ui.js';
import { Sound } from './audio.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const KEY = 'everlands.save.v1', BUILD = { ember: buildEmber, sugar: buildSugar, sea: buildSea };
const TIPS = {
  flame: 'Tap ✦ to throw a fire bolt. Hold ✦ close to something to light it. Hold longer, then let go, for a flare.', whistle: 'Tap ♪ Whistle (or Q).', stealth: 'The wardens carry lamps. Stay out of the light: hide in the wall’s shadow or behind the crates, and cross while they talk or have their backs turned.',
  fly: 'Steer with the left thumb. Fly through the glowing rings. » flies faster.', bounce: 'Jump onto a low marshmallow. Each bounce carries you higher.', asruby: 'Tonight you are Ruby. Climb to the circle.',
};
const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return 'h' + (h >>> 0).toString(36); };
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));

export class Game {
  constructor(canvas) {
    this.chapters = [...p1, ...p2, ...p3];
    this.S = this.blank(); this.mk = makePerson; this.tmp = {}; this.busy = 0; this.paused = true; this.t = 0; this.worlds = {}; this.npcs = []; this.things = []; this.inside = new Set(); this.lits = new Map(); this.rings = []; this.fxs = []; this.bolts = []; this.breaks = [];
    this.sound = new Sound();
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene(); this.scene.fog = new THREE.FogExp2(0xffffff, 0.003);
    this.cam = new THREE.PerspectiveCamera(58, 1, 0.3, 1800);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x886655, 1); this.sun = new THREE.DirectionalLight(0xffffff, 1); this.sun.position.set(-0.5, 1, 0.4); this.scene.add(this.hemi, this.sun, this.sun.target);
    // soft sun shadows that follow the player, and a gentle glow on lava, lamps and Ruby's scales
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; this.sun.castShadow = true; const sh = this.sun.shadow; sh.mapSize.set(2048, 2048); sh.camera.left = sh.camera.bottom = -42; sh.camera.right = sh.camera.top = 42; sh.camera.near = 1; sh.camera.far = 260; sh.bias = -0.0006; sh.normalBias = 0.6;
    r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.0; this.pmrem = new THREE.PMREMGenerator(r);
    this.clouds = makeClouds(); this.scene.add(this.clouds); this.motes = {}; this.grass = {};
    const rt = new THREE.WebGLRenderTarget(256, 256, { type: THREE.HalfFloatType, samples: 4 }); rt.depthTexture = new THREE.DepthTexture(256, 256); rt.depthTexture.type = THREE.UnsignedIntType;
    this.composer = new EffectComposer(r, rt); this.composer.addPass(new RenderPass(this.scene, this.cam)); this.ink = new InkPass(this.cam); this.composer.addPass(this.ink);
    this.lamps = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(0xffa040, 0, 26, 1.6); this.scene.add(l); return l; }); this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.7, 0.86); this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass());
    const dome = new THREE.SphereGeometry(1500, 24, 12); dome.setAttribute('color', new THREE.BufferAttribute(new Float32Array(dome.attributes.position.count * 3), 3));
    this.dome = new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); this.dome.renderOrder = -2; this.scene.add(this.dome);
    const sp = []; for (let i = 0; i < 500; i++) { const a = Math.random() * 6.28, e = Math.random() * 1.3 + 0.15; sp.push(Math.cos(a) * Math.cos(e) * 1400, Math.sin(e) * 1400, Math.sin(a) * Math.cos(e) * 1400); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.4, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9 })); this.scene.add(this.stars);
    this.player = { x: 0, y: 0, z: 0, vy: 0, yaw: 0, ground: true, who: 'amber', model: null, lookKey: '' };
    this.comp = null; this.camYaw = Math.PI; this.camPitch = 0.26; this.camDist = 7.5;
    this.ruby = { model: makeDragon(), x: 0, y: 0, z: 0, yaw: 0, pitch: 0, bank: 0, state: 'hidden', t: 0, speed: 0 }; this.ruby.model.rotation.order = 'YXZ'; this.ruby.model.visible = false; this.scene.add(this.ruby.model);
    this.flame = new THREE.Mesh(GEO.sph, new THREE.MeshBasicMaterial({ color: 0xffc040, transparent: true, opacity: 0.95 })); this.flame.visible = false; this.scene.add(this.flame);
    this.flameLight = new THREE.PointLight(0xffa040, 0, 14); this.scene.add(this.flameLight);
    this.spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.9, fog: false })); this.sparks = [];
    UI.initInput(canvas); this.journal = UI.initJournal(this);
    addEventListener('resize', () => this.resize()); addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250)); this.resize();
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.save(); });
    this.last = performance.now(); const loop = (now) => { requestAnimationFrame(loop); const raw = (now - this.last) / 1000, dt = Math.min(0.05, raw); this.last = now; if (!this.paused && this.started && !navigator.webdriver) { this.ft = (this.ft || 0.016) * 0.97 + raw * 0.03; this.ftT = (this.ftT || 0) + raw; if (this.ftT > 4) { this.ftT = 0; const rs = this.resScale || 1; if (this.ft > 0.04 && rs > 0.55) { this.resScale = rs - 0.15; this.resize(); } else if (this.ft < 0.02 && rs < 1) { this.resScale = Math.min(1, rs + 0.1); this.resize(); } } } for (let i = 0; i < (this.warp || 1); i++) this.update(dt); if (this.noRender || this.inCut) return; if (this.S.opt.fx !== false) this.composer.render(dt); else this.renderer.render(this.scene, this.cam); }; requestAnimationFrame(loop);
  }
  get f() { return this.S.flags; }
  get chapter() { return this.chapters[this.S.ch - 1]; }
  get W() { return this.worlds[this.S.world]; }
  blank() { return { ch: 1, max: 1, flags: {}, leads: [], items: {}, codex: [], vis: {}, sparks: 0, hp: 3, world: 'ember', time: 'day', pos: null, opt: { sound: true, invert: false, fast: false } }; }
  resize() { // one renderer budget for every screen, from an iPhone to a 12.9" iPad
    const box = this.renderer.domElement.getBoundingClientRect(), w = Math.max(innerWidth, Math.round(box.width) || 0), h = Math.max(innerHeight, Math.round(box.height) || 0), a = w / h; this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2, Math.sqrt(2.8e6 / (w * h))) * (this.resScale || 1));
    this.renderer.setSize(w, h, false); if (this.composer) { this.composer.setPixelRatio(this.renderer.getPixelRatio()); this.composer.setSize(w, h); } this.cam.aspect = a; this.cam.fov = a < 0.8 ? 74 : a < 1.6 ? 64 : 58; this.cam.updateProjectionMatrix(); this.camDist = a < 0.8 ? 8.5 : 7.5; }

  // ───────── saving ─────────
  hasSave() { try { return !!localStorage.getItem(KEY); } catch { return false; } }
  save() { if (this.busy || !this.started) return; const p = this.player; this.S.pos = this.riding ? null : this.zone ? [this.zone.back[0], this.zone.back[1], this.camYaw] : [p.x, p.z, this.camYaw]; try { localStorage.setItem(KEY, JSON.stringify(this.S)); } catch { /* private mode */ } }
  load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.ch) { this.S = Object.assign(this.blank(), s); return true; } } catch { /* ignore */ } return false; }
  erase() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
  applyOptions() { this.sound.setOn(this.S.opt.sound); this.save(); }

  // ───────── start / chapters ─────────
  async begin(fresh) {
    this.sound.unlock();
    if (!fresh && this.load()) { this.started = true; this.sound.setOn(this.S.opt.sound); await this.enterWorld(this.S.world, this.S.time); this.lastStep = this.curStep(); const sp = this.S.pos || this.W.P[this.chapter.spawn] || [0, 0]; this.place(sp[0], sp[1]); if (sp[2] !== undefined) this.camYaw = sp[2]; this.refresh(); UI.playUI(true); this.paused = false; this.showGoal(); await UI.fade(false); }
    else { const opt = this.S.opt; this.S = this.blank(); this.S.opt = opt; this.started = true; await this.startChapter(1); }
  }
  baseline(n) { const f = {}, it = {}; if (n >= 3) it.whistle = 1; if (n === 3) it.spyglass = 1; if (n >= 11 && n <= 14) it.stillbloom = 1; if (n >= 3) f.cape = 1; if (n >= 5 && n <= 12) f.coat = 1; if (n >= 13) f.coatOff = 1; if (n >= 8 && n <= 10) f.rideSugar = 1; return [f, it]; }
  async startChapter(n) {
    this.busy++; this.paused = true; await UI.fade(true); UI.closeDialog();
    const S = this.S, ch = this.chapters[n - 1]; S.ch = n; S.max = Math.max(S.max, n); [S.flags, S.items] = this.baseline(n); S.leads = []; S.vis = {}; S.hp = 3; this.tmp = {}; this.inside.clear(); this.mode = null; this.inv = 0;
    if (this.riding) this.unride(null, true); this.ruby.state = 'hidden'; this.ruby.model.visible = false; this.meterV = 1; this.clearRings(); this.clearFx(); this.fogOverride = null; this.rubyAt = null;
    await this.enterWorld(ch.world, ch.time); this.lastStep = this.curStep();
    const who = this.whoNow(); const sp = this.W.P[who === 'kim' && ch.spawnKim ? ch.spawnKim : ch.spawn]; this.place(sp[0], sp[1]); this.faceCam();
    this.refresh(); if (this.comp) this.placeComp();
    UI.playUI(false); this.sound.sfx('chapter');
    await UI.card(n > 17 ? 'EPILOGUE' : 'CHAPTER ' + n, ch.title, ch.intro);
    this.sound.unlock(); UI.playUI(true); this.busy--; this.paused = false; this.showGoal(true); this.save(); await UI.fade(false);
  }
  curStep() { const st = this.chapter.steps; for (const s of st) if (!this.f[s.until]) return s; return null; }
  showGoal(pulse) { const st = this.curStep(), n = this.S.ch; UI.setGoal(n > 17 ? 'Epilogue' : `Chapter ${n} · ${this.chapter.title}`, st ? st.goal : '', pulse); }
  async checkStep() {
    const st = this.curStep(); if (st === this.lastStep) return; this.lastStep = st;
    if (!st) { if (this.S.ch >= this.chapters.length) return; await wait(0.6); if (this.S.ch === 17) await this.ending(); return this.startChapter(this.S.ch + 1); }
    this.sound.sfx('chime'); this.showGoal(true);
  }
  async ending() { this.busy++; await UI.fade(true, 'The End'); await wait(2.4); UI.playUI(false); await UI.card('THE EVERLANDS', 'Of Sugar and Flame', 'From the book by Elisa Espinosa Ruiz.\n\nBoth kingdoms are yours to wander now. Whistle for Ruby anywhere.'); this.busy--; }

  // ───────── world / sky ─────────
  async enterWorld(name, time) {
    await loadPeople();
    if (!this.worlds[name]) { await Promise.all((WORLD_PACKS[name] || []).map(loadPack)); this.worlds[name] = BUILD[name](); await wait(0); }
    this.worlds[name].group.traverse((o) => { if (o.isMesh && !o.userData.sh) { o.userData.sh = 1; const lit = !!o.material.isMeshStandardMaterial; o.receiveShadow = lit; o.castShadow = lit && !o.userData.ground; } });
    for (const k in this.worlds) { const g = this.worlds[k].group; if (k === name) this.scene.add(g); else this.scene.remove(g); }
    this.S.world = name; this.clearNpcs(); this.inside.clear(); this.setTime(time || this.S.time);
    this.spawnBreakables();
    if (name === 'sugar' && !this.grass.sugar) { this.grass.sugar = makeGrass(this.worlds.sugar, 260, 56, 26000, 0x5fbf86, 0xc8f2b8); }
    if (!this.motes[name] && name !== 'sea') this.motes[name] = makeMotes(name === 'ember' ? 0xff8a2a : 0xffe6f2, name === 'ember' ? 1.6 : 0.35, name === 'ember' ? 260 : 160);
    for (const k of ['ember', 'sugar']) { for (const o of [this.grass[k], this.motes[k]]) if (o) { if (k === name) this.scene.add(o); else this.scene.remove(o); } }
    this.sound.mood = name; this.markPlays(); this.markTorches();
  }
  setTime(time) {
    this.S.time = time; const p = (SKY[this.S.world] || SKY.ember)[time] || SKY[this.S.world].day, top = new THREE.Color(p[0]), bot = new THREE.Color(p[1]);
    const pos = this.dome.geometry.attributes.position, col = this.dome.geometry.attributes.color, c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { const t = clamp(pos.getY(i) / 900 + 0.08, 0, 1); c.copy(bot).lerp(top, Math.pow(t, 0.7)); col.setXYZ(i, c.r, c.g, c.b); } col.needsUpdate = true;
    this.scene.fog.color.set(p[2]); this.baseFog = p[3]; this.sun.color.set(p[4]); this.sun.intensity = p[5] * 1.5; this.hemi.color.set(p[6]).lerp(new THREE.Color(0xffffff), 0.45); this.hemi.groundColor.set(p[2]).multiplyScalar(0.7); this.hemi.intensity = time === 'night' ? 1.25 : 1.7;
    this.stars.visible = time === 'night'; this.sound.night = time === 'night';
    const night = time === 'night'; this.sun.intensity = p[5] * (night ? 1.3 : 1.75); this.hemi.intensity = night ? 0.75 : 0.5; this.sunBase = this.sun.intensity; this.hemiBase = this.hemi.intensity;
    { const es = new THREE.Scene(), d = new THREE.Mesh(this.dome.geometry, this.dome.material); es.add(d); const old = this.envRT; this.envRT = this.pmrem.fromScene(es, 0.04, 1, 3000); this.scene.environment = this.envRT.texture; this.scene.environmentIntensity = night ? 0.4 : 0.55; this.renderer.toneMappingExposure = this.S.world === 'sugar' && !night ? 0.86 : 1; old?.dispose(); }
    const cu = this.clouds.material.uniforms; cu.uCol.value.set(p[1]).lerp(new THREE.Color(0xffffff), night ? 0.05 : 0.6).multiplyScalar(night ? 0.35 : 1); cu.uShade.value.set(p[0]).lerp(new THREE.Color(p[1]), 0.5).multiplyScalar(night ? 0.3 : 0.92); cu.uCover.value = this.S.world === 'sugar' ? 0.5 : 0.56;
    if (this.grass.sugar) this.grass.sugar.material.uniforms.uLight.value = night ? 0.4 : time === 'day' ? 1 : 0.85;
  }
  H(x, z) { const Z = this.zone; return Z && Z.has(x, z) ? Z.y : this.W.height(x, z); }
  place(x, z) { if (this.zone) this.dropZone(); const p = this.player; p.x = x; p.z = z; p.y = this.H(x, z); p.vy = 0; p.ground = true; }
  faceCam(to) { const W = this.W, p = this.player, t = to || this.chapter.face || (W.name === 'sea' ? [0, -50] : W.name === 'ember' ? [0, -30] : [0, 20]); this.camYaw = Math.atan2(t[0] - p.x, t[1] - p.z) || 0; this.camPitch = 0.26; p.yaw = p.tyaw = this.camYaw; this.camSnap = 2; }
  pt(at) { if (Array.isArray(at)) return at; if (at === 'player') return [this.player.x, this.player.z]; return this.W.P[at]; }

  // ───────── people ─────────
  cond(c) { if (c === undefined || c === null) return true; if (typeof c === 'string') return c[0] === '!' ? !this.f[c.slice(1)] : !!this.f[c]; if (Array.isArray(c)) return c.every((x) => this.cond(x)); return !!c(this.f, this); }
  look(id) {
    const f = this.f, L = { ...CAST[id] };
    if (id === 'amber') { if (f.coat && !f.coatOff) Object.assign(L, { top: 0xfff1d6, skirt: 0xfbe6c2, trim: 0xe9b949, collar: 0xffffff, cape: 0, sleeve: 0xfff1d6 }); if (!f.cape || f.c17_cape || this.S.opt.cape === false) L.cape = 0; }
    if (id === 'kim') { L.tira = 1; if (f.c17_cape) L.cape = 0xa3182c; }
    return L;
  }
  whoNow() { if (this.asOverride) return this.asOverride; const a = this.chapter.as; return (typeof a === 'function' ? a(this.f) : a) || 'amber'; }
  clearNpcs() { for (const n of this.npcs) { this.scene.remove(n.model); if (n.fx) this.scene.remove(n.fx); } this.npcs = []; if (this.comp) { this.scene.remove(this.comp.model); this.comp = null; } }
  npc(id) { return this.npcs.find((n) => n.id === id); }
  refresh() {
    const ch = this.chapter, f = this.f, W = this.W, p = this.player;
    // player identity + outfit
    const who = this.whoNow(), key = who + JSON.stringify(this.look(who));
    if (p.lookKey !== key) { const old = p.model, parent = old?.parent || this.scene; if (old) parent.remove(old); p.model = makePerson(this.look(who)); if (old) { p.model.position.copy(old.position); p.model.rotation.copy(old.rotation); } parent.add(p.model); p.lookKey = key; if (p.who !== who && this.started) { const sp = W.P[who === 'kim' ? ch.spawnKim || ch.spawn : ch.spawn]; if (sp && this.lastWho) this.place(sp[0], sp[1]); } p.who = who; this.lastWho = who; }
    // NPCs
    const defs = (ch.npcsByWorld ? ch.npcsByWorld[W.name] || [] : ch.npcs || []).filter((d) => W.P[d.at] && this.cond(d.if));
    const want = new Map(defs.map((d) => [d.id + '@' + d.at, d]));
    this.npcs = this.npcs.filter((n) => { const lk = JSON.stringify(this.look(n.id)); if (want.has(n.key) && n.lk === lk) { n.def = want.get(n.key); want.delete(n.key); return true; } this.scene.remove(n.model); if (n.fx) this.scene.remove(n.fx); return false; });
    for (const [k, d] of want) { const [x, z] = W.P[d.at], L = this.look(d.id), n = { key: k, id: d.id, def: d, x, z, y: this.H(x, z), yaw: 0, model: makePerson(L), name: L.name, lk: JSON.stringify(L), face(tx, tz) { this.tyaw = Math.atan2(tx - this.x, tz - this.z); } }; n.yaw = n.tyaw = Math.atan2(p.x - x, p.z - z); n.model.position.set(x, n.y, z); this.scene.add(n.model); this.npcs.push(n); }
    // companion
    const cid = !this.riding && !this.asOverride && typeof ch.companion === 'function' ? ch.companion(f) : null, clk = cid ? JSON.stringify(this.look(cid)) : '';
    if ((this.comp?.id || null) !== cid || (this.comp && this.comp.lk !== clk)) { const old = this.comp; if (old) this.scene.remove(old.model); this.comp = null; if (cid) { this.comp = { id: cid, lk: clk, model: makePerson(this.look(cid)), x: old ? old.x : p.x - 1.5, z: old ? old.z : p.z - 1.5, y: 0, yaw: 0 }; this.scene.add(this.comp.model); if (!old) this.placeComp(); } }
    // Ruby at rest
    if (!this.riding && this.ruby.state !== 'arrive' && this.ruby.state !== 'leave' && this.ruby.state !== 'council') { const at = typeof ch.ruby === 'function' ? ch.ruby(f) : null, pt = (at && W.P[at]) || this.rubyAt; if (pt) { if (this.ruby.state !== 'idle' || this.ruby.at !== pt) this.rubyRest(pt); } else if (this.ruby.state === 'idle') { this.ruby.state = 'hidden'; this.ruby.model.visible = false; } }
    // things
    for (const t of this.things) if (t.prop) { this.scene.remove(t.prop); t.prop = null; }
    this.things = (ch.things || []).filter((t) => (t.at === 'player' || W.P[t.at]) && this.cond(t.if) && !(t.once && f['t_' + t.id])).map((t) => ({ def: t, prop: null }));
    for (const t of this.things) if (t.def.prop) { const [x, z] = W.P[t.def.at]; t.prop = makeProp(t.def.prop); t.prop.position.set(x, this.H(x, z) + (t.def.prop === 'turtle' ? -0.1 : ['flask', 'bun', 'purse', 'spyglass'].includes(t.def.prop) ? 0.9 : 0), z); this.scene.add(t.prop); }
    // decor: things the story has put down stay where they were put
    for (const d of this.decor || []) this.scene.remove(d); this.decor = [];
    for (const d of ch.decor || []) if (W.P[d.at] && this.cond(d.if)) { const [x, z] = W.P[d.at], m = makeProp(d.prop); m.position.set(x + (d.dx || 0), this.H(x, z) + (d.dy || 0), z + (d.dz || 0)); m.traverse((o) => { if (o.isMesh) o.castShadow = true; }); this.scene.add(m); this.decor.push(m); }
    // lit hearths / torches
    for (const t of ch.things || []) if (t.lit && W.P[t.at]) { const on = !!f[t.lit], have = this.lits.get(t.id); if (on && !have) { const [x, z] = W.P[t.at], m = new THREE.Mesh(GEO.cone, mat(who === 'kim' ? 0xff8ab8 : 0xffb030, true)); const torch = t.at[0] === 't'; m.position.set(x, this.H(x, z) + (torch ? 2.9 : 1.9), z); m.scale.set(torch ? 0.3 : 0.6, torch ? 0.8 : 1.3, torch ? 0.3 : 0.6); this.scene.add(m); this.lits.set(t.id, m); } else if (!on && have) { this.scene.remove(have); this.lits.delete(t.id); } }
    for (const [id, m] of this.lits) if (!(ch.things || []).some((t) => t.id === id && W.P[t.at])) { this.scene.remove(m); this.lits.delete(id); }
    this.meter = typeof ch.meter === 'function' ? ch.meter(f) : null; if (!this.meter) { this.meterV = 1; UI.setMeter(null); }
  }
  placeComp() { const c = this.comp, p = this.player; c.x = p.x - Math.sin(this.camYaw) * 1.6 + 1; c.z = p.z - Math.cos(this.camYaw) * 1.6; c.y = this.H(c.x, c.z); }
  rubyRest(pt) { const r = this.ruby; r.state = 'idle'; r.at = pt; r.x = pt[0]; r.z = pt[1]; r.y = this.H(r.x, r.z) + 1.7; r.pitch = r.bank = 0; r.yaw = Math.atan2(this.player.x - r.x, this.player.z - r.z); r.model.visible = true; }

  // ───────── the script runner ─────────
  async run(script) {
    if (!script) return; this.busy++; UI.setAct(null); UI.controlsVisible(!!this.riding && false);
    try { await this.exec(typeof script === 'function' ? script(this) : script); } catch (e) { console.error('script error', e); }
    UI.closeDialog(); this.busy--; if (!this.busy) { UI.controlsVisible(true); this.refresh(); await this.checkStep(); this.save(); }
  }
  // Conversations carried by Amber and Kim play as illustrated cut scenes, staged automatically.
  cutify(list) {
    if (!Array.isArray(list) || this.S.opt.cuts === false || this.mode === 'play') return list; const out = []; let run = [];
    const isLine = (n) => typeof n === 'string' || (Array.isArray(n) && n.length === 2 && typeof n[0] === 'string' && typeof n[1] === 'string');
    const flush = () => { const sp = run.filter(Array.isArray), cast = sp.filter((l) => CUTWHO[l[0]]).length; if (run.length >= 4 && sp.length >= 2 && cast >= sp.length * 0.6) out.push({ cut: this.direct(run) }); else out.push(...run); run = []; };
    for (const n of list) { if (isLine(n)) run.push(n); else { flush(); out.push(n); } } flush(); return out;
  }
  autoBg() {
    const W = this.W, p = this.player, t = this.S.time, P = W.P, near = (k, r) => P[k] && Math.hypot(p.x - P[k][0], p.z - P[k][1]) < r; if (this.chapter.cutBg) return this.chapter.cutBg(this.f, this);
    if (W.sea) return t === 'night' ? 'sea' : 'ship';
    if (W.name === 'ember') { if (near('king', 10)) return 'kingroom'; if (near('overlook', 24)) return 'overlook'; if (near('room_desk', 13)) return 'room'; if (p.z > 30) return t === 'night' ? 'terrace' : 'market'; if (near('terrace', 16) || near('high_king', 14)) return t === 'day' ? 'balcony' : 'terrace'; return t === 'night' ? 'terrace' : t === 'dusk' && p.z < -46 ? 'balcony' : 'hall'; }
    if (near('wtable', 11)) return 'workshop'; if (near('house_s', 13) || near('cradle', 11)) return 'home'; if (near('praline', 9)) return 'shop'; if (near('choc_shore', 26)) return 'choclake'; if (p.z > 112) return 'forest';
    return t === 'night' || t === 'dusk' ? 'sugarnight' : 'sugar';
  }
  direct(run) {
    const who = this.player.who, speaks = (n) => run.some((l) => Array.isArray(l) && l[0] === n), rubyHere = !this.W.sea && this.ruby.model.visible && Math.hypot(this.ruby.x - this.player.x, this.ruby.z - this.player.z) < 30;
    const mood = (n, t) => { const sad = /sorry|afraid|don’t know|can’t|couldn’t|alone|lost|scared|worr|never|nobody|missing|…$|—$/i.test(t), joy = /laugh|ha!|wonderful|delicious|love|perfect|best|beautiful|sweet|!$/i.test(t), ask = /\?$/.test(t);
      if (n === 'Amber') return sad ? 'worried' : /!$/.test(t) && !/love|wonderful|delicious|beautiful/i.test(t) ? 'fierce' : joy ? 'laugh' : ask ? 'worried' : 'smile';
      if (n === 'Kim') return sad ? 'shy' : ask || (/oh|really|what/i.test(t) && /[!?]$/.test(t)) ? 'amazed' : joy ? 'laugh' : 'smile';
      if (n === 'Ruby') return joy ? 'happy' : ask ? 'curious' : 'soft'; if (n === 'The King') return sad ? 'grave' : joy ? 'proud' : 'smile';
      return /coat/i.test(t) ? 'coat' : sad || ask ? 'fuss' : 'smile'; };
    const out = [{ bg: this.autoBg() }], others = ['The King', 'Madame Praline'].filter(speaks), ruby = speaks('Ruby') || (rubyHere && !others.length && !speaks('Kim') && run.some((l) => typeof l === 'string' && /Ruby/.test(l)));
    const amber = speaks('Amber') || who === 'amber', kim = speaks('Kim') || who === 'kim' || (this.comp?.id === 'kim' && !others.length && !ruby);
    if (amber) out.push({ amber: 'smile' }); if (kim && !(amber && (others.length || ruby))) out.push({ kim: 'smile' }); for (const o of others.slice(0, 1)) out.push({ [CUTWHO[o]]: 'smile' }); if (ruby && !others.length) out.push({ ruby: 'soft' });
    for (const l of run) { if (Array.isArray(l) && CUTWHO[l[0]]) out.push({ [CUTWHO[l[0]]]: mood(l[0], l[1]) }); else if (typeof l === 'string') { if (kim && /Tira/.test(l)) out.push({ tira: /startl|squeak|jump/i.test(l) ? 'startled' : /sleep|doz/i.test(l) ? 'asleep' : 'happy' }); if (ruby && /Ruby/.test(l)) out.push({ ruby: /snort|flame|leap|delight|splash|grin/i.test(l) ? 'happy' : /tilt|watch|sniff|listen|look/i.test(l) ? 'curious' : 'soft' }); } out.push(l); }
    return out;
  }
  async exec(list) {
    list = this.cutify(list);
    for (const n of list) {
      if (!n) continue;
      if (typeof n === 'string') { this.sound.sfx('page'); await UI.say('', n); continue; }
      if (Array.isArray(n)) { this.sound.sfx('page'); this.speaker(n[0]); this.voice(n[0], n[1]); await UI.say(n[0], n[1]); this.voiceEl?.pause(); continue; }
      if (n.c) { for (;;) { const i = await UI.choose(n.c.map((o) => ({ t: o[0] }))); const o = n.c[i]; await this.speakChoice(o[0]); if (o[1]?.length) await this.exec(o[1]); if (!n.retry || o[2]) break; } continue; }
      if (n.cut) { UI.closeDialog(); this.inCut = true; const mood0 = this.sound.mood; if (n.cut.filter(Array.isArray).length >= 4) this.sound.mood = 'heart'; try { await playCut(n.cut, this); } finally { this.inCut = false; this.sound.mood = mood0; } continue; }
      if (n.hub) { await this.hub(n); continue; }
      if (n.if !== undefined && (n.then || n.else)) { await this.exec(this.cond(n.if) ? n.then || [] : n.else || []); continue; }
      if (n.set) { for (const k of [].concat(n.set)) this.f[k] = 1; this.refresh(); }
      if (n.lead && !this.S.leads.includes(n.lead)) { this.S.leads.push(n.lead); UI.tip('✎ Noted in your journal.', 3); }
      if (n.give) { this.S.items[n.give] = 1; }
      if (n.take) { delete this.S.items[n.take]; }
      if (n.codex && !this.S.codex.includes(n.codex)) { this.S.codex.push(n.codex); this.sound.sfx('chime'); UI.tip('Keepsake found: ' + CODEX[n.codex].title, 4); }
      if (n.time) { await UI.fade(true); this.setTime(n.time); await UI.fade(false); }
      if (n.tp) { const pt = this.pt(n.tp); if (pt) { this.place(pt[0], pt[1]); if (this.comp) this.placeComp(); } }
      if (n.fade !== undefined) { UI.closeDialog(); await UI.fade(true, n.fade); await wait(n.fade ? 2.2 : 0.3); await UI.fade(false); }
      if (n.img) { UI.closeDialog(); await UI.image(n.img); }
      if (n.tip) UI.tip(TIPS[n.tip] || n.tip, 9);
      if (n.go) await this.exec(this.chapter.scripts[n.go]);
      if (n.fn) await n.fn(this);
      if (n.qte) { UI.closeDialog(); await UI.qte(n.qte); }
      if (n.fx) await this.fx(n.fx);
      if (n.ruby) await this.rubyDo(n);
      if (n.fly) { UI.closeDialog(); await this.fly(n.fly); }
      if (n.mini) { UI.closeDialog(); await this['mini_' + n.mini](n); }
      if (n.world) { UI.closeDialog(); await UI.fade(true); await this.enterWorld(n.world, n.time); const pt = this.pt(n.at); this.place(pt[0], pt[1]); this.faceCam(); this.refresh(); if (this.comp) this.placeComp(); await UI.fade(false); }
    }
  }
  async hub(n) {
    for (;;) {
      const opts = n.hub.filter((t) => this.cond(t.if) && !(t.once && this.f[hash(t.q)])), exitOk = this.cond(n.need);
      if (!opts.length) break;
      const list = opts.map((t) => ({ t: t.q, cls: this.f[hash(t.q)] ? 'seen' : '' })); if (exitOk) list.push({ t: n.exit || 'Goodbye.', cls: 'exit' });
      const i = await UI.choose(list); if (i >= opts.length) { await this.speakChoice(n.exit || 'Goodbye.'); break; }
      this.f[hash(opts[i].q)] = 1; await this.speakChoice(opts[i].q, opts[i].a); await this.exec(opts[i].a); if (opts[i].end) break;
    }
  }
  // Recorded voice lines: public/voice/<id>.mp3, listed in public/voice/index.json (see tools/voices.mjs).
  voice(name, text) { if (!this.S.opt.sound) return; if (!this.voiceSet) { this.voiceSet = new Set(); fetch('voice/index.json').then((r) => r.json()).then((a) => (this.voiceSet = new Set(a))).catch(() => {}); return; } const id = hash(name + '|' + text); if (!this.voiceSet.has(id)) return; const a = (this.voiceEl = this.voiceEl || new Audio()); a.src = 'voice/' + id + '.mp3'; a.play().catch(() => {}); }
  // The reply you tap is spoken aloud by the character you are playing (unless it is a silent action or thought).
  async speakChoice(text, next) { const who = this.player.who === 'kim' ? 'Kim' : 'Amber', sp = spokenLine(text, who); if (!sp) return; const first = Array.isArray(next) && next.find((x) => x && typeof x !== 'object' || Array.isArray(x)); if (Array.isArray(first) && first[0] === sp[0] && first[1].startsWith(sp[1].slice(0, 24))) return; this.sound.sfx('page'); this.voice(sp[0], sp[1]); await UI.say(sp[0], sp[1]); this.voiceEl?.pause(); }
  speaker(name) { const n = this.npcs.find((x) => x.name === name); if (n) { n.face(this.player.x, this.player.z); if (!this.riding) this.player.tyaw = Math.atan2(n.x - this.player.x, n.z - this.player.z); } }
  bark(line) { if (typeof line === 'string') UI.bark('', line); else UI.bark(line[0], line[1]); }

  // ───────── Ruby ─────────
  async rubyDo(n) {
    const r = this.ruby, pt = n.at ? this.pt(n.at) : null;
    if (n.ruby === 'at') { this.rubyAt = pt; this.rubyRest(pt); return; }
    if (n.ruby === 'arrive') { UI.closeDialog(); this.sound.sfx('roar'); const ty = this.H(pt[0], pt[1]) + 1.7; r.model.visible = true; r.state = 'arrive'; const a = this.camYaw + 0.6, sx = pt[0] + Math.sin(a) * 60, sz = pt[1] + Math.cos(a) * 60; r.yaw = Math.atan2(pt[0] - sx, pt[1] - sz); for (let t = 0; t < 1; t += 0.012) { const e = 1 - (1 - t) * (1 - t); r.x = lerp(sx, pt[0], e); r.z = lerp(sz, pt[1], e); r.y = ty + (1 - e) * 34; r.pitch = -(1 - e) * 0.4; await wait(0.016); } this.rubyAt = pt; this.rubyRest(pt); return; }
    if (n.ruby === 'leave') { UI.closeDialog(); this.sound.sfx('roar'); r.state = 'leave'; for (let t = 0; t < 1; t += 0.014) { r.y += 0.5 + t * 0.6; r.x += Math.sin(r.yaw) * t * 1.4; r.z += Math.cos(r.yaw) * t * 1.4; r.pitch = 0.5; await wait(0.016); } r.state = 'hidden'; r.model.visible = false; this.rubyAt = null; }
  }
  mount(solo) {
    const r = this.ruby, p = this.player; if (this.riding) return; this.riding = true; this.solo = !!solo;
    if (r.state === 'hidden') { r.x = p.x; r.z = p.z; r.y = p.y + 2; r.yaw = this.camYaw; } r.state = 'ride'; r.model.visible = true; r.speed = 16; r.pitch = 0.25;
    const comp = this.comp; this.scene.remove(p.model); if (comp) this.scene.remove(comp.model);
    if (!solo) { r.model.add(p.model); p.model.position.set(0, 0.55, 0.9); p.model.rotation.set(0, 0, 0); p.model.scale.setScalar(1.25); if (comp) { r.model.add(comp.model); comp.model.position.set(0, 0.6, -0.4); comp.model.rotation.set(0, 0, 0); comp.model.scale.setScalar(1.25); this.rideComp = comp; this.comp = null; } }
    else if (comp) { this.rideComp = comp; this.comp = null; }
  }
  unride(at, silent) {
    const r = this.ruby, p = this.player; if (!this.riding) return; this.riding = false;
    r.model.remove(p.model); p.model.scale.setScalar(p.model.userData.h); this.scene.add(p.model);
    p.model.userData.pose = null; if (this.rideComp) { this.rideComp.model.userData.pose = null; r.model.remove(this.rideComp.model); this.rideComp.model.scale.setScalar(this.rideComp.model.userData.h); this.scene.add(this.rideComp.model); this.comp = this.rideComp; this.rideComp = null; }
    const pt = at ? this.pt(at) : [r.x, r.z]; this.place(pt[0], pt[1]); if (this.comp) this.placeComp();
    if (this.solo) { r.state = 'council'; } else if (!silent) { const rp = [pt[0] + 6, pt[1] + 5]; this.rubyAt = rp; this.rubyRest(rp); } this.solo = false; this.clearRings(); this.fogOverride = null; this.camPitch = 0.3;
  }
  clearRings() { for (const m of this.rings) this.scene.remove(m); this.rings = []; this.ringI = 0; this.flyDone = null; }
  async fly(o) {
    if (o.world) { await UI.fade(true, '', true); await this.enterWorld(o.world, o.time); this.refresh(); }
    else if (o.time) this.setTime(o.time);
    const r = this.ruby; this.mount(o.solo); this.clearRings();
    if (o.start) { r.x = o.start[0]; r.y = o.start[1]; r.z = o.start[2]; }
    const first = o.rings[0]; r.yaw = Math.atan2(first[0] - r.x, first[2] - r.z); this.camYaw = r.yaw;
    if (this.W.visitor) { this.W.visitor.visible = !!o.ship; if (o.ship) this.W.visitor.position.set(...o.ship); }
    if (o.council) this.spawnCouncil(o.rings[o.rings.length - 1]);
    for (const p of o.rings) { const m = makeRing(o.solo ? 0xff3048 : 0xffc45a); m.position.set(p[0], p[1], p[2]); this.scene.add(m); this.rings.push(m); }
    for (let i = 0; i < this.rings.length; i++) { const a = i ? o.rings[i - 1] : [r.x, r.y, r.z], b = o.rings[i]; this.rings[i].rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]); }
    this.ringI = 0; const f0 = o.fog ?? this.fogOverride ?? this.baseFog, f1 = o.fogTo ?? o.fog ?? f0; this.fogOverride = f0;
    const done = new Promise((res) => { this.flyDone = (i) => { this.sound.sfx('ring'); const b = o.barks?.[i]; if (b) this.bark(b); this.fogOverride = lerp(f0, f1, (i + 1) / o.rings.length); if (i + 1 >= o.rings.length) res(); }; });
    UI.controlsVisible(true); this.flying = true; if (o.world) await UI.fade(false);
    await done;
    this.flying = false; UI.controlsVisible(false); this.clearRings();
    if (o.land) { await UI.fade(true); this.unride(o.land); this.faceCam(); this.refresh(); await UI.fade(false); }
  }
  spawnCouncil(c) { this.clearFx(); const cols = [0x3a8cff, 0x30d080, 0xa060ff, 0xff8ac0, 0xf4f4ff, 0xffd040]; this.council = { c: [c[0], c[1] + 6, c[2]], ds: cols.map((col, i) => { const d = makeDragon(col); d.rotation.order = 'YXZ'; this.scene.add(d); return { d, col, a: (i + 1) / 7 * 6.283 }; }) }; }
  clearFx() { for (const m of this.fxs) this.scene.remove(m); this.fxs = []; if (this.council) { for (const x of this.council.ds) this.scene.remove(x.d); this.council = null; } }

  // ───────── fire bending ─────────
  fireOK() { const f = this.f, w = this.S.world, who = this.player.who; if (w === 'sea' || this.riding) return false; if (who === 'kim') return !!(f.c13_window || this.S.ch > 13); return w === 'ember' ? this.S.ch > 1 || !!f.c1_hearths : this.S.ch > 6 || !!f.c6_bird; }
  spawnBreakables() {
    for (const b of this.breaks) this.scene.remove(b.mesh); this.breaks = []; for (const b of this.bolts) this.scene.remove(b.mesh); this.bolts = []; for (const b of this.shots || []) this.scene.remove(b.mesh); this.shots = [];
    const W = this.W; if (!W || W.sea) return; const R = rnd(W.name === 'ember' ? 31 : 47), kinds = W.name === 'ember' ? ['bramble', 'crate', 'wisp', 'bramble', 'wisp'] : ['crystal', 'puff', 'crystal', 'jelly', 'puff'], b = W.bounds;
    for (let i = 0, tries = 0; i < 46 && tries < 900; tries++) {
      const x = b[0] + 8 + R() * (b[1] - b[0] - 16), z = b[2] + 8 + R() * (b[3] - b[2] - 16), [cx, cz] = this.collide(x, z, 1.4); if (Math.hypot(cx - x, cz - z) > 0.05) continue;
      if (Object.values(W.P).some((q) => Math.hypot(q[0] - x, q[1] - z) < 5) || this.onBouncer(x, z) || W.height(x, z) < -0.4) continue; if (W.name === 'ember' ? z < -96 && Math.abs(x - 13) < 9 : z < -100) continue;
      const kind = kinds[i % kinds.length], g = new THREE.Group(), fl = kind === 'wisp' || kind === 'puff';
      if (kind === 'bramble') { for (let k = 0; k < 5; k++) { const c = part(GEO.cone, 0x2e1c1a, Math.cos(k * 1.3) * 0.45, 0.55, Math.sin(k * 1.3) * 0.45, 0.16, 1.1 + (k % 2) * 0.5, 0.16); c.rotation.set(Math.sin(k) * 0.5, 0, Math.cos(k * 2) * 0.5); g.add(c); } g.add(part(GEO.sph, 0x8a1c22, 0, 0.5, 0, 0.3, 0.25, 0.3)); }
      else if (kind === 'crate') { g.add(part(GEO.box, 0x9a6a44, 0, 0.45, 0, 0.9, 0.9, 0.9), part(GEO.box, 0x6b452a, 0, 0.45, 0, 0.96, 0.14, 0.96), part(GEO.box, 0x6b452a, 0, 0.45, 0, 0.14, 0.96, 0.96)); g.rotation.y = R() * 3; }
      else if (kind === 'crystal') { const cols = [0xff9ec4, 0x9ad8f5, 0xfff3a8, 0xc9a0f0]; for (let k = 0; k < 4; k++) { const c = part(GEO.cone, cols[(i + k) % 4], Math.cos(k * 1.7) * 0.3, 0.5 + (k % 2) * 0.2, Math.sin(k * 1.7) * 0.3, 0.2, 1 + (k % 2) * 0.5, 0.2); c.rotation.set(Math.sin(k * 2) * 0.35, 0, Math.cos(k) * 0.35); g.add(c); } }
      else if (kind === 'jelly') { g.add(part(GEO.sph, [0xff7a9a, 0x8ae0b0, 0xffc45a][i % 3], 0, 0.42, 0, 0.6, 0.5, 0.6), part(GEO.sph, 0xffffff, 0.15, 0.7, 0.2, 0.12, 0.08, 0.1)); }
      else { const c = kind === 'wisp' ? 0x4a4048 : 0xd8f0ff; g.add(part(GEO.sph, c, 0, 0, 0, 0.5, 0.55, 0.5), part(GEO.sph, c, 0.3, 0.3, 0, 0.3, 0.3, 0.3), part(GEO.sph, c, -0.28, 0.25, 0.1, 0.28, 0.28, 0.28), part(GEO.cone, c, 0, -0.6, 0, 0.3, 0.7, 0.3)); for (const sx of [-1, 1]) g.add(part(GEO.sph, kind === 'wisp' ? 0xffb030 : 0x3a6ad0, sx * 0.17, 0.08, 0.44, 0.07, 0.09, 0.05, true)); g.children[3].rotation.x = Math.PI; }
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); const y = W.height(x, z); g.position.set(x, y + (fl ? 1.7 : 0), z); this.scene.add(g); this.breaks.push({ kind, x, z, y, x0: x, z0: z, mesh: g, fl, ph: R() * 6.28 }); i++;
    }
  }
  castBolt(src) {
    const p = src || this.player, kim = src ? true : p.who === 'kim';
    if (!src && !this.fireOK()) { if (this.S.world !== 'sea' && !this.riding && this.t - (this.noFireT ?? -9) > 8) { this.noFireT = this.t; this.bark([p.who === 'kim' ? 'Kim' : 'Amber', p.who === 'kim' ? 'I wouldn’t know how.' : 'Not here. Not yet.']); } return; }
    const range = kim ? 14 : 26 + Math.min(12, (this.S.sparks || 0) / 4); let yaw = this.camYaw, best = null, bd = range, ty = p.y + 1.25;
    const consider = (x, z, y) => { const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz); if (d < bd && d > 0.5 && Math.abs(wrap(Math.atan2(dx, dz) - this.camYaw)) < 0.55) { bd = d; best = [dx, dz]; ty = y; } };
    for (const b of this.breaks) consider(b.x, b.z, b.mesh.position.y + 0.5);
    for (const t of this.things) if (t.def.flame && !t.def.self && this.W.P[t.def.at]) { const q = this.W.P[t.def.at]; consider(q[0], q[1], this.H(q[0], q[1]) + 1.6); }
    if (best) yaw = Math.atan2(best[0], best[1]); if (!src) p.tyaw = p.yaw = yaw; else p.yaw = yaw;
    const m = new THREE.Mesh(GEO.sph, new THREE.MeshBasicMaterial({ color: new THREE.Color(kim ? 0xff7ab0 : 0xffa030).multiplyScalar(2.2) })), sc = kim ? 0.16 : 0.24 + Math.min(0.14, (this.S.sparks || 0) / 200); m.scale.setScalar(sc);
    const bolt = { x: p.x + Math.sin(yaw) * 0.6, y: p.y + 1.25, z: p.z + Math.cos(yaw) * 0.6, yaw, left: range, kim, mesh: m, sc, vy: best ? (ty - (p.y + 1.25)) / (bd / 28) : 0, tr: 0 }; m.position.set(bolt.x, bolt.y, bolt.z); this.scene.add(m); this.bolts.push(bolt);
    this.sound.sfx('flame'); this.sound.tone(kim ? 900 : 520, 0.25, 'sawtooth', 0.05, kim ? 1400 : 220); (src ? src.model : p.model).userData.cast?.(); if (!src && p.model.userData.armR) p.model.userData.armR.rotation.x = -1.5;
    if (!src && this.comp?.id === 'kim' && this.S.ch >= 15) setTimeout(() => { if (this.comp && !this.busy) this.castBolt(this.comp); }, 380);
  }
  flare() { if (!this.fireOK()) return; const p = this.player, kim = p.who === 'kim', r = kim ? 3.5 : 6.5; this.sound.sfx('lit'); this.sound.sfx('roar'); this.shake = 0.3; for (let i = 0; i < 3; i++) this.puff(p.x, p.y + 0.6 + i * 0.5, p.z, kim ? 0xff8ab8 : 0xff8a20, 46, r * 1.6, 2.2, 1.1); for (const b of [...this.breaks]) if (Math.hypot(b.x - p.x, b.z - p.z) < r) this.smash(b); }
  smash(b) {
    const i = this.breaks.indexOf(b); if (i < 0) return; this.breaks.splice(i, 1); this.scene.remove(b.mesh); const y = b.mesh.position.y + 0.5;
    const col = { bramble: 0xff7a20, crate: 0xffb050, wisp: 0x8a8088, crystal: 0xffd0e8, jelly: 0xffe0a0, puff: 0xe8f6ff }[b.kind]; this.puff(b.x, y, b.z, col, 34, 1.4, 3.2, 1.3); this.puff(b.x, y, b.z, 0xffe9a0, 10, 0.6, 5, 0.9); this.sound.sfx('lit'); this.sound.tone(b.fl ? 880 : 180, 0.3, b.fl ? 'sine' : 'square', 0.07, b.fl ? 1760 : 70);
    const n = (this.S.sparks = (this.S.sparks || 0) + 1); if (n === 1) UI.tip('A cinder! Your flame grows as you gather them. The count is in your journal.', 6); else if (n % 10 === 0) { UI.tip(`${n} cinders. Your flame burns brighter and reaches farther.`, 5); this.sound.sfx('chime'); }
  }
  // Three flames of health. Wisps and puffs fight back; fire meditation rekindles what is lost.
  hurt(from) {
    const p = this.player, S = this.S; if (this.inv > 0 || this.busy || p.who !== 'amber') return; S.hp = Math.max(0, (S.hp ?? 3) - 1); this.inv = 1.8; this.shake = 0.5; this.sound.sfx('hit'); if (this.mode === 'med') this.endMed();
    const dx = p.x - from.x, dz = p.z - from.z, d = Math.hypot(dx, dz) || 1, [nx, nz] = this.collide(p.x + dx / d * 2.2, p.z + dz / d * 2.2); if (this.H(nx, nz) - p.y < 0.85) { p.x = nx; p.z = nz; }
    this.puff(p.x, p.y + 1.2, p.z, 0x9a9098, 22, 0.8, 2, 0.8); UI.setHearts(S.hp, true, true);
    if (S.hp === 2 && !S.vis.medTip) { S.vis.medTip = 1; UI.tip('You lost a flame. Get somewhere quiet and tap ❋ Meditate to rekindle it.', 7); }
    if (S.hp <= 0) this.run([{ fade: 'Her flame gutters. She breathes, finds the warmth again, and begins once more.' }, { fn: (g) => { g.S.hp = 3; const sp = g.safe && g.safe[2] === g.S.world ? g.safe : g.W.P[g.chapter.spawn]; if (sp) g.place(sp[0], sp[1]); if (g.comp) g.placeComp(); g.inv = 3; } }]);
  }
  startMed() { const p = this.player; if (this.mode || !p.ground || (this.S.hp ?? 3) >= 3 || !this.fireOK()) return; if (this.breaks.some((k) => k.fl && Math.hypot(k.x - p.x, k.z - p.z) < 9)) { UI.tip('Not with one of them so close. Deal with it, or move away first.', 4); return; } this.mode = 'med'; this.medT = 0; this.medN = 0; this.sound.tone(196, 1.6, 'sine', 0.08); UI.tip('Breathe. Stay still.', 3); }
  endMed() { if (this.mode === 'med') { this.mode = null; this.flame.visible = false; this.flameLight.intensity = 0; this.player.model.position.y = this.player.y; } }
  updateMed(dt, moved) {
    const p = this.player, S = this.S; if (moved || this.busy) return this.endMed(); this.medT += dt; p.model.position.y = p.y - 0.42; if (p.model.userData.armL) { p.model.userData.armL.rotation.x = -0.9; p.model.userData.armR.rotation.x = -0.9; }
    const s = 0.2 + Math.sin(this.t * 3) * 0.05 + this.medT * 0.03; this.flame.visible = true; this.flame.position.set(p.x + Math.sin(p.yaw) * 0.45, p.y + 0.75, p.z + Math.cos(p.yaw) * 0.45); this.flame.scale.set(s, s * 1.8, s); this.flame.material.color.set(0xffc040); this.flameLight.position.copy(this.flame.position); this.flameLight.intensity = 20 + this.medT * 8;
    if (Math.random() < dt * 14) { const a = Math.random() * 6.28, r = 1.6 - (this.medT % 1.7) * 0.7; this.puff(p.x + Math.cos(a) * r, p.y + 0.2, p.z + Math.sin(a) * r, 0xffb030, 2, 0.1, 1.4, 0.7); }
    if (Math.floor(this.medT / 1.7) > (this.medN || 0)) { this.medN = Math.floor(this.medT / 1.7); S.hp = Math.min(3, S.hp + 1); this.sound.sfx('chime'); UI.setHearts(S.hp, true, true); this.puff(p.x, p.y + 1, p.z, 0xffd060, 30, 2.4, 1.6, 1.2); }
    if (S.hp >= 3) { this.medN = 0; this.endMed(); this.bark(['Amber', 'There. Warm again.']); this.save(); }
  }
  // ── Hint trail: find what advances the current step and draw a glowing path to it ──
  hintTarget() {
    const st = this.curStep(); if (!st) return null; const flag = st.until, ch = this.chapter, seen = new Set(), f = this.f;
    const has = (n, d = 0) => { if (!n || d > 14 || typeof n === 'string') return false; if (typeof n === 'function') return n.toString().includes(flag);
      if (Array.isArray(n)) return n.some((x) => has(x, d + 1));
      if (typeof n === 'object') { if ([].concat(n.set || []).includes(flag) || n.lit === flag) return true; if (typeof n.go === 'string' && !seen.has(n.go)) { seen.add(n.go); if (has(ch.scripts?.[n.go], d + 1)) return true; } return Object.values(n).some((v) => (typeof v === 'object' || typeof v === 'function') && has(v, d + 1)); }
      return false; };
    const live = (src) => { try { return typeof src === 'function' ? src(f, this) : src; } catch (e) { return null; } };
    const c = [], p = this.player;
    for (const t of this.things) { const d = t.def; if (d.at === 'player') continue; const q = this.pt(d.at); if (q) c.push({ x: q[0], z: q[1], src: d.script, label: d.label }); }
    for (const n of this.npcs) if (n.def.talk) { const sc = live(n.def.talk); if (sc) c.push({ x: n.x, z: n.z, src: n.def.talk, now: sc, label: n.name }); }
    if (this.ruby?.model.visible && !this.riding && this.ruby.state === 'idle') c.push({ x: this.ruby.x, z: this.ruby.z, src: null, label: 'Ruby', ruby: 1 });
    const near = (l) => l.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
    const sure = c.filter((k) => { seen.clear(); return has(k.now || live(k.src)); }); if (sure.length) return near(sure);
    const maybe = c.filter((k) => { seen.clear(); return has(k.src); }); if (maybe.length) return near(maybe);
    return c.length ? near(c) : null;
  }
  findPath(x0, z0, x1, z1) { // A* over a coarse grid, using the same colliders the player bumps into
    const C = 1.6, pad = 36, minX = Math.min(x0, x1) - pad, minZ = Math.min(z0, z1) - pad, nx = Math.ceil((Math.abs(x1 - x0) + pad * 2) / C), nz = Math.ceil((Math.abs(z1 - z0) + pad * 2) / C);
    if (nx * nz > 90000) return null; const b = this.W.bounds, blocked = new Int8Array(nx * nz);
    const free = (i, j) => { if (i < 0 || j < 0 || i >= nx || j >= nz) return false; const k = i + j * nx; if (!blocked[k]) { const x = minX + i * C, z = minZ + j * C, q = this.collide(x, z, 0.55); blocked[k] = x < b[0] || x > b[1] || z < b[2] || z > b[3] || Math.hypot(q[0] - x, q[1] - z) > 0.05 ? 2 : 1; } return blocked[k] === 1; };
    const cell = (x, z) => [Math.round((x - minX) / C), Math.round((z - minZ) / C)], [si, sj] = cell(x0, z0), [gi, gj] = cell(x1, z1), S = si + sj * nx;
    const g = new Float32Array(nx * nz).fill(1e9), from = new Int32Array(nx * nz).fill(-1), open = [[0, S]], done = new Uint8Array(nx * nz); g[S] = 0; let best = S, bestH = 1e9, n = 0;
    while (open.length && n++ < 30000) { let m = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[m][0]) m = k; const cur = open.splice(m, 1)[0][1]; if (done[cur]) continue; done[cur] = 1;
      const ci = cur % nx, cj = (cur / nx) | 0, h = Math.hypot(ci - gi, cj - gj); if (h < bestH) { bestH = h; best = cur; } if (h < 1.6) break;
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const i = ci + di, j = cj + dj; if (!free(i, j) && !(i === gi && j === gj)) continue; if (di && dj && (!free(ci + di, cj) || !free(ci, cj + dj))) continue;
        const k = i + j * nx, c = g[cur] + (di && dj ? 1.414 : 1); if (c < g[k]) { g[k] = c; from[k] = cur; open.push([c + Math.hypot(i - gi, j - gj), k]); } } }
    const pts = []; for (let k = best; k >= 0; k = from[k]) pts.push([minX + (k % nx) * C, minZ + ((k / nx) | 0) * C]); pts.reverse(); if (bestH < 2.5) pts.push([x1, z1]); pts[0] = [x0, z0]; return pts;
  }
  showHint() {
    if (this.busy || this.paused || !this.started) return; if (this.zone) { UI.tip(this.zone.deck ? 'Climb down first, then ask again.' : 'Step outside first, then ask again.', 5); return; } const st = this.curStep(), p = this.player; if (st?.hint) UI.tip(st.hint, 9);
    if (this.riding || this.flying || this.mode) return; const t = this.hintTarget(); if (!t) { if (this.canWhistle()) UI.tip('Try the ruby whistle. ♪', 6); return; }
    if (!this.trail) { const m = new THREE.InstancedMesh(GEO.sph, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd870).multiplyScalar(2.2), transparent: true, opacity: 0.95, depthWrite: false }), 260); m.frustumCulled = false; const beam = part(GEO.cyl, 0xffe08a, 0, 0, 0, 0.16, 9, 0.16, true); beam.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd870).multiplyScalar(1.8), transparent: true, opacity: 0.55, depthWrite: false }); this.trail = { m, beam, pts: [] }; }
    const tr = this.trail; tr.t = 16; tr.target = t; tr.re = 0; this.scene.add(tr.m, tr.beam); this.sound.sfx('chime');
  }
  // ── Activities: optional, replayable games at marked spots (a striped pole with a gold star) ──
  nearPlay() { const p = this.player; if (this.riding || !p.ground) return null; for (const s of PLAYS[this.W.name] || []) if (Math.hypot(p.x - s.at[0], p.z - s.at[1]) < 3.4 && (!s.ruby || (this.S.items.whistle && p.who === 'amber'))) return s; return null; }
  markPlays() { const W = this.W; if (W.playMarks) return; W.playMarks = new THREE.Group(); for (const s of PLAYS[W.name] || []) { const [x, z] = s.at, y = W.height(x, z), g = new THREE.Group(); g.add(part(GEO.cyl, 0xffffff, 0, 1.5, 0, 0.09, 3, 0.09)); for (let i = 0; i < 4; i++) g.add(part(GEO.cyl, i % 2 ? 0xe8344a : 0xf5c84a, 0, 0.5 + i * 0.7, 0, 0.1, 0.3, 0.1)); const st = part(GEO.sph, 0xffd24a, 0, 3.35, 0, 0.42, 0.42, 0.16, true); g.add(st, part(GEO.cyl, 0xf3e6cf, 0, 0.06, 0, 1.5, 0.12, 1.5)); g.position.set(x, y, z); g.userData.star = st; W.playMarks.add(g); W.circles.push([x, z, 0.3]); } W.group.add(W.playMarks); }
  async play(s) {
    UI.closeDialog(); const res = await this['play_' + s.id](s), best = (this.S.best ||= {}); this.mode = null; this.playS = null; UI.setTimer(null); UI.controlsVisible(false);
    if (!res) return; const old = best[s.id], better = old === undefined || res.score > old; if (better) best[s.id] = res.score; const gain = Math.max(1, Math.round(res.cinders || 1)); this.S.sparks = (this.S.sparks || 0) + gain; this.sound.sfx('chapter');
    await UI.say('', `${res.text} ${better && old !== undefined ? 'A new best!' : old !== undefined ? 'Your best: ' + res.fmt(old) + '.' : ''} (+${gain} cinder${gain > 1 ? 's' : ''})`);
  }
  // run about collecting glowing things before the time runs out
  collectGame({ items, time, label, color = 0xffd24a, reach = 1.7, onGet, keepMode }) {
    const ms = items.map(([x, y, z]) => { const m = new THREE.Mesh(GEO.sph, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2) })); m.position.set(x, y, z); m.scale.set(0.42, 0.42, 0.2); this.scene.add(m); return m; });
    if (!keepMode) this.mode = 'play'; UI.controlsVisible(true); return new Promise((res) => { this.playS = { ms, got: 0, t: time, time, label, reach, onGet, end: (why) => { for (const m of ms) this.scene.remove(m); this.playS = null; res({ got: this.playGot, left: this.playLeft, why }); } }; this.playGot = 0; this.playLeft = time; });
  }
  updatePlay(dt) {
    const S = this.playS, p = this.player; S.t -= dt; this.playLeft = S.t; if (S.tick) S.tick(dt);
    if (S.ms) { for (const m of S.ms) { if (!m.visible) continue; m.rotation.y += dt * 4; if (Math.hypot(m.position.x - p.x, m.position.y - p.y - 1, m.position.z - p.z) < S.reach) { m.visible = false; S.got++; this.playGot = S.got; this.sound.sfx('ring'); this.puff(m.position.x, m.position.y, m.position.z, 0xffe08a, 16, 0.8, 2, 0.9); S.onGet?.(m); } }
      UI.setTimer(`${S.label} ${S.got}/${S.ms.length}`, S.t / S.time); if (S.got >= S.ms.length) return S.end('all'); }
    if (S.t <= 0 && !S.noClock) S.end('time');
  }
  async play_stars() { const W = this.W, items = W.bouncers.slice(0, 10).map(([x, z, r, top], i) => [x + (i % 2 ? 0.8 : -0.8), W.height(x, z, true) + top + 2.3 + (i % 3) * 0.7, z]); await UI.say('', 'Ten sugar stars hang over the marshmallows. Jump onto one, bounce, and catch them all before the minute is up.'); this.place(101, 36);
    const r = await this.collectGame({ items, time: 60, label: 'Stars', reach: 1.9 }); return { score: r.got * 100 + Math.round(Math.max(0, r.left)), cinders: r.got / 2, fmt: (v) => Math.floor(v / 100) + ' stars', text: r.got >= 10 ? `All ten, with ${Math.round(r.left)} seconds to spare!` : `${r.got} of 10 stars.` }; }
  async play_lanterns() { const W = this.W, pts = [[-9, 52], [9, 58], [-10, 64], [10, 70], [-9, 78], [8, 84], [-6, 92], [6, 96], [0, 74], [0, 54], [-14, 86], [14, 90]], items = pts.map(([x, z]) => [x, W.height(x, z) + 1.3, z]); await UI.say('', 'Twelve cold lanterns down the market lane. Run past each one to light it before the bell: forty-five seconds.');
    const r = await this.collectGame({ items, time: 45, label: 'Lanterns', color: 0x7ab8ff, reach: 2.1, onGet: (m) => { const l = part(GEO.sph, 0xffb030, m.position.x, m.position.y, m.position.z, 0.3, 0.3, 0.3, true); this.scene.add(l); setTimeout(() => this.scene.remove(l), 6000); this.sound.sfx('lit'); } });
    return { score: r.got * 100 + Math.round(Math.max(0, r.left)), cinders: r.got / 3, fmt: (v) => Math.floor(v / 100) + ' lanterns', text: r.got >= 12 ? `Every lantern lit, ${Math.round(r.left)} seconds before the bell!` : `${r.got} of 12 lanterns lit.` }; }
  async play_turtles() { const W = this.W, cx = -97, cz = 36, ts = []; await UI.say('', 'Six chocolate-lake turtles have wandered up the biscuit beach. Tag each one gently so it paddles home. They are quicker than they look: fifty seconds.'); this.place(-92, 34);
    for (let i = 0; i < 6; i++) { const a = i * 1.05, m = makeProp('turtle'); m.scale.setScalar(1.15); const t = { m, x: cx + Math.cos(a) * 8, z: cz + Math.sin(a) * 8, yaw: a, w: 0, tx: cx, tz: cz, home: false }; this.scene.add(m); ts.push(t); }
    this.mode = 'play'; UI.controlsVisible(true); const p = this.player; let got = 0; const time = 50;
    const r = await new Promise((res) => { this.playS = { t: time, time, end: (why) => { for (const t of ts) this.scene.remove(t.m); this.playS = null; res({ got, left: this.playLeft, why }); }, tick: (dt) => { for (const t of ts) { if (t.home) { t.m.position.y -= dt * 0.6; t.m.scale.multiplyScalar(1 - dt); continue; } const d = Math.hypot(p.x - t.x, p.z - t.z); let vx = 0, vz = 0, sp = 1.2;
          if (d < 1.4) { t.home = true; got++; this.sound.sfx('boing'); this.puff(t.x, W.height(t.x, t.z) + 0.5, t.z, 0xbfe3a0, 14, 0.7, 1.5, 0.8); setTimeout(() => (t.m.visible = false), 900); continue; }
          if (d < 7) { vx = (t.x - p.x) / d; vz = (t.z - p.z) / d; sp = 4.9; const side = Math.sin(this.t * 2 + t.yaw) * 0.6; [vx, vz] = [vx - vz * side, vz + vx * side]; } else { if ((t.w -= dt) <= 0) { t.w = 1.5 + Math.random() * 2; const a = Math.random() * 6.283; t.tx = cx + Math.cos(a) * 9; t.tz = cz + Math.sin(a) * 9; } const k = Math.hypot(t.tx - t.x, t.tz - t.z) || 1; vx = (t.tx - t.x) / k; vz = (t.tz - t.z) / k; }
          const out = Math.hypot(t.x - cx, t.z - cz); if (out > 13) { vx += (cx - t.x) / out * 1.6; vz += (cz - t.z) / out * 1.6; } const n = Math.hypot(vx, vz) || 1, [nx, nz] = this.collide(t.x + vx / n * sp * dt, t.z + vz / n * sp * dt, 0.5); t.yaw = Math.atan2(nx - t.x, nz - t.z); t.x = nx; t.z = nz; t.m.position.set(t.x, W.height(t.x, t.z) + Math.abs(Math.sin(this.t * 9 + t.yaw)) * 0.06, t.z); t.m.rotation.y = t.yaw; }
        UI.setTimer(`Turtles ${got}/6`, this.playS.t / time); if (got >= 6) this.playS.end('all'); } }; this.playLeft = time; });
    return { score: r.got * 100 + Math.round(Math.max(0, r.left)), cinders: r.got / 2, fmt: (v) => Math.floor(v / 100) + ' turtles', text: r.got >= 6 ? `All six safely home, with ${Math.round(r.left)} seconds left!` : `${r.got} of 6 turtles sent home.` }; }
  async play_sled(s) { const W = this.W, R = rnd(Math.floor(this.t * 10) + 3), items = []; for (let z = -148; z < -106; z += 3.4) { const x = -10 + R() * 20; items.push([x, W.height(x, z) + 1.1, z]); }
    await UI.fade(true, 'The basket swings alarmingly at every post.'); await wait(1.4); const game = this.collectGame({ items, time: 999, label: 'Sprinkles', reach: 2.4, keepMode: true }); this.playS.noClock = true; const run = this.mini_sled_free(); await UI.fade(false); await run; const got = this.playGot; this.playS?.end('done'); await game;
    await UI.fade(true); this.place(s.at[0], s.at[1] + 3); await UI.fade(false); return { score: got, cinders: got / 3, fmt: (v) => v + ' sprinkles', text: `Down the Ice Cream Mountain with ${got} of ${items.length} sprinkle stars.` }; }
  async mini_sled_free() { const p = this.player; this.place(0, -156); this.mode = 'sled'; this.sledV = 4; this.camYaw = 0; UI.controlsVisible(true); await new Promise((res) => (this.sledDone = res)); this.mode = null; this.sound.sfx('hit'); this.shake = 0.5; this.puff(p.x, p.y + 1, p.z, 0xffffff, 30); await wait(0.6); }
  async play_rings(s) { const t0 = this.t; await UI.say('', 'Ruby stretches her wings. Eight rings, as fast as you dare.'); this.sound.sfx('roar'); await this.fly({ rings: s.rings, start: [s.at[0], this.W.height(s.at[0], s.at[1]) + 14, s.at[1]], land: [s.at[0], s.at[1] + 4] }); const secs = Math.round(this.t - t0);
    return { score: -secs, cinders: Math.max(1, 6 - secs / 20), fmt: (v) => -v + ' seconds', text: `Eight rings in ${secs} seconds.` }; }
  async play_tira() { const W = this.W, p = this.player, old = p.model, cd = this.camDist, pts = [[7, 10], [-12, 8], [-10, 30], [9, 41], [-6, 20], [6, 21], [0, 26], [-15, 44], [12, 28], [3, 4], [-5, 36], [14, 16]];
    await UI.say('', 'Meanwhile, Tira has smelled biscuit. Twelve crumbs have rolled under the market stalls and benches, and somebody small has to fetch them: fifty seconds.');
    const t = makeProp('tira'); t.scale.setScalar(1.7); t.userData.critter = true; this.scene.remove(old); this.scene.add(t); p.model = t; this.camDist = 4.4; if (this.comp) this.comp.model.visible = false; this.place(2, 15);
    const r = await this.collectGame({ items: pts.map(([x, z]) => [x, W.height(x, z) + 0.75, z]), time: 50, label: 'Crumbs', color: 0xe8b86a, reach: 1.5 });
    this.scene.remove(t); this.scene.add(old); p.model = old; this.camDist = cd; if (this.comp) this.comp.model.visible = true;
    return { score: r.got * 100 + Math.round(Math.max(0, r.left)), cinders: r.got / 3, fmt: (v) => Math.floor(v / 100) + ' crumbs', text: r.got >= 12 ? `Every crumb, and ${Math.round(r.left)} seconds to wash her whiskers.` : `${r.got} of 12 crumbs. Tira considers this a start.` }; }
  async play_kim(s) { const W = this.W, doors = (W.doors || []).filter((d) => !d.deck).sort((a, b) => Math.hypot(a.x, a.z - 16) - Math.hypot(b.x, b.z - 16)).slice(0, 8);
    await UI.say('', 'Meanwhile, Kim has the morning round. Eight ribboned boxes, eight doorsteps, and the pastry is best warm: seventy-five seconds.');
    this.asOverride = 'kim'; this.refresh(); this.place(s.at[0], s.at[1] + 2);
    const r = await this.collectGame({ items: doors.map((d) => [d.x, W.height(d.x, d.z) + 1.2, d.z]), time: 75, label: 'Deliveries', color: 0xff8ab8, reach: 2 });
    this.asOverride = null; this.refresh(); this.place(s.at[0], s.at[1] + 2);
    return { score: r.got * 100 + Math.round(Math.max(0, r.left)), cinders: r.got / 2, fmt: (v) => Math.floor(v / 100) + ' doorsteps', text: r.got >= 8 ? `All eight delivered warm, with ${Math.round(r.left)} seconds in hand.` : `${r.got} of 8 boxes delivered.` }; }
  async play_rubyfish(s) { const t0 = this.t; await UI.say('', 'Meanwhile, Ruby has the forest to herself. The strawberry lake is full of slow pink fish, and nobody is watching. Skim the eight rings, low over the water and the striped trees.'); this.sound.sfx('roar');
    await this.fly({ solo: 1, rings: s.rings, start: [-40, this.W.height(-40, 138) + 9, 138], land: [s.at[0], s.at[1] + 4] }); const secs = Math.round(this.t - t0);
    return { score: -secs, cinders: Math.max(1, 6 - secs / 20), fmt: (v) => -v + ' seconds', text: `Eight rings in ${secs} seconds, and a chin dripping pink.` }; }
  // ── sound that follows the place: theme by location, beds of wind / water / fire, footsteps by surface ──
  updateSound(dt, mx, my) {
    const W = this.W, p = this.player, S = this.sound; if ((this.sndT = (this.sndT || 0) - dt) <= 0) { this.sndT = 0.4;
      const under = (this.kL ?? 1) < 0.8, mood = this.playS ? 'play' : W.name === 'ember' && under ? 'palace' : this.S.world; if (S.mood !== mood && !this.inCut) S.mood = mood;
      const q = this.riding ? this.ruby : p, near = (list, r) => { let b = 1e9; for (const c of list) b = Math.min(b, Math.hypot(c[0] - q.x, c[1] - q.z) - (c[2] || 0)); return Math.max(0, 1 - Math.max(0, b) / r); };
      const waters = W.sea ? [[q.x, q.z, 0]] : W.name === 'sugar' ? [[-32, 124, 10], [-116, 20, 18], [84, -66, 15], [0, 23, 2.5], [170, q.z, 4]] : [[150, q.z, 4]];
      const fires = [...(W.torches || []).filter((t) => t.lit && this.nightNow()).map((t) => [t.x, t.z]), ...(W.glows || []).map((g) => [g[0], g[2]]), ...[...this.lits.values()].map((m) => [m.position.x, m.position.z])];
      S.ambient('water', near(waters, 26) * 0.11); S.ambient('fire', this.zone?.room ? 0.05 : near(fires, 12) * 0.1); S.ambient('wind', this.zone?.room ? 0 : this.riding ? 0.16 : 0.03 + Math.min(0.1, Math.max(0, p.y - 8) * 0.004)); }
    if (!this.riding && !this.mode?.startsWith?.('sl') && p.ground && !this.busy && Math.hypot(mx, my) > 0.2) { if ((this.stepT = (this.stepT || 0) - dt) <= 0) { this.stepT = p.who === 'kim' || p.model.userData.fast ? 0.27 : 0.33; const stone = this.zone || (W.name === 'ember' && (Math.hypot(p.x, p.z + 30) < 64 || Math.abs(p.x) < 26)) || (W.name === 'sugar' && Math.hypot(p.x, p.z - 16) < 24); S.step(stone ? 'stone' : W.name === 'sugar' && p.z < -100 ? 'snow' : 'grass'); } } else this.stepT = 0.1;
  }
  // ── real light from the nearest fires: lit torches, hearths, braziers, chandeliers ──
  updateLamps(dt) {
    const W = this.W, p = this.riding ? this.ruby : this.player, night = this.nightNow(), under = (this.kL ?? 1) < 0.8, src = [];
    if (!W.sea && !this.zone && this.S.opt.fx !== false && (night || under)) { for (const t of W.torches || []) if (t.lit) src.push([t.x, t.y + 0.4, t.z, t.pink ? 0xff8ab8 : 0xffa040, 34]); for (const g of W.glows || []) if (under || g[4]) src.push([g[0], g[1], g[2], g[3] || 0xffb060, 30]); for (const [, m] of this.lits) src.push([m.position.x, m.position.y, m.position.z, 0xffa040, 38]); }
    src.sort((a, b) => Math.hypot(a[0] - p.x, a[2] - p.z) - Math.hypot(b[0] - p.x, b[2] - p.z));
    this.lamps.forEach((l, i) => { const s = src[i], d = s ? Math.hypot(s[0] - p.x, s[2] - p.z) : 99, want = s && d < 34 ? s[4] * (0.85 + 0.15 * Math.sin(this.t * 9 + i * 2)) : 0; if (s && d < 34) { l.position.set(s[0], s[1], s[2]); l.color.set(s[3]); } l.intensity = lerp(l.intensity, want, Math.min(1, dt * 6)); });
  }
  // ── weather: snow over the Ice Cream Mountains, petals over Sugarland, ash-flecks near the volcano ──
  updateWeather(dt) {
    const W = this.W, p = this.riding ? this.ruby : this.player, F = (this.falls ||= {}); if (!F.snow) { F.snow = makeFall(0xffffff, 520, 1, 2.2, 1.4); F.petal = makeFall(0xffb8d4, 240, 1.5, 0.9, 2.2); F.ash = makeFall(0x4a3a3a, 260, 0.9, 1.1, 1.6); for (const m of Object.values(F)) { m.visible = false; this.scene.add(m); } }
    const fx = this.S.opt.fx !== false && !this.zone && !W.sea, want = { snow: fx && W.name === 'sugar' ? smooth(-84, -112, p.z) : 0, petal: fx && W.name === 'sugar' && p.z > -80 && p.z < 104 ? 0.85 : 0, ash: fx && W.name === 'ember' ? smooth(-88, -130, p.z) : 0 };
    for (const k in F) { const u = F[k].material.uniforms; u.uAmt.value = lerp(u.uAmt.value, want[k], Math.min(1, dt * 1.2)); F[k].visible = u.uAmt.value > 0.02; if (F[k].visible) u.uCam.value.set(p.x, p.y, p.z); }
  }
  // ── torches: after dark, every unlit torch can be lit with Amber's (or Kim's) flame ──
  nightNow() { return this.S.time === 'night' || this.S.time === 'dusk'; }
  markTorches() { const W = this.W; if (!W.torches || W.torchGroup) return; W.torchGroup = new THREE.Group(); for (const t of W.torches) { t.m = new THREE.Mesh(GEO.cone, mat(t.pink ? 0xff8ab8 : 0xffa030, true)); t.m.position.set(t.x, t.y + 0.45, t.z); t.m.scale.set(0.3, 0.9, 0.3); t.m.visible = false; const c = new THREE.Mesh(GEO.cone, mat(t.pink ? 0xffd0e4 : 0xffe08a, true)); c.scale.set(0.5, 0.6, 0.5); c.position.y = -0.2; t.m.add(c); W.torchGroup.add(t.m); } W.group.add(W.torchGroup); }
  nearTorch(r = 4.4) { const p = this.player; let best = null, bd = r; if (!this.nightNow()) return null; for (const t of this.W.torches || []) { if (t.lit) continue; const d = Math.hypot(p.x - t.x, p.z - t.z); if (d < bd) { bd = d; best = t; } } return best; }
  lightTorch(t) { t.lit = true; this.sound.sfx('lit'); this.puff(t.x, t.y + 0.5, t.z, t.pink ? 0xff8ab8 : 0xffb030, 18, 0.5, 2.2); const all = this.W.torches, n = all.filter((x) => x.lit).length; this.S.sparks = (this.S.sparks || 0) + 1;
    if (n === all.length) { this.S.sparks += 6; this.sound.sfx('chapter'); UI.tip(`Every torch in ${this.W.name === 'ember' ? 'Emberland' : 'Sugarland'} is burning. The whole night glows. (+6 cinders)`, 8); } else UI.tip(`Torch lit: ${n} of ${all.length}.`, 2.5); }
  updateTorches(dt) { const W = this.W; if (!W.torches) return; const night = this.nightNow(); if (night && !this.f.tipTorch && this.fireOK() && this.nearTorch(9)) { this.f.tipTorch = 1; UI.tip('An unlit torch. Stand beside it and hold ✦ to light it. There are more along the lanes.', 8); }
    for (const t of W.torches) { if (!t.m) continue; t.m.visible = t.lit && night; if (t.m.visible) { const s = 1 + Math.sin(this.t * 11 + t.x) * 0.16; t.m.scale.set(0.3, 0.9 * s, 0.3); } } }
  poseNpc(n) { // small stagings: the king lies in his bed, the dancers actually dance
    const pose = n.def.pose || (n.id === 'king' && n.def.at === 'king' ? 'lie' : null); if (!pose) return; const m = n.model, t = this.t;
    if (pose === 'lie') { m.rotation.set(-Math.PI / 2, 0, 0); m.position.set(n.x, n.y + 1.4, n.z - 2.2); if (false) { n.fx = part(GEO.box, 0xf6ead8, 0, 0, 0, 2.3, 0.16, 1.05); n.fx.add(part(GEO.box, 0xe2b24a, 0, 0.52, -0.42, 1, 0.3, 0.1)); n.fx.position.set(n.x, n.y + 1.56, n.z - 2.75); this.scene.add(n.fx); m.userData.bed = n.fx; } return; }
    if (pose === 'dance') { const ph = (n.x * 3 + n.z) % 6.28, still = this.busy && Math.hypot(this.player.x - n.x, this.player.z - n.z) < 5;
      if (!n.fx) { n.fx = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.035, 6, 28), mat(0xffa030, true)); m.add(n.fx); n.fx.position.y = 1.15; }
      n.fx.rotation.set(1.1 + Math.sin(t * 3 + ph) * 0.5, t * 5 + ph, 0); if (still) return;
      m.position.set(n.x + Math.cos(t * 0.9 + ph) * 1.5, n.y + Math.abs(Math.sin(t * 5 + ph)) * 0.22, n.z + Math.sin(t * 0.9 + ph) * 1.5); m.rotation.y = t * 2.6 + ph; }
  }
  updateTira(dt) { // Kim's little creature: sometimes rides in the bag, sometimes scurries about beside her
    const k = this.comp?.id === 'kim' ? this.comp : this.player.who === 'kim' ? this.player : null;
    if (!this.tira) { this.tira = { m: makeProp('tira'), out: false, t: 6, x: 0, z: 0, yaw: 0, tx: 0, tz: 0, w: 0 }; this.tira.m.visible = false; this.scene.add(this.tira.m); }
    const T = this.tira; if (!k || this.riding || this.mode || this.zone?.deck) { T.m.visible = false; T.out = false; return; }
    if ((T.t -= dt) <= 0) { T.out = !T.out; T.t = T.out ? 16 + Math.random() * 16 : 9 + Math.random() * 10; if (T.out) { T.x = k.x + 0.5; T.z = k.z; this.sound.tone(1500, 0.08, 'sine', 0.05, 1900); } }
    if (!T.out) { T.m.visible = false; return; }
    if ((T.w -= dt) <= 0 || Math.hypot(T.tx - k.x, T.tz - k.z) > 3.6) { T.w = 0.8 + Math.random() * 1.6; const a = Math.random() * 6.283, r = 1 + Math.random() * 1.6; T.tx = k.x + Math.sin(a) * r; T.tz = k.z + Math.cos(a) * r; }
    const d = Math.hypot(T.tx - T.x, T.tz - T.z); let hop = 0; if (d > 6) { T.x = k.x + 0.6; T.z = k.z + 0.4; } else if (d > 0.15) { const sp = Math.min(d, (d > 2.5 ? 8 : 3.6) * dt), [nx, nz] = this.collide(T.x + (T.tx - T.x) / d * sp, T.z + (T.tz - T.z) / d * sp, 0.2); T.yaw = Math.atan2(nx - T.x, nz - T.z); T.x = nx; T.z = nz; hop = Math.abs(Math.sin(this.t * 14)) * 0.13; }
    T.m.visible = true; T.m.position.set(T.x, this.H(T.x, T.z) + hop, T.z); T.m.rotation.y = T.yaw; T.m.scale.setScalar(1.25);
  }
  updateHint(dt) {
    const tr = this.trail; if (!tr || tr.t <= 0) return; const p = this.player, t = tr.target, d = Math.hypot(t.x - p.x, t.z - p.z); tr.t -= dt;
    if (tr.t <= 0 || d < 3 || this.riding || this.inCut) { tr.t = 0; this.scene.remove(tr.m, tr.beam); return; }
    if ((tr.re -= dt) <= 0) { tr.re = 1.5; const path = this.findPath(p.x, p.z, t.x, t.z) || [[p.x, p.z], [t.x, t.z]], pts = []; let carry = 1.2;
      for (let i = 1; i < path.length; i++) { const [ax, az] = path[i - 1], [bx, bz] = path[i], L = Math.hypot(bx - ax, bz - az); for (let s = carry; s < L; s += 1.15) pts.push([ax + (bx - ax) * s / L, az + (bz - az) * s / L]); carry = (carry - L) % 1.15; if (carry < 0) carry += 1.15; }
      tr.pts = pts.slice(0, 260); tr.beam.position.set(t.x, this.H(t.x, t.z) + 4.5, t.z); }
    const M = this._hm || (this._hm = new THREE.Matrix4()), fade = Math.min(1, tr.t / 1.5); tr.m.count = tr.pts.length;
    tr.pts.forEach(([x, z], i) => { const s = (0.07 + 0.09 * Math.max(0, Math.sin(i * 0.55 - this.t * 6))) * fade; M.makeScale(s, s, s); M.setPosition(x, this.H(x, z) + 0.28, z); tr.m.setMatrixAt(i, M); });
    tr.m.instanceMatrix.needsUpdate = true; tr.beam.material.opacity = (0.35 + 0.2 * Math.sin(this.t * 4)) * fade;
  }
  updateFire(dt) {
    const p = this.player; if (this.inv > 0) { this.inv -= dt; p.model.visible = this.rail ? false : this.inv <= 0 || Math.floor(this.t * 12) % 2 === 0; }
    const hostile = !this.busy && !this.riding && !this.rail && p.who === 'amber' && this.fireOK();
    if (hostile && p.ground && (this.S.hp ?? 3) >= 3 && ((this.safeT = (this.safeT || 0) + dt) > 4) && !this.breaks.some((k) => k.fl && Math.hypot(k.x - p.x, k.z - p.z) < 16)) { this.safeT = 0; this.safe = [p.x, p.z, this.S.world]; }
    for (let i = (this.shots || []).length - 1; i >= 0; i--) { const b = this.shots[i]; b.x += b.dx * 8.5 * dt; b.z += b.dz * 8.5 * dt; b.left -= 8.5 * dt; b.mesh.position.set(b.x, b.y, b.z); b.mesh.rotation.y += dt * 8; let dead = b.left <= 0 || this.H(b.x, b.z) > b.y;
      if (hostile && Math.hypot(b.x - p.x, b.z - p.z) < 0.9 && Math.abs(b.y - p.y - 1) < 1.4) { this.hurt(b); dead = true; }
      for (const f of this.bolts) if (Math.hypot(f.x - b.x, f.z - b.z) < 1.1) { dead = true; f.left = 0; }
      if (dead) { this.puff(b.x, b.y, b.z, b.col, 10, 0.4, 1, 0.5); this.scene.remove(b.mesh); this.shots.splice(i, 1); } }
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i], st = 28 * dt; b.x += Math.sin(b.yaw) * st; b.z += Math.cos(b.yaw) * st; b.y += b.vy * dt; b.left -= st; const gh = this.H(b.x, b.z); let dead = b.left <= 0 || gh > b.y + 0.4;
      if (b.y < gh + 0.5) b.y = gh + 0.5; b.mesh.position.set(b.x, b.y, b.z); b.mesh.scale.setScalar(b.sc * (1 + Math.sin(this.t * 40) * 0.2));
      if ((b.tr += dt) > 0.05) { b.tr = 0; this.puff(b.x, b.y, b.z, b.kim ? 0xff8ab8 : 0xff9a30, 3, 0.25, 0.6, 0.45); }
      for (const k of this.breaks) if (Math.hypot(k.x - b.x, k.z - b.z) < 1.5 && Math.abs(k.mesh.position.y + 0.5 - b.y) < 2.4) { this.smash(k); dead = true; break; }
      if (!dead && !this.busy) for (const t of this.things) { const d = t.def; if (!d.flame || d.self || !this.W.P[d.at]) continue; const q = this.W.P[d.at]; if (Math.hypot(q[0] - b.x, q[1] - b.z) < 2.2) { dead = true; this.puff(q[0], this.H(q[0], q[1]) + 1.8, q[1], b.kim ? 0xff8ab8 : 0xffb030, 18, 0.6, 2.5); this.sound.sfx('lit'); this.run(d.script); break; } }
      if (dead) { this.puff(b.x, b.y, b.z, b.kim ? 0xff8ab8 : 0xffb030, 12, 0.5, 1.5, 0.6); this.scene.remove(b.mesh); this.bolts.splice(i, 1); }
    }
    for (const k of this.breaks) { if (!k.fl) continue; k.ph += dt; const d = Math.hypot(p.x - k.x, p.z - k.z); let tx = k.x0 + Math.sin(k.ph * 0.5) * 3, tz = k.z0 + Math.cos(k.ph * 0.37) * 3; k.cd = (k.cd || 0) - dt; if (hostile && d < 11 && Math.hypot(k.x - k.x0, k.z - k.z0) < 15 && k.cd <= 0) { const sp = 3.4 * dt / (d + 0.01); k.x += (p.x - k.x) * sp; k.z += (p.z - k.z) * sp; tx = k.x; tz = k.z;
        if (d < 1.25) { this.hurt(k); k.cd = 2.6; }
        else if (d > 3.5 && (k.st = (k.st ?? 1.5 + Math.random() * 2) - dt) < 0) { k.st = 3.2 + Math.random() * 2; const col = k.kind === 'wisp' ? 0x5a4a52 : 0xa8dcff, m = new THREE.Mesh(GEO.sph, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k.kind === 'wisp' ? 1 : 1.6) })); m.scale.set(0.26, 0.26, 0.26); this.scene.add(m); this.shots.push({ x: k.x, y: p.y + 1.15, z: k.z, dx: (p.x - k.x) / d, dz: (p.z - k.z) / d, left: 15, mesh: m, col }); this.sound.tone(k.kind === 'wisp' ? 140 : 1200, 0.25, 'triangle', 0.05, k.kind === 'wisp' ? 90 : 700); } }
      else if (k.cd > 0 && d < 6) { tx = k.x + (k.x - p.x) / (d + 0.1) * 5; tz = k.z + (k.z - p.z) / (d + 0.1) * 5; }
      k.x += (tx - k.x) * dt * 0.8; k.z += (tz - k.z) * dt * 0.8; if (Math.hypot(k.x - k.x0, k.z - k.z0) > 9) { k.x = lerp(k.x, k.x0, dt); k.z = lerp(k.z, k.z0, dt); } k.mesh.position.set(k.x, this.H(k.x, k.z) + 1.6 + Math.sin(k.ph * 2) * 0.3, k.z); k.mesh.rotation.y = Math.atan2(p.x - k.x, p.z - k.z);
      if (d < 7 && !this.S.vis['seen_' + k.kind] && !this.busy) { this.S.vis['seen_' + k.kind] = 1; this.bark(k.kind === 'wisp' ? 'An ash wisp, drifting off the lava. It spits soot. A fire bolt will scatter it.' : 'A frost puff, down from the Ice Cream Mountains. It throws ice. A little warmth melts it.'); } }
  }

  // ───────── minigames ─────────
  async mini_sled() {
    const p = this.player, W = this.W; this.place(0, -156); this.mode = 'sled'; this.sledV = 4; this.camYaw = 0; UI.controlsVisible(true); UI.tip('Lean with the left thumb. The mountain decides the rest.', 5);
    await new Promise((res) => (this.sledDone = res)); this.mode = null; UI.controlsVisible(false); this.sound.sfx('hit'); this.shake = 0.6; this.puff(p.x, p.y + 1, p.z, 0xffffff, 30); await wait(0.8);
  }
  async mini_balloon(n) {
    const W = this.W, b = W.balloon, p = this.player; await UI.fade(true); W.balloonHold = true; p.model.visible = false; if (this.comp) this.comp.model.visible = false;
    const x0 = b.position.x, z0 = b.position.z, y0 = b.userData.y; this.rail = { t: 0, dur: 80, f: (t) => { const e = t * t * (3 - 2 * t); b.position.set(x0 + e * 46, y0 + 6 + e * 58, z0 + e * 30); const a = 2.2 + e * 1.3; this.cam.position.set(b.position.x - Math.sin(a) * 15, b.position.y + 7, b.position.z - Math.cos(a) * 15); this.cam.lookAt(b.position.x + Math.sin(a) * 40, b.position.y - 16, b.position.z + Math.cos(a) * 40); } };
    await UI.fade(false); await this.exec(n.script); await UI.fade(true); this.rail = null; W.balloonHold = false; b.position.set(x0, y0, z0); p.model.visible = true; if (this.comp) this.comp.model.visible = true; await UI.fade(false);
  }
  async fx(name) {
    const p = this.player, S = this.S;
    if (name === 'boil') { this.sound.sfx('flame'); for (let i = 0; i < 6; i++) { this.puff(-104 - Math.random() * 6, -1.2, 18 + Math.random() * 8, 0xfff4e8, 14, 2, 3); await wait(0.15); } }
    else if (name === 'bird') { this.sound.sfx('lit'); const m = new THREE.Mesh(GEO.cone, mat(0xffc040, true)); m.scale.set(0.12, 0.3, 0.3); this.scene.add(m); for (let t = 0; t < 1; t += 0.012) { const a = t * 6.283; m.position.set(p.x + Math.sin(a) * 1.4, p.y + 1.8 + Math.sin(t * 9) * 0.2, p.z + Math.cos(a) * 1.4); m.rotation.y = a + 1.57; await wait(0.016); } this.puff(m.position.x, m.position.y, m.position.z, 0xcccccc, 8, 0.4, 1); this.scene.remove(m); }
    else if (name === 'fogIn') { S.vis.fog = 1; }
    else if (name === 'ships') { S.vis.ships = 1; this.sound.sfx('roar'); }
    else if (name === 'hit') { S.vis.hit = 1; this.sound.sfx('hit'); this.shake = 0.9; this.puff(p.x + 4, 1, p.z - 3, 0xffffff, 40, 3, 6); await wait(0.5); }
    else if (name === 'torches') { this.sound.sfx('flame'); this.shake = 0.25; for (const t of ['t1', 't2', 't3', 't4']) { const q = this.W.P[t]; this.puff(q[0], this.H(q[0], q[1]) + 3, q[1], 0xffa030, 16, 0.5, 4); } }
    else if (name === 'still') { this.sound.sfx('chime'); const a = this.npc('ashlock'); if (a) this.puff(a.x, a.y + 1.4, a.z, 0xe8f0ff, 60, 1.2, 0.6, 3); }
    else if (name === 'pinkflame') { this.sound.sfx('lit'); const c = this.comp || p; this.puff(c.x, c.y + 1.5, c.z, 0xff8ab8, 30, 0.4, 1.5, 2.5); }
    else if (name === 'eternal') await this.eternal();
  }
  async eternal() {
    const C = this.council, r = this.ruby; if (!C) return; this.sound.sfx('roar'); const all = [...C.ds.map((x) => x.col), 0xff2238];
    for (let i = 0; i < 7; i++) { const src = i < 6 ? C.ds[i].d.position : r.model.position, m = new THREE.Mesh(GEO.cyl, new THREE.MeshBasicMaterial({ color: all[i], transparent: true, opacity: 0.75, fog: false })); m.userData = { i, src }; this.scene.add(m); this.fxs.push(m); this.sound.sfx('lit'); await wait(0.45); }
    const crown = new THREE.Group(); all.forEach((c, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(16 + i * 1.6, 0.9, 6, 40), new THREE.MeshBasicMaterial({ color: c, fog: false, transparent: true, opacity: 0.8 })); t.rotation.x = Math.PI / 2 + i * 0.12; crown.add(t); });
    const core = new THREE.Mesh(GEO.sph, new THREE.MeshBasicMaterial({ color: 0xfff4d0, fog: false, transparent: true, opacity: 0.9 })); core.scale.set(7, 16, 7); crown.add(core); crown.position.set(C.c[0], C.c[1] + 60, C.c[2]); crown.userData.crown = 1; this.scene.add(crown); this.fxs.push(crown);
    this.sound.sfx('chapter'); await wait(5); await UI.fade(true); this.unride('high_rail'); this.camYaw = Math.atan2(C.c[0] - this.player.x, C.c[2] - this.player.z); this.camPitch = -0.25; this.refresh(); await UI.fade(false);
  }
  puff(x, y, z, color, n = 20, spread = 1, rise = 2, life = 1.6) {
    const pos = new Float32Array(n * 3), vel = []; for (let i = 0; i < n; i++) { pos[i * 3] = x + (Math.random() - 0.5) * spread; pos[i * 3 + 1] = y + Math.random() * spread * 0.5; pos[i * 3 + 2] = z + (Math.random() - 0.5) * spread; vel.push((Math.random() - 0.5) * spread, rise * (0.5 + Math.random()), (Math.random() - 0.5) * spread); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const m = new THREE.Points(g, new THREE.PointsMaterial({ color, size: 0.5, transparent: true, opacity: 0.9, depthWrite: false })); m.userData = { vel, life, age: 0 }; this.scene.add(m); this.sparks.push(m);
  }

  // ───────── per-frame ─────────
  update(dt) {
    if (!this.started || !this.W) return; if (this.paused) return; this.t += dt; const W = this.W, p = this.player, f = this.f, ch = this.chapter;
    if (UI.hit('journal')) this.journal.toggle();
    W.tick?.(this.t, dt, this); if (!this.busy) ch.tick?.(this, dt);
    const fogT = this.fogOverride ?? (this.S.vis.fog ? 0.05 : this.baseFog); this.scene.fog.density = lerp(this.scene.fog.density, fogT, Math.min(1, dt * 1.5));
    const free = !this.busy, [mx, my] = free || this.flying || this.mode ? UI.readMove() : [0, 0];
    const sens = (this.S.opt.fast ? 0.009 : 0.006); this.camYaw -= UI.input.lx * sens; this.camPitch = clamp(this.camPitch + UI.input.ly * sens * 0.8, -0.5, 1.2); UI.input.lx = UI.input.ly = 0;
    if (UI.input.keys.has('KeyZ')) this.camYaw += dt * 2; if (UI.input.keys.has('KeyX')) this.camYaw -= dt * 2;
    if (this.riding) this.updateRide(dt, mx, my); else if (this.mode === 'sled') this.updateSled(dt, mx); else if (this.mode === 'play') this.updateFoot(dt, mx, my, true); else if (this.mode === 'med') { this.updateFoot(dt, 0, 0, false); this.updateMed(dt, Math.hypot(mx, my) > 0.25 || UI.hit('jump')); } else this.updateFoot(dt, free ? mx : 0, free ? my : 0, free);
    if (free && !this.riding && !this.mode && UI.hit('med')) this.startMed();
    { const show = p.who === 'amber' && !this.riding && !this.rail && this.fireOK(); if (show !== this.hpShown || this.S.hp !== this.hpLast) { this.hpShown = show; this.hpLast = this.S.hp; UI.setHearts(this.S.hp ?? 3, show); } }
    // people
    for (const n of this.npcs) { const d = Math.hypot(p.x - n.x, p.z - n.z); if (d < 7 && !this.riding && n.id !== 'warden1' && n.id !== 'warden2') n.tyaw = Math.atan2(p.x - n.x, p.z - n.z); n.yaw += wrap((n.tyaw ?? n.yaw) - n.yaw) * Math.min(1, dt * 5); n.model.rotation.y = n.yaw; this.poseNpc(n); n.model.visible = d < 110; if (d < 55) { n.model.userData.pose = this.busy && d < 6 ? 'talk' : null; animPerson(n.model, dt, !!n.walk); } }
    if (this.comp) this.updateComp(dt);
    this.updateRuby(dt); this.updateFire(dt); this.updateTorches(dt); this.updateLamps(dt); this.updateWeather(dt); this.updateSound(dt, mx, my); this.updateTira(dt); this.updateHint(dt);
    for (const t of this.things) if (t.prop) t.prop.rotation.y += dt * (t.def.prop === 'turtle' || t.def.prop === 'cat' ? 0 : 1.2);
    for (const [, m] of this.lits) { const s = 1 + Math.sin(this.t * 9 + m.position.x) * 0.15; m.scale.y = (m.scale.x < 0.5 ? 0.8 : 1.3) * s; }
    for (let i = this.sparks.length - 1; i >= 0; i--) { const m = this.sparks[i], u = m.userData, a = m.geometry.attributes.position; u.age += dt; for (let j = 0; j < a.count; j++) a.setXYZ(j, a.getX(j) + u.vel[j * 3] * dt, a.getY(j) + u.vel[j * 3 + 1] * dt, a.getZ(j) + u.vel[j * 3 + 2] * dt); a.needsUpdate = true; m.material.opacity = 0.9 * (1 - u.age / u.life); if (u.age > u.life) { this.scene.remove(m); this.sparks.splice(i, 1); } }
    if (this.council) { const C = this.council; C.ds.forEach((x) => { x.a += dt * 0.35; x.d.position.set(C.c[0] + Math.sin(x.a) * 44, C.c[1] + Math.sin(x.a * 2) * 3, C.c[2] + Math.cos(x.a) * 44); x.d.rotation.y = x.a + Math.PI / 2; x.d.rotation.z = -0.3; animDragon(x.d, dt, true); }); if (this.ruby.state === 'council') { const r = this.ruby; r.ca = (r.ca ?? 0) + dt * 0.35; r.x = C.c[0] + Math.sin(r.ca) * 44; r.z = C.c[2] + Math.cos(r.ca) * 44; r.y = C.c[1]; r.yaw = r.ca + Math.PI / 2; r.bank = -0.3; r.pitch = 0; } }
    for (const m of this.fxs) { if (m.userData.crown) m.rotation.y += dt * 0.5; else { const s = m.userData.src, C = this.council.c, top = C[1] + 60, hgt = Math.max(1, top - s.y); m.position.set(lerp(s.x, C[0], 0.5), s.y + hgt / 2, lerp(s.z, C[2], 0.5)); m.scale.set(1.2, Math.hypot(hgt, Math.hypot(C[0] - s.x, C[2] - s.z)), 1.2); m.lookAt(C[0], top, C[2]); m.rotateX(Math.PI / 2); } }
    if (this.rail) { this.rail.t = Math.min(1, this.rail.t + dt / this.rail.dur); this.rail.f(this.rail.t); } else this.updateCam(dt);
    { const under = !this.zone && !this.riding && (this.W.roofs || []).some((r) => p.x > r[0] && p.x < r[1] && p.z > r[2] && p.z < r[3] && p.y < r[4]), kt = this.zone?.room ? 0.28 : under ? 0.42 : 1, k = (this.kL = lerp(this.kL ?? 1, kt, Math.min(1, dt * 3))); this.sun.intensity = (this.sunBase ?? 1) * k; this.hemi.intensity = (this.hemiBase ?? 0.5) * (0.55 + 0.45 * k); this.scene.environmentIntensity = 0.3 + 0.7 * k; }
    { const fx = this.S.opt.fx !== false, c = this.riding ? this.ruby : p, night = this.S.time === 'night'; this.sun.castShadow = fx && !this.W.sea; this.sun.target.position.set(c.x, c.y, c.z); this.sun.position.set(c.x - 45, c.y + 90, c.z + 36); this.bloom.strength = night ? 0.7 : 0.45; this.bloom.threshold = 1.02; this.bloom.radius = 0.55; }
    this.dome.position.copy(this.cam.position); this.stars.position.copy(this.cam.position); U.time.value = this.t;
    this.clouds.position.set(this.cam.position.x, Math.max(420, this.cam.position.y + 260), this.cam.position.z);
    { const g = this.grass[this.S.world], m = this.motes[this.S.world], fx = this.S.opt.fx !== false; if (g) { g.visible = fx; g.material.uniforms.uCam.value.set(this.riding ? this.ruby.x : p.x, 0, this.riding ? this.ruby.z : p.z); } if (m) { m.visible = fx; m.material.uniforms.uCam.value.copy(this.cam.position); } }
    if (free && !this.riding && !this.mode) this.interact(dt); else if (!this.riding) UI.setAct(null);
    if (this.playS) this.updatePlay(dt);
    this.hudButtons(free || this.mode === 'play');
    if (this.meter) { this.meterV = Math.max(0.12, (this.meterV ?? 1) - dt / 70); UI.setMeter(this.meter, this.meterV); }
    if ((this.saveT = (this.saveT || 0) + dt) > 15) { this.saveT = 0; this.save(); }
  }
  collide(x, z, r = 0.45) {
    const Z = this.zone; if (Z) { // inside a house or on a tower top
      for (const c of Z.circles) { const dx = x - c[0], dz = z - c[1], d = Math.hypot(dx, dz), m = c[2] + r; if (d < m && d > 1e-4) { x = c[0] + dx / d * m; z = c[1] + dz / d * m; } }
      for (const q of Z.boxes) { if (x > q[0] - r && x < q[1] + r && z > q[2] - r && z < q[3] + r) { const l = x - (q[0] - r), rr = (q[1] + r) - x, t = z - (q[2] - r), bb = (q[3] + r) - z, m = Math.min(l, rr, t, bb); if (m === l) x = q[0] - r; else if (m === rr) x = q[1] + r; else if (m === t) z = q[2] - r; else z = q[3] + r; } }
      if (Z.deck) { const d = Math.hypot(x - Z.cx, z - Z.cz), m = Z.r - r; return d > m ? [Z.cx + (x - Z.cx) / d * m, Z.cz + (z - Z.cz) / d * m] : [x, z]; }
      return [clamp(x, Z.x0, Z.x1), clamp(z, Z.z0, Z.z1)]; }
    const W = this.W, b = W.bounds;
    for (const c of W.circles) { const dx = x - c[0], dz = z - c[1], d = Math.hypot(dx, dz), m = c[2] + r; if (d < m && d > 1e-4) { x = c[0] + dx / d * m; z = c[1] + dz / d * m; } }
    for (const q of W.boxes) { if (x > q[0] - r && x < q[1] + r && z > q[2] - r && z < q[3] + r) { const l = x - (q[0] - r), rr = (q[1] + r) - x, t = z - (q[2] - r), bb = (q[3] + r) - z, m = Math.min(l, rr, t, bb); if (m === l) x = q[0] - r; else if (m === rr) x = q[1] + r; else if (m === t) z = q[2] - r; else z = q[3] + r; } }
    const dock = W.name === 'sugar' && Math.abs(z - 100) < 1.5 && x > 150;
    return [clamp(x, b[0], dock ? 167 : b[1]), dock ? clamp(z, 98.6, 101.4) : clamp(z, b[2], b[3])];
  }
  updateFoot(dt, mx, my, free) {
    const p = this.player, mag = Math.hypot(mx, my); let moving = false;
    if (mag > 0.12) {
      const sy = Math.sin(this.camYaw), cy = Math.cos(this.camYaw), slow = this.meter && this.meterV < 0.3 ? 0.8 : 1;
      const vx = (-cy * mx + sy * -my), vz = (sy * mx + cy * -my), sp = 6.6 * Math.min(1, mag) * slow;
      let [nx, nz] = this.collide(p.x + vx * sp * dt, p.z + vz * sp * dt);
      const ok = (x, z) => { const h = this.H(x, z); return p.ground ? h - p.y < 0.85 : h < p.y + 0.3; };
      if (!ok(nx, nz)) { if (ok(nx, p.z)) nz = p.z; else if (ok(p.x, nz)) nx = p.x; else { nx = p.x; nz = p.z; } }
      p.x = nx; p.z = nz; p.tyaw = Math.atan2(vx, vz); moving = true;
      if (Math.abs(UI.input.lx) < 0.5) this.camYaw += wrap(p.tyaw - this.camYaw) * dt * 0.5 * Math.abs(mx);
    }
    if (p.tyaw !== undefined) p.yaw += wrap(p.tyaw - p.yaw) * Math.min(1, dt * 12);
    const h = this.H(p.x, p.z);
    if (free && UI.hit('jump') && p.ground) { p.vy = 8.6; p.ground = false; }
    if (!p.ground || p.y > h + 0.05) { p.vy -= 24 * dt; p.y += p.vy * dt; p.ground = false; if (p.y <= h) { const fell = p.vy; p.y = h; p.ground = true; p.vy = 0; if (fell < -3 && this.onBouncer(p.x, p.z)) { p.vy = 13.6; p.ground = false; p.y += 0.02; this.sound.sfx('boing'); } } }
    else p.y = h;
    p.model.userData.pose = this.mode === 'med' ? 'sit' : p.ground ? null : 'air'; p.model.position.set(p.x, p.y, p.z); p.model.rotation.y = p.yaw; if (p.model.userData.critter) p.model.position.y += moving && p.ground ? Math.abs(Math.sin(this.t * 16)) * 0.14 : 0; else animPerson(p.model, dt, moving && p.ground);
  }
  onBouncer(x, z) { for (const b of this.W.bouncers || []) if ((x - b[0]) ** 2 + (z - b[1]) ** 2 < b[2] * b[2]) return true; return false; }
  updateSled(dt, mx) { const p = this.player; this.sledV = Math.min(27, this.sledV + dt * 9); p.z += this.sledV * dt; p.x = clamp(p.x + mx * 13 * dt, -13, 13); p.y = this.H(p.x, p.z) + 0.2; p.yaw = mx * 0.5; p.model.position.set(p.x, p.y, p.z); p.model.rotation.set(-0.35, p.yaw, 0); if (this.comp) { this.comp.x = p.x + 3.4; this.comp.z = p.z + 4; } if (Math.random() < 0.5) this.puff(p.x, p.y, p.z - 0.5, 0xffffff, 2, 0.6, 1.5, 0.6); if (p.z > -101) { p.model.rotation.set(0, 0, 0); this.sledDone?.(); this.sledDone = null; } }
  updateComp(dt) {
    const c0 = this.comp, st = this.curStep();
    if (st?.lead && !this.busy) { // Kim walks ahead to the next place and waits for you to catch up
      const p = this.player; if ((c0.lt = (c0.lt || 0) - dt) <= 0) { c0.lt = 1.5; const t = this.hintTarget(); c0.goal = t && !t.ruby ? t : null; c0.path = c0.goal ? this.findPath(c0.x, c0.z, t.x, t.z) : null; c0.pi = 1; }
      if (c0.goal && c0.path) { const dp = Math.hypot(p.x - c0.x, p.z - c0.z), dg = Math.hypot(c0.goal.x - c0.x, c0.goal.z - c0.z); let moving = false;
        if (dg > 3.4 && dp < 10 && c0.pi < c0.path.length) { const [wx, wz] = c0.path[c0.pi], d = Math.hypot(wx - c0.x, wz - c0.z); if (d < 0.9) c0.pi++; else { const sp = (dp < 3 ? 6.2 : 4.6) * dt, [nx, nz] = this.collide(c0.x + (wx - c0.x) / d * sp, c0.z + (wz - c0.z) / d * sp, 0.3); c0.yaw += wrap(Math.atan2(nx - c0.x, nz - c0.z) - c0.yaw) * Math.min(1, dt * 10); c0.x = nx; c0.z = nz; moving = true; } }
        else { c0.yaw += wrap(Math.atan2(p.x - c0.x, p.z - c0.z) - c0.yaw) * dt * 4; if (dp > 12 && dg > 3.4 && (c0.call = (c0.call || 0) - dt) <= 0) { c0.call = 9; this.bark(['This way!', 'Come on, slow feet!', 'Over here!', 'Keep up, Amber!'][Math.floor(Math.random() * 4)]); } if (dp > 40) { this.placeComp(); c0.lt = 0; } }
        c0.y = this.H(c0.x, c0.z); c0.model.position.set(c0.x, c0.y, c0.z); c0.model.rotation.y = c0.yaw; animPerson(c0.model, dt, moving); return; } }
    else if (c0.goal) c0.goal = null;
    const c = this.comp, p = this.player, tx = p.x - Math.sin(p.yaw) * 1.7 + Math.cos(p.yaw) * 1.1, tz = p.z - Math.cos(p.yaw) * 1.7 - Math.sin(p.yaw) * 1.1, d = Math.hypot(tx - c.x, tz - c.z); let moving = false;
    if (d > 26) this.placeComp(); else if (d > 1.1) { const sp = Math.min(8.5, 2 + d * 2.2) * dt, [nx, nz] = this.collide(c.x + (tx - c.x) / d * sp, c.z + (tz - c.z) / d * sp, 0.3); if (Math.hypot(nx - c.x, nz - c.z) < sp * 0.3) { c.stuck = (c.stuck || 0) + dt; if (c.stuck > 1.5) { this.placeComp(); c.stuck = 0; } } else c.stuck = 0; c.yaw = Math.atan2(nx - c.x, nz - c.z); c.x = nx; c.z = nz; moving = true; } else c.yaw += wrap(Math.atan2(p.x - c.x, p.z - c.z) - c.yaw) * dt * 4;
    c.y = this.H(c.x, c.z); c.model.position.set(c.x, c.y, c.z); c.model.rotation.y = c.yaw; animPerson(c.model, dt, moving);
  }
  updateRide(dt, mx, my) {
    const r = this.ruby, W = this.W, inv = this.S.opt.invert ? -1 : 1; let turn = -mx * 1.25, pt = -my * 0.6 * inv;
    const ring = this.rings[this.ringI];
    if (ring) { // gentle assist toward the next ring
      const dx = ring.position.x - r.x, dy = ring.position.y - r.y, dz = ring.position.z - r.z, dh = Math.hypot(dx, dz), want = wrap(Math.atan2(dx, dz) - r.yaw), k = Math.hypot(mx, my) < 0.15 ? 1.4 : 0.35;
      turn += clamp(want * k, -1, 1); pt += clamp(Math.atan2(dy, dh) - pt, -0.5, 0.5) * (Math.abs(my) < 0.15 ? 1 : 0.3);
      if (Math.hypot(dx, dy, dz) < 10) { ring.visible = false; const i = this.ringI++; this.puff(ring.position.x, ring.position.y, ring.position.z, 0xffd27a, 26, 8, 2); this.flyDone?.(i); }
      this.rings.forEach((m, i) => { if (i === this.ringI) { const s = 1 + Math.sin(this.t * 5) * 0.08; m.scale.setScalar(s); m.material.opacity = 0.95; } else m.material.opacity = 0.35; });
    }
    r.yaw += turn * dt; r.pitch += (clamp(pt, -0.7, 0.7) - r.pitch) * Math.min(1, dt * 2.5); r.bank += (-turn * 0.5 - r.bank) * Math.min(1, dt * 3);
    r.speed += ((UI.input.boost ? 40 : 24) - r.speed) * dt * 1.5;
    const cp = Math.cos(r.pitch); r.x += Math.sin(r.yaw) * cp * r.speed * dt; r.z += Math.cos(r.yaw) * cp * r.speed * dt; r.y += Math.sin(r.pitch) * r.speed * dt;
    const floor = (W.sea ? 0 : Math.max(W.name === 'ember' ? -1 : -2, W.height(r.x, r.z))) + 5; if (r.y < floor) { r.y = floor; r.pitch = Math.max(r.pitch, 0.05); } r.y = Math.min(r.y, 190);
    if (!this.flying && !this.busy) { // free roaming
      if (W.edge && (Math.abs(r.x) > W.edge + 60 || Math.abs(r.z) > W.edge + 60) && this.chapter.free) this.cross();
      else if (W.edge && !this.chapter.free && Math.hypot(r.x, r.z - 100) > 130) r.yaw += wrap(Math.atan2(-r.x, 100 - r.z) - r.yaw) * dt * 1.5;
      if (UI.hit('land') && this.canLand()) { this.unride(); this.refresh(); this.save(); }
    }
    this.camYaw += wrap(r.yaw - this.camYaw) * Math.min(1, dt * 2.2);
    if (!this.solo) for (const m of [this.player.model, this.rideComp?.model]) if (m) { m.userData.pose = 'sit'; animPerson(m, dt, false); }
  }
  canLand() { const r = this.ruby, W = this.W; if (W.sea || r.y - W.height(r.x, r.z) > 16) return false; const b = W.bounds; if (r.x < b[0] || r.x > b[1] || r.z < b[2] || r.z > b[3]) return false; const [cx, cz] = this.collide(r.x, r.z, 2); if (Math.hypot(cx - r.x, cz - r.z) > 0.5) return false; return this.chapter.free || Math.hypot(r.x, r.z - 140) < 34; }
  async cross() { this.busy++; const to = this.S.world === 'ember' ? 'sugar' : 'ember'; await UI.fade(true, to === 'sugar' ? 'Across the sea, to Sugarland' : 'Across the sea, to Emberland', true); await this.enterWorld(to, 'day'); const r = this.ruby; r.x = 215; r.z = 40; r.y = 60; r.yaw = -Math.PI / 2; this.camYaw = r.yaw; this.refresh(); await wait(1.2); await UI.fade(false); this.busy--; }
  updateRuby(dt) {
    const r = this.ruby; if (!r.model.visible) return; const fly = r.state !== 'idle';
    r.model.position.set(r.x, r.y, r.z); r.model.rotation.set(-r.pitch, r.yaw, r.bank); animDragon(r.model, dt, fly);
    if (r.state === 'idle') { r.yaw += wrap(Math.atan2(this.player.x - r.x, this.player.z - r.z) - r.yaw) * dt * 0.8; }
  }
  updateCam(dt) {
    const p = this.player, r = this.ruby; let tx, ty, tz, dist, pitch = this.camPitch;
    if (this.riding) { tx = r.x; ty = r.y + 2.5; tz = r.z; dist = 21; pitch = 0.22 - r.pitch * 0.5 + (this.camPitch - 0.3) * 0.5; }
    else { tx = p.x; ty = p.y + 1.55; tz = p.z; dist = this.mode === 'sled' ? 9 : this.zone?.room ? 4.6 : this.camDist; if (this.mode === 'sled') { this.camYaw = 0; pitch = 0.42; } }
    const cp = Math.cos(pitch); let cx = tx - Math.sin(this.camYaw) * cp * dist, cy = ty + Math.sin(pitch) * dist, cz = tz - Math.cos(this.camYaw) * cp * dist;
    const Z = this.zone, W = this.W;
    if (Z?.room) { cx = clamp(cx, Z.x0 - 0.3, Z.x1 + 0.3); cz = clamp(cz, Z.z0 - 0.3, Z.z1 + 0.3); cy = Math.min(cy, Z.ceil - 0.35); }
    else if (!this.riding) { // keep the camera under roofs and on this side of tall walls
      for (const r of W.roofs || []) if (p.x > r[0] && p.x < r[1] && p.z > r[2] && p.z < r[3] && p.y < r[4]) cy = Math.min(cy, r[4] - 0.45);
      if (W.tall && !Z) { let k = 1; for (let s = 1; s <= 10 && k === 1; s++) { const q = s / 10, x = tx + (cx - tx) * q, z = tz + (cz - tz) * q, y = ty + (cy - ty) * q; for (const c of W.tall) if (y < c[3] && (x - c[0]) ** 2 + (z - c[1]) ** 2 < c[2] * c[2]) { k = Math.max(0.15, (s - 1) / 10); break; } if (k === 1) for (const c of W.tallB || []) if (y < c[4] && x > c[0] && x < c[1] && z > c[2] && z < c[3]) { k = Math.max(0.15, (s - 1) / 10); break; } } if (k < 1) { cx = tx + (cx - tx) * k; cz = tz + (cz - tz) * k; cy = ty + (cy - ty) * k + (1 - k) * 1.2; } } }
    const gh = this.W.height(cx, cz) + 0.6; if (cy < gh && !Z?.room) cy = gh;
    if (this.shake > 0) { this.shake -= dt; cx += (Math.random() - 0.5) * this.shake; cy += (Math.random() - 0.5) * this.shake; }
    const k = this.camSnap > 0 ? 1 : Math.min(1, dt * 10); if (this.camSnap > 0) this.camSnap--; this.cam.position.set(lerp(this.cam.position.x, cx, k), lerp(this.cam.position.y, cy, k), lerp(this.cam.position.z, cz, k)); this.cam.lookAt(tx, ty, tz);
  }
  // ── going inside: houses have rooms, towers have tops ──
  nearDoor() { const p = this.player; let best = null, bd = 2.7; for (const d of this.W.doors || []) { const k = Math.hypot(p.x - d.x, p.z - d.z); if (k < bd) { bd = k; best = d; } } return best; }
  async enterDoor(d) {
    this.busy++; UI.setAct(null); this.sound.sfx('page'); await UI.fade(true); const p = this.player, Z = d.deck ? deckZone(d.deck) : makeRoom(this.W.name, d.seed); Z.back = [d.x, d.z]; this.zone = Z;
    if (Z.group) this.scene.add(Z.group); if (Z.resident) { const L = { ...CAST[Z.resident.id] }; Z.npc = makePerson(L); Z.npc.position.set(Z.resident.x, Z.y, Z.resident.z); Z.npc.rotation.y = Math.atan2(Z.spawn[0] - Z.resident.x, Z.spawn[1] - Z.resident.z); this.scene.add(Z.npc); }
    p.x = Z.spawn[0]; p.z = Z.spawn[1]; p.y = Z.y; p.vy = 0; p.ground = true; p.yaw = p.tyaw = Z.room ? Math.PI : Math.atan2(Z.cx - p.x, Z.cz - p.z); this.camYaw = p.yaw; this.camSnap = 3; if (this.comp) this.placeComp();
    if (this.trail) this.trail.t = 0.01; await wait(0.15); await UI.fade(false); this.busy--; if (Z.deck && !this.f.tipDeck) { this.f.tipDeck = 1; UI.tip('The whole kingdom from up here. The hatch takes you back down.', 6); }
  }
  dropZone() { const Z = this.zone; if (!Z) return; if (Z.group) this.scene.remove(Z.group); if (Z.npc) this.scene.remove(Z.npc); this.zone = null; }
  async leaveZone() { const Z = this.zone; this.busy++; UI.setAct(null); this.sound.sfx('page'); await UI.fade(true); this.dropZone(); this.place(Z.back[0], Z.back[1]); if (this.comp) this.placeComp(); this.camSnap = 3; this.refresh(); await UI.fade(false); this.busy--; this.save(); }
  zoneInteract(dt) {
    const p = this.player, Z = this.zone; this.flame.visible = false; this.flameLight.intensity = 0; UI.hit('flameTap'); UI.hit('whistle');
    if (Z.npc) { animPerson(Z.npc, dt, false); Z.npc.rotation.y += wrap(Math.atan2(p.x - Z.resident.x, p.z - Z.resident.z) - Z.npc.rotation.y) * Math.min(1, dt * 4); }
    if (Math.hypot(p.x - Z.exit.x, p.z - Z.exit.z) < 2.3) { UI.setAct(Z.exit.label); if (UI.hit('act')) return this.leaveZone(); }
    else if (Z.npc && Math.hypot(p.x - Z.resident.x, p.z - Z.resident.z) < 3) { UI.setAct('Talk · Neighbour'); if (UI.hit('act')) return this.run([['Neighbour', Z.resident.line]]); }
    else UI.setAct(null);
  }
  interact(dt) {
    if (this.zone) return this.zoneInteract(dt);
    const p = this.player, f = this.f, W = this.W; let best = null, bd = 1e9;
    for (const n of this.npcs) { const d = Math.hypot(p.x - n.x, p.z - n.z) - 3.3; if (d < 0 && d < bd && n.def.talk && (typeof n.def.talk !== 'function' || n.def.talk(f, this))) { best = n; bd = d; } }
    let flameT = null, anyFlame = false; const cmp = this.comp;
    if (this.nearTorch() && this.fireOK()) anyFlame = true;
    for (const t of this.things) {
      const d = t.def; let q = d.kimTalk ? (cmp ? [cmp.x, cmp.z] : null) : d.at === 'player' ? [p.x, p.z] : W.P[d.at]; if (!q) continue; const dist = Math.hypot(p.x - q[0], p.z - q[1]);
      if (d.auto) { const inZone = dist < d.auto && (!d.high || p.y > this.H(q[0], q[1]) - 0.8); if (inZone && !this.inside.has(d.id)) { this.inside.add(d.id); if (d.once) f['t_' + d.id] = 1; return this.run(d.script); } if (!inZone) this.inside.delete(d.id); continue; }
      if (d.flame) { anyFlame = true; if (d.self || dist < 5) flameT = t; continue; }
      const dd = dist - (d.kimTalk ? 4 : (t.rr ??= this.reach(q, d.r))); if (dd < 0 && dd - 0.5 < bd) { best = t; bd = dd - 0.5; }
    }
    this.anyFlame = anyFlame;
    // flame
    const fireOK = this.fireOK(), tapped = UI.hit('flameTap'), fl = UI.input.flame && (anyFlame || fireOK); this.flame.visible = fl; this.flameLight.intensity = fl ? 30 : 0;
    if (tapped && !UI.input.flame && !this.flameT) this.castBolt();
    if (fl) { const hx = p.x + Math.sin(p.yaw) * 0.5, hz = p.z + Math.cos(p.yaw) * 0.5, s = 0.16 + Math.sin(this.t * 20) * 0.03 + Math.min(0.22, (this.flameT || 0) * 0.14); this.flame.position.set(hx, p.y + 1.25, hz); this.flame.scale.set(s, s * 1.7, s); this.flame.material.color.set(p.who === 'kim' ? 0xff8ab8 : 0xffc040); this.flameLight.position.copy(this.flame.position); if (p.model.userData.armR) p.model.userData.armR.rotation.x = -1.3; this.flameT = (this.flameT || 0) + dt; if (!this.flameS || this.t - this.flameS > 0.5) { this.flameS = this.t; this.sound.sfx('flame'); } if (!flameT && this.flameT > 0.6) { const tc = this.nearTorch(); if (tc) { this.lightTorch(tc); this.flameT = 0.15; } }
      if (flameT && this.flameT > 0.8) { this.flameT = 0; this.flame.visible = false; this.flameLight.intensity = 0; this.sound.sfx('lit'); const q = flameT.def.self ? [p.x, p.z] : W.P[flameT.def.at]; this.puff(q[0], this.H(q[0], q[1]) + 1.8, q[1], p.who === 'kim' ? 0xff8ab8 : 0xffb030, 18, 0.6, 2.5); return this.run(flameT.def.script); } } else if (this.flameT > 0) { const h = this.flameT; this.flameT = 0; if (h < 0.3) this.castBolt(); else if (h > 1.0) this.flare(); }
    // whistle
    if (UI.hit('whistle') && this.canWhistle()) { this.sound.sfx('whistle'); const s = this.chapter.whistle?.(f); if (s) return this.run(s); if (this.freeRide()) return this.run([{ ruby: 'arrive', at: 'player' }, { fn: (g) => { g.mount(); g.ruby.pitch = 0.45; UI.tip('Steer with the left thumb. ▽ Land when you are low over open ground.', 6); } }]); }
    // talk / examine
    if (best && !best.key && cmp?.goal && this.curStep()?.lead && best.def.label === cmp.goal.label && Math.hypot(cmp.x - p.x, cmp.z - p.z) < 9 && p.ground) { cmp.goal = null; return this.run(best.def.script); }
    if (best) { const isNpc = !!best.model && best.key; UI.setAct(isNpc ? 'Talk · ' + best.name : best.def.label); if (UI.hit('act')) { if (isNpc) { const t = best.def.talk, s = typeof t === 'function' ? t(f, this) : t; best.face(p.x, p.z); if (s) return this.run(s); } else return this.run(best.def.script); } }
    else if (this.nearPlay()) { const s = this.nearPlay(); UI.setAct('Play · ' + s.label); if (UI.hit('act')) return this.run([{ fn: (g) => g.play(s) }]); }
    else if (this.nearDoor() && p.ground) { const d = this.nearDoor(); UI.setAct(d.label || 'Go inside'); if (UI.hit('act')) return this.enterDoor(d); }
    else { UI.setAct(this.ruby.state === 'idle' && this.freeRide() && Math.hypot(p.x - this.ruby.x, p.z - this.ruby.z) < 8 ? 'Ride Ruby' : null); if (UI.hit('act') && this.ruby.state === 'idle' && this.freeRide() && Math.hypot(p.x - this.ruby.x, p.z - this.ruby.z) < 8) { this.mount(); this.ruby.pitch = 0.45; } }
  }
  reach(q, r) { // how close counts as "there": generous, and measured from the edge of any obstacle the point sits in or beside
    let ext = 0; const W = this.W; for (const c of W.circles) { const d = Math.hypot(q[0] - c[0], q[1] - c[1]); if (d < c[2] + 1.6) ext = Math.max(ext, c[2] + 1 - d * 0.3); }
    for (const b of W.boxes) if (q[0] > b[0] - 1.2 && q[0] < b[1] + 1.2 && q[1] > b[2] - 1.2 && q[1] < b[3] + 1.2) ext = Math.max(ext, Math.min(b[1] - b[0], b[3] - b[2]) / 2 + 1.2);
    return Math.max(r || 0, 4.6) + Math.min(ext, 9);
  }
  freeRide() { const p = this.player; return p.who === 'amber' && !this.zone && !this.W.sea && (this.chapter.free || (this.f.rideSugar && this.S.world === 'sugar' && Math.hypot(p.x, p.z - 140) < 34)); }
  canWhistle() { return this.S.items.whistle && this.player.who === 'amber' && !this.riding && !this.zone && (this.chapter.canWhistle?.(this.f) || this.freeRide()); }
  hudButtons(free) { const on = free || this.flying; UI.setButtons({ jump: on && !this.riding && !this.mode, flame: free && !this.riding && !this.mode && (this.anyFlame || this.fireOK()), kim: this.player.who === 'kim', whistle: free && this.canWhistle(), med: free && !this.riding && !this.mode && this.player.who === 'amber' && (this.S.hp ?? 3) < 3 && this.fireOK(), boost: this.riding && on, land: this.riding && free && !this.flying && this.canLand() }); UI.hit('flameTap'); UI.hit('boostTap'); if (!free) { UI.hit('act'); UI.hit('jump'); UI.hit('whistle'); UI.hit('land'); UI.hit('med'); } }
}
