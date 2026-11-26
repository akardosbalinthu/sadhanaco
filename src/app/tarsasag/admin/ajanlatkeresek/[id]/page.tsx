import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtDateTime, requireAdmin } from "@/lib/admin";
import { BUDGET_LABEL, FORMAT_LABEL, INQUIRY_STATUS_LABEL, LOCATION_LABEL, TIMING_LABEL } from "@/lib/business";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import { deleteInquiry, setInquiryStatus } from "../../program-actions";
import { SubmitButton } from "../../submit-button";
import { Flash, H2, label, smallButton, smallInput, smallPrimary, type SP } from "../../ui";

export const dynamic = "force-dynamic";

export default async function InquiryDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SP }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: r } = await supabase.from("business_inquiries").select("*").eq("id", id).maybeSingle();
  if (!r) notFound();
  const rows: [string, string][] = [
    ["Székhely", r.hq_city],
    ["A cég mérete", `${r.company_size} fő`],
    ["Résztvevők", r.participants ? `${r.participants} fő` : "–"],
    ["Forma", r.formats.map((f) => FORMAT_LABEL[f]).join(", ")],
    ["Helyszín", r.locations.map((l) => LOCATION_LABEL[l]).join(", ")],
    ["Mikorra", TIMING_LABEL[r.timing] ?? r.timing],
    ["Keret", r.budget ? BUDGET_LABEL[r.budget] : "–"],
  ];
  return (
    <div className="space-y-12">
      <Flash sp={sp} />
      <div>
        <Link href={tp("/admin/ajanlatkeresek")} className="text-sm text-ink-soft hover:text-gold">← Ajánlatkérések</Link>
        <h1 className="mt-3 font-serif text-3xl text-forest">{r.company_name}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {r.contact_name}
          {r.contact_role ? `, ${r.contact_role}` : ""} ·{" "}
          <a href={`mailto:${r.email}`} className="underline decoration-gold/50 underline-offset-4">{r.email}</a>
          {r.phone ? ` · ${r.phone}` : ""} · {fmtDateTime(r.created_at)}
        </p>
      </div>
      <GildedCard className="space-y-4 p-6">
        <p className="whitespace-pre-line text-ink">{r.goal}</p>
        <dl className="grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-ink-soft">{k}</dt>
              <dd className="text-forest">{v}</dd>
            </div>
          ))}
        </dl>
      </GildedCard>
      <section>
        <H2>Állapot és jegyzet</H2>
        <form action={setInquiryStatus} className="mt-5 space-y-4">
          <input type="hidden" name="id" value={r.id} />
          <label className="block max-w-xs">
            <span className={label}>Állapot</span>
            <select name="status" defaultValue={r.status} className={`${smallInput} mt-1 w-full`}>
              {Object.entries(INQUIRY_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={label}>Saját jegyzet</span>
            <textarea name="admin_note" rows={4} defaultValue={r.admin_note ?? ""} className={`${smallInput} mt-1 w-full`} />
          </label>
          <SubmitButton className={smallPrimary}>Mentés</SubmitButton>
        </form>
      </section>
      <section className="border-t border-line pt-8">
        <form action={deleteInquiry}>
          <input type="hidden" name="id" value={r.id} />
          <button className={smallButton}>Az ajánlatkérés végleges törlése</button>
        </form>
      </section>
    </div>
  );
}
