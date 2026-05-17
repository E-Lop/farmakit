# Convenzione GRANT — Supabase Data API

## Contesto

Dal 28 aprile 2026 Supabase ha cambiato il comportamento di default del Data API: le nuove tabelle in `public` non sono più esposte automaticamente a `anon`/`authenticated`/`service_role` (vedi [discussione #45329](https://github.com/orgs/supabase/discussions/45329)).

La migration `00006_explicit_grants_opt_in.sql` adotta esplicitamente questo nuovo default sul nostro progetto. Da quel punto in poi, ogni nuova tabella in `public` richiede `GRANT` espliciti per essere raggiungibile da `supabase-js`.

Senza `GRANT`, la prima query dal frontend restituisce:

```json
{
  "code": "42501",
  "message": "permission denied for table <table>",
  "hint": "Grant the required privileges to the current role with: GRANT SELECT ON public.<table> TO anon;"
}
```

## Regola d'oro

Una nuova migration che crea una tabella in `public` deve includere, **nello stesso file**, nell'ordine:

1. `create table public.<name> (...);`
2. `grant ... on public.<name> to <ruoli>;`
3. `alter table public.<name> enable row level security;`
4. `create policy ...;`

Privilegi minimi: nessun `grant all`. Specificare i singoli verbi (`select`, `insert`, `update`, `delete`).

## Pattern 1 — Tabella user-owned

Dati appartenenti all'utente autenticato (esempio nel codebase: `user_medicines`). Il pubblico anonimo non ne ha bisogno; l'utente loggato può leggere/scrivere i propri record (filtrati da RLS).

```sql
create table public.user_thing (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payload text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.user_thing to authenticated;
-- volutamente nessun grant ad anon: dato privato
grant select, insert, update, delete on public.user_thing to service_role;

alter table public.user_thing enable row level security;

create policy "owner can read"
  on public.user_thing for select to authenticated
  using (auth.uid() = user_id);

create policy "owner can insert"
  on public.user_thing for insert to authenticated
  with check (auth.uid() = user_id);

create policy "owner can update"
  on public.user_thing for update to authenticated
  using (auth.uid() = user_id);

create policy "owner can delete"
  on public.user_thing for delete to authenticated
  using (auth.uid() = user_id);
```

## Pattern 2 — Catalogo pubblico in sola lettura

Dati di riferimento immutabili lato client (esempio nel codebase: `medicines`, dati AIFA). Anche utenti non autenticati devono poterli leggere; nessuno scrive da frontend.

```sql
create table public.public_catalog (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null
);

grant select on public.public_catalog to anon, authenticated;
grant select, insert, update, delete on public.public_catalog to service_role;

alter table public.public_catalog enable row level security;

create policy "anyone can read catalog"
  on public.public_catalog for select to anon, authenticated
  using (true);
-- nessuna policy di scrittura: gli ingest avvengono via service_role (Edge Function / pipeline data/)
```

## Pattern 3 — Tabella interna (solo Edge Function)

Stato di sistema che il frontend non deve mai vedere o toccare (esempio: code di job, log interni). Solo `service_role` ha accesso, e si chiama esclusivamente da Edge Function.

```sql
create table public.internal_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.internal_jobs to service_role;
-- volutamente NESSUN grant ad anon/authenticated

alter table public.internal_jobs enable row level security;
-- nessuna policy necessaria: service_role bypassa RLS,
-- ma RLS resta abilitato come safety net se per errore esponiamo grant in futuro.
```

## Aggiunta di colonna / alter di tabella esistente

`ALTER TABLE` non re-applica i default privileges, quindi se la tabella era già esposta i `GRANT` esistenti continuano a coprirla. Nessun nuovo `GRANT` necessario per `ALTER TABLE ... ADD COLUMN`.

## Sequenze

Per tabelle con `serial`/`bigserial` o sequenze esplicite usate da `INSERT`, ricordarsi di:

```sql
grant usage, select on sequence public.<seq_name> to authenticated, service_role;
```

Le tabelle con `uuid default gen_random_uuid()` non hanno questo problema.

## Rollback per singola tabella

Se una migration appena applicata rompe il frontend con errore `42501`, applicare il grant mancante:

```sql
grant select, insert, update, delete on public.<table> to anon, authenticated, service_role;
```

(Adattare i ruoli al pattern voluto. Fix temporaneo: prossima migration deve correggere alla radice.)

## Riferimenti

- [Discussione Supabase #45329](https://github.com/orgs/supabase/discussions/45329)
- [Supabase Agent Skill](https://supabase.com/blog/supabase-agent-skills) — già aware della convenzione GRANT, utile come fonte se in futuro si usa via MCP/agent
- Migration `supabase/migrations/00006_explicit_grants_opt_in.sql`
