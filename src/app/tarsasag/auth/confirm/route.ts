import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tp } from "@/lib/site";

/** Magic Link visszahívás: a token_hash ellenőrzése és munkamenet létrehozása. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? tp("/gyakorlas");
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : tp("/gyakorlas");

  const code = searchParams.get("code");
  const supabase = await createClient();

  // 1) token_hash folyamat (egyedi e-mail sablonnal, eszközfüggetlen)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  // 2) PKCE folyamat (alapértelmezett sablon; ugyanabban a böngészőben kell megnyitni)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL(`${tp("/belepes")}?hiba=link`, origin));
}
