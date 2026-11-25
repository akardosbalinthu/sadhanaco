import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { fmtDateTime, requireAdmin } from "@/lib/admin";
import { APP_STATUS_LABEL, INVEST_LABEL, PILLARS, RATING_LABELS, START_LABEL } from "@/lib/application";
import { googleCalendarUrl } from "@/lib/calendar";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { deleteApplication, enrollParticipant, setApplicationStatus } from "../../program-actions";
import { SubmitButton } from "../../submit-button";
import { Flash, H2, label, smallButton, smallInput, smallPrimary, type SP } from "../../ui";

export const dynamic = "force-dynamic";

type Pillars = Record<string, { rating?: number; note?: string; hours?: number }>;

export default async function ApplicationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: a }, { data: slot }, { data: settings }] = await Promise.all([
    supabase.from("applications").select("*").eq("id", id).maybeSingle(),
    supabase.from("consultation_slots").select("id, starts_at, duration_minutes, meet_url").eq("application_id", id).maybeSingle(),
    supabase.from("app_settings").select("consultation_meet_url").single(),
  ]);
  if (!a) notFound();
  const { data: enrollment } = await supabase.from("program_enrollments").select("id").eq("application_id", id).maybeSingle();
  const pillars = (a.pillars ?? {}) as Pillars;
  const meet = slot?.meet_url ?? settings?.consultation_meet_url ?? null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-12">
      <Flash sp={sp} />
      <div>
        <Link href={tp("/admin/jelentkezesek")} className="text-sm text-ink-soft hover:text-gold">← Jelentkezések</Link>
        <h1 className="mt-3 font-serif text-3xl text-forest">{a.full_name}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          <a href={`mailto:${a.email}`} className="underline decoration-gold/50 underline-offset-4">{a.email}</a>
          {a.phone ? ` · ${a.phone}` : ""} · kitöltve: {fmtDateTime(a.created_at)}
        </p>
        <p className="mt-2 text-sm">
          <span className={a.qualified ? "text-forest" : "text-ink-soft"}>{START_LABEL[a.start_when]}</span>
          <span className="text-ink-soft"> · {APP_STATUS_LABEL[a.status]}</span>
        </p>
      </div>

      <GildedCard ornate className="p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Konzultáció</p>
        {slot ? (
          <>
            <p className="mt-2 font-serif text-xl text-forest">{fmtDateTime(slot.starts_at)} · {slot.duration_minutes} perc</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={googleCalendarUrl({
                  uid: `konzultacio-${slot.id}`,
                  title: `Ismerkedő konzultáció — ${a.full_name}`,
                  start: new Date(slot.starts_at),
                  end: new Date(new Date(slot.starts_at).getTime() + slot.duration_minutes * 60_000),
                  description: `Jelentkező: ${a.full_name} (${a.email})`,
                  url: meet ?? undefined,
                })}
                target="_blank"
                rel="noopener"
                className={smallPrimary}
              >
                <CalendarPlus className="mr-1 inline h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Beteszem a Google Naptáramba
              </a>
              {meet && <a href={meet} target="_blank" rel="noopener" className={smallButton}>Meet-link</a>}
              <Link href={tp("/admin/idopontok")} className={smallButton}>Időpontok kezelése</Link>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">{a.qualified ? "Még nem foglalt időpontot." : "Nem foglalhat (nem azonnal kezdene)."}</p>
        )}
      </GildedCard>

      <section>
        <H2>1. rész — a hat pillér</H2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((p) => {
            const v = pillars[p.key] ?? {};
            return (
              <div key={p.key} className="rounded-lg border border-line p-4">
                <dt className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-lg text-forest">{p.title}</span>
                  <span className="text-sm text-gold">{v.rating ? `${v.rating}/5 · ${RATING_LABELS[v.rating - 1]}` : "—"}</span>
                </dt>
                {p.key === "alvas" && v.hours != null && <dd className="mt-1 text-sm text-ink">Átlagosan {v.hours} óra alvás</dd>}
                {v.note && <dd className="mt-1 whitespace-pre-line text-sm text-ink-soft">{v.note}</dd>}
              </div>
            );
          })}
        </dl>
      </section>

      <section>
        <H2>2. rész — helyzet és szándék</H2>
        <GildedCard className="mt-5 space-y-4 p-6">
          <p className="whitespace-pre-line text-ink">{a.problem}</p>
          <dl className="grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
            <div><dt className="text-ink-soft">Mennyire nehezíti</dt><dd className="text-forest">{a.severity}/10</dd></div>
            <div><dt className="text-ink-soft">Mennyire égető</dt><dd className="text-forest">{a.urgency}/10</dd></div>
            <div><dt className="text-ink-soft">Mikor kezdené</dt><dd className="text-forest">{START_LABEL[a.start_when]}</dd></div>
            <div><dt className="text-ink-soft">Pénzt</dt><dd className="text-forest">{INVEST_LABEL[a.invest_money]}</dd></div>
            <div><dt className="text-ink-soft">Időt</dt><dd className="text-forest">{INVEST_LABEL[a.invest_time]}</dd></div>
            <div><dt className="text-ink-soft">Energiát</dt><dd className="text-forest">{INVEST_LABEL[a.invest_energy]}</dd></div>
          </dl>
          <p className="border-t border-line pt-3 text-xs text-ink-soft">
            Egészségügyi hozzájárulás: {fmtDateTime(a.health_consent_at)} (szövegváltozat: {a.health_consent_version})
          </p>
        </GildedCard>
      </section>

      <section>
        <H2>Állapot és jegyzet</H2>
        <form action={setApplicationStatus} className="mt-5 space-y-4">
          <input type="hidden" name="id" value={a.id} />
          <label className="block max-w-xs">
            <span className={label}>Állapot</span>
            <select name="status" defaultValue={a.status} className={`${smallInput} mt-1 w-full`}>
              {Object.entries(APP_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={label}>Saját jegyzet (csak te látod)</span>
            <textarea name="admin_note" rows={4} defaultValue={a.admin_note ?? ""} className={`${smallInput} mt-1 w-full`} />
          </label>
          <SubmitButton className={smallPrimary}>Mentés</SubmitButton>
        </form>
      </section>

      <section>
        <H2>Felvétel a programba</H2>
        {enrollment ? (
          <p className="mt-3 text-sm text-ink-soft">
            Már résztvevő. <Link href={tp(`/admin/resztvevok/${enrollment.id}`)} className="text-forest underline decoration-gold/60 underline-offset-4">A programja</Link>
          </p>
        ) : (
          <form action={enrollParticipant} className="mt-5 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="application_id" value={a.id} />
            <label className="block"><span className={label}>Név</span><input name="full_name" defaultValue={a.full_name} required className={`${smallInput} mt-1 w-full`} /></label>
            <label className="block"><span className={label}>E-mail (ezzel lép be)</span><input name="email" type="email" defaultValue={a.email} required className={`${smallInput} mt-1 w-full`} /></label>
            <label className="block"><span className={label}>A program kezdőnapja</span><input name="starts_on" type="date" defaultValue={today} required className={`${smallInput} mt-1 w-full`} /></label>
            <label className="block"><span className={label}>Az első alkalom (nem kötelező)</span><input name="first_session" type="datetime-local" className={`${smallInput} mt-1 w-full`} /></label>
            <label className="block sm:col-span-2"><span className={label}>Állandó Meet-link (nem kötelező)</span><input name="meet_url" type="url" placeholder="https://meet.google.com/…" className={`${smallInput} mt-1 w-full`} /></label>
            <p className="text-xs text-ink-soft sm:col-span-2">
              Ha megadod az első alkalmat, a rendszer beütemezi a heti (1–4. hónap, 60 perc) és a havi (5–8. hónap, 45 perc)
              alkalmakat ugyanabban az órában; később egyenként módosíthatod őket. A résztvevő üdvözlő levelet kap belépő linkkel.
            </p>
            <div className="sm:col-span-2"><SubmitButton className={smallPrimary}>Felveszem résztvevőnek</SubmitButton></div>
          </form>
        )}
      </section>

      <section className="border-t border-line pt-8">
        <form action={deleteApplication}>
          <input type="hidden" name="id" value={a.id} />
          <p className="mb-3 text-xs text-ink-soft">Ha valaki visszavonja a hozzájárulását, itt törölheted a felmérését (visszavonhatatlan).</p>
          <button className={smallButton}>A jelentkezés végleges törlése</button>
        </form>
      </section>
    </div>
  );
}
