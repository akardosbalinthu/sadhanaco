import { publicEnv } from "@/lib/env";
import { GildedCard, PageHeader } from "@/components/ornaments";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata = { title: "Leiratkozás · Kardos Bálint", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";
  const settingsHref = `${publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "")}/adataim`;
  return (
    <main className="py-16">
      <PageHeader eyebrow="Kardos Bálint" title="Leiratkozás az újdonságokról">
        <p>
          Ha nem szeretnél levelet kapni az új alkalmakról és eseményekről, egy kattintással
          leiratkozhatsz. A foglalásaidról és fizetéseidről szóló leveleket továbbra is megkapod.
        </p>
      </PageHeader>
      <GildedCard className="mt-10 max-w-xl p-8">
        {token ? <UnsubscribeForm token={token} settingsHref={settingsHref} /> : <p className="text-sm text-ink-soft">Ez a link nem érvényes.</p>}
      </GildedCard>
    </main>
  );
}
