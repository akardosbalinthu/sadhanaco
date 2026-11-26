import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { magicLinkFor } from "@/lib/auth-links";
import type { WebhookDeps } from "./webhook";
import { subscriptionEndUnix } from "@/lib/program-payment";
import { SITE, tp } from "@/lib/site";
import { publicEnv } from "@/lib/env";

const priceCache = new Map<string, { code: string | null; unitAmount: number | null }>();

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
          "Kedves Tagtárs!",
          "Örülök, hogy csatlakoztál! A Társaságba jelszó nélkül lépsz be: ezzel a gombbal most beléphetsz, később pedig a belépés oldalon bármikor kérhetsz új belépő linket erre az e-mail-címre.",
          "Az első lépés a Ceremónia: egy rövid önismereti kérdőív, amely megmutatja, melyik rendbe tartozol. Utána már indulhat is az első hét.",
          "A link biztonsági okból egy óráig érvényes.",
        ],
        link ? { href: link, label: "Belépek A Társaságba" } : undefined,
      );
    },
    async setSubscriptionEnd(id, installments) {
      const sub = await stripe.subscriptions.retrieve(id);
      const anchor = sub.billing_cycle_anchor ?? sub.start_date;
      await stripe.subscriptions.update(id, { cancel_at: subscriptionEndUnix(anchor, installments), proration_behavior: "none" });
    },
    async sendProgramWelcome(email, name, startsOn, created) {
      const first = name.trim().split(/\s+/).slice(-1)[0];
      const when = new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${startsOn}T12:00:00Z`));
      const link = await magicLinkFor(email, tp("/program"));
      await sendEmail(
        email,
        "Megkaptam a fizetést – indul a programod",
        [
          `Kedves ${first}!`,
          "Köszönöm, megkaptam a fizetést. Örülök, hogy együtt dolgozunk.",
          `A programod kezdete: ${when}. A felületeden megtalálod a tananyagot, a gyakorlási tervedet, a heti beszámolót és az alkalmaink időpontjait – az első alkalmunk időpontját hamarosan beírom.`,
          "Belépni jelszó nélkül tudsz: a lenti gomb egy órán át érvényes, később a belépési oldalon bármikor kérhetsz új linket. A számlát külön küldöm.",
        ],
        link ? { href: link, label: "Belépek a programomba" } : undefined,
      );
      await sendEmail(SITE.adminEmail, `Fizetett: ${name} – indul a program`, [
        `${name} (${email}) kifizette a programot${created ? ", a fiókja elkészült" : ""}. Kezdés: ${when}.`,
        "Teendők: ütemezd az alkalmakat, írd meg a gyakorlási tervet, és állítsd ki a számlát.",
      ], { href: `${publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "")}/admin/resztvevok`, label: "Résztvevők" });
    },
    async sendProgramPaymentFailed(email, name) {
      const first = name.trim().split(/\s+/).slice(-1)[0];
      await sendEmail(email, "Nem sikerült a részlet terhelése", [
        `Kedves ${first}!`,
        "A program legutóbbi részletének terhelése nem sikerült. Semmi gond: a hozzáférésed megmarad, és a következő napokban automatikusan újrapróbáljuk.",
        "Ha közben lejárt vagy megváltozott a kártyád, a programod felületén, az Adataim oldalon a „Fizetési kártya frissítése” gombbal cserélheted. Ha 10 napon belül nem rendeződik, a felület szünetel, amíg a fizetés rendben nem lesz.",
      ]);
      await sendEmail(SITE.adminEmail, `Sikertelen részlet: ${name}`, [
        `${name} (${email}) részletének terhelése nem sikerült. Az ügyfelet értesítettem; 10 nap türelmi idő indult.`,
      ]);
    },
    async sendPaymentFailed(email) {
      await sendEmail(email, "Nem sikerült a tagsági díj terhelése", [
        "Kedves Tagtárs!",
        "A legutóbbi tagsági díj terhelése nem sikerült. Semmi gond: a hozzáférésed megmarad, és a Stripe a következő napokban automatikusan újrapróbálja.",
        "Ha közben lejárt vagy megváltozott a kártyád, a fiókodban az „Előfizetés kezelése” gombbal frissítheted.",
      ]);
    },
  };
}
