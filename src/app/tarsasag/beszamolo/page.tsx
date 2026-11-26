import { redirect } from "next/navigation";
import { requireMember } from "@/lib/member";
import { fmtDay, type MyProgram } from "@/lib/program";
import { tp } from "@/lib/site";
import { MemberNav } from "@/components/member-nav";
import { buttonPrimary, GildedCard, inputClass, PageHeader } from "@/components/ornaments";
import { submitReport } from "./actions";

export const metadata = { title: "Heti beszámoló · Programom" };
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function WeeklyReportPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireMember();
  const { data } = await supabase.rpc("my_program");
  const p = data as unknown as MyProgram | null;
  if (!p || !p.started || p.status !== "aktiv") redirect(tp("/program"));

  const { data: reports } = await supabase
    .from("weekly_reports")
    .select("id, week_start, practice_days, went_well, was_hard, question, admin_reply, replied_at")
    .eq("enrollment_id", p.enrollment_id)
    .order("week_start", { ascending: false })
    .limit(20);
  const current = (reports ?? []).find((r) => r.week_start === p.week_start);
  const past = (reports ?? []).filter((r) => r.week_start !== p.week_start);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <MemberNav active="/beszamolo" />
      <PageHeader eyebrow={`A hét kezdete: ${fmtDay(p.week_start)}`} title="Heti beszámoló">
        <p>
          Pár sor arról, hogyan ment a gyakorlás ezen a héten. Nem kell szépen fogalmaznod: őszinte jegyzetnek szánd, nem
          dolgozatnak. Elolvasom, és visszajelzek rá.
        </p>
      </PageHeader>

      {sp.ok && <p role="status" className="mt-6 rounded-md border border-gold/50 px-4 py-3 text-sm text-forest">Köszönöm, megkaptam.</p>}
      {typeof sp.hiba === "string" && <p role="alert" className="mt-6 rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">{sp.hiba}</p>}

      <GildedCard className="mt-8 p-7">
        <form action={submitReport} className="space-y-6">
          <fieldset>
            <legend className="font-serif text-lg text-forest">Hány napon gyakoroltál ezen a héten?</legend>
            <div className="mt-3 grid grid-cols-8 gap-2">
              {Array.from({ length: 8 }, (_, n) => (
                <label
                  key={n}
                  className="flex cursor-pointer items-center justify-center rounded-md border border-line py-2 text-sm text-ink-soft transition-colors duration-300 hover:border-gold/60 has-[:checked]:border-gold has-[:checked]:bg-gold-soft/30 has-[:checked]:text-forest"
                >
                  <input type="radio" name="practice_days" value={n} required defaultChecked={current?.practice_days === n} className="sr-only" />
                  {n}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="font-serif text-lg text-forest">Mi ment jól?</span>
            <textarea name="went_well" rows={3} maxLength={4000} defaultValue={current?.went_well ?? ""} className={`${inputClass} mt-2`} />
          </label>
          <label className="block">
            <span className="font-serif text-lg text-forest">Mi volt nehéz?</span>
            <textarea name="was_hard" rows={3} maxLength={4000} defaultValue={current?.was_hard ?? ""} className={`${inputClass} mt-2`} />
          </label>
          <label className="block">
            <span className="font-serif text-lg text-forest">Van kérdésed a következő alkalomig?</span>
            <textarea name="question" rows={2} maxLength={4000} defaultValue={current?.question ?? ""} className={`${inputClass} mt-2`} />
          </label>
          <button className={buttonPrimary}>{current ? "Frissítem" : "Elküldöm"}</button>
        </form>
        {current?.admin_reply && (
          <div className="mt-8 border-t border-line pt-5">
            <p className="text-xs uppercase tracking-[0.16em] text-gold">A visszajelzésem</p>
            <p className="mt-2 whitespace-pre-line text-ink">{current.admin_reply}</p>
          </div>
        )}
      </GildedCard>

      {past.length > 0 && (
        <section className="mt-14">
          <h2 className="font-serif text-2xl text-forest">Korábbi heteid</h2>
          <ul className="mt-6 space-y-4">
            {past.map((r) => (
              <li key={r.id}>
                <GildedCard>
                  <p className="text-xs uppercase tracking-[0.18em] text-gold">
                    {fmtDay(r.week_start)} · {r.practice_days} gyakorlónap
                  </p>
                  {r.went_well && <p className="mt-3 text-sm text-ink"><span className="text-ink-soft">Jól ment: </span>{r.went_well}</p>}
                  {r.was_hard && <p className="mt-1 text-sm text-ink"><span className="text-ink-soft">Nehéz volt: </span>{r.was_hard}</p>}
                  {r.question && <p className="mt-1 text-sm text-ink"><span className="text-ink-soft">Kérdés: </span>{r.question}</p>}
                  {r.admin_reply && (
                    <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-sm text-forest">{r.admin_reply}</p>
                  )}
                </GildedCard>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
