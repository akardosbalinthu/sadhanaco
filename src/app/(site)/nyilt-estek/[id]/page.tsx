import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { formatEventDate, formatHuf, formatTime } from "@/lib/site";
import { BookingForm } from "./booking-form";
import { CompassDivider, GildedCard } from "@/components/ornaments";

export const metadata = { title: "Jelentkezés · Nyílt Meditációs Est" };

export default async function OpenEveningPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fizetes?: string }>;
}) {
  const { id } = await params;
  const { fizetes } = await searchParams;
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("public_open_evenings");
  const event = (data ?? []).find((e) => e.id === id);
  if (!event) notFound();

  const canBook = event.registration_open && (event.seats_left === null || event.seats_left > 0);

  return (
    <main className="py-16">
      <Link href="/nyilt-estek" className="text-sm text-ink-soft transition-colors duration-300 hover:text-gold">
        ← Vissza az alkalmakhoz
      </Link>
      <p className="mt-10 text-xs uppercase tracking-[0.18em] text-gold">
        {formatEventDate(event.starts_at)} · {formatTime(event.starts_at)}
        {event.ends_at ? `–${formatTime(event.ends_at)}` : ""}
      </p>
      <h1 className="mt-3 font-serif text-4xl text-forest">{event.title}</h1>
      {event.location && <p className="mt-2 text-ink-soft">{event.is_online ? "Online" : event.location}</p>}
      {event.description && <p className="mt-6 max-w-2xl whitespace-pre-line text-ink-soft">{event.description}</p>}

      <CompassDivider className="my-12" />

      <GildedCard ornate className="max-w-lg p-8">
        {fizetes === "sikeres" ? (
          <p className="text-ink-soft">
            Köszönöm, a fizetés megérkezett. A visszaigazolást e-mailben küldöm. Szeretettel várlak!
          </p>
        ) : canBook ? (
          <>
            {fizetes === "megszakitva" && (
              <p className="mb-6 text-sm text-ink-soft">
                A fizetés megszakadt. A helyedet még egy rövid ideig fenntartom — nyugodtan próbáld újra.
              </p>
            )}
            {event.donation_based && (
              <p className="mb-6 text-sm leading-relaxed text-ink-soft">
                Ez az est <span className="text-forest">adomány alapú</span>: a részvétel díjmentes, a helyszínen pedig
                belátásod szerint támogathatod.
              </p>
            )}
            <BookingForm
              eventId={event.id}
              free={event.price_external_huf === 0}
              priceLabel={event.donation_based ? "adomány alapú" : event.price_external_huf === 0 ? "díjmentes" : formatHuf(event.price_external_huf)}
            />
          </>
        ) : (
          <p className="text-ink-soft">Erre az alkalomra most nem lehet jelentkezni.</p>
        )}
      </GildedCard>
    </main>
  );
}
