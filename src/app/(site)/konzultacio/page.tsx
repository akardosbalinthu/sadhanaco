import { PageHeader } from "@/components/ornaments";
import { normalizeUtm } from "@/lib/application";
import { ConsultationForm } from "./consultation-form";

export const metadata = {
  title: "Konzultáció foglalása · Kardos Bálint",
  description:
    "Foglalj ingyenes, 30 perces online konzultációt az Acélidegek Mentorprogramra. Megbeszéljük, hol tartasz, és hogy a program jó választás-e neked.",
};

export default async function ConsultationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = sp.utm_source ?? sp.forras;
  const utmSource = normalizeUtm(Array.isArray(raw) ? raw[0] : raw);
  return (
    <main className="py-16">
      <PageHeader eyebrow="Acélidegek Mentorprogram" title="Foglalj konzultációt.">
        <p>
          A konzultáció ingyenes, 30 perces, és online zajlik. Megbeszéljük, hol tartasz, mit szeretnél elérni, és hogy a
          program jó választás-e neked. Itt beszéljük meg a részleteket és a díjat is. A beszélgetés semmire nem kötelez.
        </p>
        <p>Add meg az elérhetőségedet, a következő lépésben pedig kiválaszthatod az időpontot.</p>
      </PageHeader>
      <div className="mt-12 max-w-2xl">
        <ConsultationForm utmSource={utmSource} />
      </div>
    </main>
  );
}
