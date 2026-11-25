"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "", label: "Áttekintés" },
  { href: "/jelentkezesek", label: "Jelentkezések" },
  { href: "/idopontok", label: "Időpontok" },
  { href: "/resztvevok", label: "Résztvevők" },
  { href: "/tananyag", label: "Tananyag" },
  { href: "/esemenyek", label: "Események" },
  { href: "/kedves-uzenetek", label: "Kedves Üzenetek" },
  { href: "/szamlak", label: "Számlák" },
  { href: "/tagok", label: "Fiókok" },
];

/** Az admin alrészek menüje; a számok csak tájékoztatnak (nincs villogó jelvény). */
export function AdminNav({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname();
  // Élesben a Társaság az aldomain gyökerén fut, helyben a /tarsasag alatt.
  const base = pathname.slice(0, pathname.indexOf("/admin") + "/admin".length);
  const current = pathname.slice(base.length);
  return (
    <nav className="mb-10 mt-3 flex flex-wrap gap-x-5 gap-y-2 border-b border-gold/25 pb-3 text-sm">
      {ITEMS.map((i) => {
        const active = i.href === "" ? current === "" : current.startsWith(i.href);
        const n = counts[i.href] ?? 0;
        return (
          <Link
            key={i.href}
            href={`${base}${i.href}`}
            className={active ? "text-forest underline decoration-gold underline-offset-8" : "text-ink-soft hover:text-gold"}
          >
            {i.label}
            {n > 0 && <span className="ml-1.5 text-xs text-gold">({n})</span>}
          </Link>
        );
      })}
    </nav>
  );
}
