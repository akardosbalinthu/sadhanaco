import Link from "next/link";
import { fmtDateTime, requireAdmin } from "@/lib/admin";
import { FORMAT_LABEL, INQUIRY_STATUS_LABEL } from "@/lib/business";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { Empty, Flash, H2, type SP } from "../ui";

export const dynamic = "force-dynamic";

export default async function InquiriesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: rows } = await supabase
    .from("business_inquiries")
    .select("id, created_at, company_name, hq_city, company_size, contact_name, formats, status")
    .order("created_at", { ascending: false })
    .limit(200);
  return (
    <div>
      <Flash sp={sp} />
      <H2>Céges ajánlatkérések</H2>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        A „Cégeknek” oldal űrlapjáról. Az ajánlatkérések egy év után automatikusan törlődnek.
      </p>
      {(rows ?? []).length === 0 ? (
        <Empty>Még nem érkezett ajánlatkérés.</Empty>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows!.map((r) => (
            <li key={r.id}>
              <Link href={tp(`/admin/ajanlatkeresek/${r.id}`)} className="group block">
                <GildedCard className="flex flex-wrap items-baseline justify-between gap-3 p-5 transition-colors duration-300 group-hover:border-gold/50">
                  <div>
                    <p className="font-serif text-lg text-forest">{r.company_name}</p>
                    <p className="text-xs text-ink-soft">
                      {r.hq_city} · {r.company_size} fő · {r.contact_name} · {fmtDateTime(r.created_at)}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">{r.formats.map((f) => FORMAT_LABEL[f]).join(", ")}</p>
                  </div>
                  <p className={`text-sm ${r.status === "uj" ? "text-forest" : "text-ink-soft"}`}>{INQUIRY_STATUS_LABEL[r.status]}</p>
                </GildedCard>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
