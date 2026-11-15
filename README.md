# New York Xeno (NYX)

Brawler top-down in moto, post-cyberpunk, stile anni '90. Resisti dalle 18:00 alle 06:00.

## Come giocare

- **File unico:** apri `NYX.html` nel browser (funziona offline, basta un doppio clic).
- **Versione a moduli:** apri `index.html` (carica i file in `js/`).

Il salvataggio e le impostazioni restano nel browser.

## Comandi

| Azione | Tastiera (predefinito) | Gamepad (Xbox / PlayStation) |
|---|---|---|
| Accelera / frena | ↑ ↓ oppure W S | RT / LT (R2 / L2), analogici |
| Sterza / cammina | ← → oppure A D | Stick sinistro |
| Attacco / pugno | Spazio | A (✕) |
| Scendi / sali | Z | B (○) |
| Interagisci | E | X (□) |
| Nitro | X | Y (△) |
| Cambia arma / cambia biker | Q / Tab | LB / RB (L1 / R1) |
| Farmaco / consegna farmaci | F / C | Croce ↑ / ↓ |
| Radar negozi / richiama | V / R | Croce ← / → |
| Mappa | G | Select (Share) |
| Pausa | P o Esc | Start (Options) |
| Opzioni e rimappatura | O | Select dalla pausa |
| Schermo intero | B o doppio clic | — |

Tutti i tasti si rimappano da **Opzioni → Rimappa i tasti** (due tasti per azione).
Nelle opzioni ci sono anche volumi, "riduci lampeggi", effetto CRT, scosse della camera e vibrazione.

## Biker

Zephyr, Atlas, Caspian, Vesper, Indigo, Nova e due nuovi:

- **Akira** (moto arancione): spada laser. Tieni premuto l'attacco, la moto si ferma,
  carica per 1 secondo e colpisce tutto intorno con un colpo mortale.
- **Melanie** (moto gialla): nessuna arma. Scudo laser (in moto ogni colpo toglie 1 di vita),
  moto x1.5, rapina furtiva: 70% di possibilità che non ci siano conseguenze.

In armeria due biker qualsiasi, tranne i leader Zephyr e Vesper, possono allenarsi insieme:
+2 danni ad armi e pugni.

## Struttura del codice

| File | Contenuto |
|---|---|
| `js/core.js` | costanti, utilità, font bitmap, testo, icone |
| `js/data.js` | roster dei biker, tipi di negozio |
| `js/city.js` | generazione della città, collisioni, percorsi |
| `js/art.js` | texture, sprite, edifici, rotazioni pre-calcolate |
| `js/audio.js` | effetti, musica, pioggia, volumi |
| `js/input.js` | tastiera rimappabile, gamepad, impostazioni |
| `js/game.js` | stato, salvataggio, squadra, negozi (tabella dati), aggiornamento |
| `js/ai.js` | Xeno e polizia |
| `js/render.js` | mondo, edifici 3D, luci notturne, meteo, segni a terra |
| `js/hud.js` | HUD, menu, titolo, opzioni |
| `js/main.js` | loop a timestep fisso |

Dopo una modifica ai file in `js/` rigenera il file unico:

```bash
node tools/build.js
```
