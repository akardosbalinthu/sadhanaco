import Link from "next/link";
import { redirect } from "next/navigation";
import { requireMember, ORDER_INFO, type OrderKey } from "@/lib/member";
import { tp } from "@/lib/site";
import { MemberNav } from "@/components/member-nav";
import { OrderCrest } from "@/components/order-crest";
import { GildedCard, PageHeader, linkClass } from "@/components/ornaments";
import { setHidden } from "./actions";

export const metadata = { title: "Ranglista · A Társaság" };
export const dynamic = "force-dynamic";

const PERIODS = [
  { key: "week", label: "Heti" },
  { key: "month", label: "Havi" },
  { key: "quarter", label: "Negyedéves" },
] as const;

type Board = {
  starts_on: string;
  ends_on: string;
  top: { position: number; name: string | null; order: OrderKey | null; rank: string | null; xp: number; is_me: boolean }[];
  me: { position: number | null; xp: number; hidden: boolean };
};

const fmt = (d: string) => new Date(d).toLocaleDateString("hu-HU", { month: "long", day: "numeric" });

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ idoszak?: string }> }) {
  const { supabase, hasAccess } = await requireMember();
  if (!hasAccess) redirect(tp("/gyakorlas"));
  const { idoszak } = await searchParams;
  const period = PERIODS.find((p) => p.key === idoszak)?.key ?? "week";
  const { data } = await supabase.rpc("leaderboard", { p_period: period });
  const b = data as unknown as Board;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <MemberNav active="/ranglista" />
      <PageHeader eyebrow="Az út nyomai" title="Ranglista">
        <p>
          Mindig csak az adott időszakban szerzett XP számít, így minden héten, hónapban és negyedévben tiszta lappal
          indulsz. A negyedéves lista első tíz helyezettje vacsorameghívást kap tőlem.
        </p>
      </PageHeader>

      <div className="mt-8 flex gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`${tp("/ranglista")}?idoszak=${p.key}`}
            className={`rounded-md border px-4 py-1.5 text-sm transition-colors duration-300 ${
              p.key === period ? "border-gold bg-gold-soft/30 text-forest" : "border-line text-ink-soft hover:border-gold/60"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <GildedCard className="mt-6 p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">
          {b ? `${fmt(b.starts_on)} – ${fmt(b.ends_on)}` : ""}
        </p>
        {!b || b.top.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Ebben az időszakban még senki sem szerzett XP-t. Az első küldetés a tiéd lehet.</p>
        ) : (
          <ol className="mt-4 divide-y divide-line">
            {b.top.map((r) => (
              <li key={`${r.position}-${r.name}`} className={`flex items-center gap-4 py-3 ${r.is_me ? "text-forest" : "text-ink"}`}>
                <span className="w-6 text-right font-serif text-lg text-gold">{r.position}.</span>
                <OrderCrest order={r.order} className="h-9 w-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{r.name ?? "Társ"}{r.is_me ? " (te)" : ""}</p>
                  <p className="text-xs text-ink-soft">
                    {r.order ? ORDER_INFO[r.order].single : ""}{r.rank ? ` · ${r.rank}` : ""}
                  </p>
                </div>
                <span className="text-sm text-ink-soft">{r.xp} XP</span>
              </li>
            ))}
          </ol>
        )}
      </GildedCard>

      {b && (
        <GildedCard className="mt-6 p-6 text-sm text-ink-soft">
          <p>
            {b.me.position ? `A te helyed: ${b.me.position}. · ${b.me.xp} XP` : "Ebben az időszakban még nincs XP-d."}
          </p>
          <form action={setHidden} className="mt-4">
            <input type="hidden" name="hidden" value={b.me.hidden ? "false" : "true"} />
            <button className={linkClass}>
              {b.me.hidden ? "Jelenjek meg újra a ranglistán" : "Elrejtem magam a ranglistáról"}
            </button>
          </form>
          {b.me.hidden && <p className="mt-2 text-xs">Most rejtve vagy: mások nem látnak a listán, a vacsorameghívásból viszont nem esel ki.</p>}
        </GildedCard>
      )}
    </main>
  );
}
