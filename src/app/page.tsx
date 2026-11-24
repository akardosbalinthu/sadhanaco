import Link from "next/link";
import { Leaf } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <Leaf className="mb-8 h-6 w-6 text-moss" strokeWidth={1.5} aria-hidden />
      <h1 className="font-serif text-3xl text-ink sm:text-4xl">
        Sadhana Idegrendszerfejlesztő Társaság
      </h1>
      <p className="mt-3 text-sm tracking-wide text-moss-soft">
        Jelenlét – Tudatosság – Szabadság
      </p>
      <p className="mt-8 text-ink-soft">
        Csendes, közös gyakorlótér. Nem tanácsokat osztunk egymásnak, hanem
        megosztjuk, mit tapasztalunk a légzéssel, a figyelemmel és a saját
        idegrendszerünkkel.
      </p>
      <div className="mt-10">
        <Link
          href="/belepes"
          className="inline-block rounded-md bg-moss px-5 py-2.5 text-sm text-paper hover:bg-moss-soft"
        >
          Belépés
        </Link>
      </div>
    </main>
  );
}
