"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { tp } from "@/lib/site";

const name = z.string().trim().min(1, "kötelező").max(60);

export async function saveNames(formData: FormData) {
  const parsed = z
    .object({
      last_name: name,
      first_name: name,
      nickname: z.string().trim().max(30).refine((v) => !v.includes('"'), "idézőjel nélkül"),
    })
    .safeParse({
      last_name: formData.get("last_name") ?? "",
      first_name: formData.get("first_name") ?? "",
      nickname: formData.get("nickname") ?? "",
    });
  if (!parsed.success) {
    redirect(`${tp("/adataim")}?hiba=${encodeURIComponent("A vezeték- és keresztnév kötelező; a becenév legfeljebb 30 karakter, idézőjel nélkül.")}`);
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(tp("/belepes"));
  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, nickname: parsed.data.nickname || null })
    .eq("id", user.id);
  if (error) redirect(`${tp("/adataim")}?hiba=${encodeURIComponent("Most nem sikerült menteni. Kérlek, próbáld újra.")}`);
  revalidatePath(tp("/"), "layout");
  redirect(`${tp("/adataim")}?ok=1`);
}

/** Értesítő levelek az újdonságokról (új esemény, bejegyzés, szavazás) – be- és kikapcsolás. */
export async function setNotifications(formData: FormData) {
  const on = formData.get("on") === "true";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(tp("/belepes"));
  const { error } = await supabase.from("profiles").update({ notify_admin_updates: on }).eq("id", user.id);
  if (error) redirect(`${tp("/adataim")}?hiba=${encodeURIComponent("Most nem sikerült menteni. Kérlek, próbáld újra.")}#ertesitesek`);
  revalidatePath(tp("/adataim"));
  redirect(`${tp("/adataim")}?ok=1#ertesitesek`);
}
