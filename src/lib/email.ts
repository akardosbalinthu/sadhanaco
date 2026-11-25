import "server-only";
import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL || "Kardos Bálint <balint@akardosbalint.hu>";

type Link = { href: string; label: string };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A levél HTML- és szövegváltozata; a lábléc opcionális (pl. leiratkozó link). */
export function renderEmail(paragraphs: string[], link?: Link, footer?: { text: string; href: string; label: string }) {
  const html = `<div style="font-family:Georgia,serif;background:#faf9f6;color:#1f2421;padding:32px;line-height:1.6">
${paragraphs.map((p) => `<p style="margin:0 0 16px">${esc(p)}</p>`).join("\n")}
${link ? `<p style="margin:24px 0"><a href="${esc(link.href)}" style="background:#1c2520;color:#faf9f6;padding:10px 18px;border-radius:6px;text-decoration:none">${esc(link.label)}</a></p>` : ""}
<p style="margin:32px 0 0;color:#4d544f;font-size:13px">Jelenlét – Tudatosság – Szabadság<br>Kardos Bálint · A Társaság</p>
${footer ? `<p style="margin:16px 0 0;color:#4d544f;font-size:12px">${esc(footer.text)} <a href="${esc(footer.href)}" style="color:#4d544f">${esc(footer.label)}</a></p>` : ""}
</div>`;
  const text = [
    ...paragraphs,
    link ? `${link.label}: ${link.href}` : "",
    "",
    "Kardos Bálint · A Társaság",
    footer ? `${footer.text} ${footer.label}: ${footer.href}` : "",
  ].join("\n\n");
  return { html, text };
}

export type BulkMessage = { to: string; subject: string; html: string; text: string; headers?: Record<string, string> };

/** Tömeges küldés 100-as csomagokban (Resend batch). Visszaadja, hány levél ment ki. */
export async function sendBulk(messages: BulkMessage[]) {
  const key = process.env.RESEND_API_KEY;
  if (!key || messages.length === 0) return { sent: 0, failed: messages.length };
  const resend = new Resend(key);
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const { error } = await resend.batch.send(chunk.map((m) => ({ from: FROM, ...m })));
      if (error) failed += chunk.length;
      else sent += chunk.length;
    } catch {
      failed += chunk.length;
    }
  }
  return { sent, failed };
}

/** Egyszerű, nyugodt hangú tranzakciós levél. Hiba esetén nem dob: a fizetés feldolgozását nem akaszthatja meg. */
export async function sendEmail(to: string, subject: string, paragraphs: string[], link?: Link) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false as const, error: "RESEND_API_KEY nincs beállítva" };
  const { html, text } = renderEmail(paragraphs, link);
  try {
    const { error } = await new Resend(key).emails.send({ from: FROM, to, subject, html, text });
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}
