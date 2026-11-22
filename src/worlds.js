// The three places: Emberland, Sugarland, and the sea between. Everything is built from code.
import * as THREE from 'three';
import { Kit, smooth, noise2, rnd } from './kit.js';
import { makeDragon, animDragon, makeCritter, makePerson } from './models.js';
import { terrainMaterial, waterMaterial } from './gfx.js';
import { Scatter, hasModel } from './assets.js';

const lerp = (a, b, t) => a + (b - a) * t;
function terrain(w, size, seg, colorFn, splatFn, layers) {
  const [x0, x1, z0, z1] = size, geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, seg, Math.round(seg * (z1 - z0) / (x1 - x0)));
  geo.rotateX(-Math.PI / 2); geo.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  const p = geo.attributes.position, col = new Float32Array(p.count * 3), sp = new Float32Array(p.count * 4), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), h = w.height(x, z, true); p.setY(i, h); c.set(colorFn(x, z, h)); const n = 0.94 + 0.12 * noise2(x * 0.7, z * 0.7); col[i * 3] = c.r * n; col[i * 3 + 1] = c.g * n; col[i * 3 + 2] = c.b * n;
    const s = splatFn(x, z, h), t = s[0] + s[1] + s[2] + s[3] || 1; sp[i * 4] = s[0] / t; sp[i * 4 + 1] = s[1] / t; sp[i * 4 + 2] = s[2] / t; sp[i * 4 + 3] = s[3] / t; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('splat', new THREE.BufferAttribute(sp, 4)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, terrainMaterial(layers)); m.userData.ground = 1; return m;
}
function water(x, z, r, y, color, opacity = 0.85, rough = 0.07) { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), waterMaterial(color, opacity, rough)); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.userData.ground = 1; return m; }
function ocean(color, y, size = 1400) { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), waterMaterial(color, 1, 0.12, 1.4)); m.rotation.x = -Math.PI / 2; m.position.y = y; m.userData.ground = 1; return m; }
function ship(k, x, y, z, hull, sail, ry = 0, lamp = 0xffc45a) {
  const c = Math.cos(ry), s = Math.sin(ry), T = (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c];
  k.box(x, y - 1, z, 5, 3, 16, hull, { ry, wood: 1 }); const [bx, bz] = T(0, -9.5); k.cone(bx, y - 1, bz, 2.5, 3, hull, { ry: ry + Math.PI / 4, wood: 1 }, 4);
  k.cyl(x, y + 2, z, 0.25, 0.25, 13, 0x5a4030); k.box(x, y + 5, z, 0.3, 8, 9, sail, { ry: ry + Math.PI / 2 });
  const [lx, lz] = T(0, -8); k.sph(lx, y + 3.4, lz, 0.5, lamp, { glow: 1 });
}

// A house assembled from Medieval Village MegaKit pieces: W x D metres (6 or 8), door on the local +z side.
function kitHouse(sc, k, w, x, z, W, D, ry, glassC) {
  const y = w.height(x, z) - 0.1, c = Math.cos(ry), s = Math.sin(ry), T = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  const side = (n, at, a, front) => { for (let i = 0; i < n; i++) { const o = -n + 1 + i * 2, [px, pz] = at(o), mid = i === (n >> 1), win = front ? !mid : i % 2 === 1; const r = ry + a + Math.PI;
      sc.add(front && mid ? 'Wall_UnevenBrick_Door_Round' : win ? 'Wall_UnevenBrick_Window_Wide_Round' : 'Wall_UnevenBrick_Straight', px, y, pz, r);
      if (front && mid) { sc.add('DoorFrame_Round_Brick', px, y, pz, r); const [dx, dz] = at(o + 0.53); sc.add('Door_1_Round', dx, y, dz, r); }
      else if (win) { sc.add('Window_Wide_Round1', px, y, pz, r); const [gx, gz] = [px - Math.sin(ry + a) * 0.25, pz - Math.cos(ry + a) * 0.25]; k.box(gx, y + 1.25, gz, 1.1, 1.3, 0.08, glassC, { glow: 1, ry: ry + a }); } } };
  side(W / 2, (o) => T(o, D / 2), 0, true); side(W / 2, (o) => T(-o, -D / 2), Math.PI, false); side(D / 2, (o) => T(W / 2, -o), Math.PI / 2, false); side(D / 2, (o) => T(-W / 2, o), -Math.PI / 2, false);
  [[1, 1, 0], [1, -1, Math.PI / 2], [-1, -1, Math.PI], [-1, 1, -Math.PI / 2]].forEach(([sx, sz, a]) => { const [px, pz] = T(sx * W / 2, sz * D / 2); sc.add('Corner_Exterior_Brick', px, y, pz, ry + a); });
  const roof = `Roof_RoundTiles_${W}x${D}`; sc.add(roof, x, y + 3.1, z, ry); for (const sz of [1, -1]) { const [px, pz] = T(0, sz * D / 2); sc.add('Roof_Front_Brick' + W, px, y + 3.1, pz, ry + (sz > 0 ? Math.PI : 0)); }
  const [hx, hz] = T(W / 4, -D / 4); sc.add('Prop_Chimney', hx, y + 3.4 + W * 0.28, hz, ry);
  k.box(x, y, z, (Math.abs(c) > 0.5 ? W : D) - 0.5, 3.1, (Math.abs(c) > 0.5 ? D : W) - 0.5, 0x2a2024); k.box(x, y + 3.1, z, (Math.abs(c) > 0.5 ? W : D) - 0.6, 1.6, (Math.abs(c) > 0.5 ? D : W) - 0.6, 0x2a2024);
  const hw = (Math.abs(c) > 0.5 ? W : D) / 2 + 0.2, hd = (Math.abs(c) > 0.5 ? D : W) / 2 + 0.2; w.boxes.push([x - hw, x + hw, z - hd, z + hd]);
  const [ex, ez] = T(0, D / 2 + 1.5); w.doors.push({ x: ex, z: ez, seed: Math.abs(Math.round(x * 7 + z * 13)) });
}

// ═══════════════════════════ EMBERLAND ═══════════════════════════
export function buildEmber() {
  const w = { name: 'ember', doors: [], roofs: [], tall: [], circles: [], boxes: [], bouncers: [], bounds: [-150, 137, -172, 112], edge: 200 };
  const PL = { x: 0, z: -30, r: 62, ramp: 14, h: 6 };
  const mounds = [[-18, -62, 9, 7, 5], [14, -62, 8, 7, 7]]; // dragon terraces
  w.height = (x, z) => {
    let h = 0.35 * noise2(x * 0.06, z * 0.06);
    h = Math.max(h, PL.h * smooth(PL.r + PL.ramp, PL.r, Math.hypot(x - PL.x, z - PL.z)));
    const hm = 6 + smooth(-98, -190, z) * 50 + smooth(-112, -170, z) * (noise2(x * 0.05, z * 0.05) - 0.5) * 16 * smooth(14, 40, Math.abs(x - 14));
    h = Math.max(h, smooth(-84, -100, z) * hm);
    h = lerp(h, 36, smooth(17, 9, Math.hypot(x - 26, z + 150)));
    for (const [mx, mz, r, ramp, mh] of mounds) h += mh * smooth(r + ramp, r, Math.hypot(x - mx, z - mz));
    h -= smooth(139, 150, x) * 6;
    h = Math.max(h, 0.5 * smooth(17.6, 16.2, Math.hypot(x, z - 86))); // the Fire Square stands on a low round dais
    return h;
  };
  w.P = {
    market_s: [0, 49], orin: [-12, 58], glass: [13, 55], metal: [20, 70], candle: [-16, 74], square: [0, 82], square_b: [4, 85], square_c: [-4.5, 96.5], kids: [-6, 66], kids2: [7, 64],
    hearth1: [-10, 88], hearth2: [10, 88], hearth3: [0, 95], stairs: [0, 42], court: [0, 0],
    king: [0, -36], king_side: [4.5, -37], king_front: [0, -31], king_door: [0, -23], king_door_in: [1.8, -26], pillar: [8, -18], guard1: [-3.5, -21], guard2: [4, -20.5],
    window_arch: [28, -4], regent_door: [40, -14], regent_desk: [46, -23], regent_drawer: [52, -19], regent_shelf: [41.5, -28], regent_s: [44, -17], regent_p: [50, -27],
    hall_door: [-24, -4], aldren: [-34, -15], mistress: [-26, -12], archive: [-47, -29],
    garden: [-76, 14], statue: [-83, 7], statue_k: [-80, 10],
    side_door: [-12, -38], room_desk: [-34, -44], room_flask: [-30, -41], room_buns: [-35.5, -40.5], room_coins: [-36.5, -46.5], room_spy: [-31, -48], room_cape: [-28, -45],
    terrace: [-18, -62], terrace_ruby: [-21, -66], terrace_chair: [-13.5, -59], high_king: [13, -60], high_rail: [15, -66.5],
    t1: [16, -26], t2: [22, -31], ladder: [26.5, -35], t3: [29, -39], t4: [33, -43], long_window: [36.5, -46.5], linen: [19, -36],
    baker: [9, -72], hide1: [10.5, -79], hide2: [-1.5, -74], gate: [0, -92], gate_w1: [-3.2, -89.5], gate_w2: [3.2, -89.5], gate_shadow: [-10, -80],
    overlook: [26, -150], overlook_ruby: [31, -155],
    quay: [124, 36], quay_ruby: [131, 44], quay_orin: [117, 30], awning: [111, 26], quay_s: [127, 30], quay_t: [130, 33.5], quay_l: [121, 41], quay_p: [115, 38],
  };
  const g = (w.group = new THREE.Group()), k = new Kit(), P = w.P, H = w.height, R = rnd(7), sc = new Scatter(), KIT = hasModel('Roof_RoundTiles_6x6'), NAT = hasModel('CommonTree_1');
  const IV = 0xf1e6d2, GOLD = 0xe2b24a, RED = 0xa3182c, DK = 0x3b2a2a, LAVA = 0xff7a1c;
  g.add(terrain(w, [-260, 260, -300, 180], 210, (x, z, h) => {
    const d = Math.hypot(x - PL.x, z - PL.z);
    if (z < -100) return noise2(x * 0.09, z * 0.3) > 0.78 ? 0xc8521a : h > 44 ? 0x4a3636 : 0x3a2c2c;
    if (d < PL.r + 2) return (Math.floor(x / 4) + Math.floor(z / 4)) % 2 ? 0xe9dcc4 : 0xe2d3b8;
    if (x > 104 && x < 140 && z > 16 && z < 52) return 0xb9a58a;
    if (Math.abs(x) < 26 && z > 44) return 0xb98a66;
    if (Math.hypot(x + 80, z - 9) < 13) return 0x8a4a3a;
    if (z > 26 && z < 42 && x > 0) return 0x9a7a62;
    return noise2(x * 0.12, z * 0.12) > 0.72 ? 0x7a3a22 : 0x4c3832;
  }, (x, z) => { // ground, rock, cobbles, marble
    const d = Math.hypot(x - PL.x, z - PL.z), marble = smooth(PL.r + 4, PL.r + 1, d) * smooth(-100, -92, z), rock = Math.max(smooth(-94, -106, z), 0.35 * noise2(x * 0.04, z * 0.04));
    const cob = Math.max(smooth(30, 24, Math.abs(x)) * smooth(42, 47, z), (x > 0 && x < 140 ? smooth(24, 27, z) * smooth(44, 41, z) : 0), smooth(102, 105, x) * smooth(141, 138, x) * smooth(14, 17, z) * smooth(54, 51, z)) * (1 - marble);
    return [Math.max(0, 1 - marble - cob - rock), rock * (1 - marble) * (1 - cob), cob, marble];
  }, [{ id: 'burned_ground_01', scale: 0.16, rough: 0.95, chroma: 0.6 }, { id: 'rock_06', scale: 0.09, rough: 0.9, chroma: 0.6 }, { id: 'cobblestone_floor_04', scale: 0.3, rough: 0.8, chroma: 0.7 }, { id: 'marble_tiles', scale: 0.26, rough: 0.35, chroma: 0.8 }]));
  g.add(ocean(0x7a4a48, -1.2));
  const box = (x0, x1, z0, z1) => w.boxes.push([x0, x1, z0, z1]);
  const pillar = (x, z, h = 5, r = 0.45) => { const y = H(x, z); k.cyl(x, y, z, r, r * 1.15, h, IV); k.cyl(x, y + h, z, r * 1.5, r, 0.4, GOLD); w.circles.push([x, z, r + 0.15]); };
  const banner = (x, y, z, ry = 0) => { k.box(x, y, z, 1.6, 4.2, 0.12, RED, { ry }); k.box(x, y + 1.6, z, 0.7, 0.9, 0.16, GOLD, { ry }); };
  const tower = (x, z, h, r = 4.2, disc = true) => {
    const y = H(x, z); k.cyl(x, y, z, r * 0.82, r, h, IV, { c2: 0xfff6e6 }, 12); banner(x, y + h * 0.5, z + r * 0.95);
    const top = y + h + 1.6, a = Math.atan2(PL.x - x, PL.z - z - 0.01), dx = Math.sin(a), dz = Math.cos(a), R2 = r * 2.2;
    k.cyl(x, y + h, z, R2, r * 0.9, 1.6, 0xead9b8, {}, 16); k.torus(x, top + 0.6, z, R2 - 0.05, 0.14, GOLD, { rx: Math.PI / 2 }); k.torus(x, top + 1.05, z, R2 - 0.05, 0.08, GOLD, { rx: Math.PI / 2 }); for (let i = 0; i < 16; i++) k.cyl(x + Math.cos(i * 0.3927) * (R2 - 0.05), top, z + Math.sin(i * 0.3927) * (R2 - 0.05), 0.08, 0.08, 1.05, GOLD, {}, 5);
    if (!disc) { k.cyl(x, top, z, 1.5, 1.7, 3.2, IV, { c2: 0xfff6e6 }, 10); k.cone(x, top + 3.2, z, 2.6, 4.6, 0xb02a3a, { roof: 1 }, 12); k.sph(x, top + 7.9, z, 0.32, GOLD); k.box(x, top + 8.2, z, 0.06, 1.6, 0.06, GOLD); k.box(x + 0.5, top + 9.3, z, 1, 0.55, 0.05, RED); for (let i = 0; i < 4; i++) k.box(x + Math.cos(i * 1.571 + 0.78) * 1.62, top + 1.2, z + Math.sin(i * 1.571 + 0.78) * 1.62, 0.5, 1.1, 0.2, 0xffc66a, { glow: 1, ry: -(i * 1.571 + 0.78) + Math.PI / 2 }); }
    for (let i = 1; i < 4; i++) k.box(x, y + h * i / 4.4, z + r * 0.86, 0.9, 1.8, 0.3, 0xffc66a, { glow: 1 });
    // door at the foot, facing the courtyard; hatch on the deck above it
    k.box(x + dx * r * 0.95, y, z + dz * r * 0.95, 1.5, 2.6, 0.5, 0x5a3a26, { ry: a, wood: 1 }); k.box(x + dx * r * 0.97, y + 2.6, z + dz * r * 0.97, 2.1, 0.35, 0.6, GOLD, { ry: a }); for (const s of [-1, 1]) k.box(x + dx * r * 0.97 + Math.cos(a) * s * 0.95, y, z + dz * r * 0.97 - Math.sin(a) * s * 0.95, 0.3, 2.6, 0.6, GOLD, { ry: a }); k.sph(x + dx * (r + 0.1) + Math.cos(a) * 0.45, y + 1.25, z + dz * (r + 0.1) - Math.sin(a) * 0.45, 0.09, GOLD);
    const hx = x + dx * r * 1.45, hz = z + dz * r * 1.45; k.box(hx, top + 0.02, hz, 1.5, 0.1, 1.5, 0x5a3a26, { ry: a, wood: 1 }); k.box(hx, top + 0.1, hz, 0.5, 0.08, 0.12, GOLD, { ry: a });
    w.doors.push({ x: x + dx * (r + 1.7), z: z + dz * (r + 1.7), label: 'Climb the tower', deck: { x, z, r: R2 - 0.55, y: top, hatch: [hx, hz], circles: [[x, z, disc ? 2.6 : 1.9]] } });
    w.circles.push([x, z, r + 0.3]); w.tall.push([x, z, r + 0.2, y + h]); return top;
  };
  const stall = (x, z, c, ry = 0) => { const y = H(x, z); k.box(x, y, z, 4.4, 1, 1.6, 0x8a6248, { ry, wood: 1 }); k.box(x, y + 2.7, z, 5, 0.25, 2.8, c, { ry, rx: 0.12 }); for (const s of [-1, 1]) k.cyl(x + s * 2.1 * Math.cos(ry), y, z - s * 2.1 * Math.sin(ry), 0.09, 0.09, 2.7, 0x4a3226); w.circles.push([x, z, 1.5]); };
  const house = (x, z, wd, dp, h, glassC) => { const y = H(x, z); k.box(x, y, z, wd, h, dp, 0x4a3a3a, { c2: 0x5c4848 }); k.box(x, y + h, z, wd + 0.8, 0.5, dp + 0.8, 0xb8483a, { roof: 1 }); k.cone(x, y + h + 0.5, z, Math.max(wd, dp) * 0.62, 2.4, 0xc8543e, { ry: Math.PI / 4, roof: 1 }, 4); k.box(x + wd * 0.1, y, z + dp / 2 + 0.06, 1.1, 2.1, 0.12, 0x5a3a26, { wood: 1 }); k.box(x - wd * 0.3, y + h + 1, z - dp * 0.2, 0.7, 2.2, 0.7, 0x5c4848); for (const s of [-1, 1]) { k.box(x + s * wd * 0.25, y + 1.4, z + dp / 2 + 0.05, 1, 1.5, 0.1, glassC, { glow: 1 }); k.box(x + (wd / 2 + 0.05) * s, y + 1.4, z, 0.1, 1.5, 1, glassC, { glow: 1 }); } box(x - wd / 2, x + wd / 2, z - dp / 2, z + dp / 2); w.doors.push({ x: x + wd * 0.1, z: z + dp / 2 + 1.4, seed: Math.abs(Math.round(x * 7 + z * 13)) }); };
  const brazier = (x, z) => { const y = H(x, z); k.cyl(x, y, z, 0.2, 0.35, 1.1, 0x5a4a44); k.cyl(x, y + 1.1, z, 0.75, 0.3, 0.4, GOLD); w.circles.push([x, z, 0.6]); };
  const torch = (x, z) => { const y = H(x, z); k.cyl(x, y, z, 0.08, 0.1, 2.3, 0x5a4030); k.cyl(x, y + 2.3, z, 0.2, 0.1, 0.25, GOLD); };
  const lamp = (x, z, c = 0xffb84a) => { const y = H(x, z); k.cyl(x, y, z, 0.07, 0.1, 2.8, 0x4a3a34); k.sph(x, y + 3, z, 0.32, c, { glow: 1 }); };

  // market
  stall(P.orin[0] - 2.2, P.orin[1], 0xe9a23b, Math.PI / 2); stall(P.glass[0] + 2.2, P.glass[1], 0xd94c6a, Math.PI / 2); stall(P.metal[0] + 2.2, P.metal[1], 0x8a8a92, Math.PI / 2); stall(P.candle[0] - 2.2, P.candle[1], 0x8a5ad0, Math.PI / 2);
  for (const [dx, c] of [[-1.2, 0x5ab0ff], [0, 0xb070ff], [1.2, 0xffd060]]) k.sph(P.candle[0] - 2.2, 1.45, P.candle[1] + dx, 0.16, c, { glow: 1 });
  k.sph(P.glass[0] + 2.2, 1.5, P.glass[1], 0.25, 0xffa0c0, { glow: 1 });
  k.box(0, 0, 99.5, 9, 4.5, 0.3, 0xf3e6cf); k.box(0, 0, 99.9, 9.6, 5, 0.3, 0x6b4a36); box(-5, 5, 99, 100.5);
  for (const p of [P.hearth1, P.hearth2, P.hearth3]) brazier(p[0], p[1]);
  { // ── the Fire Square: a round dais ringed with fire columns, an inlaid sun, three great hearths and a stage for the shadow screen ──
    const cx = 0, cz = 86, y = 0.5, ring = (r, t, c) => k.torus(cx, y + 0.03, cz, r, t, c, { rx: Math.PI / 2 });
    ring(16, 0.22, IV); ring(15.2, 0.1, GOLD); ring(10.5, 0.12, RED); ring(10.1, 0.07, GOLD); ring(4.6, 0.12, GOLD); ring(2.2, 0.09, RED);
    for (let i = 0; i < 16; i++) { const a = i * 0.3927, long = i % 2 === 0; k.box(cx + Math.sin(a) * (long ? 7.3 : 6.3), y + 0.02, cz + Math.cos(a) * (long ? 7.3 : 6.3), 0.28, 0.05, long ? 5.2 : 3.2, long ? GOLD : RED, { ry: a }); k.cone(cx + Math.sin(a) * (long ? 10.2 : 8.1), y + 0.02, cz + Math.cos(a) * (long ? 10.2 : 8.1), 0.34, 0.06, long ? GOLD : LAVA, { glow: !long }, 4); }
    for (let i = 0; i < 24; i++) { const a = i * 0.2618; k.box(cx + Math.sin(a) * 12.9, y + 0.02, cz + Math.cos(a) * 12.9, 0.5, 0.05, 1.3, i % 2 ? 0xe2d3b8 : 0xc8632b, { ry: a }); }
    k.cyl(cx, y, cz, 1.5, 1.5, 0.05, GOLD, {}, 8); k.cone(cx, y + 0.04, cz, 0.9, 0.08, LAVA, { glow: 1 }, 8);
    // twelve fire columns round the rim, the lane left open to north and south, with swags of flags between
    const cols = []; for (let i = 0; i < 12; i++) { const a = (i + 0.5) * 0.5236; if (Math.abs(Math.sin(a)) < 0.3) continue; const x = cx + Math.sin(a) * 15.6, z = cz + Math.cos(a) * 15.6; cols.push([x, z, a]);
      k.cyl(x, y, z, 0.85, 0.95, 0.5, 0xe2d3b8, {}, 10); k.cyl(x, y + 0.5, z, 0.5, 0.6, 6.2, IV, { c2: 0xfff6e6 }, 12); k.cyl(x, y + 6.7, z, 0.85, 0.5, 0.5, GOLD, {}, 12); k.cyl(x, y + 7.2, z, 1.15, 0.7, 0.55, GOLD, {}, 12); k.cone(x, y + 7.6, z, 0.75, 1.9, 0xffa02a, { glow: 1 }); k.cone(x + 0.25, y + 7.6, z, 0.4, 1.2, 0xffd060, { glow: 1 });
      k.box(x - Math.sin(a) * 0.6, y + 2.6, z - Math.cos(a) * 0.6, 1.1, 3.4, 0.08, RED, { ry: a }); k.box(x - Math.sin(a) * 0.64, y + 4.2, z - Math.cos(a) * 0.64, 0.55, 0.7, 0.08, GOLD, { ry: a }); w.circles.push([x, z, 0.95]); }
    for (let i = 0; i < cols.length; i++) { const [x0, z0] = cols[i], [x1, z1] = cols[(i + 1) % cols.length]; if (Math.hypot(x1 - x0, z1 - z0) > 9.5) continue; for (let j = 1; j < 8; j++) { const t = j / 8, x = lerp(x0, x1, t), z = lerp(z0, z1, t), sag = Math.sin(t * Math.PI) * 1.1; k.cone(x, y + 6.3 - sag, z, 0.22, 0.5, [RED, GOLD, 0xff8a2a][j % 3], { rx: Math.PI, ry: Math.atan2(x1 - x0, z1 - z0) }, 3); if (j % 2) k.sph(x, y + 5.85 - sag, z, 0.13, 0xffd060, { glow: 1 }); } }
    // the three great hearths: stepped plinths, gold posts and a tall arch behind each bowl
    for (const [hx, hz] of [P.hearth1, P.hearth2, P.hearth3]) { const a = Math.atan2(hx - cx, hz - cz), bx = Math.sin(a), bz = Math.cos(a); k.cyl(hx, y, hz, 2.3, 2.5, 0.25, IV, {}, 14); k.cyl(hx, y + 0.25, hz, 1.7, 1.85, 0.25, 0xe2d3b8, {}, 14);
      for (let i = 0; i < 4; i++) { const q = a + 0.785 + i * 1.571; k.cyl(hx + Math.sin(q) * 1.95, y + 0.25, hz + Math.cos(q) * 1.95, 0.1, 0.12, 1.1, GOLD, {}, 6); k.sph(hx + Math.sin(q) * 1.95, y + 1.45, hz + Math.cos(q) * 1.95, 0.16, LAVA, { glow: 1 }); }
      for (const s of [-1, 1]) k.cyl(hx + bx * 2.6 + bz * s * 2, y, hz + bz * 2.6 - bx * s * 2, 0.32, 0.38, 5.4, IV, {}, 10); k.box(hx + bx * 2.6, y + 5.4, hz + bz * 2.6, 5, 0.6, 0.8, GOLD, { ry: a }); k.box(hx + bx * 2.6, y + 6, hz + bz * 2.6, 3.4, 0.5, 0.7, IV, { ry: a }); k.sph(hx + bx * 2.6, y + 7, hz + bz * 2.6, 0.6, GOLD, { s: [1, 1.2, 0.4], ry: a }); k.box(hx + bx * 2.75, y + 2.2, hz + bz * 2.75, 2.6, 3, 0.08, RED, { ry: a }); k.cone(hx + bx * 2.68, y + 2.9, hz + bz * 2.68, 0.55, 1.5, GOLD, { ry: a }, 4);
      w.circles.push([hx + bx * 2.6 + bz * 2, hz + bz * 2.6 - bx * 2, 0.5], [hx + bx * 2.6 - bz * 2, hz + bz * 2.6 + bx * 2, 0.5]); }
    // the shadow stage: steps, a proscenium with curtains, fire bowls either side
    k.box(0, y, 98.6, 12, 0.35, 3, IV); k.box(0, y, 97.2, 12.6, 0.18, 0.8, 0xe2d3b8); for (const s of [-1, 1]) { k.cyl(s * 5.6, y, 99.7, 0.5, 0.6, 7, IV, { c2: 0xfff6e6 }, 12); k.cyl(s * 5.6, y + 7, 99.7, 0.9, 0.55, 0.5, GOLD, {}, 12); k.cone(s * 5.6, y + 7.4, 99.7, 0.6, 1.5, 0xffa02a, { glow: 1 }); k.box(s * 4.75, y + 0.35, 99.3, 0.9, 5.8, 0.25, RED, { c2: 0x7a1020 }); w.circles.push([s * 5.6, 99.7, 0.7]); }
    k.box(0, y + 6.2, 99.7, 12, 0.9, 0.9, GOLD); k.box(0, y + 7.1, 99.7, 8, 0.6, 0.8, IV); k.sph(0, y + 8.2, 99.7, 0.8, GOLD, { s: [1, 1.2, 0.4] }); for (let i = -4; i <= 4; i++) k.cone(i * 1.15, y + 5.9, 99.3, 0.5, 0.7, RED, { rx: Math.PI }, 4);
    // curved stone benches east and west, fire-lily planters, banner poles at the lane mouths
    for (const s of [-1, 1]) for (let i = -2; i <= 2; i++) { const a = s * (1.571 + i * 0.2), x = cx + Math.sin(a) * 13, z = cz + Math.cos(a) * 13; k.box(x, y, z, 2.3, 0.5, 0.8, IV, { ry: a + 1.571 }); k.box(x + Math.sin(a) * 0.36, y + 0.5, z + Math.cos(a) * 0.36, 2.3, 0.5, 0.16, 0xe2d3b8, { ry: a + 1.571 }); w.circles.push([x, z, 1]); }
    for (const [a, r] of [[0.75, 12.2], [-0.75, 12.2], [2.39, 12.2], [-2.39, 12.2]]) { const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r; k.cyl(x, y, z, 1, 0.8, 0.7, IV, {}, 10); k.cyl(x, y + 0.7, z, 1.1, 1.1, 0.12, GOLD, {}, 10); for (let i = 0; i < 6; i++) { k.cyl(x + Math.cos(i) * 0.5, y + 0.7, z + Math.sin(i) * 0.5, 0.03, 0.03, 0.6, 0x4a6a3a, {}, 4); k.cone(x + Math.cos(i) * 0.5, y + 1.3, z + Math.sin(i) * 0.5, 0.2, 0.5, i % 2 ? 0xe2402c : 0xff8a2a); } w.circles.push([x, z, 1.1]); }
    for (const [x, z] of [[-4.6, 70.6], [4.6, 70.6]]) { k.cyl(x, 0.2, z, 0.16, 0.2, 8, GOLD, {}, 8); k.box(x + (x < 0 ? -0.9 : 0.9), 5.4, z, 1.6, 2.8, 0.08, RED); k.box(x + (x < 0 ? -0.9 : 0.9), 6.2, z, 0.8, 0.9, 0.1, GOLD); k.sph(x, 8.4, z, 0.3, LAVA, { glow: 1 }); w.circles.push([x, z, 0.4]); } }
  const glassCols = [0xff9a3a, 0xff5a7a, 0xffd24a, 0xff7ad0, 0x7ad0ff, 0xb48aff];
  for (let i = 0; i < 26; i++) { const side = i % 2 ? 1 : -1, row = Math.floor(i / 2), x = side * (34 + (row % 3) * 15 + R() * 3), z = 52 + Math.floor(row / 3) * 14 + R() * 3; if (side > 0 && z < 44) continue; const r1 = R(), r2 = R(), r3 = R(); if (KIT) { const big = i % 3 === 0; kitHouse(sc, k, w, x, z, big ? 8 : 6, big ? 8 : i % 2 ? 8 : 6, side > 0 ? -Math.PI / 2 : Math.PI / 2, glassCols[i % 6]); } else house(x, z, 7 + r1 * 3, 6 + r2 * 3, 4 + r3 * 3, glassCols[i % 6]); }
  if (KIT) { for (const [x, z, r] of [[-20, 54, 0.4], [-21.4, 55.6, 1.2], [23, 62, 0.2], [-22, 80, 2], [24, 86, 1], [25.3, 84.6, 0.3], [116, 46, 0.5], [117.4, 47.2, 1.4], [134, 22, 0]]) { sc.add('Prop_Crate', x, H(x, z), z, r, 0.95); w.circles.push([x, z, 0.7]); } sc.add('Prop_Wagon', 26, H(26, 76), 76, 0.3); w.circles.push([26, 75, 1.6]); sc.add('Prop_Wagon', 106, H(106, 44), 44, 1.9); w.circles.push([106, 44, 1.6]); for (let i = 0; i < 8; i++) sc.add('Prop_WoodenFence_Single', -31, H(-31, 50 + i * 2.06), 50 + i * 2.06, Math.PI / 2); }
  for (let z = 50; z < 104; z += 12) { lamp(-7, z); lamp(7, z + 6); }
  // great stair + plateau rim
  for (let i = 0; i < 12; i++) k.box(0, PL.h * (1 - (i + 1) / 12) - 0.2, 32.5 + i * 1.15, 14 - i * 0.2, 0.55, 1.2, IV);
  for (const s of [-1, 1]) { pillar(s * 8, 31, 7, 0.6); k.sph(s * 8, PL.h + 7.9, 31, 0.5, LAVA, { glow: 1 }); }
  // towers (as in the painting: ivory, gold, crimson, with dragon terraces)
  const perch = [];
  [[-52, -52, 24], [52, -58, 27], [-58, -8, 19], [58, -6, 21], [-34, -78, 30, 0], [34, -78, 30, 0], [0, -66, 15, 0]].forEach(([x, z, h, d], i) => { const top = tower(x, z, h, i > 3 ? 5 : 4.2, d !== 0); if (i < 2) perch.push([x, top, z]); });
  k.box(0, PL.h + 9, -84, 62, 5, 3, IV); k.box(0, PL.h + 14, -84, 64, 0.6, 3.6, GOLD); // gate wall arch
  for (const s of [-1, 1]) { k.box(s * 82, 2, -90, 154, 12, 2.4, IV, { c2: 0xfff4e0 }); box(s * 82 - 77, s * 82 + 77, -91.6, -88.4); }
  lamp(-4.4, -88); lamp(4.4, -88);
  // king's chamber
  const ky = PL.h; for (const [x, z] of [[-6, -28], [6, -28], [-6, -42], [6, -42]]) pillar(x, z, 6.5, 0.55);
  k.box(0, ky + 6.6, -35, 14.5, 0.5, 16.5, 0xb02a3a, { roof: 1 }); k.box(0, ky + 7.1, -35, 11, 0.5, 13, GOLD); k.box(0, ky, -43, 13, 6.6, 0.5, IV); box(-6.5, 6.5, -43.4, -42.6);
  k.box(0, ky, -39, 3.2, 0.7, 4.6, 0x6b2a2a); k.box(0, ky + 0.7, -38.4, 3, 0.35, 3.6, 0xf3e6d8); k.box(0, ky + 0.7, -40.6, 3, 0.6, 0.9, 0xfff6ea); box(-1.8, 1.8, -41.4, -36.8);
  k.box(2.6, ky, -40, 0.9, 0.9, 0.9, 0x5a3a2a); k.box(2.6, ky + 0.9, -40, 0.3, 0.45, 0.3, 0xd03a3a); k.sph(2.6, ky + 1.15, -40, 0.13, 0xffd060, { glow: 1 });
  for (const s of [-1, 1]) { k.box(s * 3.4, ky, -23, 0.7, 5.5, 0.7, IV); w.circles.push([s * 3.4, -23, 0.5]); } k.box(0, ky + 5.5, -23, 7.6, 0.7, 0.8, GOLD);
  pillar(P.pillar[0] + 1.3, P.pillar[1] - 0.6, 6.5, 0.9);
  // the keep rises over the king's chamber
  for (const s of [-1, 1]) { k.box(s * 6.9, ky, -35, 0.5, 6.6, 15.5, IV, { c2: 0xfff4e0 }); box(s * 6.9 - 0.35, s * 6.9 + 0.35, -42.8, -27.3); for (let i = 0; i < 3; i++) k.box(s * 6.62, ky + 2.2, -40 + i * 4.6, 0.12, 2.6, 1.3, 0xffc66a, { glow: 1 }); }
  k.box(0, ky + 7.6, -35, 10.5, 7, 12.5, IV, { c2: 0xfff6e6 }); k.box(0, ky + 14.6, -35, 11.5, 0.6, 13.5, GOLD); k.cone(0, ky + 15.2, -35, 9.2, 7, 0xb02a3a, { ry: Math.PI / 4, roof: 1 }, 4); k.sph(0, ky + 22.4, -35, 0.45, GOLD); k.box(0, ky + 22.8, -35, 0.08, 2.4, 0.08, GOLD); k.box(0.8, ky + 24.5, -35, 1.6, 0.8, 0.06, RED);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { k.cyl(sx * 5.3, ky + 7.6, -35 + sz * 6.3, 1.1, 1.2, 9, IV, {}, 10); k.cone(sx * 5.3, ky + 16.6, -35 + sz * 6.3, 1.5, 3, 0xb02a3a, { roof: 1 }, 10); k.sph(sx * 5.3, ky + 19.7, -35 + sz * 6.3, 0.2, GOLD); }
  for (let i = -1; i <= 1; i++) { for (const sz of [1, -1]) k.box(i * 3, ky + 9.6, -35 + sz * 6.3, 1.1, 2.6, 0.2, 0xffc66a, { glow: 1 }); for (const sx of [1, -1]) k.box(sx * 5.3, ky + 9.6, -35 + i * 3.4, 0.2, 2.6, 1.1, 0xffc66a, { glow: 1 }); }
  banner(-3.6, ky + 9.3, -28.6); banner(3.6, ky + 9.3, -28.6); w.roofs.push([-7, 7, -43.5, -27, ky + 6.6]);
  // ── the palace proper: one enclosed building around the old pavilions, with a great hall, wings and corridors ──
  const kp = new Kit(), RH = 7.4, ptop = ky + RH, GLASS = 0xffc66a; w.tallB = [];
  { const solid = (x0, x1, z0, z1) => { box(Math.min(x0, x1) - 0.1, Math.max(x0, x1) + 0.1, Math.min(z0, z1) - 0.1, Math.max(z0, z1) + 0.1); w.tallB.push([Math.min(x0, x1) - 0.35, Math.max(x0, x1) + 0.35, Math.min(z0, z1) - 0.35, Math.max(z0, z1) + 0.35, ptop]); };
    const spans = (a, b, gaps) => { const out = []; let c = a; for (const [g0, g1] of [...gaps].sort((p, q) => p[0] - q[0])) { if (g0 > c) out.push([c, g0, 1]); out.push([g0, g1, 0]); c = g1; } if (c < b) out.push([c, b, 1]); return out; };
    const wallX = (z, x0, x1, gaps = [], outer = 0) => { for (const [a, b, full] of spans(x0, x1, gaps)) { const m = (a + b) / 2, L = b - a;
        if (full) { kp.box(m, ky - 0.4, z, L, RH + 0.4, 0.9, IV, { c2: 0xfff6e6 }); kp.box(m, ky, z, L + 0.02, 1, 1.06, 0xe2d3b8); solid(a, b, z - 0.45, z + 0.45); for (let x = a + 2.6; x < b - 1.6; x += 5.2) { for (const sgn of [-1, 1]) kp.box(x, ky + 2.4, z + sgn * 0.47, 1.3, 3, 0.06, GLASS, { glow: 1 }); kp.box(x, ky + 5.5, z, 1.7, 0.25, 1.1, GOLD); } }
        else { kp.box(m, ky + 4.6, z, L, RH - 4.6, 0.9, IV); kp.box(m, ky + 4.45, z, L + 0.5, 0.3, 1.2, GOLD); for (const e of [a, b]) kp.box(e, ky, z, 0.55, 4.6, 1.2, GOLD); } }
      if (outer) for (let x = x0 + 1; x < x1; x += 2.6) kp.box(x, ptop + 0.5, z, 1.3, 0.9, 1.1, IV); };
    const wallZ = (x, z0, z1, gaps = [], outer = 0) => { for (const [a, b, full] of spans(z0, z1, gaps)) { const m = (a + b) / 2, L = b - a;
        if (full) { kp.box(x, ky - 0.4, m, 0.9, RH + 0.4, L, IV, { c2: 0xfff6e6 }); kp.box(x, ky, m, 1.06, 1, L + 0.02, 0xe2d3b8); solid(x - 0.45, x + 0.45, a, b); for (let z = a + 2.6; z < b - 1.6; z += 5.2) { for (const sgn of [-1, 1]) kp.box(x + sgn * 0.47, ky + 2.4, z, 0.06, 3, 1.3, GLASS, { glow: 1 }); kp.box(x, ky + 5.5, z, 1.1, 0.25, 1.7, GOLD); } }
        else { kp.box(x, ky + 4.6, m, 0.9, RH - 4.6, L, IV); kp.box(x, ky + 4.45, m, 1.2, 0.3, L + 0.5, GOLD); for (const e of [a, b]) kp.box(x, ky, e, 1.2, 4.6, 0.55, GOLD); } }
      if (outer) for (let z = z0 + 1; z < z1; z += 2.6) kp.box(x, ptop + 0.5, z, 1.1, 0.9, 1.3, IV); };
    // outer shell (south front with the great door, then round by the east, north and west)
    wallX(-7.5, -54, 56, [[-26.5, -21.5], [-5, 5], [25.5, 30.5]], 1); wallZ(56, -34, -7.5, [], 1); wallX(-34, 40, 56, [], 1); wallZ(40, -45, -34, [], 1);
    wallX(-45, -22, 40, [[-20.6, -15.4], [10.4, 15.6]], 1); wallZ(-22, -52, -45, [], 1); wallX(-52, -54, -22, [], 1); wallZ(-54, -52, -7.5, [], 1);
    // inside: the great hall, the antechamber wall, the regent's front wall, Amber's room
    wallZ(-12, -23, -7.5, [[-18, -12.5]]); wallZ(12, -23, -7.5, [[-18, -12.5]]); wallX(-23, -12, -3.7); wallX(-23, 3.7, 12);
    wallX(-14.5, 42.5, 54.8); wallX(-14.5, 37.4, 38.6);
    wallX(-38.2, -38.8, -26.2, [[-34.5, -30.5]]); wallZ(-38.8, -50.8, -38.2); wallZ(-26.2, -50.8, -38.2, [[-46.8, -43.2]]);
    wallZ(-21.5, -21, -11.5); wallX(-21, -42, -21.5, [[-33.5, -29.5]]);
    for (const q of [[6.55, 7.25, -42.8, -27.3], [-7.25, -6.55, -42.8, -27.3], [-6.5, 6.5, -43.4, -42.6], [38, 54, -32, -31], [54, 54.8, -32, -14.5], [37.4, 38, -32, -22.5], [-41.4, -40.6, -20, -8]]) w.tallB.push([q[0] - 0.3, q[1] + 0.3, q[2] - 0.3, q[3] + 0.3, ptop]);
    // roofs
    for (const [x0, x1, z0, z1] of [[-54.6, -22, -52.6, -7], [-22, 40.6, -45.6, -7], [40.6, 56.6, -34.6, -7]]) { kp.box((x0 + x1) / 2, ptop, (z0 + z1) / 2, x1 - x0, 0.5, z1 - z0, 0xb8483a, { roof: 1 }); w.roofs.push([x0, x1, z0, z1, ptop]); }
    kp.box(1, ptop + 0.5, -7, 111.5, 0.3, 1.3, GOLD); kp.box(0, ptop + 0.5, -15.5, 22, 4.4, 14, IV, { c2: 0xfff6e6 }); kp.box(0, ptop + 4.9, -15.5, 23.5, 0.5, 15.5, 0xb02a3a, { roof: 1 }); for (let i = -3; i <= 3; i++) kp.box(i * 3, ptop + 1.9, -8.45, 1.2, 2.4, 0.12, GLASS, { glow: 1 });
    kp.box(-38, ptop + 0.5, -22, 20, 3.6, 20, IV, { c2: 0xfff6e6 }); kp.cone(-38, ptop + 4.1, -22, 15.5, 6, 0xb02a3a, { ry: Math.PI / 4, roof: 1 }, 4); kp.cyl(-32.5, ptop + 0.5, -44.5, 3.6, 4, 7, IV, { c2: 0xfff6e6 }, 12); kp.cone(-32.5, ptop + 7.5, -44.5, 4.6, 6.4, 0xb02a3a, { roof: 1 }, 12); kp.sph(-32.5, ptop + 14.1, -44.5, 0.3, GOLD); for (let i = 0; i < 4; i++) kp.box(-32.5 + Math.cos(i * 1.571) * 3.8, ptop + 2.6, -44.5 + Math.sin(i * 1.571) * 3.8, 0.9, 2, 0.25, GLASS, { glow: 1, ry: -i * 1.571 + Math.PI / 2 });
    kp.box(48, ptop + 0.5, -21, 13, 4, 20, 0xd6d2d4); kp.cone(48, ptop + 4.5, -21, 12.5, 5, 0x55555c, { ry: Math.PI / 4, roof: 1 }, 4); for (let i = -1; i <= 1; i++) kp.box(48 + i * 3.2, ptop + 1.8, -10.95, 1.1, 2.2, 0.12, 0xcfe0f0, { glow: 1 });
    for (const [x, z] of [[56, -34], [40, -45], [-22, -52], [56, -7.5], [-54, -7.5]]) { kp.cyl(x, ky - 1, z, 1.7, 1.9, RH + 5, IV, {}, 10); kp.cone(x, ky + RH + 4, z, 2.3, 4, 0xb02a3a, { roof: 1 }, 10); kp.sph(x, ky + RH + 8.2, z, 0.22, GOLD); w.circles.push([x, z, 2]); }
    // the great door and the front
    for (const s of [-1, 1]) { kp.cyl(s * 6, ky, -6.6, 0.8, 0.95, RH + 1.5, IV, {}, 12); kp.sph(s * 6, ptop + 2.1, -6.6, 0.75, LAVA, { glow: 1 }); kp.box(s * 2.5, ky, -7.5, 4.6, 4.5, 0.3, 0x6b3a26, { wood: 1, ry: s * 1.25 }); w.circles.push([s * 6, -6.6, 1]); for (const bx of [16, 36, 46]) { kp.box(s * bx - (s < 0 ? 4 : 0), ky + 1.4, -6.95, 1.6, 4.6, 0.12, RED); kp.box(s * bx - (s < 0 ? 4 : 0), ky + 4.6, -6.92, 0.8, 0.9, 0.14, GOLD); } }
    kp.box(0, ptop + 0.9, -7.2, 13, 2.6, 0.5, IV); kp.sph(0, ptop + 2.2, -6.9, 1.1, GOLD, { s: [1, 1, 0.25] }); kp.box(0, ptop + 0.75, -6.9, 4, 0.5, 0.3, RED);
    // inside dressing: runners, chandeliers, columns, banners, benches, urns
    kp.box(0, ky + 0.03, -15.3, 3.6, 0.05, 15.4, RED); for (const s of [-1, 1]) kp.box(s * 1.95, ky + 0.035, -15.3, 0.25, 0.05, 15.4, GOLD); kp.box(-17, ky + 0.03, -15.2, 10, 0.05, 2.6, RED); kp.box(17, ky + 0.03, -15.2, 10, 0.05, 2.6, RED); kp.box(-38, ky + 0.03, -30, 2.6, 0.05, 16, RED); kp.box(26, ky + 0.03, -12, 20, 0.05, 2.4, RED);
    for (const [x, z] of [[0, -11], [0, -19], [-30, -14], [-45, -40], [-17, -34], [18, -34], [28, -14], [47, -10.5], [-32.5, -44.5]]) { kp.cyl(x, ptop - 1.6, z, 0.03, 0.03, 1.6, GOLD, {}, 4); kp.torus(x, ptop - 1.7, z, 0.9, 0.06, GOLD, { rx: Math.PI / 2 }); for (let i = 0; i < 6; i++) kp.sph(x + Math.cos(i * 1.047) * 0.9, ptop - 1.55, z + Math.sin(i * 1.047) * 0.9, 0.14, 0xffd27a, { glow: 1 }); }
    for (const [x, z] of [[-9.5, -10.5], [9.5, -10.5], [-9.5, -21], [-17, -28], [-17, -40], [17, -9.5], [36, -9.5], [36, -30], [-50, -12], [-50, -20], [-24, -30], [-46, -44]]) { kp.cyl(x, ky, z, 0.5, 0.6, RH, IV, {}, 10); kp.cyl(x, ky, z, 0.8, 0.85, 0.5, 0xe2d3b8, {}, 10); kp.cyl(x, ptop - 0.6, z, 0.85, 0.55, 0.6, GOLD, {}, 10); w.circles.push([x, z, 0.75]); }
    for (const [x, z, ry] of [[-11.45, -10, 1.571], [11.45, -10, -1.571], [-11.45, -21, 1.571], [11.45, -21, -1.571], [-53.45, -15, 1.571], [-53.45, -30, 1.571], [55.45, -20, -1.571], [-10, -44.45, 0], [25, -44.45, 0], [30, -8.05, 3.1416], [-45, -8.05, 3.1416]]) { kp.box(x, ky + 2.6, z, 1.5, 3.6, 0.08, RED, { ry }); kp.box(x + Math.sin(ry) * 0.05, ky + 4.3, z + Math.cos(ry) * 0.05, 0.7, 0.9, 0.1, GOLD, { ry }); }
    for (const [x, z, ry] of [[-17, -9.2, 0], [20, -9.2, 0], [-44, -9.2, 0], [5, -43.6, 0], [-9, -30, 1.571], [30, -20, 1.571]]) { kp.box(x, ky + 0.45, z, ry ? 0.8 : 2.6, 0.14, ry ? 2.6 : 0.8, 0x6b4a36, { wood: 1 }); kp.box(x, ky, z, ry ? 0.6 : 2.2, 0.45, ry ? 2.2 : 0.6, 0x5a3a26, { wood: 1 }); w.circles.push([x, z, 1.1]); }
    for (const [x, z] of [[-11, -6.4], [11, -6.4], [-20, -44], [38.5, -43.5], [-52.5, -9], [54.5, -9], [-13, -24.5], [13, -24.5]]) { kp.cyl(x, ky, z, 0.4, 0.3, 0.9, GOLD, {}, 10); kp.sph(x, ky + 1.25, z, 0.5, 0xb02a3a, { s: [1, 1.1, 1] }); kp.cone(x, ky + 1.7, z, 0.35, 0.9, LAVA, { glow: 1 }); w.circles.push([x, z, 0.6]); }
    // ── grandeur: every room of the palace dressed in detail ──
    const WD = 0x5a3a26, WD2 = 0x6b4a36, STEEL = 0xb9bcc4, BOOK = [0xa3182c, 0xe2b24a, 0x3a6a8a, 0x4a6a3a, 0x7a3a6a, 0xd98a2b, 0x2a2a3a], F = Math.PI / 2;
    const flat = (x, y, z, wd, h, c, ry, o = {}) => kp.box(x, y, z, wd, h, 0.09, c, { ry, ...o });               // a panel standing against a wall
    const off = (x, z, ry, d) => [x + Math.sin(ry) * d, z + Math.cos(ry) * d];                                     // step out from the wall
    const tapestry = (x, z, ry, wd, h, c, y0 = 1.6) => { flat(x, ky + y0, z, wd, h, c, ry); const [ax, az] = off(x, z, ry, 0.05); flat(ax, ky + y0 + h - 0.25, az, wd + 0.3, 0.25, GOLD, ry); flat(ax, ky + y0, az, wd, 0.3, GOLD, ry); flat(ax, ky + y0 + h * 0.3, az, wd * 0.45, h * 0.4, GOLD, ry); const [bx, bz] = off(x, z, ry, 0.1); kp.cone(bx, ky + y0 + h * 0.36, bz, wd * 0.16, h * 0.3, c === RED ? LAVA : RED, { ry }, 4); for (let i = 0; i < 5; i++) kp.cone(ax + Math.cos(ry) * (i - 2) * wd / 5, ky + y0 - 0.32, az - Math.sin(ry) * (i - 2) * wd / 5, wd / 11, 0.34, GOLD, { rx: Math.PI }, 4); };
    const painting = (x, z, ry, wd, h, c, c2) => { flat(x, ky + 2.3, z, wd + 0.3, h + 0.3, GOLD, ry); const [ax, az] = off(x, z, ry, 0.05); flat(ax, ky + 2.45, az, wd, h, c, ry); const [bx, bz] = off(x, z, ry, 0.09); flat(bx, ky + 2.45, bz, wd, h * 0.4, c2, ry); kp.sph(bx, ky + 2.45 + h * 0.68, bz, h * 0.14, 0xffd27a, { glow: 1, s: [1, 1, 0.2], ry }); };
    const armour = (x, z, ry) => { kp.cyl(x, ky, z, 0.55, 0.6, 0.5, 0xe2d3b8, {}, 8); kp.cyl(x, ky + 0.5, z, 0.2, 0.26, 0.9, STEEL, {}, 8); kp.cyl(x, ky + 1.4, z, 0.36, 0.28, 0.75, STEEL, {}, 8); kp.sph(x, ky + 2.45, z, 0.23, STEEL); kp.cone(x, ky + 2.62, z, 0.09, 0.42, RED); kp.box(x, ky + 1.95, z, 0.95, 0.18, 0.3, STEEL, { ry }); const [sx, sz] = off(x, z, ry + F, 0.5); kp.cyl(sx, ky + 0.5, sz, 0.035, 0.035, 3.2, WD); kp.cone(sx, ky + 3.7, sz, 0.1, 0.4, STEEL); const [hx, hz] = off(x, z, ry, 0.3); kp.cyl(hx, ky + 1.35, hz, 0.34, 0.3, 0.07, RED, { rx: F, ry }, 8); w.circles.push([x, z, 0.7]); };
    const shelf = (x, z, ry, len, h, y0 = 0) => { kp.box(x, ky + y0, z, len, h, 0.55, WD, { ry, wood: 1 }); for (let r = 0; r < Math.floor(h / 0.72); r++) { const [fx, fz] = off(x, z, ry, 0.3); kp.box(fx, ky + y0 + 0.62 + r * 0.72, fz, len - 0.2, 0.06, 0.12, WD2, { ry }); for (let i = 0, n = Math.floor(len / 0.26); i < n; i++) { if ((i * 7 + r * 3) % 9 === 0) continue; const o = (i - (n - 1) / 2) * 0.26, hh = 0.42 + ((i * 5 + r) % 4) * 0.05; kp.box(fx + Math.cos(ry) * o, ky + y0 + 0.14 + r * 0.72, fz - Math.sin(ry) * o, 0.2, hh, 0.16, BOOK[(i * 3 + r * 5) % 7], { ry }); } } };
    const beams = (x0, x1, z0, z1, alongX, step = 5) => { if (alongX) for (let z = z0 + step / 2; z < z1; z += step) { kp.box((x0 + x1) / 2, ptop - 0.55, z, x1 - x0, 0.55, 0.5, WD, { wood: 1 }); kp.box((x0 + x1) / 2, ptop - 0.62, z, x1 - x0, 0.08, 0.6, GOLD); } else for (let x = x0 + step / 2; x < x1; x += step) { kp.box(x, ptop - 0.55, (z0 + z1) / 2, 0.5, 0.55, z1 - z0, WD, { wood: 1 }); kp.box(x, ptop - 0.62, (z0 + z1) / 2, 0.6, 0.08, z1 - z0, GOLD); } };
    const chair = (x, z, ry, c = RED) => { kp.box(x, ky, z, 0.7, 0.5, 0.7, WD, { ry, wood: 1 }); kp.box(x, ky + 0.5, z, 0.74, 0.14, 0.74, c, { ry }); const [bx, bz] = off(x, z, ry, -0.32); kp.box(bx, ky + 0.5, bz, 0.74, 1, 0.12, WD, { ry, wood: 1 }); kp.box(bx, ky + 0.75, bz + 0.0, 0.6, 0.6, 0.14, c, { ry }); };
    const candle = (x, y, z) => { kp.cyl(x, y, z, 0.05, 0.06, 0.3, 0xfff1d6, {}, 6); kp.sph(x, y + 0.38, z, 0.07, 0xffd060, { glow: 1 }); };
    const canopy = (x, z, wd, dp, c) => { for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) kp.cyl(x + sx * wd / 2, ky, z + sz * dp / 2, 0.09, 0.11, 3.6, GOLD, {}, 8); for (const sz of [-1, 1]) kp.box(x, ky + 3.6, z + sz * dp / 2, wd + 0.3, 0.16, 0.16, GOLD); for (const sx of [-1, 1]) kp.box(x + sx * wd / 2, ky + 3.6, z, 0.16, 0.16, dp + 0.3, GOLD); for (const sx of [-1, 1]) { kp.box(x + sx * wd / 2, ky + 1.6, z - dp / 2 + 0.3, 0.12, 2, 0.7, c); kp.box(x + sx * (wd / 2), ky + 3.1, z, 0.08, 0.5, dp, c); } kp.box(x, ky + 3.1, z - dp / 2, wd, 0.5, 0.08, c); kp.box(x, ky + 1.2, z - dp / 2 - 0.05, wd, 2.4, 0.08, c, { c2: 0x5a1020 }); for (let i = -2; i <= 2; i++) kp.cone(x + i * wd / 5, ky + 3.0, z + dp / 2 + 0.15, 0.16, 0.3, GOLD, { rx: Math.PI }, 4); };
    // ceilings: coffered beams in every wing, great pendant banners down the hall
    beams(-11.5, 11.5, -22.5, -8, true, 3.6); beams(-53.5, -22.5, -51.5, -8, false, 5.2); beams(-21.5, 39.5, -44.5, -23.5, false, 5.4); beams(12.5, 55.5, -22.5, -8, false, 5.4); beams(40.5, 55.5, -33.5, -23, true, 4.5);
    for (const [x, z] of [[-7.5, -11], [7.5, -11], [-7.5, -15.5], [7.5, -15.5], [-7.5, -20], [7.5, -20]]) { kp.box(x, ptop - 4.2, z, 1.5, 3.6, 0.07, RED); kp.box(x, ptop - 3.3, z + 0.02, 0.8, 1, 0.09, GOLD); kp.cone(x, ptop - 4.72, z, 0.75, 0.6, RED, { rx: Math.PI }, 4); kp.box(x, ptop - 0.75, z, 1.7, 0.1, 0.1, GOLD); }
    // great hall: inlaid floor, dragon-guarded door to the king, armour and tapestries, gallery rail
    for (const s of [-1, 1]) { kp.box(s * 10.9, ky + 0.02, -15.3, 0.3, 0.05, 15, GOLD); kp.box(s * 5.6, ky + 0.02, -15.3, 0.16, 0.05, 15, 0xc8632b); for (let z = -21.5; z <= -9; z += 2.5) kp.cone(s * 8.2, ky + 0.02, z, 0.75, 0.05, (Math.round(z) % 2) ? RED : GOLD, { ry: 0.785 }, 4);
      kp.cyl(s * 6.2, ky, -21.6, 1, 1.1, 1.1, 0xe2d3b8, {}, 8); kp.sph(s * 6.2, ky + 1.9, -21.6, 0.7, GOLD, { s: [0.9, 1.2, 1.3] }); kp.sph(s * 6.2, ky + 2.9, -21.1, 0.45, GOLD, { s: [0.8, 0.8, 1.4] }); for (const h of [-0.2, 0.2]) kp.cone(s * 6.2 + h, ky + 3.25, -21.5, 0.07, 0.5, GOLD, { rx: -0.6 }); kp.cone(s * 6.2, ky + 2.85, -20.45, 0.14, 0.5, LAVA, { glow: 1, rx: F }); for (const wv of [-1, 1]) kp.box(s * 6.2 + wv * 0.75, ky + 2.2, -21.9, 0.9, 1.1, 0.08, GOLD, { ry: wv * 0.6, rz: wv * 0.3 }); w.circles.push([s * 6.2, -21.6, 1.15]);
      armour(s * 10.6, -9.4, -s * F); armour(s * 10.6, -21.6, -s * F); tapestry(s * 11.5, -11, -s * F, 2.4, 3.8, RED); tapestry(s * 11.5, -20.2, -s * F, 2.4, 3.8, 0x8a5a2a);
      kp.box(s * 11.2, ky + 5.2, -15.3, 0.5, 0.2, 15, GOLD); for (let z = -22; z <= -8.5; z += 1.5) kp.cyl(s * 11.0, ky + 5.4, z, 0.05, 0.05, 0.7, GOLD, {}, 5); kp.box(s * 11.0, ky + 6.1, -15.3, 0.12, 0.1, 15, GOLD); }
    kp.sph(0, ky + 6.3, -22.6, 1.25, GOLD, { s: [1, 1, 0.15] }); kp.sph(0, ky + 6.3, -22.5, 0.95, LAVA, { glow: 1, s: [1, 1, 0.15] }); kp.cone(0, ky + 5.8, -22.4, 0.5, 1.1, 0xffd060, { glow: 1 }, 4); for (let i = 0; i < 8; i++) kp.box(Math.cos(i * 0.785) * 1.6, ky + 6.3 + Math.sin(i * 0.785) * 1.6, -22.55, 0.14, 0.7, 0.08, GOLD, { rz: i * 0.785 - F });
    kp.cyl(0, ky + 0.02, -10, 2.6, 2.6, 0.05, GOLD, {}, 20); kp.cyl(0, ky + 0.04, -10, 2.2, 2.2, 0.05, RED, {}, 20); kp.cone(0, ky + 0.06, -10, 1.2, 0.07, GOLD, {}, 4);
    // the king's chamber: canopied bed, hearth, his chair at the window, wardrobe, books, rugs
    canopy(0, -39, 3.5, 4.8, 0x8e1b2c); kp.box(0, ky + 0.02, -31.5, 7.5, 0.05, 5.5, RED); kp.box(0, ky + 0.03, -31.5, 6.6, 0.05, 4.6, 0xe9d2a0); kp.box(0, ky + 0.04, -31.5, 5.4, 0.05, 3.4, 0x8e1b2c); kp.cyl(0, ky + 0.05, -31.5, 1.1, 1.1, 0.05, GOLD, {}, 12);
    kp.box(-6.15, ky, -32.5, 0.9, 2.6, 3.4, 0xcfc4b6); kp.box(-6.0, ky + 0.2, -32.5, 0.7, 1.5, 2, 0x1a1210); kp.cone(-5.8, ky + 0.25, -32.5, 0.5, 1.1, 0xffa02a, { glow: 1 }); kp.cone(-5.8, ky + 0.25, -32, 0.3, 0.7, 0xffd060, { glow: 1 }); kp.box(-6.0, ky + 2.6, -32.5, 1.3, 0.22, 3.9, GOLD); for (let i = -1; i <= 1; i++) candle(-5.9, ky + 2.82, -32.5 + i * 1.2); painting(-6.6, -32.5, F, 2, 1.6, 0x3a2a4a, 0x8e1b2c); box(-6.6, -5.6, -34.3, -30.7);
    chair(5.6, -30.2, -2.2); kp.cyl(4.6, ky, -29.2, 0.4, 0.3, 0.75, WD, {}, 8); kp.cyl(4.6, ky + 0.75, -29.2, 0.55, 0.55, 0.08, GOLD, {}, 10); candle(4.6, ky + 0.83, -29.2); w.circles.push([5.6, -30.2, 0.6], [4.6, -29.2, 0.5]);
    kp.box(6.1, ky, -40.5, 1, 3.6, 2.6, WD, { wood: 1 }); kp.box(5.58, ky + 0.3, -40.5, 0.06, 3, 1.1, WD2); kp.box(5.56, ky + 1.7, -39.9, 0.08, 0.3, 0.08, GOLD); kp.box(6.1, ky + 3.6, -40.5, 1.2, 0.18, 2.8, GOLD); box(5.5, 6.7, -41.9, -39.1); shelf(-6.3, -40.5, F, 2.6, 3.4); box(-6.7, -5.9, -41.9, -39.1);
    tapestry(0, -42.55, 0, 3, 3.4, RED, 2.6); for (const s of [-1, 1]) { kp.cyl(s * 5.9, ky, -27.9, 0.3, 0.25, 1.1, GOLD, {}, 8); kp.sph(s * 5.9, ky + 1.45, -27.9, 0.42, 0xb02a3a); kp.cone(s * 5.9, ky + 1.8, -27.9, 0.3, 0.8, LAVA, { glow: 1 }); }
    kp.cyl(0, ptop - 2.2, -33, 0.03, 0.03, 1.5, GOLD, {}, 4); kp.torus(0, ptop - 2.3, -33, 1.1, 0.07, GOLD, { rx: F }); for (let i = 0; i < 8; i++) kp.sph(Math.cos(i * 0.785) * 1.1, ptop - 2.15, -33 + Math.sin(i * 0.785) * 1.1, 0.13, 0xffd27a, { glow: 1 });
    // hall of learning: book walls, a long table with benches, globe, lectern, the great map
    shelf(-38, -20.45, 0, 7.4, 4.2); shelf(-25.4, -20.45, 0, 6.6, 4.2); shelf(-22.1, -16.5, -F, 6.4, 4.2);
    kp.box(-30.5, ky + 0.8, -10.6, 6.4, 0.14, 1.5, WD, { wood: 1 }); for (const [dx, dz] of [[-2.9, -0.55], [2.9, -0.55], [-2.9, 0.55], [2.9, 0.55]]) kp.box(-30.5 + dx, ky, -10.6 + dz, 0.16, 0.8, 0.16, WD); for (const dz of [-1.25, 1.25]) kp.box(-30.5, ky, -10.6 + dz, 6, 0.45, 0.45, WD2, { wood: 1 }); for (let i = -2; i <= 2; i++) { kp.box(-30.5 + i * 1.2, ky + 0.94, -10.6 + (i % 2) * 0.2, 0.7, 0.07, 0.5, 0xf3e6cf, { ry: i * 0.3 }); if (i % 2 === 0) candle(-30.5 + i * 1.2 + 0.4, ky + 0.94, -10.3); } box(-33.8, -27.2, -12.1, -9.1);
    kp.cyl(-25, ky, -18, 0.35, 0.5, 0.9, WD, {}, 8); kp.sph(-25, ky + 1.5, -18, 0.6, 0x3a6a8a); kp.torus(-25, ky + 1.5, -18, 0.68, 0.035, GOLD, { rx: 0.4 }); kp.sph(-24.7, ky + 1.7, -17.55, 0.22, 0x7a9a5a, { s: [1, 0.7, 0.4] }); w.circles.push([-25, -18, 0.7]);
    kp.box(-38.5, ky, -11, 0.7, 1.2, 0.7, WD, { wood: 1 }); kp.box(-38.5, ky + 1.2, -11, 1, 0.1, 0.8, WD2, { rz: 0.3 }); kp.box(-38.45, ky + 1.3, -11, 0.7, 0.05, 0.55, 0xf3e6cf, { rz: 0.3 }); w.circles.push([-38.5, -11, 0.6]);
    kp.box(-40.62, ky + 1.3, -14, 0.1, 3.3, 6.7, GOLD); for (const [dz, dy, c] of [[-2, 2.6, 0x4a6a3a], [0.5, 2.2, 0x7a9a5a], [1.8, 3.2, 0x8a6a3a], [-0.6, 3.4, 0x4a6a3a]]) kp.sph(-40.5, ky + dy, -14 + dz, 0.5, c, { s: [0.08, 0.9, 1.4] }); kp.box(-40.5, ky + 1.75, -14, 0.06, 0.06, 6, 0x9ac8f0);
    // archive: shelves to the ceiling, a rolling ladder, scroll racks, stacks and chests
    shelf(-53.25, -29.5, F, 9.6, 5.6); shelf(-47.5, -34.45, 0, 7.4, 5.6); kp.box(-52.2, ky, -27, 0.1, 5.2, 0.12, WD, { rz: -0.16 }); kp.box(-52.2, ky, -28, 0.1, 5.2, 0.12, WD, { rz: -0.16 }); for (let i = 1; i < 9; i++) kp.box(-52.2 + i * 0.09, ky + i * 0.56, -27.5, 0.06, 0.06, 1, WD);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) kp.cyl(-44.3 + (r % 2) * 0.12, ky + 0.5 + r * 0.42, -25 + i * 0.36, 0.14, 0.14, 0.9, [0xf3e6cf, 0xe9d2a0, 0xd8c08a][(i + r) % 3], { rz: F }, 8); kp.box(-44.3, ky, -24.1, 1.1, 2.3, 0.1, WD); kp.box(-44.3, ky, -27, 1.1, 2.3, 0.1, WD); box(-44.9, -43.7, -27.2, -24);
    for (const [x, z, n] of [[-46.5, -26, 5], [-49, -32.6, 3], [-45.3, -28.5, 4]]) for (let i = 0; i < n; i++) kp.box(x + (i % 2) * 0.06, ky + i * 0.16, z, 0.62, 0.15, 0.46, BOOK[(i * 2 + n) % 7], { ry: i * 0.5 });
    kp.box(-48.5, ky, -25.2, 1.5, 0.8, 0.9, WD2, { wood: 1 }); kp.box(-48.5, ky + 0.8, -25.2, 1.56, 0.16, 0.96, GOLD); candle(-45.6, ky + 0.92, -30.6); kp.cyl(-47.5, ptop - 1.5, -29.5, 0.03, 0.03, 1.2, GOLD, {}, 4); kp.sph(-47.5, ptop - 1.7, -29.5, 0.3, 0xffd27a, { glow: 1 });
    // Amber's room: canopy bed, wardrobe, vanity and mirror, window seat, shelves, a toy dragon, the rug
    canopy(-32, -49.5, 4.2, 2.2, 0xa3182c); kp.box(-32.4, ky + 0.02, -44.6, 6.5, 0.05, 5, 0xe9b949); kp.box(-32.4, ky + 0.03, -44.6, 5.7, 0.05, 4.2, 0xa3182c); kp.cyl(-32.4, ky + 0.04, -44.6, 1.2, 1.2, 0.05, 0xfff1d6, {}, 12); kp.cone(-32.4, ky + 0.06, -44.6, 0.6, 0.06, GOLD, {}, 4);
    kp.box(-38.1, ky, -49, 1, 3.4, 2.4, WD, { wood: 1 }); kp.box(-37.58, ky + 0.2, -49, 0.06, 3, 1.05, WD2); kp.box(-38.1, ky + 3.4, -49, 1.2, 0.16, 2.6, GOLD); box(-38.7, -37.5, -50.3, -47.7);
    kp.box(-27, ky, -49.6, 1.8, 0.9, 0.9, 0xfff1d6); kp.sph(-27, ky + 2.1, -50.1, 0.7, GOLD, { s: [1, 1.3, 0.12] }); kp.sph(-27, ky + 2.1, -50.05, 0.6, 0xcfe8f5, { s: [1, 1.3, 0.1], glow: 1 }); for (const dx of [-0.5, 0.4]) kp.cyl(-27 + dx, ky + 0.9, -49.6, 0.08, 0.1, 0.25, [0xff9ec0, 0xc9a0f0][dx > 0 ? 1 : 0], {}, 8); box(-28, -26.6, -50.2, -49.1);
    kp.box(-38.1, ky, -41, 1.1, 0.6, 3.6, WD2, { wood: 1 }); kp.box(-38.1, ky + 0.6, -41, 1.1, 0.16, 3.6, 0xa3182c); for (const [dz, c] of [[-1.2, 0xe9b949], [0, 0xfff1d6], [1.1, 0xf08a2e]]) kp.sph(-38.3, ky + 0.95, -41 + dz, 0.32, c, { s: [0.6, 1, 1] }); box(-38.7, -37.5, -42.8, -39.2);
    shelf(-29.6, -38.75, Math.PI, 3.4, 3); kp.sph(-29.3, ky + 3.2, -39, 0.22, 0x191214, { s: [1, 0.8, 1.6] }); kp.sph(-29.3, ky + 3.42, -38.72, 0.13, 0x191214); for (const s of [-1, 1]) kp.box(-29.3 + s * 0.25, ky + 3.3, -39, 0.3, 0.04, 0.3, 0xff2238, { ry: s * 0.5, rz: s * 0.4 });
    tapestry(-38.3, -45, F, 2, 2.8, 0xa3182c, 2); painting(-26.7, -39.8, -F, 1.4, 1.2, 0x3a4a6a, 0xa3182c); kp.cyl(-32.5, ptop - 1.4, -44.5, 0.03, 0.03, 1, GOLD, {}, 4); kp.sph(-32.5, ptop - 1.6, -44.5, 0.32, 0xffc45a, { glow: 1 });
    // the regent's chambers: ledgers to the ceiling, the sea chart, a strongbox, everything in grey and in order
    shelf(46.5, -30.9, 0, 9.6, 5, 0); shelf(53.75, -26.5, -F, 6, 5); kp.box(46, ky + 0.02, -22.5, 9, 0.05, 6.5, 0x6a6a72); kp.box(46, ky + 0.03, -22.5, 8, 0.05, 5.5, 0x8a8a92); chair(46, -27.2, 0, 0x55555c); w.circles.push([46, -27.2, 0.55]);
    kp.box(50.5, ky, -17.5, 3.4, 0.85, 2.2, 0x6a6266); kp.box(50.5, ky + 0.85, -17.5, 3.2, 0.06, 2, 0x9ac8e0); for (const [dx, dz, c] of [[-0.9, -0.3, 0x8a8a92], [0.4, 0.4, 0x8a8a92], [1, -0.5, 0x5a5a62], [-0.2, 0.6, 0xa3182c]]) { kp.box(50.5 + dx, ky + 0.93, -17.5 + dz, 0.36, 0.1, 0.14, c); kp.box(50.5 + dx, ky + 1.03, -17.5 + dz, 0.03, 0.3, 0.03, WD); kp.box(50.5 + dx + 0.08, ky + 1.18, -17.5 + dz, 0.16, 0.16, 0.02, 0xf3efe6); } box(48.7, 52.3, -18.7, -16.3);
    kp.box(54.0, ky + 1.5, -22, 0.1, 2.8, 4.4, 0x5a5a62); kp.box(53.93, ky + 1.65, -22, 0.06, 2.5, 4.1, 0xcfd8e0); for (let i = 0; i < 9; i++) kp.sph(53.88, ky + 2 + (i % 3) * 0.7, -23.7 + i * 0.42, 0.07, i % 4 ? 0x8a8a92 : 0xa3182c);
    kp.box(39.2, ky, -17, 1.4, 1, 1, 0x4a4a52); kp.box(39.2, ky + 1, -17, 1.46, 0.12, 1.06, STEEL); kp.box(39.92, ky + 0.5, -17, 0.06, 0.3, 0.2, STEEL); box(38.4, 40, -17.6, -16.4); for (const z of [-20, -24]) { kp.box(38.15, ky + 1.4, z, 0.08, 3.6, 1.5, 0x77777d); kp.box(38.2, ky + 3.6, z, 0.1, 0.7, 0.8, 0x9a9aa2); }
    for (let i = 0; i < 3; i++) { kp.box(44.5 + i * 1.5, ky + 2.6, -14.98, 1.1, 2.6, 0.1, 0x6a6a72); for (let r = 0; r < 5; r++) kp.box(44.5 + i * 1.5, ky + 2.8 + r * 0.45, -15.04, 1, 0.05, 0.06, 0x4a4a52); } candle(47.6, ky + 0.92, -25.3);
    // corridors and the arcade: armour between the windows, portraits of old kings and queens, long runners, fire-lilies
    for (const [x, z, ry] of [[-21, -28, F], [-21, -40, F], [39, -38, -F], [39, -27, -F], [20, -44, 0], [30, -44, 0], [-5, -44, 0], [55, -11, -F], [-53, -11, F], [-53, -42, F]]) armour(x, z, ry);
    [[-13, -44.5, 0, 0x3a2a4a], [-17, -44.5, 0, 0x4a3a2a], [6, -44.5, 0, 0x2a3a4a], [24, -44.5, 0, 0x4a2a3a], [34, -44.5, 0, 0x3a4a3a], [16, -8.05, Math.PI, 0x3a2a4a], [22, -8.05, Math.PI, 0x4a3a2a], [34, -8.05, Math.PI, 0x2a3a4a], [-16, -8.05, Math.PI, 0x4a2a3a], [-48, -8.05, Math.PI, 0x3a4a3a], [39.5, -41, -F, 0x4a3a2a], [-21.5, -34, F, 0x2a3a4a], [-53.5, -22, F, 0x4a2a3a], [-53.5, -47, F, 0x3a2a4a], [55.5, -27, -F, 0x3a4a3a]].forEach(([x, z, ry, c], i) => painting(x, z, ry, 1.5, 1.9, c, [0x8e1b2c, 0x6a4a2a, 0x4a4a6a][i % 3]));
    for (let i = 0; i < 6; i++) { const x0 = 14.5 + i * 4.6, z0 = -21.5 - i * 4.8; kp.box(x0, ky + 0.03, z0, 6.8, 0.05, 2.2, RED, { ry: Math.atan2(4.8, 4.6) }); kp.box(x0, ky + 0.035, z0, 6.8, 0.05, 0.2, GOLD, { ry: Math.atan2(4.8, 4.6) }); }
    kp.box(-17, ky + 0.03, -34, 2.6, 0.05, 20, RED); kp.box(15, ky + 0.03, -40.5, 44, 0.05, 2.4, RED); kp.box(-46, ky + 0.03, -15, 8, 0.05, 2.4, RED); kp.box(47, ky + 0.03, -11, 14, 0.05, 2.2, 0x6a6a72);
    for (const [x, z] of [[-20.5, -24.5], [-13.5, -43.5], [38.5, -9], [13.5, -9], [38.5, -33], [-41.5, -36.5], [-23.5, -9]]) { kp.cyl(x, ky, z, 0.5, 0.38, 0.8, 0xb02a3a, {}, 10); kp.cyl(x, ky + 0.8, z, 0.56, 0.5, 0.1, GOLD, {}, 10); for (let i = 0; i < 5; i++) { kp.cyl(x + Math.cos(i * 1.26) * 0.25, ky + 0.8, z + Math.sin(i * 1.26) * 0.25, 0.025, 0.025, 0.7, 0x4a6a3a, {}, 4); kp.cone(x + Math.cos(i * 1.26) * 0.25, ky + 1.5, z + Math.sin(i * 1.26) * 0.25, 0.14, 0.4, i % 2 ? 0xe2402c : 0xff8a2a); } w.circles.push([x, z, 0.6]); }
    const pg = kp.build(); pg.traverse((o) => { if (o.isMesh) { o.userData.sh = 1; o.castShadow = false; o.receiveShadow = true; } }); g.add(pg); }
  // curtain wall around the plateau, with gates to the town, the garden and the harbour road
  { const RW = 60.5, N = 72, gates = [[0, 0.15], [Math.atan2(-60, 32), 0.1], [Math.atan2(46, 40), 0.1]], gap = (t) => gates.some(([g, hw]) => Math.abs(Math.atan2(Math.sin(t - g), Math.cos(t - g))) < hw);
    for (let i = 0; i < N; i++) { const t = (i + 0.5) / N * Math.PI * 2, x = PL.x + Math.sin(t) * RW, z = PL.z + Math.cos(t) * RW; if (z < -80 || gap(t)) continue; const y = H(x, z) - 2.5, top = y + 9;
      k.box(x, y, z, 5.5, 9, 1.5, IV, { ry: t, c2: 0xfff4e0 }); k.box(x, top, z, 5.6, 0.3, 1.9, 0xe2d3b8, { ry: t }); for (const s of [-1, 0, 1]) k.box(x + Math.cos(t) * s * 1.9, top + 0.3, z - Math.sin(t) * s * 1.9, 1, 0.9, 1.9, IV, { ry: t });
      if (i % 3 === 0) { k.box(x - Math.sin(t) * 0.82, top - 5.2, z - Math.cos(t) * 0.82, 1.3, 3.6, 0.1, RED, { ry: t }); k.box(x - Math.sin(t) * 0.86, top - 3.4, z - Math.cos(t) * 0.86, 0.6, 0.8, 0.1, GOLD, { ry: t }); }
      for (const s of [-1.8, 0, 1.8]) { const cx = x + Math.cos(t) * s, cz = z - Math.sin(t) * s; w.circles.push([cx, cz, 1.15]); w.tall.push([cx, cz, 1.5, top]); } }
    for (const [g, hw] of gates) for (const s of [-1, 1]) { const t = g + s * (hw + 0.035), x = PL.x + Math.sin(t) * RW, z = PL.z + Math.cos(t) * RW, y = H(x, z) - 2.5; k.cyl(x, y, z, 1.9, 2.1, 13, IV, { c2: 0xfff6e6 }, 12); k.cyl(x, y + 13, z, 2.3, 2, 0.8, 0xe2d3b8, {}, 12); k.cone(x, y + 13.8, z, 2.4, 4, 0xb02a3a, { roof: 1 }, 12); k.sph(x, y + 18, z, 0.25, GOLD); k.box(x - Math.sin(t) * 1.95, y + 7, z - Math.cos(t) * 1.95, 0.7, 1.6, 0.2, 0xffc66a, { glow: 1, ry: t }); w.circles.push([x, z, 2.2]); w.tall.push([x, z, 2.3, y + 13]); }
    for (const [g, hw] of gates) { const x = PL.x + Math.sin(g) * RW, z = PL.z + Math.cos(g) * RW, y = H(x, z); k.box(x, y + 6.2, z, RW * hw * 2 + 1, 2.4, 1.7, IV, { ry: g }); k.box(x, y + 8.6, z, RW * hw * 2 + 1.4, 0.35, 2.1, GOLD, { ry: g }); k.box(x - Math.sin(g) * 0.95, y + 6.6, z - Math.cos(g) * 0.95, 1.6, 1.6, 0.12, RED, { ry: g }); k.sph(x - Math.sin(g) * 1.02, y + 7.4, z - Math.cos(g) * 1.02, 0.4, GOLD, { s: [1, 1, 0.3], ry: g }); } }
  // courtyard: the avenue to the keep, fire basins, planters
  for (let z = -16; z <= 24; z += 8) for (const s of [-1, 1]) { brazier(s * 5.5, z); k.cone(s * 5.5, ky + 1.5, z, 0.42, 1, LAVA, { glow: 1 }); }
  for (const s of [-1, 1]) { const x = s * 17, z = 8; k.cyl(x, ky, z, 3.4, 3.6, 0.8, IV, {}, 16); k.cyl(x, ky + 0.5, z, 3, 3, 0.25, LAVA, { glow: 1 }, 16); k.cyl(x, ky, z, 0.7, 0.9, 2.2, IV, {}, 10); k.cyl(x, ky + 2.2, z, 1.3, 0.6, 0.4, GOLD, {}, 10); k.cone(x, ky + 2.6, z, 0.7, 1.7, 0xffb030, { glow: 1 }); w.circles.push([x, z, 3.8]);
    for (const dz of [-14, 14]) { k.box(x, ky, z + dz, 3, 0.9, 3, IV); k.box(x, ky + 0.9, z + dz, 3.3, 0.2, 3.3, GOLD); if (NAT) sc.add('CommonTree_2', x, ky + 0.9, z + dz, s + dz, 0.7, 0xc8281e); else k.sph(x, ky + 3, z + dz, 1.6, 0xc8281e); w.circles.push([x, z + dz, 2.2]); } }
  // window arch (east)
  for (const s of [-1, 1]) pillar(31, -4 + s * 3.2, 6, 0.5); k.box(31, ky + 6, -4, 1, 0.8, 8, GOLD); k.box(31.4, ky, -4, 0.4, 1, 5.6, IV); box(31, 31.8, -7, -1);
  // regent's chambers (cool gray, shutters half closed)
  k.box(46, ky, -31.5, 16, 5, 0.6, 0xb9b6b8); box(38, 54, -32, -31); k.box(54.3, ky, -23, 0.6, 5, 17, 0xb9b6b8); box(54, 54.8, -32, -14.5); k.box(37.7, ky, -27, 0.6, 5, 9, 0xb9b6b8); box(37.4, 38, -32, -22.5);
  k.box(46, ky, -25.5, 7, 0.9, 1.8, 0x6a6266); box(42.5, 49.5, -26.4, -24.6); for (let i = -3; i <= 3; i++) k.box(46 + i * 0.9, ky + 0.9, -25.5, 0.6, 0.04, 1.2, 0xf3efe6);
  k.box(53.2, ky, -19, 1.2, 1.6, 2.4, 0x5a4a44); box(52.6, 54, -20.4, -17.6); k.box(40, ky, -29.4, 3.4, 3, 0.9, 0x5a4a44); box(38.2, 41.8, -30, -28.8); k.cyl(41, ky + 1.6, -29.3, 0.18, 0.18, 0.35, 0x9ac8f0);
  k.box(50, ky + 1.5, -31.1, 3, 2.4, 0.2, 0x7a8088);
  // hall of learning + archive
  for (const [x, z] of [[-40, -8], [-28, -8], [-40, -20], [-22, -20]]) pillar(x, z, 5.5);
  k.box(-41, ky, -14, 0.5, 5, 12, IV); box(-41.4, -40.6, -20, -8); k.box(-40.6, ky + 1.6, -14, 0.15, 2.6, 6, 0xe8d5a8); k.box(-40.5, ky + 2, -13, 0.1, 1.2, 2.5, 0xb9905a);
  k.box(-36, ky, -15, 2.2, 0.9, 4, 0x6b4a36); box(-37.2, -34.8, -17.2, -12.8); k.box(-36, ky + 0.9, -15, 1.8, 0.05, 3.2, 0xe8d5a8);
  for (let i = 0; i < 3; i++) { k.box(-50, ky, -26 - i * 3.2, 1, 3.4, 2.6, 0x6b4a36); box(-50.6, -49.4, -27.4 - i * 3.2, -24.6 - i * 3.2); k.box(-49.4, ky + 1.2, -26 - i * 3.2, 0.2, 1.6, 2.2, [0xa3182c, 0xe2b24a, 0x3a6a8a][i]); }
  k.box(-45, ky, -31, 2.4, 0.9, 1.6, 0x6b4a36); box(-46.3, -43.7, -31.9, -30.1); k.box(-45, ky + 0.9, -31, 0.9, 0.2, 0.6, 0xb9905a);
  // Amber's room
  for (const [x, z] of [[-38, -39], [-27, -39], [-38, -50], [-27, -50]]) pillar(x, z, 5, 0.4);
  k.box(-35.4, ky, -44, 1.4, 0.9, 2.4, 0x6b4a36); box(-36.2, -34.6, -45.3, -42.7); k.sph(-35.4, ky + 1.15, -44.6, 0.16, 0xffd060, { glow: 1 });
  k.box(-32, ky, -49.5, 4, 0.7, 2, 0x8e1b2c); box(-34, -30, -50.6, -48.4); k.box(-27.2, ky + 1.2, -45, 0.2, 2, 0.2, GOLD); k.box(-27.5, ky + 1.3, -45, 0.15, 1.5, 0.9, RED);
  // dragon terraces
  for (const [mx, mz, r, , mh] of mounds) { const y = ky + mh; k.cyl(mx, y - 0.05, mz, r, r, 0.15, 0xead9b8, {}, 20); k.torus(mx, y + 1, mz, r, 0.1, GOLD, { rx: Math.PI / 2 }); for (let a = 0; a < 16; a++) { if (Math.abs(a - 4) < 2 && mx < 0) continue; k.cyl(mx + Math.cos(a * 0.3927) * r, y, mz + Math.sin(a * 0.3927) * r, 0.07, 0.07, 1, GOLD, {}, 5); } }
  const ty = ky + 5; for (const s of [-1, 1]) { k.box(-13.5 + s * 1.3, ty, -58.2, 0.8, 1.5, 0.8, 0x16121a); w.circles.push([-13.5 + s * 1.3, -58.2, 0.6]); } k.cyl(-13.5, ty, -58.2, 0.7, 0.5, 0.8, 0x16121a);
  for (const [x, z] of [[-24, -57], [-12, -66]]) { k.cyl(x, ty, z, 0.9, 0.7, 0.8, 0x7a5a4a); k.cone(x, ty + 0.8, z, 0.7, 1, 0xc0202c); }
  // arcade (ch13) + long window
  for (let i = 0; i < 6; i++) pillar(13 + i * 4.6 + 1.6, -22 - i * 4.8 + 1.6, 5, 0.38);
  for (const p of ['t1', 't2', 't3', 't4']) torch(P[p][0], P[p][1]);
  k.box(27.6, ky, -35.4, 0.12, 3.6, 0.5, 0x7a5a3a, { rz: 0.16 }); k.box(28.4, ky, -35.4, 0.12, 3.6, 0.5, 0x7a5a3a, { rz: 0.16 });
  k.box(39, ky, -48.5, 8, 1.1, 0.6, IV, { ry: 0.7 }); for (const s of [-1, 1]) k.box(39 + s * 2.6, ky, -48.5 + s * 2.2, 0.6, 5, 0.6, IV); k.box(39, ky + 5, -48.5, 8, 0.6, 0.7, GOLD, { ry: 0.7 }); w.circles.push([39, -48.5, 1.6], [36.6, -50.6, 1.2], [41.4, -46.4, 1.2]);
  // queen's garden
  for (let a = 0; a < 20; a++) { if (a > 2 && a < 5) continue; const x = -80 + Math.cos(a * 0.314) * 13, z = 9 + Math.sin(a * 0.314) * 13; k.box(x, 0, z, 4.2, 1.1, 0.6, IV, { ry: -a * 0.314 + Math.PI / 2 }); w.circles.push([x, z, 1.4]); }
  { // the queen: a real figure in pale stone on a stepped plinth, a stone flame in her open palm, a candle at her feet
    k.cyl(-85, 0, 5, 2.1, 2.3, 0.45, IV, {}, 16); k.cyl(-85, 0.45, 5, 1.6, 1.75, 0.45, 0xfaf3e6, {}, 16); k.cyl(-85, 0.9, 5, 1.15, 1.25, 0.5, IV, {}, 12); k.box(-85, 1.0, 6.22, 1.3, 0.3, 0.06, GOLD); k.sph(-84.1, 0.58, 6.3, 0.1, 0xffd060, { glow: 1 }); k.cyl(-84.1, 0.45, 6.3, 0.05, 0.05, 0.12, 0xfff1d6); w.circles.push([-85, 5, 2.3]);
    try { const st = makePerson({ name: 'Queen', style: 'woman', hairLong: 2, hair: 0xe9e2d6, skin: 0xe9e2d6, top: 0xe9e2d6, skirt: 0xe9e2d6, trim: 0xe9e2d6 }), stone = new THREE.MeshStandardMaterial({ color: 0xe9e2d6, roughness: 0.88, metalness: 0 });
      const u = st.userData; if (u.mixer) { u.play?.('Wave', 0); u.mixer.setTime(0.9); } st.traverse((o) => { if (o.isMesh) { o.material = stone; o.castShadow = true; o.frustumCulled = false; } });
      st.scale.multiplyScalar(1.75); st.position.set(-85, 1.4, 5); st.rotation.y = 0.9; g.add(st);
      const fl = new THREE.Group(); fl.add(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 8), stone), new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), stone)); fl.children[0].position.y = 0.3; fl.children[1].position.y = 0.05; let hand = null; st.traverse((o) => { if (o.isBone && o.name === 'WristR') hand = o; else if (o.isBone && /Wrist.?R/.test(o.name) && !hand) hand = o; }); if (hand) { fl.scale.setScalar(0.55); fl.position.set(0, 0.1, 0); hand.add(fl); }
    } catch (e) { k.cyl(-85, 1.4, 5, 0.42, 0.6, 1.9, 0xfaf3e6); k.sph(-85, 3.6, 5, 0.34, 0xfaf3e6); } }
  for (let i = 0; i < 40; i++) { const a = R() * 6.28, d = 3 + R() * 9, x = -80 + Math.cos(a) * d, z = 9 + Math.sin(a) * d; k.cone(x, 0.3, z, 0.18, 0.5, i % 3 ? 0xe2402c : 0xff8a2a); k.cyl(x, 0, z, 0.03, 0.03, 0.4, 0x4a6a3a, {}, 4); }
  for (let i = 0; i < 9; i++) k.box(-56 - i * 1.5, PL.h * (1 - (i + 1) / 9) * 0.9, 0 + i * 0.5, 1.6, 0.5, 5, IV, { ry: 0.3 });
  // crimson vines / trees
  for (let i = 0; i < 26; i++) { const a = R() * 6.28, d = 66 + R() * 14, x = PL.x + Math.cos(a) * d, z = PL.z + Math.sin(a) * d; if (z < -84 || (Math.abs(x) < 10 && z > 0)) continue; const y = H(x, z), rr = R(); if (NAT) sc.add(['CommonTree_1', 'CommonTree_2', 'CommonTree_3'][i % 3], x, y - 0.1, z, rr * 6, 0.9 + rr * 0.5, rr > 0.5 ? 0xc8281e : 0xa31a30); else { k.cyl(x, y, z, 0.25, 0.35, 2.6, 0x3a2622); k.sph(x, y + 3.6, z, 1.9, rr > 0.5 ? 0xb3261e : 0x8e1b2c, { s: [1, 0.8, 1] }); } w.circles.push([x, z, 0.5]); }
  if (NAT) { for (let i = 0; i < 26; i++) { const a = R() * 6.28, d = 3 + R() * 8, x = -80 + Math.cos(a) * d, z = 9 + Math.sin(a) * d; if (Math.hypot(x + 85, z - 5) < 2.5) continue; sc.add(i % 3 ? 'Flower_3_Group' : 'Bush_Common_Flowers', x, 0, z, R() * 6, 0.7 + R() * 0.4, i % 2 ? 0xe2402c : 0xff8a2a); } for (const [x, z] of [[-95, 20], [-66, 22], [-98, -4]]) { sc.add('TwistedTree_2', x, H(x, z) - 0.2, z, R() * 6, 0.55, 0xb3261e); w.circles.push([x, z, 0.9]); } for (let i = 0; i < 14; i++) { const x = -120 + R() * 240, z = -20 + R() * 120; const [cx, cz] = [x, z]; if (Math.hypot(x, z + 30) < 80 || Math.abs(x) < 70 && z > 40 || x > 76) continue; sc.add(i % 2 ? 'DeadTree_1' : 'DeadTree_2', x, H(x, z) - 0.2, z, R() * 6, 0.7 + R() * 0.4); w.circles.push([x, z, 0.6]); } }
  // lava rivers, bridge, glowing seams up the mountain path
  const lava = (x0, z0, x1, z1, wd) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 6); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t); k.box(x, H(x, z) - 0.2, z, wd, 0.34, 6.4, i % 2 ? LAVA : 0xffa02a, { glow: 1, ry: Math.atan2(x1 - x0, z1 - z0) }); } };
  lava(82, -100, 82, 110, 3.4); box(80, 84, -100, 28); box(80, 84, 41, 112); k.box(82, 0.1, 34.5, 7, 0.5, 13, IV); for (const s of [-1, 1]) k.box(82, 0.6, 34.5 + s * 6.2, 7, 0.9, 0.5, GOLD);
  lava(-112, -110, -112, 112, 4); box(-114.5, -109.5, -110, 112); lava(-112, -110, -60, -200, 3); lava(82, -100, 110, -200, 3);
  for (let i = 0; i < 16; i++) { const t = i / 15, x = lerp(0, 26, t) + Math.sin(t * 9) * 2.2, z = lerp(-97, -148, t); k.box(x, H(x, z) + 0.03, z, 0.5, 0.08, 2.6, LAVA, { glow: 1, ry: 0.4 + Math.sin(i) }); }
  for (let i = 0; i < 40; i++) { const x = -140 + R() * 280, z = -105 - R() * 80; if (Math.hypot(x - 26, z + 150) < 16 || Math.abs(x - lerp(0, 26, (-97 - z) / 51)) < 6) continue; const y = H(x, z), s = 1.5 + R() * 3, rr = R(); if (NAT) sc.add(['Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3'][i % 3], x, y - 0.3, z, rr * 6, s * 0.9); else k.cone(x, y - 0.5, z, s, s * 2, 0x33262a, { ry: rr * 3 }, 5); w.circles.push([x, z, s * 0.75]); }
  // volcano
  k.cone(-120, 20, -300, 110, 150, 0x2e2226, {}, 9); k.cyl(-120, 160, -300, 14, 22, 12, 0xff6a1a, { glow: 1 }, 9); k.sph(-120, 196, -300, 26, 0x6a5058, { s: [1, 0.7, 1] }); k.sph(-100, 226, -296, 34, 0x7a6068, { s: [1, 0.6, 1] });
  for (const [x, z, s] of [[150, -280, 90], [30, -330, 110], [-230, -200, 80], [230, -160, 70]]) k.cone(x, 0, z, s, s * 1.1, 0x3a2a30, {}, 7);
  // harbor
  k.box(122, -3, 34, 34, 3.5, 36, 0x9a8a78); for (let i = 0; i < 5; i++) { k.cyl(138.5, 0.5, 20 + i * 7, 0.3, 0.3, 1, 0x4a3a34); }
  for (const [x, z] of [[108, 23], [114, 23], [108, 29], [114, 29]]) k.cyl(x, 0.5, z, 0.1, 0.1, 3.2, 0x6b4a36); k.box(111, 3.7, 26, 7.4, 0.2, 7.4, RED); k.box(111, 0.5, 26, 1.4, 1, 1.4, 0x6b2a2a);
  ship(k, 175, 0, 0, 0x5a5a62, 0x8b8b92); ship(k, 182, 0, 60, 0x5a5a62, 0x8b8b92, 0.3); ship(k, 190, 0, -55, 0x5a5a62, 0x8b8b92, -0.2);
  for (let i = 0; i < 5; i++) { if (KIT) kitHouse(sc, k, w, 96 + i * 10.5, 64 + (i % 2) * 5, 6, i % 2 ? 6 : 8, Math.PI, glassCols[i]); else house(98 + i * 9, 62 + (i % 2) * 6, 7, 6, 4 + i % 3, glassCols[i]); }
  // standing torches Amber can light after dark: down the market lane, round the Fire Square, across the court, along the harbour road
  w.torches = [[-9, 46], [9, 46], [-9, 56], [9, 62], [-9, 68], [-19, 80], [19, 80], [-19, 92], [19, 92], [-8, 104], [8, 104], [-12, 24], [12, 24], [-22, 10], [22, 10], [-30, -2], [30, 2], [-9, -3], [9, -3], [-40, 20], [44, 22], [60, 30], [96, 36], [112, 40], [-70, 6], [-90, 16], [-14, -70], [20, -70], [-6, -84], [6, -84]]
    .filter(([x, z]) => !w.circles.some((c) => Math.hypot(c[0] - x, c[1] - z) < c[2] + 0.6) && !w.boxes.some((q) => x > q[0] - 0.6 && x < q[1] + 0.6 && z > q[2] - 0.6 && z < q[3] + 0.6))
    .map(([x, z]) => { const y = H(x, z); k.cyl(x, y, z, 0.28, 0.34, 0.3, 0x5a4a44, {}, 8); k.cyl(x, y + 0.3, z, 0.08, 0.1, 2.3, 0x4a3226, {}, 6); k.cyl(x, y + 2.6, z, 0.3, 0.14, 0.4, GOLD, {}, 8); k.torus(x, y + 2.95, z, 0.3, 0.035, 0x3a2a24, { rx: Math.PI / 2 }); w.circles.push([x, z, 0.35]); return { x, z, y: y + 3.0, lit: false }; });
  g.add(k.build()); g.add(sc.build());
  // visiting Sugarland ship (ch16+)
  const k2 = new Kit(); ship(k2, 146, 0, 36, 0xf7a8c8, 0xfff1d6, 0, 0xff8ab8); k2.box(146, 2, 36, 5.4, 0.5, 16.4, 0xffffff); const visitor = k2.build(); g.add(visitor);
  // perched council dragons
  const dragons = perch.map(([x, y, z], i) => { const d = makeDragon([0x3aa0ff, 0x3ae08a][i]); d.position.set(x, y + 1.6, z); d.rotation.y = i ? -0.8 : 0.9; d.scale.setScalar(0.8); g.add(d); return d; });
  w.tick = (t, dt, G) => { for (const d of dragons) animDragon(d, dt, false); visitor.visible = !!(G.f.c16_ship || G.S.ch > 16); };
  return w;
}

// ═══════════════════════════ SUGARLAND ═══════════════════════════
export function buildSugar() {
  const w = { name: 'sugar', doors: [], circles: [], boxes: [], bounds: [-150, 156, -170, 168], edge: 215 };
  w.bouncers = [[106, 36, 4, 1.2], [112, 31, 4, 3.5], [118, 26, 4, 5.8], [123.5, 30.5, 4, 8.1], [128, 22, 4.6, 10.4],
    [98, 24, 3.5, 1.1], [102, 44, 3.6, 1.2], [116, 44, 4, 1.3], [94, 36, 3, 1.0], [124, 40, 3.4, 1.2], [110, 18, 3.4, 1.1], [134, 34, 3.6, 1.2], [120, 12, 3.6, 1.2]];
  const base = (x, z) => {
    let h = 1.3 * noise2(x * 0.035, z * 0.035) + 0.5 * noise2(x * 0.1, z * 0.1) - 0.5;
    h *= smooth(10, 40, Math.hypot(x, z - 20) - 20) * 0.8 + 0.2;
    h -= 2.6 * smooth(27, 16, Math.hypot(x + 116, z - 20));
    h += 10 * smooth(20, 5, Math.hypot(x + 58, z - 154));
    const m = smooth(-100, -172, z) * 53 + smooth(-118, -160, z) * (noise2(x * 0.05, z * 0.05) - 0.4) * 14 * smooth(16, 44, Math.abs(x));
    h += m; h = lerp(h, 49.5, smooth(15, 8, Math.hypot(x, z + 160)));
    h -= smooth(160, 172, x) * 6 * (1 - smooth(4, 2, Math.abs(z - 100)) * (x < 168 ? 1 : 0));
    return h;
  };
  w.height = (x, z, bare) => { let h = base(x, z); if (!bare && x > 88 && x < 140) for (const [bx, bz, r, top] of w.bouncers) if ((x - bx) ** 2 + (z - bz) ** 2 < r * r) h = Math.max(h, base(bx, bz) + top); return h; };
  w.P = {
    clearing: [0, 140], clearing_ruby: [9, 147], clearing_rock: [3.5, 141], bun_stone: [-6, 133], lake_shore: [-21, 127], lake_ruby: [-17, 134], cave: [-43, 142], cave_ruby: [-40, 138],
    forest_path: [0, 114], forest_mid: [0, 127], signpost: [0, 62], signpost_kim: [3, 59.5], praline: [-15, 44], mint: [7, 40], ribbon: [-7, 30], kids: [5, 33], inn: [18, 54],
    market: [0, 14], tart: [8, 9.5], fountain: [0, 23], balloon_gate: [-22, 2], balloon: [-36, -4], gift_boy: [-4.5, 26], gift_girl: [4.5, 27], gift_cider: [-8, 7], gift_trees: [3, 104],
    workshop: [34, -3], workshop_door: [34, 7], wtable: [34, -5], wwindow: [28, -9], wshelf: [40, -9], wcat: [39, -2.5], workshop_s: [30.5, -1], workshop_t: [37, -10],
    house_door: [60, -8], house_s: [56, -18], house_t: [63, -16], cradle: [64, -27.5], cradle_a: [62, -26], cradle_b: [66, -26], cradle_s: [59.5, -28.5], cradle_t: [68, -28.5], garden_herbs: [74, -16],
    lava: [29, 10], marsh: [39, 10], meadows: [100, 34], mound_top: [128, 22], lift: [0, -92], lift_cider: [6, -89], summit: [0, -160], summit_sled: [4.5, -158],
    boat: [72, -56], choc_shore: [-93, 24], turtle: [-98.5, 21.5], bench: [-92, 40], bench1: [-93.2, 41.5], bench2: [-90.8, 41.5], dock: [150, 100], dock_s: [146, 97.5], dock_t: [148.5, 102.5],
  };
  const g = (w.group = new THREE.Group()), k = new Kit(), P = w.P, H = w.height, R = rnd(11), sc = new Scatter(), NAT = hasModel('CommonTree_1');
  g.add(terrain(w, [-260, 260, -280, 240], 210, (x, z, h) => {
    if (z < -104) { const cap = h > 40 + 6 * noise2(x * 0.1, z * 0.1); return x < -46 ? (cap ? 0xff9ec0 : 0xffc4d8) : x > 46 ? (cap ? 0x7a4a30 : 0xc79a78) : (cap ? 0xfff0c0 : 0xfffaf0); }
    if (Math.hypot(x + 116, z - 20) < 30) return 0xecd2a0;
    if (x > 86 && x < 142 && z > 4 && z < 54) return noise2(x * 0.2, z * 0.2) > 0.5 ? 0xfff2f6 : 0xffe0ea;
    if (Math.abs(x + Math.sin(z * 0.05) * 2) < 2.6 && z > -20 && z < 136) return 0xfbe8c8;
    if (Math.hypot(x, z - 16) < 22) return (Math.floor(x / 3) + Math.floor(z / 3)) % 2 ? 0xffe8ee : 0xfff6dc;
    if (z > 96) return noise2(x * 0.1, z * 0.1) > 0.5 ? 0xa8e0b8 : 0x98d8ac;
    return noise2(x * 0.08, z * 0.08) > 0.55 ? 0xc4f0c0 : 0xb4e8b8;
  }, (x, z) => { // grass, sand, snow, paving
    const snow = Math.max(smooth(-100, -108, z), smooth(84, 90, x) * smooth(144, 138, x) * smooth(2, 8, z) * smooth(56, 50, z));
    const pave = smooth(24, 20, Math.hypot(x, z - 16)) * (1 - snow);
    const sand = Math.max(smooth(32, 27, Math.hypot(x + 116, z - 20)), smooth(3.4, 2.2, Math.abs(x + Math.sin(z * 0.05) * 2)) * smooth(-22, -18, z) * smooth(138, 134, z), smooth(156, 160, x)) * (1 - snow) * (1 - pave);
    return [Math.max(0, 1 - snow - pave - sand), sand, snow, pave];
  }, [{ id: 'leafy_grass', scale: 0.22, rough: 0.95, chroma: 0.25 }, { id: 'coast_sand_01', scale: 0.2, rough: 0.9, chroma: 0.4 }, { id: 'snow_02', scale: 0.12, rough: 0.6, chroma: 0.3 }, { id: 'patterned_paving', scale: 0.28, rough: 0.6, chroma: 0.3 }]));
  w.grassMask = (x, z) => { if (z < -98 || x > 158 || (x > 86 && x < 142 && z > 4 && z < 54)) return 0; if (Math.hypot(x, z - 16) < 25 || Math.hypot(x + 116, z - 20) < 31 || Math.hypot(x + 32, z - 124) < 11.5 || Math.hypot(x - 84, z + 66) < 16) return 0; if (Math.abs(x + Math.sin(z * 0.05) * 2) < 3.6 && z > -22 && z < 138) return 0; if (x > 25 && x < 72 && z > -33 && z < 3) return 0; return 0.75 + 0.5 * noise2(x * 0.2, z * 0.2); };
  g.add(ocean(0x8fd4ea, -2.4));
  g.add(water(-32, 124, 10.5, H(-32, 124) + 0.25, 0xff9ec4, 0.9), water(-116, 20, 19, -1.9, 0x4a2814, 1, 0.22), water(84, -66, 15, H(84, -66) + 0.3, 0x8ad8f5, 0.85), water(0, 23, 2.3, H(0, 23) + 0.75, 0xff7aa8, 0.9));
  w.circles.push([-32, 124, 9.6], [-116, 20, 17.5], [84, -66, 14.2], [0, 23, 2.8]);
  const box = (x0, x1, z0, z1) => w.boxes.push([x0, x1, z0, z1]);
  const cane = (x, z, s = 1, gold) => { const y = H(x, z); k.cyl(x, y, z, 0.3 * s, 0.36 * s, 5 * s, 0xffffff); for (let i = 0; i < 4; i++) k.cyl(x, y + (0.5 + i * 1.2) * s, z, 0.33 * s, 0.38 * s, 0.5 * s, 0xe8344a, { ry: i }); k.sph(x, y + 6 * s, z, 2.1 * s, gold ? 0xf5c84a : (R() > 0.5 ? 0xbff0d0 : 0xa8e8c4), { s: [1, 0.75, 1] }); k.sph(x + 0.9 * s, y + 6.6 * s, z + 0.5 * s, 1.1 * s, gold ? 0xffe08a : 0xe0fbe8); w.circles.push([x, z, 0.55 * s]); };
  const cakeHouse = (x, z, r, h, wall, roof, ry = 0) => { const y = H(x, z); k.cyl(x, y, z, r, r * 1.04, h, wall, {}, 12); k.cyl(x, y + h, z, r * 1.12, r * 1.12, 0.5, 0xffffff, {}, 12); k.sph(x, y + h + 0.4, z, r * 1.05, roof, { s: [1, 0.55, 1] }); k.sph(x, y + h + r * 0.6 + 0.3, z, 0.42, 0xe8243c); for (let a = 0; a < 8; a++) k.sph(x + Math.cos(a * 0.785) * r * 1.1, y + h - 0.1, z + Math.sin(a * 0.785) * r * 1.1, 0.4, 0xffffff); k.box(x + Math.sin(ry) * r, y, z + Math.cos(ry) * r, 1.3, 2.2, 0.3, 0x9a5a3a, { ry }); k.box(x + Math.sin(ry + 0.7) * r, y + 1.4, z + Math.cos(ry + 0.7) * r, 1, 1, 0.3, 0xfff3a8, { ry: ry + 0.7, glow: 1 }); w.circles.push([x, z, r + 0.3]);
    const sx = Math.sin(ry), sz = Math.cos(ry); k.box(x + sx * (r + 0.55), y + 2.5, z + sz * (r + 0.55), 2.2, 0.18, 1.3, roof, { ry, rx: 0.25 }); k.box(x + sx * (r + 1.15), y + 2.32, z + sz * (r + 1.15), 2.2, 0.3, 0.1, 0xffffff, { ry });
    k.box(x + Math.sin(ry - 0.7) * r, y + 1.4, z + Math.cos(ry - 0.7) * r, 1, 1, 0.3, 0xfff3a8, { ry: ry - 0.7, glow: 1 }); for (const s of [0.7, -0.7]) { const bx = x + Math.sin(ry + s) * (r + 0.25), bz = z + Math.cos(ry + s) * (r + 0.25); k.box(bx, y + 0.75, bz, 1.2, 0.25, 0.35, 0xc98a5a, { ry: ry + s }); for (let i = -1; i <= 1; i++) k.sph(bx + Math.cos(ry + s) * i * 0.35, y + 1.08, bz - Math.sin(ry + s) * i * 0.35, 0.15, [0xff7aa8, 0xfff3a8, 0xb48aff][i + 1]); }
    k.cyl(x - sx * r * 0.45, y + h + r * 0.35, z - sz * r * 0.45, 0.4, 0.45, 1.6, wall, {}, 8); k.sph(x - sx * r * 0.45, y + h + r * 0.35 + 2.1, z - sz * r * 0.45, 0.5, 0xffffff); k.sph(x - sx * r * 0.45 + 0.3, y + h + r * 0.35 + 2.8, z - sz * r * 0.45, 0.36, 0xffffff);
    for (let i = 1; i <= 3; i++) k.cyl(x + sx * (r + 0.6 + i * 1.1), y + 0.03, z + sz * (r + 0.6 + i * 1.1), 0.42, 0.42, 0.07, [0xffd0e0, 0xfff3c8, 0xd0ecff][i - 1], {}, 10);
    w.doors.push({ x: x + sx * (r + 1.5), z: z + sz * (r + 1.5), seed: Math.abs(Math.round(x * 7 + z * 13)) }); };
  const stall = (x, z, c) => { const y = H(x, z); k.box(x + 2.4, y, z, 1.6, 1, 4.2, 0xfff1d6); k.box(x + 2.4, y + 2.6, z, 2.8, 0.25, 4.8, c, { rz: 0.1 }); k.box(x + 2.4, y + 2.75, z, 0.5, 0.26, 4.8, 0xffffff, { rz: 0.1 }); for (const s of [-1, 1]) k.cyl(x + 2.4, y, z + s * 2, 0.08, 0.08, 2.6, 0xffffff); w.circles.push([x + 2.4, z, 1.5]); };
  // peppermint forest
  for (let i = 0; i < 150; i++) { const x = -100 + R() * 200, z = 98 + R() * 72; if (Math.abs(x) < 5 && z < 132) continue; if (Math.hypot(x, z - 140) < 15 || Math.hypot(x + 32, z - 124) < 13 || Math.hypot(x + 56, z - 152) < 17 || Math.hypot(x + 43, z - 141) < 5 || Math.hypot(x - 3, z - 104) < 3) continue; cane(x, z, 0.8 + R() * 0.6, Math.hypot(x, z - 140) < 24 && R() > 0.3); }
  for (let i = 0; i < 5; i++) cane(-47 + i * 1.7 + (i > 1 ? 3 : 0), 139 - i * 0.3 + (i > 1 ? 2 : 0), 0.7);
  { // Ruby's cave: a rock face with a dark mouth, hanging stone, glowing sugar crystals and a nest
    const mx = -47.5, mz = 146, ax = 0.68, az = -0.73, px = -az, pz = ax, y = H(mx, mz), rock = [0xcfc6cc, 0xb9b0b8, 0xa69ca6, 0xd9d0d2];
    for (const [f, s, up, r] of [[-2.4, 0, 3, 6.5], [-3.5, -4.5, 2, 5.5], [-3.5, 4.5, 2.2, 5.6], [-5.5, 0, 5, 7], [-1.2, -6.5, 0.6, 3.6], [-1.2, 6.6, 0.8, 3.8], [-7, -5, 3, 5.5], [-7, 5.5, 3.4, 5.4]]) k.sph(mx + ax * f + px * s, y + up, mz + az * f + pz * s, r, rock[Math.abs(Math.round(f + s)) % 4], { s: [1, 0.82, 1] });
    k.sph(mx + ax * 0.4, y + 1.3, mz + az * 0.4, 3.5, 0x120c12, { s: [1.05, 0.95, 1.05] }); k.sph(mx - ax * 1.6, y + 1.4, mz - az * 1.6, 4.2, 0x0a070a);
    for (let i = 0; i < 11; i++) { const t = -0.15 + i / 10 * (Math.PI + 0.3), s = Math.cos(t) * 4.1, up = Math.sin(t) * 4.3, r = 1.25 + (i % 3) * 0.28; k.sph(mx + ax * 1.5 + px * s, y + 0.6 + up, mz + az * 1.5 + pz * s, r, rock[i % 4], { s: [1, 0.9, 1] }); }
    for (const [s, up, l] of [[-2.2, 3.6, 1.5], [-0.9, 4.5, 2.1], [0.4, 4.6, 1.3], [1.6, 4.1, 1.9], [2.6, 3.2, 1.1]]) k.cone(mx + ax * 1.4 + px * s, y + up - l, mz + az * 1.4 + pz * s, 0.3, l, 0xd9d0d2, { rx: Math.PI }, 6);
    for (const [f, s, l] of [[2.3, -3.3, 1.3], [2.8, -2.6, 0.8], [2.2, 3.4, 1.5], [2.9, 2.8, 0.9]]) k.cone(mx + ax * f + px * s, y - 0.1, mz + az * f + pz * s, 0.34, l, 0xcfc6cc, {}, 6);
    for (const [f, s, up, c] of [[0.6, -2.4, 0.3, 0xff8ad0], [0.2, -2.8, 0.9, 0xc9a0ff], [0.5, 2.5, 0.4, 0xffd27a], [0.1, 2.9, 1.1, 0xff8ad0], [-0.4, -1.2, 0.1, 0x9ad8ff], [-0.6, 1.4, 0.2, 0xc9a0ff], [0.9, 0.2, 3.6, 0xffd27a]]) { k.cone(mx + ax * f + px * s, y + up, mz + az * f + pz * s, 0.22, 0.75, c, { glow: 1, rz: s * 0.12 }, 5); k.cone(mx + ax * f + px * (s + 0.25), y + up, mz + az * f + pz * (s + 0.25), 0.14, 0.45, c, { glow: 1, rz: -0.3 }, 5); }
    for (const [f, s, r] of [[4.5, -4.6, 1.1], [5.6, 4.4, 0.9], [7, -3.2, 0.6], [3.8, 5.6, 1.3]]) { const x = mx + ax * f + px * s, z = mz + az * f + pz * s; if (NAT) sc.add(['Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3'][Math.round(r * 10) % 3], x, H(x, z) - 0.2, z, f, r); else k.sph(x, H(x, z) + r * 0.4, z, r, rock[1], { s: [1, 0.7, 1] }); w.circles.push([x, z, r * 0.9]); }
    for (const [f, s, up] of [[1.2, -3.6, 4.6], [1, 3.4, 4.9], [0.6, 0, 5.9], [-1, -5, 5.2], [-1, 5.2, 5.4]]) { k.sph(mx + ax * f + px * s, y + up, mz + az * f + pz * s, 1.25, 0x8fd8a8, { s: [1.3, 0.45, 1.1] }); k.cyl(mx + ax * (f + 0.7) + px * s, y + up - 1.5, mz + az * (f + 0.7) + pz * s, 0.05, 0.05, 1.5, 0x6fc08a, {}, 4); }
    const [nx, nz] = P.cave_ruby, ny = H(nx, nz); k.torus(nx, ny + 0.25, nz, 3, 0.5, 0xe0c88a, { rx: Math.PI / 2 }); k.torus(nx, ny + 0.5, nz, 2.7, 0.3, 0xd0b070, { rx: Math.PI / 2 }); k.cyl(nx, ny + 0.02, nz, 2.9, 2.9, 0.12, 0xead8a8, {}, 16); for (let i = 0; i < 14; i++) k.box(nx + Math.cos(i * 0.9) * 3, ny + 0.3, nz + Math.sin(i * 0.9) * 3, 1.3, 0.07, 0.07, 0xc9a85a, { ry: i * 1.7, rz: 0.3 });
    for (const [dx, dz, c] of [[3.9, 1.2, 0xc9a0dc], [4.3, 0.2, 0xfff1d6], [-3.8, -1.6, 0xf7a8c8]]) { k.box(nx + dx, ny, nz + dz, 0.7, 0.45, 0.7, c); k.box(nx + dx, ny + 0.45, nz + dz, 0.74, 0.06, 0.16, 0xffffff); }
    w.circles.push([mx - ax * 2.5, mz - az * 2.5, 6], [mx + ax * 1.5 + px * 4.2, mz + az * 1.5 + pz * 4.2, 1.5], [mx + ax * 1.5 - px * 4.2, mz + az * 1.5 - pz * 4.2, 1.5]); }
  k.sph(3.5, H(3.5, 142.4) + 0.3, 142.4, 1, 0x9a9aa2, { s: [1.3, 0.5, 1] }); k.cyl(-6, H(-6, 133), 133, 0.7, 0.8, 0.3, 0xb9b9c0); k.sph(9, H(9, 151), 153, 5, 0x6a6a72, { s: [1.6, 0.7, 0.8] });
  for (let z = 68; z < 136; z += 2.3) for (const s of [-1, 1]) { const x = s * (3.4 + R()) - Math.sin(z * 0.05) * 2; k.sph(x, H(x, z) + 0.25, z, 0.2, R() > 0.5 ? 0xffffff : 0xfff3a8); }
  // signpost
  { const y = H(0, 64); k.cyl(1.6, y, 63.5, 0.1, 0.12, 3.4, 0xffffff); k.box(2.3, y + 2.8, 63.5, 1.8, 0.4, 0.1, 0xf7a8c8, { ry: 0.3 }); k.box(0.9, y + 2.3, 63.5, 1.8, 0.4, 0.1, 0x9ad8f5, { ry: -0.4 }); k.cyl(1.6, y + 3.5, 63.5, 0.55, 0.55, 0.12, 0xff6a9a, { rx: Math.PI / 2 }); k.cyl(1.6, y + 3.5, 63.56, 0.3, 0.3, 0.12, 0xffffff, { rx: Math.PI / 2 }); w.circles.push([1.6, 63.5, 0.4]); }
  // town
  cakeHouse(-22, 44, 5, 4.2, 0xd8b8f0, 0xfff1d6, Math.PI / 2); for (let i = 0; i < 3; i++) k.box(-16.9, H(-17, 44) + 1, 42.4 + i * 1.6, 0.3, 1.8, 1, [0xfff1d6, 0xf7a8c8, 0xa8d8f5][i]);
  cakeHouse(25, 55, 5.5, 5, 0xc98a5a, 0xffffff, -Math.PI / 2); cakeHouse(-24, 26, 4.6, 3.6, 0xa8e0d0, 0xff9ec0, Math.PI / 2); cakeHouse(23, 36, 4.6, 4, 0xfbe08a, 0xc9a0f0, -Math.PI / 2); cakeHouse(24, 19, 4.2, 3.4, 0xffb0c8, 0xfff1d6, -Math.PI / 2); cakeHouse(-26, 9, 4.8, 4.4, 0xb8c8f8, 0xffe08a, Math.PI / 2); cakeHouse(-14, -14, 4.4, 3.6, 0xffd0a8, 0xff8ab0, 0); cakeHouse(12, -22, 4.6, 4, 0xc8f0b0, 0xfff1d6, 0); cakeHouse(-40, 30, 4.4, 3.8, 0xfff1a8, 0x9ad8f5, Math.PI / 2); cakeHouse(42, 42, 4.6, 3.6, 0xf0b8e8, 0xfff1d6, -Math.PI / 2);
  { // more of the town: outer houses, lollipop trees, gumdrops along the lanes, bunting, benches
    const clear = (x, z, r) => !w.circles.some((c) => Math.hypot(c[0] - x, c[1] - z) < c[2] + r) && !w.boxes.some((q) => x > q[0] - r && x < q[1] + r && z > q[2] - r && z < q[3] + r) && !Object.values(P).some((p) => Math.hypot(p[0] - x, p[1] - z) < r + 3.5) && Math.abs(x + Math.sin(z * 0.05) * 2) > r + 3;
    const walls = [0xffc8dc, 0xc8e8ff, 0xfff0b0, 0xd8c0f8, 0xc0f0d8, 0xffd8b8], roofs = [0xfff1d6, 0xff9ec0, 0xc9a0f0, 0x9ad8f5, 0xffe08a];
    [[-45, 12, 4.2, 3.6], [-46, 52, 4.4, 4], [45, 24, 4.4, 3.8], [44, 62, 4.6, 4.2], [-30, -26, 4.2, 3.6], [-34, 62, 4.4, 3.8], [60, 34, 4.2, 3.4], [-58, 38, 4.6, 4.2], [8, -38, 4.2, 3.6], [-52, -10, 4.4, 3.8], [62, 56, 4.4, 4]].forEach(([x, z, r, h], i) => { if (clear(x, z, r + 1.5)) cakeHouse(x, z, r, h, walls[i % 6], roofs[i % 5], Math.atan2(-x, 20 - z)); });
    const lolly = (x, z, s, c) => { const y = H(x, z); k.cyl(x, y, z, 0.09 * s, 0.11 * s, 3.2 * s, 0xffffff); k.cyl(x, y + 3.9 * s, z, 1.05 * s, 1.05 * s, 0.22 * s, c, { rx: Math.PI / 2 }, 16); k.cyl(x, y + 3.9 * s, z + 0.12 * s, 0.7 * s, 0.7 * s, 0.05 * s, 0xffffff, { rx: Math.PI / 2 }, 16); k.cyl(x, y + 3.9 * s, z + 0.15 * s, 0.38 * s, 0.38 * s, 0.05 * s, c, { rx: Math.PI / 2 }, 12); k.cyl(x, y + 3.9 * s, z - 0.12 * s, 0.7 * s, 0.7 * s, 0.05 * s, 0xffffff, { rx: Math.PI / 2 }, 16); w.circles.push([x, z, 0.35]); };
    const R3 = rnd(23), cols = [0xff6a9a, 0xb48aff, 0x5ac8f5, 0xffb23a, 0x6ad8a0];
    for (let i = 0, n = 0; n < 22 && i < 400; i++) { const a = R3() * 6.283, d = 24 + R3() * 44, x = Math.cos(a) * d, z = 20 + Math.sin(a) * d; if (z > 96 || z < -44 || !clear(x, z, 1.4)) continue; lolly(x, z, 0.8 + R3() * 0.7, cols[n % 5]); n++; }
    for (let z = -18; z < 96; z += 2.6) for (const s of [-1, 1]) { const x = s * (3.7 + (Math.floor(z) % 2) * 0.25) - Math.sin(z * 0.05) * 2; if (Math.hypot(x, z - 16) < 23 || Math.hypot(x - 1.6, z - 63.5) < 2) continue; k.sph(x, H(x, z) + 0.02, z, 0.3, cols[Math.abs(Math.round(z * 1.7 + s)) % 5], { s: [1, 0.85, 1] }); }
    for (let i = 0; i < 12; i++) { const a0 = i * 0.52, a1 = (i + 1) * 0.52, x0 = Math.cos(a0) * 20, z0 = 16 + Math.sin(a0) * 24, x1 = Math.cos(a1) * 20, z1 = 16 + Math.sin(a1) * 24; if (Math.abs(x0) < 6 || Math.abs(x1) < 6) continue; for (let j = 1; j < 7; j++) { const t = j / 7, x = lerp(x0, x1, t), z = lerp(z0, z1, t), sag = Math.sin(t * Math.PI) * 0.5; k.cone(x, H(x, z) + 2.5 - sag, z, 0.2, 0.42, cols[(i + j) % 5], { rx: Math.PI, ry: Math.atan2(x1 - x0, z1 - z0) }, 3); } }
    for (const [x, z, ry] of [[-6.5, 20, 1.2], [6.5, 20, -1.2], [-5, 29, 2.3], [5, 29, -2.3]]) { const y = H(x, z); k.box(x, y + 0.45, z, 2.2, 0.14, 0.7, 0xe0b070, { ry, wood: 1 }); k.box(x - Math.sin(ry) * 0.3, y + 0.9, z - Math.cos(ry) * 0.3, 2.2, 0.6, 0.12, 0xe0b070, { ry, wood: 1 }); for (const s of [-0.9, 0.9]) k.box(x + Math.cos(ry) * s, y, z - Math.sin(ry) * s, 0.14, 0.45, 0.6, 0xffffff, { ry }); w.circles.push([x, z, 0.9]); }
    for (let i = 0; i < 26; i++) { const a = R3() * 6.283, d = 26 + R3() * 60, x = Math.cos(a) * d, z = 20 + Math.sin(a) * d; if (z > 96 || z < -60 || !clear(x, z, 0.8)) continue; const y = H(x, z), c = cols[i % 5]; k.sph(x, y + 0.1, z, 0.75 + R3() * 0.5, c, { s: [1, 0.75, 1] }); k.sph(x + 0.8, y, z + 0.4, 0.45, cols[(i + 2) % 5], { s: [1, 0.75, 1] }); } }
  stall(P.tart[0], P.tart[1], 0xfbe08a); stall(-13, 7, 0xa8e0d0); stall(-11, 30, 0xc9a7f0); stall(9, 42, 0xffb0c8);
  { const y = H(0, 23); k.cyl(0, y, 23, 2.6, 2.8, 0.8, 0xffffff, {}, 14); k.cyl(0, y, 23, 0.4, 0.5, 2.4, 0xffd0e0); k.sph(0, y + 2.6, 23, 0.6, 0xff7aa8, { glow: 1 }); }
  for (let i = 0; i < 12; i++) { const a = i * 0.52, x = Math.cos(a) * 20, z = 16 + Math.sin(a) * 24; if (Math.abs(x) < 6) continue; const y = H(x, z); k.cyl(x, y, z, 0.07, 0.09, 2.6, 0xffffff); k.sph(x, y + 2.9, z, 0.36, [0xff8ab8, 0xfff3a8, 0x9ad8f5][i % 3], { glow: 1 }); }
  // balloon meadow
  for (let i = 0; i < 7; i++) { const x = -22, z = -8 + i * 3.2; k.cyl(x, H(x, z), z, 0.1, 0.1, 1.1, 0xffffff); k.box(x, H(x, z) + 0.8, z + 1.6, 0.08, 0.12, 3.2, 0xffffff); w.circles.push([x, z, 0.3]); }
  const balloons = []; const bal = (x, y, z, c, c2) => { const kk = new Kit(); kk.sph(0, 5.2, 0, 3, c, { s: [1, 0.9, 1] }); kk.sph(1.4, 6.2, 0.6, 1.8, c2); kk.sph(-1.3, 4.6, -0.8, 1.9, c2); kk.cyl(0, 0, 0, 1.1, 0.9, 1, 0xc9a0f0, {}, 12); kk.cyl(0, 1, 0, 1.2, 1.2, 0.3, 0xfff1d6, {}, 12); for (const s of [-1, 1]) kk.cyl(s * 0.9, 1, 0, 0.03, 0.03, 2.4, 0xffffff, {}, 4); const m = kk.build(); m.position.set(x, y, z); g.add(m); balloons.push(m); m.userData.y = y; return m; };
  w.balloon = bal(-38, H(-38, -6), -6, 0xffb0d0, 0xffd0e4); bal(-60, 46, -40, 0xa8d8f5, 0xd0ecff); bal(40, 60, -70, 0xfff3a8, 0xfffad0); bal(-90, 52, 70, 0xc9a0f0, 0xe4d0ff); bal(110, 58, -30, 0xa8e8c4, 0xd0f8e0);
  // workshop (open to the south) with stained sugarglass
  { const y = H(34, -5), W = 0xffe8d0; k.box(34, y - 0.2, -5, 16, 0.3, 14, 0xf3d8b8); k.box(34, y, -12, 16, 6, 0.5, W); box(26, 42, -12.4, -11.6); k.box(26, y, -5, 0.5, 6, 14, W); box(25.6, 26.4, -12, 2); k.box(42, y, -5, 0.5, 6, 14, W); box(41.6, 42.4, -12, 2);
    const sg = [0xff7ab0, 0xb48aff, 0xffd24a, 0x7ad8ff, 0xff9a5a]; for (let i = 0; i < 5; i++) { k.box(28.5 + i * 2.8, y + 1.4, -11.7, 2, 3.6, 0.15, sg[i], { glow: 1 }); k.sph(28.5 + i * 2.8, y + 5, -11.7, 1, sg[(i + 2) % 5], { glow: 1, s: [1, 0.5, 0.1] }); } for (let i = 0; i < 3; i++) k.box(26.3, y + 1.4, -9.5 + i * 3.6, 0.15, 3.4, 2.2, sg[(i + 1) % 5], { glow: 1 });
    k.box(34, y + 6, -5, 17, 0.4, 15, 0xff9ec0, { rz: 0.03 }); k.box(39, y + 6.4, -9, 1.3, 3, 1.3, 0xc98a5a, { rz: 0.22 }); k.sph(39.6, y + 9.6, -9, 0.9, 0xffffff);
    k.box(34, y, -6.4, 5, 1, 1.8, 0xd9a070, { wood: 1 }); box(31.5, 36.5, -7.3, -5.5); k.sph(33, y + 1.2, -6.4, 0.3, 0xffb0d0); k.sph(35, y + 1.15, -6.4, 0.2, 0x2a1a1a);
    k.box(40.6, y, -8.5, 1.4, 3.4, 5, 0xc98a5a); box(39.9, 41.6, -11, -6); for (let i = 0; i < 6; i++) k.sph(40.3, y + 1.3 + (i % 3) * 0.9, -10.3 + i * 0.7, 0.24, sg[i % 5], { glow: 1 });
    k.cyl(39.5, y, -1.6, 0.5, 0.6, 0.7, 0xc98a5a); w.circles.push([39.5, -1.6, 0.7]);
    // The family confectionery is the landmark of the town: a tall front with a great rose window of stained sugar-glass, twin spires and a striped arch
    const fz = 2.3, cy = y + 11.2; for (const s of [-1, 1]) { k.box(34 + s * 7.4, y, fz, 1.6, 9, 1.6, W); k.box(34 + s * 7.4, y + 9, fz, 2, 0.5, 2, 0xff9ec0); k.cyl(34 + s * 7.4, y + 9.5, fz, 1, 1.15, 6.5, 0xfff6ee, {}, 10); for (let i = 0; i < 5; i++) k.cyl(34 + s * 7.4, y + 9.9 + i * 1.3, fz, 1.03, 1.17, 0.5, 0xff8ab0, {}, 10); k.cone(34 + s * 7.4, y + 16, fz, 1.5, 3.6, 0xff6a9a, {}, 10); k.sph(34 + s * 7.4, y + 19.9, fz, 0.42, 0xe8243c); w.circles.push([34 + s * 7.4, fz, 1.3]); for (const q of [3, 6]) k.box(34 + s * 7.4, y + q, fz + 0.82, 0.8, 1.5, 0.08, sg[q % 5], { glow: 1 }); }
    k.box(34, y + 5.6, fz, 13.4, 1, 1.3, 0xff9ec0); k.box(34, y + 6.6, fz, 13.4, 9.6, 0.9, W); k.box(34, y + 16.2, fz, 9.5, 2.4, 0.9, W); k.box(34, y + 18.6, fz, 5.4, 1.8, 0.9, W); k.box(34, y + 16.2, fz, 14.2, 0.4, 1.3, 0xff9ec0); k.cone(34, y + 20.4, fz, 2.2, 3, 0xff6a9a, {}, 4); k.sph(34, y + 23.7, fz, 0.5, 0xe8243c);
    for (let i = 0; i < 7; i++) k.sph(27.6 + i * 2.13, y + 5.5, fz + 0.6, 0.62, i % 2 ? 0xffffff : 0xffd0e0);
    k.torus(34, cy, fz + 0.5, 4.3, 0.34, 0xffffff); k.torus(34, cy, fz - 0.5, 4.3, 0.34, 0xffffff); k.torus(34, cy, fz + 0.52, 2.1, 0.16, 0xffe08a); k.torus(34, cy, fz - 0.52, 2.1, 0.16, 0xffe08a);
    for (let i = 0; i < 12; i++) { const a = i * 0.5236 + 0.26, c = sg[i % 5], c2 = sg[(i + 2) % 5]; for (const zz of [fz + 0.47, fz - 0.47]) { k.box(34 + Math.cos(a) * 3.15, cy + Math.sin(a) * 3.15 - 0.8, zz, 1.5, 1.6, 0.05, c, { glow: 1, rz: a - Math.PI / 2 }); k.box(34 + Math.cos(a) * 1.2, cy + Math.sin(a) * 1.2 - 0.5, zz, 0.6, 1, 0.05, c2, { glow: 1, rz: a - Math.PI / 2 }); k.box(34 + Math.cos(a - 0.26) * 2.9, cy + Math.sin(a - 0.26) * 2.9 - 1.15, zz + (zz > fz ? 0.03 : -0.03), 0.1, 2.3, 0.05, 0xffffff, { rz: a - 0.26 - Math.PI / 2 }); } }
    for (const zz of [fz + 0.5, fz - 0.5]) { k.sph(34, cy, zz, 0.75, 0xffe08a, { glow: 1, s: [1, 1, 0.12] }); k.sph(34, cy, zz, 0.4, 0xff7ab0, { glow: 1, s: [1, 1, 0.2] }); }
    for (const s of [-1, 1]) for (const zz of [fz + 0.47, fz - 0.47]) { k.box(34 + s * 4.9, y + 8, zz, 1.3, 2.6, 0.05, sg[s > 0 ? 1 : 3], { glow: 1 }); k.sph(34 + s * 4.9, y + 9.3, zz, 0.65, sg[s > 0 ? 4 : 0], { glow: 1, s: [1, 1, 0.08] }); }
    k.box(34, y + 6.75, fz + 0.5, 6.4, 1.1, 0.14, 0xfff1d6); k.box(34, y + 6.75, fz + 0.58, 5.8, 0.7, 0.06, 0xf58ab5); }
  // Kim's house (open to the south) with the back room and the cradle
  { const y = H(60, -22), W = 0xfff1d6; k.box(60, y - 0.2, -22, 22, 0.3, 20, 0xf5dcc0); k.box(60, y, -32, 22, 5, 0.5, W); box(49, 71, -32.4, -31.6); k.box(49, y, -22, 0.5, 5, 20, W); box(48.6, 49.4, -32, -12); k.box(71, y, -22, 0.5, 5, 20, W); box(70.6, 71.4, -32, -12);
    k.box(54.5, y, -24, 11, 5, 0.4, W); box(49, 60, -24.3, -23.7); k.box(60, y + 5, -22, 23, 0.4, 21, 0xf58ab5, { rz: -0.03 }); k.sph(60, y + 5.6, -22, 1, 0xe8243c);
    k.box(56, y, -19.5, 4, 0.9, 2, 0xc98a5a); box(54, 58, -20.6, -18.4); k.box(51, y, -15, 2.4, 2.6, 2.4, 0xb9774a); k.box(52.25, y + 0.8, -15, 0.1, 1, 1.2, 0xffa23a, { glow: 1 }); box(49.6, 52.3, -16.3, -13.7); k.box(53.6, y, -14.6, 1, 0.5, 1, 0xf7a8c8);
    k.sph(64, y + 0.75, -28.6, 0.8, 0xf2c14a, { s: [1.5, 0.8, 0.9], glow: 1 }); k.sph(64, y + 1.1, -28.6, 0.75, 0xffe08a, { s: [1.4, 0.7, 0.85] }); k.cone(64, y + 1.6, -28.6, 0.14, 0.4, 0xffb23a, { glow: 1 }); k.box(64, y, -28.6, 1.6, 0.3, 1, 0xc98a5a); w.circles.push([64, -28.8, 1.1]);
    for (let i = 0; i < 10; i++) { const x = 73 + R() * 4, z = -19 + R() * 6; k.cone(x, H(x, z) + 0.2, z, 0.2, 0.5, 0x7fc98a); k.sph(x, H(x, z) + 0.6, z, 0.1, 0xbfa0e8); } }
  // marshmallow meadows
  w.bouncers.forEach(([x, z, r, top], i) => { const y = base(x, z), c = [0xffffff, 0xffe0ec, 0xfff6d0][i % 3]; k.cyl(x, y - 0.5, z, r, r, top + 0.2, c, {}, 16); k.sph(x, y + top - 0.3, z, r * 0.98, c, { s: [1, 0.22, 1] }); });
  // licorice lift + mountain dressing
  { const y0 = H(0, -92); for (const s of [-1, 1]) k.cyl(s * 2.4, y0, -94, 0.25, 0.3, 5, 0x2a1a22); k.box(0, y0 + 5, -94, 5.4, 0.4, 0.4, 0x2a1a22); k.cyl(0, y0, -92.6, 1.2, 1, 1, 0xc98a5a, {}, 10); for (let i = 0; i < 16; i++) { const t = i / 15, z = lerp(-94, -156, t), x = -6; k.box(x, H(x, z) + 5.6, z, 0.16, 0.16, 4.6, 0x2a1a22, { rx: -Math.atan2(H(x, z - 2) - H(x, z + 2), 4) }); if (i % 5 === 0) k.cyl(x, H(x, z), z, 0.15, 0.2, 5.6, 0x2a1a22); }
    k.box(6, H(6, -160), -161, 3, 1, 1.4, 0xd9a05a); for (let i = 0; i < 3; i++) k.cyl(5 + i, H(6, -160) + 1.3, -161, 0.5, 0.5, 0.12, 0xe8b86a, { rx: 1.2 }); w.circles.push([6, -161, 1.6]);
    for (const [x, z, r, c, c2] of [[-120, -230, 60, 0xffb8d0, 0xff8ab0], [0, -250, 70, 0xfffaf0, 0xfff0c0], [120, -232, 62, 0xb98a68, 0x6a4028]]) { k.sph(x, 30, z, r, c); k.sph(x, 30 + r * 0.55, z, r * 0.72, c2, { s: [1, 0.6, 1] }); k.sph(x, 32 + r * 1.02, z, 5, 0xe8243c); }
    for (let i = 0; i < 26; i++) { const x = -70 + R() * 140, z = -108 - R() * 52; if (Math.abs(x) < 17) continue; const y = H(x, z); k.sph(x, y, z, 1.6 + R() * 2, 0xffffff, { s: [1, 0.6, 1] }); w.circles.push([x, z, 1.5]); } }
  // sweetlake boats, chocolate lake dressing, dock
  for (const [x, z, ry] of [[72.6, -57.6, 0.6], [75, -54.5, 1.2], [70.4, -60.4, 0.2]]) { k.sph(x, H(x, z) + 0.3, z, 1.3, 0x9a6a42, { s: [1, 0.45, 1.6], ry }); k.sph(x, H(x, z) + 0.5, z, 1.05, 0xc8f0ff, { s: [1, 0.2, 1.5], ry }); }
  { const y = H(-92, 42); k.box(-92, y, 42.4, 3.4, 0.5, 0.9, 0xc98a5a); k.box(-92, y + 0.5, 42.9, 3.4, 0.9, 0.15, 0xc98a5a); w.circles.push([-92, 42.6, 1.2]); for (let i = 0; i < 9; i++) { const a = R() * 6.28, d = 6 + R() * 9; k.sph(-116 + Math.cos(a) * d, -1.7, 20 + Math.sin(a) * d, 0.35, 0xd9963a, { s: [1, 0.7, 1.3] }); } for (let i = 0; i < 24; i++) { const a = i * 0.26, x = -116 + Math.cos(a) * 19.4, z = 20 + Math.sin(a) * 19.4; if (Math.cos(a) > 0.75) continue; k.cyl(x, H(x, z) - 0.3, z, 0.05, 0.07, 1.8 + R(), 0xa8d88a, {}, 5); } k.box(-134, -1.8, 20, 2, 3.5, 5, 0x6a3a22); k.box(-133, -1.9, 20, 0.4, 3.6, 4, 0x7a4a2c, { glow: 0 }); }
  { k.box(159, 0.3, 100, 20, 0.35, 3.6, 0xe0c09a, { wood: 1 }); for (let i = 0; i < 5; i++) for (const s of [-1, 1]) k.cyl(151 + i * 4.4, -3, 100 + s * 1.7, 0.2, 0.2, 4, 0xb98a5a); ship(k, 174, 0.6, 100, 0xb9774a, 0xfff1d6, Math.PI / 2, 0xff8ab8); for (const [x, z, c] of [[160, 99, 0xf7a8c8], [162, 101, 0xa8d8f5], [164, 99.4, 0xfff3a8]]) k.box(x, 0.65, z, 1.2, 1.1, 1.2, c); }
  if (NAT) { const pastel = [0xff9ec8, 0xc9a0f0, 0x9fe0c0, 0xffc890, 0x9ad0f5], R2 = rnd(5);
    const free = (x, z, r) => { if (!w.grassMask(x, z) || base(x, z) < -0.3) return false; for (const c of w.circles) if (Math.hypot(c[0] - x, c[1] - z) < c[2] + r) return false; for (const q of w.boxes) if (x > q[0] - r && x < q[1] + r && z > q[2] - r && z < q[3] + r) return false; return !Object.values(P).some((p) => Math.hypot(p[0] - x, p[1] - z) < 4 + r); };
    for (let i = 0, n = 0; n < 40 && i < 600; i++) { const x = -140 + R2() * 290, z = -95 + R2() * 190; if (!free(x, z, 2.5) || z > 96) continue; sc.add(['CommonTree_1', 'CommonTree_2', 'CommonTree_3'][n % 3], x, H(x, z) - 0.15, z, R2() * 6, 0.85 + R2() * 0.6, pastel[n % 5]); w.circles.push([x, z, 0.6]); n++; }
    for (let i = 0, n = 0; n < 150 && i < 1500; i++) { const x = -140 + R2() * 290, z = -95 + R2() * 260; if (!free(x, z, 0.6)) continue; const t = n % 6; sc.add(['Bush_Common_Flowers', 'Flower_3_Group', 'Flower_4_Group', 'Bush_Common', 'Fern_1', 'Mushroom_Common'][t], x, H(x, z) - 0.05, z, R2() * 6, t === 4 ? 0.22 + R2() * 0.1 : t === 5 ? 1.6 : 0.7 + R2() * 0.5, t === 5 ? null : pastel[(n >> 1) % 5]); n++; }
    for (let i = 0, n = 0; n < 16 && i < 300; i++) { const x = -140 + R2() * 290, z = -95 + R2() * 260; if (!free(x, z, 2)) continue; sc.add(['Rock_Medium_1', 'Rock_Medium_2', 'Rock_Medium_3'][n % 3], x, H(x, z) - 0.2, z, R2() * 6, 0.5 + R2() * 0.5); w.circles.push([x, z, 0.9]); n++; } }
  w.torches = [[-5, 52], [5, 58], [-5, 70], [5, 82], [-5, 94], [-8, 4], [8, -2], [-16, 18], [16, 14], [-30, 40], [30, 46], [20, 2], [46, -6], [58, -4], [-6, 108], [6, 122], [-12, 136], [-30, 136], [-60, 30], [-80, 34], [60, 20], [84, 30], [0, -40], [0, -70]]
    .filter(([x, z]) => !w.circles.some((c) => Math.hypot(c[0] - x, c[1] - z) < c[2] + 0.6) && !w.boxes.some((q) => x > q[0] - 0.6 && x < q[1] + 0.6 && z > q[2] - 0.6 && z < q[3] + 0.6))
    .map(([x, z], i) => { const y = H(x, z); k.cyl(x, y, z, 0.26, 0.3, 0.25, 0xffffff, {}, 8); k.cyl(x, y + 0.25, z, 0.07, 0.09, 2.3, 0xffffff, {}, 6); for (let j = 0; j < 3; j++) k.cyl(x, y + 0.6 + j * 0.7, z, 0.1, 0.1, 0.25, 0xe8344a, {}, 6); k.cyl(x, y + 2.55, z, 0.32, 0.16, 0.35, [0xff9ec0, 0xa8d8f5, 0xfff3a8][i % 3], {}, 8); w.circles.push([x, z, 0.35]); return { x, z, y: y + 2.9, lit: false, pink: 1 }; });
  g.add(k.build()); g.add(sc.build());
  const sprite = makeCritter('sprite'); sprite.scale.setScalar(1.6); g.add(sprite);
  w.tick = (t, dt, G) => { balloons.forEach((b, i) => { if (b !== w.balloon || !w.balloonHold) b.position.y = b.userData.y + Math.sin(t * 0.5 + i) * (i ? 3 : 0.3); }); const m = w.bouncers[4]; sprite.position.set(m[0] + Math.sin(t * 2) * 1.4, base(m[0], m[1]) + m[3] + 0.3 + Math.abs(Math.sin(t * 4)) * 1.6, m[1] + Math.cos(t * 2) * 1.4); sprite.rotation.y = t * 3; sprite.visible = !G.f.c5_meadow || G.S.ch !== 5; };
  return w;
}

// ═══════════════════════════ THE SEA ═══════════════════════════
export function buildSea() {
  const w = { name: 'sea', circles: [], boxes: [], bouncers: [], bounds: [-2.3, 2.3, -7.4, 7], sea: true };
  w.height = (x, z) => (Math.abs(x) < 2.8 && z > -8.4 && z < 7.6 ? 1.3 : -3);
  w.P = { deck: [0, 3], bow: [0, -6.2], mast: [0.9, 0.2] };
  const g = (w.group = new THREE.Group());
  const sea = ocean(0x3f86a8, 0, 8000); g.add(sea); w.seaMesh = sea;
  let k = new Kit(); ship(k, 0, 1.6, 0, 0xb9774a, 0xfff1d6, 0, 0xff8ab8); k.box(0, 1.1, 0, 5.4, 0.2, 16.4, 0xe0c09a, { wood: 1 });
  for (const [x, z, c] of [[-1.5, 3.5, 0xf7a8c8], [1.6, 5, 0xa8d8f5], [-1.4, -2, 0xfff3a8], [1.5, -3.4, 0xc9a0f0]]) k.box(x, 1.3, z, 1.1, 1, 1.1, c);
  for (const x of [-1.2, 1.4]) { k.cyl(x, 1.3, 6.4, 0.25, 0.3, 0.4, 0xb9774a); k.cyl(x, 1.7, 6.4, 0.06, 0.06, 1.3, 0xffffff); k.sph(x, 3.2, 6.4, 0.35, 0xa8e8c4); }
  w.boat = k.build(); g.add(w.boat);
  k = new Kit(); ship(k, -26, 0.5, -44, 0x4a4a52, 0x7b7b84, 0.9, 0xffa23a); ship(k, 30, 0.5, -52, 0x4a4a52, 0x7b7b84, -0.8, 0xffa23a); ship(k, 4, 0.5, -90, 0x4a4a52, 0x7b7b84, 1.5, 0xffa23a);
  w.wardens = k.build(); g.add(w.wardens);
  k = new Kit(); ship(k, 0, 0.5, 0, 0xf7a8c8, 0xfff1d6, Math.PI, 0xff8ab8); ship(k, 0, 0, 40, 0x5a5a62, 0x8b8b92, Math.PI, 0xffd060); for (let i = 0; i < 6; i++) k.sph(i % 2 ? 2.6 : -2.6, 3, 34 + i * 2.4, 0.3, 0xffd060, { glow: 1 });
  w.visitor = k.build(); g.add(w.visitor); w.visitor.visible = false;
  w.tick = (t, dt, G) => { w.boat.visible = G.S.ch === 11 && !G.f.c11_pouch; w.wardens.visible = G.S.ch === 11 && !!G.S.vis.ships; w.boat.rotation.z = Math.sin(t * 0.8) * 0.02 + (G.S.vis.hit ? 0.06 : 0); sea.position.set(G.cam.position.x, 0, G.cam.position.z); };
  return w;
}

// sky + light presets
export const SKY = {
  ember: { day: [0xf2a56c, 0xfde2b4, 0xf4c9a0, 0.0032, 0xfff0d8, 1.25, 0xffb890], dusk: [0xc8506a, 0xfab87a, 0xe8a07a, 0.0036, 0xffc890, 1.0, 0xe88a70], night: [0x160e24, 0x5a2a3c, 0x321a26, 0.006, 0xff9a6a, 0.5, 0x8a5a6a], dawn: [0x8a7aa8, 0xf7c4a0, 0xd8b0a8, 0.004, 0xffd8b8, 0.9, 0xc8a0a0] },
  sugar: { day: [0x8fd0f5, 0xfdeaf2, 0xf2e8f4, 0.0026, 0xffffff, 1.2, 0xd8e8ff], dusk: [0xf59ab0, 0xfde2b0, 0xf5c8c0, 0.003, 0xffd0a0, 1.0, 0xf0b0c0], night: [0x23235a, 0x6a5a92, 0x3a3a6a, 0.005, 0xb8c0ff, 0.5, 0x7a7ab0], dawn: [0xb0c4f5, 0xfdd8c8, 0xe8d8e8, 0.0032, 0xffe8d8, 1.0, 0xd8c8e8] },
  sea: { day: [0x7ab8e0, 0xe8f4fa, 0xcfe4ee, 0.0028, 0xffffff, 1.15, 0xc8e0f0], dawn: [0x9a8ab8, 0xf8d0b0, 0xd8c8cc, 0.003, 0xffe0c8, 1.0, 0xc8b0c0], dusk: [0xc8607a, 0xf8b888, 0xd8a898, 0.003, 0xffc8a0, 0.9, 0xd89a90], night: [0x101830, 0x3a4a6a, 0x26324a, 0.005, 0xa8b8e0, 0.5, 0x6a7a9a] },
};
