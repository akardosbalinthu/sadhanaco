import "server-only";
import { buildIcs, googleCalendarUrl, type CalendarEvent } from "@/lib/calendar";
import { sendEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { SITE } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

export type BookingInfo = {
  application_id: string;
  full_name: string;
  email: string;
  qualified: boolean;
  booked: { slot_id: string; starts_at: string; duration_minutes: number; meet_url: string | null } | null;
  slots: { id: string; starts_at: string; duration_minutes: number }[];
};

export async function bookingInfo(token: string): Promise<BookingInfo | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const { data } = await createAdminClient().rpc("application_booking_info", { p_token: token });
  return (data as unknown as BookingInfo) ?? null;
}

/** A konzultáció naptáreseménye — a jelentkezőnek (forAdmin=false) vagy nekem. */
export function consultationEvent(info: BookingInfo, forAdmin = false): CalendarEvent | null {
  if (!info.booked) return null;
  const start = new Date(info.booked.starts_at);
  return {
    uid: `konzultacio-${info.booked.slot_id}`,
    title: forAdmin ? `Ismerkedő konzultáció — ${info.full_name}` : "Ismerkedő konzultáció — Kardos Bálint",
    start,
    end: new Date(start.getTime() + info.booked.duration_minutes * 60_000),
    description: forAdmin
      ? `Jelentkező: ${info.full_name} (${info.email})\nFelmérés: ${publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "")}/admin/jelentkezesek/${info.application_id}`
      : info.booked.meet_url
      ? "Online, Google Meeten. A belépő link lent."
      : "Online, Google Meeten. A belépő linket a konzultáció előtt e-mailben küldöm.",
    url: info.booked.meet_url ?? undefined,
  };
}

const whenText = (iso: string) =>
  new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", dateStyle: "full", timeStyle: "short" }).format(new Date(iso));

/** Foglalás után: visszaigazolás a jelentkezőnek és értesítő nekem, .ics melléklettel és Google Naptár-linkkel. */
export async function notifyBooking(token: string) {
  const info = await bookingInfo(token);
  if (!info?.booked) return;
  const first = info.full_name.split(/\s+/).slice(-1)[0];
  const when = whenText(info.booked.starts_at);
  const own = consultationEvent(info)!;
  const mine = consultationEvent(info, true)!;

  await sendEmail(
    info.email,
    `Visszaigazolás: ismerkedő konzultáció, ${when}`,
    [
      `Kedves ${first}!`,
      `Lefoglaltad az ismerkedő konzultációt: ${when}, ${info.booked.duration_minutes} perc, online.`,
      info.booked.meet_url
        ? `A belépő link: ${info.booked.meet_url}`
        : "A belépő linket a konzultáció előtt e-mailben küldöm.",
      "A mellékelt fájllal vagy a lenti gombbal a naptáradba is beteheted. Ha mégsem jó az időpont, kérlek, válaszolj erre a levélre.",
      "Várlak szeretettel!",
    ],
    { href: googleCalendarUrl(own), label: "Hozzáadom a Google Naptárhoz" },
    [{ filename: "konzultacio.ics", content: buildIcs(own), contentType: "text/calendar; charset=utf-8" }],
  );

  await sendEmail(
    SITE.adminEmail,
    `Új konzultáció: ${info.full_name}, ${when}`,
    [
      `${info.full_name} (${info.email}) lefoglalta az ismerkedő konzultációt: ${when}, ${info.booked.duration_minutes} perc.`,
      info.booked.meet_url ? `Meet-link: ${info.booked.meet_url}` : "Ehhez az időponthoz még nincs Meet-link — a konzultáció előtt küldd el neki.",
      `A felmérése: ${publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "")}/admin/jelentkezesek/${info.application_id}`,
    ],
    { href: googleCalendarUrl(mine), label: "Beteszem a Google Naptáramba" },
    [{ filename: "konzultacio.ics", content: buildIcs(mine), contentType: "text/calendar; charset=utf-8" }],
  );
}
