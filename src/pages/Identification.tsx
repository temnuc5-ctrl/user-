import { FormEvent, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useRapport } from "../context/RapportContext";
import { BoutonPrincipal, Entete, EnTetePage, Note } from "../components/Chrome";

const LONGUEUR_MAX = 60;
const MOTIF = /^\p{L}[\p{L}\p{M} '’-]*$/u;

const normaliser = (valeur: string) => valeur.replace(/\s+/g, " ").trim();

function verifier(valeur: string, sujet: string): string | null {
  if (!valeur) return `${sujet} est obligatoire.`;
  if (valeur.length > LONGUEUR_MAX) return `${sujet} : ${LONGUEUR_MAX} caractères maximum.`;
  if (!MOTIF.test(valeur)) return `${sujet} : lettres, espaces, tirets et apostrophes uniquement.`;
  return null;
}

type Erreurs = { nom: string | null; prenom: string | null };

export default function PageIdentification() {
  const navigate = useNavigate();
  const { etat, maj } = useRapport();
  const [nom, setNom] = useState(etat.rapporteur?.nom ?? "");
  const [prenom, setPrenom] = useState(etat.rapporteur?.prenom ?? "");
  const [erreurs, setErreurs] = useState<Erreurs>({ nom: null, prenom: null });
  const refNom = useRef<HTMLInputElement>(null);
  const refPrenom = useRef<HTMLInputElement>(null);

  if (!etat.secteur) return <Navigate to="/rapport/secteur" replace />;

  function valider(e: FormEvent) {
    e.preventDefault();
    const nomNet = normaliser(nom);
    const prenomNet = normaliser(prenom);
    const suivantes: Erreurs = {
      nom: verifier(nomNet, "Le nom"),
      prenom: verifier(prenomNet, "Le prénom"),
    };
    setErreurs(suivantes);
    if (suivantes.nom) {
      refNom.current?.focus();
      return;
    }
    if (suivantes.prenom) {
      refPrenom.current?.focus();
      return;
    }
    maj({ rapporteur: { nom: nomNet, prenom: prenomNet } });
    navigate("/rapport/verification");
  }

  const classeChamp = (erreur: string | null) =>
    `mt-1.5 block min-h-[52px] w-full border bg-[#fdfcf6] px-3.5 text-[16px] text-encre outline-none transition placeholder:text-acier/45 focus:bg-white ${
      erreur ? "border-argile/60 focus:border-argile" : "border-sable focus:border-pin"
    }`;

  return (
    <div className="min-h-screen pb-12">
      <Entete etape={2} />

      <main className="mx-auto w-full max-w-xl px-5">
        <EnTetePage
          surtitre="Contrôle terrain · identité"
          titre="Qui effectue le contrôle ?"
          description={
            <span>
              Votre nom et votre prénom sont enregistrés avec le rapport transmis.
            </span>
          }
        />

        <div className="monter d1 mt-6 flex items-stretch border border-sable bg-[#fdfcf6]">
          <div className="flex flex-1 items-center gap-3 px-4 py-3">
            <span className="etiquette text-[8px] text-acier">Secteur</span>
            <span className="display text-[20px] leading-none text-pin">{etat.secteur}</span>
          </div>
          <Link
            to="/rapport/secteur"
            className="flex items-center border-l border-sable px-4 text-[11px] font-medium text-pin underline decoration-citron-fonce decoration-2 underline-offset-4 transition hover:bg-pin/[0.04]"
          >
            Modifier
          </Link>
        </div>

        <form onSubmit={valider} noValidate className="monter d2 carte regle-haute mt-4 p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="nom" className="flex items-center justify-between text-[12px] font-medium text-pin">
                Nom
                <span className="etiquette text-[7px] text-acier/60">obligatoire</span>
              </label>
              <input
                id="nom"
                ref={refNom}
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                onBlur={() => nom.trim() && setErreurs((p) => ({ ...p, nom: verifier(normaliser(nom), "Le nom") }))}
                autoComplete="family-name"
                maxLength={LONGUEUR_MAX + 20}
                aria-invalid={erreurs.nom ? "true" : undefined}
                aria-describedby={erreurs.nom ? "erreur-nom" : undefined}
                placeholder="Ex. FNOUNE"
                className={classeChamp(erreurs.nom)}
              />
              {erreurs.nom && (
                <p id="erreur-nom" role="alert" className="mt-1.5 text-[11px] text-argile">
                  {erreurs.nom}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="prenom" className="flex items-center justify-between text-[12px] font-medium text-pin">
                Prénom
                <span className="etiquette text-[7px] text-acier/60">obligatoire</span>
              </label>
              <input
                id="prenom"
                ref={refPrenom}
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                onBlur={() => prenom.trim() && setErreurs((p) => ({ ...p, prenom: verifier(normaliser(prenom), "Le prénom") }))}
                autoComplete="given-name"
                maxLength={LONGUEUR_MAX + 20}
                aria-invalid={erreurs.prenom ? "true" : undefined}
                aria-describedby={erreurs.prenom ? "erreur-prenom" : undefined}
                placeholder="Ex. Yassine"
                className={classeChamp(erreurs.prenom)}
              />
              {erreurs.prenom && (
                <p id="erreur-prenom" role="alert" className="mt-1.5 text-[11px] text-argile">
                  {erreurs.prenom}
                </p>
              )}
            </div>
          </div>

          <p className="mt-4 text-[10px] leading-5 text-acier/80">
            60 caractères maximum · lettres, espaces, tirets et apostrophes. Ces informations servent uniquement au
            suivi des contrôles.
          </p>

          <div className="mt-6 flex flex-col gap-3 border-t border-sable/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/rapport/secteur"
              className="order-2 text-center text-[12px] text-acier underline decoration-sable underline-offset-4 transition hover:text-pin sm:order-1 sm:text-left"
            >
              Retour au secteur
            </Link>
            <BoutonPrincipal type="submit" className="order-1 w-full sm:order-2 sm:w-auto">
              Continuer
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="square" />
              </svg>
            </BoutonPrincipal>
          </div>
        </form>

        <div className="monter d3 mt-5">
          <Note>Aucun compte ni mot de passe. Une seule identification suffit pour toute la ronde.</Note>
        </div>
      </main>
    </div>
  );
}
