"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, onlinePaymentsEnabled } from "@/lib/stripe";
import { budapestLocalToIso } from "@/lib/admin";
import { resolvedTarsasagUrl, tp } from "@/lib/site";

function back(msg: { ok?: string; hiba?: string }): never {
  const q = new URLSearchParams(Object.entries(msg).filter(([, v]) => v) as [string, string][]).toString();
  redirect(`${tp("/konzultacio")}?${q}`);
}

const ERR: Record<string, string> = {
  TRIAL_NOT_ALLOWED: "Konzultációt a próbaidő után lehet foglalni.",
  NOT_MEMBER: "Konzultációt aktív tagsággal lehet foglalni.",
  QUOTA_EXHAUSTED: "Ebben az évben már felhasználtad a díjmentes alkalmaidat.",
  INVALID_TIME: "Jövőbeli időpontot adj meg.",
};

/** Díjmentes konzultáció (A Belső Kör éves keretéből). Az időpont csak javaslat; Bálint visszajelez. */
export async function bookFreeConsultation(fd: FormData) {
  const note = z.string().trim().max(2000).safeParse(fd.get("note") ?? "");
  if (!note.success) back({ hiba: "A megjegyzés legfeljebb 2000 karakter lehet." });
  const when = budapestLocalToIso(String(fd.get("requested_for") ?? ""));
  const supabase = await createClient();
  const { error } = await supabase.rpc("book_free_consultation", {
    p_requested_for: when ?? undefined,
    p_note: note.data || undefined,
  });
  if (error) back({ hiba: ERR[error.hint ?? ""] ?? "A foglalás most nem sikerült. Kérlek, próbáld újra." });
  revalidatePath(tp("/konzultacio"));
  back({ ok: "Megkaptam a kérésed. Hamarosan jelentkezem, és egyeztetjük a pontos időpontot." });
}

/** Fizetős konzultáció: kérés „fizetésre vár” állapotban → elállási nyilatkozat → Stripe Checkout. */
export async function payConsultation(fd: FormData) {
  if (!onlinePaymentsEnabled()) back({ hiba: "Az online foglalás hamarosan nyílik." });
  if (fd.get("waiver") !== "on") back({ hiba: "Kérlek, fogadd el az azonnali teljesítésről szóló nyilatkozatot." });
  const note = z.string().trim().max(2000).safeParse(fd.get("note") ?? "");
  if (!note.success) back({ hiba: "A megjegyzés legfeljebb 2000 karakter lehet." });
  const when = budapestLocalToIso(String(fd.get("requested_for") ?? ""));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(tp("/belepes"));

  const admin = createAdminClient();
  const { data: row, error } = await admin.rpc("create_paid_consultation", {
    p_user: user.id,
    p_requested_for: when ?? undefined,
    p_note: note.data || undefined,
  });
  if (error || !row) back({ hiba: ERR[error?.hint ?? ""] ?? "A foglalás most nem sikerült. Kérlek, próbáld újra." });

  const { data: profile } = await admin.from("profiles").select("tier, stripe_customer_id, email").eq("id", user.id).single();
  const code = profile?.tier === "belso_kor" ? "konzultacio_belso_kor" : "konzultacio_tarsasagi";
  const [{ data: product }, { data: settings }] = await Promise.all([
    admin.from("price_catalog").select("stripe_product_id, label").eq("code", code).single(),
    admin.from("app_settings").select("terms_version").single(),
  ]);
  const base = resolvedTarsasagUrl().replace(/\/$/, "");
  const productData = product?.stripe_product_id ? { product: product.stripe_product_id } : { product_data: { name: product?.label ?? "1-on-1 konzultáció" } };
  let url: string | null = null;
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      locale: "hu",
      ...(profile?.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: profile?.email ?? user.email ?? undefined, customer_creation: "always" as const }),
      billing_address_collection: "required",
      tax_id_collection: { enabled: false },
      line_items: [{ quantity: 1, price_data: { currency: "huf", unit_amount: row.price_huf * 100, ...productData } }],
      metadata: { kind: "consultation", consultation_id: row.id, user_id: user.id },
      success_url: `${base}/konzultacio?ok=${encodeURIComponent("Köszönöm! A fizetés után megkapom a kérésed, és jelentkezem az időponttal.")}`,
      cancel_url: `${base}/konzultacio?hiba=${encodeURIComponent("A fizetés megszakadt, a foglalás nem jött létre.")}`,
    });
    url = session.url;
    const h = await headers();
    await admin.from("purchase_consents").insert({
      user_id: user.id,
      email: profile?.email ?? user.email ?? "",
      product_code: code,
      terms_version: settings?.terms_version ?? "2026-11",
      stripe_checkout_session_id: session.id,
      ip_address: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: h.get("user-agent"),
    });
  } catch {
    url = null;
  }
  if (!url) {
    await admin.from("consultations").delete().eq("id", row.id).eq("status", "pending_payment");
    back({ hiba: "A fizetési oldal most nem nyílt meg. Kérlek, próbáld újra kicsit később." });
  }
  redirect(url);
}
