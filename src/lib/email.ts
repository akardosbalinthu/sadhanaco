import "server-only";
import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL || "Kardos Bálint <balint@akardosbalint.hu>";

/** Egyszerű, nyugodt hangú tranzakciós levél. Hiba esetén nem dob: a fizetés feldolgozását nem akaszthatja meg. */
export async function sendEmail(to: string, subject: string, paragraphs: string[], link?: { href: string; label: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false as const, error: "RESEND_API_KEY nincs beállítva" };
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<div style="font-family:Georgia,serif;background:#faf9f6;color:#1f2421;padding:32px;line-height:1.6">
${paragraphs.map((p) => `<p style="margin:0 0 16px">${esc(p)}</p>`).join("\n")}
${link ? `<p style="margin:24px 0"><a href="${esc(link.href)}" style="background:#1c2520;color:#faf9f6;padding:10px 18px;border-radius:6px;text-decoration:none">${esc(link.label)}</a></p>` : ""}
<p style="margin:32px 0 0;color:#4d544f;font-size:13px">Jelenlét – Tudatosság – Szabadság<br>Kardos Bálint · A Társaság</p>
</div>`;
  const text = [...paragraphs, link ? `${link.label}: ${link.href}` : "", "", "Kardos Bálint · A Társaság"].join("\n\n");
  try {
    const { error } = await new Resend(key).emails.send({ from: FROM, to, subject, html, text });
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}
