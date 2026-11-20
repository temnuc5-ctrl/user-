# Analyse des sources — site des rapporteurs

## Règles non négociables

- Aucune donnée fictive ni rapport de démonstration. À la demande de l’utilisateur, les unités et emplacements du formulaire sont actuellement codés en dur dans la page de vérification.
- Les unités, emplacements et réponses sont codés en dur dans `src/api/referentiel.ts`, sans lecture réseau.
- Le navigateur utilise uniquement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Aucune clé secrète ne doit y être présente.
- Le front n’accède jamais directement aux tables. Il appelle uniquement `public.inserer_rapport` par Supabase RPC avec la clé anon ; cette fonction contrôlée écrit le rapporteur et le rapport dans une transaction. Aucune Edge Function ni clé `service_role` n’est utilisée par le parcours de transmission.
- Aucun périmètre non décrit, notamment le site superviseur et l’export Excel, n’est construit.

## Contrat front/back

- `inserer_rapport` : RPC recevant les paramètres SQL `p_secteur`, `p_nom`, `p_prenom`, `p_unite`, `p_emplacement`, `p_reponses` et `p_remarques`; retourne `rapport_id` et `recu_le`. La migration `20261119000002_securite.sql` doit d’abord créer cette fonction ; `20261119000003_rpc_anon.sql` accorde ensuite à `anon` l’exécution de cette seule fonction, sans droit direct sur les tables.
- Les Edge Functions ne font pas partie du parcours d’envoi et ne doivent pas être déployées pour ce formulaire.
- Critères, dans l’ordre : `pomme`, `vanne_1`, `palette`, `vanne_2`, `vasque`, `rampe_2_sorties`, `erogateurs`, `tige_commande`, `pedale`, `flotteur`, `ressort`, `qualite_eau`.

## Incohérences ou limites des sources

- Le document A présente d’abord un dossier `components`, puis précise que les pages sont autonomes et que « Modules d’appui » remplace l’arborescence : la liste de modules d’appui a été retenue.
- A décrit un point d’entrée Vite/`BrowserRouter`, alors que le dépôt fourni est déjà un starter React Router avec rendu serveur. Les modules demandés sont présents, mais le parcours est monté dans le routeur existant afin de rester exécutable dans ce dépôt.
- Le document C (conversation historique) n’a pas été fourni séparément dans le contexte disponible ; aucun contenu ne peut donc en être extrait ni appliqué.

## État Supabase observé

Les tables `rapporteurs`, `rapports_lf`, `rapports_nissan` et `rapports_st` existent dans le projet. Le contrôle `to_regprocedure('public.inserer_rapport(text,text,text,text,text,jsonb,text)')` a renvoyé `NULL` ; la migration `20261119000002_securite.sql`, qui crée la fonction, n’a donc pas été appliquée (ou la fonction a été supprimée). Exécuter cette migration puis `20261119000003_rpc_anon.sql`, et vérifier de nouveau la signature avant de tester un envoi réel.

## Questions ouvertes

- Confirmer si `MANQUE` compte comme anomalie pour les futurs calculs du classeur Excel.
- Confirmer si `N/A` est autorisé pour la qualité d’eau hors LF ; l’implémentation suit provisoirement le référentiel spécifié dans B (NISSAN et ST seulement).
- Confirmer le traitement des lignes Excel en double U33 et U04 ; le référentiel actuel les compte chacune comme un seul emplacement.
- La période de contrôle du suivi superviseur n’est pas une règle métier entièrement fixée ; B propose aujourd’hui, 7 jours, 30 jours ou des dates libres. Le site superviseur est hors périmètre.
- Décider si les noms des rapporteurs peuvent figurer dans l’Excel ; B indique qu’aucun nom ne doit être lu ou écrit avant cette décision.

## Contexte C

Aucune information historique distincte de A et B n’était disponible. Rien de C n’a été appliqué.
