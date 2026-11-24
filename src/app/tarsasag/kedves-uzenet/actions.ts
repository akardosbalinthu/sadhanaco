"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { firstIssue, kindMessageError, messageFields, type FormState } from "@/lib/kind-message";
import { tp } from "@/lib/site";

const schema = z.object({ ...messageFields, kind: z.enum(["priority", "standard"], { message: "Válaszd ki az üzenet fajtáját." }) });

/** Tagi üzenet: elsőbbségi a havi keretből, vagy díjmentes (megerősítés nélkül). */
export async function sendMemberMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };
  const d = parsed.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Kérlek, lépj be újra." };
  const { data: access } = await supabase.rpc("has_member_access");
  if (!access) return { status: "error", message: "Az üzenetküldés a Társaságból aktív tagsággal érhető el." };

  if (d.kind === "priority") {
    // A keret, a próbaidő és a tagság ellenőrzése az adatbázisban, atomi zárolással.
    const { error } = await supabase.rpc("send_free_kind_message", {
      p_recipient_name: d.recipient_name,
      p_recipient_phone: d.recipient_phone,
      p_message: d.message,
    });
    if (error) return { status: "error", message: kindMessageError(error.hint) };
  } else {
    const { error } = await createAdminClient().rpc("submit_kind_message", {
      p_recipient_name: d.recipient_name,
      p_recipient_phone: d.recipient_phone,
      p_message: d.message,
      p_sender: user.id,
    });
    if (error) return { status: "error", message: kindMessageError(error.hint) };
  }
  revalidatePath(tp("/kedves-uzenet"));
  return {
    status: "done",
    message:
      d.kind === "priority"
        ? `Köszönöm! Az elsőbbségi üzeneted ${d.recipient_name} részére bekerült a sor elejére. Kézbesítési garanciával viszem: addig próbálom, amíg el nem érem.`
        : `Köszönöm! Az üzeneted ${d.recipient_name} részére bekerült a kézbesítési sorba.`,
  };
}
