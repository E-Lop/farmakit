# Data Schema

Schema del database Farmakit. La migrazione completa è in `supabase/migrations/00001_initial_schema.sql`.

## Diagramma relazioni

```
auth.users
  │
  ├──< cabinets (owner_id)
  │      │
  │      ├──< cabinet_members (cabinet_id)
  │      │      └── user_id → auth.users
  │      │
  │      └──< user_medicines (cabinet_id)
  │             └── medicine_id → medicines
  │
  └──< community_contributions (user_id)
         └── medicine_id → medicines

medicines (catalogo indipendente)
```

## Tabelle

### medicines
Catalogo farmaci (AIFA + community).

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid | PK |
| aic_code | text | Codice AIC univoco, nullable |
| name | text | Nome farmaco, NOT NULL |
| active_ingredient | text | Principio attivo |
| manufacturer | text | Titolare AIC |
| atc_code | text | Classificazione ATC |
| package_description | text | Descrizione confezione |
| barcode | text | EAN/codice a barre |
| source | text | `aifa` o `community` |
| verified | boolean | Verificato (AIFA = true) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### cabinets
Armadietti/liste dell'utente.

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid | PK |
| name | text | Nome armadietto, NOT NULL |
| icon | text | Emoji o icona |
| owner_id | uuid | FK → auth.users |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### cabinet_members
Condivisione selettiva degli armadietti.

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid | PK |
| cabinet_id | uuid | FK → cabinets |
| user_id | uuid | FK → auth.users |
| role | text | `owner` o `editor` |
| created_at | timestamptz | |

Vincolo UNIQUE su (cabinet_id, user_id).

### user_medicines
Farmaci nell'armadietto dell'utente.

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid | PK |
| cabinet_id | uuid | FK → cabinets, NOT NULL |
| medicine_id | uuid | FK → medicines, nullable |
| custom_name | text | Nome personalizzato se non in catalogo |
| quantity | integer | >= 0, default 1 |
| expiry_date | date | Data scadenza |
| notes | text | Note libere |
| barcode | text | Barcode scansionato |
| notify_before_days | integer | Giorni anticipo notifica, default 30 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Vincolo CHECK: almeno uno tra medicine_id e custom_name deve essere non null.

### community_contributions
Log delle contribuzioni al catalogo community.

| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| medicine_id | uuid | FK → medicines, nullable |
| contribution_type | text | `new_medicine`, `barcode_add`, `correction` |
| data | jsonb | Dati della contribuzione |
| status | text | `pending`, `approved`, `rejected` |
| created_at | timestamptz | |

## Row Level Security

Tutte le tabelle hanno RLS attivo. L'accesso è basato su:
- **medicines**: lettura per tutti gli autenticati
- **cabinets, user_medicines**: accesso solo tramite `cabinet_members`
- **cabinet_members**: gestione solo per owner dell'armadietto
- **community_contributions**: ogni utente vede/crea solo le proprie
