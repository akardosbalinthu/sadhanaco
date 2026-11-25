import Link from "next/link";
import { publicEnv } from "@/lib/env";
import { SITE } from "@/lib/site";
import { CompassDivider } from "@/components/ornaments";
import { ThemeToggle } from "@/components/theme";

const nav = [
  { href: "/", label: "Kezdőlap" },
  { href: "/rolam", label: "Rólam" },
  { href: "/nyilt-estek", label: "Nyílt Estek" },
  { href: "/egy-kedves-uzenet", label: "Egy Kedves Üzenet" },
];

const navLink = "transition-colors duration-300 hover:text-gold";

export function SiteHeader() {
  return (
    <header className="border-b border-gold/30">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5">
        <Link href="/" className="font-serif text-lg text-forest">
          {SITE.name}
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={navLink}>
              {item.label}
            </Link>
          ))}
          <a href={`${publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "")}/belepes`} className={navLink}>
            Belépés
          </a>
          <Link
            href="/jelentkezes"
            className="rounded-md border border-forest bg-forest px-3 py-1 text-paper transition-all duration-300 hover:border-gold"
          >
            Jelentkezem
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24">
      <div className="mx-auto max-w-5xl px-6">
        <CompassDivider />
      </div>
      <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-4 px-6 py-8 text-sm text-ink-soft">
        <p className="max-w-sm text-xs uppercase leading-relaxed tracking-[0.18em] text-gold">Tradicionális jógikus gyakorlatok, modern életmód-orvostani keretrendszerben — rád szabva.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <a href={`mailto:${SITE.email}`} className={navLink}>
            {SITE.email}
          </a>
          {/* Abszolút címek: a tarsasag. aldomainről is a fő oldal jogi oldalaira vigyenek. */}
          {[
            ["/aszf", "ÁSZF"],
            ["/adatkezeles", "Adatkezelés"],
            ["/impresszum", "Impresszum"],
          ].map(([path, label]) => (
            <a key={path} href={`${publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}${path}`} className={navLink}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
