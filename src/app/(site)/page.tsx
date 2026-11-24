import Link from "next/link";
import { ArrowRight, CalendarDays, Heart, Leaf, Newspaper } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { CompassDivider, GildedCard, SectionTitle } from "@/components/ornaments";

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
    icon: Heart,
    title: "Egy Kedves Üzenet",
    text: "Hálaüzenetek, amelyeket meglepetés-telefonhívásban adok át annak, akinek szólnak.",
    href: "/egy-kedves-uzenet",
    cta: "Hogyan működik",
    external: false,
  },
  {
    icon: Newspaper,
    title: "Napi Közlöny",
    text: "Reggeli, kinyomtatott újság a telefon helyett — értesítési zaj nélkül.",
    href: "/napi-kozlony",
    cta: "Bővebben",
    external: false,
  },
  {
    icon: Leaf,
    title: "A Társaság",
    text: "Azon dolgozunk, hogy jobb hellyé tegyük a világot — először magunkkal kezdve. Négy rend, napi küldetések, saját karakterkártya és havonta egy közös túra.",
    href: publicEnv.NEXT_PUBLIC_TARSASAG_URL,
    cta: "A Társaságról",
    external: true,
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="py-20 sm:py-28">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Jelenlét – Tudatosság – Szabadság</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">Kardos Bálint</h1>
        <p className="mt-8 max-w-2xl font-serif text-xl text-ink">
          Kedves üzeneteket kézbesítek, segítek a telefonmentes napindításban, A Társaság tagjaival
          pedig azon dolgozunk, hogy jobb hellyé tegyük a világot — először magunkkal kezdve.
        </p>
        <p className="mt-6 max-w-2xl text-ink-soft">
          A légzésszabályozás, a meditáció és a testre irányuló figyelem klasszikus gyakorlatait a
          modern idegtudomány és az életmód-orvostan felől közelítem meg: mit csinál a légzés a
          vagus-tónussal, a szívritmus-variabilitással, és hogyan csendesedik a figyelem. Dogmák és
          misztifikálás nélkül.
        </p>
        <GildedCard className="mt-10 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Végzettségek</p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
            <li>Életmód-tanácsadó (Lifestyle Medicine Consultant, LifestylePro Academy)</li>
            <li>Jógaoktató (RYT-500, Rudra YogPeeth Yoga Ashram, Rishikesh)</li>
          </ul>
        </GildedCard>
      </section>

      <CompassDivider className="mb-16" />

      <section>
        <SectionTitle eyebrow="Utak" title="Merre indulsz?" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {paths.map(({ icon: Icon, title, text, href, cta, external }) => {
            const body = (
              <GildedCard className="flex h-full flex-col">
                <Icon className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
                <h2 className="mt-4 font-serif text-xl text-forest">{title}</h2>
                <p className="mt-2 flex-1 text-sm text-ink-soft">{text}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-forest transition-colors duration-300 group-hover:text-gold">
                  {cta} <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                </span>
              </GildedCard>
            );
            return external ? (
              <a key={title} href={href} className="group block">
                {body}
              </a>
            ) : (
              <Link key={title} href={href} className="group block">
                {body}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
