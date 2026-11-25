import Link from "next/link";
import { SITE } from "@/lib/site";
import { LegalDoc, type LegalSection } from "@/components/legal-doc";

export const metadata = {
  title: "Adatkezelési tájékoztató · Kardos Bálint",
  description: "Milyen személyes adatokat kezelünk, miért, mennyi ideig, és milyen jogaid vannak.",
};

/** TERVEZET — élesítés előtt jogásszal átnézendő; a [kitöltendő] mezőket Bálint adja meg. */

function Row({ what, why, basis, until }: { what: string; why: string; basis: string; until: string }) {
  return (
    <li>
      <strong>{what}</strong> — {why}. <span className="text-ink-soft">Jogalap: {basis}. Időtartam: {until}.</span>
    </li>
  );
}

const sections: LegalSection[] = [
  {
    title: "Az adatkezelő",
    body: (
      <p>
        <strong>Kardos Bálint egyéni vállalkozó</strong> · székhely: [kitöltendő] · e-mail: {SITE.email}. Adatvédelmi
        tisztviselő kinevezésére nem vagyunk kötelesek; minden adatvédelmi kérdésben a fenti e-mail-címen érsz el.
      </p>
    ),
  },
  {
    title: "Alapelveink",
    body: (
      <ul>
        <li>Csak azt az adatot kérjük el, ami a szolgáltatáshoz tényleg kell.</li>
        <li>Nem adunk el és nem adunk át adatot reklámcélra; nincs hirdetési vagy követő süti.</li>
        <li>
          A <strong>Belső Tükör</strong> (gyakorlási napló) bejegyzéseit csak te látod — a rendszer úgy épül fel, hogy
          az adminisztrátor felülete sem jeleníti meg őket.
        </li>
        <li>Bankkártyaadatot nem látunk és nem tárolunk; ezt a Stripe kezeli.</li>
      </ul>
    ),
  },
  {
    title: "Milyen adatokat, miért és meddig",
    body: (
      <>
        <p className="font-serif text-lg text-forest">Tagság és fiók</p>
        <ul>
          <Row what="E-mail-cím, név" why="a fiók létrehozása, belépés (belépő link), kapcsolattartás" basis="szerződés teljesítése (GDPR 6. cikk (1) b)" until="a tagság megszűnése után 1 év, vagy amíg a közösségi bejegyzéseid megmaradnak" />
          <Row what="Tagsági szint, előfizetési állapot, időszakok, keretek" why="a jogosultságok biztosítása" basis="szerződés teljesítése" until="a tagság megszűnése után 1 év" />
          <Row what="Ország (a számlázási címből)" why="a számlázás és a jogszabályi bevételi határok figyelése" basis="jogi kötelezettség (6. cikk (1) c)" until="8 év" />
          <Row what="Az elállási jogról szóló nyilatkozat és időbélyege, az ÁSZF verziója" why="annak igazolása, hogy kérted az azonnali teljesítést" basis="jogi kötelezettség, illetve jogos érdek (6. cikk (1) f)" until="5 év" />
          <Row what="Próbaidő-használat (e-mail-cím és a bankkártya Stripe-ujjlenyomata — nem a kártyaszám)" why="hogy egy személy csak egyszer kaphasson próbaidőt" basis="jogos érdek" until="3 év" />
        </ul>

        <p className="pt-3 font-serif text-lg text-forest">Gyakorlás és haladás</p>
        <ul>
          <Row what="Kipipált leckék, XP, rang, megnyitott lépcsők, továbblépési kérések" why="a tananyag ütemezése, a haladás követése" basis="szerződés teljesítése" until="a tagság megszűnéséig; visszatéréskor nem állnak vissza" />
          <Row what="A Ceremónia válaszai és eredménye (a rend)" why="a rend kiválasztása" basis="szerződés teljesítése" until="a tagság megszűnéséig" />
          <Row what="Belső Tükör bejegyzések" why="saját gyakorlási napló, csak neked" basis="szerződés teljesítése" until="amíg nem törlöd, legkésőbb a tagság megszűnéséig" />
          <Row what="Ranglista: név, rend, rang, az időszakban szerzett XP" why="a tagok közötti heti, havi és negyedéves ranglista" basis="jogos érdek — a ranglistáról bármikor elrejtheted magad" until="a tagság megszűnéséig" />
        </ul>

        <p className="pt-3 font-serif text-lg text-forest">Közösség</p>
        <ul>
          <Row what="Bejegyzések, hozzászólások, reakciók" why="a közösségi tér működése" basis="szerződés teljesítése; a tagság megszűnése után jogos érdek (a beszélgetések érthetősége)" until="a tagság után is a neveddel megmaradnak; kérésre töröljük" />
        </ul>

        <p className="pt-3 font-serif text-lg text-forest">Fizetés és számlázás</p>
        <ul>
          <Row what="Számlázási név, cím, összeg, a tétel megnevezése" why="a számla kiállítása és megőrzése" basis="jogi kötelezettség (a számvitelről szóló 2000. évi C. törvény 169. §)" until="8 év" />
        </ul>

        <p className="pt-3 font-serif text-lg text-forest">Események</p>
        <ul>
          <Row what="Név, e-mail-cím, foglalás, jelenlét" why="a helyfoglalás és a részvétel szervezése" basis="szerződés teljesítése" until="az esemény után 1 év (a számlaadatok 8 év)" />
          <Row what="Telefonszám" why="kapcsolattartás az eseménnyel kapcsolatban (pl. változás, elérhetőség a helyszínen)" basis="szerződés teljesítése" until="az esemény után 30 nap, utána automatikusan töröljük" />
          <Row what="Biztonsági (egészségi) megjegyzés — amit a jelentkezéskor megadsz egészségi állapotról, sérülésről, várandósságról vagy érzékenységről" why="hogy a gyakorlást biztonságosan, rád figyelve vezethessük" basis="kifejezett hozzájárulásod (GDPR 9. cikk (2) a)); a hozzájárulás a jelentkezéskor, időbélyeggel rögzül, és bármikor visszavonható" until="az esemény után 30 nap, utána automatikusan töröljük; csak a szervező látja" />
          <Row what="Túravendég neve és e-mail-címe (a meghívó tag adja meg)" why="a meghívó elküldése és a részvétel szervezése" basis="jogos érdek" until="a túra után 30 nap" />
        </ul>

        <p className="pt-3 font-serif text-lg text-forest">Egy Kedves Üzenet</p>
        <ul>
          <Row what="A küldő neve és e-mail-címe, valamint az, hogy névtelenséget kért-e" why="az üzenet megerősítése és a kapcsolattartás; névtelenségnél a nevet a hívásban nem mondjuk ki" basis="szerződés teljesítése" until="a kézbesítés után 1 év" />
          <Row what="A címzett neve, telefonszáma és az üzenet szövege" why="a meglepetés-hívás lebonyolítása" basis="jogos érdek (a küldő és a címzett érdeke az üzenet átadásában)" until="a telefonszámot legfeljebb 180 napig, utána automatikusan töröljük" />
        </ul>
        <p className="text-sm text-ink-soft">
          A címzettet a hívás elején tájékoztatjuk arról, ki és miért keresi, és hogy kérheti adatai törlését. Élő adásba
          vagy videóba csak a hozzájárulásával kerülhet.
        </p>
      </>
    ),
  },
  {
    title: "Kik férnek hozzá az adatokhoz (adatfeldolgozók)",
    body: (
      <>
        <p>A szolgáltatás működéséhez az alábbi partnerek szolgáltatásait használjuk; csak a feladatukhoz szükséges adatot kapják meg:</p>
        <ul>
          <li><strong>Supabase</strong> (adatbázis és belépés; a szerver az EU-ban, Írországban van)</li>
          <li><strong>Vercel Inc.</strong> (tárhely, USA — EU–USA adatvédelmi keretrendszer)</li>
          <li><strong>Stripe Payments Europe Ltd.</strong> (bankkártyás fizetés, Írország)</li>
          <li><strong>Resend</strong> (tranzakciós e-mailek, USA — EU–USA adatvédelmi keretrendszer)</li>
          <li><strong>BunnyWay d.o.o. (bunny.net)</strong> (hang- és videóanyagok, Szlovénia)</li>
          <li><strong>Zoho</strong> (levelezés)</li>
          <li><strong>Billingo</strong> (számlázás, amint bekapcsoljuk)</li>
        </ul>
        <p>
          A <strong>Napi Közlöny</strong> szolgáltatás — amint elindul — a tagsági jogosultságot az e-mail-címed alapján
          kérdezi le ebből a rendszerből; más adatot nem kap.
        </p>
      </>
    ),
  },
  {
    title: "Sütik és helyi tárolás",
    body: (
      <p>
        Csak a működéshez szükséges sütit használunk: a bejelentkezés munkamenetét. A sötét/világos mód választását a
        böngésződ helyi tárhelyén (localStorage) jegyezzük meg. Hirdetési, elemző vagy követő süti nincs, ezért nem
        kérünk hozzájárulást.
      </p>
    ),
  },
  {
    title: "Adatbiztonság",
    body: (
      <p>
        Az adatbázisban minden táblán sorszintű jogosultság-ellenőrzés működik: minden tag csak a saját adatait éri el.
        A kapcsolat titkosított (HTTPS), a belépés jelszó nélküli, egyszer használható linkkel történik, a hang- és
        videóanyagok pedig rövid ideig érvényes, aláírt linken érhetők el.
      </p>
    ),
  },
  {
    title: "A jogaid",
    body: (
      <>
        <ul>
          <li><strong>Hozzáférés:</strong> megkérdezheted, milyen adatot kezelünk rólad, és másolatot kérhetsz.</li>
          <li><strong>Helyesbítés:</strong> a pontatlan adatot kérésre kijavítjuk.</li>
          <li><strong>Törlés:</strong> kérheted adataid törlését, kivéve, amit jogszabály miatt meg kell őriznünk (például a számlákat).</li>
          <li><strong>Korlátozás és tiltakozás:</strong> a jogos érdeken alapuló adatkezelés ellen tiltakozhatsz.</li>
          <li><strong>Adathordozhatóság:</strong> a megadott adataidat géppel olvasható formában kikérheted.</li>
        </ul>
        <p>
          Kérésedet a {SITE.email} címre küldd; legkésőbb egy hónapon belül válaszolunk. Ha úgy érzed, megsértettük a
          jogaidat, panaszt tehetsz a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH, 1055 Budapest, Falk
          Miksa utca 9–11.; postacím: 1363 Budapest, Pf. 9.; ugyfelszolgalat@naih.hu; naih.hu), vagy bírósághoz
          fordulhatsz.
        </p>
      </>
    ),
  },
  {
    title: "Módosítás",
    body: (
      <p>
        A tájékoztatót a szolgáltatás változásával frissítjük; lényeges változásról a tagokat e-mailben értesítjük. Az{" "}
        <Link href="/aszf">ÁSZF</Link> a szerződési feltételeket tartalmazza.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="Jogi tudnivalók"
      title="Adatkezelési tájékoztató"
      intro={<p>Röviden: csak a szolgáltatáshoz szükséges adatokat kezeljük, nem adjuk el őket, és nincs követő süti.</p>}
      meta="Verzió: 2026-11 · Hatályos: [kitöltendő]"
      sections={sections}
    />
  );
}
