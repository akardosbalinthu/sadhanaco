# CLAUDE.md — Kardos Bálint & Sadhana Idegrendszerfejlesztő Társaság (Teljes Kontextus és Rendszer-specifikáció)

## 1. Alapító, Számlázási Entitás és Szakmai Háttér
- **Név:** Kardos Bálint
- **Szakmai titulus és kompetenciák:**
  - Integratív meditációs és idegrendszer-fejlesztő tréner
  - Életmód-orvostani konzulens (Lifestyle Medicine Consultant)
  - RYT-500 minősítésű jógaoktató (Rishikesh, India — 500 órás képzés)
  - Az *Egy Kedves Üzenet* (műsor és márka) házigazdája és az *Integrált meditációs és idegrendszer-fejlesztő podcast* alkotója
- **Számlázási és jogi entitás (KRITIKUS):**
  - **Kardos Bálint egyéni vállalkozó (KATA adózó, alanyi adómentes — `AAM`)**.
  - A KATA törvényi szabályai miatt a platform kizárólag **magánszemélyeknek** értékesíthet, céges (B2B) adószámos számlázás szigorúan tilos!
  - Minden Számlázz.hu e-számlán az áfakulcs: **`AAM`**, nettó = bruttó összeggel, a fejlécben `kata="true"` jelöléssel.
- **Módszertani alapvetés és hangnem:**
  - A klasszikus kontemplatív hagyományok (légzésszabályozás, meditáció, szomatikus figyelemirányítás) és a modern idegtudomány / életmód-orvostan (polyvagális elmélet, vagus-tónus stimuláció, HRV, Default Mode Network szabályozás) ötvözése.
  - **Szigorúan tilos:** Bármilyen ezoterikus sallang, dogma, misztifikálás, spirituális zsargon vagy teljesítménykényszert keltő „hustle” marketing nyelvezet.
  - **Stílus:** Nyugodt, tiszta, földelt, tudományosan megalapozott, emberi és közvetlen magyar kommunikáció.

---

## 2. A Teljes Digitális és Fizikai Ökoszisztéma

A **Sadhana Idegrendszerfejlesztő Társaság** egy összehangolt ökoszisztéma központi elmélyülő tere:

1. **`akardosbalint.hu` (Központi weboldal és szakmai hub):**
   - Vercel hostingon fut (`DNS A: 216.198.79.1`), levelezése Zoho Mailen keresztül működik (`balint@akardosbalint.hu`, `info@akardosbalint.hu`).
   - Innen indulnak a látogatók a havi budapesti Nyílt Meditációs Estekre, a podcasthoz és a Társaságba.
2. **`tarsasag.akardosbalint.hu` (vagy `akardosbalint.hu/tarsasag`) — Sadhana Idegrendszerfejlesztő Társaság:**
   - **Ezt az egyedi Next.js webalkalmazást építjük most.**
3. **`egykedvesuzenet.hu` — Egy Kedves Üzenet (a műsor és a teljes márka neve; az „Egy Kedves Műsor” elnevezés nem használható):**
   - Élőben közvetített (YouTube / TikTok Live) és rövid videós formátum, ahol a nézők/tagok által beküldött hálaüzeneteket Bálint meglepetés-telefonhívásokon keresztül adja át.
   - Kapcsolódó fizikai termékek: *Egy Kedves Kártyajáték*, *Egy Kedves Könyv*, *Egy Kedves Doboz*.
   - **Integráció a Társasággal:** A Társaság tagjai havi keretük erejéig díjmentes **Elsőbbségi Kedves Üzenetet** küldhetnek (Társasági Tagság: havi 1 db; Belső Kör: havi 3 db), ezen felül pedig szabadon választott összegű díjért küldhetnek további üzeneteket (amelyek az összeg csökkenő sorrendjében kerülnek feldolgozásra). Jogilag ez **digitális szolgáltatás, nem adomány** — minden befizetésről AAM számla készül.
4. **`privatkozlony.hu` — Privát Közlöny *(jelenleg fejlesztés alatt álló projekt)*:**
   - AI-szerkesztett, éjszaka automatikusan (04:30-kor) kinyomtatott reggeli A4-es fekete-fehér fizikai újság (*Email-to-Print* támogatással), amely kiváltja a reggeli okostelefon-használatot és értesítési zajt.
   - **Integráció a Társasággal:** A Társaság adatbázisa előkészíti hozzá a jogosultsági zászlót (`profiles.privat_kozlony_pro = true`), és egy védett belső végpontot (`GET /api/internal/member-status`) biztosít, így amint a *Privát Közlöny* élesedik, az aktív Társasági tagok automatikusan, külön díj nélkül megkapják a teljes PRO verziót.
5. **Integrált meditációs és idegrendszer-fejlesztő podcast:**
   - 5–10 perces szóló epizódok (Spotify / Apple Podcasts) a stressz, a légzés és a figyelem neurobiológiájáról.
6. **Élő események Budapesten (pl. Udgama ECO Központ, max. 15 fő):**
   - Havi **Nyílt Meditációs Estek** (adomány / terembérleti hozzájárulás alapon, külsősök és tagok számára vegyesen).
   - Évi 4 zárt **Élő Gyakorlónap** (kizárólag a Társaság tagjainak).
   - Évi 3 zárt **Szabadság Elvonulás** (3–4 napos, kizárólag az *IP 3* programot elvégzett tagoknak).

---

## 3. A Sadhana Idegrendszerfejlesztő Társaság Működési Filozófiája

- **Jelmondat:** *Jelenlét – Tudatosság – Szabadság*
- **Közösségi kultúra („Tapasztalat, nem tanácsadás”):**
  - A Társaság nem egy egyszemélyes színház, ahol Bálint mindent megmond, hanem egy **öntevékeny, kölcsönös megtartó közösség (peer-to-peer ökoszisztéma)**.
  - A tagok nem diagnosztizálják és nem okítják egymást — saját gyakorlati tapasztalataikat, megfigyeléseiket osztják meg (pl. mi segített egy nehezebb esti gyakorlásnál).
  - **UI/UX tervezési törvények (Idegrendszer-barát felület):**
    - **TILOS** a nyilvános ranglista (leaderboard), a versengést keltő pontrendszer, a villogó jelvények és a tolakodó push/e-mail értesítések.
    - Nyugodt, papírszerű, minimalista dizájn: meleg törtfehér háttér (`#FAF9F6`), mély olajzöld/földszínű akcentusok (`#2D4739`), sötét antracit szöveg (`#1F2421`).
    - A posztoknál a klasszikus „Like” helyett két nyugodt reakciógomb van: **`Köszönöm, hasznos volt`** és **`Hasonlót tapasztaltam`**.
    - A hozzászólók neve mellett diszkréten megjelenik az aktuális gyakorlási fázisuk (`current_stage_label`, pl. `I. Modul · 4. hét` vagy `IP 3 Felkészülő`).
    - Külön szűrő van a **`Megválaszolatlan posztok`** kiemelésére, hogy a haladóbb tagok figyelme természetes módon azok felé forduljon, akik még nem kaptak választ.
    - Minden péntek reggel automatikusan kimegy egy közösségi körkérdés (`penteki_kor`) 3 egyszerű kérdéssel (*Mi volt a legnehezebb idegrendszeri helyzet a héten? Melyik gyakorlat működött élesben? Miben segíthet most a társaság?*).

---

## 4. Fejlődési és Tananyag-ív (Lépcsőzetes Hozzáférés)

A tananyag négy egymásra épülő lépcsőből áll. A belépő tagok látják a teljes ívet a menüben (zárt lakat ikonnal a még nem nyitott lépcsőknél), hogy lássák a fejlődési utat:

1. **1. Lépcső: I. Modul (Jelenlét) + I. Integrációs Program (IP 1 — 8+1 hét)**
   - Belépéskor azonnal elérhető minden aktív tagnak (`tier <> 'none'`).
   - Heti ütemezéssel (`week_number = 1..9`) nyílnak meg a rövid elméleti videók és napi 10–15 perces vezetett hanganyagok (légzésmechanika, Anapanaszati, Sama Vritti, Nadi Shodhana, Kájánupassaná), napi gyakorlás-pipálással.
2. **2. Lépcső: II. Modul (Tudatosság) + II. Integrációs Program (IP 2 — 8+1 hét)**
   - Elérhető: közösségi aktivitással vagy egyszeri gyorsított fizetéssel (`54 940 Ft`), illetve a *Belső Kör* tagjainak külön díj nélkül.
   - **Kritikus szabály:** Minden esetben **kizárólag admin manuális jóváhagyással** (`m2_unlocked = true`) nyílik meg a biztonságos folytonosság érdekében.
3. **3. Lépcső: III. Integrációs Program (IP 3 — 8+1 hét)**
   - A *III. Modul (Szabadság Elvonulás)* kötelező előfeltétele.
   - Elérhető: közösségi aktivitással vagy egyszeri gyorsított fizetéssel (`44 940 Ft`; *II. Modul + IP 3* kombinált csomagban: `89 940 Ft`), illetve a *Belső Kör* tagjainak külön díj nélkül.
   - **Kritikus szabály:** Kizárólag **admin manuális jóváhagyással** (`ip3_unlocked = true`) nyílik meg.
4. **4. Lépcső: III. Modul — Szabadság Elvonulás (évente 3 alkalommal, 3–4 napos zárt elvonulás)**
   - Kizárólag az *IP 3* elvégzése és admin jóváhagyás (`retreat_unlocked = true`) után válik láthatóvá és foglalhatóvá. Külsősök számára nem elérhető.

---

## 5. Tagsági Szintek, Árazás (HUF) és Kapacitási Szabályok

### Tier 1: Társasági Tagság (`tier = 'tarsasagi'`)
- **Ár:** `9 940 Ft / hó` | `99 400 Ft / év` *(2 hónap ajándék)* | Alapítói bevezető kuponnal: `7 940 Ft / hó`
- **Jogosultságok:**
  - Teljes közösségi tér és napi gyakorlási napló.
  - `I. Modul (Jelenlét) + IP 1 (8+1 hét)` azonnal nyitva.
  - Haladó modulok (`II. Modul + IP 2`: `54 940 Ft`, `IP 3`: `44 940 Ft`, csomagban: `89 940 Ft`) aktivitással vagy gyorsított vásárlással + admin jóváhagyással.
  - **Heti 1 online közös meditáció** (élő részvétel) + **Havi Q&A felvétel archívum** (kérdéseket élőben csak a *Belső Kör* tehet fel).
  - **Privát Közlöny PRO:** Aktív tagság alatt díjmentes (`privat_kozlony_pro = true`).
  - **Elsőbbségi Kedves Üzenet:** Havi `1 db` díjmentes (`free_messages_remaining = 1`); további üzenetek adomány alapon (összeg szerint csökkenő sorrendben feldolgozva).
  - **Havi Nyílt Meditációs Estek (Budapesten és online):** A személyes férőhelyek **maximum 50%-a** (pl. 15 fős teremben max. 7 fő) foglalható le a Társaságon belül, hogy mindig maradjon hely külsősöknek. A *Belső Kör* 48 órás előfoglalása után a fennmaradó társasági kvótára `3 200 Ft` terembérleti hozzájárulással (35% kedvezmény a 4 940 Ft-os külsős árból) lehet jelentkezni.
  - **Élő Gyakorlónapok (évi 4x — zárt közösségi esemény):** Külsősök elől teljesen zárt; részvétel `6 460 Ft` terembérleti hozzájárulással.
  - **III. Modul: Szabadság Elvonulás (évi 3x, IP 3 után):** Részvétel tiszta önköltségi áron (szállás, teljes vegán étkezés és terembérlet — kb. `65 000 – 85 000 Ft`).
  - **1-on-1 privát konzultáció:** Külsősök elől zárt egyéni konzultáció foglalási jog `15 000 Ft / alkalom` tagi alapáron.

### Tier 2: Belső Kör (`tier = 'belso_kor'`)
- **Ár:** `27 940 Ft / hó` | `279 400 Ft / év` *(2 hónap ajándék)* | Alapítói bevezető kuponnal: `22 940 Ft / hó`
- **Jogosultságok (minden Tier 1 elem + az alábbiak):**
  - **Teljes digitális tananyag-ív külön díj nélkül:** `II. Modul + IP 2` és `IP 3` felkészítő program is benne van az árban (admin szakmai ütemezésével és manuális nyitásával).
  - **Havi 1 élő Q&A aktív részvétel és kérdezési jog:** Kizárólag a *Belső Kör* tagjai léphetnek be az élő adásba és tehetnek fel kérdéseket.
  - **Privát Közlöny PRO:** Aktív tagság alatt díjmentes (`privat_kozlony_pro = true`).
  - **Elsőbbségi Kedves Üzenet:** Havi `3 db` díjmentes (`free_messages_remaining = 3`); további üzenetek adomány alapon.
  - **Havi Nyílt Meditációs Estek:** `0 Ft` (díjmentes terembérleti hozzájárulás) + **48 órás elsőbbségi helyfoglalás** az 50%-os társasági kvótán belül.
  - **Élő Gyakorlónapok (évi 4x — zárt):** `0 Ft` (díjmentes) + elsőbbségi helyfoglalás.
  - **III. Modul: Szabadság Elvonulás (évi 3x, IP 3 után):** `0 Ft` (teljesen díjmentes részvétel, szállással és teljes vegán étkezéssel együtt) + elsőbbségi helyfoglalás.
  - **1-on-1 privát konzultáció:**
    - Éves előfizetés (`279 400 Ft / év`) esetén: évi `4 alkalom` díjmentes (`0 Ft`, `free_consultations_remaining = 4`).
    - További alkalmak / havi előfizetőknek: kedvezményes `13 000 Ft / alkalom`.

---

## 6. Technikai Architektúra és Fejlesztési Szabályok

- **Tech Stack:**
  - **Frontend & Backend:** Next.js 15 (App Router, TypeScript, Server Actions, Server Components)
  - **Styling:** Tailwind CSS + Lucide React ikonok
  - **Adatbázis & Auth:** Supabase (PostgreSQL + Magic Link Auth + `FORCE ROW LEVEL SECURITY` minden táblán)
  - **Média tárhely:** Bunny.net Stream / Storage (időkorlátos aláírt URL-ekkel védett meditációs hanganyagok és oktatóvideók)
  - **Fizetés & Számlázás:** Stripe (HUF) + Számlázz.hu Agent API (KATA / `AAM` automatikus e-számlázás)
  - **Tranzakciós e-mailek:** Resend
  - **Hosting & Cron:** Vercel
- **Fejlesztési stratégia (Backend-First):**
  1. **Adatbázis és biztonság:** `001_initial_schema.sql` (`profiles`, `stripe_events`, `modules`, `lessons`, `lesson_completions`, `posts`, `comments`, `post_reactions`, `events`, `event_registrations`, `kind_messages` táblák, `FORCE RLS`) + `002_rpc_functions.sql` (`SECURITY DEFINER` atomi függvények `FOR UPDATE` zárolással a 48 órás előfoglaláshoz és kvótazároláshoz).
  2. **Stripe + KATA Számlázás:**
     - Checkout munkameneteknél `tax_id_collection: { enabled: false }` (csak magánszemélyek vásárolhatnak).
     - Idempotens `/api/webhooks/stripe` végpont: aláírás-ellenőrzés → `stripe_events` deduplikáció → `profiles` jogosultságok és havi/éves keretek frissítése → Számlázz.hu `AAM` + `kata="true"` e-számla kiállítása.
  3. **Belső ökoszisztéma végpont:** `GET /api/internal/member-status?email=...` (`INTERNAL_API_SECRET` fejléccel), amellyel a fejlesztés alatt álló *Privát Közlöny* élesítéskor lekérdezheti a tag `privat_kozlony_pro` státuszát.
  4. **Ütemezett feladatok:** Vercel Cron (`/api/cron/monthly-reset` hó 1-jén a `free_messages_remaining` visszaállítására; `/api/cron/friday-checkin` péntek reggelenként az automatikus közösségi körkérdéshez).
  5. **Szigorú tilalom:** Soha ne olvasd be és ne írd ki a `.env.local` fájl tartalmát (csak a `.env.example` sablont kezeld). Minden jogosultság-ellenőrzés szerveroldalon történjen.

---

## 7. Rögzített üzleti döntések (2026. november — kötelező érvényű)

### 7.1 KATA bevételi határ
- A KATA éves bevételi határának elérésekor **lezárjuk az új jelentkezéseket** (admin kapcsoló: `app_settings.registration_open`). Később valószínűleg Kft. lesz a megoldás — a számlázási réteg legyen cserélhető (számlázási entitás konfigurálható, ne legyen hardcode-olva).
- A rendszer naptári évenként összesíti a kiállított számlák összegét, és a **várható megújulásokat is beszámítva** figyelmeztet (pl. 80%-nál), mert a lezárás csak az új tagokat állítja meg.

### 7.2 Számlázás
- Az Elsőbbségi Kedves Üzenet **digitális szolgáltatás**, nem adomány.
- Nemzetközi (EU-s és EU-n kívüli) vásárlók **engedélyezettek**. A rendszer a bevételt külön összesíti: Magyarország / egyéb EU / EU-n kívül (a 10 000 eurós uniós OSS-határ figyeléséhez). Az ország a Stripe számlázási címből származik.
- **Nincs pénzvisszafizetés, nincs ügyfél által kért sztornó.** Admin-szintű sztornó csak hibásan kiállított számla javítására létezik.
- Fizetéskor kötelező jelölőnégyzet: a vásárló kéri az azonnali teljesítést, és tudomásul veszi, hogy ezzel elveszíti a 14 napos elállási jogát. A hozzájárulás időbélyeggel tárolva.
- Chargeback (`charge.dispute.created`) esetén admin értesítés.

### 7.3 Próbaidő
- **7 napos próba, kizárólag a havi Társasági Tagságra.** Az éves csomagra és a Belső Körre nincs próba. Bankkártya kötelező.
- Próba és alapítói kupon **nem vonható össze**.
- Egy e-mail-cím és egy bankkártya (Stripe card fingerprint) **csak egyszer** kaphat próbát.
- Próba alatt (`trialing`): tananyag + közösség elérhető. **Nem** elérhető: díjmentes Kedves Üzenet, eseményfoglalás, konzultációfoglalás.

### 7.4 Lemondás és visszatérés
- Lemondáskor a ciklus a következő számlázási dátumnál nem indul újra (`cancel_at_period_end`); a kifizetett időszak végéig a hozzáférés megmarad, utána **a teljes rendszerhez megszűnik**.
- Visszatérő tag **mindent elölről kezd**: haladás, admin által nyitott lépcsők (`m2_unlocked`, `ip3_unlocked`, `retreat_unlocked`) és a gyorsítva vásárolt modulok **nem állnak vissza**. Ezt a vásárlásnál és az ÁSZF-ben jól láthatóan jelezni kell.
- Volt tag posztjai és hozzászólásai **a nevével megmaradnak**, de a név nem kattintható, nincs profiloldal, nem jelenik meg gyakorlási fázis, és nem lehet neki üzenni.

### 7.5 Szintváltás
- Társasági Tagság → Belső Kör: **azonnali váltás, időarányos különbözet** (Stripe proration), AAM számlával.

### 7.6 Infrastruktúra
- Supabase projekt: `kqvxosoqmwscymaoqhyj` (eu-west-1). Fejlesztés helyben / külön branch-en, éles migráció csak Bálint jóváhagyásával.
- Vercel csapat: `akardosbalint1`.
- Minden ütemezés **Europe/Budapest** idő szerint értendő (a Vercel Cron UTC-ben fut — a nyári/téli időszámítást kezelni kell).

### 7.8 Döntések (2026. november 24.)
- **Superadmin:** `akardosbalint.hu@gmail.com` (regisztrációkor automatikusan `role = 'superadmin'`; `app_settings.superadmin_emails`). Szerepkört csak superadmin oszthat.
- **Számlázó:** a Számlázz.hu helyett **Billingo** (a dokumentum korábbi Számlázz.hu-említései ennek megfelelően értendők). **Jelenleg kézi számlázás** (`app_settings.invoice_provider = 'manual'`): a rendszer minden fizetésről rögzíti a számlázandó tételt az `invoices` táblában (ez adja a KATA/OSS-összesítőt), Bálint kézzel állítja ki a számlát, és az admin felületen utólag rögzíti a sorszámot. A Billingo API később kapcsol be; a réteg cserélhető (`src/lib/invoicing`). Az `AAM` / KATA szabályok változatlanok.
- **E-mail:** Resend, feladó: `balint@akardosbalint.hu`.
- **Stripe:** éles módban létrehozva (`docs/stripe-katalogus.md`). **Nincs alapítói kupon.** A belépési e-mail-cím a Stripe-fizetéskor megadott e-mail-cím.
- **Szabadság Elvonulás:** önköltséges ár eseményenként megadva — jóváhagyva.
- **Nyílt Est külsős résztvevői** bejelentkezés nélkül, a weboldalon keresztül fizetnek ezen a rendszeren (`4 940 Ft`, Stripe `nyilt_est_kulsos`). A külsős a teljes kapacitásig foglalhat; a tagokra az 50%-os kvóta vonatkozik.
- **Kereten felüli Kedves Üzenet:** minimum `1 000 Ft` (`app_settings.kind_message_min_huf`).
- **Címzett telefonszáma:** legfeljebb **180 napig** tárolva, utána napi ütemezett törlés (`purge_kind_message_phones`, pg_cron).

### 7.9 Döntések (2026. november 24., második kör)
- **Heti nyitás:** az egyéni belépés napjától.
- **Lépcsők és továbblépés:** alapból az I. Modul + IP 1 nyitva. A rendszer felkínálja a „Továbblépés” lehetőséget, ha a tag elvégezte az előző lépcsőt (letelt a 9 hét, és a leckék legalább 70%-át pipálta) **és** elérte a szükséges részvételi pontszámot (vagy gyorsítva vásárolt, vagy Belső Kör tag). A továbblépéshez **díjmentes, rövid konzultáció** tartozik Bálinttal, a lépcsőt **mindig Bálint nyitja kézzel** (`progression_requests`, `admin_decide_progression`).
- **Részvételi pontok:** vannak, de **privátak** — csak a tag maga és az admin látja, nincs ranglista, nincs összehasonlítás, másoknak nem jelenik meg (a 3. pont tilalmával összhangban). Súlyok és küszöbök: `app_settings.participation_weights`, `progression_points_required`.
- **Díjak:** **egyik sem adomány**, mindegyik szolgáltatási díj, alanyi adómentes (AAM) számlával — a Nyílt Est részvételi díja is. A dokumentum korábbi „adomány / hozzájárulás” kifejezései így értendők.
- **Online Nyílt Est létszáma:** eseményenként állítható (üresen hagyva korlátlan).
- **Belső Kör konzultációk:** évi 4, évfordulós nullázással, **nem görgethető tovább**.
- **Sikertelen terhelés:** a hozzáférés megmarad, a tag azonnal e-mail értesítést kap; 10 napon belül összesen 5 újrapróbálkozás, utána a hozzáférés megszűnik (`past_due_grace_days = 10`; Stripe-beállítás: `docs/stripe-katalogus.md`).
- **Bevételi határok:** 2026-ban a KATA-határ 18 M Ft; 2027-től 22 M Ft, de az alanyi adómentesség határa 20 M Ft marad — a kötő határ a kettő közül a kisebb (`revenue_limits`). EUR-árfolyamot nem kezelünk, minden fizetés forintban.
- **Sztornószámla nincs.** Lemondás csak a következő számlázási ciklustól él, addig a hozzáférés megmarad (a 7.2 admin-sztornóra vonatkozó mondata ezzel hatályát veszti).
- **Díjmentes Kedves Üzenet és Privát Közlöny PRO:** az első sikeres fizetés napjától jár; próbaidő alatt nem.
- **Ütemezések:** a hó 1-jei keret-visszaállítás, a pénteki kör és a bevételi figyelmeztetés az adatbázisban fut (pg_cron óránként, Budapest-idő szerinti ellenőrzéssel), így nem kell hozzá Vercel Cron.

### 7.10 Döntések (2026. november 24., harmadik kör)
- **Új név:** a „Sadhana Idegrendszerfejlesztő Társaság” neve mostantól **„A Társaság”**. A fókusz: az idegrendszer-fejlesztés mellett **a kedvesség, a figyelmesség, a tudatosság és a segítőkészség**. A dokumentum korábbi elnevezései így értendők.
- **Privát Közlöny → Napi Közlöny.** (Az adatbázisban a jogosultsági mező neve technikai okból `privat_kozlony_pro` marad.)
- **Nincs szakmai podcast** — a weboldalról lekerült.
- **Végzettségek (pontos megnevezés):** Életmód-tanácsadó (Lifestyle Medicine Consultant, LifestylePro Academy); Jógaoktató (RYT-500, Rudra YogPeeth Yoga Ashram, Rishikesh). Bemutatkozó mondat: „Kedves üzeneteket kézbesítek, segítek a telefonmentes napindításban, A Társaság tagjainak pedig az idegrendszer-fejlesztésben.”
- **A fő weboldalon saját aloldal** van az Egy Kedves Üzenetnek (`/egy-kedves-uzenet`) és a Napi Közlönynek (`/napi-kozlony`).

### 7.11 Küldetés és közös túra (2026. november 24.)
- **A Társaság küldetése:** „A Társaság tagjaival azon dolgozunk, hogy jobb hellyé tegyük a világot — először magunkkal kezdve.” Az idegrendszer-fejlesztés ennek egy része (az alapja); mellette a kedvesség, a figyelmesség, a tudatosság és a segítőkészség.
- **Havi 1 közös túra** a Társaság tagjaival, Magyarországon. **Hónaponként egy szavazás**: Bálint **5–10 úti célt** ír ki, a tagok választanak. A túra **a tagoknak ingyenes**; Társaságon kívüliek **csak meghívóval** jöhetnek, és **nekik is ingyenes** (meghívót aktív tag küldhet, túránként legfeljebb `app_settings.hike_guest_invites_per_member` = 2 vendéget; `invite_hike_guest`, `accept_hike_invitation`). A túra nyilvánosan nem foglalható, díj nem állítható be rá. A következő úti célt mindig **a Társaság szavazza meg** (`destination_polls` / `destination_options` / `destination_votes`, `cast_destination_vote`, `admin_close_destination_poll`; eseménytípus: `tura`). A szavazás állása a lezárásig rejtett — csak a saját szavazatodat látod —, hogy ne legyen verseny vagy nyomás. Holtversenynél Bálint dönt.

### 7.7 Nyitott kérdések (implementáció előtt egyeztetni)
- A kereten felüli Kedves Üzenetek és a Nyílt Estek „hozzájárulása” is szabadon választott összegű szolgáltatási díjként, AAM számlával megy-e (feltételezés: igen).
- Mi számít „közösségi aktivitásnak” a II. és III. lépcső megnyitásánál (ne csússzon pontrendszer felé — lehet tisztán admin döntés).
- Az I. Modul és az IP 1 viszonya; a heti nyitás egyéni belépési dátumtól vagy kohorsz-indulással számít.
- Az online Nyílt Estek létszámkorlátja.
- Az éves Belső Kör 4 konzultációja: évfordulós nullázás, fel nem használt alkalmak sorsa, évközi váltás esete.
- A fő `akardosbalint.hu` oldal jelenleg nem található a Vercel `akardosbalint1` csapatban — hol fut?
