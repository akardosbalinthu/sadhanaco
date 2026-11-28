import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { fmtDateTime, requireAdmin } from "@/lib/admin";
import { googleCalendarUrl } from "@/lib/calendar";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { addSlots, cancelBooking, deleteSlot, saveConsultationSettings, setSlotMeet } from "../program-actions";
import { SubmitButton } from "../submit-button";
import { Empty, Flash, H2, label, smallButton, smallInput, smallPrimary, type SP } from "../ui";

export const dynamic = "force-dynamic";

export default async function SlotsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const since = new Date(Date.now() - 12 * 3600_000).toISOString();
  const [{ data: settings }, { data: slots }] = await Promise.all([
    supabase.from("app_settings").select("consultation_meet_url, consultation_default_minutes").single(),
    supabase
      .from("consultation_slots")
      .select("id, starts_at, duration_minutes, meet_url, application_id, applications(full_name, email)")
      .gte("starts_at", since)
      .order("starts_at")
      .limit(300),
  ]);
  const defMin = settings?.consultation_default_minutes ?? 55;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-14">
      <Flash sp={sp} />

      <section>
        <H2>Konzultációs időpontok</H2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Itt adod meg, mikor érsz rá ismerkedő konzultációra. A minősített jelentkezők a következő 60 nap szabad
          időpontjai közül választhatnak (a két órán belülieket már nem látják).
        </p>
        <GildedCard className="mt-6 p-6">
          <form action={addSlots} className="grid gap-4 sm:grid-cols-3">
            <label className="block"><span className={label}>Nap</span><input name="day" type="date" min={today} required className={`${smallInput} mt-1 w-full`} /></label>
            <label className="block"><span className={label}>Kezdés</span><input name="from" type="time" required className={`${smallInput} mt-1 w-full`} /></label>
            <label className="block"><span className={label}>Vége (több időponthoz)</span><input name="to" type="time" className={`${smallInput} mt-1 w-full`} /></label>
            <label className="block"><span className={label}>Hossz (perc)</span><input name="minutes" type="number" min={10} max={180} defaultValue={defMin} className={`${smallInput} mt-1 w-full`} /></label>
            <label className="block"><span className={label}>Szünet közöttük (perc)</span><input name="gap" type="number" min={0} max={120} defaultValue={15} className={`${smallInput} mt-1 w-full`} /></label>
            <label className="block"><span className={label}>Ismétlés hetente (alkalom)</span><input name="repeat_weeks" type="number" min={1} max={12} defaultValue={1} className={`${smallInput} mt-1 w-full`} /></label>
            <p className="text-xs text-ink-soft sm:col-span-3">
              Példa: kedd 9:00–13:00, 55 perc, 5 perc szünet, 4 hétig → minden kedden 9:00, 10:00, 11:00 és 12:00.
              Ha a „Vége” üres, egyetlen időpont készül.
            </p>
            <div className="sm:col-span-3"><SubmitButton className={smallPrimary}>Időpontok felvétele</SubmitButton></div>
          </form>
        </GildedCard>
      </section>

      <section>
        <H2>Közelgő időpontok</H2>
        {(slots ?? []).length === 0 ? (
          <Empty>Nincs felvett időpont.</Empty>
        ) : (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {slots!.map((s) => {
              const app = s.applications as unknown as { full_name: string; email: string } | null;
              const meet = s.meet_url ?? settings?.consultation_meet_url ?? undefined;
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-ink">{fmtDateTime(s.starts_at)} <span className="text-xs text-ink-soft">· {s.duration_minutes} perc</span></p>
                    {app ? (
                      <p className="text-sm text-forest">
                        Foglalt: <Link href={tp(`/admin/jelentkezesek/${s.application_id}`)} className="underline decoration-gold/60 underline-offset-4">{app.full_name}</Link>
                      </p>
                    ) : (
                      <p className="text-xs text-ink-soft">Szabad</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {app && (
                      <a
                        href={googleCalendarUrl({
                          uid: `konzultacio-${s.id}`,
                          title: `Ismerkedő konzultáció – ${app.full_name}`,
                          start: new Date(s.starts_at),
                          end: new Date(new Date(s.starts_at).getTime() + s.duration_minutes * 60_000),
                          description: `Jelentkező: ${app.full_name} (${app.email})`,
                          url: meet,
                        })}
                        target="_blank"
                        rel="noopener"
                        className={smallButton}
                        title="Google Naptár"
                      >
                        <CalendarPlus className="inline h-3.5 w-3.5" strokeWidth={1.5} aria-label="Google Naptár" />
                      </a>
                    )}
                    <form action={setSlotMeet} className="flex gap-1">
                      <input type="hidden" name="id" value={s.id} />
                      <input name="meet_url" defaultValue={s.meet_url ?? ""} placeholder="saját Meet-link" className={`${smallInput} w-44`} />
                      <button className={smallButton}>Ment</button>
                    </form>
                    {app ? (
                      <form action={cancelBooking} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={s.id} />
                        <label className="flex items-center gap-1 text-xs text-ink-soft">
                          <input type="checkbox" name="notify" defaultChecked className="accent-forest" /> levél neki
                        </label>
                        <button className={smallButton}>Foglalás lemondása</button>
                      </form>
                    ) : (
                      <form action={deleteSlot}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className={smallButton}>Törlés</button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <H2>Beállítások</H2>
        <form action={saveConsultationSettings} className="mt-5 grid max-w-2xl gap-4 sm:grid-cols-[1fr_auto]">
          <label className="block">
            <span className={label}>Alapértelmezett Meet-link a konzultációkhoz</span>
            <input name="meet_url" type="url" defaultValue={settings?.consultation_meet_url ?? ""} placeholder="https://meet.google.com/…" className={`${smallInput} mt-1 w-full`} />
          </label>
          <label className="block">
            <span className={label}>Alap hossz (perc)</span>
            <input name="minutes" type="number" min={10} max={180} defaultValue={defMin} className={`${smallInput} mt-1 w-28`} />
          </label>
          <p className="text-xs text-ink-soft sm:col-span-2">
            Ha megadsz egy állandó Meet-linket, a jelentkező a visszaigazoló levélben megkapja. Időpontonként felülírhatod.
          </p>
          <div><SubmitButton className={smallPrimary}>Mentés</SubmitButton></div>
        </form>
      </section>
    </div>
  );
}
