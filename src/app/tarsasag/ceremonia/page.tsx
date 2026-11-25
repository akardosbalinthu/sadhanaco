import { redirect } from "next/navigation";
import { requireMember, ORDER_INFO } from "@/lib/member";
import { tp } from "@/lib/site";
import { MemberNav } from "@/components/member-nav";
import { PageHeader } from "@/components/ornaments";
import { Ceremony } from "./ceremony";

export const metadata = { title: "A Ceremónia · A Társaság" };
export const dynamic = "force-dynamic";

type Q = { id: number; prompt: string; options: { key: string; text: string }[] };

export default async function CeremonyPage() {
  const { supabase, profile, hasAccess } = await requireMember();
  if (!hasAccess || profile.order_key) redirect(tp("/gyakorlas"));

  const { data } = await supabase.rpc("compass_questionnaire");
  // A válaszok sorrendjét kérdésenként keverjük, hogy a betűjelből ne lehessen a rendre következtetni.
  const questions = ((data as unknown as Q[]) ?? []).map((q) => ({
    ...q,
    options: [...q.options].sort(() => Math.random() - 0.5),
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <MemberNav active="" />
      <PageHeader eyebrow="Az első lépés" title="A Ceremónia">
        <p>
          Tizenkét kérdés arról, hogyan működik az idegrendszered a hétköznapokban. Nincs jó vagy rossz válasz:
          azt jelöld, ami a leginkább igaz rád — nem azt, amilyen szeretnél lenni.
        </p>
        <p className="text-xs">
          A Ceremónia önismereti eszköz, nem pszichológiai vizsgálat vagy diagnózis. A rended végleges.
        </p>
      </PageHeader>
      <div className="mt-10">
        <Ceremony questions={questions} info={ORDER_INFO} practiceHref={tp("/gyakorlas")} reportHref={tp("/rendem")} />
      </div>
    </main>
  );
}
