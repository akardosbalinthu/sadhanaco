import { SITE } from "@/lib/site";
import { CompassDivider, GildedCard, PageHeader } from "@/components/ornaments";

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
      <PageHeader eyebrow="Jogi adatok" title="Impresszum" />
      <CompassDivider className="my-12" />
      <GildedCard className="max-w-xl">
        <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-ink-soft">{k}</dt>
              <dd className="text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </GildedCard>
    </main>
  );
}
