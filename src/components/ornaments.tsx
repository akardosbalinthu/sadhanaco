/**
 * Statikus díszítőelemek A Társaság felületéhez: hajszálvékony antik arany vonalak,
 * iránytű-elválasztó és a négy rend minimalista címere. Nincs animáció, nincs adat.
 */

type SvgProps = { className?: string };

/** Szekcióelválasztó: két arany vonal, középen apró iránytűrózsa. */
export function CompassDivider({ className = "" }: SvgProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/60" />
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth={1}>
        <circle cx="12" cy="12" r="9.5" strokeOpacity={0.6} />
        <path d="M12 3.5 13.6 12 12 20.5 10.4 12Z" fill="currentColor" fillOpacity={0.35} />
        <path d="M3.5 12 12 10.6 20.5 12 12 13.4Z" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/60" />
    </div>
  );
}

/** Kártyakeret apró arany sarokdíszekkel. */
export function GildedCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const corner = "pointer-events-none absolute h-3 w-3 border-gold/70";
  return (
    <div
      className={`relative rounded-md border border-line bg-paper p-6 transition-all duration-300 hover:border-gold/60 ${className}`}
    >
      <span className={`${corner} left-1.5 top-1.5 border-l border-t`} aria-hidden />
      <span className={`${corner} right-1.5 top-1.5 border-r border-t`} aria-hidden />
      <span className={`${corner} bottom-1.5 left-1.5 border-b border-l`} aria-hidden />
      <span className={`${corner} bottom-1.5 right-1.5 border-b border-r`} aria-hidden />
      {children}
    </div>
  );
}

const crestBase = {
  viewBox: "0 0 48 56",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Közös pajzsforma, amelybe a rend jelképe kerül. */
function Shield({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg {...crestBase} className={className} aria-hidden>
      <path d="M24 3 43 9v17c0 13-8.5 22-19 27C13.5 48 5 39 5 26V9Z" className="text-gold" stroke="currentColor" />
      <path d="M24 7.5 39 12.3V26c0 10.6-6.8 18-15 22.2C15.8 44 9 36.6 9 26V12.3Z" strokeOpacity={0.25} className="text-gold" stroke="currentColor" />
      <g className="text-forest">{children}</g>
    </svg>
  );
}

/** Tündék — finom érzékelés: csillag a levél fölött. */
export function CrestTundek({ className }: SvgProps) {
  return (
    <Shield className={className}>
      <path d="M24 40c-6-5-7-12-0-20 7 8 6 15 0 20Z" />
      <path d="M24 40V24" />
      <path d="M24 13.5v4M22 15.5h4" />
    </Shield>
  );
}

/** Hobbitok — jelenlét és belső béke: makk, a nyugalom magja. */
export function CrestHobbitok({ className }: SvgProps) {
  return (
    <Shield className={className}>
      <path d="M17 25h14c0-3.5-3-6-7-6s-7 2.5-7 6Z" />
      <path d="M18 25c0 7 2.5 12 6 14 3.5-2 6-7 6-14" />
      <path d="M24 19v-3" />
    </Shield>
  );
}

/** Törpök — állhatatosság és belső rend: hegy, alatta szilárd alap. */
export function CrestTorpok({ className }: SvgProps) {
  return (
    <Shield className={className}>
      <path d="M13 36 21 22l4 6 3-4 7 12Z" />
      <path d="M19.5 25.5 21 22l2 3" />
      <path d="M14 39.5h20" />
    </Shield>
  );
}

/** Vándorok — bátorság és fókusz: kanyargó ösvény egy vezércsillag felé. */
export function CrestVandorok({ className }: SvgProps) {
  return (
    <Shield className={className}>
      <path d="M20 41c6-3-4-7 2-11s8-4 4-8" />
      <path d="M28 14.5 29 17l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
    </Shield>
  );
}
