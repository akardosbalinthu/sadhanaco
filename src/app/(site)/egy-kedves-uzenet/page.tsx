import { Check } from "lucide-react";
import { KindMessageForm } from "@/components/kind-message-form";
import { submitGuestMessage } from "./actions";
import { buttonPrimary, CompassDivider, GildedCard, PageHeader, SectionTitle } from "@/components/ornaments";
import { KindCall } from "@/components/illustrations";

export const metadata = {
  title: "Egy Kedves Üzenet · Kardos Bálint",
  description:
    "Írd meg, mit üzennél valakinek – én egy meglepetés-telefonhívásban átadom. Bárkinek, díjmentesen.",
};

const STEPS = [
  { title: "Megírod", text: "Kinek szól, mit üzennél neki, és milyen számon érem el. Néhány őszinte mondat elég." },
  { title: "Megerősíted", text: "Küldök egy e-mailt, és egy kattintással megerősíted, hogy tényleg te küldted." },
  { title: "Felhívom", text: "Élő adásban vagy rövid videóban felhívom a címzettet, és felolvasom neki az üzenetedet. Ha szeretnéd, a nevedet nem mondom ki." },
  { title: "Célba ér", text: "Valaki egy átlagos hétköznapon váratlanul megtudja, hogy számít. Ennyi az egész – és sokszor ennyi is elég." },
];

const FREE = [
  "Bárki küldhet, regisztráció nélkül – elég egy e-mailes megerősítés",
  "Ugyanarról a címről több üzenetet is küldhetsz",
  "A beérkezés sorrendjében kézbesítem",
  "Ha a címzettet három próbálkozásra sem érem el, az üzenet lezárul",
];


function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 flex-1 space-y-2.5 text-[15px] text-ink-soft">
      {items.map((f) => (
        <li key={f} className="flex gap-2.5">
          <Check className="mt-1 h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
          {f}
        </li>
      ))}
    </ul>
  );
}

export default function KindMessagePage() {
  return (
    <main className="py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
        <PageHeader eyebrow="Egy hívás, egy mondat, egy ember" title="Egy Kedves Üzenet">
          <p className="font-serif text-xl text-ink">
            Vannak mondatok, amelyeket évek óta magunkban hordunk. Egy köszönet a tanárnak, aki hitt bennünk. Egy
            „büszke vagyok rád” a testvérünknek. Egy bátorító szó egy barátnak a nehéz napja előtt. Egy „gondolok rád”
            annak, akivel rég nem beszéltünk.
          </p>
          <p>
            Ezeket a mondatokat egy meglepetés-telefonhívásban adom át annak, akinek szólnak. Te megírod, én felhívom
            és felolvasom. A vonal másik végén pedig valaki egy átlagos délután megtudja, hogy fontos valakinek.
          </p>
          <p className="pt-2">
            <a href="#kuldes" className={buttonPrimary}>
              Megírom az üzenetem
            </a>
          </p>
        </PageHeader>
        <KindCall className="mx-auto hidden h-48 w-48 lg:block" />
      </div>

      <CompassDivider className="my-16" />

      <section>
        <SectionTitle eyebrow="Hogyan működik?" title="Négy lépés, és az üzeneted már úton is van." />
        <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t border-gold/30 pt-5">
              <span className="font-serif text-2xl text-gold">{i + 1}.</span>
              <h3 className="mt-2 font-serif text-xl text-forest">{s.title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <CompassDivider className="my-20" />

      <section className="grid items-start gap-10 md:grid-cols-[1fr_1fr]">
        <SectionTitle eyebrow="Jó tudni" title="Bárki küldhet, díjmentesen." />
        <div>
          <Bullets items={FREE} />
          <p className="mt-6 text-sm text-ink-soft">
            A címzett telefonszámát csak a kézbesítéshez használom, és legfeljebb 180 napig őrzöm meg.
          </p>
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section id="kuldes" className="scroll-mt-24">
        <SectionTitle eyebrow="Küldés" title="Kinek mondanál ma valami kedveset?" />
        <p className="mt-4 max-w-2xl text-ink-soft">
          Gondold végig nyugodtan, és írd meg úgy, ahogy élőszóban mondanád.
        </p>
        <GildedCard ornate className="mt-8 max-w-3xl p-8">
          <KindMessageForm action={submitGuestMessage} guest termsHref="/aszf#p8" />
        </GildedCard>
      </section>
    </main>
  );
}
