import Link from "next/link";
import { fmtDateTime, huf, isoToBudapestLocal, profilesById, requireAdmin } from "@/lib/admin";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { cancelConsultation, markConsultationDone, scheduleConsultationSlot } from "../actions";
import { Empty, Flash, H2, label, smallButton, smallInput, smallPrimary, type SP } from "../ui";

const STATUS: Record<string, string> = { requested: "Új kérés", scheduled: "Időpont egyeztetve", done: "Megtörtént", cancelled: "Lemondva" };

export default async function AdminConsultations({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: open }, { data: recent }] = await Promise.all([
    supabase.from("consultations").select("*").in("status", ["requested", "scheduled"]).order("requested_for", { nullsFirst: true }).order("created_at"),
    supabase.from("consultations").select("*").in("status", ["done", "cancelled"]).order("created_at", { ascending: false }).limit(15),
  ]);
  const people = await profilesById(supabase, [...(open ?? []), ...(recent ?? [])].map((c) => c.user_id));

  return (
    <div className="space-y-14">
      <Flash sp={sp} />
      <section>
        <H2>Nyitott konzultációk</H2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          A tag által javasolt időpont csak kiindulópont. Egyeztess vele e-mailben, majd itt rögzítsd a végleges időpontot.
        </p>
        {(open ?? []).length === 0 ? (
          <Empty>Most nincs nyitott kérés.</Empty>
        ) : (
          <ul className="mt-6 space-y-4">
            {open!.map((c) => {
              const p = people.get(c.user_id);
              return (
                <li key={c.id}>
                  <GildedCard>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <div>
                        <Link href={tp(`/admin/tagok?tag=${c.user_id}`)} className="font-serif text-xl text-forest hover:text-gold">
                          {p?.display_name || p?.email}
                        </Link>
                        <p className="text-xs text-ink-soft">{p?.email}</p>
                      </div>
                      <p className="text-sm text-gold">{c.is_free ? "Díjmentes (éves keret)" : huf(c.price_huf)}</p>
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">
                      {STATUS[c.status]} · kérte: {fmtDateTime(c.created_at)} · {c.status === "scheduled" ? "időpont" : "javasolt időpont"}:{" "}
                      {fmtDateTime(c.requested_for)}
                    </p>
                    {c.note && <p className="mt-3 whitespace-pre-line border-l-2 border-gold/40 pl-3 text-sm text-ink">{c.note}</p>}
                    <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-4">
                      <form action={scheduleConsultationSlot} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="id" value={c.id} />
                        <label>
                          <span className={label}>Végleges időpont</span>
                          <input type="datetime-local" name="requested_for" defaultValue={isoToBudapestLocal(c.requested_for)} className={`${smallInput} mt-1`} />
                        </label>
                        <button className={smallPrimary}>Rögzítés</button>
                      </form>
                      <form action={markConsultationDone}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className={smallButton}>Megtörtént</button>
                      </form>
                      <form action={cancelConsultation}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className={smallButton}>Lemondás</button>
                      </form>
                    </div>
                  </GildedCard>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section>
        <H2>Legutóbbiak</H2>
        {(recent ?? []).length === 0 ? (
          <Empty>Még nincs lezárt konzultáció.</Empty>
        ) : (
          <ul className="mt-6 space-y-2 text-sm">
            {recent!.map((c) => (
              <li key={c.id} className="flex flex-wrap gap-x-3 border-b border-line/60 pb-2">
                <span className="text-forest">{people.get(c.user_id)?.display_name || people.get(c.user_id)?.email}</span>
                <span className="text-ink-soft">{c.is_free ? "díjmentes" : huf(c.price_huf)}</span>
                <span className={c.status === "done" ? "text-gold" : "text-ink-soft"}>{STATUS[c.status]}</span>
                <span className="ml-auto text-ink-soft">{fmtDateTime(c.requested_for ?? c.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
