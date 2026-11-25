import "server-only";
import { AccessToken, TrackSource } from "livekit-server-sdk";

export type LiveRole = "host" | "speaker" | "viewer";

/** Be van-e állítva a LiveKit (a kulcsokat a Vercelen titkos változóként kell megadni). */
export function liveKitConfigured() {
  return !!(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
}

/**
 * Rövid életű belépő egy élő alkalom szobájába. A jogosultságot előtte a join_live_event dönti el;
 * itt csak a szerepnek megfelelő jogokat adjuk meg:
 *  - host: kamera, mikrofon, képernyőmegosztás, szobakezelés (mindenki lenémítása)
 *  - speaker: kamera és mikrofon
 *  - viewer: csak néz és hallgat (a csevegés engedett)
 */
export async function liveToken(opts: { room: string; identity: string; name: string; role: LiveRole; validUntil: Date }) {
  const ttlSeconds = Math.max(15 * 60, Math.min(6 * 3600, Math.round((opts.validUntil.getTime() - Date.now()) / 1000) + 30 * 60));
  const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
    identity: opts.identity,
    name: opts.name,
    ttl: ttlSeconds,
    metadata: JSON.stringify({ role: opts.role }),
  });
  at.addGrant({
    room: opts.room,
    roomJoin: true,
    canSubscribe: true,
    canPublishData: true,
    canPublish: opts.role !== "viewer",
    canPublishSources:
      opts.role === "host"
        ? [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO]
        : opts.role === "speaker"
          ? [TrackSource.CAMERA, TrackSource.MICROPHONE]
          : [],
    roomAdmin: opts.role === "host",
    canUpdateOwnMetadata: false,
  });
  return at.toJwt();
}
