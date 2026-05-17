-- Opt-in al nuovo default Supabase Data API.
-- Vedi: https://github.com/orgs/supabase/discussions/45329
--
-- Da questa migration in poi, le NUOVE tabelle create nello schema `public`
-- NON sono raggiungibili dal Data API (REST/GraphQL via supabase-js) finché
-- non ricevono un GRANT esplicito per i ruoli anon/authenticated/service_role.
--
-- Le tabelle esistenti non vengono toccate (ALTER DEFAULT PRIVILEGES agisce
-- solo sugli oggetti futuri creati dal ruolo `postgres`).

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
