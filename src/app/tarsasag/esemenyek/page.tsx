import Link from "next/link";
import { CalendarDays, CalendarPlus, Check, MapPin, Monitor, PlayCircle, Radio } from "lucide-react";
import { tp } from "@/lib/site";
import { requireMember } from "@/lib/member";
import { EVENT_KIND_LABEL } from "@/lib/admin";
import { MemberNav } from "@/components/member-nav";
import { buttonPrimary, buttonSecondary, GildedCard, inputClass } from "@/components/ornaments";
import { RegistrationDetailsFields } from "@/components/registration-details-fields";
import { bookEvent, cancelInvitation, cancelRegistration, castVote, inviteGuest, payRegistration } from "./actions";

export const metadata = { title: "Események · A Társaság", robots: { index: false, follow: false } };

type SP = Promise<Record<string, string | string[] | undefined>>;
const TZ = "Europe/Budapest";
const dayFmt = new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, month: "long", day: "numeric", weekday: "long" });
const timeFmt = new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const shortFmt = new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
const huf = (n: number) => (n === 0 ? "díjmentes" : `${new Intl.NumberFormat("hu-HU", { useGrouping: "always" }).format(n)} Ft`);

export default async function EventsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase, profile, hasAccess, isAdmin } = await requireMember();
  if (!hasAccess && !isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <MemberNav active="/esemenyek" />
        <GildedCard className="text-sm text-ink-soft">Az események A Társaság aktív tagjainak érhetők el.</GildedCard>
      </main>
    );
  }
  const now = new Date();
  const trial = profile.subscription_status === "trialing";
  const tier = profile.tier === "belso_kor" ? "belso_kor" : "tarsasagi";

  const LIVE_LEAD_MS = 15 * 60_000;
  const endOf = (e: { starts_at: string; ends_at: string | null }) =>
    e.ends_at ? new Date(e.ends_at) : new Date(new Date(e.starts_at).getTime() + 3 * 3600_000);
  const [{ data: upcoming }, { data: regs }, { data: invites }, { data: settings }, { data: polls }, { data: recordings }] = await Promise.all([
    // A már elkezdődött (élő) alkalmak is látszanak, amíg véget nem érnek.
    supabase.from("events").select("*").gte("starts_at", new Date(now.getTime() - 6 * 3600_000).toISOString()).is("cancelled_at", null).eq("is_published", true).order("starts_at").limit(40),
    supabase.from("event_registrations").select("id, event_id, status, hold_expires_at, price_huf").eq("user_id", profile.id).neq("status", "cancelled"),
    supabase.from("event_invitations").select("id, event_id, guest_name, status").eq("invited_by", profile.id).neq("status", "cancelled"),
    supabase.from("app_settings").select("belso_kor_priority_hours, hike_guest_invites_per_member").single(),
    supabase.from("destination_polls").select("*").order("month", { ascending: false }).limit(1),
    supabase
      .from("events")
      .select("id, title, kind, starts_at")
      .eq("is_published", true)
      .not("recording_bunny_id", "is", null)
      .lt("starts_at", now.toISOString())
      .order("starts_at", { ascending: false })
      .limit(12),
  ]);
  const events = (upcoming ?? []).filter((e) => endOf(e) > now);
  const regBy = new Map((regs ?? []).map((r) => [r.event_id, r]));
  // A telefonszámot az előző jelentkezésből előre kitöltjük (ha még nem törlődött).
  const { data: lastWithPhone } = await supabase
    .from("event_registrations")
    .select("phone")
    .eq("user_id", profile.id)
    .not("phone", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastPhone = lastWithPhone?.phone ?? "";
  const priorityHours = settings?.belso_kor_priority_hours ?? 48;
  const guestLimit = settings?.hike_guest_invites_per_member ?? 2;

  const poll = polls?.[0];
  const pollOpen = poll && !poll.winning_option_id && new Date(poll.opens_at) <= now && now < new Date(poll.closes_at);
  const [{ data: options }, { data: myVote }, { data: results }] = poll
    ? await Promise.all([
        supabase.from("destination_options").select("id, name, description").eq("poll_id", poll.id).order("name"),
        supabase.from("destination_votes").select("option_id").eq("poll_id", poll.id).eq("user_id", profile.id).maybeSingle(),
        pollOpen ? Promise.resolve({ data: null }) : supabase.rpc("destination_poll_results", { p_poll_id: poll.id }),
      ])
    : [{ data: null }, { data: null }, { data: null }];

  const ok = typeof sp.ok === "string" ? sp.ok : "";
  const hiba = typeof sp.hiba === "string" ? sp.hiba : "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <MemberNav active="/esemenyek" />
      <p className="text-xs uppercase tracking-[0.25em] text-gold">A Társaság · Események</p>
      <h1 className="mt-3 font-serif text-4xl text-forest">Együtt, élőben.</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Nyílt Estek, Gyakorlónapok, közös meditációk és a havi túra. {tier === "belso_kor"
          ? "A Belső Kör tagjaként az első 48 órában elsőbbséggel foglalhatsz."
          : "A Belső Kör tagjai az első 48 órában elsőbbséggel foglalnak; utána a fennmaradó helyekre te is jelentkezhetsz."}
      </p>
      {trial && (
        <p className="mt-3 text-sm text-ink-soft">
          A próbaidő alatt még nem tudsz eseményre jelentkezni — a próbaidő végén ez is megnyílik. Túrára vendéget már most is hívhatsz.
        </p>
      )}

      {ok && <p role="status" className="mt-6 rounded-md border border-gold/50 px-4 py-3 text-sm text-forest">{ok}</p>}
      {hiba && <p role="status" className="mt-6 rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">{hiba}</p>}

      {poll && (options ?? []).length > 0 && (
        <section id="szavazas" className="mt-10 scroll-mt-24">
          <GildedCard className="border-gold/50 p-7">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">A havi túra · szavazás</p>
            <h2 className="mt-2 font-serif text-2xl text-forest">{poll.title}</h2>
            {poll.description && <p className="mt-2 text-sm text-ink-soft">{poll.description}</p>}
            {pollOpen ? (
              <form action={castVote} className="mt-5 space-y-2">
                <input type="hidden" name="pollId" value={poll.id} />
                {options!.map((o) => (
                  <label key={o.id} className="flex cursor-pointer gap-3 rounded-md border border-line p-3 transition-colors duration-300 hover:border-gold/60 has-[:checked]:border-gold">
                    <input type="radio" name="optionId" value={o.id} defaultChecked={myVote?.option_id === o.id} className="mt-1 accent-forest" />
                    <span>
                      <span className="text-forest">{o.name}</span>
                      {o.description && <span className="block text-xs text-ink-soft">{o.description}</span>}
                    </span>
                  </label>
                ))}
                <div className="flex flex-wrap items-center gap-4 pt-3">
                  <button className={buttonPrimary}>{myVote ? "Szavazatom módosítása" : "Szavazok"}</button>
                  <p className="text-xs text-ink-soft">
                    Lezárul: {shortFmt.format(new Date(poll.closes_at))}. Az állás a lezárásig rejtett — csak a saját szavazatodat látod.
                  </p>
                </div>
              </form>
            ) : (
              <ul className="mt-5 space-y-1.5 text-sm">
                {(results ?? []).map((r) => (
                  <li key={r.option_id} className="flex gap-3">
                    <span className={r.is_winner ? "text-gold" : "text-forest"}>
                      {r.name}
                      {r.is_winner && " — ide megyünk"}
                    </span>
                    <span className="ml-auto text-ink-soft">{r.votes} szavazat</span>
                  </li>
                ))}
                {!poll.winning_option_id && <li className="text-ink-soft">A szavazás lezárult; az eredményt hamarosan kihirdetem.</li>}
              </ul>
            )}
          </GildedCard>
        </section>
      )}

      <section className="mt-10 space-y-5">
        {events.length === 0 && <GildedCard className="text-sm text-ink-soft">Most nincs kiírt alkalom. Hamarosan jönnek az újak.</GildedCard>}
        {events.map((e) => {
          const reg = regBy.get(e.id);
          const price = tier === "belso_kor" ? e.price_belso_kor_huf : e.price_tarsasagi_huf;
          const opens = new Date(e.registration_opens_at);
          const priorityEnds = new Date(opens.getTime() + priorityHours * 3600_000);
          const inPriority = e.belso_kor_priority && tier !== "belso_kor" && now < priorityEnds;
          const notOpen = now < opens;
          const closed = e.registration_closes_at ? now >= new Date(e.registration_closes_at) : false;
          const tierAllowed = (e.allowed_tiers as string[]).includes(tier);
          const holdValid = reg?.status === "pending_payment" && reg.hold_expires_at && new Date(reg.hold_expires_at) > now;
          const myInvites = (invites ?? []).filter((i) => i.event_id === e.id);
          const isHike = e.kind === "tura";
          return (
            <article key={e.id} id={`e-${e.id}`} className="scroll-mt-24">
              <GildedCard className={reg?.status === "confirmed" ? "border-gold/50" : ""}>
                <p className="text-xs uppercase tracking-[0.18em] text-gold">{EVENT_KIND_LABEL[e.kind]}</p>
                <h2 className="mt-2 font-serif text-2xl text-forest">{e.title}</h2>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" strokeWidth={1.25} aria-hidden />
                    {dayFmt.format(new Date(e.starts_at))}, {timeFmt.format(new Date(e.starts_at))}
                    {e.ends_at && `–${timeFmt.format(new Date(e.ends_at))}`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {e.is_online ? <Monitor className="h-4 w-4" strokeWidth={1.25} aria-hidden /> : <MapPin className="h-4 w-4" strokeWidth={1.25} aria-hidden />}
                    {e.is_online ? "online" : e.location ?? "a helyszínt hamarosan megírom"}
                  </span>
                  <span>{isHike ? "díjmentes, vendégeknek is" : e.donation_based ? "adomány alapú" : huf(price)}</span>
                </div>
                {e.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink">{e.description}</p>}

                <div className="mt-6 border-t border-line pt-5">
                  {e.is_online ? (
                    <LiveBlock
                      eventId={e.id}
                      open={now.getTime() >= new Date(e.starts_at).getTime() - LIVE_LEAD_MS}
                      live={now >= new Date(e.starts_at)}
                      trial={trial}
                      viewerOnly={e.kind === "qa_elo" && tier !== "belso_kor"}
                      attended={!!reg && reg.status === "confirmed"}
                    />
                  ) : reg?.status === "confirmed" ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm text-forest">
                        <Check className="h-4 w-4 text-gold" strokeWidth={2} aria-hidden /> Ott leszel — a helyed le van foglalva.
                      </p>
                      <CancelBooking registrationId={reg.id} eventId={e.id} paid={reg.price_huf > 0} />
                    </div>
                  ) : holdValid ? (
                    <div className="flex flex-wrap items-center gap-4">
                      <form action={payRegistration}>
                        <input type="hidden" name="registrationId" value={reg!.id} />
                        <button className={buttonPrimary}>Fizetés ({huf(reg!.price_huf)})</button>
                      </form>
                      <span className="text-xs text-ink-soft">A helyed {timeFmt.format(new Date(reg!.hold_expires_at!))}-ig fenntartva.</span>
                      <CancelBooking registrationId={reg!.id} eventId={e.id} paid={false} label="Mégsem kérem" />
                    </div>
                  ) : !tierAllowed ? (
                    <p className="text-sm text-ink-soft">
                      {e.kind === "qa_elo"
                        ? "Élőben A Belső Kör tagjai vehetnek részt és kérdezhetnek; a felvételt utána mindenki megkapja."
                        : "Erre az alkalomra a jelenlegi tagságoddal nem lehet jelentkezni."}
                    </p>
                  ) : closed ? (
                    <p className="text-sm text-ink-soft">A jelentkezés lezárult.</p>
                  ) : notOpen ? (
                    <p className="text-sm text-ink-soft">A jelentkezés {shortFmt.format(opens)}-kor nyílik.</p>
                  ) : inPriority ? (
                    <p className="text-sm text-ink-soft">
                      A Belső Kör elsőbbségi foglalása {shortFmt.format(priorityEnds)}-ig tart; utána a fennmaradó helyekre te is jelentkezhetsz.
                    </p>
                  ) : (
                    <details className="group">
                      <summary className={`${buttonPrimary} cursor-pointer list-none ${trial ? "pointer-events-none opacity-60" : ""}`}>
                        {isHike ? "Jövök" : "Jelentkezem"}
                      </summary>
                      <form action={bookEvent} className="mt-5 space-y-4">
                        <input type="hidden" name="eventId" value={e.id} />
                        <RegistrationDetailsFields phone={lastPhone} />
                        <div className="flex flex-wrap items-center gap-4">
                          <button disabled={trial} className={buttonPrimary}>
                            {price > 0 && !isHike ? `Jelentkezem és fizetek (${huf(price)})` : "Jelentkezés elküldése"}
                          </button>
                          {e.capacity && <span className="text-xs text-ink-soft">Korlátozott létszám.</span>}
                        </div>
                      </form>
                    </details>
                  )}
                  <a
                    href={tp(`/esemenyek/${e.id}/naptar.ics`)}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink-soft underline decoration-gold/50 underline-offset-4 hover:text-gold"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden /> Naptárba teszem
                  </a>

                  {isHike && (
                    <div className="mt-6">
                      <p className="text-sm text-forest">Vendéget hívnál?</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        Társaságon kívülieket is hívhatsz — túránként legfeljebb {guestLimit} főt. Nekik is díjmentes; e-mailben kapják a meghívót.
                      </p>
                      {myInvites.length > 0 && (
                        <ul className="mt-3 space-y-1 text-sm">
                          {myInvites.map((i) => (
                            <li key={i.id} className="flex flex-wrap items-center gap-x-3 text-ink-soft">
                              <span>
                                {i.guest_name} — {i.status === "accepted" ? <span className="text-gold">elfogadta</span> : "meghívva"}
                              </span>
                              <form action={cancelInvitation}>
                                <input type="hidden" name="invitationId" value={i.id} />
                                <input type="hidden" name="eventId" value={e.id} />
                                <button className="text-xs text-ink-soft underline decoration-gold/50 underline-offset-4 hover:text-gold">Visszavonom</button>
                              </form>
                            </li>
                          ))}
                        </ul>
                      )}
                      {myInvites.length < guestLimit && (
                        <form action={inviteGuest} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                          <input type="hidden" name="eventId" value={e.id} />
                          <input name="guest_name" required maxLength={120} placeholder="A vendég neve" className={inputClass} />
                          <input name="guest_email" required type="email" placeholder="E-mail-címe" className={inputClass} />
                          <button className={buttonSecondary}>Meghívom</button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </GildedCard>
            </article>
          );
        })}
      </section>

      {(recordings ?? []).length > 0 && (
        <section id="felvetelek" className="mt-16 scroll-mt-24">
          <h2 className="font-serif text-2xl text-forest">Felvételek</h2>
          <p className="mt-2 text-sm text-ink-soft">A korábbi élő alkalmak — ha valamelyikről lemaradtál, itt visszanézheted.</p>
          <ul className="mt-5 space-y-2">
            {recordings!.map((r) => (
              <li key={r.id}>
                <Link
                  href={tp(`/esemenyek/${r.id}/felvetel`)}
                  className="flex items-center gap-3 rounded-md border border-line px-4 py-3 text-sm transition-colors duration-300 hover:border-gold/60"
                >
                  <PlayCircle className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} aria-hidden />
                  <span className="text-forest">{r.title}</span>
                  <span className="ml-auto text-xs text-ink-soft">
                    {EVENT_KIND_LABEL[r.kind]} · {shortFmt.format(new Date(r.starts_at))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

/** Online alkalom: előre jelentkezni nem kell; a kezdés előtt 15 perccel nyílik a belépés. */
function LiveBlock({
  eventId,
  open,
  live,
  trial,
  viewerOnly,
  attended,
}: {
  eventId: string;
  open: boolean;
  live: boolean;
  trial: boolean;
  viewerOnly: boolean;
  attended: boolean;
}) {
  if (trial) return <p className="text-sm text-ink-soft">Az élő alkalmak a próbaidő után nyílnak meg.</p>;
  const note = viewerOnly ? " Élőben nézheted és hallgathatod; kérdezni a Belső Kör tagjai tudnak." : "";
  if (!open) {
    return (
      <p className="flex items-start gap-2 text-sm text-ink-soft">
        <Radio className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} aria-hidden />
        <span>
          Élőben, itt A Társaság felületén. Előre jelentkezni nem kell — a belépés a kezdés előtt 15 perccel nyílik.{note}
        </span>
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Link href={tp(`/esemenyek/${eventId}/elo`)} className={buttonPrimary}>
        {live ? "Belépés — most zajlik" : "Belépés az élő alkalomra"}
      </Link>
      <span className="text-xs text-ink-soft">
        {attended ? "Már bent voltál — bármikor visszaléphetsz." : "Némítva érkezel; a kamera választható."}
        {note}
      </span>
    </div>
  );
}

/** Lemondás megerősítéssel (egy véletlen kattintás ne vegye el a helyet). */
function CancelBooking({ registrationId, eventId, paid, label = "Lemondom a helyem" }: { registrationId: string; eventId: string; paid: boolean; label?: string }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer list-none text-xs text-ink-soft underline decoration-gold/50 underline-offset-4 hover:text-gold">{label}</summary>
      <form action={cancelRegistration} className="mt-3 space-y-2 rounded-md border border-line p-3">
        <input type="hidden" name="registrationId" value={registrationId} />
        <input type="hidden" name="eventId" value={eventId} />
        <p className="text-xs text-ink-soft">
          {paid
            ? "A helyed felszabadul, és más jöhet helyetted. A befizetett díjat az ÁSZF szerint nem térítjük vissza."
            : "A helyed felszabadul, és más jöhet helyetted."}
        </p>
        <button className={buttonSecondary}>Igen, lemondom</button>
      </form>
    </details>
  );
}
