import Link from "next/link";
import { ArrowRight, CalendarDays, Headphones, Leaf } from "lucide-react";
import { publicEnv } from "@/lib/env";

export const metadata = {
  title: "Kardos Bálint · Meditáció és idegrendszer-fejlesztés",
  description:
    "Légzés, figyelem és testérzékelés — klasszikus gyakorlatok a modern idegtudomány és életmód-orvostan felől megközelítve.",
};

const paths = [
  {
    icon: CalendarDays,
    title: "Nyílt Meditációs Estek",
    text: "Havonta Budapesten, legfeljebb 15 fővel. Külsősöknek és a Társaság tagjainak egyaránt nyitott.",
    href: "/nyilt-estek",
    cta: "Közelgő alkalmak",
    external: false,
  },
  {
    icon: Headphones,
    title: "Podcast",
    text: "5–10 perces epizódok a stressz, a légzés és a figyelem neurobiológiájáról.",
    href: "/podcast",
    cta: "Az epizódokhoz",
    external: false,
  },
  {
    icon: Leaf,
    title: "Sadhana Idegrendszerfejlesztő Társaság",
    text: "Közös gyakorlótér lépcsőzetes tananyaggal és egy közösséggel, ahol tapasztalatot osztunk meg, nem tanácsot.",
    href: publicEnv.NEXT_PUBLIC_TARSASAG_URL,
    cta: "A Társaságról",
    external: true,
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="py-20 sm:py-28">
        <p className="text-sm tracking-wide text-moss-soft">Jelenlét – Tudatosság – Szabadság</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Kardos Bálint</h1>
        <p className="mt-3 text-lg text-ink-soft">Integratív meditációs és idegrendszer-fejlesztő tréner</p>
        <p className="mt-8 max-w-2xl text-ink-soft">
          A légzésszabályozás, a meditáció és a testre irányuló figyelem klasszikus gyakorlatait a
          modern idegtudomány és az életmód-orvostan felől közelítem meg: mit csinál a légzés a
          vagus-tónussal, a szívritmus-variabilitással, és hogyan csendesedik a figyelem. Dogmák és
          misztifikálás nélkül.
        </p>
        <ul className="mt-8 space-y-1.5 text-sm text-ink-soft">
          <li>Életmód-orvostani konzulens</li>
          <li>RYT-500 jógaoktató (Rishikesh, India — 500 órás képzés)</li>
          <li>Az Egy Kedves Üzenet házigazdája</li>
          <li>Az Integrált meditációs és idegrendszer-fejlesztő podcast alkotója</li>
        </ul>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {paths.map(({ icon: Icon, title, text, href, cta, external }) => {
          const body = (
            <>
              <Icon className="h-5 w-5 text-moss" strokeWidth={1.5} aria-hidden />
              <h2 className="mt-4 font-serif text-xl">{title}</h2>
              <p className="mt-2 flex-1 text-sm text-ink-soft">{text}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-moss">
                {cta} <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </span>
            </>
          );
          const cls = "flex flex-col rounded-lg border border-line bg-paper-deep/50 p-6 hover:border-moss-soft";
          return external ? (
            <a key={title} href={href} className={cls}>
              {body}
            </a>
          ) : (
            <Link key={title} href={href} className={cls}>
              {body}
            </Link>
          );
        })}
      </section>
    </main>
  );
}
