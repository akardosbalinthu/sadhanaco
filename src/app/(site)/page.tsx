import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buttonPrimary, CompassDivider, GildedCard, SectionTitle } from "@/components/ornaments";
import { DawnLandscape } from "@/components/illustrations";

export const metadata = {
  title: "Acélidegek Mentorprogram · Kardos Bálint",
  description:
    "Nyugalom nyomás alatt: 16 hetes, személyes online mentorálás szakértőknek és vezetőknek, tudományos alapon. Foglalj ingyenes, 30 perces konzultációt.",
};

// Az oldal egyetlen célja a konzultációfoglalás. Ár, a program felépítése és a gyakorlatok
// neve itt nem szerepelhet – ezek a konzultáción hangzanak el.
const CTA = "Foglalj konzultációt";
const CTA_NOTE = "Ingyenes, 30 perces online beszélgetés. Semmire nem kötelez.";

// A fő ígéret – szó szerint, nem módosítható.
const PROMISES = [
  "bármilyen helyzetben néhány perc alatt megnyugtasd magad,",
  "kipihentebben ébredj, mint valaha,",
  "nyugodt fejjel dönts akkor is, amikor nagy a nyomás,",
  "fókuszáltabban és eredményesebben dolgozz.",
];

const SITUATIONS = [
  "Holnap fontos prezentációd van, és a feszültséget már ma este a gyomrodban érzed.",
  "Egy tárgyalás vagy nehéz beszélgetés közben elönt a feszültség, és csak utólag jut eszedbe, mit kellett volna mondanod.",
  "Este a kanapén ülsz, de a fejedben még mindig a munkanap pörög.",
  "Hajnali háromkor felébredsz, és a teendőid listáján jár az eszed.",
  "Napközben tízfelé szakadsz, és a nap végén nem tudod, mire ment el az időd.",
];

const BENEFITS = [
  {
    title: "Azonnal",
    items: [
      "Néhány perc alatt megnyugtatod magad stresszes helyzetben: prezentáció, tárgyalás vagy konfliktus előtt.",
      "Lesz egy biztos eszközöd arra a pillanatra, amikor elönt a feszültség.",
    ],
  },
  {
    title: "A hétköznapokban",
    items: [
      "Kipihentebben ébredsz, könnyebben alszol el, ritkábban riadsz fel.",
      "Nem viszed haza a munkahelyi feszültséget, este ki tudsz kapcsolni.",
      "Kevésbé reagálsz túl: nem csattansz fel, és nem rágódsz napokig.",
    ],
  },
  {
    title: "A munkában",
    items: [
      "Hosszabban és mélyebben tudsz koncentrálni.",
      "Nyomás alatt is tiszta fejjel döntesz.",
      "A belső nyugalmad a csapatodra is hat.",
    ],
  },
  {
    title: "Hosszú távon",
    items: [
      "Stabilabb, ellenállóbb idegrendszer, amely mérhető is (szívritmus-variabilitás, HRV).",
      "Kisebb a kiégés kockázata.",
      "Saját eszköztár, amelyet egyedül is használhatsz.",
      "Újra te irányítod az életedet, nem a stressz.",
    ],
  },
];

const PATH = [
  {
    title: "Tudományos alapon",
    text: "A módszer az idegtudományra és az életmód-orvostanra épül, és a jóga gyakorlati bölcsessége egészíti ki. Mindig tudod, mit miért csinálsz.",
  },
  {
    title: "Személyesen, egyénileg",
    text: "Nem csoportos tanfolyam: 16 héten át személyesen mentorállak, online, a te helyzeteidre és a te napirendedre szabva.",
  },
  {
    title: "Mérhetően",
    text: "A fejlődésed nemcsak érzés: mérhető is. Így látod, mit változtat a gyakorlás az idegrendszered működésén.",
  },
];

/**
 * Valós visszajelzések helye. Amíg üres, a szakasz nem jelenik meg.
 * Kitalált vélemény semmilyen formában nem kerülhet ide.
 */
const TESTIMONIALS: { quote: string; name: string; role?: string }[] = [];

const FAQ = [
  {
    q: "Mennyi időt kell rászánnom?",
    a: "Úgy építjük fel, hogy egy zsúfolt hétbe is beleférjen. A pontos időigényt a konzultáción személyesen átbeszéljük.",
  },
  {
    q: "Mennyibe kerül?",
    a: "Az igényeidtől függ: néhány százezer forinttól akár néhány millió forintig terjedhet. A pontos díjat és a részleteket a konzultáción személyesen átbeszéljük, mert a mentorálás a te helyzetedre épül.",
  },
  {
    q: "Mi van, ha nincs időm?",
    a: "A program éppen azoknak készült, akiknek kevés az idejük. Az eszközök néhány perc alatt is működnek, és ott használod őket, ahol szükséged van rájuk: tárgyalás előtt, a hazaúton vagy elalvás előtt.",
  },
  {
    q: "Mi történik a konzultáción?",
    a: "Egy ingyenes, 30 perces online beszélgetés. Megbeszéljük, hol tartasz, mit szeretnél elérni, és hogy a program jó választás-e neked. A részleteket és a díjat is itt beszéljük meg. A beszélgetés semmire nem kötelez.",
  },
  {
    q: "Kell hozzá előzetes tapasztalat?",
    a: "Nem. Ha még sosem foglalkoztál ilyesmivel, az elejéről indulunk; ha már van tapasztalatod, onnan folytatjuk, ahol tartasz.",
  },
  {
    q: "Online zajlik?",
    a: "Igen, teljesen online, így bárhonnan részt vehetsz. Budapesten élek, de a mentorálás nem kötődik helyhez.",
  },
  {
    q: "Terápia ez?",
    a: "Nem. A program életmód- és stresszkezelési mentorálás, nem orvosi vagy pszichológiai kezelés, és nem helyettesíti azt. Ha ilyen kezelés alatt állsz, a konzultáción erről is beszéljünk.",
  },
];

function Cta({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Link href="/konzultacio" className={buttonPrimary}>
        {CTA}
      </Link>
      <p className="mt-3 text-sm text-ink-soft">{CTA_NOTE}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      {/* Nyitó rész: a fő ígéret és a foglalás gomb */}
      <section className="grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Acélidegek Mentorprogram</p>
          <h1 className="mt-5 text-balance font-serif text-4xl leading-tight text-forest sm:text-5xl">
            Vedd újra a kezedbe az életed irányítását.{" "}
            <span className="mt-3 block text-3xl text-ink sm:text-4xl">Az út az idegrendszered fejlesztésén át vezet.</span>
          </h1>
          <p className="mt-8 font-serif text-xl text-ink">16 hét alatt eléred, hogy:</p>
          <ul className="mt-4 space-y-2.5">
            {PROMISES.map((p) => (
              <li key={p} className="flex items-start gap-3 text-lg text-ink-soft">
                <Check className="mt-1.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-xl leading-relaxed text-ink-soft">
            Személyes, online mentorálás szakértőknek, senior munkatársaknak és vezetőknek, akiknek nyomás alatt is jó
            döntéseket kell hozniuk.
          </p>
          <Cta className="mt-8" />
        </div>
        <DawnLandscape className="mx-auto w-full max-w-md opacity-90 lg:max-w-none" />
      </section>

      {/* Ismerős helyzetek */}
      <section className="grid gap-12 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Ismerős?" title="Amikor a nyomás veled megy haza" />
          <ul className="mt-8 space-y-3">
            {SITUATIONS.map((t) => (
              <li key={t} className="flex items-start gap-3 text-lg text-ink">
                <span className="mt-3 h-px w-5 shrink-0 bg-gold" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 self-end text-lg leading-relaxed text-ink-soft">
          <p>
            Ez nem jellemhiba, és nem is gyengeség. Az idegrendszered azt teszi, amire a tartós nyomás megtanította:
            készenlétben marad akkor is, amikor már nem kellene.
          </p>
          <p>
            Egy szabad hétvége vagy egy hosszabb szabadság néhány napig segít. Aztán jön egy nehezebb hét, és minden
            visszaáll a régi kerékvágásba.
          </p>
          <p className="text-ink">Amit az idegrendszered megtanult, azt át is tudja tanulni. Ebben segítek.</p>
          <Cta className="pt-4" />
        </div>
      </section>

      <CompassDivider className="my-20" />

      {/* Mit kapsz */}
      <section id="mit-kapsz" className="scroll-mt-24">
        <SectionTitle eyebrow="Mit kapsz" title="Nyugalom, amely nyomás alatt is megmarad" />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {BENEFITS.map(({ title, items }, i) => (
            <GildedCard key={title} ornate={i === 0} className="p-7">
              <h3 className="font-serif text-2xl text-forest">{title}</h3>
              <ul className="mt-4 space-y-2.5">
                {items.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-ink-soft">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </GildedCard>
          ))}
        </div>
        <Cta className="mt-10" />
      </section>

      <CompassDivider className="my-20" />

      {/* Az út */}
      <section id="az-ut" className="scroll-mt-24">
        <SectionTitle eyebrow="Az út" title="A változás az idegrendszereden át vezet." />
        <div className="mt-6 max-w-3xl space-y-4 text-lg leading-relaxed text-ink-soft">
          <p>
            Az idegrendszered egész nap a készenlét és a nyugalom között vált. Stresszben a készenlét kerül előtérbe:
            felgyorsul a szívverésed, beszűkül a figyelmed, és nehezebb tisztán gondolkodni. A megnyugvás képessége
            azonban tanulható, ugyanúgy, mint bármely más készség.
          </p>
          <p>
            <strong className="font-normal text-forest">Miért Acélidegek?</strong> Az acélideg itt nem érzéketlenséget
            jelent. Azt jelenti, hogy nyomás alatt is nyugodt maradsz: érzed, ami történik, de nem ragad magával.
          </p>
        </div>
        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {PATH.map(({ title, text }) => (
            <div key={title} className="border-t border-gold/30 pt-5">
              <h3 className="font-serif text-xl text-forest">{title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
          <div className="rounded-lg bg-paper-deep/70 px-5 py-4">
            <p className="font-serif text-lg text-forest">Amit a kutatás mutat</p>
            <p className="mt-1 text-[15px] text-ink-soft">
              Egy 2023-as Stanford-vizsgálatban a leghatékonyabbnak bizonyult légzőgyakorlat napi öt percben, egy hónapon
              át végezve mérhetően javította a résztvevők hangulatát, és csökkentette a nyugalmi légzésszámukat. Nem
              csodaszer, de jól mutatja: néhány perc tudatos gyakorlás is számít.
            </p>
          </div>
          <div className="rounded-lg bg-paper-deep/70 px-5 py-4">
            <p className="font-serif text-lg text-forest">Kevés emberrel dolgozom</p>
            <p className="mt-1 text-[15px] text-ink-soft">
              Egyszerre csak kevés emberrel dolgozom, hogy mindenkire jusson figyelem. Így valóban a te helyzeteiddel
              foglalkozunk, nem egy általános tananyaggal.
            </p>
          </div>
        </div>
        <Cta className="mt-10" />
      </section>

      <CompassDivider className="my-20" />

      {/* Rólam */}
      <section className="grid max-w-3xl items-start gap-8 sm:grid-cols-[auto_1fr]">
        <Image
          src="/images/rolam/portre.webp"
          alt="Kardos Bálint portréja"
          width={500}
          height={499}
          sizes="128px"
          className="h-28 w-28 rounded-full border border-gold/40 bg-white object-cover sm:h-32 sm:w-32"
        />
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Rólam</p>
          <h2 className="mt-3 font-serif text-2xl leading-snug text-forest sm:text-3xl">A nevem Kardos Bálint.</h2>
          <p className="mt-4 font-serif text-xl leading-relaxed text-ink">
            Idegrendszer-fejlesztő mentor, légzés- és meditációoktató és holisztikus életmód-tanácsadó vagyok.
          </p>
          <p className="mt-5 text-ink-soft">
            Évekig dolgoztam nagy nyomás alatt: a gyári műszakoktól a szabadúszó online marketingmenedzseri munkáig.
            Csapatokat vezettem, határidők és megtérülési számok között, és megtapasztaltam a kiégést is. Közben
            tizenkét éves korom óta meditálok: ami gyerekként ösztönös menekülőút volt, abból mára tudatos, tudományosan
            megalapozott eszköztár lett.
          </p>
          <p className="mt-4 text-ink-soft">Budapesten élek. A mentorálás teljesen online zajlik, így bárhonnan elérhető.</p>
          <div className="mt-5 rounded-lg bg-paper-deep/70 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gold">Végzettségeim</p>
            <ul className="mt-2 space-y-1 text-[15px] text-ink-soft">
              <li>Életmód-tanácsadó (Lifestyle Medicine Consultant, LifestylePro Academy)</li>
              <li>Jógaoktató (RYT-500, Rudra YogPeeth Yoga Ashram, Rishikesh)</li>
            </ul>
          </div>
          <Link href="/rolam" className="mt-5 inline-flex items-center gap-1.5 text-forest underline decoration-gold/50 underline-offset-4 transition-colors duration-500 hover:decoration-gold">
            Az én történetem <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </Link>
          <Cta className="mt-8" />
        </div>
      </section>

      {TESTIMONIALS.length > 0 && (
        <>
          <CompassDivider className="my-20" />
          <section>
            <SectionTitle eyebrow="Visszajelzések" title="Akikkel már dolgoztam" />
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {TESTIMONIALS.map((t) => (
                <GildedCard key={t.name} className="p-7">
                  <blockquote className="font-serif text-lg leading-relaxed text-ink">„{t.quote}”</blockquote>
                  <p className="mt-4 text-sm text-ink-soft">
                    {t.name}
                    {t.role ? ` · ${t.role}` : ""}
                  </p>
                </GildedCard>
              ))}
            </div>
            <Cta className="mt-10" />
          </section>
        </>
      )}

      <CompassDivider className="my-20" />

      {/* Gyakori kérdések */}
      <section>
        <SectionTitle eyebrow="Gyakori kérdések" title="Amit érdemes tudni, mielőtt foglalsz" />
        <div className="mt-8 max-w-3xl divide-y divide-line border-y border-line">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-forest">
                {q}
                <span className="text-gold transition-transform duration-500 group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
        <Cta className="mt-10" />
      </section>

      <CompassDivider className="my-20" />

      {/* Záró felhívás */}
      <section className="pb-8 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Acélidegek Mentorprogram</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance font-serif text-3xl leading-snug text-forest sm:text-4xl">
          Vedd újra a kezedbe az életed irányítását.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-ink-soft">
          Nyugalom nyomás alatt, kipihent reggelek, tiszta fej a fontos döntéseknél. Az első lépés egy 30 perces
          beszélgetés.
        </p>
        <div className="mt-8 flex justify-center">
          <Cta />
        </div>
        <p className="mx-auto mt-10 max-w-xl text-sm text-ink-soft">
          Ha előbb csak ismerkednél: gyere el egy{" "}
          <Link href="/nyilt-estek" className="text-forest underline decoration-gold/50 underline-offset-4">
            Nyílt Meditációs Estre
          </Link>{" "}
          Budapesten, vagy töltsd ki a{" "}
          <Link href="/jelentkezes" className="text-forest underline decoration-gold/50 underline-offset-4">
            15 kérdéses kérdőívet
          </Link>
          , és nézd meg, hol tartasz most.
        </p>
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-soft">
        <p className="uppercase tracking-[0.16em] text-gold">Forrás</p>
        <p className="mt-2">
          Balban, M. Y. és mtsai. (2023): Brief structured respiration practices enhance mood and reduce physiological
          arousal. Cell Reports Medicine, 4(1)
        </p>
      </footer>
    </main>
  );
}
