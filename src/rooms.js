// Interiors. Every house door leads to a furnished room (a few layouts per kingdom, varied by the house),
// kept high above the world and shown only while you are inside it.
import * as THREE from 'three';
import { Kit, rnd } from './kit.js';

const cache = new Map();
const LINES = {
  ember: ['Mind the hearth, Highness. It bites.', 'You are welcome at our fire any day.', 'Supper is an hour off, but sit if you like.', 'First Flame keep you warm.', 'The buns are Orin’s. I only take the credit.'],
  sugar: ['Oh! A visitor. Wipe your feet, it is icing season.', 'Try a biscuit. Everyone does.', 'Come in, come in. The kettle is on. It usually is.', 'Mind the cooling rack, dear.', 'You look as though you could do with something sweet.'],
};
const FOLK = { ember: ['candle', 'glass', 'baker', 'attendant', 'tender', 'metal'], sugar: ['mint', 'tartman', 'ribbon', 'sledlady', 'cider'] };

export function makeRoom(world, seed) {
  const sugar = world === 'sugar', v = seed % 4, key = world + v; let room = cache.get(key);
  if (!room) {
    const k = new Kit(), R = rnd(seed * 13 + 5), ox = 1000 + v * 60, oz = sugar ? 1400 : 1000, y = 300, W = 11, D = 9, hh = 4.3, f = v % 2 ? -1 : 1, X = (x) => ox + x * f, circles = [], boxes = [];
    const pal = sugar ? [[0xffe4ee, 0xff9ec0, 0xfff6dc, 0xa8e0d0], [0xe4f4ff, 0x9ad0f5, 0xfff1d6, 0xffb0c8], [0xfff3c8, 0xc9a0f0, 0xffffff, 0xff9ec0], [0xe6fbe8, 0xffb0c8, 0xfff6dc, 0xc9a0f0]][v] : [[0xead8bc, 0xa3182c, 0x8a5a3a, 0xe2b24a], [0xe2cdb0, 0x7a3a4a, 0x7a4a2e, 0xd98a2b], [0xf0e0c8, 0xb8483a, 0x6b4a36, 0xe9b949], [0xddc7a6, 0x8e1b2c, 0x8a6248, 0xc8632b]][v];
    const [wall, accent, wood, trim] = pal, block = (x, z, w, d) => boxes.push([Math.min(X(x - w / 2), X(x + w / 2)), Math.max(X(x - w / 2), X(x + w / 2)), oz + z - d / 2, oz + z + d / 2]);
    // shell
    k.box(ox, y - 0.3, oz, W, 0.3, D, sugar ? 0xfbe8d0 : 0x9a6a48, { wood: 1 }); k.box(ox, y + hh, oz, W, 0.25, D, sugar ? 0xfff6ee : 0x6b4a36);
    k.box(ox, y, oz - D / 2, W, hh, 0.3, wall); k.box(ox, y, oz + D / 2, W, hh, 0.3, wall); k.box(ox - W / 2, y, oz, 0.3, hh, D, wall); k.box(ox + W / 2, y, oz, 0.3, hh, D, wall);
    for (const zz of [-D / 2 + 0.2, D / 2 - 0.2]) k.box(ox, y, oz + zz, W, 0.9, 0.12, sugar ? accent : wood); for (const xx of [-W / 2 + 0.2, W / 2 - 0.2]) k.box(ox + xx, y, oz, 0.12, 0.9, D, sugar ? accent : wood);
    for (let i = -2; i <= 2; i++) k.box(ox + i * 2.2, y + hh - 0.3, oz, 0.3, 0.3, D, sugar ? 0xffd0e0 : 0x4a3226, { wood: !sugar });
    k.box(ox, y, oz + D / 2 - 0.2, 1.5, 2.6, 0.14, sugar ? 0xff8ab0 : 0x5a3a26, { wood: !sugar }); k.sph(ox + 0.5, y + 1.25, oz + D / 2 - 0.32, 0.08, trim); // the door out
    for (const s of [-1, 1]) { k.box(ox + s * (W / 2 - 0.2), y + 1.4, oz + 0.6, 0.1, 1.5, 1.8, sugar ? 0xfff3c8 : 0xffc66a, { glow: 1 }); k.box(ox + s * (W / 2 - 0.26), y + 1.3, oz + 0.6, 0.08, 0.12, 2.1, wood); k.box(ox + s * (W / 2 - 0.26), y + 1.4, oz + 0.6, 0.08, 1.5, 0.1, wood); }
    k.box(ox, y + 0.01, oz + 0.6, 4.4, 0.05, 3, accent); k.box(ox, y + 0.02, oz + 0.6, 3.6, 0.05, 2.2, sugar ? 0xffffff : trim); k.box(ox, y + 0.03, oz + 0.6, 2.6, 0.05, 1.4, accent);
    // hearth / oven on the back wall
    k.box(ox, y, oz - D / 2 + 0.6, 2.8, 2.3, 1, sugar ? 0xfff1e0 : 0x8a7a72); k.box(ox, y + 2.3, oz - D / 2 + 0.5, 1.6, hh - 2.3, 0.8, sugar ? 0xfff1e0 : 0x7a6a62); k.box(ox, y + 0.25, oz - D / 2 + 1.06, 1.5, 1.2, 0.12, 0x2a1a16);
    k.cone(ox, y + 0.3, oz - D / 2 + 1.0, 0.4, 0.9, sugar ? 0xff8ab8 : 0xffa02a, { glow: 1 }); k.cone(ox - 0.3, y + 0.3, oz - D / 2 + 1.0, 0.22, 0.55, sugar ? 0xffd0e4 : 0xffd060, { glow: 1 }); k.box(ox, y + 2.3, oz - D / 2 + 0.65, 3.1, 0.18, 1.2, sugar ? accent : wood);
    for (let i = -1; i <= 1; i++) k.sph(ox + i * 0.9, y + 2.62, oz - D / 2 + 0.7, 0.16, [trim, accent, 0xffffff][i + 1], i === 0 ? { glow: 1 } : {}); block(0, -D / 2 + 0.6, 3, 1.3);
    // bed
    k.box(X(-3.7), y, oz - 2.4, 2.1, 0.5, 3.6, wood, { wood: !sugar }); k.box(X(-3.7), y + 0.5, oz - 2.2, 1.9, 0.3, 3.1, sugar ? 0xffffff : 0xf3e6d8); k.box(X(-3.7), y + 0.57, oz - 1.66, 2.0, 0.3, 2.16, accent); k.box(X(-3.7), y + 0.72, oz - 3.6, 1.3, 0.24, 0.6, 0xfff6ea); k.box(X(-3.7), y, oz - 4.32, 2.34, 1.5, 0.2, wood); k.box(X(-3.7), y, oz - 0.5, 2.34, 0.78, 0.16, wood); block(-3.7, -2.4, 2.3, 3.8);
    // table and seats
    if (sugar) { k.cyl(X(3), y, oz + 0.3, 0.9, 0.9, 0.12, 0xffffff, {}, 14); k.cyl(X(3), y - 0.75 + 0.75, oz + 0.3, 0.14, 0.3, 0.8, accent); k.cyl(X(3), y + 0.8, oz + 0.3, 1.1, 1.1, 0.1, 0xfff6dc, {}, 16); k.cyl(X(3), y + 0.9, oz + 0.3, 0.22, 0.18, 0.22, trim); k.sph(X(3), y + 1.2, oz + 0.3, 0.24, 0xffffff, { s: [1, 0.8, 1] }); k.sph(X(3), y + 1.42, oz + 0.3, 0.08, 0xe8243c);
      for (const [dx, dz, c] of [[-1.5, 0, 0xff9ec0], [1.4, 0.2, 0xa8e0d0], [0, 1.5, 0xfff3a8]]) { k.sph(X(3 + dx), y + 0.3, oz + 0.3 + dz, 0.42, c, { s: [1, 0.75, 1] }); circles.push([X(3 + dx), oz + 0.3 + dz, 0.4]); } circles.push([X(3), oz + 0.3, 1.1]); }
    else { k.box(X(3), y + 0.78, oz + 0.3, 2, 0.12, 1.3, wood, { wood: 1 }); for (const [dx, dz] of [[-0.85, -0.5], [0.85, -0.5], [-0.85, 0.5], [0.85, 0.5]]) k.box(X(3 + dx), y, oz + 0.3 + dz, 0.12, 0.78, 0.12, wood); k.sph(X(2.7), y + 1.02, oz + 0.3, 0.2, 0xd9a05a, { s: [1.3, 0.7, 1] }); k.cyl(X(3.5), y + 0.9, oz + 0.1, 0.08, 0.08, 0.2, 0x8a8a92); k.cyl(X(3.4), y + 0.9, oz + 0.7, 0.05, 0.05, 0.3, 0xfff1d6); k.sph(X(3.4), y + 1.26, oz + 0.7, 0.07, 0xffd060, { glow: 1 });
      for (const dz of [-1.2, 1.2]) { k.box(X(3), y, oz + 0.3 + dz, 0.6, 0.48, 0.6, wood, { wood: 1 }); circles.push([X(3), oz + 0.3 + dz, 0.42]); } block(3, 0.3, 2.2, 1.5); }
    // shelves, chest, lamp
    k.box(X(4.9), y, oz - 2.8, 0.7, 3, 2.4, wood, { wood: !sugar }); for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { const c = [accent, trim, 0xffffff, sugar ? 0xa8d8f5 : 0x7a8a6a][(i + r) % 4]; if (R() > 0.25) k.sph(X(4.62), y + 0.55 + r * 0.9, oz - 3.7 + i * 0.6, 0.15 + R() * 0.06, c, sugar && i % 2 ? { glow: 1 } : {}); } block(4.9, -2.8, 0.9, 2.6);
    k.box(X(-4.6), y, oz + 2.6, 1.3, 0.8, 0.9, sugar ? accent : 0x6b4a36, { wood: !sugar }); k.box(X(-4.6), y + 0.8, oz + 2.6, 1.36, 0.14, 0.96, trim); block(-4.6, 2.6, 1.5, 1.1);
    k.cyl(ox, y + hh - 1.1, oz + 0.6, 0.02, 0.02, 1.1, 0x4a3226, {}, 4); k.sph(ox, y + hh - 1.3, oz + 0.6, 0.3, sugar ? 0xffe4f0 : 0xffc45a, { glow: 1 });
    if (sugar) { k.cyl(X(-1.6), y, oz - D / 2 + 0.7, 0.05, 0.07, 1.8, 0xffffff); k.cyl(X(-1.6), y + 2, oz - D / 2 + 0.7, 0.45, 0.45, 0.1, 0xff6a9a, { rx: Math.PI / 2 }); k.cyl(X(-1.6), y + 2, oz - D / 2 + 0.76, 0.25, 0.25, 0.1, 0xffffff, { rx: Math.PI / 2 }); }
    else { k.cyl(X(2.2), y, oz - D / 2 + 0.9, 0.42, 0.46, 0.9, 0x6b4a36, { wood: 1 }); circles.push([X(2.2), oz - D / 2 + 0.9, 0.5]); k.box(X(-1.9), y + 1.9, oz - D / 2 + 0.18, 1, 1.5, 0.06, accent); k.box(X(-1.9), y + 2.2, oz - D / 2 + 0.2, 0.5, 0.5, 0.06, trim); }
    const group = k.build(); group.traverse((o) => { if (o.isMesh) { o.userData.sh = 1; o.castShadow = false; o.receiveShadow = false; } });
    const light = new THREE.PointLight(sugar ? 0xfff0f6 : 0xffc080, 9, 20, 1.4); light.position.set(ox, y + 3, oz + 0.4); group.add(light);
    room = { room: true, group, y, cx: ox, cz: oz, x0: ox - W / 2 + 0.55, x1: ox + W / 2 - 0.55, z0: oz - D / 2 + 0.55, z1: oz + D / 2 - 0.55, ceil: y + hh, circles, boxes, spawn: [ox, oz + D / 2 - 1.7], exit: { x: ox, z: oz + D / 2 - 0.7, label: 'Go outside' }, seat: [X(1.4), oz + 2.2] };
    cache.set(key, room);
  }
  const pick = seed % 3 === 0 ? null : FOLK[world][seed % FOLK[world].length];
  return { ...room, resident: pick && { id: pick, line: LINES[world][(seed >> 1) % LINES[world].length], x: room.seat[0], z: room.seat[1] }, has(x, z) { return x > this.x0 - 2 && x < this.x1 + 2 && z > this.z0 - 2 && z < this.z1 + 2; } };
}
export function deckZone(d) { // the top of a tower
  return { deck: true, y: d.y, cx: d.x, cz: d.z, r: d.r, circles: d.circles || [], boxes: [], spawn: [d.hatch[0] + (d.x - d.hatch[0]) * 0.35, d.hatch[1] + (d.z - d.hatch[1]) * 0.35], exit: { x: d.hatch[0], z: d.hatch[1], label: 'Climb down' }, has(x, z) { return Math.hypot(x - this.cx, z - this.cz) < this.r + 1.5; } };
}
