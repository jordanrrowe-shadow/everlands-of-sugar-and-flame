// DOM interface: touch + keyboard input, dialogue box, barks, journal.
import { CODEX } from './story/cast.js';
const $ = (id) => document.getElementById(id);
export const el = { $ };
const show = (e, on = true) => e.classList.toggle('hide', !on);
const showB = (e, on) => e.classList.toggle('hide', !on);

// ───────── input ─────────
export const input = { mx: 0, my: 0, lx: 0, ly: 0, flame: false, boost: false, pressed: new Set(), keys: new Set() };
export const hit = (name) => { const h = input.pressed.has(name); input.pressed.delete(name); return h; };
export function initInput(canvas) {
  const stick = $('stick'), knob = stick.firstElementChild;
  let moveId = null, lookId = null, ox = 0, oy = 0, lpx = 0, lpy = 0;
  const setKnob = (x, y) => { knob.style.transform = `translate(${x * 34}px,${y * 34}px)`; };
  canvas.addEventListener('pointerdown', (e) => {
    input.pressed.add('tap');
    const touch = e.pointerType !== 'mouse';
    if (touch && e.clientX < innerWidth * 0.42 && moveId === null) { moveId = e.pointerId; ox = e.clientX; oy = e.clientY; stick.style.left = ox - 56 + 'px'; stick.style.top = oy - 56 + 'px'; stick.style.bottom = 'auto'; }
    else if (lookId === null) { lookId = e.pointerId; lpx = e.clientX; lpy = e.clientY; }
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId === moveId) { let dx = (e.clientX - ox) / 46, dy = (e.clientY - oy) / 46; const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; } input.mx = dx; input.my = dy; setKnob(dx, dy); }
    else if (e.pointerId === lookId) { input.lx += e.clientX - lpx; input.ly += e.clientY - lpy; lpx = e.clientX; lpy = e.clientY; }
  });
  const up = (e) => { if (e.pointerId === moveId) { moveId = null; input.mx = input.my = 0; setKnob(0, 0); stick.style.left = stick.style.top = stick.style.bottom = ''; } if (e.pointerId === lookId) lookId = null; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  const btn = (id, name, hold) => { const b = $(id); b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); input.pressed.add(name); if (hold) input[hold] = true; b.classList.add('down'); }); const off = () => { if (hold) input[hold] = false; b.classList.remove('down'); }; b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); };
  btn('bAct', 'act'); btn('bJump', 'jump'); btn('bFlame', 'flameTap', 'flame'); btn('bWhistle', 'whistle'); btn('bBoost', 'boostTap', 'boost'); btn('bLand', 'land'); btn('bMed', 'med');
  const map = { KeyE: 'act', Enter: 'act', Space: 'jump', KeyQ: 'whistle', KeyL: 'land', KeyJ: 'journal', Escape: 'journal', KeyM: 'med' };
  addEventListener('keydown', (e) => { if (e.repeat) return; input.keys.add(e.code); if (map[e.code]) input.pressed.add(map[e.code]); if (e.code === 'Space' || e.code === 'Enter') input.pressed.add('tap'); if (e.code === 'KeyF') input.flame = true; if (e.code.startsWith('Shift')) input.boost = true; if (/^Digit[1-9]$/.test(e.code)) input.pressed.add('choice' + e.code.slice(5)); });
  addEventListener('keyup', (e) => { input.keys.delete(e.code); if (e.code === 'KeyF') input.flame = false; if (e.code.startsWith('Shift')) input.boost = false; });
  addEventListener('blur', () => { input.keys.clear(); input.flame = input.boost = false; });
  for (const ev of ['gesturestart', 'gesturechange', 'contextmenu', 'dblclick']) document.addEventListener(ev, (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => { if (!e.target.closest('#jBody,#dialog')) e.preventDefault(); }, { passive: false });
}
export function readMove() { // keyboard merged with stick
  const k = input.keys; let x = input.mx, y = input.my;
  if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1; if (k.has('KeyD') || k.has('ArrowRight')) x += 1; if (k.has('KeyW') || k.has('ArrowUp')) y -= 1; if (k.has('KeyS') || k.has('ArrowDown')) y += 1;
  const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } return [x, y];
}

// ───────── dialogue ─────────
const dlg = $('dialog'), dName = $('dName'), dText = $('dText'), dChoices = $('dChoices'), dNext = $('dNext');
let advance = null;
dlg.addEventListener('click', (e) => { if (!e.target.closest('#dChoices')) advance?.(); });
export const dialogOpen = () => !dlg.classList.contains('hide');
export function closeDialog() { show(dlg, false); }
export function say(name, text) {
  return new Promise((res) => {
    show(dlg); dName.textContent = name || ''; dText.className = name ? '' : 'narr'; dChoices.innerHTML = ''; show(dNext);
    let i = 0, done = false; dText.textContent = '';
    const t0 = performance.now(), tick = () => { if (done) return; i = Math.min(text.length, Math.floor((performance.now() - t0) / 14)); dText.textContent = text.slice(0, i); if (i < text.length) requestAnimationFrame(tick); else done = true; };
    tick(); input.pressed.delete('tap');
    advance = () => { if (!done) { done = true; dText.textContent = text; return; } advance = null; res(); };
    const poll = () => { if (!advance) return; if (hit('tap')) advance?.(); if (advance) requestAnimationFrame(poll); }; requestAnimationFrame(poll);
  });
}
export function choose(opts, prompt) { // opts: [{t, cls}]
  return new Promise((res) => {
    show(dlg); show(dNext, false); advance = null;
    if (prompt !== undefined) { dName.textContent = ''; dText.className = 'narr'; dText.textContent = prompt; }
    dChoices.innerHTML = '';
    let live = true; const pick = (i) => { if (!live) return; live = false; dChoices.innerHTML = ''; res(i); };
    opts.forEach((o, i) => { const b = document.createElement('button'); b.textContent = o.t; if (o.cls) b.className = o.cls; b.onclick = () => pick(i); dChoices.appendChild(b); });
    for (let i = 1; i <= 9; i++) input.pressed.delete('choice' + i);
    const poll = () => { if (!live) return; for (let i = 0; i < opts.length; i++) if (hit('choice' + (i + 1))) return pick(i); requestAnimationFrame(poll); }; requestAnimationFrame(poll);
    dlg.scrollTop = dlg.scrollHeight;
  });
}
export function bark(name, text, secs) {
  const p = document.createElement('p'); if (name) { const b = document.createElement('b'); b.textContent = name; p.appendChild(b); } p.appendChild(document.createTextNode(text));
  const box = $('bark'); box.appendChild(p); while (box.children.length > 2) box.firstChild.remove();
  setTimeout(() => p.remove(), (secs || Math.max(4, text.length * 0.06)) * 1000);
}
let tipT = 0;
export function tip(text, secs = 7) { const t = $('tip'); t.textContent = text; show(t); clearTimeout(tipT); tipT = setTimeout(() => show(t, false), secs * 1000); }
export function fade(on, text = '', white = false) { const f = $('fade'); f.classList.toggle('white', white); $('fadeText').textContent = text; f.classList.toggle('on', on); return new Promise((r) => setTimeout(r, 650)); }
export function card(num, title, quote, tapText) {
  return new Promise((res) => { const c = $('card'); $('cardNum').textContent = num; $('cardTitle').textContent = title; $('cardQuote').textContent = quote || ''; show(c); const done = () => { c.removeEventListener('click', done); show(c, false); res(); }; setTimeout(() => c.addEventListener('click', done), 500); const poll = () => { if (c.classList.contains('hide')) return; if (hit('tap')) return done(); requestAnimationFrame(poll); }; setTimeout(() => { input.pressed.delete('tap'); poll(); }, 600); });
}
export function image(name) { return new Promise((res) => { const b = $('img'); b.firstElementChild.src = `/art/${name}.jpg`; show(b); const done = () => { b.removeEventListener('click', done); show(b, false); res(); }; setTimeout(() => b.addEventListener('click', done), 300); const poll = () => { if (b.classList.contains('hide')) return; if (hit('tap')) return done(); requestAnimationFrame(poll); }; setTimeout(() => { input.pressed.delete('tap'); poll(); }, 400); }); }
export function qte(label) { return new Promise((res) => { const q = $('qte'), b = $('qteBtn'); b.textContent = label; show(q); const done = () => { b.onclick = null; show(q, false); res(); }; b.onclick = done; input.pressed.clear(); const poll = () => { if (q.classList.contains('hide')) return; if (hit('tap')) return done(); requestAnimationFrame(poll); }; requestAnimationFrame(poll); }); }

// ───────── HUD ─────────
export function setGoal(chap, text, pulse) { $('chap').textContent = chap; $('goalText').textContent = text; if (pulse) { const g = $('goal'); g.classList.remove('pulse'); void g.offsetWidth; g.classList.add('pulse'); } }
export function setMeter(type, v) { const m = $('meter'); show(m, !!type); if (!type) return; m.classList.toggle('heat', type === 'heat'); $('meterLabel').textContent = type === 'cold' ? (v < 0.3 ? 'Shivering' : 'Cold') : (v < 0.3 ? 'Far too hot' : 'Too warm'); $('meterFill').style.width = Math.round(v * 100) + '%'; }
export function setHearts(n, show, hurt) { const h = $('hearts'); showB(h, show); if (!show) return; if (h.children.length !== 3) h.innerHTML = '<i></i><i></i><i></i>'; [...h.children].forEach((e, i) => e.classList.toggle('off', i >= n)); if (hurt) { h.classList.remove('hurt'); void h.offsetWidth; h.classList.add('hurt'); } }
export function setAct(label) { const b = $('bAct'); show(b, !!label); if (label && b.textContent !== label) b.textContent = label; }
export function setButtons(o) { showB($('bJump'), o.jump); showB($('bFlame'), o.flame); $('bFlame').classList.toggle('kim', !!o.kim); showB($('bWhistle'), o.whistle); showB($('bBoost'), o.boost); showB($('bLand'), o.land); showB($('bMed'), o.med); }
export function playUI(on) { show($('hud'), on); show($('controls'), on); }
export function controlsVisible(on) { show($('controls'), on); }

// ───────── journal ─────────
export function initJournal(G) {
  const j = $('journal'), body = $('jBody'); let tab = 'quest', hintShown = false;
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const render = () => {
    const S = G.S, ch = G.chapter; let h = '';
    if (tab === 'quest') {
      const st = G.curStep();
      h += `<h3>Chapter ${ch.n > 17 ? '∞' : ch.n} · ${esc(ch.title)}</h3><div class="goal">${esc(st ? st.goal : 'The end.')}</div>`;
      if (st?.hint) h += hintShown ? `<div class="hintBox">${esc(st.hint)}</div>` : `<button class="btn" id="jHint">I’m stuck. Give me a nudge</button>`;
      h += `<h3>What people have told you</h3>` + (S.leads.length ? `<ul>${S.leads.slice().reverse().map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : '<p><i>Nothing yet. Talk to people, and ask them things.</i></p>');
      h += `<h3>Carrying</h3><p>${Object.keys(S.items).filter((k) => S.items[k]).map((k) => ITEMS[k] || k).join(' · ') || '<i>Nothing but your own name and a wish to be liked.</i>'}</p>`;
      if (S.sparks) h += `<h3>Fire bending</h3><p>Cinders gathered: <b>${S.sparks}</b>. Tap ✦ for a fire bolt, hold ✦ near something to light it, or hold and release for a flare. Ash wisps and frost puffs fight back: you have three flames, and ❋ Meditate rekindles them when you are somewhere quiet.</p>`;
      h += `<h3>How to play</h3><p>Left thumb moves. Drag the right side to look around. ◆ talks to people and examines things. There are no map markers. Listen to what people say; your leads are kept here.</p>`;
    } else if (tab === 'keeps') {
      for (const [id, c] of Object.entries(CODEX)) h += S.codex.includes(id) ? `<div class="keep"><b>${esc(c.title)}</b><br>${esc(c.text)}${c.img ? `<img src="/art/${c.img}.jpg" alt="">` : ''}</div>` : `<div class="keep locked">A keepsake not yet found…</div>`;
    } else if (tab === 'chapters') {
      h += '<p><i>Replay any chapter you have reached. Your place in the story is kept.</i></p>';
      for (const c of G.chapters) { const open = c.n <= S.max; h += `<button class="chapRow ${open ? '' : 'locked'} ${c.n === S.ch ? 'cur' : ''}" data-ch="${open ? c.n : ''}"><small>${c.n > 17 ? '∞' : c.n}</small><span>${open ? esc(c.title) : '· · ·'}</span></button>`; }
    } else {
      const o = S.opt;
      h += `<label><input type="checkbox" id="oSound" ${o.sound ? 'checked' : ''}> Music &amp; sound</label><label><input type="checkbox" id="oInv" ${o.invert ? 'checked' : ''}> Flying: pull back to climb</label><label><input type="checkbox" id="oSens" ${o.fast ? 'checked' : ''}> Faster camera</label><label><input type="checkbox" id="oFx" ${o.fx !== false ? 'checked' : ''}> Shadows &amp; glow (turn off if the game feels slow)</label><label><input type="checkbox" id="oCape" ${o.cape !== false ? 'checked' : ''}> Amber wears her cape</label>`;
      h += `<h3>Save</h3><p>The story saves itself on this device after every conversation and discovery.</p><button class="btn" id="oTitle">Back to title</button><button class="btn" id="oReset">Erase save…</button>`;
      h += `<h3>About</h3><p><i>The Everlands: Of Sugar and Flame</i>, from the book by Elisa Espinosa Ruiz. Every line of dialogue comes from her pages.</p>`;
    }
    body.innerHTML = h; body.scrollTop = 0;
    $('jHint')?.addEventListener('click', () => { hintShown = true; render(); });
    body.querySelectorAll('.chapRow').forEach((b) => b.addEventListener('click', () => { const n = +b.dataset.ch; if (!n || n === S.ch) return; if (confirm(`Go to Chapter ${n > 17 ? '∞' : n}? Your progress in the current chapter will restart.`)) { close(); G.startChapter(n, true); } }));
    $('oSound')?.addEventListener('change', (e) => { S.opt.sound = e.target.checked; G.applyOptions(); }); $('oInv')?.addEventListener('change', (e) => { S.opt.invert = e.target.checked; G.save(); }); $('oSens')?.addEventListener('change', (e) => { S.opt.fast = e.target.checked; G.save(); });
    $('oFx')?.addEventListener('change', (e) => { S.opt.fx = e.target.checked; G.save(); }); $('oCape')?.addEventListener('change', (e) => { S.opt.cape = e.target.checked; G.save(); G.refresh(); }); $('oTitle')?.addEventListener('click', () => location.reload());
    $('oReset')?.addEventListener('click', () => { if (confirm('Erase all progress on this device?')) { G.erase(); location.reload(); } });
  };
  const open = () => { if (G.busy && dialogOpen()) return; hintShown = false; tab = 'quest'; sync(); show(j); G.paused = true; render(); };
  const close = () => { show(j, false); G.paused = false; };
  const sync = () => j.querySelectorAll('nav button[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  j.querySelectorAll('nav button[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; sync(); render(); }));
  $('jClose').addEventListener('click', close); $('menuBtn').addEventListener('click', open); $('hintBtn').addEventListener('click', () => G.showHint()); $('goal').addEventListener('click', open);
  j.addEventListener('click', (e) => { if (e.target === j) close(); });
  return { open, close, toggle: () => (j.classList.contains('hide') ? open() : close()) };
}
const ITEMS = { buns: 'Honey buns', lantern: 'A Fireside Memory', whistle: 'The ruby whistle', spyglass: 'Mother’s spyglass', stillbloom: 'A bottle of Stillbloom', shades: 'Paper sunshades' };
