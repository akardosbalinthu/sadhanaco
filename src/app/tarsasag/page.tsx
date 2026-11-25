import Link from "next/link";
import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { tp } from "@/lib/site";
import { buttonPrimary, buttonSecondary, GildedCard } from "@/components/ornaments";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Programom · Kardos Bálint" };

/** A résztvevői felület kapuja: bejelentkezve a programba visz, egyébként a belépéshez. */
export default async function ProgramHome() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(tp("/program"));
  const site = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <GildedCard className="p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Programom</p>
        <h1 className="mt-3 font-serif text-3xl text-forest">Az egyéni program résztvevőinek felülete</h1>
        <p className="mt-4 text-ink-soft">
          Itt éred el a tananyagot, a gyakorlási tervedet, a heti beszámolót és a következő alkalmunk időpontját.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={tp("/belepes")} className={buttonPrimary}>
            Belépés
          </Link>
          <a href={`${site}/jelentkezes`} className={buttonSecondary}>
            Jelentkezem konzultációra
          </a>
        </div>
      </GildedCard>
    </main>
  );
}
