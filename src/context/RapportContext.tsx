import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { REFERENTIEL, chargerReferentiel } from '../api/referentiel';
import type { CleCritere, Rapporteur, Referentiel, Reponse, Secteur } from '../types';

export interface EtatRapport {
  secteur: Secteur | null;
  rapporteur: Rapporteur | null;
  unite: string;
  emplacement: string;
  reponses: Partial<Record<CleCritere, Reponse>>;
  remarques: string;
}

interface RapportContextValue {
  etat: EtatRapport;
  maj: (partiel: Partial<EtatRapport>) => void;
  reinitialiserControle: () => void;
  referentiel: Referentiel;
  referentielDistant: boolean;
}

const ETAT_INITIAL: EtatRapport = {
  secteur: null,
  rapporteur: null,
  unite: '',
  emplacement: '',
  reponses: {},
  remarques: '',
};
const RapportContext = createContext<RapportContextValue | null>(null);

function lireEtat(): EtatRapport {
  try {
    const saved = sessionStorage.getItem('rapport-etat');
    if (!saved) return ETAT_INITIAL;
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') return ETAT_INITIAL;
    return { ...ETAT_INITIAL, ...(parsed as Partial<EtatRapport>) };
  } catch {
    return ETAT_INITIAL;
  }
}

export function RapportProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<EtatRapport>(ETAT_INITIAL);
  const [etatInitialise, setEtatInitialise] = useState(false);
  const [referentiel, setReferentiel] = useState<Referentiel>(REFERENTIEL);
  const [referentielDistant, setReferentielDistant] = useState(false);

  useEffect(() => {
    setEtat(lireEtat());
    setEtatInitialise(true);
  }, []);

  // Le référentiel embarqué s'affiche immédiatement ; la version Supabase,
  // si elle est publiée, le remplace sans bloquer le parcours terrain.
  useEffect(() => {
    let actif = true;
    chargerReferentiel()
      .then((distant) => {
        if (actif && distant) {
          setReferentiel(distant);
          setReferentielDistant(true);
        }
      })
      .catch(() => undefined);
    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    if (!etatInitialise) return;
    try {
      sessionStorage.setItem('rapport-etat', JSON.stringify(etat));
    } catch {
      return;
    }
  }, [etat, etatInitialise]);

  const maj = useCallback(
    (partiel: Partial<EtatRapport>) => setEtat((precedent) => ({ ...precedent, ...partiel })),
    [],
  );

  const reinitialiserControle = useCallback(
    () =>
      setEtat((precedent) => ({
        ...precedent,
        unite: '',
        emplacement: '',
        reponses: {},
        remarques: '',
      })),
    [],
  );

  const value = useMemo(
    () => ({ etat, maj, reinitialiserControle, referentiel, referentielDistant }),
    [etat, maj, reinitialiserControle, referentiel, referentielDistant],
  );

  return <RapportContext.Provider value={value}>{etatInitialise ? children : null}</RapportContext.Provider>;
}

export function useRapport(): RapportContextValue {
  const context = useContext(RapportContext);
  if (!context) throw new Error('useRapport doit être utilisé dans RapportProvider');
  return context;
}
