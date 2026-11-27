"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { firstIssue, kindMessageError, messageFields, wantsAnonymity, type FormState } from "@/lib/kind-message";
import { resolvedSiteUrl } from "@/lib/site";

const guestSchema = z.object({
  ...messageFields,
  guest_name: z.string().trim().min(1, "Add meg a neved.").max(120),
  guest_email: z.string().trim().toLowerCase().email("Adj meg egy érvényes e-mail-címet."),
});

/** Ennyi üzenet indulhat egy e-mail-címről 24 óra alatt (visszaélés ellen). */
const DAILY_LIMIT = 5;

/** Díjmentes Kedves Üzenet vendégként: rögzítés, majd megerősítő e-mail. */
export async function submitGuestMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("website") ?? "") !== "") {
    return { status: "done", message: "Köszönöm! Nézd meg a postafiókodat." }; // robot: csendben eldobjuk
  }
  const parsed = guestSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };
  const d = parsed.data;

  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin
    .from("kind_messages")
    .select("id", { count: "exact", head: true })
    .eq("guest_email", d.guest_email)
    .gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) {
    return { status: "error", message: "Erről a címről ma már több üzenet is érkezett. Kérlek, holnap küldd a következőt." };
  }

  const { data, error } = await admin
    .rpc("submit_kind_message", {
      p_recipient_name: d.recipient_name,
      p_recipient_phone: d.recipient_phone,
      p_message: d.message,
      p_guest_name: d.guest_name,
      p_guest_email: d.guest_email,
    })
    .single();
  if (error || !data?.confirm_token) return { status: "error", message: kindMessageError(error?.hint) };
  if (wantsAnonymity(fd)) {
    const { error: anonErr } = await admin.rpc("set_kind_message_anonymous", { p_message_id: data.message_id, p_anonymous: true });
    if (anonErr) {
      await admin.from("kind_messages").delete().eq("id", data.message_id).eq("status", "pending_confirmation");
      return { status: "error", message: kindMessageError(null) };
    }
  }

  const link = `${resolvedSiteUrl().replace(/\/$/, "")}/egy-kedves-uzenet/megerosites?t=${data.confirm_token}`;
  const sent = await sendEmail(
    d.guest_email,
    "Erősítsd meg a kedves üzenetedet",
    [
      `Kedves ${d.guest_name}!`,
      `Köszönöm a kedves üzenetet, amelyet ${d.recipient_name} kap tőled${wantsAnonymity(fd) ? " – névtelenül: a nevedet a hívásban nem mondom ki" : ""}. Egy kattintással erősítsd meg, hogy tényleg te küldted, és az üzenet bekerül a kézbesítési sorba.`,
      "A link 48 óráig érvényes. Ha nem te küldted, egyszerűen hagyd figyelmen kívül ezt a levelet.",
    ],
    { href: link, label: "Megerősítem az üzenetet" },
  );
  if (!sent.ok) {
    return { status: "error", message: "Az üzeneted megvan, de a megerősítő e-mailt most nem tudtam elküldeni. Kérlek, próbáld újra kicsit később." };
  }
  return {
    status: "done",
    message: `Köszönöm! Küldtem egy megerősítő e-mailt erre a címre: ${d.guest_email}. A benne lévő linkkel erősítsd meg az üzenetet, és bekerül a kézbesítési sorba.`,
  };
}

export type ConfirmState = { status: "idle" } | { status: "ok"; recipient: string } | { status: "error"; message: string };

/** A megerősítés gombnyomásra történik (a levelezők linkellenőrzői nem erősíthetik meg helyetted). */
export async function confirmGuestMessage(_prev: ConfirmState, fd: FormData): Promise<ConfirmState> {
  const token = z.string().regex(/^[0-9a-f]{48}$/).safeParse(fd.get("t"));
  if (!token.success) return { status: "error", message: "Ez a link nem érvényes." };
  const { data, error } = await createAdminClient().rpc("confirm_kind_message", { p_token: token.data });
  if (error) {
    return {
      status: "error",
      message: error.hint === "TOKEN_EXPIRED" ? "Ez a link lejárt. Kérlek, küldd el újra az üzenetet." : "Ez a link nem érvényes, vagy már felhasználták.",
    };
  }
  return { status: "ok", recipient: data.recipient_name };
}
