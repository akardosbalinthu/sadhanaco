import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tp } from "@/lib/site";

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
      <h1 className="font-serif text-2xl">Üdv újra itt.</h1>
      <p className="mt-3 text-ink-soft">A gyakorlótér hamarosan itt nyílik meg.</p>
      <form action={tp("/auth/kijelentkezes")} method="post" className="mt-10">
        <button className="text-sm text-moss underline underline-offset-4">Kijelentkezés</button>
      </form>
    </main>
  );
}
