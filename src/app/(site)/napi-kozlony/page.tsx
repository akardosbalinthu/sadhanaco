import { BellOff, Coffee, Newspaper, Printer } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { notifyHref } from "@/lib/cta";
import { buttonPrimary, CompassDivider, GildedCard, linkClass, PageHeader, SectionTitle } from "@/components/ornaments";

export const metadata = {
  title: "Napi Közlöny · Kardos Bálint",
  description:
    "Reggeli, kinyomtatott újság a telefon helyett: minden éjjel 4:30-kor elkészül, reggel kézbe veszed — értesítések és végtelen görgetés nélkül.",
};

const WHY = [
  {
    Icon: BellOff,
    title: "Nincs értesítés",
    text: "A papír nem rezeg, nem villog, és nem kér még öt percet. A reggeled a tiéd marad.",
  },
  {
    Icon: Newspaper,
    title: "Van vége",
    text: "Egy A4-es lap eleje és vége van. Elolvasod, és kész vagy — nincs végtelen hírfolyam, ami tovább húz.",
  },
  {
    Icon: Coffee,
    title: "Nyugodt napindítás",
    text: "Az idegrendszered nem riasztással kezdi a napot, hanem egy kávé és néhány sor mellett.",
  },
];

export default function DailyGazettePage() {
  return (
    <main className="py-16">
      <PageHeader eyebrow="Fejlesztés alatt · Analóg reggel" title="Napi Közlöny">
        <p className="font-serif text-xl text-ink">
          Mi lenne, ha a reggeled nem a telefon képernyőjével kezdődne, hanem egy papírlappal a kávé mellett?
        </p>
        <p>
          A legtöbbünk napja még ágyban fekve elindul: értesítések, hírek, üzenetek — és mire felkelünk, az
          idegrendszerünk már készenlétben áll. A Napi Közlöny ezt a hajnali görgetést váltja ki egy egyszerű,
          kinyomtatott reggeli újsággal.
        </p>
      </PageHeader>

      <CompassDivider className="my-14" />

      <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <GildedCard className="p-8">
          <Printer className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-4 font-serif text-2xl text-forest">Hogyan működik</h2>
          <ol className="mt-4 space-y-3 text-sm text-ink-soft">
            <li><span className="text-gold">1.</span> Mesterséges intelligencia szerkeszti meg a napi lapot.</li>
            <li><span className="text-gold">2.</span> Minden éjjel 4:30-kor automatikusan kinyomtatódik — A4-es, fekete-fehér lapon. E-mailről nyomtatásra (Email-to-Print) is működik.</li>
            <li><span className="text-gold">3.</span> Reggel kézbe veszed, a telefon pedig maradhat a fiókban.</li>
          </ol>
        </GildedCard>
        <GildedCard className="p-8">
          <Newspaper className="h-5 w-5 text-gold" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-4 font-serif text-2xl text-forest">A Társaság tagjainak</h2>
          <p className="mt-3 text-sm text-ink-soft">
            Amint a Napi Közlöny elindul, A Társaság aktív tagjai külön díj nélkül, automatikusan megkapják a teljes
            PRO változatot. A Társaságban ez az „Analóg Reggel” — a nap első küldetése.
          </p>
          <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className={`mt-5 inline-block ${linkClass}`}>
            A Társaságról
          </a>
        </GildedCard>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Miért papír?" title="Mert a reggelnek nem kell sürgősnek lennie." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {WHY.map(({ Icon, title, text }) => (
            <GildedCard key={title}>
              <Icon className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
              <h3 className="mt-4 font-serif text-lg text-forest">{title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{text}</p>
            </GildedCard>
          ))}
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Fejlesztés alatt</p>
        <h2 className="mx-auto mt-4 max-w-2xl font-serif text-3xl text-forest">Szólunk, amint az első lap elkészül.</h2>
        <div className="mt-8">
          <a href={notifyHref("a Napi Közlöny indulása")} className={buttonPrimary}>
            Értesítést kérek az indulásról
          </a>
        </div>
      </section>
    </main>
  );
}
