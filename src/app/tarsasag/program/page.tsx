import Link from "next/link";
import { CalendarPlus, Video } from "lucide-react";
import { requireMember } from "@/lib/member";
import { fmtDay, fmtFull, PHASE_LABEL, type MyProgram } from "@/lib/program";
import { googleCalendarUrl } from "@/lib/calendar";
import { SITE, tp } from "@/lib/site";
import { MemberNav } from "@/components/member-nav";
import { buttonPrimary, buttonSecondary, CompassDivider, GildedCard } from "@/components/ornaments";

export const metadata = { title: "Programom · Kardos Bálint" };
export const dynamic = "force-dynamic";

export default async function MyProgramPage() {
  const { supabase, profile } = await requireMember();
  const { data } = await supabase.rpc("my_program");
  const p = data as unknown as MyProgram | null;
  const name = profile.nickname || profile.first_name;

  if (!p) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <MemberNav active="/program" />
        <GildedCard className="p-8">
          <h1 className="font-serif text-3xl text-forest">Üdv{name ? `, ${name}` : ""}!</h1>
          <p className="mt-4 text-ink-soft">
            Ehhez a fiókhoz most nem tartozik aktív program. Ha a konzultáció után megállapodtunk, hamarosan itt találod a
            programodat. Ha kérdésed van, írj nekem: {SITE.email}.
          </p>
        </GildedCard>
      </main>
    );
  }

  const [{ data: sessions }, { data: replies }] = await Promise.all([
    supabase
      .from("program_sessions")
      .select("id, starts_at, duration_minutes, status, note")
      .eq("enrollment_id", p.enrollment_id)
      .order("starts_at"),
    supabase
      .from("weekly_reports")
      .select("id, week_start, admin_reply, replied_at")
      .eq("enrollment_id", p.enrollment_id)
      .not("admin_reply", "is", null)
      .order("week_start", { ascending: false })
      .limit(1),
  ]);
  const upcoming = (sessions ?? []).filter((s) => s.status === "tervezett" && new Date(s.starts_at).getTime() + s.duration_minutes * 60_000 > Date.now());
  const done = (sessions ?? []).filter((s) => s.status === "megtartott").length;
  const total = (sessions ?? []).filter((s) => s.status !== "elmaradt").length;
  const next = p.next_session;
  const lastReply = replies?.[0];
  const monthShown = Math.min(Math.max(p.month, 1), 8);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <MemberNav active="/program" />

      <p className="text-xs uppercase tracking-[0.18em] text-gold">Programom · {PHASE_LABEL[p.phase]}</p>
      <h1 className="mt-3 font-serif text-4xl text-forest">Üdv{name ? `, ${name}` : ""}!</h1>
      <p className="mt-3 text-ink-soft">
        {p.phase === "hamarosan"
          ? `A programod kezdete: ${fmtDay(p.starts_on)}.`
          : p.phase === "lezarult"
          ? "A programod lezárult. A tananyag és a napló továbbra is itt van, amíg a hozzáférésed tart."
          : `${monthShown}. hónap a nyolcból · ${fmtDay(p.starts_on)} – ${fmtDay(p.ends_on)}`}
      </p>

      {(p.payment_paused || p.payment_overdue) && (
        <div role="status" className={`mt-6 max-w-2xl rounded-lg border px-5 py-4 text-sm ${p.payment_paused ? "border-alert/50 text-alert" : "border-gold/60 text-ink"}`}>
          {p.payment_paused
            ? "A legutóbbi részlet terhelése nem sikerült, ezért a felület szünetel. Amint a fizetés rendben van, minden visszaáll – a haladásod megmarad."
            : "A legutóbbi részlet terhelése nem sikerült. A hozzáférésed megmarad, és automatikusan újrapróbáljuk."}{" "}
          <Link href={tp("/adataim")} className="underline decoration-gold/60 underline-offset-4">A fizetési kártya frissítése</Link>
        </div>
      )}

      {p.phase !== "hamarosan" && p.phase !== "lezarult" && (
        <div className="mt-6 max-w-xl">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full bg-gold" style={{ width: `${(monthShown / 8) * 100}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-ink-soft">
            <span>1–4. hónap: tanulás és beépítés</span>
            <span>5–8. hónap: önálló integráció</span>
          </div>
        </div>
      )}

      <section className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <GildedCard ornate className="p-7">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">A következő alkalmunk</p>
          {next ? (
            <>
              <p className="mt-3 font-serif text-2xl text-forest">{fmtFull(next.starts_at)}</p>
              <p className="mt-1 text-sm text-ink-soft">{next.duration_minutes} perc · online</p>
              {next.note && <p className="mt-4 whitespace-pre-line text-sm text-ink">{next.note}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                {next.meet_url ? (
                  <a href={next.meet_url} target="_blank" rel="noopener" className={buttonPrimary}>
                    <Video className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Belépek
                  </a>
                ) : (
                  <p className="text-sm text-ink-soft">A belépő gomb a kezdés előtt 15 perccel jelenik meg itt.</p>
                )}
                <a
                  href={googleCalendarUrl({
                    uid: next.id,
                    title: "Egyéni alkalom – Kardos Bálint",
                    start: new Date(next.starts_at),
                    end: new Date(new Date(next.starts_at).getTime() + next.duration_minutes * 60_000),
                    description: "Online, Google Meeten. A belépés a Programom oldalon.",
                  })}
                  target="_blank"
                  rel="noopener"
                  className={buttonSecondary}
                >
                  <CalendarPlus className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Google Naptár
                </a>
              </div>
            </>
          ) : (
            <p className="mt-3 text-ink-soft">A következő időpontot hamarosan beírom ide.</p>
          )}
        </GildedCard>

        <GildedCard className="p-7">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Heti beszámoló</p>
          {p.report_done ? (
            <p className="mt-3 text-ink-soft">Erre a hétre már megírtad. Köszönöm!</p>
          ) : (
            <p className="mt-3 text-ink-soft">Pár sor arról, hogyan ment a gyakorlás ezen a héten. Két-három perc az egész.</p>
          )}
          <Link href={tp("/beszamolo")} className={`${p.report_done ? buttonSecondary : buttonPrimary} mt-5`}>
            {p.report_done ? "Megnézem" : "Megírom"}
          </Link>
          {lastReply?.admin_reply && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-xs uppercase tracking-[0.16em] text-gold">Legutóbbi visszajelzésem</p>
              <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-ink">{lastReply.admin_reply}</p>
            </div>
          )}
        </GildedCard>
      </section>

      <CompassDivider className="my-14" />

      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Személyre szabott gyakorlási terv</p>
        <h2 className="mt-2 font-serif text-3xl text-forest">A terved</h2>
        <GildedCard className="mt-6 p-7">
          {p.practice_plan ? (
            <p className="whitespace-pre-line leading-relaxed text-ink">{p.practice_plan}</p>
          ) : (
            <p className="text-ink-soft">A tervedet az első alkalmunk után írom meg ide.</p>
          )}
        </GildedCard>
        <Link href={tp("/gyakorlas")} className={`${buttonSecondary} mt-6`}>
          A heti tananyag és a napi gyakorlás
        </Link>
      </section>

      <CompassDivider className="my-14" />

      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Alkalmaink</p>
        <h2 className="mt-2 font-serif text-3xl text-forest">
          {total > 0 ? `${done} megtartva a ${total}-ból` : "Időpontok"}
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-ink-soft">Most nincs beírt következő időpont.</p>
        ) : (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {upcoming.slice(0, 8).map((s) => (
              <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <span className="text-ink">{fmtFull(s.starts_at)}</span>
                <span className="text-sm text-ink-soft">{s.duration_minutes} perc</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-ink-soft">Ha egy időpont nem jó, írj nekem: {SITE.email}.</p>
      </section>
    </main>
  );
}
