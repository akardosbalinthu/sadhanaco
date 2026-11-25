import { Check, Heart, Send } from "lucide-react";
import { KindMessageForm } from "@/components/kind-message-form";
import { submitGuestMessage } from "./actions";
import { publicEnv } from "@/lib/env";
import { buttonPrimary, buttonSecondary, CompassDivider, GildedCard, PageHeader, SectionTitle } from "@/components/ornaments";

export const metadata = {
  title: "Egy Kedves Üzenet · Kardos Bálint",
  description:
    "Írd meg, kinek mit üzennél — én egy meglepetés-telefonhívásban átadom. Díjmentesen, bárkinek; A Társaság tagjainak elsőbbséggel és kézbesítési garanciával.",
};

const STEPS = [
  { title: "Megírod", text: "Kinek szól, mit üzennél neki, és milyen számon érhetem el. Elég néhány őszinte mondat." },
  { title: "Megerősíted", text: "Küldünk egy e-mailt, és egy kattintással megerősíted, hogy tényleg te küldted. A Társaság tagjainak erre nincs szükség." },
  { title: "Felhívom", text: "Élő adásban vagy rövid videóban felhívom a címzettet, és felolvasom neki az üzenetedet." },
  { title: "Célba ér", text: "Valaki valahol váratlanul megtudja, hogy számít. Ennyi az egész — és ez sokszor elég." },
];

export default function KindMessagePage() {
  return (
    <main className="py-16">
      <PageHeader eyebrow="Egy hívás, egy mondat, egy ember" title="Egy Kedves Üzenet">
        <p className="font-serif text-xl text-ink">
          Vannak mondatok, amelyeket évek óta magunkban hordunk. Egy köszönet a tanárnak, aki hitt bennünk. Egy
          „büszke vagyok rád” a testvérnek. Egy bátorító szó egy barátnak a nehéz napja előtt. Egy „gondolok rád”
          annak, akivel rég nem beszéltünk.
        </p>
        <p>
          Az Egy Kedves Üzenetben ezeket a mondatokat egy meglepetés-telefonhívásban adom át annak, akinek
          szólnak. Te megírod — én felhívom, és felolvasom. A vonal másik végén pedig valaki egy hétköznap
          délután megtudja, hogy fontos volt valakinek.
        </p>
        <p className="pt-2">
          <a href="#kuldes" className={buttonPrimary}>
            Küldök egy üzenetet
          </a>
        </p>
      </PageHeader>

      <CompassDivider className="my-14" />

      <section>
        <SectionTitle eyebrow="Hogyan működik" title="Négy lépés, és az üzeneted úton van." />
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

      <section>
        <SectionTitle eyebrow="Kétféle üzenet" title="Bárki küldhet. A tagok elsőbbséget kapnak." />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <GildedCard className="flex flex-col p-8">
            <Send className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
            <h3 className="mt-4 font-serif text-2xl text-forest">Kedves Üzenet</h3>
            <p className="mt-1 text-sm text-gold">Bárkinek · díjmentes</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-soft">
              {[
                "Bárki küldhet, regisztráció nélkül — elég egy e-mailes megerősítés",
                "Ugyanarról a címről több üzenet is mehet",
                "A beérkezés sorrendjében dolgozom fel",
                "Ha a címzettet három próbálkozásra sem érem el, az üzenet lezárul",
              ].map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </GildedCard>

          <GildedCard className="flex flex-col border-gold/50 p-8">
            <Heart className="h-5 w-5 text-gold" strokeWidth={1.25} aria-hidden />
            <h3 className="mt-4 font-serif text-2xl text-forest">Elsőbbségi Kedves Üzenet</h3>
            <p className="mt-1 text-sm text-gold">A Társaság tagjainak</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-soft">
              {[
                "Elsőként kézbesítem, a díjmentes üzenetek előtt",
                "Kézbesítési garancia: nem állok meg három próbálkozásnál",
                "Havonta díjmentesen: A Társaság Tagjainak 1, A Belső Kör Tagjainak 3",
                "A kereten felül is küldhetsz, általad választott összegért (legalább 1 000 Ft) — ezeket az összeg szerint csökkenő sorrendben dolgozom fel",
              ].map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className={`${buttonSecondary} mt-8 text-center`}>
              Megnézem A Társaságot
            </a>
          </GildedCard>
        </div>
        <p className="mt-6 max-w-2xl text-xs text-ink-soft">
          A címzett telefonszámát csak a kézbesítéshez használom, és legfeljebb 180 napig őrzöm meg. A kereten
          felüli elsőbbségi üzenet digitális szolgáltatás, nem adomány: minden befizetésről számla készül.
        </p>
      </section>

      <CompassDivider className="my-20" />

      <section id="kuldes" className="scroll-mt-24">
        <SectionTitle eyebrow="Küldés" title="Kinek mondanál ma valami kedveset?" />
        <p className="mt-4 max-w-2xl text-ink-soft">
          Gondold végig nyugodtan, és írd meg úgy, ahogy élőszóban mondanád. A Társaság tagjai elsőbbségi üzenetet a
          gyakorlótérből küldhetnek.
        </p>
        <GildedCard className="mt-8 max-w-3xl p-8">
          <KindMessageForm action={submitGuestMessage} guest termsHref="/aszf#p11" />
        </GildedCard>
      </section>
    </main>
  );
}
