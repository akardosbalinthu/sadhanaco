import Link from "next/link";
import { fmtDateTime, huf, requireAdmin } from "@/lib/admin";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { markNotificationRead, setRegistrationOpen } from "./actions";
import { Empty, Flash, H2, smallButton, smallPrimary, type SP } from "./ui";

type Revenue = {
  year: number;
  binding_limit_huf: number;
  binding_limit_kind: string;
  warning_ratio: number;
  invoiced_total_huf: number;
  invoiced_by_region: Record<string, number>;
  projected_renewals_huf: number;
  projected_total_huf: number;
  usage_ratio: number;
  warning: boolean;
  limit_reached: boolean;
  registration_open: boolean;
  oss: { eu_invoiced_huf: number; eu_projected_total_huf: number; warning_threshold_huf: number; warning: boolean };
};

const REGION = { HU: "Magyarország", EU: "Egyéb EU", NON_EU: "EU-n kívül" } as const;

const NOTE_LABEL: Record<string, string> = {
  chargeback: "Visszaterhelés (chargeback)",
  revenue_warning: "Bevételi figyelmeztetés",
  kind_message_followup: "Kedves Üzenet: utánkövetés kell",
  overbooking: "Túlfoglalás egy eseményen",
  payment_failed: "Sikertelen terhelés",
  progression_request: "Új továbblépési kérés",
};

export default async function AdminHome({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: rev }, { data: notes }, { count: members }, { count: trialing }] = await Promise.all([
    supabase.rpc("kata_revenue_status"),
    supabase.from("admin_notifications").select("*").is("read_at", null).order("created_at", { ascending: false }).limit(20),
    supabase.from("profiles").select("id", { count: "exact", head: true }).in("subscription_status", ["active", "past_due"]),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_status", "trialing"),
  ]);
  const r = rev as Revenue | null;
  const pct = r ? Math.round(r.usage_ratio * 1000) / 10 : 0;

  return (
    <div className="space-y-14">
      <Flash sp={sp} />

      <section className="grid gap-5 md:grid-cols-3">
        <GildedCard>
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Tagok</p>
          <p className="mt-3 font-serif text-3xl text-forest">{members ?? 0}</p>
          <p className="mt-1 text-sm text-ink-soft">fizető tag · {trialing ?? 0} próbaidőn</p>
          <Link href={tp("/admin/tagok")} className="mt-4 inline-block text-sm text-forest underline decoration-gold/60 underline-offset-4 hover:text-gold">
            Tagok listája
          </Link>
        </GildedCard>

        <GildedCard className="md:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Új jelentkezések</p>
          <p className="mt-3 font-serif text-2xl text-forest">{r?.registration_open ? "Nyitva" : "Lezárva"}</p>
          <p className="mt-1 text-sm text-ink-soft">
            Lezárva senki sem tud új tagságot indítani; a meglévő tagok előfizetése változatlanul fut tovább.
          </p>
          <form action={setRegistrationOpen} className="mt-4">
            <input type="hidden" name="open" value={r?.registration_open ? "false" : "true"} />
            <button className={r?.registration_open ? smallButton : smallPrimary}>
              {r?.registration_open ? "Jelentkezések lezárása" : "Jelentkezések megnyitása"}
            </button>
          </form>
        </GildedCard>
      </section>

      {r && (
        <section>
          <H2>Bevételi határ — {r.year}</H2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            A kiállítandó számlák összege a várható megújulásokkal együtt. A kötő határ a KATA- és az alanyi
            adómentességi határ közül a kisebb ({r.binding_limit_kind === "kata" ? "most a KATA-határ" : "most az áfamentességi határ"}).
          </p>
          <GildedCard className={`mt-6 ${r.limit_reached ? "border-alert/50" : r.warning ? "border-gold/60" : ""}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-serif text-3xl text-forest">{pct}%</p>
              <p className="text-sm text-ink-soft">
                {huf(r.projected_total_huf)} / {huf(r.binding_limit_huf)}
              </p>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-line" aria-hidden>
              <div
                className={`h-full rounded-full ${r.limit_reached ? "bg-alert" : "bg-gold"}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            {(r.warning || r.limit_reached) && (
              <p className={`mt-4 text-sm ${r.limit_reached ? "text-alert" : "text-forest"}`}>
                {r.limit_reached
                  ? "Elérted a határt. Zárd le az új jelentkezéseket."
                  : `Átlépted a ${Math.round(r.warning_ratio * 100)}%-os figyelmeztetési szintet. Érdemes időben lezárni az új jelentkezéseket.`}
              </p>
            )}
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-ink-soft">Eddig számlázva</dt>
                <dd className="mt-1 text-forest">{huf(r.invoiced_total_huf)}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Várható megújulások</dt>
                <dd className="mt-1 text-forest">{huf(r.projected_renewals_huf)}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Régiók szerint (számlázva)</dt>
                <dd className="mt-1 space-y-0.5 text-forest">
                  {(Object.keys(REGION) as (keyof typeof REGION)[]).map((k) => (
                    <p key={k}>
                      {REGION[k]}: {huf(r.invoiced_by_region?.[k] ?? 0)}
                    </p>
                  ))}
                </dd>
              </div>
            </dl>
            <p className={`mt-6 border-t border-line pt-4 text-sm ${r.oss.warning ? "text-alert" : "text-ink-soft"}`}>
              Uniós OSS-határ: {huf(r.oss.eu_projected_total_huf)} várható / {huf(r.oss.warning_threshold_huf)} figyelmeztetési szint
              {r.oss.warning && " — a határ közelében vagy, egyeztess a könyvelőddel."}
            </p>
          </GildedCard>
        </section>
      )}

      <section>
        <H2>Értesítések</H2>
        {(notes ?? []).length === 0 ? (
          <Empty>Nincs olvasatlan értesítés.</Empty>
        ) : (
          <ul className="mt-6 space-y-3">
            {notes!.map((n) => (
              <li key={n.id}>
                <GildedCard className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm text-forest">{NOTE_LABEL[n.kind] ?? n.kind}</p>
                    <p className="mt-1 text-xs text-ink-soft">{fmtDateTime(n.created_at)}</p>
                    <pre className="mt-2 whitespace-pre-wrap break-all font-sans text-xs text-ink-soft">
                      {JSON.stringify(n.payload, null, 1).replace(/[{}"]/g, "").trim()}
                    </pre>
                  </div>
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button className={smallButton}>Rendben</button>
                  </form>
                </GildedCard>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
