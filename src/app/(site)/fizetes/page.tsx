import Link from "next/link";
import { Check } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROGRAM_PLANS } from "@/lib/program-payment";
import { SITE } from "@/lib/site";
import { publicEnv } from "@/lib/env";
import { buttonPrimary, GildedCard, PageHeader } from "@/components/ornaments";
import { startProgramCheckout } from "./actions";

export const metadata = { title: "Fizetés · Kardos Bálint", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const fmtDay = (d: string) =>
  new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${d}T12:00:00Z`));

export default async function PaymentPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const token = one(sp.t);
  const info = /^[0-9a-f-]{36}$/i.test(token)
    ? ((await createAdminClient().rpc("payment_offer_info", { p_token: token })).data as unknown as {
        full_name: string;
        starts_on: string;
        status: "kikuldve" | "fizetve" | "visszavonva";
      } | null)
    : null;

  if (!info || info.status === "visszavonva") {
    return (
      <main className="py-16">
        <PageHeader eyebrow="Fizetés" title="Ez a fizetési link nem érvényes.">
          <p>Lehet, hogy elírás történt, vagy a link már nem használható. Kérlek, írj nekem: {SITE.email}.</p>
        </PageHeader>
      </main>
    );
  }

  const first = info.full_name.trim().split(/\s+/).slice(-1)[0];
  const programUrl = `${publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "")}/program`;

  if (info.status === "fizetve" || one(sp.fizetes) === "sikeres") {
    return (
      <main className="py-16">
        <PageHeader eyebrow="Fizetés" title={`Köszönöm, ${first}!`}>
          <p className="font-serif text-xl text-ink">Megkaptam a fizetést. Örülök, hogy együtt dolgozunk.</p>
          <p>
            Pár percen belül e-mailt kapsz egy belépő linkkel a programod felületére. A programod kezdete:
            {fmtDay(info.starts_on)}. Az első alkalmunk időpontját hamarosan beírom. A számlát külön küldöm.
          </p>
        </PageHeader>
        <a href={programUrl} className={`${buttonPrimary} mt-8`}>
          A programom felülete
        </a>
      </main>
    );
  }

  return (
    <main className="py-16">
      <PageHeader eyebrow="Egyéni program · fizetés" title={`Kedves ${first}, válaszd ki a fizetés módját.`}>
        <p>
          Nyolchónapos egyéni program: az első négy hónapban heti 60, a második négyben havi 45 perces online
          alkalommal, személyre szabott gyakorlási tervvel és heti beszámolóval. Kezdés: {fmtDay(info.starts_on)}.
        </p>
      </PageHeader>

      {one(sp.hiba) && (
        <p role="alert" className="mt-8 max-w-2xl rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">{one(sp.hiba)}</p>
      )}

      <GildedCard ornate className="mt-10 max-w-3xl p-6 sm:p-8">
        <form action={startProgramCheckout} className="space-y-8">
          <input type="hidden" name="t" value={token} />
          <fieldset className="space-y-3">
            <legend className="mb-2 font-serif text-xl text-forest">Fizetési mód</legend>
            {PROGRAM_PLANS.map((p, i) => (
              <label
                key={p.code}
                className="flex cursor-pointer items-start gap-4 rounded-lg border border-line p-4 transition-colors duration-300 hover:border-gold/60 has-[:checked]:border-gold has-[:checked]:bg-gold-soft/30"
              >
                <input type="radio" name="plan" value={p.code} defaultChecked={i === 0} required className="mt-1.5 h-4 w-4 accent-forest" />
                <span className="flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-serif text-lg text-forest">{p.title}</span>
                    <span className="font-serif text-lg text-ink">{p.amountText}</span>
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-soft">{p.detail}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="space-y-4 rounded-lg bg-paper-deep/70 p-5 text-sm text-ink-soft">
            <label className="flex items-start gap-3">
              <input type="checkbox" name="early_start" required className="mt-0.5 h-5 w-5 shrink-0 accent-forest" />
              <span>
                Kérem, hogy a program a 14 napos elállási határidőn belül elinduljon. Tudomásul veszem, hogy ha elállok, az
                addig teljesített szolgáltatás arányos díját meg kell fizetnem.
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" name="terms" required className="mt-0.5 h-5 w-5 shrink-0 accent-forest" />
              <span>
                Elolvastam és elfogadom az{" "}
                <Link href="/aszf" target="_blank" className="text-forest underline decoration-gold/60 underline-offset-4">ÁSZF-et</Link> és
                az{" "}
                <Link href="/adatkezeles" target="_blank" className="text-forest underline decoration-gold/60 underline-offset-4">
                  adatkezelési tájékoztatót
                </Link>
                .
              </span>
            </label>
          </div>

          <div>
            <button className={buttonPrimary}>Tovább a biztonságos fizetéshez</button>
            <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />Bankkártyával, a Stripe biztonságos fizetési oldalán.</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />Részletfizetésnél a további részleteket havonta automatikusan terheljük, a kártyádat bármikor frissítheted.</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />Minden fizetésről számlát küldök.</li>
            </ul>
          </div>
        </form>
      </GildedCard>
    </main>
  );
}
