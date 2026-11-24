import Link from "next/link";
import { publicEnv } from "@/lib/env";
import { SITE } from "@/lib/site";

const nav = [
  { href: "/", label: "Kezdőlap" },
  { href: "/nyilt-estek", label: "Nyílt Estek" },
  { href: "/podcast", label: "Podcast" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5">
        <Link href="/" className="font-serif text-lg text-ink">
          {SITE.name}
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-moss">
              {item.label}
            </Link>
          ))}
          <a href={publicEnv.NEXT_PUBLIC_TARSASAG_URL} className="hover:text-moss">
            Sadhana Társaság
          </a>
          <a href={SITE.egyKedvesUzenetUrl} className="hover:text-moss" rel="noopener">
            Egy Kedves Üzenet
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-4xl flex-wrap justify-between gap-4 px-6 py-8 text-sm text-ink-soft">
        <p>Jelenlét – Tudatosság – Szabadság</p>
        <div className="flex gap-5">
          <a href={`mailto:${SITE.email}`} className="hover:text-moss">
            {SITE.email}
          </a>
          <Link href="/impresszum" className="hover:text-moss">
            Impresszum
          </Link>
        </div>
      </div>
    </footer>
  );
}
