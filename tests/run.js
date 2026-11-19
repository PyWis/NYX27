// Test automatico di NYX: apre il gioco in Chromium (Playwright) e verifica
// modalita' classica/veloce, tutorial, salvataggio e build del file unico.
// Uso: node tests/run.js   (oppure npm test)
const path = require('path'),
  fs = require('fs');
const { chromium } = require('playwright');
const { bundle } = require('../tools/build.js');
const root = path.join(__dirname, '..');
let fails = 0,
  passes = 0;
function ok(cond, name, extra) {
  if (cond) {
    passes++;
    console.log('  ok   ' + name);
  } else {
    fails++;
    console.log('  FAIL ' + name + (extra !== undefined ? ' -> ' + JSON.stringify(extra) : ''));
  }
}
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('build');
  ok(
    fs.readFileSync(path.join(root, 'NYX.html'), 'utf8') === bundle(),
    'NYX.html e allineato a js/ (node tools/build.js)',
  );

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  const target = process.argv.includes('--modules') ? 'index.html' : 'NYX.html';
  await page.goto('file://' + path.join(root, target));
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await wait(800);
  const ev = (f, a) => page.evaluate(f, a);
  // simula n secondi di gioco a timestep fisso, senza aspettare il tempo reale
  const sim = secs =>
    ev(s => {
      for (let i = 0; i < s * 120 && (state === 'play' || state === 'wait'); i++) update(STEP);
    }, secs);
  const press = async k => {
    await page.keyboard.press(k);
    await wait(120);
  };

  console.log('titolo e scelta modalita');
  ok((await ev(() => state)) === 'title', 'si parte dal titolo');
  await press('Enter');
  ok(await ev(() => !!modeMenu), 'INVIO sul biker apre la scelta della modalita');
  await press('Escape');
  ok(await ev(() => !modeMenu && state === 'title'), 'ESC torna alla scelta del biker');

  // conta i rinforzi sostituendo spawnXeno
  const countSpawns = () =>
    ev(() => {
      window.__sp = 0;
      const o = (window.__spawn0 = window.__spawn0 || spawnXeno);
      window.spawnXeno = function () {
        __sp++;
        return o.apply(this, arguments);
      };
    });

  console.log('modalita classica');
  await press('Enter');
  await press('Enter'); // 1. CLASSICA
  ok(await ev(() => state === 'play' && meta.mode === 'classic' && meta.clk === 1), 'partita classica avviata');
  ok((await ev(() => enemies.length)) === 10, 'si parte con 10 Xeno');
  await countSpawns();
  await sim(125);
  let r = await ev(() => ({ g: meta.gameT, sp: __sp }));
  ok(Math.abs(r.g - 125) < 0.5, 'classica: 125 s di gioco = 125 s di notte', r);
  ok(r.sp === 2, 'classica: un rinforzo al minuto', r);

  console.log('modalita veloce');
  await ev(() => {
    newGame(0, 'fast');
    resetWeather();
  });
  await countSpawns();
  await sim(125);
  r = await ev(() => ({ g: meta.gameT, sp: __sp, rt: meta.realT, h: hhmm(meta.gameT) }));
  ok(Math.abs(r.g - 500) < 1, 'veloce: 125 s di gioco = 500 s di notte (x4)', r);
  ok(r.sp === 2, 'veloce: i rinforzi restano uno al minuto di gioco', r);
  await ev(() => saveGame());
  r = await ev(() => readSave().meta);
  ok(r.mode === 'fast' && r.clk === 4, 'veloce: la modalita resta nel salvataggio', r);
  await ev(() => {
    state = 'title';
    saved = readSave();
    loadGame(saved);
  });
  ok(
    await ev(() => meta.clk === 4 && Math.abs(meta.gameT - 500) < 1),
    'veloce: dopo il caricamento orologio ancora x4',
  );
  // fine della notte: 12 ore di notte in 3 ore di gioco
  await ev(() => {
    meta.gameT = 12 * 3600 - 8;
    enemies.length = 0;
    respawnT = 999;
  });
  await sim(3);
  r = await ev(() => ({ s: state, e: meta.ended }));
  ok(r.s === 'end' && r.e && r.e.win, "veloce: l'alba arriva e si vince senza Xeno", r);

  console.log('veloce: attese, Nova, termine 07:00');
  r = await ev(() => {
    newGame(5, 'fast');
    resetWeather();
    return { a: active, s: team[5].status };
  });
  ok(r.a === 5 && r.s === 'active', 'veloce: Nova si puo scegliere', r);
  const novaOutTest = st =>
    ev(st => {
      newGame(0, 'fast');
      resetWeather();
      respawnT = 1e9;
      const n = team[NOVA];
      n.status = st;
      n.hp = 10;
      if (st === 'out') {
        n.outR = 'ARRESTATO';
        n.outT = 1e6;
      }
      if (st === 'captured') {
        n.captor = enemies[0].id;
        n.capT = 1800;
      }
      if (st === 'hosp') n.hp = -1e6; // non guarisce mai da sola
      const t0 = meta.gameT;
      for (let i = 0; i < 1790 * 120 && state === 'play'; i++) update(STEP);
      const before = n.status;
      for (let i = 0; i < 20 * 120 && state === 'play'; i++) update(STEP);
      return { before, after: n.status, hp: n.hp, h: (meta.gameT - t0) / 3600, avail: nextAvail(4) === NOVA };
    }, st);
  for (const st of ['out', 'captured', 'hosp']) {
    r = await novaOutTest(st);
    ok(r.before === st && r.after === 'garage' && r.hp >= 30, 'veloce: Nova ' + st + ' torna disponibile dopo 2 ore di orologio', r);
  }
  r = await ev(() => {
    newGame(0, 'fast');
    resetWeather();
    const n = team[NOVA];
    n.status = 'out';
    n.outR = 'ARRESTATO';
    n.outT = 1e6;
    const s = shops.find(s => s.type === 'nasa');
    const p = team[active];
    const hint = SHOP_ACT.nasa.hint(p);
    money = 1000;
    SHOP_ACT.nasa.use(p);
    const poor = n.status;
    money = 3000;
    SHOP_ACT.nasa.use(p);
    return { hint, poor, st: n.status, money };
  });
  ok(/LIBERA NOVA 2500/.test(r.hint), 'veloce: la NASA offre di liberare Nova', r);
  ok(r.poor === 'out' && r.st === 'garage' && r.money === 500, 'veloce: la NASA libera Nova per 2500$', r);
  const outTest = mode =>
    ev(m => {
      newGame(0, m);
      resetWeather();
      const b = team[1];
      b.status = 'out';
      b.outR = 'FERITO';
      b.outT = 60;
      for (let i = 0; i < 31 * 120; i++) update(STEP);
      return b.status;
    }, mode);
  ok((await outTest('fast')) === 'garage', 'veloce: 60 s fuori gioco finiscono in 30 s (attese dimezzate)');
  ok((await outTest('classic')) === 'out', 'classica: le attese restano intere');
  r = await ev(() => {
    newGame(0, 'fast');
    resetWeather();
    respawnT = 1e9;
    lowT = 0;
    meta.gameT = 12 * 3600 + 20 * 60; // 06:20, Xeno ancora in citta'
    update(STEP);
    const at620 = state;
    meta.gameT = 13 * 3600 - 1;
    for (let i = 0; i < 120; i++) update(STEP);
    return { at620, s: state, e: meta.ended };
  });
  ok(r.at620 === 'play', 'veloce: alle 06:20 la partita continua', r);
  ok(r.s === 'end' && !r.e.win && /07:00/.test(r.e.reason), 'veloce: termine per gli Xeno alle 07:00', r);

  console.log('TAB a piedi: il biker torna alla moto');
  r = await ev(() => {
    newGame(0, 'classic');
    resetWeather();
    const p = team[active];
    dismount(p);
    const n = nodes.find(n => {
      const d = dist(n.x, n.y, p.x, p.y);
      return d > 60 && d < 200 && los(n.x, n.y, p.x, p.y);
    });
    p.fx = n.x;
    p.fy = n.y;
    const bx = p.x,
      by = p.y;
    switchBiker(false);
    const st = p.status,
      still = p.x === bx && p.y === by,
      dx = Math.hypot(p.px - n.x, p.py - n.y);
    for (let i = 0; i < 2 * 120; i++) update(STEP);
    const mid = p.status,
      moved = Math.hypot(p.px - n.x, p.py - n.y);
    for (let i = 0; i < 10 * 120; i++) update(STEP);
    return { st, still, dx, mid, moved, end: p.status, onFoot: p.onFoot };
  });
  ok(r.st === 'fetch' && r.still && r.dx < 1, 'TAB a piedi: il biker resta dove era e va verso la moto', r);
  ok(r.mid === 'fetch' && r.moved > 20, 'TAB a piedi: cammina verso la moto', r);
  ok(['garage', 'idle'].includes(r.end) && !r.onFoot, 'TAB a piedi: arrivato, ha recuperato la moto', r);

  console.log('rivincita x2');
  r = await ev(() => readReplay());
  ok(r && r.mode === 'fast' && r.seed != null, 'dopo una vittoria la rivincita e disponibile', r);
  ok((await ev(() => modeList().length)) === 4, 'il menu modalita mostra RIVINCITA X2');
  r = await ev(() => {
    const rp = readReplay();
    newGame(0, rp.mode, { seed: rp.seed, xhp: 2 });
    resetWeather();
    return { seedOk: meta.seed === rp.seed, hp: enemies.map(e => e.hp), x: meta.xhp };
  });
  ok(r.seedOk && r.x === 2 && r.hp.every(h => h === 50), 'rivincita: stessa citta e Xeno con vita x2', r);
  r = await ev(() => {
    meta.gameT = 12 * 3600 - 2;
    enemies.length = 0;
    respawnT = 999;
    const at0 = readReplay().at;
    for (let i = 0; i < 4 * 120; i++) update(STEP);
    return { s: state, same: readReplay().at === at0 };
  });
  ok(r.s === 'end' && r.same, 'vincere la rivincita non rinnova i 7 giorni', r);
  r = await ev(() => {
    const rp = readReplay();
    rp.at = Date.now() - 8 * 24 * 3600 * 1000;
    writeReplay(rp);
    return { r: readReplay(), n: modeList().length };
  });
  ok(r.r === null && r.n === 3, 'dopo 7 giorni la rivincita scade', r);

  console.log('tutorial');
  await ev(() => {
    delSave();
    saved = null;
    state = 'title';
    sel = 0;
  });
  await press('Enter');
  await press('ArrowDown');
  await press('ArrowDown');
  await press('Enter'); // 3. TUTORIAL
  ok(await ev(() => state === 'play' && !!meta.tut && enemies.length === 0), 'tutorial avviato senza Xeno');
  const step = () => ev(() => meta.tut.step);
  // 1 guida
  await ev(() => {
    const p = team[active];
    const n = nodes.find(n => dist(n.x, n.y, p.x, p.y) > 300);
    p.x = n.x;
    p.y = n.y;
  });
  await sim(0.1);
  ok((await step()) === 1, 'passo 1: guida');
  // 2 mappa
  await press('g');
  await press('g');
  await sim(0.1);
  ok((await step()) === 2, 'passo 2: mappa (G)');
  // 3 radar
  await press('v');
  await sim(0.1);
  ok((await step()) === 3, 'passo 3: radar (V)');
  // 4 Xeno
  ok((await ev(() => enemies.length)) === 1, 'passo 4: compare uno Xeno');
  await ev(() => damageEnemy(enemies[0], 999));
  await sim(0.1);
  ok((await step()) === 4, 'passo 4: Xeno abbattuto');
  // 5-6 scendi e risali
  await press('z');
  await sim(0.2);
  ok((await step()) === 5, 'passo 5: scendi (Z)');
  await press('z');
  await sim(0.2);
  ok((await step()) === 6, 'passo 6: risali (Z)');
  // 7 farmacia
  ok((await ev(() => money)) >= 100, 'passo 7: 100$ regalati');
  await ev(() => {
    team[active].meds = 1;
    money -= 100;
  });
  await sim(0.1);
  ok((await step()) === 7, 'passo 7: farmaco comprato');
  // 8 usa farmaco
  await press('f');
  await sim(0.1);
  ok((await step()) === 8, 'passo 8: farmaco usato (F)');
  // 9 rimessa
  await ev(() => {
    const p = team[active];
    p.x = garage.cx;
    p.y = garage.cy;
    p.v = 0;
  });
  await sim(0.1);
  ok((await step()) === 9, 'passo 9: in rimessa');
  // 10 cambia biker
  await press('Tab');
  await sim(0.1);
  ok((await step()) === 10, 'passo 10: cambia biker (TAB)');
  await sim(4);
  r = await ev(() => ({ s: state, e: meta.ended }));
  ok(r.s === 'end' && r.e && /TUTORIAL/.test(r.e.reason), 'tutorial completato', r);
  ok((await ev(() => readSave())) === null, 'il tutorial non scrive il salvataggio');
  // nel tutorial l'orologio e' fermo
  ok((await ev(() => meta.gameT)) === 0, "nel tutorial l'orologio resta alle 18:00");

  console.log('stabilita');
  await ev(() => {
    newGame(4, 'classic');
    resetWeather();
  });
  await sim(300);
  ok(await ev(() => ['play', 'wait', 'end'].includes(state)), '5 minuti di simulazione senza blocchi');
  ok(errors.length === 0, 'nessun errore JavaScript in console', errors);

  await browser.close();
  console.log('\n' + passes + ' superati, ' + fails + ' falliti');
  process.exit(fails ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
