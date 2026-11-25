import { LoginForm } from "./login-form";
import Link from "next/link";
import { GildedCard, linkClass } from "@/components/ornaments";
import { tp } from "@/lib/site";

export const metadata = { title: "Belépés · A Társaság" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tovabb?: string; hiba?: string }>;
}) {
  const { tovabb, hiba } = await searchParams;
  return (
    <main className="mx-auto flex max-w-sm flex-col justify-center px-6 py-24">
      <GildedCard className="p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">
          A Társaság
        </p>
        <h1 className="mt-3 font-serif text-3xl text-forest">Belépés</h1>
        <p className="mt-2 mb-8 text-sm text-ink-soft">
          Jelszóra nincs szükség: egy egyszer használható belépő linket küldök az e-mail-címedre.
        </p>
        {hiba && (
          <p className="mb-6 rounded-md border border-gold/40 bg-gold-soft/20 p-3 text-sm text-ink-soft">
            A link lejárt vagy már felhasználták. Kérj egy újat.
          </p>
        )}
        <LoginForm tovabb={tovabb} />
      </GildedCard>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Még nem vagy tag?{" "}
        <Link href={`${tp("/")}#csatlakozas`} className={linkClass}>
          Így csatlakozhatsz
        </Link>
      </p>
    </main>
  );
}
