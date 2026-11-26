import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PROGRAM_PORTAL_CONFIGURATION_ID } from "@/lib/stripe";
import { resolvedTarsasagUrl, tp } from "@/lib/site";

/** Stripe ügyfélportál: lemondás, kártyacsere, szintváltás. Csak bejelentkezett, Stripe-ügyféllel rendelkező tagnak. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(tp("/belepes"), request.nextUrl.origin), 303);

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  if (!profile?.stripe_customer_id) {
    return NextResponse.redirect(new URL(tp("/adataim"), request.nextUrl.origin), 303);
  }

  // A Társaság saját portál-beállítása (kártyacsere, lemondás az időszak végén, szintváltás a négy tagsági ár
  // között); ugyanebben a Stripe-fiókban más előfizetések is futnak, ezért nem a fiók alapértelmezésére hagyatkozunk.
  // Az egyéni program résztvevőinek külön portál: csak kártyacsere.
  const { data: program } = await supabase
    .from("program_enrollments")
    .select("id")
    .eq("user_id", user.id)
    .not("payment_plan", "is", null)
    .limit(1);
  const configuration = program?.length ? PROGRAM_PORTAL_CONFIGURATION_ID : process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined;
  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    locale: "hu",
    ...(configuration ? { configuration } : {}),
    return_url: `${resolvedTarsasagUrl().replace(/\/$/, "")}/adataim`,
  });
  return NextResponse.redirect(session.url, 303);
}
