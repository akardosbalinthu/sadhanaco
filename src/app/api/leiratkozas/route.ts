import { NextResponse, type NextRequest } from "next/server";
import { unsubscribeToken } from "@/lib/unsubscribe";
import { resolvedSiteUrl } from "@/lib/site";

/** Egykattintásos leiratkozás (RFC 8058): a levelezőprogram POST-tal hívja. */
export async function POST(req: NextRequest) {
  await unsubscribeToken(req.nextUrl.searchParams.get("t"));
  return new NextResponse(null, { status: 200 });
}

/** Böngészőből megnyitva a megerősítő oldalra visz (a linkellenőrzők ne iratkoztassanak le). */
export async function GET(req: NextRequest) {
  const url = new URL("/leiratkozas", resolvedSiteUrl());
  const t = req.nextUrl.searchParams.get("t");
  if (t) url.searchParams.set("t", t);
  return NextResponse.redirect(url);
}
