import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
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
    return NextResponse.redirect(new URL(`${tp("/csatlakozas")}`, request.nextUrl.origin), 303);
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    locale: "hu",
    return_url: `${resolvedTarsasagUrl().replace(/\/$/, "")}/gyakorlas`,
  });
  return NextResponse.redirect(session.url, 303);
}
