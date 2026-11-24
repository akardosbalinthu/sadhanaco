import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { processStripeEvent } from "@/lib/billing/webhook";
import { liveWebhookDeps } from "@/lib/billing/deps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe webhook: aláírás-ellenőrzés → idempotens feldolgozás (stripe_events). */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Hiányzó aláírás vagy webhook-kulcs." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Érvénytelen aláírás." }, { status: 400 });
  }

  try {
    const result = await processStripeEvent(event, liveWebhookDeps());
    return NextResponse.json({ received: true, result });
  } catch (e) {
    console.error("Stripe webhook hiba", event.id, event.type, e);
    return NextResponse.json({ error: "Feldolgozási hiba, a Stripe újrapróbálja." }, { status: 500 });
  }
}
