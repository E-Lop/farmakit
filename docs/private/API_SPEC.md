# API Specification — Dettaglio tecnico

La specifica OpenAPI formale è in `api/openapi.yaml`. Questo documento descrive le convenzioni e i dettagli implementativi.

## Architettura API

Farmakit usa due tipi di endpoint:

1. **PostgREST** (auto-generato da Supabase) — CRUD standard su tabelle
2. **Edge Functions** (Deno) — logica custom

## PostgREST endpoints

Supabase espone automaticamente le tabelle come REST API. I filtri usano la sintassi PostgREST:

```
GET /rest/v1/medicines?name=ilike.*tachipirina*&limit=20
GET /rest/v1/user_medicines?cabinet_id=eq.{uuid}&select=*,medicine:medicines(*)
POST /rest/v1/cabinets  { "name": "Casa" }
PATCH /rest/v1/user_medicines?id=eq.{uuid}  { "quantity": 3 }
DELETE /rest/v1/user_medicines?id=eq.{uuid}
```

### Convenzioni
- `select=*,relation(*)` per join
- `order=expiry_date.asc` per ordinamento
- `limit=20` per paginazione
- Tutti gli endpoint richiedono header `Authorization: Bearer <jwt>`
- Header `apikey` con anon key

## Edge Functions

### medicine-lookup
**Endpoint**: `POST /functions/v1/medicine-lookup`

Lookup farmaco per barcode o testo. Utile come fallback quando il cache locale non ha risultati.

**Request**:
```json
{ "barcode": "8003849000234" }
// oppure
{ "query": "tachipirina" }
```

**Response**:
```json
{ "data": { "id": "...", "name": "TACHIPIRINA 500MG", ... } }
// oppure per query
{ "data": [{ ... }, { ... }] }
```

### submit-contribution
**Endpoint**: `POST /functions/v1/submit-contribution`

Invia una contribuzione al catalogo community.

**Request**:
```json
{
  "contribution_type": "new_medicine",
  "data": {
    "name": "Farmaco XYZ",
    "active_ingredient": "Principio Attivo",
    "barcode": "1234567890123"
  }
}
```

### send-expiry-notifications
**Endpoint**: `POST /functions/v1/send-expiry-notifications`

Da invocare periodicamente (cron). Trova farmaci in scadenza e invia notifiche.

**Nota**: per MVP, questa funzione restituisce solo la lista dei farmaci in scadenza. L'invio effettivo delle notifiche push sarà implementato successivamente.

## Codici errore

| Codice | Significato |
|--------|-------------|
| 200 | Successo |
| 201 | Creato |
| 204 | Eliminato (no content) |
| 400 | Input non valido |
| 401 | Non autenticato |
| 403 | Non autorizzato (RLS) |
| 404 | Non trovato |
| 409 | Conflitto (es. membro duplicato) |

## Rate limiting

Supabase applica rate limiting a livello di progetto. Per il piano free:
- 500 richieste/minuto per utente
- Sufficiente per l'uso tipico dell'app

## Versionamento

Per MVP, nessun versionamento API esplicito. L'API è consumata solo dal frontend Farmakit. Il versionamento sarà introdotto quando si aprirà l'API pubblica (documentazione in inglese).
