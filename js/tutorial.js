'use strict';
// =====================================================================
//  TUTORIAL: una notte guidata, passo per passo
//  - l'orologio e' fermo, niente rinforzi, niente game over, nessun salvataggio
//  - il biker non puo' morire: la vita torna al massimo a ogni passo
// =====================================================================
const TUT_STEPS = [
  {
    t: () => 'GUIDA LA MOTO: ' + KDRIVE(),
    sub: 'ALLONTANATI DALLA RIMESSA',
    enter: s => (s.from = { ...body(team[active]) }),
    done: (p, s) => dist(p.x, p.y, s.from.x, s.from.y) > 220,
  },
  {
    t: () => 'APRI LA MAPPA: ' + K('map'),
    sub: 'POI CHIUDILA CON ' + 'LO STESSO TASTO',
    done: (p, s) => s.seen.map,
  },
  {
    t: () => 'ACCENDI IL RADAR NEGOZI: ' + K('radar'),
    sub: 'LA BUSSOLA INDICA FARMACIA, MECCANICO E NEGOZIO PIU VICINI',
    done: () => radarOn || advOn,
  },
  {
    t: () => 'ABBATTI LO XENO: ' + K('attack'),
    sub: 'ARRIVA DA VICINO - SEGUI LA BUSSOLA',
    enter: s => {
      s.k0 = kills;
      tutXeno();
    },
    tick: () => {
      if (!enemies.length) tutXeno();
    },
    done: (p, s) => kills > s.k0,
  },
  {
    t: () => 'SCENDI DALLA MOTO: ' + K('mount'),
    sub: 'A PIEDI SI RAPINANO I NEGOZI E SI RUBANO LE AUTO',
    done: p => p.onFoot,
  },
  {
    t: () => 'RISALI IN SELLA: ' + K('mount'),
    sub: 'DEVI ESSERE VICINO ALLA MOTO',
    done: p => !p.onFoot,
  },
  {
    t: () => 'COMPRA UN FARMACO IN FARMACIA: ' + K('use'),
    sub: 'TI REGALIAMO 100$ - IL RADAR TI PORTA ALLA FARMACIA',
    enter: () => {
      if (money < 100) money = 100;
      radarOn = true;
    },
    done: p => p.meds > 0,
  },
  {
    t: () => 'USA IL FARMACO: ' + K('med'),
    sub: 'CURA +25 VITA AL MINUTO FINO AL PIENO',
    enter: () => (team[active].hp = Math.min(team[active].hp, 60)),
    done: p => p.medOn || p.meds === 0,
  },
  {
    t: () => 'TORNA IN RIMESSA',
    sub: 'IN RIMESSA LE BATTERIE SI RICARICANO X2 E LA VITA RISALE',
    done: p => inGarage(body(p).x, body(p).y),
  },
  {
    t: () => 'CAMBIA BIKER: ' + K('switch'),
    sub: 'CON SHIFT IL BIKER LASCIATO TORNA DA SOLO IN RIMESSA',
    enter: s => (s.a0 = active),
    done: (p, s) => active !== s.a0,
  },
];
// la bussola punta allo Xeno: ne mettiamo uno a distanza ragionevole
function tutXeno() {
  const pb = body(team[active]);
  let best = null,
    bd = 1e9;
  for (const n of nodes) {
    const d = Math.abs(dist(n.x, n.y, pb.x, pb.y) - 260);
    if (d < bd) {
      bd = d;
      best = n;
    }
  }
  const e = addEnemy(Math.floor(R() * NB), best.x, best.y, 20, nextEid++);
  msg('UNO XENO E ENTRATO IN CITTA', ACID);
  return e;
}
function startTutorial() {
  meta.tut = { step: -1, seen: {}, doneT: 0 };
  money = 0;
  tutNext();
}
function tutNext() {
  const s = meta.tut;
  s.step++;
  if (s.step >= TUT_STEPS.length) {
    s.doneT = 3;
    msg('TUTORIAL COMPLETATO!', '#5cff7a');
    sfx('cash');
    return;
  }
  const st = TUT_STEPS[s.step];
  if (st.enter) st.enter(s);
  if (s.step > 0) sfx('buy');
}
// note dal loop principale (la mappa si apre fuori da update)
function tutNote(k) {
  if (meta && meta.tut) meta.tut.seen[k] = true;
}
function updateTutorial(ap, dt) {
  const s = meta.tut;
  if (ap) ap.hp = Math.max(ap.hp, 1); // nel tutorial non si cade
  if (s.step >= TUT_STEPS.length) {
    s.doneT -= dt;
    if (s.doneT <= 0) {
      state = 'end';
      meta.ended = { win: true, reason: 'TUTORIAL COMPLETATO - ORA SCEGLI CLASSICA O VELOCE', kills, at: 0 };
      msgs = [];
    }
    return;
  }
  const st = TUT_STEPS[s.step];
  if (st.tick) st.tick(s);
  if (ap && st.done(ap, s)) tutNext();
}
function drawTutorial(AX, ay) {
  const s = meta.tut;
  if (s.step >= TUT_STEPS.length) {
    strip('TUTORIAL COMPLETATO!', AX, ay, '#5cff7a');
    return ay + 12;
  }
  const st = TUT_STEPS[s.step];
  strip('TUTORIAL ' + (s.step + 1) + '/' + TUT_STEPS.length + ' - ' + st.t(), AX, ay, blink(1) ? '#ffe03c' : '#ffffff');
  ay += 12;
  strip(st.sub, AX, ay, '#c9c2e6');
  return ay + 12;
}
