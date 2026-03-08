-- Farmakit — Schema iniziale
-- Catalogo farmaci, armadietti, condivisione, inventario utente, contribuzioni community

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

create extension if not exists "uuid-ossp" with schema extensions;

-- ============================================================================
-- TABELLE
-- ============================================================================

-- Catalogo farmaci (dati AIFA + contribuzioni community)
create table medicines (
  id uuid primary key default extensions.uuid_generate_v4(),
  aic_code text unique,
  name text not null,
  active_ingredient text,
  manufacturer text,
  atc_code text,
  package_description text,
  barcode text,
  source text not null default 'community' check (source in ('aifa', 'community')),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_medicines_barcode on medicines (barcode) where barcode is not null;
create index idx_medicines_name on medicines using gin (to_tsvector('italian', name));
create index idx_medicines_aic on medicines (aic_code) where aic_code is not null;

-- Armadietti / liste dell'utente
create table cabinets (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  icon text,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_cabinets_owner on cabinets (owner_id);

-- Membri dell'armadietto (condivisione selettiva)
create table cabinet_members (
  id uuid primary key default extensions.uuid_generate_v4(),
  cabinet_id uuid not null references cabinets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  unique (cabinet_id, user_id)
);

create index idx_cabinet_members_user on cabinet_members (user_id);
create index idx_cabinet_members_cabinet on cabinet_members (cabinet_id);

-- Farmaci nell'armadietto dell'utente
create table user_medicines (
  id uuid primary key default extensions.uuid_generate_v4(),
  cabinet_id uuid not null references cabinets (id) on delete cascade,
  medicine_id uuid references medicines (id) on delete set null,
  custom_name text,
  quantity integer not null default 1 check (quantity >= 0),
  expiry_date date,
  notes text,
  barcode text,
  notify_before_days integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (medicine_id is not null or custom_name is not null)
);

create index idx_user_medicines_cabinet on user_medicines (cabinet_id);
create index idx_user_medicines_expiry on user_medicines (expiry_date) where expiry_date is not null;
create index idx_user_medicines_medicine on user_medicines (medicine_id) where medicine_id is not null;

-- Contribuzioni community (log)
create table community_contributions (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medicine_id uuid references medicines (id) on delete set null,
  contribution_type text not null check (contribution_type in ('new_medicine', 'barcode_add', 'correction')),
  data jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index idx_contributions_user on community_contributions (user_id);
create index idx_contributions_status on community_contributions (status);

-- ============================================================================
-- FUNZIONI HELPER
-- ============================================================================

-- Verifica se un utente è membro di un armadietto
create or replace function is_cabinet_member(p_cabinet_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from cabinet_members
    where cabinet_id = p_cabinet_id and user_id = p_user_id
  );
$$;

-- Verifica se un utente è owner di un armadietto
create or replace function is_cabinet_owner(p_cabinet_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from cabinet_members
    where cabinet_id = p_cabinet_id and user_id = p_user_id and role = 'owner'
  );
$$;

-- Trigger per aggiornare updated_at
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_medicines_updated_at before update on medicines
  for each row execute function update_updated_at();
create trigger trg_cabinets_updated_at before update on cabinets
  for each row execute function update_updated_at();
create trigger trg_user_medicines_updated_at before update on user_medicines
  for each row execute function update_updated_at();

-- Trigger: quando si crea un armadietto, l'owner viene aggiunto come membro
create or replace function add_owner_as_member()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into cabinet_members (cabinet_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger trg_cabinets_add_owner after insert on cabinets
  for each row execute function add_owner_as_member();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table medicines enable row level security;
alter table cabinets enable row level security;
alter table cabinet_members enable row level security;
alter table user_medicines enable row level security;
alter table community_contributions enable row level security;

-- medicines: lettura pubblica, scrittura solo service role (import AIFA)
create policy "Lettura pubblica catalogo farmaci"
  on medicines for select
  to authenticated
  using (true);

-- cabinets: solo i membri possono vedere/modificare
create policy "Membri vedono i propri armadietti"
  on cabinets for select
  to authenticated
  using (is_cabinet_member(id, auth.uid()));

-- L'owner vede i propri armadietti anche prima che il trigger
-- aggiunga il record in cabinet_members (necessario per INSERT...RETURNING)
create policy "Owner vede i propri armadietti"
  on cabinets for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Utenti autenticati creano armadietti"
  on cabinets for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Solo owner modifica armadietto"
  on cabinets for update
  to authenticated
  using (is_cabinet_owner(id, auth.uid()));

create policy "Solo owner elimina armadietto"
  on cabinets for delete
  to authenticated
  using (is_cabinet_owner(id, auth.uid()));

-- cabinet_members: i membri vedono gli altri membri, solo owner gestisce
create policy "Membri vedono i membri"
  on cabinet_members for select
  to authenticated
  using (is_cabinet_member(cabinet_id, auth.uid()));

create policy "Owner aggiunge membri"
  on cabinet_members for insert
  to authenticated
  with check (is_cabinet_owner(cabinet_id, auth.uid()));

create policy "Owner rimuove membri"
  on cabinet_members for delete
  to authenticated
  using (is_cabinet_owner(cabinet_id, auth.uid()));

-- user_medicines: accesso basato su membership dell'armadietto
create policy "Membri vedono farmaci dell'armadietto"
  on user_medicines for select
  to authenticated
  using (is_cabinet_member(cabinet_id, auth.uid()));

create policy "Membri aggiungono farmaci"
  on user_medicines for insert
  to authenticated
  with check (is_cabinet_member(cabinet_id, auth.uid()));

create policy "Membri modificano farmaci"
  on user_medicines for update
  to authenticated
  using (is_cabinet_member(cabinet_id, auth.uid()));

create policy "Membri rimuovono farmaci"
  on user_medicines for delete
  to authenticated
  using (is_cabinet_member(cabinet_id, auth.uid()));

-- community_contributions: utente vede le proprie, crea nuove
create policy "Utente vede proprie contribuzioni"
  on community_contributions for select
  to authenticated
  using (user_id = auth.uid());

create policy "Utente crea contribuzioni"
  on community_contributions for insert
  to authenticated
  with check (user_id = auth.uid());
