// Batch-record every spoken line for chosen characters with ElevenLabs.
//   ELEVENLABS_API_KEY=... node tools/voices.mjs Amber=<voice_id> Kim=<voice_id>
// Writes public/voice/<id>.mp3 and public/voice/index.json; already-recorded lines are skipped.
import fs from 'node:fs';
import p1 from '../src/story/part1.js'; import p2 from '../src/story/part2.js'; import p3 from '../src/story/part3.js';
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return 'h' + (h >>> 0).toString(36); };
const voices = Object.fromEntries(process.argv.slice(2).map((a) => a.split('=')));
import { spokenLine } from '../src/story/speak.js';
const lines = new Map(); let who = 'Amber';
const addLine = (sp) => { if (sp && voices[sp[0]] && /[A-Za-z]/.test(sp[1])) lines.set(hash(sp[0] + '|' + sp[1]), sp); };
// Story functions branch on flags, so call each with every combination of the flags it reads.
const callAll = (fn) => { const seen = new Set(); const probe = (vals) => new Proxy({}, { get: (_, k) => { if (typeof k === 'string') seen.add(k); return vals[k]; } });
  const run = (vals) => { for (const watch of [true, false]) { try { const f = probe(vals); walk(fn(f, { f, tmp: { watch }, S: { ch: 1 } })); } catch { /* needs the live game */ } try { walk(fn({ f: probe(vals), tmp: { watch }, S: { ch: 1 } })); } catch { /* not that shape */ } } };
  run({}); const all = new Proxy({}, { get: () => 1 }); try { walk(fn(all, { f: all, tmp: {}, S: { ch: 1 } })); } catch { /* ignore */ }
  const names = [...seen].slice(0, 10); for (let m = 0; m < 1 << names.length; m++) { const v = {}; names.forEach((n, i) => { if (m >> i & 1) v[n] = 1; }); run(v); } };
const walk = (n) => { if (!n) return; if (typeof n === 'function') return callAll(n);
  if (Array.isArray(n)) { if (n.length === 2 && typeof n[0] === 'string' && typeof n[1] === 'string') addLine(n); else if (n.length >= 2 && n.length <= 3 && typeof n[0] === 'string' && Array.isArray(n[1])) { addLine(spokenLine(n[0], who)); walk(n[1]); } else n.forEach(walk); return; }
  if (typeof n === 'object') { if (typeof n.n === 'number' && n.steps) who = n.n === 13 ? 'Kim' : 'Amber'; if (n.hub) { for (const t of n.hub) addLine(spokenLine(t.q, who)); addLine(spokenLine(n.exit || 'Goodbye.', who)); } for (const [k, v] of Object.entries(n)) if (k !== 'tick' && k !== 'canWhistle' && k !== 'companion' && k !== 'ruby' && k !== 'meter' && k !== 'as' && k !== 'if' && k !== 'need') walk(v); } };
walk([p1, p2, p3]);
const dir = new URL('../public/voice/', import.meta.url).pathname; fs.mkdirSync(dir, { recursive: true });
console.log(lines.size, 'lines,', [...lines.values()].reduce((a, l) => a + l[1].length, 0), 'characters');
if (!process.env.ELEVENLABS_API_KEY) { console.log('Set ELEVENLABS_API_KEY to record.'); process.exit(0); }
// curl is used so the request honours the system proxy settings.
import { execFileSync } from 'node:child_process';
const redo = new Set((process.env.REDO || '').split(',').filter(Boolean)); // REDO=Kim re-records that character's lines with their current voice
const model = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2'; let n = 0;
for (const [id, [who, text]] of lines) { const f = dir + id + '.mp3'; if (fs.existsSync(f) && !redo.has(who)) continue;
  const code = execFileSync('curl', ['-s', '-o', f, '-w', '%{http_code}', '-X', 'POST', `https://api.elevenlabs.io/v1/text-to-speech/${voices[who]}?output_format=mp3_44100_64`, '-H', 'xi-api-key: ' + process.env.ELEVENLABS_API_KEY, '-H', 'content-type: application/json', '-d', JSON.stringify({ text, model_id: model })]).toString();
  if (code !== '200') { console.error('\nFAILED', who, code, fs.readFileSync(f, 'utf8').slice(0, 300)); fs.unlinkSync(f); break; }
  if (++n % 20 === 0) console.log(n, 'recorded'); if (process.env.LIMIT && n >= +process.env.LIMIT) break; }
fs.writeFileSync(dir + 'index.json', JSON.stringify(fs.readdirSync(dir).filter((x) => x.endsWith('.mp3')).map((x) => x.slice(0, -4))));
console.log('done', n);
