import { Game } from './game.js';
import * as UI from './ui.js';
window.__ui = UI;
const $ = (id) => document.getElementById(id);
const G = (window.__game = new Game($('c')));
$('loading').classList.add('hide');
if (G.hasSave()) $('tContinue').classList.remove('hide');
const go = async (fresh) => {
  if (fresh && G.hasSave() && !confirm('Start a new story? Your saved progress will be replaced.')) return;
  // the title stays up, saying so, until the world is actually ready; a blank screen looks broken
  $('titleBtns').classList.add('hide'); const ld = $('loading'); ld.textContent = fresh ? 'Opening the book…' : 'Finding your place…'; ld.classList.remove('hide'); const hide = () => $('title').classList.add('hide');
  try { if (fresh) { hide(); await G.begin(true); } else await G.begin(false, hide); } catch (e) { window.__oops?.('start: ' + (e?.message || e)); throw e; } finally { hide(); }
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

// If anything goes wrong, say so on screen instead of leaving a blank page (a photo of this text is enough to fix it from).
{ const show = (t) => { let el = document.getElementById('oops'); if (!el) { el = document.createElement('div'); el.id = 'oops'; el.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:99;background:#2a1018ee;color:#ffe9c8;font:12px/1.4 ui-monospace,Menlo,monospace;padding:10px 12px;border-radius:10px;white-space:pre-wrap;max-height:40%;overflow:auto'; document.body.appendChild(el); } if (el.textContent.length < 1200) el.textContent += (el.textContent ? '\n' : 'Something went wrong (build ' + (document.getElementById('buildTag')?.textContent || '') + '):\n') + t; };
  addEventListener('error', (e) => show(String(e.message || e.error || 'error') + (e.filename ? ' @ ' + e.filename.split('/').pop() + ':' + e.lineno : '')));
  addEventListener('unhandledrejection', (e) => show('promise: ' + String(e.reason?.message || e.reason).slice(0, 300))); window.__oops = show; }
