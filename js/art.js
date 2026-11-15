'use strict';
// chiesa gotica vista dall'alto: pianta a croce latina, torri campanarie con guglie, rosone, contrafforti, vetrate e cimitero
function drawChurch(g, s, lx, ly, lw, lh) {
  const side = s.side,
    vert = side === 't' || side === 'b';
  const W = vert ? lw : lh,
    H = vert ? lh : lw;
  const r = mulberry(s.L.seed ^ 77);
  const Rr = (u, v, w, h, c) => {
    u = Math.round(u);
    v = Math.round(v);
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
    g.fillStyle = c;
    if (side === 't') g.fillRect(lx + u, ly + v, w, h);
    else if (side === 'b') g.fillRect(lx + u, ly + lh - v - h, w, h);
    else if (side === 'l') g.fillRect(lx + v, ly + u, h, w);
    else g.fillRect(lx + lw - v - h, ly + u, h, w);
  };
  const M = (u, v) =>
    side === 't'
      ? [lx + u, ly + v]
      : side === 'b'
        ? [lx + u, ly + lh - 1 - v]
        : side === 'l'
          ? [lx + v, ly + u]
          : [lx + lw - 1 - v, ly + u];
  const spire = (u, v, sz) => {
    sz = Math.round(sz);
    for (let i = 0; i * 2 < sz; i++) Rr(u + i, v + i, sz - 2 * i, sz - 2 * i, i % 2 ? '#4a4466' : '#2e2a40');
    for (let i = 0; i < sz; i++) {
      Rr(u + i, v + i, 1, 1, '#1a1726');
      Rr(u + sz - 1 - i, v + i, 1, 1, '#1a1726');
    }
    Rr(u + sz / 2 - 0.5, v + sz / 2 - 0.5, 1, 1, '#ffd27a');
    Rr(u, v, 1, 1, '#9a8fbe');
    Rr(u + sz - 1, v, 1, 1, '#9a8fbe');
    Rr(u, v + sz - 1, 1, 1, '#9a8fbe');
    Rr(u + sz - 1, v + sz - 1, 1, 1, '#9a8fbe');
  };
  Rr(0, 0, W, H, '#18201b');
  for (let i = 0; i < (W * H) / 8; i++) Rr(r() * W, r() * H, 1, 1, pickR(r, ['#1f2a22', '#141a16', '#24301f']));
  for (let i = 0; i < (W * H) / 110; i++) {
    const u = 2 + r() * (W - 6),
      v = 4 + r() * (H - 8);
    Rr(u + 1, v + 1, 2, 3, '#0c0f0d');
    Rr(u, v, 2, 3, '#7d7a8a');
    Rr(u, v, 2, 1, '#a09cae');
  }
  for (let i = 0; i < (W * H) / 500; i++) {
    const u = 3 + r() * (W - 6),
      v = 3 + r() * (H - 6);
    Rr(u, v, 1, 3, '#2a2018');
    Rr(u - 1, v, 3, 1, '#2a2018');
  }
  const nw = clamp(Math.round(W * 0.36), 8, 28),
    x0 = Math.round((W - nw) / 2),
    v0 = Math.round(Math.min(11, H * 0.22)),
    vEnd = Math.round(H - Math.max(5, nw * 0.5) - 1);
  Rr(x0 + nw / 2 - 2, 0, 4, v0, '#5a5466');
  for (let v = v0 + 3; v < vEnd - 2; v += 6) {
    Rr(x0 - 3, v, 3, 2, '#4a4560');
    Rr(x0 + nw, v, 3, 2, '#3a3550');
    Rr(x0 - 4, v + 2, 4, 1, '#0c0a12');
    Rr(x0 + nw, v + 2, 4, 1, '#0c0a12');
  }
  Rr(x0, v0, nw / 2, vEnd - v0, '#3e3858');
  Rr(x0 + nw / 2, v0, nw - nw / 2, vEnd - v0, '#2b2640');
  for (let v = v0; v < vEnd; v += 3) Rr(x0, v, nw, 1, '#24203a');
  Rr(x0 + nw / 2, v0, 1, vEnd - v0, '#8a7fae');
  for (let v = v0 + 5; v < vEnd - 2; v += 6) {
    const c = pickR(r, ['#ff4d6d', '#3a7bff', '#ffd27a', '#a66bff']);
    Rr(x0, v, 1, 2, c);
    Rr(x0 + nw - 1, v, 1, 2, c);
  }
  const tv = v0 + (vEnd - v0) * 0.58,
    tw = Math.min(W - 4, nw * 2.4),
    tt = Math.max(6, nw * 0.7);
  Rr((W - tw) / 2, tv, tw, tt / 2, '#3e3858');
  Rr((W - tw) / 2, tv + tt / 2, tw, tt / 2, '#2b2640');
  Rr((W - tw) / 2, tv + tt / 2, tw, 1, '#8a7fae');
  Rr((W - tw) / 2, tv, 1, tt, '#ff4d6d');
  Rr((W + tw) / 2 - 1, tv, 1, tt, '#3a7bff');
  const ar = nw / 2;
  for (let dv = 0; dv < ar; dv++) {
    const w = Math.round(2 * Math.sqrt(ar * ar - dv * dv));
    Rr(W / 2 - w / 2, vEnd + dv, w, 1, dv % 3 ? '#2b2640' : '#3e3858');
  }
  const cs = Math.max(5, nw * 0.55);
  spire(W / 2 - cs / 2, tv + tt / 2 - cs / 2, cs);
  const ts = Math.max(5, Math.round(nw * 0.42));
  spire(x0 - 2, Math.max(0, v0 - ts + 3), ts);
  spire(x0 + nw - ts + 2, Math.max(0, v0 - ts + 3), ts);
  const rr2 = Math.max(2, Math.round(nw * 0.17)),
    [rx, ry] = M(W / 2, v0 + rr2 + 1);
  pc(g, rx, ry, rr2 + 1, '#1a1726');
  pc(g, rx, ry, rr2, '#7a2bff');
  if (rr2 > 2) pc(g, rx, ry, rr2 - 1, '#ff4d6d');
  pc(g, rx, ry, 1, '#ffd27a');
  Rr(x0 + nw / 2 - 4, 0, 8, 1, '#8a8698');
  Rr(x0 + nw / 2 - 3, 1, 6, 1, '#6a6678');
}
function drawShopFront(g, s, b) {
  const P = (x, y, w, h, cl) => {
    g.fillStyle = cl;
    g.fillRect(x, y, w, h);
  };
  const T = SHOP_T[s.type];
  const L = s.L,
    lx = (L.x - b.x) * CELL + 1,
    ly = (L.y - b.y) * CELL + 1,
    lw = L.w * CELL - 2,
    lh = L.h * CELL - 2;
  const dx = s.x - b.x * CELL,
    dy = s.y - b.y * CELL;
  if (s.type === 'church') {
    drawChurch(g, s, lx, ly, lw, lh);
    return;
  }
  if (T.sp) {
    P(lx + 2, ly + 2, lw - 4 - 0, lh - 4 - 0, shade(T.c, -0.72));
    for (let i = 0; i < (lw * lh) / 40; i++)
      P(lx + 3 + ((i * 37) % (lw - 8)), ly + 3 + ((i * 53) % (lh - 8)), 1, 1, shade(T.c, -0.6));
  }
  if (s.side === 't' || s.side === 'b') {
    const y = s.side === 't' ? ly : ly + lh - 5;
    for (let x = lx; x < lx + lw; x += 3) P(x, y, 3, 5, ((x / 3) | 0) % 2 ? T.c : '#f2f2f2');
    P(lx, s.side === 't' ? y + 5 : y - 1, lw, 1, '#000');
    P(dx - 5, s.side === 't' ? y - 2 : y + 5, 10, 2, '#ffe9a8');
  } else {
    const x = s.side === 'l' ? lx : lx + lw - 5;
    for (let y = ly; y < ly + lh; y += 3) P(x, y, 5, 3, ((y / 3) | 0) % 2 ? T.c : '#f2f2f2');
    P(s.side === 'l' ? x + 5 : x - 1, ly, 1, lh, '#000');
    P(s.side === 'l' ? x - 2 : x + 5, dy - 5, 2, 10, '#ffe9a8');
  }
  const sc = T.sp ? 2 : 1,
    bs = 7 * sc + 4;
  const cx = Math.round(lx + (lw - 0) / 2 - bs / 2),
    cy = Math.round(ly + (lh - 0) / 2 - bs / 2 - (T.sp ? 5 : 0));
  P(cx - 1, cy - 1, bs, bs, '#0b0814');
  P(cx - 1, cy - 1, bs, 1, T.c);
  P(cx - 1, cy + bs - 2, bs, 1, T.c);
  P(cx - 1, cy - 1, 1, bs, T.c);
  P(cx + bs - 2, cy - 1, 1, bs, T.c);
  T.icon.forEach((row, j) => {
    for (let i = 0; i < 7; i++) if (row[i] === '1') P(cx + 1 + i * sc, cy + 1 + j * sc, sc, sc, T.c);
  });
  if (T.sp) {
    const nm = T.name;
    const tw = nm.length * 6 - 1;
    if (tw < lw - 0 - 4) {
      const tx = Math.round(lx + (lw - 0 - tw) / 2),
        ty = cy + bs + 3;
      glyphs(g, nm, tx + 1, ty + 1, 1, '#000');
      glyphs(g, nm, tx, ty, 1, T.c);
    }
  }
}
// ---------- art: textures & sprites ----------
const asph = mk(64, 64);
{
  const g = asph.getContext('2d');
  g.fillStyle = '#16121e';
  g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 520; i++) {
    g.fillStyle = ['#1c1726', '#110e18', '#1a1522', '#201a2c'][i % 4];
    g.fillRect((Math.random() * 64) | 0, (Math.random() * 64) | 0, 1, 1);
  }
  g.fillStyle = '#0e0b14';
  let x = 10,
    y = 5;
  for (let i = 0; i < 40; i++) {
    g.fillRect(x & 63, y & 63, 1, 1);
    x += Math.random() < 0.5 ? 1 : 0;
    y += 1;
  }
  x = 40;
  y = 30;
  for (let i = 0; i < 24; i++) {
    g.fillRect(x & 63, y & 63, 1, 1);
    x += 1;
    y += Math.random() < 0.4 ? 1 : 0;
  }
}
const asphPat = ctx.createPattern(asph, 'repeat');
const glowCache = new Map();
function glowSpr(col) {
  let c = glowCache.get(col);
  if (c) return c;
  c = mk(64, 64);
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  const [r, gg, b] = hx(col);
  gr.addColorStop(0, `rgba(${r},${gg},${b},1)`);
  gr.addColorStop(0.35, `rgba(${r},${gg},${b},.45)`);
  gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  glowCache.set(col, c);
  return c;
}
function glow(x, y, r, col, a) {
  if (a <= 0) return;
  ctx.globalAlpha = Math.min(1, a);
  ctx.drawImage(glowSpr(col), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}
const cone = mk(96, 48);
{
  const g = cone.getContext('2d');
  const gr = g.createRadialGradient(0, 24, 0, 0, 24, 96);
  gr.addColorStop(0, 'rgba(255,245,200,.9)');
  gr.addColorStop(1, 'rgba(255,245,200,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(0, 22);
  g.lineTo(96, 0);
  g.lineTo(96, 48);
  g.lineTo(0, 26);
  g.closePath();
  g.fill();
}
function bikeSprite(col, rim, rider, enemy, jacket, helm, visor) {
  const c = mk(20, 12),
    g = c.getContext('2d');
  const P = (x, y, w, h, cl) => {
    g.fillStyle = cl;
    g.fillRect(x, y, w, h);
  };
  P(0, 5, 4, 2, '#07070a');
  P(15, 5, 5, 2, '#07070a');
  P(1, 4, 2, 1, '#2a2a30');
  P(16, 4, 3, 1, '#2a2a30');
  P(14, 3, 2, 6, '#5a5f6c');
  const dk = shade(col, -0.45),
    lt = shade(col, 0.35);
  P(3, 3, 12, 6, col);
  P(3, 3, 12, 1, lt);
  P(3, 8, 12, 1, dk);
  P(15, 4, 2, 4, col);
  P(16, 4, 1, 1, lt);
  if (rim) {
    P(3, 2, 12, 1, rim);
    P(3, 9, 12, 1, rim);
    P(17, 4, 1, 4, rim);
  }
  if (enemy) {
    P(5, 3, 2, 6, '#1b2a10');
    P(10, 3, 1, 6, '#1b2a10');
    P(12, 4, 2, 4, rim || '#a66bff');
  } else {
    P(11, 4, 2, 4, '#3cf2ff');
    P(11, 5, 2, 2, '#bffcff');
  }
  P(17, 5, 1, 2, '#fffbd0');
  P(0, 5, 1, 2, '#ff2b4a');
  P(5, 4, 5, 4, '#16131c');
  if (rider) {
    P(13, 1, 1, 10, '#8a8f9c');
    P(5, 2, 4, 8, jacket);
    P(9, 2, 4, 2, jacket);
    P(9, 8, 4, 2, jacket);
    P(12, 2, 1, 1, '#0c0c0c');
    P(12, 9, 1, 1, '#0c0c0c');
    P(6, 4, 4, 4, helm);
    P(6, 4, 4, 1, shade(helm, 0.3));
    P(9, 4, 1, 4, visor);
  }
  return c;
}
function portrait(r) {
  const c = mk(24, 24),
    g = c.getContext('2d');
  const P = (x, y, w, h, cl) => {
    g.fillStyle = cl;
    g.fillRect(x, y, w, h);
  };
  P(0, 0, 24, 24, '#120c1e');
  for (let y = 0; y < 24; y += 2) P(0, y, 24, 1, '#170f28');
  const F = r.sex === 'DONNA';
  if (F) P(5, 5, 14, 15, r.hair);
  P(3, 18, 18, 6, shade(r.ui, -0.25));
  P(3, 18, 18, 1, shade(r.ui, 0.2));
  P(9, 17, 6, 2, '#1b1b22');
  P(10, 15, 4, 3, shade(r.skin, -0.15));
  P(7, 5, 10, 11, r.skin);
  P(16, 6, 1, 9, shade(r.skin, -0.2));
  if (F) {
    P(6, 3, 12, 4, r.hair);
    P(5, 5, 2, 13, r.hair);
    P(17, 5, 2, 13, r.hair);
    P(7, 6, 3, 1, r.hair);
  } else {
    P(7, 3, 10, 3, r.hair);
    P(6, 4, 1, 4, r.hair);
    P(17, 4, 1, 3, r.hair);
    if (r.name === 'Atlas') {
      P(7, 13, 10, 3, '#1a1010');
      P(9, 13, 6, 1, r.skin);
    }
  }
  if (r.band) {
    P(6, 6, 12, 1, r.band);
    P(17, 7, 2, 3, r.band);
  }
  P(7, 8, 10, 2, r.visor);
  P(8, 8, 2, 1, '#ffffff');
  P(7, 10, 10, 1, shade(r.skin, -0.3));
  P(10, 13, 4, 1, shade(r.skin, -0.4));
  return c;
}

// ---------- block rendering (cached) ----------
const bcache = new Map();
function blockCanvas(b) {
  let c = bcache.get(b);
  if (c) {
    bcache.delete(b);
    bcache.set(b, c);
    return c;
  }
  c = renderBlock(b);
  bcache.set(b, c);
  if (bcache.size > 240) bcache.delete(bcache.keys().next().value);
  return c;
}
function renderBlock(b) {
  const W = b.w * CELL,
    H = b.h * CELL,
    c = mk(W, H),
    g = c.getContext('2d'),
    r = mulberry(b.seed ^ 0x5f3);
  const P = (x, y, w, h, cl) => {
    g.fillStyle = cl;
    g.fillRect(x, y, w, h);
  };
  P(0, 0, W, H, '#2a2438');
  g.fillStyle = '#231e30';
  for (let x = 0; x < W; x += 8) g.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 8) g.fillRect(0, y, W, 1);
  for (let i = 0; i < (W * H) / 40; i++) P((r() * W) | 0, (r() * H) | 0, 1, 1, r() < 0.5 ? '#352d48' : '#1d1829');
  P(0, 0, W, 1, '#51476a');
  P(0, H - 1, W, 1, '#51476a');
  P(0, 0, 1, H, '#51476a');
  P(W - 1, 0, 1, H, '#51476a');
  for (let i = 0; i < (W * H) / 500; i++) {
    const x = (r() * W) | 0,
      y = (r() * H) | 0;
    const cl = pickR(r, ['#2f6b3a', '#3d8a45', '#24502c']);
    P(x, y, 1, 1, cl);
    P(x + 1, y - 1, 1, 1, cl);
  }
  for (let i = 0; i < (W * H) / 1400; i++) {
    P((r() * W) | 0, (r() * H) | 0, 2, 1, pickR(r, ['#4a4a55', '#5c3d2e', '#3a3a7a']));
  }
  const ix = CELL,
    iy = CELL,
    iw = W - 2 * CELL,
    ih = H - 2 * CELL;
  if (b.type === 'park') drawPark(g, r, ix, iy, iw, ih);
  else if (b.type === 'garage') drawGarage(g, r, ix, iy, iw, ih, b);
  else
    for (const L of b.lots) {
      if (L.flat) drawLot(g, L, b);
      else drawLotBase(g, L, b);
    }
  if (b.shop && b.shop.L.flat) drawShopFront(g, b.shop, b);
  return c;
}
function drawLot(g, L, b) {
  const r = mulberry(L.seed);
  const P = (x, y, w, h, cl) => {
    g.fillStyle = cl;
    g.fillRect(x, y, w, h);
  };
  const lx = (L.x - b.x) * CELL + 1,
    ly = (L.y - b.y) * CELL + 1,
    lw = L.w * CELL - 2,
    lh = L.h * CELL - 2,
    H = 0,
    roof = L.roof;
  P(lx + lw - H, ly, H, lh, shade(roof, -0.5));
  P(lx, ly + lh - H, lw, H, shade(roof, -0.65));
  const wc = ['#ffd27a', '#7af0ff', '#ff7ad9', '#b6ff7a'];
  if (H >= 3) {
    for (let x = lx + 2; x < lx + lw - H - 1; x += 3) if (r() < 0.4) P(x, ly + lh - H + 1, 1, H - 2, pickR(r, wc));
    for (let y = ly + 2; y < ly + lh - H - 1; y += 3) if (r() < 0.4) P(lx + lw - H + 1, y, H - 2, 1, pickR(r, wc));
  }
  const rx = lx,
    ry = ly,
    rw = lw - H,
    rh = lh - H;
  P(rx, ry, rw, rh, roof);
  P(rx, ry, rw, 1, shade(roof, 0.22));
  P(rx, ry, 1, rh, shade(roof, 0.22));
  P(rx, ry + rh - 1, rw, 1, shade(roof, -0.25));
  P(rx + rw - 1, ry, 1, rh, shade(roof, -0.25));
  const pp = shade(roof, -0.15);
  P(rx + 2, ry + 2, rw - 4, 1, pp);
  P(rx + 2, ry + rh - 3, rw - 4, 1, pp);
  P(rx + 2, ry + 2, 1, rh - 4, pp);
  P(rx + rw - 3, ry + 2, 1, rh - 4, pp);
  for (let i = 0; i < (rw * rh) / 30; i++)
    P(
      (rx + 3 + r() * (rw - 6)) | 0,
      (ry + 3 + r() * (rh - 6)) | 0,
      1,
      1,
      r() < 0.5 ? shade(roof, -0.12) : shade(roof, 0.08),
    );
  const ax = rx + 4,
    ay = ry + 4,
    aw = rw - 8,
    ah = rh - 8;
  if (aw < 8 || ah < 8) return;
  if (aw > 56 && ah > 56 && r() < 0.2) {
    const cx = (ax + aw / 2) | 0,
      cy = (ay + ah / 2) | 0;
    pc(g, cx, cy, 14, '#34323f');
    pc(g, cx, cy, 12, '#2a2833');
    P(cx - 5, cy - 6, 2, 12, '#e6e6e6');
    P(cx + 3, cy - 6, 2, 12, '#e6e6e6');
    P(cx - 3, cy - 1, 6, 2, '#e6e6e6');
    for (let a = 0; a < 16; a++)
      P(
        Math.round(cx + Math.cos((a / 16) * 6.283) * 13),
        Math.round(cy + Math.sin((a / 16) * 6.283) * 13),
        1,
        1,
        '#ffe03c',
      );
    return;
  }
  if (r() < 0.55) {
    const pw = 7,
      ph = 4;
    const cols = Math.max(1, Math.floor((aw * (0.4 + r() * 0.55)) / (pw + 1))),
      rows = Math.max(1, Math.floor((ah * (0.3 + r() * 0.45)) / (ph + 1)));
    const sx = ax + (r() < 0.5 ? 0 : Math.max(0, aw - cols * (pw + 1)));
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const px = sx + i * (pw + 1),
          py = ay + j * (ph + 1);
        P(px, py, pw, ph, '#1a2550');
        P(px, py, pw, 1, '#34529e');
        P(px + 3, py, 1, ph, '#26397a');
        if (r() < 0.12) P(px + 1, py + 1, 1, 1, '#a9c8ff');
      }
  }
  const nac = Math.floor(r() * 4);
  for (let i = 0; i < nac; i++) {
    const x = ax + ((r() * (aw - 6)) | 0),
      y = ay + ah / 2 + ((r() * (ah / 2 - 5)) | 0);
    P(x, y, 6, 5, '#5d5d6e');
    P(x, y, 6, 1, '#7c7c90');
    P(x + 2, y + 2, 2, 2, '#25252e');
    P(x + 5, y + 1, 1, 4, '#46464f');
  }
  if (r() < 0.28) {
    const w = Math.min(aw - 2, 6 + ((r() * 12) | 0)),
      h = Math.min(ah - 2, 5 + ((r() * 9) | 0));
    const x = ax + ((r() * (aw - w)) | 0),
      y = ay + ((r() * (ah - h)) | 0);
    P(x, y, w, h, '#24452c');
    for (let i = 0; i < (w * h) / 3; i++)
      P(x + ((r() * w) | 0), y + ((r() * h) | 0), 1, 1, pickR(r, ['#3f8a4a', '#5fb35a', '#2f6b3a', '#ff7ad9']));
  }
  if (r() < 0.16) {
    const x = ax + 4 + ((r() * (aw - 8)) | 0),
      y = ay + 4 + ((r() * (ah - 8)) | 0);
    pc(g, x, y, 4, '#3b2a20');
    pc(g, x, y, 3, '#6b4a32');
    P(x - 1, y - 1, 1, 1, '#8a6a4a');
  }
  if (r() < 0.3) {
    const x = ax + ((r() * aw) | 0),
      y = ay + ((r() * ah) | 0);
    P(x, y, 1, 5, '#80808c');
    P(x, y, 1, 1, '#ff3355');
  }
  if (r() < 0.3) {
    for (let i = 0; i < rh; i++)
      if (r() < 0.5) P(rx + (r() < 0.5 ? 0 : 1), ry + i, 1, 1, pickR(r, ['#2f6b3a', '#3d8a45']));
  }
}
function drawPark(g, r, ix, iy, iw, ih) {
  const P = (x, y, w, h, cl) => {
    g.fillStyle = cl;
    g.fillRect(x, y, w, h);
  };
  P(ix, iy, iw, ih, '#1c3a26');
  for (let i = 0; i < (iw * ih) / 6; i++)
    P(ix + ((r() * iw) | 0), iy + ((r() * ih) | 0), 1, 1, pickR(r, ['#234a2f', '#163020', '#2a5636']));
  for (let i = 0; i < (iw * ih) / 250; i++)
    P(ix + ((r() * iw) | 0), iy + ((r() * ih) | 0), 1, 1, pickR(r, ['#ff7ad9', '#ffe03c', '#ffffff']));
  const cx = (ix + iw / 2) | 0,
    cy = (iy + ih / 2) | 0;
  P(ix, cy - 3, iw, 6, '#3a3226');
  P(cx - 3, iy, 6, ih, '#3a3226');
  for (let x = ix; x < ix + iw; x += 3) P(x, cy - 3, 1, 1, '#4a4030');
  pc(g, cx, cy, 8, '#2c2836');
  pc(g, cx, cy, 6, '#1d4f7a');
  pc(g, cx, cy, 2, '#7fd0ff');
  const n = Math.floor((iw * ih) / 600) + 3;
  for (let i = 0; i < n; i++) {
    const rad = 4 + ((r() * 5) | 0);
    const tx = ix + rad + 2 + ((r() * (iw - 2 * rad - 4)) | 0),
      ty = iy + rad + 2 + ((r() * (ih - 2 * rad - 4)) | 0);
    if (Math.abs(tx - cx) < rad + 5 || Math.abs(ty - cy) < rad + 5) continue;
    pc(g, tx + 2, ty + 2, rad, 'rgba(0,0,0,.35)');
    pc(g, tx, ty, rad, '#163a22');
    pc(g, tx - 1, ty - 1, rad - 2, '#22553a');
    for (let k = 0; k < rad * 2; k++)
      P(tx - rad + ((r() * rad * 2) | 0), ty - rad + ((r() * rad * 2) | 0), 1, 1, '#3c8a52');
  }
  P(cx + 10, cy - 8, 8, 3, '#5a3d22');
  P(cx - 18, cy + 5, 8, 3, '#5a3d22');
}
function drawGarage(g, r, ix, iy, iw, ih, b) {
  const P = (x, y, w, h, cl) => {
    g.fillStyle = cl;
    g.fillRect(x, y, w, h);
  };
  P(ix, iy, iw, ih, '#1a2024');
  g.fillStyle = '#20282d';
  for (let x = ix; x < ix + iw; x += 16) g.fillRect(x, iy, 1, ih);
  for (let y = iy; y < iy + ih; y += 16) g.fillRect(ix, y, iw, 1);
  for (let i = 0; i < 6; i++) pc(g, ix + ((r() * iw) | 0), iy + ((r() * ih) | 0), 2 + ((r() * 3) | 0), '#121619');
  for (let x = ix; x < ix + iw; x += 6) {
    P(x, iy, 3, 2, '#e0c020');
    P(x, iy + ih - 2, 3, 2, '#e0c020');
  }
  for (let y = iy; y < iy + ih; y += 6) {
    P(ix, y, 2, 3, '#e0c020');
    P(ix + iw - 2, y, 2, 3, '#e0c020');
  }
  const ox = b.x * CELL,
    oy = b.y * CELL;
  for (const bay of garage.bays) {
    const x = bay.x - ox,
      y = bay.y - oy;
    g.fillStyle = '#2ab8c8';
    g.fillRect(x - 8, y - 13, 16, 1);
    g.fillRect(x - 8, y + 13, 16, 1);
    g.fillRect(x - 8, y - 13, 1, 27);
    g.fillRect(x + 7, y - 13, 1, 27);
    P(x - 3, y - 17, 6, 3, '#2e3a40');
    P(x - 1, y - 16, 2, 1, '#5cff7a');
    for (let k = 0; k < 3; k++) P(x - 6 + k * 5, y - 22, 4, 3, '#1a2550');
  }
  const t = 'NYX',
    sc = 3,
    tw = t.length * 6 * sc - sc;
  const tx = (ix + (iw - tw) / 2) | 0,
    ty = iy + ((ih * 0.525) | 0) - (ih >= 140 ? 14 : 10);
  glyphs(g, t, tx + 2, ty + 2, sc, '#3a0b3d');
  glyphs(g, t, tx, ty, sc, '#ff3df2');
  if (ih >= 140) {
    const t2 = 'RIMESSA',
      tw2 = t2.length * 6 - 1;
    glyphs(g, t2, (ix + (iw - tw2) / 2) | 0, ty + 24, 1, '#3cf2ff');
  }
}

// ---------- edifici: base a terra (nel blocco) + tetto separato (disegnato in pseudo-3D) ----------
function drawLotBase(g, L, b) {
  const lx = (L.x - b.x) * CELL + 1,
    ly = (L.y - b.y) * CELL + 1,
    lw = L.w * CELL - 2,
    lh = L.h * CELL - 2;
  g.fillStyle = 'rgba(0,0,0,.45)';
  g.fillRect(lx + 3, ly + 3, lw, lh);
  g.fillStyle = shade(L.roof, -0.62);
  g.fillRect(lx, ly, lw, lh);
}
const roofCache = new Map();
function lotRoof(L, b) {
  let c = roofCache.get(L);
  if (c) {
    roofCache.delete(L);
    roofCache.set(L, c);
    return c;
  }
  const lx = (L.x - b.x) * CELL + 1,
    ly = (L.y - b.y) * CELL + 1,
    lw = L.w * CELL - 2,
    lh = L.h * CELL - 2;
  c = mk(lw, lh);
  const g = c.getContext('2d');
  g.translate(-lx, -ly);
  drawLot(g, L, b);
  if (b.shop && b.shop.L === L) drawShopFront(g, b.shop, b);
  // finestre illuminate lungo le pareti: colori pre-scelti per lotto
  const r = mulberry(L.seed ^ 0x9e37);
  L.win = [];
  for (let i = 0; i < 24; i++)
    L.win.push(r() < 0.42 ? pickR(r, ['#ffd27a', '#7af0ff', '#ff7ad9', '#b6ff7a', '#ffe9a8']) : null);
  roofCache.set(L, c);
  if (roofCache.size > 700) roofCache.delete(roofCache.keys().next().value);
  return c;
}

// ---------- rotazioni pre-calcolate (32 angoli, campionamento nearest centrato) ----------
// evita i pixel che "ballano" ruotando sprite minuscole a runtime
const ROT_N = 32,
  rotCache = new WeakMap();
function rotSet(src) {
  let rs = rotCache.get(src);
  if (rs) return rs;
  const w = src.width,
    h = src.height,
    S = Math.ceil(Math.hypot(w, h)) + 2 + ((Math.ceil(Math.hypot(w, h)) + 2) % 2);
  const sd = src.getContext('2d').getImageData(0, 0, w, h).data;
  rs = { S, f: [], sh: [] };
  for (let k = 0; k < ROT_N; k++) {
    const a = (k / ROT_N) * Math.PI * 2,
      ca = Math.cos(a),
      sa = Math.sin(a);
    const c = mk(S, S),
      g = c.getContext('2d'),
      id = g.createImageData(S, S),
      d = id.data;
    const s2 = mk(S, S),
      g2 = s2.getContext('2d'),
      id2 = g2.createImageData(S, S),
      d2 = id2.data;
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const dx = x + 0.5 - S / 2,
          dy = y + 0.5 - S / 2;
        const sx = Math.floor(dx * ca + dy * sa + w / 2),
          sy = Math.floor(-dx * sa + dy * ca + h / 2);
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
        const si = (sy * w + sx) * 4,
          o = (y * S + x) * 4;
        if (sd[si + 3] < 10) continue;
        d[o] = sd[si];
        d[o + 1] = sd[si + 1];
        d[o + 2] = sd[si + 2];
        d[o + 3] = sd[si + 3];
        d2[o + 3] = 255;
      }
    g.putImageData(id, 0, 0);
    g2.putImageData(id2, 0, 0);
    rs.f.push(c);
    rs.sh.push(s2);
  }
  rotCache.set(src, rs);
  return rs;
}
const rotIdx = a => ((Math.round((a / (Math.PI * 2)) * ROT_N) % ROT_N) + ROT_N) % ROT_N;
