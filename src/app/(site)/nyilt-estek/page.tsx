import Link from "next/link";
import { MapPin, Shirt, Sprout as SproutIcon, Ticket, Users } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { formatEventDate, formatHuf, formatTime } from "@/lib/site";
import { buttonPrimary, buttonSecondary, CompassDivider, GildedCard, PageHeader, SectionTitle } from "@/components/ornaments";
import { EveningLamp } from "@/components/illustrations";

const FLOW = [
  { title: "Megérkezel", text: "Leülsz, és leteszed a napot. Senkinek nem kell bemutatkoznia, és semmit sem kell tudnod előre." },
  { title: "Megérted, mi történik", text: "Néhány percben elmondom, mi zajlik a testben stressz alatt, és miért éppen a légzés a kulcs a megnyugváshoz." },
  { title: "Együtt gyakorlunk", text: "Vezetett légzés, figyelem és testérzékelés, lépésről lépésre, a saját tempódban. Közben megérzed, milyen, amikor az idegrendszered visszavált nyugalomba." },
  { title: "Csendben zárunk", text: "A végén egy kis csend, és aki szeretné, megoszthatja a tapasztalatát vagy kérdezhet." },
];

const GOOD_TO_KNOW = [
  { Icon: Users, title: "Kis csoport", text: "Legfeljebb 15 fő, hogy mindenkire jusson figyelem. A helyek fele mindig a Társaságon kívülieknek marad." },
  { Icon: SproutIcon, title: "Nem kell tapasztalat", text: "Ha még sosem meditáltál, éppen jó helyen vagy. Ha már gyakorolsz, elmélyítheted." },
  { Icon: Shirt, title: "Kényelmes ruha", text: "Olyat vegyél fel, amiben nyugodtan tudsz ülni és lélegezni. Minden mást biztosítunk." },
  {
    Icon: Ticket,
    title: "Részvételi díj: 4 940 Ft",
    text: "Előre, online fizetve. A Társaság tagjainak kedvezményes, a Belső Kör tagjainak díjmentes. A decemberi est kivételesen adomány alapú.",
  },
];

export const metadata = {
  title: "Nyílt Meditációs Estek · Kardos Bálint",
  description:
    "Havonta egy nyugodt este Budapesten, legfeljebb 15 fővel. Vezetett légzés- és figyelemgyakorlás, előzetes tapasztalat nélkül.",
};
export const dynamic = "force-dynamic"; // a szabad helyek mindig frissek legyenek

export default async function OpenEveningsPage() {
  const supabase = createPublicClient();
  const { data: events, error } = await supabase.rpc("public_open_evenings");

  return (
    <main className="py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
        <PageHeader eyebrow="Havonta egyszer, Budapesten" title="Nyílt Meditációs Estek">
          <p className="font-serif text-xl text-ink">Egy este, amikor nem kell megfelelned semminek — csak megérkezned és lélegezned.</p>
          <p>
            Ha még sosem meditáltál, vagy egyszerűen kíváncsi vagy, hogyan dolgozunk, ez a legjobb kezdőpont. Kis
            csoportban, vezetett légzés- és figyelemgyakorlással tapasztalod meg, milyen, amikor a tested a készenlétből
            visszavált nyugalomba. Hazafelé figyeld meg, mi változott.
          </p>
        </PageHeader>
        <EveningLamp className="mx-auto hidden h-44 w-44 lg:block" />
      </div>

      <section className="mt-14" aria-labelledby="alkalmak">
        <h2 id="alkalmak" className="sr-only">
          Közelgő alkalmak
        </h2>
        <div className="space-y-4">
          {error && <p className="text-ink-soft">Az alkalmak listája most nem érhető el. Kérlek, nézz vissza egy kicsit később.</p>}
          {!error && (events ?? []).length === 0 && (
            <GildedCard className="text-ink-soft">
              Most nincs meghirdetett alkalom. Az új időpontok itt jelennek meg — érdemes hamarosan visszanézni.
            </GildedCard>
          )}
          {(events ?? []).map((e) => {
            const full = e.seats_left !== null && e.seats_left <= 0;
            return (
              <GildedCard key={e.id} className="flex flex-wrap items-center justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-gold">
                    {formatEventDate(e.starts_at)} · {formatTime(e.starts_at)}
                    {e.ends_at ? `–${formatTime(e.ends_at)}` : ""}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl text-forest">{e.title}</h3>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-ink-soft">
                    {e.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                        {e.is_online ? "Online" : e.location}
                      </span>
                    )}
                    <span>
                      {e.donation_based ? "Adomány alapú" : e.price_external_huf === 0 ? "Díjmentes" : formatHuf(e.price_external_huf)}
                    </span>
                    {e.seats_left !== null && <span>{full ? "Betelt" : `Még ${e.seats_left} szabad hely`}</span>}
                  </p>
                </div>
                {e.registration_open && !full && (
                  <Link href={`/nyilt-estek/${e.id}`} className={buttonPrimary}>
                    Lefoglalom a helyem
                  </Link>
                )}
              </GildedCard>
            );
          })}
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Mi történik egy esten?" title="Egy nyugodt este, négy lépésben." />
        <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((f, i) => (
            <li key={f.title} className="border-t border-gold/30 pt-5">
              <span className="font-serif text-2xl text-gold">{i + 1}.</span>
              <h3 className="mt-2 font-serif text-xl text-forest">{f.title}</h3>
              <p className="mt-2 text-[15px] text-ink-soft">{f.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Jó tudni" title="Mielőtt jelentkezel" />
        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {GOOD_TO_KNOW.map(({ Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <Icon className="mt-1 h-5 w-5 shrink-0 text-gold" strokeWidth={1.25} aria-hidden />
              <div>
                <h3 className="font-serif text-xl text-forest">{title}</h3>
                <p className="mt-1 text-[15px] text-ink-soft">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Ha jólesett az este</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance font-serif text-3xl leading-snug text-forest">
          Vidd haza a nyugalmat — napi néhány perccel.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-ink-soft">
          A Társaságban ugyanezt a nyugalmat gyakorolod tovább, vezetett gyakorlásokkal és közösségben. A következő
          estére pedig már tagi áron jöhetsz.
        </p>
        <div className="mt-8">
          <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className={buttonSecondary}>
            Megnézem A Társaságot
          </a>
        </div>
      </section>
    </main>
  );
}
