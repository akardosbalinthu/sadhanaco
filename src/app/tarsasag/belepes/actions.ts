"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { magicLinkFor } from "@/lib/auth-links";
import { sendEmail } from "@/lib/email";
import { tp } from "@/lib/site";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  tovabb: z.string().optional(),
});

/** Csak belső, relatív útvonalra engedünk visszairányítani (open redirect ellen). */
function safeNext(next: string | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return tp("/program");
  return next;
}

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    tovabb: formData.get("tovabb") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: "Kérlek, adj meg egy érvényes e-mail-címet." };
  }

  const email = parsed.data.email;
  const sent: LoginState = { status: "sent", email };
  const admin = createAdminClient();

  // Fiókot csak sikeres fizetés hoz létre – belépéssel nem regisztrálunk. Ismeretlen címre nem
  // küldünk levelet, de ugyanazt válaszoljuk, hogy ne derüljön ki, kinek van fiókja.
  const { data: profile } = await admin.from("profiles").select("id, first_name").eq("email", email).maybeSingle();
  if (!profile) return sent;

  // Visszaélés ellen: egy címre legfeljebb percenként egy belépő levél.
  const { data: auth } = await admin.auth.admin.getUserById(profile.id);
  const last = auth?.user?.recovery_sent_at ? Date.parse(auth.user.recovery_sent_at) : 0;
  if (Date.now() - last < 60_000) return sent;

  const link = await magicLinkFor(email, safeNext(parsed.data.tovabb));
  if (!link) {
    return { status: "error", message: "Most nem sikerült elküldeni a levelet. Próbáld újra pár perc múlva." };
  }
  const res = await sendEmail(
    email,
    "Belépő link a programodhoz",
    [
      profile.first_name ? `Kedves ${profile.first_name}!` : "Kedves Résztvevő!",
      "Ezzel a linkkel léphetsz be a programod felületére. A link egyszer használható, és egy órán át érvényes – bármelyik eszközön megnyithatod.",
      "Ha nem te kérted, nyugodtan hagyd figyelmen kívül ezt a levelet.",
    ],
    { href: link, label: "Belépek" },
  );
  if (!res.ok) {
    return { status: "error", message: "Most nem sikerült elküldeni a levelet. Próbáld újra pár perc múlva." };
  }
  return { status: "sent", email: parsed.data.email };
}
