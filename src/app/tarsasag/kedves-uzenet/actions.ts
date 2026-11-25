"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getStripe, onlinePaymentsEnabled } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { firstIssue, kindMessageError, messageFields, wantsAnonymity, type FormState } from "@/lib/kind-message";
import { resolvedTarsasagUrl, tp } from "@/lib/site";

const schema = z.object({ ...messageFields, kind: z.enum(["priority", "standard", "paid"], { message: "Válaszd ki az üzenet fajtáját." }) });

/** Tagi üzenet: elsőbbségi a havi keretből, vagy díjmentes (megerősítés nélkül). */
export async function sendMemberMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };
  const d = parsed.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Kérlek, lépj be újra." };
  const { data: access } = await supabase.rpc("has_member_access");
  if (!access) return { status: "error", message: "Az üzenetküldés a Társaságból aktív tagsággal érhető el." };

  if (d.kind === "paid") return startPaidMessage(user.id, user.email ?? "", d, fd);

  let messageId: string | undefined;
  if (d.kind === "priority") {
    // A keret, a próbaidő és a tagság ellenőrzése az adatbázisban, atomi zárolással.
    const { data, error } = await supabase.rpc("send_free_kind_message", {
      p_recipient_name: d.recipient_name,
      p_recipient_phone: d.recipient_phone,
      p_message: d.message,
    });
    if (error) return { status: "error", message: kindMessageError(error.hint) };
    messageId = data?.id;
  } else {
    const { data, error } = await createAdminClient()
      .rpc("submit_kind_message", {
        p_recipient_name: d.recipient_name,
        p_recipient_phone: d.recipient_phone,
        p_message: d.message,
        p_sender: user.id,
      })
      .single();
    if (error) return { status: "error", message: kindMessageError(error.hint) };
    messageId = data?.message_id;
  }
  // A névtelenség jelölése nem állíthatja meg a már rögzített üzenetet; hiba esetén szólunk.
  const anonFailed =
    wantsAnonymity(fd) && messageId
      ? !!(await createAdminClient().rpc("set_kind_message_anonymous", { p_message_id: messageId, p_anonymous: true })).error
      : false;
  if (anonFailed) {
    revalidatePath(tp("/kedves-uzenet"));
    return {
      status: "done",
      message: `Az üzeneted ${d.recipient_name} részére bekerült a sorba, de a névtelenséget most nem sikerült rögzíteni. Kérlek, írj az info@akardosbalint.hu címre, és kézzel beállítom.`,
    };
  }
  revalidatePath(tp("/kedves-uzenet"));
  return {
    status: "done",
    message:
      d.kind === "priority"
        ? `Köszönöm! Az elsőbbségi üzeneted ${d.recipient_name} részére bekerült a sor elejére. Kézbesítési garanciával viszem: addig próbálom, amíg el nem érem.`
        : `Köszönöm! Az üzeneted ${d.recipient_name} részére bekerült a kézbesítési sorba.`,
  };
}

/**
 * Kereten felüli elsőbbségi üzenet: piszkozat „fizetésre vár” állapotban → elállási
 * nyilatkozat rögzítése → Stripe Checkout. A webhook állítja sorba a sikeres fizetés után.
 */
async function startPaidMessage(userId: string, email: string, d: z.infer<typeof schema>, fd: FormData): Promise<FormState> {
  if (!onlinePaymentsEnabled()) return { status: "error", message: "A fizetős üzenet hamarosan nyílik meg." };
  if (fd.get("waiver") !== "on") return { status: "error", message: "Kérlek, fogadd el az azonnali teljesítésről szóló nyilatkozatot." };
  const admin = createAdminClient();
  const [{ data: settings }, { data: product }, { data: profile }] = await Promise.all([
    admin.from("app_settings").select("kind_message_min_huf, terms_version").single(),
    admin.from("price_catalog").select("stripe_product_id, label").eq("code", "kedves_uzenet_extra").single(),
    admin.from("profiles").select("stripe_customer_id").eq("id", userId).single(),
  ]);
  const min = settings?.kind_message_min_huf ?? 1000;
  const amount = Number(String(fd.get("amount") ?? "").replace(/\s/g, ""));
  if (!Number.isInteger(amount) || amount < min || amount > 1_000_000) {
    return { status: "error", message: `Adj meg egy egész összeget, legalább ${min.toLocaleString("hu-HU", { useGrouping: "always" } as Intl.NumberFormatOptions)} Ft-ot.` };
  }

  const { data: messageId, error } = await admin.rpc("create_paid_kind_message", {
    p_sender: userId,
    p_recipient_name: d.recipient_name,
    p_recipient_phone: d.recipient_phone,
    p_message: d.message,
    p_amount_huf: amount,
  });
  if (!error && messageId && wantsAnonymity(fd)) {
    const { error: anonErr } = await admin.rpc("set_kind_message_anonymous", { p_message_id: messageId, p_anonymous: true });
    if (anonErr) {
      await admin.from("kind_messages").delete().eq("id", messageId).eq("status", "pending_payment");
      return { status: "error", message: kindMessageError(null) };
    }
  }
  if (error || !messageId) {
    return { status: "error", message: error?.hint === "AMOUNT_TOO_LOW" ? `Az összeg legalább ${min.toLocaleString("hu-HU", { useGrouping: "always" } as Intl.NumberFormatOptions)} Ft.` : kindMessageError(error?.hint) };
  }

  const base = resolvedTarsasagUrl().replace(/\/$/, "");
  const productData = product?.stripe_product_id
    ? { product: product.stripe_product_id }
    : { product_data: { name: product?.label ?? "Elsőbbségi Kedves Üzenet" } };
  let session: Awaited<ReturnType<ReturnType<typeof getStripe>["checkout"]["sessions"]["create"]>>;
  try {
    session = await getStripe().checkout.sessions.create({
    mode: "payment",
    locale: "hu",
    ...(profile?.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: email, customer_creation: "always" as const }),
    billing_address_collection: "required",
    tax_id_collection: { enabled: false },
    line_items: [{ quantity: 1, price_data: { currency: "huf", unit_amount: amount * 100, ...productData } }],
    metadata: { kind: "kind_message", message_id: messageId, user_id: userId },
    payment_intent_data: { metadata: { kind: "kind_message", message_id: messageId } },
    success_url: `${base}/kedves-uzenet?fizetve=1`,
    cancel_url: `${base}/kedves-uzenet?megszakitva=1`,
    });
  } catch {
    // A piszkozatot azonnal töröljük (különben a napi takarítás vinné el).
    await admin.from("kind_messages").delete().eq("id", messageId).eq("status", "pending_payment");
    return { status: "error", message: "A fizetési oldal most nem nyílt meg. Kérlek, próbáld újra kicsit később." };
  }

  const h = await headers();
  await admin.from("purchase_consents").insert({
    user_id: userId,
    email,
    product_code: "kedves_uzenet_extra",
    terms_version: settings?.terms_version ?? "2026-11",
    stripe_checkout_session_id: session.id,
    ip_address: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    user_agent: h.get("user-agent"),
  });
  redirect(session.url!);
}
