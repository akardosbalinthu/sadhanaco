import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { tarsasagBasePath } from "@/lib/site";

const TARSASAG_HOST_PREFIX = "tarsasag.";
/** Élesben "" (aldomain), helyben "/tarsasag" – a NEXT_PUBLIC_TARSASAG_URL-ből. */
const BASE = tarsasagBasePath();

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // 1) tarsasag.akardosbalint.hu – minden kérés a belső /tarsasag útvonalakra
  if (host.startsWith(TARSASAG_HOST_PREFIX)) {
    if (pathname === "/tarsasag" || pathname.startsWith("/tarsasag/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice("/tarsasag".length) || "/";
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/api/")) return NextResponse.next();
    const internal = `/tarsasag${pathname === "/" ? "" : pathname}`;
    const rewrite = request.nextUrl.clone();
    rewrite.pathname = internal;
    return updateSession(request, internal, "", rewrite);
  }

  // 2) Fő domain: élesben a /tarsasag/* az aldomainre költözik
  if (pathname === "/tarsasag" || pathname.startsWith("/tarsasag/")) {
    if (BASE === "" && process.env.NEXT_PUBLIC_TARSASAG_URL) {
      const target = new URL(process.env.NEXT_PUBLIC_TARSASAG_URL);
      target.pathname = pathname.slice("/tarsasag".length) || "/";
      target.search = request.nextUrl.search;
      return NextResponse.redirect(target, 308);
    }
    return updateSession(request, pathname, BASE);
  }

  // 3) A fő weboldal nyilvános, munkamenet nem kell.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Minden útvonal, kivéve a statikus fájlokat és képeket.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
