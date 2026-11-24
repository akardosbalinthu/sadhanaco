"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type CeremonyResult =
  | { status: "done"; order: string }
  | { status: "tie"; tied: string[] }
  | { status: "error"; message: string };

const ORDERS = ["tundek", "kertorzok", "torpok", "vandorok"] as const;

/** A pontozás a szerveren történik (submit_compass); a kliens csak a válaszok betűjelét küldi. */
export async function submitCeremony(answers: Record<string, string>, tiebreak?: string): Promise<CeremonyResult> {
  const parsed = z.record(z.string(), z.enum(["a", "b", "c", "d"])).safeParse(answers);
  if (!parsed.success) return { status: "error", message: "Kérlek, minden kérdésre válaszolj." };
  const tb = tiebreak && (ORDERS as readonly string[]).includes(tiebreak) ? (tiebreak as (typeof ORDERS)[number]) : undefined;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_compass", { p_answers: parsed.data, p_tiebreak: tb });
  if (error) {
    if (error.hint === "COMPASS_TIE") return { status: "tie", tied: (error.details ?? "").split(",").filter(Boolean) };
    if (error.hint === "ORDER_LOCKED") return { status: "error", message: "A rended már kiderült, és végleges." };
    if (error.hint === "COMPASS_INCOMPLETE") return { status: "error", message: "Kérlek, minden kérdésre válaszolj." };
    return { status: "error", message: "Most nem sikerült. Kérlek, próbáld újra." };
  }
  return { status: "done", order: data as string };
}
