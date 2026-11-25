import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { buttonPrimary, buttonSecondary, CompassDivider, CrestMagusok, GildedCard, PageHeader, SectionTitle } from "@/components/ornaments";
import { KindCall, MorningPaper, Sprout, WindingPath } from "@/components/illustrations";

export const metadata = {
  title: "Rólam · Kardos Bálint",
  description:
    "A kukoricaföldtől a multinacionális irodán és a nagykonyhán át Rishikeshig — és hogyan ér össze mindez A Társaságban.",
};

type Photo = { src: string; alt: string; caption: string; width: number; height: number };
type Station = {
  when: string;
  title: string;
  paras: string[];
  Art?: (p: { className?: string }) => React.ReactElement;
  photos?: Photo[];
};

const STATIONS: Station[] = [
  {
    when: "Gyerekkor",
    title: "Falun, szeretetben",
    Art: Sprout,
    paras: [
      "Vidéken, falusi közegben nőttem fel, és nagyon jó gyerekkorom volt. Másfél éves koromtól édesanyám egyedül nevelt. Anyagilag nem volt gondtalan az élet, de gyerekként ebből semmit sem éreztem: mindig volt mit ennem, mindig volt tiszta ruhám, tető a fejem fölött, és bárhová fordultam, hatalmas szeretet vett körül. Tízéves koromig én voltam a család szeme fénye, minden figyelem középpontja.",
      "Kíváncsi, gyors észjárású gyerek voltam: hamar átláttam a helyzeteket, és már ugrottam is volna a következőre — tartósan lekötni a figyelmemet nem volt könnyű. Nagycsoportos óvodásként magamtól tanultam meg olvasni.",
    ],
  },
  {
    when: "10 évesen",
    title: "Menedék a fantáziavilágokban",
    Art: CrestMagusok,
    paras: [
      "Édesanyám később újraházasodott, és tízéves koromtól másfél éven belül megszületett a húgom és az öcsém (édesapám ágáról pedig van még egy húgom). Nem hibáztatok érte senkit, de a világ közepéből hirtelen a legidősebb testvér lettem: egészen más szerep, más felelősséggel és jóval kevesebb figyelemmel, törődéssel.",
      "Ekkor fordultam a fantáziavilágok felé. Nem csak olvastam őket — éltem bennük. A fejemben minden főszereplőhöz volt valamilyen viszonyom; én is a világ része voltam.",
      "A Harry Potterrel kezdődött, aztán jött a Warcraft, a Gyűrűk Ura és a Magus, és onnan egyenes út vezetett a világok mélyére. Kamaszként egy online szerepjátékban éreztem először, hogy lehetek nagy, különleges és erős — szinte mindig mágussal játszottam. Felnőttként egyre kevesebb idő jutott rá. Pedig mennyire szerettem…",
    ],
  },
  {
    when: "12 évesen",
    title: "Százig számolni, a légzésre figyelve",
    paras: [
      "Két kisebbik testvérem tíz és tizenegy évvel fiatalabb nálam, és a korkülönbség miatt sokszor az őrületbe kergettek. Tizenkét évesen rájöttem valamire: ha ilyenkor bemegyek a szobámba, leülök az ágyra, becsukom a szemem, és csak a légzésemre figyelve elszámolok százig, utána megnyugszom — és sokkal kedvesebb tudok lenni velük.",
      "Néhány évvel később kaptam a születésnapomra egy könyvet a buddhizmusról, és meglepve olvastam, hogy amit évek óta csinálok, annak neve van: meditáció. Legalábbis a legegyszerűbb, kezdő változata.",
    ],
  },
  {
    when: "15 évesen",
    title: "Kukoricaföld, pénztár, éjszakai műszak",
    paras: [
      "Tizenöt évesen kezdtem dolgozni: három nyáron át a dél-somogyi kukoricaföldeken címereztem, tizennyolc évesen pedig a szomszéd város hipermarketében ültem a pénztárnál.",
      "Az érettségi évében, mivel angolból már leérettségiztem, csütörtökönként nem volt első órám. Ilyenkor szerdán reggel hatkor keltem, iskola után egy barátom családja megetetett, este hétkor buszra ültem Kaposvárra, végigdolgoztam egy éjszakai műszakot egy műanyaggyárban, és reggel a második órára visszaértem az iskolába. Csütörtök délután, harmincnégy–harminchat óra ébrenlét után feküdtem le aludni.",
    ],
  },
  {
    when: "2015",
    title: "Budapest, és a legfiatalabb kolléga",
    paras: [
      "Felvettek egy budapesti egyetem gazdasági karára. Felköltöztem, és dolgoznom kellett, hogy fenntartsam magam: előbb egy gyorsétteremben, aztán gyakornokként egy rendezvényszervező cégnél, alig fél évvel a költözés után pedig egy nemzetközi telekommunikációs vállalat brit piacot támogató csapatában — a cég történetének legfiatalabb főállású munkatársaként.",
    ],
  },
  {
    when: "21 évesen",
    title: "„Ez az élet?”",
    paras: [
      "A huszonegyedik születésnapom körül megfogalmazódott bennem egy kérdés: most akkor még kétszer annyi ideig, ahány éves vagyok, ezt kell csinálnom? Évente kétszer elmehetek egy rövid pihenésre, és ennyi? Szerettem volna azt hinni, hogy az élet ennél több.",
      "Tanulni kezdtem — webfejlesztést, keresőoptimalizálást, közösségimédia-marketinget, projektmenedzsmentet —, pár év múlva pedig kiléptem, és szabadúszó online marketing- és projektmenedzserként dolgoztam tovább. Csapatokat vezettem, izgalmas projekteken, szinte bárhonnan dolgozhattam. Elértem az akkori álmomat.",
    ],
    photos: [{ src: "/images/rolam/eloadas.webp", alt: "Kardos Bálint előadást tart egy teremnyi hallgatóságnak", caption: "Előadás közben, a marketinges évek alatt", width: 1000, height: 1244 }],
  },
  {
    when: "Ugyanebben az évben",
    title: "„Szeretlek, apa”",
    paras: [
      "Édesapámat huszonegy évesen ismertem meg. Az elején sok dühvel fordultam felé. Az első találkozásunkkor az egyik első mondatom az volt: „Remélem, tudod, hogy soha nem foglak apámnak hívni.”",
      "Aztán a kitartó felelősségvállalása, és ahogyan a tetteivel próbálta helyrehozni a hibáit, meggyőzött. Nagyon jóba lettünk. Alig másfél évvel később egyszer munkából hazafelé azzal hívtam fel: „Szeretlek, apa.” Három hónappal később már nem élt — gyomorrákban és annak szövődményeiben hunyt el.",
    ],
  },
  {
    when: "A járvány évei",
    title: "Az első kiégés",
    paras: [
      "Épp kiköltöztünk volna néhány barátommal Balira, amikor jött a járvány, és elsöpörte a terveinket. Ekkor égtem ki először.",
      "Egyre jobban zavart, hogy a munkám értéke egyetlen dolgon múlik: a megtérülésen. Az volt a dolgom, hogy néhány számot alacsonyabban, néhányat magasabban tartsak egy kijelzőn. Nem éreztem, hogy valódi értéket teremtek — inkább csak pörgettem a fogyasztói társadalmat.",
    ],
  },
  {
    when: "Utána",
    title: "Vacsoraestek egy tetőteraszon, aztán a nagykonyha",
    paras: [
      "Egy barátommal kibéreltünk egy elképesztően szép belvárosi tetőlakást, harminc négyzetméteres terasszal. Itt kezdődtek a vacsoraestek, amelyekből később jótékonysági vacsorák lettek: összesen több mint 11,5 millió forint gyűlt össze kórházban fekvő gyerekek foglalkozásaira. Ez megnyugtatta a lelkemet, de tartós választ nem adott.",
      "Otthagytam a jól fizető marketingprojekteket, és elmentem szakácsnak. Kevesebb pénz, több és keményebb munka, alig szabadidő — mégis boldogabb voltam, mint addig bármikor. Végigjártam a konyhai ranglétrát a mosogatótól a konyhafőnökig. Néhány év után viszont azt éreztem: többre vagyok képes.",
    ],
    photos: [
      { src: "/images/rolam/jotekonysag.webp", alt: "Kardos Bálint egy oklevéllel, amely a jótékonysági vacsorákon összegyűlt adományt igazolja", caption: "A jótékonysági vacsorák eredménye: több mint 11,5 millió forint a gyerekeknek", width: 1000, height: 1333 },
      { src: "/images/rolam/konyha.webp", alt: "Kardos Bálint szakácsként tálal egy étteremben", caption: "A nagykonyhán", width: 1000, height: 1333 },
    ],
  },
  {
    when: "Közben",
    title: "Sok minden — és egyetlen dolog",
    paras: [
      "Dolgoztam a kereskedelemben és telefonos értékesítőként, voltam értékesítéstámogató egy multinál, kis- és középvállalkozások marketing- és értékesítési vezetője, közösségszervező, jótékonysági vacsorák házigazdája, egy gyerekeket segítő alapítvány kuratóriumi elnöke, privát séf, sofőr, raktáros és podcaster — egyszer még szinkronszínésznek is jelentkeztem. Építettem vályogházat Marokkóban, és több országban vigyáztam macskákra, „hivatásszerűen”.",
      "Ha van tankönyvi példája annak, akit mindig elcsábít a következő izgalmas dolog, az én vagyok. Egyetlen kivétellel: három és fél éve minden áldott nap, kihagyás nélkül gyakorlok egy dogma- és vallásmentes önismereti technikát. Ez az egyetlen, amely mellett valóban kitartottam.",
    ],
  },
  {
    when: "Idén nyáron",
    title: "Egy mély pont, és egy felismerés",
    paras: [
      "Egy szakítás után nagyon mélyre kerültem — annyira, hogy sürgősen beszélgetést kértem az egyik önismereti oktatómtól. Ott vált világossá, ami évek óta érlelődött bennem: semmi nem érdekel igazán, ami nem az emberi tudat fejlődéséről szól. Ezért tudtam kitartani az önismereti gyakorlás mellett — és ezért nem ment hosszan semmi más.",
      "Egy több százalékkal sikeresebb kampánytól nem csillan fel a szemem. Attól viszont igen, ha valaki egy önismereti folyamat végén felismer magában egy mintát, megdolgozik vele, és ettől kedvesebben szól a társához, ki meri mutatni a szeretetét a gyerekeinek, vagy önazonosabban húzza meg a határait. Szerintem ezek tesznek minket tartósan boldogabbá — nem a több pénz, a szebb autó vagy a két szobával nagyobb ház.",
    ],
  },
  {
    when: "Ősz",
    title: "Rishikesh: két hónap a forrásnál",
    Art: WindingPath,
    paras: [
      "Ezért döntöttem úgy — minden racionalitást félretéve —, hogy két hónapra Indiába utazom, egy 500 órás jógaoktatói képzésre. A jóga elvei közeli rokonai annak, amit addig is naponta gyakoroltam; korábban elvégeztem egy életmód-orvostani tanácsadói képzést, és tizenkét éves korom óta meditálok. Minden a helyére került.",
      "Közvetlenül a forrásnál akartam tanulni, és közben megtalálni, ki is vagyok valójában. A hazafelé tartó, tizenpár órás repülőúton írtam össze, mit tanultam — néhányat lent megosztok belőle.",
    ],
  },
  {
    when: "Indiában",
    title: "Egy kedves üzenet",
    Art: KindCall,
    paras: [
      "Indiában bukkantam rá egy amerikai kezdeményezésre, amely meglepetés-telefonhívásokban ad át kedves üzeneteket. Írtam nekik, és megkaptam az engedélyt, hogy magyarul is elindítsam.",
      "Hiszem, hogy egy-egy ilyen üzenettel bearanyozhatjuk egymás napjait. Olyan ritkán mondjuk ki, ami szép, jó és szeretetteljes — melengeti a szívemet, hogy ezt visszahozhatom az emberek életébe. Így született az Egy Kedves Üzenet.",
    ],
  },
  {
    when: "Ma",
    title: "Visszavenni a figyelmünket",
    Art: MorningPaper,
    paras: [
      "Az idegrendszerünk így is túlterhelt, és szinte minden körülöttünk azon dolgozik, hogy elrabolja a figyelmünket — vele pedig az erőnket. Amire figyelünk, abba tesszük az energiánkat. A telefon csak eszköz, mégis sokszor ő irányít minket, nem fordítva.",
      "Szeretném visszavenni a figyelmemet, és segíteni másoknak is, hogy a nap legérzékenyebb perceit, az ébredés utániakat, a lehető legkevesebb ingerrel kezdjék. Ebből lett a Napi Közlöny.",
    ],
  },
];

const CONVERGE = [
  { from: "A százig számolás tizenkét évesen", to: "napi 10–15 perc vezetett légzés és meditáció" },
  { from: "Az életmód-orvostan és az idegtudomány", to: "minden gyakorlat mögött ott a magyarázat: mit miért csinálsz" },
  { from: "A fantáziavilágok és a mágus karakter", to: "a négy rend, a Ceremónia, a karakterkártya, a céhes rangok és a havi szerepjáték-est" },
  { from: "A vacsoraestek a tetőteraszon", to: "a közös asztal és a negyedéves vacsorameghívás" },
  { from: "A közösségszervezés", to: "egy közösség, ahol tapasztalatot osztunk meg, nem tanácsot" },
  { from: "A túrák a barátaimmal", to: "a havi közös túra, amelynek úti célját a tagok szavazzák meg" },
  { from: "Egy kedves üzenet Indiából", to: "elsőbbségi kedves üzenetek a tagoknak" },
  { from: "A telefonmentes reggel", to: "a Napi Közlöny és az analóg reggel" },
];

const LESSONS = [
  "A jóga nem a hajlékonyságról és a tökéletes pózokról szól, hanem a meditációról és a figyelemről.",
  "A „tökéletes” teljesen szubjektív, és folyamatosan változik.",
  "Az idegrendszerem irányítja az életemet — ha változtatni szeretnék, érdemes ott kezdeni.",
  "A valódi tudatosság a hétköznapok sűrűjében is jelen van, nem csak gyakorlás közben.",
  "Az empátia, az őszinteség, a nemet mondás és a határok az egészséges kapcsolatok alapjai.",
  "Az életnek nem az a célja, hogy sikeres legyek, hanem hogy értékes. A siker ennek csak a mellékterméke.",
  "Nem kell feltétel nélkül elhinnem minden gondolatomat és érzésemet. Egyik sem én vagyok — csak néha azonosulok velük.",
  "Senkinél sem vagyok jobb, de nálam sem jobb senki.",
  "Minden az én felelősségem, de nem minden az én hibám.",
  "A fájdalom elkerülhetetlen, a szenvedés választható.",
  "Az aggódás az egyik legrosszabb dolog, amire a képzeletemet használhatom.",
  "Az értékemet nem az eredményeim határozzák meg.",
  "A bátorság nem a félelem hiánya, hanem az, hogy a félelem ellenére is cselekszem.",
  "Ha teli csészével mész a teaházba, a legnagyobb teamester sem tud megitatni.",
  "Mielőtt jót teszel valakivel, kérdezd meg, jó-e az neki.",
  "A chai jó. :)",
];

export default function AboutPage() {
  return (
    <main className="py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
        <PageHeader eyebrow="Rólam" title="Kardos Bálintnak hívnak.">
          <p className="font-serif text-xl text-ink">
            Évekig kerestem, hol a helyem. Kipróbáltam szinte mindent — a kukoricaföldtől a nemzetközi irodán át a
            nagykonyháig —, mire megértettem, hogy egyetlen dolog érdekel igazán: hogyan válhatunk tudatosabb,
            nyugodtabb és kedvesebb emberekké.
          </p>
          <p>A Társaság az a hely, ahol mindez összeér. Ez az oldal arról szól, hogyan jutottam idáig.</p>
        </PageHeader>
        <Image
          src="/images/rolam/portre.webp"
          alt="Kardos Bálint portréja"
          width={500}
          height={499}
          priority
          sizes="(min-width: 1024px) 360px, 70vw"
          className="mx-auto w-full max-w-xs rounded-full border border-gold/40 bg-white lg:max-w-sm"
        />
      </div>

      <CompassDivider className="my-16" />

      <section aria-labelledby="ut">
        <SectionTitle eyebrow="Az utam" title="Állomások, amelyek ide vezettek" />
        <h2 id="ut" className="sr-only">
          Az utam
        </h2>
        <ol className="relative mt-12 max-w-3xl border-l border-gold/35 pl-8 sm:pl-10">
          {STATIONS.map(({ when, title, paras, Art, photos }) => (
            <li key={title} className="relative pb-14 last:pb-0">
              <span className="absolute -left-[37px] top-1.5 h-2.5 w-2.5 rotate-45 border border-gold bg-paper sm:-left-[45px]" aria-hidden />
              <p className="text-xs uppercase tracking-[0.18em] text-gold">{when}</p>
              <div className="mt-2 flex items-start justify-between gap-6">
                <h3 className="text-balance font-serif text-2xl leading-snug text-forest">{title}</h3>
                {Art && <Art className="hidden h-16 w-16 shrink-0 sm:block" />}
              </div>
              <div className="mt-3 space-y-3 text-ink-soft">
                {paras.map((p) => (
                  <p key={p.slice(0, 32)}>{p}</p>
                ))}
              </div>
              {photos && (
                <div className={`mt-6 grid gap-4 ${photos.length > 1 ? "grid-cols-2" : "max-w-sm"}`}>
                  {photos.map((ph) => (
                    <figure key={ph.src}>
                      <Image
                        src={ph.src}
                        alt={ph.alt}
                        width={ph.width}
                        height={ph.height}
                        sizes="(min-width: 768px) 360px, 45vw"
                        className="aspect-[4/5] w-full rounded-lg border border-line object-cover"
                      />
                      <figcaption className="mt-2 text-xs text-ink-soft">{ph.caption}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Ahol minden összeér" title="A Társaság összeköti a múltamat a jelenemmel." />
        <p className="mt-4 max-w-2xl text-ink-soft">
          Komoly témában segít, tudományosan megalapozott eszközökkel — de nem veszi túl komolyan önmagát. Nem orvosi
          kezelés és nem vallás, hanem közös értékek mentén működő önismereti közösség. Benne van minden, ami fontos
          nekem:
        </p>
        <ul className="mt-10 grid gap-x-10 gap-y-6 md:grid-cols-2">
          {CONVERGE.map(({ from, to }) => (
            <li key={from} className="border-t border-gold/30 pt-4">
              <p className="font-serif text-lg text-forest">{from}</p>
              <p className="mt-1 flex items-start gap-2 text-[15px] text-ink-soft">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                {to}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Hazafelé, a repülőn" title="Néhány tanulság Indiából" />
        <ol className="mt-10 grid gap-x-10 gap-y-4 md:grid-cols-2">
          {LESSONS.map((l, i) => (
            <li key={l} className="flex gap-3 text-ink-soft">
              <span className="w-6 shrink-0 text-right font-serif text-gold">{i + 1}.</span>
              <span>{l}</span>
            </li>
          ))}
        </ol>
      </section>

      <CompassDivider className="my-20" />

      <section className="grid items-start gap-10 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Amiben hiszek" title="Figyeljünk jobban arra, ami tényleg számít." />
          <p className="mt-4 text-ink-soft">
            Szeretném, ha tudatosabbak lennénk, és jobban odafigyelnénk azokra a dolgokra, amelyek igazán fontosak —
            például egymásra. Hiszem, hogy ez nem nagy fogadalmakkal kezdődik, hanem egy lassú kilégzéssel, egy kedves
            mondattal, egy telefon nélküli reggellel. Napról napra.
          </p>
        </div>
        <GildedCard className="bg-paper-deep/60">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">Végzettségeim</p>
          <ul className="mt-3 space-y-1.5 text-[15px] text-ink-soft">
            <li>Életmód-tanácsadó (Lifestyle Medicine Consultant, LifestylePro Academy)</li>
            <li>Jógaoktató (RYT-500, Rudra YogPeeth Yoga Ashram, Rishikesh)</li>
            <li>Tizenkét éves korom óta meditálok, három és fél éve minden nap gyakorlok egy önismereti technikát</li>
          </ul>
        </GildedCard>
      </section>

      <CompassDivider className="my-20" />

      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Ha magadra ismertél</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance font-serif text-3xl leading-snug text-forest sm:text-4xl">
          Gyere, haladjunk együtt.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-ink-soft">
          Ha valamelyik állomásban magadra ismertél, A Társaságban jó helyen leszel. Ha előbb személyesen
          ismerkednél, gyere el egy Nyílt Meditációs Estre — szeretettel várlak.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className={buttonPrimary}>
            Megnézem A Társaságot
          </a>
          <Link href="/nyilt-estek" className={buttonSecondary}>
            Közelgő Nyílt Estek
          </Link>
        </div>
      </section>
    </main>
  );
}
