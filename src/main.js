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

// A small readout on the title screen of what the device reports, for diagnosing screen-edge gaps.
{ const diag = () => { const el = document.getElementById('diag'); if (!el) return; const sa = document.createElement('div'); sa.style.cssText = 'position:fixed;visibility:hidden;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)'; document.documentElement.appendChild(sa); const c = getComputedStyle(sa), n = (v) => Math.round(parseFloat(v) || 0);
    el.textContent = `win ${innerWidth}x${innerHeight} · doc ${document.documentElement.clientWidth}x${document.documentElement.clientHeight} · vv ${Math.round(visualViewport?.width || 0)}x${Math.round(visualViewport?.height || 0)}@${(visualViewport?.scale || 1).toFixed(2)} · scr ${screen.width}x${screen.height} · safe ${n(c.paddingTop)}/${n(c.paddingRight)}/${n(c.paddingBottom)}/${n(c.paddingLeft)} · app ${navigator.standalone ? 1 : 0}`; sa.remove(); };
  setTimeout(diag, 800); setTimeout(diag, 3000); addEventListener('resize', diag); }
