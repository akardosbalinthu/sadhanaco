import { Gift, Heart, Phone } from "lucide-react";
import { publicEnv } from "@/lib/env";
import { SITE } from "@/lib/site";
import { buttonPrimary, CompassDivider, GildedCard, linkClass, PageHeader } from "@/components/ornaments";

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
            A beküldött hálaüzeneteket élő adásban (YouTube, TikTok Live) és rövid videókban
            telefonon juttatom el a címzettnek.
          </p>
        </GildedCard>

        <GildedCard>
          <Gift className="h-5 w-5 text-forest" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-4 font-serif text-xl text-forest">Kártyajáték, könyv, doboz</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Az üzenetek szellemében készült az Egy Kedves Kártyajáték, az Egy Kedves Könyv és az Egy
            Kedves Doboz is.
          </p>
        </GildedCard>

        <GildedCard className="sm:col-span-2">
          <Heart className="h-5 w-5 text-gold" strokeWidth={1.25} aria-hidden />
          <h2 className="mt-4 font-serif text-xl text-forest">A Társaság tagjainak</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            A Társaság tagjai havonta díjmentesen küldhetnek Elsőbbségi Kedves Üzenetet (Társasági
            Tagság: havi 1, Belső Kör: havi 3). Ezen felül szabadon választott összegű díjért — legalább
            1 000 Ft — küldhetnek további üzeneteket; ezeket az összeg szerint csökkenő sorrendben
            dolgozzuk fel. Ez digitális szolgáltatás, nem adomány: minden befizetésről számla készül.
          </p>
          <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className={`mt-4 inline-block ${linkClass}`}>
            A Társaságról
          </a>
        </GildedCard>
      </div>

      <div className="mt-12">
        <a href={SITE.egyKedvesUzenetUrl} rel="noopener" className={buttonPrimary}>
          egykedvesuzenet.hu
        </a>
      </div>
    </main>
  );
}
