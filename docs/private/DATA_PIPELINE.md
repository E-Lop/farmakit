# Data Pipeline — Import AIFA

## Panoramica

Il workspace `data/` contiene la pipeline per importare i dati del catalogo farmaci dall'AIFA (Agenzia Italiana del Farmaco) nel database Supabase.

## Fonte dati

L'AIFA pubblica periodicamente un dataset CSV con l'elenco dei farmaci autorizzati in Italia. Il dataset include:
- Codice AIC (identificativo univoco)
- Denominazione
- Principio attivo
- Titolare AIC (produttore)
- Codice ATC (classificazione terapeutica)
- Descrizione confezione

## Pipeline

```
CSV AIFA → csv-parser → normalizer → zod validation → batch upsert → Supabase
```

### 1. Parsing CSV
- File: `data/src/parsers/csv-parser.ts`
- Delimitatore: `;` (standard AIFA)
- Encoding: UTF-8
- Gestione righe vuote

### 2. Normalizzazione
- File: `data/src/parsers/normalizer.ts`
- Mappatura colonne (uppercase ↔ lowercase)
- Trim whitespace
- Gestione campi mancanti

### 3. Validazione
- File: `data/src/types/aifa.types.ts`
- Schema Zod per ogni record
- Campi obbligatori: aic_code, name, active_ingredient, manufacturer, atc_code
- Record invalidi vengono skipati e loggati

### 4. Import
- File: `data/src/import-aifa.ts`
- Batch upsert (500 record per batch)
- Conflict resolution: `ON CONFLICT (aic_code)` → update
- Source: `aifa`, verified: `true`

## Comandi

```bash
# Validare un file CSV senza importare
npm run validate -w data -- percorso/file.csv

# Importare nel database
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run import:aifa -w data -- percorso/file.csv
```

## Output

```
Import completato: {
  total: 45000,
  imported: 44800,
  skipped: 200,
  errors: [...]
}
```

## Note

- L'import usa `SUPABASE_SERVICE_ROLE_KEY` per bypassare RLS
- I dati AIFA hanno priorità su quelli community (`verified: true`)
- L'import è idempotente (upsert su aic_code)
- I barcode non sono presenti nel dataset AIFA — vengono aggiunti via community
