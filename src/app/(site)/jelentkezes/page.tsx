import { PageHeader } from "@/components/ornaments";
import { ApplicationForm } from "./application-form";

export const metadata = {
  title: "Jelentkezés konzultációra · Kardos Bálint",
  description: "15 rövid kérdés, a végén a személyes Életmód-térképed és egy tanács, amit még ma kipróbálhatsz.",
  robots: { index: false, follow: true },
};

export default function ApplyPage() {
  return (
    <main className="py-16">
      <PageHeader eyebrow="Jelentkezés konzultációra" title="Hol tartasz most? Nézzük meg két perc alatt.">
        <p>
          15 rövid kérdés, mindegyikre egy számmal válaszolsz 1-től 10-ig. A végén megkapod az Életmód-térképedet: hol
          vagy már erős, mi lehet a következő kis lépésed, és egy tanácsot, amit még ma kipróbálhatsz.
        </p>
      </PageHeader>
      <div className="mt-12 max-w-2xl">
        <ApplicationForm />
      </div>
    </main>
  );
}
