"use server";

import { z } from "zod";
import { RoomServiceClient, TrackType } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";
import { liveKitConfigured } from "@/lib/livekit";

/** Házigazda: minden más résztvevő mikrofonjának lenémítása (pl. a meditáció elején). */
export async function muteEveryone(eventId: string): Promise<{ ok: boolean; muted: number }> {
  const id = z.string().uuid().safeParse(eventId);
  if (!id.success || !liveKitConfigured()) return { ok: false, muted: 0 };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!user || !isAdmin) return { ok: false, muted: 0 };

  const host = process.env.LIVEKIT_URL!.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
  const svc = new RoomServiceClient(host, process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);
  try {
    const participants = await svc.listParticipants(id.data);
    let muted = 0;
    for (const p of participants) {
      if (p.identity === user.id) continue;
      for (const t of p.tracks) {
        if (t.type === TrackType.AUDIO && !t.muted) {
          await svc.mutePublishedTrack(id.data, p.identity, t.sid, true);
          muted++;
        }
      }
    }
    return { ok: true, muted };
  } catch {
    return { ok: false, muted: 0 };
  }
}
