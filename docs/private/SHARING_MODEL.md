# Modello condivisione

## Panoramica

Farmakit supporta la condivisione selettiva degli armadietti. Ogni utente può creare più armadietti e condividerli individualmente con altri utenti.

## Concetti

### Armadietto (Cabinet)
Un contenitore logico di farmaci. Esempi: "Casa", "Ufficio", "Nonna", "Viaggio".

### Ruoli

| Ruolo | Descrizione | Permessi |
|-------|-------------|----------|
| **Owner** | Creatore dell'armadietto | Tutto: CRUD farmaci, invita/rimuovi membri, rinomina/elimina armadietto |
| **Editor** | Utente invitato | CRUD farmaci nell'armadietto |

**Nota**: non esiste il ruolo "viewer" per MVP. Chi viene invitato può sempre modificare.

### Membership
- Un utente è membro di un armadietto tramite `cabinet_members`
- Quando crea un armadietto, viene aggiunto automaticamente come `owner`
- L'owner può invitare altri utenti come `editor`

## Schema database

```sql
-- Armadietti
CREATE TABLE cabinets (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  icon text,
  owner_id uuid REFERENCES auth.users,
  ...
);

-- Membri (condivisione)
CREATE TABLE cabinet_members (
  id uuid PRIMARY KEY,
  cabinet_id uuid REFERENCES cabinets,
  user_id uuid REFERENCES auth.users,
  role text CHECK (role IN ('owner', 'editor')),
  UNIQUE (cabinet_id, user_id)
);

-- Farmaci (FK verso cabinet)
CREATE TABLE user_medicines (
  id uuid PRIMARY KEY,
  cabinet_id uuid REFERENCES cabinets,
  ...
);
```

## Flusso invito

### MVP (utente esistente)
1. Owner va in Settings armadietto → "Condividi"
2. Inserisce email dell'utente da invitare
3. Il sistema cerca l'utente per email in `auth.users`
4. Se trovato → crea record in `cabinet_members` con role `editor`
5. L'armadietto compare nella lista dell'utente invitato

### Futuro (invito email)
- Se l'utente non esiste → invio email con link di invito
- Al signup tramite link → associazione automatica all'armadietto

## RLS (Row Level Security)

L'accesso ai dati è interamente basato sulla membership:

```sql
-- Funzione helper
CREATE FUNCTION is_cabinet_member(cabinet_id uuid, user_id uuid) RETURNS boolean;

-- Policy esempio: i membri vedono i farmaci dell'armadietto
CREATE POLICY "Membri vedono farmaci"
  ON user_medicines FOR SELECT
  USING (is_cabinet_member(cabinet_id, auth.uid()));
```

### Matrice accesso

| Azione | Owner | Editor | Non membro |
|--------|-------|--------|------------|
| Vedere armadietto | ✅ | ✅ | ❌ |
| Vedere farmaci | ✅ | ✅ | ❌ |
| Aggiungere farmaci | ✅ | ✅ | ❌ |
| Modificare farmaci | ✅ | ✅ | ❌ |
| Rimuovere farmaci | ✅ | ✅ | ❌ |
| Rinominare armadietto | ✅ | ❌ | ❌ |
| Invitare membri | ✅ | ❌ | ❌ |
| Rimuovere membri | ✅ | ❌ | ❌ |
| Eliminare armadietto | ✅ | ❌ | ❌ |

## Considerazioni UX

### Vista armadietti
- Lista tutti gli armadietti (propri + condivisi)
- Badge "Condiviso" su armadietti con più membri
- Numero membri visibile
- Distinguere visivamente propri vs. condivisi

### Switching armadietto
- Header della Dashboard mostra nome armadietto attivo
- Tap → dropdown/bottom sheet con lista armadietti
- L'armadietto attivo è salvato in `uiStore.activeCabinetId`

### Gestione membri
- Lista membri con ruolo
- Owner può rimuovere editor (swipe o tap → conferma)
- Owner non può rimuovere sé stesso
- Editor può "lasciare" un armadietto condiviso

## Differenze da entroapp

| Aspetto | entroapp | Farmakit |
|---------|----------|----------|
| Liste | Una sola lista per utente | Multiple liste (armadietti) |
| Condivisione | No | Sì, selettiva per armadietto |
| Schema DB | `user_items` con FK a user | `user_medicines` con FK a cabinet |
| RLS | Basata su user_id | Basata su cabinet_members |
| UI | Lista unica | Selector armadietto + lista |
