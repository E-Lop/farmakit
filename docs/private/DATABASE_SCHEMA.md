# Database Schema — Dettaglio tecnico

Riferimento tecnico completo dello schema database Farmakit.
Per una panoramica, vedi [docs/public/DATA_SCHEMA.md](../public/DATA_SCHEMA.md).

## Schema SQL

La migrazione iniziale è in `supabase/migrations/00001_initial_schema.sql`.

## Tabelle

### medicines

Catalogo centralizzato farmaci. Popolato da:
1. **Import AIFA** — dati ufficiali (`source = 'aifa'`, `verified = true`)
2. **Contribuzioni community** — farmaci aggiunti dagli utenti (`source = 'community'`, `verified = false`)

**Indici**:
- `idx_medicines_barcode` — lookup per barcode (WHERE barcode IS NOT NULL)
- `idx_medicines_name` — full-text search italiano (GIN, to_tsvector)
- `idx_medicines_aic` — lookup per codice AIC

**Note**:
- `aic_code` è UNIQUE ma nullable (farmaci community potrebbero non averlo)
- `barcode` non è UNIQUE perché confezioni diverse dello stesso farmaco possono avere barcode diversi
- L'upsert AIFA usa `ON CONFLICT (aic_code)`

### cabinets

Armadietti/liste dell'utente. Quando un armadietto viene creato, un trigger (`trg_cabinets_add_owner`) aggiunge automaticamente il creatore come membro con ruolo `owner`.

### cabinet_members

Tabella di giunzione per la condivisione selettiva.

**Ruoli**:
- `owner` — può modificare armadietto, aggiungere/rimuovere membri, eliminare
- `editor` — può aggiungere/modificare/rimuovere farmaci

**Vincoli**:
- UNIQUE (cabinet_id, user_id) — un utente non può essere membro due volte
- FK cascade su cabinets e auth.users

### user_medicines

Inventario farmaci nell'armadietto.

**Vincolo CHECK**: `medicine_id IS NOT NULL OR custom_name IS NOT NULL`
- Se il farmaco è nel catalogo: `medicine_id` è popolato
- Se il farmaco non è nel catalogo: `custom_name` è usato come fallback

**Colonne aggiuntive**:
- `pharmaceutical_form` (text, nullable) — forma farmaceutica (es. Compressa, Sciroppo). Usata per distinguere forme contabili da non contabili (vedi sotto)
- `strength` (text, nullable) — dosaggio (es. 500mg, 200mg/5ml)

**Forme contabili vs non contabili**:
Le forme farmaceutiche non contabili (sciroppo, soluzione, gocce, crema, gel, pomata, spray, collirio) sono escluse dallo stepper quantità e dagli alert di scorta bassa. La logica è in `app/src/lib/pharmaceutical-forms.ts` (`isCountableForm`).

**Note**:
- `notify_before_days` default 30 — notifica 30 giorni prima della scadenza
- `barcode` è duplicato qui per reference rapida (il barcode originale è anche in medicines)

### community_contributions

Log delle contribuzioni al catalogo community.

**Tipi contribuzione**:
- `new_medicine` — farmaco non presente nel catalogo
- `barcode_add` — barcode per farmaco esistente
- `correction` — correzione dati esistenti

**Flusso**: `pending` → `approved` / `rejected` (moderazione futura)

## Funzioni helper

### is_cabinet_member(cabinet_id, user_id)
Verifica membership. Usata nelle policy RLS.
`SECURITY DEFINER` per bypassare RLS durante il check.

### is_cabinet_owner(cabinet_id, user_id)
Verifica ownership. Usata per operazioni privilegiate.

### update_updated_at()
Trigger function per aggiornare `updated_at` automaticamente.

### add_owner_as_member()
Trigger: quando si crea un cabinet, il proprietario viene aggiunto come membro owner.

## RLS Policy matrix

| Tabella | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| medicines | authenticated | - | - | - |
| cabinets | member | owner (self) | owner | owner |
| cabinet_members | member | owner | - | owner |
| user_medicines | member | member | member | member |
| community_contributions | self | self | - | - |

## Considerazioni performance

- Full-text search con GIN index per ricerca farmaci
- Indici parziali (WHERE ... IS NOT NULL) per ridurre dimensione
- Le funzioni RLS helper sono `STABLE` per caching query planner
- Batch upsert per import AIFA (500 record per batch)
