import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

/** Böngészőoldali Supabase kliens (anon kulcs, RLS alatt fut). */
export function createClient() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
