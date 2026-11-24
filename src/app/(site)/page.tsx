import Link from "next/link";
import { ArrowRight, CalendarDays, FlaskConical, Footprints, Heart, Leaf, Newspaper, Users } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { buttonPrimary, buttonSecondary, CompassDivider, GildedCard, SectionTitle } from "@/components/ornaments";

export const metadata = {
  title: "Kardos Bálint · Nyugodtabb idegrendszer, kedvesebb hétköznapok",
  description:
    "Légzés, figyelem és testérzékelés a modern idegtudomány felől — A Társaság online gyakorlóközössége, budapesti Nyílt Meditációs Estek, Egy Kedves Üzenet és Napi Közlöny.",
};

const PATHS = [
  {
    need: "Rendszeresen gyakorolnál, közösségben",
    icon: Leaf,
    title: "A Társaság",
    text: "Online gyakorlóközösség napi 10–15 perces, vezetett gyakorlatokkal, élő közös alkalmakkal és havi túrával. Lépésről lépésre tanítod meg az idegrendszeredet megnyugodni.",
    href: publicEnv.NEXT_PUBLIC_TARSASAG_URL,
    cta: "Megnézem A Társaságot",
    external: true,
    featured: true,
  },
  {
    need: "Előbb személyesen kipróbálnád",
    icon: CalendarDays,
    title: "Nyílt Meditációs Estek",
    text: "Havonta egy nyugodt este Budapesten, legfeljebb 15 fővel. Nem kell hozzá tapasztalat — ez a legjobb kezdőpont.",
    href: "/nyilt-estek",
    cta: "Közelgő alkalmak",
    external: false,
    featured: false,
  },
  {
    need: "Valakinek köszönetet mondanál",
    icon: Heart,
    title: "Egy Kedves Üzenet",
    text: "Megírod, kinek mit köszönnél, én pedig egy meglepetés-telefonhívásban átadom. Díjmentesen, bárkinek.",
    href: "/egy-kedves-uzenet",
    cta: "Hogyan működik",
    external: false,
    featured: false,
  },
  {
    need: "Telefon nélkül kezdenéd a napot",
    icon: Newspaper,
    title: "Napi Közlöny",
    text: "Személyes reggeli újság a leveleidből és a naptáradból, kinyomtatva — hogy telefon nélkül is felkészülhess a napra. Fejlesztés alatt.",
    href: "/napi-kozlony",
    cta: "Bővebben",
    external: false,
    featured: false,
  },
];

const PRINCIPLES = [
  {
    icon: FlaskConical,
    title: "Tudomány, nem dogma",
    text: "Klasszikus légzés- és figyelemgyakorlatok, a modern idegtudomány és az életmód-orvostan nyelvén elmagyarázva.",
  },
  {
    icon: Footprints,
    title: "Gyakorlás, nem teljesítmény",
    text: "Rövid, rendszeres lépések, büntetés és hajtás nélkül. A nyugodtabb idegrendszer nem verseny.",
  },
  {
    icon: Users,
    title: "Közösség, nem egyszemélyes színpad",
    text: "Tapasztalatot osztunk meg, nem tanácsokat. Egymás mellett, egymást megtartva haladunk.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="py-20 sm:py-28">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Jelenlét – Tudatosság – Szabadság</p>
        <h1 className="mt-5 font-serif text-4xl leading-tight text-forest sm:text-5xl">Kardos Bálint</h1>
        <p className="mt-8 max-w-2xl font-serif text-xl leading-relaxed text-ink">
          Kedves üzeneteket kézbesítek, segítek a telefonmentes napindításban, A Társaság tagjaival pedig azon
          dolgozunk, hogy jobb hellyé tegyük a világot — először magunkkal kezdve.
        </p>
        <p className="mt-6 max-w-2xl text-ink-soft">
          A légzés, a figyelem és a testérzékelés klasszikus gyakorlatait tanítom, a modern idegtudomány és az
          életmód-orvostan felől megközelítve: mit csinál a légzés a vagus-tónussal, a szívritmus-változékonysággal,
          és hogyan csendesedik el a figyelem. Dogmák és misztifikálás nélkül — úgy, hogy a hétköznapokban is
          működjön.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className={buttonPrimary}>
            Megnézem A Társaságot
          </a>
          <Link href="/nyilt-estek" className={buttonSecondary}>
            Eljönnék egy Nyílt Estre
          </Link>
        </div>
      </section>

      <CompassDivider className="mb-16" />

      <section>
        <SectionTitle eyebrow="Merre indulsz?" title="Válaszd azt, ami most a tiéd." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PATHS.map(({ need, icon: Icon, title, text, href, cta, external, featured }) => {
            const body = (
              <GildedCard className={`flex h-full flex-col ${featured ? "border-gold/50 p-8" : ""}`}>
                <p className="text-xs uppercase tracking-[0.18em] text-gold">{need}</p>
                <div className="mt-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
                  <h2 className={`font-serif text-forest ${featured ? "text-2xl" : "text-xl"}`}>{title}</h2>
                </div>
                <p className="mt-3 flex-1 text-sm text-ink-soft">{text}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-forest transition-colors duration-300 group-hover:text-gold">
                  {cta} <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                </span>
              </GildedCard>
            );
            const cls = `group block ${featured ? "md:col-span-3" : ""}`;
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
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="A megközelítésem" title="Nyugodt, tiszta, földelt." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <GildedCard key={title}>
              <Icon className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
              <h3 className="mt-4 font-serif text-lg text-forest">{title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{text}</p>
            </GildedCard>
          ))}
        </div>
        <GildedCard className="mt-8 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Végzettségek</p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
            <li>Életmód-tanácsadó (Lifestyle Medicine Consultant, LifestylePro Academy)</li>
            <li>Jógaoktató (RYT-500, Rudra YogPeeth Yoga Ashram, Rishikesh)</li>
          </ul>
        </GildedCard>
      </section>

      <CompassDivider className="my-20" />

      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Ha csak egy dolgot olvasnál el</p>
        <h2 className="mx-auto mt-4 max-w-2xl font-serif text-3xl text-forest">
          Az idegrendszered tanítható. És nem kell egyedül csinálnod.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-ink-soft">
          A Társaságban napi néhány perccel, közösségben tanulod meg, hogyan válts vissza készenlétből
          nyugalomba.
        </p>
        <div className="mt-8">
          <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className={buttonPrimary}>
            Megnézem A Társaságot
          </a>
        </div>
      </section>
    </main>
  );
}
