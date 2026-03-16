-- Fase 5 — Notifiche + Community
-- Tabelle per push subscriptions, preferenze notifiche, e supporto moderazione

-- ============================================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================================

create table push_subscriptions (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index idx_push_subscriptions_user on push_subscriptions (user_id);

create trigger trg_push_subscriptions_updated_at before update on push_subscriptions
  for each row execute function update_updated_at();

-- ============================================================================
-- NOTIFICATION PREFERENCES
-- ============================================================================

create table notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default true,
  expiry_intervals integer[] not null default '{30,7,1}',
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start integer not null default 22 check (quiet_hours_start between 0 and 23),
  quiet_hours_end integer not null default 8 check (quiet_hours_end between 0 and 23),
  max_notifications_per_day integer not null default 5 check (max_notifications_per_day > 0),
  timezone text not null default 'Europe/Rome',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_notification_preferences_updated_at before update on notification_preferences
  for each row execute function update_updated_at();

-- ============================================================================
-- ADMIN SUPPORT
-- ============================================================================

-- Funzione helper: verifica se un utente è admin (basato su app_metadata)
create or replace function is_admin(p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select raw_app_meta_data->>'is_admin' = 'true'
     from auth.users where id = p_user_id),
    false
  );
$$;

-- ============================================================================
-- COMMUNITY: TRUST SCORING
-- ============================================================================

-- Funzione per calcolare il peso di fiducia di un utente
-- weight = (approved + 1) / (approved + rejected + 1)
create or replace function user_trust_weight(p_user_id uuid)
returns numeric
language sql
security definer
stable
as $$
  select case
    when is_admin(p_user_id) then 999.0
    else (
      select (count(*) filter (where status = 'approved') + 1)::numeric /
             (count(*) filter (where status = 'approved') + count(*) filter (where status = 'rejected') + 1)::numeric
      from community_contributions
      where user_id = p_user_id
    )
  end;
$$;

-- Funzione per calcolare il peso totale di un cluster di contribuzioni coerenti
-- Usata per auto-approvazione per consenso
create or replace function contribution_cluster_weight(
  p_contribution_type text,
  p_barcode text,
  p_normalized_name text
)
returns numeric
language sql
security definer
stable
as $$
  select coalesce(sum(user_trust_weight(c.user_id)), 0)
  from community_contributions c
  where c.status = 'pending'
    and c.contribution_type = p_contribution_type
    and (
      (p_barcode is not null and c.data->>'barcode' = p_barcode)
      or (p_normalized_name is not null and lower(trim(c.data->>'name')) = p_normalized_name)
    );
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table push_subscriptions enable row level security;
alter table notification_preferences enable row level security;

-- push_subscriptions: utente gestisce solo le proprie
create policy "Utente vede proprie push subscriptions"
  on push_subscriptions for select
  to authenticated
  using (user_id = auth.uid());

create policy "Utente inserisce proprie push subscriptions"
  on push_subscriptions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Utente aggiorna proprie push subscriptions"
  on push_subscriptions for update
  to authenticated
  using (user_id = auth.uid());

create policy "Utente elimina proprie push subscriptions"
  on push_subscriptions for delete
  to authenticated
  using (user_id = auth.uid());

-- notification_preferences: utente gestisce solo le proprie
create policy "Utente vede proprie preferenze notifiche"
  on notification_preferences for select
  to authenticated
  using (user_id = auth.uid());

create policy "Utente inserisce proprie preferenze notifiche"
  on notification_preferences for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Utente aggiorna proprie preferenze notifiche"
  on notification_preferences for update
  to authenticated
  using (user_id = auth.uid());

-- community_contributions: admin può vedere tutte le contribuzioni per moderazione
create policy "Admin vede tutte le contribuzioni"
  on community_contributions for select
  to authenticated
  using (is_admin(auth.uid()));

create policy "Admin aggiorna contribuzioni"
  on community_contributions for update
  to authenticated
  using (is_admin(auth.uid()));
