-- Accès en lecture pour le site terrain et le portail de supervision.
-- À appliquer après 20261119000002_securite.sql.

grant execute on function public.referentiel_lieux() to anon, service_role;

create or replace function public.get_expected_locations()
returns table (secteur text, unite text, emplacement text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.secteur, r.unite, r.emplacement
  from public.referentiel_lieux() r
  order by r.ordre;
$$;

revoke execute on function public.get_expected_locations() from public;
grant execute on function public.get_expected_locations() to anon, service_role;

-- La clé service_role contourne les RLS mais pas les privilèges de table.
grant select on table public.rapporteurs, public.rapports_lf, public.rapports_nissan, public.rapports_st
  to service_role;

notify pgrst, 'reload schema';
