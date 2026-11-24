"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tp } from "@/lib/site";

/** A tag maga dönti el, szerepel-e a ranglistán (a saját helyét így is látja). */
export async function setHidden(formData: FormData) {
  const hidden = formData.get("hidden") === "true";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ leaderboard_hidden: hidden }).eq("id", user.id);
  revalidatePath(tp("/ranglista"));
}
