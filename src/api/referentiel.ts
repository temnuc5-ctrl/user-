import type { Referentiel, Secteur } from '../types';
import { estConfigure, getClient, avecDelai } from './client';

const SECTEURS: Secteur[] = ['LF', 'NISSAN', 'ST'];
const CLE_CACHE = 'referentiel-lieux-v1';
const DUREE_CACHE = 12 * 60 * 60 * 1000; // 12 h

/** Référentiel embarqué : le formulaire reste utilisable sans réseau. */
export const REFERENTIEL: Referentiel = {
  lieux: [
    { secteur: 'LF', unite: 'RF', emplacement: 'Étage filtre' },
    { secteur: 'LF', unite: 'RF', emplacement: 'RDC' },
    { secteur: 'LF', unite: 'CAP X-Y', emplacement: '1er étage' },
    { secteur: 'LF', unite: 'CAP X-Y', emplacement: 'RDC' },
    { secteur: 'LF', unite: 'CAP Z', emplacement: '2ème étage' },
    { secteur: 'LF', unite: 'CAP Z', emplacement: 'RDC' },
    { secteur: 'LF', unite: 'CAP V', emplacement: '2ème étage' },
    { secteur: 'LF', unite: 'CAP V', emplacement: 'RDC' },
    { secteur: 'LF', unite: 'CAP T', emplacement: '2ème étage' },
    { secteur: 'LF', unite: 'CAP T', emplacement: 'RDC' },
    { secteur: 'LF', unite: 'CAP U', emplacement: '2ème étage' },
    { secteur: 'LF', unite: 'CAP U', emplacement: 'RDC' },
    { secteur: 'LF', unite: 'CAP W', emplacement: '2ème étage' },
    { secteur: 'LF', unite: 'CAP W', emplacement: 'RDC' },
    { secteur: 'LF', unite: 'IMAZA', emplacement: 'RDC' },
    { secteur: 'NISSAN', unite: 'LA', emplacement: 'Bassin digesteur' },
    { secteur: 'NISSAN', unite: 'LA', emplacement: 'Étage filtre' },
    { secteur: 'NISSAN', unite: 'LA', emplacement: 'RDC' },
    { secteur: 'NISSAN', unite: 'LB', emplacement: 'Bassin digesteur' },
    { secteur: 'NISSAN', unite: 'LB', emplacement: 'Étage filtre' },
    { secteur: 'NISSAN', unite: 'LB', emplacement: 'Sous filtre' },
    { secteur: 'NISSAN', unite: 'LB', emplacement: 'RDC' },
    { secteur: 'NISSAN', unite: 'LD', emplacement: 'Bassin digesteur' },
    { secteur: 'NISSAN', unite: 'LD', emplacement: 'Étage filtre' },
    { secteur: 'NISSAN', unite: 'LD', emplacement: 'Sous filtre' },
    { secteur: 'NISSAN', unite: 'LD', emplacement: 'RDC' },
    { secteur: 'ST', unite: 'U33', emplacement: 'RDC' },
    { secteur: 'ST', unite: 'U04', emplacement: 'RDC' },
  ],
  reponses: {
    LF: {
      defaut: ['BON', 'MANQUE', 'NON CONFORME'],
      qualite_eau: ['BON', 'MANQUE', 'NON CONFORME'],
    },
    NISSAN: {
      defaut: ['BON', 'MANQUE', 'NON CONFORME'],
      qualite_eau: ['BON', 'MANQUE', 'NON CONFORME', 'N/A'],
    },
    ST: {
      defaut: ['BON', 'MANQUE', 'NON CONFORME'],
      qualite_eau: ['BON', 'MANQUE', 'NON CONFORME', 'N/A'],
    },
  },
};

interface LigneDistante {
  secteur?: string;
  unite?: string;
  emplacement?: string;
}

function estSecteur(valeur: unknown): valeur is Secteur {
  return SECTEURS.includes(valeur as Secteur);
}

function fusionner(lieux: LigneDistante[]): Referentiel | null {
  const propres = lieux
    .filter((lieu) => estSecteur(lieu.secteur) && lieu.unite?.trim() && lieu.emplacement?.trim())
    .map((lieu) => ({
      secteur: lieu.secteur as Secteur,
      unite: String(lieu.unite).trim(),
      emplacement: String(lieu.emplacement).trim(),
    }));

  if (propres.length < 3) return null;
  // Un emplacement distant inconnu du référentiel embarqué est accepté :
  // les réponses proposées restent celles du secteur.
  return { ...REFERENTIEL, lieux: propres };
}

function lireCache(): Referentiel | null {
  try {
    const brut = localStorage.getItem(CLE_CACHE);
    if (!brut) return null;
    const { expire, lieux } = JSON.parse(brut) as { expire: number; lieux: LigneDistante[] };
    if (!expire || expire < Date.now()) return null;
    return fusionner(lieux);
  } catch {
    return null;
  }
}

function ecrireCache(lieux: LigneDistante[]) {
  try {
    localStorage.setItem(CLE_CACHE, JSON.stringify({ expire: Date.now() + DUREE_CACHE, lieux }));
  } catch {
    /* stockage indisponible : sans conséquence, le référentiel embarqué reste utilisé */
  }
}

/**
 * Récupère le référentiel publié dans Supabase (RPC `referentiel_lieux`).
 * Retourne `null` si le réseau ou la configuration sont indisponibles :
 * l'appelant conserve alors le référentiel embarqué.
 */
export async function chargerReferentiel(): Promise<Referentiel | null> {
  const cache = lireCache();
  if (cache) return cache;
  if (!estConfigure()) return null;

  try {
    const reponse = await avecDelai(
      Promise.resolve(getClient().rpc('referentiel_lieux', {})) as unknown as Promise<{
        data: unknown;
        error: { message?: string } | null;
      }>,
      4000,
    );
    const { data, error } = reponse;
    if (error || !Array.isArray(data)) return null;
    const fusion = fusionner(data as LigneDistante[]);
    if (fusion) ecrireCache(data as LigneDistante[]);
    return fusion;
  } catch {
    return null;
  }
}
