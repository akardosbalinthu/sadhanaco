import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tp } from "@/lib/site";
import { CompassDivider, linkClass } from "@/components/ornaments";

export const metadata = { title: "Gyakorlás · A Társaság" };

/** Ideiglenes védett kezdőoldal — a tényleges tartalom a későbbi fázisokban jön. */
export default async function PracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(tp("/belepes"));

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">A Társaság · Gyakorlótér</p>
      <h1 className="mt-4 font-serif text-4xl text-forest">Üdv újra itt.</h1>
      <p className="mt-3 text-ink-soft">A gyakorlótér hamarosan itt nyílik meg.</p>
      <CompassDivider className="my-10" />
      <div className="flex flex-wrap gap-6">
        <form action={tp("/elofizetes")} method="post">
          <button className={linkClass}>Előfizetés kezelése</button>
        </form>
        <form action={tp("/auth/kijelentkezes")} method="post">
          <button className={linkClass}>Kijelentkezés</button>
        </form>
      </div>
    </main>
  );
}
