"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, onlinePaymentsEnabled } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { bookingError, eventPriceCode, inviteError } from "@/lib/events";
import { detailsError, parseDetails } from "@/lib/registration-details";
import { resolvedSiteUrl, resolvedTarsasagUrl, tp } from "@/lib/site";

const uuid = z.string().uuid();
function back(msg: { ok?: string; hiba?: string }, anchor = ""): never {
  const q = new URLSearchParams(Object.entries(msg).filter(([, v]) => v) as [string, string][]).toString();
  redirect(`${tp("/esemenyek")}?${q}${anchor}`);
}

/** Fizetős tagi foglalás: Stripe Checkout a már lefoglalt (ideiglenes) helyre. */
async function checkoutFor(registrationId: string, userId: string, email: string) {
  const admin = createAdminClient();
  const { data: reg } = await admin
    .from("event_registrations")
    .select("id, price_huf, status, hold_expires_at, tier_at_booking, events(title, kind, starts_at)")
    .eq("id", registrationId)
    .eq("user_id", userId)
    .single();
  if (!reg || reg.status !== "pending_payment" || reg.price_huf <= 0) back({ hiba: "Ez a foglalás már nem vár fizetésre." });
  const ev = reg.events as unknown as { title: string; kind: Parameters<typeof eventPriceCode>[0]; starts_at: string };
  const code = eventPriceCode(ev.kind, reg.tier_at_booking);
  const [{ data: product }, { data: profile }] = await Promise.all([
    code ? admin.from("price_catalog").select("stripe_product_id").eq("code", code).maybeSingle() : Promise.resolve({ data: null }),
    admin.from("profiles").select("stripe_customer_id").eq("id", userId).single(),
  ]);
  const base = resolvedTarsasagUrl().replace(/\/$/, "");
  const productData = product?.stripe_product_id ? { product: product.stripe_product_id } : { product_data: { name: ev.title } };
  // A Stripe-munkamenet 31 percig él; a hely ennél tovább (payment_hold_minutes) van fenntartva.
  let url: string | null = null;
  try {
    const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    locale: "hu",
    ...(profile?.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: email, customer_creation: "always" as const }),
    billing_address_collection: "required",
    tax_id_collection: { enabled: false },
    line_items: [{ quantity: 1, price_data: { currency: "huf", unit_amount: reg.price_huf * 100, ...productData } }],
    metadata: { kind: "member_event", registration_id: reg.id, user_id: userId },
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${base}/esemenyek?ok=${encodeURIComponent("Köszönöm! A fizetés után a helyed véglegessé válik.")}`,
    cancel_url: `${base}/esemenyek?hiba=${encodeURIComponent("A fizetés megszakadt. A helyed még rövid ideig fenntartom – a „Fizetés” gombbal folytathatod.")}`,
    });
    url = session.url;
  } catch {
    url = null;
  }
  if (!url) back({ hiba: "A fizetési oldal most nem nyílt meg. A helyed rövid ideig fenntartva marad – próbáld újra a „Fizetés” gombbal." });
  redirect(url);
}

export async function bookEvent(fd: FormData) {
  const eventId = uuid.parse(fd.get("eventId"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(tp("/belepes"));
  // A telefonszám és a biztonsági megjegyzés minden jelentkezéshez kell – előbb ellenőrizzük.
  const details = parseDetails(fd);
  if (!details.success) back({ hiba: details.error.issues[0]?.message ?? "Kérlek, ellenőrizd a mezőket." }, `#e-${eventId}`);
  const { data: reg, error } = await supabase.rpc("book_event", { p_event_id: eventId });
  if (error) back({ hiba: bookingError(error.hint) }, `#e-${eventId}`);
  const { error: detErr } = await supabase.rpc("set_registration_details", {
    p_registration_id: reg.id,
    p_phone: details.data.phone,
    p_safety_note: details.data.safety_note,
    p_consent: true,
  });
  if (detErr) {
    await supabase.rpc("cancel_my_registration", { p_registration_id: reg.id });
    back({ hiba: detailsError(detErr.hint) }, `#e-${eventId}`);
  }
  revalidatePath(tp("/esemenyek"));
  if (reg.status === "confirmed") back({ ok: "Ott leszel – a helyed le van foglalva." }, `#e-${eventId}`);
  if (!onlinePaymentsEnabled()) back({ hiba: "Az online fizetés hamarosan nyílik. A helyed rövid ideig fenntartva marad." });
  await checkoutFor(reg.id, user.id, user.email ?? "");
}

/** Megszakadt fizetés folytatása, amíg a hely fenn van tartva. */
export async function payRegistration(fd: FormData) {
  const registrationId = uuid.parse(fd.get("registrationId"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(tp("/belepes"));
  if (!onlinePaymentsEnabled()) back({ hiba: "Az online fizetés hamarosan nyílik." });
  await checkoutFor(registrationId, user.id, user.email ?? "");
}

export async function inviteGuest(fd: FormData) {
  const eventId = uuid.parse(fd.get("eventId"));
  const name = z.string().trim().min(1).max(120).safeParse(fd.get("guest_name"));
  const email = z.string().trim().toLowerCase().email().safeParse(fd.get("guest_email"));
  if (!name.success || !email.success) back({ hiba: inviteError("INVALID_GUEST") }, `#e-${eventId}`);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(tp("/belepes"));
  const { data: inviteId, error } = await supabase.rpc("invite_hike_guest", {
    p_event_id: eventId,
    p_guest_name: name.data,
    p_guest_email: email.data,
  });
  if (error) back({ hiba: inviteError(error.hint) }, `#e-${eventId}`);

  // A meghívó tokenjét a kliens nem láthatja; a szerver olvassa ki és küldi el.
  const admin = createAdminClient();
  const [{ data: inv }, { data: me }] = await Promise.all([
    admin.from("event_invitations").select("token, events(title, starts_at, location)").eq("id", inviteId).single(),
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
  ]);
  const ev = inv?.events as unknown as { title: string; starts_at: string; location: string | null } | undefined;
  const when = ev
    ? new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", dateStyle: "long", timeStyle: "short" }).format(new Date(ev.starts_at))
    : "";
  const sent = inv
    ? await sendEmail(
        email.data,
        `Meghívó egy közös túrára – ${ev?.title ?? "A Társaság"}`,
        [
          `Kedves ${name.data}!`,
          `${me?.display_name ?? "Egy barátod"} meghívott A Társaság közös túrájára: ${ev?.title ?? ""}, ${when}${ev?.location ? `, ${ev.location}` : ""}.`,
          "A túra díjmentes. Ha jönnél, egy kattintással fogadd el a meghívót, és már ott is a helyed.",
        ],
        { href: `${resolvedSiteUrl().replace(/\/$/, "")}/tura-meghivo?t=${inv.token}`, label: "Elfogadom a meghívót" },
      )
    : { ok: false as const };
  revalidatePath(tp("/esemenyek"));
  back(
    sent.ok
      ? { ok: `Elküldtem a meghívót ${name.data} részére.` }
      : { hiba: "A meghívó rögzítve, de az e-mailt most nem tudtam elküldeni. Szólj neki, vagy próbáld később újra." },
    `#e-${eventId}`,
  );
}

export async function castVote(fd: FormData) {
  const pollId = uuid.parse(fd.get("pollId"));
  const optionId = uuid.safeParse(fd.get("optionId"));
  if (!optionId.success) back({ hiba: "Válassz egy úti célt." }, "#szavazas");
  const supabase = await createClient();
  const { error } = await supabase.rpc("cast_destination_vote", { p_poll_id: pollId, p_option_id: optionId.data });
  if (error) {
    back({ hiba: error.hint === "POLL_CLOSED" ? "Ez a szavazás már lezárult." : "A szavazat most nem ment el." }, "#szavazas");
  }
  revalidatePath(tp("/esemenyek"));
  back({ ok: "Köszönöm, a szavazatod megvan. A lezárásig bármikor módosíthatod." }, "#szavazas");
}

export async function cancelRegistration(fd: FormData) {
  const registrationId = uuid.parse(fd.get("registrationId"));
  const eventId = uuid.parse(fd.get("eventId"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_my_registration", { p_registration_id: registrationId });
  if (error) {
    back({ hiba: error.hint === "EVENT_STARTED" ? "Az alkalom már elkezdődött, a foglalás nem mondható le." : "A lemondás most nem sikerült." }, `#e-${eventId}`);
  }
  revalidatePath(tp("/esemenyek"));
  back({ ok: "Lemondtad a helyed – így valaki más jöhet helyetted. Köszönöm, hogy szóltál." }, `#e-${eventId}`);
}

export async function cancelInvitation(fd: FormData) {
  const invitationId = uuid.parse(fd.get("invitationId"));
  const eventId = uuid.parse(fd.get("eventId"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_hike_invitation", { p_invitation_id: invitationId });
  if (error) back({ hiba: error.hint === "EVENT_STARTED" ? "A túra már elkezdődött." : "A visszavonás most nem sikerült." }, `#e-${eventId}`);
  revalidatePath(tp("/esemenyek"));
  back({ ok: "A meghívót visszavontad." }, `#e-${eventId}`);
}
