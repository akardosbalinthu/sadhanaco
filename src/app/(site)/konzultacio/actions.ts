"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { normalizeUtm } from "@/lib/application";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { SITE } from "@/lib/site";

export type RequestState = { status: "idle" } | { status: "error"; message: string };

const siteBase = () => publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
const adminBase = () => publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "");

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(6).max(40),
  problem: z.string().trim().min(3).max(4000),
  consent: z.literal("on"),
  utm_source: z.string().optional().transform(normalizeUtm),
});

const MESSAGES: Record<string, string> = {
  full_name: "Kérlek, add meg a neved.",
  email: "Kérlek, adj meg egy érvényes e-mail-címet.",
  phone: "Kérlek, add meg a telefonszámodat.",
  problem: "Kérlek, írd le röviden, min szeretnél változtatni.",
  consent: "A beküldéshez kérlek, fogadd el az adatkezelési tájékoztatót.",
};

/** Rövid konzultációkérés: név, e-mail, telefon, egy kérdés – utána időpontválasztás. */
export async function submitConsultationRequest(_prev: RequestState, fd: FormData): Promise<RequestState> {
  // Csapda a robotoknak: ember ezt a mezőt nem látja és nem tölti ki.
  if (typeof fd.get("website") === "string" && (fd.get("website") as string).length > 0) redirect("/");
  const str = (k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : undefined);
  const parsed = schema.safeParse({
    full_name: str("full_name"),
    email: str("email"),
    phone: str("phone"),
    problem: str("problem"),
    consent: str("consent"),
    utm_source: str("utm_source") || undefined,
  });
  if (!parsed.success) {
    const k = String(parsed.error.issues[0]?.path?.[0] ?? "");
    return { status: "error", message: MESSAGES[k] ?? "Kérlek, ellenőrizd a megadott adatokat." };
  }
  const d = parsed.data;
  const admin = createAdminClient();
  const { data: app, error } = await admin.rpc("submit_consultation_request", {
    p_full_name: d.full_name,
    p_email: d.email,
    p_phone: d.phone,
    p_problem: d.problem,
    p_consent: true,
  });
  if (error || !app) {
    return { status: "error", message: "Most nem sikerült elküldeni. Kérlek, próbáld újra pár perc múlva." };
  }
  if (d.utm_source) {
    // A forrás csak statisztika: ha a mentése nem sikerül, a kérés attól még rendben van.
    await admin.from("applications").update({ utm_source: d.utm_source }).eq("id", app.id);
  }

  const first = d.full_name.split(/\s+/).slice(-1)[0];
  const bookingUrl = `${siteBase()}/jelentkezes/idopont?t=${app.token}`;

  await sendEmail(
    SITE.adminEmail,
    `Konzultációt kért – ${d.full_name}`,
    [`${d.full_name} konzultációt kért az Acélidegek Mentorprogramra.`, "A részleteket az admin felületen látod."],
    { href: `${adminBase()}/admin/jelentkezesek/${app.id}`, label: "Megnézem a jelentkezést" },
  );

  // Ha most nem választ időpontot, a levélből később is megteheti.
  await sendEmail(
    d.email,
    "A konzultációs időpontod",
    [
      `Kedves ${first}!`,
      "Köszönöm, hogy jelentkeztél. Ha még nem választottál időpontot az ingyenes, 30 perces online konzultációhoz, az alábbi gombbal bármikor megteheted.",
      "A válaszodat a beszélgetés előtt átolvasom, így rögtön a lényegről beszélhetünk.",
    ],
    { href: bookingUrl, label: "Időpontot választok" },
  );

  redirect(`/jelentkezes/idopont?t=${app.token}`);
}
