create or replace function public.referentiel_lieux()
returns table (secteur text, unite text, emplacement text, ordre bigint)
language sql immutable
set search_path = ''
as $$
  select v.secteur, v.unite, v.emplacement, v.ordre
  from (values
    ('LF', 'RF', 'Étage filtre'),
    ('LF', 'RF', 'RDC'),
    ('LF', 'CAP X-Y', '1er étage'),
    ('LF', 'CAP X-Y', 'RDC'),
    ('LF', 'CAP Z', '2ème étage'),
    ('LF', 'CAP Z', 'RDC'),
    ('LF', 'CAP V', '2ème étage'),
    ('LF', 'CAP V', 'RDC'),
    ('LF', 'CAP T', '2ème étage'),
    ('LF', 'CAP T', 'RDC'),
    ('LF', 'CAP U', '2ème étage'),
    ('LF', 'CAP U', 'RDC'),
    ('LF', 'CAP W', '2ème étage'),
    ('LF', 'CAP W', 'RDC'),
    ('LF', 'IMAZA', 'RDC'),
    ('NISSAN', 'LA', 'Bassin digesteur'),
    ('NISSAN', 'LA', 'Étage filtre'),
    ('NISSAN', 'LA', 'RDC'),
    ('NISSAN', 'LB', 'Bassin digesteur'),
    ('NISSAN', 'LB', 'Étage filtre'),
    ('NISSAN', 'LB', 'Sous filtre'),
    ('NISSAN', 'LB', 'RDC'),
    ('NISSAN', 'LD', 'Bassin digesteur'),
    ('NISSAN', 'LD', 'Étage filtre'),
    ('NISSAN', 'LD', 'Sous filtre'),
    ('NISSAN', 'LD', 'RDC'),
    ('ST', 'U33', 'RDC'),
    ('ST', 'U04', 'RDC')
  ) with ordinality as v (secteur, unite, emplacement, ordre);
$$;

create or replace function public.lieu_valide(p_secteur text, p_unite text, p_emplacement text)
returns boolean
language sql immutable
set search_path = ''
as $$
  select exists (
    select 1 from public.referentiel_lieux() r
    where r.secteur = p_secteur and r.unite = p_unite and r.emplacement = p_emplacement
  );
$$;

create table public.rapporteurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (nom = btrim(nom) and char_length(nom) between 1 and 60),
  prenom text not null check (prenom = btrim(prenom) and char_length(prenom) between 1 and 60),
  created_at timestamptz not null default now()
);
create unique index rapporteurs_identite_uq on public.rapporteurs (lower(nom), lower(prenom));

create or replace function public.interdire_modification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Les rapports transmis ne sont pas modifiables' using errcode = '42501';
end;
$$;

do $$
declare
  v_secteur text;
  v_table text;
  v_cles text[] := array['pomme', 'vanne_1', 'palette', 'vanne_2', 'vasque', 'rampe_2_sorties',
                         'erogateurs', 'tige_commande', 'pedale', 'flotteur', 'ressort'];
  v_colonnes text;
begin
  select string_agg(
           format('%I text not null check (%I in (''BON'', ''MANQUE'', ''NON CONFORME''))', c, c),
           E',\n        ')
    into v_colonnes
    from unnest(v_cles) as c;

  foreach v_secteur in array array['LF', 'NISSAN', 'ST'] loop
    v_table := 'rapports_' || lower(v_secteur);

    execute format($t$
      create table public.%1$I (
        id uuid primary key default gen_random_uuid(),
        rapporteur_id uuid not null references public.rapporteurs (id) on delete restrict,
        unite text not null,
        emplacement text not null,
        %2$s,
        qualite_eau text not null check (qualite_eau in (%3$s)),
        remarques text check (remarques is null or char_length(remarques) <= 500),
        created_at timestamptz not null default now(),
        constraint %4$I check (public.lieu_valide(%5$L, unite, emplacement))
      )$t$,
      v_table,
      v_colonnes,
      case when v_secteur = 'LF'
           then '''BON'', ''MANQUE'', ''NON CONFORME'''
           else '''BON'', ''MANQUE'', ''NON CONFORME'', ''N/A''' end,
      v_table || '_lieu_valide',
      v_secteur);

    execute format('create index %I on public.%I (unite, emplacement, created_at desc)',
                   v_table || '_lieu_idx', v_table);
    execute format('create index %I on public.%I (created_at desc)',
                   v_table || '_date_idx', v_table);
    execute format('create trigger %I before update or delete on public.%I
                    for each row execute function public.interdire_modification()',
                   v_table || '_immuable', v_table);
  end loop;
end;
$$;
