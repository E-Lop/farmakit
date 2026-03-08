# Data Pipeline — Import AIFA

## Panoramica

Il workspace `data/` contiene la pipeline per importare i dati del catalogo farmaci dall'AIFA (Agenzia Italiana del Farmaco) nel database Supabase.

## Fonte dati

Il dataset ufficiale è **confezioni.csv** pubblicato da AIFA su `https://drive.aifa.gov.it/farmaci/confezioni.csv`.

### Colonne del CSV originale

| Colonna | Descrizione | Importata? |
|---------|-------------|:----------:|
| `codice_aic` | Codice AIC univoco (9 cifre) | **Si** |
| `cod_farmaco` | Codice farmaco (raggruppamento) | No |
| `cod_confezione` | Codice confezione | No |
| `denominazione` | Nome commerciale | **Si** |
| `descrizione` | Descrizione confezione (forma, dosaggio, quantità) | **Si** |
| `codice_ditta` | Codice numerico produttore | No |
| `ragione_sociale` | Nome produttore | **Si** |
| `stato_amministrativo` | Stato (Autorizzata, Revocata, Sospesa...) | Filtro |
| `tipo_procedura` | Tipo procedura autorizzativa | No |
| `forma` | Forma farmaceutica (Compressa, Sciroppo...) | **Si** |
| `codice_atc` | Codice classificazione ATC | **Si** |
| `pa_associati` | Principi attivi | **Si** |
| `link` | Link scheda tecnica | No |

### Mappatura verso tabella `medicines`

| CSV AIFA | Campo DB |
|----------|----------|
| `codice_aic` | `aic_code` |
| `denominazione` | `name` |
| `pa_associati` | `active_ingredient` |
| `ragione_sociale` | `manufacturer` |
| `codice_atc` | `atc_code` |
| `descrizione` | `package_description` |
| `forma` | `pharmaceutical_form` |

## Pipeline

```
CSV AIFA → csv-parser → filtro stato_amministrativo → normalizer → zod validation → batch upsert → Supabase
```

### 1. Parsing CSV
- File: `data/src/parsers/csv-parser.ts`
- Delimitatore: `;` (standard AIFA)
- Encoding: UTF-8

### 2. Filtro
- Solo i farmaci con `stato_amministrativo = "Autorizzata"` vengono importati
- I farmaci revocati o sospesi vengono scartati

### 3. Normalizzazione
- File: `data/src/parsers/normalizer.ts`
- Mappatura colonne CSV AIFA → schema `medicines`
- Trim whitespace

### 4. Validazione
- File: `data/src/types/aifa.types.ts`
- Schema Zod per ogni record
- Campi obbligatori: `aic_code`, `name`
- Record invalidi vengono skippati e loggati

### 5. Import
- File: `data/src/import-aifa.ts`
- Batch upsert (500 record per batch)
- Conflict resolution: `ON CONFLICT (aic_code)` → update
- Source: `aifa`, verified: `true`

## Comandi

```bash
# Importare direttamente dal sito AIFA (download automatico)
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run import:aifa -w data

# Importare da un file locale
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run import:aifa -w data -- percorso/file.csv

# Validare un file CSV senza importare
npm run validate -w data -- percorso/file.csv
```

## Note

- L'import usa `SUPABASE_SERVICE_ROLE_KEY` per bypassare RLS
- I dati AIFA hanno priorità su quelli community (`verified: true`)
- L'import è idempotente (upsert su `aic_code`)
- I barcode non sono presenti nel dataset AIFA — vengono aggiunti via community
- Il file `PA_confezioni.csv` contiene dettagli aggiuntivi sui principi attivi (quantità, unità di misura) ma non è necessario per l'MVP
