"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { publicEnv } from "@/lib/env";
import { isProgramPlan } from "@/lib/program-payment";

const back = (t: string, msg: string): never => redirect(`/fizetes?t=${encodeURIComponent(t)}&hiba=${encodeURIComponent(msg)}`);

/** Az egyéni program fizetése: hozzájárulások rögzítése → Stripe Checkout (egyszeri vagy havi részletek). */
export async function startProgramCheckout(fd: FormData) {
  const token = String(fd.get("t") ?? "");
  const plan = String(fd.get("plan") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(token)) redirect("/");
  if (!isProgramPlan(plan)) back(token, "Kérlek, válassz fizetési módot.");
  if (fd.get("terms") !== "on") back(token, "A fizetéshez kérlek, fogadd el az ÁSZF-et és az adatkezelési tájékoztatót.");
  if (fd.get("early_start") !== "on") back(token, "Kérlek, jelöld be, hogy a program az elállási határidőn belül induljon.");

  const admin = createAdminClient();
  const { data: offer } = await admin.from("program_payment_offers").select("id, email, status").eq("token", token).maybeSingle();
  if (!offer) redirect("/");
  if (offer.status !== "kikuldve") redirect(`/fizetes?t=${encodeURIComponent(token)}`);

  const stripe = getStripe();
  const { data: prices } = await stripe.prices.list({ lookup_keys: [plan], active: true, limit: 1 });
  const price = prices[0];
  if (!price) back(token, "A fizetés most nem indítható. Kérlek, írj nekem, és segítek.");

  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const metadata = { kind: "program", offer_id: offer.id, plan };
  const common = {
    locale: "hu" as const,
    customer_email: offer.email,
    billing_address_collection: "required" as const,
    tax_id_collection: { enabled: false },
    line_items: [{ price: price.id, quantity: 1 }],
    metadata,
    success_url: `${base}/fizetes?t=${token}&fizetes=sikeres`,
    cancel_url: `${base}/fizetes?t=${token}`,
  };
  const session =
    price.type === "recurring"
      ? await stripe.checkout.sessions.create({ ...common, mode: "subscription", subscription_data: { metadata } })
      : await stripe.checkout.sessions.create({ ...common, mode: "payment", customer_creation: "always", payment_intent_data: { metadata } });

  const h = await headers();
  const { data: settings } = await admin.from("app_settings").select("terms_version").single();
  await Promise.all([
    admin.from("purchase_consents").insert({
      email: offer.email,
      consent_kind: "program_early_start",
      product_code: plan,
      terms_version: settings?.terms_version ?? "ismeretlen",
      stripe_checkout_session_id: session.id,
      ip_address: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: h.get("user-agent"),
    }),
    admin.from("program_payment_offers").update({ stripe_checkout_session_id: session.id }).eq("id", offer.id),
  ]);
  redirect(session.url!);
}
