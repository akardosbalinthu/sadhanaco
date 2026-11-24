/**
 * A Stripe webhook-feldolgozó integrációs tesztje a HELYI Supabase ellen, kitalált eseményekkel.
 * Futtatás: npm run test:webhook (előtte: npx supabase start)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { processStripeEvent, type WebhookDeps } from "@/lib/billing/webhook";

const admin = createAdminClient();
const run = randomUUID().slice(0, 8);
const emailA = `anna-${run}@example.test`;
const emailB = `bela-${run}@example.test`;
const custA = `cus_A_${run}`;
const custB = `cus_B_${run}`;
const subA = `sub_A_${run}`;
const subB = `sub_B_${run}`;
const now = Math.floor(Date.now() / 1000);

const calls = { welcome: [] as string[], failed: [] as string[], endTrial: [] as string[] };
const PRICES: Record<string, { code: string; unitAmount: number }> = {
  price_th: { code: "tarsasagi_havi", unitAmount: 994000 },
  price_bh: { code: "belso_kor_havi", unitAmount: 2794000 },
};
const deps: WebhookDeps = {
  admin,
  resolvePrice: async (id) => PRICES[id] ?? { code: null, unitAmount: null },
  getSubscription: async (id) =>
    ({ id, status: "trialing", trial_end: now + 7 * 86400, default_payment_method: { card: { fingerprint: "fp_SAME_" + run } } }) as unknown as Stripe.Subscription,
  endTrialNow: async (id) => void calls.endTrial.push(id),
  sendWelcome: async (e) => void calls.welcome.push(e),
  sendPaymentFailed: async (e) => void calls.failed.push(e),
};

let seq = 0;
const ev = (type: string, object: object) =>
  ({ id: `evt_${run}_${++seq}`, type, data: { object } }) as unknown as Stripe.Event;

const checkout = (email: string, customer: string, subscription: string) =>
  ev("checkout.session.completed", {
    id: `cs_${run}_${seq + 1}`, metadata: { kind: "membership", plan: "tarsasagi_havi", last_name: "Kovács", first_name: "Anna" },
    customer, subscription, customer_details: { email, address: { country: "HU" } },
  });

const invoice = (type: string, customer: string, email: string, price: string, amount: number, id = `in_${run}_${seq + 1}`) =>
  ev(type, {
    id, customer, customer_email: email, amount_paid: type === "invoice.paid" ? amount : 0,
    customer_address: { country: "HU" },
    parent: { subscription_details: { subscription: subA } },
    lines: { data: [{ amount, period: { end: now + 30 * 86400 }, pricing: { price_details: { price } } }] },
  });

const profile = async (email: string) =>
  (await admin.from("profiles").select("*").eq("email", email).single()).data!;

test("csatlakozás próbaidővel: fiók létrejön, próbaidő indul, üdvözlő levél megy", async () => {
  const e = checkout(emailA, custA, subA);
  assert.equal(await processStripeEvent(e, deps), "processed");
  const p = await profile(emailA);
  assert.equal(p.subscription_status, "trialing");
  assert.equal(p.tier, "tarsasagi");
  assert.equal(p.stripe_customer_id, custA);
  assert.equal(p.display_name, "Kovács Anna", "a csatlakozáskor megadott név");
  assert.deepEqual(calls.welcome, [emailA]);
  const { data: t } = await admin.from("trial_usage").select("card_fingerprint").eq("email_normalized", emailA).single();
  assert.equal(t?.card_fingerprint, "fp_SAME_" + run);
  assert.equal(await processStripeEvent(e, deps), "duplicate", "ugyanaz az esemény másodszor nem fut le");
});

test("ugyanazzal a kártyával második próbaidő nincs: a próbaidő azonnal lezárul", async () => {
  await processStripeEvent(checkout(emailB, custB, subB), deps);
  assert.deepEqual(calls.endTrial, [subB]);
  const p = await profile(emailB);
  assert.equal(p.subscription_status, "none", "a tagságot majd a sikeres terhelés aktiválja");
});

test("sikeres fizetés: aktív tagság, díjmentes keret, számlázandó tétel rögzítve", async () => {
  const e = invoice("invoice.paid", custA, emailA, "price_th", 994000);
  await processStripeEvent(e, deps);
  const p = await profile(emailA);
  assert.equal(p.subscription_status, "active");
  assert.equal(p.free_messages_remaining, 1);
  assert.equal(p.privat_kozlony_pro, true);
  const { data: inv } = await admin.from("invoices").select("amount_huf, region, product_code").eq("stripe_invoice_id", (e.data.object as { id: string }).id).single();
  assert.deepEqual(inv, { amount_huf: 9940, region: "HU", product_code: "tarsasagi_havi" });
});

test("szintváltás: a Belső Kör azonnal érvénybe lép, a különbözetnyi keret jóváíródik", async () => {
  await processStripeEvent(invoice("invoice.paid", custA, emailA, "price_bh", 1800000), deps);
  const p = await profile(emailA);
  assert.equal(p.tier, "belso_kor");
  assert.equal(p.free_messages_remaining, 3);
  assert.equal(p.recurring_amount_huf, 27940);
});

test("sikertelen terhelés: türelmi idő, egyszeri e-mail", async () => {
  await processStripeEvent(invoice("invoice.payment_failed", custA, emailA, "price_bh", 2794000), deps);
  await processStripeEvent(invoice("invoice.payment_failed", custA, emailA, "price_bh", 2794000), deps);
  const p = await profile(emailA);
  assert.equal(p.subscription_status, "past_due");
  assert.deepEqual(calls.failed, [emailA]);
});

test("lemondás a következő időszaktól, majd megszűnés", async () => {
  await processStripeEvent(ev("customer.subscription.updated", { id: subA, customer: custA, cancel_at_period_end: true }), deps);
  assert.equal((await profile(emailA)).cancel_at_period_end, true);
  await processStripeEvent(ev("customer.subscription.deleted", { id: subA, customer: custA }), deps);
  const p = await profile(emailA);
  assert.equal(p.tier, "none");
  assert.equal(p.subscription_status, "canceled");
});

test("visszaterhelés: admin-értesítés", async () => {
  const id = `dp_${run}`;
  await processStripeEvent(ev("charge.dispute.created", { id, charge: "ch_1", amount: 994000, reason: "fraudulent" }), deps);
  const { data } = await admin.from("admin_notifications").select("kind").eq("payload->>dispute_id", id);
  assert.equal(data?.[0]?.kind, "chargeback");
});

test("Nyílt Est külsős fizetése: a foglalás megerősítve, tétel rögzítve", async () => {
  const { data: event } = await admin
    .from("events")
    .insert({ kind: "nyilt_est", title: "Teszt est " + run, starts_at: new Date(Date.now() + 9 * 86400e3).toISOString(),
              capacity: 10, members_only: false, price_external_huf: 4940, registration_opens_at: new Date(Date.now() - 86400e3).toISOString(), is_published: true })
    .select("id").single();
  const { data: reg, error } = await admin.rpc("reserve_guest_seat", { p_event_id: event!.id, p_guest_name: "Vendég", p_guest_email: `vendeg-${run}@example.test` });
  assert.equal(error, null);
  await processStripeEvent(ev("checkout.session.completed", {
    id: `cs_guest_${run}`, payment_status: "paid", amount_total: 494000, payment_intent: `pi_${run}`,
    metadata: { kind: "open_evening_guest", registration_id: reg!.id }, customer_details: { address: { country: "AT" } },
  }), deps);
  const { data: after } = await admin.from("event_registrations").select("status").eq("id", reg!.id).single();
  assert.equal(after?.status, "confirmed");
  const { data: inv } = await admin.from("invoices").select("amount_huf, region").eq("stripe_payment_intent_id", `pi_${run}`).single();
  assert.deepEqual(inv, { amount_huf: 4940, region: "EU" });
});

test("visszatérő tag: a már megadott nevet a csatlakozás nem írja felül", async () => {
  const p = await profile(emailB);
  await admin.from("profiles").update({ last_name: "Nagy", first_name: "Béla", nickname: "Béci" }).eq("id", p.id);
  await processStripeEvent(checkout(emailB, custB, subB), deps);
  assert.equal((await profile(emailB)).display_name, 'Nagy Béla "Béci"');
});

test("kereten felüli Kedves Üzenet: fizetés után sorba áll, egy számlatétel, ismételt eseményre sem kettő", async () => {
  const sender = await profile(emailA);
  await admin.from("profiles").update({ tier: "tarsasagi", subscription_status: "active" }).eq("id", sender.id);
  const { data: msgId, error } = await admin.rpc("create_paid_kind_message", {
    p_sender: sender.id, p_recipient_name: "Anyu", p_recipient_phone: "+36301234567", p_message: "Köszönöm.", p_amount_huf: 5000,
  });
  assert.equal(error, null);
  const session = { id: `cs_km_${run}`, payment_status: "paid", amount_total: 500000, payment_intent: `pi_km_${run}`,
    metadata: { kind: "kind_message", message_id: msgId }, customer_details: { address: { country: "HU" } } };
  assert.equal(await processStripeEvent(ev("checkout.session.completed", session), deps), "processed");
  const { data: m } = await admin.from("kind_messages").select("status, invoice_id, amount_huf").eq("id", msgId!).single();
  assert.equal(m?.status, "queued");
  assert.ok(m?.invoice_id, "a számlatétel az üzenethez kötve");
  // Új esemény-azonosítóval érkező ismétlés (pl. async_payment_succeeded): nem rögzít újabb tételt.
  await processStripeEvent(ev("checkout.session.async_payment_succeeded", session), deps);
  const { data: invs } = await admin.from("invoices").select("amount_huf, product_code").eq("stripe_payment_intent_id", `pi_km_${run}`);
  assert.deepEqual(invs, [{ amount_huf: 5000, product_code: "kedves_uzenet_extra" }]);
});

test("tagi foglalás fizetése: a hely véglegessé válik, a tétel kódja szint szerint, ismétlésre sincs második", async () => {
  const member = await profile(emailA);
  await admin.from("profiles").update({ tier: "tarsasagi", subscription_status: "active" }).eq("id", member.id);
  const { data: event } = await admin.from("events").insert({
    kind: "gyakorlonap", title: "Gyakorlónap " + run, starts_at: new Date(Date.now() + 9 * 86400e3).toISOString(),
    capacity: 15, price_tarsasagi_huf: 6460, registration_opens_at: new Date(Date.now() - 86400e3).toISOString(), is_published: true,
  }).select("id").single();
  const { data: reg } = await admin.from("event_registrations").insert({
    event_id: event!.id, user_id: member.id, is_member_seat: true, tier_at_booking: "tarsasagi", price_huf: 6460,
    status: "pending_payment", hold_expires_at: new Date(Date.now() + 35 * 60e3).toISOString(),
  }).select("id").single();
  const session = { id: `cs_ev_${run}`, payment_status: "paid", amount_total: 646000, payment_intent: `pi_ev_${run}`,
    metadata: { kind: "member_event", registration_id: reg!.id }, customer_details: { address: { country: "HU" } } };
  assert.equal(await processStripeEvent(ev("checkout.session.completed", session), deps), "processed");
  await processStripeEvent(ev("checkout.session.async_payment_succeeded", session), deps);
  const { data: after } = await admin.from("event_registrations").select("status, hold_expires_at").eq("id", reg!.id).single();
  assert.deepEqual(after, { status: "confirmed", hold_expires_at: null });
  const { data: invs } = await admin.from("invoices").select("amount_huf, product_code").eq("stripe_payment_intent_id", `pi_ev_${run}`);
  assert.deepEqual(invs, [{ amount_huf: 6460, product_code: "gyakorlonap_tarsasagi" }]);
});

test("fizetős konzultáció: fizetés után kérésként jelenik meg, egy számlatétel", async () => {
  const member = await profile(emailA);
  await admin.from("profiles").update({ tier: "belso_kor", subscription_status: "active" }).eq("id", member.id);
  const { data: row, error } = await admin.rpc("create_paid_consultation", { p_user: member.id, p_note: "Téma" });
  assert.equal(error, null);
  const session = { id: `cs_c_${run}`, payment_status: "paid", amount_total: 1300000, payment_intent: `pi_c_${run}`,
    metadata: { kind: "consultation", consultation_id: row!.id }, customer_details: { address: { country: "HU" } } };
  assert.equal(await processStripeEvent(ev("checkout.session.completed", session), deps), "processed");
  await processStripeEvent(ev("checkout.session.async_payment_succeeded", session), deps);
  const { data: c } = await admin.from("consultations").select("status, invoice_id, price_huf").eq("id", row!.id).single();
  assert.equal(c?.status, "requested");
  assert.equal(c?.price_huf, 13000);
  assert.ok(c?.invoice_id);
  const { data: invs } = await admin.from("invoices").select("amount_huf, product_code").eq("stripe_payment_intent_id", `pi_c_${run}`);
  assert.deepEqual(invs, [{ amount_huf: 13000, product_code: "konzultacio_belso_kor" }]);
});

test("gyorsított hozzáférés: a vásárlás rögzül, a lépcső nem nyílik meg magától, egy számlatétel", async () => {
  const member = await profile(emailA);
  await admin.from("profiles").update({ tier: "tarsasagi", subscription_status: "active", m2_purchased: false, ip3_purchased: false, m2_unlocked: false }).eq("id", member.id);
  const session = { id: `cs_st_${run}`, payment_status: "paid", amount_total: 8994000, payment_intent: `pi_st_${run}`,
    metadata: { kind: "stage_purchase", code: "gyorsitott_m2_ip3_csomag", user_id: member.id }, customer_details: { address: { country: "HU" } } };
  assert.equal(await processStripeEvent(ev("checkout.session.completed", session), deps), "processed");
  await processStripeEvent(ev("checkout.session.async_payment_succeeded", session), deps);
  const p = await profile(emailA);
  assert.deepEqual({ m2: p.m2_purchased, ip3: p.ip3_purchased, unlocked: p.m2_unlocked }, { m2: true, ip3: true, unlocked: false });
  const { data: invs } = await admin.from("invoices").select("amount_huf, product_code").eq("stripe_payment_intent_id", `pi_st_${run}`);
  assert.deepEqual(invs, [{ amount_huf: 89940, product_code: "gyorsitott_m2_ip3_csomag" }]);
});
