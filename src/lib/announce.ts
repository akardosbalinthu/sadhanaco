import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderEmail, sendBulk, type BulkMessage } from "@/lib/email";
import { resolvedSiteUrl, resolvedTarsasagUrl } from "@/lib/site";

export type AnnouncementKind = "event" | "post" | "poll";

/**
 * Értesítő levél minden tagnak egy új admin-tevékenységről (CLAUDE.md 7.19).
 * - Tételenként csak egyszer megy ki (claim_announcement).
 * - A küldés a válasz után, a háttérben fut (after), hogy az admin felület ne várjon rá.
 * - Minden levélben ott a leiratkozás (link + egykattintásos List-Unsubscribe fejléc).
 */
export function announceToMembers(
  kind: AnnouncementKind,
  id: string,
  content: { subject: string; paragraphs: string[]; linkPath: string; linkLabel: string },
) {
  after(async () => {
    const admin = createAdminClient();
    const { data: claimed, error } = await admin.rpc("claim_announcement", { p_kind: kind, p_id: id });
    if (error || !claimed) return;
    const { data: recipients } = await admin.rpc("announcement_recipients");
    if (!recipients?.length) return;

    const site = resolvedSiteUrl().replace(/\/$/, "");
    const link = { href: `${resolvedTarsasagUrl().replace(/\/$/, "")}${content.linkPath}`, label: content.linkLabel };
    const messages: BulkMessage[] = recipients.map((r) => {
      const unsubPage = `${site}/leiratkozas?t=${r.email_token}`;
      const { html, text } = renderEmail([r.first_name ? `Kedves ${r.first_name}!` : "Kedves Tagtárs!", ...content.paragraphs], link, {
        text: "A Társaság újdonságairól azért kapod ezt a levelet, mert tag vagy.",
        href: unsubPage,
        label: "Leiratkozom ezekről a levelekről",
      });
      return {
        to: r.email,
        subject: content.subject,
        html,
        text,
        headers: {
          "List-Unsubscribe": `<${site}/api/leiratkozas?t=${r.email_token}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });
    const res = await sendBulk(messages);
    if (res.failed > 0) console.error(`Értesítő (${kind} ${id}): ${res.failed} levél nem ment ki, ${res.sent} kiment.`);
  });
}
