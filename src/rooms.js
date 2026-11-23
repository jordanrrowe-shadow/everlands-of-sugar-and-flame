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


// Shops have rooms of their own. Each builder furnishes the shared shell and returns where the keeper stands.
const KINDS = ['bakery', 'forge', 'glassworks', 'candleshop', 'emberinn', 'tailor', 'inn'];
const KEEP = { bakery: ['baker', 'Fresh from the oven, Highness. Mind your fingers; mind the price even more.'], forge: ['metal', 'Stand clear of the sparks. Iron has no manners.'], glassworks: ['glass', 'Look, but breathe gently. That one took me four days.'],
  candleshop: ['candle', 'Every colour burns a different temper. The lilac ones sulk.'], emberinn: ['attendant', 'A room, a fire and a bowl of something hot. We ask no questions.'], tailor: ['mint', 'Madame says stand straight. Madame always says stand straight.'], inn: ['cider', 'Beds like marshmallow, and cocoa at any hour. Welcome!'] };
const SHOP = {
  bakery({ k, X, oz, y, D, wood, trim, block, circles }) { const TAN = 0xd9a05a, CRUST = 0xc8843a;
    k.box(X(2.4), y, oz + 0.2, 4.6, 1.05, 1, wood, { wood: 1 }); k.box(X(2.4), y + 1.05, oz + 0.2, 4.8, 0.1, 1.2, 0xf3e6d8); block(2.4, 0.2, 4.8, 1.2);
    for (let i = 0; i < 6; i++) { k.sph(X(0.5 + i * 0.75), y + 1.3, oz + 0.2 + (i % 2) * 0.25, 0.22, i % 3 ? TAN : CRUST, { s: [1.3, 0.7, 1] }); } k.cyl(X(4.2), y + 1.15, oz + 0.2, 0.35, 0.35, 0.1, 0xffffff, {}, 12); k.sph(X(4.2), y + 1.4, oz + 0.2, 0.3, 0xe8b86a, { s: [1, 0.5, 1] });
    for (const zz of [-3.4, -1.4]) { k.box(X(-4.8), y, oz + zz, 0.8, 3.2, 1.8, wood, { wood: 1 }); for (let r = 0; r < 3; r++) { k.box(X(-4.6), y + 0.6 + r * 0.95, oz + zz, 0.9, 0.06, 1.7, 0xf3e6d8); for (let i = 0; i < 3; i++) k.sph(X(-4.5), y + 0.8 + r * 0.95, oz + zz - 0.55 + i * 0.55, 0.2, (i + r) % 2 ? TAN : CRUST, { s: [1, 0.7, 1.4] }); } block(-4.8, zz, 1, 2); }
    k.box(X(-2.6), y, oz + 2.4, 2.4, 0.9, 1.4, wood, { wood: 1 }); k.box(X(-2.6), y + 0.9, oz + 2.4, 2.6, 0.08, 1.6, 0xfff6ea); k.sph(X(-2.9), y + 1.1, oz + 2.4, 0.36, 0xfff1d6, { s: [1.2, 0.5, 1] }); k.cyl(X(-2.0), y + 1.02, oz + 2.6, 0.07, 0.07, 0.9, wood, { rz: Math.PI / 2 }); block(-2.6, 2.4, 2.6, 1.6);
    for (const [x, z] of [[4.6, 3.4], [3.8, 3.7], [4.7, 2.6]]) { k.sph(X(x), y + 0.45, oz + z, 0.55, 0xf6ead6, { s: [1, 0.85, 1] }); k.cyl(X(x), y + 0.86, oz + z, 0.12, 0.2, 0.2, wood, {}, 8); } circles.push([X(4.4), oz + 3.2, 1.1]);
    for (let i = 0; i < 4; i++) { k.cyl(X(-3 + i * 2), y + 3.2, oz - 1.5, 0.02, 0.02, 0.9, wood, {}, 4); k.torus(X(-3 + i * 2), y + 3.0, oz - 1.5, 0.26, 0.09, CRUST); }
    k.cyl(X(2.2), y, oz - D / 2 + 0.9, 0.42, 0.46, 0.9, 0x6b4a36, { wood: 1 }); circles.push([X(2.2), oz - D / 2 + 0.9, 0.5]); k.sph(X(0), y + 3.1, oz + 0.6, 0.3, 0xffc45a, { glow: 1 });
    return [X(2.4), oz - 1]; },
  forge({ k, X, oz, y, D, wood, block, circles }) { const IR = 0x55555c, DK = 0x2e2a2c;
    k.box(X(-1.2), y, oz + 0.6, 0.7, 0.55, 0.5, wood, { wood: 1 }); k.box(X(-1.2), y + 0.55, oz + 0.6, 1.3, 0.3, 0.5, IR); k.cone(X(-2), y + 0.56, oz + 0.6, 0.16, 0.5, IR, { rz: Math.PI / 2 }); k.box(X(-1.2), y + 0.85, oz + 0.6, 0.9, 0.08, 0.36, 0x77777d); circles.push([X(-1.2), oz + 0.6, 0.8]);
    k.box(X(-1.0), y + 0.93, oz + 0.6, 0.5, 0.05, 0.08, 0xffa23a, { glow: 1 });
    k.cyl(X(1.4), y, oz + 0.4, 0.55, 0.5, 1, 0x6b4a36, { wood: 1 }, 12); k.cyl(X(1.4), y + 0.92, oz + 0.4, 0.5, 0.5, 0.06, 0x4a7a9a, {}, 12); circles.push([X(1.4), oz + 0.4, 0.65]);
    k.box(X(4.9), y, oz - 1, 0.8, 0.95, 4.4, wood, { wood: 1 }); k.box(X(4.85), y + 0.95, oz - 1, 0.9, 0.1, 4.6, DK); block(4.9, -1, 1, 4.6); for (let i = 0; i < 5; i++) { k.box(X(4.8), y + 1.08, oz - 2.8 + i * 0.9, 0.12, 0.08, 0.7, i % 2 ? IR : 0x8a8a92, { ry: i * 0.4 }); }
    k.box(X(-5.2), y + 2.2, oz - 0.5, 0.1, 0.12, 4.2, wood); for (let i = 0; i < 6; i++) { k.box(X(-5.1), y + 1.5, oz - 2.3 + i * 0.7, 0.06, 0.8, 0.07, wood); k.box(X(-5.1), y + 1.1 + (i % 2) * 0.1, oz - 2.3 + i * 0.7, 0.07, 0.24, 0.28, IR); } for (let i = 0; i < 3; i++) k.torus(X(-5.2), y + 3, oz - 1.6 + i * 1.1, 0.24, 0.05, IR, { ry: Math.PI / 2 });
    for (let i = 0; i < 9; i++) k.sph(X(-3.6 + (i % 3) * 0.4), y + 0.2 + Math.floor(i / 3) * 0.22, oz - 3.6 + (i % 2) * 0.4, 0.26, i % 4 ? DK : 0x8a3a1a, i % 4 ? {} : { glow: 1 }); circles.push([X(-3.3), oz - 3.4, 0.9]);
    k.box(X(-3.6), y, oz + 2.8, 1.6, 0.5, 1, wood, { wood: 1 }); for (let i = 0; i < 4; i++) k.box(X(-4.1 + i * 0.35), y + 0.5, oz + 2.8, 0.08, 1.5, 0.08, i % 2 ? 0x9a9aa2 : IR, { rz: (i - 1.5) * 0.08 }); block(-3.6, 2.8, 1.8, 1.2);
    k.cone(X(0), y + 0.3, oz - D / 2 + 1.05, 0.7, 1.3, 0xff7a1c, { glow: 1 }); k.sph(X(0), y + 3.1, oz + 0.6, 0.28, 0xff9a40, { glow: 1 });
    return [X(0.2), oz - 1.4]; },
  glassworks({ k, X, oz, y, D, wood, block, circles }) { const G = [0xff5a6a, 0xffb23a, 0x5ac8ff, 0x9a6aff, 0x5ae0a0, 0xffe05a];
    for (const sx of [-4.9, 4.9]) { k.box(X(sx), y, oz - 0.8, 0.7, 3.4, 5, wood, { wood: 1 }); for (let r = 0; r < 4; r++) { k.box(X(sx - Math.sign(sx) * 0.1), y + 0.5 + r * 0.8, oz - 0.8, 0.8, 0.05, 4.8, 0xf3e6d8); for (let i = 0; i < 6; i++) { const c = G[(i + r * 2) % 6], xx = X(sx - Math.sign(sx) * 0.3), zz = oz - 2.9 + i * 0.84; if ((i + r) % 3 === 0) { k.cyl(xx, y + 0.55 + r * 0.8, zz, 0.07, 0.16, 0.42, c, { glow: 1 }, 8); k.sph(xx, y + 1.02 + r * 0.8, zz, 0.07, c, { glow: 1 }); } else k.sph(xx, y + 0.72 + r * 0.8, zz, 0.17 + ((i * 3 + r) % 3) * 0.03, c, { glow: 1 }); } } block(sx, -0.8, 1, 5.2); }
    k.box(X(0), y, oz + 0.9, 3.4, 1, 1, wood, { wood: 1 }); k.box(X(0), y + 1, oz + 0.9, 3.6, 0.08, 1.2, 0xfff6ea); block(0, 0.9, 3.6, 1.2); for (let i = 0; i < 5; i++) { k.cyl(X(-1.4 + i * 0.7), y + 1.08, oz + 0.9, 0.1, 0.2, 0.5 + (i % 2) * 0.25, G[i], { glow: 1 }, 10); k.sph(X(-1.4 + i * 0.7), y + 1.7 + (i % 2) * 0.25, oz + 0.9, 0.14, G[(i + 3) % 6], { glow: 1 }); }
    for (let i = 0; i < 4; i++) k.cyl(X(-2.6 + i * 0.22), y, oz - 3.3, 0.03, 0.03, 2.6, 0x9a9aa2, { rz: 0.08 }, 5); k.sph(X(-2.5), y + 2.7, oz - 3.3, 0.22, G[1], { glow: 1 });
    for (let i = 0; i < 8; i++) { const a = i * 0.785; k.cyl(X(Math.cos(a) * 0.8), y + 2.9, oz + 0.8 + Math.sin(a) * 0.8, 0.012, 0.012, 0.5, 0xffffff, {}, 4); k.sph(X(Math.cos(a) * 0.8), y + 2.8, oz + 0.8 + Math.sin(a) * 0.8, 0.13, G[i % 6], { glow: 1, s: [1, 1.5, 1] }); } k.torus(X(0), y + 3.4, oz + 0.8, 0.8, 0.03, 0xe2b24a, { rx: Math.PI / 2 }); k.sph(X(0), y + 3.2, oz + 0.8, 0.26, 0xfff3c8, { glow: 1 });
    k.cyl(X(2.6), y, oz + 3.2, 0.5, 0.4, 0.9, G[2], { glow: 1 }, 12); k.sph(X(2.6), y + 1.3, oz + 3.2, 0.45, G[3], { glow: 1 }); circles.push([X(2.6), oz + 3.2, 0.7]);
    return [X(0), oz - 0.5]; },
  candleshop({ k, X, oz, y, D, wood, trim, block, circles }) { const C = [0xfff1d6, 0xf7a8c8, 0xc9a0f0, 0xa8d8f5, 0xffd24a, 0xa8e8c4], candle = (x, yy, z, h, c) => { k.cyl(X(x), y + yy, oz + z, 0.07, 0.08, h, c, {}, 8); k.cone(X(x), y + yy + h, oz + z, 0.045, 0.16, 0xffb23a, { glow: 1 }, 6); };
    for (let t = 0; t < 3; t++) { k.box(X(-4.4 + t * 0.5), y, oz - 1, 0.55, 0.5 + t * 0.5, 4.6, wood, { wood: 1 }); for (let i = 0; i < 8; i++) candle(-4.4 + t * 0.5, 0.5 + t * 0.5, -3 + i * 0.58, 0.3 + ((i * 5 + t * 3) % 4) * 0.12, C[(i + t) % 6]); } block(-4, -1, 1.8, 4.8);
    k.box(X(2.6), y, oz + 0.3, 4.2, 1, 1, wood, { wood: 1 }); k.box(X(2.6), y + 1, oz + 0.3, 4.4, 0.08, 1.2, trim); block(2.6, 0.3, 4.4, 1.2); for (let i = 0; i < 7; i++) candle(0.9 + i * 0.56, 1.08, 0.3 + (i % 2) * 0.3 - 0.15, 0.25 + (i % 3) * 0.15, C[i % 6]);
    k.cyl(X(4.4), y, oz - 3.2, 0.7, 0.6, 0.9, 0x55555c, {}, 14); k.cyl(X(4.4), y + 0.84, oz - 3.2, 0.62, 0.62, 0.06, 0xfff1d6, {}, 14); k.cyl(X(4.4), y + 0.2, oz - 3.2, 0.05, 0.05, 1.6, wood, { rz: 0.3 }, 5); circles.push([X(4.4), oz - 3.2, 0.9]);
    for (let j = 0; j < 3; j++) { k.box(X(-2 + j * 2), y + 3.5, oz + 2.4, 0.9, 0.05, 0.05, wood); for (let i = 0; i < 5; i++) { k.cyl(X(-2.36 + j * 2 + i * 0.18), y + 2.9, oz + 2.4, 0.03, 0.035, 0.55, C[(i + j * 2) % 6], {}, 6); } }
    for (let i = 0; i < 6; i++) { const a = i * 1.047; candle(Math.cos(a) * 0.7, 3.0, 0.6 + Math.sin(a) * 0.7, 0.25, 0xfff1d6); } k.torus(X(0), y + 3.0, oz + 0.6, 0.7, 0.04, 0x4a3226, { rx: Math.PI / 2 }); k.cyl(X(0), y + 3.0, oz + 0.6, 0.015, 0.015, 1.3, 0x4a3226, {}, 4);
    k.box(X(-4.6), y, oz + 3.2, 1.2, 0.7, 0.9, wood, { wood: 1 }); for (let i = 0; i < 4; i++) candle(-4.9 + i * 0.2, 0.7, 3.2, 0.5, C[i + 1]); block(-4.6, 3.2, 1.4, 1.1);
    return [X(2.6), oz - 0.9]; },
  emberinn(h) { return innRoom(h, 0xa3182c, 0xe2b24a, 0xd9a05a); }, inn(h) { return innRoom(h, 0xff9ec0, 0xfff1d6, 0xfff6ee); },
  tailor({ k, X, oz, y, D, wood, accent, trim, block, circles }) { const F = [0xfff1d6, 0xf7a8c8, 0xa8d8f5, 0xc9a0f0, 0xfff3a8, 0xa8e8c4, 0xe85a6a];
    for (const [x, z, c] of [[-3.6, -2.6, 0], [-1.9, -3, 1], [3.9, 2.6, 2]]) { k.cyl(X(x), y, oz + z, 0.3, 0.36, 0.12, wood, {}, 10); k.cyl(X(x), y + 0.12, oz + z, 0.04, 0.04, 1, wood, {}, 6); k.cone(X(x), y + 0.6, oz + z, 0.55, 1.3, F[c], {}, 12); k.sph(X(x), y + 1.72, oz + z, 0.3, F[c], { s: [1.25, 0.6, 0.8] }); k.sph(X(x), y + 1.93, oz + z, 0.12, 0xfff6ee); k.torus(X(x), y + 1.86, oz + z, 0.3, 0.09, 0xffffff, { rx: Math.PI / 2 }); for (let b = 0; b < 2; b++) k.sph(X(x), y + 1.3 - b * 0.3, oz + z + 0.36, 0.06, 0xe8243c); circles.push([X(x), oz + z, 0.6]); }
    k.box(X(4.9), y, oz - 1.2, 0.7, 3.2, 4.2, wood); for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) k.cyl(X(4.62), y + 0.45 + r * 0.75, oz - 2.9 + i * 0.68, 0.2, 0.2, 0.55, F[(i + r) % 7], { rz: Math.PI / 2 }, 10); block(4.9, -1.2, 1, 4.4);
    k.box(X(1.8), y, oz + 0.4, 3, 0.95, 1.3, wood); k.box(X(1.8), y + 0.95, oz + 0.4, 3.2, 0.08, 1.5, 0xfff6ea); block(1.8, 0.4, 3.2, 1.5); k.box(X(1.2), y + 1.04, oz + 0.4, 1.6, 0.04, 1.1, F[1]); k.box(X(2.7), y + 1.04, oz + 0.4, 0.5, 0.3, 0.3, 0x55555c); k.cyl(X(2.7), y + 1.3, oz + 0.4, 0.14, 0.14, 0.06, 0x8a8a92, { rx: Math.PI / 2 }, 10); for (let i = 0; i < 4; i++) k.cyl(X(0.6 + i * 0.3), y + 1.04, oz + 0.85, 0.09, 0.09, 0.18, F[i + 2], {}, 8);
    k.box(X(-5.2), y + 0.4, oz + 1.2, 0.1, 2.6, 1.5, trim); k.box(X(-5.14), y + 0.5, oz + 1.2, 0.06, 2.4, 1.3, 0xd8f0ff, { glow: 1 });
    k.box(X(-1), y + 3.3, oz + 2.6, 5, 0.06, 0.06, trim); for (let i = 0; i < 9; i++) k.box(X(-3.2 + i * 0.55), y + 2.6, oz + 2.6, 0.08, 0.7, 0.02, F[i % 7]);
    k.cyl(X(-3.8), y, oz + 3.2, 0.5, 0.45, 0.5, accent, {}, 12); for (let i = 0; i < 5; i++) k.cyl(X(-3.8 + Math.cos(i * 1.26) * 0.25), y + 0.5, oz + 3.2 + Math.sin(i * 1.26) * 0.25, 0.1, 0.1, 0.9, F[i], {}, 8); circles.push([X(-3.8), oz + 3.2, 0.65]); k.sph(X(0), y + 3.1, oz + 0.6, 0.3, 0xffe4f0, { glow: 1 });
    return [X(1.8), oz - 0.9]; },
};
function innRoom({ k, X, oz, y, D, wood, trim, block, circles, sugar }, cloth, cup, keg) {
  k.box(X(3.4), y, oz - 1.6, 1, 1.1, 4.6, wood, { wood: !sugar }); k.box(X(3.4), y + 1.1, oz - 1.6, 1.25, 0.1, 4.9, sugar ? 0xfff6ee : 0x6b4a36); block(3.4, -1.6, 1.3, 4.9); for (let i = 0; i < 5; i++) { k.cyl(X(3.4), y + 1.2, oz - 3.5 + i * 0.9, 0.11, 0.09, 0.24, cup, {}, 8); if (i % 2) k.sph(X(3.4), y + 1.5, oz - 3.5 + i * 0.9, 0.1, sugar ? 0xffffff : 0xfff1d6); }
  for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) { k.cyl(X(5), y + 0.45 + r * 0.95, oz - 3.2 + i * 1.2, 0.45, 0.45, 0.8, keg, { rz: Math.PI / 2, wood: !sugar }, 12); k.torus(X(5), y + 0.45 + r * 0.95, oz - 3.2 + i * 1.2, 0.46, 0.03, trim, { ry: Math.PI / 2 }); } block(5, -2, 1, 3.8);
  for (const [x, z] of [[-3, 1.8], [-3.4, -2.2], [-0.2, -1.2]]) { k.cyl(X(x), y, oz + z, 0.12, 0.3, 0.75, wood, {}, 8); k.cyl(X(x), y + 0.75, oz + z, 0.85, 0.85, 0.09, wood, { wood: !sugar }, 14); k.cyl(X(x), y + 0.84, oz + z, 0.6, 0.6, 0.02, cloth, {}, 14); k.cyl(X(x), y + 0.86, oz + z, 0.07, 0.06, 0.2, 0xfff1d6, {}, 8); k.sph(X(x), y + 1.14, oz + z, 0.06, 0xffd060, { glow: 1 }); circles.push([X(x), oz + z, 0.95]);
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + x; k.cyl(X(x + Math.cos(a) * 1.25), y, oz + z + Math.sin(a) * 1.25, 0.26, 0.22, 0.5, sugar ? cloth : wood, { wood: !sugar }, 10); } }
  k.box(X(-5.2), y + 1.9, oz + 2.8, 0.1, 1.1, 1.6, wood); for (let i = 0; i < 6; i++) { k.sph(X(-5.1), y + 2.2 + (i % 2) * 0.4, oz + 2.2 + (i % 3) * 0.6, 0.06, trim); k.box(X(-5.1), y + 2.05 + (i % 2) * 0.4, oz + 2.2 + (i % 3) * 0.6, 0.03, 0.2, 0.05, 0xe2b24a); }
  k.box(X(-1.9), y + 2.9, oz - D / 2 + 0.18, 2.2, 0.9, 0.06, cloth); k.box(X(-1.9), y + 3, oz - D / 2 + 0.2, 1.8, 0.6, 0.06, cup);
  for (const sx of [-2.5, 2]) { k.cyl(X(sx), y + 3.2, oz + 1, 0.02, 0.02, 1, 0x4a3226, {}, 4); k.sph(X(sx), y + 3.1, oz + 1, 0.26, sugar ? 0xffe4f0 : 0xffc45a, { glow: 1 }); }
  return [X(2.2), oz - 1.6];
}

export function makeRoom(world, seed, kind) {
  if (!SHOP[kind]) kind = null; const sugar = world === 'sugar', KI = kind ? KINDS.indexOf(kind) : -1, v = seed % 4, key = world + (kind || v); let room = cache.get(key);
  if (!room) {
    const k = new Kit(), R = rnd(seed * 13 + 5), ox = 1000 + (KI >= 0 ? 4 + KI : v) * 60, oz = sugar ? 1400 : 1000, y = 300, W = 11, D = 9, hh = 4.3, f = v % 2 ? -1 : 1, X = (x) => ox + x * f, circles = [], boxes = [];
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
    let seat = null; if (kind) seat = SHOP[kind]({ k, X, ox, oz, y, W, D, hh, wall, accent, wood, trim, block, circles, sugar }); else {
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
    }
    const group = k.build(); group.traverse((o) => { if (o.isMesh) { o.userData.sh = 1; o.castShadow = false; o.receiveShadow = false; } });
    const light = new THREE.PointLight(sugar ? 0xfff0f6 : 0xffc080, 9, 20, 1.4); light.position.set(ox, y + 3, oz + 0.4); group.add(light);
    room = { room: true, group, y, cx: ox, cz: oz, x0: ox - W / 2 + 0.55, x1: ox + W / 2 - 0.55, z0: oz - D / 2 + 0.55, z1: oz + D / 2 - 0.55, ceil: y + hh, circles, boxes, spawn: [ox, oz + D / 2 - 1.7], exit: { x: ox, z: oz + D / 2 - 0.7, label: 'Go outside' }, seat: seat || [X(1.4), oz + 2.2] };
    cache.set(key, room);
  }
  const pick = kind ? KEEP[kind][0] : seed % 3 === 0 ? null : FOLK[world][seed % FOLK[world].length];
  return { ...room, resident: pick && { id: pick, line: kind ? KEEP[kind][1] : LINES[world][(seed >> 1) % LINES[world].length], x: room.seat[0], z: room.seat[1] }, has(x, z) { return x > this.x0 - 2 && x < this.x1 + 2 && z > this.z0 - 2 && z < this.z1 + 2; } };
}
export function deckZone(d) { // the top of a tower
  return { deck: true, y: d.y, cx: d.x, cz: d.z, r: d.r, circles: d.circles || [], boxes: [], spawn: [d.hatch[0] + (d.x - d.hatch[0]) * 0.35, d.hatch[1] + (d.z - d.hatch[1]) * 0.35], exit: { x: d.hatch[0], z: d.hatch[1], label: 'Climb down' }, has(x, z) { return Math.hypot(x - this.cx, z - this.cz) < this.r + 1.5; } };
}
