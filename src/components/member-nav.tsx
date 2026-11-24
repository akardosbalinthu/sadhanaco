import Link from "next/link";
import { tp } from "@/lib/site";

const ITEMS = [
  { href: "/gyakorlas", label: "Gyakorlás" },
  { href: "/naplo", label: "Belső Tükör" },
  { href: "/ranglista", label: "Ranglista" },
];

export function MemberNav({ active }: { active: string }) {
  return (
    <nav className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-gold/25 pb-3 text-sm">
      {ITEMS.map((i) => (
        <Link
          key={i.href}
          href={tp(i.href)}
          className={i.href === active ? "text-forest underline decoration-gold underline-offset-8" : "text-ink-soft hover:text-gold"}
        >
          {i.label}
        </Link>
      ))}
      <form action={tp("/elofizetes")} method="post" className="ml-auto">
        <button className="text-ink-soft hover:text-gold">Előfizetés</button>
      </form>
      <form action={tp("/auth/kijelentkezes")} method="post">
        <button className="text-ink-soft hover:text-gold">Kijelentkezés</button>
      </form>
    </nav>
  );
}
