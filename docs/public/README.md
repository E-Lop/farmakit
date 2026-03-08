# Farmakit

**Armadietto farmaci digitale** — PWA per gestire scadenze e scorte dei farmaci domestici.

## Funzionalità

- **Scansione barcode** — aggiungi farmaci scansionando il codice a barre dalla confezione
- **Catalogo AIFA** — database farmaci italiano con dati ufficiali AIFA
- **Catalogo community** — contribuisci al catalogo aggiungendo farmaci mancanti o barcode
- **Armadietti multipli** — organizza i farmaci in liste separate (Casa, Ufficio, Nonna...)
- **Condivisione selettiva** — condividi singoli armadietti con familiari o coinquilini
- **Notifiche scadenza** — ricevi avvisi prima che i farmaci scadano
- **Offline-first** — funziona senza connessione, sincronizza quando torni online

## Stack tecnologico

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (Auth, PostgreSQL, Edge Functions)
- @zxing per la scansione barcode
- Zustand + React Query
- IndexedDB per storage offline

## Quick start

```bash
# Clona il repository
git clone https://github.com/your-org/farmakit.git
cd farmakit

# Installa dipendenze
npm install

# Configura le variabili d'ambiente
cp .env.example .env.local

# Avvia il dev server
npm run dev
```

Vedi [SETUP.md](SETUP.md) per istruzioni dettagliate.

## Struttura progetto

```
farmakit/
├── app/       → React PWA (frontend)
├── api/       → Specifica OpenAPI pubblica
├── data/      → Pipeline import dati AIFA
├── supabase/  → Migrazioni, Edge Functions
└── docs/      → Documentazione
```

## Contribuire

Vedi [CONTRIBUTING.md](CONTRIBUTING.md) per le linee guida.

## Licenza

MIT — vedi [LICENSE](../../LICENSE).
