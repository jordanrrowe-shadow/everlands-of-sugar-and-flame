// The Emberian cradle, after the painting: a bowl and domed canopy of golden glass bound in gold filigree, a flame at the crown and
// another on the front, a cream cushion, a crimson blanket and a small plush dragon inside. Built round, then stretched into its oval.
import * as THREE from 'three';

export function makeCradle() {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xf0bf52, metalness: 0.85, roughness: 0.28, emissive: 0x7a5210, emissiveIntensity: 0.45 });
  const glass = (op) => new THREE.MeshStandardMaterial({ color: 0xffd28a, transparent: true, opacity: op, roughness: 0.08, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false, emissive: 0xffa850, emissiveIntensity: 0.22 });
  const soft = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, metalness: 0 });
  const fire = (c) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.8) });
  const add = (geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; };
  const ring = (r, t, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, 8, 40, arc);
  const ball = new THREE.SphereGeometry(1, 20, 14), cone = new THREE.ConeGeometry(1, 1, 10);

  // inside first, so the glass draws over it: cushion, bolster, pillow, blanket, the plush dragon
  add(ball, soft(0xfff3df), 0, -0.36, 0, 0.82, 0.2, 0.74);
  add(ring(0.62, 0.17), soft(0xfbe9cf), 0, -0.2, 0, 1, 1, 0.42).rotation.x = Math.PI / 2;
  add(ball, soft(0xfff3df), -0.55, -0.02, 0, 0.3, 0.26, 0.5);
  add(ball, soft(0x9a1826), 0.3, -0.16, 0.02, 0.46, 0.13, 0.52);
  add(ball, soft(0x7d1220), 0.5, -0.24, 0.3, 0.3, 0.14, 0.34);
  add(cone, gold, 0.3, -0.02, 0.2, 0.05, 0.1, 0.02);
  const red = soft(0xb8242e);
  add(ball, red, -0.3, 0.02, 0.16, 0.1, 0.11, 0.09); add(ball, red, -0.2, 0.12, 0.2, 0.07, 0.065, 0.075);
  add(cone, red, -0.24, 0.2, 0.2, 0.02, 0.06, 0.02); add(cone, red, -0.17, 0.2, 0.2, 0.02, 0.06, 0.02);
  for (const sx of [-1, 1]) { const w = add(cone, soft(0xe9a23b), -0.34, 0.08, 0.16 + sx * 0.09, 0.07, 0.14, 0.02); w.rotation.set(sx * 0.9, 0, 0.5); }
  add(ball, soft(0xf6d7a8), -0.27, 0, 0.24, 0.05, 0.06, 0.03);

  // glass bowl and canopy
  add(new THREE.SphereGeometry(1, 36, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glass(0.46), 0, 0, 0, 1, 0.78, 1).renderOrder = 2;
  add(new THREE.SphereGeometry(1, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), glass(0.34), 0, 0.04, 0, 1, 0.82, 1).renderOrder = 3;

  // gold: the two rims, the foot, the canopy ribs and their curls
  for (const [yy, t] of [[0, 0.04], [0.07, 0.022]]) add(ring(1.005, t), gold, 0, yy, 0).rotation.x = Math.PI / 2;
  add(ring(0.5, 0.05), gold, 0, -0.76, 0).rotation.x = Math.PI / 2;
  add(ring(0.62, 0.02), gold, 0, -0.66, 0).rotation.x = Math.PI / 2;
  [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4].forEach((ry, i) => { const m = add(ring(1.0, i < 2 ? 0.022 : 0.012, Math.PI), gold, 0, 0.06, 0, 1, 0.82, 1); m.rotation.y = ry; });
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2, m = add(ring(0.2, 0.014), gold, Math.sin(a) * 0.68, 0.56, Math.cos(a) * 0.68); m.lookAt(Math.sin(a) * 3, 2.2, Math.cos(a) * 3);
    const c = add(ring(0.1, 0.012, Math.PI * 1.5), gold, Math.sin(a) * 0.86, 0.36, Math.cos(a) * 0.86); c.lookAt(Math.sin(a) * 3, 1.1, Math.cos(a) * 3);
  }
  // gold: a band of pointed leaves round the bowl, with curls and beads between them
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5, x = Math.sin(a) * 0.93, z = Math.cos(a) * 0.93;
    const leaf = add(ring(0.24, 0.02, Math.PI), gold, x, -0.34, z); leaf.rotation.set(0, a, 0); leaf.rotateX(-0.36);
    add(cone, gold, Math.sin(a) * 0.99, -0.06, Math.cos(a) * 0.99, 0.035, 0.16, 0.02).rotation.y = a;
    const b = a + Math.PI / 10, curl = add(ring(0.1, 0.014, Math.PI * 1.4), gold, Math.sin(b) * 0.9, -0.4, Math.cos(b) * 0.9); curl.rotation.set(0, b, Math.PI * 0.8); curl.rotateX(-0.4);
    add(ball, gold, Math.sin(b) * 0.84, -0.52, Math.cos(b) * 0.84, 0.03);
  }
  // the two flames: the crown and the front
  add(ball, gold, 0, 0.88, 0, 0.09, 0.07, 0.09);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, p = add(cone, gold, Math.sin(a) * 0.12, 0.9, Math.cos(a) * 0.12, 0.03, 0.2, 0.03); p.rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9); }
  const flames = [add(cone, fire(0xff5a14), 0, 1.1, 0, 0.085, 0.34, 0.06), add(cone, fire(0xffc23a), 0, 1.05, 0, 0.045, 0.22, 0.035)];
  add(ring(0.13, 0.016), gold, 0, -0.3, 0.99, 0.8, 1.25, 1);
  flames.push(add(cone, fire(0xff5a14), 0, -0.28, 1.01, 0.06, 0.24, 0.03), add(cone, fire(0xffc23a), 0, -0.31, 1.02, 0.03, 0.15, 0.02));
  for (const m of flames) m.userData.sy = m.scale.y;
  g.scale.set(1.95, 1.36, 1.4); g.userData.flames = flames;
  return g;
}
