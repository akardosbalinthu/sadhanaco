import Link from "next/link";
import { fmtDateTime, isoToBudapestLocal, profilesById, requireAdmin } from "@/lib/admin";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { approveProgression, declineProgression, scheduleConsultation } from "../actions";
import { Empty, Flash, H2, label, smallButton, smallInput, smallPrimary, type SP } from "../ui";

const STAGE = { 2: "II. lépcső — Tudatosság", 3: "III. lépcső — IP 3", 4: "IV. lépcső — Szabadság Elvonulás" } as Record<number, string>;
const STATUS = { requested: "Új kérés", scheduled: "Konzultáció egyeztetve", approved: "Megnyitva", declined: "Elutasítva", cancelled: "Visszavonva" } as Record<string, string>;

export default async function AdminProgression({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: open }, { data: recent }] = await Promise.all([
    supabase.from("progression_requests").select("*").in("status", ["requested", "scheduled"]).order("created_at"),
    supabase.from("progression_requests").select("*").not("status", "in", "(requested,scheduled)").order("decided_at", { ascending: false }).limit(15),
  ]);
  const people = await profilesById(supabase, [...(open ?? []), ...(recent ?? [])].map((r) => r.user_id));

  return (
    <div className="space-y-14">
      <Flash sp={sp} />
      <section>
        <H2>Nyitott kérések</H2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          A tag akkor kérheti a továbblépést, ha elvégezte az előző lépcsőt és elérte a rangot (vagy gyorsítva vásárolt,
          vagy Belső Kör tag). Egyeztess vele egy rövid, díjmentes konzultációt, és utána nyisd meg a lépcsőt.
        </p>
        {(open ?? []).length === 0 ? (
          <Empty>Most nincs nyitott kérés.</Empty>
        ) : (
          <ul className="mt-6 space-y-4">
            {open!.map((r) => {
              const p = people.get(r.user_id);
              return (
                <li key={r.id}>
                  <GildedCard>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <div>
                        <Link href={tp(`/admin/tagok?tag=${r.user_id}`)} className="font-serif text-xl text-forest hover:text-gold">
                          {p?.display_name || p?.email}
                        </Link>
                        <p className="text-xs text-ink-soft">{p?.email}</p>
                      </div>
                      <p className="text-sm text-gold">{STAGE[r.target_stage]}</p>
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">
                      {STATUS[r.status]} · kérte: {fmtDateTime(r.created_at)}
                      {r.consultation_at && ` · konzultáció: ${fmtDateTime(r.consultation_at)}`}
                    </p>
                    {r.note && <p className="mt-3 whitespace-pre-line border-l-2 border-gold/40 pl-3 text-sm text-ink">{r.note}</p>}

                    <div className="mt-6 grid gap-6 border-t border-line pt-5 md:grid-cols-2">
                      <form action={scheduleConsultation} className="space-y-2">
                        <input type="hidden" name="id" value={r.id} />
                        <label className="block">
                          <span className={label}>Konzultáció időpontja</span>
                          <input type="datetime-local" name="consultation_at" defaultValue={isoToBudapestLocal(r.consultation_at)} className={`${smallInput} mt-1 w-full`} />
                        </label>
                        <input name="admin_note" defaultValue={r.admin_note ?? ""} placeholder="Jegyzet (a tag is láthatja)" className={`${smallInput} w-full`} />
                        <button className={smallButton}>Időpont mentése</button>
                      </form>
                      <form action={approveProgression} className="space-y-2">
                        <input type="hidden" name="id" value={r.id} />
                        <label className="block">
                          <span className={label}>Döntés a konzultáció után</span>
                          <input name="admin_note" defaultValue={r.admin_note ?? ""} placeholder="Üzenet a tagnak (a tag is láthatja)" className={`${smallInput} mt-1 w-full`} />
                        </label>
                        <div className="flex gap-2">
                          <button formAction={approveProgression} className={smallPrimary}>
                            Lépcső megnyitása
                          </button>
                          <button formAction={declineProgression} className={smallButton}>
                            Még nem
                          </button>
                        </div>
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
        <H2>Legutóbbi döntések</H2>
        {(recent ?? []).length === 0 ? (
          <Empty>Még nincs döntés.</Empty>
        ) : (
          <ul className="mt-6 space-y-2 text-sm">
            {recent!.map((r) => (
              <li key={r.id} className="flex flex-wrap gap-x-3 border-b border-line/60 pb-2">
                <span className="text-forest">{people.get(r.user_id)?.display_name || people.get(r.user_id)?.email}</span>
                <span className="text-ink-soft">{STAGE[r.target_stage]}</span>
                <span className={r.status === "approved" ? "text-gold" : "text-ink-soft"}>{STATUS[r.status]}</span>
                <span className="ml-auto text-ink-soft">{fmtDateTime(r.decided_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
