import { fmtDateTime, huf, profilesById, requireAdmin } from "@/lib/admin";
import { GildedCard } from "@/components/ornaments";
import { closeKindMessageDelivered, closeKindMessageFailed, kindMessageAttemptFailed, kindMessageDelivered } from "../actions";
import { Empty, Flash, H2, smallButton, smallInput, smallPrimary, type SP } from "../ui";

export default async function AdminKindMessages({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: queue }, { data: settings }, { data: recent }] = await Promise.all([
    supabase.rpc("admin_kind_message_queue"),
    supabase.from("app_settings").select("kind_message_max_attempts").single(),
    supabase
      .from("kind_messages")
      .select("id, recipient_name, status, kind, delivered_at, closed_at")
      .in("status", ["delivered", "failed"])
      .order("closed_at", { ascending: false, nullsFirst: false })
      .limit(15),
  ]);
  const max = settings?.kind_message_max_attempts ?? 3;
  const senders = await profilesById(supabase, (queue ?? []).map((m) => m.sender_id));

  return (
    <div className="space-y-14">
      <Flash sp={sp} />
      <section>
        <H2>Kézbesítési sor</H2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          A sorrend kötött: elsőbbségi kereten belüli (beérkezés szerint) → elsőbbségi fizetős (összeg szerint) →
          díjmentes (beérkezés szerint). A díjmentes üzenet {max} sikertelen próbálkozás után lezárul; az elsőbbségi
          utánkövetésre kerül, és csak te zárhatod le.
        </p>
        {(queue ?? []).length === 0 ? (
          <Empty>A sor üres.</Empty>
        ) : (
          <ol className="mt-6 space-y-4">
            {queue!.map((m, i) => {
              const s = m.sender_id ? senders.get(m.sender_id) : null;
              const priority = m.kind === "priority";
              return (
                <li key={m.id}>
                  <GildedCard className={priority ? "border-gold/50" : ""}>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="font-serif text-xl text-forest">
                        <span className="mr-2 text-gold">{i + 1}.</span>
                        {m.recipient_name}
                        {m.recipient_phone && <span className="ml-3 font-sans text-base text-ink">{m.recipient_phone}</span>}
                      </p>
                      <p className="text-sm text-gold">
                        {priority ? (m.is_free ? "Elsőbbségi · keretből" : `Elsőbbségi · ${huf(m.amount_huf)}`) : "Díjmentes"}
                        {m.status === "followup" && " · utánkövetés"}
                      </p>
                      {m.anonymous && (
                        <p className="w-full rounded-md border border-alert/50 px-3 py-1.5 text-sm text-alert">
                          Névtelen — a hívásban ne mondd ki a küldő nevét.
                        </p>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      Küldő: {s ? `${s.display_name || s.email} (${s.email})` : `${m.guest_name ?? "—"} (${m.guest_email ?? "—"})`} ·{" "}
                      {fmtDateTime(m.created_at)} · próbálkozás: {m.attempts}/{max}
                      {m.last_attempt_at && ` · utoljára: ${fmtDateTime(m.last_attempt_at)}`}
                    </p>
                    <p className="mt-4 whitespace-pre-line border-l-2 border-gold/40 pl-3 font-serif text-lg leading-relaxed text-ink">{m.message}</p>

                    <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-line pt-5">
                      {m.status === "followup" ? (
                        <form action={closeKindMessageDelivered} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={m.id} />
                          <input name="note" placeholder="Jegyzet" className={smallInput} />
                          <button formAction={closeKindMessageDelivered} className={smallPrimary}>
                            Kézbesítve
                          </button>
                          <button formAction={closeKindMessageFailed} className={smallButton}>
                            Lezárás sikertelenként
                          </button>
                        </form>
                      ) : (
                        <form action={kindMessageDelivered} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={m.id} />
                          <input name="note" placeholder="Jegyzet (pl. nem vette fel)" className={smallInput} />
                          <button formAction={kindMessageDelivered} className={smallPrimary}>
                            Kézbesítve
                          </button>
                          <button formAction={kindMessageAttemptFailed} className={smallButton}>
                            Nem sikerült elérni
                          </button>
                        </form>
                      )}
                    </div>
                  </GildedCard>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section>
        <H2>Legutóbb lezárt</H2>
        {(recent ?? []).length === 0 ? (
          <Empty>Még nincs lezárt üzenet.</Empty>
        ) : (
          <ul className="mt-6 space-y-2 text-sm">
            {recent!.map((m) => (
              <li key={m.id} className="flex flex-wrap gap-x-3 border-b border-line/60 pb-2">
                <span className="text-forest">{m.recipient_name}</span>
                <span className="text-ink-soft">{m.kind === "priority" ? "elsőbbségi" : "díjmentes"}</span>
                <span className={m.status === "delivered" ? "text-gold" : "text-ink-soft"}>
                  {m.status === "delivered" ? "kézbesítve" : "sikertelen"}
                </span>
                <span className="ml-auto text-ink-soft">{fmtDateTime(m.delivered_at ?? m.closed_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
