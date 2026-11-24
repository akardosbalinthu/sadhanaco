"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { tp } from "@/lib/site";

export async function addEntry(formData: FormData) {
  const body = z.string().trim().min(1).max(10000).safeParse(formData.get("body"));
  if (!body.success) return;
  const supabase = await createClient();
  await supabase.from("journal_entries").insert({ body: body.data });
  revalidatePath(tp("/naplo"));
}
