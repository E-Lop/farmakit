# Farmakit

**Armadietto farmaci digitale** — PWA mobile-first per gestire scadenze e scorte dei farmaci domestici.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Funzionalità

- **Scansione barcode** — aggiungi farmaci scansionando il codice a barre
- **Catalogo AIFA** — database farmaci italiano con dati ufficiali
- **Catalogo community** — contribuisci con farmaci e barcode mancanti
- **Armadietti multipli** — organizza in liste separate (Casa, Ufficio, Nonna...)
- **Condivisione selettiva** — condividi singoli armadietti con familiari
- **Notifiche scadenza** — avvisi prima che i farmaci scadano
- **Offline-first** — funziona senza connessione, sincronizza quando online

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Supabase · @zxing · Zustand · React Query

## Quick start

```bash
git clone https://github.com/your-org/farmakit.git
cd farmakit
npm install
cp .env.example .env.local
# Configura VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

Vedi [docs/public/SETUP.md](docs/public/SETUP.md) per istruzioni complete.

## Struttura progetto

```
farmakit/
├── app/        React PWA (frontend)
├── api/        Specifica OpenAPI pubblica
├── data/       Pipeline import dati AIFA
├── supabase/   Migrazioni, Edge Functions
└── docs/       Documentazione (public + private)
```

## Comandi

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Build produzione |
| `npm run typecheck` | Type check |
| `npm run lint` | ESLint |
| `npm test` | Test (Vitest) |

## Documentazione

- [Setup](docs/public/SETUP.md)
- [Contribuire](docs/public/CONTRIBUTING.md)
- [API Reference](docs/public/API_REFERENCE.md)
- [Data Schema](docs/public/DATA_SCHEMA.md)
- [Architettura](docs/private/ARCHITECTURE.md)

## Licenza

MIT — vedi [LICENSE](LICENSE).
