import Link from "next/link";
import { LEGAL, SITE } from "@/lib/site";
import { LegalDoc, type LegalSection } from "@/components/legal-doc";

export const metadata = {
  title: "Adatkezelési tájékoztató · Kardos Bálint",
  description: "Milyen személyes adatokat kezelünk, miért, mennyi ideig, és milyen jogaid vannak.",
};

/** Jogásszal átnézendő. Az adatkezelő adatai: LEGAL (src/lib/site.ts). */

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
        <strong>{LEGAL.fullName}</strong> · székhely: {LEGAL.address} · nyilvántartási szám: {LEGAL.registrationNumber} ·
        adószám: {LEGAL.taxNumber} · e-mail: {SITE.email}. Adatvédelmi
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
          A <strong>napló</strong> bejegyzéseit csak te látod — a rendszer úgy épül fel, hogy
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
        <p id="jelentkezes" className="scroll-mt-24 font-serif text-lg text-forest">Jelentkezés az egyéni programra</p>
        <ul>
          <Row what="A felmérés válaszai: az életmódodra és egészségedre vonatkozó adatok (táplálkozás, mozgás, alvás, stressz, szerhasználat, kapcsolatok), a problémád leírása, súlyossága és sürgőssége, valamint a szándékaid" why="az ismerkedő konzultáció előkészítése és — ha résztvevő leszel — a program személyre szabása" basis="kifejezett hozzájárulásod (GDPR 9. cikk (2) a) és 6. cikk (1) a)); a hozzájárulás a felmérés beküldésekor, időbélyeggel és a szöveg változatával rögzül, és bármikor visszavonható egy e-maillel" until="ha nem leszel résztvevő, a kitöltéstől számított 180 nap, utána automatikusan töröljük; résztvevőnél a program végét követő 1 év" />
          <Row what="Név, e-mail-cím, telefonszám (nem kötelező), a lefoglalt konzultációs időpont" why="kapcsolattartás és a konzultáció megszervezése" basis="a szerződés megkötését megelőző lépések (GDPR 6. cikk (1) b)" until="ugyanaddig, mint a felmérés válaszai" />
        </ul>
        <p className="text-sm text-ink-soft">
          A felmérés válaszait csak én látom. Ha visszavonod a hozzájárulásodat, a válaszaidat töröljük; ez a visszavonás
          előtti adatkezelés jogszerűségét nem érinti.
        </p>

        <p className="pt-3 font-serif text-lg text-forest">Az egyéni program</p>
        <ul>
          <Row what="A program kezdete és szakaszai, a személyre szabott gyakorlási terv, az alkalmak időpontja és megjegyzései, a heti beszámolóid és az azokra adott visszajelzés, a kipipált gyakorlások" why="a program lebonyolítása és a kísérés" basis="szerződés teljesítése (GDPR 6. cikk (1) b)); ha a beszámolóidban egészségi adatot is megosztasz, kifejezett hozzájárulásod alapján (9. cikk (2) a))" until="a program végét követő 1 év, utána automatikusan töröljük" />
          <Row what="Belső jegyzet a programról" why="a kísérés előkészítése; csak én látom" basis="szerződés teljesítése" until="a program végét követő 1 év" />
        </ul>

        <p id="cegeknek" className="scroll-mt-24 pt-3 font-serif text-lg text-forest">Céges ajánlatkérés</p>
        <ul>
          <Row what="A cég neve, székhelye és mérete, a kapcsolattartó neve, beosztása, e-mail-címe és telefonszáma, valamint az igényre vonatkozó válaszok" why="a céges ajánlat elkészítése és a kapcsolattartás" basis="a szerződés megkötését megelőző lépések, illetve jogos érdek (GDPR 6. cikk (1) b) és f))" until="az ajánlatkéréstől számított 1 év, utána automatikusan töröljük; szerződés esetén a szerződésre vonatkozó szabályok szerint" />
        </ul>

        <p className="pt-3 font-serif text-lg text-forest">Fiók és belépés</p>
        <ul>
          <Row what="E-mail-cím, név" why="a résztvevői fiók, a belépés (belépő link) és a kapcsolattartás" basis="szerződés teljesítése (GDPR 6. cikk (1) b)" until="a program végét követő 1 év" />
          <Row what="Napló-bejegyzések" why="saját gyakorlási napló, csak neked" basis="szerződés teljesítése" until="amíg nem törlöd, legkésőbb a fiók megszűnéséig" />
          <Row what="Értesítési beállítás (kérsz-e levelet az újdonságokról)" why="értesítő levél az új alkalmakról" basis="jogos érdek — bármikor leiratkozhatsz az Adataim oldalon vagy a levél alján" until="a fiók megszűnéséig" />
          <Row what="A megszűnt Társaság korábbi tagsági adatai (tagsági szint, előfizetés, haladás, közösségi bejegyzések)" why="a korábbi előfizetések lezárása és a jogszabályi kötelezettségek teljesítése" basis="szerződés teljesítése, illetve jogi kötelezettség (6. cikk (1) b) és c))" until="a tagság megszűnése után 1 év; a számlázási adatok 8 év" />
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
          <Row what="Az elállási jogról szóló nyilatkozat és időbélyege, az ÁSZF verziója" why="annak igazolása, hogy a foglaláskor tudomásul vetted az elállási jog hiányát" basis="jogi kötelezettség, illetve jogos érdek (6. cikk (1) c) és f))" until="5 év" />
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
          <li><strong>Google Ireland Ltd.</strong> (Google Meet — az egyéni online alkalmak, Írország)</li>
          <li><strong>Zoho</strong> (levelezés)</li>
          <li><strong>Billingo</strong> (számlázás, amint bekapcsoljuk)</li>
        </ul>
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
        Az adatbázisban minden táblán sorszintű jogosultság-ellenőrzés működik: mindenki csak a saját adatait éri el.
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
        A tájékoztatót a szolgáltatás változásával frissítjük; lényeges változásról a résztvevőket e-mailben értesítjük. Az{" "}
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
      meta={`Verzió: 2026-11 · Hatályos: ${LEGAL.effectiveFrom}`}
      sections={sections}
    />
  );
}
