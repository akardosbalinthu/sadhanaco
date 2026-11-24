import { Heart, Phone, Send } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { CompassDivider, GildedCard, linkClass, PageHeader } from "@/components/ornaments";

export const metadata = {
  title: "Egy Kedves Üzenet · Kardos Bálint",
  description: "Hálaüzenetek, amelyeket meglepetés-telefonhívásban adok át annak, akinek szólnak.",
};

export default function KindMessagePage() {
  return (
    <main className="py-16">
      <PageHeader eyebrow="Egy hívás, egy mondat, egy ember" title="Egy Kedves Üzenet">
        <p>
          Vannak mondatok, amelyeket régóta szeretnénk elmondani valakinek — egy köszönetet, egy
          elismerést, valamit, ami a hétköznapokban kimarad. Az Egy Kedves Üzenetben ezeket az
          üzeneteket egy meglepetés-telefonhívásban adom át annak, akinek szólnak.
        </p>
      </PageHeader>

      <CompassDivider className="my-14" />

      <div className="grid gap-5 sm:grid-cols-2">
        <GildedCard>
          <Phone className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-4 font-serif text-xl text-forest">Hogyan működik</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Itt, ezen az oldalon írod meg az üzenetet, és megadod, kinek szól. A hívásokat élő adásban
            (YouTube, TikTok Live) és rövid videókban bonyolítom le, és ott adom át az üzenetedet a
            címzettnek.
          </p>
        </GildedCard>

        <GildedCard>
          <Send className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-4 font-serif text-xl text-forest">Bárki küldhet — díjmentesen</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Kedves Üzenetet bárki küldhet, ingyen. Az üzeneteket a beérkezés sorrendjében dolgozom fel.
            Ha a címzettet három próbálkozásra sem sikerül elérni, az üzenet sikertelennek minősül, és
            további próbálkozás nincs.
          </p>
        </GildedCard>

        <GildedCard className="sm:col-span-2">
          <Heart className="h-5 w-5 text-gold" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-4 font-serif text-xl text-forest">Elsőbbségi Kedves Üzenet — A Társaság tagjainak</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            A Társaság tagjai havonta Elsőbbségi Kedves Üzenetet küldhetnek (A Társaság Útja: havi 1, a
            Belső Kör: havi 3). Ezeket kézbesítem elsőként, és kézbesítési garanciát vállalok rájuk: nem
            állok meg három próbálkozás után, amíg az üzenet célba nem ér.
          </p>
          <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className={`mt-4 inline-block ${linkClass}`}>
            A Társaságról
          </a>
        </GildedCard>
      </div>

      <p className="mt-12 text-sm text-ink-soft">Az üzenetküldés hamarosan itt nyílik meg.</p>
    </main>
  );
}
