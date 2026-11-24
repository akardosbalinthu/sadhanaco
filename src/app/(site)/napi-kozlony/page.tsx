import { Newspaper, Printer } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { CompassDivider, GildedCard, linkClass, PageHeader } from "@/components/ornaments";

export const metadata = {
  title: "Napi Közlöny · Kardos Bálint",
  description: "Reggeli, kinyomtatott újság a telefon helyett — értesítési zaj nélkül.",
};

export default function DailyGazettePage() {
  return (
    <main className="py-16">
      <PageHeader eyebrow="Fejlesztés alatt · Analóg reggel" title="Napi Közlöny">
        <p>
          A nap első perceit sokan a telefon képernyőjén töltjük: értesítések, hírfolyam, sürgetés. A
          Napi Közlöny ezt váltja ki egy egyszerű, papíron olvasható reggeli újsággal.
        </p>
      </PageHeader>

      <CompassDivider className="my-14" />

      <div className="grid gap-5 sm:grid-cols-2">
        <GildedCard>
          <Printer className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-4 font-serif text-xl text-forest">Hogyan működik</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>Mesterséges intelligencia szerkeszti.</li>
            <li>Minden éjjel 4:30-kor automatikusan kinyomtatódik — A4-es, fekete-fehér lapon.</li>
            <li>E-mailről nyomtatásra (Email-to-Print) is működik.</li>
            <li>Reggel kézbe veszed, és a telefon maradhat a fiókban.</li>
          </ul>
        </GildedCard>

        <GildedCard>
          <Newspaper className="h-5 w-5 text-gold" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-4 font-serif text-xl text-forest">A Társaság tagjainak</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Amint a Napi Közlöny elindul, a Társaság aktív tagjai külön díj nélkül, automatikusan
            megkapják a teljes PRO változatot.
          </p>
          <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className={`mt-4 inline-block ${linkClass}`}>
            A Társaságról
          </a>
        </GildedCard>
      </div>
    </main>
  );
}
