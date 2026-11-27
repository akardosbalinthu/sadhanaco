import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Circle, Lock } from "lucide-react";
import { requireMember, TRACK_LABEL } from "@/lib/member";
import { tp } from "@/lib/site";
import { MemberNav } from "@/components/member-nav";
import { CompassDivider, GildedCard } from "@/components/ornaments";
import { toggleCompletion } from "./actions";

export const metadata = { title: "Gyakorlás · Programom" };
export const dynamic = "force-dynamic";

/** A program tananyaga: Jelenlét (1.) és Tudatosság (2.), hetente nyíló anyagokkal és napi pipálással. */
export default async function PracticePage() {
  const { supabase, hasAccess, isAdmin } = await requireMember();
  if (!hasAccess && !isAdmin) redirect(tp("/program"));

  const [{ data: modules }, { data: lessons }, { data: today }] = await Promise.all([
    supabase.from("modules").select("stage, title, subtitle, total_weeks").lte("stage", 2).order("stage"),
    supabase
      .from("lessons")
      .select("id, week_number, sort_order, title, description, duration_seconds, track, modules!inner(stage)")
      .order("week_number")
      .order("sort_order"),
    supabase.rpc("budapest_today"),
  ]);
  const stages = await Promise.all(
    (modules ?? []).map(async (m) => {
      const [{ data: open }, { data: week }] = await Promise.all([
        supabase.rpc("can_access_stage", { p_stage: m.stage }),
        m.total_weeks ? supabase.rpc("current_week", { p_stage: m.stage }) : Promise.resolve({ data: null }),
      ]);
      return { ...m, open: Boolean(open), week: (week as number | null) ?? null };
    }),
  );
  const current = [...stages].reverse().find((s) => s.open && s.total_weeks) ?? stages[0];
  const { data: doneToday } = await supabase.from("lesson_completions").select("lesson_id").eq("practiced_on", today as string);
  const done = new Set((doneToday ?? []).map((d) => d.lesson_id));
  const stageLessons = (lessons ?? []).filter((l) => (l.modules as unknown as { stage: number }).stage === current?.stage);
  const week = current?.week ?? 0;
  const thisWeek = stageLessons.filter((l) => l.week_number === week);
  const earlier = stageLessons.filter((l) => l.week_number < week).sort((a, b) => b.week_number - a.week_number || a.sort_order - b.sort_order);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <MemberNav active="/gyakorlas" />

      <p className="text-xs uppercase tracking-[0.18em] text-gold">Programom · Gyakorlás</p>
      <h1 className="mt-3 font-serif text-4xl text-forest">{current?.title ?? "Tananyag"}</h1>
      {current?.subtitle && <p className="mt-2 text-ink-soft">{current.subtitle}</p>}

      <GildedCard className="mt-8 p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Az utad a programban</p>
        <ol className="mt-4 space-y-3">
          {stages.map((s) => (
            <li key={s.stage} className="flex items-start gap-3">
              {s.open ? (
                <Circle className={`mt-1 h-4 w-4 shrink-0 ${s.stage === current?.stage ? "fill-gold text-gold" : "text-gold"}`} strokeWidth={1.5} aria-hidden />
              ) : (
                <Lock className="mt-1 h-4 w-4 shrink-0 text-ink-soft/60" strokeWidth={1.5} aria-label="még nem nyílt meg" />
              )}
              <div>
                <p className={s.open ? "text-ink" : "text-ink-soft"}>{s.title}</p>
                <p className="text-xs text-ink-soft">
                  {s.subtitle}
                  {s.open && s.week ? ` · ${Math.min(s.week, s.total_weeks ?? s.week)}. hét / ${s.total_weeks}` : s.open ? "" : " · a program során nyílik meg"}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </GildedCard>

      <CompassDivider className="my-14" />

      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Gyakorlás</p>
        <h2 className="mt-2 font-serif text-3xl text-forest">{week ? `${week}. hét` : "Ezen a héten"}</h2>
        {thisWeek.length === 0 && earlier.length === 0 ? (
          <GildedCard className="mt-6 text-sm text-ink-soft">
            Ennek a hétnek az anyagai hamarosan felkerülnek. Addig a gyakorlási tervedet kövesd a Programom oldalon.
          </GildedCard>
        ) : (
          <ul className="mt-6 space-y-3">
            {[...thisWeek, ...earlier].map((l) => {
              const isDone = done.has(l.id);
              return (
                <li key={l.id}>
                  <GildedCard className="flex items-start gap-4">
                    <form action={toggleCompletion}>
                      <input type="hidden" name="lessonId" value={l.id} />
                      <button
                        className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded border transition-colors duration-300 ${
                          isDone ? "border-gold bg-gold text-paper" : "border-line hover:border-gold"
                        }`}
                        aria-label={isDone ? "A mai pipa visszavonása" : "Ma elvégeztem"}
                      >
                        {isDone && <Check className="h-4 w-4" strokeWidth={2} aria-hidden />}
                      </button>
                    </form>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-gold">
                        {TRACK_LABEL[l.track] ?? "Gyakorlás"} · {l.week_number}. hét
                        {l.duration_seconds ? ` · ${Math.round(l.duration_seconds / 60)} perc` : ""}
                      </p>
                      <h3 className="mt-1 font-serif text-lg text-forest">
                        <Link href={tp(`/gyakorlas/${l.id}`)} className="transition-colors duration-300 hover:text-gold">
                          {l.title}
                        </Link>
                      </h3>
                      {l.description && <p className="mt-1 text-sm text-ink-soft">{l.description}</p>}
                    </div>
                  </GildedCard>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
