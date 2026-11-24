import Link from "next/link";
import { BookOpen, Check, Footprints, NotebookPen, Newspaper, Sunrise, Wind } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { formatHuf, tp } from "@/lib/site";
import {
  CompassDivider,
  CrestKertorzok,
  CrestTorpok,
  CrestTundek,
  CrestVandorok,
  GildedCard,
} from "@/components/ornaments";

export const revalidate = 300;

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
    strength:
      "Finomhangolt belső érzékelés és mély empátia. Ahol mások zajt hallanak, te árnyalatokat.",
    path: "Hogy az érzékenység ne árasszon el: határok, földelés, hosszabb kilégzés — érezni, de nem elsodródni.",
    practice: "Kájánupassaná — a test végigpásztázása",
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
    strength:
      "Nyugalmat sugárzó jelenlét. Az idegrendszered biztonságérzete a környezetedre is átragad.",
    path: "Kilépni a megszokottból, amikor a növekedés hív — és nemet mondani, hogy a kert a tiéd maradjon.",
    practice: "Sama Vritti — az egyenletes, négyütemű légzés",
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
    strength:
      "Kitartás és szerkezet. A nehezebb napokon is ott vagy a gyakorlásnál, és ez tart meg.",
    path: "Lazítani a szorításon: a kontroll helyett megengedni, és a pihenést is gyakorlásnak tekinteni.",
    practice: "Nadi Shodhana — a váltott orrlyukas, rendező légzés",
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
    strength:
      "Mozgósítható energia, jó irányba fordítva: kezdeményezés, fókusz és bátorság a nehéz helyzetekben.",
    path: "Megérkezni: lassítani úgy, hogy a nyugalom ne unalomnak, hanem erőgyűjtésnek tűnjön.",
    practice: "Anapanaszati — a légzés követése, a figyelem visszavezetése",
  },
];

const QUESTS = [
  {
    Icon: Wind,
    name: "Napi Küldetések",
    text: "Rövid, földelő légzőgyakorlatok — és az I. Integrációs Program (IP 1) résztvevőinek reggeli és esti meditációs rituálék.",
  },
  {
    Icon: BookOpen,
    name: "A Tudás Ösvénye",
    text: "Elméleti és idegtudományi hanganyagok: mi történik a légzéssel, a vagus-tónussal és a figyelemmel.",
  },
  {
    Icon: Footprints,
    name: "Testi Tapasztalás",
    text: "Vezetett gyakorlások, amelyekben a megértés a testben válik valóssá.",
  },
  {
    Icon: NotebookPen,
    name: "Belső Tükör",
    text: "Gyakorlónapló és önreflexió — mit vettél észre ma, ami tegnap még rejtve maradt.",
  },
  {
    Icon: Newspaper,
    name: "Analóg Reggel",
    text: "A kinyomtatott Napi Közlöny: képernyő nélküli napindítás, értesítési zaj nélkül.",
  },
];

const RANKS = ["Kereső", "Figyelő", "Horgonyzó", "Csendőrző", "Egyensúlyozó"];

const TIERS = [
  {
    name: "A Társaság Útja",
    subtitle: "Társasági Tagság",
    monthly: "tarsasagi_havi",
    yearly: "tarsasagi_eves",
    note: "7 napos próbaidővel (havi előfizetésnél)",
    features: [
      "Közösségi tér, Küldetések és napi gyakorlónapló",
      "I. Modul (Jelenlét) + I. Integrációs Program — 8+1 hét, azonnal",
      "Havi ingyenes közös túra Magyarországon — az úti célt a Társaság szavazza meg, vendéget meghívóval hozhatsz",
      "Heti online közös meditáció, havi Q&A felvételek",
      "Havi 1 díjmentes Elsőbbségi Kedves Üzenet",
      "Napi Közlöny PRO a tagság ideje alatt",
      "Kedvezményes részvétel a Nyílt Esteken és az Élő Gyakorlónapokon",
    ],
  },
  {
    name: "A Belső Kör",
    subtitle: "A Tanács",
    monthly: "belso_kor_havi",
    yearly: "belso_kor_eves",
    note: "Minden, ami A Társaság Útján, és még:",
    features: [
      "A teljes tananyag-ív külön díj nélkül (a nyitás egyeztetéssel)",
      "Havi élő Q&A kérdezési joggal",
      "Havi 3 díjmentes Elsőbbségi Kedves Üzenet",
      "Díjmentes Nyílt Estek, Gyakorlónapok és Szabadság Elvonulás, elsőbbségi foglalással",
      "Éves előfizetésnél évi 4 díjmentes 1-on-1 konzultáció",
    ],
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

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      {/* Nyitány */}
      <section className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Jelenlét – Tudatosság – Szabadság</p>
        <h1 className="mt-4 font-serif text-4xl text-forest sm:text-5xl">A Társaság</h1>
        <p className="mt-8 font-serif text-xl text-ink">
          Azon dolgozunk, hogy jobb hellyé tegyük a világot — először magunkkal kezdve.
        </p>
        <p className="mt-4 text-ink-soft">
          Minden nagy út egy nyugodtabb idegrendszerrel kezdődik. Itt kedvességet, figyelmességet,
          tudatosságot és segítőkészséget gyakorlunk — a légzésen, a figyelmen és a testen keresztül,
          tudományos alapokon, dogmák nélkül.
        </p>
        <p className="mt-4 text-ink-soft">
          Nem tanácsokat osztunk egymásnak, hanem megosztjuk, mit tapasztaltunk az úton. Havonta egyszer
          pedig szó szerint is együtt indulunk: közös túra valahol Magyarországon, az úti célt a
          Társaság szavazza meg. A túra ingyenes, és meghívóval barátaidat is hozhatod.
        </p>
        <div className="mt-10">
          <Link
            href={tp("/belepes")}
            className="inline-block rounded-md border border-forest px-5 py-2.5 text-sm text-forest transition-all duration-300 hover:border-gold hover:bg-gold-soft/40"
          >
            Már tag vagyok — belépés
          </Link>
        </div>
      </section>

      <CompassDivider className="my-20" />

      {/* Az Idegrendszeri Iránytű & A 4 Rend */}
      <section>
        <SectionHeading eyebrow="Az első lépés" title="Az Idegrendszeri Iránytű & A 4 Rend">
          <p>
            Minden idegrendszernek megvan a maga természetes hangolása: van, aki finoman érzékel, van,
            aki nyugalmat teremt, van, aki kitartóan épít, és van, akit a kihívás tesz tisztává. A
            Társaságban ezt a négy irányt négy rend őrzi.
          </p>
          <p>
            Belépéskor egy rövid kérdőív, az Idegrendszeri Iránytű mutatja meg, melyik rendből indulsz.
            A rended végleges: ez a kiindulópontod, amelyhez az úton végig visszatalálsz. Nincs jó vagy
            rossz rend — mind egyenrangú, és minden rend mindent gyakorol; csak a kezdőpont más.
          </p>
        </SectionHeading>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {ORDERS.map(({ name, Crest, gift, motto, signs, strength, path, practice }) => (
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
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-gold">A rend kedvelt gyakorlata</dt>
                  <dd className="mt-1 text-ink-soft">{practice}</dd>
                </div>
              </dl>
            </GildedCard>
          ))}
        </div>
        <p className="mt-6 text-center text-xs uppercase tracking-[0.18em] text-ink-soft/80">
          Az Iránytű belépéskor vár rád
        </p>
      </section>

      <CompassDivider className="my-20" />

      {/* Küldetések & Napi Hangolások */}
      <section>
        <SectionHeading eyebrow="A mindennapok" title="Küldetések & Napi Hangolások">
          <p>
            A gyakorlás itt nem kötelező házi feladat, hanem küldetések sora. Rövidek, a napodba
            illeszthetők, és lépésről lépésre nyílnak meg.
          </p>
        </SectionHeading>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {QUESTS.map(({ Icon, name, text }) => (
            <GildedCard key={name}>
              <Icon className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
              <h3 className="mt-4 font-serif text-lg text-forest">{name}</h3>
              <p className="mt-2 text-sm text-ink-soft">{text}</p>
            </GildedCard>
          ))}
          <GildedCard className="bg-paper-deep/60">
            <Sunrise className="h-5 w-5 text-gold" strokeWidth={1.25} aria-hidden />
            <h3 className="mt-4 font-serif text-lg text-forest">Lépcsőzetes út</h3>
            <p className="mt-2 text-sm text-ink-soft">
              Az I. Modul és az IP 1 belépéskor nyílik. A további lépcsők előtt mindig beszélünk egy
              rövidet — a továbblépést Bálint nyitja meg.
            </p>
          </GildedCard>
        </div>
      </section>

      <CompassDivider className="my-20" />

      {/* Karakterkártya, XP és Szintlépés */}
      <section className="grid items-start gap-10 lg:grid-cols-2">
        <SectionHeading eyebrow="Az út nyomai" title="Karakterkártya, XP és Szintlépés">
          <p>
            Minden elvégzett küldetés, meghallgatott tananyag, naplóbejegyzés és kinyomtatott reggeli
            közlöny tapasztalati pontot (XP) ér. Ahogy haladsz, a saját Karakterkártyád és rangod is
            fejlődik.
          </p>
          <p>
            A kártyád csak a tiéd: nincs ranglista, nincs összehasonlítás. Az egyetlen mérce a
            tegnapi önmagad.
          </p>
        </SectionHeading>

        <GildedCard className="p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Karakterkártya · minta</p>
          <div className="mt-4 flex items-center gap-4">
            <CrestVandorok className="h-14 w-12" />
            <div>
              <p className="font-serif text-xl text-forest">Vándor</p>
              <p className="text-sm text-ink-soft">I. Modul · 4. hét</p>
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
                {i < RANKS.length - 1 && <span className="text-gold/70" aria-hidden>→</span>}
              </li>
            ))}
            <li className="text-ink-soft" aria-hidden>…</li>
          </ol>
        </GildedCard>
      </section>

      <CompassDivider className="my-20" />

      {/* Tagsági utak — a meglévő árakkal és jogosultságokkal */}
      <section>
        <SectionHeading eyebrow="Csatlakozás" title="Válaszd ki az utad" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {TIERS.map((t) => {
            const m = price(t.monthly);
            const y = price(t.yearly);
            return (
              <GildedCard key={t.name} className="flex flex-col">
                <p className="text-xs uppercase tracking-[0.2em] text-gold">{t.subtitle}</p>
                <h3 className="mt-1 font-serif text-2xl text-forest">{t.name}</h3>
                {m !== undefined && (
                  <p className="mt-3 text-ink">
                    {formatHuf(m)} <span className="text-sm text-ink-soft">/ hó</span>
                  </p>
                )}
                {y !== undefined && (
                  <p className="text-sm text-ink-soft">vagy {formatHuf(y)} / év (2 hónap ajándék)</p>
                )}
                <p className="mt-4 text-sm text-ink-soft italic">{t.note}</p>
                <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs text-ink-soft">A csatlakozás hamarosan nyílik.</p>
              </GildedCard>
            );
          })}
        </div>
      </section>

      <p className="mt-10 max-w-2xl text-xs text-ink-soft">
        Lemondás bármikor, a következő számlázási ciklustól; addig a hozzáférés megmarad. Visszatéréskor a
        haladás elölről indul. Minden díj szolgáltatási díj, alanyi adómentes számlával.
      </p>
    </main>
  );
}
