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

// Fill the whole screen when launched from the home screen (see style.css).
{ const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches, fit = () => { if (!standalone) return; const land = innerWidth > innerHeight, sh = land ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height), h = Math.max(innerHeight, document.documentElement.clientHeight, sh - innerHeight < 60 ? sh : 0); document.documentElement.style.setProperty('--fullh', h + 'px'); document.documentElement.classList.add('fullh'); dispatchEvent(new Event('fullh')); };
  fit(); addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 300)); setTimeout(fit, 600); }
