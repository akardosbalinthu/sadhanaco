import "server-only";
import { notFound, redirect } from "next/navigation";
import { requireMember } from "@/lib/member";
import { tp } from "@/lib/site";

/**
 * Admin-kapu: csak admin vagy superadmin léphet tovább, mindenki más 404-et kap
 * (az admin felület létezését sem fedjük fel). Az RLS ettől függetlenül is véd.
 */
export async function requireAdmin() {
  const ctx = await requireMember();
  if (ctx.profile.role !== "admin" && ctx.profile.role !== "superadmin") notFound();
  return { ...ctx, isSuperadmin: ctx.profile.role === "superadmin" };
}

/** Visszairányítás az admin oldalra üzenettel (siker vagy hiba). */
export function back(path: string, msg: { ok?: string; hiba?: string } = {}): never {
  const q = new URLSearchParams(Object.entries(msg).filter(([, v]) => v) as [string, string][]).toString();
  redirect(`${tp(`/admin${path}`)}${q ? (path.includes("?") ? "&" : "?") + q : ""}`);
}

const TZ = "Europe/Budapest";

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, dateStyle: "medium" }).format(new Date(iso));
}

export const huf = (n: number | null | undefined) =>
  n == null ? "—" : `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;

/** A Budapest és az UTC közti eltérés percben az adott pillanatban. */
function budapestOffsetMinutes(at: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** <input type="datetime-local"> értéke (Budapest-idő) → ISO időbélyeg. Üres → null. */
export function budapestLocalToIso(local: string | null | undefined): string | null {
  if (!local) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Kétlépéses közelítés, hogy az óraátállítás körül is pontos legyen.
  let ts = naive - budapestOffsetMinutes(new Date(naive)) * 60000;
  ts = naive - budapestOffsetMinutes(new Date(ts)) * 60000;
  return new Date(ts).toISOString();
}

/** ISO időbélyeg → datetime-local mező értéke Budapest-idő szerint. */
export function isoToBudapestLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() + budapestOffsetMinutes(d) * 60000).toISOString().slice(0, 16);
}

/** Egy halmaz tag neve és e-mail-címe azonosító szerint (admin RLS mellett). */
export async function profilesById(
  supabase: Awaited<ReturnType<typeof requireMember>>["supabase"],
  ids: (string | null | undefined)[],
) {
  const unique = [...new Set(ids.filter(Boolean))] as string[];
  if (unique.length === 0) return new Map<string, { display_name: string; email: string }>();
  const { data } = await supabase.from("profiles").select("id, display_name, email").in("id", unique);
  return new Map((data ?? []).map((p) => [p.id, { display_name: p.display_name, email: p.email }]));
}

export const TIER_LABEL = { none: "—", tarsasagi: "A Társaság Tagja", belso_kor: "A Belső Kör Tagja" } as const;
export const STATUS_LABEL: Record<string, string> = {
  none: "nincs",
  trialing: "próbaidő",
  active: "aktív",
  past_due: "elmaradt fizetés",
  canceled: "lemondva",
  unpaid: "fizetetlen",
  incomplete: "befejezetlen",
  incomplete_expired: "lejárt",
  paused: "szüneteltetve",
};
export const EVENT_KIND_LABEL = {
  nyilt_est: "Nyílt Meditációs Est",
  gyakorlonap: "Élő Gyakorlónap",
  elvonulas: "Szabadság Elvonulás",
  online_meditacio: "Online közös meditáció",
  qa_elo: "Élő kérdezz-felelek",
  tura: "Közös túra",
} as const;
