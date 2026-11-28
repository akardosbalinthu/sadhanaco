import Link from "next/link";
import { CalendarPlus, Check, Download, Video } from "lucide-react";
import { bookingInfo, consultationEvent } from "@/lib/consultation";
import { googleCalendarUrl } from "@/lib/calendar";
import { SITE } from "@/lib/site";
import { buttonPrimary, buttonSecondary, GildedCard, PageHeader } from "@/components/ornaments";
import { bookSlot } from "../actions";

export const metadata = { title: "Időpontfoglalás · Kardos Bálint", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const TZ = "Europe/Budapest";
const dayFmt = new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const fullFmt = new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, dateStyle: "full", timeStyle: "short" });

export default async function BookingPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const token = one(sp.t);
  const info = token ? await bookingInfo(token) : null;

  if (!info) {
    return (
      <main className="py-16">
        <PageHeader eyebrow="Időpontfoglalás" title="Ez a link nem érvényes.">
          <p>Lehet, hogy elírás történt, vagy a jelentkezés már nem érhető el. Kérlek, jelentkezz újra.</p>
        </PageHeader>
        <Link href="/konzultacio" className={`${buttonPrimary} mt-8`}>
          Foglalj konzultációt
        </Link>
      </main>
    );
  }

  const first = info.full_name.split(/\s+/).slice(-1)[0];

  if (!info.qualified) {
    return (
      <main className="py-16">
        <PageHeader eyebrow="Időpontfoglalás" title={`Köszönöm, ${first}!`}>
          <p>
            Most még nem kezdenéd el a programot, ezért konzultációs időpontot ezen a linken nem lehet foglalni. Addig is
            szeretettel várlak egy Nyílt Meditációs Esten. Ha eljött az ideje, töltsd ki újra a kérdőívet.
          </p>
        </PageHeader>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/nyilt-estek" className={buttonPrimary}>Közelgő Nyílt Estek</Link>
          <Link href="/jelentkezes" className={buttonSecondary}>Újra kitöltöm a kérdőívet</Link>
        </div>
      </main>
    );
  }

  if (info.booked) {
    const ev = consultationEvent(info)!;
    return (
      <main className="py-16">
        <PageHeader eyebrow="Időpontfoglalás" title={one(sp.ok) ? "Lefoglaltad az időpontot." : "Már van időpontod."}>
          <p className="font-serif text-xl text-ink">
            {fullFmt.format(new Date(info.booked.starts_at))} · {info.booked.duration_minutes} perc · online
          </p>
          <p>
            A visszaigazolást e-mailben is elküldtem{info.booked.meet_url ? ", benne a belépő linkkel" : "; a belépő linket a konzultáció előtt küldöm"}.
            Ha mégsem jó az időpont, válaszolj a levelemre, vagy írj nekem: {SITE.email}.
          </p>
        </PageHeader>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={googleCalendarUrl(ev)} target="_blank" rel="noopener" className={buttonPrimary}>
            <CalendarPlus className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Hozzáadom a Google Naptárhoz
          </a>
          <a href={`/jelentkezes/idopont/naptar.ics?t=${token}`} className={buttonSecondary}>
            <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Naptárfájl (.ics)
          </a>
          {info.booked.meet_url && (
            <a href={info.booked.meet_url} target="_blank" rel="noopener" className={buttonSecondary}>
              <Video className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Belépő link
            </a>
          )}
        </div>
        <p className="mt-10 max-w-2xl text-ink-soft">
          A válaszaidat átolvasom a konzultáció előtt. Neked semmire nem kell készülnöd: elég, ha egy nyugodt, csendes
          helyről csatlakozol.
        </p>
      </main>
    );
  }

  // Szabad időpontok napok szerint
  const byDay = new Map<string, typeof info.slots>();
  for (const s of info.slots) {
    const k = dayFmt.format(new Date(s.starts_at));
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }

  return (
    <main className="py-16">
      <PageHeader eyebrow="Időpontfoglalás" title={`Köszönöm, ${first}! Válassz időpontot.`}>
        <p>
          Az ismerkedő konzultáció ingyenes, és online, Google Meeten zajlik. Beszélünk arról, hol tartasz, mit
          szeretnél, és hogy a program jó választás-e neked. Itt beszéljük meg a részleteket és a díjat is.
        </p>
      </PageHeader>

      {one(sp.hiba) && (
        <p role="alert" className="mt-8 max-w-2xl rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">{one(sp.hiba)}</p>
      )}

      {info.slots.length === 0 ? (
        <GildedCard className="mt-10 max-w-2xl text-ink-soft">
          Most nincs szabad időpont. A levélben kapott linken később is foglalhatsz; ha sürgős, írj nekem: {SITE.email}.
        </GildedCard>
      ) : (
        <div className="mt-10 max-w-3xl space-y-8">
          {[...byDay.entries()].map(([day, slots]) => (
            <section key={day}>
              <h2 className="font-serif text-xl capitalize text-forest">{day}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {slots.map((s) => (
                  <form key={s.id} action={bookSlot}>
                    <input type="hidden" name="t" value={token} />
                    <input type="hidden" name="slot" value={s.id} />
                    <button className="inline-flex items-center gap-2 rounded-md border border-forest/40 px-4 py-2 text-forest transition-colors duration-300 hover:border-forest hover:bg-paper-deep">
                      <Check className="h-3.5 w-3.5 text-gold" strokeWidth={2} aria-hidden />
                      {timeFmt.format(new Date(s.starts_at))}
                      <span className="text-xs text-ink-soft">· {s.duration_minutes} perc</span>
                    </button>
                  </form>
                ))}
              </div>
            </section>
          ))}
          <p className="text-sm text-ink-soft">Az időpontok budapesti idő szerint értendők. Egy kattintással lefoglalod.</p>
        </div>
      )}
    </main>
  );
}
