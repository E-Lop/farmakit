# Architettura Farmakit

## Panoramica

Farmakit è una PWA mobile-first organizzata come monorepo npm workspaces con tre workspace:
- **app/** — React PWA (frontend)
- **api/** — Specifica OpenAPI pubblica
- **data/** — Pipeline import dati AIFA

Il backend è interamente gestito da Supabase (Auth, PostgreSQL, Edge Functions, Realtime).

## Diagramma architetturale

```
┌─────────────────────────────────────────────────────┐
│                    Browser / PWA                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  React   │  │ Zustand  │  │    IndexedDB        │ │
│  │  Router  │  │ Stores   │  │  (idb-keyval)       │ │
│  │  Pages   │  │          │  │  - medicines cache   │ │
│  │          │  │ authStore │  │  - pending mutations │ │
│  │          │  │ uiStore   │  │                     │ │
│  │          │  │ syncStore │  │                     │ │
│  └────┬─────┘  └────┬─────┘  └─────────┬───────────┘ │
│       │              │                   │             │
│  ┌────┴──────────────┴───────────────────┴──────────┐ │
│  │              React Query + Sync Layer             │ │
│  │  - Cache server state                             │ │
│  │  - Mutation queue (offline)                       │ │
│  │  - Optimistic updates                             │ │
│  └───────────────────────┬──────────────────────────┘ │
│                          │                             │
│  ┌───────────────────────┴──────────────────────────┐ │
│  │           @zxing Barcode Scanner                  │ │
│  │  - Camera access (getUserMedia)                   │ │
│  │  - EAN-13, EAN-8, Code128                         │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┴──────────────────────────────┐
│                       Supabase                           │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Auth   │  │  PostgreSQL  │  │  Edge Functions   │   │
│  │  (JWT)   │  │  + RLS       │  │  - lookup         │   │
│  │          │  │              │  │  - contribution    │   │
│  │          │  │  medicines   │  │  - notifications   │   │
│  │          │  │  cabinets    │  │                    │   │
│  │          │  │  cabinet_    │  │                    │   │
│  │          │  │   members    │  │                    │   │
│  │          │  │  user_       │  │                    │   │
│  │          │  │   medicines  │  │                    │   │
│  └──────────┘  └──────────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Principi architetturali

### 1. Mobile-first
- Layout e interazioni progettati per smartphone
- Touch-friendly, gesture support
- Camera access per barcode scanning
- Viewport portrait-preferred

### 2. Local-first / Offline
- Dati salvati in IndexedDB come source of truth locale
- Le mutazioni offline vengono accodate (mutation queue)
- Sync bidirezionale con Supabase quando online
- Il catalogo farmaci viene cachato per lookup offline
- Vedi [LOCAL_FIRST.md](LOCAL_FIRST.md) per dettagli

### 3. Liste multiple con condivisione selettiva
- Ogni utente può creare più armadietti
- Condivisione selettiva: owner + editor
- RLS basata su `cabinet_members`
- Vedi [SHARING_MODEL.md](SHARING_MODEL.md) per dettagli

### 4. Sicurezza
- Autenticazione JWT tramite Supabase Auth
- Row Level Security su tutte le tabelle
- Nessun dato sensibile lato client
- Edge Functions con validazione input

## Flusso dati

### Lettura (online)
```
Componente → useQuery hook → Supabase client → PostgREST → PostgreSQL (+ RLS)
                                                    ↓
                                              IndexedDB cache
```

### Lettura (offline)
```
Componente → useQuery hook → IndexedDB cache (stale data)
```

### Scrittura (online)
```
Componente → useMutation → Supabase client → PostgREST → PostgreSQL
                                    ↓
                            Invalidate query cache
```

### Scrittura (offline)
```
Componente → useMutation → IndexedDB (optimistic update)
                                ↓
                        Mutation queue (pending)
                                ↓ (quando torna online)
                        Sync → Supabase → PostgreSQL
```

## Struttura componenti

```
src/
├── components/
│   ├── auth/          Componenti autenticazione
│   ├── barcode/       Scanner e risultati barcode
│   ├── medicines/     Lista, card, form farmaci
│   ├── cabinets/      Lista, card, form armadietti
│   ├── sharing/       Invito membri, lista membri
│   ├── layout/        Header, BottomNav, PageLayout
│   ├── pwa/           Install prompt, update banner
│   ├── settings/      Profilo, notifiche, tema
│   ├── contributions/ Form e lista contribuzioni
│   └── ui/            Componenti shadcn/ui
├── hooks/             Custom hooks (uno per file)
├── lib/               Logica business e utility
├── pages/             Route components
├── stores/            Zustand stores
└── types/             TypeScript type definitions
```

## Decisioni tecniche

| Decisione | Motivazione |
|-----------|-------------|
| Supabase vs Firebase | PostgreSQL + RLS + SQL nativo, edge functions Deno, pricing prevedibile |
| Zustand vs Context | Performance, API semplice, nessun provider nesting |
| React Query vs SWR | Mutation support, DevTools, invalidation granulare |
| @zxing vs QuaggaJS | Supporto più formati, community più attiva, TypeScript nativo |
| idb-keyval vs Dexie | Semplicità per key-value, sufficiente per il nostro uso |
| shadcn/ui vs MUI | Bundle size, customizzazione Tailwind, copy-paste ownership |
| Vite vs Next.js | SPA pura, no SSR necessario, build veloce |
| Netlify vs Vercel | Supporto monorepo, redirect SPA semplici, pricing gratuito generoso |

## Deploy

L'app è deployata su **Netlify** con dominio custom.

- **URL produzione**: https://farmakit.it
- **URL Netlify**: https://farmakit-app.netlify.app
- **Dominio**: `farmakit.it` (registrato su Aruba, DNS puntato a Netlify)
- **Configurazione**: `netlify.toml` nella root del monorepo
- **Build command**: `npm run build` (esegue il build del workspace `app`)
- **Publish directory**: `app/dist`
- **Redirect SPA**: `/* → /index.html` (status 200)
- **Variabili d'ambiente**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` configurate su Netlify
- **SSL**: certificato automatico Let's Encrypt via Netlify
