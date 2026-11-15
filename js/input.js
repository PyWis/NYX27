'use strict';
// =====================================================================
//  INPUT: azioni rimappabili (tastiera) + gamepad + impostazioni
// =====================================================================

// ---------- impostazioni (salvate nel browser) ----------
const SET_KEY = 'nyx-settings-v1';
// due tasti per azione: [primario, secondario]
const DEFAULT_BINDS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  attack: ['Space', ''],
  mount: ['KeyZ', ''],
  use: ['KeyE', ''],
  med: ['KeyF', ''],
  deliver: ['KeyC', ''],
  nitro: ['KeyX', ''],
  weapon: ['KeyQ', ''],
  switch: ['Tab', ''],
  recall: ['KeyR', ''],
  radar: ['KeyV', ''],
  map: ['KeyG', ''],
  pause: ['KeyP', 'Escape'],
  options: ['KeyO', ''],
  fullscreen: ['KeyB', ''],
  music: ['KeyM', ''],
  mute: ['KeyN', ''],
};
const ACTION_NAMES = {
  up: 'ACCELERA / SU',
  down: 'FRENA / GIU',
  left: 'SINISTRA',
  right: 'DESTRA',
  attack: 'ATTACCO / PUGNO',
  mount: 'SCENDI / SALI',
  use: 'INTERAGISCI',
  med: 'USA FARMACO',
  deliver: 'CONSEGNA FARMACI',
  nitro: 'NITRO',
  weapon: 'CAMBIA ARMA',
  switch: 'CAMBIA BIKER',
  recall: 'RICHIAMA IN RIMESSA',
  radar: 'RADAR NEGOZI',
  map: 'MAPPA',
  pause: 'PAUSA',
  options: 'OPZIONI',
  fullscreen: 'SCHERMO INTERO',
  music: 'MUSICA ON/OFF',
  mute: 'AUDIO ON/OFF',
};
const SET = { music: 5, sfx: 7, lowFlash: false, crt: true, shake: true, vibration: true, binds: null };
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SET_KEY) || 'null');
    if (s) Object.assign(SET, s);
  } catch (e) {}
  const b = {};
  for (const k in DEFAULT_BINDS) {
    const v = SET.binds && SET.binds[k];
    b[k] = Array.isArray(v) && v.length === 2 ? v.slice() : DEFAULT_BINDS[k].slice();
  }
  SET.binds = b;
  applyCRT();
}
function saveSettings() {
  try {
    localStorage.setItem(SET_KEY, JSON.stringify(SET));
  } catch (e) {}
}
function applyCRT() {
  const c = document.getElementById('crt');
  if (c) c.style.display = SET.crt ? '' : 'none';
}
function resetBinds() {
  for (const k in DEFAULT_BINDS) SET.binds[k] = DEFAULT_BINDS[k].slice();
  saveSettings();
}
// assegna un tasto: se era gia' usato da un'altra azione, lo toglie da li'
function bindKey(action, slot, code) {
  for (const k in SET.binds) for (let i = 0; i < 2; i++) if (SET.binds[k][i] === code) SET.binds[k][i] = '';
  SET.binds[action][slot] = code;
  saveSettings();
}
loadSettings();

// ---------- tastiera ----------
const keys = {},
  pressed = new Set();
let lastDev = 'kb',
  rebindCb = null;
const BLOCK = new Set(['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
function boundTo(code) {
  for (const k in SET.binds) if (SET.binds[k][0] === code || SET.binds[k][1] === code) return k;
  return null;
}
addEventListener('keydown', e => {
  initAudio();
  if (AC && AC.state === 'suspended') AC.resume();
  lastDev = 'kb';
  if (rebindCb) {
    e.preventDefault();
    const cb = rebindCb;
    rebindCb = null;
    cb(e.code);
    return;
  }
  const act = boundTo(e.code);
  if (BLOCK.has(e.code) || (act && !/^F\d+$/.test(e.code))) e.preventDefault();
  if (act === 'fullscreen' && !e.repeat) {
    toggleFS();
    return;
  } // dentro l'evento: il browser lo consente
  if (!e.repeat) pressed.add(e.code);
  keys[e.code] = true;
});
addEventListener('keyup', e => {
  keys[e.code] = false;
});
// finestra non piu' attiva: tasti rilasciati e partita in pausa
addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  if (typeof state !== 'undefined' && state === 'play') paused = true;
});
cv.addEventListener('mousedown', () => {
  cv.focus();
  initAudio();
  if (AC && AC.state === 'suspended') AC.resume();
});
cv.addEventListener('dblclick', () => toggleFS());
cv.focus();
function toggleFS() {
  try {
    const d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } else {
      const el = d.documentElement;
      const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      if (p && p.catch) p.catch(() => toast('SCHERMO INTERO: USA TASTIERA O DOPPIO CLIC'));
    }
  } catch (e) {}
}
document.addEventListener('fullscreenchange', () => setTimeout(fit, 50));

// ---------- gamepad (mappatura standard) ----------
const PAD = { sx: 0, sy: 0, thr: 0, brk: 0, on: false, ps: false };
const PAD_BTN = {
  0: 'attack',
  1: 'mount',
  2: 'use',
  3: 'nitro',
  4: 'weapon',
  5: 'switch',
  8: 'map',
  9: 'pause',
  12: 'med',
  13: 'deliver',
  14: 'radar',
  15: 'recall',
};
const PAD_MENU = { 0: 'ok', 9: 'ok', 1: 'back', 3: 'del', 8: 'opts', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
const padHeld = new Set(),
  padHit = new Set(),
  padMenu = new Set();
let padPrev = [],
  stickRep = { dir: null, t: 0 };
function getPad() {
  const gps = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const g of gps) if (g && g.connected) return g;
  return null;
}
const dz = v => (Math.abs(v) < 0.2 ? 0 : (v - Math.sign(v) * 0.2) / 0.8);
function pollPad(rdt) {
  padHeld.clear();
  const gp = getPad();
  PAD.on = !!gp;
  if (!gp) {
    PAD.sx = PAD.sy = PAD.thr = PAD.brk = 0;
    padPrev = [];
    return;
  }
  PAD.ps =
    /054c|playstation|dualsense|dualshock/i.test(gp.id) ||
    (/wireless controller/i.test(gp.id) && !/xbox|045e/i.test(gp.id));
  const bt = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
  let any = false;
  for (const i in PAD_BTN)
    if (bt(i)) {
      padHeld.add(PAD_BTN[i]);
      if (!padPrev[i]) {
        padHit.add(PAD_BTN[i]);
        any = true;
      }
    }
  for (const i in PAD_MENU) if (bt(i) && !padPrev[i]) padMenu.add(PAD_MENU[i]);
  PAD.sx = dz(gp.axes[0] || 0);
  PAD.sy = dz(gp.axes[1] || 0);
  PAD.thr = gp.buttons[7] ? gp.buttons[7].value : 0;
  PAD.brk = gp.buttons[6] ? gp.buttons[6].value : 0;
  if (PAD.thr > 0.15) padHeld.add('up');
  if (PAD.brk > 0.15) padHeld.add('down');
  if (PAD.sx < -0.5) padHeld.add('left');
  if (PAD.sx > 0.5) padHeld.add('right');
  if (PAD.thr > 0.15 || PAD.brk > 0.15 || Math.abs(PAD.sx) > 0.3 || Math.abs(PAD.sy) > 0.3) any = true;
  // stick nei menu, con ripetizione
  const dir =
    Math.abs(PAD.sx) > Math.abs(PAD.sy)
      ? PAD.sx > 0.6
        ? 'right'
        : PAD.sx < -0.6
          ? 'left'
          : null
      : PAD.sy > 0.6
        ? 'down'
        : PAD.sy < -0.6
          ? 'up'
          : null;
  if (dir) {
    if (stickRep.dir !== dir) {
      padMenu.add(dir);
      stickRep = { dir, t: 0.35 };
    } else {
      stickRep.t -= rdt;
      if (stickRep.t <= 0) {
        padMenu.add(dir);
        stickRep.t = 0.12;
      }
    }
  } else stickRep.dir = null;
  if (any) {
    lastDev = 'pad';
    if (AC && AC.state === 'suspended') AC.resume();
  }
  padPrev = gp.buttons.map(b => b.pressed);
}
addEventListener('gamepadconnected', () => {
  toast('CONTROLLER COLLEGATO');
  lastDev = 'pad';
});
addEventListener('gamepaddisconnected', () => {
  toast('CONTROLLER SCOLLEGATO');
  lastDev = 'kb';
  if (typeof state !== 'undefined' && state === 'play') paused = true;
});
function rumble(ms, strong, weak) {
  if (!SET.vibration) return;
  const gp = getPad();
  const va = gp && gp.vibrationActuator;
  if (!va || !va.playEffect) return;
  try {
    const p = va.playEffect('dual-rumble', {
      duration: ms,
      strongMagnitude: clamp(strong, 0, 1),
      weakMagnitude: clamp(weak == null ? strong * 0.6 : weak, 0, 1),
    });
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

// ---------- interrogazione delle azioni ----------
// isDown: tenuto premuto - hit: premuto in questo frame - take: come hit ma lo consuma
function isDown(a) {
  if (padHeld.has(a)) return true;
  const b = SET.binds[a];
  return !!(b && ((b[0] && keys[b[0]]) || (b[1] && keys[b[1]])));
}
function hit(a) {
  if (padHit.has(a)) return true;
  const b = SET.binds[a];
  return !!(b && ((b[0] && pressed.has(b[0])) || (b[1] && pressed.has(b[1]))));
}
function take(a) {
  const r = hit(a);
  if (r) {
    padHit.delete(a);
    const b = SET.binds[a];
    pressed.delete(b[0]);
    pressed.delete(b[1]);
  }
  return r;
}
// tasti dei menu (fissi): frecce + direzioni assegnate, INVIO/SPAZIO conferma, ESC indietro, CANC cancella
const MENU_KEYS = {
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  ok: ['Enter', 'NumpadEnter', 'Space'],
  back: ['Escape'],
  del: ['Backspace', 'Delete'],
  opts: [],
};
function mhit(m) {
  if (padMenu.has(m)) {
    padMenu.delete(m);
    return true;
  }
  const codes = MENU_KEYS[m].slice();
  if (SET.binds[m]) codes.push(...SET.binds[m]);
  if (m === 'opts') codes.push(...SET.binds.options);
  for (const c of codes)
    if (c && pressed.has(c)) {
      pressed.delete(c);
      return true;
    }
  return false;
}
function clearPressed() {
  pressed.clear();
  padHit.clear();
  padMenu.clear();
}
// valori analogici di guida (tastiera = 0/1, gamepad = continuo)
function axisSteer() {
  const k = (isKey('right') ? 1 : 0) - (isKey('left') ? 1 : 0);
  return k || PAD.sx;
}
function axisThr() {
  return isKey('up') ? 1 : PAD.thr > 0.05 ? PAD.thr : 0;
}
function axisBrk() {
  return isKey('down') ? 1 : PAD.brk > 0.05 ? PAD.brk : 0;
}
function isKey(a) {
  const b = SET.binds[a];
  return !!(b && ((b[0] && keys[b[0]]) || (b[1] && keys[b[1]])));
}

// ---------- etichette dei comandi (cambiano col dispositivo usato) ----------
const KEYNAME = {
  Space: 'SPAZIO',
  Tab: 'TAB',
  Escape: 'ESC',
  Enter: 'INVIO',
  NumpadEnter: 'INVIO',
  Backspace: 'BKSP',
  Delete: 'CANC',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  ShiftLeft: 'SHIFT',
  ShiftRight: 'SHIFT DX',
  ControlLeft: 'CTRL',
  ControlRight: 'CTRL DX',
  AltLeft: 'ALT',
  AltRight: 'ALTGR',
  CapsLock: 'CAPS',
  Comma: ',',
  Period: '.',
  Slash: '/',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Quote: "'",
  Backquote: "'",
  Semicolon: ';',
  Backslash: '|',
  IntlBackslash: '<',
  Home: 'HOME',
  End: 'FINE',
  PageUp: 'PAG SU',
  PageDown: 'PAG GIU',
  Insert: 'INS',
};
const keyLabel = c =>
  !c
    ? '-'
    : KEYNAME[c] ||
      c
        .replace(/^Key|^Digit/, '')
        .replace(/^Numpad/, 'NUM')
        .toUpperCase();
const PADN_X = {
  attack: 'A',
  mount: 'B',
  use: 'X',
  nitro: 'Y',
  weapon: 'LB',
  switch: 'RB',
  map: 'SELECT',
  pause: 'START',
  options: 'SELECT',
  med: 'CROCE↑',
  deliver: 'CROCE↓',
  radar: 'CROCE←',
  recall: 'CROCE→',
  up: 'RT',
  down: 'LT',
  left: 'STICK',
  right: 'STICK',
  ok: 'A',
  back: 'B',
  del: 'Y',
};
const PADN_PS = {
  attack: '✕',
  mount: '○',
  use: '□',
  nitro: '△',
  weapon: 'L1',
  switch: 'R1',
  map: 'SHARE',
  pause: 'OPTIONS',
  options: 'SHARE',
  up: 'R2',
  down: 'L2',
  ok: '✕',
  back: '○',
  del: '△',
};
const usingPad = () => lastDev === 'pad' && PAD.on;
function K(a) {
  if (usingPad()) return (PAD.ps && PADN_PS[a]) || PADN_X[a] || '?';
  const b = SET.binds[a];
  return keyLabel(b ? b[0] || b[1] : '');
}
function KM(m) {
  if (usingPad()) return (PAD.ps && PADN_PS[m]) || PADN_X[m];
  return { ok: 'INVIO', back: 'ESC', del: 'CANC' }[m];
}
function KDRIVE() {
  if (usingPad()) return 'STICK + ' + K('up') + '/' + K('down');
  const B = SET.binds,
    k = i => keyLabel(B.up[i]) + keyLabel(B.left[i]) + keyLabel(B.down[i]) + keyLabel(B.right[i]);
  return k(0) + (B.up[1] ? '/' + k(1) : '');
}

// ---------- avvisi brevi (visibili anche nel titolo) ----------
let toastMsg = '',
  toastT = 0;
function toast(t) {
  toastMsg = t;
  toastT = 2.5;
}
