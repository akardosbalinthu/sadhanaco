import { PageHeader } from "@/components/ornaments";
import { normalizeUtm } from "@/lib/application";
import { ApplicationForm } from "./application-form";

export const metadata = {
  title: "Jelentkezés konzultációra · Kardos Bálint",
  description:
    "Jelentkezés az Acélidegek Mentorprogram ingyenes, 55 perces konzultációjára: 14 rövid kérdés, a végén a személyes Idegrendszer-térképed és egy első lépés.",
};

export default async function ApplyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = sp.utm_source ?? sp.forras;
  const utmSource = normalizeUtm(Array.isArray(raw) ? raw[0] : raw);
  return (
    <main className="py-16">
      <PageHeader eyebrow="Jelentkezés konzultációra" title="Hol tartasz most? Nézzük meg pár perc alatt.">
        <p>
          14 rövid kérdés a megnyugvásról, az alvásról, a figyelmedről és arról, hogyan döntesz nyomás alatt. Mindegyikre
          egy számmal válaszolsz 1-től 10-ig, és a végén leírod, miben kérnél segítséget.
        </p>
        <p>
          Utána megkapod az Idegrendszer-térképedet egy első lépéssel, amelyet még ma kipróbálhatsz, és időpontot
          választhatsz az ingyenes, 55 perces online konzultációhoz.
        </p>
      </PageHeader>
      <div className="mt-12 max-w-2xl">
        <ApplicationForm utmSource={utmSource} />
      </div>
    </main>
  );
}
