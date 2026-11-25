import { z } from "zod";

/** A kezdő felmérés kérdései (A rész: az életmód-orvostan hat pillére). */
export const PILLARS = [
  { key: "taplalkozas", title: "Táplálkozás", question: "Mennyire vagy elégedett azzal, ahogyan most étkezel?", hint: "pl. rendszertelenül eszem, sokat nassolok, este eszem a legtöbbet…" },
  { key: "mozgas", title: "Mozgás", question: "Mennyire vagy elégedett azzal, amennyit és ahogyan mozogsz?", hint: "pl. heti kétszer futok, egész nap ülök…" },
  { key: "alvas", title: "Alvás", question: "Mennyire vagy elégedett az alvásoddal?", hint: "pl. nehezen alszom el, éjjel felébredek…" },
  { key: "stressz", title: "Stresszkezelés", question: "Mennyire tudod most kezelni a mindennapi terhelést?", hint: "pl. sokáig bírom, aztán hirtelen elfáradok…" },
  { key: "szerek", title: "Kockázatos szerek", question: "Mennyire vagy elégedett a viszonyoddal az alkoholhoz, a dohányzáshoz, a koffeinhez és más szerekhez?", hint: "pl. esténként iszom egy pohár bort, napi öt cigaretta…" },
  { key: "kapcsolatok", title: "Társas kapcsolódás", question: "Mennyire érzed magad támogatva a kapcsolataidban?", hint: "pl. kevés időm jut a barátaimra…" },
] as const;
export type PillarKey = (typeof PILLARS)[number]["key"];

export const RATING_LABELS = ["egyáltalán nem", "kevéssé", "közepesen", "nagyrészt", "teljesen"] as const;

export const INVEST = [
  { value: "igen", label: "Igen" },
  { value: "talan", label: "Talán" },
  { value: "nem", label: "Nem" },
] as const;

export const START_OPTIONS = [
  { value: "azonnal", label: "Azonnal — ma vagy holnap" },
  { value: "egy_heten_belul", label: "Egy héten belül" },
  { value: "egy_honapon_belul", label: "Egy hónapon belül" },
  { value: "kesobb", label: "Később" },
  { value: "nem_tudom", label: "Még nem tudom" },
] as const;

export const START_LABEL = Object.fromEntries(START_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;
export const INVEST_LABEL = Object.fromEntries(INVEST.map((o) => [o.value, o.label])) as Record<string, string>;

const investSchema = z.enum(["igen", "talan", "nem"]);
const pillarSchema = z.object({ rating: z.coerce.number().int().min(1).max(5), note: z.string().trim().max(1000).optional() });

export const applicationSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(40).optional(),
  pillars: z.object({
    taplalkozas: pillarSchema,
    mozgas: pillarSchema,
    alvas: pillarSchema.extend({ hours: z.coerce.number().min(0).max(16).optional() }),
    stressz: pillarSchema,
    szerek: pillarSchema,
    kapcsolatok: pillarSchema,
  }),
  problem: z.string().trim().min(3).max(4000),
  severity: z.coerce.number().int().min(1).max(10),
  urgency: z.coerce.number().int().min(1).max(10),
  invest_money: investSchema,
  invest_time: investSchema,
  invest_energy: investSchema,
  start_when: z.enum(["azonnal", "egy_heten_belul", "egy_honapon_belul", "kesobb", "nem_tudom"]),
  health_consent: z.literal("on"),
  privacy_consent: z.literal("on"),
});

/** FormData → a séma bemenete (a pillérek mezőnevei: p_<kulcs>_rating, p_<kulcs>_note). */
export function applicationInput(fd: FormData) {
  const str = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" && v.trim() !== "" ? v : undefined;
  };
  const pillars = Object.fromEntries(
    PILLARS.map(({ key }) => [key, { rating: str(`p_${key}_rating`), note: str(`p_${key}_note`), ...(key === "alvas" ? { hours: str("p_alvas_hours") } : {}) }]),
  );
  return {
    full_name: str("full_name"),
    email: str("email"),
    phone: str("phone"),
    pillars,
    problem: str("problem"),
    severity: str("severity"),
    urgency: str("urgency"),
    invest_money: str("invest_money"),
    invest_time: str("invest_time"),
    invest_energy: str("invest_energy"),
    start_when: str("start_when"),
    health_consent: str("health_consent"),
    privacy_consent: str("privacy_consent"),
  };
}

export const APP_STATUS_LABEL: Record<string, string> = {
  uj: "Új",
  foglalt: "Időpontot foglalt",
  konzultalt: "Konzultáció megvolt",
  resztvevo: "Résztvevő lett",
  nem_lett: "Nem lett résztvevő",
  archiv: "Archív",
};
