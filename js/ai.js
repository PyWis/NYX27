'use strict';
// ---------- enemies ----------
function steerTo(e, tx, ty, spd, dt, r) {
  if (e.rev > 0) {
    e.rev -= dt;
    e.v = -35;
    e.a += 1.6 * dt;
  } else {
    const da = angDiff(Math.atan2(ty - e.y, tx - e.x), e.a);
    e.a += clamp(da, -4 * dt, 4 * dt);
    const want = spd * (Math.abs(da) > 1.2 ? 0.35 : 1);
    e.v += clamp(want - e.v, -BASE * 2 * dt, BASE * 1.5 * dt);
  }
  const hit = moveCol(e, 'x', 'y', Math.cos(e.a) * e.v * dt, Math.sin(e.a) * e.v * dt, r || 5);
  if (hit) {
    e.stuck += dt;
    if (e.stuck > 0.6) {
      e.rev = 0.45;
      e.stuck = 0;
    }
  } else e.stuck = Math.max(0, e.stuck - dt);
}
function wander(e, dt, spd, r) {
  if (e.tn < 0) e.tn = nearestNodeLOS(e.x, e.y);
  const n = nodes[e.tn];
  if (dist(e.x, e.y, n.x, n.y) < 14) {
    let o = n.nb.filter(k => k.to !== e.pn);
    if (!o.length) o = n.nb;
    e.pn = e.tn;
    e.tn = o[Math.floor(R() * o.length)].to;
  }
  steerTo(e, n.x, n.y, spd, dt, r);
}
function followMove(e, dt) {
  if (e.kneel) {
    e.v = 0;
    return;
  }
  if (e.onFoot) e.onFoot = false;
  const pb = pBody,
    d = dist(e.x, e.y, pb.x, pb.y);
  const spd = BASE * 0.85 * (e.spd > 1 ? 1.75 : 1) * 1.2;
  if (d < 46) {
    e.v *= Math.pow(0.85, dt * 60);
    return;
  }
  let tx = pb.x,
    ty = pb.y;
  if (flowAt((e.x / CELL) | 0, (e.y / CELL) | 0) >= 0) {
    if (!los(e.x, e.y, pb.x, pb.y)) {
      const f = flowDir(e.x, e.y);
      if (f) {
        tx = f.x;
        ty = f.y;
      }
    }
  } else {
    e.fT = (e.fT || 0) - dt;
    if (e.fT <= 0 || !e.fpath) {
      e.fT = 3;
      const s = nearestNodeLOS(e.x, e.y),
        t = nearestNodeLOS(pb.x, pb.y);
      const path = dijkstra(s, t) || [];
      e.fpath = path.map(i => nodes[i]);
      e.fi = 0;
    }
    const q = e.fpath[e.fi];
    if (q) {
      if (dist(e.x, e.y, q.x, q.y) < 16) e.fi++;
      tx = q.x;
      ty = q.y;
    }
  }
  steerTo(e, tx, ty, spd, dt);
}
function updateEnemy(e, dt) {
  if (e.follow && nyxOn()) {
    e.cd -= dt;
    e.hitT -= dt;
    followMove(e, dt);
    return;
  }
  const pb = pBody,
    eb = body(e),
    d = dist(eb.x, eb.y, pb.x, pb.y);
  e.cd -= dt;
  e.hitT -= dt;
  e.punchT -= dt;
  const safe = !pAvail || inGarage(pb.x, pb.y);
  if (e.state === 'wander') {
    if (!safe && (d < 110 || (d < 250 && los(eb.x, eb.y, pb.x, pb.y)))) {
      e.state = 'chase';
      e.lock = 0;
      pop(eb.x, eb.y - 16, '!', ACID);
      if (d < 400) sfx('alert');
    } else {
      if (e.onFoot) e.onFoot = false;
      wander(e, dt, BASE * 0.7 * e.spd);
      return;
    }
  }
  if (d > 650 || safe) {
    e.onFoot = false;
    e.lchg = 0;
    e.state = 'wander';
    e.tn = nearestNodeLOS(e.x, e.y);
    e.pn = -1;
    return;
  }
  const sees = los(eb.x, eb.y, pb.x, pb.y);
  e.lock = sees ? e.lock + dt : 0;
  if (e.onFoot) {
    if (d > 150) {
      const dx = e.x - e.fx,
        dy = e.y - e.fy,
        l = Math.hypot(dx, dy);
      if (l < 8) {
        e.onFoot = false;
        return;
      }
      e.fa = Math.atan2(dy, dx);
      moveCol(e, 'fx', 'fy', (dx / l) * 46 * dt, (dy / l) * 46 * dt, 3);
      e.walk += dt * 12;
    } else {
      let tx = pb.x,
        ty = pb.y;
      if (!sees) {
        const f = flowDir(e.fx, e.fy);
        if (f) {
          tx = f.x;
          ty = f.y;
        }
      }
      const dx = tx - e.fx,
        dy = ty - e.fy,
        l = Math.hypot(dx, dy) || 1;
      e.fa = Math.atan2(pb.y - e.fy, pb.x - e.fx);
      if (d > 10) {
        moveCol(e, 'fx', 'fy', (dx / l) * 44 * dt, (dy / l) * 44 * dt, 3);
        e.walk += dt * 12;
      }
      if (d < 14 && e.cd <= 0) {
        e.cd = e.punch.cd * 1.25;
        e.punchT = 0.12;
        damagePlayer(e.punch.dmg, 'xeno', e, 'punch');
        pop(pb.x, pb.y - 22, 'POW!', '#ff9de6');
        sfx('punch');
      }
    }
    return;
  }
  const w = e.wpn;
  if (w && w.k === 'laser') {
    if (e.lchg > 0) {
      e.v = 0;
      e.lchg += dt;
      if (e.lchg >= w.chg) {
        e.lchg = 0;
        e.cd = 2.6;
        fx.push({ k: 'laser', x: e.x, y: e.y, a: e.a, t: 0, dur: 0.35, r: w.rad, c: '#ff8a1f', own: e });
        sfx('laser');
        if (d < w.rad + 8) damagePlayer(ENEMY_LASER_DMG, 'xeno', e, 'weapon');
      }
      return;
    }
    if (d < w.rad + 2 && e.cd <= 0 && sees) {
      e.lchg = 0.001;
      e.v = 0;
      if (d < 400) sfx('laserup');
      return;
    }
  }
  let tx = pb.x,
    ty = pb.y;
  if (!sees) {
    const f = flowDir(e.x, e.y);
    if (f) {
      tx = f.x;
      ty = f.y;
    }
  }
  let spd = BASE * 0.85 * (e.spd > 1 ? 1.75 : 1);
  if (w && w.k === 'gun' && sees && d < w.rng * 0.55) spd *= 0.2;
  steerTo(e, tx, ty, spd, dt);
  if (w && w.k === 'gun') {
    if (sees && d < w.rng * 0.95 && e.lock > 0.5 && e.cd <= 0) {
      const a = Math.atan2(pb.y - e.y, pb.x - e.x) + (R() - 0.5) * 0.24;
      bullets.push({
        x: e.x + Math.cos(a) * 9,
        y: e.y + Math.sin(a) * 9,
        vx: Math.cos(a) * w.spd,
        vy: Math.sin(a) * w.spd,
        life: w.rng / w.spd,
        dmg: w.dmg,
        o: 'e',
        c: ACID,
        from: e,
      });
      e.cd = w.cd * 1.5;
      fx.push({ k: 'flash', x: e.x + Math.cos(a) * 9, y: e.y + Math.sin(a) * 9, t: 0, dur: 0.08, r: 12, c: ACID });
      sfx(e.t === 3 ? 'rapid' : 'shoot');
    }
  } else if (w && w.k === 'melee') {
    if (d < w.rad + 5 && e.cd <= 0) {
      e.cd = w.cd * 1.3;
      damagePlayer(w.dmg, 'xeno', e, 'weapon');
      fx.push({
        k: w.style,
        x: e.x,
        y: e.y,
        a: e.a,
        t: 0,
        dur: 0.22,
        r: w.rad,
        c: w.style === 'whip' ? '#a66bff' : ACID,
        own: e,
      });
      sfx(w.style === 'whip' ? 'whip' : 'slash');
    }
  } else if (!w && d < 46 && sees) {
    e.onFoot = true;
    e.fx = e.x;
    e.fy = e.y;
    e.v = 0;
    e.fa = e.a;
  }
}
// ---------- police ----------
function policeTarget() {
  let sum = 0,
    n3 = 0,
    any4 = false;
  for (const s of shops) {
    sum += s.anger;
    if (s.anger >= 3) n3++;
    if (s.anger >= 4) any4 = true;
  }
  if (any4) return 6;
  if (n3 > 0) return Math.min(5, n3);
  return sum > 2 ? 1 : 0;
}
function newCar(x, y) {
  const ni = nearestNodeLOS(x, y);
  return {
    x,
    y,
    a: 0,
    v: 0,
    tn: nodes[ni].nb[0].to,
    pn: ni,
    state: 'patrol',
    mode: 'cops',
    stuck: 0,
    rev: 0,
    leave: false,
    arrest: 0,
    impT: 0,
    abT: 0,
    gone: false,
    cops: [
      { hp: 30, out: false, x, y, fa: 0, cd: 1, walk: 0 },
      { hp: 30, out: false, x, y, fa: 0, cd: 1.4, walk: 0 },
    ],
  };
}
function spawnPolice() {
  let n = null;
  for (let k = 0; k < 80; k++) {
    const c = nodes[Math.floor(R() * nodes.length)];
    if (dist(c.x, c.y, pBody.x, pBody.y) > 700 && dist(c.x, c.y, garage.cx, garage.cy) > 500) {
      n = c;
      break;
    }
  }
  if (n) police.push(newCar(n.x, n.y));
}
function managePolice(dt) {
  policeT -= dt;
  policeCD -= dt;
  if (policeT > 0) return;
  policeT = 2;
  // contano tutte le auto inviate: in pattuglia, abbandonate, rubate e quelle parcheggiate in rimessa
  const tgt = policeTarget();
  const act = police.filter(c => !c.leave && !c.gone);
  if (act.length < tgt && policeCD <= 0) {
    spawnPolice();
    policeCD = 15;
    if (police.length === 1) msg('LA POLIZIA PATTUGLIA LA CITTA', '#3a7bff');
  } else if (act.length > tgt) {
    const c = act.find(c => c.mode === 'cops' && c.state === 'patrol');
    if (c) c.leave = true;
  }
  police = police.filter(c => {
    if (c.gone) return false;
    const far = dist(c.x, c.y, cam.x, cam.y) > 520;
    if (c.mode === 'cops' && c.leave && !c.cops.some(k => k.out && k.hp > 0) && far) return false;
    if (c.mode === 'abandoned' && c.abT > 300 && far) return false;
    return true;
  });
}
function updatePolice(c, dt) {
  if (c.mode === 'abandoned') {
    c.v = 0;
    c.abT += dt;
    return;
  }
  if (c.mode === 'driven') return;
  if (c.mode === 'impound') {
    c.impT -= dt;
    if (c.impT <= 0) {
      c.gone = true;
      msg("LA POLIZIA HA RIPRESO L'AUTO DALLA RIMESSA", '#3a7bff');
    }
    return;
  }
  for (const k of c.cops) {
    k.cd -= dt;
    if (!k.out) {
      k.x = c.x;
      k.y = c.y;
    }
  }
  const alive = c.cops.filter(k => k.hp > 0);
  if (!alive.length) {
    c.mode = 'abandoned';
    c.abT = 0;
    c.v = 0;
    c.arrest = 0;
    if (dist(c.x, c.y, pBody.x, pBody.y) < 400)
      msg('AGENTI A TERRA! ' + K('use') + " A PIEDI VICINO ALL'AUTO PER RUBARLA", '#3a7bff');
    return;
  }
  const pb = pBody,
    d = dist(c.x, c.y, pb.x, pb.y),
    safe = !pAvail || inGarage(pb.x, pb.y);
  const out = alive.filter(k => k.out);
  if (c.leave || safe || d > 700) {
    if (!out.length) {
      if (d > 700 || safe || c.leave) c.state = 'patrol';
      wander(c, dt, BASE * 0.75, 6);
    } else recallCops(c, out, dt);
    c.arrest = 0;
    return;
  }
  const sees = los(c.x, c.y, pb.x, pb.y);
  if (c.state === 'patrol') {
    if (d < 120 || (d < 260 && sees)) {
      c.state = 'chase';
      msg('POLIZIA! TI HANNO VISTO', '#3a7bff');
      sfx('siren');
    } else {
      wander(c, dt, BASE * 0.75, 6);
      return;
    }
  }
  if (d > 320 && out.length) {
    recallCops(c, out, dt);
    return;
  }
  if (!out.length) {
    let tx = pb.x,
      ty = pb.y;
    if (!sees) {
      const f = flowDir(c.x, c.y);
      if (f) {
        tx = f.x;
        ty = f.y;
      }
    }
    steerTo(c, tx, ty, BASE * 0.95, dt, 6);
    if (d < 75 && sees) {
      c.v = 0;
      alive.forEach((k, i) => {
        const a = c.a + ((i ? 1 : -1) * Math.PI) / 2;
        const x = c.x + Math.cos(a) * 12,
          y = c.y + Math.sin(a) * 12;
        k.x = blocked(x, y, 3) ? c.x : x;
        k.y = blocked(x, y, 3) ? c.y : y;
        k.out = true;
      });
      sfx('siren');
    }
    return;
  }
  c.v *= Math.pow(0.85, dt * 60);
  let touching = false;
  const p = team[active];
  for (const k of out) {
    const dk = dist(k.x, k.y, pb.x, pb.y);
    const ks = los(k.x, k.y, pb.x, pb.y);
    let tx = pb.x,
      ty = pb.y;
    if (!ks) {
      const f = flowDir(k.x, k.y);
      if (f) {
        tx = f.x;
        ty = f.y;
      }
    }
    k.fa = Math.atan2(pb.y - k.y, pb.x - k.x);
    if (dk > 10) {
      const dx = tx - k.x,
        dy = ty - k.y,
        l = Math.hypot(dx, dy) || 1;
      moveCol(k, 'x', 'y', (dx / l) * 50 * dt, (dy / l) * 50 * dt, 3);
      k.walk += dt * 12;
    }
    if (ks && dk < 200 && dk > 18 && k.cd <= 0) {
      const a = k.fa + (R() - 0.5) * 0.3;
      bullets.push({
        x: k.x + Math.cos(a) * 6,
        y: k.y + Math.sin(a) * 6,
        vx: Math.cos(a) * 300,
        vy: Math.sin(a) * 300,
        life: 0.7,
        dmg: 5,
        o: 'c',
        c: '#9fd4ff',
      });
      k.cd = 0.9;
      sfx('shoot');
    }
    if (dk < 15 && (p.onFoot || p.inCar || Math.abs(p.v) < 25)) touching = true;
  }
  c.arrest = touching ? c.arrest + dt : Math.max(0, c.arrest - dt * 0.5);
  if (c.arrest >= 1.2) {
    c.arrest = 0;
    p.lastSrc = 'police';
    p.hp = 0;
  }
}
function recallCops(c, out, dt) {
  for (const k of out) {
    const dx = c.x - k.x,
      dy = c.y - k.y,
      l = Math.hypot(dx, dy);
    if (l < 8) {
      k.out = false;
      continue;
    }
    moveCol(k, 'x', 'y', (dx / l) * 55 * dt, (dy / l) * 55 * dt, 3);
    k.walk += dt * 12;
    k.fa = Math.atan2(dy, dx);
  }
}
