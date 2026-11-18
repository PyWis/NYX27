'use strict';
// ---------- city generation ----------
let ys, bands, solid, kind, blocks, nodes, edges, garage, neons, lamps, miniCv, stadium, landmarks;
// kind: 0 building,1 road,2 sidewalk,3 park,4 garage,5 campo stadio,6 tribune,7 piazza,8 lago
// isolati fissi: rimessa con Times Square e Central Park sul lato ovest, stadio di baseball
const GAR_W = 12,
  GAR_H = 16, // la fascia della rimessa e' alta 16 celle (ci stanno anche piazza e parco)
  TSQ_W = 18,
  CPK_W = 32,
  STD_W = 24,
  STD_H = 18,
  STD_GATE = 3; // larghezza delle 3 entrate (celle)
// posizioni (strade) tra a e b, con isolati da lo..hi celle; fn opzionale per spostare n
function fillLine(a, b, lo, hi, fn) {
  const out = [];
  let x = a;
  for (;;) {
    let n = x + RW + ri(lo, hi);
    if (fn) n = fn(n);
    if (n + RW + lo > b) break;
    out.push(n);
    x = n;
  }
  return out;
}
function genCity(seed) {
  rng = mulberry(seed);
  // fascia della rimessa al centro, fascia dello stadio a nord o a sud
  const c0 = Math.round(MH / 2 - (RW + GAR_H) / 2),
    c1 = c0 + RW + GAR_H;
  const north = rr() < 0.5;
  const s0 = north ? ri(40, 120) : ri(c1 + 50, MH - RW - (RW + STD_H) - 40),
    s1 = s0 + RW + STD_H;
  const fixed = north
    ? [
        [s0, s1],
        [c0, c1],
      ]
    : [
        [c0, c1],
        [s0, s1],
      ];
  ys = [0];
  for (const [a, b] of fixed) {
    ys.push(...fillLine(ys[ys.length - 1], a, 9, 15), a, b);
  }
  ys.push(...fillLine(ys[ys.length - 1], MH - RW, 9, 15), MH - RW);
  const midBand = ys.indexOf(c0),
    stdBand = ys.indexOf(s0);
  // colonne fisse: rimessa al centro, a ovest Times Square e poi Central Park; lo stadio in una posizione a caso
  const gx0 = Math.round(MW / 2 - (RW + GAR_W) / 2),
    gx1 = gx0 + RW + GAR_W,
    tsx = gx0 - (RW + TSQ_W),
    cpx = tsx - (RW + CPK_W);
  const sx0 = ri(30, MW - RW - (RW + STD_W) - 30),
    sx1 = sx0 + RW + STD_W;
  bands = [];
  let prev = [];
  // evita l'allineamento con le strade verticali della fascia sopra -> incroci a T, quasi mai a +
  const avoid = n => {
    for (let k = 0; k < 3; k++) {
      if (prev.some(p => p > 0 && p < MW - RW && Math.abs(p - n) < 6) && rr() > 0.05) n += 7;
      else break;
    }
    return n;
  };
  const row = fx => {
    const xs = [0];
    for (const [a, b] of fx) xs.push(...fillLine(xs[xs.length - 1], a, 8, 14, avoid), a, b);
    xs.push(...fillLine(xs[xs.length - 1], MW - RW, 8, 14, avoid), MW - RW);
    return xs;
  };
  for (let i = 0; i < ys.length - 1; i++) {
    const xs =
      i === midBand
        ? row([
            [cpx, tsx],
            [tsx, gx0],
            [gx0, gx1],
          ]).filter((v, k, a) => a.indexOf(v) === k)
        : i === stdBand
          ? row([[sx0, sx1]])
          : row([]);
    bands.push(xs);
    prev = xs;
  }
  solid = new Uint8Array(MW * MH).fill(1);
  kind = new Uint8Array(MW * MH);
  const carve = (x, y, w, h, k) => {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) {
        const id = j * MW + i;
        solid[id] = 0;
        kind[id] = k;
      }
  };
  for (const y of ys) carve(0, y, MW, RW, 1);
  bands.forEach((xs, i) => {
    for (const x of xs) carve(x, ys[i], RW, ys[i + 1] - ys[i] + RW, 1);
  });
  blocks = [];
  bands.forEach((xs, i) => {
    for (let j = 0; j < xs.length - 1; j++) {
      blocks.push({
        x: xs[j] + RW,
        y: ys[i] + RW,
        w: xs[j + 1] - xs[j] - RW,
        h: ys[i + 1] - ys[i] - RW,
        band: i,
        col: j,
        type: 'city',
        seed: ri(1, 1e9),
        neon: [],
        lots: [],
      });
    }
  });
  // nodes / edges
  nodes = [];
  const nodeMap = new Map();
  const nid = (cx, row) => {
    const k = cx + ',' + row;
    let id = nodeMap.get(k);
    if (id === undefined) {
      id = nodes.length;
      nodes.push({ cx, row, x: (cx + 1.5) * CELL, y: (row + 1.5) * CELL, nb: [] });
      nodeMap.set(k, id);
    }
    return id;
  };
  edges = [];
  const link = (a, b, h) => {
    const A = nodes[a],
      B = nodes[b];
    const len = Math.hypot(A.x - B.x, A.y - B.y);
    A.nb.push({ to: b, len });
    B.nb.push({ to: a, len });
    edges.push({ a, b, h });
  };
  for (let i = 0; i < ys.length; i++) {
    const set = new Set();
    if (i > 0) bands[i - 1].forEach(x => set.add(x));
    if (i < bands.length) bands[i].forEach(x => set.add(x));
    const arr = [...set].sort((p, q) => p - q);
    for (let k = 0; k < arr.length - 1; k++) link(nid(arr[k], ys[i]), nid(arr[k + 1], ys[i]), true);
  }
  bands.forEach((xs, i) => xs.forEach(x => link(nid(x, ys[i]), nid(x, ys[i + 1]), false)));
  // garage (+ Times Square e Central Park sul lato ovest) e stadio
  const mid = midBand;
  const gx = bands[mid];
  const j = gx.indexOf(gx0);
  const gb = blocks.find(b => b.band === mid && b.col === j);
  gb.type = 'garage';
  blocks.find(b => b.band === mid && b.col === gx.indexOf(tsx)).type = 'square';
  blocks.find(b => b.band === mid && b.col === gx.indexOf(cpx)).type = 'cpark';
  const sb = blocks.find(b => b.band === stdBand && b.col === bands[stdBand].indexOf(sx0));
  sb.type = 'stadium';
  const ix = (gb.x + 1) * CELL,
    iy = (gb.y + 1) * CELL,
    iw = (gb.w - 2) * CELL,
    ih = (gb.h - 2) * CELL;
  garage = {
    b: gb,
    x: gb.x * CELL,
    y: gb.y * CELL,
    w: gb.w * CELL,
    h: gb.h * CELL,
    node: nid(gx[j], ys[mid]),
    cx: (gb.x + gb.w / 2) * CELL,
    cy: (gb.y + gb.h / 2) * CELL,
    bays: [],
  };
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < NB / 2; c++)
      garage.bays.push({ x: Math.round(ix + (iw * (c + 0.5)) / (NB / 2)), y: Math.round(iy + ih * (r ? 0.78 : 0.27)) });
  // parks
  for (const b of blocks) if (b.type === 'city' && rr() < 0.07 && dist(b.x, b.y, gb.x, gb.y) > 6) b.type = 'park';
  landmarks = [];
  for (const b of blocks) {
    carve(b.x, b.y, b.w, 1, 2);
    carve(b.x, b.y + b.h - 1, b.w, 1, 2);
    carve(b.x, b.y, 1, b.h, 2);
    carve(b.x + b.w - 1, b.y, 1, b.h, 2);
    if (b.type === 'park') carve(b.x + 1, b.y + 1, b.w - 2, b.h - 2, 3);
    else if (b.type === 'garage') carve(b.x + 1, b.y + 1, b.w - 2, b.h - 2, 4);
    else if (b.type === 'cpark') buildCentralPark(b);
    else if (b.type === 'square') buildSquare(b);
    else if (b.type === 'stadium') buildStadium(b);
    else {
      const r = mulberry(b.seed);
      const out = [];
      splitLots(r, b.x + 1, b.y + 1, b.w - 2, b.h - 2, out, 0);
      for (const L of out) {
        L.seed = Math.floor(r() * 1e9);
        L.hgt = 2 + Math.floor(r() * 5);
        L.roof = pickR(r, ROOFS);
        const ix2 = b.x + 1,
          iy2 = b.y + 1,
          ex = b.x + b.w - 1,
          ey = b.y + b.h - 1;
        const side = (cond, mkN) => {
          if (cond && r() < 0.28) {
            const n = mkN();
            n.c = pickR(r, NEON);
            n.ph = r() * 10;
            n.fl = r() < 0.18;
            n.L = L;
            b.neon.push(n);
          }
        };
        const ln = len => Math.max(8, Math.floor(len * (0.3 + r() * 0.5)));
        side(L.y === iy2, () => {
          const l = ln(L.w * CELL);
          return {
            x: L.x * CELL + 4 + Math.floor(r() * Math.max(1, L.w * CELL - l - 8)),
            y: L.y * CELL - 2,
            w: l,
            h: 2,
          };
        });
        side(L.y + L.h === ey, () => {
          const l = ln(L.w * CELL);
          return {
            x: L.x * CELL + 4 + Math.floor(r() * Math.max(1, L.w * CELL - l - 8)),
            y: (L.y + L.h) * CELL,
            w: l,
            h: 2,
          };
        });
        side(L.x === ix2, () => {
          const l = ln(L.h * CELL);
          return {
            x: L.x * CELL - 2,
            y: L.y * CELL + 4 + Math.floor(r() * Math.max(1, L.h * CELL - l - 8)),
            w: 2,
            h: l,
          };
        });
        side(L.x + L.w === ex, () => {
          const l = ln(L.h * CELL);
          return {
            x: (L.x + L.w) * CELL,
            y: L.y * CELL + 4 + Math.floor(r() * Math.max(1, L.h * CELL - l - 8)),
            w: 2,
            h: l,
          };
        });
      }
      b.lots = out;
    }
  }
  neons = [];
  for (const b of blocks) for (const n of b.neon) neons.push(n);
  genShops();
  // street lamps
  lamps = [];
  nodes.forEach((n, i) => {
    const h = hash(i * 7 + 3);
    if (h > 0.62) return;
    const cs = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    const s = Math.floor(hash(i * 13 + 1) * 4);
    for (let k = 0; k < 4; k++) {
      const c = cs[(s + k) % 4];
      const x = n.x + c[0] * 32,
        y = n.y + c[1] * 32;
      if (kindAt(x, y) === 2) {
        lamps.push({
          x,
          y,
          c: hash(i * 5) < 0.6 ? '#ffcf7a' : pickR(() => hash(i * 11), ['#3cf2ff', '#ff3df2', '#a66bff']),
        });
        break;
      }
    }
  });
  // minimap (1 px = 2 cells)
  miniCv = mk(MW / 2, MH / 2);
  const mg = miniCv.getContext('2d');
  const id = mg.createImageData(MW / 2, MH / 2);
  const COLS = {
    1: [107, 93, 146],
    2: [46, 39, 66],
    0: [18, 14, 26],
    3: [31, 90, 51],
    4: [255, 61, 242],
    5: [46, 120, 62],
    6: [150, 150, 176],
    7: [128, 104, 150],
    8: [40, 84, 160],
  };
  const PRIO = [4, 1, 6, 8, 5, 7, 3, 2];
  for (let y = 0; y < MH / 2; y++)
    for (let x = 0; x < MW / 2; x++) {
      const ks = [
        kind[2 * y * MW + 2 * x],
        kind[2 * y * MW + 2 * x + 1],
        kind[(2 * y + 1) * MW + 2 * x],
        kind[(2 * y + 1) * MW + 2 * x + 1],
      ];
      const best = PRIO.find(k => ks.includes(k)) || 0;
      const c = COLS[best];
      const o = ((y * MW) / 2 + x) * 4;
      id.data[o] = c[0];
      id.data[o + 1] = c[1];
      id.data[o + 2] = c[2];
      id.data[o + 3] = 255;
    }
  mg.putImageData(id, 0, 0);
  bcache.clear();
  if (typeof resetWorldCaches === 'function') resetWorldCaches();
}
const ROOFS = [
  '#3b3552',
  '#45405e',
  '#2f3b4a',
  '#4a3b3b',
  '#3a4a44',
  '#504a5c',
  '#2e2e3e',
  '#5a4a3a',
  '#36404f',
  '#3e4658',
  '#4b3f52',
];
function setCells(x, y, w, h, k, s) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) {
      const id = j * MW + i;
      solid[id] = s;
      kind[id] = k;
    }
}
const blockCenter = b => ({ x: (b.x + b.w / 2) * CELL, y: (b.y + b.h / 2) * CELL });
// ---------- Central Park: prato grande con lago (il lago non si attraversa) ----------
function buildCentralPark(b) {
  const ix = b.x + 1,
    iy = b.y + 1,
    iw = b.w - 2,
    ih = b.h - 2;
  setCells(ix, iy, iw, ih, 3, 0);
  const cx = ix + iw * 0.64,
    cy = iy + ih * 0.45,
    ax = 5.2,
    ay = Math.min(3.6, ih * 0.25);
  for (let j = iy; j < iy + ih; j++)
    for (let i = ix; i < ix + iw; i++) {
      const dx = (i + 0.5 - cx) / ax,
        dy = (j + 0.5 - cy) / ay;
      if (dx * dx + dy * dy <= 1) setCells(i, j, 1, 1, 8, 1);
    }
  b.lake = { cx, cy, ax, ay };
  landmarks.push({ name: 'CENTRAL PARK', ...blockCenter(b), c: '#5cff7a', b });
}
// ---------- Times Square: piazza pedonale tra due file di grattacieli pieni di neon ----------
function buildSquare(b) {
  const r = mulberry(b.seed ^ 0x7153),
    ix = b.x + 1,
    iy = b.y + 1,
    iw = b.w - 2,
    ih = b.h - 2,
    D = 3;
  setCells(ix, iy, iw, ih, 7, 0);
  const rowLots = (y, top) => {
    let x = ix;
    const end = ix + iw;
    while (x < end) {
      let w = 4 + Math.floor(r() * 3);
      if (end - x - w < 4) w = end - x;
      const L = { x, y, w, h: D, seed: Math.floor(r() * 1e9), hgt: 5 + Math.floor(r() * 3), roof: pickR(r, ROOFS) };
      b.lots.push(L);
      setCells(x, y, w, D, 0, 1);
      // insegne giganti verso la piazza (2-3 per palazzo) e una verso la strada
      const fy = top ? (L.y + L.h) * CELL : L.y * CELL - 2;
      const seg = 2 + Math.floor(r() * 2),
        sw = Math.floor((w * CELL - 6) / seg);
      for (let k = 0; k < seg; k++)
        b.neon.push({
          x: L.x * CELL + 3 + k * sw,
          y: fy,
          w: sw - 3,
          h: 2,
          c: pickR(r, NEON),
          ph: r() * 10,
          fl: r() < 0.3,
          L,
        });
      if (r() < 0.6) {
        const l = Math.max(8, Math.floor(w * CELL * 0.5));
        b.neon.push({
          x: L.x * CELL + 4,
          y: top ? L.y * CELL - 2 : (L.y + L.h) * CELL,
          w: l,
          h: 2,
          c: pickR(r, NEON),
          ph: r() * 10,
          fl: false,
          L,
        });
      }
      x += w;
    }
  };
  rowLots(iy, true);
  rowLots(iy + ih - D, false);
  landmarks.push({ name: 'TIMES SQUARE', ...blockCenter(b), c: '#ff3df2', b });
}
// ---------- stadio di baseball: tribune con 3 entrate (ovest, nord, est) ----------
function buildStadium(b) {
  const ix = b.x + 1,
    iy = b.y + 1,
    iw = b.w - 2,
    ih = b.h - 2,
    G = STD_GATE,
    P = v => v * CELL;
  setCells(ix, iy, iw, ih, 5, 0);
  setCells(ix, iy, iw, 2, 6, 1);
  setCells(ix, iy + ih - 2, iw, 2, 6, 1);
  setCells(ix, iy, 2, ih, 6, 1);
  setCells(ix + iw - 2, iy, 2, ih, 6, 1);
  const gm = Math.floor((ih - G) / 2),
    gn = Math.floor((iw - G) / 2);
  setCells(ix, iy + gm, 2, G, 5, 0);
  setCells(ix + gn, iy, G, 2, 5, 0);
  setCells(ix + iw - 2, iy + gm, 2, G, 5, 0);
  const my = P(iy + gm + G / 2),
    mx = P(ix + gn + G / 2);
  stadium = {
    b,
    x0: P(ix + 2),
    y0: P(iy + 2),
    x1: P(ix + iw - 2),
    y1: P(iy + ih - 2),
    gates: [
      { n: 'OVEST', gx: P(ix + 1), gy: my, ox: P(b.x - 1.5), oy: my, ix: P(ix + 3.5), iy: my },
      { n: 'NORD', gx: mx, gy: P(iy + 1), ox: mx, oy: P(b.y - 1.5), ix: mx, iy: P(iy + 3.5) },
      { n: 'EST', gx: P(ix + iw - 1), gy: my, ox: P(b.x + b.w + 1.5), oy: my, ix: P(ix + iw - 3.5), iy: my },
    ],
    lights: [
      { x: P(ix + 1), y: P(iy + 1) },
      { x: P(ix + iw - 1), y: P(iy + 1) },
      { x: P(ix + 1), y: P(iy + ih - 1) },
      { x: P(ix + iw - 1), y: P(iy + ih - 1) },
    ],
  };
  stadium.cx = (stadium.x0 + stadium.x1) / 2;
  stadium.cy = (stadium.y0 + stadium.y1) / 2;
  landmarks.push({ name: 'STADIO', ...blockCenter(b), c: '#9fd4ff', b });
}
// dentro il campo dello stadio (le entrate non contano)
const inStadium = (x, y) => x >= stadium.x0 && x < stadium.x1 && y >= stadium.y0 && y < stadium.y1;
// vicino allo stadio: dentro l'isolato o a meno di m pixel dal suo bordo
const nearStadium = (x, y, m) => {
  const b = stadium.b;
  return x > b.x * CELL - m && x < (b.x + b.w) * CELL + m && y > b.y * CELL - m && y < (b.y + b.h) * CELL + m;
};
// entrata piu' vicina a un punto
function nearGate(x, y) {
  let best = stadium.gates[0],
    bd = 1e9;
  for (const g of stadium.gates) {
    const d = dist(g.ix, g.iy, x, y);
    if (d < bd) {
      bd = d;
      best = g;
    }
  }
  return best;
}
function genShops() {
  shops = [];
  const GX = 7,
    GY = 6,
    used = new Set(),
    slots = [];
  for (let gy = 0; gy < GY; gy++)
    for (let gx = 0; gx < GX; gx++) {
      const cand = blocks.filter(
        b =>
          b.type === 'city' &&
          b.lots.length &&
          !used.has(b) &&
          b.x + b.w / 2 >= (gx * MW) / GX &&
          b.x + b.w / 2 < ((gx + 1) * MW) / GX &&
          b.y + b.h / 2 >= (gy * MH) / GY &&
          b.y + b.h / 2 < ((gy + 1) * MH) / GY,
      );
      if (!cand.length) continue;
      const b = cand[Math.floor(rr() * cand.length)];
      const opts = [];
      for (const L of b.lots) {
        if (L.y === b.y + 1) opts.push([L, 't']);
        if (L.y + L.h === b.y + b.h - 1) opts.push([L, 'b']);
        if (L.x === b.x + 1) opts.push([L, 'l']);
        if (L.x + L.w === b.x + b.w - 1) opts.push([L, 'r']);
      }
      if (!opts.length) continue;
      used.add(b);
      opts.sort((p, q) => q[0].w * q[0].h - p[0].w * p[0].h);
      slots.push({ b, opts });
    }
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rr() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  const types = [...SPECIALS];
  for (let i = 0; i < 5; i++) types.push('pharm', 'mech');
  for (let i = 0; i < 20; i++) types.push('shop');
  // gli isolati grandi (parco, piazza, stadio) possono lasciare zone vuote: completa con altri isolati
  if (slots.length < types.length) {
    const extra = blocks.filter(b => b.type === 'city' && b.lots.length && !used.has(b));
    while (slots.length < types.length && extra.length) {
      const b = extra.splice(Math.floor(rr() * extra.length), 1)[0];
      const opts = [];
      for (const L of b.lots) {
        if (L.y === b.y + 1) opts.push([L, 't']);
        if (L.y + L.h === b.y + b.h - 1) opts.push([L, 'b']);
        if (L.x === b.x + 1) opts.push([L, 'l']);
        if (L.x + L.w === b.x + b.w - 1) opts.push([L, 'r']);
      }
      if (!opts.length) continue;
      used.add(b);
      opts.sort((p, q) => q[0].w * q[0].h - p[0].w * p[0].h);
      slots.push({ b, opts });
    }
  }
  let ni = 0;
  types.forEach((type, k) => {
    const sl = slots[k];
    if (!sl) return;
    const b = sl.b;
    const [L, side] = SHOP_T[type].sp ? sl.opts[0] : sl.opts[Math.floor(rr() * sl.opts.length)];
    let x, y;
    if (side === 't') {
      x = (L.x + L.w / 2) * CELL;
      y = (b.y + 0.5) * CELL;
    } else if (side === 'b') {
      x = (L.x + L.w / 2) * CELL;
      y = (b.y + b.h - 0.5) * CELL;
    } else if (side === 'l') {
      x = (b.x + 0.5) * CELL;
      y = (L.y + L.h / 2) * CELL;
    } else {
      x = (b.x + b.w - 0.5) * CELL;
      y = (L.y + L.h / 2) * CELL;
    }
    const s = {
      i: shops.length,
      type,
      x: Math.round(x),
      y: Math.round(y),
      side,
      L,
      b,
      name: type === 'shop' ? SHOP_NAMES[ni++ % SHOP_NAMES.length] : SHOP_T[type].name,
      anger: 0,
      calm: 0,
      cd: 0,
    };
    if (type === 'church') L.flat = true;
    b.shop = s;
    b.neon = b.neon.filter(n => dist(n.x, n.y, s.x, s.y) > 40);
    shops.push(s);
  });
}
function splitLots(r, x, y, w, h, out, d) {
  const can = (w >= 6 || h >= 6) && d < 5;
  if (can && !(w <= 7 && h <= 7 && r() < 0.5)) {
    if ((w >= h && w >= 6) || h < 6) {
      const s = 3 + Math.floor(r() * (w - 5));
      splitLots(r, x, y, s, h, out, d + 1);
      splitLots(r, x + s, y, w - s, h, out, d + 1);
      return;
    }
    const s = 3 + Math.floor(r() * (h - 5));
    splitLots(r, x, y, w, s, out, d + 1);
    splitLots(r, x, y + s, w, h - s, out, d + 1);
    return;
  }
  out.push({ x, y, w, h });
}
function solidAt(px, py) {
  if (px < 0 || py < 0) return true;
  const cx = (px / CELL) | 0,
    cy = (py / CELL) | 0;
  if (cx >= MW || cy >= MH) return true;
  return solid[cy * MW + cx] === 1;
}
function kindAt(px, py) {
  if (px < 0 || py < 0) return 0;
  const cx = (px / CELL) | 0,
    cy = (py / CELL) | 0;
  if (cx >= MW || cy >= MH) return 0;
  return kind[cy * MW + cx];
}
function blocked(x, y, r) {
  return solidAt(x - r, y - r) || solidAt(x + r, y - r) || solidAt(x - r, y + r) || solidAt(x + r, y + r);
}
function moveCol(o, kx, ky, dx, dy, r) {
  let hit = false;
  const nx = o[kx] + dx;
  if (!blocked(nx, o[ky], r)) o[kx] = nx;
  else hit = true;
  const ny = o[ky] + dy;
  if (!blocked(o[kx], ny, r)) o[ky] = ny;
  else hit = true;
  return hit;
}
function los(x1, y1, x2, y2) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.ceil(d / 6);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (solidAt(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
  }
  return true;
}
function inGarage(x, y) {
  return x >= garage.x && x < garage.x + garage.w && y >= garage.y && y < garage.y + garage.h;
}
function nearestNodeLOS(x, y) {
  const c = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const d = Math.abs(n.x - x) + Math.abs(n.y - y);
    if (d < 700) c.push([d, i]);
  }
  c.sort((a, b) => a[0] - b[0]);
  for (let k = 0; k < Math.min(10, c.length); k++) {
    const n = nodes[c[k][1]];
    if (los(x, y, n.x, n.y)) return c[k][1];
  }
  return c.length ? c[0][1] : 0;
}
// heap dijkstra
function dijkstra(s, t) {
  const N = nodes.length,
    D = new Float64Array(N).fill(1e18),
    P = new Int32Array(N).fill(-1);
  const H = [];
  const push = it => {
    H.push(it);
    let i = H.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (H[p][0] <= H[i][0]) break;
      [H[p], H[i]] = [H[i], H[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = H[0];
    const l = H.pop();
    if (H.length) {
      H[0] = l;
      let i = 0;
      for (;;) {
        const a = 2 * i + 1,
          b = a + 1;
        let m = i;
        if (a < H.length && H[a][0] < H[m][0]) m = a;
        if (b < H.length && H[b][0] < H[m][0]) m = b;
        if (m === i) break;
        [H[m], H[i]] = [H[i], H[m]];
        i = m;
      }
    }
    return top;
  };
  D[s] = 0;
  push([0, s]);
  while (H.length) {
    const [d, u] = pop();
    if (d > D[u]) continue;
    if (u === t) break;
    for (const e of nodes[u].nb) {
      const nd = d + e.len;
      if (nd < D[e.to]) {
        D[e.to] = nd;
        P[e.to] = u;
        push([nd, e.to]);
      }
    }
  }
  if (D[t] >= 1e18) return null;
  const path = [];
  for (let u = t; u !== -1; u = P[u]) path.push(u);
  return path.reverse();
}
// flow field around player (cells)
const FR = 36,
  FS = FR * 2 + 1;
const ff = new Int16Array(FS * FS);
let ffOX = 0,
  ffOY = 0;
const fq = new Int32Array(FS * FS);
function buildFlow(px, py) {
  const cx = (px / CELL) | 0,
    cy = (py / CELL) | 0;
  ffOX = cx - FR;
  ffOY = cy - FR;
  ff.fill(-1);
  const st = FR * FS + FR;
  ff[st] = 0;
  let h = 0,
    t = 0;
  fq[t++] = st;
  while (h < t) {
    const id = fq[h++];
    const lx = id % FS,
      ly = (id / FS) | 0;
    const v = ff[id];
    for (let k = 0; k < 4; k++) {
      const nx = lx + (k === 0 ? 1 : k === 1 ? -1 : 0),
        ny = ly + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= FS || ny >= FS) continue;
      const ni = ny * FS + nx;
      if (ff[ni] !== -1) continue;
      const gx = nx + ffOX,
        gy = ny + ffOY;
      if (gx < 0 || gy < 0 || gx >= MW || gy >= MH || solid[gy * MW + gx]) continue;
      ff[ni] = v + 1;
      fq[t++] = ni;
    }
  }
}
function flowAt(cx, cy) {
  const lx = cx - ffOX,
    ly = cy - ffOY;
  if (lx < 0 || ly < 0 || lx >= FS || ly >= FS) return -1;
  return ff[ly * FS + lx];
}
function flowDir(x, y) {
  const cx = (x / CELL) | 0,
    cy = (y / CELL) | 0;
  const v = flowAt(cx, cy);
  if (v < 0) return null;
  let best = v,
    bx = cx,
    by = cy;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const f = flowAt(cx + dx, cy + dy);
      if (f < 0 || f >= best) continue;
      if (dx && dy && (flowAt(cx + dx, cy) < 0 || flowAt(cx, cy + dy) < 0)) continue;
      best = f;
      bx = cx + dx;
      by = cy + dy;
    }
  if (bx === cx && by === cy) return null;
  return { x: (bx + 0.5) * CELL, y: (by + 0.5) * CELL };
}
