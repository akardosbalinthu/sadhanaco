"use server";

import { redirect } from "next/navigation";
import { applicationV2Input, applicationV2Schema, lifestyleMap, RESULT_TEXT } from "@/lib/application";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { SITE } from "@/lib/site";

export type ApplyState = { status: "idle" } | { status: "error"; message: string };

const siteBase = () => publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
const adminBase = () => publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "");

export async function submitApplication(_prev: ApplyState, fd: FormData): Promise<ApplyState> {
  // Csapda a robotoknak: ember ezt a mezőt nem látja és nem tölti ki.
  if (typeof fd.get("website") === "string" && (fd.get("website") as string).length > 0) {
    redirect("/");
  }
  const parsed = applicationV2Schema.safeParse(applicationV2Input(fd));
  if (!parsed.success) {
    const k = String(parsed.error.issues[0]?.path?.[0] ?? "");
    const message =
      k === "health_consent"
        ? "A beküldéshez kérlek, járulj hozzá az egészségügyi adataid kezeléséhez."
        : k === "privacy_consent"
        ? "Kérlek, fogadd el az adatkezelési tájékoztatót."
        : k === "answers"
        ? "Kérlek, válaszolj mind a 15 kérdésre."
        : k === "email"
        ? "Kérlek, adj meg egy érvényes e-mail-címet."
        : k === "full_name"
        ? "Kérlek, add meg a neved."
        : "Kérlek, ellenőrizd a megadott adatokat.";
    return { status: "error", message };
  }
  const d = parsed.data;
  const admin = createAdminClient();
  const { data: app, error } = await admin.rpc("submit_application_v2", {
    p_full_name: d.full_name,
    p_email: d.email,
    p_phone: d.phone ?? "",
    p_answers: d.answers,
    p_problem: d.problem ?? "",
    p_health_consent: true,
    p_privacy_consent: true,
  });
  if (error || !app) {
    return { status: "error", message: "Most nem sikerült elküldeni. Kérlek, próbáld újra pár perc múlva." };
  }
  if (d.heard_from || d.utm_source) {
    // A forrás csak statisztika: ha a mentése nem sikerül, a jelentkezés attól még rendben van.
    await admin.from("applications").update({ heard_from: d.heard_from ?? null, utm_source: d.utm_source ?? null }).eq("id", app.id);
  }

  const first = d.full_name.split(/\s+/).slice(-1)[0];
  const map = lifestyleMap(d.answers);
  const resultUrl = `${siteBase()}/jelentkezes/eredmeny?t=${app.token}`;

  // Értesítő nekem (a részleteket csak a védett admin felületen mutatjuk).
  await sendEmail(
    SITE.adminEmail,
    `Új jelentkezés${app.qualified ? " (most kezdene)" : ""} – ${d.full_name}`,
    [
      `${d.full_name} kitöltötte a kérdőívet.`,
      `„Most van itt az ideje?” ${d.answers.q15}/10. ${app.qualified ? "Konzultációt foglalhat." : "Konzultációt nem foglalhat; a Nyílt Estre hívtam."}`,
    ],
    { href: `${adminBase()}/admin/jelentkezesek/${app.id}`, label: "Megnézem a jelentkezést" },
  );

  // Az eredmény a kitöltőnek is, hogy később visszanézhesse.
  await sendEmail(
    d.email,
    "Az Életmód-térképed",
    [
      `Kedves ${first}!`,
      "Köszönöm, hogy kitöltötted a kérdőívet. Itt az eredményed röviden:",
      `Az erősséged: ${map.strongest.name}. ${map.strongest.strength}`,
      ...(map.weakest ? [`A következő kis lépésed: ${map.weakest.name}. ${map.weakest.tip}`] : []),
      RESULT_TEXT.longTerm,
      app.qualified ? RESULT_TEXT.qualified : RESULT_TEXT.later,
    ],
    { href: resultUrl, label: "Megnézem a teljes térképet" },
  );

  redirect(`/jelentkezes/eredmeny?t=${app.token}`);
}

/** A konzultációs időpont lefoglalása a jelentkezés tokenjével. */
export async function bookSlot(fd: FormData) {
  const token = String(fd.get("t") ?? "");
  const slotId = String(fd.get("slot") ?? "");
  const admin = createAdminClient();
  const { error } = await admin.rpc("book_consultation_slot", { p_token: token, p_slot_id: slotId });
  if (error) {
    const msg =
      error.hint === "SLOT_TAKEN"
        ? "Ezt az időpontot közben valaki más lefoglalta. Kérlek, válassz egy másikat."
        : error.hint === "ALREADY_BOOKED"
        ? "Már van lefoglalt időpontod."
        : "Ez az időpont most nem foglalható. Kérlek, válassz egy másikat.";
    redirect(`/jelentkezes/idopont?t=${encodeURIComponent(token)}&hiba=${encodeURIComponent(msg)}`);
  }
  const { notifyBooking } = await import("@/lib/consultation");
  await notifyBooking(token);
  redirect(`/jelentkezes/idopont?t=${encodeURIComponent(token)}&ok=1`);
}

