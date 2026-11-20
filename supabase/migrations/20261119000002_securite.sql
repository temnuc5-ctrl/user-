alter table public.rapporteurs enable row level security;
alter table public.rapports_lf enable row level security;
alter table public.rapports_nissan enable row level security;
alter table public.rapports_st enable row level security;

revoke all on table public.rapporteurs, public.rapports_lf, public.rapports_nissan, public.rapports_st
  from anon, authenticated;

create or replace function public.inserer_rapport(
  p_secteur text, p_nom text, p_prenom text, p_unite text, p_emplacement text,
  p_reponses jsonb, p_remarques text
)
returns table (rapport_id uuid, recu_le timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_table text;
  v_rapporteur uuid;
  v_nombre bigint;
  v_cles text[] := array['pomme', 'vanne_1', 'palette', 'vanne_2', 'vasque', 'rampe_2_sorties',
                         'erogateurs', 'tige_commande', 'pedale', 'flotteur', 'ressort', 'qualite_eau'];
begin
  if p_secteur not in ('LF', 'NISSAN', 'ST') or jsonb_typeof(p_reponses) <> 'object' then
    raise exception 'entree invalide' using errcode = '22023';
  end if;
  v_table := 'rapports_' || lower(p_secteur);

  select (select count(*) from public.rapports_lf where created_at > now() - interval '1 minute')
       + (select count(*) from public.rapports_nissan where created_at > now() - interval '1 minute')
       + (select count(*) from public.rapports_st where created_at > now() - interval '1 minute')
    into v_nombre;
  if v_nombre >= 60 then
    raise exception 'limite_globale' using errcode = 'P0001';
  end if;

  execute format(
    'select count(*) from public.%I where unite = $1 and emplacement = $2
       and created_at > now() - interval ''10 minutes''', v_table)
    into v_nombre using p_unite, p_emplacement;
  if v_nombre > 0 then
    raise exception 'doublon_recent' using errcode = 'P0001';
  end if;

  insert into public.rapporteurs as r (nom, prenom)
  values (p_nom, p_prenom)
  on conflict (lower(nom), lower(prenom)) do update set nom = r.nom
  returning r.id into v_rapporteur;

  execute format(
    'insert into public.%I (rapporteur_id, unite, emplacement, %s, remarques)
     values ($1, $2, $3, %s, $5) returning id, created_at',
    v_table,
    (select string_agg(quote_ident(t.c), ', ' order by t.o) from unnest(v_cles) with ordinality as t (c, o)),
    (select string_agg(format('$4->>%L', t.c), ', ' order by t.o) from unnest(v_cles) with ordinality as t (c, o)))
    into rapport_id, recu_le
    using v_rapporteur, p_unite, p_emplacement, p_reponses, nullif(btrim(coalesce(p_remarques, '')), '');

  return next;
end;
$$;

revoke execute on function
  public.referentiel_lieux(), public.lieu_valide(text, text, text), public.interdire_modification(),
  public.inserer_rapport(text, text, text, text, text, jsonb, text)
  from public, anon, authenticated;
