'use strict';
// =====================================================================
//  FUNZIONI SPECIALI
//  - Xeno Rosso / Xeno Silver / Xeno Gold
//  - tregua di Nova (centro alieni)
//  - missione automatica "RAPINALI TUTTI!" di Melanie (commissariato)
//  - radar avanzato di Akira (centro NASA)
//  - SHIFT + cambia biker: il biker lasciato rientra in rimessa
//  - menu a lista generico (radar avanzato, commissariato)
//  - BLOCK di Caspian (R in rimessa), colpo delle batterie di Melanie (meccanici)
// =====================================================================
const NOVA = 5;
const PXM = 8; // pixel per metro
const RED_LEASH = 200 * PXM; // lo Xeno Rosso non si allontana piu' di 200 m dalla rimessa
const TRUCE_DUR = 15 * 60,
  TRUCE_CD = 3600,
  TRUCE_COST = 5000,
  TRUCE_CAP = 15;
const ADV_RADAR_COST = 10000;
const ROB_PAY = 2000;
const SIEGE_T = 30 * 60, // assedio dello Xeno Gold prima che l'edificio cada
  OFF_T = 3600; // edificio unico fuori uso per 1 ora
const XK = {
  red: {
    name: 'XENO ROSSO',
    c: '#ff2b2b',
    hp: 40,
    mul: 1,
    r: bikeSprite('#ff2b2b', '#ff9a9a', true, true, '#3a0808', '#b01f1f', '#ffe03c'),
    e: bikeSprite('#ff2b2b', '#ff9a9a', false, true),
  },
  silver: {
    name: 'XENO SILVER',
    c: '#d8dee8',
    hp: 90,
    mul: 1.5,
    r: bikeSprite('#c8d0dc', '#ffffff', true, true, '#2a2e38', '#8a93a6', '#3cf2ff'),
    e: bikeSprite('#c8d0dc', '#ffffff', false, true),
  },
  gold: {
    name: 'XENO GOLD',
    c: '#ffd21f',
    hp: 90,
    mul: 2.5,
    r: bikeSprite('#ffd21f', '#fff2a0', true, true, '#3a2a00', '#b08a10', '#ff3d3d'),
    e: bikeSprite('#ffd21f', '#fff2a0', false, true),
  },
};
const BLOCK_T = 30 * 60, // BLOCK di Caspian: per 30 minuti nessuno rientra da solo
  HEIST_T = 30 * 60, // Melanie: 30 minuti per rubare le batterie a tutti i meccanici
  HEIST_HP = 50,
  SUPER_BAT = 300; // batterie da 5 minuti per tutto il team
let blockT = 0,
  heist = null, // {t, done:[indici dei meccanici]}
  superBat = false;
let truceT = 0,
  truceCD = 0,
  advRadar = false,
  advOn = false,
  radarTgt = null,
  listMenu = null,
  specT = 0;
function resetSpecial() {
  blockT = 0;
  heist = null;
  superBat = false;
  BAT_MAX = 180;
  truceT = 0;
  truceCD = 0;
  advRadar = false;
  advOn = false;
  radarTgt = null;
  listMenu = null;
  specT = 0;
}
const truceOn = () => truceT > 0;
const isSpecial = e => !!e.kind;
const shopOff = s => s && s.offT > 0;

// ---------- Xeno speciali ----------
function makeSpecial(e, kind) {
  const k = XK[kind];
  e.kind = kind;
  e.hp = k.hp * xhp(); // rivincita: vita x2
  e.mul = k.mul;
  e.follow = false;
  e.spT = 0;
  e.arrived = false;
  e.meet = false;
  e.tgt = -1;
  e.siegeT = 0;
  e.taken = [];
  e.gpath = null;
  return e;
}
function spawnXeno() {
  const e = spawnEnemy();
  const E = meta.gameT;
  if (E >= 90 * 60 && R() < 1 / 30) {
    makeSpecial(e, 'silver');
    msg('UNO XENO SILVER E ENTRATO IN CITTA!', XK.silver.c);
    sfx('alert');
  } else if (E >= 30 * 60 && R() < 0.1) {
    makeSpecial(e, 'red');
    msg('UNO XENO ROSSO PUNTA VERSO LA RIMESSA!', XK.red.c);
    sfx('alert');
  } else msg('UN NUOVO XENO E ENTRATO IN CITTA', ACID);
  return e;
}
// segue la rete stradale fino a (x,y); true quando il percorso e' finito
function navTo(e, x, y, spd, dt) {
  e.onFoot = false;
  e.lchg = 0;
  e.gT = (e.gT || 0) - dt;
  if (!e.gpath || e.gT <= 0 || e.gx !== x || e.gy !== y) {
    e.gT = 10;
    e.gx = x;
    e.gy = y;
    e.gpath = (dijkstra(nearestNodeLOS(e.x, e.y), nearestNodeLOS(x, y)) || []).map(i => nodes[i]);
    e.gi = 0;
  }
  let q = e.gpath[e.gi];
  while (q && dist(e.x, e.y, q.x, q.y) < 16) q = e.gpath[++e.gi];
  if (!q) {
    if (dist(e.x, e.y, x, y) > 10 && los(e.x, e.y, x, y)) steerTo(e, x, y, spd * 0.5, dt);
    else e.v *= Math.pow(0.85, dt * 60);
    return true;
  }
  steerTo(e, q.x, q.y, spd, dt);
  return false;
}
const xenoSpd = e => BASE * 0.85 * (e.spd > 1 ? 1.75 : 1) * (e.mul || 1);
// movimento speciale: true se ha gia' gestito lo Xeno in questo passo
function specialMove(e, dt) {
  if (e.kind === 'silver') {
    e.spT += dt;
    if (e.spT >= 15 * 60) becomeGold(e);
    return false;
  }
  if (e.kind === 'red') {
    const g = nodes[garage.node];
    if (!e.arrived) {
      if (dist(e.x, e.y, g.x, g.y) < 300) e.arrived = true;
      else return redNav(e, g, dt);
    }
    if (e.meet) return redNav(e, g, dt);
    if (dist(e.x, e.y, garage.cx, garage.cy) > RED_LEASH) {
      e.state = 'wander';
      return redNav(e, g, dt);
    }
    return false;
  }
  if (e.kind === 'gold') {
    e.cd -= dt;
    e.hitT -= dt;
    if (e.tgt < 0 || !shops[e.tgt]) e.tgt = goldNext(e);
    if (e.tgt >= 0) {
      const s = shops[e.tgt];
      const done = navTo(e, s.x, s.y, xenoSpd(e), dt);
      if (done || dist(e.x, e.y, s.x, s.y) < 48) {
        if (!e.siegeT) msg('LO XENO GOLD ASSEDIA ' + s.name + '! 30 MIN PER FERMARLO', XK.gold.c);
        e.siegeT += dt;
        if (R() < dt * 3) spark(s.x + (R() - 0.5) * 30, s.y + (R() - 0.5) * 20, XK.gold.c, 3, 50);
        if (e.siegeT >= SIEGE_T) conquer(e, s);
      }
    }
    // non insegue nessuno ma colpisce chi gli sta addosso (anche durante la tregua)
    if (pAvail && e.cd <= 0 && !inGarage(pBody.x, pBody.y) && dist(e.x, e.y, pBody.x, pBody.y) < 34) {
      e.cd = 1.2;
      damagePlayer(15, 'xeno', e, 'weapon');
      fx.push({
        k: 'swords',
        x: e.x,
        y: e.y,
        a: Math.atan2(pBody.y - e.y, pBody.x - e.x),
        t: 0,
        dur: 0.22,
        r: 30,
        c: XK.gold.c,
        own: e,
      });
      sfx('slash');
    }
    return true;
  }
  return false;
}
function redNav(e, g, dt) {
  e.cd -= dt;
  e.hitT -= dt;
  navTo(e, g.x, g.y, xenoSpd(e), dt);
  return true;
}
function becomeGold(e) {
  e.kind = 'gold';
  e.mul = XK.gold.mul;
  e.hp = Math.max(e.hp, XK.gold.hp * xhp());
  e.tgt = -1;
  e.siegeT = 0;
  e.taken = [];
  e.gpath = null;
  e.state = 'wander';
  const b = body(e);
  fx.push({ k: 'flash', x: b.x, y: b.y, t: 0, dur: 0.8, r: 90, c: XK.gold.c });
  sfx('boom');
  msg('LO XENO SILVER E DIVENTATO XENO GOLD! ATTACCA GLI EDIFICI UNICI', XK.gold.c);
}
// edificio unico piu' vicino non ancora conquistato: la chiesa sempre per ultima
function goldNext(e) {
  let best = -1,
    bd = 1e9,
    church = -1;
  for (const s of shops) {
    if (!SHOP_T[s.type].sp || e.taken.includes(s.i)) continue;
    if (s.type === 'church') {
      church = s.i;
      continue;
    }
    const d = dist(e.x, e.y, s.x, s.y);
    if (d < bd) {
      bd = d;
      best = s.i;
    }
  }
  return best >= 0 ? best : church;
}
function conquer(e, s) {
  s.offT = OFF_T;
  e.taken.push(s.i);
  e.tgt = -1;
  e.siegeT = 0;
  e.gpath = null;
  fx.push({ k: 'flash', x: s.x, y: s.y, t: 0, dur: 1, r: 80, c: XK.gold.c });
  sfx('boom');
  shake = Math.max(shake, 4);
  msg(s.name + ' E CADUTO: FUORI USO PER 1 ORA', XK.gold.c);
  if (s.type === 'church') endGame(false, 'LO XENO GOLD HA ABBATTUTO TUTTI GLI EDIFICI UNICI');
}
// 3 Xeno Rossi davanti alla rimessa si fondono in uno Xeno Silver che rapisce 2 biker
function fuseReds(list) {
  let x = 0,
    y = 0;
  for (const e of list) {
    x += e.x / list.length;
    y += e.y / list.length;
    e.dead = true;
    spark(e.x, e.y, XK.red.c, 12, 90);
  }
  const s = makeSpecial(addEnemy(Math.floor(R() * NB), x, y, XK.silver.hp, nextEid++), 'silver');
  fx.push({ k: 'flash', x, y, t: 0, dur: 0.8, r: 100, c: XK.silver.c });
  sfx('boom');
  shake = Math.max(shake, 5);
  msg('3 XENO ROSSI SI FONDONO: XENO SILVER!', XK.silver.c);
  const cand = team.filter(b => b.status === 'garage');
  for (let i = cand.length - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [cand[i], cand[j]] = [cand[j], cand[i]];
  }
  const taken = cand.slice(0, 2);
  for (const b of taken) {
    b.status = 'captured';
    b.captor = s.id;
    b.capT = 600;
    b.medOn = false;
  }
  if (taken.length)
    msg('RAPITI ' + taken.map(b => b.name).join(' E ') + ' DALLA RIMESSA! 10 MIN PER ABBATTERE LO SILVER', '#ff3df2');
}
// ---------- tregua di Nova ----------
function startTruce(p, s) {
  if (p.nyx) return msg('NYX E GIA ATTIVA', '#ff3df2');
  if (truceOn()) return msg('TREGUA GIA IN CORSO', '#c6ff3a');
  if (truceCD > 0) return msg('NUOVA TREGUA TRA ' + fmtL(truceCD), '#ffe03c');
  if (money < TRUCE_COST) return msg('IL PROCLAMA COSTA ' + TRUCE_COST + '$', '#ff4d6d');
  money -= TRUCE_COST;
  truceT = TRUCE_DUR;
  truceCD = TRUCE_CD;
  if (p.inCar) exitCar(p, false);
  p.onFoot = false;
  p.walkPath = null;
  p.v = 0;
  p.nitroT = 0;
  p.medOn = false;
  p.hp = 1;
  p.status = 'truce';
  for (const e of enemies)
    if (e.kind !== 'gold' && e.state === 'chase') {
      e.state = 'wander';
      e.onFoot = false;
      e.lchg = 0;
    }
  fx.push({ k: 'flash', x: s.x, y: s.y, t: 0, dur: 1.2, r: 140, c: '#b48cff' });
  sfx('switch');
  sfx('nitro');
  msg('NOVA DIVENTA NYX E PROCLAMA LA TREGUA: 15 MIN SENZA ATTACCHI', '#ff3df2');
  msg('NOVA RESTA AL CENTRO ALIENI CON 1 DI VITA', '#b48cff');
  truceHostages();
  leaveActive();
}
function endTruce() {
  truceT = 0;
  const n = team[NOVA];
  if (n && n.status === 'truce') {
    n.status = 'idle';
    n.waitT = 0;
    n.chkT = 0;
  }
  msg('LA TREGUA E FINITA: GLI XENO TORNANO A CACCIA', '#ff4d6d');
  sfx('alert');
}
// ---------- Melanie: RAPINALI TUTTI! ----------
const angerCnt = add => shops.filter(s => s.type === 'shop' && Math.min(5, s.anger + add) > 3).length;
const arrestRisk = () => Math.min(1, 0.2 * angerCnt(1));
function startRobAll(p) {
  if (p.status !== 'active' || p.i !== MELANIE) return;
  if (p.inCar) exitCar(p, false);
  p.onFoot = false;
  p.walkPath = null;
  p.v = 0;
  p.nitroT = 0;
  // giro dei negozi: ogni volta il piu' vicino
  const left = shops.filter(s => s.type === 'shop');
  const seq = [];
  let x = p.x,
    y = p.y;
  while (left.length) {
    let k = 0,
      bd = 1e9;
    left.forEach((s, j) => {
      const d = dist(x, y, s.x, s.y);
      if (d < bd) {
        bd = d;
        k = j;
      }
    });
    const s = left.splice(k, 1)[0];
    seq.push(s.i);
    x = s.x;
    y = s.y;
  }
  p.rob = { seq, k: 0 };
  p.path = null;
  p.status = 'robbing';
  sfx('sneak');
  msg('MELANIE PARTE: RAPINALI TUTTI! (' + seq.length + ' NEGOZI)', '#ffd21f');
  leaveActive();
}
function updateRob(b, dt) {
  const r = b.rob;
  if (!r) {
    b.status = 'idle';
    b.waitT = 0;
    return;
  }
  const tgt = r.k < r.seq.length ? shops[r.seq[r.k]] : null;
  if (!b.path) {
    const s0 = nearestNodeLOS(b.x, b.y),
      t0 = tgt ? nearestNodeLOS(tgt.x, tgt.y) : garage.node;
    b.path = (dijkstra(s0, t0) || []).map(i => ({ x: nodes[i].x, y: nodes[i].y }));
    if (!tgt) b.path.push({ x: garage.bays[b.i].x, y: garage.bays[b.i].y });
    b.pi = 0;
  }
  const q = b.path[b.pi];
  if (q) {
    const dx = q.x - b.x,
      dy = q.y - b.y,
      d = Math.hypot(dx, dy),
      sp = speedOf(b) * dt;
    b.a += clamp(angDiff(Math.atan2(dy, dx), b.a), -8 * dt, 8 * dt);
    if (d <= sp) {
      b.x = q.x;
      b.y = q.y;
      b.pi++;
    } else {
      b.x += (dx / d) * sp;
      b.y += (dy / d) * sp;
      b.v = speedOf(b);
    }
    if (b.pi < b.path.length) return;
  }
  b.path = null;
  b.v = 0;
  if (tgt) {
    r.k++;
    pop(tgt.x, tgt.y - 24, 'RAPINA!', '#ffd21f');
    if (dist(tgt.x, tgt.y, cam.x, cam.y) < 400) sfx('cash');
  } else finishRob(b);
}
function finishRob(b) {
  b.rob = null;
  toBay(b, 'garage');
  money += ROB_PAY;
  for (const s of shops)
    if (s.type === 'shop') {
      s.anger = Math.min(5, s.anger + 1);
      s.calm = 0;
    }
  b.hp = 1;
  b.medOn = false;
  sfx('cash');
  pop(garage.cx, garage.cy - 20, '+' + ROB_PAY + '$', '#ffd21f');
  msg('MELANIE E TORNATA: +' + ROB_PAY + '$ - RABBIA +1 IN TUTTI I NEGOZI', '#ffd21f');
  const n = angerCnt(0),
    ch = Math.min(1, 0.2 * n);
  if (ch > 0 && R() < ch) {
    b.status = 'out';
    b.outR = 'ARRESTATO';
    b.outT = 3600;
    msg('MELANIE ARRESTATA (RISCHIO ' + Math.round(ch * 100) + '%): FUORI 1 ORA', '#3a7bff');
    sfx('siren');
  } else if (ch > 0) msg('MELANIE LA FA FRANCA (RISCHIO ' + Math.round(ch * 100) + '%)', '#ffd21f');
}
function payBail() {
  const ar = arrested().sort((a, b) => b.outT - a.outT);
  if (!ar.length) return msg('NESSUN BIKER ARRESTATO', '#3a7bff');
  if (money < 1000) return msg('LA CAUZIONE COSTA 1000$', '#ff4d6d');
  money -= 1000;
  sfx('cash');
  release(ar[0]);
  msg(
    'CAUZIONE PAGATA: ' + ar[0].name + ' E LIBERO' + (ar.length > 1 ? ' (' + (ar.length - 1) + ' ANCORA DENTRO)' : ''),
    '#3a7bff',
  );
}
function openCopMenu(p) {
  const items = [];
  if (arrested().length) items.push({ t: 'PAGA CAUZIONE 1000$', c: '#3a7bff', act: payBail });
  items.push({
    t: 'AVVIA: RAPINALI TUTTI! (+' + ROB_PAY + '$)',
    c: '#ffd21f',
    act: () => startRobAll(team[active]),
  });
  items.push({ t: 'CHIUDI', c: '#7a6f99' });
  listMenu = {
    title: 'COMMISSARIATO',
    sub: 'LISTA DELLA RABBIA NEI NEGOZI',
    items,
    sel: 0,
    draw: drawAngerList,
    h: 132,
  };
  sfx('menu');
}
function drawAngerList(x, y) {
  const list = shops.filter(s => s.type === 'shop');
  const half = Math.ceil(list.length / 2);
  list.forEach((s, j) => {
    const cx = x + (j < half ? 0 : 210),
      cy = y + (j % half) * 10;
    const col = s.anger >= 4 ? '#ff4d6d' : s.anger >= 3 ? '#ffb03c' : s.anger ? '#ffe03c' : '#7a6f99';
    txt(s.name, cx, cy, col);
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = k < s.anger ? col : '#2a2440';
      ctx.fillRect(cx + 92 + k * 6, cy + 1, 4, 5);
    }
    txt(s.anger + '', cx + 126, cy, col);
  });
  const rk = arrestRisk();
  txt(
    'MELANIE VISITA DA SOLA TUTTI I NEGOZI (NON GIOCABILE): +' + ROB_PAY + '$',
    VW / 2,
    y + half * 10 + 6,
    '#ffd21f',
    1,
    'center',
  );
  txt(
    'RABBIA +1, VITA 1, ARRESTO ' + Math.round(rk * 100) + '% (20% PER NEGOZIO OLTRE 3)',
    VW / 2,
    y + half * 10 + 17,
    rk >= 1 ? '#ff4d6d' : '#c9c2e6',
    1,
    'center',
  );
}
// ---------- radar avanzato (Akira, centro NASA) ----------
function toggleRadar() {
  sfx('alert');
  if (!advRadar) {
    radarOn = !radarOn;
    return msg(radarOn ? 'RADAR NEGOZI ACCESO' : 'RADAR NEGOZI SPENTO', '#ffe03c');
  }
  // tre possibilita': negozi -> avanzato -> spento
  if (!radarOn && !advOn) {
    radarOn = true;
    msg('RADAR NEGOZI ACCESO', '#ffe03c');
  } else if (radarOn) {
    radarOn = false;
    openRadarMenu();
  } else {
    advOn = false;
    radarTgt = null;
    msg('RADAR SPENTO', '#7a6f99');
  }
}
function openRadarMenu() {
  const pb = body(team[active]),
    items = [];
  const m = d => ' (' + Math.round(d / PXM) + 'M)';
  const pick = (t, c, tg) => items.push({ t, c, act: () => setRadar(tg) });
  const xs = enemies
    .filter(e => !e.dead)
    .map(e => ({ e, d: dist(body(e).x, body(e).y, pb.x, pb.y) }))
    .sort((a, b) => a.d - b.d);
  // al massimo 4 Xeno speciali: la lista resta dentro lo schermo
  for (const o of xs.filter(o => o.e.kind).slice(0, 4)) pick(XK[o.e.kind].name + m(o.d), XK[o.e.kind].c, { k: 'xeno', id: o.e.id });
  xs.filter(o => !o.e.kind)
    .slice(0, 3)
    .forEach((o, j) => pick('XENO ' + (j + 1) + m(o.d), ACID, { k: 'xeno', id: o.e.id }));
  if (mission) pick('MISSIONE PACCO', '#ffe03c', { k: 'mission' });
  for (const ty of ['pharm', 'mech', 'shop'])
    pick(SHOP_T[ty].name + ' PIU VICINO', SHOP_T[ty].c, { k: 'near', type: ty });
  for (const s of shops)
    if (SHOP_T[s.type].sp) pick(s.name + m(dist(s.x, s.y, pb.x, pb.y)), SHOP_T[s.type].c, { k: 'shop', i: s.i });
  pick('RIMESSA', '#ff3df2', { k: 'garage' });
  listMenu = {
    title: 'RADAR AVANZATO',
    sub: 'SCEGLI IL SOLO OBIETTIVO DA SEGUIRE',
    items,
    sel: 0,
    key: 'radar',
    cancel: () => msg('RADAR SPENTO', '#7a6f99'),
  };
}
function setRadar(tg) {
  advOn = true;
  radarTgt = tg;
  const r = radarPos(body(team[active]));
  msg('RADAR AVANZATO: ' + (r ? r.n : 'OBIETTIVO'), '#ff8a1f');
}
// posizione e nome dell'obiettivo del radar avanzato (null = perso)
function radarPos(pb) {
  const t = radarTgt;
  if (!t) return null;
  if (t.k === 'xeno') {
    const e = enemies.find(e => e.id === t.id && !e.dead);
    if (!e) return null;
    const b = body(e);
    return { x: b.x, y: b.y, n: e.kind ? XK[e.kind].name : 'XENO' };
  }
  if (t.k === 'mission') {
    const s = missionTarget();
    return s ? { x: s.x, y: s.y, n: mission.carrier < 0 ? 'PACCO ' + s.name : 'CONSEGNA ' + s.name } : null;
  }
  if (t.k === 'near') {
    let best = null,
      bd = 1e9;
    for (const s of shops)
      if (s.type === t.type) {
        const d = dist(s.x, s.y, pb.x, pb.y);
        if (d < bd) {
          bd = d;
          best = s;
        }
      }
    return best ? { x: best.x, y: best.y, n: best.name } : null;
  }
  if (t.k === 'shop') {
    const s = shops[t.i];
    return s ? { x: s.x, y: s.y, n: s.name } : null;
  }
  return { x: garage.cx, y: garage.cy, n: 'RIMESSA' };
}
// ---------- SHIFT + cambia biker: chi resta indietro torna in rimessa ----------
const shiftHeld = () => pressed.has('ShiftSwitch') || !!(keys.ShiftLeft || keys.ShiftRight);
function sendHome(b) {
  if (b.status !== 'idle') return;
  const pl = planReturn(b);
  if (!pl) return msg(b.name + ' NON TROVA LA STRADA PER LA RIMESSA', '#ff4d6d');
  b.path = pl.pts;
  b.pi = 0;
  b.status = 'returning';
  b.waitT = 0;
  b.waitCharge = false;
  msg(b.name + ' RIENTRA IN RIMESSA' + (b.bat < pl.len / speedOf(b) ? ' (BATTERIA NON BASTA, SI FERMERA)' : ''), b.ui);
}
// ---------- BLOCK di Caspian (R dalla rimessa) ----------
function caspianBlock(p) {
  const b = body(p);
  if (!inGarage(b.x, b.y)) return msg('CASPIAN PUO DARE IL BLOCK SOLO DALLA RIMESSA', '#ffe03c');
  if (blockT > 0) {
    blockT = 0;
    sfx('mount');
    return msg('BLOCK ANNULLATO: I BIKER TORNANO A RIENTRARE DA SOLI', '#f2f2f2');
  }
  blockT = BLOCK_T;
  sfx('switch');
  msg('BLOCK! PER 30 MIN NESSUN BIKER RIENTRA DA SOLO IN RIMESSA', '#f2f2f2');
}
// ---------- Melanie: colpo delle batterie ai meccanici ----------
const mechCount = () => shops.filter(s => s.type === 'mech').length;
function heistHint(s) {
  if (heist && heist.done.includes(s.i)) return '!BATTERIE GIA RUBATE QUI (' + heist.done.length + '/' + mechCount() + ')';
  return 'RUBA LE BATTERIE -' + HEIST_HP + ' VITA (' + (heist ? heist.done.length : 0) + '/' + mechCount() + ')';
}
function stealBattery(p, s, b) {
  if (heist && heist.done.includes(s.i)) return msg('LE BATTERIE DI QUESTO MECCANICO SONO GIA TUE', '#ffe03c');
  if (!heist) {
    heist = { t: HEIST_T, done: [] };
    msg('COLPO DELLE BATTERIE: 30 MIN PER RAPINARE TUTTI I MECCANICI', '#ffd21f');
  }
  heist.done.push(s.i);
  const n = heist.done.length,
    tot = mechCount();
  sfx('sneak');
  sfx('cash');
  pop(b.x, b.y - 24, 'BATTERIE ' + n + '/' + tot, '#ffd21f');
  p.hp -= HEIST_HP;
  p.lastSrc = 'shop';
  hurt = 0.25;
  shake = Math.max(shake, 3);
  sfx('hurt');
  msg('MELANIE RUBA LE BATTERIE (' + n + '/' + tot + '): -' + HEIST_HP + ' VITA', '#ffd21f');
  if (n >= tot) {
    heist = null;
    superBat = true;
    BAT_MAX = SUPER_BAT;
    for (const t of team) t.bat = Math.min(BAT_MAX, t.bat + (SUPER_BAT - 180));
    sfx('nitro');
    msg('TUTTI I MECCANICI RAPINATI! BATTERIE DA 5 MIN E RICARICA X3 IN RIMESSA', '#3cf2ff');
  }
}
// ---------- aggiornamento (chiamato da update) ----------
function updateSpecial(dt) {
  if (blockT > 0) {
    blockT -= dt;
    if (blockT <= 0) {
      blockT = 0;
      msg('BLOCK FINITO: I BIKER RIENTRANO DI NUOVO DA SOLI', '#f2f2f2');
    }
  }
  if (heist) {
    heist.t -= dt;
    if (heist.t <= 0) {
      msg('COLPO DELLE BATTERIE FALLITO: 30 MINUTI SCADUTI (' + heist.done.length + '/' + mechCount() + ')', '#ff4d6d');
      heist = null;
    }
  }
  truceCD = Math.max(0, truceCD - waitDt(dt));
  if (truceT > 0) {
    truceT -= dt;
    if (truceT <= 0) endTruce();
  }
  for (const s of shops)
    if (s.offT > 0) {
      s.offT -= waitDt(dt);
      if (s.offT <= 0) {
        s.offT = 0;
        msg(s.name + ' TORNA OPERATIVO', SHOP_T[s.type].c);
      }
    }
  specT -= dt;
  if (specT > 0) return;
  specT = 0.5;
  const g = nodes[garage.node];
  const reds = enemies.filter(e => e.kind === 'red' && !e.dead && e.arrived);
  const meet = reds.length >= 3 && !truceOn();
  for (const e of reds) e.meet = meet;
  if (meet) {
    const near = reds.filter(e => dist(e.x, e.y, g.x, g.y) < 110);
    if (near.length >= 3) fuseReds(near.slice(0, 3));
  }
}
// ---------- menu a lista ----------
function listInput() {
  const m = listMenu,
    n = m.items.length;
  if (mhit('up')) m.sel = (m.sel + n - 1) % n;
  if (mhit('down')) m.sel = (m.sel + 1) % n;
  if (mhit('ok')) {
    const it = m.items[m.sel];
    listMenu = null;
    if (it.act) it.act();
    else if (m.cancel) m.cancel();
  } else if (mhit('back') || take('use') || (m.key && take(m.key))) {
    listMenu = null;
    if (m.cancel) m.cancel();
  }
}
function drawListMenu() {
  const m = listMenu;
  ctx.fillStyle = 'rgba(5,3,12,.85)';
  ctx.fillRect(0, 0, VW, VH);
  const ih = 12,
    h = 58 + (m.h || 0) + m.items.length * ih,
    y0 = Math.max(4, Math.round(VH / 2 - h / 2));
  panel(100, y0, 440, h);
  txt(m.title, VW / 2, y0 + 8, '#ffffff', 2, 'center');
  txt(m.sub, VW / 2, y0 + 26, '#c9c2e6', 1, 'center');
  let y = y0 + 40;
  if (m.draw) {
    m.draw(116, y);
    y += m.h;
  }
  m.items.forEach((it, k) => {
    const yy = y + k * ih;
    if (k === m.sel) {
      ctx.fillStyle = 'rgba(255,61,242,.18)';
      ctx.fillRect(110, yy - 2, 420, ih);
      txt('>', 114, yy, '#ffffff');
    }
    txt(it.t, 126, yy, it.c || '#ffffff');
  });
  txt(KM('ok') + ' SCEGLI   -   ' + KM('back') + ' CHIUDI', VW / 2, y0 + h - 12, '#7a6f99', 1, 'center');
}
