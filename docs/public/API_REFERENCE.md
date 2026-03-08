# API Reference

Farmakit espone le sue API tramite Supabase (PostgREST + Edge Functions).

La specifica OpenAPI completa è disponibile in [`api/openapi.yaml`](../../api/openapi.yaml).

## Autenticazione

Tutte le API richiedono un token JWT valido nell'header `Authorization: Bearer <token>`.
L'autenticazione avviene tramite Supabase Auth.

## Endpoint principali

### Catalogo farmaci

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/rest/v1/medicines` | Cerca farmaci nel catalogo |
| POST | `/functions/v1/medicine-lookup` | Lookup per barcode o testo |

### Armadietti

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/rest/v1/cabinets` | Lista armadietti dell'utente |
| POST | `/rest/v1/cabinets` | Crea armadietto |
| PATCH | `/rest/v1/cabinets?id=eq.{id}` | Modifica armadietto |
| DELETE | `/rest/v1/cabinets?id=eq.{id}` | Elimina armadietto |

### Condivisione

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/rest/v1/cabinet_members` | Lista membri |
| POST | `/rest/v1/cabinet_members` | Aggiungi membro |
| DELETE | `/rest/v1/cabinet_members?id=eq.{id}` | Rimuovi membro |

### Inventario

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/rest/v1/user_medicines` | Lista farmaci nell'armadietto |
| POST | `/rest/v1/user_medicines` | Aggiungi farmaco |
| PATCH | `/rest/v1/user_medicines?id=eq.{id}` | Modifica farmaco |
| DELETE | `/rest/v1/user_medicines?id=eq.{id}` | Rimuovi farmaco |

### Contribuzioni community

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/functions/v1/submit-contribution` | Invia contribuzione |

## Sicurezza (RLS)

Tutti gli accessi sono filtrati tramite Row Level Security:

- **medicines**: lettura pubblica per utenti autenticati
- **cabinets**: visibili solo ai membri (`cabinet_members`)
- **user_medicines**: accessibili solo ai membri dell'armadietto
- **community_contributions**: ogni utente vede solo le proprie
