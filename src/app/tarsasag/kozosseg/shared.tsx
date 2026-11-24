import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
export type Author = { display_name: string; is_current_member: boolean; current_stage_label: string | null };

/** A szerzők nyilvános adatai (név; aktív tagnál a gyakorlási fázis). */
export async function loadAuthors(supabase: Supabase, ids: (string | null)[]) {
  const unique = [...new Set(ids.filter(Boolean))] as string[];
  if (unique.length === 0) return new Map<string, Author>();
  const { data } = await supabase.rpc("community_authors", { p_ids: unique });
  return new Map((data ?? []).map((a) => [a.id, a as Author]));
}

const whenFmt = new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
export const when = (iso: string) => whenFmt.format(new Date(iso));

/** Név és — csak aktív tagnál — diszkrét gyakorlási fázis. Volt tagnál csak a név, link nélkül. */
export function AuthorLine({ author, at, edited }: { author: Author | undefined; at: string; edited?: string | null }) {
  return (
    <p className="text-xs text-ink-soft">
      <span className="text-sm text-forest">{author?.display_name || "Egykori tag"}</span>
      {author?.is_current_member && author.current_stage_label && <span className="ml-2 text-gold">{author.current_stage_label}</span>}
      <span className="ml-2">· {when(at)}</span>
      {edited && <span className="ml-1">(szerkesztve)</span>}
    </p>
  );
}
