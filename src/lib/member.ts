import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tp } from "@/lib/site";

/** A bejelentkezett tag és profilja; ha nincs munkamenet, a belépésre irányít. A jogosultságot az RLS is ellenőrzi. */
export async function requireMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(tp("/belepes"));
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect(tp("/belepes"));
  const hasAccess =
    profile.tier !== "none" && ["active", "trialing", "past_due"].includes(profile.subscription_status);
  return { supabase, user, profile, hasAccess };
}

export const ORDER_INFO = {
  tundek: { name: "Tündék", single: "Tünde", gift: "Finom érzékelés és tudatosság", motto: "Ők veszik észre elsőként, ha megváltozik a levegő." },
  kertorzok: { name: "Kertőrzők", single: "Kertőrző", gift: "Jelenlét és belső béke", motto: "Számukra a világ egy kertben kezdődik: amit gondozol, az megnő." },
  torpok: { name: "Törpök", single: "Törp", gift: "Állhatatosság és belső rend", motto: "Mélyre ásnak, és amit építenek, az megmarad." },
  vandorok: { name: "Vándorok", single: "Vándor", gift: "Bátorság és fókusz", motto: "Az út az otthonuk; a kihívás kitisztítja őket." },
} as const;
export type OrderKey = keyof typeof ORDER_INFO;
