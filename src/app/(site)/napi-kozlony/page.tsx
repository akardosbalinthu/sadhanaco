import { BellOff, CalendarDays, Mail, Newspaper, Printer, Sparkles, Sunrise } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { buttonPrimary, CompassDivider, GildedCard, PageHeader, SectionTitle } from "@/components/ornaments";

export const metadata = {
  title: "Napi Közlöny · Kardos Bálint",
  description:
    "Személyes reggeli újság a leveleidből és a naptáradból: a mesterséges intelligencia éjjel összeállítja, 4:30-kor kinyomtatja — így telefon nélkül is felkészülhetsz a napra.",
};

const STEPS = [
  {
    Icon: Mail,
    title: "Összekapcsolod a leveleidet és a naptáradat",
    text: "Egyszer beállítod, melyik e-mail-fiókodból és naptáradból dolgozzon a Közlöny. Ezután nincs vele több teendőd.",
  },
  {
    Icon: Sparkles,
    title: "Éjjel a mesterséges intelligencia összeállítja",
    text: "Átnézi a beérkezett leveleidet és a napi naptárbejegyzéseidet, kiemeli belőlük, ami aznap számít, és egyetlen áttekinthető lapra szerkeszti: mi vár rád, mire érdemes felkészülnöd, és mi az, ami ráér.",
  },
  {
    Icon: Printer,
    title: "4:30-kor kinyomtatódik",
    text: "A kész lap minden éjjel automatikusan kinyomtatódik a nyomtatódon — A4-es, fekete-fehér oldalon. E-mailről nyomtatásra (Email-to-Print) képes nyomtatóval is működik.",
  },
  {
    Icon: Sunrise,
    title: "Reggel kézbe veszed",
    text: "Felkelsz, és a napod már ott van előtted papíron. Tudod, mikor mi következik, és mi érkezett a levelezésedbe — anélkül, hogy a telefonhoz nyúlnál.",
  },
];

const WHAT = [
  { Icon: CalendarDays, title: "A napod menetrendje", text: "A naptárbejegyzéseidből: mikor, hol, kivel — egy pillantással átlátható sorrendben." },
  { Icon: Mail, title: "Ami a levelekből számít", text: "A beérkezett üzenetek lényege röviden, hogy ne a teljes postafiókot kelljen reggel átnézned." },
  { Icon: Newspaper, title: "Egyetlen lap, eleje és vége", text: "Nem hírfolyam: elolvasod, és tudod, amit tudnod kell. A többi megvár, amíg te döntesz úgy, hogy foglalkozol vele." },
];

const WHY = [
  {
    Icon: BellOff,
    title: "Nincs értesítés",
    text: "A papír nem rezeg, nem villog, és nem húz bele a következő alkalmazásba. A reggeled a tiéd marad.",
  },
  {
    Icon: Newspaper,
    title: "Felkészülten, nem riadtan",
    text: "Ha tudod, mi vár rád, a tested nem vészhelyzetként kezdi a napot. A készenlét helyett tervezéssel indulsz.",
  },
  {
    Icon: Sunrise,
    title: "Az első óra a tiéd",
    text: "A nap első percei kerülhetnek egy rövid légzőgyakorlatra, egy sétára vagy a családra — nem a képernyőre.",
  },
];

export default function DailyGazettePage() {
  return (
    <main className="py-16">
      <PageHeader eyebrow="Várhatóan karácsonytól · Analóg reggel" title="Napi Közlöny">
        <p className="font-serif text-xl text-ink">
          Mi lenne, ha reggel úgy tudnád, mi vár rád aznap, hogy közben egyszer sem nyúlsz a telefonodhoz?
        </p>
        <p>
          A legtöbbünk napja még ágyban fekve elindul: megnézzük a leveleket, a naptárat, az értesítéseket — és
          mire felkelünk, az idegrendszerünk már készenlétben áll. A Napi Közlöny ezt fordítja meg. A mesterséges
          intelligencia éjjel a leveleidből és a naptárbejegyzéseidből összeállítja a személyes napi újságodat,
          és kinyomtatja, hogy reggel telefon nélkül is felkészülhess a napra.
        </p>
      </PageHeader>

      <CompassDivider className="my-14" />

      <section>
        <SectionTitle eyebrow="Hogyan működik" title="Négy lépés — ebből csak az elsőt kell neked megtenned." />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title}>
              <GildedCard className="h-full">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-2xl text-gold">{i + 1}</span>
                  <Icon className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
                </div>
                <h3 className="mt-3 font-serif text-lg text-forest">{title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{text}</p>
              </GildedCard>
            </li>
          ))}
        </ol>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Mi kerül a lapra" title="A te napod, papíron." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {WHAT.map(({ Icon, title, text }) => (
            <GildedCard key={title}>
              <Icon className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
              <h3 className="mt-4 font-serif text-lg text-forest">{title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{text}</p>
            </GildedCard>
          ))}
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Miért papír?" title="Mert a reggelnek nem kell sürgősnek lennie." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {WHY.map(({ Icon, title, text }) => (
            <GildedCard key={title}>
              <Icon className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
              <h3 className="mt-4 font-serif text-lg text-forest">{title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{text}</p>
            </GildedCard>
          ))}
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section className="text-center">
        <Newspaper className="mx-auto h-5 w-5 text-gold" strokeWidth={1.25} aria-hidden />
        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-gold">A Társaságban · várhatóan karácsonytól</p>
        <h2 className="mx-auto mt-4 max-w-2xl font-serif text-3xl text-forest">A Napi Közlöny A Társaság része.</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-ink-soft">
          Egyetlen változata van, és A Társaság tagjai külön díj nélkül kapják meg. A Társaságban ez az „Analóg
          Reggel” — a nap első küldetése.
        </p>
        <div className="mt-8">
          <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className={buttonPrimary}>
            Benézek a Társaságba
          </a>
        </div>
      </section>
    </main>
  );
}
