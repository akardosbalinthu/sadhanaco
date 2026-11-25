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
  // Hozzáférés: aktív programrészvétel (vagy a régi tagság) – ugyanaz a szabály, mint az RLS-ben.
  const { data: access } = await supabase.rpc("has_member_access");
  const hasAccess = Boolean(access);
  // Az admin (tagság nélkül is) a közösségben és az eseményeknél ott lehet: ír, hozzászól, élő alkalmat vezet.
  const isAdmin = profile.role === "admin" || profile.role === "superadmin";
  return { supabase, user, profile, hasAccess, isAdmin };
}

export const ORDER_INFO = {
  tundek: { name: "Tündék", single: "Tünde", gift: "Finom érzékelés és tudatosság", motto: "Ők veszik észre elsőként, ha megváltozik a levegő." },
  kertorzok: { name: "Kertőrzők", single: "Kertőrző", gift: "Jelenlét és belső béke", motto: "Számukra a világ egy kertben kezdődik: amit gondozol, az megnő." },
  torpok: { name: "Törpök", single: "Törp", gift: "Állhatatosság és belső rend", motto: "Mélyre ásnak, és amit építenek, az megmarad." },
  vandorok: { name: "Vándorok", single: "Vándor", gift: "Bátorság és fókusz", motto: "Az út az otthonuk; a kihívás kitisztítja őket." },
  // Az adminok rendje: szerepkörrel jár, a Ceremónia nem ad ilyet, és a nyilvános oldal sem hirdeti.
  magusok: { name: "Mágusok", single: "Mágus", gift: "Az út megtartása és továbbadása", motto: "Ők tartják a tüzet, hogy mások is hazataláljanak." },
} as const;
/** A négy tagi rend (a Ceremónia ezek közül választ). */
export const MEMBER_ORDERS = ["tundek", "kertorzok", "torpok", "vandorok"] as const;
export type OrderKey = keyof typeof ORDER_INFO;

export const TRACK_LABEL: Record<string, string> = {
  gyakorlas: "Napi gyakorlás",
  tudas: "Elmélet",
  ritual_reggeli: "Reggeli rituálé",
  ritual_esti: "Esti rituálé",
};
