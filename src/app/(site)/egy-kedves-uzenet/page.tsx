import { publicEnv } from "@/lib/env";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Egy Kedves Üzenet · Kardos Bálint",
  description: "Hálaüzenetek, amelyeket meglepetés-telefonhívásban adok át annak, akinek szólnak.",
};

export default function KindMessagePage() {
  return (
    <main className="py-16">
      <h1 className="font-serif text-3xl">Egy Kedves Üzenet</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Vannak mondatok, amelyeket régóta szeretnénk elmondani valakinek — egy köszönetet, egy
        elismerést, valamit, ami a hétköznapokban kimarad. Az Egy Kedves Üzenetben ezeket az
        üzeneteket egy meglepetés-telefonhívásban adom át annak, akinek szólnak.
      </p>

      <section className="mt-12 max-w-2xl space-y-8">
        <div>
          <h2 className="font-serif text-xl">Hogyan működik</h2>
          <p className="mt-2 text-ink-soft">
            A beküldött hálaüzeneteket élő adásban (YouTube, TikTok Live) és rövid videókban
            telefonon juttatom el a címzettnek.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl">A Társaság tagjainak</h2>
          <p className="mt-2 text-ink-soft">
            A Társaság tagjai havonta díjmentesen küldhetnek Elsőbbségi Kedves Üzenetet (Társasági
            Tagság: havi 1, Belső Kör: havi 3). Ezen felül szabadon választott összegű díjért — legalább
            1 000 Ft — küldhetnek további üzeneteket; ezeket az összeg szerint csökkenő sorrendben
            dolgozzuk fel. Ez digitális szolgáltatás, nem adomány: minden befizetésről számla készül.
          </p>
          <a
            href={publicEnv.NEXT_PUBLIC_TARSASAG_URL}
            className="mt-4 inline-block text-sm text-moss underline underline-offset-4"
          >
            A Társaságról
          </a>
        </div>

        <div>
          <h2 className="font-serif text-xl">Kártyajáték, könyv, doboz</h2>
          <p className="mt-2 text-ink-soft">
            Az üzenetek szellemében készült az Egy Kedves Kártyajáték, az Egy Kedves Könyv és az Egy
            Kedves Doboz is.
          </p>
        </div>

        <a
          href={SITE.egyKedvesUzenetUrl}
          rel="noopener"
          className="inline-block rounded-md bg-moss px-5 py-2.5 text-sm text-paper hover:bg-moss-soft"
        >
          egykedvesuzenet.hu
        </a>
      </section>
    </main>
  );
}
