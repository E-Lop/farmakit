# Setup Farmakit

Guida completa per configurare l'ambiente di sviluppo locale.

## Prerequisiti

- **Node.js** >= 20
- **npm** >= 10
- **Supabase CLI** (opzionale, per sviluppo locale con DB)

## Installazione

```bash
git clone https://github.com/E-Lop/farmakit.git
cd farmakit
npm install
```

## Configurazione ambiente

Copia il file di esempio e configura le variabili:

```bash
cp .env.example .env.local
```

Modifica `.env.local` con i dati del tuo progetto Supabase:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Creare un progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un account
2. Crea un nuovo progetto
3. Dalla dashboard, copia URL e anon key in Settings > API
4. Esegui la migrazione iniziale:
   - Apri SQL Editor nella dashboard
   - Incolla il contenuto di `supabase/migrations/00001_initial_schema.sql`
   - Esegui

### Sviluppo locale con Supabase CLI (opzionale)

```bash
# Installa Supabase CLI
brew install supabase/tap/supabase

# Avvia i servizi locali
supabase start

# Le credenziali locali vengono stampate in console
```

## Avvio

```bash
# Dev server con hot reload
npm run dev

# L'app è disponibile su http://localhost:5173
```

## Comandi utili

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia dev server |
| `npm run build` | Build produzione |
| `npm run preview` | Preview build |
| `npm run typecheck` | Type check |
| `npm run lint` | ESLint |
| `npm test` | Test (Vitest) |
| `npm run test:watch` | Test in watch mode |

## Import dati AIFA

Per popolare il catalogo farmaci con i dati AIFA:

```bash
# Scarica il dataset CSV da AIFA
# Configura SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env.local

# Valida il file
npm run validate -w data -- percorso/file.csv

# Importa
npm run import:aifa -w data -- percorso/file.csv
```

## Troubleshooting

### L'app non si connette a Supabase
- Verifica che `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` siano corretti
- Controlla che il progetto Supabase sia attivo (non in pausa)

### La scansione barcode non funziona
- L'accesso alla fotocamera richiede HTTPS o localhost
- Assicurati di concedere il permesso fotocamera al browser
- Su iOS, usa Safari (Chrome non supporta getUserMedia su iOS)

### I test falliscono
- Esegui `npm install` per assicurarti che le dipendenze siano aggiornate
- Verifica di usare Node.js >= 20
