import { redirect } from "next/navigation";
import { requireMember } from "@/lib/member";
import { tp } from "@/lib/site";
import { MemberNav } from "@/components/member-nav";
import { buttonPrimary, GildedCard, inputClass, PageHeader } from "@/components/ornaments";
import { addEntry } from "./actions";

export const metadata = { title: "Napló · Programom" };
export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const { supabase, hasAccess } = await requireMember();
  if (!hasAccess) redirect(tp("/program"));
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, entry_on, body")
    .order("entry_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <MemberNav active="/naplo" />
      <PageHeader eyebrow="Napló" title="Gyakorlónapló">
        <p>
          Néhány sor arról, mit vettél észre ma — a légzésedben, a testedben, egy helyzetben. A naplódat csak te
          látod; még én sem.
        </p>
      </PageHeader>
      <GildedCard className="mt-8 p-6">
        <form action={addEntry} className="space-y-4">
          <textarea name="body" rows={4} required maxLength={10000} placeholder="Mit vettél észre ma?" className={inputClass} />
          <button className={buttonPrimary}>Elmentem</button>
        </form>
      </GildedCard>
      <ul className="mt-8 space-y-4">
        {(entries ?? []).map((e) => (
          <li key={e.id}>
            <GildedCard>
              <p className="text-xs uppercase tracking-[0.18em] text-gold">
                {new Date(e.entry_on).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm text-ink">{e.body}</p>
            </GildedCard>
          </li>
        ))}
      </ul>
    </main>
  );
}
