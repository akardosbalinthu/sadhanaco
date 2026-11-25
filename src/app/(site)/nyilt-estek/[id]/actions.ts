"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { publicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, onlinePaymentsEnabled } from "@/lib/stripe";
import { SITE } from "@/lib/site";
import { sendEmail } from "@/lib/email";
import { detailsError, parseDetails } from "@/lib/registration-details";

export type GuestBookingState =
  | { status: "idle" }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

const schema = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  // Az elállási nyilatkozat csak fizetős alkalomnál kell (lent ellenőrizzük, az esemény ára alapján).
  waiver: z.literal("on").optional(),
  terms: z.literal("on"),
});

const MESSAGES: Record<string, string> = {
  EVENT_FULL: "Erre az alkalomra minden hely betelt.",
  ALREADY_REGISTERED: "Ezzel az e-mail-címmel már van jelentkezés erre az alkalomra.",
  REGISTRATION_NOT_OPEN: "A jelentkezés még nem nyílt meg.",
  REGISTRATION_CLOSED: "A jelentkezés erre az alkalomra lezárult.",
  NOT_PUBLIC_EVENT: "Erre az alkalomra csak a Társaság tagjai jelentkezhetnek.",
  EVENT_NOT_FOUND: "Ez az alkalom nem érhető el.",
  INVALID_GUEST: "Kérlek, add meg a neved és egy érvényes e-mail-címet.",
};

/**
 * Külsős jelentkezés: hely tartása (reserve_guest_seat) -> elállási nyilatkozat rögzítése
 * -> Stripe Checkout. A foglalást a Stripe webhook erősíti meg (2. fázis); addig az online
 * fizetés a ONLINE_PAYMENTS_ENABLED kapcsolóval ki van kapcsolva.
 */
export async function bookOpenEvening(
  _prev: GuestBookingState,
  formData: FormData,
): Promise<GuestBookingState> {
  const parsed = schema.safeParse({
    eventId: formData.get("eventId"),
    name: formData.get("name"),
    email: formData.get("email"),
    waiver: formData.get("waiver") ?? undefined,
    terms: formData.get("terms"),
  });
  if (!parsed.success) {
    const missing = (k: string) => parsed.error.issues.some((i) => i.path[0] === k);
    return {
      status: "error",
      message: missing("terms")
        ? "A jelentkezéshez kérlek, fogadd el az ÁSZF-et és az adatkezelési tájékoztatót."
        : missing("waiver")
        ? "A jelentkezéshez kérlek, fogadd el az azonnali teljesítésről szóló nyilatkozatot."
        : MESSAGES.INVALID_GUEST,
    };
  }

  const { eventId, name, email } = parsed.data;
  const details = parseDetails(formData);
  if (!details.success) return { status: "error", message: details.error.issues[0]?.message ?? "Kérlek, ellenőrizd a mezőket." };
  const admin = createAdminClient();

  // Az esemény saját ára dönt: díjmentes estnél nincs fizetés, fizetősnél az esemény ára kerül terhelésre.
  const { data: ev } = await admin.from("events").select("title, starts_at, location, is_online, price_external_huf, donation_based").eq("id", eventId).maybeSingle();
  if (!ev || ev.price_external_huf == null) return { status: "error", message: MESSAGES.EVENT_NOT_FOUND };
  const paid = ev.price_external_huf > 0;
  if (paid && parsed.data.waiver !== "on") {
    return { status: "error", message: "A jelentkezéshez kérlek, fogadd el az azonnali teljesítésről szóló nyilatkozatot." };
  }
  if (paid && !onlinePaymentsEnabled()) {
    return {
      status: "error",
      message: `Az online jelentkezés hamarosan nyílik. Addig írj nekem: ${SITE.email}`,
    };
  }

  const { data: reg, error } = await admin.rpc("reserve_guest_seat", {
    p_event_id: eventId,
    p_guest_name: name,
    p_guest_email: email,
  });
  if (error || !reg) {
    return { status: "error", message: MESSAGES[error?.hint ?? ""] ?? "Most nem sikerült. Kérlek, próbáld újra." };
  }
  // Telefonszám és biztonsági megjegyzés (kifejezett hozzájárulással); az esemény után 30 nappal törlődik.
  const { error: detErr } = await admin.rpc("set_registration_details", {
    p_registration_id: reg.id,
    p_phone: details.data.phone,
    p_safety_note: details.data.safety_note,
    p_consent: true,
  });
  if (detErr) {
    await admin.from("event_registrations").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", reg.id);
    return { status: "error", message: detailsError(detErr.hint) };
  }

  if (reg.status === "confirmed") {
    // Díjmentes alkalom: a hely azonnal a vendégé; visszaigazoló levél (ha nem megy ki, a foglalás attól még él).
    const when = new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", dateStyle: "full", timeStyle: "short" }).format(new Date(ev.starts_at));
    const mail = await sendEmail(email, `Visszaigazolás — ${ev.title}`, [
      `Kedves ${name}!`,
      `Örömmel várlak: ${ev.title}, ${when}${ev.is_online ? " (online)" : ev.location ? `, ${ev.location}` : ""}.`,
      ev.donation_based
        ? "Az est adomány alapú: a részvétel díjmentes, a helyszínen belátásod szerint támogathatod. Ha mégsem tudsz jönni, kérlek, írj egy rövid levelet, hogy a helyed másnak adhassam."
        : "A részvétel díjmentes. Ha mégsem tudsz jönni, kérlek, írj egy rövid levelet, hogy a helyed másnak adhassam.",
    ]);
    return {
      status: "done",
      message: mail.ok
        ? "Köszönöm, a helyed le van foglalva. A visszaigazolást e-mailben is elküldtem. Szeretettel várlak!"
        : "Köszönöm, a helyed le van foglalva. Szeretettel várlak!",
    };
  }

  if (parsed.data.waiver !== "on") {
    return { status: "error", message: "A jelentkezéshez kérlek, fogadd el az azonnali teljesítésről szóló nyilatkozatot." };
  }
  const h = await headers();
  const { data: settings } = await admin.from("app_settings").select("terms_version").single();
  await admin.from("purchase_consents").insert({
    email,
    product_code: "nyilt_est_kulsos",
    terms_version: settings?.terms_version ?? "ismeretlen",
    ip_address: h.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    user_agent: h.get("user-agent"),
  });

  const stripe = getStripe();
  const { data: product } = await admin.from("price_catalog").select("stripe_product_id").eq("code", "nyilt_est_kulsos").maybeSingle();

  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "hu",
    // Az esemény saját ára (nem a katalógus alapára), a Nyílt Est termékhez kötve.
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "huf",
          unit_amount: reg.price_huf * 100,
          ...(product?.stripe_product_id ? { product: product.stripe_product_id } : { product_data: { name: ev.title } }),
        },
      },
    ],
    customer_email: email,
    billing_address_collection: "required",
    tax_id_collection: { enabled: false },
    // A Stripe minimum 30 perc; a helyet az adatbázis ennél tovább tartja (payment_hold_minutes).
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    metadata: { kind: "open_evening_guest", registration_id: reg.id, event_id: eventId },
    payment_intent_data: { metadata: { kind: "open_evening_guest", registration_id: reg.id } },
    success_url: `${base}/nyilt-estek/${eventId}?fizetes=sikeres`,
    cancel_url: `${base}/nyilt-estek/${eventId}?fizetes=megszakitva`,
  });

  redirect(session.url!);
}
