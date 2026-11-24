"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export type AcceptState = { status: "idle" } | { status: "ok"; title: string } | { status: "error"; message: string };

/** A meghívó elfogadása gombnyomásra (a levelezők linkellenőrzői nem fogadhatják el helyetted). */
export async function acceptInvitation(_prev: AcceptState, fd: FormData): Promise<AcceptState> {
  const token = z.string().regex(/^[0-9a-f]{48}$/).safeParse(fd.get("t"));
  if (!token.success) return { status: "error", message: "Ez a meghívó nem érvényes." };
  const admin = createAdminClient();
  const { data: reg, error } = await admin.rpc("accept_hike_invitation", { p_token: token.data });
  if (error) {
    const msg: Record<string, string> = {
      INVITATION_INVALID: "Ez a meghívó nem érvényes, vagy visszavonták.",
      REGISTRATION_CLOSED: "Erre a túrára már nem lehet jelentkezni.",
      EVENT_FULL: "Sajnos minden hely betelt erre a túrára.",
    };
    return { status: "error", message: msg[error.hint ?? ""] ?? "A meghívót most nem sikerült elfogadni. Kérlek, próbáld újra." };
  }
  const { data: ev } = await admin.from("events").select("title").eq("id", reg.event_id).single();
  return { status: "ok", title: ev?.title ?? "a túra" };
}
