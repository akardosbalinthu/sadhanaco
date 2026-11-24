"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { budapestLocalToIso } from "@/lib/admin";
import { tp } from "@/lib/site";

function back(msg: { ok?: string; hiba?: string }): never {
  const q = new URLSearchParams(Object.entries(msg).filter(([, v]) => v) as [string, string][]).toString();
  redirect(`${tp("/konzultacio")}?${q}`);
}

const ERR: Record<string, string> = {
  TRIAL_NOT_ALLOWED: "Konzultációt a próbaidő után lehet foglalni.",
  NOT_MEMBER: "Konzultációt aktív tagsággal lehet foglalni.",
  QUOTA_EXHAUSTED: "Ebben az évben már felhasználtad a díjmentes alkalmaidat.",
  INVALID_TIME: "Jövőbeli időpontot adj meg.",
};

/** Díjmentes konzultáció (A Belső Kör éves keretéből). Az időpont csak javaslat; Bálint visszajelez. */
export async function bookFreeConsultation(fd: FormData) {
  const note = z.string().trim().max(2000).safeParse(fd.get("note") ?? "");
  if (!note.success) back({ hiba: "A megjegyzés legfeljebb 2000 karakter lehet." });
  const when = budapestLocalToIso(String(fd.get("requested_for") ?? ""));
  const supabase = await createClient();
  const { error } = await supabase.rpc("book_free_consultation", {
    p_requested_for: when ?? undefined,
    p_note: note.data || undefined,
  });
  if (error) back({ hiba: ERR[error.hint ?? ""] ?? "A foglalás most nem sikerült. Kérlek, próbáld újra." });
  revalidatePath(tp("/konzultacio"));
  back({ ok: "Megkaptam a kérésed. Hamarosan jelentkezem, és egyeztetjük a pontos időpontot." });
}
