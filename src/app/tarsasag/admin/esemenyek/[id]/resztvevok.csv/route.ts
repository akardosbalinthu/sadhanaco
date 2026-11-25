import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const TZ = "Europe/Budapest";
const fmt = new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
const STATUS: Record<string, string> = { confirmed: "megerősítve", pending_payment: "fizetésre vár", cancelled: "lemondva" };

/** CSV-cella: pontosvessző-elválasztás (magyar Excel), idézőjelezés, képletbefecskendezés ellen védve. */
function cell(v: string | number | null | undefined) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Egy esemény résztvevőlistája CSV-ben (csak admin). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new NextResponse("Nem található.", { status: 404 });
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return new NextResponse("Nem található.", { status: 404 });

  const [{ data: event }, { data: regs }, { data: invites }] = await Promise.all([
    supabase.from("events").select("title, starts_at").eq("id", id).maybeSingle(),
    supabase.from("event_registrations").select("*").eq("event_id", id).order("created_at"),
    supabase.from("event_invitations").select("registration_id, invited_by").eq("event_id", id).not("registration_id", "is", null),
  ]);
  if (!event) return new NextResponse("Nem található.", { status: 404 });

  const inviterOf = new Map((invites ?? []).map((i) => [i.registration_id, i.invited_by]));
  const ids = [...new Set([...(regs ?? []).map((r) => r.user_id), ...(invites ?? []).map((i) => i.invited_by)].filter(Boolean))] as string[];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, display_name, email, tier").in("id", ids)
    : { data: [] };
  const who = new Map((people ?? []).map((p) => [p.id, p]));

  const header = ["Név", "E-mail", "Résztvevő", "Állapot", "Díj (Ft)", "Jelentkezett", "Jelen volt", "Meghívta"];
  const rows = (regs ?? []).map((r) => {
    const p = r.user_id ? who.get(r.user_id) : null;
    const inviter = inviterOf.get(r.id);
    const kind = p
      ? r.tier_at_booking === "belso_kor" ? "A Belső Kör Tagja" : "A Társaság Tagja"
      : inviter ? "túravendég" : "külsős";
    return [
      p?.display_name ?? r.guest_name,
      p?.email ?? r.guest_email,
      kind,
      STATUS[r.status] ?? r.status,
      r.price_huf,
      fmt.format(new Date(r.created_at)),
      r.attended_at ? "igen" : "",
      inviter ? who.get(inviter)?.display_name ?? "" : "",
    ];
  });

  const csv = "﻿" + [header, ...rows].map((row) => row.map(cell).join(";")).join("\r\n") + "\r\n";
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date(event.starts_at));
  const slug = event.title.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="resztvevok-${day}-${slug || "esemeny"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
