import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { hufFromStripe, isPlanCode, PLANS, type PlanCode } from "./plans";
import { eventPriceCode } from "@/lib/events";

type Admin = SupabaseClient<Database>;

/** A feldolgozó külső függőségei – a tesztekben helyettesíthetők. */
export interface WebhookDeps {
  admin: Admin;
  /** Ár azonosító → { lookup_key, egységár (Stripe-egységben) } */
  resolvePrice: (priceId: string) => Promise<{ code: string | null; unitAmount: number | null }>;
  /** Előfizetés lekérése a fizetési móddal együtt (próbaidő-ellenőrzéshez). */
  getSubscription: (id: string) => Promise<Stripe.Subscription>;
  /** A próbaidő azonnali lezárása (ha az e-mail vagy a kártya már kapott próbát). */
  endTrialNow: (subscriptionId: string) => Promise<void>;
  /** Üdvözlő levél belépő linkkel. */
  sendWelcome: (email: string) => Promise<void>;
  /** Értesítés sikertelen terhelésről. */
  sendPaymentFailed: (email: string) => Promise<void>;
  /** Egyéni program: az előfizetés lezárása a részletek számának megfelelő időpontban. */
  setSubscriptionEnd: (subscriptionId: string, installments: number) => Promise<void>;
  /** Egyéni program: üdvözlő levél (belépő linkkel) és értesítő Bálintnak. */
  sendProgramWelcome: (email: string, name: string, startsOn: string, created: boolean) => Promise<void>;
  /** Egyéni program: sikertelen részlet — levél az ügyfélnek és Bálintnak. */
  sendProgramPaymentFailed: (email: string, name: string) => Promise<void>;
}

const PROGRAM_INSTALLMENTS: Record<string, number> = {
  egyeni_program_egyben: 1,
  egyeni_program_4_reszlet: 4,
  egyeni_program_havi: 8,
};
const isProgramCode = (c: string | null | undefined): c is string => !!c && c in PROGRAM_INSTALLMENTS;

const iso = (unix: number | null | undefined) => (unix ? new Date(unix * 1000).toISOString() : null);
const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : v?.id ?? null);

/** Megkeresi vagy létrehozza a tagot a Stripe-ban megadott e-mail-cím alapján. */
type Names = { last_name?: string | null; first_name?: string | null };

/** A csatlakozáskor megadott nevet csak akkor írjuk be, ha a profilban még nincs név. */
async function fillMissingNames(admin: Admin, id: string, names?: Names) {
  const last = names?.last_name?.trim().slice(0, 60);
  const first = names?.first_name?.trim().slice(0, 60);
  if (!last || !first) return;
  await admin.from("profiles").update({ last_name: last, first_name: first }).eq("id", id).is("last_name", null).is("first_name", null);
}

export async function ensureUser(admin: Admin, email: string | null | undefined, customerId: string | null, names?: Names) {
  if (customerId) {
    const { data } = await admin.from("profiles").select("id, email").eq("stripe_customer_id", customerId).maybeSingle();
    if (data) {
      await fillMissingNames(admin, data.id, names);
      return { id: data.id, email: data.email, created: false };
    }
  }
  const normalized = email?.trim().toLowerCase();
  if (!normalized) throw new Error("A Stripe-eseményben nincs e-mail-cím.");

  const { data: existing } = await admin.from("profiles").select("id, email, stripe_customer_id").eq("email", normalized).maybeSingle();
  if (existing) {
    if (customerId && !existing.stripe_customer_id) {
      await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", existing.id);
    }
    await fillMissingNames(admin, existing.id, names);
    return { id: existing.id, email: existing.email, created: false };
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: normalized,
    email_confirm: true,
    user_metadata: { last_name: names?.last_name ?? undefined, first_name: names?.first_name ?? undefined },
  });
  if (error || !created.user) throw new Error(`A fiók létrehozása nem sikerült: ${error?.message}`);
  if (customerId) {
    await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", created.user.id);
  }
  return { id: created.user.id, email: normalized, created: true };
}

/** A számlázandó tétel rögzítése (kézi számlázás; ebből készül a KATA/OSS-összesítő). */
async function recordInvoice(
  admin: Admin,
  row: { userId: string | null; code: string; amount: number; country: string | null; stripeInvoiceId: string | null; paymentIntentId: string | null },
) {
  if (row.amount <= 0) return null;
  const country = (row.country ?? "HU").toUpperCase().slice(0, 2);
  const [{ data: settings }, { data: region }, { data: price }] = await Promise.all([
    admin.from("app_settings").select("billing_entity, invoice_provider").single(),
    admin.rpc("revenue_region_for", { p_country: country }),
    admin.from("price_catalog").select("label").eq("code", row.code).maybeSingle(),
  ]);
  const { data: saved, error } = await admin.from("invoices").upsert(
    {
      user_id: row.userId,
      stripe_invoice_id: row.stripeInvoiceId,
      stripe_payment_intent_id: row.paymentIntentId,
      product_code: row.code,
      description: price?.label ?? row.code,
      amount_huf: row.amount,
      country,
      region: region ?? "HU",
      invoice_provider: settings?.invoice_provider ?? "manual",
      billing_entity: settings?.billing_entity ?? {},
    },
    { onConflict: "stripe_invoice_id", ignoreDuplicates: true },
  ).select("id");
  if (error) throw new Error(`A számlatétel rögzítése nem sikerült: ${error.message}`);
  return saved?.[0]?.id ?? null;
}

async function rpcOrThrow(p: PromiseLike<{ error: { message: string } | null }>, what: string) {
  const { error } = await p;
  if (error) throw new Error(`${what}: ${error.message}`);
}

/** Egyéni program: sikeres első fizetés → fiók, program, (részletnél) az előfizetés vége, számlatétel, levelek. */
async function onProgramCheckout(s: Stripe.Checkout.Session, d: WebhookDeps) {
  const offerId = s.metadata?.offer_id;
  const plan = s.metadata?.plan;
  if (s.payment_status !== "paid" || !offerId || !isProgramCode(plan)) return;
  const { data: offer } = await d.admin.from("program_payment_offers").select("full_name, email, starts_on").eq("id", offerId).maybeSingle();
  if (!offer) throw new Error(`Ismeretlen fizetési ajánlat: ${offerId}`);
  const parts = offer.full_name.trim().split(/\s+/);
  const names = parts.length > 1 ? { last_name: parts[0], first_name: parts.slice(1).join(" ") } : { first_name: parts[0] };
  const email = (s.customer_details?.email ?? s.customer_email ?? offer.email).toLowerCase();
  const customerId = idOf(s.customer);
  const subscriptionId = idOf(s.subscription);
  const user = await ensureUser(d.admin, email, customerId, names);
  await d.admin.from("profiles").update({ country: s.customer_details?.address?.country ?? null }).eq("id", user.id).is("country", null);
  await d.admin.from("purchase_consents").update({ user_id: user.id }).eq("stripe_checkout_session_id", s.id);

  const { error } = await d.admin.rpc("program_payment_completed", {
    p_offer_id: offerId,
    p_user_id: user.id,
    p_plan: plan,
    p_customer: customerId ?? "",
    p_subscription: subscriptionId ?? "",
  });
  if (error) throw new Error(`A program rögzítése nem sikerült: ${error.message}`);

  if (subscriptionId) {
    // Pontosan N részlet: az előfizetés a kezdéstől számított N. hónap végén magától lezárul.
    await d.setSubscriptionEnd(subscriptionId, PROGRAM_INSTALLMENTS[plan]);
  } else {
    const pi = idOf(s.payment_intent);
    const { data: existing } = pi ? await d.admin.from("invoices").select("id").eq("stripe_payment_intent_id", pi).limit(1) : { data: [] };
    if (!existing?.length) {
      await recordInvoice(d.admin, {
        userId: user.id,
        code: plan,
        amount: hufFromStripe(s.amount_total ?? 0),
        country: s.customer_details?.address?.country ?? null,
        stripeInvoiceId: null,
        paymentIntentId: pi,
      });
    }
  }
  await d.sendProgramWelcome(user.email, offer.full_name, offer.starts_on, user.created);
}

/** Az előfizetés egyéni programhoz tartozik-e (a Checkout a metaadatba írja). */
const subscriptionKind = (inv: Stripe.Invoice) => inv.parent?.subscription_details?.metadata?.kind ?? null;

async function onProgramInvoicePaid(inv: Stripe.Invoice, d: WebhookDeps) {
  const subId = idOf(inv.parent?.subscription_details?.subscription ?? null);
  if (!subId || (inv.amount_paid ?? 0) <= 0) return;
  const { data: enrollmentId, error } = await d.admin.rpc("program_installment_paid", { p_subscription: subId });
  if (error) throw new Error(`A részlet rögzítése nem sikerült: ${error.message}`);
  // Ha a Checkout-esemény még nem futott le, a Stripe később újrapróbálja ezt az eseményt.
  if (!enrollmentId) throw new Error(`A részlethez még nincs program rögzítve (${subId}).`);
  const { data: e } = await d.admin.from("program_enrollments").select("user_id, payment_plan").eq("id", enrollmentId).single();
  const { data: profile } = await d.admin.from("profiles").select("country").eq("id", e!.user_id).single();
  await recordInvoice(d.admin, {
    userId: e!.user_id,
    code: e!.payment_plan ?? "egyeni_program_havi",
    amount: hufFromStripe(inv.amount_paid),
    country: inv.customer_address?.country ?? profile?.country ?? null,
    stripeInvoiceId: inv.id ?? null,
    paymentIntentId: null,
  });
}

async function onProgramPaymentFailed(inv: Stripe.Invoice, d: WebhookDeps) {
  const subId = idOf(inv.parent?.subscription_details?.subscription ?? null);
  if (!subId) return;
  const { data: first, error } = await d.admin.rpc("program_installment_failed", { p_subscription: subId });
  if (error) throw new Error(`A sikertelen részlet rögzítése nem sikerült: ${error.message}`);
  if (!first) return;
  const { data: e } = await d.admin
    .from("program_enrollments")
    .select("profiles(email, first_name, last_name)")
    .eq("stripe_subscription_id", subId)
    .maybeSingle();
  const p = e?.profiles as unknown as { email: string; first_name: string | null; last_name: string | null } | null;
  if (p?.email) await d.sendProgramPaymentFailed(p.email, [p.last_name, p.first_name].filter(Boolean).join(" ") || p.email);
}

async function onCheckoutCompleted(s: Stripe.Checkout.Session, d: WebhookDeps) {
  const kind = s.metadata?.kind;

  if (kind === "program") {
    await onProgramCheckout(s, d);
    return;
  }

  if (kind === "open_evening_guest") {
    if (s.payment_status !== "paid" || !s.metadata?.registration_id) return;
    await rpcOrThrow(d.admin.rpc("confirm_registration_payment", { p_registration_id: s.metadata.registration_id }), "Foglalás megerősítése");
    await recordInvoice(d.admin, {
      userId: null,
      code: "nyilt_est_kulsos",
      amount: hufFromStripe(s.amount_total ?? 0),
      country: s.customer_details?.address?.country ?? null,
      stripeInvoiceId: null,
      paymentIntentId: idOf(s.payment_intent),
    });
    return;
  }

  if (kind === "member_event") {
    if (s.payment_status !== "paid" || !s.metadata?.registration_id) return;
    const regId = s.metadata.registration_id;
    const { data: reg } = await d.admin
      .from("event_registrations")
      .select("user_id, tier_at_booking, events(kind)")
      .eq("id", regId)
      .maybeSingle();
    if (!reg) throw new Error(`Ismeretlen foglalás: ${regId}`);
    await rpcOrThrow(d.admin.rpc("confirm_registration_payment", { p_registration_id: regId }), "Tagi foglalás megerősítése");
    const pi = idOf(s.payment_intent);
    // Ismételt esemény esetén ne legyen második számlatétel ugyanarra a fizetésre.
    const { data: existing } = pi ? await d.admin.from("invoices").select("id").eq("stripe_payment_intent_id", pi).limit(1) : { data: [] };
    if (!existing?.length) {
      const kindOfEvent = (reg.events as unknown as { kind: Parameters<typeof eventPriceCode>[0] }).kind;
      await recordInvoice(d.admin, {
        userId: reg.user_id,
        code: eventPriceCode(kindOfEvent, reg.tier_at_booking) ?? "elvonulas",
        amount: hufFromStripe(s.amount_total ?? 0),
        country: s.customer_details?.address?.country ?? null,
        stripeInvoiceId: null,
        paymentIntentId: pi,
      });
    }
    return;
  }

  if (kind === "stage_purchase") {
    const code = s.metadata?.code;
    const userId = s.metadata?.user_id;
    if (s.payment_status !== "paid" || !code || !userId) return;
    // Idempotens: a jelzők csak bekapcsolódnak (OR), a tétel fizetésenként egyszer rögzül.
    await rpcOrThrow(d.admin.rpc("membership_stage_purchased", { p_user: userId, p_code: code }), "Gyorsított hozzáférés rögzítése");
    const pi = idOf(s.payment_intent);
    const { data: existing } = pi ? await d.admin.from("invoices").select("id").eq("stripe_payment_intent_id", pi).limit(1) : { data: [] };
    if (!existing?.length) {
      await recordInvoice(d.admin, {
        userId,
        code,
        amount: hufFromStripe(s.amount_total ?? 0),
        country: s.customer_details?.address?.country ?? null,
        stripeInvoiceId: null,
        paymentIntentId: pi,
      });
    }
    return;
  }

  if (kind === "consultation") {
    if (s.payment_status !== "paid" || !s.metadata?.consultation_id) return;
    const id = s.metadata.consultation_id;
    const { data: c } = await d.admin.from("consultations").select("user_id, invoice_id").eq("id", id).maybeSingle();
    if (!c) throw new Error(`Ismeretlen konzultáció: ${id}`);
    if (!c.invoice_id) {
      const { data: p } = await d.admin.from("profiles").select("tier").eq("id", c.user_id).single();
      const invoiceId = await recordInvoice(d.admin, {
        userId: c.user_id,
        code: p?.tier === "belso_kor" ? "konzultacio_belso_kor" : "konzultacio_tarsasagi",
        amount: hufFromStripe(s.amount_total ?? 0),
        country: s.customer_details?.address?.country ?? null,
        stripeInvoiceId: null,
        paymentIntentId: idOf(s.payment_intent),
      });
      if (invoiceId) await d.admin.from("consultations").update({ invoice_id: invoiceId }).eq("id", id);
    }
    await rpcOrThrow(d.admin.rpc("confirm_paid_consultation", { p_consultation: id }), "Konzultáció véglegesítése");
    return;
  }

  if (kind === "kind_message") {
    if (s.payment_status !== "paid" || !s.metadata?.message_id) return;
    const messageId = s.metadata.message_id;
    // Idempotens: az ismételt esemény nem rögzít új tételt (a stripe_events is szűr).
    const { data: msg } = await d.admin.from("kind_messages").select("status, sender_id, invoice_id").eq("id", messageId).maybeSingle();
    if (!msg) throw new Error(`Ismeretlen Kedves Üzenet: ${messageId}`);
    if (!msg.invoice_id) {
      const invoiceId = await recordInvoice(d.admin, {
        userId: msg.sender_id,
        code: "kedves_uzenet_extra",
        amount: hufFromStripe(s.amount_total ?? 0),
        country: s.customer_details?.address?.country ?? null,
        stripeInvoiceId: null,
        paymentIntentId: idOf(s.payment_intent),
      });
      // Azonnal az üzenethez kötjük, hogy egy újrapróbált esemény ne rögzítsen második tételt.
      if (invoiceId) await d.admin.from("kind_messages").update({ invoice_id: invoiceId }).eq("id", messageId);
    }
    await rpcOrThrow(d.admin.rpc("confirm_paid_kind_message", { p_message: messageId }), "Kedves Üzenet sorba állítása");
    return;
  }

  if (kind !== "membership") return;
  const email = (s.customer_details?.email ?? s.customer_email ?? "").toLowerCase();
  const customerId = idOf(s.customer);
  const subscriptionId = idOf(s.subscription);
  const user = await ensureUser(d.admin, email, customerId, { last_name: s.metadata?.last_name, first_name: s.metadata?.first_name });

  await d.admin
    .from("profiles")
    .update({ stripe_subscription_id: subscriptionId, country: s.customer_details?.address?.country ?? null })
    .eq("id", user.id);
  await d.admin.from("purchase_consents").update({ user_id: user.id }).eq("stripe_checkout_session_id", s.id);

  if (subscriptionId) {
    const sub = await d.getSubscription(subscriptionId);
    if (sub.status === "trialing") {
      const pm = sub.default_payment_method;
      const fingerprint = typeof pm === "object" && pm ? pm.card?.fingerprint ?? null : null;
      const { data: byEmail } = await d.admin.from("trial_usage").select("id").eq("email_normalized", email).limit(1);
      const { data: byCard } = fingerprint
        ? await d.admin.from("trial_usage").select("id").eq("card_fingerprint", fingerprint).limit(1)
        : { data: [] };
      let allowed = (byEmail?.length ?? 0) === 0 && (byCard?.length ?? 0) === 0;
      if (allowed) {
        const { error } = await d.admin.from("trial_usage").insert({
          email_normalized: email,
          card_fingerprint: fingerprint,
          user_id: user.id,
          stripe_subscription_id: subscriptionId,
        });
        allowed = !error; // párhuzamos ütközés esetén nincs második próba
      }
      if (allowed) {
        await rpcOrThrow(
          d.admin.rpc("membership_trial_started", { p_user: user.id, p_trial_end: iso(sub.trial_end)! }),
          "Próbaidő indítása",
        );
      } else {
        await d.endTrialNow(subscriptionId); // a terhelés után az invoice.paid aktiválja a tagságot
      }
    }
  }

  await d.sendWelcome(user.email);
}

/** A számla előfizetési tétele: a legkésőbbi időszakú, tagsági csomaghoz tartozó sor. */
async function membershipLine(inv: Stripe.Invoice, d: WebhookDeps) {
  let best: { code: PlanCode; unitAmount: number | null; periodEnd: number } | null = null;
  for (const line of inv.lines?.data ?? []) {
    const priceId = idOf(line.pricing?.price_details?.price ?? null);
    if (!priceId || line.amount < 0) continue;
    const { code, unitAmount } = await d.resolvePrice(priceId);
    if (!isPlanCode(code)) continue;
    if (!best || line.period.end > best.periodEnd) best = { code, unitAmount, periodEnd: line.period.end };
  }
  return best;
}

async function onInvoicePaid(inv: Stripe.Invoice, d: WebhookDeps) {
  if (subscriptionKind(inv) === "program") {
    await onProgramInvoicePaid(inv, d);
    return;
  }
  if ((inv.amount_paid ?? 0) <= 0) return; // a próbaidő 0 Ft-os nyitó számlája
  if (!inv.parent?.subscription_details?.subscription) return;
  const line = await membershipLine(inv, d);
  if (!line) return;

  const user = await ensureUser(d.admin, inv.customer_email, idOf(inv.customer));
  const plan = PLANS[line.code];
  await rpcOrThrow(
    d.admin.rpc("membership_payment_succeeded", {
      p_user: user.id,
      p_tier: plan.tier,
      p_interval: plan.interval,
      p_period_end: iso(line.periodEnd)!,
      p_amount_huf: hufFromStripe(line.unitAmount ?? inv.amount_paid),
    }),
    "Sikeres fizetés rögzítése",
  );
  const { data: profile } = await d.admin.from("profiles").select("country").eq("id", user.id).single();
  await recordInvoice(d.admin, {
    userId: user.id,
    code: line.code,
    amount: hufFromStripe(inv.amount_paid),
    country: inv.customer_address?.country ?? profile?.country ?? null,
    stripeInvoiceId: inv.id ?? null,
    paymentIntentId: null,
  });
}

async function userByCustomer(admin: Admin, customer: string | { id: string } | null) {
  const id = idOf(customer);
  if (!id) return null;
  const { data } = await admin.from("profiles").select("id, email").eq("stripe_customer_id", id).maybeSingle();
  return data;
}

async function onPaymentFailed(inv: Stripe.Invoice, d: WebhookDeps) {
  if (subscriptionKind(inv) === "program") {
    await onProgramPaymentFailed(inv, d);
    return;
  }
  const user = await userByCustomer(d.admin, inv.customer);
  if (!user) return;
  const { data: first, error } = await d.admin.rpc("membership_payment_failed", { p_user: user.id });
  if (error) throw new Error(`Sikertelen terhelés rögzítése: ${error.message}`);
  if (first) await d.sendPaymentFailed(user.email);
}

async function onSubscriptionUpdated(sub: Stripe.Subscription, d: WebhookDeps) {
  if (sub.metadata?.kind === "program") return; // a program előfizetése nem tagság
  const user = await userByCustomer(d.admin, sub.customer);
  if (!user) return;
  await d.admin
    .from("profiles")
    .update({ cancel_at_period_end: sub.cancel_at_period_end, stripe_subscription_id: sub.id })
    .eq("id", user.id);
}

async function onSubscriptionDeleted(sub: Stripe.Subscription, d: WebhookDeps) {
  // A program előfizetése a részletek után magától lezárul; a program ettől nem ér véget.
  if (sub.metadata?.kind === "program") return;
  const user = await userByCustomer(d.admin, sub.customer);
  if (!user) return;
  await rpcOrThrow(d.admin.rpc("membership_ended", { p_user: user.id }), "Tagság lezárása");
}

async function onDispute(dispute: Stripe.Dispute, d: WebhookDeps) {
  await d.admin.from("admin_notifications").insert({
    kind: "chargeback",
    payload: { dispute_id: dispute.id, charge: idOf(dispute.charge), amount_huf: hufFromStripe(dispute.amount), reason: dispute.reason },
  });
}

/**
 * Idempotens feldolgozás: minden esemény egyszer fut le sikeresen (stripe_events).
 * Hiba esetén a hibát rögzítjük és továbbdobjuk – a Stripe később újrapróbálja.
 */
export async function processStripeEvent(event: Stripe.Event, d: WebhookDeps): Promise<"processed" | "duplicate" | "ignored"> {
  const { data: existing } = await d.admin.from("stripe_events").select("processed_at").eq("id", event.id).maybeSingle();
  if (existing?.processed_at) return "duplicate";
  if (!existing) {
    await d.admin.from("stripe_events").insert({ id: event.id, type: event.type, payload: event as unknown as Database["public"]["Tables"]["stripe_events"]["Insert"]["payload"] });
  }

  try {
    let handled = true;
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await onCheckoutCompleted(event.data.object, d);
        break;
      case "invoice.paid":
        await onInvoicePaid(event.data.object, d);
        break;
      case "invoice.payment_failed":
        await onPaymentFailed(event.data.object, d);
        break;
      case "customer.subscription.updated":
        await onSubscriptionUpdated(event.data.object, d);
        break;
      case "customer.subscription.deleted":
        await onSubscriptionDeleted(event.data.object, d);
        break;
      case "charge.dispute.created":
        await onDispute(event.data.object, d);
        break;
      default:
        handled = false;
    }
    await d.admin.from("stripe_events").update({ processed_at: new Date().toISOString(), error: null }).eq("id", event.id);
    return handled ? "processed" : "ignored";
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await d.admin.from("stripe_events").update({ error: message }).eq("id", event.id);
    throw e;
  }
}
