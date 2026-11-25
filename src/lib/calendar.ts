/** Naptár-segédek: Google Naptár-link és .ics fájl egy eseményhez. */

export type CalendarEvent = {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  url?: string;
};

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Egy kattintás: a Google Naptár eseménylétrehozó oldala előre kitöltve. */
export function googleCalendarUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${icsDate(e.start)}/${icsDate(e.end)}`,
    details: [e.description, e.url].filter(Boolean).join("\n\n"),
    location: e.location ?? e.url ?? "",
    ctz: "Europe/Budapest",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

/** .ics (iCalendar) tartalom; minden naptár (Google, Apple, Outlook) beolvassa. */
export function buildIcs(e: CalendarEvent): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kardos Balint//Program//HU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@akardosbalint.hu`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(e.start)}`,
    `DTEND:${icsDate(e.end)}`,
    `SUMMARY:${icsText(e.title)}`,
    ...(e.location || e.url ? [`LOCATION:${icsText(e.location ?? e.url ?? "")}`] : []),
    ...(e.description || e.url ? [`DESCRIPTION:${icsText([e.description, e.url].filter(Boolean).join("\n\n"))}`] : []),
    ...(e.url ? [`URL:${e.url}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(e.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
