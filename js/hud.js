'use strict';
// =====================================================================
//  HUD, MENU E SCHERMATE
// =====================================================================
function panel(x, y, w, h) {
  ctx.fillStyle = 'rgba(8,5,16,.8)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ff3df2';
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = '#3cf2ff';
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, 2, 1);
  ctx.fillRect(x + w - 2, y + h - 1, 2, 1);
}
const barPat = (() => {
  const c = mk(4, 8),
    g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,.45)';
  g.fillRect(3, 0, 1, 8);
  return ctx.createPattern(c, 'repeat');
})();
function bar(x, y, w, h, f, col) {
  ctx.fillStyle = '#1a1426';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col;
  ctx.fillRect(x, y, Math.round(w * clamp(f, 0, 1)), h);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = barPat;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
// bussola: anello disegnato una volta sola
const compassCv = (() => {
  const c = mk(60, 60),
    g = c.getContext('2d');
  g.fillStyle = 'rgba(8,5,16,.8)';
  g.beginPath();
  g.arc(30, 30, 28, 0, 6.283);
  g.fill();
  for (let a = 0; a < 72; a++) {
    g.fillStyle = a % 18 === 0 ? '#ffffff' : a % 2 ? '#ff3df2' : '#3cf2ff';
    g.fillRect(
      Math.round(30 + Math.cos((a / 72) * 6.283) * 27),
      Math.round(30 + Math.sin((a / 72) * 6.283) * 27),
      1,
      1,
    );
  }
  return c;
})();
function pips(x, y, n, max, col) {
  for (let i = 0; i < max; i++) {
    ctx.fillStyle = i < n ? col : '#2a2238';
    ctx.fillRect(x + i * 4, y, 3, 5);
  }
}
// riquadro con il nome del tasto/pulsante
function keyCap(k, x, y, col) {
  const w = textW(k, 1) + 6;
  ctx.fillStyle = col || '#ffe03c';
  ctx.fillRect(x, y, w, 11);
  ctx.fillStyle = '#0b0814';
  ctx.fillRect(x + 1, y + 1, w - 2, 9);
  txt(k, x + 3, y + 2, col || '#ffe03c', 1, 'left', '');
  return w;
}
function strip(s, x, y, col, a) {
  const w = textW(s, 1) + 8;
  ctx.fillStyle = 'rgba(8,5,16,' + (a == null ? 0.7 : a) + ')';
  ctx.fillRect(Math.round(x - w / 2), y - 2, w, 11);
  txt(s, x, y, col, 1, 'center');
}
const hpCol = f => (f > 0.5 ? '#5cff7a' : f > 0.25 ? '#ffe03c' : '#ff4d6d');

function statusTxt(b) {
  switch (b.status) {
    case 'active':
      return [
        b.nyx ? 'NYX' : b.inCar ? 'AUTO POLIZIA' : b.onFoot ? 'A PIEDI' : 'IN GUIDA',
        b.nyx ? '#ff3df2' : '#5cff7a',
      ];
    case 'garage':
      return ['IN RIMESSA', '#3cf2ff'];
    case 'idle':
      if (inMission(b)) return ['NELLO STADIO', '#9fd4ff'];
      if (blockT > 0) return ['FERMO (BLOCK)', '#f2f2f2'];
      return [b.waitT > 0 ? 'FERMO ' + fmt(b.waitT) : 'ATTENDE CARICA', '#ffe03c'];
    case 'returning':
      return ['RIENTRO', '#ff9de6'];
    case 'amb':
      return ['AUTO MEDICA', '#ffffff'];
    case 'waitamb':
      return ['SOCCORSI', '#ff9de6'];
    case 'medbay':
      return ['IN CURA ' + Math.floor((b.hp / maxHP) * 100) + '%', '#5cff7a'];
    case 'fetch':
      return ['VA ALLA MOTO', '#ffe03c'];
    case 'hosp':
      return ['OSPEDALE ' + Math.floor((b.hp / maxHP) * 100) + '%', '#ff4d6d'];
    case 'out':
      return [
        (b.outR === 'ARRESTATO' ? 'ARRESTO' : b.outR) + ' ' + shortT(b.outT),
        b.outR === 'ARRESTATO' ? '#3a7bff' : '#ff4d6d',
      ];
    case 'captured':
      return ['RAPITO ' + shortT(b.capT), '#ff3df2'];
    case 'robbing':
      return ['RAPINALI TUTTI! ' + (b.rob ? b.rob.k + '/' + b.rob.seq.length : ''), '#ffd21f'];
    case 'truce':
      return ['TREGUA ' + shortT(truceT), '#c6ff3a'];
    case 'dead':
      return ['MORTO', '#6a5f80'];
  }
  return ['', ''];
}
// versione corta (max 9 caratteri) per le schede del roster
function statusShort(b) {
  const pc = Math.floor((b.hp / maxHP) * 100) + '%';
  switch (b.status) {
    case 'active':
      return [b.nyx ? 'NYX' : b.inCar ? 'AUTO POL' : b.onFoot ? 'A PIEDI' : 'IN GUIDA', b.nyx ? '#ff3df2' : '#5cff7a'];
    case 'garage':
      return ['RIMESSA', '#3cf2ff'];
    case 'idle':
      if (inMission(b)) return ['STADIO', '#9fd4ff'];
      if (blockT > 0) return ['BLOCK', '#f2f2f2'];
      return [b.waitT > 0 ? 'STOP ' + fmt(b.waitT) : 'CARICA', '#ffe03c'];
    case 'returning':
      return ['RIENTRO', '#ff9de6'];
    case 'amb':
      return ['SOCCORSO', '#ffffff'];
    case 'waitamb':
      return ['SOCCORSI', '#ff9de6'];
    case 'medbay':
      return ['CURA ' + pc, '#5cff7a'];
    case 'fetch':
      return ['VA MOTO', '#ffe03c'];
    case 'hosp':
      return ['OSP ' + pc, '#ff4d6d'];
    case 'out':
      return [
        ({ ARRESTATO: 'ARR ', FERITO: 'FER ', FUGGITO: 'FUGA ', ESAUSTA: 'KO ', OSTAGGIO: 'OST ', PRIGIONIERO: 'PRIG ' }[
          b.outR
        ] || 'OUT ') + shortT(b.outT),
        b.outR === 'ARRESTATO' ? '#3a7bff' : '#ff4d6d',
      ];
    case 'captured':
      return ['RAP ' + shortT(b.capT), '#ff3df2'];
    case 'robbing':
      return ['RAP ' + (b.rob ? b.rob.k + '/' + b.rob.seq.length : ''), '#ffd21f'];
    case 'truce':
      return ['TREG ' + shortT(truceT), '#c6ff3a'];
    case 'dead':
      return ['MORTO', '#6a5f80'];
  }
  return ['', ''];
}

function drawTopBar() {
  const E = nightE();
  panel(206, 4, 334, 36);
  txt(hhmm(E), 212, 8, E >= NIGHT ? '#ffb03c' : '#ffffff', 2);
  bar(212, 26, 58, 3, E / NIGHT, E >= NIGHT ? '#ffb03c' : '#7a6fff'); // avanzamento della notte verso le 06:00
  if (weather.int > 0.3) {
    icon('rain', 212, 31, '#9fb4ff');
    txt('PIOGGIA', 221, 32, '#9fb4ff');
  }
  const xn = cityXeno(),
    xs = enemies.length - xn,
    xc = xn >= 16 ? '#ff4d6d' : xn >= 10 ? '#ffb03c' : ACID;
  icon('skull', 280, 8, xc);
  txt('XENO ' + xn + '/20' + (xs ? ' +' + xs : ''), 290, 8, xc);
  bar(280, 18, 96, 4, xn / 20, xc);
  txt(
    E >= NIGHT ? 'ALBA: NIENTE RINFORZI' : noSpawnT > 0 ? 'CHIESA STOP ' + fmt(noSpawnT) : 'RINFORZO ' + fmt(respawnT),
    280,
    26,
    noSpawnT > 0 ? '#e6e0ff' : '#ff9de6',
  );
  icon('cash', 384, 8, '#ffe03c');
  txt('' + money, 394, 8, '#ffe03c');
  icon('skull', 384, 18, '#ffffff');
  txt('' + kills, 394, 18, '#ffffff');
  icon('cop', 438, 8, '#9fd4ff');
  txt('' + police.filter(c => !c.leave && !c.gone).length, 448, 8, '#9fd4ff');
  icon('med', 438, 18, '#5cff7a');
  txt('' + garageMeds, 448, 18, '#5cff7a');
  if (policeOp) txt('POLIZIA ' + (10 - policeOp.left) + '/10', 384, 30, '#3a7bff');
  if (bonds.length) {
    txt('OBBL. ' + bonds.length, 470, 8, '#ffd27a');
    txt('+' + 40 * bonds.length + '$ ' + fmt(bondT), 470, 18, '#ffd27a');
  }
  if (radarOn) txt('RADAR', 470, 30, '#ffe03c');
  else if (advOn) txt('RADAR+', 470, 30, '#ff8a1f');
}
// azione contestuale vicino al giocatore: [tasto, testo]
function hudPrompt(p) {
  const b = body(p);
  if (p.onFoot && !p.inCar) {
    if (nearFreeCar(b)) return [K('use'), "RUBA L'AUTO"];
  }
  const s = nearShop(b);
  if (s && !p.inCar) {
    if (shopOff(s)) return [null, s.name + ' FUORI USO ' + fmtL(s.offT)];
    if (mission && mission.carrier < 0 && s.i === mission.from)
      return [K('use'), 'PRENDI IL PACCO (' + mission.pay + '$)'];
    if (mission && mission.carrier === p.i && s.i === mission.to) return [K('use'), 'CONSEGNA IL PACCO'];
    const a = SHOP_ACT[s.type],
      h = a ? a.hint(p, s) : '';
    if (h) return h[0] === '!' ? [null, h.slice(1)] : [K('use'), h];
  }
  if (p.onFoot && !p.inCar && !p.walkPath && dist(p.fx, p.fy, p.x, p.y) < 26) return [K('mount'), 'SALI IN MOTO'];
  return null;
}
function drawHUD() {
  const p = team[active],
    pb = body(p),
    R0 = ROSTER[p.i];
  panel(4, 4, 198, 78);
  ctx.drawImage(p.por, 9, 9);
  if (p.nyx) {
    ctx.fillStyle = 'rgba(180,60,255,.4)';
    ctx.fillRect(9, 9, 24, 24);
  }
  ctx.fillStyle = p.ui;
  ctx.fillRect(8, 8, 26, 1);
  ctx.fillRect(8, 33, 26, 1);
  ctx.fillRect(8, 8, 1, 26);
  ctx.fillRect(33, 8, 1, 26);
  txt(p.nyx ? 'NYX' : p.name, 38, 9, p.nyx ? '#ff3df2' : p.ui, 2);
  txt(
    p.tuned && !p.nyx ? 'MOTO X' + (p.i === 2 ? '1.2' : '1.6') : p.nyx ? 'DEA' : p.sex,
    196,
    9,
    p.tuned ? '#ff6ec7' : '#7a6f99',
    1,
    'right',
  );
  const hf = p.hp / maxHP;
  icon('heart', 38, 26, '#ff6e8a');
  bar(48, 27, 118, 5, hf, hpCol(hf));
  txt(Math.ceil(p.hp) + '', 196, 26, '#ffffff', 1, 'right');
  const lowB = p.bat < 20;
  icon('bolt', 38, 36, '#3cf2ff');
  bar(48, 37, 118, 5, p.bat / BAT_MAX, lowB && blink(4) ? '#ff4d6d' : '#3cf2ff');
  txt(fmt(p.bat), 196, 36, lowB ? '#ff4d6d' : '#ffffff', 1, 'right');
  const still = p.onFoot || Math.abs(p.v) < 4,
    gar = inGarage(p.x, p.y),
    per = gar ? (superBat ? 10 : 15) : 30;
  icon('sun', 9, 37, '#ffe03c');
  bar(18, 40, 16, 3, still && p.bat < BAT_MAX ? p.chg / per : 0, '#ffe03c');
  if (gar) txt(superBat ? 'X3' : 'X2', 10, 47, '#ff3df2');
  if (p.medOn && blink(2)) txt('+', 26, 47, '#5cff7a');
  let line,
    lc = '#c9c2e6';
  if (p.inCar) line = 'AUTO POLIZIA: RIMESSA O COMMISSARIATO';
  else if (p.onFoot)
    line = p.walkPath ? 'TORNA ALLA MOTO...' : 'A PIEDI - PUGNI ' + (p.punch.dmg + dmgBonus(p)) + ' DANNI';
  else if (p.bat <= 0) {
    line = 'BATTERIA SCARICA';
    lc = '#ff4d6d';
  } else if (p.wpn && p.wpn.k === 'laser')
    line = 'SPADA LASER: MORTALE' + (p.weapons.length > 1 ? ' [' + K('weapon') + ']' : '');
  else
    line = p.wpn
      ? p.wpn.label +
        ' ' +
        (p.wpn.dmg + dmgBonus(p)) +
        ' DANNI' +
        (p.weapons.length > 1 ? ' [' + K('weapon') + ']' : '')
      : 'NESSUNA ARMA - ' + K('mount') + ' PER I PUGNI';
  txt(line, 38, 47, lc);
  icon('med', 38, 57, '#5cff7a');
  pips(47, 58, p.meds, 3, '#5cff7a');
  icon('bolt', 64, 57, p.nitroT > 0 ? '#3cf2ff' : '#ffb03c');
  pips(73, 58, p.nitro, 5, '#ffb03c');
  if (p.nitroT > 0) txt(Math.ceil(p.nitroT) + 'S', 96, 57, '#3cf2ff');
  icon('shield', 116, 57, p.shield ? '#9fd4ff' : '#3a3350');
  txt(p.shield ? (p.shieldT === null ? 'PRONTO' : fmt(p.shieldT)) : '-', 126, 57, p.shield ? '#9fd4ff' : '#4e4566');
  if (trained.includes(p.i)) txt('+2', 196, 57, '#3fd46b', 1, 'right');
  // riga speciale del personaggio
  let sp = null,
    sc = '#7a6f99';
  if (p.nyx) {
    sp = 'NYX: -10 VITA/MIN - FEDELI ' + enemies.filter(e => e.follow).length;
    sc = '#ff3df2';
  } else if (p.wpn && p.wpn.k === 'laser' && !p.onFoot && !p.inCar) {
    if (p.lchg > 0) {
      txt('CARICA', 38, 68, '#ff8a1f');
      bar(78, 69, 88, 4, p.lchg / p.wpn.chg, '#ff8a1f');
    } else {
      sp = 'TIENI ' + K('attack') + ': SI FERMA E CARICA 1S';
      sc = '#ff8a1f';
    }
  } else if (R0.laserShield && !p.onFoot && !p.inCar) {
    sp = 'SCUDO LASER: OGNI COLPO -1';
    sc = '#ffd21f';
  } else if (isLeader(p.i) && inGarage(pb.x, pb.y)) {
    sp = K('recall') + ': RICHIAMA TUTTI IN RIMESSA';
    sc = p.ui;
  } else if (p.i === 2 && inGarage(pb.x, pb.y)) {
    sp = K('recall') + (blockT > 0 ? ': ANNULLA IL BLOCK ' + fmt(blockT) : ': BLOCK 30 MIN (NESSUNO RIENTRA)');
    sc = '#f2f2f2';
  }
  if (sp) txt(sp, 38, 68, sc);
  drawTopBar();
  // bussola
  const cx = VW - 34,
    cy = 36;
  ctx.drawImage(compassCv, cx - 30, cy - 30);
  txt('N', cx, cy - 24, '#ffffff', 1, 'center', '');
  txt('S', cx, cy + 18, '#7a6f99', 1, 'center', '');
  txt('E', cx + 21, cy - 3, '#7a6f99', 1, 'center', '');
  txt('O', cx - 21, cy - 3, '#7a6f99', 1, 'center', '');
  let ne = null,
    nd = 1e9;
  for (const e of enemies) {
    if (e.follow && p.nyx) continue;
    const b = body(e);
    const d = dist(b.x, b.y, pb.x, pb.y);
    if (d < nd) {
      nd = d;
      ne = b;
    }
  }
  const needle = (a, col, len) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(-3, -5);
    ctx.lineTo(0, 0);
    ctx.lineTo(-3, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  let capE = null,
    cd2 = 1e9,
    capB = null;
  for (const t of team) {
    if (t.status !== 'captured') continue;
    const e = enemies.find(e => e.id === t.captor);
    if (!e) continue;
    const d = dist(e.x, e.y, pb.x, pb.y);
    if (d < cd2) {
      cd2 = d;
      capE = e;
      capB = t;
    }
  }
  if (capE) needle(Math.atan2(capE.y - pb.y, capE.x - pb.x), '#ff3df2', 14);
  if (stad && stad.phase === 'ransom') needle(Math.atan2(stadium.cy - pb.y, stadium.cx - pb.x), '#ff6ec7', 18);
  const gold = enemies.find(e => e.kind === 'gold');
  if (gold) needle(Math.atan2(gold.y - pb.y, gold.x - pb.x), XK.gold.c, 16);
  if (ne) {
    needle(Math.atan2(ne.y - pb.y, ne.x - pb.x), ACID, 19);
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
    txt('XENO ' + Math.round(nd / 8) + 'M', cx, cy + 32, nd < 260 && blink(4) ? '#ff4d6d' : ACID, 1, 'center');
  } else txt('NESSUN XENO', cx, cy + 32, '#7a6f99', 1, 'center');
  let my2 = cy + 42;
  if (capE) {
    txt('RAPITO ' + capB.name + ' ' + Math.round(cd2 / 8) + 'M', VW - 4, my2, '#ff3df2', 1, 'right');
    txt(fmtL(capB.capT), VW - 4, my2 + 9, '#ff3df2', 1, 'right');
    my2 += 20;
  }
  if (mission) {
    const t = missionTarget();
    if (mission.carrier < 0 || mission.carrier === active) {
      needle(Math.atan2(t.y - pb.y, t.x - pb.x), '#ffe03c', 11);
      txt(
        (mission.carrier < 0 ? 'PACCO DA ' : 'CONSEGNA A ') +
          t.name +
          ' ' +
          Math.round(dist(t.x, t.y, pb.x, pb.y) / 8) +
          'M',
        VW - 4,
        my2,
        '#ffe03c',
        1,
        'right',
      );
    } else txt('PACCO CON ' + team[mission.carrier].name, VW - 4, my2, '#ffe03c', 1, 'right');
    txt('MISSIONE ' + mission.pay + '$ - ' + fmt(missionT), VW - 4, my2 + 9, '#ffe03c', 1, 'right');
    my2 += 20;
  }
  if (radarOn) {
    for (const ty of ['pharm', 'mech', 'shop']) {
      let best = null,
        bd = 1e9;
      for (const s of shops) {
        if (s.type !== ty) continue;
        const d = dist(s.x, s.y, pb.x, pb.y);
        if (d < bd) {
          bd = d;
          best = s;
        }
      }
      if (!best) continue;
      const c = SHOP_T[ty].c;
      needle(Math.atan2(best.y - pb.y, best.x - pb.x), c, 9);
      txt(SHOP_T[ty].name + ' ' + Math.round(bd / 8) + 'M', VW - 4, my2, c, 1, 'right');
      my2 += 9;
    }
  }
  if (advOn) {
    const r = radarPos(pb);
    if (r) {
      needle(Math.atan2(r.y - pb.y, r.x - pb.x), '#ff8a1f', 17);
      txt('RADAR: ' + r.n + ' ' + Math.round(dist(r.x, r.y, pb.x, pb.y) / 8) + 'M', VW - 4, my2, '#ff8a1f', 1, 'right');
    } else txt('RADAR: OBIETTIVO PERSO (' + K('radar') + ')', VW - 4, my2, '#7a6f99', 1, 'right');
    my2 += 9;
  }
  // minimappa
  const mx = 4,
    my = VH - 108,
    MS = 100;
  panel(mx, my, MS + 4, MS + 4);
  const pmx = pb.x / 32,
    pmy = pb.y / 32;
  const sx = clamp(Math.round(pmx - MS / 2), 0, MW / 2 - MS),
    sy = clamp(Math.round(pmy - MS / 2), 0, MH / 2 - MS);
  ctx.drawImage(miniCv, sx, sy, MS, MS, mx + 2, my + 2, MS, MS);
  const mark = (x, y, c, s, clampIt = true) => {
    let X = Math.round(x / 32 - sx),
      Y = Math.round(y / 32 - sy);
    if (!clampIt && (X < 0 || Y < 0 || X >= MS || Y >= MS)) return;
    X = clamp(X, 0, MS - 1);
    Y = clamp(Y, 0, MS - 1);
    ctx.fillStyle = c;
    ctx.fillRect(mx + 2 + X - (s >> 1), my + 2 + Y - (s >> 1), s, s);
  };
  for (const s of shops) mark(s.x, s.y, SHOP_T[s.type].c, SHOP_T[s.type].sp ? 3 : 2, false);
  if (amb) mark(amb.x, amb.y, blink(6) ? '#ff2b4a' : '#ffffff', 3, false);
  if (mission && blink(3)) {
    const t = missionTarget();
    mark(t.x, t.y, '#ffe03c', 4);
  }
  for (const c of police)
    mark(c.x, c.y, c.mode === 'abandoned' ? '#9fd4ff' : blink(6) ? '#ff2b4a' : '#2b6bff', 2, false);
  mark(garage.cx, garage.cy, blink(2) ? '#ff3df2' : '#ffffff', 4);
  if (stad) mark(stadium.cx, stadium.cy, blink(3) ? '#ff2b4a' : '#ff6ec7', 4);
  for (const b of team) if (b.i !== active && AVAIL(b.status)) mark(b.x, b.y, b.ui, 2);
  if (capE && blink(3)) mark(capE.x, capE.y, '#ff3df2', 3);
  for (const e of enemies) if (e.kind) mark(e.x, e.y, XK[e.kind].c, 3, e.kind !== 'gold');
  if (advOn && blink(3)) {
    const r = radarPos(pb);
    if (r) mark(r.x, r.y, '#ff8a1f', 4);
  }
  mark(pb.x, pb.y, '#ffffff', 3);
  txt('MAPPA (' + K('map') + ')', mx + 4, my + 4, '#3cf2ff');
  drawRoster();
  // avvisi importanti sotto la barra in alto
  const AX = 374;
  let ay = 46;
  if (xenoFullT !== null) {
    strip('XENO 20/20 - ABBATTINE UNO ENTRO ' + fmt(xenoFullT), AX, ay, blink(4) ? '#ff4d6d' : '#ffffff', 0.85);
    ay += 12;
    if (nyxOn()) {
      strip('NYX FERMA IL TEMPO: PORTALA IN RIMESSA', AX, ay, '#ff3df2');
      ay += 12;
    }
  } else if (enemies.length < 3 && lowT > 0) {
    strip('XENO SOTTO 3: ' + fmtL(lowT) + ' / 30:00 PER VINCERE', AX, ay, '#5cff7a');
    ay += 12;
  }
  if (truceOn()) {
    strip('TREGUA DI NYX ' + fmt(truceT) + ' - NESSUNO ATTACCA', AX, ay, '#c6ff3a');
    ay += 12;
  }
  if (stad) {
    const t =
      stad.phase === 'siege'
        ? [
            'XENO ALLO STADIO: ' +
              enemies.filter(e => e.stad && e.ready).length +
              '/12 ARRIVATI' +
              (stad.need > 0 ? ' - RINFORZI ' + stad.need + ' (' + Math.ceil(stad.spawnT) + 'S)' : ''),
            blink(2) ? '#ff4d6d' : '#ffffff',
          ]
        : stad.phase === 'enter'
          ? ['GLI XENO ENTRANO: ' + enemies.filter(e => e.stad && e.sm === 'in').length + '/12 DENTRO - ASPETTA', '#ff9de6']
          : stad.phase === 'fight'
          ? ['STADIO: XENO ABBATTUTI ' + stad.killed + '/12 - RESTANO ' + stadXeno(), '#9fd4ff']
          : [
              'OSTAGGI NELLO STADIO: NOVA ENTRO ' + fmt(stad.t) + ' (' + Math.round(dist(stadium.cx, stadium.cy, pb.x, pb.y) / 8) + 'M)',
              blink(2) ? '#ff6ec7' : '#ffffff',
            ];
    strip(t[0], AX, ay, t[1]);
    ay += 12;
  } else {
    const h = stadiumHint(pb);
    if (h) {
      strip(h[0], AX, ay, h[1]);
      ay += 12;
    }
  }
  if (blockT > 0) {
    strip('BLOCK DI CASPIAN ' + fmt(blockT) + ' - NESSUNO RIENTRA DA SOLO', AX, ay, '#f2f2f2');
    ay += 12;
  }
  if (heist) {
    strip('COLPO BATTERIE ' + heist.done.length + '/' + mechCount() + ' - ' + fmt(heist.t), AX, ay, '#ffd21f');
    ay += 12;
  }
  for (const e of enemies) {
    if (e.kind === 'gold') {
      const s = e.tgt >= 0 ? shops[e.tgt] : null;
      if (s)
        strip(
          e.siegeT > 0
            ? 'XENO GOLD ASSEDIA ' + s.name + ': CADE TRA ' + fmt(SIEGE_T - e.siegeT)
            : 'XENO GOLD VERSO ' + s.name,
          AX,
          ay,
          blink(2) ? XK.gold.c : '#ffffff',
        );
      ay += 12;
    } else if (e.kind === 'silver') {
      strip('XENO SILVER: DIVENTA GOLD TRA ' + fmt(15 * 60 - e.spT), AX, ay, XK.silver.c);
      ay += 12;
    }
  }
  const nr = enemies.filter(e => e.kind === 'red').length;
  if (nr) {
    strip('XENO ROSSI VERSO LA RIMESSA: ' + nr + '/3', AX, ay, XK.red.c);
    ay += 12;
  }
  if (p.bat < 15 && p.bat > 0 && blink(2)) {
    strip('BATTERIA BASSA', AX, ay, '#ff4d6d');
    ay += 12;
  }
  if (nightE() < 40) {
    strip('GUIDA ' + KDRIVE() + ' - ATTACCO ' + K('attack'), AX, ay, '#c9c2e6');
    ay += 12;
    strip(
      K('mount') + ' SCENDI - ' + K('use') + ' AZIONE - ' + K('switch') + ' CAMBIA BIKER (+SHIFT: RIENTRA)',
      AX,
      ay,
      '#c9c2e6',
    );
    ay += 12;
    strip(K('pause') + ' PAUSA E COMANDI - ' + K('map') + ' MAPPA', AX, ay, '#7a6f99');
  }
  // azione contestuale + messaggi in basso (non coprono piu' il centro dello schermo)
  let by = VH - 46;
  const pr = hudPrompt(p);
  if (pr) {
    const tw = textW(pr[1], 1),
      kw = pr[0] ? textW(pr[0], 1) + 10 : 0,
      w = tw + kw + 10,
      x = Math.round(AX - w / 2);
    panel(x, by - 3, w, 15);
    if (pr[0]) keyCap(pr[0], x + 4, by - 1);
    txt(pr[1], x + 6 + kw, by + 1, pr[0] ? '#ffffff' : '#ffe03c');
    by -= 16;
  }
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    ctx.globalAlpha = Math.min(1, m.life);
    strip(m.t, AX, by, m.c, 0.65);
    by -= 12;
  }
  ctx.globalAlpha = 1;
  if (hurt > 0) {
    ctx.fillStyle = `rgba(255,40,80,${hurt * (SET.lowFlash ? 0.3 : 0.9)})`;
    ctx.fillRect(0, 0, VW, VH);
  }
}
function drawRoster() {
  for (let i = 0; i < NB; i++) {
    const b = team[i],
      x = 112 + i * 65,
      y = VH - 30;
    panel(x, y, 64, 27);
    ctx.fillStyle = b.color;
    ctx.fillRect(x + 2, y + 3, 3, 21);
    if (b.rim) {
      ctx.fillStyle = b.rim;
      ctx.fillRect(x + 2, y + 3, 3, 1);
      ctx.fillRect(x + 2, y + 23, 3, 1);
    }
    if (i === active && state === 'play' && blink(3)) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, 64, 1);
      ctx.fillRect(x, y + 26, 64, 1);
    }
    txt(b.name, x + 7, y + 3, b.status === 'dead' ? '#6a5f80' : b.ui);
    const [st, sc] = statusShort(b);
    txt(st, x + 7, y + 11, sc);
    if (b.shield) {
      ctx.fillStyle = '#9fd4ff';
      ctx.fillRect(x + 59, y + 3, 3, 3);
    }
    if (b.tuned) {
      ctx.fillStyle = '#ff6ec7';
      ctx.fillRect(x + 59, y + 7, 3, 3);
    }
    if (trained.includes(i)) {
      ctx.fillStyle = '#3fd46b';
      ctx.fillRect(x + 55, y + 3, 3, 3);
    }
    bar(x + 7, y + 20, 54, 2, b.hp / maxHP, b.medOn ? '#b6ff7a' : '#5cff7a');
    bar(x + 7, y + 23, 54, 2, b.bat / BAT_MAX, '#3cf2ff');
  }
}
function drawBigMap() {
  ctx.fillStyle = 'rgba(5,3,12,.85)';
  ctx.fillRect(0, 0, VW, VH);
  const S = 1.4,
    W = (MW / 2) * S,
    x0 = Math.round(VW / 2 - W / 2) - 60,
    y0 = 8;
  panel(x0 - 3, y0 - 3, W + 6, W + 6);
  ctx.drawImage(miniCv, 0, 0, MW / 2, MH / 2, x0, y0, W, W);
  const P = (x, y) => [x0 + (x / 32) * S, y0 + (y / 32) * S];
  const dot = (x, y, c, s) => {
    const [a, b] = P(x, y);
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(a - s / 2), Math.round(b - s / 2), s, s);
  };
  for (const s of shops) {
    dot(s.x, s.y, SHOP_T[s.type].c, SHOP_T[s.type].sp ? 4 : 3);
    if (SHOP_T[s.type].sp) {
      const [a, b] = P(s.x, s.y);
      txt(s.name, a, b + 4, SHOP_T[s.type].c, 1, 'center');
    }
  }
  if (amb) dot(amb.x, amb.y, '#ff2b4a', 4);
  if (mission) {
    const t = missionTarget();
    if (blink(3)) dot(t.x, t.y, '#ffe03c', 6);
    const [a, b2] = [x0 + (t.x / 32) * S, y0 + (t.y / 32) * S];
    txt('PACCO', a, b2 - 11, '#ffe03c', 1, 'center');
  }
  for (const c of police) dot(c.x, c.y, c.mode === 'abandoned' ? '#9fd4ff' : '#2b6bff', 3);
  for (const e of enemies)
    if (e.kind) {
      dot(e.x, e.y, XK[e.kind].c, 5);
      const [a, b2] = P(e.x, e.y);
      txt(XK[e.kind].name, a, b2 - 11, XK[e.kind].c, 1, 'center');
    }
  for (const s of shops)
    if (shopOff(s)) {
      const [a, b2] = P(s.x, s.y);
      txt('FUORI USO', a, b2 + 13, '#ffd21f', 1, 'center');
    }
  for (const t of team) {
    if (t.status === 'captured') {
      const e = enemies.find(e => e.id === t.captor);
      if (e) dot(e.x, e.y, '#ff3df2', 4);
    } else if (t.status !== 'dead' && t.i !== active) dot(t.x, t.y, t.ui, 3);
  }
  for (const m of landmarks) {
    const [a, b2] = P(m.x, m.y);
    // parco e piazza sono vicini alla rimessa: etichette sfalsate
    txt(m.name, a, b2 + (m.name === 'TIMES SQUARE' ? -13 : m.name === 'CENTRAL PARK' ? 13 : -3), m.c, 1, 'center');
  }
  if (stad && blink(3)) dot(stadium.cx, stadium.cy, '#ff2b4a', 7);
  dot(garage.cx, garage.cy, '#ff3df2', 6);
  {
    const [a, b] = P(garage.cx, garage.cy);
    txt('RIMESSA', a, b + 5, '#ff3df2', 1, 'center');
  }
  if (state === 'play') {
    const pb = body(team[active]);
    if (blink(4)) dot(pb.x, pb.y, '#ffffff', 5);
  }
  const lx = x0 + W + 16;
  let ly = 20;
  const leg = [
    ['FARMACIA', SHOP_T.pharm.c],
    ['MECCANICO', SHOP_T.mech.c],
    ['NEGOZIO', SHOP_T.shop.c],
    ['EDIFICI SPECIALI', '#ffffff'],
    ['POLIZIA', '#2b6bff'],
    ['AUTO LIBERA', '#9fd4ff'],
    ['RAPITORE', '#ff3df2'],
    ['TU', '#ffffff'],
  ];
  txt('LEGENDA', lx, ly, '#3cf2ff', 1);
  ly += 14;
  for (const [n, c] of leg) {
    ctx.fillStyle = c;
    ctx.fillRect(lx, ly + 1, 4, 4);
    txt(n, lx + 8, ly, c);
    ly += 11;
  }
  ly += 8;
  for (const t of SPECIALS) {
    txt(SHOP_T[t].name, lx, ly, SHOP_T[t].c);
    ly += 11;
  }
  txt(K('map') + ' PER CHIUDERE', lx, VH - 20, '#7a6f99');
}
function drawGunMenu() {
  const p = team[active];
  ctx.fillStyle = 'rgba(5,3,12,.8)';
  ctx.fillRect(0, 0, VW, VH);
  panel(140, 84, 360, 190);
  txt('ARMERIA - 10000$', VW / 2, 94, '#d0d0dc', 2, 'center');
  txt("SCEGLI L'ARMA DI UN COLLEGA PER " + p.name, VW / 2, 116, '#c9c2e6', 1, 'center');
  gunMenu.opts.forEach((i, k) => {
    const w = ROSTER[i].wpn,
      y = 136 + k * 20,
      on = k === gunMenu.sel;
    if (on) {
      ctx.fillStyle = 'rgba(255,61,242,.18)';
      ctx.fillRect(150, y - 4, 340, 16);
      txt('>', 154, y, '#ffffff');
    }
    const st = w.k === 'laser' ? 'MORTALE, CARICA 1S DA FERMO' : w.dmg + ' DANNI / ' + w.cd + 'S';
    txt(k + 1 + ' - ' + w.label + ' (DI ' + ROSTER[i].name + ') ' + st, 166, y, ROSTER[i].ui);
  });
  txt(KM('ok') + ' COMPRA   -   ' + KM('back') + ' ANNULLA', VW / 2, 256, '#7a6f99', 1, 'center');
}

// ---------- titolo e schermate ----------
let logo = null;
function makeLogo() {
  const sc = 10,
    t = 'NYX',
    w = t.length * 6 * sc,
    h = 8 * sc;
  const c = mk(w + 8, h + 8),
    g = c.getContext('2d');
  glyphs(g, t, 6, 6, sc, '#2a0b3d');
  glyphs(g, t, 3, 3, sc, '#3cf2ff');
  const m = mk(w, h),
    mg = m.getContext('2d');
  glyphs(mg, t, 0, 0, sc, '#fff');
  mg.globalCompositeOperation = 'source-in';
  const gr = mg.createLinearGradient(0, 0, 0, 7 * sc);
  gr.addColorStop(0, '#ffe03c');
  gr.addColorStop(0.5, '#ff3df2');
  gr.addColorStop(1, '#7a2bff');
  mg.fillStyle = gr;
  mg.fillRect(0, 0, w, h);
  mg.globalCompositeOperation = 'destination-out';
  for (let y = Math.floor(3.6 * sc), k = 1; y < 7 * sc; y += 4 + k, k++) mg.fillRect(0, y, w, k > 3 ? 2 : 1);
  g.drawImage(m, 0, 0);
  return c;
}
let saved = readSave();
function drawTitle(dt) {
  const cx = WPX / 2 + Math.cos(T * 0.03) * 1800,
    cy = HPX / 2 + Math.sin(T * 0.04) * 1800;
  drawWorld(cx, cy, dt);
  ctx.fillStyle = 'rgba(5,3,12,.62)';
  ctx.fillRect(0, 0, VW, VH);
  if (!logo) logo = makeLogo();
  ctx.drawImage(logo, (VW / 2 - logo.width / 2) | 0, 2);
  txt('NEW YORK XENO', VW / 2, 86, '#3cf2ff', 2, 'center', '#2a0b3d');
  txt('POST-CYBERPUNK MOTO WARS - DALLE 18:00 ALLE 06:00', VW / 2, 103, '#ff9de6', 1, 'center');
  const cw = 152,
    chh = 58,
    x0 = ((VW - 4 * cw - 12) / 2) | 0;
  const live = saved && !saved.meta.ended;
  for (let i = 0; i < NB; i++) {
    const r = ROSTER[i],
      x = x0 + (i % 4) * (cw + 4),
      y = 116 + Math.floor(i / 4) * (chh + 4);
    panel(x, y, cw, chh);
    if (i === sel && !live) {
      ctx.fillStyle = blink(4) ? '#ffffff' : r.ui;
      ctx.fillRect(x, y, cw, 2);
      ctx.fillRect(x, y + chh - 2, cw, 2);
      ctx.fillRect(x, y, 2, chh);
      ctx.fillRect(x + cw - 2, y, 2, chh);
    }
    if (!r._por) r._por = portrait(r);
    ctx.drawImage(r._por, x + 5, y + 5);
    if (!r._spr)
      r._spr = bikeSprite(r.color, r.rim, true, false, '#1e1a28', r.color === '#16121f' ? '#2a2440' : r.color, r.visor);
    ctx.save();
    ctx.translate(x + 17, y + 43);
    ctx.scale(1.5, 1.5);
    ctx.drawImage(r._spr, -10, -6);
    ctx.restore();
    txt(r.name, x + 33, y + 5, r.ui, 2);
    txt(r.sex, x + cw - 3, y + 5, '#7a6f99', 1, 'right');
    const w = r.wpn;
    txt(w ? w.label : r.laserShield ? 'SCUDO LASER' : 'NESSUNA ARMA', x + 33, y + 22, '#ffffff');
    txt(
      w
        ? w.k === 'gun'
          ? w.dmg + ' DANNI ' + w.cd + 'S G.' + w.rng / BL
          : w.k === 'laser'
            ? 'MORTALE - CARICA 1S'
            : w.dmg + ' DANNI ' + w.cd + 'S R.' + w.rad
        : r.laserShield
          ? 'COLPI IN MOTO: -1'
          : 'SOLO A MANI NUDE',
      x + 33,
      y + 31,
      '#c9c2e6',
    );
    txt('PUGNI ' + r.punch.dmg + ' - MOTO X' + r.spd, x + 33, y + 40, '#ff9de6');
    if (r.stealth) txt('RAPINA FURTIVA 70%', x + 33, y + 49, '#ffd21f');
  }
  const y0 = 244;
  const bl = blink(2) ? '#ffe03c' : '#ffffff';
  if (saved && saved.meta.ended) {
    const e = saved.meta.ended;
    txt(
      'ULTIMA NOTTE: ' + (e.win ? 'VITTORIA' : 'SCONFITTA') + ' - ' + e.reason + ' - XENO ABBATTUTI ' + e.kills,
      VW / 2,
      y0,
      e.win ? '#5cff7a' : '#ff4d6d',
      1,
      'center',
    );
  }
  if (live)
    txt(
      'NOTTE IN CORSO (ORE ' + hhmm(saved.meta.gameT) + ') - ' + KM('ok') + ': CONTINUA   ' + KM('del') + ': CANCELLA',
      VW / 2,
      y0 + 12,
      bl,
      1,
      'center',
    );
  else txt('SCEGLI IL BIKER - ' + KM('ok') + ': INIZIA LA NOTTE (ORE 18:00)', VW / 2, y0 + 12, bl, 1, 'center');
  if (titleMsg) txt(titleMsg, VW / 2, y0 + 24, '#ff9de6', 1, 'center');
  const L = [
    'GUIDA ' +
      KDRIVE() +
      ' - ' +
      K('attack') +
      ' ARMA/PUGNO - ' +
      K('mount') +
      ' SCENDI/SALI - ' +
      K('switch') +
      ' CAMBIA - ' +
      K('nitro') +
      ' NITRO - ' +
      K('weapon') +
      ' ARMA',
    K('use') +
      ': NEGOZI, RAPINE, EDIFICI SPECIALI E FURTO AUTO - ' +
      K('med') +
      ' FARMACO - ' +
      K('deliver') +
      ' CONSEGNA - ' +
      K('map') +
      ' MAPPA - ' +
      K('radar') +
      ' RADAR',
    'A 0 VITA TI ARRENDI: LO XENO TI CATTURA (30 MIN PER UCCIDERLO) O SCAPPI (20%, RIMESSA IN 3 MIN)',
    "VINCI: XENO SOTTO 3 PER 30 MIN O NESSUNO XENO ALL'ALBA - PERDI SE ARRIVANO A 20 PER 1 MINUTO",
    K('pause') +
      ' PAUSA - ' +
      (usingPad() ? 'SELECT' : K('options')) +
      ' OPZIONI E TASTI - ' +
      K('fullscreen') +
      ' SCHERMO INTERO - ' +
      (PAD.on ? 'GAMEPAD COLLEGATO' : 'GAMEPAD SUPPORTATO'),
  ];
  L.forEach((l, i) => txt(l, VW / 2, y0 + 38 + i * 11, i < 2 ? '#c9c2e6' : '#7a6f99', 1, 'center'));
}
function drawEnd() {
  ctx.fillStyle = 'rgba(5,3,12,.78)';
  ctx.fillRect(0, 0, VW, VH);
  const e = meta.ended;
  txt(e.win ? 'VITTORIA' : 'GAME OVER', VW / 2, 90, e.win ? '#5cff7a' : '#ff4d6d', 4, 'center', '#2a0b3d');
  txt(e.reason, VW / 2, 140, '#ffffff', e.reason.length > 34 ? 1 : 2, 'center');
  txt(
    'XENO ABBATTUTI: ' +
      e.kills +
      (copKills ? '  (+' + copKills + ' POLIZIA)' : '') +
      (dispersed ? '  (+' + dispersed + ' SPARITI)' : ''),
    VW / 2,
    175,
    ACID,
    e.kills > 99 || copKills || dispersed ? 1 : 2,
    'center',
  );
  txt('ORA: ' + hhmm(e.at) + '   CASSA: ' + money + '$', VW / 2, 197, '#3cf2ff', 2, 'center');
  txt(KM('ok') + ' PER TORNARE AL TITOLO', VW / 2, 240, blink(2) ? '#ffe03c' : '#ffffff', 1, 'center');
}
function drawWait() {
  ctx.fillStyle = 'rgba(5,3,12,.6)';
  ctx.fillRect(0, 0, VW, VH);
  drawTopBar();
  drawRoster();
  txt('NESSUN BIKER DISPONIBILE', VW / 2, 110, '#ff4d6d', 2, 'center');
  txt('LA NOTTE CONTINUA: ASPETTA CHE QUALCUNO TORNI IN RIMESSA', VW / 2, 136, '#c9c2e6', 1, 'center');
  let y = 156;
  for (const b of team) {
    if (b.status === 'dead') continue;
    const [st, sc] = statusTxt(b);
    txt(b.name + ' - ' + st, VW / 2, y, sc, 1, 'center');
    y += 12;
  }
  msgs.forEach((m, i) => {
    ctx.globalAlpha = Math.min(1, m.life);
    txt(m.t, VW / 2, 60 + i * 12, m.c, 1, 'center');
  });
  ctx.globalAlpha = 1;
}
function drawPause() {
  ctx.fillStyle = 'rgba(5,3,12,.93)';
  ctx.fillRect(0, 0, VW, VH);
  txt('PAUSA', VW / 2, 10, '#ff3df2', 3, 'center', '#2a0b3d');
  const L = [
    [
      'GUIDA ' +
        KDRIVE() +
        ' - ' +
        K('attack') +
        ' ARMA O PUGNO - ' +
        K('mount') +
        ' SCENDI/SALI - ' +
        K('switch') +
        ' CAMBIA BIKER - ' +
        K('radar') +
        ' RADAR',
      '#c9c2e6',
    ],
    [
      K('nitro') +
        ' NITRO - ' +
        K('weapon') +
        ' CAMBIA ARMA - ' +
        K('med') +
        ' FARMACO - ' +
        K('deliver') +
        ' CONSEGNA FARMACI - ' +
        K('map') +
        ' MAPPA - ' +
        K('use') +
        ' AZIONE',
      '#c9c2e6',
    ],
    ['FARMACIA: FARMACO 100$ (MAX 3, +25 VITA/MIN) - MECCANICO: ELETTRONITRO 50$ (MAX 5, X2 PER 20S)', '#5cff7a'],
    ['NEGOZIO: RAPINA A PIEDI 30-120$ - DANNI 10/20/30/40/60 - FA SALIRE LA RABBIA', '#ffe03c'],
    ['CHIESA: NESSUN NUOVO XENO PER 10 MIN (OGNI 60 MIN)', '#e6e0ff'],
    ["COMMISSARIATO: PORTA UN'AUTO DELLA POLIZIA - 30% CATTURANO 10 XENO, ALTRIMENTI ARRESTO 5 MIN", '#3a7bff'],
    ['CENTRO NASA: SCUDO ANTI ARMI XENO 500$ - DURA 20 MIN DAL PRIMO COLPO', '#9fd4ff'],
    ['OSPEDALE: RICOVERO GRATIS +10 VITA/MIN - UN BIKER ALLA VOLTA', '#ff4d6d'],
    ['NEGOZIO MOTO: 5000$ VELOCITA X1.6 PERMANENTE (CASPIAN X1.2) - ARMERIA: 10000$ SECONDA ARMA', '#ff6ec7'],
    ['OSPEDALE: 3 FARMACI DONATI DA 2 BIKER DIVERSI = +25 VITA MAX AL TEAM (FINO A 250)', '#5cff7a'],
    ['CHIESA: ZEPHYR, POI VESPER = MATRIMONIO 10000$ (TUTTE LE MOTO X1.2)', '#ff6ec7'],
    ['ARMERIA: 2 BIKER QUALSIASI CHE ARRIVANO IN COPPIA = ALLENAMENTO, +2 DANNI A ARMI E PUGNI', '#3fd46b'],
    [
      'AKIRA: TIENI ' + K('attack') + ', LA MOTO SI FERMA E LA SPADA LASER CARICA 1S - COLPO MORTALE INTORNO',
      '#ff8a1f',
    ],
    [
      'MELANIE: SCUDO LASER (IN MOTO OGNI COLPO TOGLIE 1) - MOTO X1.5 - RAPINA FURTIVA 70% SENZA CONSEGUENZE',
      '#ffd21f',
    ],
    ['CASPIAN AL CENTRO NASA ENTRO LE 18:05 = NOTTE VELOCE (RIPARTE ALLE 05:00)', '#9fd4ff'],
    ['BANCA: OBBLIGAZIONE 1000$ = 40$ AL MINUTO PER 30 MIN - COMMISSARIATO: CAUZIONE 1000$ A ARRESTATO', '#ffd27a'],
    ['CENTRO ALIENI (ZEPHYR/VESPER): 25$ PER XENO ABBATTUTO - 10+ XENO = AUTO MEDICA', '#c6ff3a'],
    ['MISSIONI: OGNI 15 MIN UN PACCO DA CONSEGNARE - 100$ (+50 OLTRE 75% MAPPA, +50 OLTRE 100%)', '#ffe03c'],
    ["UCCIDI I 2 AGENTI: RUBA L'AUTO (" + K('use') + ') E PORTALA IN RIMESSA = 200-400$', '#9fd4ff'],
    [
      'RIMESSA: +2 VITA/MIN, RICARICA X2, ZONA SICURA - CASPIAN IN RIMESSA ' + K('recall') + ': BLOCK 30 MIN',
      '#7a6f99',
    ],
    ['SHIFT+' + K('switch') + ' (PAD L3): CAMBIA BIKER E FAI RIENTRARE IN RIMESSA QUELLO LASCIATO', '#c9c2e6'],
    [
      'AKIRA AL CENTRO NASA: RADAR AVANZATO 10000$ PER IL TEAM - ' + K('radar') + ' X3 = SCEGLI UN SOLO OBIETTIVO',
      '#ff8a1f',
    ],
    [
      'MELANIE AL COMMISSARIATO: LISTA RABBIA E RAPINALI TUTTI! (+2000$, RABBIA +1, VITA 1, RISCHIO ARRESTO)',
      '#ffd21f',
    ],
    ['NOVA AL CENTRO ALIENI: TREGUA 15 MIN 5000$ OGNI ORA - I RAPITI RESTANO PRIGIONIERI NELLO STADIO 1 ORA', '#c6ff3a'],
    ['MELANIE DAL MECCANICO A PIEDI: RUBA BATTERIE -50 VITA - TUTTI IN 30 MIN: BATTERIE 5 MIN, RIMESSA X3', '#ffd21f'],
    ['STADIO (DALLE 20:00, 00:00, 05:00): 3 BIKER DENTRO = 12 XENO DELLA CITTA ASSEDIANO LO STADIO', '#9fd4ff'],
    ['DOPO 30 MIN XENO ROSSI (VITA 40): IN 3 ALLA RIMESSA DIVENTANO SILVER E RAPISCONO 2 BIKER', '#ff2b2b'],
    ['DOPO 90 MIN XENO SILVER (VITA 90, X1.5): IN 15 MIN DIVENTA GOLD (X2.5) E ASSEDIA GLI EDIFICI UNICI', '#ffd21f'],
  ];
  L.forEach((l, i) => txt(l[0], VW / 2, 34 + i * 11, l[1], 1, 'center'));
  txt(
    K('pause') +
      ' RIPRENDI   -   ' +
      (usingPad() ? 'SELECT' : K('options')) +
      ' OPZIONI E TASTI   -   ' +
      K('music') +
      ' MUSICA   -   ' +
      K('mute') +
      ' AUDIO',
    VW / 2,
    VH - 16,
    '#ffe03c',
    1,
    'center',
  );
}

// ---------- opzioni ----------
let optMenu = null; // {sel, sub:{sel,slot,listen}}
const OPT_ITEMS = [
  {
    n: 'VOLUME MUSICA',
    v: () => bar10(SET.music),
    adj: d => {
      SET.music = clamp(SET.music + d, 0, 10);
      applyVolumes();
    },
  },
  {
    n: 'VOLUME EFFETTI',
    v: () => bar10(SET.sfx),
    adj: d => {
      SET.sfx = clamp(SET.sfx + d, 0, 10);
      applyVolumes();
      sfx('menu');
    },
  },
  {
    n: 'RIDUCI LAMPEGGI',
    v: () => (SET.lowFlash ? 'SI' : 'NO'),
    adj: () => {
      SET.lowFlash = !SET.lowFlash;
    },
  },
  {
    n: 'EFFETTO CRT',
    v: () => (SET.crt ? 'SI' : 'NO'),
    adj: () => {
      SET.crt = !SET.crt;
      applyCRT();
    },
  },
  {
    n: 'SCOSSE DELLA CAMERA',
    v: () => (SET.shake ? 'SI' : 'NO'),
    adj: () => {
      SET.shake = !SET.shake;
    },
  },
  {
    n: 'VIBRAZIONE GAMEPAD',
    v: () => (SET.vibration ? 'SI' : 'NO'),
    adj: () => {
      SET.vibration = !SET.vibration;
      if (SET.vibration) rumble(200, 0.6);
    },
  },
  { n: 'SCHERMO INTERO', v: () => (document.fullscreenElement ? 'SI' : 'NO'), ok: () => toggleFS() },
  {
    n: 'RIMAPPA I TASTI',
    v: () => '>',
    ok: () => {
      optMenu.sub = { sel: 0, slot: 0, listen: false };
    },
  },
  {
    n: 'RIPRISTINA TASTI PREDEFINITI',
    v: () => '',
    ok: () => {
      resetBinds();
      toast('TASTI RIPRISTINATI');
    },
  },
  {
    n: 'INDIETRO',
    v: () => '',
    ok: () => {
      optMenu = null;
    },
  },
];
const bar10 = v => '[' + '|'.repeat(v) + ' '.repeat(10 - v) + '] ' + v;
const BIND_LIST = Object.keys(DEFAULT_BINDS);
function optionsInput() {
  const m = optMenu;
  if (!m) return;
  if (m.sub) {
    const sb = m.sub;
    if (sb.listen) return; // in attesa del tasto: lo cattura input.js
    if (mhit('up')) sb.sel = (sb.sel + BIND_LIST.length - 1) % BIND_LIST.length;
    if (mhit('down')) sb.sel = (sb.sel + 1) % BIND_LIST.length;
    if (mhit('left') || mhit('right')) sb.slot = 1 - sb.slot;
    if (mhit('del')) {
      const a = BIND_LIST[sb.sel];
      SET.binds[a][sb.slot] = '';
      saveSettings();
    }
    if (mhit('back')) {
      m.sub = null;
      saveSettings();
      return;
    }
    if (mhit('ok')) {
      sb.listen = true;
      const a = BIND_LIST[sb.sel],
        slot = sb.slot;
      rebindCb = code => {
        sb.listen = false;
        if (code !== 'Escape') bindKey(a, slot, code);
        clearPressed();
      };
    }
    return;
  }
  if (mhit('up')) m.sel = (m.sel + OPT_ITEMS.length - 1) % OPT_ITEMS.length;
  if (mhit('down')) m.sel = (m.sel + 1) % OPT_ITEMS.length;
  const it = OPT_ITEMS[m.sel];
  if (it.adj) {
    if (mhit('left')) {
      it.adj(-1);
      saveSettings();
    }
    if (mhit('right')) {
      it.adj(1);
      saveSettings();
    }
    if (mhit('ok')) {
      it.adj(1);
      saveSettings();
    }
  } else if (mhit('ok')) it.ok();
  if (mhit('back') || mhit('opts')) {
    optMenu = null;
    saveSettings();
  }
}
function drawOptions() {
  const m = optMenu;
  ctx.fillStyle = 'rgba(5,3,12,.9)';
  ctx.fillRect(0, 0, VW, VH);
  if (m.sub) {
    const sb = m.sub;
    txt('RIMAPPA I TASTI', VW / 2, 8, '#ff3df2', 2, 'center', '#2a0b3d');
    txt('AZIONE', 110, 30, '#7a6f99');
    txt('TASTO 1', 330, 30, '#7a6f99');
    txt('TASTO 2', 420, 30, '#7a6f99');
    txt('GAMEPAD', 510, 30, '#7a6f99');
    BIND_LIST.forEach((a, i) => {
      const y = 42 + i * 13,
        on = i === sb.sel;
      if (on) {
        ctx.fillStyle = 'rgba(255,61,242,.16)';
        ctx.fillRect(100, y - 3, 500, 13);
      }
      txt(ACTION_NAMES[a], 110, y, on ? '#ffffff' : '#c9c2e6');
      for (let s = 0; s < 2; s++) {
        const sel = on && sb.slot === s;
        const lbl = sel && sb.listen ? (blink(4) ? '...' : '') : keyLabel(SET.binds[a][s]);
        if (sel) {
          ctx.fillStyle = '#ffe03c';
          ctx.fillRect(326 + s * 90, y - 2, 70, 11);
          ctx.fillStyle = '#0b0814';
          ctx.fillRect(327 + s * 90, y - 1, 68, 9);
        }
        txt(lbl, 330 + s * 90, y, sel ? '#ffe03c' : '#ffffff');
      }
      txt((PAD.ps && PADN_PS[a]) || PADN_X[a] || '-', 510, y, '#7a6f99');
    });
    txt(
      sb.listen
        ? 'PREMI IL NUOVO TASTO - ESC ANNULLA'
        : '↑↓ AZIONE  ←→ TASTO 1/2  ' + KM('ok') + ' CAMBIA  ' + KM('del') + ' TOGLI  ' + KM('back') + ' INDIETRO',
      VW / 2,
      VH - 24,
      '#ffe03c',
      1,
      'center',
    );
    txt('I PULSANTI DEL GAMEPAD SONO FISSI (MAPPATURA STANDARD)', VW / 2, VH - 12, '#7a6f99', 1, 'center');
    return;
  }
  txt('OPZIONI', VW / 2, 40, '#ff3df2', 3, 'center', '#2a0b3d');
  OPT_ITEMS.forEach((it, i) => {
    const y = 86 + i * 20,
      on = i === m.sel;
    if (on) {
      ctx.fillStyle = 'rgba(255,61,242,.16)';
      ctx.fillRect(150, y - 5, 340, 17);
      txt('>', 156, y, '#ffffff');
    }
    txt(it.n, 170, y, on ? '#ffffff' : '#c9c2e6');
    txt(it.v(), 470, y, on ? '#ffe03c' : '#7a6f99', 1, 'right');
  });
  txt(
    '↑↓ SCEGLI  ←→ CAMBIA  ' + KM('ok') + ' CONFERMA  ' + KM('back') + ' INDIETRO',
    VW / 2,
    VH - 24,
    '#ffe03c',
    1,
    'center',
  );
}
