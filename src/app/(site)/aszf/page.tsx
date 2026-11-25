import Link from "next/link";
import { LEGAL, SITE } from "@/lib/site";
import { LegalDoc, type LegalSection } from "@/components/legal-doc";

export const metadata = {
  title: "Általános Szerződési Feltételek · Kardos Bálint",
  description: "A Társaság tagságának, az eseményeknek és az Egy Kedves Üzenetnek a szerződési feltételei.",
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
          A jelen feltételek (ÁSZF) az akardosbalint.hu és a tarsasag.akardosbalint.hu oldalon elérhető minden
          szolgáltatásra vonatkoznak: A Társaság tagságára, az élő eseményekre és az Egy Kedves Üzenetre.
        </p>
      </>
    ),
  },
  {
    title: "Ki vásárolhat",
    body: (
      <>
        <p>
          Szolgáltatásainkat <strong>kizárólag magánszemélyek</strong> (fogyasztók) vehetik igénybe, a saját nevükben.
          Céges, adószámos vásárlásra és számlára nincs lehetőség. A vásárlás 18. életévüket betöltött személyeknek
          szól.
        </p>
        <p>
          Bármely országból lehet vásárolni; minden ár magyar forintban értendő. Az ország megállapítása a fizetéskor
          megadott számlázási cím alapján történik.
        </p>
      </>
    ),
  },
  {
    title: "Fontos: nem egészségügyi szolgáltatás",
    body: (
      <>
        <p>
          A Társaság gyakorlatai (légzés-, figyelem- és testérzékelési gyakorlatok) az egészséges életmódot és a
          stresszkezelést támogatják. <strong>Nem minősülnek orvosi, pszichológiai vagy pszichoterápiás kezelésnek</strong>,
          és nem helyettesítik azt. Ha bármilyen egészségügyi vagy lelki problémád van (például szív- és érrendszeri
          betegség, légzőszervi betegség, epilepszia, várandósság, pánikbetegség, trauma), a gyakorlás megkezdése
          előtt egyeztess orvosoddal vagy terapeutáddal. Ha egy gyakorlat közben rosszul érzed magad, hagyd abba.
        </p>
        <p>
          A közösségben a tagok saját tapasztalataikat osztják meg, nem szakmai tanácsot; ezek nem helyettesítik a
          szakember véleményét.
        </p>
      </>
    ),
  },
  {
    title: "A Társaság tagsága",
    body: (
      <>
        <p>Két tagsági szint közül lehet választani:</p>
        <ul>
          <li>
            <strong>A Társaság Tagja:</strong> 9 940 Ft / hó vagy 99 400 Ft / év.
          </li>
          <li>
            <strong>A Belső Kör Tagja:</strong> 27 940 Ft / hó vagy 279 400 Ft / év.
          </li>
        </ul>
        <p>
          Az egyes szintek pontos tartalmát a <a href="https://tarsasag.akardosbalint.hu">Társaság oldalán</a> lévő
          összehasonlító táblázat írja le; ez a jelen ÁSZF része. A tananyag lépcsőzetesen, a belépés napjától
          számított heti ütemben nyílik meg. A II., III. és IV. lépcsőt minden esetben a szolgáltató nyitja meg
          kézzel, egy rövid, díjmentes beszélgetés után — a gyorsított hozzáférés megvásárlása vagy a Belső Kör tagság
          sem jelent automatikus megnyitást.
        </p>
        <p>
          A tagság a fizetéskor megadott e-mail-címhez kötődik, személyes és nem átruházható. A tananyagok
          hozzáférési linkjei időkorlátosak; a belépési adatok és a tartalmak továbbadása nem megengedett.
        </p>
      </>
    ),
  },
  {
    title: "Próbaidő",
    body: (
      <ul>
        <li>7 napos próbaidő kizárólag a havi díjas „A Társaság Tagja” tagsághoz jár; az éves díjhoz és a Belső Körhöz nem.</li>
        <li>A próbaidő indításához bankkártya szükséges. Ha a próbaidő alatt nem mondod le, a 7. nap után automatikusan elindul a havi előfizetés.</li>
        <li>Egy e-mail-cím és egy bankkártya csak egyszer kaphat próbaidőt; ismételt próbálkozásnál a tagság azonnal fizetős időszakkal indul.</li>
        <li>
          A próbaidő alatt a tananyag és a közösség elérhető; a díjmentes Elsőbbségi Kedves Üzenet, az
          eseményfoglalás, a konzultációfoglalás és a Napi Közlöny az első sikeres fizetés napjától jár.
        </li>
      </ul>
    ),
  },
  {
    title: "Fizetés, megújulás és számla",
    body: (
      <>
        <p>
          A fizetés bankkártyával, a Stripe biztonságos fizetési oldalán történik; a kártyaadatokat a szolgáltató nem
          látja és nem tárolja. Az előfizetés a választott időszak (hónap vagy év) végén automatikusan megújul, és a
          díj ugyanarról a kártyáról terhelődik, amíg le nem mondod.
        </p>
        <p>
          Minden fizetésről <strong>alanyi adómentes (AAM)</strong> elektronikus számla készül, a fizetéskor megadott
          névre és címre. A díjak egyike sem adomány: mindegyik szolgáltatási díj.
        </p>
        <p>
          <strong>Sikertelen terhelés esetén</strong> e-mailben értesítünk, a hozzáférésed pedig megmarad. A rendszer
          10 napon belül összesen 5 alkalommal próbálja újra a terhelést; ha egyik sem sikerül, a tagság megszűnik.
          A kártyádat az Adataim oldalon, az „Előfizetés kezelése” gombbal bármikor frissítheted.
        </p>
      </>
    ),
  },
  {
    title: "Szintváltás",
    body: (
      <p>
        „A Társaság Tagja” szintről „A Belső Kör Tagja” szintre bármikor válthatsz. A váltás azonnal érvényes; a
        folyamatban lévő időszakra az időarányos különbözetet terheljük, amelyről külön számla készül.
      </p>
    ),
  },
  {
    title: "Lemondás és visszatérés",
    body: (
      <>
        <p>
          Az előfizetést az Adataim oldalon, az „Előfizetés kezelése” gombbal bármikor lemondhatod. A lemondás a következő számlázási
          időszaktól él: a már kifizetett időszak végéig minden hozzáférésed megmarad, utána a tagság — és vele a teljes
          rendszerhez való hozzáférés — megszűnik. A már kifizetett díjat nem térítjük vissza, és ügyfél által kért
          számlasztornóra nincs lehetőség.
        </p>
        <p>
          <strong>Ha később visszatérsz, az út elölről indul:</strong> a haladásod, az XP-d, a megnyitott lépcsők és a
          gyorsítva megvásárolt hozzáférések nem állnak vissza. Erre a vásárláskor is felhívjuk a figyelmet.
        </p>
        <p>
          A tagság alatt írt közösségi bejegyzéseid és hozzászólásaid a neveddel a közösségben maradnak, de a neved nem
          lesz kattintható, nem jelenik meg profil vagy gyakorlási fázis, és nem lehet neked üzenni. Ha a bejegyzéseid
          törlését kéred, írj nekünk.
        </p>
      </>
    ),
  },
  {
    title: "Elállási jog",
    body: (
      <>
        <p>
          A fogyasztót főszabály szerint 14 napos elállási jog illeti meg. Mivel a tagság és a digitális tartalom a
          fizetés után azonnal elérhető, a vásárláskor külön jelölőnégyzettel kéred a szolgáltatás azonnali
          teljesítését, és tudomásul veszed, hogy ezzel <strong>elveszíted az elállási jogodat</strong> (45/2014.
          (II. 26.) Korm. rendelet 29. §). A nyilatkozatot időbélyeggel rögzítjük.
        </p>
        <p>
          A meghatározott időpontra szóló élő események (Nyílt Est, Gyakorlónap, Szabadság Elvonulás) részvételi díja
          szintén a fenti rendelet szerinti kivétel alá esik, így ezeknél sincs elállási jog.
        </p>
      </>
    ),
  },
  {
    title: "Élő események",
    body: (
      <ul>
        <li>
          <strong>Nyílt Meditációs Est:</strong> bárki jelentkezhet; a részvételi díj nem tagoknak 4 940 Ft. Az eseménynél jelölt alkalmak adomány alapúak: ezeken a részvétel díjmentes, a helyszínen belátás szerint támogathatók. A személyes helyek legfeljebb 50%-a foglalható a Társaság tagjainak, hogy mindig maradjon hely a nem tagoknak. A Belső Kör
          tagjai 48 órás elsőbbséggel és díjmentesen, A Társaság Tagjai a fennmaradó tagi helyekre 3 200 Ft-os díjjal
          foglalhatnak.
        </li>
        <li><strong>Élő Gyakorlónap:</strong> kizárólag tagoknak; A Társaság Tagjainak 6 460 Ft, A Belső Kör Tagjainak díjmentes.</li>
        <li>
          <strong>Szabadság Elvonulás:</strong> kizárólag a III. lépcsőt elvégzett, megnyitott hozzáféréssel rendelkező
          tagoknak; A Társaság Tagjainak eseményenként megadott önköltséges áron, A Belső Kör Tagjainak díjmentesen.
        </li>
        <li>
          <strong>Online közös alkalmak</strong> (heti közös meditáció, havi kérdezz-felelek, játékest): a tagság részei, előzetes jelentkezés nélkül, a próbaidő után érhetők el. A belépő linket a szolgáltató a kezdés előtt 15 perccel teszi elérhetővé; a hívás a Google Meetben zajlik. A kérdezz-feleleken kérdezni A Belső Kör Tagjai tudnak.</li>
        <li>
          <strong>Közös túra:</strong> tagoknak és az általuk meghívott vendégeknek díjmentes; tagonként túránként
          legfeljebb 2 vendég hívható meg. Az úti célt a tagok szavazzák meg.
        </li>
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
      <>
        <ul>
          <li>
            <strong>Kedves Üzenet:</strong> bárki küldhet díjmentesen. Nem tagnál e-mailes megerősítés szükséges. A
            beérkezés sorrendjében dolgozzuk fel; ha a címzettet három próbálkozásra sem érjük el, az üzenet lezárul.
          </li>
          <li>
            <strong>Elsőbbségi Kedves Üzenet:</strong> csak tagoknak. Havonta díjmentesen (A Társaság Tagjainak 1, A
            Belső Kör Tagjainak 3 darab, az első sikeres fizetéstől), azon felül a tag által választott, legalább
            1 000 Ft-os díjért. Az elsőbbségi üzeneteket a díjmentesek előtt kézbesítjük, kézbesítési garanciával: három
            sikertelen próbálkozás után is folytatjuk a próbálkozást. A kereten felüli üzenet digitális szolgáltatás,
            nem adomány; számla készül róla.
          </li>
          <li>
            A hívás élő adásban vagy rövid videóban hangozhat el. Az üzenet küldője szavatolja, hogy a címzett nevét és
            telefonszámát jogszerűen adja meg. A szolgáltató megtagadhatja a sértő, jogellenes vagy más személy
            jogait sértő üzenet kézbesítését.
          </li>
          <li>A címzett telefonszámát legfeljebb 180 napig őrizzük meg.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Közösségi szabályok",
    body: (
      <>
        <p>
          A közösség alapelve: <strong>tapasztalat, nem tanácsadás</strong>. A tagok saját megfigyeléseiket osztják
          meg; nem diagnosztizálják és nem okítják egymást. Tilos a sértő, megalázó, kéretlen reklámot tartalmazó vagy
          jogszabályba ütköző tartalom, valamint mások személyes adatainak közzététele.
        </p>
        <p>
          A szolgáltató a szabályokat sértő tartalmat elrejtheti; ismételt vagy súlyos szabálysértés esetén a tagságot
          — előzetes figyelmeztetés után — megszüntetheti. Ilyenkor a még fel nem használt, előre kifizetett időszak
          díját időarányosan visszatérítjük.
        </p>
      </>
    ),
  },
  {
    title: "Szellemi tulajdon",
    body: (
      <p>
        A tananyagok (szövegek, hang- és videóanyagok, gyakorlatleírások) a szolgáltató szellemi tulajdonát képezik.
        Kizárólag személyes gyakorlásra használhatók; másolásuk, rögzítésük, továbbadásuk vagy nyilvános felhasználásuk
        a szolgáltató írásos engedélye nélkül nem megengedett.
      </p>
    ),
  },
  {
    title: "Felelősség és elérhetőség",
    body: (
      <p>
        Törekszünk a folyamatos elérhetőségre, de a karbantartás vagy külső szolgáltatók (tárhely, fizetés, média)
        hibája miatti rövid kiesésekért nem vállalunk felelősséget. A gyakorlatok végzése a 3. pontban leírtak szerint
        saját felelősségre történik. A szolgáltató felelőssége — a jogszabály által nem korlátozható esetek kivételével
        — legfeljebb az érintett szolgáltatásért kifizetett díj összegéig terjed.
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
        A szolgáltató az ÁSZF-et módosíthatja. A meglévő tagokat a módosításról legalább 15 nappal a hatálybalépés
        előtt e-mailben értesítjük; ha nem fogadod el, a tagságot a következő időszak végére lemondhatod. Árváltozás
        a már megkezdett, kifizetett időszakot nem érinti.
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
          Igyekeztünk érthetően fogalmazni. A legfontosabbak röviden: csak magánszemélyek vásárolhatnak; a lemondás
          a következő időszaktól él, visszatérítés nélkül; visszatéréskor az út elölről indul; a gyakorlás nem
          helyettesíti az orvosi kezelést.
        </p>
      }
      meta={`Verzió: 2026-11 · Hatályos: ${LEGAL.effectiveFrom}`}
      sections={sections}
    />
  );
}
