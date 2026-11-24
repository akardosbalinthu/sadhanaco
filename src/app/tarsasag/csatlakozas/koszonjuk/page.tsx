import Link from "next/link";
import { tp } from "@/lib/site";
import { buttonSecondary, GildedCard, PageHeader } from "@/components/ornaments";

export const metadata = { title: "Köszönjük · A Társaság" };

export default function ThanksPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <PageHeader eyebrow="Üdv A Társaságban" title="Köszönjük, hogy csatlakoztál.">
        <p>
          Néhány percen belül e-mailt kapsz a belépő linkkel arra a címre, amelyet a fizetésnél megadtál. Jelszó
          nincs: a linkre kattintva beléphetsz, később pedig a belépés oldalon bármikor kérhetsz újat.
        </p>
      </PageHeader>
      <GildedCard className="mt-10 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Ami most következik</p>
        <ol className="mt-4 space-y-2 text-sm text-ink-soft">
          <li><span className="text-gold">1.</span> Belépsz az e-mailben kapott linkkel.</li>
          <li><span className="text-gold">2.</span> Részt veszel a Ceremónián, és kiderül, melyik rendbe kerülsz.</li>
          <li><span className="text-gold">3.</span> Megnyílik az első hét: napi 10–15 perc, a saját tempódban.</li>
        </ol>
        <Link href={tp("/belepes")} className={`${buttonSecondary} mt-8`}>
          Belépés
        </Link>
      </GildedCard>
    </main>
  );
}
