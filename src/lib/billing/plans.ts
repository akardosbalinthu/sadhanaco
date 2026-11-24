/** A tagsági csomagok (price_catalog.code = Stripe lookup_key). */
export type PlanCode = "tarsasagi_havi" | "tarsasagi_eves" | "belso_kor_havi" | "belso_kor_eves";

export const PLANS: Record<PlanCode, { tier: "tarsasagi" | "belso_kor"; interval: "month" | "year"; label: string; trial: boolean }> = {
  tarsasagi_havi: { tier: "tarsasagi", interval: "month", label: "A Társaság Tagja — havi", trial: true },
  tarsasagi_eves: { tier: "tarsasagi", interval: "year", label: "A Társaság Tagja — éves", trial: false },
  belso_kor_havi: { tier: "belso_kor", interval: "month", label: "A Belső Kör Tagja — havi", trial: false },
  belso_kor_eves: { tier: "belso_kor", interval: "year", label: "A Belső Kör Tagja — éves", trial: false },
};

export function isPlanCode(v: unknown): v is PlanCode {
  return typeof v === "string" && v in PLANS;
}

/** A Stripe HUF-összegei két tizedesjegyesek (9 940 Ft = 994000). */
export function hufFromStripe(amount: number): number {
  return Math.round(amount / 100);
}
