'use strict';
// =====================================================================
//  RENDER DEL MONDO
//  - mondo statico pre-renderizzato in blocchi da 512px (cache LRU)
//  - griglia spaziale per lampioni, neon, negozi ed edifici
//  - edifici in pseudo-3D (pareti che "salgono" verso lo schermo)
//  - lightmap: buio crepuscolare/notturno legato all'orologio + luci
//  - meteo: pioggia per circa meta' del tempo, riflessi e spruzzi
// =====================================================================
const CH = 512,
  CHN = Math.ceil(WPX / CH);
const chunkCache = new Map();
let gLamps = [],
  gNeons = [],
  gLots = [],
  gShops = [],
  gBlocks = [],
  gEdges = [];
const gIdx = (c, r) => r * CHN + c,
  gc = v => clamp(Math.floor(v / CH), 0, CHN - 1);
function resetWorldCaches() {
  chunkCache.clear();
  roofCache.clear();
  const G = () => Array.from({ length: CHN * CHN }, () => []);
  gLamps = G();
  gNeons = G();
  gLots = G();
  gShops = G();
  gBlocks = G();
  gEdges = G();
  const box = (grid, item, x0, y0, x1, y1) => {
    for (let r = gc(y0); r <= gc(y1); r++) for (let c = gc(x0); c <= gc(x1); c++) grid[gIdx(c, r)].push(item);
  };
  for (const l of lamps) box(gLamps, l, l.x - 2, l.y - 2, l.x + 2, l.y + 2);
  for (const n of neons) gNeons[gIdx(gc(n.x), gc(n.y))].push(n);
  for (const s of shops) gShops[gIdx(gc(s.x), gc(s.y))].push(s);
  for (const b of blocks) {
    box(gBlocks, b, b.x * CELL, b.y * CELL, (b.x + b.w) * CELL, (b.y + b.h) * CELL);
    for (const L of b.lots) {
      if (L.flat) continue;
      const it = {
        L,
        b,
        wx: L.x * CELL + 1,
        wy: L.y * CELL + 1,
        ww: L.w * CELL - 2,
        wh: L.h * CELL - 2,
        ox: 0,
        oy: 0,
        cv: null,
        ch: null,
      };
      it.cx = it.wx + it.ww / 2;
      it.cy = it.wy + it.wh / 2;
      L.it = it;
      gLots[gIdx(gc(it.cx), gc(it.cy))].push(it);
    }
  }
  for (const e of edges) {
    const A = nodes[e.a],
      B = nodes[e.b];
    box(gEdges, e, Math.min(A.x, B.x) - 24, Math.min(A.y, B.y) - 24, Math.max(A.x, B.x) + 24, Math.max(A.y, B.y) + 24);
  }
  for (const d of decals) if (d) d.life = 0;
}
function eachCell(grid, x0, y0, x1, y1, fn) {
  const c0 = gc(x0),
    c1 = gc(x1),
    r0 = gc(y0),
    r1 = gc(y1);
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) {
      const a = grid[gIdx(c, r)];
      for (let i = 0; i < a.length; i++) fn(a[i]);
    }
}
function chunkCv(c, r) {
  const k = gIdx(c, r);
  let cv2 = chunkCache.get(k);
  if (cv2) {
    chunkCache.delete(k);
    chunkCache.set(k, cv2);
    return cv2;
  }
  cv2 = mk(CH, CH);
  const g = cv2.getContext('2d');
  g.imageSmoothingEnabled = false;
  const X0 = c * CH,
    Y0 = r * CH;
  g.fillStyle = g.createPattern(asph, 'repeat');
  g.fillRect(0, 0, CH, CH);
  g.translate(-X0, -Y0);
  for (const e of gEdges[k]) {
    const A = nodes[e.a],
      B = nodes[e.b];
    if (e.h) {
      const xa = Math.min(A.x, B.x),
        xb = Math.max(A.x, B.x);
      g.fillStyle = '#6e6230';
      for (let x = Math.ceil((xa + 40) / 16) * 16; x < xb - 40; x += 16) g.fillRect(x, A.y - 1, 8, 2);
      if (xb - xa > 90) {
        g.fillStyle = '#4e4862';
        for (let y = A.y - 22; y < A.y + 22; y += 6) {
          g.fillRect(xa + 27, y, 8, 3);
          g.fillRect(xb - 35, y, 8, 3);
        }
      }
    } else {
      const ya = Math.min(A.y, B.y),
        yb = Math.max(A.y, B.y);
      g.fillStyle = '#6e6230';
      for (let y = Math.ceil((ya + 40) / 16) * 16; y < yb - 40; y += 16) g.fillRect(A.x - 1, y, 2, 8);
      if (yb - ya > 90) {
        g.fillStyle = '#4e4862';
        for (let x = A.x - 22; x < A.x + 22; x += 6) {
          g.fillRect(x, ya + 27, 3, 8);
          g.fillRect(x, yb - 35, 3, 8);
        }
      }
    }
  }
  for (const b of gBlocks[k]) g.drawImage(blockCanvas(b), b.x * CELL, b.y * CELL);
  for (const l of gLamps[k]) {
    g.fillStyle = '#14111c';
    g.fillRect(l.x - 1, l.y - 1, 3, 3);
    g.fillStyle = l.c;
    g.fillRect(l.x, l.y, 1, 1);
  }
  chunkCache.set(k, cv2);
  if (chunkCache.size > 28) chunkCache.delete(chunkCache.keys().next().value);
  return cv2;
}

// ---------- segni a terra (frenate, scie nitro, bruciature, detriti) ----------
const DEC_MAX = 900,
  decals = new Array(DEC_MAX);
let decN = 0;
function pushDecal(k, x, y, c, life) {
  const i = decN % DEC_MAX;
  const d = decals[i] || (decals[i] = {});
  d.k = k;
  d.x = x;
  d.y = y;
  d.c = c;
  d.life = life;
  decN++;
}
function clearDecals() {
  for (const d of decals) if (d) d.life = 0;
}
function addSkid(x, y, a, c) {
  pushDecal('skid', x - Math.cos(a) * 7, y - Math.sin(a) * 7, c, c === '#1d5a78' ? 6 : 50);
}
function addDecal(k, x, y) {
  pushDecal(k, x, y, null, 150);
}
function addDebris(x, y, col) {
  for (let i = 0; i < 7; i++) {
    const a = R() * 6.283,
      r = 4 + R() * 15;
    pushDecal('debris', x + Math.cos(a) * r, y + Math.sin(a) * r, i % 2 ? col : '#4a4a58', 150);
  }
}
const scorchSpr = (() => {
  const c = mk(22, 22),
    g = c.getContext('2d');
  for (let i = 0; i < 260; i++) {
    const a = Math.random() * 6.283,
      r = Math.pow(Math.random(), 0.6) * 10;
    g.fillStyle = r < 5 ? '#050407' : r < 8 ? '#0c0a10' : '#15111b';
    g.fillRect((11 + Math.cos(a) * r) | 0, (11 + Math.sin(a) * r) | 0, 1, 1);
  }
  return c;
})();
function drawDecals(X0, Y0, X1, Y1) {
  for (let i = 0; i < DEC_MAX; i++) {
    const d = decals[i];
    if (!d || d.life <= 0 || d.x < X0 || d.x > X1 || d.y < Y0 || d.y > Y1) continue;
    const al = Math.min(1, d.life / 12);
    if (d.k === 'skid') {
      ctx.globalAlpha = 0.5 * al;
      ctx.fillStyle = d.c;
      ctx.fillRect(Math.round(d.x) - 1, Math.round(d.y) - 1, 2, 2);
    } else if (d.k === 'scorch') {
      ctx.globalAlpha = 0.75 * al;
      ctx.drawImage(scorchSpr, Math.round(d.x) - 11, Math.round(d.y) - 11);
    } else {
      ctx.globalAlpha = al;
      ctx.fillStyle = d.c;
      ctx.fillRect(Math.round(d.x), Math.round(d.y), 2, 1);
    }
  }
  ctx.globalAlpha = 1;
}

// ---------- meteo: pioggia per circa il 50% del tempo ----------
const weather = { on: false, t: 0, int: 0, wet: 0 };
function resetWeather() {
  weather.on = R() < 0.5;
  weather.t = 120 + R() * 360;
  weather.int = weather.on ? 1 : 0;
  weather.wet = weather.int;
}
resetWeather();
// periodi alternati con la stessa durata media: meta' notte asciutta, meta' bagnata
function updateWorldFx(dt) {
  weather.t -= dt;
  if (weather.t <= 0) {
    weather.on = !weather.on;
    weather.t = 180 + R() * 420;
    msg(weather.on ? 'INIZIA A PIOVERE' : 'HA SMESSO DI PIOVERE', '#9fb4ff');
  }
  weather.int += ((weather.on ? 1 : 0) - weather.int) * Math.min(1, dt / 25);
  if (weather.int > weather.wet) weather.wet = Math.min(weather.int, weather.wet + dt / 10);
  else weather.wet = Math.max(weather.int, weather.wet - dt / 150);
  setRainVol(weather.int);
  for (let i = 0; i < DEC_MAX; i++) {
    const d = decals[i];
    if (d && d.life > 0) d.life -= dt;
  }
}
const drops = [];
for (let i = 0; i < 240; i++)
  drops.push({
    x: Math.random() * VW,
    y: Math.random() * VH,
    s: 180 + Math.random() * 140,
    z: 0.8 + Math.random() * 0.6,
  });
const splashes = [];
let splAcc = 0;
function drawRain(dt, ox, oy, dcx, dcy) {
  const n = Math.round(drops.length * weather.int);
  for (let i = 0; i < n; i++) {
    const d = drops[i];
    d.y += d.s * dt - dcy * d.z;
    d.x += -d.s * 0.25 * dt - dcx * d.z; // gocce "agganciate" al mondo: parallasse
    if (d.y > VH + 4) {
      d.y -= VH + 8;
      d.x = Math.random() * VW;
    } else if (d.y < -8) d.y += VH + 8;
    if (d.x < -4) d.x += VW + 8;
    else if (d.x > VW + 4) d.x -= VW + 8;
    ctx.fillStyle = d.z > 1.15 ? 'rgba(175,200,255,.40)' : 'rgba(150,180,255,.24)';
    ctx.fillRect(d.x | 0, d.y | 0, 1, Math.round(3 * d.z));
  }
  splAcc += weather.int * dt * 70;
  while (splAcc >= 1) {
    splAcc--;
    splashes.push({ x: ox + Math.random() * VW, y: oy + Math.random() * VH, t: 0 });
  }
  ctx.fillStyle = 'rgba(185,205,255,.45)';
  for (const s of splashes) {
    s.t += dt;
    const x = Math.round(s.x - ox),
      y = Math.round(s.y - oy);
    if (s.t < 0.08) ctx.fillRect(x, y, 1, 1);
    else {
      const r = s.t < 0.18 ? 1 : 2;
      ctx.fillRect(x - r, y, 1, 1);
      ctx.fillRect(x + r, y, 1, 1);
      ctx.fillRect(x, y - 1, 1, 1);
    }
  }
  compact(splashes, s => s.t < 0.3);
}

// ---------- sprite ruotate pre-calcolate + ombre ----------
function drawSpr(s, x, y, a) {
  const rs = rotSet(s),
    k = rotIdx(a);
  ctx.drawImage(rs.f[k], Math.round(x) - rs.S / 2, Math.round(y) - rs.S / 2);
}
function drawVeh(s, x, y, a, lean) {
  lean = lean || 0;
  const rs = rotSet(s),
    k = rotIdx(a + lean * 0.22);
  ctx.globalAlpha = 0.42;
  ctx.drawImage(
    rs.sh[k],
    Math.round(x + 2 - Math.sin(a) * lean * 2) - rs.S / 2,
    Math.round(y + 3 + Math.cos(a) * lean * 2) - rs.S / 2,
  );
  ctx.globalAlpha = 1;
  ctx.drawImage(rs.f[k], Math.round(x) - rs.S / 2, Math.round(y) - rs.S / 2);
}
function drawPerson(x, y, a, jacket, head, hair, punchT, walk, female) {
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(Math.round(x) - 2, Math.round(y) + 2, 5, 2);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(a);
  const sw = Math.sin(walk) * 2;
  ctx.fillStyle = jacket;
  ctx.fillRect(-2, -4, 4, 8);
  ctx.fillRect(-1 + sw, -5, 3, 2);
  ctx.fillRect(-1 - sw, 3, 3, 2);
  if (punchT > 0) {
    ctx.fillRect(1, 1, 6, 2);
    ctx.fillStyle = '#f0c8a0';
    ctx.fillRect(7, 1, 2, 2);
  }
  if (female) {
    ctx.fillStyle = hair;
    ctx.fillRect(-4, -2, 3, 4);
  }
  ctx.fillStyle = head;
  ctx.fillRect(-2, -2, 4, 4);
  ctx.fillStyle = hair;
  ctx.fillRect(-2, -2, 2, 4);
  ctx.restore();
}
function ring(x, y, r, col, n, ph, sz) {
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283 + ph;
    ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), sz || 1, sz || 1);
  }
}

// ---------- edifici pseudo-3D ----------
let bVis = [],
  bFrame = 0;
function drawBuildings(cx, cy, X0, Y0, X1, Y1) {
  bVis.length = 0;
  bFrame++;
  eachCell(gLots, X0 - 220, Y0 - 220, X1 + 220, Y1 + 220, it => {
    const k = 0.009 * it.L.hgt;
    const ox = Math.round((it.cx - cx) * k),
      oy = Math.round((it.cy - cy) * k);
    if (
      Math.max(it.wx, it.wx + ox) > X1 ||
      Math.min(it.wx, it.wx + ox) + it.ww < X0 ||
      Math.max(it.wy, it.wy + oy) > Y1 ||
      Math.min(it.wy, it.wy + oy) + it.wh < Y0
    )
      return;
    it.ox = ox;
    it.oy = oy;
    it.fr = bFrame;
    bVis.push(it);
  });
  bVis.sort((a, b) => a.L.hgt - b.L.hgt);
  for (const it of bVis) {
    const L = it.L,
      rc = lotRoof(L, it.b),
      { wx, wy, ww, wh, ox, oy } = it;
    if (!it.cv) {
      it.cv = [-0.68, -0.6, -0.52, -0.44].map(f => shade(L.roof, f));
      it.ch = [-0.78, -0.72, -0.66, -0.6].map(f => shade(L.roof, f));
    }
    const n = Math.max(Math.abs(ox), Math.abs(oy));
    // le pareti: si "spazzano" i due bordi rivolti verso la camera, un pixel alla volta
    for (let i = 0; i < n; i++) {
      const t = i / n,
        dx = Math.round(ox * t),
        dy = Math.round(oy * t),
        lv = Math.min(3, (t * 4) | 0);
      if (ox) {
        ctx.fillStyle = it.cv[lv];
        ctx.fillRect(ox > 0 ? wx + dx : wx + ww - 1 + dx, wy + dy, 1, wh);
      }
      if (oy) {
        ctx.fillStyle = it.ch[lv];
        ctx.fillRect(wx + dx, oy > 0 ? wy + dy : wy + wh - 1 + dy, ww, 1);
      }
    }
    // finestre accese, a piani
    for (let i = 1; i < n - 1; i += 3) {
      const t = i / n,
        dx = Math.round(ox * t),
        dy = Math.round(oy * t);
      if (Math.abs(ox) > 2) {
        const x = ox > 0 ? wx + dx : wx + ww - 1 + dx;
        for (let y = wy + 3, j = 0; y < wy + wh - 3; y += 4, j++) {
          const c = L.win[(i * 5 + j) % 24];
          if (c) {
            ctx.fillStyle = c;
            ctx.fillRect(x, y + dy, 1, 2);
          }
        }
      }
      if (Math.abs(oy) > 2) {
        const y = oy > 0 ? wy + dy : wy + wh - 1 + dy;
        for (let x = wx + 3, j = 0; x < wx + ww - 3; x += 4, j++) {
          const c = L.win[(i * 3 + j + 7) % 24];
          if (c) {
            ctx.fillStyle = c;
            ctx.fillRect(x + dx, y, 2, 1);
          }
        }
      }
    }
    ctx.drawImage(rc, wx + ox, wy + oy);
  }
}
// posizione del neon a meta' parete (null se la parete non e' visibile)
function neonPos(n) {
  const it = n.L && n.L.it;
  if (!it || it.fr !== bFrame) return { x: n.x, y: n.y, vis: true };
  const L = n.L;
  let vis;
  if (n.h === 2) vis = n.y < L.y * CELL ? it.oy >= 0 : it.oy <= 0;
  else vis = n.x < L.x * CELL ? it.ox >= 0 : it.ox <= 0;
  return { x: Math.round(n.x + it.ox * 0.5), y: Math.round(n.y + it.oy * 0.5), vis };
}
const neonA = n => {
  let a = 0.32 + 0.06 * Math.sin(T * 2 + n.ph);
  if (n.fl && !SET.lowFlash && Math.sin(T * 23 + n.ph * 7) > 0.55) a *= 0.15;
  return a;
};

// ---------- lightmap ----------
const LS = 0.5,
  lightCv = mk(VW * LS, VH * LS),
  lctx = lightCv.getContext('2d');
// luce ambiente lungo la notte: crepuscolo -> notte fonda -> crepuscolo dell'alba (mai giorno)
const AMB_K = [
  [0, [205, 160, 178]],
  [1.5, [150, 128, 182]],
  [3.5, [116, 116, 170]],
  [9.5, [110, 112, 168]],
  [11, [138, 120, 172]],
  [12.4, [172, 138, 178]],
];
function ambientRGB() {
  const h = state === 'title' ? 4 : nightE() / 3600;
  for (let i = 0; i < AMB_K.length - 1; i++)
    if (h <= AMB_K[i + 1][0]) {
      const t = clamp((h - AMB_K[i][0]) / (AMB_K[i + 1][0] - AMB_K[i][0]), 0, 1);
      return AMB_K[i][1].map((v, j) => lerp(v, AMB_K[i + 1][1][j], t));
    }
  return AMB_K[AMB_K.length - 1][1];
}
let LOX = 0,
  LOY = 0;
function lglow(x, y, r, col, a) {
  if (a <= 0) return;
  lctx.globalAlpha = Math.min(1, a);
  lctx.drawImage(glowSpr(col), (x - r - LOX) * LS, (y - r - LOY) * LS, r * 2 * LS, r * 2 * LS);
}
function lcone(o, a) {
  lctx.save();
  lctx.translate((o.x - LOX) * LS, (o.y - LOY) * LS);
  lctx.rotate(o.a);
  lctx.scale(LS, LS);
  lctx.globalAlpha = a;
  lctx.drawImage(cone, 6, -24);
  lctx.restore();
}
function drawLights(ox, oy, X0, Y0, X1, Y1, playing) {
  LOX = ox;
  LOY = oy;
  const am = ambientRGB(),
    wk = 1 - 0.12 * weather.int;
  lctx.globalCompositeOperation = 'source-over';
  lctx.globalAlpha = 1;
  lctx.fillStyle = 'rgb(' + ((am[0] * wk) | 0) + ',' + ((am[1] * wk) | 0) + ',' + ((am[2] * wk) | 0) + ')';
  lctx.fillRect(0, 0, lightCv.width, lightCv.height);
  lctx.globalCompositeOperation = 'lighter';
  eachCell(gLamps, X0, Y0, X1, Y1, l => lglow(l.x, l.y, 60, l.c, 0.8));
  eachCell(gNeons, X0, Y0, X1, Y1, n => {
    const q = neonPos(n);
    lglow(q.x + n.w / 2, q.y + n.h / 2, Math.max(n.w, n.h) * 0.9 + 18, n.c, neonA(n) * 1.6);
  });
  eachCell(gShops, X0, Y0, X1, Y1, s => lglow(s.x, s.y, SHOP_T[s.type].sp ? 64 : 42, SHOP_T[s.type].c, 0.55));
  lglow(garage.cx, garage.cy, 150, '#ff3df2', 0.4);
  lglow(garage.cx, garage.cy, 100, '#ffe9d0', 0.35);
  const vis = (x, y) => x > X0 && x < X1 && y > Y0 && y < Y1;
  for (const s of shops)
    if (s.type === 'church' && vis(s.x, s.y)) {
      const L = s.L;
      lglow((L.x + L.w / 2) * CELL, (L.y + L.h / 2) * CELL, 60, '#7a2bff', 0.4);
    }
  // fari dello stadio e maxischermi di Times Square
  const near = (x, y, m) => x > X0 - m && x < X1 + m && y > Y0 - m && y < Y1 + m;
  for (const l of stadium.lights) if (near(l.x, l.y, 160)) lglow(l.x, l.y, 170, '#fff3d0', stad ? 0.75 : 0.5);
  if (stad && near(stadium.cx, stadium.cy, 200)) lglow(stadium.cx, stadium.cy, 190, '#ff2b4a', blink(2) ? 0.35 : 0.15);
  for (const m of landmarks)
    if (m.name === 'TIMES SQUARE' && near(m.x, m.y, 260)) {
      const b = m.b;
      for (let k = 0; k < 4; k++) {
        const x = (b.x + 2 + ((b.w - 4) * (k + 0.5)) / 4) * CELL;
        const c = NEON[(Math.floor(T * 0.7) + k * 2) % NEON.length];
        lglow(x, (b.y + 5) * CELL, 70, c, 0.55);
        lglow(x, (b.y + b.h - 5) * CELL, 70, NEON[(Math.floor(T * 0.7) + k * 2 + 3) % NEON.length], 0.55);
      }
      lglow(m.x, m.y, 150, '#ffe9d0', 0.3);
    }
  const car = o => {
    if (!vis(o.x, o.y)) return;
    lcone(o, 0.75);
    lglow(o.x, o.y, 18, '#fff2d8', 0.25);
  };
  for (const b of team)
    if (b.status === 'returning' || b.status === 'robbing' || (b.status === 'active' && playing && !b.onFoot)) car(b);
  for (const e of enemies)
    if (!e.onFoot) {
      car(e);
      lglow(e.x, e.y, 16, ACID, 0.35);
    }
  for (const c of police) {
    if (!vis(c.x, c.y)) continue;
    if (c.mode === 'cops' || c.mode === 'driven') car(c);
    if (c.mode === 'cops' || c.mode === 'driven') {
      const on = blink(6),
        big = c.state === 'chase' || c.mode === 'driven';
      lglow(c.x, c.y, big ? 40 : 26, '#ff2b4a', on ? 0.7 : 0.2);
      lglow(c.x, c.y, big ? 40 : 26, '#2b6bff', on ? 0.2 : 0.7);
    }
  }
  if (darkReady() && vis(dark.x, dark.y)) {
    if (dark.driver >= 0) car(dark);
    lglow(dark.x, dark.y, 22, '#8a6bff', 0.45);
  }
  if (amb && vis(amb.x, amb.y)) {
    car(amb);
    lglow(amb.x, amb.y, 30, blink(8) ? '#ff2b4a' : '#ffffff', 0.7);
  }
  for (const b of bullets) lglow(b.x, b.y, 12, b.c, 0.9);
  for (const f of fx) {
    const k = f.t / f.dur,
      o = f.own ? body(f.own) : f;
    if (f.k === 'flash') lglow(f.x, f.y, f.r * 1.5, f.c, (1 - k) * 1.3);
    else lglow(o.x, o.y, f.r + 16, f.c, (f.k === 'laser' ? 1.2 : 0.5) * (1 - k));
  }
  for (const e of enemies) if (e.lchg > 0) lglow(e.x, e.y, 30 + e.lchg * 20, '#ff8a1f', 0.4 + e.lchg * 0.5);
  for (const q of parts) if (q.sz > 1 || q.c === '#ffe03c') lglow(q.x, q.y, 5, q.c, q.life);
  if (playing) {
    const p = team[active],
      pb = body(p);
    lglow(pb.x, pb.y, 46, '#c8c0ff', 0.35);
    if (p.nyx) {
      lglow(pb.x, pb.y, NYX_R, '#7a2bff', 0.22);
      lglow(pb.x, pb.y, 40, '#ff3df2', 0.6);
    }
    if (p.nitroT > 0) lglow(p.x, p.y, 30, '#3cf2ff', 0.6);
    if (p.shield && !p.inCar) lglow(pb.x, pb.y, 24, '#9fd4ff', 0.35);
    if (p.lchg > 0) lglow(p.x, p.y, 20 + p.lchg * 40, '#ff8a1f', 0.4 + p.lchg * 0.6);
  }
  lctx.globalCompositeOperation = 'source-over';
  lctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'multiply';
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(lightCv, 0, 0, VW, VH);
  ctx.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = false;
}

// ---------- etichette (disegnate sopra la luce, sempre leggibili) ----------
const LBL = [];
function lab(s, x, y, c) {
  LBL.push(s, x, y, c);
}

// ---------- disegno del mondo ----------
let lastCX = null,
  lastCY = null;
function drawWorld(cx, cy, dt) {
  const sh = SET.shake ? shake : 0;
  const sx = sh ? sh * (Math.sin(T * 53.1) * 0.6 + Math.sin(T * 37.7 + 1.7) * 0.4) : 0,
    sy = sh ? sh * (Math.sin(T * 47.3 + 0.6) * 0.6 + Math.sin(T * 29.9 + 2.9) * 0.4) : 0; // scossa smorzata
  const ox = Math.round(cx - VW / 2 + sx),
    oy = Math.round(cy - VH / 2 + sy);
  const dcx = lastCX === null || Math.abs(cx - lastCX) > 200 ? 0 : cx - lastCX,
    dcy = lastCY === null || Math.abs(cy - lastCY) > 200 ? 0 : cy - lastCY;
  lastCX = cx;
  lastCY = cy;
  const X0 = ox - 60,
    Y0 = oy - 60,
    X1 = ox + VW + 60,
    Y1 = oy + VH + 60;
  const vis = (x, y) => x > X0 && x < X1 && y > Y0 && y < Y1;
  const playing = state === 'play';
  LBL.length = 0;
  ctx.save();
  ctx.translate(-ox, -oy);
  for (let r = Math.floor(oy / CH); r <= Math.floor((oy + VH) / CH); r++)
    for (let c = Math.floor(ox / CH); c <= Math.floor((ox + VW) / CH); c++) {
      if (c < 0 || r < 0 || c >= CHN || r >= CHN) continue;
      ctx.drawImage(chunkCv(c, r), c * CH, r * CH);
    }
  ctx.fillStyle = '#07050c';
  if (ox < 0) ctx.fillRect(ox, oy, -ox, VH);
  if (oy < 0) ctx.fillRect(ox, oy, VW, -oy);
  if (ox + VW > WPX) ctx.fillRect(WPX, oy, ox + VW - WPX, VH);
  if (oy + VH > HPX) ctx.fillRect(ox, HPX, VW, oy + VH - HPX);
  drawDecals(X0, Y0, X1, Y1);
  // asfalto bagnato: riflessi allungati delle luci
  if (weather.wet > 0.05) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.imageSmoothingEnabled = true;
    const wa = weather.wet;
    const refl = (x, y, r, c, a) => {
      ctx.globalAlpha = a * wa;
      ctx.drawImage(glowSpr(c), x - r * 0.35, y + 2, r * 0.7, r * 1.7);
    };
    eachCell(gLamps, X0, Y0, X1, Y1, l => refl(l.x, l.y, 40, l.c, 0.22));
    eachCell(gNeons, X0, Y0, X1, Y1, n =>
      refl(n.x + n.w / 2, n.y + n.h / 2, Math.max(n.w, n.h) * 0.8 + 10, n.c, neonA(n) * 0.6),
    );
    eachCell(gShops, X0, Y0, X1, Y1, s => refl(s.x, s.y, 30, SHOP_T[s.type].c, 0.15));
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = false;
  }
  for (const b of team) {
    if (b.i === active && playing) continue;
    if (b.status === 'dead' || !vis(b.x, b.y)) continue;
    const empty =
      b.status === 'out' ||
      b.status === 'captured' ||
      b.status === 'hosp' ||
      b.status === 'amb' ||
      b.status === 'medbay' ||
      b.status === 'fetch' ||
      b.status === 'waitamb' ||
      b.status === 'car';
    drawVeh(empty ? b.sprE : b.spr, b.x, b.y, b.a);
    if (b.status === 'idle') {
      lab(b.name, b.x, b.y - 18, b.ui);
      if (inMission(b)) lab('STADIO', b.x, b.y + 9, '#9fd4ff');
      else if (blockT > 0) lab('BLOCK', b.x, b.y + 9, '#f2f2f2');
      else lab(b.waitT > 0 ? fmt(b.waitT) : 'IN CARICA', b.x, b.y + 9, '#ffe03c');
    } else if (b.status === 'returning') lab(b.name, b.x, b.y - 18, b.ui);
    else if (b.status === 'robbing') {
      lab(b.name, b.x, b.y - 18, b.ui);
      lab('RAPINALI TUTTI! ' + (b.rob ? b.rob.k + '/' + b.rob.seq.length : ''), b.x, b.y + 9, '#ffd21f');
    } else if (b.status === 'truce') {
      lab(b.name, b.x, b.y - 18, b.ui);
      lab('TREGUA ' + fmt(truceT), b.x, b.y + 9, '#c6ff3a');
    } else if (empty)
      lab(
        b.status === 'captured'
          ? 'RAPITO'
          : b.status === 'hosp'
            ? 'OSPEDALE'
            : b.status === 'amb'
              ? 'AUTO MEDICA'
              : b.status === 'waitamb'
                ? 'SOCCORSI'
                : b.status === 'medbay'
                  ? 'IN CURA'
                  : b.status === 'fetch'
                    ? 'ASPETTA'
                    : b.status === 'car'
                      ? 'AUTO NERA'
                      : b.outR,
        b.x,
        b.y + 9,
        '#ff4d6d',
      );
  }
  for (const b of team) {
    if ((b.status === 'fetch' || b.status === 'medbay') && vis(b.px, b.py)) {
      drawPerson(
        b.px,
        b.py,
        b.pfa || 0,
        shade(b.ui, -0.2),
        b.skin,
        b.hair,
        0,
        b.status === 'fetch' ? b.walk : 0,
        b.sex === 'DONNA',
      );
      lab(b.name, b.px, b.py - 12, b.ui);
    }
  }
  if (amb && vis(amb.x, amb.y)) {
    drawVeh(ambSpr, amb.x, amb.y, amb.a);
    lab('AUTO MEDICA', amb.x, amb.y - 16, '#ff4d6d');
  }
  if (mission) {
    const t = missionTarget();
    if (vis(t.x, t.y) && blink(3)) lab(mission.carrier < 0 ? 'PACCO!' : 'CONSEGNA QUI', t.x, t.y - 31, '#ffe03c');
  }
  for (const s of shops) if (shopOff(s) && vis(s.x, s.y)) lab('FUORI USO ' + fmtL(s.offT), s.x, s.y - 40, '#ffd21f');
  for (const e of enemies) {
    const s = e.kind ? XK[e.kind] : enemySpr(e.t);
    if (!vis(e.x, e.y) && !vis(e.fx, e.fy)) continue;
    if (e.onFoot) {
      drawVeh(s.e, e.x, e.y, e.a);
      drawPerson(e.fx, e.fy, e.fa, '#4a1a7a', ACID, '#2a0b3d', e.punchT, e.walk, false);
    } else drawVeh(s.r, e.x, e.y, e.a);
    if (e.lchg > 0) {
      const w = e.wpn;
      ring(e.x, e.y, w.rad, ((T * 10) | 0) % 2 ? '#ff8a1f' : '#ff3d3d', 40, T * 2, 1);
      ring(e.x, e.y, 4 + (e.lchg / w.chg) * (w.rad - 4), '#ffe0a0', 20, -T * 6, 1);
    }
    if (e.follow && nyxOn() && !e.kneel && Math.floor(T * 2 + e.id) % 4 === 0) {
      ctx.fillStyle = '#b48cff';
      ctx.fillRect(Math.round(e.x) - 1, Math.round(e.y) - 12, 3, 3);
    }
    if (e.kind) {
      const k = XK[e.kind];
      lab(k.name + ' ' + Math.ceil(e.hp), e.x, e.y - 16, k.c);
      if (e.kind === 'gold') ring(e.x, e.y, 14, blink(4) ? k.c : '#fff2a0', 16, T * 3, 1);
    }
    if (e.kneel && ceremony) lab(ceremony.said ? '...' : 'DEA DELLA NOTTE', e.fx, e.fy - 14, ACID);
    const caps = team.filter(t => t.status === 'captured' && t.captor === e.id);
    caps.forEach((t, i) => {
      const cx2 = Math.round(e.x - Math.cos(e.a) * (14 + i * 8)),
        cy2 = Math.round(e.y - Math.sin(e.a) * (14 + i * 8));
      ctx.fillStyle = t.color;
      ctx.fillRect(cx2 - 3, cy2 - 3, 6, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(cx2 - 2, cy2 - 3, 1, 6);
      ctx.fillRect(cx2 + 1, cy2 - 3, 1, 6);
      lab(t.name + ' ' + fmt(t.capT), e.x, e.y - 26 - i * 9, blink(3) ? '#ff3df2' : t.ui);
    });
    const b = body(e);
    if (e.hitT > 0) {
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fillRect(b.x - 5, b.y - 5, 10, 10);
    }
  }
  for (const c of police) {
    if (vis(c.x, c.y)) {
      drawVeh(copSpr, c.x, c.y, c.a);
      if (c.mode === 'abandoned' && pAvail && dist(c.x, c.y, pBody.x, pBody.y) < 60)
        lab(
          team[active].onFoot && !team[active].inCar ? K('use') + ": RUBA L'AUTO" : 'AUTO INCUSTODITA',
          c.x,
          c.y - 16,
          '#9fd4ff',
        );
      if (c.mode === 'impound') lab('RESTA ' + fmt(c.impT), c.x, c.y - 14, '#9fd4ff');
    }
    if (c.mode === 'cops')
      for (const k of c.cops)
        if (k.out && k.hp > 0 && vis(k.x, k.y))
          drawPerson(k.x, k.y, k.fa, '#1d2a6b', '#c68a5e', '#0e0e14', 0, k.walk, false);
  }
  drawDark(vis);
  if (playing) {
    const p = team[active];
    if (p.inCar) {
      drawVeh(p.sprE, p.x, p.y, p.a);
    } else if (p.onFoot) {
      drawVeh(p.sprE, p.x, p.y, p.a);
      drawPerson(p.fx, p.fy, p.fa, shade(p.ui, -0.2), p.skin, p.hair, p.punchT, p.walk, p.sex === 'DONNA');
      if (dist(p.fx, p.fy, p.x, p.y) < 26 && blink(3)) lab(K('mount') + ': SALI', p.x, p.y - 18, '#ffffff');
    } else drawVeh(p.nyx ? nyxSpr : p.spr, p.x, p.y, p.a, p.lean);
    const pb = body(p);
    if (mission && mission.carrier === p.i) {
      ctx.fillStyle = '#8a5a2a';
      ctx.fillRect(Math.round(pb.x) + 4, Math.round(pb.y) + 3, 5, 4);
      ctx.fillStyle = '#ffe03c';
      ctx.fillRect(Math.round(pb.x) + 6, Math.round(pb.y) + 3, 1, 4);
    }
    if (p.lchg > 0) {
      const w = p.wpn,
        q = p.lchg / w.chg;
      ring(p.x, p.y, 6 + q * (w.rad - 6), '#ffb35c', 28, T * 8, 1);
      ring(p.x, p.y, w.rad, 'rgba(255,138,31,.45)', 36, -T * 2, 1);
    }
    if (p.walkPath) {
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      const q = p.walkPath[p.walkPath.length - 1];
      ctx.fillRect(Math.round(q.x) - 1, Math.round(q.y) - 14, 3, 3);
    }
  }
  // edifici sopra le strade, poi i neon sulle pareti
  drawBuildings(cx, cy, X0, Y0, X1, Y1);
  eachCell(gNeons, X0, Y0, X1, Y1, n => {
    const q = neonPos(n);
    if (!q.vis) return;
    ctx.fillStyle = n.c;
    ctx.globalAlpha = Math.min(1, 0.55 + neonA(n) * 1.4);
    ctx.fillRect(q.x, q.y, n.w, n.h);
  });
  ctx.globalAlpha = 1;
  for (const f of fx) {
    const k = f.t / f.dur;
    const o = f.own ? body(f.own) : f;
    if (f.k === 'swords') {
      ctx.fillStyle = f.c;
      for (let s = 0; s < 2; s++) {
        const a = f.a + k * 6.283 + s * Math.PI;
        for (let r2 = 6; r2 < f.r; r2 += 1.5)
          ctx.fillRect(Math.round(o.x + Math.cos(a) * r2), Math.round(o.y + Math.sin(a) * r2), 1, 1);
        ctx.globalAlpha = 0.5;
        for (let t = 1; t < 6; t++) {
          const a2 = a - t * 0.18;
          ctx.fillRect(Math.round(o.x + Math.cos(a2) * f.r), Math.round(o.y + Math.sin(a2) * f.r), 1, 1);
        }
        ctx.globalAlpha = 1;
      }
    } else if (f.k === 'whip') {
      ctx.fillStyle = f.c;
      const base = f.a + k * 6.283;
      for (let i = 0; i < 40; i++) {
        const t = i / 40;
        const a = base - t * 1.2;
        const rad = 6 + (f.r - 6) * Math.min(1, t * 1.6) * (0.6 + 0.4 * Math.sin(k * Math.PI));
        ctx.fillRect(Math.round(o.x + Math.cos(a) * rad), Math.round(o.y + Math.sin(a) * rad), t < 0.5 ? 2 : 1, 1);
      }
    } else if (f.k === 'laser') {
      const rad = f.r * (0.35 + 0.65 * Math.min(1, k * 1.8));
      ring(o.x, o.y, rad, k < 0.5 ? '#fff3c0' : f.c, 56, k * 3, 2);
      ctx.fillStyle = f.c;
      for (let s = 0; s < 3; s++) {
        const a = f.a + k * 9 + s * 2.094;
        for (let r2 = 4; r2 < rad; r2 += 1.5)
          ctx.fillRect(Math.round(o.x + Math.cos(a) * r2), Math.round(o.y + Math.sin(a) * r2), 1, 1);
      }
    }
  }
  for (const b of bullets) {
    ctx.fillStyle = b.c;
    ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
    const l = Math.hypot(b.vx, b.vy);
    ctx.globalAlpha = 0.5;
    ctx.fillRect(Math.round(b.x - (b.vx / l) * 4), Math.round(b.y - (b.vy / l) * 4), 1, 1);
    ctx.globalAlpha = 1;
  }
  for (const q of parts) {
    ctx.globalAlpha = Math.min(1, q.life * 3);
    ctx.fillStyle = q.c;
    ctx.fillRect(Math.round(q.x), Math.round(q.y), q.sz, q.sz);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // luce: buio della notte + sorgenti
  drawLights(ox, oy, X0, Y0, X1, Y1, playing);
  // bagliore additivo (bloom leggero)
  ctx.save();
  ctx.translate(-ox, -oy);
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingEnabled = true;
  eachCell(gNeons, X0, Y0, X1, Y1, n => {
    const q = neonPos(n);
    glow(q.x + n.w / 2, q.y + n.h / 2, Math.max(n.w, n.h) * 0.8 + 12, n.c, neonA(n) * 0.6);
  });
  eachCell(gShops, X0, Y0, X1, Y1, s =>
    glow(s.x, s.y, SHOP_T[s.type].sp ? 40 : 26, SHOP_T[s.type].c, 0.12 + 0.04 * Math.sin(T * 3 + s.i)),
  );
  if (vis(garage.cx, garage.cy)) glow(garage.cx, garage.cy, 110, '#ff3df2', 0.1 + 0.04 * Math.sin(T * 2));
  for (const c of police) {
    if (!vis(c.x, c.y) || (c.mode !== 'cops' && c.mode !== 'driven')) continue;
    const on = blink(6);
    const rx = c.x + Math.cos(c.a + Math.PI / 2) * 3,
      ry = c.y + Math.sin(c.a + Math.PI / 2) * 3,
      bx = c.x - Math.cos(c.a + Math.PI / 2) * 3,
      by = c.y - Math.sin(c.a + Math.PI / 2) * 3;
    const big = c.state === 'chase' || c.mode === 'driven';
    glow(rx, ry, big ? 24 : 14, '#ff2b4a', on ? 0.6 : 0.12);
    glow(bx, by, big ? 24 : 14, '#2b6bff', on ? 0.12 : 0.6);
  }
  if (amb && vis(amb.x, amb.y)) glow(amb.x, amb.y, 20, blink(8) ? '#ff2b4a' : '#ffffff', 0.5);
  for (const b of bullets) glow(b.x, b.y, 8, b.c, 0.5);
  for (const f of fx) {
    if (f.k === 'flash') glow(f.x, f.y, f.r * (1 - (f.t / f.dur) * 0.5), f.c, (1 - f.t / f.dur) * 0.6);
  }
  for (const e of enemies) if (!e.onFoot) glow(e.x, e.y, 12, ACID, 0.12);
  if (playing) {
    const p = team[active],
      pb = body(p);
    if (p.nyx) glow(pb.x, pb.y, 26, '#ff3df2', 0.3 + 0.12 * Math.sin(T * 5));
    if (p.nitroT > 0) glow(p.x, p.y, 20, '#3cf2ff', 0.3);
    if (p.shield && !p.inCar) glow(pb.x, pb.y, 18, '#9fd4ff', p.shieldT === null ? 0.1 : 0.2 + 0.06 * Math.sin(T * 8));
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = false;
  // sopra la luce: barre vita, insegne, etichette, numeri
  for (const e of enemies) {
    const b = body(e);
    if (!vis(b.x, b.y)) continue;
    if (e.hp < 25) {
      ctx.fillStyle = '#000';
      ctx.fillRect(b.x - 8, b.y - 12, 16, 3);
      ctx.fillStyle = ACID;
      ctx.fillRect(b.x - 7, b.y - 11, Math.max(0, (14 * e.hp) / 25), 1);
    }
  }
  for (const c of police)
    if (c.arrest > 0 && pAvail) {
      const w = Math.round((20 * c.arrest) / 1.2);
      ctx.fillStyle = '#000';
      ctx.fillRect(pBody.x - 11, pBody.y + 10, 22, 4);
      ctx.fillStyle = '#3a7bff';
      ctx.fillRect(pBody.x - 10, pBody.y + 11, w, 2);
      lab('ARRESTO', pBody.x, pBody.y + 16, '#9fd4ff');
    }
  eachCell(gShops, X0, Y0, X1, Y1, s => {
    const d = pAvail ? dist(s.x, s.y, pBody.x, pBody.y) : 1e9;
    if (s.anger > 0) {
      for (let i = 0; i < s.anger; i++) {
        ctx.fillStyle = '#ff4d6d';
        ctx.fillRect(s.x - s.anger * 2 + i * 4, s.y + 6, 3, 2);
      }
    }
    if (d < 90 || (SHOP_T[s.type].sp && d < 220)) {
      lab(s.name, s.x, s.y - 22, SHOP_T[s.type].c);
      if (s.anger > 0 && d < 24) lab('RABBIA ' + s.anger, s.x, s.y + 10, '#ff4d6d');
    }
  });
  for (const m of landmarks) if (vis(m.x, m.y) || dist(m.x, m.y, cx, cy) < 360) lab(m.name, m.x, m.b.y * CELL + 4, m.c);
  if (playing) {
    const pb = body(team[active]);
    if (blink(4)) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(pb.x) - 1, Math.round(pb.y) - 11, 3, 1);
      ctx.fillRect(Math.round(pb.x), Math.round(pb.y) - 10, 1, 1);
    }
  }
  for (let i = 0; i < LBL.length; i += 4) txt(LBL[i], LBL[i + 1], LBL[i + 2], LBL[i + 3], 1, 'center');
  for (const q of pops) {
    ctx.globalAlpha = Math.min(1, q.life * 2);
    txt(q.t, q.x, q.y, q.c, 1, 'center');
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  drawRain(dt, ox, oy, dcx, dcy);
}
