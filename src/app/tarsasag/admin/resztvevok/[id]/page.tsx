import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtDate, fmtDateTime, isoToBudapestLocal, requireAdmin } from "@/lib/admin";
import { tp } from "@/lib/site";
import { PROGRAM_PLAN_LABEL } from "@/lib/program-payment";
import { GildedCard } from "@/components/ornaments";
import {
  addSession,
  generateSessions,
  notifyPlanUpdated,
  replyReport,
  saveEnrollment,
  setAllMeet,
  setEnrollmentStatus,
  updateSession,
} from "../../program-actions";
import { SubmitButton } from "../../submit-button";
import { Empty, Flash, H2, label, smallButton, smallInput, smallPrimary, type SP } from "../../ui";

export const dynamic = "force-dynamic";

const STATUS_LABEL = { tervezett: "tervezett", megtartott: "megtartott", elmaradt: "elmaradt" } as const;

export default async function ParticipantDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: e } = await supabase
    .from("program_enrollments")
    .select("id, user_id, application_id, starts_on, stage2_from, status, practice_plan, created_at, closed_at, payment_plan, installments_paid, installments_total, past_due_since, profiles(first_name, last_name, email)")
    .eq("id", id)
    .maybeSingle();
  if (!e) notFound();
  const [{ data: note }, { data: sessions }, { data: reports }] = await Promise.all([
    supabase.rpc("admin_enrollment_notes", { p_enrollment_id: id }),
    supabase.from("program_sessions").select("*").eq("enrollment_id", id).order("starts_at"),
    supabase.from("weekly_reports").select("*").eq("enrollment_id", id).order("week_start", { ascending: false }),
  ]);
  const p = e.profiles as unknown as { first_name: string | null; last_name: string | null; email: string } | null;
  const name = [p?.last_name, p?.first_name].filter(Boolean).join(" ") || p?.email;
  const end = new Date(`${e.starts_on}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 16 * 7 - 1); // 16 hetes program
  const done = (sessions ?? []).filter((s) => s.status === "megtartott").length;

  return (
    <div className="space-y-14">
      <Flash sp={sp} />
      <div>
        <Link href={tp("/admin/resztvevok")} className="text-sm text-ink-soft hover:text-gold">← Résztvevők</Link>
        <h1 className="mt-3 font-serif text-3xl text-forest">{name}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {p?.email} · {fmtDate(e.starts_on)} – {fmtDate(end.toISOString())} · {e.status === "aktiv" ? "aktív" : `lezárva ${fmtDateTime(e.closed_at)}`}
          {e.application_id && (
            <>
              {" · "}
              <Link href={tp(`/admin/jelentkezesek/${e.application_id}`)} className="underline decoration-gold/50 underline-offset-4">felmérés</Link>
            </>
          )}
        </p>
        <p className={`mt-2 text-sm ${e.past_due_since ? "text-alert" : "text-ink-soft"}`}>
          {e.payment_plan
            ? `Fizetés: ${PROGRAM_PLAN_LABEL[e.payment_plan]} · ${e.installments_paid}/${e.installments_total} részlet rendezve`
            : "Fizetés: a rendszeren kívül (kézi felvétel)"}
          {e.past_due_since ? ` · elmaradt részlet ${fmtDateTime(e.past_due_since)} óta (10 nap után a felület szünetel)` : ""}
        </p>
      </div>

      <section>
        <H2>Gyakorlási terv és jegyzet</H2>
        <form action={saveEnrollment} className="mt-5 space-y-4">
          <input type="hidden" name="id" value={e.id} />
          <label className="block">
            <span className={label}>Személyre szabott gyakorlási terv (a résztvevő látja)</span>
            <textarea name="practice_plan" rows={10} defaultValue={e.practice_plan ?? ""} className={`${smallInput} mt-1 w-full font-sans leading-relaxed`} />
          </label>
          <label className="block">
            <span className={label}>Belső jegyzet (csak te látod)</span>
            <textarea name="admin_note" rows={5} defaultValue={(note as string | null) ?? ""} className={`${smallInput} mt-1 w-full`} />
          </label>
          <label className="block max-w-xs">
            <span className={label}>A Tudatosság modul nyitása</span>
            <input name="stage2_from" type="date" defaultValue={e.stage2_from} className={`${smallInput} mt-1 w-full`} />
          </label>
          <SubmitButton className={smallPrimary}>Mentés</SubmitButton>
        </form>
        <form action={notifyPlanUpdated} className="mt-3">
          <input type="hidden" name="id" value={e.id} />
          <button className={smallButton}>Levélben szólok neki, hogy frissült a terve</button>
        </form>
      </section>

      <section>
        <H2>Alkalmak ({done} megtartva / {(sessions ?? []).filter((s) => s.status !== "elmaradt").length})</H2>
        {(sessions ?? []).length === 0 ? (
          <GildedCard className="mt-5 p-6">
            <p className="text-sm text-ink-soft">Még nincs beütemezett alkalom. Add meg az elsőt, és a többit a menetrend szerint felveszem.</p>
            <form action={generateSessions} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="enrollment_id" value={e.id} />
              <label className="block"><span className={label}>Első alkalom</span><input name="first_session" type="datetime-local" required className={`${smallInput} mt-1`} /></label>
              <label className="block"><span className={label}>Meet-link</span><input name="meet_url" type="url" placeholder="https://meet.google.com/…" className={`${smallInput} mt-1 w-64`} /></label>
              <SubmitButton className={smallPrimary}>Beütemezem</SubmitButton>
            </form>
          </GildedCard>
        ) : (
          <>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {sessions!.map((s) => (
                <li key={s.id} className="py-3">
                  <form action={updateSession} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="enrollment_id" value={e.id} />
                    <input name="starts_at" type="datetime-local" defaultValue={isoToBudapestLocal(s.starts_at)} className={smallInput} aria-label="Időpont" />
                    <input name="minutes" type="number" min={10} max={240} defaultValue={s.duration_minutes} className={`${smallInput} w-20`} aria-label="Perc" />
                    <select name="status" defaultValue={s.status} className={smallInput} aria-label="Állapot">
                      {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input name="meet_url" defaultValue={s.meet_url ?? ""} placeholder="Meet-link" className={`${smallInput} w-52`} aria-label="Meet-link" />
                    <input name="note" defaultValue={s.note ?? ""} placeholder="Megjegyzés (látja)" className={`${smallInput} min-w-40 flex-1`} aria-label="Megjegyzés" />
                    <button className={smallButton}>Ment</button>
                    <button name="delete" value="1" className={smallButton}>Töröl</button>
                  </form>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-6">
              <form action={addSession} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="enrollment_id" value={e.id} />
                <label className="block"><span className={label}>Új alkalom</span><input name="starts_at" type="datetime-local" required className={`${smallInput} mt-1`} /></label>
                <input name="minutes" type="number" min={10} max={240} defaultValue={60} className={`${smallInput} w-20`} aria-label="Perc" />
                <input name="meet_url" placeholder="Meet-link" className={`${smallInput} w-44`} aria-label="Meet-link" />
                <button className={smallButton}>Hozzáadom</button>
              </form>
              <form action={setAllMeet} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="enrollment_id" value={e.id} />
                <label className="block"><span className={label}>Egy Meet-link minden jövőbeli alkalomra</span><input name="meet_url" type="url" required placeholder="https://meet.google.com/…" className={`${smallInput} mt-1 w-64`} /></label>
                <button className={smallButton}>Beállítom</button>
              </form>
            </div>
          </>
        )}
      </section>

      <section>
        <H2>Heti beszámolók</H2>
        {(reports ?? []).length === 0 ? (
          <Empty>Még nem érkezett beszámoló.</Empty>
        ) : (
          <ul className="mt-5 space-y-4">
            {reports!.map((r) => (
              <li key={r.id}>
                <GildedCard className={`p-5 ${r.admin_reply ? "" : "border-gold/50"}`}>
                  <p className="text-xs uppercase tracking-[0.16em] text-gold">
                    A hét kezdete: {fmtDate(r.week_start)} · {r.practice_days} gyakorlónap · beküldve {fmtDateTime(r.updated_at)}
                  </p>
                  {r.went_well && <p className="mt-3 text-sm text-ink"><span className="text-ink-soft">Jól ment: </span>{r.went_well}</p>}
                  {r.was_hard && <p className="mt-1 text-sm text-ink"><span className="text-ink-soft">Nehéz volt: </span>{r.was_hard}</p>}
                  {r.question && <p className="mt-1 text-sm text-ink"><span className="text-ink-soft">Kérdés: </span>{r.question}</p>}
                  <form action={replyReport} className="mt-4 space-y-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="enrollment_id" value={e.id} />
                    <textarea name="admin_reply" rows={3} defaultValue={r.admin_reply ?? ""} placeholder="Visszajelzés (a résztvevő látja)" className={`${smallInput} w-full`} />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                        <input type="checkbox" name="notify" defaultChecked={!r.admin_reply} className="accent-forest" /> levélben is szólok
                      </label>
                      <SubmitButton className={smallPrimary}>{r.admin_reply ? "Frissítem" : "Elküldöm"}</SubmitButton>
                    </div>
                  </form>
                </GildedCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-line pt-8">
        <form action={setEnrollmentStatus}>
          <input type="hidden" name="id" value={e.id} />
          <input type="hidden" name="close" value={e.status === "aktiv" ? "true" : "false"} />
          <p className="mb-3 text-xs text-ink-soft">
            {e.status === "aktiv"
              ? "Lezárás után a résztvevő nem éri el tovább a tananyagot és a heti beszámolót."
              : "Újranyitás után a résztvevő ismét eléri a felületet."}
          </p>
          <button className={smallButton}>{e.status === "aktiv" ? "A program lezárása" : "A program újranyitása"}</button>
        </form>
      </section>
    </div>
  );
}
