import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Útvonalak, amelyek bejelentkezés nélkül is elérhetők. */
const PUBLIC_PATHS = ["/", "/belepes", "/auth"];
/** Gépi végpontok: saját titokkal védettek (webhook aláírás, CRON_SECRET, INTERNAL_API_SECRET). */
const MACHINE_PATHS = ["/api/webhooks", "/api/cron", "/api/internal"];

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`))) ||
    MACHINE_PATHS.some((p) => pathname.startsWith(p))
  );
}

/**
 * Frissíti a Supabase munkamenetet minden kérésnél, és a védett oldalakról
 * a belépési oldalra irányít. Ez csak kényelmi réteg: a tényleges jogosultság-
 * ellenőrzés mindig szerveroldalon és RLS-sel történik.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Fontos: a createServerClient és a getUser között ne fusson más logika.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/belepes";
    url.searchParams.set("tovabb", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
