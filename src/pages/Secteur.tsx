import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useRapport } from "../context/RapportContext";
import { Entete, EnTetePage } from "../components/Chrome";

const SECTEURS = ["LF", "NISSAN", "ST"] as const;
type Secteur = (typeof SECTEURS)[number];

export default function PageSecteur() {
  const navigate = useNavigate();
  const { etat, maj, referentiel } = useRapport();

  const secteurs = useMemo(
    () =>
      SECTEURS.map((code) => {
        const lieux = referentiel?.lieux.filter((lieu) => lieu.secteur === code);
        return {
          code,
          unites: lieux ? new Set(lieux.map((lieu) => lieu.unite)).size : null,
          emplacements: lieux?.length ?? null,
        };
      }),
    [referentiel],
  );

  function choisir(code: Secteur) {
    if (etat.secteur !== code) {
      maj({ secteur: code, unite: "", emplacement: "", reponses: {}, remarques: "" });
    }
    navigate("/rapport/identification");
  }

  const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

  return (
    <div className="min-h-screen pb-12">
      <Entete etape={1} />

      <main className="mx-auto w-full max-w-xl px-5">
        <EnTetePage
          surtitre="Contrôle terrain · départ"
          titre="Choisir un secteur"
          description="Sélectionnez la zone où vous effectuez le contrôle. Vous pourrez changer de secteur à tout moment."
        />

        {referentiel.lieux.length === 0 && (
          <p role="alert" className="mt-6 border border-ambre/40 bg-ambre/[0.07] p-4 text-[12px] leading-5 text-ambre">
            Le référentiel des emplacements est vide. Contactez le responsable du site avant de continuer.
          </p>
        )}

        <ul className="monter d1 mt-7 grid gap-3">
          {secteurs.map((s, index) => {
            const actif = etat.secteur === s.code;
            return (
              <li key={s.code}>
                <button
                  type="button"
                  onClick={() => choisir(s.code)}
                  aria-current={actif ? "true" : undefined}
                  className={`group relative flex min-h-[104px] w-full items-center gap-4 overflow-hidden border px-5 py-4 text-left transition ${
                    actif
                      ? "border-pin bg-pin text-white"
                      : "border-sable bg-[#fdfcf6] text-encre hover:-translate-y-px hover:border-pin/35 hover:shadow-[0_18px_34px_-30px_rgba(15,35,31,0.6)]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-0 h-full w-[3px] ${actif ? "bg-citron" : "bg-citron-fonce/70"}`}
                  />
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute -right-2 bottom-0 select-none display text-[5.5rem] leading-none ${
                      actif ? "text-white/[0.06]" : "text-pin/[0.045]"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="relative z-10 min-w-0 flex-1">
                    <span className="flex items-baseline gap-2.5">
                      <span className="display text-[1.9rem] leading-none">{s.code}</span>
                    </span>
                    <span className={`mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] ${actif ? "text-white/65" : "text-acier"}`}>
                      {s.unites !== null && s.emplacements !== null ? (
                        <>
                          <span className="mono">{pluriel(s.unites, "unité")}</span>
                          <span className={actif ? "text-white/25" : "text-sable"}>·</span>
                          <span className="mono">{pluriel(s.emplacements, "emplacement")}</span>
                        </>
                      ) : (
                        <span>Référentiel indisponible</span>
                      )}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center border transition ${
                      actif
                        ? "border-citron/40 bg-white/5 text-citron"
                        : "border-sable text-pin group-hover:border-pin/30 group-hover:bg-pin group-hover:text-white"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="square" />
                    </svg>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="monter d3 mt-8 flex items-center justify-between border-t border-sable/80 pt-4">
          <span className="etiquette text-[8px] text-acier">Douches de sécurité · v2</span>
          <span className="etiquette text-[8px] text-acier/70">Étape 1 / 3</span>
        </div>
      </main>
    </div>
  );
}
