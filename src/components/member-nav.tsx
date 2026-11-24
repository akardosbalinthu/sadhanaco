import Link from "next/link";
import { tp } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const ITEMS = [
  { href: "/gyakorlas", label: "Gyakorlás" },
  { href: "/kozosseg", label: "Közösség" },
  { href: "/kedves-uzenet", label: "Kedves Üzenet" },
  { href: "/naplo", label: "Belső Tükör" },
  { href: "/ranglista", label: "Ranglista" },
  { href: "/adataim", label: "Adataim" },
];

export async function MemberNav({ active }: { active: string }) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  const items = isAdmin ? [...ITEMS, { href: "/admin", label: "Admin" }] : ITEMS;
  return (
    <nav className="mb-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-gold/25 pb-3 text-sm">
      {items.map((i) => (
        <Link
          key={i.href}
          href={tp(i.href)}
          className={i.href === active ? "text-forest underline decoration-gold underline-offset-8" : "text-ink-soft hover:text-gold"}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
