# Agenda A4 Appuntamenti

Applicazione web offline-ready per generare, personalizzare e stampare un'**agenda settimanale in formato A4 verticale** dedicata agli appuntamenti dal **lunedì al sabato**.

**Demo online (GitHub Pages):** https://infomichelerosati.github.io/agenda-a4/

## Caratteristiche principali

- **Giorni lavorativi Lunedì – Sabato** con griglia oraria **07:30 – 20:00** ogni **15 minuti** (`51` riquadri configurabili anche a 30/60 min o altri orari).
- **Modalità Fronte/Retro**:
  - **Fronte/Retro diretto**: 1 foglio per settimana (Fronte: Lunedì, Martedì, Mercoledì · Retro: Giovedì, Venerdì, Sabato).
  - **Apertura a Libro**: include Copertina iniziale e pagina Note finali, mostrando tutti e 6 i giorni affiancati ad agenda aperta.
  - **Margini specchiati per rilegatura** (`15 mm` spirale/anelli, `20 mm` raccoglitore, `9 mm` simmetrico).
- **Periodo impostabile**: pulsanti rapidi (settimana corrente, 4 settimane, mese, trimestre, semestre, anno) o intervallo personalizzato con allineamento automatico alle settimane Lun–Sab.
- **Esportazione PDF vettoriale (`A4`)** generata interamente nel browser e **stampa diretta**.
- **Dettagli utili**: festività nazionali italiane (compreso Lunedì dell'Angelo), numero settimana ISO, 4 temi colore ottimizzati per la stampa (incluso `Grafite B/N`), fascia note opzionale.

## Verifica locale

```bash
node tests/verify.mjs
```
