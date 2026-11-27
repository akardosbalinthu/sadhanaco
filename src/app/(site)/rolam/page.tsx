import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonPrimary, buttonSecondary, CompassDivider, CrestMagusok, GildedCard, PageHeader, SectionTitle } from "@/components/ornaments";
import { KindCall, Sprout, WindingPath } from "@/components/illustrations";

export const metadata = {
  title: "Rólam · Kardos Bálint",
  description:
    "A gyári műszakoktól az online marketingen és a nagykonyhán át Rishikeshig: így lettem idegrendszer-fejlesztő mentor, és így született a módszerem.",
};

type Photo = { src: string; alt: string; caption: string; width: number; height: number };
type Station = {
  when: string;
  title: string;
  paras: string[];
  Art?: (p: { className?: string }) => React.ReactElement;
  photos?: Photo[];
  note?: { summary: string; paras: string[] };
};

const STATIONS: Station[] = [
  {
    when: "1995–2005",
    title: "Falun, szeretetben",
    Art: Sprout,
    paras: [
      "Egy dél-somogyi kisfaluban nőttem fel, és nagyon jó gyerekkorom volt. Másfél éves koromtól édesanyám egyedül nevelt. Anyagilag nem volt gondtalan az élet, de gyerekként ebből semmit sem éreztem: mindig volt mit ennem, mindig volt tiszta ruhám, tető a fejem fölött, és bárhová fordultam, hatalmas szeretet vett körül. Tízéves koromig én voltam a család szeme fénye, minden figyelem középpontja.",
      "Kíváncsi, gyors észjárású gyerek voltam: hamar átláttam a helyzeteket, és már ugrottam is volna a következőre – tartósan lekötni a figyelmemet nem volt könnyű. Nagycsoportos óvodásként magamtól tanultam meg olvasni.",
    ],
  },
  {
    when: "2005–2006 · 10 évesen",
    title: "Menedék a fantáziavilágokban",
    Art: CrestMagusok,
    paras: [
      "Édesanyám később újraházasodott, és tízéves koromtól másfél éven belül megszületett a húgom és az öcsém (édesapám ágáról pedig van még egy húgom). Ma már nem hibáztatok érte senkit, de a világ közepéből hirtelen a legidősebb testvér lettem: egészen más szerep, más felelősséggel és jóval kevesebb figyelemmel, törődéssel.",
      "Ekkor fordultam a fantáziavilágok felé. Nem csak olvastam őket – éltem bennük. A fejemben minden főszereplőhöz volt valamilyen viszonyom; én is a világ része voltam.",
      "A Harry Potterrel kezdődött, aztán jött a Warcraft, a Gyűrűk Ura és a Magus, és onnan egyenes út vezetett a világok mélyére. Kamaszként a World of Warcraft online szerepjátékban éreztem először, hogy lehetek nagy, különleges és erős – szinte mindig mágussal játszottam.",
    ],
  },
  {
    when: "2007 · 12 évesen",
    title: "Százig számolni, a légzésre figyelve",
    paras: [
      "Két kisebbik testvérem tíz és tizenegy évvel fiatalabb nálam, és a korkülönbség miatt sokszor az őrületbe kergettek. Tizenkét évesen rájöttem valamire: ha ilyenkor bemegyek a szobámba, leülök az ágyra, becsukom a szemem, és csak a légzésemre figyelve elszámolok százig, utána megnyugszom – és sokkal kedvesebb tudok lenni velük.",
      "Néhány évvel később kaptam a születésnapomra egy könyvet a buddhizmusról, és meglepve olvastam, hogy amit évek óta csinálok, annak neve van: meditáció. Legalábbis a legegyszerűbb, kezdő változata.",
    ],
  },
  {
    when: "2010–2014 · 15 és 19 éves korom között",
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
      "Felvettek egy budapesti egyetem gazdasági karára. Felköltöztem, és dolgoznom kellett, hogy fenntartsam magam: előbb egy gyorsétteremben, aztán gyakornokként egy rendezvényszervező cégnél, alig fél évvel a költözés után pedig egy nemzetközi telekommunikációs vállalat brit piacot támogató csapatában – a cég történetének legfiatalabb főállású munkatársaként.",
    ],
  },
  {
    when: "2016–2018 · 21 és 23 éves korom között",
    title: "„Ez az élet?”",
    paras: [
      "A huszonegyedik születésnapom körül megfogalmazódott bennem egy kérdés: most akkor még kétszer annyi ideig, ahány éves vagyok, ezt kell csinálnom? Évente kétszer elmehetek egy rövid pihenésre, és ennyi? Szerettem volna azt hinni, hogy az élet ennél több.",
      "Tanulni kezdtem – webfejlesztést, keresőoptimalizálást, közösségimédia-marketinget, projektmenedzsmentet –, pár év múlva pedig kiléptem, és szabadúszó online marketing- és projektmenedzserként dolgoztam tovább. Csapatokat vezettem, izgalmas projekteken, szinte bárhonnan dolgozhattam. Elértem az akkori álmomat.",
    ],
    photos: [{ src: "/images/rolam/eloadas.webp", alt: "Kardos Bálint előadást tart egy teremnyi hallgatóságnak", caption: "Előadás közben, a marketinges évek alatt", width: 1000, height: 1244 }],
  },
  {
    when: "2016–2018",
    title: "„Szeretlek, apa”",
    paras: [
      "Édesapámat huszonegy évesen ismertem meg. Kisgyerekkoromban elhagyott, és két évtizedig nem is keresett – ezért az elején sok dühvel fordultam felé. Az első találkozásunkkor az egyik első mondatom az volt: „Remélem, tudod, hogy soha nem foglak apámnak hívni.”",
      "Aztán a kitartó felelősségvállalása, és ahogyan a tetteivel próbálta helyrehozni a hibáit, meggyőzött. Jóban lettünk – igazi apa–fia kapcsolatunk lett. Alig másfél évvel később egyszer munkából hazafelé azzal hívtam fel: „Szeretlek, apa.” Három hónappal később már nem élt – gyomorrákban és annak szövődményeiben hunyt el.",
    ],
  },
  {
    when: "2020",
    title: "Az első kiégés",
    paras: [
      "Épp kiköltöztünk volna néhány barátommal Balira, amikor jött a járvány, és elsöpörte a terveinket. Ekkor égtem ki először.",
      "Egyre jobban zavart, hogy a munkám értéke egyetlen dolgon múlik: a megtérülésen. Az volt a dolgom, hogy néhány számot alacsonyabban, néhányat magasabban tartsak egy kijelzőn. Nem éreztem, hogy valódi értéket teremtek – inkább csak pörgettem a fogyasztói társadalmat.",
    ],
  },
  {
    when: "2020-tól",
    title: "Vacsoraestek egy tetőteraszon, aztán a nagykonyha",
    paras: [
      "Egy barátommal kibéreltünk egy elképesztően szép, háromszintes belvárosi penthouse-t, harminc négyzetméteres saját tetőterasszal. Itt kezdődtek a vacsoraestek, amelyekből később jótékonysági vacsorák lettek. Egy kórházban fekvő gyerekeket támogató adománygyűjtő kampány nagyköveteként ezeken a vacsorákon valamivel több mint félmillió forintot gyűjtöttem, amivel a kampány második legtöbbet gyűjtő nagykövete lettem. A kampányt követő öt hónapban pedig további közel egymillió forintot gyűjtöttünk ugyanilyen vacsorákon. A csúcs egy 2021. márciusi jótékonysági fine dining gálavacsora volt: hét fogás, harmincöt vendég. Ez megnyugtatta a lelkemet, de tartós választ nem adott.",
      "Ezután otthagytam a jól fizető marketingprojekteket, és elmentem szakácsnak. Kevesebb pénz, több és keményebb munka, alig szabadidő – mégis boldogabb voltam, mint addig bármikor. Végigjártam a konyhai ranglétrát a mosogatótól a konyhafőnökig. Néhány év után viszont azt éreztem: többre vagyok képes.",
    ],
    photos: [
      { src: "/images/rolam/jotekonysag.webp", alt: "Kardos Bálint az adománygyűjtő kampány nagyköveti oklevelével", caption: "Nagyköveti oklevél: a teljes kampány több mint 11,5 millió forintot gyűjtött a gyerekeknek", width: 1000, height: 1333 },
      { src: "/images/rolam/konyha.webp", alt: "Kardos Bálint tálal egy jótékonysági gálavacsorán", caption: "2021 márciusa, jótékonysági fine dining gálavacsora: hét fogás, 35 vendég", width: 1000, height: 1333 },
    ],
  },
  {
    when: "2010–2026",
    title: "Sok minden – és egyetlen dolog",
    paras: [
      "Dolgoztam a kereskedelemben és telefonos értékesítőként, voltam értékesítéstámogató egy multinál, kis- és középvállalkozások marketing- és értékesítési vezetője, közösségszervező, jótékonysági vacsorák házigazdája, egy gyerekeket segítő alapítvány kuratóriumi elnöke, privát séf, sofőr, raktáros és podcaster – egyszer még szinkronszínésznek is jelentkeztem. Építettem vályogházat Marokkóban, és több országban vigyáztam macskákra, „hivatásszerűen”.",
      "Ha van tankönyvi példája annak, akit mindig elcsábít a következő izgalmas dolog, az én vagyok. Egyetlen kivétellel: három és fél éve minden áldott nap, kihagyás nélkül gyakorlok egy dogma- és vallásmentes önismereti technikát, az ECO-t. Ez az egyetlen, amely mellett valóban kitartottam.",
    ],
    note: {
      summary: "Mi az ECO?",
      paras: [
        "Az ECO (Energy of Consciousness) vallás- és dogmamentes önismereti út: gyakorlatok és módszerek sora, amelyekkel a gyakorló a saját tapasztalatán keresztül ismerheti meg jobban önmagát, és tehet rendet az életében és a kapcsolataiban.",
      ],
    },
  },
  {
    when: "2026 nyara",
    title: "Egy mély pont, és egy felismerés",
    paras: [
      "Egy szakítás után nagyon mélyre kerültem – annyira, hogy sürgősen beszélgetést kértem az egyik önismereti oktatómtól. Ott vált világossá, ami évek óta érlelődött bennem: semmi nem érdekel igazán, ami nem az emberi tudat fejlődéséről szól. Ezért tudtam kitartani az önismereti gyakorlás mellett – és ezért nem ment sokáig semmi más.",
      "Egy több százalékkal sikeresebb kampánytól nem csillan fel a szemem. Attól viszont igen, ha valaki egy önismereti folyamat végén felismer magában egy mintát, megdolgozik vele, és ettől kedvesebben szól a társához, ki meri mutatni a szeretetét a gyerekeinek, vagy önazonosabban húzza meg a határait. Szerintem ezek tesznek minket tartósan boldogabbá – nem a több pénz, a szebb autó vagy a két szobával nagyobb ház.",
    ],
  },
  {
    when: "2026 ősze",
    title: "Rishikesh: két hónap a forrásnál",
    Art: WindingPath,
    paras: [
      "Ezért döntöttem úgy – minden racionalitást félretéve, szinte teljes anyagi és lelki csődben –, hogy két hónapra Indiába utazom, egy 500 órás jógaoktatói képzésre. A jóga elvei közeli rokonai annak, amit addig is naponta gyakoroltam; korábban elvégeztem egy életmód-orvostani tanácsadói képzést, és tizenkét éves korom óta meditálok. Minden a helyére került.",
      "Közvetlenül a forrásnál akartam tanulni, és közben megtalálni, ki is vagyok valójában.",
    ],
  },
  {
    when: "2026 ősze · Indiában",
    title: "Egy kedves üzenet",
    Art: KindCall,
    paras: [
      "Indiában bukkantam rá egy amerikai kezdeményezésre, amely meglepetés-telefonhívásokban ad át kedves üzeneteket. Írtam nekik, és megkaptam az engedélyt, hogy magyarul is elindítsam.",
      "Hiszem, hogy egy-egy ilyen üzenettel bearanyozhatjuk egymás napjait. Olyan ritkán mondjuk ki, ami szép, jó és szeretetteljes – melengeti a szívemet, hogy ezt visszahozhatom az emberek életébe. Így született az Egy Kedves Üzenet.",
    ],
  },

];

const CONVERGE = [
  { from: "A százig számolás tizenkét évesen", to: "a meditáció, amely a program gerince" },
  { from: "A rishikeshi jógaoktató-képzés", to: "a módszer belső oldala: a jóga nyolc ága, az értékektől a meditációig" },
  { from: "Az életmód-orvostan és az idegtudomány", to: "a módszer külső oldala: alvás, mozgás, étkezés, stresszkezelés és kapcsolatok – mindig a magyarázattal, hogy tudd, mit miért csinálsz" },
  { from: "A közösségszervezés", to: "a Nyílt Meditációs Estek, ahol személyesen is találkozunk" },
  { from: "Egy kedves üzenet", to: "az Egy Kedves Üzenet, amely emlékeztet: valaki gondol ránk" },
];

/** Az oklevelek képei (kattintásra nagyban nyílnak). A jógaoktatói oklevél a megérkezése után kerül ide. */
const CERTIFICATES = [
  {
    src: "/images/oklevelek/lifestyle-medicine-consultant.webp",
    alt: "A LifestylePro Academy tanúsítványa: Kardos Bálint sikeresen teljesítette a Lifestyle Medicine Consultant (Életmód-tanácsadó) online képzést, 2026. június 30.",
    label: "Életmód-tanácsadó · LifestylePro Academy",
    w: 2000,
    h: 1414,
  },
];

const LESSONS = [
  "A jóga nem a hajlékonyságról és a tökéletes pózokról szól, hanem a meditációról és a figyelemről.",
  "A „tökéletes” teljesen szubjektív, és folyamatosan változik.",
  "Az idegrendszerem irányítja az életemet – ha változtatni szeretnék, érdemes ott kezdeni.",
  "A valódi tudatosság a hétköznapok sűrűjében is jelen van, nem csak gyakorlás közben.",
  "Az empátia, az őszinteség, a nemet mondás és a határok az egészséges kapcsolatok alapjai.",
  "Az életnek nem az a célja, hogy sikeres legyek, hanem hogy értékes. A siker ennek csak a mellékterméke.",
  "Nem kell feltétel nélkül elhinnem minden gondolatomat és érzésemet. Egyik sem én vagyok – csak néha azonosulok velük.",
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
        <PageHeader eyebrow="Rólam" title="A nevem Kardos Bálint.">
          <p className="font-serif text-xl text-ink">
            Idegrendszer-fejlesztő mentor, légzés- és meditációoktató és holisztikus életmód-tanácsadó vagyok.
          </p>
          <p>
            A jóga ősi gyakorlatait az életmód-orvostan keretrendszerével ötvözöm, hogy a meditáció ne csak a párnán,
            hanem a hétköznapokban is működjön: abban, ahogyan alszol, eszel, mozogsz, és ahogyan a többiekhez fordulsz.
          </p>
          <p>
            Évekig kerestem, hol a helyem, és szinte mindent kipróbáltam a gyári műszakoktól a szabadúszó online marketingmenedzseri munkáig. Ez az oldal
            arról szól, hogyan jutottam idáig.
          </p>
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
          {STATIONS.map(({ when, title, paras, Art, photos, note }) => (
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
              {note && (
                <details className="group mt-4 max-w-2xl rounded-lg border border-line bg-paper-deep/50 px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm text-forest marker:hidden">
                    <span className="underline decoration-gold/50 underline-offset-4">{note.summary}</span>
                    <span className="ml-2 inline-block text-gold transition-transform duration-500 group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <div className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
                    {note.paras.map((p) => (
                      <p key={p.slice(0, 24)}>{p}</p>
                    ))}
                  </div>
                </details>
              )}
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
        <SectionTitle eyebrow="Ahol minden összeér" title="A program összeköti a múltamat a jelenemmel." />
        <p className="mt-4 max-w-2xl text-ink-soft">
          Komoly témában segít, tudományosan megalapozott eszközökkel – de nem veszi túl komolyan önmagát. Nem orvosi
          kezelés és nem vallás, hanem személyes út, amelyen végigkísérlek. Benne van minden, ami fontos nekem:
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

      <section id="miert" className="scroll-mt-24">
        <SectionTitle eyebrow="Miért?" title="Az idegrendszerről és a stresszről" />
        <div className="mt-6 max-w-2xl space-y-4 text-ink-soft">
          <p className="font-serif text-xl text-ink">
            A tartós stressz ma szinte mindannyiunk életének része – és sokszor csak akkor vesszük észre, amikor a
            testünk már jelez.
          </p>
          <p>
            Az Egészségügyi Világszervezet (WHO) szerint 2019-ben világszerte közel egymilliárd ember élt valamilyen
            mentális zavarral, leggyakrabban szorongással vagy depresszióval. A kiégést 2019 óta a betegségek nemzetközi
            osztályozása (BNO-11) is leírja: a munkahelyi krónikus stressz következménye, amelyet nem sikerült jól
            kezelni.
          </p>
          <p>
            A kutatások a tartós stresszt összefüggésbe hozzák a szív- és érrendszeri betegségekkel, a depresszióval és
            a fertőzésekkel szembeni gyengébb ellenállóképességgel is. A hétköznapokban sokan így ismerik: rossz alvás,
            feszült váll és állkapocs, emésztési panaszok, ingerlékenység, szétszórt figyelem, vagy az az érzés, hogy a
            fejünkben soha nincs csend.
          </p>
          <p>
            Magyarországon a szív- és érrendszeri betegségek a leggyakoribb halálokok: a KSH adatai szerint 2024-ben
            több mint 60 000 ember, az összes elhunyt csaknem fele halt meg a keringési rendszer valamelyik betegségében.
            Ezeknek több kockázati tényezője van – a dohányzás, a magas vérnyomás, a mozgásszegény életmód és az
            egészségtelen étkezés mellett a tartós stressz is.
          </p>
          <p>
            És van egy csendesebb stresszforrás is: a magány. A WHO 2025-ös jelentése szerint világszerte minden hatodik
            ember magányos, és a magány évente több mint 871 000 halálesettel hozható összefüggésbe – óránként mintegy
            százzal.
          </p>
          <p>
            A jó hír az, hogy az idegrendszer nemcsak alkalmazkodik, hanem tanul is: a megnyugvás képessége gyakorlással
            fejleszthető. Erre épül a program, két irányból.
          </p>
          <p>
            <strong className="font-normal text-forest">Befelé</strong> a testünkkel, a légzésünkkel és a figyelmünkkel
            dolgozunk: ez a napi gyakorlás, amely segít, hogy stresszhelyzetben is hamarabb visszatalálj a nyugalomhoz.
          </p>
          <p>
            <strong className="font-normal text-forest">Kifelé</strong> az életmódod kerül sorra: az alvás, a mozgás, az
            étkezés, a stresszkezelés és a kapcsolataid – az életmód-orvostan hat alappillére. A nyugalom ott marad meg
            tartósan, ahol a hétköznapjaid is támogatják.
          </p>
          <p className="rounded-lg border border-line bg-paper-deep/50 px-4 py-3 text-sm">
            Fontos: a program nem orvosi kezelés, és nem helyettesíti azt. Ha diagnosztizált betegséggel élsz vagy
            gyógyszert szedsz, a programot az orvosi kezelés mellett, azt kiegészítve érdemes végezni – a konzultáción ezt
            is átbeszéljük.
          </p>
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="A munkám alappillérei" title="Tanulságok Indiából" />
        <p className="mt-4 max-w-2xl text-ink-soft">
          Ezek a gondolatok nemcsak az én utamat formálták: a munkám alappillérei. Ezek mentén kísérlek a programban
          is.
        </p>
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
            Szeretném, ha tudatosabbak lennénk, és jobban odafigyelnénk azokra a dolgokra, amelyek igazán fontosak –
            például egymásra. Hiszem, hogy ez nem nagy fogadalmakkal kezdődik, hanem egy lassú kilégzéssel, egy kedves
            mondattal, egy telefon nélküli reggellel. Napról napra.
          </p>
        </div>
        <GildedCard className="bg-paper-deep/60">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">Végzettségeim</p>
          <ul className="mt-3 space-y-1.5 text-[15px] text-ink-soft">
            <li>Életmód-tanácsadó (Lifestyle Medicine Consultant, LifestylePro Academy)</li>
            <li>Jógaoktató (RYT-500, Rudra YogPeeth Yoga Ashram, Rishikesh)</li>
            <li>Tizenkét éves korom óta meditálok, három és fél éve minden nap gyakorlom az ECO önismereti technikát</li>
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {CERTIFICATES.map((c) => (
              <a key={c.src} href={c.src} target="_blank" rel="noopener" className="group block" title="Megnyitás nagyban">
                <Image
                  src={c.src}
                  alt={c.alt}
                  width={c.w}
                  height={c.h}
                  sizes="(min-width: 1024px) 220px, 45vw"
                  className="w-full rounded-md border border-line transition-colors duration-500 group-hover:border-gold/60"
                />
                <span className="mt-1.5 block text-xs text-ink-soft">{c.label}</span>
              </a>
            ))}
          </div>
        </GildedCard>
      </section>

      <CompassDivider className="my-20" />

      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Ha magadra ismertél</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance font-serif text-3xl leading-snug text-forest sm:text-4xl">
          Kezdjük el együtt.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-ink-soft">
          Ha valamelyik történetben magadra ismertél, és most kezdenél, töltsd ki a kérdőívet: két-három perc alatt megnézheted,
          hol tartasz most. Ha előbb személyesen ismerkednél, gyere el egy Nyílt Meditációs Estre – szeretettel várlak.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/jelentkezes" className={buttonPrimary}>
            Kérem az Életmód-térképem
          </Link>
          <Link href="/nyilt-estek" className={buttonSecondary}>
            Közelgő Nyílt Estek
          </Link>
        </div>
      </section>

      <footer className="mt-20 border-t border-line pt-6 text-xs text-ink-soft">
        <p className="uppercase tracking-[0.16em] text-gold">Források</p>
        <ul className="mt-2 space-y-1">
          <li>WHO (2022): World mental health report: transforming mental health for all</li>
          <li>WHO (2019): Burn-out an „occupational phenomenon”: International Classification of Diseases (BNO-11)</li>
          <li>KSH (2025): Halálozások halálokok szerint, 2024</li>
          <li>Cohen, S., Janicki-Deverts, D., Miller, G. E. (2007): Psychological Stress and Disease. JAMA, 298(14)</li>
          <li>WHO Commission on Social Connection (2025): From loneliness to social connection: charting a path to healthier societies</li>
          <li>American College of Lifestyle Medicine – az életmód-orvostan hat pillére</li>
          <li>Holt-Lunstad, J., Smith, T. B., Layton, J. B. (2010): Social Relationships and Mortality Risk: A Meta-analytic Review. PLoS Medicine</li>
          <li>U.S. Surgeon General (2023): Our Epidemic of Loneliness and Isolation</li>
        </ul>
      </footer>
    </main>
  );
}
