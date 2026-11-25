import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { buttonPrimary, buttonSecondary, CompassDivider, GildedCard, SectionTitle } from "@/components/ornaments";
import { DawnLandscape, EveningLamp, KindCall, MorningPaper, SittingCircle } from "@/components/illustrations";

export const metadata = {
  title: "Kardos Bálint · Nyugodtabb idegrendszer, kedvesebb hétköznapok",
  description:
    "Légzés, figyelem és testérzékelés a modern idegtudomány alapján, misztikum nélkül. A Társaság online gyakorlóközössége, budapesti Nyílt Meditációs Estek, Egy Kedves Üzenet és Napi Közlöny.",
};

const BENEFITS = [
  "Könnyebben elalszol, és kipihentebben ébredsz",
  "Stresszes helyzetben is nyugodtabban reagálsz",
  "Kevesebbet pörögsz, tisztábban figyelsz",
];

const PATHS = [
  {
    need: "Rendszeresen gyakorolnál, közösségben",
    Art: SittingCircle,
    title: "A Társaság",
    text: "Napi 10–15 perc vezetett gyakorlás, nyolchetes programok és egy közösség, amely megtart. Lépésről lépésre tanítod meg az idegrendszeredet megnyugodni — online, a saját tempódban, élő közös alkalmakkal és havi túrával.",
    note: "A havi tagság első 7 napja díjmentes.",
    href: publicEnv.NEXT_PUBLIC_TARSASAG_URL,
    cta: "Megnézem A Társaságot",
    external: true,
    featured: true,
  },
  {
    need: "Előbb személyesen kipróbálnád",
    Art: EveningLamp,
    title: "Nyílt Meditációs Estek",
    text: "Havonta egy nyugodt este Budapesten, legfeljebb 15 fővel. Nem kell hozzá tapasztalat: ez a legjobb kezdőpont.",
    note: "",
    href: "/nyilt-estek",
    cta: "Közelgő alkalmak",
    external: false,
    featured: false,
  },
  {
    need: "Valakinek jólesne egy kedves szó",
    Art: KindCall,
    title: "Egy Kedves Üzenet",
    text: "Megírod, mit üzennél — köszönetet, bátorítást vagy egy rég kimondatlan mondatot —, én pedig egy meglepetés-telefonhívásban átadom. Bárkinek, díjmentesen.",
    note: "",
    href: "/egy-kedves-uzenet",
    cta: "Így működik",
    external: false,
    featured: false,
  },
  {
    need: "Telefon nélkül kezdenéd a napot",
    Art: MorningPaper,
    title: "Napi Közlöny",
    text: "Személyes reggeli újság a leveleidből és a naptáradból, papíron — hogy a nap első percei a tieid legyenek, ne a képernyőé.",
    note: "A Társaságban, várhatóan karácsonytól.",
    href: "/napi-kozlony",
    cta: "Bővebben",
    external: false,
    featured: false,
  },
];

const PRINCIPLES = [
  {
    title: "Tudomány, nem dogma",
    text: "Ősi meditációs gyakorlatok, a modern idegtudomány és az életmód-orvostan nyelvén elmagyarázva. Mindig tudod, mit miért csinálsz.",
  },
  {
    title: "Gyakorlás, nem teljesítmény",
    text: "Rövid, rendszeres lépések, hajtás és bűntudat nélkül. Nem kell tökéletesnek lenned — elég, ha holnap is leülsz.",
  },
  {
    title: "Közösség, nem egyszemélyes színpad",
    text: "Tapasztalatot osztunk meg, nem tanácsot. Egymás mellett haladunk, és megtartjuk egymást.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Jelenlét · Tudatosság · Szabadság</p>
          <h1 className="mt-5 text-balance font-serif text-4xl leading-tight text-forest sm:text-5xl">
            Nyugodtabb idegrendszer. Kedvesebb hétköznapok.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink">
            Megtanítom, hogyan válts vissza a feszültségből nyugalomba — napi néhány perc légzéssel és figyelemmel, a
            modern idegtudomány alapján, misztikum nélkül.
          </p>
          <ul className="mt-6 space-y-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-ink-soft">
                <Check className="mt-1 h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className={buttonPrimary}>
              Megnézem A Társaságot
            </a>
            <Link href="/nyilt-estek" className={buttonSecondary}>
              Kipróbálnám egy Nyílt Esten
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-soft">A havi tagság első 7 napja díjmentes, és bármikor lemondható.</p>
        </div>
        <DawnLandscape className="mx-auto w-full max-w-md opacity-90 lg:max-w-none" />
      </section>

      <section className="max-w-2xl">
        <p className="font-serif text-xl leading-relaxed text-ink">
          Kardos Bálint vagyok. Kedves üzeneteket kézbesítek, segítek telefon nélkül kezdeni a napot, A Társaság
          tagjaival pedig azon dolgozunk, hogy jobb hellyé tegyük a világot — először magunkkal kezdve.
        </p>
        <p className="mt-5 text-ink-soft">
          A légzés, a figyelem és a testérzékelés ősi meditációs gyakorlatait tanítom, a modern idegtudomány és az
          életmód-orvostan felől megközelítve: megmutatom, hogyan hat a légzés a vagusideg működésére és a
          szívritmus-változékonyságra, és hogyan csendesedik el a figyelem. Dogmák és misztifikálás nélkül — úgy,
          hogy a hétköznapokban is működjön.
        </p>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Hol kezdenéd?" title="Négy út — válaszd azt, amelyikre most szükséged van." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PATHS.map(({ need, Art, title, text, note, href, cta, external, featured }) => {
            const body = (
              <GildedCard
                ornate={featured}
                className={`flex h-full flex-col transition-colors duration-500 group-hover:border-gold/50 ${
                  featured ? "border-gold/40 p-8 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-10" : ""
                }`}
              >
                <div className="flex flex-1 flex-col">
                  {!featured && <Art className="mb-5 h-14 w-14" />}
                  <p className="text-xs uppercase tracking-[0.16em] text-gold">{need}</p>
                  <h2 className={`mt-2 font-serif text-forest ${featured ? "text-3xl" : "text-2xl"}`}>{title}</h2>
                  <p className={`mt-3 flex-1 text-ink-soft ${featured ? "max-w-2xl" : "text-[15px]"}`}>{text}</p>
                  {note && <p className="mt-3 text-sm text-gold">{note}</p>}
                  <span className="mt-6 inline-flex items-center gap-1.5 text-forest">
                    {cta} <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden />
                  </span>
                </div>
                {featured && <Art className="mx-auto mt-8 h-40 w-40 sm:mt-0" />}
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
        <SectionTitle eyebrow="A megközelítésem" title="Érthetően, nyugodtan, dogmák nélkül." />
        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {PRINCIPLES.map(({ title, text }) => (
            <div key={title} className="border-t border-gold/30 pt-5">
              <h3 className="font-serif text-xl text-forest">{title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 max-w-2xl rounded-lg bg-paper-deep/70 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">Végzettségeim</p>
          <ul className="mt-3 space-y-1.5 text-[15px] text-ink-soft">
            <li>Életmód-tanácsadó (Lifestyle Medicine Consultant, LifestylePro Academy)</li>
            <li>Jógaoktató (RYT-500, Rudra YogPeeth Yoga Ashram, Rishikesh)</li>
          </ul>
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section className="pb-8 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Ha csak egy mondatot viszel magaddal</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance font-serif text-3xl leading-snug text-forest sm:text-4xl">
          Az idegrendszered tanítható — és ezt nem kell egyedül csinálnod.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-ink-soft">
          A Társaságban napi néhány perccel, közösségben tanulod meg, hogyan válts vissza készenlétből nyugalomba.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className={buttonPrimary}>
            Megnézem A Társaságot
          </a>
          <p className="text-sm text-ink-soft">7 napig díjmentesen kipróbálhatod.</p>
        </div>
      </section>
    </main>
  );
}
