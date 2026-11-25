import Link from "next/link";
import { publicEnv } from "@/lib/env";
import { tp } from "@/lib/site";
import { SiteFooter } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "A Társaság · Nyugodtabb idegrendszer, kedvesebb hétköznapok",
  description:
    "Online gyakorlóközösség: napi 10–15 perc vezetett, tudományos alapú légzés- és figyelemgyakorlás, nyolchetes programok, élő közös alkalmak és havi közös túra. 7 napos díjmentes próbaidő.",
};

const navLink = "transition-colors duration-300 hover:text-gold";

export default async function TarsasagLayout({ children }: { children: React.ReactNode }) {
  let loggedIn = false;
  try {
    const supabase = await createClient();
    loggedIn = Boolean((await supabase.auth.getUser()).data.user);
  } catch {
    loggedIn = false;
  }
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-gold/30 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href={tp("/")} className="font-serif text-lg text-forest">
            A Társaság
          </Link>
          <nav className="flex items-center gap-5 text-sm text-ink-soft">
            <a href={`${tp("/")}#hogyan-mukodik`} className={`${navLink} hidden md:inline`}>
              Hogyan működik
            </a>
            <a href={`${tp("/")}#rendek`} className={`${navLink} hidden md:inline`}>
              A négy rend
            </a>
            <a href={`${tp("/")}#gyik`} className={`${navLink} hidden md:inline`}>
              Kérdések
            </a>
            <a href={publicEnv.NEXT_PUBLIC_SITE_URL} className={`${navLink} hidden sm:inline`}>
              akardosbalint.hu
            </a>
            {loggedIn ? (
              <Link
                href={tp("/gyakorlas")}
                className="rounded-md border border-forest bg-forest px-3 py-1.5 text-paper transition-all duration-300 hover:border-gold"
              >
                Gyakorlótér
              </Link>
            ) : (
              <>
                <Link href={tp("/belepes")} className={navLink}>
                  Belépés
                </Link>
                <a
                  href={`${tp("/")}#csatlakozas`}
                  className="rounded-md border border-forest bg-forest px-3 py-1.5 text-paper transition-all duration-300 hover:border-gold"
                >
                  Csatlakozás
                </a>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      {children}
      <SiteFooter />
    </>
  );
}
