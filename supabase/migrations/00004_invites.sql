-- Farmakit — Tabella inviti per condivisione armadietti
-- Codice breve 6 caratteri (A-Z0-9), scadenza 7 giorni, nessuna email richiesta

create table invites (
  id uuid primary key default extensions.uuid_generate_v4(),
  cabinet_id uuid not null references cabinets (id) on delete cascade,
  short_code text unique not null,
  token text unique not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_by uuid not null references auth.users (id),
  accepted_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz
);

create index idx_invites_short_code on invites (short_code);
create index idx_invites_cabinet on invites (cabinet_id);
create index idx_invites_status on invites (status) where status = 'pending';

-- RLS
alter table invites enable row level security;

-- Membri dell'armadietto vedono gli inviti
create policy "Membri vedono inviti del proprio armadietto"
  on invites for select
  to authenticated
  using (is_cabinet_member(cabinet_id, auth.uid()));

-- Solo owner può creare inviti (gestito dalla Edge Function con service_role,
-- ma aggiungiamo policy per sicurezza)
create policy "Owner crea inviti"
  on invites for insert
  to authenticated
  with check (is_cabinet_owner(cabinet_id, auth.uid()));

-- Owner può aggiornare inviti (es. revocare)
create policy "Owner aggiorna inviti"
  on invites for update
  to authenticated
  using (is_cabinet_owner(cabinet_id, auth.uid()));

-- Policy per consentire all'editor di rimuoversi da un armadietto condiviso
create policy "Membro rimuove se stesso"
  on cabinet_members for delete
  to authenticated
  using (user_id = auth.uid() and role = 'editor');
