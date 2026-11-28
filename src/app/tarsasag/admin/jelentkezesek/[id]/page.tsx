import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { fmtDateTime, requireAdmin } from "@/lib/admin";
import { APP_STATUS_LABEL, HEARD_FROM, INVEST_LABEL, lifestyleMap, PILLARS, QUESTIONS, RATING_LABELS, START_LABEL, type Answers } from "@/lib/application";
import { LifestyleRadar } from "@/components/lifestyle-map";
import { googleCalendarUrl } from "@/lib/calendar";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { createPaymentOffer, deleteApplication, enrollParticipant, revokePaymentOffer, setApplicationStatus } from "../../program-actions";
import { PROGRAM_PLAN_LABEL } from "@/lib/program-payment";
import { publicEnv } from "@/lib/env";
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
  const answers = a.answers ? (a.answers as unknown as Answers) : null;
  const map = answers ? lifestyleMap(answers) : null;
  const meet = slot?.meet_url ?? settings?.consultation_meet_url ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const { data: offers } = await supabase
    .from("program_payment_offers")
    .select("id, token, starts_on, status, plan, created_at, paid_at")
    .eq("application_id", id)
    .order("created_at", { ascending: false });
  const site = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const OFFER_STATUS: Record<string, string> = { kikuldve: "Kiküldve, fizetésre vár", fizetve: "Fizetve", visszavonva: "Visszavonva" };

  return (
    <div className="space-y-12">
      <Flash sp={sp} />
      <div>
        <Link href={tp("/admin/jelentkezesek")} className="text-sm text-ink-soft hover:text-gold">← Jelentkezések</Link>
        <h1 className="mt-3 font-serif text-3xl text-forest">{a.full_name}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          <a href={`mailto:${a.email}`} className="underline decoration-gold/50 underline-offset-4">{a.email}</a>
          {a.phone ? ` · ${a.phone}` : ""} · kitöltve: {fmtDateTime(a.created_at)}
          {a.heard_from ? ` · honnan hallott rólam: ${HEARD_FROM[a.heard_from as keyof typeof HEARD_FROM] ?? a.heard_from}` : ""}
          {a.utm_source ? ` · link forrása: ${a.utm_source}` : ""}
        </p>
        <p className="mt-2 text-sm">
          <span className={a.qualified ? "text-forest" : "text-ink-soft"}>{a.questionnaire_version === 2 ? `„Most van itt az ideje?” ${a.start_score}/10` : START_LABEL[a.start_when ?? ""]}</span>
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
                  title: `Ismerkedő konzultáció – ${a.full_name}`,
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

      {a.questionnaire_version === 2 && map && answers ? (
        <>
          <section>
            <H2>Életmód-térkép</H2>
            <div className="mt-5 grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
              <GildedCard className="p-4">
                <LifestyleRadar values={map.pillars.map((p) => ({ name: p.name, value: p.value }))} className="mx-auto w-full max-w-md" />
                <p className="mt-2 text-center text-sm text-ink-soft">
                  Befelé {map.inward.toLocaleString("hu-HU")} · Kifelé {map.outward.toLocaleString("hu-HU")}
                </p>
              </GildedCard>
              <div className="space-y-3 text-sm">
                <p><span className="text-ink-soft">Erősség:</span> <span className="text-forest">{map.strongest.name}</span></p>
                {map.weakest && <p><span className="text-ink-soft">Következő lépés:</span> <span className="text-forest">{map.weakest.name}</span></p>}
                {a.problem && (
                  <div className="rounded-lg bg-paper-deep/70 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-gold">Mi hozott ide?</p>
                    <p className="mt-2 whitespace-pre-line text-ink">{a.problem}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
          <section>
            <H2>A válaszok</H2>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {QUESTIONS.map((q) => (
                <li key={q.key} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                  <span className="text-ink-soft"><span className="text-gold">{q.area}</span> · {q.text}</span>
                  <span className="shrink-0 font-serif text-lg text-forest">{answers[q.key]}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-soft">
              Egészségügyi hozzájárulás: {fmtDateTime(a.health_consent_at)} (szövegváltozat: {a.health_consent_version})
            </p>
          </section>
        </>
      ) : (
        <>
      <section>
        <H2>1. rész – a hat pillér</H2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((p) => {
            const v = pillars[p.key] ?? {};
            return (
              <div key={p.key} className="rounded-lg border border-line p-4">
                <dt className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-lg text-forest">{p.title}</span>
                  <span className="text-sm text-gold">{v.rating ? `${v.rating}/5 · ${RATING_LABELS[v.rating - 1]}` : "–"}</span>
                </dt>
                {p.key === "alvas" && v.hours != null && <dd className="mt-1 text-sm text-ink">Átlagosan {v.hours} óra alvás</dd>}
                {v.note && <dd className="mt-1 whitespace-pre-line text-sm text-ink-soft">{v.note}</dd>}
              </div>
            );
          })}
        </dl>
      </section>

      <section>
        <H2>2. rész – helyzet és szándék</H2>
        <GildedCard className="mt-5 space-y-4 p-6">
          <p className="whitespace-pre-line text-ink">{a.problem}</p>
          <dl className="grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
            <div><dt className="text-ink-soft">Mennyire nehezíti</dt><dd className="text-forest">{a.severity}/10</dd></div>
            <div><dt className="text-ink-soft">Mennyire égető</dt><dd className="text-forest">{a.urgency}/10</dd></div>
            <div><dt className="text-ink-soft">Mikor kezdené</dt><dd className="text-forest">{START_LABEL[a.start_when ?? ""]}</dd></div>
            <div><dt className="text-ink-soft">Pénzt</dt><dd className="text-forest">{INVEST_LABEL[a.invest_money ?? ""]}</dd></div>
            <div><dt className="text-ink-soft">Időt</dt><dd className="text-forest">{INVEST_LABEL[a.invest_time ?? ""]}</dd></div>
            <div><dt className="text-ink-soft">Energiát</dt><dd className="text-forest">{INVEST_LABEL[a.invest_energy ?? ""]}</dd></div>
          </dl>
          <p className="border-t border-line pt-3 text-xs text-ink-soft">
            Egészségügyi hozzájárulás: {fmtDateTime(a.health_consent_at)} (szövegváltozat: {a.health_consent_version})
          </p>
        </GildedCard>
      </section>

        </>
      )}

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
        <H2>Fizetési link</H2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          A konzultáció után innen küldöd el a fizetési linket. Az ügyfél kiválasztja a fizetés módját (egy összegben
          vagy négy havi részletben), és a Stripe-on fizet. Sikeres fizetés után a rendszer magától felveszi a
          programba a megadott kezdőnappal, és belépő linket küld neki.
        </p>
        {(offers ?? []).length > 0 && (
          <ul className="mt-5 divide-y divide-line border-y border-line text-sm">
            {offers!.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <span className={o.status === "fizetve" ? "text-forest" : "text-ink"}>{OFFER_STATUS[o.status]}</span>
                  <span className="text-ink-soft"> · kezdés: {o.starts_on}{o.plan ? ` · ${PROGRAM_PLAN_LABEL[o.plan]}` : ""} · küldve: {fmtDateTime(o.created_at)}</span>
                </span>
                {o.status === "kikuldve" && (
                  <span className="flex flex-wrap items-center gap-2">
                    <a href={`${site}/fizetes?t=${o.token}`} target="_blank" rel="noopener" className={smallButton}>A link</a>
                    <form action={revokePaymentOffer}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="from" value={`/jelentkezesek/${a.id}`} />
                      <button className={smallButton}>Visszavonás</button>
                    </form>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {!enrollment && (
          <form action={createPaymentOffer} className="mt-5 grid gap-4 sm:grid-cols-3">
            <input type="hidden" name="application_id" value={a.id} />
            <label className="block"><span className={label}>Név</span><input name="full_name" defaultValue={a.full_name} required className={`${smallInput} mt-1 w-full`} /></label>
            <label className="block"><span className={label}>E-mail</span><input name="email" type="email" defaultValue={a.email} required className={`${smallInput} mt-1 w-full`} /></label>
            <label className="block"><span className={label}>A program kezdőnapja</span><input name="starts_on" type="date" defaultValue={today} min={today} required className={`${smallInput} mt-1 w-full`} /></label>
            <div className="sm:col-span-3"><SubmitButton className={smallPrimary}>Fizetési linket küldök</SubmitButton></div>
          </form>
        )}
      </section>

      <section>
        <H2>Felvétel a programba kézzel</H2>
        <p className="mt-2 text-sm text-ink-soft">Csak ha a fizetés nem a rendszeren keresztül történt (például átutalással).</p>
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
              Ha megadod az első alkalmat, a rendszer beütemezi a 16 heti, 60 perces
              alkalmat ugyanabban az órában; később egyenként módosíthatod őket. A résztvevő üdvözlő levelet kap belépő linkkel.
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
