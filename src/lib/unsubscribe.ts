import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

/** Leiratkozás az értesítő levelekről a levélben kapott tokennel. */
export async function unsubscribeToken(raw: unknown) {
  const token = z.string().uuid().safeParse(raw);
  if (!token.success) return false;
  const { data, error } = await createAdminClient().rpc("unsubscribe_by_token", { p_token: token.data });
  return !error && data === true;
}
