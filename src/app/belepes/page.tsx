import { LoginForm } from "./login-form";

export const metadata = { title: "Belépés · Sadhana Társaság" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tovabb?: string; hiba?: string }>;
}) {
  const { tovabb, hiba } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="font-serif text-2xl">Belépés</h1>
      <p className="mt-2 mb-8 text-sm text-ink-soft">
        Jelszó nincs. Küldünk egy egyszer használatos linket az e-mail-címedre.
      </p>
      {hiba && (
        <p className="mb-6 rounded-md border border-line bg-paper-deep p-3 text-sm text-ink-soft">
          A link lejárt vagy már felhasználták. Kérj egy újat.
        </p>
      )}
      <LoginForm tovabb={tovabb} />
    </main>
  );
}
