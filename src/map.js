// Mini-map and journal map. Places appear once you have been there (or been told about them); until then they are unnamed dots.
export const PLACES = {
  ember: [['market', 'Morning Market', 0, 58], ['square', 'The Fire Square', 0, 86], ['stair', 'The Great Stair', 0, 36], ['hall', 'Great Hall', 0, -15], ['king', 'The King’s Chamber', 0, -35], ['learn', 'Hall of Learning', -31, -14], ['archive', 'The Archive', -47, -29], ['room', 'Amber’s Room', -32, -45], ['regent', 'The Regent’s Chambers', 46, -23], ['terrace', 'Dragon Terrace', -18, -62], ['garden', 'The Queen’s Garden', -82, 8], ['gate', 'Mountain Gate', 0, -90], ['overlook', 'The Overlook', 26, -150], ['quay', 'Harbour Quay', 124, 36]],
  sugar: [['market', 'Confectioners’ Market', 0, 16], ['fountain', 'Syrup Fountain', 0, 23], ['signpost', 'Lollipop Signpost', 1, 63], ['praline', 'Madame Praline’s', -18, 44], ['workshop', 'The Confectionery', 34, -3], ['house', 'Kim’s House', 60, -22], ['balloon', 'Balloon Meadow', -36, -4], ['meadows', 'Marshmallow Meadows', 112, 30], ['lift', 'Licorice Lift', 0, -92], ['summit', 'Ice Cream Summit', 0, -160], ['sweetlake', 'Sweetlake', 84, -66], ['choc', 'Chocolate Lake', -110, 22], ['forest', 'Peppermint Forest', 0, 118], ['clearing', 'Ruby’s Clearing', 3, 142], ['strawberry', 'Strawberry Lake', -32, 124], ['cave', 'Ruby’s Cave', -44, 142], ['dock', 'The Dock', 152, 100]],
};
const COL = { ember: ['#3a1218', '#6a2a22', '#e8d8b8', '#ffb030', '#ffd98a'], sugar: ['#bfe8c8', '#e8f8e0', '#fff6fb', '#f0569a', '#a83a66'], sea: ['#14263c', '#2a4a6a', '#9ad0f5', '#d8f0ff', '#d8f0ff'] };
export function discover(G, dt) {
  const W = G.W, p = G.riding ? G.ruby : G.player, S = G.S, got = (S.places ||= {}); if (!PLACES[W.name] || G.zone) return;
  for (const [k, name, x, z] of PLACES[W.name]) { const id = W.name + ':' + k; if (!got[id] && Math.hypot(p.x - x, p.z - z) < (G.riding ? 30 : 15)) { got[id] = 1; if (G.started && !G.busy) G.toast?.('Discovered: ' + name); } }
}
function draw(ctx, size, G, cx, cz, range, labels) {
  const W = G.W, c = COL[W.name] || COL.ember, got = G.S.places || {}, k = size / (range * 2), X = (x) => size / 2 + (x - cx) * k, Y = (z) => size / 2 - (z - cz) * k; // north (−z … the palace, the mountains) is up
  ctx.clearRect(0, 0, size, size); ctx.fillStyle = c[0]; ctx.fillRect(0, 0, size, size);
  if (W.sea) { ctx.fillStyle = c[1]; ctx.fillRect(0, 0, size, size); return; }
  const b = W.bounds; ctx.fillStyle = c[1]; ctx.beginPath(); ctx.roundRect(X(b[0]), Y(b[3]), (b[1] - b[0]) * k, (b[3] - b[2]) * k, 14 * k); ctx.fill();
  ctx.fillStyle = c[2] + '55'; for (const q of W.boxes) { const w = (q[1] - q[0]) * k, h = (q[3] - q[2]) * k; if (w > 1.2 && h > 1.2) ctx.fillRect(X(q[0]), Y(q[3]), w, h); }
  for (const q of W.circles) if (q[2] > 3) { ctx.beginPath(); ctx.arc(X(q[0]), Y(q[1]), q[2] * k, 0, 7); ctx.fill(); }
  ctx.textAlign = 'center'; ctx.font = `600 ${Math.max(10, size / 46)}px Georgia, serif`;
  for (const [key, name, x, z] of PLACES[W.name] || []) { const on = got[W.name + ':' + key], px = X(x), py = Y(z); if (px < -20 || py < -20 || px > size + 20 || py > size + 20) continue;
    ctx.beginPath(); ctx.arc(px, py, on ? Math.max(3.500, size / 70) : Math.max(2, size / 130), 0, 7); ctx.fillStyle = on ? c[3] : c[2] + '66'; ctx.fill(); if (on) { ctx.lineWidth = 1.500; ctx.strokeStyle = '#fff'; ctx.stroke(); if (labels) { ctx.fillStyle = c[4]; ctx.strokeStyle = c[0]; ctx.lineWidth = 3; ctx.strokeText(name, px, py - size / 48); ctx.fillText(name, px, py - size / 48); } } }
  const st = G.curStep?.(), t = G.trail?.t > 0 ? G.trail.target : null; if (t) { ctx.beginPath(); ctx.arc(X(t.x), Y(t.z), size / 40, 0, 7); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]); }
  if (G.ruby?.model.visible && !G.riding) { ctx.fillStyle = '#ff3048'; ctx.beginPath(); ctx.arc(X(G.ruby.x), Y(G.ruby.z), size / 60, 0, 7); ctx.fill(); }
  const p = G.riding ? G.ruby : G.player, yaw = p.yaw || 0; ctx.save(); ctx.translate(X(p.x), Y(p.z)); ctx.rotate(Math.PI - yaw); const a = Math.max(6, size / 24); ctx.beginPath(); ctx.moveTo(0, a); ctx.lineTo(a * 0.65, -a * 0.7); ctx.lineTo(0, -a * 0.3); ctx.lineTo(-a * 0.65, -a * 0.7); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.strokeStyle = c[0]; ctx.lineWidth = 2; ctx.fill(); ctx.stroke(); ctx.restore();
}
export function drawMini(canvas, G) { const p = G.riding ? G.ruby : G.player; draw(canvas.getContext('2d'), canvas.width, G, p.x, p.z, G.riding ? 110 : 62, false); }
export function drawFull(canvas, G) { const b = G.W.bounds || [-150, 150, -170, 170], cx = (b[0] + b[1]) / 2, cz = (b[2] + b[3]) / 2; draw(canvas.getContext('2d'), canvas.width, G, cx, cz, Math.max(b[1] - b[0], b[3] - b[2]) / 2 + 12, true); }
