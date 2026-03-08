# Strategia Local-First / Offline

## Principio

L'app deve funzionare completamente offline per le operazioni di lettura e scrittura sull'inventario personale. La sincronizzazione con Supabase avviene quando la connessione è disponibile.

## Architettura offline

```
┌──────────────────────────────────────────────┐
│                  App Layer                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │  React   │  │  React   │  │  Zustand    │ │
│  │  Query   │  │  Query   │  │  syncStore  │ │
│  │  (read)  │  │ (mutate) │  │             │ │
│  └────┬─────┘  └────┬─────┘  └──────┬──────┘ │
│       │              │               │         │
│  ┌────┴──────────────┴───────────────┴──────┐ │
│  │              Sync Layer                   │ │
│  │  ┌─────────────┐  ┌──────────────────┐   │ │
│  │  │  IndexedDB   │  │  Mutation Queue  │   │ │
│  │  │  (idb-keyval)│  │  (pending ops)   │   │ │
│  │  └──────────────┘  └────────┬─────────┘   │ │
│  └─────────────────────────────┼─────────────┘ │
└────────────────────────────────┼───────────────┘
                                 │ online?
                    ┌────────────┴────────────┐
                    │      Supabase           │
                    │  (source of truth)      │
                    └─────────────────────────┘
```

## Storage locale

### IndexedDB (via idb-keyval)

Chiavi principali:
- `medicines:cache` — Cache locale del catalogo farmaci (per lookup offline)
- `user-medicines:{cabinetId}` — Cache locale farmaci per armadietto
- `cabinets` — Lista armadietti dell'utente
- `pending:{uuid}` — Mutazioni in coda

### Perché idb-keyval
- API semplice (get/set/del/keys)
- Sufficiente per storage key-value
- Nessun bisogno di indici o query complesse lato client
- Se le necessità crescono, migrare a Dexie

## Mutation Queue

### Struttura

```typescript
interface PendingMutation {
  id: string;             // UUID
  table: string;          // es. "user_medicines"
  operation: "INSERT" | "UPDATE" | "DELETE";
  payload: Record<string, unknown>;
  created_at: string;
  retries: number;
}
```

### Flusso

1. **Utente esegue un'azione** (es. aggiunge farmaco)
2. **Optimistic update**: aggiorna UI immediatamente
3. **Se online**: esegui mutazione su Supabase
4. **Se offline**:
   - Salva in IndexedDB come `pending:{uuid}`
   - Incrementa contatore in syncStore
5. **Quando torna online**:
   - `useSync` rileva `navigator.onLine`
   - Processa la coda in ordine FIFO
   - Per ogni mutazione: esegui su Supabase
   - Se successo: rimuovi da coda
   - Se errore: incrementa retries, ritenta al prossimo ciclo

### Retry policy
- Max 5 retry per mutazione
- Dopo 5 retry: la mutazione resta in coda ma non viene ritentata automaticamente
- L'utente può forzare un retry manuale da Settings

## Conflict resolution

### Strategia: Last Write Wins (LWW)

Per MVP, usiamo la strategia più semplice: l'ultima scrittura vince.

**Motivazione**: il caso d'uso principale è un singolo utente che gestisce il proprio armadietto. Conflitti reali sono rari.

**Implementazione**:
- Ogni record ha `updated_at`
- L'upsert su Supabase sovrascrive il record
- Se due utenti modificano lo stesso farmaco offline, l'ultimo a sincronizzare vince

### Mitigazioni
- La condivisione è limitata (owner + editor)
- Le operazioni più comuni sono ADD e DELETE (basso rischio conflitto)
- UPDATE è raro (solo modifica quantità o scadenza)
- In futuro: CRDT o merge manuale per conflitti

## Cache catalogo farmaci

Il catalogo farmaci (`medicines`) viene cachato localmente per permettere lookup barcode offline.

### Strategia: Stale-While-Revalidate
1. Al primo caricamento: fetch da Supabase → salva in IndexedDB
2. Alle visite successive: usa cache locale → aggiorna in background
3. Service Worker: cache delle risposte REST con Workbox (`StaleWhileRevalidate`)

### Dimensione stimata
- ~50.000 farmaci AIFA × ~200 bytes = ~10 MB
- Accettabile per storage IndexedDB su mobile

## Service Worker

Configurato tramite `vite-plugin-pwa` con Workbox.

### Risorse cached
- Shell dell'app (HTML, CSS, JS)
- Font di sistema (no web font)
- Risorse statiche (icone, immagini)
- Catalogo farmaci (runtime caching, StaleWhileRevalidate)

### Update strategy
- `registerType: "prompt"` — l'utente viene avvisato quando c'è un aggiornamento
- Banner "Nuova versione disponibile" con bottone "Aggiorna"

## Indicatori UI

| Stato | Indicatore |
|-------|-----------|
| Online, sincronizzato | Nessuno (stato normale) |
| Online, sync in corso | Icona sync rotante |
| Offline | Banner "Sei offline" + icona offline |
| Mutazioni pendenti | Badge numerico sull'icona sync |
| Errore sync | Banner rosso con messaggio |
