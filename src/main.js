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
  fit(); addEventListener('resize', fit); addEventListener('orientationchange', () => { setTimeout(fit, 300); setTimeout(fit, 900); }); setTimeout(fit, 600); setTimeout(fit, 2000); }
