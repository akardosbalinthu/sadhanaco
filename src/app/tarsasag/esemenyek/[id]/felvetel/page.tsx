import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireMember } from "@/lib/member";
import { EVENT_KIND_LABEL } from "@/lib/admin";
import { bunnyEmbedUrl } from "@/lib/media";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";

export const metadata = { title: "Felvétel · A Társaság", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const dayFmt = new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", dateStyle: "long" });

/** Egy élő alkalom felvétele (pl. havi Q&A) — minden aktív tagnak. */
export default async function RecordingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, hasAccess, isAdmin } = await requireMember();
  if (!hasAccess && !isAdmin) redirect(tp("/esemenyek"));
  const { data: e } = await supabase
    .from("events")
    .select("id, title, kind, starts_at, description, recording_bunny_id")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();
  if (!e?.recording_bunny_id) notFound();
  const embed = bunnyEmbedUrl(e.recording_bunny_id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link href={tp("/esemenyek#felvetelek")} className="text-sm text-ink-soft underline decoration-gold/50 underline-offset-4 hover:text-gold">
        Vissza a felvételekhez
      </Link>
      <p className="mt-6 text-xs uppercase tracking-[0.18em] text-gold">
        {EVENT_KIND_LABEL[e.kind]} · felvétel · {dayFmt.format(new Date(e.starts_at))}
      </p>
      <h1 className="mt-3 font-serif text-3xl text-forest sm:text-4xl">{e.title}</h1>
      <div className="mt-8">
        {embed ? (
          <div className="relative aspect-video overflow-hidden rounded-md border border-line bg-paper-deep">
            <iframe
              src={embed}
              title={e.title}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        ) : (
          <GildedCard className="text-sm text-ink-soft">A felvétel hamarosan elérhető.</GildedCard>
        )}
      </div>
      {e.description && <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ink">{e.description}</p>}
    </main>
  );
}
