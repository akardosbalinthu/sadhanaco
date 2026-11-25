import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Circle, Lock, Sparkles } from "lucide-react";
import { requireMember, ORDER_INFO, TRACK_LABEL, type OrderKey } from "@/lib/member";
import { tp } from "@/lib/site";
import { MemberNav } from "@/components/member-nav";
import { OrderCrest } from "@/components/order-crest";
import { buttonPrimary, buttonSecondary, CompassDivider, GildedCard, inputClass } from "@/components/ornaments";
import { onlinePaymentsEnabled } from "@/lib/stripe";
import { buyAcceleration, requestProgression, toggleCompletion } from "./actions";

export const metadata = { title: "Gyakorlás · A Társaság" };
export const dynamic = "force-dynamic";

type Card = {
  order: OrderKey | null;
  xp_total: number;
  xp_today: number;
  xp_daily_cap: number;
  rank: { label: string; xp: number } | null;
  next_rank: { label: string; xp: number } | null;
  xp_to_next: number | null;
  milestones: { key: string; label: string }[];
};

export default async function PracticePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { supabase, profile, hasAccess } = await requireMember();
  // Első belépés: rövid bevezető a platformról.
  if (hasAccess && !profile.onboarded_at) redirect(tp("/udvozlunk"));

  if (!hasAccess) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <MemberNav active="/gyakorlas" />
        <GildedCard className="p-8 text-center">
          <h1 className="font-serif text-3xl text-forest">A tagságod jelenleg nem aktív.</h1>
          <p className="mt-4 text-ink-soft">
            Ha újra csatlakozol, az út elölről indul — a Ceremónián kapott rended megmarad.
          </p>
          <Link href={tp("/csatlakozas")} className={`${buttonPrimary} mt-8`}>
            Csatlakozom újra
          </Link>
        </GildedCard>
      </main>
    );
  }

  const [{ data: cardRaw }, { data: modules }, { data: lessons }, { data: today }, { data: prog }] = await Promise.all([
    supabase.rpc("my_character_card"),
    supabase.from("modules").select("stage, title, subtitle, total_weeks").order("stage"),
    supabase.from("lessons").select("id, week_number, sort_order, title, description, duration_seconds, track, modules!inner(stage)").order("week_number").order("sort_order"),
    supabase.rpc("budapest_today"),
    supabase.rpc("progression_status"),
  ]);
  const card = cardRaw as unknown as Card;
  const { data: priceRows } = await supabase
    .from("price_catalog")
    .select("code, amount_huf")
    .in("code", ["gyorsitott_m2_ip2", "gyorsitott_ip3", "gyorsitott_m2_ip3_csomag"]);
  const prices = Object.fromEntries((priceRows ?? []).map((r) => [r.code, r.amount_huf])) as Record<string, number>;
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
  const { data: doneToday } = await supabase
    .from("lesson_completions")
    .select("lesson_id")
    .eq("practiced_on", today as string);
  const done = new Set((doneToday ?? []).map((d) => d.lesson_id));
  const stageLessons = (lessons ?? []).filter((l) => (l.modules as unknown as { stage: number }).stage === current?.stage);
  const thisWeek = stageLessons.filter((l) => l.week_number === current?.week);
  const earlier = stageLessons.filter((l) => current?.week && l.week_number < current.week);

  const order = card?.order ? ORDER_INFO[card.order] : null;
  const progress =
    card?.next_rank && card.rank
      ? Math.min(100, Math.round(((card.xp_total - card.rank.xp) / (card.next_rank.xp - card.rank.xp)) * 100))
      : 100;
  const p = prog as unknown as {
    target_stage: number | null; eligible: boolean; previous_completed: boolean; points: number;
    points_required: number; basis: string | null; open_request_status: string | null; all_unlocked: boolean;
  } | null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <MemberNav active="/gyakorlas" />

      <p className="text-xs uppercase tracking-[0.25em] text-gold">A Társaság · Gyakorlótér</p>
      <h1 className="mt-3 font-serif text-4xl text-forest">
        Üdv újra itt{profile.display_name ? `, ${profile.display_name}` : ""}.
      </h1>
      {profile.subscription_status === "trialing" && profile.trial_ends_at && (
        <p className="mt-3 text-sm text-ink-soft">
          Próbaidő: {new Date(profile.trial_ends_at).toLocaleDateString("hu-HU", { month: "long", day: "numeric" })}-ig. A tananyag és a
          közösség már a tiéd; a díjmentes Kedves Üzenet és a foglalások az első fizetés után nyílnak meg.
        </p>
      )}

      {(!profile.last_name || !profile.first_name) && (
        <p className="mt-6 text-sm text-ink-soft">
          Add meg a neved, hogy a közösségben is tudjuk, kivel beszélgetünk:{" "}
          <Link href={tp("/adataim")} className="text-forest underline decoration-gold/60 underline-offset-4 hover:text-gold">
            Adataim
          </Link>
        </p>
      )}

      {!card?.order && (
        <GildedCard className="mt-8 border-gold/50 p-8">
          <Sparkles className="h-5 w-5 text-gold" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-3 font-serif text-2xl text-forest">Az első lépés: a Ceremónia</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Tizenkét kérdés, nagyjából öt perc. A végén kiderül, melyik rendbe kerülsz — ez lesz a kiindulópontod.
          </p>
          <Link href={tp("/ceremonia")} className={`${buttonPrimary} mt-6`}>
            Részt veszek a Ceremónián
          </Link>
        </GildedCard>
      )}

      <section className="mt-10 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <GildedCard className="p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Karakterkártya</p>
          <div className="mt-4 flex items-center gap-4">
            <OrderCrest order={card?.order} className="h-16 w-14" />
            <div>
              <p className="font-serif text-2xl text-forest">{order ? order.single : "Rend nélkül"}</p>
              {order && (
                <Link href={tp("/rendem")} className="text-xs text-forest underline decoration-gold/60 underline-offset-4 hover:text-gold">
                  A rendem részletesen
                </Link>
              )}
              <p className="text-sm text-ink-soft">{card?.rank?.label ?? "Kereső"} · {card?.xp_total ?? 0} XP</p>
            </div>
          </div>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            {card?.next_rank ? `${card.xp_to_next} XP a következő rangig: ${card.next_rank.label}` : "Elérted a legmagasabb rangot."}
          </p>
          <p className="mt-1 text-xs text-ink-soft">Ma: {card?.xp_today ?? 0} / {card?.xp_daily_cap ?? 60} XP</p>
          {card?.milestones?.length ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {card.milestones.map((m) => (
                <li key={m.key} className="rounded-full border border-gold/50 px-3 py-1 text-xs text-ink-soft">{m.label}</li>
              ))}
            </ul>
          ) : null}
          <Link href={tp("/ranglista")} className="mt-5 inline-block text-sm text-forest underline decoration-gold/60 underline-offset-4 hover:text-gold">
            Ranglista
          </Link>
        </GildedCard>

        <GildedCard className="p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Az utad</p>
          <ol className="mt-4 space-y-3">
            {stages.map((s) => (
              <li key={s.stage} className="flex items-start gap-3">
                {s.open ? (
                  <Circle className={`mt-1 h-4 w-4 shrink-0 ${s.stage === current?.stage ? "fill-gold text-gold" : "text-gold"}`} strokeWidth={1.5} aria-hidden />
                ) : (
                  <Lock className="mt-1 h-4 w-4 shrink-0 text-ink-soft/60" strokeWidth={1.5} aria-label="zárva" />
                )}
                <div>
                  <p className={s.open ? "text-ink" : "text-ink-soft"}>{s.title}</p>
                  <p className="text-xs text-ink-soft">
                    {s.subtitle}
                    {s.open && s.week ? ` · ${s.week}. hét / ${s.total_weeks}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </GildedCard>
      </section>

      <CompassDivider className="my-14" />

      <section>
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Küldetések & Napi Hangolások</p>
        <h2 className="mt-2 font-serif text-3xl text-forest">{current?.week ? `${current.week}. hét` : "Ezen a héten"}</h2>
        {thisWeek.length === 0 ? (
          <GildedCard className="mt-6 text-sm text-ink-soft">
            Ennek a hétnek az anyagai hamarosan felkerülnek. Addig is: egy lassú kilégzés most is számít.
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
                        aria-label={isDone ? "Mai pipa visszavonása" : "Ma elvégeztem"}
                      >
                        {isDone && <Check className="h-4 w-4" strokeWidth={2} aria-hidden />}
                      </button>
                    </form>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-gold">
                        {TRACK_LABEL[l.track] ?? "Küldetés"} · {l.week_number}. hét
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

      {p && !p.all_unlocked && p.target_stage && (
        <>
          <CompassDivider className="my-14" />
          <section id="tovabblepes" className="scroll-mt-24">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Továbblépés</p>
            {typeof sp.ok === "string" && <p role="status" className="mt-4 rounded-md border border-gold/50 px-4 py-3 text-sm text-forest">{sp.ok}</p>}
            {typeof sp.hiba === "string" && <p role="status" className="mt-4 rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">{sp.hiba}</p>}
            <h2 className="mt-2 font-serif text-2xl text-forest">A következő lépcső</h2>
            <GildedCard className="mt-6 p-7">
              {p.open_request_status ? (
                <p className="text-sm text-ink-soft">
                  A továbblépési kérésed megérkezett ({p.open_request_status === "scheduled" ? "a beszélgetés időpontja egyeztetve" : "hamarosan jelentkezem egy rövid beszélgetéssel"}).
                </p>
              ) : p.eligible ? (
                <form action={requestProgression} className="space-y-4">
                  <p className="text-sm text-ink-soft">
                    Készen állsz a következő lépcsőre. Egy rövid, díjmentes beszélgetés után megnyitom neked.
                  </p>
                  <textarea name="note" rows={3} placeholder="Ha szeretnél, írj pár sort arról, hogy vagy az úton." className={inputClass} />
                  <button className={buttonPrimary}>Továbblépést kérek</button>
                </form>
              ) : (
                <ul className="space-y-2 text-sm text-ink-soft">
                  <li>{p.previous_completed ? "✓" : "○"} Az előző lépcső elvégzése (letelt a 9 hét, és a leckék legalább 70%-a kipipálva)</li>
                  <li>
                    {p.basis ? "✓" : "○"} A rang vagy a gyorsított hozzáférés: {p.points} / {p.points_required} XP
                  </li>
                </ul>
              )}
              {!p.basis && !p.open_request_status && (
                <Acceleration
                  target={p.target_stage}
                  required={p.points_required}
                  prices={prices}
                  open={onlinePaymentsEnabled() && profile.subscription_status !== "trialing" && profile.tier === "tarsasagi"}
                  m2Purchased={profile.m2_purchased}
                  ip3Purchased={profile.ip3_purchased}
                />
              )}
            </GildedCard>
          </section>
        </>
      )}
    </main>
  );
}

const fmtHuf = (n: number | undefined) => (n ? `${new Intl.NumberFormat("hu-HU", { useGrouping: "always" }).format(n)} Ft` : "");

/** Gyorsított hozzáférés: nem kötelező; a rangot váltja ki, a nyitás továbbra is kézi. */
function Acceleration({
  target,
  required,
  prices,
  open,
  m2Purchased,
  ip3Purchased,
}: {
  target: number;
  required: number;
  prices: Record<string, number>;
  open: boolean;
  m2Purchased: boolean;
  ip3Purchased: boolean;
}) {
  const options =
    target === 2 && !m2Purchased
      ? [
          { code: "gyorsitott_m2_ip2", title: "II. lépcső", text: "Tudatosság tréningnap + IP 2 (8+1 hét)" },
          ...(!ip3Purchased ? [{ code: "gyorsitott_m2_ip3_csomag", title: "II. és III. lépcső együtt", text: "kedvezményes csomag" }] : []),
        ]
      : target === 3 && !ip3Purchased
      ? [{ code: "gyorsitott_ip3", title: "III. lépcső", text: "IP 3 (8+1 hét)" }]
      : [];
  if (options.length === 0) return null;
  return (
    <div className="mt-6 border-t border-line pt-5">
      <p className="text-sm text-forest">Nem várnád meg a rangot?</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        Nem kötelező: a lépcső {required} XP-nél díjmentesen is elérhetővé válik. A gyorsított hozzáférés a rangot váltja
        ki — a lépcsőt ettől függetlenül az előző elvégzése és egy rövid, díjmentes beszélgetés után nyitom meg. Ha a
        tagságod megszűnik, a vásárolt hozzáférés nem marad meg.
      </p>
      {open ? (
        <form action={buyAcceleration} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((o, i) => (
              <label key={o.code} className="flex cursor-pointer gap-3 rounded-md border border-line p-4 transition-colors duration-300 hover:border-gold/60 has-[:checked]:border-gold has-[:checked]:bg-gold-soft/30">
                <input type="radio" name="code" value={o.code} defaultChecked={i === 0} className="mt-1 accent-forest" />
                <span>
                  <span className="block font-serif text-lg text-forest">{o.title}</span>
                  <span className="block text-xs text-ink-soft">{o.text}</span>
                  <span className="mt-1 block text-sm text-gold">{fmtHuf(prices[o.code])}</span>
                </span>
              </label>
            ))}
          </div>
          <label className="flex items-start gap-3 text-xs text-ink-soft">
            <input type="checkbox" name="waiver" required className="mt-0.5 accent-forest" />
            <span>Kérem a szolgáltatás azonnali teljesítését, és tudomásul veszem, hogy ezzel elveszítem a 14 napos elállási jogomat.</span>
          </label>
          <button className={buttonSecondary}>Tovább a fizetéshez</button>
        </form>
      ) : (
        <p className="mt-3 text-xs text-ink-soft">Az online vásárlás hamarosan nyílik (próbaidő alatt még nem érhető el).</p>
      )}
    </div>
  );
}
