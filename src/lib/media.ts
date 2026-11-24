import "server-only";
import { createHash } from "node:crypto";

/**
 * Bunny Stream beágyazott lejátszó időkorlátos, aláírt linkkel.
 * A Bunny könyvtárban be kell kapcsolni az „Embed view token authentication”-t;
 * ekkor a lejátszó csak érvényes tokennel indul el, így a link nem osztható meg tartósan.
 * Token = SHA256_HEX(token_security_key + video_id + expires).
 * A hanganyagokat is Stream-videóként töltjük fel (állóképpel), így egy lejátszó kezel mindent.
 */
export function bunnyEmbedUrl(videoId: string, ttlSeconds = 3 * 60 * 60): string | null {
  const library = process.env.BUNNY_STREAM_LIBRARY_ID;
  const key = process.env.BUNNY_TOKEN_AUTH_KEY;
  if (!library || !key || !/^[A-Za-z0-9-]{1,64}$/.test(videoId)) return null;
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const token = createHash("sha256").update(key + videoId + expires).digest("hex");
  const q = new URLSearchParams({ token, expires: String(expires), autoplay: "false", preload: "true", responsive: "true" });
  return `https://iframe.mediadelivery.net/embed/${encodeURIComponent(library)}/${encodeURIComponent(videoId)}?${q}`;
}
