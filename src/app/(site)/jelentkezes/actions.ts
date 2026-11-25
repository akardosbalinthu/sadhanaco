"use server";

import { redirect } from "next/navigation";
import { applicationInput, applicationSchema, START_LABEL } from "@/lib/application";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { SITE } from "@/lib/site";

export type ApplyState =
  | { status: "idle" }
  | { status: "later"; name: string }
  | { status: "error"; message: string };

const siteBase = () => publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
const adminBase = () => publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "");

export async function submitApplication(_prev: ApplyState, fd: FormData): Promise<ApplyState> {
  // Csapda a robotoknak: ember ezt a mezőt nem látja és nem tölti ki.
  if (typeof fd.get("website") === "string" && (fd.get("website") as string).length > 0) {
    return { status: "later", name: "" };
  }
  const parsed = applicationSchema.safeParse(applicationInput(fd));
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path ?? [];
    const k = String(path[0] ?? "");
    const message =
      k === "health_consent"
        ? "A felmérés beküldéséhez kérlek, járulj hozzá az egészségügyi adataid kezeléséhez."
        : k === "privacy_consent"
        ? "Kérlek, fogadd el az adatkezelési tájékoztatót."
        : k === "pillars"
        ? "Kérlek, mind a hat területnél jelöld be, mennyire vagy elégedett."
        : k === "email"
        ? "Kérlek, adj meg egy érvényes e-mail-címet."
        : k === "full_name"
        ? "Kérlek, add meg a neved."
        : k === "problem"
        ? "Kérlek, írd le pár szóban, mi hozott ide."
        : "Kérlek, válaszolj minden kötelező kérdésre.";
    return { status: "error", message };
  }
  const d = parsed.data;
  const admin = createAdminClient();
  const { data: app, error } = await admin.rpc("submit_application", {
    p_full_name: d.full_name,
    p_email: d.email,
    p_phone: d.phone ?? "",
    p_pillars: d.pillars,
    p_problem: d.problem,
    p_severity: d.severity,
    p_urgency: d.urgency,
    p_invest_money: d.invest_money,
    p_invest_time: d.invest_time,
    p_invest_energy: d.invest_energy,
    p_start_when: d.start_when,
    p_health_consent: true,
    p_privacy_consent: true,
  });
  if (error || !app) {
    return { status: "error", message: "Most nem sikerült elküldeni. Kérlek, próbáld újra pár perc múlva." };
  }

  const first = d.full_name.split(/\s+/).slice(-1)[0];
  const bookingUrl = `${siteBase()}/jelentkezes/idopont?t=${app.token}`;

  // Értesítő nekem (a részleteket csak a védett admin felületen mutatjuk).
  await sendEmail(
    SITE.adminEmail,
    `Új jelentkezés${app.qualified ? " (azonnal kezdene)" : ""} – ${d.full_name}`,
    [
      `${d.full_name} kitöltötte a felmérést.`,
      `Mikor kezdene: ${START_LABEL[d.start_when]}. ${app.qualified ? "Konzultációt foglalhat." : "Konzultációt nem foglalhat; a Nyílt Estre hívtam."}`,
    ],
    { href: `${adminBase()}/admin/jelentkezesek/${app.id}`, label: "Megnézem a jelentkezést" },
  );

  if (app.qualified) {
    await sendEmail(
      d.email,
      "A felmérésed megérkezett – válassz időpontot",
      [
        `Kedves ${first}!`,
        "Köszönöm, hogy kitöltötted a felmérést. Átolvasom, mielőtt beszélünk, így a konzultáción rögtön a lényegre térhetünk.",
        "Ha még nem foglaltál időpontot, ezen a linken teheted meg:",
      ],
      { href: bookingUrl, label: "Időpontot választok" },
    );
    redirect(`/jelentkezes/idopont?t=${app.token}`);
  }

  await sendEmail(
    d.email,
    "Köszönöm, hogy kitöltötted a felmérést",
    [
      `Kedves ${first}!`,
      "Köszönöm, hogy időt szántál a felmérésre. Azt írtad, most még nem kezdenéd el – és ez teljesen rendben van. Az egyéni programot azoknak ajánlom, akik most szeretnének belevágni, mert akkor tudom igazán jól kísérni.",
      "Addig is szeretettel várlak egy Nyílt Meditációs Esten, ahol kipróbálhatod, hogyan dolgozom. Ha később úgy érzed, eljött az ideje, töltsd ki újra a felmérést.",
    ],
    { href: `${siteBase()}/nyilt-estek`, label: "Közelgő Nyílt Estek" },
  );
  return { status: "later", name: first };
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

