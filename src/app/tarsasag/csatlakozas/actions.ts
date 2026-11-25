"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, onlinePaymentsEnabled } from "@/lib/stripe";
import { PLANS, isPlanCode } from "@/lib/billing/plans";
import { resolvedTarsasagUrl, SITE } from "@/lib/site";

export type JoinState = { status: "idle" } | { status: "error"; message: string };

const schema = z.object({
  plan: z.string().refine(isPlanCode),
  email: z.string().trim().toLowerCase().email(),
  last_name: z.string().trim().min(1).max(60),
  first_name: z.string().trim().min(1).max(60),
  waiver: z.literal("on"),
  terms: z.literal("on"),
});

/**
 * Csatlakozás: ellenőrzések → elállási nyilatkozat rögzítése → Stripe Checkout (előfizetés).
 * A tagságot a Stripe webhook aktiválja (a fizetéskor megadott e-mail-cím lesz a belépési cím).
 */
export async function startCheckout(_prev: JoinState, formData: FormData): Promise<JoinState> {
  const parsed = schema.safeParse({
    plan: formData.get("plan"),
    email: formData.get("email"),
    last_name: formData.get("last_name") ?? "",
    first_name: formData.get("first_name") ?? "",
    waiver: formData.get("waiver"),
    terms: formData.get("terms"),
  });
  if (!parsed.success) {
    const missing = (k: string) => parsed.error.issues.some((i) => i.path[0] === k);
    return {
      status: "error",
      message: missing("terms")
        ? "A csatlakozáshoz kérlek, fogadd el az ÁSZF-et és az adatkezelési tájékoztatót."
        : missing("waiver")
        ? "A csatlakozáshoz kérlek, fogadd el az azonnali teljesítésről szóló nyilatkozatot."
        : "Kérlek, válassz tagságot, add meg a neved és egy érvényes e-mail-címet.",
    };
  }
  if (!onlinePaymentsEnabled()) {
    return { status: "error", message: `Az online csatlakozás hamarosan nyílik. Addig írj nekem: ${SITE.email}` };
  }

  const { email } = parsed.data;
  const planCode = parsed.data.plan as keyof typeof PLANS;
  const plan = PLANS[planCode];
  const admin = createAdminClient();

  const { data: settings } = await admin.from("app_settings").select("registration_open, trial_days, terms_version").single();
  if (!settings?.registration_open) {
    return { status: "error", message: "A jelentkezés jelenleg szünetel. Kérlek, nézz vissza később." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("tier, subscription_status, stripe_customer_id")
    .eq("email", email)
    .maybeSingle();
  if (profile && profile.tier !== "none" && ["active", "trialing", "past_due"].includes(profile.subscription_status)) {
    return { status: "error", message: "Ezzel az e-mail-címmel már tag vagy. Lépj be, és a fiókodban válthatsz tagságot." };
  }

  let trialDays = 0;
  if (plan.trial && settings.trial_days > 0) {
    const { data: used } = await admin.from("trial_usage").select("id").eq("email_normalized", email).limit(1);
    if (!used || used.length === 0) trialDays = settings.trial_days;
  }

  const stripe = getStripe();
  const prices = await stripe.prices.list({ lookup_keys: [planCode], active: true, limit: 1 });
  const price = prices.data[0];
  if (!price) return { status: "error", message: "Most nem sikerült. Kérlek, próbáld újra később." };

  const base = resolvedTarsasagUrl().replace(/\/$/, "");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    locale: "hu",
    line_items: [{ price: price.id, quantity: 1 }],
    ...(profile?.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: email }),
    billing_address_collection: "required",
    tax_id_collection: { enabled: false },
    payment_method_collection: "always",
    allow_promotion_codes: false,
    subscription_data: {
      ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
      metadata: { plan: planCode },
    },
    metadata: { kind: "membership", plan: planCode, last_name: parsed.data.last_name, first_name: parsed.data.first_name },
    success_url: `${base}/csatlakozas/koszonjuk`,
    cancel_url: `${base}/csatlakozas?csomag=${planCode}`,
  });

  const h = await headers();
  await admin.from("purchase_consents").insert({
    email,
    product_code: planCode,
    terms_version: settings.terms_version,
    stripe_checkout_session_id: session.id,
    ip_address: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    user_agent: h.get("user-agent"),
  });

  redirect(session.url!);
}
