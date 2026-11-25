"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tp } from "@/lib/site";

/** A bevezető végén: megjegyezzük, hogy a tag látta, és továbbvisszük (Ceremónia vagy gyakorlótér). */
export async function finishOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(tp("/belepes"));
  const { data: profile } = await supabase.from("profiles").select("order_key, onboarded_at").eq("id", user.id).single();
  if (!profile?.onboarded_at) {
    await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", user.id);
  }
  redirect(tp(profile?.order_key ? "/gyakorlas" : "/ceremonia"));
}
