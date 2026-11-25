import { NextResponse } from "next/server";
import { buildIcs } from "@/lib/calendar";
import { bookingInfo, consultationEvent } from "@/lib/consultation";

/** A lefoglalt ismerkedő konzultáció .ics fájlként (a jelentkezés tokenjével). */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  const info = await bookingInfo(token);
  const ev = info ? consultationEvent(info) : null;
  if (!ev) return new NextResponse("Nem található.", { status: 404 });
  return new NextResponse(buildIcs(ev), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="konzultacio.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
