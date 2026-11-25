/**
 * Csendes, vonalas illusztrációk (statikus SVG, nincs animáció). Egységes stílus:
 * hajszálvékony vonal, erdőzöld alap és antik arany kiemelés, sok üres tér.
 * Minden ábra díszítő jellegű (aria-hidden), a jelentést mindig a szöveg hordozza.
 */

type Props = { className?: string };

const line = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Hajnali táj: szelíd dombok, kelő nap és egy lassú, hullámzó lélegzetvonal. */
export function DawnLandscape({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 480 220" className={className} aria-hidden {...line}>
      <g className="text-gold" strokeWidth={1}>
        <circle cx="300" cy="118" r="34" strokeOpacity={0.7} />
        <path d="M300 64v-14M346 82l10-10M254 82l-10-10M362 118h14M224 118h14" strokeOpacity={0.45} />
      </g>
      <g className="text-forest" strokeWidth={1.1}>
        <path d="M0 160c60-34 120-46 180-30s110 22 160 4 100-30 140-20" strokeOpacity={0.55} />
        <path d="M0 182c80-22 150-24 220-10s130 14 190 0 50-8 70-6" strokeOpacity={0.8} />
        <path d="M0 204h480" strokeOpacity={0.25} />
      </g>
      <path
        d="M24 56c22-14 44-14 66 0s44 14 66 0 44-14 66 0"
        className="text-gold"
        strokeWidth={1}
        strokeOpacity={0.55}
        strokeDasharray="2 6"
      />
    </svg>
  );
}

/** Csíra két levéllel — a lassú, türelmes növekedés. */
export function Sprout({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden {...line} strokeWidth={1.2}>
      <path d="M32 56V30" className="text-forest" />
      <path d="M32 36c-10 0-16-6-16-14 9 0 16 5 16 14Z" className="text-forest" />
      <path d="M32 31c0-10 6-16 15-16 0 9-6 16-15 16Z" className="text-gold" />
      <path d="M20 56h24" className="text-forest" strokeOpacity={0.4} />
    </svg>
  );
}

/** Kanyargó ösvény egy kis zászlóig — a lépcsőzetes út. */
export function WindingPath({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden {...line} strokeWidth={1.2}>
      <path d="M24 108c30-6 40-18 22-28s-6-22 24-28 22-18 4-26" className="text-forest" strokeOpacity={0.8} />
      <path d="M78 26V8l14 5-14 5" className="text-gold" />
      <circle cx="24" cy="108" r="2.5" className="text-gold" />
    </svg>
  );
}

/** Ülő kör: középen egy pont, körülötte a társak — közösség, nem színpad. */
export function SittingCircle({ className = "" }: Props) {
  const seats = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    return [60 + Math.cos(a) * 36, 60 + Math.sin(a) * 36] as const;
  });
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden {...line} strokeWidth={1.2}>
      <circle cx="60" cy="60" r="36" className="text-gold" strokeOpacity={0.35} strokeDasharray="2 5" />
      {seats.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" className="text-forest" />
      ))}
      <circle cx="60" cy="60" r="3" className="text-gold" />
    </svg>
  );
}

/** Telefonkagyló apró levéllel — egy kedves üzenet útja. */
export function KindCall({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden {...line} strokeWidth={1.2}>
      <path
        d="M34 30c4-4 10-4 13 1l6 10c2 4 1 8-2 10l-5 3c4 9 11 16 20 20l3-5c2-3 6-4 10-2l10 6c5 3 5 9 1 13l-5 5c-6 6-20 4-36-12S28 36 34 30Z"
        className="text-forest"
      />
      <path d="M78 24c-8 0-13 5-13 12 7 0 13-5 13-12Z" className="text-gold" />
      <path d="M66 36c3-4 7-7 12-8" className="text-gold" strokeOpacity={0.6} />
    </svg>
  );
}

/** Összehajtott újság a kelő nap előtt — telefon nélküli reggel. */
export function MorningPaper({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden {...line} strokeWidth={1.2}>
      <path d="M30 56a30 30 0 0 1 60 0" className="text-gold" strokeOpacity={0.7} />
      <path d="M60 18v-8M84 28l6-6M36 28l-6-6" className="text-gold" strokeOpacity={0.45} />
      <path d="M26 56h68v44H26Z" className="text-forest" />
      <path d="M34 66h22M34 74h22M34 82h22M34 90h14M64 66h22v24H64Z" className="text-forest" strokeOpacity={0.55} />
    </svg>
  );
}

/** Mécses — az esti, csendes közös gyakorlás. */
export function EveningLamp({ className = "" }: Props) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden {...line} strokeWidth={1.2}>
      <path d="M60 36c-7-6-7-14 0-22 7 8 7 16 0 22Z" className="text-gold" />
      <path d="M60 32c-2-2-2-5 0-8 2 3 2 6 0 8Z" className="text-gold" strokeOpacity={0.6} />
      <path d="M40 60h40l-6 22H46Z" className="text-forest" />
      <path d="M60 36v24M34 92h52" className="text-forest" strokeOpacity={0.5} />
    </svg>
  );
}
