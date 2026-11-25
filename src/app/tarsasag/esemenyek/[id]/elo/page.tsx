import Link from "next/link";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/member";
import { liveKitConfigured, liveToken, type LiveRole } from "@/lib/livekit";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { LiveRoom } from "./live-room";

export const metadata = { title: "Élő alkalom · A Társaság", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const LIVE_ERROR: Record<string, string> = {
  TOO_EARLY: "Az élő szoba a kezdés előtt 15 perccel nyílik. Addig is: egy pohár víz, egy kényelmes ülőhely.",
  ENDED: "Ez az alkalom már véget ért. Ha készült felvétel, az Események oldalon találod.",
  NOT_PAYING: "Az élő alkalmak a próbaidő után nyílnak meg.",
  TIER_NOT_ALLOWED: "Ehhez az alkalomhoz a jelenlegi tagságoddal nincs hozzáférésed.",
  NOT_LIVE: "Ez az alkalom nem érhető el élőben.",
};

export default async function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile, hasAccess, isAdmin } = await requireMember();
  const back = tp("/esemenyek");
  if (!hasAccess && !isAdmin) redirect(back);

  const { data, error } = await supabase.rpc("join_live_event", { p_event_id: id }).single();
  const problem = error ? (LIVE_ERROR[error.hint ?? ""] ?? "A belépés most nem sikerült. Próbáld újra egy perc múlva.") : null;
  // Google Meet (vagy más külső hívás): a jogosultság és a jelenlét rögzítése után oda irányítunk.
  if (data?.join_url) redirect(data.join_url);
  const configured = liveKitConfigured();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">A Társaság · Élőben</p>
          <h1 className="mt-1 font-serif text-3xl text-forest">{data?.title ?? "Élő alkalom"}</h1>
        </div>
        <Link href={back} className="text-sm text-ink-soft underline decoration-gold/50 underline-offset-4 hover:text-gold">
          Vissza az eseményekhez
        </Link>
      </div>
      {problem || !data ? (
        <GildedCard className="max-w-xl text-sm text-ink-soft">{problem}</GildedCard>
      ) : !configured ? (
        <GildedCard className="max-w-xl text-sm text-ink-soft">
          {data.role === "host"
            ? "Ehhez az alkalomhoz még nincs megadva a Google Meet-link — az esemény adminoldalán, az „Élő közvetítés” résznél adhatod meg."
            : "A belépő link még nincs megadva. Kérlek, nézz vissza pár perc múlva."}
        </GildedCard>
      ) : (
        <LiveRoom
          serverUrl={process.env.LIVEKIT_URL!}
          token={await liveToken({
            room: data.room,
            identity: profile.id,
            name: profile.display_name || "Tagtárs",
            role: data.role as LiveRole,
            validUntil: new Date(data.ends_at),
          })}
          role={data.role as LiveRole}
          eventId={id}
          backHref={back}
        />
      )}
    </main>
  );
}
