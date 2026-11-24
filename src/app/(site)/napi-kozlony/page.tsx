import { publicEnv } from "@/lib/env";

export const metadata = {
  title: "Napi Közlöny · Kardos Bálint",
  description: "Reggeli, kinyomtatott újság a telefon helyett — értesítési zaj nélkül.",
};

export default function DailyGazettePage() {
  return (
    <main className="py-16">
      <p className="text-sm tracking-wide text-moss-soft">Fejlesztés alatt</p>
      <h1 className="mt-2 font-serif text-3xl">Napi Közlöny</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        A nap első perceit sokan a telefon képernyőjén töltjük: értesítések, hírfolyam, sürgetés. A
        Napi Közlöny ezt váltja ki egy egyszerű, papíron olvasható reggeli újsággal.
      </p>

      <section className="mt-12 max-w-2xl space-y-8">
        <div>
          <h2 className="font-serif text-xl">Hogyan működik</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink-soft">
            <li>Mesterséges intelligencia szerkeszti.</li>
            <li>Minden éjjel 4:30-kor automatikusan kinyomtatódik — A4-es, fekete-fehér lapon.</li>
            <li>E-mailről nyomtatásra (Email-to-Print) is működik.</li>
            <li>Reggel kézbe veszed, és a telefon maradhat a fiókban.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl">A Társaság tagjainak</h2>
          <p className="mt-2 text-ink-soft">
            Amint a Napi Közlöny elindul, a Társaság aktív tagjai külön díj nélkül, automatikusan
            megkapják a teljes PRO változatot.
          </p>
          <a
            href={publicEnv.NEXT_PUBLIC_TARSASAG_URL}
            className="mt-4 inline-block text-sm text-moss underline underline-offset-4"
          >
            A Társaságról
          </a>
        </div>
      </section>
    </main>
  );
}
