'use strict';
// =====================================================================
//  AUTO NERA DI ATLAS E SEL
//  - doppie pistole: seconda arma speciale di Atlas e Sel (5000$ a testa, armeria)
//  - Atlas o Sel portano un'auto della polizia rubata da un meccanico:
//    carrozzeria e motore elettrico, dopo 1 ora l'auto nera e' pronta a Times Square
//  - si sale a piedi, in due: la vita si somma, chi guida spara con l'auto (2 colpi),
//    l'altro spara da solo con le doppie pistole
//  - 8 minuti di autonomia; si ricarica in 8 minuti a Times Square, 1 ora altrove
//  - Caspian puo' guidarla solo per riportarla a Times Square
// =====================================================================
const ATLAS = 1,
  SEL = 4,
  CREW = [ATLAS, SEL];
const DUAL_ID = 99, // vecchi salvataggi: le doppie pistole erano nella lista delle armi
  DUAL_COST = 5000;
const DUAL_WPN = { k: 'gun', dual: true, cd: 0.4, dmg: 5, spd: 4.5 * BASE, rng: 14 * BL, label: 'DOPPIE PISTOLE' };
const CAR_WPN = { k: 'gun', dual: true, cd: 0.5, dmg: 7, spd: 5 * BASE, rng: 30 * BL, label: 'CANNONI GEMELLI' };
const DARK_BAT = 8 * 60, // 8 minuti di autonomia
  DARK_BUILD = 3600, // 1 ora dal meccanico
  DARK_FAST = 8 * 60, // ricarica completa a Times Square
  DARK_SLOW = 3600; // ricarica completa altrove
const isCrew = i => CREW.includes(i);
const mateOf = i => (i === ATLAS ? SEL : ATLAS);
// le doppie pistole si usano solo sull'auto nera (non in moto): sono un flag, non un'arma della lista
const hasDual = i => !!team[i] && !!team[i].dual;
// dark: null | {phase:'build'|'ready', t, mech, x, y, a, v, bat, hp, crew:[i,i]|null, driver, cd, gcd}
let dark = null,
  darkWarnT = 0;
function resetDark() {
  dark = null;
  darkWarnT = 0;
}
const darkReady = () => !!dark && dark.phase === 'ready';
const inDark = b => !!b && !!b.inCar && b.inCar === dark;
const crewed = b => darkReady() && !!dark.crew && dark.crew.includes(b.i);
const squareMark = () => landmarks.find(m => m.name === 'TIMES SQUARE');
function inSquare(x, y) {
  const m = squareMark();
  if (!m) return false;
  const b = m.b;
  return x >= b.x * CELL && x < (b.x + b.w) * CELL && y >= b.y * CELL && y < (b.y + b.h) * CELL;
}
function darkSprite() {
  const c = mk(26, 14),
    g = c.getContext('2d');
  const P = (x, y, w, h, cl) => {
    g.fillStyle = cl;
    g.fillRect(x, y, w, h);
  };
  P(3, 0, 5, 2, '#000');
  P(18, 0, 5, 2, '#000');
  P(3, 12, 5, 2, '#000');
  P(18, 12, 5, 2, '#000');
  P(0, 2, 26, 10, '#050408');
  P(1, 3, 24, 8, '#15121c');
  P(2, 2, 20, 1, '#2a2440');
  P(2, 11, 20, 1, '#2a2440');
  P(9, 4, 8, 6, '#0a0810');
  P(10, 5, 6, 4, '#2c2a48');
  P(17, 4, 3, 6, '#3a3a6a');
  P(1, 6, 6, 2, '#3fd46b'); // striscia di Atlas
  P(19, 6, 6, 2, '#8a6bff'); // striscia di Sel
  P(22, 1, 4, 1, '#c6ff3a'); // cannoni gemelli
  P(22, 12, 4, 1, '#c6ff3a');
  P(25, 3, 1, 2, '#e0f4ff');
  P(25, 9, 1, 2, '#e0f4ff');
  P(0, 3, 1, 2, '#ff2b4a');
  P(0, 9, 1, 2, '#ff2b4a');
  return c;
}
const darkSpr = darkSprite();

// ---------- armeria: doppie pistole ----------
// Atlas e Sel: prima dell'auto nera l'armeria vende solo le doppie pistole;
// spese per fare l'auto, possono comprare una seconda arma qualsiasi da usare in moto
const dualTime = () => !dark;
function dualHint(p) {
  if (hasDual(p.i)) return "!DOPPIE PISTOLE PRESE: PORTATE UN'AUTO DELLA POLIZIA AL MECCANICO";
  return 'DOPPIE PISTOLE ' + DUAL_COST + '$ (SOLO PER L AUTO NERA)';
}
function buyDual(p) {
  if (hasDual(p.i)) return msg('HAI GIA LE DOPPIE PISTOLE', '#ffe03c');
  if (money < DUAL_COST) return msg('SERVONO ' + DUAL_COST + '$', '#ff4d6d');
  money -= DUAL_COST;
  p.dual = true;
  sfx('cash');
  msg(p.name + " HA LE DOPPIE PISTOLE: SI USANO SOLO SULL'AUTO NERA", p.ui);
  if (hasDual(ATLAS) && hasDual(SEL) && !dark) msg("ORA PORTATE UN'AUTO DELLA POLIZIA DA UN MECCANICO", '#b48cff');
}

// ---------- officina: dall'auto della polizia all'auto nera ----------
// chiamata da driveCar: true se l'auto della polizia e' stata consegnata al meccanico
function policeToMech(p, c) {
  if (!isCrew(p.i) || dark) return false;
  const m = shops.find(s => s.type === 'mech' && !shopOff(s) && dist(c.x, c.y, s.x, s.y) < 36);
  if (!m) return false;
  if (!hasDual(ATLAS) || !hasDual(SEL)) {
    if (darkWarnT <= 0) {
      darkWarnT = 4;
      msg('IL MECCANICO LAVORA SOLO SE ATLAS E SEL HANNO LE DOPPIE PISTOLE', '#ffb03c');
    }
    return false;
  }
  c.gone = true;
  p.inCar = null;
  p.onFoot = true;
  p.fx = m.x;
  p.fy = m.y + 4;
  dark = { phase: 'build', t: DARK_BUILD, mech: m.i, x: 0, y: 0, a: 0, v: 0, bat: DARK_BAT, hp: 0 };
  dark.crew = null;
  dark.driver = -1;
  dark.cd = 0;
  dark.gcd = 0;
  sfx('cash');
  msg('IL MECCANICO MONTA CARROZZERIA E MOTORE ELETTRICO: PRONTA TRA 1 ORA', '#b48cff');
  startWalk(p);
  return true;
}
function darkDone() {
  const m = squareMark();
  dark.phase = 'ready';
  dark.x = m ? m.x : garage.cx;
  dark.y = m ? m.y : garage.cy;
  dark.a = 0;
  dark.v = 0;
  dark.bat = DARK_BAT;
  sfx('nitro');
  msg("L'AUTO NERA E PRONTA: E PARCHEGGIATA A TIMES SQUARE", '#b48cff');
  msg('ATLAS E SEL DEVONO ARRIVARCI A PIEDI', '#c9c2e6');
}

// ---------- salire e scendere ----------
const nearDark = b => darkReady() && !dark.crew && dark.driver < 0 && dist(dark.x, dark.y, b.x, b.y) < 22;
// il compagno deve aspettare vicino all'auto (TAB) oppure in rimessa se l'auto e' a Times Square
function mateReady(p) {
  const m = team[mateOf(p.i)];
  if (!m || m.hp <= 0) return null;
  if (m.status === 'idle' && dist(m.x, m.y, dark.x, dark.y) < 130) return m;
  if (m.status === 'garage' && inSquare(dark.x, dark.y)) return m;
  return null;
}
function darkHint(p) {
  if (p.i === 2)
    return inSquare(dark.x, dark.y) ? "!L'AUTO NERA E GIA A TIMES SQUARE" : 'RIPORTA L AUTO NERA A TIMES SQUARE';
  if (!isCrew(p.i)) return "!L'AUTO NERA E SOLO DI ATLAS E SEL";
  if (missionLock()) return '!NON DURANTE LA MISSIONE STADIO';
  const m = mateReady(p);
  return m
    ? 'SALI IN DUE CON ' + m.name
    : '!SERVE ' + ROSTER[mateOf(p.i)].name + ' (LASCIALO QUI CON ' + K('switch') + ')';
}
function useDark(p) {
  const h = darkHint(p);
  if (h[0] === '!') return msg(h.slice(1), '#b48cff');
  p.inCar = dark;
  p.walkPath = null;
  dark.v = 0;
  dark.driver = p.i;
  if (p.i === 2) {
    dark.crew = null;
    sfx('mount');
    return msg("CASPIAN GUIDA L'AUTO NERA: PORTALA A TIMES SQUARE", '#f2f2f2');
  }
  const m = mateReady(p);
  dark.crew = [p.i, m.i];
  dark.hp = p.hp + m.hp; // insieme la vita si somma
  p.hp = dark.hp;
  p.medOn = false;
  m.medOn = false;
  m.status = 'car';
  m.path = null;
  m.v = 0;
  sfx('mount');
  sfx('nitro');
  msg(p.name + ' E ' + m.name + " SULL'AUTO NERA: VITA " + Math.ceil(dark.hp), '#b48cff');
}
// posizione libera accanto all'auto
function darkSide(k) {
  for (const a of [dark.a + Math.PI / 2, dark.a - Math.PI / 2, dark.a + Math.PI]) {
    const x = dark.x + Math.cos(a) * (14 + k * 6),
      y = dark.y + Math.sin(a) * (14 + k * 6);
    if (!blocked(x, y, 3)) return { x, y };
  }
  return { x: dark.x, y: dark.y };
}
// scendono tutti: a ciascuno meta' della vita complessiva; chi non guida va a piedi alla sua moto
function emptyDark(walk) {
  const pool = crewHp();
  const crew = dark.crew || [];
  const drv = dark.driver >= 0 ? team[dark.driver] : null;
  crew.forEach((i, k) => {
    const b = team[i];
    b.hp = Math.min(maxHP, Math.max(1, pool / 2));
    if (b === drv) return;
    const q = darkSide(k);
    b.v = 0;
    startFetch(b, q.x, q.y, true);
    msg(b.name + ' TORNA A PIEDI ALLA MOTO', b.ui);
  });
  if (drv) {
    const q = darkSide(0);
    drv.inCar = null;
    drv.onFoot = true;
    drv.fx = q.x;
    drv.fy = q.y;
    drv.fa = dark.a;
    if (walk) startWalk(drv);
  }
  dark.crew = null;
  dark.driver = -1;
  dark.hp = 0;
  dark.v = 0;
  if (crew.length) msg('ATLAS E SEL SCENDONO: VITA ' + Math.ceil(Math.max(1, pool / 2)) + ' A TESTA', '#b48cff');
}
// vita complessiva: chi guida la tiene in p.hp, a bordo fermi la tiene l'auto
const crewHp = () => (dark.driver >= 0 && dark.crew ? team[dark.driver].hp : dark.hp);
// TAB dall'auto: restano tutti e due a bordo, l'auto si ferma
function crewStay(p) {
  dark.hp = p.hp;
  dark.driver = -1;
  dark.v = 0;
  p.inCar = null;
  p.onFoot = false;
  p.v = 0;
  p.walkPath = null;
  p.status = 'car';
}
// riprendere il comando di un biker a bordo: si mette al volante
function takeWheel(q) {
  q.inCar = dark;
  q.onFoot = false;
  dark.driver = q.i;
  q.hp = dark.hp;
}
// richiamo dei leader: Atlas e Sel scendono e vanno a piedi alle loro moto
function recallCrew() {
  if (!darkReady() || !dark.crew || dark.driver >= 0) return 0;
  const n = dark.crew.length;
  emptyDark(false);
  return n;
}

// ---------- guida e armi ----------
function shootPair(x, y, a, w, dmg, col, off) {
  for (const s of [-1, 1]) {
    const bx = x + Math.cos(a + Math.PI / 2) * off * s,
      by = y + Math.sin(a + Math.PI / 2) * off * s;
    bullets.push({
      x: bx,
      y: by,
      vx: Math.cos(a) * w.spd,
      vy: Math.sin(a) * w.spd,
      life: w.rng / w.spd,
      dmg,
      o: 'p',
      c: col,
    });
    fx.push({ k: 'flash', x: bx, y: by, t: 0, dur: 0.08, r: 12, c: col });
  }
}
function driveDark(p, dt, thr, brk, st, atk) {
  const c = dark,
    maxV = BASE * 1.5,
    acc = maxV * 1.2,
    can = c.bat > 0;
  if (thr > 0 && can) {
    const tg = maxV * thr;
    c.v = c.v < tg ? Math.min(tg, c.v + acc * dt) : Math.max(tg, c.v - maxV * 0.6 * dt);
  } else if (brk > 0 && c.v > 0) c.v = Math.max(0, c.v - maxV * 2.2 * brk * dt);
  else if (brk > 0 && can) c.v = Math.max(-maxV * 0.3, c.v - acc * 0.5 * brk * dt);
  else {
    const f = maxV * 0.6 * dt;
    c.v = Math.abs(c.v) <= f ? 0 : c.v - Math.sign(c.v) * f;
  }
  c.a += st * 2.8 * Math.min(1, 0.3 + Math.abs(c.v) / 60) * dt * (c.v < -1 ? -1 : 1);
  if (moveCol(c, 'x', 'y', Math.cos(c.a) * c.v * dt, Math.sin(c.a) * c.v * dt, 6)) {
    if (Math.abs(c.v) > 40) {
      spark(c.x + Math.cos(c.a) * 12, c.y + Math.sin(c.a) * 12, '#b48cff', 6, 80);
      sfx('bump');
    }
    c.v *= 0.5;
  }
  if (Math.abs(c.v) > 4) {
    c.bat = Math.max(0, c.bat - dt);
    if (c.bat <= 0 && !c.warn) {
      c.warn = true;
      msg('AUTO NERA SCARICA: A TIMES SQUARE SI RICARICA IN 8 MIN', '#ff4d6d');
    }
  }
  if (c.bat > 0) c.warn = false;
  p.fx = c.x;
  p.fy = c.y;
  p.fa = c.a;
  c.cd -= dt;
  // chi guida spara con i cannoni gemelli dell'auto (non Caspian)
  if (c.crew && atk && c.cd <= 0) {
    c.cd = CAR_WPN.cd;
    shootPair(c.x + Math.cos(c.a) * 13, c.y + Math.sin(c.a) * 13, c.a, CAR_WPN, CAR_WPN.dmg, '#c6ff3a', 5);
    sfx('shoot');
  }
  // Caspian: arrivato a Times Square la lascia li' e torna a piedi alla sua moto
  if (!c.crew && p.i === 2 && inSquare(c.x, c.y)) {
    c.v = 0;
    emptyDark(true);
    msg('AUTO NERA A TIMES SQUARE: CASPIAN TORNA ALLA MOTO E POI IN RIMESSA', '#f2f2f2');
    return;
  }
  if (hit('mount')) emptyDark(true);
}
// il compagno a bordo spara da solo con le doppie pistole allo Xeno piu' vicino
function gunnerFire(dt) {
  dark.gcd -= dt;
  if (dark.gcd > 0 || !dark.crew) return;
  const g = team[dark.crew.find(i => i !== dark.driver)];
  if (!g) return;
  let best = null,
    bd = DUAL_WPN.rng * 0.9;
  for (const e of enemies) {
    if (e.dead) continue;
    const q = body(e),
      d = dist(q.x, q.y, dark.x, dark.y);
    if (d < bd && los(dark.x, dark.y, q.x, q.y)) {
      bd = d;
      best = q;
    }
  }
  if (!best) return;
  dark.gcd = DUAL_WPN.cd;
  const a = Math.atan2(best.y - dark.y, best.x - dark.x) + (R() - 0.5) * 0.12;
  shootPair(dark.x, dark.y, a, DUAL_WPN, DUAL_WPN.dmg + dmgBonus(g), '#d8b8ff', 3);
  sfx('rapid');
}

// ---------- aggiornamento (chiamato da update) ----------
function updateDark(dt) {
  darkWarnT -= dt;
  if (!dark) return;
  if (dark.phase === 'build') {
    dark.t -= waitDt(dt);
    if (dark.t <= 0) darkDone();
    return;
  }
  const driving = dark.driver >= 0 && dark.driver === active && state === 'play';
  if (driving && dark.crew) gunnerFire(dt);
  // ferma si ricarica: 8 minuti a Times Square, 1 ora altrove
  if (Math.abs(dark.v) < 4 && dark.bat < DARK_BAT) {
    const full = inSquare(dark.x, dark.y) ? DARK_FAST : DARK_SLOW;
    const was = dark.bat;
    dark.bat = Math.min(DARK_BAT, dark.bat + (DARK_BAT / full) * waitDt(dt));
    if (was < DARK_BAT && dark.bat >= DARK_BAT && !driving) msg('AUTO NERA RICARICATA', '#b48cff');
  }
}

// ---------- disegno ----------
function drawDark(vis) {
  if (!dark) return;
  if (dark.phase === 'build') {
    const m = shops[dark.mech];
    if (m && vis(m.x, m.y)) lab('AUTO NERA ' + fmtL(dark.t), m.x, m.y - 40, '#b48cff');
    return;
  }
  if (!vis(dark.x, dark.y)) return;
  drawVeh(darkSpr, dark.x, dark.y, dark.a);
  if (dark.driver >= 0) return;
  if (dark.crew) lab('ATLAS E SEL A BORDO', dark.x, dark.y - 16, '#b48cff');
  else if (pAvail && dist(dark.x, dark.y, pBody.x, pBody.y) < 90) {
    const p = team[active];
    lab(p.onFoot && !p.inCar ? 'AUTO NERA' : 'AUTO NERA: VIENI A PIEDI', dark.x, dark.y - 16, '#b48cff');
  }
  if (dark.bat < DARK_BAT)
    lab('CARICA ' + Math.floor((dark.bat / DARK_BAT) * 100) + '%', dark.x, dark.y + 10, '#ffe03c');
}

// ---------- salvataggio ----------
function darkSave() {
  return dark ? { ...dark } : null;
}
function loadDark(d) {
  dark = d ? { ...d } : null;
  if (!dark) return;
  dark.cd = 0;
  dark.gcd = 0;
  dark.crew = dark.crew || null;
  if (dark.driver == null) dark.driver = -1;
  if (dark.driver >= 0) {
    const b = team[dark.driver];
    if (b && b.status === 'active') {
      b.inCar = dark;
      b.onFoot = false;
    } else if (dark.crew) {
      dark.hp = b ? b.hp : dark.hp;
      if (b) b.status = 'car';
      dark.driver = -1;
    } else dark.driver = -1;
  }
}
