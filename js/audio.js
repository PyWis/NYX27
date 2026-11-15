'use strict';
// ---------- audio ----------
// catena: effetti -> sfxBus \
//                             > master -> compressore -> uscita
//         musica  -> musicGain/
let AC = null,
  master = null,
  musicGain = null,
  sfxBus = null,
  comp = null,
  noiseBuf = null,
  musicOn = true,
  muted = false,
  nextT = 0,
  step = 0;
let rainSrc = null,
  rainGain = null;
function initAudio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    return;
  }
  comp = AC.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 10;
  comp.ratio.value = 6;
  comp.attack.value = 0.003;
  comp.release.value = 0.18;
  comp.connect(AC.destination);
  master = AC.createGain();
  master.gain.value = 0.5;
  master.connect(comp);
  musicGain = AC.createGain();
  musicGain.connect(master);
  sfxBus = AC.createGain();
  sfxBus.connect(master);
  applyVolumes();
  noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  // pioggia: rumore filtrato in loop, il volume segue l'intensita'
  const rb = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate),
    rd = rb.getChannelData(0);
  for (let i = 0; i < rd.length; i++) rd[i] = Math.random() * 2 - 1;
  rainSrc = AC.createBufferSource();
  rainSrc.buffer = rb;
  rainSrc.loop = true;
  const f = AC.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 2600;
  f.Q.value = 0.5;
  rainGain = AC.createGain();
  rainGain.gain.value = 0;
  rainSrc.connect(f);
  f.connect(rainGain);
  rainGain.connect(sfxBus);
  rainSrc.start();
  setInterval(schedule, 40);
}
function applyVolumes() {
  if (!AC) return;
  musicGain.gain.value = (0.2 * SET.music) / 10;
  sfxBus.gain.value = SET.sfx / 7;
}
function setRainVol(v) {
  if (rainGain) rainGain.gain.setTargetAtTime(muted ? 0 : v * 0.06, AC.currentTime, 0.4);
}
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
function tone(f, type, t, dur, vol, f2, dest) {
  const o = AC.createOscillator(),
    g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(dest || sfxBus);
  o.start(t);
  o.stop(t + dur + 0.02);
}
function noise(t, dur, vol, freq, type, dest) {
  const s = AC.createBufferSource();
  s.buffer = noiseBuf;
  const f = AC.createBiquadFilter();
  f.type = type || 'lowpass';
  f.frequency.value = freq || 2000;
  const g = AC.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(dest || sfxBus);
  s.start(t);
  s.stop(t + dur + 0.02);
}
// limite di frequenza: lo stesso effetto non riparte prima di questo intervallo (s)
const SFX_GAP = {
  hit: 0.045,
  punch: 0.04,
  shoot: 0.035,
  rapid: 0.03,
  bump: 0.08,
  boom: 0.06,
  alert: 0.25,
  hurt: 0.06,
  slash: 0.04,
  whip: 0.05,
};
const sfxLast = {};
function sfx(n) {
  if (!AC || muted) return;
  const t = AC.currentTime;
  const gap = SFX_GAP[n] || 0.02;
  if (sfxLast[n] !== undefined && t - sfxLast[n] < gap) return;
  sfxLast[n] = t;
  switch (n) {
    case 'shoot':
      tone(900, 'square', t, 0.09, 0.07, 200);
      break;
    case 'rapid':
      tone(1400, 'square', t, 0.05, 0.05, 500);
      break;
    case 'slash':
      noise(t, 0.1, 0.12, 3000, 'bandpass');
      break;
    case 'whip':
      noise(t, 0.14, 0.12, 4500, 'highpass');
      tone(1800, 'sine', t, 0.06, 0.03, 600);
      break;
    case 'punch':
      noise(t, 0.08, 0.2, 900);
      tone(140, 'sine', t, 0.08, 0.15, 60);
      break;
    case 'hit':
      tone(220, 'square', t, 0.05, 0.05, 120);
      break;
    case 'hurt':
      tone(160, 'sawtooth', t, 0.15, 0.08, 70);
      break;
    case 'boom':
      noise(t, 0.5, 0.3, 1200);
      tone(90, 'sine', t, 0.4, 0.2, 30);
      break;
    case 'switch':
      [0, 4, 7, 12].forEach((k, i) => tone(mf(72 + k), 'triangle', t + i * 0.05, 0.08, 0.07));
      break;
    case 'charge':
      tone(660, 'sine', t, 0.1, 0.06);
      tone(990, 'sine', t + 0.08, 0.12, 0.06);
      break;
    case 'alert':
      tone(1200, 'square', t, 0.05, 0.04);
      tone(1200, 'square', t + 0.09, 0.05, 0.04);
      break;
    case 'bump':
      noise(t, 0.08, 0.12, 500);
      break;
    case 'buy':
      [0, 7, 12].forEach((k, i) => tone(mf(76 + k), 'square', t + i * 0.06, 0.07, 0.05));
      break;
    case 'cash':
      [0, 4, 7, 12, 16].forEach((k, i) => tone(mf(79 + k), 'square', t + i * 0.05, 0.06, 0.05));
      break;
    case 'siren':
      for (let i = 0; i < 4; i++) tone(i % 2 ? 620 : 880, 'square', t + i * 0.18, 0.17, 0.035);
      break;
    case 'nitro':
      noise(t, 0.4, 0.15, 800, 'bandpass');
      tone(200, 'sawtooth', t, 0.4, 0.06, 900);
      break;
    case 'mount':
      tone(300, 'triangle', t, 0.06, 0.06, 500);
      break;
    case 'empty':
      tone(200, 'square', t, 0.2, 0.05, 100);
      break;
    case 'laserup':
      tone(180, 'sawtooth', t, 1, 0.05, 900);
      tone(360, 'sine', t, 1, 0.03, 1800);
      break;
    case 'laser':
      noise(t, 0.25, 0.25, 5000, 'bandpass');
      tone(1200, 'sawtooth', t, 0.3, 0.09, 120);
      tone(70, 'sine', t, 0.35, 0.2, 30);
      break;
    case 'lshield':
      tone(1600, 'triangle', t, 0.06, 0.05, 2400);
      break;
    case 'sneak':
      [0, 3, 7].forEach((k, i) => tone(mf(70 + k), 'triangle', t + i * 0.07, 0.06, 0.04));
      break;
    case 'menu':
      tone(880, 'square', t, 0.03, 0.03);
      break;
  }
}
const PROG = [
  [57, 60, 64],
  [53, 57, 60],
  [48, 52, 55],
  [55, 59, 62],
];
function schedule() {
  if (!AC || !musicOn || muted) {
    if (AC) nextT = AC.currentTime;
    return;
  }
  while (nextT < AC.currentTime + 0.15) {
    if (nextT < AC.currentTime) nextT = AC.currentTime;
    const bar = Math.floor(step / 16) % 4,
      s = step % 16,
      ch = PROG[bar];
    if (s % 2 === 0) tone(mf(ch[0] - 24 + (s % 4 === 2 ? 12 : 0)), 'sawtooth', nextT, 0.16, 0.5, 0, musicGain);
    tone(mf(ch[s % 3] + 12 + (s >= 8 ? 12 : 0)), 'square', nextT, 0.07, 0.12, 0, musicGain);
    if (s % 4 === 0) tone(120, 'sine', nextT, 0.12, 0.9, 40, musicGain);
    if (s % 8 === 4) noise(nextT, 0.12, 0.5, 3000, 'highpass', musicGain);
    nextT += 60 / 112 / 4;
    step++;
  }
}
