// Illustrated cut scenes: painted portraits over a painted backdrop, visual-novel style.
// A scene is a list inside { cut: [...] }:
//   { bg: 'room' }                         change the backdrop (cross-fades)
//   { amber: 'smile' } / { kim: null }     show a portrait with an expression, or hide it
//   { tira: 'happy' }                      Tira (happy|startled|asleep, or null); she appears by herself whenever Kim does
//   ['Amber', 'text']                      a spoken line (voiced like any other line); 'text' alone is narration
// Portraits: amber smile|worried|fierce|laugh · kim smile|shy|amazed|laugh · ruby soft|curious|happy
//            king smile|grave|proud · praline smile|fuss|coat.   Backdrops are in public/art/cut.
const $ = (id) => document.getElementById(id);
export const WHO = { Amber: 'amber', Kim: 'kim', 'Kimbrûlée': 'kim', Ruby: 'ruby', 'The King': 'king', 'Madame Praline': 'praline' };
const CAST = ['amber', 'kim', 'ruby', 'king', 'praline'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Creatures the story mentions appear in the scene as it does: [what the line says, the picture].
const CREATURES = [[/\bCinder\b|emberwing|\bhound\b/i, '/art/cut/creature-cinder.webp'], [/bonbon sprite|\bsprite\b/i, '/art/cut/creature-sprite.webp'], [/turtle/i, '/art/sprite/turtle.webp'], [/\bcat\b|\bkitten\b|purr/i, '/art/cut/creature-cat.webp'], [/\bfish\b/i, '/art/sprite/fish.webp'], [/butterfl/i, '/art/sprite/butterfly.webp']];
const creatureIn = (line) => CREATURES.find(([re]) => re.test(line))?.[1];
// Amber's portraits follow what she is wearing (the cream coat), and Kim's follow her tiramisu outfit once she has it.
const art = (c, mood, G) => `/art/cut/${c === 'amber' && G?.f?.coat && !G.f.coatOff ? 'amber-coat' : c === 'kim' && G?.S?.vis?.kimTira && G.S.opt.tira !== false ? 'kim-tira' : c}-${mood}.webp`;
export function preloadCut(list, G) { for (const n of list) { if (n?.bg) new Image().src = `/art/cut/bg-${n.bg}.jpg`; for (const k of [...CAST, 'tira']) if (n?.[k]) new Image().src = art(k, n[k], G); } }
export async function playCut(list, G) {
  const box = $('cut'), layers = [$('cutA'), $('cutB')], name = $('cutName'), text = $('cutText'); let top = 0, skip = false, next = null, typing = null;
  const slot = { cutL: null, cutR: null }, where = (c) => (slot.cutL === c ? 'cutL' : slot.cutR === c ? 'cutR' : null);
  preloadCut(list, G); for (const l of layers) { l.style.backgroundImage = ''; l.classList.remove('on'); } for (const id of ['cutL', 'cutR']) $(id).className = 'cutP'; $('cutBox').classList.add('hide'); const tira = $('cutT'); tira.className = ''; const beast = $('cutC'); beast.className = ''; let beastN = 0; const ownTira = list.some((n) => n && typeof n === 'object' && !Array.isArray(n) && 'tira' in n);
  const setTira = (m) => { if (m) { tira.src = `/art/cut/tira-${m}.webp`; tira.classList.add('in'); } else tira.classList.remove('in'); };
  const layout = () => box.classList.toggle('solo', !!slot.cutL !== !!slot.cutR);
  const show = (c, mood) => { // Amber keeps the left; whoever she is talking to takes the right
    let id = where(c); if (!mood) { if (id) { $(id).classList.remove('in'); slot[id] = null; } return layout(); }
    if (!id) { const pref = c === 'amber' ? 'cutL' : 'cutR', other = pref === 'cutL' ? 'cutR' : 'cutL'; id = !slot[pref] ? pref : !slot[other] && c !== 'amber' ? other : pref; slot[id] = c; }
    const el = $(id), src = art(c, mood, G); if (el.dataset.src !== src) { el.dataset.src = src; el.src = src; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } el.classList.add('in'); el.classList.toggle('flip', id === 'cutL' ? c !== 'amber' : c === 'amber'); layout(); };
  box.classList.remove('hide'); await wait(30); box.classList.add('on');
  const advance = (e) => { e?.preventDefault?.(); if (typing) { typing(); return; } const n = next; next = null; n?.(); };
  const key = (e) => { if (['Space', 'Enter', 'KeyE'].includes(e.code)) advance(e); };
  const onSkip = (e) => { e.stopPropagation(); skip = true; typing?.(); const n = next; next = null; n?.(); };
  box.addEventListener('click', advance); addEventListener('keydown', key); $('cutSkip').addEventListener('click', onSkip);
  try {
    for (const n of list) {
      if (skip || !n) break;
      if (typeof n === 'string' || Array.isArray(n)) {
        const who = Array.isArray(n) ? n[0] : '', line = Array.isArray(n) ? n[1] : n, k = WHO[who];
        for (const id of ['cutL', 'cutR']) { $(id).classList.toggle('talk', !!k && slot[id] === k); $(id).classList.toggle('dim', !!who && slot[id] !== k); }
        { const cr = creatureIn(line); if (cr) { if (beast.dataset.src !== cr) { beast.dataset.src = cr; beast.src = cr; } beast.classList.remove('in'); void beast.offsetWidth; beast.classList.add('in'); beastN = 0; G.sound.sfx('boing'); } else if (beast.classList.contains('in') && ++beastN > 7) beast.classList.remove('in'); if (/\bTira\b/.test(line) && !tira.classList.contains('in')) setTira('happy'); }
        tira.classList.toggle('dim', !!who); box.classList.toggle('focusL', !!k && slot.cutL === k); box.classList.toggle('focusR', !!k && slot.cutR === k);
        name.textContent = who; text.classList.toggle('narr', !who); $('cutBox').classList.remove('hide'); G.sound.sfx('page'); if (who) G.voice(who, line);
        await new Promise((res) => { let i = 0; const fast = G.noRender; const done = () => { clearInterval(iv); typing = null; text.textContent = line; res(); }; typing = done; const iv = setInterval(() => { i += 2; text.textContent = line.slice(0, i); if (i >= line.length) done(); }, 22); if (fast) done(); });
        if (skip) break; await new Promise((res) => { next = res; }); G.voiceEl?.pause(); continue;
      }
      if (n.bg) { const l = layers[(top ^= 1)]; l.style.backgroundImage = `url(/art/cut/bg-${n.bg}.jpg)`; l.classList.add('on'); layers[top ^ 1].classList.remove('on'); await wait(G.noRender ? 0 : 700); }
      for (const c of CAST) if (c in n) { show(c, n[c]); if (c === 'kim' && !ownTira) setTira(n[c] ? (n[c] === 'amazed' ? 'startled' : 'happy') : null); }
      if ('tira' in n) setTira(n.tira);
    }
  } finally { box.removeEventListener('click', advance); removeEventListener('keydown', key); $('cutSkip').removeEventListener('click', onSkip); G.voiceEl?.pause(); beast.classList.remove('in'); box.classList.remove('on'); await wait(G.noRender ? 0 : 500); box.classList.add('hide'); }
}
