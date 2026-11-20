-- =============================================================================
--  CONTRÔLE DES DOUCHES DE SÉCURITÉ — installation complète côté Supabase
--  Projet : ayshwltvfmrlnkswpjld
--
--  À coller en une seule fois dans Supabase → SQL Editor → Run.
--  Le script est idempotent : il peut être relancé sans casser l'existant.
--
--  Contenu :
--    1. RLS + fermeture des tables
--    2. Fonction de transmission `inserer_rapport` (seule porte d'écriture)
--    3. Droits d'exécution pour le rôle anon (site terrain)
--    4. Fonctions de lecture du référentiel et des emplacements attendus
--    5. Vérifications finales
-- =============================================================================

-- 1) RLS et fermeture des accès directs ---------------------------------------
alter table public.rapporteurs      enable row level security;
alter table public.rapports_lf      enable row level security;
alter table public.rapports_nissan  enable row level security;
alter table public.rapports_st      enable row level security;

revoke all on table public.rapporteurs, public.rapports_lf, public.rapports_nissan, public.rapports_st
  from anon, authenticated;

-- Le serveur de supervision utilise la clé service_role : on s'assure qu'elle
-- dispose bien de la lecture (elle contourne les RLS mais pas les privilèges).
grant select on table public.rapporteurs, public.rapports_lf, public.rapports_nissan, public.rapports_st
  to service_role;

-- 2) Transmission d'un rapport ------------------------------------------------
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

  -- Limite anti-abus : 60 transmissions par minute, tous secteurs confondus.
  select (select count(*) from public.rapports_lf where created_at > now() - interval '1 minute')
       + (select count(*) from public.rapports_nissan where created_at > now() - interval '1 minute')
       + (select count(*) from public.rapports_st where created_at > now() - interval '1 minute')
    into v_nombre;
  if v_nombre >= 60 then
    raise exception 'limite_globale' using errcode = 'P0001';
  end if;

  -- Aucune règle « un seul rapport par emplacement » : le classeur source
  -- contient trois contrôles à ST / U33 / RDC et deux à ST / U04 / RDC.
  -- Seule la limite globale anti-abus ci-dessus s'applique.

  insert into public.rapporteurs as r (nom, prenom)
  values (btrim(p_nom), btrim(p_prenom))
  on conflict (lower(nom), lower(prenom)) do update set nom = r.nom
  returning r.id into v_rapporteur;

  execute format(
    'insert into public.%I (rapporteur_id, unite, emplacement, %s, remarques)
     values ($1, $2, $3, %s, $5) returning id, created_at',
    v_table,
    (select string_agg(quote_ident(t.c), ', ' order by t.o) from unnest(v_cles) with ordinality as t (c, o)),
    (select string_agg(format('$4->>%L', t.c), ', ' order by t.o) from unnest(v_cles) with ordinality as t (c, o)))
    into rapport_id, recu_le
    using v_rapporteur, btrim(p_unite), btrim(p_emplacement), p_reponses,
          nullif(btrim(coalesce(p_remarques, '')), '');

  return next;
end;
$$;

-- 3) Droits d'exécution ------------------------------------------------------
revoke execute on function public.inserer_rapport(text, text, text, text, text, jsonb, text)
  from public, authenticated;
grant execute on function public.inserer_rapport(text, text, text, text, text, jsonb, text)
  to anon, service_role;

-- 4) Lecture du référentiel (site terrain) et des emplacements attendus -------
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

-- 4 bis) Vue de compatibilité avec la feuille « Détail » du classeur source --
-- Colonnes, ordre et libellés identiques au fichier de référence.
create or replace view public.v_controles_excel as
with tous as (
  select 'LF'::text as zone, unite, emplacement, pomme, vanne_1, palette, vanne_2,
         vasque, rampe_2_sorties, erogateurs, tige_commande, pedale, flotteur,
         ressort, qualite_eau, remarques, created_at, rapporteur_id
  from public.rapports_lf
  union all
  select 'NISSAN', unite, emplacement, pomme, vanne_1, palette, vanne_2,
         vasque, rampe_2_sorties, erogateurs, tige_commande, pedale, flotteur,
         ressort, qualite_eau, remarques, created_at, rapporteur_id
  from public.rapports_nissan
  union all
  select 'ST', unite, emplacement, pomme, vanne_1, palette, vanne_2,
         vasque, rampe_2_sorties, erogateurs, tige_commande, pedale, flotteur,
         ressort, qualite_eau, remarques, created_at, rapporteur_id
  from public.rapports_st
)
select
  t.zone                         as "Zone",
  t.unite                        as "Unité",
  t.emplacement                   as "Emplacement",
  t.pomme                         as "Pomme",
  t.vanne_1                       as "Vanne 1",
  t.palette                       as "Palette",
  t.vanne_2                       as "Vanne 2",
  t.vasque                        as "Vasque",
  t.rampe_2_sorties               as "Rampe 2 sorties",
  t.erogateurs                    as "Erogateurs",
  t.tige_commande                 as "Tige de commande",
  t.pedale                        as "Pédale",
  t.flotteur                      as "Flotteur",
  t.ressort                       as "Ressort",
  t.qualite_eau                   as "Qualité d'eau",
  (case when t.pomme           in ('NON CONFORME','MANQUE') then 1 else 0 end
 + case when t.vanne_1         in ('NON CONFORME','MANQUE') then 1 else 0 end
 + case when t.palette         in ('NON CONFORME','MANQUE') then 1 else 0 end
 + case when t.vanne_2         in ('NON CONFORME','MANQUE') then 1 else 0 end
 + case when t.vasque          in ('NON CONFORME','MANQUE') then 1 else 0 end
 + case when t.rampe_2_sorties in ('NON CONFORME','MANQUE') then 1 else 0 end
 + case when t.erogateurs      in ('NON CONFORME','MANQUE') then 1 else 0 end
 + case when t.tige_commande   in ('NON CONFORME','MANQUE') then 1 else 0 end
 + case when t.pedale          in ('NON CONFORME','MANQUE') then 1 else 0 end
 + case when t.flotteur        in ('NON CONFORME','MANQUE') then 1 else 0 end
 + case when t.ressort         in ('NON CONFORME','MANQUE') then 1 else 0 end
 + case when t.qualite_eau     in ('NON CONFORME','MANQUE') then 1 else 0 end)::int
                                 as "Nb points NC",
  case when (t.pomme in ('NON CONFORME','MANQUE') or t.vanne_1 in ('NON CONFORME','MANQUE')
          or t.palette in ('NON CONFORME','MANQUE') or t.vanne_2 in ('NON CONFORME','MANQUE')
          or t.vasque in ('NON CONFORME','MANQUE') or t.rampe_2_sorties in ('NON CONFORME','MANQUE')
          or t.erogateurs in ('NON CONFORME','MANQUE') or t.tige_commande in ('NON CONFORME','MANQUE')
          or t.pedale in ('NON CONFORME','MANQUE') or t.flotteur in ('NON CONFORME','MANQUE')
          or t.ressort in ('NON CONFORME','MANQUE') or t.qualite_eau in ('NON CONFORME','MANQUE'))
       then 'NON CONFORME' else 'CONFORME' end
                                 as "Statut",
  t.remarques                     as "Remarques (fichier d'origine)",
  t.created_at                    as "Date de contrôle",
  coalesce((select nullif(btrim(r.prenom || ' ' || r.nom), '')
            from public.rapporteurs r where r.id = t.rapporteur_id), '')
                                 as "Vérifié par"
from tous t;

revoke all on public.v_controles_excel from anon, authenticated;
grant select on public.v_controles_excel to service_role;

notify pgrst, 'reload schema';

-- 5) Vérifications (doivent toutes renvoyer une ligne) ------------------------
select 'inserer_rapport' as objet,
       to_regprocedure('public.inserer_rapport(text,text,text,text,text,jsonb,text)') is not null as present
union all
select 'get_expected_locations',
       to_regprocedure('public.get_expected_locations()') is not null
union all
select 'referentiel_lieux',
       to_regprocedure('public.referentiel_lieux()') is not null
union all
select 'v_controles_excel',
       to_regclass('public.v_controles_excel') is not null;
