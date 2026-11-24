import Link from "next/link";
import { MapPin } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { formatEventDate, formatHuf, formatTime } from "@/lib/site";
import { buttonPrimary, CompassDivider, GildedCard, PageHeader } from "@/components/ornaments";

export const metadata = { title: "Nyílt Meditációs Estek · Kardos Bálint" };
export const dynamic = "force-dynamic"; // a szabad helyek mindig frissek legyenek

export default async function OpenEveningsPage() {
  const supabase = createPublicClient();
  const { data: events, error } = await supabase.rpc("public_open_evenings");

  return (
    <main className="py-16">
      <PageHeader eyebrow="Havonta egyszer, Budapesten" title="Nyílt Meditációs Estek">
        <p>
          Kis csoportban (legfeljebb 15 fő), vezetett légzés- és figyelemgyakorlatok egy nyugodt
          estén. Külsősöknek és a Társaság tagjainak egyaránt nyitott — a helyek fele mindig
          külsősöknek marad.
        </p>
      </PageHeader>

      <CompassDivider className="my-14" />

      <div className="space-y-5">
        {error && (
          <p className="text-ink-soft">Az alkalmak listája most nem érhető el. Kérlek, nézz vissza később.</p>
        )}
        {!error && (events ?? []).length === 0 && (
          <GildedCard className="text-ink-soft">
            Jelenleg nincs meghirdetett alkalom. Az új időpontok itt jelennek meg.
          </GildedCard>
        )}
        {(events ?? []).map((e) => (
          <GildedCard key={e.id}>
            <p className="text-xs uppercase tracking-[0.18em] text-gold">
              {formatEventDate(e.starts_at)} · {formatTime(e.starts_at)}
              {e.ends_at ? `–${formatTime(e.ends_at)}` : ""}
            </p>
            <h2 className="mt-2 font-serif text-xl text-forest">{e.title}</h2>
            {e.location && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
                <MapPin className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                {e.is_online ? "Online" : e.location}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-soft">
                Részvételi díj: <span className="text-ink">{formatHuf(e.price_external_huf)}</span>
                {e.seats_left !== null && (
                  <> · {e.seats_left > 0 ? `${e.seats_left} szabad hely` : "Betelt"}</>
                )}
              </p>
              {e.registration_open && (e.seats_left === null || e.seats_left > 0) && (
                <Link
                  href={`/nyilt-estek/${e.id}`}
                  className={buttonPrimary}
                >
                  Jelentkezés
                </Link>
              )}
            </div>
          </GildedCard>
        ))}
      </div>
    </main>
  );
}
