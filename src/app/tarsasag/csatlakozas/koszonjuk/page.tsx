import Link from "next/link";
import { tp } from "@/lib/site";
import { buttonSecondary, GildedCard, PageHeader } from "@/components/ornaments";

export const metadata = { title: "Üdv A Társaságban · A Társaság" };

export default function ThanksPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <PageHeader eyebrow="Üdv A Társaságban" title="Köszönöm, hogy csatlakoztál.">
        <p>
          Néhány percen belül e-mailt kapsz a belépő linkkel arra a címre, amelyet a fizetésnél megadtál. Jelszóra nincs szükség: a linkre kattintva beléphetsz, később pedig a belépés oldalon bármikor kérhetsz újat.
        </p>
      </PageHeader>
      <GildedCard className="mt-10 p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Ami most következik</p>
        <ol className="mt-4 space-y-2 text-sm text-ink-soft">
          <li><span className="text-gold">1.</span> Belépsz az e-mailben kapott linkkel.</li>
          <li><span className="text-gold">2.</span> Kitöltöd a Ceremóniát, és kiderül, melyik rendbe tartozol.</li>
          <li><span className="text-gold">3.</span> Megnyílik az első lépcső: a Jelenlét online modul és az első integrációs program.</li>
        </ol>
        <Link href={tp("/belepes")} className={`${buttonSecondary} mt-8`}>
          Belépés
        </Link>
      </GildedCard>
    </main>
  );
}
