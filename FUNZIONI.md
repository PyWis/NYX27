# New York Xeno (NYX): tutte le funzioni del gioco

Guida completa alle regole e alle meccaniche. I valori sono quelli del codice (`js/`).

---

## 1. Obiettivo e fine partita

La notte parte alle **18:00** e scorre solo mentre giochi: 1 minuto di gioco = 1 minuto di notte.
L'alba arriva alle **06:00**, cioè dopo 12 ore di gioco.

**Vittoria**
- Alle 06:00 o dopo, in città non resta nessuno Xeno.
- Gli Xeno restano sotto quota 3 per 30 minuti di fila.

**Sconfitta**
- Tutti i biker sono morti.
- Alle 06:15 ci sono ancora Xeno in città.
- Gli Xeno arrivano a quota 20 e in 1 minuto non riesci ad abbatterne uno.
- Lo Xeno Gold abbatte tutti gli edifici unici (la chiesa è l'ultima).

Mentre Nyx è attiva non si va in game over per il tempo (il conto dei 20 Xeno si ferma a 1 secondo).

---

## 2. Comandi

Tutti i tasti si rimappano da **Opzioni → Rimappa i tasti** (due tasti per azione).

| Azione | Tastiera | Gamepad Xbox | Gamepad PlayStation |
|---|---|---|---|
| Accelera / frena | ↑ ↓ oppure W S | RT / LT (analogici) | R2 / L2 |
| Sterza / cammina | ← → oppure A D | Stick sinistro | Stick sinistro |
| Attacco / pugno | Spazio | A | ✕ |
| Scendi / sali | Z | B | ○ |
| Interagisci | E | X | □ |
| Nitro | X | Y | △ |
| Cambia arma | Q | LB | L1 |
| Cambia biker | Tab | RB | R1 |
| **Cambia biker e fai rientrare quello lasciato** | **Shift + Tab** | **L3** | **L3** |
| Usa farmaco | F | Croce ↑ | Croce ↑ |
| Consegna farmaci alla rimessa | C | Croce ↓ | Croce ↓ |
| Radar | V | Croce ← | Croce ← |
| Richiama in rimessa (leader) | R | Croce → | Croce → |
| Mappa | G | Select | Share |
| Pausa | P o Esc | Start | Options |
| Opzioni | O | Select dalla pausa | Share dalla pausa |
| Schermo intero | B o doppio clic | — | — |
| Musica on/off | M | — | — |
| Audio on/off | N | — | — |

I suggerimenti a schermo mostrano i tasti del dispositivo che stai usando (tastiera, Xbox o PlayStation).

---

## 3. I biker

Si parte scegliendo un biker. Gli altri aspettano in rimessa e prendono il comando quando cambi biker.

| Biker | Moto | Arma | Pugni | Particolarità |
|---|---|---|---|---|
| **Zephyr** (leader) | rossa | Pistola: 10 danni, ricarica 0,6 s, lunga gittata | 2 | Può richiamare tutti dalla rimessa; centro alieni |
| **Atlas** | verde | Doppia spada: 3 danni, raggio 26, ricarica 0,3 s | 2 | — |
| **Caspian** | bianca | nessuna | 3 | Moto **x2**; notte veloce (vedi §10) |
| **Vesper** (leader) | blu | Pistola rapida: 8 danni, ricarica 0,3 s, gittata corta | 2 | Può richiamare tutti; centro alieni; matrimonio |
| **Indigo** | nera e viola | Frusta: 4 danni, raggio 44, ricarica 0,5 s | 2 | — |
| **Nova** | rosa | nessuna | 1 | Diventa **Nyx** in chiesa; **tregua** al centro alieni |
| **Akira** | arancione | Spada laser: colpo mortale, raggio 36, carica 1 s | 2 | **Radar avanzato** al centro NASA |
| **Melanie** | gialla | nessuna | 2 | Scudo laser, moto x1,5, rapina furtiva, **RAPINALI TUTTI!** |

**Spada laser (Akira):** tieni premuto l'attacco. La moto frena fino a fermarsi e la lama carica per 1 secondo,
poi colpisce a morte tutto quello che ha intorno (Xeno e agenti).

**Scudo laser (Melanie):** finché è in sella ogni colpo le toglie solo 1 di vita.
**Rapina furtiva:** 70% di probabilità che la rapina non abbia conseguenze.

---

## 4. Guida, batteria e vita

- **Batteria solare:** 3:00 di autonomia. Si scarica solo quando la moto si muove.
- **Ricarica da fermo:** +10 secondi ogni 30 secondi fermo in strada, ogni 15 secondi in rimessa (x2).
- Con la batteria a zero la moto non accelera: fermati al sole o scendi a piedi.
- **A piedi:** si cammina e si tira di pugni. Per risalire devi tornare vicino alla moto.
- **Vita:** 100 di base (si alza fino a 250 con le donazioni in ospedale). In rimessa si recuperano +2 di vita al minuto.

### Biker non attivi
- Un biker lasciato in strada resta **fermo** da 3 a 10 minuti, poi torna da solo in rimessa se la batteria basta
  (altrimenti aspetta di ricaricarsi).
- **Shift + Tab:** cambi biker e quello lasciato parte subito verso la rimessa. Il viaggio consuma batteria:
  se finisce, si ferma a ricaricare e poi riparte.
- **Richiamo (R):** Zephyr o Vesper, dalla rimessa, richiamano tutti i biker fermi in strada.

---

## 5. Cosa succede quando un biker va a 0 di vita

| Causa | Conseguenza |
|---|---|
| Xeno | **Catturato:** hai 30 minuti per abbattere lo Xeno che lo tiene, altrimenti muore. Il 20% delle volte scappa e torna in rimessa dopo 3 minuti con 1 di vita. |
| Polizia | **Arrestato:** fuori gioco 1 ora (oppure paghi la cauzione). |
| Negoziante | **Ferito:** fuori gioco 30 minuti. |
| Nyx consumata | **Esausta:** fuori gioco 30 minuti. |

Il comando passa al biker disponibile successivo. Se non ce n'è nessuno si aspetta il primo pronto.

---

## 6. Oggetti

| Oggetto | Dove | Costo | Effetto |
|---|---|---|---|
| Farmaco | Farmacia | 100$ | +25 vita al minuto fino al pieno (max 3 a testa). Si possono consegnare alla rimessa (C), che li usa da sola sul biker più ferito. |
| Elettronitro | Meccanico | 50$ | Velocità x2 per 20 secondi (max 5). |
| Scudo NASA | Centro NASA | 500$ | Blocca le armi degli Xeno (non i pugni) per 20 minuti dal primo colpo. |
| Moto potenziata | Negozio moto | 5000$ | Velocità x1,6 per sempre (Caspian x1,2). |
| Seconda arma | Armeria | 10000$ | L'arma di un collega, si cambia con Q. |
| Obbligazione | Banca | 1000$ | +40$ al minuto per 30 minuti. |
| Radar avanzato | Centro NASA (solo Akira) | 10000$ | Per tutto il team (vedi §8). |

---

## 7. Negozi ed edifici

La città ha 5 farmacie, 5 meccanici, 20 negozi e 8 edifici unici, generati a caso a ogni partita.
Ci si interagisce con **E**.

### Negozi comuni: rapina
- Si rapina **a piedi**. Il bottino va da 30 a 120$; il 10% delle volte è un **colpo grosso** (x4).
- Dopo una rapina il negoziante ti tiene d'occhio per 20 secondi.
- Il negoziante reagisce con 10 / 20 / 30 / 40 / 60 danni, in base alla sua **rabbia** (da 0 a 5).
- Ogni rapina alza la rabbia di 1. La rabbia scende di 1 ogni 15 minuti senza rapine.
- Melanie: 70% di rapine senza nessuna conseguenza.

### Polizia
- Le pattuglie dipendono dalla rabbia dei negozi:
  - somma della rabbia sopra 2: 1 auto;
  - negozi con rabbia 3 o più: 1 auto per negozio, fino a 5;
  - almeno un negozio con rabbia 4 o più: 6 auto.
- Gli agenti scendono, sparano (5 danni) e ti arrestano se restano a contatto per 1,2 secondi mentre sei a piedi o lento.
- Abbattuti i 2 agenti puoi **rubare l'auto** (E, a piedi):
  - portata in **rimessa**: da 200 a 400$ (l'auto resta lì 15 minuti);
  - portata al **commissariato**: 30% di probabilità che la polizia catturi 10 Xeno (uno ogni 12 secondi),
    altrimenti vieni arrestato per 5 minuti.

### Edifici unici

| Edificio | Funzioni |
|---|---|
| **Chiesa** | Nessun nuovo Xeno per 10 minuti (ogni ora). Zephyr presente e poi Vesper: **matrimonio** (10000$, le loro moto vanno x1,2). Nova che ci arriva diventa **Nyx**. |
| **Commissariato** | Cauzione 1000$ per liberare un arrestato. Auto della polizia rubata (vedi sopra). **Melanie:** lista della rabbia e RAPINALI TUTTI! |
| **Centro NASA** | Scudo anti-Xeno 500$. **Akira:** solo radar avanzato 10000$. **Caspian:** notte veloce. |
| **Ospedale** | Ricovero gratis, +10 vita al minuto, un biker alla volta. 3 farmaci donati da 2 biker diversi danno +25 vita massima a tutto il team (fino a 250). |
| **Negozio moto** | Moto x1,6 (Caspian x1,2) per 5000$. |
| **Armeria** | Seconda arma per 10000$. Due biker qualsiasi tranne Zephyr e Vesper si **allenano** insieme: +2 danni ad armi e pugni. |
| **Banca** | Obbligazioni. |
| **Centro alieni** | **Zephyr/Vesper:** 25$ per ogni Xeno abbattuto dall'ultima visita; con 10 o più arriva l'**auto medica** (3 farmaci alla rimessa e ricovero del biker più ferito). **Nova:** tregua. |

Un edificio conquistato dallo Xeno Gold resta **fuori uso per 1 ora**.

### Missioni pacco
Ogni 15 minuti un negozio cerca un corriere. Prendi il pacco e consegnalo al negozio indicato entro 15 minuti:
100$, +50 se la distanza supera il 75% della mappa, altri +50 oltre il 100%.

---

## 8. Poteri speciali dei biker

### Nyx, la dea della notte (Nova in chiesa)
- Nova che arriva in chiesa (se è passata un'ora dall'ultimo uso della chiesa) diventa **Nyx**: moto x2,
  batteria infinita, -10 vita al minuto.
- Gli Xeno entro 50 metri diventano suoi **fedeli** e la seguono.
- Portala in **rimessa**: i fedeli si inginocchiano e **spariscono**, e ogni altro biker riceve +5 di vita per ogni Xeno sparito.
- Se Nyx si consuma prima di arrivare in rimessa resta fuori 30 minuti. Con Nyx attiva non si può cambiare biker.

### Tregua di Nyx (Nova al centro alieni)
- Costa **5000$**, si può usare **una volta ogni ora**.
- Per **15 minuti** nessuno attacca nessuno: gli Xeno non inseguono e i tuoi colpi non li feriscono.
  Lo **Xeno Gold non rispetta la tregua**.
- Nova torna Nova con **1 di vita**, resta vicino al centro alieni e non è giocabile. Alla fine della tregua rientra da sola.
- Durante la tregua, se gli Xeno sono **15 o più** non ne arrivano altri.

### Radar avanzato (Akira al centro NASA)
- Costa **10000$** e vale per **tutto il team**. Akira al centro NASA può comprare solo questo.
- **V** ha tre stati: **radar negozi** (farmacia, meccanico e negozio più vicini) → **radar avanzato** → **spento**.
- Il radar avanzato apre una lista da cui scegli **un solo obiettivo**:
  - i 3 Xeno più vicini e gli Xeno speciali in città;
  - la missione pacco;
  - la farmacia, il meccanico o il negozio più vicino;
  - uno qualsiasi degli edifici unici;
  - la rimessa.
- Una freccia arancione sulla bussola e sulla minimappa indica l'obiettivo, con la distanza.

### RAPINALI TUTTI! (Melanie al commissariato)
- Al commissariato Melanie vede la **lista della rabbia** di tutti i negozi e il rischio di arresto già calcolato.
- Avviata la missione, Melanie visita **da sola tutti i negozi** (sempre il più vicino) e poi torna in rimessa.
  Intanto non è giocabile.
- Al rientro:
  - **+2000$**;
  - la rabbia sale di **1** in tutti i negozi;
  - Melanie resta con **1 di vita**;
  - viene **arrestata** (1 ora) con probabilità del **20% per ogni negozio con rabbia sopra 3**: con 5 negozi o più è sicuro.

---

## 9. Gli Xeno

- Si parte con 10 Xeno. Ne arriva uno nuovo ogni minuto, fino a quota 20 (non dopo le 06:00).
- Ogni Xeno ha 25 di vita e usa l'arma del biker di cui ha il colore: pistole, spade, frusta, spada laser
  (35 danni, non mortale) oppure scende a piedi e tira pugni.
- Ti inseguono quando ti vedono da vicino. In **rimessa sei al sicuro**.

### Xeno speciali

| Xeno | Quando appare | Vita | Velocità | Comportamento |
|---|---|---|---|---|
| **Rosso** | dopo 30 minuti, 1 rinforzo su 10 | 40 | x1 | Va alla rimessa e non se ne allontana più di 200 metri. |
| **Silver** | dopo 90 minuti, 1 rinforzo su 30, oppure dalla fusione di 3 Rossi | 90 | x1,5 | Libero di girare la città. Dopo 15 minuti diventa Gold. |
| **Gold** | da uno Silver rimasto 15 minuti | 90 | x2,5 | Assedia gli edifici unici. Ignora la tregua. |

- **Fusione:** quando ci sono 3 o più Xeno Rossi vicino alla rimessa si riuniscono davanti all'ingresso e
  si fondono in uno **Xeno Silver**, che **rapisce 2 biker parcheggiati in rimessa**. Hai **10 minuti** per
  abbatterlo e liberarli, altrimenti muoiono.
- **Assedio del Gold:** punta l'edificio unico più vicino (la **chiesa sempre per ultima**). Dopo **30 minuti** di assedio
  l'edificio è **fuori uso per 1 ora** e il Gold passa al successivo. Se conquista anche la chiesa è **game over**.
  Non insegue nessuno, ma colpisce (15 danni) chi gli si avvicina.
- Sulla bussola c'è una freccia dorata verso il Gold. Gli avvisi in alto mostrano l'assedio, il tempo che manca
  al Silver per diventare Gold e il numero di Rossi diretti alla rimessa.
- Gli Xeno speciali non diventano fedeli di Nyx. La polizia non può catturare il Gold.

---

## 10. Altre regole

- **Notte veloce:** Caspian che raggiunge il centro NASA entro le 18:05 fa ripartire la partita alle 05:00.
- **Pioggia:** per metà della notte piove, con riflessi sull'asfalto bagnato.
- **Rimessa:** zona sicura, ricarica doppia, +2 vita al minuto, usa da sola i farmaci consegnati.

---

## 11. Interfaccia e opzioni

- **HUD:** ritratto, vita, batteria, carica solare, farmaci, nitro, scudo, arma.
  Barra in alto: ora, Xeno in città, prossimo rinforzo, soldi, abbattimenti, polizia, farmaci in rimessa, obbligazioni.
- **Bussola:** Xeno più vicino, rapitore, missione, Xeno Gold, radar.
- **Minimappa** e **mappa grande (G)** con negozi, edifici unici, polizia, Xeno speciali, edifici fuori uso.
- **Roster** in basso con lo stato di tutti gli 8 biker.
- **Opzioni:** volume musica ed effetti, riduci lampeggi, effetto CRT, scosse della camera, vibrazione gamepad,
  schermo intero, rimappa tasti, ripristina tasti predefiniti.
- **Salvataggio automatico** nel browser ogni 5 secondi e quando chiudi o cambi scheda.
  Dal titolo, CANC due volte cancella il salvataggio.
