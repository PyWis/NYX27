'use strict';
// =====================================================================
//  MAIN LOOP: logica a timestep fisso (120 Hz), disegno a ogni frame
//  - la fisica non dipende piu' dal framerate
//  - hit-stop: il mondo si ferma per qualche centesimo sui colpi forti
// =====================================================================
const STEP = 1 / 120,
  MAX_STEPS = 8;
genCity(Math.floor(Math.random() * 1e9));
let last = performance.now(),
  acc = 0;
// scelta della modalita' dopo il biker: classica, veloce (orologio x4), tutorial
const MODES = [
  { id: 'classic', name: 'CLASSICA', d: '1 MINUTO DI GIOCO = 1 MINUTO DI NOTTE (12 ORE)' },
  { id: 'fast', name: 'VELOCE X4', d: 'OROLOGIO X4 - ATTESE /2 - NOVA TORNA IN 2 ORE - FINE 07:00' },
  { id: 'tutorial', name: 'TUTORIAL', d: 'IMPARA I COMANDI PASSO PASSO - NESSUN SALVATAGGIO' },
];
// rivincita: compare solo entro 7 giorni reali da una notte vinta
function modeList() {
  const r = readReplay();
  if (!r) return MODES;
  const h = Math.max(1, Math.ceil((r.at + REPLAY_MS - Date.now()) / 3600000));
  const left = h > 24 ? Math.ceil(h / 24) + ' GIORNI' : h + ' ORE';
  return MODES.concat({
    id: 'replay',
    name: 'RIVINCITA X2',
    d: 'NOTTE VINTA (' + (r.mode === 'fast' ? 'VELOCE' : 'CLASSICA') + ') - XENO VITA X2 - SCADE TRA ' + left,
    r,
  });
}
let modeMenu = null; // {sel, list}
function modeInput() {
  const m = modeMenu,
    L = m.list;
  if (mhit('up') || mhit('left')) m.sel = (m.sel + L.length - 1) % L.length;
  if (mhit('down') || mhit('right')) m.sel = (m.sel + 1) % L.length;
  for (let k = 0; k < L.length; k++) if (pressed.has('Digit' + (k + 1))) m.sel = k;
  if (mhit('ok')) {
    const o = L[m.sel];
    modeMenu = null;
    if (o.id === 'replay') newGame(sel, o.r.mode, { seed: o.r.seed, xhp: 2 });
    else newGame(sel, o.id);
    resetWeather();
  } else if (mhit('back')) modeMenu = null;
}
function titleInput() {
  if (modeMenu) return modeInput();
  if (mhit('right')) sel = (sel + 1) % NB;
  if (mhit('left')) sel = (sel + NB - 1) % NB;
  if (mhit('down') || mhit('up')) sel = (sel + NB / 2) % NB;
  const live = saved && !saved.meta.ended;
  if (mhit('del')) {
    if (saved) {
      if (delArm > 0) {
        delSave();
        saved = null;
        meta = null;
        delArm = 0;
        titleMsg = 'SALVATAGGIO CANCELLATO';
      } else {
        delArm = 2.5;
        titleMsg = 'PREMI DI NUOVO ' + KM('del') + ' PER CANCELLARE';
      }
    }
  }
  if (take('options') || mhit('opts')) {
    optMenu = { sel: 0, sub: null };
    return;
  }
  if (mhit('ok')) {
    if (live) loadGame(saved);
    else modeMenu = { sel: 0, list: modeList() };
  }
}
function gunInput() {
  const g = gunMenu,
    p = team[active];
  let pick = -1;
  for (let k = 0; k < g.opts.length; k++)
    if (pressed.has('Digit' + (k + 1)) || pressed.has('Numpad' + (k + 1))) pick = k;
  if (mhit('up')) g.sel = (g.sel + g.opts.length - 1) % g.opts.length;
  if (mhit('down')) g.sel = (g.sel + 1) % g.opts.length;
  if (mhit('ok')) pick = g.sel;
  if (pick >= 0) {
    if (money >= 10000) {
      money -= 10000;
      p.weapons.push(g.opts[pick]);
      p.wi = p.weapons.length - 1;
      setW(p);
      sfx('cash');
      msg(p.name + ' HA UNA NUOVA ARMA: ' + p.wpn.label + ' (' + K('weapon') + ' PER CAMBIARE)', p.ui);
    }
    gunMenu = null;
  } else if (mhit('back') || take('use')) gunMenu = null;
}
function frame(t) {
  const rdt = Math.min(0.25, Math.max(0, (t - last) / 1000));
  last = t;
  T += rdt;
  delArm = Math.max(0, delArm - rdt);
  toastT = Math.max(0, toastT - rdt);
  pollPad(rdt);
  if (take('music')) musicOn = !musicOn;
  if (take('mute')) {
    muted = !muted;
    setRainVol(weather.int);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  let stepped = false,
    frozen = false;
  if (optMenu) {
    frozen = true;
    optionsInput();
    if (state === 'title') drawTitle(0);
    else drawWorld(cam.x, cam.y, 0);
    if (optMenu) drawOptions();
  } else if (state === 'title') {
    titleInput();
    if (state === 'title') drawTitle(rdt);
  } else if (state === 'play' || state === 'wait') {
    if (gunMenu) gunInput();
    else if (listMenu) listInput();
    else if (paused) {
      if (take('pause') || mhit('back')) paused = false;
      else if (take('options') || mhit('opts')) optMenu = { sel: 0, sub: null };
    } else if (mapOpen) {
      if (take('map') || mhit('back')) mapOpen = false;
    } else if (take('map')) {
      mapOpen = true;
      tutNote('map');
    } else if (take('options')) optMenu = { sel: 0, sub: null };
    else if (state === 'play' && take('pause')) paused = true;
    frozen = paused || mapOpen || !!gunMenu || !!listMenu || !!optMenu;
    if (!frozen) {
      if (hitStop > 0) hitStop = Math.max(0, hitStop - rdt);
      else {
        acc += rdt;
        let n = 0;
        while (acc >= STEP && n < MAX_STEPS) {
          update(STEP);
          n++;
          acc -= STEP;
          if (n === 1) {
            clearPressed();
            stepped = true;
          }
          if (state !== 'play' && state !== 'wait') break;
        }
        if (n >= MAX_STEPS) acc = 0;
      }
    } // troppo lento: si rallenta invece di "saltare"
    if (pendingFast) {
      pendingFast = false;
      // la rivincita resta tale: stessa citta' e Xeno x2
      newGame(2, meta.mode || 'classic', xhp() > 1 ? { seed: meta.seed, xhp: meta.xhp } : null);
      meta.gameT = 11 * 3600;
      meta.fast = true;
      msgs = [];
      msg('NOTTE VELOCE! SI RIPARTE ALLE 05:00', '#9fd4ff');
      msg("RESISTI FINO ALL'ALBA", '#ffe03c');
      saveGame();
    }
    if (state === 'play') {
      drawWorld(cam.x, cam.y, frozen ? 0 : rdt);
      drawHUD();
      if (optMenu) drawOptions();
      else if (gunMenu) drawGunMenu();
      else if (listMenu) drawListMenu();
      else if (mapOpen) drawBigMap();
      else if (paused) drawPause();
    } else if (state === 'wait') {
      drawWorld(cam.x, cam.y, rdt);
      drawWait();
      if (mapOpen) drawBigMap();
    } else {
      drawWorld(cam.x, cam.y, rdt);
      drawEnd();
    }
  } else if (state === 'end') {
    drawWorld(cam.x, cam.y, rdt);
    drawEnd();
    if (mhit('ok')) {
      saved = readSave();
      state = 'title';
      titleMsg = '';
    }
  }
  if (toastT > 0) strip(toastMsg, VW / 2, 4, '#3cf2ff', 0.85);
  // i tasti premuti restano validi finche' un passo di logica non li ha letti
  if (stepped || frozen || !(state === 'play' || state === 'wait')) clearPressed();
  requestAnimationFrame(frame);
}
addEventListener('visibilitychange', () => {
  if (document.hidden && (state === 'play' || state === 'wait')) {
    saveGame();
    if (state === 'play') paused = true;
  }
});
addEventListener('pagehide', () => {
  if (state === 'play' || state === 'wait') saveGame();
});
requestAnimationFrame(frame);
