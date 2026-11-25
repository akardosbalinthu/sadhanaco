import Link from "next/link";
import { publicEnv } from "@/lib/env";
import { tp } from "@/lib/site";
import { SiteFooter } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Programom · Kardos Bálint",
  description: "Az egyéni program résztvevőinek felülete: tananyag, gyakorlás, heti beszámoló és alkalmak.",
  robots: { index: false, follow: false },
};

const navLink = "transition-colors duration-300 hover:text-gold";

export default async function ProgramLayout({ children }: { children: React.ReactNode }) {
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
            Kardos Bálint <span className="text-ink-soft">· Programom</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-ink-soft">
            <a href={publicEnv.NEXT_PUBLIC_SITE_URL} className={`${navLink} hidden sm:inline`}>
              akardosbalint.hu
            </a>
            {loggedIn ? (
              <Link
                href={tp("/program")}
                className="rounded-md border border-forest bg-forest px-3 py-1.5 text-paper transition-all duration-300 hover:border-gold"
              >
                Programom
              </Link>
            ) : (
              <Link href={tp("/belepes")} className={navLink}>
                Belépés
              </Link>
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
