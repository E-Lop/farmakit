# Feature Specs

Specifiche funzionali per le feature principali di Farmakit.

## F1 — Autenticazione

### Descrizione
Login e registrazione con email/password tramite Supabase Auth.

### Flusso
1. L'utente apre l'app → se non autenticato, redirect a `/login`
2. Può registrarsi o fare login
3. Dopo il login, viene creato automaticamente un armadietto "Casa" (default)
4. Redirect a Dashboard

### Requisiti
- Email + password (min 8 caratteri)
- Nessun social login per MVP
- Sessione persistente (refresh token)
- Logout dal menu Settings

## F2 — Gestione armadietti

### Descrizione
L'utente può creare, rinominare, eliminare armadietti e switchare tra essi.

### Flusso
1. Dashboard mostra l'armadietto attivo
2. Tap sull'header → lista armadietti
3. Può creare nuovo armadietto (nome + emoji opzionale)
4. Può rinominare/eliminare (solo owner)
5. L'armadietto attivo è salvato in `uiStore`

### Regole
- Minimo un armadietto per utente
- Non si può eliminare l'ultimo armadietto
- Eliminare un armadietto elimina tutti i farmaci contenuti (cascade)

## F3 — Aggiunta farmaco manuale

### Descrizione
L'utente aggiunge un farmaco inserendo nome, quantità, scadenza.

### Flusso
1. Tap "+" → pagina AddMedicine
2. Opzione 1: cerca nel catalogo per nome
3. Opzione 2: inserisci nome custom
4. Compila: forma farmaceutica, dosaggio, quantità, scadenza (opzionale), note (opzionale)
5. Salva → torna a Dashboard

### Validazione
- Nome o medicine_id obbligatorio
- Quantità >= 0
- Scadenza: data valida se presente
- Armadietto: selezionato automaticamente (attivo)

### Forme farmaceutiche contabili vs non contabili
Le forme farmaceutiche si dividono in **contabili** (compresse, capsule, supposte, cerotti…) e **non contabili** (sciroppo, soluzione, gocce, crema, gel, pomata, spray, collirio…).
Per le forme non contabili il conteggio unitario non ha senso pratico, quindi:
- Lo stepper quantità [-] N [+] è nascosto nella card
- Il campo quantità non appare nel drawer di dettaglio (view e edit)
- Le forme non contabili sono escluse dagli alert di scorta bassa

La logica è in `app/src/lib/pharmaceutical-forms.ts` (`isCountableForm`).

## F4 — Scansione barcode

### Descrizione
Scansione del codice a barre dalla confezione del farmaco per lookup automatico.

### Flusso
1. Tap icona scan → pagina Scan
2. Apre fotocamera con @zxing
3. Scansiona barcode (EAN-13/EAN-8)
4. Lookup nel catalogo (prima locale/IndexedDB, poi server)
5. Se trovato → pre-compila form AddMedicine
6. Se non trovato → opzione di aggiungere con nome custom + contribuzione community

### Requisiti tecnici
- getUserMedia con facingMode "environment"
- Supporto EAN-13, EAN-8, Code128
- Fallback: input manuale barcode
- Timeout scan: 30 secondi, poi suggerimento input manuale

## F5 — Dashboard

### Descrizione
Vista principale con lista farmaci dell'armadietto attivo.

### Layout
- Header: nome armadietto (tap per switchare) + icona settings
- Lista farmaci ordinata per scadenza (prossimi in cima)
- Badges: "In scadenza" (< 30gg), "Scaduto" (rosso), "Scorta bassa" (quantità ≤ 5, solo forme contabili)
- FAB: bottone scan + bottone aggiungi manuale
- Bottom navigation: Dashboard, Scan, Armadietti, Settings

### Filtri/ordinamento
- Default: per scadenza (ASC)
- Filtro: tutti / in scadenza / scaduti
- Ricerca per nome

## F6 — Condivisione armadietti

### Descrizione
L'owner di un armadietto può invitare altri utenti come editor.

### Flusso
1. Settings armadietto → "Condividi"
2. Inserisci email dell'utente da invitare
3. Se l'utente esiste → aggiunto come editor
4. Se non esiste → invito via email (futuro)
5. L'editor vede l'armadietto nella sua lista e può gestire i farmaci

### Regole
- Solo owner può invitare/rimuovere
- Editor può: aggiungere, modificare, rimuovere farmaci
- Editor non può: rinominare armadietto, invitare altri, eliminare armadietto
- Owner non può essere rimosso

## F7 — Notifiche scadenza

### Descrizione
Avviso per farmaci in scadenza entro N giorni (default 30).

### Implementazione
- In-app: badge nella Dashboard + banner
- Push: Edge Function schedulata (pg_cron o esterno)
- Ogni farmaco ha `notify_before_days` personalizzabile

## F8 — Contribuzioni community

### Descrizione
Gli utenti possono arricchire il catalogo contribuendo dati mancanti.

### Tipi
1. **Nuovo farmaco** — farmaco non nel catalogo AIFA
2. **Barcode** — associare barcode a farmaco esistente
3. **Correzione** — segnalare errori nei dati

### Flusso
- L'utente compila un form
- La contribuzione viene salvata come `pending`
- In futuro: moderazione e approvazione
