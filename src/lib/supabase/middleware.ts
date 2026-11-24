import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** A Társaság belső (átírt) útvonalai közül ezek nyilvánosak. */
const PUBLIC_TARSASAG_PATHS = ["/tarsasag", "/tarsasag/belepes", "/tarsasag/auth"];

function isPublicTarsasagPath(pathname: string) {
  return PUBLIC_TARSASAG_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Supabase munkamenet frissítése a Társaság oldalain, és a védett oldalakról
 * a belépési oldalra irányítás. Ez csak kényelmi réteg: a tényleges
 * jogosultság-ellenőrzés mindig szerveroldalon és RLS-sel történik.
 *
 * @param internalPath  a belső útvonal (/tarsasag/...), aldomainről érkező kérésnél már átírva
 * @param rewriteTo     ha meg van adva, a választ erre az URL-re írjuk át (aldomain)
 * @param basePath      a böngésző felé használt előtag ("" aldomainen, "/tarsasag" helyben)
 */
export async function updateSession(
  request: NextRequest,
  internalPath: string,
  basePath: string,
  rewriteTo?: URL,
) {
  const makeResponse = () =>
    rewriteTo ? NextResponse.rewrite(rewriteTo, { request }) : NextResponse.next({ request });
  let response = makeResponse();

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
          response = makeResponse();
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

  if (!user && !isPublicTarsasagPath(internalPath)) {
    const url = request.nextUrl.clone();
    url.pathname = `${basePath}/belepes`;
    url.search = "";
    url.searchParams.set("tovabb", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
