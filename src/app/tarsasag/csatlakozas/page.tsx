import { createPublicClient } from "@/lib/supabase/public";
import { formatHuf } from "@/lib/site";
import { notifyHref } from "@/lib/cta";
import { onlinePaymentsEnabled } from "@/lib/stripe";
import { PLANS, isPlanCode, type PlanCode } from "@/lib/billing/plans";
import { buttonPrimary, GildedCard, PageHeader } from "@/components/ornaments";
import { JoinForm, type PlanOption } from "./join-form";

export const metadata = { title: "Csatlakozás · A Társaság" };

const NOTES: Record<PlanCode, string> = {
  tarsasagi_havi: "7 napig ingyen kipróbálható",
  tarsasagi_eves: "2 hónap ajándék",
  belso_kor_havi: "a teljes út, minden élő alkalom díjmentesen",
  belso_kor_eves: "2 hónap ajándék + évi 4 díjmentes konzultáció",
};

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ csomag?: string }> }) {
  const { csomag } = await searchParams;
  const supabase = createPublicClient();
  const { data: prices } = await supabase.from("price_catalog").select("code, amount_huf");

  const plans: PlanOption[] = (Object.keys(PLANS) as PlanCode[]).map((code) => {
    const amount = prices?.find((p) => p.code === code)?.amount_huf;
    const per = PLANS[code].interval === "month" ? "/ hó" : "/ év";
    return { code, title: PLANS[code].label, price: amount ? `${formatHuf(amount)} ${per}` : "", note: NOTES[code] };
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <PageHeader eyebrow="Csatlakozás" title="Válaszd ki az utad">
        <p>
          Néhány lépés, és indulhatsz: kiválasztod a csomagot, megadod a neved és az e-mail-címed, a fizetés után pedig
          e-mailben megkapod a belépő linket. Az első lépés a Ceremónia lesz.
        </p>
      </PageHeader>
      <GildedCard className="mt-10 p-8">
        {onlinePaymentsEnabled() ? (
          <JoinForm plans={plans} defaultPlan={isPlanCode(csomag) ? csomag : "tarsasagi_havi"} />
        ) : (
          <div className="text-center">
            <p className="text-ink-soft">Az online csatlakozás hamarosan nyílik.</p>
            <a href={notifyHref("A Társaság nyitása")} className={`${buttonPrimary} mt-6`}>
              Értesítést kérek a nyitásról
            </a>
          </div>
        )}
      </GildedCard>
    </main>
  );
}
