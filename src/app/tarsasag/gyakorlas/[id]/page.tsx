import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { z } from "zod";
import { requireMember, TRACK_LABEL } from "@/lib/member";
import { bunnyEmbedUrl } from "@/lib/media";
import { tp } from "@/lib/site";
import { MemberNav } from "@/components/member-nav";
import { buttonPrimary, buttonSecondary, GildedCard } from "@/components/ornaments";
import { toggleCompletion } from "../actions";

export const metadata = { title: "Gyakorlás · Programom", robots: { index: false, follow: false } };

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const { supabase, hasAccess } = await requireMember();
  if (!hasAccess) notFound();

  // Az RLS csak a közzétett, már megnyílt hetű leckét adja vissza.
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, description, kind, track, week_number, duration_seconds, bunny_video_id, modules!inner(title)")
    .eq("id", id)
    .maybeSingle();
  if (!lesson) notFound();

  const { data: today } = await supabase.rpc("budapest_today");
  const { data: done } = await supabase
    .from("lesson_completions")
    .select("id")
    .eq("lesson_id", lesson.id)
    .eq("practiced_on", today as string)
    .maybeSingle();

  const embed = lesson.kind !== "text" && lesson.bunny_video_id ? bunnyEmbedUrl(lesson.bunny_video_id) : null;
  const moduleTitle = (lesson.modules as unknown as { title: string }).title;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <MemberNav active="/gyakorlas" />

      <Link href={tp("/gyakorlas")} className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors duration-300 hover:text-gold">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Vissza a gyakorláshoz
      </Link>

      <p className="mt-8 text-xs uppercase tracking-[0.18em] text-gold">
        {TRACK_LABEL[lesson.track] ?? "Gyakorlás"} · {moduleTitle} · {lesson.week_number === 9 ? "+1. hét" : `${lesson.week_number}. hét`}
        {lesson.duration_seconds ? ` · ${Math.round(lesson.duration_seconds / 60)} perc` : ""}
      </p>
      <h1 className="mt-3 font-serif text-3xl text-forest sm:text-4xl">{lesson.title}</h1>

      {lesson.kind !== "text" && (
        <div className="mt-8">
          {embed ? (
            <div className="relative aspect-video overflow-hidden rounded-md border border-line bg-paper-deep">
              <iframe
                src={embed}
                title={lesson.title}
                className="absolute inset-0 h-full w-full"
                loading="lazy"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          ) : (
            <GildedCard className="text-sm text-ink-soft">
              A {lesson.kind === "video" ? "videó" : "hanganyag"} hamarosan felkerül. Addig is: egy lassú, hosszú kilégzés most is számít.
            </GildedCard>
          )}
          {lesson.kind === "audio" && embed && (
            <p className="mt-3 text-xs text-ink-soft">
              Tipp: indítsd el, tedd le a telefont képernyővel lefelé, és csak a hangra figyelj.
            </p>
          )}
        </div>
      )}

      {lesson.description && <p className="mt-8 whitespace-pre-line leading-relaxed text-ink">{lesson.description}</p>}

      <form action={toggleCompletion} className="mt-10 flex flex-wrap items-center gap-4 border-t border-gold/25 pt-8">
        <input type="hidden" name="lessonId" value={lesson.id} />
        {done ? (
          <>
            <span className="inline-flex items-center gap-2 text-sm text-forest">
              <Check className="h-4 w-4 text-gold" strokeWidth={2} aria-hidden /> Mára kipipálva
            </span>
            <button className={buttonSecondary}>Visszavonom</button>
          </>
        ) : (
          <button className={buttonPrimary}>Ma elvégeztem</button>
        )}
      </form>
    </main>
  );
}
