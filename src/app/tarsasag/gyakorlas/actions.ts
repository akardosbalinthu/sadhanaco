"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, onlinePaymentsEnabled } from "@/lib/stripe";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolvedTarsasagUrl, tp } from "@/lib/site";

/** Mai gyakorlás pipálása / visszavonása. A jogosultságot az RLS ellenőrzi (csak elérhető lecke). */
export async function toggleCompletion(formData: FormData) {
  const lessonId = z.string().uuid().safeParse(formData.get("lessonId"));
  if (!lessonId.success) return;
  const supabase = await createClient();
  const { data: today } = await supabase.rpc("budapest_today");
  const { data: existing } = await supabase
    .from("lesson_completions")
    .select("id")
    .eq("lesson_id", lessonId.data)
    .eq("practiced_on", today as string)
    .maybeSingle();
  if (existing) {
    await supabase.from("lesson_completions").delete().eq("id", existing.id);
  } else {
    await supabase.from("lesson_completions").insert({ lesson_id: lessonId.data });
  }
  revalidatePath(tp("/gyakorlas"), "layout");
}

export async function requestProgression(formData: FormData) {
  const note = String(formData.get("note") ?? "").slice(0, 2000) || null;
  const supabase = await createClient();
  await supabase.rpc("request_progression", { p_note: note ?? undefined });
  revalidatePath(tp("/gyakorlas"));
}

function fail(msg: string): never {
  redirect(`${tp("/gyakorlas")}?hiba=${encodeURIComponent(msg)}#tovabblepes`);
}

const ACCELERATION = ["gyorsitott_m2_ip2", "gyorsitott_ip3", "gyorsitott_m2_ip3_csomag"] as const;

/**
 * Gyorsított hozzáférés vásárlása (Stripe Checkout). A lépcső ettől sem nyílik meg
 * automatikusan: az előző lépcső elvégzése és egy rövid beszélgetés után Bálint nyitja.
 */
export async function buyAcceleration(formData: FormData) {
  const code = z.enum(ACCELERATION).safeParse(formData.get("code"));
  if (!code.success) fail("Ismeretlen csomag.");
  if (formData.get("waiver") !== "on") fail("Kérlek, fogadd el az azonnali teljesítésről szóló nyilatkozatot.");
  if (!onlinePaymentsEnabled()) fail("Az online vásárlás hamarosan nyílik.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(tp("/belepes"));
  const [{ data: profile }, { data: paying }] = await Promise.all([
    supabase.from("profiles").select("tier, m2_unlocked, ip3_unlocked, m2_purchased, ip3_purchased, stripe_customer_id, email").eq("id", user.id).single(),
    supabase.rpc("is_paying_member"),
  ]);
  if (!profile || !paying) fail("Gyorsított hozzáférést aktív, fizető tagsággal lehet vásárolni (próbaidő alatt még nem).");
  if (profile.tier === "belso_kor") fail("A Belső Kör tagjaként a teljes út külön díj nélkül a tiéd.");
  const allowed =
    code.data === "gyorsitott_ip3"
      ? profile.m2_unlocked && !profile.ip3_unlocked && !profile.ip3_purchased
      : !profile.m2_unlocked && !profile.m2_purchased && (code.data === "gyorsitott_m2_ip2" || !profile.ip3_purchased);
  if (!allowed) fail("Ez a csomag most nem vásárolható meg.");

  const admin = createAdminClient();
  const [{ data: item }, { data: settings }] = await Promise.all([
    admin.from("price_catalog").select("label, amount_huf, stripe_product_id, is_active").eq("code", code.data).single(),
    admin.from("app_settings").select("terms_version").single(),
  ]);
  if (!item?.is_active || item.amount_huf <= 0) fail("Ez a csomag most nem vásárolható meg.");
  const base = resolvedTarsasagUrl().replace(/\/$/, "");
  let url: string | null = null;
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      locale: "hu",
      ...(profile.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: profile.email, customer_creation: "always" as const }),
      billing_address_collection: "required",
      tax_id_collection: { enabled: false },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "huf",
            unit_amount: item.amount_huf * 100,
            ...(item.stripe_product_id ? { product: item.stripe_product_id } : { product_data: { name: item.label } }),
          },
        },
      ],
      metadata: { kind: "stage_purchase", code: code.data, user_id: user.id },
      success_url: `${base}/gyakorlas?ok=${encodeURIComponent("Köszönöm! A gyorsított hozzáférés a fizetés után rögzül.")}#tovabblepes`,
      cancel_url: `${base}/gyakorlas?hiba=${encodeURIComponent("A fizetés megszakadt, a vásárlás nem jött létre.")}#tovabblepes`,
    });
    url = session.url;
    const h = await headers();
    await admin.from("purchase_consents").insert({
      user_id: user.id,
      email: profile.email,
      product_code: code.data,
      terms_version: settings?.terms_version ?? "2026-11",
      stripe_checkout_session_id: session.id,
      ip_address: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: h.get("user-agent"),
    });
  } catch {
    url = null;
  }
  if (!url) fail("A fizetési oldal most nem nyílt meg. Kérlek, próbáld újra kicsit később.");
  redirect(url);
}
