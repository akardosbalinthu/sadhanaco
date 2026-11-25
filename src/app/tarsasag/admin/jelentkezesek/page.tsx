import Link from "next/link";
import { fmtDateTime, requireAdmin } from "@/lib/admin";
import { APP_STATUS_LABEL, START_LABEL } from "@/lib/application";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { Empty, Flash, H2, one, type SP } from "../ui";

export const dynamic = "force-dynamic";


export default async function ApplicationsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const filter = one(sp.szuro) || "minositett";
  let q = supabase
    .from("applications")
    .select("id, created_at, full_name, email, start_when, qualified, status, severity, urgency")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter === "minositett") q = q.eq("qualified", true).in("status", ["uj", "foglalt", "konzultalt"]);
  if (filter === "nem") q = q.eq("qualified", false);
  const [{ data: apps }, { data: slots }] = await Promise.all([
    q,
    supabase.from("consultation_slots").select("application_id, starts_at").not("application_id", "is", null),
  ]);
  const slotBy = new Map((slots ?? []).map((s) => [s.application_id, s.starts_at]));
  const tabs = [
    ["minositett", "Folyamatban (azonnal kezdenének)"],
    ["nem", "Nem minősített"],
    ["mind", "Mind"],
  ] as const;

  return (
    <div>
      <Flash sp={sp} />
      <H2>Jelentkezések</H2>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        A felmérést kitöltők. Konzultációt csak az foglalhat, aki „azonnal” kezdene. A programba nem került jelentkezések
        adatai 180 nap után automatikusan törlődnek.
      </p>
      <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {tabs.map(([k, label]) => (
          <Link key={k} href={`${tp("/admin/jelentkezesek")}?szuro=${k}`} className={k === filter ? "text-forest underline decoration-gold underline-offset-8" : "text-ink-soft hover:text-gold"}>
            {label}
          </Link>
        ))}
      </nav>
      {(apps ?? []).length === 0 ? (
        <Empty>Nincs ilyen jelentkezés.</Empty>
      ) : (
        <ul className="mt-6 space-y-3">
          {apps!.map((a) => (
            <li key={a.id}>
              <Link href={tp(`/admin/jelentkezesek/${a.id}`)} className="group block">
                <GildedCard className="flex flex-wrap items-baseline justify-between gap-3 p-5 transition-colors duration-300 group-hover:border-gold/50">
                  <div>
                    <p className="font-serif text-lg text-forest">{a.full_name}</p>
                    <p className="text-xs text-ink-soft">
                      {a.email} · {fmtDateTime(a.created_at)} · {START_LABEL[a.start_when]} · súlyosság {a.severity}/10, sürgősség {a.urgency}/10
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className={a.qualified ? "text-forest" : "text-ink-soft"}>{APP_STATUS_LABEL[a.status]}</p>
                    {slotBy.get(a.id) && <p className="text-xs text-gold">Konzultáció: {fmtDateTime(slotBy.get(a.id))}</p>}
                  </div>
                </GildedCard>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
