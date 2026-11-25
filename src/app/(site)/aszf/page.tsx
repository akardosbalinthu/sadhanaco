import Link from "next/link";
import { LEGAL, SITE } from "@/lib/site";
import { LegalDoc, type LegalSection } from "@/components/legal-doc";

export const metadata = {
  title: "Általános Szerződési Feltételek · Kardos Bálint",
  description: "Az egyéni program, a Nyílt Meditációs Estek és az Egy Kedves Üzenet szerződési feltételei.",
};

/**
 * Jogásszal átnézendő. A szolgáltató adatai: LEGAL (src/lib/site.ts).
 * A szöveg verziója: app_settings.terms_version (a vásárláskor ezt rögzítjük a hozzájárulással).
 */
const sections: LegalSection[] = [
  {
    title: "A szolgáltató",
    body: (
      <>
        <p>
          <strong>{LEGAL.fullName}</strong> (KATA, alanyi adómentes) · székhely: {LEGAL.address} ·
          nyilvántartási szám: {LEGAL.registrationNumber} · adószám: {LEGAL.taxNumber} · e-mail: {SITE.email}. A további adatok az{" "}
          <Link href="/impresszum">impresszumban</Link> találhatók.
        </p>
        <p>
          A jelen feltételek (ÁSZF) az akardosbalint.hu oldalon és a résztvevői felületen (tarsasag.akardosbalint.hu)
          elérhető szolgáltatásokra vonatkoznak: az egyéni programra, a Nyílt Meditációs Estekre és az Egy Kedves
          Üzenetre.
        </p>
      </>
    ),
  },
  {
    title: "Ki veheti igénybe",
    body: (
      <>
        <p>
          Szolgáltatásaimat <strong>kizárólag magánszemélyek</strong> (fogyasztók) vehetik igénybe, a saját nevükben.
          Céges, adószámos megrendelésre és számlára nincs lehetőség. A szolgáltatások 18. életévüket betöltött
          személyeknek szólnak.
        </p>
        <p>Bármely országból igénybe vehetők; minden ár magyar forintban értendő.</p>
      </>
    ),
  },
  {
    title: "Fontos: nem egészségügyi szolgáltatás",
    body: (
      <>
        <p>
          A gyakorlatok (meditáció, légzés-, figyelem- és testérzékelési gyakorlatok) és az életmódra vonatkozó
          kísérés az egészséges életmódot és a stresszkezelést támogatják. <strong>Nem minősülnek orvosi,
          pszichológiai vagy pszichoterápiás kezelésnek</strong>, és nem helyettesítik azt. Ha bármilyen egészségügyi
          vagy lelki problémád van (például szív- és érrendszeri betegség, légzőszervi betegség, epilepszia,
          várandósság, pánikbetegség, trauma), a gyakorlás megkezdése előtt egyeztess orvosoddal vagy terapeutáddal,
          és jelezd az ismerkedő konzultáción is. Ha egy gyakorlat közben rosszul érzed magad, hagyd abba.
        </p>
      </>
    ),
  },
  {
    title: "Az egyéni program",
    body: (
      <>
        <p>
          Az egyéni program nyolc hónapos, online kísérés. Az első négy hónapban hetente egy 60 perces, a második négy
          hónapban havonta egy 45 perces egyéni alkalom van (Google Meeten), személyre szabott gyakorlási tervvel,
          heti írásos beszámolóval és visszajelzéssel. A program ideje alatt a résztvevő hozzáfér a résztvevői
          felületen lévő tananyaghoz (videós és hanganyagos modulok), a gyakorlás-követéshez és a naplóhoz.
        </p>
        <p>
          <strong>A program nem vásárolható meg közvetlenül.</strong> A jelentkezés egy felméréssel indul, amelyet egy
          ismerkedő konzultáció követ. A szerződés a konzultáción egyeztetett feltételekkel (a program díja, a
          fizetés módja és ütemezése, a kezdés napja) jön létre, amikor ezeket a szolgáltató e-mailben írásban
          visszaigazolja. Az ismerkedő konzultáció önmagában nem keletkeztet fizetési kötelezettséget.
        </p>
        <p>
          Az alkalmak időpontját közösen egyeztetjük. Az alkalmak áthelyezésére, az elmaradt alkalmakra és a program idő
          előtti befejezésére a visszaigazolásban rögzített feltételek az irányadók.
        </p>
        <p>
          A résztvevői hozzáférés a megadott e-mail-címhez kötődik, személyes és nem átruházható. A tananyagok
          hozzáférési linkjei időkorlátosak; a belépési adatok és a tartalmak továbbadása nem megengedett.
        </p>
      </>
    ),
  },
  {
    title: "Díjak és számla",
    body: (
      <>
        <p>
          Az egyéni program díját a konzultáción egyeztetjük. A Nyílt Meditációs Est részvételi díja a weboldalon
          szerepel, és bankkártyával, a Stripe biztonságos fizetési oldalán fizethető; a kártyaadatokat a szolgáltató
          nem látja és nem tárolja.
        </p>
        <p>
          Minden fizetésről <strong>alanyi adómentes (AAM)</strong> elektronikus számla készül. A díjak egyike sem
          adomány: mindegyik szolgáltatási díj. Az adomány alapúként jelölt alkalmak kivételt képeznek: ezeken a
          részvétel díjmentes.
        </p>
      </>
    ),
  },
  {
    title: "Elállási jog",
    body: (
      <>
        <p>
          <strong>Egyéni program:</strong> a szerződés megkötésétől számított 14 napon belül indoklás nélkül elállhatsz.
          Ha kifejezetten kéred, hogy a program már az elállási határidő alatt induljon, elálláskor az addig teljesített
          szolgáltatás arányos díját kell megfizetned (45/2014. (II. 26.) Korm. rendelet 22. §). Az elállási szándékot
          e-mailben jelezheted a {SITE.email} címen.
        </p>
        <p>
          <strong>Nyílt Meditációs Est:</strong> a meghatározott időpontra szóló szabadidős szolgáltatás a fenti rendelet
          29. § (1) l) pontja szerinti kivétel, ezért ennél nincs elállási jog. A foglaláskor erről külön nyilatkozol;
          a nyilatkozatot időbélyeggel rögzítjük.
        </p>
      </>
    ),
  },
  {
    title: "Nyílt Meditációs Estek",
    body: (
      <ul>
        <li>Bárki jelentkezhet; a részvételi díj 4 940 Ft. Az egyéni program résztvevőinek a program ideje alatt díjmentes.</li>
        <li>Az eseménynél jelölt alkalmak adomány alapúak: ezeken a részvétel díjmentes, a helyszínen belátás szerint támogathatók.</li>
        <li>
          A foglalás a díj megfizetésével válik véglegessé. Ha az eseményt a szolgáltató mondja le, a befizetett díjat
          visszatérítjük. A résztvevő által lemondott vagy ki nem használt foglalás díját nem térítjük vissza.
        </li>
      </ul>
    ),
  },
  {
    title: "Egy Kedves Üzenet",
    body: (
      <ul>
        <li>
          Bárki küldhet díjmentesen, e-mailes megerősítés után. Az üzeneteket a beérkezés sorrendjében dolgozzuk fel; ha
          a címzettet három próbálkozásra sem érjük el, az üzenet lezárul.
        </li>
        <li>
          A hívás élő adásban vagy rövid videóban hangozhat el. Az üzenet küldője szavatolja, hogy a címzett nevét és
          telefonszámát jogszerűen adja meg. A szolgáltató megtagadhatja a sértő, jogellenes vagy más személy jogait
          sértő üzenet kézbesítését.
        </li>
        <li>A címzett telefonszámát legfeljebb 180 napig őrizzük meg.</li>
      </ul>
    ),
  },
  {
    title: "A korábbi Társaság-tagságok",
    body: (
      <p>
        A Társaság tagsága 2026. november 25-én megszűnt; új tagság nem köthető. A korábban indított előfizetések a
        résztvevői felület Adataim oldalán mondhatók le; a már kifizetett időszak végéig a hozzáférés megmarad. A
        korábbi előfizetésekre a megkötésükkor hatályos feltételek irányadók.
      </p>
    ),
  },
  {
    title: "Szellemi tulajdon",
    body: (
      <p>
        A tananyagok (szövegek, hang- és videóanyagok, gyakorlatleírások, gyakorlási tervek) a szolgáltató szellemi
        tulajdonát képezik. Kizárólag személyes gyakorlásra használhatók; másolásuk, rögzítésük, továbbadásuk vagy
        nyilvános felhasználásuk a szolgáltató írásos engedélye nélkül nem megengedett. Az egyéni alkalmakról
        felvétel csak mindkét fél előzetes hozzájárulásával készülhet.
      </p>
    ),
  },
  {
    title: "Felelősség és elérhetőség",
    body: (
      <p>
        Törekszünk a folyamatos elérhetőségre, de a karbantartás vagy külső szolgáltatók (tárhely, fizetés, média,
        videóhívás) hibája miatti rövid kiesésekért nem vállalunk felelősséget. A gyakorlatok végzése a 3. pontban
        leírtak szerint saját felelősségre történik. A szolgáltató felelőssége — a jogszabály által nem korlátozható
        esetek kivételével — legfeljebb az érintett szolgáltatásért kifizetett díj összegéig terjed.
      </p>
    ),
  },
  {
    title: "Panaszkezelés és jogorvoslat",
    body: (
      <>
        <p>
          Panaszodat a {SITE.email} címre küldheted; 30 napon belül írásban válaszolunk. Ha a panasz rendezése nem
          sikerül, a lakóhelyed szerint illetékes békéltető testülethez fordulhatsz — a szolgáltató székhelye szerint
          a Budapesti Békéltető Testülethez (1016 Budapest, Krisztina krt. 99. III. em. 310.;
          bekelteto.testulet@bkik.hu) —, illetve bírósághoz.
        </p>
      </>
    ),
  },
  {
    title: "Személyes adatok",
    body: (
      <p>
        A személyes adatok kezeléséről az <Link href="/adatkezeles">adatkezelési tájékoztató</Link> rendelkezik.
      </p>
    ),
  },
  {
    title: "Az ÁSZF módosítása",
    body: (
      <p>
        A szolgáltató az ÁSZF-et módosíthatja. A folyamatban lévő egyéni programokat a módosítás nem érinti; azokra a
        szerződéskötéskor hatályos feltételek és a visszaigazolásban rögzítettek irányadók.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      eyebrow="Jogi tudnivalók"
      title="Általános Szerződési Feltételek"
      intro={
        <p>
          Igyekeztem érthetően fogalmazni. A legfontosabbak röviden: csak magánszemélyek vehetik igénybe; az egyéni
          program feltételeit az ismerkedő konzultáción egyeztetjük, és írásban visszaigazolom; a gyakorlás nem
          helyettesíti az orvosi kezelést.
        </p>
      }
      meta={`Verzió: 2026-11-25 · Hatályos: ${LEGAL.effectiveFrom}`}
      sections={sections}
    />
  );
}
