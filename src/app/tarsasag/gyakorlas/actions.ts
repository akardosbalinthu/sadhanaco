"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { tp } from "@/lib/site";

/** Mai gyakorlás pipálása / visszavonása. A jogosultságot az RLS ellenőrzi (csak elérhető lecke). */
export async function toggleCompletion(formData: FormData) {
  const lessonId = z.string().uuid().safeParse(formData.get("lessonId"));
  if (!lessonId.success) return;
  const supabase = await createClient();
  const { data: today } = await supabase.rpc("budapest_today");
  const { data: existing } = await supabase
    .from("lesson_completions")
    .select("id")
    .eq("lesson_id", lessonId.data)
    .eq("practiced_on", today as string)
    .maybeSingle();
  if (existing) {
    await supabase.from("lesson_completions").delete().eq("id", existing.id);
  } else {
    await supabase.from("lesson_completions").insert({ lesson_id: lessonId.data });
  }
  revalidatePath(tp("/gyakorlas"), "layout");
}

export async function requestProgression(formData: FormData) {
  const note = String(formData.get("note") ?? "").slice(0, 2000) || null;
  const supabase = await createClient();
  await supabase.rpc("request_progression", { p_note: note ?? undefined });
  revalidatePath(tp("/gyakorlas"));
}
