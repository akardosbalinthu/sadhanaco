import { requireMember } from "@/lib/member";
import { MemberNav } from "@/components/member-nav";
import { buttonPrimary, GildedCard, inputClass } from "@/components/ornaments";
import { onlinePaymentsEnabled } from "@/lib/stripe";
import { bookFreeConsultation, payConsultation } from "./actions";

export const metadata = { title: "Konzultáció · A Társaság", robots: { index: false, follow: false } };

type SP = Promise<Record<string, string | string[] | undefined>>;
const fmt = new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", dateStyle: "long", timeStyle: "short" });
const STATUS: Record<string, string> = { requested: "kérés elküldve", scheduled: "időpont egyeztetve", done: "megtörtént", cancelled: "lemondva" };
const huf = (n: number) => `${new Intl.NumberFormat("hu-HU", { useGrouping: "always" }).format(n)} Ft`;

export default async function ConsultationPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase, profile, hasAccess } = await requireMember();
  if (!hasAccess) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <MemberNav active="/konzultacio" />
        <GildedCard className="text-sm text-ink-soft">A konzultáció A Társaság aktív tagjainak érhető el.</GildedCard>
      </main>
    );
  }
  const trial = profile.subscription_status === "trialing";
  const belso = profile.tier === "belso_kor";
  const [{ data: paying }, { data: mine }] = await Promise.all([
    supabase.rpc("is_paying_member"),
    supabase.from("consultations").select("*").eq("user_id", profile.id).neq("status", "pending_payment").order("created_at", { ascending: false }).limit(10),
  ]);
  const free = paying ? profile.free_consultations_remaining : 0;
  const price = belso ? 13000 : 15000;
  const ok = typeof sp.ok === "string" ? sp.ok : "";
  const hiba = typeof sp.hiba === "string" ? sp.hiba : "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <MemberNav active="/konzultacio" />
      <p className="text-xs uppercase tracking-[0.18em] text-gold">A Társaság · Egyéni konzultáció</p>
      <h1 className="mt-3 font-serif text-4xl text-forest">Egy óra, csak rád figyelve.</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Személyes beszélgetés a gyakorlásodról: mi működik, hol akadsz el, mi a következő jó lépés. Online vagy
        Budapesten, a Társaság tagjainak.
      </p>

      {ok && <p role="status" className="mt-6 rounded-md border border-gold/50 px-4 py-3 text-sm text-forest">{ok}</p>}
      {hiba && <p role="status" className="mt-6 rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">{hiba}</p>}

      <GildedCard className="mt-8 p-7">
        {trial ? (
          <p className="text-sm text-ink-soft">Konzultációt a próbaidő után lehet foglalni.</p>
        ) : free > 0 ? (
          <form action={bookFreeConsultation} className="space-y-4">
            <p className="text-sm text-forest">
              Még <span className="font-serif text-xl">{free}</span> díjmentes alkalmad van ebben az évben (A Belső Kör éves tagságának része).
            </p>
            <label className="block max-w-xs">
              <span className="mb-1.5 block text-sm text-ink-soft">Javasolt időpont (nem kötelező)</span>
              <input type="datetime-local" name="requested_for" className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">Miről beszélgetnél? (nem kötelező)</span>
              <textarea name="note" rows={4} maxLength={2000} className={inputClass} />
            </label>
            <button className={buttonPrimary}>Díjmentes alkalmat kérek</button>
            <p className="text-xs text-ink-soft">A pontos időpontot e-mailben egyeztetjük. A fel nem használt alkalmak nem vihetők át a következő évre.</p>
          </form>
        ) : (
          <div className="space-y-2 text-sm text-ink-soft">
            <p>
              Konzultáció tagi áron: <span className="text-forest">{huf(price)}</span> / alkalom
              {belso && " (A Belső Kör tagjainak kedvezményes ár)"}.
            </p>
            {belso && profile.billing_interval === "year" && <p>Az idei díjmentes alkalmaidat már felhasználtad; az évfordulón újraindulnak.</p>}
            {onlinePaymentsEnabled() && paying ? (
              <form action={payConsultation} className="space-y-4 pt-3">
                <label className="block max-w-xs">
                  <span className="mb-1.5 block text-sm text-ink-soft">Javasolt időpont (nem kötelező)</span>
                  <input type="datetime-local" name="requested_for" className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-soft">Miről beszélgetnél? (nem kötelező)</span>
                  <textarea name="note" rows={4} maxLength={2000} className={inputClass} />
                </label>
                <label className="flex items-start gap-3 text-sm text-ink-soft">
                  <input type="checkbox" name="waiver" required className="mt-1 accent-forest" />
                  <span>Kérem a szolgáltatás azonnali teljesítését, és tudomásul veszem, hogy ezzel elveszítem a 14 napos elállási jogomat.</span>
                </label>
                <button className={buttonPrimary}>Foglalok és fizetek ({huf(price)})</button>
                <p className="text-xs text-ink-soft">A pontos időpontot a fizetés után e-mailben egyeztetjük.</p>
              </form>
            ) : (
              <p>Az online foglalás és fizetés hamarosan itt nyílik meg.</p>
            )}
          </div>
        )}
      </GildedCard>

      {(mine ?? []).length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-forest">A konzultációid</h2>
          <ul className="mt-5 space-y-2 text-sm">
            {mine!.map((c) => (
              <li key={c.id} className="flex flex-wrap gap-x-3 border-b border-line/60 pb-2">
                <span className="text-forest">{c.requested_for ? fmt.format(new Date(c.requested_for)) : "időpont egyeztetés alatt"}</span>
                <span className="text-ink-soft">{c.is_free ? "díjmentes" : huf(c.price_huf)}</span>
                <span className={c.status === "scheduled" ? "text-gold" : "text-ink-soft"}>{STATUS[c.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
