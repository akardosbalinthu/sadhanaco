import { PageHeader } from "@/components/ornaments";
import { ApplicationForm } from "./application-form";

export const metadata = {
  title: "Jelentkezés konzultációra · Kardos Bálint",
  description: "Egy nagyjából tízperces felmérés az egyéni program ismerkedő konzultációja előtt.",
  robots: { index: false, follow: true },
};

export default function ApplyPage() {
  return (
    <main className="py-16">
      <PageHeader eyebrow="Jelentkezés konzultációra" title="Kezdjük azzal, hol tartasz most.">
        <p>
          A felmérés nagyjából tíz perc. Segít, hogy a konzultáción már a lényegről beszélhessünk, és hogy a programot a
          te helyzetedre szabhassam.
        </p>
        <p>
          Ha most szeretnél elkezdeni, a végén rögtön választhatsz időpontot az ismerkedő konzultációra.
        </p>
      </PageHeader>
      <div className="mt-14 max-w-3xl">
        <ApplicationForm />
      </div>
    </main>
  );
}
