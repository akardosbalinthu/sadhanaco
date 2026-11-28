import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buttonPrimary, buttonSecondary, CompassDivider, GildedCard, SectionTitle } from "@/components/ornaments";
import { DawnLandscape, EveningLamp, KindCall, Sprout, WindingPath } from "@/components/illustrations";

export const metadata = {
  title: "Meditáció és idegrendszer-fejlesztés egyénileg · Kardos Bálint",
  description:
    "16 hetes egyéni program jógikus légző- és meditációs gyakorlatokkal, életmód-orvostani keretben, heti személyes alkalommal. Kezdd egy rövid kérdőívvel.",
};

// A felsorolások sorrendje a jóga nyolc ágát követi: önfegyelem és mértékletesség → test → légzés →
// az érzékek befelé fordítása → figyelem → meditáció. A kapcsolatok nem eszköz, hanem eredmény.
const BENEFITS = [
  "Saját gyakorlási terv, amely illeszkedik a napjaidhoz",
  "Személyes kísérés: 16 héten át hetente beszélünk",
  "Az étkezésedtől a mozgáson, a légzésen és az alváson át a figyelmedig és a meditációig: minden számít",
];

// P – a probléma, a látogató saját helyzeteiből
const PROBLEM = [
  "Egész nap pörögsz, és este sem tudsz igazán kikapcsolni.",
  "A fejed akkor is jár, amikor már pihenned kellene.",
  "Egy feszült helyzet után órákig benned marad a feszültség.",
  "A nyugalom egyre ritkábban jön magától – leginkább csak szabadság alatt.",
];

// S – az idegrendszer-fejlesztés, egyszerűen
const NERVOUS_SYSTEM = [
  {
    title: "Megérted, mi történik benned",
    text: "Az idegrendszered egész nap a készenlét és a nyugalom között vált. Megmutatom, hogyan ismerheted fel, melyik állapotban vagy éppen, és mi billent át egyikből a másikba.",
  },
  {
    title: "Megtanulod segíteni a visszaváltást",
    text: "A légzéssel, a figyelemmel és a testérzékeléssel tudatosan segítheted, hogy egy nehéz helyzet után hamarabb visszatalálj a nyugalomhoz. Ez ugyanúgy tanulható, mint bármely más készség.",
  },
  {
    title: "Megteremted hozzá az alapokat",
    text: "Az étkezés, a mozgás és az alvás adja azt a hátteret, amelyre a gyakorlás épülhet. Ezért a meditáció mellett az egész napoddal foglalkozunk.",
  },
];

const PAIRS = [
  { limb: "Bánásmód másokkal", skt: "jama", pillar: "Társas kapcsolódás" },
  { limb: "Bánásmód önmagunkkal: önfegyelem, mértékletesség, önápolás", skt: "nijama", pillar: "Táplálkozás; kockázatos szerek kerülése" },
  { limb: "Test és tartás", skt: "ászana", pillar: "Mozgás" },
  { limb: "Légzés", skt: "pránájáma", pillar: "Stresszkezelés" },
  { limb: "Az érzékek befelé fordítása, ingercsökkentés", skt: "pratjáhára", pillar: "Alvás" },
  { limb: "Összpontosítás, meditáció, elmélyült jelenlét", skt: "dháraná, dhjána, szamádhi", pillar: "Stresszkezelés, figyelem" },
];

// O – mi változik (cél, nem garancia)
const OUTCOMES = [
  { title: "Hamarabb visszatalálsz a nyugalomhoz", text: "Egy nehéz nap vagy egy feszült beszélgetés után tudod, mit tehetsz, hogy ne vigyed magaddal estig." },
  { title: "Olyan szokásaid lesznek, amelyek megmaradnak", text: "A 16 hét alatt a gyakorlás a napjaid természetes része lesz, nem egy újabb feladat a listán." },
  { title: "Javul a kapcsolatod önmagaddal és a világgal", text: "Ha jobban figyelsz magadra, a körülötted élőkre is több figyelmed marad. Ez a munka valódi eredménye." },
];

const INCLUDED = [
  "16 egyéni online alkalom, hetente 60 perc",
  "személyre szabott gyakorlási terv, amely veled együtt változik",
  "videók és vezetett hanganyagok a saját felületeden, ahol naponta kipipálhatod a gyakorlást, és naplót is vezethetsz",
  "rövid heti beszámoló két alkalom között, amelyet elolvasok, és visszajelzek rá",
  "a tananyag, a gyakorlási terved és a naplód a program után is megmarad",
];

const STEPS = [
  { title: "Kérdőív és Életmód-térkép", text: "15 kérdés, két-három perc. A végén látod, hol tartasz most, és kapsz egy első tanácsot." },
  { title: "Ismerkedő konzultáció", text: "Online beszélgetünk arról, mit szeretnél, és hogy a program jó választás-e neked. Itt beszéljük meg a részleteket és a díjat is." },
  { title: "Indulás", text: "Ha mindketten igent mondunk, elkészítem a személyre szabott tervedet, és elindulunk." },
];

const FAQ = [
  { q: "Mennyibe kerül a program?", a: "A díjat az ismerkedő konzultáción beszéljük meg, személyesen, mert a program a te helyzetedre épül." },
  { q: "Mikor kezdhetem el a gyakorlást?", a: "Már az első közös alkalmunk után, a saját tervedet követve. Az első lépéshez nem kell hónapokig várnod." },
  { q: "Mennyi időt kér naponta?", a: "Reggel és este egy rövid gyakorlást, emellett hetente néhány hosszabb, elmélyültebb ülést. A pontos ütemet a napjaidhoz igazítjuk." },
  { q: "Kell hozzá előzetes tapasztalat?", a: "Nem. Ha még sosem meditáltál, az elejéről indulunk; ha már gyakorolsz, onnan folytatjuk, ahol tartasz." },
  { q: "Mi van, ha közben elakadok?", a: "Erre való a heti beszámoló és a heti alkalom: ha elakadsz, együtt nézzük meg, hogyan lépj tovább." },
  { q: "Mi marad meg a program után?", a: "A tananyag, a személyre szabott gyakorlási terved és a naplód a 16 hét után is elérhető marad a felületeden, így bármikor visszatérhetsz hozzájuk." },
  { q: "Online vagy személyesen zajlik?", a: "Az egyéni alkalmak online, Google Meeten zajlanak, így bárhonnan részt vehetsz. Budapesten a Nyílt Meditációs Esteken személyesen is találkozhatunk." },
  { q: "Terápia ez?", a: "Nem. A program nem helyettesíti az orvosi vagy pszichológiai kezelést. Ha ilyen kezelés alatt állsz, a konzultáción erről is beszéljünk." },
];

const CTA = "Kérem az Életmód-térképem";

export default function HomePage() {
  return (
    <main>
      {/* Nyitókép: a haszon egy mondatban, kinek szól, egy gomb */}
      <section className="grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Idegrendszer-fejlesztés · egyénileg · 16 hét</p>
          <h1 className="mt-5 text-balance font-serif text-4xl leading-tight text-forest sm:text-5xl">
            Találd meg a nyugalmad – és tartsd is meg a hétköznapokban.
          </h1>
          <p className="mt-5 font-serif text-xl leading-relaxed text-ink">
            Több ezer éves jógikus légző- és meditációs gyakorlatok, modern életmód-orvostani keretrendszerben – rád szabva.
          </p>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Hosszú távú út ez, nem gyorstalpaló – az első lépést mégis már ma megteheted.
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
              {CTA}
            </Link>
            <a href="#menete" className={buttonSecondary}>
              Megnézem, hogyan működik
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-soft">15 kérdés, két-három perc. A végén kapsz egy tanácsot is, amelyet még aznap kipróbálhatsz.</p>
        </div>
        <DawnLandscape className="mx-auto w-full max-w-md opacity-90 lg:max-w-none" />
      </section>

      {/* P + A: a helyzet, és miért nem múlik el magától */}
      <section className="grid gap-12 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Ismerős?" title="Amikor a nyugalom már nem jön magától" />
          <ul className="mt-8 space-y-3">
            {PROBLEM.map((t) => (
              <li key={t} className="flex items-start gap-3 text-lg text-ink">
                <span className="mt-3 h-px w-5 shrink-0 bg-gold" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 self-end text-lg leading-relaxed text-ink-soft">
          <p>
            Ilyenkor a tested hosszú ideig készenlétben marad, és minél tovább tart ez az állapot, annál nehezebb magadtól
            visszatalálni a nyugalomhoz.
          </p>
          <p>
            A gyors megoldások – egy szabad hétvége, egy új alkalmazás, egy jó könyv – néhány napig segítenek. Aztán jön
            egy nehezebb hét, és minden visszaáll a régi kerékvágásba.
          </p>
          <p className="text-ink">Nem veled van a baj. Azt ugyanis szinte senki nem tanítja meg nekünk, hogyan működik ez belül, és mit tehetünk érte.</p>
        </div>
      </section>

      <CompassDivider className="my-20" />

      {/* S: idegrendszer-fejlesztés */}
      <section id="idegrendszer" className="scroll-mt-24">
        <SectionTitle eyebrow="Az idegrendszer-fejlesztés" title="A nyugalom tanulható." />
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-soft">
          Az idegrendszer-fejlesztés azt jelenti, hogy megtanulod érteni és tudatosan segíteni a saját idegrendszeredet:
          mikor kapcsol készenlétbe, és hogyan vezetheted vissza a nyugalomba.
        </p>
        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {NERVOUS_SYSTEM.map(({ title, text }) => (
            <div key={title} className="border-t border-gold/30 pt-5">
              <h3 className="font-serif text-xl text-forest">{title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <CompassDivider className="my-20" />

      {/* S: a módszer */}
      <section id="modszer" className="scroll-mt-24">
        <SectionTitle eyebrow="A módszerem" title="Két rendszer, egy út: a jóga nyolc ága és az életmód-orvostan hat pillére." />
        <div className="mt-6 max-w-3xl space-y-4 text-lg leading-relaxed text-ink-soft">
          <p>
            A jóga nyolc ága a belső munka teljes ívét adja: az értékeinktől a testen és a légzésen át a figyelemig és a
            meditációig. Az életmód-orvostan hat pillére a hétköznapi élet alapjait: hogyan eszünk, mozgunk, alszunk,
            hogyan kezeljük a terhelést, mihez nyúlunk, és kikhez kapcsolódunk.
          </p>
          <p>
            A kettőt egy módszerbe ötvözöm: az egyik a belső, a másik a külső oldalt adja. Együtt az egész embert fogják át,
            nem csak egy tünetet.
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
      </section>

      <CompassDivider className="my-20" />

      {/* S: a program menete */}
      <section id="menete" className="scroll-mt-24">
        <SectionTitle eyebrow="A program menete" title="16 hét, két szakaszban: jelenlét és tudatosság." />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <GildedCard ornate className="p-8">
            <Sprout className="h-12 w-12" />
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-gold">1–8. hét</p>
            <h3 className="mt-2 font-serif text-2xl text-forest">Jelenlét</h3>
            <p className="mt-3 text-ink-soft">
              Hetente egy 60 perces online alkalom. Megérted, mi történik benned stressz alatt, és lépésről lépésre
              felépítjük a napi gyakorlásodat. Két alkalom között rövid heti beszámolót írsz, amelyre visszajelzek.
            </p>
          </GildedCard>
          <GildedCard className="p-8">
            <WindingPath className="h-12 w-12" />
            <p className="mt-5 text-xs uppercase tracking-[0.16em] text-gold">9–16. hét</p>
            <h3 className="mt-2 font-serif text-2xl text-forest">Tudatosság</h3>
            <p className="mt-3 text-ink-soft">
              Hetente egy 60 perces online alkalom. Elmélyítjük a gyakorlást, és azon dolgozunk, hogy az új szokásaid a
              hétköznapjaid részévé váljanak. A program után a tananyag, a terved és a naplód továbbra is a tiéd.
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

      {/* O: mi változik */}
      <section>
        <SectionTitle eyebrow="Amiért dolgozunk" title="Mi változik 16 hét alatt?" />
        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {OUTCOMES.map(({ title, text }) => (
            <div key={title} className="border-t border-gold/30 pt-5">
              <h3 className="font-serif text-xl text-forest">{title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
          <div className="rounded-lg bg-paper-deep/70 px-5 py-4">
            <p className="font-serif text-lg text-forest">Hosszú távú út</p>
            <p className="mt-1 text-[15px] text-ink-soft">A változás nem harminc nap alatt történik. Tizenhat héten át, lépésről lépésre építjük fel, és utána is veled marad: a tananyag és a napló a program után is elérhető.</p>
          </div>
          <div className="rounded-lg bg-paper-deep/70 px-5 py-4">
            <p className="font-serif text-lg text-forest">Már ma elkezdheted</p>
            <p className="mt-1 text-[15px] text-ink-soft">A kérdőív végén kapsz egy egyszerű tanácsot, amelyet még aznap kipróbálhatsz. Nem kell hónapokig várnod arra, hogy elinduljon valami.</p>
          </div>
        </div>
      </section>

      <CompassDivider className="my-20" />

      {/* Hogyan kerülhetsz be */}
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
          rendben van – addig szeretettel várlak egy Nyílt Meditációs Esten.
        </p>
        <div className="mt-8">
          <Link href="/jelentkezes" className={buttonPrimary}>
            {CTA}
          </Link>
        </div>
      </section>

      <CompassDivider className="my-20" />

      {/* Ki áll mögötte */}
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
            A nevem Kardos Bálint. Idegrendszer-fejlesztő mentor, légzés- és meditációoktató és holisztikus életmód-tanácsadó
            vagyok.
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
        <SectionTitle eyebrow="Ha most még csak ismerkednél" title="Két másik lehetőség" />
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
          Az első lépés két-három perc.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-ink-soft">
          Töltsd ki a kérdőívet, és nézd meg, hol tartasz most. Utána egy ismerkedő konzultáción eldönthetjük, hogy a
          program jó választás-e neked.
        </p>
        <div className="mt-8">
          <Link href="/jelentkezes" className={buttonPrimary}>
            {CTA}
          </Link>
        </div>
      </section>
    </main>
  );
}
