import { Game } from './game.js';
import * as UI from './ui.js';
window.__ui = UI;
const $ = (id) => document.getElementById(id);
const G = (window.__game = new Game($('c')));
$('loading').classList.add('hide');
if (G.hasSave()) $('tContinue').classList.remove('hide');
const go = async (fresh) => {
  if (fresh && G.hasSave() && !confirm('Start a new story? Your saved progress will be replaced.')) return;
  $('title').classList.add('hide'); await G.begin(fresh);
};
$('tContinue').addEventListener('click', () => go(false));
$('tNew').addEventListener('click', () => go(true));
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
// debug helpers: ?ch=7 jumps to a chapter
const q = new URLSearchParams(location.search);
if (q.get('ch')) { $('title').classList.add('hide'); G.started = true; G.sound.setOn(false); G.startChapter(+q.get('ch')); }

// Fill the whole screen on phones and tablets. A home-screen launch reports a window shorter than the screen, so the full-screen
// layers are sized from the largest height the device admits to, and drawn a little past the bottom edge for good measure.
{ const touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1, probe = document.createElement('div'); probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:100vh;height:100lvh;visibility:hidden;pointer-events:none'; document.documentElement.appendChild(probe);
  const fit = () => { if (!touch) return; const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches, land = innerWidth > innerHeight, sh = land ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
    const h = Math.max(innerHeight, document.documentElement.clientHeight, probe.getBoundingClientRect().height || 0, standalone ? sh : 0); document.documentElement.style.setProperty('--fullh', Math.ceil(h) + 'px'); document.documentElement.classList.add('fullh'); dispatchEvent(new Event('fullh')); };
  // iOS sometimes lays a home-screen app out a status-bar short until the viewport is declared again; do that once the page is up, and after turning the device.
  const vp = document.querySelector('meta[name=viewport]'), base = vp.content, poke = () => { if (!touch) return; vp.content = base + ',height=device-height'; setTimeout(() => { vp.content = base; scrollTo(0, 0); fit(); }, 60); };
  const diag = () => { const el = document.getElementById('diag'); if (!el) return; const cs = getComputedStyle(document.documentElement), sa = document.createElement('div'); sa.style.cssText = 'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)'; document.documentElement.appendChild(sa); const sc2 = getComputedStyle(sa), st = Math.round(parseFloat(sc2.paddingTop) || 0), sb = Math.round(parseFloat(sc2.paddingBottom) || 0); sa.remove(); el.textContent = `ih ${innerHeight} · ch ${document.documentElement.clientHeight} · vv ${Math.round(visualViewport?.height || 0)} · lvh ${Math.round(probe.getBoundingClientRect().height)} · scr ${screen.width}x${screen.height} · safe ${st}/${sb} · app ${navigator.standalone ? 1 : 0} · h ${cs.getPropertyValue('--fullh')}`; };
  fit(); addEventListener('resize', () => { fit(); diag(); }); addEventListener('orientationchange', () => { setTimeout(fit, 300); setTimeout(poke, 500); setTimeout(() => { fit(); diag(); }, 1200); }); setTimeout(fit, 600); setTimeout(poke, 900); setTimeout(() => { fit(); diag(); }, 2000); setTimeout(diag, 4000); }
