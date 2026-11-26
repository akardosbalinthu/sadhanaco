import { PageHeader } from "@/components/ornaments";
import { normalizeUtm } from "@/lib/application";
import { ApplicationForm } from "./application-form";

export const metadata = {
  title: "Jelentkezés konzultációra · Kardos Bálint",
  description: "15 rövid kérdés, a végén a személyes Életmód-térképed és egy tanács, amelyet még ma kipróbálhatsz.",
  robots: { index: false, follow: true },
};

export default async function ApplyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = sp.utm_source ?? sp.forras;
  const utmSource = normalizeUtm(Array.isArray(raw) ? raw[0] : raw);
  return (
    <main className="py-16">
      <PageHeader eyebrow="Jelentkezés konzultációra" title="Hol tartasz most? Nézzük meg két perc alatt.">
        <p>
          15 rövid kérdés, mindegyikre egy számmal válaszolsz 1-től 10-ig. A végén megkapod az Életmód-térképedet: hol
          vagy már erős, mi lehet a következő kis lépésed, és egy tanácsot, amelyet még ma kipróbálhatsz.
        </p>
      </PageHeader>
      <div className="mt-12 max-w-2xl">
        <ApplicationForm utmSource={utmSource} />
      </div>
    </main>
  );
}
