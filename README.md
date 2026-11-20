# Site terrain — Contrôle des douches de sécurité

Formulaire mobile en trois étapes : secteur → rapporteur → vérification des
12 points de contrôle → transmission à Supabase.

## Démarrage

```bash
pnpm install
cp .env.example .env    # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
pnpm dev
```

L'envoi nécessite la fonction `inserer_rapport`, créée par
`supabase/SETUP.sql` (voir `GUIDE_SUPABASE.md`).

Le référentiel embarqué permet de préparer un contrôle hors ligne ; les
réponses sont conservées dans la session jusqu'à la transmission.
