"use server";

import { inquiryInput, inquirySchema, FORMAT_LABEL } from "@/lib/business";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { SITE } from "@/lib/site";

export type InquiryState = { status: "idle" } | { status: "done"; name: string } | { status: "error"; message: string };

export async function submitInquiry(_prev: InquiryState, fd: FormData): Promise<InquiryState> {
  // Robotcsapda
  if (typeof fd.get("website") === "string" && (fd.get("website") as string).length > 0) return { status: "done", name: "" };
  const parsed = inquirySchema.safeParse(inquiryInput(fd));
  if (!parsed.success) {
    const k = String(parsed.error.issues[0]?.path?.[0] ?? "");
    const message =
      k === "privacy_consent"
        ? "Kérlek, fogadd el az adatkezelési tájékoztatót."
        : k === "formats"
        ? "Kérlek, jelöld be, milyen forma érdekel titeket."
        : k === "locations"
        ? "Kérlek, jelöld be, hol tartanátok az alkalmat."
        : k === "email"
        ? "Kérlek, adj meg egy érvényes e-mail-címet."
        : k === "company_size" || k === "participants"
        ? "Kérlek, a létszámot számmal add meg."
        : "Kérlek, töltsd ki a kötelező mezőket.";
    return { status: "error", message };
  }
  const d = parsed.data;
  const { data: inq, error } = await createAdminClient().rpc("submit_business_inquiry", {
    p_company_name: d.company_name,
    p_hq_city: d.hq_city,
    p_company_size: d.company_size,
    p_participants: (d.participants ?? null) as unknown as number, // nem kötelező: NULL
    p_contact_name: d.contact_name,
    p_contact_role: d.contact_role ?? "",
    p_email: d.email,
    p_phone: d.phone ?? "",
    p_goal: d.goal,
    p_formats: d.formats,
    p_locations: d.locations,
    p_timing: d.timing,
    p_budget: d.budget ?? "",
    p_privacy_consent: true,
  });
  if (error || !inq) return { status: "error", message: "Most nem sikerült elküldeni. Kérlek, próbáld újra pár perc múlva." };

  const first = d.contact_name.split(/\s+/).slice(-1)[0];
  await sendEmail(
    SITE.adminEmail,
    `Céges ajánlatkérés – ${d.company_name}`,
    [
      `${d.contact_name}${d.contact_role ? ` (${d.contact_role})` : ""} ajánlatot kért: ${d.company_name}, ${d.hq_city}, ${d.company_size} fő.`,
      `Érdeklődés: ${d.formats.map((f) => FORMAT_LABEL[f]).join(", ")}.`,
      `Elérhetőség: ${d.email}${d.phone ? `, ${d.phone}` : ""}.`,
    ],
    { href: `${publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "")}/admin/ajanlatkeresek/${inq.id}`, label: "Megnézem az ajánlatkérést" },
  );
  await sendEmail(d.email, "Megkaptam az ajánlatkérésedet", [
    `Kedves ${first}!`,
    "Köszönöm, hogy a cégetek nevében megkerestél. Átnézem, amit írtál, és hamarosan jelentkezem egy személyre szabott ajánlattal, vagy előtte egy rövid egyeztető beszélgetésre hívlak.",
    "Ha addig bármit hozzátennél, válaszolj nyugodtan erre a levélre.",
  ]);
  return { status: "done", name: first };
}
