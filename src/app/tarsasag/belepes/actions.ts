"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
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
  if (!next || !next.startsWith("/") || next.startsWith("//")) return tp("/gyakorlas");
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

  const supabase = await createClient();
  const redirect = new URL(`${publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "")}/auth/confirm`);
  redirect.searchParams.set("next", safeNext(parsed.data.tovabb));

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: redirect.toString(),
      // Fiókot csak sikeres fizetés hoz létre (2. fázis) — belépéssel nem regisztrálunk.
      shouldCreateUser: false,
    },
  });

  // Szándékosan nem áruljuk el, hogy létezik-e a cím: mindig ugyanazt válaszoljuk.
  if (error && error.status !== 422 && error.status !== 400) {
    return { status: "error", message: "Most nem sikerült elküldeni a levelet. Próbáld újra pár perc múlva." };
  }
  return { status: "sent", email: parsed.data.email };
}
