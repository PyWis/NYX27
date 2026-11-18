'use strict';
// =====================================================================
//  STADIO DI BASEBALL: la missione dell'assedio
//  - 3 biker dentro lo stadio (dalle 20:00, dalle 00:00, dalle 05:00; max 3 volte)
//  - gli Xeno gia' in citta' si radunano allo stadio (se non sono 12, rinforzi ogni 5 s)
//  - entrano dalle 3 entrate; si combatte solo quando sono dentro tutti e 12
//  - si gioca solo con i 3 biker dentro; a 0 di vita si e' rapiti al 100%
//  - esiti: tutti abbattuti / almeno 9 / almeno 6 / meno di 6
//  - la tregua di Nova libera gli ostaggi, che restano prigionieri nello stadio 1 ora
// =====================================================================
const STAD_OPEN = [2 * 3600, 6 * 3600, 11 * 3600], // 20:00, 00:00, 05:00
  STAD_N = 12,
  STAD_RESPAWN = 5, // rinforzi veloci se in citta' non ci sono 12 Xeno
  STAD_STUCK = 120, // uno Xeno bloccato per strada viene considerato arrivato
  STAD_ESCORT = 180; // meno di 6 abbattuti: 3 minuti per liberare gli ostaggi
let stad = null, // {phase:'siege'|'enter'|'fight'|'ransom', t, three, killed, n, need, spawnT, hostages, hold, bonus}
  stadRuns = 0,
  stadWarnT = 0;
function resetStadium() {
  stad = null;
  stadRuns = 0;
  stadWarnT = 0;
}
// durante assedio e combattimento si gioca solo con i 3 biker dello stadio
const missionLock = () => !!stad && stad.phase !== 'ransom';
// prima che i 12 Xeno siano tutti dentro non si combatte
const stadWaiting = () => !!stad && (stad.phase === 'siege' || stad.phase === 'enter');
const inMission = b => missionLock() && stad.three.includes(b.i);
// biker fermi che non rientrano da soli: BLOCK di Caspian o biker della missione
const holdIdle = b => blockT > 0 || inMission(b);
const cityXeno = () => enemies.reduce((n, e) => n + (e.stad ? 0 : 1), 0);
const stadXeno = () => enemies.reduce((n, e) => n + (e.stad && !e.dead ? 1 : 0), 0);
const stadNext = () => (stadRuns < STAD_OPEN.length ? STAD_OPEN[stadRuns] : null);

// ---------- avvio ----------
function checkStadiumStart(p) {
  if (stad || !p || p.status !== 'active' || p.inCar) return;
  const pb = body(p);
  if (!inStadium(pb.x, pb.y)) return;
  const nt = stadNext();
  if (nt === null || meta.gameT < nt) return;
  const mates = team
    .filter(t => t !== p && t.status === 'idle' && inStadium(t.x, t.y))
    .sort((a, b) => dist(a.x, a.y, pb.x, pb.y) - dist(b.x, b.y, pb.x, pb.y));
  if (mates.length < 2) return;
  startStadium(p, mates.slice(0, 2));
}
function startStadium(p, mates) {
  endNyx(p, '');
  stadRuns++;
  stad = { phase: 'siege', t: 0, three: [p.i, ...mates.map(m => m.i)], killed: 0, n: 0, need: STAD_N, spawnT: STAD_RESPAWN };
  for (const m of mates) m.waitT = 0;
  // non nascono Xeno nuovi: si radunano quelli gia' in citta' (i piu' vicini allo stadio)
  recruitXeno();
  fx.push({ k: 'flash', x: stadium.cx, y: stadium.cy, t: 0, dur: 1, r: 160, c: '#ff2b4a' });
  sfx('alert');
  sfx('siren');
  msg('MISSIONE STADIO ' + stadRuns + '/3: GLI XENO DELLA CITTA SI RADUNANO ALLO STADIO!', '#ff4d6d');
  if (stad.need > 0) msg('IN CITTA NE MANCANO ' + stad.need + ': RINFORZI OGNI ' + STAD_RESPAWN + 'S', '#ff9de6');
  msg('SI COMBATTE SOLO CON ' + stad.three.map(i => team[i].name).join(', ') + ' QUANDO SONO DENTRO TUTTI E 12', '#9fd4ff');
}
// arruola uno Xeno per l'assedio: va alla sua entrata
function enlist(e) {
  const k = stad.n++;
  e.stad = 1;
  e.sg = k % 3;
  e.slot = Math.floor(k / 3);
  e.sm = 'siege';
  e.wi = 0;
  e.sT = 0;
  e.ready = false;
  e.state = 'wander';
  e.onFoot = false;
  e.lchg = 0;
  e.gpath = null;
  e.follow = false;
  stad.need--;
}
// Xeno normali gia' in citta' (non gli speciali, non i fedeli di Nyx)
function recruitXeno() {
  const free = enemies
    .filter(e => !e.dead && !e.stad && !e.kind && !e.follow)
    .sort((a, b) => dist(a.x, a.y, stadium.cx, stadium.cy) - dist(b.x, b.y, stadium.cx, stadium.cy));
  for (const e of free) {
    if (stad.need <= 0) break;
    enlist(e);
  }
}

// ---------- movimento degli Xeno dello stadio (true = gestito qui) ----------
function siegeSpot(e) {
  const g = stadium.gates[e.sg],
    off = (e.slot - 1.5) * 13;
  // ovest/est: in fila lungo la strada verticale; nord: lungo la strada orizzontale
  if (e.sg === 1) return [g.ox + off, g.oy - (e.slot % 2) * 10];
  return [g.ox + (e.sg === 0 ? -1 : 1) * (e.slot % 2) * 10, g.oy + off];
}
function stadiumMove(e, dt) {
  const g = stadium.gates[e.sg] || stadium.gates[0],
    spd = xenoSpd(e);
  const tick = () => {
    e.cd -= dt;
    e.hitT -= dt;
    e.punchT -= dt;
    e.onFoot = false;
    e.lchg = 0;
  };
  if (e.sm === 'siege') {
    tick();
    const [tx, ty] = siegeSpot(e);
    e.sT = (e.sT || 0) + dt;
    if ((navTo(e, tx, ty, spd, dt) && dist(e.x, e.y, tx, ty) < 26) || e.sT > STAD_STUCK) e.ready = true;
    return true;
  }
  if (e.sm === 'enter' || e.sm === 'exit') {
    tick();
    // bloccato troppo a lungo: si ritrova all'entrata
    e.sT = (e.sT || 0) + dt;
    if (e.sm === 'enter' && e.sT > 60) {
      e.x = g.ix;
      e.y = g.iy;
      e.sm = 'in';
      e.state = 'chase';
      return true;
    }
    const wp =
      e.sm === 'enter'
        ? [
            [g.ox, g.oy],
            [g.gx, g.gy],
            [g.ix, g.iy],
          ]
        : [
            [g.ix, g.iy],
            [g.gx, g.gy],
            [g.ox, g.oy],
          ];
    const q = wp[e.wi || 0];
    if (e.sm === 'enter' && e.wi === 0 && !los(e.x, e.y, q[0], q[1])) {
      navTo(e, q[0], q[1], spd, dt);
      return true;
    }
    steerTo(e, q[0], q[1], spd, dt);
    if (dist(e.x, e.y, q[0], q[1]) < 14) {
      e.wi = (e.wi || 0) + 1;
      if (e.wi >= wp.length) {
        if (e.sm === 'enter') {
          e.sm = 'in';
          e.state = 'chase';
          e.lock = 0;
        } else {
          // fuori dallo stadio con l'ostaggio: torna uno Xeno normale
          e.stad = 0;
          e.sm = null;
          e.state = 'wander';
          e.tn = -1;
        }
      }
    }
    return true;
  }
  // dentro: resta nello stadio e attacca solo chi c'e' dentro, quando sono entrati tutti
  if (!pAvail || truceOn() || stadWaiting() || !inStadium(pBody.x, pBody.y)) {
    tick();
    e.v *= Math.pow(0.85, dt * 60);
    if (!inStadium(e.x, e.y)) steerTo(e, stadium.cx, stadium.cy, spd * 0.5, dt);
    return true;
  }
  e.state = 'chase';
  return false;
}

// ---------- aggiornamento ----------
function updateStadium(dt) {
  stadWarnT -= dt;
  if (!stad) return;
  if (stad.phase === 'siege') {
    stad.t += dt;
    if (stad.need > 0) {
      recruitXeno(); // anche i nuovi Xeno arrivati in citta' vanno allo stadio
      stad.spawnT -= dt;
      if (stad.need > 0 && stad.spawnT <= 0) {
        stad.spawnT = STAD_RESPAWN;
        enlist(spawnEnemy());
        msg('RINFORZO XENO VERSO LO STADIO (' + stad.n + '/12)', '#ff9de6');
      }
    }
    const sx = enemies.filter(e => e.stad && !e.dead);
    if (stad.need <= 0 && sx.every(e => e.ready)) {
      stad.phase = 'enter';
      for (const e of sx) {
        e.sm = 'enter';
        e.wi = 0;
        e.sT = 0;
      }
      msg('I 12 XENO ENTRANO DA TUTTE LE ENTRATE!', '#ff4d6d');
      sfx('alert');
      shake = Math.max(shake, 3);
    }
  } else if (stad.phase === 'enter') {
    if (enemies.every(e => !e.stad || e.dead || e.sm === 'in')) {
      stad.phase = 'fight';
      msg('TUTTI E 12 GLI XENO SONO NELLO STADIO: COMBATTETE!', '#ff4d6d');
      sfx('siren');
    }
  }
  if (stad.phase !== 'ransom') {
    if (stad.phase === 'fight' && !stadXeno()) return stadiumWin();
    if (!stad.three.some(i => team[i].status === 'active' || team[i].status === 'idle')) return stadiumLost();
    return;
  }
  if (stad.phase === 'ransom') {
    stad.t -= dt;
    const left = stad.hostages.filter(i => team[i].status === 'captured');
    if (!left.length) {
      const dead = stad.hostages.some(i => team[i].status === 'dead');
      stad = null;
      clearStadiumXeno(dead ? 'GLI OSTAGGI SONO MORTI: GLI XENO LASCIANO LO STADIO' : 'GLI XENO LASCIANO LO STADIO');
      return;
    }
    for (const i of left) team[i].capT = Math.max(0.01, stad.t);
    if (stad.t <= 0) {
      for (const i of left) {
        team[i].status = 'dead';
        msg(team[i].name + ' E STATO UCCISO NELLO STADIO', '#ff4d6d');
      }
      stad = null;
      clearStadiumXeno('NOVA NON E ARRIVATA: GLI XENO LASCIANO LO STADIO');
      checkEnd();
      return;
    }
    const p = pAvail ? team[active] : null;
    if (p && p.i === NOVA && p.status === 'active' && !p.inCar && nearStadium(pBody.x, pBody.y, 56)) novaDeal(p);
  }
}
// tutti i 12 Xeno abbattuti
function stadiumWin() {
  const list = stad.three.map(i => team[i]).filter(b => b.status === 'active' || b.status === 'idle');
  stad = null;
  msg('STADIO LIBERATO: 12 XENO ABBATTUTI!', ACID);
  alienReport(2000);
  stadiumAmbulance(list);
}
// nessuno dei 3 biker e' piu' disponibile
function stadiumLost() {
  const hostages = stad.three.filter(i => team[i].status === 'captured'),
    k = stad.killed;
  const live = enemies.filter(e => e.stad && !e.dead);
  if (!hostages.length) {
    stad = null;
    clearStadiumXeno('MISSIONE STADIO FALLITA: GLI XENO LASCIANO LO STADIO');
    return;
  }
  if (k >= 6) {
    const nine = k >= 9;
    stad = {
      phase: 'ransom',
      t: nine ? 600 : 300,
      hold: nine ? 3600 : 7200,
      bonus: nine ? 1000 : 0,
      hostages,
      three: stad.three,
      killed: k,
    };
    for (const i of hostages) team[i].capT = stad.t;
    if (hostages.includes(NOVA)) {
      msg('NOVA E TRA GLI OSTAGGI: SI OFFRE AL POSTO DEGLI ALTRI', '#ff6ec7');
      novaDeal(team[NOVA]);
      return;
    }
    sfx('alert');
    msg(k + ' XENO ABBATTUTI: GLI XENO VOGLIONO NOVA COME OSTAGGIO', '#ff6ec7');
    msg('NOVA DEVE ARRIVARE ALLO STADIO ENTRO ' + fmt(stad.t) + ' O GLI OSTAGGI MUOIONO', '#ff4d6d');
    return;
  }
  // meno di 6: 3 Xeno escono con gli ostaggi, gli altri si fondono in 2 Xeno Rossi
  const esc = [];
  for (const i of hostages) {
    const t = team[i];
    let e = live.find(x => x.id === t.captor && !esc.includes(x)) || live.find(x => !esc.includes(x));
    if (!e) break;
    esc.push(e);
    t.captor = e.id;
    t.capT = STAD_ESCORT;
  }
  while (esc.length < 3 && live.some(x => !esc.includes(x))) esc.push(live.find(x => !esc.includes(x)));
  for (const e of esc) {
    e.sg = stadium.gates.indexOf(nearGate(e.x, e.y));
    e.sm = 'exit';
    e.wi = 0;
    e.onFoot = false;
  }
  for (const e of live)
    if (!esc.includes(e)) {
      e.dead = true;
      spark(e.x, e.y, XK.red.c, 10, 80);
    }
  for (const gi of [0, 2]) {
    const g = stadium.gates[gi];
    makeSpecial(addEnemy(Math.floor(R() * NB), g.ox, g.oy, XK.red.hp, nextEid++), 'red');
  }
  fx.push({ k: 'flash', x: stadium.cx, y: stadium.cy, t: 0, dur: 0.8, r: 120, c: XK.red.c });
  sfx('boom');
  stad = null;
  msg('3 XENO ESCONO DALLO STADIO CON GLI OSTAGGI: 3 MIN PER LIBERARLI!', '#ff3df2');
  msg('GLI ALTRI XENO SI FONDONO IN 2 XENO ROSSI', XK.red.c);
}
// Nova si consegna: gli ostaggi tornano in rimessa con l'auto medica, lei resta nello stadio
function novaDeal(n) {
  const S = stad;
  const wasActive = n === team[active] && n.status === 'active';
  if (n.inCar) exitCar(n, false);
  endNyx(n, '');
  const freed = S.hostages.filter(i => i !== NOVA && team[i].status === 'captured').map(i => team[i]);
  for (const b of freed) b.captor = 0;
  n.status = 'out';
  n.outR = 'OSTAGGIO';
  n.outT = S.hold;
  n.captor = 0;
  n.medOn = false;
  n.onFoot = false;
  n.walkPath = null;
  n.path = null;
  n.v = 0;
  n.nitroT = 0;
  n.x = stadium.cx;
  n.y = stadium.cy + 20;
  n.a = -Math.PI / 2;
  stad = null;
  clearStadiumXeno('');
  fx.push({ k: 'flash', x: stadium.cx, y: stadium.cy, t: 0, dur: 1, r: 120, c: '#ff6ec7' });
  sfx('switch');
  msg('NOVA RESTA IN OSTAGGIO NELLO STADIO PER ' + (S.hold >= 7200 ? '2 ORE' : '1 ORA'), '#ff6ec7');
  alienReport(S.bonus);
  if (freed.length) stadiumAmbulance(freed);
  if (wasActive) leaveActive();
}
// gli Xeno rimasti nello stadio se ne vanno (non quelli che escono con gli ostaggi)
function clearStadiumXeno(why) {
  for (const e of enemies)
    if (e.stad && e.sm !== 'exit' && !e.dead) {
      e.dead = true;
      freeCaptives(e);
      spark(e.x, e.y, ACID, 8, 60);
    }
  if (why) msg(why, '#c6ff3a');
}
// premio "come il rapporto al centro alieni" + bonus
function alienReport(bonus) {
  const n = Math.max(0, kills - alienMark);
  alienMark = kills;
  const g = n * 25 + bonus;
  money += g;
  sfx('cash');
  msg('CENTRO ALIENI: ' + n + ' XENO = ' + n * 25 + '$' + (bonus ? ' + ' + bonus + '$' : ''), '#c6ff3a');
  if (n >= 10) {
    garageMeds += 3;
    garageAutoMed();
    msg('3 FARMACI ALLA RIMESSA', '#5cff7a');
  }
}
// l'auto medica del centro alieni passa dallo stadio e riporta i biker (con le moto) in rimessa
function stadiumAmbulance(list) {
  if (!list.length) return;
  const al = shops.find(s => s.type === 'alien');
  let ga = stadium.gates[0],
    bd = 1e9;
  for (const g of stadium.gates) {
    const d = al ? dist(g.ox, g.oy, al.x, al.y) : 0;
    if (d < bd) {
      bd = d;
      ga = g;
    }
  }
  const wasActive = list.includes(team[active]) && team[active].status === 'active';
  for (const b of list) {
    if (b.inCar) exitCar(b, false);
    b.status = 'waitamb';
    b.path = null;
    b.walkPath = null;
    b.onFoot = false;
    b.v = 0;
    b.nitroT = 0;
  }
  const legs = [
    { x: ga.ox, y: ga.oy, act: 'stadium', list: list.map(b => b.i) },
    { x: garage.cx, y: garage.cy, act: 'garage', w: -1 },
  ];
  if (amb) amb.legs.push(...legs);
  else amb = { x: al ? al.x : ga.ox, y: al ? al.y : ga.oy, a: 0, legs, li: 0, path: null, pi: 0, riders: [] };
  msg("IL CENTRO ALIENI MANDA L'AUTO MEDICA ALLO STADIO", '#ff4d6d');
  sfx('siren');
  if (wasActive) leaveActive();
}
// tregua di Nova: chi e' rapito viene liberato ma resta prigioniero nello stadio per 1 ora
function truceHostages() {
  const list = team.filter(t => t.status === 'captured');
  list.forEach((t, k) => {
    t.status = 'out';
    t.outR = 'PRIGIONIERO';
    t.outT = 3600;
    t.captor = 0;
    t.medOn = false;
    t.onFoot = false;
    t.path = null;
    t.v = 0;
    t.x = stadium.cx + (k - (list.length - 1) / 2) * 22;
    t.y = stadium.cy + 30;
    t.a = -Math.PI / 2;
  });
  if (list.length)
    msg(
      'TREGUA: ' + list.map(t => t.name).join(', ') + ' LIBERATI MA PRIGIONIERI NELLO STADIO PER 1 ORA',
      '#c6ff3a',
    );
  if (stad && stad.phase === 'ransom') {
    stad = null;
    clearStadiumXeno('');
  }
}
// i biker della missione non possono uscire dallo stadio
function confineToStadium(p, b0) {
  if (!inMission(p) || p.status !== 'active' || p.inCar) return;
  let out = false;
  if (!inStadium(p.x, p.y)) {
    p.x = b0.x;
    p.y = b0.y;
    p.v *= -0.3;
    out = true;
  }
  if (p.onFoot && !inStadium(p.fx, p.fy)) {
    p.fx = b0.fx;
    p.fy = b0.fy;
    out = true;
  }
  if (out && stadWarnT <= 0) {
    stadWarnT = 3;
    msg('NON PUOI LASCIARE LO STADIO DURANTE LA MISSIONE', '#ff4d6d');
  }
}
// avviso quando si e' dentro lo stadio senza missione
function stadiumHint(pb) {
  if (stad || !inStadium(pb.x, pb.y)) return null;
  const nt = stadNext();
  if (nt === null) return ['STADIO: MISSIONI FINITE (3/3)', '#7a6f99'];
  if (meta.gameT < nt) return ['STADIO: PROSSIMA MISSIONE ALLE ' + hhmm(nt), '#9fd4ff'];
  const n = 1 + team.filter(t => t.status === 'idle' && inStadium(t.x, t.y)).length;
  return ['STADIO: SERVONO 3 BIKER DENTRO (' + Math.min(3, n) + '/3)', '#9fd4ff'];
}
