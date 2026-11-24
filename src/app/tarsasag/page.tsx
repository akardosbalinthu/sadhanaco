import Link from "next/link";
import { Check, Leaf } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { formatHuf, tp } from "@/lib/site";

export const revalidate = 300;

const TIERS = [
  {
    name: "Társasági Tagság",
    monthly: "tarsasagi_havi",
    yearly: "tarsasagi_eves",
    note: "7 napos próbaidővel (havi előfizetésnél)",
    features: [
      "Közösségi tér és napi gyakorlási napló",
      "I. Modul (Jelenlét) + I. Integrációs Program — 8+1 hét, azonnal",
      "Havi közös túra Magyarországon — az úti célt a Társaság szavazza meg",
      "Heti online közös meditáció, havi Q&A felvételek",
      "Havi 1 díjmentes Elsőbbségi Kedves Üzenet",
      "Napi Közlöny PRO a tagság ideje alatt",
      "Kedvezményes részvétel a Nyílt Esteken és az Élő Gyakorlónapokon",
    ],
  },
  {
    name: "Belső Kör",
    monthly: "belso_kor_havi",
    yearly: "belso_kor_eves",
    note: "Minden, ami a Társasági Tagságban, és még:",
    features: [
      "A teljes tananyag-ív külön díj nélkül (a nyitás egyeztetéssel)",
      "Havi élő Q&A kérdezési joggal",
      "Havi 3 díjmentes Elsőbbségi Kedves Üzenet",
      "Díjmentes Nyílt Estek, Gyakorlónapok és Szabadság Elvonulás, elsőbbségi foglalással",
      "Éves előfizetésnél évi 4 díjmentes 1-on-1 konzultáció",
    ],
  },
];

export default async function TarsasagHome() {
  const supabase = createPublicClient();
  const { data: prices } = await supabase.from("price_catalog").select("code, amount_huf");
  const price = (code: string) => prices?.find((p) => p.code === code)?.amount_huf;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <section className="max-w-2xl">
        <Leaf className="mb-8 h-6 w-6 text-moss" strokeWidth={1.5} aria-hidden />
        <h1 className="font-serif text-3xl sm:text-4xl">A Társaság</h1>
        <p className="mt-3 text-sm tracking-wide text-moss-soft">Jelenlét – Tudatosság – Szabadság</p>
        <p className="mt-8 font-serif text-xl text-ink">
          Azon dolgozunk, hogy jobb hellyé tegyük a világot — először magunkkal kezdve.
        </p>
        <p className="mt-4 text-ink-soft">
          Ehhez négy dolgot gyakorlunk, egymás felé és a hétköznapokban is: a kedvességet, a
          figyelmességet, a tudatosságot és a segítőkészséget. Az idegrendszer-fejlesztés ennek az
          alapja — egy nyugodtabb idegrendszerrel könnyebb jelen lenni és jónak lenni.
        </p>
        <p className="mt-4 text-ink-soft">
          Havonta egyszer közösen túrázunk valahol Magyarországon. A következő úti célt mindig a
          Társaság szavazza meg.
        </p>
        <p className="mt-4 text-ink-soft">
          Nem tanácsokat osztunk egymásnak, hanem megosztjuk, mit tapasztalunk a légzéssel, a
          figyelemmel és a saját idegrendszerünkkel. A tananyag négy egymásra épülő lépcsőben halad; a
          továbblépés előtt mindig beszélünk egy rövidet.
        </p>
        <div className="mt-10">
          <Link
            href={tp("/belepes")}
            className="inline-block rounded-md border border-moss px-5 py-2.5 text-sm text-moss hover:bg-moss-tint"
          >
            Már tag vagyok — belépés
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-6 sm:grid-cols-2">
        {TIERS.map((t) => {
          const m = price(t.monthly);
          const y = price(t.yearly);
          return (
            <article key={t.name} className="flex flex-col rounded-lg border border-line p-6">
              <h2 className="font-serif text-xl">{t.name}</h2>
              {m !== undefined && (
                <p className="mt-3 text-ink">
                  {formatHuf(m)} <span className="text-sm text-ink-soft">/ hó</span>
                </p>
              )}
              {y !== undefined && (
                <p className="text-sm text-ink-soft">vagy {formatHuf(y)} / év (2 hónap ajándék)</p>
              )}
              <p className="mt-4 text-sm text-moss-soft">{t.note}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" strokeWidth={1.5} aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-ink-soft">A csatlakozás hamarosan nyílik.</p>
            </article>
          );
        })}
      </section>

      <p className="mt-10 max-w-2xl text-xs text-ink-soft">
        Lemondás bármikor, a következő számlázási ciklustól; addig a hozzáférés megmarad. Visszatéréskor a
        haladás elölről indul. Minden díj szolgáltatási díj, alanyi adómentes számlával.
      </p>
    </main>
  );
}
