import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvedTarsasagUrl } from "@/lib/site";

/**
 * Belépő link (egyszer használatos), a Supabase Auth által aláírt tokennel.
 * token_hash formában, így bármelyik eszközön és böngészőben működik (nem kell hozzá
 * ugyanaz a böngésző, ahol a belépést kérték). A levelet mi küldjük, magyarul.
 */
export async function magicLinkFor(email: string, next?: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) return null;
  const url = new URL(`${resolvedTarsasagUrl().replace(/\/$/, "")}/auth/confirm`);
  url.searchParams.set("token_hash", data.properties.hashed_token);
  url.searchParams.set("type", "magiclink");
  if (next) url.searchParams.set("next", next);
  return url.toString();
}
