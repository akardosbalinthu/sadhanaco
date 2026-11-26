import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Szerveroldali Stripe kliens. Az árakat lookup_key (= price_catalog.code) alapján keressük. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY nincs beállítva.");
  client ??= new Stripe(key);
  return client;
}

/** Online fizetés csak akkor indulhat, ha a webhook-feldolgozás is élesítve van (2. fázis). */
export function onlinePaymentsEnabled(): boolean {
  return process.env.ONLINE_PAYMENTS_ENABLED === "true" && Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Az egyéni program saját ügyfélportálja: csak kártyacsere (a részletek nem mondhatók le a portálon). */
export const PROGRAM_PORTAL_CONFIGURATION_ID = process.env.STRIPE_PROGRAM_PORTAL_CONFIGURATION_ID || "bpc_1UftgOKKK49wrBvL9wk856Fd";
