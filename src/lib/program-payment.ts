/** Az egyéni program fizetési módjai (code = Stripe lookup_key = price_catalog.code). */
export const PROGRAM_PLANS = [
  {
    code: "egyeni_program_egyben",
    title: "Egy összegben",
    amountText: "690 000 Ft",
    detail: "egyszeri fizetés az induláskor",
    installments: 1,
    totalHuf: 690000,
  },
  {
    code: "egyeni_program_4_reszlet",
    title: "Négy részletben",
    amountText: "4 × 180 000 Ft",
    detail: "havonta, az első négy hónapban (összesen 720 000 Ft)",
    installments: 4,
    totalHuf: 720000,
  },
  {
    code: "egyeni_program_havi",
    title: "Havonta",
    amountText: "8 × 100 000 Ft",
    detail: "havonta, a program nyolc hónapja alatt (összesen 800 000 Ft)",
    installments: 8,
    totalHuf: 800000,
  },
] as const;

export type ProgramPlanCode = (typeof PROGRAM_PLANS)[number]["code"];

export function isProgramPlan(v: unknown): v is ProgramPlanCode {
  return typeof v === "string" && PROGRAM_PLANS.some((p) => p.code === v);
}

export const PROGRAM_PLAN_LABEL = Object.fromEntries(PROGRAM_PLANS.map((p) => [p.code, `${p.title} (${p.amountText})`])) as Record<string, string>;

export function installmentsOf(code: ProgramPlanCode) {
  return PROGRAM_PLANS.find((p) => p.code === code)!.installments;
}

/** Az előfizetés vége: a kezdéstől számított N hónap (egy órával korábban, hogy ne induljon új időszak). */
export function subscriptionEndUnix(anchorUnix: number, months: number) {
  const d = new Date(anchorUnix * 1000);
  const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
  return Math.floor(end / 1000) - 3600;
}
