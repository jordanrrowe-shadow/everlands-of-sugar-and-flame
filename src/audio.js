// Music: one recorded theme per realm (public/music), cross-faded as you travel. Effects are synthesised,
// and a small generative soundtrack stands in if a theme cannot be loaded.
const SCALES = { ember: [146.8, 174.6, 196, 220, 261.6, 293.7, 349.2, 392], sugar: [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5], sea: [220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3] };
export class Sound {
  constructor() { this.on = true; this._mood = 'ember'; this.night = false; this.beat = 0; this.tracks = {}; }
  get mood() { return this._mood; }
  set mood(m) { this._mood = m; this.music(); }
  music() { // play the current realm's theme, fading the others out
    if (!this.ctx) return; const t = this.ctx.currentTime;
    for (const k of Object.keys(this.tracks)) if (k !== this._mood) { const tr = this.tracks[k]; tr.g.gain.cancelScheduledValues(t); tr.g.gain.setTargetAtTime(0, t, 0.6); clearTimeout(tr.stop); tr.stop = setTimeout(() => tr.el.pause(), 3000); }
    if (!SCALES[this._mood]) return; let tr = this.tracks[this._mood];
    if (!tr) { const el = new Audio(`music/${this._mood}.mp3`); el.loop = true; el.preload = 'auto'; el.addEventListener('error', () => { tr.bad = true; }); const g = this.ctx.createGain(); g.gain.value = 0; try { this.ctx.createMediaElementSource(el).connect(g); g.connect(this.master); } catch (e) { return; } tr = this.tracks[this._mood] = { el, g }; }
    clearTimeout(tr.stop); if (this.on) tr.el.play().catch(() => {}); tr.g.gain.cancelScheduledValues(t); tr.g.gain.setTargetAtTime(this.night ? 0.3 : 0.42, t, 0.9);
  }
  unlock() {
    if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.on ? 0.7 : 0; this.master.connect(this.ctx.destination); setInterval(() => this.tick(), 380); document.addEventListener('visibilitychange', () => { if (document.hidden) for (const tr of Object.values(this.tracks)) tr.el.pause(); }); }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.music();
  }
  setOn(on) { this.on = on; if (this.master) this.master.gain.value = on ? 0.7 : 0; if (on) this.music(); else for (const tr of Object.values(this.tracks)) tr.el.pause(); }
  tone(freq, dur = 0.4, type = 'sine', vol = 0.15, to = 0, delay = 0) {
    if (!this.ctx || !this.on) return; const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }
  noise(dur = 0.4, vol = 0.2, freq = 600) {
    if (!this.ctx || !this.on) return; const n = Math.floor(this.ctx.sampleRate * dur), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = this.ctx.createBufferSource(); s.buffer = b; const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; const g = this.ctx.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(this.master); s.start();
  }
  sfx(n) {
    if (n === 'chime') { this.tone(784, 0.5, 'sine', 0.18); this.tone(1046.5, 0.6, 'sine', 0.16, 0, 0.12); this.tone(1318.5, 0.8, 'sine', 0.14, 0, 0.24); }
    else if (n === 'whistle') { this.tone(1480, 1.1, 'sine', 0.22, 1760); this.tone(2960, 1.1, 'sine', 0.04, 3520); }
    else if (n === 'boing') this.tone(180, 0.3, 'sine', 0.2, 520);
    else if (n === 'hit') { this.noise(0.7, 0.5, 300); this.tone(70, 0.5, 'sine', 0.4, 40); }
    else if (n === 'flame') this.noise(0.5, 0.12, 1400);
    else if (n === 'lit') { this.noise(0.3, 0.15, 2000); this.tone(660, 0.5, 'triangle', 0.12, 990); }
    else if (n === 'page') this.tone(520, 0.12, 'triangle', 0.06);
    else if (n === 'roar') { this.tone(90, 1.2, 'sawtooth', 0.12, 60); this.noise(1.0, 0.15, 500); }
    else if (n === 'ring') { this.tone(880, 0.3, 'sine', 0.14); this.tone(1320, 0.4, 'sine', 0.1, 0, 0.08); }
    else if (n === 'chapter') [392, 523.3, 659.3, 784].forEach((f, i) => this.tone(f, 1.2, 'triangle', 0.12, 0, i * 0.18));
  }
  tick() {
    if (!this.ctx || !this.on || this.ctx.state !== 'running') return; this.beat++;
    const cur = this.tracks[this._mood]; if (cur && !cur.bad) { if (cur.el.paused && !document.hidden) this.music(); return; }
    const sc = SCALES[this.mood] || SCALES.ember, sugar = this.mood === 'sugar', r = Math.random();
    if (this.beat % 8 === 0) { this.tone(sc[0] / (sugar ? 4 : 2), 3.2, 'sine', 0.07); this.tone(sc[this.beat % 16 ? 2 : 3] / (sugar ? 4 : 2), 3.2, 'sine', 0.045); }
    if (r < (this.night ? 0.22 : 0.42)) { const i = Math.floor(Math.random() * sc.length); this.tone(sc[i], sugar ? 0.9 : 1.4, sugar ? 'sine' : 'triangle', sugar ? 0.05 : 0.045); if (sugar && Math.random() < 0.3) this.tone(sc[(i + 2) % sc.length], 0.8, 'sine', 0.03, 0, 0.19); }
  }
}
