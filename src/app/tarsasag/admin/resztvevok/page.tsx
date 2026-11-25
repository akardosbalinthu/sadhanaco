import Link from "next/link";
import { fmtDate, requireAdmin } from "@/lib/admin";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { enrollParticipant } from "../program-actions";
import { SubmitButton } from "../submit-button";
import { Empty, Flash, H2, label, smallInput, smallPrimary, type SP } from "../ui";

export const dynamic = "force-dynamic";

export default async function ParticipantsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: rows } = await supabase
    .from("program_enrollments")
    .select("id, user_id, starts_on, status, profiles(first_name, last_name, email)")
    .order("status")
    .order("starts_on", { ascending: false });
  const ids = (rows ?? []).map((r) => r.id);
  const [{ data: next }, { data: open }] = await Promise.all([
    ids.length
      ? supabase.from("program_sessions").select("enrollment_id, starts_at").in("enrollment_id", ids).eq("status", "tervezett").gte("starts_at", new Date().toISOString()).order("starts_at")
      : Promise.resolve({ data: [] as { enrollment_id: string; starts_at: string }[] }),
    ids.length
      ? supabase.from("weekly_reports").select("enrollment_id").in("enrollment_id", ids).is("admin_reply", null)
      : Promise.resolve({ data: [] as { enrollment_id: string }[] }),
  ]);
  const nextBy = new Map<string, string>();
  for (const s of next ?? []) if (!nextBy.has(s.enrollment_id)) nextBy.set(s.enrollment_id, s.starts_at);
  const openBy = new Map<string, number>();
  for (const r of open ?? []) openBy.set(r.enrollment_id, (openBy.get(r.enrollment_id) ?? 0) + 1);
  const today = new Date().toISOString().slice(0, 10);
  const fmt = (iso: string) => new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", month: "short", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  return (
    <div className="space-y-14">
      <Flash sp={sp} />
      <section>
        <H2>Résztvevők</H2>
        {(rows ?? []).length === 0 ? (
          <Empty>Még nincs résztvevő. A jelentkezések oldaláról vagy lent veheted fel őket.</Empty>
        ) : (
          <ul className="mt-6 space-y-3">
            {rows!.map((r) => {
              const p = r.profiles as unknown as { first_name: string | null; last_name: string | null; email: string } | null;
              const name = [p?.last_name, p?.first_name].filter(Boolean).join(" ") || p?.email;
              const n = openBy.get(r.id) ?? 0;
              return (
                <li key={r.id}>
                  <Link href={tp(`/admin/resztvevok/${r.id}`)} className="group block">
                    <GildedCard className={`flex flex-wrap items-baseline justify-between gap-3 p-5 transition-colors duration-300 group-hover:border-gold/50 ${r.status === "lezart" ? "opacity-60" : ""}`}>
                      <div>
                        <p className="font-serif text-lg text-forest">{name}</p>
                        <p className="text-xs text-ink-soft">{p?.email} · kezdés: {fmtDate(r.starts_on)} · {r.status === "aktiv" ? "aktív" : "lezárt"}</p>
                      </div>
                      <div className="text-right text-sm">
                        {nextBy.get(r.id) && <p className="text-forest">Következő: {fmt(nextBy.get(r.id)!)}</p>}
                        {n > 0 && <p className="text-xs text-gold">{n} megválaszolatlan beszámoló</p>}
                      </div>
                    </GildedCard>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <H2>Résztvevő felvétele jelentkezés nélkül</H2>
        <form action={enrollParticipant} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block"><span className={label}>Név</span><input name="full_name" required className={`${smallInput} mt-1 w-full`} /></label>
          <label className="block"><span className={label}>E-mail (ezzel lép be)</span><input name="email" type="email" required className={`${smallInput} mt-1 w-full`} /></label>
          <label className="block"><span className={label}>A program kezdőnapja</span><input name="starts_on" type="date" defaultValue={today} required className={`${smallInput} mt-1 w-full`} /></label>
          <label className="block"><span className={label}>Az első alkalom (nem kötelező)</span><input name="first_session" type="datetime-local" className={`${smallInput} mt-1 w-full`} /></label>
          <label className="block sm:col-span-2"><span className={label}>Állandó Meet-link (nem kötelező)</span><input name="meet_url" type="url" placeholder="https://meet.google.com/…" className={`${smallInput} mt-1 w-full`} /></label>
          <div className="sm:col-span-2"><SubmitButton className={smallPrimary}>Felveszem</SubmitButton></div>
        </form>
      </section>
    </div>
  );
}
