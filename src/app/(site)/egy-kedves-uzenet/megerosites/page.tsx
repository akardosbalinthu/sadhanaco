import { GildedCard, PageHeader } from "@/components/ornaments";
import { ConfirmForm } from "./confirm-form";

export const metadata = { title: "Kedves Üzenet megerősítése · Kardos Bálint", robots: { index: false, follow: false } };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : "";
  return (
    <main className="py-16">
      <PageHeader eyebrow="Egy Kedves Üzenet" title="Még egy kattintás">
        <p>Erősítsd meg, hogy te küldted az üzenetet – utána bekerül a kézbesítési sorba.</p>
      </PageHeader>
      <GildedCard className="mt-10 max-w-xl p-8">
        {token ? <ConfirmForm token={token} /> : <p className="text-sm text-ink-soft">Ez a link nem érvényes.</p>}
      </GildedCard>
    </main>
  );
}
