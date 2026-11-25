/**
 * A Ceremónia személyre szóló kiértékelésének szövegei.
 * A modell: docs/ceremonia.md (stresszválasz, interocepció, elkalandozó elme, szabályozás, légzés).
 * Önismereti eszköz, nem diagnózis; konkrét gyakorlatnevet nem említünk, csak a gyakorlás jellegét.
 */

export type MemberOrder = "tundek" | "kertorzok" | "torpok" | "vandorok";

type Portrait = {
  intro: string;
  stress: string;
  body: string;
  mind: string;
  recharge: string;
  strength: string;
  learn: string;
  practice: string;
  /** Ha ez a rend a második hangod. */
  asSecond: string;
  /** Ha ez a rend a legkevésbé jellemző rád: ebben az irányban tanulhatsz a legtöbbet. */
  asGrowth: string;
};

export const PORTRAITS: Record<MemberOrder, Portrait> = {
  tundek: {
    intro:
      "Az idegrendszered finoman hangolt műszer. Sok mindent észreveszel, ami mások figyelmét elkerüli: a hangulatok apró változását, egy mondat mögötti feszültséget, a tested halk jelzéseit. Ez a mély feldolgozás ajándék – és egyben az is, ami időnként elfáraszt.",
    stress:
      "Feszült helyzetben könnyen elárasztanak a benyomások és az érzések. Az első késztetésed a visszahúzódás: távolságot teremteni, hogy rendezhesd magadban, ami történt. Ez nem gyengeség, hanem az idegrendszered védekezése a túlterhelés ellen.",
    body:
      "A tested jelzéseit finoman és korán érzékeled – néha olyan erősen, hogy maga az érzékelés is terhelővé válik. A feladatod nem az, hogy kevesebbet érezz, hanem hogy legyen hova letenned, amit érzel.",
    mind:
      "Amikor a figyelmed elkalandozik, hangulatok, árnyalatok és mások érzései felé fordul. Gyakran azon kapod magad, hogy egy beszélgetés után még sokáig benned visszhangzik, ki mit érezhetett.",
    recharge:
      "Csend, kevés inger és egyedül töltött idő tölt vissza. Ez nem menekülés a világ elől: így tér vissza az idegrendszered az egyensúlyi állapotába.",
    strength:
      "Belső érzékelésed és empátiád ritka erőforrás. Te veszed észre elsőként, ha valami megváltozik – benned vagy körülötted –, és ez egy közösségben felbecsülhetetlen.",
    learn:
      "Az úton a határaidat tanulod: hogyan maradj nyitott úgy, hogy közben nem áraszt el a világ. A talaj érzése – a súlyod, a talpad, a test alsó részének érzékelése – és a hosszabb kilégzés lesznek a legjobb szövetségeseid.",
    practice:
      "Neked a testen lassan végighaladó figyelem és a kilégzés finom meghosszabbítása hozza a legtöbbet. Rövidebb, csendes alkalmakkal kezdj, kevés ingerrel; inkább naponta tíz perc, mint hetente egy hosszú ülés.",
    asSecond: "a finom érzékelés: gyakran előbb érzed meg, mi történik, mint ahogy szavakba tudnád önteni",
    asGrowth:
      "a finomabb érzékelés iránya: megtanulni meghallani a tested halkabb jelzéseit, mielőtt hangossá válnának. A gyakorlásban ezt a lassú, kíváncsi testérzékelés fejleszti.",
  },
  kertorzok: {
    intro:
      "Melletted mások megnyugszanak. A jelenléted biztonságot ad: az idegrendszered természetes módon hangolódik rá a körülötted élőkre, és csendesíti őket. A szaknyelv ezt ko-regulációnak hívja – te egyszerűen így működsz.",
    stress:
      "Feszült helyzetben elsőként csitítasz és alkalmazkodsz, hogy helyreálljon a béke – akár a saját igényeid rovására is. Mások ilyenkor biztos pontnak látnak, miközben benned sokszor ott marad a kimondatlan feszültség.",
    body:
      "A tested jelzéseire leginkább akkor figyelsz fel, amikor a megszokott ritmusod megbillen: rosszabbul alszol, kimarad egy étkezés, vagy elmarad a napi sétád.",
    mind:
      "Az elkalandozó figyelmed a hozzád közel állók igényei körül jár: ki hogy van, kinek mire lenne szüksége, mit kellene még elintézni a többiekért.",
    recharge:
      "Meleg, ismerős közeg és valódi kapcsolódás tölt vissza: egy jó beszélgetés, egy közös étkezés, az otthonod megszokott rendje.",
    strength:
      "A biztonságot sugárzó jelenléted. Ahol vagy, ott csendesebb lesz a tér, és az emberek mernek önmaguk lenni.",
    learn:
      "Az úton azt tanulod, hogy a saját igényeid is számítanak: nemet mondani, kilépni a megszokottból, és ugyanazt a gondoskodást magad felé is fordítani, amit olyan természetesen adsz másoknak.",
    practice:
      "Neked az egyenletes, nyugodt ritmusú légzés és a kiszámítható, mindig azonos időben végzett gyakorlás hozza a legtöbbet – egy biztos pont a napodban, amely csak a tiéd.",
    asSecond: "a gondoskodó jelenlét: természetes módon figyelsz arra, hogy körülötted mindenki jól legyen",
    asGrowth:
      "a belső béke iránya: megérkezni egy nyugodt, egyenletes ritmusba, és ott is maradni. A gyakorlásban ezt a lassú, kiegyensúlyozott légzés és a rendszeresség építi.",
  },
  torpok: {
    intro:
      "Az idegrendszered a szilárd talajt keresi. Te vagy az, akire számítani lehet: amit elkezdesz, végigviszed, és a káoszban is szerkezetet teremtesz. A rend nálad nem merevség, hanem biztonság.",
    stress:
      "Feszült helyzetben megfeszülsz, és az eszed rögtön azon jár, mi a teendő és hogyan tarthatod kézben a helyzetet. Ez gyors és hatékony válasz – csak éppen a tested sokáig benne marad.",
    body:
      "A tested jelzései gyakran feszülésként érkeznek, és sokszor későn: amikor a váll, az állkapocs vagy a gyomor már régóta tart valamit. Az út egyik nagy felfedezése lesz, hogy ezt hamarabb is észreveheted.",
    mind:
      "Az elkalandozó figyelmed teendők, tervek és hiányok körül forog: mi maradt el, mit kellene még átgondolni, mi lesz holnap.",
    recharge:
      "Rend, lezárt ügyek és kiszámíthatóság töltenek vissza: egy kipipált lista, egy rendbe tett szoba, egy nap, amely úgy alakul, ahogy tervezted.",
    strength:
      "Kitartásod és szerkezetteremtő képességed. A rendszeresség, amely másoknak nehéz, neked természetes – és a gyakorlásban ez óriási előny.",
    learn:
      "Az úton az elengedést tanulod: hogy a pihenés nem jutalom, amit ki kell érdemelni, és hogy a kontroll lazításával nem esik szét semmi. Sőt: éppen ilyenkor kapcsol át az idegrendszered regenerálódásra.",
    practice:
      "Neked a kiegyensúlyozó, váltakozó ritmusú légzés és a világos, mindig azonos szerkezetű gyakorlás hozza a legtöbbet – a végén pedig néhány perc, amikor semmit nem kell csinálni, csak ott lenni.",
    asSecond: "a belső rend: szereted, ha a dolgoknak helye és ritmusa van, és ez biztonságot ad",
    asGrowth:
      "az állhatatosság iránya: kicsi, de rendszeres lépésekkel haladni akkor is, amikor épp nincs kedved. A gyakorlásban ezt a minden nap azonos időben végzett, rövid alkalom erősíti.",
  },
  vandorok: {
    intro:
      "Az idegrendszered mozgásra és irányra hangolt. Ott vagy a legjobb formádban, ahol történik valami: kezdeményezel, döntesz, és nyomás alatt is fókuszban maradsz. A nyugalom nálad nem a mozdulatlanságban, hanem az irányban rejlik.",
    stress:
      "Feszült helyzetben felpörögsz: mozdulni, cselekedni vagy visszaszólni akarsz. Ez a klasszikus „harcolj vagy menekülj” válasz, amely nálad gyorsan beindul – és sokszor jól is szolgál, csak nehéz utána leállni.",
    body:
      "Menet közben alig érzékeled a tested jelzéseit. A fáradtság, az éhség vagy a feszültség sokszor csak akkor ér utol, amikor megállsz – este, hétvégén, vagy az első szabadnapon.",
    mind:
      "Az elkalandozó figyelmed lehetőségeken és „mi lenne, ha…” kérdéseken jár: új tervek, új utak, a következő lépés.",
    recharge:
      "Mozgás, szabadban töltött idő és újdonság töltenek vissza. Egy hosszú séta vagy egy új hely többet ad, mint egy nap a kanapén.",
    strength:
      "Bátorságod és fókuszod. Ott is lépni mersz, ahol mások még mérlegelnek, és ezzel másoknak is utat nyitsz.",
    learn:
      "Az úton a lelassulást tanulod: megérkezni a pillanatba, és felfedezni, hogy a nyugalom nem állóvíz, hanem egy másik fajta erő, amiből a legjobb döntéseid születnek.",
    practice:
      "Neked a légzés egyszerű, kíváncsi követése hozza a legtöbbet – eleinte rövid alkalmakkal, akár mozgás után, amikor a tested már kiengedett. A túrák és a közös alkalmak neked különösen jót tesznek.",
    asSecond: "a bátor lendület: ha valami fontos, nem vársz sokáig a lépéssel",
    asGrowth:
      "a bátorság iránya: kilépni a megszokottból, és egy új helyzetben is a saját irányodat követni. A gyakorlásban ezt a közös alkalmak és a túrák is segítik.",
  },
};

/** A 12 kérdés dimenziója (docs/ceremonia.md, pozíció szerint). */
export const DIMENSIONS: Record<number, string> = {
  1: "Stresszválasz",
  2: "Visszatöltődés",
  3: "A tested jelzései",
  4: "Légzés feszültségben",
  5: "Elkalandozó figyelem",
  6: "Közösségben",
  7: "Újdonság és megszokás",
  8: "Ami kimerít",
  9: "Amit a gyakorlástól vársz",
  10: "Ha nem megy",
  11: "Az energiád",
  12: "Ahogy mások látnak",
};
