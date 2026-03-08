# Farmakit — Contesto per sviluppo assistito

## Progetto
Farmakit è una PWA mobile-first per gestire l'inventario farmaci domestici (scadenze, scorte, barcode scan).

## Stack tecnologico
- **Frontend**: React 19 + TypeScript + Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions, Realtime)
- **Barcode**: @zxing/browser + @zxing/library
- **State**: Zustand (client state), React Query (server state)
- **Offline**: IndexedDB (idb-keyval), Service Worker, mutation queue
- **Test**: Vitest + Testing Library
- **Deploy**: Netlify
- **Monorepo**: npm workspaces (app, api, data)

## Struttura monorepo
- `app/` — React PWA (frontend)
- `api/` — Documentazione OpenAPI pubblica
- `data/` — Pipeline import dati AIFA
- `supabase/` — Configurazione, migrazioni, Edge Functions
- `docs/public/` — Documentazione open source
- `docs/private/` — Documentazione sviluppo interna

## Principi architetturali
1. **Mobile-first**: ogni decisione UX privilegia l'esperienza smartphone
2. **Local-first / offline**: dati salvati in IndexedDB, sincronizzati con Supabase quando online
3. **Liste multiple**: utente può creare più armadietti e condividerli selettivamente (owner/editor)
4. **Spec-driven**: la documentazione guida lo sviluppo, non il contrario

## Convenzioni codice
- TypeScript strict mode
- Path alias: `@/` → `app/src/`
- Componenti React: function components con named exports
- Hook custom: prefisso `use`, un file per hook
- Test: file `.test.ts(x)` co-locati o in `__tests__/`
- Stile: Tailwind utility classes, no CSS custom tranne `index.css`
- Naming: camelCase per variabili/funzioni, PascalCase per componenti/tipi, kebab-case per file

## Database
- Schema in `supabase/migrations/`
- RLS attivo su tutte le tabelle
- Accesso dati basato su `cabinet_members` (condivisione selettiva)
- Tabelle principali: `medicines`, `cabinets`, `cabinet_members`, `user_medicines`, `community_contributions`

## Deploy
- **Hosting**: Netlify (sito: `farmakit-app`)
- **URL produzione**: https://farmakit.it (dominio custom, DNS su Aruba)
- **URL Netlify**: https://farmakit-app.netlify.app
- **Netlify CLI + monorepo**: usare sempre `--filter @farmakit/app` per evitare il prompt interattivo di selezione progetto (es. `netlify deploy --filter @farmakit/app`)
- **Config**: `netlify.toml` nella root (build command, publish dir, redirects SPA, header sw.js)
- **Env vars**: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configurate su Netlify

## Comandi utili
```bash
npm run dev          # Dev server (app)
npm run build        # Build produzione
npm run typecheck    # Type check tutti i workspace
npm run lint         # ESLint
npm test             # Vitest (tutti i workspace)
```

## Workflow sviluppo
- **Test-driven**: scrivere i test prima del codice, ove applicabile
- **Code simplifier**: al termine dell'implementazione di ogni nuova feature, lanciare automaticamente il code simplifier per rifinire il codice (chiarezza, consistenza, manutenibilità)

## Lingua
Documentazione e commenti in italiano. Codice (variabili, funzioni, tipi) in inglese.
