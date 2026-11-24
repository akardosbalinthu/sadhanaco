import Link from "next/link";
import { MapPin, Shirt, Sprout, Ticket, Users } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { formatEventDate, formatHuf, formatTime } from "@/lib/site";
import { buttonPrimary, buttonSecondary, CompassDivider, GildedCard, PageHeader, SectionTitle } from "@/components/ornaments";

const FLOW = [
  { title: "Megérkezés", text: "Leülsz, leteszed a napot. Senkinek nem kell bemutatkoznia, és semmit sem kell tudnod előre." },
  { title: "Rövid, érthető bevezető", text: "Néhány percben arról, mi történik a testben stressz alatt, és miért pont a légzés a kulcs a megnyugváshoz." },
  { title: "Vezetett gyakorlás", text: "Légzés, figyelem, testérzékelés — lépésről lépésre, a saját tempódban. Közben megérzed, milyen, amikor az idegrendszered visszavált." },
  { title: "Csend és kérdések", text: "Egy kis csend a végén, és aki szeretné, megoszthatja a tapasztalatát vagy kérdezhet." },
];

const GOOD_TO_KNOW = [
  { Icon: Users, title: "Kis csoport", text: "Legfeljebb 15 fő, hogy mindenkire jusson figyelem. A helyek fele mindig külsősöknek marad." },
  { Icon: Sprout, title: "Nem kell tapasztalat", text: "Ha még sosem meditáltál, pont jó helyen vagy. Ha már gyakorolsz, elmélyítheted." },
  { Icon: Shirt, title: "Kényelmes ruha", text: "Olyat vegyél fel, amiben nyugodtan tudsz ülni és lélegezni." },
  { Icon: Ticket, title: "Részvételi díj: 4 940 Ft", text: "Online, előre fizetve. A Társaság tagjainak kedvezményes, a Belső Körnek díjmentes." },
];

export const metadata = { title: "Nyílt Meditációs Estek · Kardos Bálint" };
export const dynamic = "force-dynamic"; // a szabad helyek mindig frissek legyenek

export default async function OpenEveningsPage() {
  const supabase = createPublicClient();
  const { data: events, error } = await supabase.rpc("public_open_evenings");

  return (
    <main className="py-16">
      <PageHeader eyebrow="Havonta egyszer, Budapesten" title="Nyílt Meditációs Estek">
        <p className="font-serif text-xl text-ink">
          Egy este, amikor nem kell semminek megfelelned — csak megérkezni és lélegezni.
        </p>
        <p>
          Ha még sosem meditáltál, vagy egyszerűen kíváncsi vagy, hogyan dolgozunk, ez a legjobb kezdőpont.
          Kis csoportban, vezetett légzés- és figyelemgyakorlatokkal tapasztalod meg, milyen az, amikor a
          tested a készenlétből visszavált nyugalomba. Hazafelé figyeld meg, mi változott.
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

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Mi történik egy esten?" title="Négy lépés egy nyugodt estén." />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((f, i) => (
            <li key={f.title}>
              <GildedCard className="h-full">
                <span className="font-serif text-3xl text-gold">{i + 1}</span>
                <h3 className="mt-3 font-serif text-lg text-forest">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{f.text}</p>
              </GildedCard>
            </li>
          ))}
        </ol>
      </section>

      <CompassDivider className="my-20" />

      <section>
        <SectionTitle eyebrow="Jó tudni" title="Mielőtt jelentkezel" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {GOOD_TO_KNOW.map(({ Icon, title, text }) => (
            <GildedCard key={title} className="flex gap-4">
              <Icon className="mt-1 h-5 w-5 shrink-0 text-forest" strokeWidth={1.25} aria-hidden />
              <div>
                <h3 className="font-serif text-lg text-forest">{title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{text}</p>
              </div>
            </GildedCard>
          ))}
        </div>
      </section>

      <CompassDivider className="my-20" />

      <section className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Ha tetszett az este</p>
        <h2 className="mx-auto mt-4 max-w-2xl font-serif text-3xl text-forest">Folytasd otthon, napi néhány perccel.</h2>
        <p className="mx-auto mt-5 max-w-xl text-ink-soft">
          A Társaságban ugyanezt a nyugalmat gyakorolod tovább: vezetett gyakorlatokkal, közösségben, és a
          következő estére már tagi áron jöhetsz.
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
