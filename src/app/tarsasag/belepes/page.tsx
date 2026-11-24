import { LoginForm } from "./login-form";
import { GildedCard } from "@/components/ornaments";

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
        <p className="text-xs uppercase tracking-[0.25em] text-gold">
          A Társaság
        </p>
        <h1 className="mt-3 font-serif text-3xl text-forest">Belépés</h1>
        <p className="mt-2 mb-8 text-sm text-ink-soft">
          Jelszó nincs. Küldünk egy egyszer használatos linket az
          e-mail-címedre.
        </p>
        {hiba && (
          <p className="mb-6 rounded-md border border-gold/40 bg-gold-soft/20 p-3 text-sm text-ink-soft">
            A link lejárt vagy már felhasználták. Kérj egy újat.
          </p>
        )}
        <LoginForm tovabb={tovabb} />
      </GildedCard>
    </main>
  );
}
