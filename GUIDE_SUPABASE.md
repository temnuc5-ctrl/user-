# Guide de mise en service — Contrôle des douches de sécurité

## 1. Ce qui est déjà en place

| Élément | État |
|---|---|
| Projet Supabase `ayshwltvfmrlnkswpjld` | Connecté, tables `rapporteurs` et `rapports_*` opérationnelles |
| Données du classeur source | **31 contrôles importés** (LF 15 · NISSAN 11 · ST 5), y compris U33 ×3 et U04 ×2 |
| Fidélité au classeur | **372/372 cellules de contrôle identiques**, 31/31 remarques identiques |
| Bucket `dashboards` | Créé, public, limité aux fichiers `.xlsx` |
| Portail de supervision | Connexion, lecture des 31 rapports et génération Excel testées de bout en bout |
| Fonction `inserer_rapport` | **absente du projet : à créer (étape 2)** |
| Site terrain | Code prêt ; l'envoi fonctionnera après l'étape 2 |

> La clé `service_role` a circulé dans la conversation : régénérez-la dans
> **Project Settings → API** après la mise en service, puis mettez à jour le serveur.

---

## 2. Action obligatoire : créer la fonction d'envoi

La clé `service_role` permet de lire et d'écrire les données, **pas de créer des
fonctions ou des vues** (DDL). Une seule action est donc requise :

1. Ouvrir **Supabase → SQL Editor → New query**.
2. Coller l'intégralité de `supabase/SETUP.sql` (fourni dans les deux paquets).
3. Cliquer **Run**.

Le script est idempotent. Il crée :

- `inserer_rapport(...)` : seule porte d'écriture du site terrain, avec limite
  anti-abus globale. **La règle « un seul rapport par emplacement toutes les
  10 minutes » a été retirée** : votre classeur contient légitimement trois
  contrôles à `ST / U33 / RDC` et deux à `ST / U04 / RDC`.
- `get_expected_locations()` : référentiel des 28 emplacements attendus, utilisé
  par le portail.
- `v_controles_excel` : vue qui reproduit **exactement** les 18 colonnes de la
  feuille « Détail » (Zone → Remarques), avec `Nb points NC`, `Statut`,
  `Date de contrôle` et `Vérifié par`.
- Les droits `anon` (site terrain) et `service_role` (portail).

À la fin, la requête de vérification doit renvoyer quatre lignes `present = true`
(`inserer_rapport`, `get_expected_locations`, `referentiel_lieux`,
`v_controles_excel`).

---

## 3. Le classeur est le contrat

La feuille **Détail** du fichier fourni fait foi. Le classeur généré la reprend
colonne pour colonne :

`Zone · Unité · Emplacement · Pomme · Vanne 1 · Palette · Vanne 2 · Vasque ·
Rampe 2 sorties · Erogateurs · Tige de commande · Pédale · Flotteur · Ressort ·
Qualité d'eau · Nb points NC · Statut · Remarques (fichier d'origine)`

Une colonne **Date de contrôle** est ajoutée **à la fin** (audit), sans déplacer
ni renommer les colonnes du contrat. La feuille **Synthèse** (graphiques) est
placée en premier pour la lecture du rapport ; **Détail** reste la feuille de
données, avec les 31 lignes dans l'ordre du classeur source.

### Règles de normalisation (aucune valeur de contrôle modifiée)

- `Bon ` → `BON`, `NON CONFORM` → `NON CONFORME`, `MANQUE` → `MANQUE`,
  `N/A` → `N/A`.
- `Etage filtre` → `Étage filtre` (accent), espaces de fin supprimés.
- **`MANQUE` compte comme une anomalie.** C'est la règle majoritaire du
  classeur (comptages manuels). Elle est réglable dans le portail.

### Les 2 seules cellules qui diffèrent du fichier source

Le classeur source mélange deux règles de comptage : certaines lignes comptent
`MANQUE`, d'autres utilisent une formule qui ne compte que `NON CONFORM`.

| Ligne source | Emplacement | Source | Recalculé | Pourquoi |
|---|---|---|---|---|
| 20 | NISSAN · LB · Sous filtre | 0 / CONFORME | 1 / NON CONFORME | `MANQUE` sur un point |
| 30 | ST · U04 · RDC | 9 / NON CONFORME | 10 / NON CONFORME | `MANQUE` sur un point |

Le statut reste `NON CONFORME` dans les deux cas ; seul le compteur gagne 1.
Avec la règle inverse (ignorer `MANQUE`), 14 lignes du classeur deviendraient
conformes à tort. La règle retenue est donc la plus fidèle et la plus sûre.

### Réimporter le classeur

```bash
cd site-supervision
SUPABASE_URL="https://ayshwltvfmrlnkswpjld.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="..." \
node scripts/import-excel.mjs "Dashboard_Douches_Securite.xlsx"          # simulation
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/import-excel.mjs "Dashboard_Douches_Securite.xlsx" --apply  # écriture
```

L'import est refusé si des contrôles existent déjà à la même date : aucun
doublon possible.

---

## 4. Variables d'environnement

### Portail de supervision (`site-supervision/.env`)

```env
ADMIN_NOM=Nom
ADMIN_PRENOM=Prenom
ADMIN_PIN_HASH=...          # node scripts/hash-pin.mjs 123456
ADMIN_SESSION_SECRET=...    # openssl rand -hex 32

SUPABASE_URL=https://ayshwltvfmrlnkswpjld.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   # serveur uniquement, jamais dans le front
SUPABASE_DASHBOARD_BUCKET=dashboards

SITE_NAME=Portail de supervision
SITE_LABEL=Sites LF · NISSAN · ST
```

La clé `anon` est facultative côté serveur : la clé `service_role` suffit.

### Site terrain (`site-terrain/.env`)

```env
VITE_SUPABASE_URL=https://ayshwltvfmrlnkswpjld.supabase.co
VITE_SUPABASE_ANON_KEY=...   # Project Settings → API → anon public
```

Sans clé `anon`, le formulaire affiche un message de configuration explicite ;
le référentiel embarqué reste consultable hors ligne.

---

## 5. Fonctionnement du portail

- **Rapports reçus** : 31 contrôles, KPI, conformité par zone, répartition,
  anomalies par critère, tendance 14 jours, filtres secteur/date/recherche,
  détail dépliable des 12 points. Le réglage « Compter MANQUE comme anomalie »
  recalcule immédiatement les indicateurs.
- **Dashboard Excel** : choix de la période (préréglages), génération, dépôt
  dans le bucket, **lien public** et **lien signé 7 jours**. Sans clé
  `service_role`, un lien temporaire de 15 minutes est servi par le portail.

Le classeur contient : **Synthèse** (5 indicateurs, 4 graphiques natifs Excel,
matrice de vigilance, emplacements prioritaires), **Détail** (contrat source),
**Analyse** (critères × zones, unités, emplacements non reçus).

---

## 6. Déploiement

**Portail** (Netlify/Vercel) :

```bash
npm install
npm run build      # dist/spa + dist/server
```

Variables d'environnement ci-dessus, puis publier `dist/spa` et l'API Express.

**Site terrain** :

```bash
pnpm install
pnpm build
```

**Fonction Edge (optionnelle)** : le paquet contient
`supabase/functions/generate-excel-dashboard/`. Elle n'est pas nécessaire au
portail (génération locale), mais permet de générer le classeur côté Supabase :

```bash
supabase functions deploy generate-excel-dashboard --project-ref ayshwltvfmrlnkswpjld
```

---

## 7. Vérifications utiles

```bash
# La vue de compatibilité doit renvoyer 31 lignes
curl "https://ayshwltvfmrlnkswpjld.supabase.co/rest/v1/v_controles_excel?select=*" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

```sql
-- Dans le SQL Editor
select count(*) from public.v_controles_excel;                 -- 31
select "Zone", count(*) from public.v_controles_excel group by 1; -- LF 15, NISSAN 11, ST 5
select "Statut", count(*) from public.v_controles_excel group by 1;
```
