import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * Service role kliens — megkerüli az RLS-t.
 * KIZÁRÓLAG megbízható szerveroldali kódból: Stripe webhook, cron, belső API.
 * Soha ne használd felhasználói bemenet alapján jogosultság-ellenőrzés nélkül.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nincs beállítva.");
  }
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
