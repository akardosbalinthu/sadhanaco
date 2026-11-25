import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolvedTarsasagUrl } from "@/lib/site";

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** „Naptárba teszem”: egyetlen esemény .ics fájlként (a tag maga adja hozzá a naptárához). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = z.string().uuid().safeParse((await params).id);
  if (!id.success) return new NextResponse("Nem található.", { status: 404 });
  const supabase = await createClient();
  const { data: e } = await supabase
    .from("events")
    .select("id, title, description, location, is_online, starts_at, ends_at")
    .eq("id", id.data)
    .eq("is_published", true)
    .maybeSingle();
  if (!e) return new NextResponse("Nem található.", { status: 404 });

  const start = new Date(e.starts_at);
  const end = e.ends_at ? new Date(e.ends_at) : new Date(start.getTime() + 3600_000);
  const base = resolvedTarsasagUrl().replace(/\/$/, "");
  const url = e.is_online ? `${base}/esemenyek/${e.id}/elo` : `${base}/esemenyek#e-${e.id}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A Tarsasag//Esemenyek//HU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@tarsasag.akardosbalint.hu`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(e.title)}`,
    `LOCATION:${icsText(e.is_online ? "Online — A Társaság felületén" : (e.location ?? ""))}`,
    `DESCRIPTION:${icsText([e.description ?? "", e.is_online ? `Belépés: ${url}` : url].filter(Boolean).join("\n\n"))}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="tarsasag-${e.id.slice(0, 8)}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
