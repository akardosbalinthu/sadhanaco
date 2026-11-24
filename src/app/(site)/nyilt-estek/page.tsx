import Link from "next/link";
import { MapPin } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { formatEventDate, formatHuf, formatTime } from "@/lib/site";

export const metadata = { title: "Nyílt Meditációs Estek · Kardos Bálint" };
export const dynamic = "force-dynamic"; // a szabad helyek mindig frissek legyenek

export default async function OpenEveningsPage() {
  const supabase = createPublicClient();
  const { data: events, error } = await supabase.rpc("public_open_evenings");

  return (
    <main className="py-16">
      <h1 className="font-serif text-3xl">Nyílt Meditációs Estek</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Havonta egyszer, Budapesten, kis csoportban (legfeljebb 15 fő). Vezetett légzés- és
        figyelemgyakorlatok egy nyugodt estén. Külsősöknek és a Sadhana Társaság tagjainak egyaránt
        nyitott — a helyek fele mindig külsősöknek marad.
      </p>

      <div className="mt-12 space-y-4">
        {error && (
          <p className="text-ink-soft">Az alkalmak listája most nem érhető el. Kérlek, nézz vissza később.</p>
        )}
        {!error && (events ?? []).length === 0 && (
          <p className="rounded-lg border border-line bg-paper-deep/50 p-6 text-ink-soft">
            Jelenleg nincs meghirdetett alkalom. Az új időpontok itt jelennek meg.
          </p>
        )}
        {(events ?? []).map((e) => (
          <article key={e.id} className="rounded-lg border border-line p-6">
            <p className="text-sm text-moss-soft">
              {formatEventDate(e.starts_at)} · {formatTime(e.starts_at)}
              {e.ends_at ? `–${formatTime(e.ends_at)}` : ""}
            </p>
            <h2 className="mt-1 font-serif text-xl">{e.title}</h2>
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
                  className="rounded-md bg-moss px-4 py-2 text-sm text-paper hover:bg-moss-soft"
                >
                  Jelentkezés
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
