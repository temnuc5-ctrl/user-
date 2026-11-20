import type { ReactNode } from "react";

export const ETAPES = ["Secteur", "Rapporteur", "Vérification"] as const;

export function Marque({ clair = false }: { clair?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`relative grid h-9 w-9 place-items-center border ${
          clair ? "border-white/25" : "border-pin/25"
        }`}
        aria-hidden="true"
      >
        <span className={`h-2.5 w-2.5 rotate-45 ${clair ? "bg-citron" : "bg-pin"}`} />
        <span
          className={`absolute -bottom-px -right-px h-1.5 w-1.5 ${
            clair ? "bg-citron/70" : "bg-citron-fonce"
          }`}
        />
      </span>
      <span className="leading-tight">
        <span className={`etiquette block text-[8px] ${clair ? "text-white/50" : "text-acier"}`}>
          Contrôle terrain
        </span>
        <span className={`display block text-[15px] ${clair ? "text-white" : "text-pin"}`}>
          Douches de sécurité
        </span>
      </span>
    </div>
  );
}

export function Entete({ etape }: { etape: 1 | 2 | 3 }) {
  return (
    <header className="sticky top-0 z-30 border-b border-sable/90 bg-papier/92 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between px-5 py-3">
        <Marque />
        <div className="text-right">
          <p className="etiquette text-[8px] text-acier">
            Étape {etape}
            <span className="text-sable"> / 3</span>
          </p>
          <p className="mt-1 text-[11px] font-medium text-pin">{ETAPES[etape - 1]}</p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl gap-1 px-5 pb-2.5" aria-hidden="true">
        {ETAPES.map((nom, index) => {
          const numero = index + 1;
          const etat = numero < etape ? "fait" : numero === etape ? "encours" : "avenir";
          return (
            <span
              key={nom}
              className={`h-[3px] flex-1 overflow-hidden ${
                etat === "avenir" ? "bg-sable/70" : "bg-sable/50"
              }`}
            >
              <span
                className={`block h-full origin-left ${
                  etat === "fait" ? "w-full bg-pin" : etat === "encours" ? "w-1/2 bg-citron-fonce" : "w-0"
                }`}
              />
            </span>
          );
        })}
      </div>
      <div className="tirets h-[3px] w-full opacity-60" aria-hidden="true" />
    </header>
  );
}

export function EnTetePage({
  surtitre,
  titre,
  description,
  action,
}: {
  surtitre: string;
  titre: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="monter pt-7 sm:pt-10">
      <p className="flex items-center gap-3 etiquette text-[9px] text-acier">
        <span className="h-px w-6 bg-citron-fonce" aria-hidden="true" />
        {surtitre}
      </p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="display text-[2.1rem] leading-[1.05] text-pin sm:text-[2.5rem]">{titre}</h1>
          {description && <p className="mt-2.5 max-w-md text-[13px] leading-6 text-acier">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function BoutonPrincipal({
  children,
  onClick,
  type = "button",
  disabled,
  variante = "pin",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variante?: "pin" | "citron" | "contour";
  className?: string;
}) {
  const styles =
    variante === "citron"
      ? "bg-citron text-pin-fonce hover:bg-[#d3e28a]"
      : variante === "contour"
        ? "border border-sable bg-transparent text-pin hover:border-pin/40 hover:bg-white/60"
        : "bg-pin text-white hover:bg-pin-fonce";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-12 items-center justify-center gap-2 px-5 text-[14px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Note({ children, ton = "neutre" }: { children: ReactNode; ton?: "neutre" | "ambre" | "argile" }) {
  const styles =
    ton === "ambre"
      ? "border-ambre/40 bg-ambre/[0.07] text-ambre"
      : ton === "argile"
        ? "border-argile/40 bg-argile/[0.06] text-argile"
        : "border-sable bg-white/50 text-acier";
  return (
    <p className={`border-l-2 px-3 py-2.5 text-[11px] leading-5 ${styles}`}>{children}</p>
  );
}
