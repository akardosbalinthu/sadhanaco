import { z } from "zod";

/** A céges ajánlatkérő űrlap választási lehetőségei — csak itt szerepelnek. */
export const FORMATS = [
  { value: "treningnap", label: "Tréningnap" },
  { value: "tobbalkalmas", label: "Többalkalmas program" },
  { value: "eloadas", label: "Előadás" },
  { value: "vezetoi_egyeni", label: "Egyéni program vezetőknek" },
  { value: "egyeb", label: "Egyéb" },
] as const;

export const LOCATIONS = [
  { value: "nalunk", label: "Nálunk, a cégnél" },
  { value: "kulso", label: "Külső helyszínen" },
  { value: "online", label: "Online" },
] as const;

export const TIMINGS = [
  { value: "1_honapon_belul", label: "Egy hónapon belül" },
  { value: "1_3_honap", label: "1–3 hónapon belül" },
  { value: "3_6_honap", label: "3–6 hónapon belül" },
  { value: "kesobb", label: "Később" },
  { value: "nem_tudom", label: "Még nem tudjuk" },
] as const;

export const BUDGETS = [
  { value: "500e_alatt", label: "500 ezer Ft alatt" },
  { value: "500e_1_5m", label: "0,5–1,5 millió Ft" },
  { value: "1_5m_felett", label: "1,5 millió Ft fölött" },
  { value: "meg_nincs", label: "Még nincs keret" },
] as const;

export const INQUIRY_STATUS_LABEL: Record<string, string> = {
  uj: "Új",
  folyamatban: "Folyamatban",
  ajanlat_kiment: "Ajánlat elküldve",
  megnyert: "Megállapodtunk",
  nem_lett: "Nem lett belőle munka",
};

const labelOf = (list: readonly { value: string; label: string }[]) =>
  Object.fromEntries(list.map((o) => [o.value, o.label])) as Record<string, string>;
export const FORMAT_LABEL = labelOf(FORMATS);
export const LOCATION_LABEL = labelOf(LOCATIONS);
export const TIMING_LABEL = labelOf(TIMINGS);
export const BUDGET_LABEL = labelOf(BUDGETS);

const values = <T extends readonly { value: string }[]>(list: T) => list.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

export const inquirySchema = z.object({
  company_name: z.string().trim().min(2).max(200),
  hq_city: z.string().trim().min(2).max(120),
  company_size: z.coerce.number().int().min(1).max(1_000_000),
  participants: z.coerce.number().int().min(1).max(100_000).optional(),
  contact_name: z.string().trim().min(2).max(120),
  contact_role: z.string().trim().max(120).optional(),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(40).optional(),
  goal: z.string().trim().min(3).max(4000),
  formats: z.array(z.enum(values(FORMATS))).min(1),
  locations: z.array(z.enum(values(LOCATIONS))).min(1),
  timing: z.enum(values(TIMINGS)),
  budget: z.enum(values(BUDGETS)).optional(),
  privacy_consent: z.literal("on"),
});

export function inquiryInput(fd: FormData) {
  const str = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" && v.trim() !== "" ? v : undefined;
  };
  return {
    company_name: str("company_name"),
    hq_city: str("hq_city"),
    company_size: str("company_size"),
    participants: str("participants"),
    contact_name: str("contact_name"),
    contact_role: str("contact_role"),
    email: str("email"),
    phone: str("phone"),
    goal: str("goal"),
    formats: fd.getAll("formats").map(String),
    locations: fd.getAll("locations").map(String),
    timing: str("timing"),
    budget: str("budget"),
    privacy_consent: str("privacy_consent"),
  };
}
