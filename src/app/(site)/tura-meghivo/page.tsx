import { createAdminClient } from "@/lib/supabase/admin";
import { GildedCard, PageHeader } from "@/components/ornaments";
import { AcceptForm } from "./accept-form";

export const metadata = { title: "Meghívó egy közös túrára · Kardos Bálint", robots: { index: false, follow: false } };

const fmt = new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", dateStyle: "full", timeStyle: "short" });

export default async function HikeInvitationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const token = typeof sp.t === "string" && /^[0-9a-f]{48}$/.test(sp.t) ? sp.t : "";
  const { data: inv } = token
    ? await createAdminClient()
        .from("event_invitations")
        .select("guest_name, status, events(title, starts_at, location, description, cancelled_at)")
        .eq("token", token)
        .maybeSingle()
    : { data: null };
  const ev = inv?.events as unknown as { title: string; starts_at: string; location: string | null; description: string | null; cancelled_at: string | null } | undefined;

  return (
    <main className="py-16">
      <PageHeader eyebrow="Meghívó" title={ev ? ev.title : "Közös túra"}>
        {ev ? (
          <>
            <p>
              Kedves {inv!.guest_name}! A Társaság egyik tagja meghívott a havi közös túránkra. Díjmentes, nem kell
              hozzá tagság — csak jó cipő és nyitottság.
            </p>
            <p className="text-forest">
              {fmt.format(new Date(ev.starts_at))}
              {ev.location && ` · ${ev.location}`}
            </p>
            {ev.description && <p className="whitespace-pre-line">{ev.description}</p>}
          </>
        ) : (
          <p>Ez a meghívó nem érvényes.</p>
        )}
      </PageHeader>
      {ev && (
        <GildedCard className="mt-10 max-w-xl p-8">
          {ev.cancelled_at ? (
            <p className="text-sm text-ink-soft">Ez a túra sajnos elmarad.</p>
          ) : inv!.status === "accepted" ? (
            <p className="text-sm text-forest">Ezt a meghívót már elfogadtad — várunk szeretettel!</p>
          ) : (
            <AcceptForm token={token} />
          )}
        </GildedCard>
      )}
    </main>
  );
}
