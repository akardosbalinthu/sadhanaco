"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { SITE, tp } from "@/lib/site";

const schema = z.object({
  practice_days: z.coerce.number().int().min(0).max(7),
  went_well: z.string().max(4000).optional(),
  was_hard: z.string().max(4000).optional(),
  question: z.string().max(4000).optional(),
});

export async function submitReport(fd: FormData) {
  const parsed = schema.safeParse({
    practice_days: fd.get("practice_days"),
    went_well: fd.get("went_well") ?? undefined,
    was_hard: fd.get("was_hard") ?? undefined,
    question: fd.get("question") ?? undefined,
  });
  if (!parsed.success) redirect(`${tp("/beszamolo")}?hiba=${encodeURIComponent("Kérlek, jelöld be, hány napon gyakoroltál.")}`);
  const supabase = await createClient();
  const { data: r, error } = await supabase.rpc("submit_weekly_report", {
    p_practice_days: parsed.data.practice_days,
    p_went_well: parsed.data.went_well ?? "",
    p_was_hard: parsed.data.was_hard ?? "",
    p_question: parsed.data.question ?? "",
  });
  if (error || !r) redirect(`${tp("/beszamolo")}?hiba=${encodeURIComponent("Most nem sikerült elmenteni. Kérlek, próbáld újra.")}`);

  const { data: me } = await supabase.from("profiles").select("first_name, last_name, email").single();
  const who = [me?.last_name, me?.first_name].filter(Boolean).join(" ") || me?.email || "Egy résztvevő";
  await sendEmail(
    SITE.adminEmail,
    `Heti beszámoló — ${who}`,
    [`${who} megírta a heti beszámolóját (${parsed.data.practice_days} gyakorlónap).`, parsed.data.question ? `Kérdése is van: ${parsed.data.question}` : ""].filter(Boolean),
    { href: `${publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "")}/admin/resztvevok/${r.enrollment_id}`, label: "Megnézem" },
  );
  redirect(`${tp("/beszamolo")}?ok=1`);
}
