"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { publicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, onlinePaymentsEnabled } from "@/lib/stripe";
import { SITE } from "@/lib/site";

export type GuestBookingState =
  | { status: "idle" }
  | { status: "error"; message: string };

const schema = z.object({
  eventId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  waiver: z.literal("on"),
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
    waiver: formData.get("waiver"),
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

  if (!onlinePaymentsEnabled()) {
    return {
      status: "error",
      message: `Az online jelentkezés hamarosan nyílik. Addig írj nekünk: ${SITE.email}`,
    };
  }

  const { eventId, name, email } = parsed.data;
  const admin = createAdminClient();

  const { data: reg, error } = await admin.rpc("reserve_guest_seat", {
    p_event_id: eventId,
    p_guest_name: name,
    p_guest_email: email,
  });
  if (error || !reg) {
    return { status: "error", message: MESSAGES[error?.hint ?? ""] ?? "Most nem sikerült. Kérlek, próbáld újra." };
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
  const prices = await stripe.prices.list({ lookup_keys: ["nyilt_est_kulsos"], active: true, limit: 1 });
  const price = prices.data[0];
  if (!price) {
    return { status: "error", message: "Most nem sikerült. Kérlek, próbáld újra később." };
  }

  const base = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "hu",
    line_items: [{ price: price.id, quantity: 1 }],
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
