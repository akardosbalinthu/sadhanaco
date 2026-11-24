import { fmtDate, huf, profilesById, requireAdmin } from "@/lib/admin";
import { GildedCard } from "@/components/ornaments";
import { setInvoiceNumber } from "../actions";
import { Empty, Flash, H2, smallButton, smallInput, type SP } from "../ui";

const REGION = { HU: "HU", EU: "EU", NON_EU: "EU-n kívül" } as const;

export default async function AdminInvoices({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: todo }, { data: done }] = await Promise.all([
    supabase.from("invoices").select("*").is("provider_invoice_number", null).order("issued_at"),
    supabase.from("invoices").select("*").not("provider_invoice_number", "is", null).order("issued_at", { ascending: false }).limit(20),
  ]);
  const people = await profilesById(supabase, [...(todo ?? []), ...(done ?? [])].map((i) => i.user_id));

  return (
    <div className="space-y-14">
      <Flash sp={sp} />
      <section>
        <H2>Kiállításra vár</H2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Minden tétel alanyi adómentes (AAM), nettó = bruttó, magánszemély vevőnek. Állítsd ki a számlát a
          számlázóban, majd írd be ide a sorszámát.
        </p>
        {(todo ?? []).length === 0 ? (
          <Empty>Minden tétel ki van számlázva.</Empty>
        ) : (
          <ul className="mt-6 space-y-3">
            {todo!.map((i) => {
              const p = i.user_id ? people.get(i.user_id) : null;
              return (
                <li key={i.id}>
                  <GildedCard className="p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-forest">{i.description}</p>
                      <p className="font-serif text-xl text-forest">{huf(i.amount_huf)}</p>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      {fmtDate(i.issued_at)} · {p ? `${p.display_name || p.email} (${p.email})` : "Külsős vásárló — az adatok a Stripe-ban"} ·{" "}
                      {i.country} ({REGION[i.region]}) · {i.stripe_invoice_id ?? i.stripe_payment_intent_id}
                    </p>
                    <form action={setInvoiceNumber} className="mt-4 flex flex-wrap gap-2">
                      <input type="hidden" name="id" value={i.id} />
                      <input name="number" required placeholder="Számla sorszáma" className={smallInput} />
                      <button className={smallButton}>Rögzítés</button>
                    </form>
                  </GildedCard>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <H2>Legutóbb kiállítva</H2>
        {(done ?? []).length === 0 ? (
          <Empty>Még nincs rögzített sorszám.</Empty>
        ) : (
          <ul className="mt-6 space-y-2 text-sm">
            {done!.map((i) => (
              <li key={i.id} className="flex flex-wrap gap-x-3 border-b border-line/60 pb-2">
                <span className="text-forest">{i.provider_invoice_number}</span>
                <span className="text-ink-soft">{i.description}</span>
                <span className="text-ink-soft">{i.user_id ? people.get(i.user_id)?.email : "külsős"}</span>
                <span className="ml-auto text-ink-soft">
                  {huf(i.amount_huf)} · {fmtDate(i.issued_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
