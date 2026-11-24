import Link from "next/link";
import { HeartHandshake, MessageCircle, Sparkles } from "lucide-react";
import { requireMember } from "@/lib/member";
import { tp } from "@/lib/site";
import { MemberNav } from "@/components/member-nav";
import { buttonPrimary, GildedCard, inputClass } from "@/components/ornaments";
import { createPost } from "./actions";
import { AuthorLine, loadAuthors } from "./shared";

export const metadata = { title: "Közösség · A Társaság", robots: { index: false, follow: false } };

const PAGE = 20;
const FILTERS = [
  { key: "", label: "Minden bejegyzés" },
  { key: "megvalaszolatlan", label: "Megválaszolatlan posztok" },
  { key: "penteki-kor", label: "Pénteki kör" },
] as const;

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CommunityPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase, hasAccess } = await requireMember();
  const filter = one(sp.szuro);
  const before = one(sp.elott);
  const hiba = one(sp.hiba);

  if (!hasAccess) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <MemberNav active="/kozosseg" />
        <GildedCard className="text-sm text-ink-soft">A közösségi tér A Társaság aktív tagjainak érhető el.</GildedCard>
      </main>
    );
  }

  let q = supabase.from("post_feed").select("*").order("created_at", { ascending: false }).limit(PAGE + 1);
  if (filter === "megvalaszolatlan") q = q.eq("is_unanswered", true).eq("kind", "normal");
  if (filter === "penteki-kor") q = q.eq("kind", "penteki_kor");
  if (before && !Number.isNaN(Date.parse(before))) q = q.lt("created_at", before);
  const { data: rows } = await q;
  const posts = (rows ?? []).slice(0, PAGE);
  const hasMore = (rows ?? []).length > PAGE;
  const authors = await loadAuthors(supabase, posts.map((p) => p.author_id));
  const href = (params: Record<string, string>) => {
    const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return tp(`/kozosseg${s ? `?${s}` : ""}`);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <MemberNav active="/kozosseg" />

      <p className="text-xs uppercase tracking-[0.25em] text-gold">A Társaság · Közösség</p>
      <h1 className="mt-3 font-serif text-4xl text-forest">Tapasztalat, nem tanácsadás.</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Itt azt osztjuk meg, amit a saját gyakorlásunkban észrevettünk: mi segített egy nehezebb estén, mi működött
        élesben. Nem diagnosztizálunk és nem okítunk — egymás mellett haladunk.
      </p>

      {hiba && <p role="status" className="mt-6 rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">{hiba}</p>}

      <details className="group mt-8">
        <summary className={`${buttonPrimary} cursor-pointer list-none`}>Megosztok valamit</summary>
        <GildedCard className="mt-4">
          <form action={createPost} className="space-y-3">
            <input name="title" maxLength={200} placeholder="Cím (nem kötelező)" className={inputClass} />
            <textarea
              name="body"
              required
              rows={6}
              maxLength={10000}
              placeholder="Mit tapasztaltál? Ha kérdésed van, írd le azt is, hol tartasz most az úton."
              className={inputClass}
            />
            <button className={buttonPrimary}>Közzéteszem</button>
          </form>
        </GildedCard>
      </details>

      <nav className="mt-10 flex flex-wrap gap-2" aria-label="Szűrés">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={href({ szuro: f.key })}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors duration-300 ${
              filter === f.key ? "border-gold text-forest" : "border-line text-ink-soft hover:border-gold/60"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {filter === "megvalaszolatlan" && (
        <p className="mt-3 text-sm text-ink-soft">Ezekre még senki nem válaszolt. Ha van egy saját tapasztalatod, most sokat jelenthet.</p>
      )}

      {posts.length === 0 ? (
        <GildedCard className="mt-6 text-sm text-ink-soft">
          {filter === "megvalaszolatlan" ? "Most minden bejegyzésre érkezett válasz." : "Még nincs bejegyzés. Lehetsz te az első."}
        </GildedCard>
      ) : (
        <ul className="mt-6 space-y-4">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={tp(`/kozosseg/${p.id}`)} className="group block">
                <GildedCard className={p.kind === "penteki_kor" ? "border-gold/50" : ""}>
                  {p.kind === "penteki_kor" && (
                    <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-gold">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden /> Pénteki kör
                    </p>
                  )}
                  {p.title && <h2 className="font-serif text-xl text-forest transition-colors duration-300 group-hover:text-gold">{p.title}</h2>}
                  <p className={`line-clamp-3 whitespace-pre-line text-sm text-ink ${p.title ? "mt-2" : ""}`}>{p.body}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <AuthorLine author={p.author_id ? authors.get(p.author_id) : undefined} at={p.created_at!} />
                    <p className="flex items-center gap-4 text-xs text-ink-soft">
                      <span className="flex items-center gap-1" title="Hozzászólások">
                        <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden /> {p.comment_count}
                      </span>
                      <span className="flex items-center gap-1" title="Köszönöm, hasznos volt · Hasonlót tapasztaltam">
                        <HeartHandshake className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden /> {(p.koszonom_count ?? 0) + (p.hasonlot_count ?? 0)}
                      </span>
                      {p.is_unanswered && p.kind === "normal" && <span className="text-gold">még nincs válasz</span>}
                    </p>
                  </div>
                </GildedCard>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="mt-8 text-center">
          <Link href={href({ szuro: filter, elott: posts[posts.length - 1].created_at! })} className="text-sm text-forest underline decoration-gold/60 underline-offset-4 hover:text-gold">
            Korábbi bejegyzések
          </Link>
        </div>
      )}
    </main>
  );
}
