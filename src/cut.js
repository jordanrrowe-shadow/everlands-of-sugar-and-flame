// Illustrated cut scenes: painted portraits of Amber and Kim over a painted backdrop, visual-novel style.
// A scene is a list inside { cut: [...] }:
//   { bg: 'room' }                         change the backdrop (cross-fades)
//   { amber: 'smile' } / { kim: null }     show a portrait with an expression, or hide it
//   { tira: 'happy' }                      Tira (happy|startled|asleep, or null); she appears by herself whenever Kim does
//   ['Amber', 'text']                      a spoken line (voiced like any other line); 'text' alone is narration
// Expressions: amber smile|worried|fierce|laugh, kim smile|shy|amazed|laugh. Backdrops are in public/art/cut.
const $ = (id) => document.getElementById(id);
const SIDE = { amber: 'cutL', kim: 'cutR' }, WHO = { Amber: 'amber', Kim: 'kim', 'Kimbrûlée': 'kim' };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export function preloadCut(list) { for (const n of list) { if (n?.bg) new Image().src = `/art/cut/bg-${n.bg}.jpg`; for (const k of ['amber', 'kim', 'tira']) if (n?.[k]) new Image().src = `/art/cut/${k}-${n[k]}.webp`; } }
export async function playCut(list, G) {
  const box = $('cut'), layers = [$('cutA'), $('cutB')], name = $('cutName'), text = $('cutText'); let top = 0, skip = false, next = null, typing = null;
  preloadCut(list); for (const l of layers) { l.style.backgroundImage = ''; l.classList.remove('on'); } for (const id of Object.values(SIDE)) $(id).className = 'cutP'; $('cutBox').classList.add('hide'); const tira = $('cutT'); tira.className = ''; const ownTira = list.some((n) => n && typeof n === 'object' && !Array.isArray(n) && 'tira' in n);
  const setTira = (m) => { if (m) { tira.src = `/art/cut/tira-${m}.webp`; tira.classList.add('in'); } else tira.classList.remove('in'); };
  box.classList.remove('hide'); await wait(30); box.classList.add('on');
  const advance = (e) => { e?.preventDefault?.(); if (typing) { typing(); return; } const n = next; next = null; n?.(); };
  const key = (e) => { if (['Space', 'Enter', 'KeyE'].includes(e.code)) advance(e); };
  const onSkip = (e) => { e.stopPropagation(); skip = true; typing?.(); const n = next; next = null; n?.(); };
  box.addEventListener('click', advance); addEventListener('keydown', key); $('cutSkip').addEventListener('click', onSkip);
  const shown = () => Object.entries(SIDE).filter(([, id]) => $(id).classList.contains('in')).length;
  const layout = () => box.classList.toggle('solo', shown() === 1);
  try {
    for (const n of list) {
      if (skip || !n) break;
      if (typeof n === 'string' || Array.isArray(n)) {
        const who = Array.isArray(n) ? n[0] : '', line = Array.isArray(n) ? n[1] : n, k = WHO[who];
        for (const [c, id] of Object.entries(SIDE)) { $(id).classList.toggle('talk', c === k); $(id).classList.toggle('dim', !!who && c !== k); }
        name.textContent = who; text.classList.toggle('narr', !who); $('cutBox').classList.remove('hide'); G.sound.sfx('page'); if (who) G.voice(who, line);
        await new Promise((res) => { let i = 0; const fast = G.noRender; const done = () => { clearInterval(iv); typing = null; text.textContent = line; res(); }; typing = done; const iv = setInterval(() => { i += 2; text.textContent = line.slice(0, i); if (i >= line.length) done(); }, 22); if (fast) done(); });
        if (skip) break; await new Promise((res) => { next = res; }); G.voiceEl?.pause(); continue;
      }
      if (n.bg) { const l = layers[(top ^= 1)]; l.style.backgroundImage = `url(/art/cut/bg-${n.bg}.jpg)`; l.classList.add('on'); layers[top ^ 1].classList.remove('on'); await wait(G.noRender ? 0 : 700); }
      for (const [c, id] of Object.entries(SIDE)) if (c in n) { const el = $(id); if (n[c]) { el.src = `/art/cut/${c}-${n[c]}.webp`; el.classList.add('in'); } else el.classList.remove('in'); layout(); if (c === 'kim' && !ownTira) setTira(n[c] ? (n[c] === 'amazed' ? 'startled' : 'happy') : null); }
      if ('tira' in n) setTira(n.tira);
    }
  } finally { box.removeEventListener('click', advance); removeEventListener('keydown', key); $('cutSkip').removeEventListener('click', onSkip); G.voiceEl?.pause(); box.classList.remove('on'); await wait(G.noRender ? 0 : 500); box.classList.add('hide'); }
}
