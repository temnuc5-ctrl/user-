export type Secteur = 'LF' | 'NISSAN' | 'ST';
export type Reponse = 'BON' | 'MANQUE' | 'NON CONFORME' | 'N/A';
export type CleCritere =
  | 'pomme' | 'vanne_1' | 'palette' | 'vanne_2' | 'vasque' | 'rampe_2_sorties'
  | 'erogateurs' | 'tige_commande' | 'pedale' | 'flotteur' | 'ressort' | 'qualite_eau';
export interface Lieu { secteur: Secteur; unite: string; emplacement: string }
export interface Referentiel {
  lieux: Lieu[];
  reponses: Record<Secteur, { defaut: Reponse[]; qualite_eau: Reponse[] }>;
}
export interface Rapporteur { nom: string; prenom: string }
export interface PayloadRapport {
  secteur: Secteur;
  rapporteur: Rapporteur;
  unite: string;
  emplacement: string;
  reponses: Record<CleCritere, Reponse>;
  remarques: string;
}
export interface ErreurApi { type: 'validation' | 'doublon' | 'limite' | 'configuration' | 'reseau' | 'serveur'; message: string }
export type ResultatEnvoi =
  | { ok: true; id: string; created_at: string }
  | { ok: false; erreur: ErreurApi };
