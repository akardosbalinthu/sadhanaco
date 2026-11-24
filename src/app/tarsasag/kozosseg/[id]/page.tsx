import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { z } from "zod";
import { requireMember } from "@/lib/member";
import { tp } from "@/lib/site";
import { MemberNav } from "@/components/member-nav";
import { buttonPrimary, GildedCard, inputClass } from "@/components/ornaments";
import {
  addComment,
  deleteComment,
  deletePost,
  editPost,
  hideComment,
  hidePost,
  toggleSimilar,
  toggleThanks,
  unhideComment,
  unhidePost,
} from "../actions";
import { AuthorLine, loadAuthors } from "../shared";

export const metadata = { title: "Közösség · A Társaság", robots: { index: false, follow: false } };

type SP = Promise<Record<string, string | string[] | undefined>>;
const quiet = "text-xs text-ink-soft transition-colors duration-300 hover:text-gold";

export default async function PostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { supabase, user, profile, hasAccess } = await requireMember();
  const isAdmin = profile.role === "admin" || profile.role === "superadmin";
  if (!hasAccess && !isAdmin) notFound();

  const { data: post } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!post) notFound();
  const [{ data: comments }, { data: reactions }] = await Promise.all([
    supabase.from("comments").select("*").eq("post_id", id).order("created_at"),
    supabase.from("post_reactions").select("user_id, kind").eq("post_id", id),
  ]);
  const authors = await loadAuthors(supabase, [post.author_id, ...(comments ?? []).map((c) => c.author_id)]);
  const count = (k: string) => (reactions ?? []).filter((r) => r.kind === k).length;
  const mine = (k: string) => (reactions ?? []).some((r) => r.kind === k && r.user_id === user.id);
  const isMine = post.author_id === user.id;
  const hiba = typeof sp.hiba === "string" ? sp.hiba : "";

  const reactionButton = (k: "koszonom" | "hasonlot", label: string, action: (fd: FormData) => Promise<void>) => (
    <form action={action}>
      <input type="hidden" name="postId" value={post.id} />
      <button
        disabled={isMine}
        aria-pressed={mine(k)}
        className={`rounded-full border px-4 py-1.5 text-sm transition-colors duration-300 disabled:cursor-default disabled:opacity-60 ${
          mine(k) ? "border-gold bg-gold-soft/50 text-forest" : "border-line text-ink-soft hover:border-gold/60"
        }`}
      >
        {label}
        {count(k) > 0 && <span className="ml-2 text-gold">{count(k)}</span>}
      </button>
    </form>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <MemberNav active="/kozosseg" />
      <Link href={tp("/kozosseg")} className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors duration-300 hover:text-gold">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Vissza a közösséghez
      </Link>

      {hiba && <p role="status" className="mt-6 rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">{hiba}</p>}

      <article className="mt-8">
        {post.is_hidden && <p className="mb-3 text-sm text-alert">Ez a bejegyzés el van rejtve: csak a szerzője és a moderátor látja.</p>}
        {post.kind === "penteki_kor" && (
          <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-gold">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden /> Pénteki kör
          </p>
        )}
        {post.title && <h1 className="font-serif text-3xl text-forest sm:text-4xl">{post.title}</h1>}
        <div className="mt-3">
          <AuthorLine author={post.author_id ? authors.get(post.author_id) : undefined} at={post.created_at} edited={post.edited_at} />
        </div>
        <p className="mt-6 whitespace-pre-line leading-relaxed text-ink">{post.body}</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {reactionButton("koszonom", "Köszönöm, hasznos volt", toggleThanks)}
          {reactionButton("hasonlot", "Hasonlót tapasztaltam", toggleSimilar)}
        </div>
        {isMine && <p className="mt-2 text-xs text-ink-soft">A saját bejegyzésedre nem reagálhatsz — de látod, kinek volt hasznos.</p>}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {isMine && post.kind === "normal" && (
            <details>
              <summary className={`${quiet} cursor-pointer list-none`}>Szerkesztés</summary>
              <form action={editPost} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={post.id} />
                <input name="title" defaultValue={post.title ?? ""} maxLength={200} placeholder="Cím (nem kötelező)" className={inputClass} />
                <textarea name="body" defaultValue={post.body} required rows={6} maxLength={10000} className={inputClass} />
                <button className={buttonPrimary}>Mentés</button>
              </form>
            </details>
          )}
          {(isMine || isAdmin) && (
            <form action={deletePost}>
              <input type="hidden" name="id" value={post.id} />
              <button className={quiet}>Törlés</button>
            </form>
          )}
          {isAdmin && (
            <form action={post.is_hidden ? unhidePost : hidePost}>
              <input type="hidden" name="id" value={post.id} />
              <input type="hidden" name="postId" value={post.id} />
              <button className={quiet}>{post.is_hidden ? "Megjelenítés" : "Elrejtés (moderáció)"}</button>
            </form>
          )}
        </div>
      </article>

      <section id="hozzaszolasok" className="mt-12 scroll-mt-24 border-t border-gold/25 pt-8">
        <h2 className="font-serif text-2xl text-forest">
          {(comments ?? []).length ? `${comments!.length} hozzászólás` : "Még nincs hozzászólás"}
        </h2>
        <ul className="mt-6 space-y-4">
          {(comments ?? []).map((c) => (
            <li key={c.id}>
              <GildedCard className={`p-5 ${c.is_hidden ? "opacity-60" : ""}`}>
                <AuthorLine author={c.author_id ? authors.get(c.author_id) : undefined} at={c.created_at} edited={c.edited_at} />
                {c.is_hidden && <p className="mt-1 text-xs text-alert">Elrejtve</p>}
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">{c.body}</p>
                {(c.author_id === user.id || isAdmin) && (
                  <div className="mt-3 flex gap-4">
                    <form action={deleteComment}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="postId" value={post.id} />
                      <button className={quiet}>Törlés</button>
                    </form>
                    {isAdmin && (
                      <form action={c.is_hidden ? unhideComment : hideComment}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="postId" value={post.id} />
                        <button className={quiet}>{c.is_hidden ? "Megjelenítés" : "Elrejtés"}</button>
                      </form>
                    )}
                  </div>
                )}
              </GildedCard>
            </li>
          ))}
        </ul>

        {hasAccess && (
          <form action={addComment} className="mt-8 space-y-3">
            <input type="hidden" name="postId" value={post.id} />
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">A te tapasztalatod</span>
              <textarea
                name="body"
                required
                rows={4}
                maxLength={5000}
                placeholder="Nálam az segített, hogy… / Én azt vettem észre, hogy…"
                className={inputClass}
              />
            </label>
            <button className={buttonPrimary}>Hozzászólok</button>
          </form>
        )}
      </section>
    </main>
  );
}
