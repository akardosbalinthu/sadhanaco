import Link from "next/link";
import {
  BookOpen,
  Dices,
  UtensilsCrossed,
  Check,
  Ear,
  HeartHandshake,
  Moon,
  Mountain,
  Newspaper,
  Sparkles,
  Sun,
  Users,
  Wind,
} from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { formatHuf, tp } from "@/lib/site";
import { notifyHref } from "@/lib/cta";
import { onlinePaymentsEnabled } from "@/lib/stripe";
import {
  buttonPrimary,
  buttonSecondary,
  CompassDivider,
  CrestKertorzok,
  CrestTorpok,
  CrestTundek,
  CrestVandorok,
  GildedCard,
} from "@/components/ornaments";

export const revalidate = 300;

const BENEFITS = [
  {
    Icon: Wind,
    title: "Megnyugodni, amikor számít",
    text: "Néhány perces légzéstechnikák, amelyeket egy feszült megbeszélés előtt vagy egy nehéz beszélgetés közben is használhatsz — nem csak a jógaszőnyegen.",
  },
  {
    Icon: Ear,
    title: "Észrevenni, mielőtt elsodor",
    text: "A tested korán jelez. Megtanulod időben észrevenni a feszülést, és nem az utolsó pillanatban kapkodni.",
  },
  {
    Icon: Sun,
    title: "Jobban jelen lenni",
    text: "Kevesebb pörgés a fejben, több figyelem arra, ami előtted van: a munkádra, a szeretteidre, saját magadra.",
  },
  {
    Icon: HeartHandshake,
    title: "Kedvesebbnek lenni — magaddal is",
    text: "Nyugodtabb idegrendszerrel könnyebb türelmesnek, figyelmesnek és segítőkésznek lenni. Ezt gyakoroljuk egymás felé is.",
  },
];

const STEPS = [
  {
    title: "Csatlakozol",
    text: "Kiválasztod az utad, és e-mailben megkapod a belépő linket — jelszó nincs. A havi tagságot 7 napig kipróbálhatod.",
  },
  {
    title: "Részt veszel a Ceremónián",
    text: "Egy 12 kérdéses önismereti kérdőív — a Ceremónia — eldönti, melyik rendbe kerülsz: Tündék, Kertőrzők, Törpök vagy Vándorok.",
  },
  {
    title: "Tréningnap, aztán nyolc hét",
    text: "Az első lépcső egy tréningnappal indul, utána nyolc hétig reggel és este gyakorolsz, hetente beszámolsz, és egy gyakorlótárs kísér az úton.",
  },
  {
    title: "Közösen haladsz",
    text: "Közös meditáció, pénteki kör, budapesti alkalmak, havi túra. Amikor készen állsz, egy rövid beszélgetés után továbblépsz.",
  },
];

const ORDERS = [
  {
    name: "Tündék",
    Crest: CrestTundek,
    gift: "Finom érzékelés és tudatosság",
    motto: "Ők veszik észre elsőként, ha megváltozik a levegő.",
    signs: [
      "Belépsz egy szobába, és már érzed, milyen a hangulat.",
      "A tested korán szól: a gyomrod, a vállad, a légzésed jelez, mielőtt a fejed rájönne.",
      "Megérint egy jól eltalált mondat, egy fény, egy apró részlet.",
    ],
    strength: "Finomhangolt belső érzékelés és mély empátia. Ahol mások zajt hallanak, te árnyalatokat.",
    path: "Hogy az érzékenység ne árasszon el: határok, földelés, hosszabb kilégzés — érezni, de nem elsodródni.",
  },
  {
    name: "Kertőrzők",
    Crest: CrestKertorzok,
    gift: "Jelenlét és belső béke",
    motto: "Számukra a világ egy kertben kezdődik: amit gondozol, az megnő.",
    signs: [
      "Szereted a ritmust: a csendes reggelt, a meleg teát, az ismerős utat.",
      "A kis dolgokban találod meg az örömöt, és nem kell hozzá nagy esemény.",
      "Körülötted mások hamar otthon érzik magukat.",
    ],
    strength: "Nyugalmat sugárzó jelenlét. Az idegrendszered biztonságérzete a környezetedre is átragad.",
    path: "Kilépni a megszokottból, amikor a növekedés hív — és nemet mondani, hogy a kert a tiéd maradjon.",
  },
  {
    name: "Törpök",
    Crest: CrestTorpok,
    gift: "Állhatatosság és belső rend",
    motto: "Mélyre ásnak, és amit építenek, az megmarad.",
    signs: [
      "Ha belekezdesz valamibe, végigviszed — akkor is, ha senki sem figyel.",
      "Megnyugtat a rend, a jól átlátható terv, a megbízható szokás.",
      "Rád lehet számítani, és ezt te is fontosnak tartod másokban.",
    ],
    strength: "Kitartás és szerkezet. A nehezebb napokon is ott vagy a gyakorlásnál, és ez tart meg.",
    path: "Lazítani a szorításon: a kontroll helyett megengedni, és a pihenést is gyakorlásnak tekinteni.",
  },
  {
    name: "Vándorok",
    Crest: CrestVandorok,
    gift: "Bátorság és fókusz",
    motto: "Az út az otthonuk; a kihívás kitisztítja őket.",
    signs: [
      "A változás feltölt, a túl hosszú egyhelyben állás nyugtalanná tesz.",
      "Nyomás alatt élesebb lesz a figyelmed, nem tompább.",
      "Szívesen kipróbálsz valami újat, mielőtt minden részletét értenéd.",
    ],
    strength: "Mozgósítható energia, jó irányba fordítva: kezdeményezés, fókusz és bátorság a nehéz helyzetekben.",
    path: "Megérkezni: lassítani úgy, hogy a nyugalom ne unalomnak, hanem erőgyűjtésnek tűnjön.",
  },
];

const DAY = [
  {
    Icon: Newspaper,
    when: "Reggel",
    name: "Analóg Reggel",
    text: "A nap a kinyomtatott Napi Közlönnyel indul — a leveleidből és a naptáradból összeállított napi lappal —, nem a telefonnal. Utána egy rövid reggeli meditációs rituálé.",
  },
  {
    Icon: Wind,
    when: "Napközben",
    name: "Napi Küldetés",
    text: "Egy elmélyültebb meditáció — az első lépcsőben 15–45 perc, hetente 3–7 alkalommal. Ott, ahol éppen vagy.",
  },
  {
    Icon: BookOpen,
    when: "Amikor kérdésed van",
    name: "A Tudás Ösvénye",
    text: "Rövid hanganyagok arról, mi történik ilyenkor az idegrendszereddel — mert amit értesz, azzal könnyebb dolgozni.",
  },
  {
    Icon: Moon,
    when: "Este",
    name: "Belső Tükör",
    text: "Esti rituálé, és néhány sor a gyakorlónaplóba: mit vettél észre ma, ami tegnap még elkerülte a figyelmed?",
  },
];

const PATH = [
  {
    step: "I. lépcső",
    badge: "Belépéskor nyílik",
    parts: [
      {
        kind: "Tréning",
        title: "I. Modul — Jelenlét",
        sub: "IMI Tréning 1 · egy teljes tréningnap",
        paras: [
          "Egy teljes nap, amely a jelenlét alapjait rakja le. Megtanulod, hogyan nyithatod újra a tüdőd teljes kapacitását a rekeszizom tudatos használatával, és hogyan kapcsolhatod be másodpercek alatt a nyugalomért felelős paraszimpatikus idegrendszert — például egy nyilvános beszéd vagy egy konfliktus előtt.",
          "Megismered, hogyan csökkentheted a szenzoros túlterheltséget, és hogyan csendesítheted el a túlgondolásért felelős agyi hálózatot — a mélyebb alvásért és a tisztább jelenlétért. A nap egy megérkezést segítő meditációval indul, és egy rövid, elcsendesedés előtti felkészítő sorral zárul, amelyet otthon is használhatsz.",
        ],
      },
      {
        kind: "Integrációs program",
        title: "I. Integrációs Program — IP 1",
        sub: "8+1 hét · heti beszámolóval",
        paras: [
          "Itt válik a tréningnap tapasztalata mindennapi képességgé. Nyolc héten át reggel és este gyakorolsz, és hetente 3–7 alkalommal egy 15–45 perces, elmélyültebb meditációt végzel. Minden héten rövid beszámolót adsz, és váltakozó gyakorlótársakkal kísérjük egymást, hogy senki ne maradjon egyedül az úton.",
          "A +1. alkalom a közös lezárás. Ehhez a vállalt gyakorlások legalább 80%-át kell teljesítened; a lépcsőt személyes áldással zárjuk.",
        ],
      },
    ],
  },
  {
    step: "II. lépcső",
    badge: "Beszélgetés után nyílik",
    parts: [
      {
        kind: "Tréning",
        title: "II. Modul — Tudatosság",
        sub: "IMI Tréning 2 · egy teljes tréningnap",
        paras: [
          "Az alapozáson túl ez a nap a szívritmus-változékonyság (HRV) mély stabilizálására, a két agyfélteke összehangolására és az „üss vagy fuss” reakció tudatos leállítására épül — a tartós idegrendszeri áthuzalozásért.",
          "Megtanulod a légzésfigyelés teljes ívét: a nyugodt, tiszta megfigyeléstől az elemző elmélyülésig, amellyel a belső csend tartósan fenntartható. A nap egy összesen hatvanperces, elmélyült üléssel csúcsosodik ki.",
        ],
      },
      {
        kind: "Integrációs program",
        title: "II. Integrációs Program — IP 2",
        sub: "8+1 hét · heti beszámolóval",
        paras: [
          "Fókuszban a belső kritikus elhalkítása és az érzelmi stabilitás. Elméletben megismered az elme működését, szintjeit és állapotait, a jóga nyolc ágát — egy fa példáján —, valamint a hagyomány etikai alapelveit.",
          "Reggel és este gyakorolsz, hetente 3–7 alkalommal egy 30–60 perces meditációval. A 4. héttől egy együttérzés-gyakorlat is csatlakozik, amelyben a jóindulatot hétről hétre szélesebb körre terjeszted ki: önmagadtól a szeretteiden és a számodra semleges embereken át a nehéz kapcsolataidig, végül minden élőlényig. A +1. alkalom a közös lezárás, személyes áldással.",
        ],
      },
    ],
  },
  {
    step: "III. lépcső",
    badge: "Beszélgetés után nyílik",
    parts: [
      {
        kind: "Integrációs program",
        title: "III. Integrációs Program — IP 3",
        sub: "8+1 hét · felkészülés az elvonulásra · heti beszámolóval",
        paras: [
          "Fókuszban az öt mentális akadály tudatos, elemző szétbontása, és az út a kikezdhetetlen, tiszta jelenlétig — ahhoz a minőséghez, amikor másoknak is biztonságos teret tudsz tartani. Elméletben az elme „mérgeivel”, a háromtest-elmélettel és a filozófia hat nagy kérdésével foglalkozunk.",
          "Reggel és este gyakorolsz, hetente 3–7 alkalommal egy 45–90 perces meditációval, mellette rövid, elemző és kérdező elmélyülésekkel. A feltétel a II. lépcső elvégzése, a +1. alkalom a közös lezárás, személyes áldással. Az IP 3 a Szabadság Elvonulás előfeltétele.",
        ],
      },
    ],
  },
  {
    step: "IV. lépcső",
    badge: "Az IP 3 után",
    parts: [
      {
        kind: "Elvonulás",
        title: "III. Modul — Szabadság",
        sub: "IMI Tréning 3 · kétnapos elvonulás · évente háromszor",
        paras: [
          "Intenzív, haladó neurobiológiai és szomatikus tréning két napban. A cél a valóság három rétege — a testi, a mentális és a tudati — közötti merev határok feloldása: hogy se a fizikai azonosulásba, se a valóság elől való menekülésbe ne ragadj bele, hanem szabadon mozogj a rétegek között.",
          "Megismered a jógahagyomány finomenergetikai fogalmait és neurobiológiai megfelelőiket — a sejtszintű energiától a szimpatikus és paraszimpatikus idegrendszeren át az idegfonatokig —, valamint a tudat négy állapotát az ébrenléttől a tiszta megfigyelőig. Csak az IP 3 után, Bálinttal egyeztetve lehet jelentkezni; a Belső Kör Tagjainak díjmentes, A Társaság Tagjainak önköltséges áron.",
        ],
      },
    ],
  },
];


const RANKS = ["Kereső", "Figyelő", "Horgonyzó", "Csendőrző", "Egyensúlyozó", "Útitárs", "Őrző"];

const COMMUNITY = [
  { Icon: Users, title: "Heti online közös meditáció", text: "Élőben, együtt — bárhonnan bekapcsolódhatsz." },
  { Icon: Sparkles, title: "Pénteki kör", text: "Három egyszerű kérdés minden péntek reggel: mi volt nehéz, mi működött, miben segíthet a Társaság." },
  { Icon: Mountain, title: "Havi közös túra", text: "Valahol Magyarországon; az úti célt a tagok szavazzák meg. Ingyenes, és barátot is hozhatsz." },
  { Icon: HeartHandshake, title: "Elsőbbségi Kedves Üzenet", text: "Havonta díjmentesen köszönetet küldhetsz valakinek — Bálint telefonon adja át." },
  { Icon: Dices, title: "Havi élő szerepjáték- és társasjáték-est", text: "D&D-kaland vagy egy jó társasjáték: egy este, amikor együtt nevetünk, tervezünk és játszunk — mert a kapcsolódás is idegrendszer-fejlesztés." },
  { Icon: UtensilsCrossed, title: "Negyedéves vacsorameghívás", text: "Negyedévente a negyedéves ranglista első tíz helyezettje személyes vacsorameghívást kap Bálinttól — akkor is, ha elrejtette magát a listáról." },
];

const TIERS = [
  {
    name: "A Társaság Tagja",
    subtitle: "Tagsági szint I.",
    monthly: "tarsasagi_havi",
    yearly: "tarsasagi_eves",
    forWhom: "Neked való, ha most kezdenéd, és a saját tempódban, közösségben szeretnéd megtapasztalni, mit ad a rendszeres gyakorlás.",
    note: "A havi tagság 7 napig ingyen kipróbálható.",
    features: [
      "I. Modul (Jelenlét) + I. Integrációs Program — 8+1 hét, azonnal",
      "Napi Küldetések, gyakorlónapló és saját Karakterkártya",
      "Közösségi tér, pénteki kör, heti online közös meditáció",
      "Havi Q&A felvételek",
      "Havi ingyenes közös túra — vendéget is hozhatsz",
      "Havi élő szerepjáték- (D&D) és társasjáték-est",
      "Heti, havi és negyedéves ranglista a tagoknak — elrejtheted magad",
      "Negyedévente vacsorameghívás Bálinttól a ranglista első tíz helyezettjének",
      "Havi 1 díjmentes Elsőbbségi Kedves Üzenet",
      "Napi Közlöny PRO díjmentesen, amint elindul",
      "Nyílt Est 3 200 Ft-ért (4 940 Ft helyett), Élő Gyakorlónap 6 460 Ft",
      "1-on-1 konzultáció tagi áron: 15 000 Ft",
      "A II. és III. lépcső díjmentesen nyílik a rangoddal (Horgonyzó, illetve Csendőrző) — fizetni csak akkor kell, ha gyorsítanál",
    ],
  },
  {
    name: "A Belső Kör Tagja",
    subtitle: "Tagsági szint II.",
    monthly: "belso_kor_havi",
    yearly: "belso_kor_eves",
    forWhom: "Neked való, ha végig szeretnél menni az úton, személyes figyelemmel, és minden élő alkalmon díj nélkül ott lennél.",
    note: "Minden, ami A Társaság Tagjának jár, és még:",
    features: [
      "A teljes tananyag-ív külön díj nélkül — II. Modul, IP 2 és IP 3 is",
      "Havi élő Q&A, ahol te is kérdezhetsz",
      "Havi 3 díjmentes Elsőbbségi Kedves Üzenet",
      "Díjmentes Nyílt Estek, 48 órás elsőbbségi foglalással",
      "Díjmentes Élő Gyakorlónapok",
      "Díjmentes Szabadság Elvonulás, szállással és vegán ellátással",
      "Éves tagságnál évi 4 díjmentes 1-on-1 konzultáció, egyébként 13 000 Ft",
    ],
  },
];

/** Teljes összehasonlítás: "✓" = benne van, "—" = nem elérhető, egyébként a pontos feltétel. */
type CompareRow = [feature: string, external: string, tier1: string, tier2: string];
const COMPARE: { group: string; rows: CompareRow[] }[] = [
  {
    group: "Tananyag és gyakorlás",
    rows: [
      ["A Ceremónia és a rended", "—", "✓", "✓"],
      ["I. Modul (Jelenlét) + IP 1 · 8+1 hét", "—", "✓ azonnal", "✓ azonnal"],
      ["II. Modul (Tudatosság) + IP 2 · 8+1 hét", "—", "díjmentesen nyílik, amikor elvégezted az I. lépcsőt és eléred a Horgonyzó rangot (500 XP). Ha nem várnád meg a rangot: 54 940 Ft. Mindkét esetben egy rövid beszélgetés után.", "✓ díjmentes, az I. lépcső után, beszélgetés után"],
      ["III. Integrációs Program (IP 3) · 8+1 hét", "—", "díjmentesen nyílik, amikor elvégezted a II. lépcsőt és eléred a Csendőrző rangot (1 200 XP). Ha nem várnád meg a rangot: 44 940 Ft (a II. és III. lépcső együtt 89 940 Ft). Mindkét esetben egy rövid beszélgetés után.", "✓ díjmentes, a II. lépcső után, beszélgetés után"],
      ["Napi Küldetések és vezetett gyakorlások", "—", "✓", "✓"],
      ["Belső Tükör — privát gyakorlónapló", "—", "✓", "✓"],
      ["Karakterkártya, XP és rang", "—", "✓", "✓"],
      ["Díjmentes továbblépési beszélgetés Bálinttal", "—", "✓", "✓"],
    ],
  },
  {
    group: "Közösség és online alkalmak",
    rows: [
      ["Közösségi tér", "—", "✓", "✓"],
      ["Pénteki kör", "—", "✓", "✓"],
      ["Heti online közös meditáció", "—", "✓ élőben", "✓ élőben"],
      ["Havi élő kérdezz-felelek (Q&A)", "—", "a felvétel visszanézhető; élőben nem vehetsz részt, nem kérdezhetsz", "✓ élő részvétel és kérdezési jog"],
      ["Havi élő szerepjáték- (D&D) és társasjáték-est", "—", "✓", "✓"],
      ["Ranglista a tagoknak — heti, havi, negyedéves", "—", "✓ az első 10 és a saját helyed; elrejtheted magad", "✓ az első 10 és a saját helyed; elrejtheted magad"],
      ["Negyedéves vacsorameghívás Bálinttól", "—", "✓ a negyedéves ranglista első tíz helyezettjének", "✓ a negyedéves ranglista első tíz helyezettjének"],
    ],
  },
  {
    group: "Személyes alkalmak Budapesten",
    rows: [
      ["Nyílt Meditációs Est (havonta)", "4 940 Ft", "3 200 Ft, a Belső Kör 48 órás előfoglalása után", "✓ díjmentes, 48 órás elsőbbségi foglalással"],
      ["Élő Gyakorlónap (évente 4)", "—", "6 460 Ft", "✓ díjmentes, elsőbbségi foglalással"],
      ["III. Modul — Szabadság Elvonulás (évente 3, az IP 3 után)", "—", "önköltség (kb. 65–85 ezer Ft)", "✓ díjmentes, szállással és vegán ellátással, elsőbbségi foglalással"],
      ["Havi közös túra", "csak meghívóval, díjmentesen", "✓ díjmentes, túránként 2 vendéget hívhatsz", "✓ díjmentes, túránként 2 vendéget hívhatsz"],
      ["1-on-1 konzultáció", "—", "15 000 Ft", "13 000 Ft; éves tagságnál évi 4 díjmentes"],
    ],
  },
  {
    group: "Kedvesség és analóg reggel",
    rows: [
      ["Kedves Üzenet (beérkezési sorrendben)", "✓ díjmentes", "✓ díjmentes", "✓ díjmentes"],
      ["Elsőbbségi Kedves Üzenet, kézbesítési garanciával", "—", "havi 1 díjmentes", "havi 3 díjmentes"],
      ["Elsőbbségi üzenet a kereten felül", "—", "választott összegért, legalább 1 000 Ft", "választott összegért, legalább 1 000 Ft"],
      ["Napi Közlöny PRO", "—", "✓ díjmentes, amint elindul", "✓ díjmentes, amint elindul"],
    ],
  },
  {
    group: "Díj és feltételek",
    rows: [
      ["7 napos ingyenes próbaidő", "—", "✓ a havi tagságra", "—"],
      ["Bármikor lemondható (a következő időszaktól)", "—", "✓", "✓"],
    ],
  },
];

function CompareCell({ value }: { value: string }) {
  if (value === "—") return <span className="text-ink-soft/50">—</span>;
  if (value.startsWith("✓")) {
    const rest = value.slice(1).trim();
    return (
      <span className="flex gap-1.5">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-label="benne van" />
        {rest && <span>{rest}</span>}
      </span>
    );
  }
  return <span>{value}</span>;
}


const FAQ = [
  {
    q: "Kell hozzá előzetes meditációs tapasztalat?",
    a: "Nem. Az első lépcső a légzés alapjaitól indul, és minden gyakorlatot vezetve, lépésről lépésre végzel. Ha már gyakorolsz, a strukturált program és a közösség ad új mélységet.",
  },
  {
    q: "Mennyi időt kell rászánnom?",
    a: "Az első lépcsőben reggel és este egy-egy rövid gyakorlást, és hetente 3–7 alkalommal egy 15–45 perces, elmélyültebb meditációt. A későbbi lépcsőkben az ülések fokozatosan hosszabbak. Ehhez jönnek a választható alkalmak: a heti közös meditáció, a budapesti esték, a havi túra.",
  },
  {
    q: "Mi történik, ha kihagyok néhány napot?",
    a: "Az élet néha közbeszól, és ez rendben van. Nincs sorozatszámláló és nincs pontlevonás. Az integrációs program lezárásához a vállalt gyakorlások nagy részét kell teljesítened (az első lépcsőben legalább 80%-át), így egy-egy kihagyott nap belefér — a heti beszámoló és a gyakorlótársad abban segít, hogy visszatalálj a ritmusodhoz.",
  },
  {
    q: "Ez vallásos vagy spirituális közösség?",
    a: "Nem. Klasszikus légzés- és figyelemgyakorlatokkal dolgozunk, de a modern idegtudomány és az életmód-orvostan felől közelítjük meg őket — dogmák, misztifikálás és ezoterikus nyelv nélkül.",
  },
  {
    q: "Helyettesíti az orvosi vagy pszichológiai kezelést?",
    a: "Nem. A Társaság gyakorlóközösség, nem terápia. Ha kezelés alatt állsz, vagy egészségi okból bizonytalan vagy, beszéld meg az orvosoddal, mielőtt elkezded.",
  },
  {
    q: "Mi a különbség a két út között?",
    a: "A Társaság Tagjaként az első lépcső azonnal nyitva van, a továbbiak pedig díjmentesen nyílnak, amikor gyakorlással eléred a hozzájuk tartozó rangot — ha gyorsítanál, külön díjért hamarabb is megnyithatod őket. A Belső Körben a teljes tananyag-ív benne van az árban, élőben kérdezhetsz, és minden élő alkalom — a Szabadság Elvonulás is — díjmentes.",
  },
  {
    q: "Hogyan működik a próbaidő?",
    a: "A Társaság Tagja havi tagságot 7 napig ingyen kipróbálhatod (bankkártya szükséges, és e-mail-címenként egyszer jár). A próbaidő alatt a tananyag és a közösség elérhető; a díjmentes Kedves Üzenet és a foglalások az első fizetés után nyílnak meg.",
  },
  {
    q: "Lemondhatom bármikor?",
    a: "Igen. A lemondás a következő számlázási időszaktól él, addig minden elérhető marad. Ha később visszatérsz, az út elölről indul — ez a folytonosság miatt van így.",
  },
  {
    q: "Mi az a rend, és miért nem lehet váltani?",
    a: "A rend a kiindulópontod: a Ceremónia kérdőíve alapján derül ki, melyik természetes hangolásból indulsz. Nem skatulya — minden rend mindent gyakorol. Azért végleges, mert az út lényege, hogy a saját kiindulópontodból haladj, ne egy kényelmesebbet keress.",
  },
  {
    q: "Kapok számlát?",
    a: "Igen, minden befizetésről alanyi adómentes számla készül. A Társasághoz magánszemélyként lehet csatlakozni.",
  },
];

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-2xl text-forest sm:text-3xl">{title}</h2>
      {children && <div className="mt-4 space-y-3 text-ink-soft">{children}</div>}
    </div>
  );
}

export default async function TarsasagHome() {
  const supabase = createPublicClient();
  const { data: prices } = await supabase.from("price_catalog").select("code, amount_huf");
  const price = (code: string) => prices?.find((p) => p.code === code)?.amount_huf;
  const notify = notifyHref("A Társaság nyitása");
  const open = onlinePaymentsEnabled();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      {/* Nyitány */}
      <section className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">A Társaság · Jelenlét – Tudatosság – Szabadság</p>
        <h1 className="mt-5 font-serif text-4xl leading-tight text-forest sm:text-5xl">
          Nyugodtabb idegrendszer.
          <br />
          Kedvesebb hétköznapok.
        </h1>
        <p className="mt-8 font-serif text-xl leading-relaxed text-ink">
          A Társaság online gyakorlóközösség, ahol tréningnapokon és nyolchetes integrációs programokban, tudományos alapokon tanítod
          meg az idegrendszeredet megnyugodni — és ahol nem egyedül haladsz.
        </p>
        <p className="mt-5 max-w-2xl text-ink-soft">
          Nyolchetes programokban, lépésről lépésre. Élő közös meditációkkal, budapesti alkalmakkal, havonta egy
          közös túrával — és egy közösséggel, amelynek a célja egyszerű: jobb hellyé tenni a világot, először
          magunkkal kezdve.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a href="#csatlakozas" className={buttonPrimary}>
            Megnézem, hogyan csatlakozhatok
          </a>
          <a href="#hogyan-mukodik" className={buttonSecondary}>
            Hogyan működik?
          </a>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
          {["7 napos próbaidő", "Bármikor lemondható", "Nem kell előzetes tapasztalat"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-gold" strokeWidth={1.5} aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </section>

      <CompassDivider className="my-20" />

      {/* Ismerős? */}
      <section className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <SectionHeading eyebrow="Ismerős?" title="A nap el sem kezdődött, a tested már készenlétben áll.">
          <p>
            Ébredés után az első mozdulat a telefon felé. Értesítések, hírek, üzenetek — és még fel sem keltél,
            a vállad már feszes, a légzésed felszínes. Napközben tűzoltás, este pedig fáradt vagy, mégsem tudsz
            igazán leállni.
          </p>
          <p>
            Ez nem jellemhiba, és nem is gyengeség. Az idegrendszered pontosan azt teszi, amire a mai élet nap
            mint nap tanítja: készenlétben tart. Csak éppen elfelejtett visszaváltani.
          </p>
        </SectionHeading>
        <GildedCard className="p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">A jó hír</p>
          <p className="mt-3 font-serif text-xl text-forest">A visszaváltás tanulható.</p>
          <p className="mt-3 text-sm text-ink-soft">
            A légzés lassításával és a figyelem irányításával közvetlenül hatsz arra a rendszerre, amely a
            megnyugvásért felel: a vagus idegre és a szívritmus változékonyságára. Nem varázslat, hanem
            gyakorlás — és a gyakorlás itt könnyebb, mert nem egyedül csinálod.
          </p>
        </GildedCard>
      </section>

      <CompassDivider className="my-20" />

      {/* Amit megtanulsz */}
      <section>
        <SectionHeading eyebrow="Amit az úton megtanulsz" title="Nem egy újabb feladat. Egy képesség, ami veled marad." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {BENEFITS.map(({ Icon, title, text }) => (
            <GildedCard key={title}>
              <Icon className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
              <h3 className="mt-4 font-serif text-xl text-forest">{title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{text}</p>
            </GildedCard>
          ))}
        </div>
      </section>

      <CompassDivider className="my-20" />

      {/* Hogyan működik */}
      <section id="hogyan-mukodik" className="scroll-mt-24">
        <SectionHeading eyebrow="Hogyan működik" title="Négy lépés, és már úton is vagy." />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <GildedCard className="h-full">
                <span className="font-serif text-3xl text-gold">{i + 1}</span>
                <h3 className="mt-3 font-serif text-lg text-forest">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.text}</p>
              </GildedCard>
            </li>
          ))}
        </ol>
      </section>

      <CompassDivider className="my-20" />

      {/* A 4 Rend */}
      <section id="rendek" className="scroll-mt-24">
        <SectionHeading eyebrow="A Ceremónia" title="A négy rend — melyikre ismersz magadra?">
          <p>
            Minden idegrendszernek megvan a maga természetes hangolása: van, aki finoman érzékel, van, aki
            nyugalmat teremt, van, aki kitartóan épít, és van, akit a kihívás tesz tisztává. A Társaságban ezt
            a négy irányt négy rend őrzi.
          </p>
          <p>
            Belépéskor egy rövid önismereti kérdőív, a Ceremónia dönti el, melyik rendbe kerülsz. A rended végleges: ez a
            kiindulópontod, amelyhez az úton végig visszatalálsz. Nincs jó vagy rossz rend — mind egyenrangú, és
            minden rend mindent gyakorol.
          </p>
        </SectionHeading>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {ORDERS.map(({ name, Crest, gift, motto, signs, strength, path }) => (
            <GildedCard key={name} className="flex flex-col p-7">
              <div className="flex items-center gap-4">
                <Crest className="h-16 w-14 shrink-0" />
                <div>
                  <h3 className="font-serif text-2xl text-forest">{name}</h3>
                  <p className="text-sm text-gold">{gift}</p>
                </div>
              </div>
              <p className="mt-5 font-serif italic text-ink">{motto}</p>
              <p className="mt-5 text-xs uppercase tracking-[0.18em] text-gold">Magadra ismersz, ha…</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                {signs.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
              <dl className="mt-5 space-y-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-gold">Az erősséged</dt>
                  <dd className="mt-1 text-ink-soft">{strength}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-gold">Amit az úton tanulsz</dt>
                  <dd className="mt-1 text-ink-soft">{path}</dd>
                </div>
              </dl>
            </GildedCard>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-ink-soft">
          A Ceremónia kérdőíve önismereti eszköz, nem pszichológiai vizsgálat vagy diagnózis.
        </p>
      </section>

      <CompassDivider className="my-20" />

      {/* Egy nap */}
      <section>
        <SectionHeading eyebrow="Küldetések & Napi Hangolások" title="Így néz ki egy nap a Társaságban.">
          <p>
            A gyakorlás itt nem kötelező házi feladat, hanem rövid küldetések sora, amelyek beleférnek a napodba.
          </p>
        </SectionHeading>
        <ol className="mt-10 space-y-4">
          {DAY.map(({ Icon, when, name, text }) => (
            <li key={name}>
              <GildedCard className="flex gap-5">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-forest" strokeWidth={1.25} aria-hidden />
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gold">{when}</p>
                  <h3 className="mt-1 font-serif text-lg text-forest">{name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{text}</p>
                </div>
              </GildedCard>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-ink-soft">
          A Napi Közlöny fejlesztés alatt áll; amint elindul, a tagoknak díjmentes.
        </p>
      </section>

      <CompassDivider className="my-20" />

      {/* Az út */}
      <section>
        <SectionHeading eyebrow="Az út" title="Négy lépcső, a saját tempódban.">
          <p>
            Belépéskor az első lépcső nyílik meg. A következőre akkor léphetsz, ha az előzőt elvégezted, és
            gyakorlással eléred a hozzá tartozó rangot: a II. lépcsőhöz a Horgonyzót (500 XP), a III.-hoz a
            Csendőrzőt (1 200 XP). Ez díjmentes — fizetni csak akkor kell, ha nem várnád meg a rangot (54 940 Ft,
            illetve 44 940 Ft). A Belső Körben a rang sem feltétel. A következő lépcsőt minden esetben egy rövid,
            díjmentes beszélgetés után Bálint nyitja meg, hogy az út biztonságos és folyamatos maradjon.
          </p>
        </SectionHeading>
        <ol className="mt-10 space-y-6">
          {PATH.map((stage) => (
            <li key={stage.step}>
              <GildedCard className="p-7 sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-serif text-2xl text-gold">{stage.step}</h3>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{stage.badge}</p>
                </div>
                <div className={`mt-5 grid gap-6 ${stage.parts.length > 1 ? "md:grid-cols-2" : ""}`}>
                  {stage.parts.map((part) => (
                    <div key={part.title} className="border-t border-gold/25 pt-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">{part.kind}</p>
                      <h4 className="mt-1 font-serif text-lg text-forest">{part.title}</h4>
                      {"sub" in part && part.sub && <p className="text-xs text-ink-soft">{part.sub}</p>}
                      <div className="mt-3 space-y-3 text-sm text-ink-soft">
                        {part.paras.map((t) => (
                          <p key={t.slice(0, 24)}>{t}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </GildedCard>
            </li>
          ))}
        </ol>
      </section>

      <CompassDivider className="my-20" />

      {/* Karakterkártya */}
      <section className="grid items-start gap-10 lg:grid-cols-2">
        <SectionHeading eyebrow="Az út nyomai" title="Karakterkártya, XP, rang — és ranglista.">
          <p>
            Minden elvégzett küldetés, meghallgatott tananyag, naplóbejegyzés és közös alkalom tapasztalati pontot
            (XP) ér, és ahogy haladsz, a rangod is fejlődik. Így látod, mennyit építettél — akkor is, amikor
            belülről lassúnak tűnik.
          </p>
          <p>
            A tagok között heti, havi és negyedéves ranglista is van. Mindig csak az adott időszakban szerzett XP
            számít, így minden időszakban mindenki tiszta lappal indul, és a napi felső határ miatt senki sem
            gyűjthet behozhatatlan előnyt. Ha nem szeretnél szerepelni rajta, egy kattintással elrejtheted magad —
            a saját helyedet akkor is látod. Egy kihagyott napért pedig semmit sem veszítesz.
          </p>
        </SectionHeading>
        <GildedCard className="p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Karakterkártya · minta</p>
          <div className="mt-4 flex items-center gap-4">
            <CrestVandorok className="h-14 w-12" />
            <div>
              <p className="font-serif text-xl text-forest">Vándor</p>
              <p className="text-sm text-ink-soft">I. Modul · 4. hét · Figyelő</p>
            </div>
          </div>
          <div className="mt-6 h-px bg-gold/30" />
          <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
            {RANKS.map((rank, i) => (
              <li key={rank} className="flex items-center gap-2">
                <span
                  className={
                    i === 1
                      ? "rounded-full border border-gold px-3 py-1 text-forest"
                      : "rounded-full border border-line px-3 py-1 text-ink-soft"
                  }
                >
                  {rank}
                </span>
                {i < RANKS.length - 1 && (
                  <span className="text-gold/70" aria-hidden>
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </GildedCard>
      </section>

      <CompassDivider className="my-20" />

      {/* Közösség */}
      <section>
        <SectionHeading eyebrow="Nem egyedül" title="Tapasztalat, nem tanácsadás.">
          <p>
            A Társaság nem egyszemélyes színpad. A tagok nem okítják és nem diagnosztizálják egymást, hanem
            megosztják, mi segített nekik — egy nehéz estén, egy feszült héten. A posztok alatt nincs lájk, csak
            két csendes visszajelzés: „Köszönöm, hasznos volt” és „Hasonlót tapasztaltam”.
          </p>
        </SectionHeading>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {COMMUNITY.map(({ Icon, title, text }) => (
            <GildedCard key={title} className="flex gap-4">
              <Icon className="mt-1 h-5 w-5 shrink-0 text-forest" strokeWidth={1.25} aria-hidden />
              <div>
                <h3 className="font-serif text-lg text-forest">{title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{text}</p>
              </div>
            </GildedCard>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-soft">
          És Budapesten: havonta <span className="text-ink">Nyílt Meditációs Estek</span>, évente négyszer{" "}
          <span className="text-ink">Élő Gyakorlónapok</span>, háromszor pedig{" "}
          <span className="text-ink">Szabadság Elvonulás</span>.
        </p>
      </section>

      <CompassDivider className="my-20" />

      {/* Bálint */}
      <section className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <SectionHeading eyebrow="Aki az utat vezeti" title="Kardos Bálint" />
        <GildedCard className="p-8">
          <p className="font-serif text-lg text-ink">
            „Kedves üzeneteket kézbesítek, segítek a telefonmentes napindításban, A Társaság tagjaival pedig azon
            dolgozunk, hogy jobb hellyé tegyük a világot — először magunkkal kezdve.”
          </p>
          <p className="mt-4 text-sm text-ink-soft">
            A klasszikus légzés- és figyelemgyakorlatokat a modern idegtudomány és az életmód-orvostan felől
            közelítem meg: mit csinál a légzés a vagus-tónussal, a szívritmus-változékonysággal, és hogyan
            csendesedik a figyelem. Dogmák és misztifikálás nélkül.
          </p>
          <ul className="mt-5 space-y-1.5 text-sm text-ink-soft">
            <li>Életmód-tanácsadó (Lifestyle Medicine Consultant, LifestylePro Academy)</li>
            <li>Jógaoktató (RYT-500, Rudra YogPeeth Yoga Ashram, Rishikesh)</li>
          </ul>
        </GildedCard>
      </section>

      <CompassDivider className="my-20" />

      {/* Csatlakozás */}
      <section id="csatlakozas" className="scroll-mt-24">
        <SectionHeading eyebrow="Csatlakozás" title="Válaszd ki az utad.">
          <p>Mindkét út havi vagy éves díjjal választható; az éves tagság két hónapnyi díjat megspórol neked.</p>
        </SectionHeading>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {TIERS.map((t) => {
            const m = price(t.monthly);
            const y = price(t.yearly);
            return (
              <GildedCard key={t.name} className="flex flex-col p-8">
                <p className="text-xs uppercase tracking-[0.2em] text-gold">{t.subtitle}</p>
                <h3 className="mt-1 font-serif text-2xl text-forest">{t.name}</h3>
                {m !== undefined && (
                  <p className="mt-4 font-serif text-3xl text-ink">
                    {formatHuf(m)} <span className="font-sans text-sm text-ink-soft">/ hó</span>
                  </p>
                )}
                {y !== undefined && (
                  <p className="text-sm text-ink-soft">vagy {formatHuf(y)} / év (2 hónap ajándék)</p>
                )}
                <p className="mt-5 text-sm text-ink">{t.forWhom}</p>
                <p className="mt-4 text-sm italic text-ink-soft">{t.note}</p>
                <ul className="mt-3 flex-1 space-y-2 text-sm text-ink-soft">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {open ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link href={`${tp("/csatlakozas")}?csomag=${t.monthly}`} className={`${buttonPrimary} text-center`}>
                        Csatlakozom — havi
                      </Link>
                      <Link href={`${tp("/csatlakozas")}?csomag=${t.yearly}`} className={`${buttonSecondary} text-center`}>
                        Éves díjjal
                      </Link>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs uppercase tracking-[0.18em] text-gold">A csatlakozás hamarosan nyílik</p>
                      <a href={notify} className={`${buttonPrimary} mt-3 w-full text-center`}>
                        Értesítést kérek a nyitásról
                      </a>
                    </>
                  )}
                </div>
              </GildedCard>
            );
          })}
        </div>

        <GildedCard className="mt-8 overflow-x-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Minden, ami benne van — egy pillantásra</p>
          <table className="mt-4 w-full min-w-[44rem] text-left text-sm">
            <thead className="text-ink">
              <tr className="border-b border-line">
                <th className="w-[34%] py-2 pr-4 font-normal">Szolgáltatás</th>
                <th className="w-[18%] py-2 pr-4 font-normal">Külsősöknek</th>
                <th className="w-[24%] py-2 pr-4 font-normal">A Társaság Tagja</th>
                <th className="w-[24%] py-2 font-normal">A Belső Kör Tagja</th>
              </tr>
            </thead>
            {COMPARE.map(({ group, rows }) => (
              <tbody key={group} className="text-ink-soft">
                <tr>
                  <th colSpan={4} className="pb-2 pt-6 text-left text-xs font-normal uppercase tracking-[0.18em] text-gold">
                    {group}
                  </th>
                </tr>
                {rows.map(([feature, ext, t1, t2]) => (
                  <tr key={feature} className="border-b border-line/60 align-top">
                    <td className="py-2.5 pr-4 text-ink">{feature}</td>
                    <td className="py-2.5 pr-4"><CompareCell value={ext} /></td>
                    <td className="py-2.5 pr-4"><CompareCell value={t1} /></td>
                    <td className="py-2.5"><CompareCell value={t2} /></td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
          <p className="mt-4 text-xs text-ink-soft">
            A próbaidő alatt a tananyag és a közösség elérhető; a díjmentes Elsőbbségi Kedves Üzenet és a
            foglalások az első fizetés után nyílnak meg.
          </p>
        </GildedCard>

        <p className="mt-6 max-w-2xl text-xs text-ink-soft">
          Lemondás bármikor, a következő számlázási időszaktól; addig a hozzáférés megmarad. Visszatéréskor az
          út elölről indul. Minden díj szolgáltatási díj, alanyi adómentes számlával; csatlakozni magánszemélyként
          lehet.
        </p>
      </section>

      <CompassDivider className="my-20" />

      {/* GYIK */}
      <section id="gyik" className="scroll-mt-24">
        <SectionHeading eyebrow="Gyakori kérdések" title="Amit érdemes tudni, mielőtt elindulsz." />
        <div className="mt-10 divide-y divide-line rounded-md border border-line bg-paper">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-serif text-lg text-forest marker:hidden">
                {q}
                <span className="mt-1 text-gold transition-transform duration-300 group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <CompassDivider className="my-20" />

      {/* Zárás */}
      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Az első lépés mindig a legkisebb</p>
        <h2 className="mx-auto mt-4 max-w-2xl font-serif text-3xl text-forest sm:text-4xl">
          Egy kilégzés. Egy kérdőív. Egy társaság.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-ink-soft">
          Ha szeretnéd, hogy szóljunk, amikor megnyílik a csatlakozás, írj egy sort — vagy gyere el addig egy
          budapesti Nyílt Estre, és tapasztald meg személyesen.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {open ? (
            <Link href={tp("/csatlakozas")} className={buttonPrimary}>
              Csatlakozom
            </Link>
          ) : (
            <a href={notify} className={buttonPrimary}>
              Értesítést kérek a nyitásról
            </a>
          )}
          <Link href={tp("/belepes")} className={buttonSecondary}>
            Már tag vagyok — belépés
          </Link>
        </div>
      </section>
    </main>
  );
}
