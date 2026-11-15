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
function titleInput() {
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
    else {
      newGame(sel);
      resetWeather();
    }
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
    else if (paused) {
      if (take('pause') || mhit('back')) paused = false;
      else if (take('options') || mhit('opts')) optMenu = { sel: 0, sub: null };
    } else if (mapOpen) {
      if (take('map') || mhit('back')) mapOpen = false;
    } else if (take('map')) mapOpen = true;
    else if (state === 'play' && take('pause')) paused = true;
    frozen = paused || mapOpen || !!gunMenu || !!optMenu;
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
      newGame(2);
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
