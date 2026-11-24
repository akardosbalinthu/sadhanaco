import { SITE } from "@/lib/site";

export const metadata = { title: "Impresszum · Kardos Bálint" };

/**
 * FIGYELEM: a [kitöltendő] mezőket élesítés előtt Bálintnak kell megadnia
 * (székhely, nyilvántartási szám, adószám, tárhelyszolgáltató adatai).
 */
export default function ImprintPage() {
  const rows: [string, string][] = [
    ["Szolgáltató", "Kardos Bálint egyéni vállalkozó"],
    ["Adózás", "KATA, alanyi adómentes (AAM)"],
    ["Székhely", "[kitöltendő]"],
    ["Nyilvántartási szám", "[kitöltendő]"],
    ["Adószám", "[kitöltendő]"],
    ["E-mail", SITE.email],
    ["Tárhelyszolgáltató", "Vercel Inc. [cím kitöltendő]"],
  ];
  return (
    <main className="py-16">
      <h1 className="font-serif text-3xl">Impresszum</h1>
      <dl className="mt-8 grid max-w-xl grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-ink-soft">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
