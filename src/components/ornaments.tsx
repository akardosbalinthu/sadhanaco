/**
 * Statikus díszítőelemek A Társaság felületéhez: hajszálvékony antik arany vonalak,
 * iránytű-elválasztó és a négy rend minimalista címere. Nincs animáció, nincs adat.
 */

type SvgProps = { className?: string };

/** Szekcióelválasztó: egy csendes, hajszálvékony vonal, középen apró rombusszal. */
export function CompassDivider({ className = "" }: SvgProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/35" />
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-gold/70" fill="none" stroke="currentColor" strokeWidth={1}>
        <path d="M6 1 11 6 6 11 1 6Z" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/35" />
    </div>
  );
}

/**
 * Nyugodt kártya. Alapból egyszerű, vékony keret, mozgás nélkül; az `ornate` változat
 * (kiemelt elemekhez) apró arany sarokdíszt kap.
 */
export function GildedCard({
  children,
  className = "",
  ornate = false,
}: {
  children: React.ReactNode;
  className?: string;
  ornate?: boolean;
}) {
  const corner = "pointer-events-none absolute h-2.5 w-2.5 border-gold/60";
  return (
    <div className={`relative rounded-lg border border-line bg-paper p-6 ${className}`}>
      {ornate && (
        <>
          <span className={`${corner} left-2 top-2 border-l border-t`} aria-hidden />
          <span className={`${corner} right-2 top-2 border-r border-t`} aria-hidden />
          <span className={`${corner} bottom-2 left-2 border-b border-l`} aria-hidden />
          <span className={`${corner} bottom-2 right-2 border-b border-r`} aria-hidden />
        </>
      )}
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

/** Kertőrzők — jelenlét és belső béke: makk, a türelmesen gondozott növekedés magja. */
export function CrestKertorzok({ className }: SvgProps) {
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

/** Mágusok — az út megtartása és továbbadása: láng egy nyitott könyv fölött („ők tartják a tüzet”). */
export function CrestMagusok({ className }: SvgProps) {
  return (
    <Shield className={className}>
      <path d="M24 26c-4.2-1.8-4.6-6.4-1.2-11 .4 2.6 1.9 3.3 3 1.8 2.6 3.4 2.9 7.5-1.8 9.2Z" />
      <path d="M24 24c-1.6-.9-1.7-2.7-.2-4.4 1.5 1.7 1.6 3.5.2 4.4Z" />
      <path d="M15 31c3-1.5 6-1.5 9 0.5 3-2 6-2 9-0.5v8c-3-1.5-6-1.5-9 0.5-3-2-6-2-9-0.5Z" />
      <path d="M24 31.5v8" />
    </Shield>
  );
}

/** Oldalfejléc: csendes felső felirat, nagy, levegős címsor, opcionális bevezető. */
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="max-w-2xl">
      {eyebrow && <p className="text-xs uppercase tracking-[0.18em] text-gold">{eyebrow}</p>}
      <h1 className="mt-4 text-balance font-serif text-4xl leading-tight text-forest sm:text-5xl">{title}</h1>
      {children && <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink-soft">{children}</div>}
    </header>
  );
}

/** Szakaszcím kisebb felső felirattal. */
export function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="text-xs uppercase tracking-[0.18em] text-gold">{eyebrow}</p>}
      <h2 className="mt-2 text-balance font-serif text-3xl leading-snug text-forest">{title}</h2>
    </div>
  );
}

/** Egységes gombstílusok: nyugodt, jól látható, csak színátmenettel reagál. */
export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-forest bg-forest px-6 py-3 text-[15px] font-medium text-paper transition-colors duration-500 hover:bg-forest/85 disabled:opacity-60";
export const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-forest/40 px-6 py-3 text-[15px] text-forest transition-colors duration-500 hover:border-forest hover:bg-paper-deep";
export const inputClass =
  "w-full rounded-lg border border-line bg-paper-deep/60 px-3.5 py-3 outline-none transition-colors duration-500 focus:border-gold";
export const linkClass =
  "text-forest underline decoration-gold/50 underline-offset-4 transition-colors duration-500 hover:decoration-gold";
