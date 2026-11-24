import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { resolvedTarsasagUrl } from "@/lib/site";
import type { WebhookDeps } from "./webhook";

const priceCache = new Map<string, { code: string | null; unitAmount: number | null }>();

/** Belépő link (egyszer használatos), a Supabase Auth által aláírt tokennel. */
export async function magicLinkFor(email: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) return null;
  const url = new URL(`${resolvedTarsasagUrl().replace(/\/$/, "")}/auth/confirm`);
  url.searchParams.set("token_hash", data.properties.hashed_token);
  url.searchParams.set("type", "magiclink");
  return url.toString();
}

export function liveWebhookDeps(): WebhookDeps {
  const stripe = getStripe();
  return {
    admin: createAdminClient(),
    async resolvePrice(priceId) {
      const hit = priceCache.get(priceId);
      if (hit) return hit;
      const p = await stripe.prices.retrieve(priceId);
      const v = { code: p.lookup_key ?? null, unitAmount: p.unit_amount ?? null };
      priceCache.set(priceId, v);
      return v;
    },
    getSubscription: (id) => stripe.subscriptions.retrieve(id, { expand: ["default_payment_method"] }),
    async endTrialNow(id) {
      await stripe.subscriptions.update(id, { trial_end: "now", proration_behavior: "none" });
    },
    async sendWelcome(email) {
      const link = await magicLinkFor(email);
      await sendEmail(
        email,
        "Üdv A Társaságban",
        [
          "Kedves Társ!",
          "Örülök, hogy csatlakoztál. A Társaságban jelszó nincs: ezzel a gombbal most beléphetsz, később pedig a belépés oldalon bármikor kérhetsz új belépő linket erre az e-mail-címre.",
          "Az első lépés a Ceremónia: egy rövid önismereti kérdőív, amely eldönti, melyik rendbe kerülsz. Utána már indulhat is az első hét.",
          "A link biztonsági okból egy óráig érvényes.",
        ],
        link ? { href: link, label: "Belépek A Társaságba" } : undefined,
      );
    },
    async sendPaymentFailed(email) {
      await sendEmail(email, "Nem sikerült a tagsági díj terhelése", [
        "Kedves Társ!",
        "A legutóbbi tagsági díj terhelése nem sikerült. Semmi gond: a hozzáférésed megmarad, és a Stripe a következő napokban automatikusan újrapróbálja.",
        "Ha közben lejárt vagy megváltozott a kártyád, a fiókodban az „Előfizetés kezelése” gombbal frissítheted.",
      ]);
    },
  };
}
