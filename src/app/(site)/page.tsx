import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buttonPrimary, buttonSecondary, CompassDivider, GildedCard, SectionTitle } from "@/components/ornaments";
import { DawnLandscape, EveningLamp, KindCall, Sprout, WindingPath } from "@/components/illustrations";

export const metadata = {
  title: "Kardos Bálint · Találd meg a nyugalmad — és tartsd is meg a hétköznapokban",
  description:
    "Jógikus hátterű gyakorlatok, modern életmód-orvostani keretrendszerben — rád szabva. Nyolc hónapos egyéni, online program meditációval, légzéssel, mozgással, alvással, étkezéssel és kapcsolatokkal.",
};

const BENEFITS = [
  "Saját, személyre szabott gyakorlási terv, nem általános recept",
  "Személyes kísérés: az első négy hónapban hetente, utána havonta találkozunk",
  "Az egész életed számít: a meditáción túl az alvásod, a mozgásod, az étkezésed és a kapcsolataid is",
];

const FOR_WHOM = [
  "sokáig bírod a terhelést, de a nyugalom egyre ritkábban jön magától,",
  "próbáltál már meditálni vagy életmódot váltani, de nem maradt meg,",
  "nem egy újabb alkalmazásra vágysz, hanem személyes kísérésre,",
  "készen állsz arra, hogy időt és figyelmet szánj magadra — most.",
];

const PAIRS = [
  { limb: "Bánásmód másokkal", skt: "jama", pillar: "Társas kapcsolódás" },
  { limb: "Bánásmód önmagunkkal: önfegyelem, mértékletesség, önápolás", skt: "nijama", pillar: "Táplálkozás; kockázatos szerek kerülése" },
  { limb: "Test és tartás", skt: "ászana", pillar: "Mozgás" },
  { limb: "Légzés", skt: "pránájáma", pillar: "Stresszkezelés" },
  { limb: "Az érzékek befelé fordítása, ingercsökkentés", skt: "pratjáhára", pillar: "Alvás" },
  { limb: "Összpontosítás, meditáció, elmélyült jelenlét", skt: "dháraná, dhjána, szamádhi", pillar: "Stresszkezelés, figyelem" },
];

const LAYERS = [
  { title: "Meditáció", text: "Megtanulod szándékosan irányítani a figyelmedet, és olyan rendszeres gyakorlást építesz, amely belefér a napodba." },
  { title: "Idegrendszer-szabályozás", text: "Megérted, mi zajlik a testedben terhelés alatt, és eszközöket kapsz ahhoz, hogy vissza tudj találni a nyugalomba." },
  { title: "Életmódváltás", text: "Az alvás, a mozgás, az étkezés és a szerekhez fűződő viszonyod — lépésről lépésre, a saját tempódban." },
  { title: "Értékek és kapcsolatok", text: "Ahogyan magaddal és másokkal bánsz. A nyugalom a kapcsolatainkban mutatkozik meg igazán." },
];

const INCLUDED = [
  "egyéni alkalmak online: az első négy hónapban heti 60, a második négyben havi 45 perc",
  "személyre szabott gyakorlási terv, amely veled együtt változik",
  "videós és hanganyagos modulok, napi gyakorlás-pipálás és napló a saját felületeden",
  "rövid heti beszámoló két alkalom között, amelyet elolvasok, és visszajelzek rá",
  "díjmentes részvétel a budapesti Nyílt Meditációs Esteken a program ideje alatt",
];

const STEPS = [
  { title: "Felmérés", text: "Nagyjából tíz perc: hol tartasz most a hat életmód-pillér mentén, és mi hozott ide." },
  { title: "Ismerkedő konzultáció", text: "Online beszélgetünk arról, mit szeretnél, és hogy a program jó választás-e neked. Itt beszéljük meg a részleteket és a díjat is." },
  { title: "Indulás", text: "Ha mindketten igent mondunk, elkészítem a személyre szabott tervedet, és elindulunk." },
];

const FAQ = [
  { q: "Mennyibe kerül a program?", a: "A díjat az ismerkedő konzultáción beszéljük meg, személyesen, mert a program a te helyzetedre épül." },
  { q: "Mennyi időt kér naponta?", a: "Reggel és este rövid gyakorlást, emellett hetente néhány hosszabb, elmélyültebb ülést. A pontos ütemet a te napjaidhoz igazítjuk." },
  { q: "Kell hozzá előzetes tapasztalat?", a: "Nem. Ha még sosem meditáltál, az elejéről indulunk; ha már gyakorolsz, onnan folytatjuk, ahol tartasz." },
  { q: "Online vagy személyesen zajlik?", a: "Az egyéni alkalmak online, Google Meeten zajlanak, így bárhonnan részt vehetsz. Budapesten a Nyílt Meditációs Esteken személyesen is találkozhatunk." },
  { q: "Terápia ez?", a: "Nem. A program nem helyettesíti az orvosi vagy pszichológiai kezelést. Ha ilyen kezelés alatt állsz, a konzultáción erről is beszéljünk." },
];

export default function HomePage() {
  return (
    <main>
      <section className="grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Egyéni program · 8 hónap · online</p>
          <h1 className="mt-5 text-balance font-serif text-4xl leading-tight text-forest sm:text-5xl">
            Találd meg a nyugalmad — és tartsd is meg a hétköznapokban.
          </h1>
          <p className="mt-5 font-serif text-xl leading-relaxed text-ink">
            Jógikus hátterű gyakorlatok, modern életmód-orvostani keretrendszerben — rád szabva.
          </p>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Nyolc hónapos egyéni programomban a meditációt, a légzést, a mozgást, az alvást, az étkezést és a
            kapcsolataidat egy egészként nézzük. Így nem egy újabb jó szándék lesz belőle, hanem olyan gyakorlás, amely a
            te napjaidba illeszkedik, és meg is marad.
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
            <Link href="/jelentkezes" className={buttonPrimary}>
              Jelentkezem konzultációra
            </Link>
            <a href="#menete" className={buttonSecondary}>
              Hogyan működik?
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-soft">A jelentkezés egy nagyjából tízperces felméréssel indul.</p>
        </div>
        <DawnLandscape className="mx-auto w-full max-w-md opacity-90 lg:max-w-none" />
      </section>

      <section className="max-w-3xl">
        <SectionTitle eyebrow="Kinek szól?" title="Neked szól, ha…" />
        <ul className="mt-8 space-y-3">
          {FOR_WHOM.map((t) => (
            <li key={t} className="flex items-start gap-3 text-lg text-ink">
              <span className="mt-3 h-px w-5 shrink-0 bg-gold" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </section>

      <CompassDivider className="my-20" />

      <section id="modszer" className="scroll-mt-24">
        <SectionTitle eyebrow="A módszerem" title="Két rendszer, egy út: a jóga nyolc ága és az életmód-orvostan hat pillére." />
        <div className="mt-6 max-w-3xl space-y-4 text-lg leading-relaxed text-ink-soft">
          <p>
            A jóga nyolc ága a belső munka teljes ívét adja: az értékeinktől a testen és a légzésen át a figyelemig és a
            meditációig. Az életmód-orvostan hat pillére a hétköznapi élet alapjait: hogyan eszünk, mozgunk, alszunk,
            hogyan kezeljük a terhelést, mihez nyúlunk, és kikhez kapcsolódunk.
          </p>
          <p>
            A kettőt egyedi módszerré ötvözöm. Az egyik a belső, a másik a külső oldal — együtt az egész embert fogják át,
            nem egy tünetet. Ebben van a program ereje.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-line">
          <div className="hidden grid-cols-2 gap-6 border-b border-line bg-paper-deep/60 px-5 py-3 text-xs uppercase tracking-[0.15em] text-gold sm:grid">
            <span>A jóga ága</span>
            <span>Az életmód-orvostan pillére</span>
          </div>
          <ul>
            {PAIRS.map((p) => (
              <li key={p.skt} className="grid gap-1 border-b border-line px-5 py-4 last:border-b-0 sm:grid-cols-2 sm:gap-6">
                <span className="text-ink">
                  {p.limb} <span className="text-sm italic text-ink-soft">({p.skt})</span>
                </span>
                <span className="text-ink-soft">
                  <span className="text-gold sm:hidden">→ </span>
                  {p.pillar}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {LAYERS.map(({ title, text }) => (
            <div key={title} className="border-t border-gold/30 pt-5">
              <h3 className="font-serif text-xl text-forest">{title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section id="menete" className="scroll-mt-24">
        <SectionTitle eyebrow="A program menete" title="Négy hónap tanulás, négy hónap önálló beépítés." />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <GildedCard ornate className="p-8">
            <Sprout className="h-12 w-12" />
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-gold">1–4. hónap</p>
            <h3 className="mt-2 font-serif text-2xl text-forest">Tanulás és beépítés</h3>
            <p className="mt-3 text-ink-soft">
              Hetente egy 60 perces online alkalom. Először a jelenléttel, majd a tudatossággal foglalkozunk, mindkettőt egy-egy
              integrációs programmal, hogy a gyakorlás a hétköznapjaid része legyen. Két alkalom között rövid heti
              beszámolót írsz, amelyre visszajelzek.
            </p>
          </GildedCard>
          <GildedCard className="p-8">
            <WindingPath className="h-12 w-12" />
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-gold">5–8. hónap</p>
            <h3 className="mt-2 font-serif text-2xl text-forest">Önálló integráció</h3>
            <p className="mt-3 text-ink-soft">
              Havonta egy 45 perces online alkalom. Önállóan gyakorolsz és alakítod az életmódodat, én pedig figyelemmel
              kísérlek, és ott vagyok, ha elakadsz. A tananyag és a napló közben végig a rendelkezésedre áll.
            </p>
          </GildedCard>
        </div>

        <div className="mt-12 max-w-3xl">
          <h3 className="font-serif text-2xl text-forest">Mit kapsz?</h3>
          <ul className="mt-5 space-y-2.5">
            {INCLUDED.map((t) => (
              <li key={t} className="flex items-start gap-3 text-ink-soft">
                <Check className="mt-1 h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section id="jelentkezes" className="scroll-mt-24">
        <SectionTitle eyebrow="Hogyan kerülhetsz be?" title="Három lépés, sietség nélkül." />
        <ol className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t border-gold/30 pt-5">
              <span className="font-serif text-2xl text-gold">{i + 1}.</span>
              <h3 className="mt-2 font-serif text-xl text-forest">{s.title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-3xl rounded-lg bg-paper-deep/70 px-6 py-5 text-ink-soft">
          Őszinte leszek: a konzultációra azokat várom, akik most szeretnének elkezdeni. Ha még nem jött el az ideje, az is
          rendben van — addig szeretettel várlak egy Nyílt Meditációs Esten.
        </p>
        <div className="mt-8">
          <Link href="/jelentkezes" className={buttonPrimary}>
            Kitöltöm a felmérést
          </Link>
        </div>
      </section>

      <CompassDivider className="my-20" />

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
          <p className="font-serif text-xl leading-relaxed text-ink">
            A nevem Kardos Bálint. Integratív meditációs és idegrendszer-fejlesztő tréner, életmód-tanácsadó és jógaoktató
            vagyok. Babócsán, egy somogyi faluban nőttem fel.
          </p>
          <p className="mt-5 text-ink-soft">
            A jóga ősi gyakorlatait az életmód-orvostan keretrendszerével ötvözöm, hogy a meditáció ne csak a párnán, hanem
            a hétköznapokban is működjön: abban, ahogyan alszol, eszel, mozogsz, és ahogyan a többiekhez fordulsz.
          </p>
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
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Gyakori kérdések" title="Amit érdemes tudni, mielőtt jelentkezel" />
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
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Ha most még csak ismerkednél" title="Két másik kapu" />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Link href="/nyilt-estek" className="group block">
            <GildedCard className="h-full transition-colors duration-500 group-hover:border-gold/50">
              <EveningLamp className="mb-5 h-14 w-14" />
              <h3 className="font-serif text-2xl text-forest">Nyílt Meditációs Estek</h3>
              <p className="mt-3 text-[15px] text-ink-soft">
                Havonta egy este Budapesten, legfeljebb 15 emberrel. Közös gyakorlás és személyes jelenlét, telefon és képernyő nélkül.
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-forest">
                Közelgő alkalmak <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </span>
            </GildedCard>
          </Link>
          <Link href="/egy-kedves-uzenet" className="group block">
            <GildedCard className="h-full transition-colors duration-500 group-hover:border-gold/50">
              <KindCall className="mb-5 h-14 w-14" />
              <h3 className="font-serif text-2xl text-forest">Egy Kedves Üzenet</h3>
              <p className="mt-3 text-[15px] text-ink-soft">
                Írj kedves üzenetet valakinek, és én meglepetés-telefonhívásban adom át. Egy hívás, amely emlékeztet: valaki gondol rád.
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-forest">
                Így működik <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </span>
            </GildedCard>
          </Link>
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section className="pb-8 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Ha most kezdenéd</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance font-serif text-3xl leading-snug text-forest sm:text-4xl">
          Az első lépés egy rövid felmérés.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-ink-soft">
          Utána egy ismerkedő beszélgetésen eldöntjük, hogy a program jó választás-e neked.
        </p>
        <div className="mt-8">
          <Link href="/jelentkezes" className={buttonPrimary}>
            Jelentkezem konzultációra
          </Link>
        </div>
      </section>
    </main>
  );
}
