import Link from "next/link";
import { EVENT_KIND_LABEL, fmtDateTime, huf, profilesById, requireAdmin } from "@/lib/admin";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { cancelEvent, createEvent, markAttended, publishEvent, setDonationBased, setLiveLink, setRecording, unpublishEvent } from "../actions";
import { Empty, Flash, H2, label, one, smallButton, smallInput, smallPrimary, type SP } from "../ui";
import { SubmitButton } from "../submit-button";

const REG_STATUS = { pending_payment: "fizetésre vár", confirmed: "megerősítve", cancelled: "lemondva" } as const;

export default async function AdminEvents({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const eventId = one(sp.esemeny);
  const since = new Date(Date.now() - 45 * 86400000).toISOString();

  const [{ data: events }, selected, regs] = await Promise.all([
    supabase.from("events").select("*").gte("starts_at", since).order("starts_at"),
    eventId ? supabase.from("events").select("*").eq("id", eventId).maybeSingle() : Promise.resolve({ data: null }),
    eventId
      ? supabase.from("event_registrations").select("*").eq("event_id", eventId).order("created_at")
      : Promise.resolve({ data: [] as never[] }),
  ]);
  const e = selected.data;
  const { data: liveLink } = e?.is_online
    ? await supabase.from("event_live_links").select("join_url").eq("event_id", e.id).maybeSingle()
    : { data: null };
  const registrations = regs.data ?? [];
  const people = await profilesById(supabase, registrations.map((r) => r.user_id));
  const confirmed = registrations.filter((r) => r.status === "confirmed");

  return (
    <div className="space-y-14">
      <Flash sp={sp} />

      {e && (
        <section>
          <GildedCard className="p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gold">{EVENT_KIND_LABEL[e.kind]}</p>
                <h2 className="mt-2 font-serif text-2xl text-forest">{e.title}</h2>
                <p className="mt-2 text-sm text-ink-soft">
                  {fmtDateTime(e.starts_at)} · {e.is_online ? "online" : e.location ?? "helyszín nincs megadva"} · létszám:{" "}
                  {confirmed.length}/{e.capacity ?? "korlátlan"}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {e.kind === "tura"
                    ? "Tagoknak és meghívott vendégeknek díjmentes"
                    : e.donation_based
                    ? "Adomány alapú — a részvétel díjmentes, a helyszínen belátás szerint támogatható"
                    : `A Társaság Tagja: ${huf(e.price_tarsasagi_huf)} · A Belső Kör Tagja: ${huf(e.price_belso_kor_huf)}${
                        e.price_external_huf != null ? ` · Külsős: ${huf(e.price_external_huf)}` : " · csak tagoknak"
                      }`}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {e.cancelled_at ? "Lemondva" : e.is_published ? "Közzétéve" : "Piszkozat (még senki nem látja)"}
                </p>
              </div>
              <Link href={tp("/admin/esemenyek")} className="text-sm text-ink-soft hover:text-gold">
                Bezárás
              </Link>
            </div>
            {!e.cancelled_at && e.kind !== "tura" && (
              <form action={setDonationBased} className="mt-4">
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="on" value={e.donation_based ? "false" : "true"} />
                <button className={smallButton}>{e.donation_based ? "Már nem adomány alapú" : "Adomány alapúvá teszem (az árak 0 Ft-ra állnak)"}</button>
              </form>
            )}
            {!e.cancelled_at && (
              <form action={publishEvent} className="mt-6 flex flex-wrap gap-2">
                <input type="hidden" name="id" value={e.id} />
                {e.is_published ? (
                  <button formAction={unpublishEvent} className={smallButton}>
                    Visszavonás piszkozatba
                  </button>
                ) : (
                  <button formAction={publishEvent} className={smallPrimary}>
                    Közzététel
                  </button>
                )}
                <button formAction={cancelEvent} className={smallButton}>
                  Esemény lemondása
                </button>
              </form>
            )}

            {e.is_online && !e.cancelled_at && (
              <div className="mt-8 space-y-4 border-t border-line pt-6">
                <h3 className="font-serif text-lg text-forest">Élő közvetítés</h3>
                <p className="text-sm text-ink-soft">
                  Hozz létre egy Google Meet-hívást erre az időpontra, és másold be ide a linkjét. A tagok csak a kezdés előtt
                  15 perccel kapják meg (a Társaság felületén át, ami a jelenlétet is rögzíti, és XP-t ad); előre sehol nem
                  látszik. Ingyenes Gmail-fiókkal a 3+ fős hívás 60 percig tart.
                </p>
                <form action={setLiveLink} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={e.id} />
                  <label className="text-sm">
                    <span className="block text-xs text-ink-soft">Google Meet-link</span>
                    <input name="join_url" type="url" placeholder="https://meet.google.com/abc-defg-hij" defaultValue={liveLink?.join_url ?? ""} className={`${smallInput} mt-1 w-80`} />
                  </label>
                  <SubmitButton className={smallButton}>Mentés</SubmitButton>
                </form>
                <a href={tp(`/esemenyek/${e.id}/elo`)} target="_blank" rel="noopener" className={smallPrimary}>
                  Belépés házigazdaként
                </a>
                <form action={setRecording} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={e.id} />
                  <label className="text-sm">
                    <span className="block text-xs text-ink-soft">Felvétel — Bunny Stream videó-azonosító (utólag)</span>
                    <input name="recording_bunny_id" defaultValue={e.recording_bunny_id ?? ""} className={`${smallInput} mt-1 w-72`} />
                  </label>
                  <SubmitButton className={smallButton}>Mentés</SubmitButton>
                </form>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3 border-t border-line pt-6">
              <h3 className="font-serif text-lg text-forest">Résztvevők</h3>
              {registrations.length > 0 && (
                <a href={tp(`/admin/esemenyek/${e.id}/resztvevok.csv`)} className="text-sm text-forest underline decoration-gold/60 underline-offset-4 hover:text-gold">
                  Letöltés (CSV, Excelhez)
                </a>
              )}
            </div>
            {registrations.length === 0 ? (
              <Empty>Még nincs jelentkező.</Empty>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {registrations.map((r) => {
                  const p = r.user_id ? people.get(r.user_id) : null;
                  return (
                    <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line/60 pb-2">
                      <span className="text-forest">{p ? p.display_name || p.email : r.guest_name ?? r.guest_email}</span>
                      <span className="text-xs text-ink-soft">
                        {p ? (r.is_member_seat ? "tag" : "tag (külsős helyen)") : "külsős"} · {REG_STATUS[r.status]}
                        {r.price_huf > 0 && ` · ${huf(r.price_huf)}`}
                      </span>
                      {(r.phone || r.safety_note) && (
                        <span className="basis-full text-xs text-ink-soft">
                          {r.phone && <a href={`tel:${r.phone.replace(/[^+0-9]/g, "")}`} className="text-forest hover:text-gold">{r.phone}</a>}
                          {r.safety_note && (
                            <span className={/^nincs\.?$/i.test(r.safety_note.trim()) ? "" : "text-alert"}> · Biztonság: {r.safety_note}</span>
                          )}
                        </span>
                      )}
                      {r.details_purged_at && <span className="basis-full text-xs text-ink-soft">A telefonszám és a megjegyzés az esemény után törlődött.</span>}
                      {r.status === "confirmed" && (
                        <form action={markAttended} className="ml-auto">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="event_id" value={e.id} />
                          <input type="hidden" name="attended" value={r.attended_at ? "false" : "true"} />
                          <button className={r.attended_at ? smallPrimary : smallButton}>{r.attended_at ? "Jelen volt ✓" : "Jelen volt"}</button>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink-soft">A jelenlét rögzítése a tagnak XP-t ad (egyszer, eseményenként).</p>
          </GildedCard>
        </section>
      )}

      <section>
        <H2>Közelgő és friss események</H2>
        {(events ?? []).length === 0 ? (
          <Empty>Nincs esemény.</Empty>
        ) : (
          <ul className="mt-6 space-y-2 text-sm">
            {events!.map((ev) => (
              <li key={ev.id} className="flex flex-wrap gap-x-3 border-b border-line/60 pb-2">
                <span className="w-44 text-ink-soft">{fmtDateTime(ev.starts_at)}</span>
                <Link href={tp(`/admin/esemenyek?esemeny=${ev.id}`)} className="text-forest hover:text-gold">
                  {ev.title}
                </Link>
                <span className="text-ink-soft">{EVENT_KIND_LABEL[ev.kind]}</span>
                <span className={`ml-auto ${ev.is_published && !ev.cancelled_at ? "text-gold" : "text-ink-soft"}`}>
                  {ev.cancelled_at ? "lemondva" : ev.is_published ? "közzétéve" : "piszkozat"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <H2>Új esemény</H2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Az üresen hagyott árakat a típus alapértéke tölti ki: Nyílt Est 3 200 / 0 / külsős 4 940 Ft, Gyakorlónap 6 460 / 0
          Ft, a többi díjmentes. Szabadság Elvonulásnál A Társaság Tagjainak add meg az önköltséges árat (A Belső Kör Tagjainak díjmentes). A túra mindig díjmentes és csak tagoknak (meghívott vendégekkel). Az időpontok Budapest-idő
          szerint értendők.
        </p>
        <GildedCard className="mt-6">
          <form action={createEvent} className="grid gap-3 sm:grid-cols-6">
            <label className="sm:col-span-2">
              <span className={label}>Típus</span>
              <select name="kind" required className={`${smallInput} mt-1 w-full`}>
                {Object.entries(EVENT_KIND_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-4">
              <span className={label}>Cím</span>
              <input name="title" required maxLength={200} className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="sm:col-span-6">
              <span className={label}>Leírás</span>
              <textarea name="description" rows={3} className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>Kezdés</span>
              <input type="datetime-local" name="starts_at" required className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>Vége</span>
              <input type="datetime-local" name="ends_at" className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>Létszám (üres = korlátlan)</span>
              <input type="number" name="capacity" min={1} className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="sm:col-span-4">
              <span className={label}>Helyszín</span>
              <input name="location" placeholder="pl. Udgama ECO Központ" className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm sm:col-span-2">
              <input type="checkbox" name="is_online" className="accent-[var(--color-gold)]" /> Online — Google Meet (a linket létrehozás után az esemény részleteinél adod meg)
            </label>
            <label className="sm:col-span-2">
              <span className={label}>A Társaság Tagja (Ft)</span>
              <input type="number" name="price_tarsasagi_huf" min={0} className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>A Belső Kör Tagja (Ft)</span>
              <input type="number" name="price_belso_kor_huf" min={0} className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>Külsős (Ft, csak Nyílt Est)</span>
              <input type="number" name="price_external_huf" min={0} className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="sm:col-span-3">
              <span className={label}>Jelentkezés nyílik (üres = most)</span>
              <input type="datetime-local" name="registration_opens_at" className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="sm:col-span-3">
              <span className={label}>Jelentkezés zárul</span>
              <input type="datetime-local" name="registration_closes_at" className={`${smallInput} mt-1 w-full`} />
            </label>
            <label className="flex items-start gap-2 text-sm sm:col-span-6">
              <input type="checkbox" name="donation_based" className="mt-1 accent-[var(--color-gold)]" />
              <span>
                Adomány alapú — a részvétel díjmentes, a résztvevők a helyszínen, belátásuk szerint támogathatják (az árak
                ilyenkor 0 Ft-ra állnak; túránál nem értelmezett)
              </span>
            </label>
            <div className="flex items-center justify-between gap-3 sm:col-span-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_published" className="accent-[var(--color-gold)]" /> Azonnal közzéteszem
              </label>
              <SubmitButton className={smallPrimary}>Esemény létrehozása</SubmitButton>
            </div>
          </form>
        </GildedCard>
      </section>
    </div>
  );
}
